from __future__ import annotations

from typing import Any


VBOOK_CONTENT_TYPES = {"novel", "chinese_novel", "comic", "file"}


def normalize_vbook_content_type(value: Any) -> str:
    text = str(value or "").strip().lower().replace("-", "_")
    return text if text in VBOOK_CONTENT_TYPES else ""


def resolve_vbook_content_type(plugin: Any, detail: dict[str, Any] | None = None) -> str:
    detail_type = ""
    if isinstance(detail, dict):
        detail_type = normalize_vbook_content_type(detail.get("type"))
    return detail_type or normalize_vbook_content_type(getattr(plugin, "type", ""))


def is_vbook_comic_type(content_type: Any) -> bool:
    return normalize_vbook_content_type(content_type) == "comic"


def vbook_source_type(content_type: Any, *, history_only: bool = False) -> str:
    is_comic = is_vbook_comic_type(content_type)
    if history_only:
        return "vbook_session_comic" if is_comic else "vbook_session"
    return "vbook_comic" if is_comic else "vbook"
