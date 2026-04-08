from __future__ import annotations

import html
import json
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from reader_backend import text_paragraphs as text_paragraphs_support

_TRANS_SIG_SNAPSHOT_KEY_PREFIX = "reader.trans_sig_snapshot"


def chapter_text_cleanup(storage, text: str, *, apply_junk_lines_to_text) -> tuple[str, int, int]:
    lines, version = storage.get_global_junk_lines()
    cleaned, removed = apply_junk_lines_to_text(text, lines)
    return cleaned, removed, version


def chapter_trans_signature(base_sig: str, *, junk_version: int) -> str:
    normalized = str(base_sig or "").strip() or "raw"
    return f"{normalized}|junk:v{max(1, int(junk_version or 1))}"


def _count_cjk_chars(text: str) -> int:
    return sum(1 for ch in str(text or "") if "\u3400" <= ch <= "\u9fff")


def _trans_sig_snapshot_key(base_sig: str) -> str:
    sig = str(base_sig or "").strip()
    return f"{_TRANS_SIG_SNAPSHOT_KEY_PREFIX}.{sig}" if sig else _TRANS_SIG_SNAPSHOT_KEY_PREFIX


def _load_trans_sig_snapshot(storage, base_sig: str) -> dict[str, Any] | None:
    sig = str(base_sig or "").strip()
    if not sig:
        return None
    raw = storage._get_app_state_value(_trans_sig_snapshot_key(sig))
    if not raw:
        return None
    try:
        payload = json.loads(raw)
    except Exception:
        return None
    return payload if isinstance(payload, dict) else None


def _save_trans_sig_snapshot(storage, base_sig: str, payload: dict[str, Any] | None) -> None:
    sig = str(base_sig or "").strip()
    if not sig or not isinstance(payload, dict):
        return
    storage._set_app_state_value(
        _trans_sig_snapshot_key(sig),
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")),
    )


def _base_sig_from_chapter_trans_sig(sig: str) -> str:
    value = str(sig or "").strip()
    if not value:
        return ""
    return value.split("|junk:", 1)[0].strip()


def _junk_suffix_from_chapter_trans_sig(sig: str) -> str:
    value = str(sig or "").strip()
    if "|junk:" not in value:
        return ""
    return value.split("|junk:", 1)[1].strip()


def _looks_suspicious_server_translation(raw_text: str, translated_text: str) -> bool:
    source = str(raw_text or "").strip()
    translated = str(translated_text or "").strip()
    if not source or not translated:
        return False
    source_cjk = _count_cjk_chars(source)
    if source_cjk < 80:
        return False
    translated_cjk = _count_cjk_chars(translated)
    if translated == source:
        return True
    if translated_cjk < 80:
        return False
    return (translated_cjk / max(1, source_cjk)) >= 0.22


def save_epub_source(storage, book_id: str, content: bytes, *, cache_dir: Path, utc_now_iso) -> str:
    folder = cache_dir / "epub_sources"
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f"{book_id}.epub"
    path.write_bytes(content)
    with storage._connect() as conn:
        conn.execute(
            "UPDATE books SET source_file_path = ?, updated_at = ? WHERE book_id = ?",
            (str(path), utc_now_iso(), book_id),
        )
    return str(path)


def create_export_txt(
    storage,
    book_id: str,
    ensure_translated: bool,
    translator,
    translate_mode: str,
    *,
    use_cached_only: bool = False,
    export_dir: Path,
    utc_now_ts,
) -> Path:
    book = storage.find_book(book_id)
    if not book:
        raise ValueError("Không tìm thấy truyện.")
    if bool(book.get("is_comic")):
        raise ValueError("Truyện tranh không hỗ trợ xuất TXT.")
    # Keep legacy behavior: inspect actual source type rather than transformed UI fields.
    if str(book.get("source_type") or "").strip().lower() in {"comic", "vbook_comic", "vbook_session_comic"}:
        raise ValueError("Truyện tranh không hỗ trợ xuất TXT.")
    chapters = storage.get_chapter_rows(book_id)
    if not chapters:
        raise ValueError("Truyện chưa có chương.")
    _, active_name_set, _ = storage.get_active_name_set(
        default_sets={"Mặc định": {}},
        active_default="Mặc định",
        book_id=book_id,
    )
    active_vp_set, _ = storage.get_book_vp_set(book_id)

    output_lines: list[str] = []
    for chapter in chapters:
        if use_cached_only:
            raw_cached = storage.read_cache(str(chapter.get("raw_key") or "").strip())
            if raw_cached is None:
                continue
        title = chapter["title_vi"] or chapter["title_raw"] or f"Chương {chapter['chapter_order']}"
        text = storage.get_chapter_text(
            chapter,
            book,
            mode="trans" if ensure_translated else "raw",
            translator=translator,
            translate_mode=translate_mode,
            name_set_override=active_name_set,
            vp_set_override=active_vp_set,
            allow_remote_fetch=not use_cached_only,
        )
        text = text_paragraphs_support.strip_paragraph_indentation(text)
        output_lines.extend([title, "", text, ""])
    if not output_lines:
        raise ValueError("Không có chương đã cache để xuất TXT.")

    safe_name = storage._safe_filename(str(book.get("title") or "book"))
    ts = utc_now_ts()
    out = export_dir / f"{safe_name}_{ts}.txt"
    out.write_text("\n".join(output_lines), encoding="utf-8")
    return out


def create_export_epub(
    storage,
    book_id: str,
    ensure_translated: bool,
    translator,
    translate_mode: str,
    *,
    use_cached_only: bool = False,
    export_dir: Path,
    utc_now_ts,
) -> Path:
    book = storage.find_book(book_id)
    if not book:
        raise ValueError("Không tìm thấy truyện.")
    chapters = storage.get_chapter_rows(book_id)
    if not chapters:
        raise ValueError("Truyện chưa có chương.")
    _, active_name_set, _ = storage.get_active_name_set(
        default_sets={"Mặc định": {}},
        active_default="Mặc định",
        book_id=book_id,
    )
    active_vp_set, _ = storage.get_book_vp_set(book_id)

    safe_name = storage._safe_filename(str(book.get("title") or "book"))
    ts = utc_now_ts()
    out = export_dir / f"{safe_name}_{ts}.epub"

    uid = str(book["book_id"])
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    files: dict[str, bytes] = {}
    files["mimetype"] = b"application/epub+zip"
    files["META-INF/container.xml"] = (
        b'<?xml version="1.0" encoding="UTF-8"?><container version="1.0" '
        b'xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles>'
        b'<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>'
        b"</rootfiles></container>"
    )

    manifest_items = ['<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>']
    spine_items: list[str] = []
    nav_points: list[str] = []

    for idx, chapter in enumerate(chapters, start=1):
        if use_cached_only:
            raw_cached = storage.read_cache(str(chapter.get("raw_key") or "").strip())
            if raw_cached is None:
                continue
        title = chapter["title_vi"] or chapter["title_raw"] or f"Chương {idx}"
        text = storage.get_chapter_text(
            chapter,
            book,
            mode="trans" if ensure_translated else "raw",
            translator=translator,
            translate_mode=translate_mode,
            name_set_override=active_name_set,
            vp_set_override=active_vp_set,
            allow_remote_fetch=not use_cached_only,
        )
        text = text_paragraphs_support.strip_paragraph_indentation(text)
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
    if not spine_items:
        raise ValueError("Không có chương đã cache để xuất EPUB.")

    toc_ncx = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
        '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">'
        "<head>"
        f'<meta name="dtb:uid" content="{html.escape(uid)}"/>'
        '<meta name="dtb:depth" content="1"/><meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/>'
        "</head>"
        f"<docTitle><text>{html.escape(str(book.get('title') or ''))}</text></docTitle>"
        f"<navMap>{''.join(nav_points)}</navMap>"
        "</ncx>"
    )

    content_opf = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
        '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">'
        '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
        f"<dc:title>{html.escape(str(book.get('title') or ''))}</dc:title>"
        "<dc:language>vi</dc:language>"
        f"<dc:identifier id=\"BookId\">{html.escape(uid)}</dc:identifier>"
        f"<dc:creator>{html.escape(str(book.get('author') or ''))}</dc:creator>"
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
    storage,
    chapter: dict[str, Any],
    book: dict[str, Any],
    *,
    mode: str,
    translator,
    translate_mode: str,
    name_set_override: dict[str, str] | None = None,
    vp_set_override: dict[str, str] | None = None,
    allow_remote_fetch: bool = True,
    decode_comic_payload,
    encode_comic_payload,
    book_supports_translation,
    normalize_newlines,
    hash_text,
) -> str:
    raw_key = chapter.get("raw_key")
    cached_raw = storage.read_cache(raw_key) or ""
    if (
        allow_remote_fetch
        and (not cached_raw)
        and str(book.get("source_type") or "").startswith("vbook")
        and chapter.get("remote_url")
        and storage.remote_chapter_fetcher
    ):
        cached_raw = storage.remote_chapter_fetcher(chapter, book) or ""
    comic_payload = decode_comic_payload(cached_raw or "")
    if comic_payload is not None:
        return cached_raw or encode_comic_payload([])

    source_type = str(book.get("source_type") or "").strip().lower()
    normalize_import_text = source_type in {"txt", "epub"}
    raw_source_text = cached_raw or ""
    if normalize_import_text:
        raw_source_text = text_paragraphs_support.normalize_soft_wrapped_paragraphs(raw_source_text)
    raw_text, _, junk_version = storage.chapter_text_cleanup(raw_source_text)
    if not book_supports_translation(book):
        book_id = str(book.get("book_id") or chapter.get("book_id") or "").strip()
        if book_id:
            replace_entries, _ = storage.get_book_replace_entries(book_id)
            if replace_entries:
                raw_text, _ = storage.apply_text_replace_entries_to_text(raw_text, replace_entries)
        return raw_text
    if mode == "raw":
        return raw_text

    source_for_translation = raw_text

    base_sig = translator.translation_signature(
        mode=translate_mode,
        name_set_override=name_set_override,
        vp_set_override=vp_set_override,
    )
    current_payload = translator.translation_signature_payload(
        mode=translate_mode,
        name_set_override=name_set_override,
        vp_set_override=vp_set_override,
    )
    _save_trans_sig_snapshot(storage, base_sig, current_payload)
    current_sig = storage.chapter_trans_signature(base_sig, junk_version=junk_version)
    trans_key = chapter.get("trans_key")
    trans_sig = str(chapter.get("trans_sig") or "").strip()
    if trans_key and trans_sig == current_sig:
        cached = storage.read_cache(trans_key)
        if cached is not None:
            map_count = storage.get_translation_unit_map_count(chapter["chapter_id"], current_sig, translate_mode)
            if map_count > 0:
                cached_text = normalize_newlines(cached)
                if not (
                    str(translate_mode or "").strip().lower() == "server"
                    and _looks_suspicious_server_translation(source_for_translation, cached_text)
                ):
                    return cached_text

    if trans_key and trans_sig and trans_sig != current_sig and str(translate_mode or "").strip().lower() == "server":
        old_cached = storage.read_cache(trans_key)
        old_unit_map = storage.get_translation_unit_map(chapter["chapter_id"], trans_sig, translate_mode)
        old_base_sig = _base_sig_from_chapter_trans_sig(trans_sig)
        old_cached_normalized = normalize_newlines(old_cached or "")
        if (
            old_cached
            and old_unit_map
            and old_base_sig
            and _junk_suffix_from_chapter_trans_sig(trans_sig) == _junk_suffix_from_chapter_trans_sig(current_sig)
            and not _looks_suspicious_server_translation(source_for_translation, old_cached_normalized)
        ):
            old_payload = _load_trans_sig_snapshot(storage, old_base_sig)
            reused_detail = translator.translate_detailed_with_unit_reuse(
                source_for_translation,
                previous_translated_text=old_cached_normalized,
                previous_unit_map=old_unit_map,
                previous_name_set=(old_payload or {}).get("name_set") if isinstance(old_payload, dict) else None,
                mode=translate_mode,
                name_set_override=name_set_override,
                vp_set_override=vp_set_override,
            )
            if isinstance(reused_detail, dict):
                translated = normalize_newlines(reused_detail.get("translated") or "")
                if not translated:
                    translated = source_for_translation
                trans_seed = f"{chapter['chapter_id']}|{chapter['raw_key']}|{current_sig}|{translated}"
                new_key = f"tr_{hash_text(trans_seed)}"
                storage.write_cache(new_key, "vi", translated)
                storage.update_chapter_trans(chapter["chapter_id"], new_key, current_sig)
                storage.save_translation_unit_map(
                    chapter["chapter_id"],
                    current_sig,
                    translate_mode,
                    reused_detail.get("unit_map") if isinstance(reused_detail.get("unit_map"), list) else [],
                )
                chapter["trans_key"] = new_key
                chapter["trans_sig"] = current_sig
                return translated

    detail = translator.translate_detailed(
        source_for_translation,
        mode=translate_mode,
        name_set_override=name_set_override,
        vp_set_override=vp_set_override,
    )
    translated = normalize_newlines(detail.get("translated") or "")
    if not translated:
        translated = source_for_translation

    trans_seed = f"{chapter['chapter_id']}|{chapter['raw_key']}|{current_sig}|{translated}"
    new_key = f"tr_{hash_text(trans_seed)}"
    storage.write_cache(new_key, "vi", translated)
    storage.update_chapter_trans(chapter["chapter_id"], new_key, current_sig)
    storage.save_translation_unit_map(
        chapter["chapter_id"],
        current_sig,
        translate_mode,
        detail.get("unit_map") if isinstance(detail.get("unit_map"), list) else [],
    )
    chapter["trans_key"] = new_key
    chapter["trans_sig"] = current_sig
    return translated
