import os
import re
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext

from app.core import renamer as logic
from app.core.text_ops import TextOperations
from app.ui.constants import SOURCE_BY_ID


class TextOpsMixin:
    """Tab Xử lý Văn bản và các thao tác find/replace, split."""

    def create_text_operations_tab(self):
        text_ops_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(text_ops_tab, text="Xử lý Văn bản")
        text_ops_tab.rowconfigure(1, weight=1)
        text_ops_tab.columnconfigure(0, weight=1)

        file_frame = ttk.LabelFrame(text_ops_tab, text="1. Chọn file (dùng chung cho các tab bên dưới)", padding="10")
        file_frame.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        ttk.Entry(file_frame, textvariable=self.selected_file, state="readonly").pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        ttk.Button(file_frame, text="Chọn...", command=self._select_file_for_ops).pack(side=tk.LEFT)

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

        # Quick tools sub-tab (dùng lại ở online)
        quick_frame = ttk.Frame(ops_notebook, padding="10")
        ops_notebook.add(quick_frame, text="Công cụ Nhanh")
        self._create_quick_tools_widgets(quick_frame)

    def _create_find_replace_widgets(self, parent):
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(0, weight=1)

        main_paned = ttk.PanedWindow(parent, orient=tk.VERTICAL)
        main_paned.grid(row=0, column=0, sticky="nsew")

        options_frame = ttk.LabelFrame(main_paned, text="1. Tùy chọn", padding="10")
        main_paned.add(options_frame, weight=0)

        find_frame = ttk.Frame(options_frame)
        find_frame.pack(fill=tk.X)
        ttk.Label(find_frame, text="Tìm:        ").pack(side=tk.LEFT)
        self.find_text = ttk.Combobox(find_frame)
        self.find_text.pack(side=tk.LEFT, fill=tk.X, expand=True)
        ttk.Button(find_frame, text="?", width=1, command=lambda: self.show_regex_guide("find_replace")).pack(side=tk.LEFT, padx=5)
        self.find_pin_btn = ttk.Button(
            find_frame,
            text="Ghim",
            width=6,
            command=lambda: self._toggle_pin("find", self.find_text, self.find_pin_btn),
        )
        self.find_pin_btn.pack(side=tk.LEFT)
        self.find_text.bind(
            "<<ComboboxSelected>>",
            lambda _e: self._sync_pin_button("find", self.find_text, self.find_pin_btn),
        )
        self.find_text.bind(
            "<KeyRelease>",
            lambda _e: self._sync_pin_button("find", self.find_text, self.find_pin_btn),
        )
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

        content_frame = ttk.LabelFrame(main_paned, text="2. Nội dung & Hành động", padding="10")
        main_paned.add(content_frame, weight=1)
        content_frame.rowconfigure(0, weight=1)
        content_frame.columnconfigure(0, weight=1)

        self.text_content = scrolledtext.ScrolledText(content_frame, wrap=tk.WORD, undo=True)
        self.text_content.grid(row=0, column=0, columnspan=7, sticky="nsew")
        self.text_content.bind("<<Modified>>", self._mark_text_as_modified)

        button_grid_frame = ttk.Frame(content_frame)
        button_grid_frame.grid(row=1, column=0, columnspan=7, pady=(10, 0), sticky="ew")

        ttk.Button(button_grid_frame, text="Tìm tiếp", command=self._find_next).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0, 5))
        ttk.Button(button_grid_frame, text="Thay thế", command=self._replace_current).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Thay thế tất cả", command=self._replace_all).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Lưu", command=self._save_changes).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Lưu thành file mới...", command=self._save_as).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Hoàn tác", command=self.text_content.edit_undo).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Làm lại", command=self.text_content.edit_redo).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(5, 0))

    def _create_split_widgets(self, parent):
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(0, weight=1)

        main_paned = ttk.PanedWindow(parent, orient=tk.VERTICAL)
        main_paned.grid(row=0, column=0, sticky="nsew")

        options_frame = ttk.LabelFrame(main_paned, text="1. Tùy chọn chia file", padding="10")
        main_paned.add(options_frame, weight=0)
        options_frame.columnconfigure(1, weight=1)

        ttk.Label(options_frame, text="Regex chia file:").grid(row=0, column=0, sticky="w", padx=5, pady=5)
        self.split_regex = ttk.Combobox(options_frame)
        self.split_regex.grid(row=0, column=1, sticky="ew")
        ttk.Button(options_frame, text="?", width=1, command=lambda: self.show_regex_guide("split")).grid(row=0, column=2, padx=5)
        self.split_pin_btn = ttk.Button(
            options_frame,
            text="Ghim",
            width=6,
            command=lambda: self._toggle_pin("split", self.split_regex, self.split_pin_btn),
        )
        self.split_pin_btn.grid(row=0, column=3, padx=(0, 5))
        self.split_regex.bind(
            "<<ComboboxSelected>>",
            lambda _e: self._sync_pin_button("split", self.split_regex, self.split_pin_btn),
        )
        self.split_regex.bind(
            "<KeyRelease>",
            lambda _e: self._sync_pin_button("split", self.split_regex, self.split_pin_btn),
        )

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

        button_frame = ttk.Frame(options_frame)
        button_frame.grid(row=2, column=2, sticky="e", padx=5, pady=5)
        ttk.Button(button_frame, text="Xem trước", command=self._preview_split).grid(row=0, column=0, padx=2)
        ttk.Button(button_frame, text="BẮT ĐẦU CHIA FILE", command=self._execute_split).grid(row=0, column=1, padx=2)

        preview_frame = ttk.LabelFrame(main_paned, text="2. Xem trước kết quả chia", padding="10")
        main_paned.add(preview_frame, weight=1)

        cols = ("STT", "Nội dung bắt đầu", "Kích thước")
        self.split_tree = ttk.Treeview(preview_frame, columns=cols, show='headings')
        self.split_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.split_tree.bind("<Double-1>", self._open_preview_file)

        for col, width in zip(cols, [50, 400, 100]):
            self.split_tree.heading(col, text=col)
            self.split_tree.column(col, width=width, anchor='w')

        vsb = ttk.Scrollbar(preview_frame, orient="vertical", command=self.split_tree.yview)
        vsb.pack(side=tk.RIGHT, fill=tk.Y)
        self.split_tree.configure(yscrollcommand=vsb.set)

    def _open_preview_file(self, event):
        item_id = self.split_tree.identify_row(event.y)
        if item_id:
            self.split_tree.selection_set(item_id)
        selected_item = self.split_tree.selection()
        if not selected_item:
            return
        item_data = self.split_tree.item(selected_item[0], 'values')
        if not item_data:
            return
        try:
            file_index = int(item_data[0]) - 1
        except Exception:
            messagebox.showerror("Lỗi", "Dữ liệu hàng không hợp lệ.")
            return
        filepath = self.selected_file.get()
        regex = self.split_regex.get()
        name_format = self.split_format_combobox.get()
        chunks, error = TextOperations.get_split_chunks(filepath, regex, self.split_position.get())
        if error or file_index >= len(chunks):
            messagebox.showerror("Lỗi", "Không thể mở nội dung file.")
            return
        file_content = chunks[file_index][0]
        file_name = TextOperations.render_split_filename(name_format, file_index + 1)
        preview_window = tk.Toplevel(self)
        self._apply_window_icon(preview_window)
        preview_window.title(f"Xem trước: {file_name}")
        preview_window.geometry("800x600")
        text_widget = scrolledtext.ScrolledText(preview_window, wrap=tk.WORD, state="normal")
        text_widget.pack(fill=tk.BOTH, expand=True)
        text_widget.insert("1.0", file_content)
        text_widget.config(state="disabled")

    def _mark_text_as_modified(self, event=None):
        if self.text_content.edit_modified():
            self.text_modified.set(True)
        self.text_content.edit_modified(False)

    def _select_file_for_ops(self, filepath=None):
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
                if response is True and not self._save_changes():
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
        self._update_history_combobox(self.find_text, key='find')
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
            self.text_content.focus_set()
        else:
            self.log(f"Không tìm thấy \"{find_what}\".")
            messagebox.showinfo("Không tìm thấy", f"Không tìm thấy \"{find_what}\"", parent=self)
    
    def _replace_current(self):
        try:
            if not self.text_content.tag_ranges(tk.SEL):
                self._find_next()
                if not self.text_content.tag_ranges(tk.SEL): 
                    return
        except tk.TclError:
            self._find_next()
            if not self.text_content.tag_ranges(tk.SEL): 
                return
        find_what = self.find_text.get()
        replace_with = self.replace_text.get()
        if find_what: self._update_history_combobox(self.find_text, key='find')
        if replace_with: self._update_history_combobox(self.replace_text, key='replace')
        replaced = TextOperations.replace_text(
            self.text_content,
            find_what,
            replace_with,
            match_case=self.match_case.get(),
            use_regex=self.use_regex.get()
        )
        if replaced:
            self.log(f"Đã thay thế lựa chọn hiện tại bằng '{replace_with}'.")
            self._find_next()
        else:
            messagebox.showwarning("Thay thế", "Văn bản được chọn không khớp với văn bản tìm kiếm.", parent=self)

    def _replace_all(self):
        find_what = self.find_text.get()
        replace_with = self.replace_text.get()
        if not find_what:
            return
        self._update_history_combobox(self.find_text, key='find')
        if replace_with:
            self._update_history_combobox(self.replace_text, key='replace')
        if not messagebox.askyesno("Xác nhận", "Bạn có chắc muốn thay thế tất cả trong file này?"):
            return
        count = TextOperations.replace_all(
            self.text_content, find_what, replace_with,
            match_case=self.match_case.get(),
            match_word=self.match_word.get(),
            use_regex=self.use_regex.get()
        )
        if count > 0:
            self.log(f"Thay thế tất cả: {count} kết quả được thay thế cho '{find_what}'.")
            self._mark_text_as_modified()
        messagebox.showinfo("Hoàn tất", f"Đã thay thế {count} kết quả.", parent=self)

    def _save_changes(self):
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
        self._update_history_combobox(self.split_regex, key='split')
        preview_data, error = TextOperations.split_file(filepath, regex, self.split_position.get())
        self.split_tree.delete(*self.split_tree.get_children())
        if error:
            messagebox.showerror("Lỗi Regex", error)
            return
        for i, (content, size) in enumerate(preview_data):
            self.split_tree.insert("", "end", values=(i + 1, content.strip(), f"{size} bytes"))
        self.log(f"Xem trước chia file '{os.path.basename(filepath)}' thành {len(preview_data)} phần.")

    def _execute_split(self):
        filepath = self.selected_file.get()
        regex = self.split_regex.get()
        name_format = self.split_format_combobox.get()
        if not filepath or not regex or not name_format:
            messagebox.showwarning("Thiếu thông tin", "Vui lòng chọn file, nhập Regex và cấu trúc tên file.")
            return
        self._update_history_combobox(self.split_regex, key='split')
        self._update_history_combobox(self.split_format_combobox)
        if not messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn chia file '{os.path.basename(filepath)}'?"):
            return
        count, error = TextOperations.execute_split(filepath, regex, self.split_position.get(), name_format)
        if error:
            messagebox.showerror("Lỗi", f"Chia file thất bại: {error}")
        else:
            messagebox.showinfo("Hoàn tất", f"Đã chia file thành công thành {count} phần.")
            self.log(f"Đã chia file '{os.path.basename(filepath)}' thành {count} phần.")

    def _apply_history_with_pins(self, combobox, history_list, pin_key=None):
        pins = []
        if pin_key:
            pins = [p for p in self.regex_pins.get(pin_key, []) if p]
        combined = []
        for v in pins + list(history_list or []):
            if v and v not in combined:
                combined.append(v)
        combobox['values'] = combined

    def _update_history_combobox(self, combobox, key=None, max_history=20):
        current_value = combobox.get().strip()
        if not current_value:
            return
        history = [item for item in combobox['values'] if item.strip()]
        pins = []
        if key:
            pins = [p for p in self.regex_pins.get(key, []) if p]
        if current_value in history:
            history.remove(current_value)
        history.insert(0, current_value)
        combined = []
        for v in pins + history:
            if v and v not in combined:
                combined.append(v)
        if pins:
            pin_set = set(pins)
            pinned_part = [v for v in combined if v in pin_set]
            other_part = [v for v in combined if v not in pin_set][:max_history]
            combined = pinned_part + other_part
        else:
            combined = combined[:max_history]
        combobox['values'] = combined

    def _toggle_pin(self, key, combobox, button=None):
        value = combobox.get().strip()
        if not value:
            messagebox.showinfo("Thông báo", "Không có nội dung để ghim.", parent=self)
            return
        pins = [p for p in self.regex_pins.get(key, []) if p]
        if value in pins:
            pins = [p for p in pins if p != value]
        else:
            pins = [value] + pins
        self.regex_pins[key] = pins[:50]
        self._update_history_combobox(combobox, key=key)
        if button:
            self._sync_pin_button(key, combobox, button)
        self.save_config()

    def _sync_pin_button(self, key, combobox, button):
        if not button:
            return
        value = combobox.get().strip()
        pins = [p for p in self.regex_pins.get(key, []) if p]
        button.config(text="Bỏ ghim" if value and value in pins else "Ghim")

    def _create_quick_tools_widgets(self, parent):
        parent.columnconfigure(0, weight=1)

        renumber_frame = ttk.LabelFrame(parent, text="1. Đánh lại số chương", padding=10)
        renumber_frame.grid(row=0, column=0, columnspan=2, sticky="ew")
        renumber_frame.columnconfigure(1, weight=1)
        ttk.Label(renumber_frame, text="Regex tìm kiếm:").grid(row=0, column=0, sticky="w", padx=5, pady=2)
        self.renumber_find_regex = ttk.Entry(renumber_frame)
        self.renumber_find_regex.insert(0, r"第\d+章")
        self.renumber_find_regex.grid(row=0, column=1, sticky="ew", padx=5)
        ttk.Label(renumber_frame, text="Cấu trúc thay thế:").grid(row=1, column=0, sticky="w", padx=5, pady=2)
        self.renumber_replace_format = ttk.Entry(renumber_frame)
        self.renumber_replace_format.insert(0, "第{num}章")
        self.renumber_replace_format.grid(row=1, column=1, sticky="ew", padx=5)
        ttk.Label(renumber_frame, text="(Phải chứa {num})").grid(row=1, column=2, sticky="w")
        action_frame1 = ttk.Frame(renumber_frame)
        action_frame1.grid(row=2, column=1, sticky="e", pady=(5, 0))
        ttk.Label(action_frame1, text="Bắt đầu từ số:").pack(side=tk.LEFT)
        self.renumber_start_var = tk.StringVar(value="1")
        ttk.Entry(action_frame1, textvariable=self.renumber_start_var, width=5).pack(side=tk.LEFT, padx=5)
        ttk.Button(action_frame1, text="Thực hiện", command=self._renumber_chapters_in_text).pack(side=tk.LEFT)

        toc_frame = ttk.LabelFrame(parent, text="2. Thêm tiêu đề từ Mục lục", padding=10)
        toc_frame.grid(row=1, column=0, columnspan=2, sticky="ew", pady=10)
        toc_frame.columnconfigure(0, weight=1)
        toc_frame.rowconfigure(1, weight=1)

        toc_input_header = ttk.Frame(toc_frame)
        toc_input_header.grid(row=0, column=0, columnspan=2, sticky="ew")
        ttk.Label(toc_input_header, text="Dán hoặc tải nội dung Mục lục vào ô bên dưới:").pack(side=tk.LEFT)
        ttk.Button(toc_input_header, text="Tải file Mục lục...", command=self._load_toc_into_text).pack(side=tk.RIGHT)

        self.toc_content_text = scrolledtext.ScrolledText(toc_frame, wrap=tk.WORD, height=8)
        self.toc_content_text.grid(row=1, column=0, columnspan=2, sticky="nsew", pady=5)

        regex_frame = ttk.Frame(toc_frame)
        regex_frame.grid(row=2, column=0, columnspan=2, sticky="ew", pady=5)
        regex_frame.columnconfigure(1, weight=1)
        ttk.Label(regex_frame, text="Regex file Mục lục:").grid(row=0, column=0, sticky="w", padx=5, pady=2)
        self.toc_file_regex = ttk.Entry(regex_frame)
        self.toc_file_regex.insert(0, r"^(第\d+章)")
        self.toc_file_regex.grid(row=0, column=1, sticky="ew", padx=5)
        ttk.Label(regex_frame, text="(Cần 1 nhóm bắt)").grid(row=0, column=2, sticky="w")
        ttk.Label(regex_frame, text="Regex file Truyện:").grid(row=1, column=0, sticky="w", padx=5, pady=2)
        self.main_file_regex = ttk.Entry(regex_frame)
        self.main_file_regex.insert(0, r"^(第\d+章)$")
        self.main_file_regex.grid(row=1, column=1, sticky="ew", padx=5)
        ttk.Label(regex_frame, text="(Khớp phần cần thay)").grid(row=1, column=2, sticky="w")

        action_frame2 = ttk.Frame(toc_frame)
        action_frame2.grid(row=3, column=0, columnspan=2, sticky="ew", pady=5)
        self.toc_mode_var = tk.StringVar(value="append")
        ttk.Radiobutton(action_frame2, text="Bổ sung Tiêu đề", variable=self.toc_mode_var, value="append").pack(side=tk.LEFT)
        ttk.Radiobutton(action_frame2, text="Thay thế Toàn bộ", variable=self.toc_mode_var, value="replace").pack(side=tk.LEFT, padx=10)
        ttk.Button(action_frame2, text="Áp dụng Mục lục", command=self._add_titles_from_toc_in_text).pack(side=tk.RIGHT)

    def _load_toc_into_text(self):
        toc_path = filedialog.askopenfilename(title="Chọn file Mục lục", filetypes=[("Text files", "*.txt")])
        if not toc_path:
            return
        try:
            with open(toc_path, "r", encoding="utf-8") as f:
                toc_content = f.read()
            self.toc_content_text.delete("1.0", tk.END)
            self.toc_content_text.insert("1.0", toc_content)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc file: {e}", parent=self)

    def _renumber_chapters_in_text(self):
        current_content = self.text_content.get("1.0", tk.END)
        if not current_content.strip():
            messagebox.showwarning("Thông báo", "Không có nội dung để xử lý.", parent=self)
            return

        find_regex = self.renumber_find_regex.get()
        replace_format = self.renumber_replace_format.get()

        try:
            start_num = int(self.renumber_start_var.get())
        except ValueError:
            messagebox.showerror("Lỗi", "Số bắt đầu phải là số nguyên.", parent=self)
            return

        if not messagebox.askyesno("Xác nhận", "Hành động này sẽ thay đổi nội dung hiện tại. Bạn có chắc muốn tiếp tục?"):
            return

        new_content, count, error = TextOperations.renumber_chapters(current_content, find_regex, replace_format, start_num)

        if error:
            messagebox.showerror("Lỗi", error, parent=self)
            return

        self.text_content.delete("1.0", tk.END)
        self.text_content.insert("1.0", new_content)
        self.log(f"[Công cụ nhanh] Đã đánh số lại {count} chương.")
        messagebox.showinfo("Hoàn tất", f"Đã đánh số lại thành công {count} chương.", parent=self)

    def _add_titles_from_toc_in_text(self):
        current_content = self.text_content.get("1.0", tk.END)
        toc_content = self.toc_content_text.get("1.0", tk.END).strip()

        if not current_content.strip() or not toc_content:
            messagebox.showwarning("Thiếu thông tin", "Vui lòng đảm bảo cả file truyện và nội dung mục lục đều đã có.", parent=self)
            return

        toc_regex = self.toc_file_regex.get()
        main_regex = self.main_file_regex.get()
        mode = self.toc_mode_var.get()

        if not messagebox.askyesno("Xác nhận", "Hành động này sẽ thay đổi nội dung file truyện hiện tại. Bạn có chắc?"):
            return

        new_content, count, error = TextOperations.apply_toc_to_content(current_content, toc_content, toc_regex, main_regex, mode)

        if error:
            messagebox.showerror("Lỗi", error, parent=self)
            return

        self.text_content.delete("1.0", tk.END)
        self.text_content.insert("1.0", new_content)
        self.log(f"[Công cụ nhanh] Đã áp dụng mục lục cho {count} chương.")
        messagebox.showinfo("Hoàn tất", f"Đã áp dụng thành công mục lục cho {count} chương.", parent=self)
