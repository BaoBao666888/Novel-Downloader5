from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from reader_backend.services.comic_ocr import models


def comic_ocr_root(cache_dir: Path) -> Path:
    root = cache_dir / "comic_ocr"
    (root / "results").mkdir(parents=True, exist_ok=True)
    (root / "rendered").mkdir(parents=True, exist_ok=True)
    (root / "jobs").mkdir(parents=True, exist_ok=True)
    return root


def page_cache_key(
    *,
    book_id: str,
    chapter_id: str,
    image_key: str,
    source_lang: str,
    target_lang: str,
    engine: str,
    engine_version: str,
    translation_signature: str,
    hash_text,
) -> str:
    seed = "|".join(
        [
            str(book_id or "").strip(),
            str(chapter_id or "").strip(),
            str(image_key or "").strip(),
            str(source_lang or "").strip(),
            str(target_lang or "").strip(),
            str(engine or "").strip(),
            str(engine_version or "").strip(),
            str(translation_signature or "").strip(),
        ]
    )
    return f"{_safe_part(book_id)}__{_safe_part(chapter_id)}__{hash_text(seed)}"


def ocr_page_cache_key(
    *,
    book_id: str,
    chapter_id: str,
    image_key: str,
    source_lang: str,
    engine: str,
    engine_version: str,
    ocr_settings_signature: str,
    hash_text,
) -> str:
    seed = "|".join(
        [
            str(book_id or "").strip(),
            str(chapter_id or "").strip(),
            str(image_key or "").strip(),
            str(source_lang or "").strip(),
            str(engine or "").strip(),
            str(engine_version or "").strip(),
            str(ocr_settings_signature or "").strip(),
        ]
    )
    return f"{_safe_part(book_id)}__{_safe_part(chapter_id)}__{hash_text(seed)}"


def translation_page_cache_key(
    *,
    book_id: str,
    chapter_id: str,
    image_key: str,
    source_lang: str,
    target_lang: str,
    ocr_page_key: str,
    translation_signature: str,
    translation_version: str,
    hash_text,
) -> str:
    seed = "|".join(
        [
            str(book_id or "").strip(),
            str(chapter_id or "").strip(),
            str(image_key or "").strip(),
            str(source_lang or "").strip(),
            str(target_lang or "").strip(),
            str(ocr_page_key or "").strip(),
            str(translation_signature or "").strip(),
            str(translation_version or "").strip(),
        ]
    )
    return f"{_safe_part(book_id)}__{_safe_part(chapter_id)}__{hash_text(seed)}"


def chapter_cache_key(
    *,
    book_id: str,
    chapter_id: str,
    source_lang: str,
    target_lang: str,
    engine: str,
    engine_version: str,
    translation_signature: str,
    hash_text,
) -> str:
    seed = "|".join(
        [
            str(book_id or "").strip(),
            str(chapter_id or "").strip(),
            "chapter",
            str(source_lang or "").strip(),
            str(target_lang or "").strip(),
            str(engine or "").strip(),
            str(engine_version or "").strip(),
            str(translation_signature or "").strip(),
        ]
    )
    return f"{_safe_part(book_id)}__{_safe_part(chapter_id)}__{hash_text(seed)}"


def translation_chapter_cache_key(
    *,
    book_id: str,
    chapter_id: str,
    source_lang: str,
    target_lang: str,
    engine: str,
    engine_version: str,
    ocr_settings_signature: str,
    translation_signature: str,
    translation_version: str,
    hash_text,
) -> str:
    seed = "|".join(
        [
            str(book_id or "").strip(),
            str(chapter_id or "").strip(),
            "translation_chapter",
            str(source_lang or "").strip(),
            str(target_lang or "").strip(),
            str(engine or "").strip(),
            str(engine_version or "").strip(),
            str(ocr_settings_signature or "").strip(),
            str(translation_signature or "").strip(),
            str(translation_version or "").strip(),
        ]
    )
    return f"{_safe_part(book_id)}__{_safe_part(chapter_id)}__{hash_text(seed)}"


def read_page(cache_dir: Path, key: str) -> dict[str, Any] | None:
    path = _json_path(cache_dir, "pages", key)
    data = _read_json(path)
    if not isinstance(data, dict):
        return None
    return models.page_from_dict(data)


def write_page(cache_dir: Path, key: str, page: dict[str, Any]) -> None:
    path = _json_path(cache_dir, "pages", key)
    _write_json(path, models.page_from_dict(page))


def read_ocr_page(cache_dir: Path, key: str) -> dict[str, Any] | None:
    path = _json_path(cache_dir, "ocr_pages", key)
    data = _read_json(path)
    if not isinstance(data, dict):
        return None
    return models.page_from_dict(data)


def write_ocr_page(cache_dir: Path, key: str, page: dict[str, Any]) -> None:
    path = _json_path(cache_dir, "ocr_pages", key)
    _write_json(path, models.page_from_dict(page))


def read_translation_page(cache_dir: Path, key: str) -> dict[str, Any] | None:
    path = _json_path(cache_dir, "translation_pages", key)
    data = _read_json(path)
    if not isinstance(data, dict):
        return None
    return models.page_from_dict(data)


def write_translation_page(cache_dir: Path, key: str, page: dict[str, Any]) -> None:
    path = _json_path(cache_dir, "translation_pages", key)
    _write_json(path, models.page_from_dict(page))


def read_chapter(cache_dir: Path, key: str) -> dict[str, Any] | None:
    path = _json_path(cache_dir, "chapters", key)
    data = _read_json(path)
    return data if isinstance(data, dict) else None


def write_chapter(cache_dir: Path, key: str, result: dict[str, Any]) -> None:
    path = _json_path(cache_dir, "chapters", key)
    _write_json(path, result if isinstance(result, dict) else {})


def read_translation_chapter(cache_dir: Path, key: str) -> dict[str, Any] | None:
    path = _json_path(cache_dir, "translation_chapters", key)
    data = _read_json(path)
    return data if isinstance(data, dict) else None


def write_translation_chapter(cache_dir: Path, key: str, result: dict[str, Any]) -> None:
    path = _json_path(cache_dir, "translation_chapters", key)
    _write_json(path, result if isinstance(result, dict) else {})


def delete_chapter_family(cache_dir: Path, *, book_id: str, chapter_id: str) -> int:
    root = comic_ocr_root(cache_dir) / "results"
    prefix = f"{str(book_id or '').strip()}__{str(chapter_id or '').strip()}__"
    return _delete_matching(root, prefix=prefix, folder_names=_RESULT_FOLDERS)


def delete_book_family(cache_dir: Path, *, book_id: str) -> int:
    root = comic_ocr_root(cache_dir) / "results"
    prefix = f"{str(book_id or '').strip()}__"
    return _delete_matching(root, prefix=prefix, folder_names=_RESULT_FOLDERS)


def delete_book_translation_family(cache_dir: Path, *, book_id: str) -> int:
    root = comic_ocr_root(cache_dir) / "results"
    prefix = f"{str(book_id or '').strip()}__"
    return _delete_matching(root, prefix=prefix, folder_names=("pages", "chapters", "translation_pages", "translation_chapters"))


def _delete_matching(root: Path, *, prefix: str, folder_names: tuple[str, ...]) -> int:
    deleted = 0
    if not prefix.strip("_"):
        return 0
    for folder_name in folder_names:
        folder = root / folder_name
        if not folder.exists():
            continue
        for path in folder.glob(f"{prefix}*.json"):
            try:
                path.unlink()
                deleted += 1
            except OSError:
                pass
    return deleted


def _json_path(cache_dir: Path, folder_name: str, key: str) -> Path:
    root = comic_ocr_root(cache_dir) / "results" / folder_name
    root.mkdir(parents=True, exist_ok=True)
    safe_key = "".join(ch if ch.isalnum() or ch in {"_", "-"} else "_" for ch in str(key or "").strip())
    if not safe_key:
        safe_key = "empty"
    return root / f"{safe_key}.json"


def _safe_part(value: str) -> str:
    text = str(value or "").strip()
    out = "".join(ch if ch.isalnum() or ch in {"_", "-"} else "_" for ch in text)
    return out or "empty"


_RESULT_FOLDERS = (
    "pages",
    "chapters",
    "ocr_pages",
    "translation_pages",
    "translation_chapters",
)


def _read_json(path: Path) -> Any:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)
