from __future__ import annotations

from typing import Any


TXT_IMPORT_PRESETS: list[dict[str, str]] = [
    {
        "id": "cn_standard",
        "label": "Chương Trung chuẩn",
        "pattern": r"^(?:\s*)(?:第\s*[\d0-9一二三四五六七八九十百千零两]+\s*[章节卷回集部篇])[^\n]{0,120}$",
        "description": "Phù hợp đa số TXT truyện Trung có dạng 第123章 / 第三卷.",
    },
    {
        "id": "vi_standard",
        "label": "Chương tiếng Việt",
        "pattern": r"^(?:\s*)(?:Chương|CHƯƠNG|Chuong|CHUONG)\s*[\dIVXLCDMivxlcdm]+[^\n]{0,120}$",
        "description": "Bắt dòng tiêu đề dạng Chương 12 / CHƯƠNG IV.",
    },
    {
        "id": "en_standard",
        "label": "Chapter tiếng Anh",
        "pattern": r"^(?:\s*)(?:Chapter|CHAPTER)\s*[\dIVXLCDMivxlcdm]+[^\n]{0,120}$",
        "description": "Bắt dòng tiêu đề dạng Chapter 12 / CHAPTER IV.",
    },
    {
        "id": "dual_numbered_pipe",
        "label": "Mã số | số chương",
        "pattern": r"^(?:\s*)\d{1,4}\s*[｜|]\s*\d{1,4}[\.、．]\s*[^\d\s][^\n]{0,80}$",
        "description": "Phù hợp TXT có dòng kiểu 001｜1.Tên chương.",
    },
    {
        "id": "short_numbered",
        "label": "Dòng số thứ tự ngắn",
        "pattern": r"^(?:\s*)(?:\d{1,5}|[一二三四五六七八九十百千零两]{1,8})[\.\-、:： )）]\s*[^\d\s][^\n]{0,80}$",
        "description": "Dùng cho TXT có tiêu đề ngắn kiểu 12. Tên chương / 12- Tên chương.",
    },
    {
        "id": "number_space_title",
        "label": "Số thứ tự + khoảng trắng",
        "pattern": r"^(?:\s*)\d{1,4}\s+[^\d\s][^\n]{1,80}$",
        "description": "Dùng cho TXT có dòng tiêu đề kiểu 1 Tên chương.",
    },
]

DEFAULT_READER_IMPORT_SETTINGS: dict[str, Any] = {
    "txt": {
        "target_size": 4500,
        "preface_title": "Mở đầu",
        "heading_patterns": [item["pattern"] for item in TXT_IMPORT_PRESETS],
    },
    "epub": {
        "title_keys": ["title", "book-title"],
        "author_keys": ["creator", "author"],
        "summary_keys": ["description", "summary", "intro", "abstract", "subject"],
        "language_keys": ["language"],
        "cover_meta_names": ["cover"],
        "cover_properties": ["cover-image"],
    },
}


def normalize_metadata_key(value: Any) -> str:
    text = str(value or "").strip().lower()
    if not text:
        return ""
    if "}" in text:
        text = text.split("}", 1)[1]
    if ":" in text:
        text = text.split(":", 1)[1]
    return text.replace("_", "-").strip()


def normalize_import_list(value: Any, fallback: list[str] | tuple[str, ...]) -> list[str]:
    if isinstance(value, list):
        raw_items = value
    elif isinstance(value, tuple):
        raw_items = list(value)
    else:
        text = str(value or "").replace("\r\n", "\n").replace("\r", "\n")
        raw_items = text.split("\n") if text else []
    out: list[str] = []
    seen: set[str] = set()
    for item in raw_items:
        text = str(item or "").strip()
        if not text:
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(text)
    if out:
        return out
    return [str(x).strip() for x in fallback if str(x).strip()]


def normalize_reader_import_settings(raw_cfg: dict[str, Any] | None = None) -> dict[str, Any]:
    raw = raw_cfg if isinstance(raw_cfg, dict) else {}
    txt_raw = raw.get("txt") if isinstance(raw.get("txt"), dict) else {}
    epub_raw = raw.get("epub") if isinstance(raw.get("epub"), dict) else {}

    txt_default = DEFAULT_READER_IMPORT_SETTINGS["txt"]
    epub_default = DEFAULT_READER_IMPORT_SETTINGS["epub"]

    try:
        target_size = int(txt_raw.get("target_size") or txt_default["target_size"])
    except Exception:
        target_size = int(txt_default["target_size"])
    target_size = max(800, min(30000, target_size))

    txt_patterns = normalize_import_list(
        txt_raw.get("heading_patterns"),
        txt_default["heading_patterns"],
    )

    return {
        "txt": {
            "target_size": target_size,
            "preface_title": str(txt_raw.get("preface_title") or txt_default["preface_title"]).strip() or "Mở đầu",
            "heading_patterns": txt_patterns,
        },
        "epub": {
            "title_keys": normalize_import_list(epub_raw.get("title_keys"), epub_default["title_keys"]),
            "author_keys": normalize_import_list(epub_raw.get("author_keys"), epub_default["author_keys"]),
            "summary_keys": normalize_import_list(epub_raw.get("summary_keys"), epub_default["summary_keys"]),
            "language_keys": normalize_import_list(epub_raw.get("language_keys"), epub_default["language_keys"]),
            "cover_meta_names": normalize_import_list(epub_raw.get("cover_meta_names"), epub_default["cover_meta_names"]),
            "cover_properties": normalize_import_list(epub_raw.get("cover_properties"), epub_default["cover_properties"]),
        },
    }


def import_settings_presets() -> dict[str, Any]:
    return {
        "txt_patterns": [dict(item) for item in TXT_IMPORT_PRESETS],
        "epub_fields": {
            "title_keys": list(DEFAULT_READER_IMPORT_SETTINGS["epub"]["title_keys"]),
            "author_keys": list(DEFAULT_READER_IMPORT_SETTINGS["epub"]["author_keys"]),
            "summary_keys": list(DEFAULT_READER_IMPORT_SETTINGS["epub"]["summary_keys"]),
            "language_keys": list(DEFAULT_READER_IMPORT_SETTINGS["epub"]["language_keys"]),
            "cover_meta_names": list(DEFAULT_READER_IMPORT_SETTINGS["epub"]["cover_meta_names"]),
            "cover_properties": list(DEFAULT_READER_IMPORT_SETTINGS["epub"]["cover_properties"]),
        },
    }

