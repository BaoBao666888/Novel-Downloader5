# main_ui.py
import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import renamer_logic as logic
import json
import threading
import urllib.request
import webbrowser
from packaging.version import parse as parse_version
from extensions import jjwxc_ext
from extensions import po18_ext
import pythoncom

class RenamerApp(tk.Tk):
    CURRENT_VERSION = "0.0.6"
    VERSION_CHECK_URL = "https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/refs/heads/main/rename_chapters/version.json"
    def __init__(self):
        super().__init__()
        self.title("Rename Chapters v0.0.6")
        self.geometry("1200x800")

        self.folder_path = tk.StringVar()
        self.files_data = []
        self.preview_job = None

        self.sorted_files_cache = []
        self.excluded_files = set()

        self.create_widgets()
        self.load_config()
        self.check_for_updates()
        self.protocol("WM_DELETE_WINDOW", self.on_closing)

    def on_closing(self):
        """Lưu cấu hình trước khi đóng."""
        self.save_config()
        self.destroy()

    def save_config(self):
        """Thu thập và lưu tất cả cài đặt vào file config.json."""
        config_data = {
            'folder_path': self.folder_path.get(),
            'rename_strategy': self.strategy.get(),
            'rename_format': self.format_combobox.get(),
            'rename_format_history': list(self.format_combobox['values']),
            'filename_regexes': self.filename_regex_text.get("1.0", tk.END).strip(),
            'content_regexes': self.content_regex_text.get("1.0", tk.END).strip(),
            'credit_text': self.credit_text_widget.get("1.0", tk.END).strip(),
            'credit_position': self.credit_position.get(),
            'credit_line_num': self.credit_line_num.get(),
        }
        try:
            with open('config.json', 'w', encoding='utf-8') as f:
                json.dump(config_data, f, indent=4)
        except Exception as e:
            print(f"Không thể lưu config: {e}")

    def load_config(self):
        """Tải và áp dụng cài đặt từ config.json nếu có."""
        try:
            if os.path.exists('config.json'):
                with open('config.json', 'r', encoding='utf-8') as f:
                    config_data = json.load(f)

                self.folder_path.set(config_data.get('folder_path', ''))
                self.strategy.set(config_data.get('rename_strategy', 'content_first'))
                
                # Tải lịch sử và giá trị cho format
                format_history = config_data.get('rename_format_history', [])
                self.format_combobox['values'] = format_history
                self.format_combobox.set(config_data.get('rename_format', '第{num}章 {title}.txt'))
                
                self.filename_regex_text.delete("1.0", tk.END)
                self.filename_regex_text.insert("1.0", config_data.get('filename_regexes', config_data.get('filename_regex', '')))
                self.content_regex_text.delete("1.0", tk.END)
                self.content_regex_text.insert("1.0", config_data.get('content_regexes', config_data.get('content_regex', '')))

                credit_text = config_data.get('credit_text', 'Được convert bởi XYZ')
                self.credit_text_widget.delete("1.0", tk.END)
                self.credit_text_widget.insert("1.0", credit_text)

                self.credit_position.set(config_data.get('credit_position', 'top'))
                self.credit_line_num.set(config_data.get('credit_line_num', 2))
                
                # Tải lại preview nếu có đường dẫn
                if self.folder_path.get():
                    self.schedule_preview_update()
        except Exception as e:
            print(f"Không thể tải config: {e}")
            self.log("Không tìm thấy file config hoặc file bị lỗi. Sử dụng cài đặt mặc định.")

    def check_for_updates(self, manual_check=False):
        """Kiểm tra phiên bản mới trong một thread riêng để không làm treo UI."""
        def _check():
            try:
                with urllib.request.urlopen(self.VERSION_CHECK_URL, timeout=5) as response:
                    data = json.loads(response.read().decode())
                
                latest_version_str = data.get("version")
                if not latest_version_str: return

                if parse_version(latest_version_str) > parse_version(self.CURRENT_VERSION):
                    notes = data.get("notes", "Không có chi tiết.")
                    download_url = data.get("url")
                    
                    msg = f"Đã có phiên bản mới: {latest_version_str}\n\nNội dung cập nhật:\n{notes}\n\nBạn có muốn tải về ngay không?"
                    if messagebox.askyesno("Có bản cập nhật!", msg):
                        if download_url: webbrowser.open(download_url)
                elif manual_check:
                    messagebox.showinfo("Kiểm tra cập nhật", "Bạn đang sử dụng phiên bản mới nhất.")

            except Exception as e:
                print(f"Lỗi kiểm tra cập nhật: {e}")
                if manual_check:
                    messagebox.showerror("Lỗi", "Không thể kiểm tra cập nhật. Vui lòng kiểm tra kết nối mạng.")
        
        # Chạy trong thread để không block UI
        threading.Thread(target=_check, daemon=True).start()

    def create_widgets(self):
        # --- Các phần layout chính (folder_frame, main_paned_window, notebook, log_frame)---
        main_frame = ttk.Frame(self, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # === TẠO MENU BAR ===
        menubar = tk.Menu(self)
        self.config(menu=menubar)

        # Menu Trợ giúp
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Trợ giúp", menu=help_menu)
        help_menu.add_command(label="Hướng dẫn Regex", command=self.show_regex_guide)
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
        main_paned_window.add(notebook_frame, weight=3)
        
        self.create_rename_tab()
        self.create_credit_tab()
        self.create_online_fetch_tab()

        log_frame = ttk.LabelFrame(main_paned_window, text="Nhật ký hoạt động", padding="5")
        self.log_text = scrolledtext.ScrolledText(log_frame, height=8, state='disabled', wrap=tk.WORD)
        self.log_text.pack(fill=tk.BOTH, expand=True)
        main_paned_window.add(log_frame, weight=1)

    def create_rename_tab(self):
        rename_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(rename_tab, text="Đổi Tên File")
        rename_tab.columnconfigure(0, weight=1)
        # Thay đổi: row 0 sẽ chứa PanedWindow, row 1 chứa nút bấm
        rename_tab.rowconfigure(0, weight=1)

        # --- TẠO PANEDWINDOW ĐỂ CHIA CÁC NGĂN ---
        rename_paned_window = ttk.PanedWindow(rename_tab, orient=tk.VERTICAL)
        rename_paned_window.grid(row=0, column=0, sticky="nsew")

        # --- Ngăn trên: chứa tất cả các tùy chọn ---
        top_pane_frame = ttk.Frame(rename_paned_window)
        top_pane_frame.columnconfigure(0, weight=1) # Cho phép các widget bên trong co giãn
        rename_paned_window.add(top_pane_frame, weight=1) # Thêm vào PanedWindow

        # --- Frame tùy chọn (được đặt vào top_pane_frame) ---
        options_frame = ttk.LabelFrame(top_pane_frame, text="2. Tùy chọn", padding="10")
        options_frame.grid(row=0, column=0, sticky="ew")
        options_frame.grid_columnconfigure(1, weight=1)
        
        # (Các widget tùy chọn giữ nguyên, chỉ thay đổi container của chúng)
        self.strategy = tk.StringVar(value="content_first")
        ttk.Radiobutton(options_frame, text="Ưu tiên nội dung", variable=self.strategy, value="content_first", command=self.schedule_preview_update).grid(row=0, column=0, sticky="w", padx=5)
        ttk.Radiobutton(options_frame, text="Ưu tiên tên file", variable=self.strategy, value="filename_first", command=self.schedule_preview_update).grid(row=0, column=1, sticky="w", padx=5)
        
        ttk.Label(options_frame, text="Cấu trúc mới:").grid(row=1, column=0, sticky="w", padx=5, pady=(10, 5))
        self.format_combobox = ttk.Combobox(options_frame, values=["Chương {num} - {title}.txt"])
        self.format_combobox.grid(row=1, column=1, columnspan=2, sticky="we", padx=5)
        self.format_combobox.set("Chương {num} - {title}.txt")
        self.format_combobox.bind("<KeyRelease>", self.schedule_preview_update)
        ttk.Label(options_frame, text="(Dùng {num}, {title}, và {num + n} hoặc {num - n})").grid(row=2, column=1, columnspan=2, sticky="w", padx=5)
        
        ttk.Label(options_frame, text="Regex (tên file):").grid(row=3, column=0, sticky="nw", padx=5, pady=(10, 5))
        self.filename_regex_text = tk.Text(options_frame, height=3, wrap=tk.WORD)
        self.filename_regex_text.grid(row=3, column=1, sticky="we", padx=5)
        self.filename_regex_text.bind("<KeyRelease>", self.schedule_preview_update)
        ttk.Button(options_frame, text="?", width=3, command=self.show_regex_guide).grid(row=3, column=2, sticky="n", padx=(0, 5), pady=(10, 0))
        ttk.Label(options_frame, text="(Mỗi dòng là một mẫu Regex)").grid(row=4, column=1, sticky="w", padx=5)

        ttk.Label(options_frame, text="Regex (nội dung):").grid(row=5, column=0, sticky="nw", padx=5, pady=5)
        self.content_regex_text = tk.Text(options_frame, height=3, wrap=tk.WORD)
        self.content_regex_text.grid(row=5, column=1, sticky="we", padx=5, pady=5)
        self.content_regex_text.bind("<KeyRelease>", self.schedule_preview_update)
        ttk.Button(options_frame, text="?", width=3, command=self.show_regex_guide).grid(row=5, column=2, sticky="n", padx=(0, 5), pady=(5, 0))
        ttk.Label(options_frame, text="(Mỗi dòng là một mẫu Regex)").grid(row=6, column=1, sticky="w", padx=5)


        # --- Frame tiêu đề tùy chỉnh (được đặt vào top_pane_frame) ---
        custom_title_frame = ttk.LabelFrame(top_pane_frame, text="3. Sử dụng tiêu đề tùy chỉnh (Tùy chọn)", padding=10)
        custom_title_frame.grid(row=1, column=0, sticky="ew", pady=5)
        custom_title_frame.columnconfigure(0, weight=1) # Thay đổi ở đây
        custom_title_frame.rowconfigure(1, weight=1) # Cho phép ô text co giãn

        self.use_custom_titles = tk.BooleanVar(value=False)
        ttk.Checkbutton(custom_title_frame, text="Kích hoạt (Mỗi dòng là một tiêu đề, áp dụng theo thứ tự file đã sắp xếp)", variable=self.use_custom_titles, command=self.schedule_preview_update).grid(row=0, column=0, columnspan=2, sticky="w")
        
        self.custom_titles_text = scrolledtext.ScrolledText(custom_title_frame, height=5, wrap=tk.WORD)
        self.custom_titles_text.grid(row=1, column=0, columnspan=2, sticky="ewns", pady=(5,0))
        
        # --- Ngăn dưới: chứa bảng xem trước ---
        preview_frame = ttk.LabelFrame(rename_paned_window, text="4. Xem trước và Hành động", padding="10")
        preview_frame.columnconfigure(0, weight=1); preview_frame.rowconfigure(1, weight=1)
        rename_paned_window.add(preview_frame, weight=3) # Thêm vào PanedWindow với trọng số lớn hơn

        # Thanh tìm kiếm và loại trừ
        actions_bar = ttk.Frame(preview_frame)
        actions_bar.grid(row=0, column=0, sticky="ew", pady=(0, 5))
        ttk.Label(actions_bar, text="Tìm kiếm:").pack(side=tk.LEFT, padx=(0, 5))
        self.search_var = tk.StringVar()
        search_entry = ttk.Entry(actions_bar, textvariable=self.search_var)
        search_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
        search_entry.bind("<KeyRelease>", self._search_files)
        ttk.Button(actions_bar, text="Loại trừ file đã chọn", command=lambda: self._toggle_exclusion(exclude=True)).pack(side=tk.LEFT, padx=5)
        ttk.Button(actions_bar, text="Bao gồm lại", command=lambda: self._toggle_exclusion(exclude=False)).pack(side=tk.LEFT, padx=5)

        cols = ("Trạng thái", "Tên file gốc", "Số (tên file)", "Số (nội dung)", "Tên file mới")
        self.tree = ttk.Treeview(preview_frame, columns=cols, show='headings', selectmode='extended')
        
        self.tree.grid(row=1, column=0, sticky="nsew")
        self.tree.tag_configure("excluded", foreground="red")
        for col, width in zip(cols, [80, 300, 100, 100, 300]):
            self.tree.heading(col, text=col); self.tree.column(col, width=width)
        
        vsb = ttk.Scrollbar(preview_frame, orient="vertical", command=self.tree.yview)
        vsb.grid(row=1, column=1, sticky="ns")
        self.tree.configure(yscrollcommand=vsb.set)
        
        # --- Nút hành động chính (được đặt vào rename_tab) ---
        ttk.Button(rename_tab, text="BẮT ĐẦU ĐỔI TÊN", command=self.start_renaming).grid(row=1, column=0, pady=10, ipady=5)
    # --- HÀM MỚI ĐỂ HIỂN THỊ CỬA SỔ HƯỚNG DẪN ---
    def show_regex_guide(self):
        help_window = tk.Toplevel(self)
        help_window.title("Hướng dẫn sử dụng Regex")
        help_window.geometry("700x550")
        help_window.resizable(False, False)
        help_window.transient(self) # Giữ cửa sổ con luôn ở trên cửa sổ chính

        main_frame = ttk.Frame(help_window, padding="15")
        main_frame.pack(fill="both", expand=True)

        guide_text = scrolledtext.ScrolledText(main_frame, wrap=tk.WORD, state="normal", relief=tk.FLAT)
        guide_text.pack(fill="both", expand=True)

        # Nội dung hướng dẫn
        content = """
Regex (Biểu thức chính quy) là một 'khuôn mẫu' để bạn mô tả cho máy tính biết cách tìm và lấy thông tin bạn muốn.

YÊU CẦU BẮT BUỘC:
Khuôn mẫu của bạn phải tạo ra 2 'ngăn chứa' (capturing group) bằng dấu ngoặc đơn (...).

    - Ngăn 1 (...): Phải chứa SỐ CHƯƠNG.
    - Ngăn 2 (...): Phải chứa TIÊU ĐỀ CHƯƠNG.

----------------------------------------------------

CÁC KÝ HIỆU REGEX THÔNG DỤNG:

  \\d+      Tìm một hoặc nhiều chữ số (0-9).
            (ví dụ: khớp với '123', '05')

  .*        Tìm bất kỳ ký tự nào (trừ dòng mới), bao nhiêu lần cũng được.
            (Thường dùng để lấy tiêu đề)

  \\s*       Tìm 0 hoặc nhiều khoảng trắng.

  [_-]      Tìm một ký tự là gạch dưới '_' hoặc gạch ngang '-'.

  .         Tìm chính xác dấu chấm '.' (cần có \\ phía trước: \\. )

----------------------------------------------------

VÍ DỤ THỰC TẾ:

1. Tên file: 'Truyen-A-Chap-123-Tieu-de-chuong.txt'
   -> Regex cần dùng: Chap-(\\d+)-(.*)
   -> Giải thích:
      - 'Chap-': Tìm đúng chữ 'Chap-'.
      - (\\d+): Ngăn 1, tìm và lấy số '123'.
      - '-': Tìm dấu gạch ngang tiếp theo.
      - (.*): Ngăn 2, lấy tất cả phần còn lại 'Tieu-de-chuong'.

2. Tên file: 'Quyển 3 - 098 . Tên chương bất kỳ.txt'
   -> Regex cần dùng: (\\d+)\\s*\\.\\s*(.*)
   -> Giải thích:
      - (\\d+): Ngăn 1, tìm và lấy số '098'.
      - \\s*\\.\\s*: Tìm dấu '.' có hoặc không có khoảng trắng bao quanh.
      - (.*): Ngăn 2, lấy phần tiêu đề còn lại.

3. Dòng đầu tiên trong file: 'Chương 54:Hồi Ức'
   -> Regex cần dùng: Chương (\\d+):(.*)
   -> Giải thích:
      - 'Chương ': Tìm chữ 'Chương ' và khoảng trắng.
      - (\\d+): Ngăn 1, lấy số '54'.
      - ':': Tìm dấu hai chấm.
      - (.*): Ngăn 2, lấy 'Hồi Ức'.
"""
        guide_text.insert("1.0", content)
        guide_text.config(state="disabled") # Không cho người dùng sửa

        close_button = ttk.Button(main_frame, text="Đã hiểu", command=help_window.destroy)
        close_button.pack(pady=(10, 0))

    # --- Các hàm khác (create_credit_tab, select_folder, log, v.v...)---
    def create_credit_tab(self):
        credit_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(credit_tab, text="Thêm Credit")
        credit_tab.rowconfigure(1, weight=1)
        credit_tab.columnconfigure(1, weight=1)

        # --- Frame tùy chọn credit ---
        credit_options_frame = ttk.LabelFrame(credit_tab, text="2. Tùy chọn & Hành động", padding="10")
        credit_options_frame.grid(row=0, column=0, columnspan=2, sticky="ew", pady=(0, 10))
        credit_options_frame.columnconfigure(1, weight=1)

        # Nội dung credit - Dùng Text widget
        ttk.Label(credit_options_frame, text="Nội dung credit:").grid(row=0, column=0, sticky="nw", padx=5, pady=5)
        self.credit_text_widget = tk.Text(credit_options_frame, height=4, wrap=tk.WORD)
        self.credit_text_widget.grid(row=0, column=1, columnspan=2, sticky="ew", padx=5, pady=5)
        self.credit_text_widget.insert("1.0", "Được convert bởi XYZ") # Giá trị mặc định

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

        # Thêm Combobox để chọn file xem trước ngay tại tab này
        ttk.Label(credit_options_frame, text="Xem trước cho file:").grid(row=2, column=0, sticky="w", padx=5, pady=(10, 5))
        self.credit_file_selector = ttk.Combobox(credit_options_frame, state="readonly")
        self.credit_file_selector.grid(row=2, column=1, sticky="ew", padx=5, pady=(10, 5))

        # Đặt các nút hành động vào chung một frame
        action_frame = ttk.Frame(credit_options_frame)
        action_frame.grid(row=3, column=0, columnspan=3, pady=(10, 0))
        ttk.Button(action_frame, text="Xem trước", command=self.preview_credit).pack(side=tk.LEFT, padx=5)
        ttk.Button(action_frame, text="ÁP DỤNG CHO TẤT CẢ FILE", command=self.apply_credit_to_all).pack(side=tk.LEFT, padx=5)

        credit_preview_frame = ttk.LabelFrame(credit_tab, text="3. Xem trước nội dung", padding="10")
        credit_preview_frame.grid(row=1, column=0, columnspan=2, sticky="nsew")
        self.credit_preview_text = scrolledtext.ScrolledText(credit_preview_frame, wrap=tk.WORD, state="disabled")
        self.credit_preview_text.pack(fill=tk.BOTH, expand=True)

    def create_online_fetch_tab(self):
        online_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(online_tab, text="Lấy Tiêu Đề Online")
        online_tab.columnconfigure(0, weight=1)
        online_tab.rowconfigure(1, weight=1)

        # --- Frame nhập liệu ---
        fetch_frame = ttk.LabelFrame(online_tab, text="1. Nguồn", padding=10)
        fetch_frame.grid(row=0, column=0, sticky="ew")
        fetch_frame.columnconfigure(1, weight=1)
        
        ttk.Label(fetch_frame, text="Trang web:").grid(row=0, column=0, sticky="w", padx=5, pady=5)
        self.source_web = ttk.Combobox(fetch_frame, values=["jjwxc.net", "po18.tw"], state="readonly")
        self.source_web.grid(row=0, column=1, sticky="ew", padx=5)
        self.source_web.set("jjwxc.net")
        
        ttk.Label(fetch_frame, text="URL mục lục:").grid(row=1, column=0, sticky="w", padx=5, pady=5)
        self.source_url = tk.StringVar()
        ttk.Entry(fetch_frame, textvariable=self.source_url).grid(row=1, column=1, sticky="ew", padx=5)
        
        ttk.Button(fetch_frame, text="Bắt đầu lấy dữ liệu", command=self._fetch_online_titles).grid(row=2, column=1, sticky="e", pady=5, padx=5)

        # --- Frame kết quả ---
        result_frame = ttk.LabelFrame(online_tab, text="2. Kết quả", padding=10)
        result_frame.grid(row=1, column=0, sticky="nsew", pady=5)
        result_frame.columnconfigure(0, weight=1); result_frame.rowconfigure(0, weight=1)
        
        cols = ("Số chương", "Tiêu đề chính", "Tiêu đề phụ/Tóm tắt")
        self.online_tree = ttk.Treeview(result_frame, columns=cols, show='headings', selectmode='extended')
        self.online_tree.grid(row=0, column=0, sticky="nsew")
        for col in cols: self.online_tree.heading(col, text=col)
        
        vsb = ttk.Scrollbar(result_frame, orient="vertical", command=self.online_tree.yview)
        vsb.grid(row=0, column=1, sticky="ns")
        self.online_tree.configure(yscrollcommand=vsb.set)
        
        # --- Frame hành động ---
        apply_frame = ttk.LabelFrame(online_tab, text="3. Áp dụng", padding=10)
        apply_frame.grid(row=2, column=0, sticky="ew", pady=(5,0))
        apply_frame.columnconfigure(1, weight=1)

        # Dòng chọn theo khoảng
        ttk.Label(apply_frame, text="Chọn nhanh theo khoảng:").grid(row=0, column=0, sticky="w", padx=5, pady=5)
        self.online_range_var = tk.StringVar()
        range_entry = ttk.Entry(apply_frame, textvariable=self.online_range_var)
        range_entry.grid(row=0, column=1, sticky="ew", padx=5, pady=5)
        ttk.Button(apply_frame, text="Chọn", command=self._select_online_range).grid(row=0, column=2, sticky="w", padx=5, pady=5)
        ttk.Label(apply_frame, text="(Ví dụ: 1-10, -50, 100-, all)").grid(row=1, column=1, sticky="w", padx=5)

        # Dòng áp dụng
        action_row_frame = ttk.Frame(apply_frame)
        action_row_frame.grid(row=2, column=0, columnspan=3, sticky="ew", pady=(10,0))

        ttk.Label(action_row_frame, text="Sử dụng cột tiêu đề:").pack(side=tk.LEFT, padx=5)
        self.title_choice = tk.StringVar(value="title2")
        ttk.Radiobutton(action_row_frame, text="Tiêu đề chính", variable=self.title_choice, value="title1").pack(side=tk.LEFT)
        ttk.Radiobutton(action_row_frame, text="Tiêu đề phụ", variable=self.title_choice, value="title2").pack(side=tk.LEFT)
        ttk.Button(action_row_frame, text="Sao chép tiêu đề đã chọn vào Tab Đổi Tên", command=self._apply_online_titles).pack(side=tk.RIGHT, padx=5)

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
    
    def _sort_files(self):
        """Sắp xếp danh sách file theo số chương và lưu vào cache."""
        def get_sort_key(analysis):
            # Ưu tiên số từ nội dung, sau đó đến tên file
            num = analysis['from_content']['num'] or analysis['from_filename']['num']
            return num if num is not None else float('inf')
        self.sorted_files_cache = sorted(self.files_data, key=get_sort_key)

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
        self.tree.insert("", "end", values=(
            status,
            analysis['filename'],
            analysis['from_filename']['num'] or "N/A",
            analysis['from_content']['num'] or "N/A",
            new_name
        ), tags=tags)

    def _generate_preview_name(self, analysis: dict, index: int) -> str:
        custom_titles = self.custom_titles_text.get("1.0", tk.END).strip().split('\n') if self.use_custom_titles.get() else None
        return logic.generate_new_name(
            analysis, self.strategy.get(), self.format_combobox.get(),
            custom_titles=custom_titles,
            file_index=index
        ) or "Lỗi/Thiếu số"

    def _fetch_online_titles(self):
        url = self.source_url.get()
        # selected_site = self.source_web.get()

        # if selected_site == "po18.tw" and not admin_utils.is_admin():
        #     if messagebox.askyesno("Yêu cầu quyền Admin",
        #                         "Lấy dữ liệu từ po18.tw cần quyền quản trị viên (Admin) để đọc cookie từ trình duyệt.\n\n"
        #                         "Bạn có muốn khởi động lại ứng dụng với quyền Admin không?"):
        #         admin_utils.run_as_admin()
        #     return # Dừng ngay tại đây, không làm gì thêm trong tiến trình cũ

        if not url:
            messagebox.showerror("Lỗi", "Vui lòng nhập URL mục lục.")
            return

        def _worker():
            pythoncom.CoInitialize()
            try:
                # Các công việc cũ vẫn giữ nguyên
                self.log(f"Đang lấy dữ liệu từ {url}...")
                
                selected_site = self.source_web.get()
                result = None

                if selected_site == "jjwxc.net":
                    result = jjwxc_ext.fetch_chapters(url)
                elif selected_site == "po18.tw":
                    result = po18_ext.fetch_chapters(url, root_window=self)
                else:
                    result = {'error': 'Trang web không được hỗ trợ.'}
                
                # Gửi kết quả về luồng giao diện
                self.after(0, self._update_online_tree, result)
            finally:
                # Bước 2: Luôn luôn hủy đăng ký khi luồng kết thúc, dù thành công hay thất bại
                pythoncom.CoUninitialize()

        threading.Thread(target=_worker, daemon=True).start()

    def _update_online_tree(self, result):
        self.online_tree.delete(*self.online_tree.get_children())
        # THAY THẾ BẰNG KHỐI NÀY
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
        
        title_key = self.title_choice.get() # 'title1' or 'title2'
        
        selected_titles = []
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

if __name__ == "__main__":
    app = RenamerApp()
    app.mainloop()