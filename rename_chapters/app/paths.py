"""Common filesystem helpers used across the application."""
from __future__ import annotations

import os
import sys


def _resolve_exec_base_dir() -> str:
    """Return the directory that should be treated as the application root."""
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    # This module lives in app/, so go one level up to reach repo root
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


_EXEC_BASE_DIR = _resolve_exec_base_dir()
_RESOURCE_BASE_DIR = getattr(sys, "_MEIPASS", _EXEC_BASE_DIR)

# Public constants that consumers can import directly
BASE_DIR = _EXEC_BASE_DIR
RESOURCE_DIR = _RESOURCE_BASE_DIR
BACKGROUND_DIR = os.path.join(BASE_DIR, "backgrounds")


__all__ = ["BASE_DIR", "RESOURCE_DIR", "BACKGROUND_DIR"]
