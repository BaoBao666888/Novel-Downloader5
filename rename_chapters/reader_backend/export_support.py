from __future__ import annotations

import base64
import hashlib
import html
import mimetypes
import zipfile
from collections.abc import Callable
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def _normalize_newlines(text: str) -> str:
    return str(text or "").replace("\r\n", "\n").replace("\r", "\n")


def _utc_now_ts() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def render_export_intro_html(metadata: dict[str, str]) -> str:
    parts = [f"<h1>{html.escape(metadata['title'])}</h1>"]
    if metadata.get("author"):
        parts.append(f"<p><strong>Tác giả:</strong> {html.escape(metadata['author'])}</p>")
    if metadata.get("summary"):
        summary_html = "".join(
            f"<p>{html.escape(line)}</p>" if line.strip() else "<p><br/></p>"
            for line in _normalize_newlines(metadata["summary"]).split("\n")
        )
        parts.append(summary_html)
    return "".join(parts)


def build_export_format_specs(*, is_comic: bool, translation_supported: bool) -> dict[str, Any]:
    def opt(key: str, label: str, default_enabled: bool) -> dict[str, Any]:
        return {
            "key": key,
            "label": label,
            "default_enabled": bool(default_enabled),
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
) -> dict[str, bool]:
    format_spec = None
    for row in specs.get("formats") or []:
        if str((row or {}).get("id") or "").strip().lower() == fmt:
            format_spec = row
            break
    if not format_spec:
        raise ValueError("Định dạng export không hợp lệ.")
    options = dict(raw_options or {}) if isinstance(raw_options, dict) else {}
    normalized: dict[str, bool] = {}
    for item in format_spec.get("options") or []:
        key = str((item or {}).get("key") or "").strip()
        if not key:
            continue
        if key in options:
            normalized[key] = bool(options.get(key))
        else:
            normalized[key] = bool(item.get("default_enabled"))
    for key in (
        "include_intro",
        "merge_single_file",
        "include_chapter_titles",
        "include_toc_page",
        "use_translated_text",
    ):
        normalized.setdefault(key, False)
    normalized["use_cached_only"] = True
    if is_comic or (not translation_supported):
        normalized["use_translated_text"] = False
    return normalized


def resolve_export_metadata(
    *,
    book: dict[str, Any],
    raw_metadata: dict[str, Any] | None,
    normalize_text: Callable[[str, bool], str],
) -> dict[str, str]:
    metadata = dict(raw_metadata or {}) if isinstance(raw_metadata, dict) else {}
    title = normalize_text(str(metadata.get("title") or book.get("title") or ""), True) or "Untitled"
    author = normalize_text(str(metadata.get("author") or book.get("author") or ""), True)
    summary = normalize_text(str(metadata.get("summary") or book.get("summary") or ""), False)
    return {
        "title": title,
        "author": author,
        "summary": summary,
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


def build_export_toc_html(
    chapters: list[dict[str, Any]],
    *,
    link_builder: Callable[[dict[str, Any]], str],
) -> str:
    lines = ["<h2>Mục lục</h2>", "<ol>"]
    for chapter in chapters:
        title = html.escape(str(chapter.get("title") or chapter.get("title_raw") or ""))
        link = html.escape(link_builder(chapter))
        lines.append(f'<li><a href="{link}">{title}</a></li>')
    lines.append("</ol>")
    return "".join(lines)


def wrap_export_html_document(title: str, body: str) -> str:
    return (
        "<!doctype html>"
        '<html lang="vi"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        f"<title>{html.escape(title)}</title>"
        "<style>"
        "body{font-family:'Noto Serif','Times New Roman',serif;max-width:960px;margin:0 auto;padding:28px 18px;line-height:1.9;background:#fff;color:#111;}"
        "img{display:block;max-width:100%;height:auto;margin:0 auto;}"
        "h1,h2,h3{line-height:1.35;}"
        ".chapter{margin:28px 0 40px;}"
        ".chapter-title{margin:0 0 16px;}"
        ".toc ol{padding-left:22px;}"
        ".intro,.toc{margin-bottom:32px;padding-bottom:16px;border-bottom:1px solid #ddd;}"
        "p{margin:0 0 1em;white-space:pre-wrap;}"
        "</style></head><body>"
        f"{body}</body></html>"
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
    _ = metadata
    ts = _utc_now_ts()
    include_titles = bool(options.get("include_chapter_titles"))
    merge_single = bool(options.get("merge_single_file"))
    if merge_single:
        out = export_dir / f"{safe_name}_{ts}.txt"
        lines: list[str] = []
        for chapter in chapters:
            if include_titles:
                lines.extend([str(chapter.get("title") or ""), ""])
            lines.append(str(chapter.get("text") or ""))
            lines.append("")
        if not lines:
            raise ValueError("Không có chương hợp lệ để xuất TXT.")
        out.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")
        return out

    out = export_dir / f"{safe_name}_{ts}.zip"
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for chapter in chapters:
            chapter_order = int(chapter.get("chapter_order") or 0)
            chapter_title = safe_filename(str(chapter.get("title") or chapter.get("title_raw") or f"Chapter_{chapter_order}"))
            filename = f"{chapter_order:04d}_{chapter_title}.txt"
            text_value = str(chapter.get("text") or "")
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

    def _chapter_section(chapter: dict[str, Any], *, inline_images: bool) -> str:
        chapter_id = f"chap-{int(chapter.get('chapter_order') or 0)}"
        parts = [f'<section class="chapter" id="{chapter_id}">']
        if include_titles:
            parts.append(f'<h2 class="chapter-title">{html.escape(str(chapter.get("title") or ""))}</h2>')
        if is_comic:
            for image_idx, image in enumerate(chapter.get("images") or [], start=1):
                data = bytes(image.get("data") or b"")
                ctype = str(image.get("content_type") or "application/octet-stream")
                if inline_images:
                    encoded = base64.b64encode(data).decode("ascii")
                    src = f"data:{ctype};base64,{encoded}"
                else:
                    src = html.escape(str(image.get("href") or ""))
                alt = html.escape(f"{chapter.get('title') or 'Chương'} #{image_idx}")
                parts.append(f'<p><img src="{src}" alt="{alt}"></p>')
        else:
            text_value = str(chapter.get("text") or "")
            for line in text_value.split("\n"):
                parts.append(f"<p>{html.escape(line)}</p>" if line.strip() else "<p><br/></p>")
        parts.append("</section>")
        return "".join(parts)

    if merge_single:
        out = export_dir / f"{safe_name}_{ts}.html"
        body_parts: list[str] = []
        if include_intro:
            body_parts.append(f'<section class="intro">{render_export_intro_html(metadata)}</section>')
        if include_toc:
            toc_html = build_export_toc_html(
                chapters,
                link_builder=lambda chapter: f"#chap-{int(chapter.get('chapter_order') or 0)}",
            )
            body_parts.append(f'<section class="toc">{toc_html}</section>')
        for chapter in chapters:
            body_parts.append(_chapter_section(chapter, inline_images=is_comic))
        out.write_text(
            wrap_export_html_document(metadata["title"], "".join(body_parts)),
            encoding="utf-8",
        )
        return out

    out = export_dir / f"{safe_name}_{ts}.zip"
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        chapter_links: dict[str, str] = {}
        for chapter in chapters:
            chapter_order = int(chapter.get("chapter_order") or 0)
            chapter_slug = safe_filename(str(chapter.get("title") or chapter.get("title_raw") or f"Chapter_{chapter_order}"))
            html_name = f"chapter_{chapter_order:04d}_{chapter_slug}.html"
            chapter_links[str(chapter.get("chapter_id") or chapter_order)] = html_name
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
            zf.writestr(
                html_name,
                wrap_export_html_document(
                    str(chapter.get("title") or metadata["title"]),
                    _chapter_section(chapter_copy, inline_images=False),
                ).encode("utf-8"),
            )
        if include_intro or include_toc:
            index_parts: list[str] = []
            if include_intro:
                index_parts.append(f'<section class="intro">{render_export_intro_html(metadata)}</section>')
            if include_toc:
                toc_html = build_export_toc_html(
                    chapters,
                    link_builder=lambda chapter: chapter_links.get(
                        str(chapter.get("chapter_id") or chapter.get("chapter_order") or ""),
                        "#",
                    ),
                )
                index_parts.append(f'<section class="toc">{toc_html}</section>')
            zf.writestr(
                "index.html",
                wrap_export_html_document(metadata["title"], "".join(index_parts)).encode("utf-8"),
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
            for line in str(chapter.get("text") or "").split("\n"):
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
