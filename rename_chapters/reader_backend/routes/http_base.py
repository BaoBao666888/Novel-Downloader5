from __future__ import annotations

import io
import json
import re
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
