from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import unquote


@dataclass(frozen=True)
class LibraryReaderDeps:
    api_error_cls: Any
    http_status: Any
    cache_dir: Path
    normalize_vbook_display_text: Any
    normalize_vi_display_text: Any
    normalize_newlines: Any
    decode_comic_payload: Any
    encode_comic_payload: Any
    build_vbook_image_proxy_path: Any
    map_selection_to_name_source: Any
    map_selection_to_source_segment: Any
    text_snippet: Any


def _default_name_context(handler) -> tuple[dict[str, Any], str | None]:
    default_sets = handler.service._default_name_sets()
    active_default = handler.service._default_active_name_set(default_sets)
    return default_sets, active_default


def _get_active_name_set(handler, book_id: str):
    default_sets, active_default = _default_name_context(handler)
    return handler.service.storage.get_active_name_set(
        default_sets=default_sets,
        active_default=active_default,
        book_id=book_id,
    )


def _get_name_set_state(handler, book_id: str):
    default_sets, active_default = _default_name_context(handler)
    return handler.service.storage.get_name_set_state(
        default_sets=default_sets,
        active_default=active_default,
        book_id=book_id,
    )


def _get_translate_mode_from_query(handler, query: dict[str, list[str]]) -> str:
    if "translation_mode" in query:
        raw = (query.get("translation_mode", ["server"])[0] or "server").strip().lower()
    else:
        raw = handler.service.reader_translation_mode()
    return handler.service.resolve_translate_mode(raw)


def _normalize_client_reader_text(value: Any) -> str:
    return str(value or "").replace("\r\n", "\n").replace("\r", "\n")


def _apply_book_display_fields(handler, book: dict[str, Any], *, translate_mode: str, active_name_set, active_vp_set, deps: LibraryReaderDeps) -> None:
    allow_translate = handler.service.translation_allowed_for_book(book)
    if allow_translate:
        raw_title = deps.normalize_vbook_display_text(str(book.get("title") or ""), single_line=True) or str(book.get("title") or "")
        raw_author = deps.normalize_vbook_display_text(str(book.get("author") or ""), single_line=True) or str(book.get("author") or "")
        raw_summary = deps.normalize_vbook_display_text(str(book.get("summary") or ""), single_line=False) or str(book.get("summary") or "")
        title_vi = deps.normalize_vi_display_text(book.get("title_vi") or "")
        author_vi = deps.normalize_vi_display_text(book.get("author_vi") or "")
        live_title_mode = translate_mode in {"local", "hanviet", "dichngay_local"}
        book["translation_supported"] = True
        book["author_display"] = handler.service._author_hanviet_display(raw_author, single_line=True) or author_vi or raw_author
        if live_title_mode:
            book["title_display"] = handler.service._translate_ui_text_with_dicts(
                raw_title,
                single_line=True,
                mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            ) or raw_title
            book["summary_display"] = handler.service._translate_ui_text_with_dicts(
                raw_summary,
                single_line=False,
                mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            ) or raw_summary
        else:
            title_outputs = handler.service._translate_ui_texts_batch(
                [raw_title] if raw_title else [],
                single_line=True,
                mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            summary_outputs = handler.service._translate_ui_texts_batch(
                [raw_summary],
                single_line=False,
                mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            book["title_display"] = (title_outputs[0] if title_outputs else "") or title_vi or raw_title
            book["summary_display"] = (summary_outputs[0] if summary_outputs else "") or raw_summary
        chapters = book.get("chapters")
        if isinstance(chapters, list):
            server_title_inputs: list[str] = []
            server_title_rows: list[dict[str, Any]] = []
            for row in chapters:
                if not isinstance(row, dict):
                    continue
                row_title_raw = deps.normalize_vbook_display_text(str(row.get("title_raw") or ""), single_line=True)
                row_title_vi = deps.normalize_vi_display_text(row.get("title_vi") or "")
                if live_title_mode:
                    row["title_display"] = handler.service._translate_ui_text_with_dicts(
                        row_title_raw,
                        single_line=True,
                        mode=translate_mode,
                        name_set_override=active_name_set,
                        vp_set_override=active_vp_set,
                    ) or row_title_raw
                else:
                    if row_title_raw:
                        row["title_display"] = row_title_raw
                        server_title_rows.append(row)
                        server_title_inputs.append(row_title_raw)
                    else:
                        row["title_display"] = row_title_vi
            if (not live_title_mode) and server_title_inputs:
                server_title_outputs = handler.service._translate_ui_texts_batch(
                    server_title_inputs,
                    single_line=True,
                    mode=translate_mode,
                    name_set_override=active_name_set,
                    vp_set_override=active_vp_set,
                )
                for idx, row in enumerate(server_title_rows):
                    translated = server_title_outputs[idx] if idx < len(server_title_outputs) else ""
                    row["title_display"] = translated or str(row.get("title_vi") or row.get("title_display") or "")
    else:
        book["translation_supported"] = False
        book["title_display"] = deps.normalize_vbook_display_text(str(book.get("title") or ""), single_line=True) or str(book.get("title") or "")
        raw_author = deps.normalize_vbook_display_text(str(book.get("author") or ""), single_line=True) or str(book.get("author") or "")
        author_vi = deps.normalize_vi_display_text(book.get("author_vi") or "")
        book["author_display"] = handler.service._author_hanviet_display(raw_author, single_line=True) or author_vi or raw_author
        book["summary_display"] = deps.normalize_vbook_display_text(str(book.get("summary") or ""), single_line=False) or str(book.get("summary") or "")
        chapters = book.get("chapters")
        if isinstance(chapters, list):
            for row in chapters:
                if not isinstance(row, dict):
                    continue
                row["title_display"] = deps.normalize_vbook_display_text(str(row.get("title_raw") or ""), single_line=True) or str(row.get("title_raw") or "")


def handle_api(handler, method: str, path: str, query: dict[str, list[str]], *, deps: LibraryReaderDeps) -> dict[str, Any] | None:
    api_error = deps.api_error_cls
    http_status = deps.http_status
    service = handler.service
    storage = service.storage

    if method == "GET" and path == "/api/library/books":
        books = service.list_books()
        return {"items": books}

    if method == "GET" and path == "/api/library/categories":
        return {"ok": True, "items": storage.list_categories()}

    if method == "POST" and path == "/api/library/categories":
        payload = handler._read_json_body()
        try:
            category = storage.create_category(payload.get("name") or "")
        except ValueError as exc:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", str(exc)) from exc
        return {"ok": True, "category": category, "items": storage.list_categories()}

    if method == "POST" and path == "/api/library/categories/assign":
        payload = handler._read_json_body()
        try:
            result = storage.update_books_categories(
                book_ids=payload.get("book_ids") or [],
                category_ids=payload.get("category_ids") or [],
                action=payload.get("action") or "",
            )
        except ValueError as exc:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", str(exc)) from exc
        except LookupError as exc:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", str(exc)) from exc
        return {"ok": True, **result}

    if method == "POST" and path.startswith("/api/library/categories/"):
        category_id = path.removeprefix("/api/library/categories/").strip("/")
        if not category_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu category_id.")
        payload = handler._read_json_body()
        try:
            category = storage.rename_category(category_id, payload.get("name") or "")
        except ValueError as exc:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", str(exc)) from exc
        except LookupError as exc:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", str(exc)) from exc
        return {"ok": True, "category": category, "items": storage.list_categories()}

    if method == "DELETE" and path.startswith("/api/library/categories/"):
        category_id = path.removeprefix("/api/library/categories/").strip("/")
        if not category_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu category_id.")
        deleted = storage.delete_category(category_id)
        if not deleted:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy danh mục.")
        return {"ok": True, "items": storage.list_categories()}

    if method == "GET" and path == "/api/library/history":
        items = service.list_history_books()
        return {"ok": True, "items": items, "count": len(items)}

    if method == "POST" and path == "/api/library/history/upsert":
        payload = handler._read_json_body()
        item = service.upsert_history_book(payload)
        return {"ok": True, "item": item}

    if method == "DELETE" and path.startswith("/api/library/history/"):
        history_id = unquote(path.removeprefix("/api/library/history/").strip("/"))
        if not history_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu history_id.")
        deleted = service.delete_history_book(history_id)
        if not deleted:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy lịch sử xem để xóa.")
        return {"ok": True}

    if method == "GET" and path.startswith("/api/library/book/") and path.endswith("/epub-url"):
        book_id = path.removeprefix("/api/library/book/").removesuffix("/epub-url").strip("/")
        book = storage.find_book(book_id)
        if not book:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        epub_path = deps.cache_dir / "epub_sources" / f"{book_id}.epub"
        if not epub_path.exists():
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Truyện này không có file EPUB nguồn.")
        return {"ok": True, "url": f"/media/epub/{book_id}.epub"}

    if method == "GET" and path.startswith("/api/library/book/") and path.endswith("/chapters"):
        book_id = path.removeprefix("/api/library/book/").removesuffix("/chapters").strip("/")
        if not book_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
        book_found = storage.find_book(book_id)
        if not book_found:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        page = int((query.get("page", ["1"])[0] or "1"))
        page_size = int((query.get("page_size", ["120"])[0] or "120"))
        mode = (query.get("mode", ["raw"])[0] or "raw").strip().lower()
        if mode not in ("raw", "trans"):
            mode = "raw"
        if mode == "trans" and not service.translation_allowed_for_book(book_found):
            mode = "raw"
        translate_mode = _get_translate_mode_from_query(handler, query)
        _, active_name_set, _ = _get_active_name_set(handler, book_id)
        active_vp_set, _ = storage.get_book_vp_set(book_id)
        data = storage.list_chapters_paged(
            book_id,
            page=page,
            page_size=page_size,
            mode=mode,
            translator=service.translator,
            translate_mode=translate_mode,
            name_set_override=active_name_set,
            vp_set_override=active_vp_set,
        )
        if mode == "trans" and translate_mode == "server":
            rows = data.get("items")
            if isinstance(rows, list) and rows:
                raw_titles = [
                    deps.normalize_vbook_display_text(str((row or {}).get("title_raw") or ""), single_line=True)
                    for row in rows
                ]
                translated_titles = service._translate_ui_texts_batch(
                    raw_titles,
                    single_line=True,
                    mode=translate_mode,
                    name_set_override=active_name_set,
                    vp_set_override=active_vp_set,
                )
                for idx, row in enumerate(rows):
                    if not isinstance(row, dict):
                        continue
                    translated = translated_titles[idx] if idx < len(translated_titles) else ""
                    row["title_display"] = translated or str(row.get("title_vi") or row.get("title_raw") or "")
        data["book_id"] = book_id
        data["mode"] = mode
        return data

    if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/refresh-toc"):
        book_id = path.removeprefix("/api/library/book/").removesuffix("/refresh-toc").strip("/")
        result = service.refresh_library_book_toc(book_id)
        return {"ok": True, **result}

    if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/translate-titles"):
        book_id = path.removeprefix("/api/library/book/").removesuffix("/translate-titles").strip("/")
        book_found = storage.find_book(book_id)
        if not book_found:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        if not service.translation_allowed_for_book(book_found):
            return {"ok": True, "skipped": True, "reason": "TRANSLATION_NOT_SUPPORTED"}
        payload = handler._read_json_body()
        translate_mode = service.resolve_translate_mode(payload.get("translation_mode"))
        _, active_name_set, _ = _get_active_name_set(handler, book_id)
        active_vp_set, _ = storage.get_book_vp_set(book_id)
        storage.translate_book_titles(
            book_id,
            service.translator,
            translate_mode,
            name_set_override=active_name_set,
            vp_set_override=active_vp_set,
        )
        return {"ok": True}

    if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/metadata"):
        book_id = path.removeprefix("/api/library/book/").removesuffix("/metadata").strip("/")
        payload = handler._read_json_body()
        updated = storage.update_book_metadata(book_id, payload)
        if not updated:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        return {"ok": True, "book": updated}

    if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/cover"):
        book_id = path.removeprefix("/api/library/book/").removesuffix("/cover").strip("/")
        form = handler._read_multipart_form()
        if "file" in form:
            file_item = form.get_file("file")
            if file_item is None:
                raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "File cover không hợp lệ.")
            updated = storage.set_book_cover_upload(book_id, file_item.filename or "cover.jpg", file_item.content)
            if not updated:
                raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            return {"ok": True, "book": updated}
        cover_url = (form.getfirst("cover_url") or "").strip()
        if cover_url:
            updated = storage.set_book_cover_url(book_id, cover_url, cover_locked=True, cover_remote_url="")
            if not updated:
                raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            return {"ok": True, "book": updated}
        raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu file cover hoặc cover_url.")

    if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/categories"):
        book_id = path.removeprefix("/api/library/book/").removesuffix("/categories").strip("/")
        payload = handler._read_json_body()
        try:
            categories = storage.set_book_categories(book_id, payload.get("category_ids") or [])
        except ValueError as exc:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", str(exc)) from exc
        except LookupError as exc:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", str(exc)) from exc
        return {"ok": True, "book_id": book_id, "categories": categories}

    if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/name-filter/preview"):
        book_id = path.removeprefix("/api/library/book/").removesuffix("/name-filter/preview").strip("/")
        payload = handler._read_json_body()
        return service.preview_book_name_filter(book_id, payload)

    if method == "GET" and path.startswith("/api/library/book/"):
        book_id = path.removeprefix("/api/library/book/").strip()
        if not book_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
        translate_titles = (query.get("translate_titles", ["0"])[0] or "0").strip() in {"1", "true", "yes"}
        refresh_online = (query.get("refresh_online", ["0"])[0] or "0").strip().lower() in {"1", "true", "yes", "on"}
        include_chapters = (query.get("include_chapters", ["1"])[0] or "1").strip().lower() in {"1", "true", "yes", "on"}
        mode = (query.get("mode", ["raw"])[0] or "raw").strip().lower()
        if mode not in ("raw", "trans"):
            mode = "raw"
        translate_mode = _get_translate_mode_from_query(handler, query)
        if refresh_online:
            try:
                service.refresh_library_book_detail_from_source(book_id)
            except Exception:
                pass
        _, active_name_set, _ = _get_active_name_set(handler, book_id)
        active_vp_set, _ = storage.get_book_vp_set(book_id)
        book_preview = storage.find_book(book_id)
        allow_translate = service.translation_allowed_for_book(book_preview)
        if mode == "trans" and not allow_translate:
            mode = "raw"
        if translate_titles and allow_translate:
            storage.translate_book_titles(
                book_id,
                service.translator,
                translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
        book = storage.get_book_detail(book_id, include_chapters=include_chapters)
        if not book:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        _apply_book_display_fields(
            handler,
            book,
            translate_mode=translate_mode,
            active_name_set=active_name_set,
            active_vp_set=active_vp_set,
            deps=deps,
        )
        if include_chapters:
            export_info = service.build_book_export_info(
                book,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            chapter_export_map = dict(export_info.get("chapter_map") or {})
            export_info.pop("chapter_map", None)
            chapters = book.get("chapters")
            if isinstance(chapters, list):
                for row in chapters:
                    if not isinstance(row, dict):
                        continue
                    cid = str(row.get("chapter_id") or "").strip()
                    row["export"] = dict(chapter_export_map.get(cid) or {})
            book["export_info"] = export_info
        if book.get("source_type") == "epub":
            epub_path = deps.cache_dir / "epub_sources" / f"{book_id}.epub"
            if epub_path.exists():
                book["epub_url"] = f"/media/epub/{book_id}.epub"
        return book

    if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/progress"):
        book_id = path.removeprefix("/api/library/book/").removesuffix("/progress").strip("/")
        payload = handler._read_json_body()
        ratio = payload.get("ratio")
        ratio_val = None
        if isinstance(ratio, (float, int)):
            ratio_val = max(0.0, min(1.0, float(ratio)))
        storage.update_book_progress(
            book_id,
            chapter_id=(payload.get("chapter_id") or None),
            ratio=ratio_val,
            mode=(payload.get("mode") or None),
            theme_pref=(payload.get("theme_pref") or None),
        )
        return {"ok": True}

    if method == "DELETE" and path.startswith("/api/library/book/"):
        book_id = unquote(path.removeprefix("/api/library/book/")).strip("/")
        if not book_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
        try:
            service.stop_download_jobs_for_book(book_id)
        except Exception:
            pass
        deleted = storage.delete_book(book_id)
        if not deleted:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện cần xóa.")
        return {"ok": True}

    if method == "POST" and path == "/api/library/cache/clear":
        result = storage.clear_translated_cache()
        return {"ok": True, **result}

    if method == "GET" and path == "/api/library/cache/summary":
        return service.get_cache_summary()

    if method == "POST" and path == "/api/library/cache/manage":
        payload = handler._read_json_body()
        return service.manage_cache(payload)

    if method == "GET" and path.startswith("/api/library/chapter/") and path.endswith("/raw"):
        chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/raw").strip("/")
        chapter = storage.find_chapter(chapter_id)
        if not chapter:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
        book = storage.find_book(chapter["book_id"])
        if not book:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        raw_key = str(chapter.get("raw_key") or "").strip()
        raw_text = storage.read_cache(raw_key) or ""
        source_type = str(book.get("source_type") or "").strip().lower()
        if (
            (not raw_text)
            and source_type.startswith("vbook")
            and chapter.get("remote_url")
            and storage.remote_chapter_fetcher
        ):
            raw_text = storage.remote_chapter_fetcher(chapter, book) or ""
        raw_state = storage.get_chapter_raw_edit_state(chapter["chapter_id"])
        comic_payload = deps.decode_comic_payload(raw_text)
        content_type = "text"
        images: list[str] = []
        response_content = raw_text
        if comic_payload is not None:
            content_type = "images"
            images = [str(x).strip() for x in (comic_payload.get("images") or []) if str(x).strip()]
            if source_type.startswith("vbook"):
                plugin_id = str(book.get("source_plugin") or "").strip()
                referer = str(chapter.get("remote_url") or book.get("source_url") or "").strip()
                images = [
                    deps.build_vbook_image_proxy_path(img, plugin_id=plugin_id, referer=referer, cache=True)
                    for img in images
                ]
            response_content = ""
        return {
            "ok": True,
            "chapter_id": chapter["chapter_id"],
            "book_id": chapter["book_id"],
            "chapter_order": chapter["chapter_order"],
            "title_raw": chapter.get("title_raw") or "",
            "content_type": content_type,
            "images": images,
            "content": response_content,
            "source_type": str(book.get("source_type") or ""),
            "remote_url": str(chapter.get("remote_url") or ""),
            "raw_edited": bool(raw_state.get("edited")),
            "raw_edit_updated_at": str(raw_state.get("updated_at") or ""),
        }

    if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/raw"):
        chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/raw").strip("/")
        chapter = storage.find_chapter(chapter_id)
        if not chapter:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
        book = storage.find_book(chapter["book_id"])
        if not book:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        payload = handler._read_json_body()
        if "content" not in payload:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu content để lưu raw.")
        raw_key = str(chapter.get("raw_key") or "").strip()
        if not raw_key:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Chương này không có raw_key để lưu.")
        source_type = str(book.get("source_type") or "").strip().lower()
        is_comic = "comic" in source_type
        content = _normalize_client_reader_text(payload.get("content") or "")
        if is_comic and deps.decode_comic_payload(content) is None:
            maybe_lines = [line.strip() for line in content.splitlines() if line.strip()]
            if maybe_lines and all(line.startswith("http://") or line.startswith("https://") for line in maybe_lines):
                content = deps.encode_comic_payload(maybe_lines)
        storage.write_cache(raw_key, str(book.get("lang_source") or "zh"), content)
        if is_comic:
            comic_payload = deps.decode_comic_payload(content) or {}
            storage.update_chapter_word_count(chapter_id, len(comic_payload.get("images") or []))
        else:
            storage.update_chapter_word_count(chapter_id, len(content))
        cleared = storage.clear_chapter_translated_cache(chapter_id)
        raw_state = storage.set_chapter_raw_edit_state(chapter_id, edited=True, source="manual")
        return {
            "ok": True,
            "chapter_id": chapter["chapter_id"],
            "book_id": chapter["book_id"],
            "source_type": str(book.get("source_type") or ""),
            "remote_url": str(chapter.get("remote_url") or ""),
            "raw_edited": bool(raw_state.get("edited")),
            "raw_edit_updated_at": str(raw_state.get("updated_at") or ""),
            **cleared,
        }

    if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/reload"):
        chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/reload").strip("/")
        return service.reload_chapter(chapter_id)

    if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/name-preview"):
        chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/name-preview").strip("/")
        chapter = storage.find_chapter(chapter_id)
        if not chapter:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
        book = storage.find_book(chapter["book_id"])
        if not book:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        if not service.translation_allowed_for_book(book):
            raise api_error(
                http_status.BAD_REQUEST,
                "TRANSLATION_NOT_SUPPORTED",
                "Nguồn truyện này không hỗ trợ dịch/name map.",
            )
        payload = handler._read_json_body()
        translate_mode = service.resolve_translate_mode(payload.get("translation_mode"))
        override_name_set = payload.get("name_set")
        if override_name_set is not None and not isinstance(override_name_set, dict):
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "name_set phải là object.")
        if override_name_set is None:
            _, override_name_set, _ = _get_active_name_set(handler, chapter["book_id"])
        active_vp_set, _ = storage.get_book_vp_set(chapter["book_id"])
        raw_text = storage.get_chapter_text(
            chapter,
            book,
            mode="raw",
            translator=service.translator,
            translate_mode=translate_mode,
            name_set_override=override_name_set if isinstance(override_name_set, dict) else None,
            vp_set_override=active_vp_set,
        )
        detail = service.translator.translate_detailed(
            raw_text,
            mode=translate_mode,
            name_set_override=override_name_set if isinstance(override_name_set, dict) else None,
            vp_set_override=active_vp_set,
        )
        detail.pop("unit_map", None)
        title_detail = service.translator.translate_detailed(
            chapter.get("title_raw") or "",
            mode=translate_mode,
            name_set_override=override_name_set if isinstance(override_name_set, dict) else None,
            vp_set_override=active_vp_set,
        )
        title_detail.pop("unit_map", None)
        return {
            "ok": True,
            "chapter_id": chapter["chapter_id"],
            "book_id": chapter["book_id"],
            "chapter_order": chapter["chapter_order"],
            "title_raw": chapter.get("title_raw") or "",
            "title_translated": title_detail.get("translated") or chapter.get("title_raw") or "",
            "title_name_map": title_detail.get("name_map") or {},
            **detail,
        }

    if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/selection-map"):
        chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/selection-map").strip("/")
        chapter = storage.find_chapter(chapter_id)
        if not chapter:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
        book = storage.find_book(chapter["book_id"])
        if not book:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        if not service.translation_allowed_for_book(book):
            raise api_error(
                http_status.BAD_REQUEST,
                "TRANSLATION_NOT_SUPPORTED",
                "Nguồn truyện này không hỗ trợ dịch/name map.",
            )
        payload = handler._read_json_body()
        selected_text = (payload.get("selected_text") or "").strip()
        if not selected_text:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu selected_text để map edit name.")
        if "start_offset" not in payload or "end_offset" not in payload:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu start_offset/end_offset.")
        try:
            start_offset = int(payload.get("start_offset"))
            end_offset = int(payload.get("end_offset"))
        except Exception as exc:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "start_offset/end_offset phải là số nguyên.") from exc
        translate_mode = service.resolve_translate_mode(payload.get("translation_mode"))
        _, active_name_set, version = _get_active_name_set(handler, chapter["book_id"])
        active_vp_set, active_vp_version = storage.get_book_vp_set(chapter["book_id"])
        raw_text = storage.get_chapter_text(
            chapter,
            book,
            mode="raw",
            translator=service.translator,
            translate_mode=translate_mode,
            name_set_override=active_name_set,
            vp_set_override=active_vp_set,
            allow_remote_fetch=False,
        )
        translated_text = ""
        current_sig = ""
        unit_map: list[dict[str, Any]] = []
        token_map: list[dict[str, Any]] = []
        name_set_for_mapping = None
        if translate_mode == "server":
            displayed_sig = str(payload.get("displayed_trans_sig") or "").strip()
            current_sig = displayed_sig or str(chapter.get("trans_sig") or "").strip()
            translated_text = _normalize_client_reader_text(payload.get("translated_text") or "")
            if not translated_text:
                trans_key = str(chapter.get("trans_key") or "").strip()
                chapter_sig = str(chapter.get("trans_sig") or "").strip()
                if trans_key and current_sig and chapter_sig == current_sig:
                    translated_text = storage.read_cache(trans_key) or ""
            if current_sig:
                unit_map = storage.get_translation_unit_map(chapter["chapter_id"], current_sig, translate_mode)
                snapshot = storage.get_chapter_trans_sig_snapshot(current_sig)
                if isinstance(snapshot, dict) and isinstance(snapshot.get("name_set"), dict):
                    name_set_for_mapping = snapshot.get("name_set")
        else:
            translated_text = storage.get_chapter_text(
                chapter,
                book,
                mode="trans",
                translator=service.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            base_sig = service.translator.translation_signature(
                mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            _, junk_version = storage.get_global_junk_lines()
            current_sig = storage.chapter_trans_signature(base_sig, junk_version=junk_version)
            unit_map = storage.get_translation_unit_map(chapter["chapter_id"], current_sig, translate_mode)
            if not unit_map:
                detail = service.translator.translate_detailed(
                    raw_text,
                    mode=translate_mode,
                    name_set_override=active_name_set,
                    vp_set_override=active_vp_set,
                )
                storage.save_translation_unit_map(
                    chapter["chapter_id"],
                    current_sig,
                    translate_mode,
                    detail.get("unit_map") if isinstance(detail.get("unit_map"), list) else [],
                )
                unit_map = storage.get_translation_unit_map(chapter["chapter_id"], current_sig, translate_mode)
                if translate_mode in {"local", "hanviet", "dichngay_local"}:
                    token_map = detail.get("token_map") if isinstance(detail.get("token_map"), list) else []
            elif translate_mode in {"local", "hanviet", "dichngay_local"}:
                detail = service.translator.translate_detailed(
                    raw_text,
                    mode=translate_mode,
                    name_set_override=active_name_set,
                    vp_set_override=active_vp_set,
                )
                token_map = detail.get("token_map") if isinstance(detail.get("token_map"), list) else []
        state = _get_name_set_state(handler, chapter["book_id"])
        if translate_mode == "server":
            effective_name_set = name_set_for_mapping if isinstance(name_set_for_mapping, dict) else service.translator._server_name_set_for_use(active_name_set)
        else:
            effective_name_set = service.translator._name_set_for_use(active_name_set)
        mapped = deps.map_selection_to_name_source(
            raw_text=raw_text,
            translated_text=translated_text,
            selected_text=selected_text,
            start_offset=start_offset,
            end_offset=end_offset,
            name_set=effective_name_set,
            unit_map=unit_map,
            token_map=token_map,
            translation_mode=translate_mode,
        )
        return {
            "ok": True,
            "chapter_id": chapter["chapter_id"],
            "book_id": chapter["book_id"],
            "translation_mode": translate_mode,
            "map_version": 1,
            "active_set": str(state.get("active_set") or "").strip(),
            "name_set_version": max(1, version),
            "vp_set_version": max(1, active_vp_version),
            **mapped,
        }

    if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/selection-source"):
        chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/selection-source").strip("/")
        chapter = storage.find_chapter(chapter_id)
        if not chapter:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
        book = storage.find_book(chapter["book_id"])
        if not book:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        payload = handler._read_json_body()
        selected_text = (payload.get("selected_text") or "").strip()
        if not selected_text:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu selected_text để xác định source.")
        if "start_offset" not in payload or "end_offset" not in payload:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu start_offset/end_offset.")
        try:
            start_offset = int(payload.get("start_offset"))
            end_offset = int(payload.get("end_offset"))
        except Exception as exc:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "start_offset/end_offset phải là số nguyên.") from exc
        selected_mode = str(payload.get("mode") or "raw").strip().lower()
        if selected_mode not in {"raw", "trans"}:
            selected_mode = "raw"
        translate_mode = service.resolve_translate_mode(payload.get("translation_mode"))
        _, active_name_set, _ = _get_active_name_set(handler, chapter["book_id"])
        active_vp_set, _ = storage.get_book_vp_set(chapter["book_id"])
        raw_text = storage.get_chapter_text(
            chapter,
            book,
            mode="raw",
            translator=service.translator,
            translate_mode=translate_mode,
            name_set_override=active_name_set,
            vp_set_override=active_vp_set,
            allow_remote_fetch=False,
        )
        if selected_mode == "raw" or not service.translation_allowed_for_book(book):
            idx = raw_text.find(selected_text)
            return {
                "ok": True,
                "chapter_id": chapter["chapter_id"],
                "book_id": chapter["book_id"],
                "selected_text": selected_text,
                "source_candidate": selected_text,
                "translated_candidate": selected_text,
                "match_type": "raw_selection",
                "source_context": deps.text_snippet(raw_text, idx, idx + len(selected_text)) if idx >= 0 else "",
                "translated_context": selected_text,
                "candidates": [{"source": selected_text, "score": 1.0}] if selected_text else [],
            }
        translated_text = ""
        unit_map: list[dict[str, Any]] = []
        token_map: list[dict[str, Any]] = []
        if translate_mode == "server":
            current_sig = str(payload.get("displayed_trans_sig") or "").strip() or str(chapter.get("trans_sig") or "").strip()
            translated_text = _normalize_client_reader_text(payload.get("translated_text") or "")
            if not translated_text:
                trans_key = str(chapter.get("trans_key") or "").strip()
                chapter_sig = str(chapter.get("trans_sig") or "").strip()
                if trans_key and current_sig and chapter_sig == current_sig:
                    translated_text = storage.read_cache(trans_key) or ""
            if current_sig:
                unit_map = storage.get_translation_unit_map(chapter["chapter_id"], current_sig, translate_mode)
        else:
            translated_text = storage.get_chapter_text(
                chapter,
                book,
                mode="trans",
                translator=service.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            base_sig = service.translator.translation_signature(
                mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            _, junk_version = storage.get_global_junk_lines()
            current_sig = storage.chapter_trans_signature(base_sig, junk_version=junk_version)
            unit_map = storage.get_translation_unit_map(chapter["chapter_id"], current_sig, translate_mode)
            if not unit_map or translate_mode in {"local", "hanviet", "dichngay_local"}:
                detail = service.translator.translate_detailed(
                    raw_text,
                    mode=translate_mode,
                    name_set_override=active_name_set,
                    vp_set_override=active_vp_set,
                )
                if not unit_map:
                    storage.save_translation_unit_map(
                        chapter["chapter_id"],
                        current_sig,
                        translate_mode,
                        detail.get("unit_map") if isinstance(detail.get("unit_map"), list) else [],
                    )
                    unit_map = storage.get_translation_unit_map(chapter["chapter_id"], current_sig, translate_mode)
                if translate_mode in {"local", "hanviet", "dichngay_local"}:
                    token_map = detail.get("token_map") if isinstance(detail.get("token_map"), list) else []
        resolved = deps.map_selection_to_source_segment(
            raw_text=raw_text,
            translated_text=translated_text,
            selected_text=selected_text,
            start_offset=start_offset,
            end_offset=end_offset,
            unit_map=unit_map,
            token_map=token_map,
            translation_mode=translate_mode,
        )
        return {
            "ok": True,
            "chapter_id": chapter["chapter_id"],
            "book_id": chapter["book_id"],
            "translation_mode": translate_mode,
            **resolved,
        }

    if method == "GET" and path.startswith("/api/library/chapter/"):
        chapter_id = path.removeprefix("/api/library/chapter/").strip()
        chapter = storage.find_chapter(chapter_id)
        if not chapter:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
        book = storage.find_book(chapter["book_id"])
        if not book:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        trans_supported = service.translation_allowed_for_book(book)
        mode = (query.get("mode", ["raw"])[0] or "raw").strip().lower()
        if mode not in ("raw", "trans"):
            mode = "raw"
        translate_mode = _get_translate_mode_from_query(handler, query)
        if mode == "trans" and not trans_supported:
            mode = "raw"
        _, active_name_set, _ = _get_active_name_set(handler, chapter["book_id"])
        active_vp_set, _ = storage.get_book_vp_set(chapter["book_id"])
        text = storage.get_chapter_text(
            chapter,
            book,
            mode=mode,
            translator=service.translator,
            translate_mode=translate_mode,
            name_set_override=active_name_set,
            vp_set_override=active_vp_set,
        )
        include_name_map = (query.get("include_name_map", ["0"])[0] or "0").strip().lower() in {"1", "true", "yes"}
        name_preview = None
        if include_name_map and mode == "trans" and trans_supported:
            raw_text = storage.get_chapter_text(
                chapter,
                book,
                mode="raw",
                translator=service.translator,
                translate_mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            name_preview = service.translator.translate_detailed(
                raw_text,
                mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            if isinstance(name_preview, dict):
                name_preview.pop("unit_map", None)
        comic_payload = deps.decode_comic_payload(text)
        response_content = text
        content_type = "text"
        images: list[str] = []
        if comic_payload is not None:
            content_type = "images"
            images = [str(x).strip() for x in (comic_payload.get("images") or []) if str(x).strip()]
            source_type = str(book.get("source_type") or "").strip().lower()
            if source_type.startswith("vbook"):
                plugin_id = str(book.get("source_plugin") or "").strip()
                referer = str(chapter.get("remote_url") or book.get("source_url") or "").strip()
                images = [
                    deps.build_vbook_image_proxy_path(img, plugin_id=plugin_id, referer=referer, cache=True)
                    for img in images
                ]
            response_content = ""
        output_mode = mode if trans_supported else "raw"
        title_vi = deps.normalize_vi_display_text(chapter.get("title_vi") or "")
        response_title = chapter["title_raw"]
        if output_mode == "trans":
            response_title = service._translate_ui_text_with_dicts(
                chapter["title_raw"],
                single_line=True,
                mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            ) or title_vi or chapter["title_raw"]
        raw_state = storage.get_chapter_raw_edit_state(chapter["chapter_id"])
        response = {
            "chapter_id": chapter["chapter_id"],
            "book_id": chapter["book_id"],
            "chapter_order": chapter["chapter_order"],
            "title_raw": chapter["title_raw"],
            "title_vi": title_vi,
            "title": response_title,
            "is_vip": bool(chapter.get("is_vip")),
            "mode": output_mode,
            "content_type": content_type,
            "images": images,
            "content": response_content,
            "is_downloaded": bool(service._chapter_cache_available(chapter, book)),
            "source_type": str(book.get("source_type") or ""),
            "remote_url": str(chapter.get("remote_url") or ""),
            "raw_edited": bool(raw_state.get("edited")),
            "raw_edit_updated_at": str(raw_state.get("updated_at") or ""),
        }
        if output_mode == "trans":
            base_sig = service.translator.translation_signature(
                mode=translate_mode,
                name_set_override=active_name_set,
                vp_set_override=active_vp_set,
            )
            _, junk_version = storage.get_global_junk_lines()
            cur_sig = storage.chapter_trans_signature(base_sig, junk_version=junk_version)
            response["trans_sig"] = cur_sig
            response["map_version"] = 1
            response["unit_count"] = storage.get_translation_unit_map_count(
                chapter["chapter_id"],
                cur_sig,
                translate_mode,
            )
        if name_preview:
            response["name_map"] = name_preview.get("name_map") or {}
            response["processed_text"] = name_preview.get("processed_text") or ""
            response["translated_with_placeholders"] = name_preview.get("translated_with_placeholders") or ""
        return response

    if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/translate"):
        chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/translate").strip("/")
        payload = handler._read_json_body()
        translate_mode = service.resolve_translate_mode(payload.get("translation_mode"))
        chapter = storage.find_chapter(chapter_id)
        if not chapter:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
        book = storage.find_book(chapter["book_id"])
        if not book:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
        if not service.translation_allowed_for_book(book):
            raw_text = storage.get_chapter_text(
                chapter,
                book,
                mode="raw",
                translator=service.translator,
                translate_mode=translate_mode,
            )
            return {
                "ok": True,
                "chapter_id": chapter_id,
                "mode": "raw",
                "skipped": True,
                "reason": "TRANSLATION_NOT_SUPPORTED",
                "content": raw_text,
            }
        _, active_name_set, _ = _get_active_name_set(handler, chapter["book_id"])
        active_vp_set, _ = storage.get_book_vp_set(chapter["book_id"])
        text = storage.get_chapter_text(
            chapter,
            book,
            mode="trans",
            translator=service.translator,
            translate_mode=translate_mode,
            name_set_override=active_name_set,
            vp_set_override=active_vp_set,
        )
        return {
            "ok": True,
            "chapter_id": chapter_id,
            "mode": "trans",
            "content": text,
        }

    if method == "GET" and path == "/api/search":
        query_text = query.get("q", [""])[0]
        return service.search(query_text)

    return None
