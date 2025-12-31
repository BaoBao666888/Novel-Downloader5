from __future__ import annotations

import importlib.util
import json
import os
import traceback
from types import ModuleType
from typing import List, Tuple

from app.nd5.plugin_api import ND5Plugin

PLUGIN_DIR_NAME = "nd5_plugins"


def _load_manifest(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_module_from_path(name: str, path: str) -> ModuleType:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load spec for {name} at {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[attr-defined]
    return module


def _validate_plugin(plugin: ND5Plugin):
    required_attrs = ["id", "name", "fetch_book_and_toc", "download_chapter_batch", "content_to_text"]
    for attr in required_attrs:
        if not hasattr(plugin, attr):
            raise ValueError(f"Plugin thiếu thuộc tính/hàm bắt buộc: {attr}")
    if not getattr(plugin, "domains", None):
        plugin.domains = []  # type: ignore[assignment]
    if not hasattr(plugin, "sample_url"):
        plugin.sample_url = ""  # type: ignore[assignment]
    if not hasattr(plugin, "icon"):
        plugin.icon = None  # type: ignore[assignment]
    if not hasattr(plugin, "requires_bridge"):
        plugin.requires_bridge = False  # type: ignore[assignment]
    return plugin


def load_nd5_plugins(base_dir: str, include_builtin: bool = True) -> Tuple[List[ND5Plugin], List[str]]:
    """Tải plugin ND5 từ thư mục nd5_plugins (và builtin nếu bật)."""
    plugins: List[ND5Plugin] = []
    errors: List[str] = []

    if include_builtin:
        try:
            from app.nd5.builtin_plugins import FanqieBridgePlugin

            plugins.append(FanqieBridgePlugin())
        except Exception as exc:  # pragma: no cover - chỉ log lỗi
            errors.append(f"Builtin fanqie lỗi: {exc}")

    plugin_root = os.path.join(base_dir, PLUGIN_DIR_NAME)
    if not os.path.isdir(plugin_root):
        return plugins, errors

    for entry in sorted(os.listdir(plugin_root)):
        folder = os.path.join(plugin_root, entry)
        manifest_path = os.path.join(folder, "manifest.json")
        if not os.path.isfile(manifest_path):
            continue
        try:
            manifest = _load_manifest(manifest_path)
            entry_file = manifest.get("entry") or "plugin.py"
            module_name = manifest.get("id") or entry
            module_path = os.path.join(folder, entry_file)
            if not os.path.isfile(module_path):
                errors.append(f"{module_name}: Không tìm thấy file entry {entry_file}")
                continue
            module = _load_module_from_path(f"nd5_plugins.{module_name}", module_path)
            plugin_factory = getattr(module, "get_plugin", None)
            if not plugin_factory:
                errors.append(f"{module_name}: Thiếu hàm get_plugin()")
                continue
            plugin_obj = plugin_factory()
            # Nhồi metadata từ manifest nếu plugin chưa thiết lập
            if isinstance(manifest, dict):
                for key in ("id", "name", "sample_url", "icon"):
                    if manifest.get(key):
                        setattr(plugin_obj, key, manifest[key])
            plugin = _validate_plugin(plugin_obj)
            plugins.append(plugin)
        except Exception as exc:  # pragma: no cover - chỉ log lỗi
            trace = traceback.format_exc(limit=1)
            errors.append(f"{entry}: {exc} ({trace.strip()})")

    return plugins, errors
