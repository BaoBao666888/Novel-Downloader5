"""SQLite schema creation and migration helpers for ReaderStorage."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any


def init_db(
    storage: Any,
    *,
    storage_library_support: Any,
    hash_text: Callable[[str], str],
    utc_now_iso: Callable[[], str],
    app_state_search_cache_version_key: str,
    search_cache_version: str,
) -> None:
    with storage._connect() as conn:
        conn.executescript(
            """
            PRAGMA journal_mode=WAL;

            CREATE TABLE IF NOT EXISTS books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                title_vi TEXT,
                author TEXT DEFAULT '',
                author_vi TEXT,
                lang_source TEXT NOT NULL,
                source_type TEXT NOT NULL,
                source_file_path TEXT DEFAULT '',
                cover_path TEXT DEFAULT '',
                cover_remote_url TEXT DEFAULT '',
                cover_locked INTEGER NOT NULL DEFAULT 0,
                extra_link TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                chapter_count INTEGER NOT NULL DEFAULT 0,
                last_read_chapter_id TEXT,
                last_read_ratio REAL,
                last_read_mode TEXT DEFAULT 'raw',
                theme_pref TEXT,
                summary TEXT DEFAULT '',
                search_text TEXT DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS book_volumes (
                volume_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                volume_order INTEGER NOT NULL,
                volume_kind TEXT NOT NULL DEFAULT 'default',
                title_raw TEXT NOT NULL,
                title_vi TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                deleted_at TEXT DEFAULT '',
                delete_expire_at TEXT DEFAULT '',
                FOREIGN KEY(book_id) REFERENCES books(book_id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_book_volumes_book_order
            ON book_volumes(book_id, volume_order, created_at, volume_id);

            CREATE TABLE IF NOT EXISTS chapters (
                chapter_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                chapter_order INTEGER NOT NULL,
                volume_id TEXT DEFAULT '',
                origin_type TEXT DEFAULT 'base',
                supplement_batch_id TEXT DEFAULT '',
                supplement_stack_order INTEGER NOT NULL DEFAULT 0,
                supplement_note TEXT DEFAULT '',
                title_raw TEXT NOT NULL,
                title_vi TEXT,
                raw_key TEXT NOT NULL,
                trans_key TEXT,
                trans_sig TEXT,
                updated_at TEXT NOT NULL,
                word_count INTEGER NOT NULL DEFAULT 0,
                search_text TEXT DEFAULT '',
                deleted_at TEXT DEFAULT '',
                delete_expire_at TEXT DEFAULT '',
                FOREIGN KEY(book_id) REFERENCES books(book_id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_chapters_book_order ON chapters(book_id, chapter_order);

            CREATE TABLE IF NOT EXISTS book_supplement_batches (
                batch_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                volume_id TEXT NOT NULL DEFAULT '',
                source_kind TEXT NOT NULL DEFAULT 'txt',
                file_mode TEXT NOT NULL DEFAULT '',
                note TEXT DEFAULT '',
                payload_json TEXT DEFAULT '',
                stack_order INTEGER NOT NULL DEFAULT 0,
                chapter_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                deleted_at TEXT DEFAULT '',
                delete_expire_at TEXT DEFAULT '',
                FOREIGN KEY(book_id) REFERENCES books(book_id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_book_supplement_batches_book
            ON book_supplement_batches(book_id, created_at DESC, batch_id);

            CREATE INDEX IF NOT EXISTS idx_book_supplement_batches_expire
            ON book_supplement_batches(delete_expire_at);

            CREATE TABLE IF NOT EXISTS content_cache (
                cache_key TEXT PRIMARY KEY,
                lang TEXT NOT NULL,
                text_path TEXT NOT NULL,
                sha256 TEXT NOT NULL,
                bytes INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS translation_memory (
                source_hash TEXT NOT NULL,
                source_text TEXT NOT NULL,
                mode TEXT NOT NULL,
                trans_sig TEXT NOT NULL,
                translated_text TEXT NOT NULL,
                hit_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY(source_hash, mode, trans_sig)
            );

            CREATE INDEX IF NOT EXISTS idx_translation_memory_lookup
            ON translation_memory(mode, trans_sig, source_hash);

            CREATE TABLE IF NOT EXISTS translation_unit_map (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chapter_id TEXT NOT NULL,
                trans_sig TEXT NOT NULL,
                translation_mode TEXT NOT NULL,
                unit_index INTEGER NOT NULL,
                source_text TEXT NOT NULL,
                target_text TEXT NOT NULL,
                source_start INTEGER NOT NULL,
                source_end INTEGER NOT NULL,
                target_start INTEGER NOT NULL,
                target_end INTEGER NOT NULL,
                name_hits_json TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_translation_unit_map_lookup
            ON translation_unit_map(chapter_id, trans_sig, translation_mode, unit_index);

            CREATE INDEX IF NOT EXISTS idx_translation_unit_map_target
            ON translation_unit_map(chapter_id, trans_sig, translation_mode, target_start, target_end);

            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                status TEXT NOT NULL,
                progress REAL NOT NULL DEFAULT 0,
                message TEXT,
                details TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS app_state (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS history_books (
                history_id TEXT PRIMARY KEY,
                plugin_id TEXT NOT NULL DEFAULT '',
                source_url TEXT NOT NULL,
                title TEXT NOT NULL,
                author TEXT DEFAULT '',
                cover_url TEXT DEFAULT '',
                last_read_chapter_url TEXT DEFAULT '',
                last_read_chapter_title TEXT DEFAULT '',
                last_read_ratio REAL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                expire_at TEXT NOT NULL
            );

            CREATE UNIQUE INDEX IF NOT EXISTS idx_history_books_source
            ON history_books(plugin_id, source_url);

            CREATE INDEX IF NOT EXISTS idx_history_books_updated
            ON history_books(updated_at DESC);

            CREATE INDEX IF NOT EXISTS idx_history_books_expire
            ON history_books(expire_at);

            CREATE TABLE IF NOT EXISTS book_change_history (
                event_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                event_scope TEXT DEFAULT '',
                ref_id TEXT DEFAULT '',
                payload_json TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                expire_at TEXT DEFAULT '',
                FOREIGN KEY(book_id) REFERENCES books(book_id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_book_change_history_book
            ON book_change_history(book_id, created_at DESC, event_id);

            CREATE INDEX IF NOT EXISTS idx_book_change_history_expire
            ON book_change_history(expire_at);

            CREATE TABLE IF NOT EXISTS book_name_history (
                event_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                set_name TEXT DEFAULT '',
                action_type TEXT NOT NULL,
                source_text TEXT DEFAULT '',
                target_text TEXT DEFAULT '',
                previous_target_text TEXT DEFAULT '',
                origin TEXT DEFAULT '',
                chapter_id TEXT DEFAULT '',
                payload_json TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                FOREIGN KEY(book_id) REFERENCES books(book_id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_book_name_history_book
            ON book_name_history(book_id, created_at DESC, event_id);

            CREATE TABLE IF NOT EXISTS book_categories (
                category_id TEXT PRIMARY KEY,
                name TEXT NOT NULL COLLATE NOCASE UNIQUE,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS book_category_map (
                book_id TEXT NOT NULL,
                category_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY(book_id, category_id),
                FOREIGN KEY(book_id) REFERENCES books(book_id) ON DELETE CASCADE,
                FOREIGN KEY(category_id) REFERENCES book_categories(category_id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_book_category_map_category
            ON book_category_map(category_id, book_id);
            """
        )
        storage._ensure_column(conn, "books", "title_vi", "TEXT")
        storage._ensure_column(conn, "books", "author_vi", "TEXT")
        storage._ensure_column(conn, "books", "search_text", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "books", "cover_path", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "books", "cover_remote_url", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "books", "cover_locked", "INTEGER NOT NULL DEFAULT 0")
        storage._ensure_column(conn, "books", "extra_link", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "books", "source_url", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "books", "source_plugin", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "book_categories", "is_user_category", "INTEGER NOT NULL DEFAULT 0")
        storage._ensure_column(conn, "book_categories", "is_default_category", "INTEGER NOT NULL DEFAULT 0")
        storage._ensure_column(conn, "book_categories", "is_default_removed", "INTEGER NOT NULL DEFAULT 0")
        storage._ensure_column(conn, "book_categories", "default_group_key", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "book_categories", "default_group_label", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "book_categories", "default_group_order", "INTEGER NOT NULL DEFAULT 999")
        storage._ensure_column(conn, "book_categories", "default_selection_mode", "TEXT DEFAULT 'multi'")
        storage._ensure_column(conn, "book_categories", "default_input_name", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "book_categories", "default_input_type", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "book_categories", "default_subgroup_label", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "book_categories", "default_subgroup_order", "INTEGER NOT NULL DEFAULT 999")
        storage._ensure_column(conn, "book_categories", "default_item_order", "INTEGER NOT NULL DEFAULT 999999")
        storage._ensure_column(conn, "book_categories", "default_source_id", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "book_volumes", "volume_kind", "TEXT NOT NULL DEFAULT 'default'")
        storage._ensure_column(conn, "book_volumes", "deleted_at", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "book_volumes", "delete_expire_at", "TEXT DEFAULT ''")
        conn.execute(
            """
            UPDATE book_categories
            SET is_user_category = 1
            WHERE COALESCE(is_user_category, 0) = 0
              AND COALESCE(is_default_category, 0) = 0
              AND COALESCE(is_default_removed, 0) = 0
            """
        )
        conn.execute(
            """
            UPDATE books
            SET cover_locked = 1
            WHERE cover_locked = 0
              AND lower(COALESCE(source_type, '')) LIKE 'vbook%'
              AND trim(COALESCE(cover_path, '')) <> ''
              AND lower(trim(COALESCE(cover_path, ''))) NOT LIKE 'http://%'
              AND lower(trim(COALESCE(cover_path, ''))) NOT LIKE 'https://%'
              AND lower(trim(COALESCE(cover_path, ''))) NOT LIKE 'data:%'
            """
        )
        storage._ensure_column(conn, "chapters", "trans_sig", "TEXT")
        storage._ensure_column(conn, "chapters", "search_text", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "chapters", "remote_url", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "chapters", "is_vip", "INTEGER NOT NULL DEFAULT 0")
        storage._ensure_column(conn, "chapters", "volume_id", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "chapters", "origin_type", "TEXT DEFAULT 'base'")
        storage._ensure_column(conn, "chapters", "supplement_batch_id", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "chapters", "supplement_stack_order", "INTEGER NOT NULL DEFAULT 0")
        storage._ensure_column(conn, "chapters", "supplement_note", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "chapters", "deleted_at", "TEXT DEFAULT ''")
        storage._ensure_column(conn, "chapters", "delete_expire_at", "TEXT DEFAULT ''")
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_chapters_book_volume_order
            ON chapters(book_id, volume_id, chapter_order)
            """
        )
        conn.execute(
            """
            UPDATE book_volumes
            SET volume_kind = 'default'
            WHERE trim(COALESCE(volume_kind, '')) = ''
            """
        )
        book_rows = conn.execute("SELECT book_id FROM books ORDER BY created_at ASC, book_id ASC").fetchall()
        for row in book_rows:
            book_id = str(row["book_id"] or "").strip()
            if not book_id:
                continue
            default_volume_id = storage_library_support.ensure_default_book_volume(
                storage,
                book_id,
                conn=conn,
                hash_text=hash_text,
                utc_now_iso=utc_now_iso,
            )
            conn.execute(
                """
                UPDATE chapters
                SET volume_id = ?
                WHERE book_id = ?
                  AND trim(COALESCE(volume_id, '')) = ''
                """,
                (default_volume_id, book_id),
            )
        cached_search_version = conn.execute(
            "SELECT value FROM app_state WHERE key = ?",
            (app_state_search_cache_version_key,),
        ).fetchone()
        cached_search_version_value = ""
        if cached_search_version and cached_search_version["value"] is not None:
            cached_search_version_value = str(cached_search_version["value"])
        if cached_search_version_value != search_cache_version:
            storage.sync_book_search_texts(conn=conn)
            storage.sync_chapter_search_texts(conn=conn)
            conn.execute(
                """
                INSERT INTO app_state(key, value, updated_at)
                VALUES(?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    updated_at = excluded.updated_at
                """,
                (app_state_search_cache_version_key, search_cache_version, utc_now_iso()),
            )

