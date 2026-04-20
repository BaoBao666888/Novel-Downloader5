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
    filename: str,
    file_bytes: bytes,
    *,
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
    normalize_vbook_display_text,
) -> dict[str, Any]:
    bid = str(book_id or "").strip()
    if not bid:
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
    book = service.storage.find_book(bid)
    if not book:
        raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
    if bool(book.get("is_comic")):
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Truyện tranh chưa hỗ trợ bổ sung TXT.")
    safe_name = str(filename or "").strip() or "supplement.txt"
    suffix = Path(safe_name).suffix.lower()
    if suffix != ".txt":
        raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Hiện chỉ hỗ trợ bổ sung file TXT.")

    cleanup_import_previews(import_preview_dir=import_preview_dir)
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
    else:
        new_volume_title = str(new_volume_title or "").strip()
        if not new_volume_title:
            raise ApiError(HTTPStatus.BAD_REQUEST, "BAD_REQUEST", "Thiếu tên quyển mới.")

    token = uuid.uuid4().hex
    folder = import_preview_dir_for_token(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    folder.mkdir(parents=True, exist_ok=True)
    source_name = f"source{suffix or '.txt'}"
    (folder / source_name).write_bytes(bytes(file_bytes or b""))
    save_import_preview_state(
        token,
        {
            "token": token,
            "kind": "book_supplement",
            "book_id": bid,
            "file_name": safe_name,
            "source_name": source_name,
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
    target_mode: str = "",
    volume_id: str = "",
    new_volume_title: str = "",
    note: str = "",
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
    source_path = folder / str(state.get("source_name") or "")
    if not source_path.exists():
        raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không còn file nguồn cho phiên bổ sung này.")
    file_bytes = source_path.read_bytes()
    book = service.storage.find_book(bid)
    if not book:
        raise ApiError(HTTPStatus.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
    parsed = parse_local_import_payload(
        service,
        str(state.get("file_name") or "supplement.txt"),
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
    result = service.storage.append_book_supplement(
        bid,
        [dict(item or {}) for item in (parsed.get("chapters") or []) if isinstance(item, dict)],
        file_name=str(state.get("file_name") or "supplement.txt"),
        target_mode=_normalize_supplement_target_mode(target_mode or state.get("target_mode") or "existing"),
        volume_id=str(volume_id or state.get("volume_id") or "").strip(),
        new_volume_title=str(new_volume_title or state.get("new_volume_title") or "").strip(),
        note=str(note or state.get("note") or "").strip(),
    )
    remove_import_preview_state(
        token,
        import_preview_dir=import_preview_dir,
        ApiError=ApiError,
        HTTPStatus=HTTPStatus,
    )
    return result
