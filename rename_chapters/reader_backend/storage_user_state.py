from __future__ import annotations

import json
import re
import uuid
from typing import Any


def _validate_regex_or_raise(pattern: str, label: str) -> None:
    try:
        re.compile(str(pattern or ""))
    except re.error as exc:
        raise ValueError(f"{label} không hợp lệ: {exc}") from exc


def _name_set_state_key(book_id: str | None, *, base_key: str) -> str:
    bid = str(book_id or "").strip()
    if not bid:
        return base_key
    return f"{base_key}.{bid}"


def _load_name_set_state_raw(
    storage,
    *,
    book_id: str | None,
    base_key: str,
    conn=None,
) -> dict[str, Any] | None:
    key = _name_set_state_key(book_id, base_key=base_key)
    if conn is not None:
        row = conn.execute("SELECT value FROM app_state WHERE key = ?", (key,)).fetchone()
        raw = str(row["value"]) if row and row["value"] is not None else None
    else:
        raw = storage._get_app_state_value(key)
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
    except Exception:
        return None
    return parsed if isinstance(parsed, dict) else None


def _normalize_name_set_state(
    state: dict[str, Any] | None,
    *,
    default_sets: dict[str, Any] | None,
    active_default: str | None,
    normalize_name_sets_collection,
) -> dict[str, Any]:
    base_sets = (state or {}).get("sets")
    if base_sets is None:
        base_sets = default_sets if isinstance(default_sets, dict) else {}
    sets = normalize_name_sets_collection(base_sets)

    active = str((state or {}).get("active_set") or active_default or "").strip()
    if active not in sets:
        active = next(iter(sets.keys()))

    version_raw = (state or {}).get("version")
    try:
        version = max(1, int(version_raw or 1))
    except Exception:
        version = 1
    return {"sets": sets, "active_set": active, "version": version}


def _persist_name_set_state(
    storage,
    state: dict[str, Any],
    *,
    book_id: str | None,
    base_key: str,
    conn=None,
    utc_now_iso=None,
) -> None:
    key = _name_set_state_key(book_id, base_key=base_key)
    value = json.dumps(state, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    if conn is None:
        storage._set_app_state_value(key, value)
        return
    now = utc_now_iso() if callable(utc_now_iso) else ""
    conn.execute(
        """
        INSERT INTO app_state(key, value, updated_at)
        VALUES(?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = excluded.updated_at
        """,
        (key, value, now),
    )


def _normalize_history_context(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        return {}
    try:
        payload = json.loads(json.dumps(value, ensure_ascii=False, default=str))
    except Exception:
        return {}
    return payload if isinstance(payload, dict) else {}


def _insert_book_name_history_row(
    conn,
    *,
    book_id: str,
    set_name: str,
    action_type: str,
    source_text: str,
    target_text: str,
    previous_target_text: str,
    origin: str,
    chapter_id: str,
    payload: dict[str, Any] | None,
    created_at: str,
) -> None:
    conn.execute(
        """
        INSERT INTO book_name_history(
            event_id,
            book_id,
            set_name,
            action_type,
            source_text,
            target_text,
            previous_target_text,
            origin,
            chapter_id,
            payload_json,
            created_at
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            f"bnh_{uuid.uuid4().hex}",
            str(book_id or "").strip(),
            str(set_name or "").strip(),
            str(action_type or "").strip(),
            str(source_text or "").strip(),
            str(target_text or "").strip(),
            str(previous_target_text or "").strip(),
            str(origin or "").strip(),
            str(chapter_id or "").strip(),
            json.dumps(payload or {}, ensure_ascii=False, separators=(",", ":")),
            str(created_at or "").strip(),
        ),
    )


def _log_name_set_history_diff(
    conn,
    *,
    book_id: str | None,
    current_state: dict[str, Any],
    next_state: dict[str, Any],
    origin: str | None,
    chapter_id: str | None,
    history_context: dict[str, Any] | None,
    utc_now_iso,
) -> None:
    normalized_book_id = str(book_id or "").strip()
    if not normalized_book_id:
        return
    current_sets = current_state.get("sets") or {}
    next_sets = next_state.get("sets") or {}
    context = _normalize_history_context(history_context)
    normalized_origin = str(origin or "").strip()
    normalized_chapter_id = str(chapter_id or "").strip()
    created_at = utc_now_iso() if callable(utc_now_iso) else ""

    def emit(
        *,
        set_name: str,
        action_type: str,
        source_text: str = "",
        target_text: str = "",
        previous_target_text: str = "",
        extra_payload: dict[str, Any] | None = None,
    ) -> None:
        payload = dict(context) if context else {}
        if isinstance(extra_payload, dict):
            payload.update(extra_payload)
        _insert_book_name_history_row(
            conn,
            book_id=normalized_book_id,
            set_name=set_name,
            action_type=action_type,
            source_text=source_text,
            target_text=target_text,
            previous_target_text=previous_target_text,
            origin=normalized_origin,
            chapter_id=normalized_chapter_id,
            payload=payload,
            created_at=created_at,
        )

    current_set_names = set(current_sets.keys())
    next_set_names = set(next_sets.keys())
    for set_name in sorted(next_set_names - current_set_names):
        emit(
            set_name=set_name,
            action_type="set_added",
            extra_payload={"entry_count": len(next_sets.get(set_name) or {})},
        )
    for set_name in sorted(current_set_names - next_set_names):
        emit(
            set_name=set_name,
            action_type="set_deleted",
            extra_payload={"entry_count": len(current_sets.get(set_name) or {})},
        )

    common_names = sorted(current_set_names & next_set_names)
    for set_name in common_names:
        before_entries = current_sets.get(set_name) or {}
        after_entries = next_sets.get(set_name) or {}
        before_sources = set(before_entries.keys())
        after_sources = set(after_entries.keys())
        for source_text in sorted(after_sources - before_sources):
            emit(
                set_name=set_name,
                action_type="entry_added",
                source_text=source_text,
                target_text=str(after_entries.get(source_text) or "").strip(),
            )
        for source_text in sorted(before_sources - after_sources):
            emit(
                set_name=set_name,
                action_type="entry_deleted",
                source_text=source_text,
                previous_target_text=str(before_entries.get(source_text) or "").strip(),
            )
        for source_text in sorted(before_sources & after_sources):
            previous_target = str(before_entries.get(source_text) or "").strip()
            next_target = str(after_entries.get(source_text) or "").strip()
            if previous_target == next_target:
                continue
            emit(
                set_name=set_name,
                action_type="entry_updated",
                source_text=source_text,
                target_text=next_target,
                previous_target_text=previous_target,
            )


def get_name_set_state(
    storage,
    *,
    default_sets: dict[str, Any] | None = None,
    active_default: str | None = None,
    book_id: str | None = None,
    normalize_name_sets_collection,
    base_key: str,
    conn=None,
) -> dict[str, Any]:
    raw_state = _load_name_set_state_raw(storage, book_id=book_id, base_key=base_key, conn=conn)
    return _normalize_name_set_state(
        raw_state,
        default_sets=default_sets,
        active_default=active_default,
        normalize_name_sets_collection=normalize_name_sets_collection,
    )


def set_name_set_state(
    storage,
    sets: dict[str, Any] | None,
    *,
    active_set: str | None = None,
    bump_version: bool = True,
    book_id: str | None = None,
    normalize_name_sets_collection,
    base_key: str,
    utc_now_iso=None,
    origin: str | None = None,
    chapter_id: str | None = None,
    history_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    with storage._connect() as conn:
        current = get_name_set_state(
            storage,
            book_id=book_id,
            normalize_name_sets_collection=normalize_name_sets_collection,
            base_key=base_key,
            conn=conn,
        )
        normalized_sets = normalize_name_sets_collection(sets if isinstance(sets, dict) else current.get("sets") or {})
        desired_active = str(active_set or current.get("active_set") or "").strip()
        if not normalized_sets:
            fallback_name = desired_active or "Mặc định"
            normalized_sets = {fallback_name: {}}
        if desired_active not in normalized_sets:
            desired_active = next(iter(normalized_sets.keys()))
        next_version = int(current.get("version") or 1)
        if bump_version:
            next_version += 1
        final_state = {
            "sets": normalized_sets,
            "active_set": desired_active,
            "version": max(1, int(next_version)),
        }
        _persist_name_set_state(
            storage,
            final_state,
            book_id=book_id,
            base_key=base_key,
            conn=conn,
            utc_now_iso=utc_now_iso,
        )
        _log_name_set_history_diff(
            conn,
            book_id=book_id,
            current_state=current,
            next_state=final_state,
            origin=origin,
            chapter_id=chapter_id,
            history_context=history_context,
            utc_now_iso=utc_now_iso,
        )
    return final_state


def update_name_set_entry(
    storage,
    source: str,
    target: str,
    *,
    set_name: str | None = None,
    delete: bool = False,
    book_id: str | None = None,
    normalize_name_sets_collection,
    contains_name_split_delimiter,
    base_key: str,
    utc_now_iso=None,
    origin: str | None = None,
    chapter_id: str | None = None,
    history_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    source_key = str(source or "").strip()
    if not source_key:
        raise ValueError("Thiếu source cho entry name set.")
    if contains_name_split_delimiter(source_key):
        raise ValueError("Tên gốc không được chứa dấu tách câu (.,;:!? xuống dòng).")

    state = get_name_set_state(
        storage,
        book_id=book_id,
        normalize_name_sets_collection=normalize_name_sets_collection,
        base_key=base_key,
    )
    sets = normalize_name_sets_collection(state.get("sets") or {})
    active = str(set_name or state.get("active_set") or "").strip()
    if active not in sets:
        sets[active or "Mặc định"] = {}
        active = active or "Mặc định"

    target_value = str(target or "").strip()
    if target_value and contains_name_split_delimiter(target_value):
        raise ValueError("Tên dịch không được chứa dấu tách câu (.,;:!? xuống dòng).")
    if delete or not target_value:
        sets[active].pop(source_key, None)
    else:
        sets[active][source_key] = target_value

    return set_name_set_state(
        storage,
        sets,
        active_set=active,
        bump_version=True,
        book_id=book_id,
        normalize_name_sets_collection=normalize_name_sets_collection,
        base_key=base_key,
        utc_now_iso=utc_now_iso,
        origin=origin,
        chapter_id=chapter_id,
        history_context=history_context,
    )


def list_book_name_history(storage, book_id: str, *, limit: int = 200) -> list[dict[str, Any]]:
    normalized_book_id = str(book_id or "").strip()
    if not normalized_book_id:
        return []
    try:
        safe_limit = max(1, min(1000, int(limit or 200)))
    except Exception:
        safe_limit = 200
    with storage._connect() as conn:
        rows = conn.execute(
            """
            SELECT event_id, book_id, set_name, action_type, source_text, target_text,
                   previous_target_text, origin, chapter_id, payload_json, created_at
            FROM book_name_history
            WHERE book_id = ?
            ORDER BY created_at DESC, event_id DESC
            LIMIT ?
            """,
            (normalized_book_id, safe_limit),
        ).fetchall()
    items: list[dict[str, Any]] = []
    for row in rows:
        payload_raw = row["payload_json"]
        payload: dict[str, Any] = {}
        if payload_raw:
            try:
                parsed = json.loads(str(payload_raw))
                if isinstance(parsed, dict):
                    payload = parsed
            except Exception:
                payload = {}
        items.append(
            {
                "event_id": str(row["event_id"] or "").strip(),
                "book_id": normalized_book_id,
                "set_name": str(row["set_name"] or "").strip(),
                "action_type": str(row["action_type"] or "").strip(),
                "source_text": str(row["source_text"] or "").strip(),
                "target_text": str(row["target_text"] or "").strip(),
                "previous_target_text": str(row["previous_target_text"] or "").strip(),
                "origin": str(row["origin"] or "").strip(),
                "chapter_id": str(row["chapter_id"] or "").strip(),
                "payload": payload,
                "created_at": str(row["created_at"] or "").strip(),
            }
        )
    return items


def get_active_name_set(
    storage,
    *,
    default_sets: dict[str, Any] | None = None,
    active_default: str | None = None,
    book_id: str | None = None,
    normalize_name_set,
    normalize_name_sets_collection,
    base_key: str,
) -> tuple[str, dict[str, str], int]:
    state = get_name_set_state(
        storage,
        default_sets=default_sets,
        active_default=active_default,
        book_id=book_id,
        normalize_name_sets_collection=normalize_name_sets_collection,
        base_key=base_key,
    )
    active = str(state.get("active_set") or "")
    sets = state.get("sets") or {}
    return active, normalize_name_set(sets.get(active) or {}), int(state.get("version") or 1)


def _book_vp_set_key(book_id: str, *, base_prefix: str) -> str:
    bid = str(book_id or "").strip()
    if not bid:
        raise ValueError("Thiếu book_id cho VP riêng.")
    return f"{base_prefix}.{bid}"


def get_book_vp_set_state(storage, book_id: str, *, normalize_name_set, base_prefix: str) -> dict[str, Any]:
    key = _book_vp_set_key(book_id, base_prefix=base_prefix)
    raw = storage._get_app_state_value(key)
    parsed: dict[str, Any] | None = None
    if raw:
        try:
            payload = json.loads(raw)
            if isinstance(payload, dict):
                parsed = payload
        except Exception:
            parsed = None
    entries = normalize_name_set((parsed or {}).get("entries"))
    try:
        version = max(1, int((parsed or {}).get("version") or 1))
    except Exception:
        version = 1
    state = {"entries": entries, "version": version}
    if parsed is None or normalize_name_set(parsed.get("entries")) != entries:
        storage._set_app_state_value(key, json.dumps(state, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
    return state


def get_book_vp_set(storage, book_id: str, *, normalize_name_set, base_prefix: str) -> tuple[dict[str, str], int]:
    state = get_book_vp_set_state(storage, book_id, normalize_name_set=normalize_name_set, base_prefix=base_prefix)
    return normalize_name_set(state.get("entries")), int(state.get("version") or 1)


def set_book_vp_set_state(
    storage,
    book_id: str,
    entries: dict[str, Any] | None,
    *,
    bump_version: bool = True,
    normalize_name_set,
    base_prefix: str,
) -> dict[str, Any]:
    current = get_book_vp_set_state(storage, book_id, normalize_name_set=normalize_name_set, base_prefix=base_prefix)
    normalized_entries = normalize_name_set(entries if isinstance(entries, dict) else current.get("entries"))
    next_version = int(current.get("version") or 1)
    if bump_version:
        next_version += 1
    state = {"entries": normalized_entries, "version": max(1, next_version)}
    storage._set_app_state_value(
        _book_vp_set_key(book_id, base_prefix=base_prefix),
        json.dumps(state, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
    )
    return state


def update_book_vp_entry(
    storage,
    book_id: str,
    source: str,
    target: str,
    *,
    delete: bool = False,
    normalize_name_set,
    base_prefix: str,
) -> dict[str, Any]:
    source_key = str(source or "").strip()
    if not source_key:
        raise ValueError("Thiếu source cho VP riêng.")
    state = get_book_vp_set_state(storage, book_id, normalize_name_set=normalize_name_set, base_prefix=base_prefix)
    entries = normalize_name_set(state.get("entries"))
    target_value = str(target or "").strip()
    if delete or not target_value:
        entries.pop(source_key, None)
    else:
        entries[source_key] = target_value
    return set_book_vp_set_state(
        storage,
        book_id,
        entries,
        bump_version=True,
        normalize_name_set=normalize_name_set,
        base_prefix=base_prefix,
    )


def get_global_junk_state(storage, *, state_key: str, normalize_junk_entries) -> dict[str, Any]:
    raw = storage._get_app_state_value(state_key)
    parsed: dict[str, Any] | None = None
    if raw:
        try:
            payload = json.loads(raw)
            if isinstance(payload, dict):
                parsed = payload
        except Exception:
            parsed = None
    raw_entries = (parsed or {}).get("entries")
    if raw_entries is None:
        raw_entries = (parsed or {}).get("lines")
    entries = normalize_junk_entries(raw_entries)
    try:
        version = max(1, int((parsed or {}).get("version") or 1))
    except Exception:
        version = 1
    state = {
        "entries": entries,
        "lines": [str(item.get("text") or "").strip() for item in entries if str(item.get("text") or "").strip()],
        "version": version,
    }
    parsed_entries = normalize_junk_entries((parsed or {}).get("entries") if isinstance(parsed, dict) else None)
    if not parsed_entries:
        parsed_entries = normalize_junk_entries((parsed or {}).get("lines") if isinstance(parsed, dict) else None)
    if parsed is None or parsed_entries != entries:
        storage._set_app_state_value(
            state_key,
            json.dumps(state, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
        )
    return state


def get_global_junk_lines(storage, *, state_key: str, normalize_junk_entries) -> tuple[list[dict[str, Any]], int]:
    state = get_global_junk_state(storage, state_key=state_key, normalize_junk_entries=normalize_junk_entries)
    return normalize_junk_entries(state.get("entries")), int(state.get("version") or 1)


def set_global_junk_state(
    storage,
    lines: list[Any] | tuple[Any, ...] | None,
    *,
    bump_version: bool = True,
    state_key: str,
    normalize_junk_entries,
) -> dict[str, Any]:
    current = get_global_junk_state(storage, state_key=state_key, normalize_junk_entries=normalize_junk_entries)
    normalized_entries = normalize_junk_entries(lines if isinstance(lines, (list, tuple)) else current.get("entries"))
    for item in normalized_entries:
        if bool((item or {}).get("use_regex")):
            _validate_regex_or_raise(str((item or {}).get("text") or ""), "Regex xóa rác")
    next_version = int(current.get("version") or 1)
    if bump_version:
        next_version += 1
    state = {
        "entries": normalized_entries,
        "lines": [str(item.get("text") or "").strip() for item in normalized_entries if str(item.get("text") or "").strip()],
        "version": max(1, next_version),
    }
    storage._set_app_state_value(
        state_key,
        json.dumps(state, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
    )
    return state


def update_global_junk_entry(
    storage,
    line: str,
    new_line: str = "",
    *,
    delete: bool = False,
    use_regex: bool = False,
    ignore_case: bool = False,
    new_use_regex: bool | None = None,
    new_ignore_case: bool | None = None,
    state_key: str,
    normalize_newlines,
    normalize_junk_entries,
) -> dict[str, Any]:
    source_line = normalize_newlines(str(line or "")).strip()
    target_line = normalize_newlines(str(new_line or "")).strip()
    if not source_line and not target_line:
        raise ValueError("Thiếu dòng rác.")
    state = get_global_junk_state(storage, state_key=state_key, normalize_junk_entries=normalize_junk_entries)
    entries = normalize_junk_entries(state.get("entries"))
    next_entries: list[dict[str, Any]] = []
    source_found = False
    source_regex = bool(use_regex)
    source_ignore_case = bool(ignore_case)
    target_regex = bool(source_regex if new_use_regex is None else new_use_regex)
    target_ignore_case = bool(source_ignore_case if new_ignore_case is None else new_ignore_case)
    for item in entries:
        item_text = str((item or {}).get("text") or "").strip()
        item_regex = bool((item or {}).get("use_regex"))
        item_ignore_case = bool((item or {}).get("ignore_case"))
        if item_text != source_line or item_regex != source_regex or item_ignore_case != source_ignore_case:
            next_entries.append(item)
            continue
        source_found = True
        if delete or not target_line:
            continue
        if target_regex:
            _validate_regex_or_raise(target_line, "Regex xóa rác")
        candidate = {"text": target_line, "use_regex": target_regex, "ignore_case": target_ignore_case}
        if candidate not in next_entries:
            next_entries.append(candidate)
    if (not source_found) and (not delete) and target_line:
        if target_regex:
            _validate_regex_or_raise(target_line, "Regex xóa rác")
        candidate = {"text": target_line, "use_regex": target_regex, "ignore_case": target_ignore_case}
        if candidate not in next_entries:
            next_entries.append(candidate)
    if next_entries == entries:
        return {
            "entries": entries,
            "lines": [str(item.get("text") or "").strip() for item in entries if str(item.get("text") or "").strip()],
            "version": int(state.get("version") or 1),
        }
    return set_global_junk_state(
        storage,
        next_entries,
        bump_version=True,
        state_key=state_key,
        normalize_junk_entries=normalize_junk_entries,
    )


def _book_replace_state_key(book_id: str, *, base_prefix: str) -> str:
    bid = str(book_id or "").strip()
    return f"{base_prefix}.{bid}" if bid else base_prefix


def get_book_replace_state(storage, book_id: str, *, normalize_text_replace_entries, base_prefix: str) -> dict[str, Any]:
    raw = storage._get_app_state_value(_book_replace_state_key(book_id, base_prefix=base_prefix))
    parsed: dict[str, Any] | None = None
    if raw:
        try:
            payload = json.loads(raw)
            if isinstance(payload, dict):
                parsed = payload
        except Exception:
            parsed = None
    entries = normalize_text_replace_entries((parsed or {}).get("entries"))
    try:
        version = max(1, int((parsed or {}).get("version") or 1))
    except Exception:
        version = 1
    state = {"entries": entries, "version": version}
    parsed_entries = normalize_text_replace_entries((parsed or {}).get("entries") if isinstance(parsed, dict) else None)
    if parsed is None or parsed_entries != entries:
        storage._set_app_state_value(
            _book_replace_state_key(book_id, base_prefix=base_prefix),
            json.dumps(state, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
        )
    return state


def get_book_replace_entries(storage, book_id: str, *, normalize_text_replace_entries, base_prefix: str) -> tuple[list[dict[str, Any]], int]:
    state = get_book_replace_state(storage, book_id, normalize_text_replace_entries=normalize_text_replace_entries, base_prefix=base_prefix)
    return normalize_text_replace_entries(state.get("entries")), int(state.get("version") or 1)


def set_book_replace_state(
    storage,
    book_id: str,
    entries: list[Any] | tuple[Any, ...] | None,
    *,
    bump_version: bool = True,
    normalize_text_replace_entries,
    base_prefix: str,
) -> dict[str, Any]:
    current = get_book_replace_state(storage, book_id, normalize_text_replace_entries=normalize_text_replace_entries, base_prefix=base_prefix)
    normalized_entries = normalize_text_replace_entries(entries if isinstance(entries, (list, tuple)) else current.get("entries"))
    for item in normalized_entries:
        if bool((item or {}).get("use_regex")):
            _validate_regex_or_raise(str((item or {}).get("source") or ""), "Regex sửa từ")
    next_version = int(current.get("version") or 1)
    if bump_version:
        next_version += 1
    state = {"entries": normalized_entries, "version": max(1, next_version)}
    storage._set_app_state_value(
        _book_replace_state_key(book_id, base_prefix=base_prefix),
        json.dumps(state, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
    )
    return state


def update_book_replace_entry(
    storage,
    book_id: str,
    source: str,
    target: str = "",
    *,
    delete: bool = False,
    use_regex: bool = False,
    ignore_case: bool = False,
    new_source: str = "",
    new_target: str = "",
    new_use_regex: bool | None = None,
    new_ignore_case: bool | None = None,
    normalize_newlines,
    normalize_text_replace_entries,
    base_prefix: str,
) -> dict[str, Any]:
    source_text = normalize_newlines(str(source or "")).strip()
    target_text = normalize_newlines(str(target or "")).strip()
    next_source_text = normalize_newlines(str(new_source or "")).strip()
    next_target_text = normalize_newlines(str(new_target or "")).strip()
    if not source_text and not next_source_text:
        raise ValueError("Thiếu từ gốc.")
    state = get_book_replace_state(storage, book_id, normalize_text_replace_entries=normalize_text_replace_entries, base_prefix=base_prefix)
    entries = normalize_text_replace_entries(state.get("entries"))
    source_regex = bool(use_regex)
    source_ignore_case = bool(ignore_case)
    target_source = next_source_text or source_text
    target_value = next_target_text if next_target_text else target_text
    target_regex = bool(source_regex if new_use_regex is None else new_use_regex)
    target_ignore_case = bool(source_ignore_case if new_ignore_case is None else new_ignore_case)
    if (not delete) and not target_source:
        raise ValueError("Thiếu từ gốc.")
    if (not delete) and not target_value:
        raise ValueError("Thiếu từ thay thế.")
    if target_regex:
        _validate_regex_or_raise(target_source, "Regex sửa từ")
    next_entries: list[dict[str, Any]] = []
    source_found = False
    for item in entries:
        item_source = str((item or {}).get("source") or "").strip()
        item_regex = bool((item or {}).get("use_regex"))
        item_ignore_case = bool((item or {}).get("ignore_case"))
        if item_source != source_text or item_regex != source_regex or item_ignore_case != source_ignore_case:
            next_entries.append(item)
            continue
        source_found = True
        if delete:
            continue
        candidate = {
            "source": target_source,
            "target": target_value,
            "use_regex": target_regex,
            "ignore_case": target_ignore_case,
        }
        if candidate not in next_entries:
            next_entries.append(candidate)
    if (not source_found) and (not delete):
        candidate = {
            "source": target_source,
            "target": target_value,
            "use_regex": target_regex,
            "ignore_case": target_ignore_case,
        }
        if candidate not in next_entries:
            next_entries.append(candidate)
    if next_entries == entries:
        return {"entries": entries, "version": int(state.get("version") or 1)}
    return set_book_replace_state(
        storage,
        book_id,
        next_entries,
        bump_version=True,
        normalize_text_replace_entries=normalize_text_replace_entries,
        base_prefix=base_prefix,
    )
