import os
import re
import json
import difflib
from collections import Counter
import urllib.request
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

from app.paths import BASE_DIR
from app.ui.update_dialog import fetch_manifest_from_url


class JunkRemoverMixin:
    """Tách riêng chức năng Xóa rác khỏi RenameTabMixin."""

    def _open_junk_remover(self, source_label=None, folder_path=None, file_path=None):
        """Mở dialog công cụ xóa rác (độc lập tab Đổi tên)."""
        dialog = tk.Toplevel(self)
        dialog.title("Công cụ Xóa Rác")
        dialog.geometry("900x700")
        try:
            if hasattr(self, "_apply_window_icon"):
                self._apply_window_icon(dialog)
        except Exception:
            pass

        scope_var = tk.StringVar(value="folder")
        exact_mode_var = tk.StringVar(value="string")
        regex_mode_var = tk.StringVar(value="string")
        priority_var = tk.StringVar(value="exact_first")
        folder_var = tk.StringVar(value=folder_path or "")
        file_var = tk.StringVar(value=file_path or "")
        files_info_var = tk.StringVar(value="")

        if file_path:
            scope_var.set("file")
        elif folder_path:
            scope_var.set("folder")

        header_frame = ttk.Frame(dialog, padding=(10, 10, 10, 0))
        header_frame.pack(fill=tk.X)
        if source_label:
            ttk.Label(header_frame, text=f"Nguồn gọi: {source_label}").pack(anchor="w")

        source_frame = ttk.LabelFrame(dialog, text="Nguồn dữ liệu", padding=10)
        source_frame.pack(fill=tk.X, padx=10, pady=(4, 2))
        source_frame.columnconfigure(1, weight=1)

        ttk.Label(source_frame, text="Phạm vi:").grid(row=0, column=0, sticky="w", padx=5)
        scope_opts_frame = ttk.Frame(source_frame)
        scope_opts_frame.grid(row=0, column=1, columnspan=2, sticky="w")
        ttk.Radiobutton(scope_opts_frame, text="Thư mục (quét .txt)", variable=scope_var, value="folder").pack(side=tk.LEFT, padx=(0, 10))
        ttk.Radiobutton(scope_opts_frame, text="Một file cụ thể", variable=scope_var, value="file").pack(side=tk.LEFT)

        folder_label = ttk.Label(source_frame, text="Thư mục:")
        folder_label.grid(row=1, column=0, sticky="w", padx=5, pady=(6, 0))
        folder_entry = ttk.Entry(source_frame, textvariable=folder_var)
        folder_entry.grid(row=1, column=1, sticky="we", padx=5, pady=(6, 0))
        folder_btn = ttk.Button(source_frame, text="Chọn...", command=lambda: self._pick_junk_folder(folder_var))
        folder_btn.grid(row=1, column=2, padx=5, pady=(6, 0))

        file_label = ttk.Label(source_frame, text="File:")
        file_label.grid(row=2, column=0, sticky="w", padx=5, pady=(6, 0))
        file_entry = ttk.Entry(source_frame, textvariable=file_var)
        file_entry.grid(row=2, column=1, sticky="we", padx=5, pady=(6, 0))
        file_btn = ttk.Button(source_frame, text="Chọn...", command=lambda: self._pick_junk_file(file_var))
        file_btn.grid(row=2, column=2, padx=5, pady=(6, 0))

        ttk.Label(source_frame, textvariable=files_info_var, foreground="#555").grid(row=3, column=0, columnspan=3, sticky="w", padx=5, pady=(6, 0))

        opts_frame = ttk.LabelFrame(dialog, text="Tùy chọn xóa", padding=10)
        opts_frame.pack(fill=tk.X, padx=10, pady=2)

        ttk.Label(opts_frame, text="Exact mode:").grid(row=0, column=0, sticky="w", padx=5)
        ttk.Radiobutton(opts_frame, text="Xóa chuỗi", variable=exact_mode_var, value="string").grid(row=0, column=1, sticky="w")
        ttk.Radiobutton(opts_frame, text="Xóa cả dòng", variable=exact_mode_var, value="line").grid(row=0, column=2, sticky="w", padx=(0, 12))

        ttk.Label(opts_frame, text="Regex mode:").grid(row=0, column=3, sticky="w", padx=5)
        ttk.Radiobutton(opts_frame, text="Xóa chuỗi", variable=regex_mode_var, value="string").grid(row=0, column=4, sticky="w")
        ttk.Radiobutton(opts_frame, text="Xóa cả dòng", variable=regex_mode_var, value="line").grid(row=0, column=5, sticky="w")
        ttk.Label(opts_frame, text="Ưu tiên:").grid(row=0, column=6, sticky="w", padx=(16, 5))
        ttk.Radiobutton(opts_frame, text="Exact trước", variable=priority_var, value="exact_first").grid(row=0, column=7, sticky="w")
        ttk.Radiobutton(opts_frame, text="Regex trước", variable=priority_var, value="regex_first").grid(row=0, column=8, sticky="w")

        pat_frame = ttk.LabelFrame(dialog, text="Pattern xóa rác", padding=10)
        pat_frame.pack(fill=tk.X, expand=False, padx=10, pady=2)
        pat_frame.columnconfigure(0, weight=1)
        pat_frame.columnconfigure(1, weight=1)

        exact_frame = ttk.LabelFrame(pat_frame, text="Chính xác (Exact)", padding=8)
        exact_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 4))
        exact_frame.columnconfigure(0, weight=1)
        ttk.Label(exact_frame, text="Mỗi dòng là 1 cụm text cần xóa.").grid(row=0, column=0, sticky="w", pady=(0, 4))
        exact_pattern_text = tk.Text(exact_frame, height=5)
        exact_pattern_text.grid(row=1, column=0, sticky="nsew")

        regex_frame = ttk.LabelFrame(pat_frame, text="Regex", padding=8)
        regex_frame.grid(row=0, column=1, sticky="nsew", padx=(4, 0))
        regex_frame.columnconfigure(0, weight=1)
        ttk.Label(regex_frame, text="Mỗi dòng là 1 regex pattern.").grid(row=0, column=0, sticky="w", pady=(0, 4))
        regex_pattern_text = tk.Text(regex_frame, height=5)
        regex_pattern_text.grid(row=1, column=0, sticky="nsew")

        saved_bundle = self._load_junk_pattern_bundle()
        if saved_bundle.get("exact"):
            exact_pattern_text.insert("1.0", "\n".join(saved_bundle["exact"]))
        if saved_bundle.get("regex"):
            regex_pattern_text.insert("1.0", "\n".join(saved_bundle["regex"]))

        warning_lbl = ttk.Label(dialog, text="", foreground="red", wraplength=550)

        action_frame = ttk.Frame(dialog, padding=(10, 0, 10, 0))
        action_frame.pack(fill=tk.X, pady=(0, 0))

        preview_frame = ttk.LabelFrame(dialog, text="Xem trước Diff", padding=10)
        preview_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=(2, 4))
        preview_frame.columnconfigure(1, weight=1)
        preview_frame.rowconfigure(1, weight=1)

        preview_toolbar = ttk.Frame(preview_frame)
        preview_toolbar.grid(row=0, column=0, columnspan=2, sticky="ew", pady=(0, 6))
        preview_status_var = tk.StringVar(value="Chưa tạo preview.")
        show_all_blocks_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(preview_toolbar, text="Hiện đầy đủ các khu vực", variable=show_all_blocks_var).pack(side=tk.LEFT)
        ttk.Label(preview_toolbar, textvariable=preview_status_var).pack(side=tk.RIGHT)

        preview_tree = ttk.Treeview(
            preview_frame,
            columns=("file", "deleted", "blocks"),
            show="headings",
            height=10,
        )
        preview_tree.heading("file", text="File")
        preview_tree.heading("deleted", text="Dòng xóa")
        preview_tree.heading("blocks", text="Khu vực đổi")
        preview_tree.column("file", width=280, anchor="w")
        preview_tree.column("deleted", width=90, anchor="center")
        preview_tree.column("blocks", width=90, anchor="center")
        preview_tree.grid(row=1, column=0, sticky="nsw")

        preview_text = tk.Text(preview_frame, wrap=tk.NONE)
        preview_text.grid(row=1, column=1, sticky="nsew")
        preview_text.tag_configure("removed", foreground="#b71c1c")
        preview_text.tag_configure("added", foreground="#1b5e20")
        preview_text.tag_configure("muted", foreground="#666666")
        preview_text.tag_configure("title", foreground="#0b5394")
        preview_vsb = ttk.Scrollbar(preview_frame, orient="vertical", command=preview_text.yview)
        preview_vsb.grid(row=1, column=2, sticky="ns")
        preview_hsb = ttk.Scrollbar(preview_frame, orient="horizontal", command=preview_text.xview)
        preview_hsb.grid(row=2, column=1, sticky="ew")
        preview_text.configure(yscrollcommand=preview_vsb.set, xscrollcommand=preview_hsb.set)

        def update_warning(*args):
            warning_text = ""
            if regex_mode_var.get() == "line":
                warning_text = "⚠️ Cẩn thận: Regex + Xóa cả dòng có thể xóa nhầm nếu pattern quá rộng. Hãy xem trước Diff trước khi thực hiện."
            if warning_text:
                warning_lbl.config(text=warning_text)
                if not warning_lbl.winfo_ismapped():
                    warning_lbl.pack(fill=tk.X, padx=10, pady=(0, 2))
            else:
                warning_lbl.config(text="")
                if warning_lbl.winfo_ismapped():
                    warning_lbl.pack_forget()

        exact_mode_var.trace_add("write", update_warning)
        regex_mode_var.trace_add("write", update_warning)
        update_warning()

        preview_cache = {}
        current_preview = {"path": None}
        skipped_changes = {}

        def _block_key(block):
            return f"{block.get('op_i1', 0)}:{block.get('op_i2', 0)}:{block.get('op_j1', 0)}:{block.get('op_j2', 0)}"

        def _sync_scope_rows():
            is_folder = (scope_var.get() == "folder")
            if is_folder:
                folder_label.grid()
                folder_entry.grid()
                folder_btn.grid()
                file_label.grid_remove()
                file_entry.grid_remove()
                file_btn.grid_remove()
            else:
                folder_label.grid_remove()
                folder_entry.grid_remove()
                folder_btn.grid_remove()
                file_label.grid()
                file_entry.grid()
                file_btn.grid()

        def _update_source_info(*_args):
            _sync_scope_rows()
            if scope_var.get() == "folder":
                folder = folder_var.get().strip()
                if os.path.isdir(folder):
                    files = self._list_txt_files(folder)
                    files_info_var.set(f"Phát hiện {len(files)} file .txt trong thư mục.")
                else:
                    files_info_var.set("Chưa chọn thư mục hợp lệ.")
            else:
                fpath = file_var.get().strip()
                if os.path.isfile(fpath):
                    files_info_var.set("Đã chọn 1 file.")
                else:
                    files_info_var.set("Chưa chọn file hợp lệ.")

        def _resolve_target_files():
            if scope_var.get() == "folder":
                folder = folder_var.get().strip()
                if os.path.isdir(folder):
                    return self._list_txt_files(folder)
                return []
            fpath = file_var.get().strip()
            if os.path.isfile(fpath):
                return [fpath]
            return []

        def _render_preview(path):
            preview_text.config(state=tk.NORMAL)
            preview_text.delete("1.0", tk.END)
            data = preview_cache.get(path)
            if not data:
                preview_text.insert(tk.END, "Không có dữ liệu preview.", "muted")
                preview_text.config(state=tk.DISABLED)
                return
            blocks = data["blocks"]
            if not show_all_blocks_var.get():
                blocks = self._pick_representative_blocks(data["blocks"], limit=2)
            skipped_set = skipped_changes.get(path, set())
            preview_text.insert(
                tk.END,
                f"{os.path.basename(path)}\nDòng bị xóa: {data['deleted_lines']} | Khu vực thay đổi: {data['block_count']}\n\n",
                "title",
            )
            if not blocks:
                preview_text.insert(tk.END, "Không có thay đổi.\n", "muted")
            for idx, block in enumerate(blocks, start=1):
                bkey = _block_key(block)
                is_skipped = bkey in skipped_set
                preview_text.insert(
                    tk.END,
                    f"Khu vực {idx} (dòng {block['line_start']}-{block['line_end']}): ",
                    "muted",
                )
                def _toggle_skip(_path=path, _bkey=bkey):
                    cur = skipped_changes.setdefault(_path, set())
                    if _bkey in cur:
                        cur.remove(_bkey)
                        if not cur:
                            skipped_changes.pop(_path, None)
                    else:
                        cur.add(_bkey)
                    _render_preview(_path)

                btn_text = "Hoàn tác bỏ qua" if is_skipped else "Bỏ thay đổi dòng này"
                btn = ttk.Button(preview_text, text=btn_text, command=_toggle_skip)
                preview_text.window_create(tk.END, window=btn)
                preview_text.insert(tk.END, "\n")
                if is_skipped:
                    preview_text.insert(tk.END, "  [Đã đánh dấu bỏ qua khi thực thi]\n", "muted")
                for line in block["context_before"]:
                    preview_text.insert(tk.END, f"  {line}\n")
                for line in block["removed"]:
                    preview_text.insert(tk.END, f"- {line}\n", "removed")
                for line in block.get("added", []):
                    if not str(line).strip():
                        continue
                    preview_text.insert(tk.END, f"+ {line}\n", "added")
                for line in block["context_after"]:
                    preview_text.insert(tk.END, f"  {line}\n")
                preview_text.insert(tk.END, "...\n", "muted")
            hidden = data["block_count"] - len(blocks)
            if hidden > 0:
                preview_text.insert(tk.END, f"\n... còn {hidden} khu vực tương tự (bật 'Hiện đầy đủ các khu vực' để xem).\n", "muted")
            preview_text.config(state=tk.DISABLED)

        def _refresh_preview_list():
            preview_tree.delete(*preview_tree.get_children())
            for old_path in list(skipped_changes.keys()):
                if old_path not in preview_cache:
                    skipped_changes.pop(old_path, None)
            for p, info in preview_cache.items():
                iid = p
                preview_tree.insert(
                    "",
                    tk.END,
                    iid=iid,
                    values=(os.path.basename(p), info["deleted_lines"], info["block_count"]),
                )
            if preview_tree.get_children():
                if current_preview["path"] in preview_tree.get_children():
                    preview_tree.selection_set(current_preview["path"])
                else:
                    first = preview_tree.get_children()[0]
                    preview_tree.selection_set(first)
                    current_preview["path"] = first
                _render_preview(current_preview["path"])
            else:
                preview_text.config(state=tk.NORMAL)
                preview_text.delete("1.0", tk.END)
                preview_text.insert(tk.END, "Không có thay đổi để hiển thị.", "muted")
                preview_text.config(state=tk.DISABLED)

        def _collect_patterns():
            exact_patterns = [p.strip() for p in exact_pattern_text.get("1.0", tk.END).splitlines() if p.strip()]
            regex_patterns = [p.strip() for p in regex_pattern_text.get("1.0", tk.END).splitlines() if p.strip()]
            return exact_patterns, regex_patterns

        def _build_preview():
            exact_patterns, regex_patterns = _collect_patterns()
            if not exact_patterns and not regex_patterns:
                messagebox.showwarning("Cảnh báo", "Vui lòng nhập ít nhất một pattern (Exact hoặc Regex)!", parent=dialog)
                return None, None
            target_files = _resolve_target_files()
            if not target_files:
                messagebox.showwarning("Cảnh báo", "Không tìm thấy file để xử lý!", parent=dialog)
                return None, None
            new_cache = {}
            changed = 0
            for fpath in target_files:
                try:
                    before = self._read_text_file(fpath)
                    after, _ = self._apply_combined_patterns_to_text(
                        before,
                        exact_patterns,
                        exact_mode_var.get(),
                        regex_patterns,
                        regex_mode_var.get(),
                        priority_var.get(),
                    )
                    if before == after:
                        continue
                    blocks, deleted_lines = self._extract_diff_blocks(before, after, context_lines=2)
                    new_cache[fpath] = {
                        "blocks": blocks,
                        "deleted_lines": deleted_lines,
                        "block_count": len(blocks),
                        "before": before,
                        "after": after,
                    }
                    changed += 1
                except Exception as e:
                    print(f"Preview error {fpath}: {e}")
            return new_cache, len(target_files)

        def on_preview():
            result = _build_preview()
            if not result:
                return
            new_cache, total = result
            if new_cache is None:
                return
            preview_cache.clear()
            preview_cache.update(new_cache)
            preview_status_var.set(f"Đã preview {len(preview_cache)}/{total} file có thay đổi.")
            _refresh_preview_list()

        def on_ai_suggest():
            target_files = _resolve_target_files()
            if not target_files:
                messagebox.showwarning("Cảnh báo", "Không tìm thấy file để gợi ý.", parent=dialog)
                return
            suggestions = self._suggest_junk_patterns_ai(target_files)
            if not suggestions:
                messagebox.showinfo("Gợi ý AI", "Không tìm thấy pattern phù hợp từ dữ liệu huấn luyện.", parent=dialog)
                return
            self._open_junk_ai_picker(
                dialog,
                suggestions,
                exact_pattern_text,
                regex_pattern_text,
                exact_mode_var,
                regex_mode_var,
            )

        def on_apply():
            exact_patterns, regex_patterns = _collect_patterns()
            if not exact_patterns and not regex_patterns:
                messagebox.showwarning("Cảnh báo", "Vui lòng nhập ít nhất một pattern (Exact hoặc Regex)!", parent=dialog)
                return

            self._save_junk_pattern_bundle(exact_patterns, regex_patterns)

            target_files = _resolve_target_files()

            if not target_files:
                messagebox.showwarning("Cảnh báo", "Không tìm thấy file để xử lý!", parent=dialog)
                return

            msg = (
                f"Sẽ quét {len(target_files)} file.\n"
                f"Exact: {len(exact_patterns)} mẫu (mode={exact_mode_var.get()})\n"
                f"Regex: {len(regex_patterns)} mẫu (mode={regex_mode_var.get()})\n"
                f"Ưu tiên: {'Exact trước' if priority_var.get() == 'exact_first' else 'Regex trước'}\n\n"
                "TIẾN HÀNH?"
            )
            if not messagebox.askyesno("Xác nhận", msg, parent=dialog):
                return

            result = _build_preview()
            if not result:
                return
            new_cache, total = result
            if new_cache is None:
                return
            preview_cache.clear()
            preview_cache.update(new_cache)
            preview_status_var.set(f"Đã preview {len(preview_cache)}/{total} file có thay đổi.")
            _refresh_preview_list()

            count_files = 0
            count_matches = 0
            skipped_blocks = 0
            for file_path, info in preview_cache.items():
                before = info.get("before", "")
                after = info.get("after", "")
                skip_keys = skipped_changes.get(file_path, set())
                if skip_keys:
                    skipped_blocks += len(skip_keys)
                    merged = self._merge_preview_with_skips(before, after, skip_keys)
                else:
                    merged = after
                if merged != before:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(merged)
                    count_files += 1
                    _blocks, deleted_lines = self._extract_diff_blocks(before, merged, context_lines=2)
                    count_matches += deleted_lines

            messagebox.showinfo(
                "Hoàn tất",
                f"Đã xử lý {count_files} file.\nXóa thành công {count_matches} vị trí/dòng.\nBỏ qua {skipped_blocks} khu vực theo lựa chọn.",
                parent=dialog,
            )
            self.log(f"Xóa rác: {count_matches} matches trong {count_files} files. Bỏ qua {skipped_blocks} khu vực.")

        ttk.Button(action_frame, text="Đóng", command=dialog.destroy).pack(side=tk.RIGHT)
        ttk.Button(action_frame, text="Thực hiện", command=on_apply).pack(side=tk.RIGHT, padx=(0, 6))
        ttk.Button(action_frame, text="Xem trước Diff", command=on_preview).pack(side=tk.RIGHT, padx=(0, 6))
        ttk.Button(action_frame, text="Gợi ý AI", command=on_ai_suggest).pack(side=tk.RIGHT, padx=(0, 6))

        def _on_preview_select(_event=None):
            sel = preview_tree.selection()
            if not sel:
                return
            current_preview["path"] = sel[0]
            _render_preview(current_preview["path"])

        preview_tree.bind("<<TreeviewSelect>>", _on_preview_select)
        show_all_blocks_var.trace_add("write", lambda *_: _render_preview(current_preview["path"]) if current_preview["path"] else None)

        scope_var.trace_add("write", _update_source_info)
        folder_var.trace_add("write", _update_source_info)
        file_var.trace_add("write", _update_source_info)
        _update_source_info()

    def _remove_junk_from_files_combined(self, files, exact_patterns, exact_mode, regex_patterns, regex_mode, priority_order="exact_first"):
        """Xóa rác theo hai nhánh Exact/Regex độc lập trong cùng một lượt chạy."""
        count_files = 0
        total_matches = 0

        for file_path in files:
            if not os.path.exists(file_path):
                continue
            try:
                content = self._read_text_file(file_path)
                original_content = content
                content, matches_in_file = self._apply_combined_patterns_to_text(
                    content,
                    exact_patterns,
                    exact_mode,
                    regex_patterns,
                    regex_mode,
                    priority_order,
                )

                if content != original_content:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(content)
                    count_files += 1
                    total_matches += matches_in_file
            except Exception as e:
                print(f"Error processing file {file_path}: {e}")
        return count_files, total_matches

    def _apply_combined_patterns_to_text(self, content: str, exact_patterns: list, exact_mode: str, regex_patterns: list, regex_mode: str, priority_order="exact_first"):
        """Áp dụng 2 nhóm pattern độc lập theo thứ tự ưu tiên để giảm xung đột."""
        matches_total = 0
        if priority_order == "regex_first":
            if regex_patterns:
                content, m = self._apply_junk_patterns_to_text(content, regex_patterns, regex_mode, True)
                matches_total += m
            if exact_patterns:
                content, m = self._apply_junk_patterns_to_text(content, exact_patterns, exact_mode, False)
                matches_total += m
        else:
            if exact_patterns:
                content, m = self._apply_junk_patterns_to_text(content, exact_patterns, exact_mode, False)
                matches_total += m
            if regex_patterns:
                content, m = self._apply_junk_patterns_to_text(content, regex_patterns, regex_mode, True)
                matches_total += m
        return content, matches_total

    def _merge_preview_with_skips(self, before_text: str, after_text: str, skip_keys: set):
        """Ghép lại kết quả cuối cùng từ preview, giữ nguyên các khu vực user đánh dấu bỏ qua."""
        if not skip_keys:
            return after_text
        before_lines = before_text.splitlines(keepends=True)
        after_lines = after_text.splitlines(keepends=True)
        matcher = difflib.SequenceMatcher(a=before_lines, b=after_lines)
        out = []
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag in ("replace", "delete"):
                key = f"{i1}:{i2}:{j1}:{j2}"
                if key in skip_keys:
                    out.extend(before_lines[i1:i2])
                else:
                    out.extend(after_lines[j1:j2])
            elif tag == "insert":
                out.extend(after_lines[j1:j2])
            else:
                out.extend(before_lines[i1:i2])
        return "".join(out)

    def _apply_junk_patterns_to_text(self, content: str, patterns: list, mode: str, use_regex: bool):
        matches_in_file = 0
        for pattern in patterns:
            if not pattern:
                continue
            if use_regex:
                try:
                    if mode == "line":
                        regex = f"(?m)^.*{pattern}.*$\\n?"
                        matches = len(re.findall(regex, content))
                        content = re.sub(regex, "", content)
                        matches_in_file += matches
                    else:
                        matches = len(re.findall(pattern, content))
                        content = re.sub(pattern, "", content)
                        matches_in_file += matches
                except re.error as e:
                    print(f"Regex error: {e}")
            else:
                if mode == "line":
                    lines = content.splitlines(keepends=True)
                    new_lines = []
                    for line in lines:
                        if pattern in line:
                            matches_in_file += 1
                        else:
                            new_lines.append(line)
                    content = "".join(new_lines)
                else:
                    matches = content.count(pattern)
                    if matches > 0:
                        content = content.replace(pattern, "")
                        matches_in_file += matches
        return content, matches_in_file

    def _extract_diff_blocks(self, before_text: str, after_text: str, context_lines=2):
        before_lines = before_text.splitlines()
        after_lines = after_text.splitlines()
        matcher = difflib.SequenceMatcher(a=before_lines, b=after_lines)
        blocks = []
        deleted_total = 0

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag not in ("delete", "replace"):
                continue
            removed = before_lines[i1:i2]
            added = after_lines[j1:j2] if tag == "replace" else []
            added = [line for line in added if str(line).strip()]
            if not removed:
                continue
            deleted_total += len(removed)
            ctx_before_start = max(0, i1 - context_lines)
            ctx_after_end = min(len(after_lines), j2 + context_lines)
            blocks.append(
                {
                    "line_start": i1 + 1,
                    "line_end": i2,
                    "op_i1": i1,
                    "op_i2": i2,
                    "op_j1": j1,
                    "op_j2": j2,
                    "context_before": before_lines[ctx_before_start:i1],
                    "removed": removed,
                    "added": added,
                    "context_after": after_lines[j2:ctx_after_end],
                }
            )
        return blocks, deleted_total

    def _pick_representative_blocks(self, blocks: list, limit=2):
        if len(blocks) <= limit:
            return blocks
        selected = []
        seen_signatures = set()
        for block in blocks:
            signature = (
                "REM::" + "\n".join(block["removed"][:3]).strip()
                + "||ADD::" + "\n".join(block.get("added", [])[:3]).strip()
            )
            if signature in seen_signatures:
                continue
            seen_signatures.add(signature)
            selected.append(block)
            if len(selected) >= limit:
                break
        if not selected:
            return blocks[:limit]
        return selected

    def _junk_dataset_manifest_meta(self):
        data = {}
        use_local_only = bool(getattr(self, "use_local_manifest_only", False))
        if not use_local_only:
            manifest_url = getattr(self, "VERSION_CHECK_URL", "")
            if manifest_url:
                try:
                    data = fetch_manifest_from_url(manifest_url, timeout=10) or {}
                except Exception:
                    data = {}
        if not data:
            meta_path = os.path.join(BASE_DIR, "version.json")
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                data = {}
        if not isinstance(data, dict):
            return {}
        # Ưu tiên schema mới: junk_dataset.url
        meta = data.get("junk_dataset")
        if isinstance(meta, dict):
            return meta
        # Backward compatibility: junk_ai_dataset
        legacy = data.get("junk_ai_dataset")
        if isinstance(legacy, dict):
            return legacy
        legacy_url = data.get("junk_dataset_url")
        if isinstance(legacy_url, str) and legacy_url.strip():
            return {"url": legacy_url.strip()}
        return {}

    def _junk_dataset_cache_path(self):
        return os.path.join(BASE_DIR, "local", "junk_dataset_cache.json")

    def _junk_dataset_builtin_path(self):
        return os.path.join(BASE_DIR, "junk_dataset.json")

    def _extract_junk_dataset_urls(self, meta: dict):
        urls = []
        direct = meta.get("url") if isinstance(meta, dict) else None
        primary = meta.get("primary_url") if isinstance(meta, dict) else None
        backup = meta.get("backup_url") if isinstance(meta, dict) else None
        url_list = meta.get("urls") if isinstance(meta, dict) else None
        if isinstance(direct, str) and direct.strip():
            urls.append(direct.strip())
        if isinstance(primary, str) and primary.strip():
            urls.append(primary.strip())
        if isinstance(backup, str) and backup.strip():
            urls.append(backup.strip())
        if isinstance(url_list, list):
            for u in url_list:
                if isinstance(u, str) and u.strip():
                    urls.append(u.strip())
        dedup = []
        for u in urls:
            if u not in dedup:
                dedup.append(u)
        return dedup

    def _fetch_json_from_url(self, url: str, timeout=10):
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
        return json.loads(raw)

    def _is_valid_junk_dataset(self, data):
        if not isinstance(data, dict):
            return False
        if not isinstance(data.get("exact_patterns", []), list):
            return False
        if not isinstance(data.get("regex_patterns", []), list):
            return False
        if not isinstance(data.get("training_sets", []), list):
            return False
        return True

    def _junk_dataset_version_key(self, data):
        if not isinstance(data, dict):
            return (0, 0, 0)
        version = str(data.get("version", "")).strip()
        if not version:
            return (0, 0, 0)
        parts = re.findall(r"\d+", version)
        nums = [int(p) for p in parts[:3]]
        while len(nums) < 3:
            nums.append(0)
        return tuple(nums[:3])

    def _load_junk_dataset(self):
        if hasattr(self, "_junk_dataset_cache_obj"):
            return self._junk_dataset_cache_obj or {}
        meta = self._junk_dataset_manifest_meta()
        urls = self._extract_junk_dataset_urls(meta)
        cache_path = self._junk_dataset_cache_path()
        candidates = []

        def _push_candidate(data, source_name):
            if self._is_valid_junk_dataset(data):
                candidates.append((self._junk_dataset_version_key(data), source_name, data))

        use_local_only = bool(getattr(self, "use_local_manifest_only", False))
        if not use_local_only:
            for url in urls:
                try:
                    data = self._fetch_json_from_url(url, timeout=10)
                    _push_candidate(data, "url")
                except Exception:
                    continue

        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            _push_candidate(data, "cache")
        except Exception:
            pass

        builtin_path = self._junk_dataset_builtin_path()
        try:
            with open(builtin_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            _push_candidate(data, "builtin")
        except Exception:
            pass

        dataset = {}
        source = ""
        if candidates:
            candidates.sort(key=lambda x: x[0], reverse=True)
            _ver, source, dataset = candidates[0]

        if dataset:
            try:
                os.makedirs(os.path.dirname(cache_path), exist_ok=True)
                with open(cache_path, "w", encoding="utf-8") as f:
                    json.dump(dataset, f, ensure_ascii=False, indent=2)
            except Exception:
                pass
            if source == "url":
                self.log("[Xóa rác][AI] Đã tải dataset từ URL manifest.")
            elif source == "cache":
                self.log("[Xóa rác][AI] Dùng dataset cache local.")
            elif source == "builtin":
                self.log("[Xóa rác][AI] Dùng dataset local mặc định.")

        self._junk_dataset_cache_obj = dataset or {}
        return self._junk_dataset_cache_obj

    def _multiset_diff_lines(self, raw_lines, clean_lines):
        raw_counter = Counter(raw_lines)
        clean_counter = Counter(clean_lines)
        removed_counter = raw_counter - clean_counter
        output = []
        for line, count in removed_counter.items():
            output.extend([line] * count)
        return output

    def _evaluate_line_pattern_on_training(self, pattern, use_regex, training_sets):
        total_tp = 0
        total_fp = 0
        total_fn = 0
        for ds in training_sets:
            removed_lines = [x for x in ds.get("removed_lines", []) if isinstance(x, str)]
            kept_lines = [x for x in ds.get("kept_lines", []) if isinstance(x, str)]
            if not removed_lines and not kept_lines:
                continue
            pred_removed = []
            for line in removed_lines:
                if use_regex:
                    try:
                        if re.search(pattern, line):
                            pred_removed.append(line)
                    except re.error:
                        return None
                else:
                    if pattern in line:
                        pred_removed.append(line)

            tp = len(pred_removed)
            fn = max(0, len(removed_lines) - tp)
            fp = 0
            for line in kept_lines:
                if use_regex:
                    try:
                        if re.search(pattern, line):
                            fp += 1
                    except re.error:
                        return None
                else:
                    if pattern in line:
                        fp += 1
            total_tp += tp
            total_fp += fp
            total_fn += fn
        precision = total_tp / (total_tp + total_fp) if (total_tp + total_fp) else 0.0
        recall = total_tp / (total_tp + total_fn) if (total_tp + total_fn) else 0.0
        if precision + recall == 0:
            f1 = 0.0
        else:
            f1 = 2 * precision * recall / (precision + recall)
        return {"precision": precision, "recall": recall, "f1": f1}

    def _count_pattern_coverage(self, pattern, use_regex, target_files):
        hit_lines = 0
        hit_files = 0
        for fpath in target_files:
            try:
                lines = self._read_text_file(fpath).splitlines()
            except Exception:
                continue
            file_hits = 0
            for line in lines:
                if use_regex:
                    try:
                        if re.search(pattern, line):
                            file_hits += 1
                    except re.error:
                        return 0, 0
                else:
                    if pattern in line:
                        file_hits += 1
            if file_hits > 0:
                hit_files += 1
                hit_lines += file_hits
        return hit_lines, hit_files

    def _estimate_damage_risk(self, pattern, use_regex, precision, hit_lines, hit_files, total_files):
        # Base risk: càng nhiều false positive trong training thì càng rủi ro
        fp_risk = 1.0 - max(0.0, min(1.0, precision))

        # Pattern quá ngắn hoặc regex quá rộng dễ xóa nhầm
        pattern_len = len(pattern.strip())
        short_risk = 1.0 if pattern_len <= 2 else (0.7 if pattern_len <= 4 else 0.0)
        broad_regex_risk = 0.0
        if use_regex:
            if ".*" in pattern or ".+" in pattern:
                broad_regex_risk += 0.35
            if pattern.startswith("^") and pattern.endswith("$"):
                broad_regex_risk -= 0.10
            broad_regex_risk = max(0.0, min(1.0, broad_regex_risk))

        # Nếu pattern match quá nhiều dòng trong target thì cần cảnh giác
        file_ratio = (hit_files / total_files) if total_files > 0 else 0.0
        line_pressure = min(1.0, hit_lines / 120.0)
        spread_risk = min(1.0, 0.25 * file_ratio + 0.75 * line_pressure)

        risk = (
            0.45 * fp_risk
            + 0.20 * max(short_risk, broad_regex_risk)
            + 0.35 * spread_risk
        )
        return max(0.0, min(1.0, risk))

    def _suggest_junk_patterns_ai(self, target_files):
        dataset = self._load_junk_dataset()
        if not dataset:
            return []
        training_sets = dataset.get("training_sets", [])
        if not training_sets:
            return []

        ai_cfg = dataset.get("ai_config", {}) if isinstance(dataset.get("ai_config", {}), dict) else {}
        min_exact_len = ai_cfg.get("min_exact_pattern_length", 4)
        try:
            min_exact_len = int(min_exact_len)
        except Exception:
            min_exact_len = 4
        if min_exact_len < 1:
            min_exact_len = 1

        guard_raw = ai_cfg.get("short_keyword_guard", [])
        if isinstance(guard_raw, list):
            short_keyword_guard = {
                str(x).strip()
                for x in guard_raw
                if str(x).strip()
            }
        else:
            short_keyword_guard = set()

        exact_candidates = []
        for line in dataset.get("exact_patterns", []):
            if not isinstance(line, str):
                continue
            pattern = line.strip()
            if len(pattern) < min_exact_len:
                continue
            if pattern in short_keyword_guard:
                continue
            if re.fullmatch(r"[A-Za-z0-9\u4e00-\u9fff]{1,6}", pattern):
                continue
            exact_candidates.append({"pattern": pattern, "use_regex": False})

        regex_candidates = []
        for pat in dataset.get("regex_patterns", []):
            if isinstance(pat, str) and pat.strip():
                regex_candidates.append({"pattern": pat.strip(), "use_regex": True})

        candidates = regex_candidates + exact_candidates
        scored = []
        for cand in candidates:
            metric = self._evaluate_line_pattern_on_training(cand["pattern"], cand["use_regex"], training_sets)
            if not metric:
                continue
            if metric["f1"] <= 0:
                continue
            hit_lines, hit_files = self._count_pattern_coverage(cand["pattern"], cand["use_regex"], target_files)
            if hit_lines <= 0:
                continue
            damage_risk = self._estimate_damage_risk(
                cand["pattern"],
                cand["use_regex"],
                metric["precision"],
                hit_lines,
                hit_files,
                len(target_files),
            )
            coverage_score = min(1.0, hit_lines / 80.0)
            avg_hit_lines = hit_lines / max(1, hit_files)
            over_hit_penalty = min(0.55, max(0.0, (avg_hit_lines - 120.0) / 260.0))
            # Ưu tiên regex nhẹ, nhưng trừ mạnh nếu pattern match quá rộng.
            type_bonus = 0.03 if cand["use_regex"] else 0.0
            final_score = (
                0.68 * metric["f1"]
                + 0.20 * coverage_score
                + 0.12 * (1.0 - damage_risk)
                + type_bonus
                - over_hit_penalty
            )
            scored.append(
                {
                    "pattern": cand["pattern"],
                    "type": "regex" if cand["use_regex"] else "exact",
                    "precision": metric["precision"],
                    "recall": metric["recall"],
                    "f1": metric["f1"],
                    "target_hit_lines": hit_lines,
                    "target_hit_files": hit_files,
                    "score": final_score,
                    "damage_risk": damage_risk,
                }
            )
        scored.sort(key=lambda x: x["score"], reverse=True)

        unique = []
        seen = set()
        for item in scored:
            key = (item["pattern"], item["type"])
            if key in seen:
                continue
            seen.add(key)
            unique.append(item)
            if len(unique) >= 20:
                break
        return unique

    def _open_junk_ai_picker(self, parent_dialog, suggestions, exact_pattern_text, regex_pattern_text, exact_mode_var, regex_mode_var):
        win = tk.Toplevel(parent_dialog)
        win.title("Gợi ý Xóa rác (AI local)")
        win.geometry("980x520")
        win.transient(parent_dialog)
        win.grab_set()
        try:
            if hasattr(self, "_apply_window_icon"):
                self._apply_window_icon(win)
        except Exception:
            pass

        ttk.Label(
            win,
            text="Chọn pattern gợi ý (đã chấm trên dataset JSON). Có thể chọn nhiều dòng.",
        ).pack(anchor="w", padx=10, pady=(10, 6))

        list_frame = ttk.Frame(win)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 10))
        list_frame.columnconfigure(0, weight=1)
        list_frame.rowconfigure(0, weight=1)

        cols = ("type", "pattern", "f1", "precision", "recall", "target_lines", "target_files", "damage_risk", "score")
        tree = ttk.Treeview(list_frame, columns=cols, show="headings", selectmode="extended")
        tree.heading("type", text="Loại")
        tree.heading("pattern", text="Pattern")
        tree.heading("f1", text="F1 train")
        tree.heading("precision", text="P")
        tree.heading("recall", text="R")
        tree.heading("target_lines", text="Hit dòng")
        tree.heading("target_files", text="Hit file")
        tree.heading("damage_risk", text="Damage risk")
        tree.heading("score", text="Score")
        tree.column("type", width=70, anchor="center")
        tree.column("pattern", width=460, anchor="w")
        tree.column("f1", width=70, anchor="center")
        tree.column("precision", width=60, anchor="center")
        tree.column("recall", width=60, anchor="center")
        tree.column("target_lines", width=70, anchor="center")
        tree.column("target_files", width=70, anchor="center")
        tree.column("damage_risk", width=90, anchor="center")
        tree.column("score", width=70, anchor="center")
        tree.grid(row=0, column=0, sticky="nsew")

        vsb = ttk.Scrollbar(list_frame, orient="vertical", command=tree.yview)
        vsb.grid(row=0, column=1, sticky="ns")
        tree.configure(yscrollcommand=vsb.set)

        for idx, item in enumerate(suggestions):
            tree.insert(
                "",
                tk.END,
                iid=str(idx),
                values=(
                    item["type"],
                    item["pattern"],
                    f"{item['f1']:.2f}",
                    f"{item['precision']:.2f}",
                    f"{item['recall']:.2f}",
                    item["target_hit_lines"],
                    item["target_hit_files"],
                    f"{item['damage_risk'] * 100:.0f}%",
                    f"{item['score']:.2f}",
                ),
            )
        if suggestions:
            tree.selection_set("0")

        btn_frame = ttk.Frame(win)
        btn_frame.pack(fill=tk.X, padx=10, pady=(0, 10))

        def on_insert():
            sel = tree.selection()
            if not sel:
                return
            existing_exact = {x.strip() for x in exact_pattern_text.get("1.0", tk.END).splitlines() if x.strip()}
            existing_regex = {x.strip() for x in regex_pattern_text.get("1.0", tk.END).splitlines() if x.strip()}
            to_add_exact = []
            to_add_regex = []
            for iid in sel:
                item = suggestions[int(iid)]
                if item["type"] == "regex":
                    if item["pattern"] not in existing_regex and item["pattern"] not in to_add_regex:
                        to_add_regex.append(item["pattern"])
                else:
                    if item["pattern"] not in existing_exact and item["pattern"] not in to_add_exact:
                        to_add_exact.append(item["pattern"])
            if not to_add_exact and not to_add_regex:
                messagebox.showinfo("Gợi ý AI", "Pattern đã tồn tại trong danh sách.", parent=win)
                return
            if to_add_exact:
                if exact_pattern_text.get("1.0", tk.END).strip():
                    exact_pattern_text.insert(tk.END, "\n")
                exact_pattern_text.insert(tk.END, "\n".join(to_add_exact) + "\n")
            if to_add_regex:
                if regex_pattern_text.get("1.0", tk.END).strip():
                    regex_pattern_text.insert(tk.END, "\n")
                regex_pattern_text.insert(tk.END, "\n".join(to_add_regex) + "\n")
            exact_mode_var.set("string")
            regex_mode_var.set("string")
            self.log(f"[Xóa rác][AI] Đã thêm {len(to_add_exact) + len(to_add_regex)} pattern gợi ý (Exact={len(to_add_exact)}, Regex={len(to_add_regex)}).")
            win.destroy()

        ttk.Button(btn_frame, text="Thêm vào danh sách", command=on_insert).pack(side=tk.RIGHT)
        ttk.Button(btn_frame, text="Đóng", command=win.destroy).pack(side=tk.RIGHT, padx=(0, 6))

    def _pick_junk_folder(self, target_var: tk.StringVar):
        path = filedialog.askdirectory(title="Chọn thư mục chứa file .txt")
        if path:
            target_var.set(path)

    def _pick_junk_file(self, target_var: tk.StringVar):
        path = filedialog.askopenfilename(
            title="Chọn file cần xóa rác",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if path:
            target_var.set(path)

    def _list_txt_files(self, folder: str) -> list:
        try:
            return [
                os.path.join(folder, f)
                for f in os.listdir(folder)
                if f.lower().endswith(".txt") and os.path.isfile(os.path.join(folder, f))
            ]
        except Exception:
            return []

    def _read_text_file(self, file_path: str) -> str:
        encodings = ["utf-8-sig", "utf-8", "gb18030", "cp936"]
        for enc in encodings:
            try:
                with open(file_path, "r", encoding=enc) as f:
                    return f.read()
            except Exception:
                continue
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    def _load_junk_pattern_bundle(self):
        try:
            if os.path.exists("junk_patterns.json"):
                with open("junk_patterns.json", "r", encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, dict):
                    exact = data.get("exact", [])
                    regex = data.get("regex", [])
                    exact = [x for x in exact if isinstance(x, str) and x.strip()]
                    regex = [x for x in regex if isinstance(x, str) and x.strip()]
                    return {"exact": exact, "regex": regex}
                if isinstance(data, list):
                    # backward compatibility: format cũ là list dùng cho exact
                    exact = [x for x in data if isinstance(x, str) and x.strip()]
                    return {"exact": exact, "regex": []}
        except Exception:
            return {"exact": [], "regex": []}
        return {"exact": [], "regex": []}

    def _save_junk_pattern_bundle(self, exact_patterns, regex_patterns):
        try:
            with open("junk_patterns.json", "w", encoding="utf-8") as f:
                json.dump(
                    {
                        "exact": [x for x in exact_patterns if isinstance(x, str) and x.strip()],
                        "regex": [x for x in regex_patterns if isinstance(x, str) and x.strip()],
                    },
                    f,
                    ensure_ascii=False,
                    indent=2,
                )
        except Exception as e:
            print(f"Failed to save junk patterns: {e}")
