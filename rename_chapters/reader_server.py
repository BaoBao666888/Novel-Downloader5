#!/usr/bin/env python3
"""Mini local server for Reader V1 (SQLite + cache + themed web UI)."""

from __future__ import annotations

import argparse
import difflib
import hashlib
import html
import importlib.util
import io
import json
import mimetypes
import re
import sqlite3
import traceback
import uuid
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, quote, unquote, urlparse
import xml.etree.ElementTree as ET


ROOT_DIR = Path(__file__).resolve().parent
LOCAL_DIR = ROOT_DIR / "local"
CACHE_DIR = LOCAL_DIR / "reader_cache"
EXPORT_DIR = LOCAL_DIR / "reader_exports"
COVER_DIR = LOCAL_DIR / "reader_covers"
DB_PATH = LOCAL_DIR / "reader_library.db"
DEFAULT_UI_DIR = ROOT_DIR / "reader_ui"
APP_CONFIG_PATH = ROOT_DIR / "config.json"
APP_STATE_THEME_ACTIVE_KEY = "theme.active"
APP_STATE_NAME_SET_STATE_KEY = "reader.name_set_state"


def _load_translator_module():
    module_path = ROOT_DIR / "app" / "core" / "translator.py"
    spec = importlib.util.spec_from_file_location("reader_translator_logic", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Không thể nạp module translator: {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[attr-defined]
    return module


translator_logic = _load_translator_module()


THEME_PRESETS: list[dict[str, Any]] = [
    {
        "id": "sao_dem",
        "name": "Sao đêm",
        "description": "Nền tối, ánh sao lấp lánh nhẹ.",
        "tokens": {
            "bg": "#090a1a",
            "bg2": "#111433",
            "surface": "#11162d",
            "surface_alt": "#151f42",
            "text": "#eaf2ff",
            "muted": "#8ca3d4",
            "accent": "#77b8ff",
            "glow": "#9fd0ff",
            "particle": "#ffffff",
        },
        "effect": "stars",
    },
    {
        "id": "hong_phan",
        "name": "Hồng phấn",
        "description": "Tông pastel mềm, glow dịu mắt.",
        "tokens": {
            "bg": "#2d1022",
            "bg2": "#4a1f3b",
            "surface": "#4f2242",
            "surface_alt": "#613053",
            "text": "#ffeef8",
            "muted": "#f3bdd8",
            "accent": "#ff7fba",
            "glow": "#ff9bd0",
            "particle": "#ffd3ea",
        },
        "effect": "sparkle",
    },
    {
        "id": "xanh_da_troi",
        "name": "Xanh da trời",
        "description": "Mát mắt, gradient trong trẻo.",
        "tokens": {
            "bg": "#092039",
            "bg2": "#0e4d77",
            "surface": "#0f3858",
            "surface_alt": "#15527a",
            "text": "#eaf8ff",
            "muted": "#a8d5ee",
            "accent": "#69d3ff",
            "glow": "#90e4ff",
            "particle": "#def8ff",
        },
        "effect": "bubbles",
    },
    {
        "id": "la_vang",
        "name": "Lá vàng",
        "description": "Ấm áp mùa thu, hạt vàng bay nhẹ.",
        "tokens": {
            "bg": "#2c1707",
            "bg2": "#673512",
            "surface": "#553018",
            "surface_alt": "#70401f",
            "text": "#fff3de",
            "muted": "#e7c595",
            "accent": "#ffbe55",
            "glow": "#ffd27a",
            "particle": "#ffe6b8",
        },
        "effect": "leaves",
    },
    {
        "id": "tuyet_trang",
        "name": "Tuyết trắng",
        "description": "Nền sáng lạnh, tuyết mịn rơi nhẹ.",
        "tokens": {
            "bg": "#e4edf9",
            "bg2": "#ffffff",
            "surface": "#f7fbff",
            "surface_alt": "#ecf4ff",
            "text": "#102440",
            "muted": "#4b6382",
            "accent": "#6ab7ff",
            "glow": "#9bcfff",
            "particle": "#ffffff",
        },
        "effect": "snow",
    },
]


BLOCK_TAGS = {
    "p",
    "div",
    "section",
    "article",
    "header",
    "footer",
    "aside",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "li",
    "ul",
    "ol",
    "table",
    "thead",
    "tbody",
    "tr",
    "td",
    "th",
    "blockquote",
    "pre",
}


CHAPTER_HEADING_REGEX = re.compile(
    r"^(?:\s*)(?:Chương|CHƯƠNG|Chuong|CHUONG|Chapter|CHAPTER|卷|第\s*[\d一二三四五六七八九十百千零]+\s*章)[^\n]{0,120}$",
    re.MULTILINE,
)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def utc_now_ts() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def hash_text(value: str) -> str:
    return hashlib.sha1(value.encode("utf-8", errors="ignore")).hexdigest()


def quote_url_path(value: str) -> str:
    return quote(value or "", safe="")


def ensure_dirs() -> None:
    LOCAL_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    COVER_DIR.mkdir(parents=True, exist_ok=True)


def load_app_config() -> dict[str, Any]:
    if not APP_CONFIG_PATH.exists():
        return {}
    try:
        return json.loads(APP_CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def localname(tag: str) -> str:
    if not tag:
        return ""
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def resolve_zip_path(base_path: str, href: str) -> str:
    if not href:
        return ""
    href_clean = href.split("#", 1)[0].strip().replace("\\", "/")
    base = Path(base_path).as_posix()
    base_dir = base.rsplit("/", 1)[0] if "/" in base else ""
    joined = f"{base_dir}/{href_clean}" if base_dir else href_clean
    parts = []
    for p in joined.split("/"):
        if not p or p == ".":
            continue
        if p == "..":
            if parts:
                parts.pop()
            continue
        parts.append(p)
    return "/".join(parts)


class HtmlToTextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self._chunks: list[str] = []

    def handle_starttag(self, tag, attrs):
        t = (tag or "").lower()
        if t == "br":
            self._chunks.append("\n")
        elif t in BLOCK_TAGS:
            self._chunks.append("\n")

    def handle_endtag(self, tag):
        t = (tag or "").lower()
        if t in BLOCK_TAGS:
            self._chunks.append("\n")

    def handle_data(self, data):
        if data:
            self._chunks.append(data)

    def text(self) -> str:
        text = "".join(self._chunks)
        text = text.replace("\xa0", " ")
        text = re.sub(r"[ \t]+\n", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()


def html_to_text(html_content: str) -> str:
    parser = HtmlToTextParser()
    parser.feed(html_content or "")
    return parser.text()


def decode_text_with_fallback(data: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-8", "gb18030"):
        try:
            return data.decode(encoding)
        except Exception:
            continue
    return data.decode("utf-8", errors="replace")


def normalize_newlines(text: str) -> str:
    value = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    # Server dịch đôi lúc trả literal "\\n", chuyển về newline thật.
    if "\\n" in value:
        value = value.replace("\\r\\n", "\n").replace("\\n", "\n").replace("\\r", "\n")
    value = value.replace("\u2028", "\n").replace("\u2029", "\n")
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def smart_capitalize_vi(text: str) -> str:
    value = normalize_newlines(text or "")
    if not value:
        return value
    chars = list(value)
    cap_next = True
    sentence_breakers = {".", "!", "?", ";", "…", "\n", "。", "！", "？", ":"}
    skip_when_cap = {" ", "\t", "\"", "'", "“", "”", "‘", "’", "(", "[", "{", "<", "-", "*", "•", ">", "»", "«"}
    for i, ch in enumerate(chars):
        if cap_next:
            if ch.isalpha():
                chars[i] = ch.upper()
                cap_next = False
                continue
            if ch.isdigit():
                # Nếu đầu câu là số thì không ép viết hoa từ ngay sau số.
                cap_next = False
                continue
            if ch in skip_when_cap or ch.isspace():
                continue
            cap_next = False
        if ch in sentence_breakers:
            cap_next = True
    value = "".join(chars)
    value = re.sub(r"\s+([,.;!?])", r"\1", value)
    value = re.sub(r"([(\[“‘])\s+", r"\1", value)
    return value.strip()


NAME_PLACEHOLDER_PREFIX = "__TM_NAME_"


def normalize_name_set(name_set: Any) -> dict[str, str]:
    output: dict[str, str] = {}
    if not isinstance(name_set, dict):
        return output
    for raw_key, raw_value in name_set.items():
        key = str(raw_key or "").strip()
        value = str(raw_value or "").strip()
        if key and value:
            output[key] = value
    return output


def normalize_name_sets_collection(name_sets: Any) -> dict[str, dict[str, str]]:
    if not isinstance(name_sets, dict):
        return {"Mặc định": {}}
    cleaned: dict[str, dict[str, str]] = {}
    for raw_set_name, raw_set_data in name_sets.items():
        set_name = str(raw_set_name or "").strip() or "Mặc định"
        cleaned[set_name] = normalize_name_set(raw_set_data)
    if not cleaned:
        cleaned["Mặc định"] = {}
    return cleaned


def collect_name_hits(text: str, name_set: dict[str, str]) -> list[dict[str, Any]]:
    source = text or ""
    if not source:
        return []
    keys = sorted((k for k in name_set.keys() if k), key=len, reverse=True)
    if not keys:
        return []
    used = [False] * len(source)
    hits: list[dict[str, Any]] = []
    for key in keys:
        start = 0
        while True:
            idx = source.find(key, start)
            if idx < 0:
                break
            end = idx + len(key)
            if not any(used[idx:end]):
                for i in range(idx, end):
                    used[i] = True
                hits.append(
                    {
                        "start": idx,
                        "end": end,
                        "source": key,
                        "target": name_set.get(key, ""),
                    }
                )
            start = idx + 1
    hits.sort(key=lambda x: (int(x["start"]), -len(str(x["source"]))))
    return hits


def apply_name_placeholders(text: str, name_set: dict[str, str]) -> tuple[str, dict[str, dict[str, str]], list[dict[str, Any]]]:
    source = text or ""
    clean_set = normalize_name_set(name_set)
    if not clean_set:
        return source, {}, []

    keys = sorted(clean_set.keys(), key=len, reverse=True)
    placeholder_by_name: dict[str, str] = {}
    placeholder_map: dict[str, dict[str, str]] = {}
    output = source

    for key in keys:
        if key not in output:
            continue
        placeholder = placeholder_by_name.get(key)
        if not placeholder:
            placeholder = f"{NAME_PLACEHOLDER_PREFIX}{len(placeholder_map)}__"
            placeholder_by_name[key] = placeholder
            placeholder_map[placeholder] = {"source": key, "target": clean_set[key]}
        output = output.replace(key, placeholder)

    return output, placeholder_map, collect_name_hits(source, clean_set)


def restore_name_placeholders(text: str, placeholder_map: dict[str, dict[str, str]]) -> str:
    result = text or ""
    if not result or not placeholder_map:
        return result

    for placeholder, data in placeholder_map.items():
        result = re.sub(re.escape(placeholder), str(data.get("target") or ""), result)

    result = re.sub(r"\s+([,.;!?\)]|”|’|:)", r"\1", result)
    result = re.sub(r"([\(\[“‘])\s+", r"\1", result)
    result = re.sub(r"\s{2,}", " ", result)
    return result.strip()


def local_translate_preserve_placeholders(
    processed_text: str, hv_map: dict[str, Any], placeholder_map: dict[str, dict[str, str]]
) -> str:
    source = processed_text or ""
    if not source:
        return ""
    if not placeholder_map:
        hv = translator_logic.build_hanviet_from_map(source, hv_map)
        return hv or source

    placeholders = sorted(placeholder_map.keys(), key=len, reverse=True)
    if not placeholders:
        hv = translator_logic.build_hanviet_from_map(source, hv_map)
        return hv or source

    placeholder_regex = re.compile("|".join(re.escape(x) for x in placeholders))
    parts: list[str] = []
    last_pos = 0

    for match in placeholder_regex.finditer(source):
        if match.start() > last_pos:
            segment = source[last_pos : match.start()]
            hv = translator_logic.build_hanviet_from_map(segment, hv_map) or segment
            hv = hv.strip()
            if hv:
                parts.append(hv)
        parts.append(match.group(0))
        last_pos = match.end()

    if last_pos < len(source):
        segment = source[last_pos:]
        hv = translator_logic.build_hanviet_from_map(segment, hv_map) or segment
        hv = hv.strip()
        if hv:
            parts.append(hv)

    joined = " ".join(p for p in parts if p)
    joined = re.sub(r"\s{2,}", " ", joined)
    return joined.strip()


CJK_TOKEN_RE = re.compile(r"[\u3400-\u9fff]{2,}")


def normalize_for_compare(text: str) -> str:
    value = (text or "").lower().strip()
    if not value:
        return ""
    value = re.sub(r"[\s\W_]+", "", value, flags=re.UNICODE)
    return value


def _pick_name_set_source_from_target(selected_text: str, name_set: dict[str, str]) -> tuple[str, str] | None:
    selected = (selected_text or "").strip()
    selected_norm = normalize_for_compare(selected)
    if not selected_norm:
        return None

    best: tuple[str, str, float] | None = None
    for source, target_raw in normalize_name_set(name_set).items():
        target = str(target_raw or "").strip()
        if not target:
            continue
        options = [target] + [x.strip() for x in target.split("/") if x.strip()]
        for opt in options:
            opt_norm = normalize_for_compare(opt)
            if not opt_norm:
                continue
            score = 0.0
            if opt_norm == selected_norm:
                score = 1.0
            elif selected_norm in opt_norm or opt_norm in selected_norm:
                score = 0.86
            else:
                ratio = difflib.SequenceMatcher(None, selected_norm, opt_norm).ratio()
                if ratio >= 0.78:
                    score = ratio
            if score <= 0:
                continue
            if best is None or score > best[2]:
                best = (source, target, score)
    if not best:
        return None
    return best[0], best[1]


def _best_match_position(target_text: str, selected_text: str) -> tuple[int, int, float] | None:
    haystack = target_text or ""
    needle = (selected_text or "").strip()
    if not haystack or not needle:
        return None

    idx = haystack.find(needle)
    if idx >= 0:
        return idx, idx + len(needle), 1.0

    idx_low = haystack.lower().find(needle.lower())
    if idx_low >= 0:
        return idx_low, idx_low + len(needle), 0.98

    needle_norm = normalize_for_compare(needle)
    if not needle_norm:
        return None

    best: tuple[int, int, float] | None = None
    cursor = 0
    for line in haystack.split("\n"):
        start = cursor
        end = start + len(line)
        cursor = end + 1
        if len(line.strip()) < 3:
            continue
        line_norm = normalize_for_compare(line)
        if not line_norm:
            continue
        score = 0.0
        if needle_norm in line_norm:
            score = 0.92
        else:
            ratio = difflib.SequenceMatcher(None, needle_norm, line_norm).ratio()
            if ratio >= 0.5:
                score = ratio * 0.88
        if score <= 0:
            continue
        if best is None or score > best[2]:
            best = (start, end, score)
    return best


def _extract_cjk_candidates(
    raw_text: str,
    center_pos: int,
    *,
    name_set: dict[str, str] | None = None,
    max_items: int = 8,
) -> list[dict[str, Any]]:
    source = raw_text or ""
    if not source:
        return []
    center = max(0, min(len(source), int(center_pos)))
    left = max(0, center - 260)
    right = min(len(source), center + 260)
    segment = source[left:right]
    if not segment:
        return []

    scored: dict[str, dict[str, Any]] = {}

    def push_candidate(token: str, start: int, end: int, bonus: float = 0.0) -> None:
        if not token or len(token) < 2:
            return
        local_center = (start + end) // 2
        distance = abs(local_center - center)
        score = max(0.0, 260.0 - float(distance)) + float(len(token) * 7) + float(bonus)
        cur = scored.get(token)
        data = {
            "source": token,
            "start": int(start),
            "end": int(end),
            "score": round(score, 4),
        }
        if cur is None or score > float(cur.get("score", 0)):
            scored[token] = data

    for m in CJK_TOKEN_RE.finditer(segment):
        token = m.group(0).strip()
        push_candidate(token, left + m.start(), left + m.end())

    if isinstance(name_set, dict) and name_set:
        for src in normalize_name_set(name_set).keys():
            if not src:
                continue
            for m in re.finditer(re.escape(src), segment):
                push_candidate(src, left + m.start(), left + m.end(), bonus=42.0)

    items = sorted(scored.values(), key=lambda x: (-float(x["score"]), int(x["start"])))
    return items[:max_items]


def _text_snippet(text: str, start: int, end: int, radius: int = 56) -> str:
    source = text or ""
    if not source:
        return ""
    s = max(0, int(start) - radius)
    e = min(len(source), int(end) + radius)
    return source[s:e].strip()


def map_selection_to_name_source(
    *,
    raw_text: str,
    translated_text: str,
    selected_text: str,
    name_set: dict[str, str],
) -> dict[str, Any]:
    selected = (selected_text or "").strip()
    source_raw = normalize_newlines(raw_text or "")
    source_trans = normalize_newlines(translated_text or "")
    cleaned_set = normalize_name_set(name_set)

    if not selected:
        return {
            "selected_text": "",
            "source_candidate": "",
            "target_candidate": "",
            "match_type": "empty",
            "score": 0.0,
            "source_context": "",
            "translated_context": "",
            "candidates": [],
        }

    has_cjk = bool(re.search(r"[\u3400-\u9fff]", selected))
    if has_cjk:
        value = selected
        target = cleaned_set.get(value, "")
        return {
            "selected_text": selected,
            "source_candidate": value,
            "target_candidate": target or selected,
            "match_type": "selection_is_cjk",
            "score": 1.0,
            "source_context": _text_snippet(source_raw, source_raw.find(value), source_raw.find(value) + len(value)) if value in source_raw else "",
            "translated_context": "",
            "candidates": [{"source": value, "score": 1.0}],
        }

    mapped = _pick_name_set_source_from_target(selected, cleaned_set)
    if mapped:
        source_key, target_value = mapped
        idx = source_raw.find(source_key)
        return {
            "selected_text": selected,
            "source_candidate": source_key,
            "target_candidate": target_value or selected,
            "match_type": "name_set_exact",
            "score": 1.0,
            "source_context": _text_snippet(source_raw, idx, idx + len(source_key)) if idx >= 0 else "",
            "translated_context": "",
            "candidates": [{"source": source_key, "score": 1.0}],
        }

    match_pos = _best_match_position(source_trans, selected)
    if match_pos is not None:
        tr_start, tr_end, tr_score = match_pos
        ratio = tr_start / max(1, len(source_trans))
        raw_center = int(round(ratio * max(1, len(source_raw))))
    else:
        tr_start, tr_end, tr_score = 0, min(len(source_trans), len(selected)), 0.0
        raw_center = max(0, len(source_raw) // 2)

    candidates = _extract_cjk_candidates(source_raw, raw_center, name_set=cleaned_set, max_items=10)
    source_candidate = candidates[0]["source"] if candidates else ""
    source_context = ""
    if candidates:
        source_context = _text_snippet(source_raw, int(candidates[0]["start"]), int(candidates[0]["end"]))
    elif source_raw:
        source_context = _text_snippet(source_raw, raw_center, raw_center + 1)

    translated_context = _text_snippet(source_trans, tr_start, tr_end) if source_trans else ""
    compact_candidates = [{"source": c["source"], "score": c["score"]} for c in candidates]

    return {
        "selected_text": selected,
        "source_candidate": source_candidate,
        "target_candidate": selected,
        "match_type": "nearest_cjk",
        "score": float(round(tr_score, 4)),
        "source_context": source_context,
        "translated_context": translated_context,
        "candidates": compact_candidates,
    }


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


def split_text_into_chapters(text: str, target_size: int = 4500) -> list[dict[str, str]]:
    normalized = normalize_text_for_split(text)
    if not normalized:
        return []
    matches = list(CHAPTER_HEADING_REGEX.finditer(normalized))
    if not matches:
        return split_by_newlines(normalized, target_size=target_size)

    chapters: list[dict[str, str]] = []
    if matches[0].start() > 0:
        preface = normalize_text_for_split(normalized[: matches[0].start()])
        if preface:
            chapters.append({"title": "Mở đầu", "text": preface})

    for i, m in enumerate(matches):
        title = (m.group(0) or "").strip() or f"Chương {i+1}"
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(normalized)
        content = normalize_text_for_split(normalized[start:end])
        if content:
            chapters.append({"title": title, "text": content})

    if not chapters:
        return split_by_newlines(normalized, target_size=target_size)

    min_len = max(800, int(target_size * 0.25))
    max_len = max(target_size * 2, 9000)
    avg = sum(len(c["text"]) for c in chapters) / max(len(chapters), 1)
    too_short = sum(1 for c in chapters if len(c["text"]) < min_len // 2)
    too_long = sum(1 for c in chapters if len(c["text"]) > max_len)
    fallback = len(chapters) > 5 and (
        avg < min_len * 0.6 or too_short / len(chapters) > 0.6 or too_long > 0
    )
    if fallback:
        return split_by_newlines(normalized, target_size=target_size)

    return merge_short_chapters(chapters, min_len)


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


def parse_epub_chapters(data: bytes, custom_title: str | None = None) -> tuple[str, str, list[dict[str, str]]]:
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

        metadata_el = find_first_by_localname(opf_doc, "metadata") or opf_doc
        title_el = find_first_by_localname(metadata_el, "title")
        creator_el = find_first_by_localname(metadata_el, "creator")

        title = (custom_title or "").strip() or (title_el.text or "").strip() or "Untitled"
        author = (creator_el.text or "").strip()

        manifest: dict[str, dict[str, str]] = {}
        for item in find_all_by_localname(opf_doc, "item"):
            item_id = item.attrib.get("id", "").strip()
            href = item.attrib.get("href", "").strip()
            media_type = item.attrib.get("media-type", "").strip()
            if not item_id or not href:
                continue
            resolved = resolve_zip_path(opf_path, href)
            manifest[item_id] = {"href": href, "resolved": resolved, "media_type": media_type}

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
            content = html_to_text(raw_html)
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

        return title, author, chapters


@dataclass
class TranslationAdapter:
    app_config: dict[str, Any]
    active_name_set: dict[str, str] | None = None
    active_set_name: str = "Mặc định"
    name_set_version: int = 1

    def _settings(self) -> dict[str, Any]:
        cfg = self.app_config.get("translator_settings") or {}
        return {
            "serverUrl": cfg.get("serverUrl", "https://dichngay.com/translate/text"),
            "hanvietJsonUrl": cfg.get(
                "hanvietJsonUrl",
                "https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/han_viet/output.json",
            ),
            "delayMs": int(cfg.get("delayMs", 250) or 250),
            "maxChars": int(cfg.get("maxChars", 4500) or 4500),
            "proxies": cfg.get("proxies"),
        }

    def _active_name_set(self) -> dict[str, str]:
        if isinstance(self.active_name_set, dict):
            return normalize_name_set(self.active_name_set)
        name_sets = self.app_config.get("nameSets") or {}
        active = self.app_config.get("activeNameSet")
        if active and isinstance(name_sets.get(active), dict):
            return normalize_name_set(name_sets[active])
        if name_sets:
            first = next(iter(name_sets.keys()))
            if isinstance(name_sets.get(first), dict):
                return normalize_name_set(name_sets[first])
        return {}

    def _name_set_for_use(self, name_set_override: dict[str, str] | None = None) -> dict[str, str]:
        if isinstance(name_set_override, dict):
            return normalize_name_set(name_set_override)
        return self._active_name_set()

    def translation_signature(self, mode: str = "server", name_set_override: dict[str, str] | None = None) -> str:
        payload = {
            "mode": (mode or "server").strip().lower(),
            "active_set": str(self.active_set_name or "Mặc định"),
            "version": int(self.name_set_version or 1),
            "text_norm_version": 2,
            "name_set": self._name_set_for_use(name_set_override),
        }
        raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        return hashlib.sha1(raw.encode("utf-8", errors="ignore")).hexdigest()

    def translate_detailed(
        self,
        text: str,
        mode: str = "server",
        name_set_override: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        source = (text or "").strip()
        if not source:
            return {
                "source_text": "",
                "processed_text": "",
                "translated_with_placeholders": "",
                "translated": "",
                "mode": "server" if mode != "local" else "local",
                "name_map": {
                    "active_set": str(self.active_set_name or "Mặc định"),
                    "version": int(self.name_set_version or 1),
                    "size": 0,
                    "placeholders": [],
                    "hits": [],
                },
                "hanviet_source": "",
            }

        mode_norm = (mode or "server").strip().lower()
        if mode_norm not in {"server", "local"}:
            mode_norm = "server"

        settings = self._settings()
        name_set = self._name_set_for_use(name_set_override)
        processed_text, placeholder_map, hits = apply_name_placeholders(source, name_set)
        translated_with_placeholders = ""
        hanviet_source = ""

        if mode_norm == "local":
            hv_map = translator_logic.load_hanviet_json(settings.get("hanvietJsonUrl", ""))
            hanviet_source = translator_logic.build_hanviet_from_map(source, hv_map) or source
            translated_with_placeholders = local_translate_preserve_placeholders(
                processed_text,
                hv_map,
                placeholder_map,
            )
        else:
            translated_list = translator_logic.translate_text_chunks(
                [processed_text],
                name_set={},
                settings=settings,
                update_progress_callback=None,
                target_lang="vi",
            )
            translated_with_placeholders = (translated_list[0] if translated_list and translated_list[0] else processed_text)

        translated = restore_name_placeholders(translated_with_placeholders, placeholder_map)
        translated = normalize_newlines(translated)
        translated = smart_capitalize_vi(translated)
        if not translated:
            translated = source

        placeholders = [
            {
                "placeholder": ph,
                "source": data.get("source") or "",
                "target": data.get("target") or "",
            }
            for ph, data in placeholder_map.items()
        ]
        placeholders.sort(key=lambda x: x["placeholder"])

        return {
            "source_text": source,
            "processed_text": processed_text,
            "translated_with_placeholders": translated_with_placeholders,
            "translated": translated,
            "mode": mode_norm,
            "name_map": {
                "active_set": str(self.active_set_name or "Mặc định"),
                "version": int(self.name_set_version or 1),
                "size": len(name_set),
                "placeholders": placeholders,
                "hits": hits,
            },
            "hanviet_source": hanviet_source,
        }

    def translate(self, text: str, mode: str = "server") -> str:
        return self.translate_detailed(text, mode=mode).get("translated", "")


class ReaderStorage:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        ensure_dirs()
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                PRAGMA journal_mode=WAL;

                CREATE TABLE IF NOT EXISTS books (
                    book_id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    title_vi TEXT,
                    author TEXT DEFAULT '',
                    author_vi TEXT,
                    lang_source TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    source_file_path TEXT DEFAULT '',
                    cover_path TEXT DEFAULT '',
                    extra_link TEXT DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    chapter_count INTEGER NOT NULL DEFAULT 0,
                    last_read_chapter_id TEXT,
                    last_read_ratio REAL,
                    last_read_mode TEXT DEFAULT 'raw',
                    theme_pref TEXT,
                    summary TEXT DEFAULT ''
                );

                CREATE TABLE IF NOT EXISTS chapters (
                    chapter_id TEXT PRIMARY KEY,
                    book_id TEXT NOT NULL,
                    chapter_order INTEGER NOT NULL,
                    title_raw TEXT NOT NULL,
                    title_vi TEXT,
                    raw_key TEXT NOT NULL,
                    trans_key TEXT,
                    trans_sig TEXT,
                    updated_at TEXT NOT NULL,
                    word_count INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY(book_id) REFERENCES books(book_id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_chapters_book_order ON chapters(book_id, chapter_order);

                CREATE TABLE IF NOT EXISTS content_cache (
                    cache_key TEXT PRIMARY KEY,
                    lang TEXT NOT NULL,
                    text_path TEXT NOT NULL,
                    sha256 TEXT NOT NULL,
                    bytes INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS jobs (
                    job_id TEXT PRIMARY KEY,
                    type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    progress REAL NOT NULL DEFAULT 0,
                    message TEXT,
                    details TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS app_state (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                """
            )
            self._ensure_column(conn, "books", "title_vi", "TEXT")
            self._ensure_column(conn, "books", "author_vi", "TEXT")
            self._ensure_column(conn, "books", "cover_path", "TEXT DEFAULT ''")
            self._ensure_column(conn, "books", "extra_link", "TEXT DEFAULT ''")
            self._ensure_column(conn, "chapters", "trans_sig", "TEXT")

    def _ensure_column(self, conn: sqlite3.Connection, table: str, column: str, decl: str) -> None:
        rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
        names = {str(r[1]) for r in rows}
        if column in names:
            return
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {decl}")

    def _safe_filename(self, name: str, max_len: int = 80) -> str:
        cleaned = re.sub(r"[\\/:*?\"<>|]+", "_", (name or "book")).strip()
        cleaned = re.sub(r"\s+", " ", cleaned)
        cleaned = cleaned[:max_len].strip()
        return cleaned or "book"

    def _cache_path_for_key(self, cache_key: str) -> Path:
        prefix = cache_key[:2]
        folder = CACHE_DIR / prefix
        folder.mkdir(parents=True, exist_ok=True)
        return folder / f"{cache_key}.txt"

    def write_cache(self, cache_key: str, lang: str, text: str) -> dict[str, Any]:
        now = utc_now_iso()
        raw = (text or "").encode("utf-8")
        sha256 = hashlib.sha256(raw).hexdigest()
        path = self._cache_path_for_key(cache_key)
        path.write_bytes(raw)

        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO content_cache(cache_key, lang, text_path, sha256, bytes, created_at, updated_at)
                VALUES(?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(cache_key) DO UPDATE SET
                    lang=excluded.lang,
                    text_path=excluded.text_path,
                    sha256=excluded.sha256,
                    bytes=excluded.bytes,
                    updated_at=excluded.updated_at
                """,
                (cache_key, lang, str(path), sha256, len(raw), now, now),
            )
        return {"cache_key": cache_key, "path": str(path), "sha256": sha256, "bytes": len(raw)}

    def read_cache(self, cache_key: str) -> str | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT text_path FROM content_cache WHERE cache_key = ?", (cache_key,)
            ).fetchone()
        if not row:
            return None
        path = Path(row["text_path"])
        if not path.exists():
            return None
        return decode_text_with_fallback(path.read_bytes())

    def _get_app_state_value(self, key: str) -> str | None:
        with self._connect() as conn:
            row = conn.execute("SELECT value FROM app_state WHERE key = ?", (key,)).fetchone()
        if row and row["value"] is not None:
            return str(row["value"])
        return None

    def _set_app_state_value(self, key: str, value: str) -> None:
        now = utc_now_iso()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO app_state(key, value, updated_at)
                VALUES(?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    updated_at = excluded.updated_at
                """,
                (key, value, now),
            )

    def _load_name_set_state_raw(self) -> dict[str, Any] | None:
        raw = self._get_app_state_value(APP_STATE_NAME_SET_STATE_KEY)
        if not raw:
            return None
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return None
        return None

    def _normalize_name_set_state(
        self,
        state: dict[str, Any] | None,
        *,
        default_sets: dict[str, Any] | None = None,
        active_default: str | None = None,
    ) -> dict[str, Any]:
        base_sets = (state or {}).get("sets")
        if base_sets is None:
            base_sets = default_sets if isinstance(default_sets, dict) else {}
        sets = normalize_name_sets_collection(base_sets)

        active = str((state or {}).get("active_set") or active_default or "").strip()
        if active not in sets:
            active = next(iter(sets.keys()))

        version_raw = (state or {}).get("version")
        try:
            version = max(1, int(version_raw or 1))
        except Exception:
            version = 1

        return {"sets": sets, "active_set": active, "version": version}

    def _persist_name_set_state(self, state: dict[str, Any]) -> None:
        self._set_app_state_value(
            APP_STATE_NAME_SET_STATE_KEY,
            json.dumps(state, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
        )

    def get_name_set_state(
        self,
        *,
        default_sets: dict[str, Any] | None = None,
        active_default: str | None = None,
    ) -> dict[str, Any]:
        raw_state = self._load_name_set_state_raw()
        normalized = self._normalize_name_set_state(
            raw_state,
            default_sets=default_sets,
            active_default=active_default,
        )
        if raw_state is None or self._normalize_name_set_state(raw_state) != normalized:
            self._persist_name_set_state(normalized)
        return normalized

    def set_name_set_state(
        self,
        sets: dict[str, Any] | None,
        *,
        active_set: str | None = None,
        bump_version: bool = True,
    ) -> dict[str, Any]:
        current = self.get_name_set_state()
        normalized_sets = normalize_name_sets_collection(sets if isinstance(sets, dict) else current.get("sets") or {})
        desired_active = str(active_set or current.get("active_set") or "").strip()
        if desired_active not in normalized_sets:
            desired_active = next(iter(normalized_sets.keys()))
        next_version = int(current.get("version") or 1)
        if bump_version:
            next_version += 1
        final_state = {
            "sets": normalized_sets,
            "active_set": desired_active,
            "version": max(1, int(next_version)),
        }
        self._persist_name_set_state(final_state)
        return final_state

    def update_name_set_entry(
        self,
        source: str,
        target: str,
        *,
        set_name: str | None = None,
        delete: bool = False,
    ) -> dict[str, Any]:
        source_key = (source or "").strip()
        if not source_key:
            raise ValueError("Thiếu source cho entry name set.")

        state = self.get_name_set_state()
        sets = normalize_name_sets_collection(state.get("sets") or {})
        active = str(set_name or state.get("active_set") or "").strip()
        if active not in sets:
            sets[active or "Mặc định"] = {}
            active = active or "Mặc định"

        target_value = (target or "").strip()
        if delete or not target_value:
            sets[active].pop(source_key, None)
        else:
            sets[active][source_key] = target_value

        return self.set_name_set_state(sets, active_set=active, bump_version=True)

    def get_active_name_set(
        self,
        *,
        default_sets: dict[str, Any] | None = None,
        active_default: str | None = None,
    ) -> tuple[str, dict[str, str], int]:
        state = self.get_name_set_state(default_sets=default_sets, active_default=active_default)
        active = state["active_set"]
        sets = state["sets"]
        return active, normalize_name_set(sets.get(active) or {}), int(state.get("version") or 1)

    def get_theme_active(self) -> str:
        value = self._get_app_state_value(APP_STATE_THEME_ACTIVE_KEY)
        if value:
            return value
        return "sao_dem"

    def set_theme_active(self, theme_id: str) -> None:
        self._set_app_state_value(APP_STATE_THEME_ACTIVE_KEY, str(theme_id or "").strip() or "sao_dem")

    def create_book(
        self,
        *,
        title: str,
        author: str,
        lang_source: str,
        source_type: str,
        summary: str,
        chapters: list[dict[str, str]],
        source_file_path: str = "",
    ) -> dict[str, Any]:
        created_at = utc_now_iso()
        book_seed = f"{title}|{author}|{created_at}|{source_type}"
        book_id = f"bk_{hash_text(book_seed)}"

        chapter_rows: list[tuple[Any, ...]] = []
        for idx, ch in enumerate(chapters, start=1):
            chapter_title = (ch.get("title") or f"Chương {idx}").strip() or f"Chương {idx}"
            chapter_text = (ch.get("text") or "").strip()
            chapter_id = f"ch_{hash_text(f'{book_id}|{idx}|{chapter_title}') }"
            raw_key = f"raw_{hash_text(f'{chapter_id}|{chapter_text}') }"
            self.write_cache(raw_key, lang_source, chapter_text)
            chapter_rows.append(
                (
                    chapter_id,
                    book_id,
                    idx,
                    chapter_title,
                    None,
                    raw_key,
                    None,
                    None,
                    created_at,
                    len(chapter_text),
                )
            )

        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO books(
                    book_id, title, title_vi, author, author_vi, lang_source, source_type, source_file_path,
                    cover_path, extra_link, created_at, updated_at, chapter_count, summary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    book_id,
                    title.strip() or "Untitled",
                    title.strip() if lang_source == "vi" else None,
                    author.strip(),
                    author.strip() if lang_source == "vi" else None,
                    lang_source,
                    source_type,
                    source_file_path,
                    "",
                    "",
                    created_at,
                    created_at,
                    len(chapter_rows),
                    summary,
                ),
            )
            conn.executemany(
                """
                INSERT INTO chapters(
                    chapter_id, book_id, chapter_order, title_raw, title_vi,
                    raw_key, trans_key, trans_sig, updated_at, word_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                chapter_rows,
            )

        return self.get_book_detail(book_id)

    def list_books(self) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT book_id, title, title_vi, author, lang_source, source_type, source_file_path,
                       author_vi, cover_path, extra_link,
                       created_at, updated_at, chapter_count,
                       last_read_chapter_id, last_read_ratio, last_read_mode, theme_pref,
                       summary
                FROM books
                ORDER BY updated_at DESC
                """
            ).fetchall()
        output: list[dict[str, Any]] = []
        for row in rows:
            item = dict(row)
            item["title_display"] = item.get("title_vi") or item.get("title")
            item["author_display"] = item.get("author_vi") or item.get("author")
            item["cover_url"] = self._book_cover_url(item)
            output.append(item)
        return output

    def find_book(self, book_id: str) -> dict[str, Any] | None:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM books WHERE book_id = ?", (book_id,)).fetchone()
        return dict(row) if row else None

    def _book_cover_url(self, book: dict[str, Any] | None) -> str:
        if not book:
            return ""
        cover = (book.get("cover_path") or "").strip()
        if not cover:
            return ""
        if cover.startswith("http://") or cover.startswith("https://") or cover.startswith("data:"):
            return cover
        return f"/media/cover/{quote_url_path(Path(cover).name)}"

    def update_book_metadata(self, book_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        book = self.find_book(book_id)
        if not book:
            return None
        now = utc_now_iso()
        allowed = {
            "title": (payload.get("title") or "").strip(),
            "title_vi": (payload.get("title_vi") or "").strip(),
            "author": (payload.get("author") or "").strip(),
            "author_vi": (payload.get("author_vi") or "").strip(),
            "summary": (payload.get("summary") or "").strip(),
            "extra_link": (payload.get("extra_link") or "").strip(),
        }
        if "cover_path" in payload:
            allowed["cover_path"] = (payload.get("cover_path") or "").strip()

        set_parts: list[str] = []
        values: list[Any] = []
        for key, value in allowed.items():
            if key == "title" and not value:
                continue
            set_parts.append(f"{key} = ?")
            values.append(value)
        if not set_parts:
            return self.get_book_detail(book_id)
        set_parts.append("updated_at = ?")
        values.append(now)
        values.append(book_id)
        with self._connect() as conn:
            conn.execute(f"UPDATE books SET {', '.join(set_parts)} WHERE book_id = ?", tuple(values))
        return self.get_book_detail(book_id)

    def set_book_cover_upload(self, book_id: str, filename: str, content: bytes) -> dict[str, Any] | None:
        book = self.find_book(book_id)
        if not book:
            return None
        suffix = Path(filename or "cover.jpg").suffix.lower() or ".jpg"
        if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            suffix = ".jpg"
        path = COVER_DIR / f"{book_id}{suffix}"
        path.write_bytes(content)
        return self.update_book_metadata(book_id, {"cover_path": str(path)})

    def translate_book_titles(self, book_id: str, translator: TranslationAdapter, translate_mode: str) -> None:
        book = self.find_book(book_id)
        if not book:
            return
        now = utc_now_iso()
        with self._connect() as conn:
            # Dịch tên truyện nếu cần.
            if book.get("lang_source") != "vi":
                raw_title = (book.get("title") or "").strip()
                vi_title = (book.get("title_vi") or "").strip()
                if raw_title and (not vi_title):
                    translated_title = smart_capitalize_vi(normalize_newlines(translator.translate(raw_title, mode=translate_mode)))
                    if translated_title:
                        conn.execute(
                            "UPDATE books SET title_vi = ?, updated_at = ? WHERE book_id = ?",
                            (translated_title, now, book_id),
                        )
                raw_author = (book.get("author") or "").strip()
                vi_author = (book.get("author_vi") or "").strip()
                if raw_author and (not vi_author):
                    translated_author = smart_capitalize_vi(
                        normalize_newlines(translator.translate(raw_author, mode=translate_mode))
                    )
                    if translated_author:
                        conn.execute(
                            "UPDATE books SET author_vi = ?, updated_at = ? WHERE book_id = ?",
                            (translated_author, now, book_id),
                        )
            # Dịch tên chương còn thiếu.
            rows = conn.execute(
                "SELECT chapter_id, title_raw, title_vi FROM chapters WHERE book_id = ? ORDER BY chapter_order",
                (book_id,),
            ).fetchall()
            for row in rows:
                raw_title = (row["title_raw"] or "").strip()
                vi_title = (row["title_vi"] or "").strip()
                if not raw_title or vi_title:
                    continue
                translated = smart_capitalize_vi(normalize_newlines(translator.translate(raw_title, mode=translate_mode)))
                if translated:
                    conn.execute(
                        "UPDATE chapters SET title_vi = ?, updated_at = ? WHERE chapter_id = ?",
                        (translated, now, row["chapter_id"]),
                    )

    def list_chapters_paged(
        self,
        book_id: str,
        *,
        page: int,
        page_size: int,
        mode: str,
        translator: TranslationAdapter,
        translate_mode: str,
    ) -> dict[str, Any]:
        page = max(1, int(page))
        page_size = max(1, min(200, int(page_size)))
        if mode == "trans":
            self.translate_book_titles(book_id, translator, translate_mode)

        with self._connect() as conn:
            total = conn.execute("SELECT COUNT(1) AS c FROM chapters WHERE book_id = ?", (book_id,)).fetchone()["c"]
            offset = (page - 1) * page_size
            rows = conn.execute(
                """
                SELECT chapter_id, chapter_order, title_raw, title_vi, updated_at, word_count, trans_key
                FROM chapters
                WHERE book_id = ?
                ORDER BY chapter_order ASC
                LIMIT ? OFFSET ?
                """,
                (book_id, page_size, offset),
            ).fetchall()
        items = []
        for r in rows:
            rdict = dict(r)
            display_title = rdict["title_vi"] if mode == "trans" and rdict.get("title_vi") else rdict["title_raw"]
            items.append(
                {
                    "chapter_id": rdict["chapter_id"],
                    "chapter_order": rdict["chapter_order"],
                    "title_raw": rdict["title_raw"],
                    "title_vi": rdict.get("title_vi"),
                    "title_display": display_title,
                    "updated_at": rdict["updated_at"],
                    "word_count": rdict["word_count"],
                    "has_trans": bool(rdict.get("trans_key")),
                }
            )
        total_pages = max(1, (total + page_size - 1) // page_size)
        return {
            "items": items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_items": total,
                "total_pages": total_pages,
            },
        }

    def get_chapter_rows(self, book_id: str) -> list[dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT chapter_id, book_id, chapter_order, title_raw, title_vi,
                       raw_key, trans_key, trans_sig, updated_at, word_count
                FROM chapters
                WHERE book_id = ?
                ORDER BY chapter_order ASC
                """,
                (book_id,),
            ).fetchall()
        return [dict(r) for r in rows]

    def find_chapter(self, chapter_id: str) -> dict[str, Any] | None:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM chapters WHERE chapter_id = ?", (chapter_id,)).fetchone()
        return dict(row) if row else None

    def update_chapter_trans(self, chapter_id: str, trans_key: str, trans_sig: str | None = None) -> None:
        now = utc_now_iso()
        with self._connect() as conn:
            conn.execute(
                "UPDATE chapters SET trans_key = ?, trans_sig = ?, updated_at = ? WHERE chapter_id = ?",
                (trans_key, trans_sig, now, chapter_id),
            )

    def update_book_progress(
        self,
        book_id: str,
        *,
        chapter_id: str | None,
        ratio: float | None,
        mode: str | None,
        theme_pref: str | None,
    ) -> None:
        now = utc_now_iso()
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE books SET
                    last_read_chapter_id = COALESCE(?, last_read_chapter_id),
                    last_read_ratio = COALESCE(?, last_read_ratio),
                    last_read_mode = COALESCE(?, last_read_mode),
                    theme_pref = COALESCE(?, theme_pref),
                    updated_at = ?
                WHERE book_id = ?
                """,
                (chapter_id, ratio, mode, theme_pref, now, book_id),
            )

    def get_book_detail(self, book_id: str) -> dict[str, Any] | None:
        book = self.find_book(book_id)
        if not book:
            return None
        chapters = self.get_chapter_rows(book_id)
        book["title_display"] = book.get("title_vi") or book.get("title")
        book["author_display"] = book.get("author_vi") or book.get("author")
        book["cover_url"] = self._book_cover_url(book)
        book["chapters"] = [
            {
                "chapter_id": ch["chapter_id"],
                "chapter_order": ch["chapter_order"],
                "title_raw": ch["title_raw"],
                "title_vi": ch["title_vi"],
                "title_display": ch["title_vi"] or ch["title_raw"],
                "updated_at": ch["updated_at"],
                "word_count": ch["word_count"],
                "has_trans": bool(ch.get("trans_key")),
            }
            for ch in chapters
        ]
        return book

    def delete_book(self, book_id: str) -> bool:
        book = self.find_book(book_id)
        chapters = self.get_chapter_rows(book_id)
        if not chapters and not book:
            return False

        content_keys = {ch["raw_key"] for ch in chapters if ch.get("raw_key")}
        content_keys.update(ch["trans_key"] for ch in chapters if ch.get("trans_key"))

        with self._connect() as conn:
            conn.execute("DELETE FROM chapters WHERE book_id = ?", (book_id,))
            conn.execute("DELETE FROM books WHERE book_id = ?", (book_id,))

        self._delete_cache_keys(content_keys)

        epub_file = CACHE_DIR / "epub_sources" / f"{book_id}.epub"
        if epub_file.exists():
            try:
                epub_file.unlink()
            except Exception:
                pass
        cover_path = (book or {}).get("cover_path") or ""
        if cover_path and not cover_path.startswith(("http://", "https://", "data:")):
            cp = Path(cover_path)
            if cp.exists():
                try:
                    cp.unlink()
                except Exception:
                    pass
        return True

    def _delete_cache_keys(self, keys: set[str]) -> int:
        deleted = 0
        if not keys:
            return deleted
        with self._connect() as conn:
            rows = conn.execute(
                f"SELECT cache_key, text_path FROM content_cache WHERE cache_key IN ({','.join('?' for _ in keys)})",
                tuple(keys),
            ).fetchall()
            conn.execute(
                f"DELETE FROM content_cache WHERE cache_key IN ({','.join('?' for _ in keys)})",
                tuple(keys),
            )
        for row in rows:
            p = Path(row["text_path"])
            if p.exists():
                try:
                    p.unlink()
                    deleted += 1
                except Exception:
                    pass
        return deleted

    def clear_translated_cache(self) -> dict[str, Any]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT cache_key, text_path FROM content_cache WHERE cache_key LIKE 'tr_%'"
            ).fetchall()
            conn.execute("DELETE FROM content_cache WHERE cache_key LIKE 'tr_%'")
            conn.execute("UPDATE chapters SET trans_key = NULL, trans_sig = NULL, updated_at = ?", (utc_now_iso(),))

        deleted_files = 0
        bytes_deleted = 0
        for row in rows:
            p = Path(row["text_path"])
            if p.exists():
                try:
                    bytes_deleted += p.stat().st_size
                    p.unlink()
                    deleted_files += 1
                except Exception:
                    pass
        return {"deleted_files": deleted_files, "bytes_deleted": bytes_deleted}

    def search(self, query: str) -> dict[str, Any]:
        key = (query or "").strip().lower()
        if not key:
            books = self.list_books()
            return {"books": books, "chapters": []}

        with self._connect() as conn:
            book_rows = conn.execute(
                """
                SELECT book_id, title, title_vi, author, author_vi, lang_source, source_type, chapter_count, updated_at, cover_path
                FROM books
                WHERE lower(title) LIKE ? OR lower(COALESCE(title_vi,'')) LIKE ?
                   OR lower(author) LIKE ? OR lower(COALESCE(author_vi,'')) LIKE ?
                ORDER BY updated_at DESC
                """,
                (f"%{key}%", f"%{key}%", f"%{key}%", f"%{key}%"),
            ).fetchall()

            chapter_rows = conn.execute(
                """
                SELECT c.chapter_id, c.book_id, c.chapter_order, c.title_raw, c.title_vi,
                       b.title AS book_title, b.title_vi AS book_title_vi
                FROM chapters c
                JOIN books b ON b.book_id = c.book_id
                WHERE lower(c.title_raw) LIKE ? OR lower(COALESCE(c.title_vi, '')) LIKE ?
                ORDER BY c.updated_at DESC
                LIMIT 120
                """,
                (f"%{key}%", f"%{key}%"),
            ).fetchall()

        return {
            "books": [
                {
                    **dict(r),
                    "title_display": (dict(r).get("title_vi") or dict(r).get("title")),
                    "author_display": (dict(r).get("author_vi") or dict(r).get("author")),
                    "cover_url": self._book_cover_url(dict(r)),
                }
                for r in book_rows
            ],
            "chapters": [
                {
                    **dict(r),
                    "title_display": (dict(r).get("title_vi") or dict(r).get("title_raw")),
                    "book_title_display": (dict(r).get("book_title_vi") or dict(r).get("book_title")),
                }
                for r in chapter_rows
            ],
        }

    def save_epub_source(self, book_id: str, content: bytes) -> str:
        folder = CACHE_DIR / "epub_sources"
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / f"{book_id}.epub"
        path.write_bytes(content)
        with self._connect() as conn:
            conn.execute(
                "UPDATE books SET source_file_path = ?, updated_at = ? WHERE book_id = ?",
                (str(path), utc_now_iso(), book_id),
            )
        return str(path)

    def create_export_txt(self, book_id: str, ensure_translated: bool, translator: TranslationAdapter, translate_mode: str) -> Path:
        book = self.find_book(book_id)
        if not book:
            raise ValueError("Không tìm thấy truyện.")
        chapters = self.get_chapter_rows(book_id)
        if not chapters:
            raise ValueError("Truyện chưa có chương.")

        output_lines: list[str] = []
        for ch in chapters:
            title = ch["title_vi"] or ch["title_raw"] or f"Chương {ch['chapter_order']}"
            text = self.get_chapter_text(ch, book, mode="trans" if ensure_translated else "raw", translator=translator, translate_mode=translate_mode)
            output_lines.extend([title, "", text, ""])

        safe_name = self._safe_filename(book["title"])
        ts = utc_now_ts()
        out = EXPORT_DIR / f"{safe_name}_{ts}.txt"
        out.write_text("\n".join(output_lines), encoding="utf-8")
        return out

    def create_export_epub(self, book_id: str, ensure_translated: bool, translator: TranslationAdapter, translate_mode: str) -> Path:
        book = self.find_book(book_id)
        if not book:
            raise ValueError("Không tìm thấy truyện.")
        chapters = self.get_chapter_rows(book_id)
        if not chapters:
            raise ValueError("Truyện chưa có chương.")

        safe_name = self._safe_filename(book["title"])
        ts = utc_now_ts()
        out = EXPORT_DIR / f"{safe_name}_{ts}.epub"

        uid = book["book_id"]
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        files: dict[str, bytes] = {}
        files["mimetype"] = b"application/epub+zip"
        files[
            "META-INF/container.xml"
        ] = b'<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'

        manifest_items = [
            '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'
        ]
        spine_items: list[str] = []
        nav_points: list[str] = []

        for idx, ch in enumerate(chapters, start=1):
            title = ch["title_vi"] or ch["title_raw"] or f"Chương {idx}"
            text = self.get_chapter_text(ch, book, mode="trans" if ensure_translated else "raw", translator=translator, translate_mode=translate_mode)
            content_html = "\n".join(
                f"<p>{html.escape(line)}</p>" if line.strip() else "<p><br/></p>"
                for line in text.split("\n")
            )
            xhtml_name = f"Text/chapter_{idx}.xhtml"
            xhtml = (
                "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
                '<html xmlns="http://www.w3.org/1999/xhtml">'
                f"<head><title>{html.escape(title)}</title></head>"
                f"<body><h2>{html.escape(title)}</h2>{content_html}</body></html>"
            )
            files[f"OEBPS/{xhtml_name}"] = xhtml.encode("utf-8")
            manifest_items.append(
                f'<item id="chap{idx}" href="{xhtml_name}" media-type="application/xhtml+xml"/>'
            )
            spine_items.append(f'<itemref idref="chap{idx}"/>')
            nav_points.append(
                f'<navPoint id="navPoint-{idx}" playOrder="{idx}"><navLabel><text>{html.escape(title)}</text></navLabel><content src="{xhtml_name}"/></navPoint>'
            )

        toc_ncx = (
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
            '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">'
            "<head>"
            f'<meta name="dtb:uid" content="{html.escape(uid)}"/>'
            '<meta name="dtb:depth" content="1"/><meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/>'
            "</head>"
            f"<docTitle><text>{html.escape(book['title'])}</text></docTitle>"
            f"<navMap>{''.join(nav_points)}</navMap>"
            "</ncx>"
        )

        content_opf = (
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
            '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">'
            '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
            f"<dc:title>{html.escape(book['title'])}</dc:title>"
            "<dc:language>vi</dc:language>"
            f"<dc:identifier id=\"BookId\">{html.escape(uid)}</dc:identifier>"
            f"<dc:creator>{html.escape(book['author'] or '')}</dc:creator>"
            f"<dc:date>{now}</dc:date>"
            "</metadata>"
            f"<manifest>{''.join(manifest_items)}</manifest>"
            f"<spine toc=\"ncx\">{''.join(spine_items)}</spine>"
            "</package>"
        )

        files["OEBPS/toc.ncx"] = toc_ncx.encode("utf-8")
        files["OEBPS/content.opf"] = content_opf.encode("utf-8")

        with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("mimetype", files["mimetype"], compress_type=zipfile.ZIP_STORED)
            for path, data in files.items():
                if path == "mimetype":
                    continue
                zf.writestr(path, data)

        return out

    def get_chapter_text(
        self,
        chapter: dict[str, Any],
        book: dict[str, Any],
        *,
        mode: str,
        translator: TranslationAdapter,
        translate_mode: str,
    ) -> str:
        raw_key = chapter.get("raw_key")
        raw_text = normalize_newlines(self.read_cache(raw_key) or "")
        if mode == "raw" or book.get("lang_source") == "vi":
            return raw_text

        current_sig = translator.translation_signature(mode=translate_mode)
        trans_key = chapter.get("trans_key")
        trans_sig = (chapter.get("trans_sig") or "").strip()
        if trans_key and trans_sig == current_sig:
            cached = self.read_cache(trans_key)
            if cached is not None:
                return normalize_newlines(cached)

        detail = translator.translate_detailed(raw_text, mode=translate_mode)
        translated = normalize_newlines(detail.get("translated") or "")
        if not translated:
            translated = raw_text

        trans_seed = f"{chapter['chapter_id']}|{chapter['raw_key']}|{current_sig}|{translated}"
        new_key = f"tr_{hash_text(trans_seed)}"
        self.write_cache(new_key, "vi", translated)
        self.update_chapter_trans(chapter["chapter_id"], new_key, current_sig)
        chapter["trans_key"] = new_key
        chapter["trans_sig"] = current_sig
        return translated


class ReaderService:
    VERSION = "1.0.0"

    def __init__(self, storage: ReaderStorage):
        self.storage = storage
        self.app_config = load_app_config()
        self.translator = TranslationAdapter(self.app_config)
        self.name_set_state: dict[str, Any] = {"sets": {"Mặc định": {}}, "active_set": "Mặc định", "version": 1}
        self.refresh_config()

    def _default_name_sets(self) -> dict[str, dict[str, str]]:
        return normalize_name_sets_collection(self.app_config.get("nameSets") or {})

    def _default_active_name_set(self, default_sets: dict[str, dict[str, str]]) -> str:
        active = str(self.app_config.get("activeNameSet") or "").strip()
        if active in default_sets:
            return active
        return next(iter(default_sets.keys()))

    def refresh_config(self) -> None:
        self.app_config = load_app_config()
        default_sets = self._default_name_sets()
        default_active = self._default_active_name_set(default_sets)
        self.name_set_state = self.storage.get_name_set_state(
            default_sets=default_sets,
            active_default=default_active,
        )
        active_set_name = self.name_set_state["active_set"]
        active_name_set = normalize_name_set((self.name_set_state.get("sets") or {}).get(active_set_name) or {})
        self.translator = TranslationAdapter(
            self.app_config,
            active_name_set=active_name_set,
            active_set_name=active_set_name,
            name_set_version=int(self.name_set_state.get("version") or 1),
        )

    def import_file(self, filename: str, file_bytes: bytes, lang_source: str, title: str, author: str) -> dict[str, Any]:
        name = filename or "imported"
        ext = name.lower().rsplit(".", 1)[-1] if "." in name else "txt"
        lang = "vi" if lang_source == "vi" else "zh"

        if ext == "epub":
            parsed_title, parsed_author, chapters = parse_epub_chapters(file_bytes, custom_title=title)
            summary = "Sách EPUB được nhập từ file cục bộ."
            created = self.storage.create_book(
                title=parsed_title,
                author=author.strip() or parsed_author,
                lang_source=lang,
                source_type="epub",
                summary=summary,
                chapters=chapters,
            )
            self.storage.save_epub_source(created["book_id"], file_bytes)
            created["epub_url"] = f"/media/epub/{created['book_id']}.epub"
            return created

        if ext != "txt":
            raise ValueError("V1 chỉ hỗ trợ import TXT và EPUB.")

        text = decode_text_with_fallback(file_bytes)
        max_chars = int((self.app_config.get("translator_settings") or {}).get("maxChars", 4500) or 4500)
        chapters = split_text_into_chapters(text, target_size=max_chars)
        if not chapters:
            raise ValueError("Không tách được chương từ file TXT.")

        final_title = (title or "").strip() or re.sub(r"\.[^.]+$", "", name) or "Untitled"
        summary = "Sách TXT được nhập và tách chương tự động."
        return self.storage.create_book(
            title=final_title,
            author=author,
            lang_source=lang,
            source_type="txt",
            summary=summary,
            chapters=chapters,
        )


class ApiError(Exception):
    def __init__(self, status: HTTPStatus, error_code: str, message: str, details: Any = None):
        super().__init__(message)
        self.status = status
        self.error_code = error_code
        self.message = message
        self.details = details


@dataclass
class MultipartPart:
    name: str
    filename: str | None
    content: bytes

    @property
    def file(self) -> io.BytesIO:
        return io.BytesIO(self.content)

    @property
    def text(self) -> str:
        return decode_text_with_fallback(self.content)


class MultipartForm:
    def __init__(self):
        self._items: dict[str, list[MultipartPart]] = {}

    def add(self, part: MultipartPart) -> None:
        self._items.setdefault(part.name, []).append(part)

    def __contains__(self, name: str) -> bool:
        return name in self._items and bool(self._items[name])

    def getfirst(self, name: str, default: str | None = None) -> str | None:
        items = self._items.get(name) or []
        if not items:
            return default
        return items[0].text

    def get_file(self, name: str) -> MultipartPart | None:
        items = self._items.get(name) or []
        for item in items:
            if item.filename is not None:
                return item
        return None


class ReaderApiHandler(SimpleHTTPRequestHandler):
    server_version = "ReaderServer/1.0"

    def __init__(self, *args, ui_dir: Path, service: ReaderService, **kwargs):
        self.ui_dir = ui_dir
        self.service = service
        super().__init__(*args, directory=str(ui_dir), **kwargs)

    def log_message(self, fmt: str, *args):  # noqa: A003
        return super().log_message(fmt, *args)

    def do_GET(self):  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self._dispatch_api("GET", parsed)
            return
        if parsed.path.startswith("/media/"):
            self._serve_media(parsed.path)
            return

        route_map = {
            "/": "/library.html",
            "": "/library.html",
            "/library": "/library.html",
            "/search": "/search.html",
            "/book": "/book.html",
            "/reader": "/reader.html",
        }
        if parsed.path in route_map:
            self.path = route_map[parsed.path]
            super().do_GET()
            return

        if parsed.path == "/index.html":
            if self._serve_composed_index():
                return
            self.path = "/index.html"
            super().do_GET()
            return
        super().do_GET()

    def do_POST(self):  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self._dispatch_api("POST", parsed)
            return
        self._send_error_json(ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy endpoint."))

    def do_DELETE(self):  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self._dispatch_api("DELETE", parsed)
            return
        self._send_error_json(ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy endpoint."))

    def _dispatch_api(self, method: str, parsed):
        trace_id = uuid.uuid4().hex
        try:
            self.service.refresh_config()
            data = self._handle_api(method, parsed)
            self._send_json(data, trace_id=trace_id)
        except ApiError as exc:
            self._send_error_json(exc, trace_id=trace_id)
        except Exception as exc:
            details = {
                "exception": exc.__class__.__name__,
                "traceback": traceback.format_exc(limit=5),
            }
            self._send_error_json(
                ApiError(HTTPStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Lỗi hệ thống nội bộ.", details),
                trace_id=trace_id,
            )

    def _handle_api(self, method: str, parsed):
        path = parsed.path
        query = parse_qs(parsed.query)

        if method == "GET" and path == "/api/health":
            return {
                "ok": True,
                "version": ReaderService.VERSION,
                "time": utc_now_iso(),
            }

        if method == "GET" and path == "/api/themes":
            active = self.service.storage.get_theme_active()
            return {"active": active, "items": THEME_PRESETS}

        if method == "POST" and path == "/api/themes/active":
            payload = self._read_json_body()
            theme_id = (payload.get("theme_id") or "").strip()
            if not theme_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu theme_id.")
            if theme_id not in {x["id"] for x in THEME_PRESETS}:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Theme không hợp lệ.")
            self.service.storage.set_theme_active(theme_id)
            return {"ok": True, "active": theme_id}

        if method == "GET" and path == "/api/name-sets":
            default_sets = self.service._default_name_sets()
            state = self.service.storage.get_name_set_state(
                default_sets=default_sets,
                active_default=self.service._default_active_name_set(default_sets),
            )
            return {"ok": True, **state}

        if method == "POST" and path == "/api/name-sets":
            payload = self._read_json_body()
            sets = payload.get("sets")
            active_set = (payload.get("active_set") or "").strip() or None
            bump_version = bool(payload.get("bump_version", True))
            state = self.service.storage.set_name_set_state(
                sets if isinstance(sets, dict) else None,
                active_set=active_set,
                bump_version=bump_version,
            )
            return {"ok": True, **state}

        if method == "POST" and path == "/api/name-sets/entry":
            payload = self._read_json_body()
            source = (payload.get("source") or "").strip()
            target = (payload.get("target") or "").strip()
            set_name = (payload.get("set_name") or "").strip() or None
            delete = bool(payload.get("delete", False))
            if not source:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu source cho entry name set.")
            state = self.service.storage.update_name_set_entry(
                source,
                target,
                set_name=set_name,
                delete=delete,
            )
            return {"ok": True, **state}

        if method == "POST" and path == "/api/name-sets/preview":
            payload = self._read_json_body()
            text = (payload.get("text") or "").strip()
            if not text:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu text cần preview.")
            translate_mode = (payload.get("translation_mode") or "local").strip().lower()
            if translate_mode not in {"local", "server"}:
                translate_mode = "local"
            override_name_set = payload.get("name_set")
            if override_name_set is not None and not isinstance(override_name_set, dict):
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "name_set phải là object.")
            detail = self.service.translator.translate_detailed(
                text,
                mode=translate_mode,
                name_set_override=override_name_set if isinstance(override_name_set, dict) else None,
            )
            return {"ok": True, **detail}

        if method == "GET" and path == "/api/library/books":
            books = self.service.storage.list_books()
            return {"items": books}

        if method == "POST" and path == "/api/library/import":
            form = self._read_multipart_form()
            if "file" not in form:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu file import.")

            file_item = form.get_file("file")
            if file_item is None:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "File không hợp lệ.")

            filename = file_item.filename or "import.txt"
            file_bytes = file_item.content
            lang_source = (form.getfirst("lang_source") or "zh").strip()
            title = (form.getfirst("title") or "").strip()
            author = (form.getfirst("author") or "").strip()

            book = self.service.import_file(filename, file_bytes, lang_source, title, author)
            return {"ok": True, "book": book}

        if method == "GET" and path.startswith("/api/library/book/") and path.endswith("/epub-url"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/epub-url").strip("/")
            book = self.service.storage.find_book(book_id)
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            epub_path = CACHE_DIR / "epub_sources" / f"{book_id}.epub"
            if not epub_path.exists():
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Truyện này không có file EPUB nguồn.")
            return {"ok": True, "url": f"/media/epub/{book_id}.epub"}

        if method == "GET" and path.startswith("/api/library/book/") and path.endswith("/chapters"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/chapters").strip("/")
            if not book_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
            if not self.service.storage.find_book(book_id):
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            page = int((query.get("page", ["1"])[0] or "1"))
            page_size = int((query.get("page_size", ["120"])[0] or "120"))
            mode = (query.get("mode", ["raw"])[0] or "raw").strip().lower()
            if mode not in ("raw", "trans"):
                mode = "raw"
            translate_mode = (query.get("translation_mode", ["server"])[0] or "server").strip().lower()
            if translate_mode not in ("server", "local"):
                translate_mode = "server"
            data = self.service.storage.list_chapters_paged(
                book_id,
                page=page,
                page_size=page_size,
                mode=mode,
                translator=self.service.translator,
                translate_mode=translate_mode,
            )
            data["book_id"] = book_id
            data["mode"] = mode
            return data

        if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/translate-titles"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/translate-titles").strip("/")
            if not self.service.storage.find_book(book_id):
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            payload = self._read_json_body()
            translate_mode = (payload.get("translation_mode") or "server").strip().lower()
            if translate_mode not in ("server", "local"):
                translate_mode = "server"
            self.service.storage.translate_book_titles(book_id, self.service.translator, translate_mode)
            return {"ok": True}

        if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/metadata"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/metadata").strip("/")
            payload = self._read_json_body()
            updated = self.service.storage.update_book_metadata(book_id, payload)
            if not updated:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            return {"ok": True, "book": updated}

        if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/cover"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/cover").strip("/")
            form = self._read_multipart_form()
            if "file" in form:
                file_item = form.get_file("file")
                if file_item is None:
                    raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "File cover không hợp lệ.")
                updated = self.service.storage.set_book_cover_upload(
                    book_id, file_item.filename or "cover.jpg", file_item.content
                )
                if not updated:
                    raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
                return {"ok": True, "book": updated}
            cover_url = (form.getfirst("cover_url") or "").strip()
            if cover_url:
                updated = self.service.storage.update_book_metadata(book_id, {"cover_path": cover_url})
                if not updated:
                    raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
                return {"ok": True, "book": updated}
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu file cover hoặc cover_url.")

        if method == "GET" and path.startswith("/api/library/book/"):
            book_id = path.removeprefix("/api/library/book/").strip()
            if not book_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
            translate_titles = (query.get("translate_titles", ["0"])[0] or "0").strip() in {"1", "true", "yes"}
            mode = (query.get("mode", ["raw"])[0] or "raw").strip().lower()
            if mode not in ("raw", "trans"):
                mode = "raw"
            translate_mode = (query.get("translation_mode", ["server"])[0] or "server").strip().lower()
            if translate_mode not in ("server", "local"):
                translate_mode = "server"
            if translate_titles or mode == "trans":
                self.service.storage.translate_book_titles(book_id, self.service.translator, translate_mode)
            book = self.service.storage.get_book_detail(book_id)
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
            if book.get("source_type") == "epub":
                epub_path = CACHE_DIR / "epub_sources" / f"{book_id}.epub"
                if epub_path.exists():
                    book["epub_url"] = f"/media/epub/{book_id}.epub"
            return book

        if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/progress"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/progress").strip("/")
            payload = self._read_json_body()
            ratio = payload.get("ratio")
            ratio_val = None
            if isinstance(ratio, (float, int)):
                ratio_val = max(0.0, min(1.0, float(ratio)))
            self.service.storage.update_book_progress(
                book_id,
                chapter_id=(payload.get("chapter_id") or None),
                ratio=ratio_val,
                mode=(payload.get("mode") or None),
                theme_pref=(payload.get("theme_pref") or None),
            )
            return {"ok": True}

        if method == "POST" and path.startswith("/api/library/book/") and path.endswith("/export"):
            book_id = path.removeprefix("/api/library/book/").removesuffix("/export").strip("/")
            payload = self._read_json_body()
            fmt = (payload.get("format") or "txt").lower().strip()
            ensure_translated = bool(payload.get("ensure_translated", False))
            translate_mode = (payload.get("translation_mode") or "server").strip()

            if fmt == "txt":
                output = self.service.storage.create_export_txt(
                    book_id,
                    ensure_translated,
                    translator=self.service.translator,
                    translate_mode=translate_mode,
                )
            elif fmt == "epub":
                output = self.service.storage.create_export_epub(
                    book_id,
                    ensure_translated,
                    translator=self.service.translator,
                    translate_mode=translate_mode,
                )
            else:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Định dạng export không hợp lệ.")

            return {
                "ok": True,
                "format": fmt,
                "path": str(output),
                "download_url": f"/media/export/{quote_url_path(output.name)}",
            }

        if method == "DELETE" and path.startswith("/api/library/book/"):
            book_id = path.removeprefix("/api/library/book/").strip()
            if not book_id:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
            deleted = self.service.storage.delete_book(book_id)
            if not deleted:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện cần xóa.")
            return {"ok": True}

        if method == "POST" and path == "/api/library/cache/clear":
            result = self.service.storage.clear_translated_cache()
            return {"ok": True, **result}

        if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/name-preview"):
            chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/name-preview").strip("/")
            chapter = self.service.storage.find_chapter(chapter_id)
            if not chapter:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
            book = self.service.storage.find_book(chapter["book_id"])
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")

            payload = self._read_json_body()
            translate_mode = (payload.get("translation_mode") or "local").strip().lower()
            if translate_mode not in {"local", "server"}:
                translate_mode = "local"
            override_name_set = payload.get("name_set")
            if override_name_set is not None and not isinstance(override_name_set, dict):
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "name_set phải là object.")

            raw_text = normalize_newlines(self.service.storage.read_cache(chapter.get("raw_key")) or "")
            detail = self.service.translator.translate_detailed(
                raw_text,
                mode=translate_mode,
                name_set_override=override_name_set if isinstance(override_name_set, dict) else None,
            )

            title_detail = self.service.translator.translate_detailed(
                chapter.get("title_raw") or "",
                mode=translate_mode,
                name_set_override=override_name_set if isinstance(override_name_set, dict) else None,
            )

            return {
                "ok": True,
                "chapter_id": chapter["chapter_id"],
                "book_id": chapter["book_id"],
                "chapter_order": chapter["chapter_order"],
                "title_raw": chapter.get("title_raw") or "",
                "title_translated": title_detail.get("translated") or chapter.get("title_raw") or "",
                "title_name_map": title_detail.get("name_map") or {},
                **detail,
            }

        if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/selection-map"):
            chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/selection-map").strip("/")
            chapter = self.service.storage.find_chapter(chapter_id)
            if not chapter:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
            book = self.service.storage.find_book(chapter["book_id"])
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")

            payload = self._read_json_body()
            selected_text = (payload.get("selected_text") or "").strip()
            if not selected_text:
                raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu selected_text để map edit name.")
            translate_mode = (payload.get("translation_mode") or "server").strip().lower()
            if translate_mode not in {"local", "server"}:
                translate_mode = "server"

            raw_text = normalize_newlines(self.service.storage.read_cache(chapter.get("raw_key")) or "")
            translated_text = self.service.storage.get_chapter_text(
                chapter,
                book,
                mode="trans",
                translator=self.service.translator,
                translate_mode=translate_mode,
            )

            state_sets = normalize_name_sets_collection((self.service.name_set_state or {}).get("sets") or {"Mặc định": {}})
            active_set_name = str((self.service.name_set_state or {}).get("active_set") or "").strip()
            if active_set_name not in state_sets:
                active_set_name = next(iter(state_sets.keys()))
            active_name_set = normalize_name_set(state_sets.get(active_set_name) or {})
            version = int((self.service.name_set_state or {}).get("version") or 1)

            mapped = map_selection_to_name_source(
                raw_text=raw_text,
                translated_text=translated_text,
                selected_text=selected_text,
                name_set=active_name_set,
            )

            return {
                "ok": True,
                "chapter_id": chapter["chapter_id"],
                "book_id": chapter["book_id"],
                "translation_mode": translate_mode,
                "active_set": active_set_name,
                "name_set_version": max(1, version),
                **mapped,
            }

        if method == "GET" and path.startswith("/api/library/chapter/"):
            chapter_id = path.removeprefix("/api/library/chapter/").strip()
            chapter = self.service.storage.find_chapter(chapter_id)
            if not chapter:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
            book = self.service.storage.find_book(chapter["book_id"])
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")

            mode = (query.get("mode", ["raw"])[0] or "raw").strip().lower()
            translate_mode = (query.get("translation_mode", ["server"])[0] or "server").strip().lower()
            if mode not in ("raw", "trans"):
                mode = "raw"
            if translate_mode not in ("server", "local"):
                translate_mode = "server"
            if mode == "trans":
                self.service.storage.translate_book_titles(chapter["book_id"], self.service.translator, translate_mode)
                chapter = self.service.storage.find_chapter(chapter_id) or chapter

            text = self.service.storage.get_chapter_text(
                chapter,
                book,
                mode=mode,
                translator=self.service.translator,
                translate_mode=translate_mode,
            )

            include_name_map = (query.get("include_name_map", ["0"])[0] or "0").strip().lower() in {"1", "true", "yes"}
            name_preview = None
            if include_name_map and mode == "trans" and book.get("lang_source") != "vi":
                raw_text = normalize_newlines(self.service.storage.read_cache(chapter.get("raw_key")) or "")
                name_preview = self.service.translator.translate_detailed(raw_text, mode=translate_mode)

            response = {
                "chapter_id": chapter["chapter_id"],
                "book_id": chapter["book_id"],
                "chapter_order": chapter["chapter_order"],
                "title_raw": chapter["title_raw"],
                "title_vi": chapter.get("title_vi"),
                "title": chapter["title_vi"] if mode == "trans" and chapter.get("title_vi") else chapter["title_raw"],
                "mode": "raw" if book["lang_source"] == "vi" else mode,
                "content": text,
            }
            if name_preview:
                response["name_map"] = name_preview.get("name_map") or {}
                response["processed_text"] = name_preview.get("processed_text") or ""
                response["translated_with_placeholders"] = name_preview.get("translated_with_placeholders") or ""
            return response

        if method == "POST" and path.startswith("/api/library/chapter/") and path.endswith("/translate"):
            chapter_id = path.removeprefix("/api/library/chapter/").removesuffix("/translate").strip("/")
            payload = self._read_json_body()
            translate_mode = (payload.get("translation_mode") or "server").strip().lower()
            if translate_mode not in ("server", "local"):
                translate_mode = "server"

            chapter = self.service.storage.find_chapter(chapter_id)
            if not chapter:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy chương.")
            book = self.service.storage.find_book(chapter["book_id"])
            if not book:
                raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")

            text = self.service.storage.get_chapter_text(
                chapter,
                book,
                mode="trans",
                translator=self.service.translator,
                translate_mode=translate_mode,
            )
            return {
                "ok": True,
                "chapter_id": chapter_id,
                "mode": "trans",
                "content": text,
            }

        if method == "GET" and path == "/api/search":
            query_text = query.get("q", [""])[0]
            result = self.service.storage.search(query_text)
            return result

        raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy endpoint.")

    def _read_json_body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0") or "0")
        raw = self.rfile.read(length) if length > 0 else b"{}"
        if not raw:
            return {}
        try:
            payload = json.loads(raw.decode("utf-8"))
            if isinstance(payload, dict):
                return payload
            raise ValueError("JSON body phải là object")
        except Exception as exc:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_JSON", "JSON không hợp lệ.", str(exc)) from exc

    def _extract_disposition_param(self, header_value: str, key: str) -> str | None:
        pattern = rf'(?:^|;)\s*{re.escape(key)}\*?=(?:"([^"]*)"|([^;]*))'
        m = re.search(pattern, header_value, flags=re.IGNORECASE)
        if not m:
            return None
        value = (m.group(1) if m.group(1) is not None else m.group(2) or "").strip()
        if key.endswith("*") or f"{key}*" in header_value:
            # RFC 5987 basic support: utf-8''...
            if "''" in value:
                value = value.split("''", 1)[1]
            value = unquote(value)
        return value

    def _read_multipart_form(self) -> MultipartForm:
        content_type = self.headers.get("Content-Type") or ""
        if not content_type.startswith("multipart/form-data"):
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Yêu cầu phải là multipart/form-data.")

        boundary_match = re.search(r'boundary=(?:"([^"]+)"|([^;]+))', content_type, flags=re.IGNORECASE)
        if not boundary_match:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu boundary trong multipart/form-data.")
        boundary = (boundary_match.group(1) or boundary_match.group(2) or "").strip()
        if not boundary:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Boundary multipart không hợp lệ.")

        content_length = int(self.headers.get("Content-Length", "0") or "0")
        if content_length <= 0:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Nội dung upload rỗng.")

        body = self.rfile.read(content_length)
        marker = f"--{boundary}".encode("utf-8", errors="ignore")
        segments = body.split(marker)
        form = MultipartForm()

        for seg in segments:
            if not seg:
                continue
            if seg.startswith(b"--"):
                # đoạn kết thúc '--'
                continue
            if seg.startswith(b"\r\n"):
                seg = seg[2:]
            if seg.endswith(b"\r\n"):
                seg = seg[:-2]
            if not seg:
                continue

            header_blob, sep, content = seg.partition(b"\r\n\r\n")
            if not sep:
                continue

            header_lines = decode_text_with_fallback(header_blob).split("\r\n")
            headers_map: dict[str, str] = {}
            for line in header_lines:
                if ":" not in line:
                    continue
                k, v = line.split(":", 1)
                headers_map[k.strip().lower()] = v.strip()

            disposition = headers_map.get("content-disposition", "")
            if not disposition:
                continue
            name = self._extract_disposition_param(disposition, "name")
            if not name:
                continue
            filename = self._extract_disposition_param(disposition, "filename")
            if filename == "":
                filename = None

            form.add(MultipartPart(name=name, filename=filename, content=content))

        return form

    def _compose_template_html(self, base_path: Path, max_depth: int = 8) -> str:
        if not base_path.exists():
            raise FileNotFoundError(str(base_path))
        include_pattern = re.compile(r"\{\{\s*include\s*:\s*([^\}]+)\}\}", flags=re.IGNORECASE)

        def _read_with_includes(path: Path, depth: int) -> str:
            if depth > max_depth:
                raise RuntimeError("Vượt quá mức include tối đa trong template HTML.")
            text = path.read_text(encoding="utf-8")

            def _replace(match: re.Match[str]) -> str:
                rel = (match.group(1) or "").strip().strip("\"'")
                rel_path = Path(rel)
                target = (path.parent / rel_path).resolve()
                ui_root = self.ui_dir.resolve()
                if ui_root not in target.parents and target != ui_root:
                    return ""
                if not target.exists() or not target.is_file():
                    return ""
                return _read_with_includes(target, depth + 1)

            return include_pattern.sub(_replace, text)

        return _read_with_includes(base_path.resolve(), 0)

    def _serve_composed_index(self) -> bool:
        base = self.ui_dir / "base.html"
        if not base.exists():
            return False
        try:
            html_text = self._compose_template_html(base)
        except Exception:
            return False
        body = html_text.encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)
        return True

    def _serve_media(self, path: str):
        if path.startswith("/media/export/"):
            filename = unquote(path.removeprefix("/media/export/").strip())
            file_path = EXPORT_DIR / filename
        elif path.startswith("/media/cover/"):
            filename = unquote(path.removeprefix("/media/cover/").strip())
            file_path = COVER_DIR / filename
        elif path.startswith("/media/epub/"):
            filename = unquote(path.removeprefix("/media/epub/").strip())
            file_path = CACHE_DIR / "epub_sources" / filename
        else:
            self._send_error_json(ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy tài nguyên media."))
            return

        if not file_path.exists() or not file_path.is_file():
            self._send_error_json(ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy file."))
            return

        ctype = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        data = file_path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def _send_json(self, payload: dict[str, Any], trace_id: str | None = None):
        result = dict(payload)
        if trace_id:
            result["trace_id"] = trace_id
        body = json.dumps(result, ensure_ascii=False).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_error_json(self, error: ApiError, trace_id: str | None = None):
        payload = {
            "error_code": error.error_code,
            "message": error.message,
            "details": error.details,
            "trace_id": trace_id or uuid.uuid4().hex,
        }
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(error.status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


def build_handler(ui_dir: Path, service: ReaderService):
    def _factory(*args, **kwargs):
        return ReaderApiHandler(*args, ui_dir=ui_dir, service=service, **kwargs)

    return _factory


def parse_args():
    parser = argparse.ArgumentParser(description="Run local reader web server.")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host, dùng 0.0.0.0 để chia sẻ LAN.")
    parser.add_argument("--port", type=int, default=17171, help="Bind port.")
    parser.add_argument("--ui-dir", default=str(DEFAULT_UI_DIR), help="Thư mục chứa UI web.")
    parser.add_argument("--db", default=str(DB_PATH), help="Đường dẫn SQLite DB.")
    return parser.parse_args()


def main():
    args = parse_args()
    ui_dir = Path(args.ui_dir).resolve()
    if not ui_dir.exists():
        raise SystemExit(f"UI directory not found: {ui_dir}")

    storage = ReaderStorage(Path(args.db).resolve())
    service = ReaderService(storage)

    handler = build_handler(ui_dir=ui_dir, service=service)
    server = ThreadingHTTPServer((args.host, args.port), handler)
    print(f"Reader server đang chạy tại: http://{args.host}:{args.port}")
    print(f"UI dir: {ui_dir}")
    print(f"DB: {Path(args.db).resolve()}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
