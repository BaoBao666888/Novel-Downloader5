from __future__ import annotations

import importlib.util
from typing import Any

from reader_backend.services.comic_ocr import models


class ComicOcrEngineError(RuntimeError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def engine_version(settings: dict[str, Any]) -> str:
    engine = str(settings.get("engine") or "paddleocr").strip().lower() or "paddleocr"
    if engine == "stub":
        return "stub-0"
    if engine == "paddleocr":
        try:
            import paddleocr

            return str(getattr(paddleocr, "__version__", "") or "paddleocr")
        except Exception:
            return "paddleocr-unavailable"
    return f"{engine}-unknown"


def engine_status(settings: dict[str, Any]) -> dict[str, Any]:
    engine = str(settings.get("engine") or "paddleocr").strip().lower() or "paddleocr"
    if engine == "stub":
        return {"engine": engine, "ready": True, "version": engine_version(settings), "reason": ""}
    if engine == "paddleocr":
        ready = importlib.util.find_spec("paddleocr") is not None
        return {
            "engine": engine,
            "ready": ready,
            "version": engine_version(settings),
            "reason": "" if ready else "OCR_ENGINE_NOT_READY",
        }
    return {"engine": engine, "ready": False, "version": engine_version(settings), "reason": "OCR_ENGINE_UNSUPPORTED"}


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
    if engine == "paddleocr":
        return _recognize_paddleocr(image_bytes, source_lang=source_lang, width=width, height=height)
    raise ComicOcrEngineError("OCR_ENGINE_UNSUPPORTED", f"Chưa hỗ trợ OCR engine: {engine}")


def _recognize_paddleocr(
    image_bytes: bytes,
    *,
    source_lang: str,
    width: int,
    height: int,
) -> list[dict[str, Any]]:
    try:
        import numpy as np
        from PIL import Image
        from paddleocr import PaddleOCR

        import io
    except Exception as exc:
        raise ComicOcrEngineError("OCR_ENGINE_NOT_READY", "PaddleOCR hoặc dependency ảnh chưa được cài.") from exc

    try:
        lang = "en" if str(source_lang or "").strip().lower() == "en" else str(source_lang or "en").strip().lower()
        ocr = PaddleOCR(lang=lang, use_angle_cls=True, show_log=False)
        with Image.open(io.BytesIO(image_bytes or b"")) as image:
            arr = np.array(image.convert("RGB"))
        raw_result = ocr.ocr(arr, cls=True)
    except ComicOcrEngineError:
        raise
    except Exception as exc:
        raise ComicOcrEngineError("OCR_FAILED", str(exc) or "OCR ảnh thất bại.") from exc

    rows = _flatten_paddleocr_result(raw_result)
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
