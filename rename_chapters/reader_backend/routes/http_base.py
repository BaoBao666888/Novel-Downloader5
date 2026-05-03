from __future__ import annotations

import io
import json
import re
import uuid
from dataclasses import dataclass
from http import HTTPStatus
from typing import Any
from urllib.parse import unquote

from reader_backend.text import html_utils as html_utils_support


class ApiError(Exception):
    def __init__(self, status: HTTPStatus, error_code: str, message: str, details: Any = None):
        super().__init__(message)
        self.status = status
        self.error_code = error_code
        self.message = message
        self.details = details


@dataclass
class MultipartPart:
    name: str
    filename: str | None
    content: bytes
    text_content: str = ""

    @property
    def file(self) -> io.BytesIO:
        return io.BytesIO(self.content)

    @property
    def text(self) -> str:
        return self.text_content


class MultipartForm:
    def __init__(self):
        self._items: dict[str, list[MultipartPart]] = {}

    def add(self, part: MultipartPart) -> None:
        self._items.setdefault(part.name, []).append(part)

    def __contains__(self, name: str) -> bool:
        return name in self._items and bool(self._items[name])

    def getfirst(self, name: str, default: str | None = None) -> str | None:
        items = self._items.get(name) or []
        if not items:
            return default
        return items[0].text

    def get_file(self, name: str) -> MultipartPart | None:
        items = self._items.get(name) or []
        for item in items:
            if item.filename is not None:
                return item
        return None

    def getlist(self, name: str) -> list[MultipartPart]:
        return list(self._items.get(name) or [])

    def get_files(self, name: str) -> list[MultipartPart]:
        return [item for item in (self._items.get(name) or []) if item.filename is not None]


def read_form_json_field(raw_value: str | None) -> dict[str, Any] | None:
    text = str(raw_value or "").strip()
    if not text:
        return None
    try:
        payload = json.loads(text)
    except Exception as exc:
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_JSON", "JSON trong form không hợp lệ.", str(exc)) from exc
    if payload is None:
        return None
    if not isinstance(payload, dict):
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_JSON", "JSON trong form phải là object.")
    return payload


def read_json_body(headers: Any, rfile: Any) -> dict[str, Any]:
    length = int(headers.get("Content-Length", "0") or "0")
    raw = rfile.read(length) if length > 0 else b"{}"
    if not raw:
        return {}
    try:
        payload = json.loads(raw.decode("utf-8"))
        if isinstance(payload, dict):
            return payload
        raise ValueError("JSON body phải là object")
    except Exception as exc:
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_JSON", "JSON không hợp lệ.", str(exc)) from exc


def extract_disposition_param(header_value: str, key: str) -> str | None:
    pattern = rf'(?:^|;)\s*{re.escape(key)}\*?=(?:"([^"]*)"|([^;]*))'
    match = re.search(pattern, header_value, flags=re.IGNORECASE)
    if not match:
        return None
    value = (match.group(1) if match.group(1) is not None else match.group(2) or "").strip()
    if key.endswith("*") or f"{key}*" in header_value:
        if "''" in value:
            value = value.split("''", 1)[1]
        value = unquote(value)
    return value


def read_multipart_form(headers: Any, rfile: Any) -> MultipartForm:
    content_type = headers.get("Content-Type") or ""
    if not content_type.startswith("multipart/form-data"):
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Yêu cầu phải là multipart/form-data.")

    boundary_match = re.search(r'boundary=(?:"([^"]+)"|([^;]+))', content_type, flags=re.IGNORECASE)
    if not boundary_match:
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu boundary trong multipart/form-data.")
    boundary = (boundary_match.group(1) or boundary_match.group(2) or "").strip()
    if not boundary:
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Boundary multipart không hợp lệ.")

    content_length = int(headers.get("Content-Length", "0") or "0")
    if content_length <= 0:
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Nội dung upload rỗng.")

    body = rfile.read(content_length)
    marker = f"--{boundary}".encode("utf-8", errors="ignore")
    segments = body.split(marker)
    form = MultipartForm()

    for seg in segments:
        if not seg:
            continue
        if seg.startswith(b"--"):
            continue
        if seg.startswith(b"\r\n"):
            seg = seg[2:]
        if seg.endswith(b"\r\n"):
            seg = seg[:-2]
        if not seg:
            continue

        header_blob, sep, content = seg.partition(b"\r\n\r\n")
        if not sep:
            continue

        header_lines = html_utils_support.decode_text_with_fallback(header_blob).split("\r\n")
        headers_map: dict[str, str] = {}
        for line in header_lines:
            if ":" not in line:
                continue
            header_key, value = line.split(":", 1)
            headers_map[header_key.strip().lower()] = value.strip()

        disposition = headers_map.get("content-disposition", "")
        if not disposition:
            continue
        name = extract_disposition_param(disposition, "name")
        if not name:
            continue
        filename = extract_disposition_param(disposition, "filename")
        if filename == "":
            filename = None

        form.add(
            MultipartPart(
                name=name,
                filename=filename,
                content=content,
                text_content=html_utils_support.decode_text_with_fallback(content),
            )
        )

    return form


def write_sse_event(wfile: Any, event: str, payload: dict[str, Any], *, event_id: int | None = None) -> None:
    parts: list[str] = []
    if event_id is not None:
        parts.append(f"id: {int(event_id)}")
    if event:
        parts.append(f"event: {event}")
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    for line in (body.splitlines() or [body]):
        parts.append(f"data: {line}")
    packet = ("\n".join(parts) + "\n\n").encode("utf-8", errors="ignore")
    wfile.write(packet)
    wfile.flush()


def write_sse_comment(wfile: Any, comment: str = "keepalive") -> None:
    packet = f": {comment}\n\n".encode("utf-8", errors="ignore")
    wfile.write(packet)
    wfile.flush()


def is_client_disconnect_error(exc: BaseException) -> bool:
    if isinstance(exc, (BrokenPipeError, ConnectionResetError, ConnectionAbortedError)):
        return True
    if not isinstance(exc, OSError):
        return False
    if getattr(exc, "errno", None) in {32, 104}:
        return True
    if getattr(exc, "winerror", None) in {10053, 10054, 10058}:
        return True
    return False


def send_json(handler: Any, payload: dict[str, Any], trace_id: str | None = None) -> None:
    result = dict(payload)
    if trace_id:
        result["trace_id"] = trace_id
    body = json.dumps(result, ensure_ascii=False).encode("utf-8")
    handler.send_response(HTTPStatus.OK)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    try:
        handler.end_headers()
        handler.wfile.write(body)
    except OSError as exc:
        if is_client_disconnect_error(exc):
            return
        raise


def send_error_json(handler: Any, error: ApiError, trace_id: str | None = None) -> None:
    payload = {
        "error_code": error.error_code,
        "message": error.message,
        "details": error.details,
        "trace_id": trace_id or uuid.uuid4().hex,
    }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(error.status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    try:
        handler.end_headers()
        handler.wfile.write(body)
    except OSError as exc:
        if is_client_disconnect_error(exc):
            return
        raise
