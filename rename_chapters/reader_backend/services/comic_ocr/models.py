from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ComicOcrBlock:
    id: str
    box: list[float]
    polygon: list[list[float]]
    source_text: str
    translated_text: str = ""
    confidence: float = 0.0
    order: int = 0
    style_hint: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "box": [float(x) for x in self.box[:4]],
            "polygon": [[float(p[0]), float(p[1])] for p in self.polygon if len(p) >= 2],
            "source_text": str(self.source_text or ""),
            "translated_text": str(self.translated_text or ""),
            "confidence": float(self.confidence or 0.0),
            "order": int(self.order or 0),
            "style_hint": dict(self.style_hint or {}),
        }


@dataclass
class ComicOcrPageResult:
    index: int
    image_url: str
    image_key: str
    width: int = 0
    height: int = 0
    blocks: list[ComicOcrBlock] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "index": int(self.index),
            "image_url": str(self.image_url or ""),
            "image_key": str(self.image_key or ""),
            "width": int(self.width or 0),
            "height": int(self.height or 0),
            "blocks": [block.to_dict() for block in self.blocks],
        }


def page_from_dict(value: dict[str, Any] | None) -> dict[str, Any]:
    data = value if isinstance(value, dict) else {}
    blocks: list[dict[str, Any]] = []
    for item in data.get("blocks") or []:
        if isinstance(item, dict):
            blocks.append(
                {
                    "id": str(item.get("id") or ""),
                    "box": _float_list(item.get("box"), 4),
                    "polygon": _polygon_list(item.get("polygon")),
                    "source_text": str(item.get("source_text") or ""),
                    "translated_text": str(item.get("translated_text") or ""),
                    "confidence": float(item.get("confidence") or 0.0),
                    "order": int(item.get("order") or 0),
                    "style_hint": dict(item.get("style_hint") or {}),
                }
            )
    return {
        "index": int(data.get("index") or 0),
        "image_url": str(data.get("image_url") or ""),
        "image_key": str(data.get("image_key") or ""),
        "width": int(data.get("width") or 0),
        "height": int(data.get("height") or 0),
        "blocks": blocks,
    }


def normalize_pixel_box(
    box: list[float] | tuple[float, ...],
    *,
    width: int,
    height: int,
) -> list[float]:
    if len(box) < 4 or width <= 0 or height <= 0:
        return [0.0, 0.0, 0.0, 0.0]
    x, y, w, h = [float(v or 0.0) for v in box[:4]]
    return [
        _clamp01(x / width),
        _clamp01(y / height),
        _clamp01(w / width),
        _clamp01(h / height),
    ]


def normalize_pixel_polygon(
    points: list[list[float]] | tuple[tuple[float, ...], ...],
    *,
    width: int,
    height: int,
) -> list[list[float]]:
    if width <= 0 or height <= 0:
        return []
    out: list[list[float]] = []
    for point in points or []:
        if len(point) < 2:
            continue
        out.append([_clamp01(float(point[0] or 0.0) / width), _clamp01(float(point[1] or 0.0) / height)])
    return out


def _float_list(value: Any, size: int) -> list[float]:
    raw = value if isinstance(value, list) else []
    out = [float(item or 0.0) for item in raw[:size]]
    while len(out) < size:
        out.append(0.0)
    return out


def _polygon_list(value: Any) -> list[list[float]]:
    raw = value if isinstance(value, list) else []
    out: list[list[float]] = []
    for point in raw:
        if not isinstance(point, list) or len(point) < 2:
            continue
        out.append([float(point[0] or 0.0), float(point[1] or 0.0)])
    return out


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value or 0.0)))
