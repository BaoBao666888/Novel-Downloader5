from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class MiscApiDeps:
    api_error_cls: Any
    http_status: Any
    theme_presets: list[dict[str, Any]]
    utc_now_iso: Any
    normalize_newlines: Any
    normalize_name_set: Any
    build_incremental_hv_suggestions: Any
    build_name_right_suggestions: Any
    translator_logic: Any
    vbook_local_translate: Any
    re_module: Any
    quote_func: Any
    unquote_func: Any


def handle_api(handler, method: str, path: str, query: dict[str, list[str]], *, deps: MiscApiDeps) -> dict[str, Any] | None:
    api_error = deps.api_error_cls
    http_status = deps.http_status

    if method == "GET" and path == "/api/health":
        return {
            "ok": True,
            "version": handler.service.VERSION,
            "time": deps.utc_now_iso(),
        }

    if method == "GET" and path == "/api/reader/settings":
        return handler.service.get_reader_settings()

    if method == "POST" and path == "/api/reader/settings":
        payload = handler._read_json_body()
        return handler.service.set_reader_settings(payload)

    if method == "GET" and path == "/api/library/import/settings":
        return handler.service.get_import_settings()

    if method == "POST" and path == "/api/library/import/settings":
        payload = handler._read_json_body()
        return handler.service.set_import_settings(payload)

    if method == "GET" and path == "/api/themes":
        active = handler.service.storage.get_theme_active()
        return {"active": active, "items": deps.theme_presets}

    if method == "POST" and path == "/api/themes/active":
        payload = handler._read_json_body()
        theme_id = (payload.get("theme_id") or "").strip()
        if not theme_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu theme_id.")
        if theme_id not in {x["id"] for x in deps.theme_presets}:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Theme không hợp lệ.")
        handler.service.storage.set_theme_active(theme_id)
        return {"ok": True, "active": theme_id}

    if method == "GET" and path == "/api/name-sets":
        default_sets = handler.service._default_name_sets()
        book_id = (query.get("book_id", [""])[0] or "").strip() or None
        state = handler.service.storage.get_name_set_state(
            default_sets=default_sets,
            active_default=handler.service._default_active_name_set(default_sets),
            book_id=book_id,
        )
        return {"ok": True, **state}

    if method == "POST" and path == "/api/name-sets":
        payload = handler._read_json_body()
        sets = payload.get("sets")
        active_set = (payload.get("active_set") or "").strip() or None
        bump_version = bool(payload.get("bump_version", True))
        book_id = (payload.get("book_id") or "").strip() or None
        state = handler.service.storage.set_name_set_state(
            sets if isinstance(sets, dict) else None,
            active_set=active_set,
            bump_version=bump_version,
            book_id=book_id,
        )
        return {"ok": True, **state}

    if method == "POST" and path == "/api/name-sets/entry":
        payload = handler._read_json_body()
        source = (payload.get("source") or "").strip()
        target = (payload.get("target") or "").strip()
        set_name = (payload.get("set_name") or "").strip() or None
        delete = bool(payload.get("delete", False))
        book_id = (payload.get("book_id") or "").strip() or None
        if not source:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu source cho entry name set.")
        try:
            state = handler.service.storage.update_name_set_entry(
                source,
                target,
                set_name=set_name,
                delete=delete,
                book_id=book_id,
            )
        except ValueError as exc:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", str(exc)) from exc
        return {"ok": True, **state}

    if method == "POST" and path == "/api/name-sets/preview":
        payload = handler._read_json_body()
        text = (payload.get("text") or "").strip()
        if not text:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu text cần preview.")
        translate_mode = (payload.get("translation_mode") or "local").strip().lower()
        if translate_mode not in {"local", "server", "hanviet", "dichngay_local"}:
            translate_mode = "local"
        override_name_set = payload.get("name_set")
        if override_name_set is not None and not isinstance(override_name_set, dict):
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "name_set phải là object.")
        if override_name_set is None:
            book_id = (payload.get("book_id") or "").strip()
            if book_id:
                default_sets = handler.service._default_name_sets()
                _, override_name_set, _ = handler.service.storage.get_active_name_set(
                    default_sets=default_sets,
                    active_default=handler.service._default_active_name_set(default_sets),
                    book_id=book_id,
                )
        detail = handler.service.translator.translate_detailed(
            text,
            mode=translate_mode,
            name_set_override=override_name_set if isinstance(override_name_set, dict) else None,
        )
        detail.pop("unit_map", None)
        return {"ok": True, **detail}

    if method == "POST" and path == "/api/name-suggest":
        payload = handler._read_json_body()
        source_text = deps.normalize_newlines(payload.get("source_text") or "").strip()
        if not source_text:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu source_text để gợi ý name.")
        source_cjk = "".join(ch for ch in source_text if deps.re_module.search(r"[\u3400-\u9fff]", ch))
        if not source_cjk:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "source_text phải chứa chữ Trung.")

        hv_text = ""
        translate_mode = handler.service.resolve_translate_mode(
            payload.get("translation_mode") or handler.service.reader_translation_mode()
        )
        book_id = str(payload.get("book_id") or "").strip()
        set_name = str(payload.get("set_name") or "").strip() or None
        personal_name: dict[str, str] = {}
        personal_vp: dict[str, str] = {}
        if book_id:
            try:
                _, personal_name, _ = handler.service.storage.get_active_name_set(
                    default_sets=handler.service._default_name_sets(),
                    active_default=handler.service._default_active_name_set(handler.service._default_name_sets()),
                    book_id=book_id,
                )
                if set_name:
                    state = handler.service.storage.get_name_set_state(
                        default_sets=handler.service._default_name_sets(),
                        active_default=handler.service._default_active_name_set(handler.service._default_name_sets()),
                        book_id=book_id,
                    )
                    candidate = (state.get("sets") or {}).get(set_name)
                    if isinstance(candidate, dict):
                        personal_name = deps.normalize_name_set(candidate)
                personal_vp, _ = handler.service.storage.get_book_vp_set(book_id)
            except Exception:
                personal_name = {}
                personal_vp = {}
        global_dicts = handler.service.get_local_global_dicts()
        local_bundle = None
        if translate_mode in {"local", "hanviet", "dichngay_local"}:
            try:
                local_settings = deps.vbook_local_translate.normalize_local_settings(
                    (handler.service.reader_translation_settings or {}).get(
                        "dichngay_local" if translate_mode == "dichngay_local" else "local"
                    ) or {},
                    default_base_dir=(
                        "local/dichngay_local_pack"
                        if translate_mode == "dichngay_local"
                        else "reader_ui/translate/vbook_local"
                    ),
                )
                local_bundle = deps.vbook_local_translate.get_public_bundle(local_settings)
                hv_text = deps.vbook_local_translate.build_hanviet_text(source_cjk, local_settings) or source_cjk
            except Exception:
                hv_text = source_cjk
        else:
            settings = handler.service.translator._settings()
            try:
                hv_list = deps.translator_logic.translate_text_chunks(
                    [source_cjk],
                    name_set={},
                    settings=settings,
                    update_progress_callback=None,
                    target_lang="hv",
                )
                hv_text = str(hv_list[0] if hv_list else "").strip()
            except Exception:
                hv_text = ""
            if (not hv_text) or hv_text.startswith("[Lỗi"):
                try:
                    hv_map = deps.translator_logic.load_hanviet_json(settings.get("hanvietJsonUrl", ""))
                    hv_text = deps.translator_logic.build_hanviet_from_map(source_cjk, hv_map) or source_cjk
                except Exception:
                    hv_text = source_cjk
            try:
                local_bundle = deps.vbook_local_translate.get_public_bundle(
                    (handler.service.reader_translation_settings or {}).get("local") or {}
                )
            except Exception:
                local_bundle = None

        rows = deps.build_incremental_hv_suggestions(source_cjk, hv_text)
        items: list[dict[str, Any]] = []
        for idx, row in enumerate(rows, start=1):
            zh = str(row.get("source_text") or "").strip()
            hv = str(row.get("han_viet") or "").strip()
            if not zh or not hv:
                continue
            items.append(
                {
                    "index": idx,
                    "source_text": zh,
                    "han_viet": hv,
                    "google_translate_url": f"https://translate.google.com/?sl=zh-CN&tl=vi&text={deps.quote_func(zh)}&op=translate",
                    "google_search_url": f"https://www.google.com/search?q={deps.quote_func(zh)}",
                }
            )
        right_items = deps.build_name_right_suggestions(
            source_text,
            hv_text=hv_text,
            personal_name=personal_name,
            personal_vp=personal_vp,
            global_name=global_dicts.get("name"),
            global_vp=global_dicts.get("vp"),
            bundle=local_bundle,
            prefer_kind=payload.get("dict_type") or "name",
            prefer_scope=payload.get("scope") or "book",
        )
        for row in right_items:
            zh = str(row.get("source_text") or source_cjk).strip() or source_cjk
            row["google_translate_url"] = f"https://translate.google.com/?sl=zh-CN&tl=vi&text={deps.quote_func(zh)}&op=translate"
            row["google_search_url"] = f"https://www.google.com/search?q={deps.quote_func(zh)}"
        return {
            "ok": True,
            "source_text": source_text,
            "han_viet_raw": hv_text,
            "items": items,
            "right_items": right_items,
        }

    if method == "GET" and path == "/api/local-dicts/global":
        return {"ok": True, "global_dicts": handler.service.get_local_global_dicts()}

    if method == "POST" and path == "/api/local-dicts/global":
        payload = handler._read_json_body()
        return handler.service.set_local_global_dicts(
            name=payload.get("name"),
            vp=payload.get("vp"),
        )

    if method == "POST" and path == "/api/local-dicts/global/entry":
        payload = handler._read_json_body()
        return handler.service.update_local_dict_entry(
            dict_type=payload.get("dict_type") or "name",
            scope="global",
            source=payload.get("source") or "",
            target=payload.get("target") or "",
            delete=bool(payload.get("delete", False)),
        )

    if method == "GET" and path.startswith("/api/local-dicts/book/"):
        book_id = deps.unquote_func(path.removeprefix("/api/local-dicts/book/")).strip("/")
        if not book_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
        return handler.service.get_book_local_dicts(book_id)

    if method == "POST" and path.startswith("/api/local-dicts/book/") and path.endswith("/entry"):
        book_id = path.removeprefix("/api/local-dicts/book/").removesuffix("/entry").strip("/")
        if not book_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
        payload = handler._read_json_body()
        return handler.service.update_local_dict_entry(
            dict_type=payload.get("dict_type") or "name",
            scope="book",
            source=payload.get("source") or "",
            target=payload.get("target") or "",
            delete=bool(payload.get("delete", False)),
            book_id=book_id,
            set_name=payload.get("set_name"),
        )

    if method == "GET" and path.startswith("/api/book-replaces/book/"):
        book_id = deps.unquote_func(path.removeprefix("/api/book-replaces/book/")).strip("/")
        if not book_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
        return handler.service.get_book_replace_entries(book_id)

    if method == "POST" and path.startswith("/api/book-replaces/book/") and path.endswith("/entry"):
        book_id = path.removeprefix("/api/book-replaces/book/").removesuffix("/entry").strip("/")
        if not book_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
        payload = handler._read_json_body()
        return handler.service.update_book_replace_entry(
            book_id=book_id,
            source=payload.get("source") or "",
            target=payload.get("target") or "",
            delete=bool(payload.get("delete", False)),
            use_regex=bool(payload.get("use_regex", False)),
            ignore_case=bool(payload.get("ignore_case", False)),
            new_source=payload.get("new_source") or "",
            new_target=payload.get("new_target") or "",
            new_use_regex=(
                bool(payload.get("new_use_regex"))
                if ("new_use_regex" in payload)
                else (bool(payload.get("use_regex", False)) if (payload.get("new_source") or payload.get("source") or "") else None)
            ),
            new_ignore_case=(
                bool(payload.get("new_ignore_case"))
                if ("new_ignore_case" in payload)
                else (bool(payload.get("ignore_case", False)) if (payload.get("new_source") or payload.get("source") or "") else None)
            ),
        )

    if method == "GET" and path == "/api/junk-lines/global":
        return handler.service.get_global_junk_lines()

    if method == "POST" and path == "/api/junk-lines/global":
        payload = handler._read_json_body()
        return handler.service.set_global_junk_lines(
            payload.get("lines"),
            bump_version=bool(payload.get("bump_version", True)),
        )

    if method == "POST" and path == "/api/junk-lines/global/entry":
        payload = handler._read_json_body()
        return handler.service.update_global_junk_entry(
            line=payload.get("line") or payload.get("source") or "",
            new_line=payload.get("new_line") or payload.get("target") or "",
            delete=bool(payload.get("delete", False)),
            use_regex=bool(payload.get("use_regex", False)),
            ignore_case=bool(payload.get("ignore_case", False)),
            new_use_regex=(
                bool(payload.get("new_use_regex"))
                if ("new_use_regex" in payload)
                else (bool(payload.get("use_regex", False)) if (payload.get("new_line") or payload.get("target") or "") else None)
            ),
            new_ignore_case=(
                bool(payload.get("new_ignore_case"))
                if ("new_ignore_case" in payload)
                else (bool(payload.get("ignore_case", False)) if (payload.get("new_line") or payload.get("target") or "") else None)
            ),
        )

    return None
