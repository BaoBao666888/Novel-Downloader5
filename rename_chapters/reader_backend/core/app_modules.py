from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import ModuleType


def load_module_from_path(module_name: str, module_path: Path, *, register: bool = False) -> ModuleType:
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load module {module_name}: {module_path}")
    module = importlib.util.module_from_spec(spec)
    if register:
        sys.modules[spec.name] = module
    spec.loader.exec_module(module)  # type: ignore[attr-defined]
    return module


def load_translator_module(root_dir: Path) -> ModuleType:
    module_path = root_dir / "app" / "core" / "translator.py"
    try:
        return load_module_from_path("reader_translator_logic", module_path)
    except RuntimeError as exc:
        raise RuntimeError(f"Không thể nạp module translator: {module_path}") from exc


def load_vbook_module(root_dir: Path) -> ModuleType:
    module_path = root_dir / "app" / "core" / "vbook_ext.py"
    try:
        return load_module_from_path("reader_vbook_ext", module_path, register=True)
    except RuntimeError as exc:
        raise RuntimeError(f"Không thể nạp module vbook_ext: {module_path}") from exc


def load_vbook_local_translate_module(root_dir: Path) -> ModuleType:
    module_path = root_dir / "app" / "core" / "vbook_local_translate.py"
    try:
        return load_module_from_path("reader_vbook_local_translate", module_path, register=True)
    except RuntimeError as exc:
        raise RuntimeError(f"Cannot load local translate module: {module_path}") from exc
