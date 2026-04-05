from __future__ import annotations

from pathlib import Path
from typing import Any


def delete_book(
    storage,
    book_id: str,
    *,
    cleanup_history: bool = True,
    cleanup_related_source: bool = True,
    is_book_comic,
    name_set_state_key,
    book_vp_set_key,
    app_state_name_set_key: str,
    app_state_book_vp_set_key_prefix: str,
    cache_dir: Path,
    cover_dir: Path,
    runtime_base_dir,
    resolve_persisted_path,
    root_dir: Path,
    local_dir: Path,
) -> bool:
    book = storage.find_book(book_id)
    chapters = storage.get_chapter_rows(book_id)
    if not chapters and not book:
        return False

    source_url = str((book or {}).get("source_url") or "").strip()
    source_plugin = str((book or {}).get("source_plugin") or "").strip()
    source_type = str((book or {}).get("source_type") or "").strip().lower()

    content_keys = {ch["raw_key"] for ch in chapters if ch.get("raw_key")}
    content_keys.update(ch["trans_key"] for ch in chapters if ch.get("trans_key"))
    image_cache_keys: set[str] = set()
    if is_book_comic(book):
        image_cache_keys = storage._collect_vbook_image_cache_keys_for_chapters(
            book=book,
            chapter_rows=chapters,
        )

    with storage._connect() as conn:
        if chapters:
            conn.executemany(
                "DELETE FROM translation_unit_map WHERE chapter_id = ?",
                [(ch["chapter_id"],) for ch in chapters if ch.get("chapter_id")],
            )
        conn.execute("DELETE FROM chapters WHERE book_id = ?", (book_id,))
        conn.execute("DELETE FROM books WHERE book_id = ?", (book_id,))

    storage._delete_cache_keys(content_keys)
    if image_cache_keys:
        storage._delete_vbook_image_cache_keys(image_cache_keys)

    storage._delete_app_state_value(
        name_set_state_key(book_id, base_key=app_state_name_set_key)
    )
    try:
        storage._delete_app_state_value(
            book_vp_set_key(book_id, base_prefix=app_state_book_vp_set_key_prefix)
        )
    except ValueError:
        pass

    epub_file = cache_dir / "epub_sources" / f"{book_id}.epub"
    if epub_file.exists():
        try:
            epub_file.unlink()
        except Exception:
            pass

    cover_path = (book or {}).get("cover_path") or ""
    if cover_path and not str(cover_path).startswith(("http://", "https://", "data:")):
        resolved_cover = resolve_persisted_path(
            cover_path,
            runtime_base_dir(),
            root_dir,
            local_dir,
            cover_dir,
        )
        if resolved_cover.exists():
            try:
                resolved_cover.unlink()
            except Exception:
                pass

    if cleanup_history and source_url:
        try:
            storage.remove_history_by_source(plugin_id=source_plugin, source_url=source_url)
        except Exception:
            pass

    if cleanup_related_source and source_url and not source_type.startswith("vbook_session"):
        try:
            storage._delete_session_books_for_source(
                source_url=source_url,
                source_plugin=source_plugin,
                exclude_book_ids={str(book_id or "").strip()},
            )
        except Exception:
            pass
    return True


def delete_session_books_for_source(
    storage,
    *,
    source_url: str,
    source_plugin: str = "",
    exclude_book_ids: set[str] | None = None,
) -> dict[str, int]:
    source = str(source_url or "").strip()
    plugin = str(source_plugin or "").strip()
    excluded = {str(x or "").strip() for x in (exclude_book_ids or set()) if str(x or "").strip()}
    if not source:
        return {"books_deleted": 0}

    rows = storage.find_books_by_source(
        source,
        plugin,
        include_session=True,
        session_only=True,
    )
    deleted = 0
    for row in rows:
        bid = str(row.get("book_id") or "").strip()
        if (not bid) or (bid in excluded):
            continue
        if storage.delete_book(bid, cleanup_history=False, cleanup_related_source=False):
            deleted += 1
    return {"books_deleted": int(deleted)}


def cleanup_orphan_session_books(storage) -> dict[str, int]:
    with storage._connect() as conn:
        rows = conn.execute(
            """
            SELECT b.book_id
            FROM books b
            WHERE lower(COALESCE(b.source_type, '')) LIKE 'vbook_session%'
              AND trim(COALESCE(b.source_url, '')) <> ''
              AND NOT EXISTS (
                    SELECT 1
                    FROM history_books h
                    WHERE h.source_url = b.source_url
                      AND (
                            trim(COALESCE(b.source_plugin, '')) = ''
                            OR h.plugin_id = b.source_plugin
                      )
                )
            """
        ).fetchall()

    deleted = 0
    for row in rows:
        bid = str(row["book_id"] or "").strip()
        if not bid:
            continue
        if storage.delete_book(bid, cleanup_history=False, cleanup_related_source=False):
            deleted += 1
    return {
        "orphan_session_books": int(len(rows)),
        "orphan_session_books_deleted": int(deleted),
    }
