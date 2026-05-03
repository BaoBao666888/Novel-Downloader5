"""Request envelope for API dispatch, logging, and error serialization."""

from __future__ import annotations

import time
import traceback
import uuid
from typing import Any
from urllib.parse import parse_qs


def dispatch_api_request(
    handler: Any,
    method: str,
    parsed: Any,
    *,
    api_error_cls: type[Exception],
    http_status: Any,
    safe_console_print: Any,
) -> None:
    trace_id = uuid.uuid4().hex
    started_perf = time.perf_counter()
    try:
        handler.service.refresh_config()
        data = handler._handle_api(method, parsed)
        handler._send_json(data, trace_id=trace_id)
        handler.service.debug_log(
            "api_request",
            trace_id=trace_id,
            method=method,
            path=parsed.path,
            query_keys=sorted(parse_qs(parsed.query).keys()),
            status="ok",
            duration_ms=round((time.perf_counter() - started_perf) * 1000, 1),
        )
    except api_error_cls as exc:
        try:
            handler.service.debug_log(
                "api_request",
                trace_id=trace_id,
                method=method,
                path=parsed.path,
                status="api_error",
                error_code=getattr(exc, "error_code", ""),
                message=getattr(exc, "message", ""),
                duration_ms=round((time.perf_counter() - started_perf) * 1000, 1),
            )
        except Exception:
            pass
        try:
            handler._send_error_json(exc, trace_id=trace_id)
        except OSError as send_exc:
            if handler._is_client_disconnect_error(send_exc):
                return
            raise
    except Exception as exc:
        if handler._is_client_disconnect_error(exc):
            return
        details = {
            "exception": exc.__class__.__name__,
            "traceback": traceback.format_exc(limit=5),
        }
        try:
            handler.service.debug_log(
                "api_request",
                trace_id=trace_id,
                method=method,
                path=parsed.path,
                status="exception",
                exception=exc.__class__.__name__,
                message=str(exc),
                duration_ms=round((time.perf_counter() - started_perf) * 1000, 1),
            )
        except Exception:
            pass
        try:
            safe_console_print(
                f"[API ERROR] trace_id={trace_id} method={method} path={parsed.path}\n{details['traceback']}"
            )
        except Exception:
            pass
        try:
            handler._send_error_json(
                api_error_cls(http_status.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Lỗi hệ thống nội bộ.", details),
                trace_id=trace_id,
            )
        except OSError as send_exc:
            if handler._is_client_disconnect_error(send_exc):
                return
            raise
