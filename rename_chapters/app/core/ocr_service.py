"""OCR helpers for the translator tab.

The app uses Windows Runtime OCR through PowerShell/WinRT so users do not need
to download or manage a separate OCR model inside Novel Studio.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
from typing import Any


class OCRError(RuntimeError):
    """Raised when OCR cannot be completed."""


def recognize_image(image_path: str, timeout_sec: int = 180) -> dict[str, Any]:
    """Run Windows OCR on an image and return a JSON payload."""
    if not image_path or not os.path.exists(image_path):
        raise OCRError("File ảnh không tồn tại.")

    try:
        payload = _recognize_image_windows_ocr(image_path, timeout_sec=min(timeout_sec, 90))
        payload.setdefault("engine", "windows")
        return payload
    except Exception as exc:
        raise OCRError(f"Windows OCR: {exc}") from exc


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
