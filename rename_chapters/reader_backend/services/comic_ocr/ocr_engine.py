from __future__ import annotations

import contextlib
import io
import os
import tempfile
from typing import Any

from app.core import ocr_service
from reader_backend.services.comic_ocr import models


class ComicOcrEngineError(RuntimeError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


_LANG_MODEL_CANDIDATES: dict[str, tuple[str, ...]] = {
    "en": ("ppocrv5_mobile_en", "ppocrv5_mobile_zh"),
    "eng": ("ppocrv5_mobile_en", "ppocrv5_mobile_zh"),
    "zh": ("ppocrv5_mobile_zh", "ppocrv5_server_zh"),
    "ch": ("ppocrv5_mobile_zh", "ppocrv5_server_zh"),
    "cn": ("ppocrv5_mobile_zh", "ppocrv5_server_zh"),
    "zho": ("ppocrv5_mobile_zh", "ppocrv5_server_zh"),
    "zh-hans": ("ppocrv5_mobile_zh", "ppocrv5_server_zh"),
    "zh-cn": ("ppocrv5_mobile_zh", "ppocrv5_server_zh"),
    "zh-hant": ("ppocrv3_mobile_cht", "ppocrv5_mobile_zh"),
    "zh-tw": ("ppocrv3_mobile_cht", "ppocrv5_mobile_zh"),
    "cht": ("ppocrv3_mobile_cht", "ppocrv5_mobile_zh"),
    "ja": ("ppocrv3_mobile_japan", "ppocrv5_mobile_zh"),
    "jp": ("ppocrv3_mobile_japan", "ppocrv5_mobile_zh"),
    "jpn": ("ppocrv3_mobile_japan", "ppocrv5_mobile_zh"),
    "ko": ("ppocrv5_mobile_korean",),
    "kr": ("ppocrv5_mobile_korean",),
    "kor": ("ppocrv5_mobile_korean",),
    "korean": ("ppocrv5_mobile_korean",),
    "vi": ("ppocrv5_mobile_latin", "ppocrv5_mobile_en"),
    "vie": ("ppocrv5_mobile_latin", "ppocrv5_mobile_en"),
    "la": ("ppocrv5_mobile_latin", "ppocrv5_mobile_en"),
    "latin": ("ppocrv5_mobile_latin", "ppocrv5_mobile_en"),
}


def engine_version(settings: dict[str, Any], *, source_lang: str = "") -> str:
    engine = str(settings.get("engine") or "paddleocr").strip().lower() or "paddleocr"
    if engine == "stub":
        return "stub-0"
    if engine in {"paddleocr", "paddle"}:
        status = ocr_service.get_ocr_runtime_status(query_version=True)
        return _paddle_engine_version(settings, source_lang=source_lang, runtime_status=status)
    return f"{engine}-unknown"


def engine_status(settings: dict[str, Any], *, source_lang: str = "") -> dict[str, Any]:
    engine = str(settings.get("engine") or "paddleocr").strip().lower() or "paddleocr"
    if engine == "stub":
        return {"engine": engine, "ready": True, "version": engine_version(settings, source_lang=source_lang), "reason": ""}
    if engine in {"paddleocr", "paddle"}:
        runtime_status = ocr_service.get_ocr_runtime_status(query_version=False)
        image_dependency = image_dependency_status()
        base = {
            "engine": "paddleocr",
            "ready": False,
            "version": _paddle_engine_version(settings, source_lang=source_lang, runtime_status=runtime_status),
            "reason": "",
            "message": "",
            "runtime_installed": bool(runtime_status.get("installed")),
            "runtime_path": str(runtime_status.get("exe_path") or ""),
            "model_cache_dir": str(runtime_status.get("model_cache_dir") or ocr_service.ocr_model_cache_dir()),
            "image_dependency_installed": bool(image_dependency.get("installed")),
            "image_dependency_version": str(image_dependency.get("version") or ""),
        }
        if not runtime_status.get("installed"):
            base["reason"] = "OCR_RUNTIME_NOT_READY"
            base["message"] = "Chưa cài OCR runtime. Mở OCR > Quản lý model để cài runtime trước."
            return base
        if not image_dependency.get("installed"):
            base["reason"] = "OCR_IMAGE_DEPENDENCY_NOT_READY"
            base["message"] = str(image_dependency.get("message") or "Thiếu Pillow/PIL để xử lý ảnh OCR.")
            return base
        model_key = _select_model_key(source_lang, settings=settings, require_downloaded=True)
        if not model_key:
            requested = _select_model_key(source_lang, settings=settings, require_downloaded=False)
            label = _model_label(requested)
            base["reason"] = "OCR_MODEL_NOT_READY"
            base["message"] = f"Chưa có model OCR {label}. Mở OCR > Quản lý model để tải model PaddleOCR."
            base["model_key"] = requested
            base["model_label"] = label
            return base
        option = ocr_service.get_paddle_model_option(model_key)
        base.update(
            {
                "ready": True,
                "reason": "",
                "message": "",
                "model_key": model_key,
                "model_label": str(option.get("label") or model_key),
                "language": str(option.get("lang") or ""),
            }
        )
        return base
    return {"engine": engine, "ready": False, "version": engine_version(settings, source_lang=source_lang), "reason": "OCR_ENGINE_UNSUPPORTED"}


def image_dependency_status() -> dict[str, Any]:
    try:
        import PIL
        from PIL import Image  # noqa: F401
    except Exception as exc:
        return {
            "installed": False,
            "version": "",
            "reason": "OCR_IMAGE_DEPENDENCY_NOT_READY",
            "message": "Thiếu Pillow/PIL để xử lý ảnh OCR. Cài requirements cho Python đang chạy reader_server.py.",
            "error": str(exc),
        }
    return {
        "installed": True,
        "version": str(getattr(PIL, "__version__", "") or ""),
        "reason": "",
        "message": "",
    }


def _paddle_engine_version(settings: dict[str, Any], *, source_lang: str = "", runtime_status: dict[str, Any] | None = None) -> str:
    status = runtime_status or {}
    version = str(status.get("version") or status.get("target_version") or "runtime").strip()
    model_key = _select_model_key(source_lang, settings=settings, require_downloaded=False)
    suffix = f":{model_key}" if model_key else ""
    return f"paddle-runtime-{version}{suffix}"


def _select_model_key(
    source_lang: str,
    *,
    settings: dict[str, Any],
    require_downloaded: bool,
) -> str:
    configured = str((settings or {}).get("model_key") or "").strip()
    candidates: list[str] = []
    if configured:
        candidates.append(configured)
    lang = _normalize_lang(source_lang)
    candidates.extend(_LANG_MODEL_CANDIDATES.get(lang, ()))
    candidates.append(ocr_service.DEFAULT_PADDLE_MODEL_KEY)
    seen: set[str] = set()
    ordered = [key for key in candidates if key and not (key in seen or seen.add(key))]
    if not require_downloaded:
        return ordered[0] if ordered else ocr_service.DEFAULT_PADDLE_MODEL_KEY
    for key in ordered:
        if ocr_service.is_paddle_model_downloaded(key):
            return key
    return ""


def _normalize_lang(source_lang: str) -> str:
    text = str(source_lang or "").strip().lower().replace("_", "-")
    if not text:
        return ""
    if text.startswith("zh-hant") or text.startswith("zh-tw"):
        return "zh-hant"
    if text.startswith("zh-hans") or text.startswith("zh-cn"):
        return "zh"
    return text.split("-", 1)[0]


def _model_label(model_key: str) -> str:
    if not model_key:
        return "phù hợp"
    try:
        option = ocr_service.get_paddle_model_option(model_key)
        return str(option.get("label") or model_key)
    except Exception:
        return model_key


def _runtime_blocks_to_comic_blocks(raw_blocks: Any, *, width: int, height: int) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for idx, item in enumerate(raw_blocks or []):
        if not isinstance(item, dict):
            continue
        text = str(item.get("source_text") or item.get("text") or "").strip()
        if not text:
            continue
        polygon_px = _runtime_polygon(item)
        box_px = _runtime_box(item, polygon_px)
        if not box_px:
            continue
        block = models.ComicOcrBlock(
            id=f"b{idx}",
            box=models.normalize_pixel_box(box_px, width=width, height=height),
            polygon=models.normalize_pixel_polygon(polygon_px, width=width, height=height),
            source_text=text,
            translated_text="",
            confidence=_safe_float(item.get("confidence", item.get("score", 0.0))),
            order=idx + 1,
            style_hint={"align": "center", "tone": "dialog"},
        )
        out.append(block.to_dict())
    return out


def _runtime_polygon(item: dict[str, Any]) -> list[list[float]]:
    raw = item.get("polygon") or item.get("points") or item.get("dt_poly")
    points: list[list[float]] = []
    if isinstance(raw, list):
        for point in raw:
            if isinstance(point, (list, tuple)) and len(point) >= 2:
                points.append([_safe_float(point[0]), _safe_float(point[1])])
    if points:
        return points
    box = item.get("box")
    if isinstance(box, (list, tuple)) and len(box) >= 4:
        x0, y0, x1, y1 = [_safe_float(value) for value in box[:4]]
        return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
    return []


def _runtime_box(item: dict[str, Any], polygon_px: list[list[float]]) -> list[float]:
    box = item.get("box")
    if isinstance(box, (list, tuple)) and len(box) >= 4:
        x0, y0, x1, y1 = [_safe_float(value) for value in box[:4]]
        return [x0, y0, max(0.0, x1 - x0), max(0.0, y1 - y0)]
    xs = [point[0] for point in polygon_px if len(point) >= 2]
    ys = [point[1] for point in polygon_px if len(point) >= 2]
    if not xs or not ys:
        return []
    x0, x1 = min(xs), max(xs)
    y0, y1 = min(ys), max(ys)
    return [x0, y0, max(0.0, x1 - x0), max(0.0, y1 - y0)]


def _safe_float(value: Any) -> float:
    try:
        return float(value or 0.0)
    except Exception:
        return 0.0


def recognize(
    image_bytes: bytes,
    *,
    source_lang: str,
    settings: dict[str, Any],
    width: int,
    height: int,
) -> list[dict[str, Any]]:
    engine = str(settings.get("engine") or "paddleocr").strip().lower() or "paddleocr"
    if engine == "stub":
        return []
    if engine in {"paddleocr", "paddle"}:
        return _recognize_paddleocr(image_bytes, source_lang=source_lang, settings=settings, width=width, height=height)
    raise ComicOcrEngineError("OCR_ENGINE_UNSUPPORTED", f"Chưa hỗ trợ OCR engine: {engine}")


def _recognize_paddleocr(
    image_bytes: bytes,
    *,
    source_lang: str,
    settings: dict[str, Any],
    width: int,
    height: int,
) -> list[dict[str, Any]]:
    dependency = image_dependency_status()
    if not dependency.get("installed"):
        raise ComicOcrEngineError(
            str(dependency.get("reason") or "OCR_IMAGE_DEPENDENCY_NOT_READY"),
            str(dependency.get("message") or "Thiếu Pillow/PIL để xử lý ảnh OCR."),
        )
    from PIL import Image

    status = engine_status(settings, source_lang=source_lang)
    if not status.get("ready"):
        raise ComicOcrEngineError(
            str(status.get("reason") or "OCR_ENGINE_NOT_READY"),
            str(status.get("message") or "OCR engine chưa sẵn sàng."),
        )
    model_key = str(status.get("model_key") or _select_model_key(source_lang, settings=settings, require_downloaded=True))
    temp_path = ""
    try:
        tmp_dir = os.path.join(ocr_service.ocr_model_cache_dir(), "temp", "comic_ocr")
        os.makedirs(tmp_dir, exist_ok=True)
        fd, temp_path = tempfile.mkstemp(prefix="comic_ocr_", suffix=".png", dir=tmp_dir)
        os.close(fd)
        with Image.open(io.BytesIO(image_bytes or b"")) as image:
            image.convert("RGB").save(temp_path, format="PNG")
        payload = ocr_service.recognize_image(
            temp_path,
            timeout_sec=300,
            engine="paddle",
            model_key=model_key,
        )
    except ComicOcrEngineError:
        raise
    except Exception as exc:
        raise ComicOcrEngineError("OCR_FAILED", str(exc) or "OCR ảnh thất bại.") from exc
    finally:
        if temp_path:
            with contextlib.suppress(Exception):
                os.remove(temp_path)

    blocks = _runtime_blocks_to_comic_blocks(payload.get("blocks") if isinstance(payload, dict) else [], width=width, height=height)
    if blocks:
        return blocks
    rows = _flatten_paddleocr_result(payload.get("raw_result") if isinstance(payload, dict) else None)
    out: list[dict[str, Any]] = []
    for idx, row in enumerate(rows):
        polygon_px, text, confidence = row
        if not text.strip():
            continue
        xs = [float(point[0]) for point in polygon_px if len(point) >= 2]
        ys = [float(point[1]) for point in polygon_px if len(point) >= 2]
        if not xs or not ys:
            continue
        x0, x1 = min(xs), max(xs)
        y0, y1 = min(ys), max(ys)
        block = models.ComicOcrBlock(
            id=f"b{idx}",
            box=models.normalize_pixel_box([x0, y0, x1 - x0, y1 - y0], width=width, height=height),
            polygon=models.normalize_pixel_polygon(polygon_px, width=width, height=height),
            source_text=text.strip(),
            translated_text="",
            confidence=float(confidence or 0.0),
            order=idx + 1,
            style_hint={"align": "center", "tone": "dialog"},
        )
        out.append(block.to_dict())
    return out


def _flatten_paddleocr_result(raw_result: Any) -> list[tuple[list[list[float]], str, float]]:
    rows: list[tuple[list[list[float]], str, float]] = []
    page_items = raw_result
    if isinstance(raw_result, list) and len(raw_result) == 1 and isinstance(raw_result[0], list):
        page_items = raw_result[0]
    for item in page_items or []:
        if not isinstance(item, (list, tuple)) or len(item) < 2:
            continue
        polygon = item[0]
        text_info = item[1]
        if not isinstance(text_info, (list, tuple)) or not text_info:
            continue
        text = str(text_info[0] or "")
        confidence = float(text_info[1] or 0.0) if len(text_info) > 1 else 0.0
        points: list[list[float]] = []
        for point in polygon or []:
            if isinstance(point, (list, tuple)) and len(point) >= 2:
                points.append([float(point[0] or 0.0), float(point[1] or 0.0)])
        rows.append((points, text, confidence))
    return rows
