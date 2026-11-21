"""Read files and resolve Python regex offsets for the Rust preview CLI."""

import json
import re
import sys


def split_source(path, pattern, position):
    try:
        # Universal newlines yield the same LF text as TextOperations.split_file.
        with open(path, "r", encoding="utf-8") as source:
            content = source.read()
    except Exception as exc:
        return {"status": "error", "message": f"Không thể đọc file: {exc}"}

    try:
        matches = re.finditer(pattern, content, re.MULTILINE)
        points = [
            match.end() if position == "after" else match.start()
            for match in matches
        ]
    except re.error as exc:
        return {"status": "error", "message": f"Regex không hợp lệ: {exc}"}
    except Exception as exc:
        return {"status": "error", "message": f"Lỗi không xác định: {exc}"}

    return {"status": "matched", "content": content, "points": points}


if __name__ == "__main__":
    path, pattern, *position = sys.argv[1:]
    print(json.dumps(split_source(path, pattern, position[0] if position else "after")))
