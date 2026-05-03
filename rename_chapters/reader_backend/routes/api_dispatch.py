"""Top-level API dispatcher for the reader HTTP handler."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qs

from reader_backend.routes import export_download as http_export_download_support
from reader_backend.routes import library_reader as http_library_reader_support
from reader_backend.routes import misc as http_misc_support
from reader_backend.routes import name_filter as http_name_filter_support
from reader_backend.routes import notifications as http_notifications_support
from reader_backend.routes import route_matchers as http_routes_support
from reader_backend.routes import tts as http_tts_support
from reader_backend.routes import vbook_import as http_vbook_import_support


@dataclass(frozen=True)
class ApiDispatchDeps:
    api_error_cls: type[Exception]
    http_status: Any
    cache_dir: Any
    theme_presets: Any
    normalize_vbook_display_text: Any
    normalize_vi_display_text: Any
    normalize_newlines: Any
    decode_comic_payload: Any
    encode_comic_payload: Any
    build_vbook_image_proxy_path: Any
    map_selection_to_name_source: Any
    map_selection_to_source_segment: Any
    text_snippet: Any
    utc_now_iso: Any
    normalize_name_set: Any
    build_incremental_hv_suggestions: Any
    build_name_right_suggestions: Any
    translator_logic: Any
    vbook_local_translate: Any
    re_module: Any
    quote_func: Any
    unquote_func: Any


def handle_api(handler: Any, method: str, parsed: Any, *, deps: ApiDispatchDeps) -> dict[str, Any]:
    path = parsed.path
    query = parse_qs(parsed.query)

    export_download_result = http_export_download_support.handle_api(
        handler,
        method,
        path,
        query,
        route_support=http_routes_support,
    )
    if export_download_result is not None:
        return export_download_result

    name_filter_result = http_name_filter_support.handle_api(handler, method, path, query)
    if name_filter_result is not None:
        return name_filter_result

    notifications_result = http_notifications_support.handle_api(
        handler,
        method,
        path,
        query,
        api_error_cls=deps.api_error_cls,
        http_status=deps.http_status,
    )
    if notifications_result is not None:
        return notifications_result

    vbook_import_result = http_vbook_import_support.handle_api(
        handler,
        method,
        path,
        query,
        api_error_cls=deps.api_error_cls,
        http_status=deps.http_status,
        re_module=deps.re_module,
        unquote_func=deps.unquote_func,
    )
    if vbook_import_result is not None:
        return vbook_import_result

    tts_result = http_tts_support.handle_api(
        handler,
        method,
        path,
        query,
        api_error_cls=deps.api_error_cls,
        http_status=deps.http_status,
    )
    if tts_result is not None:
        return tts_result

    library_reader_result = http_library_reader_support.handle_api(
        handler,
        method,
        path,
        query,
        deps=http_library_reader_support.LibraryReaderDeps(
            api_error_cls=deps.api_error_cls,
            http_status=deps.http_status,
            cache_dir=deps.cache_dir,
            normalize_vbook_display_text=deps.normalize_vbook_display_text,
            normalize_vi_display_text=deps.normalize_vi_display_text,
            normalize_newlines=deps.normalize_newlines,
            decode_comic_payload=deps.decode_comic_payload,
            encode_comic_payload=deps.encode_comic_payload,
            build_vbook_image_proxy_path=deps.build_vbook_image_proxy_path,
            map_selection_to_name_source=deps.map_selection_to_name_source,
            map_selection_to_source_segment=deps.map_selection_to_source_segment,
            text_snippet=deps.text_snippet,
        ),
    )
    if library_reader_result is not None:
        return library_reader_result

    misc_result = http_misc_support.handle_api(
        handler,
        method,
        path,
        query,
        deps=http_misc_support.MiscApiDeps(
            api_error_cls=deps.api_error_cls,
            http_status=deps.http_status,
            theme_presets=deps.theme_presets,
            utc_now_iso=deps.utc_now_iso,
            normalize_newlines=deps.normalize_newlines,
            normalize_name_set=deps.normalize_name_set,
            build_incremental_hv_suggestions=deps.build_incremental_hv_suggestions,
            build_name_right_suggestions=deps.build_name_right_suggestions,
            translator_logic=deps.translator_logic,
            vbook_local_translate=deps.vbook_local_translate,
            re_module=deps.re_module,
            quote_func=deps.quote_func,
            unquote_func=deps.unquote_func,
        ),
    )
    if misc_result is not None:
        return misc_result

    raise deps.api_error_cls(deps.http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy endpoint.")
