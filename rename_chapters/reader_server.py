#!/usr/bin/env python3
"""Mini local server for Reader V1 (SQLite + cache + themed web UI)."""

from __future__ import annotations

import argparse
import hashlib
import html
import importlib.util
import io
import json
import mimetypes
import os
import re
import sqlite3
import traceback
import uuid
import zipfile
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, quote, unquote, urlparse
import xml.etree.ElementTree as ET


ROOT_DIR = Path(__file__).resolve().parent
LOCAL_DIR = ROOT_DIR / "local"
CACHE_DIR = LOCAL_DIR / "reader_cache"
EXPORT_DIR = LOCAL_DIR / "reader_exports"
COVER_DIR = LOCAL_DIR / "reader_covers"
DB_PATH = LOCAL_DIR / "reader_library.db"
DEFAULT_UI_DIR = ROOT_DIR / "reader_ui"
APP_CONFIG_PATH = ROOT_DIR / "config.json"
APP_STATE_THEME_ACTIVE_KEY = "theme.active"
APP_STATE_NAME_SET_STATE_KEY = "reader.name_set_state"
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


def set_local_dirs(local_dir: Path) -> None:
    """Override local/cache/export/cover dirs theo vị trí DB để ND5 + Reader dùng chung."""
    global LOCAL_DIR, CACHE_DIR, EXPORT_DIR, COVER_DIR, DB_PATH
    LOCAL_DIR = local_dir
    CACHE_DIR = LOCAL_DIR / "reader_cache"
    EXPORT_DIR = LOCAL_DIR / "reader_exports"
    COVER_DIR = LOCAL_DIR / "reader_covers"
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


def hash_text(value: str) -> str:
    return hashlib.sha1(value.encode("utf-8", errors="ignore")).hexdigest()


def quote_url_path(value: str) -> str:
    return quote(value or "", safe="")


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
    return source_type in {"comic", "vbook_comic"}


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


def load_app_config() -> dict[str, Any]:
    # Ưu tiên config theo env/cwd để chạy tốt khi server nằm trong `tools/` (frozen exe).
    candidates: list[Path] = []
    env_path = (os.environ.get("READER_APP_CONFIG") or "").strip()
    if env_path:
        candidates.append(Path(env_path))
    base = runtime_base_dir()
    candidates.append(base / "config.json")
    candidates.append(APP_CONFIG_PATH)
    for p in candidates:
        try:
            if p.exists():
                return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
    return {}


def resolve_app_config_path() -> Path:
    env_path = (os.environ.get("READER_APP_CONFIG") or "").strip()
    if env_path:
        return Path(env_path)
    base = runtime_base_dir()
    base_cfg = base / "config.json"
    if base_cfg.exists() or base == ROOT_DIR:
        return base_cfg
    if APP_CONFIG_PATH.exists():
        return APP_CONFIG_PATH
    return base_cfg


def save_app_config(config: dict[str, Any]) -> Path:
    target = resolve_app_config_path()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        json.dumps(config or {}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
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

    def translation_signature(self, mode: str = "server", name_set_override: dict[str, str] | None = None) -> str:
        payload = {
            "mode": (mode or "server").strip().lower(),
            "active_set": str(self.active_set_name or "Mặc định"),
            "version": int(self.name_set_version or 1),
            "text_norm_version": 7,
            "name_set": self._name_set_for_use(name_set_override),
        }
        raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        return hashlib.sha1(raw.encode("utf-8", errors="ignore")).hexdigest()

    def translate_detailed(
        self,
        text: str,
        mode: str = "server",
        name_set_override: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        source = (text or "").strip()
        if not source:
            return {
                "source_text": "",
                "processed_text": "",
                "translated_with_placeholders": "",
                "translated": "",
                "mode": "server" if mode != "local" else "local",
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

        mode_norm = (mode or "server").strip().lower()
        if mode_norm not in {"server", "local"}:
            mode_norm = "server"

        settings = self._settings()
        name_set = self._name_set_for_use(name_set_override)
        processed_text, placeholder_map, hits = apply_name_placeholders(source, name_set)
        source_unit_infos = build_text_units_with_offsets(source)
        translated_with_placeholders = ""
        hanviet_source = ""
        resolved_core: dict[str, str] = {}
        units = split_text_for_translation_cache(processed_text)
        if not units:
            units = [("text", processed_text)]

        if mode_norm == "local":
            hv_map = translator_logic.load_hanviet_json(settings.get("hanvietJsonUrl", ""))
            hanviet_source = translator_logic.build_hanviet_from_map(source, hv_map) or source
            for kind, unit in units:
                if kind != "text":
                    continue
                _, core, _ = split_space_edges(unit)
                key = normalize_translation_cache_source(core)
                if not key or key in resolved_core:
                    continue
                resolved_core[key] = local_translate_preserve_placeholders(key, hv_map, placeholder_map)
        else:
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

    def list_books(self) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                """
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
                       fc.title_vi AS first_title_vi
                FROM books b
                LEFT JOIN chapters lr ON lr.chapter_id = b.last_read_chapter_id
                LEFT JOIN chapters fc ON fc.chapter_id = (
                    SELECT c.chapter_id FROM chapters c
                    WHERE c.book_id = b.book_id
                    ORDER BY c.chapter_order ASC
                    LIMIT 1
                )
                ORDER BY b.updated_at DESC
                """
            ).fetchall()
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

    def _book_cover_url(self, book: dict[str, Any] | None) -> str:
        if not book:
            return ""
        cover = (book.get("cover_path") or "").strip()
        if not cover:
            return ""
        if cover.startswith("http://") or cover.startswith("https://") or cover.startswith("data:"):
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
                        translator.translate_detailed(raw_title, mode=translate_mode, name_set_override=name_set_override).get("translated", "")
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
                        translator.translate_detailed(raw_author, mode=translate_mode, name_set_override=name_set_override).get("translated", "")
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
                        translator.translate_detailed(raw_title, mode=translate_mode, name_set_override=name_set_override).get("translated", "")
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
    ) -> dict[str, Any]:
        page = max(1, int(page))
        page_size = max(1, min(200, int(page_size)))
        if mode == "trans":
            self.translate_book_titles(book_id, translator, translate_mode, name_set_override=name_set_override)

        with self._connect() as conn:
            total = conn.execute("SELECT COUNT(1) AS c FROM chapters WHERE book_id = ?", (book_id,)).fetchone()["c"]
            offset = (page - 1) * page_size
            rows = conn.execute(
                """
                SELECT chapter_id, chapter_order, title_raw, title_vi, updated_at, word_count, trans_key
                FROM chapters
                WHERE book_id = ?
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
            }
            for ch in chapters
        ]
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

    def _delete_cache_keys(self, keys: set[str]) -> int:
        deleted = 0
        if not keys:
            return deleted
        with self._connect() as conn:
            rows = conn.execute(
                f"SELECT cache_key, text_path FROM content_cache WHERE cache_key IN ({','.join('?' for _ in keys)})",
                tuple(keys),
            ).fetchall()
            conn.execute(
                f"DELETE FROM content_cache WHERE cache_key IN ({','.join('?' for _ in keys)})",
                tuple(keys),
            )
        for row in rows:
            p = Path(row["text_path"])
            if p.exists():
                try:
                    p.unlink()
                    deleted += 1
                except Exception:
                    pass
        return deleted

    def clear_translated_cache(self) -> dict[str, Any]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT cache_key, text_path FROM content_cache WHERE cache_key LIKE 'tr_%'"
            ).fetchall()
            conn.execute("DELETE FROM content_cache WHERE cache_key LIKE 'tr_%'")
            tm_count = conn.execute("SELECT COUNT(1) AS c FROM translation_memory").fetchone()["c"]
            conn.execute("DELETE FROM translation_memory")
            tum_count = conn.execute("SELECT COUNT(1) AS c FROM translation_unit_map").fetchone()["c"]
            conn.execute("DELETE FROM translation_unit_map")
            conn.execute("UPDATE chapters SET trans_key = NULL, trans_sig = NULL, updated_at = ?", (utc_now_iso(),))

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
            "deleted_files": deleted_files,
            "bytes_deleted": bytes_deleted,
            "tm_deleted": int(tm_count or 0),
            "unit_map_deleted": int(tum_count or 0),
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
                WHERE lower(title) LIKE ? OR lower(COALESCE(title_vi,'')) LIKE ?
                   OR lower(author) LIKE ? OR lower(COALESCE(author_vi,'')) LIKE ?
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
                WHERE lower(c.title_raw) LIKE ? OR lower(COALESCE(c.title_vi, '')) LIKE ?
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

    def create_export_txt(self, book_id: str, ensure_translated: bool, translator: TranslationAdapter, translate_mode: str) -> Path:
        book = self.find_book(book_id)
        if not book:
            raise ValueError("Không tìm thấy truyện.")
        chapters = self.get_chapter_rows(book_id)
        if not chapters:
            raise ValueError("Truyện chưa có chương.")
        _, active_name_set, _ = self.get_active_name_set(default_sets={"Mặc định": {}}, active_default="Mặc định", book_id=book_id)

        output_lines: list[str] = []
        for ch in chapters:
            title = ch["title_vi"] or ch["title_raw"] or f"Chương {ch['chapter_order']}"
            text = self.get_chapter_text(
                ch,
                book,
                mode="trans" if ensure_translated else "raw",
                translator=translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
            )
            output_lines.extend([title, "", text, ""])

        safe_name = self._safe_filename(book["title"])
        ts = utc_now_ts()
        out = EXPORT_DIR / f"{safe_name}_{ts}.txt"
        out.write_text("\n".join(output_lines), encoding="utf-8")
        return out

    def create_export_epub(self, book_id: str, ensure_translated: bool, translator: TranslationAdapter, translate_mode: str) -> Path:
        book = self.find_book(book_id)
        if not book:
            raise ValueError("Không tìm thấy truyện.")
        chapters = self.get_chapter_rows(book_id)
        if not chapters:
            raise ValueError("Truyện chưa có chương.")
        _, active_name_set, _ = self.get_active_name_set(default_sets={"Mặc định": {}}, active_default="Mặc định", book_id=book_id)

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
            title = ch["title_vi"] or ch["title_raw"] or f"Chương {idx}"
            text = self.get_chapter_text(
                ch,
                book,
                mode="trans" if ensure_translated else "raw",
                translator=translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
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
    ) -> str:
        raw_key = chapter.get("raw_key")
        cached_raw = self.read_cache(raw_key) or ""
        if (not cached_raw) and str(book.get("source_type") or "").startswith("vbook") and chapter.get("remote_url") and self.remote_chapter_fetcher:
            cached_raw = self.remote_chapter_fetcher(chapter, book) or ""
        comic_payload = decode_comic_payload(cached_raw or "")
        if comic_payload is not None:
            return cached_raw or encode_comic_payload([])

        raw_text = normalize_newlines(cached_raw or "")
        if mode == "raw" or (not book_supports_translation(book)):
            return raw_text

        current_sig = translator.translation_signature(mode=translate_mode, name_set_override=name_set_override)
        trans_key = chapter.get("trans_key")
        trans_sig = (chapter.get("trans_sig") or "").strip()
        if trans_key and trans_sig == current_sig:
            cached = self.read_cache(trans_key)
            if cached is not None:
                map_count = self.get_translation_unit_map_count(chapter["chapter_id"], current_sig, translate_mode)
                if map_count > 0:
                    return normalize_newlines(cached)

        detail = translator.translate_detailed(raw_text, mode=translate_mode, name_set_override=name_set_override)
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
        self.name_set_state: dict[str, Any] = {"sets": {"Mặc định": {}}, "active_set": "Mặc định", "version": 1}
        # Allow storage to lazy-load remote chapter content (vBook, ...).
        self.storage.remote_chapter_fetcher = self._fetch_remote_chapter
        self.refresh_config()

    def _default_name_sets(self) -> dict[str, dict[str, str]]:
        return normalize_name_sets_collection(self.app_config.get("nameSets") or {})

    def _default_active_name_set(self, default_sets: dict[str, dict[str, str]]) -> str:
        active = str(self.app_config.get("activeNameSet") or "").strip()
        if active in default_sets:
            return active
        return next(iter(default_sets.keys()))

    def refresh_config(self) -> None:
        self.app_config = load_app_config()
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
        vcfg = self.app_config.get("vbook") or {}
        try:
            extensions_dir = str(vcfg.get("extensions_dir") or "local/vbook_extensions").strip() or "local/vbook_extensions"
        except Exception:
            extensions_dir = "local/vbook_extensions"
        self.vbook_manager = vbook_ext.VBookExtensionManager(resolve_path_from_base(extensions_dir, base_dir))

        try:
            jar_rel = str(vcfg.get("runner_jar") or "tools/vbook_runner/vbook_runner.jar").strip() or "tools/vbook_runner/vbook_runner.jar"
        except Exception:
            jar_rel = "tools/vbook_runner/vbook_runner.jar"
        jar_path = resolve_path_from_base(jar_rel, base_dir)
        if jar_path.exists():
            runner_cfg = {
                "default_user_agent": str(vcfg.get("default_user_agent") or ""),
                "default_cookie": str(vcfg.get("default_cookie") or ""),
                "timeout_ms": int(vcfg.get("timeout_ms") or 20000),
            }
            java_bin_raw = str(vcfg.get("java_bin") or "").strip()
            java_bin = None
            if java_bin_raw:
                try:
                    resolved_java = resolve_path_from_base(java_bin_raw, base_dir)
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

    def import_vbook_url(self, url: str, *, plugin_id: str | None = None) -> dict[str, Any]:
        source_url = (url or "").strip()
        if not source_url:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu URL để import.")

        plugin = self._resolve_vbook_plugin(source_url, plugin_id=plugin_id)
        detail = self._run_vbook_script(plugin, "detail", [source_url])
        toc_rows = self._fetch_vbook_toc(plugin, source_url)

        title = str((detail or {}).get("name") or (detail or {}).get("title") or "").strip() or source_url
        author = str((detail or {}).get("author") or "").strip()
        cover_path = str((detail or {}).get("cover") or "").strip()
        plugin_type = str(plugin.type or "").strip().lower()
        source_type = "vbook_comic" if "comic" in plugin_type else "vbook"
        summary = str((detail or {}).get("description") or "").strip() or (
            "Truyện tranh được import từ URL (vBook extension)." if source_type == "vbook_comic" else "Truyện được import từ URL (vBook extension)."
        )
        extra_link = source_url

        locale_norm = normalize_lang_source(str(plugin.locale or ""))
        if locale_norm:
            lang_source = locale_norm
        else:
            lang_source = "zh"

        chapters: list[dict[str, str]] = []
        for idx, row in enumerate(toc_rows, start=1):
            ch_title = str(row.get("name") or f"Chương {idx}").strip() or f"Chương {idx}"
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
        return created

    def _vbook_cfg(self) -> dict[str, Any]:
        raw = self.app_config.get("vbook") or {}
        return raw if isinstance(raw, dict) else {}

    def _serialize_vbook_plugin(self, p: Any) -> dict[str, Any]:
        return {
            "plugin_id": p.plugin_id,
            "name": p.name,
            "author": p.author,
            "version": p.version,
            "locale": p.locale,
            "type": p.type,
            "source": p.source,
            "regexp": p.regexp,
            "encrypt": bool(p.encrypt),
            "scripts": sorted(list((p.scripts or {}).keys())),
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

    def remove_vbook_plugin(self, plugin_id: str) -> bool:
        if not self.vbook_manager:
            raise ApiError(HTTPStatus.SERVICE_UNAVAILABLE, "VBOOK_DISABLED", "vBook chưa được bật trong server.")
        pid = str(plugin_id or "").strip()
        if not pid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id.")
        return bool(self.vbook_manager.remove_plugin(pid))

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

    def _run_vbook_script_result(self, plugin: Any, script_key: str, args: list[Any]) -> dict[str, Any]:
        if not self.vbook_runner:
            raise ApiError(
                HTTPStatus.SERVICE_UNAVAILABLE,
                "VBOOK_RUNNER_MISSING",
                "Chưa có vBook runner. Hãy build `tools/vbook_runner` trước.",
            )

        payload = self.vbook_runner.run(
            plugin_path=str(plugin.path),
            script_key=script_key,
            args=args,
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
                raise ApiError(
                    HTTPStatus.BAD_GATEWAY,
                    "VBOOK_SCRIPT_ERROR",
                    "Plugin vBook trả lỗi khi chạy script.",
                    {"plugin": plugin.plugin_id, "script": script_key, "result": result},
                )
            return result
        # Some plugins might return raw value (non Response.success)
        return {"code": 0, "data": result}

    def _run_vbook_script(self, plugin: Any, script_key: str, args: list[Any]) -> Any:
        result = self._run_vbook_script_result(plugin, script_key, args)
        return result.get("data")

    def _run_vbook_script_with_next(self, plugin: Any, script_key: str, args: list[Any]) -> tuple[Any, Any]:
        result = self._run_vbook_script_result(plugin, script_key, args)
        return result.get("data"), result.get("next")

    def _normalize_vbook_search_item(self, plugin: Any, item: dict[str, Any], *, query: str) -> dict[str, Any] | None:
        if not isinstance(item, dict):
            return None
        title = str(
            item.get("name")
            or item.get("title")
            or item.get("book_name")
            or item.get("bookTitle")
            or ""
        ).strip()
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
        description = str(item.get("description") or item.get("desc") or item.get("summary") or "").strip()
        author = str(item.get("author") or item.get("writer") or "").strip()
        is_comic = "comic" in str(getattr(plugin, "type", "") or "").lower()
        locale_norm = normalize_lang_source(str(getattr(plugin, "locale", "") or ""))
        source_tag = "vbook_comic" if is_comic else "vbook"
        return {
            "title": title,
            "author": author,
            "description": description,
            "cover": cover,
            "detail_url": detail_url,
            "query": query,
            "host": host,
            "plugin_id": str(getattr(plugin, "plugin_id", "") or ""),
            "plugin_name": str(getattr(plugin, "name", "") or ""),
            "plugin_type": str(getattr(plugin, "type", "") or ""),
            "locale": str(getattr(plugin, "locale", "") or ""),
            "source_type": source_tag,
            "is_comic": is_comic,
            "lang_source": locale_norm or "zh",
        }

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
        data: Any = []
        next_value: Any = None
        for args in candidates:
            sig = json.dumps(args, ensure_ascii=False, sort_keys=True, default=str)
            if sig in seen:
                continue
            seen.add(sig)
            try:
                data, next_value = self._run_vbook_script_with_next(plugin, "search", args)
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
                "VBOOK_SEARCH_FAILED",
                "Không thể tìm kiếm bằng plugin vBook này.",
                {"plugin_id": plugin_id, "error": str(last_error)},
            ) from last_error

        rows = data if isinstance(data, list) else (
            data.get("items")
            if isinstance(data, dict) and isinstance(data.get("items"), list)
            else data.get("data")
            if isinstance(data, dict) and isinstance(data.get("data"), list)
            else data.get("list")
            if isinstance(data, dict) and isinstance(data.get("list"), list)
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
            "next": next_value,
            "has_next": next_value is not None and str(next_value).strip() != "",
            "count": len(items),
        }

    def get_vbook_detail(self, *, url: str, plugin_id: str = "") -> dict[str, Any]:
        source_url = str(url or "").strip()
        if not source_url:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu URL truyện.")
        plugin = self._resolve_vbook_plugin(source_url, plugin_id=plugin_id or None)
        self._ensure_plugin_has_script(plugin, "detail")
        data = self._run_vbook_script(plugin, "detail", [source_url])
        detail = data if isinstance(data, dict) else {}
        title = str(detail.get("name") or detail.get("title") or "").strip() or source_url
        author = str(detail.get("author") or "").strip()
        cover = str(detail.get("cover") or detail.get("image") or "").strip()
        description = str(detail.get("description") or detail.get("desc") or "").strip()
        host = str(detail.get("host") or "").strip()
        if cover and host and not cover.startswith("http"):
            cover = self._join_vbook_url(host, cover)
        is_comic = "comic" in str(getattr(plugin, "type", "") or "").lower()
        return {
            "ok": True,
            "plugin": self._serialize_vbook_plugin(plugin),
            "detail": {
                "title": title,
                "author": author,
                "cover": cover,
                "description": description,
                "url": source_url,
                "host": host,
                "is_comic": is_comic,
                "source_type": "vbook_comic" if is_comic else "vbook",
            },
        }

    def get_vbook_toc(
        self,
        *,
        url: str,
        plugin_id: str = "",
        page: int = 1,
        page_size: int = 120,
    ) -> dict[str, Any]:
        source_url = str(url or "").strip()
        if not source_url:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu URL truyện.")
        plugin = self._resolve_vbook_plugin(source_url, plugin_id=plugin_id or None)
        self._ensure_plugin_has_script(plugin, "toc")
        all_rows = self._fetch_vbook_toc(plugin, source_url)
        p = max(1, int(page or 1))
        ps = max(1, min(500, int(page_size or 120)))
        total = len(all_rows)
        total_pages = max(1, (total + ps - 1) // ps)
        if p > total_pages:
            p = total_pages
        offset = (p - 1) * ps
        chunk = all_rows[offset : offset + ps]
        items: list[dict[str, Any]] = []
        for idx, row in enumerate(chunk, start=offset + 1):
            items.append(
                {
                    "index": idx,
                    "title": str(row.get("name") or "").strip() or f"Chương {idx}",
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
            name = str(item.get("name") or "").strip()
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
            self._serve_media(parsed.path)
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
            if translate_mode not in {"local", "server"}:
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

            return {
                "ok": True,
                "source_text": source_cjk,
                "han_viet_raw": hv_text,
                "items": items,
            }

        if method == "GET" and path == "/api/library/books":
            books = self.service.storage.list_books()
            return {"items": books}

        if method == "GET" and path == "/api/vbook/plugins":
            items = self.service.list_vbook_plugins()
            return {"ok": True, "items": items}

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
            return self.service.get_vbook_toc(
                url=source_url,
                plugin_id=plugin_id,
                page=page,
                page_size=page_size,
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
            book = self.service.import_vbook_url(url, plugin_id=plugin_id)
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
            if mode == "trans" and not book_supports_translation(book_found):
                mode = "raw"
            translate_mode = (query.get("translation_mode", ["server"])[0] or "server").strip().lower()
            if translate_mode not in ("server", "local"):
                translate_mode = "server"
            _, active_name_set, _ = self.service.storage.get_active_name_set(
                default_sets=self.service._default_name_sets(),
                active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                book_id=book_id,
            )
            data = self.service.storage.list_chapters_paged(
                book_id,
                page=page,
                page_size=page_size,
                mode=mode,
                translator=self.service.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
            )
            data["book_id"] = book_id
            data["mode"] = mode
            return data

        if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/translate-titles"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/translate-titles").strip("/")
            book_found = self.service.storage.find_book(book_id)
            if not book_found:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            if not book_supports_translation(book_found):
                return {"ok": True, "skipped": True, "reason": "TRANSLATION_NOT_SUPPORTED"}
            payload = self._read_json_body()
            translate_mode = (payload.get("translation_mode") or "server").strip().lower()
            if translate_mode not in ("server", "local"):
                translate_mode = "server"
            _, active_name_set, _ = self.service.storage.get_active_name_set(
                default_sets=self.service._default_name_sets(),
                active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                book_id=book_id,
            )
            self.service.storage.translate_book_titles(
                book_id,
                self.service.translator,
                translate_mode,
                name_set_override=active_name_set,
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
            translate_mode = (query.get("translation_mode", ["server"])[0] or "server").strip().lower()
            if translate_mode not in ("server", "local"):
                translate_mode = "server"
            _, active_name_set, _ = self.service.storage.get_active_name_set(
                default_sets=self.service._default_name_sets(),
                active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                book_id=book_id,
            )
            book_preview = self.service.storage.find_book(book_id)
            if (translate_titles or mode == "trans") and book_supports_translation(book_preview):
                self.service.storage.translate_book_titles(
                    book_id,
                    self.service.translator,
                    translate_mode,
                    name_set_override=active_name_set,
                )
            book = self.service.storage.get_book_detail(book_id)
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
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

            if fmt == "txt":
                output = self.service.storage.create_export_txt(
                    book_id,
                    ensure_translated,
                    translator=self.service.translator,
                    translate_mode=translate_mode,
                )
            elif fmt == "epub":
                output = self.service.storage.create_export_epub(
                    book_id,
                    ensure_translated,
                    translator=self.service.translator,
                    translate_mode=translate_mode,
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
            book_id = path.removeprefix("/api/library/book/").strip()
            if not book_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
            deleted = self.service.storage.delete_book(book_id)
            if not deleted:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện cần xóa.")
            return {"ok": True}

        if method == "POST" and path == "/api/library/cache/clear":
            result = self.service.storage.clear_translated_cache()
            return {"ok": True, **result}

        if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/reload"):
            chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/reload").strip("/")
            if not chapter_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu chapter_id.")
            chapter = self.service.storage.find_chapter(chapter_id)
            if not chapter:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
            result = self.service.storage.clear_chapter_translated_cache(chapter_id)
            return {"ok": True, "chapter_id": chapter_id, **result}

        if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/name-preview"):
            chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/name-preview").strip("/")
            chapter = self.service.storage.find_chapter(chapter_id)
            if not chapter:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
            book = self.service.storage.find_book(chapter["book_id"])
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            trans_supported = bool(book_supports_translation(book))
            if not trans_supported:
                raise ApiError(
                    HTTPStatus.BAD_REQUEST,
                    "TRANSLATION_NOT_SUPPORTED",
                    "Nguồn truyện này không hỗ trợ dịch/name map.",
                )

            payload = self._read_json_body()
            translate_mode = (payload.get("translation_mode") or "local").strip().lower()
            if translate_mode not in {"local", "server"}:
                translate_mode = "local"
            override_name_set = payload.get("name_set")
            if override_name_set is not None and not isinstance(override_name_set, dict):
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "name_set phải là object.")
            if override_name_set is None:
                _, override_name_set, _ = self.service.storage.get_active_name_set(
                    default_sets=self.service._default_name_sets(),
                    active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                    book_id=chapter["book_id"],
                )

            raw_text = self.service.storage.get_chapter_text(
                chapter,
                book,
                mode="raw",
                translator=self.service.translator,
                translate_mode=translate_mode,
                name_set_override=override_name_set if isinstance(override_name_set, dict) else None,
            )
            detail = self.service.translator.translate_detailed(
                raw_text,
                mode=translate_mode,
                name_set_override=override_name_set if isinstance(override_name_set, dict) else None,
            )
            detail.pop("unit_map", None)

            title_detail = self.service.translator.translate_detailed(
                chapter.get("title_raw") or "",
                mode=translate_mode,
                name_set_override=override_name_set if isinstance(override_name_set, dict) else None,
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
            if not book_supports_translation(book):
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
            translate_mode = (payload.get("translation_mode") or "server").strip().lower()
            if translate_mode not in {"local", "server"}:
                translate_mode = "server"
            _, active_name_set, version = self.service.storage.get_active_name_set(
                default_sets=self.service._default_name_sets(),
                active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                book_id=chapter["book_id"],
            )

            raw_text = self.service.storage.get_chapter_text(
                chapter,
                book,
                mode="raw",
                translator=self.service.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
            )
            translated_text = self.service.storage.get_chapter_text(
                chapter,
                book,
                mode="trans",
                translator=self.service.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
            )
            current_sig = self.service.translator.translation_signature(mode=translate_mode, name_set_override=active_name_set)
            unit_map = self.service.storage.get_translation_unit_map(chapter["chapter_id"], current_sig, translate_mode)
            if not unit_map:
                detail = self.service.translator.translate_detailed(
                    raw_text,
                    mode=translate_mode,
                    name_set_override=active_name_set,
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
            trans_supported = bool(book_supports_translation(book))

            mode = (query.get("mode", ["raw"])[0] or "raw").strip().lower()
            translate_mode = (query.get("translation_mode", ["server"])[0] or "server").strip().lower()
            if mode not in ("raw", "trans"):
                mode = "raw"
            if translate_mode not in ("server", "local"):
                translate_mode = "server"
            if mode == "trans" and trans_supported:
                _, active_name_set, _ = self.service.storage.get_active_name_set(
                    default_sets=self.service._default_name_sets(),
                    active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                    book_id=chapter["book_id"],
                )
                self.service.storage.translate_book_titles(
                    chapter["book_id"],
                    self.service.translator,
                    translate_mode,
                    name_set_override=active_name_set,
                )
                chapter = self.service.storage.find_chapter(chapter_id) or chapter

            _, active_name_set, _ = self.service.storage.get_active_name_set(
                default_sets=self.service._default_name_sets(),
                active_default=self.service._default_active_name_set(self.service._default_name_sets()),
                book_id=chapter["book_id"],
            )
            text = self.service.storage.get_chapter_text(
                chapter,
                book,
                mode=mode,
                translator=self.service.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
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
                )
                name_preview = self.service.translator.translate_detailed(
                    raw_text,
                    mode=translate_mode,
                    name_set_override=active_name_set,
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
                response_content = ""
            output_mode = mode if trans_supported else "raw"

            response = {
                "chapter_id": chapter["chapter_id"],
                "book_id": chapter["book_id"],
                "chapter_order": chapter["chapter_order"],
                "title_raw": chapter["title_raw"],
                "title_vi": normalize_vi_display_text(chapter.get("title_vi") or ""),
                "title": (
                    normalize_vi_display_text(chapter.get("title_vi") or "")
                    if output_mode == "trans" and chapter.get("title_vi")
                    else chapter["title_raw"]
                ),
                "mode": output_mode,
                "content_type": content_type,
                "images": images,
                "content": response_content,
            }
            if output_mode == "trans":
                cur_sig = self.service.translator.translation_signature(mode=translate_mode, name_set_override=active_name_set)
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
            translate_mode = (payload.get("translation_mode") or "server").strip().lower()
            if translate_mode not in ("server", "local"):
                translate_mode = "server"

            chapter = self.service.storage.find_chapter(chapter_id)
            if not chapter:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
            book = self.service.storage.find_book(chapter["book_id"])
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            if not book_supports_translation(book):
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
            text = self.service.storage.get_chapter_text(
                chapter,
                book,
                mode="trans",
                translator=self.service.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
            )
            return {
                "ok": True,
                "chapter_id": chapter_id,
                "mode": "trans",
                "content": text,
            }

        if method == "GET" and path == "/api/search":
            query_text = query.get("q", [""])[0]
            result = self.service.storage.search(query_text)
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

    def _serve_media(self, path: str):
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
    parser.add_argument("--host", default="127.0.0.1", help="Bind host, dùng 0.0.0.0 để chia sẻ LAN.")
    parser.add_argument("--port", type=int, default=17171, help="Bind port.")
    parser.add_argument("--ui-dir", default=str(DEFAULT_UI_DIR), help="Thư mục chứa UI web.")
    parser.add_argument("--db", default=str(DB_PATH), help="Đường dẫn SQLite DB.")
    return parser.parse_args()


def main():
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
    print(f"Reader server đang chạy tại: http://{args.host}:{args.port}")
    print(f"UI dir: {ui_dir}")
    print(f"DB: {Path(args.db).resolve()}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
