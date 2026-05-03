from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any

from reader_backend.catalogs import default_categories_wikicv as default_wikicv_support


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _normalize_category_name(raw: str) -> str:
    return default_wikicv_support.normalize_category_name(raw)


def _normalize_category_name_key(raw: str) -> str:
    return default_wikicv_support.normalize_category_name_key(raw)


def _category_row_to_dict(row: sqlite3.Row | dict[str, Any]) -> dict[str, Any]:
    data = dict(row)
    return {
        "category_id": str(data.get("category_id") or "").strip(),
        "name": str(data.get("name") or "").strip(),
        "created_at": str(data.get("created_at") or "").strip(),
        "updated_at": str(data.get("updated_at") or "").strip(),
        "book_count": int(data.get("book_count") or 0),
        "is_user_category": bool(data.get("is_user_category", 0)),
        "is_default_category": bool(data.get("is_default_category", 0)),
        "is_default_removed": bool(data.get("is_default_removed", 0)),
        "default_group_key": str(data.get("default_group_key") or "").strip(),
        "default_group_label": str(data.get("default_group_label") or "").strip(),
        "default_group_order": int(data.get("default_group_order") or 999),
        "default_selection_mode": str(data.get("default_selection_mode") or "").strip() or "multi",
        "default_input_name": str(data.get("default_input_name") or "").strip(),
        "default_input_type": str(data.get("default_input_type") or "").strip(),
        "default_subgroup_label": str(data.get("default_subgroup_label") or "").strip(),
        "default_subgroup_order": int(data.get("default_subgroup_order") or 999),
        "default_item_order": int(data.get("default_item_order") or 999999),
        "default_source_id": str(data.get("default_source_id") or "").strip(),
    }


def _ensure_default_categories_synced(storage) -> None:
    manifest_path = default_wikicv_support.get_default_category_manifest_path()
    try:
        stat = manifest_path.stat()
        next_sig = (int(stat.st_mtime_ns), int(stat.st_size))
    except FileNotFoundError:
        next_sig = None
    current_sig = getattr(storage, "_default_category_manifest_sig", None)
    if current_sig == next_sig:
        return
    setattr(storage, "_default_category_manifest_sig", next_sig)
    manifest = default_wikicv_support.load_category_manifest(manifest_path)
    if not manifest:
        return
    _apply_default_category_manifest(storage, manifest)


def _apply_default_category_manifest(storage, manifest: dict[str, Any]) -> None:
    items = [dict(item) for item in (manifest.get("items") or []) if isinstance(item, dict)]
    manifest_by_name_key = {
        _normalize_category_name_key(item.get("name_key") or item.get("name") or ""): item
        for item in items
        if _normalize_category_name_key(item.get("name_key") or item.get("name") or "")
    }
    now = _utc_now_iso()
    with storage._connect() as conn:
        rows = conn.execute(
            """
            SELECT category_id, name, created_at, updated_at,
                   is_user_category, is_default_category, is_default_removed,
                   default_group_key, default_group_label, default_group_order,
                   default_selection_mode, default_input_name, default_input_type,
                   default_subgroup_label, default_subgroup_order, default_item_order, default_source_id
            FROM book_categories
            """
        ).fetchall()
        existing_by_name_key = {
            _normalize_category_name_key(row["name"] or ""): dict(row)
            for row in rows
            if _normalize_category_name_key(row["name"] or "")
        }
        for name_key, item in manifest_by_name_key.items():
            name = _normalize_category_name(item.get("name") or "")
            if not name:
                continue
            is_active = str(item.get("state") or "active").strip() == "active"
            values = {
                "name": name,
                "updated_at": now,
                "is_default_category": 1 if is_active else 0,
                "is_default_removed": 0 if is_active else 1,
                "default_group_key": str(item.get("group_key") or "").strip(),
                "default_group_label": str(item.get("group_label") or "").strip(),
                "default_group_order": int(item.get("group_order") or 999),
                "default_selection_mode": str(item.get("selection_mode") or "multi").strip() or "multi",
                "default_input_name": str(item.get("input_name") or "").strip(),
                "default_input_type": str(item.get("input_type") or "").strip(),
                "default_subgroup_label": str(item.get("subgroup_label") or "").strip(),
                "default_subgroup_order": int(item.get("subgroup_order") or 999),
                "default_item_order": int(item.get("item_order") or 999999),
                "default_source_id": str(item.get("source_id") or "").strip(),
            }
            existing = existing_by_name_key.get(name_key)
            if existing:
                conn.execute(
                    """
                    UPDATE book_categories
                    SET name = ?, updated_at = ?,
                        is_default_category = ?, is_default_removed = ?,
                        default_group_key = ?, default_group_label = ?, default_group_order = ?,
                        default_selection_mode = ?, default_input_name = ?, default_input_type = ?,
                        default_subgroup_label = ?, default_subgroup_order = ?, default_item_order = ?, default_source_id = ?
                    WHERE category_id = ?
                    """,
                    (
                        values["name"],
                        values["updated_at"],
                        values["is_default_category"],
                        values["is_default_removed"],
                        values["default_group_key"],
                        values["default_group_label"],
                        values["default_group_order"],
                        values["default_selection_mode"],
                        values["default_input_name"],
                        values["default_input_type"],
                        values["default_subgroup_label"],
                        values["default_subgroup_order"],
                        values["default_item_order"],
                        values["default_source_id"],
                        str(existing.get("category_id") or "").strip(),
                    ),
                )
            else:
                category_id = f"cat_{str(item.get('stable_key') or default_wikicv_support.stable_category_key_from_name(name)).strip()}"
                conn.execute(
                    """
                    INSERT INTO book_categories(
                        category_id, name, created_at, updated_at,
                        is_user_category, is_default_category, is_default_removed,
                        default_group_key, default_group_label, default_group_order,
                        default_selection_mode, default_input_name, default_input_type,
                        default_subgroup_label, default_subgroup_order, default_item_order, default_source_id
                    )
                    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        category_id,
                        values["name"],
                        now,
                        now,
                        0,
                        values["is_default_category"],
                        values["is_default_removed"],
                        values["default_group_key"],
                        values["default_group_label"],
                        values["default_group_order"],
                        values["default_selection_mode"],
                        values["default_input_name"],
                        values["default_input_type"],
                        values["default_subgroup_label"],
                        values["default_subgroup_order"],
                        values["default_item_order"],
                        values["default_source_id"],
                    ),
                )
        for row in rows:
            name_key = _normalize_category_name_key(row["name"] or "")
            if not name_key:
                continue
            if name_key in manifest_by_name_key:
                continue
            if not bool(row["is_default_category"] or row["is_default_removed"]):
                continue
            conn.execute(
                """
                UPDATE book_categories
                SET updated_at = ?, is_default_category = 0, is_default_removed = 1
                WHERE category_id = ?
                """,
                (now, str(row["category_id"] or "").strip()),
            )


def _existing_categories_by_name_key(conn) -> dict[str, dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT category_id, name, created_at, updated_at,
               is_user_category, is_default_category, is_default_removed,
               default_group_key, default_group_label, default_group_order,
               default_selection_mode, default_input_name, default_input_type,
               default_subgroup_label, default_subgroup_order, default_item_order, default_source_id
        FROM book_categories
        """
    ).fetchall()
    output: dict[str, dict[str, Any]] = {}
    for row in rows:
        name_key = _normalize_category_name_key(row["name"] or "")
        if not name_key:
            continue
        output[name_key] = dict(row)
    return output


def _normalize_selection_mode(raw: Any) -> str:
    return "single" if str(raw or "").strip().lower() == "single" else "multi"


def _single_selection_group_key(row: sqlite3.Row | dict[str, Any] | None) -> str:
    data = dict(row or {})
    if not bool(data.get("is_default_category")):
        return ""
    group_key = str(data.get("default_group_key") or "").strip().lower()
    if not group_key:
        return ""
    if _normalize_selection_mode(data.get("default_selection_mode")) != "single":
        return ""
    return group_key


def _fetch_category_rows_by_ids(conn, category_ids: list[str]) -> dict[str, dict[str, Any]]:
    normalized = [str(item or "").strip() for item in category_ids if str(item or "").strip()]
    if not normalized:
        return {}
    placeholders = ",".join("?" for _ in normalized)
    rows = conn.execute(
        f"""
        SELECT category_id, name, created_at, updated_at,
               is_user_category, is_default_category, is_default_removed,
               default_group_key, default_group_label, default_group_order,
               default_selection_mode, default_input_name, default_input_type,
               default_subgroup_label, default_subgroup_order, default_item_order, default_source_id
        FROM book_categories
        WHERE category_id IN ({placeholders})
        """,
        tuple(normalized),
    ).fetchall()
    return {
        str(row["category_id"] or "").strip(): dict(row)
        for row in rows
        if str(row["category_id"] or "").strip()
    }


def _normalize_requested_category_ids(conn, category_ids: list[str] | tuple[str, ...] | set[str]) -> tuple[list[str], dict[str, dict[str, Any]]]:
    requested = [str(item or "").strip() for item in category_ids if str(item or "").strip()]
    unique_ids = list(dict.fromkeys(requested))
    rows_by_id = _fetch_category_rows_by_ids(conn, unique_ids)
    last_single_choice_by_group: dict[str, str] = {}
    for category_id in unique_ids:
        row = rows_by_id.get(category_id)
        if not row:
            continue
        group_key = _single_selection_group_key(row)
        if group_key:
            last_single_choice_by_group[group_key] = category_id
    output: list[str] = []
    for category_id in unique_ids:
        row = rows_by_id.get(category_id)
        if not row:
            continue
        group_key = _single_selection_group_key(row)
        if group_key and last_single_choice_by_group.get(group_key) != category_id:
            continue
        output.append(category_id)
    return output, rows_by_id


def get_book_categories_map(storage, book_ids: list[str] | tuple[str, ...] | set[str]) -> dict[str, list[dict[str, Any]]]:
    _ensure_default_categories_synced(storage)
    normalized = [str(item or "").strip() for item in book_ids if str(item or "").strip()]
    if not normalized:
        return {}
    placeholders = ",".join("?" for _ in normalized)
    with storage._connect() as conn:
        rows = conn.execute(
            f"""
            SELECT bcm.book_id, bc.category_id, bc.name, bc.created_at, bc.updated_at,
                   bc.is_user_category, bc.is_default_category, bc.is_default_removed,
                   bc.default_group_key, bc.default_group_label, bc.default_group_order,
                   bc.default_selection_mode, bc.default_input_name, bc.default_input_type,
                   bc.default_subgroup_label, bc.default_subgroup_order, bc.default_item_order, bc.default_source_id
            FROM book_category_map bcm
            JOIN book_categories bc ON bc.category_id = bcm.category_id
            WHERE bcm.book_id IN ({placeholders})
            ORDER BY bc.default_group_order ASC, bc.default_subgroup_order ASC, bc.default_item_order ASC, lower(bc.name) ASC, bc.created_at ASC, bc.category_id ASC
            """,
            tuple(normalized),
        ).fetchall()
    output: dict[str, list[dict[str, Any]]] = {book_id: [] for book_id in normalized}
    for row in rows:
        book_id = str(row["book_id"] or "").strip()
        if not book_id:
            continue
        output.setdefault(book_id, []).append(_category_row_to_dict(row))
    return output


def get_book_categories(storage, book_id: str) -> list[dict[str, Any]]:
    bid = str(book_id or "").strip()
    if not bid:
        return []
    return get_book_categories_map(storage, [bid]).get(bid, [])


def list_categories(storage) -> list[dict[str, Any]]:
    _ensure_default_categories_synced(storage)
    with storage._connect() as conn:
        rows = conn.execute(
            """
            SELECT bc.category_id, bc.name, bc.created_at, bc.updated_at,
                   bc.is_user_category, bc.is_default_category, bc.is_default_removed,
                   bc.default_group_key, bc.default_group_label, bc.default_group_order,
                   bc.default_selection_mode, bc.default_input_name, bc.default_input_type,
                   bc.default_subgroup_label, bc.default_subgroup_order, bc.default_item_order, bc.default_source_id,
                   COUNT(bcm.book_id) AS book_count
            FROM book_categories bc
            LEFT JOIN book_category_map bcm ON bcm.category_id = bc.category_id
            GROUP BY bc.category_id
            ORDER BY bc.default_group_order ASC, bc.default_subgroup_order ASC, bc.default_item_order ASC, lower(bc.name) ASC, bc.created_at ASC, bc.category_id ASC
            """
        ).fetchall()
    return [_category_row_to_dict(row) for row in rows]


def create_category(storage, name: str, *, utc_now_iso) -> dict[str, Any]:
    _ensure_default_categories_synced(storage)
    normalized = _normalize_category_name(name)
    if not normalized:
        raise ValueError("Tên danh mục không được để trống.")
    now = utc_now_iso()
    with storage._connect() as conn:
        existing = _existing_categories_by_name_key(conn).get(_normalize_category_name_key(normalized))
        if existing:
            if bool(existing.get("is_user_category")):
                raise ValueError("Danh mục này đã tồn tại.")
            conn.execute(
                "UPDATE book_categories SET is_user_category = 1, updated_at = ? WHERE category_id = ?",
                (now, str(existing.get("category_id") or "").strip()),
            )
        else:
            category_id = f"cat_{uuid.uuid4().hex}"
            conn.execute(
                """
                INSERT INTO book_categories(
                    category_id, name, created_at, updated_at,
                    is_user_category, is_default_category, is_default_removed,
                    default_group_key, default_group_label, default_group_order,
                    default_selection_mode, default_input_name, default_input_type,
                    default_subgroup_label, default_subgroup_order, default_item_order, default_source_id
                )
                VALUES(?, ?, ?, ?, ?, ?, ?, '', '', 999, 'multi', '', '', '', 999, 999999, '')
                """,
                (category_id, normalized, now, now, 1, 0, 0),
            )
    for item in list_categories(storage):
        if _normalize_category_name_key(item.get("name") or "") == _normalize_category_name_key(normalized):
            return item
    raise LookupError("Không tìm thấy danh mục.")


def rename_category(storage, category_id: str, name: str, *, utc_now_iso) -> dict[str, Any]:
    _ensure_default_categories_synced(storage)
    cid = str(category_id or "").strip()
    normalized = _normalize_category_name(name)
    if not cid:
        raise ValueError("Thiếu category_id.")
    if not normalized:
        raise ValueError("Tên danh mục không được để trống.")
    now = utc_now_iso()
    with storage._connect() as conn:
        row = conn.execute(
            """
            SELECT category_id, is_default_category, is_default_removed
            FROM book_categories
            WHERE category_id = ?
            """,
            (cid,),
        ).fetchone()
        if not row:
            raise LookupError("Không tìm thấy danh mục.")
        if bool(row["is_default_category"] or row["is_default_removed"]):
            raise ValueError("Không thể đổi tên danh mục mặc định.")
        try:
            conn.execute(
                "UPDATE book_categories SET name = ?, updated_at = ? WHERE category_id = ?",
                (normalized, now, cid),
            )
        except sqlite3.IntegrityError as exc:
            raise ValueError("Danh mục này đã tồn tại.") from exc
    for item in list_categories(storage):
        if str(item.get("category_id") or "").strip() == cid:
            return item
    raise LookupError("Không tìm thấy danh mục.")


def delete_category(storage, category_id: str) -> bool:
    _ensure_default_categories_synced(storage)
    cid = str(category_id or "").strip()
    if not cid:
        return False
    now = _utc_now_iso()
    with storage._connect() as conn:
        row = conn.execute(
            """
            SELECT category_id, is_user_category, is_default_category, is_default_removed
            FROM book_categories
            WHERE category_id = ?
            """,
            (cid,),
        ).fetchone()
        if not row:
            return False
        if bool(row["is_default_category"] or row["is_default_removed"]):
            if not bool(row["is_user_category"]):
                return False
            conn.execute(
                "UPDATE book_categories SET is_user_category = 0, updated_at = ? WHERE category_id = ?",
                (now, cid),
            )
            return True
        conn.execute("DELETE FROM book_categories WHERE category_id = ?", (cid,))
    return True


def set_book_categories(storage, book_id: str, category_ids: list[str] | tuple[str, ...] | set[str], *, utc_now_iso) -> list[dict[str, Any]]:
    _ensure_default_categories_synced(storage)
    bid = str(book_id or "").strip()
    if not bid:
        raise ValueError("Thiếu book_id.")
    now = utc_now_iso()
    requested = [str(item or "").strip() for item in category_ids if str(item or "").strip()]
    with storage._connect() as conn:
        book = conn.execute("SELECT book_id FROM books WHERE book_id = ?", (bid,)).fetchone()
        if not book:
            raise LookupError("Không tìm thấy truyện.")
        unique_ids, rows_by_id = _normalize_requested_category_ids(conn, requested)
        missing = [cid for cid in list(dict.fromkeys(requested)) if cid not in rows_by_id]
        if missing:
            raise LookupError("Có danh mục không tồn tại.")
        existing_rows = conn.execute(
            "SELECT category_id FROM book_category_map WHERE book_id = ?",
            (bid,),
        ).fetchall()
        existing_ids = {str(row["category_id"] or "").strip() for row in existing_rows if str(row["category_id"] or "").strip()}
        next_ids = set(unique_ids)
        for cid in sorted(existing_ids - next_ids):
            conn.execute(
                "DELETE FROM book_category_map WHERE book_id = ? AND category_id = ?",
                (bid, cid),
            )
        for cid in unique_ids:
            if cid in existing_ids:
                continue
            conn.execute(
                """
                INSERT INTO book_category_map(book_id, category_id, created_at, updated_at)
                VALUES(?, ?, ?, ?)
                """,
                (bid, cid, now, now),
            )
    return storage.get_book_categories(bid)


def update_books_categories(
    storage,
    *,
    book_ids: list[str] | tuple[str, ...] | set[str],
    category_ids: list[str] | tuple[str, ...] | set[str],
    action: str,
    utc_now_iso,
) -> dict[str, int]:
    _ensure_default_categories_synced(storage)
    normalized_book_ids = list(dict.fromkeys(str(item or "").strip() for item in book_ids if str(item or "").strip()))
    if not normalized_book_ids:
        raise ValueError("Chưa chọn truyện.")
    raw_category_ids = list(dict.fromkeys(str(item or "").strip() for item in category_ids if str(item or "").strip()))
    if not raw_category_ids:
        raise ValueError("Chưa chọn danh mục.")
    action_key = str(action or "").strip().lower()
    if action_key not in {"add", "remove"}:
        raise ValueError("Hành động danh mục không hợp lệ.")
    now = utc_now_iso()
    placeholders_books = ",".join("?" for _ in normalized_book_ids)
    with storage._connect() as conn:
        found_books = conn.execute(
            f"SELECT book_id FROM books WHERE book_id IN ({placeholders_books})",
            tuple(normalized_book_ids),
        ).fetchall()
        found_book_ids = {str(row["book_id"] or "").strip() for row in found_books}
        if not found_book_ids:
            raise LookupError("Không tìm thấy truyện.")
        normalized_category_ids, rows_by_id = _normalize_requested_category_ids(conn, raw_category_ids)
        found_category_ids = set(rows_by_id)
        if not found_category_ids:
            raise LookupError("Không tìm thấy danh mục.")
        missing_category_ids = [cid for cid in raw_category_ids if cid not in found_category_ids]
        if missing_category_ids:
            raise LookupError("Có danh mục không tồn tại.")
        changed = 0
        if action_key == "add":
            requested_single_by_group = {
                group_key: category_id
                for category_id in normalized_category_ids
                for group_key in [_single_selection_group_key(rows_by_id.get(category_id))]
                if group_key
            }
            if requested_single_by_group:
                existing_rows = conn.execute(
                    f"""
                    SELECT bcm.book_id, bcm.category_id,
                           bc.is_default_category, bc.default_selection_mode, bc.default_group_key
                    FROM book_category_map bcm
                    JOIN book_categories bc ON bc.category_id = bcm.category_id
                    WHERE bcm.book_id IN ({placeholders_books})
                    """,
                    tuple(normalized_book_ids),
                ).fetchall()
                for row in existing_rows:
                    book_id = str(row["book_id"] or "").strip()
                    category_id = str(row["category_id"] or "").strip()
                    if book_id not in found_book_ids or not category_id:
                        continue
                    group_key = _single_selection_group_key(row)
                    if not group_key:
                        continue
                    target_category_id = requested_single_by_group.get(group_key)
                    if not target_category_id or target_category_id == category_id:
                        continue
                    result = conn.execute(
                        "DELETE FROM book_category_map WHERE book_id = ? AND category_id = ?",
                        (book_id, category_id),
                    )
                    changed += max(0, int(result.rowcount or 0))
            for bid in normalized_book_ids:
                if bid not in found_book_ids:
                    continue
                for cid in normalized_category_ids:
                    if cid not in found_category_ids:
                        continue
                    conn.execute(
                        """
                        INSERT INTO book_category_map(book_id, category_id, created_at, updated_at)
                        VALUES(?, ?, ?, ?)
                        ON CONFLICT(book_id, category_id) DO UPDATE SET updated_at = excluded.updated_at
                        """,
                        (bid, cid, now, now),
                    )
                    changed += 1
        else:
            for bid in normalized_book_ids:
                if bid not in found_book_ids:
                    continue
                for cid in normalized_category_ids:
                    if cid not in found_category_ids:
                        continue
                    result = conn.execute(
                        "DELETE FROM book_category_map WHERE book_id = ? AND category_id = ?",
                        (bid, cid),
                    )
                    changed += max(0, int(result.rowcount or 0))
    return {
        "book_count": len(normalized_book_ids),
        "category_count": len(normalized_category_ids),
        "changed_links": int(changed),
    }
