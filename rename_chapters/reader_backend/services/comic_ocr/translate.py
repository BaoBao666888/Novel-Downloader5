from __future__ import annotations

import re
from typing import Any


POSTPROCESS_VERSION = "layout-crop-v1-batch-v1-case-v1"
_MERGE_MARGIN_X = 0.008
_MERGE_MARGIN_Y = 0.018
_MERGE_MAX_UNION_W = 0.34
_MERGE_MAX_UNION_H = 0.42
_BATCH_MAX_ITEMS = 8
_BATCH_MAX_CHARS = 1400
_MARKER_RE = re.compile(r"\[\[\s*ND5OCR_(\d{4})\s*\]\]")
_WORD_RE = re.compile(r"[^\W\d_]+(?:[-'’][^\W\d_]+)*", re.UNICODE)
_CJK_RE = re.compile(r"[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]")
_HONORIFIC_SUFFIXES = {
    "CHAN",
    "DONO",
    "KUN",
    "SAMA",
    "SAN",
    "SENSEI",
    "SENPAI",
}
_PRESERVE_UPPER_TOKENS = {
    "CPU",
    "DNA",
    "EU",
    "FBI",
    "GPU",
    "GPS",
    "HTTP",
    "HTTPS",
    "ID",
    "NASA",
    "OCR",
    "PC",
    "PDF",
    "TV",
    "UK",
    "UN",
    "URL",
    "USA",
    "VIP",
}
_ROMAN_TOKENS = {
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
    "XIII",
    "XIV",
    "XV",
    "XVI",
    "XVII",
    "XVIII",
    "XIX",
    "XX",
}
_CJK_LANG_PREFIXES = ("zh", "ch", "cn", "zho", "ja", "jp", "jpn", "ko", "kr", "kor", "korean")


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


def normalize_ocr_text_for_translation(value: Any, *, source_lang: str = "") -> str:
    text = normalize_ocr_text(value)
    if not _should_normalize_case(text, source_lang=source_lang, min_letters=6):
        return text
    return _sentence_case_upper_text(text, english_i=_is_english_lang(source_lang), preserve_upper=True)


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
        item["_translation_source_text"] = normalize_ocr_text_for_translation(source_text, source_lang=source_lang)
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
                        str(out[idx].get("_translation_source_text") or out[idx].get("source_text") or ""),
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
    for item in out:
        item.pop("_translation_source_text", None)
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
    return _normalize_translated_display_text(str(detail.get("translated") or "").strip(), normalize_vi_display_text)


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
        source_text = str(out[idx].get("_translation_source_text") or out[idx].get("source_text") or "").strip()
        parts.append(f"{marker}\n{source_text}")
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
    return {idx: _normalize_translated_display_text(text.strip(), normalize_vi_display_text) for idx, text in parsed.items()}


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
        source_text = str(out[idx].get("_translation_source_text") or out[idx].get("source_text") or "").strip()
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


def _normalize_translated_display_text(value: str, normalize_vi_display_text) -> str:
    text = normalize_vi_display_text(str(value or "").strip())
    if not _should_normalize_case(text, source_lang="", min_letters=8):
        return text
    return normalize_vi_display_text(_sentence_case_upper_text(text, english_i=False, preserve_upper=True))


def _should_normalize_case(text: str, *, source_lang: str, min_letters: int) -> bool:
    value = str(text or "").strip()
    if not value:
        return False
    lang = _normalize_lang(source_lang)
    if lang.startswith(_CJK_LANG_PREFIXES) or _CJK_RE.search(value):
        return False
    letters = [ch for ch in value if ch.isalpha()]
    if len(letters) < min_letters:
        return False
    upper_count = sum(1 for ch in letters if ch.isupper())
    lower_count = sum(1 for ch in letters if ch.islower())
    total = upper_count + lower_count
    if not total:
        return False
    return (upper_count / total) >= 0.72 and lower_count <= max(2, int(total * 0.18))


def _sentence_case_upper_text(text: str, *, english_i: bool, preserve_upper: bool) -> str:
    lowered = _WORD_RE.sub(
        lambda match: _normalize_upper_word(match.group(0), english_i=english_i, preserve_upper=preserve_upper),
        str(text or ""),
    )
    chars = list(lowered)
    cap_next = True
    sentence_breakers = {".", "!", "?", ";", ":", "…", "\n", "。", "！", "？", "；", "："}
    skippable = {" ", "\t", "\"", "'", "“", "”", "‘", "’", "(", "[", "{", "<", "-", "—", "–", "―", "*", "•", ">", "»", "«"}
    for idx, ch in enumerate(chars):
        if cap_next:
            if ch.isalpha():
                chars[idx] = ch.upper()
                cap_next = False
                continue
            if ch.isdigit():
                cap_next = False
                continue
            if ch in skippable or ch.isspace():
                continue
            cap_next = False
        if ch in sentence_breakers:
            cap_next = True
    value = "".join(chars).strip()
    if english_i:
        value = re.sub(r"\bi\b", "I", value)
        value = re.sub(r"\bi(['’](?:m|d|ll|ve|re))\b", lambda match: "I" + match.group(1), value, flags=re.IGNORECASE)
    return value


def _normalize_upper_word(token: str, *, english_i: bool, preserve_upper: bool) -> str:
    value = str(token or "")
    if not value:
        return value
    letters = [ch for ch in value if ch.isalpha()]
    if not letters or any(ch.islower() for ch in letters):
        return value
    upper = value.upper()
    if preserve_upper and (upper in _PRESERVE_UPPER_TOKENS or upper in _ROMAN_TOKENS):
        return upper
    if english_i and upper in {"I", "I'M", "I’M", "I'D", "I’D", "I'LL", "I’LL", "I'VE", "I’VE", "I'RE", "I’RE"}:
        return value[:1].upper() + value[1:].lower()
    honorific = _format_honorific_name(value)
    if honorific:
        return honorific
    return value.lower()


def _format_honorific_name(token: str) -> str:
    parts = re.split(r"([-])", str(token or ""))
    if len(parts) < 3:
        return ""
    words = parts[::2]
    separators = parts[1::2]
    if len(words) < 2 or words[-1].upper() not in _HONORIFIC_SUFFIXES:
        return ""
    out: list[str] = []
    for idx, word in enumerate(words):
        upper = word.upper()
        if idx == 0:
            out.append(upper[:1] + upper[1:].lower())
        elif upper in _HONORIFIC_SUFFIXES:
            out.append(upper.lower())
        else:
            out.append(upper[:1] + upper[1:].lower())
        if idx < len(separators):
            out.append(separators[idx])
    return "".join(out)


def _normalize_lang(source_lang: str) -> str:
    return str(source_lang or "").strip().lower().replace("_", "-").split("-", 1)[0]


def _is_english_lang(source_lang: str) -> bool:
    return _normalize_lang(source_lang) in {"en", "eng"}


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
    if union[2] > _MERGE_MAX_UNION_W or union[3] > _MERGE_MAX_UNION_H:
        return False
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
