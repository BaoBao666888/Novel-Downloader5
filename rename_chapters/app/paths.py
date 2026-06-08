"""Common filesystem helpers used across the application."""
from __future__ import annotations

import os
import sys


def _looks_like_app_root(path: str) -> bool:
    if not path:
        return False
    try:
        return (
            os.path.isdir(os.path.join(path, "reader_ui"))
            or os.path.isfile(os.path.join(path, "config.json"))
            or os.path.isfile(os.path.join(path, "reader_server.py"))
            or os.path.isfile(os.path.join(path, "local", "version.json"))
        )
    except Exception:
        return False


def _add_candidate(candidates: list[str], path: str) -> None:
    if not path:
        return
    try:
        normalized = os.path.abspath(path)
    except Exception:
        normalized = path
    if normalized and normalized not in candidates:
        candidates.append(normalized)


def _resolve_exec_base_dir() -> str:
    """Return the directory that should be treated as the application root."""
    if getattr(sys, "frozen", False):
        candidates: list[str] = []
        try:
            _add_candidate(candidates, os.getcwd())
        except Exception:
            pass
        exe_dir = os.path.dirname(sys.executable)
        _add_candidate(candidates, exe_dir)
        parent = exe_dir
        for _ in range(8):
            next_parent = os.path.dirname(parent)
            if not next_parent or next_parent == parent:
                break
            _add_candidate(candidates, next_parent)
            parent = next_parent
        for candidate in candidates:
            if _looks_like_app_root(candidate):
                return candidate
        return exe_dir
    # This module lives in app/, so go one level up to reach repo root
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


_EXEC_BASE_DIR = _resolve_exec_base_dir()
_RESOURCE_BASE_DIR = getattr(sys, "_MEIPASS", _EXEC_BASE_DIR)

# Public constants that consumers can import directly
BASE_DIR = _EXEC_BASE_DIR
RESOURCE_DIR = _RESOURCE_BASE_DIR
BACKGROUND_DIR = os.path.join(BASE_DIR, "backgrounds")


__all__ = ["BASE_DIR", "RESOURCE_DIR", "BACKGROUND_DIR"]
