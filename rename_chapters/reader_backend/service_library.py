from __future__ import annotations

from pathlib import Path
from typing import Any

_CACHE_TRANSLATION_MODES = ("server", "local", "dichngay_local", "hanviet")
_CACHE_TRANSLATION_LABELS = {
    "server": "Server",
    "local": "Local",
    "dichngay_local": "Mô phỏng",
    "hanviet": "Hán Việt",
}


def _normalize_cache_translation_mode(value: Any) -> str:
    raw = str(value or "").strip().lower()
    if raw in {"sim", "simulation", "mock", "mophong"}:
        raw = "dichngay_local"
    if raw in {"han_viet", "han-viet"}:
        raw = "hanviet"
    return raw if raw in _CACHE_TRANSLATION_MODES else ""


def _cache_mode_label(mode: str) -> str:
    return _CACHE_TRANSLATION_LABELS.get(mode, str(mode or "").strip() or "Khác")


def _empty_translation_group(mode: str) -> dict[str, Any]:
    return {
        "mode": mode,
        "label": _cache_mode_label(mode),
        "cache_count": 0,
        "cache_bytes": 0,
        "translation_memory_count": 0,
        "translation_unit_map_count": 0,
    }


def _resolve_chapter_translation_mode(
    service,
    chapter: dict[str, Any] | Any,
    *,
    snapshot_mode_cache: dict[str, str],
) -> str:
    trans_sig = str((chapter.get("trans_sig") if isinstance(chapter, dict) else chapter["trans_sig"]) or "").strip()
    if not trans_sig:
        return ""
    if trans_sig in snapshot_mode_cache:
        return snapshot_mode_cache[trans_sig]
    snapshot = service.storage.get_chapter_trans_sig_snapshot(trans_sig) or {}
    mode = _normalize_cache_translation_mode(snapshot.get("mode"))
    snapshot_mode_cache[trans_sig] = mode
    return mode


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


def _build_book_raw_action_policy(service, book: dict[str, Any] | None) -> dict[str, Any]:
    bid = str((book or {}).get("book_id") or "").strip()
    source_type = str((book or {}).get("source_type") or "").strip().lower()
    source_mode = "link" if source_type.startswith("vbook") else "file"
    default_volume_count = 0
    extra_volume_count = 0
    active_supplement_batches = 0
    if bid:
        with service.storage._connect() as conn:
            volume_row = conn.execute(
                """
                SELECT
                    SUM(CASE WHEN lower(COALESCE(volume_kind, 'default')) = 'default' THEN 1 ELSE 0 END) AS default_volume_count,
                    SUM(CASE WHEN lower(COALESCE(volume_kind, 'default')) <> 'default' THEN 1 ELSE 0 END) AS extra_volume_count
                FROM book_volumes
                WHERE book_id = ?
                  AND trim(COALESCE(deleted_at, '')) = ''
                """,
                (bid,),
            ).fetchone()
            batch_row = conn.execute(
                """
                SELECT COUNT(1) AS c
                FROM book_supplement_batches
                WHERE book_id = ?
                  AND trim(COALESCE(deleted_at, '')) = ''
                """,
                (bid,),
            ).fetchone()
        default_volume_count = int((volume_row["default_volume_count"] if volume_row else 0) or 0)
        extra_volume_count = int((volume_row["extra_volume_count"] if volume_row else 0) or 0)
        active_supplement_batches = int((batch_row["c"] if batch_row else 0) or 0)

    reason_code = ""
    reason = ""
    if not source_type.startswith("vbook"):
        reason_code = "not_online_source"
        reason = "RAW chỉ hỗ trợ cho truyện thêm bằng link từ nguồn online vBook."
    elif default_volume_count <= 0:
        reason_code = "missing_default_volume"
        reason = "Không xác định được quyển mặc định của truyện nguồn online để xử lý RAW."
    elif active_supplement_batches > 0 or extra_volume_count > 0:
        reason_code = "has_supplement"
        reason = "Truyện nguồn online đã có quyển/file bổ sung nên không cho xóa RAW riêng."

    can_delete_via_raw = not reason_code
    return {
        "allowed": bool(can_delete_via_raw),
        "delete_book": bool(can_delete_via_raw),
        "reason_code": reason_code,
        "reason": reason,
        "source_mode": source_mode,
        "source_type": source_type,
        "default_volume_count": int(default_volume_count),
        "extra_volume_count": int(extra_volume_count),
        "active_supplement_batches": int(active_supplement_batches),
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
    base_global_stats = service.storage.get_translation_cache_stats()
    global_by_mode = {
        mode: _empty_translation_group(mode)
        for mode in _CACHE_TRANSLATION_MODES
    }
    storage_mode_stats = service.storage.get_translation_cache_stats_by_mode()
    for mode, stats in (storage_mode_stats or {}).items():
        mode_key = _normalize_cache_translation_mode(mode)
        if not mode_key:
            continue
        group = global_by_mode.setdefault(mode_key, _empty_translation_group(mode_key))
        group["translation_memory_count"] = int((stats or {}).get("translation_memory_count") or 0)
        group["translation_unit_map_count"] = int((stats or {}).get("translation_unit_map_count") or 0)
    items: list[dict[str, Any]] = []
    snapshot_mode_cache: dict[str, str] = {}

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
        raw_bytes = sum(int((cache_meta.get(key) or {}).get("bytes") or 0) for key in raw_cached)
        translation_groups = {
            mode: {
                "mode": mode,
                "label": _cache_mode_label(mode),
                "cache_count": 0,
                "cache_bytes": 0,
            }
            for mode in _CACHE_TRANSLATION_MODES
        }
        for chapter in chapters:
            trans_key = str(chapter.get("trans_key") or "").strip()
            if not trans_key or trans_key not in cache_meta:
                continue
            mode_key = _resolve_chapter_translation_mode(
                service,
                chapter,
                snapshot_mode_cache=snapshot_mode_cache,
            )
            if not mode_key:
                continue
            cache_bytes = int((cache_meta.get(trans_key) or {}).get("bytes") or 0)
            translation_groups[mode_key]["cache_count"] += 1
            translation_groups[mode_key]["cache_bytes"] += cache_bytes
            global_by_mode[mode_key]["cache_count"] += 1
            global_by_mode[mode_key]["cache_bytes"] += cache_bytes
        active_translation_groups = [
            dict(group)
            for mode, group in translation_groups.items()
            if int(group.get("cache_count") or 0) > 0 or int(group.get("cache_bytes") or 0) > 0
        ]
        trans_bytes = sum(int(group.get("cache_bytes") or 0) for group in active_translation_groups)
        trans_cached_count = sum(int(group.get("cache_count") or 0) for group in active_translation_groups)

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
        total_bytes = int(raw_bytes) + int(trans_bytes) + int(image_bytes)
        cache_groups: list[dict[str, Any]] = []
        if raw_cached or raw_bytes:
            cache_groups.append(
                {
                    "key": "raw",
                    "label": "RAW",
                    "cache_count": int(len(raw_cached)),
                    "cache_bytes": int(raw_bytes),
                }
            )
        cache_groups.extend(
            {
                "key": f"trans:{group['mode']}",
                "mode": group["mode"],
                "label": f"Dịch {group['label']}",
                "cache_count": int(group.get("cache_count") or 0),
                "cache_bytes": int(group.get("cache_bytes") or 0),
            }
            for group in active_translation_groups
        )
        if image_cached or image_bytes:
            cache_groups.append(
                {
                    "key": "images",
                    "label": "Ảnh",
                    "cache_count": int(len(image_cached)),
                    "cache_bytes": int(image_bytes),
                }
            )

        items.append(
            {
                "book_id": bid,
                "title": str(book.get("title") or ""),
                "title_display": str(book.get("title_display") or book.get("title") or ""),
                "author_display": str(book.get("author_display") or book.get("author") or ""),
                "source_type": str(book.get("source_type") or ""),
                "source_mode": "link" if str(book.get("source_type") or "").strip().lower().startswith("vbook") else "file",
                "cover_url": str(book.get("cover_url") or ""),
                "is_comic": bool(book.get("is_comic")),
                "chapter_count": chapter_total,
                "cached_raw_chapters": int(len(raw_cached)),
                "cached_trans_chapters": int(trans_cached_count),
                "cached_image_count": int(len(image_cached)),
                "raw_bytes": int(raw_bytes),
                "trans_bytes": int(trans_bytes),
                "image_bytes": int(image_bytes),
                "cache_total_bytes": total_bytes,
                "translation_groups": active_translation_groups,
                "cache_groups": cache_groups,
                "raw_action": _build_book_raw_action_policy(service, book),
            }
        )

    items.sort(
        key=lambda item: (
            -int(item.get("cache_total_bytes") or 0),
            -int(item.get("trans_bytes") or 0),
            -int(item.get("raw_bytes") or 0),
            str(item.get("title_display") or item.get("title") or "").lower(),
        )
    )
    return {
        "ok": True,
        "global": {
            **base_global_stats,
            "groups": [global_by_mode[mode] for mode in _CACHE_TRANSLATION_MODES],
        },
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
    global_mode = _normalize_cache_translation_mode(payload.get("mode"))
    if action in {"clear_translation_global", "clear_global_translation", "global_trans", "clear_global_translation_mode"}:
        if action == "clear_global_translation_mode":
            if not global_mode:
                raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu mode cache global hợp lệ.")
            result = service.storage.clear_translated_cache_by_mode(global_mode)
            return {"ok": True, "action": "clear_global_translation_mode", "mode": global_mode, **result}
        result = service.storage.clear_translated_cache()
        return {"ok": True, "action": "clear_global_translation", **result}

    if action not in {"clear_book_raw", "clear_book_trans", "clear_book_trans_mode", "clear_book_images", "clear_book_all"}:
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
        "books_deleted": 0,
        "raw_cache_deleted": 0,
        "trans_cache_deleted": 0,
        "unit_map_deleted": 0,
        "deleted_files": 0,
        "bytes_deleted": 0,
        "image_cache_keys": 0,
        "image_cache_deleted": 0,
        "image_bytes_deleted": 0,
    }

    preloaded_books: dict[str, tuple[dict[str, Any] | None, list[dict[str, Any]], dict[str, Any] | None]] = {}
    for bid in book_ids:
        book = service.storage.find_book(bid)
        chapters = service.storage.get_chapter_rows(bid)
        raw_policy = _build_book_raw_action_policy(service, book) if action == "clear_book_raw" and book else None
        preloaded_books[bid] = (book, chapters, raw_policy)

    if action == "clear_book_raw":
        invalid_items: list[str] = []
        for bid in book_ids:
            book, _chapters, raw_policy = preloaded_books.get(bid, (None, [], None))
            if not book:
                continue
            if not isinstance(raw_policy, dict) or not bool(raw_policy.get("allowed")):
                title = str(book.get("title") or "").strip() or bid
                reason = str((raw_policy or {}).get("reason") or "Không thể xóa RAW cho truyện này.").strip()
                invalid_items.append(f"{title}: {reason}")
        if invalid_items:
            raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", invalid_items[0])

    for bid in book_ids:
        book, chapters, raw_policy = preloaded_books.get(bid, (None, [], None))
        if not book:
            result_items.append({"book_id": bid, "found": False})
            continue
        if action == "clear_book_raw":
            deleted = bool(service.delete_book(bid))
            item = {
                "book_id": bid,
                "found": True,
                "book_deleted": deleted,
                "raw_deleted_via": "delete_book",
                "raw_action": dict(raw_policy or {}),
            }
            result_items.append(item)
            total["books_deleted"] += 1 if deleted else 0
            continue
        clear_raw = action in {"clear_book_raw", "clear_book_all"}
        clear_trans = action in {"clear_book_trans", "clear_book_trans_mode", "clear_book_all"}
        translate_modes = {global_mode} if action == "clear_book_trans_mode" and global_mode else None
        if action == "clear_book_trans_mode" and not translate_modes:
            raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu mode cache truyện hợp lệ.")
        cache_stats = service.storage.clear_book_cache(
            bid,
            clear_raw=clear_raw,
            clear_trans=clear_trans,
            translate_modes=translate_modes,
        )
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
