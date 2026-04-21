from __future__ import annotations

import json
import sqlite3
import time
import unicodedata
from pathlib import Path
from typing import Any


def normalize_search_text(value: Any) -> str:
    text = unicodedata.normalize("NFKC", str(value or "")).casefold()
    return " ".join(text.split())


def _strip_search_diacritics(value: str) -> str:
    normalized = "".join(ch for ch in unicodedata.normalize("NFKD", value) if unicodedata.category(ch) != "Mn")
    return normalized.replace("đ", "d").replace("Đ", "D")


def build_search_text(*values: Any) -> str:
    parts: list[str] = []
    seen: set[str] = set()
    for raw in values:
        folded = normalize_search_text(raw)
        if folded and folded not in seen:
            seen.add(folded)
            parts.append(folded)
        ascii_folded = _strip_search_diacritics(folded)
        if ascii_folded and ascii_folded not in seen:
            seen.add(ascii_folded)
            parts.append(ascii_folded)
    return "\n".join(parts)


def build_book_search_text(
    *,
    title: Any = "",
    title_vi: Any = "",
    author: Any = "",
    author_vi: Any = "",
) -> str:
    return build_search_text(title, title_vi, author, author_vi)


def build_chapter_search_text(
    *,
    title_raw: Any = "",
    title_vi: Any = "",
) -> str:
    return build_search_text(title_raw, title_vi)


DEFAULT_BOOK_VOLUME_TITLE = "Mục lục"


def normalize_volume_title(value: Any) -> str:
    text = str(value or "").strip()
    return text or DEFAULT_BOOK_VOLUME_TITLE


def is_remote_library_source(book: dict[str, Any] | None) -> bool:
    source_type = str((book or {}).get("source_type") or "").strip().lower()
    return bool(source_type.startswith("vbook"))


def build_book_volume_manage_policy(
    book: dict[str, Any] | None,
    *,
    is_default_volume: bool,
    deleted_retention_days: int = 30,
) -> dict[str, Any]:
    is_remote_book = is_remote_library_source(book)
    can_append = (not is_default_volume) or (not is_remote_book)
    can_delete = (not is_default_volume) or (not is_remote_book)
    return {
        "source_mode": "link" if is_remote_book else "file",
        "is_remote_book": bool(is_remote_book),
        "is_default_volume": bool(is_default_volume),
        "can_rename": True,
        "can_append": bool(can_append),
        "can_delete": bool(can_delete),
        "sync_with_source_toc": bool(is_remote_book and is_default_volume),
        "deleted_retention_days": max(1, int(deleted_retention_days or 30)),
    }


def build_default_book_volume_id(book_id: str, *, hash_text) -> str:
    bid = str(book_id or "").strip()
    return f"vol_{hash_text(f'{bid}|default_toc')}"


def ensure_default_book_volume(
    storage,
    book_id: str,
    *,
    conn: sqlite3.Connection,
    hash_text,
    utc_now_iso,
) -> str:
    bid = str(book_id or "").strip()
    if not bid:
        raise ValueError("Thiếu book_id.")
    row = conn.execute(
        """
        SELECT volume_id
        FROM book_volumes
        WHERE book_id = ?
          AND trim(COALESCE(deleted_at, '')) = ''
        ORDER BY volume_order ASC, created_at ASC, volume_id ASC
        LIMIT 1
        """,
        (bid,),
    ).fetchone()
    if row and str(row["volume_id"] or "").strip():
        return str(row["volume_id"] or "").strip()
    now = utc_now_iso()
    volume_id = build_default_book_volume_id(bid, hash_text=hash_text)
    conn.execute(
        """
        INSERT INTO book_volumes(
            volume_id, book_id, volume_order, volume_kind, title_raw, title_vi, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(volume_id) DO UPDATE SET
            volume_kind = excluded.volume_kind,
            deleted_at = '',
            delete_expire_at = '',
            updated_at = excluded.updated_at
        """,
        (volume_id, bid, 1, "default", DEFAULT_BOOK_VOLUME_TITLE, DEFAULT_BOOK_VOLUME_TITLE, now, now),
    )
    return volume_id


def list_book_volumes(
    storage,
    book_id: str,
    *,
    mode: str,
    translator,
    translate_mode: str,
    name_set_override: dict[str, str] | None = None,
    vp_set_override: dict[str, str] | None = None,
    book_supports_translation,
    normalize_vi_display_text,
    deleted_retention_days: int = 30,
) -> list[dict[str, Any]]:
    bid = str(book_id or "").strip()
    if not bid:
        return []
    book_row = storage.find_book(bid)
    live_title_mode = translate_mode in {"local", "hanviet", "dichngay_local"}
    with storage._connect() as conn:
        rows = conn.execute(
            """
            SELECT v.volume_id, v.volume_order, v.volume_kind, v.title_raw, v.title_vi, v.created_at, v.updated_at,
                   COUNT(c.chapter_id) AS chapter_count,
                   MIN(c.chapter_order) AS first_chapter_order,
                   MAX(c.chapter_order) AS last_chapter_order
            FROM book_volumes v
            LEFT JOIN chapters c
              ON c.book_id = v.book_id
             AND c.volume_id = v.volume_id
             AND trim(COALESCE(c.deleted_at, '')) = ''
            WHERE v.book_id = ?
              AND trim(COALESCE(v.deleted_at, '')) = ''
            GROUP BY v.volume_id, v.volume_order, v.volume_kind, v.title_raw, v.title_vi, v.created_at, v.updated_at
            ORDER BY v.volume_order ASC, v.created_at ASC, v.volume_id ASC
            """,
            (bid,),
        ).fetchall()
        batch_rows = conn.execute(
            """
            SELECT batch_id, volume_id, file_mode, note, payload_json, stack_order, chapter_count,
                   created_at, updated_at
            FROM book_supplement_batches
            WHERE book_id = ?
              AND trim(COALESCE(deleted_at, '')) = ''
            ORDER BY volume_id ASC, stack_order DESC, created_at DESC, batch_id DESC
            """,
            (bid,),
        ).fetchall()
    latest_batch_by_volume: dict[str, dict[str, Any]] = {}
    for batch_row in batch_rows:
        batch_item = dict(batch_row)
        volume_id = str(batch_item.get("volume_id") or "").strip()
        if not volume_id or volume_id in latest_batch_by_volume:
            continue
        payload: dict[str, Any] = {}
        try:
            parsed = json.loads(str(batch_item.get("payload_json") or "{}"))
            if isinstance(parsed, dict):
                payload = parsed
        except Exception:
            payload = {}
        latest_batch_by_volume[volume_id] = {
            "batch_id": str(batch_item.get("batch_id") or "").strip(),
            "stack_order": int(batch_item.get("stack_order") or 0),
            "chapter_count": int(batch_item.get("chapter_count") or 0),
            "note": str(batch_item.get("note") or "").strip(),
            "file_name": str(payload.get("file_name") or "").strip() or "supplement.txt",
            "file_mode": str(batch_item.get("file_mode") or payload.get("file_mode") or "single").strip() or "single",
            "parse_mode": str(payload.get("parse_mode") or "single").strip() or "single",
            "source_file_count": max(0, int(payload.get("source_file_count") or 0)),
            "created_at": str(batch_item.get("created_at") or ""),
            "updated_at": str(batch_item.get("updated_at") or ""),
        }
    items: list[dict[str, Any]] = []
    for row in rows:
        item = dict(row)
        title_raw = normalize_volume_title(item.get("title_raw") or "")
        title_vi = normalize_vi_display_text(item.get("title_vi") or "") or title_raw
        is_default_volume = str(item.get("volume_kind") or "").strip().lower() == "default"
        if mode == "trans":
            display_title = title_vi
            if (
                live_title_mode
                and title_raw
                and (title_raw != DEFAULT_BOOK_VOLUME_TITLE)
                and book_supports_translation(book_row)
            ):
                try:
                    display_title = normalize_vi_display_text(
                        translator.translate_detailed(
                            title_raw,
                            mode=translate_mode,
                            name_set_override=name_set_override,
                            vp_set_override=vp_set_override,
                        ).get("translated", "")
                    ) or title_vi or title_raw
                except Exception:
                    display_title = title_vi or title_raw
        else:
            display_title = title_raw
        policy = build_book_volume_manage_policy(
            book_row,
            is_default_volume=is_default_volume,
            deleted_retention_days=deleted_retention_days,
        )
        latest_batch = dict(latest_batch_by_volume.get(str(item.get("volume_id") or "").strip()) or {})
        if latest_batch:
            latest_batch["can_delete"] = bool(policy.get("can_delete"))
        items.append(
            {
                "volume_id": str(item.get("volume_id") or "").strip(),
                "volume_order": int(item.get("volume_order") or 0),
                "volume_kind": str(item.get("volume_kind") or "").strip().lower() or ("default" if is_default_volume else "supplement"),
                "is_default_volume": bool(is_default_volume),
                "title_raw": title_raw,
                "title_vi": title_vi,
                "title_display": display_title or title_raw,
                "chapter_count": int(item.get("chapter_count") or 0),
                "first_chapter_order": int(item.get("first_chapter_order") or 0),
                "last_chapter_order": int(item.get("last_chapter_order") or 0),
                "created_at": str(item.get("created_at") or ""),
                "updated_at": str(item.get("updated_at") or ""),
                "policy": policy,
                "latest_supplement": latest_batch or None,
            }
        )
    return items


def _normalize_row_ids(values: list[str] | tuple[str, ...] | set[str] | None) -> list[str]:
    output: list[str] = []
    seen: set[str] = set()
    for item in (values or []):
        value = str(item or "").strip()
        if (not value) or (value in seen):
            continue
        seen.add(value)
        output.append(value)
    return output


def sync_book_search_texts(
    storage,
    book_ids: list[str] | tuple[str, ...] | set[str] | None = None,
    *,
    conn: sqlite3.Connection | None = None,
) -> int:
    normalized_ids = _normalize_row_ids(book_ids)
    select_sql = """
        SELECT book_id, title, title_vi, author, author_vi
        FROM books
    """.strip()
    params: list[Any] = []
    if normalized_ids:
        placeholders = ",".join("?" for _ in normalized_ids)
        select_sql += f" WHERE book_id IN ({placeholders})"
        params.extend(normalized_ids)

    def _run(active_conn: sqlite3.Connection) -> int:
        rows = active_conn.execute(select_sql, tuple(params)).fetchall()
        updates = [
            (
                build_book_search_text(
                    title=row["title"],
                    title_vi=row["title_vi"],
                    author=row["author"],
                    author_vi=row["author_vi"],
                ),
                row["book_id"],
            )
            for row in rows
            if str(row["book_id"] or "").strip()
        ]
        if updates:
            active_conn.executemany("UPDATE books SET search_text = ? WHERE book_id = ?", updates)
        return int(len(updates))

    if conn is not None:
        return _run(conn)
    with storage._connect() as active_conn:
        return _run(active_conn)


def sync_chapter_search_texts(
    storage,
    chapter_ids: list[str] | tuple[str, ...] | set[str] | None = None,
    *,
    book_ids: list[str] | tuple[str, ...] | set[str] | None = None,
    conn: sqlite3.Connection | None = None,
) -> int:
    normalized_chapter_ids = _normalize_row_ids(chapter_ids)
    normalized_book_ids = _normalize_row_ids(book_ids)
    select_sql = """
        SELECT chapter_id, title_raw, title_vi
        FROM chapters
    """.strip()
    params: list[Any] = []
    clauses: list[str] = []
    if normalized_chapter_ids:
        placeholders = ",".join("?" for _ in normalized_chapter_ids)
        clauses.append(f"chapter_id IN ({placeholders})")
        params.extend(normalized_chapter_ids)
    if normalized_book_ids:
        placeholders = ",".join("?" for _ in normalized_book_ids)
        clauses.append(f"book_id IN ({placeholders})")
        params.extend(normalized_book_ids)
    if clauses:
        select_sql += f" WHERE {' OR '.join(clauses)}"

    def _run(active_conn: sqlite3.Connection) -> int:
        rows = active_conn.execute(select_sql, tuple(params)).fetchall()
        updates = [
            (
                build_chapter_search_text(
                    title_raw=row["title_raw"],
                    title_vi=row["title_vi"],
                ),
                row["chapter_id"],
            )
            for row in rows
            if str(row["chapter_id"] or "").strip()
        ]
        if updates:
            active_conn.executemany("UPDATE chapters SET search_text = ? WHERE chapter_id = ?", updates)
        return int(len(updates))

    if conn is not None:
        return _run(conn)
    with storage._connect() as active_conn:
        return _run(active_conn)


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


def _normalize_book_query_value(raw: Any) -> str:
    return str(raw or "").strip()


def _normalize_book_query_ids(values: Any) -> list[str]:
    if not isinstance(values, (list, tuple, set)):
        return []
    output: list[str] = []
    seen: set[str] = set()
    for item in values:
        value = str(item or "").strip()
        if (not value) or (value in seen):
            continue
        seen.add(value)
        output.append(value)
    return output


def _normalize_book_category_match_mode(raw: Any) -> str:
    return "and" if str(raw or "").strip().lower() == "and" else "or"


def _build_book_list_query_context(
    *,
    include_session: bool,
    category_ids: list[str] | tuple[str, ...] | set[str] | None = None,
    category_exclude_ids: list[str] | tuple[str, ...] | set[str] | None = None,
    category_match_mode: str = "or",
    author_query: str = "",
) -> tuple[str, list[Any]]:
    clauses: list[str] = []
    params: list[Any] = []

    if not include_session:
        clauses.append("lower(COALESCE(b.source_type, '')) NOT LIKE 'vbook_session%'")

    author_key = _normalize_book_query_value(author_query).lower()
    if author_key:
        like = f"%{author_key}%"
        clauses.append(
            """
            (
                lower(COALESCE(b.author, '')) LIKE ?
                OR lower(COALESCE(b.author_vi, '')) LIKE ?
            )
            """.strip()
        )
        params.extend([like, like])

    include_ids = _normalize_book_query_ids(category_ids)
    exclude_ids = _normalize_book_query_ids(category_exclude_ids)
    match_mode = _normalize_book_category_match_mode(category_match_mode)

    if include_ids:
        if match_mode == "and":
            for category_id in include_ids:
                clauses.append(
                    """
                    EXISTS (
                        SELECT 1
                        FROM book_category_map bcm_include
                        WHERE bcm_include.book_id = b.book_id
                          AND bcm_include.category_id = ?
                    )
                    """.strip()
                )
                params.append(category_id)
        else:
            placeholders = ",".join("?" for _ in include_ids)
            clauses.append(
                f"""
                EXISTS (
                    SELECT 1
                    FROM book_category_map bcm_include
                    WHERE bcm_include.book_id = b.book_id
                      AND bcm_include.category_id IN ({placeholders})
                )
                """.strip()
            )
            params.extend(include_ids)

    if exclude_ids:
        placeholders = ",".join("?" for _ in exclude_ids)
        clauses.append(
            f"""
            NOT EXISTS (
                SELECT 1
                FROM book_category_map bcm_exclude
                WHERE bcm_exclude.book_id = b.book_id
                  AND bcm_exclude.category_id IN ({placeholders})
            )
            """.strip()
        )
        params.extend(exclude_ids)

    where_sql = f"\nWHERE {' AND '.join(clauses)}" if clauses else ""
    return where_sql, params


def _book_list_select_sql(where_sql: str = "") -> str:
    return f"""
        SELECT b.book_id, b.title, b.title_vi, b.author, b.lang_source, b.source_type, b.source_file_path,
               b.source_url, b.source_plugin,
               b.author_vi, b.cover_path, b.extra_link,
               b.created_at, b.updated_at, b.chapter_count,
               b.last_read_chapter_id, b.last_read_ratio, b.last_read_mode, b.theme_pref,
               b.summary
        FROM books b
        {where_sql}
        ORDER BY b.updated_at DESC
    """.strip()


def _book_list_query_matches(row: sqlite3.Row | dict[str, Any], query_text: str) -> bool:
    needle = _normalize_book_query_value(query_text).casefold()
    if not needle:
        return True
    data = dict(row)
    for key in ("title", "title_vi", "author", "author_vi"):
        if needle in str(data.get(key) or "").casefold():
            return True
    return False


def _book_list_fetch_chapter_map_by_ids(conn: sqlite3.Connection, chapter_ids: list[str]) -> dict[str, dict[str, Any]]:
    normalized = [str(item or "").strip() for item in chapter_ids if str(item or "").strip()]
    if not normalized:
        return {}
    placeholders = ",".join("?" for _ in normalized)
    rows = conn.execute(
        f"""
        SELECT chapter_id, book_id, chapter_order, title_raw, title_vi
        FROM chapters
        WHERE chapter_id IN ({placeholders})
        """.strip(),
        tuple(normalized),
    ).fetchall()
    return {
        str(row["chapter_id"] or "").strip(): dict(row)
        for row in rows
        if str(row["chapter_id"] or "").strip()
    }


def _book_list_fetch_first_chapter_map(conn: sqlite3.Connection, book_ids: list[str]) -> dict[str, dict[str, Any]]:
    normalized = [str(item or "").strip() for item in book_ids if str(item or "").strip()]
    if not normalized:
        return {}
    placeholders = ",".join("?" for _ in normalized)
    rows = conn.execute(
        f"""
        SELECT c.book_id, c.chapter_id, c.chapter_order, c.title_raw, c.title_vi
        FROM chapters c
        JOIN (
            SELECT book_id, MIN(chapter_order) AS first_order
            FROM chapters
            WHERE book_id IN ({placeholders})
            GROUP BY book_id
        ) firsts
          ON firsts.book_id = c.book_id
         AND firsts.first_order = c.chapter_order
        """.strip(),
        tuple(normalized),
    ).fetchall()
    output: dict[str, dict[str, Any]] = {}
    for row in rows:
        book_id = str(row["book_id"] or "").strip()
        if book_id and book_id not in output:
            output[book_id] = dict(row)
    return output


def _book_list_fetch_download_count_map(conn: sqlite3.Connection, book_ids: list[str]) -> dict[str, int]:
    normalized = [str(item or "").strip() for item in book_ids if str(item or "").strip()]
    if not normalized:
        return {}
    placeholders = ",".join("?" for _ in normalized)
    rows = conn.execute(
        f"""
        SELECT c.book_id AS book_id, COUNT(1) AS downloaded_chapters
        FROM chapters c
        JOIN content_cache cc ON cc.cache_key = c.raw_key
        WHERE c.book_id IN ({placeholders})
        GROUP BY c.book_id
        """.strip(),
        tuple(normalized),
    ).fetchall()
    return {
        str(row["book_id"] or "").strip(): int(row["downloaded_chapters"] or 0)
        for row in rows
        if str(row["book_id"] or "").strip()
    }


def _decorate_book_list_rows(
    storage,
    rows,
    *,
    normalize_vi_display_text,
    normalize_lang_source,
    book_supports_translation,
    is_book_comic,
    include_download_counts: bool = False,
) -> list[dict[str, Any]]:
    book_ids = [str(dict(row).get("book_id") or "").strip() for row in rows if str(dict(row).get("book_id") or "").strip()]
    category_map = storage.get_book_categories_map(book_ids)
    with storage._connect() as conn:
        last_read_map = _book_list_fetch_chapter_map_by_ids(
            conn,
            [str(dict(row).get("last_read_chapter_id") or "").strip() for row in rows],
        )
        first_chapter_map = _book_list_fetch_first_chapter_map(conn, book_ids)
        downloaded_map = _book_list_fetch_download_count_map(conn, book_ids) if include_download_counts else {}
    output: list[dict[str, Any]] = []
    for row in rows:
        item = dict(row)
        book_id = str(item.get("book_id") or "").strip()
        item["title_vi"] = normalize_vi_display_text(item.get("title_vi") or "")
        item["author_vi"] = normalize_vi_display_text(item.get("author_vi") or "")
        item["title_display"] = item.get("title_vi") or item.get("title")
        item["author_display"] = item.get("author_vi") or item.get("author")
        item["lang_source"] = normalize_lang_source(item.get("lang_source") or "") or str(item.get("lang_source") or "")
        item["translation_supported"] = bool(book_supports_translation(item))
        item["is_comic"] = bool(is_book_comic(item))
        item["cover_url"] = storage._book_cover_url(item)

        last_read_id = str(item.get("last_read_chapter_id") or "").strip()
        last_read_row = last_read_map.get(last_read_id) or {}
        first_row = first_chapter_map.get(book_id) or {}

        if last_read_id and last_read_row:
            cur_id = str(last_read_row.get("chapter_id") or "").strip()
            cur_order = int(last_read_row.get("chapter_order") or 1)
            cur_title_raw = str(last_read_row.get("title_raw") or "").strip()
            cur_title_vi = normalize_vi_display_text(last_read_row.get("title_vi") or "")
        else:
            cur_id = str(first_row.get("chapter_id") or "").strip()
            cur_order = int(first_row.get("chapter_order") or 1)
            cur_title_raw = str(first_row.get("title_raw") or "").strip()
            cur_title_vi = normalize_vi_display_text(first_row.get("title_vi") or "")

        item["current_chapter_id"] = cur_id
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
        downloaded_count = int(downloaded_map.get(book_id) or 0)
        item["downloaded_chapters"] = max(0, min(total, int(downloaded_count or 0)))
        item["categories"] = category_map.get(book_id, [])
        output.append(item)
    return output


def list_books(
    storage,
    *,
    include_session: bool = False,
    normalize_vi_display_text,
    normalize_lang_source,
    book_supports_translation,
    is_book_comic,
) -> list[dict[str, Any]]:
    where_sql, params = _build_book_list_query_context(include_session=include_session)
    with storage._connect() as conn:
        rows = conn.execute(_book_list_select_sql(where_sql), tuple(params)).fetchall()
    return _decorate_book_list_rows(
        storage,
        rows,
        normalize_vi_display_text=normalize_vi_display_text,
        normalize_lang_source=normalize_lang_source,
        book_supports_translation=book_supports_translation,
        is_book_comic=is_book_comic,
        include_download_counts=False,
    )


def list_books_paged(
    storage,
    *,
    include_session: bool = False,
    offset: int = 0,
    limit: int = 48,
    query_text: str = "",
    author_query: str = "",
    category_ids: list[str] | tuple[str, ...] | set[str] | None = None,
    category_exclude_ids: list[str] | tuple[str, ...] | set[str] | None = None,
    category_match_mode: str = "or",
    normalize_vi_display_text,
    normalize_lang_source,
    book_supports_translation,
    is_book_comic,
) -> dict[str, Any]:
    offset = max(0, int(offset or 0))
    limit = max(1, min(120, int(limit or 48)))
    query_key = _normalize_book_query_value(query_text)
    where_sql, params = _build_book_list_query_context(
        include_session=include_session,
        category_ids=category_ids,
        category_exclude_ids=category_exclude_ids,
        category_match_mode=category_match_mode,
        author_query=author_query,
    )

    with storage._connect() as conn:
        if query_key:
            all_rows = conn.execute(_book_list_select_sql(where_sql), tuple(params)).fetchall()
            filtered_rows = [row for row in all_rows if _book_list_query_matches(row, query_key)]
            total_count = len(filtered_rows)
            rows = filtered_rows[offset:offset + limit]
        else:
            count_row = conn.execute(
                f"SELECT COUNT(1) AS c FROM books b{where_sql}",
                tuple(params),
            ).fetchone()
            total_count = int((count_row["c"] if count_row else 0) or 0)
            rows = conn.execute(
                f"{_book_list_select_sql(where_sql)}\nLIMIT ? OFFSET ?",
                tuple(params) + (limit, offset),
            ).fetchall()

    items = _decorate_book_list_rows(
        storage,
        rows,
        normalize_vi_display_text=normalize_vi_display_text,
        normalize_lang_source=normalize_lang_source,
        book_supports_translation=book_supports_translation,
        is_book_comic=is_book_comic,
        include_download_counts=False,
    )
    next_offset = offset + len(items)
    has_more = next_offset < total_count
    return {
        "items": items,
        "offset": int(offset),
        "limit": int(limit),
        "returned_count": int(len(items)),
        "total_count": int(total_count),
        "has_more": bool(has_more),
        "next_offset": int(next_offset) if has_more else None,
        "search_exhaustive": bool(query_key),
    }


def list_books_by_ids(
    storage,
    book_ids: list[str] | tuple[str, ...] | set[str],
    *,
    normalize_vi_display_text,
    normalize_lang_source,
    book_supports_translation,
    is_book_comic,
) -> list[dict[str, Any]]:
    normalized_ids = _normalize_book_query_ids(book_ids)
    if not normalized_ids:
        return []
    placeholders = ",".join("?" for _ in normalized_ids)
    where_sql = f"WHERE b.book_id IN ({placeholders})"
    with storage._connect() as conn:
        rows = conn.execute(_book_list_select_sql(where_sql), tuple(normalized_ids)).fetchall()
    items = _decorate_book_list_rows(
        storage,
        rows,
        normalize_vi_display_text=normalize_vi_display_text,
        normalize_lang_source=normalize_lang_source,
        book_supports_translation=book_supports_translation,
        is_book_comic=is_book_comic,
        include_download_counts=False,
    )
    by_id = {
        str(item.get("book_id") or "").strip(): item
        for item in items
        if str(item.get("book_id") or "").strip()
    }
    return [by_id[book_id] for book_id in normalized_ids if book_id in by_id]


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
    for key in ("title", "title_vi", "author", "author_vi", "summary", "extra_link", "cover_path", "cover_remote_url"):
        if key not in payload:
            continue
        allowed[key] = str(payload.get(key) or "").strip()
    cover_locked = None
    if "cover_locked" in payload:
        cover_locked = 1 if bool(payload.get("cover_locked")) else 0

    set_parts: list[str] = []
    values: list[Any] = []
    for key, value in allowed.items():
        if key == "title" and not value:
            continue
        set_parts.append(f"{key} = ?")
        values.append(value)
    if cover_locked is not None:
        set_parts.append("cover_locked = ?")
        values.append(int(cover_locked))
    if not set_parts:
        return storage.get_book_detail(book_id)
    search_related = bool(set(allowed.keys()) & {"title", "title_vi", "author", "author_vi"})
    set_parts.append("updated_at = ?")
    values.append(now)
    values.append(book_id)
    with storage._connect() as conn:
        conn.execute(f"UPDATE books SET {', '.join(set_parts)} WHERE book_id = ?", tuple(values))
        if search_related:
            storage.sync_book_search_texts([book_id], conn=conn)
    return storage.get_book_detail(book_id)


def list_chapters_paged(
    storage,
    book_id: str,
    *,
    page: int,
    page_size: int,
    volume_id: str | None = None,
    mode: str,
    translator,
    translate_mode: str,
    name_set_override: dict[str, str] | None = None,
    vp_set_override: dict[str, str] | None = None,
    book_supports_translation,
    normalize_vi_display_text,
    deleted_retention_days: int = 30,
) -> dict[str, Any]:
    page = max(1, int(page))
    page_size = max(1, min(600, int(page_size)))
    live_title_mode = translate_mode in {"local", "hanviet", "dichngay_local"}

    book_row = storage.find_book(book_id)
    requested_volume_id = str(volume_id or "").strip()
    volumes = list_book_volumes(
        storage,
        book_id,
        mode=mode,
        translator=translator,
        translate_mode=translate_mode,
        name_set_override=name_set_override,
        vp_set_override=vp_set_override,
        book_supports_translation=book_supports_translation,
        normalize_vi_display_text=normalize_vi_display_text,
        deleted_retention_days=deleted_retention_days,
    )
    active_volume_id = ""
    if volumes:
        active_volume_id = requested_volume_id if any(
            str(item.get("volume_id") or "").strip() == requested_volume_id
            for item in volumes
        ) else str(volumes[0].get("volume_id") or "").strip()
    with storage._connect() as conn:
        where_sql = "WHERE c.book_id = ?"
        params: list[Any] = [book_id]
        where_sql += " AND trim(COALESCE(c.deleted_at, '')) = ''"
        if active_volume_id:
            where_sql += " AND c.volume_id = ?"
            params.append(active_volume_id)
        total = conn.execute(
            f"SELECT COUNT(1) AS c FROM chapters c {where_sql}",
            tuple(params),
        ).fetchone()["c"]
        offset = (page - 1) * page_size
        rows = conn.execute(
            f"""
            SELECT c.chapter_id, c.chapter_order, c.volume_id, c.title_raw, c.title_vi, c.updated_at, c.word_count, c.trans_key, c.raw_key, c.is_vip,
                   CASE WHEN cc.cache_key IS NOT NULL THEN 1 ELSE 0 END AS is_downloaded
            FROM chapters c
            LEFT JOIN content_cache cc ON cc.cache_key = c.raw_key
            {where_sql}
            ORDER BY chapter_order ASC
            LIMIT ? OFFSET ?
            """,
            (*params, page_size, offset),
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
                "volume_id": str(item.get("volume_id") or "").strip(),
                "title_raw": item["title_raw"],
                "title_vi": item.get("title_vi"),
                "title_display": display_title,
                "updated_at": item["updated_at"],
                "word_count": int(item["word_count"] or 0) if valid_cached else 0,
                "has_trans": bool(item.get("trans_key")),
                "is_downloaded": bool(valid_cached),
                "is_vip": bool(item.get("is_vip")),
            }
        )
    total_pages = max(1, (total + page_size - 1) // page_size)
    return {
        "items": items,
        "volumes": volumes,
        "active_volume_id": active_volume_id,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": total_pages,
        },
    }


def get_chapter_rows(storage, book_id: str, *, include_deleted: bool = False) -> list[dict[str, Any]]:
    where_sql = "WHERE book_id = ?"
    if not include_deleted:
        where_sql += " AND trim(COALESCE(deleted_at, '')) = ''"
    with storage._connect() as conn:
        rows = conn.execute(
            f"""
            SELECT chapter_id, book_id, chapter_order, volume_id, title_raw, title_vi,
                   raw_key, trans_key, trans_sig, updated_at, word_count, remote_url, is_vip,
                   origin_type, supplement_batch_id, supplement_stack_order, supplement_note,
                   deleted_at, delete_expire_at
            FROM chapters
            {where_sql}
            ORDER BY chapter_order ASC
            """,
            (book_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def find_chapter(storage, chapter_id: str, *, include_deleted: bool = False) -> dict[str, Any] | None:
    with storage._connect() as conn:
        sql = "SELECT * FROM chapters WHERE chapter_id = ?"
        if not include_deleted:
            sql += " AND trim(COALESCE(deleted_at, '')) = ''"
        row = conn.execute(sql, (chapter_id,)).fetchone()
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
                WHERE c.book_id = ? AND trim(COALESCE(c.deleted_at, '')) = '' AND c.chapter_id IN ({placeholders})
                ORDER BY c.chapter_order ASC
                """,
                (bid, *chapter_filter),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT c.chapter_id, c.raw_key
                FROM chapters c
                WHERE c.book_id = ? AND trim(COALESCE(c.deleted_at, '')) = ''
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
    deleted_retention_days: int = 30,
) -> dict[str, Any] | None:
    book = storage.find_book(book_id)
    if not book:
        return None
    chapters = storage.get_chapter_rows(book_id) if include_chapters else []
    download_map = storage.get_book_download_map(book_id) if include_chapters else {}
    categories = storage.get_book_categories(book_id)
    if include_chapters:
        downloaded_count = sum(1 for value in download_map.values() if value)
        visible_chapter_count = int(len(chapters))
    else:
        downloaded_count, _ = storage.get_book_download_counts(book_id)
        with storage._connect() as conn:
            visible_chapter_count = int(
                conn.execute(
                    """
                    SELECT COUNT(1) AS c
                    FROM chapters
                    WHERE book_id = ?
                      AND trim(COALESCE(deleted_at, '')) = ''
                    """,
                    (book_id,),
                ).fetchone()["c"] or 0
            )
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
            "volume_id": str(ch.get("volume_id") or "").strip(),
            "title_raw": ch["title_raw"],
            "title_vi": normalize_vi_display_text(ch["title_vi"] or ""),
            "title_display": normalize_vi_display_text(ch["title_vi"] or "") or ch["title_raw"],
            "updated_at": ch["updated_at"],
            "word_count": int(ch["word_count"] or 0) if bool(download_map.get(str(ch.get("chapter_id") or "").strip(), False)) else 0,
            "has_trans": bool(ch.get("trans_key")),
            "is_downloaded": bool(download_map.get(str(ch.get("chapter_id") or "").strip(), False)),
            "remote_url": str(ch.get("remote_url") or ""),
            "is_vip": bool(ch.get("is_vip")),
        }
        for ch in chapters
    ] if include_chapters else []
    book["chapter_count"] = int(visible_chapter_count)
    book["downloaded_chapters"] = int(max(0, min(visible_chapter_count, downloaded_count)))
    book["categories"] = categories
    book["supplement_policy"] = build_book_volume_manage_policy(
        book,
        is_default_volume=True,
        deleted_retention_days=deleted_retention_days,
    )
    return book


def search(
    storage,
    query: str,
    *,
    normalize_vi_display_text,
    scope: str = "all",
) -> dict[str, Any]:
    scope_key = str(scope or "all").strip().lower()
    if scope_key not in {"all", "books", "chapters"}:
        scope_key = "all"
    key = normalize_search_text(query)
    if not key:
        books = storage.list_books() if scope_key != "chapters" else []
        chapters: list[dict[str, Any]] = []
        return {"books": books, "chapters": chapters}

    book_rows: list[sqlite3.Row] = []
    chapter_rows: list[sqlite3.Row] = []
    with storage._connect() as conn:
        if scope_key in {"all", "books"}:
            book_rows = conn.execute(
                """
                SELECT book_id, title, title_vi, author, author_vi, lang_source, source_type, chapter_count, updated_at, cover_path
                FROM books
                WHERE lower(COALESCE(source_type, '')) NOT LIKE 'vbook_session%'
                  AND instr(COALESCE(search_text, ''), ?) > 0
                ORDER BY updated_at DESC
                """,
                (key,),
            ).fetchall()
        if scope_key in {"all", "chapters"}:
            chapter_rows = conn.execute(
                """
                SELECT c.chapter_id, c.book_id, c.chapter_order, c.title_raw, c.title_vi, c.updated_at,
                       b.title AS book_title, b.title_vi AS book_title_vi
                FROM chapters c
                JOIN books b ON b.book_id = c.book_id
                WHERE lower(COALESCE(b.source_type, '')) NOT LIKE 'vbook_session%'
                  AND trim(COALESCE(c.deleted_at, '')) = ''
                  AND (
                        instr(COALESCE(c.search_text, ''), ?) > 0
                        OR instr(COALESCE(b.search_text, ''), ?) > 0
                      )
                ORDER BY c.updated_at DESC
                LIMIT 120
                """,
                (key, key),
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
