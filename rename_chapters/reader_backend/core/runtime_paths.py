from __future__ import annotations

import sys
from pathlib import Path


def candidate_runtime_roots_bootstrap(bundle_root: Path) -> list[Path]:
    candidates: list[Path] = []
    seen: set[str] = set()

    def add(path: Path | None) -> None:
        if path is None:
            return
        try:
            resolved = path.resolve(strict=False)
        except Exception:
            resolved = path
        key = str(resolved)
        if key in seen:
            return
        seen.add(key)
        candidates.append(resolved)

    try:
        add(Path.cwd())
    except Exception:
        pass

    add(bundle_root)

    if getattr(sys, "frozen", False):
        try:
            exe_dir = Path(sys.executable).resolve().parent
        except Exception:
            exe_dir = None
        add(exe_dir)
        for parent in list((exe_dir or Path()).parents):
            add(parent)

    return candidates


def looks_like_runtime_root(path: Path) -> bool:
    try:
        return (
            (path / "reader_ui").exists()
            or (path / "config.json").exists()
            or (path / "local" / "version.json").exists()
            or (path / "reader_server.py").exists()
        )
    except Exception:
        return False


def detect_runtime_root_bootstrap(bundle_root: Path) -> Path:
    candidates = candidate_runtime_roots_bootstrap(bundle_root)
    for candidate in candidates:
        if looks_like_runtime_root(candidate):
            return candidate
    return candidates[0] if candidates else bundle_root

