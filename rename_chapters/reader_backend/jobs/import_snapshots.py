from __future__ import annotations

import json
import time
from collections.abc import Callable
from pathlib import Path
from typing import Any

from reader_backend.core.common import hash_text


def import_snapshot_root(local_dir: Path) -> Path:
    root = local_dir / "reader_import_jobs"
    root.mkdir(parents=True, exist_ok=True)
    return root


def import_snapshot_path(snapshot_id: str, *, local_dir: Path) -> Path:
    sid = str(snapshot_id or "").strip() or "default"
    return import_snapshot_root(local_dir) / f"{hash_text(sid)}.json"


def cleanup_import_job_snapshots(
    *,
    local_dir: Path,
    max_age_days: int,
) -> None:
    root = import_snapshot_root(local_dir)
    cutoff = time.time() - max(1, int(max_age_days or 1)) * 86400
    for path in root.glob("*.json"):
        try:
            if path.stat().st_mtime >= cutoff:
                continue
            path.unlink(missing_ok=True)
        except Exception:
            continue


def build_import_job_snapshot_payload(
    job: dict[str, Any],
    *,
    normalize_item: Callable[..., dict[str, Any]],
    normalize_display_text: Callable[..., str],
) -> dict[str, Any] | None:
    snapshot_id = str(job.get("snapshot_id") or "").strip()
    if not snapshot_id:
        return None
    return {
        "snapshot_id": snapshot_id,
        "job_id": str(job.get("job_id") or "").strip(),
        "notification_id": str(job.get("notification_id") or "").strip(),
        "kind": str(job.get("kind") or "").strip(),
        "title": str(job.get("title") or "").strip(),
        "status": str(job.get("status") or "").strip().lower(),
        "phase": str(job.get("phase") or "").strip().lower(),
        "category_ids": [
            str(item or "").strip()
            for item in (job.get("category_ids") or [])
            if str(item or "").strip()
        ],
        "category_names": [
            normalize_display_text(str(item or ""), single_line=True)
            for item in (job.get("category_names") or [])
            if str(item or "").strip()
        ],
        "category_assign_error": str(job.get("category_assign_error") or "").strip(),
        "current_file": str(job.get("current_file") or "").strip(),
        "current_stage": str(job.get("current_stage") or "").strip(),
        "current_detail": str(job.get("current_detail") or "").strip(),
        "created_at": str(job.get("created_at") or ""),
        "updated_at": str(job.get("updated_at") or ""),
        "started_at": str(job.get("started_at") or ""),
        "finished_at": str(job.get("finished_at") or ""),
        "items": [
            normalize_item(item, fallback_idx=idx)
            for idx, item in enumerate(job.get("items") or [])
            if isinstance(item, dict) and str(item.get("token") or "").strip()
        ],
    }


def persist_import_job_snapshot(
    job: dict[str, Any],
    *,
    local_dir: Path,
    normalize_item: Callable[..., dict[str, Any]],
    normalize_display_text: Callable[..., str],
) -> None:
    payload = build_import_job_snapshot_payload(
        job,
        normalize_item=normalize_item,
        normalize_display_text=normalize_display_text,
    )
    if payload is None:
        return
    try:
        import_snapshot_path(str(payload.get("snapshot_id") or ""), local_dir=local_dir).write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except Exception:
        pass


def load_import_job_snapshot(
    snapshot_id: str,
    *,
    local_dir: Path,
    normalize_item: Callable[..., dict[str, Any]],
    recount_job: Callable[[dict[str, Any]], None],
) -> dict[str, Any] | None:
    sid = str(snapshot_id or "").strip()
    if not sid:
        return None
    path = import_snapshot_path(sid, local_dir=local_dir)
    if not path.exists():
        return None
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None
    if not isinstance(raw, dict):
        return None
    raw["snapshot_id"] = sid
    raw["items"] = [
        normalize_item(item, fallback_idx=idx)
        for idx, item in enumerate(raw.get("items") or [])
        if isinstance(item, dict) and str(item.get("token") or "").strip()
    ]
    recount_job(raw)
    return raw


def import_status_is_active(status: str) -> bool:
    return str(status or "").strip().lower() in {"queued", "running", "importing", "finishing"}
