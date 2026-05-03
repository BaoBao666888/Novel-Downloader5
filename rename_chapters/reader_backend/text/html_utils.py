from __future__ import annotations

import re
from html.parser import HTMLParser


BLOCK_TAGS = {
    "p",
    "div",
    "section",
    "article",
    "header",
    "footer",
    "aside",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "li",
    "ul",
    "ol",
    "table",
    "thead",
    "tbody",
    "tr",
    "td",
    "th",
    "blockquote",
    "pre",
}


def localname(tag: str) -> str:
    if not tag:
        return ""
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def resolve_zip_path(base_path: str, href: str) -> str:
    if not href:
        return ""
    href_clean = href.split("#", 1)[0].strip().replace("\\", "/")
    base = str(base_path or "").replace("\\", "/")
    base_dir = base.rsplit("/", 1)[0] if "/" in base else ""
    joined = f"{base_dir}/{href_clean}" if base_dir else href_clean
    parts: list[str] = []
    for part in joined.split("/"):
        if not part or part == ".":
            continue
        if part == "..":
            if parts:
                parts.pop()
            continue
        parts.append(part)
    return "/".join(parts)


class HtmlToTextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self._chunks: list[str] = []

    def handle_starttag(self, tag, attrs):
        name = (tag or "").lower()
        if name == "br":
            self._chunks.append("\n")
        elif name in BLOCK_TAGS:
            self._chunks.append("\n")

    def handle_endtag(self, tag):
        name = (tag or "").lower()
        if name in BLOCK_TAGS:
            self._chunks.append("\n")

    def handle_data(self, data):
        if data:
            self._chunks.append(data)

    def text(self) -> str:
        text = "".join(self._chunks)
        text = text.replace("\xa0", " ")
        text = re.sub(r"[ \t]+\n", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()


def html_to_text(html_content: str) -> str:
    parser = HtmlToTextParser()
    parser.feed(html_content or "")
    return parser.text()


def decode_text_with_fallback(data: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-8", "gb18030"):
        try:
            return data.decode(encoding)
        except Exception:
            continue
    return data.decode("utf-8", errors="replace")

