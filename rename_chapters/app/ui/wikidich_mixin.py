import os
import re
import io
import time
import html
import json
import threading
import random
import subprocess
import sys
import webbrowser
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse, urljoin, quote, unquote

import tkinter as tk
import tkinter.font as tkfont
from tkinter import ttk, filedialog, messagebox, scrolledtext, simpledialog

import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageTk
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.core import renamer as logic
from app.core.browser_cookies import load_browser_cookie_jar
from app.core.text_ops import TextOperations
from app.paths import BASE_DIR
from app.ui.constants import DEFAULT_API_SETTINGS, DEFAULT_UPLOAD_SETTINGS, ONLINE_SOURCES, WD_SORT_OPTIONS, SOURCE_BY_ID
from extensions import wikidich_ext, jjwxc_ext, po18_ext, qidian_ext, fanqienovel_ext, ihuaben_ext

try:
    import pythoncom
except Exception:
    pythoncom = None


class WikidichCancelled(Exception):
    """Được ném ra khi người dùng hủy tác vụ Wikidich."""
    pass


class WikidichMixin:

    def create_wikidich_tab(self):
        initial_filters = dict(self.wikidich_filters)
        initial_data = self.wikidich_data
        initial_filtered = getattr(self, "wikidich_filtered", [])
        initial_new = dict(self.wd_new_chapters)
        for site in ("wikidich", "koanchay"):
            if site == "koanchay":
                self.wikidich_data = {"username": None, "book_ids": [], "books": {}, "synced_at": None}
                self.wikidich_filters = dict(initial_filters)
                self.wikidich_filtered = []
                self.wd_new_chapters = {}
            tab = ttk.Frame(self.notebook, padding="10")
            self._wd_tabs[site] = tab
            tab_label = "Koanchay" if site == "koanchay" else "Wikidich"
            self.notebook.add(tab, text=tab_label)
            if site == "koanchay":
                self.notebook.tab(tab, state="hidden")
            self._build_wikidich_tab_ui(tab, site)
            self._wd_contexts[site] = self._wd_capture_context()
            self._wd_site_states[site] = self._wd_capture_site_state()
        self.wd_new_chapters = initial_new
        self.wikidich_filters = dict(initial_filters)
        self.wikidich_data = initial_data
        self.wikidich_filtered = list(initial_filtered) if initial_filtered else []
        self._wd_set_active_site("wikidich", skip_save=True)

    def _build_wikidich_tab_ui(self, tab, site: str):
        self.wd_site = site
        other_site = "koanchay" if site == "wikidich" else "wikidich"
        tab.columnconfigure(0, weight=1)
        tab.rowconfigure(3, weight=1)
        self.wd_missing_only_var = tk.BooleanVar(value=True)
        self.wd_detail_scope_var = tk.StringVar(value="filtered")
        self._wd_adv_section_visible = False
        self._wd_pending_categories = []
        self._wd_category_options = []

        header = ttk.Frame(tab)
        header.grid(row=0, column=0, sticky="ew")
        header.columnconfigure(6, weight=1)
        self.wd_user_label = ttk.Label(header, text="Chưa kiểm tra đăng nhập")
        self.wd_user_label.grid(row=0, column=0, sticky="w")
        ttk.Button(header, text="Tải Works", command=self._wd_start_fetch_works).grid(row=0, column=1, padx=(10, 0))
        ttk.Button(header, text="Tải chi tiết", command=self._wd_prompt_detail_fetch).grid(row=0, column=2, padx=(6, 0))
        ttk.Button(header, text="Ghi chú", command=self._wd_open_global_notes).grid(row=0, column=3, padx=(6, 0))
        ttk.Button(header, text="Liên kết", command=self._wd_open_global_links).grid(row=0, column=4, padx=(6, 0))
        ttk.Button(header, text="Cài đặt", command=self._open_api_settings_dialog).grid(row=0, column=5, padx=(6, 0))
        header.columnconfigure(6, weight=1)
        header_spacer = ttk.Frame(header)
        header_spacer.grid(row=0, column=6, sticky="ew")
        self.wd_count_var = tk.StringVar(value="Số truyện: 0")
        self._wd_count_header_label = ttk.Label(header, textvariable=self.wd_count_var)
        self._wd_count_header_label.grid(row=0, column=7, padx=(0, 8), sticky="e")
        self.wd_basic_toggle_btn = ttk.Button(header, text="Thu gọn lọc cơ bản", command=self._wd_toggle_basic_section)
        self.wd_basic_toggle_btn.grid(row=0, column=8, padx=(6, 0))
        self.wd_site_button = ttk.Button(header, text=other_site.capitalize(), command=lambda s=other_site: self._wd_switch_site(s))
        self.wd_site_button.grid(row=0, column=9, padx=(12, 0))

        progress_frame = ttk.Frame(tab)
        progress_frame.grid(row=1, column=0, sticky="ew", pady=(6, 4))
        progress_frame.columnconfigure(1, weight=1)
        ttk.Label(progress_frame, text="Tiến độ:").grid(row=0, column=0, sticky="w")
        self.wd_progress = ttk.Progressbar(progress_frame, mode="determinate")
        self.wd_progress.grid(row=0, column=1, sticky="ew", padx=(6, 6))
        self.wd_progress_label = ttk.Label(progress_frame, text="Chờ thao tác...")
        self.wd_progress_label.grid(row=0, column=2, sticky="w")
        self.wd_cancel_btn = ttk.Button(progress_frame, text="X", width=1, command=self._wd_request_cancel, state=tk.DISABLED)
        self.wd_cancel_btn.grid(row=0, column=3, padx=(6, 0))
        self.wd_progress_frame = progress_frame
        self._wd_progress_visible = False
        progress_frame.grid_remove()

        filter_frame = ttk.LabelFrame(tab, text="Bộ lọc cơ bản", padding=10)
        filter_frame.grid(row=2, column=0, sticky="ew")
        filter_frame.columnconfigure(1, weight=1)
        filter_frame.columnconfigure(3, weight=1)
        filter_frame.columnconfigure(4, weight=0)
        filter_frame.columnconfigure(5, weight=0)
        self._wd_filter_frame = filter_frame
        self._wd_filter_frame_grid_opts = {"row": 2, "column": 0, "sticky": "ew"}
        lbl_title = ttk.Label(filter_frame, text="Tiêu đề / Tác giả:")
        lbl_title.grid(row=0, column=0, sticky="w")
        self.wd_search_var = tk.StringVar(value=self.wikidich_filters.get('search', ''))
        entry_title = ttk.Entry(filter_frame, textvariable=self.wd_search_var)
        entry_title.grid(row=0, column=1, sticky="ew", padx=(4, 10))
        lbl_status = ttk.Label(filter_frame, text="Trạng thái:")
        lbl_status.grid(row=0, column=2, sticky="w")
        self.wd_status_var = tk.StringVar(value=self.wikidich_filters.get('status', 'all'))
        status_values = ["all"] + wikidich_ext.STATUS_OPTIONS
        status_combo = ttk.Combobox(filter_frame, state="readonly", textvariable=self.wd_status_var, values=status_values, width=18)
        status_combo.grid(row=0, column=3, sticky="w")

        lbl_summary = ttk.Label(filter_frame, text="Tìm trong văn án:")
        lbl_summary.grid(row=1, column=0, sticky="w", pady=(6, 0))
        self.wd_summary_var = tk.StringVar(value=self.wikidich_filters.get('summarySearch', ''))
        entry_summary = ttk.Entry(filter_frame, textvariable=self.wd_summary_var)
        entry_summary.grid(row=1, column=1, sticky="ew", padx=(4, 10), pady=(6, 0))
        lbl_sort = ttk.Label(filter_frame, text="Sắp xếp:")
        lbl_sort.grid(row=1, column=2, sticky="w", pady=(6, 0))
        self._wd_sort_value_to_label = {value: label for value, label in WD_SORT_OPTIONS}
        self._wd_sort_label_to_value = {label: value for value, label in WD_SORT_OPTIONS}
        initial_sort_label = self._wd_sort_value_to_label.get(self.wikidich_filters.get('sortBy', 'recent'), WD_SORT_OPTIONS[0][1])
        self.wd_sort_label_var = tk.StringVar(value=initial_sort_label)
        sort_combo = ttk.Combobox(filter_frame, state="readonly", textvariable=self.wd_sort_label_var,
                     values=[label for _, label in WD_SORT_OPTIONS], width=18)
        sort_combo.grid(row=1, column=3, sticky="w", pady=(6, 0))

        lbl_extra = ttk.Label(filter_frame, text="Link bổ sung:")
        lbl_extra.grid(row=2, column=0, sticky="w", pady=(6, 0))
        self.wd_extra_link_var = tk.StringVar(value=self.wikidich_filters.get('extraLinkSearch', ''))
        entry_extra = ttk.Entry(filter_frame, textvariable=self.wd_extra_link_var)
        entry_extra.grid(row=2, column=1, columnspan=3, sticky="ew", padx=(4, 10), pady=(6, 0))

        action_frame = ttk.Frame(filter_frame)
        action_frame.grid(row=0, column=5, rowspan=4, sticky="ne", padx=(10, 0))
        action_frame.columnconfigure(0, weight=1)
        apply_btn = ttk.Button(action_frame, text="Áp dụng", command=self._wd_apply_filters)
        apply_btn.grid(row=0, column=0, sticky="ew")
        check_update_btn = ttk.Button(action_frame, text="Kiểm tra cập nhật", command=self._wd_prompt_check_updates)
        check_update_btn.grid(row=1, column=0, sticky="ew", pady=(6, 0))
        self.wd_adv_toggle_btn = ttk.Button(action_frame, text="Hiện lọc nâng cao", command=self._wd_toggle_advanced_section)
        self.wd_adv_toggle_btn.grid(row=2, column=0, sticky="ew", pady=(10, 0))
        self.wd_basic_status_var = tk.StringVar(value="")
        self.wd_adv_status_var = tk.StringVar(value="")
        self.wd_status_ticker_var = tk.StringVar(value="")
        self._wd_status_ticker_window = 60
        self._wd_status_ticker_job = None
        self._wd_status_ticker_index = 0
        self._wd_status_ticker_delay = 80
        ticker_label = ttk.Label(
            action_frame,
            textvariable=self.wd_status_ticker_var,
            width=36,
            anchor="w",
            foreground="#16a34a"
        )
        ticker_label.grid(row=3, column=0, sticky="ew", pady=(10, 0))

        flag_labels = {
            "embedLink": "Có nhúng link",
            "embedFile": "Có nhúng file"
        }
        lbl_flags = ttk.Label(filter_frame, text="Thuộc tính:")
        lbl_flags.grid(row=3, column=0, sticky="nw", pady=(8, 0))
        self.wd_flag_vars = {flag: tk.BooleanVar(value=flag in self.wikidich_filters.get('flags', [])) for flag in flag_labels}
        flag_frame = ttk.Frame(filter_frame)
        flag_frame.grid(row=3, column=1, columnspan=3, sticky="w", pady=(8, 0))
        for flag, label in flag_labels.items():
            ttk.Checkbutton(flag_frame, text=label, variable=self.wd_flag_vars[flag]).pack(side=tk.LEFT, padx=(0, 12))

        # Thu gọn lọc cơ bản mặc định để mở rộng bảng
        self._wd_basic_collapsed = False
        self._wd_collapse_basic_section()

        self.wd_adv_container = ttk.LabelFrame(filter_frame, text="Lọc nâng cao", padding=8)
        self.wd_adv_container.grid(row=4, column=0, columnspan=6, sticky="ew", pady=(12, 0))
        self.wd_adv_container.columnconfigure(0, weight=1)

        self.wd_from_date_var = tk.StringVar(value=self.wikidich_filters.get('fromDate', ''))
        self.wd_to_date_var = tk.StringVar(value=self.wikidich_filters.get('toDate', ''))
        adv_header = ttk.Frame(self.wd_adv_container)
        adv_header.grid(row=0, column=0, sticky="ew")
        ttk.Label(adv_header, text="Khoảng ngày cập nhật (YYYY-MM-DD)").pack(side=tk.LEFT)
        ttk.Button(adv_header, text="Đặt lại bộ lọc", command=self._wd_reset_filters).pack(side=tk.RIGHT)
        date_frame = ttk.Frame(self.wd_adv_container)
        date_frame.grid(row=1, column=0, sticky="ew", pady=(4, 10))
        from_row = ttk.Frame(date_frame)
        from_row.pack(fill=tk.X, pady=2)
        ttk.Label(from_row, text="Từ:").pack(side=tk.LEFT)
        ttk.Entry(from_row, textvariable=self.wd_from_date_var, state="readonly", width=12).pack(side=tk.LEFT, padx=(4, 4))
        ttk.Button(from_row, text="Chọn", command=lambda: self._wd_open_date_picker(self.wd_from_date_var, "Chọn ngày bắt đầu")).pack(side=tk.LEFT, padx=(0, 4))
        ttk.Button(from_row, text="Xóa", command=lambda: self._wd_clear_date(self.wd_from_date_var)).pack(side=tk.LEFT)
        to_row = ttk.Frame(date_frame)
        to_row.pack(fill=tk.X, pady=2)
        ttk.Label(to_row, text="Đến:").pack(side=tk.LEFT)
        ttk.Entry(to_row, textvariable=self.wd_to_date_var, state="readonly", width=12).pack(side=tk.LEFT, padx=(4, 4))
        ttk.Button(to_row, text="Chọn", command=lambda: self._wd_open_date_picker(self.wd_to_date_var, "Chọn ngày kết thúc")).pack(side=tk.LEFT, padx=(0, 4))
        ttk.Button(to_row, text="Xóa", command=lambda: self._wd_clear_date(self.wd_to_date_var)).pack(side=tk.LEFT)

        ttk.Label(self.wd_adv_container, text="Thể loại đang có").grid(row=2, column=0, sticky="w", pady=(4, 2))
        self.wd_category_listbox = tk.Listbox(self.wd_adv_container, selectmode=tk.MULTIPLE, height=6, exportselection=False)
        self.wd_category_listbox.grid(row=3, column=0, sticky="ew")

        ttk.Label(self.wd_adv_container, text="Vai trò của bạn").grid(row=4, column=0, sticky="w", pady=(8, 2))
        roles_frame = ttk.Frame(self.wd_adv_container)
        roles_frame.grid(row=5, column=0, sticky="w")
        role_labels = {
            "poster": "Tôi là người đăng",
            "managerOwner": "Đồng quản lý - chủ",
            "managerGuest": "Đồng quản lý - khách",
            "editorOwner": "Biên tập - chủ",
            "editorGuest": "Biên tập - khách"
        }
        self.wd_role_vars = {role: tk.BooleanVar(value=role in self.wikidich_filters.get('roles', [])) for role in wikidich_ext.ROLE_OPTIONS}
        for role in wikidich_ext.ROLE_OPTIONS:
            ttk.Checkbutton(roles_frame, text=role_labels.get(role, role), variable=self.wd_role_vars[role]).pack(anchor="w")

        self.wd_adv_container.grid_remove()

        self._wd_sync_filter_controls_from_filters()

        main_pane = ttk.PanedWindow(tab, orient=tk.HORIZONTAL)
        main_pane.grid(row=3, column=0, sticky="nsew", pady=(8, 0))

        detail_container = ttk.Frame(main_pane)
        detail_container.columnconfigure(0, weight=1)
        detail_container.rowconfigure(1, weight=1)
        main_pane.add(detail_container, weight=3)

        header_frame = ttk.Frame(detail_container, padding=(6, 6, 6, 0))
        header_frame.grid(row=0, column=0, sticky="ew")
        header_frame.columnconfigure(0, weight=1)
        self.wd_title_text = tk.Text(header_frame, height=2, wrap=tk.WORD, font=("Segoe UI", 11, "bold"), relief="flat", bd=0)
        self.wd_title_text.grid(row=0, column=0, sticky="ew")
        self._wd_make_text_readonly(self.wd_title_text)
        self._wd_set_text_content(self.wd_title_text, "Chưa chọn truyện")
        btn_row = ttk.Frame(header_frame)
        btn_row.grid(row=1, column=0, sticky="e", pady=(6, 0))
        ttk.Button(btn_row, text="Mở trang truyện", command=self._wd_open_book_in_browser).pack(side=tk.LEFT)
        self.wd_auto_update_btn = ttk.Button(btn_row, text="Auto update", command=self._wd_auto_update_fanqie, state=tk.DISABLED)
        self._wd_auto_update_pack_opts = {"side": tk.LEFT, "padx": (8, 0)}
        self.wd_auto_update_btn.pack(**self._wd_auto_update_pack_opts)
        self.wd_auto_update_btn.pack_forget()
        self.wd_edit_book_btn = ttk.Button(btn_row, text="Chỉnh sửa", command=self._wd_open_wiki_edit_uploader, state=tk.DISABLED)
        self.wd_edit_book_btn.pack(side=tk.LEFT, padx=(8, 0))
        self.wd_chapter_list_btn = ttk.Button(btn_row, text="DS Chương", command=self._wd_open_chapter_list, state=tk.DISABLED)
        self.wd_chapter_list_btn.pack(side=tk.LEFT, padx=(8, 0))
        self.wd_update_button = ttk.Button(btn_row, text="Cập nhật chương", command=self._wd_open_update_dialog, state=tk.DISABLED)
        self.wd_update_button.pack(side=tk.LEFT, padx=(8, 0))
        self.wd_note_button = ttk.Button(btn_row, text="Ghi chú", command=self._wd_open_local_note, state=tk.DISABLED)
        self.wd_note_button.pack(side=tk.LEFT, padx=(8, 0))
        self.wd_delete_button = ttk.Button(btn_row, text="Xóa", command=self._wd_delete_book, state=tk.DISABLED)
        self.wd_delete_button.pack(side=tk.LEFT, padx=(8, 0))

        content_container = ttk.Frame(detail_container, padding=(6, 0, 6, 6))
        content_container.grid(row=1, column=0, sticky="nsew")
        content_container.rowconfigure(0, weight=1)
        content_container.columnconfigure(0, weight=1)

        theme_bg = getattr(self, "_theme_colors", {}).get('card', None) if hasattr(self, "_theme_colors") else None
        self.wd_detail_canvas = tk.Canvas(
            content_container,
            highlightthickness=0,
            bd=0,
            background=theme_bg or self._base_bg
        )
        detail_scrollbar = ttk.Scrollbar(content_container, orient="vertical", command=self.wd_detail_canvas.yview)
        self.wd_detail_canvas.configure(yscrollcommand=detail_scrollbar.set)
        self.wd_detail_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        detail_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        detail_frame = ttk.Frame(self.wd_detail_canvas, padding=6)
        detail_window = self.wd_detail_canvas.create_window((0, 0), window=detail_frame, anchor="nw")
        detail_frame.columnconfigure(1, weight=1)
        detail_frame.rowconfigure(3, weight=1)

        def _configure_detail(event=None):
            bbox = self.wd_detail_canvas.bbox("all")
            if bbox:
                self.wd_detail_canvas.configure(scrollregion=bbox)
            self.wd_detail_canvas.itemconfigure(detail_window, width=self.wd_detail_canvas.winfo_width())
        detail_frame.bind("<Configure>", _configure_detail)
        self.wd_detail_canvas.bind("<Configure>", lambda e: self.wd_detail_canvas.itemconfigure(detail_window, width=e.width))
        self.wd_detail_canvas.bind("<MouseWheel>", lambda e: self.wd_detail_canvas.yview_scroll(int(-1 * (e.delta / 120)), "units"))
        detail_frame.bind("<MouseWheel>", lambda e: self.wd_detail_canvas.yview_scroll(int(-1 * (e.delta / 120)), "units"))
        self.wd_detail_canvas.bind("<Button-4>", lambda e: self.wd_detail_canvas.yview_scroll(-1, "units"))
        self.wd_detail_canvas.bind("<Button-5>", lambda e: self.wd_detail_canvas.yview_scroll(1, "units"))
        detail_frame.bind("<Button-4>", lambda e: self.wd_detail_canvas.yview_scroll(-1, "units"))
        detail_frame.bind("<Button-5>", lambda e: self.wd_detail_canvas.yview_scroll(1, "units"))

        cover_frame = ttk.Frame(detail_frame)
        cover_frame.grid(row=0, column=0, rowspan=2, sticky="nw", pady=(6, 0))
        self.wd_cover_label = tk.Label(cover_frame, text="(Bìa)", bd=0)
        self.wd_cover_label.pack()

        info_frame = ttk.Frame(detail_frame)
        info_frame.grid(row=0, column=1, sticky="new", padx=(10, 0), pady=(6, 0))
        info_frame.columnconfigure(1, weight=1)
        self.wd_info_vars = {
            'author': tk.StringVar(value=""),
            'status': tk.StringVar(value=""),
            'updated': tk.StringVar(value=""),
            'chapters': tk.StringVar(value=""),
            'collections': tk.StringVar(value=""),
            'flags': tk.StringVar(value="")
        }
        ttk.Label(info_frame, text="Tác giả:").grid(row=0, column=0, sticky="w")
        self.wd_author_entry = ttk.Entry(info_frame, textvariable=self.wd_info_vars['author'], state="readonly")
        self.wd_author_entry.grid(row=0, column=1, sticky="ew")
        ttk.Label(info_frame, text="Trạng thái:").grid(row=1, column=0, sticky="w")
        self.wd_status_entry = ttk.Entry(info_frame, textvariable=self.wd_info_vars['status'], state="readonly")
        self.wd_status_entry.grid(row=1, column=1, sticky="ew")
        ttk.Label(info_frame, text="Cập nhật:").grid(row=2, column=0, sticky="w")
        self.wd_updated_entry = ttk.Entry(info_frame, textvariable=self.wd_info_vars['updated'], state="readonly")
        self.wd_updated_entry.grid(row=2, column=1, sticky="ew")
        ttk.Label(info_frame, text="Số chương:").grid(row=3, column=0, sticky="w")
        self.wd_chapters_entry = ttk.Entry(info_frame, textvariable=self.wd_info_vars['chapters'], state="readonly")
        self.wd_chapters_entry.grid(row=3, column=1, sticky="ew")
        ttk.Label(info_frame, text="Thể loại/Tag:").grid(row=4, column=0, sticky="nw", pady=(4, 0))
        self.wd_collections_text = scrolledtext.ScrolledText(info_frame, wrap=tk.WORD, height=3)
        self.wd_collections_text.grid(row=4, column=1, sticky="ew", pady=(4, 0))
        self._wd_make_text_readonly(self.wd_collections_text)
        ttk.Label(info_frame, text="Vai trò/Thuộc tính:").grid(row=5, column=0, sticky="nw", pady=(4, 0))
        self.wd_flags_text = scrolledtext.ScrolledText(info_frame, wrap=tk.WORD, height=3)
        self.wd_flags_text.grid(row=5, column=1, sticky="ew", pady=(4, 0))
        self._wd_make_text_readonly(self.wd_flags_text)

        links_frame = ttk.LabelFrame(detail_frame, text="Link bổ sung", padding=6)
        links_frame.grid(row=1, column=1, sticky="ew", padx=(10, 0), pady=(6, 0))
        links_frame.columnconfigure(0, weight=1)
        self.wd_links_listbox = tk.Listbox(links_frame, height=2)
        self.wd_links_listbox.grid(row=0, column=0, sticky="ew")
        self.wd_links_listbox.bind("<Double-Button-1>", self._wd_open_extra_link)
        self.wd_current_links = []

        link_frame = ttk.LabelFrame(detail_frame, text="Liên kết", padding=6)
        link_frame.grid(row=2, column=0, columnspan=2, sticky="ew", padx=(0, 0), pady=(6, 0))
        link_frame.columnconfigure(1, weight=1)
        self.wd_link_path_var = tk.StringVar(value="Chưa liên kết")
        ttk.Label(link_frame, text="Thư mục:").grid(row=0, column=0, sticky="w")
        ttk.Label(link_frame, textvariable=self.wd_link_path_var).grid(row=0, column=1, sticky="w")
        btn_row = ttk.Frame(link_frame)
        btn_row.grid(row=0, column=2, sticky="e")
        ttk.Button(btn_row, text="Liên kết", command=self._wd_choose_link_folder).pack(side=tk.LEFT)
        self.wd_auto_pick_btn = ttk.Button(btn_row, text="Chọn tự động", command=self._wd_auto_pick_linked, state=tk.DISABLED)
        self.wd_auto_pick_btn.pack(side=tk.LEFT, padx=(6, 0))
        self.wd_open_link_btn = ttk.Button(btn_row, text="Mở thư mục...", command=self._wd_open_current_linked_folder, state=tk.DISABLED)
        self.wd_open_link_btn.pack(side=tk.LEFT, padx=(6, 0))
        self.wd_download_btn = ttk.Button(btn_row, text="Download", command=self._wd_open_nd5_with_linked, state=tk.DISABLED)
        self.wd_download_btn.pack(side=tk.LEFT, padx=(6, 0))
        mode_frame = ttk.Frame(link_frame)
        mode_frame.grid(row=1, column=0, columnspan=3, sticky="ew", pady=(6, 0))
        mode_frame.columnconfigure(1, weight=1)
        ttk.Label(mode_frame, text="Chế độ:").grid(row=0, column=0, sticky="w")
        mode_options = {
            "extract_then_pick": "Giải nén rồi chọn",
            "pick_latest": "Chọn thư mục mới nhất",
        }
        self._wd_mode_labels = mode_options
        self._wd_mode_reverse = {v: k for k, v in mode_options.items()}
        display_default = mode_options.get(getattr(self, "wikidich_auto_pick_mode", "extract_then_pick"), "Giải nén rồi chọn")
        self.wd_auto_mode_var = tk.StringVar(value=display_default)
        mode_combo = ttk.Combobox(
            mode_frame,
            state="readonly",
            width=24,
            values=list(mode_options.values()),
            textvariable=self.wd_auto_mode_var
        )
        mode_combo.grid(row=0, column=1, sticky="w", padx=(6, 0))
        mode_combo.bind("<<ComboboxSelected>>", lambda e: self._wd_change_auto_mode(self._wd_mode_reverse.get(self.wd_auto_mode_var.get(), "extract_then_pick")))
        ttk.Label(mode_frame, text="Giải nén rồi chọn: lấy file nén mới nhất -> giải nén -> chọn\nChọn thư mục mới nhất: lấy thư mục con mới tạo nhất.", justify="left").grid(row=1, column=0, columnspan=3, sticky="w", pady=(4, 0))

        summary_frame = ttk.LabelFrame(detail_frame, text="Văn án", padding=6)
        summary_frame.grid(row=3, column=0, columnspan=2, sticky="nsew", pady=(8, 0))
        summary_frame.columnconfigure(0, weight=1)
        summary_frame.rowconfigure(0, weight=1)
        self.wd_summary_text = scrolledtext.ScrolledText(summary_frame, wrap=tk.WORD, height=12)
        self.wd_summary_text.grid(row=0, column=0, sticky="nsew")
        self._wd_make_text_readonly(self.wd_summary_text)

        tree_frame = ttk.Frame(main_pane)
        main_pane.add(tree_frame, weight=2)
        tree_frame.columnconfigure(0, weight=1)
        tree_frame.rowconfigure(0, weight=1)

        columns = ("title", "status", "updated", "chapters", "new_chapters", "views", "author")
        self.wd_tree = ttk.Treeview(tree_frame, columns=columns, show="headings", selectmode="browse")
        column_labels = {
            "title": "Tiêu đề",
            "status": "Trạng thái",
            "updated": "Cập nhật",
            "chapters": "Wiki",
            "new_chapters": "New",
            "views": "Lượt xem",
            "author": "Tác giả"
        }
        for col, width in zip(columns, [240, 110, 110, 80, 90, 90, 160]):
            self.wd_tree.heading(col, text=column_labels.get(col, col.capitalize()))
            self.wd_tree.column(col, width=width, anchor="w")
        self.wd_tree.tag_configure("has_new", foreground="#16a34a")
        self.wd_tree.tag_configure("not_found", foreground="#ef4444")
        self.wd_tree.tag_configure("server_lower", foreground="#f97316")
        self.wd_tree.grid(row=0, column=0, sticky="nsew")
        self.wd_tree.bind("<<TreeviewSelect>>", self._wd_on_select)
        tree_scroll = ttk.Scrollbar(tree_frame, orient="vertical", command=self.wd_tree.yview)
        self.wd_tree.configure(yscrollcommand=tree_scroll.set)
        tree_scroll.grid(row=0, column=1, sticky="ns")

        self._wd_update_user_label()
        self._wd_apply_filters()


    def _wd_make_text_readonly(self, widget: tk.Text):
        try:
            bg = widget.master.cget("background")
            if not bg:
                bg = self._base_bg
            widget.configure(background=bg)
        except Exception:
            widget.configure(background=self._base_bg)
        widget.configure(state="normal", cursor="arrow")
        widget.bind("<Key>", self._wd_block_text_edit)
        widget.bind("<<Paste>>", lambda e: "break")
        widget.bind("<<Cut>>", lambda e: "break")
        widget.bind("<Button-1>", lambda e: widget.focus_set())
        widget.bind("<Button-2>", lambda e: "break")
        widget.bind("<Button-3>", lambda e: widget.focus_set())

    def _wd_get_base_url(self) -> str:
        return "https://koanchay.org" if getattr(self, "wd_site", "wikidich") == "koanchay" else "https://truyenwikidich.net"

    def _wd_get_cookie_domains(self):
        if getattr(self, "wd_site", "wikidich") == "koanchay":
            # Lấy đủ cookie cf_clearance dù user đăng nhập qua koanchay.org hay koanchay.net
            return ["koanchay.org", "koanchay.net"]
        return ["truyenwikidich.net", "koanchay.net"]

    def _wd_normalize_url_for_site(self, url: str) -> str:
        """Đảm bảo URL phù hợp domain theo tab hiện tại (wikidich/koanchay)."""
        url = (url or "").strip()
        if not url:
            return ""
        try:
            base = self._wd_get_base_url()
            base_parts = urlparse(base)
            parts = urlparse(url)
            if parts.netloc and parts.netloc != base_parts.netloc:
                parts = parts._replace(scheme=base_parts.scheme or "https", netloc=base_parts.netloc)
                return parts.geturl()
        except Exception:
            return url
        return url

    def _wd_default_headers(self) -> dict:
        base_url = self._wd_get_base_url()
        base_host = urlparse(base_url).hostname or ""
        # Bắt đầu từ template mặc định
        headers = {
            "Accept": DEFAULT_API_SETTINGS['wiki_headers'].get("Accept"),
            "Accept-Language": DEFAULT_API_SETTINGS['wiki_headers'].get("Accept-Language"),
            "Cache-Control": "max-age=0",
            "Pragma": "no-cache",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Referer": base_url + "/",
            "Priority": "u=0, i",
            "sec-ch-ua": '"Not:A-Brand";v="24", "Chromium";v="134"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
        }
        # Gộp headers bắt được từ trình duyệt tích hợp (ưu tiên)
        spy_headers = (self._browser_headers or {}).get(base_host, {})
        if spy_headers:
            for key, val in spy_headers.items():
                if not key or not val:
                    continue
                lower = key.lower()
                if lower in ("host", "origin", "content-length"):
                    continue
                headers[key] = val
                if lower == "user-agent":
                    self._browser_user_agent = val
        # UA ưu tiên browser -> default (bỏ qua UA trong config để tránh lẫn)
        ua = self._browser_user_agent or DEFAULT_API_SETTINGS['wiki_headers'].get("User-Agent")
        if ua:
            headers["User-Agent"] = ua
        # self.log(f"[Wikidich] Using UA: {headers.get('User-Agent', '')}")
        # Loại bỏ các key gây nghi ngờ
        for bad in ("X-Requested-With", "x-requested-with", "Connection", "connection"):
            headers.pop(bad, None)
        # Clean None values
        headers = {k: v for k, v in headers.items() if v}
        wiki_headers = self.api_settings.get('wiki_headers') if isinstance(self.api_settings, dict) else {}
        if isinstance(wiki_headers, dict):
            for k, v in wiki_headers.items():
                if not v:
                    continue
                lower = k.lower()
                if lower in ("x-requested-with", "connection", "user-agent"):
                    continue
                if k not in headers:
                    headers[k] = v
        return headers

    def _wd_build_wiki_session(self, include_user=True):
        proxies = self._get_proxy_for_request('fetch_titles')
        cookies = load_browser_cookie_jar(self._wd_get_cookie_domains())
        if not cookies:
            return None, None, proxies
        session = wikidich_ext.build_session_with_cookies(cookies, proxies=proxies)
        # Dedupe cookie trùng tên (ưu tiên domain truyenwikidich.net, giá trị không bị bọc ")
        try:
            cleaned = requests.cookies.RequestsCookieJar()
            keep: dict[str, requests.cookies.Cookie] = {}
            for c in session.cookies:
                name_lower = c.name.lower()
                cur = keep.get(name_lower)
                preferred = cur
                if cur is None:
                    preferred = c
                else:
                    cur_bad_quote = str(cur.value or "").startswith('"') and str(cur.value or "").endswith('"')
                    cand_bad_quote = str(c.value or "").startswith('"') and str(c.value or "").endswith('"')
                    cur_good_domain = str(cur.domain or "").endswith("truyenwikidich.net")
                    cand_good_domain = str(c.domain or "").endswith("truyenwikidich.net")
                    if cand_good_domain and not cur_good_domain:
                        preferred = c
                    elif cur_good_domain == cand_good_domain:
                        if cur_bad_quote and not cand_bad_quote:
                            preferred = c
                        elif len(str(c.value or "")) > len(str(cur.value or "")):
                            preferred = c
                keep[name_lower] = preferred
            for c in keep.values():
                cleaned.set(c.name, c.value, domain=c.domain, path=c.path)
            session.cookies = cleaned
        except Exception:
            pass
        wiki_headers = self.api_settings.get('wiki_headers') if isinstance(self.api_settings, dict) else {}
        merged_headers = self._wd_default_headers()
        if isinstance(wiki_headers, dict):
            for k, v in wiki_headers.items():
                if v and k not in merged_headers and k.lower() not in ("x-requested-with", "connection"):
                    merged_headers[k] = v
        session.headers.clear()
        session.headers.update(merged_headers)
        current_user = None
        if include_user:
            try:
                current_user = self.wikidich_data.get('username') or wikidich_ext.fetch_current_user(
                    session, base_url=self._wd_get_base_url(), proxies=proxies
                ) or ""
            except Exception:
                current_user = self.wikidich_data.get('username') or ""
        return session, current_user, proxies

    def _wd_log_request_headers(self, resp: requests.Response, label: str):
        try:
            req = resp.request
            hdrs = dict(req.headers or {})
            # avoid dumping cookies
            hdrs.pop("Cookie", None)
            hdrs.pop("cookie", None)
            # self.log(f"[Wikidich] {label} headers -> {hdrs}")
        except Exception:
            pass

    def _wd_block_text_edit(self, event):
        navigation_keys = {"Left", "Right", "Up", "Down", "Home", "End", "Next", "Prior"}
        if event.keysym in ("Tab", "ISO_Left_Tab"):
            try:
                (event.widget.tk_focusPrev() if event.keysym == "ISO_Left_Tab" or event.state & 0x1 else event.widget.tk_focusNext()).focus_set()
            except Exception:
                pass
            return "break"
        if event.keysym in navigation_keys or event.keysym.startswith("Shift") or event.keysym.startswith("Control"):
            return None
        if (event.state & 0x4) and event.keysym.lower() in ("c", "a"):
            return None
        return "break"

    def _wd_set_text_content(self, widget: tk.Text, content: str):
        widget.configure(state="normal")
        widget.delete("1.0", tk.END)
        widget.insert("1.0", content or "")
        widget.see("1.0")

    def _wd_sync_prompt(self, func):
        """Chạy hộp thoại trong thread UI và chờ kết quả."""
        result = {}
        event = threading.Event()

        def wrapper():
            try:
                result["value"] = func()
            finally:
                event.set()
        self.after(0, wrapper)
        event.wait()
        return result.get("value")

    def _wd_update_user_label(self):
        if hasattr(self, "wd_user_label"):
            username = self.wikidich_data.get("username") or ""
            text = f"Tài khoản: {username}" if username else "Chưa kiểm tra đăng nhập"
            color = "#ec4899" if getattr(self, "wd_site", "wikidich") == "koanchay" else ""
            self.wd_user_label.config(text=text, foreground=color)

    def _wd_set_progress(self, message: str, current: int = 0, total: int = 0):
        def _update():
            if not hasattr(self, "wd_progress"):
                return
            self.wd_progress_label.config(text=message)
            if total > 0:
                self.wd_progress.config(mode="determinate", maximum=total, value=min(current, total))
                if self._wd_progress_running:
                    self.wd_progress.stop()
                    self._wd_progress_running = False
            else:
                self.wd_progress.config(mode="indeterminate", maximum=100, value=0)
                if not self._wd_progress_running:
                    self.wd_progress.start(12)
                    self._wd_progress_running = True
            self._wd_update_progress_visibility(message)
        self.after(0, _update)

    def _wd_update_progress_visibility(self, message: str):
        frame = getattr(self, "wd_progress_frame", None)
        if not frame:
            return
        active = bool(self._wd_loading or (message and message.strip() and message != "Chờ thao tác..."))
        visible = getattr(self, "_wd_progress_visible", False)
        cancel_btn = getattr(self, "wd_cancel_btn", None)
        if cancel_btn:
            cancel_btn_state = tk.NORMAL if active and self._wd_loading else tk.DISABLED
            cancel_btn.config(state=cancel_btn_state)
        if active and not visible:
            frame.grid()
            self._wd_progress_visible = True
        elif not active and visible:
            frame.grid_remove()
            self._wd_progress_visible = False

    def _wd_request_cancel(self):
        if not self._wd_loading:
            return
        self._wd_cancel_requested = True
        self._wd_set_progress("Đang hủy tác vụ...", 0, 0)

    def _wd_mark_cancelled(self):
        self._wd_set_progress("Đã hủy", 0, 1)
        self.after(800, lambda: (not self._wd_loading) and self._wd_set_progress("Chờ thao tác...", 0, 1))

    def _wd_progress_callback(self, stage: str, current: int, total: int, message: str):
        if getattr(self, "_wd_cancel_requested", False):
            raise WikidichCancelled()
        self._wd_report_progress(stage, current, total, message)

    def _wd_ensure_not_cancelled(self):
        if getattr(self, "_wd_cancel_requested", False):
            raise WikidichCancelled()

    def _wd_report_progress(self, stage: str, current: int, total: int, message: str):
        self._wd_set_progress(message, current, total)
        try:
            # Ghi log tiến độ (giảm spam bằng cách chỉ log khi message thay đổi hoặc ở mốc 0/100)
            if not hasattr(self, "_wd_last_log_msg"):
                self._wd_last_log_msg = ""
            if message != self._wd_last_log_msg or current in (0, total):
                self.log(f"[Wikidich] {message}")
                self._wd_last_log_msg = message
        except Exception:
            pass

    def _wd_collect_advanced_filter_values(self):
        if not hasattr(self, "wd_flag_vars"):
            return
        # Thu thập giá trị lọc cơ bản trước khi lưu/apply
        self.wikidich_filters['search'] = self.wd_search_var.get().strip()
        self.wikidich_filters['summarySearch'] = self.wd_summary_var.get().strip()
        self.wikidich_filters['extraLinkSearch'] = getattr(self, "wd_extra_link_var", tk.StringVar(value="")).get().strip() if hasattr(self, "wd_extra_link_var") else ""
        self.wikidich_filters['status'] = self.wd_status_var.get()
        self.wikidich_filters['flags'] = [flag for flag, var in self.wd_flag_vars.items() if var.get()]
        self.wikidich_filters['roles'] = [role for role, var in self.wd_role_vars.items() if var.get()]
        self.wikidich_filters['categories'] = self._wd_get_selected_categories()
        self.wikidich_filters['fromDate'] = self.wd_from_date_var.get().strip()
        self.wikidich_filters['toDate'] = self.wd_to_date_var.get().strip()
        self.wikidich_filters['sortBy'] = self._wd_get_sort_value()

    def _wd_get_sort_value(self):
        if not hasattr(self, "wd_sort_label_var"):
            return "recent"
        return self._wd_sort_label_to_value.get(self.wd_sort_label_var.get(), "recent")

    def _wd_set_sort_label_from_value(self, value):
        if not hasattr(self, "wd_sort_label_var"):
            return
        label = self._wd_sort_value_to_label.get(value, WD_SORT_OPTIONS[0][1])
        self.wd_sort_label_var.set(label)

    def _wd_sync_filter_controls_from_filters(self):
        if not hasattr(self, "wd_flag_vars"):
            return
        filters = self.wikidich_filters
        for flag, var in self.wd_flag_vars.items():
            var.set(flag in filters.get('flags', []))
        for role, var in self.wd_role_vars.items():
            var.set(role in filters.get('roles', []))
        self.wd_from_date_var.set(filters.get('fromDate', ''))
        self.wd_to_date_var.set(filters.get('toDate', ''))
        if hasattr(self, "wd_extra_link_var"):
            self.wd_extra_link_var.set(filters.get('extraLinkSearch', ''))
        self._wd_select_categories(filters.get('categories', []))
        self._wd_set_sort_label_from_value(filters.get('sortBy', 'recent'))
        self._wd_toggle_advanced_section(show=self._wd_has_advanced_filters())
        self._wd_update_adv_status()
        self._wd_update_basic_status()

    def _wd_reset_filters(self):
        if not hasattr(self, "wd_flag_vars"):
            return
        for var in self.wd_flag_vars.values():
            var.set(False)
        for var in self.wd_role_vars.values():
            var.set(False)
        self._wd_select_categories([])
        self.wd_from_date_var.set("")
        self.wd_to_date_var.set("")
        if hasattr(self, "wd_extra_link_var"):
            self.wd_extra_link_var.set("")
        self._wd_apply_filters()

    def _wd_apply_filters(self):
        if not hasattr(self, "wd_tree"):
            return
        self._wd_apply_not_found_flags()
        self._wd_collect_advanced_filter_values()
        self.wikidich_filters.setdefault('categories', [])
        self.wikidich_filters.setdefault('roles', [])
        self.wikidich_filters.setdefault('flags', [])
        self.wikidich_filters.setdefault('fromDate', '')
        self.wikidich_filters.setdefault('toDate', '')
        self.wikidich_filters.update({
            'search': self.wd_search_var.get().strip(),
            'summarySearch': self.wd_summary_var.get().strip(),
            'extraLinkSearch': getattr(self, "wd_extra_link_var", tk.StringVar(value="")).get().strip() if hasattr(self, "wd_extra_link_var") else "",
            'status': self.wd_status_var.get(),
            'sortBy': self._wd_get_sort_value()
        })
        filtered = wikidich_ext.filter_books(self.wikidich_data, self.wikidich_filters)
        self.wikidich_filtered = filtered
        self._wd_apply_not_found_flags()
        self._wd_update_adv_status()
        self._wd_update_basic_status()
        self._wd_refresh_tree(filtered)

    def _wd_get_selected_categories(self):
        listbox = getattr(self, "wd_category_listbox", None)
        if not listbox or not getattr(self, "_wd_category_options", None):
            return list(getattr(self, "_wd_pending_categories", []))
        selected = []
        for idx in listbox.curselection():
            if 0 <= idx < len(self._wd_category_options):
                selected.append(self._wd_category_options[idx])
        self._wd_pending_categories = list(selected)
        return selected

    def _wd_select_categories(self, categories):
        self._wd_pending_categories = list(categories or [])
        listbox = getattr(self, "wd_category_listbox", None)
        if not listbox:
            return
        listbox.selection_clear(0, tk.END)
        if not getattr(self, "_wd_category_options", None):
            return
        for idx, cat in enumerate(self._wd_category_options):
            if cat in self._wd_pending_categories:
                listbox.selection_set(idx)

    def _wd_refresh_category_options(self):
        listbox = getattr(self, "wd_category_listbox", None)
        if not listbox:
            return
        categories = sorted({c for b in self.wikidich_data.get('books', {}).values() for c in (b.get('collections') or []) if c})
        self._wd_category_options = categories
        listbox.delete(0, tk.END)
        for cat in categories:
            listbox.insert(tk.END, cat)
        self._wd_select_categories(getattr(self, "_wd_pending_categories", []) or self.wikidich_filters.get('categories', []))

    def _wd_open_date_picker(self, target_var, title):
        today = datetime.today()
        current_value = target_var.get().strip()
        try:
            current_dt = datetime.fromisoformat(current_value) if current_value else today
        except Exception:
            current_dt = today
        current_dt = min(current_dt, today)
        win = tk.Toplevel(self)
        self._apply_window_icon(win)
        win.title(title)
        frame = ttk.Frame(win, padding=12)
        frame.pack(fill="both", expand=True)
        ttk.Label(frame, text="Chọn ngày (không vượt quá hôm nay)").pack(anchor="w", pady=(0, 6))
        year_var = tk.IntVar(value=current_dt.year)
        month_var = tk.IntVar(value=current_dt.month)
        day_var = tk.IntVar(value=current_dt.day)

        spin_frame = ttk.Frame(frame)
        spin_frame.pack(pady=(0, 8))
        ttk.Label(spin_frame, text="Năm:").grid(row=0, column=0, padx=4)
        ttk.Spinbox(spin_frame, from_=2005, to=today.year, textvariable=year_var, width=6).grid(row=0, column=1)
        ttk.Label(spin_frame, text="Tháng:").grid(row=0, column=2, padx=4)
        ttk.Spinbox(spin_frame, from_=1, to=12, textvariable=month_var, width=4).grid(row=0, column=3)
        ttk.Label(spin_frame, text="Ngày:").grid(row=0, column=4, padx=4)
        ttk.Spinbox(spin_frame, from_=1, to=31, textvariable=day_var, width=4).grid(row=0, column=5)

        btn_frame = ttk.Frame(frame)
        btn_frame.pack(fill=tk.X)

        def _set_today():
            year_var.set(today.year)
            month_var.set(today.month)
            day_var.set(today.day)

        def _apply():
            try:
                selected = datetime(year_var.get(), month_var.get(), day_var.get())
            except ValueError:
                messagebox.showerror("Ngày không hợp lệ", "Vui lòng kiểm tra lại ngày/tháng/năm.", parent=win)
                return
            if selected > today:
                messagebox.showerror("Ngày không hợp lệ", "Không thể chọn ngày ở tương lai.", parent=win)
                return
            target_var.set(selected.strftime("%Y-%m-%d"))
            self._wd_update_adv_status()
            win.destroy()

        ttk.Button(btn_frame, text="Hôm nay", command=_set_today).pack(side=tk.LEFT)
        ttk.Button(btn_frame, text="Đồng ý", command=_apply).pack(side=tk.RIGHT)
        ttk.Button(btn_frame, text="Hủy", command=win.destroy).pack(side=tk.RIGHT, padx=(0, 8))

    def _wd_clear_date(self, target_var):
        target_var.set("")
        self._wd_update_adv_status()

    def _wd_apply_not_found_flags(self):
        """Gắn cờ deleted_404 cho dữ liệu đang có dựa trên wd_not_found."""
        try:
            ids = {b.get("id") for b in (self.wd_not_found or []) if b.get("id")}
            if ids and isinstance(self.wikidich_data.get("books"), dict):
                for bid, book in self.wikidich_data["books"].items():
                    if bid in ids:
                        book["deleted_404"] = True
            if ids and getattr(self, "wikidich_filtered", None):
                for obj in self.wikidich_filtered:
                    if obj.get("id") in ids:
                        obj["deleted_404"] = True
        except Exception:
            pass

    def _wd_clean_updated_text(self, raw: str) -> str:
        if not raw:
            return ""
        text = raw.strip()
        # Lấy phần ngày dạng dd-mm-yyyy hoặc yyyy-mm-dd
        m = re.search(r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})", text)
        if not m:
            m = re.search(r"(\d{4}[/-]\d{1,2}[/-]\d{1,2})", text)
        if m:
            return m.group(1)
        return text

    def _wd_date_to_ts(self, text: str) -> int:
        if not text:
            return 0
        cleaned = text.replace(".", "/").replace("-", "/")
        parts = cleaned.split("/")
        try:
            if len(parts) >= 3:
                if len(parts[0]) == 4:
                    dt = datetime(int(parts[0]), int(parts[1]), int(parts[2]))
                else:
                    dt = datetime(int(parts[2]), int(parts[1]), int(parts[0]))
                return int(dt.timestamp() * 1000)
        except Exception:
            return 0
        return 0

    def _wd_refresh_tree(self, books):
        self.wd_tree.delete(*self.wd_tree.get_children())
        self._wd_tree_index = {}
        new_map = getattr(self, "wd_new_chapters", {})
        not_found_ids = set()
        try:
            not_found_ids = {b.get("id") for b in (self.wd_not_found or []) if b.get("id")}
        except Exception:
            not_found_ids = set()
        self._wd_apply_not_found_flags()
        for book in books:
            stats = book.get('stats', {}) or {}
            book_id = book.get('id')
            # nếu book nằm trong danh sách 404, gắn cờ
            if book_id and not book.get("deleted_404") and book_id in not_found_ids:
                book["deleted_404"] = True
            new_count = ""  # default empty
            if book_id and isinstance(new_map, dict):
                val = new_map.get(book_id)
                if isinstance(val, int) and val > 0:
                    new_count = str(val)
            if book.get("deleted_404"):
                tags = ("not_found",)
            elif book.get("server_lower"):
                tags = ("server_lower",)
            elif new_count:
                tags = ("has_new",)
            else:
                tags = ()
            item_id = self.wd_tree.insert(
                "",
                "end",
                tags=tags,
                values=(
                    book.get('title', ''),
                    book.get('status', ''),
                    book.get('updated_text', ''),
                    book.get('chapters') or "",
                    new_count,
                    stats.get('views') or "",
                    book.get('author', '')
                )
            )
            self._wd_tree_index[item_id] = book_id
        if books:
            first = self.wd_tree.get_children()[0]
            self.wd_tree.selection_set(first)
            self._wd_on_select()
        else:
            self._wd_set_text_content(self.wd_title_text, "Chưa có dữ liệu phù hợp")
            self._wd_set_text_content(self.wd_summary_text, "")
            self.wd_links_listbox.delete(0, tk.END)
            self.wd_current_links = []
            self.wd_info_vars['author'].set("")
            self.wd_info_vars['status'].set("")
            self.wd_info_vars['updated'].set("")
            self.wd_info_vars['chapters'].set("")
            self.wd_info_vars['collections'].set("")
            self.wd_info_vars['flags'].set("")
            self._wd_set_text_content(self.wd_collections_text, "")
            self._wd_set_text_content(self.wd_flags_text, "")
        if hasattr(self, "wd_count_var"):
            self.wd_count_var.set(f"Số truyện: {len(books)}")
        # Thu gọn lọc cơ bản theo trạng thái hiện tại (mặc định đã thu gọn sau init)
        if getattr(self, "_wd_basic_collapsed", False):
            try:
                self._wd_toggle_basic_section(collapse=True)
            except Exception:
                pass

    def _wd_select_tree_item(self, book_id: str):
        if not book_id or not hasattr(self, "wd_tree"):
            return
        for item_id, bid in getattr(self, "_wd_tree_index", {}).items():
            if bid == book_id:
                try:
                    self.wd_tree.selection_set(item_id)
                    self.wd_tree.see(item_id)
                except Exception:
                    pass
                break

    def _wd_handle_uploaded_chapters(self, book: dict, added: int):
        """Sau khi upload bổ sung: cập nhật số chương và cột New."""
        if not added or added <= 0 or not book:
            return
        bid = book.get("id")
        if not bid:
            return
        try:
            current = int(book.get("chapters") or 0)
        except Exception:
            current = 0
        new_total = current + added
        if isinstance(self.wikidich_data, dict):
            books = self.wikidich_data.get("books") or {}
            if bid in books:
                books[bid]["chapters"] = new_total
        if getattr(self, "wd_selected_book", None) and self.wd_selected_book.get("id") == bid:
            self.wd_selected_book["chapters"] = new_total
            try:
                self.wd_info_vars["chapters"].set(str(new_total))
            except Exception:
                pass
        if isinstance(self.wd_new_chapters, dict):
            cur_new = self.wd_new_chapters.get(bid)
            if isinstance(cur_new, int):
                new_diff = cur_new - added
                if new_diff > 0:
                    self.wd_new_chapters[bid] = new_diff
                else:
                    self.wd_new_chapters.pop(bid, None)
        filtered = getattr(self, "wikidich_filtered", None)
        if filtered is not None:
            self._wd_refresh_tree(filtered)
        else:
            self._wd_apply_filters()
        self._wd_select_tree_item(bid)
        self._wd_update_update_button_state()

    def _wd_on_select(self, event=None):
        selection = self.wd_tree.selection()
        if not selection:
            # Không tự khóa các nút khi danh sách rỗng; chỉ xóa chi tiết hiển thị
            self._wd_show_detail(None)
            return
        item = selection[0]
        book_id = getattr(self, "_wd_tree_index", {}).get(item)
        book = self.wikidich_data.get('books', {}).get(book_id)
        self._wd_show_detail(book)


    def _wd_show_detail(self, book):
        self.wd_selected_book = book
        if not book:
            self._wd_set_text_content(self.wd_title_text, "Chưa chọn truyện")
            self._wd_set_text_content(self.wd_summary_text, "")
            self._wd_set_text_content(self.wd_collections_text, "")
            self._wd_set_text_content(self.wd_flags_text, "")
            self.wd_links_listbox.delete(0, tk.END)
            self.wd_info_vars['author'].set("")
            self.wd_info_vars['status'].set("")
            self.wd_info_vars['updated'].set("")
            self.wd_info_vars['chapters'].set("")
            self.wd_info_vars['collections'].set("")
            self.wd_info_vars['flags'].set("")
            self._wd_update_update_button_state()
            self._wd_update_delete_button_state()
            if hasattr(self, "wd_edit_book_btn"):
                self.wd_edit_book_btn.config(state=tk.DISABLED)
            btn = getattr(self, "wd_auto_update_btn", None)
            if btn:
                btn.config(state=tk.DISABLED)
                if btn.winfo_manager():
                    btn.pack_forget()
            self._wd_update_link_ui(None)
            return

        self._wd_set_text_content(self.wd_title_text, book.get('title', ''))
        self.wd_info_vars['author'].set(book.get('author', ''))
        self.wd_info_vars['status'].set(book.get('status', ''))
        self.wd_info_vars['updated'].set(book.get('updated_text') or book.get('updated_iso', ''))
        chapters = book.get('chapters')
        self.wd_info_vars['chapters'].set(str(chapters) if chapters not in (None, "") else "")
        collections = book.get('collections') or book.get('tags') or []
        collections_text = ", ".join(collections)
        self.wd_info_vars['collections'].set(collections_text)
        flag_map = {
            "poster": "Người đăng",
            "managerOwner": "Đồng quản lý - chủ",
            "managerGuest": "Đồng quản lý - khách",
            "editorOwner": "Biên tập - chủ",
            "editorGuest": "Biên tập - khách",
            "embedLink": "Nhúng link",
            "embedFile": "Nhúng file"
        }
        flag_labels = [flag_map.get(k, k) for k, v in (book.get('flags') or {}).items() if v]
        if book.get("deleted_404"):
            flag_labels.append("Cảnh báo: truyện có thể đã bị xóa (404)")
        flags_text = ", ".join(flag_labels)
        self.wd_info_vars['flags'].set(flags_text)
        self._wd_set_text_content(self.wd_collections_text, collections_text)
        self._wd_set_text_content(self.wd_flags_text, flags_text)
        self._wd_set_text_content(self.wd_summary_text, book.get('summary', ''))
        self.wd_links_listbox.delete(0, tk.END)
        self.wd_current_links = book.get('extra_links', [])
        for link in self.wd_current_links:
            label = link.get('label') or link.get('url')
            self.wd_links_listbox.insert(tk.END, label)
        self._wd_display_cover(book.get('cover_url'))
        self._wd_update_update_button_state()
        self._wd_update_delete_button_state()
        if hasattr(self, "wd_edit_book_btn"):
            flags = book.get("flags") or {}
            editable = bool(flags.get("embedFile"))
            self.wd_edit_book_btn.config(state=tk.NORMAL if editable else tk.DISABLED)
        btn = getattr(self, "wd_auto_update_btn", None)
        if btn:
            has_fanqie = bool(self._wd_get_fanqie_link(book))
            if has_fanqie:
                if not btn.winfo_manager():
                    opts = getattr(self, "_wd_auto_update_pack_opts", {"side": tk.LEFT, "padx": (8, 0)})
                    btn.pack(**opts)
                btn.config(state=tk.NORMAL)
            else:
                btn.config(state=tk.DISABLED)
                if btn.winfo_manager():
                    btn.pack_forget()
        self._wd_update_link_ui(book)

    def _wd_open_link(self, url: str):
        url = (url or "").strip()
        if not url:
            return
        mode = getattr(self, "wikidich_open_mode", "in_app") or "in_app"
        if mode == "external":
            webbrowser.open(url)
        else:
            self._open_in_app_browser(url)

    def _wd_open_extra_link(self, event=None):
        if not self.wd_current_links:
            return
        try:
            index = self.wd_links_listbox.curselection()[0]
        except IndexError:
            return
        link = self.wd_current_links[index]
        url = (link.get('url') if isinstance(link, dict) else link) or ""
        self._wd_open_link(url)

    def _wd_open_book_in_browser(self):
        if not getattr(self, "wd_selected_book", None):
            return
        url = self.wd_selected_book.get('url')
        self._wd_open_link(url)

    def _wd_open_wiki_edit_uploader(self, prefill: Optional[dict] = None, book_override: Optional[dict] = None):
        book = book_override or getattr(self, "wd_selected_book", None)
        if not book or not book.get("id"):
            messagebox.showinfo("Chưa chọn truyện", "Chọn một truyện trước.", parent=self)
            return
        prefill = prefill or {}
        prefill_files = list(prefill.get("parsed_files") or [])
        prefill_desc = prefill.get("desc") or ""
        prefill_select_append = bool(prefill.get("select_append_volume"))
        prefill_raw_title_only = bool(prefill.get("raw_title_only"))
        preview_full = bool(prefill.get("full_preview"))
        prefill_source_label = prefill.get("source_label") or ""
        prefill_warns = list(prefill.get("warn_messages") or [])
        current_raw_title_only = {"value": prefill_raw_title_only}
        edit_page_url = self._wd_normalize_url_for_site(book.get("url", "")) + "/chinh-sua"
        win = tk.Toplevel(self)
        self._apply_window_icon(win)
        win.title("Upload nội dung (Wikidich)")
        win.geometry("680x520")
        win.columnconfigure(0, weight=1)
        win.rowconfigure(2, weight=1)
        win.rowconfigure(5, weight=1)
        status_var = tk.StringVar(value="Đang tải trang chỉnh sửa...")
        files_var = tk.StringVar(value="Chưa chọn file")
        volume_list = tk.Listbox(win, height=6)
        volume_list.grid(row=1, column=0, sticky="nsew", padx=10, pady=(10, 0))
        scrollbar = ttk.Scrollbar(win, orient="vertical", command=volume_list.yview)
        volume_list.configure(yscrollcommand=scrollbar.set)
        scrollbar.grid(row=1, column=1, sticky="ns", pady=(10, 0))
        ttk.Label(win, textvariable=status_var, anchor="w").grid(row=0, column=0, columnspan=2, sticky="ew", padx=10, pady=(10, 0))
        ttk.Label(win, text="Chọn volume (khóa vẫn upload được; ưu tiên quyển cuối cùng hoặc tạo mới trên web nếu cần).", anchor="w", justify="left").grid(row=4, column=0, columnspan=2, sticky="ew", padx=10, pady=(0, 6))
        upload_cfg = {**DEFAULT_UPLOAD_SETTINGS, **(self.wikidich_upload_settings or {})}
        desc_default = prefill_desc or upload_cfg.get("append_desc", DEFAULT_UPLOAD_SETTINGS["append_desc"])
        desc_var = tk.StringVar(value=desc_default)
        desc_frame = ttk.Frame(win)
        desc_frame.grid(row=6, column=0, columnspan=2, sticky="ew", padx=10, pady=(0, 6))
        desc_frame.columnconfigure(1, weight=1)
        ttk.Label(desc_frame, text="Mô tả file bổ sung:").grid(row=0, column=0, sticky="w")
        ttk.Entry(desc_frame, textvariable=desc_var).grid(row=0, column=1, sticky="ew", padx=(6, 0))
        btn_frame = ttk.Frame(win)
        btn_frame.grid(row=3, column=0, columnspan=2, sticky="ew", padx=10, pady=(10, 10))
        btn_frame.columnconfigure(0, weight=1)
        selected_files = []
        parsed_files = []
        parse_errors = []
        upload_btn = ttk.Button(btn_frame, text="Tải lên", state=tk.DISABLED)
        pick_btn = ttk.Button(btn_frame, text="Chọn file .txt", state=tk.DISABLED)
        ttk.Label(win, textvariable=files_var, anchor="w", justify="left").grid(row=2, column=0, columnspan=2, sticky="ew", padx=10, pady=(10, 0))
        log_box = scrolledtext.ScrolledText(win, height=8, wrap=tk.WORD, state="disabled")
        log_box.grid(row=5, column=0, columnspan=2, sticky="nsew", padx=10, pady=(0, 10))
        log_box.tag_configure("warn", foreground="#d14343")
        log_box.tag_configure("error", foreground="#d14343")
        log_box.tag_configure("ok", foreground="#2563eb")
        volumes_data = []
        parse_settings = {
            "filename_regex": upload_cfg.get("filename_regex", DEFAULT_UPLOAD_SETTINGS["filename_regex"]),
            "content_regex": upload_cfg.get("content_regex", DEFAULT_UPLOAD_SETTINGS["content_regex"]),
            "template": upload_cfg.get("template", DEFAULT_UPLOAD_SETTINGS["template"]),
            "priority": upload_cfg.get("priority", DEFAULT_UPLOAD_SETTINGS["priority"]),
            "warn_kb": upload_cfg.get("warn_kb", DEFAULT_UPLOAD_SETTINGS["warn_kb"]),
            "sort_by_number": bool(upload_cfg.get("sort_by_number", DEFAULT_UPLOAD_SETTINGS["sort_by_number"])),
        }

        def _set_status(text):
            status_var.set(text)

        def _enable_actions():
            try:
                selection = volume_list.curselection()
                selected = volumes_data[selection[0]] if selection else None
            except Exception:
                selected = None
            can_edit = bool(selected and selected.get("editable"))
            enough_files = len(parsed_files) >= 2
            pick_btn.config(state=tk.NORMAL if volumes_data and can_edit else tk.DISABLED)
            upload_btn.config(state=tk.NORMAL if parsed_files and not parse_errors and can_edit and enough_files else tk.DISABLED)

        def _log(msg, level="info"):
            prefix = {"error": "[Lỗi] ", "warn": "[Cảnh báo] ", "ok": "[OK] "}.get(level, "")
            log_box.config(state="normal")
            try:
                log_box.insert(tk.END, prefix + msg + "\n", level if level in ("warn", "error", "ok") else None)
            except Exception:
                log_box.insert(tk.END, prefix + msg + "\n")
            log_box.see(tk.END)
            log_box.config(state="disabled")

        def _log_parsed_preview(preview_all=False, use_raw_only=False):
            if not parsed_files:
                return
            tpl = parse_settings.get("template", "第{num}章 {title}")
            _log("Xem trước tên chương:", "ok")
            items = parsed_files if preview_all else parsed_files[:10]
            for item in items:
                raw_title = str(item.get("raw_title", "")).strip()
                if use_raw_only:
                    display = raw_title or f"{item['num']}"
                else:
                    display = tpl.replace("{num}", str(item["num"])).replace("{title}", raw_title)
                num_label = f"#{item['num']}"
                file_label = os.path.basename(item["path"])
                _log(f"- {num_label}: {display} (file: {file_label})")
            if not preview_all and len(parsed_files) > 10:
                _log(f"... (+{len(parsed_files)-10} chương)", "ok")

        def _on_select_files():
            nonlocal selected_files, parsed_files, parse_errors
            paths = filedialog.askopenfilenames(
                parent=win,
                title="Chọn file chương (.txt)",
                filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
            )
            if not paths:
                return
            selected_files = sorted(paths, key=lambda p: os.path.basename(p).lower())
            preview = ", ".join(os.path.basename(p) for p in selected_files[:5])
            if len(selected_files) > 5:
                preview += f"... (+{len(selected_files)-5})"
            files_var.set(f"{len(selected_files)} file: {preview}")
            parsed_files = []
            parse_errors = []
            log_box.config(state="normal")
            log_box.delete("1.0", tk.END)
            log_box.config(state="disabled")
            current_raw_title_only["value"] = False
            _set_status("Đang phân tích file...")
            upload_btn.config(state=tk.DISABLED)
            def worker():
                nonlocal parsed_files, parse_errors
                parsed_files = []
                parse_errors = []
                try:
                    warn_kb = float(parse_settings.get("warn_kb", 4))
                except Exception:
                    warn_kb = 4.0
                warn_kb = max(0.0, warn_kb) * 1024
                priority = (parse_settings.get("priority", "filename") or "filename").lower()
                fn_regex = parse_settings.get("filename_regex", "")
                ct_regex = parse_settings.get("content_regex", "")
                pattern_fn = re.compile(fn_regex, re.IGNORECASE) if fn_regex else None
                pattern_ct = re.compile(ct_regex, re.IGNORECASE) if ct_regex else None

                def match(text, pattern):
                    if not text or not pattern:
                        return None
                    m = pattern.search(text)
                    if not m or not m.group(1):
                        return None
                    try:
                        num = int(m.group(1))
                    except Exception:
                        return None
                    title = m.group(2) or ""
                    return num, title

                files_info = []
                for p in selected_files:
                    try:
                        size = os.path.getsize(p)
                        files_info.append((p, size))
                    except Exception:
                        files_info.append((p, 0))

                for path, size in files_info:
                    name = os.path.basename(path)
                    base = os.path.splitext(name)[0]
                    first_line = ""
                    info = None
                    if priority == "filename":
                        info = match(base, pattern_fn)
                        if not info:
                            try:
                                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                                    first_line = (f.readline() or "").strip()
                            except Exception:
                                first_line = ""
                            info = match(first_line, pattern_ct)
                    else:
                        try:
                            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                                first_line = (f.readline() or "").strip()
                        except Exception:
                            first_line = ""
                        info = match(first_line, pattern_ct)
                        if not info:
                            info = match(base, pattern_fn)
                    if not info:
                        parse_errors.append(f"{name}: Không tìm thấy số chương (tên/dòng đầu).")
                        continue
                    num, raw_title = info
                    parsed_files.append({"path": path, "num": num, "raw_title": raw_title, "size": size})

                if parse_settings.get("sort_by_number", True):
                    parsed_files.sort(key=lambda x: x["num"])
                else:
                    parsed_files.sort(key=lambda x: os.path.basename(x["path"]).lower())
                nums = [p["num"] for p in parsed_files]
                missing = []
                if nums:
                    for i in range(nums[0], nums[-1] + 1):
                        if i not in nums:
                            missing.append(i)
                dupes = set([n for n in nums if nums.count(n) > 1])

                def ui_update():
                    if warn_kb > 0:
                        small = [p for p in parsed_files if p["size"] and p["size"] < warn_kb]
                        if small:
                            _log(f"{len(small)} file < {warn_kb//1024}KB: " + ", ".join(os.path.basename(s['path']) for s in small), "warn")
                    for err in parse_errors:
                        _log(err, "error")
                    if dupes:
                        _log("Trùng chương: " + ", ".join(str(d) for d in sorted(dupes)), "error")
                        parse_errors.append("Có chương trùng")
                    if missing:
                        _log("Thiếu chương: " + ", ".join(str(m) for m in missing), "warn")
                    if parsed_files:
                        _log_parsed_preview(preview_all=preview_full, use_raw_only=current_raw_title_only["value"])
                    _set_status(f"Đã phân tích {len(parsed_files)} file. {'Có lỗi' if parse_errors else 'Sẵn sàng upload'}.")
                    _enable_actions()
                self.after(0, ui_update)
            threading.Thread(target=worker, daemon=True).start()

        def _apply_prefill_files():
            nonlocal selected_files, parsed_files, parse_errors
            if not prefill_files:
                return
            parsed_files = sorted(prefill_files, key=lambda x: x.get("num", 0))
            parse_errors = []
            selected_files = [p.get("path") for p in parsed_files if p.get("path")]
            preview = ", ".join(os.path.basename(p) for p in selected_files[:5]) if selected_files else ""
            if selected_files and (len(selected_files) > 5 and not preview_full):
                preview += f"... (+{len(selected_files)-5})"
            suffix = f": {preview}" if preview else ""
            files_var.set(f"{len(selected_files)} file (auto){suffix}")
            log_box.config(state="normal")
            log_box.delete("1.0", tk.END)
            log_box.config(state="disabled")
            current_raw_title_only["value"] = True
            _log(prefill_source_label or "Đã thêm file tự động", "ok")
            for wmsg in prefill_warns:
                _log(wmsg, "warn")
            # Hiển thị đầy đủ danh sách khi dữ liệu được thêm tự động
            _log_parsed_preview(preview_all=True, use_raw_only=current_raw_title_only["value"])
            _set_status("Đã thêm file tự động, sẵn sàng upload.")
            _enable_actions()

        def _do_upload():
            sel = volume_list.curselection()
            if not sel:
                messagebox.showinfo("Chưa chọn", "Chọn một volume có thể sửa.", parent=win)
                return
            idx = sel[0]
            vol = volumes_data[idx]
            if not vol.get("volume_id"):
                messagebox.showinfo("Thiếu Volume ID", "Không tìm thấy volume để upload trên trang chỉnh sửa.", parent=win)
                return
            if not vol.get("editable"):
                messagebox.showerror("Quyển bị khóa", "Chọn quyển có nhãn 'Bổ sung' trước khi tải.", parent=win)
                return
            append_mode = bool(vol.get("appendable"))
            if not parsed_files or len(parsed_files) < 2:
                messagebox.showinfo("Chưa đủ file", "Chọn ít nhất 2 file .txt trước khi tải.", parent=win)
                return
            book_id = vol.get("book_id")
            volume_id = vol.get("volume_id")
            if not book_id:
                messagebox.showerror("Thiếu Book ID", "Không tìm thấy bookId trên trang chỉnh sửa (có thể chưa đăng nhập hoặc trang lỗi).", parent=win)
                return
            sizes = []
            try:
                sizes = [os.path.getsize(p["path"]) for p in parsed_files if os.path.exists(p["path"])]
            except Exception:
                sizes = []
            if sizes:
                if len(sizes) == 1:
                    if sizes[0] > 5 * 1024 * 1024:
                        messagebox.showerror("File quá lớn", "File vượt quá 5MB, web sẽ từ chối.", parent=win)
                        return
                else:
                    too_big = [s for s in sizes if s > 100 * 1024]
                    if too_big:
                        messagebox.showerror("File quá lớn", "Có file vượt quá 100KB, web sẽ từ chối.", parent=win)
                        return
            _set_status("Đang upload...")
            upload_btn.config(state=tk.DISABLED)
            pick_btn.config(state=tk.DISABLED)
            # Log danh sách chương sẽ gửi
            try:
                tpl = parse_settings.get("template", "第{num}章 {title}")
                preview = [tpl.replace("{num}", str(i["num"])).replace("{title}", i["raw_title"].strip()) for i in parsed_files]
                _log(f"Gửi {len(parsed_files)} chương: " + "; ".join(preview[:10]) + ("..." if len(preview) > 10 else ""))
            except Exception:
                pass

            def worker():
                session, current_user, proxies = self._wd_build_wiki_session(include_user=True)
                if not session or not current_user:
                    self.after(0, lambda: messagebox.showerror("Lỗi", "Không đọc được cookie Wikidich hoặc chưa đăng nhập." , parent=win))
                    self.after(0, lambda: (_set_status("Thiếu cookie / chưa đăng nhập"), _enable_actions()))
                    return
                # Xác thực lại user trước khi upload
                try:
                    user_check = wikidich_ext.fetch_current_user(session, base_url=self._wd_get_base_url(), proxies=proxies)
                except Exception:
                    user_check = None
                if not user_check:
                    self.after(0, lambda: (_set_status("Chưa đăng nhập"), messagebox.showerror("Lỗi", "Cookie không hợp lệ (không nhận diện được tài khoản).", parent=win)))
                    self.after(0, _enable_actions)
                    return
                base_url = self._wd_get_base_url()
                url = base_url.rstrip("/") + "/upload-content"
                desc_text = desc_var.get().strip() or "Bổ sung"
                append_flag = "true" if append_mode else None
                form_fields = [
                    ("bookId", book_id),
                    ("volumeId", volume_id),
                    ("numFile", str(len(parsed_files))),
                ]
                if append_flag:
                    form_fields.append(("appendMode", append_flag))
                    form_fields.append(("descCn", desc_text))

                handles = []
                if parse_settings.get("sort_by_number", True):
                    files_sorted = sorted(parsed_files, key=lambda x: x["num"])
                else:
                    files_sorted = sorted(parsed_files, key=lambda x: os.path.basename(x["path"]).lower())
                file_parts = []
                try:
                    tpl = "{title}" if current_raw_title_only["value"] else parse_settings.get("template", "第{num}章 {title}")
                    for item in files_sorted:
                        path = item["path"]
                        raw_title = str(item.get("raw_title", "")).strip()
                        chapter_name = tpl.replace("{num}", str(item["num"])).replace("{title}", raw_title)
                        f = open(path, "rb")
                        handles.append(f)
                        form_fields.append(("name", chapter_name))
                        file_parts.append(("files", (os.path.basename(path), f)))
                except Exception as exc:
                    for h in handles:
                        try:
                            h.close()
                        except Exception:
                            pass
                    self.after(0, lambda: (_set_status("Lỗi đọc file"), messagebox.showerror("Lỗi", f"Không đọc được file: {exc}", parent=win)))
                    self.after(0, _enable_actions)
                    return
                try:
                    # Refresh cookies by touching trang chỉnh sửa trước khi upload
                    try:
                        session.get(edit_page_url, proxies=proxies or {}, timeout=15)
                    except Exception:
                        pass
                    headers = dict(session.headers or {})
                    headers.update({
                        "X-Requested-With": "XMLHttpRequest",
                        "Referer": edit_page_url,
                        "Origin": base_url.rstrip("/"),
                        "Accept": "*/*",
                        "Accept-Language": "vi-VN,vi;q=0.9,zh-CN;q=0.8,zh;q=0.7,en-US;q=0.4,en;q=0.3",
                        "Cache-Control": "no-cache",
                        "Pragma": "no-cache",
                        "Priority": "u=1, i",
                        "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": '"Windows"',
                        "Sec-Fetch-Site": "same-origin",
                        "Sec-Fetch-Mode": "cors",
                        "Sec-Fetch-Dest": "empty",
                    })
                    headers.pop("Content-Type", None)
                    # Dump cookie names being sent để dễ debug
                    sent_cookies = "; ".join(f"{c.name}={c.value}" for c in session.cookies if c.value)
                    resp = session.post(url, data=form_fields, files=file_parts, proxies=proxies or {}, headers=headers)
                    ok = False
                    err_msg = resp.text
                    try:
                        js = resp.json()
                        if js.get("err") == 0:
                            ok = True
                        else:
                            err_msg = str(js)
                    except Exception:
                        pass
                    total_fields = len(form_fields) + len(file_parts)
                    summary_msg = f"[Wikidich] Upload {len(parsed_files)} file(s) -> vol {volume_id or '(mặc định)'} ({total_fields} fields) status={resp.status_code} err={err_msg[:200]}"
                    self.after(0, lambda: _log(summary_msg, "info"))
                    self.after(0, lambda: self.log(summary_msg))
                    if ok:
                        count_added = len(parsed_files)
                        self.after(0, lambda: (
                            _set_status("Upload thành công"),
                            messagebox.showinfo("Thành công", "Đã upload file lên Wikidich.", parent=win),
                            self._wd_handle_uploaded_chapters(book, count_added)
                        ))
                    else:
                        self.after(0, lambda: (_set_status("Upload thất bại"), messagebox.showerror("Lỗi upload", err_msg, parent=win)))
                except Exception as exc:
                    self.after(0, lambda: (_set_status("Lỗi request"), messagebox.showerror("Lỗi", f"{exc}", parent=win)))
                finally:
                    for h in handles:
                        try:
                            h.close()
                        except Exception:
                            pass
                    self.after(0, _enable_actions)

            threading.Thread(target=worker, daemon=True).start()

        pick_btn.config(command=_on_select_files)
        upload_btn.config(command=_do_upload)
        pick_btn.grid(row=0, column=0, sticky="w")
        upload_btn.grid(row=0, column=1, sticky="e")

        def _populate(vols):
            volume_list.delete(0, tk.END)
            for v in vols:
                labels = []
                if v.get("appendable"):
                    labels.append("Bổ sung")
                if not v.get("editable"):
                    labels.append("Khóa")
                suffix = f" ({', '.join(labels)})" if labels else ""
                display = f"{v.get('name') or 'Không tên'}{suffix}"
                volume_list.insert(tk.END, display)
            if vols:
                preferred = None
                if prefill_select_append:
                    for idx, vol in enumerate(vols):
                        if vol.get("appendable"):
                            preferred = idx
                            break
                if preferred is None:
                    for idx in range(len(vols) - 1, -1, -1):
                        if vols[idx].get("appendable") or vols[idx].get("editable"):
                            preferred = idx
                            break
                last = preferred if preferred is not None else len(vols) - 1
                try:
                    volume_list.selection_set(last)
                    volume_list.see(last)
                except Exception:
                    pass
            _enable_actions()

        def _fetch():
            session, _user, proxies = self._wd_build_wiki_session(include_user=False)
            if not session:
                self.after(0, lambda: (_set_status("Thiếu cookie"), messagebox.showerror("Lỗi", "Không đọc được cookie Wikidich.", parent=win)))
                return
            try:
                resp = session.get(edit_page_url, proxies=proxies or {})
                resp.raise_for_status()
                html = resp.text
                book_id = None
                m = re.search(r'var\\s+bookId\\s*=\\s*"([^"]+)"', html)
                if m:
                    book_id = m.group(1)
                soup = BeautifulSoup(html, "html.parser")
                if not book_id:
                    hidden_book = soup.select_one("input#bookId[name='bookId']") or soup.select_one("input[name='bookId']")
                    if hidden_book:
                        book_id = hidden_book.get("value", "").strip()
                vols = []
                for wrap in soup.select(".volume-info-wrapper"):
                    vol_id = wrap.get("data-volume") or ""
                    name_input = wrap.select_one("input[name='nameCn']")
                    name_val = name_input.get("value", "").strip() if name_input else ""
                    vol_div = wrap.select_one(".volume-wrapper")
                    editable = True
                    appendable = False
                    if vol_div and "readonly" in (vol_div.get("class") or []):
                        editable = False
                    if vol_div and str(vol_div.get("data-append") or "").lower() == "true":
                        appendable = True
                        editable = True
                    vols.append({
                        "name": name_val or vol_id or "(Không tên)",
                        "volume_id": vol_id,
                        "editable": editable,
                        "appendable": appendable,
                        "book_id": book_id
                    })
                if not vols and book_id:
                    vols.append({"name": "(Mặc định)", "volume_id": "", "editable": True, "appendable": False, "book_id": book_id})
                self.after(0, lambda: (_set_status(f"Tải xong {len(vols)} volume"), volumes_data.extend(vols), _populate(vols), _apply_prefill_files()))
            except Exception as exc:
                self.after(0, lambda: (_set_status("Lỗi tải trang"), messagebox.showerror("Lỗi", f"{exc}", parent=win)))

        volume_list.bind("<<ListboxSelect>>", lambda e: _enable_actions())
        threading.Thread(target=_fetch, daemon=True).start()

    def _wd_update_update_button_state(self):
        btn = getattr(self, "wd_update_button", None)
        if not btn:
            return
        diff = 0
        selected = getattr(self, "wd_selected_book", None)
        if selected and isinstance(self.wd_new_chapters, dict):
            val = self.wd_new_chapters.get(selected.get('id'))
            if isinstance(val, int):
                diff = val
        btn_state = tk.NORMAL if diff and diff > 0 else tk.DISABLED
        btn.config(state=btn_state)
        self._wd_update_delete_button_state()

    def _wd_update_delete_button_state(self):
        btn = getattr(self, "wd_delete_button", None)
        if not btn:
            return
        enabled = bool(getattr(self, "wd_selected_book", None))
        btn.config(state=tk.NORMAL if enabled else tk.DISABLED)
        note_btn = getattr(self, "wd_note_button", None)
        if note_btn:
            note_btn.config(state=tk.NORMAL if enabled else tk.DISABLED)
        ch_btn = getattr(self, "wd_chapter_list_btn", None)
        if ch_btn:
            ch_btn.config(state=tk.NORMAL if enabled else tk.DISABLED)

    # --- Ghi chú Wikidich ---
    def _wd_normalize_notes(self, raw):
        if not isinstance(raw, dict):
            return {}
        out = {}
        for key, val in raw.items():
            if key is None:
                continue
            try:
                bid = str(key).strip()
            except Exception:
                continue
            if not bid:
                continue
            if isinstance(val, dict):
                content = val.get("content", "")
                title = val.get("title", "")
            else:
                content = str(val)
                title = ""
            out[bid] = {"content": str(content or ""), "title": str(title or "")}
        return out

    def _wd_get_note_entry(self, book_id):
        if book_id is None:
            return None
        bid = str(book_id).strip()
        if not bid:
            return None
        if not isinstance(self.wikidich_notes, dict):
            self.wikidich_notes = {}
        return self.wikidich_notes.get(bid)

    def _wd_get_note_content(self, book_id):
        entry = self._wd_get_note_entry(book_id)
        if isinstance(entry, dict):
            return entry.get("content", "")
        return ""

    def _wd_global_notes_alive(self):
        try:
            return bool(self._wd_global_notes_win) and bool(self._wd_global_notes_win.winfo_exists())
        except Exception:
            return False

    def _wd_set_note(self, book_id, content: str, title: str = ""):
        if book_id is None:
            return
        bid = str(book_id).strip()
        if not bid:
            return
        text = (content or "").strip()
        if not isinstance(self.wikidich_notes, dict):
            self.wikidich_notes = {}
        if not text:
            # Không lưu ghi chú rỗng
            if bid in self.wikidich_notes:
                self.wikidich_notes.pop(bid, None)
            self.save_config()
            self._wd_refresh_global_notes_view()
            return
        entry = self.wikidich_notes.get(bid, {})
        entry["content"] = text
        if title:
            entry["title"] = title
        self.wikidich_notes[bid] = entry
        self.save_config()
        self._wd_refresh_global_notes_view()

    def _wd_delete_note(self, book_id):
        if book_id is None:
            return
        bid = str(book_id).strip()
        if not bid:
            return
        if isinstance(self.wikidich_notes, dict) and bid in self.wikidich_notes:
            self.wikidich_notes.pop(bid, None)
            self.save_config()
            self._wd_refresh_global_notes_view()

    def _wd_open_note_editor(self, book_id, title="", initial_text="", scope="local"):
        bid = str(book_id).strip() if book_id is not None else ""
        if not bid:
            messagebox.showinfo("Chưa xác định", "Không lấy được ID truyện.", parent=self)
            return
        win = tk.Toplevel(self)
        self._apply_window_icon(win)
        win.title("Ghi chú" + (" - Toàn cục" if scope == "global" else ""))
        win.geometry("520x360")
        try:
            win.focus_force()
            win.lift()
        except Exception:
            pass

        container = ttk.Frame(win, padding=10)
        container.pack(fill="both", expand=True)
        container.columnconfigure(0, weight=1)
        container.rowconfigure(1, weight=1)

        header = ttk.Frame(container)
        header.grid(row=0, column=0, sticky="ew")
        ttk.Label(header, text=f"ID: {bid}").pack(anchor="w")
        if title:
            ttk.Label(header, text=f"Tiêu đề: {title}").pack(anchor="w", pady=(2, 0))
        ttk.Label(
            header,
            text="Bấm Lưu (hoặc Ctrl+S) để ghi ngay vào config; Đóng sẽ hỏi lưu nếu có thay đổi."
        ).pack(anchor="w", pady=(6, 0))

        text_frame = ttk.Frame(container, padding=(0, 8, 0, 0))
        text_frame.grid(row=1, column=0, sticky="nsew")
        txt = scrolledtext.ScrolledText(text_frame, wrap=tk.WORD)
        txt.pack(fill="both", expand=True)
        initial_value = (initial_text or "").strip()
        if initial_text:
            txt.insert("1.0", initial_text)

        btn_frame = ttk.Frame(container)
        btn_frame.grid(row=2, column=0, sticky="e", pady=(10, 0))

        def _save():
            content = txt.get("1.0", tk.END).strip()
            self._wd_set_note(bid, content, title=title)
            win.destroy()

        def _close():
            current = txt.get("1.0", tk.END).strip()
            if current != initial_value:
                resp = messagebox.askyesnocancel("Lưu ghi chú?", "Lưu ghi chú trước khi đóng?", parent=win)
                if resp is None:
                    return
                if resp:
                    _save()
                    return
            win.destroy()

        def _delete():
            if not self._wd_get_note_entry(bid):
                win.destroy()
                return
            if messagebox.askyesno("Xóa ghi chú", "Bạn có chắc muốn xóa ghi chú này?", parent=win):
                self._wd_delete_note(bid)
                win.destroy()

        ttk.Button(btn_frame, text="Lưu", command=_save).pack(side=tk.RIGHT)
        ttk.Button(btn_frame, text="Xóa", command=_delete).pack(side=tk.RIGHT, padx=(0, 8))
        ttk.Button(btn_frame, text="Đóng", command=_close).pack(side=tk.RIGHT, padx=(0, 8))
        win.protocol("WM_DELETE_WINDOW", _close)
        def _hotkey_save(event=None):
            _save()
            return "break"
        win.bind("<Control-s>", _hotkey_save)

    def _wd_open_local_note(self):
        book = getattr(self, "wd_selected_book", None)
        if not book or not book.get("id"):
            messagebox.showinfo("Chưa chọn truyện", "Vui lòng chọn một truyện trước.", parent=self)
            return
        book_id = book.get("id")
        title = book.get("title", "")
        current = self._wd_get_note_content(book_id)
        self._wd_open_note_editor(book_id, title=title, initial_text=current, scope="local")

    def _wd_open_global_notes(self):
        try:
            if self._wd_global_notes_win and tk.Toplevel.winfo_exists(self._wd_global_notes_win):
                self._wd_global_notes_win.lift()
                self._wd_refresh_global_notes_view()
                return
        except Exception:
            pass

        win = tk.Toplevel(self)
        self._apply_window_icon(win)
        win.title("Ghi chú Wikidich (toàn cục)")
        win.geometry("720x480")
        self._wd_global_notes_win = win

        def _close():
            self._wd_global_notes_win = None
            win.destroy()
        win.protocol("WM_DELETE_WINDOW", _close)

        container = ttk.Frame(win, padding=10)
        container.pack(fill="both", expand=True)
        container.columnconfigure(0, weight=1)
        container.rowconfigure(1, weight=1)

        info = ttk.Label(container, text="Danh sách chỉ hiện ghi chú có nội dung. Chọn một mục để xem/sửa/xóa.")
        info.grid(row=0, column=0, sticky="w", pady=(0, 8))

        tree = ttk.Treeview(container, columns=("id", "title", "content"), show="headings", selectmode="browse")
        tree.heading("id", text="ID truyện")
        tree.heading("title", text="Tiêu đề")
        tree.heading("content", text="Nội dung (rút gọn)")
        tree.column("id", width=120, anchor="w")
        tree.column("title", width=200, anchor="w")
        tree.column("content", width=320, anchor="w")
        tree.grid(row=1, column=0, sticky="nsew")
        tree.bind("<<TreeviewSelect>>", self._wd_on_global_note_select)
        tree.bind("<Double-1>", lambda e: self._wd_edit_global_note())
        self._wd_notes_tree = tree

        scrollbar = ttk.Scrollbar(container, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.grid(row=1, column=1, sticky="ns")

        preview = scrolledtext.ScrolledText(container, height=6, wrap=tk.WORD, state="disabled")
        preview.grid(row=2, column=0, columnspan=2, sticky="nsew", pady=(10, 0))
        self._wd_notes_preview = preview

        btn_frame = ttk.Frame(container)
        btn_frame.grid(row=3, column=0, columnspan=2, sticky="e", pady=(10, 0))
        ttk.Button(btn_frame, text="Xem", command=self._wd_edit_global_note).pack(side=tk.RIGHT, padx=(6, 0))
        ttk.Button(btn_frame, text="Xóa", command=self._wd_delete_global_note).pack(side=tk.RIGHT, padx=(6, 0))
        ttk.Button(btn_frame, text="Đóng", command=_close).pack(side=tk.RIGHT)

        self._wd_refresh_global_notes_view()

    def _wd_on_global_note_select(self, event=None):
        if not self._wd_notes_tree or not self._wd_notes_preview or not self._wd_global_notes_alive():
            return
        sel = self._wd_notes_tree.selection()
        if not sel:
            content = ""
        else:
            item_id = sel[0]
            bid = self._wd_notes_tree.set(item_id, "id")
            entry = self._wd_get_note_entry(bid) or {}
            content = entry.get("content", "")
        self._wd_notes_preview.config(state="normal")
        self._wd_notes_preview.delete("1.0", tk.END)
        self._wd_notes_preview.insert("1.0", content)
        self._wd_notes_preview.config(state="disabled")

    def _wd_refresh_global_notes_view(self):
        tree = getattr(self, "_wd_notes_tree", None)
        if not tree or not self._wd_global_notes_alive():
            return
        try:
            for iid in tree.get_children():
                tree.delete(iid)
        except tk.TclError:
            return
        notes = self.wikidich_notes if isinstance(self.wikidich_notes, dict) else {}
        for bid, entry in notes.items():
            if not isinstance(entry, dict):
                continue
            content = (entry.get("content") or "").strip()
            if not content:
                continue
            title = entry.get("title") or ""
            short = content.replace("\n", " ")
            if len(short) > 120:
                short = short[:117] + "..."
            tree.insert("", "end", values=(bid, title, short))
        # Clear preview if không có selection
        self._wd_on_global_note_select()

    def _wd_edit_global_note(self):
        tree = getattr(self, "_wd_notes_tree", None)
        if not tree:
            return
        sel = tree.selection()
        if not sel:
            messagebox.showinfo("Chưa chọn", "Chọn một ghi chú để xem/sửa.", parent=self)
            return
        bid = tree.set(sel[0], "id")
        entry = self._wd_get_note_entry(bid) or {}
        self._wd_open_note_editor(bid, title=entry.get("title", ""), initial_text=entry.get("content", ""), scope="global")

    def _wd_delete_global_note(self):
        tree = getattr(self, "_wd_notes_tree", None)
        if not tree or not self._wd_global_notes_alive():
            return
        sel = tree.selection()
        if not sel:
            return
        bid = tree.set(sel[0], "id")
        parent = None
        try:
            if self._wd_global_notes_win and tk.Toplevel.winfo_exists(self._wd_global_notes_win):
                parent = self._wd_global_notes_win
        except Exception:
            parent = None
        if messagebox.askyesno("Xóa ghi chú", f"Xóa ghi chú cho ID {bid}?", parent=parent or self):
            self._wd_delete_note(bid)

    def _wd_open_folder_path(self, path: str, parent=None):
        if not path or not os.path.isdir(path):
            messagebox.showinfo("Không tìm thấy thư mục", "Thư mục không tồn tại.", parent=parent or self)
            return
        try:
            if sys.platform.startswith("win"):
                os.startfile(path)
            elif sys.platform.startswith("darwin"):
                subprocess.Popen(["open", path])
            else:
                subprocess.Popen(["xdg-open", path])
        except Exception as exc:
            messagebox.showerror("Mở thư mục", f"Lỗi: {exc}", parent=parent or self)

    # --- Liên kết toàn cục ---
    def _wd_global_links_alive(self):
        try:
            return bool(self._wd_global_links_win) and bool(self._wd_global_links_win.winfo_exists())
        except Exception:
            return False

    def _wd_open_global_links(self):
        try:
            if self._wd_global_links_win and tk.Toplevel.winfo_exists(self._wd_global_links_win):
                self._wd_global_links_win.lift()
                self._wd_refresh_global_links_view()
                return
        except Exception:
            pass
        win = tk.Toplevel(self)
        self._apply_window_icon(win)
        win.title("Liên kết thư mục (toàn cục)")
        win.geometry("720x400")
        self._wd_global_links_win = win
        container = ttk.Frame(win, padding=10)
        container.pack(fill="both", expand=True)
        container.columnconfigure(0, weight=1)
        container.rowconfigure(1, weight=1)
        ttk.Label(container, text="Danh sách liên kết theo ID truyện. Chọn một mục để đổi thư mục hoặc xóa.").grid(row=0, column=0, sticky="w")
        tree = ttk.Treeview(container, columns=("id", "title", "path"), show="headings", selectmode="browse")
        tree.heading("id", text="ID")
        tree.heading("title", text="Tiêu đề")
        tree.heading("path", text="Thư mục")
        tree.column("id", width=160, anchor="w")
        tree.column("title", width=220, anchor="w")
        tree.column("path", width=320, anchor="w")
        tree.grid(row=1, column=0, sticky="nsew", pady=(8, 0))
        tree.bind("<<TreeviewSelect>>", self._wd_on_global_link_select)
        tree.bind("<Double-1>", lambda e: self._wd_edit_global_link())
        self._wd_link_tree = tree
        scrollbar = ttk.Scrollbar(container, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.grid(row=1, column=1, sticky="ns", pady=(8, 0))
        btns = ttk.Frame(container)
        btns.grid(row=2, column=0, columnspan=2, sticky="e", pady=(10, 0))
        ttk.Button(btns, text="Chọn thư mục...", command=self._wd_edit_global_link).pack(side=tk.RIGHT)
        ttk.Button(btns, text="Mở thư mục", command=self._wd_open_link_folder).pack(side=tk.RIGHT, padx=(6, 0))
        ttk.Button(btns, text="Xóa liên kết", command=self._wd_delete_global_link).pack(side=tk.RIGHT, padx=(6, 0))
        ttk.Button(btns, text="Đóng", command=win.destroy).pack(side=tk.RIGHT, padx=(6, 0))
        self._wd_refresh_global_links_view()

    def _wd_refresh_global_links_view(self):
        tree = getattr(self, "_wd_link_tree", None)
        if not tree or not self._wd_global_links_alive():
            return
        for iid in tree.get_children():
            tree.delete(iid)
        links = self.wikidich_links if isinstance(self.wikidich_links, dict) else {}
        for bid, path in links.items():
            if not path:
                continue
            title = ""
            try:
                title = self.wikidich_data.get("books", {}).get(bid, {}).get("title", "")
            except Exception:
                title = ""
            tree.insert("", "end", values=(bid, title, path))

    def _wd_on_global_link_select(self, event=None):
        # placeholder for future highlight/preview if cần
        return

    def _wd_edit_global_link(self):
        tree = getattr(self, "_wd_link_tree", None)
        if not tree or not self._wd_global_links_alive():
            return
        sel = tree.selection()
        if not sel:
            messagebox.showinfo("Chưa chọn", "Chọn một liên kết để thay đổi.", parent=self._wd_global_links_win or self)
            return
        bid = tree.set(sel[0], "id")
        current = tree.set(sel[0], "path")
        initial = current or self.app_config.get("folder_path") or BASE_DIR
        path = filedialog.askdirectory(title=f"Chọn thư mục cho ID {bid}", initialdir=initial)
        if not path:
            return
        self._wd_set_linked_folder(bid, path)
        self._wd_refresh_global_links_view()
        # nếu đang xem truyện này thì cập nhật UI
        sel_book = getattr(self, "wd_selected_book", None)
        if sel_book and sel_book.get("id") == bid:
            self._wd_update_link_ui(sel_book)
        self.log(f"[Wikidich] Cập nhật liên kết (global) cho {bid}: {path}")

    def _wd_delete_global_link(self):
        tree = getattr(self, "_wd_link_tree", None)
        if not tree or not self._wd_global_links_alive():
            return
        sel = tree.selection()
        if not sel:
            return
        bid = tree.set(sel[0], "id")
        if messagebox.askyesno("Xóa liên kết", f"Xóa liên kết của ID {bid}?", parent=self._wd_global_links_win or self):
            if isinstance(self.wikidich_links, dict):
                self.wikidich_links.pop(bid, None)
            # không đụng tới dữ liệu truyện; lưu config
            self.save_config()
            self._wd_refresh_global_links_view()
            if getattr(self, "wd_selected_book", None) and self.wd_selected_book.get("id") == bid:
                self._wd_update_link_ui(self.wd_selected_book)
            self.log(f"[Wikidich] Đã xóa liên kết (global) cho {bid}")

    def _wd_open_link_folder(self):
        tree = getattr(self, "_wd_link_tree", None)
        if not tree or not self._wd_global_links_alive():
            return
        sel = tree.selection()
        if not sel:
            return
        path = tree.set(sel[0], "path")
        self._wd_open_folder_path(path, parent=self._wd_global_links_win or self)

    # --- Danh sách chương ---
    def _wd_set_chapter_status(self, text):
        if self._wd_chapter_status:
            self._wd_chapter_status.config(text=text or "")

    def _wd_set_chapter_buttons_state(self, enabled: bool):
        state = tk.NORMAL if enabled else tk.DISABLED
        for btn in self._wd_chapter_buttons.values():
            if btn:
                btn.config(state=state)

    def _wd_ensure_chapter_window(self, book_title=""):
        try:
            if self._wd_chapter_win and tk.Toplevel.winfo_exists(self._wd_chapter_win):
                if hasattr(self, "_wd_chapter_book_label"):
                    self._wd_chapter_book_label.config(text=book_title or self._wd_chapter_book_label.cget("text"))
                return self._wd_chapter_win
        except Exception:
            pass
        win = tk.Toplevel(self)
        self._apply_window_icon(win)
        win.title("Danh sách chương")
        win.geometry("720x520")
        win.columnconfigure(0, weight=1)
        win.rowconfigure(2, weight=1)
        win.protocol("WM_DELETE_WINDOW", self._wd_close_chapter_window)

        header = ttk.Frame(win, padding=10)
        header.grid(row=0, column=0, sticky="ew")
        self._wd_chapter_book_label = ttk.Label(header, text=book_title or "Chưa chọn truyện", font=("Segoe UI", 11, "bold"))
        self._wd_chapter_book_label.pack(anchor="w")
        self._wd_chapter_status = ttk.Label(header, text="")
        self._wd_chapter_status.pack(anchor="w", pady=(4, 0))

        tree = ttk.Treeview(win, columns=("num", "title"), show="headings")
        tree.heading("num", text="#")
        tree.heading("title", text="Tiêu đề")
        tree.column("num", width=70, anchor="w")
        tree.column("title", width=520, anchor="w")
        tree.grid(row=2, column=0, sticky="nsew", padx=10, pady=(0, 10))
        tree.bind("<<TreeviewSelect>>", self._wd_on_chapter_select)
        tree.bind("<Double-1>", lambda e: self._wd_view_selected_chapter())
        self._wd_chapter_tree = tree
        scrollbar = ttk.Scrollbar(win, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.grid(row=2, column=1, sticky="ns", pady=(0, 10))

        btn_frame = ttk.Frame(win, padding=(10, 0, 10, 10))
        btn_frame.grid(row=3, column=0, columnspan=2, sticky="e")
        view_btn = ttk.Button(btn_frame, text="Xem", command=self._wd_view_selected_chapter, state=tk.DISABLED)
        edit_btn = ttk.Button(btn_frame, text="Sửa", command=self._wd_edit_selected_chapter, state=tk.DISABLED)
        refresh_btn = ttk.Button(btn_frame, text="Tải lại", command=self._wd_open_chapter_list)
        close_btn = ttk.Button(btn_frame, text="Đóng", command=self._wd_close_chapter_window)
        view_btn.pack(side=tk.RIGHT)
        edit_btn.pack(side=tk.RIGHT, padx=(6, 0))
        refresh_btn.pack(side=tk.RIGHT, padx=(6, 0))
        close_btn.pack(side=tk.RIGHT, padx=(6, 0))
        self._wd_chapter_buttons = {"view": view_btn, "edit": edit_btn, "refresh": refresh_btn}
        self._wd_chapter_win = win
        self._wd_set_chapter_buttons_state(False)
        return win

    def _wd_open_chapter_list(self):
        book = getattr(self, "wd_selected_book", None)
        if not book or not book.get("id"):
            messagebox.showinfo("Chưa chọn truyện", "Vui lòng chọn một truyện trước.", parent=self)
            return
        title = book.get("title", book.get("id"))
        self._wd_ensure_chapter_window(title)
        self._wd_set_chapter_status("Đang tải danh sách chương...")
        self._wd_set_chapter_buttons_state(False)
        threading.Thread(target=self._wd_fetch_chapter_list_worker, args=(book,), daemon=True).start()

    def _wd_render_chapter_list(self, chapters: list, book_title: str):
        tree = getattr(self, "_wd_chapter_tree", None)
        if not tree:
            return
        for iid in tree.get_children():
            tree.delete(iid)
        self._wd_chapter_data = []
        for idx, ch in enumerate(chapters):
            iid = f"ch{idx}"
            tree.insert("", "end", iid=iid, values=(ch.get("number"), ch.get("title", "")))
            self._wd_chapter_data.append((iid, ch))
        if hasattr(self, "_wd_chapter_book_label"):
            self._wd_chapter_book_label.config(text=book_title or self._wd_chapter_book_label.cget("text"))
        self._wd_set_chapter_status(f"Đã tải {len(chapters)} chương.")
        self._wd_set_chapter_buttons_state(bool(chapters))

    def _wd_on_chapter_select(self, event=None):
        tree = getattr(self, "_wd_chapter_tree", None)
        if not tree:
            return
        sel = tree.selection()
        has = bool(sel)
        if self._wd_chapter_buttons.get("view"):
            self._wd_chapter_buttons["view"].config(state=tk.NORMAL if has else tk.DISABLED)
        if self._wd_chapter_buttons.get("edit"):
            self._wd_chapter_buttons["edit"].config(state=tk.NORMAL if has else tk.DISABLED)

    def _wd_close_chapter_window(self):
        try:
            if self._wd_chapter_win and tk.Toplevel.winfo_exists(self._wd_chapter_win):
                self._wd_chapter_win.destroy()
        except Exception:
            pass
        self._wd_chapter_win = None
        self._wd_chapter_tree = None
        self._wd_chapter_status = None
        self._wd_chapter_data = []
        self._wd_chapter_buttons = {}

    def _wd_get_selected_chapter(self):
        tree = getattr(self, "_wd_chapter_tree", None)
        if not tree:
            return None
        sel = tree.selection()
        if not sel:
            return None
        iid = sel[0]
        for stored_iid, ch in self._wd_chapter_data:
            if stored_iid == iid:
                return ch
        return None

    def _wd_fetch_chapter_list_worker(self, book: dict):
        session, current_user, proxies = self._wd_build_wiki_session(include_user=True)
        if not session:
            self.after(0, lambda: self._wd_set_chapter_status("Không đọc được cookie Wikidich."))
            return
        try:
            updated, chapters = wikidich_ext.fetch_book_chapters(
                session,
                {**book, "url": self._wd_normalize_url_for_site(book.get("url", ""))},
                current_user or "",
                base_url=self._wd_get_base_url(),
                proxies=proxies
            )
            # Đánh lại số thứ tự chương theo thứ tự server (1..n) từ trên xuống
            if isinstance(chapters, list):
                for idx, ch in enumerate(chapters, start=1):
                    ch["number"] = idx
            bid = book.get("id")
            old_chapters = 0
            try:
                old_chapters = int(book.get("chapters") or 0)
            except Exception:
                old_chapters = 0
            new_chapters_count = 0
            try:
                new_chapters_count = int(updated.get("chapters") or 0)
            except Exception:
                new_chapters_count = 0
            if not new_chapters_count and isinstance(chapters, list):
                new_chapters_count = len(chapters)
            delta_new = max(0, new_chapters_count - old_chapters)
            if bid and delta_new > 0 and isinstance(self.wd_new_chapters, dict):
                try:
                    current_new = int(self.wd_new_chapters.get(bid, 0) or 0)
                except Exception:
                    current_new = 0
                remaining_new = current_new - delta_new
                if remaining_new > 0:
                    self.wd_new_chapters[bid] = remaining_new
                else:
                    self.wd_new_chapters.pop(bid, None)
            if bid:
                self.wikidich_data['books'][bid] = updated
            # Cập nhật UI chi tiết nếu vẫn đang chọn truyện này
            def _apply():
                sel = getattr(self, "wd_selected_book", None)
                if sel and sel.get("id") == bid:
                    self._wd_show_detail(updated)
                # Làm mới bảng danh sách để phản ánh chi tiết mới
                if hasattr(self, "wikidich_filtered"):
                    self._wd_refresh_tree(getattr(self, "wikidich_filtered", []))
                    if bid and hasattr(self, "wd_tree"):
                        for item_id, stored_bid in getattr(self, "_wd_tree_index", {}).items():
                            if stored_bid == bid:
                                try:
                                    self.wd_tree.selection_set(item_id)
                                    self.wd_tree.see(item_id)
                                except Exception:
                                    pass
                                break
                self._wd_render_chapter_list(chapters, updated.get("title", bid))
                self._wd_update_delete_button_state()
                self._wd_save_cache()
            self.after(0, _apply)
        except Exception as exc:
            self.log(f"[Wikidich] Lỗi tải danh sách chương: {exc}")
            self.after(0, lambda: self._wd_set_chapter_status(f"Lỗi: {exc}"))

    def _wd_view_selected_chapter(self):
        chapter = self._wd_get_selected_chapter()
        if not chapter:
            messagebox.showinfo("Chưa chọn chương", "Chọn một chương trước.", parent=self._wd_chapter_win or self)
            return
        self._wd_set_chapter_status(f"Đang tải nội dung chương {chapter.get('number') or ''}...")
        self._wd_set_chapter_buttons_state(False)
        threading.Thread(target=self._wd_fetch_chapter_content_worker, args=(chapter,), daemon=True).start()

    def _wd_fetch_chapter_content_worker(self, chapter: dict):
        session, _user, proxies = self._wd_build_wiki_session(include_user=False)
        if not session:
            self.after(0, lambda: self._wd_set_chapter_status("Không đọc được cookie để tải nội dung chương."))
            return
        try:
            content = wikidich_ext.fetch_chapter_content(
                session,
                self._wd_normalize_url_for_site(chapter.get("url", "")),
                base_url=self._wd_get_base_url(),
                proxies=proxies
            )
            text = content.get("text", "")
            html = content.get("html", "")
            self.after(0, lambda: self._wd_show_chapter_content(chapter, text, html))
        except Exception as exc:
            self.log(f"[Wikidich] Lỗi tải nội dung chương: {exc}")
            self.after(0, lambda: self._wd_set_chapter_status(f"Lỗi: {exc}"))
        finally:
            self.after(0, lambda: self._wd_set_chapter_buttons_state(True))

    def _wd_show_chapter_content(self, chapter: dict, text: str, html: str):
        win = tk.Toplevel(self)
        self._apply_window_icon(win)
        num = chapter.get("number")
        win.title(f"Chương {num} - {chapter.get('title', '')}")
        win.geometry("720x520")
        frame = ttk.Frame(win, padding=10)
        frame.pack(fill="both", expand=True)
        ttk.Label(frame, text=f"{chapter.get('title', '')}").pack(anchor="w")
        txt = scrolledtext.ScrolledText(frame, wrap=tk.WORD)
        txt.pack(fill="both", expand=True, pady=(8, 0))
        txt.insert("1.0", text or html or "(Không có nội dung)")
        txt.config(state="disabled")

    def _wd_edit_selected_chapter(self):
        chapter = self._wd_get_selected_chapter()
        if not chapter:
            messagebox.showinfo("Chưa chọn chương", "Chọn một chương trước.", parent=self._wd_chapter_win or self)
            return
        url = (self._wd_normalize_url_for_site(chapter.get("url")) or "").split("#")[0]
        if not url:
            return
        edit_url = url.rstrip("/") + "/chinh-sua"
        self._wd_open_edit_modal(chapter, edit_url)

    def _wd_open_edit_modal(self, chapter: dict, edit_url: str):
        session, _user, proxies = self._wd_build_wiki_session(include_user=False)
        if not session:
            messagebox.showinfo("Thiếu cookie", "Hãy mở trình duyệt tích hợp và đăng nhập Wikidich trước khi sửa chương.", parent=self._wd_chapter_win or self)
            return
        edit_url = self._wd_normalize_url_for_site(edit_url)
        win = tk.Toplevel(self)
        self._apply_window_icon(win)
        num = chapter.get("number")
        win.title(f"Sửa chương {num}")
        win.geometry("720x520")
        win.columnconfigure(0, weight=1)
        win.rowconfigure(2, weight=1)

        header = ttk.Frame(win, padding=10)
        header.grid(row=0, column=0, sticky="ew")
        ttk.Label(header, text=f"Chương: {num} - {chapter.get('title', '')}", font=("Segoe UI", 11, "bold")).pack(anchor="w")
        status_lbl = ttk.Label(header, text="Đang tải nội dung...")
        status_lbl.pack(anchor="w", pady=(4, 0))

        form = ttk.Frame(win, padding=(10, 0, 10, 0))
        form.grid(row=1, column=0, sticky="ew")
        form.columnconfigure(1, weight=1)
        ttk.Label(form, text="Tên (CN):").grid(row=0, column=0, sticky="w")
        name_var = tk.StringVar()
        name_entry = ttk.Entry(form, textvariable=name_var)
        name_entry.grid(row=0, column=1, sticky="ew", padx=(6, 0))

        content_frame = ttk.Frame(win, padding=10)
        content_frame.grid(row=2, column=0, sticky="nsew")
        content_frame.rowconfigure(0, weight=1)
        content_frame.columnconfigure(0, weight=1)
        content_text = scrolledtext.ScrolledText(content_frame, wrap=tk.WORD)
        content_text.grid(row=0, column=0, sticky="nsew")

        btn_frame = ttk.Frame(win, padding=10)
        btn_frame.grid(row=3, column=0, sticky="e")
        save_btn = ttk.Button(btn_frame, text="Lưu", state=tk.DISABLED)
        close_btn = ttk.Button(btn_frame, text="Đóng", command=win.destroy)
        save_btn.pack(side=tk.RIGHT)
        close_btn.pack(side=tk.RIGHT, padx=(6, 0))

        def _fill(data: dict):
            if not win.winfo_exists():
                return
            name_var.set(data.get("name_cn", ""))
            content_text.delete("1.0", tk.END)
            content_text.insert("1.0", data.get("content_cn", ""))
            save_btn.config(state=tk.NORMAL)
            status_lbl.config(text="Đã tải. Sửa và bấm Lưu để cập nhật.")
            try:
                name_entry.focus_set()
            except Exception:
                pass

        def _load_error(msg):
            if not win.winfo_exists():
                return
            status_lbl.config(text=msg)
            save_btn.config(state=tk.DISABLED)

        def _save_done(ok: bool, msg: str):
            if not win.winfo_exists():
                return
            save_btn.config(state=tk.NORMAL)
            status_lbl.config(text=msg)
            if ok:
                messagebox.showinfo("Đã lưu", "Lưu chương thành công.", parent=win)

        def _do_load():
            try:
                data = wikidich_ext.fetch_chapter_edit(session, edit_url, proxies=proxies)
                self.after(0, lambda: _fill(data))
            except Exception as exc:
                self.after(0, lambda: _load_error(f"Lỗi tải form: {exc}"))

        def _do_save():
            save_btn.config(state=tk.DISABLED)
            status_lbl.config(text="Đang lưu...")
            name = name_var.get()
            content = content_text.get("1.0", tk.END)
            def _worker():
                try:
                    wikidich_ext.save_chapter_edit(session, edit_url, name, content, proxies=proxies)
                    self.after(0, lambda: _save_done(True, "Đã lưu thành công."))
                except Exception as exc:
                    self.after(0, lambda: _save_done(False, f"Lỗi lưu: {exc}"))
            threading.Thread(target=_worker, daemon=True).start()

        save_btn.config(command=_do_save)
        threading.Thread(target=_do_load, daemon=True).start()

    # --- Liên kết thư mục + tự chọn ---
    def _wd_change_auto_mode(self, mode: str):
        if mode not in ("extract_then_pick", "pick_latest"):
            mode = "extract_then_pick"
        self.wikidich_auto_pick_mode = mode
        if hasattr(self, "wd_auto_mode_var"):
            label = self._wd_mode_labels.get(mode, mode) if hasattr(self, "_wd_mode_labels") else mode
            self.wd_auto_mode_var.set(label)
        self.save_config()

    def _wd_get_linked_folder(self, book=None) -> str:
        book = book or getattr(self, "wd_selected_book", None)
        bid = (book or {}).get("id")
        if bid and isinstance(self.wikidich_links, dict):
            val = self.wikidich_links.get(bid)
            if val:
                return val
        return (book or {}).get("linked_folder", "") or ""

    def _wd_set_linked_folder(self, book_id: str, path: str):
        if not book_id:
            return
        if not isinstance(self.wikidich_links, dict):
            self.wikidich_links = {}
        self.wikidich_links[book_id] = path
        # Ghi vào book hiện tại (runtime) để hiển thị tức thời, nhưng lưu chính ở config
        books = self.wikidich_data.get("books", {})
        if isinstance(books, dict) and book_id in books:
            books[book_id]["linked_folder"] = path
        self._wd_save_cache()
        self.save_config()

    def _wd_update_link_ui(self, book=None):
        path = self._wd_get_linked_folder(book)
        if hasattr(self, "wd_link_path_var"):
            self.wd_link_path_var.set(path if path else "Chưa liên kết")
        if hasattr(self, "wd_auto_pick_btn"):
            self.wd_auto_pick_btn.config(state=tk.NORMAL if path else tk.DISABLED)
        if hasattr(self, "wd_open_link_btn"):
            self.wd_open_link_btn.config(state=tk.NORMAL if path else tk.DISABLED)
        if hasattr(self, "wd_download_btn"):
            self.wd_download_btn.config(state=tk.NORMAL if path else tk.DISABLED)

    def _wd_choose_link_folder(self):
        book = getattr(self, "wd_selected_book", None)
        if not book or not book.get("id"):
            messagebox.showinfo("Chưa chọn truyện", "Chọn một truyện trước.", parent=self)
            return
        initial = self._wd_get_linked_folder(book) or self.app_config.get("folder_path") or BASE_DIR
        path = filedialog.askdirectory(title="Chọn thư mục liên kết", initialdir=initial)
        if not path:
            return
        self._wd_set_linked_folder(book.get("id"), path)
        self._wd_update_link_ui(book)
        self.log(f"[Wikidich] Liên kết truyện '{book.get('title', book.get('id'))}' với thư mục: {path}")
        self._wd_refresh_global_links_view()

    def _wd_open_current_linked_folder(self):
        book = getattr(self, "wd_selected_book", None)
        if not book or not book.get("id"):
            messagebox.showinfo("Chưa chọn truyện", "Chọn một truyện trước.", parent=self)
            return
        path = self._wd_get_linked_folder(book)
        if not path:
            messagebox.showinfo("Chưa liên kết", "Truyện chưa có thư mục liên kết.", parent=self)
            return
        self._wd_open_folder_path(path, parent=self)

    def _wd_open_nd5_with_linked(self):
        """Mở Download Novel 5 với thư mục lưu là thư mục liên kết hiện tại (không lưu vào config)."""
        book = getattr(self, "wd_selected_book", None)
        if not book or not book.get("id"):
            messagebox.showinfo("Chưa chọn truyện", "Chọn một truyện trước.", parent=self)
            return
        path = self._wd_get_linked_folder(book)
        if not path or not os.path.isdir(path):
            messagebox.showinfo("Chưa liên kết", "Truyện chưa có thư mục liên kết hoặc thư mục không tồn tại.", parent=self)
            return
        # Nếu có link Fanqie dùng để kiểm tra update, điền sẵn vào ô URL
        prefill_url = None
        fanqie_link = self._wd_get_fanqie_link(book)
        if fanqie_link:
            prefill_url = fanqie_link
        self._open_fanqie_downloader(out_dir_override=path, prefill_url=prefill_url)

    def _wd_auto_pick_linked(self):
        book = getattr(self, "wd_selected_book", None)
        if not book or not book.get("id"):
            messagebox.showinfo("Chưa chọn truyện", "Chọn một truyện trước.", parent=self)
            return
        link_path = self._wd_get_linked_folder(book)
        if not link_path or not os.path.isdir(link_path):
            messagebox.showinfo("Chưa liên kết", "Thiếu thư mục liên kết hoặc thư mục không tồn tại.", parent=self)
            return
        mode = getattr(self, "wikidich_auto_pick_mode", "extract_then_pick")
        if hasattr(self, "wd_auto_pick_btn"):
            self.wd_auto_pick_btn.config(state=tk.DISABLED)
        self.log(f"[Wikidich] Tự chọn từ liên kết ({mode}) cho '{book.get('title', book.get('id'))}'...")

        def _worker():
            try:
                target_dir = None
                if mode == "extract_then_pick":
                    target_dir = self._wd_extract_latest_archive(link_path)
                else:
                    target_dir = self._wd_pick_latest_subdir(link_path)
                if not target_dir:
                    raise ValueError("Không tìm thấy thư mục phù hợp.")
                msg = f"Đã chọn thư mục: {target_dir}"
                self.after(0, lambda: self._wd_apply_auto_pick_result(target_dir, msg))
            except Exception as exc:
                self.log(f"[Wikidich] Lỗi tự chọn: {exc}")
                self.after(0, lambda: messagebox.showerror("Chọn tự động", f"Lỗi: {exc}", parent=self))
            finally:
                self.after(0, lambda: self.wd_auto_pick_btn.config(state=tk.NORMAL))

        threading.Thread(target=_worker, daemon=True).start()

    def _wd_extract_latest_archive(self, link_path: str) -> str:
        # Lấy file nén mới nhất
        exts = {".zip", ".rar", ".7z", ".tar", ".gz", ".tgz", ".bz2", ".xz"}
        candidates = []
        for name in os.listdir(link_path):
            full = os.path.join(link_path, name)
            if os.path.isfile(full) and os.path.splitext(name)[1].lower() in exts:
                candidates.append((os.path.getmtime(full), full))
        if not candidates:
            raise ValueError("Không tìm thấy file nén phù hợp trong thư mục liên kết.")
        candidates.sort(key=lambda x: x[0], reverse=True)
        archive_path = candidates[0][1]
        # Tìm số thư mục kế tiếp
        max_idx = 0
        for name in os.listdir(link_path):
            full = os.path.join(link_path, name)
            if os.path.isdir(full) and name.isdigit():
                try:
                    max_idx = max(max_idx, int(name))
                except Exception:
                    pass
        next_num = max_idx + 1 if max_idx >= 0 else 1
        while True:
            next_dir = os.path.join(link_path, str(next_num))
            if not os.path.exists(next_dir):
                break
            next_num += 1
        try:
            self._extract_archive_to(archive_path, next_dir)
        except Exception as exc:
            raise RuntimeError(f"Lỗi giải nén: {exc}")
        return next_dir

    def _wd_pick_latest_subdir(self, link_path: str) -> str:
        dirs = []
        for name in os.listdir(link_path):
            full = os.path.join(link_path, name)
            if os.path.isdir(full):
                dirs.append((os.path.getmtime(full), full))
        if not dirs:
            raise ValueError("Không tìm thấy thư mục con trong liên kết.")
        dirs.sort(key=lambda x: x[0], reverse=True)
        return dirs[0][1]

    def _wd_apply_auto_pick_result(self, target_dir: str, message: str):
        self.folder_path.set(target_dir)
        self.log(f"[Wikidich] {message}")
        messagebox.showinfo("Chọn tự động", f"{message}\nSẽ chuyển sang tab Đổi Tên.", parent=self)
        self.schedule_preview_update(None)
        self._select_tab_by_name("Đổi Tên")


    def _wd_open_update_dialog(self):
        selected = getattr(self, "wd_selected_book", None)
        if not selected:
            messagebox.showinfo("Chưa chọn truyện", "Vui lòng chọn một truyện trước.", parent=self)
            return
        book_id = selected.get('id')
        if not book_id:
            messagebox.showinfo("Thiếu dữ liệu", "Không xác định được truyện.", parent=self)
            return
        current_new = 0
        if isinstance(self.wd_new_chapters, dict):
            try:
                val = int(self.wd_new_chapters.get(book_id, 0))
                if val > 0:
                    current_new = val
            except Exception:
                current_new = 0
        if current_new <= 0:
            messagebox.showinfo("Không có chương mới", "Không có số chương mới trong cột New.", parent=self)
            return

        prompt = f"Nhập số chương bổ sung (1-{current_new}):"
        result = simpledialog.askstring("Cập nhật chương", prompt, parent=self)
        if result is None:
            return
        try:
            delta = int(result.strip())
        except Exception:
            messagebox.showerror("Giá trị không hợp lệ", "Vui lòng nhập số nguyên dương.", parent=self)
            return
        if delta <= 0 or delta > current_new:
            messagebox.showerror("Giá trị không hợp lệ", f"Số chương phải trong khoảng 1-{current_new}.", parent=self)
            return

        # Cộng số chương, trừ cột New
        try:
            current_chapters = int(selected.get('chapters') or 0)
        except Exception:
            current_chapters = 0
        new_total = current_chapters + delta

        remaining_new = current_new - delta
        if remaining_new > 0:
            self.wd_new_chapters[book_id] = remaining_new
        else:
            self.wd_new_chapters.pop(book_id, None)

        # Cập nhật dữ liệu nguồn (số chương + ngày cập nhật)
        selected['chapters'] = new_total
        now = datetime.utcnow()
        updated_iso = now.strftime("%Y-%m-%d")
        updated_text = now.strftime("%d-%m-%Y")
        updated_ts = int(now.timestamp() * 1000)
        selected['updated_text'] = updated_text
        selected['updated_iso'] = updated_iso
        selected['updated_ts'] = updated_ts
        if isinstance(self.wikidich_data.get('books'), dict) and book_id in self.wikidich_data['books']:
            self.wikidich_data['books'][book_id]['chapters'] = new_total
            self.wikidich_data['books'][book_id]['updated_text'] = updated_text
            self.wikidich_data['books'][book_id]['updated_iso'] = updated_iso
            self.wikidich_data['books'][book_id]['updated_ts'] = updated_ts
        self._wd_save_cache()

        # Làm mới hiển thị và giữ chọn truyện hiện tại
        filtered = list(getattr(self, "wikidich_filtered", []) or [])
        self._wd_refresh_tree(filtered)
        for item_id, bid in getattr(self, "_wd_tree_index", {}).items():
            if bid == book_id:
                self.wd_tree.selection_set(item_id)
                self._wd_on_select()
                break
        self._wd_update_delete_button_state()

    def _wd_start_fetch_works(self):
        if self._wd_loading:
            messagebox.showinfo("Đang chạy", "Đang có tác vụ Wikidich khác đang chạy.")
            return
        self._wd_cancel_requested = False
        threading.Thread(target=self._wd_fetch_works_worker, daemon=True).start()

    def _wd_merge_book_data(self, server_book: dict, local_book: dict) -> dict:
        merged = dict(server_book or {})
        if not local_book:
            return merged
        keep_fields = [
            "summary",
            "summary_norm",
            "collections",
            "flags",
            "extra_links",
            "chapters",
            "stats",
            "cover_url",
            "updated_text",
            "updated_iso",
            "updated_ts",
            "collected_at",
        ]
        for key in keep_fields:
            val = local_book.get(key)
            if val:
                merged[key] = val
        return merged

    def _wd_precheck_works(self, meta_total: int, meta_latest: str) -> Optional[str]:
        local_ids = list((self.wikidich_data or {}).get("book_ids") or [])
        if not local_ids:
            return "full_reset"
        local_count = len(local_ids)
        if meta_total:
            if meta_total > local_count:
                return "auto_more"
            if meta_total < local_count:
                # server ít hơn local
                if meta_latest and meta_latest == local_ids[0]:
                    choice = self._wd_sync_prompt(lambda: messagebox.askyesnocancel(
                        "Phát hiện truyện bị xóa",
                        f"Có vẻ đã xóa {local_count - meta_total} truyện trên server.\n"
                        "Yes: Để hệ thống tự quét đối chiếu.\n"
                        "No: Dừng để bạn tự xử lý local.\n"
                        "Cancel: Dừng.",
                        parent=self
                    ))
                    if choice is None:
                        return None
                    if choice:
                        return "auto_less_same_top"
                    return None
                resp = self._wd_sync_prompt(lambda: simpledialog.askstring(
                    "Thay đổi thứ tự/truyện bị xóa",
                    "Server ít truyện hơn và truyện mới nhất khác.\n"
                    "1: Hệ thống tự quét đối chiếu\n"
                    "2: Tải lại từ đầu\n"
                    "3: Dừng để tự xử lý\n"
                    "Nhập 1/2/3:",
                    parent=self
                ))
                if not resp or resp.strip() not in ("1", "2", "3"):
                    return None
                resp = resp.strip()
                if resp == "3":
                    return None
                if resp == "2":
                    return "full_reset"
                return "auto_less_diff_top"
        if not meta_latest:
            return "full_reset"
        local_latest = local_ids[0]
        if local_latest == meta_latest:
            choice = self._wd_sync_prompt(lambda: messagebox.askyesnocancel(
                "Giữ dữ liệu chi tiết?",
                "Số truyện không đổi và truyện mới nhất trùng.\n"
                "Yes: Tải lại từ đầu (xóa dữ liệu chi tiết cũ).\n"
                "No: Chỉ ghi đè dữ liệu vừa tải, giữ chi tiết đã có.\n"
                "Cancel: Dừng tải Works.",
                parent=self
            ))
            if choice is None:
                return None
            return "full_reset" if choice else "merge_keep_details"
        resp = self._wd_sync_prompt(lambda: simpledialog.askstring(
            "Phát hiện thay đổi thứ tự",
            "Số truyện không đổi nhưng truyện mới nhất khác.\n"
            "1: Hệ thống tự quét (tìm và xóa truyện bị xóa, giữ thứ tự server)\n"
            "2: Tải lại từ đầu\n"
            "3: Dừng để tự xử lý\n"
            "Nhập 1/2/3:",
            parent=self
        ))
        if not resp or resp.strip() not in ("1", "2", "3"):
            return None
        resp = resp.strip()
        if resp == "3":
            return "manual_less_stop"
        if resp == "2":
            return "full_reset"
        return "autodiff"

    def _wd_is_book_deleted_on_server(self, url: str, proxies=None) -> bool:
        try:
            resp = requests.get(url, timeout=20, proxies=proxies, allow_redirects=True)
            if resp.status_code == 404:
                return True
            html = resp.text or ""
            # Parse HTML để kiểm tra đúng block thông báo "Truyện không tồn tại."
            try:
                doc = BeautifulSoup(html, "html.parser")
                center_block = doc.select_one("main .container .center-align")
                if center_block:
                    for p in center_block.find_all("p"):
                        text = p.get_text(strip=True)
                        if text.lower() == "truyện không tồn tại.":
                            return True
            except Exception as parse_exc:
                self.log(f"[Wikidich] Lỗi phân tích HTML khi kiểm tra xóa: {parse_exc}")
        except Exception as exc:
            self.log(f"[Wikidich] Kiểm tra xóa thất bại: {exc}")
        return False

    def _wd_log_cloudflare_detection(self, resp: requests.Response, marker: str):
        try:
            url = getattr(resp, "url", "")
            status = getattr(resp, "status_code", "")
            snippet = ((resp.text or "")[:500] or "").replace("\n", " ").strip()
            ua = getattr(resp.request, "headers", {}).get("User-Agent", "")
            referer = getattr(resp.request, "headers", {}).get("Referer", "")
            accept = getattr(resp.request, "headers", {}).get("Accept", "")
            self.log(f"[Wikidich] Cloudflare? status={status} marker='{marker}' url={url} ua='{ua}' referer='{referer}' accept='{accept}' snippet='{snippet}'")
        except Exception:
            pass

    def _wd_detect_cloudflare(self, resp: requests.Response) -> bool:
        if resp is None:
            return False
        status = resp.status_code
        text = (resp.text or "").lower()
        markers = [
            "cf-browser-verification",
            "__cf_chl",
            "attention required",
            "just a moment",
            "please enable cookies",
            "ray id",
            "cf-error-code",
        ]
        if status in (403, 429, 503, 520):
            marker_hit = next((m for m in markers if m in text), f"status-{status}")
            self._wd_log_cloudflare_detection(resp, marker_hit)
            return True
        # Với 200, chỉ coi là CF nếu thấy marker đặc trưng
        marker_hit = next((m for m in markers if m in text), None)
        if marker_hit:
            self._wd_log_cloudflare_detection(resp, marker_hit)
            return True
        return False

    def _wd_pause_for_cloudflare(self, url: str):
        self._wd_set_progress("Tạm dừng: cần vượt Cloudflare", 0, 0)
        self.log("[Wikidich] Bị Cloudflare chặn. Yêu cầu người dùng vượt chướng ngại.")
        messagebox.showinfo(
            "Cloudflare",
            "Đang bị Cloudflare chặn. Hãy mở trình duyệt tích hợp để vượt xác thực, sau đó đóng trình duyệt và nhấn Tải Works/Tải chi tiết lại.",
            parent=self
        )
        self._open_in_app_browser(url)

    def _wd_delete_book(self):
        selected = getattr(self, "wd_selected_book", None)
        if not selected:
            return
        book_id = selected.get("id")
        url = selected.get("url")
        if not book_id or not url:
            messagebox.showwarning("Thiếu dữ liệu", "Không xác định được truyện để xóa.", parent=self)
            return
        confirm = messagebox.askyesno(
            "Xóa truyện khỏi dữ liệu local",
            "Chỉ xóa khi truyện thực sự đã bị xóa trên server.\nTiếp tục kiểm tra?",
            parent=self
        )
        if not confirm:
            return
        proxies = self._get_proxy_for_request('fetch_titles')
        if not self._wd_is_book_deleted_on_server(url, proxies=proxies):
            messagebox.showinfo("Chưa xóa trên server", "Trang truyện vẫn tồn tại, không thể xóa trên local.", parent=self)
            return
        # Xóa khỏi dữ liệu local
        ids = list(self.wikidich_data.get("book_ids") or [])
        if book_id in ids:
            ids.remove(book_id)
        self.wikidich_data["book_ids"] = ids
        self.wikidich_data.get("books", {}).pop(book_id, None)
        if isinstance(self.wd_new_chapters, dict):
            self.wd_new_chapters.pop(book_id, None)
        self._wd_save_cache()
        self.log(f"[Wikidich] Đã xóa truyện khỏi local: {selected.get('title', book_id)}")
        filtered = list(getattr(self, "wikidich_filtered", []) or [])
        filtered = [b for b in filtered if b.get("id") != book_id]
        self.wikidich_filtered = filtered
        self._wd_refresh_tree(filtered)
        messagebox.showinfo("Đã xóa", "Đã xóa truyện khỏi dữ liệu local.", parent=self)

    def _wd_reconcile_works(self, server_data: dict, action: str, proxies=None):
        """Trả về (data_merged, needs_full_fetch)."""
        if action == "full_reset":
            return server_data, False
        local_data = self.wikidich_data or {}
        local_ids = list(local_data.get("book_ids") or [])
        server_ids = list(server_data.get("book_ids") or [])
        if action == "merge_keep_details":
            merged_books = {}
            local_books = local_data.get("books", {})
            for bid in server_ids:
                base = server_data.get("books", {}).get(bid, {})
                merged_books[bid] = self._wd_merge_book_data(base, local_books.get(bid, {}))
            server_data = dict(server_data)
            server_data["books"] = merged_books
            return server_data, False
        if action == "auto_more":
            total_server = server_data.get("total_count") or len(server_ids)
            additions = max(0, total_server - len(local_ids))
            local_latest = local_ids[0] if local_ids else None
            if not local_latest or local_latest not in server_ids:
                return server_data, True  # cần tải full
            anchor_idx = server_ids.index(local_latest)
            # chỉ thêm mới, không xóa
            if additions == anchor_idx:
                merged_books = {}
                local_books = local_data.get("books", {})
                merged_ids = list(server_ids)
                if local_latest in local_ids:
                    tail_start = local_ids.index(local_latest) + 1
                    for bid in local_ids[tail_start:]:
                        if bid not in merged_ids:
                            merged_ids.append(bid)
                for bid in merged_ids:
                    base = server_data.get("books", {}).get(bid, {})
                    local_book = local_books.get(bid)
                    if base and local_book:
                        merged_books[bid] = self._wd_merge_book_data(base, local_book)
                    elif base:
                        merged_books[bid] = base
                    elif local_book:
                        merged_books[bid] = local_book
                    else:
                        merged_books[bid] = {}
                return {"username": self.wikidich_data.get("username"), "book_ids": merged_ids, "books": merged_books, "synced_at": server_data.get("synced_at"), "total_count": total_server}, False
            # vừa thêm vừa xóa: kiểm tra từ neo trở về sau
            deletions_needed = max(0, anchor_idx - additions)
            if deletions_needed == 0:
                return server_data, True
            local_books = local_data.get("books", {})
            local_tail = list(local_ids)
            i_local = 0
            j_server = anchor_idx
            while deletions_needed > 0 and i_local < len(local_tail) and j_server < len(server_ids):
                if local_tail[i_local] == server_ids[j_server]:
                    i_local += 1
                    j_server += 1
                    continue
                lid = local_tail[i_local]
                url = None
                if isinstance(local_books.get(lid), dict):
                    url = local_books[lid].get("url")
                if url and self._wd_is_book_deleted_on_server(url, proxies=proxies):
                    deletions_needed -= 1
                    local_tail.pop(i_local)
                    continue
                else:
                    return server_data, True  # không chắc chắn -> tải full
            if deletions_needed > 0:
                return server_data, True
            merged_books = {}
            for bid in server_ids:
                base = server_data.get("books", {}).get(bid, {})
                local_book = local_books.get(bid)
                if base and local_book:
                    merged_books[bid] = self._wd_merge_book_data(base, local_book)
                elif base:
                    merged_books[bid] = base
                elif local_book:
                    merged_books[bid] = local_book
                else:
                    merged_books[bid] = {}
            return {"username": self.wikidich_data.get("username"), "book_ids": server_ids, "books": merged_books, "synced_at": server_data.get("synced_at"), "total_count": total_server}, False
        if action == "autodiff":
            # server_data ở đây là dữ liệu quét từng phần (theo thứ tự server)
            merged_books = {}
            local_books = local_data.get("books", {})
            for bid in server_ids:
                base = server_data.get("books", {}).get(bid, {})
                if bid in local_books:
                    merged_books[bid] = self._wd_merge_book_data(base, local_books[bid])
                else:
                    merged_books[bid] = base
            server_data = dict(server_data)
            server_data["books"] = merged_books
            return server_data, False
        if action == "auto_less_same_top":
            expected_removed = max(0, len(local_ids) - len(server_ids))
            missing_local = [bid for bid in local_ids if bid not in server_ids]
            if len(missing_local) != expected_removed:
                self._wd_sync_prompt(lambda: messagebox.showerror(
                    "Lỗi đối chiếu",
                    "Không xác định rõ truyện bị xóa. Hãy tải lại từ đầu hoặc xử lý thủ công.",
                    parent=self
                ))
                return None
            merged_books = {}
            local_books = local_data.get("books", {})
            for bid in server_ids:
                base = server_data.get("books", {}).get(bid, {})
                if bid in local_books:
                    merged_books[bid] = self._wd_merge_book_data(base, local_books[bid])
                else:
                    merged_books[bid] = base
            server_data = dict(server_data)
            server_data["books"] = merged_books
            return server_data, False
        if action == "auto_less_diff_top":
            local_latest = local_ids[0] if local_ids else None
            new_on_server = []
            anchor_found = False
            for bid in server_ids:
                if bid == local_latest:
                    anchor_found = True
                    break
                if bid not in local_ids:
                    new_on_server.append(bid)
            if not anchor_found:
                self._wd_sync_prompt(lambda: messagebox.showerror(
                    "Lỗi đối chiếu",
                    "Không tìm thấy truyện neo trong danh sách server. Hãy tải lại từ đầu.",
                    parent=self
                ))
                return None
            expected_removed = (len(local_ids) - len(server_ids)) + len(new_on_server)
            missing_local = [bid for bid in local_ids if bid not in server_ids]
            if len(missing_local) != expected_removed:
                self._wd_sync_prompt(lambda: messagebox.showerror(
                    "Lỗi đối chiếu",
                    "Không xác định rõ truyện bị xóa/thêm. Hãy tải lại từ đầu.",
                    parent=self
                ))
                return None
            merged_books = {}
            local_books = local_data.get("books", {})
            for bid in server_ids:
                base = server_data.get("books", {}).get(bid, {})
                if bid in local_books:
                    merged_books[bid] = self._wd_merge_book_data(base, local_books[bid])
                else:
                    merged_books[bid] = base
            server_data = dict(server_data)
            server_data["books"] = merged_books
            return server_data, False
        return None, False

    def _wd_fetch_works_worker(self):
        pythoncom.CoInitialize()
        self._wd_loading = True
        self._wd_cancel_requested = False
        cancelled = False
        self.log("[Wikidich] Bắt đầu tải Works...")
        self._wd_set_progress("Đang kiểm tra đăng nhập...", 0, 0)
        prior_data = self.wikidich_data or {}
        local_ids = list(prior_data.get("book_ids") or [])
        expected_total = None
        try:
            resume_state = getattr(self, "_wd_resume_works", None) or {}
            existing_data = resume_state.get("data")
            start_offset = resume_state.get("next_start")
            page_size_hint = resume_state.get("page_size")
            if existing_data:
                start_msg = start_offset if start_offset is not None else len(existing_data.get("book_ids", []))
                self.log(f"[Wikidich] Tiếp tục Works từ vị trí {start_msg}")
            proxies = self._get_proxy_for_request('fetch_titles')
            cookies = load_browser_cookie_jar(self._wd_get_cookie_domains())
            if not cookies:
                self.after(0, lambda: messagebox.showerror("Thiếu cookie", "Không đọc được cookie Wikidich từ trình duyệt tích hợp. Hãy mở trình duyệt, đăng nhập rồi thử lại."))
                self.log("[Wikidich] Không có cookie, dừng tải.")
                return
            session = wikidich_ext.build_session_with_cookies(cookies, proxies=proxies)
            wiki_headers = self.api_settings.get('wiki_headers') if isinstance(self.api_settings, dict) else {}
            merged_headers = self._wd_default_headers()
            if isinstance(wiki_headers, dict):
                for k, v in wiki_headers.items():
                    if v and k not in merged_headers and k.lower() not in ("x-requested-with", "connection"):
                        merged_headers[k] = v
            session.headers.clear()
            session.headers.update(merged_headers)
            try:
                resp_probe = session.get(self._wd_get_base_url(), timeout=25, proxies=proxies)
                self._wd_log_request_headers(resp_probe, "Probe")
                if self._wd_detect_cloudflare(resp_probe):
                    self._wd_pause_for_cloudflare(self._wd_get_base_url())
                    return
            except Exception:
                pass
            user_slug = wikidich_ext.fetch_current_user(session, base_url=self._wd_get_base_url(), proxies=proxies)
            if not user_slug:
                self.after(0, lambda: messagebox.showerror("Chưa đăng nhập", "Không tìm thấy mục 'Hồ sơ của tôi'. Hãy đăng nhập Wikidich bằng trình duyệt tích hợp rồi thử lại."))
                self.log("[Wikidich] Không tìm thấy 'Hồ sơ của tôi' -> chưa đăng nhập.")
                return
            self.log(f"[Wikidich] Đăng nhập: {user_slug}")
            # Lấy metadata nhanh (tổng và truyện mới nhất) trước khi tải toàn bộ
            meta_total = None
            meta_latest = None
            try:
                meta = wikidich_ext.fetch_works_meta(session, user_slug, base_url=self._wd_get_base_url(), proxies=proxies)
                meta_total = meta.get("total")
                meta_latest = meta.get("latest_id")
                self.log(f"[Wikidich] Tổng trên server: {meta_total}, mới nhất: {meta_latest}")
            except Exception as e:
                self.log(f"[Wikidich] Không lấy được metadata nhanh: {e}")
            action = self._wd_precheck_works(meta_total, meta_latest)
            if not action:
                self.log("[Wikidich] Dừng tải Works theo lựa chọn người dùng/kiểm tra.")
                return
            if action == "manual_less_stop":
                self.log("[Wikidich] Dừng tải Works để bạn tự xử lý truyện bị xóa/thêm (theo lựa chọn 3).")
                self._wd_set_progress("Dừng: tự xử lý truyện bị xóa/thêm", 0, 1)
                return
            expected_total = meta_total
            wiki_delay_min, wiki_delay_max = self._get_delay_range(
                'wiki_delay_min',
                'wiki_delay_max',
                DEFAULT_API_SETTINGS['wiki_delay_min'],
                DEFAULT_API_SETTINGS['wiki_delay_max']
            )
            delay_avg = (wiki_delay_min + wiki_delay_max) / 2 if wiki_delay_max > 0 else 0
            data = None
            local_latest = local_ids[0] if local_ids else None
            # Nếu chỉ thêm mới (auto_more), thử dừng khi gặp neo; các trường hợp khác tải full
            stop_when_found_id = local_latest if action == "auto_more" else None
            if action in ("autodiff", "auto_less_same_top", "auto_less_diff_top", "auto_more"):
                # Quét tối thiểu: lấy đủ số truyện (meta_total) theo thứ tự server
                stop_after = meta_total or None
                data = wikidich_ext.fetch_works(
                    session,
                    user_slug,
                    base_url=self._wd_get_base_url(),
                    proxies=proxies,
                    progress_cb=self._wd_progress_callback,
                    delay=delay_avg,
                    stop_after=stop_after,
                    existing_data=existing_data,
                    start_offset=start_offset,
                    page_size_hint=page_size_hint,
                    stop_when_found_id=stop_when_found_id
                )
            else:
                data = wikidich_ext.fetch_works(
                    session,
                    user_slug,
                    base_url=self._wd_get_base_url(),
                    proxies=proxies,
                    progress_cb=self._wd_progress_callback,
                    delay=delay_avg,
                    existing_data=existing_data,
                    start_offset=start_offset,
                    page_size_hint=page_size_hint,
                    stop_when_found_id=stop_when_found_id
                )
            self._wd_ensure_not_cancelled()
            new_ids = [bid for bid in data.get("book_ids", []) if bid not in (prior_data.get("book_ids") or [])]
            delay_avg = (wiki_delay_min + wiki_delay_max) / 2 if wiki_delay_max > 0 else 0
            if new_ids:
                self._wd_fetch_details_for_new_books(session, data, new_ids, user_slug, delay_avg, proxies=proxies)
            self.log(f"[Wikidich] Đã lấy {len(data.get('book_ids', []))} works.")
            reconciled, needs_full_fetch = self._wd_reconcile_works(data, action, proxies=proxies)
            if needs_full_fetch and action == "auto_more":
                # tải lại đầy đủ không dừng ở neo
                self.log("[Wikidich] Phát hiện thay đổi phức tạp, tải lại toàn bộ danh sách...")
                data = wikidich_ext.fetch_works(
                    session,
                    user_slug,
                    base_url=self._wd_get_base_url(),
                    proxies=proxies,
                    progress_cb=self._wd_progress_callback,
                    delay=delay_avg,
                    existing_data=existing_data,
                    start_offset=start_offset,
                    page_size_hint=page_size_hint,
                    stop_when_found_id=None
                )
                self._wd_ensure_not_cancelled()
                reconciled, needs_full_fetch = self._wd_reconcile_works(data, action, proxies=proxies)
            if reconciled is None:
                self.log("[Wikidich] Đã dừng tải Works theo yêu cầu/điều kiện không phù hợp.")
                return
            self.wikidich_data = reconciled
            if expected_total is None:
                expected_total = reconciled.get("total_count") or data.get("total_count")
            final_count = len(self.wikidich_data.get("book_ids") or [])
            if expected_total:
                if final_count != expected_total:
                    self.log(f"[Wikidich] Cảnh báo: số truyện local ({final_count}) khác server ({expected_total}).")
                    self.after(0, lambda: messagebox.showwarning(
                        "Không khớp số truyện",
                        f"Số truyện local ({final_count}) khác server ({expected_total}). Hãy kiểm tra lại hoặc tải lại từ đầu.",
                        parent=self
                    ))
                else:
                    self.log("[Wikidich] Đối chiếu số truyện khớp với server.")
            self._wd_update_user_label()
            self._wd_save_cache()
            self.after(0, self._wd_refresh_category_options)
            self.after(0, self._wd_apply_filters)
            self._wd_set_progress(f"Đã tải {len(data.get('book_ids', []))} works", len(data.get('book_ids', [])), len(data.get('book_ids', [])))
            self._wd_resume_works = None
        except wikidich_ext.CloudflareBlocked as cf_exc:
            partial = cf_exc.partial_data or {}
            self._wd_resume_works = {
                "data": partial,
                "next_start": cf_exc.next_start,
                "page_size": cf_exc.page_size,
            }
            self._wd_save_resume_state()
            self.wikidich_data = partial or self.wikidich_data
            total = partial.get("total_count") or 0
            current = len(partial.get("book_ids", []) or [])
            self._wd_set_progress("Tạm dừng: cần vượt Cloudflare", current, total or 1)
            self._wd_save_cache()
            self._wd_pause_for_cloudflare(self._wd_get_base_url())
            return
        except WikidichCancelled:
            cancelled = True
            self.log("[Wikidich] Đã hủy tải Works theo yêu cầu người dùng.")
            self._wd_mark_cancelled()
        except Exception as e:
            self.log(f"[Wikidich] Lỗi tải works: {e}")
            self.after(0, lambda: messagebox.showerror("Lỗi Wikidich", f"Không thể tải works: {e}"))
        finally:
            self._wd_loading = False
            self._wd_cancel_requested = False
            pythoncom.CoUninitialize()
            self._wd_progress_running = False
            if not cancelled:
                self._wd_set_progress("Chờ thao tác...", 0, 1)
            if not self._wd_resume_works:
                self._wd_clear_resume_state()

    def _wd_start_fetch_details(self, sync_counts_only: bool = False):
        if self._wd_loading:
            messagebox.showinfo("Đang chạy", "Đang có tác vụ Wikidich khác đang chạy.")
            return
        if not self.wikidich_data.get('book_ids'):
            messagebox.showinfo("Chưa có dữ liệu", "Vui lòng tải works trước.")
            return
        self._wd_cancel_requested = False
        threading.Thread(target=self._wd_fetch_details_worker, args=(sync_counts_only,), daemon=True).start()

    def _wd_fetch_details_worker(self, sync_counts_only: bool = False):
        pythoncom.CoInitialize()
        self._wd_loading = True
        self._wd_cancel_requested = False
        cancelled = False
        cf_paused = False
        self.log("[Wikidich] Bắt đầu tải chi tiết/văn án...")
        try:
            if sync_counts_only:
                self._wd_set_progress("Đang đồng bộ số chương...", 0, 1)
                filtered_books = []
                if self.wd_detail_scope_var.get() == "filtered":
                    filtered_books = getattr(self, "wikidich_filtered", []) or []
                else:
                    filtered_books = [self.wikidich_data.get("books", {}).get(bid) for bid in self.wikidich_data.get("book_ids", [])]
                filtered_books = [b for b in filtered_books if b]
                if self.wd_missing_only_var.get():
                    filtered_books = [b for b in filtered_books if not b.get("summary")]
                if not filtered_books:
                    self._wd_set_progress("Không có truyện để đồng bộ", 0, 1)
                    return
                not_found = self._wd_sync_counts_from_server(filtered_books)
                self._wd_set_progress("Hoàn tất đồng bộ số chương", len(filtered_books), len(filtered_books))
                if not_found:
                    self.after(0, lambda: self._wd_handle_not_found_books(list(not_found)))
                self.after(0, lambda: self._wd_refresh_tree(getattr(self, "wikidich_filtered", [])))
                return
            proxies = self._get_proxy_for_request('fetch_titles')
            cookies = load_browser_cookie_jar(self._wd_get_cookie_domains())
            if not cookies:
                self.after(0, lambda: messagebox.showerror("Thiếu cookie", "Không đọc được cookie Wikidich từ trình duyệt tích hợp."))
                self.log("[Wikidich] Không có cookie, dừng tải chi tiết.")
                return
            session = wikidich_ext.build_session_with_cookies(cookies, proxies=proxies)
            wiki_headers = self.api_settings.get('wiki_headers') if isinstance(self.api_settings, dict) else {}
            merged_headers = self._wd_default_headers()
            if isinstance(wiki_headers, dict):
                for k, v in wiki_headers.items():
                    if v and k not in merged_headers and k.lower() not in ("x-requested-with", "connection"):
                        merged_headers[k] = v
            session.headers.clear()
            session.headers.update(merged_headers)
            current_user = self.wikidich_data.get('username') or wikidich_ext.fetch_current_user(session, base_url=self._wd_get_base_url(), proxies=proxies) or ""
            try:
                dummy_resp = requests.Response()
                dummy_resp.request = type("Req", (), {"headers": session.headers})()
                self._wd_log_request_headers(dummy_resp, "Detail headers")
            except Exception:
                pass
            scope = self.wd_detail_scope_var.get()
            if scope == "filtered":
                filtered_books = getattr(self, "wikidich_filtered", []) or []
                target_ids = [book.get('id') for book in filtered_books if book.get('id')]
                if not target_ids:
                    self._wd_set_progress("Không có truyện khớp bộ lọc hiện tại", 0, 1)
                    self.after(0, lambda: messagebox.showinfo("Không có truyện", "Không có truyện nào khớp bộ lọc hiện tại để tải chi tiết.", parent=self))
                    self.log("[Wikidich] Không có truyện phù hợp bộ lọc để tải chi tiết.")
                    return
            else:
                target_ids = list(self.wikidich_data.get('book_ids', []))
            target_ids = list(dict.fromkeys(target_ids))
            if self.wd_missing_only_var.get():
                target_ids = [bid for bid in target_ids if not self.wikidich_data.get('books', {}).get(bid, {}).get('summary')]
            resume_detail = self._wd_resume_details if isinstance(self._wd_resume_details, dict) else None
            if resume_detail and resume_detail.get("ids"):
                resume_ids = [bid for bid in resume_detail.get("ids", []) if bid in target_ids]
                if resume_ids:
                    target_ids = resume_ids
                    self.log(f"[Wikidich] Resume tải chi tiết còn {len(target_ids)} truyện.")
            total = len(target_ids)
            self._wd_ensure_not_cancelled()
            if total == 0:
                self._wd_set_progress("Không có truyện cần tải chi tiết", 0, 1)
                self.after(0, lambda: messagebox.showinfo("Không có gì để tải", "Tất cả truyện đã có văn án/chi tiết."))
                self.log("[Wikidich] Không có truyện cần tải chi tiết.")
                return
            self._wd_set_progress("Đang tải chi tiết...", 0, total)
            wiki_delay_min, wiki_delay_max = self._get_delay_range(
                'wiki_delay_min',
                'wiki_delay_max',
                DEFAULT_API_SETTINGS['wiki_delay_min'],
                DEFAULT_API_SETTINGS['wiki_delay_max']
            )
            not_found_books = []
            had_error = False
            remaining_ids = list(target_ids)
            for idx, bid in enumerate(target_ids, start=1):
                book = self.wikidich_data.get('books', {}).get(bid)
                if not book:
                    continue
                try:
                    updated = wikidich_ext.fetch_book_detail(
                        session,
                        book,
                        current_user,
                        base_url=self._wd_get_base_url(),
                        proxies=proxies,
                        skip_chapter_count=True
                    )
                    if isinstance(updated, dict):
                        updated.pop("server_lower", None)
                        updated.pop("server_lower_reason", None)
                    self.wikidich_data['books'][bid] = updated
                    self._wd_save_cache()
                except requests.HTTPError as http_err:
                    resp_cf = getattr(http_err, "response", None)
                    if self._wd_detect_cloudflare(resp_cf):
                        cf_paused = True
                        self.log("[Wikidich] Bị Cloudflare khi tải chi tiết, tạm dừng.")
                        self._wd_set_progress("Tạm dừng: cần vượt Cloudflare", idx - 1, total)
                        self._wd_pause_for_cloudflare(self._wd_get_base_url())
                        break
                    if resp_cf and resp_cf.status_code == 404:
                        not_found_books.append(dict(book))
                        self._wd_record_not_found(book, prompt=False)
                        had_error = True
                        try:
                            self.after(0, lambda b=dict(book): self._wd_handle_not_found_books([b]))
                        except Exception:
                            pass
                        continue
                    self.log(f"[Wikidich] Lỗi khi tải {book.get('title', bid)}: {http_err}")
                    had_error = True
                except Exception as e:
                    self.log(f"[Wikidich] Lỗi khi tải {book.get('title', bid)}: {e}")
                    had_error = True
                if cf_paused:
                    break
                self._wd_progress_callback("detail", idx, total, f"Đang tải chi tiết {idx}/{total}")
                if bid in remaining_ids:
                    remaining_ids = [x for x in remaining_ids if x != bid]
                self._wd_save_detail_resume(remaining_ids)
                self._wd_ensure_not_cancelled()
                delay = random.uniform(wiki_delay_min, wiki_delay_max) if wiki_delay_max > 0 else 0
                if delay > 0:
                    time.sleep(delay)
            if cf_paused:
                self._wd_save_detail_resume(remaining_ids)
                self._wd_save_cache()
                return
            self._wd_save_cache()
            self.after(0, self._wd_apply_filters)
            final_status = "Hoàn tất tải chi tiết" if not not_found_books and not had_error else "Hoàn tất (có 404/lỗi)"
            self._wd_set_progress(final_status, total, total)
            self.log(f"[Wikidich] {final_status}.")
            if not_found_books:
                self.after(0, lambda: self._wd_handle_not_found_books(list(not_found_books)))
        except WikidichCancelled:
            cancelled = True
            self.log("[Wikidich] Đã hủy tải chi tiết theo yêu cầu người dùng.")
            self._wd_mark_cancelled()
        finally:
            try:
                self._wd_save_cache()
            except Exception:
                pass
            if not cancelled and not cf_paused:
                self._wd_clear_detail_resume()
            self._wd_loading = False
            self._wd_cancel_requested = False
            pythoncom.CoUninitialize()
            self._wd_progress_running = False
            if not cancelled:
                self._wd_set_progress("Chờ thao tác...", 0, 1)

    def _wd_prompt_check_updates(self):
        filtered = list(getattr(self, "wikidich_filtered", []) or [])
        if not filtered:
            messagebox.showinfo("Chưa có dữ liệu", "Không có truyện nào đang hiển thị để kiểm tra.", parent=self)
            return
        resp = messagebox.askyesnocancel(
            "Kiểm tra cập nhật",
            "Chức năng chỉ kiểm tra các truyện đang hiển thị trong bảng hiện tại.\n"
            "Bạn phải đảm bảo số chương của các truyện hiện lại là mới nhất theo server để các tính năng hoạt động chính xác!\n\n"
            "Yes: đồng bộ lại số chương từ server (cần đăng nhập) rồi mới kiểm tra cập nhật.\n"
            "No: chỉ kiểm tra cập nhật (dùng số chương hiện có).",
            parent=self
        )
        if resp is None:
            return
        self._wd_start_check_updates(sync_counts=bool(resp))

    def _wd_start_check_updates(self, sync_counts: bool = False):
        if self._wd_loading:
            messagebox.showinfo("Đang chạy", "Đang có tác vụ Wikidich khác đang chạy.")
            return
        self._wd_cancel_requested = False
        threading.Thread(target=self._wd_check_updates_worker, args=(sync_counts,), daemon=True).start()

    def _wd_check_updates_worker(self, sync_counts: bool = False):
        pythoncom.CoInitialize()
        self._wd_loading = True
        self._wd_cancel_requested = False
        cancelled = False
        pending_404 = []
        try:
            filtered = list(getattr(self, "wikidich_filtered", []) or [])
            if not filtered:
                self._wd_set_progress("Không có truyện để kiểm tra", 0, 1)
                return
            not_found_404 = []
            if sync_counts:
                self._wd_set_progress("Đang đồng bộ số chương...", 0, len(filtered))
                not_found_404 = self._wd_sync_counts_from_server(filtered)
                pending_404.extend(not_found_404)
            proxies = self._get_proxy_for_request('fetch_titles')
            fanqie_headers = self.api_settings.get('fanqie_headers') if isinstance(self.api_settings, dict) else {}
            fanqie_delay_min, fanqie_delay_max = self._get_delay_range(
                'fanqie_delay_min',
                'fanqie_delay_max',
                DEFAULT_API_SETTINGS['fanqie_delay_min'],
                DEFAULT_API_SETTINGS['fanqie_delay_max']
            )
            total = len(filtered)
            results = dict(self.wd_new_chapters) if isinstance(self.wd_new_chapters, dict) else {}
            self._wd_set_progress("Đang kiểm tra cập nhật...", 0, total)

            def _apply_partial_results():
                snapshot = dict(results)
                def _ui_update():
                    self.wd_new_chapters = snapshot
                    try:
                        self._wd_refresh_tree(filtered)
                    except Exception:
                        pass
                try:
                    self.after(0, _ui_update)
                except Exception:
                    _ui_update()

            for idx, book in enumerate(filtered, start=1):
                self._wd_ensure_not_cancelled()
                book_id = book.get('id')
                diff = self._wd_calculate_new_chapters(book, proxies=proxies, headers=fanqie_headers)
                if book_id:
                    if isinstance(diff, int) and diff > 0:
                        results[book_id] = diff
                    else:
                        results.pop(book_id, None)
                if idx == 1 or idx % 5 == 0 or idx == total:
                    _apply_partial_results()
                self._wd_progress_callback("check_update", idx, total, f"Đang kiểm tra {idx}/{total}")
                self._wd_ensure_not_cancelled()
                delay = random.uniform(fanqie_delay_min, fanqie_delay_max) if fanqie_delay_max > 0 else 0
                if delay > 0:
                    time.sleep(delay)
            self.wd_new_chapters = results
            self.after(0, lambda: self._wd_refresh_tree(filtered))
            self._wd_set_progress("Hoàn tất kiểm tra cập nhật", total, total)
            if pending_404:
                self.after(0, lambda: self._wd_handle_not_found_books(pending_404))
        except WikidichCancelled:
            cancelled = True
            self.log("[Wikidich] Đã hủy kiểm tra cập nhật theo yêu cầu người dùng.")
            self._wd_mark_cancelled()
        except Exception as exc:
            self.log(f"[Wikidich] Lỗi khi kiểm tra cập nhật: {exc}")
            self.after(0, lambda: messagebox.showerror("Lỗi", f"Không thể kiểm tra cập nhật: {exc}", parent=self))
        finally:
            self._wd_loading = False
            self._wd_progress_running = False
            self._wd_cancel_requested = False
            pythoncom.CoUninitialize()
            if not cancelled:
                self._wd_set_progress("Chờ thao tác...", 0, 1)

    def _wd_parse_works_search(self, html_text: str, base_url: str):
        results = []
        try:
            soup = BeautifulSoup(html_text, "html.parser")
            for info in soup.select(".book-info"):
                checkbox = info.select_one("input[name='bookId']")
                bid = checkbox.get("value", "").strip() if checkbox else ""
                if not bid:
                    continue
                title_el = info.select_one(".book-title")
                title = title_el.get_text(strip=True) if title_el else ""
                url = urljoin(base_url, title_el.get("href", "")) if title_el else ""
                author_el = info.select_one(".book-author a")
                author = author_el.get_text(strip=True) if author_el else ""
                status_el = info.select(".book-author a")
                status = ""
                if len(status_el) >= 2:
                    status = status_el[1].get_text(strip=True)
                chapter_el = info.select_one(".book-chapter-count")
                chapters = None
                if chapter_el:
                    m = re.search(r"(\d+)", chapter_el.get_text(strip=True))
                    if m:
                        try:
                            chapters = int(m.group(1))
                        except Exception:
                            chapters = None
                updated_el = info.select_one(".book-last-update")
                updated_text = updated_el.get_text(strip=True) if updated_el else ""
                updated_text = self._wd_clean_updated_text(updated_text)
                results.append({
                    "id": bid,
                    "title": title,
                    "url": url,
                    "author": author,
                    "status": status,
                    "chapters": chapters,
                    "updated_text": updated_text,
                })
        except Exception:
            return []
        return results

    def _wd_fetch_book_from_works(self, session, book: dict, user_slug: str, proxies=None):
        base_url = self._wd_get_base_url()
        raw_slug = unquote(user_slug or "")
        if not raw_slug:
            return None
        try:
            url = base_url.rstrip("/") + "/user/" + quote(raw_slug) + "/works"
            params = {"q": book.get("title", "")}
            resp = session.get(url, params=params, proxies=proxies or {}, timeout=40)
            resp.raise_for_status()
            items = self._wd_parse_works_search(resp.text, base_url)
            for item in items:
                if item.get("id") == book.get("id"):
                    return item
        except Exception as exc:
            self.log(f"[Wikidich] Lỗi sync số chương từ Works: {exc}")
        return None

    def _wd_sync_counts_from_server(self, books: list):
        not_found = []
        session, current_user, proxies = self._wd_build_wiki_session(include_user=True)
        if not session or not current_user:
            self.after(0, lambda: messagebox.showerror("Thiếu cookie", "Không đọc được cookie Wikidich để đồng bộ số chương.", parent=self))
            return []
        total = len(books)
        wiki_delay_min, wiki_delay_max = self._get_delay_range(
            'wiki_delay_min',
            'wiki_delay_max',
            DEFAULT_API_SETTINGS['wiki_delay_min'],
            DEFAULT_API_SETTINGS['wiki_delay_max']
        )
        for idx, book in enumerate(books, start=1):
            self._wd_ensure_not_cancelled()
            bid = book.get("id")
            updated_info = self._wd_fetch_book_from_works(session, book, current_user, proxies=proxies)
            if updated_info:
                merged = dict(book)
                merged["server_lower"] = False
                merged.update({
                    "title": updated_info.get("title") or book.get("title", ""),
                    "url": updated_info.get("url") or book.get("url", ""),
                    "author": updated_info.get("author") or book.get("author", ""),
                    "status": updated_info.get("status") or book.get("status", ""),
                    "updated_text": updated_info.get("updated_text") or book.get("updated_text", ""),
                })
                # so sánh số chương, chỉ tăng
                try:
                    current_chapters = int(book.get("chapters") or 0)
                except Exception:
                    current_chapters = 0
                server_chapters = updated_info.get("chapters")
                if server_chapters is None:
                    try:
                        detail_counts = wikidich_ext.fetch_book_detail(
                            session,
                            book,
                            current_user,
                            base_url=self._wd_get_base_url(),
                            proxies=proxies,
                            skip_chapter_count=False
                        )
                        if isinstance(detail_counts, dict) and detail_counts.get("chapters") is not None:
                            server_chapters = detail_counts.get("chapters")
                            updated_info["chapters"] = server_chapters
                            if detail_counts.get("updated_text"):
                                merged["updated_text"] = detail_counts.get("updated_text")
                    except Exception as exc:
                        self.log(f"[SyncCounts] Fallback detail when chapters missing thất bại: {exc}")
                try:
                    self.log(f"[SyncCounts] {book.get('title', bid)}: local={current_chapters} server={server_chapters}")
                except Exception:
                    pass
                if server_chapters is not None:
                    try:
                        server_chapters = int(server_chapters)
                    except Exception:
                        server_chapters = None
                if server_chapters is not None:
                    if server_chapters < current_chapters:
                        merged["chapters"] = current_chapters
                        merged["server_lower"] = True
                    elif server_chapters > current_chapters:
                        merged["chapters"] = server_chapters
                    else:
                        merged["chapters"] = current_chapters
                # so sánh ngày cập nhật, chỉ mới hơn thì nhận
                cur_upd = self._wd_clean_updated_text(book.get("updated_text") or "")
                new_upd = self._wd_clean_updated_text(updated_info.get("updated_text") or "")
                cur_ts = self._wd_date_to_ts(cur_upd)
                new_ts = self._wd_date_to_ts(new_upd)
                if cur_ts and new_ts and new_ts < cur_ts:
                    merged["updated_text"] = book.get("updated_text", "")
                    merged["server_lower"] = True
                elif new_upd:
                    merged["updated_text"] = new_upd
                if merged.get("server_lower"):
                    merged["server_lower_reason"] = "Server < local"
                else:
                    merged.pop("server_lower_reason", None)
                if bid:
                    # cập nhật in-place để giữ tham chiếu danh sách đang hiển thị
                    if isinstance(self.wikidich_data.get("books"), dict) and bid in self.wikidich_data["books"]:
                        book_obj = self.wikidich_data["books"][bid]
                        book_obj.clear()
                        book_obj.update(merged)
                        merged = book_obj
                    self.wikidich_data["books"][bid] = merged
                self._wd_save_cache()
            else:
                try:
                    fallback = wikidich_ext.fetch_book_detail(
                        session,
                        book,
                        current_user,
                        base_url=self._wd_get_base_url(),
                        proxies=proxies,
                        skip_chapter_count=False
                    )
                    if bid:
                        try:
                            current_chapters = int(book.get("chapters") or 0)
                        except Exception:
                            current_chapters = 0
                        try:
                            fb_chapters = int(fallback.get("chapters") or 0)
                        except Exception:
                            fb_chapters = 0
                        if fb_chapters < current_chapters:
                            fallback["chapters"] = current_chapters
                            fallback["server_lower"] = True
                        else:
                            fallback["server_lower"] = False
                        cur_upd = self._wd_clean_updated_text(book.get("updated_text") or "")
                        new_upd = self._wd_clean_updated_text(fallback.get("updated_text") or "")
                        cur_ts = self._wd_date_to_ts(cur_upd)
                        new_ts = self._wd_date_to_ts(new_upd)
                        if cur_ts and new_ts and new_ts < cur_ts:
                            fallback["updated_text"] = book.get("updated_text", "")
                            fallback["server_lower"] = True
                        if fallback.get("server_lower"):
                            fallback["server_lower_reason"] = "Server < local"
                        else:
                            fallback.pop("server_lower_reason", None)
                        # cập nhật in-place
                        if isinstance(self.wikidich_data.get("books"), dict) and bid in self.wikidich_data["books"]:
                            book_obj = self.wikidich_data["books"][bid]
                            book_obj.clear()
                            book_obj.update(fallback)
                            fallback = book_obj
                        self.wikidich_data["books"][bid] = fallback
                    self.log(f"[Wikidich] Fallback lấy chi tiết + chương cho {book.get('title','')}")
                    self._wd_save_cache()
                except requests.HTTPError as http_err:
                    if getattr(http_err, "response", None) and http_err.response.status_code == 404:
                        not_found.append(dict(book))
                        self._wd_record_not_found(book, prompt=False)
                    else:
                        self.log(f"[Wikidich] Lỗi fallback detail {book.get('title','')}: {http_err}")
                except Exception as exc:
                    self.log(f"[Wikidich] Lỗi fallback detail {book.get('title','')}: {exc}")
            self._wd_progress_callback("check_update", idx, total, f"Đồng bộ {idx}/{total}")
            delay = random.uniform(wiki_delay_min, wiki_delay_max) if wiki_delay_max > 0 else 0
            if delay > 0:
                time.sleep(delay)
        self._wd_save_cache()
        self.after(0, lambda: self._wd_refresh_tree(getattr(self, "wikidich_filtered", [])))
        return not_found

    def _wd_record_not_found(self, book: dict, prompt: bool = True):
        if not book:
            return
        bid = book.get("id")
        if not isinstance(self.wd_not_found, list):
            self.wd_not_found = []
        if bid and isinstance(self.wikidich_data.get("books"), dict) and bid in self.wikidich_data["books"]:
            self.wikidich_data["books"][bid]["deleted_404"] = True
        # ghi nhận trực tiếp vào danh sách đang hiển thị để tô đỏ ngay
        try:
            if getattr(self, "wikidich_filtered", None):
                for obj in self.wikidich_filtered:
                    if obj.get("id") == bid:
                        obj["deleted_404"] = True
        except Exception:
            pass
        already = False
        for item in self.wd_not_found:
            if bid and item.get("id") == bid:
                already = True
                break
            if not bid and item.get("title") == book.get("title"):
                already = True
                break
        if not already:
            self.wd_not_found.append({
                "id": bid,
                "title": book.get("title"),
                "url": book.get("url"),
            })
        try:
            self.log(f"[Wikidich] Đánh dấu 404 cho '{book.get('title', bid)}'")
        except Exception:
            pass
        def _refresh():
            try:
                if getattr(self, "wikidich_filtered", None) is not None:
                    self._wd_refresh_tree(self.wikidich_filtered)
                else:
                    self._wd_apply_filters()
                if getattr(self, "wd_selected_book", None) and self.wd_selected_book.get("id") == bid:
                    self._wd_show_detail(self.wd_selected_book)
            except Exception:
                pass
        try:
            self.after(0, _refresh)
        except Exception:
            _refresh()
        self.save_config()
        if prompt:
            try:
                if not getattr(self, "_wd_not_found_prompting", False):
                    self.after(0, lambda: self._wd_handle_not_found_books([book]))
            except Exception:
                self._wd_handle_not_found_books([book])

    def _wd_prompt_stored_not_found(self):
        if getattr(self, "_wd_not_found_prompted", False):
            return
        self._wd_not_found_prompted = True
        if isinstance(self.wd_not_found, list) and self.wd_not_found:
            self._wd_handle_not_found_books(list(self.wd_not_found))

    def _wd_handle_not_found_books(self, books: list):
        if not books:
            return
        if getattr(self, "_wd_not_found_prompting", False):
            return
        self._wd_not_found_prompting = True
        try:
            try:
                self.log(f"[Wikidich] Cảnh báo 404 cho {len(books)} truyện.")
            except Exception:
                pass
            # Lưu ngay vào danh sách 404 và config để đánh dấu cờ đỏ
            try:
                for b in books:
                    self._wd_record_not_found(b, prompt=False)
            except Exception:
                pass
            try:
                # làm mới bảng để tô đỏ ngay
                if getattr(self, "wikidich_filtered", None) is not None:
                    self._wd_refresh_tree(self.wikidich_filtered)
            except Exception:
                pass

            titles = [b.get("title") or b.get("id") for b in books]
            msg = (
                "Có vẻ những truyện sau trả về 404 (có thể đã bị xóa):\n- "
                + "\n- ".join(titles)
                + "\n\nĐã đánh dấu đỏ trong danh sách. Xóa khỏi app?\n(Double-click một truyện trong danh sách để mở trong trình duyệt theo cài đặt.)"
            )

            def _open_browser(event=None):
                try:
                    sel = listbox.curselection()
                    if not sel:
                        return
                    idx = sel[0]
                    book = books[idx]
                    url = self._wd_normalize_url_for_site(book.get("url", ""))
                    self._wd_open_link(url)
                except Exception:
                    pass

            resp = messagebox.askyesnocancel("Truyện 404?", msg, parent=self)
            if resp is None:
                return
            if resp:
                for b in books:
                    bid = b.get("id")
                    if bid and isinstance(self.wikidich_data.get("books"), dict):
                        self.wikidich_data["books"].pop(bid, None)
                    try:
                        if bid and bid in (self.wikidich_data.get("book_ids") or []):
                            self.wikidich_data["book_ids"] = [x for x in self.wikidich_data["book_ids"] if x != bid]
                    except Exception:
                        pass
                    try:
                        self.wd_not_found = [
                            x for x in self.wd_not_found
                            if x.get("id") != bid and (not bid or x.get("title") != b.get("title"))
                        ]
                    except Exception:
                        pass
                self._wd_save_cache()
                self.save_config()
                self._wd_apply_filters()
            else:
                win = tk.Toplevel(self)
                self._apply_window_icon(win)
                win.title("Danh sách 404 (double-click để mở)")
                win.geometry("420x320")
                frame = ttk.Frame(win, padding=10)
                frame.pack(fill="both", expand=True)
                listbox = tk.Listbox(frame)
                listbox.pack(fill="both", expand=True)
                for t in titles:
                    listbox.insert(tk.END, t)
                listbox.bind("<Double-Button-1>", _open_browser)

                def _on_close():
                    self._wd_not_found_prompting = False
                    win.destroy()
                win.protocol("WM_DELETE_WINDOW", _on_close)
        finally:
            self._wd_not_found_prompting = False
            self.save_config()

    def _wd_get_fanqie_link(self, book: dict):
        links = book.get('extra_links') or []
        for link in links:
            if isinstance(link, dict):
                url = link.get('url', '')
            else:
                url = str(link)
            if url and "fanqienovel.com" in url:
                return url
        return None

    def _wd_find_link_with_domain(self, book: dict, domain: str):
        links = book.get('extra_links') or []
        for link in links:
            url = (link.get('url') if isinstance(link, dict) else link) or ""
            if domain in url:
                return url
        return None

    def _wd_switch_site(self, site: str):
        site = (site or "").strip().lower()
        if site not in ("wikidich", "koanchay"):
            return
        self._wd_show_site_tab(site)

    def _wd_show_site_tab(self, site: str):
        """Hiện tab theo site và kích hoạt context tương ứng."""
        tab = (self._wd_tabs or {}).get(site)
        if not tab:
            return
        try:
            if self.notebook.tab(tab, "state") == "hidden":
                self.notebook.tab(tab, state="normal")
            self.notebook.select(tab)
            self._wd_set_active_site(site)
        except Exception:
            pass

    def _wd_capture_context(self):
        """Lưu tất cả thuộc tính bắt đầu bằng wd_ cho site hiện tại."""
        shared_keys = {
            "_wd_tabs", "_wd_cover_cache", "_wd_contexts", "_wd_site_states",
            "_wd_cache_paths", "_wd_global_notes_win", "_wd_notes_tree",
            "_wd_notes_preview", "_wd_not_found_prompting", "_wd_not_found_prompted",
            "_wd_link_tree", "_wd_global_links_win"
        }
        return {
            k: v for k, v in self.__dict__.items()
            if (k.startswith("wd_") or k.startswith("_wd_")) and k not in shared_keys
        }

    def _wd_capture_site_state(self):
        """Lưu dữ liệu/tình trạng riêng cho từng site."""
        return {
            "filters": dict(self.wikidich_filters),
            "data": self.wikidich_data,
            "filtered": list(getattr(self, "wikidich_filtered", []) or []),
            "new_chapters": dict(getattr(self, "wd_new_chapters", {}) or {}),
            "pending_categories": list(getattr(self, "_wd_pending_categories", []) or []),
            "category_options": list(getattr(self, "_wd_category_options", []) or []),
            "adv_visible": bool(getattr(self, "_wd_adv_section_visible", False)),
            "progress_visible": bool(getattr(self, "_wd_progress_visible", False)),
            "progress_running": bool(getattr(self, "_wd_progress_running", False)),
            "cancel_requested": bool(getattr(self, "_wd_cancel_requested", False)),
            "loading": bool(getattr(self, "_wd_loading", False)),
        }

    def _wd_bind_context(self, site: str):
        ctx = (self._wd_contexts or {}).get(site)
        if not ctx:
            return
        for name, value in ctx.items():
            setattr(self, name, value)

    def _wd_save_site_state(self, site: str):
        if not site:
            return
        self._wd_site_states[site] = self._wd_capture_site_state()

    def _wd_restore_site_state(self, site: str):
        state = (self._wd_site_states or {}).get(site) or {}
        self.wikidich_filters = dict(state.get("filters", self.wikidich_filters))
        self.wikidich_data = state.get("data", {"username": None, "book_ids": [], "books": {}, "synced_at": None})
        self.wikidich_filtered = list(state.get("filtered", []))
        self.wd_new_chapters = dict(state.get("new_chapters", {}))
        self._wd_pending_categories = list(state.get("pending_categories", []))
        self._wd_category_options = list(state.get("category_options", []))
        self._wd_adv_section_visible = state.get("adv_visible", False)
        self._wd_progress_visible = state.get("progress_visible", False)
        self._wd_progress_running = state.get("progress_running", False)
        self._wd_cancel_requested = state.get("cancel_requested", False)
        self._wd_loading = state.get("loading", False)

    def _wd_set_active_site(self, site: str, skip_save: bool = False):
        site = (site or "").strip().lower()
        if site not in ("wikidich", "koanchay"):
            return
        if site not in (self._wd_contexts or {}):
            return
        current = getattr(self, "wd_site", "wikidich")
        if current == site:
            return
        if not skip_save and current in ("wikidich", "koanchay") and current != site:
            self._wd_save_site_state(current)
            self._wd_clear_resume_state()
            self._wd_clear_detail_resume()
        self.wd_site = site
        self._wd_resume_works = None
        self._wd_resume_details = None
        self._wd_bind_context(site)
        self._wd_restore_site_state(site)
        if hasattr(self, "wd_site_button"):
            other = "koanchay" if site == "wikidich" else "wikidich"
            self.wd_site_button.config(text=other.capitalize(), command=lambda s=other: self._wd_switch_site(s))
        self._wd_update_user_label()
        if getattr(self, "_wd_adv_section_visible", False):
            self._wd_toggle_advanced_section(show=True)
        else:
            self._wd_toggle_advanced_section(show=False)
        if getattr(self, "wikidich_filtered", None) is not None:
            self._wd_refresh_tree(self.wikidich_filtered)
        self._wd_update_progress_visibility(getattr(self, "wd_progress_label", None).cget("text") if hasattr(self, "wd_progress_label") else "")
        self.log(f"[Wikidich] Đang dùng site: {site}")

    def _wd_resume_state_path(self) -> str:
        return os.path.join(BASE_DIR, "local", "wd_resume_works.json")

    def _wd_save_resume_state(self):
        """Lưu trạng thái tải Works để resume khi dính Cloudflare/thoát app."""
        state = getattr(self, "_wd_resume_works", None)
        if not state:
            return
        payload = {
            "site": getattr(self, "wd_site", "wikidich"),
            "state": state,
        }
        try:
            path = self._wd_resume_state_path()
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
        except Exception as exc:
            try:
                self.log(f"[Wikidich] Không lưu được resume Works: {exc}")
            except Exception:
                pass

    def _wd_load_resume_state(self):
        """Đọc trạng thái resume Works từ file (chỉ khi khớp site hiện tại)."""
        try:
            path = self._wd_resume_state_path()
            if not os.path.isfile(path):
                return
            with open(path, "r", encoding="utf-8") as f:
                payload = json.load(f)
            site = payload.get("site")
            state = payload.get("state")
            if site and site != getattr(self, "wd_site", "wikidich"):
                return
            if isinstance(state, dict):
                self._wd_resume_works = state
                try:
                    self.log(f"[Wikidich] Phát hiện tiến độ Works cần resume (site={site}).")
                except Exception:
                    pass
        except Exception as exc:
            try:
                self.log(f"[Wikidich] Không đọc được resume Works: {exc}")
            except Exception:
                pass

    def _wd_clear_resume_state(self):
        """Xóa file resume Works khi đã hoàn tất."""
        try:
            path = self._wd_resume_state_path()
            if os.path.isfile(path):
                os.remove(path)
        except Exception:
            pass
        self._wd_resume_works = None

    def _wd_detail_resume_path(self) -> str:
        return os.path.join(BASE_DIR, "local", "wd_resume_details.json")

    def _wd_save_detail_resume(self, remaining_ids: list):
        """Lưu danh sách truyện còn lại khi tải chi tiết để resume."""
        try:
            if not remaining_ids:
                self._wd_clear_detail_resume()
                return
            payload = {
                "site": getattr(self, "wd_site", "wikidich"),
                "ids": list(dict.fromkeys(remaining_ids)),
            }
            path = self._wd_detail_resume_path()
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
            self._wd_resume_details = payload
        except Exception as exc:
            try:
                self.log(f"[Wikidich] Không lưu được resume chi tiết: {exc}")
            except Exception:
                pass

    def _wd_load_detail_resume(self):
        """Đọc danh sách truyện còn lại cần tải chi tiết (nếu cùng site)."""
        try:
            path = self._wd_detail_resume_path()
            if not os.path.isfile(path):
                return
            with open(path, "r", encoding="utf-8") as f:
                payload = json.load(f)
            site = payload.get("site")
            if site and site != getattr(self, "wd_site", "wikidich"):
                return
            ids = payload.get("ids")
            if isinstance(ids, list) and ids:
                self._wd_resume_details = {"site": site, "ids": list(ids)}
                try:
                    self.log(f"[Wikidich] Phát hiện tiến độ tải chi tiết cần resume ({len(ids)} truyện).")
                except Exception:
                    pass
        except Exception as exc:
            try:
                self.log(f"[Wikidich] Không đọc được resume chi tiết: {exc}")
            except Exception:
                pass

    def _wd_clear_detail_resume(self):
        try:
            path = self._wd_detail_resume_path()
            if os.path.isfile(path):
                os.remove(path)
        except Exception:
            pass
        self._wd_resume_details = None

    def _wd_calculate_new_chapters(self, book: dict, proxies=None, headers=None):
        domains = [
            ("fanqienovel.com", fanqienovel_ext.fetch_chapters, {"headers": headers}),
            ("jjwxc.net", jjwxc_ext.fetch_chapters, {}),
            ("po18.tw", po18_ext.fetch_chapters, {}),
            ("qidian.com", qidian_ext.fetch_chapters, {}),
            ("ihuaben.com", ihuaben_ext.fetch_chapters, {}),
        ]
        for domain, fetcher, extra_args in domains:
            url = self._wd_find_link_with_domain(book, domain)
            if not url:
                continue
            kwargs = {"proxies": proxies}
            kwargs.update({k: v for k, v in extra_args.items() if v is not None})
            result = fetcher(url, **kwargs)
            if not result or result.get('error'):
                if result and result.get('error'):
                    self.log(f"[Wikidich] Không thể lấy chương ({domain}) cho '{book.get('title', '')}': {result['error']}")
                continue
            remote_list = result.get('data') or []
            remote_total = len(remote_list)
            current_total = book.get('chapters') or 0
            try:
                current_total = int(current_total)
            except Exception:
                current_total = 0
            diff = remote_total - current_total
            return diff if diff > 0 else 0
        return None

    def _wd_fetch_details_for_new_books(self, session, data: dict, new_ids: list, current_user: str, delay: float, proxies=None):
        total = len(new_ids)
        if total == 0:
            return
        self.log(f"[Wikidich] Lấy chi tiết cho {total} truyện mới thêm.")
        for idx, bid in enumerate(new_ids, start=1):
            book = data.get("books", {}).get(bid)
            if not book:
                continue
            try:
                updated = wikidich_ext.fetch_book_detail(session, book, current_user, base_url=self._wd_get_base_url(), proxies=proxies)
                data["books"][bid] = updated
            except requests.HTTPError as http_err:
                resp_cf = getattr(http_err, "response", None)
                if self._wd_detect_cloudflare(resp_cf):
                    self.log("[Wikidich] Bị Cloudflare khi lấy chi tiết truyện mới, tạm dừng.")
                    raise wikidich_ext.CloudflareBlocked(data, next_start=len(data.get("book_ids", []) or []), page_size=0)
                self.log(f"[Wikidich] Lỗi khi tải {book.get('title', bid)}: {http_err}")
            except Exception as exc:
                self.log(f"[Wikidich] Lỗi khi tải {book.get('title', bid)}: {exc}")
            self._wd_report_progress("detail", idx, total, f"Chi tiết mới {idx}/{total}")
            if delay > 0:
                time.sleep(delay)

    def _wd_display_cover(self, url: str):
        if not url:
            self.wd_cover_label.config(image='', text="(Không có bìa)")
            return
        if url in self._wd_cover_cache:
            photo = self._wd_cover_cache[url]
            self.wd_cover_label.config(image=photo, text="")
            self.wd_cover_label.image = photo
            return

        def _worker():
            try:
                proxies = self._get_proxy_for_request('images')
                resp = requests.get(url, timeout=25, proxies=proxies)
                resp.raise_for_status()
                img = Image.open(io.BytesIO(resp.content))
                img.thumbnail((220, 320))
                photo = ImageTk.PhotoImage(img)
            except Exception:
                photo = None
            self.after(0, lambda: self._wd_set_cover_image(url, photo))
        threading.Thread(target=_worker, daemon=True).start()

    def _wd_set_cover_image(self, url: str, photo):
        if photo:
            self._wd_cover_cache[url] = photo
            self.wd_cover_label.config(image=photo, text="")
            self.wd_cover_label.image = photo
        else:
            self.wd_cover_label.config(image='', text="(Không tải được bìa)")
            self.wd_cover_label.image = None

    def _wd_get_cache_path(self):
        return (self._wd_cache_paths or {}).get(getattr(self, "wd_site", "wikidich"), self.wikidich_cache_path)

    def _wd_load_cache(self):
        cached = wikidich_ext.load_cache(self._wd_get_cache_path())
        if cached:
            self.wikidich_data = cached
            self._wd_update_user_label()
            self._wd_refresh_category_options()
            self._wd_apply_filters()

    def _wd_save_cache(self):
        try:
            if self.wikidich_data.get('book_ids'):
                wikidich_ext.save_cache(self._wd_get_cache_path(), self.wikidich_data)
        except Exception as e:
            self.log(f"[Wikidich] Không thể lưu cache: {e}")

    def _open_api_settings_dialog(self):
        current = self.api_settings or {}
        wiki_min = current.get('wiki_delay_min', DEFAULT_API_SETTINGS['wiki_delay_min'])
        wiki_max = current.get('wiki_delay_max', DEFAULT_API_SETTINGS['wiki_delay_max'])
        fanqie_min = current.get('fanqie_delay_min', DEFAULT_API_SETTINGS['fanqie_delay_min'])
        fanqie_max = current.get('fanqie_delay_max', DEFAULT_API_SETTINGS['fanqie_delay_max'])
        open_mode_var = tk.StringVar(value=getattr(self, "wikidich_open_mode", "in_app"))
        upload_cfg = self.wikidich_upload_settings if isinstance(getattr(self, "wikidich_upload_settings", None), dict) else {}
        up_filename_var = tk.StringVar(value=upload_cfg.get("filename_regex", DEFAULT_UPLOAD_SETTINGS["filename_regex"]))
        up_content_var = tk.StringVar(value=upload_cfg.get("content_regex", DEFAULT_UPLOAD_SETTINGS["content_regex"]))
        up_template_var = tk.StringVar(value=upload_cfg.get("template", DEFAULT_UPLOAD_SETTINGS["template"]))
        up_priority_var = tk.StringVar(value=upload_cfg.get("priority", DEFAULT_UPLOAD_SETTINGS["priority"]))
        up_warn_var = tk.DoubleVar(value=upload_cfg.get("warn_kb", DEFAULT_UPLOAD_SETTINGS["warn_kb"]))
        up_sort_var = tk.BooleanVar(value=upload_cfg.get("sort_by_number", DEFAULT_UPLOAD_SETTINGS["sort_by_number"]))
        up_append_desc_var = tk.StringVar(value=upload_cfg.get("append_desc", DEFAULT_UPLOAD_SETTINGS["append_desc"]))
        auto_credit_var = tk.BooleanVar(value=bool(current.get("auto_credit", True)))
        auto_credit_var = tk.BooleanVar(value=bool(current.get("auto_credit", True)))

        win = tk.Toplevel(self)
        self._apply_window_icon(win)
        win.title("Cài đặt request")
        container = ttk.Frame(win, padding=12)
        container.pack(fill="both", expand=True)

        delay_frame = ttk.LabelFrame(container, text="Độ trễ giữa các request (giây)", padding=10)
        delay_frame.pack(fill="x", expand=True)

        wiki_row = ttk.Frame(delay_frame)
        wiki_row.pack(fill="x", pady=4)
        ttk.Label(wiki_row, text="Wiki:").pack(side=tk.LEFT)
        wiki_min_var = tk.DoubleVar(value=wiki_min)
        wiki_max_var = tk.DoubleVar(value=wiki_max)
        ttk.Label(wiki_row, text="Từ").pack(side=tk.LEFT, padx=(8, 2))
        ttk.Entry(wiki_row, textvariable=wiki_min_var, width=8).pack(side=tk.LEFT)
        ttk.Label(wiki_row, text="đến").pack(side=tk.LEFT, padx=(6, 2))
        ttk.Entry(wiki_row, textvariable=wiki_max_var, width=8).pack(side=tk.LEFT)

        fanqie_row = ttk.Frame(delay_frame)
        fanqie_row.pack(fill="x", pady=4)
        ttk.Label(fanqie_row, text="Fanqie:").pack(side=tk.LEFT)
        fanqie_min_var = tk.DoubleVar(value=fanqie_min)
        fanqie_max_var = tk.DoubleVar(value=fanqie_max)
        ttk.Label(fanqie_row, text="Từ").pack(side=tk.LEFT, padx=(8, 2))
        ttk.Entry(fanqie_row, textvariable=fanqie_min_var, width=8).pack(side=tk.LEFT)
        ttk.Label(fanqie_row, text="đến").pack(side=tk.LEFT, padx=(6, 2))
        ttk.Entry(fanqie_row, textvariable=fanqie_max_var, width=8).pack(side=tk.LEFT)

        open_mode_frame = ttk.LabelFrame(container, text="Mở link Wikidich", padding=10)
        open_mode_frame.pack(fill="x", expand=True, pady=(10, 0))
        ttk.Radiobutton(open_mode_frame, text="Trình duyệt tích hợp (Overlay)", variable=open_mode_var, value="in_app").pack(anchor="w")
        ttk.Radiobutton(open_mode_frame, text="Trình duyệt ngoài (mặc định hệ thống)", variable=open_mode_var, value="external").pack(anchor="w", pady=(4, 0))

        upload_frame = ttk.LabelFrame(container, text="Upload chương Wikidich", padding=10)
        upload_frame.pack(fill="x", expand=True, pady=(10, 0))
        ttk.Label(upload_frame, text="Regex tên file:").grid(row=0, column=0, sticky="w")
        ttk.Entry(upload_frame, textvariable=up_filename_var, width=42).grid(row=0, column=1, sticky="ew", padx=(6, 0))
        ttk.Label(upload_frame, text="Regex nội dung:").grid(row=1, column=0, sticky="w", pady=(6, 0))
        ttk.Entry(upload_frame, textvariable=up_content_var, width=42).grid(row=1, column=1, sticky="ew", padx=(6, 0), pady=(6, 0))
        ttk.Label(upload_frame, text="Template tên chương:").grid(row=2, column=0, sticky="w", pady=(6, 0))
        ttk.Entry(upload_frame, textvariable=up_template_var, width=42).grid(row=2, column=1, sticky="ew", padx=(6, 0), pady=(6, 0))
        ttk.Label(upload_frame, text="Mô tả bổ sung mặc định:").grid(row=3, column=0, sticky="w", pady=(6, 0))
        ttk.Entry(upload_frame, textvariable=up_append_desc_var, width=42).grid(row=3, column=1, sticky="ew", padx=(6, 0), pady=(6, 0))
        priority_row = ttk.Frame(upload_frame)
        priority_row.grid(row=4, column=0, columnspan=2, sticky="w", pady=(6, 0))
        ttk.Label(priority_row, text="Ưu tiên parse:").pack(side=tk.LEFT)
        ttk.Radiobutton(priority_row, text="Tên file", variable=up_priority_var, value="filename").pack(side=tk.LEFT, padx=(8, 0))
        ttk.Radiobutton(priority_row, text="Dòng đầu", variable=up_priority_var, value="content").pack(side=tk.LEFT, padx=(8, 0))
        opts_row = ttk.Frame(upload_frame)
        opts_row.grid(row=5, column=0, columnspan=2, sticky="w", pady=(6, 0))
        ttk.Checkbutton(opts_row, text="Sắp xếp theo số chương", variable=up_sort_var).pack(side=tk.LEFT)
        ttk.Label(opts_row, text="Cảnh báo nếu file <").pack(side=tk.LEFT, padx=(10, 4))
        ttk.Entry(opts_row, textvariable=up_warn_var, width=6).pack(side=tk.LEFT)
        ttk.Label(opts_row, text="KB").pack(side=tk.LEFT, padx=(4, 0))
        credit_row = ttk.Frame(upload_frame)
        credit_row.grid(row=6, column=0, columnspan=2, sticky="w", pady=(6, 0))
        ttk.Checkbutton(credit_row, text="Auto update: tự động thêm Credit vào file tải bổ sung", variable=auto_credit_var).pack(side=tk.LEFT)
        upload_frame.columnconfigure(1, weight=1)

        action_frame = ttk.Frame(container)
        action_frame.pack(fill="x", pady=(12, 0))

        def _reset_defaults():
            wiki_min_var.set(DEFAULT_API_SETTINGS['wiki_delay_min'])
            wiki_max_var.set(DEFAULT_API_SETTINGS['wiki_delay_max'])
            fanqie_min_var.set(DEFAULT_API_SETTINGS['fanqie_delay_min'])
            fanqie_max_var.set(DEFAULT_API_SETTINGS['fanqie_delay_max'])
            open_mode_var.set("in_app")
            up_filename_var.set(DEFAULT_UPLOAD_SETTINGS["filename_regex"])
            up_content_var.set(DEFAULT_UPLOAD_SETTINGS["content_regex"])
            up_template_var.set(DEFAULT_UPLOAD_SETTINGS["template"])
            up_priority_var.set(DEFAULT_UPLOAD_SETTINGS["priority"])
            up_warn_var.set(DEFAULT_UPLOAD_SETTINGS["warn_kb"])
            up_sort_var.set(DEFAULT_UPLOAD_SETTINGS["sort_by_number"])
            up_append_desc_var.set(DEFAULT_UPLOAD_SETTINGS["append_desc"])
            auto_credit_var.set(True)

        def _save_settings():
            try:
                wiki_min_val = float(wiki_min_var.get())
                wiki_max_val = float(wiki_max_var.get())
                fanqie_min_val = float(fanqie_min_var.get())
                fanqie_max_val = float(fanqie_max_var.get())
                warn_val = float(up_warn_var.get())
            except Exception:
                messagebox.showerror("Lỗi", "Giá trị độ trễ/cảnh báo phải là số.", parent=win)
                return
            if wiki_min_val < 0 or wiki_max_val < 0 or fanqie_min_val < 0 or fanqie_max_val < 0:
                messagebox.showerror("Lỗi", "Độ trễ không được âm.", parent=win)
                return
            if wiki_max_val < wiki_min_val:
                wiki_max_val = wiki_min_val
            if fanqie_max_val < fanqie_min_val:
                fanqie_max_val = fanqie_min_val
            warn_val = max(0.0, warn_val)

            self.api_settings = {
                'wiki_delay_min': wiki_min_val,
                'wiki_delay_max': wiki_max_val,
                'fanqie_delay_min': fanqie_min_val,
                'fanqie_delay_max': fanqie_max_val,
                'wiki_headers': dict(DEFAULT_API_SETTINGS['wiki_headers']),
                'fanqie_headers': dict(DEFAULT_API_SETTINGS['fanqie_headers']),
                'auto_credit': auto_credit_var.get()
            }
            self.wikidich_open_mode = open_mode_var.get() or "in_app"
            priority_val = up_priority_var.get() if up_priority_var.get() in ("filename", "content") else DEFAULT_UPLOAD_SETTINGS["priority"]
            self.wikidich_upload_settings = {
                "filename_regex": up_filename_var.get().strip() or DEFAULT_UPLOAD_SETTINGS["filename_regex"],
                "content_regex": up_content_var.get().strip() or DEFAULT_UPLOAD_SETTINGS["content_regex"],
                "template": up_template_var.get().strip() or DEFAULT_UPLOAD_SETTINGS["template"],
                "priority": priority_val,
                "warn_kb": warn_val,
                "append_desc": up_append_desc_var.get().strip(),
                "sort_by_number": bool(up_sort_var.get()),
            }
            self.app_config['api_settings'] = dict(self.api_settings)
            self.app_config['wikidich_upload_settings'] = dict(self.wikidich_upload_settings)
            self.save_config()
            messagebox.showinfo("Đã lưu", "Đã lưu cài đặt request.", parent=win)
            win.destroy()

        ttk.Button(action_frame, text="Trở về mặc định", command=_reset_defaults).pack(side=tk.LEFT)
        ttk.Button(action_frame, text="Lưu", command=_save_settings).pack(side=tk.RIGHT, padx=(6, 0))
        ttk.Button(action_frame, text="Đóng", command=win.destroy).pack(side=tk.RIGHT)

    def _wd_prompt_detail_fetch(self):
        if self._wd_loading:
            messagebox.showinfo("Đang chạy", "Đang có tác vụ Wikidich khác đang chạy.")
            return
        if not self.wikidich_data.get('book_ids'):
            messagebox.showinfo("Chưa có dữ liệu", "Vui lòng tải works trước.")
            return
        win = tk.Toplevel(self)
        self._apply_window_icon(win)
        win.title("Tùy chọn tải chi tiết")
        container = ttk.Frame(win, padding=12)
        container.pack(fill="both", expand=True)
        ttk.Label(container, text="Chọn phạm vi tải chi tiết").pack(anchor="w")
        missing_var = tk.BooleanVar(value=self.wd_missing_only_var.get())
        ttk.Checkbutton(container, text="Chỉ bổ sung chi tiết còn thiếu", variable=missing_var).pack(anchor="w", pady=(6, 0))
        sync_counts_only_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(container, text="Chỉ đồng bộ số chương (dùng Works, không tải văn án)", variable=sync_counts_only_var).pack(anchor="w", pady=(6, 0))

        scope_var = tk.StringVar(value=self.wd_detail_scope_var.get())
        ttk.Label(container, text="Phạm vi:").pack(anchor="w", pady=(12, 4))
        ttk.Radiobutton(container, text="Tất cả truyện đã thu thập", variable=scope_var, value="all").pack(anchor="w")
        ttk.Radiobutton(container, text="Chỉ các truyện đang áp dụng bộ lọc (kể cả nâng cao)", variable=scope_var, value="filtered").pack(anchor="w", pady=(2, 0))

        btn_frame = ttk.Frame(container)
        btn_frame.pack(fill=tk.X, pady=(16, 0))

        def _start():
            self.wd_missing_only_var.set(missing_var.get())
            self.wd_detail_scope_var.set(scope_var.get())
            win.destroy()
            self._wd_start_fetch_details(sync_counts_only=sync_counts_only_var.get())

        ttk.Button(btn_frame, text="Bắt đầu tải", command=_start).pack(side=tk.RIGHT)
        ttk.Button(btn_frame, text="Hủy", command=win.destroy).pack(side=tk.RIGHT, padx=(0, 8))

    def _wd_toggle_advanced_section(self, show=None):
        if not hasattr(self, "wd_adv_container"):
            return
        if show is None:
            show = not getattr(self, "_wd_adv_section_visible", False)
        if show:
            self.wd_adv_container.grid()
        else:
            self.wd_adv_container.grid_remove()
        self._wd_adv_section_visible = show
        if hasattr(self, "wd_adv_toggle_btn"):
            self.wd_adv_toggle_btn.config(text="Ẩn lọc nâng cao" if show else "Hiện lọc nâng cao")

    def _wd_has_advanced_filters(self):
        if not hasattr(self, "wd_role_vars"):
            return False
        if self.wd_from_date_var.get().strip() or self.wd_to_date_var.get().strip():
            return True
        if self._wd_get_selected_categories():
            return True
        if any(var.get() for var in self.wd_role_vars.values()):
            return True
        return False

    def _wd_update_adv_status(self):
        if not hasattr(self, "wd_adv_status_var"):
            return
        parts = []
        if self.wd_from_date_var.get().strip() or self.wd_to_date_var.get().strip():
            parts.append("Ngày cập nhật")
        if self._wd_get_selected_categories():
            parts.append("Thể loại")
        if any(var.get() for var in getattr(self, "wd_role_vars", {}).values()):
            parts.append("Vai trò")
        text = f"Đang áp dụng lọc nâng cao ({', '.join(parts)})" if parts else ""
        self.wd_adv_status_var.set(text)
        self._wd_update_status_ticker()

    def _wd_update_basic_status(self):
        if not hasattr(self, "wd_basic_status_var"):
            return
        parts = []
        search = self.wd_search_var.get().strip()
        if search:
            parts.append(f"Tên/TG chứa '{search}'")
        summary = self.wd_summary_var.get().strip()
        if summary:
            parts.append(f"Văn án chứa '{summary}'")
        extra_link = getattr(self, "wd_extra_link_var", tk.StringVar(value="")).get().strip() if hasattr(self, "wd_extra_link_var") else ""
        if extra_link:
            parts.append(f"Link bổ sung chứa '{extra_link}'")
        status = self.wd_status_var.get()
        if status and status != "all":
            parts.append(f"Trạng thái: {status}")
        text = f"Đang lọc cơ bản ({', '.join(parts)})" if parts else ""
        self.wd_basic_status_var.set(text)
        self._wd_update_status_ticker()

    def _wd_update_status_ticker(self):
        if not hasattr(self, "wd_status_ticker_var"):
            return
        if getattr(self, "_wd_status_ticker_job", None):
            try:
                self.after_cancel(self._wd_status_ticker_job)
            except Exception:
                pass
            self._wd_status_ticker_job = None
        basic = self.wd_basic_status_var.get().strip() if hasattr(self, "wd_basic_status_var") else ""
        adv = self.wd_adv_status_var.get().strip() if hasattr(self, "wd_adv_status_var") else ""
        combined = " | ".join([t for t in (basic, adv) if t])
        self.wd_status_ticker_text = combined
        self._wd_status_ticker_index = 0
        self._wd_tick_status_ticker()

    def _wd_tick_status_ticker(self):
        if not hasattr(self, "wd_status_ticker_var"):
            return
        text = getattr(self, "wd_status_ticker_text", "") or ""
        window = getattr(self, "_wd_status_ticker_window", 60)
        if not text:
            self.wd_status_ticker_var.set("")
            self._wd_status_ticker_job = None
            return
        if len(text) <= window:
            self.wd_status_ticker_var.set(text)
            self._wd_status_ticker_job = None
            return
        buffer = text + "   |   "
        start = getattr(self, "_wd_status_ticker_index", 0) % len(buffer)
        doubled = buffer + buffer
        display = doubled[start:start + window]
        self.wd_status_ticker_var.set(display)
        self._wd_status_ticker_index = (start + 1) % len(buffer)
        try:
            delay = max(40, getattr(self, "_wd_status_ticker_delay", 80))
            self._wd_status_ticker_job = self.after(delay, self._wd_tick_status_ticker)
        except Exception:
            self._wd_status_ticker_job = None

    def _wd_expand_basic_section(self):
        frame = getattr(self, "_wd_filter_frame", None)
        if frame:
            try:
                opts = getattr(self, "_wd_filter_frame_grid_opts", {})
                frame.grid(**opts) if opts else frame.grid()
            except Exception:
                pass
        self._wd_basic_collapsed = False
        if hasattr(self, "wd_basic_toggle_btn"):
            try:
                self.wd_basic_toggle_btn.config(text="Thu gọn lọc cơ bản")
            except Exception:
                pass

    def _wd_collapse_basic_section(self):
        frame = getattr(self, "_wd_filter_frame", None)
        if frame:
            try:
                frame.grid_remove()
            except Exception:
                pass
        self._wd_basic_collapsed = True
        if hasattr(self, "wd_basic_toggle_btn"):
            try:
                self.wd_basic_toggle_btn.config(text="Mở lọc cơ bản")
            except Exception:
                pass

    def _wd_toggle_basic_section(self, collapse=None):
        if collapse is None:
            collapse = not getattr(self, "_wd_basic_collapsed", False)
        if collapse:
            self._wd_collapse_basic_section()
        else:
            self._wd_expand_basic_section()

    def _wd_apply_credit_to_files(self, files: list):
        if not getattr(self, "_should_auto_credit", lambda: True)() or not files:
            return
        credit_text = ""
        pos = "top"
        line_num = 1
        try:
            credit_text = self.credit_text_widget.get("1.0", tk.END).strip()
            pos = self.credit_position.get()
            line_num = int(self.credit_line_num.get())
        except Exception:
            cfg = self.app_config or {}
            credit_text = str(cfg.get("credit_text", "")).strip()
            pos = cfg.get("credit_position", "top")
            try:
                line_num = int(cfg.get("credit_line_num", 1))
            except Exception:
                line_num = 1
        if not credit_text:
            return
        for item in files:
            path = item.get("path")
            if not path or not os.path.isfile(path):
                continue
            try:
                logic.modify_content(path, credit_text, pos, line_num)
            except Exception as exc:
                self.log(f"[AutoCredit] Lỗi thêm credit vào {os.path.basename(path)}: {exc}")

    def _wd_fetch_detail_for_book(self, book: dict):
        if not book or not book.get("id"):
            return None
        session, current_user, proxies = self._wd_build_wiki_session(include_user=True)
        if not session or not current_user:
            return None
        try:
            updated = wikidich_ext.fetch_book_detail(
                session,
                book,
                current_user,
                base_url=self._wd_get_base_url(),
                proxies=proxies,
                skip_chapter_count=True
            )
            self.wikidich_data["books"][book["id"]] = updated
            self._wd_save_cache()
            return updated
        except Exception as exc:
            self.log(f"[Wikidich] Lỗi tải chi tiết nhanh: {exc}")
            return None

    def _wd_auto_update_fanqie(self):
        book = getattr(self, "wd_selected_book", None)
        if not book:
            messagebox.showinfo("Chưa chọn truyện", "Chọn một truyện có link Fanqie trước.", parent=self)
            return
        fanqie_link = self._wd_get_fanqie_link(book)
        if not fanqie_link:
            messagebox.showinfo("Không có link Fanqie", "Chỉ hỗ trợ Auto update cho truyện có link Fanqie.", parent=self)
            return
        if self._wd_loading:
            messagebox.showinfo("Đang chạy", "Vui lòng chờ tác vụ Wikidich hiện tại kết thúc.", parent=self)
            return
        threading.Thread(target=self._wd_auto_update_worker, args=(dict(book), fanqie_link), daemon=True).start()

    def _wd_auto_update_worker(self, book: dict, fanqie_link: str):
        pythoncom.CoInitialize()
        self._wd_loading = True
        desc_text = ""
        try:
            book_id = book.get("id")
            self._wd_set_progress("Đang bật fanqie_bridge...", 0, 0)
            if not self._ensure_fanqie_bridge_ready():
                self._wd_set_progress("Không bật được fanqie_bridge", 0, 1)
                self.after(0, lambda: messagebox.showerror("Lỗi", "Không khởi chạy được fanqie_bridge_win.exe.", parent=self))
                return

            self._wd_set_progress("Đang tải chi tiết Wikidich...", 0, 0)
            fetched_detail = self._wd_fetch_detail_for_book(book)
            updated_book = fetched_detail or book
            if not fetched_detail:
                self.log("[Fanqie][Auto] Không tải được chi tiết mới, dùng dữ liệu hiện có.")
            if updated_book and updated_book.get("id"):
                self.wd_selected_book = updated_book
            book = updated_book or book
            try:
                wiki_chapters = int(book.get("chapters") or 0)
            except Exception:
                wiki_chapters = 0

            proxies = self._get_proxy_for_request("fanqie")
            fanqie_headers = self._get_fanqie_headers()
            fanqie_book_id = self._fanqie_extract_book_id(fanqie_link)
            if not fanqie_book_id:
                self.after(0, lambda: messagebox.showerror("Lỗi", "Không tìm thấy book_id trong link Fanqie.", parent=self))
                self._wd_set_progress("Thiếu book_id Fanqie", 0, 1)
                return

            self._wd_set_progress("Đang tải mục lục Fanqie...", 0, 0)
            toc = self._fanqie_fetch_toc(fanqie_book_id, proxies=proxies, headers=fanqie_headers)
            fanqie_total = len(toc)
            if fanqie_total == 0:
                self.after(0, lambda: messagebox.showerror("Lỗi", "Không lấy được mục lục Fanqie.", parent=self))
                self._wd_set_progress("Không có mục lục Fanqie", 0, 1)
                return

            diff = max(0, fanqie_total - wiki_chapters)
            def _update_new_count():
                if not isinstance(self.wd_new_chapters, dict):
                    self.wd_new_chapters = {}
                if diff > 0 and book_id:
                    self.wd_new_chapters[book_id] = diff
                elif book_id and book_id in self.wd_new_chapters:
                    self.wd_new_chapters.pop(book_id, None)
                if getattr(self, "wikidich_filtered", None) is not None:
                    self._wd_refresh_tree(self.wikidich_filtered)
                else:
                    self._wd_apply_filters()
                if book_id:
                    self._wd_select_tree_item(book_id)
            self.after(0, _update_new_count)

            if diff <= 0:
                self._wd_set_progress("Không có chương mới", 0, 1)
                self.after(0, lambda: messagebox.showinfo("Không có chương mới", f"Wiki: {wiki_chapters} | Fanqie: {fanqie_total}", parent=self))
                return

            new_items = toc[wiki_chapters:]
            if not new_items:
                self._wd_set_progress("Không tìm thấy chương mới", 0, 1)
                return
            if len(new_items) < 2:
                self._wd_set_progress("Cần >=2 chương để Auto update", 0, 1)
                self.after(0, lambda: messagebox.showinfo("Quá ít chương", "Auto update chỉ chạy khi có từ 2 chương mới trở lên.", parent=self))
                return

            tmp_dir = self._prepare_auto_update_dir(book_id or "auto")
            fallback_titles = {str(item.get("id") or item["num"]): item.get("title") for item in new_items}
            ids = [str(item.get("id") or item["num"]) for item in new_items if item.get("id") or item.get("num")]
            fetched = {}
            batch_size = 18
            for idx in range(0, len(ids), batch_size):
                batch_ids = ids[idx:idx + batch_size]
                part = self._fanqie_download_batch(batch_ids, fallback_titles)
                fetched.update(part)
                self._wd_set_progress(f"Tải chương Fanqie {min(len(ids), idx + batch_size)}/{len(ids)}", idx + len(batch_ids), len(ids))
            upload_cfg = {**DEFAULT_UPLOAD_SETTINGS, **(self.wikidich_upload_settings or {})}
            tpl = upload_cfg.get("template", DEFAULT_UPLOAD_SETTINGS["template"]) or "第{num}章 {title}"
            parsed_files = []
            start_num = wiki_chapters + 1
            missing_content = []
            for offset, item in enumerate(new_items):
                chap_num = start_num + offset
                cid = str(item.get("id") or item["num"])
                payload = fetched.get(cid, {})
                content_val = payload.get("content") if isinstance(payload, dict) else None
                if content_val is None or (isinstance(content_val, str) and not content_val.strip()):
                    missing_content.append((chap_num, cid))
            if missing_content:
                sample = ", ".join(f"#{c} (id={cid})" for c, cid in missing_content[:5])
                more = "" if len(missing_content) <= 5 else f"... và {len(missing_content) - 5} chương khác"
                self.log(f"[Fanqie][Auto] Dừng: {len(missing_content)} chương thiếu nội dung ({sample}{more}).")
                self._wd_set_progress("Thiếu nội dung Fanqie", 0, 1)
                self.after(0, lambda: messagebox.showerror(
                    "Thiếu nội dung",
                    f"Không tải được nội dung {len(missing_content)} chương: {sample}{more}",
                    parent=self
                ))
                return

            for offset, item in enumerate(new_items):
                chap_num = start_num + offset
                cid = str(item.get("id") or item["num"])
                payload = fetched.get(cid, {})
                title = payload.get("title") or item.get("title") or f"Chương {chap_num}"
                content = payload.get("content")
                safe_title = re.sub(r'[\\/:*?"<>|]+', "_", title).strip() or f"{chap_num}"
                filename = f"{safe_title}.txt"
                path = os.path.join(tmp_dir, filename)
                # Lưu file chỉ chứa tiêu đề Fanqie (không thêm số chương)
                heading = title
                final_text = f"{heading}\n\n{self._fanqie_content_to_text(content)}".strip() + "\n"
                try:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(final_text)
                except Exception as exc:
                    self.log(f"[Fanqie][Auto] Lỗi ghi file {filename}: {exc}")
                    continue
                size = 0
                try:
                    size = os.path.getsize(path)
                except Exception:
                    size = 0
                parsed_files.append({"path": path, "num": chap_num, "raw_title": title, "size": size})
            try:
                warn_kb = float(upload_cfg.get("warn_kb", DEFAULT_UPLOAD_SETTINGS["warn_kb"]))
            except Exception:
                warn_kb = DEFAULT_UPLOAD_SETTINGS["warn_kb"]
            warn_kb = max(0.0, warn_kb)
            warn_bytes = warn_kb * 1024
            warn_messages = []
            if warn_bytes > 0:
                small = [p for p in parsed_files if p.get("size", 0) and p["size"] < warn_bytes]
                if small:
                    names = ", ".join(os.path.basename(p["path"]) for p in small[:5])
                    more = "" if len(small) <= 5 else f"... (+{len(small) - 5})"
                    msg = f"{len(small)} file < {int(warn_kb)}KB: {names}{more}"
                    self.log(f"[Fanqie][Auto] {msg}")
                    self.after(0, lambda: messagebox.showwarning("File quá nhỏ", msg, parent=self))
                    warn_messages.append(msg)
            try:
                self._wd_apply_credit_to_files(parsed_files)
            except Exception as exc:
                self.log(f"[AutoCredit] Lỗi khi thêm credit tự động: {exc}")
            if not parsed_files:
                self._wd_set_progress("Không tạo được file mới", 0, 1)
                self.after(0, lambda: messagebox.showerror("Lỗi", "Không tạo được file chương mới.", parent=self))
                return
            end_num = start_num + len(parsed_files) - 1
            desc_text = f"{start_num}-{end_num}"
            # cập nhật ngày update về hiện tại sau auto update
            try:
                today_text = datetime.now().strftime("%d-%m-%Y")
                if book_id and isinstance(self.wikidich_data.get("books"), dict) and book_id in self.wikidich_data["books"]:
                    self.wikidich_data["books"][book_id]["updated_text"] = today_text
                if isinstance(book, dict):
                    book["updated_text"] = today_text
                self._wd_save_cache()
                def _refresh_updated():
                    if getattr(self, "wikidich_filtered", None) is not None:
                        self._wd_refresh_tree(self.wikidich_filtered)
                        if book_id:
                            self._wd_select_tree_item(book_id)
                    else:
                        self._wd_apply_filters()
                    sel = getattr(self, "wd_selected_book", None)
                    if sel and sel.get("id") == book_id:
                        self._wd_show_detail(sel)
                try:
                    self.after(0, _refresh_updated)
                except Exception:
                    _refresh_updated()
            except Exception:
                pass
            self._wd_set_progress("Sẵn sàng upload bổ sung", 0, 1)
            self.after(0, lambda b=dict(book): self._wd_open_wiki_edit_uploader(prefill={
                "parsed_files": parsed_files,
                "desc": desc_text,
                "select_append_volume": True,
                "full_preview": True,
                "raw_title_only": True,
                "source_label": f"Tự động tải {len(parsed_files)} chương mới",
                "warn_messages": warn_messages,
            }, book_override=b))
        except Exception as exc:
            self.log(f"[Fanqie][Auto] Lỗi: {exc}")
            self.after(0, lambda: messagebox.showerror("Lỗi", f"Tác vụ Auto update thất bại: {exc}", parent=self))
        finally:
            self._wd_loading = False
            self._wd_progress_running = False
            pythoncom.CoUninitialize()
            self._wd_set_progress("Chờ thao tác...", 0, 1)
