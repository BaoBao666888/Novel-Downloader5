"""Check the read-only Rust rename plan against the legacy name generator."""

import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from app.core import renamer


class RenameParity(unittest.TestCase):
    def preview(self, folder, *, encoding="utf-8", **options):
        before = self.snapshot(folder)
        result = subprocess.run(
            [self.cli, "rename-preview"],
            input=json.dumps({"folder": str(folder), **options}, ensure_ascii=False).encode(encoding),
            env={**os.environ, "NOVEL_STUDIO_PYTHON": sys.executable},
            capture_output=True,
            timeout=10,
        )
        self.assertEqual(result.returncode, 0, result.stderr.decode("utf-8", "replace"))
        self.assertEqual(result.stderr, b"")
        self.assertEqual(self.snapshot(folder), before)
        return json.loads(result.stdout)

    @staticmethod
    def snapshot(folder):
        entries = {}
        for path in folder.iterdir():
            entries[path.name] = (
                path.read_bytes() if path.is_file() else None,
                path.stat().st_mtime_ns,
            )
        return entries

    def compare(self, folder, **options):
        result = self.preview(folder, **options)
        legacy = [
            renamer.analyze_file(
                str(folder / filename),
                options.get("filename_regexes"),
                options.get("content_regexes"),
            )
            for filename in os.listdir(folder)
            if filename.lower().endswith(".txt")
        ]

        def sort_key(row):
            sources = ("from_content", "from_filename")
            if options.get("sort_by", "content") != "content":
                sources = sources[::-1]
            for source in sources:
                if row[source]["num"] is not None:
                    return row[source]["num"]
            return float("inf")

        legacy.sort(key=sort_key)
        expected = []
        for index, row in enumerate(legacy):
            new_name = renamer.generate_new_name(
                row,
                options.get("strategy", "content_first"),
                options.get("name_format", "第{num}章 {title}.txt"),
                custom_titles=options.get("custom_titles"),
                file_index=index,
            )
            del row["filepath"]
            for source in ("from_content", "from_filename"):
                if row[source]["num"] is not None:
                    row[source]["num"] = str(row[source]["num"])
            expected.append({**row, "proposed_name": new_name})
        actual = [
            {key: value for key, value in row.items() if key not in {"status", "issues"}}
            for row in result
        ]
        self.assertEqual(actual, expected)
        return result

    def test_python_parity(self):
        fixtures = {
            "F 0 Tên từ file.txt": "9: Tiêu đề từ dòng đầu\r\n",
            "F 3 Tiêu đề dự phòng.TXT": "0\r",
            "F 3 Đồng hạng.txt": "0: Nội dung đồng hạng\n",
            "F -10000000000000000000000000000000000000000 Lớn âm.txt": "không có số",
            "F -10 Số âm.txt": "@ 12 Regex tùy chỉnh\n",
            "F 10000000000000000000000000000000000000001 Số lớn.txt": "\ufeff4 Không khớp từ đầu",
            "F 10000000000000000000000000000000000000000 Số lớn hơn i128.txt": "",
            "第十二章 Tên chữ Hán.txt": "第三章 Tựa dòng đầu\n",
            "Tự Đề.txt": "không có số\n",
            "F 6 Lỗi mã hóa.txt": b"4: Header\xff",
            "bỏ qua.md": "3: Không đưa vào danh sách",
        }
        regexes = {
            "filename_regexes": ["", "([", r"^(F) (.+)$", r"^F (-?\d+) (.*)$"],
            "content_regexes": [r"^@ (\d+) (.*)$"],
        }
        cases = [
            {},
            regexes,
            {**regexes, "strategy": "filename_first", "sort_by": "filename"},
            {**regexes, "name_format": "{num + ２}-{num-77}-{title!r}.txt"},
            {**regexes, "name_format": "{num:05d} {{x}} {title:.3s}.txt"},
            {**regexes, "name_format": "{bad}{num - 2}/{title}.txt"},
            {**regexes, "name_format": "{num} / {title}?<>|.txt",
             "custom_titles": [" A? ", "", " B ", " C "], "excluded": list(fixtures)[:1]},
        ]
        with TemporaryDirectory() as temp:
            folder = Path(temp) / "Truyện 小说"
            folder.mkdir()
            for name, content in fixtures.items():
                data = content.encode("utf-8") if isinstance(content, str) else content
                (folder / name).write_bytes(data)
            (folder / "folder.txt").mkdir()
            for options in cases:
                with self.subTest(options=options):
                    self.compare(folder, **options)

    def test_sorted_title_slots_and_zero_fallback(self):
        with TemporaryDirectory() as temp:
            folder = Path(temp)
            (folder / "9 Trước.txt").write_text("0\n", encoding="utf-8")
            (folder / "1 Sau.txt").write_text("2\n", encoding="utf-8")
            rows = self.compare(
                folder,
                custom_titles=["Một", "Hai"],
                excluded=["9 Trước.txt"],
            )
            self.assertEqual(
                [(row["filename"], row["proposed_name"], row["status"]) for row in rows],
                [
                    ("9 Trước.txt", "第9章 Một.txt", "excluded"),
                    ("1 Sau.txt", "第2章 Hai.txt", "proposed"),
                ],
            )

    def test_plan_warnings(self):
        with TemporaryDirectory() as temp:
            folder = Path(temp)
            for name in ("1 A.txt", "2 B.txt", "3 C.txt", "Thiếu số.txt"):
                (folder / name).write_text("", encoding="utf-8")
            (folder / "occupied").mkdir()

            rows = self.compare(folder, name_format="occupied", excluded=["3 C.txt"])
            self.assertEqual(
                [(row["status"], row["issues"]) for row in rows],
                [
                    ("proposed", ["duplicate_target", "target_exists"]),
                    ("proposed", ["duplicate_target", "target_exists"]),
                    ("excluded", []),
                    ("missing_number", []),
                ],
            )

            rows = self.compare(folder, name_format="{num} {title}.txt")
            self.assertEqual([row["status"] for row in rows], ["unchanged"] * 3 + ["missing_number"])
            for invalid in ("", ".", "..", "bad\0name", *(("NUL.txt", "bad.") if os.name == "nt" else ())):
                with self.subTest(invalid=invalid):
                    rows = self.compare(folder, name_format=invalid)
                    self.assertEqual(rows[0]["issues"], ["invalid_target"])

    def test_empty_directory(self):
        with TemporaryDirectory() as temp:
            self.assertEqual(self.compare(Path(temp)), [])
            self.assertEqual(self.preview(Path(temp), encoding="utf-8-sig"), [])


    def apply_plan(self, folder, pairs, *, confirm=True):
        operations = [{"source": source, "target": target} for source, target in pairs]
        return subprocess.run(
            [self.cli, "rename-apply", *(["--confirm"] if confirm else [])],
            input=json.dumps({"folder": str(folder), "operations": operations}).encode("utf-8"),
            capture_output=True,
            timeout=10,
        )

    def test_apply_keeps_original_bytes(self):
        with TemporaryDirectory() as temp:
            folder = Path(temp)
            original = {"1 Cũ.txt": b"\xef\xbb\xbf1 C\xc5\xa9\r\n", "2 Other.TXT": b"test\xff"}
            for name, content in original.items():
                (folder / name).write_bytes(content)
            names = [("1 Cũ.txt", "第1章 新.txt"), ("2 Other.TXT", "第2章 新.txt")]
            result = self.apply_plan(folder, names)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(
                json.loads(result.stdout),
                {"renamed": [{"source": a, "target": b} for a, b in names], "failure": None},
            )
            self.assertEqual(
                {p.name: p.read_bytes() for p in folder.iterdir()},
                {target: original[source] for source, target in names},
            )
            before = self.snapshot(folder)
            repeated = self.apply_plan(folder, names)
            self.assertNotEqual(repeated.returncode, 0)
            self.assertEqual(self.snapshot(folder), before)

    def test_apply_preflight_blocks_whole_batch(self):
        with TemporaryDirectory() as temp:
            folder = Path(temp)
            (folder / "1.txt").write_bytes(b"first source")
            (folder / "2.txt").write_bytes(b"second source")
            (folder / "occupied.txt").write_bytes(b"existing destination")
            (folder / "directory.txt").mkdir()
            before = self.snapshot(folder)
            valid = ("1.txt", "new.txt")
            cases = [
                ("already_exists", [valid, ("2.txt", "occupied.txt")], True),
                ("duplicate", [valid, ("2.txt", "new.txt")], True),
                ("source_duplicate", [valid, ("1.txt", "other.txt")], True),
                ("cycle", [("1.txt", "2.txt"), ("2.txt", "1.txt")], True),
                ("missing_source", [valid, ("missing.txt", "other.txt")], True),
                ("directory_source", [valid, ("directory.txt", "other.txt")], True),
                ("traversal", [valid, ("2.txt", "../other.txt")], True),
                ("without_confirm", [valid], False),
            ]
            if os.name == "nt":
                cases += [
                    ("device_name", [valid, ("2.txt", "NUL.txt")], True),
                    ("case_collision", [valid, ("2.txt", "New.txt")], True),
                    ("alternate_stream", [valid, ("2.txt", "other.txt:stream")], True),
                ]
            for name, pairs, confirm in cases:
                with self.subTest(case=name):
                    result = self.apply_plan(folder, pairs, confirm=confirm)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertEqual(result.stdout, b"")
                    self.assertTrue(result.stderr)
                    self.assertEqual(self.snapshot(folder), before)


    def first_line(self, command, payload, *, confirm=True):
        flags = ["--confirm"] if command == "first-line-apply" and confirm else []
        return subprocess.run(
            [self.cli, command, *flags],
            input=json.dumps(payload).encode("utf-8"),
            capture_output=True,
            timeout=10,
        )

    def first_line_plan(self, folder, replacements):
        before = self.snapshot(folder)
        result = self.first_line(
            "first-line-preview",
            {"folder": str(folder), "edits": [
                {"file": name, "replacement": text} for name, text in replacements.items()
            ]},
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.snapshot(folder), before)
        return json.loads(result.stdout)

    def test_first_line_preserves_bom_newlines_tail_and_backup(self):
        with TemporaryDirectory() as temp:
            folder = Path(temp)
            fixture = {
                "bom.TXT": (b"\xef\xbb\xbfOld\r\nbody\n\xff", b"\xef\xbb\xbfM\xe1\xbb\x9bi\r\nbody\n\xff"),
                "lone-cr.txt": (b"Old\rbody\r\nnext", b"M\xe1\xbb\x9bi\rbody\r\nnext"),
                "lf.txt": (b"Old\n", b"M\xe1\xbb\x9bi\n"),
                "no-eol.txt": (b"Old", b"M\xe1\xbb\x9bi"),
                "empty.txt": (b"", b"M\xe1\xbb\x9bi"),
            }
            for name, (old, _) in fixture.items():
                (folder / name).write_bytes(old)
            unchanged = folder / "unchanged.txt"
            unchanged.write_bytes("Mới".encode("utf-8"))
            plan = self.first_line_plan(folder, {name: "Mới" for name in (*fixture, unchanged.name)})
            for row in plan["edits"]:
                source = (folder / row["file"]).read_bytes()
                self.assertEqual(row["expected_sha256"], hashlib.sha256(source).hexdigest())
            self.assertEqual(plan["edits"][0]["current_line"], "Old")
            result = self.first_line("first-line-apply", plan, confirm=False)
            self.assertNotEqual(result.returncode, 0)
            self.assertTrue(all((folder / n).read_bytes() == old for n, (old, _) in fixture.items()))

            result = self.first_line("first-line-apply", plan)
            self.assertEqual(result.returncode, 0, result.stderr)
            outcome = json.loads(result.stdout)
            self.assertIsNone(outcome["failure"])
            self.assertEqual(outcome["unchanged"], [unchanged.name])
            self.assertEqual(len(outcome["changed"]), len(fixture))
            for row in outcome["changed"]:
                old, new = fixture[row["file"]]
                self.assertEqual((folder / row["file"]).read_bytes(), new)
                self.assertEqual(Path(row["backup"]).read_bytes(), old)
            self.assertEqual(len(list(folder.glob(".novel-studio-backup-*"))), len(fixture))
            # A later edit prevents undo from touching any file in this batch.
            no_eol = folder / "no-eol.txt"
            no_eol.write_bytes(b"external edit")
            before = self.snapshot(folder)
            refused = self.first_line("first-line-apply", outcome["undo"])
            self.assertNotEqual(refused.returncode, 0)
            self.assertEqual(self.snapshot(folder), before)
            no_eol.write_bytes(fixture[no_eol.name][1])

            undone = self.first_line("first-line-apply", outcome["undo"])
            self.assertEqual(undone.returncode, 0, undone.stderr)
            for name, (old, _) in fixture.items():
                self.assertEqual((folder / name).read_bytes(), old)


    def test_first_line_stale_batch_and_bad_input(self):
        with TemporaryDirectory() as temp:
            folder = Path(temp)
            a, b = folder / "a.txt", folder / "b.txt"
            a.write_bytes(b"A\nleft intact")
            b.write_bytes(b"B\noriginal tail")
            plan = self.first_line_plan(folder, {a.name: "New A", b.name: "New B"})
            b.write_bytes(b"B\nchanged tail")
            before = self.snapshot(folder)
            result = self.first_line("first-line-apply", plan)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(result.stdout, b"")
            self.assertEqual(self.snapshot(folder), before)

            a.write_bytes(b"\xffinvalid first line")
            for name, text in ((a.name, "New"), (b.name, "New\nextra"), (b.name, "\ufeffNew"), ("../a.txt", "New")):
                with self.subTest(name=name, text=text):
                    result = self.first_line("first-line-preview", {
                        "folder": str(folder), "edits": [{"file": name, "replacement": text}],
                    })
                    self.assertNotEqual(result.returncode, 0)
                    self.assertEqual(result.stdout, b"")

    def test_first_line_read_only_file_blocks_batch(self):
        with TemporaryDirectory() as temp:
            folder = Path(temp)
            a, b = folder / "a.txt", folder / "b.txt"
            a.write_bytes(b"A\n")
            b.write_bytes(b"B\n")
            original_mode = b.stat().st_mode
            b.chmod(0o444)
            try:
                plan = self.first_line_plan(folder, {a.name: "New A", b.name: "New B"})
                before = self.snapshot(folder)
                result = self.first_line("first-line-apply", plan)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(result.stdout, b"")
                self.assertEqual(self.snapshot(folder), before)
            finally:
                b.chmod(original_mode)

    @unittest.skipUnless(os.name == "nt", "Windows file sharing")
    def test_first_line_replace_failure_preserves_locked_source(self):
        import ctypes
        from ctypes import wintypes

        kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        create = kernel.CreateFileW
        create.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD, wintypes.LPVOID,
                           wintypes.DWORD, wintypes.DWORD, wintypes.HANDLE]
        create.restype = wintypes.HANDLE
        close = kernel.CloseHandle
        close.argtypes = [wintypes.HANDLE]
        with TemporaryDirectory() as temp:
            folder = Path(temp)
            path = folder / "locked.txt"
            path.write_bytes(b"Old\r\nbody")
            first = folder / "first.txt"
            first.write_bytes(b"First\nbody")
            plan = self.first_line_plan(folder, {first.name: "New first", path.name: "New"})
            before = self.snapshot(folder)
            # Open for read and exclude FILE_SHARE_DELETE, allowing preview but blocking replace.
            handle = create(str(path), 0x80000000, 0x00000001 | 0x00000002, None, 3, 0, None)
            self.assertNotEqual(handle, ctypes.c_void_p(-1).value)
            try:
                result = self.first_line("first-line-apply", plan)
                self.assertNotEqual(result.returncode, 0)
                outcome = json.loads(result.stdout)
                self.assertEqual([edit["file"] for edit in outcome["changed"]], [first.name])
                self.assertEqual(outcome["failure"]["file"], path.name)
                self.assertIsNone(outcome["failure"]["recovery_dir"])
                self.assertEqual(path.read_bytes(), b"Old\r\nbody")
                self.assertEqual(first.read_bytes(), b"New first\nbody")
            finally:
                close(handle)
            undone = self.first_line("first-line-apply", outcome["undo"])
            self.assertEqual(undone.returncode, 0, undone.stderr)
            after = self.snapshot(folder)
            self.assertEqual(after[path.name], before[path.name])
            self.assertEqual(after[first.name][0], before[first.name][0])

    def test_rename_can_propose_first_line_for_review(self):
        with TemporaryDirectory() as temp:
            folder = Path(temp)
            source = folder / "1 Old.txt"
            source.write_bytes(b"1 Old\r\nbody")
            (folder / "no number.txt").write_bytes(b"untitled")
            (folder / "2 Excluded.txt").write_bytes(b"2 Excluded\nbody")
            rows = self.preview(
                folder, name_format="{num}: {title}.txt", include_first_line=True,
                excluded=["2 Excluded.txt"],
            )
            self.assertEqual(rows[0]["proposed_name"], "1 Old.txt")
            self.assertEqual(rows[0]["first_line"], "1: Old")
            self.assertEqual(rows[1]["status"], "excluded")
            for row in rows[1:]:
                self.assertNotIn("first_line", row)
            plan = self.first_line_plan(folder, {source.name: rows[0]["first_line"]})
            result = self.first_line("first-line-apply", plan)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(source.read_bytes(), b"1: Old\r\nbody")


if __name__ == "__main__":
    RenameParity.cli = str(Path(sys.argv.pop(1)).resolve())
    unittest.main(verbosity=2)
