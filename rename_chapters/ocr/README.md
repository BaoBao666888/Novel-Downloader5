# OCR runtime

Runtime OCR tách riêng cho Novel Studio. App chính chỉ gọi `ocr_runtime.exe`,
không bundle PaddleOCR trực tiếp.

## Local test

Create/use a Windows Python 3.12 venv in this folder:

```bat
cd ocr
..\.venv\Scripts\python.exe -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe main.py --version
.venv\Scripts\python.exe main.py models
.venv\Scripts\python.exe main.py --cache-dir "..\local\ocr_models" check-deps
.venv\Scripts\python.exe main.py --cache-dir "..\local\ocr_models" download-model --model-key ppocrv5_mobile_zh
.venv\Scripts\python.exe main.py --cache-dir "..\local\ocr_models" recognize --input "D:\path\image.png" --model-key ppocrv5_mobile_zh
```

`ppocrv5_mobile_zh` is the light Chinese model. Runtime success/error JSON is
emitted with ASCII-safe text so the packaged exe does not break on console
encoding. Novel Studio passes `BASE_DIR\local\ocr_models` as the PaddleX cache
directory, so models stay inside the app folder instead of `C:\Users\...\.paddlex`.
Run `check-deps` on the packaged exe after building; it should report `"ok": true`
before uploading the runtime zip.

This runtime intentionally installs `paddleocr` instead of `paddleocr[all]`.
The `[all]` extra pulls document parsing and LLM dependencies that are not used
by Novel Studio OCR.

## Build

```bat
cd ocr
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\pyinstaller.exe --clean ocr_runtime.spec
```

Gói phát hành là thư mục:

```text
ocr/dist/ocr_runtime/
```

Zip giống `reader_server` dạng onedir: nén nguyên thư mục `ocr_runtime` rồi đưa
link zip vào `version.json`. Runtime phải giữ cả `ocr_runtime.exe` và thư mục
`_internal`; không zip riêng mỗi file exe.

```json
"ocr_runtime": {
  "version": "0.1.2",
  "url": "https://drive.google.com/...",
  "exe_name": "ocr_runtime.exe"
}
```

Novel Studio sẽ tải zip, giải nén vào `tools/ocr_runtime/`, rồi gọi
`tools/ocr_runtime/ocr_runtime.exe`.
