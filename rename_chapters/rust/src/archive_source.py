"""Inspect, preview, and safely extract ZIP archives without dropping valid '...' filenames."""

import json
import os
from pathlib import Path, PurePosixPath
import sys
import zipfile

MAX_EXTRACT_BYTES = 2 * 1024 * 1024 * 1024  # 2 GiB zip-bomb guard
PREVIEW_BYTE_LIMIT = 16 * 1024


def decode_member_name(info):
    name = info.filename
    # If UTF-8 flag (bit 11) is not set, ZIP headers from Chinese Windows tools
    # often store GBK/GB18030 bytes decoded as cp437 by Python's zipfile.
    if not (info.flag_bits & 0x800):
        try:
            raw = name.encode("cp437")
            for enc in ("utf-8", "gb18030"):
                try:
                    return raw.decode(enc)
                except UnicodeDecodeError:
                    continue
        except UnicodeEncodeError:
            pass
    return name


def sanitize_relative_path(raw_name):
    normalized = raw_name.replace("\\", "/")
    if normalized.startswith("/") or (len(normalized) >= 2 and normalized[1] == ":"):
        return None, "Đường dẫn tuyệt đối không được phép"
    parts = [part for part in normalized.split("/") if part not in ("", ".")]
    if not parts:
        return None, "Tên mục rỗng"
    for part in parts:
        # Block path traversal segment '..' while allowing valid names containing '...'
        if part == ".." or "\x00" in part:
            return None, "Chứa đoạn đường dẫn '..' không an toàn"
    return PurePosixPath(*parts).as_posix(), None


def decode_text_preview(raw_bytes):
    if raw_bytes.startswith(b"\xef\xbb\xbf"):
        return raw_bytes[3:].decode("utf-8", errors="replace"), "utf-8-sig"
    if raw_bytes.startswith((b"\xff\xfe", b"\xfe\xff")):
        return raw_bytes.decode("utf-16", errors="replace"), "utf-16"
    for enc in ("utf-8", "gb18030", "cp1252"):
        try:
            return raw_bytes.decode(enc), enc
        except UnicodeDecodeError:
            continue
    return raw_bytes.decode("utf-8", errors="replace"), "utf-8-lossy"


def inspect_archive(req):
    archive_path = Path(req["archive"])
    if not archive_path.is_file():
        return {"status": "error", "message": "Không tìm thấy tệp nén .zip."}
    entries = []
    total_size = 0
    try:
        with zipfile.ZipFile(archive_path, "r") as zf:
            for idx, info in enumerate(zf.infolist()):
                if info.is_dir():
                    continue
                decoded = decode_member_name(info)
                safe_rel, reason = sanitize_relative_path(decoded)
                size = int(info.file_size)
                total_size += size
                is_txt = (safe_rel or decoded).lower().endswith(".txt")
                entries.append(
                    {
                        "index": idx,
                        "raw_name": info.filename,
                        "display_name": safe_rel if safe_rel is not None else decoded,
                        "size": size,
                        "compressed_size": int(info.compress_size),
                        "is_txt": is_txt,
                        "safe": safe_rel is not None,
                        "issue": reason,
                    }
                )
    except zipfile.BadZipFile:
        return {"status": "error", "message": "Tệp không phải định dạng ZIP hợp lệ."}
    except Exception as exc:
        return {"status": "error", "message": f"Không thể đọc tệp ZIP: {exc}"}

    return {
        "status": "ok",
        "entries": entries,
        "total_size": total_size,
    }


def preview_entry(req):
    archive_path = Path(req["archive"])
    entry_index = int(req["entry_index"])
    byte_limit = int(req.get("byte_limit") or PREVIEW_BYTE_LIMIT)
    byte_limit = max(1024, min(byte_limit, 2 * 1024 * 1024))
    try:
        with zipfile.ZipFile(archive_path, "r") as zf:
            infos = zf.infolist()
            if entry_index < 0 or entry_index >= len(infos):
                return {"status": "error", "message": "Mục cần xem không tồn tại trong tệp nén."}
            info = infos[entry_index]
            if info.is_dir():
                return {"status": "error", "message": "Không thể xem trước thư mục."}
            with zf.open(info, "r") as stream:
                sample = stream.read(byte_limit + 1)
            truncated = len(sample) > byte_limit
            if truncated:
                sample = sample[:byte_limit]
            text, encoding = decode_text_preview(sample)
            text = text.replace("\r\n", "\n").replace("\r", "\n")
            return {
                "status": "ok",
                "display_name": decode_member_name(info),
                "encoding": encoding,
                "truncated": truncated,
                "text": text,
            }
    except Exception as exc:
        return {"status": "error", "message": f"Không thể đọc nội dung mục nén: {exc}"}


def extract_archive(req):
    archive_path = Path(req["archive"])
    output_dir = Path(req["output_dir"])
    selected_indices = set(int(i) for i in req["indices"])
    overwrite = bool(req.get("overwrite", False))

    if not selected_indices:
        return {"status": "error", "message": "Chưa chọn tệp nào để giải nén."}
    if output_dir.exists() and not output_dir.is_dir():
        return {"status": "error", "message": "Đường dẫn giải nén không phải là thư mục."}

    try:
        with zipfile.ZipFile(archive_path, "r") as zf:
            infos = zf.infolist()
            planned = []
            total_bytes = 0
            seen_keys = set()

            for idx in sorted(selected_indices):
                if idx < 0 or idx >= len(infos):
                    return {"status": "error", "message": f"Chỉ số mục không hợp lệ: {idx}"}
                info = infos[idx]
                if info.is_dir():
                    continue
                decoded = decode_member_name(info)
                safe_rel, reason = sanitize_relative_path(decoded)
                if safe_rel is None:
                    return {
                        "status": "error",
                        "message": f"Bị chặn vì đường dẫn không an toàn ({decoded}): {reason}",
                    }
                total_bytes += int(info.file_size)
                if total_bytes > MAX_EXTRACT_BYTES:
                    return {
                        "status": "error",
                        "message": "Tổng dung lượng giải nén vượt quá giới hạn an toàn 2 GiB.",
                    }
                key = safe_rel.lower() if os.name == "nt" else safe_rel
                if key in seen_keys:
                    return {
                        "status": "error",
                        "message": f"Trùng đường dẫn đích trong tệp nén: {safe_rel}",
                    }
                seen_keys.add(key)
                target = output_dir.joinpath(*safe_rel.split("/"))
                if not overwrite and target.exists():
                    return {
                        "status": "error",
                        "message": f"Tệp đích đã tồn tại: {safe_rel}. Hãy đổi thư mục hoặc bật cho phép ghi đè.",
                    }
                planned.append((info, safe_rel, target))

            if not planned:
                return {"status": "error", "message": "Không có tệp hợp lệ nào để giải nén."}

            output_dir.mkdir(parents=True, exist_ok=True)
            resolved_root = output_dir.resolve()
            extracted = []
            failure = None

            for info, safe_rel, target in planned:
                try:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    resolved_target = target.resolve()
                    if not resolved_target.is_relative_to(resolved_root):
                        raise ValueError("Đường dẫn thoát khỏi thư mục đích")
                    flags = os.O_WRONLY | os.O_CREAT | (os.O_TRUNC if overwrite else os.O_EXCL)
                    if hasattr(os, "O_BINARY"):
                        flags |= os.O_BINARY
                    fd = os.open(str(target), flags, 0o644)
                    try:
                        with os.fdopen(fd, "wb") as out_f, zf.open(info, "r") as in_f:
                            while True:
                                chunk = in_f.read(65536)
                                if not chunk:
                                    break
                                out_f.write(chunk)
                    except Exception:
                        try:
                            os.close(fd)
                        except OSError:
                            pass
                        raise
                    extracted.append(safe_rel)
                except Exception as exc:
                    failure = {"entry": safe_rel, "error": str(exc)}
                    break

            return {
                "status": "ok",
                "output_dir": str(output_dir),
                "extracted": extracted,
                "failure": failure,
            }
    except zipfile.BadZipFile:
        return {"status": "error", "message": "Tệp không phải định dạng ZIP hợp lệ."}
    except Exception as exc:
        return {"status": "error", "message": f"Lỗi giải nén: {exc}"}


def main():
    req = json.loads(sys.stdin.read())
    action = req.get("action")
    if action == "inspect":
        result = inspect_archive(req)
    elif action == "preview":
        result = preview_entry(req)
    elif action == "extract":
        result = extract_archive(req)
    else:
        result = {"status": "error", "message": f"Không hỗ trợ thao tác: {action}"}
    sys.stdout.write(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
