"""Reader version metadata, update status, and system notification payloads."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from reader_backend.core import notices as notices_support
from reader_backend.core import versioning as versioning_support


def _sha1_json(payload: dict[str, Any]) -> str:
    return hashlib.sha1(
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode(
            "utf-8",
            errors="ignore",
        )
    ).hexdigest()


def load_runtime_version_metadata(
    *,
    runtime_root: Path,
    root_dir: Path,
    service_version: str,
    ui_version: str,
    manifest_url: str,
) -> dict[str, Any]:
    version_data: dict[str, Any] = {}
    version_path = ""
    for candidate in (
        runtime_root / "local" / "version.json",
        runtime_root / "version.json",
        root_dir / "version.json",
    ):
        version_data = versioning_support.load_json_file_if_exists(candidate)
        if version_data:
            version_path = str(candidate)
            break
    reader_app = version_data.get("reader_app") if isinstance(version_data.get("reader_app"), dict) else {}
    server_meta = reader_app.get("server") if isinstance(reader_app.get("server"), dict) else {}
    ui_meta = reader_app.get("ui") if isinstance(reader_app.get("ui"), dict) else {}
    version_dir = Path(version_path).parent if version_path else None
    notice_base_dirs: list[Path] = []
    for candidate in (
        version_dir,
        runtime_root / "local",
        runtime_root / "reader_ui",
        runtime_root,
        root_dir / "reader_ui",
        root_dir,
    ):
        if candidate is None:
            continue
        try:
            resolved = candidate.resolve(strict=False)
        except Exception:
            resolved = candidate
        if resolved not in notice_base_dirs:
            notice_base_dirs.append(resolved)

    changelog_text = ""
    changelog_path = ""
    changelog_files = [
        str(version_data.get("reader_changelog_file") or "").strip(),
        str(reader_app.get("changelog_file") or "").strip(),
        str(version_data.get("notes_file_local") or "").strip(),
    ]
    for candidate in notices_support.build_notice_file_candidates(
        changelog_files,
        (
            "reader_changelog.txt",
            "reader_changelog.md",
            "reader_changelog.html",
            "update_notes.txt",
            "update_notes.md",
            "update_notes.html",
        ),
        notice_base_dirs,
    ):
        changelog_text = notices_support.read_notice_text_file_if_exists(candidate)
        if changelog_text:
            changelog_path = str(candidate)
            break

    guide_text = ""
    guide_path = ""
    guide_files = [
        str(version_data.get("reader_guide_file") or "").strip(),
        str(reader_app.get("guide_file") or "").strip(),
    ]
    for candidate in notices_support.build_notice_file_candidates(
        guide_files,
        (
            "reader_guide.txt",
            "reader_guide.md",
            "reader_guide.html",
            "hd.txt",
        ),
        notice_base_dirs,
    ):
        guide_text = notices_support.read_notice_text_file_if_exists(candidate)
        if guide_text:
            guide_path = str(candidate)
            break

    payload = {
        "app_version": str(version_data.get("version") or "").strip(),
        "reader_server_version": str(server_meta.get("version") or "").strip(),
        "reader_ui_version": str(ui_meta.get("version") or "").strip(),
        "local_reader_server_version": str(service_version or "").strip(),
        "local_reader_ui_version": str(ui_version or "").strip(),
        "reader_server_notes": str(server_meta.get("notes") or "").strip(),
        "reader_ui_notes": str(ui_meta.get("notes") or "").strip(),
        "update_notes": changelog_text,
        "guide_text": guide_text,
        "version_path": version_path,
        "notes_path": changelog_path,
        "guide_path": guide_path,
        "runtime_root": str(runtime_root),
        "service_version": str(service_version or "").strip(),
        "version_manifest_url": manifest_url,
    }
    payload["signature"] = _sha1_json(payload)
    return payload


def build_reader_update_status_payload(
    remote_manifest: dict[str, Any] | None,
    *,
    version_meta: dict[str, Any],
    remote_error: str = "",
    service_version: str,
    ui_version: str,
    manifest_url: str,
    utc_now_iso,
) -> dict[str, Any]:
    remote_data = dict(remote_manifest) if isinstance(remote_manifest, dict) else {}
    remote_reader_app = remote_data.get("reader_app") if isinstance(remote_data.get("reader_app"), dict) else {}
    remote_server_meta = remote_reader_app.get("server") if isinstance(remote_reader_app.get("server"), dict) else {}
    remote_ui_meta = remote_reader_app.get("ui") if isinstance(remote_reader_app.get("ui"), dict) else {}

    local_server_version = str(service_version or "").strip()
    local_ui_version = str(ui_version or "").strip()
    local_app_version = str(version_meta.get("app_version") or "").strip()
    local_manifest_server_version = str(version_meta.get("reader_server_version") or "").strip()
    local_manifest_ui_version = str(version_meta.get("reader_ui_version") or "").strip()

    remote_app_version = str(remote_data.get("version") or "").strip()
    remote_server_version = str(remote_server_meta.get("version") or "").strip()
    remote_ui_version = str(remote_ui_meta.get("version") or "").strip()
    remote_ok = bool(remote_data)

    update_parts: list[str] = []
    items: list[dict[str, Any]] = []

    server_update = versioning_support.is_remote_version_newer(remote_server_version, local_server_version)
    if server_update:
        update_parts.append("server")
    items.append(
        {
            "id": "server",
            "label": "Reader Server",
            "local_version": local_server_version,
            "remote_version": remote_server_version,
            "update_available": server_update,
        }
    )

    ui_update = versioning_support.is_remote_version_newer(remote_ui_version, local_ui_version)
    if ui_update:
        update_parts.append("ui")
    items.append(
        {
            "id": "ui",
            "label": "Reader UI",
            "local_version": local_ui_version,
            "remote_version": remote_ui_version,
            "update_available": ui_update,
        }
    )

    update_available = bool(update_parts)
    if len(update_parts) >= 2:
        preview = "Reader Server và Reader UI đã có bản mới."
    elif update_parts == ["server"]:
        preview = "Reader Server đã có bản mới."
    elif update_parts == ["ui"]:
        preview = "Reader UI đã có bản mới."
    elif remote_ok:
        preview = "Reader đang ở bản mới nhất."
    else:
        preview = "Chưa kiểm tra được phiên bản online."

    detail_lines = [
        "Đang dùng:",
        f"- Reader Server: {local_server_version or '?'}",
        f"- Reader UI: {local_ui_version or '?'}",
    ]
    if local_app_version:
        detail_lines.append(f"- Novel Studio: {local_app_version}")
    if remote_ok:
        detail_lines.extend(
            [
                "",
                "Bản mới nhất:",
                f"- Reader Server: {remote_server_version or '?'}",
                f"- Reader UI: {remote_ui_version or '?'}",
            ]
        )
        if remote_app_version:
            detail_lines.append(f"- Novel Studio: {remote_app_version}")
    else:
        detail_lines.extend(["", "Không đọc được version online lúc này."])
        if remote_error:
            detail_lines.append(f"Lý do: {remote_error}")
    if update_available:
        detail_lines.extend(
            [
                "",
                "Hãy mở tab Đọc truyện trong Novel Studio để cập nhật thủ công thành phần cần thiết.",
            ]
        )

    content_sig = _sha1_json(
        {
            "local_server_version": local_server_version,
            "local_ui_version": local_ui_version,
            "local_app_version": local_app_version,
            "remote_server_version": remote_server_version,
            "remote_ui_version": remote_ui_version,
            "remote_app_version": remote_app_version,
            "update_parts": update_parts,
            "remote_ok": remote_ok,
        }
    )

    return {
        "ok": True,
        "title": "Cập nhật Reader",
        "preview": preview,
        "detail": "\n".join(detail_lines).strip(),
        "update_available": update_available,
        "update_parts": update_parts,
        "items": items,
        "content_sig": content_sig,
        "checked_at": utc_now_iso(),
        "remote_ok": remote_ok,
        "remote_error": remote_error,
        "source_url": manifest_url,
        "local": {
            "app_version": local_app_version,
            "reader_server_version": local_server_version,
            "reader_ui_version": local_ui_version,
        },
        "local_manifest": {
            "app_version": local_app_version,
            "reader_server_version": local_manifest_server_version,
            "reader_ui_version": local_manifest_ui_version,
        },
        "remote": {
            "app_version": remote_app_version,
            "reader_server_version": remote_server_version,
            "reader_ui_version": remote_ui_version,
        },
    }


def build_system_changelog_notification_payload(version_meta: dict[str, Any]) -> dict[str, Any]:
    package_server_version = str(
        version_meta.get("local_reader_server_version") or version_meta.get("reader_server_version") or ""
    ).strip()
    package_ui_version = str(
        version_meta.get("local_reader_ui_version") or version_meta.get("reader_ui_version") or ""
    ).strip()
    app_version = str(version_meta.get("app_version") or "").strip()
    update_notes = str(version_meta.get("update_notes") or "").strip()
    preview = update_notes.splitlines()[0].strip() if update_notes else ""
    if not preview:
        preview = "Xem nhanh những thay đổi mới trong Reader."
    detail_lines: list[str] = []
    version_bits: list[str] = []
    if package_server_version:
        version_bits.append(f"Lõi đọc {package_server_version}")
    if package_ui_version:
        version_bits.append(f"Giao diện {package_ui_version}")
    if app_version:
        version_bits.append(f"Novel Studio {app_version}")
    if version_bits:
        detail_lines.append("Phiên bản hiện tại: " + " • ".join(version_bits))
    if update_notes:
        if detail_lines:
            detail_lines.append("")
        detail_lines.append(update_notes)
    else:
        if detail_lines:
            detail_lines.append("")
        detail_lines.append("Chưa có changelog đi kèm trong bản Reader hiện tại.")
    content_sig = _sha1_json(
        {
            "reader_server_version": package_server_version,
            "reader_ui_version": package_ui_version,
            "app_version": app_version,
            "detail": detail_lines,
        }
    )
    return {
        "id": "system:changelog",
        "kind": "system",
        "topic": "system",
        "topic_label": "Changelog",
        "title": "Changelog Reader",
        "preview": preview,
        "detail": "\n".join(detail_lines).strip(),
        "status": "info",
        "pinned": True,
        "pin_order": 0,
        "allow_delete": False,
        "allow_clear": False,
        "retain_days": 0,
        "meta": {
            "system_card": "changelog",
            "content_sig": content_sig,
            "reader_server_version": package_server_version,
            "reader_ui_version": package_ui_version,
            "app_version": app_version,
        },
    }


def build_system_guide_notification_payload(version_meta: dict[str, Any]) -> dict[str, Any]:
    guide_text = str(version_meta.get("guide_text") or "").strip()
    local_server_version = str(
        version_meta.get("local_reader_server_version") or version_meta.get("reader_server_version") or ""
    ).strip()
    local_ui_version = str(
        version_meta.get("local_reader_ui_version") or version_meta.get("reader_ui_version") or ""
    ).strip()
    app_version = str(version_meta.get("app_version") or "").strip()
    if not guide_text:
        guide_text = (
            "Hướng dẫn Reader đang được cập nhật.\n\n"
            "- Mở Trung tâm thông báo để xem changelog, hướng dẫn và tiến độ.\n"
            "- `Tiếp tục` dùng cho tiến trình còn làm dở.\n"
            "- `Thử lại` dùng để chạy lại bước cuối bị lỗi hoặc còn thiếu."
        )
    content_sig = _sha1_json(
        {
            "guide_text": guide_text,
            "reader_server_version": local_server_version,
            "reader_ui_version": local_ui_version,
            "app_version": app_version,
        }
    )
    return {
        "id": "system:guide",
        "kind": "system",
        "topic": "system",
        "topic_label": "Hướng dẫn",
        "title": "Hướng dẫn dùng Reader",
        "preview": "Tổng hợp cách dùng thư viện, đọc truyện, thông báo, nhập và xuất file.",
        "detail": guide_text,
        "status": "info",
        "pinned": True,
        "pin_order": 1,
        "allow_delete": False,
        "allow_clear": False,
        "retain_days": 0,
        "meta": {
            "system_card": "guide",
            "content_sig": content_sig,
        },
    }
