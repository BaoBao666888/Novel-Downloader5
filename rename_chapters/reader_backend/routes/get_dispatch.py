"""GET request dispatcher for stream, media, API, and reader UI routes."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from reader_backend.routes import export_download as http_export_download_support
from reader_backend.routes import media as http_media_support
from reader_backend.routes import name_filter as http_name_filter_support
from reader_backend.routes import notifications as http_notifications_support
from reader_backend.routes import route_matchers as http_routes_support


@dataclass(frozen=True)
class GetDispatchDeps:
    api_error_cls: type[Exception]
    http_status: Any
    export_dir: Path
    cover_dir: Path
    cache_dir: Path
    mimetypes_module: Any
    quote_func: Any
    unquote_func: Any
    re_module: Any


_UI_ROUTE_MAP = {
    "/": "/library.html",
    "": "/library.html",
    "/index.html": "/library.html",
    "/library": "/library.html",
    "/search": "/search.html",
    "/explore": "/explore.html",
    "/online-search": "/online-search.html",
    "/book": "/book.html",
    "/reader": "/reader.html",
}


def handle_get(handler: Any, parsed: Any, *, deps: GetDispatchDeps) -> None:
    path = str(parsed.path or "")
    if path == "/api/notifications/stream":
        http_notifications_support.stream_notifications(handler, parsed, http_status=deps.http_status)
        return

    if path == "/api/library/name-filter/jobs/stream":
        http_name_filter_support.stream_name_filter_jobs(handler, parsed, http_status=deps.http_status)
        return

    route = http_routes_support.match_export_download_route("GET", path)
    if route is not None and route.name == "export_jobs_stream":
        http_export_download_support.stream_export_jobs(
            handler,
            parsed,
            route_support=http_routes_support,
            http_status=deps.http_status,
        )
        return
    if route is not None and route.name == "download_jobs_stream":
        http_export_download_support.stream_download_jobs(
            handler,
            parsed,
            route_support=http_routes_support,
            http_status=deps.http_status,
        )
        return

    if path.startswith("/api/"):
        handler._dispatch_api("GET", parsed)
        return

    if path.startswith("/media/"):
        http_media_support.serve_media(
            handler,
            parsed,
            deps=http_media_support.MediaDeps(
                api_error_cls=deps.api_error_cls,
                http_status=deps.http_status,
                export_dir=deps.export_dir,
                cover_dir=deps.cover_dir,
                cache_dir=deps.cache_dir,
                mimetypes_module=deps.mimetypes_module,
                quote_func=deps.quote_func,
                unquote_func=deps.unquote_func,
                re_module=deps.re_module,
            ),
        )
        return

    if path == "/favicon.ico":
        favicon_path = Path(str(handler.directory or "")) / "favicon.ico"
        if favicon_path.exists():
            handler._serve_static_get()
            return
        handler.send_response(deps.http_status.NO_CONTENT)
        handler.send_header("Content-Length", "0")
        try:
            handler.end_headers()
        except OSError as exc:
            if handler._is_client_disconnect_error(exc):
                return
            raise
        return

    if path in _UI_ROUTE_MAP:
        handler.path = _UI_ROUTE_MAP[path]
        handler._serve_static_get()
        return

    handler._serve_static_get()
