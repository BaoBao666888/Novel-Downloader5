from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any


def parse_export_job(
    job: dict[str, Any],
    *,
    resolve_translate_mode: Callable[[Any], str],
) -> dict[str, Any]:
    return {
        "book_id": str(job.get("book_id") or "").strip(),
        "fmt_norm": str(job.get("format") or "txt").strip().lower() or "txt",
        "format_label": str(job.get("format_label") or job.get("format") or "txt").strip().upper() or "TXT",
        "translate_mode": resolve_translate_mode(job.get("translation_mode")),
        "metadata": dict(job.get("metadata") or {}),
        "options": dict(job.get("options") or {}),
        "chapter_ids": [str(item or "").strip() for item in (job.get("chapter_ids") or []) if str(item or "").strip()],
    }


def require_exportable_chapters(chapters: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if chapters:
        return chapters
    raise ValueError("Không còn chương đã tải hợp lệ để xuất. Hãy tải chương trước rồi thử lại.")


def create_export_file(
    *,
    fmt_norm: str,
    is_comic: bool,
    metadata: dict[str, str],
    chapters: list[dict[str, Any]],
    options: dict[str, Any],
    lang_source: str,
    create_txt: Callable[..., Path],
    create_html: Callable[..., Path],
    create_cbz: Callable[..., Path],
    create_epub: Callable[..., Path],
) -> Path:
    if fmt_norm == "txt":
        if is_comic:
            raise ValueError("Truyện tranh không hỗ trợ xuất TXT.")
        return create_txt(
            metadata=metadata,
            chapters=chapters,
            options=options,
        )
    if fmt_norm == "html":
        return create_html(
            metadata=metadata,
            chapters=chapters,
            options=options,
            is_comic=is_comic,
        )
    if fmt_norm == "cbz":
        if not is_comic:
            raise ValueError("CBZ chỉ hỗ trợ cho truyện tranh.")
        return create_cbz(
            metadata=metadata,
            chapters=chapters,
        )
    if fmt_norm == "epub":
        return create_epub(
            metadata=metadata,
            chapters=chapters,
            options=options,
            is_comic=is_comic,
            lang_source=str(lang_source or ""),
        )
    raise ValueError("Định dạng export không hợp lệ.")
