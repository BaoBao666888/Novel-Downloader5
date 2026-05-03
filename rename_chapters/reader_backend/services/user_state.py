from __future__ import annotations

from typing import Any

SIMULATED_LOCAL_MODE = "dichngay_local"
SIMULATED_LOCAL_BASE_DIR = "reader_ui/translate/dichngay_local"
SIMULATED_LOCAL_LEGACY_BASE_DIR = "local/dichngay_local_pack"
HANVIET_MODE = "hanviet"
HANVIET_BASE_DIR = SIMULATED_LOCAL_BASE_DIR


def _normalize_simulated_local_payload(raw: Any) -> dict[str, Any]:
    payload = dict(raw) if isinstance(raw, dict) else {}
    base_dir = str(payload.get("dict_base_dir") or "").strip().rstrip("/\\")
    if base_dir in {
        SIMULATED_LOCAL_LEGACY_BASE_DIR,
        f"{SIMULATED_LOCAL_LEGACY_BASE_DIR}/root",
    }:
        payload["dict_base_dir"] = SIMULATED_LOCAL_BASE_DIR
    return payload


def _normalize_hanviet_payload(raw: Any) -> dict[str, Any]:
    payload = dict(raw) if isinstance(raw, dict) else {}
    payload["dict_base_dir"] = HANVIET_BASE_DIR
    return payload


def reader_translation_cfg(service, cfg: dict[str, Any] | None = None) -> dict[str, Any]:
    raw_cfg = cfg if isinstance(cfg, dict) else service.app_config
    payload = raw_cfg.get("reader_translation") if isinstance(raw_cfg, dict) else {}
    return payload if isinstance(payload, dict) else {}


def parse_bool(value: Any, default: bool = True) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(int(value))
    text = str(value or "").strip().lower()
    if not text:
        return bool(default)
    if text in {"1", "true", "yes", "on", "enable", "enabled"}:
        return True
    if text in {"0", "false", "no", "off", "disable", "disabled"}:
        return False
    return bool(default)


def normalize_translate_mode(value: Any, default: str = "server") -> str:
    mode = str(value or "").strip().lower()
    if mode in {"server", "local", HANVIET_MODE, SIMULATED_LOCAL_MODE}:
        return mode
    if default in {"local", HANVIET_MODE, SIMULATED_LOCAL_MODE}:
        return default
    return "server"


def normalized_server_translate_settings(service, value: Any = None, cfg: dict[str, Any] | None = None) -> dict[str, Any]:
    raw = value if isinstance(value, dict) else {}
    source_cfg = cfg if isinstance(cfg, dict) else service.app_config
    translator_cfg = source_cfg.get("translator_settings") if isinstance(source_cfg, dict) else {}
    if not isinstance(translator_cfg, dict):
        translator_cfg = {}

    def _to_int(raw_value: Any, default: int, minimum: int, maximum: int) -> int:
        try:
            parsed = int(raw_value if raw_value is not None else default)
        except Exception:
            parsed = default
        return max(minimum, min(maximum, parsed))

    return {
        "serverUrl": str(raw.get("serverUrl") or translator_cfg.get("serverUrl") or "https://dichngay.com/translate/text").strip()
        or "https://dichngay.com/translate/text",
        "delayMs": _to_int(raw.get("delayMs", translator_cfg.get("delayMs")), 250, 0, 10_000),
        "maxChars": _to_int(raw.get("maxChars", translator_cfg.get("maxChars")), 9000, 500, 9_000),
        "retryCount": _to_int(raw.get("retryCount", translator_cfg.get("retryCount")), 2, 0, 8),
        "timeoutSec": _to_int(raw.get("timeoutSec", translator_cfg.get("timeoutSec")), 60, 10, 180),
        "retryBackoffMs": _to_int(raw.get("retryBackoffMs", translator_cfg.get("retryBackoffMs")), 700, 100, 5_000),
    }


def normalized_global_local_dicts(value: Any, *, normalize_name_set) -> dict[str, dict[str, str]]:
    raw = value if isinstance(value, dict) else {}
    return {
        "name": normalize_name_set(raw.get("name")),
        "vp": normalize_name_set(raw.get("vp")),
    }


def normalized_reader_translation_settings(
    service,
    cfg: dict[str, Any] | None = None,
    *,
    normalize_name_set,
    vbook_local_translate,
) -> dict[str, Any]:
    payload = reader_translation_cfg(service, cfg=cfg)
    local_payload = payload.get("local") if isinstance(payload, dict) else {}
    if not isinstance(local_payload, dict):
        local_payload = {}
    sim_local_payload = _normalize_simulated_local_payload(payload.get(SIMULATED_LOCAL_MODE) if isinstance(payload, dict) else {})
    hanviet_payload = _normalize_hanviet_payload(payload.get(HANVIET_MODE) if isinstance(payload, dict) else {})
    global_dicts = normalized_global_local_dicts(payload.get("global_dicts"), normalize_name_set=normalize_name_set)
    merged_local = dict(local_payload)
    merged_local["global_name_overrides"] = dict(global_dicts.get("name") or {})
    merged_local["global_vp_overrides"] = dict(global_dicts.get("vp") or {})
    merged_sim_local = dict(sim_local_payload)
    merged_sim_local["global_name_overrides"] = dict(global_dicts.get("name") or {})
    merged_sim_local["global_vp_overrides"] = dict(global_dicts.get("vp") or {})
    merged_hanviet = dict(hanviet_payload)
    merged_hanviet["global_name_overrides"] = dict(global_dicts.get("name") or {})
    merged_hanviet["global_vp_overrides"] = dict(global_dicts.get("vp") or {})
    return {
        "enabled": parse_bool(payload.get("enabled"), True),
        "mode": normalize_translate_mode(payload.get("mode"), "local"),
        "title_cache_auto": parse_bool(payload.get("title_cache_auto"), True),
        "server": normalized_server_translate_settings(
            service,
            payload.get("server") if isinstance(payload, dict) else None,
            cfg,
        ),
        "local": vbook_local_translate.normalize_local_settings(
            merged_local,
            default_base_dir="reader_ui/translate/vbook_local",
        ),
        SIMULATED_LOCAL_MODE: vbook_local_translate.normalize_local_settings(
            merged_sim_local,
            default_base_dir=SIMULATED_LOCAL_BASE_DIR,
        ),
        HANVIET_MODE: vbook_local_translate.normalize_local_settings(
            merged_hanviet,
            default_base_dir=HANVIET_BASE_DIR,
        ),
        "global_dicts": global_dicts,
    }


def normalized_reader_import_settings(service, cfg: dict[str, Any] | None = None, *, normalize_reader_import_settings) -> dict[str, Any]:
    source_cfg = cfg if isinstance(cfg, dict) else service.app_config
    raw = source_cfg.get("reader_import") if isinstance(source_cfg, dict) else {}
    return normalize_reader_import_settings(raw if isinstance(raw, dict) else {})


def get_import_settings(service, *, normalize_reader_import_settings, import_settings_presets) -> dict[str, Any]:
    return {
        "ok": True,
        "settings": normalize_reader_import_settings(service.reader_import_settings),
        "presets": import_settings_presets(),
    }


def set_import_settings(
    service,
    payload: dict[str, Any],
    *,
    load_app_config,
    save_app_config,
    normalize_reader_import_settings,
    import_settings_presets,
) -> dict[str, Any]:
    next_settings = normalize_reader_import_settings(payload if isinstance(payload, dict) else {})
    cfg = load_app_config()
    if not isinstance(cfg, dict):
        cfg = {}
    cfg["reader_import"] = next_settings
    save_app_config(cfg)
    service.refresh_config()
    return get_import_settings(
        service,
        normalize_reader_import_settings=normalize_reader_import_settings,
        import_settings_presets=import_settings_presets,
    )


def get_reader_settings(service, *, normalize_name_set, vbook_local_translate) -> dict[str, Any]:
    local_settings = service.reader_translation_settings.get("local")
    if not isinstance(local_settings, dict):
        local_settings = vbook_local_translate.normalize_local_settings(
            {},
            default_base_dir="reader_ui/translate/vbook_local",
        )
    sim_local_settings = service.reader_translation_settings.get(SIMULATED_LOCAL_MODE)
    if not isinstance(sim_local_settings, dict):
        sim_local_settings = vbook_local_translate.normalize_local_settings(
            {},
            default_base_dir=SIMULATED_LOCAL_BASE_DIR,
        )
    hanviet_settings = service.reader_translation_settings.get(HANVIET_MODE)
    hanviet_settings = vbook_local_translate.normalize_local_settings(
        _normalize_hanviet_payload(hanviet_settings if isinstance(hanviet_settings, dict) else {}),
        default_base_dir=HANVIET_BASE_DIR,
    )
    return {
        "ok": True,
        "debug": {
            "enabled": bool(getattr(service, "reader_debug_enabled", False)),
            "log_path": str(getattr(service, "reader_debug_log_path", "") or ""),
        },
        "translation": {
            "enabled": bool(service.reader_translation_settings.get("enabled", True)),
            "mode": normalize_translate_mode(service.reader_translation_settings.get("mode"), "local"),
            "title_cache_auto": parse_bool(service.reader_translation_settings.get("title_cache_auto"), True),
            "server": normalized_server_translate_settings(
                service,
                service.reader_translation_settings.get("server"),
                service.app_config,
            ),
            "local": local_settings,
            SIMULATED_LOCAL_MODE: sim_local_settings,
            HANVIET_MODE: hanviet_settings,
            "global_dicts": normalized_global_local_dicts(
                service.reader_translation_settings.get("global_dicts"),
                normalize_name_set=normalize_name_set,
            ),
        },
    }


def set_reader_settings(
    service,
    payload: dict[str, Any],
    *,
    app_config_lock,
    load_app_config,
    save_app_config,
    normalize_name_set,
    vbook_local_translate,
) -> dict[str, Any]:
    if not isinstance(payload, dict):
        payload = {}
    translation_payload = payload.get("translation")
    patch = translation_payload if isinstance(translation_payload, dict) else payload
    debug_payload = payload.get("debug") if isinstance(payload.get("debug"), dict) else None

    with app_config_lock:
        cfg = load_app_config()
        if not isinstance(cfg, dict):
            cfg = {}
        existing_debug = cfg.get("reader_debug") if isinstance(cfg.get("reader_debug"), dict) else {}
        existing = normalized_reader_translation_settings(
            service,
            cfg,
            normalize_name_set=normalize_name_set,
            vbook_local_translate=vbook_local_translate,
        )
        patch_local = patch.get("local")
        patch_sim_local = patch.get(SIMULATED_LOCAL_MODE)
        patch_hanviet = patch.get(HANVIET_MODE)
        patch_server = patch.get("server")
        patch_global_dicts = patch.get("global_dicts")
        if isinstance(patch_local, dict):
            merged_local = dict(existing.get("local") or {})
            merged_local.update(patch_local)
        else:
            merged_local = existing.get("local") or {}
        if isinstance(patch_sim_local, dict):
            merged_sim_local = dict(existing.get(SIMULATED_LOCAL_MODE) or {})
            merged_sim_local.update(patch_sim_local)
        else:
            merged_sim_local = existing.get(SIMULATED_LOCAL_MODE) or {}
        if isinstance(patch_hanviet, dict):
            merged_hanviet = dict(existing.get(HANVIET_MODE) or {})
            merged_hanviet.update(patch_hanviet)
        else:
            merged_hanviet = existing.get(HANVIET_MODE) or {}
        merged_hanviet = _normalize_hanviet_payload(merged_hanviet)
        if isinstance(patch_server, dict):
            merged_server = dict(existing.get("server") or {})
            merged_server.update(patch_server)
        else:
            merged_server = existing.get("server") or {}
        merged_global_dicts = normalized_global_local_dicts(existing.get("global_dicts"), normalize_name_set=normalize_name_set)
        if isinstance(patch_global_dicts, dict):
            for key in ("name", "vp"):
                if key in patch_global_dicts:
                    merged_global_dicts[key] = normalize_name_set(patch_global_dicts.get(key))
        local_with_global = dict(merged_local)
        local_with_global["global_name_overrides"] = dict(merged_global_dicts.get("name") or {})
        local_with_global["global_vp_overrides"] = dict(merged_global_dicts.get("vp") or {})
        sim_local_with_global = dict(merged_sim_local)
        sim_local_with_global["global_name_overrides"] = dict(merged_global_dicts.get("name") or {})
        sim_local_with_global["global_vp_overrides"] = dict(merged_global_dicts.get("vp") or {})
        hanviet_with_global = dict(merged_hanviet)
        hanviet_with_global["global_name_overrides"] = dict(merged_global_dicts.get("name") or {})
        hanviet_with_global["global_vp_overrides"] = dict(merged_global_dicts.get("vp") or {})
        next_settings = {
            "enabled": parse_bool(patch.get("enabled"), existing["enabled"]),
            "mode": normalize_translate_mode(patch.get("mode"), existing["mode"]),
            "title_cache_auto": parse_bool(patch.get("title_cache_auto"), existing.get("title_cache_auto", True)),
            "server": normalized_server_translate_settings(service, merged_server, cfg),
            "local": vbook_local_translate.normalize_local_settings(
                local_with_global,
                default_base_dir="reader_ui/translate/vbook_local",
            ),
            SIMULATED_LOCAL_MODE: vbook_local_translate.normalize_local_settings(
                sim_local_with_global,
                default_base_dir=SIMULATED_LOCAL_BASE_DIR,
            ),
            HANVIET_MODE: vbook_local_translate.normalize_local_settings(
                hanviet_with_global,
                default_base_dir=HANVIET_BASE_DIR,
            ),
            "global_dicts": merged_global_dicts,
        }
        cfg["reader_translation"] = next_settings
        if isinstance(debug_payload, dict):
            cfg["reader_debug"] = {
                "enabled": parse_bool(debug_payload.get("enabled"), bool(existing_debug.get("enabled", False))),
            }
        save_app_config(cfg)
    try:
        vbook_local_translate.clear_bundle_cache()
    except Exception:
        pass
    service.refresh_config()
    try:
        service.ensure_library_title_cache_autofill(reason="settings")
    except Exception:
        pass
    return get_reader_settings(service, normalize_name_set=normalize_name_set, vbook_local_translate=vbook_local_translate)


def get_local_global_dicts(service, *, normalize_name_set) -> dict[str, dict[str, str]]:
    return normalized_global_local_dicts(
        service.reader_translation_settings.get("global_dicts"),
        normalize_name_set=normalize_name_set,
    )


def set_local_global_dicts(
    service,
    *,
    name: dict[str, Any] | None = None,
    vp: dict[str, Any] | None = None,
    load_app_config,
    save_app_config,
    normalize_name_set,
    vbook_local_translate,
) -> dict[str, Any]:
    current = get_local_global_dicts(service, normalize_name_set=normalize_name_set)
    next_dicts = {
        "name": normalize_name_set(name) if isinstance(name, dict) else dict(current.get("name") or {}),
        "vp": normalize_name_set(vp) if isinstance(vp, dict) else dict(current.get("vp") or {}),
    }
    cfg = load_app_config()
    if not isinstance(cfg, dict):
        cfg = {}
    reader_cfg = cfg.get("reader_translation") if isinstance(cfg.get("reader_translation"), dict) else {}
    reader_cfg = dict(reader_cfg)
    reader_cfg["global_dicts"] = next_dicts
    cfg["reader_translation"] = reader_cfg
    save_app_config(cfg)
    try:
        vbook_local_translate.clear_bundle_cache()
    except Exception:
        pass
    service.refresh_config()
    return {"ok": True, "global_dicts": get_local_global_dicts(service, normalize_name_set=normalize_name_set)}


def get_book_local_dicts(service, book_id: str) -> dict[str, Any]:
    default_sets = service._default_name_sets()
    active_default = service._default_active_name_set(default_sets)
    _, name_entries, name_version = service.storage.get_active_name_set(
        default_sets=default_sets,
        active_default=active_default,
        book_id=book_id,
    )
    vp_entries, vp_version = service.storage.get_book_vp_set(book_id)
    return {
        "ok": True,
        "book_id": book_id,
        "name": name_entries,
        "vp": vp_entries,
        "name_version": name_version,
        "vp_version": vp_version,
    }


def update_local_dict_entry(
    service,
    *,
    dict_type: str,
    scope: str,
    source: str,
    target: str,
    delete: bool = False,
    book_id: str | None = None,
    set_name: str | None = None,
    api_error_cls,
    http_status,
    contains_name_split_delimiter,
    normalize_name_set,
    load_app_config,
    save_app_config,
    vbook_local_translate,
) -> dict[str, Any]:
    kind = str(dict_type or "").strip().lower()
    if kind not in {"name", "vp"}:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "dict_type phải là name hoặc vp.")
    src = str(source or "").strip()
    dst = str(target or "").strip()
    if not src:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu source cho entry.")

    if kind == "name":
        if contains_name_split_delimiter(src):
            raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Tên gốc không được chứa dấu tách câu.")
        if dst and contains_name_split_delimiter(dst):
            raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Tên dịch không được chứa dấu tách câu.")

    sc = str(scope or "book").strip().lower()
    if sc not in {"global", "book"}:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "scope phải là global hoặc book.")

    if sc == "global":
        current = get_local_global_dicts(service, normalize_name_set=normalize_name_set)
        key = "name" if kind == "name" else "vp"
        entries = dict(current.get(key) or {})
        if delete or not dst:
            entries.pop(src, None)
        else:
            entries[src] = dst
        if key == "name":
            return set_local_global_dicts(
                service,
                name=entries,
                vp=current.get("vp"),
                load_app_config=load_app_config,
                save_app_config=save_app_config,
                normalize_name_set=normalize_name_set,
                vbook_local_translate=vbook_local_translate,
            )
        return set_local_global_dicts(
            service,
            name=current.get("name"),
            vp=entries,
            load_app_config=load_app_config,
            save_app_config=save_app_config,
            normalize_name_set=normalize_name_set,
            vbook_local_translate=vbook_local_translate,
        )

    bid = str(book_id or "").strip()
    if not bid:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id cho scope book.")
    if kind == "name":
        state = service.storage.update_name_set_entry(
            src,
            dst,
            set_name=set_name,
            delete=delete,
            book_id=bid,
        )
        service.refresh_config()
        return {"ok": True, "book_id": bid, "scope": "book", "dict_type": "name", **state}

    state = service.storage.update_book_vp_entry(
        bid,
        src,
        dst,
        delete=delete,
    )
    return {"ok": True, "book_id": bid, "scope": "book", "dict_type": "vp", **state}


def get_global_junk_lines(service) -> dict[str, Any]:
    entries, version = service.storage.get_global_junk_lines()
    lines = [str(item.get("text") or "").strip() for item in entries if str(item.get("text") or "").strip()]
    return {"ok": True, "entries": entries, "lines": lines, "version": version}


def set_global_junk_lines(
    service,
    lines: Any,
    *,
    bump_version: bool = True,
    api_error_cls,
    http_status,
    normalize_junk_entries,
) -> dict[str, Any]:
    if (lines is not None) and (not isinstance(lines, (list, tuple, str))):
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "lines phải là list hoặc chuỗi nhiều dòng.")
    if isinstance(lines, str):
        normalized_entries = normalize_junk_entries(lines)
    else:
        normalized_entries = normalize_junk_entries(lines if isinstance(lines, (list, tuple)) else [])
    state = service.storage.set_global_junk_state(normalized_entries, bump_version=bump_version)
    return {"ok": True, **state}


def update_global_junk_entry(
    service,
    *,
    line: str,
    new_line: str = "",
    delete: bool = False,
    use_regex: bool = False,
    ignore_case: bool = False,
    new_use_regex: bool | None = None,
    new_ignore_case: bool | None = None,
    api_error_cls,
    http_status,
    normalize_newlines,
) -> dict[str, Any]:
    raw_line = normalize_newlines(str(line or "")).strip()
    raw_next = normalize_newlines(str(new_line or "")).strip()
    if not raw_line and not raw_next:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu dòng rác.")
    try:
        state = service.storage.update_global_junk_entry(
            raw_line,
            raw_next,
            delete=delete,
            use_regex=use_regex,
            ignore_case=ignore_case,
            new_use_regex=new_use_regex,
            new_ignore_case=new_ignore_case,
        )
    except ValueError as exc:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", str(exc)) from exc
    return {"ok": True, **state}


def get_book_replace_entries(service, book_id: str) -> dict[str, Any]:
    entries, version = service.storage.get_book_replace_entries(book_id)
    return {"ok": True, "book_id": book_id, "entries": entries, "version": version}


def update_book_replace_entry(
    service,
    *,
    book_id: str,
    source: str,
    target: str = "",
    delete: bool = False,
    use_regex: bool = False,
    ignore_case: bool = False,
    new_source: str = "",
    new_target: str = "",
    new_use_regex: bool | None = None,
    new_ignore_case: bool | None = None,
    api_error_cls,
    http_status,
    normalize_newlines,
) -> dict[str, Any]:
    bid = str(book_id or "").strip()
    if not bid:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
    try:
        state = service.storage.update_book_replace_entry(
            bid,
            normalize_newlines(str(source or "")).strip(),
            normalize_newlines(str(target or "")).strip(),
            delete=delete,
            use_regex=use_regex,
            ignore_case=ignore_case,
            new_source=normalize_newlines(str(new_source or "")).strip(),
            new_target=normalize_newlines(str(new_target or "")).strip(),
            new_use_regex=new_use_regex,
            new_ignore_case=new_ignore_case,
        )
    except ValueError as exc:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", str(exc)) from exc
    return {"ok": True, "book_id": bid, **state}
