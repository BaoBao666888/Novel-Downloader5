from __future__ import annotations

from typing import Any
from urllib.parse import parse_qs


def stream_download_jobs(handler, parsed, *, route_support, http_status) -> None:
    params = route_support.parse_download_jobs_query(parse_qs(parsed.query))
    active_only = params.active_only
    book_id = params.book_id
    last_sig = params.last_sig
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
        first = handler.service.list_download_jobs(active_only=active_only, book_id=book_id)
        last_sig = str(first.get("sig") or last_sig)
        handler._write_sse_event("jobs", first, event_id=event_id)
        event_id += 1
        while True:
            payload = handler.service.wait_download_jobs(
                last_sig=last_sig,
                active_only=active_only,
                book_id=book_id,
                timeout_sec=20.0,
            )
            changed = bool(payload.get("changed"))
            if changed:
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
                    "message": str(exc) or "Lỗi stream download jobs.",
                    "book_id": book_id,
                },
                event_id=event_id,
            )
        except OSError as send_exc:
            if handler._is_client_disconnect_error(send_exc):
                return
            raise


def stream_export_jobs(handler, parsed, *, route_support, http_status) -> None:
    params = route_support.parse_export_jobs_query(parse_qs(parsed.query))
    book_id = params.book_id
    last_sig = params.last_sig
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
        first = handler.service.list_export_jobs(book_id=book_id)
        last_sig = str(first.get("sig") or last_sig)
        handler._write_sse_event("jobs", first, event_id=event_id)
        event_id += 1
        while True:
            payload = handler.service.wait_export_jobs(
                last_sig=last_sig,
                book_id=book_id,
                timeout_sec=20.0,
            )
            changed = bool(payload.get("changed"))
            if changed:
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
                    "message": str(exc) or "Lỗi stream export jobs.",
                    "book_id": book_id,
                },
                event_id=event_id,
            )
        except OSError as send_exc:
            if handler._is_client_disconnect_error(send_exc):
                return
            raise


def handle_api(handler, method: str, path: str, query: dict[str, list[str]], *, route_support) -> dict[str, Any] | None:
    route = route_support.match_export_download_route(method, path)
    if route is None:
        return None

    if route.name == "download_jobs":
        params = route_support.parse_download_jobs_query(query)
        return handler.service.list_download_jobs(active_only=params.active_only, book_id=params.book_id_or_none)

    if route.name == "export_jobs":
        params = route_support.parse_export_jobs_query(query)
        return handler.service.list_export_jobs(book_id=params.book_id_or_none)

    if route.name == "book_download":
        payload = handler._read_json_body()
        return handler.service.enqueue_book_download(route.book_id, payload)

    if route.name == "book_export":
        payload = handler._read_json_body()
        options = dict(payload.get("options") or {}) if isinstance(payload.get("options"), dict) else {}
        metadata = dict(payload.get("metadata") or {}) if isinstance(payload.get("metadata"), dict) else {}
        if "ensure_translated" in payload and "use_translated_text" not in options:
            options["use_translated_text"] = bool(payload.get("ensure_translated", False))
        export_payload = dict(payload or {})
        export_payload["options"] = options
        export_payload["metadata"] = metadata
        return handler.service.enqueue_book_export(route.book_id, export_payload)

    if route.name == "export_delete":
        return handler.service.delete_export_job(route.job_id)

    if route.name == "download_stop":
        return handler.service.stop_download_job(route.job_id)

    if route.name == "chapter_download":
        return handler.service.enqueue_chapter_download(route.chapter_id)

    return None
