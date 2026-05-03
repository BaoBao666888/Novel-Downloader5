from __future__ import annotations

import re
from typing import Any


def normalize_newlines(text: str) -> str:
    value = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    if "\\n" in value:
        value = value.replace("\\r\\n", "\n").replace("\\n", "\n").replace("\\r", "\n")
    value = value.replace("\u2028", "\n").replace("\u2029", "\n")
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def normalize_junk_entries(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        raw_items = value
    elif isinstance(value, tuple):
        raw_items = list(value)
    else:
        text = str(value or "").replace("\r\n", "\n").replace("\r", "\n")
        raw_items = text.split("\n") if text else []
    out: list[dict[str, Any]] = []
    seen: set[tuple[str, bool, bool]] = set()
    for item in raw_items:
        use_regex = False
        ignore_case = False
        if isinstance(item, dict):
            text = normalize_newlines(str(item.get("text") or item.get("line") or "")).strip()
            use_regex = bool(item.get("use_regex") or item.get("regex"))
            ignore_case = bool(item.get("ignore_case") or item.get("case_insensitive"))
        else:
            text = normalize_newlines(str(item or "")).strip()
        key = (text, use_regex, ignore_case)
        if not text or key in seen:
            continue
        seen.add(key)
        out.append({"text": text, "use_regex": use_regex, "ignore_case": ignore_case})
    return out


def normalize_junk_lines(value: Any) -> list[str]:
    return [str(item.get("text") or "").strip() for item in normalize_junk_entries(value) if str(item.get("text") or "").strip()]


def normalize_text_replace_entries(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        raw_items = value
    elif isinstance(value, tuple):
        raw_items = list(value)
    else:
        raw_items = []
    out: list[dict[str, Any]] = []
    seen: set[tuple[str, bool, bool]] = set()
    for item in raw_items:
        if not isinstance(item, dict):
            continue
        source = normalize_newlines(str(item.get("source") or item.get("text") or "")).strip()
        target = normalize_newlines(str(item.get("target") or item.get("replace") or "")).strip()
        use_regex = bool(item.get("use_regex") or item.get("regex"))
        ignore_case = bool(item.get("ignore_case") or item.get("case_insensitive"))
        key = (source, use_regex, ignore_case)
        if not source or key in seen:
            continue
        seen.add(key)
        out.append({
            "source": source,
            "target": target,
            "use_regex": use_regex,
            "ignore_case": ignore_case,
        })
    return out


def apply_junk_lines_to_text(text: str, junk_lines: list[Any] | tuple[Any, ...] | None = None) -> tuple[str, int]:
    content = normalize_newlines(text or "")
    entries = normalize_junk_entries(junk_lines)
    if not content or not entries:
        return content, 0
    removed = 0
    lines = content.split("\n")
    kept_lines: list[str] = []
    compiled_entries: list[tuple[str, re.Pattern[str] | None, bool, bool]] = []
    for entry in entries:
        pattern = str(entry.get("text") or "").strip()
        use_regex = bool(entry.get("use_regex"))
        ignore_case = bool(entry.get("ignore_case"))
        if not pattern:
            continue
        compiled = None
        if use_regex or ignore_case:
            try:
                flags = re.IGNORECASE if ignore_case else 0
                compiled = re.compile(pattern if use_regex else re.escape(pattern), flags)
            except re.error:
                continue
        compiled_entries.append((pattern, compiled, use_regex, ignore_case))

    for raw_line in lines:
        line = str(raw_line or "")
        original_blank = not line.strip()
        line_removed = 0
        for pattern, compiled, use_regex, ignore_case in compiled_entries:
            hits = 0
            if use_regex:
                if compiled is not None:
                    line, hits = compiled.subn("", line)
            elif ignore_case:
                if compiled is not None:
                    line, hits = compiled.subn("", line)
            else:
                hits = line.count(pattern)
                if hits:
                    line = line.replace(pattern, "")
            line_removed += int(hits or 0)
        if line_removed > 0:
            line = re.sub(r"[^\S\n]+$", "", line)
            removed += line_removed
            if (not line.strip()) and (not original_blank):
                continue
        kept_lines.append(line)

    content = normalize_newlines("\n".join(kept_lines))
    return content, removed


def apply_text_replace_entries_to_text(text: str, entries: list[Any] | tuple[Any, ...] | None = None) -> tuple[str, int]:
    content = normalize_newlines(text or "")
    rules = normalize_text_replace_entries(entries)
    if not content or not rules:
        return content, 0
    changed = 0
    for entry in rules:
        source = str(entry.get("source") or "").strip()
        target = normalize_newlines(str(entry.get("target") or ""))
        use_regex = bool(entry.get("use_regex"))
        ignore_case = bool(entry.get("ignore_case"))
        if not source:
            continue
        flags = re.IGNORECASE if ignore_case else 0
        try:
            if use_regex:
                content, hits = re.subn(source, target, content, flags=flags)
            else:
                content, hits = re.subn(re.escape(source), target, content, flags=flags)
        except re.error:
            continue
        changed += int(hits or 0)
    content = normalize_newlines(content)
    return content, changed

