from __future__ import annotations

import json
import os
import re
import sys
import threading
from collections.abc import Callable
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any


_EXPLICIT_LOG_LOCK = threading.Lock()
_LOG_CLEANUP_LOCK = threading.Lock()


def reader_log_dir(
    *,
    runtime_base_dir: Callable[[], Path],
    resolve_path_from_base: Callable[[str | Path, Path], Path],
) -> Path:
    explicit_dir = (os.environ.get("READER_SERVER_LOG_DIR") or "").strip()
    if explicit_dir:
        return resolve_path_from_base(explicit_dir, runtime_base_dir())
    explicit_file = (os.environ.get("READER_SERVER_LOG_FILE") or "").strip()
    if explicit_file:
        return Path(explicit_file).resolve().parent
    return runtime_base_dir() / "logs" / "reader_server"


def reader_log_path_for_now(
    *,
    runtime_base_dir: Callable[[], Path],
    resolve_path_from_base: Callable[[str | Path, Path], Path],
) -> Path:
    now = datetime.now()
    return reader_log_dir(
        runtime_base_dir=runtime_base_dir,
        resolve_path_from_base=resolve_path_from_base,
    ) / f"reader_server-{now.strftime('%Y-%m-%d')}.log"


def reader_debug_log_path_for_now(
    *,
    runtime_base_dir: Callable[[], Path],
    resolve_path_from_base: Callable[[str | Path, Path], Path],
) -> Path:
    now = datetime.now()
    return reader_log_dir(
        runtime_base_dir=runtime_base_dir,
        resolve_path_from_base=resolve_path_from_base,
    ) / f"reader_debug-{now.strftime('%Y-%m-%d')}.log"


def write_reader_debug_log(
    event: str,
    fields: dict[str, Any],
    *,
    log_path: Callable[[], Path],
    utc_now_iso: Callable[[], str],
) -> str:
    payload = {
        "ts": utc_now_iso(),
        "event": str(event or "debug").strip() or "debug",
        **{str(key): value for key, value in fields.items()},
    }
    path = log_path()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with _EXPLICIT_LOG_LOCK:
            with path.open("a", encoding="utf-8", errors="backslashreplace") as fp:
                fp.write(json.dumps(payload, ensure_ascii=False, default=str, separators=(",", ":")))
                fp.write("\n")
                fp.flush()
    except Exception:
        return str(path)
    return str(path)


def cleanup_reader_log_files(*, log_dir: Callable[[], Path], keep_days: int = 30) -> None:
    target_dir = log_dir()
    try:
        target_dir.mkdir(parents=True, exist_ok=True)
    except Exception:
        return
    cutoff = datetime.now() - timedelta(days=max(1, int(keep_days)))
    pattern = re.compile(r"^reader_server-(\d{4}-\d{2}-\d{2})\.log$")
    with _LOG_CLEANUP_LOCK:
        for entry in target_dir.glob("reader_server-*.log"):
            try:
                match = pattern.match(entry.name)
                if not match:
                    continue
                stamp = datetime.strptime(match.group(1), "%Y-%m-%d")
                if stamp < cutoff:
                    entry.unlink(missing_ok=True)
            except Exception:
                continue


def configure_console_output() -> None:
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if stream is None:
            continue
        try:
            stream.reconfigure(errors="backslashreplace")
        except Exception:
            continue


def safe_console_print(text: str, *, log_path_for_now: Callable[[], Path]) -> None:
    message = str(text or "")
    explicit_log = (os.environ.get("READER_SERVER_LOG_FILE") or "").strip()
    explicit_dir = (os.environ.get("READER_SERVER_LOG_DIR") or "").strip()
    if explicit_log or explicit_dir:
        try:
            log_path = Path(explicit_log).resolve() if explicit_log else log_path_for_now()
            log_path.parent.mkdir(parents=True, exist_ok=True)
            with _EXPLICIT_LOG_LOCK:
                with log_path.open("a", encoding="utf-8", errors="backslashreplace") as fp:
                    fp.write(message)
                    fp.write("\n")
                    fp.flush()
            return
        except Exception:
            pass
    try:
        print(message)
        return
    except Exception:
        pass

    stream = getattr(sys, "stdout", None)
    if stream is None:
        return
    encoding = getattr(stream, "encoding", None) or "utf-8"
    payload = message.encode(encoding, errors="backslashreplace")
    try:
        buffer = getattr(stream, "buffer", None)
        if buffer is not None:
            buffer.write(payload + b"\n")
        else:
            stream.write(payload.decode(encoding, errors="ignore") + "\n")
        stream.flush()
    except Exception:
        pass
