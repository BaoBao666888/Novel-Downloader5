"""Service helpers for preparing reader exports."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any


def build_book_export_info(
    service: Any,
    book: dict[str, Any],
    *,
    translate_mode: str,
    name_set_override: dict[str, str] | None = None,
    vp_set_override: dict[str, str] | None = None,
    book_supports_translation: Callable[[dict[str, Any]], bool],
    is_book_comic: Callable[[dict[str, Any]], bool],
) -> dict[str, Any]:
    specs = service._export_format_specs(book)
    book_id = str(book.get("book_id") or "").strip()
    chapter_rows = service.storage.get_chapter_rows(book_id) if book_id else []
    chapter_row_map = {
        str(row.get("chapter_id") or "").strip(): row
        for row in chapter_rows
        if str(row.get("chapter_id") or "").strip()
    }
    translation_supported = bool(book_supports_translation(book) and (not is_book_comic(book)))
    current_sig = ""
    if translation_supported:
        current_sig = service._current_export_trans_sig(
            translate_mode=translate_mode,
            name_set_override=name_set_override,
            vp_set_override=vp_set_override,
        )

    chapter_map: dict[str, dict[str, Any]] = {}
    total = 0
    downloaded = 0
    exportable = 0
    translation_cached = 0
    translation_pending = 0
    for chapter in book.get("chapters") or []:
        if not isinstance(chapter, dict):
            continue
        cid = str(chapter.get("chapter_id") or "").strip()
        if not cid:
            continue
        total += 1
        downloaded_flag = bool(chapter.get("is_downloaded"))
        if downloaded_flag:
            downloaded += 1
        can_export = downloaded_flag
        if can_export:
            exportable += 1

        cached_translation = False
        row = chapter_row_map.get(cid) or {}
        if can_export and current_sig:
            trans_key = str(row.get("trans_key") or "").strip()
            trans_sig = str(row.get("trans_sig") or "").strip()
            if trans_key and trans_sig == current_sig and (service.storage.read_cache(trans_key) is not None):
                cached_translation = service.storage.get_translation_unit_map_count(cid, current_sig, translate_mode) > 0
        if cached_translation:
            translation_cached += 1
        needs_translation = bool(current_sig) and can_export and (not cached_translation)
        if needs_translation:
            translation_pending += 1

        chapter_map[cid] = {
            "can_export": can_export,
            "is_downloaded": downloaded_flag,
            "translation_cached": bool(cached_translation),
            "needs_translation": bool(needs_translation),
        }

    return {
        "default_format": str(specs.get("default_format") or ""),
        "formats": list(specs.get("formats") or []),
        "download_only": True,
        "translation_mode": str(translate_mode or "server"),
        "translation_supported": bool(translation_supported),
        "translation_current_sig": current_sig,
        "counts": {
            "total_chapters": int(total),
            "downloaded_chapters": int(downloaded),
            "exportable_chapters": int(exportable),
            "missing_download_chapters": int(max(0, total - exportable)),
            "translation_cached_chapters": int(translation_cached),
            "translation_pending_chapters": int(translation_pending),
        },
        "chapter_map": chapter_map,
    }


def collect_export_chapters(
    service: Any,
    book: dict[str, Any],
    *,
    options: dict[str, bool],
    translate_mode: str,
    use_cached_only: bool,
    chapter_ids: list[str] | None = None,
    progress_callback: Callable[[dict[str, Any]], None] | None = None,
    book_supports_translation: Callable[[dict[str, Any]], bool],
    is_book_comic: Callable[[dict[str, Any]], bool],
    decode_comic_payload: Callable[[str], dict[str, Any] | None],
    normalize_vbook_display_text: Callable[..., str],
    normalize_vi_display_text: Callable[[Any], str],
    normalize_newlines: Callable[[str], str],
    ApiError: type[Exception],
    HTTPStatus: Any,
) -> list[dict[str, Any]]:
    chapters = service.storage.get_chapter_rows(str(book.get("book_id") or ""))
    if not chapters:
        return []
    wanted_ids = {str(x or "").strip() for x in (chapter_ids or []) if str(x or "").strip()}
    if wanted_ids:
        chapters = [row for row in chapters if str(row.get("chapter_id") or "").strip() in wanted_ids]
    if not chapters:
        return []

    _, active_name_set, _ = service.storage.get_active_name_set(
        default_sets=service._default_name_sets(),
        active_default=service._default_active_name_set(service._default_name_sets()),
        book_id=str(book.get("book_id") or ""),
    )
    active_vp_set, _ = service.storage.get_book_vp_set(str(book.get("book_id") or ""))
    use_translated_text = bool(options.get("use_translated_text")) and book_supports_translation(book)
    is_comic = bool(is_book_comic(book))
    current_sig = ""
    if use_translated_text and (not is_comic):
        current_sig = service._current_export_trans_sig(
            translate_mode=translate_mode,
            name_set_override=active_name_set,
            vp_set_override=active_vp_set,
        )

    entries: list[dict[str, Any]] = []
    total_chapters = len(chapters)
    if callable(progress_callback):
        try:
            progress_callback(
                {
                    "phase": "collect_start",
                    "index": 0,
                    "total": int(total_chapters),
                }
            )
        except Exception:
            pass
    for idx, chapter in enumerate(chapters, start=1):
        downloaded = service._chapter_cache_available(chapter, book)
        if use_cached_only and not downloaded:
            continue
        raw_title = normalize_vbook_display_text(
            str(chapter.get("title_raw") or f"Chương {idx}"),
            single_line=True,
        ) or f"Chương {idx}"
        chapter_title = raw_title
        if use_translated_text:
            chapter_title = service._translate_ui_text_with_dicts(
                raw_title,
                single_line=True,
                mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            ) or normalize_vi_display_text(chapter.get("title_vi") or "") or raw_title
        needs_translation = False
        if use_translated_text and current_sig and downloaded:
            trans_key = str(chapter.get("trans_key") or "").strip()
            trans_sig = str(chapter.get("trans_sig") or "").strip()
            cached_trans = service.storage.read_cache(trans_key) if trans_key and trans_sig == current_sig else None
            needs_translation = not (cached_trans is not None and service.storage.get_translation_unit_map_count(
                str(chapter.get("chapter_id") or ""),
                current_sig,
                translate_mode,
            ) > 0)
        if callable(progress_callback):
            try:
                progress_callback(
                    {
                        "phase": "chapter_start",
                        "index": int(idx),
                        "total": int(total_chapters),
                        "chapter_id": str(chapter.get("chapter_id") or ""),
                        "chapter_order": int(chapter.get("chapter_order") or idx),
                        "title": chapter_title,
                        "is_downloaded": bool(downloaded),
                        "needs_translation": bool(needs_translation),
                    }
                )
            except Exception:
                pass

        raw_payload = service.storage.get_chapter_text(
            chapter,
            book,
            mode="raw",
            translator=service.translator,
            translate_mode=translate_mode,
            name_set_override=active_name_set,
            vp_set_override=active_vp_set,
            allow_remote_fetch=not use_cached_only,
        )
        comic_payload = decode_comic_payload(raw_payload) if is_comic else None
        if is_comic:
            images = [str(x).strip() for x in ((comic_payload or {}).get("images") or []) if str(x).strip()]
            if not images:
                if use_cached_only:
                    continue
                raise ApiError(
                    HTTPStatus.BAD_GATEWAY,
                    "EXPORT_COMIC_EMPTY",
                    "Chương truyện tranh không có ảnh để xuất.",
                    {
                        "book_id": str(book.get("book_id") or ""),
                        "chapter_id": str(chapter.get("chapter_id") or ""),
                        "chapter_order": int(chapter.get("chapter_order") or idx),
                    },
                )
            image_entries: list[dict[str, Any]] = []
            referer = str(chapter.get("remote_url") or book.get("source_url") or "").strip()
            plugin_id = str(book.get("source_plugin") or "").strip()
            for image_idx, image_url in enumerate(images, start=1):
                cached = service._read_vbook_image_cache(image_url=image_url, plugin_id=plugin_id)
                if use_cached_only:
                    if cached is None:
                        image_entries = []
                        break
                    data, content_type = cached
                else:
                    if cached is not None:
                        data, content_type = cached
                    else:
                        data, content_type = service.fetch_vbook_image(
                            image_url=image_url,
                            plugin_id=plugin_id,
                            referer=referer,
                            use_cache=True,
                        )
                ext = service._guess_export_image_ext(image_url=image_url, content_type=content_type)
                image_entries.append(
                    {
                        "index": image_idx,
                        "url": image_url,
                        "content_type": content_type,
                        "data": data,
                        "ext": ext,
                    }
                )
            if not image_entries:
                continue
            entries.append(
                {
                    "chapter_id": str(chapter.get("chapter_id") or ""),
                    "chapter_order": int(chapter.get("chapter_order") or idx),
                    "title": chapter_title,
                    "title_raw": raw_title,
                    "images": image_entries,
                    "is_downloaded": bool(downloaded),
                }
            )
            if callable(progress_callback):
                try:
                    progress_callback(
                        {
                            "phase": "chapter_done",
                            "index": int(idx),
                            "total": int(total_chapters),
                            "chapter_id": str(chapter.get("chapter_id") or ""),
                            "chapter_order": int(chapter.get("chapter_order") or idx),
                            "title": chapter_title,
                            "is_downloaded": bool(downloaded),
                            "needs_translation": False,
                        }
                    )
                except Exception:
                    pass
            continue

        text_mode = "trans" if use_translated_text else "raw"
        text_value = service.storage.get_chapter_text(
            chapter,
            book,
            mode=text_mode,
            translator=service.translator,
            translate_mode=translate_mode,
            name_set_override=active_name_set,
            vp_set_override=active_vp_set,
            allow_remote_fetch=not use_cached_only,
        )
        if not text_value.strip():
            if use_cached_only:
                continue
            raise ApiError(
                HTTPStatus.BAD_GATEWAY,
                "EXPORT_TEXT_EMPTY",
                "Chương không có nội dung để xuất.",
                {
                    "book_id": str(book.get("book_id") or ""),
                    "chapter_id": str(chapter.get("chapter_id") or ""),
                    "chapter_order": int(chapter.get("chapter_order") or idx),
                },
            )
        entries.append(
            {
                "chapter_id": str(chapter.get("chapter_id") or ""),
                "chapter_order": int(chapter.get("chapter_order") or idx),
                "title": chapter_title,
                "title_raw": raw_title,
                "text": normalize_newlines(text_value),
                "is_downloaded": bool(downloaded),
            }
        )
        if callable(progress_callback):
            try:
                progress_callback(
                    {
                        "phase": "chapter_done",
                        "index": int(idx),
                        "total": int(total_chapters),
                        "chapter_id": str(chapter.get("chapter_id") or ""),
                        "chapter_order": int(chapter.get("chapter_order") or idx),
                        "title": chapter_title,
                        "is_downloaded": bool(downloaded),
                        "needs_translation": bool(needs_translation),
                    }
                )
            except Exception:
                pass
    return entries
