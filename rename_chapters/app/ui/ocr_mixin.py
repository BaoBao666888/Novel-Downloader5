import json
import os
import threading
import tkinter as tk
from tkinter import ttk, messagebox

from app.core import ocr_service
from app.paths import BASE_DIR
from app.ui.update_dialog import fetch_manifest_from_url
from app.ui.ocr_window import OcrWindow


class OcrMixin:
    def _open_ocr_window(self):
        if not hasattr(self, "_ocr_windows"):
            self._ocr_windows = set()
        win = OcrWindow(self)
        self._ocr_windows.add(win)
        try:
            win.lift()
            win.focus_force()
        except Exception:
            pass
        return win

    def _open_ocr_model_manager(self):
        win = self._open_ocr_window()
        try:
            win.open_model_manager()
        except Exception as exc:
            messagebox.showerror("OCR model", str(exc), parent=win)
        return win

    def _install_ocr_runtime_from_menu(self):
        return self._ensure_ocr_runtime_installed_prompt(parent=self, force=True)

    def _ocr_runtime_meta(self) -> dict:
        data = {}
        use_local_only = bool(getattr(self, "use_local_manifest_only", False))
        if not use_local_only:
            manifest_url = getattr(self, "VERSION_CHECK_URL", "")
            if manifest_url:
                try:
                    data = fetch_manifest_from_url(manifest_url, timeout=10) or {}
                except Exception:
                    data = {}
        if not data:
            meta_path = os.path.join(BASE_DIR, "version.json")
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                data = {}
        meta = data.get("ocr_runtime") if isinstance(data, dict) else {}
        return meta if isinstance(meta, dict) else {}

    def _ensure_ocr_runtime_installed_prompt(self, parent=None, force: bool = False) -> bool:
        meta = self._ocr_runtime_meta()
        status = ocr_service.get_ocr_runtime_status(meta)
        if status.get("installed") and not (force or status.get("needs_update")):
            return True

        if status.get("installed") and status.get("needs_update"):
            message = (
                f"OCR runtime đang là v{status.get('version') or '?'}; bản mới là v{status.get('target_version') or '?'}.\n\n"
                "Bạn có muốn tải/cập nhật OCR runtime không?"
            )
        else:
            message = (
                "OCR dùng PaddleOCR runtime tách riêng nên app chính chạy nhẹ hơn.\n\n"
                "Bạn có muốn tải gói OCR runtime từ version.json và cài vào máy không?"
            )
        if not messagebox.askyesno("Cài OCR runtime?", message, parent=parent or self):
            return False
        if not meta.get("url"):
            messagebox.showerror(
                "Thiếu link OCR runtime",
                "Chưa có link trong version.json -> ocr_runtime.url. Build xong runtime rồi điền link zip vào đó.",
                parent=parent or self,
            )
            return False
        return self._install_ocr_runtime_with_progress(meta, parent=parent or self)

    def _install_ocr_runtime_with_progress(self, meta: dict, parent=None) -> bool:
        parent = parent or self
        win = tk.Toplevel(parent)
        self._apply_window_icon(win)
        win.title("Cài OCR runtime")
        win.geometry("520x150")
        win.transient(parent)
        win.grab_set()

        frame = ttk.Frame(win, padding=14)
        frame.pack(fill=tk.BOTH, expand=True)
        status_var = tk.StringVar(value="Đang chuẩn bị tải OCR runtime...")
        ttk.Label(frame, text="OCR runtime", font=("Segoe UI", 11, "bold")).pack(anchor="w")
        ttk.Label(frame, textvariable=status_var, wraplength=480).pack(anchor="w", fill=tk.X, pady=(10, 8))
        progress = ttk.Progressbar(frame, mode="indeterminate")
        progress.pack(fill=tk.X)
        progress.start(12)
        result = {"ok": False}

        def status_cb(message: str):
            self.after(0, lambda msg=message: status_var.set(msg))

        def worker():
            try:
                ocr_service.install_ocr_runtime(meta, status_cb=status_cb)
                result["ok"] = True
                self.after(0, lambda: status_var.set("Đã cài OCR runtime."))
            except Exception as exc:
                err = str(exc)
                self.after(0, lambda: messagebox.showerror("Cài OCR runtime", err, parent=win))
            finally:
                self.after(0, win.destroy)

        threading.Thread(target=worker, daemon=True).start()
        self.wait_window(win)
        return bool(result["ok"])

    def _close_ocr_windows_for_app_exit(self):
        windows = list(getattr(self, "_ocr_windows", set()) or [])
        for win in windows:
            try:
                if win.winfo_exists() and not win.close_window():
                    return False
            except Exception:
                pass
        return True
