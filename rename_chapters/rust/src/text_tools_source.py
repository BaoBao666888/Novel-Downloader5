"""Run legacy Python regex semantics for renumber_chapters and apply_toc_to_content."""

import json
import re
import sys


def normalize_newlines(text):
    return text.replace("\r\n", "\n").replace("\r", "\n")


def line_number_at(text, offset):
    return text.count("\n", 0, offset) + 1


def run_renumber(req):
    content = normalize_newlines(req["content"])
    find_regex = req["find_regex"]
    replace_format = req["replace_format"]
    start_num = int(req["start_num"])

    if "{num}" not in replace_format:
        return {"status": "error", "message": "Cấu trúc thay thế phải chứa '{num}'."}

    changes = []
    counter = start_num

    def repl(match):
        nonlocal counter
        before = match.group(0)
        after = replace_format.format(num=counter)
        changes.append(
            {
                "index": len(changes) + 1,
                "line_number": line_number_at(content, match.start()),
                "before": before,
                "after": after,
            }
        )
        counter += 1
        return after

    try:
        new_text, count = re.subn(find_regex, repl, content, flags=re.MULTILINE)
    except re.error as exc:
        return {"status": "error", "message": f"Lỗi Regex: {exc}"}
    except Exception as exc:
        return {"status": "error", "message": f"Lỗi định dạng thay thế: {exc}"}

    return {
        "status": "ok",
        "new_content": new_text,
        "count": count,
        "toc_entries": None,
        "changes": changes,
    }


def run_apply_toc(req):
    main_content = normalize_newlines(req["main_content"])
    toc_content = normalize_newlines(req["toc_content"])
    toc_regex = req["toc_regex"]
    main_regex = req["main_regex"]
    mode = req["mode"]

    toc = {}
    try:
        for line in toc_content.splitlines():
            if not line.strip():
                continue
            match = re.search(toc_regex, line)
            if match and len(match.groups()) >= 1:
                key = match.group(1).strip()
                toc[key] = line.strip()
    except re.error as exc:
        return {"status": "error", "message": f"Lỗi Regex file mục lục: {exc}"}
    except IndexError:
        return {
            "status": "error",
            "message": "Lỗi Regex file mục lục: Phải có ít nhất một nhóm bắt `(...)`.",
        }

    if not toc:
        return {
            "status": "error",
            "message": "Không tìm thấy chương nào hợp lệ trong file mục lục với Regex đã cho.",
        }

    changes = []

    def replace_func(match):
        raw = match.group(0)
        key_to_lookup = raw.strip()
        full_title = toc.get(key_to_lookup)
        if not full_title:
            return raw
        if mode == "append":
            title_part = full_title[len(key_to_lookup) :].strip()
            replacement = f"{key_to_lookup} {title_part}".strip()
        else:
            replacement = full_title
        if replacement != raw:
            changes.append(
                {
                    "index": len(changes) + 1,
                    "line_number": line_number_at(main_content, match.start()),
                    "before": raw,
                    "after": replacement,
                }
            )
        return replacement

    try:
        new_text, count = re.subn(
            main_regex, replace_func, main_content, flags=re.MULTILINE
        )
    except re.error as exc:
        return {"status": "error", "message": f"Lỗi Regex file truyện chính: {exc}"}

    return {
        "status": "ok",
        "new_content": new_text,
        "count": count,
        "toc_entries": len(toc),
        "changes": changes,
    }


def main():
    req = json.loads(sys.stdin.read())
    action = req.get("action")
    if action == "renumber":
        result = run_renumber(req)
    elif action == "apply_toc":
        result = run_apply_toc(req)
    else:
        result = {"status": "error", "message": f"Không hỗ trợ thao tác: {action}"}
    sys.stdout.write(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
