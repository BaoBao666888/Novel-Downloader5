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
    if method == "POST" and path == "/api/comic-ocr/chapter/translate":
        payload = handler._read_json_body()
        return handler.service.start_comic_ocr_chapter_translation(payload)
    if method == "GET" and path.startswith("/api/comic-ocr/jobs/"):
        job_id = unquote(path.removeprefix("/api/comic-ocr/jobs/").strip("/")).strip()
        if not job_id:
            raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu job_id.")
        return handler.service.get_comic_ocr_job(job_id)
    if method == "GET" and path == "/api/comic-ocr/chapter/result":
        return handler.service.get_comic_ocr_chapter_result(
            book_id=unquote(_query_first(query, "book_id")).strip(),
            chapter_id=unquote(_query_first(query, "chapter_id")).strip(),
            source_lang=_query_first(query, "source_lang"),
            target_lang=_query_first(query, "target_lang"),
            translation_mode=_query_first(query, "translation_mode"),
        )
    if method == "DELETE" and path == "/api/comic-ocr/chapter/cache":
        body: dict[str, Any] = {}
        try:
            body = handler._read_json_body()
        except Exception:
            body = {}
        return handler.service.clear_comic_ocr_chapter_cache(
            book_id=str(body.get("book_id") or unquote(_query_first(query, "book_id"))).strip(),
            chapter_id=str(body.get("chapter_id") or unquote(_query_first(query, "chapter_id"))).strip(),
        )
    return None
