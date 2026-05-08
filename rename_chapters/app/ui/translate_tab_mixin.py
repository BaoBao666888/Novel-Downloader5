import io
import json
import os
import re
import threading
import tempfile
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext, simpledialog
from urllib.parse import urlparse

import requests
from PIL import Image, ImageTk

try:
    from PIL import ImageGrab
except Exception:
    ImageGrab = None

from app.core import ocr_service
from app.core import translator as trans_logic
from app.paths import BASE_DIR


class TranslateTabMixin:
    """Tab dịch thuật và quản lý name-set."""

    def create_translator_tab(self):
        translator_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(translator_tab, text="Dịch")
        translator_tab.rowconfigure(0, weight=1)
        translator_tab.columnconfigure(0, weight=1)

        main_paned = ttk.PanedWindow(translator_tab, orient=tk.HORIZONTAL)
        main_paned.grid(row=0, column=0, sticky="nsew")

        left_frame = ttk.Frame(main_paned)
        main_paned.add(left_frame, weight=1)
        left_frame.rowconfigure(0, weight=1)
        left_frame.columnconfigure(0, weight=1)

        left_notebook = ttk.Notebook(left_frame)
        left_notebook.grid(row=0, column=0, sticky="nsew")
        self.translator_left_notebook = left_notebook

        input_tab = ttk.Frame(left_notebook, padding=5)
        left_notebook.add(input_tab, text="Văn bản gốc")
        input_tab.rowconfigure(0, weight=1)
        input_tab.columnconfigure(0, weight=1)

        self.translator_input_text = scrolledtext.ScrolledText(input_tab, wrap=tk.WORD, undo=True)
        self.translator_input_text.grid(row=0, column=0, sticky="nsew")

        ocr_tab = ttk.Frame(left_notebook, padding=5)
        left_notebook.add(ocr_tab, text="Dịch ảnh OCR")
        self._create_translator_ocr_tab(ocr_tab)

        name_tab = ttk.Frame(left_notebook, padding=10)
        left_notebook.add(name_tab, text="Quản lý Name")
        self._create_translator_name_manager(name_tab)

        adv_tab = ttk.Frame(left_notebook, padding=10)
        left_notebook.add(adv_tab, text="Nâng cao")
        self._create_translator_advanced_tab(adv_tab)

        right_frame = ttk.LabelFrame(main_paned, text="Kết quả dịch", padding=10)
        main_paned.add(right_frame, weight=1)
        right_frame.rowconfigure(0, weight=1)
        right_frame.columnconfigure(0, weight=1)

        self.translator_output_text = scrolledtext.ScrolledText(right_frame, wrap=tk.WORD, state="disabled")
        self.translator_output_text.grid(row=0, column=0, sticky="nsew")
        self.translator_output_text.chunk_data = {}
        self.translator_output_text.bind("<Button-3>", self._show_translator_context_menu)

        control_frame = ttk.Frame(translator_tab, padding=(0, 10, 0, 0))
        control_frame.grid(row=1, column=0, sticky="ew")
        control_frame.columnconfigure(2, weight=1)

        ttk.Button(
            control_frame,
            text="Tải file...",
            command=lambda: self._load_file_into_translator(self.translator_input_text),
        ).grid(row=0, column=0)
        ttk.Button(
            control_frame,
            text="Xóa hết",
            command=lambda: self.translator_input_text.delete("1.0", tk.END),
        ).grid(row=0, column=1, padx=5)

        self.translator_progress_bar = ttk.Progressbar(control_frame, orient="horizontal", mode="determinate")
        self.translator_progress_bar.grid(row=0, column=2, sticky="ew", padx=10)
        self.translator_progress_bar.grid_remove()

        ttk.Button(
            control_frame,
            text="Việt",
            command=lambda: self._start_translation_thread(self.translator_input_text, self.translator_output_text, target_lang="vi"),
        ).grid(row=0, column=3, padx=(0, 4))
        ttk.Button(
            control_frame,
            text="Hán Việt",
            command=lambda: self._start_translation_thread(self.translator_input_text, self.translator_output_text, target_lang="hv"),
        ).grid(row=0, column=4, padx=(0, 4))
        ttk.Button(control_frame, text="Xuất kết quả...", command=self._export_translation_result).grid(row=0, column=5, padx=(0, 4))

        self.translator_status_label = ttk.Label(control_frame, text="Sẵn sàng.")
        self.translator_status_label.grid(row=0, column=6, sticky="e", pady=(0, 0))

    def _create_translator_ocr_tab(self, parent):
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(3, weight=1)
        self.translator_ocr_image_path = ""
        self.translator_ocr_preview_image = None
        self.translator_ocr_path_var = tk.StringVar(value="Chưa chọn ảnh.")
        self.translator_ocr_status_var = tk.StringVar(value="Sẵn sàng OCR.")

        toolbar = ttk.Frame(parent)
        toolbar.grid(row=0, column=0, sticky="ew")
        ttk.Button(toolbar, text="Chọn ảnh...", command=self._translator_ocr_choose_image).pack(side=tk.LEFT)
        ttk.Button(toolbar, text="Dán ảnh", command=self._translator_ocr_paste_image).pack(side=tk.LEFT, padx=(5, 0))
        ttk.Button(toolbar, text="URL ảnh...", command=self._translator_ocr_load_url).pack(side=tk.LEFT, padx=(5, 0))
        ttk.Button(toolbar, text="OCR + Dịch", command=self._translator_ocr_run).pack(side=tk.LEFT, padx=(10, 0))
        ttk.Button(toolbar, text="Copy Trung", command=self._translator_ocr_copy_source).pack(side=tk.LEFT, padx=(5, 0))
        ttk.Button(toolbar, text="Copy Dịch", command=self._translator_ocr_copy_translation).pack(side=tk.LEFT, padx=(5, 0))
        ttk.Button(toolbar, text="Xóa", command=self._translator_ocr_clear).pack(side=tk.LEFT, padx=(5, 0))

        ttk.Label(parent, textvariable=self.translator_ocr_path_var, foreground="#64748b").grid(row=1, column=0, sticky="ew", pady=(6, 0))
        preview_frame = ttk.Frame(parent)
        preview_frame.grid(row=2, column=0, sticky="ew", pady=(6, 6))
        preview_frame.columnconfigure(1, weight=1)
        self.translator_ocr_preview_label = ttk.Label(preview_frame, text="Preview ảnh")
        self.translator_ocr_preview_label.grid(row=0, column=0, sticky="w")
        ttk.Label(preview_frame, textvariable=self.translator_ocr_status_var).grid(row=0, column=1, sticky="e")

        self.translator_ocr_text = scrolledtext.ScrolledText(parent, wrap=tk.WORD, undo=True)
        self.translator_ocr_text.grid(row=3, column=0, sticky="nsew")

    def _load_file_into_translator(self, text_widget):
        filepath = filedialog.askopenfilename(filetypes=[("Text files", "*.txt"), ("All files", "*.*")])
        if not filepath:
            return
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            text_widget.delete("1.0", tk.END)
            text_widget.insert("1.0", content)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc file: {e}", parent=self)

    def _translator_ocr_temp_dir(self):
        path = os.path.join(BASE_DIR, "local", "ocr_inputs")
        os.makedirs(path, exist_ok=True)
        return path

    def _translator_ocr_set_image_path(self, filepath):
        self.translator_ocr_image_path = filepath or ""
        if filepath:
            self.translator_ocr_path_var.set(filepath)
            self._translator_ocr_update_preview(filepath)
        else:
            self.translator_ocr_path_var.set("Chưa chọn ảnh.")
            self.translator_ocr_preview_image = None
            if hasattr(self, "translator_ocr_preview_label"):
                self.translator_ocr_preview_label.config(image="", text="Preview ảnh")

    def _translator_ocr_update_preview(self, filepath):
        try:
            with Image.open(filepath) as img:
                img.thumbnail((260, 160))
                self.translator_ocr_preview_image = ImageTk.PhotoImage(img.copy())
            self.translator_ocr_preview_label.config(image=self.translator_ocr_preview_image, text="")
        except Exception:
            self.translator_ocr_preview_image = None
            self.translator_ocr_preview_label.config(image="", text="Không xem trước được ảnh.")

    def _translator_ocr_save_temp_image(self, image, suffix=".png"):
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix, dir=self._translator_ocr_temp_dir())
        tmp.close()
        image.save(tmp.name)
        return tmp.name

    def _translator_ocr_choose_image(self):
        filepath = filedialog.askopenfilename(
            title="Chọn ảnh OCR",
            filetypes=[
                ("Image files", "*.png *.jpg *.jpeg *.webp *.bmp *.gif"),
                ("All files", "*.*"),
            ],
            parent=self,
        )
        if filepath:
            self._translator_ocr_set_image_path(filepath)
            self.translator_ocr_status_var.set("Đã chọn ảnh.")

    def _translator_ocr_paste_image(self):
        if ImageGrab is None:
            messagebox.showerror("Thiếu hỗ trợ", "Môi trường này không hỗ trợ đọc ảnh từ clipboard.", parent=self)
            return
        try:
            data = ImageGrab.grabclipboard()
            if isinstance(data, Image.Image):
                path = self._translator_ocr_save_temp_image(data.convert("RGB"), ".png")
                self._translator_ocr_set_image_path(path)
                self.translator_ocr_status_var.set("Đã dán ảnh từ clipboard.")
                return
            if isinstance(data, list) and data:
                first = str(data[0])
                if os.path.exists(first):
                    self._translator_ocr_set_image_path(first)
                    self.translator_ocr_status_var.set("Đã lấy file ảnh từ clipboard.")
                    return
            messagebox.showinfo("Clipboard trống", "Không tìm thấy ảnh trong clipboard.", parent=self)
        except Exception as exc:
            messagebox.showerror("Lỗi clipboard", f"Không thể dán ảnh: {exc}", parent=self)

    def _translator_ocr_load_url(self):
        url = simpledialog.askstring("URL ảnh", "Dán URL ảnh cần OCR:", parent=self)
        if not url:
            return
        try:
            self.translator_ocr_status_var.set("Đang tải ảnh từ URL...")
            response = requests.get(url.strip(), timeout=30)
            response.raise_for_status()
            image = Image.open(io.BytesIO(response.content))
            parsed = urlparse(url)
            ext = os.path.splitext(parsed.path)[1].lower()
            suffix = ext if ext in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"} else ".png"
            path = self._translator_ocr_save_temp_image(image.convert("RGB"), suffix)
            self._translator_ocr_set_image_path(path)
            self.translator_ocr_status_var.set("Đã tải ảnh từ URL.")
        except Exception as exc:
            self.translator_ocr_status_var.set("Tải URL thất bại.")
            messagebox.showerror("Lỗi URL ảnh", f"Không thể tải ảnh: {exc}", parent=self)

    def _translator_ocr_copy_source(self):
        if not hasattr(self, "translator_ocr_text"):
            return
        text = self.translator_ocr_text.get("1.0", tk.END).strip()
        if not text:
            return
        self.clipboard_clear()
        self.clipboard_append(text)
        self.translator_ocr_status_var.set("Đã copy chữ Trung OCR.")

    def _translator_ocr_copy_translation(self):
        if not hasattr(self, "translator_output_text"):
            return
        text = self.translator_output_text.get("1.0", tk.END).strip()
        if not text:
            return
        self.clipboard_clear()
        self.clipboard_append(text)
        self.translator_ocr_status_var.set("Đã copy bản dịch OCR.")

    def _translator_ocr_clear(self):
        self._translator_ocr_set_image_path("")
        if hasattr(self, "translator_ocr_text"):
            self.translator_ocr_text.delete("1.0", tk.END)
        if hasattr(self, "translator_output_text"):
            self.translator_output_text.config(state="normal")
            self.translator_output_text.delete("1.0", tk.END)
            self.translator_output_text.config(state="disabled")
        self.translator_ocr_status_var.set("Đã xóa OCR.")

    def _translator_get_active_name_set(self):
        set_name = self.translator_name_set_combo.get() if hasattr(self, "translator_name_set_combo") else ""
        return dict(self.app_config.get("nameSets", {}).get(set_name, {}) or {})

    def _translator_collect_runtime_settings(self):
        settings = self.app_config.setdefault("translator_settings", {})
        if hasattr(self, "adv_server_url"):
            settings["serverUrl"] = self.adv_server_url.get()
        if hasattr(self, "adv_hv_url"):
            settings["hanvietJsonUrl"] = self.adv_hv_url.get()
        if hasattr(self, "adv_delay"):
            settings["delayMs"] = self.adv_delay.get()
        if hasattr(self, "adv_max_chars"):
            settings["maxChars"] = self.adv_max_chars.get()
        proxies = self._get_proxy_for_request("translate") if hasattr(self, "_get_proxy_for_request") else None
        if proxies:
            self.log(f"Dịch thuật sử dụng proxy: {proxies['http']}")
        settings["proxies"] = proxies
        return dict(settings)

    def _translator_set_output_chunks(self, output_widget, original_chunks, translated_chunks):
        output_widget.config(state="normal")
        output_widget.delete("1.0", tk.END)
        output_widget.chunk_data = {}
        for i, translated_chunk in enumerate(translated_chunks):
            tag_name = f"chunk_{i}"
            original_chunk = original_chunks[i] if i < len(original_chunks) else ""
            output_widget.chunk_data[tag_name] = original_chunk
            output_widget.insert(tk.END, translated_chunk + "\n", (tag_name,))
        output_widget.config(state="disabled")

    def _translator_ocr_run(self):
        image_path = getattr(self, "translator_ocr_image_path", "")
        if not image_path:
            self._translator_ocr_choose_image()
            image_path = getattr(self, "translator_ocr_image_path", "")
            if not image_path:
                return
        if getattr(self, "_translator_ocr_running", False):
            return

        self._translator_ocr_running = True
        self.translator_ocr_status_var.set("Đang OCR ảnh...")
        self.translator_status_label.config(text="Đang OCR ảnh...")
        self.translator_progress_bar.config(value=0)
        self.translator_progress_bar.grid()

        settings = self._translator_collect_runtime_settings()
        active_name_set = self._translator_get_active_name_set()

        def update_progress(message, value):
            self.after(
                0,
                lambda: [
                    self.translator_status_label.config(text=message),
                    self.translator_ocr_status_var.set(message),
                    self.translator_progress_bar.config(value=value),
                    self.translator_progress_bar.grid(),
                ],
            )

        def worker():
            try:
                payload = ocr_service.recognize_image(image_path)
                engine_name = str(payload.get("engine") or "ocr")
                raw_text = str(payload.get("text") or "")
                cleaned_text = re.sub(r"([^\x00-\xff])[^\S\r\n]+([^\x00-\xff])", r"\1\2", raw_text).strip()
                if not cleaned_text:
                    self.after(0, lambda: messagebox.showinfo("OCR", "Không tìm thấy chữ trong ảnh.", parent=self))
                    return
                lines = cleaned_text.splitlines() or [cleaned_text]
                self.after(0, lambda: [self.translator_ocr_text.delete("1.0", tk.END), self.translator_ocr_text.insert("1.0", cleaned_text)])
                update_progress("Đang dịch chữ OCR...", 35)
                translated = trans_logic.translate_text_chunks(
                    lines,
                    active_name_set,
                    settings,
                    update_progress,
                    target_lang="vi",
                )
                self.after(0, lambda: self._translator_set_output_chunks(self.translator_output_text, lines, translated))
                self.after(0, lambda: self.translator_ocr_status_var.set(f"OCR xong ({engine_name}): {len(lines)} dòng."))
                self._last_translation_lang = "vi"
            except Exception as exc:
                self.after(0, lambda e=exc: messagebox.showerror("Lỗi OCR", str(e), parent=self))
                self.after(0, lambda: self.translator_ocr_status_var.set("OCR thất bại."))
            finally:
                def finish():
                    self._translator_ocr_running = False
                    self.translator_progress_bar.grid_remove()
                    if self.translator_status_label.cget("text").startswith("Đang"):
                        self.translator_status_label.config(text="Sẵn sàng.")
                self.after(0, finish)

        threading.Thread(target=worker, daemon=True).start()

    def _export_translation_result(self):
        if not hasattr(self, "translator_output_text"):
            return
        content = self.translator_output_text.get("1.0", tk.END).strip()
        if not content:
            messagebox.showinfo("Thông báo", "Chưa có nội dung dịch để xuất.", parent=self)
            return
        filepath = filedialog.asksaveasfilename(
            title="Xuất kết quả dịch",
            defaultextension=".txt",
            filetypes=[("Text file", "*.txt"), ("JSON (list)", "*.json"), ("All files", "*.*")],
        )
        if not filepath:
            return
        try:
            if filepath.lower().endswith(".json"):
                lines = [line for line in content.split("\n")]
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(lines, f, ensure_ascii=False, indent=2)
            else:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
            messagebox.showinfo("Thành công", f"Đã xuất kết quả: {filepath}", parent=self)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể lưu file: {e}", parent=self)

    def _create_translator_name_manager(self, parent):
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(1, weight=1)

        controls_frame = ttk.Frame(parent)
        controls_frame.grid(row=0, column=0, sticky="ew")

        set_selector_frame = ttk.Frame(controls_frame)
        set_selector_frame.pack(fill=tk.X, pady=(0, 5))
        ttk.Label(set_selector_frame, text="Bộ tên:").pack(side=tk.LEFT)
        self.translator_name_set_combo = ttk.Combobox(parent, state="readonly", values=list(self.app_config.get("nameSets", {}).keys()))
        self.translator_name_set_combo.pack(in_=set_selector_frame, side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        self.translator_name_set_combo.set(self.app_config.get("activeNameSet", "Mặc định"))
        self.translator_name_set_combo.bind("<<ComboboxSelected>>", lambda e: self._refresh_translator_name_preview())
        ttk.Button(set_selector_frame, text="Tạo mới", command=self._create_new_set).pack(side=tk.LEFT)
        ttk.Button(set_selector_frame, text="Xóa bộ", command=self._delete_current_set).pack(side=tk.LEFT, padx=5)

        tools_frame = ttk.Frame(controls_frame)
        tools_frame.pack(fill=tk.X, pady=(5, 10))
        ttk.Label(tools_frame, text="Công cụ:").pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(tools_frame, text="Nhập từ file", command=self._import_names).pack(side=tk.LEFT)
        ttk.Button(tools_frame, text="Xuất ra TXT", command=self._export_names_txt).pack(side=tk.LEFT, padx=5)
        ttk.Button(tools_frame, text="Xóa hết name", command=self._clear_names).pack(side=tk.LEFT)

        ttk.Label(controls_frame, text="Thêm/Sửa nhanh (Trung=Việt):").pack(anchor="w", pady=(10, 0))
        quick_add_text = scrolledtext.ScrolledText(controls_frame, height=5, wrap=tk.WORD, undo=True)
        quick_add_text.pack(fill=tk.X, expand=True, pady=(0, 5))

        def _quick_add_names():
            lines = quick_add_text.get("1.0", tk.END).strip().split("\n")
            set_name = self.translator_name_set_combo.get()
            if not set_name:
                return

            count = 0
            for line in lines:
                parts = line.split("=")
                if len(parts) == 2:
                    ch, vi = parts[0].strip(), parts[1].strip()
                    if ch and vi:
                        self.app_config["nameSets"][set_name][ch] = vi
                        count += 1
            if count > 0:
                self.save_config()
                quick_add_text.delete("1.0", tk.END)
                self._refresh_translator_name_preview()
                messagebox.showinfo("Thành công", f"Đã thêm/cập nhật {count} tên.", parent=self)
                added_keys = [line.split("=")[0].strip() for line in lines if "=" in line]
                if added_keys:
                    self._smart_retranslate(added_keys)

        ttk.Button(controls_frame, text="Thêm/Cập nhật các cặp này", command=_quick_add_names).pack(pady=(0, 10))

        preview_lf = ttk.LabelFrame(parent, text="Danh sách name")
        preview_lf.grid(row=1, column=0, sticky="nsew")
        preview_lf.rowconfigure(0, weight=1)
        preview_lf.columnconfigure(0, weight=1)

        self.name_preview_canvas = tk.Canvas(preview_lf)
        self.name_preview_canvas.grid(row=0, column=0, sticky="nsew")

        scrollbar = ttk.Scrollbar(preview_lf, orient="vertical", command=self.name_preview_canvas.yview)
        scrollbar.grid(row=0, column=1, sticky="ns")

        self.name_preview_frame = ttk.Frame(self.name_preview_canvas)
        self.name_preview_canvas.configure(yscrollcommand=scrollbar.set)
        self.name_preview_canvas.create_window((0, 0), window=self.name_preview_frame, anchor="nw")
        self.name_preview_frame.bind("<Configure>", lambda e: self.name_preview_canvas.configure(scrollregion=self.name_preview_canvas.bbox("all")))

        self._refresh_translator_name_preview()

    def _create_translator_advanced_tab(self, parent):
        parent.columnconfigure(1, weight=1)
        settings = self.app_config.get("translator_settings", {})

        self.adv_server_url = tk.StringVar(value=settings.get("serverUrl"))
        self.adv_hv_url = tk.StringVar(value=settings.get("hanvietJsonUrl"))
        self.adv_delay = tk.IntVar(value=settings.get("delayMs"))
        self.adv_max_chars = tk.IntVar(value=settings.get("maxChars"))

        ttk.Label(parent, text="URL Server Dịch:").grid(row=0, column=0, sticky="w", padx=5, pady=5)
        ttk.Entry(parent, textvariable=self.adv_server_url).grid(row=0, column=1, sticky="ew", padx=5)

        ttk.Label(parent, text="URL file Hán-Việt JSON:").grid(row=1, column=0, sticky="w", padx=5, pady=5)
        ttk.Entry(parent, textvariable=self.adv_hv_url).grid(row=1, column=1, sticky="ew", padx=5)

        ttk.Label(parent, text="Delay giữa các request (ms):").grid(row=2, column=0, sticky="w", padx=5, pady=5)
        ttk.Entry(parent, textvariable=self.adv_delay).grid(row=2, column=1, sticky="ew", padx=5)

        ttk.Label(parent, text="Số ký tự tối đa / request:").grid(row=3, column=0, sticky="w", padx=5, pady=5)
        ttk.Entry(parent, textvariable=self.adv_max_chars).grid(row=3, column=1, sticky="ew", padx=5)

    def _refresh_translator_name_preview(self):
        for widget in self.name_preview_frame.winfo_children():
            widget.destroy()

        set_name = self.translator_name_set_combo.get()
        current_set = self.app_config.get("nameSets", {}).get(set_name, {})

        if not current_set:
            ttk.Label(self.name_preview_frame, text="Bộ này trống.", padding=10).pack()
            return

        for key in sorted(current_set.keys()):
            row_frame = ttk.Frame(self.name_preview_frame, padding=(5, 3))
            row_frame.pack(fill=tk.X, expand=True)

            label_text = f"{key} = {current_set[key]}"
            ttk.Label(row_frame, text=label_text).pack(side=tk.LEFT, fill=tk.X, expand=True)

            ttk.Button(row_frame, text="Xóa", command=lambda k=key: self._delete_name_from_list(k)).pack(side=tk.RIGHT)
            ttk.Button(row_frame, text="Sửa/Gợi ý", command=lambda k=key, v=current_set[key]: self._edit_name(k, v)).pack(side=tk.RIGHT, padx=5)

    def _delete_name_from_list(self, key_to_delete: str):
        set_name = self.translator_name_set_combo.get()
        if not set_name:
            return

        if messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn xóa name '{key_to_delete}' không?", parent=self):
            if key_to_delete in self.app_config["nameSets"][set_name]:
                del self.app_config["nameSets"][set_name][key_to_delete]
                self.save_config()
                self._refresh_translator_name_preview()

    def _create_new_set(self):
        name = simpledialog.askstring("Tạo bộ mới", "Nhập tên cho bộ mới:", parent=self)
        if name and name not in self.app_config["nameSets"]:
            self.app_config["nameSets"][name] = {}
            self.translator_name_set_combo["values"] = list(self.app_config["nameSets"].keys())
            self.translator_name_set_combo.set(name)
            self._refresh_translator_name_preview()
            self.save_config()
        elif name:
            messagebox.showerror("Lỗi", "Tên bộ đã tồn tại.", parent=self)

    def _delete_current_set(self):
        set_name = self.translator_name_set_combo.get()
        if len(self.app_config["nameSets"]) <= 1:
            messagebox.showerror("Lỗi", "Không thể xóa bộ tên cuối cùng.", parent=self)
            return
        if messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn xóa bộ '{set_name}'?", parent=self):
            del self.app_config["nameSets"][set_name]
            new_active_set = list(self.app_config["nameSets"].keys())[0]
            self.translator_name_set_combo["values"] = list(self.app_config["nameSets"].keys())
            self.translator_name_set_combo.set(new_active_set)
            self._refresh_translator_name_preview()
            self.save_config()

    def _import_names(self):
        filepath = filedialog.askopenfilename(filetypes=[("Text & JSON", "*.txt *.json"), ("All files", "*.*")], parent=self)
        if not filepath:
            return

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            new_names = {}
            if filepath.endswith(".json"):
                new_names = json.loads(content)
            else:
                for line in content.split("\n"):
                    parts = line.split("=")
                    if len(parts) == 2 and parts[0].strip() and parts[1].strip():
                        new_names[parts[0].strip()] = parts[1].strip()

            set_name = self.translator_name_set_combo.get()
            self.app_config["nameSets"][set_name].update(new_names)
            self._refresh_translator_name_preview()
            self.save_config()
            messagebox.showinfo("Thành công", f"Đã nhập và cập nhật {len(new_names)} tên.", parent=self)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc file: {e}", parent=self)

    def _export_names_txt(self):
        set_name = self.translator_name_set_combo.get()
        current_set = self.app_config["nameSets"].get(set_name, {})
        filepath = filedialog.asksaveasfilename(
            defaultextension=".txt",
            initialfile=f"{set_name}.txt",
            filetypes=[("Text files", "*.txt")],
            parent=self,
        )
        if not filepath:
            return
        try:
            content = "\n".join(f"{k}={v}" for k, v in current_set.items())
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            messagebox.showinfo("Thành công", "Đã xuất file thành công.", parent=self)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể lưu file: {e}", parent=self)

    def _clear_names(self):
        set_name = self.translator_name_set_combo.get()
        if messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn xóa TẤT CẢ name trong bộ '{set_name}'?", icon="warning", parent=self):
            self.app_config["nameSets"][set_name] = {}
            self._refresh_translator_name_preview()
            self.save_config()

    def _edit_name(self, key, current_viet=""):
        original_key = key

        edit_win = tk.Toplevel(self)
        self._apply_window_icon(edit_win)
        edit_win.title("Thêm / Sửa Name")
        edit_win.geometry("500x150")

        main_frame = ttk.Frame(edit_win, padding=15)
        main_frame.pack(fill=tk.BOTH, expand=True)
        main_frame.columnconfigure(1, weight=1)

        ttk.Label(main_frame, text="Tiếng Trung:").grid(row=0, column=0, sticky="w", pady=2)
        key_entry = ttk.Entry(main_frame)
        key_entry.insert(0, key)
        key_entry.grid(row=0, column=1, sticky="ew", pady=2)

        ttk.Label(main_frame, text="Tiếng Việt:").grid(row=1, column=0, sticky="w", pady=2)
        viet_entry = ttk.Entry(main_frame)
        initial_value = current_viet or self.app_config["nameSets"][self.translator_name_set_combo.get()].get(key, "")
        viet_entry.insert(0, initial_value)
        viet_entry.grid(row=1, column=1, sticky="ew", pady=2)
        viet_entry.focus_set()
        viet_entry.selection_range(0, tk.END)

        btn_frame = ttk.Frame(main_frame)
        btn_frame.grid(row=2, column=0, columnspan=2, pady=(15, 0), sticky="e")

        def on_save_or_update():
            new_key = key_entry.get().strip()
            new_viet = viet_entry.get().strip()
            if not new_key or not new_viet:
                messagebox.showerror("Lỗi", "Không được để trống.", parent=edit_win)
                return

            set_name = self.translator_name_set_combo.get()
            if original_key != new_key and original_key in self.app_config["nameSets"][set_name]:
                del self.app_config["nameSets"][set_name][original_key]

            self.app_config["nameSets"][set_name][new_key] = new_viet
            self._refresh_translator_name_preview()
            self.save_config()
            edit_win.destroy()
            self._smart_retranslate([new_key])

        def on_delete():
            key_to_delete = key_entry.get().strip()
            if not key_to_delete:
                return

            set_name = self.translator_name_set_combo.get()
            if messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn xóa name '{key_to_delete}'?", parent=edit_win):
                if key_to_delete in self.app_config["nameSets"][set_name]:
                    del self.app_config["nameSets"][set_name][key_to_delete]
                    self.save_config()
                    self._refresh_translator_name_preview()
                edit_win.destroy()

        suggest_btn = ttk.Button(
            btn_frame,
            text="Gợi ý...",
            command=lambda: self._show_suggestion_window(
                key_entry.get(),
                lambda v: (viet_entry.delete(0, tk.END), viet_entry.insert(0, v), edit_win.lift(), viet_entry.focus_set()),
            ),
        )
        cancel_btn = ttk.Button(btn_frame, text="Hủy", command=edit_win.destroy)

        save_btn = ttk.Button(btn_frame, text="Lưu", command=on_save_or_update)
        update_btn = ttk.Button(btn_frame, text="Sửa", command=on_save_or_update)
        delete_btn = ttk.Button(btn_frame, text="Xóa", command=on_delete)

        def update_buttons(event=None):
            current_key = key_entry.get().strip()
            set_name = self.translator_name_set_combo.get()
            exists = current_key in self.app_config["nameSets"][set_name]

            save_btn.grid_remove()
            update_btn.grid_remove()
            delete_btn.grid_remove()

            if exists:
                update_btn.grid(row=0, column=2, padx=5)
                delete_btn.grid(row=0, column=3, padx=5)
            else:
                save_btn.grid(row=0, column=2, padx=5)

        suggest_btn.grid(row=0, column=0)
        cancel_btn.grid(row=0, column=1, padx=5)
        key_entry.bind("<KeyRelease>", update_buttons)
        update_buttons()

    def _show_translator_context_menu(self, event):
        widget = event.widget
        index = widget.index(f"@{event.x},{event.y}")
        tags = widget.tag_names(index)
        chunk_tag = next((t for t in tags if t.startswith("chunk_")), None)
        if not chunk_tag:
            return

        original_chinese = widget.chunk_data.get(chunk_tag)
        tag_range = widget.tag_ranges(chunk_tag)
        full_vietnamese_chunk = widget.get(tag_range[0], tag_range[1])

        if not original_chinese:
            return

        context_menu = tk.Menu(widget, tearoff=0)
        context_menu.add_command(label="Sửa Name...", command=lambda: self._edit_name(original_chinese, full_vietnamese_chunk.strip()))
        context_menu.tk_popup(event.x_root, event.y_root)

    def _show_suggestion_window(self, key, on_select_callback):
        suggest_win = tk.Toplevel(self)
        self._apply_window_icon(suggest_win)
        suggest_win.title(f"Gợi ý cho '{key}'")
        suggest_win.geometry("600x400")

        main_paned = ttk.PanedWindow(suggest_win, orient=tk.HORIZONTAL)
        main_paned.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        hv_frame = ttk.LabelFrame(main_paned, text="Hán-Việt")
        main_paned.add(hv_frame, weight=1)
        hv_text_frame = scrolledtext.ScrolledText(hv_frame, wrap=tk.WORD, state="disabled")
        hv_text_frame.pack(fill=tk.BOTH, expand=True)

        trans_frame = ttk.LabelFrame(main_paned, text="Gợi ý dịch")
        main_paned.add(trans_frame, weight=1)
        trans_text_frame = scrolledtext.ScrolledText(trans_frame, wrap=tk.WORD, state="disabled")
        trans_text_frame.pack(fill=tk.BOTH, expand=True)

        def update_and_close(new_name):
            on_select_callback(new_name)
            suggest_win.destroy()

        def create_clickable_label(parent_widget, text, callback):
            parent_widget.config(state="normal")
            tag_name = f"link_{text.replace(' ', '_')}"
            parent_widget.insert(tk.END, text + "\n", (tag_name,))
            parent_widget.tag_config(tag_name, foreground="blue", underline=True, spacing1=3, spacing3=3)
            parent_widget.tag_bind(tag_name, "<Enter>", lambda e: parent_widget.config(cursor="hand2"))
            parent_widget.tag_bind(tag_name, "<Leave>", lambda e: parent_widget.config(cursor=""))
            parent_widget.tag_bind(tag_name, "<Button-1>", lambda e, t=text: callback(t))
            parent_widget.config(state="disabled")

        def worker():
            hv_url = self.app_config.get("translator_settings", {}).get("hanvietJsonUrl")
            hv_map = trans_logic.load_hanviet_json(hv_url)
            hv_suggestion = trans_logic.build_hanviet_from_map(key, hv_map)
            hv_lines = trans_logic.progressive_capitalizations(hv_suggestion)

            server_url = self.app_config.get("translator_settings", {}).get("serverUrl")
            translated_arr = trans_logic._post_translate_batch([key], server_url)
            trans_suggestion = translated_arr[0] if translated_arr else ""
            trans_lines = trans_logic.progressive_capitalizations(trans_suggestion)

            def update_ui():
                for line in hv_lines:
                    create_clickable_label(hv_text_frame, line, update_and_close)
                for line in trans_lines:
                    create_clickable_label(trans_text_frame, line, update_and_close)

            self.after(0, update_ui)

        threading.Thread(target=worker, daemon=True).start()

    def _start_translation_thread(self, input_widget, output_widget, target_lang="vi"):
        input_content = input_widget.get("1.0", tk.END).strip()
        if not input_content:
            messagebox.showwarning("Cảnh báo", "Không có nội dung để dịch.", parent=self)
            return

        if getattr(self, "is_translating", False):
            return
        self.is_translating = True

        settings = self._translator_collect_runtime_settings()
        active_name_set = self._translator_get_active_name_set()

        thread = threading.Thread(
            target=self._translation_worker,
            args=(input_content, active_name_set, settings, output_widget, target_lang),
            daemon=True,
        )
        thread.start()

    def _translation_worker(self, content, name_set, settings, output_widget, target_lang="vi"):
        def update_ui_progress(message, value):
            self.after(
                0,
                lambda: [
                    self.translator_status_label.config(text=message),
                    self.translator_progress_bar.config(value=value),
                    self.translator_progress_bar.grid(),
                ],
            )

        chunks = content.split("\n")
        translated_chunks = trans_logic.translate_text_chunks(
            chunks, name_set, settings, update_ui_progress, target_lang=target_lang or "vi"
        )

        def update_output_widget():
            original_chunks = content.split("\n")
            self._translator_set_output_chunks(output_widget, original_chunks, translated_chunks)
            self._last_translation_lang = target_lang or "vi"
            self.translator_progress_bar.grid_remove()

        self.after(0, update_output_widget)
        self.is_translating = False

    def _smart_retranslate(self, affected_keys):
        """Dịch lại các chunk bị ảnh hưởng bởi việc thay đổi name."""
        if not hasattr(self, "translator_output_text") or not self.translator_output_text.chunk_data:
            return

        output_widget = self.translator_output_text
        chunks_to_retranslate = []
        update_plan = {}

        all_original_chunks = list(output_widget.chunk_data.values())
        for i, original_chunk in enumerate(all_original_chunks):
            if any(key in original_chunk for key in affected_keys):
                chunks_to_retranslate.append(original_chunk)
                tag_name = next((tag for tag, text in output_widget.chunk_data.items() if text == original_chunk), None)
                if tag_name:
                    update_plan[len(chunks_to_retranslate) - 1] = tag_name

        if not chunks_to_retranslate:
            return

        def worker():
            self.after(0, lambda: self.translator_status_label.config(text=f"Đang cập nhật {len(chunks_to_retranslate)} đoạn..."))
            set_name = self.translator_name_set_combo.get()
            active_name_set = self.app_config.get("nameSets", {}).get(set_name, {})
            settings = self.app_config.get("translator_settings", {})

            newly_translated = trans_logic.translate_text_chunks(
                chunks_to_retranslate, active_name_set, settings, target_lang=getattr(self, "_last_translation_lang", "vi")
            )

            def update_ui():
                output_widget.config(state="normal")
                for i, new_text in enumerate(newly_translated):
                    tag_name = update_plan.get(i)
                    if tag_name:
                        tag_range = output_widget.tag_ranges(tag_name)
                        if tag_range:
                            output_widget.delete(tag_range[0], tag_range[1])
                            output_widget.insert(tag_range[0], new_text + "\n", (tag_name,))
                output_widget.config(state="disabled")
                self.translator_status_label.config(text="Cập nhật hoàn tất.")

            self.after(0, update_ui)

        threading.Thread(target=worker, daemon=True).start()
