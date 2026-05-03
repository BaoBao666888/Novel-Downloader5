from __future__ import annotations

import threading
from collections.abc import Callable
from datetime import datetime
from typing import Any


def download_status_is_active(status: str) -> bool:
    return str(status or "").strip().lower() in {"queued", "running"}


def download_status_is_final(status: str) -> bool:
    return str(status or "").strip().lower() in {"completed", "stopped", "failed"}


def parse_download_job_ts(value: Any) -> float:
    raw = str(value or "").strip()
    if not raw:
        return 0.0
    try:
        if raw.endswith("Z"):
            raw = raw[:-1] + "+00:00"
        return float(datetime.fromisoformat(raw).timestamp())
    except Exception:
        return 0.0


def refresh_download_job_counts(
    job: dict[str, Any],
    *,
    get_book_download_map: Callable[..., dict[str, Any]],
) -> None:
    chapter_ids = [str(x or "").strip() for x in (job.get("chapter_ids") or []) if str(x or "").strip()]
    total = len(chapter_ids)
    downloaded = 0
    book_id = str(job.get("book_id") or "").strip()
    if book_id and chapter_ids:
        downloaded_map = get_book_download_map(book_id, chapter_ids=chapter_ids)
        downloaded = sum(1 for cid in chapter_ids if downloaded_map.get(cid))
    if downloaded < 0:
        downloaded = 0
    if downloaded > total:
        downloaded = total
    job["total_chapters"] = int(total)
    job["downloaded_chapters"] = int(downloaded)
    job["progress"] = float(downloaded / total) if total > 0 else 1.0


def serialize_download_job(
    job: dict[str, Any],
    *,
    queue_positions: dict[str, int] | None = None,
) -> dict[str, Any]:
    job_id = str(job.get("job_id") or "").strip()
    payload = {
        "job_id": job_id,
        "type": str(job.get("type") or "book"),
        "status": str(job.get("status") or "queued"),
        "message": str(job.get("message") or ""),
        "book_id": str(job.get("book_id") or ""),
        "book_title": str(job.get("book_title") or ""),
        "source_plugin": str(job.get("source_plugin") or ""),
        "source_type": str(job.get("source_type") or ""),
        "total_chapters": int(job.get("total_chapters") or 0),
        "downloaded_chapters": int(job.get("downloaded_chapters") or 0),
        "failed_chapters": int(job.get("failed_chapters") or 0),
        "progress": float(job.get("progress") or 0.0),
        "created_at": str(job.get("created_at") or ""),
        "updated_at": str(job.get("updated_at") or ""),
        "started_at": str(job.get("started_at") or ""),
        "finished_at": str(job.get("finished_at") or ""),
        "chapter_ids": list(job.get("chapter_ids") or []),
        "current_chapter_id": str(job.get("current_chapter_id") or ""),
        "queue_position": 0,
    }
    if queue_positions is not None and payload["status"] == "queued":
        payload["queue_position"] = int(queue_positions.get(job_id) or 0)
    return payload


def create_download_job(
    *,
    job_id: str,
    job_type: str,
    book_id: str,
    book_title: str,
    source_plugin: str,
    source_type: str,
    chapter_ids: list[str],
    message: str,
    created_at: str,
) -> dict[str, Any]:
    return {
        "job_id": str(job_id or "").strip(),
        "type": str(job_type or "book").strip() or "book",
        "status": "queued",
        "message": str(message or "Đang chờ tải."),
        "book_id": str(book_id or "").strip(),
        "book_title": str(book_title or "").strip(),
        "source_plugin": str(source_plugin or "").strip(),
        "source_type": str(source_type or "").strip(),
        "chapter_ids": [str(item or "").strip() for item in chapter_ids if str(item or "").strip()],
        "total_chapters": 0,
        "downloaded_chapters": 0,
        "failed_chapters": 0,
        "progress": 0.0,
        "created_at": str(created_at or ""),
        "updated_at": str(created_at or ""),
        "started_at": "",
        "finished_at": "",
        "current_chapter_id": "",
        "last_error": "",
        "_stop_event": threading.Event(),
    }


def mark_download_job_running(job: dict[str, Any], *, started_at: str) -> None:
    job["status"] = "running"
    job["started_at"] = str(started_at or "")
    job["updated_at"] = str(started_at or "")
    job["message"] = "Đang tải..."


def mark_download_job_preparing(job: dict[str, Any], *, updated_at: str) -> None:
    job["message"] = "Đang chuẩn bị tải chương..."
    job["updated_at"] = str(updated_at or "")


def mark_download_job_missing_book(job: dict[str, Any], *, updated_at: str) -> None:
    job["status"] = "failed"
    job["message"] = "Không tìm thấy truyện để tải."
    job["updated_at"] = str(updated_at or "")
    job["finished_at"] = str(updated_at or "")


def mark_download_job_no_valid_chapters(job: dict[str, Any], *, updated_at: str) -> None:
    job["status"] = "failed"
    job["message"] = "Job không còn chương hợp lệ để tải."
    job["updated_at"] = str(updated_at or "")
    job["finished_at"] = str(updated_at or "")


def mark_download_job_all_cached(job: dict[str, Any], *, updated_at: str) -> None:
    job["status"] = "completed"
    job["message"] = "Tất cả chương đã có cache."
    job["updated_at"] = str(updated_at or "")
    job["finished_at"] = str(updated_at or "")


def set_download_chapter_progress(
    job: dict[str, Any],
    *,
    chapter_id: str,
    chapter_order: int,
    retry_index: int,
    updated_at: str,
) -> None:
    status = str(job.get("status") or "").strip().lower()
    if download_status_is_final(status):
        return
    retry_no = max(0, int(retry_index or 0))
    prefix = f"[{retry_no}] " if retry_no > 0 else ""
    job["current_chapter_id"] = str(chapter_id or "").strip()
    job["message"] = f"{prefix}Đang tải chương {int(chapter_order or 0)}..."
    job["updated_at"] = str(updated_at or "")


def request_stop_download_job(job: dict[str, Any], *, updated_at: str) -> None:
    status = str(job.get("status") or "").strip().lower()
    if status == "queued":
        job["status"] = "stopped"
        job["message"] = "Đã dừng job đang chờ."
        job["finished_at"] = str(updated_at or "")
        job["updated_at"] = str(updated_at or "")
    elif status == "running":
        job["message"] = "Đang dừng job..."
        job["updated_at"] = str(updated_at or "")


def finalize_download_job(
    job: dict[str, Any],
    *,
    updated_at: str,
    downloaded_chapters: int,
    total_chapters: int,
    failed_chapters: int,
    stopped: bool,
) -> None:
    if stopped:
        job["status"] = "stopped"
        job["message"] = "Đã dừng tải."
    elif int(downloaded_chapters or 0) >= int(total_chapters or 0):
        job["status"] = "completed"
        if int(failed_chapters or 0) > 0:
            job["message"] = f"Hoàn tất với {int(failed_chapters)} chương lỗi."
        else:
            job["message"] = "Đã tải xong."
    elif int(failed_chapters or 0) > 0:
        job["status"] = "failed"
        job["message"] = str(job.get("last_error") or f"Tải lỗi {int(failed_chapters)} chương.")
    else:
        job["status"] = "completed"
        job["message"] = "Đã tải xong."
    job["updated_at"] = str(updated_at or "")
    job["finished_at"] = str(updated_at or "")
    job["current_chapter_id"] = ""


def fail_download_job(job: dict[str, Any], *, message: str, updated_at: str) -> None:
    job["status"] = "failed"
    job["message"] = str(message or "Lỗi tải chương.")
    job["updated_at"] = str(updated_at or "")
    job["finished_at"] = str(updated_at or "")


def cleanup_download_jobs_state(
    jobs: dict[str, dict[str, Any]],
    queue: list[str],
    running_job_id: str | None,
    *,
    parse_ts: Callable[[Any], float],
    now_ts: float,
    keep_seconds: float = 180.0,
) -> tuple[bool, str | None]:
    remove_ids: list[str] = []
    for job_id, job in jobs.items():
        status = str(job.get("status") or "")
        if not download_status_is_final(status):
            continue
        updated_ts = parse_ts(job.get("updated_at"))
        if updated_ts <= 0:
            updated_ts = parse_ts(job.get("created_at"))
        if updated_ts <= 0:
            updated_ts = now_ts
        if (now_ts - updated_ts) >= keep_seconds:
            remove_ids.append(job_id)
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


def build_download_jobs_signature(items: list[dict[str, Any]]) -> str:
    if not items:
        return "empty"
    rows: list[str] = []
    for job in items:
        rows.append(
            "|".join(
                [
                    str(job.get("job_id") or ""),
                    str(job.get("status") or ""),
                    str(int(job.get("downloaded_chapters") or 0)),
                    str(int(job.get("total_chapters") or 0)),
                    str(int(job.get("queue_position") or 0)),
                    str(job.get("current_chapter_id") or ""),
                    str(job.get("updated_at") or ""),
                ]
            )
        )
    return "||".join(rows)


def build_download_jobs_listing(
    jobs: dict[str, dict[str, Any]],
    queue: list[str],
    *,
    refresh_job_counts: Callable[[dict[str, Any]], None],
    active_only: bool,
    book_id: str | None,
    generated_at: str,
) -> dict[str, Any]:
    queue_positions = {job_id: idx + 1 for idx, job_id in enumerate(queue)}
    book_filter = str(book_id or "").strip()
    items: list[dict[str, Any]] = []
    for job in jobs.values():
        status = str(job.get("status") or "").strip().lower()
        if active_only and (not download_status_is_active(status)):
            continue
        if book_filter and (str(job.get("book_id") or "").strip() != book_filter):
            continue
        refresh_job_counts(job)
        items.append(serialize_download_job(job, queue_positions=queue_positions))
    items.sort(
        key=lambda item: (
            0 if item.get("status") == "running" else (1 if item.get("status") == "queued" else 2),
            int(item.get("queue_position") or 0) if item.get("status") == "queued" else 0,
            item.get("created_at") or "",
        )
    )
    return {
        "ok": True,
        "items": items,
        "count": len(items),
        "active_only": bool(active_only),
        "book_id": book_filter,
        "sig": build_download_jobs_signature(items),
        "generated_at": generated_at,
    }


def pick_download_chapters_by_range(
    chapter_rows: list[dict[str, Any]],
    *,
    chapter_ids: list[str] | None = None,
    start_order: int | None = None,
    end_order: int | None = None,
) -> list[str]:
    if not chapter_rows:
        return []
    if isinstance(chapter_ids, list) and chapter_ids:
        wanted = {str(item or "").strip() for item in chapter_ids if str(item or "").strip()}
        out = [str(row.get("chapter_id") or "").strip() for row in chapter_rows if str(row.get("chapter_id") or "").strip() in wanted]
        return [item for item in out if item]

    total = len(chapter_rows)
    start = int(start_order) if isinstance(start_order, int) else 1
    end = int(end_order) if isinstance(end_order, int) else total
    if start < 1:
        start = 1
    if end < 1:
        end = 1
    if end > total:
        end = total
    if start > end:
        start, end = end, start
    out: list[str] = []
    for row in chapter_rows:
        try:
            order = int(row.get("chapter_order") or 0)
        except Exception:
            order = 0
        if order < start or order > end:
            continue
        chapter_id = str(row.get("chapter_id") or "").strip()
        if chapter_id:
            out.append(chapter_id)
    return out


def find_active_download_job(
    jobs: dict[str, dict[str, Any]],
    *,
    book_id: str,
    chapter_ids: list[str],
    refresh_job_counts: Callable[[dict[str, Any]], None],
) -> dict[str, Any] | None:
    target_ids = {str(item or "").strip() for item in chapter_ids if str(item or "").strip()}
    if not target_ids:
        return None
    for job in jobs.values():
        status = str(job.get("status") or "").strip().lower()
        if not download_status_is_active(status):
            continue
        if str(job.get("book_id") or "").strip() != str(book_id or "").strip():
            continue
        existing_ids = {str(item or "").strip() for item in (job.get("chapter_ids") or []) if str(item or "").strip()}
        if target_ids.issubset(existing_ids):
            refresh_job_counts(job)
            return job
    return None
