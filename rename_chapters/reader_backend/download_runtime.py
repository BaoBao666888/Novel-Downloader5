from __future__ import annotations

import time
from collections.abc import Callable
from typing import Any


def resolve_download_runtime(
    *,
    runtime_cfg: dict[str, Any],
    source_type: str,
) -> dict[str, Any]:
    thread_count = int(runtime_cfg.get("download_threads") or 1)
    if thread_count < 1:
        thread_count = 1
    retry_count = int(runtime_cfg.get("retry_count") or 0)
    if retry_count < 0:
        retry_count = 0
    if retry_count > 10:
        retry_count = 10
    request_delay_ms = int(runtime_cfg.get("request_delay_ms") or 0)
    retry_sleep_sec = max(0.12, min(2.5, float(request_delay_ms) / 1000.0 if request_delay_ms > 0 else 0.25))
    uses_remote_fetch = str(source_type or "").strip().lower().startswith("vbook")
    if not uses_remote_fetch:
        thread_count = 1
        retry_count = 0
    return {
        "thread_count": int(thread_count),
        "retry_count": int(retry_count),
        "retry_sleep_sec": float(retry_sleep_sec),
        "uses_remote_fetch": bool(uses_remote_fetch),
    }


def fetch_one_chapter(
    chapter: dict[str, Any],
    book: dict[str, Any],
    stop_event: Any,
    *,
    retry_count: int = 0,
    retry_delay_sec: float = 0.25,
    on_attempt: Callable[[int], None] | None = None,
    chapter_cache_available: Callable[[dict[str, Any], dict[str, Any]], bool],
    fetch_remote_chapter: Callable[[dict[str, Any], dict[str, Any]], Any],
    repair_cached_chapter: Callable[[dict[str, Any], dict[str, Any]], Any] | None = None,
    after_remote_fetch: Callable[[dict[str, Any], dict[str, Any], Any], Any] | None = None,
) -> tuple[bool, str]:
    retries = max(0, int(retry_count or 0))
    delay_sec = max(0.0, float(retry_delay_sec or 0.0))
    source_type = str(book.get("source_type") or "").strip().lower()
    last_error = ""
    for attempt_idx in range(retries + 1):
        if stop_event.is_set():
            return (False, "Đã dừng.")
        if callable(on_attempt):
            try:
                on_attempt(int(attempt_idx))
            except Exception:
                pass
        if chapter_cache_available(chapter, book):
            return (True, "")
        if callable(repair_cached_chapter):
            try:
                repair_cached_chapter(chapter, book)
            except Exception as exc:
                last_error = str(exc or "").strip() or "Không hoàn tất được dữ liệu chương đã cache."
            else:
                last_error = ""
            if chapter_cache_available(chapter, book):
                return (True, "")
        if source_type.startswith("vbook"):
            try:
                payload = fetch_remote_chapter(chapter, book)
                if callable(after_remote_fetch):
                    after_remote_fetch(chapter, book, payload)
            except Exception as exc:
                last_error = str(exc or "").strip() or "Không tải được nội dung chương."
            else:
                last_error = ""
        else:
            last_error = "Không tải được nội dung chương."
        if chapter_cache_available(chapter, book):
            return (True, "")
        if not last_error:
            last_error = "Không tải được nội dung chương."
        if attempt_idx < retries:
            if stop_event.is_set():
                return (False, "Đã dừng.")
            if delay_sec > 0:
                time.sleep(delay_sec)
    return (False, last_error or "Không tải được nội dung chương.")
