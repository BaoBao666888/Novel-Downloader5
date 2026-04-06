from __future__ import annotations

import sqlite3
import uuid
from typing import Any


def _normalize_category_name(raw: str) -> str:
    value = " ".join(str(raw or "").strip().split())
    return value


def get_book_categories_map(storage, book_ids: list[str] | tuple[str, ...] | set[str]) -> dict[str, list[dict[str, Any]]]:
    normalized = [str(item or "").strip() for item in book_ids if str(item or "").strip()]
    if not normalized:
        return {}
    placeholders = ",".join("?" for _ in normalized)
    with storage._connect() as conn:
        rows = conn.execute(
            f"""
            SELECT bcm.book_id, bc.category_id, bc.name
            FROM book_category_map bcm
            JOIN book_categories bc ON bc.category_id = bcm.category_id
            WHERE bcm.book_id IN ({placeholders})
            ORDER BY lower(bc.name) ASC, bc.created_at ASC, bc.category_id ASC
            """,
            tuple(normalized),
        ).fetchall()
    output: dict[str, list[dict[str, Any]]] = {book_id: [] for book_id in normalized}
    for row in rows:
        book_id = str(row["book_id"] or "").strip()
        if not book_id:
            continue
        output.setdefault(book_id, []).append(
            {
                "category_id": str(row["category_id"] or "").strip(),
                "name": str(row["name"] or "").strip(),
            }
        )
    return output


def get_book_categories(storage, book_id: str) -> list[dict[str, Any]]:
    bid = str(book_id or "").strip()
    if not bid:
        return []
    return get_book_categories_map(storage, [bid]).get(bid, [])


def list_categories(storage) -> list[dict[str, Any]]:
    with storage._connect() as conn:
        rows = conn.execute(
            """
            SELECT bc.category_id, bc.name, bc.created_at, bc.updated_at,
                   COUNT(bcm.book_id) AS book_count
            FROM book_categories bc
            LEFT JOIN book_category_map bcm ON bcm.category_id = bc.category_id
            GROUP BY bc.category_id
            ORDER BY lower(bc.name) ASC, bc.created_at ASC, bc.category_id ASC
            """
        ).fetchall()
    return [
        {
            "category_id": str(row["category_id"] or "").strip(),
            "name": str(row["name"] or "").strip(),
            "created_at": str(row["created_at"] or "").strip(),
            "updated_at": str(row["updated_at"] or "").strip(),
            "book_count": int(row["book_count"] or 0),
        }
        for row in rows
    ]


def _existing_category_names(conn) -> dict[str, str]:
    rows = conn.execute("SELECT category_id, name FROM book_categories").fetchall()
    output: dict[str, str] = {}
    for row in rows:
        output[str(row["category_id"] or "").strip()] = str(row["name"] or "").strip()
    return output


def create_category(storage, name: str, *, utc_now_iso) -> dict[str, Any]:
    normalized = _normalize_category_name(name)
    if not normalized:
        raise ValueError("Tên danh mục không được để trống.")
    now = utc_now_iso()
    category_id = f"cat_{uuid.uuid4().hex}"
    try:
        with storage._connect() as conn:
            conn.execute(
                """
                INSERT INTO book_categories(category_id, name, created_at, updated_at)
                VALUES(?, ?, ?, ?)
                """,
                (category_id, normalized, now, now),
            )
    except sqlite3.IntegrityError as exc:
        raise ValueError("Danh mục này đã tồn tại.") from exc
    for item in storage.list_categories():
        if str(item.get("category_id") or "").strip() == category_id:
            return item
    return {
        "category_id": category_id,
        "name": normalized,
        "created_at": now,
        "updated_at": now,
        "book_count": 0,
    }


def rename_category(storage, category_id: str, name: str, *, utc_now_iso) -> dict[str, Any]:
    cid = str(category_id or "").strip()
    normalized = _normalize_category_name(name)
    if not cid:
        raise ValueError("Thiếu category_id.")
    if not normalized:
        raise ValueError("Tên danh mục không được để trống.")
    now = utc_now_iso()
    try:
        with storage._connect() as conn:
            row = conn.execute(
                "SELECT category_id FROM book_categories WHERE category_id = ?",
                (cid,),
            ).fetchone()
            if not row:
                raise LookupError("Không tìm thấy danh mục.")
            conn.execute(
                "UPDATE book_categories SET name = ?, updated_at = ? WHERE category_id = ?",
                (normalized, now, cid),
            )
    except sqlite3.IntegrityError as exc:
        raise ValueError("Danh mục này đã tồn tại.") from exc
    for item in storage.list_categories():
        if str(item.get("category_id") or "").strip() == cid:
            return item
    raise LookupError("Không tìm thấy danh mục.")


def delete_category(storage, category_id: str) -> bool:
    cid = str(category_id or "").strip()
    if not cid:
        return False
    with storage._connect() as conn:
        row = conn.execute(
            "SELECT category_id FROM book_categories WHERE category_id = ?",
            (cid,),
        ).fetchone()
        if not row:
            return False
        conn.execute("DELETE FROM book_categories WHERE category_id = ?", (cid,))
    return True


def set_book_categories(storage, book_id: str, category_ids: list[str] | tuple[str, ...] | set[str], *, utc_now_iso) -> list[dict[str, Any]]:
    bid = str(book_id or "").strip()
    if not bid:
        raise ValueError("Thiếu book_id.")
    now = utc_now_iso()
    requested = [str(item or "").strip() for item in category_ids if str(item or "").strip()]
    unique_ids = list(dict.fromkeys(requested))
    with storage._connect() as conn:
        book = conn.execute("SELECT book_id FROM books WHERE book_id = ?", (bid,)).fetchone()
        if not book:
            raise LookupError("Không tìm thấy truyện.")
        known_categories = _existing_category_names(conn)
        missing = [cid for cid in unique_ids if cid not in known_categories]
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
    normalized_book_ids = list(dict.fromkeys(str(item or "").strip() for item in book_ids if str(item or "").strip()))
    normalized_category_ids = list(dict.fromkeys(str(item or "").strip() for item in category_ids if str(item or "").strip()))
    if not normalized_book_ids:
        raise ValueError("Chưa chọn truyện.")
    if not normalized_category_ids:
        raise ValueError("Chưa chọn danh mục.")
    action_key = str(action or "").strip().lower()
    if action_key not in {"add", "remove"}:
        raise ValueError("Hành động danh mục không hợp lệ.")
    now = utc_now_iso()
    placeholders_books = ",".join("?" for _ in normalized_book_ids)
    placeholders_categories = ",".join("?" for _ in normalized_category_ids)
    with storage._connect() as conn:
        found_books = conn.execute(
            f"SELECT book_id FROM books WHERE book_id IN ({placeholders_books})",
            tuple(normalized_book_ids),
        ).fetchall()
        found_book_ids = {str(row["book_id"] or "").strip() for row in found_books}
        if not found_book_ids:
            raise LookupError("Không tìm thấy truyện.")
        found_categories = conn.execute(
            f"SELECT category_id FROM book_categories WHERE category_id IN ({placeholders_categories})",
            tuple(normalized_category_ids),
        ).fetchall()
        found_category_ids = {str(row["category_id"] or "").strip() for row in found_categories}
        if not found_category_ids:
            raise LookupError("Không tìm thấy danh mục.")
        changed = 0
        if action_key == "add":
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
