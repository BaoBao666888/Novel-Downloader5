from __future__ import annotations

from pathlib import Path
from typing import Any


def scan_vbook_image_cache_index(*, vbook_image_cache_dir: Path) -> dict[str, int]:
    index: dict[str, int] = {}
    if not vbook_image_cache_dir.exists():
        return index
    try:
        for item in vbook_image_cache_dir.glob("*.bin"):
            key = str(item.stem or "").strip()
            if not key:
                continue
            try:
                index[key] = int(item.stat().st_size)
            except Exception:
                index[key] = 0
    except Exception:
        return {}
    return index


def collect_book_image_cache_keys(
    service,
    book: dict[str, Any],
    chapters: list[dict[str, Any]],
    *,
    is_book_comic,
    extract_comic_image_urls,
    vbook_image_cache_key,
) -> set[str]:
    if not is_book_comic(book):
        return set()
    plugin_id = str(book.get("source_plugin") or "").strip()
    keys: set[str] = set()
    for chapter in chapters:
        raw_key = str(chapter.get("raw_key") or "").strip()
        if not raw_key:
            continue
        raw_text = service.storage.read_cache(raw_key) or ""
        for image_url in extract_comic_image_urls(raw_text):
            url = str(image_url or "").strip()
            if not url:
                continue
            keys.add(vbook_image_cache_key(image_url=url, plugin_id=plugin_id))
    return keys


def clear_book_image_cache(
    service,
    book: dict[str, Any],
    chapters: list[dict[str, Any]],
    *,
    is_book_comic,
    extract_comic_image_urls,
    vbook_image_cache_key,
    vbook_image_cache_dir: Path,
) -> dict[str, int]:
    keys = collect_book_image_cache_keys(
        service,
        book,
        chapters,
        is_book_comic=is_book_comic,
        extract_comic_image_urls=extract_comic_image_urls,
        vbook_image_cache_key=vbook_image_cache_key,
    )
    deleted = 0
    bytes_deleted = 0
    for key in keys:
        body = vbook_image_cache_dir / f"{key}.bin"
        meta = vbook_image_cache_dir / f"{key}.json"
        if body.exists():
            try:
                bytes_deleted += int(body.stat().st_size)
            except Exception:
                pass
            try:
                body.unlink()
                deleted += 1
            except Exception:
                pass
        if meta.exists():
            try:
                meta.unlink()
            except Exception:
                pass
    return {
        "image_cache_keys": int(len(keys)),
        "image_cache_deleted": int(deleted),
        "image_bytes_deleted": int(bytes_deleted),
    }


def reload_chapter(service, chapter_id: str, *, api_error_cls, http_status) -> dict[str, Any]:
    cid = str(chapter_id or "").strip()
    if not cid:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu chapter_id.")
    chapter = service.storage.find_chapter(cid)
    if not chapter:
        raise api_error_cls(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
    book = service.storage.find_book(chapter["book_id"])
    if not book:
        raise api_error_cls(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")

    source_type = str(book.get("source_type") or "").strip()
    remote_url = str(chapter.get("remote_url") or "").strip()
    reloaded_from_source = False
    if source_type.startswith("vbook") and remote_url:
        service._fetch_remote_chapter(chapter, book)
        reloaded_from_source = True

    cleared = service.storage.clear_chapter_translated_cache(cid)
    chapter_is_downloaded = service._chapter_cache_available(chapter, book)
    downloaded_count, chapter_total = service.storage.get_book_download_counts(str(chapter.get("book_id") or ""))
    return {
        "ok": True,
        "chapter_id": cid,
        "book_id": str(chapter.get("book_id") or ""),
        "source_type": source_type,
        "remote_url": remote_url,
        "reloaded_from_source": reloaded_from_source,
        "is_downloaded": chapter_is_downloaded,
        "downloaded_chapters": int(downloaded_count),
        "chapter_count": int(chapter_total),
        **cleared,
    }


def get_cache_summary(
    service,
    *,
    is_book_comic,
    extract_comic_image_urls,
    vbook_image_cache_key,
    vbook_image_cache_dir: Path,
) -> dict[str, Any]:
    books = service.storage.list_books(include_session=True)
    image_index = scan_vbook_image_cache_index(vbook_image_cache_dir=vbook_image_cache_dir)
    global_stats = service.storage.get_translation_cache_stats()
    items: list[dict[str, Any]] = []

    for book in books:
        bid = str(book.get("book_id") or "").strip()
        if not bid:
            continue
        chapters = service.storage.get_chapter_rows(bid)
        chapter_total = int(book.get("chapter_count") or len(chapters) or 0)
        raw_keys = [str(ch.get("raw_key") or "").strip() for ch in chapters if str(ch.get("raw_key") or "").strip()]
        trans_keys = [str(ch.get("trans_key") or "").strip() for ch in chapters if str(ch.get("trans_key") or "").strip()]
        cache_meta = service.storage.get_content_cache_meta(set(raw_keys + trans_keys))
        raw_cached = [key for key in raw_keys if key in cache_meta]
        trans_cached = [key for key in trans_keys if key in cache_meta]
        raw_bytes = sum(int((cache_meta.get(key) or {}).get("bytes") or 0) for key in raw_cached)
        trans_bytes = sum(int((cache_meta.get(key) or {}).get("bytes") or 0) for key in trans_cached)

        image_keys = collect_book_image_cache_keys(
            service,
            book,
            chapters,
            is_book_comic=is_book_comic,
            extract_comic_image_urls=extract_comic_image_urls,
            vbook_image_cache_key=vbook_image_cache_key,
        )
        image_cached = [key for key in image_keys if key in image_index]
        image_bytes = sum(int(image_index.get(key) or 0) for key in image_cached)

        items.append(
            {
                "book_id": bid,
                "title": str(book.get("title") or ""),
                "title_display": str(book.get("title_display") or book.get("title") or ""),
                "author_display": str(book.get("author_display") or book.get("author") or ""),
                "cover_url": str(book.get("cover_url") or ""),
                "is_comic": bool(book.get("is_comic")),
                "chapter_count": chapter_total,
                "cached_raw_chapters": int(len(raw_cached)),
                "cached_trans_chapters": int(len(trans_cached)),
                "cached_image_count": int(len(image_cached)),
                "raw_bytes": int(raw_bytes),
                "trans_bytes": int(trans_bytes),
                "image_bytes": int(image_bytes),
            }
        )

    return {
        "ok": True,
        "global": global_stats,
        "books": items,
    }


def manage_cache(
    service,
    payload: dict[str, Any],
    *,
    api_error_cls,
    http_status,
    is_book_comic,
    extract_comic_image_urls,
    vbook_image_cache_key,
    vbook_image_cache_dir: Path,
) -> dict[str, Any]:
    if not isinstance(payload, dict):
        payload = {}
    action = str(payload.get("action") or "").strip().lower()
    if action in {"clear_translation_global", "clear_global_translation", "global_trans"}:
        result = service.storage.clear_translated_cache()
        return {"ok": True, "action": "clear_global_translation", **result}

    if action not in {"clear_book_raw", "clear_book_trans", "clear_book_images", "clear_book_all"}:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "action cache không hợp lệ.")
    book_ids_raw = payload.get("book_ids")
    if not isinstance(book_ids_raw, list):
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "book_ids phải là mảng.")
    book_ids: list[str] = []
    seen: set[str] = set()
    for raw in book_ids_raw:
        bid = str(raw or "").strip()
        if not bid or bid in seen:
            continue
        seen.add(bid)
        book_ids.append(bid)
    if not book_ids:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Chưa chọn truyện để xóa cache.")

    result_items: list[dict[str, Any]] = []
    total = {
        "raw_cache_deleted": 0,
        "trans_cache_deleted": 0,
        "unit_map_deleted": 0,
        "deleted_files": 0,
        "bytes_deleted": 0,
        "image_cache_keys": 0,
        "image_cache_deleted": 0,
        "image_bytes_deleted": 0,
    }

    for bid in book_ids:
        book = service.storage.find_book(bid)
        chapters = service.storage.get_chapter_rows(bid)
        if not book:
            result_items.append({"book_id": bid, "found": False})
            continue
        clear_raw = action in {"clear_book_raw", "clear_book_all"}
        clear_trans = action in {"clear_book_trans", "clear_book_all"}
        cache_stats = service.storage.clear_book_cache(bid, clear_raw=clear_raw, clear_trans=clear_trans)
        image_stats = {"image_cache_keys": 0, "image_cache_deleted": 0, "image_bytes_deleted": 0}
        if action in {"clear_book_images", "clear_book_all"}:
            image_stats = clear_book_image_cache(
                service,
                book,
                chapters,
                is_book_comic=is_book_comic,
                extract_comic_image_urls=extract_comic_image_urls,
                vbook_image_cache_key=vbook_image_cache_key,
                vbook_image_cache_dir=vbook_image_cache_dir,
            )
        item = {
            "book_id": bid,
            "found": True,
            **cache_stats,
            **image_stats,
        }
        downloaded_count, chapter_total = service.storage.get_book_download_counts(bid)
        item["downloaded_chapters"] = int(downloaded_count)
        item["chapter_count"] = int(chapter_total)
        result_items.append(item)
        for key in total.keys():
            total[key] += int(item.get(key) or 0)

    return {
        "ok": True,
        "action": action,
        "items": result_items,
        "summary": total,
    }


def apply_book_card_translation(
    service,
    item: dict[str, Any],
    *,
    is_book_comic,
    is_lang_zh,
    normalize_vbook_display_text,
    normalize_vi_display_text,
) -> dict[str, Any]:
    output = dict(item or {})
    is_zh = is_lang_zh(str(output.get("lang_source") or ""))
    translation_supported = bool((not is_book_comic(output)) and is_zh)
    can_translate = bool(translation_supported and service.is_reader_translation_enabled())
    output["translation_supported"] = translation_supported
    raw_title = normalize_vbook_display_text(str(output.get("title") or ""), single_line=True)
    raw_author = normalize_vbook_display_text(str(output.get("author") or ""), single_line=True)
    vi_title = normalize_vi_display_text(output.get("title_vi") or "")
    author_display = service._author_hanviet_display(raw_author, single_line=True) or normalize_vi_display_text(output.get("author_vi") or "")
    if can_translate:
        output["title_display"] = vi_title or service._translate_ui_text(raw_title, single_line=True)
        output["author_display"] = author_display or raw_author
        cur_raw = normalize_vbook_display_text(str(output.get("current_chapter_title_raw") or ""), single_line=True)
        cur_vi = normalize_vi_display_text(output.get("current_chapter_title_vi") or "")
        output["current_chapter_title_display"] = cur_vi or service._translate_ui_text(cur_raw, single_line=True) or cur_raw
    else:
        output["title_display"] = vi_title or raw_title
        output["author_display"] = author_display or raw_author
        cur_raw = normalize_vbook_display_text(str(output.get("current_chapter_title_raw") or ""), single_line=True)
        cur_vi = normalize_vi_display_text(output.get("current_chapter_title_vi") or "")
        output["current_chapter_title_display"] = cur_vi or cur_raw
    return output


def _translate_single_line_batch(service, texts: list[str]) -> dict[str, str]:
    unique_sources: list[str] = []
    seen: set[str] = set()
    for raw in texts or []:
        text = str(raw or "").strip()
        if (not text) or text in seen:
            continue
        seen.add(text)
        unique_sources.append(text)
    if not unique_sources:
        return {}
    translated = service._translate_ui_texts_batch(unique_sources, single_line=True)
    output: dict[str, str] = {}
    for idx, source in enumerate(unique_sources):
        target = str(translated[idx] if idx < len(translated) else "" or "").strip()
        output[source] = target or source
    return output


def _apply_book_card_translation_batch(
    service,
    items: list[dict[str, Any]],
    *,
    is_book_comic,
    is_lang_zh,
    normalize_vbook_display_text,
    normalize_vi_display_text,
    allow_live_translation: bool = True,
) -> list[dict[str, Any]]:
    prepared: list[dict[str, Any]] = []
    title_sources: list[str] = []
    chapter_title_sources: list[str] = []

    for raw_item in items or []:
        output = dict(raw_item or {})
        is_zh = is_lang_zh(str(output.get("lang_source") or ""))
        translation_supported = bool((not is_book_comic(output)) and is_zh)
        can_translate = bool(
            allow_live_translation
            and translation_supported
            and service.is_reader_translation_enabled()
        )
        raw_title = normalize_vbook_display_text(str(output.get("title") or ""), single_line=True)
        raw_author = normalize_vbook_display_text(str(output.get("author") or ""), single_line=True)
        vi_title = normalize_vi_display_text(output.get("title_vi") or "")
        author_display = service._author_hanviet_display(raw_author, single_line=True) or normalize_vi_display_text(output.get("author_vi") or "")
        cur_raw = normalize_vbook_display_text(str(output.get("current_chapter_title_raw") or ""), single_line=True)
        cur_vi = normalize_vi_display_text(output.get("current_chapter_title_vi") or "")

        output["translation_supported"] = translation_supported
        output["_raw_title_display"] = raw_title
        output["_raw_current_chapter_title_display"] = cur_raw
        output["_vi_title_display"] = vi_title
        output["_author_display"] = author_display or raw_author
        output["_vi_current_chapter_title_display"] = cur_vi
        prepared.append(output)

        if not can_translate:
            continue
        if raw_title and not vi_title:
            title_sources.append(raw_title)
        if cur_raw and not cur_vi:
            chapter_title_sources.append(cur_raw)

    translated_titles = _translate_single_line_batch(service, title_sources)
    translated_chapter_titles = _translate_single_line_batch(service, chapter_title_sources)

    results: list[dict[str, Any]] = []
    for item in prepared:
        can_translate = bool(item.get("translation_supported"))
        raw_title = str(item.pop("_raw_title_display", "") or "")
        raw_current = str(item.pop("_raw_current_chapter_title_display", "") or "")
        vi_title = str(item.pop("_vi_title_display", "") or "")
        author_display = str(item.pop("_author_display", "") or "")
        vi_current = str(item.pop("_vi_current_chapter_title_display", "") or "")

        if can_translate:
            item["title_display"] = vi_title or translated_titles.get(raw_title) or raw_title
            item["author_display"] = author_display
            item["current_chapter_title_display"] = vi_current or translated_chapter_titles.get(raw_current) or raw_current
        else:
            item["title_display"] = vi_title or raw_title
            item["author_display"] = author_display
            item["current_chapter_title_display"] = vi_current or raw_current
        results.append(item)
    return results


def list_books(
    service,
    *,
    is_book_comic,
    is_lang_zh,
    normalize_vbook_display_text,
    normalize_vi_display_text,
) -> list[dict[str, Any]]:
    items = service.storage.list_books()
    return _apply_book_card_translation_batch(
        service,
        items,
        is_book_comic=is_book_comic,
        is_lang_zh=is_lang_zh,
        normalize_vbook_display_text=normalize_vbook_display_text,
        normalize_vi_display_text=normalize_vi_display_text,
        allow_live_translation=False,
    )


def list_books_by_ids(
    service,
    book_ids: list[str] | tuple[str, ...] | set[str],
    *,
    is_book_comic,
    is_lang_zh,
    normalize_lang_source,
    book_supports_translation,
    normalize_vbook_display_text,
    normalize_vi_display_text,
) -> list[dict[str, Any]]:
    items = service.storage.list_books_by_ids(
        book_ids,
        normalize_vi_display_text=normalize_vi_display_text,
        normalize_lang_source=normalize_lang_source,
        book_supports_translation=book_supports_translation,
        is_book_comic=is_book_comic,
    )
    return _apply_book_card_translation_batch(
        service,
        items,
        is_book_comic=is_book_comic,
        is_lang_zh=is_lang_zh,
        normalize_vbook_display_text=normalize_vbook_display_text,
        normalize_vi_display_text=normalize_vi_display_text,
        allow_live_translation=False,
    )


def list_books_paged(
    service,
    *,
    offset: int = 0,
    limit: int = 48,
    query_text: str = "",
    author_query: str = "",
    category_ids: list[str] | tuple[str, ...] | set[str] | None = None,
    category_exclude_ids: list[str] | tuple[str, ...] | set[str] | None = None,
    category_match_mode: str = "or",
    is_book_comic,
    is_lang_zh,
    normalize_lang_source,
    book_supports_translation,
    normalize_vbook_display_text,
    normalize_vi_display_text,
    allow_live_translation: bool = False,
) -> dict[str, Any]:
    data = service.storage.list_books_paged(
        offset=offset,
        limit=limit,
        query_text=query_text,
        author_query=author_query,
        category_ids=category_ids,
        category_exclude_ids=category_exclude_ids,
        category_match_mode=category_match_mode,
        normalize_vi_display_text=normalize_vi_display_text,
        normalize_lang_source=normalize_lang_source,
        book_supports_translation=book_supports_translation,
        is_book_comic=is_book_comic,
    )
    items = _apply_book_card_translation_batch(
        service,
        data.get("items") or [],
        is_book_comic=is_book_comic,
        is_lang_zh=is_lang_zh,
        normalize_vbook_display_text=normalize_vbook_display_text,
        normalize_vi_display_text=normalize_vi_display_text,
        allow_live_translation=allow_live_translation,
    )
    return {
        **data,
        "items": items,
    }


def search(
    service,
    query: str,
    *,
    is_book_comic,
    is_lang_zh,
    normalize_vbook_display_text,
    normalize_vi_display_text,
    scope: str = "all",
) -> dict[str, Any]:
    scope_key = str(scope or "all").strip().lower()
    if scope_key not in {"all", "books", "chapters"}:
        scope_key = "all"
    data = service.storage.search(query, scope=scope_key)
    books: list[dict[str, Any]] = []
    if scope_key != "chapters" and str(query or "").strip():
        books = _apply_book_card_translation_batch(
            service,
            data.get("books") or [],
            is_book_comic=is_book_comic,
            is_lang_zh=is_lang_zh,
            normalize_vbook_display_text=normalize_vbook_display_text,
            normalize_vi_display_text=normalize_vi_display_text,
            allow_live_translation=False,
        )
    chapters_raw = data.get("chapters") or []
    chapters: list[dict[str, Any]] = []
    if scope_key != "books":
        allow = service.is_reader_translation_enabled()
        for row in chapters_raw:
            item = dict(row or {})
            is_zh = is_lang_zh(str(item.get("lang_source") or "zh"))
            title_raw = normalize_vbook_display_text(str(item.get("title_raw") or ""), single_line=True)
            title_vi = normalize_vi_display_text(item.get("title_vi") or "")
            book_title_raw = normalize_vbook_display_text(str(item.get("book_title") or ""), single_line=True)
            book_title_vi = normalize_vi_display_text(item.get("book_title_vi") or "")
            if allow and is_zh:
                item["title_display"] = title_vi or service._translate_ui_text(title_raw, single_line=True) or title_raw
                item["book_title_display"] = book_title_vi or service._translate_ui_text(book_title_raw, single_line=True) or book_title_raw
            else:
                item["title_display"] = title_raw or title_vi
                item["book_title_display"] = book_title_raw or book_title_vi
            chapters.append(item)
    return {"books": books, "chapters": chapters}
