from __future__ import annotations

from collections.abc import Callable
from typing import Any


def _dict_rows(value: Any) -> list[dict[str, Any]]:
    return [dict(row or {}) for row in (value or []) if isinstance(row, dict)]


def _normalize_sections(value: Any, default_title: str) -> list[dict[str, Any]]:
    sections: list[dict[str, Any]] = []
    for section in value or []:
        if not isinstance(section, dict):
            continue
        title = str(section.get("title") or section.get("title_raw") or default_title).strip() or default_title
        title_raw = str(section.get("title_raw") or section.get("title") or default_title).strip() or default_title
        sections.append(
            {
                "title": title,
                "title_raw": title_raw,
                "items": _dict_rows(section.get("items")),
            }
        )
    return sections


def _serialize_sections(sections: list[dict[str, Any]], default_title: str) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for section in sections:
        if not isinstance(section, dict):
            continue
        items = _dict_rows(section.get("items"))
        out.append(
            {
                "title": str(section.get("title") or "").strip() or default_title,
                "title_raw": str(section.get("title_raw") or section.get("title") or "").strip() or default_title,
                "items": items,
                "count": len(items),
            }
        )
    return out


def _apply_translated_values(
    rows: list[dict[str, Any]],
    key: str,
    translated: list[str],
    *,
    fallback_key: str = "",
) -> None:
    for idx, row in enumerate(rows):
        if not isinstance(row, dict):
            continue
        fallback = fallback_key or key
        row[key] = translated[idx] if idx < len(translated) else str(row.get(fallback) or "")


def _translate_detail_response(
    *,
    title: str,
    author: str,
    status_text: str,
    description: str,
    info_text: str,
    suggest_items: list[dict[str, Any]],
    suggest_sections: list[dict[str, Any]],
    suggest_sources: list[dict[str, Any]],
    comment_items: list[dict[str, Any]],
    comment_sections: list[dict[str, Any]],
    comment_sources: list[dict[str, Any]],
    genre_items: list[dict[str, Any]],
    extra_fields: list[dict[str, Any]],
    mode: str,
    translate_texts_batch: Callable[..., list[str]],
) -> tuple[str, str, str, str, str]:
    translated_head = translate_texts_batch([title, author, status_text], single_line=True, mode=mode)
    translated_body = translate_texts_batch([description, info_text], single_line=False, mode=mode)
    if len(translated_head) >= 3:
        title, author, status_text = translated_head[:3]
    if len(translated_body) >= 2:
        description, info_text = translated_body[:2]

    if suggest_items:
        section_titles = translate_texts_batch(
            [str(section.get("title_raw") or section.get("title") or "") for section in suggest_sections],
            single_line=True,
            mode=mode,
        )
        _apply_translated_values(suggest_sections, "title", section_titles, fallback_key="title_raw")
        _apply_translated_values(
            suggest_items,
            "title",
            translate_texts_batch([str(item.get("title") or "") for item in suggest_items], single_line=True, mode=mode),
        )
        _apply_translated_values(
            suggest_items,
            "author",
            translate_texts_batch([str(item.get("author") or "") for item in suggest_items], single_line=True, mode=mode),
        )
        _apply_translated_values(
            suggest_items,
            "description",
            translate_texts_batch(
                [str(item.get("description") or "") for item in suggest_items],
                single_line=False,
                mode=mode,
            ),
        )
    if suggest_sources:
        _apply_translated_values(
            suggest_sources,
            "title",
            translate_texts_batch(
                [str(source.get("title_raw") or source.get("title") or "") for source in suggest_sources],
                single_line=True,
                mode=mode,
            ),
            fallback_key="title_raw",
        )

    if comment_items:
        section_titles = translate_texts_batch(
            [str(section.get("title_raw") or section.get("title") or "") for section in comment_sections],
            single_line=True,
            mode=mode,
        )
        _apply_translated_values(comment_sections, "title", section_titles, fallback_key="title_raw")
        _apply_translated_values(
            comment_items,
            "author",
            translate_texts_batch([str(item.get("author") or "") for item in comment_items], single_line=True, mode=mode),
        )
        _apply_translated_values(
            comment_items,
            "content",
            translate_texts_batch([str(item.get("content") or "") for item in comment_items], single_line=False, mode=mode),
        )
    if comment_sources:
        _apply_translated_values(
            comment_sources,
            "title",
            translate_texts_batch(
                [str(source.get("title_raw") or source.get("title") or "") for source in comment_sources],
                single_line=True,
                mode=mode,
            ),
            fallback_key="title_raw",
        )

    if genre_items:
        _apply_translated_values(
            genre_items,
            "title",
            translate_texts_batch([str(item.get("title") or "") for item in genre_items], single_line=True, mode=mode),
        )
    if extra_fields:
        _apply_translated_values(
            extra_fields,
            "key",
            translate_texts_batch([str(item.get("key") or "") for item in extra_fields], single_line=True, mode=mode),
        )
        _apply_translated_values(
            extra_fields,
            "value",
            translate_texts_batch([str(item.get("value") or "") for item in extra_fields], single_line=False, mode=mode),
        )
    return title, author, status_text, description, info_text


def build_detail_response(
    *,
    plugin: Any,
    detail: dict[str, Any],
    source_url: str,
    translate_on: bool,
    translation_mode: str,
    normalize_vbook_display_text: Callable[..., str],
    build_image_proxy_path: Callable[..., str],
    flatten_sections: Callable[[list[dict[str, Any]]], list[dict[str, Any]]],
    serialize_plugin: Callable[[Any], dict[str, Any]],
    translate_texts_batch: Callable[..., list[str]],
) -> dict[str, Any]:
    source_url = str(detail.get("url") or source_url or "").strip()
    title_raw = normalize_vbook_display_text(str(detail.get("title_raw") or ""), single_line=True) or source_url
    author_raw = normalize_vbook_display_text(str(detail.get("author_raw") or ""), single_line=True)
    description_raw = normalize_vbook_display_text(str(detail.get("description_raw") or ""), single_line=False)
    status_text_raw = normalize_vbook_display_text(str(detail.get("status_text_raw") or ""), single_line=True)
    info_text_raw = normalize_vbook_display_text(str(detail.get("info_text_raw") or ""), single_line=False)
    title = title_raw
    author = author_raw
    description = description_raw
    status_text = status_text_raw
    info_text = info_text_raw
    cover_raw = str(detail.get("cover_raw") or "").strip()
    cover = build_image_proxy_path(
        cover_raw,
        plugin_id=str(getattr(plugin, "plugin_id", "") or "").strip(),
        referer=source_url,
    )

    suggest_items = _dict_rows(detail.get("suggest_items"))
    comment_items = _dict_rows(detail.get("comment_items"))
    suggest_sections = _normalize_sections(detail.get("suggest_sections"), "Gợi ý")
    comment_sections = _normalize_sections(detail.get("comment_sections"), "Bình luận")
    if suggest_sections:
        suggest_items = flatten_sections(suggest_sections)
    elif suggest_items:
        suggest_sections = [{"title": "Gợi ý", "title_raw": "Gợi ý", "items": suggest_items}]
    if comment_sections:
        comment_items = flatten_sections(comment_sections)
    elif comment_items:
        comment_sections = [{"title": "Bình luận", "title_raw": "Bình luận", "items": comment_items}]

    genre_items = _dict_rows(detail.get("genres"))
    extra_fields = _dict_rows(detail.get("extra_fields"))
    suggest_sources = _dict_rows(detail.get("suggest_sources"))
    comment_sources = _dict_rows(detail.get("comment_sources"))

    if translate_on:
        title, author, status_text, description, info_text = _translate_detail_response(
            title=title,
            author=author,
            status_text=status_text,
            description=description,
            info_text=info_text,
            suggest_items=suggest_items,
            suggest_sections=suggest_sections,
            suggest_sources=suggest_sources,
            comment_items=comment_items,
            comment_sections=comment_sections,
            comment_sources=comment_sources,
            genre_items=genre_items,
            extra_fields=extra_fields,
            mode=translation_mode,
            translate_texts_batch=translate_texts_batch,
        )

    return {
        "ok": True,
        "plugin": serialize_plugin(plugin),
        "detail": {
            "title": title,
            "author": author,
            "title_raw": title_raw,
            "author_raw": author_raw,
            "cover": cover,
            "cover_raw": cover_raw,
            "description": description,
            "description_raw": description_raw,
            "url": source_url,
            "host": str(detail.get("host") or "").strip(),
            "is_comic": bool(detail.get("is_comic")),
            "source_type": str(detail.get("source_type") or ("vbook_comic" if bool(detail.get("is_comic")) else "vbook")),
            "ongoing": detail.get("ongoing"),
            "status_text": status_text,
            "status_text_raw": status_text_raw,
            "info_text": info_text,
            "info_text_raw": info_text_raw,
            "genres": genre_items,
            "suggest_sections": _serialize_sections(suggest_sections, "Gợi ý"),
            "suggest_items": suggest_items,
            "suggest_sources": suggest_sources,
            "comment_sections": _serialize_sections(comment_sections, "Bình luận"),
            "comment_items": comment_items,
            "comment_sources": comment_sources,
            "extra_fields": extra_fields,
        },
    }
