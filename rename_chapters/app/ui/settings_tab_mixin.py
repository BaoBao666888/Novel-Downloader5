import tkinter as tk
from tkinter import ttk
import tkinter.font as tkfont

from app.ui.constants import THEME_PRESETS


class SettingsTabMixin:
    """UI cho tab Cài đặt."""

    def create_settings_tab(self):
        settings_tab = ttk.Frame(self.notebook)
        self.notebook.add(settings_tab, text="Cài đặt")
        settings_tab.rowconfigure(0, weight=1)
        settings_tab.columnconfigure(0, weight=1)

        canvas = tk.Canvas(settings_tab, highlightthickness=0, borderwidth=0)
        scrollbar = ttk.Scrollbar(settings_tab, orient="vertical", command=canvas.yview)
        canvas.configure(yscrollcommand=scrollbar.set)
        canvas.grid(row=0, column=0, sticky="nsew")
        scrollbar.grid(row=0, column=1, sticky="ns")

        content = ttk.Frame(canvas, padding="16")
        content_id = canvas.create_window((0, 0), window=content, anchor="nw")

        def _on_frame_configure(_event):
            canvas.configure(scrollregion=canvas.bbox("all"))

        def _on_canvas_configure(event):
            canvas.itemconfigure(content_id, width=event.width)

        def _on_mousewheel(event):
            if event.delta:
                canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
            elif event.num == 4:
                canvas.yview_scroll(-3, "units")
            elif event.num == 5:
                canvas.yview_scroll(3, "units")

        content.bind("<Configure>", _on_frame_configure)
        canvas.bind("<Configure>", _on_canvas_configure)
        canvas.bind("<Enter>", lambda _e: canvas.focus_set())
        canvas.bind("<MouseWheel>", _on_mousewheel)
        canvas.bind("<Button-4>", _on_mousewheel)
        canvas.bind("<Button-5>", _on_mousewheel)

        content.columnconfigure(1, weight=1)

        appearance_frame = ttk.LabelFrame(content, text="Giao diện hiện đại", padding=14, style="Section.TLabelframe")
        appearance_frame.grid(row=0, column=0, sticky="ew", columnspan=2)
        appearance_frame.columnconfigure(1, weight=1)

        ttk.Label(appearance_frame, text="Bảng màu:").grid(row=0, column=0, sticky="w", pady=(0, 6))
        self.ui_theme_var = tk.StringVar(value=self.ui_settings.get('theme', 'Midnight'))
        self.ui_theme_combo = ttk.Combobox(
            appearance_frame,
            state="readonly",
            values=list(THEME_PRESETS.keys()),
            textvariable=self.ui_theme_var,
        )
        self.ui_theme_combo.grid(row=0, column=1, sticky="ew", padx=(0, 8), pady=(0, 6))
        self.ui_theme_combo.bind(
            "<<ComboboxSelected>>",
            lambda _e: self._update_ui_settings(theme=self.ui_theme_var.get()),
        )

        ttk.Label(appearance_frame, text="Màu nhấn (hex):").grid(row=1, column=0, sticky="w")
        self.ui_accent_var = tk.StringVar(value=self.ui_settings.get('accent_color', '#6366f1'))
        self.accent_entry = ttk.Entry(appearance_frame, textvariable=self.ui_accent_var)
        self.accent_entry.grid(row=1, column=1, sticky="ew", padx=(0, 8))
        self.accent_entry.bind("<FocusOut>", lambda _e: self._commit_accent_entry())
        self.accent_button = ttk.Button(appearance_frame, text="Chọn màu", command=self._open_accent_picker)
        self.accent_button.grid(row=1, column=2, sticky="w")
        self.accent_preview = tk.Label(appearance_frame, width=4, height=1, relief=tk.FLAT, borderwidth=0)
        self.accent_preview.grid(row=1, column=3, padx=(10, 0))

        ttk.Label(appearance_frame, text="Màu chữ:").grid(row=2, column=0, sticky="w")
        self.ui_text_color_var = tk.StringVar(value=self.ui_settings.get('text_color', ''))
        self.text_color_entry = ttk.Entry(appearance_frame, textvariable=self.ui_text_color_var)
        self.text_color_entry.grid(row=2, column=1, sticky="ew", padx=(0, 8))
        self.text_color_entry.bind("<FocusOut>", lambda _e: self._commit_text_color_entry())
        self.text_color_button = ttk.Button(appearance_frame, text="Chọn màu", command=self._open_text_color_picker)
        self.text_color_button.grid(row=2, column=2, sticky="w")
        self.text_color_preview = tk.Label(appearance_frame, width=4, height=1, relief=tk.FLAT, borderwidth=0)
        self.text_color_preview.grid(row=2, column=3, padx=(10, 0))

        ttk.Label(appearance_frame, text="Màu nền:").grid(row=3, column=0, sticky="w", pady=(6, 0))
        self.ui_bg_color_var = tk.StringVar(value=self.ui_settings.get('background_color', ''))
        self.bg_color_entry = ttk.Entry(appearance_frame, textvariable=self.ui_bg_color_var)
        self.bg_color_entry.grid(row=3, column=1, sticky="ew", padx=(0, 8), pady=(6, 0))
        self.bg_color_entry.bind("<FocusOut>", lambda _e: self._commit_bg_color_entry())
        self.bg_color_button = ttk.Button(appearance_frame, text="Chọn màu", command=self._open_bg_color_picker)
        self.bg_color_button.grid(row=3, column=2, sticky="w", pady=(6, 0))
        self.bg_color_preview = tk.Label(appearance_frame, width=4, height=1, relief=tk.FLAT, borderwidth=0)
        self.bg_color_preview.grid(row=3, column=3, padx=(10, 0), pady=(6, 0))

        ttk.Label(appearance_frame, text="Font chữ:").grid(row=4, column=0, sticky="w", pady=(10, 0))
        font_candidates = [
            "Segoe UI",
            "Segoe UI Variable",
            "Inter",
            "Arial",
            "Calibri",
            "Tahoma",
            "Times New Roman",
        ]
        available_fonts = set(tkfont.families())
        font_values = [f for f in font_candidates if f in available_fonts] or sorted(list(available_fonts))[:10]
        self.ui_font_family_var = tk.StringVar(value=self.ui_settings.get('font_family', 'Segoe UI'))
        font_combo = ttk.Combobox(appearance_frame, textvariable=self.ui_font_family_var, values=font_values, state="readonly")
        font_combo.grid(row=4, column=1, sticky="ew", padx=(0, 8), pady=(10, 0))
        font_combo.bind("<<ComboboxSelected>>", lambda _e: self._update_ui_settings(font_family=self.ui_font_family_var.get()))

        ttk.Label(appearance_frame, text="Kích thước chữ:").grid(row=5, column=0, sticky="w", pady=(10, 0))
        self.ui_font_var = tk.IntVar(value=int(self.ui_settings.get('font_size', 10)))
        font_scale = ttk.Scale(
            appearance_frame,
            from_=9,
            to=14,
            orient=tk.HORIZONTAL,
            command=self._on_font_scale_change,
        )
        font_scale.set(self.ui_font_var.get())
        font_scale.grid(row=5, column=1, columnspan=2, sticky="ew", pady=(10, 0))
        font_scale.bind("<ButtonRelease-1>", self._commit_font_scale)
        self.font_size_label = ttk.Label(appearance_frame, text=f"{self.ui_font_var.get()} pt")
        self.font_size_label.grid(row=5, column=3, sticky="w", padx=(10, 0))

        self.ui_classic_var = tk.BooleanVar(value=bool(self.ui_settings.get('use_classic_theme', False)))
        ttk.Checkbutton(
            appearance_frame,
            text="Sử dụng giao diện cổ điển (ttk gốc)",
            variable=self.ui_classic_var,
            command=self._toggle_classic_theme,
        ).grid(row=6, column=0, columnspan=3, sticky="w", pady=(12, 0))

        animation_frame = ttk.LabelFrame(content, text="Hiệu ứng chuột", padding=14, style="Section.TLabelframe")
        animation_frame.grid(row=1, column=0, sticky="ew", pady=(12, 0), columnspan=2)
        animation_frame.columnconfigure(0, weight=1)

        self.ui_glow_var = tk.BooleanVar(value=bool(self.ui_settings.get('mouse_glow', False)))
        ttk.Checkbutton(
            animation_frame,
            text="Bật vòng sáng theo chuột (thử nghiệm)",
            variable=self.ui_glow_var,
            command=self._toggle_mouse_glow,
        ).grid(row=0, column=0, sticky="w")
        ttk.Label(
            animation_frame,
            text="Tạo hiệu ứng highlight nhẹ khi di chuyển chuột quanh ứng dụng.",
        ).grid(row=1, column=0, sticky="w", pady=(4, 0))

        tray_frame = ttk.LabelFrame(content, text="Chạy nền / Khay hệ thống", padding=14, style="Section.TLabelframe")
        tray_frame.grid(row=2, column=0, columnspan=2, sticky="ew", pady=(12, 0))
        tray_frame.columnconfigure(0, weight=1)

        self.bg_enable_var = tk.BooleanVar(value=bool(self.background_settings.get('enable', False)))
        ttk.Checkbutton(
            tray_frame,
            text="Đóng cửa sổ nhưng tiếp tục chạy ngầm (ẩn xuống khay)",
            variable=self.bg_enable_var,
            command=self._toggle_background_mode,
        ).grid(row=0, column=0, sticky="w")
        self.bg_start_hidden_var = tk.BooleanVar(value=bool(self.background_settings.get('start_hidden', False)))
        ttk.Checkbutton(
            tray_frame,
            text="Khởi động ẩn vào khay (khi bật chạy ngầm)",
            variable=self.bg_start_hidden_var,
            command=self._toggle_start_hidden,
        ).grid(row=1, column=0, sticky="w", pady=(6, 0))
        ttk.Label(
            tray_frame,
            text="Biểu tượng khay cung cấp menu Mở cửa sổ / Thoát hẳn.",
        ).grid(row=2, column=0, sticky="w", pady=(6, 0))

        bg_frame = ttk.LabelFrame(content, text="Ảnh nền", padding=14, style="Section.TLabelframe")
        bg_frame.grid(row=3, column=0, columnspan=2, sticky="ew", pady=(12, 0))
        bg_frame.columnconfigure(1, weight=1)
        ttk.Label(bg_frame, text="Đường dẫn:").grid(row=0, column=0, sticky="w")
        self.ui_background_var = tk.StringVar(value=self.ui_settings.get('background_image', ''))
        bg_entry = ttk.Entry(bg_frame, textvariable=self.ui_background_var, state="readonly")
        bg_entry.grid(row=0, column=1, sticky="ew", padx=(6, 6))
        ttk.Button(bg_frame, text="Chọn ảnh...", command=self._choose_background_image).grid(row=0, column=2, sticky="w")
        ttk.Button(bg_frame, text="Xóa ảnh", command=self._clear_background_image).grid(row=0, column=3, sticky="w", padx=(6, 0))
        ttk.Label(
            bg_frame,
            text="Ảnh sẽ tự co giãn theo cửa sổ. Hỗ trợ: PNG, JPG, JPEG, BMP.",
        ).grid(row=1, column=0, columnspan=4, sticky="w", pady=(6, 0))

        actions_frame = ttk.Frame(content)
        actions_frame.grid(row=4, column=0, columnspan=2, sticky="ew", pady=(16, 0))
        ttk.Button(actions_frame, text="Khôi phục mặc định", command=self._reset_ui_theme).pack(side=tk.LEFT)
        ttk.Button(actions_frame, text="Lưu cấu hình ngay", command=self.save_config).pack(side=tk.LEFT, padx=(8, 0))

        self._sync_ui_settings_controls()
        self._sync_background_controls()
