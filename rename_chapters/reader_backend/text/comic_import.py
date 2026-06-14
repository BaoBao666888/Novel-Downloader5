from __future__ import annotations

import html
import io
import posixpath
import re
import zipfile
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse
import xml.etree.ElementTree as ET


IMAGE_EXTENSIONS = {
    ".avif",
    ".bmp",
    ".gif",
    ".jpeg",
    ".jpg",
    ".png",
    ".webp",
}

IMAGE_MEDIA_TYPES = {
    "image/avif",
    "image/bmp",
    "image/gif",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


def is_comic_import_extension(filename: str) -> bool:
    suffix = Path(str(filename or "").lower()).suffix
    return suffix in IMAGE_EXTENSIONS or suffix in {".cbz", ".zip", ".epub"}


def is_image_filename(filename: str) -> bool:
    return Path(str(filename or "").lower()).suffix in IMAGE_EXTENSIONS


def _natural_key(value: str) -> list[Any]:
    parts = re.split(r"(\d+)", str(value or "").replace("\\", "/").casefold())
    return [int(part) if part.isdigit() else part for part in parts]


def _clean_zip_name(value: str) -> str:
    raw = str(value or "").replace("\\", "/").strip("/")
    return posixpath.normpath(raw).lstrip("./")


def _safe_title(value: str, fallback: str) -> str:
    text = html.unescape(str(value or "")).strip()
    text = re.sub(r"\s+", " ", text)
    return text or fallback


def _guess_title_from_path(path: str, fallback: str) -> str:
    stem = Path(str(path or "").replace("\\", "/")).stem
    return _safe_title(stem.replace("_", " "), fallback)


def _looks_page_like_title(value: str) -> bool:
    text = str(value or "").strip().casefold()
    if not text:
        return True
    return bool(re.fullmatch(r"(?:page|p|img|image|trang)?[\s._-]*\d{1,5}", text))


def _xml_local_name(tag: str) -> str:
    raw = str(tag or "")
    if "}" in raw:
        return raw.rsplit("}", 1)[-1]
    return raw


def _xml_text(root: ET.Element | None, local_names: set[str]) -> str:
    if root is None:
        return ""
    for node in root.iter():
        if _xml_local_name(node.tag).casefold() in local_names:
            text = "".join(node.itertext()).strip()
            if text:
                return _safe_title(text, "")
    return ""


def _read_epub_container_opf(zf: zipfile.ZipFile) -> str:
    try:
        raw = zf.read("META-INF/container.xml")
        root = ET.fromstring(raw)
        for node in root.iter():
            if _xml_local_name(node.tag).casefold() != "rootfile":
                continue
            full_path = str(node.attrib.get("full-path") or "").strip()
            if full_path:
                return _clean_zip_name(full_path)
    except Exception:
        pass
    for name in zf.namelist():
        if name.lower().endswith(".opf"):
            return _clean_zip_name(name)
    return ""


def _extract_html_title(data: bytes, fallback: str) -> str:
    text = data.decode("utf-8", "replace")
    match = re.search(r"<title[^>]*>(.*?)</title>", text, re.IGNORECASE | re.DOTALL)
    if match:
        cleaned = re.sub(r"<[^>]+>", "", match.group(1))
        return _safe_title(cleaned, fallback)
    for pattern in (
        r"<h1[^>]*>(.*?)</h1>",
        r"<h2[^>]*>(.*?)</h2>",
    ):
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            cleaned = re.sub(r"<[^>]+>", "", match.group(1))
            return _safe_title(cleaned, fallback)
    return fallback


def _html_image_refs(data: bytes) -> list[str]:
    text = data.decode("utf-8", "replace")
    refs: list[str] = []
    seen: set[str] = set()
    for match in re.finditer(r"""(?:src|href|xlink:href)\s*=\s*["']([^"']+)["']""", text, re.IGNORECASE):
        ref = html.unescape(match.group(1)).strip()
        if not ref or ref.startswith(("http://", "https://", "data:")):
            continue
        path = urlparse(ref).path
        if not path:
            continue
        normalized = unquote(path)
        if normalized and normalized not in seen:
            seen.add(normalized)
            refs.append(normalized)
    return refs


def _zip_image_entries(zf: zipfile.ZipFile) -> dict[str, zipfile.ZipInfo]:
    entries: dict[str, zipfile.ZipInfo] = {}
    for info in zf.infolist():
        if info.is_dir():
            continue
        name = _clean_zip_name(info.filename)
        if name.startswith("__MACOSX/"):
            continue
        if is_image_filename(name):
            entries[name] = info
    return entries


def _image_item_from_zip(zf: zipfile.ZipFile, info: zipfile.ZipInfo, *, source_path: str) -> dict[str, Any]:
    name = _clean_zip_name(source_path or info.filename)
    return {
        "name": name,
        "data": zf.read(info),
        "media_type": "",
        "source_path": name,
    }


def _group_archive_images(filename: str, zf: zipfile.ZipFile, image_entries: dict[str, zipfile.ZipInfo]) -> list[dict[str, Any]]:
    names = sorted(image_entries.keys(), key=_natural_key)
    root_images = [name for name in names if "/" not in name]
    top_groups: dict[str, list[str]] = {}
    for name in names:
        top = name.split("/", 1)[0] if "/" in name else ""
        if top:
            top_groups.setdefault(top, []).append(name)

    groups: list[tuple[str, list[str]]]
    if len(top_groups) > 1 and not root_images:
        groups = [
            (_guess_title_from_path(top, f"Chương {idx}"), sorted(items, key=_natural_key))
            for idx, (top, items) in enumerate(sorted(top_groups.items(), key=lambda item: _natural_key(item[0])), start=1)
        ]
    else:
        groups = [(_guess_title_from_path(filename, "Chương 1"), names)]

    chapters: list[dict[str, Any]] = []
    for index, (title, group_names) in enumerate(groups, start=1):
        images = [
            _image_item_from_zip(zf, image_entries[name], source_path=name)
            for name in group_names
            if name in image_entries
        ]
        if images:
            chapters.append({"title": title or f"Chương {index}", "images": images})
    return chapters


def _parse_epub_images(filename: str, file_bytes: bytes) -> tuple[dict[str, str], list[dict[str, Any]], dict[str, Any]]:
    diagnostics: dict[str, Any] = {"parser": "epub"}
    with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
        image_entries = _zip_image_entries(zf)
        opf_path = _read_epub_container_opf(zf)
        if not opf_path:
            diagnostics["fallback"] = "no_opf"
            return {}, _group_archive_images(filename, zf, image_entries), diagnostics
        opf_dir = posixpath.dirname(opf_path)
        try:
            opf_root = ET.fromstring(zf.read(opf_path))
        except Exception:
            diagnostics["fallback"] = "bad_opf"
            return {}, _group_archive_images(filename, zf, image_entries), diagnostics

        metadata = {
            "title": _xml_text(opf_root, {"title"}),
            "author": _xml_text(opf_root, {"creator"}),
            "summary": _xml_text(opf_root, {"description"}),
            "lang_source": _xml_text(opf_root, {"language"}),
        }
        manifest: dict[str, dict[str, str]] = {}
        spine_ids: list[str] = []
        for node in opf_root.iter():
            name = _xml_local_name(node.tag).casefold()
            if name == "item":
                item_id = str(node.attrib.get("id") or "").strip()
                href = str(node.attrib.get("href") or "").strip()
                if item_id and href:
                    path = _clean_zip_name(posixpath.normpath(posixpath.join(opf_dir, unquote(urlparse(href).path))))
                    manifest[item_id] = {
                        "path": path,
                        "media_type": str(node.attrib.get("media-type") or "").strip().lower(),
                        "properties": str(node.attrib.get("properties") or "").strip().lower(),
                    }
            elif name == "itemref":
                item_id = str(node.attrib.get("idref") or "").strip()
                if item_id:
                    spine_ids.append(item_id)

        chapters: list[dict[str, Any]] = []
        used_images: set[str] = set()
        for index, item_id in enumerate(spine_ids, start=1):
            item = manifest.get(item_id) or {}
            item_path = item.get("path") or ""
            media_type = str(item.get("media_type") or "").lower()
            if item_path in image_entries:
                refs = [item_path]
                title = _guess_title_from_path(item_path, f"Trang {index}")
            elif item_path and item_path in zf.namelist():
                try:
                    data = zf.read(item_path)
                except Exception:
                    data = b""
                title = _extract_html_title(data, _guess_title_from_path(item_path, f"Chương {index}"))
                base_dir = posixpath.dirname(item_path)
                refs = []
                for ref in _html_image_refs(data):
                    resolved = _clean_zip_name(posixpath.normpath(posixpath.join(base_dir, ref)))
                    if resolved in image_entries:
                        refs.append(resolved)
            elif media_type in IMAGE_MEDIA_TYPES and item_path in image_entries:
                refs = [item_path]
                title = _guess_title_from_path(item_path, f"Trang {index}")
            else:
                continue
            refs = list(dict.fromkeys(refs))
            images = []
            for ref in refs:
                info = image_entries.get(ref)
                if not info:
                    continue
                used_images.add(ref)
                images.append(_image_item_from_zip(zf, info, source_path=ref))
            if images:
                chapters.append({"title": title or f"Chương {index}", "images": images})

        if not chapters:
            diagnostics["fallback"] = "spine_no_images"
            return metadata, _group_archive_images(filename, zf, image_entries), diagnostics

        if len(chapters) > 1 and all(len(ch.get("images") or []) <= 2 and _looks_page_like_title(str(ch.get("title") or "")) for ch in chapters):
            all_images: list[dict[str, Any]] = []
            for chapter in chapters:
                all_images.extend(chapter.get("images") or [])
            chapters = [{"title": _safe_title(metadata.get("title") or "", _guess_title_from_path(filename, "Chương 1")), "images": all_images}]

        unused_images = [name for name in sorted(image_entries.keys(), key=_natural_key) if name not in used_images]
        diagnostics["unused_image_count"] = len(unused_images)
        diagnostics["spine_item_count"] = len(spine_ids)
        return metadata, chapters, diagnostics


def parse_comic_book(
    filename: str,
    file_bytes: bytes,
    *,
    custom_title: str = "",
    custom_author: str = "",
    custom_summary: str = "",
    lang_source: str = "zh",
) -> dict[str, Any]:
    safe_name = str(filename or "comic").strip() or "comic"
    ext = Path(safe_name.lower()).suffix
    if ext in IMAGE_EXTENSIONS:
        chapters = [
            {
                "title": _guess_title_from_path(safe_name, "Chương 1"),
                "images": [{"name": safe_name, "data": bytes(file_bytes or b""), "media_type": "", "source_path": safe_name}],
            }
        ]
        metadata = {}
        diagnostics = {"parser": "image"}
    elif ext == ".epub":
        metadata, chapters, diagnostics = _parse_epub_images(safe_name, bytes(file_bytes or b""))
    elif ext in {".cbz", ".zip"}:
        diagnostics = {"parser": "zip"}
        with zipfile.ZipFile(io.BytesIO(bytes(file_bytes or b""))) as zf:
            image_entries = _zip_image_entries(zf)
            chapters = _group_archive_images(safe_name, zf, image_entries)
        metadata = {}
    else:
        raise ValueError("File này không phải comic được hỗ trợ.")

    chapters = [chapter for chapter in chapters if isinstance(chapter, dict) and chapter.get("images")]
    if not chapters:
        raise ValueError("Không tìm thấy ảnh hợp lệ trong file comic.")

    title = _safe_title(metadata.get("title") or custom_title, _guess_title_from_path(safe_name, "Comic"))
    author = _safe_title(metadata.get("author") or custom_author, "")
    summary = _safe_title(metadata.get("summary") or custom_summary, "")
    source_lang = str(metadata.get("lang_source") or lang_source or "zh").strip().lower().replace("_", "-").split("-", 1)[0] or "zh"
    chapter_preview = []
    for index, chapter in enumerate(chapters, start=1):
        images = chapter.get("images") if isinstance(chapter.get("images"), list) else []
        first_image = images[0] if images else {}
        chapter_preview.append(
            {
                "index": index,
                "title": _safe_title(chapter.get("title"), f"Chương {index}"),
                "word_count": len(images),
                "image_count": len(images),
                "preview": str((first_image or {}).get("source_path") or (first_image or {}).get("name") or "").strip(),
            }
        )

    cover_item = None
    for chapter in chapters:
        images = chapter.get("images") if isinstance(chapter.get("images"), list) else []
        if images:
            cover_item = images[0]
            break

    return {
        "file_name": safe_name,
        "file_ext": ext.lstrip(".") or "comic",
        "source_type": "comic",
        "metadata": {
            "title": title,
            "author": author,
            "summary": summary,
            "lang_source": source_lang,
            "chapter_count": len(chapters),
            "has_cover": bool(cover_item),
            "detected_lang": source_lang,
            "image_count": sum(len(ch.get("images") or []) for ch in chapters),
        },
        "chapters": chapters,
        "chapter_preview": chapter_preview,
        "cover_bytes": bytes((cover_item or {}).get("data") or b"") if cover_item else b"",
        "cover_name": str((cover_item or {}).get("name") or "cover.jpg") if cover_item else "",
        "diagnostics": diagnostics,
    }
