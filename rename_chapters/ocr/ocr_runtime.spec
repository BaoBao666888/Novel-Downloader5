# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_all, copy_metadata

paddleocr_data, paddleocr_bins, paddleocr_hidden = collect_all("paddleocr")
paddlex_data, paddlex_bins, paddlex_hidden = collect_all("paddlex")
paddle_data, paddle_bins, paddle_hidden = collect_all("paddle")
cv2_data, cv2_bins, cv2_hidden = collect_all("cv2")

ocr_core_data = []
ocr_core_bins = []
ocr_core_hidden = []
for module_name in ("imagesize", "pyclipper", "pypdfium2", "bidi", "shapely"):
    data, bins, hidden = collect_all(module_name)
    ocr_core_data += data
    ocr_core_bins += bins
    ocr_core_hidden += hidden

for dist_name in (
    "imagesize",
    "opencv-contrib-python",
    "pyclipper",
    "pypdfium2",
    "python-bidi",
    "shapely",
):
    ocr_core_data += copy_metadata(dist_name)

a = Analysis(
    ["main.py"],
    pathex=["."],
    binaries=paddleocr_bins + paddlex_bins + paddle_bins + cv2_bins + ocr_core_bins,
    datas=paddleocr_data + paddlex_data + paddle_data + cv2_data + ocr_core_data,
    hiddenimports=paddleocr_hidden + paddlex_hidden + paddle_hidden + cv2_hidden + ocr_core_hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="ocr_runtime",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="ocr_runtime",
)
