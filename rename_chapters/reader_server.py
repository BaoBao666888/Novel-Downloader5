#!/usr/bin/env python3
"""Mini local server for Reader V1 (SQLite + cache + themed web UI)."""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import html
import importlib.util
import io
import json
import mimetypes
import os
import re
import sqlite3
import sys
import threading
import time
import traceback
import uuid
import zipfile
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, quote, unquote, urlparse
from urllib import request as urllib_request
from urllib import error as urllib_error
import xml.etree.ElementTree as ET


ROOT_DIR = Path(__file__).resolve().parent
LOCAL_DIR = ROOT_DIR / "local"
CACHE_DIR = LOCAL_DIR / "reader_cache"
EXPORT_DIR = LOCAL_DIR / "reader_exports"
COVER_DIR = LOCAL_DIR / "reader_covers"
VBOOK_IMAGE_CACHE_DIR = CACHE_DIR / "vbook_image_cache"
DB_PATH = LOCAL_DIR / "reader_library.db"
DEFAULT_UI_DIR = ROOT_DIR / "reader_ui"
APP_CONFIG_PATH = ROOT_DIR / "config.json"
APP_READER_CONFIG_PATH = ROOT_DIR / "local" / "reader.config.json"
APP_STATE_THEME_ACTIVE_KEY = "theme.active"
APP_STATE_NAME_SET_STATE_KEY = "reader.name_set_state"
APP_STATE_BOOK_VP_SET_KEY_PREFIX = "reader.book_vp_set"
COMIC_CACHE_PREFIX = "__READER_COMIC_JSON__:"

# Ép MIME chuẩn cho JS module trên Windows/registry lạ để tránh trang trắng
# (module script bị chặn nếu server trả text/plain).
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/javascript", ".mjs")
mimetypes.add_type("text/css", ".css")


def runtime_base_dir() -> Path:
    """Base dir để resolve path tương đối (config/tools/local).

    Khi chạy dưới app Novel Studio, server được start với `cwd=BASE_DIR`, nên base là `Path.cwd()`.
    Khi chạy dev trực tiếp ở repo root, base cũng là repo root.
    """
    try:
        return Path.cwd().resolve()
    except Exception:
        return ROOT_DIR


def resolve_path_from_base(raw: str | Path, base_dir: Path) -> Path:
    raw_s = str(raw or "").strip()
    if not raw_s:
        return base_dir
    p = Path(raw_s)
    if p.is_absolute():
        return p
    try:
        return (base_dir / p).resolve(strict=False)
    except Exception:
        return base_dir / p


def resolve_existing_path(raw: str | Path, *bases: Path) -> Path:
    raw_s = str(raw or "").strip()
    valid_bases = [b for b in bases if isinstance(b, Path)]
    fallback_base = valid_bases[0] if valid_bases else ROOT_DIR
    if not raw_s:
        return fallback_base

    p = Path(raw_s)
    if p.is_absolute():
        return p

    candidates: list[Path] = []
    for base in valid_bases:
        try:
            candidates.append((base / p).resolve(strict=False))
        except Exception:
            candidates.append(base / p)

    for candidate in candidates:
        if candidate.exists():
            return candidate
    if candidates:
        return candidates[0]
    return p


def set_local_dirs(local_dir: Path) -> None:
    """Override local/cache/export/cover dirs theo vị trí DB để ND5 + Reader dùng chung."""
    global LOCAL_DIR, CACHE_DIR, EXPORT_DIR, COVER_DIR, VBOOK_IMAGE_CACHE_DIR, DB_PATH
    LOCAL_DIR = local_dir
    CACHE_DIR = LOCAL_DIR / "reader_cache"
    EXPORT_DIR = LOCAL_DIR / "reader_exports"
    COVER_DIR = LOCAL_DIR / "reader_covers"
    VBOOK_IMAGE_CACHE_DIR = CACHE_DIR / "vbook_image_cache"
    DB_PATH = LOCAL_DIR / "reader_library.db"


def _load_translator_module():
    module_path = ROOT_DIR / "app" / "core" / "translator.py"
    spec = importlib.util.spec_from_file_location("reader_translator_logic", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Không thể nạp module translator: {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[attr-defined]
    return module


try:
    # Ưu tiên import bình thường để PyInstaller có thể bundle vào `reader_server.exe`.
    from app.core import translator as translator_logic  # type: ignore
except Exception:
    translator_logic = _load_translator_module()


def _load_vbook_module():
    module_path = ROOT_DIR / "app" / "core" / "vbook_ext.py"
    spec = importlib.util.spec_from_file_location("reader_vbook_ext", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Không thể nạp module vbook_ext: {module_path}")
    module = importlib.util.module_from_spec(spec)
    import sys

    sys.modules[spec.name] = module
    spec.loader.exec_module(module)  # type: ignore[attr-defined]
    return module


try:
    from app.core import vbook_ext  # type: ignore
except Exception:
    vbook_ext = _load_vbook_module()


def _load_vbook_local_translate_module():
    module_path = ROOT_DIR / "app" / "core" / "vbook_local_translate.py"
    spec = importlib.util.spec_from_file_location("reader_vbook_local_translate", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load local translate module: {module_path}")
    module = importlib.util.module_from_spec(spec)
    import sys

    sys.modules[spec.name] = module
    spec.loader.exec_module(module)  # type: ignore[attr-defined]
    return module


try:
    from app.core import vbook_local_translate  # type: ignore
except Exception:
    vbook_local_translate = _load_vbook_local_translate_module()


THEME_PRESETS: list[dict[str, Any]] = [
    {
        "id": "sao_dem",
        "name": "Sao đêm",
        "description": "Nền tối, ánh sao lấp lánh nhẹ.",
        "tokens": {
            "bg": "#090a1a",
            "bg2": "#111433",
            "surface": "#11162d",
            "surface_alt": "#151f42",
            "text": "#eaf2ff",
            "muted": "#8ca3d4",
            "accent": "#77b8ff",
            "glow": "#9fd0ff",
            "particle": "#ffffff",
        },
        "effect": "stars",
    },
    {
        "id": "hong_phan",
        "name": "Hồng phấn",
        "description": "Tông pastel mềm, glow dịu mắt.",
        "tokens": {
            "bg": "#2d1022",
            "bg2": "#4a1f3b",
            "surface": "#4f2242",
            "surface_alt": "#613053",
            "text": "#ffeef8",
            "muted": "#f3bdd8",
            "accent": "#ff7fba",
            "glow": "#ff9bd0",
            "particle": "#ffd3ea",
        },
        "effect": "sparkle",
    },
    {
        "id": "xanh_da_troi",
        "name": "Xanh da trời",
        "description": "Mát mắt, gradient trong trẻo.",
        "tokens": {
            "bg": "#092039",
            "bg2": "#0e4d77",
            "surface": "#0f3858",
            "surface_alt": "#15527a",
            "text": "#eaf8ff",
            "muted": "#a8d5ee",
            "accent": "#69d3ff",
            "glow": "#90e4ff",
            "particle": "#def8ff",
        },
        "effect": "bubbles",
    },
    {
        "id": "la_vang",
        "name": "Lá vàng",
        "description": "Ấm áp mùa thu, hạt vàng bay nhẹ.",
        "tokens": {
            "bg": "#2c1707",
            "bg2": "#673512",
            "surface": "#553018",
            "surface_alt": "#70401f",
            "text": "#fff3de",
            "muted": "#e7c595",
            "accent": "#ffbe55",
            "glow": "#ffd27a",
            "particle": "#ffe6b8",
        },
        "effect": "leaves",
    },
    {
        "id": "tuyet_trang",
        "name": "Tuyết trắng",
        "description": "Nền sáng lạnh, tuyết mịn rơi nhẹ.",
        "tokens": {
            "bg": "#e4edf9",
            "bg2": "#ffffff",
            "surface": "#f7fbff",
            "surface_alt": "#ecf4ff",
            "text": "#102440",
            "muted": "#4b6382",
            "accent": "#6ab7ff",
            "glow": "#9bcfff",
            "particle": "#ffffff",
        },
        "effect": "snow",
    },
]


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


CHAPTER_HEADING_REGEX = re.compile(
    r"^(?:\s*)(?:Chương|CHƯƠNG|Chuong|CHUONG|Chapter|CHAPTER|卷|第\s*[\d一二三四五六七八九十百千零]+\s*章)[^\n]{0,120}$",
    re.MULTILINE,
)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def utc_now_ts() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def normalize_host(value: str) -> str:
    raw = str(value or "").strip().lower()
    if not raw:
        return ""
    if "://" not in raw:
        raw = "https://" + raw
    try:
        parsed = urlparse(raw)
        host = (parsed.hostname or "").strip().lower()
    except Exception:
        host = ""
    return host


def host_aliases(host: str) -> list[str]:
    raw = normalize_host(host)
    if not raw:
        return []
    aliases: list[str] = []
    for item in (raw, raw.lstrip("www."), "www." + raw.lstrip("www.")):
        val = str(item or "").strip().lower()
        if val and val not in aliases:
            aliases.append(val)
    return aliases


def host_matches_domain(host: str, domain: str) -> bool:
    h = str(host or "").strip().lower().lstrip(".")
    d = str(domain or "").strip().lower().lstrip(".")
    if not h or not d:
        return False
    return h == d or h.endswith("." + d)


def hash_text(value: str) -> str:
    return hashlib.sha1(value.encode("utf-8", errors="ignore")).hexdigest()


def quote_url_path(value: str) -> str:
    return quote(value or "", safe="")


def build_vbook_image_proxy_path(image_url: str, *, plugin_id: str = "", referer: str = "") -> str:
    url = str(image_url or "").strip()
    if not url:
        return ""
    if not (url.startswith("http://") or url.startswith("https://")):
        return url
    parts = [f"url={quote_url_path(url)}"]
    pid = str(plugin_id or "").strip()
    if pid:
        parts.append(f"plugin_id={quote_url_path(pid)}")
    ref = str(referer or "").strip()
    if ref:
        parts.append(f"referer={quote_url_path(ref)}")
    return "/media/vbook-image?" + "&".join(parts)


def build_vbook_plugin_icon_path(plugin_id: str) -> str:
    pid = str(plugin_id or "").strip()
    if not pid:
        return ""
    return f"/media/vbook-plugin-icon?plugin_id={quote_url_path(pid)}"


def normalize_lang_source(value: str) -> str:
    raw = str(value or "").strip().lower()
    if not raw:
        return ""
    raw = raw.replace("_", "-")
    return raw.split("-", 1)[0]


def is_lang_zh(value: str) -> bool:
    return normalize_lang_source(value) == "zh"


def is_book_comic(book: dict[str, Any] | None) -> bool:
    source_type = str((book or {}).get("source_type") or "").strip().lower()
    return source_type in {"comic", "vbook_comic", "vbook_session_comic"}


def book_supports_translation(book: dict[str, Any] | None) -> bool:
    if not book:
        return False
    if is_book_comic(book):
        return False
    return is_lang_zh(str(book.get("lang_source") or ""))


def encode_comic_payload(images: list[str]) -> str:
    data = {"kind": "images", "images": [str(x).strip() for x in images if str(x).strip()]}
    return COMIC_CACHE_PREFIX + json.dumps(data, ensure_ascii=False)


def decode_comic_payload(text: str) -> dict[str, Any] | None:
    raw = str(text or "")
    if not raw.startswith(COMIC_CACHE_PREFIX):
        return None
    body = raw[len(COMIC_CACHE_PREFIX) :].strip()
    if not body:
        return {"kind": "images", "images": []}
    try:
        payload = json.loads(body)
    except Exception:
        return {"kind": "images", "images": []}
    if not isinstance(payload, dict):
        return {"kind": "images", "images": []}
    images = payload.get("images")
    if not isinstance(images, list):
        images = []
    payload["images"] = [str(x).strip() for x in images if str(x).strip()]
    payload["kind"] = "images"
    return payload


def ensure_dirs() -> None:
    LOCAL_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    COVER_DIR.mkdir(parents=True, exist_ok=True)
    VBOOK_IMAGE_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def load_app_config() -> dict[str, Any]:
    # Ưu tiên config Reader riêng. Nếu không có thì fallback config chung.
    def _read_json(path: Path) -> dict[str, Any] | None:
        try:
            if path.exists():
                parsed = json.loads(path.read_text(encoding="utf-8"))
                if isinstance(parsed, dict):
                    return parsed
        except Exception:
            return None
        return None

    env_path = (os.environ.get("READER_APP_CONFIG") or "").strip()
    if env_path:
        env_cfg = _read_json(Path(env_path))
        if env_cfg is not None:
            return env_cfg

    base = runtime_base_dir()
    global_cfg: dict[str, Any] = {}
    for p in (base / "config.json", APP_CONFIG_PATH):
        parsed = _read_json(p)
        if parsed is not None:
            global_cfg = parsed
            break

    legacy_reader_cfg = APP_READER_CONFIG_PATH.with_suffix(".js")
    for p in (
        base / "local" / "reader.config.json",
        APP_READER_CONFIG_PATH,
        base / "local" / "reader.config.js",
        legacy_reader_cfg,
    ):
        parsed = _read_json(p)
        if parsed is not None:
            merged = dict(global_cfg)
            merged.update(parsed)
            return merged
    return global_cfg


def resolve_app_config_path() -> Path:
    env_path = (os.environ.get("READER_APP_CONFIG") or "").strip()
    if env_path:
        return Path(env_path)
    base = runtime_base_dir()
    base_reader_cfg = base / "local" / "reader.config.json"
    if base_reader_cfg.exists() or base == ROOT_DIR:
        return base_reader_cfg
    if APP_READER_CONFIG_PATH.exists():
        return APP_READER_CONFIG_PATH
    return base_reader_cfg


def save_app_config(config: dict[str, Any]) -> Path:
    target = resolve_app_config_path()
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_suffix(target.suffix + ".tmp")
    tmp.write_text(
        json.dumps(config or {}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    tmp.replace(target)
    return target


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
    base = Path(base_path).as_posix()
    base_dir = base.rsplit("/", 1)[0] if "/" in base else ""
    joined = f"{base_dir}/{href_clean}" if base_dir else href_clean
    parts = []
    for p in joined.split("/"):
        if not p or p == ".":
            continue
        if p == "..":
            if parts:
                parts.pop()
            continue
        parts.append(p)
    return "/".join(parts)


class HtmlToTextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self._chunks: list[str] = []

    def handle_starttag(self, tag, attrs):
        t = (tag or "").lower()
        if t == "br":
            self._chunks.append("\n")
        elif t in BLOCK_TAGS:
            self._chunks.append("\n")

    def handle_endtag(self, tag):
        t = (tag or "").lower()
        if t in BLOCK_TAGS:
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


def normalize_newlines(text: str) -> str:
    value = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    # Server dịch đôi lúc trả literal "\\n", chuyển về newline thật.
    if "\\n" in value:
        value = value.replace("\\r\\n", "\n").replace("\\n", "\n").replace("\\r", "\n")
    value = value.replace("\u2028", "\n").replace("\u2029", "\n")
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def normalize_vbook_display_text(text: str, *, single_line: bool = False) -> str:
    """Chuẩn hóa text metadata vBook trước khi trả UI.

    - decode HTML entities (`&quot;`, `&#...`, `&hellip;`, ...)
    - đổi `<br>`, `</br>` về newline
    - bỏ thẻ HTML còn sót
    - co cụm xuống dòng dư về 1 lần
    """
    value = str(text or "")
    if not value:
        return ""
    value = html.unescape(value)
    value = re.sub(r"(?is)<\s*/?\s*br\s*/?\s*>", "\n", value)
    if "<" in value and ">" in value and re.search(r"(?is)</?[a-z][^>]*>", value):
        value = html_to_text(value)
    value = normalize_newlines(value)
    value = value.replace("\xa0", " ")
    value = re.sub(r"[ \t]+\n", "\n", value)
    value = re.sub(r"\n[ \t]+", "\n", value)
    value = re.sub(r"[ \t]{2,}", " ", value)
    value = re.sub(r"\n{2,}", "\n", value)
    if single_line:
        value = re.sub(r"\s*\n+\s*", " ", value)
    return value.strip()


_VI_PUNCT_REPLACEMENTS = {
    "，": ",",
    "、": ",",
    "。": ".",
    "！": "!",
    "？": "?",
    "：": ":",
    "；": ";",
    "（": "(",
    "）": ")",
    "「": "“",
    "」": "”",
    "『": "“",
    "』": "”",
}


def strip_edge_punctuation(text: str) -> str:
    value = str(text or "")
    if not value:
        return ""
    # Chỉ bỏ dấu câu/space ở mép để map name gọn, giữ nguyên nội dung lõi.
    value = re.sub(r"^[\s\.,;:!?…，。！？；：、“”\"'‘’()\[\]{}<>《》「」『』\-—]+", "", value)
    value = re.sub(r"[\s\.,;:!?…，。！？；：、“”\"'‘’()\[\]{}<>《》「」『』\-—]+$", "", value)
    return value.strip()


NAME_SPLIT_DELIMITER_RE = re.compile(r"[\n\r,，、。！？!?；;：:]")


def contains_name_split_delimiter(text: str) -> bool:
    return bool(NAME_SPLIT_DELIMITER_RE.search(str(text or "")))


def normalize_for_compare(text: str) -> str:
    value = (text or "").lower().strip()
    if not value:
        return ""
    value = re.sub(r"[\s\W_]+", "", value, flags=re.UNICODE)
    return value


def normalize_vi_punctuation(text: str) -> str:
    value = text or ""
    if not value:
        return ""
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    if "\\n" in value:
        value = value.replace("\\r\\n", "\n").replace("\\n", "\n").replace("\\r", "\n")
    value = value.replace("\u2028", "\n").replace("\u2029", "\n")
    for src, dst in _VI_PUNCT_REPLACEMENTS.items():
        value = value.replace(src, dst)
    value = value.replace("……", "…")
    value = re.sub(r"\s+([,.;:!?…，。！？；：、])", r"\1", value)
    value = re.sub(r"\s+([”’)\]}>»])", r"\1", value)
    value = re.sub(r"([(\[“‘])\s+", r"\1", value)
    value = re.sub(r"([,.;:!?])(?![\s\n,.;:!?…，。！？；：、”’)\]}>»\"'])", r"\1 ", value)
    value = re.sub(r"(…)(?![\s\n,.;:!?…，。！？；：、”’)\]}>»\"'])", r"\1 ", value)
    value = re.sub(r"[ \t]+\n", "\n", value)
    value = re.sub(r"\n[ \t]+", "\n", value)
    value = re.sub(r" {2,}", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def smart_capitalize_vi(text: str) -> str:
    value = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    if "\\n" in value:
        value = value.replace("\\r\\n", "\n").replace("\\n", "\n").replace("\\r", "\n")
    value = value.replace("\u2028", "\n").replace("\u2029", "\n")
    if not value:
        return value
    chars = list(value)
    cap_next = True
    sentence_breakers = {".", "!", "?", ";", "…", "\n", "。", "！", "？", ":"}
    skip_when_cap = {" ", "\t", "\"", "'", "“", "”", "‘", "’", "(", "[", "{", "<", "-", "*", "•", ">", "»", "«"}
    for i, ch in enumerate(chars):
        if cap_next:
            if ch.isalpha():
                chars[i] = ch.upper()
                cap_next = False
                continue
            if ch.isdigit():
                # Nếu đầu câu là số thì không ép viết hoa từ ngay sau số.
                cap_next = False
                continue
            if ch in skip_when_cap or ch.isspace():
                continue
            cap_next = False
        if ch in sentence_breakers:
            cap_next = True
    return "".join(chars).strip()


def normalize_vi_display_text(text: str) -> str:
    value = normalize_vi_punctuation(normalize_newlines(text or ""))
    if not value:
        return ""
    return smart_capitalize_vi(value)


def capitalize_word_vi(word: str) -> str:
    value = str(word or "").strip()
    if not value:
        return ""
    if value[0].isdigit():
        return value
    return value[:1].upper() + value[1:].lower()


def lowercase_word_vi(word: str) -> str:
    value = str(word or "").strip()
    if not value:
        return ""
    if value[0].isdigit():
        return value
    return value.lower()


def lowercase_first_alpha(text: str) -> str:
    value = str(text or "")
    if not value:
        return ""
    chars = list(value)
    for i, ch in enumerate(chars):
        if ch.isalpha():
            chars[i] = ch.lower()
            break
    return "".join(chars)


def build_incremental_hv_suggestions(source_text: str, hv_text: str) -> list[dict[str, str]]:
    source_raw = normalize_newlines(source_text or "").strip()
    hv_raw = normalize_newlines(hv_text or "").strip()
    if not source_raw or not hv_raw:
        return []
    source_cjk = "".join(ch for ch in source_raw if re.search(r"[\u3400-\u9fff]", ch))
    hv_words_raw = [x for x in re.split(r"\s+", hv_raw) if x.strip()]
    if not source_cjk or not hv_words_raw:
        return []
    hv_words = [lowercase_word_vi(x) for x in hv_words_raw]

    variants: list[str] = []
    variants.append(" ".join(hv_words).strip())
    for idx in range(len(hv_words)):
        row_words: list[str] = []
        for w_idx, w in enumerate(hv_words):
            if w_idx <= idx:
                row_words.append(capitalize_word_vi(w))
            else:
                row_words.append(lowercase_word_vi(w))
        variants.append(" ".join(row_words).strip())

    dedup: list[str] = []
    seen: set[str] = set()
    for v in variants:
        key = v.strip()
        if not key or key in seen:
            continue
        seen.add(key)
        dedup.append(key)

    return [
        {
            "source_text": source_cjk,
            "han_viet": line,
        }
        for line in dedup
    ]


def split_multi_translation_values(raw_value: str) -> list[str]:
    value = normalize_newlines(raw_value or "").strip()
    if not value:
        return []
    parts = [x.strip() for x in re.split(r"[\\/|]+", value) if x.strip()]
    if not parts:
        return []
    out: list[str] = []
    seen: set[str] = set()
    for item in parts:
        key = normalize_for_compare(item)
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def _collect_dict_suggestion_rows(
    source_cjk: str,
    mapping: dict[str, str],
    *,
    origin: str,
    base_score: int,
) -> list[dict[str, Any]]:
    if not source_cjk or not mapping:
        return []
    rows: list[dict[str, Any]] = []
    seen_pairs: set[tuple[str, str]] = set()

    def add_for_key(candidate_key: str) -> None:
        if not candidate_key:
            return
        raw_value = mapping.get(candidate_key)
        if raw_value is None:
            return
        values = split_multi_translation_values(str(raw_value))
        if not values:
            return
        full_match_bonus = 28 if candidate_key == source_cjk else 0
        score_base = base_score + full_match_bonus + len(candidate_key)
        for idx, target in enumerate(values):
            pair = (candidate_key, target)
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)
            rows.append(
                {
                    "source_text": candidate_key,
                    "target_text": target,
                    "origin": origin,
                    "score": score_base - idx,
                }
            )

    add_for_key(source_cjk)
    source_len = len(source_cjk)
    if source_len < 2:
        return rows

    # Quét cụm con theo độ dài giảm dần để lấy gợi ý "cụm nhỏ nhất có ý nghĩa".
    # Chỉ quét tối đa 14 ký tự để tránh nặng với input dài bất thường.
    cap_len = min(source_len, 14)
    for seg_len in range(cap_len, 1, -1):
        for start in range(0, source_len - seg_len + 1):
            segment = source_cjk[start:start + seg_len]
            add_for_key(segment)
            if len(rows) >= 120:
                return rows
    return rows


def build_name_right_suggestions(
    source_text: str,
    *,
    hv_text: str = "",
    personal_name: dict[str, str] | None = None,
    personal_vp: dict[str, str] | None = None,
    global_name: dict[str, str] | None = None,
    global_vp: dict[str, str] | None = None,
    bundle: Any = None,
    prefer_kind: str = "name",
    prefer_scope: str = "book",
) -> list[dict[str, Any]]:
    source_cjk = "".join(ch for ch in normalize_newlines(source_text or "") if re.search(r"[\u3400-\u9fff]", ch))
    if not source_cjk:
        return []

    rows: list[dict[str, Any]] = []
    prefer_kind = "vp" if str(prefer_kind or "").strip().lower() == "vp" else "name"
    prefer_scope = "global" if str(prefer_scope or "").strip().lower() == "global" else "book"
    boost_book_name = 18 if prefer_scope == "book" and prefer_kind == "name" else 0
    boost_book_vp = 18 if prefer_scope == "book" and prefer_kind == "vp" else 0
    boost_global_name = 18 if prefer_scope == "global" and prefer_kind == "name" else 0
    boost_global_vp = 18 if prefer_scope == "global" and prefer_kind == "vp" else 0

    rows.extend(
        _collect_dict_suggestion_rows(
            source_cjk,
            normalize_name_set(personal_name),
            origin="Name riêng",
            base_score=160 + boost_book_name,
        )
    )
    rows.extend(
        _collect_dict_suggestion_rows(
            source_cjk,
            normalize_name_set(personal_vp),
            origin="VP riêng",
            base_score=148 + boost_book_vp,
        )
    )
    rows.extend(
        _collect_dict_suggestion_rows(
            source_cjk,
            normalize_name_set(global_name),
            origin="Name chung",
            base_score=138 + boost_global_name,
        )
    )
    rows.extend(
        _collect_dict_suggestion_rows(
            source_cjk,
            normalize_name_set(global_vp),
            origin="VP chung",
            base_score=128 + boost_global_vp,
        )
    )
    if bundle is not None:
        rows.extend(
            _collect_dict_suggestion_rows(
                source_cjk,
                normalize_name_set(getattr(bundle, "name_general", {})),
                origin="Name base",
                base_score=114,
            )
        )
        rows.extend(
            _collect_dict_suggestion_rows(
                source_cjk,
                normalize_name_set(getattr(bundle, "vp_general", {})),
                origin="VP base",
                base_score=102,
            )
        )

    hv_rows = build_incremental_hv_suggestions(source_cjk, hv_text or "")
    for idx, row in enumerate(hv_rows):
        target = str(row.get("han_viet") or "").strip()
        if not target:
            continue
        rows.append(
            {
                "source_text": source_cjk,
                "target_text": target,
                "origin": "Hán Việt",
                "score": 90 - idx,
            }
        )

    if not rows:
        return []

    dedup: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in sorted(
        rows,
        key=lambda x: (
            int(x.get("score") or 0),
            len(str(x.get("source_text") or "")),
            -len(str(x.get("target_text") or "")),
        ),
        reverse=True,
    ):
        source_key = normalize_for_compare(str(row.get("source_text") or ""))
        target_key = normalize_for_compare(str(row.get("target_text") or ""))
        if not source_key or not target_key:
            continue
        hash_key = f"{source_key}|{target_key}"
        if hash_key in seen:
            continue
        seen.add(hash_key)
        dedup.append(row)
        if len(dedup) >= 40:
            break

    for idx, row in enumerate(dedup, start=1):
        row["index"] = idx
    return dedup


NAME_PLACEHOLDER_PREFIX = "__TM_NAME_"


def normalize_name_set(name_set: Any) -> dict[str, str]:
    output: dict[str, str] = {}
    if not isinstance(name_set, dict):
        return output
    for raw_key, raw_value in name_set.items():
        key = str(raw_key or "").strip()
        value = str(raw_value or "").strip()
        if key and value:
            output[key] = value
    return output


def normalize_name_sets_collection(name_sets: Any) -> dict[str, dict[str, str]]:
    if not isinstance(name_sets, dict):
        return {"Mặc định": {}}
    cleaned: dict[str, dict[str, str]] = {}
    for raw_set_name, raw_set_data in name_sets.items():
        set_name = str(raw_set_name or "").strip() or "Mặc định"
        cleaned[set_name] = normalize_name_set(raw_set_data)
    if not cleaned:
        cleaned["Mặc định"] = {}
    return cleaned


def collect_name_hits(text: str, name_set: dict[str, str]) -> list[dict[str, Any]]:
    source = text or ""
    if not source:
        return []
    keys = sorted((k for k in name_set.keys() if k), key=len, reverse=True)
    if not keys:
        return []
    used = [False] * len(source)
    hits: list[dict[str, Any]] = []
    for key in keys:
        start = 0
        while True:
            idx = source.find(key, start)
            if idx < 0:
                break
            end = idx + len(key)
            if not any(used[idx:end]):
                for i in range(idx, end):
                    used[i] = True
                hits.append(
                    {
                        "start": idx,
                        "end": end,
                        "source": key,
                        "target": name_set.get(key, ""),
                    }
                )
            start = idx + 1
    hits.sort(key=lambda x: (int(x["start"]), -len(str(x["source"]))))
    return hits


def apply_name_placeholders(text: str, name_set: dict[str, str]) -> tuple[str, dict[str, dict[str, str]], list[dict[str, Any]]]:
    source = text or ""
    clean_set = normalize_name_set(name_set)
    if not clean_set:
        return source, {}, []

    keys = sorted(clean_set.keys(), key=len, reverse=True)
    placeholder_by_name: dict[str, str] = {}
    placeholder_map: dict[str, dict[str, str]] = {}
    output = source

    for key in keys:
        if key not in output:
            continue
        placeholder = placeholder_by_name.get(key)
        if not placeholder:
            placeholder = f"{NAME_PLACEHOLDER_PREFIX}{len(placeholder_map)}__"
            placeholder_by_name[key] = placeholder
            placeholder_map[placeholder] = {"source": key, "target": clean_set[key]}
        output = output.replace(key, placeholder)

    return output, placeholder_map, collect_name_hits(source, clean_set)


def restore_name_placeholders(text: str, placeholder_map: dict[str, dict[str, str]]) -> str:
    result = text or ""
    if not result or not placeholder_map:
        return result

    # Nếu translator giữ 2 placeholder liền nhau, chèn 1 khoảng trắng để tránh dính chùm name.
    # Ví dụ: __TM_NAME_0____TM_NAME_1__ -> __TM_NAME_0__ __TM_NAME_1__
    result = re.sub(
        rf"({re.escape(NAME_PLACEHOLDER_PREFIX)}\d+__)(?={re.escape(NAME_PLACEHOLDER_PREFIX)}\d+__)",
        r"\1 ",
        result,
    )

    for placeholder, data in placeholder_map.items():
        result = re.sub(re.escape(placeholder), str(data.get("target") or ""), result)

    result = re.sub(r"\s+([,.;!?\)]|”|’|:)", r"\1", result)
    result = re.sub(r"([\(\[“‘])\s+", r"\1", result)
    result = re.sub(r"\s{2,}", " ", result)
    return result.strip()


def local_translate_preserve_placeholders(
    processed_text: str, hv_map: dict[str, Any], placeholder_map: dict[str, dict[str, str]]
) -> str:
    source = processed_text or ""
    if not source:
        return ""
    if not placeholder_map:
        hv = translator_logic.build_hanviet_from_map(source, hv_map)
        return hv or source

    placeholders = sorted(placeholder_map.keys(), key=len, reverse=True)
    if not placeholders:
        hv = translator_logic.build_hanviet_from_map(source, hv_map)
        return hv or source

    placeholder_regex = re.compile("|".join(re.escape(x) for x in placeholders))
    parts: list[str] = []
    last_pos = 0

    for match in placeholder_regex.finditer(source):
        if match.start() > last_pos:
            segment = source[last_pos : match.start()]
            hv = translator_logic.build_hanviet_from_map(segment, hv_map) or segment
            hv = hv.strip()
            if hv:
                parts.append(hv)
        parts.append(match.group(0))
        last_pos = match.end()

    if last_pos < len(source):
        segment = source[last_pos:]
        hv = translator_logic.build_hanviet_from_map(segment, hv_map) or segment
        hv = hv.strip()
        if hv:
            parts.append(hv)

    joined = " ".join(p for p in parts if p)
    joined = re.sub(r"\s{2,}", " ", joined)
    return joined.strip()


def normalize_translation_cache_source(text: str) -> str:
    return normalize_newlines(text or "").strip()


def split_text_for_translation_cache(text: str) -> list[tuple[str, str]]:
    source = text or ""
    if not source:
        return []
    # Tách theo xuống dòng + dấu câu (gồm cả dấu phẩy) để map cụm mịn hơn cho edit name.
    # Rule viết hoa xử lý riêng: dấu phẩy không coi là kết thúc câu.
    punctuation = set("。！？!?；;：:，,、")
    out: list[tuple[str, str]] = []
    for line_token in re.split(r"(\n+)", source):
        if not line_token:
            continue
        if re.fullmatch(r"\n+", line_token):
            out.append(("sep", line_token))
            continue
        buf = ""
        for ch in line_token:
            buf += ch
            if ch in punctuation:
                token = buf
                if token:
                    out.append(("text", token))
                buf = ""
        if buf:
            out.append(("text", buf))
    return out


def build_text_units_with_offsets(text: str) -> list[dict[str, Any]]:
    source = text or ""
    if not source:
        return []
    tokens = split_text_for_translation_cache(source)
    out: list[dict[str, Any]] = []
    cursor = 0
    unit_index = 0
    for kind, token in tokens:
        token_len = len(token)
        if kind == "text":
            out.append(
                {
                    "unit_index": unit_index,
                    "text": token,
                    "start": cursor,
                    "end": cursor + token_len,
                }
            )
            unit_index += 1
        cursor += token_len
    return out


def split_space_edges(text: str) -> tuple[str, str, str]:
    value = text or ""
    if not value:
        return "", "", ""
    left_m = re.match(r"^\s*", value)
    right_m = re.search(r"\s*$", value)
    left = left_m.group(0) if left_m else ""
    right = right_m.group(0) if right_m else ""
    start = len(left)
    end = len(value) - len(right) if right else len(value)
    if end < start:
        end = start
    core = value[start:end]
    return left, core, right


def needs_server_translation(text: str) -> bool:
    value = text or ""
    if not value:
        return False
    return bool(re.search(r"[\u3400-\u9fff]", value) or NAME_PLACEHOLDER_PREFIX in value)


def _text_snippet(text: str, start: int, end: int, radius: int = 56) -> str:
    source = text or ""
    if not source:
        return ""
    s = max(0, int(start) - radius)
    e = min(len(source), int(end) + radius)
    return source[s:e].strip()


def map_selection_to_name_source(
    *,
    raw_text: str,
    translated_text: str,
    selected_text: str,
    start_offset: int,
    end_offset: int,
    name_set: dict[str, str],
    unit_map: list[dict[str, Any]],
) -> dict[str, Any]:
    selected = (selected_text or "").strip()
    source_raw = normalize_newlines(raw_text or "")
    source_trans = normalize_newlines(translated_text or "")
    cleaned_set = normalize_name_set(name_set)
    total_len = len(source_trans)
    start = max(0, min(total_len, int(start_offset or 0)))
    end = max(0, min(total_len, int(end_offset or 0)))
    if end < start:
        start, end = end, start
    if end == start:
        end = min(total_len, start + max(1, len(selected)))
    if not selected and start < end:
        selected = source_trans[start:end]

    if re.search(r"[\u3400-\u9fff]", selected):
        cjk_value = strip_edge_punctuation(selected.strip())
        return {
            "selected_text": selected,
            "source_candidate": cjk_value,
            "target_candidate": cleaned_set.get(cjk_value, cjk_value),
            "match_type": "selection_is_cjk",
            "score": 1.0,
            "source_context": _text_snippet(source_raw, source_raw.find(cjk_value), source_raw.find(cjk_value) + len(cjk_value)) if cjk_value else "",
            "translated_context": _text_snippet(source_trans, start, end),
            "unit_start": -1,
            "unit_end": -1,
            "candidates": [{"source": cjk_value, "score": 1.0}] if cjk_value else [],
        }

    name_matches: list[dict[str, Any]] = []
    for source_name, target_raw in cleaned_set.items():
        target_main = str(target_raw or "").strip()
        if not target_main:
            continue
        target_opts = [target_main] + [x.strip() for x in target_main.split("/") if x.strip()]
        for opt in target_opts:
            if not opt:
                continue
            cursor = 0
            while True:
                idx = source_trans.find(opt, cursor)
                if idx < 0:
                    break
                name_matches.append(
                    {
                        "source": source_name,
                        "target": opt,
                        "start": idx,
                        "end": idx + len(opt),
                    }
                )
                cursor = idx + max(1, len(opt))

    units = sorted((u for u in unit_map if isinstance(u, dict)), key=lambda x: int(x.get("unit_index") or 0))
    overlaps = [u for u in units if int(u.get("target_end") or 0) > start and int(u.get("target_start") or 0) < end]
    if not overlaps and units:
        center = (start + end) / 2.0
        nearest = min(
            units,
            key=lambda u: abs(((int(u.get("target_start") or 0) + int(u.get("target_end") or 0)) / 2.0) - center),
        )
        overlaps = [nearest]

    if not overlaps:
        return {
            "selected_text": selected,
            "source_candidate": "",
            "target_candidate": selected,
            "match_type": "unit_map_missing",
            "score": 0.0,
            "source_context": "",
            "translated_context": _text_snippet(source_trans, start, end),
            "unit_start": -1,
            "unit_end": -1,
            "candidates": [],
        }

    def overlap_len(unit: dict[str, Any], seg_start: int, seg_end: int) -> int:
        us = int(unit.get("target_start") or 0)
        ue = int(unit.get("target_end") or 0)
        return max(0, min(ue, seg_end) - max(us, seg_start))

    def choose_best_unit(unit_candidates: list[dict[str, Any]], seg_start: int, seg_end: int) -> dict[str, Any]:
        def score(unit: dict[str, Any]) -> tuple[float, float, float]:
            us = int(unit.get("target_start") or 0)
            ue = int(unit.get("target_end") or 0)
            unit_len = max(1, ue - us)
            ov = overlap_len(unit, seg_start, seg_end)
            ratio = ov / float(unit_len)
            # Ưu tiên phần giao lớn nhất, tie-break bằng độ bao phủ và cụm ngắn hơn.
            return (float(ov), float(ratio), -float(unit_len))

        return sorted(unit_candidates, key=score, reverse=True)[0]

    # Ưu tiên name riêng:
    # - Nếu user chọn đúng text Việt của name cũ, map theo unit chứa name đó.
    # - Nếu selection cắt qua nhiều cụm nhưng có name, chọn cụm chứa name trước.
    selected_norm = normalize_for_compare(selected)
    related_name_matches: list[dict[str, Any]] = []
    for nm in name_matches:
        n_start = int(nm["start"])
        n_end = int(nm["end"])
        if n_end > start and n_start < end:
            related_name_matches.append(nm)
            continue
        target_norm = normalize_for_compare(str(nm.get("target") or ""))
        if selected_norm and target_norm and (selected_norm in target_norm or target_norm in selected_norm):
            related_name_matches.append(nm)

    chosen_units = overlaps
    match_type = "unit_best_overlap"
    score_value = 0.9
    chosen_name_exact: dict[str, Any] | None = None

    if related_name_matches:
        exact_candidates: list[dict[str, Any]] = []
        for nm in related_name_matches:
            target_norm = normalize_for_compare(str(nm.get("target") or ""))
            if not selected_norm or not target_norm:
                continue
            selected_len = len(selected_norm)
            target_len = len(target_norm)
            is_exact = selected_norm == target_norm
            is_partial_inside_name = selected_norm in target_norm and selected_len >= max(2, int(target_len * 0.45))
            is_name_inside_small_selection = target_norm in selected_norm and selected_len <= (target_len + 4)
            if is_exact or is_partial_inside_name or is_name_inside_small_selection:
                exact_candidates.append(nm)
        if exact_candidates:
            def exact_score(item: dict[str, Any]) -> tuple[int, int]:
                t_len = len(str(item.get("target") or ""))
                s_len = len(str(item.get("source") or ""))
                return (t_len, s_len)

            chosen_name_exact = sorted(exact_candidates, key=exact_score, reverse=True)[0]

        def name_score(item: dict[str, Any]) -> tuple[int, int]:
            n_start = int(item["start"])
            n_end = int(item["end"])
            ov = max(0, min(n_end, end) - max(n_start, start))
            return (ov, len(str(item.get("target") or "")))

        best_name = sorted(related_name_matches, key=name_score, reverse=True)[0]
        n_start = int(best_name["start"])
        n_end = int(best_name["end"])
        name_units = [u for u in units if int(u.get("target_end") or 0) > n_start and int(u.get("target_start") or 0) < n_end]
        if name_units:
            chosen_units = [choose_best_unit(name_units, n_start, n_end)]
            match_type = "name_unit_cover"
            score_value = 1.0

    if len(chosen_units) > 1:
        chosen_units = [choose_best_unit(chosen_units, start, end)]

    chosen = chosen_units[0]
    source_start = int(chosen.get("source_start") or 0)
    source_end = int(chosen.get("source_end") or 0)
    target_start = int(chosen.get("target_start") or 0)
    target_end = int(chosen.get("target_end") or 0)

    source_candidate = strip_edge_punctuation(str(chosen.get("source_text") or "").strip())
    if not source_candidate:
        source_candidate = strip_edge_punctuation(source_raw[source_start:source_end].strip())
    target_candidate = strip_edge_punctuation(str(chosen.get("target_text") or "").strip())
    if not target_candidate:
        target_candidate = strip_edge_punctuation(source_trans[target_start:target_end].strip()) or strip_edge_punctuation(selected)

    if chosen_name_exact is not None:
        chosen_source_name = strip_edge_punctuation(str(chosen_name_exact.get("source") or "").strip())
        chosen_target_name = str(cleaned_set.get(chosen_source_name, "") or "").strip()
        chosen_target_main = chosen_target_name.split("/", 1)[0].strip() if chosen_target_name else ""
        if chosen_source_name and chosen_target_main:
            source_candidate = chosen_source_name
            target_candidate = chosen_target_main
            match_type = "name_exact_target"
            score_value = 1.0

    # Gợi ý name theo cụm đã chọn (giống hướng TM: cụm nhỏ, sát selection).
    suggestion_sources: list[str] = []
    for nm in related_name_matches:
        src = strip_edge_punctuation(str(nm.get("source") or "").strip())
        if src and src in source_raw[source_start:source_end]:
            suggestion_sources.append(src)
    for m in re.finditer(r"[\u3400-\u9fff]{2,4}", source_raw[source_start:source_end]):
        src = strip_edge_punctuation(m.group(0))
        if src:
            suggestion_sources.append(src)
    dedup_suggestions: list[str] = []
    seen_suggestions: set[str] = set()
    for src in suggestion_sources:
        if not src or contains_name_split_delimiter(src) or src in seen_suggestions:
            continue
        seen_suggestions.add(src)
        dedup_suggestions.append(src)
    dedup_suggestions = dedup_suggestions[:8]

    candidate_rows = [
        {"source": strip_edge_punctuation(str(u.get("source_text") or "").strip()), "score": float(overlap_len(u, start, end))}
        for u in overlaps[:6]
        if strip_edge_punctuation(str(u.get("source_text") or "").strip())
    ]

    return {
        "selected_text": selected,
        "source_candidate": source_candidate,
        "target_candidate": target_candidate,
        "match_type": match_type,
        "score": score_value,
        "source_context": _text_snippet(source_raw, source_start, source_end),
        "translated_context": _text_snippet(source_trans, target_start, target_end),
        "unit_start": int(chosen.get("unit_index") or 0),
        "unit_end": int(chosen.get("unit_index") or 0),
        "name_suggestions": dedup_suggestions,
        "candidates": candidate_rows,
    }


def normalize_text_for_split(text: str) -> str:
    normalized = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r"[ \t]+\n", "\n", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()


def split_long_block(text: str, max_len: int) -> list[str]:
    raw = (text or "").strip()
    if not raw:
        return []
    if len(raw) <= max_len:
        return [raw]
    separators = set("。！？!?；;….,，、:：")
    chunks: list[str] = []
    buf = ""
    for ch in raw:
        buf += ch
        if len(buf) >= max_len:
            chunks.append(buf.strip())
            buf = ""
            continue
        if ch in separators and len(buf) >= int(max_len * 0.55):
            chunks.append(buf.strip())
            buf = ""
    if buf.strip():
        chunks.append(buf.strip())

    output: list[str] = []
    for c in chunks:
        if len(c) <= max_len:
            output.append(c)
        else:
            for i in range(0, len(c), max_len):
                output.append(c[i : i + max_len])
    return output


def merge_short_chapters(chapters: list[dict[str, Any]], min_len: int) -> list[dict[str, Any]]:
    if not chapters:
        return []
    merged: list[dict[str, Any]] = []
    buf: dict[str, Any] | None = None
    for ch in chapters:
        text = (ch.get("text") or "").strip()
        if not text:
            continue
        item = {"title": (ch.get("title") or "").strip(), "text": text}
        if buf is None:
            buf = item
            continue
        if len(buf["text"]) < min_len:
            buf["text"] = f"{buf['text']}\n\n{item['text']}".strip()
        else:
            merged.append(buf)
            buf = item
    if buf is not None:
        if len(buf["text"]) < min_len and merged:
            merged[-1]["text"] = f"{merged[-1]['text']}\n\n{buf['text']}".strip()
        else:
            merged.append(buf)
    return merged


def split_by_newlines(normalized: str, target_size: int = 4500) -> list[dict[str, str]]:
    if not normalized:
        return []
    max_chapter_len = max(target_size * 2, 9000)
    parts = [x.strip() for x in re.split(r"\n{2,}", normalized) if x.strip()]
    joiner = "\n\n"
    if len(parts) <= 1:
        parts = [x.strip() for x in re.split(r"\n+", normalized) if x.strip()]
        joiner = "\n"

    expanded: list[str] = []
    for part in parts:
        if len(part) > max_chapter_len:
            expanded.extend(split_long_block(part, max_chapter_len))
        else:
            expanded.append(part)

    total = sum(len(x) for x in expanded)
    desired_count = max(1, round(total / max(target_size, 1)))
    avg = max(1, (total + desired_count - 1) // desired_count)

    groups: list[str] = []
    cur: list[str] = []
    cur_len = 0
    for p in expanded:
        add_len = len(p) + (len(joiner) if cur else 0)
        if cur and cur_len + add_len > avg and len(groups) < desired_count - 1:
            groups.append(joiner.join(cur).strip())
            cur = [p]
            cur_len = len(p)
        else:
            cur.append(p)
            cur_len += add_len
    if cur:
        groups.append(joiner.join(cur).strip())

    min_len = max(800, int(target_size * 0.25))
    chapters = [{"title": f"Chương {i+1}", "text": content} for i, content in enumerate(groups)]
    return merge_short_chapters(chapters, min_len)


def split_text_into_chapters(text: str, target_size: int = 4500) -> list[dict[str, str]]:
    normalized = normalize_text_for_split(text)
    if not normalized:
        return []
    matches = list(CHAPTER_HEADING_REGEX.finditer(normalized))
    if not matches:
        return split_by_newlines(normalized, target_size=target_size)

    chapters: list[dict[str, str]] = []
    if matches[0].start() > 0:
        preface = normalize_text_for_split(normalized[: matches[0].start()])
        if preface:
            chapters.append({"title": "Mở đầu", "text": preface})

    for i, m in enumerate(matches):
        title = (m.group(0) or "").strip() or f"Chương {i+1}"
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(normalized)
        content = normalize_text_for_split(normalized[start:end])
        if content:
            chapters.append({"title": title, "text": content})

    if not chapters:
        return split_by_newlines(normalized, target_size=target_size)

    min_len = max(800, int(target_size * 0.25))
    max_len = max(target_size * 2, 9000)
    avg = sum(len(c["text"]) for c in chapters) / max(len(chapters), 1)
    too_short = sum(1 for c in chapters if len(c["text"]) < min_len // 2)
    too_long = sum(1 for c in chapters if len(c["text"]) > max_len)
    fallback = len(chapters) > 5 and (
        avg < min_len * 0.6 or too_short / len(chapters) > 0.6 or too_long > 0
    )
    if fallback:
        return split_by_newlines(normalized, target_size=target_size)

    return merge_short_chapters(chapters, min_len)


def find_first_by_localname(root: ET.Element, name: str) -> ET.Element | None:
    for el in root.iter():
        if localname(el.tag) == name:
            return el
    return None


def find_all_by_localname(root: ET.Element, name: str) -> list[ET.Element]:
    result: list[ET.Element] = []
    for el in root.iter():
        if localname(el.tag) == name:
            result.append(el)
    return result


def parse_epub_chapters(data: bytes, custom_title: str | None = None) -> tuple[str, str, list[dict[str, str]]]:
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        def read_text(path: str) -> str | None:
            candidates = [path, unquote(path)]
            for c in candidates:
                try:
                    return decode_text_with_fallback(zf.read(c))
                except KeyError:
                    continue
            return None

        container_xml = read_text("META-INF/container.xml")
        if not container_xml:
            raise ValueError("Không tìm thấy META-INF/container.xml trong EPUB.")

        container_doc = ET.fromstring(container_xml)
        rootfile = find_first_by_localname(container_doc, "rootfile")
        if rootfile is None:
            raise ValueError("container.xml thiếu rootfile.")

        opf_path = rootfile.attrib.get("full-path", "").strip()
        if not opf_path:
            raise ValueError("container.xml thiếu đường dẫn OPF.")

        opf_xml = read_text(opf_path)
        if not opf_xml:
            raise ValueError("Không đọc được file OPF trong EPUB.")
        opf_doc = ET.fromstring(opf_xml)

        metadata_el = find_first_by_localname(opf_doc, "metadata") or opf_doc
        title_el = find_first_by_localname(metadata_el, "title")
        creator_el = find_first_by_localname(metadata_el, "creator")

        title = (custom_title or "").strip() or (title_el.text or "").strip() or "Untitled"
        author = (creator_el.text or "").strip()

        manifest: dict[str, dict[str, str]] = {}
        for item in find_all_by_localname(opf_doc, "item"):
            item_id = item.attrib.get("id", "").strip()
            href = item.attrib.get("href", "").strip()
            media_type = item.attrib.get("media-type", "").strip()
            if not item_id or not href:
                continue
            resolved = resolve_zip_path(opf_path, href)
            manifest[item_id] = {"href": href, "resolved": resolved, "media_type": media_type}

        spine_ids: list[str] = []
        spine_el = find_first_by_localname(opf_doc, "spine")
        for itemref in find_all_by_localname(opf_doc, "itemref"):
            item_id = itemref.attrib.get("idref", "").strip()
            if item_id and item_id in manifest:
                spine_ids.append(item_id)

        toc_labels: dict[str, str] = {}
        toc_id = (spine_el.attrib.get("toc", "") if spine_el is not None else "").strip()
        toc_item = manifest.get(toc_id) if toc_id else None
        if toc_item is None:
            for item in manifest.values():
                if "ncx" in (item.get("media_type") or ""):
                    toc_item = item
                    break

        if toc_item:
            toc_xml = read_text(toc_item["resolved"])
            if toc_xml:
                try:
                    toc_doc = ET.fromstring(toc_xml)
                    for nav in find_all_by_localname(toc_doc, "navPoint"):
                        text_el = find_first_by_localname(nav, "text")
                        content_el = find_first_by_localname(nav, "content")
                        src = (content_el.attrib.get("src", "") if content_el is not None else "").strip()
                        label = (text_el.text or "").strip() if text_el is not None else ""
                        if src:
                            resolved = resolve_zip_path(toc_item["resolved"], src)
                            toc_labels[resolved] = label
                except Exception:
                    pass

        chapters: list[dict[str, str]] = []
        for idx, spine_id in enumerate(spine_ids, start=1):
            item = manifest.get(spine_id)
            if not item:
                continue
            if "html" not in (item["media_type"] or "") and "xhtml" not in (item["media_type"] or ""):
                continue
            raw_html = read_text(item["resolved"])
            if not raw_html:
                continue
            content = html_to_text(raw_html)
            if not content:
                continue
            chapter_title = toc_labels.get(item["resolved"], "").strip()
            if not chapter_title:
                try:
                    html_root = ET.fromstring(raw_html)
                    h1 = find_first_by_localname(html_root, "h1")
                    h2 = find_first_by_localname(html_root, "h2")
                    chapter_title = ((h1.text if h1 is not None else "") or (h2.text if h2 is not None else "")).strip()
                except Exception:
                    chapter_title = ""
            if not chapter_title:
                chapter_title = f"Chương {idx}"
            chapters.append({"title": chapter_title, "text": content})

        if not chapters:
            raise ValueError("Không tìm thấy chương hợp lệ trong EPUB.")

        return title, author, chapters


@dataclass
class TranslationAdapter:
    app_config: dict[str, Any]
    active_name_set: dict[str, str] | None = None
    active_set_name: str = "Mặc định"
    name_set_version: int = 1
    cache_lookup_batch: Callable[[list[str], str, str], dict[str, str]] | None = None
    cache_store_batch: Callable[[list[tuple[str, str]], str, str], int] | None = None

    def _settings(self) -> dict[str, Any]:
        cfg = self.app_config.get("translator_settings") or {}
        return {
            "serverUrl": cfg.get("serverUrl", "https://dichngay.com/translate/text"),
            "hanvietJsonUrl": cfg.get(
                "hanvietJsonUrl",
                "https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/han_viet/output.json",
            ),
            "delayMs": int(cfg.get("delayMs", 250) or 250),
            "maxChars": int(cfg.get("maxChars", 4500) or 4500),
            "proxies": cfg.get("proxies"),
        }

    def _local_settings(self) -> dict[str, Any]:
        reader_cfg = self.app_config.get("reader_translation") or {}
        local_cfg = reader_cfg.get("local") if isinstance(reader_cfg, dict) else {}
        if not isinstance(local_cfg, dict):
            local_cfg = {}
        global_dicts = reader_cfg.get("global_dicts") if isinstance(reader_cfg, dict) else {}
        if not isinstance(global_dicts, dict):
            global_dicts = {}
        merged_local = dict(local_cfg)
        merged_local["global_name_overrides"] = normalize_name_set(global_dicts.get("name"))
        merged_local["global_vp_overrides"] = normalize_name_set(global_dicts.get("vp"))
        return vbook_local_translate.normalize_local_settings(
            merged_local,
            default_base_dir="reader_ui/translate/vbook_local",
        )

    def _active_name_set(self) -> dict[str, str]:
        if isinstance(self.active_name_set, dict):
            return normalize_name_set(self.active_name_set)
        name_sets = self.app_config.get("nameSets") or {}
        active = self.app_config.get("activeNameSet")
        if active and isinstance(name_sets.get(active), dict):
            return normalize_name_set(name_sets[active])
        if name_sets:
            first = next(iter(name_sets.keys()))
            if isinstance(name_sets.get(first), dict):
                return normalize_name_set(name_sets[first])
        return {}

    def _name_set_for_use(self, name_set_override: dict[str, str] | None = None) -> dict[str, str]:
        if isinstance(name_set_override, dict):
            return normalize_name_set(name_set_override)
        return self._active_name_set()

    def translation_signature(
        self,
        mode: str = "server",
        name_set_override: dict[str, str] | None = None,
        vp_set_override: dict[str, str] | None = None,
    ) -> str:
        mode_norm = (mode or "server").strip().lower()
        if mode_norm not in {"server", "local", "hanviet"}:
            mode_norm = "server"
        payload: dict[str, Any] = {
            "mode": mode_norm,
            "active_set": str(self.active_set_name or "Mặc định"),
            "version": int(self.name_set_version or 1),
            "text_norm_version": 9,
            "name_set": self._name_set_for_use(name_set_override),
        }
        if mode_norm in {"local", "hanviet"}:
            local_settings = self._local_settings()
            payload["local_settings"] = local_settings
            try:
                payload["local_bundle_sig"] = vbook_local_translate.get_public_bundle(local_settings).signature
            except Exception:
                payload["local_bundle_sig"] = ""
        if mode_norm == "local":
            payload["vp_set"] = normalize_name_set(vp_set_override or {})
        raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        return hashlib.sha1(raw.encode("utf-8", errors="ignore")).hexdigest()

    def translate_detailed(
        self,
        text: str,
        mode: str = "server",
        name_set_override: dict[str, str] | None = None,
        vp_set_override: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        source = (text or "").strip()
        mode_norm = (mode or "server").strip().lower()
        if mode_norm not in {"server", "local", "hanviet"}:
            mode_norm = "server"
        if not source:
            return {
                "source_text": "",
                "processed_text": "",
                "translated_with_placeholders": "",
                "translated": "",
                "mode": mode_norm,
                "unit_map": [],
                "name_map": {
                    "active_set": str(self.active_set_name or "Mặc định"),
                    "version": int(self.name_set_version or 1),
                    "size": 0,
                    "placeholders": [],
                    "hits": [],
                },
                "hanviet_source": "",
            }

        settings = self._settings()
        name_set = self._name_set_for_use(name_set_override)
        vp_set = normalize_name_set(vp_set_override or {})

        if mode_norm in {"local", "hanviet"}:
            local_settings = self._local_settings()
            local_detail = vbook_local_translate.translate_detailed(
                source,
                settings=local_settings,
                personal_name_set=name_set,
                personal_vp_set=vp_set,
            )
            hanviet_source = normalize_newlines(local_detail.get("hanviet_source") or "")
            if mode_norm == "hanviet":
                translated = hanviet_source or source
            else:
                translated = normalize_newlines(local_detail.get("translated") or "")
            if not translated:
                translated = source
            processed_text = normalize_newlines(local_detail.get("processed_text") or source)
            translated_with_placeholders = normalize_newlines(
                local_detail.get("translated_with_placeholders") or translated
            )
            unit_map = local_detail.get("unit_map") if isinstance(local_detail.get("unit_map"), list) else []
            hits = local_detail.get("name_hits") if isinstance(local_detail.get("name_hits"), list) else collect_name_hits(source, name_set)
            return {
                "source_text": source,
                "processed_text": processed_text,
                "translated_with_placeholders": translated_with_placeholders,
                "translated": translated,
                "mode": mode_norm,
                "unit_map": unit_map,
                "name_map": {
                    "active_set": str(self.active_set_name or "Mặc định"),
                    "version": int(self.name_set_version or 1),
                    "size": len(name_set),
                    "placeholders": [],
                    "hits": hits,
                },
                "hanviet_source": hanviet_source,
            }

        processed_text, placeholder_map, hits = apply_name_placeholders(source, name_set)
        source_unit_infos = build_text_units_with_offsets(source)
        translated_with_placeholders = ""
        hanviet_source = ""
        resolved_core: dict[str, str] = {}
        units = split_text_for_translation_cache(processed_text)
        if not units:
            units = [("text", processed_text)]

        trans_sig = self.translation_signature(mode=mode_norm, name_set_override=name_set_override)
        lookup_candidates: list[str] = []

        for kind, unit in units:
            if kind != "text":
                continue
            _, core, _ = split_space_edges(unit)
            key = normalize_translation_cache_source(core)
            if not key:
                continue
            if key in resolved_core:
                continue
            if not needs_server_translation(key):
                resolved_core[key] = key
                continue
            lookup_candidates.append(key)

        uniq_lookup: list[str] = []
        seen_lookup: set[str] = set()
        for item in lookup_candidates:
            if item in seen_lookup:
                continue
            seen_lookup.add(item)
            uniq_lookup.append(item)

        if uniq_lookup and self.cache_lookup_batch:
            try:
                cached = self.cache_lookup_batch(uniq_lookup, mode_norm, trans_sig)
            except Exception:
                cached = {}
            for src_key, trans_val in (cached or {}).items():
                key = normalize_translation_cache_source(src_key)
                val = normalize_newlines(trans_val or "")
                if not key:
                    continue
                if key and val:
                    resolved_core[key] = val

        missing = [x for x in uniq_lookup if x not in resolved_core]
        if missing:
            translated_list = translator_logic.translate_text_chunks(
                missing,
                name_set={},
                settings=settings,
                update_progress_callback=None,
                target_lang="vi",
            )
            to_store: list[tuple[str, str]] = []
            for idx, source_key in enumerate(missing):
                translated_piece = translated_list[idx] if idx < len(translated_list) else source_key
                translated_piece = normalize_newlines(translated_piece or "")
                if not translated_piece or translated_piece.startswith("[Lỗi"):
                    translated_piece = source_key
                resolved_core[source_key] = translated_piece
                if (
                    self.cache_store_batch
                    and translated_piece
                    and translated_piece != source_key
                    and not translated_piece.startswith("[Lỗi")
                ):
                    to_store.append((source_key, translated_piece))
            if to_store and self.cache_store_batch:
                try:
                    self.cache_store_batch(to_store, mode_norm, trans_sig)
                except Exception:
                    pass

        translated_parts: list[str] = []
        translated_placeholder_parts: list[str] = []
        unit_map: list[dict[str, Any]] = []
        target_cursor = 0
        text_idx = 0
        protected_name_targets = sorted(
            {
                str(v or "").strip()
                for v in (name_set or {}).values()
                if str(v or "").strip()
            },
            key=len,
            reverse=True,
        )

        def _prepend_space_if_needed(prev_piece: str, next_piece: str) -> str:
            if not prev_piece or not next_piece:
                return next_piece
            if next_piece[0].isspace():
                return next_piece
            if prev_piece.endswith((" ", "\t", "\n")):
                return next_piece
            next_head = next_piece.lstrip()
            if next_head:
                no_space_before = {",", ".", ";", ":", "!", "?", "…", ")", "]", "}", "”", "’", "»", "\"", "'"}
                if next_head[0] in no_space_before:
                    return next_piece
            if prev_piece[-1] in {",", ".", ";", ":", "!", "?", "…"}:
                return f" {next_piece}"
            return next_piece

        for kind, unit in units:
            if kind != "text":
                translated_parts.append(unit)
                translated_placeholder_parts.append(unit)
                target_cursor += len(unit)
                continue

            left, core, right = split_space_edges(unit)
            key = normalize_translation_cache_source(core)
            translated_core = resolved_core.get(key, key) if key else core
            translated_core_with_placeholder = translated_core or core
            translated_placeholder_piece = f"{left}{translated_core_with_placeholder}{right}"
            prev_placeholder = translated_placeholder_parts[-1] if translated_placeholder_parts else ""
            translated_placeholder_piece = _prepend_space_if_needed(prev_placeholder, translated_placeholder_piece)
            translated_placeholder_parts.append(translated_placeholder_piece)

            restored_core = restore_name_placeholders(translated_core_with_placeholder, placeholder_map)
            restored_core = normalize_vi_punctuation(restored_core)
            prev_piece = translated_parts[-1] if translated_parts else ""

            source_info = source_unit_infos[text_idx] if text_idx < len(source_unit_infos) else {
                "unit_index": text_idx,
                "text": core or unit,
                "start": 0,
                "end": 0,
            }
            s_start = int(source_info.get("start") or 0)
            s_end = int(source_info.get("end") or 0)
            unit_hits = [h for h in hits if int(h.get("start") or -1) < s_end and int(h.get("end") or -1) > s_start]

            # Sau dấu phẩy: text thường không nên bị viết hoa chữ đầu cụm.
            # Riêng Name riêng đã map thì giữ nguyên chữ hoa hiện có.
            if prev_piece.rstrip().endswith((",", "，", "、")):
                core_lstrip = restored_core.lstrip()
                preserve_case = False
                if core_lstrip:
                    for hit in unit_hits:
                        hit_target = str(hit.get("target") or "").strip()
                        if hit_target and core_lstrip.lower().startswith(hit_target.lower()):
                            preserve_case = True
                            break
                    if not preserve_case:
                        for target_name in protected_name_targets:
                            if core_lstrip.lower().startswith(target_name.lower()):
                                preserve_case = True
                                break
                if not preserve_case:
                    restored_core = lowercase_first_alpha(restored_core)

            final_piece = f"{left}{restored_core}{right}"
            final_piece = _prepend_space_if_needed(prev_piece, final_piece)
            translated_parts.append(final_piece)
            unit_map.append(
                {
                    "unit_index": int(source_info.get("unit_index") or text_idx),
                    "source_text": str(source_info.get("text") or "").strip(),
                    "target_text": final_piece.strip(),
                    "source_start": s_start,
                    "source_end": s_end,
                    "target_start": target_cursor,
                    "target_end": target_cursor + len(final_piece),
                    "name_hits": unit_hits,
                }
            )
            target_cursor += len(final_piece)
            text_idx += 1

        translated_with_placeholders = "".join(translated_placeholder_parts) if translated_placeholder_parts else processed_text
        translated = "".join(translated_parts) if translated_parts else source
        translated = smart_capitalize_vi(translated)
        if not translated:
            translated = source

        placeholders = [
            {
                "placeholder": ph,
                "source": data.get("source") or "",
                "target": data.get("target") or "",
            }
            for ph, data in placeholder_map.items()
        ]
        placeholders.sort(key=lambda x: x["placeholder"])

        return {
            "source_text": source,
            "processed_text": processed_text,
            "translated_with_placeholders": translated_with_placeholders,
            "translated": translated,
            "mode": mode_norm,
            "unit_map": unit_map,
            "name_map": {
                "active_set": str(self.active_set_name or "Mặc định"),
                "version": int(self.name_set_version or 1),
                "size": len(name_set),
                "placeholders": placeholders,
                "hits": hits,
            },
            "hanviet_source": hanviet_source,
        }

    def translate(self, text: str, mode: str = "server") -> str:
        return self.translate_detailed(text, mode=mode).get("translated", "")


class ReaderStorage:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        # Optional callback to load remote chapter content on-demand (e.g. vBook).
        self.remote_chapter_fetcher: Callable[[dict[str, Any], dict[str, Any]], str] | None = None
        ensure_dirs()
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                PRAGMA journal_mode=WAL;

                CREATE TABLE IF NOT EXISTS books (
                    book_id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    title_vi TEXT,
                    author TEXT DEFAULT '',
                    author_vi TEXT,
                    lang_source TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    source_file_path TEXT DEFAULT '',
                    cover_path TEXT DEFAULT '',
                    extra_link TEXT DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    chapter_count INTEGER NOT NULL DEFAULT 0,
                    last_read_chapter_id TEXT,
                    last_read_ratio REAL,
                    last_read_mode TEXT DEFAULT 'raw',
                    theme_pref TEXT,
                    summary TEXT DEFAULT ''
                );

                CREATE TABLE IF NOT EXISTS chapters (
                    chapter_id TEXT PRIMARY KEY,
                    book_id TEXT NOT NULL,
                    chapter_order INTEGER NOT NULL,
                    title_raw TEXT NOT NULL,
                    title_vi TEXT,
                    raw_key TEXT NOT NULL,
                    trans_key TEXT,
                    trans_sig TEXT,
                    updated_at TEXT NOT NULL,
                    word_count INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY(book_id) REFERENCES books(book_id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_chapters_book_order ON chapters(book_id, chapter_order);

                CREATE TABLE IF NOT EXISTS content_cache (
                    cache_key TEXT PRIMARY KEY,
                    lang TEXT NOT NULL,
                    text_path TEXT NOT NULL,
                    sha256 TEXT NOT NULL,
                    bytes INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS translation_memory (
                    source_hash TEXT NOT NULL,
                    source_text TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    trans_sig TEXT NOT NULL,
                    translated_text TEXT NOT NULL,
                    hit_count INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY(source_hash, mode, trans_sig)
                );

                CREATE INDEX IF NOT EXISTS idx_translation_memory_lookup
                ON translation_memory(mode, trans_sig, source_hash);

                CREATE TABLE IF NOT EXISTS translation_unit_map (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chapter_id TEXT NOT NULL,
                    trans_sig TEXT NOT NULL,
                    translation_mode TEXT NOT NULL,
                    unit_index INTEGER NOT NULL,
                    source_text TEXT NOT NULL,
                    target_text TEXT NOT NULL,
                    source_start INTEGER NOT NULL,
                    source_end INTEGER NOT NULL,
                    target_start INTEGER NOT NULL,
                    target_end INTEGER NOT NULL,
                    name_hits_json TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_translation_unit_map_lookup
                ON translation_unit_map(chapter_id, trans_sig, translation_mode, unit_index);

                CREATE INDEX IF NOT EXISTS idx_translation_unit_map_target
                ON translation_unit_map(chapter_id, trans_sig, translation_mode, target_start, target_end);

                CREATE TABLE IF NOT EXISTS jobs (
                    job_id TEXT PRIMARY KEY,
                    type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    progress REAL NOT NULL DEFAULT 0,
                    message TEXT,
                    details TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS app_state (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS history_books (
                    history_id TEXT PRIMARY KEY,
                    plugin_id TEXT NOT NULL DEFAULT '',
                    source_url TEXT NOT NULL,
                    title TEXT NOT NULL,
                    author TEXT DEFAULT '',
                    cover_url TEXT DEFAULT '',
                    last_read_chapter_url TEXT DEFAULT '',
                    last_read_chapter_title TEXT DEFAULT '',
                    last_read_ratio REAL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    expire_at TEXT NOT NULL
                );

                CREATE UNIQUE INDEX IF NOT EXISTS idx_history_books_source
                ON history_books(plugin_id, source_url);

                CREATE INDEX IF NOT EXISTS idx_history_books_updated
                ON history_books(updated_at DESC);

                CREATE INDEX IF NOT EXISTS idx_history_books_expire
                ON history_books(expire_at);
                """
            )
            self._ensure_column(conn, "books", "title_vi", "TEXT")
            self._ensure_column(conn, "books", "author_vi", "TEXT")
            self._ensure_column(conn, "books", "cover_path", "TEXT DEFAULT ''")
            self._ensure_column(conn, "books", "extra_link", "TEXT DEFAULT ''")
            self._ensure_column(conn, "books", "source_url", "TEXT DEFAULT ''")
            self._ensure_column(conn, "books", "source_plugin", "TEXT DEFAULT ''")
            self._ensure_column(conn, "chapters", "trans_sig", "TEXT")
            self._ensure_column(conn, "chapters", "remote_url", "TEXT DEFAULT ''")

    def _ensure_column(self, conn: sqlite3.Connection, table: str, column: str, decl: str) -> None:
        rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
        names = {str(r[1]) for r in rows}
        if column in names:
            return
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {decl}")

    def _safe_filename(self, name: str, max_len: int = 80) -> str:
        cleaned = re.sub(r"[\\/:*?\"<>|]+", "_", (name or "book")).strip()
        cleaned = re.sub(r"\s+", " ", cleaned)
        cleaned = cleaned[:max_len].strip()
        return cleaned or "book"

    def _cache_path_for_key(self, cache_key: str) -> Path:
        prefix = cache_key[:2]
        folder = CACHE_DIR / prefix
        folder.mkdir(parents=True, exist_ok=True)
        return folder / f"{cache_key}.txt"

    def write_cache(self, cache_key: str, lang: str, text: str) -> dict[str, Any]:
        now = utc_now_iso()
        raw = (text or "").encode("utf-8")
        sha256 = hashlib.sha256(raw).hexdigest()
        path = self._cache_path_for_key(cache_key)
        path.write_bytes(raw)

        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO content_cache(cache_key, lang, text_path, sha256, bytes, created_at, updated_at)
                VALUES(?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(cache_key) DO UPDATE SET
                    lang=excluded.lang,
                    text_path=excluded.text_path,
                    sha256=excluded.sha256,
                    bytes=excluded.bytes,
                    updated_at=excluded.updated_at
                """,
                (cache_key, lang, str(path), sha256, len(raw), now, now),
            )
        return {"cache_key": cache_key, "path": str(path), "sha256": sha256, "bytes": len(raw)}

    def read_cache(self, cache_key: str) -> str | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT text_path FROM content_cache WHERE cache_key = ?", (cache_key,)
            ).fetchone()
        if not row:
            return None
        path = Path(row["text_path"])
        if not path.exists():
            fallback = self._cache_path_for_key(cache_key)
            if not fallback.exists():
                return None
            path = fallback
            with self._connect() as conn:
                conn.execute(
                    "UPDATE content_cache SET text_path = ?, updated_at = ? WHERE cache_key = ?",
                    (str(path), utc_now_iso(), cache_key),
                )
        return decode_text_with_fallback(path.read_bytes())

    def get_translation_memory_batch(self, source_texts: list[str], mode: str, trans_sig: str) -> dict[str, str]:
        mode_norm = (mode or "server").strip().lower() or "server"
        sig = (trans_sig or "").strip()
        if not sig:
            return {}

        clean_keys: list[str] = []
        seen: set[str] = set()
        for raw in source_texts or []:
            key = normalize_translation_cache_source(raw)
            if not key or key in seen:
                continue
            seen.add(key)
            clean_keys.append(key)
        if not clean_keys:
            return {}

        hash_map = {key: hashlib.sha1(key.encode("utf-8", errors="ignore")).hexdigest() for key in clean_keys}
        rows_out: dict[str, str] = {}
        hits_to_update: list[str] = []

        placeholders = ",".join("?" for _ in hash_map)
        params: list[Any] = [mode_norm, sig, *hash_map.values()]
        with self._connect() as conn:
            rows = conn.execute(
                f"""
                SELECT source_hash, source_text, translated_text
                FROM translation_memory
                WHERE mode = ? AND trans_sig = ? AND source_hash IN ({placeholders})
                """,
                tuple(params),
            ).fetchall()
            for row in rows:
                source_text = normalize_translation_cache_source(row["source_text"])
                translated = normalize_newlines(row["translated_text"] or "")
                if not source_text or not translated:
                    continue
                if hash_map.get(source_text) != row["source_hash"]:
                    continue
                rows_out[source_text] = translated
                hits_to_update.append(str(row["source_hash"]))

            if hits_to_update:
                now = utc_now_iso()
                conn.executemany(
                    """
                    UPDATE translation_memory
                    SET hit_count = hit_count + 1, updated_at = ?
                    WHERE source_hash = ? AND mode = ? AND trans_sig = ?
                    """,
                    [(now, h, mode_norm, sig) for h in hits_to_update],
                )
        return rows_out

    def set_translation_memory_batch(self, entries: list[tuple[str, str]], mode: str, trans_sig: str) -> int:
        mode_norm = (mode or "server").strip().lower() or "server"
        sig = (trans_sig or "").strip()
        if not sig:
            return 0
        prepared: dict[str, str] = {}
        for source_text, translated_text in entries or []:
            source_key = normalize_translation_cache_source(source_text)
            translated = normalize_newlines(translated_text or "")
            if not source_key or not translated:
                continue
            prepared[source_key] = translated
        if not prepared:
            return 0

        now = utc_now_iso()
        rows = []
        for source_key, translated in prepared.items():
            source_hash = hashlib.sha1(source_key.encode("utf-8", errors="ignore")).hexdigest()
            rows.append((source_hash, source_key, mode_norm, sig, translated, now, now))
        with self._connect() as conn:
            conn.executemany(
                """
                INSERT INTO translation_memory(
                    source_hash, source_text, mode, trans_sig, translated_text, hit_count, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, 0, ?, ?)
                ON CONFLICT(source_hash, mode, trans_sig) DO UPDATE SET
                    source_text = excluded.source_text,
                    translated_text = excluded.translated_text,
                    updated_at = excluded.updated_at
                """,
                rows,
            )
        return len(rows)

    def save_translation_unit_map(
        self,
        chapter_id: str,
        trans_sig: str,
        translation_mode: str,
        units: list[dict[str, Any]],
    ) -> int:
        chapter_key = str(chapter_id or "").strip()
        sig = str(trans_sig or "").strip()
        mode = str(translation_mode or "server").strip().lower() or "server"
        if not chapter_key or not sig:
            return 0
        now = utc_now_iso()
        prepared: list[tuple[Any, ...]] = []
        for idx, row in enumerate(units or []):
            if not isinstance(row, dict):
                continue
            source_text = str(row.get("source_text") or "").strip()
            target_text = str(row.get("target_text") or "").strip()
            if not source_text and not target_text:
                continue
            prepared.append(
                (
                    chapter_key,
                    sig,
                    mode,
                    int(row.get("unit_index", idx) or idx),
                    source_text,
                    target_text,
                    int(row.get("source_start") or 0),
                    int(row.get("source_end") or 0),
                    int(row.get("target_start") or 0),
                    int(row.get("target_end") or 0),
                    json.dumps(row.get("name_hits") or [], ensure_ascii=False, separators=(",", ":")),
                    now,
                    now,
                )
            )
        with self._connect() as conn:
            conn.execute(
                "DELETE FROM translation_unit_map WHERE chapter_id = ? AND translation_mode = ?",
                (chapter_key, mode),
            )
            if prepared:
                conn.executemany(
                    """
                    INSERT INTO translation_unit_map(
                        chapter_id, trans_sig, translation_mode, unit_index,
                        source_text, target_text, source_start, source_end, target_start, target_end,
                        name_hits_json, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    prepared,
                )
        return len(prepared)

    def get_translation_unit_map(
        self,
        chapter_id: str,
        trans_sig: str,
        translation_mode: str,
    ) -> list[dict[str, Any]]:
        chapter_key = str(chapter_id or "").strip()
        sig = str(trans_sig or "").strip()
        mode = str(translation_mode or "server").strip().lower() or "server"
        if not chapter_key or not sig:
            return []
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT unit_index, source_text, target_text, source_start, source_end, target_start, target_end, name_hits_json
                FROM translation_unit_map
                WHERE chapter_id = ? AND trans_sig = ? AND translation_mode = ?
                ORDER BY unit_index ASC
                """,
                (chapter_key, sig, mode),
            ).fetchall()
        out: list[dict[str, Any]] = []
        for r in rows:
            item = dict(r)
            raw_hits = item.get("name_hits_json") or "[]"
            try:
                item["name_hits"] = json.loads(raw_hits) if isinstance(raw_hits, str) else []
            except Exception:
                item["name_hits"] = []
            item.pop("name_hits_json", None)
            out.append(item)
        return out

    def get_translation_unit_map_count(self, chapter_id: str, trans_sig: str, translation_mode: str) -> int:
        chapter_key = str(chapter_id or "").strip()
        sig = str(trans_sig or "").strip()
        mode = str(translation_mode or "server").strip().lower() or "server"
        if not chapter_key or not sig:
            return 0
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT COUNT(1) AS c
                FROM translation_unit_map
                WHERE chapter_id = ? AND trans_sig = ? AND translation_mode = ?
                """,
                (chapter_key, sig, mode),
            ).fetchone()
        return int((row or {"c": 0})["c"] or 0)

    def _get_app_state_value(self, key: str) -> str | None:
        with self._connect() as conn:
            row = conn.execute("SELECT value FROM app_state WHERE key = ?", (key,)).fetchone()
        if row and row["value"] is not None:
            return str(row["value"])
        return None

    def _set_app_state_value(self, key: str, value: str) -> None:
        now = utc_now_iso()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO app_state(key, value, updated_at)
                VALUES(?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    updated_at = excluded.updated_at
                """,
                (key, value, now),
            )

    def _name_set_state_key(self, book_id: str | None = None) -> str:
        bid = str(book_id or "").strip()
        if not bid:
            return APP_STATE_NAME_SET_STATE_KEY
        return f"{APP_STATE_NAME_SET_STATE_KEY}.{bid}"

    def _load_name_set_state_raw(self, *, book_id: str | None = None) -> dict[str, Any] | None:
        raw = self._get_app_state_value(self._name_set_state_key(book_id))
        if not raw:
            return None
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return None
        return None

    def _normalize_name_set_state(
        self,
        state: dict[str, Any] | None,
        *,
        default_sets: dict[str, Any] | None = None,
        active_default: str | None = None,
    ) -> dict[str, Any]:
        base_sets = (state or {}).get("sets")
        if base_sets is None:
            base_sets = default_sets if isinstance(default_sets, dict) else {}
        sets = normalize_name_sets_collection(base_sets)

        active = str((state or {}).get("active_set") or active_default or "").strip()
        if active not in sets:
            active = next(iter(sets.keys()))

        version_raw = (state or {}).get("version")
        try:
            version = max(1, int(version_raw or 1))
        except Exception:
            version = 1

        return {"sets": sets, "active_set": active, "version": version}

    def _persist_name_set_state(self, state: dict[str, Any], *, book_id: str | None = None) -> None:
        self._set_app_state_value(
            self._name_set_state_key(book_id),
            json.dumps(state, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
        )

    def get_name_set_state(
        self,
        *,
        default_sets: dict[str, Any] | None = None,
        active_default: str | None = None,
        book_id: str | None = None,
    ) -> dict[str, Any]:
        raw_state = self._load_name_set_state_raw(book_id=book_id)
        normalized = self._normalize_name_set_state(
            raw_state,
            default_sets=default_sets,
            active_default=active_default,
        )
        if raw_state is None or self._normalize_name_set_state(raw_state) != normalized:
            self._persist_name_set_state(normalized, book_id=book_id)
        return normalized

    def set_name_set_state(
        self,
        sets: dict[str, Any] | None,
        *,
        active_set: str | None = None,
        bump_version: bool = True,
        book_id: str | None = None,
    ) -> dict[str, Any]:
        current = self.get_name_set_state(book_id=book_id)
        normalized_sets = normalize_name_sets_collection(sets if isinstance(sets, dict) else current.get("sets") or {})
        desired_active = str(active_set or current.get("active_set") or "").strip()
        if desired_active not in normalized_sets:
            desired_active = next(iter(normalized_sets.keys()))
        next_version = int(current.get("version") or 1)
        if bump_version:
            next_version += 1
        final_state = {
            "sets": normalized_sets,
            "active_set": desired_active,
            "version": max(1, int(next_version)),
        }
        self._persist_name_set_state(final_state, book_id=book_id)
        return final_state

    def update_name_set_entry(
        self,
        source: str,
        target: str,
        *,
        set_name: str | None = None,
        delete: bool = False,
        book_id: str | None = None,
    ) -> dict[str, Any]:
        source_key = (source or "").strip()
        if not source_key:
            raise ValueError("Thiếu source cho entry name set.")
        if contains_name_split_delimiter(source_key):
            raise ValueError("Tên gốc không được chứa dấu tách câu (.,;:!? xuống dòng).")

        state = self.get_name_set_state(book_id=book_id)
        sets = normalize_name_sets_collection(state.get("sets") or {})
        active = str(set_name or state.get("active_set") or "").strip()
        if active not in sets:
            sets[active or "Mặc định"] = {}
            active = active or "Mặc định"

        target_value = (target or "").strip()
        if target_value and contains_name_split_delimiter(target_value):
            raise ValueError("Tên dịch không được chứa dấu tách câu (.,;:!? xuống dòng).")
        if delete or not target_value:
            sets[active].pop(source_key, None)
        else:
            sets[active][source_key] = target_value

        return self.set_name_set_state(sets, active_set=active, bump_version=True, book_id=book_id)

    def get_active_name_set(
        self,
        *,
        default_sets: dict[str, Any] | None = None,
        active_default: str | None = None,
        book_id: str | None = None,
    ) -> tuple[str, dict[str, str], int]:
        state = self.get_name_set_state(default_sets=default_sets, active_default=active_default, book_id=book_id)
        active = state["active_set"]
        sets = state["sets"]
        return active, normalize_name_set(sets.get(active) or {}), int(state.get("version") or 1)

    def _book_vp_set_key(self, book_id: str) -> str:
        bid = str(book_id or "").strip()
        if not bid:
            raise ValueError("Thiếu book_id cho VP riêng.")
        return f"{APP_STATE_BOOK_VP_SET_KEY_PREFIX}.{bid}"

    def get_book_vp_set_state(self, book_id: str) -> dict[str, Any]:
        key = self._book_vp_set_key(book_id)
        raw = self._get_app_state_value(key)
        parsed: dict[str, Any] | None = None
        if raw:
            try:
                payload = json.loads(raw)
                if isinstance(payload, dict):
                    parsed = payload
            except Exception:
                parsed = None
        entries = normalize_name_set((parsed or {}).get("entries"))
        try:
            version = max(1, int((parsed or {}).get("version") or 1))
        except Exception:
            version = 1
        state = {"entries": entries, "version": version}
        if parsed is None or normalize_name_set(parsed.get("entries")) != entries:
            self._set_app_state_value(key, json.dumps(state, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
        return state

    def get_book_vp_set(self, book_id: str) -> tuple[dict[str, str], int]:
        state = self.get_book_vp_set_state(book_id)
        return normalize_name_set(state.get("entries")), int(state.get("version") or 1)

    def set_book_vp_set_state(self, book_id: str, entries: dict[str, Any] | None, *, bump_version: bool = True) -> dict[str, Any]:
        current = self.get_book_vp_set_state(book_id)
        normalized_entries = normalize_name_set(entries if isinstance(entries, dict) else current.get("entries"))
        next_version = int(current.get("version") or 1)
        if bump_version:
            next_version += 1
        state = {"entries": normalized_entries, "version": max(1, next_version)}
        self._set_app_state_value(
            self._book_vp_set_key(book_id),
            json.dumps(state, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
        )
        return state

    def update_book_vp_entry(self, book_id: str, source: str, target: str, *, delete: bool = False) -> dict[str, Any]:
        source_key = str(source or "").strip()
        if not source_key:
            raise ValueError("Thiếu source cho VP riêng.")
        state = self.get_book_vp_set_state(book_id)
        entries = normalize_name_set(state.get("entries"))
        target_value = str(target or "").strip()
        if delete or not target_value:
            entries.pop(source_key, None)
        else:
            entries[source_key] = target_value
        return self.set_book_vp_set_state(book_id, entries, bump_version=True)

    def get_theme_active(self) -> str:
        value = self._get_app_state_value(APP_STATE_THEME_ACTIVE_KEY)
        if value:
            return value
        return "sao_dem"

    def set_theme_active(self, theme_id: str) -> None:
        self._set_app_state_value(APP_STATE_THEME_ACTIVE_KEY, str(theme_id or "").strip() or "sao_dem")

    def create_book(
        self,
        *,
        title: str,
        author: str,
        lang_source: str,
        source_type: str,
        summary: str,
        chapters: list[dict[str, str]],
        source_file_path: str = "",
    ) -> dict[str, Any]:
        created_at = utc_now_iso()
        book_seed = f"{title}|{author}|{created_at}|{source_type}"
        book_id = f"bk_{hash_text(book_seed)}"

        chapter_rows: list[tuple[Any, ...]] = []
        for idx, ch in enumerate(chapters, start=1):
            chapter_title = (ch.get("title") or f"Chương {idx}").strip() or f"Chương {idx}"
            chapter_text = (ch.get("text") or "").strip()
            chapter_id = f"ch_{hash_text(f'{book_id}|{idx}|{chapter_title}') }"
            raw_key = f"raw_{hash_text(f'{chapter_id}|{chapter_text}') }"
            self.write_cache(raw_key, lang_source, chapter_text)
            chapter_rows.append(
                (
                    chapter_id,
                    book_id,
                    idx,
                    chapter_title,
                    None,
                    raw_key,
                    None,
                    None,
                    created_at,
                    len(chapter_text),
                )
            )

        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO books(
                    book_id, title, title_vi, author, author_vi, lang_source, source_type, source_file_path,
                    cover_path, extra_link, created_at, updated_at, chapter_count, summary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    book_id,
                    title.strip() or "Untitled",
                    title.strip() if lang_source == "vi" else None,
                    author.strip(),
                    author.strip() if lang_source == "vi" else None,
                    lang_source,
                    source_type,
                    source_file_path,
                    "",
                    "",
                    created_at,
                    created_at,
                    len(chapter_rows),
                    summary,
                ),
            )
            conn.executemany(
                """
                INSERT INTO chapters(
                    chapter_id, book_id, chapter_order, title_raw, title_vi,
                    raw_key, trans_key, trans_sig, updated_at, word_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                chapter_rows,
            )

        return self.get_book_detail(book_id)

    def create_book_remote(
        self,
        *,
        title: str,
        author: str,
        lang_source: str,
        source_type: str,
        summary: str,
        chapters: list[dict[str, str]],
        source_url: str,
        source_plugin: str,
        cover_path: str = "",
        extra_link: str = "",
    ) -> dict[str, Any]:
        """
        Create a book that fetches chapter content on-demand.

        Notes:
        - Chapters are inserted with `raw_key` but without creating cache rows.
        - `remote_url` is stored in chapters for later fetch.
        """
        created_at = utc_now_iso()
        book_seed = f"{title}|{author}|{created_at}|{source_type}|{source_url}|{source_plugin}"
        book_id = f"bk_{hash_text(book_seed)}"

        chapter_rows: list[tuple[Any, ...]] = []
        for idx, ch in enumerate(chapters or [], start=1):
            chapter_title = (ch.get("title") or f"Chương {idx}").strip() or f"Chương {idx}"
            remote_url = (ch.get("remote_url") or "").strip()
            chapter_id = f"ch_{hash_text(f'{book_id}|{idx}|{chapter_title}|{remote_url}') }"
            raw_key = f"raw_{hash_text(f'{chapter_id}|{remote_url}') }"
            chapter_rows.append(
                (
                    chapter_id,
                    book_id,
                    idx,
                    chapter_title,
                    None,
                    raw_key,
                    None,
                    None,
                    created_at,
                    0,
                    remote_url,
                )
            )

        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO books(
                    book_id, title, title_vi, author, author_vi, lang_source, source_type, source_file_path,
                    source_url, source_plugin,
                    cover_path, extra_link, created_at, updated_at, chapter_count, summary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    book_id,
                    title.strip() or "Untitled",
                    title.strip() if lang_source == "vi" else None,
                    author.strip(),
                    author.strip() if lang_source == "vi" else None,
                    lang_source,
                    source_type,
                    "",
                    source_url,
                    source_plugin,
                    cover_path or "",
                    extra_link or "",
                    created_at,
                    created_at,
                    len(chapter_rows),
                    summary,
                ),
            )
            conn.executemany(
                """
                INSERT INTO chapters(
                    chapter_id, book_id, chapter_order, title_raw, title_vi,
                    raw_key, trans_key, trans_sig, updated_at, word_count, remote_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                chapter_rows,
            )

        return self.get_book_detail(book_id) or {"book_id": book_id}

    def list_books(self, *, include_session: bool = False) -> list[dict[str, Any]]:
        with self._connect() as conn:
            sql = """
                SELECT b.book_id, b.title, b.title_vi, b.author, b.lang_source, b.source_type, b.source_file_path,
                       b.source_url, b.source_plugin,
                       b.author_vi, b.cover_path, b.extra_link,
                       b.created_at, b.updated_at, b.chapter_count,
                       b.last_read_chapter_id, b.last_read_ratio, b.last_read_mode, b.theme_pref,
                       b.summary,
                       lr.chapter_order AS lr_chapter_order,
                       lr.title_raw AS lr_title_raw,
                       lr.title_vi AS lr_title_vi,
                       fc.chapter_order AS first_chapter_order,
                       fc.title_raw AS first_title_raw,
                       fc.title_vi AS first_title_vi,
                       COALESCE(dc.downloaded_chapters, 0) AS downloaded_chapters
                FROM books b
                LEFT JOIN chapters lr ON lr.chapter_id = b.last_read_chapter_id
                LEFT JOIN chapters fc ON fc.chapter_id = (
                    SELECT c.chapter_id FROM chapters c
                    WHERE c.book_id = b.book_id
                    ORDER BY c.chapter_order ASC
                    LIMIT 1
                )
                LEFT JOIN (
                    SELECT c.book_id AS book_id, COUNT(1) AS downloaded_chapters
                    FROM chapters c
                    JOIN content_cache cc ON cc.cache_key = c.raw_key
                    GROUP BY c.book_id
                ) dc ON dc.book_id = b.book_id
            """
            if not include_session:
                sql += "\nWHERE lower(COALESCE(b.source_type, '')) NOT LIKE 'vbook_session%'"
            sql += "\nORDER BY b.updated_at DESC"
            rows = conn.execute(sql).fetchall()
        output: list[dict[str, Any]] = []
        for row in rows:
            item = dict(row)
            item["title_vi"] = normalize_vi_display_text(item.get("title_vi") or "")
            item["author_vi"] = normalize_vi_display_text(item.get("author_vi") or "")
            item["title_display"] = item.get("title_vi") or item.get("title")
            item["author_display"] = item.get("author_vi") or item.get("author")
            item["lang_source"] = normalize_lang_source(item.get("lang_source") or "") or str(item.get("lang_source") or "")
            item["translation_supported"] = bool(book_supports_translation(item))
            item["is_comic"] = bool(is_book_comic(item))
            item["cover_url"] = self._book_cover_url(item)

            # Current chapter info for library card:
            # - If user chưa đọc: dùng chương đầu (first_*)
            # - Nếu đã đọc: dùng last_read (lr_*)
            if item.get("last_read_chapter_id") and item.get("lr_chapter_order"):
                cur_order = int(item.get("lr_chapter_order") or 1)
                cur_title_raw = (item.get("lr_title_raw") or "").strip()
                cur_title_vi = normalize_vi_display_text(item.get("lr_title_vi") or "")
            else:
                cur_order = int(item.get("first_chapter_order") or 1)
                cur_title_raw = (item.get("first_title_raw") or "").strip()
                cur_title_vi = normalize_vi_display_text(item.get("first_title_vi") or "")

            item["current_chapter_order"] = cur_order
            item["current_chapter_title_raw"] = cur_title_raw
            item["current_chapter_title_vi"] = cur_title_vi
            item["current_chapter_title_display"] = cur_title_vi or cur_title_raw or f"Chương {cur_order}"

            # Overall progress percent (coarse) for library UI.
            total = max(1, int(item.get("chapter_count") or 1))
            ratio = float(item.get("last_read_ratio") or 0.0)
            ratio = 0.0 if ratio < 0 else (1.0 if ratio > 1 else ratio)
            # Nếu chưa đọc (không có last_read_chapter_id): giữ 0%.
            if not item.get("last_read_chapter_id"):
                item["progress_percent"] = 0.0
            else:
                item["progress_percent"] = max(0.0, min(100.0, (((cur_order - 1) + ratio) / total) * 100.0))
            item["downloaded_chapters"] = max(0, min(total, int(item.get("downloaded_chapters") or 0)))
            output.append(item)
        return output

    def update_chapter_word_count(self, chapter_id: str, word_count: int) -> None:
        now = utc_now_iso()
        with self._connect() as conn:
            conn.execute(
                "UPDATE chapters SET word_count = ?, updated_at = ? WHERE chapter_id = ?",
                (max(0, int(word_count)), now, chapter_id),
            )

    def find_book(self, book_id: str) -> dict[str, Any] | None:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM books WHERE book_id = ?", (book_id,)).fetchone()
        return dict(row) if row else None

    def find_book_by_source(
        self,
        source_url: str,
        source_plugin: str | None = None,
        *,
        include_session: bool = True,
    ) -> dict[str, Any] | None:
        source = str(source_url or "").strip()
        plugin = str(source_plugin or "").strip()
        if not source:
            return None
        with self._connect() as conn:
            if plugin:
                sql = """
                    SELECT * FROM books
                    WHERE source_url = ? AND source_plugin = ?
                """
                params: list[Any] = [source, plugin]
                if not include_session:
                    sql += " AND lower(COALESCE(source_type, '')) NOT LIKE 'vbook_session%'"
                sql += """
                    ORDER BY updated_at DESC
                    LIMIT 1
                """
                row = conn.execute(
                    sql,
                    tuple(params),
                ).fetchone()
            else:
                sql = """
                    SELECT * FROM books
                    WHERE source_url = ?
                """
                params = [source]
                if not include_session:
                    sql += " AND lower(COALESCE(source_type, '')) NOT LIKE 'vbook_session%'"
                sql += """
                    ORDER BY updated_at DESC
                    LIMIT 1
                """
                row = conn.execute(
                    sql,
                    tuple(params),
                ).fetchone()
        return dict(row) if row else None

    def _book_cover_url(self, book: dict[str, Any] | None) -> str:
        if not book:
            return ""
        cover = (book.get("cover_path") or "").strip()
        if not cover:
            return ""
        if cover.startswith("http://") or cover.startswith("https://") or cover.startswith("data:"):
            source_type = str(book.get("source_type") or "").strip().lower()
            if source_type.startswith("vbook"):
                return build_vbook_image_proxy_path(
                    cover,
                    plugin_id=str(book.get("source_plugin") or "").strip(),
                    referer=str(book.get("source_url") or "").strip(),
                )
            return cover
        return f"/media/cover/{quote_url_path(Path(cover).name)}"

    def update_book_metadata(self, book_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        book = self.find_book(book_id)
        if not book:
            return None
        now = utc_now_iso()
        allowed = {
            "title": (payload.get("title") or "").strip(),
            "title_vi": (payload.get("title_vi") or "").strip(),
            "author": (payload.get("author") or "").strip(),
            "author_vi": (payload.get("author_vi") or "").strip(),
            "summary": (payload.get("summary") or "").strip(),
            "extra_link": (payload.get("extra_link") or "").strip(),
        }
        if "cover_path" in payload:
            allowed["cover_path"] = (payload.get("cover_path") or "").strip()

        set_parts: list[str] = []
        values: list[Any] = []
        for key, value in allowed.items():
            if key == "title" and not value:
                continue
            set_parts.append(f"{key} = ?")
            values.append(value)
        if not set_parts:
            return self.get_book_detail(book_id)
        set_parts.append("updated_at = ?")
        values.append(now)
        values.append(book_id)
        with self._connect() as conn:
            conn.execute(f"UPDATE books SET {', '.join(set_parts)} WHERE book_id = ?", tuple(values))
        return self.get_book_detail(book_id)

    def set_book_cover_upload(self, book_id: str, filename: str, content: bytes) -> dict[str, Any] | None:
        book = self.find_book(book_id)
        if not book:
            return None
        suffix = Path(filename or "cover.jpg").suffix.lower() or ".jpg"
        if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            suffix = ".jpg"
        path = COVER_DIR / f"{book_id}{suffix}"
        path.write_bytes(content)
        return self.update_book_metadata(book_id, {"cover_path": str(path)})

    def translate_book_titles(
        self,
        book_id: str,
        translator: TranslationAdapter,
        translate_mode: str,
        *,
        name_set_override: dict[str, str] | None = None,
        vp_set_override: dict[str, str] | None = None,
    ) -> None:
        book = self.find_book(book_id)
        if not book:
            return
        now = utc_now_iso()
        with self._connect() as conn:
            # Dịch tên truyện nếu cần.
            if book_supports_translation(book):
                raw_title = (book.get("title") or "").strip()
                vi_title = (book.get("title_vi") or "").strip()
                if raw_title and (not vi_title):
                    vi_title = normalize_vi_display_text(
                        translator.translate_detailed(
                            raw_title,
                            mode=translate_mode,
                            name_set_override=name_set_override,
                            vp_set_override=vp_set_override,
                        ).get("translated", "")
                    )
                elif vi_title:
                    vi_title = normalize_vi_display_text(vi_title)
                if vi_title:
                    conn.execute(
                        "UPDATE books SET title_vi = ?, updated_at = ? WHERE book_id = ?",
                        (vi_title, now, book_id),
                    )
                raw_author = (book.get("author") or "").strip()
                vi_author = (book.get("author_vi") or "").strip()
                if raw_author and (not vi_author):
                    translated_author = normalize_vi_display_text(
                        translator.translate_detailed(
                            raw_author,
                            mode=translate_mode,
                            name_set_override=name_set_override,
                            vp_set_override=vp_set_override,
                        ).get("translated", "")
                    )
                    if translated_author:
                        conn.execute(
                            "UPDATE books SET author_vi = ?, updated_at = ? WHERE book_id = ?",
                            (translated_author, now, book_id),
                        )
            # Dịch tên chương còn thiếu.
            rows = conn.execute(
                "SELECT chapter_id, title_raw, title_vi FROM chapters WHERE book_id = ? ORDER BY chapter_order",
                (book_id,),
            ).fetchall()
            for row in rows:
                raw_title = (row["title_raw"] or "").strip()
                vi_title = (row["title_vi"] or "").strip()
                if not raw_title and not vi_title:
                    continue
                if raw_title and not vi_title and book_supports_translation(book):
                    translated = normalize_vi_display_text(
                        translator.translate_detailed(
                            raw_title,
                            mode=translate_mode,
                            name_set_override=name_set_override,
                            vp_set_override=vp_set_override,
                        ).get("translated", "")
                    )
                else:
                    translated = normalize_vi_display_text(vi_title)
                if translated:
                    conn.execute(
                        "UPDATE chapters SET title_vi = ?, updated_at = ? WHERE chapter_id = ?",
                        (translated, now, row["chapter_id"]),
                    )

    def list_chapters_paged(
        self,
        book_id: str,
        *,
        page: int,
        page_size: int,
        mode: str,
        translator: TranslationAdapter,
        translate_mode: str,
        name_set_override: dict[str, str] | None = None,
        vp_set_override: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        page = max(1, int(page))
        page_size = max(1, min(200, int(page_size)))
        if mode == "trans":
            self.translate_book_titles(
                book_id,
                translator,
                translate_mode,
                name_set_override=name_set_override,
                vp_set_override=vp_set_override,
            )

        with self._connect() as conn:
            total = conn.execute("SELECT COUNT(1) AS c FROM chapters WHERE book_id = ?", (book_id,)).fetchone()["c"]
            offset = (page - 1) * page_size
            rows = conn.execute(
                """
                SELECT c.chapter_id, c.chapter_order, c.title_raw, c.title_vi, c.updated_at, c.word_count, c.trans_key,
                       CASE WHEN cc.cache_key IS NOT NULL THEN 1 ELSE 0 END AS is_downloaded
                FROM chapters c
                LEFT JOIN content_cache cc ON cc.cache_key = c.raw_key
                WHERE c.book_id = ?
                ORDER BY chapter_order ASC
                LIMIT ? OFFSET ?
                """,
                (book_id, page_size, offset),
            ).fetchall()
        items = []
        for r in rows:
            rdict = dict(r)
            rdict["title_vi"] = normalize_vi_display_text(rdict.get("title_vi") or "")
            display_title = rdict["title_vi"] if mode == "trans" and rdict.get("title_vi") else rdict["title_raw"]
            items.append(
                {
                    "chapter_id": rdict["chapter_id"],
                    "chapter_order": rdict["chapter_order"],
                    "title_raw": rdict["title_raw"],
                    "title_vi": rdict.get("title_vi"),
                    "title_display": display_title,
                    "updated_at": rdict["updated_at"],
                    "word_count": rdict["word_count"],
                    "has_trans": bool(rdict.get("trans_key")),
                    "is_downloaded": bool(int(rdict.get("is_downloaded") or 0)),
                }
            )
        total_pages = max(1, (total + page_size - 1) // page_size)
        return {
            "items": items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_items": total,
                "total_pages": total_pages,
            },
        }

    def get_chapter_rows(self, book_id: str) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT chapter_id, book_id, chapter_order, title_raw, title_vi,
                       raw_key, trans_key, trans_sig, updated_at, word_count, remote_url
                FROM chapters
                WHERE book_id = ?
                ORDER BY chapter_order ASC
                """,
                (book_id,),
            ).fetchall()
        return [dict(r) for r in rows]

    def find_chapter(self, chapter_id: str) -> dict[str, Any] | None:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM chapters WHERE chapter_id = ?", (chapter_id,)).fetchone()
        return dict(row) if row else None

    def get_book_download_map(self, book_id: str) -> dict[str, bool]:
        bid = str(book_id or "").strip()
        if not bid:
            return {}
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT c.chapter_id,
                       CASE WHEN cc.cache_key IS NOT NULL THEN 1 ELSE 0 END AS is_downloaded
                FROM chapters c
                LEFT JOIN content_cache cc ON cc.cache_key = c.raw_key
                WHERE c.book_id = ?
                ORDER BY c.chapter_order ASC
                """,
                (bid,),
            ).fetchall()
        out: dict[str, bool] = {}
        for row in rows:
            cid = str(row["chapter_id"] or "").strip()
            if not cid:
                continue
            out[cid] = bool(int(row["is_downloaded"] or 0))
        return out

    def get_book_download_counts(self, book_id: str) -> tuple[int, int]:
        bid = str(book_id or "").strip()
        if not bid:
            return (0, 0)
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT
                    COUNT(1) AS total_chapters,
                    COALESCE(SUM(CASE WHEN cc.cache_key IS NOT NULL THEN 1 ELSE 0 END), 0) AS downloaded_chapters
                FROM chapters c
                LEFT JOIN content_cache cc ON cc.cache_key = c.raw_key
                WHERE c.book_id = ?
                """,
                (bid,),
            ).fetchone()
        if not row:
            return (0, 0)
        total = int(row["total_chapters"] or 0)
        downloaded = int(row["downloaded_chapters"] or 0)
        if downloaded < 0:
            downloaded = 0
        if downloaded > total:
            downloaded = total
        return downloaded, total

    def update_chapter_trans(self, chapter_id: str, trans_key: str, trans_sig: str | None = None) -> None:
        now = utc_now_iso()
        with self._connect() as conn:
            conn.execute(
                "UPDATE chapters SET trans_key = ?, trans_sig = ?, updated_at = ? WHERE chapter_id = ?",
                (trans_key, trans_sig, now, chapter_id),
            )

    def update_book_progress(
        self,
        book_id: str,
        *,
        chapter_id: str | None,
        ratio: float | None,
        mode: str | None,
        theme_pref: str | None,
    ) -> None:
        now = utc_now_iso()
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE books SET
                    last_read_chapter_id = COALESCE(?, last_read_chapter_id),
                    last_read_ratio = COALESCE(?, last_read_ratio),
                    last_read_mode = COALESCE(?, last_read_mode),
                    theme_pref = COALESCE(?, theme_pref),
                    updated_at = ?
                WHERE book_id = ?
                """,
                (chapter_id, ratio, mode, theme_pref, now, book_id),
            )

    def get_book_detail(self, book_id: str) -> dict[str, Any] | None:
        book = self.find_book(book_id)
        if not book:
            return None
        chapters = self.get_chapter_rows(book_id)
        download_map = self.get_book_download_map(book_id)
        downloaded_count = sum(1 for v in download_map.values() if v)
        book["lang_source"] = normalize_lang_source(book.get("lang_source") or "") or str(book.get("lang_source") or "")
        book["translation_supported"] = bool(book_supports_translation(book))
        book["is_comic"] = bool(is_book_comic(book))
        book["title_vi"] = normalize_vi_display_text(book.get("title_vi") or "")
        book["author_vi"] = normalize_vi_display_text(book.get("author_vi") or "")
        book["title_display"] = book.get("title_vi") or book.get("title")
        book["author_display"] = book.get("author_vi") or book.get("author")
        book["cover_url"] = self._book_cover_url(book)
        book["chapters"] = [
            {
                "chapter_id": ch["chapter_id"],
                "chapter_order": ch["chapter_order"],
                "title_raw": ch["title_raw"],
                "title_vi": normalize_vi_display_text(ch["title_vi"] or ""),
                "title_display": normalize_vi_display_text(ch["title_vi"] or "") or ch["title_raw"],
                "updated_at": ch["updated_at"],
                "word_count": ch["word_count"],
                "has_trans": bool(ch.get("trans_key")),
                "is_downloaded": bool(download_map.get(str(ch.get("chapter_id") or "").strip(), False)),
                "remote_url": str(ch.get("remote_url") or ""),
            }
            for ch in chapters
        ]
        book["downloaded_chapters"] = int(max(0, min(int(book.get("chapter_count") or len(chapters) or 0), downloaded_count)))
        return book

    def delete_book(self, book_id: str) -> bool:
        book = self.find_book(book_id)
        chapters = self.get_chapter_rows(book_id)
        if not chapters and not book:
            return False

        content_keys = {ch["raw_key"] for ch in chapters if ch.get("raw_key")}
        content_keys.update(ch["trans_key"] for ch in chapters if ch.get("trans_key"))

        with self._connect() as conn:
            if chapters:
                conn.executemany(
                    "DELETE FROM translation_unit_map WHERE chapter_id = ?",
                    [(ch["chapter_id"],) for ch in chapters if ch.get("chapter_id")],
                )
            conn.execute("DELETE FROM chapters WHERE book_id = ?", (book_id,))
            conn.execute("DELETE FROM books WHERE book_id = ?", (book_id,))

        self._delete_cache_keys(content_keys)

        epub_file = CACHE_DIR / "epub_sources" / f"{book_id}.epub"
        if epub_file.exists():
            try:
                epub_file.unlink()
            except Exception:
                pass
        cover_path = (book or {}).get("cover_path") or ""
        if cover_path and not cover_path.startswith(("http://", "https://", "data:")):
            cp = Path(cover_path)
            if cp.exists():
                try:
                    cp.unlink()
                except Exception:
                    pass
        return True

    def cleanup_expired_history(self) -> int:
        now = utc_now_iso()
        with self._connect() as conn:
            row = conn.execute("SELECT COUNT(1) AS c FROM history_books WHERE expire_at <= ?", (now,)).fetchone()
            deleted = int((row or {"c": 0})["c"] or 0)
            if deleted:
                conn.execute("DELETE FROM history_books WHERE expire_at <= ?", (now,))
        return deleted

    def list_history_books(self) -> list[dict[str, Any]]:
        self.cleanup_expired_history()
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT history_id, plugin_id, source_url, title, author, cover_url,
                       last_read_chapter_url, last_read_chapter_title, last_read_ratio,
                       created_at, updated_at, expire_at
                FROM history_books
                ORDER BY updated_at DESC
                """
            ).fetchall()
        out: list[dict[str, Any]] = []
        for row in rows:
            item = dict(row)
            item["title"] = normalize_vbook_display_text(item.get("title") or "", single_line=True)
            item["author"] = normalize_vbook_display_text(item.get("author") or "", single_line=True)
            item["last_read_chapter_title"] = normalize_vbook_display_text(
                item.get("last_read_chapter_title") or "",
                single_line=True,
            )
            ratio = item.get("last_read_ratio")
            if isinstance(ratio, (int, float)):
                ratio_value = max(0.0, min(1.0, float(ratio)))
            else:
                ratio_value = 0.0
            item["last_read_ratio"] = ratio_value
            item["progress_percent"] = max(0.0, min(100.0, ratio_value * 100.0))
            item["cover_url"] = build_vbook_image_proxy_path(
                str(item.get("cover_url") or "").strip(),
                plugin_id=str(item.get("plugin_id") or "").strip(),
                referer=str(item.get("source_url") or "").strip(),
            )
            out.append(item)
        return out

    def get_history_book(self, history_id: str) -> dict[str, Any] | None:
        hid = str(history_id or "").strip()
        if not hid:
            return None
        self.cleanup_expired_history()
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM history_books WHERE history_id = ?", (hid,)).fetchone()
        return dict(row) if row else None

    def upsert_history_book(
        self,
        *,
        plugin_id: str,
        source_url: str,
        title: str,
        author: str = "",
        cover_url: str = "",
        last_read_chapter_url: str = "",
        last_read_chapter_title: str = "",
        last_read_ratio: float | None = None,
    ) -> dict[str, Any]:
        plugin = str(plugin_id or "").strip()
        source = str(source_url or "").strip()
        if not source:
            raise ValueError("Thiếu source_url cho lịch sử xem.")
        now_dt = datetime.now(timezone.utc)
        now = now_dt.isoformat()
        expire_at = (now_dt + timedelta(days=7)).isoformat()
        ratio_val = None
        if isinstance(last_read_ratio, (int, float)):
            ratio_val = max(0.0, min(1.0, float(last_read_ratio)))
        history_id = f"hist_{hash_text(f'{plugin}|{source}')}"
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT created_at FROM history_books
                WHERE plugin_id = ? AND source_url = ?
                LIMIT 1
                """,
                (plugin, source),
            ).fetchone()
            created_at = str(row["created_at"]) if row and row["created_at"] else now
            conn.execute(
                """
                INSERT INTO history_books(
                    history_id, plugin_id, source_url, title, author, cover_url,
                    last_read_chapter_url, last_read_chapter_title, last_read_ratio,
                    created_at, updated_at, expire_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(plugin_id, source_url) DO UPDATE SET
                    history_id = excluded.history_id,
                    title = excluded.title,
                    author = excluded.author,
                    cover_url = excluded.cover_url,
                    last_read_chapter_url = excluded.last_read_chapter_url,
                    last_read_chapter_title = excluded.last_read_chapter_title,
                    last_read_ratio = excluded.last_read_ratio,
                    updated_at = excluded.updated_at,
                    expire_at = excluded.expire_at
                """,
                (
                    history_id,
                    plugin,
                    source,
                    normalize_vbook_display_text(str(title or ""), single_line=True) or source,
                    normalize_vbook_display_text(str(author or ""), single_line=True),
                    str(cover_url or "").strip(),
                    str(last_read_chapter_url or "").strip(),
                    normalize_vbook_display_text(str(last_read_chapter_title or ""), single_line=True),
                    ratio_val,
                    created_at,
                    now,
                    expire_at,
                ),
            )
        item = self.get_history_book(history_id) or {}
        if item:
            ratio2 = item.get("last_read_ratio")
            if isinstance(ratio2, (int, float)):
                ratio2 = max(0.0, min(1.0, float(ratio2)))
            else:
                ratio2 = 0.0
            item["last_read_ratio"] = ratio2
            item["progress_percent"] = max(0.0, min(100.0, ratio2 * 100.0))
            item["cover_url"] = build_vbook_image_proxy_path(
                str(item.get("cover_url") or "").strip(),
                plugin_id=str(item.get("plugin_id") or "").strip(),
                referer=str(item.get("source_url") or "").strip(),
            )
        return item

    def delete_history_book(self, history_id: str) -> bool:
        hid = str(history_id or "").strip()
        if not hid:
            return False
        with self._connect() as conn:
            row = conn.execute("SELECT history_id FROM history_books WHERE history_id = ?", (hid,)).fetchone()
            if not row:
                return False
            conn.execute("DELETE FROM history_books WHERE history_id = ?", (hid,))
        return True

    def remove_history_by_source(self, *, plugin_id: str, source_url: str) -> int:
        plugin = str(plugin_id or "").strip()
        source = str(source_url or "").strip()
        if not source:
            return 0
        count = 0
        with self._connect() as conn:
            if plugin:
                row = conn.execute(
                    "SELECT COUNT(1) AS c FROM history_books WHERE plugin_id = ? AND source_url = ?",
                    (plugin, source),
                ).fetchone()
                plugin_count = int((row or {"c": 0})["c"] or 0)
                if plugin_count:
                    conn.execute("DELETE FROM history_books WHERE plugin_id = ? AND source_url = ?", (plugin, source))
                    count += plugin_count
            row = conn.execute(
                "SELECT COUNT(1) AS c FROM history_books WHERE source_url = ?",
                (source,),
            ).fetchone()
            source_count = int((row or {"c": 0})["c"] or 0)
            if source_count:
                conn.execute("DELETE FROM history_books WHERE source_url = ?", (source,))
                count += source_count
        return count

    def _delete_cache_keys(self, keys: set[str]) -> int:
        if not keys:
            return 0
        stats = self._delete_cache_keys_with_stats(keys)
        return int(stats.get("deleted_files") or 0)

    def _delete_cache_rows_with_stats(self, rows: list[sqlite3.Row] | list[dict[str, Any]]) -> dict[str, int]:
        deleted_files = 0
        bytes_deleted = 0
        for row in rows:
            path_raw = row["text_path"] if isinstance(row, sqlite3.Row) else row.get("text_path")
            path = Path(str(path_raw or ""))
            if not path.exists():
                continue
            try:
                bytes_deleted += int(path.stat().st_size)
            except Exception:
                pass
            try:
                path.unlink()
                deleted_files += 1
            except Exception:
                pass
        return {"deleted_files": deleted_files, "bytes_deleted": bytes_deleted}

    def _delete_cache_keys_with_stats(self, keys: set[str]) -> dict[str, int]:
        if not keys:
            return {"cache_deleted": 0, "deleted_files": 0, "bytes_deleted": 0}
        with self._connect() as conn:
            rows = conn.execute(
                f"SELECT cache_key, text_path, bytes FROM content_cache WHERE cache_key IN ({','.join('?' for _ in keys)})",
                tuple(keys),
            ).fetchall()
            conn.execute(
                f"DELETE FROM content_cache WHERE cache_key IN ({','.join('?' for _ in keys)})",
                tuple(keys),
            )
        file_stats = self._delete_cache_rows_with_stats(rows)
        return {
            "cache_deleted": int(len(rows)),
            "deleted_files": int(file_stats.get("deleted_files") or 0),
            "bytes_deleted": int(file_stats.get("bytes_deleted") or 0),
        }

    def get_content_cache_meta(self, keys: set[str] | list[str]) -> dict[str, dict[str, Any]]:
        input_keys = [str(k or "").strip() for k in (keys or []) if str(k or "").strip()]
        if not input_keys:
            return {}
        out: dict[str, dict[str, Any]] = {}
        step = 800
        with self._connect() as conn:
            for idx in range(0, len(input_keys), step):
                chunk = input_keys[idx : idx + step]
                rows = conn.execute(
                    f"SELECT cache_key, text_path, bytes FROM content_cache WHERE cache_key IN ({','.join('?' for _ in chunk)})",
                    tuple(chunk),
                ).fetchall()
                for row in rows:
                    key = str(row["cache_key"] or "").strip()
                    if not key:
                        continue
                    out[key] = {
                        "text_path": str(row["text_path"] or "").strip(),
                        "bytes": int(row["bytes"] or 0),
                    }
        return out

    def get_translation_cache_stats(self) -> dict[str, int]:
        with self._connect() as conn:
            trans_row = conn.execute(
                "SELECT COUNT(1) AS c, COALESCE(SUM(bytes),0) AS b FROM content_cache WHERE cache_key LIKE 'tr_%'"
            ).fetchone()
            tm_row = conn.execute("SELECT COUNT(1) AS c FROM translation_memory").fetchone()
            tum_row = conn.execute("SELECT COUNT(1) AS c FROM translation_unit_map").fetchone()
        return {
            "translated_cache_count": int((trans_row or {"c": 0})["c"] or 0),
            "translated_cache_bytes": int((trans_row or {"b": 0})["b"] or 0),
            "translation_memory_count": int((tm_row or {"c": 0})["c"] or 0),
            "translation_unit_map_count": int((tum_row or {"c": 0})["c"] or 0),
        }

    def clear_translated_cache(self) -> dict[str, Any]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT cache_key, text_path, bytes FROM content_cache WHERE cache_key LIKE 'tr_%'"
            ).fetchall()
            conn.execute("DELETE FROM content_cache WHERE cache_key LIKE 'tr_%'")
            tm_count = conn.execute("SELECT COUNT(1) AS c FROM translation_memory").fetchone()["c"]
            conn.execute("DELETE FROM translation_memory")
            tum_count = conn.execute("SELECT COUNT(1) AS c FROM translation_unit_map").fetchone()["c"]
            conn.execute("DELETE FROM translation_unit_map")
            conn.execute("UPDATE chapters SET trans_key = NULL, trans_sig = NULL, updated_at = ?", (utc_now_iso(),))

        file_stats = self._delete_cache_rows_with_stats(rows)
        return {
            "deleted_files": int(file_stats.get("deleted_files") or 0),
            "bytes_deleted": int(file_stats.get("bytes_deleted") or 0),
            "cache_deleted": int(len(rows)),
            "tm_deleted": int(tm_count or 0),
            "unit_map_deleted": int(tum_count or 0),
        }

    def clear_book_cache(self, book_id: str, *, clear_raw: bool = False, clear_trans: bool = False) -> dict[str, Any]:
        bid = str(book_id or "").strip()
        if not bid:
            return {
                "found": False,
                "book_id": "",
                "raw_cache_deleted": 0,
                "trans_cache_deleted": 0,
                "unit_map_deleted": 0,
                "deleted_files": 0,
                "bytes_deleted": 0,
            }
        chapters = self.get_chapter_rows(bid)
        if not chapters:
            book = self.find_book(bid)
            if not book:
                return {
                    "found": False,
                    "book_id": bid,
                    "raw_cache_deleted": 0,
                    "trans_cache_deleted": 0,
                    "unit_map_deleted": 0,
                    "deleted_files": 0,
                    "bytes_deleted": 0,
                }
        raw_keys: set[str] = set()
        trans_keys: set[str] = set()
        chapter_ids: list[str] = []
        for ch in chapters:
            if clear_raw and ch.get("raw_key"):
                raw_keys.add(str(ch.get("raw_key") or "").strip())
            if clear_trans and ch.get("trans_key"):
                trans_keys.add(str(ch.get("trans_key") or "").strip())
            if clear_trans and ch.get("chapter_id"):
                chapter_ids.append(str(ch.get("chapter_id") or "").strip())
        keys = {x for x in raw_keys.union(trans_keys) if x}
        deleted_stats = self._delete_cache_keys_with_stats(keys) if keys else {
            "cache_deleted": 0,
            "deleted_files": 0,
            "bytes_deleted": 0,
        }

        unit_map_deleted = 0
        if clear_trans and chapter_ids:
            with self._connect() as conn:
                row = conn.execute(
                    f"SELECT COUNT(1) AS c FROM translation_unit_map WHERE chapter_id IN ({','.join('?' for _ in chapter_ids)})",
                    tuple(chapter_ids),
                ).fetchone()
                unit_map_deleted = int((row or {"c": 0})["c"] or 0)
                conn.execute(
                    f"DELETE FROM translation_unit_map WHERE chapter_id IN ({','.join('?' for _ in chapter_ids)})",
                    tuple(chapter_ids),
                )
                conn.execute(
                    "UPDATE chapters SET trans_key = NULL, trans_sig = NULL, updated_at = ? WHERE book_id = ?",
                    (utc_now_iso(), bid),
                )

        return {
            "found": True,
            "book_id": bid,
            "raw_cache_deleted": int(len(raw_keys)),
            "trans_cache_deleted": int(len(trans_keys)),
            "unit_map_deleted": int(unit_map_deleted),
            "deleted_files": int(deleted_stats.get("deleted_files") or 0),
            "bytes_deleted": int(deleted_stats.get("bytes_deleted") or 0),
        }

    def clear_chapter_translated_cache(self, chapter_id: str) -> dict[str, Any]:
        chapter_key = str(chapter_id or "").strip()
        if not chapter_key:
            return {"found": False, "deleted_files": 0, "bytes_deleted": 0, "cache_deleted": 0, "unit_map_deleted": 0}

        rows: list[sqlite3.Row] = []
        unit_map_deleted = 0
        cache_deleted = 0
        with self._connect() as conn:
            chapter_row = conn.execute(
                "SELECT chapter_id, trans_key FROM chapters WHERE chapter_id = ?",
                (chapter_key,),
            ).fetchone()
            if not chapter_row:
                return {"found": False, "deleted_files": 0, "bytes_deleted": 0, "cache_deleted": 0, "unit_map_deleted": 0}

            trans_key = str(chapter_row["trans_key"] or "").strip()
            if trans_key:
                rows = conn.execute(
                    "SELECT cache_key, text_path FROM content_cache WHERE cache_key = ?",
                    (trans_key,),
                ).fetchall()
                conn.execute("DELETE FROM content_cache WHERE cache_key = ?", (trans_key,))
                cache_deleted = int(len(rows))

            unit_map_row = conn.execute(
                "SELECT COUNT(1) AS c FROM translation_unit_map WHERE chapter_id = ?",
                (chapter_key,),
            ).fetchone()
            unit_map_deleted = int((unit_map_row or {"c": 0})["c"] or 0)
            conn.execute("DELETE FROM translation_unit_map WHERE chapter_id = ?", (chapter_key,))
            conn.execute(
                "UPDATE chapters SET trans_key = NULL, trans_sig = NULL, updated_at = ? WHERE chapter_id = ?",
                (utc_now_iso(), chapter_key),
            )

        deleted_files = 0
        bytes_deleted = 0
        for row in rows:
            p = Path(row["text_path"])
            if p.exists():
                try:
                    bytes_deleted += p.stat().st_size
                    p.unlink()
                    deleted_files += 1
                except Exception:
                    pass
        return {
            "found": True,
            "deleted_files": deleted_files,
            "bytes_deleted": bytes_deleted,
            "cache_deleted": cache_deleted,
            "unit_map_deleted": unit_map_deleted,
        }

    def search(self, query: str) -> dict[str, Any]:
        key = (query or "").strip().lower()
        if not key:
            books = self.list_books()
            return {"books": books, "chapters": []}

        with self._connect() as conn:
            book_rows = conn.execute(
                """
                SELECT book_id, title, title_vi, author, author_vi, lang_source, source_type, chapter_count, updated_at, cover_path
                FROM books
                WHERE lower(COALESCE(source_type, '')) NOT LIKE 'vbook_session%'
                  AND (
                    lower(title) LIKE ? OR lower(COALESCE(title_vi,'')) LIKE ?
                    OR lower(author) LIKE ? OR lower(COALESCE(author_vi,'')) LIKE ?
                  )
                ORDER BY updated_at DESC
                """,
                (f"%{key}%", f"%{key}%", f"%{key}%", f"%{key}%"),
            ).fetchall()

            chapter_rows = conn.execute(
                """
                SELECT c.chapter_id, c.book_id, c.chapter_order, c.title_raw, c.title_vi,
                       b.title AS book_title, b.title_vi AS book_title_vi
                FROM chapters c
                JOIN books b ON b.book_id = c.book_id
                WHERE lower(COALESCE(b.source_type, '')) NOT LIKE 'vbook_session%'
                  AND (lower(c.title_raw) LIKE ? OR lower(COALESCE(c.title_vi, '')) LIKE ?)
                ORDER BY c.updated_at DESC
                LIMIT 120
                """,
                (f"%{key}%", f"%{key}%"),
            ).fetchall()

        return {
            "books": [
                {
                    **row,
                    "title_vi": normalize_vi_display_text(row.get("title_vi") or ""),
                    "author_vi": normalize_vi_display_text(row.get("author_vi") or ""),
                    "title_display": normalize_vi_display_text(row.get("title_vi") or "") or row.get("title"),
                    "author_display": normalize_vi_display_text(row.get("author_vi") or "") or row.get("author"),
                    "cover_url": self._book_cover_url(row),
                }
                for row in (dict(r) for r in book_rows)
            ],
            "chapters": [
                {
                    **row,
                    "title_vi": normalize_vi_display_text(row.get("title_vi") or ""),
                    "book_title_vi": normalize_vi_display_text(row.get("book_title_vi") or ""),
                    "title_display": normalize_vi_display_text(row.get("title_vi") or "") or row.get("title_raw"),
                    "book_title_display": normalize_vi_display_text(row.get("book_title_vi") or "") or row.get("book_title"),
                }
                for row in (dict(r) for r in chapter_rows)
            ],
        }

    def save_epub_source(self, book_id: str, content: bytes) -> str:
        folder = CACHE_DIR / "epub_sources"
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / f"{book_id}.epub"
        path.write_bytes(content)
        with self._connect() as conn:
            conn.execute(
                "UPDATE books SET source_file_path = ?, updated_at = ? WHERE book_id = ?",
                (str(path), utc_now_iso(), book_id),
            )
        return str(path)

    def create_export_txt(
        self,
        book_id: str,
        ensure_translated: bool,
        translator: TranslationAdapter,
        translate_mode: str,
        *,
        use_cached_only: bool = False,
    ) -> Path:
        book = self.find_book(book_id)
        if not book:
            raise ValueError("Không tìm thấy truyện.")
        if is_book_comic(book):
            raise ValueError("Truyện tranh không hỗ trợ xuất TXT.")
        chapters = self.get_chapter_rows(book_id)
        if not chapters:
            raise ValueError("Truyện chưa có chương.")
        _, active_name_set, _ = self.get_active_name_set(default_sets={"Mặc định": {}}, active_default="Mặc định", book_id=book_id)
        active_vp_set, _ = self.get_book_vp_set(book_id)

        output_lines: list[str] = []
        for ch in chapters:
            if use_cached_only:
                raw_cached = self.read_cache(str(ch.get("raw_key") or "").strip())
                if raw_cached is None:
                    continue
            title = ch["title_vi"] or ch["title_raw"] or f"Chương {ch['chapter_order']}"
            text = self.get_chapter_text(
                ch,
                book,
                mode="trans" if ensure_translated else "raw",
                translator=translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
                allow_remote_fetch=not use_cached_only,
            )
            output_lines.extend([title, "", text, ""])
        if not output_lines:
            raise ValueError("Không có chương đã cache để xuất TXT.")

        safe_name = self._safe_filename(book["title"])
        ts = utc_now_ts()
        out = EXPORT_DIR / f"{safe_name}_{ts}.txt"
        out.write_text("\n".join(output_lines), encoding="utf-8")
        return out

    def create_export_epub(
        self,
        book_id: str,
        ensure_translated: bool,
        translator: TranslationAdapter,
        translate_mode: str,
        *,
        use_cached_only: bool = False,
    ) -> Path:
        book = self.find_book(book_id)
        if not book:
            raise ValueError("Không tìm thấy truyện.")
        chapters = self.get_chapter_rows(book_id)
        if not chapters:
            raise ValueError("Truyện chưa có chương.")
        _, active_name_set, _ = self.get_active_name_set(default_sets={"Mặc định": {}}, active_default="Mặc định", book_id=book_id)
        active_vp_set, _ = self.get_book_vp_set(book_id)

        safe_name = self._safe_filename(book["title"])
        ts = utc_now_ts()
        out = EXPORT_DIR / f"{safe_name}_{ts}.epub"

        uid = book["book_id"]
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        files: dict[str, bytes] = {}
        files["mimetype"] = b"application/epub+zip"
        files[
            "META-INF/container.xml"
        ] = b'<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'

        manifest_items = [
            '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'
        ]
        spine_items: list[str] = []
        nav_points: list[str] = []

        for idx, ch in enumerate(chapters, start=1):
            if use_cached_only:
                raw_cached = self.read_cache(str(ch.get("raw_key") or "").strip())
                if raw_cached is None:
                    continue
            title = ch["title_vi"] or ch["title_raw"] or f"Chương {idx}"
            text = self.get_chapter_text(
                ch,
                book,
                mode="trans" if ensure_translated else "raw",
                translator=translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
                allow_remote_fetch=not use_cached_only,
            )
            content_html = "\n".join(
                f"<p>{html.escape(line)}</p>" if line.strip() else "<p><br/></p>"
                for line in text.split("\n")
            )
            xhtml_name = f"Text/chapter_{idx}.xhtml"
            xhtml = (
                "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
                '<html xmlns="http://www.w3.org/1999/xhtml">'
                f"<head><title>{html.escape(title)}</title></head>"
                f"<body><h2>{html.escape(title)}</h2>{content_html}</body></html>"
            )
            files[f"OEBPS/{xhtml_name}"] = xhtml.encode("utf-8")
            manifest_items.append(
                f'<item id="chap{idx}" href="{xhtml_name}" media-type="application/xhtml+xml"/>'
            )
            spine_items.append(f'<itemref idref="chap{idx}"/>')
            nav_points.append(
                f'<navPoint id="navPoint-{idx}" playOrder="{idx}"><navLabel><text>{html.escape(title)}</text></navLabel><content src="{xhtml_name}"/></navPoint>'
            )
        if not spine_items:
            raise ValueError("Không có chương đã cache để xuất EPUB.")

        toc_ncx = (
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
            '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">'
            "<head>"
            f'<meta name="dtb:uid" content="{html.escape(uid)}"/>'
            '<meta name="dtb:depth" content="1"/><meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/>'
            "</head>"
            f"<docTitle><text>{html.escape(book['title'])}</text></docTitle>"
            f"<navMap>{''.join(nav_points)}</navMap>"
            "</ncx>"
        )

        content_opf = (
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
            '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">'
            '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
            f"<dc:title>{html.escape(book['title'])}</dc:title>"
            "<dc:language>vi</dc:language>"
            f"<dc:identifier id=\"BookId\">{html.escape(uid)}</dc:identifier>"
            f"<dc:creator>{html.escape(book['author'] or '')}</dc:creator>"
            f"<dc:date>{now}</dc:date>"
            "</metadata>"
            f"<manifest>{''.join(manifest_items)}</manifest>"
            f"<spine toc=\"ncx\">{''.join(spine_items)}</spine>"
            "</package>"
        )

        files["OEBPS/toc.ncx"] = toc_ncx.encode("utf-8")
        files["OEBPS/content.opf"] = content_opf.encode("utf-8")

        with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("mimetype", files["mimetype"], compress_type=zipfile.ZIP_STORED)
            for path, data in files.items():
                if path == "mimetype":
                    continue
                zf.writestr(path, data)

        return out

    def get_chapter_text(
        self,
        chapter: dict[str, Any],
        book: dict[str, Any],
        *,
        mode: str,
        translator: TranslationAdapter,
        translate_mode: str,
        name_set_override: dict[str, str] | None = None,
        vp_set_override: dict[str, str] | None = None,
        allow_remote_fetch: bool = True,
    ) -> str:
        raw_key = chapter.get("raw_key")
        cached_raw = self.read_cache(raw_key) or ""
        if (
            allow_remote_fetch
            and (not cached_raw)
            and str(book.get("source_type") or "").startswith("vbook")
            and chapter.get("remote_url")
            and self.remote_chapter_fetcher
        ):
            cached_raw = self.remote_chapter_fetcher(chapter, book) or ""
        comic_payload = decode_comic_payload(cached_raw or "")
        if comic_payload is not None:
            return cached_raw or encode_comic_payload([])

        raw_text = normalize_newlines(cached_raw or "")
        if mode == "raw" or (not book_supports_translation(book)):
            return raw_text

        current_sig = translator.translation_signature(
            mode=translate_mode,
            name_set_override=name_set_override,
            vp_set_override=vp_set_override,
        )
        trans_key = chapter.get("trans_key")
        trans_sig = (chapter.get("trans_sig") or "").strip()
        if trans_key and trans_sig == current_sig:
            cached = self.read_cache(trans_key)
            if cached is not None:
                map_count = self.get_translation_unit_map_count(chapter["chapter_id"], current_sig, translate_mode)
                if map_count > 0:
                    return normalize_newlines(cached)

        detail = translator.translate_detailed(
            raw_text,
            mode=translate_mode,
            name_set_override=name_set_override,
            vp_set_override=vp_set_override,
        )
        translated = normalize_newlines(detail.get("translated") or "")
        if not translated:
            translated = raw_text

        trans_seed = f"{chapter['chapter_id']}|{chapter['raw_key']}|{current_sig}|{translated}"
        new_key = f"tr_{hash_text(trans_seed)}"
        self.write_cache(new_key, "vi", translated)
        self.update_chapter_trans(chapter["chapter_id"], new_key, current_sig)
        self.save_translation_unit_map(
            chapter["chapter_id"],
            current_sig,
            translate_mode,
            detail.get("unit_map") if isinstance(detail.get("unit_map"), list) else [],
        )
        chapter["trans_key"] = new_key
        chapter["trans_sig"] = current_sig
        return translated


class ReaderService:
    VERSION = "1.0.0"

    def __init__(self, storage: ReaderStorage):
        self.storage = storage
        self.app_config = load_app_config()
        self.translator = TranslationAdapter(self.app_config)
        self.vbook_manager: Any = None
        self.vbook_runner: Any = None
        self.vbook_runtime_global_settings: dict[str, Any] = {
            "request_delay_ms": 0,
            "download_threads": 4,
            "prefetch_unread_count": 2,
            "retry_count": 2,
        }
        self.vbook_plugin_runtime_overrides: dict[str, dict[str, Any]] = {}
        self.vbook_bridge_enabled = True
        self.vbook_bridge_cookie_fallback = True
        self.vbook_bridge_state_path = LOCAL_DIR / "browser_bridge_state.json"
        self.vbook_bridge_cookie_db_path = ROOT_DIR / "qt_browser_profile" / "storage" / "Cookies"
        self._vbook_bridge_state_cache: dict[str, Any] = {}
        self._vbook_bridge_state_mtime: float | None = None
        self.reader_translation_settings: dict[str, Any] = {"enabled": True, "mode": "server"}
        self.name_set_state: dict[str, Any] = {"sets": {"Mặc định": {}}, "active_set": "Mặc định", "version": 1}
        # Allow storage to lazy-load remote chapter content (vBook, ...).
        self.storage.remote_chapter_fetcher = self._fetch_remote_chapter
        self.refresh_config()
        try:
            self.storage.cleanup_expired_history()
        except Exception:
            pass
        self._download_lock = threading.RLock()
        self._download_cv = threading.Condition(self._download_lock)
        self._download_jobs: dict[str, dict[str, Any]] = {}
        self._download_queue: list[str] = []
        self._download_running_job_id: str | None = None
        self._download_worker_started = False
        self._download_worker_thread: threading.Thread | None = None

    def _default_name_sets(self) -> dict[str, dict[str, str]]:
        return normalize_name_sets_collection(self.app_config.get("nameSets") or {})

    def _default_active_name_set(self, default_sets: dict[str, dict[str, str]]) -> str:
        active = str(self.app_config.get("activeNameSet") or "").strip()
        if active in default_sets:
            return active
        return next(iter(default_sets.keys()))

    def refresh_config(self) -> None:
        self.app_config = load_app_config()
        self.reader_translation_settings = self._normalized_reader_translation_settings(self.app_config)
        default_sets = self._default_name_sets()
        default_active = self._default_active_name_set(default_sets)
        self.name_set_state = self.storage.get_name_set_state(
            default_sets=default_sets,
            active_default=default_active,
        )
        active_set_name = self.name_set_state["active_set"]
        active_name_set = normalize_name_set((self.name_set_state.get("sets") or {}).get(active_set_name) or {})
        self.translator = TranslationAdapter(
            self.app_config,
            active_name_set=active_name_set,
            active_set_name=active_set_name,
            name_set_version=int(self.name_set_state.get("version") or 1),
            cache_lookup_batch=self.storage.get_translation_memory_batch,
            cache_store_batch=self.storage.set_translation_memory_batch,
        )

        # vBook integration (extensions + runner)
        base_dir = runtime_base_dir()
        bundle_dir = ROOT_DIR
        vcfg = self.app_config.get("vbook") or {}
        self.vbook_runtime_global_settings = self._normalized_vbook_runtime_global_settings(vcfg)
        self.vbook_plugin_runtime_overrides = self._normalized_vbook_plugin_runtime_overrides(vcfg)
        self.vbook_bridge_enabled = bool(vcfg.get("use_browser_bridge", True))
        self.vbook_bridge_cookie_fallback = bool(vcfg.get("bridge_cookie_fallback", True))
        bridge_state_rel = str(vcfg.get("browser_bridge_state") or "local/browser_bridge_state.json").strip() or "local/browser_bridge_state.json"
        bridge_cookie_db_rel = str(vcfg.get("bridge_cookie_db_path") or "qt_browser_profile/storage/Cookies").strip() or "qt_browser_profile/storage/Cookies"
        self.vbook_bridge_state_path = resolve_existing_path(bridge_state_rel, base_dir, bundle_dir)
        self.vbook_bridge_cookie_db_path = resolve_existing_path(bridge_cookie_db_rel, base_dir, bundle_dir)
        self._vbook_bridge_state_mtime = None
        self._vbook_bridge_state_cache = {}
        try:
            extensions_dir = str(vcfg.get("extensions_dir") or "local/vbook_extensions").strip() or "local/vbook_extensions"
        except Exception:
            extensions_dir = "local/vbook_extensions"
        self.vbook_manager = vbook_ext.VBookExtensionManager(resolve_path_from_base(extensions_dir, base_dir))

        try:
            jar_rel = str(vcfg.get("runner_jar") or "tools/vbook_runner/vbook_runner.jar").strip() or "tools/vbook_runner/vbook_runner.jar"
        except Exception:
            jar_rel = "tools/vbook_runner/vbook_runner.jar"
        jar_path = resolve_existing_path(jar_rel, base_dir, bundle_dir)
        if jar_path.exists():
            runner_cfg = {
                "default_user_agent": str(vcfg.get("default_user_agent") or ""),
                "default_cookie": str(vcfg.get("default_cookie") or ""),
                "timeout_ms": int(vcfg.get("timeout_ms") or 20000),
                "request_delay_ms": int(self.vbook_runtime_global_settings.get("request_delay_ms") or 0),
                # `supplemental_code` theo plugin sẽ được inject ở per-run override.
                "supplemental_code": "",
            }
            java_bin_raw = str(vcfg.get("java_bin") or "").strip()
            java_bin = None
            if java_bin_raw:
                try:
                    resolved_java = resolve_existing_path(java_bin_raw, base_dir, bundle_dir)
                    java_bin = str(resolved_java) if resolved_java.exists() else java_bin_raw
                except Exception:
                    java_bin = java_bin_raw
            self.vbook_runner = vbook_ext.VBookRunnerClient(jar_path, runner_config=runner_cfg, java_bin=java_bin)
        else:
            self.vbook_runner = None

    def import_file(self, filename: str, file_bytes: bytes, lang_source: str, title: str, author: str) -> dict[str, Any]:
        name = filename or "imported"
        ext = name.lower().rsplit(".", 1)[-1] if "." in name else "txt"
        lang = normalize_lang_source(lang_source) or "zh"

        if ext == "epub":
            parsed_title, parsed_author, chapters = parse_epub_chapters(file_bytes, custom_title=title)
            summary = "Sách EPUB được nhập từ file cục bộ."
            created = self.storage.create_book(
                title=parsed_title,
                author=author.strip() or parsed_author,
                lang_source=lang,
                source_type="epub",
                summary=summary,
                chapters=chapters,
            )
            self.storage.save_epub_source(created["book_id"], file_bytes)
            created["epub_url"] = f"/media/epub/{created['book_id']}.epub"
            return created

        if ext != "txt":
            raise ValueError("V1 chỉ hỗ trợ import TXT và EPUB.")

        text = decode_text_with_fallback(file_bytes)
        max_chars = int((self.app_config.get("translator_settings") or {}).get("maxChars", 4500) or 4500)
        chapters = split_text_into_chapters(text, target_size=max_chars)
        if not chapters:
            raise ValueError("Không tách được chương từ file TXT.")

        final_title = (title or "").strip() or re.sub(r"\.[^.]+$", "", name) or "Untitled"
        summary = "Sách TXT được nhập và tách chương tự động."
        return self.storage.create_book(
            title=final_title,
            author=author,
            lang_source=lang,
            source_type="txt",
            summary=summary,
            chapters=chapters,
        )

    def import_vbook_url(
        self,
        url: str,
        *,
        plugin_id: str | None = None,
        history_only: bool = False,
    ) -> dict[str, Any]:
        source_url = (url or "").strip()
        if not source_url:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu URL để import.")

        plugin = self._resolve_vbook_plugin(source_url, plugin_id=plugin_id)
        existing_normal = self.storage.find_book_by_source(
            source_url,
            plugin.plugin_id,
            include_session=False,
        )
        if existing_normal:
            if not history_only:
                try:
                    self.storage.remove_history_by_source(plugin_id=plugin.plugin_id, source_url=source_url)
                except Exception:
                    pass
            return self.storage.get_book_detail(existing_normal["book_id"]) or existing_normal

        if history_only:
            existing_session = self.storage.find_book_by_source(
                source_url,
                plugin.plugin_id,
                include_session=True,
            )
            if existing_session:
                return self.storage.get_book_detail(existing_session["book_id"]) or existing_session
        detail = self._run_vbook_script(plugin, "detail", [source_url])
        toc_rows = self._fetch_vbook_toc(plugin, source_url)

        title = normalize_vbook_display_text(
            str((detail or {}).get("name") or (detail or {}).get("title") or ""),
            single_line=True,
        ) or source_url
        author = normalize_vbook_display_text(str((detail or {}).get("author") or ""), single_line=True)
        cover_path = str((detail or {}).get("cover") or "").strip()
        plugin_type = str(plugin.type or "").strip().lower()
        if history_only:
            source_type = "vbook_session_comic" if "comic" in plugin_type else "vbook_session"
        else:
            source_type = "vbook_comic" if "comic" in plugin_type else "vbook"
        summary = normalize_vbook_display_text(
            str((detail or {}).get("description") or ""),
            single_line=False,
        ) or (
            "Truyện tranh được import từ URL (vBook extension)." if "comic" in source_type else "Truyện được import từ URL (vBook extension)."
        )
        extra_link = source_url

        locale_norm = normalize_lang_source(str(plugin.locale or ""))
        if locale_norm:
            lang_source = locale_norm
        else:
            lang_source = "zh"

        chapters: list[dict[str, str]] = []
        for idx, row in enumerate(toc_rows, start=1):
            ch_title = normalize_vbook_display_text(
                str(row.get("name") or f"Chương {idx}"),
                single_line=True,
            ) or f"Chương {idx}"
            remote_url = str(row.get("remote_url") or "").strip()
            if not remote_url:
                continue
            chapters.append({"title": ch_title, "remote_url": remote_url})

        if not chapters:
            raise ApiError(
                HTTPStatus.BAD_GATEWAY,
                "VBOOK_TOC_EMPTY",
                "Không lấy được mục lục từ nguồn (vBook).",
                {"source_url": source_url, "plugin": plugin.plugin_id},
            )

        created = self.storage.create_book_remote(
            title=title,
            author=author,
            lang_source=lang_source,
            source_type=source_type,
            summary=summary,
            chapters=chapters,
            source_url=source_url,
            source_plugin=plugin.plugin_id,
            cover_path=cover_path,
            extra_link=extra_link,
        )
        if not history_only:
            try:
                self.storage.remove_history_by_source(plugin_id=plugin.plugin_id, source_url=source_url)
            except Exception:
                pass
        return created

    def reload_chapter(self, chapter_id: str) -> dict[str, Any]:
        cid = str(chapter_id or "").strip()
        if not cid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu chapter_id.")
        chapter = self.storage.find_chapter(cid)
        if not chapter:
            raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
        book = self.storage.find_book(chapter["book_id"])
        if not book:
            raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")

        source_type = str(book.get("source_type") or "").strip()
        remote_url = str(chapter.get("remote_url") or "").strip()
        reloaded_from_source = False
        if source_type.startswith("vbook") and remote_url:
            # Truyện nguồn online: reload phải fetch lại RAW trực tiếp từ nguồn.
            self._fetch_remote_chapter(chapter, book)
            reloaded_from_source = True

        cleared = self.storage.clear_chapter_translated_cache(cid)
        return {
            "ok": True,
            "chapter_id": cid,
            "book_id": str(chapter.get("book_id") or ""),
            "source_type": source_type,
            "remote_url": remote_url,
            "reloaded_from_source": reloaded_from_source,
            **cleared,
        }

    def _scan_vbook_image_cache_index(self) -> dict[str, int]:
        index: dict[str, int] = {}
        if not VBOOK_IMAGE_CACHE_DIR.exists():
            return index
        try:
            for item in VBOOK_IMAGE_CACHE_DIR.glob("*.bin"):
                key = str(item.stem or "").strip()
                if not key:
                    continue
                try:
                    index[key] = int(item.stat().st_size)
                except Exception:
                    index[key] = 0
        except Exception:
            return {}
        return index

    def _vbook_image_cache_key(self, *, image_url: str, plugin_id: str = "") -> str:
        seed = f"{str(plugin_id or '').strip()}|{str(image_url or '').strip()}"
        return hash_text(seed)

    def _collect_book_image_cache_keys(self, book: dict[str, Any], chapters: list[dict[str, Any]]) -> set[str]:
        if not is_book_comic(book):
            return set()
        plugin_id = str(book.get("source_plugin") or "").strip()
        keys: set[str] = set()
        for ch in chapters:
            raw_key = str(ch.get("raw_key") or "").strip()
            if not raw_key:
                continue
            raw_text = self.storage.read_cache(raw_key) or ""
            payload = decode_comic_payload(raw_text)
            image_rows: list[str] = []
            if payload is not None:
                image_rows = [str(x).strip() for x in (payload.get("images") or []) if str(x).strip()]
            else:
                lines = [line.strip() for line in str(raw_text or "").splitlines() if line.strip()]
                if lines and all(line.startswith("http://") or line.startswith("https://") for line in lines):
                    image_rows = lines
            for image_url in image_rows:
                url = str(image_url or "").strip()
                if not url:
                    continue
                keys.add(self._vbook_image_cache_key(image_url=url, plugin_id=plugin_id))
        return keys

    def _clear_book_image_cache(self, book: dict[str, Any], chapters: list[dict[str, Any]]) -> dict[str, int]:
        keys = self._collect_book_image_cache_keys(book, chapters)
        deleted = 0
        bytes_deleted = 0
        for key in keys:
            body = VBOOK_IMAGE_CACHE_DIR / f"{key}.bin"
            meta = VBOOK_IMAGE_CACHE_DIR / f"{key}.json"
            if body.exists():
                try:
                    bytes_deleted += int(body.stat().st_size)
                except Exception:
                    pass
                try:
                    body.unlink()
                    deleted += 1
                except Exception:
                    pass
            if meta.exists():
                try:
                    meta.unlink()
                except Exception:
                    pass
        return {
            "image_cache_keys": int(len(keys)),
            "image_cache_deleted": int(deleted),
            "image_bytes_deleted": int(bytes_deleted),
        }

    def get_cache_summary(self) -> dict[str, Any]:
        books = self.storage.list_books(include_session=True)
        image_index = self._scan_vbook_image_cache_index()
        global_stats = self.storage.get_translation_cache_stats()
        items: list[dict[str, Any]] = []

        for book in books:
            bid = str(book.get("book_id") or "").strip()
            if not bid:
                continue
            chapters = self.storage.get_chapter_rows(bid)
            chapter_total = int(book.get("chapter_count") or len(chapters) or 0)
            raw_keys = [str(ch.get("raw_key") or "").strip() for ch in chapters if str(ch.get("raw_key") or "").strip()]
            trans_keys = [str(ch.get("trans_key") or "").strip() for ch in chapters if str(ch.get("trans_key") or "").strip()]
            cache_meta = self.storage.get_content_cache_meta(set(raw_keys + trans_keys))
            raw_cached = [k for k in raw_keys if k in cache_meta]
            trans_cached = [k for k in trans_keys if k in cache_meta]
            raw_bytes = sum(int((cache_meta.get(k) or {}).get("bytes") or 0) for k in raw_cached)
            trans_bytes = sum(int((cache_meta.get(k) or {}).get("bytes") or 0) for k in trans_cached)

            image_keys = self._collect_book_image_cache_keys(book, chapters)
            image_cached = [k for k in image_keys if k in image_index]
            image_bytes = sum(int(image_index.get(k) or 0) for k in image_cached)

            items.append(
                {
                    "book_id": bid,
                    "title": str(book.get("title") or ""),
                    "title_display": str(book.get("title_display") or book.get("title") or ""),
                    "author_display": str(book.get("author_display") or book.get("author") or ""),
                    "cover_url": str(book.get("cover_url") or ""),
                    "is_comic": bool(book.get("is_comic")),
                    "chapter_count": chapter_total,
                    "cached_raw_chapters": int(len(raw_cached)),
                    "cached_trans_chapters": int(len(trans_cached)),
                    "cached_image_count": int(len(image_cached)),
                    "raw_bytes": int(raw_bytes),
                    "trans_bytes": int(trans_bytes),
                    "image_bytes": int(image_bytes),
                }
            )

        return {
            "ok": True,
            "global": global_stats,
            "books": items,
        }

    def manage_cache(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(payload, dict):
            payload = {}
        action = str(payload.get("action") or "").strip().lower()
        if action in {"clear_translation_global", "clear_global_translation", "global_trans"}:
            result = self.storage.clear_translated_cache()
            return {"ok": True, "action": "clear_global_translation", **result}

        if action not in {"clear_book_raw", "clear_book_trans", "clear_book_images", "clear_book_all"}:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "action cache không hợp lệ.")
        book_ids_raw = payload.get("book_ids")
        if not isinstance(book_ids_raw, list):
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "book_ids phải là mảng.")
        book_ids: list[str] = []
        seen: set[str] = set()
        for raw in book_ids_raw:
            bid = str(raw or "").strip()
            if not bid or bid in seen:
                continue
            seen.add(bid)
            book_ids.append(bid)
        if not book_ids:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Chưa chọn truyện để xóa cache.")

        result_items: list[dict[str, Any]] = []
        total = {
            "raw_cache_deleted": 0,
            "trans_cache_deleted": 0,
            "unit_map_deleted": 0,
            "deleted_files": 0,
            "bytes_deleted": 0,
            "image_cache_keys": 0,
            "image_cache_deleted": 0,
            "image_bytes_deleted": 0,
        }

        for bid in book_ids:
            book = self.storage.find_book(bid)
            chapters = self.storage.get_chapter_rows(bid)
            if not book:
                result_items.append({"book_id": bid, "found": False})
                continue
            clear_raw = action in {"clear_book_raw", "clear_book_all"}
            clear_trans = action in {"clear_book_trans", "clear_book_all"}
            cache_stats = self.storage.clear_book_cache(bid, clear_raw=clear_raw, clear_trans=clear_trans)
            image_stats = {"image_cache_keys": 0, "image_cache_deleted": 0, "image_bytes_deleted": 0}
            if action in {"clear_book_images", "clear_book_all"}:
                image_stats = self._clear_book_image_cache(book, chapters)
            item = {
                "book_id": bid,
                "found": True,
                **cache_stats,
                **image_stats,
            }
            result_items.append(item)
            for key in total.keys():
                total[key] += int(item.get(key) or 0)

        return {
            "ok": True,
            "action": action,
            "items": result_items,
            "summary": total,
        }

    def upsert_history_book(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(payload, dict):
            payload = {}
        source_url = str(payload.get("source_url") or payload.get("url") or "").strip()
        if not source_url:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu source_url.")
        plugin_id = str(payload.get("plugin_id") or "").strip()
        if (not plugin_id) and self.vbook_manager:
            try:
                plugin = self.vbook_manager.detect_plugin_for_url(source_url)
                if plugin:
                    plugin_id = str(getattr(plugin, "plugin_id", "") or "").strip()
            except Exception:
                plugin_id = ""
        title = str(payload.get("title_raw") or payload.get("title") or "").strip() or source_url
        author = str(payload.get("author_raw") or payload.get("author") or "").strip()
        cover_url = str(payload.get("cover_url") or "").strip()
        chapter_url = str(payload.get("last_read_chapter_url") or "").strip()
        chapter_title = str(payload.get("last_read_chapter_title_raw") or payload.get("last_read_chapter_title") or "").strip()
        ratio = payload.get("last_read_ratio")
        ratio_value = float(ratio) if isinstance(ratio, (int, float)) else None
        try:
            return self.storage.upsert_history_book(
                plugin_id=plugin_id,
                source_url=source_url,
                title=title,
                author=author,
                cover_url=cover_url,
                last_read_chapter_url=chapter_url,
                last_read_chapter_title=chapter_title,
                last_read_ratio=ratio_value,
            )
        except ValueError as exc:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", str(exc)) from exc

    def delete_history_book(self, history_id: str) -> bool:
        return self.storage.delete_history_book(history_id)

    def _reader_translation_cfg(self, cfg: dict[str, Any] | None = None) -> dict[str, Any]:
        raw_cfg = cfg if isinstance(cfg, dict) else self.app_config
        payload = raw_cfg.get("reader_translation") if isinstance(raw_cfg, dict) else {}
        return payload if isinstance(payload, dict) else {}

    def _parse_bool(self, value: Any, default: bool = True) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(int(value))
        text = str(value or "").strip().lower()
        if not text:
            return bool(default)
        if text in {"1", "true", "yes", "on", "enable", "enabled"}:
            return True
        if text in {"0", "false", "no", "off", "disable", "disabled"}:
            return False
        return bool(default)

    def _normalize_translate_mode(self, value: Any, default: str = "server") -> str:
        mode = str(value or "").strip().lower()
        if mode in {"server", "local", "hanviet"}:
            return mode
        if default in {"local", "hanviet"}:
            return default
        return "server"

    def _normalized_global_local_dicts(self, value: Any) -> dict[str, dict[str, str]]:
        raw = value if isinstance(value, dict) else {}
        return {
            "name": normalize_name_set(raw.get("name")),
            "vp": normalize_name_set(raw.get("vp")),
        }

    def _normalized_reader_translation_settings(self, cfg: dict[str, Any] | None = None) -> dict[str, Any]:
        payload = self._reader_translation_cfg(cfg)
        local_payload = payload.get("local") if isinstance(payload, dict) else {}
        if not isinstance(local_payload, dict):
            local_payload = {}
        global_dicts = self._normalized_global_local_dicts(payload.get("global_dicts"))
        merged_local = dict(local_payload)
        merged_local["global_name_overrides"] = dict(global_dicts.get("name") or {})
        merged_local["global_vp_overrides"] = dict(global_dicts.get("vp") or {})
        return {
            "enabled": self._parse_bool(payload.get("enabled"), True),
            "mode": self._normalize_translate_mode(payload.get("mode"), "server"),
            "local": vbook_local_translate.normalize_local_settings(
                merged_local,
                default_base_dir="reader_ui/translate/vbook_local",
            ),
            "global_dicts": global_dicts,
        }

    def get_reader_settings(self) -> dict[str, Any]:
        local_settings = self.reader_translation_settings.get("local")
        if not isinstance(local_settings, dict):
            local_settings = vbook_local_translate.normalize_local_settings(
                {},
                default_base_dir="reader_ui/translate/vbook_local",
            )
        return {
            "ok": True,
            "translation": {
                "enabled": bool(self.reader_translation_settings.get("enabled", True)),
                "mode": self._normalize_translate_mode(self.reader_translation_settings.get("mode"), "server"),
                "local": local_settings,
                "global_dicts": self._normalized_global_local_dicts(
                    self.reader_translation_settings.get("global_dicts")
                ),
            },
        }

    def set_reader_settings(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(payload, dict):
            payload = {}
        translation_payload = payload.get("translation")
        if isinstance(translation_payload, dict):
            patch = translation_payload
        else:
            patch = payload

        cfg = load_app_config()
        if not isinstance(cfg, dict):
            cfg = {}
        existing = self._normalized_reader_translation_settings(cfg)
        patch_local = patch.get("local")
        patch_global_dicts = patch.get("global_dicts")
        if isinstance(patch_local, dict):
            merged_local = dict(existing.get("local") or {})
            merged_local.update(patch_local)
        else:
            merged_local = existing.get("local") or {}
        merged_global_dicts = self._normalized_global_local_dicts(existing.get("global_dicts"))
        if isinstance(patch_global_dicts, dict):
            for key in ("name", "vp"):
                if key in patch_global_dicts:
                    merged_global_dicts[key] = normalize_name_set(patch_global_dicts.get(key))
        local_with_global = dict(merged_local)
        local_with_global["global_name_overrides"] = dict(merged_global_dicts.get("name") or {})
        local_with_global["global_vp_overrides"] = dict(merged_global_dicts.get("vp") or {})
        next_settings = {
            "enabled": self._parse_bool(patch.get("enabled"), existing["enabled"]),
            "mode": self._normalize_translate_mode(patch.get("mode"), existing["mode"]),
            "local": vbook_local_translate.normalize_local_settings(
                local_with_global,
                default_base_dir="reader_ui/translate/vbook_local",
            ),
            "global_dicts": merged_global_dicts,
        }
        cfg["reader_translation"] = next_settings
        save_app_config(cfg)
        try:
            vbook_local_translate.clear_bundle_cache()
        except Exception:
            pass
        self.refresh_config()
        return self.get_reader_settings()

    def get_local_global_dicts(self) -> dict[str, dict[str, str]]:
        return self._normalized_global_local_dicts(self.reader_translation_settings.get("global_dicts"))

    def set_local_global_dicts(
        self,
        *,
        name: dict[str, Any] | None = None,
        vp: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        current = self.get_local_global_dicts()
        next_dicts = {
            "name": normalize_name_set(name) if isinstance(name, dict) else dict(current.get("name") or {}),
            "vp": normalize_name_set(vp) if isinstance(vp, dict) else dict(current.get("vp") or {}),
        }
        cfg = load_app_config()
        if not isinstance(cfg, dict):
            cfg = {}
        reader_cfg = cfg.get("reader_translation") if isinstance(cfg.get("reader_translation"), dict) else {}
        reader_cfg = dict(reader_cfg)
        reader_cfg["global_dicts"] = next_dicts
        cfg["reader_translation"] = reader_cfg
        save_app_config(cfg)
        try:
            vbook_local_translate.clear_bundle_cache()
        except Exception:
            pass
        self.refresh_config()
        return {"ok": True, "global_dicts": self.get_local_global_dicts()}

    def get_book_local_dicts(self, book_id: str) -> dict[str, Any]:
        _, name_entries, name_version = self.storage.get_active_name_set(
            default_sets=self._default_name_sets(),
            active_default=self._default_active_name_set(self._default_name_sets()),
            book_id=book_id,
        )
        vp_entries, vp_version = self.storage.get_book_vp_set(book_id)
        return {
            "ok": True,
            "book_id": book_id,
            "name": name_entries,
            "vp": vp_entries,
            "name_version": name_version,
            "vp_version": vp_version,
        }

    def update_local_dict_entry(
        self,
        *,
        dict_type: str,
        scope: str,
        source: str,
        target: str,
        delete: bool = False,
        book_id: str | None = None,
        set_name: str | None = None,
    ) -> dict[str, Any]:
        kind = str(dict_type or "").strip().lower()
        if kind not in {"name", "vp"}:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "dict_type phải là name hoặc vp.")
        src = str(source or "").strip()
        dst = str(target or "").strip()
        if not src:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu source cho entry.")

        if kind == "name":
            if contains_name_split_delimiter(src):
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Tên gốc không được chứa dấu tách câu.")
            if dst and contains_name_split_delimiter(dst):
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Tên dịch không được chứa dấu tách câu.")

        sc = str(scope or "book").strip().lower()
        if sc not in {"global", "book"}:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "scope phải là global hoặc book.")

        if sc == "global":
            current = self.get_local_global_dicts()
            key = "name" if kind == "name" else "vp"
            entries = dict(current.get(key) or {})
            if delete or not dst:
                entries.pop(src, None)
            else:
                entries[src] = dst
            if key == "name":
                return self.set_local_global_dicts(name=entries, vp=current.get("vp"))
            return self.set_local_global_dicts(name=current.get("name"), vp=entries)

        bid = str(book_id or "").strip()
        if not bid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id cho scope book.")
        if kind == "name":
            state = self.storage.update_name_set_entry(
                src,
                dst,
                set_name=set_name,
                delete=delete,
                book_id=bid,
            )
            self.refresh_config()
            return {"ok": True, "book_id": bid, "scope": "book", "dict_type": "name", **state}
        state = self.storage.update_book_vp_entry(
            bid,
            src,
            dst,
            delete=delete,
        )
        return {"ok": True, "book_id": bid, "scope": "book", "dict_type": "vp", **state}

    def is_reader_translation_enabled(self) -> bool:
        return bool(self.reader_translation_settings.get("enabled", True))

    def reader_translation_mode(self) -> str:
        return self._normalize_translate_mode(self.reader_translation_settings.get("mode"), "server")

    def resolve_translate_mode(self, preferred: Any = None) -> str:
        return self._normalize_translate_mode(preferred, self.reader_translation_mode())

    def translation_allowed_for_book(self, book: dict[str, Any] | None) -> bool:
        return bool(self.is_reader_translation_enabled() and book_supports_translation(book))

    def _contains_cjk_text(self, text: str) -> bool:
        return bool(re.search(r"[\u3400-\u9fff]", str(text or "")))

    def _translate_ui_text(self, text: str, *, single_line: bool = False, mode: str | None = None) -> str:
        value = normalize_vbook_display_text(text or "", single_line=False)
        if not value:
            return ""
        if not self.is_reader_translation_enabled():
            return normalize_vbook_display_text(value, single_line=single_line)
        if not self._contains_cjk_text(value):
            return normalize_vbook_display_text(value, single_line=single_line)
        try:
            translate_mode = self.resolve_translate_mode(mode)
            translated = self.translator.translate_detailed(value, mode=translate_mode).get("translated") or value
            translated = normalize_vi_display_text(translated)
            return normalize_vbook_display_text(translated, single_line=single_line) or normalize_vbook_display_text(
                value,
                single_line=single_line,
            )
        except Exception:
            return normalize_vbook_display_text(value, single_line=single_line)

    def _apply_book_card_translation(self, item: dict[str, Any]) -> dict[str, Any]:
        out = dict(item or {})
        is_zh = is_lang_zh(str(out.get("lang_source") or ""))
        can_translate = bool((not is_book_comic(out)) and is_zh and self.is_reader_translation_enabled())
        out["translation_supported"] = can_translate
        raw_title = normalize_vbook_display_text(str(out.get("title") or ""), single_line=True)
        raw_author = normalize_vbook_display_text(str(out.get("author") or ""), single_line=True)
        vi_title = normalize_vi_display_text(out.get("title_vi") or "")
        vi_author = normalize_vi_display_text(out.get("author_vi") or "")
        if can_translate:
            out["title_display"] = vi_title or self._translate_ui_text(raw_title, single_line=True)
            out["author_display"] = vi_author or self._translate_ui_text(raw_author, single_line=True)
            cur_raw = normalize_vbook_display_text(str(out.get("current_chapter_title_raw") or ""), single_line=True)
            cur_vi = normalize_vi_display_text(out.get("current_chapter_title_vi") or "")
            out["current_chapter_title_display"] = cur_vi or self._translate_ui_text(cur_raw, single_line=True) or cur_raw
        else:
            out["title_display"] = raw_title or vi_title
            out["author_display"] = raw_author or vi_author
            cur_raw = normalize_vbook_display_text(str(out.get("current_chapter_title_raw") or ""), single_line=True)
            cur_vi = normalize_vi_display_text(out.get("current_chapter_title_vi") or "")
            out["current_chapter_title_display"] = cur_raw or cur_vi
        return out

    def list_books(self) -> list[dict[str, Any]]:
        items = self.storage.list_books()
        return [self._apply_book_card_translation(x) for x in items]

    def search(self, query: str) -> dict[str, Any]:
        data = self.storage.search(query)
        books = [self._apply_book_card_translation(x) for x in (data.get("books") or [])]
        chapters_raw = data.get("chapters") or []
        chapters: list[dict[str, Any]] = []
        allow = self.is_reader_translation_enabled()
        for row in chapters_raw:
            item = dict(row or {})
            is_zh = is_lang_zh(str(item.get("lang_source") or "zh"))
            title_raw = normalize_vbook_display_text(str(item.get("title_raw") or ""), single_line=True)
            title_vi = normalize_vi_display_text(item.get("title_vi") or "")
            book_title_raw = normalize_vbook_display_text(str(item.get("book_title") or ""), single_line=True)
            book_title_vi = normalize_vi_display_text(item.get("book_title_vi") or "")
            if allow and is_zh:
                item["title_display"] = title_vi or self._translate_ui_text(title_raw, single_line=True) or title_raw
                item["book_title_display"] = book_title_vi or self._translate_ui_text(book_title_raw, single_line=True) or book_title_raw
            else:
                item["title_display"] = title_raw or title_vi
                item["book_title_display"] = book_title_raw or book_title_vi
            chapters.append(item)
        return {"books": books, "chapters": chapters}

    def list_history_books(self) -> list[dict[str, Any]]:
        items = self.storage.list_history_books()
        allow = self.is_reader_translation_enabled()
        if not allow:
            return items
        out: list[dict[str, Any]] = []
        for row in items:
            item = dict(row)
            item["title"] = self._translate_ui_text(item.get("title") or "", single_line=True) or (item.get("title") or "")
            item["author"] = self._translate_ui_text(item.get("author") or "", single_line=True) or (item.get("author") or "")
            item["last_read_chapter_title"] = self._translate_ui_text(
                item.get("last_read_chapter_title") or "",
                single_line=True,
            ) or (item.get("last_read_chapter_title") or "")
            out.append(item)
        return out

    def _download_status_is_active(self, status: str) -> bool:
        return str(status or "").strip().lower() in {"queued", "running"}

    def _download_status_is_final(self, status: str) -> bool:
        return str(status or "").strip().lower() in {"completed", "stopped", "failed"}

    def _download_start_worker_locked(self) -> None:
        if self._download_worker_started and self._download_worker_thread and self._download_worker_thread.is_alive():
            return
        worker = threading.Thread(
            target=self._download_worker_loop,
            name="ReaderDownloadWorker",
            daemon=True,
        )
        worker.start()
        self._download_worker_thread = worker
        self._download_worker_started = True

    def _download_parse_ts(self, value: Any) -> float:
        raw = str(value or "").strip()
        if not raw:
            return 0.0
        try:
            if raw.endswith("Z"):
                raw = raw[:-1] + "+00:00"
            return float(datetime.fromisoformat(raw).timestamp())
        except Exception:
            return 0.0

    def _refresh_download_job_counts_locked(self, job: dict[str, Any]) -> None:
        chapter_ids = [str(x or "").strip() for x in (job.get("chapter_ids") or []) if str(x or "").strip()]
        total = len(chapter_ids)
        downloaded = 0
        book_id = str(job.get("book_id") or "").strip()
        if book_id and chapter_ids:
            downloaded_map = self.storage.get_book_download_map(book_id)
            downloaded = sum(1 for cid in chapter_ids if downloaded_map.get(cid))
        if downloaded < 0:
            downloaded = 0
        if downloaded > total:
            downloaded = total
        job["total_chapters"] = int(total)
        job["downloaded_chapters"] = int(downloaded)
        job["progress"] = float(downloaded / total) if total > 0 else 1.0

    def _serialize_download_job_locked(self, job: dict[str, Any], queue_positions: dict[str, int] | None = None) -> dict[str, Any]:
        jid = str(job.get("job_id") or "").strip()
        payload = {
            "job_id": jid,
            "type": str(job.get("type") or "book"),
            "status": str(job.get("status") or "queued"),
            "message": str(job.get("message") or ""),
            "book_id": str(job.get("book_id") or ""),
            "book_title": str(job.get("book_title") or ""),
            "source_plugin": str(job.get("source_plugin") or ""),
            "source_type": str(job.get("source_type") or ""),
            "total_chapters": int(job.get("total_chapters") or 0),
            "downloaded_chapters": int(job.get("downloaded_chapters") or 0),
            "failed_chapters": int(job.get("failed_chapters") or 0),
            "progress": float(job.get("progress") or 0.0),
            "created_at": str(job.get("created_at") or ""),
            "updated_at": str(job.get("updated_at") or ""),
            "started_at": str(job.get("started_at") or ""),
            "finished_at": str(job.get("finished_at") or ""),
            "chapter_ids": list(job.get("chapter_ids") or []),
            "current_chapter_id": str(job.get("current_chapter_id") or ""),
            "queue_position": 0,
        }
        if queue_positions is not None and payload["status"] == "queued":
            payload["queue_position"] = int(queue_positions.get(jid) or 0)
        return payload

    def _cleanup_download_jobs_locked(self) -> None:
        now_ts = time.time()
        keep_seconds = 180.0
        remove_ids: list[str] = []
        for jid, job in self._download_jobs.items():
            status = str(job.get("status") or "")
            if not self._download_status_is_final(status):
                continue
            updated_ts = self._download_parse_ts(job.get("updated_at"))
            if updated_ts <= 0:
                updated_ts = self._download_parse_ts(job.get("created_at"))
            if updated_ts <= 0:
                updated_ts = now_ts
            if (now_ts - updated_ts) >= keep_seconds:
                remove_ids.append(jid)
        if not remove_ids:
            return
        remove_set = set(remove_ids)
        self._download_queue = [x for x in self._download_queue if x not in remove_set]
        for jid in remove_ids:
            self._download_jobs.pop(jid, None)
            if self._download_running_job_id == jid:
                self._download_running_job_id = None

    def _create_download_job_locked(
        self,
        *,
        job_type: str,
        book: dict[str, Any],
        chapter_ids: list[str],
        message: str,
    ) -> dict[str, Any]:
        now = utc_now_iso()
        book_id = str(book.get("book_id") or "").strip()
        seed = f"{book_id}|{job_type}|{now}|{uuid.uuid4().hex}"
        job_id = f"dl_{hash_text(seed)}"
        job = {
            "job_id": job_id,
            "type": str(job_type or "book").strip() or "book",
            "status": "queued",
            "message": str(message or "Đang chờ tải."),
            "book_id": book_id,
            "book_title": normalize_vbook_display_text(str(book.get("title_display") or book.get("title") or ""), single_line=True),
            "source_plugin": str(book.get("source_plugin") or "").strip(),
            "source_type": str(book.get("source_type") or "").strip(),
            "chapter_ids": [str(x or "").strip() for x in chapter_ids if str(x or "").strip()],
            "total_chapters": 0,
            "downloaded_chapters": 0,
            "failed_chapters": 0,
            "progress": 0.0,
            "created_at": now,
            "updated_at": now,
            "started_at": "",
            "finished_at": "",
            "current_chapter_id": "",
            "last_error": "",
            "_stop_event": threading.Event(),
        }
        self._refresh_download_job_counts_locked(job)
        self._download_jobs[job_id] = job
        self._download_queue.append(job_id)
        self._download_start_worker_locked()
        self._download_cv.notify_all()
        return job

    def list_download_jobs(self, *, active_only: bool = True) -> dict[str, Any]:
        with self._download_cv:
            self._cleanup_download_jobs_locked()
            queue_positions = {jid: idx + 1 for idx, jid in enumerate(self._download_queue)}
            items: list[dict[str, Any]] = []
            for job in self._download_jobs.values():
                status = str(job.get("status") or "").strip().lower()
                if active_only and (not self._download_status_is_active(status)):
                    continue
                self._refresh_download_job_counts_locked(job)
                items.append(self._serialize_download_job_locked(job, queue_positions=queue_positions))
            items.sort(
                key=lambda x: (
                    0 if x.get("status") == "running" else (1 if x.get("status") == "queued" else 2),
                    int(x.get("queue_position") or 0) if x.get("status") == "queued" else 0,
                    x.get("created_at") or "",
                )
            )
        return {
            "ok": True,
            "items": items,
            "count": len(items),
        }

    def _download_pick_chapters_by_range(
        self,
        chapter_rows: list[dict[str, Any]],
        *,
        chapter_ids: list[str] | None = None,
        start_order: int | None = None,
        end_order: int | None = None,
    ) -> list[str]:
        if not chapter_rows:
            return []
        if isinstance(chapter_ids, list) and chapter_ids:
            wanted = {str(x or "").strip() for x in chapter_ids if str(x or "").strip()}
            out = [str(row.get("chapter_id") or "").strip() for row in chapter_rows if str(row.get("chapter_id") or "").strip() in wanted]
            return [x for x in out if x]

        total = len(chapter_rows)
        start = int(start_order) if isinstance(start_order, int) else 1
        end = int(end_order) if isinstance(end_order, int) else total
        if start < 1:
            start = 1
        if end < 1:
            end = 1
        if end > total:
            end = total
        if start > end:
            start, end = end, start
        out: list[str] = []
        for row in chapter_rows:
            try:
                order = int(row.get("chapter_order") or 0)
            except Exception:
                order = 0
            if order < start or order > end:
                continue
            cid = str(row.get("chapter_id") or "").strip()
            if cid:
                out.append(cid)
        return out

    def _find_active_download_job_locked(self, *, book_id: str, chapter_ids: list[str]) -> dict[str, Any] | None:
        target_ids = {str(x or "").strip() for x in chapter_ids if str(x or "").strip()}
        if not target_ids:
            return None
        for job in self._download_jobs.values():
            status = str(job.get("status") or "").strip().lower()
            if not self._download_status_is_active(status):
                continue
            if str(job.get("book_id") or "").strip() != book_id:
                continue
            existing_ids = {str(x or "").strip() for x in (job.get("chapter_ids") or []) if str(x or "").strip()}
            if target_ids.issubset(existing_ids):
                self._refresh_download_job_counts_locked(job)
                return job
        return None

    def enqueue_book_download(self, book_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        bid = str(book_id or "").strip()
        if not bid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
        body = payload if isinstance(payload, dict) else {}
        book = self.storage.find_book(bid)
        if not book:
            raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        chapter_rows = self.storage.get_chapter_rows(bid)
        if not chapter_rows:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Truyện chưa có chương để tải.")

        chapter_ids_payload = body.get("chapter_ids")
        chapter_ids_input = chapter_ids_payload if isinstance(chapter_ids_payload, list) else None
        start_order = body.get("start_order")
        end_order = body.get("end_order")
        try:
            start_order_int = int(start_order) if start_order is not None and str(start_order).strip() else None
        except Exception:
            start_order_int = None
        try:
            end_order_int = int(end_order) if end_order is not None and str(end_order).strip() else None
        except Exception:
            end_order_int = None

        selected_ids = self._download_pick_chapters_by_range(
            chapter_rows,
            chapter_ids=chapter_ids_input,
            start_order=start_order_int,
            end_order=end_order_int,
        )
        if not selected_ids:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Không có chương hợp lệ để tải.")

        downloaded_map = self.storage.get_book_download_map(bid)
        already = sum(1 for cid in selected_ids if downloaded_map.get(cid))
        if already >= len(selected_ids):
            return {
                "ok": True,
                "already_downloaded": True,
                "book_id": bid,
                "downloaded_chapters": int(already),
                "total_chapters": int(len(selected_ids)),
            }

        with self._download_cv:
            self._cleanup_download_jobs_locked()
            existing = self._find_active_download_job_locked(book_id=bid, chapter_ids=selected_ids)
            if existing is not None:
                return {"ok": True, "deduped": True, "job": self._serialize_download_job_locked(existing)}
            job = self._create_download_job_locked(
                job_type="book",
                book=book,
                chapter_ids=selected_ids,
                message="Đã thêm vào hàng chờ tải truyện.",
            )
            return {"ok": True, "job": self._serialize_download_job_locked(job)}

    def enqueue_chapter_download(self, chapter_id: str) -> dict[str, Any]:
        cid = str(chapter_id or "").strip()
        if not cid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu chapter_id.")
        chapter = self.storage.find_chapter(cid)
        if not chapter:
            raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
        book_id = str(chapter.get("book_id") or "").strip()
        book = self.storage.find_book(book_id)
        if not book:
            raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        raw_key = str(chapter.get("raw_key") or "").strip()
        if raw_key and (self.storage.read_cache(raw_key) is not None):
            return {
                "ok": True,
                "already_downloaded": True,
                "book_id": book_id,
                "chapter_id": cid,
            }
        with self._download_cv:
            self._cleanup_download_jobs_locked()
            existing = self._find_active_download_job_locked(book_id=book_id, chapter_ids=[cid])
            if existing is not None:
                return {"ok": True, "deduped": True, "job": self._serialize_download_job_locked(existing)}
            job = self._create_download_job_locked(
                job_type="chapter",
                book=book,
                chapter_ids=[cid],
                message="Đã thêm vào hàng chờ tải chương.",
            )
            return {"ok": True, "job": self._serialize_download_job_locked(job)}

    def stop_download_job(self, job_id: str) -> dict[str, Any]:
        jid = str(job_id or "").strip()
        if not jid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu job_id.")
        with self._download_cv:
            self._cleanup_download_jobs_locked()
            job = self._download_jobs.get(jid)
            if not job:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy job tải.")
            status = str(job.get("status") or "").strip().lower()
            now = utc_now_iso()
            stop_event = job.get("_stop_event")
            if isinstance(stop_event, threading.Event):
                stop_event.set()
            if status == "queued":
                job["status"] = "stopped"
                job["message"] = "Đã dừng job đang chờ."
                job["finished_at"] = now
                job["updated_at"] = now
                self._download_queue = [x for x in self._download_queue if x != jid]
            elif status == "running":
                job["message"] = "Đang dừng job..."
                job["updated_at"] = now
            return {"ok": True, "job": self._serialize_download_job_locked(job)}

    def stop_download_jobs_for_book(self, book_id: str) -> int:
        bid = str(book_id or "").strip()
        if not bid:
            return 0
        stopped = 0
        with self._download_cv:
            self._cleanup_download_jobs_locked()
            for job in self._download_jobs.values():
                if str(job.get("book_id") or "").strip() != bid:
                    continue
                status = str(job.get("status") or "").strip().lower()
                if not self._download_status_is_active(status):
                    continue
                event = job.get("_stop_event")
                if isinstance(event, threading.Event):
                    event.set()
                if status == "queued":
                    job["status"] = "stopped"
                    job["message"] = "Đã dừng job đang chờ."
                    job["finished_at"] = utc_now_iso()
                    job["updated_at"] = job["finished_at"]
                    stopped += 1
                elif status == "running":
                    job["message"] = "Đang dừng job..."
                    job["updated_at"] = utc_now_iso()
                    stopped += 1
            if stopped:
                active_ids = {jid for jid, j in self._download_jobs.items() if self._download_status_is_active(str(j.get("status") or ""))}
                self._download_queue = [x for x in self._download_queue if x in active_ids]
        return stopped

    def _download_fetch_one_chapter(
        self,
        chapter: dict[str, Any],
        book: dict[str, Any],
        stop_event: threading.Event,
    ) -> tuple[bool, str]:
        if stop_event.is_set():
            return (False, "Đã dừng.")
        raw_key = str(chapter.get("raw_key") or "").strip()
        if raw_key and (self.storage.read_cache(raw_key) is not None):
            return (True, "")
        source_type = str(book.get("source_type") or "").strip().lower()
        if source_type.startswith("vbook"):
            try:
                self._fetch_remote_chapter(chapter, book)
            except Exception as exc:
                return (False, str(exc))
        if raw_key and (self.storage.read_cache(raw_key) is not None):
            return (True, "")
        return (False, "Không tải được nội dung chương.")

    def _run_download_job(self, job_id: str) -> None:
        with self._download_cv:
            job = self._download_jobs.get(job_id)
            if not job:
                return
        book_id = str(job.get("book_id") or "").strip()
        book = self.storage.find_book(book_id)
        if not book:
            with self._download_cv:
                job2 = self._download_jobs.get(job_id)
                if not job2:
                    return
                now = utc_now_iso()
                job2["status"] = "failed"
                job2["message"] = "Không tìm thấy truyện để tải."
                job2["updated_at"] = now
                job2["finished_at"] = now
            return

        chapter_rows = {str(row.get("chapter_id") or "").strip(): row for row in self.storage.get_chapter_rows(book_id)}
        chapter_ids = [str(x or "").strip() for x in (job.get("chapter_ids") or []) if str(x or "").strip()]
        selected_rows = [chapter_rows[cid] for cid in chapter_ids if cid in chapter_rows]
        if not selected_rows:
            with self._download_cv:
                job2 = self._download_jobs.get(job_id)
                if not job2:
                    return
                now = utc_now_iso()
                job2["status"] = "failed"
                job2["message"] = "Job không còn chương hợp lệ để tải."
                job2["updated_at"] = now
                job2["finished_at"] = now
            return

        runtime_cfg = self._effective_vbook_runtime_settings(str(book.get("source_plugin") or "").strip())
        thread_count = int(runtime_cfg.get("download_threads") or 1)
        if thread_count < 1:
            thread_count = 1
        if not str(book.get("source_type") or "").strip().lower().startswith("vbook"):
            # Nguồn local/TXT/EPUB không cần queue fetch; chapter cache đã nằm local.
            thread_count = 1

        stop_event = job.get("_stop_event")
        if not isinstance(stop_event, threading.Event):
            stop_event = threading.Event()
            job["_stop_event"] = stop_event

        with self._download_cv:
            job2 = self._download_jobs.get(job_id)
            if job2:
                job2["message"] = "Đang chuẩn bị tải chương..."
                job2["updated_at"] = utc_now_iso()
                self._refresh_download_job_counts_locked(job2)

        pending_rows = [row for row in selected_rows if not self.storage.read_cache(str(row.get("raw_key") or "").strip())]
        if not pending_rows:
            with self._download_cv:
                job2 = self._download_jobs.get(job_id)
                if job2:
                    now = utc_now_iso()
                    job2["status"] = "completed"
                    job2["message"] = "Tất cả chương đã có cache."
                    job2["updated_at"] = now
                    job2["finished_at"] = now
                    self._refresh_download_job_counts_locked(job2)
            return

        failed = 0
        if thread_count <= 1:
            for row in pending_rows:
                if stop_event.is_set():
                    break
                cid = str(row.get("chapter_id") or "").strip()
                with self._download_cv:
                    job2 = self._download_jobs.get(job_id)
                    if job2:
                        job2["current_chapter_id"] = cid
                        job2["message"] = f"Đang tải chương {int(row.get('chapter_order') or 0)}..."
                        job2["updated_at"] = utc_now_iso()
                ok, err = self._download_fetch_one_chapter(row, book, stop_event)
                if (not ok) and (not stop_event.is_set()):
                    failed += 1
                    with self._download_cv:
                        job2 = self._download_jobs.get(job_id)
                        if job2:
                            job2["last_error"] = str(err or "")
                with self._download_cv:
                    job2 = self._download_jobs.get(job_id)
                    if job2:
                        self._refresh_download_job_counts_locked(job2)
                        job2["failed_chapters"] = int(failed)
                        job2["updated_at"] = utc_now_iso()
        else:
            in_flight: dict[concurrent.futures.Future[tuple[bool, str]], dict[str, Any]] = {}
            pending_queue = list(pending_rows)
            with concurrent.futures.ThreadPoolExecutor(max_workers=thread_count) as executor:
                while pending_queue or in_flight:
                    if stop_event.is_set() and not in_flight:
                        break
                    while pending_queue and (len(in_flight) < thread_count) and (not stop_event.is_set()):
                        row = pending_queue.pop(0)
                        future = executor.submit(self._download_fetch_one_chapter, row, book, stop_event)
                        in_flight[future] = row
                    if not in_flight:
                        continue
                    done, _ = concurrent.futures.wait(
                        list(in_flight.keys()),
                        timeout=0.25,
                        return_when=concurrent.futures.FIRST_COMPLETED,
                    )
                    if not done:
                        continue
                    for future in done:
                        row = in_flight.pop(future, None)
                        if row is None:
                            continue
                        cid = str(row.get("chapter_id") or "").strip()
                        with self._download_cv:
                            job2 = self._download_jobs.get(job_id)
                            if job2:
                                job2["current_chapter_id"] = cid
                                job2["updated_at"] = utc_now_iso()
                        ok = False
                        err = ""
                        try:
                            ok, err = future.result()
                        except Exception as exc:
                            ok = False
                            err = str(exc)
                        if (not ok) and (not stop_event.is_set()):
                            failed += 1
                            with self._download_cv:
                                job2 = self._download_jobs.get(job_id)
                                if job2:
                                    job2["last_error"] = str(err or "")
                        with self._download_cv:
                            job2 = self._download_jobs.get(job_id)
                            if job2:
                                self._refresh_download_job_counts_locked(job2)
                                job2["failed_chapters"] = int(failed)
                                job2["updated_at"] = utc_now_iso()

        with self._download_cv:
            job2 = self._download_jobs.get(job_id)
            if not job2:
                return
            now = utc_now_iso()
            self._refresh_download_job_counts_locked(job2)
            total = int(job2.get("total_chapters") or 0)
            downloaded = int(job2.get("downloaded_chapters") or 0)
            if stop_event.is_set():
                job2["status"] = "stopped"
                job2["message"] = "Đã dừng tải."
            elif downloaded >= total:
                job2["status"] = "completed"
                if failed > 0:
                    job2["message"] = f"Hoàn tất với {failed} chương lỗi."
                else:
                    job2["message"] = "Đã tải xong."
            elif failed > 0:
                job2["status"] = "failed"
                job2["message"] = job2.get("last_error") or f"Tải lỗi {failed} chương."
            else:
                job2["status"] = "completed"
                job2["message"] = "Đã tải xong."
            job2["updated_at"] = now
            job2["finished_at"] = now
            job2["current_chapter_id"] = ""

    def _download_worker_loop(self) -> None:
        while True:
            with self._download_cv:
                self._cleanup_download_jobs_locked()
                while not self._download_queue:
                    self._download_cv.wait(timeout=1.0)
                    self._cleanup_download_jobs_locked()
                job_id = self._download_queue.pop(0)
                job = self._download_jobs.get(job_id)
                if not job:
                    continue
                status = str(job.get("status") or "").strip().lower()
                if status != "queued":
                    continue
                job["status"] = "running"
                job["started_at"] = utc_now_iso()
                job["updated_at"] = job["started_at"]
                job["message"] = "Đang tải..."
                self._download_running_job_id = job_id
            try:
                self._run_download_job(job_id)
            except Exception as exc:
                with self._download_cv:
                    job = self._download_jobs.get(job_id)
                    if job:
                        now = utc_now_iso()
                        job["status"] = "failed"
                        job["message"] = str(exc) or "Lỗi tải chương."
                        job["updated_at"] = now
                        job["finished_at"] = now
            finally:
                with self._download_cv:
                    if self._download_running_job_id == job_id:
                        self._download_running_job_id = None

    def _vbook_cfg(self) -> dict[str, Any]:
        raw = self.app_config.get("vbook") or {}
        return raw if isinstance(raw, dict) else {}

    def _normalize_vbook_plugin_id(self, value: str) -> str:
        raw = str(value or "").strip().lower()
        if not raw:
            return ""
        out = re.sub(r"[^a-z0-9._-]+", "_", raw).strip("._-")
        return out[:96]

    def _vbook_int(self, value: Any, *, default: int, min_value: int, max_value: int) -> int:
        try:
            num = int(value)
        except Exception:
            num = int(default)
        if num < min_value:
            return min_value
        if num > max_value:
            return max_value
        return num

    def _vbook_int_or_none(self, value: Any, *, min_value: int, max_value: int) -> int | None:
        if value is None:
            return None
        if isinstance(value, str) and not value.strip():
            return None
        try:
            num = int(value)
        except Exception:
            return None
        if num < min_value:
            return min_value
        if num > max_value:
            return max_value
        return num

    def _normalized_vbook_runtime_global_settings(self, raw_cfg: dict[str, Any] | None = None) -> dict[str, Any]:
        vcfg = raw_cfg if isinstance(raw_cfg, dict) else self._vbook_cfg()
        gcfg = vcfg.get("runtime_global") if isinstance(vcfg.get("runtime_global"), dict) else {}
        # Giữ tương thích key cũ (`max_concurrency` / top-level).
        threads_raw = gcfg.get("download_threads")
        if threads_raw is None:
            threads_raw = gcfg.get("max_concurrency")
        if threads_raw is None:
            threads_raw = vcfg.get("download_threads")
        if threads_raw is None:
            threads_raw = vcfg.get("max_concurrency")
        retry_raw = gcfg.get("retry_count")
        if retry_raw is None:
            retry_raw = gcfg.get("retry")
        if retry_raw is None:
            retry_raw = vcfg.get("retry_count", vcfg.get("retry"))
        return {
            "request_delay_ms": self._vbook_int(gcfg.get("request_delay_ms", vcfg.get("request_delay_ms")), default=0, min_value=0, max_value=15_000),
            "download_threads": self._vbook_int(threads_raw, default=4, min_value=1, max_value=16),
            "prefetch_unread_count": self._vbook_int(
                gcfg.get("prefetch_unread_count", vcfg.get("prefetch_unread_count")),
                default=2,
                min_value=0,
                max_value=50,
            ),
            "retry_count": self._vbook_int(retry_raw, default=2, min_value=0, max_value=10),
        }

    def _normalized_vbook_plugin_runtime_overrides(self, raw_cfg: dict[str, Any] | None = None) -> dict[str, dict[str, Any]]:
        vcfg = raw_cfg if isinstance(raw_cfg, dict) else self._vbook_cfg()
        payload = vcfg.get("plugin_overrides")
        if not isinstance(payload, dict):
            return {}
        out: dict[str, dict[str, Any]] = {}
        for raw_pid, raw_override in payload.items():
            pid = self._normalize_vbook_plugin_id(str(raw_pid or ""))
            if (not pid) or (not isinstance(raw_override, dict)):
                continue
            override = {
                "supplemental_code": str(raw_override.get("supplemental_code") or ""),
                "request_delay_ms": self._vbook_int_or_none(raw_override.get("request_delay_ms"), min_value=0, max_value=15_000),
                "download_threads": self._vbook_int_or_none(raw_override.get("download_threads"), min_value=1, max_value=16),
                "prefetch_unread_count": self._vbook_int_or_none(raw_override.get("prefetch_unread_count"), min_value=0, max_value=50),
            }
            if (
                override["supplemental_code"]
                or override["request_delay_ms"] is not None
                or override["download_threads"] is not None
                or override["prefetch_unread_count"] is not None
            ):
                out[pid] = override
        return out

    def _effective_vbook_runtime_settings(self, plugin_id: str = "") -> dict[str, Any]:
        global_cfg = dict(self.vbook_runtime_global_settings or {})
        pid = self._normalize_vbook_plugin_id(plugin_id)
        override = (self.vbook_plugin_runtime_overrides or {}).get(pid) if pid else None
        return {
            "supplemental_code": str((override or {}).get("supplemental_code") or ""),
            "request_delay_ms": int((override or {}).get("request_delay_ms")) if (override and override.get("request_delay_ms") is not None) else int(global_cfg.get("request_delay_ms") or 0),
            "download_threads": int((override or {}).get("download_threads")) if (override and override.get("download_threads") is not None) else int(global_cfg.get("download_threads") or 4),
            "prefetch_unread_count": int((override or {}).get("prefetch_unread_count")) if (override and override.get("prefetch_unread_count") is not None) else int(global_cfg.get("prefetch_unread_count") or 2),
            "retry_count": int(global_cfg.get("retry_count") or 2),
        }

    def get_vbook_settings_global(self) -> dict[str, Any]:
        vcfg = self._vbook_cfg()
        normalized = dict(self.vbook_runtime_global_settings or self._normalized_vbook_runtime_global_settings(vcfg))
        return {
            "ok": True,
            "settings": normalized,
            "runner": {
                "timeout_ms": self._vbook_int(vcfg.get("timeout_ms"), default=20_000, min_value=1_000, max_value=120_000),
                "has_default_user_agent": bool(str(vcfg.get("default_user_agent") or "").strip()),
                "has_default_cookie": bool(str(vcfg.get("default_cookie") or "").strip()),
            },
        }

    def set_vbook_settings_global(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(payload, dict):
            payload = {}

        cfg = load_app_config()
        if not isinstance(cfg, dict):
            cfg = {}
        vcfg = cfg.get("vbook")
        if not isinstance(vcfg, dict):
            vcfg = {}
        gcfg = vcfg.get("runtime_global")
        if not isinstance(gcfg, dict):
            gcfg = {}

        if "request_delay_ms" in payload:
            gcfg["request_delay_ms"] = self._vbook_int(payload.get("request_delay_ms"), default=0, min_value=0, max_value=15_000)
        if "download_threads" in payload or "max_concurrency" in payload:
            raw_threads = payload.get("download_threads")
            if raw_threads is None:
                raw_threads = payload.get("max_concurrency")
            threads = self._vbook_int(raw_threads, default=4, min_value=1, max_value=16)
            gcfg["download_threads"] = threads
            gcfg["max_concurrency"] = threads
        if "prefetch_unread_count" in payload:
            gcfg["prefetch_unread_count"] = self._vbook_int(payload.get("prefetch_unread_count"), default=2, min_value=0, max_value=50)
        if "retry_count" in payload or "retry" in payload:
            raw_retry = payload.get("retry_count")
            if raw_retry is None:
                raw_retry = payload.get("retry")
            gcfg["retry_count"] = self._vbook_int(raw_retry, default=2, min_value=0, max_value=10)
            gcfg["retry"] = gcfg["retry_count"]

        # Mirror top-level keys để không phá logic cũ bên ngoài.
        vcfg["runtime_global"] = gcfg
        vcfg["request_delay_ms"] = gcfg.get("request_delay_ms", 0)
        vcfg["download_threads"] = gcfg.get("download_threads", 4)
        vcfg["max_concurrency"] = gcfg.get("download_threads", 4)
        vcfg["prefetch_unread_count"] = gcfg.get("prefetch_unread_count", 2)
        vcfg["retry_count"] = gcfg.get("retry_count", 2)
        vcfg["retry"] = gcfg.get("retry_count", 2)

        cfg["vbook"] = vcfg
        save_app_config(cfg)
        self.refresh_config()
        return self.get_vbook_settings_global()

    def get_vbook_settings_plugin(self, plugin_id: str) -> dict[str, Any]:
        pid = self._normalize_vbook_plugin_id(plugin_id)
        if not pid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id.")
        override = dict((self.vbook_plugin_runtime_overrides or {}).get(pid) or {})
        # Normalize override trả ra cho UI.
        normalized_override = {
            "supplemental_code": str(override.get("supplemental_code") or ""),
            "request_delay_ms": self._vbook_int_or_none(override.get("request_delay_ms"), min_value=0, max_value=15_000),
            "download_threads": self._vbook_int_or_none(override.get("download_threads"), min_value=1, max_value=16),
            "prefetch_unread_count": self._vbook_int_or_none(override.get("prefetch_unread_count"), min_value=0, max_value=50),
        }
        has_override = bool(
            normalized_override["supplemental_code"]
            or normalized_override["request_delay_ms"] is not None
            or normalized_override["download_threads"] is not None
            or normalized_override["prefetch_unread_count"] is not None
        )
        return {
            "ok": True,
            "plugin_id": pid,
            "has_override": has_override,
            "override": normalized_override,
            "global": dict(self.vbook_runtime_global_settings or {}),
            "effective": self._effective_vbook_runtime_settings(pid),
        }

    def set_vbook_settings_plugin(self, plugin_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        pid = self._normalize_vbook_plugin_id(plugin_id)
        if not pid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id.")
        if not isinstance(payload, dict):
            payload = {}

        cfg = load_app_config()
        if not isinstance(cfg, dict):
            cfg = {}
        vcfg = cfg.get("vbook")
        if not isinstance(vcfg, dict):
            vcfg = {}
        overrides = vcfg.get("plugin_overrides")
        if not isinstance(overrides, dict):
            overrides = {}

        current = overrides.get(pid) if isinstance(overrides.get(pid), dict) else {}
        item: dict[str, Any] = {
            "supplemental_code": str(current.get("supplemental_code") or ""),
            "request_delay_ms": self._vbook_int_or_none(current.get("request_delay_ms"), min_value=0, max_value=15_000),
            "download_threads": self._vbook_int_or_none(current.get("download_threads"), min_value=1, max_value=16),
            "prefetch_unread_count": self._vbook_int_or_none(current.get("prefetch_unread_count"), min_value=0, max_value=50),
        }

        if "supplemental_code" in payload:
            item["supplemental_code"] = str(payload.get("supplemental_code") or "")
        if "request_delay_ms" in payload:
            item["request_delay_ms"] = self._vbook_int_or_none(payload.get("request_delay_ms"), min_value=0, max_value=15_000)
        if "download_threads" in payload or "max_concurrency" in payload:
            raw_threads = payload.get("download_threads")
            if raw_threads is None:
                raw_threads = payload.get("max_concurrency")
            item["download_threads"] = self._vbook_int_or_none(raw_threads, min_value=1, max_value=16)
        if "prefetch_unread_count" in payload:
            item["prefetch_unread_count"] = self._vbook_int_or_none(payload.get("prefetch_unread_count"), min_value=0, max_value=50)

        if (
            item["supplemental_code"]
            or item["request_delay_ms"] is not None
            or item["download_threads"] is not None
            or item["prefetch_unread_count"] is not None
        ):
            overrides[pid] = item
        elif pid in overrides:
            overrides.pop(pid, None)

        vcfg["plugin_overrides"] = overrides
        cfg["vbook"] = vcfg
        save_app_config(cfg)
        self.refresh_config()
        return self.get_vbook_settings_plugin(pid)

    def delete_vbook_settings_plugin(self, plugin_id: str) -> dict[str, Any]:
        pid = self._normalize_vbook_plugin_id(plugin_id)
        if not pid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id.")
        cfg = load_app_config()
        if not isinstance(cfg, dict):
            cfg = {}
        vcfg = cfg.get("vbook")
        if not isinstance(vcfg, dict):
            vcfg = {}
        overrides = vcfg.get("plugin_overrides")
        if not isinstance(overrides, dict):
            overrides = {}
        overrides.pop(pid, None)
        vcfg["plugin_overrides"] = overrides
        cfg["vbook"] = vcfg
        save_app_config(cfg)
        self.refresh_config()
        return self.get_vbook_settings_plugin(pid)

    def get_vbook_settings_effective(self, plugin_id: str = "") -> dict[str, Any]:
        pid = self._normalize_vbook_plugin_id(plugin_id)
        return {
            "ok": True,
            "plugin_id": pid,
            "settings": self._effective_vbook_runtime_settings(pid),
            "global": dict(self.vbook_runtime_global_settings or {}),
        }

    # Backward compatibility tạm thời cho endpoint cũ.
    def get_vbook_settings(self) -> dict[str, Any]:
        return self.get_vbook_settings_global()

    def set_vbook_settings(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.set_vbook_settings_global(payload)

    def _serialize_vbook_plugin(self, p: Any) -> dict[str, Any]:
        pid = self._normalize_vbook_plugin_id(str(getattr(p, "plugin_id", "") or ""))
        return {
            "plugin_id": p.plugin_id,
            "name": p.name,
            "author": p.author,
            "version": p.version,
            "description": str(getattr(p, "description", "") or ""),
            "tag": str(getattr(p, "tag", "") or ""),
            "locale": p.locale,
            "type": p.type,
            "source": p.source,
            "regexp": p.regexp,
            "encrypt": bool(p.encrypt),
            "scripts": sorted(list((p.scripts or {}).keys())),
            "has_runtime_override": bool(pid and pid in (self.vbook_plugin_runtime_overrides or {})),
            "icon_url": build_vbook_plugin_icon_path(str(getattr(p, "plugin_id", "") or "")),
        }

    def list_vbook_plugins(self) -> list[dict[str, Any]]:
        if not self.vbook_manager:
            return []
        return [self._serialize_vbook_plugin(p) for p in self.vbook_manager.list_plugins()]

    def get_vbook_repo_urls(self) -> list[str]:
        vcfg = self._vbook_cfg()
        repo_urls = vcfg.get("repo_urls") or []
        if not isinstance(repo_urls, list):
            return []
        out: list[str] = []
        for x in repo_urls:
            u = str(x or "").strip()
            if u:
                out.append(u)
        return out

    def set_vbook_repo_urls(self, urls: list[str]) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()
        for raw in urls or []:
            url = str(raw or "").strip()
            if not url:
                continue
            if url in seen:
                continue
            seen.add(url)
            normalized.append(url)
        cfg = load_app_config()
        if not isinstance(cfg, dict):
            cfg = {}
        vcfg = cfg.get("vbook")
        if not isinstance(vcfg, dict):
            vcfg = {}
        vcfg["repo_urls"] = normalized
        cfg["vbook"] = vcfg
        save_app_config(cfg)
        self.app_config = cfg
        return normalized

    def list_vbook_repo_plugins(self, *, repo_url: str = "") -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
        if not self.vbook_manager:
            raise ApiError(HTTPStatus.SERVICE_UNAVAILABLE, "VBOOK_DISABLED", "vBook chưa được bật trong server.")
        if repo_url.strip():
            urls = [repo_url.strip()]
        else:
            urls = self.get_vbook_repo_urls()
        if not urls:
            return [], []
        items, errors = self.vbook_manager.list_repo_plugins(urls, timeout_sec=20.0)
        return items, errors

    def install_vbook_plugin(self, *, plugin_url: str, plugin_id: str = "") -> dict[str, Any]:
        if not self.vbook_manager:
            raise ApiError(HTTPStatus.SERVICE_UNAVAILABLE, "VBOOK_DISABLED", "vBook chưa được bật trong server.")
        url = str(plugin_url or "").strip()
        if not url:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_url.")
        try:
            installed = self.vbook_manager.install_plugin_from_url(url, plugin_id=plugin_id)
        except Exception as exc:
            raise ApiError(
                HTTPStatus.BAD_GATEWAY,
                "VBOOK_PLUGIN_INSTALL_ERROR",
                "Không cài được plugin vBook từ URL.",
                {"plugin_url": url, "error": str(exc)},
            ) from exc
        return self._serialize_vbook_plugin(installed)

    def install_vbook_plugin_local(self, *, filename: str, content: bytes, plugin_id: str = "") -> dict[str, Any]:
        if not self.vbook_manager:
            raise ApiError(HTTPStatus.SERVICE_UNAVAILABLE, "VBOOK_DISABLED", "vBook chưa được bật trong server.")
        if not content:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "File plugin rỗng.")
        ext = str(filename or "").strip().lower()
        if ext and not ext.endswith(".zip"):
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Chỉ hỗ trợ file plugin `.zip`.")
        try:
            installed = self.vbook_manager.install_plugin_from_zip_bytes(content, plugin_id=plugin_id)
        except Exception as exc:
            raise ApiError(
                HTTPStatus.BAD_REQUEST,
                "VBOOK_PLUGIN_INSTALL_LOCAL_ERROR",
                "Không cài được plugin vBook từ file local.",
                {"filename": filename, "error": str(exc)},
            ) from exc
        return self._serialize_vbook_plugin(installed)

    def remove_vbook_plugin(self, plugin_id: str) -> bool:
        if not self.vbook_manager:
            raise ApiError(HTTPStatus.SERVICE_UNAVAILABLE, "VBOOK_DISABLED", "vBook chưa được bật trong server.")
        pid = str(plugin_id or "").strip()
        if not pid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id.")
        return bool(self.vbook_manager.remove_plugin(pid))

    def _vbook_plugin_icon_candidates(self, icon_raw: str = "") -> list[str]:
        base = [
            "icon.png",
            "icon.webp",
            "icon.jpg",
            "icon.jpeg",
            "icon.svg",
            "cover.png",
            "cover.webp",
            "cover.jpg",
            "cover.jpeg",
        ]
        out: list[str] = []
        if icon_raw:
            out.append(icon_raw)
        out.extend(base)
        cleaned: list[str] = []
        for raw in out:
            text = str(raw or "").replace("\\", "/").strip().lstrip("/")
            if not text:
                continue
            parts = [x for x in text.split("/") if x]
            if (not parts) or any(x == ".." for x in parts):
                continue
            value = "/".join(parts)
            if value not in cleaned:
                cleaned.append(value)
        return cleaned

    def _read_vbook_plugin_icon_from_dir(self, plugin_path: Path) -> tuple[bytes, str] | None:
        if not plugin_path.exists() or not plugin_path.is_dir():
            return None
        icon_hint = ""
        plugin_json = plugin_path / "plugin.json"
        try:
            payload = json.loads(plugin_json.read_text(encoding="utf-8"))
            if isinstance(payload, dict):
                meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
                icon_hint = str((meta or {}).get("icon") or "").strip()
        except Exception:
            icon_hint = ""

        for rel in self._vbook_plugin_icon_candidates(icon_hint):
            cand = plugin_path / rel
            if not cand.exists() or not cand.is_file():
                continue
            try:
                data = cand.read_bytes()
            except Exception:
                continue
            if not data:
                continue
            ctype = mimetypes.guess_type(str(cand))[0] or "application/octet-stream"
            return data, ctype
        return None

    def _read_vbook_plugin_icon_from_zip(self, plugin_path: Path) -> tuple[bytes, str] | None:
        if not plugin_path.exists() or (not plugin_path.is_file()):
            return None
        try:
            with zipfile.ZipFile(plugin_path, "r") as zf:
                icon_hint = ""
                try:
                    raw = zf.read("plugin.json")
                    payload = json.loads(raw.decode("utf-8", errors="ignore"))
                    if isinstance(payload, dict):
                        meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
                        icon_hint = str((meta or {}).get("icon") or "").strip()
                except Exception:
                    icon_hint = ""

                names = [str(x or "").replace("\\", "/").lstrip("/") for x in zf.namelist()]
                lower_map = {name.lower(): name for name in names}
                for rel in self._vbook_plugin_icon_candidates(icon_hint):
                    key = rel.lower()
                    actual = lower_map.get(key)
                    if not actual:
                        continue
                    try:
                        data = zf.read(actual)
                    except Exception:
                        continue
                    if not data:
                        continue
                    ctype = mimetypes.guess_type(actual)[0] or "application/octet-stream"
                    return data, ctype
        except Exception:
            return None
        return None

    def get_vbook_plugin_icon(self, plugin_id: str) -> tuple[bytes, str]:
        plugin = self._require_vbook_plugin(plugin_id)
        plugin_path = Path(str(getattr(plugin, "path", "") or ""))
        icon_data: tuple[bytes, str] | None = None
        if plugin_path.is_dir():
            icon_data = self._read_vbook_plugin_icon_from_dir(plugin_path)
        elif plugin_path.is_file() and plugin_path.suffix.lower() == ".zip":
            icon_data = self._read_vbook_plugin_icon_from_zip(plugin_path)
        if icon_data is None:
            raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Plugin chưa có icon.")
        return icon_data

    def _resolve_vbook_plugin(self, url: str, *, plugin_id: str | None) -> Any:
        if not self.vbook_manager:
            raise ApiError(HTTPStatus.SERVICE_UNAVAILABLE, "VBOOK_DISABLED", "vBook chưa được bật trong server.")

        if plugin_id:
            pid = str(plugin_id).strip()
            for p in self.vbook_manager.list_plugins():
                if p.plugin_id == pid:
                    return p
            raise ApiError(HTTPStatus.BAD_REQUEST, "VBOOK_PLUGIN_NOT_FOUND", "Không tìm thấy plugin vBook.", {"plugin_id": pid})

        detected = self.vbook_manager.detect_plugin_for_url(url)
        if detected:
            return detected
        raise ApiError(
            HTTPStatus.BAD_REQUEST,
            "VBOOK_NO_PLUGIN",
            "Không tìm thấy plugin vBook phù hợp với URL này.",
            {"url": url},
        )

    def _require_vbook_plugin(self, plugin_id: str) -> Any:
        if not self.vbook_manager:
            raise ApiError(HTTPStatus.SERVICE_UNAVAILABLE, "VBOOK_DISABLED", "vBook chưa được bật trong server.")
        pid = str(plugin_id or "").strip()
        if not pid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id.")
        for p in self.vbook_manager.list_plugins():
            if p.plugin_id == pid:
                return p
        raise ApiError(HTTPStatus.BAD_REQUEST, "VBOOK_PLUGIN_NOT_FOUND", "Không tìm thấy plugin vBook.", {"plugin_id": pid})

    def _ensure_plugin_has_script(self, plugin: Any, script_key: str) -> None:
        scripts = getattr(plugin, "scripts", None)
        if not isinstance(scripts, dict) or not scripts.get(script_key):
            raise ApiError(
                HTTPStatus.BAD_REQUEST,
                "VBOOK_SCRIPT_MISSING",
                f"Plugin không hỗ trợ script `{script_key}`.",
                {"plugin": getattr(plugin, "plugin_id", ""), "script": script_key},
            )

    def _load_vbook_bridge_state(self) -> dict[str, Any]:
        if not self.vbook_bridge_enabled:
            return {}
        path = self.vbook_bridge_state_path
        if not path or not path.exists():
            self._vbook_bridge_state_cache = {}
            self._vbook_bridge_state_mtime = None
            return {}
        try:
            mtime = float(path.stat().st_mtime)
        except Exception:
            mtime = None
        if (mtime is not None) and (self._vbook_bridge_state_mtime == mtime):
            return self._vbook_bridge_state_cache
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(payload, dict):
                payload = {}
        except Exception:
            payload = {}
        hosts = payload.get("hosts")
        if not isinstance(hosts, dict):
            hosts = {}
        payload["hosts"] = hosts
        self._vbook_bridge_state_cache = payload
        self._vbook_bridge_state_mtime = mtime
        return payload

    def _pick_bridge_host_entry(self, state: dict[str, Any], host: str) -> dict[str, Any]:
        hosts_raw = state.get("hosts") if isinstance(state, dict) else {}
        if not isinstance(hosts_raw, dict):
            return {}
        table: dict[str, dict[str, Any]] = {}
        for key, row in hosts_raw.items():
            if not isinstance(row, dict):
                continue
            key_norm = normalize_host(str(key or ""))
            if not key_norm:
                continue
            table[key_norm] = row
        host_norm = normalize_host(host)
        if not host_norm:
            return {}
        for alias in host_aliases(host_norm):
            row = table.get(alias)
            if isinstance(row, dict):
                return row
        return {}

    def _extract_vbook_request_host(self, plugin: Any, script_key: str, args: list[Any]) -> str:
        for arg in args or []:
            if isinstance(arg, str):
                host = normalize_host(arg)
                if host:
                    return host
            elif isinstance(arg, dict):
                for key in ("url", "link", "detail_url", "host"):
                    host = normalize_host(str(arg.get(key) or ""))
                    if host:
                        return host
        source = normalize_host(str(getattr(plugin, "source", "") or ""))
        if source:
            return source
        regexp = str(getattr(plugin, "regexp", "") or "")
        m = re.search(r"([a-zA-Z0-9-]+(?:\\\.)+[a-zA-Z0-9.-]+)", regexp)
        if m:
            probe = m.group(1).replace("\\.", ".")
            host = normalize_host(probe)
            if host:
                return host
        return ""

    def _vbook_host_keyword(self, host: str) -> str:
        norm = normalize_host(host).lstrip("www.")
        if not norm:
            return ""
        ignored = {"www", "m", "mobile", "api", "com", "net", "org", "co", "vn", "online", "app"}
        parts = [x for x in norm.split(".") if x]
        candidates = [
            p
            for p in parts
            if p not in ignored
            and (not p.startswith("api-"))
            and (not p.isdigit())
            and len(p) >= 3
        ]
        if not candidates:
            return ""
        candidates.sort(key=len, reverse=True)
        return candidates[0]

    def _vbook_bridge_host_candidates(self, plugin: Any, script_key: str, args: list[Any], state: dict[str, Any]) -> list[str]:
        out: list[str] = []

        def push(host_raw: str) -> None:
            host_norm = normalize_host(host_raw)
            if not host_norm:
                return
            for alias in host_aliases(host_norm):
                if alias not in out:
                    out.append(alias)

        direct_host = self._extract_vbook_request_host(plugin, script_key, args)
        source_host = normalize_host(str(getattr(plugin, "source", "") or ""))
        push(direct_host)
        push(source_host)

        for host in [direct_host, source_host]:
            norm = normalize_host(host).lstrip("www.")
            if not norm:
                continue
            if norm.endswith(".com.vn"):
                base = norm.removesuffix(".com.vn")
                if base and "." not in base:
                    push(f"{base}.vn")
                    push(f"api.{base}.vn")
                    push(f"api-01.{base}.vn")
                    push(f"api-02.{base}.vn")
            elif norm.endswith(".vn") and (not norm.endswith(".com.vn")):
                base = norm.removesuffix(".vn")
                if base and "." not in base:
                    push(f"{base}.com.vn")

        hosts_raw = state.get("hosts") if isinstance(state, dict) else {}
        if isinstance(hosts_raw, dict) and hosts_raw:
            keywords = {
                x for x in [
                    self._vbook_host_keyword(direct_host),
                    self._vbook_host_keyword(source_host),
                ] if x
            }
            ranked: list[tuple[int, str, str]] = []
            for raw_host, row in hosts_raw.items():
                host_norm = normalize_host(str(raw_host or ""))
                if not host_norm:
                    continue
                if not keywords:
                    continue
                score = sum(1 for kw in keywords if kw in host_norm)
                if score <= 0:
                    continue
                updated_at = ""
                if isinstance(row, dict):
                    updated_at = str(row.get("updated_at") or "")
                ranked.append((score, updated_at, host_norm))
            ranked.sort(key=lambda x: (x[0], x[1]), reverse=True)
            for _, _, host_norm in ranked:
                push(host_norm)
        return out

    def _vbook_default_headers_from_bridge_entry(self, entry: dict[str, Any]) -> dict[str, str]:
        headers_raw = entry.get("headers") if isinstance(entry, dict) else {}
        if not isinstance(headers_raw, dict):
            return {}
        disallow = {
            "cookie",
            "user-agent",
            "host",
            "content-length",
            "connection",
            "transfer-encoding",
            "accept-encoding",
        }
        out: dict[str, str] = {}
        for key_raw, value_raw in headers_raw.items():
            key = str(key_raw or "").strip()
            value = str(value_raw or "").strip()
            if (not key) or (not value):
                continue
            if key.lower() in disallow:
                continue
            out[key] = value
        return out

    def _cookie_header_from_sqlite_db(self, db_path: Path, host: str) -> str:
        if not db_path.exists():
            return ""
        host_norm = normalize_host(host)
        if not host_norm:
            return ""
        like_pattern = "%" + host_norm.lstrip("www.")
        pairs: list[str] = []
        seen: set[str] = set()
        conn: sqlite3.Connection | None = None
        try:
            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            for row in cursor.execute(
                "SELECT host_key, name, value FROM cookies WHERE lower(host_key) LIKE ?",
                (like_pattern,),
            ):
                domain = str(row["host_key"] or "")
                name = str(row["name"] or "").strip()
                value = str(row["value"] or "")
                if not name:
                    continue
                if not host_matches_domain(host_norm, domain):
                    continue
                name_l = name.lower()
                if name_l in seen:
                    continue
                seen.add(name_l)
                pairs.append(f"{name}={value}")
        except Exception:
            return ""
        finally:
            try:
                if conn is not None:
                    conn.close()
            except Exception:
                pass
        return "; ".join(pairs)

    def _fallback_cookie_header_from_bridge_state(self, host: str, state: dict[str, Any]) -> str:
        if not self.vbook_bridge_cookie_fallback:
            return ""
        base_dir = runtime_base_dir()
        candidate_raw: list[str] = []
        state_cookie_db = str(state.get("cookie_db_path") or "").strip() if isinstance(state, dict) else ""
        if state_cookie_db:
            candidate_raw.append(state_cookie_db)
        state_profile_dir = str(state.get("profile_dir") or "").strip() if isinstance(state, dict) else ""
        if state_profile_dir:
            candidate_raw.append(str(Path(state_profile_dir) / "storage" / "Cookies"))
        candidate_raw.append(str(self.vbook_bridge_cookie_db_path))

        tested: set[str] = set()
        for raw in candidate_raw:
            if not raw:
                continue
            try:
                path = resolve_existing_path(raw, base_dir, ROOT_DIR)
            except Exception:
                continue
            key = str(path)
            if key in tested:
                continue
            tested.add(key)
            cookie_header = self._cookie_header_from_sqlite_db(path, host)
            if cookie_header:
                return cookie_header
        return ""

    def _build_vbook_runner_override(self, plugin: Any, script_key: str, args: list[Any]) -> dict[str, Any]:
        override: dict[str, Any] = {}
        plugin_id = self._normalize_vbook_plugin_id(str(getattr(plugin, "plugin_id", "") or ""))
        runtime_cfg = self._effective_vbook_runtime_settings(plugin_id)
        override["request_delay_ms"] = int(runtime_cfg.get("request_delay_ms") or 0)
        override["supplemental_code"] = str(runtime_cfg.get("supplemental_code") or "")

        if self.vbook_bridge_enabled:
            state = self._load_vbook_bridge_state()
            host_candidates = self._vbook_bridge_host_candidates(plugin, script_key, args, state)
            entry: dict[str, Any] = {}
            for host in host_candidates:
                probe = self._pick_bridge_host_entry(state, host)
                if isinstance(probe, dict) and probe:
                    entry = probe
                    break

            user_agent = str(entry.get("user_agent") or "").strip()
            if not user_agent:
                user_agent = str(state.get("default_user_agent") or "").strip()

            cookie_header = str(entry.get("cookie_header") or "").strip()
            if not cookie_header:
                for host in host_candidates:
                    cookie_header = self._fallback_cookie_header_from_bridge_state(host, state)
                    if cookie_header:
                        break

            default_headers = self._vbook_default_headers_from_bridge_entry(entry)
            source = str(getattr(plugin, "source", "") or "").strip()
            if source:
                source_url = source if (source.startswith("http://") or source.startswith("https://")) else f"https://{source.lstrip('/')}"
                header_keys_lower = {k.lower() for k in default_headers.keys()}
                if "referer" not in header_keys_lower:
                    default_headers.setdefault("Referer", source_url)
                parsed_source = urlparse(source_url)
                if parsed_source.scheme and parsed_source.netloc:
                    if "origin" not in header_keys_lower:
                        default_headers.setdefault("Origin", f"{parsed_source.scheme}://{parsed_source.netloc}")

            if user_agent:
                override["default_user_agent"] = user_agent
            if cookie_header:
                override["default_cookie"] = cookie_header
            if default_headers:
                override["default_headers"] = default_headers
        return override

    def get_vbook_bridge_state(self) -> dict[str, Any]:
        state = self._load_vbook_bridge_state()
        hosts_raw = state.get("hosts") if isinstance(state, dict) else {}
        host_items: list[dict[str, Any]] = []
        if isinstance(hosts_raw, dict):
            for host, row in hosts_raw.items():
                if not isinstance(row, dict):
                    continue
                host_items.append(
                    {
                        "host": normalize_host(str(host or "")) or str(host or ""),
                        "updated_at": str(row.get("updated_at") or ""),
                        "has_user_agent": bool(str(row.get("user_agent") or "").strip()),
                        "has_cookie": bool(str(row.get("cookie_header") or "").strip()),
                    }
                )
        host_items.sort(key=lambda x: x.get("host") or "")
        return {
            "ok": True,
            "enabled": bool(self.vbook_bridge_enabled),
            "state_path": str(self.vbook_bridge_state_path),
            "cookie_db_path": str(self.vbook_bridge_cookie_db_path),
            "default_user_agent": str(state.get("default_user_agent") or ""),
            "updated_at": str(state.get("updated_at") or ""),
            "hosts": host_items,
            "count": len(host_items),
        }

    def _run_vbook_script_result(self, plugin: Any, script_key: str, args: list[Any]) -> dict[str, Any]:
        if not self.vbook_runner:
            raise ApiError(
                HTTPStatus.SERVICE_UNAVAILABLE,
                "VBOOK_RUNNER_MISSING",
                "Chưa có vBook runner. Hãy build `tools/vbook_runner` trước.",
            )

        pid = self._normalize_vbook_plugin_id(str(getattr(plugin, "plugin_id", "") or ""))
        runtime_cfg = self._effective_vbook_runtime_settings(pid)
        retry_count = self._vbook_int(runtime_cfg.get("retry_count"), default=2, min_value=0, max_value=10)
        max_attempts = retry_count + 1
        retry_sleep_sec = max(0.12, min(2.0, float(int(runtime_cfg.get("request_delay_ms") or 0)) / 1000.0 or 0.25))

        for attempt in range(1, max_attempts + 1):
            try:
                runner_override = self._build_vbook_runner_override(plugin, script_key, args)
                payload = self.vbook_runner.run(
                    plugin_path=str(plugin.path),
                    script_key=script_key,
                    args=args,
                    runner_config_override=(runner_override or None),
                    timeout_sec=30.0,
                )
                result = payload.get("result")
                if isinstance(result, dict):
                    code = result.get("code")
                    try:
                        code_val = int(code)
                    except Exception:
                        code_val = 0 if code in (0, 0.0, "0") else 1
                    if code_val != 0:
                        result_message = normalize_vbook_display_text(
                            str(
                                result.get("message")
                                or result.get("msg")
                                or result.get("error")
                                or ""
                            ),
                            single_line=False,
                        )
                        details_payload: dict[str, Any] = {
                            "plugin": plugin.plugin_id,
                            "script": script_key,
                            "result": result,
                            "attempt": attempt,
                            "max_attempts": max_attempts,
                        }
                        if "cloudflare" in result_message.lower():
                            bridge_state = self._load_vbook_bridge_state() if self.vbook_bridge_enabled else {}
                            hosts_raw = bridge_state.get("hosts") if isinstance(bridge_state, dict) else {}
                            details_payload["hint"] = (
                                "Cloudflare challenge: hãy mở nguồn bằng trình duyệt tích hợp để đồng bộ cookie/headers trước khi chạy lại."
                            )
                            details_payload["bridge_enabled"] = bool(self.vbook_bridge_enabled)
                            details_payload["bridge_hosts_count"] = len(hosts_raw) if isinstance(hosts_raw, dict) else 0
                        raise ApiError(
                            HTTPStatus.BAD_GATEWAY,
                            "VBOOK_SCRIPT_ERROR",
                            result_message or "Plugin vBook trả lỗi khi chạy script.",
                            details_payload,
                        )
                    return result
                # Some plugins might return raw value (non Response.success)
                return {"code": 0, "data": result}
            except ApiError as exc:
                should_retry = (exc.error_code == "VBOOK_SCRIPT_ERROR") and (attempt < max_attempts)
                if not should_retry:
                    raise
                time.sleep(retry_sleep_sec)
            except Exception:
                if attempt >= max_attempts:
                    raise
                time.sleep(retry_sleep_sec)

    def _run_vbook_script(self, plugin: Any, script_key: str, args: list[Any]) -> Any:
        result = self._run_vbook_script_result(plugin, script_key, args)
        return result.get("data")

    def _run_vbook_script_with_next(self, plugin: Any, script_key: str, args: list[Any]) -> tuple[Any, Any]:
        result = self._run_vbook_script_result(plugin, script_key, args)
        return result.get("data"), result.get("next")

    def _normalize_vbook_search_item(self, plugin: Any, item: dict[str, Any], *, query: str) -> dict[str, Any] | None:
        if not isinstance(item, dict):
            return None
        plugin_id = str(getattr(plugin, "plugin_id", "") or "")
        title = normalize_vbook_display_text(
            str(
            item.get("name")
            or item.get("title")
            or item.get("book_name")
            or item.get("bookTitle")
            or ""
            ),
            single_line=True,
        )
        href = str(
            item.get("link")
            or item.get("url")
            or item.get("detail")
            or item.get("detail_url")
            or item.get("book_url")
            or ""
        ).strip()
        host = str(item.get("host") or "").strip()
        detail_url = self._join_vbook_url(host, href)
        if not detail_url and href.startswith("http"):
            detail_url = href
        if not title or not detail_url:
            return None
        cover = str(item.get("cover") or item.get("image") or item.get("img") or "").strip()
        if cover and host and not cover.startswith("http"):
            cover = self._join_vbook_url(host, cover)
        cover = build_vbook_image_proxy_path(cover, plugin_id=plugin_id, referer=detail_url)
        description = normalize_vbook_display_text(
            str(item.get("description") or item.get("desc") or item.get("summary") or ""),
            single_line=False,
        )
        author = normalize_vbook_display_text(
            str(item.get("author") or item.get("writer") or ""),
            single_line=True,
        )
        is_comic = "comic" in str(getattr(plugin, "type", "") or "").lower()
        locale_norm = normalize_lang_source(str(getattr(plugin, "locale", "") or ""))
        source_tag = "vbook_comic" if is_comic else "vbook"
        title_raw = title
        author_raw = author
        description_raw = description
        if self.is_reader_translation_enabled():
            mode = self.reader_translation_mode()
            title = self._translate_ui_text(title, single_line=True, mode=mode) or title
            author = self._translate_ui_text(author, single_line=True, mode=mode) or author
            description = self._translate_ui_text(description, single_line=False, mode=mode) or description
        return {
            "title": title,
            "author": author,
            "description": description,
            "title_raw": title_raw,
            "author_raw": author_raw,
            "description_raw": description_raw,
            "cover": cover,
            "detail_url": detail_url,
            "query": query,
            "host": host,
            "plugin_id": plugin_id,
            "plugin_name": str(getattr(plugin, "name", "") or ""),
            "plugin_type": str(getattr(plugin, "type", "") or ""),
            "locale": str(getattr(plugin, "locale", "") or ""),
            "source_type": source_tag,
            "is_comic": is_comic,
            "lang_source": locale_norm or "zh",
        }

    def _extract_vbook_list_rows(self, data: Any) -> list[Any]:
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            for key in ("items", "data", "list", "results", "books"):
                value = data.get(key)
                if isinstance(value, list):
                    return value
            # Fallback: object đơn lẻ.
            return [data]
        return []

    def _has_non_empty_vbook_value(self, value: Any) -> bool:
        if value is None:
            return False
        if isinstance(value, str):
            return bool(value.strip())
        if isinstance(value, (list, tuple, set, dict)):
            return bool(value)
        return True

    def _pick_vbook_detail_value(self, detail: dict[str, Any], *, exact_keys: tuple[str, ...], fuzzy_tokens: tuple[str, ...] = ()) -> Any:
        if not isinstance(detail, dict):
            return None

        for key in exact_keys:
            if key in detail:
                value = detail.get(key)
                if self._has_non_empty_vbook_value(value):
                    return value

        lowered: dict[str, Any] = {}
        for raw_key, raw_value in detail.items():
            lowered[str(raw_key or "").strip().lower()] = raw_value
        for key in exact_keys:
            value = lowered.get(str(key or "").strip().lower())
            if self._has_non_empty_vbook_value(value):
                return value

        if fuzzy_tokens:
            tokens = tuple(str(token or "").strip().lower() for token in fuzzy_tokens if str(token or "").strip())
            if tokens:
                scalar_candidate: Any = None
                for raw_key, raw_value in detail.items():
                    key_text = str(raw_key or "").strip().lower()
                    if not key_text:
                        continue
                    if any(token in key_text for token in tokens):
                        if not self._has_non_empty_vbook_value(raw_value):
                            continue
                        if isinstance(raw_value, (list, dict)):
                            return raw_value
                        if any(marker in key_text for marker in ("count", "total", "size", "num", "number")):
                            continue
                        if scalar_candidate is None:
                            scalar_candidate = raw_value
                if self._has_non_empty_vbook_value(scalar_candidate):
                    return scalar_candidate

        return None

    def _normalize_vbook_text_flexible(self, value: Any, *, single_line: bool = False) -> str:
        if value is None:
            return ""
        if isinstance(value, str):
            return normalize_vbook_display_text(value, single_line=single_line)
        if isinstance(value, (int, float, bool)):
            return normalize_vbook_display_text(str(value), single_line=single_line)
        if isinstance(value, dict):
            for key in ("content", "comment", "text", "body", "message", "msg", "detail", "desc", "value"):
                if key in value:
                    text = self._normalize_vbook_text_flexible(value.get(key), single_line=single_line)
                    if text:
                        return text
            rows = self._extract_vbook_list_rows(value)
            if rows and not (len(rows) == 1 and rows[0] is value):
                parts = [self._normalize_vbook_text_flexible(row, single_line=False) for row in rows]
                parts = [part for part in parts if part]
                if parts:
                    return normalize_vbook_display_text("\n".join(parts), single_line=single_line)
            return ""
        if isinstance(value, (list, tuple, set)):
            parts = [self._normalize_vbook_text_flexible(item, single_line=False) for item in value]
            parts = [part for part in parts if part]
            if not parts:
                return ""
            return normalize_vbook_display_text("\n".join(parts), single_line=single_line)
        return normalize_vbook_display_text(str(value), single_line=single_line)

    def _normalize_vbook_tab_item(self, item: Any) -> dict[str, Any] | None:
        if isinstance(item, str):
            text = normalize_vbook_display_text(str(item), single_line=True)
            if not text:
                return None
            if self.is_reader_translation_enabled():
                mode = self.reader_translation_mode()
                text = self._translate_ui_text(text, single_line=True, mode=mode) or text
            return {
                "title": text,
                "script": "",
                "input": text,
            }
        if not isinstance(item, dict):
            return None
        title = normalize_vbook_display_text(
            str(item.get("title") or item.get("name") or item.get("label") or ""),
            single_line=True,
        )
        script = str(item.get("script") or item.get("file") or "").strip()
        raw_input = item.get("input")
        if raw_input is None:
            raw_input = item.get("link")
        if raw_input is None:
            raw_input = item.get("url")
        if not title:
            return None
        if self.is_reader_translation_enabled():
            mode = self.reader_translation_mode()
            title = self._translate_ui_text(title, single_line=True, mode=mode) or title
        if isinstance(raw_input, (dict, list, str, int, float, bool)) or raw_input is None:
            input_value = raw_input
        else:
            input_value = str(raw_input)
        return {
            "title": title,
            "script": script,
            "input": input_value,
        }

    def _normalize_vbook_suggest_items(self, plugin: Any, raw_value: Any) -> list[dict[str, Any]]:
        rows = self._extract_vbook_list_rows(raw_value)
        out: list[dict[str, Any]] = []
        seen: set[str] = set()
        for row in rows:
            item: dict[str, Any] | None = None
            if isinstance(row, dict):
                item = self._normalize_vbook_search_item(plugin, row, query="")
                if item is None:
                    title = normalize_vbook_display_text(
                        str(row.get("name") or row.get("title") or row.get("text") or ""),
                        single_line=True,
                    )
                    href = str(
                        row.get("link")
                        or row.get("url")
                        or row.get("detail")
                        or row.get("detail_url")
                        or "",
                    ).strip()
                    host = str(row.get("host") or "").strip()
                    detail_url = self._join_vbook_url(host, href)
                    if not detail_url and href.startswith("http"):
                        detail_url = href
                    cover = str(row.get("cover") or row.get("image") or row.get("img") or "").strip()
                    if cover and host and not cover.startswith("http"):
                        cover = self._join_vbook_url(host, cover)
                    if title:
                        item = {
                            "title": title,
                            "author": normalize_vbook_display_text(str(row.get("author") or ""), single_line=True),
                            "description": normalize_vbook_display_text(str(row.get("description") or row.get("desc") or ""), single_line=False),
                            "cover": cover,
                            "detail_url": detail_url,
                            "plugin_id": str(getattr(plugin, "plugin_id", "") or ""),
                        }
            elif isinstance(row, str):
                title = normalize_vbook_display_text(row, single_line=True)
                if title:
                    item = {
                        "title": title,
                        "author": "",
                        "description": "",
                        "cover": "",
                        "detail_url": "",
                        "plugin_id": str(getattr(plugin, "plugin_id", "") or ""),
                    }
            if not item:
                continue
            item["cover"] = build_vbook_image_proxy_path(
                str(item.get("cover") or "").strip(),
                plugin_id=str(item.get("plugin_id") or str(getattr(plugin, "plugin_id", "") or "")).strip(),
                referer=str(item.get("detail_url") or "").strip(),
            )
            key = f"{str(item.get('title') or '').strip().lower()}|{str(item.get('detail_url') or '').strip()}"
            if not key or key in seen:
                continue
            seen.add(key)
            out.append(item)
        return out[:80]

    def _collect_vbook_suggest_items(self, plugin: Any, raw_value: Any) -> list[dict[str, Any]]:
        # Case chuẩn: plugin trả trực tiếp list book gợi ý.
        direct_items = self._normalize_vbook_suggest_items(plugin, raw_value)
        direct_items = [
            row for row in direct_items
            if str((row or {}).get("detail_url") or "").strip()
        ]
        if direct_items:
            return direct_items

        # Fallback: một số ext (vd SanyTeam) trả tab/script để load gợi ý.
        rows = self._extract_vbook_list_rows(raw_value)
        tabs: list[dict[str, Any]] = []
        for row in rows:
            tab = self._normalize_vbook_tab_item(row)
            if tab:
                tabs.append(tab)
        if not tabs:
            return []

        out: list[dict[str, Any]] = []
        seen: set[str] = set()
        for tab in tabs[:4]:
            script_raw = str(tab.get("script") or "").strip()
            if not script_raw:
                continue
            try:
                script_ref = self._normalize_vbook_script_ref(plugin, script_raw, default_key="home")
                list_rows, _ = self._run_vbook_paged_list_script(
                    plugin,
                    script_ref=script_ref,
                    input_value=tab.get("input"),
                    page=1,
                    next_token=None,
                )
            except Exception:
                continue
            for row in list_rows:
                normalized = self._normalize_vbook_search_item(plugin, row, query="")
                if not normalized:
                    continue
                key = f"{str(normalized.get('title') or '').strip().lower()}|{str(normalized.get('detail_url') or '').strip()}"
                if not key or key in seen:
                    continue
                seen.add(key)
                out.append(normalized)
                if len(out) >= 80:
                    return out
        return out

    def _normalize_vbook_comment_items(self, raw_value: Any) -> list[dict[str, Any]]:
        rows: list[Any]
        if isinstance(raw_value, list):
            rows = raw_value
        elif isinstance(raw_value, dict):
            rows = self._extract_vbook_list_rows(raw_value)
            if not rows:
                rows = [raw_value]
        else:
            rows = [raw_value]

        out: list[dict[str, Any]] = []
        for row in rows:
            if isinstance(row, dict):
                author_value = (
                    row.get("author")
                    or row.get("user")
                    or row.get("name")
                    or row.get("nick")
                    or row.get("username")
                    or row.get("nickname")
                    or row.get("member")
                    or row.get("uname")
                    or ""
                )
                content_value = (
                    row.get("comment")
                    or row.get("comments")
                    or row.get("content")
                    or row.get("text")
                    or row.get("body")
                    or row.get("message")
                    or row.get("msg")
                    or row.get("detail")
                    or row.get("desc")
                    or row.get("review")
                    or row.get("review_text")
                    or row.get("value")
                    or ""
                )
                time_value = (
                    row.get("time")
                    or row.get("date")
                    or row.get("created_at")
                    or row.get("updated_at")
                    or row.get("createdAt")
                    or row.get("updatedAt")
                    or row.get("create_time")
                    or row.get("update_time")
                    or row.get("createTime")
                    or row.get("updateTime")
                    or ""
                )
                author = self._normalize_vbook_text_flexible(author_value, single_line=True)
                content = self._normalize_vbook_text_flexible(content_value, single_line=False)
                when = self._normalize_vbook_text_flexible(time_value, single_line=True)
                if content:
                    out.append(
                        {
                            "author": author,
                            "content": content,
                            "time": when,
                        }
                    )
            elif isinstance(row, str):
                content = normalize_vbook_display_text(row, single_line=False)
                if content:
                    out.append({"author": "", "content": content, "time": ""})
        return out[:200]

    def _parse_vbook_ongoing(self, value: Any) -> bool | None:
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(int(value))
        text = str(value or "").strip().lower()
        if not text:
            return None
        if text in {"1", "true", "yes", "on", "ongoing", "continue", "còn tiếp", "con tiep", "đang ra", "dang ra"}:
            return True
        if text in {"0", "false", "no", "off", "completed", "complete", "done", "finished", "end", "hoàn thành", "hoan thanh"}:
            return False
        return None

    def _normalize_vbook_genre_items(self, detail: dict[str, Any]) -> list[dict[str, Any]]:
        if not isinstance(detail, dict):
            return []
        raw_value = (
            detail.get("genres")
            or detail.get("genre")
            or detail.get("categories")
            or detail.get("category")
            or detail.get("tags")
            or detail.get("tag")
        )
        rows = self._extract_vbook_list_rows(raw_value)
        if (not rows) and isinstance(raw_value, str):
            # Fallback cho format plain text có ngăn cách.
            rough = [x.strip() for x in re.split(r"[,\n/|;]+", raw_value) if x and x.strip()]
            rows = rough

        out: list[dict[str, Any]] = []
        seen: set[str] = set()
        for row in rows:
            title = ""
            script = ""
            input_value: Any = None
            host = ""

            if isinstance(row, dict):
                title = normalize_vbook_display_text(
                    str(row.get("title") or row.get("name") or row.get("label") or row.get("text") or ""),
                    single_line=True,
                )
                script = str(row.get("script") or row.get("file") or "genre").strip()
                input_value = row.get("input")
                if input_value is None:
                    input_value = row.get("url")
                if input_value is None:
                    input_value = row.get("link")
                host = str(row.get("host") or "").strip()
            elif isinstance(row, str):
                title = normalize_vbook_display_text(row, single_line=True)
                script = "genre"
                input_value = row
            else:
                continue

            if not title:
                continue

            if isinstance(input_value, str):
                raw_input_text = input_value.strip()
                if raw_input_text and host and not raw_input_text.startswith("http"):
                    joined = self._join_vbook_url(host, raw_input_text)
                    if joined:
                        input_value = joined
                elif not raw_input_text:
                    input_value = title
            elif input_value is None:
                input_value = title

            script = script or "genre"
            dedupe_key = json.dumps(
                [title.lower(), script, input_value],
                ensure_ascii=False,
                sort_keys=True,
                default=str,
            )
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            out.append(
                {
                    "title": title,
                    "script": script,
                    "input": input_value,
                }
            )
        return out[:120]

    def _stringify_vbook_extra_value(self, value: Any, *, depth: int = 0) -> str:
        if depth >= 3:
            return normalize_vbook_display_text(str(value or ""), single_line=True)
        if value is None:
            return ""
        if isinstance(value, str):
            return normalize_vbook_display_text(value, single_line=False)
        if isinstance(value, bool):
            return "true" if value else "false"
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, list):
            lines: list[str] = []
            for idx, item in enumerate(value[:25], start=1):
                text = self._stringify_vbook_extra_value(item, depth=depth + 1)
                if not text:
                    continue
                compact = re.sub(r"\s+", " ", text).strip()
                if compact:
                    lines.append(f"{idx}. {compact}")
            remain = len(value) - len(value[:25])
            if remain > 0:
                lines.append(f"... (+{remain})")
            return "\n".join(lines).strip()
        if isinstance(value, dict):
            lines: list[str] = []
            items = list(value.items())
            for key, item in items[:30]:
                label = normalize_vbook_display_text(str(key or ""), single_line=True)
                text = self._stringify_vbook_extra_value(item, depth=depth + 1)
                if not label or not text:
                    continue
                compact = re.sub(r"\s+", " ", text).strip()
                lines.append(f"{label}: {compact}")
            remain = len(items) - len(items[:30])
            if remain > 0:
                lines.append(f"... (+{remain})")
            return "\n".join(lines).strip()
        return normalize_vbook_display_text(str(value), single_line=False)

    def _normalize_vbook_extra_fields(self, detail: dict[str, Any]) -> list[dict[str, str]]:
        if not isinstance(detail, dict):
            return []
        skip_keys = {
            "name",
            "title",
            "author",
            "cover",
            "image",
            "description",
            "desc",
            "host",
            "url",
            "link",
            "suggest",
            "suggests",
            "recommend",
            "recommends",
            "related",
            "comment",
            "comments",
            "review",
            "reviews",
            "genres",
            "genre",
            "categories",
            "category",
            "tags",
            "tag",
        }
        extras: list[dict[str, str]] = []
        for raw_key, raw_val in detail.items():
            key_norm = str(raw_key or "").strip()
            if not key_norm:
                continue
            key_lower = key_norm.lower()
            if key_lower in skip_keys:
                continue
            if key_lower == "ongoing":
                ongoing = self._parse_vbook_ongoing(raw_val)
                if ongoing is True:
                    value_text = "Còn tiếp"
                elif ongoing is False:
                    value_text = "Hoàn thành"
                else:
                    value_text = self._stringify_vbook_extra_value(raw_val)
                label = "Trạng thái"
            elif key_lower == "detail":
                value_text = self._stringify_vbook_extra_value(raw_val)
                label = "Thông tin"
            else:
                value_text = self._stringify_vbook_extra_value(raw_val)
                label = normalize_vbook_display_text(key_norm, single_line=True)
            if not value_text:
                continue
            extras.append(
                {
                    "key": label,
                    "value": value_text,
                }
            )
        return extras[:120]

    def _normalize_vbook_script_ref(self, plugin: Any, script_ref: str, *, default_key: str) -> str:
        ref = str(script_ref or "").strip()
        if not ref:
            ref = default_key
        # Script key trong plugin.json.
        if not ref.endswith(".js"):
            self._ensure_plugin_has_script(plugin, ref)
            return ref
        # Script file trực tiếp (từ tab home/genre trả về), chặn path traversal.
        ref = ref.replace("\\", "/").lstrip("/")
        if ref.startswith("src/"):
            ref = ref[4:]
        parts = [p for p in ref.split("/") if p]
        if not parts or any(p == ".." for p in parts):
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Script tab không hợp lệ.")
        if not re.fullmatch(r"[A-Za-z0-9._/-]+\.js", ref):
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Script tab không hợp lệ.")
        return ref

    def _run_vbook_paged_list_script(
        self,
        plugin: Any,
        *,
        script_ref: str,
        input_value: Any = None,
        page: int = 1,
        next_token: Any = None,
    ) -> tuple[list[Any], Any]:
        p = max(1, int(page or 1))
        has_next_token = next_token is not None and str(next_token).strip() != ""
        has_input = input_value is not None and (not isinstance(input_value, str) or bool(input_value.strip()))

        candidates: list[list[Any]] = []
        if has_input:
            if has_next_token:
                candidates.append([input_value, next_token])
            candidates.extend(
                [
                    [input_value, ""],
                    [input_value],
                    [input_value, p],
                    [input_value, str(p)],
                ]
            )
        else:
            if has_next_token:
                candidates.append([next_token])
            candidates.extend([[], [p], [str(p)]])

        seen: set[str] = set()
        last_error: Exception | None = None
        data: Any = []
        next_value: Any = None
        for args in candidates:
            sig = json.dumps(args, ensure_ascii=False, sort_keys=True, default=str)
            if sig in seen:
                continue
            seen.add(sig)
            try:
                data, next_value = self._run_vbook_script_with_next(plugin, script_ref, args)
                last_error = None
                break
            except Exception as exc:
                last_error = exc
                continue

        if last_error is not None:
            if isinstance(last_error, ApiError):
                raise last_error
            raise ApiError(
                HTTPStatus.BAD_GATEWAY,
                "VBOOK_LIST_SCRIPT_FAILED",
                "Không thể tải danh sách từ script vBook.",
                {
                    "plugin_id": str(getattr(plugin, "plugin_id", "") or ""),
                    "script": script_ref,
                    "error": str(last_error),
                },
            ) from last_error

        return self._extract_vbook_list_rows(data), next_value

    def search_vbook_books(
        self,
        *,
        plugin_id: str,
        query: str,
        page: int = 1,
        next_token: Any = None,
    ) -> dict[str, Any]:
        plugin = self._require_vbook_plugin(plugin_id)
        self._ensure_plugin_has_script(plugin, "search")
        q = str(query or "").strip()
        if not q:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu từ khóa tìm kiếm.")
        p = max(1, int(page or 1))

        candidates: list[list[Any]] = []
        if next_token is not None and str(next_token).strip() != "":
            candidates.extend([[q, next_token], [next_token], [q]])
        candidates.extend([[q, p], [q, str(p)], [q]])
        seen: set[str] = set()
        last_error: Exception | None = None
        best_data: Any = []
        best_next: Any = None
        success = False
        
        for args in candidates:
            sig = json.dumps(args, ensure_ascii=False, sort_keys=True, default=str)
            if sig in seen:
                continue
            seen.add(sig)
            try:
                data, next_value = self._run_vbook_script_with_next(plugin, "search", args)
                last_error = None
                success = True
                best_data = data
                best_next = next_value
                
                if data:
                    break
            except Exception as exc:
                last_error = exc
                continue
                
        if not success and last_error is not None:
            if isinstance(last_error, ApiError):
                raise last_error
            raise ApiError(
                HTTPStatus.BAD_GATEWAY,
                "VBOOK_SEARCH_FAILED",
                "Không thể tìm kiếm bằng plugin vBook này.",
                {"plugin_id": plugin_id, "error": str(last_error)},
            ) from last_error

        rows = best_data if isinstance(best_data, list) else (
            best_data.get("items")
            if isinstance(best_data, dict) and isinstance(best_data.get("items"), list)
            else best_data.get("data")
            if isinstance(best_data, dict) and isinstance(best_data.get("data"), list)
            else best_data.get("list")
            if isinstance(best_data, dict) and isinstance(best_data.get("list"), list)
            else []
        )
        items: list[dict[str, Any]] = []
        for row in rows or []:
            normalized = self._normalize_vbook_search_item(plugin, row, query=q)
            if normalized:
                items.append(normalized)
        return {
            "ok": True,
            "plugin": self._serialize_vbook_plugin(plugin),
            "query": q,
            "page": p,
            "items": items,
            "next": best_next,
            "has_next": best_next is not None and str(best_next).strip() != "",
            "count": len(items),
        }

    def get_vbook_home(
        self,
        *,
        plugin_id: str,
        tab_script: str = "",
        tab_input: Any = None,
        page: int = 1,
        next_token: Any = None,
    ) -> dict[str, Any]:
        plugin = self._require_vbook_plugin(plugin_id)
        p = max(1, int(page or 1))
        # Root mode: trả tabs từ home.js
        if not str(tab_script or "").strip():
            scripts = getattr(plugin, "scripts", None)
            has_script = isinstance(scripts, dict) and bool(str((scripts.get("home") or "")).strip())
            if not has_script:
                return {
                    "ok": True,
                    "plugin": self._serialize_vbook_plugin(plugin),
                    "mode": "tabs",
                    "tabs": [],
                    "items": [],
                    "count": 0,
                    "item_count": 0,
                    "has_script": False,
                }
            data = self._run_vbook_script(plugin, "home", [])
            rows = self._extract_vbook_list_rows(data)
            tabs: list[dict[str, Any]] = []
            items: list[dict[str, Any]] = []
            for row in rows:
                normalized = self._normalize_vbook_search_item(plugin, row, query="")
                if normalized:
                    items.append(normalized)
                    continue
                tab = self._normalize_vbook_tab_item(row)
                if tab:
                    tabs.append(tab)
            return {
                "ok": True,
                "plugin": self._serialize_vbook_plugin(plugin),
                "mode": "tabs",
                "tabs": tabs,
                "items": items,
                "count": len(tabs),
                "item_count": len(items),
                "has_script": True,
            }

        # Content mode: chạy script tab để lấy books.
        script_ref = self._normalize_vbook_script_ref(plugin, tab_script, default_key="home")
        rows, next_value = self._run_vbook_paged_list_script(
            plugin,
            script_ref=script_ref,
            input_value=tab_input,
            page=p,
            next_token=next_token,
        )
        items: list[dict[str, Any]] = []
        extra_tabs: list[dict[str, Any]] = []
        for row in rows:
            normalized = self._normalize_vbook_search_item(plugin, row, query="")
            if normalized:
                items.append(normalized)
                continue
            tab = self._normalize_vbook_tab_item(row)
            if tab:
                extra_tabs.append(tab)
        return {
            "ok": True,
            "plugin": self._serialize_vbook_plugin(plugin),
            "mode": "content",
            "script": script_ref,
            "page": p,
            "items": items,
            "tabs": extra_tabs,
            "next": next_value,
            "has_next": next_value is not None and str(next_value).strip() != "",
            "count": len(items),
            "tab_count": len(extra_tabs),
            "has_script": True,
        }

    def get_vbook_genre(
        self,
        *,
        plugin_id: str,
        tab_script: str = "",
        tab_input: Any = None,
        page: int = 1,
        next_token: Any = None,
    ) -> dict[str, Any]:
        plugin = self._require_vbook_plugin(plugin_id)
        p = max(1, int(page or 1))
        # Root mode: trả tabs từ genre.js
        if not str(tab_script or "").strip():
            scripts = getattr(plugin, "scripts", None)
            has_script = isinstance(scripts, dict) and bool(str((scripts.get("genre") or "")).strip())
            if not has_script:
                return {
                    "ok": True,
                    "plugin": self._serialize_vbook_plugin(plugin),
                    "mode": "tabs",
                    "tabs": [],
                    "items": [],
                    "count": 0,
                    "item_count": 0,
                    "has_script": False,
                }
            data = self._run_vbook_script(plugin, "genre", [])
            rows = self._extract_vbook_list_rows(data)
            tabs: list[dict[str, Any]] = []
            items: list[dict[str, Any]] = []
            for row in rows:
                normalized = self._normalize_vbook_search_item(plugin, row, query="")
                if normalized:
                    items.append(normalized)
                    continue
                tab = self._normalize_vbook_tab_item(row)
                if tab:
                    tabs.append(tab)
            return {
                "ok": True,
                "plugin": self._serialize_vbook_plugin(plugin),
                "mode": "tabs",
                "tabs": tabs,
                "items": items,
                "count": len(tabs),
                "item_count": len(items),
                "has_script": True,
            }

        # Content mode: chạy script tab để lấy books.
        script_ref = self._normalize_vbook_script_ref(plugin, tab_script, default_key="genre")
        rows, next_value = self._run_vbook_paged_list_script(
            plugin,
            script_ref=script_ref,
            input_value=tab_input,
            page=p,
            next_token=next_token,
        )
        items: list[dict[str, Any]] = []
        extra_tabs: list[dict[str, Any]] = []
        for row in rows:
            normalized = self._normalize_vbook_search_item(plugin, row, query="")
            if normalized:
                items.append(normalized)
                continue
            tab = self._normalize_vbook_tab_item(row)
            if tab:
                extra_tabs.append(tab)
        return {
            "ok": True,
            "plugin": self._serialize_vbook_plugin(plugin),
            "mode": "content",
            "script": script_ref,
            "page": p,
            "items": items,
            "tabs": extra_tabs,
            "next": next_value,
            "has_next": next_value is not None and str(next_value).strip() != "",
            "count": len(items),
            "tab_count": len(extra_tabs),
            "has_script": True,
        }

    def get_vbook_detail(self, *, url: str, plugin_id: str = "") -> dict[str, Any]:
        source_url = str(url or "").strip()
        if not source_url:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu URL truyện.")
        plugin = self._resolve_vbook_plugin(source_url, plugin_id=plugin_id or None)
        self._ensure_plugin_has_script(plugin, "detail")
        data = self._run_vbook_script(plugin, "detail", [source_url])
        detail = data if isinstance(data, dict) else {}
        title = normalize_vbook_display_text(str(detail.get("name") or detail.get("title") or ""), single_line=True) or source_url
        author = normalize_vbook_display_text(str(detail.get("author") or ""), single_line=True)
        cover = str(detail.get("cover") or detail.get("image") or "").strip()
        description = normalize_vbook_display_text(
            str(detail.get("description") or detail.get("desc") or ""),
            single_line=False,
        )
        host = str(detail.get("host") or "").strip()
        if cover and host and not cover.startswith("http"):
            cover = self._join_vbook_url(host, cover)
        cover = build_vbook_image_proxy_path(
            cover,
            plugin_id=str(getattr(plugin, "plugin_id", "") or "").strip(),
            referer=source_url,
        )
        is_comic = "comic" in str(getattr(plugin, "type", "") or "").lower()
        ongoing_raw = detail.get("ongoing")
        ongoing = self._parse_vbook_ongoing(ongoing_raw)
        if ongoing is True:
            status_text = "Còn tiếp"
        elif ongoing is False:
            status_text = "Hoàn thành"
        else:
            status_text = normalize_vbook_display_text(str(ongoing_raw or ""), single_line=True)
        info_text = normalize_vbook_display_text(
            str(detail.get("detail") or ""),
            single_line=False,
        )
        title_raw = title
        author_raw = author
        description_raw = description
        status_text_raw = status_text
        info_text_raw = info_text
        suggest_raw = self._pick_vbook_detail_value(
            detail,
            exact_keys=("suggest", "suggests", "recommend", "recommends", "related"),
            fuzzy_tokens=("suggest", "recommend", "related"),
        )
        comment_raw = self._pick_vbook_detail_value(
            detail,
            exact_keys=("comment", "comments", "review", "reviews"),
            fuzzy_tokens=("comment", "review"),
        )
        suggest_items = self._collect_vbook_suggest_items(plugin, suggest_raw)
        comment_items = self._normalize_vbook_comment_items(comment_raw)
        genre_items = self._normalize_vbook_genre_items(detail)
        extra_fields = self._normalize_vbook_extra_fields(detail)
        if self.is_reader_translation_enabled():
            mode = self.reader_translation_mode()
            title = self._translate_ui_text(title, single_line=True, mode=mode) or title
            author = self._translate_ui_text(author, single_line=True, mode=mode) or author
            description = self._translate_ui_text(description, single_line=False, mode=mode) or description
            status_text = self._translate_ui_text(status_text, single_line=True, mode=mode) or status_text
            info_text = self._translate_ui_text(info_text, single_line=False, mode=mode) or info_text
            for item in suggest_items:
                if not isinstance(item, dict):
                    continue
                item["title"] = self._translate_ui_text(item.get("title") or "", single_line=True, mode=mode) or str(item.get("title") or "")
                item["author"] = self._translate_ui_text(item.get("author") or "", single_line=True, mode=mode) or str(item.get("author") or "")
                item["description"] = self._translate_ui_text(
                    item.get("description") or "",
                    single_line=False,
                    mode=mode,
                ) or str(item.get("description") or "")
            for item in comment_items:
                if not isinstance(item, dict):
                    continue
                item["author"] = self._translate_ui_text(item.get("author") or "", single_line=True, mode=mode) or str(item.get("author") or "")
                item["content"] = self._translate_ui_text(item.get("content") or "", single_line=False, mode=mode) or str(item.get("content") or "")
            for item in genre_items:
                if not isinstance(item, dict):
                    continue
                item["title"] = self._translate_ui_text(item.get("title") or "", single_line=True, mode=mode) or str(item.get("title") or "")
            for item in extra_fields:
                if not isinstance(item, dict):
                    continue
                item["key"] = self._translate_ui_text(item.get("key") or "", single_line=True, mode=mode) or str(item.get("key") or "")
                item["value"] = self._translate_ui_text(item.get("value") or "", single_line=False, mode=mode) or str(item.get("value") or "")
        return {
            "ok": True,
            "plugin": self._serialize_vbook_plugin(plugin),
            "detail": {
                "title": title,
                "author": author,
                "title_raw": title_raw,
                "author_raw": author_raw,
                "cover": cover,
                "description": description,
                "description_raw": description_raw,
                "url": source_url,
                "host": host,
                "is_comic": is_comic,
                "source_type": "vbook_comic" if is_comic else "vbook",
                "ongoing": ongoing,
                "status_text": status_text,
                "status_text_raw": status_text_raw,
                "info_text": info_text,
                "info_text_raw": info_text_raw,
                "genres": genre_items,
                "suggest_items": suggest_items,
                "comment_items": comment_items,
                "extra_fields": extra_fields,
            },
        }

    def get_vbook_toc(
        self,
        *,
        url: str,
        plugin_id: str = "",
        page: int = 1,
        page_size: int = 120,
        all_items: bool = False,
    ) -> dict[str, Any]:
        source_url = str(url or "").strip()
        if not source_url:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu URL truyện.")
        plugin = self._resolve_vbook_plugin(source_url, plugin_id=plugin_id or None)
        self._ensure_plugin_has_script(plugin, "toc")
        all_rows = self._fetch_vbook_toc(plugin, source_url)
        total = len(all_rows)

        if all_items:
            p = 1
            ps = max(1, total or int(page_size or 120))
            chunk = all_rows
            total_pages = 1
        else:
            p = max(1, int(page or 1))
            ps = max(1, min(500, int(page_size or 120)))
            total_pages = max(1, (total + ps - 1) // ps)
            if p > total_pages:
                p = total_pages
            offset = (p - 1) * ps
            chunk = all_rows[offset : offset + ps]

        items: list[dict[str, Any]] = []
        translate_mode = self.reader_translation_mode()
        translate_on = self.is_reader_translation_enabled()
        for idx, row in enumerate(chunk, start=(1 if all_items else ((p - 1) * ps + 1))):
            raw_title = normalize_vbook_display_text(
                str(row.get("name") or ""),
                single_line=True,
            ) or f"Chương {idx}"
            title = self._translate_ui_text(raw_title, single_line=True, mode=translate_mode) if translate_on else raw_title
            items.append(
                {
                    "index": idx,
                    "title": title or raw_title,
                    "title_raw": raw_title,
                    "url": str(row.get("remote_url") or "").strip(),
                }
            )
        return {
            "ok": True,
            "plugin": self._serialize_vbook_plugin(plugin),
            "book_url": source_url,
            "items": items,
            "pagination": {
                "page": p,
                "page_size": ps,
                "total_items": total,
                "total_pages": total_pages,
            },
            "all": bool(all_items),
        }

    def get_vbook_chap_debug(self, *, url: str, plugin_id: str = "") -> dict[str, Any]:
        source_url = str(url or "").strip()
        if not source_url:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu URL chương.")
        plugin = self._resolve_vbook_plugin(source_url, plugin_id=plugin_id or None)
        self._ensure_plugin_has_script(plugin, "chap")
        data = self._run_vbook_script(plugin, "chap", [source_url])
        is_comic = "comic" in str(getattr(plugin, "type", "") or "").lower()

        text_content = ""
        images: list[str] = []
        raw_content: Any = data
        if isinstance(data, dict):
            raw_content = data.get("content")
            if isinstance(raw_content, list):
                images = [str(x).strip() for x in raw_content if str(x).strip()]
            else:
                text_content = str(raw_content or data.get("text") or data.get("data") or "").strip()
        elif isinstance(data, list):
            images = [str(x).strip() for x in data if str(x).strip()]
        else:
            text_content = str(data or "").strip()

        if (not images) and text_content and "<" in text_content and ">" in text_content and re.search(r"</?[a-zA-Z][^>]*>", text_content):
            text_content = html_to_text(text_content)
        text_content = normalize_newlines(text_content)

        if is_comic and (not images) and text_content:
            maybe_lines = [line.strip() for line in text_content.splitlines() if line.strip()]
            if maybe_lines and all(line.startswith("http://") or line.startswith("https://") for line in maybe_lines):
                images = maybe_lines
                text_content = ""

        return {
            "ok": True,
            "plugin": self._serialize_vbook_plugin(plugin),
            "chapter": {
                "url": source_url,
                "is_comic": is_comic,
                "images": images,
                "content": text_content,
                "raw_type": type(raw_content).__name__,
            },
        }

    def _fetch_vbook_toc(self, plugin: Any, url: str) -> list[dict[str, str]]:
        pages: list[str] = []
        if getattr(plugin, "scripts", None) and isinstance(plugin.scripts, dict) and plugin.scripts.get("page"):
            try:
                page_data = self._run_vbook_script(plugin, "page", [url])
                if isinstance(page_data, list):
                    pages = [str(x).strip() for x in page_data if str(x).strip()]
            except Exception:
                pages = []

        toc_items: list[Any] = []
        if pages:
            for purl in pages:
                data = self._run_vbook_script(plugin, "toc", [purl])
                if isinstance(data, list):
                    toc_items.extend(data)
        else:
            data = self._run_vbook_script(plugin, "toc", [url])
            if isinstance(data, list):
                toc_items.extend(data)

        output: list[dict[str, str]] = []
        for item in toc_items:
            if not isinstance(item, dict):
                continue
            name = normalize_vbook_display_text(str(item.get("name") or ""), single_line=True)
            href = str(item.get("url") or "").strip()
            host = str(item.get("host") or "").strip()
            remote_url = self._join_vbook_url(host, href)
            if not name or not remote_url:
                continue
            output.append({"name": name, "remote_url": remote_url})
        return output

    def _fetch_remote_chapter(self, chapter: dict[str, Any], book: dict[str, Any]) -> str:
        if not str((book or {}).get("source_type") or "").startswith("vbook"):
            return ""
        remote_url = str((chapter or {}).get("remote_url") or "").strip()
        if not remote_url:
            raise ApiError(HTTPStatus.BAD_GATEWAY, "VBOOK_CHAP_NO_URL", "Chương này thiếu remote_url để tải.")

        plugin_id = str((book or {}).get("source_plugin") or "").strip()
        plugin = None
        if plugin_id and self.vbook_manager:
            for p in self.vbook_manager.list_plugins():
                if p.plugin_id == plugin_id:
                    plugin = p
                    break
        if plugin is None and self.vbook_manager:
            plugin = self.vbook_manager.detect_plugin_for_url(str((book or {}).get("source_url") or "")) or self.vbook_manager.detect_plugin_for_url(remote_url)
        if plugin is None:
            raise ApiError(
                HTTPStatus.BAD_GATEWAY,
                "VBOOK_PLUGIN_MISSING",
                "Không tìm thấy plugin vBook để tải nội dung chương.",
                {"book_id": book.get("book_id"), "source_url": book.get("source_url"), "remote_url": remote_url},
            )

        data = self._run_vbook_script(plugin, "chap", [remote_url])
        content = ""
        is_comic = bool(is_book_comic(book))
        if isinstance(data, dict):
            raw_content = data.get("content")
            if is_comic and isinstance(raw_content, list):
                urls = [str(x).strip() for x in raw_content if str(x).strip()]
                content = encode_comic_payload(urls)
            else:
                content = str(raw_content or data.get("text") or "").strip()
            if not content and "data" in data:
                content = str(data.get("data") or "").strip()
        elif isinstance(data, list):
            urls = [str(x).strip() for x in data if str(x).strip()]
            if is_comic:
                content = encode_comic_payload(urls)
            else:
                content = "\n".join(urls)
        else:
            content = str(data or "")

        # HTML -> text
        core = content
        if (decode_comic_payload(core) is None) and "<" in core and ">" in core and re.search(r"</?[a-zA-Z][^>]*>", core):
            core = html_to_text(core)
        if decode_comic_payload(core) is None:
            core = normalize_newlines(core)
        if is_comic and (decode_comic_payload(core) is None):
            maybe_lines = [line.strip() for line in str(core or "").splitlines() if line.strip()]
            if maybe_lines and all(line.startswith("http://") or line.startswith("https://") for line in maybe_lines):
                core = encode_comic_payload(maybe_lines)

        raw_key = (chapter or {}).get("raw_key") or ""
        if raw_key:
            self.storage.write_cache(raw_key, str((book or {}).get("lang_source") or "zh"), core)
        try:
            comic_payload = decode_comic_payload(core)
            if comic_payload is not None:
                self.storage.update_chapter_word_count(
                    str(chapter.get("chapter_id") or ""),
                    len(comic_payload.get("images") or []),
                )
            else:
                self.storage.update_chapter_word_count(str(chapter.get("chapter_id") or ""), len(core))
        except Exception:
            pass
        return core

    def _build_vbook_image_headers(self, *, image_url: str, plugin_id: str = "", referer: str = "") -> dict[str, str]:
        headers: dict[str, str] = {
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Pragma": "no-cache",
            "Cache-Control": "no-cache",
        }
        parsed = urlparse(str(image_url or "").strip())
        host = normalize_host(parsed.netloc)

        resolved_referer = str(referer or "").strip()
        pid = str(plugin_id or "").strip()
        if (not resolved_referer) and pid:
            try:
                plugin = self._require_vbook_plugin(pid)
                source = str(getattr(plugin, "source", "") or "").strip()
                if source:
                    if source.startswith("http://") or source.startswith("https://"):
                        resolved_referer = source
                    else:
                        resolved_referer = "https://" + source.lstrip("/")
            except Exception:
                resolved_referer = ""
        if (not resolved_referer) and parsed.scheme and parsed.netloc:
            resolved_referer = f"{parsed.scheme}://{parsed.netloc}/"
        if resolved_referer:
            headers["Referer"] = resolved_referer
            parsed_ref = urlparse(resolved_referer)
            if parsed_ref.scheme and parsed_ref.netloc:
                headers["Origin"] = f"{parsed_ref.scheme}://{parsed_ref.netloc}"

        user_agent = ""
        cookie_header = ""
        if host and self.vbook_bridge_enabled:
            state = self._load_vbook_bridge_state()
            entry = self._pick_bridge_host_entry(state, host)
            user_agent = str(entry.get("user_agent") or "").strip()
            if not user_agent:
                user_agent = str(state.get("default_user_agent") or "").strip()
            cookie_header = str(entry.get("cookie_header") or "").strip()
            if not cookie_header:
                cookie_header = self._fallback_cookie_header_from_bridge_state(host, state)

        if not user_agent:
            user_agent = (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36 NovelStudio/vBook"
            )
        headers["User-Agent"] = user_agent
        if cookie_header:
            headers["Cookie"] = cookie_header
        return headers

    def _vbook_image_cache_paths(self, *, image_url: str, plugin_id: str = "") -> tuple[Path, Path]:
        seed = f"{str(plugin_id or '').strip()}|{str(image_url or '').strip()}"
        key = hash_text(seed)
        return (
            VBOOK_IMAGE_CACHE_DIR / f"{key}.bin",
            VBOOK_IMAGE_CACHE_DIR / f"{key}.json",
        )

    def _read_vbook_image_cache(self, *, image_url: str, plugin_id: str = "") -> tuple[bytes, str] | None:
        body_path, meta_path = self._vbook_image_cache_paths(image_url=image_url, plugin_id=plugin_id)
        if (not body_path.exists()) or (not meta_path.exists()):
            return None
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            if not isinstance(meta, dict):
                return None
        except Exception:
            return None
        try:
            ts = float(meta.get("ts") or 0.0)
        except Exception:
            ts = 0.0
        # TTL cache ảnh nguồn online: 7 ngày.
        if (not ts) or ((datetime.now(timezone.utc).timestamp() - ts) > (7 * 24 * 3600)):
            return None
        try:
            data = body_path.read_bytes()
        except Exception:
            return None
        if not data:
            return None
        ctype = str(meta.get("content_type") or "").strip()
        if not ctype:
            parsed = urlparse(str(image_url or "").strip())
            ctype = mimetypes.guess_type(parsed.path)[0] or "application/octet-stream"
        return data, ctype

    def _write_vbook_image_cache(
        self,
        *,
        image_url: str,
        plugin_id: str = "",
        content_type: str = "",
        data: bytes,
    ) -> None:
        if not data:
            return
        body_path, meta_path = self._vbook_image_cache_paths(image_url=image_url, plugin_id=plugin_id)
        body_path.parent.mkdir(parents=True, exist_ok=True)
        tmp_body = body_path.with_suffix(".bin.tmp")
        tmp_meta = meta_path.with_suffix(".json.tmp")
        try:
            tmp_body.write_bytes(data)
            tmp_meta.write_text(
                json.dumps(
                    {
                        "ts": datetime.now(timezone.utc).timestamp(),
                        "content_type": str(content_type or "").strip(),
                        "url": str(image_url or "").strip(),
                        "plugin_id": str(plugin_id or "").strip(),
                    },
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )
            os.replace(tmp_body, body_path)
            os.replace(tmp_meta, meta_path)
        except Exception:
            try:
                tmp_body.unlink(missing_ok=True)
            except Exception:
                pass
            try:
                tmp_meta.unlink(missing_ok=True)
            except Exception:
                pass

    def fetch_vbook_image(self, *, image_url: str, plugin_id: str = "", referer: str = "") -> tuple[bytes, str]:
        target = str(image_url or "").strip()
        parsed = urlparse(target)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "URL ảnh vBook không hợp lệ.")

        cached = self._read_vbook_image_cache(image_url=target, plugin_id=plugin_id)
        if cached is not None:
            return cached

        headers = self._build_vbook_image_headers(image_url=target, plugin_id=plugin_id, referer=referer)
        timeout_ms = int((self._vbook_cfg().get("timeout_ms") or 20_000))
        timeout_sec = max(3.0, min(60.0, timeout_ms / 1000.0))
        req = urllib_request.Request(target, headers=headers, method="GET")
        try:
            with urllib_request.urlopen(req, timeout=timeout_sec) as resp:
                data = resp.read()
                content_type = str(resp.headers.get("Content-Type") or "").split(";", 1)[0].strip()
        except urllib_error.HTTPError as exc:
            raise ApiError(
                HTTPStatus.BAD_GATEWAY,
                "VBOOK_IMAGE_FETCH_FAILED",
                "Không thể tải ảnh từ nguồn vBook.",
                {"url": target, "status": int(exc.code), "reason": str(exc.reason or "")},
            ) from exc
        except Exception as exc:
            raise ApiError(
                HTTPStatus.BAD_GATEWAY,
                "VBOOK_IMAGE_FETCH_FAILED",
                "Không thể tải ảnh từ nguồn vBook.",
                {"url": target, "error": str(exc)},
            ) from exc

        if not data:
            raise ApiError(
                HTTPStatus.BAD_GATEWAY,
                "VBOOK_IMAGE_EMPTY",
                "Nguồn ảnh vBook trả dữ liệu rỗng.",
                {"url": target},
            )
        ctype = content_type or (mimetypes.guess_type(parsed.path)[0] or "application/octet-stream")
        self._write_vbook_image_cache(
            image_url=target,
            plugin_id=plugin_id,
            content_type=ctype,
            data=data,
        )
        return data, ctype

    def _join_vbook_url(self, host: str, url: str) -> str:
        href = (url or "").strip()
        if not href:
            return ""
        if href.startswith("http://") or href.startswith("https://"):
            return href
        h = (host or "").strip()
        if not h:
            return href
        return h.rstrip("/") + "/" + href.lstrip("/")


class ApiError(Exception):
    def __init__(self, status: HTTPStatus, error_code: str, message: str, details: Any = None):
        super().__init__(message)
        self.status = status
        self.error_code = error_code
        self.message = message
        self.details = details


@dataclass
class MultipartPart:
    name: str
    filename: str | None
    content: bytes

    @property
    def file(self) -> io.BytesIO:
        return io.BytesIO(self.content)

    @property
    def text(self) -> str:
        return decode_text_with_fallback(self.content)


class MultipartForm:
    def __init__(self):
        self._items: dict[str, list[MultipartPart]] = {}

    def add(self, part: MultipartPart) -> None:
        self._items.setdefault(part.name, []).append(part)

    def __contains__(self, name: str) -> bool:
        return name in self._items and bool(self._items[name])

    def getfirst(self, name: str, default: str | None = None) -> str | None:
        items = self._items.get(name) or []
        if not items:
            return default
        return items[0].text

    def get_file(self, name: str) -> MultipartPart | None:
        items = self._items.get(name) or []
        for item in items:
            if item.filename is not None:
                return item
        return None


class ReaderApiHandler(SimpleHTTPRequestHandler):
    server_version = "ReaderServer/1.0"
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
    }

    def __init__(self, *args, ui_dir: Path, service: ReaderService, **kwargs):
        self.ui_dir = ui_dir
        self.service = service
        super().__init__(*args, directory=str(ui_dir), **kwargs)

    def log_message(self, fmt: str, *args):  # noqa: A003
        return super().log_message(fmt, *args)

    def end_headers(self):  # noqa: N802
        path = urlparse(self.path).path
        if not path.startswith("/api/") and not path.startswith("/media/"):
            # Tránh mismatch file mới/cũ do browser giữ cache module HTML/CSS/JS.
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self._dispatch_api("GET", parsed)
            return
        if parsed.path.startswith("/media/"):
            self._serve_media(parsed)
            return
        if parsed.path == "/favicon.ico":
            favicon_path = Path(str(self.directory or "")) / "favicon.ico"
            if favicon_path.exists():
                super().do_GET()
                return
            self.send_response(HTTPStatus.NO_CONTENT)
            self.send_header("Content-Length", "0")
            try:
                self.end_headers()
            except OSError as exc:
                if self._is_client_disconnect_error(exc):
                    return
                raise
            return

        route_map = {
            "/": "/library.html",
            "": "/library.html",
            "/index.html": "/library.html",
            "/library": "/library.html",
            "/search": "/search.html",
            "/explore": "/explore.html",
            "/book": "/book.html",
            "/reader": "/reader.html",
        }
        if parsed.path in route_map:
            self.path = route_map[parsed.path]
            super().do_GET()
            return
        super().do_GET()

    def do_POST(self):  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self._dispatch_api("POST", parsed)
            return
        self._send_error_json(ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy endpoint."))

    def do_DELETE(self):  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self._dispatch_api("DELETE", parsed)
            return
        self._send_error_json(ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy endpoint."))

    def _dispatch_api(self, method: str, parsed):
        trace_id = uuid.uuid4().hex
        try:
            self.service.refresh_config()
            data = self._handle_api(method, parsed)
            self._send_json(data, trace_id=trace_id)
        except ApiError as exc:
            try:
                self._send_error_json(exc, trace_id=trace_id)
            except OSError as send_exc:
                if self._is_client_disconnect_error(send_exc):
                    return
                raise
        except Exception as exc:
            if self._is_client_disconnect_error(exc):
                return
            details = {
                "exception": exc.__class__.__name__,
                "traceback": traceback.format_exc(limit=5),
            }
            try:
                self._send_error_json(
                    ApiError(HTTPStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Lỗi hệ thống nội bộ.", details),
                    trace_id=trace_id,
                )
            except OSError as send_exc:
                if self._is_client_disconnect_error(send_exc):
                    return
                raise

    def _handle_api(self, method: str, parsed):
        path = parsed.path
        query = parse_qs(parsed.query)

        if method == "GET" and path == "/api/health":
            return {
                "ok": True,
                "version": ReaderService.VERSION,
                "time": utc_now_iso(),
            }

        if method == "GET" and path == "/api/reader/settings":
            return self.service.get_reader_settings()

        if method == "POST" and path == "/api/reader/settings":
            payload = self._read_json_body()
            return self.service.set_reader_settings(payload)

        if method == "GET" and path == "/api/themes":
            active = self.service.storage.get_theme_active()
            return {"active": active, "items": THEME_PRESETS}

        if method == "POST" and path == "/api/themes/active":
            payload = self._read_json_body()
            theme_id = (payload.get("theme_id") or "").strip()
            if not theme_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu theme_id.")
            if theme_id not in {x["id"] for x in THEME_PRESETS}:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Theme không hợp lệ.")
            self.service.storage.set_theme_active(theme_id)
            return {"ok": True, "active": theme_id}

        if method == "GET" and path == "/api/name-sets":
            default_sets = self.service._default_name_sets()
            book_id = (query.get("book_id", [""])[0] or "").strip() or None
            state = self.service.storage.get_name_set_state(
                default_sets=default_sets,
                active_default=self.service._default_active_name_set(default_sets),
                book_id=book_id,
            )
            return {"ok": True, **state}

        if method == "POST" and path == "/api/name-sets":
            payload = self._read_json_body()
            sets = payload.get("sets")
            active_set = (payload.get("active_set") or "").strip() or None
            bump_version = bool(payload.get("bump_version", True))
            book_id = (payload.get("book_id") or "").strip() or None
            state = self.service.storage.set_name_set_state(
                sets if isinstance(sets, dict) else None,
                active_set=active_set,
                bump_version=bump_version,
                book_id=book_id,
            )
            return {"ok": True, **state}

        if method == "POST" and path == "/api/name-sets/entry":
            payload = self._read_json_body()
            source = (payload.get("source") or "").strip()
            target = (payload.get("target") or "").strip()
            set_name = (payload.get("set_name") or "").strip() or None
            delete = bool(payload.get("delete", False))
            book_id = (payload.get("book_id") or "").strip() or None
            if not source:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu source cho entry name set.")
            try:
                state = self.service.storage.update_name_set_entry(
                    source,
                    target,
                    set_name=set_name,
                    delete=delete,
                    book_id=book_id,
                )
            except ValueError as exc:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", str(exc)) from exc
            return {"ok": True, **state}

        if method == "POST" and path == "/api/name-sets/preview":
            payload = self._read_json_body()
            text = (payload.get("text") or "").strip()
            if not text:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu text cần preview.")
            translate_mode = (payload.get("translation_mode") or "local").strip().lower()
            if translate_mode not in {"local", "server", "hanviet"}:
                translate_mode = "local"
            override_name_set = payload.get("name_set")
            if override_name_set is not None and not isinstance(override_name_set, dict):
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "name_set phải là object.")
            if override_name_set is None:
                book_id = (payload.get("book_id") or "").strip()
                if book_id:
                    default_sets = self.service._default_name_sets()
                    _, override_name_set, _ = self.service.storage.get_active_name_set(
                        default_sets=default_sets,
                        active_default=self.service._default_active_name_set(default_sets),
                        book_id=book_id,
                    )
            detail = self.service.translator.translate_detailed(
                text,
                mode=translate_mode,
                name_set_override=override_name_set if isinstance(override_name_set, dict) else None,
            )
            detail.pop("unit_map", None)
            return {"ok": True, **detail}

        if method == "POST" and path == "/api/name-suggest":
            payload = self._read_json_body()
            source_text = normalize_newlines(payload.get("source_text") or "").strip()
            if not source_text:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu source_text để gợi ý name.")
            source_cjk = "".join(ch for ch in source_text if re.search(r"[\u3400-\u9fff]", ch))
            if not source_cjk:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "source_text phải chứa chữ Trung.")

            hv_text = ""
            translate_mode = self.service.resolve_translate_mode(
                payload.get("translation_mode") or self.service.reader_translation_mode()
            )
            book_id = str(payload.get("book_id") or "").strip()
            set_name = str(payload.get("set_name") or "").strip() or None
            personal_name: dict[str, str] = {}
            personal_vp: dict[str, str] = {}
            if book_id:
                try:
                    _, personal_name, _ = self.service.storage.get_active_name_set(
                        default_sets=self.service._default_name_sets(),
                        active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                        book_id=book_id,
                    )
                    if set_name:
                        state = self.service.storage.get_name_set_state(
                            default_sets=self.service._default_name_sets(),
                            active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                            book_id=book_id,
                        )
                        candidate = (state.get("sets") or {}).get(set_name)
                        if isinstance(candidate, dict):
                            personal_name = normalize_name_set(candidate)
                    personal_vp, _ = self.service.storage.get_book_vp_set(book_id)
                except Exception:
                    personal_name = {}
                    personal_vp = {}
            global_dicts = self.service.get_local_global_dicts()
            local_bundle = None
            if translate_mode in {"local", "hanviet"}:
                try:
                    local_settings = vbook_local_translate.normalize_local_settings(
                        (self.service.reader_translation_settings or {}).get("local") or {},
                        default_base_dir="reader_ui/translate/vbook_local",
                    )
                    local_bundle = vbook_local_translate.get_public_bundle(local_settings)
                    hv_text = vbook_local_translate.build_hanviet_text(source_cjk, local_settings) or source_cjk
                except Exception:
                    hv_text = source_cjk
            else:
                settings = self.service.translator._settings()
                try:
                    hv_list = translator_logic.translate_text_chunks(
                        [source_cjk],
                        name_set={},
                        settings=settings,
                        update_progress_callback=None,
                        target_lang="hv",
                    )
                    hv_text = str(hv_list[0] if hv_list else "").strip()
                except Exception:
                    hv_text = ""

                if (not hv_text) or hv_text.startswith("[Lỗi"):
                    try:
                        hv_map = translator_logic.load_hanviet_json(settings.get("hanvietJsonUrl", ""))
                        hv_text = translator_logic.build_hanviet_from_map(source_cjk, hv_map) or source_cjk
                    except Exception:
                        hv_text = source_cjk
                # Server mode vẫn dùng bộ dict local để tạo gợi ý bảng phải.
                try:
                    local_bundle = vbook_local_translate.get_public_bundle(
                        (self.service.reader_translation_settings or {}).get("local") or {}
                    )
                except Exception:
                    local_bundle = None

            rows = build_incremental_hv_suggestions(source_cjk, hv_text)
            items: list[dict[str, Any]] = []
            for idx, row in enumerate(rows, start=1):
                zh = str(row.get("source_text") or "").strip()
                hv = str(row.get("han_viet") or "").strip()
                if not zh or not hv:
                    continue
                items.append(
                    {
                        "index": idx,
                        "source_text": zh,
                        "han_viet": hv,
                        "google_translate_url": f"https://translate.google.com/?sl=zh-CN&tl=vi&text={quote(zh)}&op=translate",
                        "google_search_url": f"https://www.google.com/search?q={quote(zh)}",
                    }
                )
            right_items = build_name_right_suggestions(
                source_cjk,
                hv_text=hv_text,
                personal_name=personal_name,
                personal_vp=personal_vp,
                global_name=global_dicts.get("name"),
                global_vp=global_dicts.get("vp"),
                bundle=local_bundle,
                prefer_kind=payload.get("dict_type") or "name",
                prefer_scope=payload.get("scope") or "book",
            )
            for row in right_items:
                zh = str(row.get("source_text") or source_cjk).strip() or source_cjk
                row["google_translate_url"] = f"https://translate.google.com/?sl=zh-CN&tl=vi&text={quote(zh)}&op=translate"
                row["google_search_url"] = f"https://www.google.com/search?q={quote(zh)}"

            return {
                "ok": True,
                "source_text": source_cjk,
                "han_viet_raw": hv_text,
                "items": items,
                "right_items": right_items,
            }

        if method == "GET" and path == "/api/local-dicts/global":
            return {
                "ok": True,
                "global_dicts": self.service.get_local_global_dicts(),
            }

        if method == "POST" and path == "/api/local-dicts/global":
            payload = self._read_json_body()
            return self.service.set_local_global_dicts(
                name=payload.get("name"),
                vp=payload.get("vp"),
            )

        if method == "POST" and path == "/api/local-dicts/global/entry":
            payload = self._read_json_body()
            return self.service.update_local_dict_entry(
                dict_type=payload.get("dict_type") or "name",
                scope="global",
                source=payload.get("source") or "",
                target=payload.get("target") or "",
                delete=bool(payload.get("delete", False)),
            )

        if method == "GET" and path.startswith("/api/local-dicts/book/"):
            book_id = unquote(path.removeprefix("/api/local-dicts/book/")).strip("/")
            if not book_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
            return self.service.get_book_local_dicts(book_id)

        if method == "POST" and path.startswith("/api/local-dicts/book/") and path.endswith("/entry"):
            book_id = unquote(path.removeprefix("/api/local-dicts/book/").removesuffix("/entry")).strip("/")
            if not book_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
            payload = self._read_json_body()
            return self.service.update_local_dict_entry(
                dict_type=payload.get("dict_type") or "name",
                scope="book",
                source=payload.get("source") or "",
                target=payload.get("target") or "",
                delete=bool(payload.get("delete", False)),
                book_id=book_id,
                set_name=payload.get("set_name"),
            )

        if method == "GET" and path == "/api/library/books":
            try:
                self.service.storage.cleanup_expired_history()
            except Exception:
                pass
            books = self.service.list_books()
            return {"items": books}

        if method == "GET" and path == "/api/library/download/jobs":
            all_raw = (query.get("all", ["0"])[0] or "0").strip().lower()
            active_only = all_raw not in {"1", "true", "yes", "on"}
            return self.service.list_download_jobs(active_only=active_only)

        if method == "GET" and path == "/api/library/history":
            items = self.service.list_history_books()
            return {"ok": True, "items": items, "count": len(items)}

        if method == "POST" and path == "/api/library/history/upsert":
            payload = self._read_json_body()
            item = self.service.upsert_history_book(payload)
            return {"ok": True, "item": item}

        if method == "DELETE" and path.startswith("/api/library/history/"):
            history_id = unquote(path.removeprefix("/api/library/history/").strip("/"))
            if not history_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu history_id.")
            deleted = self.service.delete_history_book(history_id)
            if not deleted:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy lịch sử xem để xóa.")
            return {"ok": True}

        if method == "GET" and path == "/api/vbook/plugins":
            items = self.service.list_vbook_plugins()
            return {"ok": True, "items": items}

        if method == "GET" and path == "/api/vbook/settings":
            # Backward compatible alias -> global
            return self.service.get_vbook_settings_global()

        if method == "POST" and path == "/api/vbook/settings":
            # Backward compatible alias -> global
            payload = self._read_json_body()
            return self.service.set_vbook_settings_global(payload)

        if method == "GET" and path == "/api/vbook/settings/global":
            return self.service.get_vbook_settings_global()

        if method == "POST" and path == "/api/vbook/settings/global":
            payload = self._read_json_body()
            return self.service.set_vbook_settings_global(payload)

        if method == "GET" and path == "/api/vbook/settings/effective":
            plugin_id = (query.get("plugin_id", [""])[0] or "").strip()
            return self.service.get_vbook_settings_effective(plugin_id=plugin_id)

        if path.startswith("/api/vbook/settings/plugin/"):
            plugin_id = unquote(path.removeprefix("/api/vbook/settings/plugin/").strip("/"))
            if not plugin_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id.")
            if method == "GET":
                return self.service.get_vbook_settings_plugin(plugin_id)
            if method == "POST":
                payload = self._read_json_body()
                return self.service.set_vbook_settings_plugin(plugin_id, payload)
            if method == "DELETE":
                return self.service.delete_vbook_settings_plugin(plugin_id)

        if method == "GET" and path == "/api/vbook/bridge/state":
            return self.service.get_vbook_bridge_state()

        if method == "POST" and path == "/api/vbook/search":
            payload = self._read_json_body()
            plugin_id = str(payload.get("plugin_id") or "").strip()
            query_text = str(payload.get("query") or payload.get("q") or "").strip()
            page_raw = payload.get("page")
            try:
                page = int(page_raw) if page_raw is not None and str(page_raw).strip() else 1
            except Exception:
                page = 1
            next_token = payload.get("next")
            return self.service.search_vbook_books(
                plugin_id=plugin_id,
                query=query_text,
                page=page,
                next_token=next_token,
            )

        if method == "POST" and path == "/api/vbook/home":
            payload = self._read_json_body()
            plugin_id = str(payload.get("plugin_id") or "").strip()
            tab_script = str(payload.get("tab_script") or payload.get("script") or "").strip()
            tab_input = payload.get("tab_input")
            if "input" in payload and tab_input is None:
                tab_input = payload.get("input")
            page_raw = payload.get("page")
            try:
                page = int(page_raw) if page_raw is not None and str(page_raw).strip() else 1
            except Exception:
                page = 1
            next_token = payload.get("next")
            return self.service.get_vbook_home(
                plugin_id=plugin_id,
                tab_script=tab_script,
                tab_input=tab_input,
                page=page,
                next_token=next_token,
            )

        if method == "POST" and path == "/api/vbook/genre":
            payload = self._read_json_body()
            plugin_id = str(payload.get("plugin_id") or "").strip()
            tab_script = str(payload.get("tab_script") or payload.get("script") or "").strip()
            tab_input = payload.get("tab_input")
            if "input" in payload and tab_input is None:
                tab_input = payload.get("input")
            page_raw = payload.get("page")
            try:
                page = int(page_raw) if page_raw is not None and str(page_raw).strip() else 1
            except Exception:
                page = 1
            next_token = payload.get("next")
            return self.service.get_vbook_genre(
                plugin_id=plugin_id,
                tab_script=tab_script,
                tab_input=tab_input,
                page=page,
                next_token=next_token,
            )

        if method == "POST" and path == "/api/vbook/detail":
            payload = self._read_json_body()
            source_url = str(payload.get("url") or "").strip()
            plugin_id = str(payload.get("plugin_id") or "").strip()
            return self.service.get_vbook_detail(url=source_url, plugin_id=plugin_id)

        if method == "POST" and path == "/api/vbook/toc":
            payload = self._read_json_body()
            source_url = str(payload.get("url") or "").strip()
            plugin_id = str(payload.get("plugin_id") or "").strip()
            try:
                page = int(payload.get("page") or 1)
            except Exception:
                page = 1
            try:
                page_size = int(payload.get("page_size") or 120)
            except Exception:
                page_size = 120
            all_raw = payload.get("all")
            if isinstance(all_raw, bool):
                all_items = all_raw
            else:
                all_items = str(all_raw or "").strip().lower() in {"1", "true", "yes", "on"}
            return self.service.get_vbook_toc(
                url=source_url,
                plugin_id=plugin_id,
                page=page,
                page_size=page_size,
                all_items=all_items,
            )

        if method == "POST" and path == "/api/vbook/chap":
            payload = self._read_json_body()
            source_url = str(payload.get("url") or "").strip()
            plugin_id = str(payload.get("plugin_id") or "").strip()
            return self.service.get_vbook_chap_debug(url=source_url, plugin_id=plugin_id)

        if method == "GET" and path == "/api/vbook/repos":
            repo_urls = self.service.get_vbook_repo_urls()
            return {
                "ok": True,
                "items": [{"url": u} for u in repo_urls],
                "count": len(repo_urls),
            }

        if method == "POST" and path == "/api/vbook/repos":
            payload = self._read_json_body()
            urls_raw = payload.get("repo_urls")
            if not isinstance(urls_raw, list):
                items = payload.get("items")
                if isinstance(items, list):
                    urls_raw = [x.get("url") if isinstance(x, dict) else x for x in items]
                else:
                    urls_raw = []
            if not urls_raw:
                text_raw = str(
                    payload.get("repo_urls_text")
                    or payload.get("repo_url")
                    or payload.get("url")
                    or ""
                ).strip()
                if text_raw:
                    urls_raw = [x.strip() for x in re.split(r"[\n,;]+", text_raw) if x and x.strip()]
            repo_urls = self.service.set_vbook_repo_urls(urls_raw)
            return {
                "ok": True,
                "items": [{"url": u} for u in repo_urls],
                "count": len(repo_urls),
            }

        if method == "GET" and path == "/api/vbook/repo/plugins":
            repo_url = (query.get("repo_url", [""])[0] or "").strip()
            items, errors = self.service.list_vbook_repo_plugins(repo_url=repo_url)
            return {
                "ok": True,
                "items": items,
                "errors": errors,
            }

        if method == "POST" and path == "/api/vbook/plugins/install":
            payload = self._read_json_body()
            plugin_url = str(payload.get("plugin_url") or payload.get("url") or "").strip()
            plugin_id = str(payload.get("plugin_id") or "").strip()
            plugin = self.service.install_vbook_plugin(plugin_url=plugin_url, plugin_id=plugin_id)
            return {"ok": True, "plugin": plugin}

        if method == "POST" and path == "/api/vbook/plugins/install-local":
            form = self._read_multipart_form()
            part = form.get_file("file")
            if part is None:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu file plugin zip.")
            plugin_id = str(form.getfirst("plugin_id") or "").strip()
            plugin = self.service.install_vbook_plugin_local(
                filename=part.filename or "",
                content=part.content,
                plugin_id=plugin_id,
            )
            return {"ok": True, "plugin": plugin}

        if method == "DELETE" and path.startswith("/api/vbook/plugins/"):
            plugin_id = path.removeprefix("/api/vbook/plugins/").strip("/")
            if not plugin_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id.")
            removed = self.service.remove_vbook_plugin(plugin_id)
            if not removed:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy plugin để xóa.")
            return {"ok": True}

        if method == "POST" and path == "/api/library/import-url":
            payload = self._read_json_body()
            url = (payload.get("url") or "").strip()
            plugin_id = (payload.get("plugin_id") or "").strip() or None
            history_only = bool(payload.get("history_only", False))
            book = self.service.import_vbook_url(url, plugin_id=plugin_id, history_only=history_only)
            return {"ok": True, "book": book}

        if method == "POST" and path == "/api/library/import":
            form = self._read_multipart_form()
            if "file" not in form:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu file import.")

            file_item = form.get_file("file")
            if file_item is None:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "File không hợp lệ.")

            filename = file_item.filename or "import.txt"
            file_bytes = file_item.content
            lang_source = (form.getfirst("lang_source") or "zh").strip()
            title = (form.getfirst("title") or "").strip()
            author = (form.getfirst("author") or "").strip()

            book = self.service.import_file(filename, file_bytes, lang_source, title, author)
            return {"ok": True, "book": book}

        if method == "GET" and path.startswith("/api/library/book/") and path.endswith("/epub-url"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/epub-url").strip("/")
            book = self.service.storage.find_book(book_id)
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            epub_path = CACHE_DIR / "epub_sources" / f"{book_id}.epub"
            if not epub_path.exists():
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Truyện này không có file EPUB nguồn.")
            return {"ok": True, "url": f"/media/epub/{book_id}.epub"}

        if method == "GET" and path.startswith("/api/library/book/") and path.endswith("/chapters"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/chapters").strip("/")
            if not book_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
            book_found = self.service.storage.find_book(book_id)
            if not book_found:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            page = int((query.get("page", ["1"])[0] or "1"))
            page_size = int((query.get("page_size", ["120"])[0] or "120"))
            mode = (query.get("mode", ["raw"])[0] or "raw").strip().lower()
            if mode not in ("raw", "trans"):
                mode = "raw"
            if mode == "trans" and not self.service.translation_allowed_for_book(book_found):
                mode = "raw"
            if "translation_mode" in query:
                translate_mode = (query.get("translation_mode", ["server"])[0] or "server").strip().lower()
            else:
                translate_mode = self.service.reader_translation_mode()
            translate_mode = self.service.resolve_translate_mode(translate_mode)
            _, active_name_set, _ = self.service.storage.get_active_name_set(
                default_sets=self.service._default_name_sets(),
                active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                book_id=book_id,
            )
            active_vp_set, _ = self.service.storage.get_book_vp_set(book_id)
            data = self.service.storage.list_chapters_paged(
                book_id,
                page=page,
                page_size=page_size,
                mode=mode,
                translator=self.service.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            data["book_id"] = book_id
            data["mode"] = mode
            return data

        if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/download"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/download").strip("/")
            payload = self._read_json_body()
            return self.service.enqueue_book_download(book_id, payload)

        if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/translate-titles"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/translate-titles").strip("/")
            book_found = self.service.storage.find_book(book_id)
            if not book_found:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            if not self.service.translation_allowed_for_book(book_found):
                return {"ok": True, "skipped": True, "reason": "TRANSLATION_NOT_SUPPORTED"}
            payload = self._read_json_body()
            translate_mode = self.service.resolve_translate_mode(payload.get("translation_mode"))
            _, active_name_set, _ = self.service.storage.get_active_name_set(
                default_sets=self.service._default_name_sets(),
                active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                book_id=book_id,
            )
            active_vp_set, _ = self.service.storage.get_book_vp_set(book_id)
            self.service.storage.translate_book_titles(
                book_id,
                self.service.translator,
                translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            return {"ok": True}

        if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/metadata"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/metadata").strip("/")
            payload = self._read_json_body()
            updated = self.service.storage.update_book_metadata(book_id, payload)
            if not updated:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            return {"ok": True, "book": updated}

        if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/cover"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/cover").strip("/")
            form = self._read_multipart_form()
            if "file" in form:
                file_item = form.get_file("file")
                if file_item is None:
                    raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "File cover không hợp lệ.")
                updated = self.service.storage.set_book_cover_upload(
                    book_id, file_item.filename or "cover.jpg", file_item.content
                )
                if not updated:
                    raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
                return {"ok": True, "book": updated}
            cover_url = (form.getfirst("cover_url") or "").strip()
            if cover_url:
                updated = self.service.storage.update_book_metadata(book_id, {"cover_path": cover_url})
                if not updated:
                    raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
                return {"ok": True, "book": updated}
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu file cover hoặc cover_url.")

        if method == "GET" and path.startswith("/api/library/book/"):
            book_id = path.removeprefix("/api/library/book/").strip()
            if not book_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
            translate_titles = (query.get("translate_titles", ["0"])[0] or "0").strip() in {"1", "true", "yes"}
            mode = (query.get("mode", ["raw"])[0] or "raw").strip().lower()
            if mode not in ("raw", "trans"):
                mode = "raw"
            if "translation_mode" in query:
                translate_mode = (query.get("translation_mode", ["server"])[0] or "server").strip().lower()
            else:
                translate_mode = self.service.reader_translation_mode()
            translate_mode = self.service.resolve_translate_mode(translate_mode)
            _, active_name_set, _ = self.service.storage.get_active_name_set(
                default_sets=self.service._default_name_sets(),
                active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                book_id=book_id,
            )
            active_vp_set, _ = self.service.storage.get_book_vp_set(book_id)
            book_preview = self.service.storage.find_book(book_id)
            allow_translate = self.service.translation_allowed_for_book(book_preview)
            if mode == "trans" and not allow_translate:
                mode = "raw"
            if translate_titles and allow_translate:
                self.service.storage.translate_book_titles(
                    book_id,
                    self.service.translator,
                    translate_mode,
                    name_set_override=active_name_set,
                    vp_set_override=active_vp_set,
                )
            book = self.service.storage.get_book_detail(book_id)
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            if allow_translate:
                raw_title = normalize_vbook_display_text(str(book.get("title") or ""), single_line=True) or str(book.get("title") or "")
                raw_author = normalize_vbook_display_text(str(book.get("author") or ""), single_line=True) or str(book.get("author") or "")
                title_vi = normalize_vi_display_text(book.get("title_vi") or "")
                author_vi = normalize_vi_display_text(book.get("author_vi") or "")
                book["translation_supported"] = True
                book["title_display"] = title_vi or self.service._translate_ui_text(raw_title, single_line=True) or raw_title
                book["author_display"] = author_vi or self.service._translate_ui_text(raw_author, single_line=True) or raw_author
            else:
                book["translation_supported"] = False
                book["title_display"] = normalize_vbook_display_text(str(book.get("title") or ""), single_line=True) or str(book.get("title") or "")
                book["author_display"] = normalize_vbook_display_text(str(book.get("author") or ""), single_line=True) or str(book.get("author") or "")
                chapters = book.get("chapters")
                if isinstance(chapters, list):
                    for row in chapters:
                        if not isinstance(row, dict):
                            continue
                        row["title_display"] = normalize_vbook_display_text(str(row.get("title_raw") or ""), single_line=True) or str(row.get("title_raw") or "")
            if book.get("source_type") == "epub":
                epub_path = CACHE_DIR / "epub_sources" / f"{book_id}.epub"
                if epub_path.exists():
                    book["epub_url"] = f"/media/epub/{book_id}.epub"
            return book

        if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/progress"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/progress").strip("/")
            payload = self._read_json_body()
            ratio = payload.get("ratio")
            ratio_val = None
            if isinstance(ratio, (float, int)):
                ratio_val = max(0.0, min(1.0, float(ratio)))
            self.service.storage.update_book_progress(
                book_id,
                chapter_id=(payload.get("chapter_id") or None),
                ratio=ratio_val,
                mode=(payload.get("mode") or None),
                theme_pref=(payload.get("theme_pref") or None),
            )
            return {"ok": True}

        if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/export"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/export").strip("/")
            payload = self._read_json_body()
            fmt = (payload.get("format") or "txt").lower().strip()
            ensure_translated = bool(payload.get("ensure_translated", False))
            translate_mode = (payload.get("translation_mode") or "server").strip()
            use_cached_only = bool(payload.get("use_cached_only", False))
            book = self.service.storage.find_book(book_id)
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            if fmt == "txt" and is_book_comic(book):
                raise ApiError(
                    HTTPStatus.BAD_REQUEST,
                    "COMIC_EXPORT_TXT_NOT_SUPPORTED",
                    "Truyện tranh không hỗ trợ xuất TXT.",
                )

            if fmt == "txt":
                output = self.service.storage.create_export_txt(
                    book_id,
                    ensure_translated,
                    translator=self.service.translator,
                    translate_mode=translate_mode,
                    use_cached_only=use_cached_only,
                )
            elif fmt == "epub":
                output = self.service.storage.create_export_epub(
                    book_id,
                    ensure_translated,
                    translator=self.service.translator,
                    translate_mode=translate_mode,
                    use_cached_only=use_cached_only,
                )
            else:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Định dạng export không hợp lệ.")

            return {
                "ok": True,
                "format": fmt,
                "path": str(output),
                "download_url": f"/media/export/{quote_url_path(output.name)}",
            }

        if method == "DELETE" and path.startswith("/api/library/book/"):
            book_id = unquote(path.removeprefix("/api/library/book/")).strip("/")
            if not book_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
            try:
                self.service.stop_download_jobs_for_book(book_id)
            except Exception:
                pass
            deleted = self.service.storage.delete_book(book_id)
            if not deleted:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện cần xóa.")
            return {"ok": True}

        if method == "POST" and path.startswith("/api/library/download/") and path.endswith("/stop"):
            job_id = path.removeprefix("/api/library/download/").removesuffix("/stop").strip("/")
            return self.service.stop_download_job(job_id)

        if method == "POST" and path == "/api/library/cache/clear":
            result = self.service.storage.clear_translated_cache()
            return {"ok": True, **result}

        if method == "GET" and path == "/api/library/cache/summary":
            return self.service.get_cache_summary()

        if method == "POST" and path == "/api/library/cache/manage":
            payload = self._read_json_body()
            return self.service.manage_cache(payload)

        if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/reload"):
            chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/reload").strip("/")
            return self.service.reload_chapter(chapter_id)

        if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/download"):
            chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/download").strip("/")
            return self.service.enqueue_chapter_download(chapter_id)

        if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/name-preview"):
            chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/name-preview").strip("/")
            chapter = self.service.storage.find_chapter(chapter_id)
            if not chapter:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
            book = self.service.storage.find_book(chapter["book_id"])
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            trans_supported = self.service.translation_allowed_for_book(book)
            if not trans_supported:
                raise ApiError(
                    HTTPStatus.BAD_REQUEST,
                    "TRANSLATION_NOT_SUPPORTED",
                    "Nguồn truyện này không hỗ trợ dịch/name map.",
                )

            payload = self._read_json_body()
            translate_mode = self.service.resolve_translate_mode(payload.get("translation_mode"))
            override_name_set = payload.get("name_set")
            if override_name_set is not None and not isinstance(override_name_set, dict):
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "name_set phải là object.")
            if override_name_set is None:
                _, override_name_set, _ = self.service.storage.get_active_name_set(
                    default_sets=self.service._default_name_sets(),
                    active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                    book_id=chapter["book_id"],
                )
            active_vp_set, _ = self.service.storage.get_book_vp_set(chapter["book_id"])

            raw_text = self.service.storage.get_chapter_text(
                chapter,
                book,
                mode="raw",
                translator=self.service.translator,
                translate_mode=translate_mode,
                name_set_override=override_name_set if isinstance(override_name_set, dict) else None,
                vp_set_override=active_vp_set,
            )
            detail = self.service.translator.translate_detailed(
                raw_text,
                mode=translate_mode,
                name_set_override=override_name_set if isinstance(override_name_set, dict) else None,
                vp_set_override=active_vp_set,
            )
            detail.pop("unit_map", None)

            title_detail = self.service.translator.translate_detailed(
                chapter.get("title_raw") or "",
                mode=translate_mode,
                name_set_override=override_name_set if isinstance(override_name_set, dict) else None,
                vp_set_override=active_vp_set,
            )
            title_detail.pop("unit_map", None)

            return {
                "ok": True,
                "chapter_id": chapter["chapter_id"],
                "book_id": chapter["book_id"],
                "chapter_order": chapter["chapter_order"],
                "title_raw": chapter.get("title_raw") or "",
                "title_translated": title_detail.get("translated") or chapter.get("title_raw") or "",
                "title_name_map": title_detail.get("name_map") or {},
                **detail,
            }

        if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/selection-map"):
            chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/selection-map").strip("/")
            chapter = self.service.storage.find_chapter(chapter_id)
            if not chapter:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
            book = self.service.storage.find_book(chapter["book_id"])
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            if not self.service.translation_allowed_for_book(book):
                raise ApiError(
                    HTTPStatus.BAD_REQUEST,
                    "TRANSLATION_NOT_SUPPORTED",
                    "Nguồn truyện này không hỗ trợ dịch/name map.",
                )

            payload = self._read_json_body()
            selected_text = (payload.get("selected_text") or "").strip()
            if not selected_text:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu selected_text để map edit name.")
            if "start_offset" not in payload or "end_offset" not in payload:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu start_offset/end_offset.")
            try:
                start_offset = int(payload.get("start_offset"))
                end_offset = int(payload.get("end_offset"))
            except Exception:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "start_offset/end_offset phải là số nguyên.")
            translate_mode = self.service.resolve_translate_mode(payload.get("translation_mode"))
            _, active_name_set, version = self.service.storage.get_active_name_set(
                default_sets=self.service._default_name_sets(),
                active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                book_id=chapter["book_id"],
            )
            active_vp_set, active_vp_version = self.service.storage.get_book_vp_set(chapter["book_id"])

            raw_text = self.service.storage.get_chapter_text(
                chapter,
                book,
                mode="raw",
                translator=self.service.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            translated_text = self.service.storage.get_chapter_text(
                chapter,
                book,
                mode="trans",
                translator=self.service.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            current_sig = self.service.translator.translation_signature(
                mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            unit_map = self.service.storage.get_translation_unit_map(chapter["chapter_id"], current_sig, translate_mode)
            if not unit_map:
                detail = self.service.translator.translate_detailed(
                    raw_text,
                    mode=translate_mode,
                    name_set_override=active_name_set,
                    vp_set_override=active_vp_set,
                )
                self.service.storage.save_translation_unit_map(
                    chapter["chapter_id"],
                    current_sig,
                    translate_mode,
                    detail.get("unit_map") if isinstance(detail.get("unit_map"), list) else [],
                )
                unit_map = self.service.storage.get_translation_unit_map(chapter["chapter_id"], current_sig, translate_mode)

            state = self.service.storage.get_name_set_state(
                default_sets=self.service._default_name_sets(),
                active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                book_id=chapter["book_id"],
            )
            active_set_name = str(state.get("active_set") or "").strip()

            mapped = map_selection_to_name_source(
                raw_text=raw_text,
                translated_text=translated_text,
                selected_text=selected_text,
                start_offset=start_offset,
                end_offset=end_offset,
                name_set=active_name_set,
                unit_map=unit_map,
            )

            return {
                "ok": True,
                "chapter_id": chapter["chapter_id"],
                "book_id": chapter["book_id"],
                "translation_mode": translate_mode,
                "map_version": 1,
                "active_set": active_set_name,
                "name_set_version": max(1, version),
                "vp_set_version": max(1, active_vp_version),
                **mapped,
            }

        if method == "GET" and path.startswith("/api/library/chapter/"):
            chapter_id = path.removeprefix("/api/library/chapter/").strip()
            chapter = self.service.storage.find_chapter(chapter_id)
            if not chapter:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
            book = self.service.storage.find_book(chapter["book_id"])
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            trans_supported = self.service.translation_allowed_for_book(book)

            mode = (query.get("mode", ["raw"])[0] or "raw").strip().lower()
            if mode not in ("raw", "trans"):
                mode = "raw"
            if "translation_mode" in query:
                translate_mode = (query.get("translation_mode", ["server"])[0] or "server").strip().lower()
            else:
                translate_mode = self.service.reader_translation_mode()
            translate_mode = self.service.resolve_translate_mode(translate_mode)
            if mode == "trans" and not trans_supported:
                mode = "raw"
            if mode == "trans" and trans_supported:
                _, active_name_set, _ = self.service.storage.get_active_name_set(
                    default_sets=self.service._default_name_sets(),
                    active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                    book_id=chapter["book_id"],
                )
                active_vp_set, _ = self.service.storage.get_book_vp_set(chapter["book_id"])
                self.service.storage.translate_book_titles(
                    chapter["book_id"],
                    self.service.translator,
                    translate_mode,
                    name_set_override=active_name_set,
                    vp_set_override=active_vp_set,
                )
                chapter = self.service.storage.find_chapter(chapter_id) or chapter

            _, active_name_set, _ = self.service.storage.get_active_name_set(
                default_sets=self.service._default_name_sets(),
                active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                book_id=chapter["book_id"],
            )
            active_vp_set, _ = self.service.storage.get_book_vp_set(chapter["book_id"])
            text = self.service.storage.get_chapter_text(
                chapter,
                book,
                mode=mode,
                translator=self.service.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )

            include_name_map = (query.get("include_name_map", ["0"])[0] or "0").strip().lower() in {"1", "true", "yes"}
            name_preview = None
            if include_name_map and mode == "trans" and trans_supported:
                raw_text = self.service.storage.get_chapter_text(
                    chapter,
                    book,
                    mode="raw",
                    translator=self.service.translator,
                    translate_mode=translate_mode,
                    name_set_override=active_name_set,
                    vp_set_override=active_vp_set,
                )
                name_preview = self.service.translator.translate_detailed(
                    raw_text,
                    mode=translate_mode,
                    name_set_override=active_name_set,
                    vp_set_override=active_vp_set,
                )
                if isinstance(name_preview, dict):
                    name_preview.pop("unit_map", None)

            comic_payload = decode_comic_payload(text)
            response_content = text
            content_type = "text"
            images: list[str] = []
            if comic_payload is not None:
                content_type = "images"
                images = [str(x).strip() for x in (comic_payload.get("images") or []) if str(x).strip()]
                source_type = str(book.get("source_type") or "").strip().lower()
                if source_type.startswith("vbook"):
                    plugin_id = str(book.get("source_plugin") or "").strip()
                    referer = str(chapter.get("remote_url") or book.get("source_url") or "").strip()
                    images = [
                        build_vbook_image_proxy_path(img, plugin_id=plugin_id, referer=referer)
                        for img in images
                    ]
                response_content = ""
            output_mode = mode if trans_supported else "raw"
            title_vi = normalize_vi_display_text(chapter.get("title_vi") or "")
            response_title = chapter["title_raw"]
            if output_mode == "trans":
                response_title = title_vi or self.service._translate_ui_text(chapter["title_raw"], single_line=True, mode=translate_mode) or chapter["title_raw"]

            response = {
                "chapter_id": chapter["chapter_id"],
                "book_id": chapter["book_id"],
                "chapter_order": chapter["chapter_order"],
                "title_raw": chapter["title_raw"],
                "title_vi": title_vi,
                "title": response_title,
                "mode": output_mode,
                "content_type": content_type,
                "images": images,
                "content": response_content,
                "is_downloaded": bool(str(chapter.get("raw_key") or "").strip() and (self.service.storage.read_cache(str(chapter.get("raw_key") or "").strip()) is not None)),
            }
            if output_mode == "trans":
                cur_sig = self.service.translator.translation_signature(
                    mode=translate_mode,
                    name_set_override=active_name_set,
                    vp_set_override=active_vp_set,
                )
                response["trans_sig"] = cur_sig
                response["map_version"] = 1
                response["unit_count"] = self.service.storage.get_translation_unit_map_count(
                    chapter["chapter_id"],
                    cur_sig,
                    translate_mode,
                )
            if name_preview:
                response["name_map"] = name_preview.get("name_map") or {}
                response["processed_text"] = name_preview.get("processed_text") or ""
                response["translated_with_placeholders"] = name_preview.get("translated_with_placeholders") or ""
            return response

        if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/translate"):
            chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/translate").strip("/")
            payload = self._read_json_body()
            translate_mode = self.service.resolve_translate_mode(payload.get("translation_mode"))

            chapter = self.service.storage.find_chapter(chapter_id)
            if not chapter:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
            book = self.service.storage.find_book(chapter["book_id"])
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            if not self.service.translation_allowed_for_book(book):
                raw_text = self.service.storage.get_chapter_text(
                    chapter,
                    book,
                    mode="raw",
                    translator=self.service.translator,
                    translate_mode=translate_mode,
                )
                return {
                    "ok": True,
                    "chapter_id": chapter_id,
                    "mode": "raw",
                    "skipped": True,
                    "reason": "TRANSLATION_NOT_SUPPORTED",
                    "content": raw_text,
                }

            _, active_name_set, _ = self.service.storage.get_active_name_set(
                default_sets=self.service._default_name_sets(),
                active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                book_id=chapter["book_id"],
            )
            active_vp_set, _ = self.service.storage.get_book_vp_set(chapter["book_id"])
            text = self.service.storage.get_chapter_text(
                chapter,
                book,
                mode="trans",
                translator=self.service.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            return {
                "ok": True,
                "chapter_id": chapter_id,
                "mode": "trans",
                "content": text,
            }

        if method == "GET" and path == "/api/search":
            query_text = query.get("q", [""])[0]
            result = self.service.search(query_text)
            return result

        raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy endpoint.")

    def _read_json_body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or "0")
        raw = self.rfile.read(length) if length > 0 else b"{}"
        if not raw:
            return {}
        try:
            payload = json.loads(raw.decode("utf-8"))
            if isinstance(payload, dict):
                return payload
            raise ValueError("JSON body phải là object")
        except Exception as exc:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_JSON", "JSON không hợp lệ.", str(exc)) from exc

    def _extract_disposition_param(self, header_value: str, key: str) -> str | None:
        pattern = rf'(?:^|;)\s*{re.escape(key)}\*?=(?:"([^"]*)"|([^;]*))'
        m = re.search(pattern, header_value, flags=re.IGNORECASE)
        if not m:
            return None
        value = (m.group(1) if m.group(1) is not None else m.group(2) or "").strip()
        if key.endswith("*") or f"{key}*" in header_value:
            # RFC 5987 basic support: utf-8''...
            if "''" in value:
                value = value.split("''", 1)[1]
            value = unquote(value)
        return value

    def _read_multipart_form(self) -> MultipartForm:
        content_type = self.headers.get("Content-Type") or ""
        if not content_type.startswith("multipart/form-data"):
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Yêu cầu phải là multipart/form-data.")

        boundary_match = re.search(r'boundary=(?:"([^"]+)"|([^;]+))', content_type, flags=re.IGNORECASE)
        if not boundary_match:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu boundary trong multipart/form-data.")
        boundary = (boundary_match.group(1) or boundary_match.group(2) or "").strip()
        if not boundary:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Boundary multipart không hợp lệ.")

        content_length = int(self.headers.get("Content-Length", "0") or "0")
        if content_length <= 0:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Nội dung upload rỗng.")

        body = self.rfile.read(content_length)
        marker = f"--{boundary}".encode("utf-8", errors="ignore")
        segments = body.split(marker)
        form = MultipartForm()

        for seg in segments:
            if not seg:
                continue
            if seg.startswith(b"--"):
                # đoạn kết thúc '--'
                continue
            if seg.startswith(b"\r\n"):
                seg = seg[2:]
            if seg.endswith(b"\r\n"):
                seg = seg[:-2]
            if not seg:
                continue

            header_blob, sep, content = seg.partition(b"\r\n\r\n")
            if not sep:
                continue

            header_lines = decode_text_with_fallback(header_blob).split("\r\n")
            headers_map: dict[str, str] = {}
            for line in header_lines:
                if ":" not in line:
                    continue
                k, v = line.split(":", 1)
                headers_map[k.strip().lower()] = v.strip()

            disposition = headers_map.get("content-disposition", "")
            if not disposition:
                continue
            name = self._extract_disposition_param(disposition, "name")
            if not name:
                continue
            filename = self._extract_disposition_param(disposition, "filename")
            if filename == "":
                filename = None

            form.add(MultipartPart(name=name, filename=filename, content=content))

        return form

    def _serve_media(self, parsed_or_path):
        parsed = parsed_or_path if hasattr(parsed_or_path, "path") else urlparse(str(parsed_or_path or ""))
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/media/vbook-image":
            image_url = (query.get("url", [""])[0] or "").strip()
            plugin_id = (query.get("plugin_id", [""])[0] or "").strip()
            referer = (query.get("referer", [""])[0] or "").strip()
            if not image_url:
                self._send_error_json(ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu URL ảnh vBook."))
                return
            try:
                data, ctype = self.service.fetch_vbook_image(
                    image_url=image_url,
                    plugin_id=plugin_id,
                    referer=referer,
                )
            except ApiError as exc:
                self._send_error_json(exc)
                return
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", ctype or "application/octet-stream")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "public, max-age=600")
            try:
                self.end_headers()
                self.wfile.write(data)
            except OSError as exc:
                if self._is_client_disconnect_error(exc):
                    return
                raise
            return

        if path == "/media/vbook-plugin-icon":
            plugin_id = (query.get("plugin_id", [""])[0] or "").strip()
            if not plugin_id:
                self._send_error_json(ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id."))
                return
            try:
                data, ctype = self.service.get_vbook_plugin_icon(plugin_id)
            except ApiError as exc:
                self._send_error_json(exc)
                return
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", ctype or "application/octet-stream")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "public, max-age=86400")
            try:
                self.end_headers()
                self.wfile.write(data)
            except OSError as exc:
                if self._is_client_disconnect_error(exc):
                    return
                raise
            return

        if path.startswith("/media/export/"):
            filename = unquote(path.removeprefix("/media/export/").strip())
            file_path = EXPORT_DIR / filename
        elif path.startswith("/media/cover/"):
            filename = unquote(path.removeprefix("/media/cover/").strip())
            file_path = COVER_DIR / filename
        elif path.startswith("/media/epub/"):
            filename = unquote(path.removeprefix("/media/epub/").strip())
            file_path = CACHE_DIR / "epub_sources" / filename
        else:
            self._send_error_json(ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy tài nguyên media."))
            return

        if not file_path.exists() or not file_path.is_file():
            self._send_error_json(ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy file."))
            return

        ctype = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        data = file_path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        try:
            self.end_headers()
            self.wfile.write(data)
        except OSError as exc:
            if self._is_client_disconnect_error(exc):
                return
            raise

    def _is_client_disconnect_error(self, exc: BaseException) -> bool:
        if isinstance(exc, (BrokenPipeError, ConnectionResetError, ConnectionAbortedError)):
            return True
        if not isinstance(exc, OSError):
            return False
        if getattr(exc, "errno", None) in {32, 104}:
            return True
        if getattr(exc, "winerror", None) in {10053, 10054, 10058}:
            return True
        return False

    def _send_json(self, payload: dict[str, Any], trace_id: str | None = None):
        result = dict(payload)
        if trace_id:
            result["trace_id"] = trace_id
        body = json.dumps(result, ensure_ascii=False).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        try:
            self.end_headers()
            self.wfile.write(body)
        except OSError as exc:
            if self._is_client_disconnect_error(exc):
                return
            raise

    def _send_error_json(self, error: ApiError, trace_id: str | None = None):
        payload = {
            "error_code": error.error_code,
            "message": error.message,
            "details": error.details,
            "trace_id": trace_id or uuid.uuid4().hex,
        }
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(error.status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        try:
            self.end_headers()
            self.wfile.write(body)
        except OSError as exc:
            if self._is_client_disconnect_error(exc):
                return
            raise


def build_handler(ui_dir: Path, service: ReaderService):
    def _factory(*args, **kwargs):
        return ReaderApiHandler(*args, ui_dir=ui_dir, service=service, **kwargs)

    return _factory


def parse_args():
    parser = argparse.ArgumentParser(description="Run local reader web server.")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host (use 0.0.0.0 for LAN access).")
    parser.add_argument("--port", type=int, default=17171, help="Bind port.")
    parser.add_argument("--ui-dir", default=str(DEFAULT_UI_DIR), help="Reader UI directory.")
    parser.add_argument("--db", default=str(DB_PATH), help="SQLite database path.")
    return parser.parse_args()


def configure_console_output() -> None:
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if stream is None:
            continue
        try:
            stream.reconfigure(errors="backslashreplace")
        except Exception:
            continue


def safe_console_print(text: str) -> None:
    message = str(text or "")
    try:
        print(message)
        return
    except Exception:
        pass

    stream = getattr(sys, "stdout", None)
    if stream is None:
        return
    encoding = getattr(stream, "encoding", None) or "utf-8"
    payload = message.encode(encoding, errors="backslashreplace")
    try:
        buffer = getattr(stream, "buffer", None)
        if buffer is not None:
            buffer.write(payload + b"\n")
        else:
            stream.write(payload.decode(encoding, errors="ignore") + "\n")
        stream.flush()
    except Exception:
        pass


def main():
    configure_console_output()
    args = parse_args()
    ui_dir = Path(args.ui_dir).resolve()
    if not ui_dir.exists():
        raise SystemExit(f"UI directory not found: {ui_dir}")

    db_path = Path(args.db).resolve()
    # Đặt local/cache/export/cover cạnh DB để ND5 + Reader dùng chung 1 bộ dữ liệu.
    set_local_dirs(db_path.parent)
    storage = ReaderStorage(db_path)
    service = ReaderService(storage)

    handler = build_handler(ui_dir=ui_dir, service=service)
    server = ThreadingHTTPServer((args.host, args.port), handler)
    safe_console_print(f"Reader server running at: http://{args.host}:{args.port}")
    safe_console_print(f"UI dir: {ui_dir}")
    safe_console_print(f"DB: {Path(args.db).resolve()}")
    safe_console_print(f"Reader config file: {resolve_app_config_path()}")
    env_cfg = (os.environ.get("READER_APP_CONFIG") or "").strip()
    if env_cfg:
        safe_console_print(f"READER_APP_CONFIG: {env_cfg}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
