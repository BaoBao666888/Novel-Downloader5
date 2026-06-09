"""OCR client helpers for Novel Studio.

PaddleOCR runs in a separate optional runtime package. The main app stays light
and calls ``tools/ocr_runtime/ocr_runtime.exe`` when OCR/model work is needed.
Windows OCR remains available as a last-resort fallback.
"""
from __future__ import annotations

import base64
import contextlib
import json
import os
import shutil
import subprocess
import tempfile
import time
import zipfile
from typing import Any, Callable

from packaging.version import parse as parse_version

from app.paths import BASE_DIR


class OCRError(RuntimeError):
    """Raised when OCR cannot be completed."""


PADDLE_MODEL_OPTIONS: tuple[dict[str, str], ...] = (
    {
        "key": "ppocrv5_mobile_zh",
        "label": "PP-OCRv5 Mobile - Trung/Anh/Nhật nhẹ",
        "lang": "ch",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "PP-OCRv5_mobile_rec",
        "size": "nhẹ",
        "description": "Mặc định cho truyện/ảnh chụp màn hình: giản thể, phồn thể, tiếng Anh, tiếng Nhật, chữ dọc và chữ viết tay mức phổ thông.",
    },
    {
        "key": "ppocrv5_server_zh",
        "label": "PP-OCRv5 Server - Trung chính xác hơn",
        "lang": "ch",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_server_det",
        "rec_model": "PP-OCRv5_server_rec",
        "size": "nặng hơn",
        "description": "Ưu tiên độ chính xác cho ảnh khó, chữ nhỏ, scan nhiều nhiễu; đổi lại tải/chạy nặng hơn bản Mobile.",
    },
    {
        "key": "ppocrv5_mobile_latin",
        "label": "PP-OCRv5 Mobile - Latin/Việt",
        "lang": "la",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "latin_PP-OCRv5_mobile_rec",
        "size": "nhẹ",
        "description": "Dành cho văn bản tiếng Việt và các ngôn ngữ chữ Latin; phù hợp ảnh chú thích, tài liệu Latin, số.",
    },
    {
        "key": "ppocrv5_mobile_en",
        "label": "PP-OCRv5 Mobile - English",
        "lang": "en",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "en_PP-OCRv5_mobile_rec",
        "size": "nhẹ",
        "description": "Tối ưu tiếng Anh và số; nên dùng khi ảnh gần như toàn tiếng Anh.",
    },
    {
        "key": "ppocrv5_mobile_korean",
        "label": "PP-OCRv5 Mobile - Korean",
        "lang": "korean",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "korean_PP-OCRv5_mobile_rec",
        "size": "nhẹ",
        "description": "Nhận tiếng Hàn, tiếng Anh và số; dùng cho ảnh raw Hàn hoặc ảnh có nhiều Hangul.",
    },
    {
        "key": "ppocrv5_mobile_eslav",
        "label": "PP-OCRv5 Mobile - East Slavic",
        "lang": "ru",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "eslav_PP-OCRv5_mobile_rec",
        "size": "nhẹ",
        "description": "Nhận Russian, Belarusian, Ukrainian và English.",
    },
    {
        "key": "ppocrv5_mobile_cyrillic",
        "label": "PP-OCRv5 Mobile - Cyrillic",
        "lang": "cyrillic",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "cyrillic_PP-OCRv5_mobile_rec",
        "size": "nhẹ",
        "description": "Nhận nhóm chữ Cyrillic: Russian, Bulgarian, Serbian Cyrillic, Mongolian, Kazakh, Kyrgyz và các ngôn ngữ liên quan.",
    },
    {
        "key": "ppocrv5_mobile_thai",
        "label": "PP-OCRv5 Mobile - Thai",
        "lang": "th",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "th_PP-OCRv5_mobile_rec",
        "size": "nhẹ",
        "description": "Nhận tiếng Thái và tiếng Anh.",
    },
    {
        "key": "ppocrv5_mobile_greek",
        "label": "PP-OCRv5 Mobile - Greek",
        "lang": "el",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "el_PP-OCRv5_mobile_rec",
        "size": "nhẹ",
        "description": "Nhận tiếng Hy Lạp và tiếng Anh.",
    },
    {
        "key": "ppocrv5_mobile_arabic",
        "label": "PP-OCRv5 Mobile - Arabic",
        "lang": "ar",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "arabic_PP-OCRv5_mobile_rec",
        "size": "nhẹ",
        "description": "Nhận Arabic, Persian, Uyghur, Urdu, Pashto, Kurdish, Sindhi, Balochi và English.",
    },
    {
        "key": "ppocrv5_mobile_devanagari",
        "label": "PP-OCRv5 Mobile - Devanagari",
        "lang": "hi",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "devanagari_PP-OCRv5_mobile_rec",
        "size": "nhẹ",
        "description": "Nhận Hindi, Marathi, Nepali, Sanskrit và nhóm Devanagari.",
    },
    {
        "key": "ppocrv5_mobile_tamil",
        "label": "PP-OCRv5 Mobile - Tamil",
        "lang": "ta",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "ta_PP-OCRv5_mobile_rec",
        "size": "nhẹ",
        "description": "Nhận tiếng Tamil và tiếng Anh.",
    },
    {
        "key": "ppocrv5_mobile_telugu",
        "label": "PP-OCRv5 Mobile - Telugu",
        "lang": "te",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "te_PP-OCRv5_mobile_rec",
        "size": "nhẹ",
        "description": "Nhận tiếng Telugu và tiếng Anh.",
    },
    {
        "key": "ppocrv3_mobile_japan",
        "label": "PP-OCRv3 Mobile - Japanese",
        "lang": "japan",
        "ocr_version": "PP-OCRv3",
        "det_model": "",
        "rec_model": "japan_PP-OCRv3_mobile_rec",
        "size": "nhẹ",
        "description": "Dành cho tiếng Nhật; dùng khi model PP-OCRv5 Trung không đọc ổn phần kana/kanji Nhật.",
    },
    {
        "key": "ppocrv3_mobile_cht",
        "label": "PP-OCRv3 Mobile - Chinese Traditional",
        "lang": "chinese_cht",
        "ocr_version": "PP-OCRv3",
        "det_model": "",
        "rec_model": "chinese_cht_PP-OCRv3_mobile_rec",
        "size": "nhẹ",
        "description": "Dành cho phồn thể chuyên biệt; dùng khi ảnh Taiwan/Hong Kong bị PP-OCRv5 nhận sai nhiều.",
    },
)
DEFAULT_PADDLE_MODEL_KEY = "ppocrv5_mobile_zh"
DEFAULT_RUNTIME_VERSION = "0.1.2"
DEFAULT_RUNTIME_EXE_NAME = "ocr_runtime.exe"


def get_paddle_model_options() -> list[dict[str, str]]:
    return [dict(option) for option in PADDLE_MODEL_OPTIONS]


def get_paddle_model_option(model_key: str = "") -> dict[str, str]:
    key = (model_key or DEFAULT_PADDLE_MODEL_KEY).strip()
    for option in PADDLE_MODEL_OPTIONS:
        if option["key"] == key:
            return dict(option)
    return dict(PADDLE_MODEL_OPTIONS[0])


def is_paddle_model_downloaded(model_key: str = DEFAULT_PADDLE_MODEL_KEY) -> bool:
    option = get_paddle_model_option(model_key)
    model_names = [name for name in (option.get("det_model"), option.get("rec_model")) if name]
    if not model_names:
        return False
    base = os.path.join(ocr_model_cache_dir(), "official_models")
    return all(os.path.isdir(os.path.join(base, name)) for name in model_names)


def get_downloaded_paddle_model_options() -> list[dict[str, str]]:
    return [dict(option) for option in PADDLE_MODEL_OPTIONS if is_paddle_model_downloaded(option["key"])]


def ocr_runtime_dir() -> str:
    return os.path.join(BASE_DIR, "tools", "ocr_runtime")


def ocr_runtime_exe_path(exe_name: str = DEFAULT_RUNTIME_EXE_NAME) -> str:
    return os.path.join(ocr_runtime_dir(), exe_name or DEFAULT_RUNTIME_EXE_NAME)


def ocr_model_cache_dir() -> str:
    return os.path.join(BASE_DIR, "local", "ocr_models")


def get_ocr_runtime_status(meta: dict[str, Any] | None = None, *, query_version: bool = True) -> dict[str, Any]:
    meta = meta or {}
    exe_name = (meta.get("exe_name") or DEFAULT_RUNTIME_EXE_NAME).strip()
    target_version = str(meta.get("version") or DEFAULT_RUNTIME_VERSION).strip()
    exe_path = ocr_runtime_exe_path(exe_name)
    installed = os.path.isfile(exe_path)
    installed_version = _query_runtime_version(exe_path) if installed and query_version else ""
    return {
        "installed": installed,
        "exe_path": exe_path,
        "dir": ocr_runtime_dir(),
        "version": installed_version,
        "target_version": target_version,
        "needs_install": not installed,
        "needs_update": bool(installed and _is_newer_version(target_version, installed_version)),
        "url": meta.get("url") or "",
        "model_cache_dir": ocr_model_cache_dir(),
    }


def _is_newer_version(target_version: str, installed_version: str) -> bool:
    target = str(target_version or "").strip()
    installed = str(installed_version or "").strip()
    if not target or not installed:
        return False
    try:
        return parse_version(target) > parse_version(installed)
    except Exception:
        return target != installed


def install_ocr_runtime(meta: dict[str, Any], status_cb: Callable[[str], None] | None = None) -> dict[str, Any]:
    url = str((meta or {}).get("url") or "").strip()
    if not url:
        raise OCRError("Chưa có link OCR runtime trong version.json -> ocr_runtime.url.")
    exe_name = str((meta or {}).get("exe_name") or DEFAULT_RUNTIME_EXE_NAME).strip() or DEFAULT_RUNTIME_EXE_NAME
    target_version = str((meta or {}).get("version") or DEFAULT_RUNTIME_VERSION).strip()

    download_dir = os.path.join(BASE_DIR, "local", "ocr_runtime_download")
    os.makedirs(download_dir, exist_ok=True)
    zip_path = os.path.join(download_dir, "ocr_runtime.zip")
    _emit(status_cb, "Đang tải OCR runtime...")
    _download_file(url, zip_path, status_cb=status_cb, status_prefix="Đang tải OCR runtime...")
    if _looks_like_html(zip_path):
        with contextlib.suppress(Exception):
            os.remove(zip_path)
        raise OCRError("File tải về là HTML. Kiểm tra link Drive public hoặc link tải trực tiếp.")

    _emit(status_cb, "Đang giải nén OCR runtime...")
    extract_root = tempfile.mkdtemp(prefix="ocr_runtime_", dir=download_dir)
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(extract_root)
        package_root = _locate_runtime_package_root(extract_root, exe_name)
        target_dir = ocr_runtime_dir()
        target_parent = os.path.dirname(target_dir)
        os.makedirs(target_parent, exist_ok=True)
        staging_dir = target_dir + ".new"
        backup_dir = target_dir + f".bak_{int(time.time())}"
        if os.path.isdir(staging_dir):
            shutil.rmtree(staging_dir, ignore_errors=True)
        shutil.copytree(package_root, staging_dir)
        if os.path.isdir(target_dir):
            if os.path.isdir(backup_dir):
                shutil.rmtree(backup_dir, ignore_errors=True)
            os.replace(target_dir, backup_dir)
        os.replace(staging_dir, target_dir)
        shutil.rmtree(backup_dir, ignore_errors=True)
        version_path = os.path.join(target_dir, "runtime_version.json")
        with open(version_path, "w", encoding="utf-8") as f:
            json.dump({"version": target_version, "exe_name": exe_name}, f, ensure_ascii=False, indent=2)
        status = get_ocr_runtime_status({"version": target_version, "exe_name": exe_name})
        _emit(status_cb, "Đã cài OCR runtime.")
        return status
    finally:
        shutil.rmtree(extract_root, ignore_errors=True)


def get_paddle_dependency_status(meta: dict[str, Any] | None = None) -> dict[str, Any]:
    status = get_ocr_runtime_status(meta)
    if not status.get("installed"):
        return {"ok": False, "error": "Chưa cài OCR runtime.", **status}
    return {"ok": True, **status}


def download_paddle_model(model_key: str = DEFAULT_PADDLE_MODEL_KEY, *, meta: dict[str, Any] | None = None) -> dict[str, Any]:
    option = get_paddle_model_option(model_key)
    payload = _run_runtime_json(
        [
            "download-model",
            "--model-key",
            option["key"],
        ],
        meta=meta,
        timeout_sec=900,
    )
    returned_key = str(payload.get("model_key") or "").strip()
    if returned_key and returned_key != option["key"]:
        raise OCRError(
            f"OCR runtime hiện tại chưa hỗ trợ model {option['key']} "
            f"(runtime trả về {returned_key}). Cần cập nhật OCR runtime trước khi dùng ngôn ngữ này."
        )
    payload.setdefault("ok", True)
    payload.setdefault("engine", "paddle")
    payload.setdefault("model_key", option["key"])
    payload.setdefault("label", option["label"])
    payload.setdefault("cache_dir", ocr_model_cache_dir())
    return payload


def recognize_image(
    image_path: str,
    timeout_sec: int = 300,
    *,
    engine: str = "paddle",
    language: str = "auto",
    model_name: str = "",
    model_key: str = DEFAULT_PADDLE_MODEL_KEY,
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if not image_path or not os.path.exists(image_path):
        raise OCRError("File ảnh không tồn tại.")

    engine = (engine or "paddle").strip().lower()
    option = get_paddle_model_option(model_key)
    if engine in {"paddle", "auto"}:
        try:
            payload = _run_runtime_json(
                [
                    "recognize",
                    "--input",
                    os.path.abspath(image_path),
                    "--model-key",
                    option["key"],
                ],
                meta=meta,
                timeout_sec=timeout_sec,
            )
            returned_key = str(payload.get("model_key") or "").strip()
            if returned_key and returned_key != option["key"]:
                raise OCRError(
                    f"OCR runtime hiện tại chưa hỗ trợ model {option['key']} "
                    f"(runtime trả về {returned_key}). Cần cập nhật OCR runtime trước khi dùng ngôn ngữ này."
                )
            return payload
        except Exception as exc:
            if engine != "auto":
                raise OCRError(f"OCR runtime: {exc}") from exc
            paddle_error = exc
    else:
        paddle_error = None

    if engine not in {"windows", "auto"}:
        raise OCRError(f"Engine OCR không hỗ trợ: {engine}")

    try:
        payload = _recognize_image_windows_ocr(
            image_path,
            timeout_sec=min(timeout_sec, 90),
            language=language or option["lang"],
        )
        payload.setdefault("engine", "windows")
        if paddle_error is not None:
            payload["fallback_from"] = f"OCR runtime: {paddle_error}"
        return payload
    except Exception as exc:
        if paddle_error is not None:
            raise OCRError(f"OCR runtime lỗi: {paddle_error}; Windows OCR cũng lỗi: {exc}") from exc
        raise OCRError(f"Windows OCR: {exc}") from exc


def _query_runtime_version(exe_path: str) -> str:
    if not os.path.isfile(exe_path):
        return ""
    try:
        result = subprocess.run([exe_path, "--version"], capture_output=True, text=True, timeout=10, **_subprocess_no_window_kwargs())
    except Exception:
        return ""
    output = (result.stdout or result.stderr or "").strip()
    if result.returncode == 0 and output:
        return output.splitlines()[0].strip()
    return ""


def _run_runtime_json(args: list[str], *, meta: dict[str, Any] | None = None, timeout_sec: int = 300) -> dict[str, Any]:
    status = get_ocr_runtime_status(meta)
    exe_path = str(status.get("exe_path") or "")
    if not os.path.isfile(exe_path):
        raise OCRError("Chưa cài OCR runtime. Hãy cài runtime từ menu OCR trước.")
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    model_cache_dir = ocr_model_cache_dir()
    os.makedirs(model_cache_dir, exist_ok=True)
    runtime_model_cache_dir = _runtime_path_arg(model_cache_dir, exe_path)
    runtime_args = _runtime_args_for_exe(args, exe_path)
    env["NOVEL_STUDIO_OCR_MODEL_DIR"] = runtime_model_cache_dir
    env["PADDLE_PDX_CACHE_HOME"] = runtime_model_cache_dir
    env.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")
    proc = subprocess.run(
        [exe_path, "--cache-dir", runtime_model_cache_dir, *runtime_args],
        cwd=os.path.dirname(exe_path) or BASE_DIR,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
        timeout=max(30, int(timeout_sec)),
        **_subprocess_no_window_kwargs(),
    )
    output = (proc.stdout or "").strip()
    err = (proc.stderr or "").strip()
    payload = _parse_json_output(output)
    if proc.returncode != 0:
        message = ""
        if isinstance(payload, dict):
            message = str(payload.get("error") or payload.get("message") or "").strip()
        raise OCRError(message or err or output or f"OCR runtime lỗi mã {proc.returncode}")
    if not isinstance(payload, dict):
        raise OCRError(output or "OCR runtime không trả về JSON hợp lệ.")
    if payload.get("ok") is False:
        raise OCRError(str(payload.get("error") or "OCR runtime thất bại."))
    return payload


def _runtime_args_for_exe(args: list[str], exe_path: str) -> list[str]:
    out: list[str] = []
    path_value_flags = {"--input", "--cache-dir"}
    expects_path = False
    for arg in args or []:
        text = str(arg)
        if expects_path:
            out.append(_runtime_path_arg(text, exe_path))
            expects_path = False
            continue
        out.append(text)
        expects_path = text in path_value_flags
    return out


def _runtime_path_arg(path: str, exe_path: str) -> str:
    text = str(path or "")
    if not text or os.name == "nt" or not str(exe_path or "").lower().endswith(".exe"):
        return text
    normalized = text.replace("\\", "/")
    if normalized.startswith("/mnt/") and len(normalized) > 6 and normalized[6] == "/":
        drive = normalized[5:6].upper()
        rest = normalized[7:].replace("/", "\\")
        return f"{drive}:\\{rest}" if rest else f"{drive}:\\"
    return text


def _parse_json_output(output: str) -> dict[str, Any] | None:
    for line in reversed((output or "").splitlines()):
        line = line.strip()
        if not line:
            continue
        try:
            parsed = json.loads(line)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            continue
    return None


def _locate_runtime_package_root(extract_root: str, exe_name: str) -> str:
    exact = []
    candidates = []
    for root, _dirs, files in os.walk(extract_root):
        for fn in files:
            if not fn.lower().endswith(".exe"):
                continue
            full = os.path.join(root, fn)
            candidates.append(full)
            if fn.lower() == exe_name.lower():
                exact.append(full)
    if exact:
        return os.path.dirname(exact[0])
    if candidates:
        return os.path.dirname(candidates[0])
    raise OCRError(f"Gói OCR runtime thiếu file chạy {exe_name}.")


def _download_file(url: str, dest_path: str, status_cb=None, status_prefix: str = "Đang tải..."):
    if os.path.exists(dest_path):
        with contextlib.suppress(Exception):
            os.remove(dest_path)
    gdown = _gdown_path()
    if gdown:
        cmd = [gdown, "--fuzzy", "-O", dest_path, url]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0 and os.path.isfile(dest_path):
            return
        msg = (result.stderr or result.stdout or "").strip()
        raise OCRError(msg or f"gdown thất bại mã {result.returncode}.")

    import requests

    with requests.get(url, stream=True, timeout=60) as response:
        response.raise_for_status()
        total = int(response.headers.get("content-length") or 0)
        done = 0
        with open(dest_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=1024 * 512):
                if not chunk:
                    continue
                f.write(chunk)
                done += len(chunk)
                if total:
                    _emit(status_cb, f"{status_prefix} {done / total * 100:.0f}%")
                else:
                    _emit(status_cb, f"{status_prefix} {done / (1024 * 1024):.1f} MB")


def _gdown_path() -> str:
    name = "gdown.exe" if os.name == "nt" else "gdown"
    path = os.path.join(BASE_DIR, "tools", name)
    return path if os.path.isfile(path) else ""


def _looks_like_html(path: str) -> bool:
    try:
        with open(path, "rb") as f:
            head = f.read(2048).lower()
    except Exception:
        return False
    return b"<html" in head or b"<!doctype html" in head


def _emit(status_cb, message: str):
    if callable(status_cb):
        status_cb(message)


def _windows_language_candidates(language: str) -> list[str]:
    value = (language or "auto").strip()
    aliases = {
        "auto": [],
        "ch": ["zh-Hans", "zh-CN"],
        "zh": ["zh-Hans", "zh-CN"],
        "zh-hans": ["zh-Hans", "zh-CN"],
        "zh-cn": ["zh-CN", "zh-Hans"],
        "chinese_cht": ["zh-Hant", "zh-TW"],
        "zh-hant": ["zh-Hant", "zh-TW"],
        "zh-tw": ["zh-TW", "zh-Hant"],
        "en": ["en-US"],
        "en-us": ["en-US"],
        "vi": ["vi-VN", "en-US"],
        "vi-vn": ["vi-VN", "en-US"],
        "la": ["vi-VN", "en-US"],
        "latin": ["vi-VN", "en-US"],
        "ko": ["ko-KR"],
        "ko-kr": ["ko-KR"],
        "korean": ["ko-KR"],
        "ja": ["ja-JP"],
        "ja-jp": ["ja-JP"],
        "japan": ["ja-JP"],
    }
    candidates = aliases.get(value.lower(), [value] if value else [])
    fallback = ["zh-Hans", "zh-CN", "zh-Hant", "zh-TW", "en-US"]
    ordered: list[str] = []
    for tag in [*candidates, *fallback]:
        if tag and tag not in ordered:
            ordered.append(tag)
    return ordered


def _recognize_image_windows_ocr(image_path: str, timeout_sec: int = 90, language: str = "auto") -> dict[str, Any]:
    powershell = shutil.which("powershell.exe") or shutil.which("powershell")
    if not powershell:
        raise OCRError("Không tìm thấy PowerShell để gọi Windows OCR.")

    script = r"""
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime] > $null
[Windows.Storage.FileAccessMode, Windows.Storage, ContentType=WindowsRuntime] > $null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime] > $null
[Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType=WindowsRuntime] > $null
[Windows.Graphics.Imaging.BitmapPixelFormat, Windows.Graphics.Imaging, ContentType=WindowsRuntime] > $null
[Windows.Graphics.Imaging.BitmapAlphaMode, Windows.Graphics.Imaging, ContentType=WindowsRuntime] > $null
[Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType=WindowsRuntime] > $null
[Windows.Globalization.Language, Windows.Globalization, ContentType=WindowsRuntime] > $null

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object {
        $_.Name -eq "AsTask" -and
        $_.IsGenericMethodDefinition -and
        $_.GetParameters().Count -eq 1
    } | Select-Object -First 1)

function AwaitOperation($operation, [Type]$resultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($resultType)
    $task = $asTask.Invoke($null, @($operation))
    $task.Wait() | Out-Null
    return $task.Result
}

$path = $env:ND5_OCR_IMAGE_PATH
if (-not $path -or -not (Test-Path -LiteralPath $path)) {
    throw "File ảnh không tồn tại: $path"
}

$preferredTags = @()
if ($env:ND5_OCR_LANGUAGE_TAGS) {
    $preferredTags = $env:ND5_OCR_LANGUAGE_TAGS -split "\|"
}
$engine = $null
foreach ($tag in $preferredTags) {
    if (-not $tag) { continue }
    try {
        $lang = [Windows.Globalization.Language]::new($tag)
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
        if ($engine) { break }
    } catch {}
}
if (-not $engine) {
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
}
if (-not $engine) {
    throw "Windows OCR chưa có language pack phù hợp."
}

$file = AwaitOperation ([Windows.Storage.StorageFile]::GetFileFromPathAsync($path)) ([Windows.Storage.StorageFile])
$stream = AwaitOperation ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$decoder = AwaitOperation ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bitmap = AwaitOperation ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
if ($bitmap.BitmapPixelFormat -ne [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8 -and
    $bitmap.BitmapPixelFormat -ne [Windows.Graphics.Imaging.BitmapPixelFormat]::Gray8) {
    $bitmap = [Windows.Graphics.Imaging.SoftwareBitmap]::Convert(
        $bitmap,
        [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8,
        [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied
    )
}

$result = AwaitOperation ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
$lines = @()
foreach ($line in $result.Lines) {
    $words = @()
    foreach ($word in $line.Words) {
        if ($word.Text) { $words += $word.Text }
    }
    if ($words.Count -gt 0) {
        $lines += ($words -join "")
    }
}
$text = ($lines -join "`n")
$payload = @{
    ok = $true
    text = $text
    blocks = @()
    engine = "windows"
    language = $engine.RecognizerLanguage.LanguageTag
} | ConvertTo-Json -Compress
$bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
[Convert]::ToBase64String($bytes)
"""

    encoded = base64.b64encode(script.encode("utf-16le")).decode("ascii")
    env = os.environ.copy()
    env["ND5_OCR_IMAGE_PATH"] = os.path.abspath(image_path)
    env["ND5_OCR_LANGUAGE_TAGS"] = "|".join(_windows_language_candidates(language))
    proc = subprocess.run(
        [powershell, "-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
        timeout=max(20, int(timeout_sec)),
        **_subprocess_no_window_kwargs(),
    )
    output = (proc.stdout or "").strip()
    if proc.returncode != 0:
        raise OCRError((proc.stderr or output or f"PowerShell OCR lỗi mã {proc.returncode}").strip())
    try:
        decoded = base64.b64decode(output.splitlines()[-1]).decode("utf-8")
        payload = json.loads(decoded)
    except Exception as exc:
        raise OCRError(output or "Windows OCR không trả về JSON hợp lệ.") from exc
    if not payload.get("ok"):
        raise OCRError(str(payload.get("error") or "Windows OCR thất bại."))
    return payload


def _subprocess_no_window_kwargs() -> dict[str, Any]:
    if os.name != "nt":
        return {}
    startupinfo = subprocess.STARTUPINFO()
    startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    creationflags = 0
    with contextlib.suppress(AttributeError):
        creationflags |= subprocess.CREATE_NO_WINDOW
    return {
        "startupinfo": startupinfo,
        "creationflags": creationflags,
    }
