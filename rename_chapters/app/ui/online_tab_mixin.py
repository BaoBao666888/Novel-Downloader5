import os
import re
import threading
import tkinter as tk
from tkinter import ttk, messagebox

import pythoncom
import requests

from app.ui.constants import ONLINE_SOURCES, SOURCE_BY_ID
from extensions import fanqienovel_ext, ihuaben_ext, jjwxc_ext, po18_ext, qidian_ext


class OnlineTabMixin:
    """UI cho tab Lấy Tiêu Đề Online."""

    def create_online_fetch_tab(self):
        online_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(online_tab, text="Lấy Tiêu Đề Online")
        online_tab.columnconfigure(0, weight=1)
        online_tab.rowconfigure(0, weight=1)

        online_paned = ttk.PanedWindow(online_tab, orient=tk.VERTICAL)
        online_paned.grid(row=0, column=0, sticky="nsew")

        # Frame 1: Nguồn
        fetch_frame = ttk.LabelFrame(online_paned, text="1. Nguồn", padding=10)
        online_paned.add(fetch_frame, weight=1)
        fetch_frame.columnconfigure(0, weight=1)

        self.selected_online_source = tk.StringVar(value=ONLINE_SOURCES[0]['id'])
        if not hasattr(self, "source_icon_images"):
            self.source_icon_images = {}
        self.source_tiles = {}
        self.source_tile_container = None
        self._source_selector_window = None

        current_frame = ttk.Frame(fetch_frame)
        current_frame.grid(row=0, column=0, sticky="ew", pady=(0, 6))
        current_frame.columnconfigure(1, weight=1)
        ttk.Label(current_frame, text="Nguồn hiện tại:").grid(row=0, column=0, sticky="w")
        self.source_current_label = ttk.Label(current_frame, text="", font=("Segoe UI", 10, "bold"))
        self.source_current_label.grid(row=0, column=1, sticky="w", padx=(6, 0))
        ttk.Button(current_frame, text="Chọn nguồn...", command=self._open_source_selector).grid(row=0, column=2, padx=(10,0))

        info_frame = ttk.Frame(fetch_frame)
        info_frame.grid(row=1, column=0, sticky="ew")
        info_frame.columnconfigure(2, weight=1)
        self.source_domain_var = tk.StringVar()
        ttk.Label(info_frame, textvariable=self.source_domain_var, font=("Segoe UI", 10, "italic")).grid(row=0, column=0, sticky="w", padx=5, pady=(0,4))
        self.source_sample_var = tk.StringVar()
        self.source_sample_label = ttk.Label(info_frame, textvariable=self.source_sample_var)
        self.source_sample_label.grid(row=0, column=2, sticky="w", padx=5, pady=(0,4))
        url_row = ttk.Frame(fetch_frame)
        url_row.grid(row=2, column=0, sticky="ew", padx=5, pady=(8, 5))
        url_row.columnconfigure(1, weight=1)
        ttk.Label(url_row, text="URL mục lục:", padding=(0, 6)).grid(row=0, column=0, sticky="w")
        self.source_url = tk.StringVar()
        url_frame = ttk.Frame(url_row)
        url_frame.grid(row=0, column=1, sticky="ew", padx=(6,0))
        url_frame.columnconfigure(0, weight=1)
        ttk.Entry(url_frame, textvariable=self.source_url).grid(row=0, column=0, sticky="ew")
        ttk.Button(url_frame, text="Bắt đầu lấy dữ liệu", command=self._fetch_online_titles).grid(row=0, column=1, padx=(8,0))
        self._update_source_info_labels()

        # Frame 2: Kết quả
        result_frame = ttk.LabelFrame(online_paned, text="2. Kết quả", padding=10)
        online_paned.add(result_frame, weight=3)
        result_frame.columnconfigure(0, weight=1)
        result_frame.rowconfigure(0, weight=1)
        cols = ("Số chương", "Tiêu đề chính", "Tiêu đề phụ/Tóm tắt")
        self.online_tree = ttk.Treeview(result_frame, columns=cols, show='headings', selectmode='extended')
        self.online_tree.grid(row=0, column=0, sticky="nsew")
        for col in cols: self.online_tree.heading(col, text=col)
        vsb = ttk.Scrollbar(result_frame, orient="vertical", command=self.online_tree.yview)
        vsb.grid(row=0, column=1, sticky="ns")
        self.online_tree.configure(yscrollcommand=vsb.set)
        
        apply_frame = ttk.LabelFrame(online_tab, text="3. Áp dụng", padding=10)
        apply_frame.grid(row=2, column=0, sticky="ew", pady=(5,0))
        apply_frame.columnconfigure(0, weight=1)
        apply_frame.columnconfigure(1, weight=1)

        select_frame = ttk.Frame(apply_frame)
        select_frame.grid(row=0, column=0, sticky="ew", padx=(0, 10))
        ttk.Label(select_frame, text="Chọn nhanh theo khoảng:").pack(side=tk.LEFT, padx=(0, 5))
        self.online_range_var = tk.StringVar()
        range_entry = ttk.Entry(select_frame, textvariable=self.online_range_var)
        range_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
        ttk.Button(select_frame, text="Chọn", command=self._select_online_range).pack(side=tk.LEFT, padx=5)

        combine_frame = ttk.Frame(apply_frame)
        combine_frame.grid(row=0, column=1, sticky="ew", padx=(10, 0))
        ttk.Checkbutton(combine_frame, text="Gộp 2 tiêu đề theo cấu trúc:", variable=self.combine_titles_var).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Entry(combine_frame, textvariable=self.title_format_var).pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        ttk.Label(apply_frame, text="(Ví dụ: 1-10, -50, 100-, all)").grid(row=1, column=0, sticky="w", padx=5)
        ttk.Label(apply_frame, text="(Dùng {t1} và {t2})").grid(row=1, column=1, sticky="w", padx=(10, 0))

        action_row_frame = ttk.Frame(apply_frame)
        action_row_frame.grid(row=2, column=0, columnspan=2, sticky="ew", pady=(10,0))
        ttk.Label(action_row_frame, text="Nếu không gộp, sử dụng cột:").pack(side=tk.LEFT, padx=5)
        self.title_choice = tk.StringVar(value="title2")
        ttk.Radiobutton(action_row_frame, text="Tiêu đề chính", variable=self.title_choice, value="title1").pack(side=tk.LEFT)
        ttk.Radiobutton(action_row_frame, text="Tiêu đề phụ", variable=self.title_choice, value="title2").pack(side=tk.LEFT)
        ttk.Button(action_row_frame, text="Sao chép vào Công cụ Nhanh", command=self._copy_titles_to_quick_tools).pack(side=tk.LEFT, padx=20)
        ttk.Button(action_row_frame, text="Sao chép tiêu đề đã chọn vào Tab Đổi Tên", command=self._apply_online_titles).pack(side=tk.RIGHT, padx=5)

    # ===== Logic xử lý Online =====
    def _fetch_online_titles(self):
        url = self.source_url.get()
        if not url:
            messagebox.showerror("Lỗi", "Vui lòng nhập URL mục lục.")
            return

        def _worker():
            pythoncom.CoInitialize()
            try:
                self.log(f"Đang lấy dữ liệu từ {url}...")
                config = SOURCE_BY_ID.get(self.selected_online_source.get())
                if not config:
                    result = {"error": "Không tìm thấy cấu hình nguồn. Vui lòng chọn lại."}
                else:
                    selected_site = config["site_value"]
                    proxies = self._get_proxy_for_request("fetch_titles")
                    if proxies:
                        self.log(f"Sử dụng proxy: {proxies['http']}")

                    if selected_site == "jjwxc.net":
                        result = jjwxc_ext.fetch_chapters(url, proxies=proxies)
                    elif selected_site == "po18.tw":
                        result = po18_ext.fetch_chapters(url, root_window=self, proxies=proxies)
                    elif selected_site == "qidian.com":
                        result = qidian_ext.fetch_chapters(url, root_window=self, proxies=proxies)
                    elif selected_site == "fanqienovel.com":
                        result = fanqienovel_ext.fetch_chapters(url, proxies=proxies)
                    elif selected_site == "ihuaben.com":
                        result = ihuaben_ext.fetch_chapters(url, proxies=proxies)
                    else:
                        result = {"error": "Trang web không được hỗ trợ."}

                self.after(0, self._update_online_tree, result)
            finally:
                pythoncom.CoUninitialize()

        threading.Thread(target=_worker, daemon=True).start()

    def _update_online_tree(self, result):
        self.online_tree.delete(*self.online_tree.get_children())
        if "error" in result:
            error_msg = result["error"]
            self.log(f"Lỗi: {error_msg}")
            messagebox.showerror("Lỗi", error_msg, parent=self)
            return

        chapters = result.get("data", [])
        for chap in chapters:
            self.online_tree.insert("", "end", values=(chap["num"], chap["title1"], chap["title2"]))
        self.log(f"Lấy thành công {len(chapters)} chương.")

    def _apply_online_titles(self):
        selected_items = self.online_tree.selection()
        if not selected_items:
            messagebox.showinfo("Thông báo", "Vui lòng chọn ít nhất một chương từ bảng kết quả.", parent=self)
            return

        selected_titles = []
        if self.combine_titles_var.get():
            format_str = self.title_format_var.get()
            for item_id in selected_items:
                item_data = self.online_tree.item(item_id, "values")
                t1 = item_data[1]
                t2 = item_data[2]
                try:
                    combined_title = format_str.format(t1=t1, t2=t2)
                    selected_titles.append(combined_title)
                except KeyError:
                    selected_titles.append(f"{t1} - {t2}")
        else:
            title_key = self.title_choice.get()
            for item_id in selected_items:
                item_data = self.online_tree.item(item_id, "values")
                title = item_data[1] if title_key == "title1" else item_data[2]
                selected_titles.append(title)

        self.custom_titles_text.delete("1.0", tk.END)
        self.custom_titles_text.insert("1.0", "\n".join(selected_titles))
        self.use_custom_titles.set(True)

        self.notebook.select(0)
        self.schedule_preview_update()
        self.log(f"Đã áp dụng {len(selected_titles)} tiêu đề tùy chỉnh.")

    def _copy_titles_to_quick_tools(self):
        """Sao chép tiêu đề từ bảng online vào ô mục lục của Công cụ Nhanh."""
        selected_items = self.online_tree.selection()
        if not selected_items:
            messagebox.showinfo("Thông báo", "Vui lòng chọn ít nhất một chương.", parent=self)
            return

        selected_titles = []
        if self.combine_titles_var.get():
            format_str = self.title_format_var.get()
            for item_id in selected_items:
                item_data = self.online_tree.item(item_id, "values")
                try:
                    combined = format_str.format(t1=item_data[1], t2=item_data[2])
                    selected_titles.append(f"第{item_data[0]}章 {combined}")
                except KeyError:
                    pass
        else:
            title_key_index = 1 if self.title_choice.get() == "title1" else 2
            for item_id in selected_items:
                item_data = self.online_tree.item(item_id, "values")
                selected_titles.append(f"第{item_data[0]}章 {item_data[title_key_index]}")

        self._select_tab_by_name("Xử lý Văn bản")
        self.ops_notebook.select(self.ops_notebook.tabs()[-1])
        self.toc_content_text.delete("1.0", tk.END)
        self.toc_content_text.insert("1.0", "\n".join(selected_titles))
        self.log(f"Đã sao chép {len(selected_titles)} tiêu đề vào Công cụ Nhanh.")

    def _select_online_range(self):
        range_str = self.online_range_var.get().strip().lower()
        if not range_str:
            return

        all_items = self.online_tree.get_children()
        if not all_items:
            return

        def parse_token(tok: str):
            tok = tok.strip()
            if not tok:
                return None
            if tok in ("all", "*"):
                return ("all", None)
            m = re.match(r"^(\\d+)?\\s*-\\s*(\\d+)?$", tok)
            if m:
                start = int(m.group(1)) if m.group(1) else 1
                end = int(m.group(2)) if m.group(2) else float("inf")
                return (start, end)
            if tok.isdigit():
                v = int(tok)
                return (v, v)
            return None

        tokens = [t for t in re.split(r"[\\s,]+", range_str) if t.strip()]
        ranges = []
        for tok in tokens:
            parsed = parse_token(tok)
            if not parsed:
                messagebox.showerror(
                    "Lỗi cú pháp",
                    "Cú pháp không hợp lệ. Ví dụ: '1-10', '1-2,4-5', '-50', '100-', 'all', '7'.",
                    parent=self,
                )
                return
            if parsed[0] == "all":
                ranges = [("all", None)]
                break
            ranges.append(parsed)

        self.online_tree.selection_remove(self.online_tree.selection())

        if ranges and ranges[0][0] == "all":
            self.online_tree.selection_add(all_items)
            return

        items_to_select = []
        for item_id in all_items:
            try:
                chap_num = int(self.online_tree.item(item_id, "values")[0])
            except Exception:
                continue
            for start, end in ranges:
                if start <= chap_num <= end:
                    items_to_select.append(item_id)
                    break

        if items_to_select:
            self.online_tree.selection_add(items_to_select)
