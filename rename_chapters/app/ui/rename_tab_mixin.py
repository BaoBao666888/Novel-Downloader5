import os
import re
import json
import tkinter as tk
from tkinter import ttk, scrolledtext, filedialog, messagebox

from typing import Optional

from app.core import renamer as logic


class RenameTabMixin:
    """UI cho tab Đổi Tên."""

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
        options_frame.columnconfigure(2, weight=0)

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
        ttk.Radiobutton(sort_by_frame, text="Nội dung", variable=self.sort_strategy, value="content", command=self._sort_and_refresh_ui).pack(side=tk.LEFT)
        ttk.Radiobutton(sort_by_frame, text="Tên file", variable=self.sort_strategy, value="filename", command=self._sort_and_refresh_ui).pack(side=tk.LEFT, padx=(5,0))
        
         # Cột 3: Sửa dòng đầu file ---
        self.edit_first_line_var = tk.BooleanVar(value=False)
        edit_line_frame = ttk.Frame(strategy_sort_frame)
        edit_line_frame.grid(row=0, column=2, sticky="w", padx=(20, 0))
        self.edit_first_line_chk = ttk.Checkbutton(
            edit_line_frame,
            text="Sửa dòng đầu của file",
            variable=self.edit_first_line_var,
            command=lambda: self._toggle_force_edit_first_line(schedule=True)
        )
        self.edit_first_line_chk.pack(side=tk.LEFT)
        self.force_edit_first_line_var = tk.BooleanVar(value=False)
        self.force_edit_first_line_chk = ttk.Checkbutton(
            edit_line_frame,
            text="Bắt buộc sửa (kể cả khi lỗi)",
            variable=self.force_edit_first_line_var,
            state=tk.DISABLED
        )
        # chỉ hiển thị khi bật sửa dòng đầu
        self._toggle_force_edit_first_line(schedule=False)
        
        ttk.Label(options_frame, text="Cấu trúc mới:").grid(row=1, column=0, sticky="w", padx=5, pady=(10, 5))
        self.format_combobox = ttk.Combobox(options_frame, values=["Chương {num} - {title}.txt"])
        self.format_combobox.grid(row=1, column=1, sticky="we", padx=5)
        self.format_combobox.set("Chương {num} - {title}.txt")
        self.format_combobox.bind("<KeyRelease>", self.schedule_preview_update)
        self.rename_adv_btn = ttk.Button(options_frame, text="Nâng cao", command=self._toggle_rename_advanced)
        self.rename_adv_btn.grid(row=1, column=2, sticky="e", padx=(0, 5))
        ttk.Label(options_frame, text="(Dùng {num}, {title}, và {num + n} hoặc {num - n})").grid(row=2, column=1, columnspan=2, sticky="w", padx=5)
        
        self.filename_regex_label = ttk.Label(options_frame, text="Regex (tên file):")
        self.filename_regex_label.grid(row=3, column=0, sticky="nw", padx=5, pady=(10, 5))
        self.filename_regex_text = tk.Text(options_frame, height=2, wrap=tk.WORD, undo=True)
        self.filename_regex_text.grid(row=3, column=1, sticky="we", padx=5)
        self.filename_regex_text.bind("<KeyRelease>", self.schedule_preview_update)
        self.filename_regex_btns = ttk.Frame(options_frame)
        self.filename_regex_btns.grid(row=3, column=2, sticky="n", padx=(0, 5), pady=(10, 0))
        self.filename_regex_help_btn = ttk.Button(self.filename_regex_btns, text="?", width=1, command=self.show_regex_guide)
        self.filename_regex_help_btn.pack(side=tk.LEFT)
        self.filename_regex_suggest_btn = ttk.Button(self.filename_regex_btns, text="Gợi ý", width=6, command=self._suggest_filename_regex)
        self.filename_regex_suggest_btn.pack(side=tk.LEFT, padx=(4, 0))
        self.filename_regex_hint = ttk.Label(options_frame, text="(Mỗi dòng là một mẫu Regex)")
        self.filename_regex_hint.grid(row=4, column=1, sticky="w", padx=5)

        self.content_regex_label = ttk.Label(options_frame, text="Regex (nội dung):")
        self.content_regex_label.grid(row=5, column=0, sticky="nw", padx=5, pady=5)
        self.content_regex_text = tk.Text(options_frame, height=2, wrap=tk.WORD, undo=True)
        self.content_regex_text.grid(row=5, column=1, sticky="we", padx=5, pady=5)
        self.content_regex_text.bind("<KeyRelease>", self.schedule_preview_update)
        self.content_regex_btns = ttk.Frame(options_frame)
        self.content_regex_btns.grid(row=5, column=2, sticky="n", padx=(0, 5), pady=(5, 0))
        self.content_regex_help_btn = ttk.Button(self.content_regex_btns, text="?", width=1, command=self.show_regex_guide)
        self.content_regex_help_btn.pack(side=tk.LEFT)
        self.content_regex_suggest_btn = ttk.Button(self.content_regex_btns, text="Gợi ý", width=6, command=self._suggest_content_regex)
        self.content_regex_suggest_btn.pack(side=tk.LEFT, padx=(4, 0))
        self.content_regex_hint = ttk.Label(options_frame, text="(Mỗi dòng là một mẫu Regex)")
        self.content_regex_hint.grid(row=6, column=1, sticky="w", padx=5)

        self._rename_adv_widgets = [
            self.filename_regex_label,
            self.filename_regex_text,
            self.filename_regex_btns,
            self.filename_regex_hint,
            self.content_regex_label,
            self.content_regex_text,
            self.content_regex_btns,
            self.content_regex_hint,
        ]
        self._rename_adv_visible = False
        self._toggle_rename_advanced(force=False)

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
        ttk.Button(
            actions_bar,
            text="Xóa rác",
            command=lambda: self._open_junk_remover(source_label="Đổi tên", folder_path=self.folder_path.get()),
        ).pack(side=tk.LEFT, padx=5)
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

    def _toggle_rename_advanced(self, force: Optional[bool] = None):
        target = (not self._rename_adv_visible) if force is None else bool(force)
        self._rename_adv_visible = target
        if target:
            for widget in self._rename_adv_widgets:
                widget.grid()
            self.rename_adv_btn.config(text="Ẩn nâng cao")
        else:
            for widget in self._rename_adv_widgets:
                widget.grid_remove()
            self.rename_adv_btn.config(text="Nâng cao")

    def _load_regex_dataset(self) -> dict:
        dataset_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "regex_dataset.json")
        try:
            with open(dataset_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _parse_num(self, raw: str) -> Optional[int]:
        if raw is None:
            return None
        raw = str(raw).strip()
        if not raw:
            return None
        if raw.isdigit():
            try:
                return int(raw)
            except Exception:
                return None
        try:
            return logic.chinese_to_arabic(raw)
        except Exception:
            return None

    def _looks_number_only(self, line: str, num_raw: str, title: str) -> bool:
        if title:
            return False
        stripped = re.sub(r"[\\s\\-|:|｜\\|\\.\\[\\]\\(\\)【】]+", "", line)
        return stripped == str(num_raw).strip()

    def _score_regex_candidates(self, samples: list, patterns: list) -> list:
        scored = []
        total = len(samples)
        if total == 0:
            return scored
        for pattern in patterns:
            try:
                regex = re.compile(pattern, re.IGNORECASE)
            except Exception:
                continue
            match_count = 0
            capture_count = 0
            title_ok = 0
            num_ok = 0
            nums = []
            noise_count = 0
            for line in samples:
                line = line.strip()
                if not line:
                    continue
                m = regex.search(line)
                if not m:
                    continue
                match_count += 1
                if m.lastindex and m.lastindex >= 2:
                    num_raw = m.group(1)
                    title = (m.group(2) or "").strip()
                    num_val = self._parse_num(num_raw)
                    if num_val and num_val > 0:
                        num_ok += 1
                        nums.append(num_val)
                    if title or self._looks_number_only(line, num_raw, title):
                        title_ok += 1
                    capture_count += 1
                    if re.search(r"https?://|www\\.", title):
                        noise_count += 1
            if match_count == 0:
                continue
            match_rate = match_count / total
            capture_rate = capture_count / match_count if match_count else 0
            num_rate = num_ok / match_count if match_count else 0
            title_rate = title_ok / match_count if match_count else 0
            unique_rate = (len(set(nums)) / len(nums)) if nums else 0
            noise_rate = noise_count / match_count if match_count else 0
            score = 0.35 * match_rate + 0.25 * num_rate + 0.15 * title_rate + 0.15 * unique_rate - 0.10 * noise_rate
            scored.append({
                "pattern": pattern,
                "score": score,
                "match_rate": match_rate,
                "capture_rate": capture_rate,
                "num_rate": num_rate,
                "title_rate": title_rate,
                "unique_rate": unique_rate,
            })
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored

    def _get_candidate_patterns(self) -> list:
        dataset = self._load_regex_dataset()
        patterns = []
        for item in dataset.get("patterns", []):
            pat = item.get("regex")
            if pat:
                patterns.append(pat)
        # fallback built-in
        patterns.extend([
            r"^第\\s*([一二三四五六七八九十百千万两零\\d]+)\\s*章\\s*[\\-:|｜\\|]*\\s*(.*)$",
            r"^(\\d+)\\s*[\\.|\\-:|｜\\|]?\\s*(.*)$",
            r"^\\[?(\\d+)\\]?\\s*[\\-:|｜\\|]?\\s*(.*)$",
            r"^(\\d+)\\s+[\\-|:|｜\\|]?\\s*(.*)$",
        ])
        # remove duplicates
        unique = []
        for p in patterns:
            if p not in unique:
                unique.append(p)
        return unique

    def _suggest_regex_from_samples(self, samples: list) -> list:
        patterns = self._get_candidate_patterns()
        scored = self._score_regex_candidates(samples, patterns)
        return scored[:3]

    def _collect_filename_samples(self) -> list:
        path = self.folder_path.get()
        if not os.path.isdir(path):
            return []
        try:
            files = [f for f in os.listdir(path) if f.lower().endswith(".txt")]
        except Exception:
            return []
        samples = []
        for filename in files:
            samples.append(os.path.splitext(filename)[0])
        return samples

    def _collect_content_samples(self) -> list:
        path = self.folder_path.get()
        if not os.path.isdir(path):
            return []
        try:
            files = [f for f in os.listdir(path) if f.lower().endswith(".txt")]
        except Exception:
            return []
        samples = []
        for filename in files:
            filepath = os.path.join(path, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    line = f.readline().strip()
                    if line:
                        samples.append(line)
            except Exception:
                continue
        return samples

    def _choose_regex_from_suggestions(self, text_widget: tk.Text, suggestions: list):
        if not suggestions:
            messagebox.showwarning("Không có gợi ý", "Không tìm được regex phù hợp từ dữ liệu hiện tại.")
            return
        win = tk.Toplevel(self)
        win.title("Chọn regex gợi ý")
        win.geometry("760x420")
        win.transient(self)
        win.grab_set()

        ttk.Label(win, text="Chọn 1 regex trong top 3 và xem thống kê:").pack(anchor="w", padx=10, pady=(10, 5))
        list_frame = ttk.Frame(win)
        list_frame.pack(fill="both", expand=True, padx=10)
        cols = ("Regex", "Match", "Num", "Title", "Unique", "Score")
        tree = ttk.Treeview(list_frame, columns=cols, show="headings", height=6)
        for col, width in zip(cols, [360, 70, 70, 70, 70, 70]):
            tree.heading(col, text=col)
            tree.column(col, width=width, stretch=(col == "Regex"))
        vsb = ttk.Scrollbar(list_frame, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=vsb.set)
        tree.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")
        list_frame.columnconfigure(0, weight=1)
        list_frame.rowconfigure(0, weight=1)

        for idx, item in enumerate(suggestions):
            tree.insert(
                "",
                "end",
                iid=str(idx),
                values=(
                    item["pattern"],
                    f"{item['match_rate']:.0%}",
                    f"{item['num_rate']:.0%}",
                    f"{item['title_rate']:.0%}",
                    f"{item['unique_rate']:.0%}",
                    f"{item['score']:.2f}",
                ),
            )
        if suggestions:
            tree.selection_set("0")

        btn_frame = ttk.Frame(win)
        btn_frame.pack(fill="x", padx=10, pady=(8, 10))
        stats_var = tk.StringVar(value="")
        ttk.Label(btn_frame, textvariable=stats_var).pack(side=tk.LEFT, fill="x", expand=True)

        def _update_stats():
            sel = tree.selection()
            if not sel:
                stats_var.set("")
                return
            item = suggestions[int(sel[0])]
            stats_var.set(
                f"Match: {item['match_rate']:.0%} | Num: {item['num_rate']:.0%} | Title: {item['title_rate']:.0%} | Unique: {item['unique_rate']:.0%} | Score: {item['score']:.2f}"
            )

        def _apply():
            sel = tree.selection()
            if not sel:
                return
            item = suggestions[int(sel[0])]
            text_widget.delete("1.0", tk.END)
            text_widget.insert("1.0", item["pattern"])
            self.schedule_preview_update()
            self.log(
                f"[Regex] Chọn regex: {item['pattern']} | Match {item['match_rate']:.0%}, Num {item['num_rate']:.0%}, Title {item['title_rate']:.0%}"
            )
            win.destroy()

        tree.bind("<<TreeviewSelect>>", lambda _e: _update_stats())
        _update_stats()
        ttk.Button(btn_frame, text="Chọn", command=_apply).pack(side=tk.RIGHT)
        ttk.Button(btn_frame, text="Đóng", command=win.destroy).pack(side=tk.RIGHT, padx=(0, 6))

    def _suggest_filename_regex(self):
        samples = self._collect_filename_samples()
        suggestions = self._suggest_regex_from_samples(samples)
        self._choose_regex_from_suggestions(self.filename_regex_text, suggestions)

    def _suggest_content_regex(self):
        samples = self._collect_content_samples()
        suggestions = self._suggest_regex_from_samples(samples)
        self._choose_regex_from_suggestions(self.content_regex_text, suggestions)

    # ==== Logic cho tab Đổi Tên ====
    def select_folder(self):
        path = filedialog.askdirectory(title="Chọn thư mục chứa file .txt")
        if path:
            self.folder_path.set(path)
            self.log(f"Đã chọn thư mục: {path}")
            self.schedule_preview_update(None)

    def schedule_preview_update(self, event=None):
        if getattr(self, "preview_job", None):
            self.after_cancel(self.preview_job)
        self.preview_job = self.after(300, self._update_rename_preview)

    def _update_rename_preview(self):
        path = self.folder_path.get()
        if not os.path.isdir(path):
            return
        self._toggle_force_edit_first_line(schedule=False)

        current_selection = {self.tree.item(item, "values")[1] for item in self.tree.selection()}
        self.tree.delete(*self.tree.get_children())
        self.files_data.clear()

        self.log("Bắt đầu quét và phân tích lại các file...")
        try:
            files = [f for f in os.listdir(path) if f.lower().endswith(".txt")]
        except Exception as e:
            self.log(f"Lỗi khi truy cập thư mục: {e}")
            messagebox.showerror("Lỗi", f"Không thể đọc các file trong thư mục: {e}")
            return

        for filename in files:
            filepath = os.path.join(path, filename)
            fn_regex_list = self.filename_regex_text.get("1.0", tk.END).strip().split("\n")
            ct_regex_list = self.content_regex_text.get("1.0", tk.END).strip().split("\n")
            analysis = logic.analyze_file(filepath, custom_filename_regexes=fn_regex_list, custom_content_regexes=ct_regex_list)
            self.files_data.append(analysis)

        self._sort_files()

        for i, analysis in enumerate(self.sorted_files_cache):
            self._insert_file_to_tree(analysis, i)
            if analysis["filename"] in current_selection:
                try:
                    last_item = self.tree.get_children()[-1]
                    self.tree.selection_add(last_item)
                except Exception:
                    pass

        self.log(f"Phân tích hoàn tất cho {len(self.files_data)} file.")
        self.preview_job = None

        sorted_filenames = [f["filename"] for f in self.sorted_files_cache]
        if sorted_filenames:
            self.credit_file_selector["values"] = sorted_filenames
            self.credit_file_selector.current(0)
        else:
            self.credit_file_selector["values"] = []
            self.credit_file_selector.set("")

    def start_renaming(self):
        if not self.sorted_files_cache:
            messagebox.showwarning("Cảnh báo", "Chưa có file nào để đổi tên.")
            return

        files_to_rename = [f for f in self.sorted_files_cache if f["filename"] not in self.excluded_files]
        if not files_to_rename:
            messagebox.showwarning("Cảnh báo", "Tất cả file đã bị loại trừ hoặc không có file nào.")
            return

        if not messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn đổi tên {len(files_to_rename)} file không?"):
            return

        self.log("=" * 20 + " BẮT ĐẦU ĐỔI TÊN " + "=" * 20)
        success, fail = 0, 0
        folder, strategy, name_format = self.folder_path.get(), self.strategy.get(), self.format_combobox.get()
        self._update_history_combobox(self.format_combobox)

        custom_titles = self.custom_titles_text.get("1.0", tk.END).strip().split("\n") if self.use_custom_titles.get() else None

        for i, analysis in enumerate(self.sorted_files_cache):
            if analysis["filename"] in self.excluded_files:
                self.log(f"[Loại trừ] Bỏ qua file: {analysis['filename']}")
                continue

            new_name = logic.generate_new_name(analysis, strategy, name_format, custom_titles, i)

            if self.edit_first_line_var.get():
                if new_name is not None or self.force_edit_first_line_var.get():
                    try:
                        preview_name_for_line = logic.generate_new_name(
                            analysis,
                            strategy,
                            name_format,
                            custom_titles=custom_titles,
                            file_index=i,
                            sanitize_output=False,
                        ) or self._generate_preview_name(analysis, i)
                        new_first_line = os.path.splitext(preview_name_for_line)[0]

                        with open(analysis["filepath"], "r", encoding="utf-8") as f:
                            lines = f.readlines()

                        if lines:
                            lines[0] = new_first_line + "\n"
                        else:
                            lines.append(new_first_line + "\n")

                        with open(analysis["filepath"], "w", encoding="utf-8") as f:
                            f.writelines(lines)
                        self.log(f"[Sửa nội dung] Đã cập nhật dòng đầu của file: {analysis['filename']}")
                    except Exception as e:
                        self.log(f"[Lỗi nội dung] Không thể sửa dòng đầu file {analysis['filename']}: {e}")
                else:
                    self.log(f"[Cảnh báo] Bỏ qua sửa dòng đầu cho file {analysis['filename']} vì không lấy được số chương và không bị bắt buộc.")

            if new_name is None:
                self.log(f"[Bỏ qua] {analysis['filename']}: Không tìm thấy số chương.")
                fail += 1
                continue
            if new_name == analysis["filename"]:
                self.log(f"[Bỏ qua] {analysis['filename']}: Tên đã đúng.")
                continue

            try:
                os.rename(analysis["filepath"], os.path.join(folder, new_name))
                self.log(f"[Thành công] {analysis['filename']} -> {new_name}")
                success += 1
            except Exception as e:
                self.log(f"[Lỗi] {analysis['filename']}: {e}")
                fail += 1

        self.log(f"Hoàn tất! Thành công: {success}, Thất bại/Bỏ qua: {fail}")
        messagebox.showinfo("Hoàn tất", f"Đã xong.\nThành công: {success}\nThất bại/Bỏ qua: {fail + len(self.excluded_files)}")
        self.schedule_preview_update(None)

    def _sort_files(self):
        sort_by = self.sort_strategy.get()

        def get_sort_key(analysis):
            num = None
            if sort_by == "content":
                num = analysis["from_content"]["num"]
            else:
                num = analysis["from_filename"]["num"]
            if num is None:
                num = analysis["from_filename"]["num"] if sort_by == "content" else analysis["from_content"]["num"]
            return num if num is not None else float("inf")

        self.sorted_files_cache = sorted(self.files_data, key=get_sort_key)

    def _sort_and_refresh_ui(self):
        if not self.files_data:
            return
        self._sort_files()
        self.tree.delete(*self.tree.get_children())
        for i, analysis in enumerate(self.sorted_files_cache):
            self._insert_file_to_tree(analysis, i)
        self.log("Đã sắp xếp lại danh sách file.")

    def _search_files(self, event=None):
        search_term = self.search_var.get().lower()
        self.tree.delete(*self.tree.get_children())
        for i, analysis in enumerate(self.sorted_files_cache):
            if search_term in analysis["filename"].lower():
                self._insert_file_to_tree(analysis, i)

    def _toggle_exclusion(self, exclude: bool):
        selected_items = self.tree.selection()
        if not selected_items:
            return

        for item_id in selected_items:
            try:
                filename = self.tree.item(item_id, "values")[1]
                if exclude:
                    self.excluded_files.add(filename)
                else:
                    self.excluded_files.discard(filename)
            except IndexError:
                continue

        self._refresh_tree_tags()

    def _refresh_tree_tags(self):
        for item_id in self.tree.get_children():
            try:
                values = list(self.tree.item(item_id, "values"))
                filename = values[1]
                if filename in self.excluded_files:
                    values[0] = "Loại trừ"
                    self.tree.item(item_id, values=values, tags=("excluded",))
                else:
                    values[0] = "OK"
                    self.tree.item(item_id, values=values, tags=())
            except IndexError:
                pass

    def _insert_file_to_tree(self, analysis: dict, index: int):
        new_name = self._generate_preview_name(analysis, index)
        tags = ("excluded",) if analysis["filename"] in self.excluded_files else ()
        status = "Loại trừ" if analysis["filename"] in self.excluded_files else "OK"
        item_id = self.tree.insert(
            "",
            "end",
            values=(
                status,
                analysis["filename"],
                analysis["from_filename"]["num"] or "N/A",
                analysis["from_content"]["num"] or "N/A",
                new_name,
            ),
            tags=tags,
        )
        try:
            folder = self.folder_path.get()
            fullpath = os.path.join(folder, analysis["filename"])
        except Exception:
            fullpath = analysis.get("filename", "")
        self.tree_filepaths[item_id] = fullpath

    def _generate_preview_name(self, analysis: dict, index: int) -> str:
        custom_titles = self.custom_titles_text.get("1.0", tk.END).strip().split("\n") if self.use_custom_titles.get() else None
        return (
            logic.generate_new_name(
                analysis,
                self.strategy.get(),
                self.format_combobox.get(),
                custom_titles=custom_titles,
                file_index=index,
            )
            or "Lỗi/Thiếu số"
        )

    def _toggle_force_edit_first_line(self, schedule: bool = True):
        if self.edit_first_line_var.get():
            if not getattr(self.force_edit_first_line_chk, "_packed", False):
                self.force_edit_first_line_chk.pack(side=tk.LEFT, padx=5)
                self.force_edit_first_line_chk._packed = True
            self.force_edit_first_line_chk.configure(state=tk.NORMAL)
        else:
            self.force_edit_first_line_var.set(False)
            if getattr(self.force_edit_first_line_chk, "_packed", False):
                self.force_edit_first_line_chk.pack_forget()
                self.force_edit_first_line_chk._packed = False
            self.force_edit_first_line_chk.configure(state=tk.DISABLED)

        if schedule:
            self.schedule_preview_update(None)

    def _open_preview_from_rename(self, event):
        selected = self.tree.selection()
        if not selected:
            return
        item = selected[0]
        filepath = self.tree_filepaths.get(item)
        if not filepath:
            try:
                filename = self.tree.item(item, "values")[1]
                filepath = os.path.join(self.folder_path.get(), filename)
            except Exception:
                messagebox.showerror("Lỗi", "Không xác định được đường dẫn file.")
                return

        if not os.path.isfile(filepath):
            messagebox.showerror("Lỗi", f"Không tìm thấy file:\n{filepath}")
            return

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc file: {e}")
            return

        preview_window = tk.Toplevel(self)
        self._apply_window_icon(preview_window)
        preview_window.title(os.path.basename(filepath))
        preview_window.geometry("800x600")

        txt = scrolledtext.ScrolledText(preview_window, wrap=tk.WORD)
        txt.pack(fill=tk.BOTH, expand=True)
        txt.insert("1.0", content)
        txt.config(state="disabled")

        btn_frame = ttk.Frame(preview_window)
        btn_frame.pack(fill=tk.X, pady=10)

        center_frame = ttk.Frame(btn_frame)
        center_frame.pack(anchor="center")

        ttk.Button(
            center_frame,
            text="Chỉnh sửa",
            command=lambda: [preview_window.destroy(), self._jump_to_text_ops_and_load(filepath)],
        ).pack(side=tk.LEFT, padx=5)
        ttk.Button(
            center_frame,
            text="Đổi tên",
            command=lambda: self._open_manual_rename(preview_window, filepath, item),
        ).pack(side=tk.LEFT, padx=5)
        ttk.Button(
            center_frame,
            text="Dịch",
            command=lambda: [preview_window.destroy(), self._jump_to_translator_and_load(filepath)],
        ).pack(side=tk.LEFT, padx=5)

    def _jump_to_text_ops_and_load(self, filepath):
        """Chuyển sang tab Xử lý Văn bản -> Tìm & Thay thế và load file để chỉnh sửa."""
        self._select_tab_by_name("Xử lý Văn bản")
        try:
            if hasattr(self, "ops_notebook"):
                selected = False
                for tab_id in self.ops_notebook.tabs():
                    if self.ops_notebook.tab(tab_id, "text") == "Tìm & Thay thế":
                        self.ops_notebook.select(tab_id)
                        selected = True
                        break
                if not selected:
                    tabs = self.ops_notebook.tabs()
                    if tabs:
                        self.ops_notebook.select(tabs[0])
        except Exception:
            pass

        self._select_file_for_ops(filepath=filepath)

    def _jump_to_translator_and_load(self, filepath):
        """Chuyển sang tab Dịch và tải nội dung file vào."""
        self._select_tab_by_name("Dịch")
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            self.translator_input_text.delete("1.0", tk.END)
            self.translator_input_text.insert("1.0", content)
            self.log(f"Đã tải file '{os.path.basename(filepath)}' vào tab Dịch.")
            self._start_translation_thread(self.translator_input_text, self.translator_output_text)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc hoặc tải file: {e}")

    def _open_manual_rename(self, preview_window, filepath, item_id):
        if not os.path.isfile(filepath):
            messagebox.showerror("Lỗi", "Không tìm thấy file để đổi tên.")
            return
        directory = os.path.dirname(filepath)
        current_name = os.path.basename(filepath)
        win = tk.Toplevel(preview_window)
        self._apply_window_icon(win)
        win.title("Đổi tên file")
        win.geometry("420x160")

        frame = ttk.Frame(win, padding=12)
        frame.pack(fill="both", expand=True)
        ttk.Label(frame, text="Tên hiện tại:").grid(row=0, column=0, sticky="w")
        ttk.Label(frame, text=current_name).grid(row=0, column=1, sticky="w")
        ttk.Label(frame, text="Tên mới:").grid(row=1, column=0, sticky="w", pady=(8, 0))
        new_name_var = tk.StringVar(value=current_name)
        entry = ttk.Entry(frame, textvariable=new_name_var, width=45)
        entry.grid(row=1, column=1, sticky="ew", pady=(8, 0))
        entry.focus_set()
        frame.columnconfigure(1, weight=1)

        btns = ttk.Frame(frame)
        btns.grid(row=2, column=0, columnspan=2, sticky="e", pady=(12, 0))

        def _apply():
            new_name = new_name_var.get().strip()
            if not new_name:
                messagebox.showerror("Lỗi", "Tên mới không được rỗng.", parent=win)
                return
            if new_name == current_name:
                win.destroy()
                preview_window.destroy()
                return
            new_path = os.path.join(directory, new_name)
            if os.path.exists(new_path):
                messagebox.showerror("Lỗi", "Đã tồn tại file/thư mục cùng tên.", parent=win)
                return
            try:
                os.rename(filepath, new_path)
            except Exception as exc:
                messagebox.showerror("Lỗi", f"Không thể đổi tên: {exc}", parent=win)
                return
            if hasattr(self, "tree_filepaths") and isinstance(self.tree_filepaths, dict):
                if item_id in self.tree_filepaths:
                    self.tree_filepaths[item_id] = new_path
            win.destroy()
            preview_window.destroy()
            self.log(f"[Đổi Tên] Đổi '{current_name}' -> '{new_name}'")
            self.schedule_preview_update(None)

        ttk.Button(btns, text="Lưu", command=_apply).pack(side=tk.RIGHT)
        ttk.Button(btns, text="Hủy", command=win.destroy).pack(side=tk.RIGHT, padx=(0, 8))

