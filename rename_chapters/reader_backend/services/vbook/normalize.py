"""Pure vBook normalization helpers."""

from __future__ import annotations

import json
from collections.abc import Callable
from typing import Any


def extract_vbook_list_rows(data: Any) -> list[Any]:
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("items", "data", "list", "results", "books"):
            value = data.get(key)
            if isinstance(value, list):
                return value
            if isinstance(value, dict):
                nested = extract_vbook_list_rows(value)
                if nested:
                    return nested
        numeric_rows: list[tuple[int, Any]] = []
        for raw_key, raw_value in data.items():
            key_text = str(raw_key or "").strip()
            if not key_text.isdigit():
                continue
            try:
                numeric_rows.append((int(key_text), raw_value))
            except Exception:
                continue
        if numeric_rows:
            numeric_rows.sort(key=lambda item: item[0])
            return [value for _, value in numeric_rows]
        object_rows = [
            value
            for value in data.values()
            if isinstance(value, dict)
            and any(
                field in value
                for field in ("name", "title", "label", "link", "url", "detail_url", "script", "input")
            )
        ]
        if object_rows:
            return object_rows
        for value in data.values():
            if isinstance(value, list):
                return value
        return [data]
    return []


def has_non_empty_vbook_value(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, tuple, set, dict)):
        return bool(value)
    return True


def pick_vbook_detail_value(
    detail: dict[str, Any],
    *,
    exact_keys: tuple[str, ...],
    fuzzy_tokens: tuple[str, ...] = (),
) -> Any:
    if not isinstance(detail, dict):
        return None

    for key in exact_keys:
        if key in detail:
            value = detail.get(key)
            if has_non_empty_vbook_value(value):
                return value

    lowered: dict[str, Any] = {}
    for raw_key, raw_value in detail.items():
        lowered[str(raw_key or "").strip().lower()] = raw_value
    for key in exact_keys:
        value = lowered.get(str(key or "").strip().lower())
        if has_non_empty_vbook_value(value):
            return value

    if fuzzy_tokens:
        tokens = tuple(str(token or "").strip().lower() for token in fuzzy_tokens if str(token or "").strip())
        if tokens:
            scalar_candidate: Any = None
            for raw_key, raw_value in detail.items():
                key_text = str(raw_key or "").strip().lower()
                if not key_text:
                    continue
                if any(token in key_text for token in tokens):
                    if not has_non_empty_vbook_value(raw_value):
                        continue
                    if isinstance(raw_value, (list, dict)):
                        return raw_value
                    if any(marker in key_text for marker in ("count", "total", "size", "num", "number")):
                        continue
                    if scalar_candidate is None:
                        scalar_candidate = raw_value
            if has_non_empty_vbook_value(scalar_candidate):
                return scalar_candidate

    return None


def pick_vbook_detail_values(
    detail: dict[str, Any],
    *,
    exact_keys: tuple[str, ...],
    fuzzy_tokens: tuple[str, ...] = (),
) -> list[tuple[str, Any]]:
    if not isinstance(detail, dict):
        return []
    out: list[tuple[str, Any]] = []
    seen_keys: set[str] = set()
    lowered: dict[str, tuple[str, Any]] = {}
    for raw_key, raw_value in detail.items():
        key_text = str(raw_key or "").strip()
        key_lower = key_text.lower()
        if key_lower:
            lowered[key_lower] = (key_text, raw_value)

    for key in exact_keys:
        key_lower = str(key or "").strip().lower()
        if not key_lower or key_lower in seen_keys:
            continue
        pair: tuple[str, Any] | None = None
        if key in detail:
            pair = (key, detail.get(key))
        elif key_lower in lowered:
            pair = lowered.get(key_lower)
        if not pair:
            continue
        raw_key, value = pair
        if has_non_empty_vbook_value(value):
            seen_keys.add(key_lower)
            out.append((str(raw_key or key).strip() or key, value))

    if out or not fuzzy_tokens:
        return out

    tokens = tuple(str(token or "").strip().lower() for token in fuzzy_tokens if str(token or "").strip())
    if not tokens:
        return out
    scalar_candidates: list[tuple[str, Any]] = []
    for raw_key, raw_value in detail.items():
        key_text = str(raw_key or "").strip()
        key_lower = key_text.lower()
        if not key_lower or key_lower in seen_keys:
            continue
        if not any(token in key_lower for token in tokens):
            continue
        if not has_non_empty_vbook_value(raw_value):
            continue
        if any(marker in key_lower for marker in ("count", "total", "size", "num", "number")):
            continue
        if isinstance(raw_value, (list, dict)):
            seen_keys.add(key_lower)
            out.append((key_text, raw_value))
        else:
            scalar_candidates.append((key_text, raw_value))
    if not out and scalar_candidates:
        out.append(scalar_candidates[0])
    return out


def normalize_vbook_text_flexible(
    value: Any,
    *,
    single_line: bool = False,
    normalize_vbook_display_text,
) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return normalize_vbook_display_text(value, single_line=single_line)
    if isinstance(value, (int, float, bool)):
        return normalize_vbook_display_text(str(value), single_line=single_line)
    if isinstance(value, dict):
        for key in ("content", "comment", "text", "body", "message", "msg", "detail", "desc", "value"):
            if key in value:
                text = normalize_vbook_text_flexible(
                    value.get(key),
                    single_line=single_line,
                    normalize_vbook_display_text=normalize_vbook_display_text,
                )
                if text:
                    return text
        rows = extract_vbook_list_rows(value)
        if rows and not (len(rows) == 1 and rows[0] is value):
            parts = [
                normalize_vbook_text_flexible(
                    row,
                    single_line=False,
                    normalize_vbook_display_text=normalize_vbook_display_text,
                )
                for row in rows
            ]
            parts = [part for part in parts if part]
            if parts:
                return normalize_vbook_display_text("\n".join(parts), single_line=single_line)
        return ""
    if isinstance(value, (list, tuple, set)):
        parts = [
            normalize_vbook_text_flexible(
                item,
                single_line=False,
                normalize_vbook_display_text=normalize_vbook_display_text,
            )
            for item in value
        ]
        parts = [part for part in parts if part]
        if not parts:
            return ""
        return normalize_vbook_display_text("\n".join(parts), single_line=single_line)
    return normalize_vbook_display_text(str(value), single_line=single_line)


def normalize_vbook_tab_item(
    item: Any,
    *,
    translate_ui: bool = True,
    normalize_vbook_display_text: Callable[..., str],
    is_translation_enabled: Callable[[], bool],
    reader_translation_mode: Callable[[], str],
    translate_text: Callable[..., str],
) -> dict[str, Any] | None:
    if isinstance(item, str):
        text = normalize_vbook_display_text(str(item), single_line=True)
        if not text:
            return None
        if translate_ui and is_translation_enabled():
            mode = reader_translation_mode()
            text = translate_text(text, single_line=True, mode=mode) or text
        return {
            "title": text,
            "script": "",
            "input": text,
        }
    if not isinstance(item, dict):
        return None
    title = normalize_vbook_display_text(
        str(item.get("title") or item.get("name") or item.get("label") or ""),
        single_line=True,
    )
    script = str(item.get("script") or item.get("file") or "").strip()
    raw_input = item.get("input")
    if raw_input is None:
        raw_input = item.get("link")
    if raw_input is None:
        raw_input = item.get("url")
    if not title:
        return None
    if translate_ui and is_translation_enabled():
        mode = reader_translation_mode()
        title = translate_text(title, single_line=True, mode=mode) or title
    if isinstance(raw_input, (dict, list, str, int, float, bool)) or raw_input is None:
        input_value = raw_input
    else:
        input_value = str(raw_input)
    return {
        "title": title,
        "script": script,
        "input": input_value,
    }


def normalize_vbook_search_item(
    plugin: Any,
    item: dict[str, Any],
    *,
    query: str,
    translate_ui: bool = True,
    join_vbook_url: Callable[[str, str], str],
    build_vbook_image_proxy_path: Callable[..., str],
    normalize_vbook_display_text: Callable[..., str],
    normalize_lang_source: Callable[[str], str],
    is_translation_enabled: Callable[[], bool],
    reader_translation_mode: Callable[[], str],
    translate_text: Callable[..., str],
) -> dict[str, Any] | None:
    if not isinstance(item, dict):
        return None
    plugin_id = str(getattr(plugin, "plugin_id", "") or "")
    title = normalize_vbook_display_text(
        str(
            item.get("name")
            or item.get("title")
            or item.get("book_name")
            or item.get("bookTitle")
            or ""
        ),
        single_line=True,
    )
    href = str(
        item.get("link")
        or item.get("url")
        or item.get("detail")
        or item.get("detail_url")
        or item.get("book_url")
        or ""
    ).strip()
    host = str(item.get("host") or "").strip()
    detail_url = join_vbook_url(host, href)
    if not detail_url and href.startswith("http"):
        detail_url = href
    if not title or not detail_url:
        return None
    cover = str(item.get("cover") or item.get("image") or item.get("img") or "").strip()
    if cover and host and not cover.startswith("http"):
        cover = join_vbook_url(host, cover)
    cover = build_vbook_image_proxy_path(cover, plugin_id=plugin_id, referer=detail_url)
    description = normalize_vbook_display_text(
        str(item.get("description") or item.get("desc") or item.get("summary") or ""),
        single_line=False,
    )
    author = normalize_vbook_display_text(
        str(item.get("author") or item.get("writer") or ""),
        single_line=True,
    )
    is_comic = "comic" in str(getattr(plugin, "type", "") or "").lower()
    locale_norm = normalize_lang_source(str(getattr(plugin, "locale", "") or ""))
    source_tag = "vbook_comic" if is_comic else "vbook"
    title_raw = title
    author_raw = author
    description_raw = description
    if translate_ui and is_translation_enabled():
        mode = reader_translation_mode()
        title = translate_text(title, single_line=True, mode=mode) or title
        author = translate_text(author, single_line=True, mode=mode) or author
        description = translate_text(description, single_line=False, mode=mode) or description
    return {
        "title": title,
        "author": author,
        "description": description,
        "title_raw": title_raw,
        "author_raw": author_raw,
        "description_raw": description_raw,
        "cover": cover,
        "detail_url": detail_url,
        "query": query,
        "host": host,
        "plugin_id": plugin_id,
        "plugin_name": str(getattr(plugin, "name", "") or ""),
        "plugin_type": str(getattr(plugin, "type", "") or ""),
        "locale": str(getattr(plugin, "locale", "") or ""),
        "source_type": source_tag,
        "is_comic": is_comic,
        "lang_source": locale_norm or "zh",
    }


def normalize_vbook_comment_items(raw_value: Any, *, normalize_vbook_display_text) -> list[dict[str, Any]]:
    if isinstance(raw_value, list):
        rows = raw_value
    elif isinstance(raw_value, dict):
        rows = extract_vbook_list_rows(raw_value)
        if not rows:
            rows = [raw_value]
    else:
        rows = [raw_value]

    out: list[dict[str, Any]] = []
    for row in rows:
        if isinstance(row, dict):
            author_value = (
                row.get("author")
                or row.get("user")
                or row.get("name")
                or row.get("nick")
                or row.get("username")
                or row.get("nickname")
                or row.get("member")
                or row.get("uname")
                or ""
            )
            content_value = (
                row.get("comment")
                or row.get("comments")
                or row.get("content")
                or row.get("text")
                or row.get("body")
                or row.get("message")
                or row.get("msg")
                or row.get("detail")
                or row.get("desc")
                or row.get("review")
                or row.get("review_text")
                or row.get("value")
                or ""
            )
            time_value = (
                row.get("time")
                or row.get("date")
                or row.get("description")
                or row.get("created_at")
                or row.get("updated_at")
                or row.get("createdAt")
                or row.get("updatedAt")
                or row.get("create_time")
                or row.get("update_time")
                or row.get("createTime")
                or row.get("updateTime")
                or ""
            )
            author = normalize_vbook_text_flexible(
                author_value,
                single_line=True,
                normalize_vbook_display_text=normalize_vbook_display_text,
            )
            content = normalize_vbook_text_flexible(
                content_value,
                single_line=False,
                normalize_vbook_display_text=normalize_vbook_display_text,
            )
            when = normalize_vbook_text_flexible(
                time_value,
                single_line=True,
                normalize_vbook_display_text=normalize_vbook_display_text,
            )
            if content:
                out.append({"author": author, "content": content, "time": when})
        elif isinstance(row, str):
            content = normalize_vbook_display_text(row, single_line=False)
            if content:
                out.append({"author": "", "content": content, "time": ""})
    return out[:200]


def parse_vbook_ongoing(value: Any) -> bool | None:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(int(value))
    text = str(value or "").strip().lower()
    if not text:
        return None
    if text in {"1", "true", "yes", "on", "ongoing", "continue", "còn tiếp", "con tiep", "đang ra", "dang ra"}:
        return True
    if text in {
        "0",
        "false",
        "no",
        "off",
        "completed",
        "complete",
        "done",
        "finished",
        "end",
        "hoàn thành",
        "hoan thanh",
    }:
        return False
    return None


def stringify_vbook_extra_value(value: Any, *, depth: int = 0, normalize_vbook_display_text, re_module) -> str:
    if depth >= 3:
        return normalize_vbook_display_text(str(value or ""), single_line=True)
    if value is None:
        return ""
    if isinstance(value, str):
        return normalize_vbook_display_text(value, single_line=False)
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, list):
        lines: list[str] = []
        for idx, item in enumerate(value[:25], start=1):
            text = stringify_vbook_extra_value(
                item,
                depth=depth + 1,
                normalize_vbook_display_text=normalize_vbook_display_text,
                re_module=re_module,
            )
            if not text:
                continue
            compact = re_module.sub(r"\s+", " ", text).strip()
            if compact:
                lines.append(f"{idx}. {compact}")
        remain = len(value) - len(value[:25])
        if remain > 0:
            lines.append(f"... (+{remain})")
        return "\n".join(lines).strip()
    if isinstance(value, dict):
        lines: list[str] = []
        items = list(value.items())
        for key, item in items[:30]:
            label = normalize_vbook_display_text(str(key or ""), single_line=True)
            text = stringify_vbook_extra_value(
                item,
                depth=depth + 1,
                normalize_vbook_display_text=normalize_vbook_display_text,
                re_module=re_module,
            )
            if not label or not text:
                continue
            compact = re_module.sub(r"\s+", " ", text).strip()
            lines.append(f"{label}: {compact}")
        remain = len(items) - len(items[:30])
        if remain > 0:
            lines.append(f"... (+{remain})")
        return "\n".join(lines).strip()
    return normalize_vbook_display_text(str(value), single_line=False)


def normalize_vbook_genre_items(
    detail: dict[str, Any],
    *,
    join_vbook_url,
    normalize_vbook_display_text,
    re_module,
) -> list[dict[str, Any]]:
    if not isinstance(detail, dict):
        return []
    raw_value = (
        detail.get("genres")
        or detail.get("genre")
        or detail.get("categories")
        or detail.get("category")
        or detail.get("tags")
        or detail.get("tag")
    )
    rows = extract_vbook_list_rows(raw_value)
    if (not rows) and isinstance(raw_value, str):
        rows = [x.strip() for x in re_module.split(r"[,\n/|;]+", raw_value) if x and x.strip()]

    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for row in rows:
        title = ""
        script = ""
        input_value: Any = None
        host = ""

        if isinstance(row, dict):
            title = normalize_vbook_display_text(
                str(row.get("title") or row.get("name") or row.get("label") or row.get("text") or ""),
                single_line=True,
            )
            script = str(row.get("script") or row.get("file") or "genre").strip()
            input_value = row.get("input")
            if input_value is None:
                input_value = row.get("url")
            if input_value is None:
                input_value = row.get("link")
            host = str(row.get("host") or "").strip()
        elif isinstance(row, str):
            title = normalize_vbook_display_text(row, single_line=True)
            script = "genre"
            input_value = row
        else:
            continue

        if not title:
            continue

        if isinstance(input_value, str):
            raw_input_text = input_value.strip()
            if raw_input_text and host and not raw_input_text.startswith("http"):
                joined = join_vbook_url(host, raw_input_text)
                if joined:
                    input_value = joined
            elif not raw_input_text:
                input_value = title
        elif input_value is None:
            input_value = title

        script = script or "genre"
        dedupe_key = json.dumps([title.lower(), script, input_value], ensure_ascii=False, sort_keys=True, default=str)
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        out.append({"title": title, "script": script, "input": input_value})
    return out[:120]


def normalize_vbook_extra_fields(
    detail: dict[str, Any],
    *,
    normalize_vbook_display_text,
    re_module,
) -> list[dict[str, str]]:
    if not isinstance(detail, dict):
        return []
    skip_keys = {
        "name",
        "title",
        "author",
        "cover",
        "image",
        "description",
        "desc",
        "host",
        "url",
        "link",
        "suggest",
        "suggests",
        "recommend",
        "recommends",
        "related",
        "comment",
        "comments",
        "review",
        "reviews",
        "genres",
        "genre",
        "categories",
        "category",
        "tags",
        "tag",
        "extra_fields",
    }
    extras: list[dict[str, str]] = []
    for raw_key, raw_val in detail.items():
        key_norm = str(raw_key or "").strip()
        if not key_norm:
            continue
        key_lower = key_norm.lower()
        if key_lower in skip_keys:
            continue
        if key_lower == "ongoing":
            ongoing = parse_vbook_ongoing(raw_val)
            if ongoing is True:
                value_text = "Còn tiếp"
            elif ongoing is False:
                value_text = "Hoàn thành"
            else:
                value_text = stringify_vbook_extra_value(
                    raw_val,
                    normalize_vbook_display_text=normalize_vbook_display_text,
                    re_module=re_module,
                )
            label = "Trạng thái"
        elif key_lower == "detail":
            value_text = stringify_vbook_extra_value(
                raw_val,
                normalize_vbook_display_text=normalize_vbook_display_text,
                re_module=re_module,
            )
            label = "Thông tin"
        else:
            value_text = stringify_vbook_extra_value(
                raw_val,
                normalize_vbook_display_text=normalize_vbook_display_text,
                re_module=re_module,
            )
            label = normalize_vbook_display_text(key_norm, single_line=True)
        if not value_text:
            continue
        extras.append({"key": label, "value": value_text})
    return extras[:120]
