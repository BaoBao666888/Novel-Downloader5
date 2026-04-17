from __future__ import annotations

import base64
import hashlib
import html
import json
import mimetypes
import urllib.request
import zipfile
from collections.abc import Callable
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote

from reader_backend import theme_presets as theme_presets_support
from reader_backend import text_paragraphs as text_paragraphs_support

try:
    from reader_backend import export_protect_private as export_protect_private_support
except Exception:  # pragma: no cover - private local module may be absent on public tree
    export_protect_private_support = None


def _normalize_newlines(text: str) -> str:
    return str(text or "").replace("\r\n", "\n").replace("\r", "\n")


def _utc_now_ts() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def _bytes_to_data_url(data: bytes, mime_type: str) -> str:
    encoded = base64.b64encode(bytes(data or b"")).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def _cover_hash_seed(*parts: str) -> int:
    seed = "|".join(str(item or "").strip() for item in parts if str(item or "").strip()) or "reader"
    value = 0
    for ch in seed:
        value = ((value * 33) + ord(ch)) & 0xFFFFFFFF
    return value


def _build_default_cover_data_url(title: str, author: str) -> str:
    safe_title = str(title or "").strip() or "No Cover"
    initials = "".join(part[:1].upper() for part in safe_title.split()[:2] if part[:1]) or "BK"
    palette = [
        ("#233a7a", "#6aa0ff", "#eef5ff"),
        ("#23545f", "#6bc8d7", "#edfdfd"),
        ("#5a345b", "#e7a7dd", "#fff1fb"),
        ("#6b3f28", "#f2b07c", "#fff6ef"),
        ("#3c4f2d", "#b9d96b", "#f8ffe8"),
        ("#40456f", "#9ca5ff", "#f3f4ff"),
    ]
    bg1, bg2, text = palette[_cover_hash_seed(safe_title, author) % len(palette)]
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 680">'
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0%" stop-color="{bg1}"/>'
        f'<stop offset="100%" stop-color="{bg2}"/>'
        '</linearGradient></defs>'
        '<rect width="480" height="680" rx="28" fill="url(#g)"/>'
        '<circle cx="402" cy="90" r="62" fill="rgba(255,255,255,0.10)"/>'
        '<circle cx="90" cy="590" r="88" fill="rgba(255,255,255,0.08)"/>'
        f'<text x="54" y="102" fill="rgba(255,255,255,0.78)" font-size="26" font-family="Arial, sans-serif">READER</text>'
        f'<text x="54" y="250" fill="{text}" font-size="122" font-weight="700" font-family="Arial, sans-serif">{html.escape(initials)}</text>'
        '<foreignObject x="54" y="300" width="372" height="228">'
        f'<div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; color: {text}; font-size: 36px; line-height: 1.25; font-weight: 700; word-break: break-word;">{html.escape(safe_title)}</div>'
        '</foreignObject>'
        f'<text x="54" y="626" fill="rgba(255,255,255,0.86)" font-size="28" font-family="Arial, sans-serif">{html.escape(str(author or "").strip() or "Unknown Author")}</text>'
        "</svg>"
    )
    return f"data:image/svg+xml;charset=UTF-8,{quote(svg)}"


def _guess_cover_mime(candidate: str, content_type: str = "") -> str:
    raw_type = str(content_type or "").split(";", 1)[0].strip().lower()
    if raw_type:
        return raw_type
    guessed, _ = mimetypes.guess_type(str(candidate or "").split("?", 1)[0])
    return guessed or "image/jpeg"


def _try_resolve_cover_data_url(candidate: str) -> str:
    raw = str(candidate or "").strip()
    if not raw:
        return ""
    if raw.startswith("data:image/"):
        return raw
    if raw.startswith(("http://", "https://")):
        try:
            req = urllib.request.Request(
                raw,
                headers={"User-Agent": "Mozilla/5.0 NovelStudio/ReaderExport"},
                method="GET",
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
                mime_type = _guess_cover_mime(raw, getattr(resp.headers, "get_content_type", lambda: "")())
            if data:
                return _bytes_to_data_url(data, mime_type)
        except Exception:
            return ""
        return ""
    try:
        path = Path(raw)
        if path.exists() and path.is_file():
            data = path.read_bytes()
            if data:
                return _bytes_to_data_url(data, _guess_cover_mime(path.name))
    except Exception:
        return ""
    return ""


def _resolve_export_cover_data_url(*, book: dict[str, Any], raw_metadata: dict[str, Any] | None) -> str:
    metadata = dict(raw_metadata or {}) if isinstance(raw_metadata, dict) else {}
    for candidate in (
        metadata.get("cover_data_url"),
        metadata.get("cover_url"),
        metadata.get("cover_path"),
        book.get("cover_path"),
        book.get("cover_remote_url"),
    ):
        resolved = _try_resolve_cover_data_url(str(candidate or ""))
        if resolved:
            return resolved
    title = str(metadata.get("title") or book.get("title") or "")
    author = str(metadata.get("author") or book.get("author") or "")
    return _build_default_cover_data_url(title, author)


def render_export_cover_html(metadata: dict[str, Any]) -> str:
    cover_src = str(metadata.get("cover_data_url") or "").strip()
    if not cover_src:
        return ""
    alt = html.escape(str(metadata.get("title") or "Cover") or "Cover")
    return (
        '<div class="export-cover-wrap">'
        f'<img class="export-cover" src="{html.escape(cover_src, quote=True)}" alt="{alt}">'
        "</div>"
    )


def render_export_intro_html(metadata: dict[str, Any]) -> str:
    parts = [f"<h1>{html.escape(metadata['title'])}</h1>"]
    cover_html = render_export_cover_html(metadata)
    if cover_html:
        parts.insert(0, cover_html)
    if metadata.get("author"):
        parts.append(f"<p><strong>Tác giả:</strong> {html.escape(metadata['author'])}</p>")
    if metadata.get("categories_text"):
        parts.append(f"<p><strong>Danh mục:</strong> {html.escape(metadata['categories_text'])}</p>")
    if metadata.get("summary"):
        summary_text = text_paragraphs_support.strip_paragraph_indentation(metadata["summary"])
        summary_html = "".join(
            f"<p>{html.escape(line)}</p>" if line.strip() else "<p><br/></p>"
            for line in _normalize_newlines(summary_text).split("\n")
        )
        parts.append(summary_html)
    return "".join(parts)


def render_export_intro_text(metadata: dict[str, Any]) -> str:
    lines = [str(metadata.get("title") or "").strip() or "Untitled"]
    if metadata.get("author"):
        lines.append(f"Tác giả: {str(metadata.get('author') or '').strip()}")
    if metadata.get("categories_text"):
        lines.append(f"Danh mục: {str(metadata.get('categories_text') or '').strip()}")
    if metadata.get("summary"):
        summary_text = text_paragraphs_support.strip_paragraph_indentation(str(metadata.get("summary") or ""))
        if summary_text.strip():
            lines.extend(["", summary_text.strip()])
    return "\n".join(lines).strip()


def _html_private_protection_available() -> bool:
    return export_protect_private_support is not None


def build_export_job_protection_view(options: dict[str, Any] | None) -> dict[str, Any]:
    if not _html_private_protection_available():
        return {"enabled": False}
    return export_protect_private_support.build_job_protection_view(options)


def build_export_job_protection_signature(options: dict[str, Any] | None) -> str:
    if not _html_private_protection_available():
        return "0"
    return export_protect_private_support.build_job_protection_signature(options)


def finalize_export_job_options(
    *,
    fmt: str,
    options: dict[str, Any] | None,
    job_id: str,
    book_id: str,
    title: str,
    created_at_iso: str,
) -> dict[str, Any]:
    normalized = dict(options or {})
    fmt_norm = str(fmt or "").strip().lower()
    if fmt_norm != "html":
        normalized["protect_content"] = False
        normalized["protect_with_code"] = False
        normalized.pop("_protect_state", None)
        return normalized
    if not _html_private_protection_available():
        normalized["protect_content"] = False
        normalized["protect_with_code"] = False
        normalized.pop("_protect_state", None)
        return normalized
    return export_protect_private_support.finalize_job_protection_options(
        normalized,
        job_id=job_id,
        book_id=book_id,
        title=title,
        created_at_iso=created_at_iso,
    )


def build_export_format_specs(*, is_comic: bool, translation_supported: bool) -> dict[str, Any]:
    def opt(
        key: str,
        label: str,
        default_enabled: bool,
        *,
        option_type: str = "bool",
        default_value: int | None = None,
        minimum: int | None = None,
        maximum: int | None = None,
        step: int | None = None,
        suffix: str = "",
        depends_on: str = "",
        hint: str = "",
    ) -> dict[str, Any]:
        return {
            "key": key,
            "label": label,
            "type": option_type,
            "default_enabled": bool(default_enabled),
            "default_value": default_value if default_value is not None else int(bool(default_enabled)),
            "min": minimum,
            "max": maximum,
            "step": step,
            "suffix": suffix,
            "depends_on": depends_on,
            "hint": hint,
        }

    if is_comic:
        formats = [
            {
                "id": "epub",
                "label": "EPUB",
                "options": [
                    opt("include_intro", "Hiển thị trang giới thiệu", True),
                    opt("include_chapter_titles", "Hiển thị tên chương", True),
                    opt("include_toc_page", "Hiển thị trang mục lục", True),
                ],
            },
            {
                "id": "html",
                "label": "HTML",
                "options": [
                    opt("include_intro", "Hiển thị trang giới thiệu", True),
                    opt("merge_single_file", "Gộp thành 1 file", False),
                    opt("include_chapter_titles", "Hiển thị tên chương", True),
                    opt("include_toc_page", "Hiển thị trang mục lục", True),
                ],
            },
            {
                "id": "cbz",
                "label": "CBZ",
                "options": [],
            },
        ]
        default_format = "epub"
    else:
        html_options = [
            opt("include_intro", "Hiển thị trang giới thiệu", True),
            opt("merge_single_file", "Gộp thành 1 file", True),
            opt("include_chapter_titles", "Hiển thị tên chương", True),
            opt("include_toc_page", "Hiển thị trang mục lục", False),
        ]
        txt_options = [
            opt("merge_single_file", "Gộp thành 1 file", True),
            opt("include_chapter_titles", "Hiển thị tên chương", True),
        ]
        epub_options = [
            opt("include_intro", "Hiển thị trang giới thiệu", True),
            opt("include_chapter_titles", "Hiển thị tên chương", True),
            opt("include_toc_page", "Hiển thị trang mục lục", False),
        ]
        if translation_supported:
            html_options.append(opt("use_translated_text", "Xuất text dịch", True))
            txt_options.append(opt("use_translated_text", "Xuất text dịch", True))
            epub_options.append(opt("use_translated_text", "Xuất text dịch", True))
        formats = [
            {"id": "txt", "label": "TXT", "options": txt_options},
            {"id": "epub", "label": "EPUB", "options": epub_options},
            {"id": "html", "label": "HTML", "options": html_options},
        ]
        default_format = "txt"
    if _html_private_protection_available():
        for format_spec in formats:
            if str((format_spec or {}).get("id") or "").strip().lower() != "html":
                continue
            html_option_rows = list(format_spec.get("options") or [])
            html_option_rows.append(opt("protect_content", "Bảo vệ nội dung HTML", True))
            for extra in export_protect_private_support.access_code_option_specs():
                html_option_rows.append(dict(extra))
            format_spec["options"] = html_option_rows
    return {
        "default_format": default_format,
        "formats": formats,
    }


def normalize_export_options(
    *,
    specs: dict[str, Any],
    fmt: str,
    raw_options: dict[str, Any] | None,
    is_comic: bool,
    translation_supported: bool,
) -> dict[str, Any]:
    format_spec = None
    for row in specs.get("formats") or []:
        if str((row or {}).get("id") or "").strip().lower() == fmt:
            format_spec = row
            break
    if not format_spec:
        raise ValueError("Định dạng export không hợp lệ.")
    options = dict(raw_options or {}) if isinstance(raw_options, dict) else {}
    normalized: dict[str, Any] = {}
    for item in format_spec.get("options") or []:
        key = str((item or {}).get("key") or "").strip()
        if not key:
            continue
        item_type = str((item or {}).get("type") or "bool").strip().lower()
        if item_type == "number":
            default_value = int((item or {}).get("default_value") or 0)
            raw_value = options.get(key, default_value)
            try:
                parsed = int(raw_value)
            except Exception:
                parsed = default_value
            minimum = item.get("min")
            maximum = item.get("max")
            if isinstance(minimum, int):
                parsed = max(minimum, parsed)
            if isinstance(maximum, int):
                parsed = min(maximum, parsed)
            normalized[key] = parsed
        elif key in options:
            normalized[key] = bool(options.get(key))
        else:
            normalized[key] = bool(item.get("default_enabled"))
    for key in (
        "include_intro",
        "merge_single_file",
        "include_chapter_titles",
        "include_toc_page",
        "use_translated_text",
        "protect_content",
        "protect_with_code",
    ):
        normalized.setdefault(key, False)
    normalized.setdefault(
        "protect_code_minutes",
        int(
            getattr(export_protect_private_support, "DEFAULT_ACCESS_CODE_MINUTES", 15)
            if _html_private_protection_available()
            else 15
        ),
    )
    normalized["use_cached_only"] = True
    if is_comic or (not translation_supported):
        normalized["use_translated_text"] = False
    return normalized


def resolve_export_metadata(
    *,
    book: dict[str, Any],
    raw_metadata: dict[str, Any] | None,
    normalize_text: Callable[[str, bool], str],
) -> dict[str, Any]:
    metadata = dict(raw_metadata or {}) if isinstance(raw_metadata, dict) else {}
    title = normalize_text(str(metadata.get("title") or book.get("title") or ""), True) or "Untitled"
    author = normalize_text(str(metadata.get("author") or book.get("author") or ""), True)
    summary = normalize_text(str(metadata.get("summary") or book.get("summary") or ""), False)
    categories_text = normalize_text(str(metadata.get("categories_text") or ""), True)
    return {
        "title": title,
        "author": author,
        "categories_text": categories_text,
        "summary": summary,
        "cover_data_url": _resolve_export_cover_data_url(book=book, raw_metadata=metadata),
    }


def guess_export_image_ext(*, image_url: str, content_type: str = "") -> str:
    ctype = str(content_type or "").split(";", 1)[0].strip().lower()
    ext = mimetypes.guess_extension(ctype) if ctype else None
    if not ext:
        ext = Path(str(image_url or "").split("?", 1)[0]).suffix.lower()
    if not ext:
        ext = ".bin"
    if ext == ".jpe":
        ext = ".jpg"
    return ext


def _build_export_theme_options_html() -> str:
    parts: list[str] = []
    for theme in theme_presets_support.EXPORT_THEME_PRESETS:
        theme_id = html.escape(str(theme.get("id") or "").strip())
        theme_name = html.escape(str(theme.get("name") or "").strip() or theme_id)
        if not theme_id:
            continue
        parts.append(f'<option value="{theme_id}">{theme_name}</option>')
    return "".join(parts)


def _build_export_theme_css() -> str:
    parts: list[str] = []
    for theme in theme_presets_support.EXPORT_THEME_PRESETS:
        theme_id = str(theme.get("id") or "").strip()
        tokens = dict(theme.get("tokens") or {})
        if not theme_id or not tokens:
            continue
        parts.append(
            (
                f":root[data-theme='{html.escape(theme_id)}']{{"
                f"--bg:{tokens.get('bg', '#f5f0e8')};"
                f"--bg-elev:{tokens.get('bg_elev', '#fffdf8')};"
                f"--surface:{tokens.get('surface', '#fffaf1')};"
                f"--surface-strong:{tokens.get('surface_strong', '#ffffff')};"
                f"--text:{tokens.get('text', '#1f1a17')};"
                f"--muted:{tokens.get('muted', '#6d6259')};"
                f"--border:{tokens.get('border', 'rgba(73,54,38,.14)')};"
                f"--shadow:{tokens.get('shadow', '0 24px 48px rgba(46,31,20,.12)')};"
                f"--accent:{tokens.get('accent', '#99572a')};"
                f"--accent-soft:{tokens.get('accent_soft', 'rgba(153,87,42,.14)')};"
                "}"
            )
        )
    return "".join(parts)


def build_export_toc_html(
    chapters: list[dict[str, Any]],
    *,
    link_builder: Callable[[dict[str, Any]], str],
) -> str:
    lines = ['<div class="export-toc"><h2>Mục lục</h2><ol>']
    for chapter in chapters:
        title = html.escape(str(chapter.get("title") or chapter.get("title_raw") or ""))
        link = html.escape(link_builder(chapter))
        lines.append(f'<li><a href="{link}">{title}</a></li>')
    lines.append("</ol></div>")
    return "".join(lines)


def _build_export_html_nav(*, prev_href: str = "", next_href: str = "", index_href: str = "", index_label: str = "Mục lục") -> str:
    links: list[str] = []
    if index_href:
        links.append(f'<a class="export-nav-link" href="{html.escape(index_href)}">{html.escape(index_label)}</a>')
    if prev_href:
        links.append(f'<a class="export-nav-link" href="{html.escape(prev_href)}">Chương trước</a>')
    if next_href:
        links.append(f'<a class="export-nav-link" href="{html.escape(next_href)}">Chương sau</a>')
    if not links:
        return ""
    return '<nav class="export-nav">' + "".join(links) + "</nav>"


def wrap_export_html_document(
    title: str,
    body: str,
    *,
    page_title: str = "",
    toc_html: str = "",
    is_comic: bool = False,
    protect_content: bool = False,
    protect_options: dict[str, Any] | None = None,
) -> str:
    storage_key_seed = f"{title}|{'comic' if is_comic else 'text'}"
    storage_key = "reader-export-html:" + hashlib.sha1(storage_key_seed.encode("utf-8", errors="ignore")).hexdigest()[:16]
    page_storage_seed = f"{page_title or title}|{hashlib.sha1(body.encode('utf-8', errors='ignore')).hexdigest()}"
    page_storage_key = storage_key + ":page:" + hashlib.sha1(page_storage_seed.encode("utf-8", errors="ignore")).hexdigest()[:16]
    header_title = page_title or title
    toc_section = toc_html or '<div class="export-toc empty"><h2>Mục lục</h2><p>Không có mục lục.</p></div>'
    theme_options_markup = _build_export_theme_options_html()
    theme_css = _build_export_theme_css()
    protection_context = (
        export_protect_private_support.build_html_protection_context(
            title=title,
            body_html=body,
            toc_html=toc_section,
            protect_options=protect_options,
        )
        if bool(protect_content and _html_private_protection_available())
        else {"enabled": False}
    )
    protect_enabled = bool(protection_context.get("enabled"))
    article_markup = (
        str(protection_context.get("article_markup") or "").replace(
            'class="export-reader"',
            f'class="export-reader{" is-comic" if is_comic else ""}"',
            1,
        )
        if protect_enabled
        else f'<article class="export-reader{" is-comic" if is_comic else ""}">{body}</article>'
    )
    toc_drawer_body_markup = (
        str(protection_context.get("toc_drawer_body_markup") or "")
        if protect_enabled
        else f'<div class="export-drawer-body">{toc_section}</div>'
    )
    protection_overlay_markup = str(protection_context.get("overlay_markup") or "") if protect_enabled else ""
    hidden_notice_markup = str(protection_context.get("hidden_notice_markup") or "") if protect_enabled else ""
    body_classes = [item for item in (protection_context.get("body_class_names") or []) if str(item or "").strip()]
    body_open_tag = f'<body class="{" ".join(body_classes)}">' if body_classes else "<body>"
    protection_bootstrap_js = str(protection_context.get("bootstrap_js") or "") if protect_enabled else ""
    protection_runtime_config = str(protection_context.get("runtime_config_json") or "{}") if protect_enabled else "{}"
    protection_extra_styles = str(protection_context.get("extra_styles") or "") if protect_enabled else ""
    font_choices = (
        '<option value="serif">Serif dễ đọc</option>'
        '<option value="literary">Serif đậm chất sách</option>'
        '<option value="sans">Sans gọn</option>'
        '<option value="mono">Mono</option>'
    )
    settings_markup = (
        '<div class="settings-group">'
        '<label for="setting-theme">Theme</label>'
        f'<select id="setting-theme">{theme_options_markup}</select>'
        "</div>"
        '<div class="settings-group">'
        '<label for="setting-font-family">Font chữ</label>'
        f'<select id="setting-font-family">{font_choices}</select>'
        "</div>"
        '<div class="settings-group">'
        '<label for="setting-width">Độ rộng vùng đọc <span id="setting-width-value"></span></label>'
        '<input id="setting-width" type="range" min="620" max="1180" step="20">'
        "</div>"
        '<div class="settings-group text-only">'
        '<label for="setting-font-size">Cỡ chữ <span id="setting-font-size-value"></span></label>'
        '<input id="setting-font-size" type="range" min="15" max="32" step="1">'
        "</div>"
        '<div class="settings-group text-only">'
        '<label for="setting-line-height">Dãn dòng <span id="setting-line-height-value"></span></label>'
        '<input id="setting-line-height" type="range" min="1.45" max="2.45" step="0.05">'
        "</div>"
        '<div class="settings-group text-only">'
        '<label for="setting-indent">Thụt dòng <span id="setting-indent-value"></span></label>'
        '<input id="setting-indent" type="range" min="0" max="3" step="0.1">'
        "</div>"
        '<div class="settings-group text-only settings-check">'
        '<label class="settings-check-label" for="setting-no-indent">'
        "<span>Không thụt dòng</span>"
        '<input id="setting-no-indent" type="checkbox">'
        "</label>"
        "</div>"
        '<div class="settings-group settings-check">'
        '<label class="settings-check-label" for="setting-theme-custom-enabled">'
        "<span>Màu tùy chỉnh</span>"
        '<input id="setting-theme-custom-enabled" type="checkbox">'
        "</label>"
        "</div>"
        '<div class="settings-group">'
        '<button type="button" id="setting-theme-custom-reset" class="export-chip settings-reset-button">Khôi phục màu gốc</button>'
        "</div>"
        '<div id="setting-theme-custom-grid" class="settings-subgrid">'
        '<label class="settings-color"><span>Nền chính</span><input id="setting-theme-bg" type="color"></label>'
        '<label class="settings-color"><span>Nền phụ</span><input id="setting-theme-bg-elev" type="color"></label>'
        '<label class="settings-color"><span>Panel</span><input id="setting-theme-surface" type="color"></label>'
        '<label class="settings-color"><span>Panel đậm</span><input id="setting-theme-surface-strong" type="color"></label>'
        '<label class="settings-color"><span>Chữ chính</span><input id="setting-theme-text" type="color"></label>'
        '<label class="settings-color"><span>Chữ phụ</span><input id="setting-theme-muted" type="color"></label>'
        '<label class="settings-color"><span>Nhấn / Link</span><input id="setting-theme-accent" type="color"></label>'
        "</div>"
        '<div class="settings-group comic-only">'
        '<label for="setting-image-width">Độ rộng ảnh <span id="setting-image-width-value"></span></label>'
        '<input id="setting-image-width" type="range" min="560" max="1400" step="20">'
        "</div>"
        '<div class="settings-group comic-only">'
        '<label for="setting-image-gap">Khoảng cách ảnh <span id="setting-image-gap-value"></span></label>'
        '<input id="setting-image-gap" type="range" min="0.25" max="2.5" step="0.05">'
        "</div>"
    )
    script = f"""
<script>
(() => {{
  {protection_bootstrap_js}
  const STORAGE_KEY = {json.dumps(storage_key, ensure_ascii=False)};
  const READING_STORAGE_KEY = {json.dumps(page_storage_key, ensure_ascii=False)};
  const IS_COMIC = {str(bool(is_comic)).lower()};
  const PROTECT_ENABLED = {str(protect_enabled).lower()};
  const PROTECT_CONFIG = {protection_runtime_config};
  const PROTECT_REASON_DEFAULT = "Người xuất đã chặn copy nội dung. Vui lòng tắt DevTools, tiện ích copy hoặc công cụ trích xuất rồi mở lại file.";
  const READING_RESTORE_DELAYS = [0, 160, 520, 1200, 2600];
  const defaults = IS_COMIC
    ? {{ theme: "graphite", fontFamily: "sans", width: 980, fontSize: 18, lineHeight: 1.8, indent: 0, noIndent: true, imageWidth: 1080, imageGap: 0.9, customThemeEnabled: false, customBg: "", customBgElev: "", customSurface: "", customSurfaceStrong: "", customText: "", customMuted: "", customAccent: "" }}
    : {{ theme: "paper", fontFamily: "literary", width: 860, fontSize: 20, lineHeight: 1.9, indent: 1.8, noIndent: false, imageWidth: 960, imageGap: 1.0, customThemeEnabled: false, customBg: "", customBgElev: "", customSurface: "", customSurfaceStrong: "", customText: "", customMuted: "", customAccent: "" }};
  let state = {{ ...defaults }};
  try {{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {{
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") state = {{ ...state, ...parsed }};
    }}
  }} catch (_error) {{}}
  const root = document.documentElement;
  const shell = document.querySelector(".export-shell");
  const header = document.querySelector(".export-header");
  const main = document.querySelector(".export-main");
  const protectedBodyHost = document.getElementById("export-protected-body");
  const protectedTocHost = document.getElementById("export-protected-toc");
  const protectOverlay = document.getElementById("export-protect-overlay");
  const protectUnlockPanel = document.getElementById("export-protect-unlock-panel");
  const protectLockPanel = document.getElementById("export-protect-lock-panel");
  const protectReasonNode = document.getElementById("export-protect-reason");
  const protectCodeInput = document.getElementById("export-protect-code-input");
  const protectCodeSubmit = document.getElementById("export-protect-code-submit");
  const protectCodeError = document.getElementById("export-protect-code-error");
  const protectCodeCountdown = document.getElementById("export-protect-code-countdown");
  const tocDrawer = document.querySelector('[data-drawer="toc"]');
  const settingsDrawer = document.querySelector('[data-drawer="settings"]');
  const indentInput = document.getElementById("setting-indent");
  const noIndentInput = document.getElementById("setting-no-indent");
  const themeCustomEnabledInput = document.getElementById("setting-theme-custom-enabled");
  const themeCustomResetButton = document.getElementById("setting-theme-custom-reset");
  const themeCustomGrid = document.getElementById("setting-theme-custom-grid");
  const protectRuntime = PROTECT_ENABLED && window.__readerExportProtection && typeof window.__readerExportProtection.create === "function"
    ? window.__readerExportProtection.create(
      (PROTECT_CONFIG && PROTECT_CONFIG.access_code && typeof PROTECT_CONFIG.access_code === "object")
        ? PROTECT_CONFIG.access_code
        : PROTECT_CONFIG
    )
    : null;
  let uiVisible = false;
  let hideTimer = 0;
  let tapTrack = null;
  let protectedLocked = false;
  let protectedHydrated = false;
  let protectCountdownTimer = 0;
  let protectMonitorTimer = 0;
  let readingSaveTimer = 0;
  let readingRestoreTimers = [];
  let readingRestoreApplied = false;
  let readingSnapshot = null;
  const PROTECT_DEVTOOLS_GAP_THRESHOLD = 160;
  const PROTECT_DEBUGGER_STALL_MS = 140;
  const protectInitialWidthGap = Math.abs(window.outerWidth - window.innerWidth);
  const protectInitialHeightGap = Math.abs(window.outerHeight - window.innerHeight);
  const themeColorFields = [
    {{ key: "customBg", id: "setting-theme-bg", cssVar: "--bg" }},
    {{ key: "customBgElev", id: "setting-theme-bg-elev", cssVar: "--bg-elev" }},
    {{ key: "customSurface", id: "setting-theme-surface", cssVar: "--surface" }},
    {{ key: "customSurfaceStrong", id: "setting-theme-surface-strong", cssVar: "--surface-strong" }},
    {{ key: "customText", id: "setting-theme-text", cssVar: "--text" }},
    {{ key: "customMuted", id: "setting-theme-muted", cssVar: "--muted" }},
    {{ key: "customAccent", id: "setting-theme-accent", cssVar: "--accent" }},
  ];
  const isInteractiveTarget = (target) => target instanceof Element && Boolean(
    target.closest("input,textarea,select,option,button,label,summary,[contenteditable='true']")
  );
  const isProtectedTarget = (target) => target instanceof Element && Boolean(
    target.closest(".export-reader,.export-toc,.export-title,.chapter,.intro,.toc")
  );
  const bindHydratedNavLinks = () => {{
    document.querySelectorAll(".export-toc a, .export-nav-link").forEach((link) => {{
      if (link.dataset.drawerBound === "1") return;
      link.dataset.drawerBound = "1";
      link.addEventListener("click", closeDrawers);
    }});
  }};
  const getSuspiciousExtensionReason = () => {{
    const extensionHost = document.querySelector(
      '#extension-mmplj,[id="extension-mmplj"],[id^="extension-"],[class*=" extension-"],[class^="extension-"]'
    );
    if (extensionHost && !extensionHost.closest("#export-protect-overlay")) {{
      return "Phát hiện tiện ích copy đã chèn lớp can thiệp vào file được bảo vệ. Vui lòng tắt extension copy rồi mở lại file.";
    }}
    if (document.querySelector('meta[name="tm-extension-id"],meta[name="extension-id"],meta[data-extension-id]')) {{
      return "Phát hiện dấu vết extension can thiệp vào file được bảo vệ. Vui lòng tắt extension copy rồi mở lại file.";
    }}
    for (const styleNode of Array.from(document.querySelectorAll("style"))) {{
      if (!(styleNode instanceof HTMLStyleElement)) continue;
      if (styleNode.closest("#export-protect-overlay")) continue;
      const text = String(styleNode.textContent || "").toLowerCase();
      if (!text) continue;
      if (
        text.includes("user-select: text !important")
        || text.includes("-webkit-user-select: text !important")
        || text.includes("-webkit-touch-callout: text !important")
      ) {{
        return "Phát hiện mã ngoài cố bật lại copy/chọn chữ trong file được bảo vệ. Vui lòng tắt extension copy rồi mở lại file.";
      }}
    }}
    return "";
  }};
  const hasSuspiciousEmbedNodes = () => {{
    const nodes = document.querySelectorAll("iframe,object,embed");
    if (!nodes.length) return false;
    for (const node of Array.from(nodes)) {{
      if (!(node instanceof Element)) continue;
      if (node.closest("#export-protect-overlay")) continue;
      return true;
    }}
    return false;
  }};
  const hydrateProtectedMarkup = () => {{
    if (!PROTECT_ENABLED || protectedHydrated || !protectRuntime) return;
    if (protectedBodyHost) protectedBodyHost.innerHTML = protectRuntime.decodePayload(PROTECT_CONFIG.body_chunks, PROTECT_CONFIG.body_key_b64);
    if (protectedTocHost) protectedTocHost.innerHTML = protectRuntime.decodePayload(PROTECT_CONFIG.toc_chunks, PROTECT_CONFIG.toc_key_b64);
    protectedHydrated = true;
    bindHydratedNavLinks();
  }};
  const formatCountdown = (remainingMs) => {{
    const totalSec = Math.max(0, Math.ceil(Number(remainingMs || 0) / 1000));
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${{String(minutes).padStart(2, "0")}}:${{String(seconds).padStart(2, "0")}}`;
  }};
  const stopProtectCountdown = () => {{
    if (!protectCountdownTimer) return;
    window.clearInterval(protectCountdownTimer);
    protectCountdownTimer = 0;
  }};
  const stopProtectMonitor = () => {{
    if (!protectMonitorTimer) return;
    window.clearInterval(protectMonitorTimer);
    protectMonitorTimer = 0;
  }};
  const getScrollHost = () => document.scrollingElement || document.documentElement || document.body;
  const readStoredReading = () => {{
    try {{
      const raw = localStorage.getItem(READING_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    }} catch (_error) {{
      return null;
    }}
  }};
  const captureReadingSnapshot = () => {{
    const host = getScrollHost();
    if (!host) return null;
    const scrollTop = Math.max(0, Number(window.scrollY || host.scrollTop || 0));
    const maxScroll = Math.max(0, Number(host.scrollHeight || 0) - window.innerHeight);
    return {{
      scroll_y: scrollTop,
      max_scroll: maxScroll,
      scroll_ratio: maxScroll > 0 ? (scrollTop / maxScroll) : 0,
      saved_at_ts: Date.now(),
    }};
  }};
  const persistReadingNow = () => {{
    if (PROTECT_ENABLED && protectedLocked) return;
    const snapshot = captureReadingSnapshot();
    if (!snapshot) return;
    try {{ localStorage.setItem(READING_STORAGE_KEY, JSON.stringify(snapshot)); }} catch (_error) {{}}
  }};
  const schedulePersistReading = () => {{
    if (readingSaveTimer) window.clearTimeout(readingSaveTimer);
    readingSaveTimer = window.setTimeout(() => {{
      readingSaveTimer = 0;
      persistReadingNow();
    }}, 180);
  }};
  const clearReadingRestoreTimers = () => {{
    for (const timer of readingRestoreTimers) window.clearTimeout(timer);
    readingRestoreTimers = [];
  }};
  const resolveReadingTarget = (snapshot) => {{
    const host = getScrollHost();
    if (!host) return 0;
    const currentMax = Math.max(0, Number(host.scrollHeight || 0) - window.innerHeight);
    const savedY = Math.max(0, Number(snapshot?.scroll_y || 0));
    const savedMax = Math.max(0, Number(snapshot?.max_scroll || 0));
    const rawRatio = Number(snapshot?.scroll_ratio);
    const savedRatio = Number.isFinite(rawRatio) ? Math.min(1, Math.max(0, rawRatio)) : null;
    let target = savedY;
    if (savedRatio !== null && currentMax > 0) target = currentMax * savedRatio;
    if (savedMax > 0 && Math.abs(savedMax - currentMax) < 160 && savedY > 0) target = savedY;
    return Math.min(currentMax, Math.max(0, target));
  }};
  const restoreReadingPosition = () => {{
    if (readingRestoreApplied || window.location.hash) return;
    if (!readingSnapshot) readingSnapshot = readStoredReading();
    if (!readingSnapshot) {{
      readingRestoreApplied = true;
      return;
    }}
    const target = resolveReadingTarget(readingSnapshot);
    const snapshotHasProgress =
      Number(readingSnapshot?.scroll_y || 0) > 4
      || Number(readingSnapshot?.scroll_ratio || 0) > 0.01;
    if (!(target > 4)) {{
      if (!snapshotHasProgress) readingRestoreApplied = true;
      return;
    }}
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, target);
    window.setTimeout(() => {{
      root.style.scrollBehavior = previousBehavior;
    }}, 0);
    const current = Math.max(0, Number(window.scrollY || getScrollHost()?.scrollTop || 0));
    if (Math.abs(current - target) <= 12) readingRestoreApplied = true;
  }};
  const scheduleReadingRestore = () => {{
    if (readingRestoreApplied || window.location.hash) return;
    clearReadingRestoreTimers();
    for (const delay of READING_RESTORE_DELAYS) {{
      readingRestoreTimers.push(window.setTimeout(() => {{
        if (PROTECT_ENABLED && !protectedHydrated) return;
        restoreReadingPosition();
      }}, delay));
    }}
  }};
  const syncProtectCountdown = () => {{
    if (!(PROTECT_ENABLED && protectRuntime && PROTECT_CONFIG.access_code_enabled && protectCodeCountdown)) return;
    const meta = protectRuntime.getAccessMeta();
    protectCodeCountdown.textContent = formatCountdown(meta.remaining_ms);
  }};
  const startProtectCountdown = () => {{
    if (!(PROTECT_ENABLED && protectRuntime && PROTECT_CONFIG.access_code_enabled)) return;
    syncProtectCountdown();
    if (protectCountdownTimer) return;
    protectCountdownTimer = window.setInterval(() => {{
      if (protectedLocked) {{
        stopProtectCountdown();
        return;
      }}
      syncProtectCountdown();
    }}, 1000);
  }};
  const showProtectUnlock = () => {{
    if (!(protectOverlay && protectUnlockPanel && PROTECT_CONFIG.access_code_enabled)) return;
    protectOverlay.hidden = false;
    protectUnlockPanel.hidden = false;
    if (protectLockPanel) protectLockPanel.hidden = true;
    document.body.classList.add("protection-await-unlock");
    if (protectCodeInput instanceof HTMLInputElement) protectCodeInput.focus();
    startProtectCountdown();
  }};
  const hideProtectOverlay = () => {{
    if (protectOverlay) protectOverlay.hidden = true;
    if (protectUnlockPanel) protectUnlockPanel.hidden = true;
    if (protectLockPanel) protectLockPanel.hidden = true;
    document.body.classList.remove("protection-await-unlock");
  }};
  const unlockProtected = () => {{
    hydrateProtectedMarkup();
    hideProtectOverlay();
    if (protectCodeError) protectCodeError.hidden = true;
    if (protectCodeInput instanceof HTMLInputElement) protectCodeInput.value = "";
    scheduleReadingRestore();
  }};
  const lockProtected = (reason = "") => {{
    if (!PROTECT_ENABLED || protectedLocked) return;
    protectedLocked = true;
    document.body.classList.add("protected-locked");
    if (protectOverlay) protectOverlay.hidden = false;
    if (protectUnlockPanel) protectUnlockPanel.hidden = true;
    if (protectLockPanel) protectLockPanel.hidden = false;
    if (protectReasonNode) protectReasonNode.textContent = String(reason || PROTECT_REASON_DEFAULT);
    if (protectedBodyHost) protectedBodyHost.innerHTML = "";
    if (protectedTocHost) protectedTocHost.innerHTML = "";
    if (shell) shell.setAttribute("aria-hidden", "true");
    protectRuntime?.clearRemembered?.();
    stopProtectCountdown();
    stopProtectMonitor();
    clearHideTimer();
  }};
  const hasLikelyDockedDevtools = () => {{
    const widthGap = Math.abs(window.outerWidth - window.innerWidth);
    const heightGap = Math.abs(window.outerHeight - window.innerHeight);
    return (
      widthGap > PROTECT_DEVTOOLS_GAP_THRESHOLD
      || heightGap > PROTECT_DEVTOOLS_GAP_THRESHOLD
      || (widthGap - protectInitialWidthGap) > 120
      || (heightGap - protectInitialHeightGap) > 120
    );
  }};
  const detectDebuggerPause = () => {{
    if (!PROTECT_ENABLED || protectedLocked) return false;
    if (document.visibilityState && document.visibilityState !== "visible") return false;
    const started = performance.now();
    debugger;
    return (performance.now() - started) > PROTECT_DEBUGGER_STALL_MS;
  }};
  const anyDrawerOpen = () => Boolean(tocDrawer?.classList.contains("open") || settingsDrawer?.classList.contains("open"));
  const normalizeHexColor = (value) => {{
    const raw = String(value || "").trim();
    if (/^#[0-9a-f]{{6}}$/i.test(raw)) return raw.toLowerCase();
    if (/^#[0-9a-f]{{3}}$/i.test(raw)) return `#${{raw.slice(1).split("").map((ch) => ch + ch).join("")}}`.toLowerCase();
    return "";
  }};
  const hexToRgb = (value) => {{
    const hex = normalizeHexColor(value);
    if (!hex) return null;
    const int = Number.parseInt(hex.slice(1), 16);
    return {{
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255,
    }};
  }};
  const rgba = (value, alpha) => {{
    const rgb = hexToRgb(value);
    if (!rgb) return "";
    return `rgba(${{rgb.r}},${{rgb.g}},${{rgb.b}},${{alpha}})`;
  }};
  const readThemeVar = (name, fallback = "#000000") => {{
    const raw = getComputedStyle(root).getPropertyValue(name).trim();
    return normalizeHexColor(raw) || fallback;
  }};
  const syncThemeCustomForm = () => {{
    const enabled = Boolean(state.customThemeEnabled);
    if (themeCustomEnabledInput instanceof HTMLInputElement) themeCustomEnabledInput.checked = enabled;
    if (themeCustomGrid) themeCustomGrid.classList.toggle("is-disabled", !enabled);
    for (const field of themeColorFields) {{
      const input = document.getElementById(field.id);
      if (!(input instanceof HTMLInputElement)) continue;
      const resolved = normalizeHexColor(state[field.key]) || readThemeVar(field.cssVar);
      input.value = resolved;
      input.disabled = !enabled;
    }}
    if (themeCustomResetButton instanceof HTMLButtonElement) {{
      themeCustomResetButton.disabled = !enabled && !themeColorFields.some((field) => normalizeHexColor(state[field.key]));
    }}
  }};
  const applyCustomThemeVars = () => {{
    if (!state.customThemeEnabled) {{
      for (const field of themeColorFields) root.style.removeProperty(field.cssVar);
      root.style.removeProperty("--accent-soft");
      root.style.removeProperty("--border");
      return;
    }}
    let accentValue = "";
    let textValue = "";
    for (const field of themeColorFields) {{
      const nextColor = normalizeHexColor(state[field.key]);
      if (nextColor) root.style.setProperty(field.cssVar, nextColor);
      else root.style.removeProperty(field.cssVar);
      if (field.key === "customAccent") accentValue = nextColor || readThemeVar("--accent");
      if (field.key === "customText") textValue = nextColor || readThemeVar("--text");
    }}
    const accentSoft = rgba(accentValue, 0.18);
    const borderColor = rgba(textValue, 0.16);
    if (accentSoft) root.style.setProperty("--accent-soft", accentSoft);
    else root.style.removeProperty("--accent-soft");
    if (borderColor) root.style.setProperty("--border", borderColor);
    else root.style.removeProperty("--border");
  }};
  const resetCustomTheme = () => {{
    state.customThemeEnabled = false;
    for (const field of themeColorFields) state[field.key] = "";
  }};
  const clearHideTimer = () => {{
    if (!hideTimer) return;
    window.clearTimeout(hideTimer);
    hideTimer = 0;
  }};
  const syncUiState = () => {{
    shell?.classList.toggle("ui-visible", Boolean(uiVisible || anyDrawerOpen()));
  }};
  const scheduleUiHide = (delay = 2200) => {{
    clearHideTimer();
    if (anyDrawerOpen()) return;
    hideTimer = window.setTimeout(() => {{
      uiVisible = false;
      syncUiState();
    }}, Math.max(400, Number(delay || 0)));
  }};
  const showUi = (delay = 2200) => {{
    uiVisible = true;
    syncUiState();
    scheduleUiHide(delay);
  }};
  const hideUiNow = () => {{
    clearHideTimer();
    uiVisible = false;
    syncUiState();
  }};
  const closeDrawers = () => {{
    tocDrawer?.classList.remove("open");
    settingsDrawer?.classList.remove("open");
    syncUiState();
    scheduleUiHide(1400);
  }};
  const toggleDrawer = (name) => {{
    const target = name === "toc" ? tocDrawer : settingsDrawer;
    const other = name === "toc" ? settingsDrawer : tocDrawer;
    other?.classList.remove("open");
    const willOpen = !target?.classList.contains("open");
    target?.classList.toggle("open", willOpen);
    if (willOpen) {{
      uiVisible = true;
      clearHideTimer();
    }} else {{
      scheduleUiHide(1400);
    }}
    syncUiState();
  }};
  const runProtectionChecks = () => {{
    if (!PROTECT_ENABLED || protectedLocked) return;
    const extensionReason = getSuspiciousExtensionReason();
    if (extensionReason) {{
      lockProtected(extensionReason);
      return;
    }}
    if (hasSuspiciousEmbedNodes()) {{
      lockProtected("Phát hiện tiện ích hoặc mã ngoài chèn vào file được bảo vệ. Vui lòng tắt công cụ copy/trích xuất rồi mở lại file.");
      return;
    }}
    if (hasLikelyDockedDevtools()) {{
      lockProtected("Phát hiện công cụ kiểm tra nội dung đang mở. Người xuất đã chặn copy nội dung này.");
      return;
    }}
    if (detectDebuggerPause()) {{
      lockProtected("Phát hiện DevTools hoặc trình gỡ lỗi đang mở. Người xuất đã chặn copy nội dung này.");
    }}
  }};
  const startProtectMonitor = () => {{
    if (!PROTECT_ENABLED || protectMonitorTimer || protectedLocked) return;
    runProtectionChecks();
    if (protectedLocked) return;
    protectMonitorTimer = window.setInterval(() => {{
      runProtectionChecks();
    }}, 900);
  }};
  const persist = () => {{
    try {{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }} catch (_error) {{}}
  }};
  const text = (id, value) => {{
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }};
  const resetTapTrack = () => {{
    tapTrack = null;
  }};
  const trackTapStart = (event) => {{
    const target = event.target;
    if (!(target instanceof Element)) {{
      tapTrack = null;
      return;
    }}
    tapTrack = {{
      pointerId: event.pointerId,
      startX: Number(event.clientX || 0),
      startY: Number(event.clientY || 0),
      startTs: Date.now(),
      moved: false,
      interactive: Boolean(target.closest("a,button,input,label,select,textarea,summary")),
    }};
  }};
  const trackTapMove = (event) => {{
    if (!tapTrack || tapTrack.pointerId !== event.pointerId) return;
    const dx = Number(event.clientX || 0) - tapTrack.startX;
    const dy = Number(event.clientY || 0) - tapTrack.startY;
    if (Math.hypot(dx, dy) > 12) tapTrack.moved = true;
  }};
  const commitTapToggle = (event) => {{
    if (!tapTrack || tapTrack.pointerId !== event.pointerId) {{
      resetTapTrack();
      return;
    }}
    const target = event.target;
    const elapsed = Date.now() - tapTrack.startTs;
    const interactive =
      tapTrack.interactive ||
      (target instanceof Element && Boolean(target.closest("a,button,input,label,select,textarea,summary")));
    const shouldToggle = !interactive && !tapTrack.moved && elapsed <= 320;
    resetTapTrack();
    if (!shouldToggle) return;
    if (anyDrawerOpen()) {{
      uiVisible = true;
      syncUiState();
      return;
    }}
    if (uiVisible) {{
      hideUiNow();
      return;
    }}
    showUi();
  }};
  const apply = () => {{
    const width = Number(state.width ?? defaults.width);
    const fontSize = Number(state.fontSize ?? defaults.fontSize);
    const lineHeight = Number(state.lineHeight ?? defaults.lineHeight);
    const indent = Number(state.indent ?? defaults.indent);
    const imageWidth = Number(state.imageWidth ?? defaults.imageWidth);
    const imageGap = Number(state.imageGap ?? defaults.imageGap);
    const noIndent = Boolean(state.noIndent);
    root.dataset.theme = String(state.theme || defaults.theme);
    root.style.setProperty("--reader-width", `${{width}}px`);
    root.style.setProperty("--reader-font-size", `${{fontSize}}px`);
    root.style.setProperty("--reader-line-height", String(lineHeight));
    root.style.setProperty("--reader-indent", `${{noIndent ? 0 : indent}}em`);
    root.style.setProperty("--comic-max-width", `${{imageWidth}}px`);
    root.style.setProperty("--comic-image-gap", `${{imageGap}}rem`);
    root.dataset.fontFamily = String(state.fontFamily || defaults.fontFamily);
    root.classList.toggle("no-indent", noIndent);
    applyCustomThemeVars();
    text("setting-width-value", `${{width}}px`);
    text("setting-font-size-value", `${{fontSize}}px`);
    text("setting-line-height-value", `${{lineHeight.toFixed(2)}}`);
    text("setting-indent-value", noIndent ? "Tắt" : `${{indent.toFixed(1)}}em`);
    text("setting-image-width-value", `${{imageWidth}}px`);
    text("setting-image-gap-value", `${{imageGap.toFixed(2)}}rem`);
    if (indentInput instanceof HTMLInputElement) {{
      indentInput.value = String(indent);
      indentInput.disabled = noIndent;
    }}
    if (noIndentInput instanceof HTMLInputElement) {{
      noIndentInput.checked = noIndent;
    }}
    syncThemeCustomForm();
  }};
  const bind = (id, key, parser = (value) => value) => {{
    const node = document.getElementById(id);
    if (!node) return;
    node.value = String(state[key] ?? defaults[key]);
    node.addEventListener("input", () => {{
      state[key] = parser(node.value);
      apply();
      persist();
    }});
    node.addEventListener("change", () => {{
      state[key] = parser(node.value);
      apply();
      persist();
    }});
  }};
  const bindChecked = (id, key) => {{
    const node = document.getElementById(id);
    if (!(node instanceof HTMLInputElement)) return;
    node.checked = Boolean(state[key] ?? defaults[key]);
    node.addEventListener("change", () => {{
      state[key] = Boolean(node.checked);
      apply();
      persist();
    }});
  }};
  try {{
    if (PROTECT_ENABLED) {{
      if (!protectRuntime) {{
        lockProtected("Thiếu module bảo vệ nội dung để mở file HTML này.");
      }} else if (navigator.webdriver) {{
        lockProtected("Người xuất đã chặn tự động hóa hoặc công cụ trích xuất nội dung.");
      }} else if (hasLikelyDockedDevtools()) {{
        lockProtected("Phát hiện công cụ kiểm tra nội dung đang mở. Người xuất đã chặn copy nội dung này.");
      }} else if (PROTECT_CONFIG.access_code_enabled) {{
        const remembered = protectRuntime.resumeRemembered();
        if (remembered && remembered.ok) {{
          unlockProtected();
        }} else {{
          showProtectUnlock();
        }}
      }} else {{
        unlockProtected();
      }}
    }}
  }} catch (error) {{
    console.warn("reader export protection init failed", error);
    if (PROTECT_ENABLED && PROTECT_CONFIG.access_code_enabled) {{
      showProtectUnlock();
    }} else if (PROTECT_ENABLED) {{
      unlockProtected();
    }}
  }}
  if (PROTECT_ENABLED) startProtectMonitor();
  document.querySelectorAll("[data-toggle-drawer]").forEach((button) => {{
    button.addEventListener("click", () => toggleDrawer(button.getAttribute("data-toggle-drawer") || ""));
  }});
  document.querySelectorAll("[data-close-drawer]").forEach((button) => {{
    button.addEventListener("click", closeDrawers);
  }});
  document.querySelectorAll(".export-drawer-backdrop").forEach((node) => {{
    node.addEventListener("click", closeDrawers);
  }});
  document.querySelectorAll(".export-toc a, .export-nav-link").forEach((link) => {{
    link.addEventListener("click", closeDrawers);
  }});
  document.addEventListener("contextmenu", (event) => {{
    if (!PROTECT_ENABLED || isInteractiveTarget(event.target) || !isProtectedTarget(event.target)) return;
    event.preventDefault();
  }});
  document.addEventListener("copy", (event) => {{
    if (!PROTECT_ENABLED || isInteractiveTarget(event.target) || !isProtectedTarget(event.target)) return;
    event.preventDefault();
    lockProtected();
  }});
  document.addEventListener("cut", (event) => {{
    if (!PROTECT_ENABLED || isInteractiveTarget(event.target) || !isProtectedTarget(event.target)) return;
    event.preventDefault();
    lockProtected();
  }});
  document.addEventListener("selectstart", (event) => {{
    if (!PROTECT_ENABLED || isInteractiveTarget(event.target) || !isProtectedTarget(event.target)) return;
    event.preventDefault();
  }});
  document.addEventListener("dragstart", (event) => {{
    if (!PROTECT_ENABLED || isInteractiveTarget(event.target) || !isProtectedTarget(event.target)) return;
    event.preventDefault();
  }});
  protectCodeSubmit?.addEventListener("click", () => {{
    if (!(PROTECT_ENABLED && protectRuntime && PROTECT_CONFIG.access_code_enabled)) return;
    const result = protectRuntime.verifyAccessCode(protectCodeInput instanceof HTMLInputElement ? protectCodeInput.value : "");
    if (result && result.ok) {{
      unlockProtected();
      showUi(2600);
      return;
    }}
    if (protectCodeError) protectCodeError.hidden = false;
    if (protectCodeInput instanceof HTMLInputElement) {{
      protectCodeInput.focus();
      protectCodeInput.select();
    }}
  }});
  protectCodeInput?.addEventListener("keydown", (event) => {{
    if (event.key !== "Enter") return;
    event.preventDefault();
    protectCodeSubmit?.click();
  }});
  protectCodeInput?.addEventListener("input", () => {{
    if (protectCodeError) protectCodeError.hidden = true;
  }});
  if (PROTECT_ENABLED) {{
    const observer = new MutationObserver((mutations) => {{
      for (const mutation of mutations) {{
        for (const node of Array.from(mutation.addedNodes || [])) {{
          if (node instanceof HTMLStyleElement) {{
            const text = String(node.textContent || "").toLowerCase();
            if (
              text.includes("user-select: text !important")
              || text.includes("-webkit-user-select: text !important")
              || text.includes("-webkit-touch-callout: text !important")
            ) {{
              lockProtected("Phát hiện mã ngoài cố bật lại copy/chọn chữ trong file được bảo vệ. Vui lòng tắt extension copy rồi mở lại file.");
              return;
            }}
          }}
          if (!(node instanceof Element)) continue;
          const tag = String(node.tagName || "").toLowerCase();
          if (["script", "iframe", "object", "embed"].includes(tag)) {{
            lockProtected("Phát hiện tiện ích hoặc mã ngoài chèn vào file được bảo vệ. Vui lòng tắt công cụ copy/trích xuất rồi mở lại file.");
            return;
          }}
          if (
            tag === "meta"
            && ["tm-extension-id", "extension-id"].includes(String(node.getAttribute("name") || "").trim().toLowerCase())
          ) {{
            lockProtected("Phát hiện dấu vết extension can thiệp vào file được bảo vệ. Vui lòng tắt extension copy rồi mở lại file.");
            return;
          }}
          if (
            node.matches?.('#extension-mmplj,[id="extension-mmplj"],[id^="extension-"],[class*=" extension-"],[class^="extension-"]')
          ) {{
            lockProtected("Phát hiện tiện ích copy đã chèn lớp can thiệp vào file được bảo vệ. Vui lòng tắt extension copy rồi mở lại file.");
            return;
          }}
          if (node.querySelector && node.querySelector("iframe,object,embed")) {{
            lockProtected("Phát hiện tiện ích hoặc mã ngoài chèn vào file được bảo vệ. Vui lòng tắt công cụ copy/trích xuất rồi mở lại file.");
            return;
          }}
          if (
            node.querySelector?.('#extension-mmplj,[id="extension-mmplj"],[id^="extension-"],[class*=" extension-"],[class^="extension-"],meta[name="tm-extension-id"],meta[name="extension-id"]')
          ) {{
            lockProtected("Phát hiện extension copy hoặc dấu vết can thiệp vào file được bảo vệ. Vui lòng tắt extension copy rồi mở lại file.");
            return;
          }}
          if (node.querySelector) {{
            for (const styleNode of Array.from(node.querySelectorAll("style"))) {{
              const text = String(styleNode.textContent || "").toLowerCase();
              if (
                text.includes("user-select: text !important")
                || text.includes("-webkit-user-select: text !important")
                || text.includes("-webkit-touch-callout: text !important")
              ) {{
                lockProtected("Phát hiện mã ngoài cố bật lại copy/chọn chữ trong file được bảo vệ. Vui lòng tắt extension copy rồi mở lại file.");
                return;
              }}
            }}
          }}
        }}
      }}
    }});
    observer.observe(document.documentElement, {{ childList: true, subtree: true }});
    window.addEventListener("resize", () => {{
      runProtectionChecks();
    }});
  }}
  const handleProtectedKeydown = (event) => {{
    const key = String(event.key || "").toLowerCase();
    const modifier = Boolean(event.ctrlKey || event.metaKey);
    const shiftModifier = Boolean(event.shiftKey);
    if (
      PROTECT_ENABLED
      && (
        key === "f12"
        || (modifier && shiftModifier && ["i", "j", "c"].includes(key))
        || ((modifier && ["a", "c", "x", "s", "p", "u"].includes(key)) && !isInteractiveTarget(event.target))
      )
    ) {{
      event.preventDefault();
      lockProtected();
      return;
    }}
    if (
      PROTECT_ENABLED &&
      modifier
      && ["a", "c", "x", "s", "p", "u"].includes(key)
      && !isInteractiveTarget(event.target)
    ) {{
      event.preventDefault();
      showUi(2600);
      return;
    }}
    if (event.key === "Escape") {{
      if (anyDrawerOpen()) closeDrawers();
      else hideUiNow();
      return;
    }}
    showUi(2600);
  }};
  window.addEventListener("keydown", handleProtectedKeydown, true);
  document.addEventListener("focusin", () => showUi(2600));
  window.addEventListener("scroll", () => {{
    schedulePersistReading();
  }}, {{ passive: true }});
  window.addEventListener("pagehide", persistReadingNow);
  window.addEventListener("beforeunload", persistReadingNow);
  document.addEventListener("visibilitychange", () => {{
    if (document.visibilityState === "hidden") persistReadingNow();
  }});
  window.addEventListener("load", scheduleReadingRestore, {{ once: true }});
  main?.addEventListener("pointerdown", trackTapStart, true);
  main?.addEventListener("pointermove", trackTapMove, true);
  main?.addEventListener("pointerup", commitTapToggle, true);
  main?.addEventListener("pointercancel", resetTapTrack, true);
  document.querySelectorAll(".chapter-image").forEach((image) => {{
    if (!(image instanceof HTMLImageElement)) return;
    image.addEventListener("load", () => {{
      if (!readingRestoreApplied) scheduleReadingRestore();
    }});
  }});
  header?.addEventListener("pointerenter", () => {{
    uiVisible = true;
    clearHideTimer();
    syncUiState();
  }});
  header?.addEventListener("pointerleave", () => {{
    scheduleUiHide(1200);
  }});
  bind("setting-theme", "theme", (value) => value);
  bind("setting-font-family", "fontFamily", (value) => value);
  bind("setting-width", "width", (value) => Number(value || defaults.width));
  bind("setting-font-size", "fontSize", (value) => Number(value || defaults.fontSize));
  bind("setting-line-height", "lineHeight", (value) => Number(value || defaults.lineHeight));
  bind("setting-indent", "indent", (value) => Number(value || defaults.indent));
  bindChecked("setting-no-indent", "noIndent");
  bindChecked("setting-theme-custom-enabled", "customThemeEnabled");
  bind("setting-image-width", "imageWidth", (value) => Number(value || defaults.imageWidth));
  bind("setting-image-gap", "imageGap", (value) => Number(value || defaults.imageGap));
  for (const field of themeColorFields) {{
    const node = document.getElementById(field.id);
    if (!(node instanceof HTMLInputElement)) continue;
    node.addEventListener("input", () => {{
      state[field.key] = normalizeHexColor(node.value);
      if (!state.customThemeEnabled) state.customThemeEnabled = true;
      apply();
      persist();
    }});
  }}
  themeCustomResetButton?.addEventListener("click", () => {{
    resetCustomTheme();
    apply();
    persist();
  }});
  shell?.classList.toggle("is-comic", IS_COMIC);
  apply();
  if (!PROTECT_ENABLED) scheduleReadingRestore();
  hideUiNow();
}})();
</script>
"""
    return (
        "<!doctype html>"
        '<html lang="vi"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        f"<title>{html.escape(title)}</title>"
        "<style>"
        ":root{--bg:#f5f0e8;--bg-elev:#fffdf8;--surface:#fffaf1;--surface-strong:#ffffff;--text:#1f1a17;--muted:#6d6259;--border:rgba(73,54,38,.14);--shadow:0 24px 48px rgba(46,31,20,.12);--accent:#99572a;--accent-soft:rgba(153,87,42,.14);--reader-width:860px;--reader-font-size:20px;--reader-line-height:1.9;--reader-indent:1.8em;--comic-max-width:1080px;--comic-image-gap:.9rem;--font-body:'Georgia','Times New Roman',serif;--font-ui:'Segoe UI',system-ui,sans-serif;}"
        f"{theme_css}"
        ":root[data-font-family='serif']{--font-body:'Georgia','Times New Roman',serif;}"
        ":root[data-font-family='literary']{--font-body:'Palatino Linotype','Book Antiqua','Noto Serif','Times New Roman',serif;}"
        ":root[data-font-family='sans']{--font-body:'Segoe UI','Helvetica Neue',Arial,sans-serif;}"
        ":root[data-font-family='mono']{--font-body:'Consolas','SFMono-Regular','Roboto Mono',monospace;}"
        "*{box-sizing:border-box;}html{scroll-behavior:smooth;}body{margin:0;background:radial-gradient(circle at top,var(--bg-elev),var(--bg) 42%);color:var(--text);font-family:var(--font-ui);}"
        f"{protection_extra_styles}"
        "a{color:var(--accent);text-decoration:none;}a:hover{text-decoration:underline;}"
        ".export-shell{min-height:100vh;padding:20px 18px 48px;}.export-header{position:fixed;top:12px;left:50%;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:12px;width:min(calc(100vw - 36px),1180px);margin:0;padding:12px 16px;border:1px solid var(--border);border-radius:18px;background:color-mix(in srgb,var(--surface-strong) 88%, transparent);backdrop-filter:blur(16px);box-shadow:var(--shadow);transform:translate(-50%,-132%);opacity:0;pointer-events:none;transition:transform .22s ease,opacity .18s ease;}"
        ".export-shell.ui-visible .export-header{transform:translate(-50%,0);opacity:1;pointer-events:auto;}"
        ".export-header-left,.export-header-right{display:flex;align-items:center;gap:10px;}.export-title{display:flex;flex-direction:column;gap:2px;min-width:0;text-align:center;}.export-title strong{font-size:15px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.export-title span{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}"
        ".export-chip,.export-nav-link,.export-drawer-close{appearance:none;border:1px solid var(--border);background:var(--surface);color:var(--text);padding:10px 14px;border-radius:999px;font:600 13px/1 var(--font-ui);cursor:pointer;transition:transform .18s ease,background .18s ease,border-color .18s ease;}.export-chip:hover,.export-nav-link:hover,.export-drawer-close:hover{transform:translateY(-1px);background:var(--accent-soft);text-decoration:none;}"
        ".export-main{max-width:1180px;margin:0 auto;}.export-reader{width:min(100%,var(--reader-width));margin:0 auto;padding:36px 34px;border:1px solid var(--border);border-radius:28px;background:color-mix(in srgb,var(--surface-strong) 92%, transparent);box-shadow:var(--shadow);}"
        ".export-reader.is-comic{width:min(100%,calc(var(--comic-max-width) + 80px));padding:24px 20px 28px;}.export-reader.is-comic .intro,.export-reader.is-comic .toc{max-width:var(--comic-max-width);margin-left:auto;margin-right:auto;}"
        ".intro,.toc{margin:0 0 28px;padding:0 0 22px;border-bottom:1px solid var(--border);}.intro h1{margin:0 0 14px;font:700 clamp(28px,4vw,40px)/1.15 var(--font-body);letter-spacing:-.02em;}.intro p,.toc p,.chapter p{margin:0 0 1em;white-space:pre-wrap;}"
        ".export-cover-wrap{display:flex;justify-content:center;margin:0 0 22px;}.export-cover{display:block;width:min(280px,100%);max-width:100%;border-radius:22px;border:1px solid var(--border);box-shadow:0 24px 48px rgba(0,0,0,.18);background:var(--surface);}"
        ".intro.intro-cover-only{display:flex;justify-content:center;padding-bottom:14px;}"
        ".chapter{margin:32px auto 44px;}.chapter-title{margin:0 0 16px;font:700 clamp(22px,3vw,32px)/1.25 var(--font-body);letter-spacing:-.02em;}.chapter-text{font-family:var(--font-body);font-size:var(--reader-font-size);line-height:var(--reader-line-height);}.chapter-text p{text-indent:var(--reader-indent);}.chapter-text p:empty,.chapter-text p.blank{margin-bottom:.4em;text-indent:0;}"
        ".chapter-images{display:flex;flex-direction:column;gap:var(--comic-image-gap);align-items:center;}.chapter-image-wrap{width:100%;max-width:var(--comic-max-width);margin:0 auto;padding:0;border-radius:22px;overflow:hidden;background:color-mix(in srgb,var(--surface) 82%, transparent);box-shadow:0 18px 38px rgba(0,0,0,.18);}.chapter-image{display:block;width:100%;height:auto;}"
        ".export-toc ol{margin:0;padding-left:22px;}.export-toc li+li{margin-top:8px;}.export-toc.empty p{color:var(--muted);}"
        ".export-nav{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 18px;}.chapter-footer-nav{margin-top:24px;padding-top:20px;border-top:1px solid var(--border);}"
        ".export-drawer{position:fixed;top:0;bottom:0;z-index:40;pointer-events:none;}.export-drawer[data-drawer='toc']{left:0;}.export-drawer[data-drawer='settings']{right:0;}.export-drawer.open{pointer-events:auto;}.export-drawer-backdrop{position:absolute;inset:0;background:rgba(9,12,17,.44);opacity:0;transition:opacity .2s ease;}.export-drawer.open .export-drawer-backdrop{opacity:1;}"
        ".export-drawer-panel{position:absolute;top:0;bottom:0;width:min(360px,86vw);padding:20px;background:var(--bg-elev);box-shadow:var(--shadow);overflow:auto;transition:transform .22s ease;}.export-drawer[data-drawer='toc'] .export-drawer-panel{left:0;transform:translateX(-108%);border-right:1px solid var(--border);}.export-drawer[data-drawer='settings'] .export-drawer-panel{right:0;transform:translateX(108%);border-left:1px solid var(--border);}.export-drawer.open .export-drawer-panel{transform:translateX(0);}"
        ".export-drawer-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;}.export-drawer-head h2{margin:0;font-size:18px;}.export-drawer-body{display:grid;gap:14px;}.settings-group{display:grid;gap:8px;}.settings-group label{font-size:13px;font-weight:700;color:var(--muted);}.settings-group input,.settings-group select{width:100%;}.settings-group select{padding:11px 12px;border:1px solid var(--border);border-radius:12px;background:var(--surface);color:var(--text);font:500 14px/1.2 var(--font-ui);}.settings-check-label{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border:1px solid var(--border);border-radius:14px;background:var(--surface);color:var(--text);font:600 14px/1.3 var(--font-ui);}.settings-check-label span{color:var(--text);font:600 14px/1.3 var(--font-ui);}.settings-check-label input{width:20px;height:20px;flex:0 0 auto;accent-color:var(--accent);}.settings-subgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}.settings-subgrid.is-disabled{opacity:.72;}.settings-color{display:grid;gap:6px;}.settings-color span{font-size:12px;font-weight:700;color:var(--muted);}.settings-color input[type='color']{width:100%;height:38px;padding:0;border:1px solid var(--border);border-radius:12px;background:var(--surface);cursor:pointer;}.settings-reset-button{justify-self:end;}"
        "input[type='range']{accent-color:var(--accent);}input[type='range']:disabled,.settings-color input[type='color']:disabled{opacity:.45;cursor:not-allowed;}.no-indent .chapter-text p{text-indent:0;}.comic-only{display:none;}.is-comic .comic-only{display:grid;}.is-comic .text-only{display:none;}"
        "@media print{.content-protected .export-shell{display:none !important;}.content-protected .export-protect-overlay{display:flex !important;}}"
        "@media (max-width: 920px){.export-shell{padding:14px 12px 36px;}.export-header{top:8px;width:min(calc(100vw - 24px),1180px);padding:10px 12px;border-radius:16px;}.export-title strong{font-size:14px;}.export-title span{display:none;}.export-reader,.export-reader.is-comic{padding:24px 18px 28px;border-radius:22px;}.chapter-title{margin-bottom:14px;}.export-chip{padding:9px 12px;font-size:12px;}.settings-subgrid{grid-template-columns:1fr;}}"
        "@media (max-width: 640px){.export-header{display:grid;grid-template-columns:1fr auto;align-items:center;}.export-header-right{justify-content:flex-end;}.export-header-left{grid-column:1 / span 2;}.export-title{order:-1;text-align:left;}}"
        "</style>"
        f"{hidden_notice_markup}"
        f"</head>{body_open_tag}"
        f"{protection_overlay_markup}"
        f'<div class="export-shell{" is-comic" if is_comic else ""}">'
        '<header class="export-header">'
        '<div class="export-header-left">'
        '<button type="button" class="export-chip" data-toggle-drawer="toc">Mục lục</button>'
        '<button type="button" class="export-chip" data-toggle-drawer="settings">Tùy chỉnh</button>'
        "</div>"
        f'<div class="export-title"><strong>{html.escape(header_title)}</strong><span>{html.escape(title)}</span></div>'
        '<div class="export-header-right"></div>'
        "</header>"
        '<aside class="export-drawer" data-drawer="toc">'
        '<div class="export-drawer-backdrop" data-close-drawer></div>'
        '<div class="export-drawer-panel"><div class="export-drawer-head"><h2>Mục lục</h2><button type="button" class="export-drawer-close" data-close-drawer>Đóng</button></div>'
        f"{toc_drawer_body_markup}</div></aside>"
        '<aside class="export-drawer" data-drawer="settings">'
        '<div class="export-drawer-backdrop" data-close-drawer></div>'
        '<div class="export-drawer-panel"><div class="export-drawer-head"><h2>Tùy chỉnh đọc</h2><button type="button" class="export-drawer-close" data-close-drawer>Đóng</button></div>'
        f'<div class="export-drawer-body">{settings_markup}</div></div></aside>'
        '<main class="export-main">'
        f"{article_markup}"
        "</main></div>"
        f"{script}</body></html>"
    )


def create_export_txt(
    *,
    export_dir: Path,
    safe_name: str,
    metadata: dict[str, str],
    chapters: list[dict[str, Any]],
    options: dict[str, bool],
    safe_filename: Callable[[str], str],
) -> Path:
    ts = _utc_now_ts()
    include_titles = bool(options.get("include_chapter_titles"))
    merge_single = bool(options.get("merge_single_file"))
    intro_text = render_export_intro_text(metadata)
    if merge_single:
        out = export_dir / f"{safe_name}_{ts}.txt"
        lines: list[str] = []
        if intro_text:
            lines.extend([intro_text, "", "====================", ""])
        for chapter in chapters:
            if include_titles:
                lines.extend([str(chapter.get("title") or ""), ""])
            lines.append(text_paragraphs_support.strip_paragraph_indentation(str(chapter.get("text") or "")))
            lines.append("")
        if not lines:
            raise ValueError("Không có chương hợp lệ để xuất TXT.")
        out.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")
        return out

    out = export_dir / f"{safe_name}_{ts}.zip"
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        if intro_text:
            zf.writestr("0000_Gioi_thieu.txt", (intro_text.strip() + "\n").encode("utf-8"))
        for chapter in chapters:
            chapter_order = int(chapter.get("chapter_order") or 0)
            chapter_title = safe_filename(str(chapter.get("title") or chapter.get("title_raw") or f"Chapter_{chapter_order}"))
            filename = f"{chapter_order:04d}_{chapter_title}.txt"
            text_value = text_paragraphs_support.strip_paragraph_indentation(str(chapter.get("text") or ""))
            if include_titles:
                payload = f"{chapter.get('title') or ''}\n\n{text_value}".strip() + "\n"
            else:
                payload = text_value.strip() + "\n"
            zf.writestr(filename, payload.encode("utf-8"))
    return out


def create_export_html(
    *,
    export_dir: Path,
    safe_name: str,
    metadata: dict[str, str],
    chapters: list[dict[str, Any]],
    options: dict[str, bool],
    is_comic: bool,
    safe_filename: Callable[[str], str],
) -> Path:
    ts = _utc_now_ts()
    merge_single = bool(options.get("merge_single_file"))
    include_intro = bool(options.get("include_intro"))
    include_titles = bool(options.get("include_chapter_titles"))
    include_toc = bool(options.get("include_toc_page"))
    protect_content = bool(options.get("protect_content"))
    cover_only_html = render_export_cover_html(metadata)

    def _chapter_section(chapter: dict[str, Any], *, inline_images: bool) -> str:
        chapter_id = f"chap-{int(chapter.get('chapter_order') or 0)}"
        parts = [f'<section class="chapter" id="{chapter_id}">']
        if include_titles:
            parts.append(f'<h2 class="chapter-title">{html.escape(str(chapter.get("title") or ""))}</h2>')
        if is_comic:
            parts.append('<div class="chapter-images">')
            for image_idx, image in enumerate(chapter.get("images") or [], start=1):
                data = bytes(image.get("data") or b"")
                ctype = str(image.get("content_type") or "application/octet-stream")
                if inline_images:
                    encoded = base64.b64encode(data).decode("ascii")
                    src = f"data:{ctype};base64,{encoded}"
                else:
                    src = html.escape(str(image.get("href") or ""))
                alt = html.escape(f"{chapter.get('title') or 'Chương'} #{image_idx}")
                parts.append(f'<figure class="chapter-image-wrap"><img class="chapter-image" src="{src}" alt="{alt}" loading="lazy"></figure>')
            parts.append("</div>")
        else:
            parts.append('<div class="chapter-text">')
            text_value = text_paragraphs_support.strip_paragraph_indentation(str(chapter.get("text") or ""))
            for line in text_value.split("\n"):
                parts.append(f"<p>{html.escape(line)}</p>" if line.strip() else '<p class="blank"></p>')
            parts.append("</div>")
        parts.append("</section>")
        return "".join(parts)

    if merge_single:
        out = export_dir / f"{safe_name}_{ts}.html"
        body_parts: list[str] = []
        sidebar_toc_html = ""
        if chapters:
            sidebar_toc_html = build_export_toc_html(
                chapters,
                link_builder=lambda chapter: f"#chap-{int(chapter.get('chapter_order') or 0)}",
            )
        if include_intro:
            body_parts.append(f'<section class="intro">{render_export_intro_html(metadata)}</section>')
        elif cover_only_html:
            body_parts.append(f'<section class="intro intro-cover-only">{cover_only_html}</section>')
        if include_toc:
            toc_html = build_export_toc_html(
                chapters,
                link_builder=lambda chapter: f"#chap-{int(chapter.get('chapter_order') or 0)}",
            )
            body_parts.append(f'<section class="toc">{toc_html}</section>')
        for chapter in chapters:
            body_parts.append(_chapter_section(chapter, inline_images=is_comic))
        out.write_text(
            wrap_export_html_document(
                metadata["title"],
                "".join(body_parts),
                toc_html=sidebar_toc_html,
                is_comic=is_comic,
                protect_content=protect_content,
                protect_options=options,
            ),
            encoding="utf-8",
        )
        return out

    out = export_dir / f"{safe_name}_{ts}.zip"
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        chapter_links: dict[str, str] = {}
        chapter_pages: list[tuple[dict[str, Any], str]] = []
        for chapter in chapters:
            chapter_order = int(chapter.get("chapter_order") or 0)
            chapter_slug = safe_filename(str(chapter.get("title") or chapter.get("title_raw") or f"Chapter_{chapter_order}"))
            html_name = f"chapter_{chapter_order:04d}_{chapter_slug}.html"
            chapter_links[str(chapter.get("chapter_id") or chapter_order)] = html_name
            chapter_pages.append((chapter, html_name))
        toc_html_all = build_export_toc_html(
            chapters,
            link_builder=lambda chapter: chapter_links.get(
                str(chapter.get("chapter_id") or chapter.get("chapter_order") or ""),
                "#",
            ),
        ) if chapters else ""
        for index, pair in enumerate(chapter_pages):
            chapter, html_name = pair
            chapter_copy = dict(chapter)
            if is_comic:
                remapped_images = []
                for image_idx, image in enumerate(chapter.get("images") or [], start=1):
                    ext = str(image.get("ext") or ".bin")
                    asset_name = f"assets/{chapter_order:04d}_{image_idx:04d}{ext}"
                    zf.writestr(asset_name, bytes(image.get("data") or b""))
                    remapped = dict(image)
                    remapped["href"] = asset_name
                    remapped_images.append(remapped)
                chapter_copy["images"] = remapped_images
            prev_href = chapter_pages[index - 1][1] if index > 0 else ""
            next_href = chapter_pages[index + 1][1] if index + 1 < len(chapter_pages) else ""
            nav_top = _build_export_html_nav(prev_href=prev_href, next_href=next_href, index_href="index.html")
            nav_bottom = _build_export_html_nav(
                prev_href=prev_href,
                next_href=next_href,
                index_href="index.html",
                index_label="Về trang đầu",
            )
            zf.writestr(
                html_name,
                wrap_export_html_document(
                    str(chapter.get("title") or metadata["title"]),
                    nav_top + _chapter_section(chapter_copy, inline_images=False) + f'<div class="chapter-footer-nav">{nav_bottom}</div>',
                    page_title=str(chapter.get("title") or metadata["title"]),
                    toc_html=toc_html_all,
                    is_comic=is_comic,
                    protect_content=protect_content,
                    protect_options=options,
                ).encode("utf-8"),
            )
        index_parts: list[str] = []
        if include_intro:
            index_parts.append(f'<section class="intro">{render_export_intro_html(metadata)}</section>')
        elif cover_only_html:
            index_parts.append(f'<section class="intro intro-cover-only">{cover_only_html}</section>')
        if include_toc:
            index_parts.append(f'<section class="toc">{toc_html_all}</section>')
        if not index_parts:
            first_href = chapter_pages[0][1] if chapter_pages else ""
            quick_link = (
                f'<p><a class="export-nav-link" href="{html.escape(first_href)}">Mở chương đầu</a></p>'
                if first_href
                else ""
            )
            index_parts.append(
                f'<section class="intro"><h1>{html.escape(metadata["title"])}</h1>'
                '<p>File HTML này có trình đọc riêng với mục lục và tùy chỉnh hiển thị.</p>'
                f"{quick_link}</section>"
            )
        zf.writestr(
            "index.html",
            wrap_export_html_document(
                metadata["title"],
                "".join(index_parts),
                toc_html=toc_html_all,
                is_comic=is_comic,
                protect_content=protect_content,
                protect_options=options,
            ).encode("utf-8"),
        )
    return out


def create_export_cbz(
    *,
    export_dir: Path,
    safe_name: str,
    metadata: dict[str, str],
    chapters: list[dict[str, Any]],
) -> Path:
    _ = metadata
    ts = _utc_now_ts()
    out = export_dir / f"{safe_name}_{ts}.cbz"
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_STORED) as zf:
        for chapter in chapters:
            chapter_order = int(chapter.get("chapter_order") or 0)
            for image in chapter.get("images") or []:
                image_idx = int(image.get("index") or 0)
                ext = str(image.get("ext") or ".bin")
                filename = f"{chapter_order:04d}_{image_idx:04d}{ext}"
                zf.writestr(filename, bytes(image.get("data") or b""))
    return out


def create_export_epub(
    *,
    export_dir: Path,
    safe_name: str,
    metadata: dict[str, str],
    chapters: list[dict[str, Any]],
    options: dict[str, bool],
    is_comic: bool,
    language: str,
) -> Path:
    ts = _utc_now_ts()
    out = export_dir / f"{safe_name}_{ts}.epub"
    uid = hashlib.sha1(f"{metadata['title']}|{ts}".encode("utf-8", errors="ignore")).hexdigest()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    include_intro = bool(options.get("include_intro"))
    include_titles = bool(options.get("include_chapter_titles"))
    include_toc = bool(options.get("include_toc_page"))

    files: dict[str, bytes] = {}
    files["mimetype"] = b"application/epub+zip"
    files["META-INF/container.xml"] = (
        b'<?xml version="1.0" encoding="UTF-8"?>'
        b'<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
        b'<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>'
        b"</container>"
    )
    manifest_items = ['<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>']
    spine_items: list[str] = []
    nav_points: list[str] = []

    def add_xhtml(item_id: str, filename: str, title: str, body_html: str, play_order: int | None = None) -> None:
        files[f"OEBPS/Text/{filename}"] = (
            "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
            '<html xmlns="http://www.w3.org/1999/xhtml"><head>'
            f"<title>{html.escape(title)}</title>"
            '<meta charset="utf-8"/></head><body>'
            f"{body_html}</body></html>"
        ).encode("utf-8")
        manifest_items.append(f'<item id="{item_id}" href="Text/{filename}" media-type="application/xhtml+xml"/>')
        spine_items.append(f'<itemref idref="{item_id}"/>')
        if play_order is not None:
            nav_points.append(
                f'<navPoint id="navPoint-{play_order}" playOrder="{play_order}"><navLabel><text>{html.escape(title)}</text></navLabel><content src="Text/{filename}"/></navPoint>'
            )

    play_order = 1
    if include_intro:
        add_xhtml("intro", "intro.xhtml", "Giới thiệu", render_export_intro_html(metadata), play_order)
        play_order += 1
    if include_toc:
        add_xhtml(
            "tocpage",
            "toc.xhtml",
            "Mục lục",
            build_export_toc_html(chapters, link_builder=lambda chapter: f"chapter_{int(chapter.get('chapter_order') or 0)}.xhtml"),
            play_order,
        )
        play_order += 1

    for chapter in chapters:
        chapter_order = int(chapter.get("chapter_order") or 0)
        body_parts: list[str] = []
        if include_titles:
            body_parts.append(f"<h2>{html.escape(str(chapter.get('title') or ''))}</h2>")
        if is_comic:
            for image_idx, image in enumerate(chapter.get("images") or [], start=1):
                ext = str(image.get("ext") or ".bin")
                image_name = f"Images/{chapter_order:04d}_{image_idx:04d}{ext}"
                files[f"OEBPS/{image_name}"] = bytes(image.get("data") or b"")
                media_type = str(image.get("content_type") or "").split(";", 1)[0].strip() or (mimetypes.guess_type(image_name)[0] or "application/octet-stream")
                manifest_items.append(
                    f'<item id="img{chapter_order}_{image_idx}" href="{image_name}" media-type="{html.escape(media_type)}"/>'
                )
                body_parts.append(f'<p><img src="../{image_name}" alt="{html.escape(str(chapter.get("title") or ""))}"/></p>')
        else:
            text_value = text_paragraphs_support.strip_paragraph_indentation(str(chapter.get("text") or ""))
            for line in text_value.split("\n"):
                body_parts.append(f"<p>{html.escape(line)}</p>" if line.strip() else "<p><br/></p>")
        add_xhtml(
            f"chap{chapter_order}",
            f"chapter_{chapter_order}.xhtml",
            str(chapter.get("title") or metadata["title"]),
            "".join(body_parts),
            play_order,
        )
        play_order += 1

    if not spine_items:
        raise ValueError("Không có nội dung hợp lệ để xuất EPUB.")

    toc_ncx = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
        '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head>'
        f'<meta name="dtb:uid" content="{html.escape(uid)}"/>'
        '<meta name="dtb:depth" content="1"/><meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/>'
        f"</head><docTitle><text>{html.escape(metadata['title'])}</text></docTitle><navMap>{''.join(nav_points)}</navMap></ncx>"
    )
    content_opf = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
        '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">'
        '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
        f"<dc:title>{html.escape(metadata['title'])}</dc:title>"
        f"<dc:language>{html.escape(language)}</dc:language>"
        f"<dc:identifier id=\"BookId\">{html.escape(uid)}</dc:identifier>"
        f"<dc:creator>{html.escape(metadata.get('author') or '')}</dc:creator>"
        f"<dc:description>{html.escape(metadata.get('summary') or '')}</dc:description>"
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
