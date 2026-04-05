#!/usr/bin/env python3
"""Mini local server for Reader V1 (SQLite + cache + themed web UI)."""

from __future__ import annotations

import argparse
import base64
import gzip
import hashlib
import html
import importlib.util
import io
import json
import mimetypes
import os
import re
import shutil
import sqlite3
import sys
import threading
import time
import traceback
import uuid
import zlib
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
from reader_backend import download_execute as download_execute_support
from reader_backend import download_jobs as download_jobs_support
from reader_backend import download_batch as download_batch_support
from reader_backend import http_export_download as http_export_download_support
from reader_backend import http_library_reader as http_library_reader_support
from reader_backend import http_media as http_media_support
from reader_backend import http_misc as http_misc_support
from reader_backend import http_routes as http_routes_support
from reader_backend import http_vbook_import as http_vbook_import_support
from reader_backend import service_history as service_history_support
from reader_backend import service_library as service_library_support
from reader_backend import service_user_state as service_user_state_support
from reader_backend import storage_history as storage_history_support
from reader_backend import storage_cache as storage_cache_support
from reader_backend import storage_library as storage_library_support
from reader_backend import storage_user_state as storage_user_state_support
from reader_backend import download_runtime as download_runtime_support
from reader_backend import export_execute as export_execute_support
from reader_backend import export_jobs as export_jobs_support
from reader_backend import export_runtime as export_runtime_support
from reader_backend import export_support
from reader_backend import queue_runtime as queue_runtime_support


ROOT_DIR = Path(__file__).resolve().parent
LOCAL_DIR = ROOT_DIR / "local"
CACHE_DIR = LOCAL_DIR / "reader_cache"
EXPORT_DIR = LOCAL_DIR / "reader_exports"
COVER_DIR = LOCAL_DIR / "reader_covers"
VBOOK_IMAGE_CACHE_DIR = CACHE_DIR / "vbook_image_cache"
IMPORT_PREVIEW_DIR = CACHE_DIR / "import_previews"
DB_PATH = LOCAL_DIR / "reader_library.db"
DEFAULT_UI_DIR = ROOT_DIR / "reader_ui"
APP_CONFIG_PATH = ROOT_DIR / "config.json"
APP_READER_CONFIG_PATH = ROOT_DIR / "local" / "reader.config.json"
APP_STATE_THEME_ACTIVE_KEY = "theme.active"
APP_STATE_NAME_SET_STATE_KEY = "reader.name_set_state"
APP_STATE_BOOK_VP_SET_KEY_PREFIX = "reader.book_vp_set"
APP_STATE_GLOBAL_JUNK_STATE_KEY = "reader.global_junk_state"
APP_STATE_EXPORT_JOBS_STATE_KEY = "reader.export_jobs_state"
COMIC_CACHE_PREFIX = "__READER_COMIC_JSON__:"
HISTORY_BOOK_RETENTION_DAYS = 7
EXPORT_JOB_RETENTION_DAYS = 7

# Ép MIME chuẩn cho JS module trên Windows/registry lạ để tránh trang trắng
# (module script bị chặn nếu server trả text/plain).
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/javascript", ".mjs")
mimetypes.add_type("text/css", ".css")


_EXPLICIT_LOG_LOCK = threading.Lock()
_LOG_CLEANUP_LOCK = threading.Lock()
_APP_CONFIG_LOCK = threading.RLock()


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


def resolve_persisted_path(raw: str | Path, *bases: Path) -> Path:
    raw_s = str(raw or "").strip()
    valid_bases = [b for b in bases if isinstance(b, Path)]
    fallback_base = valid_bases[0] if valid_bases else ROOT_DIR
    if not raw_s:
        return fallback_base

    direct = Path(raw_s)
    try:
        if direct.exists():
            return direct
    except Exception:
        pass

    win_match = re.match(r"^(?P<drive>[A-Za-z]):[\\/](?P<rest>.+)$", raw_s)
    if win_match:
        drive = win_match.group("drive").lower()
        rest = win_match.group("rest").replace("\\", "/")
        mapped = Path("/mnt") / drive / rest
        try:
            if mapped.exists():
                return mapped
        except Exception:
            pass

    return resolve_existing_path(raw_s, *valid_bases)


def _reader_log_dir() -> Path:
    explicit_dir = (os.environ.get("READER_SERVER_LOG_DIR") or "").strip()
    if explicit_dir:
        return resolve_path_from_base(explicit_dir, runtime_base_dir())
    explicit_file = (os.environ.get("READER_SERVER_LOG_FILE") or "").strip()
    if explicit_file:
        return Path(explicit_file).resolve().parent
    return runtime_base_dir() / "logs" / "reader_server"


def _reader_log_path_for_now() -> Path:
    now = datetime.now()
    return _reader_log_dir() / f"reader_server-{now.strftime('%Y-%m-%d')}.log"


def cleanup_reader_log_files(*, keep_days: int = 30) -> None:
    log_dir = _reader_log_dir()
    try:
        log_dir.mkdir(parents=True, exist_ok=True)
    except Exception:
        return
    cutoff = datetime.now() - timedelta(days=max(1, int(keep_days)))
    pattern = re.compile(r"^reader_server-(\d{4}-\d{2}-\d{2})\.log$")
    with _LOG_CLEANUP_LOCK:
        for entry in log_dir.glob("reader_server-*.log"):
            try:
                match = pattern.match(entry.name)
                if not match:
                    continue
                stamp = datetime.strptime(match.group(1), "%Y-%m-%d")
                if stamp < cutoff:
                    entry.unlink(missing_ok=True)
            except Exception:
                continue


def set_local_dirs(local_dir: Path) -> None:
    """Override local/cache/export/cover dirs theo vị trí DB để ND5 + Reader dùng chung."""
    global LOCAL_DIR, CACHE_DIR, EXPORT_DIR, COVER_DIR, VBOOK_IMAGE_CACHE_DIR, IMPORT_PREVIEW_DIR, DB_PATH
    LOCAL_DIR = local_dir
    CACHE_DIR = LOCAL_DIR / "reader_cache"
    EXPORT_DIR = LOCAL_DIR / "reader_exports"
    COVER_DIR = LOCAL_DIR / "reader_covers"
    VBOOK_IMAGE_CACHE_DIR = CACHE_DIR / "vbook_image_cache"
    IMPORT_PREVIEW_DIR = CACHE_DIR / "import_previews"
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

TXT_IMPORT_PRESETS: list[dict[str, str]] = [
    {
        "id": "cn_standard",
        "label": "Chương Trung chuẩn",
        "pattern": r"^(?:\s*)(?:第\s*[\d0-9一二三四五六七八九十百千零两]+\s*[章节卷回集部篇])[^\n]{0,120}$",
        "description": "Phù hợp đa số TXT truyện Trung có dạng 第123章 / 第三卷.",
    },
    {
        "id": "vi_standard",
        "label": "Chương tiếng Việt",
        "pattern": r"^(?:\s*)(?:Chương|CHƯƠNG|Chuong|CHUONG)\s*[\dIVXLCDMivxlcdm]+[^\n]{0,120}$",
        "description": "Bắt dòng tiêu đề dạng Chương 12 / CHƯƠNG IV.",
    },
    {
        "id": "en_standard",
        "label": "Chapter tiếng Anh",
        "pattern": r"^(?:\s*)(?:Chapter|CHAPTER)\s*[\dIVXLCDMivxlcdm]+[^\n]{0,120}$",
        "description": "Bắt dòng tiêu đề dạng Chapter 12 / CHAPTER IV.",
    },
    {
        "id": "dual_numbered_pipe",
        "label": "Mã số | số chương",
        "pattern": r"^(?:\s*)\d{1,4}\s*[｜|]\s*\d{1,4}[\.、．]\s*[^\d\s][^\n]{0,80}$",
        "description": "Phù hợp TXT có dòng kiểu 001｜1.Tên chương.",
    },
    {
        "id": "short_numbered",
        "label": "Dòng số thứ tự ngắn",
        "pattern": r"^(?:\s*)(?:\d{1,5}|[一二三四五六七八九十百千零两]{1,8})[\.\-、:： )）]\s*[^\d\s][^\n]{0,80}$",
        "description": "Dùng cho TXT có tiêu đề ngắn kiểu 12. Tên chương / 12- Tên chương.",
    },
    {
        "id": "number_space_title",
        "label": "Số thứ tự + khoảng trắng",
        "pattern": r"^(?:\s*)\d{1,4}\s+[^\d\s][^\n]{1,80}$",
        "description": "Dùng cho TXT có dòng tiêu đề kiểu 1 Tên chương.",
    },
]

DEFAULT_READER_IMPORT_SETTINGS: dict[str, Any] = {
    "txt": {
        "target_size": 4500,
        "preface_title": "Mở đầu",
        "heading_patterns": [item["pattern"] for item in TXT_IMPORT_PRESETS],
    },
    "epub": {
        "title_keys": ["title", "book-title"],
        "author_keys": ["creator", "author"],
        "summary_keys": ["description", "summary", "intro", "abstract", "subject"],
        "language_keys": ["language"],
        "cover_meta_names": ["cover"],
        "cover_properties": ["cover-image"],
    },
}


def normalize_metadata_key(value: Any) -> str:
    text = str(value or "").strip().lower()
    if not text:
        return ""
    if "}" in text:
        text = text.split("}", 1)[1]
    if ":" in text:
        text = text.split(":", 1)[1]
    return text.replace("_", "-").strip()


def normalize_import_list(value: Any, fallback: list[str] | tuple[str, ...]) -> list[str]:
    if isinstance(value, list):
        raw_items = value
    elif isinstance(value, tuple):
        raw_items = list(value)
    else:
        text = str(value or "").replace("\r\n", "\n").replace("\r", "\n")
        raw_items = text.split("\n") if text else []
    out: list[str] = []
    seen: set[str] = set()
    for item in raw_items:
        text = str(item or "").strip()
        if not text:
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(text)
    if out:
        return out
    return [str(x).strip() for x in fallback if str(x).strip()]


def normalize_junk_lines(value: Any) -> list[str]:
    if isinstance(value, list):
        raw_items = value
    elif isinstance(value, tuple):
        raw_items = list(value)
    else:
        text = str(value or "").replace("\r\n", "\n").replace("\r", "\n")
        raw_items = text.split("\n") if text else []
    out: list[str] = []
    seen: set[str] = set()
    for item in raw_items:
        text = normalize_newlines(str(item or "")).strip()
        if not text or text in seen:
            continue
        seen.add(text)
        out.append(text)
    return out


def normalize_reader_import_settings(raw_cfg: dict[str, Any] | None = None) -> dict[str, Any]:
    raw = raw_cfg if isinstance(raw_cfg, dict) else {}
    txt_raw = raw.get("txt") if isinstance(raw.get("txt"), dict) else {}
    epub_raw = raw.get("epub") if isinstance(raw.get("epub"), dict) else {}

    txt_default = DEFAULT_READER_IMPORT_SETTINGS["txt"]
    epub_default = DEFAULT_READER_IMPORT_SETTINGS["epub"]

    try:
        target_size = int(txt_raw.get("target_size") or txt_default["target_size"])
    except Exception:
        target_size = int(txt_default["target_size"])
    target_size = max(800, min(30000, target_size))

    txt_patterns = normalize_import_list(
        txt_raw.get("heading_patterns"),
        txt_default["heading_patterns"],
    )

    return {
        "txt": {
            "target_size": target_size,
            "preface_title": str(txt_raw.get("preface_title") or txt_default["preface_title"]).strip() or "Mở đầu",
            "heading_patterns": txt_patterns,
        },
        "epub": {
            "title_keys": normalize_import_list(epub_raw.get("title_keys"), epub_default["title_keys"]),
            "author_keys": normalize_import_list(epub_raw.get("author_keys"), epub_default["author_keys"]),
            "summary_keys": normalize_import_list(epub_raw.get("summary_keys"), epub_default["summary_keys"]),
            "language_keys": normalize_import_list(epub_raw.get("language_keys"), epub_default["language_keys"]),
            "cover_meta_names": normalize_import_list(epub_raw.get("cover_meta_names"), epub_default["cover_meta_names"]),
            "cover_properties": normalize_import_list(epub_raw.get("cover_properties"), epub_default["cover_properties"]),
        },
    }


def import_settings_presets() -> dict[str, Any]:
    return {
        "txt_patterns": [dict(item) for item in TXT_IMPORT_PRESETS],
        "epub_fields": {
            "title_keys": list(DEFAULT_READER_IMPORT_SETTINGS["epub"]["title_keys"]),
            "author_keys": list(DEFAULT_READER_IMPORT_SETTINGS["epub"]["author_keys"]),
            "summary_keys": list(DEFAULT_READER_IMPORT_SETTINGS["epub"]["summary_keys"]),
            "language_keys": list(DEFAULT_READER_IMPORT_SETTINGS["epub"]["language_keys"]),
            "cover_meta_names": list(DEFAULT_READER_IMPORT_SETTINGS["epub"]["cover_meta_names"]),
            "cover_properties": list(DEFAULT_READER_IMPORT_SETTINGS["epub"]["cover_properties"]),
        },
    }


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def utc_now_ts() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def parse_iso_ts(value: Any) -> float:
    raw = str(value or "").strip()
    if not raw:
        return 0.0
    try:
        if raw.endswith("Z"):
            raw = raw[:-1] + "+00:00"
        return float(datetime.fromisoformat(raw).timestamp())
    except Exception:
        return 0.0


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


def build_vbook_image_proxy_path(
    image_url: str,
    *,
    plugin_id: str = "",
    referer: str = "",
    cache: bool = False,
) -> str:
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
    if cache:
        parts.append("cache=1")
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


def extract_comic_image_urls(raw_text: str | None) -> list[str]:
    text = str(raw_text or "")
    payload = decode_comic_payload(text)
    if payload is not None:
        return [str(x).strip() for x in (payload.get("images") or []) if str(x).strip()]

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return []
    out: list[str] = []
    for line in lines:
        if line.startswith(("http://", "https://", "/media/vbook-image?", "media/vbook-image?")):
            out.append(line)
            continue
        return []
    return out


def normalize_vbook_image_cache_inputs(image_url: str, plugin_id: str = "") -> tuple[str, str]:
    url = str(image_url or "").strip()
    pid = str(plugin_id or "").strip()
    if url.startswith("/media/vbook-image?") or url.startswith("media/vbook-image?"):
        parsed = urlparse(url if url.startswith("/") else f"/{url}")
        query = parse_qs(parsed.query)
        inner_url = str((query.get("url", [""])[0] or "")).strip()
        if inner_url:
            url = inner_url
        inner_pid = str((query.get("plugin_id", [""])[0] or "")).strip()
        if inner_pid:
            pid = inner_pid
    return url, pid


def vbook_image_cache_key(*, image_url: str, plugin_id: str = "") -> str:
    image, pid = normalize_vbook_image_cache_inputs(image_url=image_url, plugin_id=plugin_id)
    seed = f"{pid}|{image}"
    return hash_text(seed)


def chapter_raw_cache_has_payload(raw_text: str | None, *, is_comic: bool) -> bool:
    text = str(raw_text or "")
    if not is_comic:
        return bool(text.strip())
    return bool(extract_comic_image_urls(text))


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
    payload = json.dumps(config or {}, ensure_ascii=False, indent=2)
    last_error: Exception | None = None
    with _APP_CONFIG_LOCK:
        for attempt in range(8):
            tmp = target.with_name(
                f"{target.name}.{os.getpid()}.{threading.get_ident()}.{uuid.uuid4().hex}.tmp"
            )
            try:
                tmp.write_text(payload, encoding="utf-8")
                os.replace(tmp, target)
                return target
            except Exception as exc:
                last_error = exc
                try:
                    tmp.unlink(missing_ok=True)
                except Exception:
                    pass
                winerror = getattr(exc, "winerror", None)
                retryable = isinstance(exc, PermissionError) or winerror in {5, 32}
                if (not retryable) or attempt >= 7:
                    raise
                time.sleep(0.05 * (attempt + 1))
    if last_error is not None:
        raise last_error
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


def apply_junk_lines_to_text(text: str, junk_lines: list[str] | tuple[str, ...] | None = None) -> tuple[str, int]:
    content = normalize_newlines(text or "")
    patterns = normalize_junk_lines(junk_lines)
    if not content or not patterns:
        return content, 0
    removed = 0
    for pattern in patterns:
        hits = content.count(pattern)
        if hits <= 0:
            continue
        content = content.replace(pattern, "")
        removed += hits
    content = normalize_newlines(content)
    return content, removed


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


def decode_http_encoded_body(data: bytes, *, content_encoding: str = "") -> bytes:
    if not data:
        return b""
    encoding = str(content_encoding or "").strip().lower()
    try:
        if "gzip" in encoding or data[:2] == b"\x1f\x8b":
            return gzip.decompress(data)
        if "deflate" in encoding:
            return zlib.decompress(data)
    except Exception:
        return data
    return data


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


def pick_primary_translation_value(raw_value: str) -> str:
    values = split_multi_translation_values(raw_value)
    if values:
        return values[0]
    return normalize_vbook_display_text(raw_value or "", single_line=False)


def _collect_dict_suggestion_rows(
    source_cjk: str,
    mapping: dict[str, str],
    *,
    origin: str,
    base_score: int,
    allow_subsegments: bool = True,
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
    if not allow_subsegments:
        return rows
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

    dict_sources: list[tuple[dict[str, str], str, int]] = [
        (normalize_name_set(personal_name), "Name riêng", 160 + boost_book_name),
        (normalize_name_set(personal_vp), "VP riêng", 148 + boost_book_vp),
        (normalize_name_set(global_name), "Name chung", 138 + boost_global_name),
        (normalize_name_set(global_vp), "VP chung", 128 + boost_global_vp),
    ]
    if bundle is not None:
        dict_sources.extend(
            [
                (normalize_name_set(getattr(bundle, "name_general", {})), "Name base", 114),
                (normalize_name_set(getattr(bundle, "vp_general", {})), "VP base", 102),
                (normalize_name_set(getattr(bundle, "name_extra", {})), "Name extra", 96),
                (normalize_name_set(getattr(bundle, "vp_genre", {})), "VP thể loại", 92),
            ]
        )

    dict_rows: list[dict[str, Any]] = []
    for mapping, origin, score in dict_sources:
        dict_rows.extend(
            _collect_dict_suggestion_rows(
                source_cjk,
                mapping,
                origin=origin,
                base_score=score,
                allow_subsegments=False,
            )
        )
    rows.extend(dict_rows)

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


def map_selection_to_source_segment(
    *,
    raw_text: str,
    translated_text: str,
    selected_text: str,
    start_offset: int,
    end_offset: int,
    unit_map: list[dict[str, Any]],
    token_map: list[dict[str, Any]] | None = None,
    translation_mode: str = "server",
) -> dict[str, Any]:
    selected = normalize_newlines(selected_text or "").strip()
    source_raw = normalize_newlines(raw_text or "")
    source_trans = normalize_newlines(translated_text or "")
    total_len = len(source_trans)
    start = max(0, min(total_len, int(start_offset or 0)))
    end = max(0, min(total_len, int(end_offset or 0)))
    if end < start:
        start, end = end, start
    if end == start:
        end = min(total_len, start + max(1, len(selected)))
    if not selected and start < end:
        selected = source_trans[start:end]

    def build_result(
        source_candidate: str,
        *,
        translated_candidate: str = "",
        match_type: str,
        source_start: int = -1,
        source_end: int = -1,
        target_start: int = -1,
        target_end: int = -1,
        candidates: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        source_candidate = strip_edge_punctuation(source_candidate.strip()) if source_candidate else ""
        translated_candidate = strip_edge_punctuation(translated_candidate.strip()) if translated_candidate else ""
        return {
            "selected_text": selected,
            "source_candidate": source_candidate,
            "translated_candidate": translated_candidate or strip_edge_punctuation(selected),
            "match_type": match_type,
            "source_context": _text_snippet(source_raw, source_start, source_end) if source_start >= 0 and source_end >= 0 else "",
            "translated_context": _text_snippet(source_trans, target_start, target_end) if target_start >= 0 and target_end >= 0 else _text_snippet(source_trans, start, end),
            "source_start": source_start,
            "source_end": source_end,
            "target_start": target_start,
            "target_end": target_end,
            "candidates": candidates or [],
        }

    if re.search(r"[\u3400-\u9fff]", selected):
        idx = source_raw.find(selected)
        return build_result(
            selected,
            translated_candidate=selected,
            match_type="selection_is_cjk",
            source_start=idx,
            source_end=(idx + len(selected)) if idx >= 0 else -1,
            target_start=start,
            target_end=end,
            candidates=[{"source": selected, "score": 1.0}],
        )

    if source_raw and source_trans and source_raw == source_trans:
        idx = source_raw.find(selected) if selected else -1
        return build_result(
            selected,
            translated_candidate=selected,
            match_type="raw_text_match",
            source_start=idx,
            source_end=(idx + len(selected)) if idx >= 0 else -1,
            target_start=start,
            target_end=end,
            candidates=[{"source": selected, "score": 1.0}] if selected else [],
        )

    def select_cover_rows(rows: list[dict[str, Any]], start_key: str, end_key: str) -> list[dict[str, Any]]:
        ordered = sorted(
            [row for row in rows if isinstance(row, dict)],
            key=lambda item: (int(item.get(start_key) or 0), int(item.get(end_key) or 0)),
        )
        if not ordered:
            return []
        overlap_indices = [
            idx
            for idx, row in enumerate(ordered)
            if int(row.get(end_key) or 0) > start and int(row.get(start_key) or 0) < end
        ]
        if overlap_indices:
            return ordered[overlap_indices[0] : overlap_indices[-1] + 1]
        center = (start + end) / 2.0
        nearest_idx = min(
            range(len(ordered)),
            key=lambda idx: abs((((int(ordered[idx].get(start_key) or 0) + int(ordered[idx].get(end_key) or 0)) / 2.0) - center)),
        )
        return [ordered[nearest_idx]]

    mode_norm = str(translation_mode or "").strip().lower()
    token_rows = [
        row
        for row in (token_map or [])
        if isinstance(row, dict)
        and strip_edge_punctuation(str(row.get("source_text") or "").strip())
        and int(row.get("token_type") or 0) != 4
    ]
    if mode_norm in {"local", "hanviet"} and token_rows:
        chosen_rows = select_cover_rows(token_rows, "target_start", "target_end")
        if chosen_rows:
            source_start = min(int(row.get("source_start") or 0) for row in chosen_rows)
            source_end = max(int(row.get("source_end") or 0) for row in chosen_rows)
            target_start = min(int(row.get("target_start") or 0) for row in chosen_rows)
            target_end = max(int(row.get("target_end") or 0) for row in chosen_rows)
            source_candidate = "".join(str(row.get("source_text") or "") for row in chosen_rows).strip()
            if not source_candidate:
                source_candidate = source_raw[source_start:source_end].strip()
            translated_candidate = source_trans[target_start:target_end].strip() or selected
            candidates = [
                {
                    "source": strip_edge_punctuation(str(row.get("source_text") or "").strip()),
                    "score": float(max(0, min(int(row.get("target_end") or 0), end) - max(int(row.get("target_start") or 0), start))),
                }
                for row in chosen_rows[:8]
                if strip_edge_punctuation(str(row.get("source_text") or "").strip())
            ]
            return build_result(
                source_candidate,
                translated_candidate=translated_candidate,
                match_type="local_token_cover",
                source_start=source_start,
                source_end=source_end,
                target_start=target_start,
                target_end=target_end,
                candidates=candidates,
            )

    units = sorted((row for row in unit_map if isinstance(row, dict)), key=lambda item: int(item.get("unit_index") or 0))
    chosen_units = select_cover_rows(units, "target_start", "target_end")
    if chosen_units:
        source_start = min(int(row.get("source_start") or 0) for row in chosen_units)
        source_end = max(int(row.get("source_end") or 0) for row in chosen_units)
        target_start = min(int(row.get("target_start") or 0) for row in chosen_units)
        target_end = max(int(row.get("target_end") or 0) for row in chosen_units)
        source_candidate = "".join(str(row.get("source_text") or "") for row in chosen_units).strip()
        if not source_candidate:
            source_candidate = source_raw[source_start:source_end].strip()
        translated_candidate = "".join(str(row.get("target_text") or "") for row in chosen_units).strip()
        if not translated_candidate:
            translated_candidate = source_trans[target_start:target_end].strip() or selected
        candidates = [
            {
                "source": strip_edge_punctuation(str(row.get("source_text") or "").strip()),
                "score": float(max(0, min(int(row.get("target_end") or 0), end) - max(int(row.get("target_start") or 0), start))),
            }
            for row in chosen_units[:8]
            if strip_edge_punctuation(str(row.get("source_text") or "").strip())
        ]
        return build_result(
            source_candidate,
            translated_candidate=translated_candidate,
            match_type="unit_cover",
            source_start=source_start,
            source_end=source_end,
            target_start=target_start,
            target_end=target_end,
            candidates=candidates,
        )

    idx = source_raw.find(selected) if selected else -1
    fallback = selected if idx >= 0 or (source_raw and not source_trans) else ""
    return build_result(
        fallback,
        translated_candidate=selected,
        match_type="fallback",
        source_start=idx,
        source_end=(idx + len(fallback)) if idx >= 0 else -1,
        target_start=start,
        target_end=end,
        candidates=[{"source": fallback, "score": 0.25}] if fallback else [],
    )


def map_selection_to_name_source(
    *,
    raw_text: str,
    translated_text: str,
    selected_text: str,
    start_offset: int,
    end_offset: int,
    name_set: dict[str, str],
    unit_map: list[dict[str, Any]],
    token_map: list[dict[str, Any]] | None = None,
    translation_mode: str = "server",
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
            "target_candidate": pick_primary_translation_value(cleaned_set.get(cjk_value, cjk_value)),
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

    def overlap_len(unit: dict[str, Any], seg_start: int, seg_end: int) -> int:
        us = int(unit.get("target_start") or 0)
        ue = int(unit.get("target_end") or 0)
        return max(0, min(ue, seg_end) - max(us, seg_start))

    def select_cover_rows(token_candidates: list[dict[str, Any]], seg_start: int, seg_end: int) -> list[dict[str, Any]]:
        ordered = sorted(
            [row for row in token_candidates if isinstance(row, dict)],
            key=lambda x: (int(x.get("target_start") or 0), int(x.get("target_end") or 0)),
        )
        if not ordered:
            return []
        overlap_indices = [
            idx
            for idx, row in enumerate(ordered)
            if int(row.get("target_end") or 0) > seg_start and int(row.get("target_start") or 0) < seg_end
        ]
        if overlap_indices:
            return ordered[overlap_indices[0] : overlap_indices[-1] + 1]
        center = (seg_start + seg_end) / 2.0
        nearest_idx = min(
            range(len(ordered)),
            key=lambda idx: abs((((int(ordered[idx].get("target_start") or 0) + int(ordered[idx].get("target_end") or 0)) / 2.0) - center)),
        )
        return [ordered[nearest_idx]]

    def build_suggestions(source_start: int, source_end: int, candidate_source: str, rows: list[dict[str, Any]]) -> list[str]:
        suggestion_sources: list[str] = []
        candidate_source = strip_edge_punctuation(candidate_source)
        if candidate_source:
            suggestion_sources.append(candidate_source)
        for nm in related_name_matches:
            src = strip_edge_punctuation(str(nm.get("source") or "").strip())
            if src and src in source_raw[source_start:source_end]:
                suggestion_sources.append(src)
        for row in rows[:8]:
            src = strip_edge_punctuation(str(row.get("source_text") or "").strip())
            if src:
                suggestion_sources.append(src)
        for m in re.finditer(r"[\u3400-\u9fff]{2,6}", source_raw[source_start:source_end]):
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
        return dedup_suggestions[:8]

    token_rows = sorted(
        [
            row
            for row in (token_map or [])
            if isinstance(row, dict)
            and strip_edge_punctuation(str(row.get("source_text") or "").strip())
            and strip_edge_punctuation(str(row.get("target_text") or "").strip())
            and int(row.get("token_type") or 0) != 4
        ],
        key=lambda x: (int(x.get("target_start") or 0), int(x.get("target_end") or 0)),
    )
    mode_norm = str(translation_mode or "").strip().lower()
    if mode_norm in {"local", "hanviet"} and token_rows:
        overlaps = select_cover_rows(token_rows, start, end)

        if overlaps:
            chosen_rows = overlaps
            match_type = "local_token_cover"
            score_value = 0.97
            if related_name_matches:
                def name_score(item: dict[str, Any]) -> tuple[int, int]:
                    n_start = int(item["start"])
                    n_end = int(item["end"])
                    ov = max(0, min(n_end, end) - max(n_start, start))
                    return (ov, len(str(item.get("target") or "")))

                best_name = sorted(related_name_matches, key=name_score, reverse=True)[0]
                n_start = int(best_name["start"])
                n_end = int(best_name["end"])
                name_tokens = select_cover_rows([
                    u for u in token_rows
                    if int(u.get("target_end") or 0) > n_start and int(u.get("target_start") or 0) < n_end
                ], n_start, n_end)
                if name_tokens and n_start <= start and n_end >= end:
                    chosen_rows = name_tokens
                    match_type = "local_name_token_cover"
                    score_value = 1.0

            source_start = min(int(row.get("source_start") or 0) for row in chosen_rows)
            source_end = max(int(row.get("source_end") or 0) for row in chosen_rows)
            target_start = min(int(row.get("target_start") or 0) for row in chosen_rows)
            target_end = max(int(row.get("target_end") or 0) for row in chosen_rows)
            source_candidate = strip_edge_punctuation(
                "".join(str(row.get("source_text") or "") for row in chosen_rows).strip()
            )
            if not source_candidate:
                source_candidate = strip_edge_punctuation(source_raw[source_start:source_end].strip())
            target_candidate = strip_edge_punctuation(source_trans[target_start:target_end].strip()) or strip_edge_punctuation(selected)

            if chosen_name_exact is not None:
                chosen_source_name = strip_edge_punctuation(str(chosen_name_exact.get("source") or "").strip())
                chosen_target_name = str(cleaned_set.get(chosen_source_name, "") or "").strip()
                chosen_target_main = pick_primary_translation_value(chosen_target_name)
                if chosen_source_name and chosen_target_main:
                    source_candidate = chosen_source_name
                    target_candidate = chosen_target_main
                    match_type = "name_exact_target"
                    score_value = 1.0

            candidate_rows = [
                {
                    "source": strip_edge_punctuation(str(u.get("source_text") or "").strip()),
                    "score": float(overlap_len(u, start, end)),
                }
                for u in chosen_rows[:6]
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
                "unit_start": min(int(row.get("unit_index") or 0) for row in chosen_rows),
                "unit_end": max(int(row.get("unit_index") or 0) for row in chosen_rows),
                "name_suggestions": build_suggestions(source_start, source_end, source_candidate, chosen_rows),
                "candidates": candidate_rows,
            }

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

    def choose_best_unit(unit_candidates: list[dict[str, Any]], seg_start: int, seg_end: int) -> dict[str, Any]:
        def score(unit: dict[str, Any]) -> tuple[float, float, float]:
            us = int(unit.get("target_start") or 0)
            ue = int(unit.get("target_end") or 0)
            unit_len = max(1, ue - us)
            ov = overlap_len(unit, seg_start, seg_end)
            ratio = ov / float(unit_len)
            return (float(ov), float(ratio), -float(unit_len))

        return sorted(unit_candidates, key=score, reverse=True)[0]

    chosen_units = overlaps
    match_type = "unit_best_overlap"
    score_value = 0.9

    if related_name_matches:
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
        chosen_target_main = pick_primary_translation_value(chosen_target_name)
        if chosen_source_name and chosen_target_main:
            source_candidate = chosen_source_name
            target_candidate = chosen_target_main
            match_type = "name_exact_target"
            score_value = 1.0

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
        "name_suggestions": build_suggestions(source_start, source_end, source_candidate, overlaps),
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


def compile_chapter_heading_patterns(patterns: list[str] | tuple[str, ...] | None = None) -> list[re.Pattern[str]]:
    raw_patterns = [str(item or "").strip() for item in (patterns or []) if str(item or "").strip()]
    if not raw_patterns:
        return [CHAPTER_HEADING_REGEX]
    compiled: list[re.Pattern[str]] = []
    for raw in raw_patterns:
        try:
            compiled.append(re.compile(raw, re.MULTILINE))
        except re.error:
            continue
    return compiled or [CHAPTER_HEADING_REGEX]


_CJK_NUMBER_DIGITS = {
    "零": 0,
    "〇": 0,
    "一": 1,
    "二": 2,
    "两": 2,
    "兩": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
}

_CJK_NUMBER_UNITS = {
    "十": 10,
    "百": 100,
    "千": 1000,
    "万": 10000,
}


def parse_cjk_number(value: Any) -> int | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    if raw.isdigit():
        try:
            return int(raw)
        except Exception:
            return None
    total = 0
    section = 0
    number = 0
    used = False
    for ch in raw:
        if ch in _CJK_NUMBER_DIGITS:
            number = _CJK_NUMBER_DIGITS[ch]
            used = True
            continue
        unit = _CJK_NUMBER_UNITS.get(ch)
        if unit is None:
            return None
        if number == 0:
            number = 1
        section += number * unit
        number = 0
        used = True
    total = section + number
    if total > 0:
        return total
    if used and raw in {"零", "〇", "0"}:
        return 0
    return None


def extract_heading_index(title: Any) -> int | None:
    raw = str(title or "").strip()
    if not raw:
        return None
    chapter_match = re.search(r"第\s*([0-9一二三四五六七八九十百千零两兩]+)\s*[章节卷回集部篇]", raw, re.IGNORECASE)
    if chapter_match:
        return parse_cjk_number(chapter_match.group(1))
    pipe_match = re.match(r"^\s*\d{1,4}\s*[｜|]\s*(\d{1,4})(?:[\.\-、:： )）]|\s|$)", raw)
    if pipe_match:
        try:
            return int(pipe_match.group(1))
        except Exception:
            return None
    numbered_match = re.match(r"^\s*(\d{1,4})(?:(?:[\.\-、:： )）]\s*)|\s+)", raw)
    if numbered_match:
        try:
            return int(numbered_match.group(1))
        except Exception:
            return None
    return None


def heading_sequence_score(matches: list[dict[str, Any]]) -> float:
    values = [extract_heading_index(item.get("title")) for item in matches]
    numbered = [value for value in values if isinstance(value, int)]
    if len(numbered) < 2:
        return 0.0
    good = 0
    total = 0
    prev = numbered[0]
    for current in numbered[1:]:
        if current == prev:
            continue
        total += 1
        if current == prev + 1:
            good += 1
        prev = current
    if total <= 0:
        return 0.0
    return good / total


def build_regex_split_candidates(normalized: str, matches: list[dict[str, Any]], preface_title: str) -> list[dict[str, str]]:
    chapters: list[dict[str, str]] = []
    if matches and int(matches[0]["start"]) > 0:
        preface = normalize_text_for_split(normalized[: int(matches[0]["start"])])
        if preface:
            chapters.append({"title": str(preface_title or "Mở đầu").strip() or "Mở đầu", "text": preface})
    for i, match in enumerate(matches):
        title = str(match.get("title") or "").strip() or f"Chương {i+1}"
        start = int(match.get("end") or 0)
        end = int(matches[i + 1]["start"]) if i + 1 < len(matches) else len(normalized)
        content = normalize_text_for_split(normalized[start:end])
        if content:
            chapters.append({"title": title, "text": content})
    return chapters


def analyze_text_split(
    text: str,
    *,
    target_size: int = 4500,
    heading_patterns: list[str] | tuple[str, ...] | None = None,
    preface_title: str = "Mở đầu",
) -> dict[str, Any]:
    normalized = normalize_text_for_split(text)
    if not normalized:
        return {
            "chapters": [],
            "diagnostics": {
                "split_strategy": "newlines",
                "matched_heading_count": 0,
                "used_heading_count": 0,
                "fallback_reason": "",
                "sequence_score": 0.0,
            },
        }

    matches = collect_heading_matches(normalized, compile_chapter_heading_patterns(heading_patterns))
    if not matches:
        return {
            "chapters": split_by_newlines(normalized, target_size=target_size),
            "diagnostics": {
                "split_strategy": "newlines",
                "matched_heading_count": 0,
                "used_heading_count": 0,
                "fallback_reason": "",
                "sequence_score": 0.0,
            },
        }

    regex_candidates = build_regex_split_candidates(normalized, matches, preface_title)
    if not regex_candidates:
        return {
            "chapters": split_by_newlines(normalized, target_size=target_size),
            "diagnostics": {
                "split_strategy": "regex_fallback",
                "matched_heading_count": len(matches),
                "used_heading_count": 0,
                "fallback_reason": "empty_after_regex",
                "sequence_score": 0.0,
            },
        }

    content_lengths = [len(str(ch.get("text") or "").strip()) for ch in regex_candidates if str(ch.get("text") or "").strip()]
    avg_len = (sum(content_lengths) / len(content_lengths)) if content_lengths else 0.0
    min_len = max(800, int(target_size * 0.25))
    max_len = max(target_size * 2, 9000)
    tiny_threshold = max(180, int(target_size * 0.1))
    tiny_ratio = (sum(1 for length in content_lengths if length < tiny_threshold) / len(content_lengths)) if content_lengths else 0.0
    too_long_count = sum(1 for length in content_lengths if length > max_len * 1.6)
    title_avg_len = (
        sum(len(str(item.get("title") or "").strip()) for item in matches) / len(matches)
        if matches
        else 0.0
    )
    sequence_score = heading_sequence_score(matches)

    fallback_reason = ""
    if sequence_score < 0.6:
        if too_long_count > max(2, len(content_lengths) // 8):
            fallback_reason = "too_many_long_blocks"
        elif len(matches) >= 8 and title_avg_len > 95:
            fallback_reason = "heading_titles_too_long"
        elif len(matches) >= 5 and avg_len < min_len * 0.45 and tiny_ratio > 0.25:
            fallback_reason = "headings_too_dense"
        elif len(matches) <= 2 and avg_len < min_len * 0.35:
            fallback_reason = "too_few_headings"

    if fallback_reason:
        chapters = split_by_newlines(normalized, target_size=target_size)
        return {
            "chapters": chapters,
            "diagnostics": {
                "split_strategy": "regex_fallback",
                "matched_heading_count": len(matches),
                "used_heading_count": len(matches),
                "fallback_reason": fallback_reason,
                "sequence_score": round(sequence_score, 3),
            },
        }

    return {
        "chapters": regex_candidates,
        "diagnostics": {
            "split_strategy": "regex",
            "matched_heading_count": len(matches),
            "used_heading_count": len(matches),
            "fallback_reason": "",
            "sequence_score": round(sequence_score, 3),
        },
    }


def collect_heading_matches(normalized: str, patterns: list[re.Pattern[str]]) -> list[dict[str, Any]]:
    raw_matches: list[dict[str, Any]] = []
    for pattern in patterns:
        for match in pattern.finditer(normalized):
            if match.start() == match.end():
                continue
            title = (match.group(0) or "").strip()
            if not title:
                continue
            raw_matches.append(
                {
                    "start": int(match.start()),
                    "end": int(match.end()),
                    "title": title,
                }
            )
    raw_matches.sort(key=lambda item: (int(item["start"]), -int(item["end"]) + int(item["start"])))
    dedup: list[dict[str, Any]] = []
    seen_ranges: set[tuple[int, int]] = set()
    last_end = -1
    for item in raw_matches:
        key = (int(item["start"]), int(item["end"]))
        if key in seen_ranges:
            continue
        seen_ranges.add(key)
        if int(item["start"]) < last_end:
            continue
        dedup.append(item)
        last_end = int(item["end"])
    return dedup


def split_text_into_chapters(
    text: str,
    target_size: int = 4500,
    heading_patterns: list[str] | tuple[str, ...] | None = None,
    preface_title: str = "Mở đầu",
) -> list[dict[str, str]]:
    return list(
        analyze_text_split(
            text,
            target_size=target_size,
            heading_patterns=heading_patterns,
            preface_title=preface_title,
        ).get("chapters")
        or []
    )


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


def extract_epub_metadata_candidates(metadata_root: ET.Element) -> list[dict[str, str]]:
    seen: set[tuple[str, str]] = set()
    out: list[dict[str, str]] = []
    for el in metadata_root.iter():
        key = normalize_metadata_key(localname(el.tag))
        if not key:
            continue
        text = normalize_vbook_display_text(html.unescape("".join(el.itertext() or []).strip()), single_line=False)
        if text:
            sig = (key, text)
            if sig not in seen:
                seen.add(sig)
                out.append({"key": key, "value": text})
        if localname(el.tag).lower() != "meta":
            continue
        for attr_name in ("name", "property", "id"):
            attr_key = normalize_metadata_key(el.attrib.get(attr_name))
            if not attr_key:
                continue
            value = el.attrib.get("content") or "".join(el.itertext() or []).strip()
            value = normalize_vbook_display_text(html.unescape(value), single_line=False)
            if not value:
                continue
            sig = (attr_key, value)
            if sig in seen:
                continue
            seen.add(sig)
            out.append({"key": attr_key, "value": value})
    return out


def first_epub_metadata_value(
    candidates: list[dict[str, str]],
    keys: list[str] | tuple[str, ...],
    *,
    single_line: bool,
) -> str:
    wanted = [normalize_metadata_key(item) for item in keys if normalize_metadata_key(item)]
    if not wanted:
        return ""
    for key in wanted:
        for row in candidates:
            row_key = normalize_metadata_key(row.get("key"))
            if row_key != key:
                continue
            value = normalize_vbook_display_text(row.get("value") or "", single_line=single_line)
            if value:
                return value
    return ""


def parse_epub_book(
    data: bytes,
    *,
    custom_title: str | None = None,
    custom_author: str | None = None,
    custom_summary: str | None = None,
    parser_settings: dict[str, Any] | None = None,
    lang_source: str = "",
) -> dict[str, Any]:
    import_settings = normalize_reader_import_settings({"epub": parser_settings or {}})
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

        metadata_el = find_first_by_localname(opf_doc, "metadata")
        metadata_root = metadata_el if metadata_el is not None else opf_doc
        metadata_candidates = extract_epub_metadata_candidates(metadata_root)
        title = (custom_title or "").strip() or first_epub_metadata_value(
            metadata_candidates,
            import_settings["epub"]["title_keys"],
            single_line=True,
        ) or "Untitled"
        author = (custom_author or "").strip() or first_epub_metadata_value(
            metadata_candidates,
            import_settings["epub"]["author_keys"],
            single_line=True,
        )
        summary = (custom_summary or "").strip() or first_epub_metadata_value(
            metadata_candidates,
            import_settings["epub"]["summary_keys"],
            single_line=False,
        )
        detected_lang = normalize_lang_source(
            first_epub_metadata_value(
                metadata_candidates,
                import_settings["epub"]["language_keys"],
                single_line=True,
            )
        )

        manifest: dict[str, dict[str, str]] = {}
        for item in find_all_by_localname(opf_doc, "item"):
            item_id = item.attrib.get("id", "").strip()
            href = item.attrib.get("href", "").strip()
            media_type = item.attrib.get("media-type", "").strip()
            properties = item.attrib.get("properties", "").strip()
            if not item_id or not href:
                continue
            resolved = resolve_zip_path(opf_path, href)
            manifest[item_id] = {
                "href": href,
                "resolved": resolved,
                "media_type": media_type,
                "properties": properties,
            }

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

        cover_bytes = b""
        cover_name = ""
        cover_meta_names = {normalize_metadata_key(x) for x in import_settings["epub"]["cover_meta_names"]}
        cover_properties = {normalize_metadata_key(x) for x in import_settings["epub"]["cover_properties"]}
        cover_item_id = ""
        for row in metadata_candidates:
            key = normalize_metadata_key(row.get("key"))
            if key not in cover_meta_names:
                continue
            value = str(row.get("value") or "").strip()
            if value:
                cover_item_id = value
                break
        if not cover_item_id:
            for item_id, item in manifest.items():
                prop_tokens = {
                    normalize_metadata_key(x)
                    for x in str(item.get("properties") or "").split()
                    if normalize_metadata_key(x)
                }
                if prop_tokens & cover_properties:
                    cover_item_id = item_id
                    break
        if cover_item_id and cover_item_id in manifest:
            cover_item = manifest.get(cover_item_id) or {}
            cover_name = Path(str(cover_item.get("resolved") or cover_item.get("href") or "cover.jpg")).name
            try:
                cover_bytes = zf.read(str(cover_item.get("resolved") or ""))
            except Exception:
                cover_bytes = b""
        if not cover_bytes:
            for item in manifest.values():
                media_type = str(item.get("media_type") or "").strip().lower()
                if not media_type.startswith("image/"):
                    continue
                prop_tokens = {
                    normalize_metadata_key(x)
                    for x in str(item.get("properties") or "").split()
                    if normalize_metadata_key(x)
                }
                if cover_properties and not (prop_tokens & cover_properties):
                    continue
                cover_name = Path(str(item.get("resolved") or item.get("href") or "cover.jpg")).name
                try:
                    cover_bytes = zf.read(str(item.get("resolved") or ""))
                    break
                except Exception:
                    continue

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

        final_lang = normalize_lang_source(lang_source) or detected_lang or "zh"
        return {
            "source_type": "epub",
            "metadata": {
                "title": title,
                "author": author,
                "summary": summary or "Sách EPUB được nhập từ file cục bộ.",
                "lang_source": final_lang,
                "detected_lang": detected_lang,
                "chapter_count": len(chapters),
                "has_cover": bool(cover_bytes),
                "cover_name": cover_name,
            },
            "chapters": chapters,
            "cover_bytes": cover_bytes,
            "cover_name": cover_name,
            "diagnostics": {
                "metadata_candidates": metadata_candidates,
            },
        }


def parse_epub_chapters(data: bytes, custom_title: str | None = None) -> tuple[str, str, list[dict[str, str]]]:
    parsed = parse_epub_book(data, custom_title=custom_title)
    metadata = parsed.get("metadata") if isinstance(parsed, dict) else {}
    chapters = parsed.get("chapters") if isinstance(parsed, dict) else []
    return (
        str((metadata or {}).get("title") or "Untitled"),
        str((metadata or {}).get("author") or ""),
        [dict(item or {}) for item in chapters if isinstance(item, dict)],
    )


def parse_txt_book(
    filename: str,
    file_bytes: bytes,
    *,
    lang_source: str = "",
    custom_title: str | None = None,
    custom_author: str | None = None,
    custom_summary: str | None = None,
    parser_settings: dict[str, Any] | None = None,
) -> dict[str, Any]:
    settings = normalize_reader_import_settings({"txt": parser_settings or {}})
    text = decode_text_with_fallback(file_bytes)
    title = (custom_title or "").strip() or re.sub(r"\.[^.]+$", "", filename or "") or "Untitled"
    author = (custom_author or "").strip()
    summary = (custom_summary or "").strip() or "Sách TXT được nhập và tách chương tự động."
    split_result = analyze_text_split(
        text,
        target_size=int(settings["txt"]["target_size"]),
        heading_patterns=settings["txt"]["heading_patterns"],
        preface_title=str(settings["txt"]["preface_title"] or "Mở đầu"),
    )
    chapters = list(split_result.get("chapters") or [])
    if not chapters:
        raise ValueError("Không tách được chương từ file TXT.")
    diagnostics = dict(split_result.get("diagnostics") or {})
    return {
        "source_type": "txt",
        "metadata": {
            "title": title,
            "author": author,
            "summary": summary,
            "lang_source": normalize_lang_source(lang_source) or "zh",
            "chapter_count": len(chapters),
            "has_cover": False,
        },
        "chapters": chapters,
        "cover_bytes": b"",
        "cover_name": "",
        "diagnostics": {**diagnostics, "metadata_candidates": []},
    }


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
        reader_cfg = self.app_config.get("reader_translation") or {}
        server_cfg = reader_cfg.get("server") if isinstance(reader_cfg, dict) else {}
        if not isinstance(server_cfg, dict):
            server_cfg = {}
        return {
            "serverUrl": server_cfg.get("serverUrl") or cfg.get("serverUrl", "https://dichngay.com/translate/text"),
            "hanvietJsonUrl": cfg.get(
                "hanvietJsonUrl",
                "https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/han_viet/output.json",
            ),
            "delayMs": int(server_cfg.get("delayMs", cfg.get("delayMs", 250)) or 250),
            "maxChars": int(server_cfg.get("maxChars", cfg.get("maxChars", 4500)) or 4500),
            "maxItems": int(server_cfg.get("maxItems", cfg.get("maxItems", 40)) or 40),
            "retryCount": int(server_cfg.get("retryCount", cfg.get("retryCount", 2)) or 2),
            "timeoutSec": int(server_cfg.get("timeoutSec", cfg.get("timeoutSec", 60)) or 60),
            "retryBackoffMs": int(server_cfg.get("retryBackoffMs", cfg.get("retryBackoffMs", 700)) or 700),
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
                "token_map": [],
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
            processed_text = normalize_newlines(local_detail.get("processed_text") or source)
            translated_with_placeholders = normalize_newlines(
                local_detail.get("translated_with_placeholders") or translated
            )
            unit_map = local_detail.get("unit_map") if isinstance(local_detail.get("unit_map"), list) else []
            token_map = local_detail.get("token_map") if isinstance(local_detail.get("token_map"), list) else []
            hits = local_detail.get("name_hits") if isinstance(local_detail.get("name_hits"), list) else collect_name_hits(source, name_set)
            return {
                "source_text": source,
                "processed_text": processed_text,
                "translated_with_placeholders": translated_with_placeholders,
                "translated": translated,
                "mode": mode_norm,
                "unit_map": unit_map,
                "token_map": token_map,
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
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("PRAGMA busy_timeout = 30000")
            conn.execute("PRAGMA foreign_keys = ON")
            conn.execute("PRAGMA synchronous = NORMAL")
        except Exception:
            pass
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
        return storage_cache_support.write_cache(
            self,
            cache_key,
            lang,
            text,
            utc_now_iso=utc_now_iso,
            cache_dir=CACHE_DIR,
        )

    def read_cache(self, cache_key: str) -> str | None:
        return storage_cache_support.read_cache(
            self,
            cache_key,
            resolve_persisted_path=resolve_persisted_path,
            runtime_base_dir=runtime_base_dir,
            root_dir=ROOT_DIR,
            local_dir=LOCAL_DIR,
            cache_dir=CACHE_DIR,
            decode_text_with_fallback=decode_text_with_fallback,
            utc_now_iso=utc_now_iso,
        )

    def get_translation_memory_batch(self, source_texts: list[str], mode: str, trans_sig: str) -> dict[str, str]:
        return storage_cache_support.get_translation_memory_batch(
            self,
            source_texts,
            mode,
            trans_sig,
            normalize_translation_cache_source=normalize_translation_cache_source,
            normalize_newlines=normalize_newlines,
            utc_now_iso=utc_now_iso,
        )

    def set_translation_memory_batch(self, entries: list[tuple[str, str]], mode: str, trans_sig: str) -> int:
        return storage_cache_support.set_translation_memory_batch(
            self,
            entries,
            mode,
            trans_sig,
            normalize_translation_cache_source=normalize_translation_cache_source,
            normalize_newlines=normalize_newlines,
            utc_now_iso=utc_now_iso,
        )

    def save_translation_unit_map(
        self,
        chapter_id: str,
        trans_sig: str,
        translation_mode: str,
        units: list[dict[str, Any]],
    ) -> int:
        return storage_cache_support.save_translation_unit_map(
            self,
            chapter_id,
            trans_sig,
            translation_mode,
            units,
            utc_now_iso=utc_now_iso,
        )

    def get_translation_unit_map(
        self,
        chapter_id: str,
        trans_sig: str,
        translation_mode: str,
    ) -> list[dict[str, Any]]:
        return storage_cache_support.get_translation_unit_map(
            self,
            chapter_id,
            trans_sig,
            translation_mode,
        )

    def get_translation_unit_map_count(self, chapter_id: str, trans_sig: str, translation_mode: str) -> int:
        return storage_cache_support.get_translation_unit_map_count(
            self,
            chapter_id,
            trans_sig,
            translation_mode,
        )

    def _get_app_state_value(self, key: str) -> str | None:
        with self._connect() as conn:
            row = conn.execute("SELECT value FROM app_state WHERE key = ?", (key,)).fetchone()
        if row and row["value"] is not None:
            return str(row["value"])
        return None

    def _set_app_state_value(self, key: str, value: str) -> None:
        now = utc_now_iso()
        attempts = 4
        for attempt in range(attempts):
            try:
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
                return
            except sqlite3.OperationalError as exc:
                if "locked" not in str(exc).lower() or attempt >= attempts - 1:
                    raise
                time.sleep(0.12 * (attempt + 1))

    def _delete_app_state_value(self, key: str) -> None:
        key_name = str(key or "").strip()
        if not key_name:
            return
        attempts = 4
        for attempt in range(attempts):
            try:
                with self._connect() as conn:
                    conn.execute("DELETE FROM app_state WHERE key = ?", (key_name,))
                return
            except sqlite3.OperationalError as exc:
                if "locked" not in str(exc).lower() or attempt >= attempts - 1:
                    raise
                time.sleep(0.12 * (attempt + 1))

    def load_export_jobs_state(self) -> list[dict[str, Any]]:
        raw = self._get_app_state_value(APP_STATE_EXPORT_JOBS_STATE_KEY)
        if not raw:
            return []
        try:
            data = json.loads(raw)
        except Exception:
            return []
        if not isinstance(data, list):
            return []
        out: list[dict[str, Any]] = []
        for item in data:
            if isinstance(item, dict):
                out.append(dict(item))
        return out

    def save_export_jobs_state(self, items: list[dict[str, Any]]) -> None:
        payload = []
        for item in items or []:
            if isinstance(item, dict):
                payload.append(dict(item))
        self._set_app_state_value(
            APP_STATE_EXPORT_JOBS_STATE_KEY,
            json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        )

    def get_name_set_state(
        self,
        *,
        default_sets: dict[str, Any] | None = None,
        active_default: str | None = None,
        book_id: str | None = None,
    ) -> dict[str, Any]:
        return storage_user_state_support.get_name_set_state(
            self,
            default_sets=default_sets,
            active_default=active_default,
            book_id=book_id,
            normalize_name_sets_collection=normalize_name_sets_collection,
            base_key=APP_STATE_NAME_SET_STATE_KEY,
        )

    def set_name_set_state(
        self,
        sets: dict[str, Any] | None,
        *,
        active_set: str | None = None,
        bump_version: bool = True,
        book_id: str | None = None,
    ) -> dict[str, Any]:
        return storage_user_state_support.set_name_set_state(
            self,
            sets,
            active_set=active_set,
            bump_version=bump_version,
            book_id=book_id,
            normalize_name_sets_collection=normalize_name_sets_collection,
            base_key=APP_STATE_NAME_SET_STATE_KEY,
        )

    def update_name_set_entry(
        self,
        source: str,
        target: str,
        *,
        set_name: str | None = None,
        delete: bool = False,
        book_id: str | None = None,
    ) -> dict[str, Any]:
        return storage_user_state_support.update_name_set_entry(
            self,
            source,
            target,
            set_name=set_name,
            delete=delete,
            book_id=book_id,
            normalize_name_sets_collection=normalize_name_sets_collection,
            contains_name_split_delimiter=contains_name_split_delimiter,
            base_key=APP_STATE_NAME_SET_STATE_KEY,
        )

    def get_active_name_set(
        self,
        *,
        default_sets: dict[str, Any] | None = None,
        active_default: str | None = None,
        book_id: str | None = None,
    ) -> tuple[str, dict[str, str], int]:
        return storage_user_state_support.get_active_name_set(
            self,
            default_sets=default_sets,
            active_default=active_default,
            book_id=book_id,
            normalize_name_set=normalize_name_set,
            normalize_name_sets_collection=normalize_name_sets_collection,
            base_key=APP_STATE_NAME_SET_STATE_KEY,
        )

    def get_book_vp_set_state(self, book_id: str) -> dict[str, Any]:
        return storage_user_state_support.get_book_vp_set_state(
            self,
            book_id,
            normalize_name_set=normalize_name_set,
            base_prefix=APP_STATE_BOOK_VP_SET_KEY_PREFIX,
        )

    def get_book_vp_set(self, book_id: str) -> tuple[dict[str, str], int]:
        return storage_user_state_support.get_book_vp_set(
            self,
            book_id,
            normalize_name_set=normalize_name_set,
            base_prefix=APP_STATE_BOOK_VP_SET_KEY_PREFIX,
        )

    def set_book_vp_set_state(self, book_id: str, entries: dict[str, Any] | None, *, bump_version: bool = True) -> dict[str, Any]:
        return storage_user_state_support.set_book_vp_set_state(
            self,
            book_id,
            entries,
            bump_version=bump_version,
            normalize_name_set=normalize_name_set,
            base_prefix=APP_STATE_BOOK_VP_SET_KEY_PREFIX,
        )

    def update_book_vp_entry(self, book_id: str, source: str, target: str, *, delete: bool = False) -> dict[str, Any]:
        return storage_user_state_support.update_book_vp_entry(
            self,
            book_id,
            source,
            target,
            delete=delete,
            normalize_name_set=normalize_name_set,
            base_prefix=APP_STATE_BOOK_VP_SET_KEY_PREFIX,
        )

    def get_global_junk_state(self) -> dict[str, Any]:
        return storage_user_state_support.get_global_junk_state(
            self,
            state_key=APP_STATE_GLOBAL_JUNK_STATE_KEY,
            normalize_junk_lines=normalize_junk_lines,
        )

    def get_global_junk_lines(self) -> tuple[list[str], int]:
        return storage_user_state_support.get_global_junk_lines(
            self,
            state_key=APP_STATE_GLOBAL_JUNK_STATE_KEY,
            normalize_junk_lines=normalize_junk_lines,
        )

    def set_global_junk_state(self, lines: list[Any] | tuple[Any, ...] | None, *, bump_version: bool = True) -> dict[str, Any]:
        return storage_user_state_support.set_global_junk_state(
            self,
            lines,
            bump_version=bump_version,
            state_key=APP_STATE_GLOBAL_JUNK_STATE_KEY,
            normalize_junk_lines=normalize_junk_lines,
        )

    def update_global_junk_entry(self, line: str, new_line: str = "", *, delete: bool = False) -> dict[str, Any]:
        return storage_user_state_support.update_global_junk_entry(
            self,
            line,
            new_line,
            delete=delete,
            state_key=APP_STATE_GLOBAL_JUNK_STATE_KEY,
            normalize_newlines=normalize_newlines,
            normalize_junk_lines=normalize_junk_lines,
        )

    def chapter_text_cleanup(self, text: str) -> tuple[str, int, int]:
        lines, version = self.get_global_junk_lines()
        cleaned, removed = apply_junk_lines_to_text(text, lines)
        return cleaned, removed, version

    def chapter_trans_signature(self, base_sig: str, *, junk_version: int) -> str:
        normalized = str(base_sig or "").strip() or "raw"
        return f"{normalized}|junk:v{max(1, int(junk_version or 1))}"

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
        return storage_library_support.list_books(
            self,
            include_session=include_session,
            normalize_vi_display_text=normalize_vi_display_text,
            normalize_lang_source=normalize_lang_source,
            book_supports_translation=book_supports_translation,
            is_book_comic=is_book_comic,
        )

    def update_chapter_word_count(self, chapter_id: str, word_count: int) -> None:
        now = utc_now_iso()
        with self._connect() as conn:
            conn.execute(
                "UPDATE chapters SET word_count = ?, updated_at = ? WHERE chapter_id = ?",
                (max(0, int(word_count)), now, chapter_id),
            )

    def find_book(self, book_id: str) -> dict[str, Any] | None:
        return storage_library_support.find_book(self, book_id)

    def find_book_by_source(
        self,
        source_url: str,
        source_plugin: str | None = None,
        *,
        include_session: bool = True,
    ) -> dict[str, Any] | None:
        return storage_library_support.find_book_by_source(
            self,
            source_url,
            source_plugin,
            include_session=include_session,
        )

    def find_books_by_source(
        self,
        source_url: str,
        source_plugin: str | None = None,
        *,
        include_session: bool = True,
        session_only: bool = False,
    ) -> list[dict[str, Any]]:
        return storage_library_support.find_books_by_source(
            self,
            source_url,
            source_plugin,
            include_session=include_session,
            session_only=session_only,
        )

    def _book_cover_url(self, book: dict[str, Any] | None) -> str:
        return storage_library_support.book_cover_url(
            self,
            book,
            build_vbook_image_proxy_path=build_vbook_image_proxy_path,
            quote_url_path=quote_url_path,
        )

    def update_book_metadata(self, book_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        return storage_library_support.update_book_metadata(
            self,
            book_id,
            payload,
            utc_now_iso=utc_now_iso,
        )

    def _collect_vbook_image_cache_keys_for_chapters(
        self,
        *,
        book: dict[str, Any] | None,
        chapter_rows: list[dict[str, Any]] | None,
    ) -> set[str]:
        if not book or not is_book_comic(book):
            return set()
        plugin_id = str(book.get("source_plugin") or "").strip()
        keys: set[str] = set()
        for chapter in chapter_rows or []:
            if not isinstance(chapter, dict):
                continue
            raw_key = str(chapter.get("raw_key") or "").strip()
            if not raw_key:
                continue
            raw_text = self.read_cache(raw_key) or ""
            if not raw_text:
                continue
            for image_url in extract_comic_image_urls(raw_text):
                url = str(image_url or "").strip()
                if not url:
                    continue
                keys.add(vbook_image_cache_key(image_url=url, plugin_id=plugin_id))
        return keys

    def _delete_vbook_image_cache_keys(self, keys: set[str]) -> dict[str, int]:
        deleted = 0
        bytes_deleted = 0
        for key in keys or set():
            cache_body = VBOOK_IMAGE_CACHE_DIR / f"{key}.bin"
            cache_meta = VBOOK_IMAGE_CACHE_DIR / f"{key}.json"
            if cache_body.exists():
                try:
                    bytes_deleted += int(cache_body.stat().st_size)
                except Exception:
                    pass
                try:
                    cache_body.unlink()
                    deleted += 1
                except Exception:
                    pass
            if cache_meta.exists():
                try:
                    cache_meta.unlink()
                except Exception:
                    pass
        return {
            "image_cache_deleted": int(deleted),
            "image_bytes_deleted": int(bytes_deleted),
        }

    def _collect_all_comic_vbook_image_cache_keys(self) -> set[str]:
        keys: set[str] = set()
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT b.source_plugin, c.raw_key
                FROM books b
                JOIN chapters c ON c.book_id = b.book_id
                WHERE lower(COALESCE(b.source_type, '')) IN ('comic', 'vbook_comic', 'vbook_session_comic')
                """
            ).fetchall()
        for row in rows:
            plugin_id = str(row["source_plugin"] or "").strip()
            raw_key = str(row["raw_key"] or "").strip()
            if not raw_key:
                continue
            raw_text = self.read_cache(raw_key) or ""
            if not raw_text:
                continue
            for image_url in extract_comic_image_urls(raw_text):
                url = str(image_url or "").strip()
                if not url:
                    continue
                keys.add(vbook_image_cache_key(image_url=url, plugin_id=plugin_id))
        return keys

    def cleanup_non_comic_vbook_image_cache(self) -> dict[str, int]:
        keep_keys = self._collect_all_comic_vbook_image_cache_keys()
        removed_keys: set[str] = set()
        scanned = 0
        if VBOOK_IMAGE_CACHE_DIR.exists():
            for meta_path in VBOOK_IMAGE_CACHE_DIR.glob("*.json"):
                scanned += 1
                stem = meta_path.stem
                if not stem or stem in keep_keys:
                    continue
                removed_keys.add(stem)
        stats = self._delete_vbook_image_cache_keys(removed_keys) if removed_keys else {
            "image_cache_deleted": 0,
            "image_bytes_deleted": 0,
        }
        return {
            "scanned_meta": int(scanned),
            "kept_keys": int(len(keep_keys)),
            "removed_keys": int(len(removed_keys)),
            **stats,
        }

    def sync_remote_book_toc(self, book_id: str, toc_rows: list[dict[str, str]]) -> dict[str, Any]:
        bid = str(book_id or "").strip()
        if not bid:
            raise ValueError("Thiếu book_id.")
        book = self.find_book(bid)
        if not book:
            raise ValueError("Không tìm thấy truyện.")

        normalized_rows: list[dict[str, Any]] = []
        seen_urls: set[str] = set()
        for idx, raw in enumerate(toc_rows or [], start=1):
            if not isinstance(raw, dict):
                continue
            remote_url = str(raw.get("remote_url") or "").strip()
            if (not remote_url) or (remote_url in seen_urls):
                continue
            seen_urls.add(remote_url)
            title_raw = normalize_vbook_display_text(str(raw.get("title") or raw.get("name") or ""), single_line=True) or f"Chương {idx}"
            normalized_rows.append(
                {
                    "chapter_order": idx,
                    "title_raw": title_raw,
                    "remote_url": remote_url,
                }
            )
        if not normalized_rows:
            raise ValueError("Danh sách mục lục mới rỗng.")

        old_rows = self.get_chapter_rows(bid)
        old_signature = [
            (
                int(row.get("chapter_order") or 0),
                normalize_vbook_display_text(str(row.get("title_raw") or ""), single_line=True),
                str(row.get("remote_url") or "").strip(),
            )
            for row in old_rows
        ]
        new_signature = [
            (
                int(row.get("chapter_order") or 0),
                str(row.get("title_raw") or ""),
                str(row.get("remote_url") or ""),
            )
            for row in normalized_rows
        ]
        if old_signature == new_signature:
            return {
                "ok": True,
                "changed": False,
                "book_id": bid,
                "chapter_count": int(len(old_rows)),
                "added": 0,
                "removed": 0,
                "renamed": 0,
                "reordered": 0,
                "cache_deleted": 0,
                "deleted_files": 0,
                "bytes_deleted": 0,
                "image_cache_deleted": 0,
                "image_bytes_deleted": 0,
            }

        old_by_url: dict[str, dict[str, Any]] = {}
        removed_rows_seed: list[dict[str, Any]] = []
        for row in old_rows:
            remote_url = str(row.get("remote_url") or "").strip()
            if remote_url and remote_url not in old_by_url:
                old_by_url[remote_url] = row
            else:
                removed_rows_seed.append(row)

        updates: list[tuple[Any, ...]] = []
        inserts: list[tuple[Any, ...]] = []
        kept_ids: list[str] = []
        removed_rows = list(removed_rows_seed)
        added = 0
        renamed = 0
        reordered = 0
        now = utc_now_iso()

        for row in normalized_rows:
            remote_url = str(row.get("remote_url") or "").strip()
            title_raw = str(row.get("title_raw") or "").strip()
            chapter_order = int(row.get("chapter_order") or 0)
            old_row = old_by_url.pop(remote_url, None)
            if old_row:
                chapter_id = str(old_row.get("chapter_id") or "").strip()
                old_title = normalize_vbook_display_text(str(old_row.get("title_raw") or ""), single_line=True)
                old_order = int(old_row.get("chapter_order") or 0)
                title_vi = old_row.get("title_vi")
                if old_title != title_raw:
                    renamed += 1
                    title_vi = None
                if old_order != chapter_order:
                    reordered += 1
                updates.append((chapter_order, title_raw, title_vi, now, chapter_id))
                kept_ids.append(chapter_id)
                continue

            chapter_seed = f"{bid}|{remote_url}"
            chapter_id = f"ch_{hash_text(chapter_seed)}"
            raw_key = f"raw_{hash_text(f'{chapter_id}|{remote_url}')}"
            inserts.append(
                (
                    chapter_id,
                    bid,
                    chapter_order,
                    title_raw,
                    None,
                    raw_key,
                    None,
                    None,
                    now,
                    0,
                    remote_url,
                )
            )
            kept_ids.append(chapter_id)
            added += 1

        removed_rows.extend(old_by_url.values())
        removed_ids = [str(row.get("chapter_id") or "").strip() for row in removed_rows if str(row.get("chapter_id") or "").strip()]
        removed_cache_keys = {
            str(key).strip()
            for row in removed_rows
            for key in (row.get("raw_key"), row.get("trans_key"))
            if str(key or "").strip()
        }
        image_cache_keys = self._collect_vbook_image_cache_keys_for_chapters(book=book, chapter_rows=removed_rows)
        delete_stats = self._delete_cache_keys_with_stats(removed_cache_keys) if removed_cache_keys else {
            "cache_deleted": 0,
            "deleted_files": 0,
            "bytes_deleted": 0,
        }
        image_stats = self._delete_vbook_image_cache_keys(image_cache_keys) if image_cache_keys else {
            "image_cache_deleted": 0,
            "image_bytes_deleted": 0,
        }

        with self._connect() as conn:
            if removed_ids:
                placeholders = ",".join("?" for _ in removed_ids)
                conn.execute(
                    f"DELETE FROM translation_unit_map WHERE chapter_id IN ({placeholders})",
                    tuple(removed_ids),
                )
                conn.execute(
                    f"DELETE FROM chapters WHERE chapter_id IN ({placeholders})",
                    tuple(removed_ids),
                )
            if updates:
                conn.executemany(
                    """
                    UPDATE chapters
                    SET chapter_order = ?, title_raw = ?, title_vi = ?, updated_at = ?
                    WHERE chapter_id = ?
                    """,
                    updates,
                )
            if inserts:
                conn.executemany(
                    """
                    INSERT INTO chapters(
                        chapter_id, book_id, chapter_order, title_raw, title_vi,
                        raw_key, trans_key, trans_sig, updated_at, word_count, remote_url
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    inserts,
                )
            last_read_id = str(book.get("last_read_chapter_id") or "").strip()
            keep_last_read = bool(last_read_id and last_read_id in set(kept_ids))
            if keep_last_read:
                conn.execute(
                    "UPDATE books SET chapter_count = ?, updated_at = ? WHERE book_id = ?",
                    (len(normalized_rows), now, bid),
                )
            else:
                fallback_last_read = kept_ids[0] if kept_ids else None
                conn.execute(
                    """
                    UPDATE books
                    SET chapter_count = ?, updated_at = ?, last_read_chapter_id = ?, last_read_ratio = ?
                    WHERE book_id = ?
                    """,
                    (len(normalized_rows), now, fallback_last_read, 0.0, bid),
                )

        return {
            "ok": True,
            "changed": True,
            "book_id": bid,
            "chapter_count": int(len(normalized_rows)),
            "added": int(added),
            "removed": int(len(removed_rows)),
            "renamed": int(renamed),
            "reordered": int(reordered),
            "cache_deleted": int(delete_stats.get("cache_deleted") or 0),
            "deleted_files": int(delete_stats.get("deleted_files") or 0),
            "bytes_deleted": int(delete_stats.get("bytes_deleted") or 0),
            "image_cache_deleted": int(image_stats.get("image_cache_deleted") or 0),
            "image_bytes_deleted": int(image_stats.get("image_bytes_deleted") or 0),
        }

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

    def _comic_raw_cache_complete(self, raw_text: str | None, *, plugin_id: str = "") -> bool:
        images = extract_comic_image_urls(raw_text)
        if not images:
            return False
        for image_url in images:
            key = vbook_image_cache_key(image_url=image_url, plugin_id=plugin_id)
            body = VBOOK_IMAGE_CACHE_DIR / f"{key}.bin"
            if not body.exists():
                return False
        return True

    def chapter_cache_available(self, *, raw_text: str | None, book: dict[str, Any] | None) -> bool:
        text = str(raw_text or "")
        is_comic = bool(is_book_comic(book))
        if not chapter_raw_cache_has_payload(text, is_comic=is_comic):
            return False
        if not is_comic:
            return True
        plugin_id = str((book or {}).get("source_plugin") or "").strip()
        return self._comic_raw_cache_complete(text, plugin_id=plugin_id)

    def chapter_cache_available_by_key(self, *, raw_key: str, book: dict[str, Any] | None) -> bool:
        key = str(raw_key or "").strip()
        if not key:
            return False
        cached_raw = self.read_cache(key)
        if cached_raw is None:
            return False
        return self.chapter_cache_available(raw_text=cached_raw, book=book)

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
        return storage_library_support.list_chapters_paged(
            self,
            book_id,
            page=page,
            page_size=page_size,
            mode=mode,
            translator=translator,
            translate_mode=translate_mode,
            name_set_override=name_set_override,
            vp_set_override=vp_set_override,
            book_supports_translation=book_supports_translation,
            normalize_vi_display_text=normalize_vi_display_text,
        )

    def get_chapter_rows(self, book_id: str) -> list[dict[str, Any]]:
        return storage_library_support.get_chapter_rows(self, book_id)

    def find_chapter(self, chapter_id: str) -> dict[str, Any] | None:
        return storage_library_support.find_chapter(self, chapter_id)

    def get_book_download_map(self, book_id: str, chapter_ids: list[str] | None = None) -> dict[str, bool]:
        return storage_library_support.get_book_download_map(self, book_id, chapter_ids)

    def get_book_download_counts(self, book_id: str) -> tuple[int, int]:
        return storage_library_support.get_book_download_counts(self, book_id)

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
        storage_library_support.update_book_progress(
            self,
            book_id,
            chapter_id=chapter_id,
            ratio=ratio,
            mode=mode,
            theme_pref=theme_pref,
            utc_now_iso=utc_now_iso,
        )

    def get_book_detail(self, book_id: str) -> dict[str, Any] | None:
        return storage_library_support.get_book_detail(
            self,
            book_id,
            normalize_lang_source=normalize_lang_source,
            book_supports_translation=book_supports_translation,
            is_book_comic=is_book_comic,
            normalize_vi_display_text=normalize_vi_display_text,
        )

    def delete_book(
        self,
        book_id: str,
        *,
        cleanup_history: bool = True,
        cleanup_related_source: bool = True,
    ) -> bool:
        book = self.find_book(book_id)
        chapters = self.get_chapter_rows(book_id)
        if not chapters and not book:
            return False
        source_url = str((book or {}).get("source_url") or "").strip()
        source_plugin = str((book or {}).get("source_plugin") or "").strip()
        source_type = str((book or {}).get("source_type") or "").strip().lower()

        content_keys = {ch["raw_key"] for ch in chapters if ch.get("raw_key")}
        content_keys.update(ch["trans_key"] for ch in chapters if ch.get("trans_key"))
        image_cache_keys: set[str] = set()
        if is_book_comic(book):
            plugin_id = str((book or {}).get("source_plugin") or "").strip()
            for ch in chapters:
                raw_key = str(ch.get("raw_key") or "").strip()
                if not raw_key:
                    continue
                raw_text = self.read_cache(raw_key) or ""
                for image_url in extract_comic_image_urls(raw_text):
                    key = vbook_image_cache_key(image_url=image_url, plugin_id=plugin_id)
                    if key:
                        image_cache_keys.add(key)

        with self._connect() as conn:
            if chapters:
                conn.executemany(
                    "DELETE FROM translation_unit_map WHERE chapter_id = ?",
                    [(ch["chapter_id"],) for ch in chapters if ch.get("chapter_id")],
                )
            conn.execute("DELETE FROM chapters WHERE book_id = ?", (book_id,))
            conn.execute("DELETE FROM books WHERE book_id = ?", (book_id,))

        self._delete_cache_keys(content_keys)
        for key in image_cache_keys:
            for suffix in (".bin", ".json"):
                path = VBOOK_IMAGE_CACHE_DIR / f"{key}{suffix}"
                if not path.exists():
                    continue
                try:
                    path.unlink()
                except Exception:
                    pass
        self._delete_app_state_value(
            storage_user_state_support._name_set_state_key(book_id, base_key=APP_STATE_NAME_SET_STATE_KEY)
        )
        try:
            self._delete_app_state_value(
                storage_user_state_support._book_vp_set_key(book_id, base_prefix=APP_STATE_BOOK_VP_SET_KEY_PREFIX)
            )
        except ValueError:
            pass

        epub_file = CACHE_DIR / "epub_sources" / f"{book_id}.epub"
        if epub_file.exists():
            try:
                epub_file.unlink()
            except Exception:
                pass
        cover_path = (book or {}).get("cover_path") or ""
        if cover_path and not cover_path.startswith(("http://", "https://", "data:")):
            cp = resolve_persisted_path(
                cover_path,
                runtime_base_dir(),
                ROOT_DIR,
                LOCAL_DIR,
                COVER_DIR,
            )
            if cp.exists():
                try:
                    cp.unlink()
                except Exception:
                    pass
        if cleanup_history and source_url:
            try:
                self.remove_history_by_source(plugin_id=source_plugin, source_url=source_url)
            except Exception:
                pass
        if cleanup_related_source and source_url and not source_type.startswith("vbook_session"):
            try:
                self._delete_session_books_for_source(
                    source_url=source_url,
                    source_plugin=source_plugin,
                    exclude_book_ids={str(book_id or "").strip()},
                )
            except Exception:
                pass
        return True

    def _delete_session_books_for_source(
        self,
        *,
        source_url: str,
        source_plugin: str = "",
        exclude_book_ids: set[str] | None = None,
    ) -> dict[str, int]:
        source = str(source_url or "").strip()
        plugin = str(source_plugin or "").strip()
        excluded = {str(x or "").strip() for x in (exclude_book_ids or set()) if str(x or "").strip()}
        if not source:
            return {"books_deleted": 0}
        rows = self.find_books_by_source(
            source,
            plugin,
            include_session=True,
            session_only=True,
        )
        deleted = 0
        for row in rows:
            bid = str(row.get("book_id") or "").strip()
            if (not bid) or (bid in excluded):
                continue
            if self.delete_book(bid, cleanup_history=False, cleanup_related_source=False):
                deleted += 1
        return {"books_deleted": int(deleted)}

    def cleanup_orphan_session_books(self) -> dict[str, int]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT b.book_id
                FROM books b
                WHERE lower(COALESCE(b.source_type, '')) LIKE 'vbook_session%'
                  AND trim(COALESCE(b.source_url, '')) <> ''
                  AND NOT EXISTS (
                        SELECT 1
                        FROM history_books h
                        WHERE h.source_url = b.source_url
                          AND (
                                trim(COALESCE(b.source_plugin, '')) = ''
                                OR h.plugin_id = b.source_plugin
                          )
                    )
                """
            ).fetchall()
        deleted = 0
        for row in rows:
            bid = str(row["book_id"] or "").strip()
            if not bid:
                continue
            if self.delete_book(bid, cleanup_history=False, cleanup_related_source=False):
                deleted += 1
        return {
            "orphan_session_books": int(len(rows)),
            "orphan_session_books_deleted": int(deleted),
        }

    def cleanup_expired_history(self) -> int:
        return storage_history_support.cleanup_expired_history(self, utc_now_iso=utc_now_iso)

    def list_history_books(self) -> list[dict[str, Any]]:
        return storage_history_support.list_history_books(
            self,
            normalize_vbook_display_text=normalize_vbook_display_text,
            build_vbook_image_proxy_path=build_vbook_image_proxy_path,
        )

    def get_history_book(self, history_id: str) -> dict[str, Any] | None:
        return storage_history_support.get_history_book(self, history_id)

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
        return storage_history_support.upsert_history_book(
            self,
            plugin_id=plugin_id,
            source_url=source_url,
            title=title,
            author=author,
            cover_url=cover_url,
            last_read_chapter_url=last_read_chapter_url,
            last_read_chapter_title=last_read_chapter_title,
            last_read_ratio=last_read_ratio,
            normalize_vbook_display_text=normalize_vbook_display_text,
            build_vbook_image_proxy_path=build_vbook_image_proxy_path,
            hash_text=hash_text,
            history_retention_days=HISTORY_BOOK_RETENTION_DAYS,
        )

    def delete_history_book(self, history_id: str) -> bool:
        return storage_history_support.delete_history_book(self, history_id)

    def remove_history_by_source(self, *, plugin_id: str, source_url: str) -> int:
        return storage_history_support.remove_history_by_source(self, plugin_id=plugin_id, source_url=source_url)

    def _delete_cache_keys(self, keys: set[str]) -> int:
        return storage_cache_support.delete_cache_keys(self, keys)

    def _delete_cache_rows_with_stats(self, rows: list[sqlite3.Row] | list[dict[str, Any]]) -> dict[str, int]:
        return storage_cache_support.delete_cache_rows_with_stats(rows)

    def _delete_cache_keys_with_stats(self, keys: set[str]) -> dict[str, int]:
        return storage_cache_support.delete_cache_keys_with_stats(self, keys)

    def get_content_cache_meta(self, keys: set[str] | list[str]) -> dict[str, dict[str, Any]]:
        return storage_cache_support.get_content_cache_meta(self, keys)

    def get_translation_cache_stats(self) -> dict[str, int]:
        return storage_cache_support.get_translation_cache_stats(self)

    def clear_translated_cache(self) -> dict[str, Any]:
        return storage_cache_support.clear_translated_cache(self, utc_now_iso=utc_now_iso)

    def clear_book_cache(self, book_id: str, *, clear_raw: bool = False, clear_trans: bool = False) -> dict[str, Any]:
        return storage_cache_support.clear_book_cache(
            self,
            book_id,
            clear_raw=clear_raw,
            clear_trans=clear_trans,
            utc_now_iso=utc_now_iso,
        )

    def clear_chapter_translated_cache(self, chapter_id: str) -> dict[str, Any]:
        return storage_cache_support.clear_chapter_translated_cache(
            self,
            chapter_id,
            resolve_persisted_path=resolve_persisted_path,
            runtime_base_dir=runtime_base_dir,
            root_dir=ROOT_DIR,
            local_dir=LOCAL_DIR,
            cache_dir=CACHE_DIR,
            utc_now_iso=utc_now_iso,
        )

    def search(self, query: str) -> dict[str, Any]:
        return storage_library_support.search(
            self,
            query,
            normalize_vi_display_text=normalize_vi_display_text,
        )

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

        raw_text, _, junk_version = self.chapter_text_cleanup(cached_raw or "")
        if mode == "raw" or (not book_supports_translation(book)):
            return raw_text

        base_sig = translator.translation_signature(
            mode=translate_mode,
            name_set_override=name_set_override,
            vp_set_override=vp_set_override,
        )
        current_sig = self.chapter_trans_signature(base_sig, junk_version=junk_version)
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
        self.vbook_plugin_install_registry: dict[str, dict[str, Any]] = {}
        self.vbook_bridge_enabled = True
        self.vbook_bridge_cookie_fallback = True
        self.vbook_bridge_state_path = LOCAL_DIR / "browser_bridge_state.json"
        self.vbook_bridge_cookie_db_path = ROOT_DIR / "qt_browser_profile" / "storage" / "Cookies"
        self._vbook_bridge_state_cache: dict[str, Any] = {}
        self._vbook_bridge_state_mtime: float | None = None
        self.reader_translation_settings: dict[str, Any] = {"enabled": True, "mode": "local"}
        self.reader_import_settings: dict[str, Any] = normalize_reader_import_settings({})
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
        self._export_lock = threading.RLock()
        self._export_cv = threading.Condition(self._export_lock)
        self._export_jobs: dict[str, dict[str, Any]] = {}
        self._export_queue: list[str] = []
        self._export_running_job_id: str | None = None
        self._export_worker_started = False
        self._export_worker_thread: threading.Thread | None = None
        with self._export_cv:
            self._load_export_jobs_state_locked()

    def _default_name_sets(self) -> dict[str, dict[str, str]]:
        return normalize_name_sets_collection(self.app_config.get("nameSets") or {})

    def _default_active_name_set(self, default_sets: dict[str, dict[str, str]]) -> str:
        active = str(self.app_config.get("activeNameSet") or "").strip()
        if active in default_sets:
            return active
        return next(iter(default_sets.keys()))

    def _ensure_reader_config_defaults_persisted(self) -> None:
        cfg = dict(self.app_config or {}) if isinstance(self.app_config, dict) else {}
        normalized_translation = self._normalized_reader_translation_settings(cfg)
        current_translation = cfg.get("reader_translation") if isinstance(cfg.get("reader_translation"), dict) else {}
        changed = False
        if current_translation != normalized_translation:
            cfg["reader_translation"] = normalized_translation
            changed = True
        normalized_import = self._normalized_reader_import_settings(cfg)
        current_import = cfg.get("reader_import") if isinstance(cfg.get("reader_import"), dict) else {}
        if current_import != normalized_import:
            cfg["reader_import"] = normalized_import
            changed = True
        if changed:
            save_app_config(cfg)
            self.app_config = cfg

    def refresh_config(self) -> None:
        self.app_config = load_app_config()
        self._ensure_reader_config_defaults_persisted()
        self.reader_translation_settings = self._normalized_reader_translation_settings(self.app_config)
        self.reader_import_settings = self._normalized_reader_import_settings(self.app_config)
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
        self.vbook_plugin_install_registry = self._normalized_vbook_install_registry(vcfg)
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

    def _import_preview_root(self) -> Path:
        IMPORT_PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
        return IMPORT_PREVIEW_DIR

    def _cleanup_import_previews(self, *, max_age_hours: int = 24) -> None:
        root = self._import_preview_root()
        cutoff = time.time() - max(1, int(max_age_hours)) * 3600
        for child in root.iterdir():
            try:
                if child.stat().st_mtime >= cutoff:
                    continue
                if child.is_dir():
                    for nested in child.iterdir():
                        try:
                            nested.unlink()
                        except Exception:
                            pass
                    child.rmdir()
                else:
                    child.unlink()
            except Exception:
                continue

    def _import_preview_dir(self, token: str) -> Path:
        safe = re.sub(r"[^a-zA-Z0-9_-]", "", str(token or ""))
        if not safe:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Token preview import không hợp lệ.")
        return self._import_preview_root() / safe

    def _save_import_preview_state(self, token: str, state: dict[str, Any]) -> dict[str, Any]:
        folder = self._import_preview_dir(token)
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / "state.json"
        path.write_text(json.dumps(state or {}, ensure_ascii=False, indent=2), encoding="utf-8")
        return state

    def _load_import_preview_state(self, token: str) -> dict[str, Any]:
        folder = self._import_preview_dir(token)
        path = folder / "state.json"
        if not path.exists():
            raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy phiên chuẩn bị import.")
        try:
            parsed = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            raise ApiError(HTTPStatus.INTERNAL_SERVER_ERROR, "BAD_IMPORT_PREVIEW", "Không đọc được phiên chuẩn bị import.", str(exc)) from exc
        if not isinstance(parsed, dict):
            raise ApiError(HTTPStatus.INTERNAL_SERVER_ERROR, "BAD_IMPORT_PREVIEW", "Dữ liệu preview import không hợp lệ.")
        return parsed

    def _remove_import_preview_state(self, token: str) -> None:
        folder = self._import_preview_dir(token)
        if not folder.exists():
            return
        for item in folder.iterdir():
            try:
                item.unlink()
            except Exception:
                pass
        try:
            folder.rmdir()
        except Exception:
            pass

    def _merge_reader_import_settings(self, override: dict[str, Any] | None = None) -> dict[str, Any]:
        base = normalize_reader_import_settings(self.reader_import_settings)
        if not isinstance(override, dict):
            return base
        merged = {
            "txt": dict(base.get("txt") or {}),
            "epub": dict(base.get("epub") or {}),
        }
        for section in ("txt", "epub"):
            raw_section = override.get(section)
            if not isinstance(raw_section, dict):
                continue
            merged[section].update(raw_section)
        return normalize_reader_import_settings(merged)

    def _parse_local_import_payload(
        self,
        filename: str,
        file_bytes: bytes,
        *,
        lang_source: str,
        title: str,
        author: str,
        summary: str = "",
        import_settings: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        name = filename or "imported"
        ext = name.lower().rsplit(".", 1)[-1] if "." in name else "txt"
        settings = self._merge_reader_import_settings(import_settings)
        lang = normalize_lang_source(lang_source) or "zh"

        if ext == "epub":
            parsed = parse_epub_book(
                file_bytes,
                custom_title=title,
                custom_author=author,
                custom_summary=summary,
                parser_settings=settings.get("epub"),
                lang_source=lang,
            )
        elif ext == "txt":
            parsed = parse_txt_book(
                name,
                file_bytes,
                lang_source=lang,
                custom_title=title,
                custom_author=author,
                custom_summary=summary,
                parser_settings=settings.get("txt"),
            )
        else:
            raise ValueError("V1 chỉ hỗ trợ import TXT và EPUB.")

        metadata = parsed.get("metadata") if isinstance(parsed.get("metadata"), dict) else {}
        chapters = parsed.get("chapters") if isinstance(parsed.get("chapters"), list) else []
        if not chapters:
            raise ValueError("Không có chương hợp lệ để import.")
        chapter_preview = []
        for idx, chapter in enumerate(chapters, start=1):
            if not isinstance(chapter, dict):
                continue
            raw_title = str(chapter.get("title") or f"Chương {idx}").strip() or f"Chương {idx}"
            raw_text = str(chapter.get("text") or "")
            chapter_preview.append(
                {
                    "index": idx,
                    "title": raw_title,
                    "word_count": len(raw_text),
                    "preview": normalize_vbook_display_text(raw_text[:140], single_line=False),
                }
            )
        return {
            "file_name": name,
            "file_ext": ext,
            "source_type": str(parsed.get("source_type") or ext),
            "metadata": {
                "title": str(metadata.get("title") or title or "").strip() or "Untitled",
                "author": str(metadata.get("author") or author or "").strip(),
                "summary": str(metadata.get("summary") or summary or "").strip(),
                "lang_source": normalize_lang_source(metadata.get("lang_source") or lang) or lang,
                "chapter_count": len(chapter_preview),
                "has_cover": bool(metadata.get("has_cover")),
                "detected_lang": normalize_lang_source(metadata.get("detected_lang") or ""),
            },
            "chapters": [dict(item or {}) for item in chapters if isinstance(item, dict)],
            "chapter_preview": chapter_preview,
            "cover_bytes": parsed.get("cover_bytes") if isinstance(parsed.get("cover_bytes"), (bytes, bytearray)) else b"",
            "cover_name": str(parsed.get("cover_name") or ""),
            "diagnostics": dict(parsed.get("diagnostics") or {}),
            "import_settings": settings,
        }

    def _create_book_from_local_import(self, parsed: dict[str, Any], file_bytes: bytes) -> dict[str, Any]:
        metadata = parsed.get("metadata") if isinstance(parsed.get("metadata"), dict) else {}
        chapters = parsed.get("chapters") if isinstance(parsed.get("chapters"), list) else []
        created = self.storage.create_book(
            title=str(metadata.get("title") or "Untitled").strip() or "Untitled",
            author=str(metadata.get("author") or "").strip(),
            lang_source=normalize_lang_source(metadata.get("lang_source") or "") or "zh",
            source_type=str(parsed.get("source_type") or "txt").strip() or "txt",
            summary=str(metadata.get("summary") or "").strip(),
            chapters=[dict(item or {}) for item in chapters if isinstance(item, dict)],
        )
        book_id = str((created or {}).get("book_id") or "").strip()
        if not book_id:
            return created
        if str(parsed.get("source_type") or "") == "epub":
            self.storage.save_epub_source(book_id, file_bytes)
            created["epub_url"] = f"/media/epub/{book_id}.epub"
        cover_bytes = parsed.get("cover_bytes")
        if isinstance(cover_bytes, (bytes, bytearray)) and cover_bytes:
            try:
                updated = self.storage.set_book_cover_upload(
                    book_id,
                    str(parsed.get("cover_name") or "cover.jpg"),
                    bytes(cover_bytes),
                )
                if updated:
                    created = updated
                    if str(parsed.get("source_type") or "") == "epub":
                        created["epub_url"] = f"/media/epub/{book_id}.epub"
            except Exception:
                pass
        return created

    def prepare_import_file(
        self,
        filename: str,
        file_bytes: bytes,
        lang_source: str,
        title: str,
        author: str,
        summary: str = "",
        import_settings: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        self._cleanup_import_previews()
        parsed = self._parse_local_import_payload(
            filename,
            file_bytes,
            lang_source=lang_source,
            title=title,
            author=author,
            summary=summary,
            import_settings=import_settings,
        )
        token = uuid.uuid4().hex
        folder = self._import_preview_dir(token)
        folder.mkdir(parents=True, exist_ok=True)
        suffix = Path(filename or "import.txt").suffix or ".txt"
        source_name = f"source{suffix}"
        (folder / source_name).write_bytes(file_bytes)
        self._save_import_preview_state(
            token,
            {
                "token": token,
                "file_name": filename or "imported",
                "source_name": source_name,
                "lang_source": str(parsed["metadata"]["lang_source"]),
                "title": str(parsed["metadata"]["title"] or ""),
                "author": str(parsed["metadata"]["author"] or ""),
                "summary": str(parsed["metadata"]["summary"] or ""),
                "import_settings": parsed.get("import_settings") or self.reader_import_settings,
                "created_at": utc_now_iso(),
            },
        )
        return {
            "ok": True,
            "token": token,
            "preview": {
                "file_name": parsed.get("file_name"),
                "file_ext": parsed.get("file_ext"),
                "source_type": parsed.get("source_type"),
                "metadata": parsed.get("metadata"),
                "chapters": parsed.get("chapter_preview"),
                "diagnostics": parsed.get("diagnostics"),
                "import_settings": parsed.get("import_settings"),
                "presets": import_settings_presets(),
            },
        }

    def preview_import_token(
        self,
        token: str,
        *,
        lang_source: str = "",
        title: str = "",
        author: str = "",
        summary: str = "",
        import_settings: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        state = self._load_import_preview_state(token)
        folder = self._import_preview_dir(token)
        source_path = folder / str(state.get("source_name") or "")
        if not source_path.exists():
            raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không còn file nguồn cho phiên import này.")
        file_bytes = source_path.read_bytes()
        parsed = self._parse_local_import_payload(
            str(state.get("file_name") or "imported"),
            file_bytes,
            lang_source=lang_source or str(state.get("lang_source") or ""),
            title=title or str(state.get("title") or ""),
            author=author or str(state.get("author") or ""),
            summary=summary or str(state.get("summary") or ""),
            import_settings=import_settings if isinstance(import_settings, dict) else state.get("import_settings"),
        )
        state["lang_source"] = str(parsed["metadata"]["lang_source"])
        state["title"] = str(parsed["metadata"]["title"] or "")
        state["author"] = str(parsed["metadata"]["author"] or "")
        state["summary"] = str(parsed["metadata"]["summary"] or "")
        state["import_settings"] = parsed.get("import_settings") or state.get("import_settings") or {}
        state["updated_at"] = utc_now_iso()
        self._save_import_preview_state(token, state)
        return {
            "ok": True,
            "token": token,
            "preview": {
                "file_name": parsed.get("file_name"),
                "file_ext": parsed.get("file_ext"),
                "source_type": parsed.get("source_type"),
                "metadata": parsed.get("metadata"),
                "chapters": parsed.get("chapter_preview"),
                "diagnostics": parsed.get("diagnostics"),
                "import_settings": parsed.get("import_settings"),
                "presets": import_settings_presets(),
            },
        }

    def commit_import_token(
        self,
        token: str,
        *,
        lang_source: str = "",
        title: str = "",
        author: str = "",
        summary: str = "",
        import_settings: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        state = self._load_import_preview_state(token)
        folder = self._import_preview_dir(token)
        source_path = folder / str(state.get("source_name") or "")
        if not source_path.exists():
            raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không còn file nguồn cho phiên import này.")
        file_bytes = source_path.read_bytes()
        parsed = self._parse_local_import_payload(
            str(state.get("file_name") or "imported"),
            file_bytes,
            lang_source=lang_source or str(state.get("lang_source") or ""),
            title=title or str(state.get("title") or ""),
            author=author or str(state.get("author") or ""),
            summary=summary or str(state.get("summary") or ""),
            import_settings=import_settings if isinstance(import_settings, dict) else state.get("import_settings"),
        )
        created = self._create_book_from_local_import(parsed, file_bytes)
        self._remove_import_preview_state(token)
        return created

    def prepare_import_url(
        self,
        url: str,
        *,
        plugin_id: str | None = None,
        history_only: bool = False,
    ) -> dict[str, Any]:
        self._cleanup_import_previews()
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
            return {
                "ok": True,
                "book": self.storage.get_book_detail(existing_normal["book_id"]) or existing_normal,
                "existing": True,
            }

        if history_only:
            existing_session = self.storage.find_book_by_source(
                source_url,
                plugin.plugin_id,
                include_session=True,
            )
            if existing_session:
                return {
                    "ok": True,
                    "book": self.storage.get_book_detail(existing_session["book_id"]) or existing_session,
                    "existing": True,
                }

        payload = self._fetch_vbook_detail_raw(url=source_url, plugin_id=plugin.plugin_id)
        detail = dict(payload.get("detail") or {})
        plugin_obj = payload.get("plugin") or plugin
        plugin_type = str(getattr(plugin_obj, "type", "") or "").strip().lower()
        locale_norm = normalize_lang_source(str(getattr(plugin_obj, "locale", "") or ""))
        lang_source = locale_norm or "zh"
        title_raw = normalize_vbook_display_text(str(detail.get("title_raw") or ""), single_line=True) or source_url
        author_raw = normalize_vbook_display_text(str(detail.get("author_raw") or ""), single_line=True)
        description_raw = normalize_vbook_display_text(str(detail.get("description_raw") or ""), single_line=False)
        title = title_raw
        author = author_raw
        summary = description_raw
        if self.is_reader_translation_enabled():
            mode = self.reader_translation_mode()
            title = self._translate_ui_text(title, single_line=True, mode=mode) or title
            author = self._translate_ui_text(author, single_line=True, mode=mode) or author
            summary = self._translate_ui_text(summary, single_line=False, mode=mode) or summary
        cover_raw = str(detail.get("cover_raw") or "").strip()
        cover = build_vbook_image_proxy_path(
            cover_raw,
            plugin_id=str(getattr(plugin_obj, "plugin_id", "") or "").strip(),
            referer=source_url,
        )
        token = uuid.uuid4().hex
        source_type = "vbook_session_comic" if ("comic" in plugin_type and history_only) else (
            "vbook_session" if history_only else (
                "vbook_comic" if "comic" in plugin_type else "vbook"
            )
        )
        state = {
            "token": token,
            "kind": "import_url",
            "source_url": source_url,
            "plugin_id": str(getattr(plugin_obj, "plugin_id", "") or "").strip(),
            "history_only": bool(history_only),
            "created_at": utc_now_iso(),
            "detail": detail,
            "preview": {
                "title": title,
                "author": author,
                "summary": summary,
                "title_raw": title_raw,
                "author_raw": author_raw,
                "summary_raw": description_raw,
                "cover": cover,
                "lang_source": lang_source,
                "source_type": source_type,
                "plugin_name": str(getattr(plugin_obj, "name", "") or "").strip(),
                "plugin_type": plugin_type,
                "source_url": source_url,
                "is_comic": "comic" in plugin_type,
            },
        }
        self._save_import_preview_state(token, state)
        return {
            "ok": True,
            "token": token,
            "existing": False,
            "preview": dict(state["preview"]),
        }

    def commit_import_url_token(self, token: str) -> dict[str, Any]:
        state = self._load_import_preview_state(token)
        if str(state.get("kind") or "").strip() != "import_url":
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Token import URL không hợp lệ.")

        source_url = str(state.get("source_url") or "").strip()
        plugin_id = str(state.get("plugin_id") or "").strip()
        history_only = bool(state.get("history_only"))
        if not source_url or not plugin_id:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu dữ liệu import URL.")

        plugin = self._require_vbook_plugin(plugin_id)
        existing_normal = self.storage.find_book_by_source(
            source_url,
            plugin.plugin_id,
            include_session=False,
        )
        if existing_normal:
            self._remove_import_preview_state(token)
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
                self._remove_import_preview_state(token)
                return self.storage.get_book_detail(existing_session["book_id"]) or existing_session

        toc_rows = self._fetch_vbook_toc(plugin, source_url)
        detail = dict(state.get("detail") or {})
        title = normalize_vbook_display_text(
            str(detail.get("title_raw") or ""),
            single_line=True,
        ) or source_url
        author = normalize_vbook_display_text(str(detail.get("author_raw") or ""), single_line=True)
        cover_path = str(detail.get("cover_raw") or "").strip()
        plugin_type = str(plugin.type or "").strip().lower()
        if history_only:
            source_type = "vbook_session_comic" if "comic" in plugin_type else "vbook_session"
        else:
            source_type = "vbook_comic" if "comic" in plugin_type else "vbook"
        summary = normalize_vbook_display_text(
            str(detail.get("description_raw") or ""),
            single_line=False,
        ) or (
            "Truyện tranh được import từ URL (vBook extension)." if "comic" in source_type else "Truyện được import từ URL (vBook extension)."
        )
        extra_link = source_url
        locale_norm = normalize_lang_source(str(plugin.locale or ""))
        lang_source = locale_norm or "zh"

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
        self._remove_import_preview_state(token)
        if not history_only:
            try:
                self.storage.remove_history_by_source(plugin_id=plugin.plugin_id, source_url=source_url)
            except Exception:
                pass
        return created

    def import_file(
        self,
        filename: str,
        file_bytes: bytes,
        lang_source: str,
        title: str,
        author: str,
        *,
        summary: str = "",
        import_settings: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        parsed = self._parse_local_import_payload(
            filename,
            file_bytes,
            lang_source=lang_source,
            title=title,
            author=author,
            summary=summary,
            import_settings=import_settings,
        )
        return self._create_book_from_local_import(parsed, file_bytes)

    def import_vbook_url(
        self,
        url: str,
        *,
        plugin_id: str | None = None,
        history_only: bool = False,
        prefetched_detail: dict[str, Any] | None = None,
        prefetched_toc: list[dict[str, Any]] | None = None,
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

        detail: dict[str, Any] = {}
        if isinstance(prefetched_detail, dict):
            detail = dict(prefetched_detail or {})
        if str(detail.get("url") or "").strip() != source_url:
            detail = {}
        if not detail:
            payload = self._fetch_vbook_detail_raw(url=source_url, plugin_id=plugin.plugin_id)
            detail = dict(payload.get("detail") or {})

        toc_rows: list[dict[str, str]] = []
        if isinstance(prefetched_toc, list):
            for row in prefetched_toc:
                if not isinstance(row, dict):
                    continue
                ch_title = normalize_vbook_display_text(
                    str(row.get("title_raw") or row.get("title") or row.get("name") or ""),
                    single_line=True,
                )
                href = str(row.get("remote_url") or row.get("url") or "").strip()
                host = str(row.get("host") or "").strip()
                remote_url = href if href.startswith(("http://", "https://")) else self._join_vbook_url(host, href)
                if not ch_title or not remote_url:
                    continue
                toc_rows.append({"name": ch_title, "remote_url": remote_url})
        if not toc_rows:
            toc_rows = self._fetch_vbook_toc(plugin, source_url)

        title = normalize_vbook_display_text(
            str(detail.get("title_raw") or detail.get("name") or detail.get("title") or ""),
            single_line=True,
        ) or source_url
        author = normalize_vbook_display_text(
            str(detail.get("author_raw") or detail.get("author") or ""),
            single_line=True,
        )
        cover_path = str(detail.get("cover_raw") or "").strip()
        if not cover_path:
            cover_candidate = str(detail.get("cover") or "").strip()
            if cover_candidate.startswith(("http://", "https://", "data:")):
                cover_path = cover_candidate
        plugin_type = str(plugin.type or "").strip().lower()
        if history_only:
            source_type = "vbook_session_comic" if "comic" in plugin_type else "vbook_session"
        else:
            source_type = "vbook_comic" if "comic" in plugin_type else "vbook"
        summary = normalize_vbook_display_text(
            str(detail.get("description_raw") or detail.get("description") or ""),
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
        return service_library_support.reload_chapter(
            self,
            chapter_id,
            api_error_cls=ApiError,
            http_status=HTTPStatus,
        )

    def _scan_vbook_image_cache_index(self) -> dict[str, int]:
        return service_library_support.scan_vbook_image_cache_index(
            vbook_image_cache_dir=VBOOK_IMAGE_CACHE_DIR,
        )

    def _vbook_image_cache_key(self, *, image_url: str, plugin_id: str = "") -> str:
        return vbook_image_cache_key(image_url=image_url, plugin_id=plugin_id)

    def _collect_book_image_cache_keys(self, book: dict[str, Any], chapters: list[dict[str, Any]]) -> set[str]:
        return service_library_support.collect_book_image_cache_keys(
            self,
            book,
            chapters,
            is_book_comic=is_book_comic,
            extract_comic_image_urls=extract_comic_image_urls,
            vbook_image_cache_key=vbook_image_cache_key,
        )

    def _clear_book_image_cache(self, book: dict[str, Any], chapters: list[dict[str, Any]]) -> dict[str, int]:
        return service_library_support.clear_book_image_cache(
            self,
            book,
            chapters,
            is_book_comic=is_book_comic,
            extract_comic_image_urls=extract_comic_image_urls,
            vbook_image_cache_key=vbook_image_cache_key,
            vbook_image_cache_dir=VBOOK_IMAGE_CACHE_DIR,
        )

    def get_cache_summary(self) -> dict[str, Any]:
        return service_library_support.get_cache_summary(
            self,
            is_book_comic=is_book_comic,
            extract_comic_image_urls=extract_comic_image_urls,
            vbook_image_cache_key=vbook_image_cache_key,
            vbook_image_cache_dir=VBOOK_IMAGE_CACHE_DIR,
        )

    def manage_cache(self, payload: dict[str, Any]) -> dict[str, Any]:
        return service_library_support.manage_cache(
            self,
            payload,
            api_error_cls=ApiError,
            http_status=HTTPStatus,
            is_book_comic=is_book_comic,
            extract_comic_image_urls=extract_comic_image_urls,
            vbook_image_cache_key=vbook_image_cache_key,
            vbook_image_cache_dir=VBOOK_IMAGE_CACHE_DIR,
        )

    def upsert_history_book(self, payload: dict[str, Any]) -> dict[str, Any]:
        return service_history_support.upsert_history_book(
            self,
            payload,
            api_error_cls=ApiError,
            http_status=HTTPStatus,
        )

    def delete_history_book(self, history_id: str) -> bool:
        return service_history_support.delete_history_book(self, history_id)

    def _reader_translation_cfg(self, cfg: dict[str, Any] | None = None) -> dict[str, Any]:
        return service_user_state_support.reader_translation_cfg(self, cfg=cfg)

    def _parse_bool(self, value: Any, default: bool = True) -> bool:
        return service_user_state_support.parse_bool(value, default)

    def _normalize_translate_mode(self, value: Any, default: str = "server") -> str:
        return service_user_state_support.normalize_translate_mode(value, default)

    def _normalized_server_translate_settings(self, value: Any = None, cfg: dict[str, Any] | None = None) -> dict[str, Any]:
        return service_user_state_support.normalized_server_translate_settings(self, value=value, cfg=cfg)

    def _normalized_global_local_dicts(self, value: Any) -> dict[str, dict[str, str]]:
        return service_user_state_support.normalized_global_local_dicts(value, normalize_name_set=normalize_name_set)

    def _normalized_reader_translation_settings(self, cfg: dict[str, Any] | None = None) -> dict[str, Any]:
        return service_user_state_support.normalized_reader_translation_settings(
            self,
            cfg,
            normalize_name_set=normalize_name_set,
            vbook_local_translate=vbook_local_translate,
        )

    def _normalized_reader_import_settings(self, cfg: dict[str, Any] | None = None) -> dict[str, Any]:
        return service_user_state_support.normalized_reader_import_settings(
            self,
            cfg,
            normalize_reader_import_settings=normalize_reader_import_settings,
        )

    def get_import_settings(self) -> dict[str, Any]:
        return service_user_state_support.get_import_settings(
            self,
            normalize_reader_import_settings=normalize_reader_import_settings,
            import_settings_presets=import_settings_presets,
        )

    def set_import_settings(self, payload: dict[str, Any]) -> dict[str, Any]:
        return service_user_state_support.set_import_settings(
            self,
            payload,
            load_app_config=load_app_config,
            save_app_config=save_app_config,
            normalize_reader_import_settings=normalize_reader_import_settings,
            import_settings_presets=import_settings_presets,
        )

    def get_reader_settings(self) -> dict[str, Any]:
        return service_user_state_support.get_reader_settings(
            self,
            normalize_name_set=normalize_name_set,
            vbook_local_translate=vbook_local_translate,
        )

    def set_reader_settings(self, payload: dict[str, Any]) -> dict[str, Any]:
        return service_user_state_support.set_reader_settings(
            self,
            payload,
            app_config_lock=_APP_CONFIG_LOCK,
            load_app_config=load_app_config,
            save_app_config=save_app_config,
            normalize_name_set=normalize_name_set,
            vbook_local_translate=vbook_local_translate,
        )

    def get_local_global_dicts(self) -> dict[str, dict[str, str]]:
        return service_user_state_support.get_local_global_dicts(
            self,
            normalize_name_set=normalize_name_set,
        )

    def set_local_global_dicts(
        self,
        *,
        name: dict[str, Any] | None = None,
        vp: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        return service_user_state_support.set_local_global_dicts(
            self,
            name=name,
            vp=vp,
            load_app_config=load_app_config,
            save_app_config=save_app_config,
            normalize_name_set=normalize_name_set,
            vbook_local_translate=vbook_local_translate,
        )

    def get_book_local_dicts(self, book_id: str) -> dict[str, Any]:
        return service_user_state_support.get_book_local_dicts(self, book_id)

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
        return service_user_state_support.update_local_dict_entry(
            self,
            dict_type=dict_type,
            scope=scope,
            source=source,
            target=target,
            delete=delete,
            book_id=book_id,
            set_name=set_name,
            api_error_cls=ApiError,
            http_status=HTTPStatus,
            contains_name_split_delimiter=contains_name_split_delimiter,
            normalize_name_set=normalize_name_set,
            load_app_config=load_app_config,
            save_app_config=save_app_config,
            vbook_local_translate=vbook_local_translate,
        )

    def get_global_junk_lines(self) -> dict[str, Any]:
        return service_user_state_support.get_global_junk_lines(self)

    def set_global_junk_lines(self, lines: Any, *, bump_version: bool = True) -> dict[str, Any]:
        return service_user_state_support.set_global_junk_lines(
            self,
            lines,
            bump_version=bump_version,
            api_error_cls=ApiError,
            http_status=HTTPStatus,
            normalize_junk_lines=normalize_junk_lines,
        )

    def update_global_junk_entry(self, *, line: str, new_line: str = "", delete: bool = False) -> dict[str, Any]:
        return service_user_state_support.update_global_junk_entry(
            self,
            line=line,
            new_line=new_line,
            delete=delete,
            api_error_cls=ApiError,
            http_status=HTTPStatus,
            normalize_newlines=normalize_newlines,
        )

    def is_reader_translation_enabled(self) -> bool:
        return bool(self.reader_translation_settings.get("enabled", True))

    def reader_translation_mode(self) -> str:
        return self._normalize_translate_mode(self.reader_translation_settings.get("mode"), "local")

    def resolve_translate_mode(self, preferred: Any = None) -> str:
        return self._normalize_translate_mode(preferred, self.reader_translation_mode())

    def translation_allowed_for_book(self, book: dict[str, Any] | None) -> bool:
        return bool(self.is_reader_translation_enabled() and book_supports_translation(book))

    def _contains_cjk_text(self, text: str) -> bool:
        return bool(re.search(r"[\u3400-\u9fff]", str(text or "")))

    def _translate_ui_text_with_dicts(
        self,
        text: str,
        *,
        single_line: bool = False,
        mode: str | None = None,
        name_set_override: dict[str, str] | None = None,
        vp_set_override: dict[str, str] | None = None,
    ) -> str:
        value = normalize_vbook_display_text(text or "", single_line=False)
        if not value:
            return ""
        if not self.is_reader_translation_enabled():
            return normalize_vbook_display_text(value, single_line=single_line)
        if not self._contains_cjk_text(value):
            return normalize_vbook_display_text(value, single_line=single_line)
        try:
            translate_mode = self.resolve_translate_mode(mode)
            detail = self.translator.translate_detailed(
                value,
                mode=translate_mode,
                name_set_override=name_set_override,
                vp_set_override=vp_set_override,
            )
            translated = normalize_vi_display_text(detail.get("translated") or "")
            return normalize_vbook_display_text(translated, single_line=single_line) or normalize_vbook_display_text(
                value,
                single_line=single_line,
            )
        except Exception:
            return normalize_vbook_display_text(value, single_line=single_line)

    def _translate_ui_text(self, text: str, *, single_line: bool = False, mode: str | None = None) -> str:
        return self._translate_ui_text_with_dicts(text, single_line=single_line, mode=mode)

    def _translate_ui_texts_batch(
        self,
        texts: list[str],
        *,
        single_line: bool = False,
        mode: str | None = None,
    ) -> list[str]:
        values = [
            normalize_vbook_display_text(text or "", single_line=False)
            for text in (texts or [])
        ]
        if not values:
            return []
        if not self.is_reader_translation_enabled():
            return [normalize_vbook_display_text(value, single_line=single_line) for value in values]

        translate_mode = self.resolve_translate_mode(mode)
        if translate_mode != "server":
            return [
                self._translate_ui_text_with_dicts(value, single_line=single_line, mode=translate_mode)
                for value in values
            ]

        outputs = [normalize_vbook_display_text(value, single_line=single_line) for value in values]
        unique_sources: list[str] = []
        seen_sources: set[str] = set()
        for value in values:
            if (not value) or (not self._contains_cjk_text(value)):
                continue
            if value in seen_sources:
                continue
            seen_sources.add(value)
            unique_sources.append(value)
        if not unique_sources:
            return outputs

        trans_sig = self.translator.translation_signature(mode="server")
        resolved: dict[str, str] = {}
        try:
            cached = self.storage.get_translation_memory_batch(unique_sources, "server", trans_sig)
        except Exception:
            cached = {}
        for source_key, translated_value in (cached or {}).items():
            normalized_source = normalize_vbook_display_text(source_key or "", single_line=False)
            if not normalized_source:
                continue
            normalized_target = normalize_vbook_display_text(
                normalize_vi_display_text(translated_value or ""),
                single_line=single_line,
            )
            if normalized_target:
                resolved[normalized_source] = normalized_target

        missing = [source for source in unique_sources if source not in resolved]
        if missing:
            translated_list: list[str]
            try:
                translated_list = translator_logic.translate_text_chunks(
                    missing,
                    name_set={},
                    settings=self.translator._settings(),
                    update_progress_callback=None,
                    target_lang="vi",
                )
            except Exception:
                translated_list = []
            to_store: list[tuple[str, str]] = []
            for idx, source_key in enumerate(missing):
                translated_piece = translated_list[idx] if idx < len(translated_list) else source_key
                translated_piece = normalize_vi_display_text(translated_piece or "")
                if (not translated_piece) or translated_piece.startswith("[Lỗi"):
                    translated_piece = source_key
                resolved[source_key] = normalize_vbook_display_text(
                    translated_piece,
                    single_line=single_line,
                ) or normalize_vbook_display_text(source_key, single_line=single_line)
                if translated_piece and translated_piece != source_key and not translated_piece.startswith("[Lỗi"):
                    to_store.append((source_key, translated_piece))
            if to_store:
                try:
                    self.storage.set_translation_memory_batch(to_store, "server", trans_sig)
                except Exception:
                    pass

        for idx, value in enumerate(values):
            if not value:
                outputs[idx] = ""
                continue
            if not self._contains_cjk_text(value):
                outputs[idx] = normalize_vbook_display_text(value, single_line=single_line)
                continue
            outputs[idx] = resolved.get(value) or normalize_vbook_display_text(value, single_line=single_line)
        return outputs

    def _apply_book_card_translation(self, item: dict[str, Any]) -> dict[str, Any]:
        return service_library_support.apply_book_card_translation(
            self,
            item,
            is_book_comic=is_book_comic,
            is_lang_zh=is_lang_zh,
            normalize_vbook_display_text=normalize_vbook_display_text,
            normalize_vi_display_text=normalize_vi_display_text,
        )

    def list_books(self) -> list[dict[str, Any]]:
        return service_library_support.list_books(
            self,
            is_book_comic=is_book_comic,
            is_lang_zh=is_lang_zh,
            normalize_vbook_display_text=normalize_vbook_display_text,
            normalize_vi_display_text=normalize_vi_display_text,
        )

    def search(self, query: str) -> dict[str, Any]:
        return service_library_support.search(
            self,
            query,
            is_book_comic=is_book_comic,
            is_lang_zh=is_lang_zh,
            normalize_vbook_display_text=normalize_vbook_display_text,
            normalize_vi_display_text=normalize_vi_display_text,
        )

    def list_history_books(self) -> list[dict[str, Any]]:
        return service_history_support.list_history_books(self)

    def _export_format_specs(self, book: dict[str, Any]) -> dict[str, Any]:
        return export_support.build_export_format_specs(
            is_comic=bool(is_book_comic(book)),
            translation_supported=bool(book_supports_translation(book)),
        )

    def _normalize_export_options(
        self,
        book: dict[str, Any],
        fmt: str,
        raw_options: dict[str, Any] | None,
    ) -> dict[str, bool]:
        specs = self._export_format_specs(book)
        try:
            return export_support.normalize_export_options(
                specs=specs,
                fmt=fmt,
                raw_options=raw_options,
                is_comic=bool(is_book_comic(book)),
                translation_supported=bool(book_supports_translation(book)),
            )
        except ValueError as exc:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", str(exc)) from exc

    def _resolve_export_metadata(self, book: dict[str, Any], raw_metadata: dict[str, Any] | None) -> dict[str, str]:
        return export_support.resolve_export_metadata(
            book=book,
            raw_metadata=raw_metadata,
            normalize_text=lambda text, single_line: normalize_vbook_display_text(text, single_line=single_line),
        )

    def _current_export_trans_sig(
        self,
        *,
        translate_mode: str,
        name_set_override: dict[str, str] | None,
        vp_set_override: dict[str, str] | None,
    ) -> str:
        base_sig = self.translator.translation_signature(
            mode=translate_mode,
            name_set_override=name_set_override,
            vp_set_override=vp_set_override,
        )
        _, junk_version = self.storage.get_global_junk_lines()
        return self.storage.chapter_trans_signature(base_sig, junk_version=junk_version)

    def build_book_export_info(
        self,
        book: dict[str, Any],
        *,
        translate_mode: str,
        name_set_override: dict[str, str] | None = None,
        vp_set_override: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        specs = self._export_format_specs(book)
        book_id = str(book.get("book_id") or "").strip()
        chapter_rows = self.storage.get_chapter_rows(book_id) if book_id else []
        chapter_row_map = {
            str(row.get("chapter_id") or "").strip(): row
            for row in chapter_rows
            if str(row.get("chapter_id") or "").strip()
        }
        translation_supported = bool(book_supports_translation(book) and (not is_book_comic(book)))
        current_sig = ""
        if translation_supported:
            current_sig = self._current_export_trans_sig(
                translate_mode=translate_mode,
                name_set_override=name_set_override,
                vp_set_override=vp_set_override,
            )

        chapter_map: dict[str, dict[str, Any]] = {}
        total = 0
        downloaded = 0
        exportable = 0
        translation_cached = 0
        translation_pending = 0
        for chapter in book.get("chapters") or []:
            if not isinstance(chapter, dict):
                continue
            cid = str(chapter.get("chapter_id") or "").strip()
            if not cid:
                continue
            total += 1
            downloaded_flag = bool(chapter.get("is_downloaded"))
            if downloaded_flag:
                downloaded += 1
            can_export = downloaded_flag
            if can_export:
                exportable += 1

            cached_translation = False
            row = chapter_row_map.get(cid) or {}
            if can_export and current_sig:
                trans_key = str(row.get("trans_key") or "").strip()
                trans_sig = str(row.get("trans_sig") or "").strip()
                if trans_key and trans_sig == current_sig and (self.storage.read_cache(trans_key) is not None):
                    cached_translation = self.storage.get_translation_unit_map_count(cid, current_sig, translate_mode) > 0
            if cached_translation:
                translation_cached += 1
            needs_translation = bool(current_sig) and can_export and (not cached_translation)
            if needs_translation:
                translation_pending += 1

            chapter_map[cid] = {
                "can_export": can_export,
                "is_downloaded": downloaded_flag,
                "translation_cached": bool(cached_translation),
                "needs_translation": bool(needs_translation),
            }

        return {
            "default_format": str(specs.get("default_format") or ""),
            "formats": list(specs.get("formats") or []),
            "download_only": True,
            "translation_mode": str(translate_mode or "server"),
            "translation_supported": bool(translation_supported),
            "translation_current_sig": current_sig,
            "counts": {
                "total_chapters": int(total),
                "downloaded_chapters": int(downloaded),
                "exportable_chapters": int(exportable),
                "missing_download_chapters": int(max(0, total - exportable)),
                "translation_cached_chapters": int(translation_cached),
                "translation_pending_chapters": int(translation_pending),
            },
            "chapter_map": chapter_map,
        }

    def _guess_export_image_ext(self, *, image_url: str, content_type: str = "") -> str:
        return export_support.guess_export_image_ext(image_url=image_url, content_type=content_type)

    def _collect_export_chapters(
        self,
        book: dict[str, Any],
        *,
        options: dict[str, bool],
        translate_mode: str,
        use_cached_only: bool,
        chapter_ids: list[str] | None = None,
        progress_callback: Callable[[dict[str, Any]], None] | None = None,
    ) -> list[dict[str, Any]]:
        chapters = self.storage.get_chapter_rows(str(book.get("book_id") or ""))
        if not chapters:
            return []
        wanted_ids = {str(x or "").strip() for x in (chapter_ids or []) if str(x or "").strip()}
        if wanted_ids:
            chapters = [row for row in chapters if str(row.get("chapter_id") or "").strip() in wanted_ids]
        if not chapters:
            return []

        _, active_name_set, _ = self.storage.get_active_name_set(
            default_sets=self._default_name_sets(),
            active_default=self._default_active_name_set(self._default_name_sets()),
            book_id=str(book.get("book_id") or ""),
        )
        active_vp_set, _ = self.storage.get_book_vp_set(str(book.get("book_id") or ""))
        use_translated_text = bool(options.get("use_translated_text")) and book_supports_translation(book)
        is_comic = bool(is_book_comic(book))
        current_sig = ""
        if use_translated_text and (not is_comic):
            current_sig = self._current_export_trans_sig(
                translate_mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )

        entries: list[dict[str, Any]] = []
        total_chapters = len(chapters)
        for idx, chapter in enumerate(chapters, start=1):
            downloaded = self._chapter_cache_available(chapter, book)
            if use_cached_only and not downloaded:
                continue
            raw_title = normalize_vbook_display_text(
                str(chapter.get("title_raw") or f"Chương {idx}"),
                single_line=True,
            ) or f"Chương {idx}"
            chapter_title = raw_title
            if use_translated_text:
                if translate_mode in {"local", "hanviet"}:
                    chapter_title = self._translate_ui_text_with_dicts(
                        raw_title,
                        single_line=True,
                        mode=translate_mode,
                        name_set_override=active_name_set,
                        vp_set_override=active_vp_set,
                    ) or raw_title
                else:
                    chapter_title = normalize_vi_display_text(chapter.get("title_vi") or "") or self._translate_ui_text(
                        raw_title,
                        single_line=True,
                        mode=translate_mode,
                    ) or raw_title
            needs_translation = False
            if use_translated_text and current_sig and downloaded:
                trans_key = str(chapter.get("trans_key") or "").strip()
                trans_sig = str(chapter.get("trans_sig") or "").strip()
                cached_trans = self.storage.read_cache(trans_key) if trans_key and trans_sig == current_sig else None
                needs_translation = not (cached_trans is not None and self.storage.get_translation_unit_map_count(
                    str(chapter.get("chapter_id") or ""),
                    current_sig,
                    translate_mode,
                ) > 0)
            if callable(progress_callback):
                try:
                    progress_callback(
                        {
                            "phase": "chapter_start",
                            "index": int(idx),
                            "total": int(total_chapters),
                            "chapter_id": str(chapter.get("chapter_id") or ""),
                            "chapter_order": int(chapter.get("chapter_order") or idx),
                            "title": chapter_title,
                            "is_downloaded": bool(downloaded),
                            "needs_translation": bool(needs_translation),
                        }
                    )
                except Exception:
                    pass

            raw_payload = self.storage.get_chapter_text(
                chapter,
                book,
                mode="raw",
                translator=self.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
                allow_remote_fetch=not use_cached_only,
            )
            comic_payload = decode_comic_payload(raw_payload) if is_comic else None
            if is_comic:
                images = [str(x).strip() for x in ((comic_payload or {}).get("images") or []) if str(x).strip()]
                if not images:
                    if use_cached_only:
                        continue
                    raise ApiError(
                        HTTPStatus.BAD_GATEWAY,
                        "EXPORT_COMIC_EMPTY",
                        "Chương truyện tranh không có ảnh để xuất.",
                        {
                            "book_id": str(book.get("book_id") or ""),
                            "chapter_id": str(chapter.get("chapter_id") or ""),
                            "chapter_order": int(chapter.get("chapter_order") or idx),
                        },
                    )
                image_entries: list[dict[str, Any]] = []
                referer = str(chapter.get("remote_url") or book.get("source_url") or "").strip()
                plugin_id = str(book.get("source_plugin") or "").strip()
                for image_idx, image_url in enumerate(images, start=1):
                    cached = self._read_vbook_image_cache(image_url=image_url, plugin_id=plugin_id)
                    if use_cached_only:
                        if cached is None:
                            image_entries = []
                            break
                        data, content_type = cached
                    else:
                        if cached is not None:
                            data, content_type = cached
                        else:
                            data, content_type = self.fetch_vbook_image(
                                image_url=image_url,
                                plugin_id=plugin_id,
                                referer=referer,
                                use_cache=True,
                            )
                    ext = self._guess_export_image_ext(image_url=image_url, content_type=content_type)
                    image_entries.append(
                        {
                            "index": image_idx,
                            "url": image_url,
                            "content_type": content_type,
                            "data": data,
                            "ext": ext,
                        }
                    )
                if not image_entries:
                    continue
                entries.append(
                    {
                        "chapter_id": str(chapter.get("chapter_id") or ""),
                        "chapter_order": int(chapter.get("chapter_order") or idx),
                        "title": chapter_title,
                        "title_raw": raw_title,
                        "images": image_entries,
                        "is_downloaded": bool(downloaded),
                    }
                )
                if callable(progress_callback):
                    try:
                        progress_callback(
                            {
                                "phase": "chapter_done",
                                "index": int(idx),
                                "total": int(total_chapters),
                                "chapter_id": str(chapter.get("chapter_id") or ""),
                                "chapter_order": int(chapter.get("chapter_order") or idx),
                                "title": chapter_title,
                                "is_downloaded": bool(downloaded),
                                "needs_translation": False,
                            }
                        )
                    except Exception:
                        pass
                continue

            text_mode = "trans" if use_translated_text else "raw"
            text_value = self.storage.get_chapter_text(
                chapter,
                book,
                mode=text_mode,
                translator=self.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
                allow_remote_fetch=not use_cached_only,
            )
            if not text_value.strip():
                if use_cached_only:
                    continue
                raise ApiError(
                    HTTPStatus.BAD_GATEWAY,
                    "EXPORT_TEXT_EMPTY",
                    "Chương không có nội dung để xuất.",
                    {
                        "book_id": str(book.get("book_id") or ""),
                        "chapter_id": str(chapter.get("chapter_id") or ""),
                        "chapter_order": int(chapter.get("chapter_order") or idx),
                    },
                )
            entries.append(
                {
                    "chapter_id": str(chapter.get("chapter_id") or ""),
                    "chapter_order": int(chapter.get("chapter_order") or idx),
                    "title": chapter_title,
                    "title_raw": raw_title,
                    "text": normalize_newlines(text_value),
                    "is_downloaded": bool(downloaded),
                }
            )
            if callable(progress_callback):
                try:
                    progress_callback(
                        {
                            "phase": "chapter_done",
                            "index": int(idx),
                            "total": int(total_chapters),
                            "chapter_id": str(chapter.get("chapter_id") or ""),
                            "chapter_order": int(chapter.get("chapter_order") or idx),
                            "title": chapter_title,
                            "is_downloaded": bool(downloaded),
                            "needs_translation": bool(needs_translation),
                        }
                    )
                except Exception:
                    pass
        return entries

    def _render_export_intro_html(self, metadata: dict[str, str]) -> str:
        return export_support.render_export_intro_html(metadata)

    def _build_export_toc_html(
        self,
        chapters: list[dict[str, Any]],
        *,
        link_builder: Callable[[dict[str, Any]], str],
    ) -> str:
        return export_support.build_export_toc_html(chapters, link_builder=link_builder)

    def _wrap_export_html_document(self, title: str, body: str) -> str:
        return export_support.wrap_export_html_document(title, body)

    def _create_export_txt(
        self,
        *,
        metadata: dict[str, str],
        chapters: list[dict[str, Any]],
        options: dict[str, bool],
    ) -> Path:
        return export_support.create_export_txt(
            export_dir=EXPORT_DIR,
            safe_name=self.storage._safe_filename(metadata["title"]),
            metadata=metadata,
            chapters=chapters,
            options=options,
            safe_filename=self.storage._safe_filename,
        )

    def _create_export_html(
        self,
        *,
        metadata: dict[str, str],
        chapters: list[dict[str, Any]],
        options: dict[str, bool],
        is_comic: bool,
    ) -> Path:
        return export_support.create_export_html(
            export_dir=EXPORT_DIR,
            safe_name=self.storage._safe_filename(metadata["title"]),
            metadata=metadata,
            chapters=chapters,
            options=options,
            is_comic=is_comic,
            safe_filename=self.storage._safe_filename,
        )

    def _create_export_cbz(
        self,
        *,
        metadata: dict[str, str],
        chapters: list[dict[str, Any]],
    ) -> Path:
        return export_support.create_export_cbz(
            export_dir=EXPORT_DIR,
            safe_name=self.storage._safe_filename(metadata["title"]),
            metadata=metadata,
            chapters=chapters,
        )

    def _create_export_epub(
        self,
        *,
        metadata: dict[str, str],
        chapters: list[dict[str, Any]],
        options: dict[str, bool],
        is_comic: bool,
        lang_source: str,
    ) -> Path:
        language = "vi" if bool(options.get("use_translated_text")) else (normalize_lang_source(lang_source) or "zh")
        return export_support.create_export_epub(
            export_dir=EXPORT_DIR,
            safe_name=self.storage._safe_filename(metadata["title"]),
            metadata=metadata,
            chapters=chapters,
            options=options,
            is_comic=is_comic,
            language=language,
        )

    def export_book(
        self,
        *,
        book_id: str,
        fmt: str,
        translation_mode: str,
        metadata: dict[str, Any] | None = None,
        options: dict[str, Any] | None = None,
        use_cached_only: bool = False,
    ) -> Path:
        book = self.storage.find_book(book_id)
        if not book:
            raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        fmt_norm = str(fmt or "").strip().lower()
        normalized_options = self._normalize_export_options(book, fmt_norm, options)
        export_metadata = self._resolve_export_metadata(book, metadata)
        chapters = self._collect_export_chapters(
            book,
            options=normalized_options,
            translate_mode=self.resolve_translate_mode(translation_mode),
            use_cached_only=bool(use_cached_only),
        )
        if not chapters:
            raise ApiError(
                HTTPStatus.BAD_REQUEST,
                "EXPORT_EMPTY",
                "Không có chương phù hợp để xuất với lựa chọn hiện tại.",
            )
        if fmt_norm == "txt":
            if is_book_comic(book):
                raise ApiError(
                    HTTPStatus.BAD_REQUEST,
                    "COMIC_EXPORT_TXT_NOT_SUPPORTED",
                    "Truyện tranh không hỗ trợ xuất TXT.",
                )
            return self._create_export_txt(
                metadata=export_metadata,
                chapters=chapters,
                options=normalized_options,
            )
        if fmt_norm == "html":
            return self._create_export_html(
                metadata=export_metadata,
                chapters=chapters,
                options=normalized_options,
                is_comic=is_book_comic(book),
            )
        if fmt_norm == "cbz":
            if not is_book_comic(book):
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "CBZ chỉ hỗ trợ cho truyện tranh.")
            return self._create_export_cbz(
                metadata=export_metadata,
                chapters=chapters,
            )
        if fmt_norm == "epub":
            return self._create_export_epub(
                metadata=export_metadata,
                chapters=chapters,
                options=normalized_options,
                is_comic=is_book_comic(book),
                lang_source=str(book.get("lang_source") or ""),
            )
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Định dạng export không hợp lệ.")

    def _export_status_is_active(self, status: str) -> bool:
        return export_jobs_support.export_status_is_active(status)

    def _export_status_is_final(self, status: str) -> bool:
        return export_jobs_support.export_status_is_final(status)

    def _export_file_path_for_job_locked(self, job: dict[str, Any]) -> Path | None:
        return export_jobs_support.resolve_export_job_file_path(job, export_dir=EXPORT_DIR)

    def _export_job_state_payload_locked(self, job: dict[str, Any]) -> dict[str, Any]:
        return export_jobs_support.build_export_job_state_payload(job)

    def _persist_export_jobs_locked(self) -> None:
        items = [self._export_job_state_payload_locked(job) for job in self._export_jobs.values()]
        items.sort(key=lambda x: (str(x.get("created_at") or ""), str(x.get("job_id") or "")))
        self.storage.save_export_jobs_state(items)

    def _load_export_jobs_state_locked(self) -> None:
        self._export_jobs = {}
        self._export_queue = []
        self._export_running_job_id = None
        now = utc_now_iso()
        loaded = self.storage.load_export_jobs_state()
        self._export_jobs, changed = export_jobs_support.restore_export_jobs_state(loaded, now_iso=now)
        self._cleanup_export_jobs_locked()
        if changed or loaded:
            self._persist_export_jobs_locked()

    def _cleanup_export_jobs_locked(self) -> None:
        changed, next_running_job_id = export_jobs_support.cleanup_export_jobs_state(
            self._export_jobs,
            self._export_queue,
            self._export_running_job_id,
            export_dir=EXPORT_DIR,
            keep_days=EXPORT_JOB_RETENTION_DAYS,
            parse_iso_ts=parse_iso_ts,
        )
        self._export_running_job_id = next_running_job_id
        if changed:
            self._persist_export_jobs_locked()

    def _serialize_export_job_locked(self, job: dict[str, Any], queue_positions: dict[str, int] | None = None) -> dict[str, Any]:
        return export_jobs_support.serialize_export_job(
            job,
            export_dir=EXPORT_DIR,
            quote_url_path=quote_url_path,
            queue_positions=queue_positions,
        )

    def _build_export_jobs_signature_locked(self, items: list[dict[str, Any]]) -> str:
        return export_jobs_support.build_export_jobs_signature(items)

    def _list_export_jobs_locked(self, *, book_id: str | None = None) -> dict[str, Any]:
        self._cleanup_export_jobs_locked()
        return export_jobs_support.build_export_jobs_listing(
            self._export_jobs,
            self._export_queue,
            export_dir=EXPORT_DIR,
            book_id=book_id,
            parse_iso_ts=parse_iso_ts,
            quote_url_path=quote_url_path,
            generated_at=utc_now_iso(),
        )

    def list_export_jobs(self, *, book_id: str | None = None) -> dict[str, Any]:
        with self._export_cv:
            return self._list_export_jobs_locked(book_id=book_id)

    def wait_export_jobs(
        self,
        *,
        last_sig: str,
        book_id: str | None = None,
        timeout_sec: float = 20.0,
    ) -> dict[str, Any]:
        with self._export_cv:
            return queue_runtime_support.wait_for_listing_change(
                cv=self._export_cv,
                build_payload=lambda: self._list_export_jobs_locked(book_id=book_id),
                last_sig=last_sig,
                timeout_sec=timeout_sec,
                wait_slice_sec=0.5,
            )

    def _export_start_worker_locked(self) -> None:
        self._export_worker_started, self._export_worker_thread = queue_runtime_support.start_worker_thread(
            worker_started=self._export_worker_started,
            worker_thread=self._export_worker_thread,
            target=self._export_worker_loop,
            name="ReaderExportWorker",
        )

    def _create_export_job_locked(
        self,
        *,
        book: dict[str, Any],
        fmt: str,
        format_label: str,
        translation_mode: str,
        metadata: dict[str, Any],
        options: dict[str, Any],
        chapter_ids: list[str],
        translation_pending_chapters: int,
    ) -> dict[str, Any]:
        now = utc_now_iso()
        book_id = str(book.get("book_id") or "").strip()
        seed = f"{book_id}|{fmt}|{translation_mode}|{now}|{uuid.uuid4().hex}"
        job_id = f"ex_{hash_text(seed)}"
        job = export_jobs_support.create_export_job(
            job_id=job_id,
            book_id=book_id,
            book_title=normalize_vbook_display_text(str(book.get("title_display") or book.get("title") or ""), single_line=True),
            fmt=fmt,
            format_label=format_label,
            translation_mode=translation_mode,
            metadata=metadata,
            options=options,
            chapter_ids=chapter_ids,
            translation_pending_chapters=translation_pending_chapters,
            created_at=now,
        )
        self._export_jobs[job_id] = job
        self._export_queue.append(job_id)
        self._persist_export_jobs_locked()
        self._export_start_worker_locked()
        self._export_cv.notify_all()
        return job

    def enqueue_book_export(self, book_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        bid = str(book_id or "").strip()
        if not bid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
        body = payload if isinstance(payload, dict) else {}
        book = self.storage.get_book_detail(bid)
        if not book:
            raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        fmt_norm = str(body.get("format") or "txt").strip().lower() or "txt"
        translate_mode = self.resolve_translate_mode(body.get("translation_mode"))
        metadata = dict(body.get("metadata") or {}) if isinstance(body.get("metadata"), dict) else {}
        options_raw = dict(body.get("options") or {}) if isinstance(body.get("options"), dict) else {}
        normalized_options = self._normalize_export_options(book, fmt_norm, options_raw)
        normalized_options["use_cached_only"] = True
        if fmt_norm == "txt" and is_book_comic(book):
            raise ApiError(HTTPStatus.BAD_REQUEST, "COMIC_EXPORT_TXT_NOT_SUPPORTED", "Truyện tranh không hỗ trợ xuất TXT.")
        if fmt_norm == "cbz" and (not is_book_comic(book)):
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "CBZ chỉ hỗ trợ cho truyện tranh.")

        _, active_name_set, _ = self.storage.get_active_name_set(
            default_sets=self._default_name_sets(),
            active_default=self._default_active_name_set(self._default_name_sets()),
            book_id=bid,
        )
        active_vp_set, _ = self.storage.get_book_vp_set(bid)
        export_info = self.build_book_export_info(
            book,
            translate_mode=translate_mode,
            name_set_override=active_name_set,
            vp_set_override=active_vp_set,
        )
        chapter_map = export_info.get("chapter_map") or {}
        chapter_ids = [
            cid for cid, info in chapter_map.items()
            if isinstance(info, dict) and bool(info.get("can_export"))
        ]
        if not chapter_ids:
            raise ApiError(
                HTTPStatus.BAD_REQUEST,
                "EXPORT_NO_DOWNLOADED_CHAPTERS",
                "Chưa có chương nào đã tải. Hãy tải chương trước khi xuất.",
            )

        format_label = fmt_norm.upper()
        for item in export_info.get("formats") or []:
            if str((item or {}).get("id") or "").strip().lower() == fmt_norm:
                format_label = str((item or {}).get("label") or format_label)
                break
        counts = export_info.get("counts") or {}
        pending_translation = int(counts.get("translation_pending_chapters") or 0) if bool(normalized_options.get("use_translated_text")) else 0
        with self._export_cv:
            self._cleanup_export_jobs_locked()
            job = self._create_export_job_locked(
                book=book,
                fmt=fmt_norm,
                format_label=format_label,
                translation_mode=translate_mode,
                metadata=metadata,
                options=normalized_options,
                chapter_ids=chapter_ids,
                translation_pending_chapters=pending_translation,
            )
            return {"ok": True, "job": self._serialize_export_job_locked(job)}

    def delete_export_job(self, job_id: str) -> dict[str, Any]:
        jid = str(job_id or "").strip()
        if not jid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu job_id.")
        with self._export_cv:
            self._cleanup_export_jobs_locked()
            job = self._export_jobs.get(jid)
            if not job:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy job export.")
            status = str(job.get("status") or "").strip().lower()
            if self._export_status_is_active(status):
                raise ApiError(HTTPStatus.BAD_REQUEST, "EXPORT_JOB_ACTIVE", "Không thể xóa job export đang chạy.")
            file_path = self._export_file_path_for_job_locked(job)
            if file_path and file_path.exists():
                try:
                    file_path.unlink()
                except Exception as exc:
                    raise ApiError(HTTPStatus.INTERNAL_SERVER_ERROR, "EXPORT_DELETE_FAILED", f"Không xóa được file export: {exc}") from exc
            self._export_jobs.pop(jid, None)
            self._persist_export_jobs_locked()
            self._export_cv.notify_all()
            return {"ok": True, "job_id": jid}

    def _run_export_job(self, job_id: str) -> None:
        with self._export_cv:
            job = self._export_jobs.get(job_id)
            if not job:
                return
            started_at = utc_now_iso()
            export_jobs_support.mark_export_job_running(job, started_at=started_at)
            self._persist_export_jobs_locked()
            self._export_cv.notify_all()

        try:
            with self._export_cv:
                job = self._export_jobs.get(job_id)
                if not job:
                    return
                request, book = export_execute_support.load_export_job_context(
                    job,
                    resolve_translate_mode=self.resolve_translate_mode,
                    find_book=self.storage.find_book,
                )

            def on_progress(event: dict[str, Any]) -> None:
                with self._export_cv:
                    job2 = self._export_jobs.get(job_id)
                    if not job2:
                        return
                    export_jobs_support.apply_export_progress(job2, event=event, updated_at=utc_now_iso())
                    self._export_cv.notify_all()

            output, completed_chapters = export_execute_support.execute_export_request(
                request=request,
                book=book,
                collect_export_chapters=self._collect_export_chapters,
                resolve_export_metadata=self._resolve_export_metadata,
                create_export_file=lambda **kwargs: export_runtime_support.create_export_file(
                    create_txt=self._create_export_txt,
                    create_html=self._create_export_html,
                    create_cbz=self._create_export_cbz,
                    create_epub=self._create_export_epub,
                    **kwargs,
                ),
                is_book_comic=is_book_comic,
                progress_callback=on_progress,
            )

            finished_at = utc_now_iso()
            expires_at = (datetime.now(timezone.utc) + timedelta(days=max(1, int(EXPORT_JOB_RETENTION_DAYS)))).isoformat()
            with self._export_cv:
                job2 = self._export_jobs.get(job_id)
                if not job2:
                    return
                export_jobs_support.complete_export_job(
                    job2,
                    output_path=output,
                    finished_at=finished_at,
                    expires_at=expires_at,
                    completed_chapters=completed_chapters,
                )
                self._persist_export_jobs_locked()
                self._export_cv.notify_all()
        except LookupError as exc:
            with self._export_cv:
                job2 = self._export_jobs.get(job_id)
                if not job2:
                    return
                export_jobs_support.fail_export_job(
                    job2,
                    message=str(exc) or "Xuất file thất bại.",
                    finished_at=utc_now_iso(),
                )
                self._persist_export_jobs_locked()
                self._export_cv.notify_all()
        except ApiError as exc:
            with self._export_cv:
                job2 = self._export_jobs.get(job_id)
                if not job2:
                    return
                export_jobs_support.fail_export_job(
                    job2,
                    message=str(exc.message or "Xuất file thất bại."),
                    finished_at=utc_now_iso(),
                )
                self._persist_export_jobs_locked()
                self._export_cv.notify_all()
        except Exception as exc:
            with self._export_cv:
                job2 = self._export_jobs.get(job_id)
                if not job2:
                    return
                export_jobs_support.fail_export_job(
                    job2,
                    message=str(exc) or "Xuất file thất bại.",
                    finished_at=utc_now_iso(),
                )
                self._persist_export_jobs_locked()
                self._export_cv.notify_all()

    def _export_worker_loop(self) -> None:
        while True:
            with self._export_cv:
                job_id, job = queue_runtime_support.wait_for_next_queued_job(
                    cv=self._export_cv,
                    cleanup=self._cleanup_export_jobs_locked,
                    queue=self._export_queue,
                    jobs=self._export_jobs,
                    idle_wait_sec=1.0,
                )
                if not job_id or not job:
                    continue
                self._export_running_job_id = job_id
            try:
                self._run_export_job(job_id)
            finally:
                with self._export_cv:
                    if self._export_running_job_id == job_id:
                        self._export_running_job_id = None
                    self._cleanup_export_jobs_locked()
                    self._export_cv.notify_all()

    def _download_status_is_active(self, status: str) -> bool:
        return download_jobs_support.download_status_is_active(status)

    def _download_status_is_final(self, status: str) -> bool:
        return download_jobs_support.download_status_is_final(status)

    def _download_start_worker_locked(self) -> None:
        self._download_worker_started, self._download_worker_thread = queue_runtime_support.start_worker_thread(
            worker_started=self._download_worker_started,
            worker_thread=self._download_worker_thread,
            target=self._download_worker_loop,
            name="ReaderDownloadWorker",
        )

    def _download_parse_ts(self, value: Any) -> float:
        return download_jobs_support.parse_download_job_ts(value)

    def _refresh_download_job_counts_locked(self, job: dict[str, Any]) -> None:
        download_jobs_support.refresh_download_job_counts(
            job,
            get_book_download_map=self.storage.get_book_download_map,
        )

    def _serialize_download_job_locked(self, job: dict[str, Any], queue_positions: dict[str, int] | None = None) -> dict[str, Any]:
        return download_jobs_support.serialize_download_job(
            job,
            queue_positions=queue_positions,
        )

    def _cleanup_download_jobs_locked(self) -> None:
        changed, next_running_job_id = download_jobs_support.cleanup_download_jobs_state(
            self._download_jobs,
            self._download_queue,
            self._download_running_job_id,
            parse_ts=self._download_parse_ts,
            now_ts=time.time(),
            keep_seconds=180.0,
        )
        if changed:
            self._download_running_job_id = next_running_job_id

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
        job = download_jobs_support.create_download_job(
            job_id=job_id,
            job_type=job_type,
            book_id=book_id,
            book_title=normalize_vbook_display_text(str(book.get("title_display") or book.get("title") or ""), single_line=True),
            source_plugin=str(book.get("source_plugin") or ""),
            source_type=str(book.get("source_type") or ""),
            chapter_ids=chapter_ids,
            message=message,
            created_at=now,
        )
        self._refresh_download_job_counts_locked(job)
        self._download_jobs[job_id] = job
        self._download_queue.append(job_id)
        self._download_start_worker_locked()
        self._download_cv.notify_all()
        return job

    def _build_download_jobs_signature_locked(self, items: list[dict[str, Any]]) -> str:
        return download_jobs_support.build_download_jobs_signature(items)

    def _list_download_jobs_locked(self, *, active_only: bool = True, book_id: str | None = None) -> dict[str, Any]:
        self._cleanup_download_jobs_locked()
        return download_jobs_support.build_download_jobs_listing(
            self._download_jobs,
            self._download_queue,
            refresh_job_counts=self._refresh_download_job_counts_locked,
            active_only=active_only,
            book_id=book_id,
            generated_at=utc_now_iso(),
        )

    def list_download_jobs(self, *, active_only: bool = True, book_id: str | None = None) -> dict[str, Any]:
        with self._download_cv:
            return self._list_download_jobs_locked(active_only=active_only, book_id=book_id)

    def wait_download_jobs(
        self,
        *,
        last_sig: str,
        active_only: bool = True,
        book_id: str | None = None,
        timeout_sec: float = 20.0,
    ) -> dict[str, Any]:
        with self._download_cv:
            return queue_runtime_support.wait_for_listing_change(
                cv=self._download_cv,
                build_payload=lambda: self._list_download_jobs_locked(active_only=active_only, book_id=book_id),
                last_sig=last_sig,
                timeout_sec=timeout_sec,
                wait_slice_sec=0.5,
            )

    def _download_pick_chapters_by_range(
        self,
        chapter_rows: list[dict[str, Any]],
        *,
        chapter_ids: list[str] | None = None,
        start_order: int | None = None,
        end_order: int | None = None,
    ) -> list[str]:
        return download_jobs_support.pick_download_chapters_by_range(
            chapter_rows,
            chapter_ids=chapter_ids,
            start_order=start_order,
            end_order=end_order,
        )

    def _find_active_download_job_locked(self, *, book_id: str, chapter_ids: list[str]) -> dict[str, Any] | None:
        return download_jobs_support.find_active_download_job(
            self._download_jobs,
            book_id=book_id,
            chapter_ids=chapter_ids,
            refresh_job_counts=self._refresh_download_job_counts_locked,
        )

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
            download_jobs_support.request_stop_download_job(job, updated_at=now)
            if status == "queued":
                self._download_queue = [x for x in self._download_queue if x != jid]
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
                now = utc_now_iso()
                download_jobs_support.request_stop_download_job(job, updated_at=now)
                stopped += 1
            if stopped:
                active_ids = {jid for jid, j in self._download_jobs.items() if self._download_status_is_active(str(j.get("status") or ""))}
                self._download_queue = [x for x in self._download_queue if x in active_ids]
        return stopped

    def _chapter_raw_cache_has_payload(self, raw_text: str, *, is_comic: bool) -> bool:
        return chapter_raw_cache_has_payload(raw_text, is_comic=is_comic)

    def _chapter_cache_available(self, chapter: dict[str, Any], book: dict[str, Any]) -> bool:
        raw_key = str((chapter or {}).get("raw_key") or "").strip()
        return self.storage.chapter_cache_available_by_key(raw_key=raw_key, book=book)

    def _set_download_chapter_progress_message(self, job_id: str, chapter_id: str, chapter_order: int, retry_index: int) -> None:
        jid = str(job_id or "").strip()
        if not jid:
            return
        with self._download_cv:
            job = self._download_jobs.get(jid)
            if not job:
                return
            download_jobs_support.set_download_chapter_progress(
                job,
                chapter_id=chapter_id,
                chapter_order=chapter_order,
                retry_index=retry_index,
                updated_at=utc_now_iso(),
            )
            self._download_cv.notify_all()

    def _download_fetch_one_chapter(
        self,
        chapter: dict[str, Any],
        book: dict[str, Any],
        stop_event: threading.Event,
        *,
        retry_count: int = 0,
        retry_delay_sec: float = 0.25,
        on_attempt: Callable[[int], None] | None = None,
    ) -> tuple[bool, str]:
        return download_runtime_support.fetch_one_chapter(
            chapter,
            book,
            stop_event,
            retry_count=retry_count,
            retry_delay_sec=retry_delay_sec,
            on_attempt=on_attempt,
            chapter_cache_available=self._chapter_cache_available,
            fetch_remote_chapter=self._fetch_remote_chapter,
        )

    def _ensure_download_stop_event(self, job: dict[str, Any]) -> threading.Event:
        stop_event = job.get("_stop_event")
        if not isinstance(stop_event, threading.Event):
            stop_event = threading.Event()
            job["_stop_event"] = stop_event
        return stop_event

    def _run_download_job(self, job_id: str) -> None:
        with self._download_cv:
            job = self._download_jobs.get(job_id)
            if not job:
                return
        try:
            context = download_execute_support.build_download_job_context(
                job,
                find_book=self.storage.find_book,
                get_chapter_rows=self.storage.get_chapter_rows,
                resolve_runtime_plan=lambda book: download_runtime_support.resolve_download_runtime(
                    runtime_cfg=self._effective_vbook_runtime_settings(str(book.get("source_plugin") or "").strip()),
                    source_type=str(book.get("source_type") or ""),
                ),
                ensure_stop_event=self._ensure_download_stop_event,
                chapter_cache_available=self._chapter_cache_available,
            )
        except LookupError:
            with self._download_cv:
                job2 = self._download_jobs.get(job_id)
                if not job2:
                    return
                download_jobs_support.mark_download_job_missing_book(job2, updated_at=utc_now_iso())
            return
        except ValueError:
            with self._download_cv:
                job2 = self._download_jobs.get(job_id)
                if not job2:
                    return
                download_jobs_support.mark_download_job_no_valid_chapters(job2, updated_at=utc_now_iso())
            return

        book = dict(context.get("book") or {})
        pending_rows = list(context.get("pending_rows") or [])
        stop_event = context.get("stop_event")
        runtime_plan = dict(context.get("runtime_plan") or {})
        thread_count = int(runtime_plan.get("thread_count") or 1)
        retry_count = int(runtime_plan.get("retry_count") or 0)
        retry_sleep_sec = float(runtime_plan.get("retry_sleep_sec") or 0.25)

        with self._download_cv:
            job2 = self._download_jobs.get(job_id)
            if job2:
                download_jobs_support.mark_download_job_preparing(job2, updated_at=utc_now_iso())
                self._refresh_download_job_counts_locked(job2)
        if not pending_rows:
            with self._download_cv:
                job2 = self._download_jobs.get(job_id)
                if job2:
                    download_jobs_support.mark_download_job_all_cached(job2, updated_at=utc_now_iso())
                    self._refresh_download_job_counts_locked(job2)
            return

        def on_attempt(row: dict[str, Any], attempt_idx: int) -> None:
            self._set_download_chapter_progress_message(
                job_id,
                str(row.get("chapter_id") or ""),
                int(row.get("chapter_order") or 0),
                int(attempt_idx),
            )

        def on_row_settled(row: dict[str, Any]) -> None:
            cid = str(row.get("chapter_id") or "").strip()
            with self._download_cv:
                job2 = self._download_jobs.get(job_id)
                if job2:
                    job2["current_chapter_id"] = cid
                    job2["updated_at"] = utc_now_iso()

        def on_row_result(row: dict[str, Any], ok: bool, err: str, failed_count: int) -> None:
            if (not ok) and (not stop_event.is_set()):
                with self._download_cv:
                    job2 = self._download_jobs.get(job_id)
                    if job2:
                        job2["last_error"] = str(err or "")
            with self._download_cv:
                job2 = self._download_jobs.get(job_id)
                if job2:
                    self._refresh_download_job_counts_locked(job2)
                    job2["failed_chapters"] = int(failed_count)
                    job2["updated_at"] = utc_now_iso()

        failed = download_batch_support.run_download_batch(
            pending_rows=pending_rows,
            book=book,
            stop_event=stop_event,
            thread_count=thread_count,
            retry_count=retry_count,
            retry_sleep_sec=retry_sleep_sec,
            fetch_one_chapter=self._download_fetch_one_chapter,
            on_attempt=on_attempt,
            on_row_settled=on_row_settled,
            on_row_result=on_row_result,
        )

        with self._download_cv:
            job2 = self._download_jobs.get(job_id)
            if not job2:
                return
            now = utc_now_iso()
            self._refresh_download_job_counts_locked(job2)
            total = int(job2.get("total_chapters") or 0)
            downloaded = int(job2.get("downloaded_chapters") or 0)
            download_jobs_support.finalize_download_job(
                job2,
                updated_at=now,
                downloaded_chapters=downloaded,
                total_chapters=total,
                failed_chapters=failed,
                stopped=bool(stop_event.is_set()),
            )

    def _download_worker_loop(self) -> None:
        while True:
            with self._download_cv:
                job_id, job = queue_runtime_support.wait_for_next_queued_job(
                    cv=self._download_cv,
                    cleanup=self._cleanup_download_jobs_locked,
                    queue=self._download_queue,
                    jobs=self._download_jobs,
                    idle_wait_sec=1.0,
                )
                if not job_id or not job:
                    continue
                download_jobs_support.mark_download_job_running(job, started_at=utc_now_iso())
                self._download_running_job_id = job_id
            try:
                self._run_download_job(job_id)
            except Exception as exc:
                with self._download_cv:
                    job = self._download_jobs.get(job_id)
                    if job:
                        download_jobs_support.fail_download_job(
                            job,
                            message=str(exc) or "Lỗi tải chương.",
                            updated_at=utc_now_iso(),
                        )
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

    def _normalize_vbook_plugin_url(self, value: str) -> str:
        raw = str(value or "").strip()
        if not raw:
            return ""
        try:
            parsed = urlparse(raw)
            if parsed.scheme and parsed.netloc:
                path = re.sub(r"/{2,}", "/", parsed.path or "")
                if path.endswith("/"):
                    path = path[:-1]
                query_pairs = parse_qs(parsed.query, keep_blank_values=True)
                query_flat: list[tuple[str, str]] = []
                for key in sorted(query_pairs.keys()):
                    values = query_pairs.get(key) or [""]
                    for val in sorted(str(v) for v in values):
                        query_flat.append((str(key), val))
                query = "&".join(f"{quote(str(k), safe='')}={quote(str(v), safe='')}" for k, v in query_flat)
                return f"{parsed.scheme.lower()}://{parsed.netloc.lower()}{path}{('?' + query) if query else ''}"
        except Exception:
            pass
        return raw.rstrip("/")

    def _vbook_version_to_int(self, value: Any) -> int | None:
        if value is None:
            return None
        if isinstance(value, bool):
            return int(value)
        if isinstance(value, (int, float)):
            return int(value)
        text = str(value).strip()
        if not text:
            return None
        if text.isdigit() or (text.startswith("-") and text[1:].isdigit()):
            try:
                return int(text)
            except Exception:
                return None
        return None

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

    def _normalized_vbook_install_registry(self, raw_cfg: dict[str, Any] | None = None) -> dict[str, dict[str, Any]]:
        vcfg = raw_cfg if isinstance(raw_cfg, dict) else self._vbook_cfg()
        payload = vcfg.get("plugin_install_registry")
        if not isinstance(payload, dict):
            return {}
        out: dict[str, dict[str, Any]] = {}
        for raw_pid, raw_item in payload.items():
            pid = self._normalize_vbook_plugin_id(str(raw_pid or ""))
            if not pid:
                continue
            item = raw_item if isinstance(raw_item, dict) else {}
            plugin_url = self._normalize_vbook_plugin_url(str(item.get("plugin_url") or ""))
            repo_url = self._normalize_vbook_plugin_url(str(item.get("repo_url") or ""))
            version = self._vbook_version_to_int(item.get("version"))
            recorded_at = str(item.get("recorded_at") or "").strip()
            out[pid] = {
                "plugin_url": plugin_url,
                "repo_url": repo_url,
                "version": version,
                "recorded_at": recorded_at,
            }
        return out

    def _save_vbook_install_registry(self, registry: dict[str, dict[str, Any]]) -> None:
        cfg = load_app_config()
        if not isinstance(cfg, dict):
            cfg = {}
        vcfg = cfg.get("vbook")
        if not isinstance(vcfg, dict):
            vcfg = {}
        normalized: dict[str, dict[str, Any]] = {}
        for raw_pid, raw_item in (registry or {}).items():
            pid = self._normalize_vbook_plugin_id(str(raw_pid or ""))
            if not pid:
                continue
            item = raw_item if isinstance(raw_item, dict) else {}
            normalized[pid] = {
                "plugin_url": self._normalize_vbook_plugin_url(str(item.get("plugin_url") or "")),
                "repo_url": self._normalize_vbook_plugin_url(str(item.get("repo_url") or "")),
                "version": self._vbook_version_to_int(item.get("version")),
                "recorded_at": str(item.get("recorded_at") or "").strip() or utc_now_iso(),
            }
        vcfg["plugin_install_registry"] = normalized
        cfg["vbook"] = vcfg
        save_app_config(cfg)
        self.refresh_config()

    def _record_vbook_plugin_install(self, plugin: Any, *, plugin_url: str = "", repo_url: str = "") -> None:
        pid = self._normalize_vbook_plugin_id(str(getattr(plugin, "plugin_id", "") or ""))
        if not pid:
            return
        normalized_plugin_url = self._normalize_vbook_plugin_url(plugin_url)
        normalized_repo_url = self._normalize_vbook_plugin_url(repo_url)
        current = dict(self.vbook_plugin_install_registry or {})
        prev = current.get(pid) if isinstance(current.get(pid), dict) else {}
        current[pid] = {
            "plugin_url": normalized_plugin_url or self._normalize_vbook_plugin_url(str(prev.get("plugin_url") or "")),
            "repo_url": normalized_repo_url or self._normalize_vbook_plugin_url(str(prev.get("repo_url") or "")),
            "version": self._vbook_version_to_int(getattr(plugin, "version", None)),
            "recorded_at": utc_now_iso(),
        }
        self._save_vbook_install_registry(current)

    def _find_vbook_plugin_id_by_install_url(self, plugin_url: str) -> str:
        normalized_url = self._normalize_vbook_plugin_url(plugin_url)
        if not normalized_url:
            return ""
        registry = self.vbook_plugin_install_registry or {}
        for raw_pid, entry in registry.items():
            pid = self._normalize_vbook_plugin_id(raw_pid)
            if (not pid) or (not isinstance(entry, dict)):
                continue
            installed_url = self._normalize_vbook_plugin_url(str(entry.get("plugin_url") or ""))
            if installed_url and installed_url == normalized_url:
                return pid
        return ""

    def _drop_vbook_plugin_state(self, plugin_id: str) -> None:
        pid = self._normalize_vbook_plugin_id(plugin_id)
        if not pid:
            return
        try:
            shutil.rmtree(self._vbook_plugin_storage_dir(pid), ignore_errors=True)
        except Exception:
            pass
        try:
            # Legacy flat file path from the initial implementation.
            (self._vbook_local_storage_root() / f"{pid}.json").unlink(missing_ok=True)
        except Exception:
            pass
        cfg = load_app_config()
        if not isinstance(cfg, dict):
            cfg = {}
        vcfg = cfg.get("vbook")
        if not isinstance(vcfg, dict):
            vcfg = {}
        changed = False
        overrides = vcfg.get("plugin_overrides")
        if isinstance(overrides, dict) and pid in overrides:
            overrides.pop(pid, None)
            vcfg["plugin_overrides"] = overrides
            changed = True
        registry = vcfg.get("plugin_install_registry")
        if isinstance(registry, dict) and pid in registry:
            registry.pop(pid, None)
            vcfg["plugin_install_registry"] = registry
            changed = True
        if changed:
            cfg["vbook"] = vcfg
            save_app_config(cfg)
            self.refresh_config()

    def _vbook_local_storage_root(self) -> Path:
        root = LOCAL_DIR / "vbook_local_storage"
        root.mkdir(parents=True, exist_ok=True)
        return root

    def _vbook_plugin_storage_dir(self, plugin_id: str) -> Path:
        pid = self._normalize_vbook_plugin_id(plugin_id) or "plugin"
        folder = self._vbook_local_storage_root() / pid
        folder.mkdir(parents=True, exist_ok=True)
        return folder

    def _vbook_plugin_storage_path(self, plugin_id: str) -> Path:
        pid = self._normalize_vbook_plugin_id(plugin_id) or "plugin"
        folder = self._vbook_plugin_storage_dir(pid)
        target = folder / "local_storage.json"
        legacy = self._vbook_local_storage_root() / f"{pid}.json"
        if (not target.exists()) and legacy.exists():
            try:
                os.replace(legacy, target)
            except Exception:
                try:
                    shutil.copy2(legacy, target)
                    legacy.unlink(missing_ok=True)
                except Exception:
                    pass
        return target

    def _apply_vbook_plugin_runtime_defaults(self, plugin: Any, *, overwrite_existing: bool = False) -> None:
        pid = self._normalize_vbook_plugin_id(str(getattr(plugin, "plugin_id", "") or ""))
        if not pid:
            return
        plugin_delay = self._vbook_int_or_none(getattr(plugin, "default_delay_ms", None), min_value=0, max_value=120_000)
        plugin_threads = self._vbook_int_or_none(getattr(plugin, "default_thread_num", None), min_value=1, max_value=16)
        if plugin_delay is None and plugin_threads is None:
            return

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
            "request_delay_ms": self._vbook_int_or_none(current.get("request_delay_ms"), min_value=0, max_value=120_000),
            "download_threads": self._vbook_int_or_none(current.get("download_threads"), min_value=1, max_value=16),
            "prefetch_unread_count": self._vbook_int_or_none(current.get("prefetch_unread_count"), min_value=0, max_value=50),
        }

        changed = False
        if plugin_delay is not None and (overwrite_existing or item["request_delay_ms"] is None):
            item["request_delay_ms"] = plugin_delay
            changed = True
        if plugin_threads is not None and (overwrite_existing or item["download_threads"] is None):
            item["download_threads"] = plugin_threads
            changed = True
        if not changed:
            return

        overrides[pid] = item
        vcfg["plugin_overrides"] = overrides
        cfg["vbook"] = vcfg
        save_app_config(cfg)
        self.refresh_config()

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
        install_entry = (self.vbook_plugin_install_registry or {}).get(pid) if pid else None
        install_url = ""
        install_repo_url = ""
        if isinstance(install_entry, dict):
            install_url = self._normalize_vbook_plugin_url(str(install_entry.get("plugin_url") or ""))
            install_repo_url = self._normalize_vbook_plugin_url(str(install_entry.get("repo_url") or ""))
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
            "install_url": install_url,
            "install_repo_url": install_repo_url,
            "default_download_threads": self._vbook_version_to_int(getattr(p, "default_thread_num", None)),
            "default_request_delay_ms": self._vbook_version_to_int(getattr(p, "default_delay_ms", None)),
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
        installed_plugins = self.vbook_manager.list_plugins()
        installed_map = {
            self._normalize_vbook_plugin_id(str(getattr(p, "plugin_id", "") or "")): p
            for p in installed_plugins
            if self._normalize_vbook_plugin_id(str(getattr(p, "plugin_id", "") or ""))
        }
        registry = dict(self.vbook_plugin_install_registry or {})
        registry_url_to_pid: dict[str, str] = {}
        for raw_pid, entry in registry.items():
            pid = self._normalize_vbook_plugin_id(raw_pid)
            if (not pid) or (not isinstance(entry, dict)):
                continue
            purl = self._normalize_vbook_plugin_url(str(entry.get("plugin_url") or ""))
            if purl:
                registry_url_to_pid[purl] = pid

        normalized_items: list[dict[str, Any]] = []
        for raw in items:
            item = dict(raw or {}) if isinstance(raw, dict) else {}
            repo_plugin_url = self._normalize_vbook_plugin_url(str(item.get("plugin_url") or ""))
            installed_pid = ""
            if repo_plugin_url:
                installed_pid = registry_url_to_pid.get(repo_plugin_url, "")
            if not installed_pid:
                candidate_pid = self._normalize_vbook_plugin_id(str(item.get("plugin_id") or ""))
                if candidate_pid in installed_map:
                    installed_pid = candidate_pid
            installed_plugin = installed_map.get(installed_pid) if installed_pid else None
            installed_version = self._vbook_version_to_int(getattr(installed_plugin, "version", None)) if installed_plugin else None
            repo_version = self._vbook_version_to_int(item.get("version"))
            update_available = bool(installed_plugin and (repo_version is not None) and (installed_version is not None) and (repo_version != installed_version))
            if not update_available and installed_plugin and (repo_version is not None) and (installed_version is None):
                update_available = True

            item["plugin_url"] = repo_plugin_url
            item["installed"] = bool(installed_plugin)
            item["installed_plugin_id"] = installed_pid
            item["installed_version"] = installed_version
            item["update_available"] = update_available
            normalized_items.append(item)
        items = normalized_items
        return items, errors

    def install_vbook_plugin(self, *, plugin_url: str, plugin_id: str = "") -> dict[str, Any]:
        if not self.vbook_manager:
            raise ApiError(HTTPStatus.SERVICE_UNAVAILABLE, "VBOOK_DISABLED", "vBook chưa được bật trong server.")
        url = str(plugin_url or "").strip()
        if not url:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_url.")
        normalized_url = self._normalize_vbook_plugin_url(url)
        requested_pid = self._normalize_vbook_plugin_id(plugin_id)
        matched_pid = self._find_vbook_plugin_id_by_install_url(normalized_url)
        if requested_pid and self.vbook_manager.get_plugin(requested_pid):
            keep_pid = requested_pid
        elif matched_pid and self.vbook_manager.get_plugin(matched_pid):
            keep_pid = matched_pid
        else:
            keep_pid = ""
        try:
            content = self.vbook_manager.download_plugin_bytes(url, timeout_sec=45.0)
            remote_info = self.vbook_manager.inspect_plugin_zip_bytes(content)
        except Exception as exc:
            raise ApiError(
                HTTPStatus.BAD_GATEWAY,
                "VBOOK_PLUGIN_INSTALL_ERROR",
                "Không cài được plugin vBook từ URL.",
                {"plugin_url": url, "error": str(exc)},
            ) from exc
        existing_plugin = self.vbook_manager.get_plugin(keep_pid) if keep_pid else None
        remote_version = self._vbook_version_to_int(getattr(remote_info, "version", None)) if remote_info else None
        existing_version = self._vbook_version_to_int(getattr(existing_plugin, "version", None)) if existing_plugin else None
        if matched_pid and existing_plugin and (remote_version is not None) and (existing_version is not None) and (remote_version == existing_version):
            self._record_vbook_plugin_install(existing_plugin, plugin_url=url)
            self._apply_vbook_plugin_runtime_defaults(existing_plugin, overwrite_existing=False)
            payload = self._serialize_vbook_plugin(existing_plugin)
            payload["install_action"] = "up_to_date"
            payload["matched_by_url"] = True
            return payload
        try:
            installed = self.vbook_manager.install_plugin_from_zip_bytes(content, plugin_id=keep_pid)
        except Exception as exc:
            raise ApiError(
                HTTPStatus.BAD_GATEWAY,
                "VBOOK_PLUGIN_INSTALL_ERROR",
                "Không cài được plugin vBook từ URL.",
                {"plugin_url": url, "error": str(exc)},
            ) from exc
        self._record_vbook_plugin_install(installed, plugin_url=url)
        self._apply_vbook_plugin_runtime_defaults(installed, overwrite_existing=False)
        payload = self._serialize_vbook_plugin(installed)
        payload["install_action"] = "updated" if keep_pid else "installed"
        payload["matched_by_url"] = bool(matched_pid and keep_pid == matched_pid)
        return payload

    def install_vbook_plugin_local(self, *, filename: str, content: bytes, plugin_id: str = "") -> dict[str, Any]:
        if not self.vbook_manager:
            raise ApiError(HTTPStatus.SERVICE_UNAVAILABLE, "VBOOK_DISABLED", "vBook chưa được bật trong server.")
        if not content:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "File plugin rỗng.")
        ext = str(filename or "").strip().lower()
        if ext and not ext.endswith(".zip"):
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Chỉ hỗ trợ file plugin `.zip`.")
        requested_pid = self._normalize_vbook_plugin_id(plugin_id)
        keep_pid = requested_pid if (requested_pid and self.vbook_manager.get_plugin(requested_pid)) else ""
        try:
            installed = self.vbook_manager.install_plugin_from_zip_bytes(content, plugin_id=keep_pid)
        except Exception as exc:
            raise ApiError(
                HTTPStatus.BAD_REQUEST,
                "VBOOK_PLUGIN_INSTALL_LOCAL_ERROR",
                "Không cài được plugin vBook từ file local.",
                {"filename": filename, "error": str(exc)},
            ) from exc
        self._record_vbook_plugin_install(installed, plugin_url="")
        self._apply_vbook_plugin_runtime_defaults(installed, overwrite_existing=False)
        return self._serialize_vbook_plugin(installed)

    def remove_vbook_plugin(self, plugin_id: str) -> bool:
        if not self.vbook_manager:
            raise ApiError(HTTPStatus.SERVICE_UNAVAILABLE, "VBOOK_DISABLED", "vBook chưa được bật trong server.")
        pid = str(plugin_id or "").strip()
        if not pid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id.")
        removed = bool(self.vbook_manager.remove_plugin(pid))
        if removed:
            self._drop_vbook_plugin_state(pid)
        return removed

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

    def _build_vbook_runner_override(
        self,
        plugin: Any,
        script_key: str,
        args: list[Any],
        *,
        disable_bridge: bool = False,
    ) -> dict[str, Any]:
        override: dict[str, Any] = {}
        plugin_id = self._normalize_vbook_plugin_id(str(getattr(plugin, "plugin_id", "") or ""))
        runtime_cfg = self._effective_vbook_runtime_settings(plugin_id)
        override["request_delay_ms"] = int(runtime_cfg.get("request_delay_ms") or 0)
        override["supplemental_code"] = str(runtime_cfg.get("supplemental_code") or "")
        if plugin_id:
            override["storage_path"] = str(self._vbook_plugin_storage_path(plugin_id))

        if self.vbook_bridge_enabled and not disable_bridge:
            state = self._load_vbook_bridge_state()
            bridge_url = str(state.get("rpc_endpoint") or "").strip() if isinstance(state, dict) else ""
            bridge_token = str(state.get("rpc_token") or "").strip() if isinstance(state, dict) else ""
            if bridge_url and bridge_token:
                override["browser_bridge_url"] = bridge_url
                override["browser_bridge_token"] = bridge_token
            host_candidates = self._vbook_bridge_host_candidates(plugin, script_key, args, state)
            entry: dict[str, Any] = {}
            for host in host_candidates:
                probe = self._pick_bridge_host_entry(state, host)
                if isinstance(probe, dict) and probe:
                    entry = probe
                    break

            # Ưu tiên UA/cookie thật từ host đã capture trong browser; nếu chưa có thì
            # dùng UA mặc định của browser profile và cookie đọc từ DB profile.
            user_agent = str(entry.get("user_agent") or state.get("default_user_agent") or "").strip()

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

    def _all_vbook_attempts_returned_none(self, diagnostics: dict[str, Any] | None) -> bool:
        attempts = diagnostics.get("attempts") if isinstance(diagnostics, dict) else None
        if not isinstance(attempts, list) or not attempts:
            return False
        for row in attempts:
            if not isinstance(row, dict):
                return False
            if row.get("error") is not None:
                return False
            if str(row.get("data_type") or "") != "NoneType":
                return False
        return True

    def _should_retry_vbook_script_error(self, message: str, *, attempt: int, max_attempts: int) -> bool:
        if attempt >= max_attempts:
            return False
        text = str(message or "").strip().lower()
        if not text:
            return True
        transient_markers = (
            "timeout",
            "timed out",
            "time out",
            "read timed out",
            "connect timed out",
            "connection reset",
            "connection refused",
            "connection aborted",
            "temporarily unavailable",
            "temporary",
            "network",
            "socket",
            "dns",
            "ssl",
            "tls",
            "econn",
            "429",
            "502",
            "503",
            "504",
            "rate limit",
            "too many requests",
            "server busy",
            "máy chủ bận",
            "quá thời gian",
            "hết thời gian",
            "thử lại",
            "kết nối bị",
            "lỗi mạng",
        )
        return any(token in text for token in transient_markers)

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
            "rpc_endpoint": str(state.get("rpc_endpoint") or ""),
            "rpc_running": bool(state.get("rpc_running")),
            "default_user_agent": str(state.get("default_user_agent") or ""),
            "updated_at": str(state.get("updated_at") or ""),
            "hosts": host_items,
            "count": len(host_items),
        }

    def _run_vbook_script_result(
        self,
        plugin: Any,
        script_key: str,
        args: list[Any],
        *,
        disable_bridge: bool = False,
    ) -> dict[str, Any]:
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
                runner_override = self._build_vbook_runner_override(
                    plugin,
                    script_key,
                    args,
                    disable_bridge=disable_bridge,
                )
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
                should_retry = (
                    exc.error_code == "VBOOK_SCRIPT_ERROR"
                    and self._should_retry_vbook_script_error(str(exc), attempt=attempt, max_attempts=max_attempts)
                )
                if not should_retry:
                    raise
                time.sleep(retry_sleep_sec)
            except Exception:
                if attempt >= max_attempts:
                    raise
                time.sleep(retry_sleep_sec)

    def _run_vbook_script(
        self,
        plugin: Any,
        script_key: str,
        args: list[Any],
        *,
        disable_bridge: bool = False,
    ) -> Any:
        result = self._run_vbook_script_result(
            plugin,
            script_key,
            args,
            disable_bridge=disable_bridge,
        )
        return result.get("data")

    def _run_vbook_script_with_next(
        self,
        plugin: Any,
        script_key: str,
        args: list[Any],
        *,
        disable_bridge: bool = False,
    ) -> tuple[Any, Any]:
        result = self._run_vbook_script_result(
            plugin,
            script_key,
            args,
            disable_bridge=disable_bridge,
        )
        return result.get("data"), result.get("next")

    def _normalize_vbook_search_item(
        self,
        plugin: Any,
        item: dict[str, Any],
        *,
        query: str,
        translate_ui: bool = True,
    ) -> dict[str, Any] | None:
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
        if translate_ui and self.is_reader_translation_enabled():
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
                if isinstance(value, dict):
                    nested = self._extract_vbook_list_rows(value)
                    if nested:
                        return nested
            numeric_rows: list[tuple[int, Any]] = []
            for raw_key, raw_value in data.items():
                key_text = str(raw_key or "").strip()
                if not key_text.isdigit():
                    continue
                try:
                    numeric_rows.append((int(key_text), raw_value))
                except Exception:
                    continue
            if numeric_rows:
                numeric_rows.sort(key=lambda item: item[0])
                return [value for _, value in numeric_rows]
            object_rows = [
                value
                for value in data.values()
                if isinstance(value, dict)
                and any(
                    field in value
                    for field in ("name", "title", "label", "link", "url", "detail_url", "script", "input")
                )
            ]
            if object_rows:
                return object_rows
            for value in data.values():
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

    def _normalize_vbook_tab_item(self, item: Any, *, translate_ui: bool = True) -> dict[str, Any] | None:
        if isinstance(item, str):
            text = normalize_vbook_display_text(str(item), single_line=True)
            if not text:
                return None
            if translate_ui and self.is_reader_translation_enabled():
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
        if translate_ui and self.is_reader_translation_enabled():
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

    def _translate_vbook_items_batch(
        self,
        items: list[dict[str, Any]],
        *,
        mode: str | None = None,
    ) -> list[dict[str, Any]]:
        if not items:
            return items
        if not self.is_reader_translation_enabled():
            return items
        translate_mode = self.resolve_translate_mode(mode)
        titles = self._translate_ui_texts_batch(
            [str((item or {}).get("title_raw") or (item or {}).get("title") or "") for item in items],
            single_line=True,
            mode=translate_mode,
        )
        authors = self._translate_ui_texts_batch(
            [str((item or {}).get("author_raw") or (item or {}).get("author") or "") for item in items],
            single_line=True,
            mode=translate_mode,
        )
        descriptions = self._translate_ui_texts_batch(
            [str((item or {}).get("description_raw") or (item or {}).get("description") or "") for item in items],
            single_line=False,
            mode=translate_mode,
        )
        for idx, item in enumerate(items):
            if not isinstance(item, dict):
                continue
            if idx < len(titles):
                item["title"] = titles[idx]
            if idx < len(authors):
                item["author"] = authors[idx]
            if idx < len(descriptions):
                item["description"] = descriptions[idx]
        return items

    def _translate_vbook_tabs_batch(
        self,
        tabs: list[dict[str, Any]],
        *,
        mode: str | None = None,
    ) -> list[dict[str, Any]]:
        if not tabs:
            return tabs
        if not self.is_reader_translation_enabled():
            return tabs
        translate_mode = self.resolve_translate_mode(mode)
        titles = self._translate_ui_texts_batch(
            [str((item or {}).get("title") or "") for item in tabs],
            single_line=True,
            mode=translate_mode,
        )
        for idx, item in enumerate(tabs):
            if not isinstance(item, dict):
                continue
            if idx < len(titles):
                item["title"] = titles[idx]
        return tabs

    def _summarize_vbook_debug_row(self, row: Any) -> Any:
        if isinstance(row, dict):
            out: dict[str, Any] = {}
            for key in ("name", "title", "label", "link", "url", "detail_url", "host", "script", "input"):
                if key not in row:
                    continue
                value = row.get(key)
                if isinstance(value, str):
                    text = value.strip()
                    if len(text) > 180:
                        text = text[:177] + "..."
                    out[key] = text
                elif isinstance(value, (int, float, bool)) or value is None:
                    out[key] = value
                else:
                    out[key] = str(value)
            if out:
                return out
        if isinstance(row, str):
            text = row.strip()
            return text[:177] + "..." if len(text) > 180 else text
        return row

    def _diagnose_vbook_empty_attempts(
        self,
        diagnostics: dict[str, Any] | None,
        *,
        plugin: Any,
        script_ref: str,
        input_value: Any,
        page: int,
    ) -> None:
        attempts = diagnostics.get("attempts") if isinstance(diagnostics, dict) else None
        if not self._all_vbook_attempts_returned_none(diagnostics):
            return

        source = str(getattr(plugin, "source", "") or "").strip()
        sample_urls: list[str] = []
        seen: set[str] = set()
        for row in attempts[:6]:
            if not isinstance(row, dict):
                continue
            args = row.get("args")
            if not isinstance(args, list) or not args:
                continue
            first = args[0]
            if not isinstance(first, str):
                continue
            first_text = first.strip()
            if not first_text:
                continue
            guess = first_text
            if "{0}" in guess:
                guess = guess.replace("{0}", str(max(1, int(page or 1))))
            if source and not guess.lower().startswith(("http://", "https://")):
                guess = self._join_vbook_url(source, guess) or guess
            if guess in seen:
                continue
            seen.add(guess)
            sample_urls.append(guess)

        raise ApiError(
            HTTPStatus.BAD_GATEWAY,
            "VBOOK_SOURCE_HTTP_BLOCKED",
            "Nguồn trả HTTP không thành công hoặc bị challenge/chặn nên script vBook trả rỗng.",
            {
                "plugin_id": str(getattr(plugin, "plugin_id", "") or ""),
                "script": script_ref,
                "input": input_value,
                "page": page,
                "attempts": attempts,
                "sample_urls": sample_urls,
                "hint": "Hãy mở nguồn bằng trình duyệt tích hợp để đồng bộ cookie/headers rồi thử lại. Nếu vẫn lỗi, nguồn đang chặn request ngoài hoặc gặp Cloudflare challenge.",
            },
        )

    def _normalize_vbook_suggest_items(self, plugin: Any, raw_value: Any) -> list[dict[str, Any]]:
        rows = self._extract_vbook_list_rows(raw_value)
        out: list[dict[str, Any]] = []
        seen: set[str] = set()
        for row in rows:
            item: dict[str, Any] | None = None
            if isinstance(row, dict):
                item = self._normalize_vbook_search_item(plugin, row, query="", translate_ui=False)
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
            tab = self._normalize_vbook_tab_item(row, translate_ui=False)
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
                normalized = self._normalize_vbook_search_item(plugin, row, query="", translate_ui=False)
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

    def _should_stop_vbook_list_attempts(self, exc: Exception) -> bool:
        if isinstance(exc, ApiError):
            if exc.error_code == "VBOOK_SCRIPT_ERROR":
                return True
            if exc.error_code in {"BAD_REQUEST", "VBOOK_SCRIPT_MISSING", "VBOOK_PLUGIN_NOT_FOUND"}:
                return True
        return False

    def _run_vbook_paged_list_script(
        self,
        plugin: Any,
        *,
        script_ref: str,
        input_value: Any = None,
        page: int = 1,
        next_token: Any = None,
    ) -> tuple[list[Any], Any, dict[str, Any]]:
        p = max(1, int(page or 1))
        has_next_token = next_token is not None and str(next_token).strip() != ""
        has_input = input_value is not None and (not isinstance(input_value, str) or bool(input_value.strip()))

        candidates: list[list[Any]] = []
        if has_input:
            formatted_input: Any = None
            if isinstance(input_value, str):
                input_text = input_value.strip()
                if input_text and "{0}" in input_text and (not input_text.lower().startswith(("http://", "https://"))):
                    formatted_input = input_text.replace("{0}", str(p))
            if has_next_token:
                candidates.append([input_value, next_token])
            is_direct_script_file = str(script_ref or "").strip().lower().endswith(".js")
            if is_direct_script_file:
                # Tab script kiểu `gen.js` từ home/genre thường có contract execute(url, page).
                # Tránh thử quá nhiều biến thể làm một request lỗi bị nhân 4-5 lần.
                candidates.extend([[input_value, p], [input_value, str(p)]])
                if formatted_input:
                    candidates.append([formatted_input, p])
                candidates.append([input_value])
            else:
                # Script key tổng quát vẫn giữ fallback rộng để tương thích ext cũ.
                candidates.extend([[input_value, p], [input_value, str(p)], [input_value], [input_value, ""]])
            if formatted_input:
                if is_direct_script_file:
                    candidates.append([formatted_input])
                else:
                    candidates.extend([[formatted_input], [formatted_input, p], [formatted_input, str(p)]])
        else:
            if has_next_token:
                candidates.append([next_token])
            candidates.extend([[p], [str(p)], []])

        seen: set[str] = set()
        last_error: Exception | None = None
        best_empty_rows: list[Any] | None = None
        best_empty_next: Any = None
        attempt_logs: list[dict[str, Any]] = []
        for args in candidates:
            sig = json.dumps(args, ensure_ascii=False, sort_keys=True, default=str)
            if sig in seen:
                continue
            seen.add(sig)
            try:
                data, next_value = self._run_vbook_script_with_next(plugin, script_ref, args)
                rows = self._extract_vbook_list_rows(data)
                has_next = next_value is not None and str(next_value).strip() != ""
                 # keep lightweight diagnostics for empty/suspicious cases
                attempt_logs.append(
                    {
                        "args": args,
                        "bridge": "on",
                        "row_count": len(rows),
                        "has_next": bool(has_next),
                        "data_type": type(data).__name__,
                    }
                )
                if rows or has_next:
                    return rows, next_value, {"attempts": attempt_logs}
                if best_empty_rows is None:
                    best_empty_rows = rows
                    best_empty_next = next_value
                last_error = None
            except Exception as exc:
                attempt_logs.append(
                    {
                        "args": args,
                        "bridge": "on",
                        "error": str(exc),
                        "error_type": type(exc).__name__,
                    }
                )
                last_error = exc
                if self._should_stop_vbook_list_attempts(exc):
                    break
                continue

        if best_empty_rows is not None:
            diagnostics = {"attempts": attempt_logs}
            self._diagnose_vbook_empty_attempts(
                diagnostics,
                plugin=plugin,
                script_ref=script_ref,
                input_value=input_value,
                page=p,
            )
            return best_empty_rows, best_empty_next, {"attempts": attempt_logs}

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
        best_empty_data: Any = []
        best_empty_next: Any = None
        
        for args in candidates:
            sig = json.dumps(args, ensure_ascii=False, sort_keys=True, default=str)
            if sig in seen:
                continue
            seen.add(sig)
            try:
                data, next_value = self._run_vbook_script_with_next(plugin, "search", args)
                last_error = None
                success = True
                rows = self._extract_vbook_list_rows(data)
                if rows or (next_value is not None and str(next_value).strip() != ""):
                    best_data = data
                    best_next = next_value
                    break
                if best_empty_data == []:
                    best_empty_data = data
                    best_empty_next = next_value
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

        if (not best_data) and best_empty_data not in (None, []):
            best_data = best_empty_data
            best_next = best_empty_next
        if success and self._extract_vbook_list_rows(best_data) == [] and (
            isinstance(best_data, dict) or best_data is None
        ):
            diagnostics = {
                "attempts": [
                    {
                        "args": args,
                        "bridge": "on",
                        "data_type": type(best_empty_data).__name__ if best_empty_data is not None else "NoneType",
                    }
                    for args in candidates
                ]
            }
            self._diagnose_vbook_empty_attempts(
                diagnostics,
                plugin=plugin,
                script_ref="search",
                input_value=q,
                page=p,
            )

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
            normalized = self._normalize_vbook_search_item(plugin, row, query=q, translate_ui=False)
            if normalized:
                items.append(normalized)
        if self.is_reader_translation_enabled():
            self._translate_vbook_items_batch(items, mode=self.reader_translation_mode())
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
                normalized = self._normalize_vbook_search_item(plugin, row, query="", translate_ui=False)
                if normalized:
                    items.append(normalized)
                    continue
                tab = self._normalize_vbook_tab_item(row, translate_ui=False)
                if tab:
                    tabs.append(tab)
            if self.is_reader_translation_enabled():
                mode = self.reader_translation_mode()
                self._translate_vbook_items_batch(items, mode=mode)
                self._translate_vbook_tabs_batch(tabs, mode=mode)
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
        rows, next_value, diagnostics = self._run_vbook_paged_list_script(
            plugin,
            script_ref=script_ref,
            input_value=tab_input,
            page=p,
            next_token=next_token,
        )
        items: list[dict[str, Any]] = []
        extra_tabs: list[dict[str, Any]] = []
        for row in rows:
            normalized = self._normalize_vbook_search_item(plugin, row, query="", translate_ui=False)
            if normalized:
                items.append(normalized)
                continue
            tab = self._normalize_vbook_tab_item(row, translate_ui=False)
            if tab:
                extra_tabs.append(tab)
        if self.is_reader_translation_enabled():
            mode = self.reader_translation_mode()
            self._translate_vbook_items_batch(items, mode=mode)
            self._translate_vbook_tabs_batch(extra_tabs, mode=mode)
        if rows and not items and not extra_tabs:
            raise ApiError(
                HTTPStatus.BAD_GATEWAY,
                "VBOOK_LIST_NORMALIZE_FAILED",
                "Plugin vBook trả dữ liệu danh sách nhưng app không map được thành truyện hoặc tab.",
                {
                    "plugin_id": str(getattr(plugin, "plugin_id", "") or ""),
                    "script": script_ref,
                    "raw_row_count": len(rows),
                    "sample_rows": [self._summarize_vbook_debug_row(row) for row in rows[:3]],
                    "attempts": diagnostics.get("attempts") if isinstance(diagnostics, dict) else [],
                },
            )
        if not rows and not items and not extra_tabs:
            self._diagnose_vbook_empty_attempts(
                diagnostics,
                plugin=plugin,
                script_ref=script_ref,
                input_value=tab_input,
                page=p,
            )
        payload = {
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
        if not items and not extra_tabs:
            payload["debug"] = {
                "empty_reason": "no_rows",
                "attempts": diagnostics.get("attempts") if isinstance(diagnostics, dict) else [],
            }
        return payload

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
                normalized = self._normalize_vbook_search_item(plugin, row, query="", translate_ui=False)
                if normalized:
                    items.append(normalized)
                    continue
                tab = self._normalize_vbook_tab_item(row, translate_ui=False)
                if tab:
                    tabs.append(tab)
            if self.is_reader_translation_enabled():
                mode = self.reader_translation_mode()
                self._translate_vbook_items_batch(items, mode=mode)
                self._translate_vbook_tabs_batch(tabs, mode=mode)
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
        rows, next_value, diagnostics = self._run_vbook_paged_list_script(
            plugin,
            script_ref=script_ref,
            input_value=tab_input,
            page=p,
            next_token=next_token,
        )
        items: list[dict[str, Any]] = []
        extra_tabs: list[dict[str, Any]] = []
        for row in rows:
            normalized = self._normalize_vbook_search_item(plugin, row, query="", translate_ui=False)
            if normalized:
                items.append(normalized)
                continue
            tab = self._normalize_vbook_tab_item(row, translate_ui=False)
            if tab:
                extra_tabs.append(tab)
        if self.is_reader_translation_enabled():
            mode = self.reader_translation_mode()
            self._translate_vbook_items_batch(items, mode=mode)
            self._translate_vbook_tabs_batch(extra_tabs, mode=mode)
        if rows and not items and not extra_tabs:
            raise ApiError(
                HTTPStatus.BAD_GATEWAY,
                "VBOOK_LIST_NORMALIZE_FAILED",
                "Plugin vBook trả dữ liệu danh sách nhưng app không map được thành truyện hoặc tab.",
                {
                    "plugin_id": str(getattr(plugin, "plugin_id", "") or ""),
                    "script": script_ref,
                    "raw_row_count": len(rows),
                    "sample_rows": [self._summarize_vbook_debug_row(row) for row in rows[:3]],
                    "attempts": diagnostics.get("attempts") if isinstance(diagnostics, dict) else [],
                },
            )
        if not rows and not items and not extra_tabs:
            self._diagnose_vbook_empty_attempts(
                diagnostics,
                plugin=plugin,
                script_ref=script_ref,
                input_value=tab_input,
                page=p,
            )
        payload = {
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
        if not items and not extra_tabs:
            payload["debug"] = {
                "empty_reason": "no_rows",
                "attempts": diagnostics.get("attempts") if isinstance(diagnostics, dict) else [],
            }
        return payload

    def _fetch_vbook_detail_raw(self, *, url: str, plugin_id: str = "") -> dict[str, Any]:
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
        return {
            "plugin": plugin,
            "detail": {
                "title_raw": title_raw,
                "author_raw": author_raw,
                "cover_raw": cover,
                "description_raw": description_raw,
                "url": source_url,
                "host": host,
                "is_comic": is_comic,
                "source_type": "vbook_comic" if is_comic else "vbook",
                "ongoing": ongoing,
                "status_text_raw": status_text_raw,
                "info_text_raw": info_text_raw,
                "genres": genre_items,
                "suggest_items": suggest_items,
                "comment_items": comment_items,
                "extra_fields": extra_fields,
            },
        }

    def get_vbook_detail(
        self,
        *,
        url: str,
        plugin_id: str = "",
        translate_ui: bool | None = None,
    ) -> dict[str, Any]:
        payload = self._fetch_vbook_detail_raw(url=url, plugin_id=plugin_id)
        plugin = payload["plugin"]
        detail = dict(payload["detail"] or {})
        source_url = str(detail.get("url") or url or "").strip()
        title_raw = normalize_vbook_display_text(str(detail.get("title_raw") or ""), single_line=True) or source_url
        author_raw = normalize_vbook_display_text(str(detail.get("author_raw") or ""), single_line=True)
        description_raw = normalize_vbook_display_text(str(detail.get("description_raw") or ""), single_line=False)
        status_text_raw = normalize_vbook_display_text(str(detail.get("status_text_raw") or ""), single_line=True)
        info_text_raw = normalize_vbook_display_text(str(detail.get("info_text_raw") or ""), single_line=False)
        title = title_raw
        author = author_raw
        description = description_raw
        status_text = status_text_raw
        info_text = info_text_raw
        cover = build_vbook_image_proxy_path(
            str(detail.get("cover_raw") or "").strip(),
            plugin_id=str(getattr(plugin, "plugin_id", "") or "").strip(),
            referer=source_url,
        )
        suggest_items = [dict(x or {}) for x in (detail.get("suggest_items") or []) if isinstance(x, dict)]
        comment_items = [dict(x or {}) for x in (detail.get("comment_items") or []) if isinstance(x, dict)]
        genre_items = [dict(x or {}) for x in (detail.get("genres") or []) if isinstance(x, dict)]
        extra_fields = [dict(x or {}) for x in (detail.get("extra_fields") or []) if isinstance(x, dict)]
        if translate_ui is None:
            translate_on = self.is_reader_translation_enabled()
        else:
            translate_on = bool(translate_ui)
        if translate_on:
            mode = self.reader_translation_mode()
            translated_head = self._translate_ui_texts_batch(
                [title, author, status_text],
                single_line=True,
                mode=mode,
            )
            translated_body = self._translate_ui_texts_batch(
                [description, info_text],
                single_line=False,
                mode=mode,
            )
            if len(translated_head) >= 3:
                title, author, status_text = translated_head[:3]
            if len(translated_body) >= 2:
                description, info_text = translated_body[:2]
            if suggest_items:
                suggest_titles = self._translate_ui_texts_batch(
                    [str(item.get("title") or "") for item in suggest_items],
                    single_line=True,
                    mode=mode,
                )
                suggest_authors = self._translate_ui_texts_batch(
                    [str(item.get("author") or "") for item in suggest_items],
                    single_line=True,
                    mode=mode,
                )
                suggest_descs = self._translate_ui_texts_batch(
                    [str(item.get("description") or "") for item in suggest_items],
                    single_line=False,
                    mode=mode,
                )
                for idx, item in enumerate(suggest_items):
                    if not isinstance(item, dict):
                        continue
                    item["title"] = suggest_titles[idx] if idx < len(suggest_titles) else str(item.get("title") or "")
                    item["author"] = suggest_authors[idx] if idx < len(suggest_authors) else str(item.get("author") or "")
                    item["description"] = suggest_descs[idx] if idx < len(suggest_descs) else str(item.get("description") or "")
            if comment_items:
                comment_authors = self._translate_ui_texts_batch(
                    [str(item.get("author") or "") for item in comment_items],
                    single_line=True,
                    mode=mode,
                )
                comment_contents = self._translate_ui_texts_batch(
                    [str(item.get("content") or "") for item in comment_items],
                    single_line=False,
                    mode=mode,
                )
                for idx, item in enumerate(comment_items):
                    if not isinstance(item, dict):
                        continue
                    item["author"] = comment_authors[idx] if idx < len(comment_authors) else str(item.get("author") or "")
                    item["content"] = comment_contents[idx] if idx < len(comment_contents) else str(item.get("content") or "")
            if genre_items:
                genre_titles = self._translate_ui_texts_batch(
                    [str(item.get("title") or "") for item in genre_items],
                    single_line=True,
                    mode=mode,
                )
                for idx, item in enumerate(genre_items):
                    if not isinstance(item, dict):
                        continue
                    item["title"] = genre_titles[idx] if idx < len(genre_titles) else str(item.get("title") or "")
            if extra_fields:
                field_keys = self._translate_ui_texts_batch(
                    [str(item.get("key") or "") for item in extra_fields],
                    single_line=True,
                    mode=mode,
                )
                field_values = self._translate_ui_texts_batch(
                    [str(item.get("value") or "") for item in extra_fields],
                    single_line=False,
                    mode=mode,
                )
                for idx, item in enumerate(extra_fields):
                    if not isinstance(item, dict):
                        continue
                    item["key"] = field_keys[idx] if idx < len(field_keys) else str(item.get("key") or "")
                    item["value"] = field_values[idx] if idx < len(field_values) else str(item.get("value") or "")
        return {
            "ok": True,
            "plugin": self._serialize_vbook_plugin(plugin),
            "detail": {
                "title": title,
                "author": author,
                "title_raw": title_raw,
                "author_raw": author_raw,
                "cover": cover,
                "cover_raw": str(detail.get("cover_raw") or "").strip(),
                "description": description,
                "description_raw": description_raw,
                "url": source_url,
                "host": str(detail.get("host") or "").strip(),
                "is_comic": bool(detail.get("is_comic")),
                "source_type": str(detail.get("source_type") or ("vbook_comic" if bool(detail.get("is_comic")) else "vbook")),
                "ongoing": detail.get("ongoing"),
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

    def refresh_library_book_detail_from_source(self, book_id: str) -> dict[str, Any] | None:
        bid = str(book_id or "").strip()
        if not bid:
            return None
        book = self.storage.find_book(bid)
        if not book:
            return None
        source_type = str(book.get("source_type") or "").strip().lower()
        source_url = str(book.get("source_url") or "").strip()
        if (not source_type.startswith("vbook")) or (not source_url):
            return self.storage.get_book_detail(bid)
        plugin_id = str(book.get("source_plugin") or "").strip()
        try:
            payload = self._fetch_vbook_detail_raw(url=source_url, plugin_id=plugin_id)
        except Exception:
            return self.storage.get_book_detail(bid)
        detail = dict(payload.get("detail") or {})
        next_payload: dict[str, Any] = {}
        title_raw = normalize_vbook_display_text(str(detail.get("title_raw") or ""), single_line=True)
        author_raw = normalize_vbook_display_text(str(detail.get("author_raw") or ""), single_line=True)
        description_raw = normalize_vbook_display_text(str(detail.get("description_raw") or ""), single_line=False)
        cover_raw = str(detail.get("cover_raw") or "").strip()
        if title_raw and title_raw != str(book.get("title") or "").strip():
            next_payload["title"] = title_raw
        if author_raw and author_raw != str(book.get("author") or "").strip():
            next_payload["author"] = author_raw
        if description_raw and description_raw != str(book.get("summary") or "").strip():
            next_payload["summary"] = description_raw
        if cover_raw and cover_raw != str(book.get("cover_path") or "").strip():
            next_payload["cover_path"] = cover_raw
        if source_url and source_url != str(book.get("extra_link") or "").strip():
            next_payload["extra_link"] = source_url
        if next_payload:
            updated = self.storage.update_book_metadata(bid, next_payload)
            if updated:
                return updated
        return self.storage.get_book_detail(bid)

    def refresh_library_book_toc(self, book_id: str) -> dict[str, Any]:
        bid = str(book_id or "").strip()
        if not bid:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
        book = self.storage.find_book(bid)
        if not book:
            raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        source_type = str(book.get("source_type") or "").strip().lower()
        source_url = str(book.get("source_url") or "").strip()
        if (not source_type.startswith("vbook")) or (not source_url):
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Truyện này không hỗ trợ kiểm tra cập nhật online.")
        plugin = self._resolve_vbook_plugin(source_url, plugin_id=str(book.get("source_plugin") or "").strip() or None)
        self._ensure_plugin_has_script(plugin, "toc")
        rows = self._fetch_vbook_toc(plugin, source_url)
        if not rows:
            raise ApiError(
                HTTPStatus.BAD_GATEWAY,
                "VBOOK_TOC_EMPTY",
                "Nguồn không trả về mục lục mới.",
                {"book_id": bid, "plugin_id": str(getattr(plugin, "plugin_id", "") or ""), "source_url": source_url},
            )
        result = self.storage.sync_remote_book_toc(bid, rows)
        result["plugin_id"] = str(getattr(plugin, "plugin_id", "") or "")
        return result

    def get_vbook_toc(
        self,
        *,
        url: str,
        plugin_id: str = "",
        page: int = 1,
        page_size: int = 120,
        all_items: bool = False,
        translate_ui: bool | None = None,
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
        raw_titles: list[str] = []
        if translate_ui is None:
            translate_on = self.is_reader_translation_enabled()
        else:
            translate_on = bool(translate_ui)
        translate_mode = self.reader_translation_mode()
        for idx, row in enumerate(chunk, start=(1 if all_items else ((p - 1) * ps + 1))):
            raw_title = normalize_vbook_display_text(
                str(row.get("name") or ""),
                single_line=True,
            ) or f"Chương {idx}"
            raw_titles.append(raw_title)
        translated_titles = (
            self._translate_ui_texts_batch(raw_titles, single_line=True, mode=translate_mode)
            if translate_on
            else raw_titles
        )
        for idx, row in enumerate(chunk, start=(1 if all_items else ((p - 1) * ps + 1))):
            raw_title = raw_titles[idx - (1 if all_items else ((p - 1) * ps + 1))]
            title = translated_titles[idx - (1 if all_items else ((p - 1) * ps + 1))] if translated_titles else raw_title
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

        comic_payload = decode_comic_payload(core) if is_comic else None
        if is_comic:
            images = [str(x).strip() for x in ((comic_payload or {}).get("images") or []) if str(x).strip()]
            if not images:
                raise ApiError(
                    HTTPStatus.BAD_GATEWAY,
                    "VBOOK_CHAP_EMPTY",
                    "Chương truyện tranh không có ảnh hợp lệ.",
                    {
                        "book_id": str((book or {}).get("book_id") or ""),
                        "chapter_id": str((chapter or {}).get("chapter_id") or ""),
                        "remote_url": remote_url,
                        "plugin_id": str(getattr(plugin, "plugin_id", "") or ""),
                    },
                )
        else:
            if not str(core or "").strip():
                raise ApiError(
                    HTTPStatus.BAD_GATEWAY,
                    "VBOOK_CHAP_EMPTY",
                    "Chương không có nội dung hợp lệ.",
                    {
                        "book_id": str((book or {}).get("book_id") or ""),
                        "chapter_id": str((chapter or {}).get("chapter_id") or ""),
                        "remote_url": remote_url,
                        "plugin_id": str(getattr(plugin, "plugin_id", "") or ""),
                    },
                )

        raw_key = (chapter or {}).get("raw_key") or ""
        if raw_key:
            self.storage.write_cache(raw_key, str((book or {}).get("lang_source") or "zh"), core)
        try:
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
            cookie_header = str(entry.get("cookie_header") or "").strip()
            if (not cookie_header) and entry:
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
        key = vbook_image_cache_key(image_url=image_url, plugin_id=plugin_id)
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
        content_encoding = str(meta.get("content_encoding") or "").strip()
        if not ctype:
            parsed = urlparse(str(image_url or "").strip())
            ctype = mimetypes.guess_type(parsed.path)[0] or "application/octet-stream"
        decoded = decode_http_encoded_body(data, content_encoding=content_encoding)
        if decoded != data:
            try:
                self._write_vbook_image_cache(
                    image_url=image_url,
                    plugin_id=plugin_id,
                    content_type=ctype,
                    content_encoding="",
                    data=decoded,
                )
            except Exception:
                pass
            data = decoded
        return data, ctype

    def _write_vbook_image_cache(
        self,
        *,
        image_url: str,
        plugin_id: str = "",
        content_type: str = "",
        content_encoding: str = "",
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
                        "content_encoding": str(content_encoding or "").strip(),
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

    def fetch_vbook_image(
        self,
        *,
        image_url: str,
        plugin_id: str = "",
        referer: str = "",
        use_cache: bool = False,
    ) -> tuple[bytes, str]:
        target = str(image_url or "").strip()
        parsed = urlparse(target)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "URL ảnh vBook không hợp lệ.")

        if use_cache:
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
                content_encoding = str(resp.headers.get("Content-Encoding") or "").strip()
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
        data = decode_http_encoded_body(data, content_encoding=content_encoding)
        ctype = content_type or (mimetypes.guess_type(parsed.path)[0] or "application/octet-stream")
        if use_cache:
            self._write_vbook_image_cache(
                image_url=target,
                plugin_id=plugin_id,
                content_type=ctype,
                content_encoding="",
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

    def handle(self):  # noqa: N802
        try:
            super().handle()
        except OSError as exc:
            if self._is_client_disconnect_error(exc):
                return
            raise

    def log_message(self, fmt: str, *args):  # noqa: A003
        try:
            message = "%s - - [%s] %s" % (
                self.address_string(),
                self.log_date_time_string(),
                fmt % args,
            )
        except Exception:
            try:
                message = str(fmt % args)
            except Exception:
                message = str(fmt)
        safe_console_print(message)

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
        route = http_routes_support.match_export_download_route("GET", parsed.path)
        if route is not None and route.name == "export_jobs_stream":
            http_export_download_support.stream_export_jobs(
                self,
                parsed,
                route_support=http_routes_support,
                http_status=HTTPStatus,
            )
            return
        if route is not None and route.name == "download_jobs_stream":
            http_export_download_support.stream_download_jobs(
                self,
                parsed,
                route_support=http_routes_support,
                http_status=HTTPStatus,
            )
            return
        if parsed.path.startswith("/api/"):
            self._dispatch_api("GET", parsed)
            return
        if parsed.path.startswith("/media/"):
            http_media_support.serve_media(
                self,
                parsed,
                deps=http_media_support.MediaDeps(
                    api_error_cls=ApiError,
                    http_status=HTTPStatus,
                    export_dir=EXPORT_DIR,
                    cover_dir=COVER_DIR,
                    cache_dir=CACHE_DIR,
                    mimetypes_module=mimetypes,
                    quote_func=quote,
                    unquote_func=unquote,
                    re_module=re,
                ),
            )
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
                safe_console_print(
                    f"[API ERROR] trace_id={trace_id} method={method} path={parsed.path}\n{details['traceback']}"
                )
            except Exception:
                pass
            try:
                self._send_error_json(
                    ApiError(HTTPStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Lỗi hệ thống nội bộ.", details),
                    trace_id=trace_id,
                )
            except OSError as send_exc:
                if self._is_client_disconnect_error(send_exc):
                    return
                raise

    def _write_sse_event(self, event: str, payload: dict[str, Any], *, event_id: int | None = None) -> None:
        parts: list[str] = []
        if event_id is not None:
            parts.append(f"id: {int(event_id)}")
        if event:
            parts.append(f"event: {event}")
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        for line in (body.splitlines() or [body]):
            parts.append(f"data: {line}")
        packet = ("\n".join(parts) + "\n\n").encode("utf-8", errors="ignore")
        self.wfile.write(packet)
        self.wfile.flush()

    def _write_sse_comment(self, comment: str = "keepalive") -> None:
        packet = f": {comment}\n\n".encode("utf-8", errors="ignore")
        self.wfile.write(packet)
        self.wfile.flush()

    def _handle_api(self, method: str, parsed):
        path = parsed.path
        query = parse_qs(parsed.query)

        export_download_result = http_export_download_support.handle_api(
            self,
            method,
            path,
            query,
            route_support=http_routes_support,
        )
        if export_download_result is not None:
            return export_download_result

        vbook_import_result = http_vbook_import_support.handle_api(
            self,
            method,
            path,
            query,
            api_error_cls=ApiError,
            http_status=HTTPStatus,
            re_module=re,
            unquote_func=unquote,
        )
        if vbook_import_result is not None:
            return vbook_import_result

        library_reader_result = http_library_reader_support.handle_api(
            self,
            method,
            path,
            query,
            deps=http_library_reader_support.LibraryReaderDeps(
                api_error_cls=ApiError,
                http_status=HTTPStatus,
                cache_dir=CACHE_DIR,
                normalize_vbook_display_text=normalize_vbook_display_text,
                normalize_vi_display_text=normalize_vi_display_text,
                decode_comic_payload=decode_comic_payload,
                build_vbook_image_proxy_path=build_vbook_image_proxy_path,
                map_selection_to_name_source=map_selection_to_name_source,
                map_selection_to_source_segment=map_selection_to_source_segment,
                text_snippet=_text_snippet,
            ),
        )
        if library_reader_result is not None:
            return library_reader_result

        misc_result = http_misc_support.handle_api(
            self,
            method,
            path,
            query,
            deps=http_misc_support.MiscApiDeps(
                api_error_cls=ApiError,
                http_status=HTTPStatus,
                theme_presets=THEME_PRESETS,
                utc_now_iso=utc_now_iso,
                normalize_newlines=normalize_newlines,
                normalize_name_set=normalize_name_set,
                build_incremental_hv_suggestions=build_incremental_hv_suggestions,
                build_name_right_suggestions=build_name_right_suggestions,
                translator_logic=translator_logic,
                vbook_local_translate=vbook_local_translate,
                re_module=re,
                quote_func=quote,
                unquote_func=unquote,
            ),
        )
        if misc_result is not None:
            return misc_result

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

    def _read_form_json_field(self, raw_value: str | None) -> dict[str, Any] | None:
        text = str(raw_value or "").strip()
        if not text:
            return None
        try:
            payload = json.loads(text)
        except Exception as exc:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_JSON", "JSON trong form không hợp lệ.", str(exc)) from exc
        if payload is None:
            return None
        if not isinstance(payload, dict):
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_JSON", "JSON trong form phải là object.")
        return payload

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
    explicit_log = (os.environ.get("READER_SERVER_LOG_FILE") or "").strip()
    explicit_dir = (os.environ.get("READER_SERVER_LOG_DIR") or "").strip()
    if explicit_log or explicit_dir:
        try:
            log_path = Path(explicit_log).resolve() if explicit_log else _reader_log_path_for_now()
            log_path.parent.mkdir(parents=True, exist_ok=True)
            with _EXPLICIT_LOG_LOCK:
                with log_path.open("a", encoding="utf-8", errors="backslashreplace") as fp:
                    fp.write(message)
                    fp.write("\n")
                    fp.flush()
            return
        except Exception:
            pass
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
    cleanup_reader_log_files(keep_days=30)
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
