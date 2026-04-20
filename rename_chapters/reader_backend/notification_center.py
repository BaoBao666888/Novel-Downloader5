from __future__ import annotations

import hashlib
import json
from datetime import datetime
from typing import Any


NOTIFICATION_RETENTION_DAYS = 30
ACTIVE_NOTIFICATION_STATUSES = {"queued", "running", "active", "progress"}


def parse_notification_ts(value: Any) -> float:
    raw = str(value or "").strip()
    if not raw:
        return 0.0
    try:
        if raw.endswith("Z"):
            raw = raw[:-1] + "+00:00"
        return float(datetime.fromisoformat(raw).timestamp())
    except Exception:
        return 0.0


def normalize_notification_status(value: Any) -> str:
    raw = str(value or "").strip().lower()
    if raw in {"queued", "running", "active", "progress"}:
        return "running"
    if raw in {"success", "completed", "done"}:
        return "success"
    if raw in {"failed", "error"}:
        return "failed"
    if raw in {"warning", "stopped", "cancelled", "canceled"}:
        return "warning"
    if raw in {"info", "read"}:
        return "info"
    return "info"


def notification_status_is_active(status: Any) -> bool:
    return normalize_notification_status(status) in ACTIVE_NOTIFICATION_STATUSES


def normalize_notification_ids(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, (str, bytes)):
        items = [value]
    elif isinstance(value, list | tuple | set):
        items = list(value)
    else:
        items = [value]
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        item_id = str(item or "").strip()
        if not item_id or item_id in seen:
            continue
        seen.add(item_id)
        out.append(item_id)
    return out


def _normalize_plain_text(value: Any) -> str:
    return str(value or "").strip()


def _normalize_meta_dict(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        return {}
    out: dict[str, Any] = {}
    for key, raw in value.items():
        key_text = str(key or "").strip()
        if not key_text:
            continue
        if isinstance(raw, (str, int, float, bool)) or raw is None:
            out[key_text] = raw
            continue
        out[key_text] = str(raw)
    return out


def _normalize_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(int(value))
    text = str(value or "").strip().lower()
    if not text:
        return bool(default)
    if text in {"1", "true", "yes", "on", "enable", "enabled"}:
        return True
    if text in {"0", "false", "no", "off", "disable", "disabled"}:
        return False
    return bool(default)


def _normalize_int(value: Any, default: int = 0, *, minimum: int | None = None, maximum: int | None = None) -> int:
    try:
        parsed = int(value if value is not None else default)
    except Exception:
        parsed = int(default)
    if minimum is not None:
        parsed = max(minimum, parsed)
    if maximum is not None:
        parsed = min(maximum, parsed)
    return parsed


def normalize_notification_record(
    raw: dict[str, Any] | None,
    *,
    now_iso: str,
    existing: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    if not isinstance(raw, dict):
        return None

    notif_id = _normalize_plain_text(raw.get("id") or raw.get("notification_id"))
    if not notif_id:
        return None

    prev = existing if isinstance(existing, dict) else {}
    status = normalize_notification_status(raw.get("status") or raw.get("state") or prev.get("status"))
    created_at = _normalize_plain_text(raw.get("created_at") or prev.get("created_at") or now_iso)
    updated_at = _normalize_plain_text(raw.get("updated_at") or now_iso or prev.get("updated_at") or created_at)

    if "read" in raw and isinstance(raw.get("read"), bool):
        read = bool(raw.get("read"))
    elif prev:
        prev_active = notification_status_is_active(prev.get("status"))
        if notification_status_is_active(status):
            read = bool(prev.get("read"))
        elif prev_active and (not notification_status_is_active(status)):
            read = False
        else:
            read = bool(prev.get("read"))
    else:
        read = notification_status_is_active(status)

    read_at = _normalize_plain_text(raw.get("read_at") or prev.get("read_at"))
    if read:
        if not read_at:
            read_at = updated_at or now_iso
    else:
        read_at = ""

    progress_current = int(raw.get("progress_current") or prev.get("progress_current") or 0)
    progress_total = int(raw.get("progress_total") or prev.get("progress_total") or 0)
    progress_percent_raw = raw.get("progress_percent")
    if progress_percent_raw is None:
        progress_percent_raw = prev.get("progress_percent")
    if progress_percent_raw is None and progress_total > 0:
        progress_percent = max(0.0, min(100.0, (progress_current / float(progress_total)) * 100.0))
    else:
        try:
            progress_percent = max(0.0, min(100.0, float(progress_percent_raw or 0.0)))
        except Exception:
            progress_percent = 0.0

    item = {
        "id": notif_id,
        "kind": _normalize_plain_text(raw.get("kind") or prev.get("kind") or "info"),
        "topic": _normalize_plain_text(raw.get("topic") or prev.get("topic") or ""),
        "topic_label": _normalize_plain_text(raw.get("topic_label") or prev.get("topic_label") or ""),
        "title": _normalize_plain_text(raw.get("title") or prev.get("title") or ""),
        "preview": _normalize_plain_text(raw.get("preview") or raw.get("message") or prev.get("preview") or ""),
        "detail": str(raw.get("detail") or prev.get("detail") or "").strip(),
        "status": status,
        "read": bool(read),
        "read_at": read_at,
        "created_at": created_at,
        "updated_at": updated_at,
        "progress_current": max(0, progress_current),
        "progress_total": max(0, progress_total),
        "progress_percent": progress_percent,
        "book_id": _normalize_plain_text(raw.get("book_id") or prev.get("book_id") or ""),
        "book_title": _normalize_plain_text(raw.get("book_title") or prev.get("book_title") or ""),
        "job_id": _normalize_plain_text(raw.get("job_id") or prev.get("job_id") or ""),
        "pinned": _normalize_bool(raw.get("pinned") if "pinned" in raw else prev.get("pinned"), False),
        "pin_order": _normalize_int(raw.get("pin_order") if "pin_order" in raw else prev.get("pin_order"), 999, minimum=0, maximum=999999),
        "allow_delete": _normalize_bool(raw.get("allow_delete") if "allow_delete" in raw else prev.get("allow_delete"), True),
        "allow_clear": _normalize_bool(raw.get("allow_clear") if "allow_clear" in raw else prev.get("allow_clear"), True),
        "retain_days": _normalize_int(raw.get("retain_days") if "retain_days" in raw else prev.get("retain_days"), NOTIFICATION_RETENTION_DAYS),
        "meta": _normalize_meta_dict(raw.get("meta") if "meta" in raw else prev.get("meta")),
    }
    return item


def restore_notification_records(
    loaded: list[dict[str, Any]] | None,
    *,
    now_iso: str,
) -> tuple[dict[str, dict[str, Any]], bool]:
    out: dict[str, dict[str, Any]] = {}
    changed = False
    for row in loaded or []:
        item = normalize_notification_record(row, now_iso=now_iso, existing=None)
        if item is None:
            changed = True
            continue
        if notification_status_is_active(item.get("status")):
            item["status"] = "warning"
            item["read"] = False
            item["read_at"] = ""
            item["updated_at"] = now_iso
            preview = _normalize_plain_text(item.get("preview"))
            item["preview"] = preview or "Tiến trình trước đó đã bị gián đoạn vì reader server khởi động lại."
            detail = str(item.get("detail") or "").strip()
            message = "Reader server đã khởi động lại trước khi tiến trình này hoàn tất."
            item["detail"] = f"{message}\n\n{detail}".strip() if detail else message
            changed = True
        out[item["id"]] = item
    return out, changed


def cleanup_notification_records(
    records: dict[str, dict[str, Any]],
    *,
    now_ts: float,
    keep_days: int = NOTIFICATION_RETENTION_DAYS,
) -> bool:
    if not records:
        return False
    remove_ids: list[str] = []
    for notif_id, item in records.items():
        retain_days = _normalize_int(item.get("retain_days"), keep_days)
        if retain_days <= 0:
            continue
        created_ts = parse_notification_ts(item.get("created_at"))
        if created_ts <= 0:
            created_ts = parse_notification_ts(item.get("updated_at"))
        if created_ts <= 0:
            created_ts = now_ts
        keep_seconds = max(1, retain_days) * 86400.0
        if (now_ts - created_ts) >= keep_seconds:
            remove_ids.append(notif_id)
    if not remove_ids:
        return False
    for notif_id in remove_ids:
        records.pop(notif_id, None)
    return True


def notification_sort_key(item: dict[str, Any]) -> tuple[int, int, float, float, str]:
    pinned = 0 if _normalize_bool(item.get("pinned"), False) else 1
    pin_order = _normalize_int(item.get("pin_order"), 999, minimum=0, maximum=999999)
    updated_ts = parse_notification_ts(item.get("updated_at"))
    created_ts = parse_notification_ts(item.get("created_at"))
    notif_id = str(item.get("id") or "")
    return (pinned, pin_order, -updated_ts, -created_ts, notif_id)


def build_notifications_signature(items: list[dict[str, Any]]) -> str:
    if not items:
        return "empty"
    payload = [
        {
            "id": str(item.get("id") or ""),
            "status": str(item.get("status") or ""),
            "updated_at": str(item.get("updated_at") or ""),
            "read": bool(item.get("read")),
            "read_at": str(item.get("read_at") or ""),
            "progress_current": int(item.get("progress_current") or 0),
            "progress_total": int(item.get("progress_total") or 0),
            "preview": str(item.get("preview") or ""),
            "pinned": bool(item.get("pinned")),
            "pin_order": int(item.get("pin_order") or 0),
        }
        for item in items
    ]
    blob = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha1(blob.encode("utf-8", errors="ignore")).hexdigest()


def build_notifications_listing(
    records: dict[str, dict[str, Any]],
    *,
    limit: int = 120,
    generated_at: str = "",
) -> dict[str, Any]:
    items = [dict(item) for item in records.values() if isinstance(item, dict)]
    items.sort(key=notification_sort_key)
    max_items = max(1, min(300, int(limit or 120)))
    limited = items[:max_items]
    unread_count = sum(1 for item in items if not bool(item.get("read")))
    active_count = sum(1 for item in items if notification_status_is_active(item.get("status")))
    sig = f"{build_notifications_signature(limited)}:{len(items)}:{int(unread_count)}:{int(active_count)}"
    return {
        "ok": True,
        "items": limited,
        "count": len(items),
        "unread_count": int(unread_count),
        "active_count": int(active_count),
        "sig": sig,
        "generated_at": str(generated_at or ""),
    }
