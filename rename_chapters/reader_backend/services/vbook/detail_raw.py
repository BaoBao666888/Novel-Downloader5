from __future__ import annotations

from collections.abc import Callable
from typing import Any


SUGGEST_CANDIDATE_KEYS = (
    "items",
    "list",
    "data",
    "books",
    "book",
    "novels",
    "novel",
    "suggest",
    "suggests",
    "recommend",
    "recommends",
    "related",
)
COMMENT_CANDIDATE_KEYS = (
    "items",
    "list",
    "data",
    "comments",
    "comment",
    "reviews",
    "review",
    "records",
    "rows",
)


def build_detail_raw_payload(
    *,
    plugin: Any,
    source_url: str,
    raw_detail: Any,
    include_detail_sections: bool = True,
    normalize_vbook_display_text: Callable[..., str],
    join_vbook_url: Callable[[str, str], str],
    parse_ongoing: Callable[[Any], bool | None],
    pick_detail_values: Callable[..., list[tuple[str, Any]]],
    build_detail_section_sources: Callable[..., list[dict[str, Any]]],
    collect_detail_sections: Callable[..., list[dict[str, Any]]],
    collect_suggest_items: Callable[[Any, Any], list[dict[str, Any]]],
    collect_comment_items: Callable[[Any, Any], list[dict[str, Any]]],
    flatten_sections: Callable[[list[dict[str, Any]]], list[dict[str, Any]]],
    normalize_genre_items: Callable[[dict[str, Any]], list[dict[str, Any]]],
    normalize_extra_fields: Callable[[dict[str, Any]], list[dict[str, str]]],
) -> dict[str, Any]:
    detail = raw_detail if isinstance(raw_detail, dict) else {}
    title = normalize_vbook_display_text(str(detail.get("name") or detail.get("title") or ""), single_line=True) or source_url
    author = normalize_vbook_display_text(str(detail.get("author") or ""), single_line=True)
    cover = str(detail.get("cover") or detail.get("image") or "").strip()
    description = normalize_vbook_display_text(
        str(detail.get("description") or detail.get("desc") or ""),
        single_line=False,
    )
    host = str(detail.get("host") or "").strip()
    if cover and host and not cover.startswith("http"):
        cover = join_vbook_url(host, cover)
    is_comic = "comic" in str(getattr(plugin, "type", "") or "").lower()
    ongoing_raw = detail.get("ongoing")
    ongoing = parse_ongoing(ongoing_raw)
    if ongoing is True:
        status_text = "Còn tiếp"
    elif ongoing is False:
        status_text = "Hoàn thành"
    else:
        status_text = normalize_vbook_display_text(str(ongoing_raw or ""), single_line=True)
    info_text = normalize_vbook_display_text(str(detail.get("detail") or ""), single_line=False)

    suggest_raw_values = pick_detail_values(
        detail,
        exact_keys=("suggest", "suggests", "recommend", "recommends", "related"),
        fuzzy_tokens=("suggest", "recommend", "related"),
    )
    comment_raw_values = pick_detail_values(
        detail,
        exact_keys=("comment", "comments", "review", "reviews"),
        fuzzy_tokens=("comment", "review"),
    )
    suggest_sources = build_detail_section_sources(
        suggest_raw_values,
        default_title="Gợi ý",
        candidate_keys=SUGGEST_CANDIDATE_KEYS,
    )
    comment_sources = build_detail_section_sources(
        comment_raw_values,
        default_title="Bình luận",
        candidate_keys=COMMENT_CANDIDATE_KEYS,
    )
    suggest_sections = (
        collect_detail_sections(
            plugin,
            suggest_raw_values,
            default_title="Gợi ý",
            candidate_keys=SUGGEST_CANDIDATE_KEYS,
            item_collector=lambda raw: collect_suggest_items(plugin, raw),
        )
        if include_detail_sections
        else []
    )
    comment_sections = (
        collect_detail_sections(
            plugin,
            comment_raw_values,
            default_title="Bình luận",
            candidate_keys=COMMENT_CANDIDATE_KEYS,
            item_collector=lambda raw: collect_comment_items(plugin, raw),
        )
        if include_detail_sections
        else []
    )
    suggest_items = flatten_sections(suggest_sections)
    comment_items = flatten_sections(comment_sections)
    return {
        "plugin": plugin,
        "detail": {
            "title_raw": title,
            "author_raw": author,
            "cover_raw": cover,
            "description_raw": description,
            "url": source_url,
            "host": host,
            "is_comic": is_comic,
            "source_type": "vbook_comic" if is_comic else "vbook",
            "ongoing": ongoing,
            "status_text_raw": status_text,
            "info_text_raw": info_text,
            "genres": normalize_genre_items(detail),
            "suggest_sections": suggest_sections,
            "suggest_items": suggest_items,
            "suggest_sources": suggest_sources,
            "comment_sections": comment_sections,
            "comment_items": comment_items,
            "comment_sources": comment_sources,
            "extra_fields": normalize_extra_fields(detail),
        },
    }
