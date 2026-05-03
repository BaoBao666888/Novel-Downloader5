from __future__ import annotations

import threading
import time
from collections.abc import Callable
from typing import Any


def start_worker_thread(
    *,
    worker_started: bool,
    worker_thread: threading.Thread | None,
    target: Callable[[], None],
    name: str,
) -> tuple[bool, threading.Thread]:
    if worker_started and worker_thread and worker_thread.is_alive():
        return True, worker_thread
    worker = threading.Thread(
        target=target,
        name=str(name or "ReaderWorker"),
        daemon=True,
    )
    worker.start()
    return True, worker


def wait_for_listing_change(
    *,
    cv: threading.Condition,
    build_payload: Callable[[], dict[str, Any]],
    last_sig: str,
    timeout_sec: float,
    wait_slice_sec: float = 0.5,
) -> dict[str, Any]:
    timeout = max(0.2, min(60.0, float(timeout_sec or 20.0)))
    deadline = time.time() + timeout
    prev_sig = str(last_sig or "")
    while True:
        payload = build_payload()
        current_sig = str(payload.get("sig") or "")
        if current_sig != prev_sig:
            payload["changed"] = True
            return payload
        remaining = deadline - time.time()
        if remaining <= 0:
            payload["changed"] = False
            return payload
        cv.wait(timeout=min(remaining, max(0.1, float(wait_slice_sec or 0.5))))


def wait_for_next_queued_job(
    *,
    cv: threading.Condition,
    cleanup: Callable[[], None],
    queue: list[str],
    jobs: dict[str, dict[str, Any]],
    idle_wait_sec: float = 1.0,
) -> tuple[str | None, dict[str, Any] | None]:
    cleanup()
    while not queue:
        cv.wait(timeout=max(0.1, float(idle_wait_sec or 1.0)))
        cleanup()
    job_id = queue.pop(0)
    job = jobs.get(job_id)
    if not job:
        return None, None
    status = str(job.get("status") or "").strip().lower()
    if status != "queued":
        return None, None
    return job_id, job
