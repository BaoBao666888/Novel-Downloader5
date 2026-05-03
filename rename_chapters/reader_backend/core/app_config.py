from __future__ import annotations

import json
import os
import threading
import uuid
from collections.abc import Callable
from pathlib import Path
from typing import Any

from reader_backend.core import common


_APP_CONFIG_LOCK = threading.RLock()


def _read_json(path: Path) -> dict[str, Any] | None:
    try:
        if path.exists():
            parsed = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(parsed, dict):
                return parsed
    except Exception:
        return None
    return None


def load_app_config(
    *,
    runtime_base_dir: Callable[[], Path],
    app_config_path: Path,
    app_reader_config_path: Path,
) -> dict[str, Any]:
    env_path = (os.environ.get("READER_APP_CONFIG") or "").strip()
    if env_path:
        env_cfg = _read_json(Path(env_path))
        if env_cfg is not None:
            return env_cfg

    base = runtime_base_dir()
    global_cfg: dict[str, Any] = {}
    for path in (base / "config.json", app_config_path):
        parsed = _read_json(path)
        if parsed is not None:
            global_cfg = parsed
            break

    legacy_reader_cfg = app_reader_config_path.with_suffix(".js")
    for path in (
        base / "local" / "reader.config.json",
        app_reader_config_path,
        base / "local" / "reader.config.js",
        legacy_reader_cfg,
    ):
        parsed = _read_json(path)
        if parsed is not None:
            merged = dict(global_cfg)
            merged.update(parsed)
            return merged
    return global_cfg


def resolve_app_config_path(
    *,
    runtime_base_dir: Callable[[], Path],
    root_dir: Path,
    app_reader_config_path: Path,
) -> Path:
    env_path = (os.environ.get("READER_APP_CONFIG") or "").strip()
    if env_path:
        return Path(env_path)
    base = runtime_base_dir()
    base_reader_cfg = base / "local" / "reader.config.json"
    if base_reader_cfg.exists() or base == root_dir:
        return base_reader_cfg
    if app_reader_config_path.exists():
        return app_reader_config_path
    return base_reader_cfg


def save_app_config(
    config: dict[str, Any],
    *,
    resolve_app_config_path: Callable[[], Path],
) -> Path:
    target = resolve_app_config_path()
    target.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(config or {}, ensure_ascii=False, indent=2)
    last_error: Exception | None = None
    with _APP_CONFIG_LOCK:
        for attempt in range(8):
            tmp = target.with_name(
                f"{target.name}.{os.getpid()}.{threading.get_ident()}.{uuid.uuid4().hex}.tmp"
            )
            try:
                tmp.write_text(payload, encoding="utf-8")
                os.replace(tmp, target)
                return target
            except Exception as exc:
                last_error = exc
                try:
                    tmp.unlink(missing_ok=True)
                except Exception:
                    pass
                winerror = getattr(exc, "winerror", None)
                retryable = isinstance(exc, PermissionError) or winerror in {5, 32}
                if (not retryable) or attempt >= 7:
                    raise
                common.sleep_retry(attempt)
    if last_error is not None:
        raise last_error
    return target

