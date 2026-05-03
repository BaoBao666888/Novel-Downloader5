from __future__ import annotations

from datetime import datetime, timedelta, timezone


def cleanup_expired_history(storage, *, utc_now_iso) -> int:
    now = utc_now_iso()
    with storage._connect() as conn:
        rows = conn.execute(
            """
            SELECT history_id, plugin_id, source_url
            FROM history_books
            WHERE expire_at <= ?
               OR trim(COALESCE(last_read_chapter_url, '')) = ''
            """,
            (now,),
        ).fetchall()
    deleted = 0
    for row in rows:
        hid = str(row["history_id"] or "").strip()
        if not hid:
            continue
        if storage.delete_history_book(hid):
            deleted += 1
    try:
        storage.cleanup_orphan_session_books()
    except Exception:
        pass
    return int(deleted)


def list_history_books(storage, *, normalize_vbook_display_text, build_vbook_image_proxy_path) -> list[dict]:
    storage.cleanup_expired_history()
    with storage._connect() as conn:
        rows = conn.execute(
            """
            SELECT history_id, plugin_id, source_url, title, author, cover_url,
                   last_read_chapter_url, last_read_chapter_title, last_read_ratio,
                   created_at, updated_at, expire_at
            FROM history_books
            ORDER BY updated_at DESC
            """
        ).fetchall()
    out: list[dict] = []
    for row in rows:
        item = dict(row)
        item["title"] = normalize_vbook_display_text(item.get("title") or "", single_line=True)
        item["author"] = normalize_vbook_display_text(item.get("author") or "", single_line=True)
        item["last_read_chapter_title"] = normalize_vbook_display_text(
            item.get("last_read_chapter_title") or "",
            single_line=True,
        )
        ratio = item.get("last_read_ratio")
        if isinstance(ratio, (int, float)):
            ratio_value = max(0.0, min(1.0, float(ratio)))
        else:
            ratio_value = 0.0
        item["last_read_ratio"] = ratio_value
        item["progress_percent"] = max(0.0, min(100.0, ratio_value * 100.0))
        item["cover_url"] = build_vbook_image_proxy_path(
            str(item.get("cover_url") or "").strip(),
            plugin_id=str(item.get("plugin_id") or "").strip(),
            referer=str(item.get("source_url") or "").strip(),
            cache=True,
        )
        out.append(item)
    return out


def get_history_book(storage, history_id: str) -> dict | None:
    hid = str(history_id or "").strip()
    if not hid:
        return None
    storage.cleanup_expired_history()
    with storage._connect() as conn:
        row = conn.execute("SELECT * FROM history_books WHERE history_id = ?", (hid,)).fetchone()
    return dict(row) if row else None


def upsert_history_book(
    storage,
    *,
    plugin_id: str,
    source_url: str,
    title: str,
    author: str = "",
    cover_url: str = "",
    last_read_chapter_url: str = "",
    last_read_chapter_title: str = "",
    last_read_ratio: float | None = None,
    normalize_vbook_display_text,
    build_vbook_image_proxy_path,
    hash_text,
    history_retention_days: int,
) -> dict:
    plugin = str(plugin_id or "").strip()
    source = str(source_url or "").strip()
    chapter_url = str(last_read_chapter_url or "").strip()
    chapter_title = str(last_read_chapter_title or "").strip()
    if not source:
        raise ValueError("Thiếu source_url cho lịch sử xem.")
    if not chapter_url:
        raise ValueError("Lịch sử xem chỉ lưu khi đã mở chương.")
    now_dt = datetime.now(timezone.utc)
    now = now_dt.isoformat()
    expire_at = (now_dt + timedelta(days=history_retention_days)).isoformat()
    ratio_val = None
    if isinstance(last_read_ratio, (int, float)):
        ratio_val = max(0.0, min(1.0, float(last_read_ratio)))
    history_id = f"hist_{hash_text(f'{plugin}|{source}')}"
    with storage._connect() as conn:
        row = conn.execute(
            """
            SELECT created_at FROM history_books
            WHERE plugin_id = ? AND source_url = ?
            LIMIT 1
            """,
            (plugin, source),
        ).fetchone()
        created_at = str(row["created_at"]) if row and row["created_at"] else now
        conn.execute(
            """
            INSERT INTO history_books(
                history_id, plugin_id, source_url, title, author, cover_url,
                last_read_chapter_url, last_read_chapter_title, last_read_ratio,
                created_at, updated_at, expire_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(plugin_id, source_url) DO UPDATE SET
                history_id = excluded.history_id,
                title = excluded.title,
                author = excluded.author,
                cover_url = excluded.cover_url,
                last_read_chapter_url = excluded.last_read_chapter_url,
                last_read_chapter_title = excluded.last_read_chapter_title,
                last_read_ratio = excluded.last_read_ratio,
                updated_at = excluded.updated_at,
                expire_at = excluded.expire_at
            """,
            (
                history_id,
                plugin,
                source,
                normalize_vbook_display_text(str(title or ""), single_line=True) or source,
                normalize_vbook_display_text(str(author or ""), single_line=True),
                str(cover_url or "").strip(),
                chapter_url,
                normalize_vbook_display_text(chapter_title, single_line=True),
                ratio_val,
                created_at,
                now,
                expire_at,
            ),
        )
    item = storage.get_history_book(history_id) or {}
    if item:
        ratio2 = item.get("last_read_ratio")
        if isinstance(ratio2, (int, float)):
            ratio2 = max(0.0, min(1.0, float(ratio2)))
        else:
            ratio2 = 0.0
        item["last_read_ratio"] = ratio2
        item["progress_percent"] = max(0.0, min(100.0, ratio2 * 100.0))
        item["cover_url"] = build_vbook_image_proxy_path(
            str(item.get("cover_url") or "").strip(),
            plugin_id=str(item.get("plugin_id") or "").strip(),
            referer=str(item.get("source_url") or "").strip(),
            cache=True,
        )
    return item


def delete_history_book(storage, history_id: str) -> bool:
    hid = str(history_id or "").strip()
    if not hid:
        return False
    with storage._connect() as conn:
        row = conn.execute(
            "SELECT history_id, plugin_id, source_url FROM history_books WHERE history_id = ?",
            (hid,),
        ).fetchone()
    if not row:
        return False
    source_url = str(row["source_url"] or "").strip()
    source_plugin = str(row["plugin_id"] or "").strip()
    if source_url:
        try:
            storage._delete_session_books_for_source(
                source_url=source_url,
                source_plugin=source_plugin,
            )
        except Exception:
            pass
    with storage._connect() as conn:
        conn.execute("DELETE FROM history_books WHERE history_id = ?", (hid,))
    return True


def remove_history_by_source(storage, *, plugin_id: str, source_url: str) -> int:
    plugin = str(plugin_id or "").strip()
    source = str(source_url or "").strip()
    if not source:
        return 0
    count = 0
    with storage._connect() as conn:
        if plugin:
            row = conn.execute(
                "SELECT COUNT(1) AS c FROM history_books WHERE plugin_id = ? AND source_url = ?",
                (plugin, source),
            ).fetchone()
            plugin_count = int((row or {"c": 0})["c"] or 0)
            if plugin_count:
                conn.execute("DELETE FROM history_books WHERE plugin_id = ? AND source_url = ?", (plugin, source))
                count += plugin_count
        row = conn.execute(
            "SELECT COUNT(1) AS c FROM history_books WHERE source_url = ?",
            (source,),
        ).fetchone()
        source_count = int((row or {"c": 0})["c"] or 0)
        if source_count:
            conn.execute("DELETE FROM history_books WHERE source_url = ?", (source,))
            count += source_count
    return count
