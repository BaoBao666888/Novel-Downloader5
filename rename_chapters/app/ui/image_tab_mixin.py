import hashlib
import io
import json
import os
import shlex
import subprocess
import shutil
import threading
import time
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

import requests
from PIL import Image, ImageTk
from app.paths import BASE_DIR
from app.ui.update_dialog import fetch_manifest_from_url


class ImageTabMixin:
    """Tab xử lý ảnh (tải, xem, chỉnh sửa đơn giản)."""

    def create_image_processing_tab(self):
        img_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(img_tab, text="Xử lý Ảnh")
        img_tab.rowconfigure(1, weight=1)
        img_tab.columnconfigure(0, weight=1)

        url_frame = ttk.LabelFrame(img_tab, text="1. Nguồn ảnh", padding=10)
        url_frame.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        url_frame.columnconfigure(0, weight=1)

        self.image_url_var = tk.StringVar()
        url_entry = ttk.Entry(url_frame, textvariable=self.image_url_var)
        url_entry.grid(row=0, column=0, sticky="ew")

        download_buttons_frame = ttk.Frame(url_frame)
        download_buttons_frame.grid(row=0, column=1, padx=(10, 0))
        ttk.Button(download_buttons_frame, text="Tải từ URL", command=self._start_image_download_thread).pack(side=tk.LEFT)
        ttk.Button(download_buttons_frame, text="Tải file lên...", command=self._load_local_image).pack(side=tk.LEFT, padx=(5, 0))

        preview_frame = ttk.LabelFrame(img_tab, text="2. Xem trước & Xử lý", padding=10)
        preview_frame.grid(row=1, column=0, sticky="nsew")
        preview_frame.rowconfigure(0, weight=1)
        preview_frame.columnconfigure(0, weight=1)

        self.image_canvas = tk.Canvas(preview_frame, bg="gray90", highlightthickness=0)
        self.image_canvas.grid(row=0, column=0, sticky="nsew")
        self.image_canvas.bind("<MouseWheel>", self._on_image_scroll)
        self.image_canvas.bind("<ButtonPress-1>", self._on_image_drag_start)
        self.image_canvas.bind("<B1-Motion>", self._on_image_drag_move)

        self.image_ai_frame = ttk.LabelFrame(img_tab, text="3. Tăng cường AI", padding=10)
        self.image_ai_frame.grid(row=2, column=0, sticky="ew", pady=(10, 0))
        self.image_ai_frame.columnconfigure(4, weight=1)

        ttk.Label(self.image_ai_frame, text="Tool:").grid(row=0, column=0, sticky="w", padx=(4, 2), pady=4)
        self.image_ai_tool_status = ttk.Label(self.image_ai_frame, text="Chưa kiểm tra")
        self.image_ai_tool_status.grid(row=0, column=1, sticky="w", padx=(2, 10), pady=4)
        self.image_ai_tool_btn = ttk.Button(self.image_ai_frame, text="Cài tool tăng cường", command=self._image_ai_install_or_update)
        self.image_ai_tool_btn.grid(row=0, column=2, sticky="w", padx=(0, 12), pady=4)

        ttk.Label(self.image_ai_frame, text="Model:").grid(row=0, column=3, sticky="w", padx=(0, 2), pady=4)
        self.image_ai_model_var = tk.StringVar()
        self.image_ai_model_cb = ttk.Combobox(self.image_ai_frame, textvariable=self.image_ai_model_var, state="readonly")
        self.image_ai_model_cb.grid(row=0, column=4, sticky="ew", padx=(2, 8), pady=4)
        self.image_ai_model_cb.bind("<<ComboboxSelected>>", lambda _e: self._image_ai_on_model_change())
        self.image_ai_manage_btn = ttk.Button(self.image_ai_frame, text="Quản lý", command=self._image_ai_open_model_manager)
        self.image_ai_manage_btn.grid(row=0, column=5, sticky="w", pady=4)

        self.image_ai_model_info = ttk.Label(self.image_ai_frame, text="Chưa có model.", justify="left", wraplength=760)
        self.image_ai_model_info.grid(row=1, column=0, columnspan=6, sticky="w", padx=4, pady=(0, 6))

        params_frame = ttk.Frame(self.image_ai_frame)
        params_frame.grid(row=2, column=0, columnspan=6, sticky="ew", padx=4, pady=(2, 0))
        params_frame.columnconfigure(9, weight=1)

        ttk.Label(params_frame, text="Scale (cố định):").grid(row=0, column=0, sticky="w")
        ttk.Label(params_frame, text="4x").grid(row=0, column=1, sticky="w", padx=(4, 12))
        ttk.Label(params_frame, text="Tile (giảm RAM):").grid(row=0, column=2, sticky="w")
        self.image_ai_tile_var = tk.IntVar(value=400)
        ttk.Entry(params_frame, textvariable=self.image_ai_tile_var, width=6).grid(row=0, column=3, sticky="w", padx=(4, 12))
        ttk.Label(params_frame, text="Pad (vết ghép):").grid(row=0, column=4, sticky="w")
        self.image_ai_tile_pad_var = tk.IntVar(value=30)
        ttk.Entry(params_frame, textvariable=self.image_ai_tile_pad_var, width=6).grid(row=0, column=5, sticky="w", padx=(4, 12))
        ttk.Label(params_frame, text="Pre pad (viền):").grid(row=0, column=6, sticky="w")
        self.image_ai_pre_pad_var = tk.IntVar(value=0)
        ttk.Entry(params_frame, textvariable=self.image_ai_pre_pad_var, width=6).grid(row=0, column=7, sticky="w", padx=(4, 12))
        self.image_ai_half_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(params_frame, text="Half (FP16, tiết kiệm VRAM)", variable=self.image_ai_half_var).grid(
            row=0, column=8, sticky="w"
        )
        reset_btn = ttk.Button(params_frame, text="Reset mặc định", command=self._image_ai_reset_defaults)
        reset_btn.grid(row=0, column=9, sticky="e")

        self.image_resize_mode_var = tk.StringVar(value="percent")
        self.image_resize_percent_var = tk.DoubleVar(value=50)
        self.image_resize_width_var = tk.IntVar(value=0)
        self.image_resize_height_var = tk.IntVar(value=0)
        self.image_keep_ratio_var = tk.BooleanVar(value=True)

        resize_frame = ttk.Frame(self.image_ai_frame)
        resize_frame.grid(row=3, column=0, columnspan=6, sticky="ew", padx=4, pady=(6, 0))
        resize_frame.columnconfigure(10, weight=1)
        ttk.Label(resize_frame, text="Giảm kích thước:").grid(row=0, column=0, sticky="w")

        percent_radio = ttk.Radiobutton(
            resize_frame,
            text="Theo %",
            variable=self.image_resize_mode_var,
            value="percent",
        )
        percent_radio.grid(row=0, column=1, sticky="w", padx=(8, 0))
        percent_entry = ttk.Entry(resize_frame, textvariable=self.image_resize_percent_var, width=6)
        percent_entry.grid(row=0, column=2, sticky="w", padx=(4, 0))
        ttk.Label(resize_frame, text="%").grid(row=0, column=3, sticky="w", padx=(4, 12))

        size_radio = ttk.Radiobutton(
            resize_frame,
            text="Theo kích thước",
            variable=self.image_resize_mode_var,
            value="size",
        )
        size_radio.grid(row=0, column=4, sticky="w", padx=(0, 6))
        ttk.Label(resize_frame, text="W").grid(row=0, column=5, sticky="w")
        width_entry = ttk.Entry(resize_frame, textvariable=self.image_resize_width_var, width=6)
        width_entry.grid(row=0, column=6, sticky="w", padx=(4, 6))
        ttk.Label(resize_frame, text="H").grid(row=0, column=7, sticky="w")
        height_entry = ttk.Entry(resize_frame, textvariable=self.image_resize_height_var, width=6)
        height_entry.grid(row=0, column=8, sticky="w", padx=(4, 6))
        keep_ratio_chk = ttk.Checkbutton(resize_frame, text="Giữ tỉ lệ", variable=self.image_keep_ratio_var)
        keep_ratio_chk.grid(row=0, column=9, sticky="w", padx=(4, 8))
        self.resize_image_btn = ttk.Button(resize_frame, text="Giảm", command=self._apply_image_resize, state="disabled")
        self.resize_image_btn.grid(row=0, column=11, sticky="e")

        def _toggle_resize_mode():
            is_percent = self.image_resize_mode_var.get() == "percent"
            percent_entry.config(state="normal" if is_percent else "disabled")
            width_entry.config(state="disabled" if is_percent else "normal")
            height_entry.config(state="disabled" if is_percent else "normal")
            keep_ratio_chk.config(state="disabled" if is_percent else "normal")

        percent_radio.configure(command=_toggle_resize_mode)
        size_radio.configure(command=_toggle_resize_mode)
        _toggle_resize_mode()

        action_frame = ttk.Frame(self.image_ai_frame)
        action_frame.grid(row=4, column=0, columnspan=6, sticky="w", padx=4, pady=(8, 0))
        self.image_ai_apply_btn = ttk.Button(action_frame, text="Áp dụng", command=self._apply_image_ai, state="disabled")
        self.image_ai_apply_btn.pack(side=tk.LEFT, padx=5)
        self.undo_image_btn = ttk.Button(action_frame, text="Hoàn tác về gốc", command=self._undo_image_enhancement, state="disabled")
        self.undo_image_btn.pack(side=tk.LEFT)
        self.image_ai_status_label = ttk.Label(action_frame, text="", wraplength=520)
        self.image_ai_status_label.pack(side=tk.LEFT, padx=(10, 0))

        status_frame = ttk.Frame(img_tab)
        status_frame.grid(row=3, column=0, sticky="ew", pady=(5, 0))
        status_frame.columnconfigure(0, weight=1)
        self.image_status_label = ttk.Label(status_frame, text="Sẵn sàng.")
        self.image_status_label.grid(row=0, column=0, sticky="w")

        status_actions = ttk.Frame(status_frame)
        status_actions.grid(row=0, column=1, sticky="e")
        self.toggle_image_ai_btn = ttk.Button(status_actions, text="Mở tăng cường AI")
        self.toggle_image_ai_btn.pack(side=tk.LEFT, padx=(0, 8))
        ttk.Label(status_actions, text="Lưu định dạng:").pack(side=tk.LEFT)
        self.image_format_combo = ttk.Combobox(status_actions, state="readonly", values=["PNG", "JPEG", "WEBP", "BMP", "GIF"])
        self.image_format_combo.set("PNG")
        self.image_format_combo.pack(side=tk.LEFT, padx=(4, 8))
        self.save_image_btn = ttk.Button(status_actions, text="Lưu ảnh...", command=self._save_converted_image, state="disabled")
        self.save_image_btn.pack(side=tk.LEFT)
        self._image_ai_cache = {}
        self._image_ai_input_cache = {}
        self._image_ai_input_path = ""
        self._image_ai_tool_checked = False
        self._image_ai_tool_checked_on_tab = False
        self.image_ai_show_console = False
        self._refresh_image_ai_ui(force_check=True)

        self._image_ai_visible = False

        def _toggle_image_ai():
            self._image_ai_visible = not self._image_ai_visible
            if self._image_ai_visible:
                self.image_ai_frame.grid()
                self.toggle_image_ai_btn.config(text="Thu gọn tăng cường AI")
            else:
                self.image_ai_frame.grid_remove()
                self.toggle_image_ai_btn.config(text="Mở tăng cường AI")

        self.image_ai_frame.grid_remove()
        self.toggle_image_ai_btn.config(command=_toggle_image_ai)

    def _start_image_download_thread(self):
        url = self.image_url_var.get().strip()
        if not url:
            messagebox.showwarning("Thiếu thông tin", "Vui lòng nhập URL của ảnh.")
            return

        self._image_source_path = None
        self.save_image_btn.config(state="disabled")
        self.image_status_label.config(text=f"Đang tải từ {url[:50]}...")

        thread = threading.Thread(target=self._download_image_worker, args=(url,), daemon=True)
        thread.start()

    def _download_image_worker(self, url):
        try:
            proxies = self._get_proxy_for_request("images") if hasattr(self, "_get_proxy_for_request") else None
            if proxies:
                self.log(f"Tải ảnh sử dụng proxy: {proxies['http']}")
            response = requests.get(url, timeout=60, headers={"User-Agent": "Mozilla/5.0"}, proxies=proxies)
            response.raise_for_status()
            self._process_image_data(io.BytesIO(response.content))
        except Exception as e:
            self.downloaded_image_data = None
            self.image_original_pil = None

            def update_ui_error():
                self.image_canvas.delete("all")
                self.image_canvas.create_text(
                    self.image_canvas.winfo_width() / 2,
                    self.image_canvas.winfo_height() / 2,
                    text="Lỗi khi tải hoặc xử lý ảnh.",
                    anchor="center",
                    fill="red",
                )
                self.image_status_label.config(text=f"Lỗi: {e}")

            self.after(0, update_ui_error)

    def _save_converted_image(self):
        if getattr(self, "image_display_pil", None):
            img_to_save = self.image_display_pil
        else:
            if not self.downloaded_image_data:
                messagebox.showerror("Lỗi", "Không có dữ liệu ảnh để lưu.")
                return
            self.downloaded_image_data.seek(0)
            img_to_save = Image.open(self.downloaded_image_data)

        selected_format = self.image_format_combo.get()
        file_types = {
            "PNG": [("PNG file", "*.png")],
            "JPEG": [("JPEG file", "*.jpg *.jpeg")],
            "WEBP": [("WEBP file", "*.webp")],
            "BMP": [("BMP file", "*.bmp")],
            "GIF": [("GIF file", "*.gif")],
        }

        filepath = filedialog.asksaveasfilename(
            title="Lưu ảnh",
            defaultextension=f".{selected_format.lower()}",
            filetypes=file_types.get(selected_format, [("All files", "*.*")]),
        )

        if not filepath:
            return

        try:
            if selected_format == "JPEG" and img_to_save.mode == "RGBA":
                img_to_save = img_to_save.convert("RGB")
            img_to_save.save(filepath, format=selected_format)
            self.image_status_label.config(text=f"Đã lưu thành công tại: {filepath}")
            messagebox.showinfo("Thành công", "Đã lưu ảnh thành công!")
        except Exception as e:
            self.image_status_label.config(text=f"Lỗi khi lưu: {e}")
            messagebox.showerror("Lỗi", f"Không thể lưu ảnh: {e}")

    def _on_image_scroll(self, event):
        if not self.image_original_pil:
            return
        if event.delta > 0:
            self.image_zoom_factor *= 1.1
        else:
            self.image_zoom_factor /= 1.1
        self.image_zoom_factor = max(0.1, min(self.image_zoom_factor, 5.0))
        self._update_image_display()

    def _on_image_drag_start(self, event):
        self._image_drag_data["x"] = event.x
        self._image_drag_data["y"] = event.y

    def _on_image_drag_move(self, event):
        if not self.image_original_pil:
            return

        dx = event.x - self._image_drag_data["x"]
        dy = event.y - self._image_drag_data["y"]
        self.image_canvas.move("image", dx, dy)
        self._image_drag_data["x"] = event.x
        self._image_drag_data["y"] = event.y

    def _update_image_display(self):
        source = self.image_display_pil if getattr(self, "image_display_pil", None) else getattr(self, "image_original_pil", None)
        if not source:
            return

        new_width = max(1, int(source.width * self.image_zoom_factor))
        new_height = max(1, int(source.height * self.image_zoom_factor))

        resized_pil = source.resize((new_width, new_height), Image.Resampling.LANCZOS)
        self.tk_photo_image = ImageTk.PhotoImage(resized_pil)

        self.image_canvas.delete("all")
        self.image_canvas.create_image(
            self.image_canvas.winfo_width() / 2,
            self.image_canvas.winfo_height() / 2,
            anchor="center",
            image=self.tk_photo_image,
            tags="image",
        )

        if getattr(self, "image_display_pil", None) and getattr(self, "image_original_pil", None):
            if self.image_display_pil.tobytes() != self.image_original_pil.tobytes():
                self.image_status_label.config(
                    text=f"Đã tải! {self.image_original_pil.width}x{self.image_original_pil.height} | Zoom: {self.image_zoom_factor:.1f}x (Đã chỉnh sửa)"
                )
                return

        self.image_status_label.config(
            text=f"Đã tải! Kích thước: {self.image_original_pil.width}x{self.image_original_pil.height} | Zoom: {self.image_zoom_factor:.1f}x"
        )

    def _load_local_image(self):
        filepath = filedialog.askopenfilename(
            title="Chọn một file ảnh",
            filetypes=[("Image Files", "*.png *.jpg *.jpeg *.bmp *.webp *.gif"), ("All files", "*.*")],
        )
        if not filepath:
            return

        self._image_source_path = filepath
        self.save_image_btn.config(state="disabled")
        self.image_status_label.config(text=f"Đang mở file: {os.path.basename(filepath)}...")

        try:
            with open(filepath, "rb") as f:
                image_data = io.BytesIO(f.read())
            self._process_image_data(image_data)
        except Exception as e:
            self.image_status_label.config(text="Lỗi: Không thể mở file ảnh.")
            messagebox.showerror("Lỗi", f"Không thể mở file ảnh: {e}")

    def _process_image_data(self, image_bytes_io):
        raw_bytes = image_bytes_io.getvalue()
        self.downloaded_image_data = io.BytesIO(raw_bytes)
        self._image_source_bytes = raw_bytes
        self._image_source_hash = hashlib.md5(raw_bytes).hexdigest()
        self.image_original_pil = Image.open(self.downloaded_image_data)
        self.image_display_pil = self.image_original_pil.copy()
        self.image_zoom_factor = 1.0
        self._image_ai_input_path = self._image_ai_prepare_input_path()

        def update_ui_success():
            self._update_image_display()
            self.save_image_btn.config(state="normal")
            self._image_ai_update_apply_state()
            if hasattr(self, "resize_image_btn"):
                self.resize_image_btn.config(state="normal")
            self.undo_image_btn.config(state="disabled")

        self.after(0, update_ui_success)

    def _undo_image_enhancement(self):
        if not self.image_original_pil:
            return
        self.image_display_pil = self.image_original_pil.copy()
        self.undo_image_btn.config(state="disabled")
        self._update_image_display()
        if hasattr(self, "image_ai_status_label"):
            self.image_ai_status_label.config(text="Đã hoàn tác về ảnh gốc.")

    def _image_ai_tool_meta(self) -> dict:
        if hasattr(self, "_image_ai_tool_meta_cache"):
            return self._image_ai_tool_meta_cache or {}
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
        tool_meta = data.get("image_ai_tool") if isinstance(data, dict) else {}
        self._image_ai_tool_meta_cache = tool_meta or {}
        return self._image_ai_tool_meta_cache

    def _image_ai_models_meta(self) -> list:
        meta = self._image_ai_tool_meta()
        models = meta.get("models") if isinstance(meta, dict) else []
        return models if isinstance(models, list) else []

    def _image_ai_tool_path(self) -> str:
        return os.path.join(BASE_DIR, "tools", "imageAI_cpu.exe")

    def _image_ai_is_html_file(self, path: str) -> bool:
        try:
            with open(path, "rb") as f:
                head = f.read(2048)
        except Exception:
            return False
        head_lower = head.lower()
        return b"<html" in head_lower or b"<!doctype html" in head_lower

    def _image_ai_download_file(self, url: str, dest_path: str, status_cb=None, status_prefix: str = "Đang tải..."):
        def _log(msg: str):
            try:
                self.log(msg)
            except Exception:
                pass

        def _emit_progress(size_bytes: int):
            if not status_cb:
                return
            if size_bytes is None or size_bytes < 0:
                status_cb(status_prefix)
                return
            mb = size_bytes / (1024 * 1024)
            status_cb(f"{status_prefix} {mb:.1f} MB")

        def _run_with_progress(download_func):
            result = {"error": None, "output": None}
            done = threading.Event()

            def runner():
                try:
                    result["output"] = download_func()
                except Exception as exc:
                    result["error"] = exc
                finally:
                    done.set()

            thread = threading.Thread(target=runner, daemon=True)
            thread.start()
            last_size = -1
            while not done.is_set():
                size = -1
                if os.path.exists(dest_path):
                    try:
                        size = os.path.getsize(dest_path)
                    except Exception:
                        size = -1
                if size >= 0 and size != last_size:
                    last_size = size
                    _emit_progress(size)
                time.sleep(0.25)
            thread.join()
            if result["error"]:
                raise result["error"]
            return result["output"]

        if status_cb:
            status_cb(status_prefix)
        try:
            if os.path.exists(dest_path):
                os.remove(dest_path)
        except Exception:
            pass
        gdown_cmd = ""
        if os.name == "nt":
            gdown_cmd = os.path.join(BASE_DIR, "tools", "gdown.exe")
        else:
            gdown_cmd = os.path.join(BASE_DIR, "tools", "gdown")
        if not gdown_cmd or not os.path.isfile(gdown_cmd):
            raise RuntimeError("Không tìm thấy gdown trong thư mục tools.")

        _log(f"[ImageAI] Dùng gdown tools: {gdown_cmd}")
        cmd = [gdown_cmd, "--fuzzy", "-O", dest_path, url]
        result = _run_with_progress(lambda: subprocess.run(cmd, capture_output=True, text=True))
        if result.returncode == 0 and os.path.isfile(dest_path):
            if self._image_ai_is_html_file(dest_path):
                try:
                    os.remove(dest_path)
                except Exception:
                    pass
                raise RuntimeError(
                    "File tải về là trang HTML (virus scan hoặc link chưa public). "
                    "Hãy dùng link chia sẻ Google Drive công khai."
                )
            return
        msg = (result.stderr or result.stdout or "").strip()
        if msg:
            raise RuntimeError(msg)
        raise RuntimeError("Không tải được file từ Google Drive.")

    def _image_ai_models_dir(self) -> str:
        return os.path.join(BASE_DIR, "local", "image_ai_models")

    def _image_ai_cache_dir(self) -> str:
        return os.path.join(BASE_DIR, "local", "image_ai_cache")

    def _image_ai_input_cache_dir(self) -> str:
        return os.path.join(BASE_DIR, "local", "image_ai_input_cache")

    def _image_ai_update_tool_status(self):
        meta = self._image_ai_tool_meta()
        target_version = meta.get("version") if isinstance(meta, dict) else ""
        tool_path = self._image_ai_tool_path()
        installed = os.path.isfile(tool_path)
        installed_version = ""
        if isinstance(getattr(self, "app_config", None), dict):
            installed_version = self.app_config.get("image_ai_tool_version", "") or ""
        needs_update = bool(installed and target_version and installed_version != target_version)

        if not installed:
            self.image_ai_tool_status.config(text="Chưa cài tool tăng cường.")
            self.image_ai_tool_btn.config(text="Cài tool tăng cường", state=tk.NORMAL)
            self.image_ai_tool_btn.grid()
        elif needs_update:
            cur = installed_version or "?"
            self.image_ai_tool_status.config(text=f"Có bản mới {target_version} (đang {cur}).")
            self.image_ai_tool_btn.config(text="Cập nhật tool", state=tk.NORMAL)
            self.image_ai_tool_btn.grid()
        else:
            ver_text = target_version or installed_version or "?"
            self.image_ai_tool_status.config(text=f"Đã cài tool (v{ver_text}).")
            self.image_ai_tool_btn.grid_remove()

    def _image_ai_check_tool_state(self, force: bool = False):
        if getattr(self, "_image_ai_tool_checked", False) and not force:
            return
        self._image_ai_tool_checked = True
        self._image_ai_update_tool_status()

    def _refresh_image_ai_ui(self, force_check: bool = False):
        self._image_ai_check_tool_state(force=force_check)
        self._image_ai_refresh_models()
        self._image_ai_update_apply_state()

    def _image_ai_install_or_update(self):
        meta = self._image_ai_tool_meta()
        url = meta.get("url") if isinstance(meta, dict) else ""
        version = meta.get("version") if isinstance(meta, dict) else ""
        if not url:
            messagebox.showerror("Thiếu link", "Chưa có URL tải tool tăng cường trong version.json.", parent=self)
            return

        self.image_ai_tool_btn.config(state=tk.DISABLED)
        self.image_ai_status_label.config(text="Đang tải tool tăng cường...")

        def worker():
            os.makedirs(os.path.dirname(self._image_ai_tool_path()), exist_ok=True)
            try:
                tmp_path = self._image_ai_tool_path() + ".tmp"
                self._image_ai_download_file(
                    url,
                    tmp_path,
                    status_cb=lambda msg: self.image_ai_status_label.config(text=msg),
                    status_prefix="Đang tải tool...",
                )
                os.replace(tmp_path, self._image_ai_tool_path())
                if isinstance(getattr(self, "app_config", None), dict) and version:
                    self.app_config["image_ai_tool_version"] = version
                self.after(0, lambda: self.image_ai_status_label.config(text="Đã cài/cập nhật tool tăng cường."))
            except Exception as exc:
                try:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
                except Exception:
                    pass
                self.after(0, lambda: messagebox.showerror("Lỗi tải tool", f"Không thể tải tool: {exc}", parent=self))
                self.after(0, lambda: self.image_ai_status_label.config(text=f"Lỗi: {exc}"))
            finally:
                self.after(0, lambda: self.image_ai_tool_btn.config(state=tk.NORMAL))
                self.after(0, self._image_ai_update_tool_status)
                self.after(0, self._image_ai_update_apply_state)

        threading.Thread(target=worker, daemon=True).start()

    def _image_ai_refresh_models(self):
        models = self._image_ai_models_meta()
        models_dir = self._image_ai_models_dir()
        os.makedirs(models_dir, exist_ok=True)
        downloaded = []
        model_map = {}
        display_map = {}
        for model in models:
            if not isinstance(model, dict):
                continue
            model_id = (model.get("id") or model.get("name") or "").strip()
            filename = (model.get("name") or model.get("filename") or model_id).strip()
            if not model_id or not filename:
                continue
            path = os.path.join(models_dir, filename)
            entry = dict(model)
            entry["id"] = model_id
            entry["filename"] = filename
            entry["path"] = path
            model_map[model_id] = entry
            if os.path.isfile(path):
                display = filename
                downloaded.append(display)
                display_map[display] = model_id
        self._image_ai_models_by_id = model_map
        self._image_ai_model_display_map = display_map

        if hasattr(self, "image_ai_model_cb"):
            self.image_ai_model_cb["values"] = downloaded
        current_display = (self.image_ai_model_var.get() or "").strip()
        if not downloaded:
            if hasattr(self, "image_ai_model_var"):
                self.image_ai_model_var.set("")
            self.image_ai_model_info.config(text="Chưa có model. Nhấn Quản lý để tải model.")
        else:
            if current_display not in downloaded:
                self.image_ai_model_var.set(downloaded[0])
            self._image_ai_on_model_change()

    def _image_ai_on_model_change(self):
        display = (self.image_ai_model_var.get() or "").strip()
        model_id = (self._image_ai_model_display_map or {}).get(display)
        model = (self._image_ai_models_by_id or {}).get(model_id)
        if not model:
            self.image_ai_model_info.config(text="Chưa chọn model.")
            self._image_ai_update_apply_state()
            return
        desc = model.get("desc") if isinstance(model, dict) else ""
        if desc:
            self.image_ai_model_info.config(text=desc)
        else:
            self.image_ai_model_info.config(text="Không có mô tả cho model này.")
        self._image_ai_update_apply_state()

    def _image_ai_open_model_manager(self):
        win = tk.Toplevel(self)
        self._apply_window_icon(win)
        win.title("Quản lý model")
        win.geometry("560x420")

        container = ttk.Frame(win, padding=10)
        container.pack(fill="both", expand=True)
        container.columnconfigure(0, weight=1)
        container.rowconfigure(1, weight=1)

        models = self._image_ai_models_meta()
        model_ids = []
        listbox = tk.Listbox(container, height=8)
        listbox.grid(row=1, column=0, columnspan=2, sticky="nsew", pady=(6, 8))

        desc_label = ttk.Label(container, text="", justify="left", wraplength=520)
        desc_label.grid(row=2, column=0, columnspan=2, sticky="w")

        status_label = ttk.Label(container, text="")
        status_label.grid(row=0, column=0, sticky="w")

        btn_frame = ttk.Frame(container)
        btn_frame.grid(row=3, column=0, columnspan=2, sticky="ew", pady=(10, 0))
        btn_frame.columnconfigure(2, weight=1)
        download_btn = ttk.Button(btn_frame, text="Tải model", state=tk.DISABLED)
        delete_btn = ttk.Button(btn_frame, text="Xóa model", state=tk.DISABLED)
        close_btn = ttk.Button(btn_frame, text="Đóng", command=win.destroy)
        download_btn.grid(row=0, column=0, padx=(0, 6))
        delete_btn.grid(row=0, column=1, padx=(0, 6))
        close_btn.grid(row=0, column=3, sticky="e")

        def _refresh_list():
            listbox.delete(0, tk.END)
            model_ids.clear()
            downloaded_ids = set()
            for model in self._image_ai_models_meta():
                if not isinstance(model, dict):
                    continue
                model_id = (model.get("id") or model.get("name") or "").strip()
                filename = (model.get("name") or model.get("filename") or model_id).strip()
                if not model_id or not filename:
                    continue
                path = os.path.join(self._image_ai_models_dir(), filename)
                downloaded = os.path.isfile(path)
                if downloaded:
                    downloaded_ids.add(model_id)
                prefix = "✓" if downloaded else "·"
                listbox.insert(tk.END, f"[{prefix}] {filename}")
                model_ids.append(model_id)
            status_label.config(text=f"Đã tải {len(downloaded_ids)}/{len(model_ids)} model.")
            download_btn.config(state=tk.DISABLED)
            delete_btn.config(state=tk.DISABLED)
            desc_label.config(text="")

        def _on_select(_event=None):
            sel = listbox.curselection()
            if not sel:
                download_btn.config(state=tk.DISABLED)
                delete_btn.config(state=tk.DISABLED)
                desc_label.config(text="")
                return
            idx = sel[0]
            model_id = model_ids[idx]
            model = (self._image_ai_models_by_id or {}).get(model_id) or next((m for m in self._image_ai_models_meta() if m.get("id") == model_id), {})
            filename = (model.get("name") or model.get("filename") or model_id).strip()
            path = os.path.join(self._image_ai_models_dir(), filename)
            downloaded = os.path.isfile(path)
            desc_label.config(text=model.get("desc") or "")
            download_btn.config(state=tk.NORMAL if not downloaded else tk.DISABLED)
            delete_btn.config(state=tk.NORMAL if downloaded else tk.DISABLED)

        def _download_selected():
            sel = listbox.curselection()
            if not sel:
                return
            idx = sel[0]
            model_id = model_ids[idx]
            model = (self._image_ai_models_by_id or {}).get(model_id) or next((m for m in self._image_ai_models_meta() if m.get("id") == model_id), {})
            url = (model.get("url") or "").strip()
            filename = (model.get("name") or model.get("filename") or model_id).strip()
            if not url:
                messagebox.showerror("Thiếu link", "Model chưa có URL tải.", parent=win)
                return
            dest = os.path.join(self._image_ai_models_dir(), filename)
            os.makedirs(self._image_ai_models_dir(), exist_ok=True)
            download_btn.config(state=tk.DISABLED)
            delete_btn.config(state=tk.DISABLED)
            status_label.config(text="Đang tải model...")

            def worker():
                try:
                    tmp_path = dest + ".tmp"
                    self._image_ai_download_file(
                        url,
                        tmp_path,
                        status_cb=lambda msg: status_label.config(text=msg),
                        status_prefix="Đang tải model...",
                    )
                    os.replace(tmp_path, dest)
                    self.after(0, _refresh_list)
                    self.after(0, self._image_ai_refresh_models)
                except Exception as exc:
                    err_msg = str(exc)
                    try:
                        if os.path.exists(tmp_path):
                            os.remove(tmp_path)
                    except Exception:
                        pass
                    self.after(0, lambda m=err_msg: messagebox.showerror("Lỗi tải model", f"Không thể tải model: {m}", parent=win))
                    self.after(0, lambda m=err_msg: status_label.config(text=f"Lỗi: {m}"))

            threading.Thread(target=worker, daemon=True).start()

        def _delete_selected():
            sel = listbox.curselection()
            if not sel:
                return
            idx = sel[0]
            model_id = model_ids[idx]
            model = (self._image_ai_models_by_id or {}).get(model_id) or next((m for m in self._image_ai_models_meta() if m.get("id") == model_id), {})
            filename = (model.get("name") or model.get("filename") or model_id).strip()
            path = os.path.join(self._image_ai_models_dir(), filename)
            if not os.path.isfile(path):
                return
            if not messagebox.askyesno("Xóa model", f"Xóa model '{filename}' khỏi máy?", parent=win):
                return
            try:
                os.remove(path)
                _refresh_list()
                self._image_ai_refresh_models()
            except Exception as exc:
                messagebox.showerror("Lỗi", f"Không thể xóa model: {exc}", parent=win)

        listbox.bind("<<ListboxSelect>>", _on_select)
        download_btn.config(command=_download_selected)
        delete_btn.config(command=_delete_selected)
        _refresh_list()

    def _image_ai_update_apply_state(self):
        has_image = bool(getattr(self, "image_original_pil", None))
        has_tool = os.path.isfile(self._image_ai_tool_path())
        display = (self.image_ai_model_var.get() or "").strip()
        has_model = bool(display and (self._image_ai_model_display_map or {}).get(display))
        state = tk.NORMAL if (has_image and has_tool and has_model) else tk.DISABLED
        self.image_ai_apply_btn.config(state=state)

    def _image_ai_reset_defaults(self):
        self.image_ai_tile_var.set(400)
        self.image_ai_tile_pad_var.set(30)
        self.image_ai_pre_pad_var.set(0)
        self.image_ai_half_var.set(False)

    def _image_ai_get_selected_model(self) -> dict:
        display = (self.image_ai_model_var.get() or "").strip()
        model_id = (self._image_ai_model_display_map or {}).get(display)
        return (self._image_ai_models_by_id or {}).get(model_id) or {}

    def _image_ai_format_cmd(self, cmd: list) -> str:
        try:
            if os.name == "nt":
                return subprocess.list2cmdline(cmd)
            return shlex.join(cmd)
        except Exception:
            return " ".join(str(part) for part in cmd)

    def _image_ai_prepare_input_path(self) -> str:
        img_hash = getattr(self, "_image_source_hash", "")
        if img_hash and img_hash in self._image_ai_input_cache:
            cached_path = self._image_ai_input_cache.get(img_hash)
            if cached_path and os.path.isfile(cached_path):
                return cached_path
        raw_bytes = getattr(self, "_image_source_bytes", None)
        if not raw_bytes:
            return ""
        cache_dir = self._image_ai_input_cache_dir()
        os.makedirs(cache_dir, exist_ok=True)
        input_path = os.path.join(cache_dir, f"input_{img_hash}.png")
        try:
            img = Image.open(io.BytesIO(raw_bytes))
            img.save(input_path, format="PNG")
        except Exception:
            with open(input_path, "wb") as f:
                f.write(raw_bytes)
        self._image_ai_input_cache[img_hash] = input_path
        return input_path

    def _apply_image_ai(self):
        if not getattr(self, "image_original_pil", None):
            messagebox.showinfo("Chưa có ảnh", "Vui lòng tải ảnh trước.", parent=self)
            return
        tool_path = self._image_ai_tool_path()
        if not os.path.isfile(tool_path):
            messagebox.showerror("Chưa có tool", "Chưa cài tool tăng cường.", parent=self)
            return
        model = self._image_ai_get_selected_model()
        if not model:
            messagebox.showinfo("Chưa chọn model", "Vui lòng chọn model.", parent=self)
            return
        model_path = model.get("path") or ""
        if not os.path.isfile(model_path):
            messagebox.showerror("Thiếu model", "Model chưa được tải. Hãy tải trong phần Quản lý.", parent=self)
            return
        if self._image_ai_is_html_file(model_path):
            messagebox.showerror(
                "Model lỗi",
                "Model hiện tại là file HTML (thường do link Drive chưa public/virus scan).\n"
                "Vui lòng tải lại model.",
                parent=self,
            )
            return

        img_hash = getattr(self, "_image_source_hash", "")
        params_key = (
            img_hash,
            model.get("id"),
            int(self.image_ai_tile_var.get()),
            int(self.image_ai_tile_pad_var.get()),
            int(self.image_ai_pre_pad_var.get()),
            bool(self.image_ai_half_var.get()),
        )
        if params_key in self._image_ai_cache:
            redo = messagebox.askyesno(
                "Đã có cache",
                "Ảnh này đã được tăng cường với cùng tham số.\nBạn có muốn làm lại không?\nChọn No để tải lại ảnh vừa tăng cường.",
                parent=self,
            )
            if not redo:
                cached = self._image_ai_cache.get(params_key)
                if cached:
                    self.image_display_pil = cached.copy()
                    self.undo_image_btn.config(state="normal")
                    self.save_image_btn.config(state="normal")
                    self._update_image_display()
                    self.image_ai_status_label.config(text="Đã dùng lại cache tăng cường.")
                return

        self.image_ai_apply_btn.config(state=tk.DISABLED)
        self.save_image_btn.config(state=tk.DISABLED)
        self.image_ai_status_label.config(text="Đang tăng cường ảnh...")

        def worker():
            input_path = self._image_ai_input_path
            if not input_path or not os.path.isfile(input_path):
                input_path = self._image_ai_prepare_input_path()
            if not input_path:
                self.after(0, lambda: messagebox.showerror("Lỗi", "Không xác định được ảnh đầu vào.", parent=self))
                self.after(0, lambda: self.image_ai_apply_btn.config(state=tk.NORMAL))
                return
            if not os.path.isfile(input_path):
                self.after(0, lambda: messagebox.showerror("Lỗi", "Ảnh đầu vào không tồn tại.", parent=self))
                self.after(0, lambda: self.image_ai_apply_btn.config(state=tk.NORMAL))
                return
            os.makedirs(self._image_ai_cache_dir(), exist_ok=True)
            output_path = os.path.join(self._image_ai_cache_dir(), f"out_{img_hash}_{model.get('id')}.png")
            try:
                if os.path.exists(output_path):
                    os.remove(output_path)
            except Exception:
                pass
            cmd = [
                tool_path,
                "--input",
                input_path,
                "--output",
                output_path,
                "--model",
                model_path,
                "--scale",
                "4",
                "--tile",
                str(int(self.image_ai_tile_var.get())),
                "--tile-pad",
                str(int(self.image_ai_tile_pad_var.get())),
                "--pre-pad",
                str(int(self.image_ai_pre_pad_var.get())),
                "--gpu",
                "cpu",
            ]
            if self.image_ai_half_var.get():
                cmd.append("--half")

            try:
                cmd_log = self._image_ai_format_cmd(cmd)
                if hasattr(self, "log"):
                    try:
                        input_size = os.path.getsize(input_path)
                        self.log(f"[ImageAI] CMD: {cmd_log}")
                        self.log(f"[ImageAI] Input size: {input_size} bytes")
                    except Exception:
                        pass
                output_lines = []
                show_console = bool(getattr(self, "image_ai_show_console", False))
                if show_console:
                    self.after(0, lambda: self.image_ai_status_label.config(text="Đang chạy tool (xem console)..."))
                    if os.name == "nt":
                        console_cmd = ["cmd", "/c", "start", "\"\"", "/wait", "/d", BASE_DIR] + cmd
                        ret = subprocess.call(console_cmd, cwd=BASE_DIR)
                    else:
                        proc = subprocess.Popen(cmd, cwd=BASE_DIR)
                        ret = proc.wait()
                else:
                    env = os.environ.copy()
                    env["PYTHONIOENCODING"] = "utf-8"
                    proc = subprocess.Popen(
                        cmd,
                        cwd=BASE_DIR,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        env=env,
                        text=True,
                        encoding="utf-8",
                        errors="ignore",
                    )
                    stdout_data, stderr_data = proc.communicate()
                    output_lines = stdout_data.strip().splitlines() if stdout_data else []
                    
                    if stdout_data:
                        for line in output_lines:
                             self.after(0, lambda m=line: self.image_ai_status_label.config(text=m))
                    
                    ret = proc.returncode

                output_exists = os.path.isfile(output_path)
                output_size = os.path.getsize(output_path) if output_exists else 0
                if hasattr(self, "log"):
                    try:
                        self.log(f"[ImageAI] Exit code: {ret}, output: {output_exists}, size: {output_size}")
                        if stderr_data:
                            self.log(f"[ImageAI] STDERR: {stderr_data}")
                    except Exception:
                        pass
                if ret != 0 and not output_exists:
                    detail = "\n".join(output_lines[-10:]) if output_lines else "Không có log stdout."
                    err_detail = stderr_data.strip() if stderr_data else "Không có log stderr."
                    raise RuntimeError(f"Tool thoát với mã {ret}.\nSTDOUT: {detail}\nSTDERR: {err_detail}")
                if not output_exists or output_size == 0:
                    detail = "\n".join(output_lines[-10:]) if output_lines else "Không có log từ tool."
                    raise RuntimeError(f"Không tìm thấy ảnh đầu ra.\n{detail}")
                result = Image.open(output_path)
                self._image_ai_cache[params_key] = result.copy()
                try:
                    os.remove(output_path)
                except Exception:
                    pass

                def finish():
                    self.image_display_pil = result.copy()
                    self.undo_image_btn.config(state="normal")
                    self.save_image_btn.config(state="normal")
                    self.image_ai_apply_btn.config(state=tk.NORMAL)
                    self._update_image_display()
                    self.image_ai_status_label.config(text="Đã tăng cường ảnh.")

                self.after(0, finish)
            except Exception as exc:
                msg = str(exc)

                def on_err(error_msg=msg):
                    messagebox.showerror("Lỗi", f"Không thể tăng cường ảnh: {error_msg}", parent=self)
                    self.image_ai_status_label.config(text=f"Lỗi: {error_msg}")
                    self.image_ai_apply_btn.config(state=tk.NORMAL)

                self.after(0, on_err)

        threading.Thread(target=worker, daemon=True).start()

    def _apply_image_resize(self):
        source = getattr(self, "image_display_pil", None) or getattr(self, "image_original_pil", None)
        if not source:
            return
        mode = self.image_resize_mode_var.get()
        try:
            if mode == "percent":
                percent = float(self.image_resize_percent_var.get())
                if percent <= 0:
                    messagebox.showinfo("Giá trị không hợp lệ", "Phần trăm phải lớn hơn 0.", parent=self)
                    return
                if percent >= 100:
                    messagebox.showinfo("Không phải giảm", "Nhập % nhỏ hơn 100 để giảm kích thước.", parent=self)
                    return
                scale = percent / 100.0
                new_w = max(1, int(source.width * scale))
                new_h = max(1, int(source.height * scale))
            else:
                width = int(self.image_resize_width_var.get() or 0)
                height = int(self.image_resize_height_var.get() or 0)
                if width <= 0 and height <= 0:
                    messagebox.showinfo("Thiếu kích thước", "Nhập chiều rộng hoặc chiều cao.", parent=self)
                    return
                if self.image_keep_ratio_var.get():
                    if width > 0 and height > 0:
                        scale = min(width / source.width, height / source.height)
                        new_w = max(1, int(source.width * scale))
                        new_h = max(1, int(source.height * scale))
                    elif width > 0:
                        scale = width / source.width
                        new_w = max(1, width)
                        new_h = max(1, int(source.height * scale))
                    else:
                        scale = height / source.height
                        new_h = max(1, height)
                        new_w = max(1, int(source.width * scale))
                else:
                    if width <= 0 or height <= 0:
                        messagebox.showinfo("Thiếu kích thước", "Nhập đủ chiều rộng và chiều cao.", parent=self)
                        return
                    new_w, new_h = max(1, width), max(1, height)
            if new_w >= source.width and new_h >= source.height:
                messagebox.showinfo("Không phải giảm", "Kích thước mới phải nhỏ hơn ảnh hiện tại.", parent=self)
                return
            resized = source.resize((new_w, new_h), Image.Resampling.LANCZOS)
            self.image_display_pil = resized
            self.undo_image_btn.config(state="normal")
            self.save_image_btn.config(state="normal")
            self._update_image_display()
            self.image_status_label.config(text=f"Đã giảm kích thước: {new_w}x{new_h}")
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể giảm kích thước: {e}", parent=self)

    def _image_ai_clear_cache(self):
        try:
            for path in (self._image_ai_input_cache or {}).values():
                if path and os.path.isfile(path):
                    try:
                        os.remove(path)
                    except Exception:
                        pass
            input_cache_dir = self._image_ai_input_cache_dir()
            if os.path.isdir(input_cache_dir):
                try:
                    for name in os.listdir(input_cache_dir):
                        full = os.path.join(input_cache_dir, name)
                        if os.path.isfile(full):
                            os.remove(full)
                    if not os.listdir(input_cache_dir):
                        os.rmdir(input_cache_dir)
                except Exception:
                    pass
            output_cache_dir = self._image_ai_cache_dir()
            if os.path.isdir(output_cache_dir):
                try:
                    for name in os.listdir(output_cache_dir):
                        full = os.path.join(output_cache_dir, name)
                        if os.path.isfile(full):
                            os.remove(full)
                    if not os.listdir(output_cache_dir):
                        os.rmdir(output_cache_dir)
                except Exception:
                    pass
        except Exception:
            pass
        self._image_ai_cache = {}
        self._image_ai_input_cache = {}
        self._image_ai_input_path = ""
