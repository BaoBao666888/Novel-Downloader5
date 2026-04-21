from __future__ import annotations

import json
import re
import time
import uuid
from pathlib import Path
from typing import Any


def import_preview_root(*, import_preview_dir: Path) -> Path:
    import_preview_dir.mkdir(parents=True, exist_ok=True)
    return import_preview_dir


def cleanup_import_previews(*, import_preview_dir: Path, max_age_hours: int = 24) -> None:
    root = import_preview_root(import_preview_dir=import_preview_dir)
    cutoff = time.time() - max(1, int(max_age_hours)) * 3600
    for child in root.iterdir():
        try:
            if child.stat().st_mtime >= cutoff:
                continue
            if child.is_dir():
                for nested in child.iterdir():
                    try:
                        nested.unlink()
                    except Exception:
                        pass
                child.rmdir()
            else:
                child.unlink()
        except Exception:
            continue


def import_preview_dir_for_token(token: str, *, import_preview_dir: Path, ApiError, HTTPStatus) -> Path:
    safe = re.sub(r"[^a-zA-Z0-9_-]", "", str(token or ""))
    if not safe:
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Token preview import không hợp lệ.")
    return import_preview_root(import_preview_dir=import_preview_dir) / safe


def save_import_preview_state(
    token: str,
    state: dict[str, Any],
    *,
    import_preview_dir: Path,
    ApiError,
    HTTPStatus,
) -> dict[str, Any]:
    folder = import_preview_dir_for_token(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "state.json").write_text(
        json.dumps(state or {}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return state


def load_import_preview_state(token: str, *, import_preview_dir: Path, ApiError, HTTPStatus) -> dict[str, Any]:
    folder = import_preview_dir_for_token(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    path = folder / "state.json"
    if not path.exists():
        raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy phiên chuẩn bị import.")
    try:
        parsed = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ApiError(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            "BAD_IMPORT_PREVIEW",
            "Không đọc được phiên chuẩn bị import.",
            str(exc),
        ) from exc
    if not isinstance(parsed, dict):
        raise ApiError(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            "BAD_IMPORT_PREVIEW",
            "Dữ liệu preview import không hợp lệ.",
        )
    return parsed


def remove_import_preview_state(token: str, *, import_preview_dir: Path, ApiError, HTTPStatus) -> None:
    folder = import_preview_dir_for_token(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    if not folder.exists():
        return
    for item in folder.iterdir():
        try:
            item.unlink()
        except Exception:
            pass
    try:
        folder.rmdir()
    except Exception:
        pass


def merge_reader_import_settings(service, override: dict[str, Any] | None = None, *, normalize_reader_import_settings) -> dict[str, Any]:
    base = normalize_reader_import_settings(service.reader_import_settings)
    if not isinstance(override, dict):
        return base
    merged = {
        "txt": dict(base.get("txt") or {}),
        "epub": dict(base.get("epub") or {}),
    }
    for section in ("txt", "epub"):
        raw_section = override.get(section)
        if isinstance(raw_section, dict):
            merged[section].update(raw_section)
    return normalize_reader_import_settings(merged)


def parse_local_import_payload(
    service,
    filename: str,
    file_bytes: bytes,
    *,
    lang_source: str,
    title: str,
    author: str,
    summary: str = "",
    import_settings: dict[str, Any] | None = None,
    normalize_reader_import_settings,
    normalize_lang_source,
    parse_epub_book,
    parse_txt_book,
    normalize_vbook_display_text,
) -> dict[str, Any]:
    name = filename or "imported"
    ext = name.lower().rsplit(".", 1)[-1] if "." in name else "txt"
    settings = merge_reader_import_settings(
        service,
        import_settings,
        normalize_reader_import_settings=normalize_reader_import_settings,
    )
    lang = normalize_lang_source(lang_source) or "zh"

    if ext == "epub":
        parsed = parse_epub_book(
            file_bytes,
            custom_title=title,
            custom_author=author,
            custom_summary=summary,
            parser_settings=settings.get("epub"),
            lang_source=lang,
        )
    elif ext == "txt":
        parsed = parse_txt_book(
            name,
            file_bytes,
            lang_source=lang,
            custom_title=title,
            custom_author=author,
            custom_summary=summary,
            parser_settings=settings.get("txt"),
        )
    else:
        raise ValueError("V1 chỉ hỗ trợ import TXT và EPUB.")

    metadata = parsed.get("metadata") if isinstance(parsed.get("metadata"), dict) else {}
    chapters = parsed.get("chapters") if isinstance(parsed.get("chapters"), list) else []
    if not chapters:
        raise ValueError("Không có chương hợp lệ để import.")

    chapter_preview = []
    for idx, chapter in enumerate(chapters, start=1):
        if not isinstance(chapter, dict):
            continue
        raw_title = str(chapter.get("title") or f"Chương {idx}").strip() or f"Chương {idx}"
        raw_text = str(chapter.get("text") or "")
        chapter_preview.append(
            {
                "index": idx,
                "title": raw_title,
                "word_count": len(raw_text),
                "preview": normalize_vbook_display_text(raw_text[:140], single_line=False),
            }
        )

    return {
        "file_name": name,
        "file_ext": ext,
        "source_type": str(parsed.get("source_type") or ext),
        "metadata": {
            "title": str(metadata.get("title") or title or "").strip() or "Untitled",
            "author": str(metadata.get("author") or author or "").strip(),
            "summary": str(metadata.get("summary") or summary or "").strip(),
            "lang_source": normalize_lang_source(metadata.get("lang_source") or lang) or lang,
            "chapter_count": len(chapter_preview),
            "has_cover": bool(metadata.get("has_cover")),
            "detected_lang": normalize_lang_source(metadata.get("detected_lang") or ""),
        },
        "chapters": [dict(item or {}) for item in chapters if isinstance(item, dict)],
        "chapter_preview": chapter_preview,
        "cover_bytes": parsed.get("cover_bytes") if isinstance(parsed.get("cover_bytes"), (bytes, bytearray)) else b"",
        "cover_name": str(parsed.get("cover_name") or ""),
        "diagnostics": dict(parsed.get("diagnostics") or {}),
        "import_settings": settings,
    }


def create_book_from_local_import(service, parsed: dict[str, Any], file_bytes: bytes, *, normalize_lang_source) -> dict[str, Any]:
    metadata = parsed.get("metadata") if isinstance(parsed.get("metadata"), dict) else {}
    chapters = parsed.get("chapters") if isinstance(parsed.get("chapters"), list) else []
    created = service.storage.create_book(
        title=str(metadata.get("title") or "Untitled").strip() or "Untitled",
        author=str(metadata.get("author") or "").strip(),
        lang_source=normalize_lang_source(metadata.get("lang_source") or "") or "zh",
        source_type=str(parsed.get("source_type") or "txt").strip() or "txt",
        summary=str(metadata.get("summary") or "").strip(),
        chapters=[dict(item or {}) for item in chapters if isinstance(item, dict)],
    )
    book_id = str((created or {}).get("book_id") or "").strip()
    if not book_id:
        return created

    if str(parsed.get("source_type") or "") == "epub":
        service.storage.save_epub_source(book_id, file_bytes)
        created["epub_url"] = f"/media/epub/{book_id}.epub"

    cover_bytes = parsed.get("cover_bytes")
    if isinstance(cover_bytes, (bytes, bytearray)) and cover_bytes:
        try:
            updated = service.storage.set_book_cover_upload(
                book_id,
                str(parsed.get("cover_name") or "cover.jpg"),
                bytes(cover_bytes),
            )
            if updated:
                created = updated
                if str(parsed.get("source_type") or "") == "epub":
                    created["epub_url"] = f"/media/epub/{book_id}.epub"
        except Exception:
            pass
    return created


def _build_local_import_preview(parsed: dict[str, Any], *, import_settings_presets) -> dict[str, Any]:
    return {
        "file_name": parsed.get("file_name"),
        "file_ext": parsed.get("file_ext"),
        "source_type": parsed.get("source_type"),
        "metadata": parsed.get("metadata"),
        "chapters": parsed.get("chapter_preview"),
        "diagnostics": parsed.get("diagnostics"),
        "import_settings": parsed.get("import_settings"),
        "presets": import_settings_presets(),
    }


def prepare_import_file(
    service,
    filename: str,
    file_bytes: bytes,
    lang_source: str,
    title: str,
    author: str,
    summary: str = "",
    import_settings: dict[str, Any] | None = None,
    *,
    import_preview_dir: Path,
    ApiError,
    HTTPStatus,
    utc_now_iso,
    import_settings_presets,
    normalize_reader_import_settings,
    normalize_lang_source,
    parse_epub_book,
    parse_txt_book,
    normalize_vbook_display_text,
) -> dict[str, Any]:
    cleanup_import_previews(import_preview_dir=import_preview_dir)
    parsed = parse_local_import_payload(
        service,
        filename,
        file_bytes,
        lang_source=lang_source,
        title=title,
        author=author,
        summary=summary,
        import_settings=import_settings,
        normalize_reader_import_settings=normalize_reader_import_settings,
        normalize_lang_source=normalize_lang_source,
        parse_epub_book=parse_epub_book,
        parse_txt_book=parse_txt_book,
        normalize_vbook_display_text=normalize_vbook_display_text,
    )
    token = uuid.uuid4().hex
    folder = import_preview_dir_for_token(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    folder.mkdir(parents=True, exist_ok=True)
    suffix = Path(filename or "import.txt").suffix or ".txt"
    source_name = f"source{suffix}"
    (folder / source_name).write_bytes(file_bytes)
    save_import_preview_state(
        token,
        {
            "token": token,
            "file_name": filename or "imported",
            "source_name": source_name,
            "lang_source": str(parsed["metadata"]["lang_source"]),
            "title": str(parsed["metadata"]["title"] or ""),
            "author": str(parsed["metadata"]["author"] or ""),
            "summary": str(parsed["metadata"]["summary"] or ""),
            "import_settings": parsed.get("import_settings") or service.reader_import_settings,
            "created_at": utc_now_iso(),
        },
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    return {
        "ok": True,
        "token": token,
        "preview": _build_local_import_preview(
            parsed,
            import_settings_presets=import_settings_presets,
        ),
    }


def create_upload_import_token(
    filename: str,
    file_bytes: bytes,
    *,
    import_preview_dir: Path,
    ApiError,
    HTTPStatus,
    utc_now_iso,
) -> dict[str, Any]:
    cleanup_import_previews(import_preview_dir=import_preview_dir)
    safe_name = str(filename or "").strip() or "import.txt"
    suffix = Path(safe_name).suffix or ".txt"
    token = uuid.uuid4().hex
    folder = import_preview_dir_for_token(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    folder.mkdir(parents=True, exist_ok=True)
    source_name = f"source{suffix}"
    payload = bytes(file_bytes or b"")
    (folder / source_name).write_bytes(payload)
    save_import_preview_state(
        token,
        {
            "token": token,
            "kind": "upload_file",
            "file_name": safe_name,
            "source_name": source_name,
            "created_at": utc_now_iso(),
            "updated_at": utc_now_iso(),
            "size_bytes": len(payload),
        },
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    return {
        "ok": True,
        "token": token,
        "file_name": safe_name,
        "file_ext": suffix.lstrip(".").lower(),
        "size_bytes": len(payload),
    }


def preview_import_token(
    service,
    token: str,
    *,
    lang_source: str = "",
    title: str = "",
    author: str = "",
    summary: str = "",
    import_settings: dict[str, Any] | None = None,
    import_preview_dir: Path,
    ApiError,
    HTTPStatus,
    utc_now_iso,
    import_settings_presets,
    normalize_reader_import_settings,
    normalize_lang_source,
    parse_epub_book,
    parse_txt_book,
    normalize_vbook_display_text,
) -> dict[str, Any]:
    state = load_import_preview_state(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    folder = import_preview_dir_for_token(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    source_path = folder / str(state.get("source_name") or "")
    if not source_path.exists():
        raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không còn file nguồn cho phiên import này.")
    file_bytes = source_path.read_bytes()
    parsed = parse_local_import_payload(
        service,
        str(state.get("file_name") or "imported"),
        file_bytes,
        lang_source=lang_source or str(state.get("lang_source") or ""),
        title=title or str(state.get("title") or ""),
        author=author or str(state.get("author") or ""),
        summary=summary or str(state.get("summary") or ""),
        import_settings=import_settings if isinstance(import_settings, dict) else state.get("import_settings"),
        normalize_reader_import_settings=normalize_reader_import_settings,
        normalize_lang_source=normalize_lang_source,
        parse_epub_book=parse_epub_book,
        parse_txt_book=parse_txt_book,
        normalize_vbook_display_text=normalize_vbook_display_text,
    )
    state["lang_source"] = str(parsed["metadata"]["lang_source"])
    state["title"] = str(parsed["metadata"]["title"] or "")
    state["author"] = str(parsed["metadata"]["author"] or "")
    state["summary"] = str(parsed["metadata"]["summary"] or "")
    state["import_settings"] = parsed.get("import_settings") or state.get("import_settings") or {}
    state["updated_at"] = utc_now_iso()
    save_import_preview_state(
        token,
        state,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    return {
        "ok": True,
        "token": token,
        "preview": _build_local_import_preview(
            parsed,
            import_settings_presets=import_settings_presets,
        ),
    }


def commit_import_token(
    service,
    token: str,
    *,
    lang_source: str = "",
    title: str = "",
    author: str = "",
    summary: str = "",
    import_settings: dict[str, Any] | None = None,
    import_preview_dir: Path,
    ApiError,
    HTTPStatus,
    normalize_reader_import_settings,
    normalize_lang_source,
    parse_epub_book,
    parse_txt_book,
    normalize_vbook_display_text,
) -> dict[str, Any]:
    state = load_import_preview_state(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    folder = import_preview_dir_for_token(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    source_path = folder / str(state.get("source_name") or "")
    if not source_path.exists():
        raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không còn file nguồn cho phiên import này.")
    file_bytes = source_path.read_bytes()
    parsed = parse_local_import_payload(
        service,
        str(state.get("file_name") or "imported"),
        file_bytes,
        lang_source=lang_source or str(state.get("lang_source") or ""),
        title=title or str(state.get("title") or ""),
        author=author or str(state.get("author") or ""),
        summary=summary or str(state.get("summary") or ""),
        import_settings=import_settings if isinstance(import_settings, dict) else state.get("import_settings"),
        normalize_reader_import_settings=normalize_reader_import_settings,
        normalize_lang_source=normalize_lang_source,
        parse_epub_book=parse_epub_book,
        parse_txt_book=parse_txt_book,
        normalize_vbook_display_text=normalize_vbook_display_text,
    )
    created = create_book_from_local_import(
        service,
        parsed,
        file_bytes,
        normalize_lang_source=normalize_lang_source,
    )
    remove_import_preview_state(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    return created


def import_file(
    service,
    filename: str,
    file_bytes: bytes,
    lang_source: str,
    title: str,
    author: str,
    *,
    summary: str = "",
    import_settings: dict[str, Any] | None = None,
    normalize_reader_import_settings,
    normalize_lang_source,
    parse_epub_book,
    parse_txt_book,
    normalize_vbook_display_text,
) -> dict[str, Any]:
    parsed = parse_local_import_payload(
        service,
        filename,
        file_bytes,
        lang_source=lang_source,
        title=title,
        author=author,
        summary=summary,
        import_settings=import_settings,
        normalize_reader_import_settings=normalize_reader_import_settings,
        normalize_lang_source=normalize_lang_source,
        parse_epub_book=parse_epub_book,
        parse_txt_book=parse_txt_book,
        normalize_vbook_display_text=normalize_vbook_display_text,
    )
    return create_book_from_local_import(
        service,
        parsed,
        file_bytes,
        normalize_lang_source=normalize_lang_source,
    )


def _normalize_supplement_target_mode(value: str) -> str:
    mode = str(value or "existing").strip().lower()
    return "new" if mode == "new" else "existing"


def _normalize_supplement_upload_mode(value: str, *, file_count: int = 1) -> str:
    mode = str(value or "").strip().lower()
    if mode == "multi" or int(file_count or 0) > 1:
        return "multi"
    return "single"


def _normalize_supplement_multi_parse_mode(value: str) -> str:
    mode = str(value or "").strip().lower()
    return "position" if mode == "position" else "server"


def _parse_local_cjk_number(raw: str) -> int | None:
    text = str(raw or "").strip()
    if not text:
        return None
    if text.isdigit():
        try:
            return int(text)
        except Exception:
            return None
    digits = {
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
    units = {"十": 10, "百": 100, "千": 1000, "万": 10000}
    total = 0
    section = 0
    number = 0
    used = False
    for ch in text:
        if ch in digits:
            number = digits[ch]
            used = True
            continue
        unit = units.get(ch)
        if unit is None:
            return None
        if unit == 10000:
            total += (section + number) * unit
            section = 0
            number = 0
            used = True
            continue
        if number == 0:
            number = 1
        section += number * unit
        number = 0
        used = True
    result = total + section + number
    if result > 0:
        return result
    if used and text in {"零", "〇"}:
        return 0
    return None


_SUPPLEMENT_PARSE_PATTERNS = (
    re.compile(r"^\s*第\s*([0-9一二三四五六七八九十百千零两兩]+)\s*[章节卷回集部篇]\s*[-—:：._、| )）]*(.*)$", re.IGNORECASE),
    re.compile(r"^\s*(?:chương|chuong|chapter|chap|c|q|quyển|quyen)\s*(\d{1,5})\s*[-—:：._、| )）]*(.*)$", re.IGNORECASE),
    re.compile(r"^\s*(\d{1,5})(?:(?:[\.\-、:： )）]\s*)|\s+)(.*)$", re.IGNORECASE),
)


def _parse_supplement_heading(text: str) -> tuple[int | None, str]:
    raw = str(text or "").strip()
    if not raw:
        return None, ""
    for pattern in _SUPPLEMENT_PARSE_PATTERNS:
        match = pattern.match(raw)
        if not match:
            continue
        number_raw = str(match.group(1) or "").strip()
        title_tail = str(match.group(2) or "").strip()
        number = int(number_raw) if number_raw.isdigit() else _parse_local_cjk_number(number_raw)
        if number is None:
            continue
        return number, title_tail
    return None, raw


def _decode_supplement_text(file_bytes: bytes, *, decode_text_with_fallback) -> str:
    return str(decode_text_with_fallback(file_bytes or b"") or "").replace("\r\n", "\n").replace("\r", "\n")


def _supplement_first_nonempty_line(text: str, *, normalize_vbook_display_text) -> str:
    for raw_line in str(text or "").split("\n"):
        line = normalize_vbook_display_text(raw_line, single_line=True)
        if line:
            return line
    return ""


def _strip_supplement_title_line(text: str, *, normalize_vbook_display_text) -> str:
    lines = str(text or "").split("\n")
    for index, raw_line in enumerate(lines):
        if normalize_vbook_display_text(raw_line, single_line=True):
            trimmed = "\n".join(lines[index + 1:]).strip()
            if trimmed:
                return trimmed
            break
    return str(text or "").strip()


def _build_multi_file_supplement_payload(
    files: list[tuple[str, bytes]],
    *,
    parse_mode: str,
    decode_text_with_fallback,
    normalize_vbook_display_text,
) -> dict[str, Any]:
    mode_key = _normalize_supplement_multi_parse_mode(parse_mode)
    rows: list[dict[str, Any]] = []
    filename_hits = 0
    content_hits = 0
    numbered_hits = 0
    for index, (filename, file_bytes) in enumerate(files, start=1):
        safe_name = str(filename or f"chapter_{index}.txt").strip() or f"chapter_{index}.txt"
        full_text = _decode_supplement_text(file_bytes, decode_text_with_fallback=decode_text_with_fallback)
        first_line = _supplement_first_nonempty_line(full_text, normalize_vbook_display_text=normalize_vbook_display_text)
        filename_stem = normalize_vbook_display_text(Path(safe_name).stem, single_line=True) or Path(safe_name).stem
        body_text = str(full_text or "").strip()
        sort_number = None
        parse_source = "position"
        title_value = first_line or filename_stem or f"Chương {index}"

        if mode_key == "position":
            title_value = first_line or filename_stem or f"Chương {index}"
            body_text = _strip_supplement_title_line(full_text, normalize_vbook_display_text=normalize_vbook_display_text)
        else:
            file_num, _ = _parse_supplement_heading(filename_stem)
            content_num, _ = _parse_supplement_heading(first_line)
            if file_num is not None:
                sort_number = file_num
                title_value = filename_stem or first_line or f"Chương {file_num}"
                parse_source = "filename"
                filename_hits += 1
            elif content_num is not None:
                sort_number = content_num
                title_value = first_line or filename_stem or f"Chương {content_num}"
                parse_source = "content"
                content_hits += 1
            else:
                title_value = first_line or filename_stem or f"Chương {index}"
                parse_source = "fallback"
            if sort_number is not None:
                numbered_hits += 1
            if first_line and normalize_vbook_display_text(title_value, single_line=True) == normalize_vbook_display_text(first_line, single_line=True):
                body_text = _strip_supplement_title_line(full_text, normalize_vbook_display_text=normalize_vbook_display_text)

        normalized_title = normalize_vbook_display_text(title_value, single_line=True) or f"Chương {index}"
        normalized_body = str(body_text or "").strip() or str(full_text or "").strip()
        rows.append(
            {
                "order_index": index,
                "sort_number": sort_number,
                "title": normalized_title,
                "text": normalized_body,
                "file_name": safe_name,
                "parse_source": parse_source,
                "word_count": len(normalized_body),
                "preview": normalize_vbook_display_text(normalized_body[:140], single_line=False),
            }
        )

    if mode_key == "server":
        rows.sort(key=lambda item: (0 if item.get("sort_number") is not None else 1, int(item.get("sort_number") or 0), int(item.get("order_index") or 0)))

    chapter_preview = []
    chapters = []
    for index, row in enumerate(rows, start=1):
        title = str(row.get("title") or f"Chương {index}").strip() or f"Chương {index}"
        text = str(row.get("text") or "").strip()
        if not text:
            continue
        chapters.append({"title": title, "text": text})
        chapter_preview.append(
            {
                "index": index,
                "title": title,
                "word_count": int(row.get("word_count") or len(text)),
                "preview": str(row.get("preview") or "").strip(),
                "file_name": str(row.get("file_name") or "").strip(),
                "parse_source": str(row.get("parse_source") or "").strip(),
                "chapter_number": row.get("sort_number"),
            }
        )

    if not chapters:
        raise ValueError("Không đọc được nội dung hợp lệ từ các file TXT đã chọn.")

    return {
        "file_name": f"{len(files)} file TXT",
        "file_ext": "txt",
        "source_type": "supplement_txt_multi",
        "metadata": {
            "chapter_count": len(chapter_preview),
            "file_count": len(files),
            "upload_mode": "multi",
            "parse_mode": mode_key,
            "detected_lang": "",
        },
        "chapters": chapters,
        "chapter_preview": chapter_preview,
        "diagnostics": {
            "parse_mode": mode_key,
            "file_count": len(files),
            "numbered_hits": numbered_hits,
            "filename_hits": filename_hits,
            "content_hits": content_hits,
        },
    }


def _load_book_supplement_context(
    service,
    book_id: str,
    *,
    target_mode: str,
    volume_id: str,
    new_volume_title: str,
    ApiError,
    HTTPStatus,
) -> tuple[dict[str, Any], list[dict[str, Any]], str, str, str]:
    bid = str(book_id or "").strip()
    if not bid:
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
    book = service.storage.find_book(bid)
    if not book:
        raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
    if bool(book.get("is_comic")):
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Truyện tranh chưa hỗ trợ bổ sung TXT.")

    volumes_payload = service.storage.list_chapters_paged(
        bid,
        page=1,
        page_size=1,
        mode="raw",
        translator=service.translator,
        translate_mode=service.resolve_translate_mode("server"),
    )
    volume_rows = [dict(item or {}) for item in (volumes_payload.get("volumes") or []) if isinstance(item, dict)]
    target_mode_key = _normalize_supplement_target_mode(target_mode)
    target_volume_id = str(volume_id or "").strip()
    volume_title = str(new_volume_title or "").strip()
    if target_mode_key == "existing":
        selected_volume = None
        for item in volume_rows:
            if target_volume_id and str(item.get("volume_id") or "").strip() != target_volume_id:
                continue
            policy = dict(item.get("policy") or {}) if isinstance(item.get("policy"), dict) else {}
            if policy.get("can_append"):
                selected_volume = item
                break
        if selected_volume is None:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Quyển đã chọn không cho phép bổ sung.")
        target_volume_id = str(selected_volume.get("volume_id") or "").strip()
        volume_title = str(selected_volume.get("title_display") or selected_volume.get("title_raw") or "").strip()
    else:
        if not volume_title:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu tên quyển mới.")
    return book, volume_rows, target_mode_key, target_volume_id, volume_title


def _book_supplement_preview_payload(
    book: dict[str, Any],
    parsed: dict[str, Any],
    *,
    target_mode: str,
    volume_id: str,
    new_volume_title: str,
    note: str,
    volumes: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    metadata = parsed.get("metadata") if isinstance(parsed.get("metadata"), dict) else {}
    chapter_preview = parsed.get("chapter_preview") if isinstance(parsed.get("chapter_preview"), list) else []
    volume_rows = [dict(item or {}) for item in (volumes or []) if isinstance(item, dict)]
    selected_volume = None
    if target_mode == "existing":
        for item in volume_rows:
            if str(item.get("volume_id") or "").strip() == str(volume_id or "").strip():
                selected_volume = item
                break
    target_volume_title = (
        str((selected_volume or {}).get("title_display") or (selected_volume or {}).get("title_raw") or "").strip()
        if target_mode == "existing"
        else str(new_volume_title or "").strip()
    )
    return {
        "file_name": parsed.get("file_name"),
        "file_ext": parsed.get("file_ext"),
        "source_type": "supplement_txt",
        "metadata": {
            "title": str(book.get("title_display") or book.get("title") or "").strip(),
            "author": str(book.get("author_display") or book.get("author") or "").strip(),
            "summary": str(note or "").strip(),
            "lang_source": str(book.get("lang_source") or metadata.get("lang_source") or "zh").strip() or "zh",
            "chapter_count": len(chapter_preview),
            "file_count": int(metadata.get("file_count") or 1),
            "upload_mode": str(metadata.get("upload_mode") or "single").strip() or "single",
            "parse_mode": str(metadata.get("parse_mode") or "single").strip() or "single",
            "detected_lang": str(metadata.get("detected_lang") or "").strip(),
        },
        "chapters": chapter_preview,
        "diagnostics": parsed.get("diagnostics") if isinstance(parsed.get("diagnostics"), dict) else {},
        "target": {
            "mode": target_mode,
            "volume_id": str(volume_id or "").strip(),
            "volume_title": target_volume_title,
            "new_volume_title": str(new_volume_title or "").strip(),
            "note": str(note or "").strip(),
        },
        "volumes": volume_rows,
    }


def prepare_book_supplement_file(
    service,
    book_id: str,
    files: list[tuple[str, bytes]],
    *,
    upload_mode: str = "",
    multi_parse_mode: str = "",
    target_mode: str = "existing",
    volume_id: str = "",
    new_volume_title: str = "",
    note: str = "",
    import_preview_dir: Path,
    ApiError,
    HTTPStatus,
    utc_now_iso,
    normalize_reader_import_settings,
    normalize_lang_source,
    parse_epub_book,
    parse_txt_book,
    decode_text_with_fallback,
    normalize_vbook_display_text,
) -> dict[str, Any]:
    bid = str(book_id or "").strip()
    source_files: list[tuple[str, bytes]] = []
    for index, item in enumerate(files or [], start=1):
        try:
            filename, file_bytes = item
        except Exception:
            continue
        safe_name = str(filename or f"supplement_{index}.txt").strip() or f"supplement_{index}.txt"
        if Path(safe_name).suffix.lower() != ".txt":
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Hiện chỉ hỗ trợ bổ sung file TXT.")
        source_files.append((safe_name, bytes(file_bytes or b"")))
    if not source_files:
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu file TXT để bổ sung.")

    cleanup_import_previews(import_preview_dir=import_preview_dir)
    book, volume_rows, target_mode_key, target_volume_id, _ = _load_book_supplement_context(
        service,
        bid,
        target_mode=target_mode,
        volume_id=volume_id,
        new_volume_title=new_volume_title,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    upload_mode_key = _normalize_supplement_upload_mode(upload_mode, file_count=len(source_files))
    parse_mode_key = _normalize_supplement_multi_parse_mode(multi_parse_mode)

    if upload_mode_key == "single":
        safe_name, file_bytes = source_files[0]
        parsed = parse_local_import_payload(
            service,
            safe_name,
            file_bytes,
            lang_source=str(book.get("lang_source") or "zh").strip() or "zh",
            title=str(book.get("title") or "").strip(),
            author=str(book.get("author") or "").strip(),
            summary="",
            import_settings=None,
            normalize_reader_import_settings=normalize_reader_import_settings,
            normalize_lang_source=normalize_lang_source,
            parse_epub_book=parse_epub_book,
            parse_txt_book=parse_txt_book,
            normalize_vbook_display_text=normalize_vbook_display_text,
        )
        parsed_metadata = dict(parsed.get("metadata") or {})
        parsed_metadata["file_count"] = 1
        parsed_metadata["upload_mode"] = "single"
        parsed_metadata["parse_mode"] = "single"
        parsed["metadata"] = parsed_metadata
    else:
        parsed = _build_multi_file_supplement_payload(
            source_files,
            parse_mode=parse_mode_key,
            decode_text_with_fallback=decode_text_with_fallback,
            normalize_vbook_display_text=normalize_vbook_display_text,
        )

    token = uuid.uuid4().hex
    folder = import_preview_dir_for_token(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    folder.mkdir(parents=True, exist_ok=True)
    saved_sources: list[dict[str, Any]] = []
    for index, (file_name, file_bytes) in enumerate(source_files, start=1):
        source_name = f"source_{index:04d}.txt"
        (folder / source_name).write_bytes(bytes(file_bytes or b""))
        saved_sources.append(
            {
                "source_name": source_name,
                "file_name": file_name,
                "order_index": index,
            }
        )
    save_import_preview_state(
        token,
        {
            "token": token,
            "kind": "book_supplement",
            "book_id": bid,
            "file_name": str(parsed.get("file_name") or (source_files[0][0] if source_files else "supplement.txt")).strip() or "supplement.txt",
            "source_name": str(saved_sources[0]["source_name"]) if saved_sources else "",
            "source_files": saved_sources,
            "upload_mode": upload_mode_key,
            "multi_parse_mode": parse_mode_key,
            "target_mode": target_mode_key,
            "volume_id": target_volume_id,
            "new_volume_title": str(new_volume_title or "").strip(),
            "note": str(note or "").strip(),
            "created_at": utc_now_iso(),
            "updated_at": utc_now_iso(),
        },
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    return {
        "ok": True,
        "token": token,
        "preview": _book_supplement_preview_payload(
            book,
            parsed,
            target_mode=target_mode_key,
            volume_id=target_volume_id,
            new_volume_title=new_volume_title,
            note=note,
            volumes=volume_rows,
        ),
    }


def commit_book_supplement_token(
    service,
    token: str,
    *,
    book_id: str,
    upload_mode: str = "",
    multi_parse_mode: str = "",
    target_mode: str = "",
    volume_id: str = "",
    new_volume_title: str = "",
    note: str = "",
    import_preview_dir: Path,
    supplement_source_dir: Path,
    ApiError,
    HTTPStatus,
    normalize_reader_import_settings,
    normalize_lang_source,
    parse_epub_book,
    parse_txt_book,
    decode_text_with_fallback,
    normalize_vbook_display_text,
) -> dict[str, Any]:
    state = load_import_preview_state(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    if str(state.get("kind") or "").strip() != "book_supplement":
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Token này không phải phiên bổ sung chương.")
    bid = str(book_id or state.get("book_id") or "").strip()
    if not bid:
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
    if bid != str(state.get("book_id") or "").strip():
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Token bổ sung không thuộc truyện hiện tại.")
    folder = import_preview_dir_for_token(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    saved_sources = state.get("source_files") if isinstance(state.get("source_files"), list) else []
    if not saved_sources and str(state.get("source_name") or "").strip():
        saved_sources = [
            {
                "source_name": str(state.get("source_name") or "").strip(),
                "file_name": str(state.get("file_name") or "supplement.txt").strip() or "supplement.txt",
                "order_index": 1,
            }
        ]
    source_files: list[tuple[str, bytes]] = []
    for index, item in enumerate(saved_sources, start=1):
        if not isinstance(item, dict):
            continue
        source_name = str(item.get("source_name") or "").strip()
        if not source_name:
            continue
        source_path = folder / source_name
        if not source_path.exists():
            raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không còn file nguồn cho phiên bổ sung này.")
        file_name = str(item.get("file_name") or f"supplement_{index}.txt").strip() or f"supplement_{index}.txt"
        source_files.append((file_name, source_path.read_bytes()))
    if not source_files:
        raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không còn file nguồn cho phiên bổ sung này.")
    book = service.storage.find_book(bid)
    if not book:
        raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
    upload_mode_key = _normalize_supplement_upload_mode(upload_mode or state.get("upload_mode") or "", file_count=len(source_files))
    parse_mode_key = _normalize_supplement_multi_parse_mode(multi_parse_mode or state.get("multi_parse_mode") or "")
    if upload_mode_key == "single":
        parsed = parse_local_import_payload(
            service,
            source_files[0][0],
            source_files[0][1],
            lang_source=str(book.get("lang_source") or "zh").strip() or "zh",
            title=str(book.get("title") or "").strip(),
            author=str(book.get("author") or "").strip(),
            summary="",
            import_settings=None,
            normalize_reader_import_settings=normalize_reader_import_settings,
            normalize_lang_source=normalize_lang_source,
            parse_epub_book=parse_epub_book,
            parse_txt_book=parse_txt_book,
            normalize_vbook_display_text=normalize_vbook_display_text,
        )
    else:
        parsed = _build_multi_file_supplement_payload(
            source_files,
            parse_mode=parse_mode_key,
            decode_text_with_fallback=decode_text_with_fallback,
            normalize_vbook_display_text=normalize_vbook_display_text,
        )
    result = service.storage.append_book_supplement(
        bid,
        [dict(item or {}) for item in (parsed.get("chapters") or []) if isinstance(item, dict)],
        file_name=str(state.get("file_name") or "supplement.txt"),
        file_mode=upload_mode_key,
        parse_mode=parse_mode_key,
        target_mode=_normalize_supplement_target_mode(target_mode or state.get("target_mode") or "existing"),
        volume_id=str(volume_id or state.get("volume_id") or "").strip(),
        new_volume_title=str(new_volume_title or state.get("new_volume_title") or "").strip(),
        note=str(note or state.get("note") or "").strip(),
        source_files=source_files,
        source_store_dir=supplement_source_dir,
    )
    remove_import_preview_state(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    return result
