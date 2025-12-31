import io
import os
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

import cv2
import numpy as np
import requests
from PIL import Image, ImageFilter, ImageTk


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

        tools_frame = ttk.LabelFrame(img_tab, text="3. Công cụ & Lưu ảnh", padding=10)
        tools_frame.grid(row=2, column=0, sticky="ew", pady=(10, 0))
        tools_frame.columnconfigure(1, weight=1)

        ttk.Label(tools_frame, text="Công cụ:").grid(row=0, column=0, sticky="w", padx=5, pady=5)
        self.image_tool_combo = ttk.Combobox(
            tools_frame,
            state="readonly",
            values=[
                "Làm nét (Unsharp Mask)",
                "Tăng chi tiết (Detail)",
                "Nâng cấp độ phân giải x2 (Lanczos)",
            ],
        )
        self.image_tool_combo.grid(row=0, column=1, columnspan=2, sticky="ew", padx=5)
        self.image_tool_combo.set("Làm nét (Unsharp Mask)")

        ttk.Label(tools_frame, text="Cường độ:").grid(row=1, column=0, sticky="w", padx=5, pady=5)
        self.intensity_var = tk.DoubleVar(value=50)
        intensity_slider = ttk.Scale(tools_frame, from_=0, to=100, orient="horizontal", variable=self.intensity_var)
        intensity_slider.grid(row=1, column=1, sticky="ew", padx=5)
        intensity_label = ttk.Label(tools_frame, text="50%")
        intensity_label.grid(row=1, column=2, sticky="w", padx=5)
        self.intensity_var.trace_add("write", lambda *args: intensity_label.config(text=f"{int(self.intensity_var.get())}%"))

        action_frame = ttk.Frame(tools_frame)
        action_frame.grid(row=2, column=0, columnspan=3, sticky="ew", pady=(10, 0))
        self.apply_tool_btn = ttk.Button(action_frame, text="Áp dụng", command=self._apply_image_enhancement, state="disabled")
        self.apply_tool_btn.pack(side=tk.LEFT, padx=5)
        self.undo_image_btn = ttk.Button(action_frame, text="Hoàn tác về gốc", command=self._undo_image_enhancement, state="disabled")
        self.undo_image_btn.pack(side=tk.LEFT)

        ttk.Separator(action_frame, orient="vertical").pack(side=tk.LEFT, fill="y", padx=15, pady=5)

        ttk.Label(action_frame, text="Lưu định dạng:").pack(side=tk.LEFT)
        self.image_format_combo = ttk.Combobox(action_frame, state="readonly", values=["PNG", "JPEG", "WEBP", "BMP", "GIF"])
        self.image_format_combo.set("PNG")
        self.image_format_combo.pack(side=tk.LEFT, padx=5)
        self.save_image_btn = ttk.Button(action_frame, text="Lưu ảnh...", command=self._save_converted_image, state="disabled")
        self.save_image_btn.pack(side=tk.RIGHT, padx=5)

        self.image_status_label = ttk.Label(img_tab, text="Sẵn sàng.")
        self.image_status_label.grid(row=3, column=0, sticky="w", pady=(5, 0))

    def _start_image_download_thread(self):
        url = self.image_url_var.get().strip()
        if not url:
            messagebox.showwarning("Thiếu thông tin", "Vui lòng nhập URL của ảnh.")
            return

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
        self.downloaded_image_data = image_bytes_io
        self.image_original_pil = Image.open(self.downloaded_image_data)
        self.image_display_pil = self.image_original_pil.copy()
        self.image_zoom_factor = 1.0

        def update_ui_success():
            self._update_image_display()
            self.save_image_btn.config(state="normal")
            self.apply_tool_btn.config(state="normal")
            self.undo_image_btn.config(state="disabled")

        self.after(0, update_ui_success)

    def _sharpen_image(self):
        if not self.image_display_pil:
            return
        self.image_display_pil = self.image_display_pil.filter(ImageFilter.SHARPEN)
        self.undo_image_btn.config(state="normal")
        self._update_image_display()
        self.image_status_label.config(text="Đã áp dụng bộ lọc làm nét.")

    def _undo_image_enhancement(self):
        if not self.image_original_pil:
            return
        self.image_display_pil = self.image_original_pil.copy()
        self.undo_image_btn.config(state="disabled")
        self._update_image_display()
        self.image_status_label.config(text="Đã hoàn tác về ảnh gốc.")

    def _apply_image_enhancement(self):
        if not getattr(self, "image_original_pil", None):
            return

        self.apply_tool_btn.config(state="disabled")
        self.save_image_btn.config(state="disabled")
        self.image_status_label.config(text="Đang xử lý ảnh...")

        def worker():
            try:
                tool = self.image_tool_combo.get()
                intensity = self.intensity_var.get()
                img_to_process = self.image_original_pil.copy()

                if tool == "Làm nét (Unsharp Mask)":
                    cv_img = cv2.cvtColor(np.array(img_to_process), cv2.COLOR_RGB2BGR)
                    gaussian = cv2.GaussianBlur(cv_img, (0, 0), sigmaX=5)
                    alpha = 1.5 + (intensity / 100.0) * 2
                    sharpened_cv = cv2.addWeighted(cv_img, alpha, gaussian, 1 - alpha, 0)
                    result_pil = Image.fromarray(cv2.cvtColor(sharpened_cv, cv2.COLOR_BGR2RGB))

                elif tool == "Tăng chi tiết (Detail)":
                    tmp = img_to_process
                    times = max(1, int(intensity / 20))
                    for _ in range(times):
                        tmp = tmp.filter(ImageFilter.DETAIL)
                    result_pil = tmp

                elif tool == "Nâng cấp độ phân giải x2 (Lanczos)":
                    new_w = img_to_process.width * 2
                    new_h = img_to_process.height * 2
                    result_pil = img_to_process.resize((new_w, new_h), Image.Resampling.LANCZOS)

                else:
                    result_pil = img_to_process

                def finish():
                    self.image_display_pil = result_pil
                    self.undo_image_btn.config(state="normal")
                    self.apply_tool_btn.config(state="normal")
                    self.save_image_btn.config(state="normal")
                    self._update_image_display()
                    self.image_status_label.config(text=f"Đã áp dụng: {tool}")

                self.after(0, finish)

            except Exception as e:
                def on_err():
                    messagebox.showerror("Lỗi xử lý", f"Đã xảy ra lỗi: {e}")
                    self.image_status_label.config(text=f"Lỗi: {e}")
                    self.apply_tool_btn.config(state="normal")

                self.after(0, on_err)

        threading.Thread(target=worker, daemon=True).start()
