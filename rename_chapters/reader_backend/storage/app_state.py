"""Helpers for key-value application state stored in SQLite."""

from __future__ import annotations

import json
import sqlite3
import time
from collections.abc import Callable
from typing import Any


def get_value(storage: Any, key: str) -> str | None:
    with storage._connect() as conn:
        row = conn.execute("SELECT value FROM app_state WHERE key = ?", (key,)).fetchone()
    if row and row["value"] is not None:
        return str(row["value"])
    return None


def set_value(storage: Any, key: str, value: str, *, utc_now_iso: Callable[[], str]) -> None:
    now = utc_now_iso()
    attempts = 4
    for attempt in range(attempts):
        try:
            with storage._connect() as conn:
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
            return
        except sqlite3.OperationalError as exc:
            if "locked" not in str(exc).lower() or attempt >= attempts - 1:
                raise
            time.sleep(0.12 * (attempt + 1))


def delete_value(storage: Any, key: str) -> None:
    key_name = str(key or "").strip()
    if not key_name:
        return
    attempts = 4
    for attempt in range(attempts):
        try:
            with storage._connect() as conn:
                conn.execute("DELETE FROM app_state WHERE key = ?", (key_name,))
            return
        except sqlite3.OperationalError as exc:
            if "locked" not in str(exc).lower() or attempt >= attempts - 1:
                raise
            time.sleep(0.12 * (attempt + 1))


def chapter_raw_edit_state_key(chapter_id: str, *, prefix: str) -> str:
    cid = str(chapter_id or "").strip()
    return f"{prefix}.{cid}" if cid else prefix


def get_chapter_raw_edit_state(storage: Any, chapter_id: str, *, prefix: str) -> dict[str, Any]:
    empty = {"edited": False, "updated_at": "", "source": ""}
    cid = str(chapter_id or "").strip()
    if not cid:
        return dict(empty)
    raw = storage._get_app_state_value(chapter_raw_edit_state_key(cid, prefix=prefix))
    if not raw:
        return dict(empty)
    try:
        payload = json.loads(raw)
    except Exception:
        payload = {}
    if not isinstance(payload, dict):
        return dict(empty)
    return {
        "edited": bool(payload.get("edited")),
        "updated_at": str(payload.get("updated_at") or ""),
        "source": str(payload.get("source") or ""),
    }


def set_chapter_raw_edit_state(
    storage: Any,
    chapter_id: str,
    *,
    edited: bool,
    source: str = "",
    prefix: str,
    utc_now_iso: Callable[[], str],
) -> dict[str, Any]:
    empty = {"edited": False, "updated_at": "", "source": ""}
    cid = str(chapter_id or "").strip()
    if not cid:
        return dict(empty)
    key = chapter_raw_edit_state_key(cid, prefix=prefix)
    if not edited:
        storage._delete_app_state_value(key)
        return dict(empty)
    payload = {
        "edited": True,
        "updated_at": utc_now_iso(),
        "source": str(source or "").strip() or "manual",
    }
    storage._set_app_state_value(key, json.dumps(payload, ensure_ascii=False))
    return payload


def load_json_list(storage: Any, state_key: str) -> list[dict[str, Any]]:
    raw = storage._get_app_state_value(state_key)
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except Exception:
        return []
    if not isinstance(data, list):
        return []
    out: list[dict[str, Any]] = []
    for item in data:
        if isinstance(item, dict):
            out.append(dict(item))
    return out


def save_json_list(storage: Any, state_key: str, items: list[dict[str, Any]]) -> None:
    payload = []
    for item in items or []:
        if isinstance(item, dict):
            payload.append(dict(item))
    storage._set_app_state_value(
        state_key,
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
    )


def get_theme_active(storage: Any, *, state_key: str, default_theme_id: str = "sao_dem") -> str:
    value = storage._get_app_state_value(state_key)
    return str(value or "").strip() or default_theme_id


def set_theme_active(
    storage: Any,
    theme_id: str,
    *,
    state_key: str,
    default_theme_id: str = "sao_dem",
) -> None:
    storage._set_app_state_value(state_key, str(theme_id or "").strip() or default_theme_id)
