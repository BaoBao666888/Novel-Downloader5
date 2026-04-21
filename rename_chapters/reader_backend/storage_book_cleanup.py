from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any


_TRANS_SIG_SNAPSHOT_KEY_PREFIX = "reader.trans_sig_snapshot"


def _delete_path_if_exists(target: Path | None) -> bool:
    if not isinstance(target, Path) or not target.exists():
        return False
    try:
        if target.is_dir():
            shutil.rmtree(target, ignore_errors=True)
        else:
            target.unlink(missing_ok=True)
        return True
    except Exception:
        return False


def _path_is_within(target: Path | None, roots: list[Path]) -> bool:
    if not isinstance(target, Path):
        return False
    try:
        resolved_target = target.resolve(strict=False)
    except Exception:
        resolved_target = target
    for root in roots:
        if not isinstance(root, Path):
            continue
        try:
            resolved_root = root.resolve(strict=False)
        except Exception:
            resolved_root = root
        try:
            if resolved_target.is_relative_to(resolved_root):
                return True
        except Exception:
            continue
    return False


def _delete_book_import_previews(book_id: str, *, import_preview_dir: Path | None) -> int:
    bid = str(book_id or "").strip()
    if not bid or not isinstance(import_preview_dir, Path) or not import_preview_dir.exists():
        return 0
    removed = 0
    for child in import_preview_dir.iterdir():
        if not child.is_dir():
            continue
        state_path = child / "state.json"
        if not state_path.exists():
            continue
        try:
            payload = json.loads(state_path.read_text(encoding="utf-8"))
        except Exception:
            payload = {}
        if not isinstance(payload, dict):
            continue
        if str(payload.get("kind") or "").strip() != "book_supplement":
            continue
        if str(payload.get("book_id") or "").strip() != bid:
            continue
        if _delete_path_if_exists(child):
            removed += 1
    return removed


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
    supplement_source_dir: Path,
    import_preview_dir: Path,
    chapter_raw_edit_state_key,
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
    source_file_path = str((book or {}).get("source_file_path") or "").strip()

    content_keys = {ch["raw_key"] for ch in chapters if ch.get("raw_key")}
    content_keys.update(ch["trans_key"] for ch in chapters if ch.get("trans_key"))
    chapter_ids = [str(ch.get("chapter_id") or "").strip() for ch in chapters if str(ch.get("chapter_id") or "").strip()]
    trans_sigs = {
        str(ch.get("trans_sig") or "").strip()
        for ch in chapters
        if str(ch.get("trans_sig") or "").strip()
    }
    trans_sig_snapshot_keys = {
        f"{_TRANS_SIG_SNAPSHOT_KEY_PREFIX}.{base_sig}"
        for base_sig in (sig.split("|junk:", 1)[0].strip() for sig in trans_sigs)
        if base_sig
    }
    raw_edit_state_keys = {
        str(chapter_raw_edit_state_key(chapter_id) or "").strip()
        for chapter_id in chapter_ids
        if str(chapter_raw_edit_state_key(chapter_id) or "").strip()
    }
    batch_ids: set[str] = set()
    image_cache_keys: set[str] = set()
    if is_book_comic(book):
        image_cache_keys = storage._collect_vbook_image_cache_keys_for_chapters(
            book=book,
            chapter_rows=chapters,
        )

    with storage._connect() as conn:
        if chapter_ids:
            conn.executemany(
                "DELETE FROM translation_unit_map WHERE chapter_id = ?",
                [(chapter_id,) for chapter_id in chapter_ids],
            )
        if trans_sigs:
            conn.executemany(
                "DELETE FROM translation_memory WHERE mode <> 'server' AND trans_sig = ?",
                [(trans_sig,) for trans_sig in sorted(trans_sigs)],
            )
        batch_rows = conn.execute(
            "SELECT batch_id FROM book_supplement_batches WHERE book_id = ?",
            (book_id,),
        ).fetchall()
        batch_ids = {
            str(row["batch_id"] or "").strip()
            for row in batch_rows
            if str(row["batch_id"] or "").strip()
        }
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
    for key in sorted(raw_edit_state_keys):
        storage._delete_app_state_value(key)
    for key in sorted(trans_sig_snapshot_keys):
        storage._delete_app_state_value(key)

    epub_file = cache_dir / "epub_sources" / f"{book_id}.epub"
    _delete_path_if_exists(epub_file)

    cover_path = (book or {}).get("cover_path") or ""
    if cover_path and not str(cover_path).startswith(("http://", "https://", "data:")):
        resolved_cover = resolve_persisted_path(
            cover_path,
            runtime_base_dir(),
            root_dir,
            local_dir,
            cover_dir,
        )
        _delete_path_if_exists(resolved_cover)

    if source_file_path and not source_file_path.startswith(("http://", "https://", "data:")):
        runtime_dir = runtime_base_dir()
        resolved_source_file = resolve_persisted_path(
            source_file_path,
            runtime_dir,
            cache_dir,
            local_dir,
            root_dir,
            supplement_source_dir,
        )
        if _path_is_within(
            resolved_source_file,
            [runtime_dir, cache_dir, local_dir, cover_dir, supplement_source_dir],
        ):
            _delete_path_if_exists(resolved_source_file)

    for batch_id in sorted(batch_ids):
        _delete_path_if_exists(supplement_source_dir / batch_id)
    _delete_book_import_previews(book_id, import_preview_dir=import_preview_dir)

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
