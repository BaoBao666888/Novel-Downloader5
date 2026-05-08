"""Qt WebEngine runner for eSearch OCR.

This module is launched as a subprocess by :mod:`app.core.ocr_service`.
It keeps the WASM/ONNX runtime out of the Tk main process and returns one JSON
object on stdout.
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import mimetypes
import os
import sys
from pathlib import Path


def _path_uri(path: str) -> str:
    return Path(path).resolve().as_uri()


def _image_to_data_url(path: str) -> str:
    try:
        from PIL import Image
    except Exception:
        Image = None

    if Image is None:
        mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
        with open(path, "rb") as f:
            data = base64.b64encode(f.read()).decode("ascii")
        return f"data:{mime};base64,{data}"

    try:
        with Image.open(path) as img:
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
        data = base64.b64encode(buffer.getvalue()).decode("ascii")
        return f"data:image/png;base64,{data}"
    except Exception:
        mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
        with open(path, "rb") as f:
            data = base64.b64encode(f.read()).decode("ascii")
        return f"data:{mime};base64,{data}"


def _build_html(assets_dir: str) -> str:
    wasm_paths = {
        "ort-wasm.wasm": _path_uri(os.path.join(assets_dir, "ort-wasm.wasm")),
        "ort-wasm-simd.wasm": _path_uri(os.path.join(assets_dir, "ort-wasm-simd.wasm")),
        "ort-wasm-threaded.wasm": _path_uri(os.path.join(assets_dir, "ort-wasm-threaded.wasm")),
        "ort-wasm-simd-threaded.wasm": _path_uri(os.path.join(assets_dir, "ort-wasm-simd-threaded.wasm")),
    }
    ch_zip_url = _path_uri(os.path.join(assets_dir, "ch.zip"))
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="ort.min.js"></script>
  <script src="jszip.min.js"></script>
  <script src="eSearchOCR.umd.js"></script>
</head>
<body>
<script>
const WASM_PATHS = {json.dumps(wasm_paths, ensure_ascii=False)};
const CH_ZIP_URL = {json.dumps(ch_zip_url, ensure_ascii=False)};
let OCR_ENGINE = null;

function extractText(result) {{
  if (!result) return "";
  if (typeof result === "string") return result;
  if (typeof result.text === "string") return result.text;
  if (result.data && typeof result.data.text === "string") return result.data.text;
  if (Array.isArray(result.parragraphs)) {{
    return result.parragraphs.map(p => p.text || (p.parse && p.parse.text) || "").filter(Boolean).join("\\n");
  }}
  if (Array.isArray(result.src)) {{
    return result.src.map(p => p.text || (p.parse && p.parse.text) || "").filter(Boolean).join("\\n");
  }}
  if (Array.isArray(result)) {{
    return result.map(p => p.text || "").filter(Boolean).join("\\n");
  }}
  return "";
}}

function extractBlocks(result) {{
  const source = (result && Array.isArray(result.parragraphs)) ? result.parragraphs
    : (result && Array.isArray(result.src)) ? result.src
    : Array.isArray(result) ? result
    : [];
  return source.map((item) => ({{
    text: item.text || (item.parse && item.parse.text) || "",
    mean: typeof item.mean === "number" ? item.mean : (item.parse && item.parse.mean),
    box: item.box || (item.parse && item.parse.box) || null,
  }}));
}}

async function loadModels() {{
  const response = await fetch(CH_ZIP_URL);
  if (!response.ok) throw new Error("Không đọc được ch.zip: HTTP " + response.status);
  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const det = await zip.file("ppocr_det.onnx").async("arraybuffer");
  const rec = await zip.file("ppocr_rec.onnx").async("arraybuffer");
  const keys = await zip.file("ppocr_keys_v1.txt").async("text");
  return {{ det, rec, keys }};
}}

async function ensureEngine() {{
  if (OCR_ENGINE) return OCR_ENGINE;
  if (!window.ort) throw new Error("Không nạp được onnxruntime-web.");
  const ocrModule = window.eSearchOCR || window.ESearchOCR || window.eSearchOcr;
  const initFn = (ocrModule && ocrModule.init) || (ocrModule && ocrModule.default && ocrModule.default.init) || ocrModule;
  if (typeof initFn !== "function") throw new Error("Không tìm thấy eSearchOCR.init.");
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;
  ort.env.wasm.proxy = false;
  ort.env.wasm.wasmPaths = WASM_PATHS;
  const models = await loadModels();
  OCR_ENGINE = await initFn({{
    det: {{ input: models.det, ratio: 1.0 }},
    rec: {{ input: models.rec, decodeDic: models.keys, optimize: {{ space: false }} }},
    dev: false,
    ort,
  }});
  return OCR_ENGINE;
}}

window.runNovelStudioOcr = async function(imageDataUrl) {{
  try {{
    const engine = await ensureEngine();
    let result;
    if (typeof engine === "function") result = await engine(imageDataUrl);
    else if (typeof engine.ocr === "function") result = await engine.ocr(imageDataUrl);
    else if (typeof engine.recognize === "function") result = await engine.recognize(imageDataUrl);
    else throw new Error("OCR engine không có hàm ocr/recognize.");
    return {{ ok: true, text: extractText(result), blocks: extractBlocks(result) }};
  }} catch (err) {{
    return {{ ok: false, error: String((err && (err.stack || err.message)) || err) }};
  }}
}};
</script>
</body>
</html>"""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--assets-dir", required=True)
    parser.add_argument("--timeout", type=int, default=180)
    args = parser.parse_args()

    os.environ.setdefault("QTWEBENGINE_DISABLE_SANDBOX", "1")
    flags = os.environ.get("QTWEBENGINE_CHROMIUM_FLAGS", "")
    if "--no-sandbox" not in flags:
        os.environ["QTWEBENGINE_CHROMIUM_FLAGS"] = f"{flags} --no-sandbox".strip()

    try:
        from PyQt6.QtCore import QTimer, QUrl
        from PyQt6.QtWebEngineCore import QWebEnginePage, QWebEngineSettings
        from PyQt6.QtWidgets import QApplication
    except Exception as exc:
        print(json.dumps({"ok": False, "error": f"Thiếu PyQt6-WebEngine: {exc}"}, ensure_ascii=False))
        return 1

    class QuietPage(QWebEnginePage):
        def javaScriptConsoleMessage(self, level, message, line_number, source_id):  # noqa: N802
            return

    app = QApplication([sys.argv[0]])
    page = QuietPage()
    settings = page.settings()
    try:
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessFileUrls, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, True)
    except Exception:
        pass

    image_data_url = _image_to_data_url(args.image)
    html = _build_html(args.assets_dir)
    finished = {"done": False}

    def finish(payload: dict, code: int = 0):
        if finished["done"]:
            return
        finished["done"] = True
        print(json.dumps(payload, ensure_ascii=False))
        app.exit(code)

    def on_loaded(ok: bool):
        if not ok:
            finish({"ok": False, "error": "Không nạp được OCR HTML runner."}, 1)
            return
        script = f"""
        window.__novelStudioOcrDone = false;
        window.__novelStudioOcrResult = null;
        window.runNovelStudioOcr({json.dumps(image_data_url)})
          .then((result) => {{
            window.__novelStudioOcrResult = result || {{ ok: false, error: "Không có kết quả OCR." }};
            window.__novelStudioOcrDone = true;
          }})
          .catch((err) => {{
            window.__novelStudioOcrResult = {{ ok: false, error: String((err && (err.stack || err.message)) || err) }};
            window.__novelStudioOcrDone = true;
          }});
        """
        page.runJavaScript(script)
        poll_timer.start(250)

    def poll_result():
        page.runJavaScript(
            "window.__novelStudioOcrDone ? window.__novelStudioOcrResult : null",
            lambda result: finish(result, 0) if result is not None else None,
        )

    page.loadFinished.connect(on_loaded)
    poll_timer = QTimer()
    poll_timer.timeout.connect(poll_result)
    QTimer.singleShot(max(30, int(args.timeout)) * 1000, lambda: finish({"ok": False, "error": "OCR runner timeout."}, 1))
    page.setHtml(html, QUrl.fromLocalFile(os.path.join(os.path.abspath(args.assets_dir), "runner.html")))
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
