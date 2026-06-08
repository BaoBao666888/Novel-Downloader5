from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qs, urlparse


@dataclass(frozen=True)
class ComicImageSource:
    index: int
    image_url: str
    display_url: str
    plugin_id: str
    referer: str
    image_key: str


def build_image_sources(
    images: list[str],
    *,
    book: dict[str, Any],
    chapter: dict[str, Any],
    build_vbook_image_proxy_path,
    vbook_image_cache_key,
) -> list[ComicImageSource]:
    plugin_id = str((book or {}).get("source_plugin") or "").strip()
    referer = str((chapter or {}).get("remote_url") or (book or {}).get("source_url") or "").strip()
    out: list[ComicImageSource] = []
    for index, raw in enumerate(images or []):
        image_url, inner_plugin_id, inner_referer = unwrap_vbook_image_proxy(raw)
        pid = inner_plugin_id or plugin_id
        ref = inner_referer or referer
        display_url = build_vbook_image_proxy_path(image_url, plugin_id=pid, referer=ref, cache=True)
        out.append(
            ComicImageSource(
                index=index,
                image_url=image_url,
                display_url=display_url,
                plugin_id=pid,
                referer=ref,
                image_key=vbook_image_cache_key(image_url=image_url, plugin_id=pid),
            )
        )
    return out


def unwrap_vbook_image_proxy(value: str) -> tuple[str, str, str]:
    raw = str(value or "").strip()
    if not raw.startswith("/media/vbook-image?") and not raw.startswith("media/vbook-image?"):
        return raw, "", ""
    parsed = urlparse(raw if raw.startswith("/") else f"/{raw}")
    query = parse_qs(parsed.query)
    return (
        str((query.get("url", [""])[0] or "")).strip(),
        str((query.get("plugin_id", [""])[0] or "")).strip(),
        str((query.get("referer", [""])[0] or "")).strip(),
    )


def image_size_from_bytes(data: bytes) -> tuple[int, int]:
    try:
        from PIL import Image

        import io

        with Image.open(io.BytesIO(data or b"")) as image:
            return int(image.width or 0), int(image.height or 0)
    except Exception:
        return 0, 0
