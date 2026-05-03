from __future__ import annotations

import re
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


def runtime_base_dir(bundle_root: Path) -> Path:
    try:
        cwd = Path.cwd().resolve()
        if looks_like_runtime_root(cwd):
            return cwd
    except Exception:
        pass
    return detect_runtime_root_bootstrap(bundle_root)


def resolve_path_from_base(raw: str | Path, base_dir: Path) -> Path:
    raw_s = str(raw or "").strip()
    if not raw_s:
        return base_dir
    path = Path(raw_s)
    if path.is_absolute():
        return path
    try:
        return (base_dir / path).resolve(strict=False)
    except Exception:
        return base_dir / path


def resolve_existing_path(raw: str | Path, *bases: Path, fallback_root: Path | None = None) -> Path:
    raw_s = str(raw or "").strip()
    valid_bases = [base for base in bases if isinstance(base, Path)]
    fallback_base = valid_bases[0] if valid_bases else (fallback_root or Path.cwd())
    if not raw_s:
        return fallback_base

    path = Path(raw_s)
    if path.is_absolute():
        return path

    candidates: list[Path] = []
    for base in valid_bases:
        try:
            candidates.append((base / path).resolve(strict=False))
        except Exception:
            candidates.append(base / path)

    for candidate in candidates:
        if candidate.exists():
            return candidate
    if candidates:
        return candidates[0]
    return path


def resolve_persisted_path(raw: str | Path, *bases: Path, fallback_root: Path | None = None) -> Path:
    raw_s = str(raw or "").strip()
    valid_bases = [base for base in bases if isinstance(base, Path)]
    fallback_base = valid_bases[0] if valid_bases else (fallback_root or Path.cwd())
    if not raw_s:
        return fallback_base

    direct = Path(raw_s)
    try:
        if direct.exists():
            return direct
    except Exception:
        pass

    wsl_match = re.match(r"^/mnt/(?P<drive>[A-Za-z])/(?P<rest>.+)$", raw_s)
    if wsl_match:
        drive = wsl_match.group("drive").upper()
        rest = wsl_match.group("rest").replace("/", "\\")
        mapped = Path(f"{drive}:\\{rest}")
        try:
            if mapped.exists():
                return mapped
        except Exception:
            pass

    win_match = re.match(r"^(?P<drive>[A-Za-z]):[\\/](?P<rest>.+)$", raw_s)
    if win_match:
        drive = win_match.group("drive").lower()
        rest = win_match.group("rest").replace("\\", "/")
        mapped = Path("/mnt") / drive / rest
        try:
            if mapped.exists():
                return mapped
        except Exception:
            pass

    return resolve_existing_path(raw_s, *valid_bases, fallback_root=fallback_root)
