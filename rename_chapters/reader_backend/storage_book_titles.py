from __future__ import annotations

from pathlib import Path
from typing import Any


def translate_book_titles(
    storage,
    book_id: str,
    translator,
    translate_mode: str,
    *,
    name_set_override: dict[str, str] | None = None,
    vp_set_override: dict[str, str] | None = None,
    utc_now_iso,
    book_supports_translation,
    normalize_vi_display_text,
    author_to_hanviet_display,
) -> None:
    book = storage.find_book(book_id)
    if not book:
        return

    now = utc_now_iso()
    can_translate = bool(book_supports_translation(book))
    with storage._connect() as conn:
        raw_author = (book.get("author") or "").strip()
        vi_author = (book.get("author_vi") or "").strip()
        author_display = author_to_hanviet_display(raw_author, single_line=True) if raw_author else ""
        if author_display and author_display != vi_author:
            conn.execute(
                "UPDATE books SET author_vi = ?, updated_at = ? WHERE book_id = ?",
                (author_display, now, book_id),
            )

        if can_translate:
            raw_title = (book.get("title") or "").strip()
            vi_title = (book.get("title_vi") or "").strip()
            if raw_title and (not vi_title):
                vi_title = normalize_vi_display_text(
                    translator.translate_detailed(
                        raw_title,
                        mode=translate_mode,
                        name_set_override=name_set_override,
                        vp_set_override=vp_set_override,
                    ).get("translated", "")
                )
            elif vi_title:
                vi_title = normalize_vi_display_text(vi_title)
            if vi_title:
                conn.execute(
                    "UPDATE books SET title_vi = ?, updated_at = ? WHERE book_id = ?",
                    (vi_title, now, book_id),
                )

        rows = conn.execute(
            "SELECT chapter_id, title_raw, title_vi FROM chapters WHERE book_id = ? ORDER BY chapter_order",
            (book_id,),
        ).fetchall()
        for row in rows:
            raw_title = (row["title_raw"] or "").strip()
            vi_title = (row["title_vi"] or "").strip()
            if not raw_title and not vi_title:
                continue
            if raw_title and not vi_title and can_translate:
                translated = normalize_vi_display_text(
                    translator.translate_detailed(
                        raw_title,
                        mode=translate_mode,
                        name_set_override=name_set_override,
                        vp_set_override=vp_set_override,
                    ).get("translated", "")
                )
            else:
                translated = normalize_vi_display_text(vi_title)
            if translated:
                conn.execute(
                    "UPDATE chapters SET title_vi = ?, updated_at = ? WHERE chapter_id = ?",
                    (translated, now, row["chapter_id"]),
                )


def comic_raw_cache_complete(
    raw_text: str | None,
    *,
    plugin_id: str = "",
    extract_comic_image_urls,
    vbook_image_cache_key,
    image_cache_dir: Path,
) -> bool:
    images = extract_comic_image_urls(raw_text)
    if not images:
        return False
    for image_url in images:
        key = vbook_image_cache_key(image_url=image_url, plugin_id=plugin_id)
        body = image_cache_dir / f"{key}.bin"
        if not body.exists():
            return False
    return True


def chapter_cache_available(
    raw_text: str | None,
    *,
    book: dict[str, Any] | None,
    is_book_comic,
    chapter_raw_cache_has_payload,
    extract_comic_image_urls,
    vbook_image_cache_key,
    image_cache_dir: Path,
) -> bool:
    text = str(raw_text or "")
    is_comic = bool(is_book_comic(book))
    if not chapter_raw_cache_has_payload(text, is_comic=is_comic):
        return False
    if not is_comic:
        return True
    plugin_id = str((book or {}).get("source_plugin") or "").strip()
    return comic_raw_cache_complete(
        text,
        plugin_id=plugin_id,
        extract_comic_image_urls=extract_comic_image_urls,
        vbook_image_cache_key=vbook_image_cache_key,
        image_cache_dir=image_cache_dir,
    )


def chapter_cache_available_by_key(
    storage,
    *,
    raw_key: str,
    book: dict[str, Any] | None,
    is_book_comic,
    chapter_raw_cache_has_payload,
    extract_comic_image_urls,
    vbook_image_cache_key,
    image_cache_dir: Path,
) -> bool:
    key = str(raw_key or "").strip()
    if not key:
        return False
    cached_raw = storage.read_cache(key)
    if cached_raw is None:
        return False
    return chapter_cache_available(
        cached_raw,
        book=book,
        is_book_comic=is_book_comic,
        chapter_raw_cache_has_payload=chapter_raw_cache_has_payload,
        extract_comic_image_urls=extract_comic_image_urls,
        vbook_image_cache_key=vbook_image_cache_key,
        image_cache_dir=image_cache_dir,
    )
