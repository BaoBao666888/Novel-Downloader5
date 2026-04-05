from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

from . import export_runtime


def load_export_job_context(
    job: dict[str, Any],
    *,
    resolve_translate_mode: Callable[[Any], str],
    find_book: Callable[[str], dict[str, Any] | None],
) -> tuple[dict[str, Any], dict[str, Any]]:
    request = export_runtime.parse_export_job(
        job,
        resolve_translate_mode=resolve_translate_mode,
    )
    book = find_book(str(request.get("book_id") or ""))
    if not book:
        raise LookupError("Không tìm thấy truyện để export.")
    return request, book


def execute_export_request(
    *,
    request: dict[str, Any],
    book: dict[str, Any],
    collect_export_chapters: Callable[..., list[dict[str, Any]]],
    resolve_export_metadata: Callable[[dict[str, Any], dict[str, Any] | None], dict[str, str]],
    create_export_file: Callable[..., Path],
    is_book_comic: Callable[[dict[str, Any]], bool],
    progress_callback: Callable[[dict[str, Any]], None] | None = None,
) -> tuple[Path, int]:
    chapters = collect_export_chapters(
        book,
        options=dict(request.get("options") or {}),
        translate_mode=str(request.get("translate_mode") or "server"),
        use_cached_only=True,
        chapter_ids=list(request.get("chapter_ids") or []),
        progress_callback=progress_callback,
    )
    chapters = export_runtime.require_exportable_chapters(chapters)
    export_metadata = resolve_export_metadata(book, dict(request.get("metadata") or {}))
    output = create_export_file(
        fmt_norm=str(request.get("fmt_norm") or ""),
        is_comic=is_book_comic(book),
        metadata=export_metadata,
        chapters=chapters,
        options=dict(request.get("options") or {}),
        lang_source=str(book.get("lang_source") or ""),
    )
    return output, len(chapters)
