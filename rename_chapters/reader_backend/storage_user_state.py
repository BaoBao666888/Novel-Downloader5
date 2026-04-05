from __future__ import annotations

import json
from typing import Any


def _name_set_state_key(book_id: str | None, *, base_key: str) -> str:
    bid = str(book_id or "").strip()
    if not bid:
        return base_key
    return f"{base_key}.{bid}"


def _load_name_set_state_raw(storage, *, book_id: str | None, base_key: str) -> dict[str, Any] | None:
    raw = storage._get_app_state_value(_name_set_state_key(book_id, base_key=base_key))
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


def _persist_name_set_state(storage, state: dict[str, Any], *, book_id: str | None, base_key: str) -> None:
    storage._set_app_state_value(
        _name_set_state_key(book_id, base_key=base_key),
        json.dumps(state, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
    )


def get_name_set_state(
    storage,
    *,
    default_sets: dict[str, Any] | None = None,
    active_default: str | None = None,
    book_id: str | None = None,
    normalize_name_sets_collection,
    base_key: str,
) -> dict[str, Any]:
    raw_state = _load_name_set_state_raw(storage, book_id=book_id, base_key=base_key)
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
) -> dict[str, Any]:
    current = get_name_set_state(
        storage,
        book_id=book_id,
        normalize_name_sets_collection=normalize_name_sets_collection,
        base_key=base_key,
    )
    normalized_sets = normalize_name_sets_collection(sets if isinstance(sets, dict) else current.get("sets") or {})
    desired_active = str(active_set or current.get("active_set") or "").strip()
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
    _persist_name_set_state(storage, final_state, book_id=book_id, base_key=base_key)
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
    )


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


def get_global_junk_state(storage, *, state_key: str, normalize_junk_lines) -> dict[str, Any]:
    raw = storage._get_app_state_value(state_key)
    parsed: dict[str, Any] | None = None
    if raw:
        try:
            payload = json.loads(raw)
            if isinstance(payload, dict):
                parsed = payload
        except Exception:
            parsed = None
    lines = normalize_junk_lines((parsed or {}).get("lines"))
    try:
        version = max(1, int((parsed or {}).get("version") or 1))
    except Exception:
        version = 1
    state = {"lines": lines, "version": version}
    if parsed is None or normalize_junk_lines(parsed.get("lines")) != lines:
        storage._set_app_state_value(
            state_key,
            json.dumps(state, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
        )
    return state


def get_global_junk_lines(storage, *, state_key: str, normalize_junk_lines) -> tuple[list[str], int]:
    state = get_global_junk_state(storage, state_key=state_key, normalize_junk_lines=normalize_junk_lines)
    return normalize_junk_lines(state.get("lines")), int(state.get("version") or 1)


def set_global_junk_state(
    storage,
    lines: list[Any] | tuple[Any, ...] | None,
    *,
    bump_version: bool = True,
    state_key: str,
    normalize_junk_lines,
) -> dict[str, Any]:
    current = get_global_junk_state(storage, state_key=state_key, normalize_junk_lines=normalize_junk_lines)
    normalized_lines = normalize_junk_lines(lines if isinstance(lines, (list, tuple)) else current.get("lines"))
    next_version = int(current.get("version") or 1)
    if bump_version:
        next_version += 1
    state = {"lines": normalized_lines, "version": max(1, next_version)}
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
    state_key: str,
    normalize_newlines,
    normalize_junk_lines,
) -> dict[str, Any]:
    source_line = normalize_newlines(str(line or "")).strip()
    target_line = normalize_newlines(str(new_line or "")).strip()
    if not source_line and not target_line:
        raise ValueError("Thiếu dòng rác.")
    state = get_global_junk_state(storage, state_key=state_key, normalize_junk_lines=normalize_junk_lines)
    entries = normalize_junk_lines(state.get("lines"))
    next_entries: list[str] = []
    source_found = False
    for item in entries:
        if item != source_line:
            next_entries.append(item)
            continue
        source_found = True
        if delete or not target_line:
            continue
        if target_line not in next_entries:
            next_entries.append(target_line)
    if (not source_found) and (not delete) and target_line and target_line not in next_entries:
        next_entries.append(target_line)
    if next_entries == entries:
        return {"lines": entries, "version": int(state.get("version") or 1)}
    return set_global_junk_state(
        storage,
        next_entries,
        bump_version=True,
        state_key=state_key,
        normalize_junk_lines=normalize_junk_lines,
    )
