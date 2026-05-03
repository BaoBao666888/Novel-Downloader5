from __future__ import annotations

import html
import re
from html.parser import HTMLParser
from pathlib import Path


class _HtmlTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._parts: list[str] = []

    def handle_data(self, data: str) -> None:
        if data:
            self._parts.append(data)

    def get_text(self) -> str:
        return "".join(self._parts)


def strip_html_to_text(value: str) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    try:
        parser = _HtmlTextExtractor()
        parser.feed(raw)
        parser.close()
        text = parser.get_text()
    except Exception:
        text = re.sub(r"<[^>]+>", " ", raw)
    text = html.unescape(text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.strip() for line in text.split("\n")]
    return "\n".join(line for line in lines if line)


def normalize_notice_text(value: str) -> str:
    raw = str(value or "")
    if not raw:
        return ""
    raw = raw.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in raw.split("\n")]
    text = "\n".join(lines).strip()
    return re.sub(r"\n{3,}", "\n\n", text)


def read_notice_text_file_if_exists(path: Path) -> str:
    try:
        if not path.exists() or not path.is_file():
            return ""
        raw = path.read_text(encoding="utf-8")
        if path.suffix.lower() in {".html", ".htm"}:
            return normalize_notice_text(strip_html_to_text(raw))
        return normalize_notice_text(raw)
    except Exception:
        return ""


def build_notice_file_candidates(
    configured_values: list[str],
    fallback_names: tuple[str, ...],
    base_dirs: list[Path],
) -> list[Path]:
    candidates: list[Path] = []
    seen: set[str] = set()

    def add(path: Path | None) -> None:
        if path is None:
            return
        try:
            resolved = path.resolve(strict=False)
        except Exception:
            resolved = path
        key = str(resolved)
        if key in seen:
            return
        seen.add(key)
        candidates.append(resolved)

    for raw_value in configured_values:
        value = str(raw_value or "").strip()
        if not value:
            continue
        candidate = Path(value)
        if candidate.is_absolute():
            add(candidate)
            continue
        for base_dir in base_dirs:
            add(base_dir / candidate)

    for name in fallback_names:
        fallback = str(name or "").strip()
        if not fallback:
            continue
        candidate = Path(fallback)
        if candidate.is_absolute():
            add(candidate)
            continue
        for base_dir in base_dirs:
            add(base_dir / candidate)

    return candidates

