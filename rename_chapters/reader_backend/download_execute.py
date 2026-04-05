from __future__ import annotations

from collections.abc import Callable
from typing import Any


def build_download_job_context(
    job: dict[str, Any],
    *,
    find_book: Callable[[str], dict[str, Any] | None],
    get_chapter_rows: Callable[[str], list[dict[str, Any]]],
    resolve_runtime_plan: Callable[[dict[str, Any]], dict[str, Any]],
    ensure_stop_event: Callable[[dict[str, Any]], Any],
    chapter_cache_available: Callable[[dict[str, Any], dict[str, Any]], bool],
) -> dict[str, Any]:
    book_id = str(job.get("book_id") or "").strip()
    book = find_book(book_id)
    if not book:
        raise LookupError("Không tìm thấy truyện để tải.")

    chapter_rows = {str(row.get("chapter_id") or "").strip(): row for row in get_chapter_rows(book_id)}
    chapter_ids = [str(item or "").strip() for item in (job.get("chapter_ids") or []) if str(item or "").strip()]
    selected_rows = [chapter_rows[chapter_id] for chapter_id in chapter_ids if chapter_id in chapter_rows]
    if not selected_rows:
        raise ValueError("Job không còn chương hợp lệ để tải.")

    runtime_plan = resolve_runtime_plan(book)
    stop_event = ensure_stop_event(job)
    pending_rows = [row for row in selected_rows if not chapter_cache_available(row, book)]
    return {
        "book": book,
        "selected_rows": selected_rows,
        "pending_rows": pending_rows,
        "stop_event": stop_event,
        "runtime_plan": runtime_plan,
    }
