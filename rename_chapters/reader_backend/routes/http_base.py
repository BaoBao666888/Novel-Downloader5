from __future__ import annotations

import io
from dataclasses import dataclass
from http import HTTPStatus
from typing import Any


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
