from __future__ import annotations

import concurrent.futures
from collections.abc import Callable
from typing import Any


def run_download_batch(
    *,
    pending_rows: list[dict[str, Any]],
    book: dict[str, Any],
    stop_event: Any,
    thread_count: int,
    retry_count: int,
    retry_sleep_sec: float,
    fetch_one_chapter: Callable[..., tuple[bool, str]],
    on_attempt: Callable[[dict[str, Any], int], None] | None = None,
    on_row_settled: Callable[[dict[str, Any]], None] | None = None,
    on_row_result: Callable[[dict[str, Any], bool, str, int], None] | None = None,
) -> int:
    failed = 0
    workers = max(1, int(thread_count or 1))

    def _attempt_callback(row: dict[str, Any]) -> Callable[[int], None]:
        def _callback(attempt_idx: int) -> None:
            if callable(on_attempt):
                on_attempt(row, int(attempt_idx))

        return _callback

    if workers <= 1:
        for row in pending_rows:
            if stop_event.is_set():
                break
            ok, err = fetch_one_chapter(
                row,
                book,
                stop_event,
                retry_count=retry_count,
                retry_delay_sec=retry_sleep_sec,
                on_attempt=_attempt_callback(row),
            )
            if (not ok) and (not stop_event.is_set()):
                failed += 1
            if callable(on_row_result):
                on_row_result(row, bool(ok), str(err or ""), int(failed))
        return failed

    in_flight: dict[concurrent.futures.Future[tuple[bool, str]], dict[str, Any]] = {}
    pending_queue = list(pending_rows)
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        while pending_queue or in_flight:
            if stop_event.is_set() and not in_flight:
                break
            while pending_queue and (len(in_flight) < workers) and (not stop_event.is_set()):
                row = pending_queue.pop(0)
                future = executor.submit(
                    fetch_one_chapter,
                    row,
                    book,
                    stop_event,
                    retry_count=retry_count,
                    retry_delay_sec=retry_sleep_sec,
                    on_attempt=_attempt_callback(row),
                )
                in_flight[future] = row
            if not in_flight:
                continue
            done, _ = concurrent.futures.wait(
                list(in_flight.keys()),
                timeout=0.25,
                return_when=concurrent.futures.FIRST_COMPLETED,
            )
            if not done:
                continue
            for future in done:
                row = in_flight.pop(future, None)
                if row is None:
                    continue
                if callable(on_row_settled):
                    on_row_settled(row)
                ok = False
                err = ""
                try:
                    ok, err = future.result()
                except Exception as exc:
                    ok = False
                    err = str(exc)
                if (not ok) and (not stop_event.is_set()):
                    failed += 1
                if callable(on_row_result):
                    on_row_result(row, bool(ok), str(err or ""), int(failed))
    return failed
