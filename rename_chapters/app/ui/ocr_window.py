import io
import contextlib
import os
import re
import tempfile
import threading
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


IMAGE_FILETYPES = (
    ("Image files", "*.png *.jpg *.jpeg *.webp *.bmp *.gif *.tif *.tiff"),
    ("All files", "*.*"),
)

MODEL_PLACEHOLDER = "Chưa tải model OCR"
TARGET_OPTIONS = (
    ("raw", "Không dịch"),
    ("vi", "Tiếng Việt"),
    ("hv", "Hán Việt"),
    ("en", "English"),
    ("zh", "中文"),
    ("ko", "한국어"),
    ("ja", "日本語"),
)


class OcrWindow(tk.Toplevel):
    def __init__(self, app):
        super().__init__(app)
        self.app = app
        self.title("OCR ảnh")
        self.geometry("1180x760")
        self.minsize(920, 560)
        if hasattr(app, "_apply_window_icon"):
            app._apply_window_icon(self)

        self.items: dict[str, dict] = {}
        self._next_iid = 1
        self._current_iid = ""
        self._preview_photo = None
        self._preview_zoom = 1.0
        self._preview_fit = True
        self._running = False
        self._all_model_options = ocr_service.get_paddle_model_options()
        self._model_options: list[dict] = []
        self._model_by_label: dict[str, dict] = {}
        self._model_by_key = {option["key"]: option for option in self._all_model_options}

        cfg = self._settings()
        saved_model = cfg.get("model_key") or ocr_service.DEFAULT_PADDLE_MODEL_KEY
        saved_target = cfg.get("target_lang") or "vi"

        self.model_var = tk.StringVar(value="")
        self._preferred_model_key = saved_model
        self.target_var = tk.StringVar(value=self._label_for_value(TARGET_OPTIONS, saved_target))
        self.status_var = tk.StringVar(value="Sẵn sàng OCR.")
        self.detail_var = tk.StringVar(value="")
        self.model_desc_var = tk.StringVar(value="")
        self.preview_zoom_var = tk.StringVar(value="Vừa khung")
        self.preview_boxes_var = tk.BooleanVar(value=True)

        self._build_widgets()
        self._refresh_dependency_status()
        self._refresh_model_choices(preferred_key=saved_model)
        self._update_model_description()
        self.protocol("WM_DELETE_WINDOW", self.close_window)

    def _settings(self):
        if isinstance(getattr(self.app, "app_config", None), dict):
            return self.app.app_config.setdefault("ocr_settings", {})
        return {}

    def _build_widgets(self):
        self._build_menu()
        root = ttk.Frame(self, padding=10)
        root.pack(fill=tk.BOTH, expand=True)
        root.rowconfigure(1, weight=1)
        root.columnconfigure(0, weight=1)

        settings = ttk.Frame(root)
        settings.grid(row=0, column=0, sticky="ew", pady=(0, 8))
        settings.columnconfigure(1, weight=1)
        ttk.Label(settings, text="Model:").grid(row=0, column=0, sticky="w")
        self.model_combo = ttk.Combobox(
            settings,
            textvariable=self.model_var,
            values=[],
            state="readonly",
            width=42,
        )
        self.model_combo.grid(row=0, column=1, sticky="ew", padx=(5, 8))
        self.model_combo.bind("<<ComboboxSelected>>", lambda _e: self._update_model_description(save=True))
        ttk.Button(settings, text="Quản lý model...", command=self.open_model_manager).grid(row=0, column=2, sticky="w", padx=(0, 12))
        ttk.Label(settings, text="Kết quả:").grid(row=0, column=3, sticky="w")
        self.target_combo = ttk.Combobox(
            settings,
            textvariable=self.target_var,
            values=[label for _value, label in TARGET_OPTIONS],
            state="readonly",
            width=16,
        )
        self.target_combo.grid(row=0, column=4, sticky="w", padx=(5, 0))
        self.target_combo.bind("<<ComboboxSelected>>", lambda _e: self._save_settings())

        ttk.Label(settings, textvariable=self.model_desc_var, foreground="#475569", wraplength=960).grid(
            row=1, column=0, columnspan=5, sticky="ew", pady=(6, 0)
        )

        paned = ttk.PanedWindow(root, orient=tk.HORIZONTAL)
        paned.grid(row=1, column=0, sticky="nsew")

        left = ttk.Frame(paned)
        left.rowconfigure(1, weight=1)
        left.columnconfigure(0, weight=1)
        paned.add(left, weight=1)

        file_box = ttk.LabelFrame(left, text="Ảnh OCR", padding=6)
        file_box.grid(row=0, column=0, sticky="ew", pady=(0, 8))
        file_box.columnconfigure(0, weight=1)
        self.file_tree = ttk.Treeview(file_box, columns=("status", "model"), show="tree headings", height=7, selectmode="extended")
        self.file_tree.heading("#0", text="File")
        self.file_tree.heading("status", text="Trạng thái")
        self.file_tree.heading("model", text="Model")
        self.file_tree.column("#0", width=320, anchor="w")
        self.file_tree.column("status", width=110, anchor="w")
        self.file_tree.column("model", width=170, anchor="w")
        self.file_tree.grid(row=0, column=0, sticky="ew")
        file_scroll = ttk.Scrollbar(file_box, orient="vertical", command=self.file_tree.yview)
        file_scroll.grid(row=0, column=1, sticky="ns")
        self.file_tree.configure(yscrollcommand=file_scroll.set)
        self.file_tree.bind("<<TreeviewSelect>>", self._on_file_select)

        preview_box = ttk.LabelFrame(left, text="Preview ảnh", padding=6)
        preview_box.grid(row=1, column=0, sticky="nsew")
        preview_box.rowconfigure(1, weight=1)
        preview_box.columnconfigure(0, weight=1)
        preview_tools = ttk.Frame(preview_box)
        preview_tools.grid(row=0, column=0, columnspan=2, sticky="ew", pady=(0, 6))
        ttk.Button(preview_tools, text="-", width=3, command=lambda: self._zoom_preview(1 / 1.25)).pack(side=tk.LEFT)
        ttk.Button(preview_tools, text="+", width=3, command=lambda: self._zoom_preview(1.25)).pack(side=tk.LEFT, padx=(4, 0))
        ttk.Button(preview_tools, text="100%", width=6, command=self._actual_size_preview).pack(side=tk.LEFT, padx=(8, 0))
        ttk.Button(preview_tools, text="Vừa khung", command=self._fit_preview).pack(side=tk.LEFT, padx=(4, 0))
        ttk.Label(preview_tools, textvariable=self.preview_zoom_var, width=10).pack(side=tk.LEFT, padx=(8, 0))
        ttk.Checkbutton(
            preview_tools,
            text="Hiện khung OCR",
            variable=self.preview_boxes_var,
            command=self._show_preview,
        ).pack(side=tk.LEFT, padx=(12, 0))
        self.preview_canvas = tk.Canvas(preview_box, background="#f8fafc", highlightthickness=0)
        self.preview_canvas.grid(row=1, column=0, sticky="nsew")
        preview_y = ttk.Scrollbar(preview_box, orient="vertical", command=self.preview_canvas.yview)
        preview_y.grid(row=1, column=1, sticky="ns")
        preview_x = ttk.Scrollbar(preview_box, orient="horizontal", command=self.preview_canvas.xview)
        preview_x.grid(row=2, column=0, sticky="ew")
        self.preview_canvas.configure(xscrollcommand=preview_x.set, yscrollcommand=preview_y.set)
        self.preview_canvas.bind("<Configure>", lambda _e: self._show_preview())
        self.preview_canvas.bind("<Control-MouseWheel>", self._on_preview_mousewheel)

        right = ttk.Frame(paned)
        right.rowconfigure(1, weight=1)
        right.columnconfigure(0, weight=1)
        paned.add(right, weight=1)
        ttk.Label(right, textvariable=self.detail_var, foreground="#334155").grid(row=0, column=0, sticky="ew", pady=(0, 6))

        notebook = ttk.Notebook(right)
        notebook.grid(row=1, column=0, sticky="nsew")
        raw_frame = ttk.Frame(notebook, padding=4)
        result_frame = ttk.Frame(notebook, padding=4)
        notebook.add(raw_frame, text="OCR gốc")
        notebook.add(result_frame, text="Kết quả")
        raw_frame.rowconfigure(0, weight=1)
        raw_frame.columnconfigure(0, weight=1)
        result_frame.rowconfigure(0, weight=1)
        result_frame.columnconfigure(0, weight=1)

        text_font = ("Microsoft YaHei", 13)
        self.raw_text = scrolledtext.ScrolledText(raw_frame, wrap=tk.WORD, undo=True, font=text_font)
        self.raw_text.grid(row=0, column=0, sticky="nsew")
        self.result_text = scrolledtext.ScrolledText(result_frame, wrap=tk.WORD, undo=True, font=text_font)
        self.result_text.grid(row=0, column=0, sticky="nsew")
        for widget in (self.raw_text, self.result_text):
            widget.tag_configure("body", spacing1=3, spacing3=7)
            widget.bind("<FocusOut>", lambda _e: self._sync_current_texts())

        ttk.Label(root, textvariable=self.status_var, anchor="w").grid(row=2, column=0, sticky="ew", pady=(8, 0))

    def _build_menu(self):
        self.menubar = tk.Menu(self)
        self.config(menu=self.menubar)

        file_menu = tk.Menu(self.menubar, tearoff=False)
        self.menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="Thêm ảnh...", accelerator="Ctrl+O", command=self.add_files_dialog)
        file_menu.add_command(label="Dán ảnh từ clipboard", accelerator="Ctrl+Shift+V", command=self.paste_image)
        file_menu.add_command(label="Thêm ảnh từ URL...", accelerator="Ctrl+U", command=self.load_url)
        file_menu.add_separator()
        file_menu.add_command(label="Xóa ảnh đã chọn", accelerator="Delete", command=self.remove_selected)
        file_menu.add_command(label="Đóng cửa sổ", accelerator="Ctrl+W", command=self.close_window)

        ocr_menu = tk.Menu(self.menubar, tearoff=False)
        self.menubar.add_cascade(label="OCR", menu=ocr_menu)
        ocr_menu.add_command(label="OCR file hiện tại", accelerator="F5", command=self.run_current)
        ocr_menu.add_command(label="OCR tất cả", accelerator="Ctrl+F5", command=self.run_all)
        ocr_menu.add_separator()
        ocr_menu.add_command(label="Quản lý model...", accelerator="Ctrl+M", command=self.open_model_manager)
        ocr_menu.add_command(label="Cài/cập nhật runtime...", command=self.install_runtime)

        edit_menu = tk.Menu(self.menubar, tearoff=False)
        self.menubar.add_cascade(label="Sửa", menu=edit_menu)
        edit_menu.add_command(label="Copy OCR gốc", accelerator="Ctrl+Shift+C", command=self.copy_raw)
        edit_menu.add_command(label="Copy kết quả", accelerator="Ctrl+Alt+C", command=self.copy_result)

        view_menu = tk.Menu(self.menubar, tearoff=False)
        self.menubar.add_cascade(label="Xem", menu=view_menu)
        view_menu.add_command(label="Phóng to ảnh", accelerator="Ctrl++", command=lambda: self._zoom_preview(1.25))
        view_menu.add_command(label="Thu nhỏ ảnh", accelerator="Ctrl+-", command=lambda: self._zoom_preview(1 / 1.25))
        view_menu.add_command(label="Ảnh 100%", accelerator="Ctrl+0", command=self._actual_size_preview)
        view_menu.add_command(label="Vừa khung", accelerator="Ctrl+9", command=self._fit_preview)
        view_menu.add_checkbutton(label="Hiện khung OCR", variable=self.preview_boxes_var, command=self._show_preview)

        self._bind_shortcut("<Control-o>", self.add_files_dialog)
        self._bind_shortcut("<Control-O>", self.add_files_dialog)
        self._bind_shortcut("<Control-Shift-V>", self.paste_image)
        self._bind_shortcut("<Control-U>", self.load_url)
        self._bind_shortcut("<Delete>", self.remove_selected)
        self._bind_shortcut("<F5>", self.run_current)
        self._bind_shortcut("<Control-F5>", self.run_all)
        self._bind_shortcut("<Control-M>", self.open_model_manager)
        self._bind_shortcut("<Control-W>", self.close_window)
        self._bind_shortcut("<Control-Shift-C>", self.copy_raw)
        self._bind_shortcut("<Control-Alt-C>", self.copy_result)
        self._bind_shortcut("<Control-plus>", lambda: self._zoom_preview(1.25))
        self._bind_shortcut("<Control-equal>", lambda: self._zoom_preview(1.25))
        self._bind_shortcut("<Control-minus>", lambda: self._zoom_preview(1 / 1.25))
        self._bind_shortcut("<Control-0>", self._actual_size_preview)
        self._bind_shortcut("<Control-9>", self._fit_preview)

    def _bind_shortcut(self, sequence, command):
        def run(_event=None):
            command()
            return "break"

        self.bind(sequence, run)

    def _refresh_dependency_status(self):
        status = ocr_service.get_ocr_runtime_status(self._runtime_meta())
        if status.get("installed"):
            version = status.get("version") or status.get("target_version") or "?"
            self.status_var.set(f"OCR runtime sẵn sàng (v{version}).")
        else:
            self.status_var.set("Chưa cài OCR runtime. Bấm Cài runtime hoặc mở menu OCR để tải gói runtime.")

    def _runtime_meta(self):
        if hasattr(self.app, "_ocr_runtime_meta"):
            try:
                return self.app._ocr_runtime_meta()
            except Exception:
                return {}
        return {}

    def _ensure_runtime(self, force=False) -> bool:
        if hasattr(self.app, "_ensure_ocr_runtime_installed_prompt"):
            ok = self.app._ensure_ocr_runtime_installed_prompt(parent=self, force=force)
            self._refresh_dependency_status()
            return bool(ok)
        return bool(ocr_service.get_ocr_runtime_status(self._runtime_meta()).get("installed"))

    def install_runtime(self):
        self._ensure_runtime(force=True)
        self._refresh_model_choices()

    def _model_label(self, option):
        return f"{option['label']} ({option['size']})"

    def _label_for_value(self, pairs, value):
        for item_value, label in pairs:
            if item_value == value:
                return label
        return pairs[0][1]

    def _value_for_label(self, pairs, label):
        for value, item_label in pairs:
            if item_label == label:
                return value
        return pairs[0][0]

    def _selected_model(self):
        return self._model_by_label.get(self.model_var.get())

    def _refresh_model_choices(self, preferred_key=""):
        preferred_key = preferred_key or self._preferred_model_key
        self._model_options = ocr_service.get_downloaded_paddle_model_options()
        self._model_by_label = {self._model_label(option): option for option in self._model_options}
        labels = list(self._model_by_label.keys())
        self.model_combo.configure(values=labels)
        selected = None
        if preferred_key:
            selected = next((option for option in self._model_options if option["key"] == preferred_key), None)
        if selected is None and self._model_options:
            selected = self._model_options[0]
        if selected is not None:
            self.model_combo.configure(state="readonly")
            self.model_var.set(self._model_label(selected))
            self._preferred_model_key = selected["key"]
        else:
            self.model_combo.configure(state="disabled")
            self.model_var.set(MODEL_PLACEHOLDER)
            self._preferred_model_key = ""
        self._update_model_description()

    def _update_model_description(self, save=False):
        option = self._selected_model()
        if not option:
            self.model_desc_var.set(
                "Chưa có model OCR trong thư mục local/ocr_models. Mở OCR > Quản lý model để tải model PaddleOCR."
            )
            return
        parts = [
            option["description"],
            f"Ngôn ngữ: {option['lang']}",
            f"Detect: {option.get('det_model') or 'mặc định theo PaddleOCR'}",
            f"Recognize: {option.get('rec_model') or 'mặc định theo PaddleOCR'}",
        ]
        self.model_desc_var.set(" | ".join(parts))
        if save:
            self._save_settings()

    def _save_settings(self):
        cfg = self._settings()
        if cfg is None:
            return
        model = self._selected_model()
        if model:
            cfg["model_key"] = model["key"]
        cfg["target_lang"] = self._value_for_label(TARGET_OPTIONS, self.target_var.get())

    def _temp_dir(self):
        path = os.path.join(BASE_DIR, "local", "ocr_inputs")
        os.makedirs(path, exist_ok=True)
        return path

    def _save_temp_image(self, image, suffix=".png"):
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix, dir=self._temp_dir())
        tmp.close()
        image.save(tmp.name)
        return tmp.name

    def add_files_dialog(self):
        paths = filedialog.askopenfilenames(title="Chọn ảnh OCR", filetypes=IMAGE_FILETYPES, parent=self)
        self.add_paths(paths)

    def add_paths(self, paths):
        added = []
        for path in paths or []:
            if not path:
                continue
            path = os.path.abspath(str(path))
            if not os.path.exists(path):
                continue
            iid = f"ocr_{self._next_iid}"
            self._next_iid += 1
            model = self._selected_model()
            self.items[iid] = {
                "path": path,
                "raw": "",
                "result": "",
                "status": "Chờ",
                "engine": "",
                "model_key": model["key"] if model else "",
                "model_label": model["label"] if model else MODEL_PLACEHOLDER,
                "language": model["lang"] if model else "",
                "blocks": [],
            }
            self.file_tree.insert(
                "",
                "end",
                iid=iid,
                text=os.path.basename(path),
                values=("Chờ", model["label"] if model else MODEL_PLACEHOLDER),
            )
            added.append(iid)
        if added:
            self.file_tree.selection_set(added[0])
            self.file_tree.focus(added[0])
            self._on_file_select()
            self.status_var.set(f"Đã thêm {len(added)} ảnh.")

    def paste_image(self):
        if ImageGrab is None:
            messagebox.showerror("Thiếu hỗ trợ", "Môi trường này không hỗ trợ đọc ảnh từ clipboard.", parent=self)
            return
        try:
            data = ImageGrab.grabclipboard()
            if isinstance(data, Image.Image):
                path = self._save_temp_image(data.convert("RGB"), ".png")
                self.add_paths([path])
                self.status_var.set("Đã dán ảnh từ clipboard.")
                return
            if isinstance(data, list) and data:
                self.add_paths([str(item) for item in data if os.path.exists(str(item))])
                return
            messagebox.showinfo("Clipboard trống", "Không tìm thấy ảnh trong clipboard.", parent=self)
        except Exception as exc:
            messagebox.showerror("Lỗi clipboard", f"Không thể dán ảnh: {exc}", parent=self)

    def load_url(self):
        url = simpledialog.askstring("URL ảnh", "Dán URL ảnh cần OCR:", parent=self)
        if not url:
            return
        try:
            self.status_var.set("Đang tải ảnh từ URL...")
            response = requests.get(url.strip(), timeout=30)
            response.raise_for_status()
            image = Image.open(io.BytesIO(response.content))
            ext = os.path.splitext(urlparse(url).path)[1].lower()
            suffix = ext if ext in {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif", ".tif", ".tiff"} else ".png"
            path = self._save_temp_image(image.convert("RGB"), suffix)
            self.add_paths([path])
            self.status_var.set("Đã tải ảnh từ URL.")
        except Exception as exc:
            self.status_var.set("Tải URL thất bại.")
            messagebox.showerror("Lỗi URL ảnh", f"Không thể tải ảnh: {exc}", parent=self)

    def remove_selected(self):
        for iid in list(self.file_tree.selection()):
            self.items.pop(iid, None)
            self.file_tree.delete(iid)
            if iid == self._current_iid:
                self._current_iid = ""
        if not self.file_tree.get_children():
            self.raw_text.delete("1.0", tk.END)
            self.result_text.delete("1.0", tk.END)
            self.detail_var.set("")
            self.preview_canvas.delete("all")

    def _on_file_select(self, _event=None):
        self._sync_current_texts()
        selection = self.file_tree.selection()
        if not selection:
            return
        iid = selection[0]
        item = self.items.get(iid)
        if not item:
            return
        self._current_iid = iid
        self.raw_text.delete("1.0", tk.END)
        self.raw_text.insert("1.0", item.get("raw", ""), "body")
        self.result_text.delete("1.0", tk.END)
        self.result_text.insert("1.0", item.get("result", ""), "body")
        self.detail_var.set(self._item_detail(item))
        self._show_preview()

    def _sync_current_texts(self):
        if not self._current_iid or self._current_iid not in self.items:
            return
        self.items[self._current_iid]["raw"] = self.raw_text.get("1.0", tk.END).strip()
        self.items[self._current_iid]["result"] = self.result_text.get("1.0", tk.END).strip()

    def _on_preview_mousewheel(self, event):
        if getattr(event, "delta", 0) > 0:
            self._zoom_preview(1.15)
        else:
            self._zoom_preview(1 / 1.15)
        return "break"

    def _zoom_preview(self, factor):
        self._preview_fit = False
        self._preview_zoom = min(6.0, max(0.08, self._preview_zoom * factor))
        self._show_preview()

    def _actual_size_preview(self):
        self._preview_fit = False
        self._preview_zoom = 1.0
        self._show_preview()

    def _fit_preview(self):
        self._preview_fit = True
        self._show_preview()

    def _update_zoom_label(self):
        if self._preview_fit:
            self.preview_zoom_var.set("Vừa khung")
        else:
            self.preview_zoom_var.set(f"{round(self._preview_zoom * 100):.0f}%")

    def _show_preview(self):
        iid = self._current_iid
        item = self.items.get(iid) if iid else None
        self.preview_canvas.delete("all")
        self._preview_photo = None
        if not item:
            return
        path = item.get("path", "")
        try:
            with Image.open(path) as img:
                img = img.convert("RGB")
                source_w, source_h = img.size
                canvas_w = max(self.preview_canvas.winfo_width() - 24, 240)
                canvas_h = max(self.preview_canvas.winfo_height() - 24, 240)
                if self._preview_fit:
                    self._preview_zoom = min(canvas_w / max(source_w, 1), canvas_h / max(source_h, 1), 1.0)
                    self._preview_zoom = max(0.08, self._preview_zoom)
                scale = self._preview_zoom
                view_w = max(1, int(source_w * scale))
                view_h = max(1, int(source_h * scale))
                preview = img.resize((view_w, view_h), Image.LANCZOS)
                self._preview_photo = ImageTk.PhotoImage(preview)
            pad = 12
            self.preview_canvas.create_image(pad, pad, image=self._preview_photo, anchor="nw")
            if self.preview_boxes_var.get():
                self._draw_ocr_boxes(item.get("blocks") or [], scale, pad)
            self.preview_canvas.configure(scrollregion=(0, 0, self._preview_photo.width() + pad * 2, self._preview_photo.height() + pad * 2))
            self._update_zoom_label()
        except Exception as exc:
            self.preview_canvas.create_text(16, 16, text=f"Không xem được ảnh: {exc}", anchor="nw", fill="#b91c1c")
            self.preview_canvas.configure(scrollregion=self.preview_canvas.bbox("all"))
            self._update_zoom_label()

    def _draw_ocr_boxes(self, blocks, scale, pad):
        for idx, block in enumerate(blocks or [], start=1):
            points = self._box_points(block.get("box") if isinstance(block, dict) else None)
            if not points:
                continue
            coords = [(pad + x * scale, pad + y * scale) for x, y in points]
            flat = [value for point in coords for value in point]
            outline = "#f97316"
            width = max(2, int(round(scale * 2)))
            if len(coords) >= 3:
                line_coords = [*flat, flat[0], flat[1]]
                self.preview_canvas.create_line(*line_coords, fill=outline, width=width)
            elif len(coords) == 2:
                self.preview_canvas.create_rectangle(*flat, outline=outline, width=width)
            min_x = min(x for x, _y in coords)
            min_y = min(y for _x, y in coords)
            label = str(idx)
            if isinstance(block, dict) and block.get("score") is not None:
                with contextlib.suppress(Exception):
                    label = f"{idx} {float(block['score']) * 100:.0f}%"
            text_id = self.preview_canvas.create_text(
                min_x + 4,
                max(pad + 4, min_y - 14),
                text=label,
                anchor="nw",
                fill="#7c2d12",
                font=("Segoe UI", 8, "bold"),
            )
            bbox = self.preview_canvas.bbox(text_id)
            if bbox:
                bg_id = self.preview_canvas.create_rectangle(*bbox, fill="#ffedd5", outline="#f97316")
                self.preview_canvas.tag_lower(bg_id, text_id)

    def _box_points(self, box):
        if not box:
            return []
        if isinstance(box, dict):
            if all(key in box for key in ("x", "y", "width", "height")):
                x = self._number(box.get("x"))
                y = self._number(box.get("y"))
                w = self._number(box.get("width"))
                h = self._number(box.get("height"))
                if None not in (x, y, w, h):
                    return [(x, y), (x + w, y + h)]
            left = self._number(box.get("left"))
            top = self._number(box.get("top"))
            right = self._number(box.get("right"))
            bottom = self._number(box.get("bottom"))
            if None not in (left, top, right, bottom):
                return [(left, top), (right, bottom)]
            return []
        if isinstance(box, (list, tuple)):
            if len(box) == 4 and all(self._number(value) is not None for value in box):
                x1, y1, x2, y2 = [float(value) for value in box]
                return [(x1, y1), (x2, y2)]
            points = []
            for item in box:
                if isinstance(item, (list, tuple)) and len(item) >= 2:
                    x = self._number(item[0])
                    y = self._number(item[1])
                    if x is not None and y is not None:
                        points.append((x, y))
            if len(points) >= 2:
                return points
        return []

    def _number(self, value):
        try:
            return float(value)
        except Exception:
            return None

    def _item_detail(self, item):
        path = item.get("path", "")
        model = item.get("model_label") or item.get("model_key") or ""
        engine = item.get("engine") or "paddle"
        blocks = len(item.get("blocks") or [])
        return f"{path} | engine: {engine} | model: {model} | khung: {blocks} | trạng thái: {item.get('status', '')}"

    def _set_item_status(self, iid, status, model_label=None, engine=None):
        item = self.items.get(iid)
        if not item:
            return
        item["status"] = status
        if model_label is not None:
            item["model_label"] = model_label
        if engine is not None:
            item["engine"] = engine
        values = self.file_tree.item(iid, "values")
        self.file_tree.item(iid, values=(status, model_label or (values[1] if len(values) > 1 else "")))
        if iid == self._current_iid:
            self.detail_var.set(self._item_detail(item))

    def selected_iids(self):
        return [iid for iid in self.file_tree.selection() if iid in self.items]

    def run_current(self):
        iids = self.selected_iids()
        if not iids:
            children = self.file_tree.get_children()
            if children:
                iids = [children[0]]
                self.file_tree.selection_set(iids[0])
            else:
                self.add_files_dialog()
                iids = self.selected_iids()
        if iids:
            self._run_ocr(iids[:1])

    def run_all(self):
        iids = [iid for iid in self.file_tree.get_children() if iid in self.items]
        if not iids:
            self.add_files_dialog()
            iids = [iid for iid in self.file_tree.get_children() if iid in self.items]
        if iids:
            self._run_ocr(iids)

    def _run_ocr(self, iids):
        if self._running:
            return
        self._sync_current_texts()
        self._save_settings()
        self._running = True
        engine = "paddle"
        model = self._selected_model()
        if not model:
            self._running = False
            self.status_var.set("Chưa có model OCR. Mở OCR > Quản lý model để tải trước.")
            self.open_model_manager()
            return
        target_lang = self._value_for_label(TARGET_OPTIONS, self.target_var.get())
        installed = ocr_service.get_ocr_runtime_status(self._runtime_meta()).get("installed")
        if not installed and not self._ensure_runtime():
            self.status_var.set("Đã hủy vì chưa cài OCR runtime.")
            self._running = False
            return
        self.status_var.set(f"Đang OCR {len(iids)} ảnh bằng {model['label']}...")

        settings = self._translator_settings()
        name_set = self._translator_name_set()

        def update_progress(message, value):
            self.after(0, lambda: self.status_var.set(f"{message} ({int(value)}%)"))

        def worker():
            try:
                for index, iid in enumerate(iids, start=1):
                    item = self.items.get(iid)
                    if not item:
                        continue
                    self.after(0, lambda iid=iid: self._set_item_status(iid, "Đang OCR", model["label"], engine))
                    payload = ocr_service.recognize_image(
                        item["path"],
                        engine=engine,
                        language=model["lang"],
                        model_key=model["key"],
                        meta=self._runtime_meta(),
                    )
                    raw_text = self._clean_ocr_text(str(payload.get("text") or ""))
                    result_text = raw_text
                    if raw_text and target_lang != "raw":
                        lines = [line for line in raw_text.splitlines() if line.strip()]
                        self.after(0, lambda idx=index, total=len(iids): self.status_var.set(f"Đang dịch OCR {idx}/{total}..."))
                        translated = trans_logic.translate_text_chunks(
                            lines,
                            name_set,
                            settings,
                            update_progress,
                            target_lang=target_lang,
                        )
                        result_text = "\n".join(translated).strip()
                    item.update(
                        {
                            "raw": raw_text,
                            "result": result_text,
                            "engine": payload.get("engine") or engine,
                            "model_key": payload.get("model_key") or model["key"],
                            "model_label": payload.get("model_label") or model["label"],
                            "language": payload.get("language") or model["lang"],
                            "blocks": payload.get("blocks") or [],
                        }
                    )
                    status = "Xong" if raw_text else "Không có chữ"
                    self.after(0, lambda iid=iid, status=status, item=item: self._finish_item(iid, status, item))
                self.after(0, lambda: self.status_var.set(f"OCR xong {len(iids)} ảnh."))
            except Exception as exc:
                self.after(0, lambda e=exc: messagebox.showerror("Lỗi OCR", str(e), parent=self))
                self.after(0, lambda e=exc: self.status_var.set(f"OCR thất bại: {e}"))
            finally:
                self.after(0, lambda: setattr(self, "_running", False))

        threading.Thread(target=worker, daemon=True).start()

    def _finish_item(self, iid, status, item):
        self._set_item_status(iid, status, item.get("model_label"), item.get("engine"))
        if iid == self._current_iid:
            self.raw_text.delete("1.0", tk.END)
            self.raw_text.insert("1.0", item.get("raw", ""), "body")
            self.result_text.delete("1.0", tk.END)
            self.result_text.insert("1.0", item.get("result", ""), "body")
            self.detail_var.set(self._item_detail(item))
            self._show_preview()

    def _translator_settings(self):
        if hasattr(self.app, "_translator_collect_runtime_settings"):
            try:
                return self.app._translator_collect_runtime_settings()
            except Exception:
                pass
        return dict((getattr(self.app, "app_config", {}) or {}).get("translator_settings", {}) or {})

    def _translator_name_set(self):
        if hasattr(self.app, "_translator_get_active_name_set"):
            try:
                return self.app._translator_get_active_name_set()
            except Exception:
                pass
        config = getattr(self.app, "app_config", {}) or {}
        set_name = config.get("activeNameSet", "Mặc định")
        return dict(config.get("nameSets", {}).get(set_name, {}) or {})

    def _clean_ocr_text(self, raw_text):
        text = re.sub(r"([^\x00-\xff])[^\S\r\n]+([^\x00-\xff])", r"\1\2", raw_text or "")
        return text.strip()

    def open_model_manager(self):
        win = tk.Toplevel(self)
        win.title("Quản lý model PaddleOCR")
        win.geometry("860x500")
        win.minsize(720, 420)
        win.transient(self)
        if hasattr(self.app, "_apply_window_icon"):
            self.app._apply_window_icon(win)

        root = ttk.Frame(win, padding=10)
        root.pack(fill=tk.BOTH, expand=True)
        root.rowconfigure(0, weight=1)
        root.columnconfigure(0, weight=1)

        columns = ("status", "size", "lang", "det", "rec")
        tree = ttk.Treeview(root, columns=columns, show="tree headings", selectmode="browse")
        tree.heading("#0", text="Model")
        tree.heading("status", text="Trạng thái")
        tree.heading("size", text="Size")
        tree.heading("lang", text="Lang")
        tree.heading("det", text="Detect")
        tree.heading("rec", text="Recognize")
        tree.column("#0", width=250, anchor="w")
        tree.column("status", width=90, anchor="w")
        tree.column("size", width=70, anchor="w")
        tree.column("lang", width=70, anchor="w")
        tree.column("det", width=155, anchor="w")
        tree.column("rec", width=180, anchor="w")
        tree.grid(row=0, column=0, sticky="nsew")
        scroll = ttk.Scrollbar(root, orient="vertical", command=tree.yview)
        scroll.grid(row=0, column=1, sticky="ns")
        tree.configure(yscrollcommand=scroll.set)

        desc_var = tk.StringVar(value="")
        status_var = tk.StringVar(value=f"Thư mục model: {ocr_service.ocr_model_cache_dir()}")
        ttk.Label(root, textvariable=desc_var, wraplength=800, foreground="#475569").grid(
            row=1, column=0, columnspan=2, sticky="ew", pady=(8, 0)
        )
        ttk.Label(root, textvariable=status_var, anchor="w").grid(row=2, column=0, columnspan=2, sticky="ew", pady=(8, 0))

        actions = ttk.Frame(root)
        actions.grid(row=3, column=0, columnspan=2, sticky="ew", pady=(10, 0))
        download_btn = ttk.Button(actions, text="Tải model đã chọn")
        use_btn = ttk.Button(actions, text="Dùng model này")
        refresh_btn = ttk.Button(actions, text="Làm mới")
        close_btn = ttk.Button(actions, text="Đóng", command=win.destroy)
        download_btn.pack(side=tk.LEFT)
        use_btn.pack(side=tk.LEFT, padx=(6, 0))
        refresh_btn.pack(side=tk.LEFT, padx=(6, 0))
        close_btn.pack(side=tk.RIGHT)

        def selected_option():
            selection = tree.selection()
            if not selection:
                return None
            return self._model_by_key.get(selection[0])

        def update_desc(_event=None):
            option = selected_option()
            if not option:
                desc_var.set("")
                return
            state = "đã tải" if ocr_service.is_paddle_model_downloaded(option["key"]) else "chưa tải"
            desc_var.set(f"{option['description']} | {state} | detect: {option.get('det_model') or 'default'} | rec: {option.get('rec_model') or 'default'}")

        def refresh(select_key=""):
            tree.delete(*tree.get_children())
            preferred = select_key or self._preferred_model_key or ocr_service.DEFAULT_PADDLE_MODEL_KEY
            fallback = ""
            for option in self._all_model_options:
                downloaded = ocr_service.is_paddle_model_downloaded(option["key"])
                status = "Đã tải" if downloaded else "Chưa tải"
                tree.insert(
                    "",
                    "end",
                    iid=option["key"],
                    text=option["label"],
                    values=(status, option["size"], option["lang"], option.get("det_model") or "-", option.get("rec_model") or "-"),
                )
                if not fallback:
                    fallback = option["key"]
            key = preferred if tree.exists(preferred) else fallback
            if key:
                tree.selection_set(key)
                tree.focus(key)
                tree.see(key)
            self._refresh_model_choices(preferred_key=preferred)
            update_desc()

        def use_selected():
            option = selected_option()
            if not option:
                return
            if not ocr_service.is_paddle_model_downloaded(option["key"]):
                status_var.set("Model này chưa tải. Bấm Tải model đã chọn trước.")
                return
            self._refresh_model_choices(preferred_key=option["key"])
            self._save_settings()
            status_var.set(f"Đang dùng model: {option['label']}")
            win.destroy()

        def set_actions_enabled(enabled):
            state = tk.NORMAL if enabled else tk.DISABLED
            download_btn.configure(state=state)
            use_btn.configure(state=state)
            refresh_btn.configure(state=state)

        def download_selected():
            if self._running:
                return
            option = selected_option()
            if not option:
                return
            if not self._ensure_runtime():
                status_var.set("Đã hủy vì chưa cài OCR runtime.")
                return
            self._running = True
            set_actions_enabled(False)
            status_var.set(f"Đang tải/warm-up model: {option['label']}...")

            def worker():
                try:
                    result = ocr_service.download_paddle_model(option["key"], meta=self._runtime_meta())
                    cfg = self._settings()
                    downloaded = cfg.setdefault("downloaded_models", {}) if isinstance(cfg, dict) else {}
                    downloaded[option["key"]] = True
                    if hasattr(self.app, "save_config"):
                        self.after(0, self.app.save_config)

                    def done():
                        cache_dir = result.get("cache_dir") or ocr_service.ocr_model_cache_dir()
                        refresh(select_key=option["key"])
                        self._refresh_model_choices(preferred_key=option["key"])
                        status_var.set(f"Đã tải model: {option['label']} | {cache_dir}")
                        self.status_var.set(f"Đã sẵn sàng model: {option['label']}")
                        set_actions_enabled(True)

                    self.after(0, done)
                except Exception as exc:
                    self.after(0, lambda e=exc: messagebox.showerror("Tải model PaddleOCR", str(e), parent=win))
                    self.after(0, lambda e=exc: status_var.set(f"Tải model thất bại: {e}"))
                    self.after(0, lambda: set_actions_enabled(True))
                finally:
                    self.after(0, lambda: setattr(self, "_running", False))

            threading.Thread(target=worker, daemon=True).start()

        tree.bind("<<TreeviewSelect>>", update_desc)
        tree.bind("<Double-1>", lambda _e: use_selected())
        download_btn.configure(command=download_selected)
        use_btn.configure(command=use_selected)
        refresh_btn.configure(command=lambda: refresh())
        refresh()

    def download_selected_model(self):
        self.open_model_manager()

    def copy_raw(self):
        text = self.raw_text.get("1.0", tk.END).strip()
        if text:
            self.clipboard_clear()
            self.clipboard_append(text)
            self.status_var.set("Đã copy OCR gốc.")

    def copy_result(self):
        text = self.result_text.get("1.0", tk.END).strip()
        if text:
            self.clipboard_clear()
            self.clipboard_append(text)
            self.status_var.set("Đã copy kết quả.")

    def close_window(self):
        self._sync_current_texts()
        self._save_settings()
        windows = getattr(self.app, "_ocr_windows", None)
        if windows is not None:
            windows.discard(self)
        self.destroy()
        return True
