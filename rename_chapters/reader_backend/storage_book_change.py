from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Any


def append_book_change_event(
    storage,
    *,
    book_id: str,
    event_type: str,
    event_scope: str = "",
    ref_id: str = "",
    payload: dict[str, Any] | None = None,
    expire_days: int = 0,
    conn: sqlite3.Connection | None = None,
    hash_text,
    utc_now_iso,
) -> str:
    bid = str(book_id or "").strip()
    event_type_key = str(event_type or "").strip()
    if not bid or not event_type_key:
        return ""
    body = dict(payload or {})
    payload_json = json.dumps(body, ensure_ascii=False, separators=(",", ":"))
    now = utc_now_iso()
    expire_at = ""
    keep_days = max(0, int(expire_days or 0))
    if keep_days > 0:
        expire_at = (datetime.now(timezone.utc) + timedelta(days=keep_days)).isoformat()
    event_id = f"bhe_{hash_text(f'{bid}|{event_type_key}|{event_scope}|{ref_id}|{now}|{payload_json}')}"

    def _run(active_conn: sqlite3.Connection) -> str:
        active_conn.execute(
            """
            INSERT INTO book_change_history(
                event_id, book_id, event_type, event_scope, ref_id, payload_json, created_at, expire_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event_id,
                bid,
                event_type_key,
                str(event_scope or "").strip(),
                str(ref_id or "").strip(),
                payload_json,
                now,
                expire_at,
            ),
        )
        return event_id

    if conn is not None:
        return _run(conn)
    with storage._connect() as active_conn:
        return _run(active_conn)


def list_book_change_events(storage, book_id: str, *, limit: int = 200) -> list[dict[str, Any]]:
    bid = str(book_id or "").strip()
    if not bid:
        return []
    max_items = max(1, min(500, int(limit or 200)))
    now = datetime.now(timezone.utc).isoformat()
    with storage._connect() as conn:
        rows = conn.execute(
            """
            SELECT event_id, book_id, event_type, event_scope, ref_id, payload_json, created_at, expire_at
            FROM book_change_history
            WHERE book_id = ?
              AND (trim(COALESCE(expire_at, '')) = '' OR expire_at > ?)
            ORDER BY created_at DESC, event_id DESC
            LIMIT ?
            """,
            (bid, now, max_items),
        ).fetchall()
    items: list[dict[str, Any]] = []
    for row in rows:
        item = dict(row)
        payload = {}
        try:
            parsed = json.loads(str(item.get("payload_json") or "{}"))
            if isinstance(parsed, dict):
                payload = parsed
        except Exception:
            payload = {}
        item["payload"] = payload
        items.append(item)
    return items


def cleanup_expired_book_recycle_bin(storage, *, utc_now_iso) -> dict[str, int]:
    now = datetime.now(timezone.utc).isoformat()
    removed_chapter_ids: list[str] = []
    removed_cache_keys: set[str] = set()
    removed_batch_ids: list[str] = []
    removed_volume_ids: list[str] = []
    removed_history_ids: list[str] = []

    with storage._connect() as conn:
        chapter_rows = conn.execute(
            """
            SELECT chapter_id, raw_key, trans_key
            FROM chapters
            WHERE trim(COALESCE(deleted_at, '')) <> ''
              AND trim(COALESCE(delete_expire_at, '')) <> ''
              AND delete_expire_at <= ?
            """,
            (now,),
        ).fetchall()
        removed_chapter_ids = [str(row["chapter_id"] or "").strip() for row in chapter_rows if str(row["chapter_id"] or "").strip()]
        removed_cache_keys = {
            str(key).strip()
            for row in chapter_rows
            for key in (row["raw_key"], row["trans_key"])
            if str(key or "").strip()
        }
        if removed_chapter_ids:
            placeholders = ",".join("?" for _ in removed_chapter_ids)
            conn.execute(
                f"DELETE FROM translation_unit_map WHERE chapter_id IN ({placeholders})",
                tuple(removed_chapter_ids),
            )
            conn.execute(
                f"DELETE FROM chapters WHERE chapter_id IN ({placeholders})",
                tuple(removed_chapter_ids),
            )

        batch_rows = conn.execute(
            """
            SELECT batch_id
            FROM book_supplement_batches
            WHERE trim(COALESCE(deleted_at, '')) <> ''
              AND trim(COALESCE(delete_expire_at, '')) <> ''
              AND delete_expire_at <= ?
            """,
            (now,),
        ).fetchall()
        removed_batch_ids = [str(row["batch_id"] or "").strip() for row in batch_rows if str(row["batch_id"] or "").strip()]
        if removed_batch_ids:
            placeholders = ",".join("?" for _ in removed_batch_ids)
            conn.execute(
                f"DELETE FROM book_supplement_batches WHERE batch_id IN ({placeholders})",
                tuple(removed_batch_ids),
            )

        volume_rows = conn.execute(
            """
            SELECT volume_id
            FROM book_volumes v
            WHERE trim(COALESCE(v.deleted_at, '')) <> ''
              AND trim(COALESCE(v.delete_expire_at, '')) <> ''
              AND v.delete_expire_at <= ?
              AND NOT EXISTS (
                  SELECT 1
                  FROM chapters c
                  WHERE c.volume_id = v.volume_id
              )
            """,
            (now,),
        ).fetchall()
        removed_volume_ids = [str(row["volume_id"] or "").strip() for row in volume_rows if str(row["volume_id"] or "").strip()]
        if removed_volume_ids:
            placeholders = ",".join("?" for _ in removed_volume_ids)
            conn.execute(
                f"DELETE FROM book_volumes WHERE volume_id IN ({placeholders})",
                tuple(removed_volume_ids),
            )

        history_rows = conn.execute(
            """
            SELECT event_id
            FROM book_change_history
            WHERE trim(COALESCE(expire_at, '')) <> ''
              AND expire_at <= ?
            """,
            (now,),
        ).fetchall()
        removed_history_ids = [str(row["event_id"] or "").strip() for row in history_rows if str(row["event_id"] or "").strip()]
        if removed_history_ids:
            placeholders = ",".join("?" for _ in removed_history_ids)
            conn.execute(
                f"DELETE FROM book_change_history WHERE event_id IN ({placeholders})",
                tuple(removed_history_ids),
            )

    cache_stats = storage._delete_cache_keys_with_stats(removed_cache_keys) if removed_cache_keys else {
        "cache_deleted": 0,
        "deleted_files": 0,
        "bytes_deleted": 0,
    }
    return {
        "deleted_chapters": int(len(removed_chapter_ids)),
        "deleted_batches": int(len(removed_batch_ids)),
        "deleted_volumes": int(len(removed_volume_ids)),
        "deleted_history_events": int(len(removed_history_ids)),
        "cache_deleted": int(cache_stats.get("cache_deleted") or 0),
        "deleted_files": int(cache_stats.get("deleted_files") or 0),
        "bytes_deleted": int(cache_stats.get("bytes_deleted") or 0),
        "cleaned_at": utc_now_iso(),
    }
