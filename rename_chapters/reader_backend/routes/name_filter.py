from __future__ import annotations

from typing import Any
from urllib.parse import parse_qs, unquote


def _query_first(query: dict[str, list[str]], key: str) -> str:
    values = query.get(key)
    if not isinstance(values, list) or not values:
        return ""
    return str(values[0] or "").strip()


def _decoded_query_value(query: dict[str, list[str]], key: str) -> str:
    return unquote(_query_first(query, key))


def _match_path_value(path: str, *, prefix: str, suffix: str = "") -> str | None:
    raw_path = str(path or "")
    if not raw_path.startswith(prefix):
        return None
    if suffix and not raw_path.endswith(suffix):
        return None
    value = raw_path[len(prefix) :]
    if suffix:
        value = value[: -len(suffix)]
    return unquote(value).strip("/")


def stream_name_filter_jobs(handler, parsed, *, http_status) -> None:
    query = parse_qs(parsed.query)
    book_id = _decoded_query_value(query, "book_id")
    last_sig = _query_first(query, "last_sig")
    event_id = 1

    handler.send_response(http_status.OK)
    handler.send_header("Content-Type", "text/event-stream; charset=utf-8")
    handler.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    handler.send_header("Connection", "keep-alive")
    handler.send_header("X-Accel-Buffering", "no")
    try:
        handler.end_headers()
    except OSError as exc:
        if handler._is_client_disconnect_error(exc):
            return
        raise

    try:
        first = handler.service.list_name_filter_jobs(book_id=book_id or None)
        last_sig = str(first.get("sig") or last_sig)
        handler._write_sse_event("jobs", first, event_id=event_id)
        event_id += 1
        while True:
            payload = handler.service.wait_name_filter_jobs(
                last_sig=last_sig,
                book_id=book_id or None,
                timeout_sec=20.0,
            )
            if bool(payload.get("changed")):
                last_sig = str(payload.get("sig") or "")
                handler._write_sse_event("jobs", payload, event_id=event_id)
                event_id += 1
            else:
                handler._write_sse_comment("keepalive")
    except OSError as exc:
        if handler._is_client_disconnect_error(exc):
            return
        raise
    except Exception as exc:
        if handler._is_client_disconnect_error(exc):
            return
        try:
            handler._write_sse_event(
                "error",
                {
                    "error_code": "STREAM_ERROR",
                    "message": str(exc) or "Lỗi stream name filter jobs.",
                    "book_id": book_id,
                },
                event_id=event_id,
            )
        except OSError as send_exc:
            if handler._is_client_disconnect_error(send_exc):
                return
            raise


def handle_api(handler, method: str, path: str, query: dict[str, list[str]]) -> dict[str, Any] | None:
    method_upper = str(method or "").strip().upper()
    raw_path = str(path or "")

    if method_upper == "GET" and raw_path == "/api/library/name-filter/jobs":
        return handler.service.list_name_filter_jobs(book_id=_decoded_query_value(query, "book_id") or None)

    if method_upper == "POST":
        book_id = _match_path_value(raw_path, prefix="/api/library/book/", suffix="/name-filter/jobs")
        if book_id is not None:
            payload = handler._read_json_body()
            return handler.service.enqueue_book_name_filter(book_id, payload)

    return None
