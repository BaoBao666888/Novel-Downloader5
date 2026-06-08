from __future__ import annotations

import re
from typing import Any


POSTPROCESS_VERSION = "merge-v2-batch-v1"
_MERGE_MARGIN_X = 0.008
_MERGE_MARGIN_Y = 0.018
_BATCH_MAX_ITEMS = 8
_BATCH_MAX_CHARS = 1400
_MARKER_RE = re.compile(r"\[\[\s*ND5OCR_(\d{4})\s*\]\]")


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
    source_lang: str = "",
    normalize_vi_display_text,
    strict: bool = False,
) -> list[dict[str, Any]]:
    return translate_blocks_batched(
        blocks,
        translator=translator,
        translate_mode=translate_mode,
        source_lang=source_lang,
        normalize_vi_display_text=normalize_vi_display_text,
        strict=strict,
        batch_max_items=1,
        batch_max_chars=_BATCH_MAX_CHARS,
    )


def translate_blocks_batched(
    blocks: list[dict[str, Any]],
    *,
    translator,
    translate_mode: str,
    source_lang: str = "",
    normalize_vi_display_text,
    strict: bool = False,
    batch_max_items: int = _BATCH_MAX_ITEMS,
    batch_max_chars: int = _BATCH_MAX_CHARS,
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for block in blocks or []:
        item = dict(block or {})
        source_text = normalize_ocr_text(item.get("source_text") or "")
        item["source_text"] = source_text
        item["translated_text"] = source_text
        out.append(item)

    indexes = [idx for idx, item in enumerate(out) if str(item.get("source_text") or "").strip()]
    for batch in _iter_translation_batches(indexes, out, batch_max_items=batch_max_items, batch_max_chars=batch_max_chars):
        translated_map: dict[int, str] | None = None
        if len(batch) > 1:
            try:
                translated_map = _translate_batch_with_markers(
                    batch,
                    out,
                    translator=translator,
                    translate_mode=translate_mode,
                    source_lang=source_lang,
                    normalize_vi_display_text=normalize_vi_display_text,
                )
            except Exception:
                if strict:
                    raise
                translated_map = None
        if translated_map is None:
            translated_map = {}
            for idx in batch:
                try:
                    translated_map[idx] = _translate_one(
                        str(out[idx].get("source_text") or ""),
                        translator=translator,
                        translate_mode=translate_mode,
                        source_lang=source_lang,
                        normalize_vi_display_text=normalize_vi_display_text,
                    )
                except Exception:
                    if strict:
                        raise
                    translated_map[idx] = ""
        for idx in batch:
            translated = str(translated_map.get(idx) or "").strip()
            out[idx]["translated_text"] = translated or str(out[idx].get("source_text") or "")
    return out


def _translate_one(
    source_text: str,
    *,
    translator,
    translate_mode: str,
    source_lang: str,
    normalize_vi_display_text,
) -> str:
    if not source_text:
        return ""
    detail = translator.translate_detailed(
        source_text,
        mode=translate_mode,
        source_lang_override=source_lang,
    )
    return normalize_vi_display_text(str(detail.get("translated") or "").strip())


def _translate_batch_with_markers(
    batch: list[int],
    out: list[dict[str, Any]],
    *,
    translator,
    translate_mode: str,
    source_lang: str,
    normalize_vi_display_text,
) -> dict[int, str] | None:
    markers: dict[str, int] = {}
    parts: list[str] = []
    for seq, idx in enumerate(batch, start=1):
        marker_id = f"{seq:04d}"
        marker = f"[[ND5OCR_{marker_id}]]"
        markers[marker_id] = idx
        parts.append(f"{marker}\n{str(out[idx].get('source_text') or '').strip()}")
    payload = "\n".join(parts)
    detail = translator.translate_detailed(
        payload,
        mode=translate_mode,
        source_lang_override=source_lang,
    )
    translated_payload = str(detail.get("translated") or "").strip()
    parsed = _parse_marked_translation(translated_payload, markers)
    if parsed is None:
        return None
    return {idx: normalize_vi_display_text(text.strip()) for idx, text in parsed.items()}


def _parse_marked_translation(value: str, markers: dict[str, int]) -> dict[int, str] | None:
    matches = list(_MARKER_RE.finditer(str(value or "")))
    if len(matches) != len(markers):
        return None
    parsed: dict[int, str] = {}
    for pos, match in enumerate(matches):
        marker_id = match.group(1)
        if marker_id not in markers:
            return None
        start = match.end()
        end = matches[pos + 1].start() if pos + 1 < len(matches) else len(value)
        text = _MARKER_RE.sub("", value[start:end]).strip()
        parsed[markers[marker_id]] = text
    return parsed if len(parsed) == len(markers) else None


def _iter_translation_batches(
    indexes: list[int],
    out: list[dict[str, Any]],
    *,
    batch_max_items: int,
    batch_max_chars: int,
) -> list[list[int]]:
    batches: list[list[int]] = []
    current: list[int] = []
    current_chars = 0
    max_items = max(1, int(batch_max_items or _BATCH_MAX_ITEMS))
    max_chars = max(200, int(batch_max_chars or _BATCH_MAX_CHARS))
    for idx in indexes:
        source_text = str(out[idx].get("source_text") or "").strip()
        next_chars = current_chars + len(source_text) + 18
        if current and (len(current) >= max_items or next_chars > max_chars):
            batches.append(current)
            current = []
            current_chars = 0
        current.append(idx)
        current_chars += len(source_text) + 18
    if current:
        batches.append(current)
    return batches


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
    h_overlap = max(0.0, min(ar, br) - max(ax, bx))
    v_overlap = max(0.0, min(ab, bb) - max(ay, by))
    h_gap = max(0.0, max(ax, bx) - min(ar, br))
    v_gap = max(0.0, max(ay, by) - min(ab, bb))
    min_w = max(0.0001, min(aw, bw))
    min_h = max(0.0001, min(ah, bh))
    h_overlap_ratio = h_overlap / min_w
    v_overlap_ratio = v_overlap / min_h

    if h_gap > _MERGE_MARGIN_X and h_overlap_ratio < 0.35:
        return False
    if h_overlap_ratio < 0.22:
        return False
    if v_gap > max(_MERGE_MARGIN_Y, min(max(ah, bh) * 0.55, 0.038)):
        return False

    union = _union_box(a, b)
    if union[2] > max(aw, bw) * 2.1 and h_overlap_ratio < 0.55:
        return False
    if union[3] > (ah + bh + _MERGE_MARGIN_Y):
        return False
    return bool(v_gap <= _MERGE_MARGIN_Y or v_overlap_ratio > 0.05)


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
