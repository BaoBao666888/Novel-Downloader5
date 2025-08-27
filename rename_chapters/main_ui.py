# main_ui.py
import os
import re
import io
import time
import tkinter.font as tkfont
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext, simpledialog
import requests
from PIL import Image, ImageTk, ImageFilter
import numpy as np
import cv2
import renamer_logic as logic
import json
import threading
import urllib.request
from packaging.version import parse as parse_version
from extensions import jjwxc_ext
from extensions import po18_ext
from extensions import qidian_ext
from extensions import fanqienovel_ext
from text_operations import TextOperations
from update import show_update_window, fetch_manifest_from_url
import translator_logic as trans_logic
import pythoncom
import random
from concurrent.futures import ThreadPoolExecutor, as_completed

class RenamerApp(tk.Tk):
    CURRENT_VERSION = "0.1.4"
    VERSION_CHECK_URL = "https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/refs/heads/main/rename_chapters/version.json"
    def __init__(self):
        super().__init__()
        self.title("Rename Chapters v0.1.4 (by BaoBao)")
        self.geometry("1200x800")

        # --- BIẾN TRẠNG THÁI ---
        self.text_modified = tk.BooleanVar(value=False)
        self.folder_path = tk.StringVar()
        self.selected_file = tk.StringVar()
        self.files_data = []
        self.preview_job = None
        self.sorted_files_cache = []
        self.excluded_files = set()
        self.sort_strategy = tk.StringVar(value="content")
        self.combine_titles_var = tk.BooleanVar(value=False)
        self.title_format_var = tk.StringVar(value="{t1} - {t2}")

        self.downloaded_image_data = None
        self.image_zoom_factor = 1.0
        self.image_original_pil = None
        self.image_display_pil = None
        self.tk_photo_image = None
        self._image_drag_data = {"x": 0, "y": 0}

        self.app_config = {}
        self._set_default_config()

        self.create_widgets()
        self.load_config()
        self.check_for_updates()
        self.protocol("WM_DELETE_WINDOW", self.on_closing)

    def _set_default_config(self):
        """Khởi tạo các giá trị mặc định cho config."""
        self.app_config = {
            'nameSets': {'Mặc định': {}},
            'activeNameSet': 'Mặc định',
            'translator_settings': {
                'serverUrl': 'https://dichngay.com/translate/text',
                'hanvietJsonUrl': 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/han_viet/output.json',
                'delayMs': 400,
                'maxChars': 4500
            },
            'proxy_settings': {
                'proxies': [],
                'use_for_fetch_titles': False,
                'use_for_translate': False,
                'use_for_images': False
            }
        }

    def on_closing(self):
        """Hỏi lưu file nếu cần, sau đó lưu cấu hình trước khi đóng."""
        if self.text_modified.get():
            response = messagebox.askyesnocancel(
                "Lưu thay đổi?",
                "Bạn có các thay đổi chưa được lưu. Bạn có muốn lưu chúng trước khi thoát không?"
            )
            if response is True:
                saved_successfully = self._save_changes()
                if not saved_successfully:
                    return
            elif response is None:
                return
        self.save_config()
        self.destroy()

    def save_config(self):
        """Thu thập và lưu tất cả cài đặt vào file config.json."""
        # Cập nhật các giá trị từ UI vào self.app_config
        self.app_config.update({
            'folder_path': self.folder_path.get(),
            'rename_strategy': self.strategy.get(),
            'sort_strategy': self.sort_strategy.get(),
            'rename_format': self.format_combobox.get(),
            'rename_format_history': list(self.format_combobox['values']),
            'filename_regexes': self.filename_regex_text.get("1.0", tk.END).strip(),
            'content_regexes': self.content_regex_text.get("1.0", tk.END).strip(),
            'credit_text': self.credit_text_widget.get("1.0", tk.END).strip(),
            'credit_position': self.credit_position.get(),
            'credit_line_num': self.credit_line_num.get(),
            'find_replace_history': {
                'find': list(self.find_text['values']),
                'replace': list(self.replace_text['values'])
            },
            'split_regex_history': list(self.split_regex['values']),
            'split_format_history': list(self.split_format_combobox['values']),
            'selected_file': self.selected_file.get(),
            'split_position': self.split_position.get(),
            'combine_titles': self.combine_titles_var.get(),
            'title_format': self.title_format_var.get(),
        })
        try:
            with open('config.json', 'w', encoding='utf-8') as f:
                json.dump(self.app_config, f, indent=4)
        except Exception as e:
            print(f"Không thể lưu config: {e}")

    # main_ui.py

    def load_config(self):
        """Tải và áp dụng cài đặt từ config.json nếu có."""
        try:
            if os.path.exists('config.json'):
                with open('config.json', 'r', encoding='utf-8') as f:
                    loaded_config = json.load(f)
                for key, value in loaded_config.items():
                    if isinstance(value, dict) and key in self.app_config:
                        self.app_config[key].update(value)
                    else:
                        self.app_config[key] = value

            config_data = self.app_config
            self.folder_path.set(config_data.get('folder_path', ''))
            self.strategy.set(config_data.get('rename_strategy', 'content_first'))
            self.sort_strategy.set(config_data.get('sort_strategy', 'content'))
            
            format_history = config_data.get('rename_format_history', [])
            if not format_history: format_history = ["Chương {num} - {title}.txt"]
            self.format_combobox['values'] = format_history
            self.format_combobox.set(config_data.get('rename_format', format_history[0]))
            
            self.filename_regex_text.delete("1.0", tk.END); self.filename_regex_text.insert("1.0", config_data.get('filename_regexes', ''))
            self.content_regex_text.delete("1.0", tk.END); self.content_regex_text.insert("1.0", config_data.get('content_regexes', ''))
            self.credit_text_widget.delete("1.0", tk.END); self.credit_text_widget.insert("1.0", config_data.get('credit_text', ''))
            self.credit_position.set(config_data.get('credit_position', 'top'))
            self.credit_line_num.set(config_data.get('credit_line_num', 2))
            
            fr_history = config_data.get('find_replace_history', {}); self.find_text['values'] = fr_history.get('find', []); self.replace_text['values'] = fr_history.get('replace', [])
            self.split_regex['values'] = config_data.get('split_regex_history', [])
            
            split_format_history = config_data.get('split_format_history', []); self.split_format_combobox['values'] = split_format_history or ["{num}.txt"]; self.split_format_combobox.set((split_format_history or ["{num}.txt"])[0])
            self.split_position.set(config_data.get('split_position', 'after'))
            self.combine_titles_var.set(config_data.get('combine_titles', False)); self.title_format_var.set(config_data.get('title_format', '{t1} - {t2}'))
            
            name_sets_keys = list(self.app_config.get('nameSets', {}).keys())
            if name_sets_keys:
                self.translator_name_set_combo['values'] = name_sets_keys
            
            active_set = config_data.get('activeNameSet', 'Mặc định')
            if active_set in name_sets_keys:
                self.translator_name_set_combo.set(active_set)
            elif name_sets_keys:
                self.translator_name_set_combo.set(name_sets_keys[0])
            self._refresh_translator_name_preview()

            if self.folder_path.get(): self.schedule_preview_update()
            self.selected_file.set(config_data.get('selected_file', ''))
        except Exception as e:
            print(f"Không thể tải config: {e}")
            self.log("Không tìm thấy file config hoặc file bị lỗi. Sử dụng cài đặt mặc định.")

    def check_for_updates(self, manual_check=False):
        """Kiểm tra phiên bản mới (thread riêng)."""
        def _check():
            try:
                manifest = None
                # Thử fetch manifest từ remote (VERSION_CHECK_URL)
                try:
                    manifest = fetch_manifest_from_url(self.VERSION_CHECK_URL, timeout=10)
                except Exception:
                    manifest = None

                # Nếu không lấy được manifest online, thử đọc local version.json (fallback)
                if not manifest:
                    try:
                        with open('version.json', 'r', encoding='utf-8') as f:
                            manifest = json.load(f)
                        # Nếu local manifest có notes_file local path, đọc nội dung luôn
                        nf = manifest.get('notes_file')
                        if nf and not manifest.get('notes'):
                            if isinstance(nf, str) and nf.lower().startswith(('http://', 'https://')):
                                try:
                                    with urllib.request.urlopen(nf, timeout=6) as r:
                                        manifest['notes'] = r.read().decode('utf-8')
                                except Exception:
                                    manifest['notes'] = ''
                            else:
                                try:
                                    with open(nf, 'r', encoding='utf-8') as nfobj:
                                        manifest['notes'] = nfobj.read()
                                except Exception:
                                    manifest['notes'] = ''
                    except Exception:
                        manifest = None

                if not manifest:
                    if manual_check:
                        self.after(0, lambda: messagebox.showinfo("Kiểm tra cập nhật", "Không lấy được thông tin cập nhật (mất kết nối hoặc manifest không hợp lệ)."))
                    return

                latest_version_str = manifest.get("version")
                download_url = manifest.get("url")

                if latest_version_str and parse_version(latest_version_str) > parse_version(self.CURRENT_VERSION):
                    try:
                        self.save_config()
                    except Exception:
                        pass
                    # show update window (manifest already contains 'notes' if available)
                    try:
                        self.after(0, lambda: show_update_window(self, manifest))
                    except Exception:
                        self.after(0, lambda: messagebox.showinfo("Cập nhật", f"Phát hiện phiên bản {latest_version_str}. Tải: {download_url}"))
                else:
                    if manual_check:
                        self.after(0, lambda: messagebox.showinfo("Kiểm tra cập nhật", "Bạn đang sử dụng phiên bản mới nhất."))
            except Exception as e:
                print(f"Lỗi kiểm tra cập nhật: {e}")
                if manual_check:
                    self.after(0, lambda: messagebox.showerror("Lỗi", "Không thể kiểm tra cập nhật. Vui lòng kiểm tra kết nối mạng."))
        threading.Thread(target=_check, daemon=True).start()

    def create_widgets(self):
        # --- Các phần layout chính (folder_frame, main_paned_window, notebook, log_frame)---
        main_frame = ttk.Frame(self, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # === TẠO MENU BAR ===
        menubar = tk.Menu(self)
        self.config(menu=menubar)

        menubar.add_command(label="Dịch", command=lambda: self._select_tab_by_name("Dịch"))
        menubar.add_command(label="Proxy", command=self._open_proxy_manager_window)

        # Menu Trợ giúp
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Trợ giúp", menu=help_menu)
        help_menu.add_command(label="Hướng dẫn Regex", command=lambda: self.show_regex_guide("general"))
        help_menu.add_command(label="Hướng dẫn thao tác", command=self.show_operation_guide)
        help_menu.add_separator()
        help_menu.add_command(label="Kiểm tra cập nhật...", command=lambda: self.check_for_updates(manual_check=True))

        folder_frame = ttk.LabelFrame(main_frame, text="1. Chọn thư mục", padding="10")
        folder_frame.pack(fill=tk.X, expand=False, pady=(0, 5))
        
        ttk.Entry(folder_frame, textvariable=self.folder_path, state="readonly").pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        ttk.Button(folder_frame, text="Chọn...", command=self.select_folder).pack(side=tk.LEFT)
        
        main_paned_window = ttk.PanedWindow(main_frame, orient=tk.VERTICAL)
        main_paned_window.pack(fill=tk.BOTH, expand=True)

        notebook_frame = ttk.Frame(main_paned_window)
        self.notebook = ttk.Notebook(notebook_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        self.notebook.bind("<<NotebookTabChanged>>", self._on_notebook_tab_changed)
        main_paned_window.add(notebook_frame, weight=3)
        
        self.create_rename_tab()
        self.create_credit_tab()
        self.create_online_fetch_tab()
        self.create_text_operations_tab()
        self.create_translator_tab()
        self. create_image_processing_tab()

        log_frame = ttk.LabelFrame(main_paned_window, text="Nhật ký hoạt động", padding="5")
        self.log_text = scrolledtext.ScrolledText(log_frame, height=8, state='disabled', wrap=tk.WORD)
        self.log_text.pack(fill=tk.BOTH, expand=True)
        main_paned_window.add(log_frame, weight=1)

    def create_rename_tab(self):
        rename_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(rename_tab, text="Đổi Tên")
        rename_tab.columnconfigure(0, weight=1)
        rename_tab.rowconfigure(1, weight=1)

        rename_paned_window = ttk.PanedWindow(rename_tab, orient=tk.VERTICAL)
        rename_paned_window.grid(row=0, column=0, sticky="nsew", rowspan=2)

        # Options frame in top pane
        options_frame = ttk.LabelFrame(rename_paned_window, text="2. Tùy chọn", padding="10")
        rename_paned_window.add(options_frame, weight=1)
        options_frame.columnconfigure(1, weight=1)

        # === KHU VỰC ĐƯỢC THAY ĐỔI ===
        # Frame chính cho hàng tùy chọn đầu tiên
        strategy_sort_frame = ttk.Frame(options_frame)
        strategy_sort_frame.grid(row=0, column=0, columnspan=3, sticky="ew")
        strategy_sort_frame.columnconfigure(0, weight=1)
        strategy_sort_frame.columnconfigure(1, weight=1)
        strategy_sort_frame.columnconfigure(2, weight=1)

        # Cột 1: Chọn nguồn lấy số chương
        num_source_frame = ttk.Frame(strategy_sort_frame)
        num_source_frame.grid(row=0, column=0, sticky="w")
        ttk.Label(num_source_frame, text="Lấy số từ:").pack(side=tk.LEFT, padx=(0, 10))
        self.strategy = tk.StringVar(value="content_first")
        ttk.Radiobutton(num_source_frame, text="Ưu tiên nội dung", variable=self.strategy, value="content_first", command=self.schedule_preview_update).pack(side=tk.LEFT)
        ttk.Radiobutton(num_source_frame, text="Ưu tiên tên file", variable=self.strategy, value="filename_first", command=self.schedule_preview_update).pack(side=tk.LEFT, padx=(5,0))

        # Cột 2: Chọn cách sắp xếp
        sort_by_frame = ttk.Frame(strategy_sort_frame)
        sort_by_frame.grid(row=0, column=1, sticky="w", padx=(20, 0))
        ttk.Label(sort_by_frame, text="Sắp xếp theo số của:").pack(side=tk.LEFT, padx=(0, 10))
        # self.sort_strategy đã được tạo trong __init__
        ttk.Radiobutton(sort_by_frame, text="Nội dung", variable=self.sort_strategy, value="content", command=self._sort_and_refresh_ui).pack(side=tk.LEFT)
        ttk.Radiobutton(sort_by_frame, text="Tên file", variable=self.sort_strategy, value="filename", command=self._sort_and_refresh_ui).pack(side=tk.LEFT, padx=(5,0))
        
         # Cột 3: Sửa dòng đầu file ---
        self.edit_first_line_var = tk.BooleanVar(value=False)
        edit_line_frame = ttk.Frame(strategy_sort_frame)
        edit_line_frame.grid(row=0, column=2, sticky="w", padx=(20, 0))
        ttk.Checkbutton(edit_line_frame, text="Sửa dòng đầu của file", variable=self.edit_first_line_var).pack(side=tk.LEFT)
        
        ttk.Label(options_frame, text="Cấu trúc mới:").grid(row=1, column=0, sticky="w", padx=5, pady=(10, 5))
        self.format_combobox = ttk.Combobox(options_frame, values=["Chương {num} - {title}.txt"])
        self.format_combobox.grid(row=1, column=1, columnspan=2, sticky="we", padx=5)
        self.format_combobox.set("Chương {num} - {title}.txt")
        self.format_combobox.bind("<KeyRelease>", self.schedule_preview_update)
        ttk.Label(options_frame, text="(Dùng {num}, {title}, và {num + n} hoặc {num - n})").grid(row=2, column=1, columnspan=2, sticky="w", padx=5)
        
        ttk.Label(options_frame, text="Regex (tên file):").grid(row=3, column=0, sticky="nw", padx=5, pady=(10, 5))
        self.filename_regex_text = tk.Text(options_frame, height=2, wrap=tk.WORD, undo=True)
        self.filename_regex_text.grid(row=3, column=1, sticky="we", padx=5)
        self.filename_regex_text.bind("<KeyRelease>", self.schedule_preview_update)
        ttk.Button(options_frame, text="?", width=3, command=self.show_regex_guide).grid(row=3, column=2, sticky="n", padx=(0, 5), pady=(10, 0))
        ttk.Label(options_frame, text="(Mỗi dòng là một mẫu Regex)").grid(row=4, column=1, sticky="w", padx=5)

        ttk.Label(options_frame, text="Regex (nội dung):").grid(row=5, column=0, sticky="nw", padx=5, pady=5)
        self.content_regex_text = tk.Text(options_frame, height=2, wrap=tk.WORD, undo=True)
        self.content_regex_text.grid(row=5, column=1, sticky="we", padx=5, pady=5)
        self.content_regex_text.bind("<KeyRelease>", self.schedule_preview_update)
        ttk.Button(options_frame, text="?", width=3, command=self.show_regex_guide).grid(row=5, column=2, sticky="n", padx=(0, 5), pady=(5, 0))
        ttk.Label(options_frame, text="(Mỗi dòng là một mẫu Regex)").grid(row=6, column=1, sticky="w", padx=5)

        # Custom title frame (giữ nguyên)
        custom_title_frame = ttk.LabelFrame(rename_paned_window, text="3. Sử dụng tiêu đề tùy chỉnh (Tùy chọn)", padding=10)
        rename_paned_window.add(custom_title_frame, weight=1)
        custom_title_frame.columnconfigure(0, weight=1)
        custom_title_frame.rowconfigure(1, weight=1)

        self.use_custom_titles = tk.BooleanVar(value=False)
        ttk.Checkbutton(custom_title_frame, text="Kích hoạt (Mỗi dòng là một tiêu đề, áp dụng theo thứ tự file đã sắp xếp)", variable=self.use_custom_titles, command=self.schedule_preview_update).grid(row=0, column=0, columnspan=2, sticky="w")
        
        self.custom_titles_text = scrolledtext.ScrolledText(custom_title_frame, height=5, wrap=tk.WORD, undo=True)
        self.custom_titles_text.grid(row=1, column=0, columnspan=2, sticky="ewns", pady=(5,0))
        
        # Preview frame (giữ nguyên)
        preview_frame = ttk.LabelFrame(rename_paned_window, text="4. Xem trước và Hành động", padding="10")
        rename_paned_window.add(preview_frame, weight=3)
        preview_frame.columnconfigure(0, weight=1)
        preview_frame.rowconfigure(1, weight=1)

        actions_bar = ttk.Frame(preview_frame)
        actions_bar.grid(row=0, column=0, sticky="ew", pady=(0, 5))
        ttk.Label(actions_bar, text="Tìm kiếm:").pack(side=tk.LEFT, padx=(0, 5))
        self.search_var = tk.StringVar()
        search_entry = ttk.Entry(actions_bar, textvariable=self.search_var)
        search_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
        search_entry.bind("<KeyRelease>", self._search_files)
        ttk.Button(actions_bar, text="Loại trừ file đã chọn", command=lambda: self._toggle_exclusion(exclude=True)).pack(side=tk.LEFT, padx=5)
        ttk.Button(actions_bar, text="Bao gồm lại", command=lambda: self._toggle_exclusion(exclude=False)).pack(side=tk.LEFT, padx=5)
        ttk.Button(actions_bar, text="BẮT ĐẦU ĐỔI TÊN", command=self.start_renaming).pack(side=tk.LEFT, padx=5)
        cols = ("Trạng thái", "Tên file gốc", "Số (tên file)", "Số (nội dung)", "Tên file mới")
        self.tree = ttk.Treeview(preview_frame, columns=cols, show='headings', selectmode='extended')

        self.tree_filepaths = {}
        self.tree.bind("<Double-1>", self._open_preview_from_rename)

        self.tree.grid(row=1, column=0, sticky="nsew")
        self.tree.tag_configure("excluded", foreground="red")
        for col, width in zip(cols, [80, 300, 100, 100, 300]):
            self.tree.heading(col, text=col); self.tree.column(col, width=width)
        
        vsb = ttk.Scrollbar(preview_frame, orient="vertical", command=self.tree.yview)
        vsb.grid(row=1, column=1, sticky="ns")
        self.tree.configure(yscrollcommand=vsb.set)

    def show_regex_guide(self, guide_type="rename"):
        help_window = tk.Toplevel(self)
        help_window.title("Hướng dẫn sử dụng Regex")
        help_window.geometry("700x600") 
        help_window.transient(self)

        main_frame = ttk.Frame(help_window, padding="15")
        main_frame.pack(fill="both", expand=True)

        guide_notebook = ttk.Notebook(main_frame)
        guide_notebook.pack(fill="both", expand=True, pady=(0, 10))

        # --- Tab 1: Ký hiệu chung ---
        common_symbols_tab = scrolledtext.ScrolledText(guide_notebook, wrap=tk.WORD)
        guide_notebook.add(common_symbols_tab, text="Ký hiệu chung")
        common_content = """
Regex (Biểu thức chính quy) là một công cụ mạnh mẽ để tìm kiếm và xử lý văn bản dựa trên các 'khuôn mẫu'.

--- CÁC KÝ HIỆU CƠ BẢN ---
.         - Khớp với bất kỳ ký tự nào (trừ dòng mới).
\\d        - Khớp với một chữ số (0-9).
\\D        - Khớp với ký tự KHÔNG phải là số.
\\w        - Khớp với ký tự chữ, số, hoặc gạch dưới (_).
\\s        - Khớp với khoảng trắng (dấu cách, tab, xuống dòng).
\\n        - Khớp với ký tự xuống dòng (new line).
\\t        - Khớp với ký tự tab.
^         - Bắt đầu một chuỗi hoặc một dòng (ở chế độ multi-line).
$         - Kết thúc một chuỗi hoặc một dòng.
\\b        - Ranh giới của một từ (word boundary).

--- LƯỢNG TỪ (Quantifiers) ---
*         - 0 hoặc nhiều lần. Vd: a*
+         - 1 hoặc nhiều lần. Vd: a+
?         - 0 hoặc 1 lần. Vd: colou?r (khớp 'color' và 'colour')
{n}       - Chính xác n lần. Vd: \\d{4} (tìm 4 chữ số).
{n,m}     - Từ n đến m lần. Vd: \\d{2,4} (tìm từ 2 đến 4 chữ số).

--- KÝ HIỆU NHÓM & KÝ TỰ ĐẶC BIỆT ---
(...)     - Nhóm bắt (Capturing Group). Nội dung khớp sẽ được 'lưu lại' để sử dụng sau (tham chiếu bằng $1, $2,...).
(?:...)   - Nhóm không bắt (Non-capturing Group). Dùng để gom nhóm mà không 'lưu lại'.
[...]     - Khớp với một ký tự trong tập hợp. Vd: [aeiou]
[^...]    - Khớp với ký tự KHÔNG có trong tập hợp.
|         - Hoặc (OR). Vd: cat|dog
\\         - Thoát (escape) một ký tự đặc biệt. Vd: \\. để tìm dấu chấm.

--- CẤU TRÚC THƯỜNG GẶP ---
- Tìm dòng chứa một từ cụ thể (Vd: "Error"):
  ^.*Error.*$
- Tìm và xóa các dòng trống thừa (2+ dòng trống):
  (\\r?\\n){2,}   -> Thay bằng: \\n
- Tham lam vs Lười biếng (Greedy vs Lazy):
  Mặc định, * và + là 'tham lam' (greedy), khớp chuỗi dài nhất có thể. Thêm ? để chuyển sang 'lười biếng' (lazy) và khớp chuỗi ngắn nhất.
  Vd: <a>.*<b>  sẽ khớp từ <a> đầu tiên đến <b> cuối cùng trong chuỗi.
      <a>.*?<b> sẽ khớp từ <a> đến <b> gần nhất. Rất hữu ích khi xử lý HTML/XML.
"""
        common_symbols_tab.insert("1.0", common_content)
        common_symbols_tab.config(state="disabled")

        # --- Tab 2: Ví dụ Đổi tên file ---
        rename_guide = scrolledtext.ScrolledText(guide_notebook, wrap=tk.WORD)
        guide_notebook.add(rename_guide, text="Ví dụ: Đổi tên")
        rename_content = """
YÊU CẦU BẮT BUỘC:
Khuôn mẫu của bạn phải tạo ra 2 'nhóm bắt' (...) để lấy ra SỐ CHƯƠNG và TIÊU ĐỀ.

    - Nhóm 1 (...): Phải chứa SỐ CHƯƠNG.
    - Nhóm 2 (...): Phải chứa TIÊU ĐỀ CHƯƠNG.

----------------------------------------------------
VÍ DỤ 1:
- Tên file: 'Truyen-A-Chap-123-Tieu-de-chuong.txt'
- Regex cần dùng: Chap-(\\d+)-(.*)
- Giải thích:
  'Chap-': Tìm chính xác chuỗi 'Chap-'.
  '(\\d+)': Nhóm 1, tìm và bắt 1 hoặc nhiều chữ số (số 123).
  '-': Tìm chính xác dấu gạch nối.
  '(.*)': Nhóm 2, tìm và bắt mọi ký tự cho đến hết tên file.

VÍ DỤ 2:
- Tên file: 'Quyển 3 - 098 . Tên chương.txt'
- Regex cần dùng: (\\d+)\\s*\\.\\s*(.*)
- Giải thích:
  '(\\d+)': Nhóm 1, tìm và bắt 1 hoặc nhiều chữ số (số 098).
  '\\s*': Tìm 0 hoặc nhiều khoảng trắng.
  '\\.': Tìm dấu chấm (phải có '\\' vì '.' là ký tự đặc biệt).
  '\\s*': Tìm tiếp 0 hoặc nhiều khoảng trắng.
  '(.*)': Nhóm 2, tìm và bắt phần còn lại của tên file.
"""
        rename_guide.insert("1.0", rename_content)
        rename_guide.config(state="disabled")

        # --- Tab 3: Ví dụ Tìm & thay thế ---
        find_replace_guide = scrolledtext.ScrolledText(guide_notebook, wrap=tk.WORD)
        guide_notebook.add(find_replace_guide, text="Ví dụ: Tìm & Thay thế")
        find_replace_content = """
Trong ô 'Thay thế', bạn có thể dùng $1, $2, ... (hoặc \\1, \\2) để tham chiếu đến nội dung đã được bắt bởi các nhóm (...) trong ô 'Tìm'.

----------------------------------------------------
VÍ DỤ 1: Đổi "Chương 123" thành "Chapter 123"
- Tìm:    Chương\\s*(\\d+)
- Thay:   Chapter $1
- Giải thích: 'Chương\\s*' tìm chữ 'Chương' và khoảng trắng theo sau. '(\\d+)' bắt số chương vào nhóm 1. '$1' ở ô thay thế sẽ chèn lại số đã bắt được.

VÍ DỤ 2: Đổi ngoặc kép thành ngoặc kiểu Trung
- Tìm:    "(.*?)"
- Thay:   『$1』
- Giải thích: Dấu " bên ngoài tìm ngoặc kép. '(.*?)' bắt tất cả nội dung bên trong một cách 'lười biếng' (lazy) để nó dừng lại ở dấu " gần nhất. $1 chèn lại nội dung đó.

VÍ DỤ 3: Xóa các dòng chỉ chứa khoảng trắng
- Tìm:    ^\\s+$\\n
- Thay:   (để trống)
- Giải thích: '^' bắt đầu dòng, '\\s+' tìm 1 hoặc nhiều khoảng trắng, '$' kết thúc dòng. Tìm các dòng chỉ có khoảng trắng và xóa chúng.
"""
        find_replace_guide.insert("1.0", find_replace_content)
        find_replace_guide.config(state="disabled")

        # --- Tab 4: Ví dụ Chia file ---
        split_guide = scrolledtext.ScrolledText(guide_notebook, wrap=tk.WORD)
        guide_notebook.add(split_guide, text="Ví dụ: Chia file")
        split_content = """
Regex chia file dùng để xác định các dòng mà tại đó file sẽ được cắt ra. Toàn bộ dòng phải khớp với mẫu.

----------------------------------------------------
VÍ DỤ 1: Chia theo tên chương tiếng Trung
- Regex:   ^第.*?章.*$
- Giải thích: '^' bắt đầu dòng, '第' tìm chữ 'Đệ', '.*?' tìm số chương, '章' tìm chữ 'Chương', '.*' tìm tiêu đề, '$' kết thúc dòng.

VÍ DỤ 2: Chia theo tên chương tiếng Việt
- Regex:   ^Chương\\s*\\d+.*$
- Giải thích: Tương tự, tìm các dòng bắt đầu bằng 'Chương', theo sau là số và tiêu đề.

VÍ DỤ 3: Chia theo các dòng có 5 dấu sao trở lên
- Regex:   ^\\*{5,}$
- Giải thích: Tìm các dòng chỉ chứa 5 hoặc nhiều ký tự '*'.
"""
        split_guide.insert("1.0", split_content)
        split_guide.config(state="disabled")
        
        tab_map = {"general": 0, "rename": 1, "find_replace": 2, "split": 3}
        guide_notebook.select(tab_map.get(guide_type, 0))

        close_button = ttk.Button(main_frame, text="Đã hiểu", command=help_window.destroy)
        close_button.pack()
        
        # Đặt hàm này gần hàm show_regex_guide
    
    def show_operation_guide(self):
        guide_win = tk.Toplevel(self)
        guide_win.title("Hướng dẫn thao tác")
        guide_win.geometry("800x650")
        guide_win.transient(self)
        guide_win.grab_set()

        main_frame = ttk.Frame(guide_win, padding="15")
        main_frame.pack(fill="both", expand=True)

        notebook = ttk.Notebook(main_frame)
        notebook.pack(fill="both", expand=True, pady=(0, 10))

        def create_tab(title, content):
            tab = scrolledtext.ScrolledText(notebook, wrap=tk.WORD, padx=10, pady=10)
            notebook.add(tab, text=title)
            # SỬ DỤNG HÀM RENDER MỚI
            self._render_markdown_guide(tab, content.strip())

        rename_guide = """
        --- TAB ĐỔI TÊN ---
        Tab này là chức năng chính, giúp bạn đổi tên hàng loạt file truyện theo một cấu trúc thống nhất.

        1.  **Chọn thư mục**:
            -   Nhấn nút **"Chọn..."** để chỉ định thư mục chứa các file .txt cần xử lý.
            -   Sau khi chọn, chương trình sẽ tự động quét và phân tích các file.

        2.  **Tùy chọn**:
            -   **Lấy số từ**: Quyết định chương trình sẽ ưu tiên lấy số chương từ đâu để điền vào tên file mới.
                -   *Ưu tiên nội dung*: Lấy số từ dòng đầu tiên của file. Nếu không có, mới lấy từ tên file.
                -   *Ưu tiên tên file*: Lấy số từ tên file. Nếu không có, mới lấy từ nội dung.
            -   **Sắp xếp theo số của**: Quyết định thứ tự các file trong bảng "Xem trước" sẽ được sắp xếp theo nguồn nào. Điều này rất quan trọng khi bạn dùng "Tiêu đề tùy chỉnh".
                -   *Nội dung*: Sắp xếp dựa trên số chương lấy từ nội dung.
                -   *Tên file*: Sắp xếp dựa trên số chương lấy từ tên file.
            -   **Sửa dòng đầu của file**: Khi được chọn, chương trình sẽ **ghi đè** dòng đầu tiên của mỗi file bằng chính tên file mới được tạo ra (không bao gồm đuôi file như .txt). Tính năng này chỉ hoạt động nếu file đó được tìm thấy số chương.
            -   **Cấu trúc mới**: Định dạng cho tên file mới.
                -   `{num}`: Sẽ được thay bằng số chương.
                -   `{title}`: Sẽ được thay bằng tiêu đề chương.
                -   `{num+n}` hoặc `{num-n}`: Tự động cộng/trừ số chương (ví dụ: `{num+1}`).
            -   **Regex (tên file / nội dung)**: Dành cho người dùng nâng cao. Giúp chương trình nhận diện số và tiêu đề chương trong các trường hợp phức tạp mà mẫu có sẵn không xử lý được.

        3.  **Sử dụng tiêu đề tùy chỉnh**:
            -   Check vào ô **"Kích hoạt"**.
            -   Dán danh sách các tiêu đề vào ô văn bản bên dưới, mỗi tiêu đề một dòng.
            -   Các tiêu đề này sẽ được áp dụng lần lượt cho các file đã được sắp xếp trong bảng "Xem trước".

        4.  **Xem trước và Hành động**:
            -   **Bảng xem trước**: Hiển thị danh sách các file, số chương được nhận diện và tên file mới sẽ trông như thế nào. Có thể chọn nhiều file bằng **Ctrl + Click chuột trái** hoặc chọn 1 hàng sau đó đến hàng mới nhấn **Shift +  Click chuột trái** để chọn khoảng từ hàng trước tới hàng này.
            -   **Tìm kiếm**: Lọc nhanh các file trong bảng.
            -   **Loại trừ file đã chọn**: Chọn một hoặc nhiều file trong bảng và nhấn nút này để bỏ qua chúng khi đổi tên. Các file này sẽ được đánh dấu màu đỏ.
            -   **Bao gồm lại**: Chọn các file đã bị loại trừ để đưa chúng trở lại quá trình đổi tên.
            -   **BẮT ĐẦU ĐỔI TÊN**: Nút cuối cùng để thực hiện việc đổi tên hàng loạt.
            -   **Double-click vào một dòng**: Mở cửa sổ xem nhanh nội dung của file đó.
        """
        create_tab("Đổi Tên", rename_guide)

        credit_guide = """
        --- TAB THÊM CREDIT ---
        Chức năng này giúp bạn chèn một dòng thông tin (ví dụ: tên người convert, nguồn,...) vào tất cả các file trong thư mục đã chọn.

        1.  **Nội dung credit**: Nhập đoạn văn bản bạn muốn thêm vào đây.
        2.  **Vị trí thêm**:
            -   **Đầu file**: Chèn credit vào dòng đầu tiên của mỗi file.
            -   **Cuối file**: Chèn credit vào dòng cuối cùng của mỗi file.
            -   **Dòng thứ...**: Chèn credit vào một dòng cụ thể do bạn chỉ định.
        3.  **Xem trước**:
            -   Chọn một file từ danh sách thả xuống.
            -   Nhấn nút **"XEM TRƯỚC"** để xem nội dung file sẽ trông như thế nào sau khi thêm credit.
        4.  **ÁP DỤNG CHO TẤT CẢ FILE**:
            -   Nhấn nút này để thực hiện việc thêm credit vào tất cả các file.
            -   **Lưu ý**: Hành động này sẽ **ghi đè** lên các file gốc.
        """
        create_tab("Thêm Credit", credit_guide)

        online_guide = """
        --- TAB LẤY TIÊU ĐỀ ONLINE ---
        Công cụ mạnh mẽ giúp lấy danh sách tiêu đề chương trực tiếp từ các trang web truyện.

        1.  **Nguồn**:
            -   **Trang web**: Chọn trang bạn muốn lấy dữ liệu (ví dụ: jjwxc.net).
            -   **URL mục lục**: Dán đường link của trang mục lục truyện vào đây.
            -   **Bắt đầu lấy dữ liệu**: Nhấn để chương trình truy cập URL và lấy về danh sách chương.
            -   **Lưu ý**: Đảm bảo URL hợp lệ và có kết nối mạng. Nếu trang web yêu cầu đăng nhập, app sẽ mở trình duyệt để bạn đăng nhập hoặc tải cookie trước khi lấy dữ liệu.

        2.  **Kết quả**:
            -   Bảng này sẽ hiển thị danh sách các chương lấy được, bao gồm số chương, tiêu đề chính và tiêu đề phụ (nếu có).
            -   Có thể chọn nhiều dòng bằng **Ctrl + Click chuột trái** hoặc chọn 1 hàng sau đó đến hàng mới nhấn **Shift +  Click chuột trái** để chọn khoảng từ hàng trước tới hàng này.

        3.  **Áp dụng**:
            -   **Chọn nhanh theo khoảng**: Giúp chọn nhanh các chương trong bảng kết quả.
                -   `1-50`: Chọn từ chương 1 đến 50.
                -   `-100`: Chọn tất cả các chương đến 100.
                -   `80-`: Chọn từ chương 80 đến hết.
                -   `all`: Chọn tất cả.
            -   **Gộp 2 tiêu đề**:
                -   Kích hoạt tùy chọn này nếu bạn muốn kết hợp tiêu đề chính và phụ.
                -   Sử dụng `{t1}` cho tiêu đề chính và `{t2}` cho tiêu đề phụ trong ô cấu trúc.
            -   **Nếu không gộp, sử dụng cột**: Chọn cột tiêu đề bạn muốn dùng (chính hoặc phụ).
            -   **Sao chép tiêu đề...**: Sau khi đã chọn các chương mong muốn, nhấn nút này. Các tiêu đề tương ứng sẽ được tự động sao chép vào ô "Tiêu đề tùy chỉnh" ở Tab "Đổi Tên".
        """
        create_tab("Lấy Tiêu Đề Online", online_guide)
        
        text_guide = """
        --- TAB XỬ LÝ VĂN BẢN ---
        Cung cấp các công cụ để chỉnh sửa nội dung file hoặc chia nhỏ file.

        1.  **Chọn file**: Chọn file .txt bạn muốn chỉnh sửa hoặc chia nhỏ. Nội dung file sẽ được tải vào ô bên dưới.

        --- Sub-tab: Tìm & Thay thế ---
        -   **Tìm / Thay thế**: Nhập văn bản cần tìm và văn bản sẽ thay thế. Hỗ trợ Regex.
        -   **Các tùy chọn**:
            -   **Khớp chữ hoa/thường**: Bật để phân biệt A và a.
            -   **Khớp toàn bộ từ**: Chỉ tìm các từ đứng riêng lẻ (ví dụ: tìm "an" sẽ không khớp với "bàn").
            -   **Dùng Regex**: Kích hoạt chế độ tìm kiếm bằng biểu thức chính quy.
            -   **Tìm ngược lên**: Tìm từ vị trí con trỏ ngược về đầu file.
        -   **Các nút hành động**:
            -   **Tìm tiếp**: Nhảy đến kết quả trùng khớp tiếp theo.
            -   **Thay thế**: Thay thế kết quả đang được chọn và tự động tìm kết quả tiếp theo.
            -   **Thay thế tất cả**: Thay thế mọi kết quả tìm thấy trong toàn bộ file.
            -   **Lưu**: Ghi đè các thay đổi lên file gốc.
            -   **Lưu thành file mới...**: Lưu nội dung đã sửa vào một file mới.
            -   **Hoàn tác / Làm lại**: Quay lại hoặc tiến tới các bước chỉnh sửa.

        --- Sub-tab: Chia file ---
        -   **Regex chia file**: Nhập mẫu Regex để xác định dòng dùng làm điểm chia. Ví dụ: `^Chương \\d+` sẽ chia file tại mỗi dòng bắt đầu bằng "Chương [số]".
        -   **Cấu trúc tên file**: Đặt tên cho các file con được tạo ra.
        -   **Chia sau/trước regex**: Quyết định dòng khớp với regex sẽ thuộc về file trước đó hay file sau đó.
        -   **Xem trước**: Hiển thị danh sách các phần sẽ được tạo ra. Double-click vào một dòng để xem trước toàn bộ nội dung của phần đó.
        -   **BẮT ĐẦU CHIA FILE**: Thực hiện việc chia file. Các file con sẽ được lưu trong một thư mục mới.
        """
        create_tab("Xử lý văn bản", text_guide)

        translate_guide = """
        --- TAB DỊCH ---
        Đây là công cụ dịch thuật mạnh mẽ được tích hợp, cho phép bạn dịch văn bản thuần túy và quản lý các thuật ngữ (name) một cách chuyên nghiệp.

        1.  **Văn bản gốc**:
            -   Dán văn bản cần dịch vào ô bên trái hoặc nhấn nút **"Tải file..."** để mở một file .txt.
            -   Mỗi dòng được coi là một "chunk" và sẽ được dịch riêng biệt để giữ nguyên định dạng.

        2.  **Quản lý Name**:
            -   **Bộ tên**: Chọn name-set bạn muốn sử dụng cho lần dịch này. Bạn có thể **Tạo mới**, **Xóa bộ**, **Nhập/Xuất** file name hoặc **Xóa hết name** trong một bộ.
            -   **Thêm/Sửa nhanh**: Nhập các cặp `Tiếng Trung=Tiếng Việt` (mỗi cặp một dòng) rồi nhấn nút "Thêm/Cập nhật" để thêm hàng loạt.
            -   **Danh sách name**: Hiển thị tất cả các name trong bộ hiện tại. Nhấn nút **"Sửa/Gợi ý"** để chỉnh sửa hoặc xem gợi ý cho một name.

        3.  **Nâng cao**:
            -   Cho phép tùy chỉnh các thông số kỹ thuật như URL server dịch, URL file Hán-Việt, độ trễ và số ký tự tối đa cho mỗi yêu cầu.

        4.  **Dịch và Sửa Name từ kết quả**:
            -   Nhấn nút **"BẮT ĐẦU DỊCH"** để bắt đầu.
            -   Sau khi dịch xong, bạn có thể **chuột phải** vào một đoạn văn bản trong ô "Kết quả dịch" và chọn **"Sửa Name..."**.
            -   Một cửa sổ sẽ hiện ra, cho phép bạn sửa cả name tiếng Trung và tiếng Việt. Nhấn nút **"Gợi ý..."** trong cửa sổ này để xem các gợi ý Hán-Việt và dịch máy.
            -   **Tự động cập nhật**: Sau khi bạn lưu một name, các đoạn dịch có chứa name đó sẽ được **tự động dịch lại** một cách thông minh mà không cần phải dịch lại toàn bộ.
        """
        create_tab("Dịch", translate_guide)

        image_guide = """
        --- TAB XỬ LÝ ẢNH ---
        Công cụ này cho phép bạn tải, xem, chỉnh sửa cơ bản và lưu lại hình ảnh.

        1.  **Nguồn ảnh**:
            -   **Tải từ URL**: Dán đường link trực tiếp của một ảnh vào ô và nhấn nút.
            -   **Tải file lên...**: Mở một file ảnh từ máy tính của bạn.

        2.  **Xem trước & Tương tác**:
            -   **Phóng to / Thu nhỏ**: Sử dụng **con lăn chuột** trên ảnh để phóng to hoặc thu nhỏ.
            -   **Di chuyển ảnh**: **Nhấn và kéo chuột trái** để di chuyển ảnh trong khung xem.

        3.  **Công cụ & Lưu ảnh**:
            -   **Công cụ**: Chọn một trong các hiệu ứng nâng cao chất lượng ảnh:
                -   *Làm nét (Unsharp Mask)*: Tăng độ sắc nét của các chi tiết.
                -   *Tăng chi tiết (Detail)*: Làm nổi bật các cạnh và vân bề mặt.
                -   *Nâng cấp độ phân giải x2*: Tăng gấp đôi kích thước ảnh với thuật toán chất lượng cao.
            -   **Cường độ**: Dùng thanh trượt để điều chỉnh mức độ mạnh/yếu của hiệu ứng.
            -   **Áp dụng**: Sau khi chọn công cụ và cường độ, nhấn **"Áp dụng"** để xem kết quả.
            -   **Hoàn tác về gốc**: Nhấn nút này để hủy bỏ mọi thay đổi và quay về ảnh gốc ban đầu.
            -   **Lưu ảnh...**: Chọn định dạng và nhấn **"Lưu ảnh..."** để lưu lại ảnh đã qua xử lý.
        """
        create_tab("Xử lý Ảnh", image_guide)
        
        close_button = ttk.Button(main_frame, text="Đóng", command=guide_win.destroy)
        close_button.pack()

    def create_credit_tab(self):
        credit_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(credit_tab, text="Thêm Credit")
        credit_tab.columnconfigure(0, weight=1)
        credit_tab.rowconfigure(0, weight=1)

        credit_paned = ttk.PanedWindow(credit_tab, orient=tk.VERTICAL)
        credit_paned.grid(row=0, column=0, sticky="nsew")

        credit_options_frame = ttk.LabelFrame(credit_paned, text="2. Tùy chọn & Hành động", padding="10")
        credit_paned.add(credit_options_frame, weight=1)
        credit_options_frame.columnconfigure(1, weight=1)

        ttk.Label(credit_options_frame, text="Nội dung credit:").grid(row=0, column=0, sticky="nw", padx=5, pady=5)
        self.credit_text_widget = tk.Text(credit_options_frame, height=4, wrap=tk.WORD, undo=True)
        self.credit_text_widget.grid(row=0, column=1, columnspan=2, sticky="ew", padx=5, pady=5)
        self.credit_text_widget.insert("1.0", "Được convert bởi XYZ")  # Giá trị mặc định

        ttk.Label(credit_options_frame, text="Vị trí thêm:").grid(row=1, column=0, sticky="w", padx=5, pady=5)
        self.credit_position = tk.StringVar(value="top")
        positions = {"Đầu file": "top", "Cuối file": "bottom", "Dòng thứ...": "line"}
        pos_frame = ttk.Frame(credit_options_frame)
        pos_frame.grid(row=1, column=1, columnspan=2, sticky="w", padx=5, pady=5)
        for text, val in positions.items():
            ttk.Radiobutton(pos_frame, text=text, variable=self.credit_position, value=val, command=self._on_pos_change).pack(side=tk.LEFT, padx=(0, 10))

        self.credit_line_num = tk.IntVar(value=2)
        self.line_num_spinbox = ttk.Spinbox(pos_frame, from_=1, to=999, textvariable=self.credit_line_num, width=5, state="disabled")
        self.line_num_spinbox.pack(side=tk.LEFT)

        # Đưa nút "Xem trước" và "Áp dụng cho tất cả file" cùng hàng với "Xem trước cho file"
        ttk.Label(credit_options_frame, text="Xem trước cho file:").grid(row=2, column=0, sticky="w", padx=5, pady=(10, 5))
        self.credit_file_selector = ttk.Combobox(credit_options_frame, state="readonly")
        self.credit_file_selector.grid(row=2, column=1, sticky="ew", padx=5, pady=(10, 5))
        button_frame = ttk.Frame(credit_options_frame)
        button_frame.grid(row=2, column=2, sticky="e", padx=5, pady=(10, 5))
        ttk.Button(button_frame, text="XEM TRƯỚC", command=self.preview_credit).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="ÁP DỤNG CHO TẤT CẢ FILE", command=self.apply_credit_to_all).pack(side=tk.LEFT)

        # Initialize self.credit_preview_text
        credit_preview_frame = ttk.LabelFrame(credit_paned, text="3. Xem trước nội dung", padding="10")
        credit_paned.add(credit_preview_frame, weight=12)
        credit_preview_frame.columnconfigure(0, weight=1)
        credit_preview_frame.rowconfigure(0, weight=1)

        self.credit_preview_text = scrolledtext.ScrolledText(credit_preview_frame, wrap=tk.WORD, state="disabled")
        self.credit_preview_text.pack(fill=tk.BOTH, expand=True)

    def create_online_fetch_tab(self):
        online_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(online_tab, text="Lấy Tiêu Đề Online")
        online_tab.columnconfigure(0, weight=1)
        online_tab.rowconfigure(0, weight=1)

        online_paned = ttk.PanedWindow(online_tab, orient=tk.VERTICAL)
        online_paned.grid(row=0, column=0, sticky="nsew")

        # Frame 1: Nguồn (Không thay đổi)
        fetch_frame = ttk.LabelFrame(online_paned, text="1. Nguồn", padding=10)
        online_paned.add(fetch_frame, weight=1)
        fetch_frame.columnconfigure(1, weight=1)
        ttk.Label(fetch_frame, text="Trang web:").grid(row=0, column=0, sticky="w", padx=5, pady=5)
        self.source_web = ttk.Combobox(fetch_frame, values=["jjwxc.net", "po18.tw", "qidian.com", "fanqienovel.com"], state="readonly")
        self.source_web.grid(row=0, column=1, sticky="ew", padx=5)
        self.source_web.set("jjwxc.net")
        ttk.Label(fetch_frame, text="URL mục lục:").grid(row=1, column=0, sticky="w", padx=5, pady=5)
        self.source_url = tk.StringVar()
        url_frame = ttk.Frame(fetch_frame)
        url_frame.grid(row=1, column=1, sticky="ew", padx=5, pady=5)
        ttk.Entry(url_frame, textvariable=self.source_url).pack(side=tk.LEFT, fill=tk.X, expand=True)
        ttk.Button(url_frame, text="Bắt đầu lấy dữ liệu", command=self._fetch_online_titles).pack(side=tk.LEFT, padx=5)

        # Frame 2: Kết quả (Không thay đổi)
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

        # Phần bên phải cho "Gộp tiêu đề"
        combine_frame = ttk.Frame(apply_frame)
        combine_frame.grid(row=0, column=1, sticky="ew", padx=(10, 0))
        ttk.Checkbutton(combine_frame, text="Gộp 2 tiêu đề theo cấu trúc:", variable=self.combine_titles_var).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Entry(combine_frame, textvariable=self.title_format_var).pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        # --- Hàng 2: Các label chú thích ---
        ttk.Label(apply_frame, text="(Ví dụ: 1-10, -50, 100-, all)").grid(row=1, column=0, sticky="w", padx=5)
        ttk.Label(apply_frame, text="(Dùng {t1} và {t2})").grid(row=1, column=1, sticky="w", padx=(10, 0))

        # --- Hàng 3: Hàng hành động cuối cùng ---
        action_row_frame = ttk.Frame(apply_frame)
        action_row_frame.grid(row=2, column=0, columnspan=2, sticky="ew", pady=(10,0))
        ttk.Label(action_row_frame, text="Nếu không gộp, sử dụng cột:").pack(side=tk.LEFT, padx=5)
        self.title_choice = tk.StringVar(value="title2")
        ttk.Radiobutton(action_row_frame, text="Tiêu đề chính", variable=self.title_choice, value="title1").pack(side=tk.LEFT)
        ttk.Radiobutton(action_row_frame, text="Tiêu đề phụ", variable=self.title_choice, value="title2").pack(side=tk.LEFT)
        ttk.Button(action_row_frame, text="Sao chép tiêu đề đã chọn vào Tab Đổi Tên", command=self._apply_online_titles).pack(side=tk.RIGHT, padx=5)

    def create_text_operations_tab(self):
        text_ops_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(text_ops_tab, text="Xử lý Văn bản")
        text_ops_tab.rowconfigure(1, weight=1)
        text_ops_tab.columnconfigure(0, weight=1)

        file_frame = ttk.LabelFrame(text_ops_tab, text="1. Chọn file (dùng chung cho các tab bên dưới)", padding="10")
        file_frame.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        ttk.Entry(file_frame, textvariable=self.selected_file, state="readonly").pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        ttk.Button(file_frame, text="Chọn...", command=self._select_file_for_ops).pack(side=tk.LEFT)

        # Simplify: Remove automatic file loading logic
        self.ops_notebook = ttk.Notebook(text_ops_tab)
        ops_notebook = self.ops_notebook

        ops_notebook.grid(row=1, column=0, sticky="nsew")

        # Find/Replace sub-tab
        find_replace_frame = ttk.Frame(ops_notebook, padding="10")
        ops_notebook.add(find_replace_frame, text="Tìm & Thay thế")
        self._create_find_replace_widgets(find_replace_frame)

        # Split file sub-tab
        split_frame = ttk.Frame(ops_notebook, padding="10")
        ops_notebook.add(split_frame, text="Chia file")
        self._create_split_widgets(split_frame)

    def _create_find_replace_widgets(self, parent):
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(0, weight=1)

        # Tạo PanedWindow chính theo chiều dọc
        main_paned = ttk.PanedWindow(parent, orient=tk.VERTICAL)
        main_paned.grid(row=0, column=0, sticky="nsew")
        
        # Frame cho phần tùy chọn 
        options_frame = ttk.LabelFrame(main_paned, text="1. Tùy chọn", padding="10")
        main_paned.add(options_frame, weight=0)
        
        find_frame = ttk.Frame(options_frame)
        find_frame.pack(fill=tk.X)
        ttk.Label(find_frame, text="Tìm:        ").pack(side=tk.LEFT)
        self.find_text = ttk.Combobox(find_frame)
        self.find_text.pack(side=tk.LEFT, fill=tk.X, expand=True)
        ttk.Button(find_frame, text="?", width=3, command=lambda: self.show_regex_guide("find_replace")).pack(side=tk.LEFT, padx=5)
        replace_frame = ttk.Frame(options_frame)
        replace_frame.pack(fill=tk.X, pady=5)
        ttk.Label(replace_frame, text="Thay thế:").pack(side=tk.LEFT)
        self.replace_text = ttk.Combobox(replace_frame)
        self.replace_text.pack(side=tk.LEFT, fill=tk.X, expand=True)
        ttk.Label(replace_frame, text="(Dùng $1, $2...)").pack(side=tk.LEFT, padx=5)
        opts_frame = ttk.Frame(options_frame)
        opts_frame.pack(fill=tk.X, pady=5)
        self.match_case = tk.BooleanVar(value=False)
        self.match_word = tk.BooleanVar(value=False)
        self.use_regex = tk.BooleanVar(value=False)
        self.search_up = tk.BooleanVar(value=False)
        ttk.Checkbutton(opts_frame, text="Khớp chữ hoa/thường", variable=self.match_case).pack(side=tk.LEFT, padx=5)
        ttk.Checkbutton(opts_frame, text="Khớp toàn bộ từ", variable=self.match_word).pack(side=tk.LEFT, padx=5)
        ttk.Checkbutton(opts_frame, text="Dùng Regex", variable=self.use_regex).pack(side=tk.LEFT, padx=5)
        ttk.Checkbutton(opts_frame, text="Tìm ngược lên", variable=self.search_up).pack(side=tk.LEFT, padx=5)


        # Frame cho phần nội dung 
        content_frame = ttk.LabelFrame(main_paned, text="2. Nội dung & Hành động", padding="10")
        main_paned.add(content_frame, weight=1)
        content_frame.rowconfigure(0, weight=1)
        content_frame.columnconfigure(0, weight=1)

        self.text_content = scrolledtext.ScrolledText(content_frame, wrap=tk.WORD, undo=True)
        self.text_content.grid(row=0, column=0, columnspan=7, sticky="nsew")
        self.text_content.bind("<<Modified>>", self._mark_text_as_modified)

        button_grid_frame = ttk.Frame(content_frame)
        button_grid_frame.grid(row=1, column=0, columnspan=7, pady=(10,0), sticky="ew")
        
        ttk.Button(button_grid_frame, text="Tìm tiếp", command=self._find_next).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0,5))
        ttk.Button(button_grid_frame, text="Thay thế", command=self._replace_current).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Thay thế tất cả", command=self._replace_all).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Lưu", command=self._save_changes).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Lưu thành file mới...", command=self._save_as).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Hoàn tác", command=self.text_content.edit_undo).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Làm lại", command=self.text_content.edit_redo).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(5,0))
    
    def _create_split_widgets(self, parent):
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(0, weight=1)

        # Tạo PanedWindow chính theo chiều dọc
        main_paned = ttk.PanedWindow(parent, orient=tk.VERTICAL)
        main_paned.grid(row=0, column=0, sticky="nsew")

        # Frame cho tùy chọn chia file
        options_frame = ttk.LabelFrame(main_paned, text="1. Tùy chọn chia file", padding="10")
        main_paned.add(options_frame, weight=0)
        options_frame.columnconfigure(1, weight=1)

        ttk.Label(options_frame, text="Regex chia file:").grid(row=0, column=0, sticky="w", padx=5, pady=5)
        self.split_regex = ttk.Combobox(options_frame)
        self.split_regex.grid(row=0, column=1, sticky="ew")
        ttk.Button(options_frame, text="?", width=3, command=lambda: self.show_regex_guide("split")).grid(row=0, column=2, padx=5)
        
        ttk.Label(options_frame, text="Cấu trúc tên file:").grid(row=1, column=0, sticky="w", padx=5, pady=5)
        self.split_format_combobox = ttk.Combobox(options_frame)
        self.split_format_combobox.grid(row=1, column=1, sticky="ew")
        self.split_format_combobox.set("part_{num}.txt")
        ttk.Label(options_frame, text="(Dùng {num}, {num+n}, {num-n})").grid(row=1, column=2, padx=5)

        pos_frame = ttk.Frame(options_frame)
        pos_frame.grid(row=2, column=0, columnspan=2, sticky="w", padx=5, pady=5)
        self.split_position = tk.StringVar(value="after")
        ttk.Radiobutton(pos_frame, text="Chia sau regex", variable=self.split_position, value="after").pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(pos_frame, text="Chia trước regex", variable=self.split_position, value="before").pack(side=tk.LEFT, padx=5)

        # Tạo frame riêng cho 2 nút ở cột 2
        button_frame = ttk.Frame(options_frame)
        button_frame.grid(row=2, column=2, sticky="e", padx=5, pady=5)

        ttk.Button(button_frame, text="Xem trước", command=self._preview_split).grid(row=0, column=0, padx=2)
        ttk.Button(button_frame, text="BẮT ĐẦU CHIA FILE", command=self._execute_split).grid(row=0, column=1, padx=2)


        # Frame cho xem trước kết quả 
        preview_frame = ttk.LabelFrame(main_paned, text="2. Xem trước kết quả chia", padding="10")
        main_paned.add(preview_frame, weight=1)

        cols = ("STT", "Nội dung bắt đầu", "Kích thước")
        self.split_tree = ttk.Treeview(preview_frame, columns=cols, show='headings')
        self.split_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.split_tree.bind("<Double-1>", self._open_preview_file)  # Bind double-click to open preview

        for col, width in zip(cols, [50, 400, 100]):
            self.split_tree.heading(col, text=col)
            self.split_tree.column(col, width=width, anchor='w')

        vsb = ttk.Scrollbar(preview_frame, orient="vertical", command=self.split_tree.yview)
        vsb.pack(side=tk.RIGHT, fill=tk.Y)
        self.split_tree.configure(yscrollcommand=vsb.set)
    
    
    def _open_preview_file(self, event):
        """Open a new window to display the content of the selected preview file."""
        selected_item = self.split_tree.selection()
        if not selected_item:
            return

        item_data = self.split_tree.item(selected_item[0], 'values')
        if not item_data:
            return

        try:
            file_index = int(item_data[0]) - 1  # Get the file index from the first column
        except Exception:
            messagebox.showerror("Lỗi", "Dữ liệu hàng không hợp lệ.")
            return

        filepath = self.selected_file.get()
        regex = self.split_regex.get()
        name_format = self.split_format_combobox.get()

        # Lấy toàn bộ các phần (full chunks) thay vì chỉ preview
        chunks, error = TextOperations.get_split_chunks(filepath, regex, self.split_position.get())
        if error or file_index >= len(chunks):
            messagebox.showerror("Lỗi", "Không thể mở nội dung file.")
            return

        # chunks[i] = (full_chunk_string, size)
        file_content = chunks[file_index][0]
        file_name = name_format.format(num=file_index + 1)

        # Create a new window to display the content
        preview_window = tk.Toplevel(self)
        preview_window.title(f"Xem trước: {file_name}")
        preview_window.geometry("800x600")

        text_widget = scrolledtext.ScrolledText(preview_window, wrap=tk.WORD, state="normal")
        text_widget.pack(fill=tk.BOTH, expand=True)
        text_widget.insert("1.0", file_content)
        text_widget.config(state="disabled")

    def _mark_text_as_modified(self, event=None):
        """Được gọi khi text widget được sửa đổi. Đặt cờ 'modified'."""
        if self.text_content.edit_modified():
            self.text_modified.set(True)
        self.text_content.edit_modified(False)

    def _save_as(self):
        """Lưu nội dung hiện tại vào một file mới."""
        new_filepath = filedialog.asksaveasfilename(
            title="Lưu thành file mới",
            initialfile=os.path.basename(self.selected_file.get() or "untitled.txt"),
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if new_filepath:
            try:
                content = self.text_content.get("1.0", tk.END)
                with open(new_filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                # Cập nhật file đang được chọn thành file mới
                self.selected_file.set(new_filepath)
                self.text_modified.set(False)
                self.log(f"Đã lưu file thành công với tên mới: '{os.path.basename(new_filepath)}'")
                messagebox.showinfo("Thành công", f"Đã lưu file thành công:\n{new_filepath}")
            except Exception as e:
                messagebox.showerror("Lỗi", f"Không thể lưu file: {str(e)}")
    
    def _select_file_for_ops(self, filepath=None):
        """Chọn file cần xử lý hoặc mở file được chỉ định."""
        if not filepath:
            filepath = filedialog.askopenfilename(
                title="Chọn file cần xử lý",
                filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
            )
        if filepath:
            if self.text_modified.get():
                response = messagebox.askyesnocancel(
                    "Lưu thay đổi?",
                    "File hiện tại đã bị thay đổi. Bạn có muốn lưu lại trước khi mở file mới không?"
                )
                if response is True:
                    if not self._save_changes():
                        return
                elif response is None:
                    return

            self.selected_file.set(filepath)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    self.text_content.delete('1.0', tk.END)
                    self.text_content.insert('1.0', content)
                    self.text_content.edit_reset()
                    self.text_content.edit_modified(False)
                    self.text_modified.set(False)
                    self.log(f"Đã mở file '{os.path.basename(filepath)}' để xử lý văn bản.")
                    self.text_content.mark_set(tk.INSERT, "1.0")
                    self.text_content.focus_set()
                    self.split_tree.delete(*self.split_tree.get_children())
                    self._last_loaded_file = filepath
            except Exception as e:
                messagebox.showerror("Lỗi", f"Không thể đọc file: {e}")

    def _find_next(self):
        find_what = self.find_text.get()
        if not find_what:
            return
        
        self._update_history_combobox(self.find_text)

        result = TextOperations.find_text(
            self.text_content,
            find_what,
            match_case=self.match_case.get(),
            match_word=self.match_word.get(),
            use_regex=self.use_regex.get(),
            search_up=self.search_up.get()
        )

        if result:
            self.log(f"Đã tìm thấy \"{find_what}\".")
            start_pos, length = result
            self.text_content.tag_remove(tk.SEL, '1.0', tk.END)
            end_pos = f"{start_pos}+{length}c"
            self.text_content.tag_add(tk.SEL, start_pos, end_pos)
            self.text_content.mark_set(tk.INSERT, end_pos)
            self.text_content.see(start_pos)
            self.text_content.focus_set() # Vẫn focus vào text để người dùng thấy kết quả
        else:
            self.log(f"Không tìm thấy \"{find_what}\".")
            messagebox.showinfo("Không tìm thấy", f"Không tìm thấy \"{find_what}\"", parent=self)
    
    def _replace_current(self):
        try:
            if not self.text_content.tag_ranges(tk.SEL):
                self._find_next()
                if not self.text_content.tag_ranges(tk.SEL): return
        except tk.TclError:
            self._find_next()
            if not self.text_content.tag_ranges(tk.SEL): return

        find_what = self.find_text.get()
        replace_with = self.replace_text.get()
        if find_what: self._update_history_combobox(self.find_text)
        if replace_with: self._update_history_combobox(self.replace_text)

        replaced = TextOperations.replace_text(
            self.text_content,
            find_what,
            replace_with,
            match_case=self.match_case.get(),
            use_regex=self.use_regex.get()
        )

        if replaced:
            self.log(f"Đã thay thế lựa chọn hiện tại bằng '{replace_with}'.") # GHI LOG
            self._find_next()
        else:
            messagebox.showwarning("Thay thế", "Văn bản được chọn không khớp với văn bản tìm kiếm.", parent=self)

    def _replace_all(self):
        find_what = self.find_text.get()
        replace_with = self.replace_text.get()
        if not find_what: return
        
        if find_what: self._update_history_combobox(self.find_text)
        if replace_with: self._update_history_combobox(self.replace_text)

        if not messagebox.askyesno("Xác nhận", "Bạn có chắc muốn thay thế tất cả trong file này?"):
            return

        count = TextOperations.replace_all(
            self.text_content, find_what, replace_with,
            match_case=self.match_case.get(),
            match_word=self.match_word.get(),
            use_regex=self.use_regex.get()
        )
        if count > 0:
            self.log(f"Thay thế tất cả: {count} kết quả được thay thế cho '{find_what}'.") # GHI LOG
            self._mark_text_as_modified()
        messagebox.showinfo("Hoàn tất", f"Đã thay thế {count} kết quả.", parent=self)

    def _save_changes(self):
        """Lưu các thay đổi vào file hiện tại. Trả về True nếu thành công, False nếu thất bại/hủy."""
        filepath = self.selected_file.get()
        if not filepath:
            messagebox.showerror("Lỗi", "Chưa có file nào được chọn.")
            return False
        
        if not messagebox.askyesno("Xác nhận", f"Lưu các thay đổi vào file:\n{os.path.basename(filepath)}?"):
            return False

        try:
            content = self.text_content.get("1.0", tk.END)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

            self.text_modified.set(False)
            self.log(f"Đã lưu thành công file: {os.path.basename(filepath)}")
            messagebox.showinfo("Thành công", "Đã lưu file thành công.")
            return True
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể lưu file: {str(e)}")
            return False

    def _save_as(self):
        """Lưu nội dung hiện tại vào một file mới."""
        new_filepath = filedialog.asksaveasfilename(
            title="Lưu thành file mới",
            initialfile=os.path.basename(self.selected_file.get() or "untitled.txt"),
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if new_filepath:
            try:
                content = self.text_content.get("1.0", tk.END)
                with open(new_filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                # Cập nhật file đang được chọn thành file mới
                self.selected_file.set(new_filepath)
                self.text_modified.set(False)
                self.log(f"Đã lưu file thành công với tên mới: '{os.path.basename(new_filepath)}'")
                messagebox.showinfo("Thành công", f"Đã lưu file thành công:\n{new_filepath}")
            except Exception as e:
                messagebox.showerror("Lỗi", f"Không thể lưu file: {str(e)}")

    def _preview_split(self):
        filepath = self.selected_file.get()
        regex = self.split_regex.get()
        if not filepath or not regex:
            messagebox.showwarning("Thiếu thông tin", "Vui lòng chọn file ở trên và nhập Regex.")
            return
        
        self._update_history_combobox(self.split_regex)
        preview_data, error = TextOperations.split_file(filepath, regex, self.split_position.get())

        self.split_tree.delete(*self.split_tree.get_children())
        if error:
            messagebox.showerror("Lỗi Regex", error)
            return
        
        for i, (content, size) in enumerate(preview_data):
            # Hiển thị nội dung đầy đủ thay vì chỉ hiển thị kích thước
            self.split_tree.insert("", "end", values=(i + 1, content.strip(), f"{size} bytes"))
        self.log(f"Xem trước chia file '{os.path.basename(filepath)}' thành {len(preview_data)} phần.")

    def _execute_split(self):
        filepath = self.selected_file.get()
        regex = self.split_regex.get()
        name_format = self.split_format_combobox.get()

        if not filepath or not regex or not name_format:
            messagebox.showwarning("Thiếu thông tin", "Vui lòng chọn file, nhập Regex và cấu trúc tên file.")
            return

        self._update_history_combobox(self.split_regex)
        self._update_history_combobox(self.split_format_combobox)

        if not messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn chia file '{os.path.basename(filepath)}'?"):
            return

        count, error = TextOperations.execute_split(filepath, regex, self.split_position.get(), name_format)
        if error:
            messagebox.showerror("Lỗi", f"Chia file thất bại: {error}")
        else:
            messagebox.showinfo("Hoàn tất", f"Đã chia file thành công thành {count} phần.")
            self.log(f"Đã chia file '{os.path.basename(filepath)}' thành {count} phần.")


    def _on_pos_change(self):
        self.line_num_spinbox.config(state="normal" if self.credit_position.get() == "line" else "disabled")

    def select_folder(self):
        path = filedialog.askdirectory(title="Chọn thư mục chứa file .txt")
        if path:
            self.folder_path.set(path)
            self.log(f"Đã chọn thư mục: {path}")
            self.schedule_preview_update(None)

    def log(self, message):
        self.log_text.config(state='normal')
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)
        self.log_text.config(state='disabled')

    def schedule_preview_update(self, event=None):
        if self.preview_job: self.after_cancel(self.preview_job)
        self.preview_job = self.after(300, self._update_rename_preview)

    def _update_rename_preview(self):
        path = self.folder_path.get()
        if not os.path.isdir(path): return

        self.tree.delete(*self.tree.get_children())
        self.files_data.clear()
        
        self.log("Bắt đầu quét và phân tích lại các file...")
        try:
            files = [f for f in os.listdir(path) if f.lower().endswith(".txt")]
        except Exception as e:
            self.log(f"Lỗi khi truy cập thư mục: {e}"); messagebox.showerror("Lỗi", f"Không thể đọc các file trong thư mục: {e}"); return

        for filename in files:
            filepath = os.path.join(path, filename)
            fn_regex_list = self.filename_regex_text.get("1.0", tk.END).strip().split('\n')
            ct_regex_list = self.content_regex_text.get("1.0", tk.END).strip().split('\n')
            analysis = logic.analyze_file(filepath, 
                                        custom_filename_regexes=fn_regex_list, 
                                        custom_content_regexes=ct_regex_list)
            self.files_data.append(analysis)
        
        # Sắp xếp file và lưu vào cache
        self._sort_files()

        # Hiển thị file đã sắp xếp lên Treeview
        for i, analysis in enumerate(self.sorted_files_cache):
            self._insert_file_to_tree(analysis, i)
        
        self.log(f"Phân tích hoàn tất cho {len(self.files_data)} file.")
        
        # Cập nhật combobox ở tab credit
        sorted_filenames = [f['filename'] for f in self.sorted_files_cache]
        if sorted_filenames:
            self.credit_file_selector['values'] = sorted_filenames
            self.credit_file_selector.current(0)
        else:
            self.credit_file_selector['values'] = []; self.credit_file_selector.set('')

    def start_renaming(self):
        if not self.sorted_files_cache: messagebox.showwarning("Cảnh báo", "Chưa có file nào để đổi tên."); return
        
        files_to_rename = [f for f in self.sorted_files_cache if f['filename'] not in self.excluded_files]
        if not files_to_rename: messagebox.showwarning("Cảnh báo", "Tất cả file đã bị loại trừ hoặc không có file nào."); return

        if not messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn đổi tên {len(files_to_rename)} file không?"): return
        
        self.log("="*20 + " BẮT ĐẦU ĐỔI TÊN " + "="*20)
        success, fail = 0, 0
        folder, strategy, name_format = self.folder_path.get(), self.strategy.get(), self.format_combobox.get()
        self._update_history_combobox(self.format_combobox)
        
        custom_titles = self.custom_titles_text.get("1.0", tk.END).strip().split('\n') if self.use_custom_titles.get() else None
        
        for i, analysis in enumerate(self.sorted_files_cache):
            if analysis['filename'] in self.excluded_files:
                self.log(f"[Loại trừ] Bỏ qua file: {analysis['filename']}")
                continue
            
            new_name = logic.generate_new_name(analysis, strategy, name_format, custom_titles, i)

            if self.edit_first_line_var.get():
                if new_name is not None:
                    try:
                        new_first_line = os.path.splitext(new_name)[0]
                        with open(analysis['filepath'], 'r', encoding='utf-8') as f:
                            lines = f.readlines()
                        
                        if lines:
                            lines[0] = new_first_line + '\n'
                        else:
                            lines.append(new_first_line + '\n')
                        
                        with open(analysis['filepath'], 'w', encoding='utf-8') as f:
                            f.writelines(lines)
                        self.log(f"[Sửa nội dung] Đã cập nhật dòng đầu của file: {analysis['filename']}")
                    except Exception as e:
                        self.log(f"[Lỗi nội dung] Không thể sửa dòng đầu file {analysis['filename']}: {e}")
                else:
                    self.log(f"[Cảnh báo] Bỏ qua sửa dòng đầu cho file {analysis['filename']} vì không lấy được số chương.")

            if new_name is None: self.log(f"[Bỏ qua] {analysis['filename']}: Không tìm thấy số chương."); fail += 1; continue
            if new_name == analysis['filename']: self.log(f"[Bỏ qua] {analysis['filename']}: Tên đã đúng."); continue
            
            try:
                os.rename(analysis['filepath'], os.path.join(folder, new_name))
                self.log(f"[Thành công] {analysis['filename']} -> {new_name}"); success += 1
            except Exception as e:
                self.log(f"[Lỗi] {analysis['filename']}: {e}"); fail += 1
        
        self.log(f"Hoàn tất! Thành công: {success}, Thất bại/Bỏ qua: {fail}")
        messagebox.showinfo("Hoàn tất", f"Đã xong.\nThành công: {success}\nThất bại/Bỏ qua: {fail + len(self.excluded_files)}")
        self.schedule_preview_update(None)
        
    def preview_credit(self):
        # Lấy tên file trực tiếp từ Combobox, không cần qua tab khác
        filename = self.credit_file_selector.get()
        if not filename:
            messagebox.showinfo("Thông báo", "Vui lòng chọn một file từ danh sách thả xuống để xem trước.")
            return

        filepath = os.path.join(self.folder_path.get(), filename)
        # Lấy nội dung từ Text widget
        credit_content = self.credit_text_widget.get("1.0", tk.END).strip()
        try:
            line_num = self.credit_line_num.get()
        except tk.TclError:
            line_num = 1 # Mặc định là dòng 1 nếu ô trống
        new_content = logic.modify_content(filepath, credit_content, self.credit_position.get(), line_num, preview_only=True)
        
        self.credit_preview_text.config(state="normal")
        self.credit_preview_text.delete('1.0', tk.END)
        self.credit_preview_text.insert('1.0', new_content)
        self.credit_preview_text.config(state="disabled")
        self.log(f"Đã tạo xem trước credit cho file: {filename}")

    def apply_credit_to_all(self):
        if not self.files_data: messagebox.showwarning("Cảnh báo", "Chưa có file nào để áp dụng."); return
        if not messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn thêm credit vào {len(self.files_data)} file không? Hành động này sẽ GHI ĐÈ file."): return
        self.log("="*20 + " BẮT ĐẦU THÊM CREDIT " + "="*20)
        success, fail = 0, 0
        credit_text = self.credit_text_widget.get("1.0", tk.END).strip()
        pos = self.credit_position.get()
        try:
            line_num = self.credit_line_num.get()
        except tk.TclError:
            line_num = 1
        for file_info in self.files_data:
            result = logic.modify_content(file_info['filepath'], credit_text, pos, line_num)
            if result is True: self.log(f"[Thành công] Thêm credit vào file: {file_info['filename']}"); success += 1
            else: self.log(f"[Lỗi] {file_info['filename']}: {result}"); fail += 1
        self.log(f"Hoàn tất! Thành công: {success}, Thất bại: {fail}")
        messagebox.showinfo("Hoàn tất", f"Quá trình thêm credit đã xong.\nThành công: {success}\nThất bại: {fail}")
    
    def _update_history_combobox(self, combobox, max_history=10):
        """Thêm giá trị hiện tại vào đầu danh sách lịch sử."""
        current_value = combobox.get()
        history = list(combobox['values'])
        if current_value in history:
            history.remove(current_value)
        history.insert(0, current_value)
        combobox['values'] = history[:max_history]
    
    def _on_notebook_tab_changed(self, event=None):
        """Khi user chuyển tab: nếu chuyển tới tab 'Xử lý Văn bản' và có selected_file hợp lệ
        thì tự động load file đó (không hiện dialog)."""
        try:
            tab_id = self.notebook.select()
            tab_text = self.notebook.tab(tab_id, 'text')
            if tab_text == "Xử lý Văn bản":
                filepath = self.selected_file.get()
                if filepath and os.path.isfile(filepath):
                    # tránh load lại cùng file nhiều lần
                    if getattr(self, "_last_loaded_file", "") != filepath:
                        self._select_file_for_ops(filepath=filepath)
                        self._last_loaded_file = filepath
                # nếu không có file hợp lệ thì không làm gì (user có thể bấm Chọn... để mở)
        except Exception as e:
            # phòng khi notebook chưa sẵn sàng hoặc lỗi khác
            print(f"Lỗi trong _on_notebook_tab_changed: {e}")

    def _sort_files(self):
        """Sắp xếp danh sách file theo số chương và lưu vào cache."""
        sort_by = self.sort_strategy.get() # 'content' or 'filename'
        
        def get_sort_key(analysis):
            num = None
            if sort_by == 'content':
                num = analysis['from_content']['num']
            else: # 'filename'
                num = analysis['from_filename']['num']
            # Nếu không tìm thấy số ở nguồn ưu tiên, thử nguồn còn lại
            if num is None:
                num = analysis['from_filename']['num'] if sort_by == 'content' else analysis['from_content']['num']
            
            return num if num is not None else float('inf')
        self.sorted_files_cache = sorted(self.files_data, key=get_sort_key)

    def _sort_and_refresh_ui(self):
        """Sắp xếp lại cache và làm mới Treeview mà không cần phân tích lại file."""
        if not self.files_data:
            return
        self._sort_files()
        self.tree.delete(*self.tree.get_children())
        for i, analysis in enumerate(self.sorted_files_cache):
            self._insert_file_to_tree(analysis, i)
        self.log("Đã sắp xếp lại danh sách file.")

    def _search_files(self, event=None):
        search_term = self.search_var.get().lower()
        # Xóa hết item cũ
        self.tree.delete(*self.tree.get_children())
        # Thêm lại các item khớp với tìm kiếm
        for i, analysis in enumerate(self.sorted_files_cache):
            if search_term in analysis['filename'].lower():
                self._insert_file_to_tree(analysis, i)

    def _toggle_exclusion(self, exclude: bool):
        selected_items = self.tree.selection()
        if not selected_items: return
        
        for item_id in selected_items:
            try:
                filename = self.tree.item(item_id, 'values')[1]
                if exclude:
                    self.excluded_files.add(filename)
                else:
                    self.excluded_files.discard(filename)
            except IndexError:
                continue # Bỏ qua nếu không lấy được tên file
        
        self._refresh_tree_tags() # Gọi hàm làm mới màu sắc

    def _refresh_tree_tags(self):
        """Cập nhật lại tags và cột trạng thái cho tất cả các dòng."""
        for item_id in self.tree.get_children():
            try:
                values = list(self.tree.item(item_id, 'values'))
                filename = values[1] # Tên file giờ ở cột thứ 2

                if filename in self.excluded_files:
                    values[0] = "Loại trừ"
                    # Gộp 2 lệnh làm một: vừa cập nhật giá trị, vừa áp dụng tag màu
                    self.tree.item(item_id, values=values, tags=("excluded",))
                else:
                    values[0] = "OK"
                    # Gộp 2 lệnh làm một: vừa cập nhật giá trị, vừa xóa tag màu
                    self.tree.item(item_id, values=values, tags=())
                    
            except IndexError:
                pass

    def _insert_file_to_tree(self, analysis: dict, index: int):
        new_name = self._generate_preview_name(analysis, index)
        tags = ("excluded",) if analysis['filename'] in self.excluded_files else ()
        status = "Loại trừ" if analysis['filename'] in self.excluded_files else "OK"
        item_id = self.tree.insert("", "end", values=(
            status,
            analysis['filename'],
            analysis['from_filename']['num'] or "N/A",
            analysis['from_content']['num'] or "N/A",
            new_name
        ), tags=tags)

        # Lưu đường dẫn đầy đủ để dùng cho preview/chỉnh sửa
        try:
            folder = self.folder_path.get()
            fullpath = os.path.join(folder, analysis['filename'])
        except Exception:
            fullpath = analysis.get('filename', '')
        self.tree_filepaths[item_id] = fullpath


    def _generate_preview_name(self, analysis: dict, index: int) -> str:
        custom_titles = self.custom_titles_text.get("1.0", tk.END).strip().split('\n') if self.use_custom_titles.get() else None
        return logic.generate_new_name(
            analysis, self.strategy.get(), self.format_combobox.get(),
            custom_titles=custom_titles,
            file_index=index
        ) or "Lỗi/Thiếu số"

    def _fetch_online_titles(self):
        url = self.source_url.get()

        if not url:
            messagebox.showerror("Lỗi", "Vui lòng nhập URL mục lục.")
            return

        def _worker():
            pythoncom.CoInitialize()
            try:
                self.log(f"Đang lấy dữ liệu từ {url}...")
                
                selected_site = self.source_web.get()
                result = None

                proxies = self._get_proxy_for_request('fetch_titles')
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
                else:
                    result = {'error': 'Trang web không được hỗ trợ.'}
                
                self.after(0, self._update_online_tree, result)
            finally:
                pythoncom.CoUninitialize()

        threading.Thread(target=_worker, daemon=True).start()

    def _update_online_tree(self, result):
        self.online_tree.delete(*self.online_tree.get_children())
        if 'error' in result:
            error_msg = result['error']
            self.log(f"Lỗi: {error_msg}")
            messagebox.showerror("Lỗi", error_msg)
            return # Dừng hàm sau khi xử lý lỗi
        
        chapters = result.get('data', [])
        for chap in chapters:
            self.online_tree.insert("", "end", values=(chap['num'], chap['title1'], chap['title2']))
        self.log(f"Lấy thành công {len(chapters)} chương.")

    def _apply_online_titles(self):
        selected_items = self.online_tree.selection()
        if not selected_items:
            messagebox.showinfo("Thông báo", "Vui lòng chọn ít nhất một chương từ bảng kết quả.")
            return
        
        selected_titles = []
        
        # Logic mới để gộp tiêu đề
        if self.combine_titles_var.get():
            format_str = self.title_format_var.get()
            for item_id in selected_items:
                item_data = self.online_tree.item(item_id, 'values')
                t1 = item_data[1]
                t2 = item_data[2]
                try:
                    combined_title = format_str.format(t1=t1, t2=t2)
                    selected_titles.append(combined_title)
                except KeyError:
                    # Nếu format string bị lỗi, dùng fallback
                    selected_titles.append(f"{t1} - {t2}")
        else:
            # Logic cũ
            title_key = self.title_choice.get() # 'title1' or 'title2'
            for item_id in selected_items:
                item_data = self.online_tree.item(item_id, 'values')
                title = item_data[1] if title_key == 'title1' else item_data[2]
                selected_titles.append(title)
        
        self.custom_titles_text.delete("1.0", tk.END)
        self.custom_titles_text.insert("1.0", "\n".join(selected_titles))
        self.use_custom_titles.set(True) # Tự động kích hoạt
        
        self.notebook.select(0) # Chuyển về tab Đổi Tên
        self.schedule_preview_update()
        self.log(f"Đã áp dụng {len(selected_titles)} tiêu đề tùy chỉnh.")

    def _render_markdown_guide(self, text_widget, markdown_text):
        """Render văn bản markdown đơn giản hỗ trợ heading (---...---) và bold (**...**)."""
        text_widget.config(state='normal')
        text_widget.delete('1.0', tk.END)

        # Cấu hình font
        base_font = tkfont.Font(font=text_widget.cget("font"))
        bold_font = tkfont.Font(font=base_font)
        bold_font.configure(weight='bold')
        heading_font = tkfont.Font(font=base_font)
        heading_font.configure(size=base_font.cget('size') + 2, weight='bold')

        # Cấu hình tag
        text_widget.tag_configure('bold', font=bold_font)
        text_widget.tag_configure('heading', font=heading_font, foreground="#0b5394", spacing1=5, spacing3=10)

        # Regex để tìm heading và bold
        tag_regex = re.compile(r'^---(.*?)---$|\*\*(.*?)\*\*', re.MULTILINE)
        last_end = 0

        for match in tag_regex.finditer(markdown_text):
            text_widget.insert(tk.END, markdown_text[last_end:match.start()])

            if match.group(1) is not None:  # Khớp với heading
                content = match.group(1).strip()
                text_widget.insert(tk.END, content + "\n", 'heading')
            elif match.group(2) is not None:  # Khớp với bold
                content = match.group(2)
                text_widget.insert(tk.END, content, 'bold')
            
            last_end = match.end()

        text_widget.insert(tk.END, markdown_text[last_end:])
        text_widget.config(state='disabled')

    def _select_online_range(self):
        """Chọn các chương trong bảng online dựa vào chuỗi nhập vào."""
        range_str = self.online_range_var.get().strip().lower()
        if not range_str: return

        all_items = self.online_tree.get_children()
        if not all_items: return

        self.online_tree.selection_remove(self.online_tree.selection()) # Xóa lựa chọn cũ

        try:
            if range_str == 'all' or range_str == '*':
                self.online_tree.selection_add(all_items)
                return

            items_to_select = []
            if '-' in range_str:
                start_str, end_str = range_str.split('-', 1)
                start = int(start_str) if start_str else 1
                end = int(end_str) if end_str else float('inf')
            else:
                start = end = int(range_str)

            for item_id in all_items:
                chap_num = int(self.online_tree.item(item_id, 'values')[0])
                if start <= chap_num <= end:
                    items_to_select.append(item_id)
            
            if items_to_select:
                self.online_tree.selection_add(items_to_select)

        except (ValueError, IndexError):
            messagebox.showerror("Lỗi cú pháp", "Cú pháp không hợp lệ. Hãy dùng các dạng như: '1-10', '-50', '100-', 'all', hoặc '5'.")
    
    def _open_preview_from_rename(self, event):
        """Mở cửa sổ xem file khi double-click ở tab Đổi Tên."""
        selected = self.tree.selection()
        if not selected:
            return
        item = selected[0]
        filepath = self.tree_filepaths.get(item)
        if not filepath:
            # fallback lấy tên từ cột 2
            try:
                filename = self.tree.item(item, 'values')[1]
                filepath = os.path.join(self.folder_path.get(), filename)
            except Exception:
                messagebox.showerror("Lỗi", "Không xác định được đường dẫn file.")
                return

        if not os.path.isfile(filepath):
            messagebox.showerror("Lỗi", f"Không tìm thấy file:\n{filepath}")
            return

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc file: {e}")
            return

        preview_window = tk.Toplevel(self)
        preview_window.title(os.path.basename(filepath))
        preview_window.geometry("800x600")

        txt = scrolledtext.ScrolledText(preview_window, wrap=tk.WORD)
        txt.pack(fill=tk.BOTH, expand=True)
        txt.insert("1.0", content)
        txt.config(state="disabled")

        # Nút Chỉnh sửa — đặt giữa cửa sổ
        btn_frame = ttk.Frame(preview_window)
        # Không fill theo chiều X, để nội dung nằm giữa; nếu muốn có khoảng ngang rộng hơn, dùng fill=tk.X và thêm pady
        btn_frame.pack(fill=tk.X, pady=10)

        # Tạo một frame con để đảm bảo nút nằm chính giữa theo chiều ngang
        center_frame = ttk.Frame(btn_frame)
        center_frame.pack(anchor='center')  # => mọi widget con sẽ nằm ở giữa

        edit_btn = ttk.Button(center_frame, text="Chỉnh sửa", command=lambda: [preview_window.destroy(), self._jump_to_text_ops_and_load(filepath)])
        edit_btn.pack(side=tk.LEFT, padx=5)

        translate_btn = ttk.Button(center_frame, text="Dịch", command=lambda: [preview_window.destroy(), self._jump_to_translator_and_load(filepath)])
        translate_btn.pack(side=tk.LEFT, padx=5)

    def _jump_to_text_ops_and_load(self, filepath):
        """Chuyển sang tab Xử lý Văn bản -> Tìm & Thay thế và load file để chỉnh sửa."""
        # 1) chọn tab Xử lý Văn bản
        for tab_id in self.notebook.tabs():
            if self.notebook.tab(tab_id, 'text') == "Xử lý Văn bản":
                self.notebook.select(tab_id)
                break

        # 2) chọn sub-tab Tìm & Thay thế (giả sử tab thứ nhất trong ops_notebook là Find&Replace)
        try:
            # đảm bảo ops_notebook được lưu tới self.ops_notebook ở create_text_operations_tab
            if hasattr(self, 'ops_notebook'):
                # tìm tab index text == "Tìm & Thay thế"
                for t in self.ops_notebook.tabs():
                    if self.ops_notebook.tab(t, 'text') == "Tìm & Thay thế":
                        self.ops_notebook.select(t)
                        break
                # nếu ko tìm thấy, chọn tab 0
            else:
                # fallback: cố gắng chọn tab 0
                pass
        except Exception:
            pass

        # 3) set selected_file và load file (không show dialog)
        self._select_file_for_ops(filepath=filepath)

    def _jump_to_translator_and_load(self, filepath):
        """Chuyển sang tab Dịch và tải nội dung file vào."""
        # 1. Chuyển sang tab "Dịch"
        for i, tab_text in enumerate(self.notebook.tabs()):
            if self.notebook.tab(i, "text") == "Dịch":
                self.notebook.select(i)
                break
        
        # 2. Tải nội dung file
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            self.translator_input_text.delete("1.0", tk.END)
            self.translator_input_text.insert("1.0", content)
            self.log(f"Đã tải file '{os.path.basename(filepath)}' vào tab Dịch.")
            # 3. Tự động bắt đầu dịch
            self._start_translation_thread(self.translator_input_text, self.translator_output_text)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc hoặc tải file: {e}")

    def _select_tab_by_name(self, name_to_find):
        """Tìm và chọn một tab trong notebook chính dựa vào tên của nó."""
        for i, tab_id in enumerate(self.notebook.tabs()):
            if self.notebook.tab(tab_id, "text") == name_to_find:
                self.notebook.select(i)
                break

    # --------CÁC HÀM CHO TAB DỊCH--------
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

        input_tab = ttk.Frame(left_notebook, padding=5)
        left_notebook.add(input_tab, text="Văn bản gốc")
        input_tab.rowconfigure(0, weight=1)
        input_tab.columnconfigure(0, weight=1)
        
        # Lưu lại text widget để các hàm khác có thể truy cập
        self.translator_input_text = scrolledtext.ScrolledText(input_tab, wrap=tk.WORD, undo=True)
        self.translator_input_text.grid(row=0, column=0, sticky="nsew")
        
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

        # Lưu lại output widget và gán menu chuột phải
        self.translator_output_text = scrolledtext.ScrolledText(right_frame, wrap=tk.WORD, state="disabled")
        self.translator_output_text.grid(row=0, column=0, sticky="nsew")

        self.translator_output_text.chunk_data = {}

        self.translator_output_text.bind("<Button-3>", self._show_translator_context_menu)
        
        control_frame = ttk.Frame(translator_tab, padding=(0, 10, 0, 0))
        control_frame.grid(row=1, column=0, sticky="ew")
        control_frame.columnconfigure(2, weight=1)

        ttk.Button(control_frame, text="Tải file...", 
                command=lambda: self._load_file_into_translator(self.translator_input_text)
        ).grid(row=0, column=0)
        ttk.Button(control_frame, text="Xóa hết", 
                command=lambda: self.translator_input_text.delete("1.0", tk.END)
        ).grid(row=0, column=1, padx=5)

        self.translator_progress_bar = ttk.Progressbar(control_frame, orient="horizontal", mode="determinate")
        self.translator_progress_bar.grid(row=0, column=2, sticky="ew", padx=10)

        ttk.Button(control_frame, text="BẮT ĐẦU DỊCH", 
                command=lambda: self._start_translation_thread(self.translator_input_text, self.translator_output_text)
        ).grid(row=0, column=3)

        self.translator_status_label = ttk.Label(control_frame, text="Sẵn sàng.")
        self.translator_status_label.grid(row=1, column=3, sticky="e", pady=(5,0))

    def _load_file_into_translator(self, text_widget):
        filepath = filedialog.askopenfilename(filetypes=[("Text files", "*.txt"), ("All files", "*.*")])
        if not filepath: return
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            text_widget.delete("1.0", tk.END); text_widget.insert("1.0", content)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc file: {e}", parent=self)
            
    def _create_translator_name_manager(self, parent):
        parent.columnconfigure(0, weight=1); parent.rowconfigure(1, weight=1)
        
        # --- KHUNG ĐIỀU KHIỂN ---
        controls_frame = ttk.Frame(parent)
        controls_frame.grid(row=0, column=0, sticky="ew")
        
        set_selector_frame = ttk.Frame(controls_frame)
        set_selector_frame.pack(fill=tk.X, pady=(0, 5))
        ttk.Label(set_selector_frame, text="Bộ tên:").pack(side=tk.LEFT)
        self.translator_name_set_combo = ttk.Combobox(parent, state="readonly", values=list(self.app_config.get('nameSets', {}).keys()))
        self.translator_name_set_combo.pack(in_=set_selector_frame, side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        self.translator_name_set_combo.set(self.app_config.get('activeNameSet', 'Mặc định'))
        self.translator_name_set_combo.bind("<<ComboboxSelected>>", lambda e: self._refresh_translator_name_preview())
        ttk.Button(set_selector_frame, text="Tạo mới", command=self._create_new_set).pack(side=tk.LEFT)
        ttk.Button(set_selector_frame, text="Xóa bộ", command=self._delete_current_set).pack(side=tk.LEFT, padx=5)

        tools_frame = ttk.Frame(controls_frame)
        tools_frame.pack(fill=tk.X, pady=(5,10))
        ttk.Label(tools_frame, text="Công cụ:").pack(side=tk.LEFT, padx=(0,5))
        ttk.Button(tools_frame, text="Nhập từ file", command=self._import_names).pack(side=tk.LEFT)
        ttk.Button(tools_frame, text="Xuất ra TXT", command=self._export_names_txt).pack(side=tk.LEFT, padx=5)
        ttk.Button(tools_frame, text="Xóa hết name", command=self._clear_names).pack(side=tk.LEFT)
        
        ttk.Label(controls_frame, text="Thêm/Sửa nhanh (Trung=Việt):").pack(anchor="w", pady=(10,0))
        quick_add_text = scrolledtext.ScrolledText(controls_frame, height=5, wrap=tk.WORD, undo=True)
        quick_add_text.pack(fill=tk.X, expand=True, pady=(0, 5))

        def _quick_add_names():
            lines = quick_add_text.get("1.0", tk.END).strip().split('\n')
            set_name = self.translator_name_set_combo.get()
            if not set_name: return
            
            count = 0
            for line in lines:
                parts = line.split('=')
                if len(parts) == 2:
                    ch, vi = parts[0].strip(), parts[1].strip()
                    if ch and vi:
                        self.app_config['nameSets'][set_name][ch] = vi
                        count += 1
            if count > 0:
                self.save_config()
                quick_add_text.delete("1.0", tk.END)
                self._refresh_translator_name_preview()
                messagebox.showinfo("Thành công", f"Đã thêm/cập nhật {count} tên.", parent=self)
                added_keys = [line.split('=')[0].strip() for line in lines if '=' in line]
                if added_keys:
                    self._smart_retranslate(added_keys)

        ttk.Button(controls_frame, text="Thêm/Cập nhật các cặp này", command=_quick_add_names).pack(pady=(0, 10))

        # --- KHUNG XEM TRƯỚC ---
        preview_lf = ttk.LabelFrame(parent, text="Danh sách name")
        preview_lf.grid(row=1, column=0, sticky="nsew")
        preview_lf.rowconfigure(0, weight=1); preview_lf.columnconfigure(0, weight=1)

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
        settings = self.app_config.get('translator_settings', {})

        self.adv_server_url = tk.StringVar(value=settings.get('serverUrl'))
        self.adv_hv_url = tk.StringVar(value=settings.get('hanvietJsonUrl'))
        self.adv_delay = tk.IntVar(value=settings.get('delayMs'))
        self.adv_max_chars = tk.IntVar(value=settings.get('maxChars'))

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
        current_set = self.app_config.get('nameSets', {}).get(set_name, {})
        
        if not current_set:
            ttk.Label(self.name_preview_frame, text="Bộ này trống.", padding=10).pack()
            return

        sorted_keys = sorted(current_set.keys())

        for i, key in enumerate(sorted_keys):
            row_frame = ttk.Frame(self.name_preview_frame, padding=(5, 3))
            row_frame.pack(fill=tk.X, expand=True)
            
            label_text = f"{key} = {current_set[key]}"
            ttk.Label(row_frame, text=label_text).pack(side=tk.LEFT, fill=tk.X, expand=True)

            ttk.Button(row_frame, text="Xóa", command=lambda k=key: self._delete_name_from_list(k)).pack(side=tk.RIGHT)
            ttk.Button(row_frame, text="Sửa/Gợi ý", command=lambda k=key, v=current_set[key]: self._edit_name(k, v)).pack(side=tk.RIGHT, padx=5)

    def _delete_name_from_list(self, key_to_delete: str):
        """Hàm mới để xử lý việc xóa name từ danh sách chính."""
        set_name = self.translator_name_set_combo.get()
        if not set_name: return

        if messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn xóa name '{key_to_delete}' không?", parent=self):
            if key_to_delete in self.app_config['nameSets'][set_name]:
                del self.app_config['nameSets'][set_name][key_to_delete]
                self.save_config()
                self._refresh_translator_name_preview() # Cập nhật lại danh sách

    def _create_new_set(self):
        name = simpledialog.askstring("Tạo bộ mới", "Nhập tên cho bộ mới:", parent=self)
        if name and name not in self.app_config['nameSets']:
            self.app_config['nameSets'][name] = {}
            self.translator_name_set_combo['values'] = list(self.app_config['nameSets'].keys())
            self.translator_name_set_combo.set(name)
            self._refresh_translator_name_preview()
            self.save_config()
        elif name:
            messagebox.showerror("Lỗi", "Tên bộ đã tồn tại.", parent=self)

    def _delete_current_set(self):
        set_name = self.translator_name_set_combo.get()
        if len(self.app_config['nameSets']) <= 1:
            messagebox.showerror("Lỗi", "Không thể xóa bộ tên cuối cùng.", parent=self); return
        if messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn xóa bộ '{set_name}'?", parent=self):
            del self.app_config['nameSets'][set_name]
            new_active_set = list(self.app_config['nameSets'].keys())[0]
            self.translator_name_set_combo['values'] = list(self.app_config['nameSets'].keys())
            self.translator_name_set_combo.set(new_active_set)
            self._refresh_translator_name_preview()
            self.save_config()

    def _import_names(self):
        filepath = filedialog.askopenfilename(filetypes=[("Text & JSON", "*.txt *.json"), ("All files", "*.*")], parent=self)
        if not filepath: return
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f: content = f.read()
            new_names = {}
            if filepath.endswith('.json'): new_names = json.loads(content)
            else:
                for line in content.split('\n'):
                    parts = line.split('=')
                    if len(parts) == 2 and parts[0].strip() and parts[1].strip():
                        new_names[parts[0].strip()] = parts[1].strip()
            
            set_name = self.translator_name_set_combo.get()
            self.app_config['nameSets'][set_name].update(new_names)
            self._refresh_translator_name_preview()
            self.save_config()
            messagebox.showinfo("Thành công", f"Đã nhập và cập nhật {len(new_names)} tên.", parent=self)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc file: {e}", parent=self)

    def _export_names_txt(self):
        set_name = self.translator_name_set_combo.get()
        current_set = self.app_config['nameSets'].get(set_name, {})
        filepath = filedialog.asksaveasfilename(defaultextension=".txt", initialfile=f"{set_name}.txt", filetypes=[("Text files", "*.txt")], parent=self)
        if not filepath: return
        try:
            content = "\n".join(f"{k}={v}" for k, v in current_set.items())
            with open(filepath, 'w', encoding='utf-8') as f: f.write(content)
            messagebox.showinfo("Thành công", "Đã xuất file thành công.", parent=self)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể lưu file: {e}", parent=self)

    def _clear_names(self):
        set_name = self.translator_name_set_combo.get()
        if messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn xóa TẤT CẢ name trong bộ '{set_name}'?", icon='warning', parent=self):
            self.app_config['nameSets'][set_name] = {}
            self._refresh_translator_name_preview()
            self.save_config()

    def _edit_name(self, key, current_viet=""):
        original_key = key # Lưu lại key gốc để xử lý đổi tên
        
        edit_win = tk.Toplevel(self)
        edit_win.title("Thêm / Sửa Name")
        edit_win.geometry("500x150")
        edit_win.transient(self)
        edit_win.grab_set()

        main_frame = ttk.Frame(edit_win, padding=15)
        main_frame.pack(fill=tk.BOTH, expand=True)
        main_frame.columnconfigure(1, weight=1)

        ttk.Label(main_frame, text="Tiếng Trung:").grid(row=0, column=0, sticky="w", pady=2)
        key_entry = ttk.Entry(main_frame)
        key_entry.insert(0, key)
        key_entry.grid(row=0, column=1, sticky="ew", pady=2)

        ttk.Label(main_frame, text="Tiếng Việt:").grid(row=1, column=0, sticky="w", pady=2)
        viet_entry = ttk.Entry(main_frame)
        initial_value = current_viet or self.app_config['nameSets'][self.translator_name_set_combo.get()].get(key, "")
        viet_entry.insert(0, initial_value)
        viet_entry.grid(row=1, column=1, sticky="ew", pady=2)
        viet_entry.focus_set()
        viet_entry.selection_range(0, tk.END)

        btn_frame = ttk.Frame(main_frame)
        btn_frame.grid(row=2, column=0, columnspan=2, pady=(15, 0), sticky="e")
        
        # --- LOGIC NÚT ĐỘNG ---

        def on_save_or_update():
            new_key = key_entry.get().strip()
            new_viet = viet_entry.get().strip()
            if not new_key or not new_viet:
                messagebox.showerror("Lỗi", "Không được để trống.", parent=edit_win)
                return

            set_name = self.translator_name_set_combo.get()
            # Nếu đổi key, xóa key cũ đi
            if original_key != new_key and original_key in self.app_config['nameSets'][set_name]:
                del self.app_config['nameSets'][set_name][original_key]
            
            self.app_config['nameSets'][set_name][new_key] = new_viet
            self._refresh_translator_name_preview()
            self.save_config()
            edit_win.destroy()
            self._smart_retranslate([new_key])

        def on_delete():
            key_to_delete = key_entry.get().strip()
            if not key_to_delete: return
            
            set_name = self.translator_name_set_combo.get()
            if messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn xóa name '{key_to_delete}'?", parent=edit_win):
                if key_to_delete in self.app_config['nameSets'][set_name]:
                    del self.app_config['nameSets'][set_name][key_to_delete]
                    self.save_config()
                    self._refresh_translator_name_preview()
                edit_win.destroy()
        
        # Tạo tất cả các nút
        suggest_btn = ttk.Button(btn_frame, text="Gợi ý...",
                                command=lambda: self._show_suggestion_window(key_entry.get(), lambda v: (viet_entry.delete(0, tk.END), viet_entry.insert(0, v), edit_win.lift(), viet_entry.focus_set())))
        cancel_btn = ttk.Button(btn_frame, text="Hủy", command=edit_win.destroy)
        
        save_btn = ttk.Button(btn_frame, text="Lưu", command=on_save_or_update)
        update_btn = ttk.Button(btn_frame, text="Sửa", command=on_save_or_update)
        delete_btn = ttk.Button(btn_frame, text="Xóa", command=on_delete)
        
        # Hàm kiểm tra và thay đổi nút
        def update_buttons(event=None):
            current_key = key_entry.get().strip()
            set_name = self.translator_name_set_combo.get()
            exists = current_key in self.app_config['nameSets'][set_name]

            # Ẩn tất cả các nút hành động trước
            save_btn.grid_remove()
            update_btn.grid_remove()
            delete_btn.grid_remove()
            
            if exists:
                # Nếu name đã tồn tại -> hiện Sửa và Xóa
                update_btn.grid(row=0, column=2, padx=5)
                delete_btn.grid(row=0, column=3, padx=5)
            else:
                # Nếu là name mới -> hiện Lưu
                save_btn.grid(row=0, column=2, padx=5)

        # Đặt các nút cố định và gọi hàm update_buttons
        suggest_btn.grid(row=0, column=0)
        cancel_btn.grid(row=0, column=1, padx=5)
        
        # Gán sự kiện cho ô nhập Tiếng Trung
        key_entry.bind("<KeyRelease>", update_buttons)
        
        # Gọi lần đầu để có trạng thái đúng
        update_buttons()

    def _show_translator_context_menu(self, event):
        widget = event.widget
        index = widget.index(f"@{event.x},{event.y}")
        tags = widget.tag_names(index)
        chunk_tag = next((t for t in tags if t.startswith("chunk_")), None)
        if not chunk_tag: return

        original_chinese = widget.chunk_data.get(chunk_tag)
        # Lấy toàn bộ nội dung của chunk tiếng Việt tương ứng
        tag_range = widget.tag_ranges(chunk_tag)
        full_vietnamese_chunk = widget.get(tag_range[0], tag_range[1])

        if not original_chinese: return

        context_menu = tk.Menu(widget, tearoff=0)
        context_menu.add_command(
            label="Sửa Name...",
            command=lambda: self._edit_name(original_chinese, full_vietnamese_chunk.strip())
        )
        context_menu.tk_popup(event.x_root, event.y_root)

    def _show_suggestion_window(self, key, on_select_callback):
        suggest_win = tk.Toplevel(self)
        suggest_win.title(f"Gợi ý cho '{key}'")
        suggest_win.geometry("600x400")
        suggest_win.transient(self)
        suggest_win.grab_set()

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
            on_select_callback(new_name) # Gọi callback để gửi dữ liệu về
            suggest_win.destroy()
        
        def create_clickable_label(parent_widget, text, callback):
            # Dùng Text widget để có thể tạo link dễ hơn
            parent_widget.config(state="normal")
            tag_name = f"link_{text.replace(' ', '_')}"
            parent_widget.insert(tk.END, text + "\n", (tag_name,))
            parent_widget.tag_config(tag_name, foreground="blue", underline=True, spacing1=3, spacing3=3)
            parent_widget.tag_bind(tag_name, "<Enter>", lambda e: parent_widget.config(cursor="hand2"))
            parent_widget.tag_bind(tag_name, "<Leave>", lambda e: parent_widget.config(cursor=""))
            parent_widget.tag_bind(tag_name, "<Button-1>", lambda e, t=text: callback(t))
            parent_widget.config(state="disabled")

        def worker():
            hv_url = self.app_config.get('translator_settings', {}).get('hanvietJsonUrl')
            hv_map = trans_logic.load_hanviet_json(hv_url)
            hv_suggestion = trans_logic.build_hanviet_from_map(key, hv_map)
            hv_lines = trans_logic.progressive_capitalizations(hv_suggestion)
            
            server_url = self.app_config.get('translator_settings', {}).get('serverUrl')
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

    def _start_translation_thread(self, input_widget, output_widget):
        input_content = input_widget.get("1.0", tk.END).strip()
        if not input_content:
            messagebox.showwarning("Cảnh báo", "Không có nội dung để dịch.", parent=self); return
            
        if getattr(self, 'is_translating', False): return
        self.is_translating = True

        # Lưu lại cài đặt nâng cao trước khi dịch
        self.app_config['translator_settings']['serverUrl'] = self.adv_server_url.get()
        self.app_config['translator_settings']['hanvietJsonUrl'] = self.adv_hv_url.get()
        self.app_config['translator_settings']['delayMs'] = self.adv_delay.get()
        self.app_config['translator_settings']['maxChars'] = self.adv_max_chars.get()

        proxies = self._get_proxy_for_request('translate')
        if proxies:
            self.log(f"Dịch thuật sử dụng proxy: {proxies['http']}")
        self.app_config['translator_settings']['proxies'] = proxies

        set_name = self.translator_name_set_combo.get()
        active_name_set = self.app_config.get('nameSets', {}).get(set_name, {})
        
        thread = threading.Thread(target=self._translation_worker, args=(input_content, active_name_set, self.app_config['translator_settings'], output_widget))
        thread.daemon = True
        thread.start()

    def _translation_worker(self, content, name_set, settings, output_widget):
        def update_ui_progress(message, value):
            self.after(0, lambda: [
                self.translator_status_label.config(text=message),
                self.translator_progress_bar.config(value=value)
            ])

        chunks = content.split('\n')
        translated_chunks = trans_logic.translate_text_chunks(chunks, name_set, settings, update_ui_progress)
        
        def update_output_widget():
            output_widget.config(state="normal")
            output_widget.delete("1.0", tk.END)
            output_widget.chunk_data = {}

            original_chunks = content.split('\n')

            for i, translated_chunk in enumerate(translated_chunks):
                tag_name = f"chunk_{i}"
                original_chunk = original_chunks[i] if i < len(original_chunks) else ""
                output_widget.chunk_data[tag_name] = original_chunk
                output_widget.insert(tk.END, translated_chunk + '\n', (tag_name,))
                
            output_widget.config(state="disabled")
        self.after(0, update_output_widget)
        self.is_translating = False

    def _smart_retranslate(self, affected_keys):
        """Dịch lại một cách thông minh các chunk bị ảnh hưởng bởi việc thay đổi name."""
        if not hasattr(self, 'translator_output_text') or not self.translator_output_text.chunk_data:
            return

        output_widget = self.translator_output_text
        chunks_to_retranslate = []
        # update_plan sẽ lưu: {chỉ_số_của_chunk_cần_dịch: 'tag_name_tương_ứng'}
        update_plan = {}
        
        # 1. Thu thập các chunk cần dịch lại
        all_original_chunks = list(output_widget.chunk_data.values())
        for i, original_chunk in enumerate(all_original_chunks):
            if any(key in original_chunk for key in affected_keys):
                chunks_to_retranslate.append(original_chunk)
                # Tìm tag_name tương ứng với original_chunk này
                tag_name = next((tag for tag, text in output_widget.chunk_data.items() if text == original_chunk), None)
                if tag_name:
                    update_plan[len(chunks_to_retranslate) - 1] = tag_name

        if not chunks_to_retranslate:
            return # Không có gì để cập nhật

        # 2. Chạy dịch trong một thread mới
        def worker():
            self.after(0, lambda: self.translator_status_label.config(text=f"Đang cập nhật {len(chunks_to_retranslate)} đoạn..."))
            set_name = self.translator_name_set_combo.get()
            active_name_set = self.app_config.get('nameSets', {}).get(set_name, {})
            settings = self.app_config.get('translator_settings', {})

            newly_translated = trans_logic.translate_text_chunks(chunks_to_retranslate, active_name_set, settings)

            # 3. Cập nhật lại UI
            def update_ui():
                output_widget.config(state="normal")
                for i, new_text in enumerate(newly_translated):
                    tag_name = update_plan.get(i)
                    if tag_name:
                        # Xóa nội dung cũ và chèn nội dung mới vào đúng tag đó
                        tag_range = output_widget.tag_ranges(tag_name)
                        if tag_range:
                            output_widget.delete(tag_range[0], tag_range[1])
                            output_widget.insert(tag_range[0], new_text + '\n', (tag_name,))
                output_widget.config(state="disabled")
                self.translator_status_label.config(text="Cập nhật hoàn tất.")

            self.after(0, update_ui)

        threading.Thread(target=worker, daemon=True).start()

    # ----------TAB TẢI ẢNH----------
    def create_image_processing_tab(self):
        img_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(img_tab, text="Xử lý Ảnh") # ĐÃ ĐỔI TÊN
        img_tab.rowconfigure(1, weight=1)
        img_tab.columnconfigure(0, weight=1)

        # --- KHUNG NGUỒN ẢNH ---
        url_frame = ttk.LabelFrame(img_tab, text="1. Nguồn ảnh", padding=10)
        url_frame.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        url_frame.columnconfigure(0, weight=1)
        
        self.image_url_var = tk.StringVar()
        url_entry = ttk.Entry(url_frame, textvariable=self.image_url_var)
        url_entry.grid(row=0, column=0, sticky="ew")
        
        # Frame chứa 2 nút tải
        download_buttons_frame = ttk.Frame(url_frame)
        download_buttons_frame.grid(row=0, column=1, padx=(10, 0))
        ttk.Button(download_buttons_frame, text="Tải từ URL", command=self._start_image_download_thread).pack(side=tk.LEFT)
        ttk.Button(download_buttons_frame, text="Tải file lên...", command=self._load_local_image).pack(side=tk.LEFT, padx=(5,0)) # NÚT MỚI

        # --- KHUNG XEM TRƯỚC VÀ XỬ LÝ ---
        preview_frame = ttk.LabelFrame(img_tab, text="2. Xem trước & Xử lý", padding=10)
        preview_frame.grid(row=1, column=0, sticky="nsew")
        preview_frame.rowconfigure(0, weight=1)
        preview_frame.columnconfigure(0, weight=1)

        self.image_canvas = tk.Canvas(preview_frame, bg="gray90", highlightthickness=0)
        self.image_canvas.grid(row=0, column=0, sticky="nsew")
        self.image_canvas.bind("<MouseWheel>", self._on_image_scroll)
        self.image_canvas.bind("<ButtonPress-1>", self._on_image_drag_start)
        self.image_canvas.bind("<B1-Motion>", self._on_image_drag_move)

        # --- KHUNG LƯU ẢNH ---
        tools_frame = ttk.LabelFrame(img_tab, text="3. Công cụ & Lưu ảnh", padding=10)
        tools_frame.grid(row=2, column=0, sticky="ew", pady=(10, 0))
        tools_frame.columnconfigure(1, weight=1) # Cho slider giãn ra

        # Hàng 1: Chọn công cụ
        ttk.Label(tools_frame, text="Công cụ:").grid(row=0, column=0, sticky="w", padx=5, pady=5)
        self.image_tool_combo = ttk.Combobox(tools_frame, state="readonly", values=[
            "Làm nét (Unsharp Mask)",
            "Tăng chi tiết (Detail)",
            "Nâng cấp độ phân giải x2 (Lanczos)"
        ])
        self.image_tool_combo.grid(row=0, column=1, columnspan=2, sticky="ew", padx=5)
        self.image_tool_combo.set("Làm nét (Unsharp Mask)")

        # Hàng 2: Thanh trượt cường độ
        ttk.Label(tools_frame, text="Cường độ:").grid(row=1, column=0, sticky="w", padx=5, pady=5)
        self.intensity_var = tk.DoubleVar(value=50)
        intensity_slider = ttk.Scale(tools_frame, from_=0, to=100, orient="horizontal", variable=self.intensity_var)
        intensity_slider.grid(row=1, column=1, sticky="ew", padx=5)
        intensity_label = ttk.Label(tools_frame, text="50%")
        intensity_label.grid(row=1, column=2, sticky="w", padx=5)
        self.intensity_var.trace_add("write", lambda *args: intensity_label.config(text=f"{int(self.intensity_var.get())}%"))

        # Hàng 3: Các nút hành động
        action_frame = ttk.Frame(tools_frame)
        action_frame.grid(row=2, column=0, columnspan=3, sticky="ew", pady=(10,0))
        self.apply_tool_btn = ttk.Button(action_frame, text="Áp dụng", command=self._apply_image_enhancement, state="disabled")
        self.apply_tool_btn.pack(side=tk.LEFT, padx=5)
        self.undo_image_btn = ttk.Button(action_frame, text="Hoàn tác về gốc", command=self._undo_image_enhancement, state="disabled")
        self.undo_image_btn.pack(side=tk.LEFT)

        ttk.Separator(action_frame, orient='vertical').pack(side=tk.LEFT, fill='y', padx=15, pady=5)

        ttk.Label(action_frame, text="Lưu định dạng:").pack(side=tk.LEFT)
        self.image_format_combo = ttk.Combobox(action_frame, state="readonly", values=["PNG", "JPEG", "WEBP", "BMP", "GIF"])
        self.image_format_combo.set("PNG")
        self.image_format_combo.pack(side=tk.LEFT, padx=5)
        self.save_image_btn = ttk.Button(action_frame, text="Lưu ảnh...", command=self._save_converted_image, state="disabled")
        self.save_image_btn.pack(side=tk.RIGHT, padx=5)

        self.image_status_label = ttk.Label(img_tab, text="Sẵn sàng.")
        self.image_status_label.grid(row=3, column=0, sticky="w", pady=(5,0))

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
            proxies = self._get_proxy_for_request('images')
            if proxies:
                self.log(f"Tải ảnh sử dụng proxy: {proxies['http']}")
            response = requests.get(url, timeout=60, headers={'User-Agent': 'Mozilla/5.0'}, proxies=proxies)
            response.raise_for_status()
            # Gọi hàm xử lý chung
            self._process_image_data(io.BytesIO(response.content))
        except Exception as e:
            self.downloaded_image_data = None
            self.image_original_pil = None
            def update_ui_error():
                self.image_canvas.delete("all")
                self.image_canvas.create_text(self.image_canvas.winfo_width()/2, self.image_canvas.winfo_height()/2, text="Lỗi khi tải hoặc xử lý ảnh.", anchor="center", fill="red")
                self.image_status_label.config(text=f"Lỗi: {e}")
            self.after(0, update_ui_error)

    def _save_converted_image(self):
        # Nếu đã có bản chỉnh (image_display_pil), ưu tiên lưu bản đó
        if getattr(self, "image_display_pil", None):
            img_to_save = self.image_display_pil
        else:
            # fallback mở lại dữ liệu gốc
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
            filetypes=file_types.get(selected_format, [("All files", "*.*")])
        )

        if not filepath:
            return

        try:
            if selected_format == 'JPEG' and img_to_save.mode == 'RGBA':
                img_to_save = img_to_save.convert('RGB')
            img_to_save.save(filepath, format=selected_format)
            self.image_status_label.config(text=f"Đã lưu thành công tại: {filepath}")
            messagebox.showinfo("Thành công", "Đã lưu ảnh thành công!")
        except Exception as e:
            self.image_status_label.config(text=f"Lỗi khi lưu: {e}")
            messagebox.showerror("Lỗi", f"Không thể lưu ảnh: {e}")

    def _on_image_scroll(self, event):
        """Xử lý phóng to/thu nhỏ ảnh bằng con lăn chuột."""
        if not self.image_original_pil:
            return
        
        # event.delta > 0 là cuộn lên (phóng to), < 0 là cuộn xuống (thu nhỏ)
        if event.delta > 0:
            self.image_zoom_factor *= 1.1
        else:
            self.image_zoom_factor /= 1.1
        
        # Giới hạn mức zoom
        self.image_zoom_factor = max(0.1, min(self.image_zoom_factor, 5.0))
        self._update_image_display()

    def _on_image_drag_start(self, event):
        """Lưu vị trí bắt đầu khi nhấn chuột để kéo."""
        self._image_drag_data["x"] = event.x
        self._image_drag_data["y"] = event.y

    def _on_image_drag_move(self, event):
        """Di chuyển ảnh trên canvas khi kéo chuột."""
        if not self.image_original_pil:
            return
        
        dx = event.x - self._image_drag_data["x"]
        dy = event.y - self._image_drag_data["y"]
        
        # Di chuyển ảnh bằng cách thay đổi tọa độ của nó
        self.image_canvas.move("image", dx, dy)
        
        # Cập nhật lại vị trí bắt đầu cho lần di chuyển tiếp theo
        self._image_drag_data["x"] = event.x
        self._image_drag_data["y"] = event.y

    def _update_image_display(self):
        """Cập nhật ảnh trên Canvas dựa trên image_display_pil (nếu có) hoặc image_original_pil."""
        source = self.image_display_pil if getattr(self, "image_display_pil", None) else getattr(self, "image_original_pil", None)
        if not source:
            return

        # Tính toán kích thước mới dựa trên source (ảnh hiện đang muốn hiển thị)
        new_width = max(1, int(source.width * self.image_zoom_factor))
        new_height = max(1, int(source.height * self.image_zoom_factor))

        # Resize ảnh bằng Pillow (chất lượng cao)
        resized_pil = source.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Chuyển đổi và gán cho PhotoImage
        self.tk_photo_image = ImageTk.PhotoImage(resized_pil)

        # Xóa ảnh cũ và vẽ ảnh mới vào giữa Canvas
        self.image_canvas.delete("all")
        self.image_canvas.create_image(
            self.image_canvas.winfo_width() / 2,
            self.image_canvas.winfo_height() / 2,
            anchor="center",
            image=self.tk_photo_image,
            tags="image"
        )

        # Nếu ảnh đã bị chỉnh sửa khác với gốc thì hiển thị dấu hiệu
        if getattr(self, "image_display_pil", None) and getattr(self, "image_original_pil", None):
            if self.image_display_pil.tobytes() != self.image_original_pil.tobytes():
                self.image_status_label.config(text=f"Đã tải! {self.image_original_pil.width}x{self.image_original_pil.height} | Zoom: {self.image_zoom_factor:.1f}x (Đã chỉnh sửa)")
                return

        self.image_status_label.config(text=f"Đã tải! Kích thước: {self.image_original_pil.width}x{self.image_original_pil.height} | Zoom: {self.image_zoom_factor:.1f}x")


    def _load_local_image(self):
        filepath = filedialog.askopenfilename(
            title="Chọn một file ảnh",
            filetypes=[("Image Files", "*.png *.jpg *.jpeg *.bmp *.webp *.gif"), ("All files", "*.*")]
        )
        if not filepath:
            return

        self.save_image_btn.config(state="disabled")
        self.image_status_label.config(text=f"Đang mở file: {os.path.basename(filepath)}...")

        try:
            with open(filepath, 'rb') as f:
                image_data = io.BytesIO(f.read())
            # Gọi hàm xử lý chung
            self._process_image_data(image_data)
        except Exception as e:
            self.image_status_label.config(text=f"Lỗi: Không thể mở file ảnh.")
            messagebox.showerror("Lỗi", f"Không thể mở file ảnh: {e}")

    def _process_image_data(self, image_bytes_io):
        """Xử lý dữ liệu ảnh (BytesIO) và cập nhật UI."""
        self.downloaded_image_data = image_bytes_io
        
        # Mở ảnh và lưu cả bản gốc và bản hiển thị
        self.image_original_pil = Image.open(self.downloaded_image_data)
        self.image_display_pil = self.image_original_pil.copy() # Rất quan trọng
        
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
        
        # Áp dụng bộ lọc làm nét
        self.image_display_pil = self.image_display_pil.filter(ImageFilter.SHARPEN)
        self.undo_image_btn.config(state="normal") # Cho phép hoàn tác
        self._update_image_display()
        self.image_status_label.config(text="Đã áp dụng bộ lọc làm nét.")

    def _undo_image_enhancement(self):
        if not self.image_original_pil:
            return

        # Phục hồi ảnh hiển thị từ bản gốc
        self.image_display_pil = self.image_original_pil.copy()
        self.undo_image_btn.config(state="disabled") # Không cần hoàn tác nữa
        self._update_image_display()
        self.image_status_label.config(text="Đã hoàn tác về ảnh gốc.")

    def _apply_image_enhancement(self):
        if not getattr(self, "image_original_pil", None):
            return

        # disable nút để tránh bấm liên tục
        self.apply_tool_btn.config(state="disabled")
        self.save_image_btn.config(state="disabled")
        self.image_status_label.config(text="Đang xử lý ảnh...")

        def worker():
            try:
                tool = self.image_tool_combo.get()
                intensity = self.intensity_var.get()
                img_to_process = self.image_original_pil.copy()

                result_pil = None
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

                # cập nhật UI an toàn
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

    def _open_proxy_manager_window(self):
        proxy_win = tk.Toplevel(self)
        proxy_win.title("Quản lý Proxy")
        proxy_win.geometry("700x550") 
        proxy_win.transient(self)
        proxy_win.grab_set()

        main_paned = ttk.PanedWindow(proxy_win, orient=tk.VERTICAL)
        main_paned.pack(fill=tk.BOTH, expand=True, padx=15, pady=15)

        input_frame = ttk.Frame(main_paned)
        main_paned.add(input_frame, weight=2)
        input_frame.rowconfigure(1, weight=1); input_frame.columnconfigure(0, weight=1)
        ttk.Label(input_frame, text="Nhập danh sách proxy (mỗi proxy một dòng):").grid(row=0, column=0, sticky="w")
        proxy_text = scrolledtext.ScrolledText(input_frame, wrap=tk.WORD, height=10)
        proxy_text.grid(row=1, column=0, sticky="nsew", pady=5)
        
        placeholder_text = (
            "# Dán danh sách proxy vào đây. Ví dụ:\n"
            "http://123.45.67.89:8080\n"
            "socks5://user:pass@98.76.54.32:1080\n"
            "socks4://1.4.195.114:4145"
        )
        
        def add_placeholder(event=None):
            if not proxy_text.get("1.0", "end-1c").strip():
                proxy_text.config(foreground="grey")
                proxy_text.insert("1.0", placeholder_text)

        def remove_placeholder(event=None):
            if proxy_text.get("1.0", "end-1c") == placeholder_text:
                proxy_text.delete("1.0", tk.END)
                proxy_text.config(foreground="black")
        
        proxy_text.bind("<FocusIn>", remove_placeholder)
        proxy_text.bind("<FocusOut>", add_placeholder)

        proxy_settings = self.app_config.get('proxy_settings', {})
        proxy_list = proxy_settings.get('proxies', [])
        
        if proxy_list:
            proxy_text.insert("1.0", "\n".join(proxy_list))
        else:
            add_placeholder()

        result_frame = ttk.LabelFrame(main_paned, text="Kết quả kiểm tra", padding=10)
        main_paned.add(result_frame, weight=1)
        result_frame.rowconfigure(0, weight=1); result_frame.columnconfigure(0, weight=1)
        result_text = scrolledtext.ScrolledText(result_frame, wrap=tk.WORD, height=5, state="disabled")
        result_text.grid(row=0, column=0, sticky="nsew")

        # warning_label = ttk.Label(
        #     main_paned, 
        #     text="Lưu ý: Các proxy miễn phí trên mạng thường không ổn định, rất chậm và có thể không an toàn. Hãy cân nhắc kỹ trước khi sử dụng.",
        #     foreground="dark orange", # Màu cam sẫm để cảnh báo
        #     wraplength=550, # Tự động xuống dòng nếu văn bản quá dài
        #     justify=tk.LEFT
        # )
        # warning_label.grid(row=4, column=0, sticky="w", pady=(5, 10))

        # KHUNG TÙY CHỌN VÀ NÚT BẤM
        bottom_frame = ttk.Frame(proxy_win)
        bottom_frame.pack(fill=tk.X, padx=15, pady=(0, 15))

        options_frame = ttk.LabelFrame(bottom_frame, text="Sử dụng proxy cho các chức năng", padding=10)
        options_frame.pack(side=tk.LEFT, fill=tk.Y, expand=True)

        use_for_fetch = tk.BooleanVar(value=proxy_settings.get('use_for_fetch_titles', False))
        use_for_translate = tk.BooleanVar(value=proxy_settings.get('use_for_translate', False))
        use_for_images = tk.BooleanVar(value=proxy_settings.get('use_for_images', False))

        ttk.Checkbutton(options_frame, text="Lấy tiêu đề online", variable=use_for_fetch).pack(anchor="w")
        ttk.Checkbutton(options_frame, text="Dịch thuật", variable=use_for_translate).pack(anchor="w")
        ttk.Checkbutton(options_frame, text="Tải ảnh từ URL", variable=use_for_images).pack(anchor="w")

        def _save_proxy_settings():
            # Lấy danh sách proxy, bỏ qua placeholder nếu còn
            proxies_raw = proxy_text.get("1.0", tk.END).strip()
            if proxies_raw == placeholder_text:
                proxy_list = []
            else:
                proxy_list = [line.strip() for line in proxies_raw.split('\n') if line.strip()]

            self.app_config['proxy_settings'] = {
                'proxies': proxy_list,
                'use_for_fetch_titles': use_for_fetch.get(),
                'use_for_translate': use_for_translate.get(),
                'use_for_images': use_for_images.get()
            }
            self.save_config()
            messagebox.showinfo("Thành công", "Đã lưu cài đặt proxy.", parent=proxy_win)
            proxy_win.destroy()

        action_frame = ttk.Frame(bottom_frame)
        action_frame.pack(side=tk.RIGHT)
        
        check_btn = ttk.Button(action_frame, text="Kiểm tra Proxy", command=lambda: self._start_proxy_check_thread(proxy_text, result_text, check_btn))
        check_btn.pack(fill=tk.X, pady=2)
        
        save_btn = ttk.Button(action_frame, text="Lưu và Đóng", command=lambda: _save_proxy_settings())
        save_btn.pack(fill=tk.X, pady=2)

    def _get_proxy_for_request(self, feature_name: str):
        """
        Lấy một proxy ngẫu nhiên từ danh sách đã lưu (không kiểm tra lại).
        feature_name: 'fetch_titles', 'translate', 'images'
        """
        proxy_settings = self.app_config.get('proxy_settings', {})
        use_proxy_flag = proxy_settings.get(f'use_for_{feature_name}', False)

        if not use_proxy_flag:
            return None

        proxy_list = proxy_settings.get('proxies', [])
        if not proxy_list:
            self.log("[Proxy] Chức năng proxy được bật nhưng danh sách trống.")
            return None

        chosen_proxy = random.choice(proxy_list)
        self.log(f"[Proxy] Sử dụng proxy ngẫu nhiên: {chosen_proxy}")
        return {"http": chosen_proxy, "https": chosen_proxy}

    def _start_proxy_check_thread(self, proxy_widget, result_widget, button):
        """Khởi động luồng kiểm tra proxy."""
        proxies_raw = proxy_widget.get("1.0", tk.END).strip()
        proxy_list = [line.strip() for line in proxies_raw.split('\n') if line.strip() and not line.startswith('#')]
        
        if not proxy_list:
            messagebox.showwarning("Thông báo", "Không có proxy nào để kiểm tra.", parent=proxy_widget)
            return

        button.config(state="disabled")
        result_widget.config(state="normal")
        result_widget.delete("1.0", tk.END)
        result_widget.insert("1.0", f"Bắt đầu kiểm tra {len(proxy_list)} proxy...\n")
        result_widget.config(state="disabled")

        thread = threading.Thread(
            target=self._check_proxies_worker,
            args=(proxy_list, result_widget, button, proxy_widget),
            daemon=True
        )
        thread.start()

    def _check_single_proxy(self, proxy_str, timeout=30):
        """Hàm con để kiểm tra một proxy duy nhất."""
        try:
            proxies_dict = {"http": proxy_str, "https": proxy_str}
            start_time = time.time()
            # httpbin.org/get là một endpoint nhẹ để kiểm tra
            response = requests.get("http://httpbin.org/get", proxies=proxies_dict, timeout=timeout)
            response.raise_for_status()
            latency = (time.time() - start_time) * 1000  # ms
            return proxy_str, True, f"{latency:.0f}ms"
        except Exception as e:
            return proxy_str, False, str(e).splitlines()[-1]

    def _check_proxies_worker(self, proxy_list, result_widget, button, proxy_widget):
        """Worker chạy trong thread để kiểm tra song song."""
        working_proxies = []
        
        # Giới hạn 100 luồng kiểm tra cùng lúc để tránh quá tải
        with ThreadPoolExecutor(max_workers=100) as executor:
            future_to_proxy = {executor.submit(self._check_single_proxy, proxy): proxy for proxy in proxy_list}
            
            for future in as_completed(future_to_proxy):
                proxy, is_working, result_msg = future.result()
                
                def update_ui():
                    result_widget.config(state="normal")
                    if is_working:
                        result_widget.insert(tk.END, f"SỐNG - {proxy} ({result_msg})\n", "ok")
                        working_proxies.append(proxy)
                    else:
                        result_widget.insert(tk.END, f"CHẾT - {proxy} - {result_msg}\n", "error")
                    result_widget.see(tk.END)
                    result_widget.config(state="disabled")

                self.after(0, update_ui)
        
        def final_update():
            result_widget.config(state="normal")
            result_widget.tag_config("ok", foreground="green")
            result_widget.tag_config("error", foreground="red")
            result_widget.insert(tk.END, f"\nHoàn tất! Tìm thấy {len(working_proxies)} proxy hoạt động.")
            result_widget.config(state="disabled")
            
            # Tự động cập nhật lại ô nhập liệu với các proxy còn sống
            if messagebox.askyesno("Cập nhật danh sách?", f"Tìm thấy {len(working_proxies)} proxy hoạt động. Bạn có muốn cập nhật lại danh sách chỉ với các proxy này không?"):
                proxy_widget.delete("1.0", tk.END)
                proxy_widget.insert("1.0", "\n".join(working_proxies))

            button.config(state="normal")

        self.after(0, final_update)
    
if __name__ == "__main__":
    app = RenamerApp()
    app.mainloop()