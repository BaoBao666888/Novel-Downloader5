# main_ui.py
import os
import re
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import renamer_logic as logic

class RenamerApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Công cụ đổi tên file chương truyện v2.0")
        self.geometry("1100x750")

        self.folder_path = tk.StringVar()
        self.files_data = []

        self.create_widgets()

    def create_widgets(self):
        main_frame = ttk.Frame(self, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # 1. Khu vực chọn thư mục
        folder_frame = ttk.LabelFrame(main_frame, text="1. Chọn thư mục", padding="10")
        folder_frame.pack(fill=tk.X, expand=False)
        
        ttk.Entry(folder_frame, textvariable=self.folder_path, width=80).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        ttk.Button(folder_frame, text="Chọn...", command=self.select_folder).pack(side=tk.LEFT)
        # Nút "Xem trước" được tích hợp vào "Chọn..." và khi thay đổi tùy chọn
        #ttk.Button(folder_frame, text="Xem lại", command=self.preview_files).pack(side=tk.LEFT, padx=(5, 0))

        # 2. Khu vực các lựa chọn đổi tên
        options_frame = ttk.LabelFrame(main_frame, text="2. Tùy chọn đổi tên", padding="10")
        options_frame.pack(fill=tk.X, expand=False, pady=10)
        
        # Cấu hình grid cho co giãn
        options_frame.grid_columnconfigure(1, weight=1)

        # Chiến lược ưu tiên
        self.strategy = tk.StringVar(value="content_first")
        ttk.Radiobutton(options_frame, text="Ưu tiên nội dung (dòng đầu)", variable=self.strategy, value="content_first", command=self.preview_files).grid(row=0, column=0, sticky="w", padx=5)
        ttk.Radiobutton(options_frame, text="Ưu tiên tên file hiện tại", variable=self.strategy, value="filename_first", command=self.preview_files).grid(row=0, column=1, sticky="w", padx=5)
        
        # Cấu trúc tên file mới
        ttk.Label(options_frame, text="Cấu trúc tên file mới:").grid(row=1, column=0, sticky="w", padx=5, pady=(10, 5))
        self.custom_format = tk.StringVar(value="第{num}章 {title}.txt")
        format_entry = ttk.Entry(options_frame, textvariable=self.custom_format, width=60)
        format_entry.grid(row=1, column=1, columnspan=2, sticky="we", padx=5)
        ttk.Label(options_frame, text="(Dùng {num} cho số chương, {title} cho tiêu đề)").grid(row=1, column=3, sticky="w")
        format_entry.bind("<KeyRelease>", lambda event: self.preview_files())


        # --- CÁC Ô NHẬP REGEX MỚI ---
        help_text = "Nhóm 1: (số chương), Nhóm 2: (tiêu đề)"
        ttk.Label(options_frame, text="Regex tùy chỉnh (tên file):").grid(row=2, column=0, sticky="w", padx=5, pady=5)
        self.filename_regex = tk.StringVar()
        fn_regex_entry = ttk.Entry(options_frame, textvariable=self.filename_regex, width=60)
        fn_regex_entry.grid(row=2, column=1, columnspan=2, sticky="we", padx=5)
        ttk.Label(options_frame, text=help_text).grid(row=2, column=3, sticky="w")
        fn_regex_entry.bind("<KeyRelease>", lambda event: self.preview_files())

        ttk.Label(options_frame, text="Regex tùy chỉnh (nội dung):").grid(row=3, column=0, sticky="w", padx=5, pady=5)
        self.content_regex = tk.StringVar()
        ct_regex_entry = ttk.Entry(options_frame, textvariable=self.content_regex, width=60)
        ct_regex_entry.grid(row=3, column=1, columnspan=2, sticky="we", padx=5)
        ttk.Label(options_frame, text=help_text).grid(row=3, column=3, sticky="w")
        ct_regex_entry.bind("<KeyRelease>", lambda event: self.preview_files())
        
        # Nút thực thi
        ttk.Button(options_frame, text="BẮT ĐẦU ĐỔI TÊN", command=self.start_renaming).grid(row=4, column=0, columnspan=4, pady=10, ipady=5)

        # 3. Bảng xem trước
        preview_frame = ttk.LabelFrame(main_frame, text="3. Xem trước thay đổi", padding="10")
        preview_frame.pack(fill=tk.BOTH, expand=True)
        
        cols = ("Tên file gốc", "Số (tên file)", "Nguồn", "Số (nội dung)", "Nguồn", "Tên file mới (dự kiến)")
        self.tree = ttk.Treeview(preview_frame, columns=cols, show='headings')
        self.tree.column("Tên file gốc", width=250)
        self.tree.column("Số (tên file)", width=100, anchor="center")
        self.tree.column("Nguồn", width=120, anchor="center")
        self.tree.column("Số (nội dung)", width=100, anchor="center")
        self.tree.column("Nguồn", width=120, anchor="center")
        self.tree.column("Tên file mới (dự kiến)", width=250)

        for col in cols: self.tree.heading(col, text=col)
        
        vsb = ttk.Scrollbar(preview_frame, orient="vertical", command=self.tree.yview)
        vsb.pack(side='right', fill='y')
        self.tree.configure(yscrollcommand=vsb.set)
        self.tree.pack(fill=tk.BOTH, expand=True)

        # 4. Log
        log_frame = ttk.LabelFrame(main_frame, text="Nhật ký hoạt động", padding="5")
        log_frame.pack(fill=tk.X, expand=False, pady=(10, 0))
        self.log_text = scrolledtext.ScrolledText(log_frame, height=6, state='disabled', wrap=tk.WORD)
        self.log_text.pack(fill=tk.X, expand=True)

    def select_folder(self):
        path = filedialog.askdirectory(title="Chọn thư mục chứa file .txt")
        if path:
            self.folder_path.set(path)
            self.log(f"Đã chọn thư mục: {path}")
            self.preview_files()

    def log(self, message):
        self.log_text.config(state='normal')
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)
        self.log_text.config(state='disabled')

    def preview_files(self):
        path = self.folder_path.get()
        if not os.path.isdir(path):
            return

        self.tree.delete(*self.tree.get_children())
        self.files_data.clear()
        
        self.log("Bắt đầu quét và phân tích lại các file...")
        files = sorted([f for f in os.listdir(path) if f.lower().endswith(".txt")])

        # Lấy giá trị regex từ các ô nhập liệu
        custom_fn_regex = self.filename_regex.get()
        custom_ct_regex = self.content_regex.get()

        for filename in files:
            filepath = os.path.join(path, filename)
            analysis = logic.analyze_file(filepath, custom_fn_regex, custom_ct_regex)
            self.files_data.append(analysis)

            new_name_preview = logic.generate_new_name(analysis, self.strategy.get(), self.custom_format.get()) or "Không thể tạo"

            self.tree.insert("", "end", values=(
                analysis['filename'],
                analysis['from_filename']['num'] or "N/A",
                analysis['from_filename']['source'],
                analysis['from_content']['num'] or "N/A",
                analysis['from_content']['source'],
                new_name_preview
            ))
        self.log(f"Phân tích hoàn tất cho {len(self.files_data)} file.")

    def start_renaming(self):
        # Hàm này không thay đổi
        if not self.files_data:
            messagebox.showwarning("Cảnh báo", "Chưa có file nào để đổi tên. Vui lòng chọn thư mục.")
            return
        if not messagebox.askyesno("Xác nhận", f"Bạn có chắc chắn muốn đổi tên {len(self.files_data)} file không? Hành động này không thể hoàn tác."):
            return

        self.log("="*20 + " BẮT ĐẦU ĐỔI TÊN " + "="*20)
        success_count = 0
        fail_count = 0
        folder = self.folder_path.get()
        strategy = self.strategy.get()
        name_format = self.custom_format.get()

        for analysis in self.files_data:
            old_path = analysis['filepath']
            new_name = logic.generate_new_name(analysis, strategy, name_format)
            if new_name is None:
                self.log(f"[Bỏ qua] {analysis['filename']}: Không tìm thấy số chương hợp lệ.")
                fail_count += 1
                continue
            if new_name == analysis['filename']:
                self.log(f"[Bỏ qua] {analysis['filename']}: Tên file đã đúng.")
                continue
            new_path = os.path.join(folder, new_name)
            try:
                os.rename(old_path, new_path)
                self.log(f"[Thành công] {analysis['filename']} -> {new_name}")
                success_count += 1
            except Exception as e:
                self.log(f"[Lỗi] Không thể đổi tên {analysis['filename']}: {e}")
                fail_count += 1
        
        self.log(f"Hoàn tất! Thành công: {success_count}, Thất bại/Bỏ qua: {fail_count}")
        messagebox.showinfo("Hoàn tất", f"Quá trình đổi tên đã kết thúc.\nThành công: {success_count}\nThất bại/Bỏ qua: {fail_count}")
        self.preview_files()

if __name__ == "__main__":
    app = RenamerApp()
    app.mainloop()