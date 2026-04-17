from __future__ import annotations

from typing import Any
from urllib.parse import parse_qs


def _parse_limit(query: dict[str, list[str]], *, default: int = 120) -> int:
    raw = ""
    try:
        raw = str((query.get("limit") or [""])[0] or "").strip()
    except Exception:
        raw = ""
    try:
        value = int(raw) if raw else default
    except Exception:
        value = default
    return max(1, min(300, value))


def stream_notifications(handler, parsed, *, http_status) -> None:
    query = parse_qs(parsed.query)
    last_sig = str((query.get("last_sig") or [""])[0] or "")
    limit = _parse_limit(query)
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
        first = handler.service.list_notifications(limit=limit)
        last_sig = str(first.get("sig") or last_sig)
        handler._write_sse_event("notifications", first, event_id=event_id)
        event_id += 1
        while True:
            payload = handler.service.wait_notifications(
                last_sig=last_sig,
                limit=limit,
                timeout_sec=20.0,
            )
            changed = bool(payload.get("changed"))
            if changed:
                last_sig = str(payload.get("sig") or "")
                handler._write_sse_event("notifications", payload, event_id=event_id)
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
                    "message": str(exc) or "Lỗi stream notifications.",
                },
                event_id=event_id,
            )
        except OSError as send_exc:
            if handler._is_client_disconnect_error(send_exc):
                return
            raise


def handle_api(
    handler,
    method: str,
    path: str,
    query: dict[str, list[str]],
    *,
    api_error_cls,
    http_status,
) -> dict[str, Any] | None:
    api_error = api_error_cls

    if method == "GET" and path == "/api/notifications":
        return handler.service.list_notifications(limit=_parse_limit(query))

    if method == "POST" and path == "/api/notifications/task":
        payload = handler._read_json_body()
        if not isinstance(payload, dict):
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Payload notification không hợp lệ.")
        return handler.service.upsert_notification_task(payload)

    if method == "POST" and path == "/api/notifications/read":
        payload = handler._read_json_body()
        ids = payload.get("ids")
        read = bool(payload.get("read", True))
        return handler.service.mark_notifications_read(ids, read=read)

    if method == "POST" and path == "/api/notifications/delete":
        payload = handler._read_json_body()
        return handler.service.delete_notifications(payload.get("ids"))

    if method == "POST" and path == "/api/notifications/clear":
        payload = handler._read_json_body()
        scope = str(payload.get("scope") or "read").strip().lower() or "read"
        return handler.service.clear_notifications(scope=scope)

    return None
