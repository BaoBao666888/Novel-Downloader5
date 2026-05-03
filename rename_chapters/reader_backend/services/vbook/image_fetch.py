from __future__ import annotations

import mimetypes
from collections.abc import Callable
from typing import Any
from urllib import error as urllib_error
from urllib import request as urllib_request
from urllib.parse import urlparse

import requests

from reader_backend.core import content_media as content_media_support


def fetch_vbook_image_with_requests(
    *,
    target: str,
    headers: dict[str, str],
    timeout_sec: float,
    api_error_cls: type[Exception],
    http_status: Any,
) -> tuple[bytes, str, str]:
    connect_timeout = max(1.0, min(4.0, float(timeout_sec or 3.0) / 2.0))
    read_timeout = max(2.0, float(timeout_sec or 3.0))
    resp = requests.get(target, headers=headers, timeout=(connect_timeout, read_timeout), stream=True)
    try:
        status = int(resp.status_code)
        if status < 200 or status >= 300:
            raise api_error_cls(
                http_status.BAD_GATEWAY,
                "VBOOK_IMAGE_FETCH_FAILED",
                "Không thể tải ảnh từ nguồn vBook.",
                {"url": target, "status": status, "reason": str(resp.reason or "")},
            )
        data = resp.content
        content_type = str(resp.headers.get("Content-Type") or "").split(";", 1)[0].strip()
        content_encoding = str(resp.headers.get("Content-Encoding") or "").strip()
        return data, content_type, content_encoding
    finally:
        try:
            resp.close()
        except Exception:
            pass


def fetch_vbook_image_with_urllib(
    *,
    target: str,
    headers: dict[str, str],
    timeout_sec: float,
) -> tuple[bytes, str, str]:
    req = urllib_request.Request(target, headers=headers, method="GET")
    with urllib_request.urlopen(req, timeout=max(1.0, float(timeout_sec or 3.0))) as resp:
        data = resp.read()
        content_type = str(resp.headers.get("Content-Type") or "").split(";", 1)[0].strip()
        content_encoding = str(resp.headers.get("Content-Encoding") or "").strip()
    return data, content_type, content_encoding


def fetch_vbook_image(
    *,
    image_url: str,
    plugin_id: str = "",
    referer: str = "",
    use_cache: bool = False,
    timeout_ms: int = 20_000,
    build_headers: Callable[..., dict[str, str]],
    read_cache: Callable[..., tuple[bytes, str] | None],
    write_cache: Callable[..., Any],
    api_error_cls: type[Exception],
    http_status: Any,
) -> tuple[bytes, str]:
    target = str(image_url or "").strip()
    parsed = urlparse(target)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "URL ảnh vBook không hợp lệ.")

    if use_cache:
        cached = read_cache(image_url=target, plugin_id=plugin_id)
        if cached is not None:
            return cached

    headers = build_headers(image_url=target, plugin_id=plugin_id, referer=referer)
    timeout_sec = max(2.0, min(10.0, int(timeout_ms or 20_000) / 1000.0))
    try:
        data, content_type, content_encoding = fetch_vbook_image_with_requests(
            target=target,
            headers=headers,
            timeout_sec=timeout_sec,
            api_error_cls=api_error_cls,
            http_status=http_status,
        )
    except Exception as exc:
        fallback_timeout_sec = max(1.0, min(4.0, timeout_sec / 2.0))
        try:
            data, content_type, content_encoding = fetch_vbook_image_with_urllib(
                target=target,
                headers=headers,
                timeout_sec=fallback_timeout_sec,
            )
        except urllib_error.HTTPError as retry_exc:
            raise api_error_cls(
                http_status.BAD_GATEWAY,
                "VBOOK_IMAGE_FETCH_FAILED",
                "Không thể tải ảnh từ nguồn vBook.",
                {
                    "url": target,
                    "status": int(retry_exc.code),
                    "reason": str(retry_exc.reason or ""),
                    "primary_error": str(exc),
                },
            ) from retry_exc
        except Exception as retry_exc:
            raise api_error_cls(
                http_status.BAD_GATEWAY,
                "VBOOK_IMAGE_FETCH_FAILED",
                "Không thể tải ảnh từ nguồn vBook.",
                {"url": target, "error": str(exc), "retry_error": str(retry_exc)},
            ) from retry_exc

    if not data:
        raise api_error_cls(
            http_status.BAD_GATEWAY,
            "VBOOK_IMAGE_EMPTY",
            "Nguồn ảnh vBook trả dữ liệu rỗng.",
            {"url": target},
        )
    data = content_media_support.decode_http_encoded_body(data, content_encoding=content_encoding)
    content_type = content_type or (mimetypes.guess_type(parsed.path)[0] or "application/octet-stream")
    if use_cache:
        write_cache(
            image_url=target,
            plugin_id=plugin_id,
            content_type=content_type,
            content_encoding="",
            data=data,
        )
    return data, content_type
