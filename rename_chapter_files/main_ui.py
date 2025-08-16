# main_ui.py
import os
import re
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import renamer_logic as logic 

class RenamerApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Công cụ đổi tên file chương truyện")
        self.geometry("1000x700")

        self.folder_path = tk.StringVar()
        self.files_data = [] # Lưu trữ dữ liệu phân tích của các file

        # --- Tạo các thành phần giao diện ---
        self.create_widgets()

    def create_widgets(self):
        # Frame chính
        main_frame = ttk.Frame(self, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # 1. Khu vực chọn thư mục
        folder_frame = ttk.LabelFrame(main_frame, text="Chọn thư mục", padding="10")
        folder_frame.pack(fill=tk.X, expand=False)
        
        ttk.Entry(folder_frame, textvariable=self.folder_path, width=80).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        ttk.Button(folder_frame, text="Chọn...", command=self.select_folder).pack(side=tk.LEFT)
        ttk.Button(folder_frame, text="Xem trước", command=self.preview_files).pack(side=tk.LEFT, padx=(5, 0))

        # 2. Khu vực các lựa chọn đổi tên
        options_frame = ttk.LabelFrame(main_frame, text="Tùy chọn đổi tên", padding="10")
        options_frame.pack(fill=tk.X, expand=False, pady=10)

        self.strategy = tk.StringVar(value="content_first")
        
        ttk.Radiobutton(options_frame, text="Ưu tiên nội dung (dòng đầu)", variable=self.strategy, value="content_first").grid(row=0, column=0, sticky="w", padx=5)
        ttk.Radiobutton(options_frame, text="Ưu tiên tên file hiện tại", variable=self.strategy, value="filename_first").grid(row=0, column=1, sticky="w", padx=5)
        
        # Cấu trúc tên file mới
        ttk.Label(options_frame, text="Cấu trúc tên file mới:").grid(row=1, column=0, sticky="w", padx=5, pady=5)
        self.custom_format = tk.StringVar(value="第{num}章 {title}.txt")
        ttk.Entry(options_frame, textvariable=self.custom_format, width=50).grid(row=1, column=1, sticky="w", padx=5)
        ttk.Label(options_frame, text="(Dùng {num} cho số chương, {title} cho tiêu đề)").grid(row=1, column=2, sticky="w")
        
        # Nút thực thi
        # Đặt nút ở giữa bằng cách dùng sticky="ew" và columnspan, bỏ style Accent.TButton
        options_frame.grid_columnconfigure(0, weight=1)
        options_frame.grid_columnconfigure(1, weight=1)
        options_frame.grid_columnconfigure(2, weight=1)
        ttk.Button(
            options_frame,
            text="BẮT ĐẦU ĐỔI TÊN",
            command=self.start_renaming,
            style="TButton"  # dùng style mặc định, chữ đen
        ).grid(row=2, column=0, columnspan=3, pady=10, sticky="ew")
        
        # 3. Bảng xem trước
        preview_frame = ttk.Frame(main_frame)
        preview_frame.pack(fill=tk.BOTH, expand=True)
        
        cols = ("Tên file gốc", "Số (từ tên file)", "Số (từ nội dung)", "Tên file mới (dự kiến)")
        self.tree = ttk.Treeview(preview_frame, columns=cols, show='headings')
        for col in cols:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=200, anchor="w")
        
        # Scrollbar
        vsb = ttk.Scrollbar(preview_frame, orient="vertical", command=self.tree.yview)
        vsb.pack(side='right', fill='y')
        self.tree.configure(yscrollcommand=vsb.set)
        self.tree.pack(fill=tk.BOTH, expand=True)

        # 4. Log
        log_frame = ttk.LabelFrame(main_frame, text="Nhật ký", padding="5")
        log_frame.pack(fill=tk.X, expand=False, pady=(10, 0))
        self.log_text = scrolledtext.ScrolledText(log_frame, height=8, state='disabled')
        self.log_text.pack(fill=tk.X, expand=True)

        # Style
        self.style = ttk.Style(self)
        # self.style.configure("Accent.TButton", foreground="white", background="blue")  # bỏ dòng này


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
            messagebox.showerror("Lỗi", "Đường dẫn thư mục không hợp lệ.")
            return

        self.tree.delete(*self.tree.get_children())
        self.files_data.clear()
        
        self.log("Bắt đầu quét và phân tích các file...")
        files = sorted([f for f in os.listdir(path) if f.lower().endswith(".txt")])

        for filename in files:
            filepath = os.path.join(path, filename)
            analysis = logic.analyze_file(filepath)
            self.files_data.append(analysis)

            # Tạo tên mới dự kiến để hiển thị
            new_name_preview = logic.generate_new_name(analysis, self.strategy.get(), self.custom_format.get()) or "Không thể tạo"

            # Thêm vào bảng
            self.tree.insert("", "end", values=(
                analysis['filename'],
                analysis['from_filename']['num'] or "N/A",
                analysis['from_content']['num'] or "N/A",
                new_name_preview
            ))
        self.log(f"Đã phân tích {len(self.files_data)} file. Vui lòng kiểm tra bảng xem trước.")

    def start_renaming(self):
        if not self.files_data:
            messagebox.showwarning("Cảnh báo", "Chưa có file nào để đổi tên. Vui lòng chọn thư mục và xem trước.")
            return

        if not messagebox.askyesno("Xác nhận", f"Bạn có chắc chắn muốn đổi tên {len(self.files_data)} file không? Hành động này không thể hoàn tác."):
            return

        self.log("="*20)
        self.log("Bắt đầu quá trình đổi tên...")
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
        # Tải lại preview sau khi đổi tên
        self.preview_files()

if __name__ == "__main__":
    app = RenamerApp()
    app.mainloop()