from __future__ import annotations

import hashlib
import json
import sqlite3
from pathlib import Path
from typing import Any


def cache_path_for_key(*, cache_dir: Path, cache_key: str) -> Path:
    prefix = str(cache_key or "")[:2]
    folder = cache_dir / prefix
    folder.mkdir(parents=True, exist_ok=True)
    return folder / f"{cache_key}.txt"


def write_cache(storage, cache_key: str, lang: str, text: str, *, utc_now_iso, cache_dir: Path) -> dict[str, Any]:
    now = utc_now_iso()
    raw = str(text or "").encode("utf-8")
    sha256 = hashlib.sha256(raw).hexdigest()
    path = cache_path_for_key(cache_dir=cache_dir, cache_key=cache_key)
    path.write_bytes(raw)

    with storage._connect() as conn:
        conn.execute(
            """
            INSERT INTO content_cache(cache_key, lang, text_path, sha256, bytes, created_at, updated_at)
            VALUES(?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(cache_key) DO UPDATE SET
                lang=excluded.lang,
                text_path=excluded.text_path,
                sha256=excluded.sha256,
                bytes=excluded.bytes,
                updated_at=excluded.updated_at
            """,
            (cache_key, lang, str(path), sha256, len(raw), now, now),
        )
    return {"cache_key": cache_key, "path": str(path), "sha256": sha256, "bytes": len(raw)}


def read_cache(
    storage,
    cache_key: str,
    *,
    resolve_persisted_path,
    runtime_base_dir,
    root_dir: Path,
    local_dir: Path,
    cache_dir: Path,
    decode_text_with_fallback,
    utc_now_iso,
) -> str | None:
    with storage._connect() as conn:
        row = conn.execute(
            "SELECT text_path FROM content_cache WHERE cache_key = ?",
            (cache_key,),
        ).fetchone()
    if not row:
        return None
    path = resolve_persisted_path(
        row["text_path"],
        runtime_base_dir(),
        root_dir,
        local_dir,
        cache_dir,
    )
    if not path.exists():
        fallback = cache_path_for_key(cache_dir=cache_dir, cache_key=cache_key)
        if not fallback.exists():
            return None
        path = fallback
        with storage._connect() as conn:
            conn.execute(
                "UPDATE content_cache SET text_path = ?, updated_at = ? WHERE cache_key = ?",
                (str(path), utc_now_iso(), cache_key),
            )
    return decode_text_with_fallback(path.read_bytes())


def get_translation_memory_batch(
    storage,
    source_texts: list[str],
    mode: str,
    trans_sig: str,
    *,
    normalize_translation_cache_source,
    normalize_newlines,
    utc_now_iso,
) -> dict[str, str]:
    mode_norm = str(mode or "server").strip().lower() or "server"
    sig = str(trans_sig or "").strip()
    if not sig:
        return {}

    clean_keys: list[str] = []
    seen: set[str] = set()
    for raw in source_texts or []:
        key = normalize_translation_cache_source(raw)
        if not key or key in seen:
            continue
        seen.add(key)
        clean_keys.append(key)
    if not clean_keys:
        return {}

    hash_map = {key: hashlib.sha1(key.encode("utf-8", errors="ignore")).hexdigest() for key in clean_keys}
    rows_out: dict[str, str] = {}
    hits_to_update: list[str] = []

    placeholders = ",".join("?" for _ in hash_map)
    params: list[Any] = [mode_norm, sig, *hash_map.values()]
    with storage._connect() as conn:
        rows = conn.execute(
            f"""
            SELECT source_hash, source_text, translated_text
            FROM translation_memory
            WHERE mode = ? AND trans_sig = ? AND source_hash IN ({placeholders})
            """,
            tuple(params),
        ).fetchall()
        for row in rows:
            source_text = normalize_translation_cache_source(row["source_text"])
            translated = normalize_newlines(row["translated_text"] or "")
            if not source_text or not translated:
                continue
            if hash_map.get(source_text) != row["source_hash"]:
                continue
            rows_out[source_text] = translated
            hits_to_update.append(str(row["source_hash"]))

        if hits_to_update:
            now = utc_now_iso()
            conn.executemany(
                """
                UPDATE translation_memory
                SET hit_count = hit_count + 1, updated_at = ?
                WHERE source_hash = ? AND mode = ? AND trans_sig = ?
                """,
                [(now, hit, mode_norm, sig) for hit in hits_to_update],
            )
    return rows_out


def set_translation_memory_batch(
    storage,
    entries: list[tuple[str, str]],
    mode: str,
    trans_sig: str,
    *,
    normalize_translation_cache_source,
    normalize_newlines,
    utc_now_iso,
) -> int:
    mode_norm = str(mode or "server").strip().lower() or "server"
    sig = str(trans_sig or "").strip()
    if not sig:
        return 0
    prepared: dict[str, str] = {}
    for source_text, translated_text in entries or []:
        source_key = normalize_translation_cache_source(source_text)
        translated = normalize_newlines(translated_text or "")
        if not source_key or not translated:
            continue
        prepared[source_key] = translated
    if not prepared:
        return 0

    now = utc_now_iso()
    rows = []
    for source_key, translated in prepared.items():
        source_hash = hashlib.sha1(source_key.encode("utf-8", errors="ignore")).hexdigest()
        rows.append((source_hash, source_key, mode_norm, sig, translated, now, now))
    with storage._connect() as conn:
        conn.executemany(
            """
            INSERT INTO translation_memory(
                source_hash, source_text, mode, trans_sig, translated_text, hit_count, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 0, ?, ?)
            ON CONFLICT(source_hash, mode, trans_sig) DO UPDATE SET
                source_text = excluded.source_text,
                translated_text = excluded.translated_text,
                updated_at = excluded.updated_at
            """,
            rows,
        )
    return len(rows)


def save_translation_unit_map(
    storage,
    chapter_id: str,
    trans_sig: str,
    translation_mode: str,
    units: list[dict[str, Any]],
    *,
    utc_now_iso,
) -> int:
    chapter_key = str(chapter_id or "").strip()
    sig = str(trans_sig or "").strip()
    mode = str(translation_mode or "server").strip().lower() or "server"
    if not chapter_key or not sig:
        return 0
    now = utc_now_iso()
    prepared: list[tuple[Any, ...]] = []
    for idx, row in enumerate(units or []):
        if not isinstance(row, dict):
            continue
        source_text = str(row.get("source_text") or "").strip()
        target_text = str(row.get("target_text") or "").strip()
        if not source_text and not target_text:
            continue
        prepared.append(
            (
                chapter_key,
                sig,
                mode,
                int(row.get("unit_index", idx) or idx),
                source_text,
                target_text,
                int(row.get("source_start") or 0),
                int(row.get("source_end") or 0),
                int(row.get("target_start") or 0),
                int(row.get("target_end") or 0),
                json.dumps(row.get("name_hits") or [], ensure_ascii=False, separators=(",", ":")),
                now,
                now,
            )
        )
    with storage._connect() as conn:
        conn.execute(
            "DELETE FROM translation_unit_map WHERE chapter_id = ? AND translation_mode = ?",
            (chapter_key, mode),
        )
        if prepared:
            conn.executemany(
                """
                INSERT INTO translation_unit_map(
                    chapter_id, trans_sig, translation_mode, unit_index,
                    source_text, target_text, source_start, source_end, target_start, target_end,
                    name_hits_json, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                prepared,
            )
    return len(prepared)


def get_translation_unit_map(
    storage,
    chapter_id: str,
    trans_sig: str,
    translation_mode: str,
) -> list[dict[str, Any]]:
    chapter_key = str(chapter_id or "").strip()
    sig = str(trans_sig or "").strip()
    mode = str(translation_mode or "server").strip().lower() or "server"
    if not chapter_key or not sig:
        return []
    with storage._connect() as conn:
        rows = conn.execute(
            """
            SELECT unit_index, source_text, target_text, source_start, source_end, target_start, target_end, name_hits_json
            FROM translation_unit_map
            WHERE chapter_id = ? AND trans_sig = ? AND translation_mode = ?
            ORDER BY unit_index ASC
            """,
            (chapter_key, sig, mode),
        ).fetchall()
    output: list[dict[str, Any]] = []
    for row in rows:
        item = dict(row)
        raw_hits = item.get("name_hits_json") or "[]"
        try:
            item["name_hits"] = json.loads(raw_hits) if isinstance(raw_hits, str) else []
        except Exception:
            item["name_hits"] = []
        item.pop("name_hits_json", None)
        output.append(item)
    return output


def get_translation_unit_map_count(storage, chapter_id: str, trans_sig: str, translation_mode: str) -> int:
    chapter_key = str(chapter_id or "").strip()
    sig = str(trans_sig or "").strip()
    mode = str(translation_mode or "server").strip().lower() or "server"
    if not chapter_key or not sig:
        return 0
    with storage._connect() as conn:
        row = conn.execute(
            """
            SELECT COUNT(1) AS c
            FROM translation_unit_map
            WHERE chapter_id = ? AND trans_sig = ? AND translation_mode = ?
            """,
            (chapter_key, sig, mode),
        ).fetchone()
    return int((row or {"c": 0})["c"] or 0)


def delete_cache_rows_with_stats(rows: list[sqlite3.Row] | list[dict[str, Any]]) -> dict[str, int]:
    deleted_files = 0
    bytes_deleted = 0
    for row in rows:
        path_raw = row["text_path"] if isinstance(row, sqlite3.Row) else row.get("text_path")
        path = Path(str(path_raw or ""))
        if not path.exists():
            continue
        try:
            bytes_deleted += int(path.stat().st_size)
        except Exception:
            pass
        try:
            path.unlink()
            deleted_files += 1
        except Exception:
            pass
    return {"deleted_files": deleted_files, "bytes_deleted": bytes_deleted}


def delete_cache_keys_with_stats(storage, keys: set[str]) -> dict[str, int]:
    if not keys:
        return {"cache_deleted": 0, "deleted_files": 0, "bytes_deleted": 0}
    with storage._connect() as conn:
        rows = conn.execute(
            f"SELECT cache_key, text_path, bytes FROM content_cache WHERE cache_key IN ({','.join('?' for _ in keys)})",
            tuple(keys),
        ).fetchall()
        conn.execute(
            f"DELETE FROM content_cache WHERE cache_key IN ({','.join('?' for _ in keys)})",
            tuple(keys),
        )
    file_stats = delete_cache_rows_with_stats(rows)
    return {
        "cache_deleted": int(len(rows)),
        "deleted_files": int(file_stats.get("deleted_files") or 0),
        "bytes_deleted": int(file_stats.get("bytes_deleted") or 0),
    }


def delete_cache_keys(storage, keys: set[str]) -> int:
    if not keys:
        return 0
    stats = delete_cache_keys_with_stats(storage, keys)
    return int(stats.get("deleted_files") or 0)


def get_content_cache_meta(storage, keys: set[str] | list[str]) -> dict[str, dict[str, Any]]:
    input_keys = [str(key or "").strip() for key in (keys or []) if str(key or "").strip()]
    if not input_keys:
        return {}
    output: dict[str, dict[str, Any]] = {}
    step = 800
    with storage._connect() as conn:
        for idx in range(0, len(input_keys), step):
            chunk = input_keys[idx : idx + step]
            rows = conn.execute(
                f"SELECT cache_key, text_path, bytes FROM content_cache WHERE cache_key IN ({','.join('?' for _ in chunk)})",
                tuple(chunk),
            ).fetchall()
            for row in rows:
                key = str(row["cache_key"] or "").strip()
                if not key:
                    continue
                output[key] = {
                    "text_path": str(row["text_path"] or "").strip(),
                    "bytes": int(row["bytes"] or 0),
                }
    return output


def get_translation_cache_stats(storage) -> dict[str, int]:
    with storage._connect() as conn:
        trans_row = conn.execute(
            "SELECT COUNT(1) AS c, COALESCE(SUM(bytes),0) AS b FROM content_cache WHERE cache_key LIKE 'tr_%'"
        ).fetchone()
        tm_row = conn.execute("SELECT COUNT(1) AS c FROM translation_memory").fetchone()
        tum_row = conn.execute("SELECT COUNT(1) AS c FROM translation_unit_map").fetchone()
    return {
        "translated_cache_count": int((trans_row or {"c": 0})["c"] or 0),
        "translated_cache_bytes": int((trans_row or {"b": 0})["b"] or 0),
        "translation_memory_count": int((tm_row or {"c": 0})["c"] or 0),
        "translation_unit_map_count": int((tum_row or {"c": 0})["c"] or 0),
    }


def clear_translated_cache(storage, *, utc_now_iso) -> dict[str, Any]:
    with storage._connect() as conn:
        rows = conn.execute(
            "SELECT cache_key, text_path, bytes FROM content_cache WHERE cache_key LIKE 'tr_%'"
        ).fetchall()
        conn.execute("DELETE FROM content_cache WHERE cache_key LIKE 'tr_%'")
        tm_count = conn.execute("SELECT COUNT(1) AS c FROM translation_memory").fetchone()["c"]
        conn.execute("DELETE FROM translation_memory")
        tum_count = conn.execute("SELECT COUNT(1) AS c FROM translation_unit_map").fetchone()["c"]
        conn.execute("DELETE FROM translation_unit_map")
        conn.execute("UPDATE chapters SET trans_key = NULL, trans_sig = NULL, updated_at = ?", (utc_now_iso(),))

    file_stats = delete_cache_rows_with_stats(rows)
    return {
        "deleted_files": int(file_stats.get("deleted_files") or 0),
        "bytes_deleted": int(file_stats.get("bytes_deleted") or 0),
        "cache_deleted": int(len(rows)),
        "tm_deleted": int(tm_count or 0),
        "unit_map_deleted": int(tum_count or 0),
    }


def clear_book_cache(
    storage,
    book_id: str,
    *,
    clear_raw: bool = False,
    clear_trans: bool = False,
    utc_now_iso,
) -> dict[str, Any]:
    bid = str(book_id or "").strip()
    if not bid:
        return {
            "found": False,
            "book_id": "",
            "raw_cache_deleted": 0,
            "trans_cache_deleted": 0,
            "unit_map_deleted": 0,
            "deleted_files": 0,
            "bytes_deleted": 0,
        }
    chapters = storage.get_chapter_rows(bid)
    if not chapters:
        book = storage.find_book(bid)
        if not book:
            return {
                "found": False,
                "book_id": bid,
                "raw_cache_deleted": 0,
                "trans_cache_deleted": 0,
                "unit_map_deleted": 0,
                "deleted_files": 0,
                "bytes_deleted": 0,
            }
    raw_keys: set[str] = set()
    trans_keys: set[str] = set()
    chapter_ids: list[str] = []
    for chapter in chapters:
        if clear_raw and chapter.get("raw_key"):
            raw_keys.add(str(chapter.get("raw_key") or "").strip())
        if clear_trans and chapter.get("trans_key"):
            trans_keys.add(str(chapter.get("trans_key") or "").strip())
        if clear_trans and chapter.get("chapter_id"):
            chapter_ids.append(str(chapter.get("chapter_id") or "").strip())
    keys = {key for key in raw_keys.union(trans_keys) if key}
    deleted_stats = delete_cache_keys_with_stats(storage, keys) if keys else {
        "cache_deleted": 0,
        "deleted_files": 0,
        "bytes_deleted": 0,
    }

    unit_map_deleted = 0
    if clear_trans and chapter_ids:
        with storage._connect() as conn:
            row = conn.execute(
                f"SELECT COUNT(1) AS c FROM translation_unit_map WHERE chapter_id IN ({','.join('?' for _ in chapter_ids)})",
                tuple(chapter_ids),
            ).fetchone()
            unit_map_deleted = int((row or {"c": 0})["c"] or 0)
            conn.execute(
                f"DELETE FROM translation_unit_map WHERE chapter_id IN ({','.join('?' for _ in chapter_ids)})",
                tuple(chapter_ids),
            )
            conn.execute(
                "UPDATE chapters SET trans_key = NULL, trans_sig = NULL, updated_at = ? WHERE book_id = ?",
                (utc_now_iso(), bid),
            )

    return {
        "found": True,
        "book_id": bid,
        "raw_cache_deleted": int(len(raw_keys)),
        "trans_cache_deleted": int(len(trans_keys)),
        "unit_map_deleted": int(unit_map_deleted),
        "deleted_files": int(deleted_stats.get("deleted_files") or 0),
        "bytes_deleted": int(deleted_stats.get("bytes_deleted") or 0),
    }


def clear_chapter_translated_cache(
    storage,
    chapter_id: str,
    *,
    resolve_persisted_path,
    runtime_base_dir,
    root_dir: Path,
    local_dir: Path,
    cache_dir: Path,
    utc_now_iso,
) -> dict[str, Any]:
    chapter_key = str(chapter_id or "").strip()
    if not chapter_key:
        return {"found": False, "deleted_files": 0, "bytes_deleted": 0, "cache_deleted": 0, "unit_map_deleted": 0}

    rows: list[sqlite3.Row] = []
    unit_map_deleted = 0
    cache_deleted = 0
    with storage._connect() as conn:
        chapter_row = conn.execute(
            "SELECT chapter_id, trans_key FROM chapters WHERE chapter_id = ?",
            (chapter_key,),
        ).fetchone()
        if not chapter_row:
            return {"found": False, "deleted_files": 0, "bytes_deleted": 0, "cache_deleted": 0, "unit_map_deleted": 0}

        trans_key = str(chapter_row["trans_key"] or "").strip()
        if trans_key:
            rows = conn.execute(
                "SELECT cache_key, text_path FROM content_cache WHERE cache_key = ?",
                (trans_key,),
            ).fetchall()
            conn.execute("DELETE FROM content_cache WHERE cache_key = ?", (trans_key,))
            cache_deleted = int(len(rows))

        unit_map_row = conn.execute(
            "SELECT COUNT(1) AS c FROM translation_unit_map WHERE chapter_id = ?",
            (chapter_key,),
        ).fetchone()
        unit_map_deleted = int((unit_map_row or {"c": 0})["c"] or 0)
        conn.execute("DELETE FROM translation_unit_map WHERE chapter_id = ?", (chapter_key,))
        conn.execute(
            "UPDATE chapters SET trans_key = NULL, trans_sig = NULL, updated_at = ? WHERE chapter_id = ?",
            (utc_now_iso(), chapter_key),
        )

    deleted_files = 0
    bytes_deleted = 0
    for row in rows:
        path = resolve_persisted_path(
            row["text_path"],
            runtime_base_dir(),
            root_dir,
            local_dir,
            cache_dir,
        )
        if path.exists():
            try:
                bytes_deleted += int(path.stat().st_size)
                path.unlink()
                deleted_files += 1
            except Exception:
                pass
    return {
        "found": True,
        "deleted_files": deleted_files,
        "bytes_deleted": bytes_deleted,
        "cache_deleted": cache_deleted,
        "unit_map_deleted": unit_map_deleted,
    }
