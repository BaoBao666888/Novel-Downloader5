from __future__ import annotations

import re

_LEADING_INDENT_RE = re.compile(r"^[\t \u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+")
_TRAILING_SPACE_RE = re.compile(r"[\t \u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+$")


def strip_paragraph_indentation(text: str) -> str:
    value = str(text or "").replace("\r\n", "\n").replace("\r", "\n")
    if not value:
        return ""
    lines: list[str] = []
    for raw_line in value.split("\n"):
        if not raw_line.strip():
            lines.append("")
            continue
        cleaned = _LEADING_INDENT_RE.sub("", raw_line)
        cleaned = _TRAILING_SPACE_RE.sub("", cleaned)
        lines.append(cleaned)
    return "\n".join(lines).strip("\n")
