from __future__ import annotations

from typing import Any


def _parse_page(payload: dict[str, Any], key: str = "page", default: int = 1) -> int:
    page_raw = payload.get(key)
    try:
        return int(page_raw) if page_raw is not None and str(page_raw).strip() else default
    except Exception:
        return default


def _parse_boolish(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def _resolve_tab_input(payload: dict[str, Any]) -> Any:
    tab_input = payload.get("tab_input")
    if "input" in payload and tab_input is None:
        tab_input = payload.get("input")
    return tab_input


def handle_api(
    handler,
    method: str,
    path: str,
    query: dict[str, list[str]],
    *,
    api_error_cls,
    http_status,
    re_module,
    unquote_func,
) -> dict[str, Any] | None:
    api_error = api_error_cls

    if method == "GET" and path == "/api/vbook/plugins":
        items = handler.service.list_vbook_plugins()
        return {"ok": True, "items": items}

    if method == "GET" and path == "/api/vbook/settings":
        return handler.service.get_vbook_settings_global()

    if method == "POST" and path == "/api/vbook/settings":
        payload = handler._read_json_body()
        return handler.service.set_vbook_settings_global(payload)

    if method == "GET" and path == "/api/vbook/settings/global":
        return handler.service.get_vbook_settings_global()

    if method == "POST" and path == "/api/vbook/settings/global":
        payload = handler._read_json_body()
        return handler.service.set_vbook_settings_global(payload)

    if method == "GET" and path == "/api/vbook/runner":
        return {"ok": True, "runner": handler.service.get_vbook_runner_status()}

    if method == "POST" and path == "/api/vbook/runner/install":
        handler._read_json_body()
        return handler.service.install_vbook_runner()

    if method == "GET" and path == "/api/vbook/settings/effective":
        plugin_id = (query.get("plugin_id", [""])[0] or "").strip()
        return handler.service.get_vbook_settings_effective(plugin_id=plugin_id)

    if path.startswith("/api/vbook/settings/plugin/"):
        plugin_id = unquote_func(path.removeprefix("/api/vbook/settings/plugin/").strip("/"))
        if not plugin_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id.")
        if method == "GET":
            return handler.service.get_vbook_settings_plugin(plugin_id)
        if method == "POST":
            payload = handler._read_json_body()
            return handler.service.set_vbook_settings_plugin(plugin_id, payload)
        if method == "DELETE":
            return handler.service.delete_vbook_settings_plugin(plugin_id)
        return None

    if method == "GET" and path == "/api/vbook/bridge/state":
        return handler.service.get_vbook_bridge_state()

    if method == "POST" and path == "/api/vbook/search/filters":
        payload = handler._read_json_body()
        return handler.service.get_vbook_search_filters(
            plugin_id=str(payload.get("plugin_id") or "").strip(),
            selected_filters=payload.get("filters") if isinstance(payload.get("filters"), dict) else None,
        )

    if method == "POST" and path == "/api/vbook/search":
        payload = handler._read_json_body()
        return handler.service.search_vbook_books(
            plugin_id=str(payload.get("plugin_id") or "").strip(),
            query=str(payload.get("query") or payload.get("q") or "").strip(),
            page=_parse_page(payload),
            next_token=payload.get("next"),
            filters=payload.get("filters") if isinstance(payload.get("filters"), dict) else None,
            search_mode=str(payload.get("search_mode") or payload.get("mode") or "search").strip(),
        )

    if method == "POST" and path == "/api/vbook/home":
        payload = handler._read_json_body()
        return handler.service.get_vbook_home(
            plugin_id=str(payload.get("plugin_id") or "").strip(),
            tab_script=str(payload.get("tab_script") or payload.get("script") or "").strip(),
            tab_input=_resolve_tab_input(payload),
            page=_parse_page(payload),
            next_token=payload.get("next"),
        )

    if method == "POST" and path == "/api/vbook/genre":
        payload = handler._read_json_body()
        return handler.service.get_vbook_genre(
            plugin_id=str(payload.get("plugin_id") or "").strip(),
            tab_script=str(payload.get("tab_script") or payload.get("script") or "").strip(),
            tab_input=_resolve_tab_input(payload),
            page=_parse_page(payload),
            next_token=payload.get("next"),
        )

    if method == "POST" and path == "/api/vbook/detail":
        payload = handler._read_json_body()
        translate_ui_raw = payload.get("translate_ui")
        translate_ui = None if translate_ui_raw is None else _parse_boolish(translate_ui_raw)
        return handler.service.get_vbook_detail(
            url=str(payload.get("url") or "").strip(),
            plugin_id=str(payload.get("plugin_id") or "").strip(),
            translate_ui=translate_ui,
        )

    if method == "POST" and path == "/api/vbook/toc":
        payload = handler._read_json_body()
        translate_ui_raw = payload.get("translate_ui")
        translate_ui = None if translate_ui_raw is None else _parse_boolish(translate_ui_raw)
        return handler.service.get_vbook_toc(
            url=str(payload.get("url") or "").strip(),
            plugin_id=str(payload.get("plugin_id") or "").strip(),
            page=_parse_page(payload),
            page_size=_parse_page(payload, key="page_size", default=120),
            all_items=_parse_boolish(payload.get("all")),
            translate_ui=translate_ui,
        )

    if method == "POST" and path == "/api/vbook/chap":
        payload = handler._read_json_body()
        return handler.service.get_vbook_chap_debug(
            url=str(payload.get("url") or "").strip(),
            plugin_id=str(payload.get("plugin_id") or "").strip(),
        )

    if method == "GET" and path == "/api/vbook/repos":
        repo_items = handler.service.get_vbook_repo_items()
        return {
            "ok": True,
            "items": repo_items,
            "count": len(repo_items),
        }

    if method == "POST" and path == "/api/vbook/repos":
        payload = handler._read_json_body()
        urls_raw = payload.get("repo_urls")
        if not isinstance(urls_raw, list):
            items = payload.get("items")
            if isinstance(items, list):
                urls_raw = [x.get("url") if isinstance(x, dict) else x for x in items]
            else:
                urls_raw = []
        if not urls_raw:
            text_raw = str(
                payload.get("repo_urls_text")
                or payload.get("repo_url")
                or payload.get("url")
                or ""
            ).strip()
            if text_raw:
                urls_raw = [x.strip() for x in re_module.split(r"[\n,;]+", text_raw) if x and x.strip()]
        repo_urls = handler.service.set_vbook_repo_urls(urls_raw)
        return {
            "ok": True,
            "items": [{"url": u, "locked": handler.service.is_vbook_repo_url_locked(u)} for u in repo_urls],
            "count": len(repo_urls),
        }

    if method == "GET" and path == "/api/vbook/repo/plugins":
        repo_url = (query.get("repo_url", [""])[0] or "").strip()
        items, errors = handler.service.list_vbook_repo_plugins(repo_url=repo_url)
        return {
            "ok": True,
            "items": items,
            "errors": errors,
        }

    if method == "POST" and path == "/api/vbook/plugins/install":
        payload = handler._read_json_body()
        plugin = handler.service.install_vbook_plugin(
            plugin_url=str(payload.get("plugin_url") or payload.get("url") or "").strip(),
            plugin_id=str(payload.get("plugin_id") or "").strip(),
        )
        return {"ok": True, "plugin": plugin}

    if method == "POST" and path == "/api/vbook/plugins/install-local":
        form = handler._read_multipart_form()
        part = form.get_file("file")
        if part is None:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu file plugin zip.")
        plugin = handler.service.install_vbook_plugin_local(
            filename=part.filename or "",
            content=part.content,
            plugin_id=str(form.getfirst("plugin_id") or "").strip(),
        )
        return {"ok": True, "plugin": plugin}

    if method == "DELETE" and path.startswith("/api/vbook/plugins/"):
        plugin_id = path.removeprefix("/api/vbook/plugins/").strip("/")
        if not plugin_id:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id.")
        removed = handler.service.remove_vbook_plugin(plugin_id)
        if not removed:
            raise api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy plugin để xóa.")
        return {"ok": True}

    if method == "POST" and path == "/api/library/import-url/prepare":
        payload = handler._read_json_body()
        return handler.service.prepare_import_url(
            (payload.get("url") or "").strip(),
            plugin_id=(payload.get("plugin_id") or "").strip() or None,
            history_only=bool(payload.get("history_only", False)),
        )

    if method == "POST" and path == "/api/library/import-url/commit":
        payload = handler._read_json_body()
        token = str(payload.get("token") or "").strip()
        if not token:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu token import URL.")
        book = handler.service.commit_import_url_token(token)
        return {"ok": True, "book": book}

    if method == "POST" and path == "/api/library/import-url":
        payload = handler._read_json_body()
        book = handler.service.import_vbook_url(
            (payload.get("url") or "").strip(),
            plugin_id=(payload.get("plugin_id") or "").strip() or None,
            history_only=bool(payload.get("history_only", False)),
            prefetched_detail=payload.get("detail") if isinstance(payload.get("detail"), dict) else None,
            prefetched_toc=payload.get("toc") if isinstance(payload.get("toc"), list) else None,
        )
        return {"ok": True, "book": book}

    if method == "POST" and path == "/api/library/import/prepare":
        form = handler._read_multipart_form()
        if "file" not in form:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu file import.")
        file_item = form.get_file("file")
        if file_item is None:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "File không hợp lệ.")
        import_settings = handler._read_form_json_field(form.getfirst("import_settings"))
        return handler.service.prepare_import_file(
            file_item.filename or "import.txt",
            file_item.content,
            (form.getfirst("lang_source") or "zh").strip(),
            (form.getfirst("title") or "").strip(),
            (form.getfirst("author") or "").strip(),
            (form.getfirst("summary") or "").strip(),
            import_settings=import_settings,
        )

    if method == "POST" and path == "/api/library/import/preview":
        payload = handler._read_json_body()
        token = str(payload.get("token") or "").strip()
        return handler.service.preview_import_token(
            token,
            lang_source=str(payload.get("lang_source") or "").strip(),
            title=str(payload.get("title") or "").strip(),
            author=str(payload.get("author") or "").strip(),
            summary=str(payload.get("summary") or "").strip(),
            import_settings=payload.get("import_settings") if isinstance(payload.get("import_settings"), dict) else None,
        )

    if method == "POST" and path == "/api/library/import/commit":
        payload = handler._read_json_body()
        token = str(payload.get("token") or "").strip()
        book = handler.service.commit_import_token(
            token,
            lang_source=str(payload.get("lang_source") or "").strip(),
            title=str(payload.get("title") or "").strip(),
            author=str(payload.get("author") or "").strip(),
            summary=str(payload.get("summary") or "").strip(),
            import_settings=payload.get("import_settings") if isinstance(payload.get("import_settings"), dict) else None,
        )
        return {"ok": True, "book": book}

    if method == "POST" and path == "/api/library/import":
        form = handler._read_multipart_form()
        if "file" not in form:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu file import.")
        file_item = form.get_file("file")
        if file_item is None:
            raise api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "File không hợp lệ.")
        book = handler.service.import_file(
            file_item.filename or "import.txt",
            file_item.content,
            (form.getfirst("lang_source") or "zh").strip(),
            (form.getfirst("title") or "").strip(),
            (form.getfirst("author") or "").strip(),
            summary=(form.getfirst("summary") or "").strip(),
            import_settings=handler._read_form_json_field(form.getfirst("import_settings")),
        )
        return {"ok": True, "book": book}

    return None
