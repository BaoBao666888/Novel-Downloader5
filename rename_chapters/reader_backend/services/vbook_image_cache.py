from __future__ import annotations

import json
import mimetypes
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from reader_backend.core import content_media as content_media_support


VBOOK_IMAGE_CACHE_TTL_SECONDS = 7 * 24 * 3600


def vbook_image_cache_paths(
    *,
    image_url: str,
    plugin_id: str = "",
    image_cache_dir: Path,
) -> tuple[Path, Path]:
    key = content_media_support.vbook_image_cache_key(image_url=image_url, plugin_id=plugin_id)
    return (
        image_cache_dir / f"{key}.bin",
        image_cache_dir / f"{key}.json",
    )


def read_vbook_image_cache(
    *,
    image_url: str,
    plugin_id: str = "",
    image_cache_dir: Path,
    ttl_seconds: int = VBOOK_IMAGE_CACHE_TTL_SECONDS,
) -> tuple[bytes, str] | None:
    body_path, meta_path = vbook_image_cache_paths(
        image_url=image_url,
        plugin_id=plugin_id,
        image_cache_dir=image_cache_dir,
    )
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
    if (not ts) or ((datetime.now(timezone.utc).timestamp() - ts) > max(1, int(ttl_seconds or 1))):
        return None
    try:
        data = body_path.read_bytes()
    except Exception:
        return None
    if not data:
        return None
    content_type = str(meta.get("content_type") or "").strip()
    content_encoding = str(meta.get("content_encoding") or "").strip()
    if not content_type:
        parsed = urlparse(str(image_url or "").strip())
        content_type = mimetypes.guess_type(parsed.path)[0] or "application/octet-stream"
    decoded = content_media_support.decode_http_encoded_body(data, content_encoding=content_encoding)
    if decoded != data:
        try:
            write_vbook_image_cache(
                image_url=image_url,
                plugin_id=plugin_id,
                content_type=content_type,
                content_encoding="",
                data=decoded,
                image_cache_dir=image_cache_dir,
            )
        except Exception:
            pass
        data = decoded
    return data, content_type


def write_vbook_image_cache(
    *,
    image_url: str,
    plugin_id: str = "",
    content_type: str = "",
    content_encoding: str = "",
    data: bytes,
    image_cache_dir: Path,
) -> None:
    if not data:
        return
    body_path, meta_path = vbook_image_cache_paths(
        image_url=image_url,
        plugin_id=plugin_id,
        image_cache_dir=image_cache_dir,
    )
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
