from __future__ import annotations

import sqlite3
import time
from pathlib import Path
from typing import Any


def book_cover_url(
    storage,
    book: dict[str, Any] | None,
    *,
    build_vbook_image_proxy_path,
    quote_url_path,
) -> str:
    if not book:
        return ""
    cover = str(book.get("cover_path") or "").strip()
    if not cover:
        return ""
    if cover.startswith(("http://", "https://", "data:")):
        source_type = str(book.get("source_type") or "").strip().lower()
        if source_type.startswith("vbook"):
            return build_vbook_image_proxy_path(
                cover,
                plugin_id=str(book.get("source_plugin") or "").strip(),
                referer=str(book.get("source_url") or "").strip(),
            )
        return cover
    return f"/media/cover/{quote_url_path(Path(cover).name)}"


def list_books(
    storage,
    *,
    include_session: bool = False,
    normalize_vi_display_text,
    normalize_lang_source,
    book_supports_translation,
    is_book_comic,
) -> list[dict[str, Any]]:
    with storage._connect() as conn:
        sql = """
            SELECT b.book_id, b.title, b.title_vi, b.author, b.lang_source, b.source_type, b.source_file_path,
                   b.source_url, b.source_plugin,
                   b.author_vi, b.cover_path, b.extra_link,
                   b.created_at, b.updated_at, b.chapter_count,
                   b.last_read_chapter_id, b.last_read_ratio, b.last_read_mode, b.theme_pref,
                   b.summary,
                   lr.chapter_order AS lr_chapter_order,
                   lr.title_raw AS lr_title_raw,
                   lr.title_vi AS lr_title_vi,
                   fc.chapter_order AS first_chapter_order,
                   fc.title_raw AS first_title_raw,
                   fc.title_vi AS first_title_vi,
                   COALESCE(dc.downloaded_chapters, 0) AS downloaded_chapters_hint
            FROM books b
            LEFT JOIN chapters lr ON lr.chapter_id = b.last_read_chapter_id
            LEFT JOIN chapters fc ON fc.chapter_id = (
                SELECT c.chapter_id FROM chapters c
                WHERE c.book_id = b.book_id
                ORDER BY c.chapter_order ASC
                LIMIT 1
            )
            LEFT JOIN (
                SELECT c.book_id AS book_id, COUNT(1) AS downloaded_chapters
                FROM chapters c
                JOIN content_cache cc ON cc.cache_key = c.raw_key
                GROUP BY c.book_id
            ) dc ON dc.book_id = b.book_id
        """
        if not include_session:
            sql += "\nWHERE lower(COALESCE(b.source_type, '')) NOT LIKE 'vbook_session%'"
        sql += "\nORDER BY b.updated_at DESC"
        rows = conn.execute(sql).fetchall()
    category_map = storage.get_book_categories_map(
        [str(dict(row).get("book_id") or "").strip() for row in rows]
    )
    output: list[dict[str, Any]] = []
    for row in rows:
        item = dict(row)
        item["title_vi"] = normalize_vi_display_text(item.get("title_vi") or "")
        item["author_vi"] = normalize_vi_display_text(item.get("author_vi") or "")
        item["title_display"] = item.get("title_vi") or item.get("title")
        item["author_display"] = item.get("author_vi") or item.get("author")
        item["lang_source"] = normalize_lang_source(item.get("lang_source") or "") or str(item.get("lang_source") or "")
        item["translation_supported"] = bool(book_supports_translation(item))
        item["is_comic"] = bool(is_book_comic(item))
        item["cover_url"] = storage._book_cover_url(item)

        if item.get("last_read_chapter_id") and item.get("lr_chapter_order"):
            cur_order = int(item.get("lr_chapter_order") or 1)
            cur_title_raw = str(item.get("lr_title_raw") or "").strip()
            cur_title_vi = normalize_vi_display_text(item.get("lr_title_vi") or "")
        else:
            cur_order = int(item.get("first_chapter_order") or 1)
            cur_title_raw = str(item.get("first_title_raw") or "").strip()
            cur_title_vi = normalize_vi_display_text(item.get("first_title_vi") or "")

        item["current_chapter_order"] = cur_order
        item["current_chapter_title_raw"] = cur_title_raw
        item["current_chapter_title_vi"] = cur_title_vi
        item["current_chapter_title_display"] = cur_title_vi or cur_title_raw or f"Chương {cur_order}"

        total = max(1, int(item.get("chapter_count") or 1))
        ratio = float(item.get("last_read_ratio") or 0.0)
        ratio = 0.0 if ratio < 0 else (1.0 if ratio > 1 else ratio)
        if not item.get("last_read_chapter_id"):
            item["progress_percent"] = 0.0
        else:
            item["progress_percent"] = max(0.0, min(100.0, (((cur_order - 1) + ratio) / total) * 100.0))
        cached_hint = int(item.get("downloaded_chapters_hint") or 0)
        if cached_hint > 0:
            downloaded_count, _ = storage.get_book_download_counts(str(item.get("book_id") or ""))
        else:
            downloaded_count = 0
        item["downloaded_chapters"] = max(0, min(total, int(downloaded_count or 0)))
        item["categories"] = category_map.get(str(item.get("book_id") or "").strip(), [])
        output.append(item)
    return output


def find_book(storage, book_id: str) -> dict[str, Any] | None:
    with storage._connect() as conn:
        row = conn.execute("SELECT * FROM books WHERE book_id = ?", (book_id,)).fetchone()
    return dict(row) if row else None


def find_book_by_source(
    storage,
    source_url: str,
    source_plugin: str | None = None,
    *,
    include_session: bool = True,
) -> dict[str, Any] | None:
    source = str(source_url or "").strip()
    plugin = str(source_plugin or "").strip()
    if not source:
        return None
    with storage._connect() as conn:
        if plugin:
            sql = """
                SELECT * FROM books
                WHERE source_url = ? AND source_plugin = ?
            """
            params: list[Any] = [source, plugin]
            if not include_session:
                sql += " AND lower(COALESCE(source_type, '')) NOT LIKE 'vbook_session%'"
            sql += """
                ORDER BY updated_at DESC
                LIMIT 1
            """
            row = conn.execute(sql, tuple(params)).fetchone()
        else:
            sql = """
                SELECT * FROM books
                WHERE source_url = ?
            """
            params = [source]
            if not include_session:
                sql += " AND lower(COALESCE(source_type, '')) NOT LIKE 'vbook_session%'"
            sql += """
                ORDER BY updated_at DESC
                LIMIT 1
            """
            row = conn.execute(sql, tuple(params)).fetchone()
    return dict(row) if row else None


def find_books_by_source(
    storage,
    source_url: str,
    source_plugin: str | None = None,
    *,
    include_session: bool = True,
    session_only: bool = False,
) -> list[dict[str, Any]]:
    source = str(source_url or "").strip()
    plugin = str(source_plugin or "").strip()
    if not source:
        return []
    with storage._connect() as conn:
        sql = """
            SELECT * FROM books
            WHERE source_url = ?
        """
        params: list[Any] = [source]
        if plugin:
            sql += " AND source_plugin = ?"
            params.append(plugin)
        if session_only:
            sql += " AND lower(COALESCE(source_type, '')) LIKE 'vbook_session%'"
        elif not include_session:
            sql += " AND lower(COALESCE(source_type, '')) NOT LIKE 'vbook_session%'"
        sql += " ORDER BY updated_at DESC"
        rows = conn.execute(sql, tuple(params)).fetchall()
    return [dict(row) for row in rows]


def update_book_metadata(storage, book_id: str, payload: dict[str, Any], *, utc_now_iso) -> dict[str, Any] | None:
    book = storage.find_book(book_id)
    if not book:
        return None
    now = utc_now_iso()
    allowed: dict[str, str] = {}
    for key in ("title", "title_vi", "author", "author_vi", "summary", "extra_link", "cover_path"):
        if key not in payload:
            continue
        allowed[key] = str(payload.get(key) or "").strip()

    set_parts: list[str] = []
    values: list[Any] = []
    for key, value in allowed.items():
        if key == "title" and not value:
            continue
        set_parts.append(f"{key} = ?")
        values.append(value)
    if not set_parts:
        return storage.get_book_detail(book_id)
    set_parts.append("updated_at = ?")
    values.append(now)
    values.append(book_id)
    with storage._connect() as conn:
        conn.execute(f"UPDATE books SET {', '.join(set_parts)} WHERE book_id = ?", tuple(values))
    return storage.get_book_detail(book_id)


def list_chapters_paged(
    storage,
    book_id: str,
    *,
    page: int,
    page_size: int,
    mode: str,
    translator,
    translate_mode: str,
    name_set_override: dict[str, str] | None = None,
    vp_set_override: dict[str, str] | None = None,
    book_supports_translation,
    normalize_vi_display_text,
) -> dict[str, Any]:
    page = max(1, int(page))
    page_size = max(1, min(200, int(page_size)))
    live_title_mode = translate_mode in {"local", "hanviet"}

    book_row = storage.find_book(book_id)
    with storage._connect() as conn:
        total = conn.execute("SELECT COUNT(1) AS c FROM chapters WHERE book_id = ?", (book_id,)).fetchone()["c"]
        offset = (page - 1) * page_size
        rows = conn.execute(
            """
            SELECT c.chapter_id, c.chapter_order, c.title_raw, c.title_vi, c.updated_at, c.word_count, c.trans_key, c.raw_key,
                   CASE WHEN cc.cache_key IS NOT NULL THEN 1 ELSE 0 END AS is_downloaded
            FROM chapters c
            LEFT JOIN content_cache cc ON cc.cache_key = c.raw_key
            WHERE c.book_id = ?
            ORDER BY chapter_order ASC
            LIMIT ? OFFSET ?
            """,
            (book_id, page_size, offset),
        ).fetchall()
    items = []
    for row in rows:
        item = dict(row)
        item["title_vi"] = normalize_vi_display_text(item.get("title_vi") or "")
        if mode == "trans":
            if live_title_mode and book_supports_translation(book_row):
                try:
                    display_title = normalize_vi_display_text(
                        translator.translate_detailed(
                            item.get("title_raw") or "",
                            mode=translate_mode,
                            name_set_override=name_set_override,
                            vp_set_override=vp_set_override,
                        ).get("translated", "")
                    ) or item["title_raw"]
                except Exception:
                    display_title = item["title_raw"]
            else:
                display_title = item["title_vi"] if item.get("title_vi") else item["title_raw"]
        else:
            display_title = item["title_raw"]
        raw_key = str(item.get("raw_key") or "").strip()
        cached_raw = storage.read_cache(raw_key) if raw_key else None
        valid_cached = storage.chapter_cache_available(raw_text=cached_raw, book=book_row) if cached_raw is not None else False
        items.append(
            {
                "chapter_id": item["chapter_id"],
                "chapter_order": item["chapter_order"],
                "title_raw": item["title_raw"],
                "title_vi": item.get("title_vi"),
                "title_display": display_title,
                "updated_at": item["updated_at"],
                "word_count": int(item["word_count"] or 0) if valid_cached else 0,
                "has_trans": bool(item.get("trans_key")),
                "is_downloaded": bool(valid_cached),
            }
        )
    total_pages = max(1, (total + page_size - 1) // page_size)
    return {
        "items": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": total_pages,
        },
    }


def get_chapter_rows(storage, book_id: str) -> list[dict[str, Any]]:
    with storage._connect() as conn:
        rows = conn.execute(
            """
            SELECT chapter_id, book_id, chapter_order, title_raw, title_vi,
                   raw_key, trans_key, trans_sig, updated_at, word_count, remote_url
            FROM chapters
            WHERE book_id = ?
            ORDER BY chapter_order ASC
            """,
            (book_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def find_chapter(storage, chapter_id: str) -> dict[str, Any] | None:
    with storage._connect() as conn:
        row = conn.execute("SELECT * FROM chapters WHERE chapter_id = ?", (chapter_id,)).fetchone()
    return dict(row) if row else None


def get_book_download_map(storage, book_id: str, chapter_ids: list[str] | None = None) -> dict[str, bool]:
    bid = str(book_id or "").strip()
    if not bid:
        return {}
    chapter_filter = [str(item or "").strip() for item in (chapter_ids or []) if str(item or "").strip()]
    book = storage.find_book(bid)
    with storage._connect() as conn:
        if chapter_filter:
            placeholders = ",".join("?" for _ in chapter_filter)
            rows = conn.execute(
                f"""
                SELECT c.chapter_id, c.raw_key
                FROM chapters c
                WHERE c.book_id = ? AND c.chapter_id IN ({placeholders})
                ORDER BY c.chapter_order ASC
                """,
                (bid, *chapter_filter),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT c.chapter_id, c.raw_key
                FROM chapters c
                WHERE c.book_id = ?
                ORDER BY c.chapter_order ASC
                """,
                (bid,),
            ).fetchall()
    output: dict[str, bool] = {}
    for row in rows:
        cid = str(row["chapter_id"] or "").strip()
        if not cid:
            continue
        raw_key = str(row["raw_key"] or "").strip()
        cached_raw = storage.read_cache(raw_key) if raw_key else None
        output[cid] = storage.chapter_cache_available(raw_text=cached_raw, book=book) if cached_raw is not None else False
    return output


def get_book_download_counts(storage, book_id: str) -> tuple[int, int]:
    bid = str(book_id or "").strip()
    if not bid:
        return (0, 0)
    download_map = storage.get_book_download_map(bid)
    total = int(len(download_map))
    downloaded = int(sum(1 for value in download_map.values() if value))
    if downloaded < 0:
        downloaded = 0
    if downloaded > total:
        downloaded = total
    return downloaded, total


def update_book_progress(
    storage,
    book_id: str,
    *,
    chapter_id: str | None,
    ratio: float | None,
    mode: str | None,
    theme_pref: str | None,
    utc_now_iso,
) -> None:
    now = utc_now_iso()
    for attempt in range(4):
        try:
            with storage._connect() as conn:
                conn.execute(
                    """
                    UPDATE books SET
                        last_read_chapter_id = COALESCE(?, last_read_chapter_id),
                        last_read_ratio = COALESCE(?, last_read_ratio),
                        last_read_mode = COALESCE(?, last_read_mode),
                        theme_pref = COALESCE(?, theme_pref),
                        updated_at = ?
                    WHERE book_id = ?
                    """,
                    (chapter_id, ratio, mode, theme_pref, now, book_id),
                )
            return
        except sqlite3.OperationalError as exc:
            if "locked" not in str(exc).lower():
                raise
            if attempt >= 3:
                # Lưu tiến độ là best-effort; không làm hỏng request đọc chỉ vì DB đang bận.
                return
            time.sleep(0.12 * (attempt + 1))


def get_book_detail(
    storage,
    book_id: str,
    *,
    include_chapters: bool = True,
    normalize_lang_source,
    book_supports_translation,
    is_book_comic,
    normalize_vi_display_text,
) -> dict[str, Any] | None:
    book = storage.find_book(book_id)
    if not book:
        return None
    chapters = storage.get_chapter_rows(book_id) if include_chapters else []
    download_map = storage.get_book_download_map(book_id) if include_chapters else {}
    categories = storage.get_book_categories(book_id)
    if include_chapters:
        downloaded_count = sum(1 for value in download_map.values() if value)
    else:
        downloaded_count, _ = storage.get_book_download_counts(book_id)
    book["lang_source"] = normalize_lang_source(book.get("lang_source") or "") or str(book.get("lang_source") or "")
    book["translation_supported"] = bool(book_supports_translation(book))
    book["is_comic"] = bool(is_book_comic(book))
    book["title_vi"] = normalize_vi_display_text(book.get("title_vi") or "")
    book["author_vi"] = normalize_vi_display_text(book.get("author_vi") or "")
    book["title_display"] = book.get("title_vi") or book.get("title")
    book["author_display"] = book.get("author_vi") or book.get("author")
    book["cover_url"] = storage._book_cover_url(book)
    book["chapters"] = [
        {
            "chapter_id": ch["chapter_id"],
            "chapter_order": ch["chapter_order"],
            "title_raw": ch["title_raw"],
            "title_vi": normalize_vi_display_text(ch["title_vi"] or ""),
            "title_display": normalize_vi_display_text(ch["title_vi"] or "") or ch["title_raw"],
            "updated_at": ch["updated_at"],
            "word_count": int(ch["word_count"] or 0) if bool(download_map.get(str(ch.get("chapter_id") or "").strip(), False)) else 0,
            "has_trans": bool(ch.get("trans_key")),
            "is_downloaded": bool(download_map.get(str(ch.get("chapter_id") or "").strip(), False)),
            "remote_url": str(ch.get("remote_url") or ""),
        }
        for ch in chapters
    ] if include_chapters else []
    book["downloaded_chapters"] = int(max(0, min(int(book.get("chapter_count") or len(chapters) or 0), downloaded_count)))
    book["categories"] = categories
    return book


def search(
    storage,
    query: str,
    *,
    normalize_vi_display_text,
) -> dict[str, Any]:
    key = str(query or "").strip().lower()
    if not key:
        books = storage.list_books()
        return {"books": books, "chapters": []}

    with storage._connect() as conn:
        book_rows = conn.execute(
            """
            SELECT book_id, title, title_vi, author, author_vi, lang_source, source_type, chapter_count, updated_at, cover_path
            FROM books
            WHERE lower(COALESCE(source_type, '')) NOT LIKE 'vbook_session%'
              AND (
                lower(title) LIKE ? OR lower(COALESCE(title_vi,'')) LIKE ?
                OR lower(author) LIKE ? OR lower(COALESCE(author_vi,'')) LIKE ?
              )
            ORDER BY updated_at DESC
            """,
            (f"%{key}%", f"%{key}%", f"%{key}%", f"%{key}%"),
        ).fetchall()

        chapter_rows = conn.execute(
            """
            SELECT c.chapter_id, c.book_id, c.chapter_order, c.title_raw, c.title_vi,
                   b.title AS book_title, b.title_vi AS book_title_vi
            FROM chapters c
            JOIN books b ON b.book_id = c.book_id
            WHERE lower(COALESCE(b.source_type, '')) NOT LIKE 'vbook_session%'
              AND (lower(c.title_raw) LIKE ? OR lower(COALESCE(c.title_vi, '')) LIKE ?)
            ORDER BY c.updated_at DESC
            LIMIT 120
            """,
            (f"%{key}%", f"%{key}%"),
        ).fetchall()

    return {
        "books": [
            {
                **row,
                "title_vi": normalize_vi_display_text(row.get("title_vi") or ""),
                "author_vi": normalize_vi_display_text(row.get("author_vi") or ""),
                "title_display": normalize_vi_display_text(row.get("title_vi") or "") or row.get("title"),
                "author_display": normalize_vi_display_text(row.get("author_vi") or "") or row.get("author"),
                "cover_url": storage._book_cover_url(row),
            }
            for row in (dict(item) for item in book_rows)
        ],
        "chapters": [
            {
                **row,
                "title_vi": normalize_vi_display_text(row.get("title_vi") or ""),
                "book_title_vi": normalize_vi_display_text(row.get("book_title_vi") or ""),
                "title_display": normalize_vi_display_text(row.get("title_vi") or "") or row.get("title_raw"),
                "book_title_display": normalize_vi_display_text(row.get("book_title_vi") or "") or row.get("book_title"),
            }
            for row in (dict(item) for item in chapter_rows)
        ],
    }
