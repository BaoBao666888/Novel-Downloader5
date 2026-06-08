from __future__ import annotations

import re
from typing import Any


POSTPROCESS_VERSION = "merge-v1"
_MERGE_MARGIN_X = 0.025
_MERGE_MARGIN_Y = 0.025


def merge_nearby_blocks(blocks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for block in blocks or []:
        if not isinstance(block, dict):
            continue
        box = _block_box(block)
        source_text = normalize_ocr_text(block.get("source_text") or block.get("text") or "")
        if box is None or not source_text:
            continue
        item = dict(block)
        item["box"] = box
        item["source_text"] = source_text
        item["_merge_parts"] = [(box, source_text)]
        rows.append(item)

    changed = True
    while changed:
        changed = False
        for i in range(len(rows)):
            if changed:
                break
            for j in range(i + 1, len(rows)):
                if not _boxes_should_merge(rows[i]["box"], rows[j]["box"]):
                    continue
                rows[i] = _merge_two_blocks(rows[i], rows[j])
                rows.pop(j)
                changed = True
                break

    out: list[dict[str, Any]] = []
    for row in rows:
        item = dict(row)
        parts = item.pop("_merge_parts", [])
        texts = [
            text
            for _box, text in sorted(parts, key=lambda pair: (_box_sort_key(pair[0])))
            if text
        ]
        item["source_text"] = normalize_ocr_text(" ".join(texts))
        item["polygon"] = _box_polygon(item["box"])
        out.append(item)
    return sorted(out, key=lambda item: _box_sort_key(item.get("box") or [0, 0, 0, 0]))


def normalize_ocr_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def translate_blocks(
    blocks: list[dict[str, Any]],
    *,
    translator,
    translate_mode: str,
    normalize_vi_display_text,
    strict: bool = False,
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for block in blocks or []:
        item = dict(block or {})
        source_text = normalize_ocr_text(item.get("source_text") or "")
        item["source_text"] = source_text
        translated = ""
        if source_text:
            try:
                detail = translator.translate_detailed(source_text, mode=translate_mode)
                translated = normalize_vi_display_text(str(detail.get("translated") or "").strip())
            except Exception:
                if strict:
                    raise
                translated = ""
        item["translated_text"] = translated or source_text
        out.append(item)
    return out


def _block_box(block: dict[str, Any]) -> list[float] | None:
    raw = block.get("box")
    if not isinstance(raw, (list, tuple)) or len(raw) < 4:
        return None
    try:
        x, y, w, h = [float(value or 0.0) for value in raw[:4]]
    except Exception:
        return None
    x = _clamp01(x)
    y = _clamp01(y)
    w = _clamp01(w)
    h = _clamp01(h)
    if not (w > 0 and h > 0):
        return None
    return [x, y, w, h]


def _boxes_should_merge(a: list[float], b: list[float]) -> bool:
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    ar = ax + aw
    ab = ay + ah
    br = bx + bw
    bb = by + bh
    margin_x = max(_MERGE_MARGIN_X, min(max(aw, bw) * 0.28, 0.045))
    margin_y = max(_MERGE_MARGIN_Y, min(max(ah, bh) * 0.85, 0.05))
    return not (
        ar + margin_x < bx
        or br + margin_x < ax
        or ab + margin_y < by
        or bb + margin_y < ay
    )


def _merge_two_blocks(a: dict[str, Any], b: dict[str, Any]) -> dict[str, Any]:
    box = _union_box(a["box"], b["box"])
    merged = dict(a)
    merged["box"] = box
    merged["polygon"] = _box_polygon(box)
    merged["confidence"] = _avg_float(a.get("confidence"), b.get("confidence"))
    merged["_merge_parts"] = list(a.get("_merge_parts") or []) + list(b.get("_merge_parts") or [])
    return merged


def _union_box(a: list[float], b: list[float]) -> list[float]:
    left = min(a[0], b[0])
    top = min(a[1], b[1])
    right = max(a[0] + a[2], b[0] + b[2])
    bottom = max(a[1] + a[3], b[1] + b[3])
    return [
        _clamp01(left),
        _clamp01(top),
        _clamp01(right - left),
        _clamp01(bottom - top),
    ]


def _box_polygon(box: list[float]) -> list[list[float]]:
    x, y, w, h = box
    return [[x, y], [_clamp01(x + w), y], [_clamp01(x + w), _clamp01(y + h)], [x, _clamp01(y + h)]]


def _box_sort_key(box: list[float]) -> tuple[float, float]:
    return (round(float(box[1] or 0.0) / 0.025) * 0.025, float(box[0] or 0.0))


def _avg_float(a: Any, b: Any) -> float:
    values: list[float] = []
    for value in (a, b):
        try:
            values.append(float(value or 0.0))
        except Exception:
            pass
    return sum(values) / len(values) if values else 0.0


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value or 0.0)))
