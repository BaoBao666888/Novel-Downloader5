from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


def version_cmp_key(value: Any) -> tuple[tuple[int, Any], ...]:
    text = str(value or "").strip()
    if not text:
        return ()
    parts: list[tuple[int, Any]] = []
    for token in re.findall(r"\d+|[A-Za-z]+", text):
        if token.isdigit():
            parts.append((0, int(token)))
        else:
            parts.append((1, token.lower()))
    return tuple(parts)


def is_remote_version_newer(remote_value: Any, local_value: Any) -> bool:
    remote_key = version_cmp_key(remote_value)
    if not remote_key:
        return False
    local_key = version_cmp_key(local_value)
    if not local_key:
        return True
    max_len = max(len(remote_key), len(local_key))
    for index in range(max_len):
        remote_part = remote_key[index] if index < len(remote_key) else (0, 0)
        local_part = local_key[index] if index < len(local_key) else (0, 0)
        if remote_part == local_part:
            continue
        return remote_part > local_part
    return False


def load_json_file_if_exists(path: Path) -> dict[str, Any]:
    try:
        if not path.exists():
            return {}
        data = json.loads(path.read_text(encoding="utf-8"))
        return dict(data) if isinstance(data, dict) else {}
    except Exception:
        return {}

