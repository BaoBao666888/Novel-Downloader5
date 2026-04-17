from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_CATEGORY_MANIFEST_RELATIVE_PATH = Path("reader_ui") / "default_categories_wikicv.json"
MANIFEST_SCHEMA_VERSION = 1

REMOVED_DEFAULT_GROUP_KEY = "removed_default"
REMOVED_DEFAULT_GROUP_LABEL = "Danh mục bị xóa khỏi mặc định"
USER_CATEGORY_GROUP_KEY = "user_custom"
USER_CATEGORY_GROUP_LABEL = "Danh mục của bạn"

WIKICV_GROUP_SPECS = {
    "status": {"key": "status", "label": "Tình trạng", "selection_mode": "single", "order": 10},
    "official": {"key": "official", "label": "Tính chất", "selection_mode": "single", "order": 20},
    "gender": {"key": "gender", "label": "Giới tính", "selection_mode": "single", "order": 30},
    "age": {"key": "age", "label": "Thời đại", "selection_mode": "multi", "order": 40},
    "ending": {"key": "ending", "label": "Kết thúc", "selection_mode": "multi", "order": 50},
    "genre": {"key": "genre", "label": "Loại hình", "selection_mode": "multi", "order": 60},
    "tag": {"key": "tag", "label": "Tag", "selection_mode": "multi", "order": 70},
}

WIKICV_LABEL_TO_INPUT = {
    "tình trạng": "status",
    "tính chất": "official",
    "giới tính": "gender",
    "thời đại": "age",
    "kết thúc": "ending",
    "loại hình": "genre",
    "tag": "tag",
}


def _candidate_reader_roots() -> list[Path]:
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

    add(ROOT_DIR)

    if getattr(sys, "frozen", False):
        try:
            exe_dir = Path(sys.executable).resolve().parent
        except Exception:
            exe_dir = None
        add(exe_dir)
        for parent in list((exe_dir or Path()).parents):
            add(parent)

    return candidates


def _looks_like_reader_root(base_dir: Path) -> bool:
    return (
        (base_dir / "reader_ui").exists()
        or (base_dir / "config.json").exists()
        or (base_dir / "reader_server.py").exists()
    )


def get_runtime_root_dir() -> Path:
    candidates = _candidate_reader_roots()
    for candidate in candidates:
        if _looks_like_reader_root(candidate):
            return candidate
    return candidates[0] if candidates else ROOT_DIR


def get_default_category_manifest_path(path: Path | str | None = None) -> Path:
    if path is None:
        return get_runtime_root_dir() / DEFAULT_CATEGORY_MANIFEST_RELATIVE_PATH

    manifest_path = Path(path)
    if manifest_path.is_absolute():
        return manifest_path

    candidates: list[Path] = []
    for base_dir in (get_runtime_root_dir(), ROOT_DIR):
        try:
            candidates.append((base_dir / manifest_path).resolve(strict=False))
        except Exception:
            candidates.append(base_dir / manifest_path)

    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0] if candidates else manifest_path


DEFAULT_CATEGORY_MANIFEST_PATH = get_default_category_manifest_path()


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalize_category_name(raw: Any) -> str:
    value = unicodedata.normalize("NFKC", str(raw or ""))
    value = re.sub(r"\s+", " ", value).strip()
    return value


def normalize_category_name_key(raw: Any) -> str:
    return normalize_category_name(raw).casefold()


def stable_category_key_from_name(raw: Any) -> str:
    name_key = normalize_category_name_key(raw)
    digest = hashlib.sha1(name_key.encode("utf-8")).hexdigest()[:16]
    return f"wikicv_{digest}"


def load_category_manifest(path: Path | str | None = None) -> dict[str, Any]:
    manifest_path = get_default_category_manifest_path(path)
    if not manifest_path.exists():
        return {}
    try:
        data = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception:
        return {}
    return data if isinstance(data, dict) else {}


def merge_default_category_manifest(parsed_manifest: dict[str, Any], existing_manifest: dict[str, Any] | None = None) -> dict[str, Any]:
    existing = existing_manifest if isinstance(existing_manifest, dict) else {}
    now = str((((parsed_manifest or {}).get("source") or {}).get("fetched_at")) or utc_now_iso()).strip() or utc_now_iso()
    parsed_items = [dict(item) for item in ((parsed_manifest or {}).get("items") or []) if isinstance(item, dict)]
    existing_items = [dict(item) for item in (existing.get("items") or []) if isinstance(item, dict)]
    existing_by_name_key = {
        normalize_category_name_key(item.get("name_key") or item.get("name") or ""): item
        for item in existing_items
        if normalize_category_name_key(item.get("name_key") or item.get("name") or "")
    }
    next_name_keys = {
        normalize_category_name_key(item.get("name_key") or item.get("name") or "")
        for item in parsed_items
        if normalize_category_name_key(item.get("name_key") or item.get("name") or "")
    }
    merged_items: list[dict[str, Any]] = []
    for item in parsed_items:
        name = normalize_category_name(item.get("name") or "")
        name_key = normalize_category_name_key(item.get("name_key") or name)
        if not name_key:
            continue
        prev = existing_by_name_key.get(name_key, {})
        merged = dict(item)
        merged["name"] = name
        merged["name_key"] = name_key
        merged["stable_key"] = str(prev.get("stable_key") or item.get("stable_key") or stable_category_key_from_name(name)).strip()
        merged["state"] = "active"
        merged["first_seen_at"] = str(prev.get("first_seen_at") or now).strip() or now
        merged["last_seen_at"] = now
        merged["removed_at"] = ""
        merged_items.append(merged)
    for old in existing_items:
        name = normalize_category_name(old.get("name") or "")
        name_key = normalize_category_name_key(old.get("name_key") or name)
        if not name_key or name_key in next_name_keys:
            continue
        removed = dict(old)
        removed["name"] = name
        removed["name_key"] = name_key
        removed["stable_key"] = str(old.get("stable_key") or stable_category_key_from_name(name)).strip()
        removed["state"] = "removed"
        removed["removed_at"] = now
        removed["last_seen_at"] = str(old.get("last_seen_at") or now).strip() or now
        merged_items.append(removed)
    merged_items.sort(
        key=lambda item: (
            0 if str(item.get("state") or "") == "active" else 1,
            int(item.get("group_order") or 999),
            int(item.get("subgroup_order") or 999),
            int(item.get("item_order") or 999999),
            normalize_category_name_key(item.get("name") or ""),
        )
    )
    return {
        "schema_version": MANIFEST_SCHEMA_VERSION,
        "source": {
            "provider": "wikicv",
            "url": str((((parsed_manifest or {}).get("source") or {}).get("url")) or "https://wikicv.net/nhung-file"),
            "fetched_at": now,
        },
        "generated_at": now,
        "items": merged_items,
    }


def save_category_manifest(manifest: dict[str, Any], path: Path | str | None = None) -> Path:
    output_path = get_default_category_manifest_path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return output_path


def summarize_category_manifest(manifest: dict[str, Any]) -> dict[str, int]:
    items = [item for item in (manifest.get("items") or []) if isinstance(item, dict)]
    return {
        "active": sum(1 for item in items if str(item.get("state") or "") == "active"),
        "removed": sum(1 for item in items if str(item.get("state") or "") == "removed"),
        "groups": len({str(item.get("group_key") or "").strip() for item in items if str(item.get("state") or "") == "active"}),
    }
