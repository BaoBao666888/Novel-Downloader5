from __future__ import annotations

import html
import io
import re
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any
from urllib.parse import unquote

from reader_backend.core import content_media as content_media_support
from reader_backend.core import import_settings as import_settings_support
from reader_backend.text import cleanup as text_cleanup_support
from reader_backend.text import html_utils as html_utils_support
from reader_backend.text import paragraphs as text_paragraphs_support


CHAPTER_HEADING_REGEX = re.compile(
    r"^(?:\s*)(?:Chương|CHƯƠNG|Chuong|CHUONG|Chapter|CHAPTER|卷|第\s*[\d一二三四五六七八九十百千零]+\s*章)[^\n]{0,120}$",
    re.MULTILINE,
)


def normalize_newlines(text: str) -> str:
    return text_cleanup_support.normalize_newlines(text)


def normalize_metadata_key(value: Any) -> str:
    return import_settings_support.normalize_metadata_key(value)


def normalize_reader_import_settings(raw_cfg: dict[str, Any] | None = None) -> dict[str, Any]:
    return import_settings_support.normalize_reader_import_settings(raw_cfg)


def normalize_lang_source(value: str) -> str:
    return content_media_support.normalize_lang_source(value)


def localname(tag: str) -> str:
    return html_utils_support.localname(tag)


def resolve_zip_path(base_path: str, href: str) -> str:
    return html_utils_support.resolve_zip_path(base_path, href)


def html_to_text(html_content: str) -> str:
    return html_utils_support.html_to_text(html_content)


def decode_text_with_fallback(data: bytes) -> str:
    return html_utils_support.decode_text_with_fallback(data)


def normalize_vbook_display_text(text: str, *, single_line: bool = False) -> str:
    value = str(text or "")
    if not value:
        return ""
    value = html.unescape(value)
    value = re.sub(r"(?is)<\s*/?\s*br\s*/?\s*>", "\n", value)
    if "<" in value and ">" in value and re.search(r"(?is)</?[a-z][^>]*>", value):
        value = html_to_text(value)
    value = normalize_newlines(value)
    value = value.replace("\xa0", " ")
    value = re.sub(r"[ \t]+\n", "\n", value)
    value = re.sub(r"\n[ \t]+", "\n", value)
    value = re.sub(r"[ \t]{2,}", " ", value)
    value = re.sub(r"\n{2,}", "\n", value)
    if single_line:
        value = re.sub(r"\s*\n+\s*", " ", value)
    return value.strip()


def normalize_text_for_split(text: str) -> str:
    normalized = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r"[ \t]+\n", "\n", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()


def split_long_block(text: str, max_len: int) -> list[str]:
    raw = (text or "").strip()
    if not raw:
        return []
    if len(raw) <= max_len:
        return [raw]
    separators = set("。！？!?；;….,，、:：")
    chunks: list[str] = []
    buf = ""
    for ch in raw:
        buf += ch
        if len(buf) >= max_len:
            chunks.append(buf.strip())
            buf = ""
            continue
        if ch in separators and len(buf) >= int(max_len * 0.55):
            chunks.append(buf.strip())
            buf = ""
    if buf.strip():
        chunks.append(buf.strip())

    output: list[str] = []
    for c in chunks:
        if len(c) <= max_len:
            output.append(c)
        else:
            for i in range(0, len(c), max_len):
                output.append(c[i : i + max_len])
    return output


def merge_short_chapters(chapters: list[dict[str, Any]], min_len: int) -> list[dict[str, Any]]:
    if not chapters:
        return []
    merged: list[dict[str, Any]] = []
    buf: dict[str, Any] | None = None
    for ch in chapters:
        text = (ch.get("text") or "").strip()
        if not text:
            continue
        item = {"title": (ch.get("title") or "").strip(), "text": text}
        if buf is None:
            buf = item
            continue
        if len(buf["text"]) < min_len:
            buf["text"] = f"{buf['text']}\n\n{item['text']}".strip()
        else:
            merged.append(buf)
            buf = item
    if buf is not None:
        if len(buf["text"]) < min_len and merged:
            merged[-1]["text"] = f"{merged[-1]['text']}\n\n{buf['text']}".strip()
        else:
            merged.append(buf)
    return merged


def split_by_newlines(normalized: str, target_size: int = 4500) -> list[dict[str, str]]:
    if not normalized:
        return []
    max_chapter_len = max(target_size * 2, 9000)
    parts = [x.strip() for x in re.split(r"\n{2,}", normalized) if x.strip()]
    joiner = "\n\n"
    if len(parts) <= 1:
        parts = [x.strip() for x in re.split(r"\n+", normalized) if x.strip()]
        joiner = "\n"

    expanded: list[str] = []
    for part in parts:
        if len(part) > max_chapter_len:
            expanded.extend(split_long_block(part, max_chapter_len))
        else:
            expanded.append(part)

    total = sum(len(x) for x in expanded)
    desired_count = max(1, round(total / max(target_size, 1)))
    avg = max(1, (total + desired_count - 1) // desired_count)

    groups: list[str] = []
    cur: list[str] = []
    cur_len = 0
    for p in expanded:
        add_len = len(p) + (len(joiner) if cur else 0)
        if cur and cur_len + add_len > avg and len(groups) < desired_count - 1:
            groups.append(joiner.join(cur).strip())
            cur = [p]
            cur_len = len(p)
        else:
            cur.append(p)
            cur_len += add_len
    if cur:
        groups.append(joiner.join(cur).strip())

    min_len = max(800, int(target_size * 0.25))
    chapters = [{"title": f"Chương {i+1}", "text": content} for i, content in enumerate(groups)]
    return merge_short_chapters(chapters, min_len)


def compile_chapter_heading_patterns(patterns: list[str] | tuple[str, ...] | None = None) -> list[re.Pattern[str]]:
    raw_patterns = [str(item or "").strip() for item in (patterns or []) if str(item or "").strip()]
    if not raw_patterns:
        return [CHAPTER_HEADING_REGEX]
    compiled: list[re.Pattern[str]] = []
    for raw in raw_patterns:
        try:
            compiled.append(re.compile(raw, re.MULTILINE))
        except re.error:
            continue
    return compiled or [CHAPTER_HEADING_REGEX]


_CJK_NUMBER_DIGITS = {
    "零": 0,
    "〇": 0,
    "一": 1,
    "二": 2,
    "两": 2,
    "兩": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
}

_CJK_NUMBER_UNITS = {
    "十": 10,
    "百": 100,
    "千": 1000,
    "万": 10000,
}


def parse_cjk_number(value: Any) -> int | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    if raw.isdigit():
        try:
            return int(raw)
        except Exception:
            return None
    total = 0
    section = 0
    number = 0
    used = False
    for ch in raw:
        if ch in _CJK_NUMBER_DIGITS:
            number = _CJK_NUMBER_DIGITS[ch]
            used = True
            continue
        unit = _CJK_NUMBER_UNITS.get(ch)
        if unit is None:
            return None
        if number == 0:
            number = 1
        section += number * unit
        number = 0
        used = True
    total = section + number
    if total > 0:
        return total
    if used and raw in {"零", "〇", "0"}:
        return 0
    return None


def extract_heading_index(title: Any) -> int | None:
    raw = str(title or "").strip()
    if not raw:
        return None
    chapter_match = re.search(r"第\s*([0-9一二三四五六七八九十百千零两兩]+)\s*[章节卷回集部篇]", raw, re.IGNORECASE)
    if chapter_match:
        return parse_cjk_number(chapter_match.group(1))
    pipe_match = re.match(r"^\s*\d{1,4}\s*[｜|]\s*(\d{1,4})(?:[\.\-、:： )）]|\s|$)", raw)
    if pipe_match:
        try:
            return int(pipe_match.group(1))
        except Exception:
            return None
    numbered_match = re.match(r"^\s*(\d{1,4})(?:(?:[\.\-、:： )）]\s*)|\s+)", raw)
    if numbered_match:
        try:
            return int(numbered_match.group(1))
        except Exception:
            return None
    return None


def heading_sequence_score(matches: list[dict[str, Any]]) -> float:
    values = [extract_heading_index(item.get("title")) for item in matches]
    numbered = [value for value in values if isinstance(value, int)]
    if len(numbered) < 2:
        return 0.0
    good = 0
    total = 0
    prev = numbered[0]
    for current in numbered[1:]:
        if current == prev:
            continue
        total += 1
        if current == prev + 1:
            good += 1
        prev = current
    if total <= 0:
        return 0.0
    return good / total


def build_regex_split_candidates(normalized: str, matches: list[dict[str, Any]], preface_title: str) -> list[dict[str, str]]:
    chapters: list[dict[str, str]] = []
    if matches and int(matches[0]["start"]) > 0:
        preface = normalize_text_for_split(normalized[: int(matches[0]["start"])])
        if preface:
            chapters.append({"title": str(preface_title or "Mở đầu").strip() or "Mở đầu", "text": preface})
    for i, match in enumerate(matches):
        title = str(match.get("title") or "").strip() or f"Chương {i+1}"
        start = int(match.get("end") or 0)
        end = int(matches[i + 1]["start"]) if i + 1 < len(matches) else len(normalized)
        content = normalize_text_for_split(normalized[start:end])
        if content:
            chapters.append({"title": title, "text": content})
    return chapters


def analyze_text_split(
    text: str,
    *,
    target_size: int = 4500,
    heading_patterns: list[str] | tuple[str, ...] | None = None,
    preface_title: str = "Mở đầu",
) -> dict[str, Any]:
    normalized = normalize_text_for_split(text)
    if not normalized:
        return {
            "chapters": [],
            "diagnostics": {
                "split_strategy": "newlines",
                "matched_heading_count": 0,
                "used_heading_count": 0,
                "fallback_reason": "",
                "sequence_score": 0.0,
            },
        }

    matches = collect_heading_matches(normalized, compile_chapter_heading_patterns(heading_patterns))
    if not matches:
        return {
            "chapters": split_by_newlines(normalized, target_size=target_size),
            "diagnostics": {
                "split_strategy": "newlines",
                "matched_heading_count": 0,
                "used_heading_count": 0,
                "fallback_reason": "",
                "sequence_score": 0.0,
            },
        }

    regex_candidates = build_regex_split_candidates(normalized, matches, preface_title)
    if not regex_candidates:
        return {
            "chapters": split_by_newlines(normalized, target_size=target_size),
            "diagnostics": {
                "split_strategy": "regex_fallback",
                "matched_heading_count": len(matches),
                "used_heading_count": 0,
                "fallback_reason": "empty_after_regex",
                "sequence_score": 0.0,
            },
        }

    content_lengths = [len(str(ch.get("text") or "").strip()) for ch in regex_candidates if str(ch.get("text") or "").strip()]
    avg_len = (sum(content_lengths) / len(content_lengths)) if content_lengths else 0.0
    min_len = max(800, int(target_size * 0.25))
    max_len = max(target_size * 2, 9000)
    tiny_threshold = max(180, int(target_size * 0.1))
    tiny_ratio = (sum(1 for length in content_lengths if length < tiny_threshold) / len(content_lengths)) if content_lengths else 0.0
    too_long_count = sum(1 for length in content_lengths if length > max_len * 1.6)
    title_avg_len = (
        sum(len(str(item.get("title") or "").strip()) for item in matches) / len(matches)
        if matches
        else 0.0
    )
    sequence_score = heading_sequence_score(matches)

    fallback_reason = ""
    if sequence_score < 0.6:
        if too_long_count > max(2, len(content_lengths) // 8):
            fallback_reason = "too_many_long_blocks"
        elif len(matches) >= 8 and title_avg_len > 95:
            fallback_reason = "heading_titles_too_long"
        elif len(matches) >= 5 and avg_len < min_len * 0.45 and tiny_ratio > 0.25:
            fallback_reason = "headings_too_dense"
        elif len(matches) <= 2 and avg_len < min_len * 0.35:
            fallback_reason = "too_few_headings"

    if fallback_reason:
        chapters = split_by_newlines(normalized, target_size=target_size)
        return {
            "chapters": chapters,
            "diagnostics": {
                "split_strategy": "regex_fallback",
                "matched_heading_count": len(matches),
                "used_heading_count": len(matches),
                "fallback_reason": fallback_reason,
                "sequence_score": round(sequence_score, 3),
            },
        }

    return {
        "chapters": regex_candidates,
        "diagnostics": {
            "split_strategy": "regex",
            "matched_heading_count": len(matches),
            "used_heading_count": len(matches),
            "fallback_reason": "",
            "sequence_score": round(sequence_score, 3),
        },
    }


def collect_heading_matches(normalized: str, patterns: list[re.Pattern[str]]) -> list[dict[str, Any]]:
    raw_matches: list[dict[str, Any]] = []
    for pattern in patterns:
        for match in pattern.finditer(normalized):
            if match.start() == match.end():
                continue
            title = (match.group(0) or "").strip()
            if not title:
                continue
            raw_matches.append(
                {
                    "start": int(match.start()),
                    "end": int(match.end()),
                    "title": title,
                }
            )
    raw_matches.sort(key=lambda item: (int(item["start"]), -int(item["end"]) + int(item["start"])))
    dedup: list[dict[str, Any]] = []
    seen_ranges: set[tuple[int, int]] = set()
    last_end = -1
    for item in raw_matches:
        key = (int(item["start"]), int(item["end"]))
        if key in seen_ranges:
            continue
        seen_ranges.add(key)
        if int(item["start"]) < last_end:
            continue
        dedup.append(item)
        last_end = int(item["end"])
    return dedup


def split_text_into_chapters(
    text: str,
    target_size: int = 4500,
    heading_patterns: list[str] | tuple[str, ...] | None = None,
    preface_title: str = "Mở đầu",
) -> list[dict[str, str]]:
    return list(
        analyze_text_split(
            text,
            target_size=target_size,
            heading_patterns=heading_patterns,
            preface_title=preface_title,
        ).get("chapters")
        or []
    )


def find_first_by_localname(root: ET.Element, name: str) -> ET.Element | None:
    for el in root.iter():
        if localname(el.tag) == name:
            return el
    return None


def find_all_by_localname(root: ET.Element, name: str) -> list[ET.Element]:
    result: list[ET.Element] = []
    for el in root.iter():
        if localname(el.tag) == name:
            result.append(el)
    return result


def extract_epub_metadata_candidates(metadata_root: ET.Element) -> list[dict[str, str]]:
    seen: set[tuple[str, str]] = set()
    out: list[dict[str, str]] = []
    for el in metadata_root.iter():
        key = normalize_metadata_key(localname(el.tag))
        if not key:
            continue
        text = normalize_vbook_display_text(html.unescape("".join(el.itertext() or []).strip()), single_line=False)
        if text:
            sig = (key, text)
            if sig not in seen:
                seen.add(sig)
                out.append({"key": key, "value": text})
        if localname(el.tag).lower() != "meta":
            continue
        for attr_name in ("name", "property", "id"):
            attr_key = normalize_metadata_key(el.attrib.get(attr_name))
            if not attr_key:
                continue
            value = el.attrib.get("content") or "".join(el.itertext() or []).strip()
            value = normalize_vbook_display_text(html.unescape(value), single_line=False)
            if not value:
                continue
            sig = (attr_key, value)
            if sig in seen:
                continue
            seen.add(sig)
            out.append({"key": attr_key, "value": value})
    return out


def first_epub_metadata_value(
    candidates: list[dict[str, str]],
    keys: list[str] | tuple[str, ...],
    *,
    single_line: bool,
) -> str:
    wanted = [normalize_metadata_key(item) for item in keys if normalize_metadata_key(item)]
    if not wanted:
        return ""
    for key in wanted:
        for row in candidates:
            row_key = normalize_metadata_key(row.get("key"))
            if row_key != key:
                continue
            value = normalize_vbook_display_text(row.get("value") or "", single_line=single_line)
            if value:
                return value
    return ""


def parse_epub_book(
    data: bytes,
    *,
    custom_title: str | None = None,
    custom_author: str | None = None,
    custom_summary: str | None = None,
    parser_settings: dict[str, Any] | None = None,
    lang_source: str = "",
) -> dict[str, Any]:
    import_settings = normalize_reader_import_settings({"epub": parser_settings or {}})
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        def read_text(path: str) -> str | None:
            candidates = [path, unquote(path)]
            for c in candidates:
                try:
                    return decode_text_with_fallback(zf.read(c))
                except KeyError:
                    continue
            return None

        container_xml = read_text("META-INF/container.xml")
        if not container_xml:
            raise ValueError("Không tìm thấy META-INF/container.xml trong EPUB.")

        container_doc = ET.fromstring(container_xml)
        rootfile = find_first_by_localname(container_doc, "rootfile")
        if rootfile is None:
            raise ValueError("container.xml thiếu rootfile.")

        opf_path = rootfile.attrib.get("full-path", "").strip()
        if not opf_path:
            raise ValueError("container.xml thiếu đường dẫn OPF.")

        opf_xml = read_text(opf_path)
        if not opf_xml:
            raise ValueError("Không đọc được file OPF trong EPUB.")
        opf_doc = ET.fromstring(opf_xml)

        metadata_el = find_first_by_localname(opf_doc, "metadata")
        metadata_root = metadata_el if metadata_el is not None else opf_doc
        metadata_candidates = extract_epub_metadata_candidates(metadata_root)
        title = (custom_title or "").strip() or first_epub_metadata_value(
            metadata_candidates,
            import_settings["epub"]["title_keys"],
            single_line=True,
        ) or "Untitled"
        author = (custom_author or "").strip() or first_epub_metadata_value(
            metadata_candidates,
            import_settings["epub"]["author_keys"],
            single_line=True,
        )
        summary = (custom_summary or "").strip() or first_epub_metadata_value(
            metadata_candidates,
            import_settings["epub"]["summary_keys"],
            single_line=False,
        )
        detected_lang = normalize_lang_source(
            first_epub_metadata_value(
                metadata_candidates,
                import_settings["epub"]["language_keys"],
                single_line=True,
            )
        )

        manifest: dict[str, dict[str, str]] = {}
        for item in find_all_by_localname(opf_doc, "item"):
            item_id = item.attrib.get("id", "").strip()
            href = item.attrib.get("href", "").strip()
            media_type = item.attrib.get("media-type", "").strip()
            properties = item.attrib.get("properties", "").strip()
            if not item_id or not href:
                continue
            resolved = resolve_zip_path(opf_path, href)
            manifest[item_id] = {
                "href": href,
                "resolved": resolved,
                "media_type": media_type,
                "properties": properties,
            }

        spine_ids: list[str] = []
        spine_el = find_first_by_localname(opf_doc, "spine")
        for itemref in find_all_by_localname(opf_doc, "itemref"):
            item_id = itemref.attrib.get("idref", "").strip()
            if item_id and item_id in manifest:
                spine_ids.append(item_id)

        toc_labels: dict[str, str] = {}
        toc_id = (spine_el.attrib.get("toc", "") if spine_el is not None else "").strip()
        toc_item = manifest.get(toc_id) if toc_id else None
        if toc_item is None:
            for item in manifest.values():
                if "ncx" in (item.get("media_type") or ""):
                    toc_item = item
                    break

        if toc_item:
            toc_xml = read_text(toc_item["resolved"])
            if toc_xml:
                try:
                    toc_doc = ET.fromstring(toc_xml)
                    for nav in find_all_by_localname(toc_doc, "navPoint"):
                        text_el = find_first_by_localname(nav, "text")
                        content_el = find_first_by_localname(nav, "content")
                        src = (content_el.attrib.get("src", "") if content_el is not None else "").strip()
                        label = (text_el.text or "").strip() if text_el is not None else ""
                        if src:
                            resolved = resolve_zip_path(toc_item["resolved"], src)
                            toc_labels[resolved] = label
                except Exception:
                    pass

        cover_bytes = b""
        cover_name = ""
        cover_meta_names = {normalize_metadata_key(x) for x in import_settings["epub"]["cover_meta_names"]}
        cover_properties = {normalize_metadata_key(x) for x in import_settings["epub"]["cover_properties"]}
        cover_item_id = ""
        for row in metadata_candidates:
            key = normalize_metadata_key(row.get("key"))
            if key not in cover_meta_names:
                continue
            value = str(row.get("value") or "").strip()
            if value:
                cover_item_id = value
                break
        if not cover_item_id:
            for item_id, item in manifest.items():
                prop_tokens = {
                    normalize_metadata_key(x)
                    for x in str(item.get("properties") or "").split()
                    if normalize_metadata_key(x)
                }
                if prop_tokens & cover_properties:
                    cover_item_id = item_id
                    break
        if cover_item_id and cover_item_id in manifest:
            cover_item = manifest.get(cover_item_id) or {}
            cover_name = Path(str(cover_item.get("resolved") or cover_item.get("href") or "cover.jpg")).name
            try:
                cover_bytes = zf.read(str(cover_item.get("resolved") or ""))
            except Exception:
                cover_bytes = b""
        if not cover_bytes:
            for item in manifest.values():
                media_type = str(item.get("media_type") or "").strip().lower()
                if not media_type.startswith("image/"):
                    continue
                prop_tokens = {
                    normalize_metadata_key(x)
                    for x in str(item.get("properties") or "").split()
                    if normalize_metadata_key(x)
                }
                if cover_properties and not (prop_tokens & cover_properties):
                    continue
                cover_name = Path(str(item.get("resolved") or item.get("href") or "cover.jpg")).name
                try:
                    cover_bytes = zf.read(str(item.get("resolved") or ""))
                    break
                except Exception:
                    continue

        chapters: list[dict[str, str]] = []
        for idx, spine_id in enumerate(spine_ids, start=1):
            item = manifest.get(spine_id)
            if not item:
                continue
            if "html" not in (item["media_type"] or "") and "xhtml" not in (item["media_type"] or ""):
                continue
            raw_html = read_text(item["resolved"])
            if not raw_html:
                continue
            content = text_paragraphs_support.normalize_soft_wrapped_paragraphs(
                text_paragraphs_support.strip_paragraph_indentation(html_to_text(raw_html))
            )
            if not content:
                continue
            chapter_title = toc_labels.get(item["resolved"], "").strip()
            if not chapter_title:
                try:
                    html_root = ET.fromstring(raw_html)
                    h1 = find_first_by_localname(html_root, "h1")
                    h2 = find_first_by_localname(html_root, "h2")
                    chapter_title = ((h1.text if h1 is not None else "") or (h2.text if h2 is not None else "")).strip()
                except Exception:
                    chapter_title = ""
            if not chapter_title:
                chapter_title = f"Chương {idx}"
            chapters.append({"title": chapter_title, "text": content})

        if not chapters:
            raise ValueError("Không tìm thấy chương hợp lệ trong EPUB.")

        final_lang = normalize_lang_source(lang_source) or detected_lang or "zh"
        return {
            "source_type": "epub",
            "metadata": {
                "title": title,
                "author": author,
                "summary": summary or "Sách EPUB được nhập từ file cục bộ.",
                "lang_source": final_lang,
                "detected_lang": detected_lang,
                "chapter_count": len(chapters),
                "has_cover": bool(cover_bytes),
                "cover_name": cover_name,
            },
            "chapters": chapters,
            "cover_bytes": cover_bytes,
            "cover_name": cover_name,
            "diagnostics": {
                "metadata_candidates": metadata_candidates,
            },
        }


def parse_epub_chapters(data: bytes, custom_title: str | None = None) -> tuple[str, str, list[dict[str, str]]]:
    parsed = parse_epub_book(data, custom_title=custom_title)
    metadata = parsed.get("metadata") if isinstance(parsed, dict) else {}
    chapters = parsed.get("chapters") if isinstance(parsed, dict) else []
    return (
        str((metadata or {}).get("title") or "Untitled"),
        str((metadata or {}).get("author") or ""),
        [dict(item or {}) for item in chapters if isinstance(item, dict)],
    )


TXT_FILE_PREFIX_RE = re.compile(r"^\s*\[[^\]]*]\s*")
TXT_FILE_LEADING_TAG_RE = re.compile(r"^(?:【[^】]{1,20}】\s*)+")
TXT_FILE_AUTHOR_RE = re.compile(r"(?:作者|作家)\s*[:：]\s*(?P<author>.+?)\s*$", re.IGNORECASE)
TXT_FILE_BY_RE = re.compile(r"(?P<title>.+?)\s*by\s*(?P<author>.+?)\s*$", re.IGNORECASE)
TXT_CONTENT_AUTHOR_RE = re.compile(r"^\s*(?:作者|作家)\s*[:：]\s*(?P<author>.+?)\s*$", re.IGNORECASE)
TXT_CONTENT_TITLE_RE = re.compile(
    r"^\s*(?:书名|書名|小说名|小說名|作品名|文名|标题|標題|title)\s*[:：]\s*(?P<title>.+?)\s*$",
    re.IGNORECASE,
)
TXT_CONTENT_LINK_RE = re.compile(r"^\s*(?:link|url|网址|網址|website|web)\s*[:：]\s*\S+", re.IGNORECASE)


def cleanup_txt_metadata_text(value: str) -> str:
    text = unicodedata.normalize("NFKC", str(value or ""))
    text = re.sub(r"\s+", " ", text).strip()
    return text.strip(" \t\r\n-_")


def remove_txt_filename_prefix(text: str) -> str:
    current = cleanup_txt_metadata_text(text)
    while True:
        updated = TXT_FILE_PREFIX_RE.sub("", current, count=1).strip()
        if updated == current:
            return current
        current = cleanup_txt_metadata_text(updated)


def split_txt_filename_author(text: str) -> tuple[str, str]:
    author_match = TXT_FILE_AUTHOR_RE.search(text)
    if author_match:
        author = cleanup_txt_metadata_text(author_match.group("author"))
        head = cleanup_txt_metadata_text(text[:author_match.start()])
        return head, author
    by_match = TXT_FILE_BY_RE.search(text)
    if by_match:
        title = cleanup_txt_metadata_text(by_match.group("title"))
        author = cleanup_txt_metadata_text(by_match.group("author"))
        return title, author
    return cleanup_txt_metadata_text(text), ""


def parse_txt_filename_metadata(filename: str) -> tuple[str, str]:
    stem = Path(str(filename or "imported")).stem
    text = cleanup_txt_metadata_text(remove_txt_filename_prefix(stem))
    working_title, author = split_txt_filename_author(text)
    quoted_match = re.search(r"《(?P<title>[^》]+)》", working_title)
    if quoted_match:
        return cleanup_txt_metadata_text(quoted_match.group("title")), author
    plain_title = cleanup_txt_metadata_text(TXT_FILE_LEADING_TAG_RE.sub("", working_title))
    if plain_title:
        return plain_title, author
    fallback = cleanup_txt_metadata_text(text) or cleanup_txt_metadata_text(stem)
    return fallback, author


def parse_txt_content_metadata(text: str, *, max_visible_lines: int = 8) -> tuple[str, str]:
    lines = str(text or "").splitlines()
    visible_lines: list[str] = []
    for raw_line in lines:
        line_text = str(raw_line or "").strip()
        if not line_text:
            continue
        visible_lines.append(line_text)
        if len(visible_lines) >= max(4, int(max_visible_lines or 8)):
            break
    if len(visible_lines) < 2:
        return "", ""

    for idx, line_text in enumerate(visible_lines):
        author_match = TXT_CONTENT_AUTHOR_RE.match(line_text)
        if not author_match:
            continue
        author = normalize_vbook_display_text(author_match.group("author"), single_line=True)
        title = ""
        for back_idx in range(idx - 1, -1, -1):
            candidate = visible_lines[back_idx]
            if not candidate or TXT_CONTENT_LINK_RE.match(candidate):
                continue
            title_match = TXT_CONTENT_TITLE_RE.match(candidate)
            if title_match:
                title = normalize_vbook_display_text(title_match.group("title"), single_line=True)
            else:
                title = normalize_vbook_display_text(candidate, single_line=True)
            if title:
                break
        if author:
            return title, author
    return "", ""


def parse_txt_book(
    filename: str,
    file_bytes: bytes,
    *,
    lang_source: str = "",
    custom_title: str | None = None,
    custom_author: str | None = None,
    custom_summary: str | None = None,
    parser_settings: dict[str, Any] | None = None,
) -> dict[str, Any]:
    settings = normalize_reader_import_settings({"txt": parser_settings or {}})
    text = text_paragraphs_support.strip_paragraph_indentation(decode_text_with_fallback(file_bytes))
    filename_title, filename_author = parse_txt_filename_metadata(filename)
    detected_title, detected_author = parse_txt_content_metadata(text)
    title = (custom_title or "").strip()
    if not title:
        if filename_title and filename_author:
            title = filename_title
        elif detected_title:
            title = detected_title
        elif filename_title:
            title = filename_title
        else:
            title = re.sub(r"\.[^.]+$", "", filename or "") or "Untitled"
    author = (custom_author or "").strip() or detected_author or filename_author
    split_result = analyze_text_split(
        text,
        target_size=int(settings["txt"]["target_size"]),
        heading_patterns=settings["txt"]["heading_patterns"],
        preface_title=str(settings["txt"]["preface_title"] or "Mở đầu"),
    )
    chapters = list(split_result.get("chapters") or [])
    for chapter in chapters:
        if not isinstance(chapter, dict):
            continue
        chapter["text"] = text_paragraphs_support.normalize_soft_wrapped_paragraphs(str(chapter.get("text") or ""))
    if not chapters:
        raise ValueError("Không tách được chương từ file TXT.")
    summary = (custom_summary or "").strip() or normalize_vbook_display_text(
        str((chapters[0] or {}).get("text") or ""),
        single_line=False,
    ) or "Sách TXT được nhập và tách chương tự động."
    diagnostics = dict(split_result.get("diagnostics") or {})
    return {
        "source_type": "txt",
        "metadata": {
            "title": title,
            "author": author,
            "summary": summary,
            "lang_source": normalize_lang_source(lang_source) or "zh",
            "chapter_count": len(chapters),
            "has_cover": False,
        },
        "chapters": chapters,
        "cover_bytes": b"",
        "cover_name": "",
        "diagnostics": {**diagnostics, "metadata_candidates": []},
    }

