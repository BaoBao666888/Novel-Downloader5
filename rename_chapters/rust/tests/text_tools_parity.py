"""Compare Rust text_tools Python adapter output with TextOperations legacy methods."""

import json
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from app.core.text_ops import TextOperations

SCRIPT = Path(__file__).resolve().parents[1] / "src" / "text_tools_source.py"


def run_adapter(payload):
    result = subprocess.run(
        [sys.executable, "-I", "-B", str(SCRIPT)],
        input=json.dumps(payload).encode("utf-8"),
        capture_output=True,
        timeout=10,
        check=True,
    )
    return json.loads(result.stdout.decode("utf-8"))


class TextToolsParity(unittest.TestCase):
    def test_renumber_matches_legacy(self):
        content = "第10章 Mở đầu\nNội dung\n第25章 Giữa\n第99章 Cuối\n"
        expected_text, expected_count, expected_err = TextOperations.renumber_chapters(
            content, r"^第\d+章", "Chương {num}", 1
        )
        actual = run_adapter(
            {
                "action": "renumber",
                "content": content,
                "find_regex": r"^第\d+章",
                "replace_format": "Chương {num}",
                "start_num": 1,
            }
        )
        self.assertIsNone(expected_err)
        self.assertEqual(actual["status"], "ok")
        self.assertEqual(actual["new_content"], expected_text)
        self.assertEqual(actual["count"], expected_count)

    def test_renumber_missing_placeholder_matches_legacy(self):
        _, _, expected_err = TextOperations.renumber_chapters("abc", "a", "fixed", 1)
        actual = run_adapter(
            {
                "action": "renumber",
                "content": "abc",
                "find_regex": "a",
                "replace_format": "fixed",
                "start_num": 1,
            }
        )
        self.assertEqual(actual["status"], "error")
        self.assertEqual(actual["message"], expected_err)

    def test_apply_toc_append_and_replace_match_legacy(self):
        main_content = "第1章\nĐoạn 1\n第2章\nĐoạn 2\n第3章\nĐoạn 3\n"
        toc_content = "第1章 Khởi hành\n\n第2章 Biến cố\n"
        for mode in ("append", "replace"):
            with self.subTest(mode=mode):
                expected_text, expected_count, expected_err = (
                    TextOperations.apply_toc_to_content(
                        main_content, toc_content, r"^(第\d+章)", r"^第\d+章$", mode
                    )
                )
                actual = run_adapter(
                    {
                        "action": "apply_toc",
                        "main_content": main_content,
                        "toc_content": toc_content,
                        "toc_regex": r"^(第\d+章)",
                        "main_regex": r"^第\d+章$",
                        "mode": mode,
                    }
                )
                self.assertIsNone(expected_err)
                self.assertEqual(actual["status"], "ok")
                self.assertEqual(actual["new_content"], expected_text)
                self.assertEqual(actual["count"], expected_count)


if __name__ == "__main__":
    unittest.main(verbosity=2)
