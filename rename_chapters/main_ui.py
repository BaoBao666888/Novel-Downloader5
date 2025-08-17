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

class RenamerApp(tk.Tk):
    CURRENT_VERSION = "0.0.3"
    VERSION_CHECK_URL = "https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/rename_chapters/version.json"
    def __init__(self):
        super().__init__()
        self.title("Công cụ đổi tên & chỉnh sửa file truyện v3.1 (có hướng dẫn)")
        self.geometry("1200x800")

        self.folder_path = tk.StringVar()
        self.files_data = []
        self.preview_job = None

        self.create_widgets()
        self.load_config()
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
            'filename_regex': self.filename_regex.get(),
            'content_regex': self.content_regex.get(),
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
                
                self.filename_regex.set(config_data.get('filename_regex', ''))
                self.content_regex.set(config_data.get('content_regex', ''))

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

    def create_widgets(self):
        # --- Các phần layout chính (folder_frame, main_paned_window, notebook, log_frame)---
        main_frame = ttk.Frame(self, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

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

        log_frame = ttk.LabelFrame(main_paned_window, text="Nhật ký hoạt động", padding="5")
        self.log_text = scrolledtext.ScrolledText(log_frame, height=8, state='disabled', wrap=tk.WORD)
        self.log_text.pack(fill=tk.BOTH, expand=True)
        main_paned_window.add(log_frame, weight=1)

    def create_rename_tab(self):
        rename_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(rename_tab, text="Đổi Tên File")

        options_frame = ttk.LabelFrame(rename_tab, text="2. Tùy chọn", padding="10")
        options_frame.pack(fill=tk.X, expand=False)
        options_frame.grid_columnconfigure(1, weight=1) # Cho phép ô entry co giãn
        
        # Chiến lược ưu tiên
        self.strategy = tk.StringVar(value="content_first")
        ttk.Radiobutton(options_frame, text="Ưu tiên nội dung", variable=self.strategy, value="content_first", command=self.schedule_preview_update).grid(row=0, column=0, sticky="w", padx=5)
        ttk.Radiobutton(options_frame, text="Ưu tiên tên file", variable=self.strategy, value="filename_first", command=self.schedule_preview_update).grid(row=0, column=1, sticky="w", padx=5)
        
        # Cấu trúc mới
        ttk.Label(options_frame, text="Cấu trúc mới:").grid(row=1, column=0, sticky="w", padx=5, pady=(10, 5))
        self.format_combobox = ttk.Combobox(options_frame, values=["第{num}章 {title}.txt"])
        self.format_combobox.grid(row=1, column=1, columnspan=2, sticky="we", padx=5)
        self.format_combobox.set("第{num}章 {title}.txt")
        self.format_combobox.bind("<KeyRelease>", self.schedule_preview_update)
        ttk.Label(options_frame, text="(Dùng {num} cho số chương, {title} cho tiêu đề)").grid(row=2, column=1, columnspan=2, sticky="w", padx=5)

        # Regex (tên file) - Đẩy các hàng xuống 1 bậc
        self.filename_regex = tk.StringVar()
        ttk.Label(options_frame, text="Regex (tên file):").grid(row=3, column=0, sticky="w", padx=5, pady=(10, 5))
        fn_regex_entry = ttk.Entry(options_frame, textvariable=self.filename_regex)
        fn_regex_entry.grid(row=3, column=1, sticky="we", padx=5)
        fn_regex_entry.bind("<KeyRelease>", self.schedule_preview_update)
        # Nút Hướng dẫn
        help_button1 = ttk.Button(options_frame, text="?", width=3, command=self.show_regex_guide)
        help_button1.grid(row=3, column=2, sticky="w", padx=(0, 5))

        # Regex (nội dung) - Đẩy các hàng xuống 1 bậc
        self.content_regex = tk.StringVar()
        ttk.Label(options_frame, text="Regex (nội dung):").grid(row=4, column=0, sticky="w", padx=5, pady=5)
        ct_regex_entry = ttk.Entry(options_frame, textvariable=self.content_regex)
        ct_regex_entry.grid(row=4, column=1, sticky="we", padx=5)
        ct_regex_entry.bind("<KeyRelease>", self.schedule_preview_update)
        # Nút Hướng dẫn
        help_button2 = ttk.Button(options_frame, text="?", width=3, command=self.show_regex_guide)
        help_button2.grid(row=4, column=2, sticky="w", padx=(0, 5))

        # Đẩy các hàng xuống 1 bậc
        ttk.Button(options_frame, text="BẮT ĐẦU ĐỔI TÊN", command=self.start_renaming).grid(row=5, column=0, columnspan=3, pady=10, ipady=5)

        # Bảng xem trước (giữ nguyên)
        preview_frame = ttk.LabelFrame(rename_tab, text="3. Xem trước thay đổi", padding="10")
        preview_frame.pack(fill=tk.BOTH, expand=True, pady=(10, 0))
        cols = ("Tên file gốc", "Số (tên file)", "Nguồn", "Số (nội dung)", "Nguồn", "Tên file mới")
        self.tree = ttk.Treeview(preview_frame, columns=cols, show='headings')
        for col, width in zip(cols, [250, 80, 100, 80, 100, 250]):
            self.tree.heading(col, text=col)
            self.tree.column(col, width=width, anchor="w")
        vsb = ttk.Scrollbar(preview_frame, orient="vertical", command=self.tree.yview)
        vsb.pack(side='right', fill='y')
        self.tree.configure(yscrollcommand=vsb.set)
        self.tree.pack(fill=tk.BOTH, expand=True)

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
            files = sorted([f for f in os.listdir(path) if f.lower().endswith(".txt")])
        except Exception as e:
            self.log(f"Lỗi khi truy cập thư mục: {e}"); messagebox.showerror("Lỗi", f"Không thể đọc các file trong thư mục: {e}"); return
        for filename in files:
            filepath = os.path.join(path, filename)
            analysis = logic.analyze_file(filepath, self.filename_regex.get(), self.content_regex.get())
            self.files_data.append(analysis)
            new_name = logic.generate_new_name(analysis, self.strategy.get(), self.format_combobox.get()) or "Lỗi/Thiếu số"
            self.tree.insert("", "end", values=(analysis['filename'], analysis['from_filename']['num'] or "N/A", analysis['from_filename']['source'], analysis['from_content']['num'] or "N/A", analysis['from_content']['source'], new_name))
        self.log(f"Phân tích hoàn tất cho {len(self.files_data)} file.")
        if files:
            self.credit_file_selector['values'] = files
            self.credit_file_selector.current(0)
        else:
            self.credit_file_selector['values'] = []
            self.credit_file_selector.set('')

    def start_renaming(self):
        if not self.files_data: messagebox.showwarning("Cảnh báo", "Chưa có file nào để đổi tên."); return
        if not messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn đổi tên {len(self.files_data)} file không?"): return
        self.log("="*20 + " BẮT ĐẦU ĐỔI TÊN " + "="*20)
        success, fail = 0, 0
        folder, strategy, name_format = self.folder_path.get(), self.strategy.get(), self.format_combobox.get()
        self._update_history_combobox(self.format_combobox)
        for analysis in self.files_data:
            old_path, new_name = analysis['filepath'], logic.generate_new_name(analysis, strategy, name_format)
            if new_name is None: self.log(f"[Bỏ qua] {analysis['filename']}: Không tìm thấy số chương."); fail += 1; continue
            if new_name == analysis['filename']: self.log(f"[Bỏ qua] {analysis['filename']}: Tên đã đúng."); continue
            try:
                os.rename(old_path, os.path.join(folder, new_name))
                self.log(f"[Thành công] {analysis['filename']} -> {new_name}"); success += 1
            except Exception as e:
                self.log(f"[Lỗi] {analysis['filename']}: {e}"); fail += 1
        self.log(f"Hoàn tất! Thành công: {success}, Thất bại/Bỏ qua: {fail}")
        messagebox.showinfo("Hoàn tất", f"Đã xong.\nThành công: {success}\nThất bại/Bỏ qua: {fail}")
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

if __name__ == "__main__":
    app = RenamerApp()
    app.mainloop()