from __future__ import annotations

from typing import Any


def upsert_history_book(service, payload: dict[str, Any], *, api_error_cls, http_status) -> dict[str, Any]:
    if not isinstance(payload, dict):
        payload = {}
    source_url = str(payload.get("source_url") or payload.get("url") or "").strip()
    if not source_url:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu source_url.")
    plugin_id = str(payload.get("plugin_id") or "").strip()
    if (not plugin_id) and service.vbook_manager:
        try:
            plugin = service.vbook_manager.detect_plugin_for_url(source_url)
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
    if not chapter_url:
        return {
            "skipped": True,
            "reason": "missing_last_read_chapter_url",
            "source_url": source_url,
            "plugin_id": plugin_id,
        }
    try:
        return service.storage.upsert_history_book(
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
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", str(exc)) from exc


def delete_history_book(service, history_id: str) -> bool:
    return service.storage.delete_history_book(history_id)


def list_history_books(service) -> list[dict[str, Any]]:
    items = service.storage.list_history_books()
    allow = service.is_reader_translation_enabled()
    if not allow:
        return items
    out: list[dict[str, Any]] = []
    for row in items:
        item = dict(row)
        item["title"] = service._translate_ui_text(item.get("title") or "", single_line=True) or (item.get("title") or "")
        item["author"] = service._translate_ui_text(item.get("author") or "", single_line=True) or (item.get("author") or "")
        item["last_read_chapter_title"] = service._translate_ui_text(
            item.get("last_read_chapter_title") or "",
            single_line=True,
        ) or (item.get("last_read_chapter_title") or "")
        out.append(item)
    return out
