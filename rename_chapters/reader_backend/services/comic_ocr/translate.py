from __future__ import annotations

from typing import Any


def translate_blocks(
    blocks: list[dict[str, Any]],
    *,
    translator,
    translate_mode: str,
    normalize_vi_display_text,
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for block in blocks or []:
        item = dict(block or {})
        source_text = str(item.get("source_text") or "").strip()
        translated = ""
        if source_text:
            try:
                detail = translator.translate_detailed(source_text, mode=translate_mode)
                translated = normalize_vi_display_text(str(detail.get("translated") or "").strip())
            except Exception:
                translated = ""
        item["translated_text"] = translated or source_text
        out.append(item)
    return out
