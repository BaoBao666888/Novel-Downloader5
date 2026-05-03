from __future__ import annotations

import time
from collections.abc import Callable
from pathlib import Path
from typing import Any

from reader_backend.exporting import support as export_support


def export_status_is_active(status: str) -> bool:
    return str(status or "").strip().lower() in {"queued", "running"}


def export_status_is_final(status: str) -> bool:
    return str(status or "").strip().lower() in {"completed", "failed"}


def resolve_export_job_file_path(job: dict[str, Any], *, export_dir: Path) -> Path | None:
    file_name = str(job.get("file_name") or "").strip()
    if not file_name:
        raw_path = str(job.get("output_path") or "").strip()
        if raw_path:
            file_name = Path(raw_path).name
    if not file_name:
        return None
    return export_dir / file_name


def build_export_job_state_payload(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "job_id": str(job.get("job_id") or ""),
        "status": str(job.get("status") or "queued"),
        "current_phase": str(job.get("current_phase") or ""),
        "current_index": int(job.get("current_index") or 0),
        "current_chapter_order": int(job.get("current_chapter_order") or 0),
        "current_title": str(job.get("current_title") or ""),
        "message": str(job.get("message") or ""),
        "book_id": str(job.get("book_id") or ""),
        "book_title": str(job.get("book_title") or ""),
        "format": str(job.get("format") or ""),
        "format_label": str(job.get("format_label") or ""),
        "translation_mode": str(job.get("translation_mode") or "server"),
        "metadata": dict(job.get("metadata") or {}),
        "options": dict(job.get("options") or {}),
        "chapter_ids": list(job.get("chapter_ids") or []),
        "total_chapters": int(job.get("total_chapters") or 0),
        "completed_chapters": int(job.get("completed_chapters") or 0),
        "translation_pending_chapters": int(job.get("translation_pending_chapters") or 0),
        "remaining_translation_chapters": int(job.get("remaining_translation_chapters") or 0),
        "progress": float(job.get("progress") or 0.0),
        "created_at": str(job.get("created_at") or ""),
        "updated_at": str(job.get("updated_at") or ""),
        "started_at": str(job.get("started_at") or ""),
        "finished_at": str(job.get("finished_at") or ""),
        "expires_at": str(job.get("expires_at") or ""),
        "output_path": str(job.get("output_path") or ""),
        "file_name": str(job.get("file_name") or ""),
        "file_size_bytes": int(job.get("file_size_bytes") or 0),
    }


def create_export_job(
    *,
    job_id: str,
    book_id: str,
    book_title: str,
    fmt: str,
    format_label: str,
    translation_mode: str,
    metadata: dict[str, Any],
    options: dict[str, Any],
    chapter_ids: list[str],
    translation_pending_chapters: int,
    created_at: str,
) -> dict[str, Any]:
    pending_count = max(0, int(translation_pending_chapters or 0)) if bool(options.get("use_translated_text")) else 0
    return {
        "job_id": str(job_id or "").strip(),
        "status": "queued",
        "current_phase": "queued",
        "current_index": 0,
        "current_chapter_order": 0,
        "current_title": "",
        "message": "Đã thêm vào hàng đợi xuất file.",
        "book_id": str(book_id or "").strip(),
        "book_title": str(book_title or "").strip(),
        "format": str(fmt or "").strip().lower(),
        "format_label": str(format_label or fmt or "").strip().upper(),
        "translation_mode": str(translation_mode or "server"),
        "metadata": dict(metadata or {}),
        "options": dict(options or {}),
        "chapter_ids": [str(item or "").strip() for item in chapter_ids if str(item or "").strip()],
        "total_chapters": int(len(chapter_ids)),
        "completed_chapters": 0,
        "translation_pending_chapters": int(pending_count),
        "remaining_translation_chapters": int(pending_count),
        "progress": 0.0,
        "created_at": str(created_at or ""),
        "updated_at": str(created_at or ""),
        "started_at": "",
        "finished_at": "",
        "expires_at": "",
        "output_path": "",
        "file_name": "",
        "file_size_bytes": 0,
    }


def mark_export_job_running(job: dict[str, Any], *, started_at: str) -> None:
    job["status"] = "running"
    job["current_phase"] = "prepare"
    job["current_index"] = 0
    job["current_chapter_order"] = 0
    job["current_title"] = ""
    job["message"] = "Đang khởi tạo job export..."
    job["progress"] = 0.0
    job["started_at"] = str(started_at or "")
    job["updated_at"] = str(started_at or "")


def apply_export_progress(job: dict[str, Any], *, event: dict[str, Any], updated_at: str) -> None:
    status = str(job.get("status") or "").strip().lower()
    if not export_status_is_active(status):
        return
    index = max(0, int(event.get("index") or 0))
    total = max(1, int(event.get("total") or job.get("total_chapters") or 1))
    chapter_order = int(event.get("chapter_order") or index or 0)
    chapter_title = str(event.get("title") or "").strip()
    phase = str(event.get("phase") or "").strip().lower()
    needs_translation = bool(event.get("needs_translation"))
    use_translated_text = bool((job.get("options") or {}).get("use_translated_text"))
    current_progress = max(0.0, min(1.0, float(job.get("progress") or 0.0)))
    if phase == "collect_start":
        job["current_phase"] = "collect"
        job["current_index"] = 0
        job["current_chapter_order"] = 0
        job["current_title"] = ""
        job["progress"] = max(current_progress, 0.02 if total > 0 else 0.05)
        if use_translated_text:
            job["message"] = f"Đang kiểm tra cache RAW và cache dịch của {int(job.get('total_chapters') or total)} chương..."
        else:
            job["message"] = f"Đang kiểm tra cache RAW của {int(job.get('total_chapters') or total)} chương..."
    elif phase == "chapter_start":
        job["current_phase"] = "translate" if needs_translation else "process"
        job["current_index"] = index
        job["current_chapter_order"] = chapter_order
        job["current_title"] = chapter_title
        chapter_progress = 0.55 if needs_translation else 0.35
        job["progress"] = max(current_progress, min(0.98, (max(0, index - 1) + chapter_progress) / total))
        if needs_translation:
            pending_total = max(0, int(job.get("translation_pending_chapters") or 0))
            pending_done = max(0, pending_total - int(job.get("remaining_translation_chapters") or 0))
            pending_next = min(pending_total, pending_done + 1) if pending_total > 0 else 0
            label = f"Đang dịch chương {index}/{total}"
            if chapter_title:
                label += f": {chapter_title}"
            if pending_total > 0:
                label += f" • Bổ sung dịch {pending_next}/{pending_total}"
            job["message"] = label
        else:
            if use_translated_text:
                label = f"Đang lấy cache dịch chương {index}/{total}"
            else:
                label = f"Đang lấy nội dung RAW chương {index}/{total}"
            if chapter_title:
                label += f": {chapter_title}"
            job["message"] = label
    elif phase == "chapter_done":
        done = min(total, max(int(job.get("completed_chapters") or 0), index))
        job["completed_chapters"] = done
        if needs_translation:
            remain = max(0, int(job.get("remaining_translation_chapters") or 0) - 1)
            job["remaining_translation_chapters"] = remain
        remain = max(0, int(job.get("remaining_translation_chapters") or 0))
        job["current_phase"] = "process"
        job["current_index"] = done
        job["current_chapter_order"] = chapter_order
        job["current_title"] = chapter_title
        job["progress"] = max(current_progress, float(done / total) if total > 0 else 1.0)
        pending_total = max(0, int(job.get("translation_pending_chapters") or 0))
        translated_done = max(0, pending_total - remain)
        if done >= total:
            job["message"] = "Đã xử lý xong toàn bộ chương. Đang tạo file..."
        else:
            if use_translated_text:
                if pending_total > 0:
                    job["message"] = (
                        f"Đã xong {done}/{total} chương. "
                        f"Đã dịch bổ sung {translated_done}/{pending_total} chương. Đang sang chương tiếp theo..."
                    )
                else:
                    job["message"] = f"Đã xong {done}/{total} chương từ cache dịch. Đang sang chương tiếp theo..."
            else:
                job["message"] = f"Đã xong {done}/{total} chương RAW. Đang sang chương tiếp theo..."
    elif phase == "packaging_start":
        job["current_phase"] = "packaging"
        job["current_index"] = int(job.get("completed_chapters") or total)
        job["current_chapter_order"] = 0
        job["current_title"] = ""
        fmt_label = str(event.get("format_label") or job.get("format_label") or job.get("format") or "").strip().upper()
        done = max(int(job.get("completed_chapters") or 0), total)
        pending_total = max(0, int(job.get("translation_pending_chapters") or 0))
        remain = max(0, int(job.get("remaining_translation_chapters") or 0))
        translated_done = max(0, pending_total - remain)
        job["completed_chapters"] = done
        job["progress"] = max(current_progress, 0.99 if total > 0 else 0.95)
        if use_translated_text and pending_total > 0:
            job["message"] = (
                f"Đã gom xong {done}/{total} chương. "
                f"Đã dịch bổ sung {translated_done}/{pending_total} chương. Đang tạo file {fmt_label}..."
            )
        elif use_translated_text:
            job["message"] = f"Đã gom xong {done}/{total} chương từ cache dịch. Đang tạo file {fmt_label}..."
        else:
            job["message"] = f"Đã gom xong {done}/{total} chương RAW. Đang tạo file {fmt_label}..."
    job["updated_at"] = str(updated_at or "")


def complete_export_job(
    job: dict[str, Any],
    *,
    output_path: Path,
    finished_at: str,
    expires_at: str,
    completed_chapters: int,
) -> None:
    job["status"] = "completed"
    job["current_phase"] = "completed"
    job["current_index"] = int(completed_chapters or 0)
    job["current_chapter_order"] = 0
    job["current_title"] = ""
    job["message"] = "Đã xuất xong. Nhấn Tải xuống để lấy file."
    job["progress"] = 1.0
    job["completed_chapters"] = int(completed_chapters or 0)
    job["remaining_translation_chapters"] = 0
    job["finished_at"] = str(finished_at or "")
    job["updated_at"] = str(finished_at or "")
    job["expires_at"] = str(expires_at or "")
    job["output_path"] = str(output_path)
    job["file_name"] = output_path.name
    try:
        job["file_size_bytes"] = int(output_path.stat().st_size)
    except Exception:
        job["file_size_bytes"] = 0


def fail_export_job(job: dict[str, Any], *, message: str, finished_at: str) -> None:
    job["status"] = "failed"
    job["current_phase"] = "failed"
    job["message"] = str(message or "Xuất file thất bại.")
    job["finished_at"] = str(finished_at or "")
    job["updated_at"] = str(finished_at or "")


def restore_export_jobs_state(
    loaded: list[dict[str, Any]],
    *,
    now_iso: str,
) -> tuple[dict[str, dict[str, Any]], bool]:
    jobs: dict[str, dict[str, Any]] = {}
    changed = False
    for item in loaded:
        if not isinstance(item, dict):
            continue
        job_id = str(item.get("job_id") or "").strip()
        if not job_id:
            continue
        job = dict(item)
        status = str(job.get("status") or "").strip().lower()
        if export_status_is_active(status):
            job["status"] = "failed"
            job["message"] = "Server đã khởi động lại trước khi export hoàn tất."
            job["updated_at"] = now_iso
            job["finished_at"] = now_iso
            changed = True
        jobs[job_id] = job
    return jobs, changed


def cleanup_export_jobs_state(
    jobs: dict[str, dict[str, Any]],
    queue: list[str],
    running_job_id: str | None,
    *,
    export_dir: Path,
    keep_days: int,
    parse_iso_ts: Callable[[Any], float],
    now_ts: float | None = None,
) -> tuple[bool, str | None]:
    current_ts = time.time() if now_ts is None else float(now_ts)
    keep_seconds = max(1, int(keep_days)) * 86400.0
    remove_ids: list[str] = []
    for job_id, job in jobs.items():
        status = str(job.get("status") or "").strip().lower()
        file_path = resolve_export_job_file_path(job, export_dir=export_dir)
        if status == "completed":
            if not file_path or (not file_path.exists()):
                remove_ids.append(job_id)
                continue
            expire_ts = parse_iso_ts(job.get("expires_at"))
            if expire_ts <= 0:
                finished_ts = parse_iso_ts(job.get("finished_at")) or parse_iso_ts(job.get("updated_at"))
                expire_ts = finished_ts + keep_seconds if finished_ts > 0 else 0.0
            if expire_ts > 0 and current_ts >= expire_ts:
                try:
                    file_path.unlink(missing_ok=True)
                except Exception:
                    pass
                remove_ids.append(job_id)
                continue
        elif status == "failed":
            updated_ts = parse_iso_ts(job.get("updated_at")) or parse_iso_ts(job.get("finished_at")) or parse_iso_ts(job.get("created_at"))
            if updated_ts > 0 and (current_ts - updated_ts) >= keep_seconds:
                remove_ids.append(job_id)
                continue
        elif export_status_is_active(status):
            continue

    if not remove_ids:
        return False, running_job_id

    remove_set = set(remove_ids)
    queue[:] = [job_id for job_id in queue if job_id not in remove_set]
    next_running_job_id = running_job_id
    for job_id in remove_ids:
        jobs.pop(job_id, None)
        if next_running_job_id == job_id:
            next_running_job_id = None
    return True, next_running_job_id


def serialize_export_job(
    job: dict[str, Any],
    *,
    export_dir: Path,
    quote_url_path: Callable[[str], str],
    queue_positions: dict[str, int] | None = None,
) -> dict[str, Any]:
    file_path = resolve_export_job_file_path(job, export_dir=export_dir)
    file_exists = bool(file_path and file_path.exists())
    file_name = str(job.get("file_name") or (file_path.name if file_path else "") or "")
    protection_view = export_support.build_export_job_protection_view(dict(job.get("options") or {}))
    payload = {
        "job_id": str(job.get("job_id") or ""),
        "status": str(job.get("status") or "queued"),
        "current_phase": str(job.get("current_phase") or ""),
        "current_index": int(job.get("current_index") or 0),
        "current_chapter_order": int(job.get("current_chapter_order") or 0),
        "current_title": str(job.get("current_title") or ""),
        "message": str(job.get("message") or ""),
        "book_id": str(job.get("book_id") or ""),
        "book_title": str(job.get("book_title") or ""),
        "format": str(job.get("format") or ""),
        "format_label": str(job.get("format_label") or ""),
        "translation_mode": str(job.get("translation_mode") or "server"),
        "use_translated_text": bool((job.get("options") or {}).get("use_translated_text")),
        "total_chapters": int(job.get("total_chapters") or 0),
        "completed_chapters": int(job.get("completed_chapters") or 0),
        "translation_pending_chapters": int(job.get("translation_pending_chapters") or 0),
        "remaining_translation_chapters": int(job.get("remaining_translation_chapters") or 0),
        "progress": float(job.get("progress") or 0.0),
        "created_at": str(job.get("created_at") or ""),
        "updated_at": str(job.get("updated_at") or ""),
        "started_at": str(job.get("started_at") or ""),
        "finished_at": str(job.get("finished_at") or ""),
        "expires_at": str(job.get("expires_at") or ""),
        "file_name": file_name,
        "download_url": f"/media/export/{quote_url_path(file_name)}" if file_exists and file_name else "",
        "file_exists": bool(file_exists),
        "file_size_bytes": int(job.get("file_size_bytes") or (file_path.stat().st_size if file_exists and file_path else 0)),
        "queue_position": 0,
        "protection": protection_view,
    }
    if queue_positions is not None and payload["status"] == "queued":
        payload["queue_position"] = int(queue_positions.get(payload["job_id"]) or 0)
    return payload


def build_export_jobs_signature(items: list[dict[str, Any]]) -> str:
    if not items:
        return "empty"
    rows: list[str] = []
    for job in items:
        rows.append(
            "|".join(
                [
                    str(job.get("job_id") or ""),
                    str(job.get("status") or ""),
                    str(int(job.get("completed_chapters") or 0)),
                    str(int(job.get("total_chapters") or 0)),
                    str(int(job.get("remaining_translation_chapters") or 0)),
                    str(int(job.get("queue_position") or 0)),
                    str(job.get("updated_at") or ""),
                    "1" if bool(job.get("file_exists")) else "0",
                    str(((job.get("protection") or {}).get("access_code") or "")),
                    str(int(((job.get("protection") or {}).get("access_code_expires_at_ts") or 0))),
                    "1" if bool((job.get("protection") or {}).get("enabled")) else "0",
                ]
            )
        )
    return "||".join(rows)


def build_export_jobs_listing(
    jobs: dict[str, dict[str, Any]],
    queue: list[str],
    *,
    export_dir: Path,
    book_id: str | None,
    parse_iso_ts: Callable[[Any], float],
    quote_url_path: Callable[[str], str],
    generated_at: str,
) -> dict[str, Any]:
    queue_positions = {job_id: idx + 1 for idx, job_id in enumerate(queue)}
    book_filter = str(book_id or "").strip()
    items: list[dict[str, Any]] = []
    for job in jobs.values():
        if book_filter and (str(job.get("book_id") or "").strip() != book_filter):
            continue
        items.append(
            serialize_export_job(
                job,
                export_dir=export_dir,
                quote_url_path=quote_url_path,
                queue_positions=queue_positions,
            )
        )
    items.sort(
        key=lambda item: (
            0 if item.get("status") == "running" else (1 if item.get("status") == "queued" else 2),
            int(item.get("queue_position") or 0) if item.get("status") == "queued" else 0,
            -(parse_iso_ts(item.get("updated_at")) or parse_iso_ts(item.get("created_at"))),
        )
    )
    return {
        "ok": True,
        "items": items,
        "count": len(items),
        "book_id": book_filter,
        "sig": build_export_jobs_signature(items),
        "generated_at": generated_at,
    }
