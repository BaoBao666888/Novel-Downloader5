from __future__ import annotations

from collections.abc import Callable
from typing import Any


def _normalize_rows(
    plugin: Any,
    rows: list[Any],
    *,
    normalize_search_item: Callable[..., dict[str, Any] | None],
    normalize_tab_item: Callable[..., dict[str, Any] | None],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    items: list[dict[str, Any]] = []
    tabs: list[dict[str, Any]] = []
    for row in rows:
        normalized = normalize_search_item(plugin, row, query="", translate_ui=False)
        if normalized:
            items.append(normalized)
            continue
        tab = normalize_tab_item(row, translate_ui=False)
        if tab:
            tabs.append(tab)
    return items, tabs


def _translate_rows(
    *,
    items: list[dict[str, Any]],
    tabs: list[dict[str, Any]],
    is_translation_enabled: Callable[[], bool],
    reader_translation_mode: Callable[[], str],
    translate_items: Callable[..., Any],
    translate_tabs: Callable[..., Any],
) -> None:
    if not is_translation_enabled():
        return
    mode = reader_translation_mode()
    translate_items(items, mode=mode)
    translate_tabs(tabs, mode=mode)


def get_vbook_tabbed_list(
    *,
    plugin: Any,
    default_script_key: str,
    tab_script: str = "",
    tab_input: Any = None,
    page: int = 1,
    next_token: Any = None,
    flight_key: str = "",
    flight_token: str = "",
    serialize_plugin: Callable[[Any], dict[str, Any]],
    run_vbook_script: Callable[..., Any],
    extract_rows: Callable[[Any], list[Any]],
    normalize_search_item: Callable[..., dict[str, Any] | None],
    normalize_tab_item: Callable[..., dict[str, Any] | None],
    is_translation_enabled: Callable[[], bool],
    reader_translation_mode: Callable[[], str],
    translate_items: Callable[..., Any],
    translate_tabs: Callable[..., Any],
    normalize_script_ref: Callable[..., str],
    run_paged_list_script: Callable[..., tuple[list[Any], Any, dict[str, Any]]],
    diagnose_empty_attempts: Callable[..., Any],
    summarize_debug_row: Callable[[Any], dict[str, Any]],
    api_error_cls: type[Exception],
    http_status: Any,
) -> dict[str, Any]:
    script_key = str(default_script_key or "").strip()
    p = max(1, int(page or 1))
    if not str(tab_script or "").strip():
        scripts = getattr(plugin, "scripts", None)
        has_script = isinstance(scripts, dict) and bool(str((scripts.get(script_key) or "")).strip())
        if not has_script:
            return {
                "ok": True,
                "plugin": serialize_plugin(plugin),
                "mode": "tabs",
                "tabs": [],
                "items": [],
                "count": 0,
                "item_count": 0,
                "has_script": False,
            }
        data = run_vbook_script(
            plugin,
            script_key,
            [],
            flight_key=flight_key,
            flight_token=flight_token,
        )
        rows = extract_rows(data)
        items, tabs = _normalize_rows(
            plugin,
            rows,
            normalize_search_item=normalize_search_item,
            normalize_tab_item=normalize_tab_item,
        )
        _translate_rows(
            items=items,
            tabs=tabs,
            is_translation_enabled=is_translation_enabled,
            reader_translation_mode=reader_translation_mode,
            translate_items=translate_items,
            translate_tabs=translate_tabs,
        )
        return {
            "ok": True,
            "plugin": serialize_plugin(plugin),
            "mode": "tabs",
            "tabs": tabs,
            "items": items,
            "count": len(tabs),
            "item_count": len(items),
            "has_script": True,
        }

    script_ref = normalize_script_ref(plugin, tab_script, default_key=script_key)
    rows, next_value, diagnostics = run_paged_list_script(
        plugin,
        script_ref=script_ref,
        input_value=tab_input,
        page=p,
        next_token=next_token,
        flight_key=flight_key,
        flight_token=flight_token,
    )
    items, extra_tabs = _normalize_rows(
        plugin,
        rows,
        normalize_search_item=normalize_search_item,
        normalize_tab_item=normalize_tab_item,
    )
    _translate_rows(
        items=items,
        tabs=extra_tabs,
        is_translation_enabled=is_translation_enabled,
        reader_translation_mode=reader_translation_mode,
        translate_items=translate_items,
        translate_tabs=translate_tabs,
    )
    if rows and not items and not extra_tabs:
        raise api_error_cls(
            http_status.BAD_GATEWAY,
            "VBOOK_LIST_NORMALIZE_FAILED",
            "Plugin vBook trả dữ liệu danh sách nhưng app không map được thành truyện hoặc tab.",
            {
                "plugin_id": str(getattr(plugin, "plugin_id", "") or ""),
                "script": script_ref,
                "raw_row_count": len(rows),
                "sample_rows": [summarize_debug_row(row) for row in rows[:3]],
                "attempts": diagnostics.get("attempts") if isinstance(diagnostics, dict) else [],
            },
        )
    if not rows and not items and not extra_tabs:
        diagnose_empty_attempts(
            diagnostics,
            plugin=plugin,
            script_ref=script_ref,
            input_value=tab_input,
            page=p,
        )
    payload = {
        "ok": True,
        "plugin": serialize_plugin(plugin),
        "mode": "content",
        "script": script_ref,
        "page": p,
        "items": items,
        "tabs": extra_tabs,
        "next": next_value,
        "has_next": next_value is not None and str(next_value).strip() != "",
        "count": len(items),
        "tab_count": len(extra_tabs),
        "has_script": True,
    }
    if not items and not extra_tabs:
        payload["debug"] = {
            "empty_reason": "no_rows",
            "attempts": diagnostics.get("attempts") if isinstance(diagnostics, dict) else [],
        }
    return payload
