from __future__ import annotations

import json
import shutil
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from .storage_library import build_book_volume_manage_policy


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


def _parse_payload_json(raw_value: Any) -> dict[str, Any]:
    try:
        payload = json.loads(str(raw_value or "{}"))
    except Exception:
        return {}
    return dict(payload) if isinstance(payload, dict) else {}


def _normalize_batch_source_manifest(payload: dict[str, Any]) -> list[dict[str, Any]]:
    raw_items = payload.get("source_files")
    if not isinstance(raw_items, list):
        return []
    items: list[dict[str, Any]] = []
    for index, raw_item in enumerate(raw_items, start=1):
        if not isinstance(raw_item, dict):
            continue
        stored_name = str(raw_item.get("stored_name") or "").strip()
        file_name = str(raw_item.get("file_name") or "").strip()
        if not stored_name:
            continue
        items.append(
            {
                "stored_name": stored_name,
                "file_name": file_name or stored_name,
                "order_index": max(1, int(raw_item.get("order_index") or index)),
                "size": max(0, int(raw_item.get("size") or 0)),
            }
        )
    items.sort(key=lambda item: (int(item.get("order_index") or 0), str(item.get("file_name") or "")))
    return items


def _build_batch_state_map(
    storage,
    *,
    book_id: str,
    conn: sqlite3.Connection,
    supplement_source_dir: Path | None,
    deleted_retention_days: int,
) -> dict[str, dict[str, Any]]:
    bid = str(book_id or "").strip()
    if not bid:
        return {}
    book = storage.find_book(bid)
    if not book:
        return {}

    volume_rows = conn.execute(
        """
        SELECT volume_id, volume_kind, title_raw
        FROM book_volumes
        WHERE book_id = ?
        """,
        (bid,),
    ).fetchall()
    volume_map = {
        str(row["volume_id"] or "").strip(): {
            "volume_kind": str(row["volume_kind"] or "").strip().lower(),
            "title_raw": str(row["title_raw"] or "").strip(),
        }
        for row in volume_rows
        if str(row["volume_id"] or "").strip()
    }

    batch_rows = conn.execute(
        """
        SELECT batch_id, volume_id, file_mode, note, payload_json, stack_order, chapter_count,
               created_at, updated_at, deleted_at, delete_expire_at
        FROM book_supplement_batches
        WHERE book_id = ?
        ORDER BY volume_id ASC, stack_order ASC, created_at ASC, batch_id ASC
        """,
        (bid,),
    ).fetchall()
    by_volume: dict[str, dict[str, int]] = {}
    for row in batch_rows:
        volume_id = str(row["volume_id"] or "").strip()
        if not volume_id:
            continue
        state = by_volume.setdefault(volume_id, {"active_max": 0, "deleted_max": 0})
        stack_order = max(0, int(row["stack_order"] or 0))
        if str(row["deleted_at"] or "").strip():
            state["deleted_max"] = max(state["deleted_max"], stack_order)
        else:
            state["active_max"] = max(state["active_max"], stack_order)

    out: dict[str, dict[str, Any]] = {}
    for row in batch_rows:
        batch_id = str(row["batch_id"] or "").strip()
        volume_id = str(row["volume_id"] or "").strip()
        if not batch_id or not volume_id:
            continue
        volume_info = volume_map.get(volume_id) or {}
        volume_kind = str(volume_info.get("volume_kind") or "").strip().lower()
        policy = build_book_volume_manage_policy(
            book,
            is_default_volume=volume_kind == "default",
            deleted_retention_days=deleted_retention_days,
        )
        payload = _parse_payload_json(row["payload_json"])
        manifest = _normalize_batch_source_manifest(payload)
        source_download_available = False
        if manifest and supplement_source_dir:
            batch_dir = supplement_source_dir / batch_id
            source_download_available = any((batch_dir / str(item.get("stored_name") or "")).is_file() for item in manifest)
        stack_order = max(0, int(row["stack_order"] or 0))
        volume_state = by_volume.get(volume_id) or {"active_max": 0, "deleted_max": 0}
        is_deleted = bool(str(row["deleted_at"] or "").strip())
        can_delete = (not is_deleted) and policy.get("can_delete") and stack_order == int(volume_state.get("active_max") or 0)
        can_restore = is_deleted and stack_order == int(volume_state.get("deleted_max") or 0) and stack_order > int(volume_state.get("active_max") or 0)
        out[batch_id] = {
            "batch_id": batch_id,
            "volume_id": volume_id,
            "volume_title": str(payload.get("volume_title") or volume_info.get("title_raw") or "").strip(),
            "stack_order": stack_order,
            "chapter_count": max(0, int(row["chapter_count"] or 0)),
            "file_name": str(payload.get("file_name") or "").strip() or "supplement.txt",
            "file_mode": str(row["file_mode"] or payload.get("file_mode") or "single").strip() or "single",
            "parse_mode": str(payload.get("parse_mode") or "single").strip() or "single",
            "source_file_count": len(manifest),
            "is_deleted": is_deleted,
            "delete_expire_at": str(row["delete_expire_at"] or "").strip(),
            "can_delete": bool(can_delete),
            "can_restore": bool(can_restore),
            "source_download_available": bool(source_download_available),
        }
    return out


def list_book_change_events(
    storage,
    book_id: str,
    *,
    limit: int = 200,
    supplement_source_dir: Path | None = None,
    deleted_retention_days: int = 30,
) -> list[dict[str, Any]]:
    bid = str(book_id or "").strip()
    if not bid:
        return []
    max_items = max(1, min(500, int(limit or 200)))
    now = datetime.now(timezone.utc).isoformat()
    with storage._connect() as conn:
        batch_state_map = _build_batch_state_map(
            storage,
            book_id=bid,
            conn=conn,
            supplement_source_dir=supplement_source_dir,
            deleted_retention_days=deleted_retention_days,
        )
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
        batch_id = str(payload.get("batch_id") or "").strip()
        if batch_id and batch_id in batch_state_map:
            item["batch_state"] = dict(batch_state_map[batch_id])
        items.append(item)
    return items


def cleanup_expired_book_recycle_bin(storage, *, utc_now_iso, supplement_source_dir: Path | None = None) -> dict[str, int]:
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
    removed_source_batches = 0
    if supplement_source_dir and removed_batch_ids:
        for batch_id in removed_batch_ids:
            try:
                target = supplement_source_dir / batch_id
                if target.exists():
                    for child in target.iterdir():
                        if child.is_file() or child.is_symlink():
                            child.unlink(missing_ok=True)
                        else:
                            shutil.rmtree(child, ignore_errors=True)
                    target.rmdir()
                    removed_source_batches += 1
            except Exception:
                continue
    return {
        "deleted_chapters": int(len(removed_chapter_ids)),
        "deleted_batches": int(len(removed_batch_ids)),
        "deleted_volumes": int(len(removed_volume_ids)),
        "deleted_history_events": int(len(removed_history_ids)),
        "deleted_source_batches": int(removed_source_batches),
        "cache_deleted": int(cache_stats.get("cache_deleted") or 0),
        "deleted_files": int(cache_stats.get("deleted_files") or 0),
        "bytes_deleted": int(cache_stats.get("bytes_deleted") or 0),
        "cleaned_at": utc_now_iso(),
    }
