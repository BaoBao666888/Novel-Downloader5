from __future__ import annotations

from typing import Any
from urllib.parse import unquote


def _query_first(query: dict[str, list[str]], key: str) -> str:
    values = query.get(key)
    if not isinstance(values, list) or not values:
        return ""
    return str(values[0] or "").strip()


def handle_api(
    handler: Any,
    method: str,
    path: str,
    query: dict[str, list[str]],
    *,
    api_error_cls: type[Exception],
    http_status: Any,
) -> dict[str, Any] | None:
    if method == "GET" and path == "/api/comic-ocr/capabilities":
        book_id = unquote(_query_first(query, "book_id")).strip()
        if not book_id:
            raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
        return handler.service.get_comic_ocr_capabilities(book_id)
    return None

