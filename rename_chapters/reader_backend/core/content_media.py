from __future__ import annotations

import gzip
import json
import zlib
from typing import Any
from urllib.parse import parse_qs, urlparse

from reader_backend.core import common


COMIC_CACHE_PREFIX = "__READER_COMIC_JSON__:"


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
    parts = [f"url={common.quote_url_path(url)}"]
    pid = str(plugin_id or "").strip()
    if pid:
        parts.append(f"plugin_id={common.quote_url_path(pid)}")
    ref = str(referer or "").strip()
    if ref:
        parts.append(f"referer={common.quote_url_path(ref)}")
    if cache:
        parts.append("cache=1")
    return "/media/vbook-image?" + "&".join(parts)


def build_vbook_plugin_icon_path(plugin_id: str) -> str:
    pid = str(plugin_id or "").strip()
    if not pid:
        return ""
    return f"/media/vbook-plugin-icon?plugin_id={common.quote_url_path(pid)}"


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
    return common.hash_text(seed)


def chapter_raw_cache_has_payload(raw_text: str | None, *, is_comic: bool) -> bool:
    text = str(raw_text or "")
    if not is_comic:
        return bool(text.strip())
    return bool(extract_comic_image_urls(text))


def decode_http_encoded_body(data: bytes, *, content_encoding: str = "") -> bytes:
    raw = bytes(data or b"")
    if not raw:
        return b""
    encoding = str(content_encoding or "").strip().lower()
    try:
        if "gzip" in encoding or raw[:2] == b"\x1f\x8b":
            return gzip.decompress(raw)
        if "deflate" in encoding:
            return zlib.decompress(raw)
    except Exception:
        return raw
    return raw
