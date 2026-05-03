from __future__ import annotations

from collections.abc import Callable, Iterator
from typing import Any


def section_title_from_raw(
    raw_value: Any,
    default_title: str,
    *,
    normalize_vbook_display_text: Callable[..., str],
) -> str:
    if isinstance(raw_value, dict):
        for key in ("title", "name", "label", "header", "heading"):
            title = normalize_vbook_display_text(str(raw_value.get(key) or ""), single_line=True)
            if title:
                return title
    return default_title


def section_payload_from_raw(
    raw_value: Any,
    candidate_keys: tuple[str, ...],
    *,
    has_non_empty_value: Callable[[Any], bool],
) -> Any:
    if not isinstance(raw_value, dict):
        return raw_value
    for key in candidate_keys:
        if key in raw_value and has_non_empty_value(raw_value.get(key)):
            return raw_value.get(key)
    lowered = {str(k or "").strip().lower(): v for k, v in raw_value.items()}
    for key in candidate_keys:
        value = lowered.get(str(key or "").strip().lower())
        if has_non_empty_value(value):
            return value
    return raw_value


def looks_like_detail_section(
    raw_value: Any,
    candidate_keys: tuple[str, ...],
    *,
    extract_rows: Callable[[Any], list[Any]],
    normalize_script_descriptor_item: Callable[..., dict[str, Any] | None],
) -> bool:
    if not isinstance(raw_value, dict):
        return False
    title_keys = {"title", "name", "label", "header", "heading"}
    if not any(str(key or "").strip().lower() in title_keys for key in raw_value.keys()):
        return False
    if normalize_script_descriptor_item(raw_value, translate_ui=False):
        return True
    for key in candidate_keys:
        value = raw_value.get(key)
        if isinstance(value, (list, tuple, set)) or (isinstance(value, dict) and extract_rows(value)):
            return True
    lowered = {str(k or "").strip().lower(): v for k, v in raw_value.items()}
    for key in candidate_keys:
        value = lowered.get(str(key or "").strip().lower())
        if isinstance(value, (list, tuple, set)) or (isinstance(value, dict) and extract_rows(value)):
            return True
    return False


def _iter_section_payloads(
    raw_values: list[tuple[str, Any]],
    *,
    default_title: str,
    candidate_keys: tuple[str, ...],
    normalize_vbook_display_text: Callable[..., str],
    has_non_empty_value: Callable[[Any], bool],
    extract_rows: Callable[[Any], list[Any]],
    normalize_script_descriptor_item: Callable[..., dict[str, Any] | None],
) -> Iterator[tuple[str, Any]]:
    for raw_key, raw_value in raw_values:
        if isinstance(raw_value, list):
            section_rows = [
                row
                for row in raw_value
                if looks_like_detail_section(
                    row,
                    candidate_keys,
                    extract_rows=extract_rows,
                    normalize_script_descriptor_item=normalize_script_descriptor_item,
                )
            ]
            if section_rows and len(section_rows) == len(raw_value):
                for row in section_rows:
                    title = section_title_from_raw(
                        row,
                        default_title,
                        normalize_vbook_display_text=normalize_vbook_display_text,
                    )
                    payload = section_payload_from_raw(
                        row,
                        candidate_keys,
                        has_non_empty_value=has_non_empty_value,
                    )
                    yield title, payload
            else:
                yield default_title, raw_value
            continue

        if isinstance(raw_value, dict):
            direct_payload = section_payload_from_raw(
                raw_value,
                candidate_keys,
                has_non_empty_value=has_non_empty_value,
            )
            if direct_payload is not raw_value:
                yield (
                    section_title_from_raw(
                        raw_value,
                        default_title,
                        normalize_vbook_display_text=normalize_vbook_display_text,
                    ),
                    direct_payload,
                )
                continue

            mapped = False
            for key, value in raw_value.items():
                if key in {"title", "name", "label", "header", "heading"}:
                    continue
                if not has_non_empty_value(value):
                    continue
                if isinstance(value, (list, tuple, set)):
                    yield str(key or default_title), value
                    mapped = True
                elif isinstance(value, dict):
                    rows = extract_rows(value)
                    if rows and not (len(rows) == 1 and rows[0] is value):
                        yield str(key or default_title), value
                        mapped = True
            if not mapped:
                yield default_title, raw_value
            continue

        yield default_title, raw_value


def collect_detail_sections(
    raw_values: list[tuple[str, Any]],
    *,
    default_title: str,
    candidate_keys: tuple[str, ...],
    item_collector: Callable[[Any], list[dict[str, Any]]],
    normalize_vbook_display_text: Callable[..., str],
    has_non_empty_value: Callable[[Any], bool],
    extract_rows: Callable[[Any], list[Any]],
    normalize_script_descriptor_item: Callable[..., dict[str, Any] | None],
) -> list[dict[str, Any]]:
    sections: list[dict[str, Any]] = []
    for title_raw, payload in _iter_section_payloads(
        raw_values,
        default_title=default_title,
        candidate_keys=candidate_keys,
        normalize_vbook_display_text=normalize_vbook_display_text,
        has_non_empty_value=has_non_empty_value,
        extract_rows=extract_rows,
        normalize_script_descriptor_item=normalize_script_descriptor_item,
    ):
        title = normalize_vbook_display_text(str(title_raw or default_title), single_line=True) or default_title
        items = item_collector(payload)
        if not items:
            continue
        sections.append(
            {
                "title_raw": title,
                "title": title,
                "items": items,
                "count": len(items),
            }
        )
    return sections


def build_detail_section_sources(
    raw_values: list[tuple[str, Any]],
    *,
    default_title: str,
    candidate_keys: tuple[str, ...],
    normalize_vbook_display_text: Callable[..., str],
    has_non_empty_value: Callable[[Any], bool],
    extract_rows: Callable[[Any], list[Any]],
    normalize_script_descriptor_item: Callable[..., dict[str, Any] | None],
) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    for title_raw, payload in _iter_section_payloads(
        raw_values,
        default_title=default_title,
        candidate_keys=candidate_keys,
        normalize_vbook_display_text=normalize_vbook_display_text,
        has_non_empty_value=has_non_empty_value,
        extract_rows=extract_rows,
        normalize_script_descriptor_item=normalize_script_descriptor_item,
    ):
        if not has_non_empty_value(payload):
            continue
        title = normalize_vbook_display_text(str(title_raw or default_title), single_line=True) or default_title
        sources.append(
            {
                "index": len(sources),
                "title_raw": title,
                "title": title,
                "payload": payload,
            }
        )
    return sources


def flatten_detail_sections(sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for section in sections:
        if not isinstance(section, dict):
            continue
        for item in section.get("items") or []:
            if isinstance(item, dict):
                out.append(item)
    return out
