"""OCR helpers for the translator tab.

The OCR runtime is intentionally isolated in a subprocess.  eSearchOCR uses
ONNX/WASM assets from the TM Translate helper, which are better loaded inside
Qt WebEngine than inside the Tk main process.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from typing import Any

from app.paths import BASE_DIR, RESOURCE_DIR


class OCRError(RuntimeError):
    """Raised when OCR cannot be completed."""


_REQUIRED_ESEARCH_FILES = (
    "ch.zip",
    "eSearchOCR.umd.js",
    "jszip.min.js",
    "ort.min.js",
    "ort.wasm.min.js",
    "ort-wasm.wasm",
    "ort-wasm-simd.wasm",
)


def find_esearch_assets() -> str | None:
    """Return the folder containing TM/eSearch OCR assets if available."""
    parent_dir = os.path.dirname(BASE_DIR)
    candidates = [
        os.environ.get("ND5_ESEARCH_OCR_ASSETS", ""),
        os.path.join(BASE_DIR, "ocr_assets"),
        os.path.join(BASE_DIR, "local", "ocr_assets"),
        os.path.join(RESOURCE_DIR, "ocr_assets"),
        os.path.join(parent_dir, "translate", "TM-translate", "TM-Extension-Helper", "assets"),
    ]
    for candidate in candidates:
        if not candidate:
            continue
        path = os.path.abspath(candidate)
        if all(os.path.exists(os.path.join(path, name)) for name in _REQUIRED_ESEARCH_FILES):
            return path
    return None


def recognize_image(image_path: str, timeout_sec: int = 180) -> dict[str, Any]:
    """Run eSearch/PaddleOCR on an image and return a JSON payload."""
    if not image_path or not os.path.exists(image_path):
        raise OCRError("File ảnh không tồn tại.")

    errors: list[str] = []
    try:
        payload = _recognize_image_esearch(image_path, timeout_sec=timeout_sec)
        payload.setdefault("engine", "esearch")
        return payload
    except Exception as exc:
        errors.append(f"eSearch OCR: {exc}")

    try:
        payload = _recognize_image_windows_ocr(image_path, timeout_sec=min(timeout_sec, 90))
        payload.setdefault("engine", "windows")
        return payload
    except Exception as exc:
        errors.append(f"Windows OCR: {exc}")

    raise OCRError("\n".join(errors))


def _recognize_image_esearch(image_path: str, timeout_sec: int = 180) -> dict[str, Any]:
    assets_dir = find_esearch_assets()
    if not assets_dir:
        raise OCRError(
            "Thiếu bộ OCR eSearch. Cần thư mục assets của TM Translate "
            "hoặc đặt biến môi trường ND5_ESEARCH_OCR_ASSETS trỏ tới thư mục chứa ch.zip."
        )

    cmd = [
        sys.executable,
        "-m",
        "app.core.esearch_ocr_runner",
        "--image",
        os.path.abspath(image_path),
        "--assets-dir",
        assets_dir,
        "--timeout",
        str(int(timeout_sec)),
    ]
    env = os.environ.copy()
    env.setdefault("QTWEBENGINE_DISABLE_SANDBOX", "1")
    flags = env.get("QTWEBENGINE_CHROMIUM_FLAGS", "")
    if "--no-sandbox" not in flags:
        flags = f"{flags} --no-sandbox".strip()
    env["QTWEBENGINE_CHROMIUM_FLAGS"] = flags

    try:
        proc = subprocess.run(
            cmd,
            cwd=BASE_DIR,
            env=env,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=max(30, int(timeout_sec) + 20),
        )
    except subprocess.TimeoutExpired as exc:
        raise OCRError(f"OCR quá thời gian chờ ({timeout_sec}s).") from exc

    stdout_lines = [line.strip() for line in (proc.stdout or "").splitlines() if line.strip()]
    payload: dict[str, Any] | None = None
    if stdout_lines:
        try:
            payload = json.loads(stdout_lines[-1])
        except json.JSONDecodeError:
            payload = None

    if proc.returncode != 0:
        detail = (proc.stderr or "").strip() or (proc.stdout or "").strip()
        raise OCRError(detail or f"OCR runner thoát với mã {proc.returncode}.")
    if not payload:
        detail = (proc.stderr or "").strip() or (proc.stdout or "").strip()
        raise OCRError(detail or "OCR runner không trả về JSON hợp lệ.")
    if not payload.get("ok"):
        raise OCRError(str(payload.get("error") or "OCR thất bại."))
    return payload


def _recognize_image_windows_ocr(image_path: str, timeout_sec: int = 90) -> dict[str, Any]:
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

$engine = $null
foreach ($tag in @("zh-Hans", "zh-CN", "zh-Hant", "zh-TW", "en-US")) {
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
    import base64

    encoded = base64.b64encode(script.encode("utf-16le")).decode("ascii")
    env = os.environ.copy()
    env["ND5_OCR_IMAGE_PATH"] = os.path.abspath(image_path)
    proc = subprocess.run(
        [powershell, "-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
        timeout=max(20, int(timeout_sec)),
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
