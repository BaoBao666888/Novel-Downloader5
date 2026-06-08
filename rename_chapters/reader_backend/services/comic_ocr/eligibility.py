from __future__ import annotations

from typing import Any


DEFAULT_SUPPORTED_SOURCE_LANGS = ("en",)
DEFAULT_TARGET_LANG = "vi"


def _string_list(value: Any, *, default: tuple[str, ...]) -> list[str]:
    if not isinstance(value, list):
        return list(default)
    out: list[str] = []
    seen: set[str] = set()
    for item in value:
        text = str(item or "").strip().lower().replace("_", "-").split("-", 1)[0]
        if text and text not in seen:
            seen.add(text)
            out.append(text)
    return out or list(default)


def normalize_comic_ocr_settings(raw: Any, *, parse_bool) -> dict[str, Any]:
    cfg = raw if isinstance(raw, dict) else {}
    supported_source_langs = _string_list(
        cfg.get("supported_source_langs"),
        default=DEFAULT_SUPPORTED_SOURCE_LANGS,
    )
    target_lang = str(cfg.get("target_lang") or DEFAULT_TARGET_LANG).strip().lower() or DEFAULT_TARGET_LANG
    target_lang = target_lang.replace("_", "-").split("-", 1)[0] or DEFAULT_TARGET_LANG
    engine = str(cfg.get("engine") or "paddleocr").strip().lower() or "paddleocr"
    overlay_mode = str(cfg.get("overlay_mode") or "overlay").strip().lower() or "overlay"
    if overlay_mode not in {"overlay", "rendered_image"}:
        overlay_mode = "overlay"
    max_concurrency = _safe_int(cfg.get("max_concurrency"), default=1, min_value=1, max_value=4)
    max_pages_per_job = _safe_int(cfg.get("max_pages_per_job"), default=80, min_value=1, max_value=200)
    return {
        "enabled": bool(parse_bool(cfg.get("enabled"), False)),
        "engine": engine,
        "target_lang": target_lang,
        "supported_source_langs": supported_source_langs,
        "max_concurrency": max_concurrency,
        "max_pages_per_job": max_pages_per_job,
        "overlay_mode": overlay_mode,
        "rendered_image_enabled": bool(parse_bool(cfg.get("rendered_image_enabled"), False)),
    }


def build_default_comic_ocr_config() -> dict[str, Any]:
    return {
        "enabled": False,
        "engine": "paddleocr",
        "target_lang": DEFAULT_TARGET_LANG,
        "supported_source_langs": list(DEFAULT_SUPPORTED_SOURCE_LANGS),
        "max_concurrency": 1,
        "max_pages_per_job": 80,
        "overlay_mode": "overlay",
        "rendered_image_enabled": False,
    }


def comic_ocr_capabilities_for_book(
    book: dict[str, Any] | None,
    *,
    settings: dict[str, Any],
    normalize_lang_source,
) -> dict[str, Any]:
    supported_source_langs = _string_list(
        settings.get("supported_source_langs"),
        default=DEFAULT_SUPPORTED_SOURCE_LANGS,
    )
    target_lang = str(settings.get("target_lang") or DEFAULT_TARGET_LANG).strip().lower() or DEFAULT_TARGET_LANG
    base = {
        "ok": True,
        "eligible": False,
        "reason": "",
        "book_id": str((book or {}).get("book_id") or "").strip(),
        "lang_source": normalize_lang_source(str((book or {}).get("lang_source") or "")),
        "source_lang_required": False,
        "default_source_lang": "",
        "supported_source_langs": supported_source_langs,
        "target_lang": target_lang,
        "mode": str(settings.get("overlay_mode") or "overlay").strip() or "overlay",
        "enabled": bool(settings.get("enabled")),
        "engine": str(settings.get("engine") or "").strip() or "paddleocr",
    }
    if not book:
        base["reason"] = "BOOK_NOT_FOUND"
        return base
    source_type = str(book.get("source_type") or "").strip().lower()
    if source_type not in {"vbook_comic", "vbook_session_comic"}:
        base["reason"] = "UNSUPPORTED_SOURCE_TYPE"
        return base
    lang_source = str(base["lang_source"] or "").strip().lower()
    if lang_source in {"vi", "vie"}:
        base["reason"] = "SOURCE_LANG_VI"
        return base
    if lang_source == "global":
        base["source_lang_required"] = True
    elif lang_source in supported_source_langs:
        base["default_source_lang"] = lang_source
    else:
        base["reason"] = "UNSUPPORTED_SOURCE_LANG"
        return base
    if not bool(settings.get("enabled")):
        base["reason"] = "COMIC_OCR_DISABLED"
        return base
    base["eligible"] = True
    return base


def _safe_int(value: Any, *, default: int, min_value: int, max_value: int) -> int:
    try:
        number = int(value)
    except Exception:
        number = default
    return max(min_value, min(max_value, number))

