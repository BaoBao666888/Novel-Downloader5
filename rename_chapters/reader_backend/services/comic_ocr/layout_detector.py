from __future__ import annotations

import contextlib
import hashlib
import os
import threading
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.core import ocr_service


LAYOUT_VERSION = "kiuyha-yolo26n-text-v1"
DEFAULT_MODEL_KEY = "kiuyha_manga_bubble_yolo26n"
MODEL_URL = "https://huggingface.co/Kiuyha/Manga-Bubble-YOLO/resolve/main/onnx/yolo26n.onnx"
MODEL_SHA256 = "b45c2e12cf0c3c1d2abfbbb9123c9f96f040f2ac36a0842382ecd9d859c851c7"
MODEL_SIZE = 1280
MODEL_SCORE_THRESHOLD = 0.25
MODEL_NMS_THRESHOLD = 0.45

_SESSION_LOCK = threading.Lock()
_SESSION_CACHE: dict[str, Any] = {}


class ComicOcrLayoutError(RuntimeError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass
class LayoutRegion:
    type: str
    box_px: list[float]
    score: float
    order: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "type": self.type,
            "box_px": [float(x) for x in self.box_px[:4]],
            "score": float(self.score or 0.0),
            "order": int(self.order or 0),
        }


def layout_model_dir() -> str:
    return os.path.join(ocr_service.ocr_model_cache_dir(), "comic_layout", "kiuyha_manga_bubble_yolo")


def layout_model_path() -> str:
    return os.path.join(layout_model_dir(), "yolo26n.onnx")


def dependency_status() -> dict[str, Any]:
    missing: list[str] = []
    versions: dict[str, str] = {}
    for name in ("numpy", "cv2", "onnxruntime"):
        try:
            module = __import__(name)
            versions[name] = str(getattr(module, "__version__", "") or "")
        except Exception:
            missing.append(name)
    if missing:
        return {
            "installed": False,
            "reason": "OCR_LAYOUT_DEPENDENCY_NOT_READY",
            "message": "Thiếu dependency tách khung OCR comic. Cài `onnxruntime`, `opencv-python`, `numpy` cho Python đang chạy reader_server.py.",
            "missing": missing,
            "versions": versions,
        }
    return {
        "installed": True,
        "reason": "",
        "message": "",
        "missing": [],
        "versions": versions,
    }


def model_status(*, auto_download: bool = False) -> dict[str, Any]:
    path = layout_model_path()
    if auto_download and not os.path.isfile(path):
        with contextlib.suppress(Exception):
            ensure_model_downloaded()
    downloaded = os.path.isfile(path) and _file_sha256(path) == MODEL_SHA256
    return {
        "downloaded": downloaded,
        "path": path,
        "model_key": DEFAULT_MODEL_KEY,
        "version": LAYOUT_VERSION,
        "url": MODEL_URL,
        "sha256": MODEL_SHA256,
        "reason": "" if downloaded else "OCR_LAYOUT_MODEL_NOT_READY",
        "message": "" if downloaded else "Chưa có model tách khung OCR comic. Cần tải model layout trước khi OCR ảnh.",
    }


def ensure_model_downloaded() -> str:
    path = layout_model_path()
    if os.path.isfile(path) and _file_sha256(path) == MODEL_SHA256:
        return path
    Path(layout_model_dir()).mkdir(parents=True, exist_ok=True)
    tmp = f"{path}.tmp"
    with contextlib.suppress(FileNotFoundError):
        os.remove(tmp)
    urllib.request.urlretrieve(MODEL_URL, tmp)
    digest = _file_sha256(tmp)
    if digest != MODEL_SHA256:
        with contextlib.suppress(FileNotFoundError):
            os.remove(tmp)
        raise ComicOcrLayoutError(
            "OCR_LAYOUT_MODEL_CHECKSUM_FAILED",
            "Model tách khung OCR comic tải về không đúng checksum.",
        )
    os.replace(tmp, path)
    return path


def detect_regions(
    image,
    *,
    source_lang: str,
    settings: dict[str, Any],
    width: int,
    height: int,
) -> list[dict[str, Any]]:
    if width <= 0 or height <= 0:
        return []
    deps = dependency_status()
    if not deps.get("installed"):
        raise ComicOcrLayoutError(str(deps.get("reason") or "OCR_LAYOUT_DEPENDENCY_NOT_READY"), str(deps.get("message") or "Thiếu dependency layout OCR."))
    status = model_status(auto_download=_bool_setting(settings, "layout_model_auto_download", True))
    if not status.get("downloaded"):
        raise ComicOcrLayoutError(str(status.get("reason") or "OCR_LAYOUT_MODEL_NOT_READY"), str(status.get("message") or "Thiếu model layout OCR."))

    import numpy as np

    session = _session_for_model(str(status.get("path") or layout_model_path()))
    input_size = _int_setting(settings, "layout_input_size", MODEL_SIZE, 640, 1920)
    score_threshold = _float_setting(settings, "layout_score_threshold", MODEL_SCORE_THRESHOLD, 0.01, 0.99)
    nms_threshold = _float_setting(settings, "layout_nms_threshold", MODEL_NMS_THRESHOLD, 0.05, 0.95)

    resized = image.convert("RGB").resize((input_size, input_size))
    # Model card uses cv2.imread, so feed BGR channel order.
    arr = np.asarray(resized)[:, :, ::-1]
    tensor = arr.transpose((2, 0, 1))[None].astype("float32") / 255.0
    output = session.run(None, {session.get_inputs()[0].name: tensor})[0]
    rows = output[0] if getattr(output, "ndim", 0) == 3 else output

    candidates: list[LayoutRegion] = []
    for row in rows:
        if len(row) < 5:
            continue
        score = float(row[4] or 0.0)
        if score < score_threshold:
            continue
        x1 = max(0.0, min(float(row[0] or 0.0), float(input_size)))
        y1 = max(0.0, min(float(row[1] or 0.0), float(input_size)))
        x2 = max(0.0, min(float(row[2] or 0.0), float(input_size)))
        y2 = max(0.0, min(float(row[3] or 0.0), float(input_size)))
        if x2 < x1:
            x1, x2 = x2, x1
        if y2 < y1:
            y1, y2 = y2, y1
        bx1 = x1 / input_size * width
        by1 = y1 / input_size * height
        bx2 = x2 / input_size * width
        by2 = y2 / input_size * height
        if bx2 - bx1 < 4 or by2 - by1 < 4:
            continue
        candidates.append(LayoutRegion(type="text_bubble", box_px=[bx1, by1, bx2, by2], score=score))

    regions = _nms(candidates, threshold=nms_threshold)
    regions = sorted(regions, key=lambda item: _reading_order_key(item.box_px, source_lang=source_lang))
    for idx, region in enumerate(regions, start=1):
        region.order = idx
    return [region.to_dict() for region in regions]


def _session_for_model(path: str):
    import onnxruntime as ort

    key = str(path or "")
    with _SESSION_LOCK:
        cached = _SESSION_CACHE.get(key)
        if cached is not None:
            return cached
        options = ort.SessionOptions()
        options.log_severity_level = 3
        session = ort.InferenceSession(key, sess_options=options, providers=["CPUExecutionProvider"])
        _SESSION_CACHE.clear()
        _SESSION_CACHE[key] = session
        return session


def _nms(regions: list[LayoutRegion], *, threshold: float) -> list[LayoutRegion]:
    out: list[LayoutRegion] = []
    for region in sorted(regions, key=lambda item: item.score, reverse=True):
        if any(_iou(region.box_px, kept.box_px) > threshold for kept in out):
            continue
        out.append(region)
    return out


def _iou(a: list[float], b: list[float]) -> float:
    ax1, ay1, ax2, ay2 = a[:4]
    bx1, by1, bx2, by2 = b[:4]
    ix1 = max(ax1, bx1)
    iy1 = max(ay1, by1)
    ix2 = min(ax2, bx2)
    iy2 = min(ay2, by2)
    iw = max(0.0, ix2 - ix1)
    ih = max(0.0, iy2 - iy1)
    intersection = iw * ih
    if intersection <= 0:
        return 0.0
    area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
    area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)
    union = area_a + area_b - intersection
    return intersection / union if union > 0 else 0.0


def _reading_order_key(box_px: list[float], *, source_lang: str) -> tuple[float, float]:
    x1, y1, x2, y2 = box_px[:4]
    y_bucket = round(float(y1 or 0.0) / 24.0) * 24.0
    lang = str(source_lang or "").strip().lower().replace("_", "-").split("-", 1)[0]
    x_key = -float(x2 or 0.0) if lang in {"ja", "jp", "jpn"} else float(x1 or 0.0)
    return (y_bucket, x_key)


def _file_sha256(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _bool_setting(settings: dict[str, Any], key: str, default: bool) -> bool:
    value = (settings or {}).get(key)
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _int_setting(settings: dict[str, Any], key: str, default: int, min_value: int, max_value: int) -> int:
    try:
        value = int((settings or {}).get(key))
    except Exception:
        value = default
    return max(min_value, min(max_value, value))


def _float_setting(settings: dict[str, Any], key: str, default: float, min_value: float, max_value: float) -> float:
    try:
        value = float((settings or {}).get(key))
    except Exception:
        value = default
    return max(min_value, min(max_value, value))
