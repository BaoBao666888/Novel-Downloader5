"""Import job state and notification payload helpers."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any


def normalize_import_job_item(
    raw: dict[str, Any],
    *,
    fallback_idx: int,
    normalize_display_text: Callable[..., str],
    normalize_lang_source_fn: Callable[[str], str],
) -> dict[str, Any]:
    item = dict(raw or {})
    token = str(item.get("token") or "").strip()
    file_name = normalize_display_text(
        str(item.get("file_name") or f"import_{fallback_idx + 1}.txt"),
        single_line=True,
    ) or f"import_{fallback_idx + 1}.txt"
    status = str(item.get("status") or "pending").strip().lower() or "pending"
    if status not in {"pending", "running", "success", "failed"}:
        status = "pending"
    return {
        "token": token,
        "file_name": file_name,
        "title": str(item.get("title") or "").strip(),
        "author": str(item.get("author") or "").strip(),
        "summary": str(item.get("summary") or "").strip(),
        "lang_source": normalize_lang_source_fn(str(item.get("lang_source") or "").strip()) or "zh",
        "import_settings": dict(item.get("import_settings") or {}) if isinstance(item.get("import_settings"), dict) else {},
        "status": status,
        "error": str(item.get("error") or "").strip(),
        "book_id": str(item.get("book_id") or "").strip(),
        "book_title": normalize_display_text(str(item.get("book_title") or ""), single_line=True),
        "stage": normalize_display_text(str(item.get("stage") or ""), single_line=True),
        "detail": normalize_display_text(str(item.get("detail") or ""), single_line=True),
        "chapter_count": max(0, int(item.get("chapter_count") or 0)),
        "stage_updated_at": str(item.get("stage_updated_at") or "").strip(),
    }


def recount_import_job(
    job: dict[str, Any],
    *,
    normalize_display_text: Callable[..., str],
) -> None:
    items = [item for item in (job.get("items") or []) if isinstance(item, dict)]
    total = len(items)
    success_items = [item for item in items if str(item.get("status") or "").strip().lower() == "success"]
    failed_items = [item for item in items if str(item.get("status") or "").strip().lower() == "failed"]
    completed = len(success_items) + len(failed_items)
    job["total"] = total
    job["completed_count"] = completed
    job["success_count"] = len(success_items)
    job["failed_count"] = len(failed_items)
    imported_book_ids: list[str] = []
    imported_book_titles: list[str] = []
    seen_ids: set[str] = set()
    for item in success_items:
        book_id = str(item.get("book_id") or "").strip()
        book_title = normalize_display_text(str(item.get("book_title") or ""), single_line=True)
        if book_id and book_id not in seen_ids:
            seen_ids.add(book_id)
            imported_book_ids.append(book_id)
            if book_title:
                imported_book_titles.append(book_title)
    job["imported_book_ids"] = imported_book_ids
    job["imported_book_titles"] = imported_book_titles
    job["errors"] = [
        {
            "file_name": normalize_display_text(str(item.get("file_name") or ""), single_line=True) or "import.txt",
            "error": str(item.get("error") or "").strip() or "Nhập file thất bại.",
        }
        for item in failed_items
    ]
    running_item = next((item for item in items if str(item.get("status") or "").strip().lower() == "running"), None)
    if running_item:
        job["current_stage"] = normalize_display_text(str(running_item.get("stage") or ""), single_line=True)
        job["current_detail"] = normalize_display_text(str(running_item.get("detail") or ""), single_line=True)


def serialize_import_job(job: dict[str, Any]) -> dict[str, Any]:
    items = list(job.get("items") or []) if isinstance(job.get("items"), list) else []
    return {
        "job_id": str(job.get("job_id") or "").strip(),
        "notification_id": str(job.get("notification_id") or "").strip(),
        "status": str(job.get("status") or "").strip().lower(),
        "kind": str(job.get("kind") or "").strip(),
        "title": str(job.get("title") or "").strip(),
        "total": max(0, int(job.get("total") or len(items))),
        "completed": max(0, int(job.get("completed_count") or 0)),
        "success": max(0, int(job.get("success_count") or 0)),
        "failed": max(0, int(job.get("failed_count") or 0)),
        "current_file": str(job.get("current_file") or "").strip(),
        "current_stage": str(job.get("current_stage") or "").strip(),
        "current_detail": str(job.get("current_detail") or "").strip(),
        "created_at": str(job.get("created_at") or ""),
        "updated_at": str(job.get("updated_at") or ""),
    }


def build_import_job_enqueue_payload(
    payload: dict[str, Any] | None,
    *,
    normalize_item: Callable[..., dict[str, Any]],
    load_preview_state: Callable[[str], dict[str, Any]],
    list_categories: Callable[[], list[dict[str, Any]]],
    normalize_display_text: Callable[..., str],
    normalize_lang_source_fn: Callable[[str], str],
    utc_now_iso: Callable[[], str],
    hash_text: Callable[[str], str],
    uuid_hex: Callable[[], str],
    api_error_cls: type[Exception],
    http_status: Any,
) -> dict[str, Any]:
    body = payload if isinstance(payload, dict) else {}
    items_raw = body.get("items")
    if not isinstance(items_raw, list) or not items_raw:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu danh sách file để nhập.")
    normalized_items: list[dict[str, Any]] = []
    seen_tokens: set[str] = set()
    for idx, raw in enumerate(items_raw):
        if not isinstance(raw, dict):
            continue
        token = str(raw.get("token") or "").strip()
        if not token or token in seen_tokens:
            continue
        item = normalize_item(raw, fallback_idx=idx)
        try:
            preview_state = load_preview_state(token)
        except Exception:
            preview_state = {}
        if preview_state:
            if not str(item.get("file_name") or "").strip():
                item["file_name"] = normalize_display_text(
                    str(preview_state.get("file_name") or f"import_{idx + 1}.txt"),
                    single_line=True,
                ) or f"import_{idx + 1}.txt"
            if not str(item.get("title") or "").strip():
                item["title"] = str(preview_state.get("title") or "").strip()
            if not str(item.get("author") or "").strip():
                item["author"] = str(preview_state.get("author") or "").strip()
            if not str(item.get("summary") or "").strip():
                item["summary"] = str(preview_state.get("summary") or "").strip()
            if not str(item.get("lang_source") or "").strip():
                item["lang_source"] = normalize_lang_source_fn(str(preview_state.get("lang_source") or "").strip()) or "zh"
            if (not item.get("import_settings")) and isinstance(preview_state.get("import_settings"), dict):
                item["import_settings"] = dict(preview_state.get("import_settings") or {})
        normalized_items.append(item)
        seen_tokens.add(token)
    if not normalized_items:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Không có file hợp lệ để nhập.")

    valid_token_set = {
        str(item.get("token") or "").strip()
        for item in normalized_items
        if str(item.get("token") or "").strip()
    }
    run_tokens = [
        str(item or "").strip()
        for item in (body.get("run_tokens") or [])
        if str(item or "").strip() in valid_token_set
    ]
    if not run_tokens:
        run_tokens = [
            str(item.get("token") or "").strip()
            for item in normalized_items
            if str(item.get("status") or "").strip().lower() in {"pending", "running"}
        ]
    if not run_tokens:
        run_tokens = [str(item.get("token") or "").strip() for item in normalized_items if str(item.get("token") or "").strip()]

    category_ids = list(dict.fromkeys(
        str(item or "").strip()
        for item in (body.get("category_ids") or [])
        if str(item or "").strip()
    ))
    category_names: list[str] = []
    if category_ids:
        try:
            category_id_set = set(category_ids)
            category_names = [
                normalize_display_text(str(item.get("name") or ""), single_line=True)
                for item in list_categories()
                if str(item.get("category_id") or "").strip() in category_id_set
            ]
            category_names = [item for item in category_names if item]
        except Exception:
            category_names = []

    kind = str(body.get("kind") or "").strip() or ("import_file_batch" if len(normalized_items) > 1 else "import_file")
    title = str(body.get("title") or "").strip() or ("Nhập file hàng loạt vào thư viện" if len(normalized_items) > 1 else "Nhập file vào thư viện")
    now = utc_now_iso()
    seed = f"{title}|{len(normalized_items)}|{now}|{uuid_hex()}"
    job_id = f"imp_{hash_text(seed)}"
    notification_id = str(body.get("notification_id") or f"import:{job_id}").strip() or f"import:{job_id}"
    snapshot_id = str(body.get("snapshot_id") or notification_id).strip() or notification_id
    return {
        "job_id": job_id,
        "notification_id": notification_id,
        "snapshot_id": snapshot_id,
        "kind": kind,
        "title": title,
        "status": "queued",
        "phase": "queued",
        "items": normalized_items,
        "run_tokens": run_tokens,
        "total": 0,
        "completed_count": 0,
        "success_count": 0,
        "failed_count": 0,
        "current_file": "",
        "errors": [],
        "category_ids": category_ids,
        "category_names": category_names,
        "category_assign_error": "",
        "imported_book_ids": [],
        "imported_book_titles": [],
        "created_at": now,
        "updated_at": now,
        "finished_at": "",
    }


def build_import_notification_payload(
    job: dict[str, Any],
    *,
    notification_status_label: Callable[[str], str],
    normalize_display_text: Callable[..., str],
) -> dict[str, Any] | None:
    job_id = str(job.get("job_id") or "").strip()
    notification_id = str(job.get("notification_id") or "").strip()
    if not job_id or not notification_id:
        return None
    status = str(job.get("status") or "").strip().lower()
    phase = str(job.get("phase") or status or "").strip().lower()
    title = str(job.get("title") or "").strip() or "Nhập vào thư viện"
    total = max(0, int(job.get("total") or 0))
    success = max(0, int(job.get("success_count") or 0))
    failed = max(0, int(job.get("failed_count") or 0))
    completed = max(0, int(job.get("completed_count") or (success + failed)))
    completed = min(total or completed, completed)
    current_file = normalize_display_text(str(job.get("current_file") or ""), single_line=True)
    current_stage = normalize_display_text(str(job.get("current_stage") or ""), single_line=True)
    current_detail = normalize_display_text(str(job.get("current_detail") or ""), single_line=True)
    imported_book_ids = [
        str(item or "").strip()
        for item in (job.get("imported_book_ids") or [])
        if str(item or "").strip()
    ]
    imported_book_titles = [
        normalize_display_text(str(item or ""), single_line=True)
        for item in (job.get("imported_book_titles") or [])
        if str(item or "").strip()
    ]
    snapshot_id = str(job.get("snapshot_id") or "").strip()
    category_names = [
        normalize_display_text(str(item or ""), single_line=True)
        for item in (job.get("category_names") or [])
        if str(item or "").strip()
    ]
    category_ids = [
        str(item or "").strip()
        for item in (job.get("category_ids") or [])
        if str(item or "").strip()
    ]
    category_assign_error = str(job.get("category_assign_error") or "").strip()
    errors = list(job.get("errors") or []) if isinstance(job.get("errors"), list) else []
    item_rows = [item for item in (job.get("items") or []) if isinstance(item, dict)]
    pending_count = sum(
        1
        for item in item_rows
        if str(item.get("status") or "").strip().lower() in {"pending", "running"}
    )
    retry_count = sum(
        1
        for item in item_rows
        if str(item.get("status") or "").strip().lower() == "failed"
    )
    can_resume = bool(snapshot_id and pending_count > 0 and status in {"warning", "failed"})
    can_retry = bool(snapshot_id and (retry_count > 0 or (category_assign_error and imported_book_ids)))

    if status == "queued":
        preview = f"Đã tải lên xong, đang chờ nhập {completed}/{total} truyện."
    elif phase == "finishing":
        preview = f"Đang hoàn tất: thành công {success} • lỗi {failed}"
    elif status in {"completed", "warning", "failed"}:
        preview = f"Hoàn tất: thành công {success} • lỗi {failed}"
    elif current_file and current_stage:
        preview = f"{current_stage}: {current_file}"
    elif current_file:
        preview = f"Đang nhập: {current_file}"
    else:
        preview = f"Đã xử lý {completed}/{total} truyện • thành công {success} • lỗi {failed}"

    detail_lines = [
        f"Trạng thái: {notification_status_label(status)}",
        f"Đã xử lý: {completed}/{total}",
        f"Thành công: {success}",
        f"Thất bại: {failed}",
    ]
    if current_file:
        detail_lines.append(f"Đang xử lý: {current_file}")
    if current_stage:
        detail_lines.append(f"Bước hiện tại: {current_stage}")
    if current_detail:
        detail_lines.append(f"Chi tiết: {current_detail}")
    if category_names:
        detail_lines.append(f"Danh mục: {', '.join(category_names)}")
    if category_assign_error:
        detail_lines.append(f"Gán danh mục thất bại: {category_assign_error}")
    if imported_book_titles:
        detail_lines.append(f"Truyện đã nhập: {', '.join(imported_book_titles[:6])}")
        if len(imported_book_titles) > 6:
            detail_lines.append(f"... còn {len(imported_book_titles) - 6} truyện khác")
    if errors:
        detail_lines.append("")
        detail_lines.append("Các file lỗi:")
        for row in errors[:12]:
            file_name = normalize_display_text(str((row or {}).get("file_name") or ""), single_line=True) or "Không rõ file"
            message = normalize_display_text(str((row or {}).get("error") or ""), single_line=True) or "Lỗi không rõ"
            detail_lines.append(f"- {file_name}: {message}")
        if len(errors) > 12:
            detail_lines.append(f"- ... còn {len(errors) - 12} file lỗi khác")

    mapped_status = {
        "queued": "running",
        "running": "running",
        "importing": "running",
        "finishing": "running",
        "completed": "success",
        "failed": "failed",
        "warning": "warning",
    }.get(status, "info")
    primary_book_id = imported_book_ids[0] if len(imported_book_ids) == 1 else ""
    primary_book_title = imported_book_titles[0] if len(imported_book_titles) == 1 else ""
    return {
        "id": notification_id,
        "kind": str(job.get("kind") or "import_file").strip() or "import_file",
        "topic": "import",
        "topic_label": "Nhập vào thư viện",
        "title": title,
        "preview": preview,
        "detail": "\n".join(detail_lines).strip(),
        "status": mapped_status,
        "progress_current": completed,
        "progress_total": total,
        "progress_percent": (float(completed) / float(total) * 100.0) if total > 0 else 0.0,
        "book_id": primary_book_id,
        "book_title": primary_book_title,
        "job_id": job_id,
        "created_at": str(job.get("created_at") or ""),
        "updated_at": str(job.get("updated_at") or ""),
        "meta": {
            "phase": phase or status,
            "success_count": success,
            "failed_count": failed,
            "current_file": current_file,
            "current_stage": current_stage,
            "current_detail": current_detail,
            "book_ids_csv": ",".join(imported_book_ids),
            "snapshot_id": snapshot_id,
            "category_ids_csv": ",".join(category_ids),
            "category_names_csv": "||".join(category_names),
            "pending_count": pending_count,
            "retry_count": retry_count,
            "can_resume": can_resume,
            "can_retry": can_retry,
        },
    }
