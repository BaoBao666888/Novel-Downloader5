from __future__ import annotations

from collections.abc import Callable
from typing import Any


def build_download_notification_payload(
    job: dict[str, Any],
    *,
    notification_status_label: Callable[[str], str],
    normalize_display_text: Callable[..., str],
) -> dict[str, Any] | None:
    job_id = str(job.get("job_id") or "").strip()
    if not job_id:
        return None
    status = str(job.get("status") or "").strip().lower()
    kind = str(job.get("type") or "book").strip().lower() or "book"
    book_title = normalize_display_text(str(job.get("book_title") or ""), single_line=True) or "Truyện"
    total = max(0, int(job.get("total_chapters") or 0))
    if total <= 0:
        total = len([x for x in (job.get("chapter_ids") or []) if str(x or "").strip()])
    if kind == "chapter" and total <= 0:
        total = 1
    downloaded = max(0, int(job.get("downloaded_chapters") or 0))
    failed = max(0, int(job.get("failed_chapters") or 0))
    progress_current = min(total, max(downloaded + failed, downloaded))
    preview = str(job.get("message") or "").strip()
    topic_label = "Tải truyện" if kind == "book" else "Tải chương"
    source_bits = [str(job.get("source_plugin") or "").strip(), str(job.get("source_type") or "").strip()]
    source_text = " • ".join([bit for bit in source_bits if bit])
    detail_lines = [
        f"Truyện: {book_title}",
        f"Trạng thái: {notification_status_label(status)}",
    ]
    if total > 0:
        detail_lines.append(f"Tiến độ: {downloaded}/{total} chương")
    if failed > 0:
        detail_lines.append(f"Chương lỗi: {failed}")
    if source_text:
        detail_lines.append(f"Nguồn: {source_text}")
    if preview:
        detail_lines.append(f"Thông điệp: {preview}")
    mapped_status = {
        "queued": "running",
        "running": "running",
        "completed": "success",
        "failed": "failed",
        "stopped": "warning",
    }.get(status, "info")
    return {
        "id": f"download:{job_id}",
        "kind": "download",
        "topic": "download",
        "topic_label": topic_label,
        "title": f"{topic_label}: {book_title}",
        "preview": preview or f"Đã xử lý {downloaded}/{total} chương.",
        "detail": "\n".join(detail_lines).strip(),
        "status": mapped_status,
        "progress_current": progress_current,
        "progress_total": total,
        "progress_percent": float(job.get("progress") or 0.0) * 100.0,
        "book_id": str(job.get("book_id") or "").strip(),
        "book_title": book_title,
        "job_id": job_id,
        "created_at": str(job.get("created_at") or ""),
        "updated_at": str(job.get("updated_at") or ""),
        "meta": {"job_type": kind},
    }


def build_export_notification_payload(
    job: dict[str, Any],
    *,
    notification_status_label: Callable[[str], str],
    normalize_display_text: Callable[..., str],
) -> dict[str, Any] | None:
    job_id = str(job.get("job_id") or "").strip()
    if not job_id:
        return None
    status = str(job.get("status") or "").strip().lower()
    book_title = normalize_display_text(str(job.get("book_title") or ""), single_line=True) or "Truyện"
    format_label = str(job.get("format_label") or job.get("format") or "FILE").strip().upper()
    total = max(0, int(job.get("total_chapters") or 0))
    completed = max(0, int(job.get("completed_chapters") or 0))
    pending_translate = max(0, int(job.get("translation_pending_chapters") or 0))
    remain_translate = max(0, int(job.get("remaining_translation_chapters") or 0))
    preview = str(job.get("message") or "").strip()
    detail_lines = [
        f"Truyện: {book_title}",
        f"Định dạng: {format_label}",
        f"Trạng thái: {notification_status_label(status)}",
    ]
    if total > 0:
        detail_lines.append(f"Tiến độ: {completed}/{total} chương")
    if pending_translate > 0:
        detail_lines.append(f"Dịch bổ sung: {pending_translate - remain_translate}/{pending_translate} chương")
    file_name = str(job.get("file_name") or "").strip()
    if file_name:
        detail_lines.append(f"File tạo ra: {file_name}")
    if preview:
        detail_lines.append(f"Thông điệp: {preview}")
    mapped_status = {
        "queued": "running",
        "running": "running",
        "completed": "success",
        "failed": "failed",
    }.get(status, "info")
    return {
        "id": f"export:{job_id}",
        "kind": "export",
        "topic": "export",
        "topic_label": "Xuất file",
        "title": f"Xuất {format_label}: {book_title}",
        "preview": preview or f"Đã xử lý {completed}/{total} chương.",
        "detail": "\n".join(detail_lines).strip(),
        "status": mapped_status,
        "progress_current": completed,
        "progress_total": total,
        "progress_percent": float(job.get("progress") or 0.0) * 100.0,
        "book_id": str(job.get("book_id") or "").strip(),
        "book_title": book_title,
        "job_id": job_id,
        "created_at": str(job.get("created_at") or ""),
        "updated_at": str(job.get("updated_at") or ""),
    }
