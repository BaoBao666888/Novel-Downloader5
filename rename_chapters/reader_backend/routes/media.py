from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse


@dataclass(frozen=True)
class MediaDeps:
    api_error_cls: Any
    http_status: Any
    export_dir: Path
    cover_dir: Path
    cache_dir: Path
    mimetypes_module: Any
    quote_func: Any
    unquote_func: Any
    re_module: Any


def _send_binary(
    handler,
    data: bytes,
    *,
    http_status,
    content_type: str,
    cache_control: str,
    content_disposition: str | None = None,
) -> None:
    handler.send_response(http_status.OK)
    handler.send_header("Content-Type", content_type or "application/octet-stream")
    handler.send_header("Content-Length", str(len(data)))
    handler.send_header("Cache-Control", cache_control)
    if content_disposition:
        handler.send_header("Content-Disposition", content_disposition)
    try:
        handler.end_headers()
        handler.wfile.write(data)
    except OSError as exc:
        if handler._is_client_disconnect_error(exc):
            return
        raise


def _resolve_disk_media(path: str, deps: MediaDeps) -> tuple[str, Path] | None:
    if path.startswith("/media/export/"):
        filename = Path(deps.unquote_func(path.removeprefix("/media/export/").strip()).replace("\\", "/")).name
        return filename, deps.export_dir / filename
    if path.startswith("/media/cover/"):
        filename = Path(deps.unquote_func(path.removeprefix("/media/cover/").strip()).replace("\\", "/")).name
        return filename, deps.cover_dir / filename
    if path.startswith("/media/epub/"):
        filename = Path(deps.unquote_func(path.removeprefix("/media/epub/").strip()).replace("\\", "/")).name
        return filename, deps.cache_dir / "epub_sources" / filename
    return None


def serve_media(handler, parsed_or_path, *, deps: MediaDeps) -> None:
    api_error = deps.api_error_cls
    http_status = deps.http_status
    parsed = parsed_or_path if hasattr(parsed_or_path, "path") else urlparse(str(parsed_or_path or ""))
    path = parsed.path
    query = parse_qs(parsed.query)

    if path == "/media/vbook-image":
        image_url = (query.get("url", [""])[0] or "").strip()
        plugin_id = (query.get("plugin_id", [""])[0] or "").strip()
        referer = (query.get("referer", [""])[0] or "").strip()
        cache_enabled = (query.get("cache", [""])[0] or "").strip().lower() in {"1", "true", "yes", "on"}
        if not image_url:
            handler._send_error_json(api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu URL ảnh vBook."))
            return
        try:
            data, content_type = handler.service.fetch_vbook_image(
                image_url=image_url,
                plugin_id=plugin_id,
                referer=referer,
                use_cache=cache_enabled,
                interactive=True,
            )
        except api_error as exc:
            handler._send_error_json(exc)
            return
        _send_binary(
            handler,
            data,
            http_status=http_status,
            content_type=content_type or "application/octet-stream",
            cache_control="public, max-age=600",
        )
        return

    if path == "/media/vbook-plugin-icon":
        plugin_id = (query.get("plugin_id", [""])[0] or "").strip()
        if not plugin_id:
            handler._send_error_json(api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu plugin_id."))
            return
        try:
            data, content_type = handler.service.get_vbook_plugin_icon(plugin_id)
        except api_error as exc:
            handler._send_error_json(exc)
            return
        _send_binary(
            handler,
            data,
            http_status=http_status,
            content_type=content_type or "application/octet-stream",
            cache_control="public, max-age=86400",
        )
        return

    if path.startswith("/media/supplement/"):
        batch_id = deps.unquote_func(path.removeprefix("/media/supplement/").strip("/"))
        book_id = (query.get("book_id", [""])[0] or "").strip()
        if not batch_id or not book_id:
            handler._send_error_json(api_error(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id hoặc batch_id."))
            return
        try:
            payload = handler.service.get_book_supplement_source_download(book_id, batch_id)
        except ValueError as exc:
            handler._send_error_json(api_error(http_status.NOT_FOUND, "NOT_FOUND", str(exc)))
            return
        filename = str((payload or {}).get("file_name") or "").strip() or f"{batch_id}.txt"
        safe_ascii = deps.re_module.sub(r"[^A-Za-z0-9._-]+", "_", filename).strip("._") or "supplement.bin"
        content_disposition = (
            f"attachment; filename=\"{safe_ascii}\"; filename*=UTF-8''{deps.quote_func(filename, safe='')}"
        )
        _send_binary(
            handler,
            bytes((payload or {}).get("data") or b""),
            http_status=http_status,
            content_type=str((payload or {}).get("content_type") or "application/octet-stream"),
            cache_control="no-store",
            content_disposition=content_disposition,
        )
        return

    resolved = _resolve_disk_media(path, deps)
    if resolved is None:
        handler._send_error_json(api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy tài nguyên media."))
        return

    filename, file_path = resolved
    if not file_path.exists() or not file_path.is_file():
        handler._send_error_json(api_error(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy file."))
        return

    content_type = deps.mimetypes_module.guess_type(str(file_path))[0] or "application/octet-stream"
    content_disposition = None
    if path.startswith("/media/export/") and filename:
        safe_ascii = deps.re_module.sub(r"[^A-Za-z0-9._-]+", "_", filename).strip("._") or "export.bin"
        content_disposition = (
            f"attachment; filename=\"{safe_ascii}\"; filename*=UTF-8''{deps.quote_func(filename, safe='')}"
        )
    _send_binary(
        handler,
        file_path.read_bytes(),
        http_status=http_status,
        content_type=content_type,
        cache_control="no-store",
        content_disposition=content_disposition,
    )
