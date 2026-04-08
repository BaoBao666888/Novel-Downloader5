from __future__ import annotations

import mimetypes
from pathlib import Path
from typing import Any


def create_book(
    storage,
    *,
    title: str,
    author: str,
    lang_source: str,
    source_type: str,
    summary: str,
    chapters: list[dict[str, Any]],
    source_file_path: str = "",
    utc_now_iso,
    hash_text,
) -> dict[str, Any]:
    created_at = utc_now_iso()
    book_seed = f"{title}|{author}|{created_at}|{source_type}"
    book_id = f"bk_{hash_text(book_seed)}"

    chapter_rows: list[tuple[Any, ...]] = []
    for idx, ch in enumerate(chapters, start=1):
        chapter_title = (ch.get("title") or f"Chương {idx}").strip() or f"Chương {idx}"
        chapter_text = (ch.get("text") or "").strip()
        chapter_id = f"ch_{hash_text(f'{book_id}|{idx}|{chapter_title}')}"
        raw_key = f"raw_{hash_text(f'{chapter_id}|{chapter_text}')}"
        storage.write_cache(raw_key, lang_source, chapter_text)
        chapter_rows.append(
            (
                chapter_id,
                book_id,
                idx,
                chapter_title,
                None,
                raw_key,
                None,
                None,
                created_at,
                len(chapter_text),
            )
        )

    with storage._connect() as conn:
        conn.execute(
            """
            INSERT INTO books(
                book_id, title, title_vi, author, author_vi, lang_source, source_type, source_file_path,
                cover_path, extra_link, created_at, updated_at, chapter_count, summary
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                book_id,
                title.strip() or "Untitled",
                title.strip() if lang_source == "vi" else None,
                author.strip(),
                author.strip() if lang_source == "vi" else None,
                lang_source,
                source_type,
                source_file_path,
                "",
                "",
                created_at,
                created_at,
                len(chapter_rows),
                summary,
            ),
        )
        conn.executemany(
            """
            INSERT INTO chapters(
                chapter_id, book_id, chapter_order, title_raw, title_vi,
                raw_key, trans_key, trans_sig, updated_at, word_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            chapter_rows,
        )

    return storage.get_book_detail(book_id)


def create_book_remote(
    storage,
    *,
    title: str,
    author: str,
    lang_source: str,
    source_type: str,
    summary: str,
    chapters: list[dict[str, str]],
    source_url: str,
    source_plugin: str,
    cover_path: str = "",
    extra_link: str = "",
    utc_now_iso,
    hash_text,
) -> dict[str, Any]:
    created_at = utc_now_iso()
    book_seed = f"{title}|{author}|{created_at}|{source_type}|{source_url}|{source_plugin}"
    book_id = f"bk_{hash_text(book_seed)}"

    chapter_rows: list[tuple[Any, ...]] = []
    for idx, ch in enumerate(chapters or [], start=1):
        chapter_title = (ch.get("title") or f"Chương {idx}").strip() or f"Chương {idx}"
        remote_url = (ch.get("remote_url") or "").strip()
        chapter_id = f"ch_{hash_text(f'{book_id}|{idx}|{chapter_title}|{remote_url}')}"
        raw_key = f"raw_{hash_text(f'{chapter_id}|{remote_url}')}"
        chapter_rows.append(
            (
                chapter_id,
                book_id,
                idx,
                chapter_title,
                None,
                raw_key,
                None,
                None,
                created_at,
                0,
                remote_url,
                1 if bool(ch.get("is_vip") or ch.get("vip") or ch.get("pay")) else 0,
            )
        )

    with storage._connect() as conn:
        conn.execute(
            """
            INSERT INTO books(
                book_id, title, title_vi, author, author_vi, lang_source, source_type, source_file_path,
                source_url, source_plugin,
                cover_path, cover_remote_url, cover_locked, extra_link, created_at, updated_at, chapter_count, summary
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                book_id,
                title.strip() or "Untitled",
                title.strip() if lang_source == "vi" else None,
                author.strip(),
                author.strip() if lang_source == "vi" else None,
                lang_source,
                source_type,
                "",
                source_url,
                source_plugin,
                cover_path or "",
                cover_path if str(cover_path or "").startswith(("http://", "https://")) else "",
                0,
                extra_link or "",
                created_at,
                created_at,
                len(chapter_rows),
                summary,
            ),
        )
        conn.executemany(
            """
            INSERT INTO chapters(
                chapter_id, book_id, chapter_order, title_raw, title_vi,
                raw_key, trans_key, trans_sig, updated_at, word_count, remote_url, is_vip
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            chapter_rows,
        )

    return storage.get_book_detail(book_id) or {"book_id": book_id}


def _guess_cover_suffix(*, filename: str = "", content_type: str = "") -> str:
    suffix = Path(filename or "").suffix.lower()
    mime = str(content_type or "").split(";", 1)[0].strip().lower()
    if mime:
        guessed = mimetypes.guess_extension(mime, strict=False) or ""
        if guessed:
            suffix = guessed.lower()
    if suffix in {".jpe", ".jpeg"}:
        suffix = ".jpg"
    if suffix not in {".jpg", ".png", ".webp", ".gif"}:
        suffix = ".jpg"
    return suffix


def _delete_existing_book_cover_variants(book_id: str, *, cover_dir: Path, keep_path: Path | None = None) -> None:
    bid = str(book_id or "").strip()
    if not bid:
        return
    keep = ""
    if keep_path is not None:
        try:
            keep = str(keep_path.resolve())
        except Exception:
            keep = str(keep_path)
    for suffix in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        path = cover_dir / f"{bid}{suffix}"
        try:
            current = str(path.resolve())
        except Exception:
            current = str(path)
        if keep and current == keep:
            continue
        try:
            path.unlink(missing_ok=True)
        except Exception:
            pass


def set_book_cover_url(
    storage,
    book_id: str,
    cover_url: str,
    *,
    cover_dir: Path,
    cover_locked: bool = True,
    cover_remote_url: str = "",
) -> dict[str, Any] | None:
    book = storage.find_book(book_id)
    if not book:
        return None
    _delete_existing_book_cover_variants(book_id, cover_dir=cover_dir, keep_path=None)
    return storage.update_book_metadata(
        book_id,
        {
            "cover_path": str(cover_url or "").strip(),
            "cover_remote_url": str(cover_remote_url or "").strip(),
            "cover_locked": 1 if cover_locked else 0,
        },
    )


def set_book_cover_remote_cached(
    storage,
    book_id: str,
    image_url: str,
    content: bytes,
    *,
    content_type: str = "",
    cover_dir: Path,
) -> dict[str, Any] | None:
    book = storage.find_book(book_id)
    if not book:
        return None
    suffix = _guess_cover_suffix(filename=image_url, content_type=content_type)
    path = cover_dir / f"{book_id}{suffix}"
    cover_dir.mkdir(parents=True, exist_ok=True)
    _delete_existing_book_cover_variants(book_id, cover_dir=cover_dir, keep_path=path)
    path.write_bytes(content)
    return storage.update_book_metadata(
        book_id,
        {
            "cover_path": str(path),
            "cover_remote_url": str(image_url or "").strip(),
            "cover_locked": 0,
        },
    )


def update_chapter_word_count(storage, chapter_id: str, word_count: int, *, utc_now_iso) -> None:
    with storage._connect() as conn:
        conn.execute(
            "UPDATE chapters SET word_count = ?, updated_at = ? WHERE chapter_id = ?",
            (max(0, int(word_count)), utc_now_iso(), chapter_id),
        )


def collect_vbook_image_cache_keys_for_chapters(
    storage,
    *,
    book: dict[str, Any] | None,
    chapter_rows: list[dict[str, Any]] | None,
    is_book_comic,
    extract_comic_image_urls,
    vbook_image_cache_key,
) -> set[str]:
    if not book or not is_book_comic(book):
        return set()
    plugin_id = str(book.get("source_plugin") or "").strip()
    keys: set[str] = set()
    for chapter in chapter_rows or []:
        if not isinstance(chapter, dict):
            continue
        raw_key = str(chapter.get("raw_key") or "").strip()
        if not raw_key:
            continue
        raw_text = storage.read_cache(raw_key) or ""
        if not raw_text:
            continue
        for image_url in extract_comic_image_urls(raw_text):
            url = str(image_url or "").strip()
            if url:
                keys.add(vbook_image_cache_key(image_url=url, plugin_id=plugin_id))
    return keys


def delete_vbook_image_cache_keys(keys: set[str], *, image_cache_dir: Path) -> dict[str, int]:
    deleted = 0
    bytes_deleted = 0
    for key in keys or set():
        cache_body = image_cache_dir / f"{key}.bin"
        cache_meta = image_cache_dir / f"{key}.json"
        if cache_body.exists():
            try:
                bytes_deleted += int(cache_body.stat().st_size)
            except Exception:
                pass
            try:
                cache_body.unlink()
                deleted += 1
            except Exception:
                pass
        if cache_meta.exists():
            try:
                cache_meta.unlink()
            except Exception:
                pass
    return {
        "image_cache_deleted": int(deleted),
        "image_bytes_deleted": int(bytes_deleted),
    }


def collect_all_comic_vbook_image_cache_keys(
    storage,
    *,
    extract_comic_image_urls,
    vbook_image_cache_key,
) -> set[str]:
    keys: set[str] = set()
    with storage._connect() as conn:
        rows = conn.execute(
            """
            SELECT b.source_plugin, c.raw_key
            FROM books b
            JOIN chapters c ON c.book_id = b.book_id
            WHERE lower(COALESCE(b.source_type, '')) IN ('comic', 'vbook_comic', 'vbook_session_comic')
            """
        ).fetchall()
    for row in rows:
        plugin_id = str(row["source_plugin"] or "").strip()
        raw_key = str(row["raw_key"] or "").strip()
        if not raw_key:
            continue
        raw_text = storage.read_cache(raw_key) or ""
        if not raw_text:
            continue
        for image_url in extract_comic_image_urls(raw_text):
            url = str(image_url or "").strip()
            if url:
                keys.add(vbook_image_cache_key(image_url=url, plugin_id=plugin_id))
    return keys


def cleanup_non_comic_vbook_image_cache(
    storage,
    *,
    image_cache_dir: Path,
    extract_comic_image_urls,
    vbook_image_cache_key,
) -> dict[str, int]:
    keep_keys = collect_all_comic_vbook_image_cache_keys(
        storage,
        extract_comic_image_urls=extract_comic_image_urls,
        vbook_image_cache_key=vbook_image_cache_key,
    )
    removed_keys: set[str] = set()
    scanned = 0
    if image_cache_dir.exists():
        for meta_path in image_cache_dir.glob("*.json"):
            scanned += 1
            stem = meta_path.stem
            if stem and stem not in keep_keys:
                removed_keys.add(stem)
    stats = delete_vbook_image_cache_keys(removed_keys, image_cache_dir=image_cache_dir) if removed_keys else {
        "image_cache_deleted": 0,
        "image_bytes_deleted": 0,
    }
    return {
        "scanned_meta": int(scanned),
        "kept_keys": int(len(keep_keys)),
        "removed_keys": int(len(removed_keys)),
        **stats,
    }


def _normalize_remote_toc_rows(toc_rows: list[dict[str, Any]] | None, *, normalize_vbook_display_text) -> list[dict[str, Any]]:
    normalized_rows: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for idx, raw in enumerate(toc_rows or [], start=1):
        if not isinstance(raw, dict):
            continue
        remote_url = str(raw.get("remote_url") or "").strip()
        if not remote_url or remote_url in seen_urls:
            continue
        seen_urls.add(remote_url)
        title_raw = normalize_vbook_display_text(
            str(raw.get("title") or raw.get("name") or ""),
            single_line=True,
        ) or f"Chương {idx}"
        normalized_rows.append(
            {
                "chapter_order": idx,
                "title_raw": title_raw,
                "remote_url": remote_url,
                "is_vip": bool(raw.get("is_vip") or raw.get("vip") or raw.get("pay")),
            }
        )
    return normalized_rows


def sync_remote_book_toc(
    storage,
    book_id: str,
    toc_rows: list[dict[str, Any]],
    *,
    normalize_vbook_display_text,
    utc_now_iso,
    hash_text,
    image_cache_dir: Path,
    is_book_comic,
    extract_comic_image_urls,
    vbook_image_cache_key,
) -> dict[str, Any]:
    bid = str(book_id or "").strip()
    if not bid:
        raise ValueError("Thiếu book_id.")
    book = storage.find_book(bid)
    if not book:
        raise ValueError("Không tìm thấy truyện.")

    normalized_rows = _normalize_remote_toc_rows(
        toc_rows,
        normalize_vbook_display_text=normalize_vbook_display_text,
    )
    if not normalized_rows:
        raise ValueError("Danh sách mục lục mới rỗng.")

    old_rows = storage.get_chapter_rows(bid)
    old_signature = [
        (
            int(row.get("chapter_order") or 0),
            normalize_vbook_display_text(str(row.get("title_raw") or ""), single_line=True),
            str(row.get("remote_url") or "").strip(),
            1 if bool(row.get("is_vip")) else 0,
        )
        for row in old_rows
    ]
    new_signature = [
        (
            int(row.get("chapter_order") or 0),
            str(row.get("title_raw") or ""),
            str(row.get("remote_url") or ""),
            1 if bool(row.get("is_vip")) else 0,
        )
        for row in normalized_rows
    ]
    if old_signature == new_signature:
        return {
            "ok": True,
            "changed": False,
            "book_id": bid,
            "chapter_count": int(len(old_rows)),
            "added": 0,
            "removed": 0,
            "renamed": 0,
            "reordered": 0,
            "cache_deleted": 0,
            "deleted_files": 0,
            "bytes_deleted": 0,
            "image_cache_deleted": 0,
            "image_bytes_deleted": 0,
        }

    old_by_url: dict[str, dict[str, Any]] = {}
    removed_rows_seed: list[dict[str, Any]] = []
    for row in old_rows:
        remote_url = str(row.get("remote_url") or "").strip()
        if remote_url and remote_url not in old_by_url:
            old_by_url[remote_url] = row
        else:
            removed_rows_seed.append(row)

    updates: list[tuple[Any, ...]] = []
    inserts: list[tuple[Any, ...]] = []
    kept_ids: list[str] = []
    removed_rows = list(removed_rows_seed)
    added = 0
    renamed = 0
    reordered = 0
    now = utc_now_iso()

    for row in normalized_rows:
        remote_url = str(row.get("remote_url") or "").strip()
        title_raw = str(row.get("title_raw") or "").strip()
        chapter_order = int(row.get("chapter_order") or 0)
        is_vip = 1 if bool(row.get("is_vip")) else 0
        old_row = old_by_url.pop(remote_url, None)
        if old_row:
            chapter_id = str(old_row.get("chapter_id") or "").strip()
            old_title = normalize_vbook_display_text(str(old_row.get("title_raw") or ""), single_line=True)
            old_order = int(old_row.get("chapter_order") or 0)
            title_vi = old_row.get("title_vi")
            if old_title != title_raw:
                renamed += 1
                title_vi = None
            if old_order != chapter_order:
                reordered += 1
            updates.append((chapter_order, title_raw, title_vi, is_vip, now, chapter_id))
            kept_ids.append(chapter_id)
            continue

        chapter_seed = f"{bid}|{remote_url}"
        chapter_id = f"ch_{hash_text(chapter_seed)}"
        raw_key = f"raw_{hash_text(f'{chapter_id}|{remote_url}')}"
        inserts.append(
            (
                chapter_id,
                bid,
                chapter_order,
                title_raw,
                None,
                raw_key,
                None,
                None,
                now,
                0,
                remote_url,
                is_vip,
            )
        )
        kept_ids.append(chapter_id)
        added += 1

    removed_rows.extend(old_by_url.values())
    removed_ids = [str(row.get("chapter_id") or "").strip() for row in removed_rows if str(row.get("chapter_id") or "").strip()]
    removed_cache_keys = {
        str(key).strip()
        for row in removed_rows
        for key in (row.get("raw_key"), row.get("trans_key"))
        if str(key or "").strip()
    }
    image_cache_keys = collect_vbook_image_cache_keys_for_chapters(
        storage,
        book=book,
        chapter_rows=removed_rows,
        is_book_comic=is_book_comic,
        extract_comic_image_urls=extract_comic_image_urls,
        vbook_image_cache_key=vbook_image_cache_key,
    )
    delete_stats = storage._delete_cache_keys_with_stats(removed_cache_keys) if removed_cache_keys else {
        "cache_deleted": 0,
        "deleted_files": 0,
        "bytes_deleted": 0,
    }
    image_stats = delete_vbook_image_cache_keys(image_cache_keys, image_cache_dir=image_cache_dir) if image_cache_keys else {
        "image_cache_deleted": 0,
        "image_bytes_deleted": 0,
    }

    with storage._connect() as conn:
        if removed_ids:
            placeholders = ",".join("?" for _ in removed_ids)
            conn.execute(
                f"DELETE FROM translation_unit_map WHERE chapter_id IN ({placeholders})",
                tuple(removed_ids),
            )
            conn.execute(
                f"DELETE FROM chapters WHERE chapter_id IN ({placeholders})",
                tuple(removed_ids),
            )
        if updates:
            conn.executemany(
                """
                UPDATE chapters
                SET chapter_order = ?, title_raw = ?, title_vi = ?, is_vip = ?, updated_at = ?
                WHERE chapter_id = ?
                """,
                updates,
            )
        if inserts:
            conn.executemany(
                """
                INSERT INTO chapters(
                    chapter_id, book_id, chapter_order, title_raw, title_vi,
                    raw_key, trans_key, trans_sig, updated_at, word_count, remote_url, is_vip
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                inserts,
            )
        last_read_id = str(book.get("last_read_chapter_id") or "").strip()
        keep_last_read = bool(last_read_id and last_read_id in set(kept_ids))
        if keep_last_read:
            conn.execute(
                "UPDATE books SET chapter_count = ?, updated_at = ? WHERE book_id = ?",
                (len(normalized_rows), now, bid),
            )
        else:
            fallback_last_read = kept_ids[0] if kept_ids else None
            conn.execute(
                """
                UPDATE books
                SET chapter_count = ?, updated_at = ?, last_read_chapter_id = ?, last_read_ratio = ?
                WHERE book_id = ?
                """,
                (len(normalized_rows), now, fallback_last_read, 0.0, bid),
            )

    return {
        "ok": True,
        "changed": True,
        "book_id": bid,
        "chapter_count": int(len(normalized_rows)),
        "added": int(added),
        "removed": int(len(removed_rows)),
        "renamed": int(renamed),
        "reordered": int(reordered),
        "cache_deleted": int(delete_stats.get("cache_deleted") or 0),
        "deleted_files": int(delete_stats.get("deleted_files") or 0),
        "bytes_deleted": int(delete_stats.get("bytes_deleted") or 0),
        "image_cache_deleted": int(image_stats.get("image_cache_deleted") or 0),
        "image_bytes_deleted": int(image_stats.get("image_bytes_deleted") or 0),
    }


def set_book_cover_upload(
    storage,
    book_id: str,
    filename: str,
    content: bytes,
    *,
    cover_dir: Path,
) -> dict[str, Any] | None:
    book = storage.find_book(book_id)
    if not book:
        return None
    suffix = _guess_cover_suffix(filename=filename, content_type="")
    path = cover_dir / f"{book_id}{suffix}"
    cover_dir.mkdir(parents=True, exist_ok=True)
    _delete_existing_book_cover_variants(book_id, cover_dir=cover_dir, keep_path=path)
    path.write_bytes(content)
    return storage.update_book_metadata(
        book_id,
        {
            "cover_path": str(path),
            "cover_remote_url": "",
            "cover_locked": 1,
        },
    )


def update_chapter_trans(storage, chapter_id: str, trans_key: str, trans_sig: str | None = None, *, utc_now_iso) -> None:
    with storage._connect() as conn:
        conn.execute(
            "UPDATE chapters SET trans_key = ?, trans_sig = ?, updated_at = ? WHERE chapter_id = ?",
            (trans_key, trans_sig, utc_now_iso(), chapter_id),
        )
