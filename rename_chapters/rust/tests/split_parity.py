"""Compare the Rust preview CLI to the current Novel Studio Python function."""

import json
import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from app.core.text_ops import TextOperations


class SplitParity(unittest.TestCase):
    def compare(self, path, regex, position=None):
        args = [self.cli, str(path), regex]
        if position is not None:
            args.append(position)
        result = subprocess.run(
            args,
            env={**os.environ, "NOVEL_STUDIO_PYTHON": sys.executable},
            capture_output=True,
            timeout=10,
        )
        stdout = json.loads(result.stdout)
        self.assertEqual(result.stderr, b"")
        actual = [(chunk["text"], chunk["size"]) for chunk in stdout["chunks"]]
        legacy_position = "after" if position is None else position
        expected, error = TextOperations.split_file(path, regex, legacy_position)
        self.assertEqual((actual, stdout["error"]), (expected, error))
        self.assertEqual(result.returncode, int(error is not None))
        return actual

    def test_preview_matches_legacy(self):
        chapter = r"^第\d+章"
        cases = [
            ("mixed_newlines_after", "第1章\r\nMở đầu\r第2章\n结尾", chapter, None),
            ("mixed_newlines_before", "第1章\r\nMở đầu\r第2章\n结尾", chapter, "before"),
            ("empty_position_fallback", "第1章\nNội dung", chapter, ""),
            ("legacy_position_fallback", "第1章\nNội dung", chapter, "other"),
            ("bom_preserved", "\ufeff第1章\nMở\n第2章", chapter, "before"),
            ("zero_width_boundaries", "đ\n🙂", r"\A|(?=\n)|\Z", "after"),
            ("empty_with_match", "", "^$", None),
            ("empty_without_match", "", chapter, None),
            ("match_consumes_everything", "Đọc 🙂", r"\A.*\Z", "after"),
            ("leading_whitespace_piece", " \t\n第1章", chapter, "before"),
            ("python_backreference", "章章\n节\n节节", r"^(章|节)\1$", "after"),
            ("python_lookbehind", "Á章\nA章", r"(?<=Á)章", "before"),
            ("python_unicode_digits", "第١章\n第２章", chapter, "before"),
            ("unicode_preview_limit", "🙂" * 49 + "\ne\u0301\n第1章", chapter, "before"),
            ("literal_escape_and_newline", "a\\n\nb", r"^b", "before"),
            ("unrelated_regex", "Chương 1", chapter, None),
            ("invalid_regex", "abc", "([", None),
        ]
        with TemporaryDirectory() as temp:
            source = Path(temp) / "Tiểu thuyết 小说.txt"
            for name, content, regex, position in cases:
                with self.subTest(name=name):
                    original = content.encode("utf-8")
                    source.write_bytes(original)
                    before = source.stat()
                    self.compare(source, regex, position)
                    self.assertEqual(source.read_bytes(), original)
                    self.assertEqual(source.stat().st_mtime_ns, before.st_mtime_ns)
                    self.assertEqual(list(Path(temp).iterdir()), [source])

    def test_read_errors_match_legacy(self):
        with TemporaryDirectory() as temp:
            folder = Path(temp)
            self.compare(folder / "missing.txt", "(")
            invalid = folder / "invalid.txt"
            invalid.write_bytes(b"prefix\xff")
            self.compare(invalid, r"^prefix")

    def test_known_unicode_and_boundary_output(self):
        with TemporaryDirectory() as temp:
            source = Path(temp) / "fixture.txt"
            source.write_bytes(("🙂" * 49 + "\r\ne\u0301\n第1章").encode("utf-8"))
            self.assertEqual(
                self.compare(source, r"\A|^第\d+章|\Z", "before"),
                [("", 0), ("🙂" * 49 + "\\n", 53), ("第1章", 3), ("", 0)],
            )


if __name__ == "__main__":
    SplitParity.cli = str(Path(sys.argv.pop(1)).resolve())
    unittest.main(verbosity=2)
