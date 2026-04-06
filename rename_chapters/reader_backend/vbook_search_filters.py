from __future__ import annotations

import json
import re
import zipfile
from pathlib import Path
from typing import Any


def load_plugin_manifest(plugin_path: str | Path) -> dict[str, Any]:
    path = Path(str(plugin_path or "")).expanduser()
    if not path.exists():
        return {}
    try:
        if path.is_dir():
            plugin_json = path / "plugin.json"
            if not plugin_json.exists():
                return {}
            payload = json.loads(plugin_json.read_text(encoding="utf-8"))
            return payload if isinstance(payload, dict) else {}
        if path.is_file() and path.suffix.lower() == ".zip":
            with zipfile.ZipFile(path, "r") as zf:
                raw = zf.read("plugin.json")
            payload = json.loads(raw.decode("utf-8", errors="ignore") or "{}")
            return payload if isinstance(payload, dict) else {}
    except Exception:
        return {}
    return {}


def extract_search_filter_schema(manifest: dict[str, Any] | None) -> dict[str, Any]:
    payload = manifest if isinstance(manifest, dict) else {}
    config = payload.get("config") if isinstance(payload.get("config"), dict) else {}
    raw = (
        config.get("search_filters")
        or config.get("searchFilters")
        or payload.get("search_filters")
        or payload.get("searchFilters")
    )
    return normalize_search_filter_schema(raw)


def normalize_search_filter_schema(raw_schema: Any) -> dict[str, Any]:
    schema = raw_schema if isinstance(raw_schema, dict) else {"groups": raw_schema} if isinstance(raw_schema, list) else {}
    groups_raw = schema.get("groups") if isinstance(schema.get("groups"), list) else []
    groups: list[dict[str, Any]] = []
    for idx, raw_group in enumerate(groups_raw):
        normalized = _normalize_group(raw_group, fallback_key=f"group_{idx + 1}")
        if normalized:
            groups.append(normalized)
    default_mode = str(schema.get("default_mode") or schema.get("defaultMode") or "search").strip().lower()
    if default_mode not in {"search", "filter"}:
        default_mode = "search"
    return {
        "supported": bool(groups),
        "default_mode": default_mode,
        "query_placeholder": str(schema.get("query_placeholder") or schema.get("queryPlaceholder") or "").strip(),
        "groups": groups,
    }


def resolve_search_filter_state(schema: dict[str, Any] | None, selected_values: dict[str, Any] | None = None) -> dict[str, Any]:
    config = schema if isinstance(schema, dict) else {}
    groups = config.get("groups") if isinstance(config.get("groups"), list) else []
    raw_selected = _normalize_selected(selected_values)
    visible_groups: list[dict[str, Any]] = []
    chips: list[dict[str, Any]] = []
    resolved: dict[str, str] = {}
    defaults: dict[str, str] = {}

    def visit(group_rows: list[dict[str, Any]], *, depth: int = 0, parent: dict[str, str] | None = None) -> None:
        for group in group_rows:
            options = group.get("options") if isinstance(group.get("options"), list) else []
            if not options:
                continue
            default_value = _as_text(group.get("default"))
            if "default" not in group and not default_value:
                default_value = _as_text(options[0].get("value"))
            defaults[group["key"]] = default_value
            selected = raw_selected.get(group["key"], default_value)
            selected_option = next((opt for opt in options if _as_text(opt.get("value")) == selected), None)
            if selected_option is None:
                selected_option = next((opt for opt in options if _as_text(opt.get("value")) == default_value), None) or options[0]
                selected = _as_text(selected_option.get("value"))
            resolved[group["key"]] = selected

            visible_groups.append(
                {
                    "key": group["key"],
                    "label": group["label"],
                    "hint": group.get("hint") or "",
                    "default": default_value,
                    "selected": selected,
                    "depth": depth,
                    "parent_key": str((parent or {}).get("group_key") or ""),
                    "parent_value": str((parent or {}).get("option_value") or ""),
                    "options": [
                        {
                            "value": _as_text(opt.get("value")),
                            "label": _as_text(opt.get("label")),
                            "selected": _as_text(opt.get("value")) == selected,
                            "has_children": bool(opt.get("children")),
                        }
                        for opt in options
                    ],
                }
            )
            if selected:
                selected_label = _as_text(selected_option.get("label")) or selected
                chips.append(
                    {
                        "key": group["key"],
                        "label": group["label"],
                        "value": selected,
                        "value_label": selected_label,
                        "text": f"{group['label']}: {selected_label}",
                        "depth": depth,
                    }
                )

            child_groups = selected_option.get("children") if isinstance(selected_option.get("children"), list) else []
            if child_groups:
                visit(
                    child_groups,
                    depth=depth + 1,
                    parent={"group_key": group["key"], "option_value": selected},
                )

    visit(groups)
    return {
        "supported": bool(groups),
        "default_mode": str(config.get("default_mode") or "search"),
        "query_placeholder": str(config.get("query_placeholder") or ""),
        "selected": resolved,
        "defaults": defaults,
        "chips": chips,
        "visible_groups": visible_groups,
        "count": len(visible_groups),
    }


def _normalize_group(raw_group: Any, *, fallback_key: str) -> dict[str, Any] | None:
    if not isinstance(raw_group, dict):
        return None
    options_raw = raw_group.get("options")
    if not isinstance(options_raw, list):
        options_raw = raw_group.get("items")
    if not isinstance(options_raw, list) or not options_raw:
        return None
    key = _normalize_key(
        raw_group.get("key")
        or raw_group.get("id")
        or raw_group.get("name")
        or raw_group.get("field")
        or fallback_key
    ) or fallback_key
    label = str(raw_group.get("label") or raw_group.get("title") or raw_group.get("name") or key).strip() or key
    hint = str(raw_group.get("hint") or raw_group.get("description") or "").strip()
    options: list[dict[str, Any]] = []
    has_default, raw_default = _first_present(raw_group, "default", "default_value", "defaultValue")
    default_value = _as_text(raw_default) if has_default else ""
    for idx, raw_option in enumerate(options_raw):
        normalized = _normalize_option(raw_option, fallback_value=f"{key}_{idx + 1}")
        if not normalized:
            continue
        options.append(normalized)
        if not default_value and normalized.get("default"):
            default_value = _as_text(normalized.get("value"))
    if not options:
        return None
    if not default_value and not has_default:
        default_value = _as_text(options[0].get("value"))
    return {
        "key": key,
        "label": label,
        "hint": hint,
        "default": default_value,
        "options": options,
    }


def _normalize_option(raw_option: Any, *, fallback_value: str) -> dict[str, Any] | None:
    if isinstance(raw_option, dict):
        has_value, raw_value = _first_present(raw_option, "value", "key", "id")
        value = _as_text(raw_value) if has_value else fallback_value
        label = str(raw_option.get("label") or raw_option.get("title") or raw_option.get("text") or value).strip() or value
        default = bool(raw_option.get("default") or raw_option.get("is_default") or raw_option.get("selected"))
        children_raw = raw_option.get("children")
        if children_raw is None:
            children_raw = raw_option.get("groups")
        if children_raw is None:
            children_raw = raw_option.get("params")
        children: list[dict[str, Any]] = []
        if isinstance(children_raw, list):
            for idx, raw_group in enumerate(children_raw):
                normalized = _normalize_group(raw_group, fallback_key=f"{value}_child_{idx + 1}")
                if normalized:
                    children.append(normalized)
        return {
            "value": value,
            "label": label,
            "default": default,
            "children": children,
        }
    text = str(raw_option or "").strip()
    if not text:
        return None
    return {
        "value": text,
        "label": text,
        "default": False,
        "children": [],
    }


def _normalize_selected(selected_values: dict[str, Any] | None) -> dict[str, str]:
    if not isinstance(selected_values, dict):
        return {}
    out: dict[str, str] = {}
    for raw_key, raw_value in selected_values.items():
        key = _normalize_key(raw_key)
        if raw_value is None or not key:
            continue
        out[key] = _as_text(raw_value)
    return out


def _normalize_key(value: Any) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    slug = re.sub(r"[^0-9A-Za-z_:-]+", "_", text).strip("_")
    return slug or text


def _first_present(mapping: dict[str, Any], *keys: str) -> tuple[bool, Any]:
    for key in keys:
        if key in mapping:
            return True, mapping.get(key)
    return False, None


def _as_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()
