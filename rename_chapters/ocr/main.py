import argparse
import contextlib
import json
import os
import sys
from typing import Any

__version__ = "0.1.2"


PADDLE_MODEL_OPTIONS: tuple[dict[str, str], ...] = (
    {
        "key": "ppocrv5_mobile_zh",
        "label": "PP-OCRv5 Mobile - Chinese light",
        "lang": "ch",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "PP-OCRv5_mobile_rec",
    },
    {
        "key": "ppocrv5_server_zh",
        "label": "PP-OCRv5 Server - Chinese higher accuracy",
        "lang": "ch",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_server_det",
        "rec_model": "PP-OCRv5_server_rec",
    },
    {
        "key": "ppocrv5_mobile_latin",
        "label": "PP-OCRv5 Mobile - Latin/Vietnamese",
        "lang": "la",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "latin_PP-OCRv5_mobile_rec",
    },
    {
        "key": "ppocrv5_mobile_en",
        "label": "PP-OCRv5 Mobile - English",
        "lang": "en",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "en_PP-OCRv5_mobile_rec",
    },
    {
        "key": "ppocrv5_mobile_korean",
        "label": "PP-OCRv5 Mobile - Korean",
        "lang": "korean",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "korean_PP-OCRv5_mobile_rec",
    },
    {
        "key": "ppocrv5_mobile_eslav",
        "label": "PP-OCRv5 Mobile - East Slavic",
        "lang": "ru",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "eslav_PP-OCRv5_mobile_rec",
    },
    {
        "key": "ppocrv5_mobile_cyrillic",
        "label": "PP-OCRv5 Mobile - Cyrillic",
        "lang": "cyrillic",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "cyrillic_PP-OCRv5_mobile_rec",
    },
    {
        "key": "ppocrv5_mobile_thai",
        "label": "PP-OCRv5 Mobile - Thai",
        "lang": "th",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "th_PP-OCRv5_mobile_rec",
    },
    {
        "key": "ppocrv5_mobile_greek",
        "label": "PP-OCRv5 Mobile - Greek",
        "lang": "el",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "el_PP-OCRv5_mobile_rec",
    },
    {
        "key": "ppocrv5_mobile_arabic",
        "label": "PP-OCRv5 Mobile - Arabic",
        "lang": "ar",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "arabic_PP-OCRv5_mobile_rec",
    },
    {
        "key": "ppocrv5_mobile_devanagari",
        "label": "PP-OCRv5 Mobile - Devanagari",
        "lang": "hi",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "devanagari_PP-OCRv5_mobile_rec",
    },
    {
        "key": "ppocrv5_mobile_tamil",
        "label": "PP-OCRv5 Mobile - Tamil",
        "lang": "ta",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "ta_PP-OCRv5_mobile_rec",
    },
    {
        "key": "ppocrv5_mobile_telugu",
        "label": "PP-OCRv5 Mobile - Telugu",
        "lang": "te",
        "ocr_version": "PP-OCRv5",
        "det_model": "PP-OCRv5_mobile_det",
        "rec_model": "te_PP-OCRv5_mobile_rec",
    },
    {
        "key": "ppocrv3_mobile_japan",
        "label": "PP-OCRv3 Mobile - Japanese",
        "lang": "japan",
        "ocr_version": "PP-OCRv3",
        "det_model": "",
        "rec_model": "japan_PP-OCRv3_mobile_rec",
    },
    {
        "key": "ppocrv3_mobile_cht",
        "label": "PP-OCRv3 Mobile - Chinese Traditional",
        "lang": "chinese_cht",
        "ocr_version": "PP-OCRv3",
        "det_model": "",
        "rec_model": "chinese_cht_PP-OCRv3_mobile_rec",
    },
)
DEFAULT_MODEL_KEY = "ppocrv5_mobile_zh"
_PADDLE_ENGINES: dict[str, Any] = {}
_ACTIVE_CACHE_DIR = ""


def _emit(payload: dict[str, Any], *, exit_code: int = 0):
    print(json.dumps(payload, ensure_ascii=True), flush=True)
    raise SystemExit(exit_code)


def _ascii_message(exc: Exception) -> str:
    parts: list[str] = []
    current: BaseException | None = exc
    seen: set[int] = set()
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        message = str(current).strip()
        parts.append(f"{type(current).__name__}: {message}" if message else type(current).__name__)
        current = current.__cause__ or current.__context__
    text = " | caused by: ".join(parts) or type(exc).__name__
    return text.encode("ascii", "backslashreplace").decode("ascii")


def _runtime_root() -> str:
    if getattr(sys, "frozen", False):
        return os.path.dirname(os.path.abspath(sys.executable))
    return os.path.dirname(os.path.abspath(__file__))


def _default_cache_dir() -> str:
    return os.path.join(_runtime_root(), "models")


def _configure_cache_dir(path: str = "") -> str:
    global _ACTIVE_CACHE_DIR
    cache_dir = os.path.abspath(path or os.environ.get("NOVEL_STUDIO_OCR_MODEL_DIR") or _default_cache_dir())
    os.makedirs(cache_dir, exist_ok=True)
    os.environ["PADDLE_PDX_CACHE_HOME"] = cache_dir
    os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")
    _ACTIVE_CACHE_DIR = cache_dir
    return cache_dir


def _option(model_key: str = "") -> dict[str, str]:
    key = (model_key or DEFAULT_MODEL_KEY).strip()
    for item in PADDLE_MODEL_OPTIONS:
        if item["key"] == key:
            return dict(item)
    raise RuntimeError(f"Unsupported PaddleOCR model key: {key}")


def _load_paddleocr_class():
    with _suppress_vendor_output():
        from paddleocr import PaddleOCR

    return PaddleOCR


@contextlib.contextmanager
def _suppress_vendor_output():
    try:
        stdout_fd = sys.stdout.fileno()
        stderr_fd = sys.stderr.fileno()
    except Exception:
        with open(os.devnull, "w", encoding="utf-8", errors="ignore") as stream:
            with contextlib.redirect_stdout(stream), contextlib.redirect_stderr(stream):
                yield
        return

    saved_stdout = os.dup(stdout_fd)
    saved_stderr = os.dup(stderr_fd)
    with open(os.devnull, "w", encoding="utf-8", errors="ignore") as stream:
        try:
            sys.stdout.flush()
            sys.stderr.flush()
            os.dup2(stream.fileno(), stdout_fd)
            os.dup2(stream.fileno(), stderr_fd)
            with contextlib.redirect_stdout(stream), contextlib.redirect_stderr(stream):
                yield
        finally:
            sys.stdout.flush()
            sys.stderr.flush()
            os.dup2(saved_stdout, stdout_fd)
            os.dup2(saved_stderr, stderr_fd)
            os.close(saved_stdout)
            os.close(saved_stderr)


def _create_engine(option: dict[str, str]):
    PaddleOCR = _load_paddleocr_class()
    modern_kwargs: dict[str, Any] = {
        "lang": option["lang"],
        "use_doc_orientation_classify": False,
        "use_doc_unwarping": False,
        "use_textline_orientation": False,
    }
    if option.get("ocr_version"):
        modern_kwargs["ocr_version"] = option["ocr_version"]
    if option.get("det_model"):
        modern_kwargs["text_detection_model_name"] = option["det_model"]
    if option.get("rec_model"):
        modern_kwargs["text_recognition_model_name"] = option["rec_model"]
    try:
        with _suppress_vendor_output():
            return PaddleOCR(**modern_kwargs)
    except TypeError:
        legacy_kwargs = {"lang": option["lang"], "use_angle_cls": True, "show_log": False}
        with contextlib.suppress(TypeError):
            legacy_kwargs["use_gpu"] = False
            with _suppress_vendor_output():
                return PaddleOCR(**legacy_kwargs)
        legacy_kwargs.pop("use_gpu", None)
        with _suppress_vendor_output():
            return PaddleOCR(**legacy_kwargs)


def _engine(option: dict[str, str]):
    key = option["key"]
    if key not in _PADDLE_ENGINES:
        _PADDLE_ENGINES[key] = _create_engine(option)
    return _PADDLE_ENGINES[key]


def _recognize(image_path: str, model_key: str):
    option = _option(model_key)
    engine = _engine(option)
    with _suppress_vendor_output():
        if hasattr(engine, "predict"):
            result = engine.predict(image_path)
        elif hasattr(engine, "ocr"):
            result = engine.ocr(image_path, cls=True)
        else:
            raise RuntimeError("PaddleOCR API has no predict/ocr method.")

    lines, blocks = _extract_lines(result)
    return {
        "ok": True,
        "text": "\n".join(line for line in lines if line).strip(),
        "blocks": blocks,
        "engine": "paddle",
        "language": option["lang"],
        "model_key": option["key"],
        "model_label": option["label"],
        "model": option.get("rec_model") or option["key"],
    }


def _extract_lines(result: Any) -> tuple[list[str], list[dict[str, Any]]]:
    lines: list[str] = []
    blocks: list[dict[str, Any]] = []

    def add(text: Any, score: Any = None, box: Any = None):
        text = "" if text is None else str(text).strip()
        if not text:
            return
        item = {"text": text}
        if score is not None:
            with contextlib.suppress(Exception):
                item["score"] = float(score)
        if box is not None:
            item["box"] = _jsonable(box)
        lines.append(text)
        blocks.append(item)

    def field(data: dict[str, Any], *names: str) -> Any:
        for name in names:
            if name in data and data[name] is not None:
                return data[name]
        return None

    def is_sequence(value: Any) -> bool:
        return not isinstance(value, (str, bytes, dict)) and hasattr(value, "__len__")

    def seq_get(value: Any, idx: int) -> Any:
        if not is_sequence(value):
            return None
        with contextlib.suppress(Exception):
            if idx < len(value):
                return value[idx]
        return None

    def parse_dict(data: dict[str, Any]) -> bool:
        rec_text = data.get("rec_text")
        if rec_text is not None and str(rec_text).strip():
            add(rec_text, data.get("rec_score"), data.get("rec_box"))
            return True
        rec_texts = field(data, "rec_texts", "texts")
        if is_sequence(rec_texts):
            scores = field(data, "rec_scores", "scores")
            boxes = field(data, "rec_boxes", "dt_polys", "rec_polys")
            for idx, text in enumerate(rec_texts):
                add(text, seq_get(scores, idx), seq_get(boxes, idx))
            return True
        return False

    def parse_old_line(item: Any) -> bool:
        if not isinstance(item, (list, tuple)) or len(item) < 2:
            return False
        candidate = item[1]
        if isinstance(candidate, (list, tuple)) and candidate and isinstance(candidate[0], str):
            add(candidate[0], candidate[1] if len(candidate) > 1 else None, item[0])
            return True
        return False

    def walk(item: Any):
        if item is None:
            return
        if isinstance(item, dict):
            if parse_dict(item):
                return
            for value in item.values():
                walk(value)
            return
        for attr in ("json", "res", "data"):
            if hasattr(item, attr):
                with contextlib.suppress(Exception):
                    value = getattr(item, attr)
                    walk(value() if callable(value) else value)
                    return
        if hasattr(item, "to_json"):
            with contextlib.suppress(Exception):
                walk(item.to_json())
                return
        if parse_old_line(item):
            return
        if isinstance(item, (list, tuple)):
            for child in item:
                walk(child)

    walk(result)
    return lines, blocks


def _jsonable(value: Any) -> Any:
    if hasattr(value, "tolist"):
        with contextlib.suppress(Exception):
            return value.tolist()
    if isinstance(value, tuple):
        return [_jsonable(item) for item in value]
    if isinstance(value, list):
        return [_jsonable(item) for item in value]
    return value


def _check_deps(cache_dir: str) -> dict[str, Any]:
    names = {
        "paddle": "paddle",
        "paddleocr": "paddleocr",
        "paddlex": "paddlex",
        "cv2": "cv2",
        "numpy": "numpy",
        "Pillow": "PIL",
        "pyclipper": "pyclipper",
        "pypdfium2": "pypdfium2",
        "shapely": "shapely",
    }
    deps: dict[str, bool] = {}
    for label, module_name in names.items():
        try:
            __import__(module_name)
            deps[label] = True
        except Exception:
            deps[label] = False
    return {
        "ok": all(deps.values()),
        "version": __version__,
        "cache_dir": cache_dir,
        "deps": deps,
        "missing": [name for name, available in deps.items() if not available],
    }


def _parser():
    parser = argparse.ArgumentParser(description="Novel Studio OCR runtime")
    parser.add_argument("--version", action="store_true", help="Show runtime version")
    parser.add_argument("--cache-dir", default="", help="Model/cache directory")
    sub = parser.add_subparsers(dest="command")

    models = sub.add_parser("models", help="List OCR models")
    models.add_argument("--cache-dir", default=argparse.SUPPRESS, help="Model/cache directory")

    check_deps = sub.add_parser("check-deps", help="Check PaddleOCR runtime dependencies")
    check_deps.add_argument("--cache-dir", default=argparse.SUPPRESS, help="Model/cache directory")

    download = sub.add_parser("download-model", help="Download/cache PaddleOCR model")
    download.add_argument("--model-key", default=DEFAULT_MODEL_KEY)
    download.add_argument("--cache-dir", default=argparse.SUPPRESS, help="Model/cache directory")

    recognize = sub.add_parser("recognize", help="Run OCR on an image")
    recognize.add_argument("--input", required=True)
    recognize.add_argument("--model-key", default=DEFAULT_MODEL_KEY)
    recognize.add_argument("--cache-dir", default=argparse.SUPPRESS, help="Model/cache directory")
    return parser


def main():
    with contextlib.suppress(Exception):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")

    parser = _parser()
    args = parser.parse_args()
    if args.version:
        print(__version__)
        return
    cache_dir = _configure_cache_dir(getattr(args, "cache_dir", ""))
    try:
        if args.command == "models":
            _emit({"ok": True, "version": __version__, "cache_dir": cache_dir, "models": list(PADDLE_MODEL_OPTIONS)})
        if args.command == "check-deps":
            _emit(_check_deps(cache_dir))
        if args.command == "download-model":
            option = _option(args.model_key)
            _engine(option)
            _emit(
                {
                    "ok": True,
                    "version": __version__,
                    "model_key": option["key"],
                    "label": option["label"],
                    "cache_dir": _ACTIVE_CACHE_DIR,
                }
            )
        if args.command == "recognize":
            payload = _recognize(args.input, args.model_key)
            payload["cache_dir"] = _ACTIVE_CACHE_DIR
            _emit(payload)
        parser.print_help()
    except Exception as exc:
        _emit({"ok": False, "error": _ascii_message(exc)}, exit_code=1)


if __name__ == "__main__":
    main()
