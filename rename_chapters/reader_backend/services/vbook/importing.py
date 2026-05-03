from __future__ import annotations

from collections.abc import Callable
from typing import Any


def normalize_prefetched_toc_rows(
    prefetched_toc: list[dict[str, Any]] | None,
    *,
    join_vbook_url: Callable[[str, str], str],
    normalize_vbook_display_text: Callable[..., str],
) -> list[dict[str, Any]]:
    toc_rows: list[dict[str, Any]] = []
    if not isinstance(prefetched_toc, list):
        return toc_rows
    for row in prefetched_toc:
        if not isinstance(row, dict):
            continue
        ch_title = normalize_vbook_display_text(
            str(row.get("title_raw") or row.get("title") or row.get("name") or ""),
            single_line=True,
        )
        href = str(row.get("remote_url") or row.get("url") or "").strip()
        host = str(row.get("host") or "").strip()
        remote_url = href if href.startswith(("http://", "https://")) else join_vbook_url(host, href)
        if not ch_title or not remote_url:
            continue
        toc_rows.append(
            {
                "name": ch_title,
                "remote_url": remote_url,
                "is_vip": bool(row.get("is_vip") or row.get("vip") or row.get("pay")),
            }
        )
    return toc_rows


def build_import_fields(
    *,
    plugin: Any,
    source_url: str,
    detail: dict[str, Any],
    history_only: bool = False,
    normalize_vbook_display_text: Callable[..., str],
    normalize_lang_source: Callable[[str], str],
) -> dict[str, Any]:
    title = normalize_vbook_display_text(
        str(detail.get("title_raw") or detail.get("name") or detail.get("title") or ""),
        single_line=True,
    ) or source_url
    author = normalize_vbook_display_text(str(detail.get("author_raw") or detail.get("author") or ""), single_line=True)
    cover_path = str(detail.get("cover_raw") or "").strip()
    if not cover_path:
        cover_candidate = str(detail.get("cover") or "").strip()
        if cover_candidate.startswith(("http://", "https://", "data:")):
            cover_path = cover_candidate
    plugin_type = str(getattr(plugin, "type", "") or "").strip().lower()
    if history_only:
        source_type = "vbook_session_comic" if "comic" in plugin_type else "vbook_session"
    else:
        source_type = "vbook_comic" if "comic" in plugin_type else "vbook"
    summary = normalize_vbook_display_text(
        str(detail.get("description_raw") or detail.get("description") or ""),
        single_line=False,
    ) or (
        "Truyện tranh được import từ URL (vBook extension)."
        if "comic" in source_type
        else "Truyện được import từ URL (vBook extension)."
    )
    locale_norm = normalize_lang_source(str(getattr(plugin, "locale", "") or ""))
    return {
        "title": title,
        "author": author,
        "cover_path": cover_path,
        "source_type": source_type,
        "summary": summary,
        "extra_link": source_url,
        "lang_source": locale_norm or "zh",
    }


def build_import_chapters(
    toc_rows: list[dict[str, Any]],
    *,
    normalize_vbook_display_text: Callable[..., str],
) -> list[dict[str, Any]]:
    chapters: list[dict[str, Any]] = []
    for idx, row in enumerate(toc_rows, start=1):
        ch_title = normalize_vbook_display_text(
            str((row or {}).get("name") or f"Chương {idx}"),
            single_line=True,
        ) or f"Chương {idx}"
        remote_url = str((row or {}).get("remote_url") or "").strip()
        if not remote_url:
            continue
        chapters.append(
            {
                "title": ch_title,
                "remote_url": remote_url,
                "is_vip": bool((row or {}).get("is_vip") or (row or {}).get("vip") or (row or {}).get("pay")),
            }
        )
    return chapters
