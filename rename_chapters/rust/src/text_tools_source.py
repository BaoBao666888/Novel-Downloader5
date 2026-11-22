"""Run Python regex for text workbench previews."""

from bisect import bisect_left
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


def replacement_template(text):
    # Keep native Python backreferences and convert only unescaped $n tokens.
    def expand_token(match):
        if match.group(1) is not None:
            return rf"\g<{match.group(1)}>"
        return "$" if match[0] == "$$" else match[0]

    return re.sub(r"\\[\s\S]|\$\$|\$([0-9]+)", expand_token, text)


def run_replace(req):
    original = req["content"]
    search = req["search"]
    if not search:
        return {"status": "error", "message": "Hãy nhập nội dung cần tìm."}

    use_regex = req["use_regex"]
    replacement = normalize_newlines(req["replacement"])
    flags = 0 if req["match_case"] else re.IGNORECASE
    expression = search if use_regex else re.escape(normalize_newlines(search))
    try:
        pattern = re.compile(expression, flags)
        if req["whole_word"]:
            prefix = re.match(r"(?:\(\?[aiLmsux]+\))*", expression)[0]
            suffix = "\n" if pattern.flags & re.VERBOSE else ""
            pattern = re.compile(rf"{prefix}\b(?:{expression[len(prefix):]}{suffix})\b", flags)
    except (re.error, ValueError) as exc:
        return {"status": "error", "message": f"Regex tìm kiếm không hợp lệ: {exc}"}

    if use_regex:
        replacement = replacement_template(replacement)
        try:
            pattern.sub(replacement, "", count=1)
        except (re.error, IndexError) as exc:
            return {"status": "error", "message": f"Mẫu thay thế không hợp lệ: {exc}"}

    newline = re.compile(r"\r\n?|\n")
    first_break = newline.search(original)
    default_eol = first_break[0] if first_break else "\n"
    crlf_offsets = []

    def normalize_break(match):
        if match[0] == "\r\n":
            crlf_offsets.append(match.start() - len(crlf_offsets))
        return "\n"

    content = newline.sub(normalize_break, original)
    line_breaks = [match.start() for match in re.finditer("\n", content)]

    def original_offset(offset):
        return offset + bisect_left(crlf_offsets, offset)

    changes = []
    parts = []
    previous = 0
    count = 0
    for count, match in enumerate(pattern.finditer(content), 1):
        before = match[0]
        after = normalize_newlines(match.expand(replacement)) if use_regex else replacement
        if before == after:
            continue
        start = original_offset(match.start())
        end = original_offset(match.end())
        parts.append(original[previous:start])
        if "\n" in after:
            matched_break = newline.search(original, start, end)
            eol = matched_break[0] if matched_break else default_eol
            parts.append(after.replace("\n", eol))
        else:
            parts.append(after)
        previous = end
        changes.append({
            "index": len(changes) + 1,
            "line_number": bisect_left(line_breaks, match.start()) + 1,
            "before": before,
            "after": after,
        })

    parts.append(original[previous:])
    return {
        "status": "ok",
        "new_content": "".join(parts),
        "count": count,
        "toc_entries": None,
        "changes": changes,
    }


def main():
    req = json.loads(sys.stdin.read())
    action = req.get("action")
    if action == "renumber":
        result = run_renumber(req)
    elif action == "apply_toc":
        result = run_apply_toc(req)
    elif action == "replace":
        result = run_replace(req)
    else:
        result = {"status": "error", "message": f"Không hỗ trợ thao tác: {action}"}
    sys.stdout.write(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
