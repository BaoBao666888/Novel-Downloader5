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

        scope_var = tk.StringVar(value="folder")
        mode_var = tk.StringVar(value="string")
        match_var = tk.StringVar(value="exact")
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
        source_frame.pack(fill=tk.X, padx=10, pady=5)
        source_frame.columnconfigure(1, weight=1)

        ttk.Label(source_frame, text="Phạm vi:").grid(row=0, column=0, sticky="w", padx=5)
        ttk.Radiobutton(source_frame, text="Thư mục (quét .txt)", variable=scope_var, value="folder").grid(row=0, column=1, sticky="w")
        ttk.Radiobutton(source_frame, text="Một file cụ thể", variable=scope_var, value="file").grid(row=0, column=2, sticky="w")

        ttk.Label(source_frame, text="Thư mục:").grid(row=1, column=0, sticky="w", padx=5, pady=(6, 0))
        folder_entry = ttk.Entry(source_frame, textvariable=folder_var)
        folder_entry.grid(row=1, column=1, sticky="we", padx=5, pady=(6, 0))
        ttk.Button(source_frame, text="Chọn...", command=lambda: self._pick_junk_folder(folder_var)).grid(row=1, column=2, padx=5, pady=(6, 0))

        ttk.Label(source_frame, text="File:").grid(row=2, column=0, sticky="w", padx=5, pady=(6, 0))
        file_entry = ttk.Entry(source_frame, textvariable=file_var)
        file_entry.grid(row=2, column=1, sticky="we", padx=5, pady=(6, 0))
        ttk.Button(source_frame, text="Chọn...", command=lambda: self._pick_junk_file(file_var)).grid(row=2, column=2, padx=5, pady=(6, 0))

        ttk.Label(source_frame, textvariable=files_info_var, foreground="#555").grid(row=3, column=0, columnspan=3, sticky="w", padx=5, pady=(6, 0))

        opts_frame = ttk.LabelFrame(dialog, text="Tùy chọn xóa", padding=10)
        opts_frame.pack(fill=tk.X, padx=10, pady=5)

        ttk.Label(opts_frame, text="Chế độ:").grid(row=0, column=0, sticky="w", padx=5)
        ttk.Radiobutton(opts_frame, text="Chỉ xóa chuỗi", variable=mode_var, value="string").grid(row=0, column=1, sticky="w")
        ttk.Radiobutton(opts_frame, text="Xóa cả dòng chứa chuỗi", variable=mode_var, value="line").grid(row=0, column=2, sticky="w")

        ttk.Label(opts_frame, text="Matching:").grid(row=1, column=0, sticky="w", padx=5)
        ttk.Radiobutton(opts_frame, text="Chính xác (Exact)", variable=match_var, value="exact").grid(row=1, column=1, sticky="w")
        ttk.Radiobutton(opts_frame, text="Regex", variable=match_var, value="regex").grid(row=1, column=2, sticky="w")

        pat_frame = ttk.LabelFrame(dialog, text="Nội dung cần xóa (Mỗi dòng một pattern)", padding=10)
        pat_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        pattern_text = tk.Text(pat_frame, height=10)
        pattern_text.pack(fill=tk.BOTH, expand=True)

        saved_patterns = self._load_junk_patterns()
        if saved_patterns:
            pattern_text.insert("1.0", "\n".join(saved_patterns))

        warning_lbl = ttk.Label(dialog, text="", foreground="red", wraplength=550)
        warning_lbl.pack(pady=(0, 5))

        preview_frame = ttk.LabelFrame(dialog, text="Xem trước Diff", padding=10)
        preview_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
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
        preview_text.tag_configure("muted", foreground="#666666")
        preview_text.tag_configure("title", foreground="#0b5394")
        preview_vsb = ttk.Scrollbar(preview_frame, orient="vertical", command=preview_text.yview)
        preview_vsb.grid(row=1, column=2, sticky="ns")
        preview_hsb = ttk.Scrollbar(preview_frame, orient="horizontal", command=preview_text.xview)
        preview_hsb.grid(row=2, column=1, sticky="ew")
        preview_text.configure(yscrollcommand=preview_vsb.set, xscrollcommand=preview_hsb.set)

        btn_frame = ttk.Frame(dialog, padding=10)
        btn_frame.pack(fill=tk.X)

        def update_warning(*args):
            if mode_var.get() == "line" and match_var.get() == "regex":
                warning_lbl.config(text="⚠️ Cẩn thận: Chế độ 'Regex' + 'Xóa cả dòng' có thể xóa nhầm nhiều nội dung nếu pattern quá rộng (ví dụ match cả dòng trắng). Hãy kiểm tra kỹ Regex!")
            else:
                warning_lbl.config(text="")

        mode_var.trace_add("write", update_warning)
        match_var.trace_add("write", update_warning)
        update_warning()

        preview_cache = {}
        current_preview = {"path": None}

        def _update_source_info(*_args):
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
            preview_text.insert(
                tk.END,
                f"{os.path.basename(path)}\nDòng bị xóa: {data['deleted_lines']} | Khu vực thay đổi: {data['block_count']}\n\n",
                "title",
            )
            if not blocks:
                preview_text.insert(tk.END, "Không có thay đổi.\n", "muted")
            for idx, block in enumerate(blocks, start=1):
                preview_text.insert(
                    tk.END,
                    f"Khu vực {idx} (dòng {block['line_start']}-{block['line_end']}):\n",
                    "muted",
                )
                for line in block["context_before"]:
                    preview_text.insert(tk.END, f"  {line}\n")
                for line in block["removed"]:
                    preview_text.insert(tk.END, f"- {line}\n", "removed")
                for line in block["context_after"]:
                    preview_text.insert(tk.END, f"  {line}\n")
                preview_text.insert(tk.END, "...\n", "muted")
            hidden = data["block_count"] - len(blocks)
            if hidden > 0:
                preview_text.insert(tk.END, f"\n... còn {hidden} khu vực tương tự (bật 'Hiện đầy đủ các khu vực' để xem).\n", "muted")
            preview_text.config(state=tk.DISABLED)

        def _refresh_preview_list():
            preview_tree.delete(*preview_tree.get_children())
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

        def _build_preview():
            raw_patterns = pattern_text.get("1.0", tk.END).strip().split("\n")
            patterns = [p for p in raw_patterns if p.strip()]
            if not patterns:
                messagebox.showwarning("Cảnh báo", "Vui lòng nhập ít nhất một pattern!", parent=dialog)
                return None, None
            target_files = _resolve_target_files()
            if not target_files:
                messagebox.showwarning("Cảnh báo", "Không tìm thấy file để xử lý!", parent=dialog)
                return None, None
            use_regex = (match_var.get() == "regex")
            new_cache = {}
            changed = 0
            for fpath in target_files:
                try:
                    before = self._read_text_file(fpath)
                    after, _ = self._apply_junk_patterns_to_text(before, patterns, mode_var.get(), use_regex)
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
            self._open_junk_ai_picker(dialog, suggestions, pattern_text, mode_var, match_var)

        def on_apply():
            raw_patterns = pattern_text.get("1.0", tk.END).strip().split("\n")
            patterns = [p for p in raw_patterns if p.strip()]
            if not patterns:
                messagebox.showwarning("Cảnh báo", "Vui lòng nhập ít nhất một pattern!", parent=dialog)
                return

            self._save_junk_patterns(patterns)

            target_files = _resolve_target_files()

            if not target_files:
                messagebox.showwarning("Cảnh báo", "Không tìm thấy file để xử lý!", parent=dialog)
                return

            msg = (
                f"Sẽ quét {len(target_files)} file.\n"
                f"Pattern: {len(patterns)} mẫu.\n"
                f"Mode: {mode_var.get()}\n"
                f"Match: {match_var.get()}\n\n"
                "TIẾN HÀNH?"
            )
            if not messagebox.askyesno("Xác nhận", msg, parent=dialog):
                return

            count_files, count_matches = self._remove_junk_from_files(
                target_files, patterns, mode_var.get(), match_var.get() == "regex"
            )

            messagebox.showinfo("Hoàn tất", f"Đã xử lý {count_files} file.\nXóa thành công {count_matches} vị trí/dòng.", parent=dialog)
            self.log(f"Xóa rác: {count_matches} matches trong {count_files} files.")

        ttk.Button(btn_frame, text="Thực hiện", command=on_apply).pack(side=tk.RIGHT)
        ttk.Button(btn_frame, text="Đóng", command=dialog.destroy).pack(side=tk.RIGHT, padx=5)
        ttk.Button(btn_frame, text="Xem trước Diff", command=on_preview).pack(side=tk.RIGHT, padx=(0, 6))
        ttk.Button(btn_frame, text="Gợi ý AI", command=on_ai_suggest).pack(side=tk.RIGHT, padx=(0, 6))

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

    def _remove_junk_from_files(self, files, patterns, mode, use_regex):
        """Logic xóa rác khỏi file."""
        count_files = 0
        total_matches = 0

        for file_path in files:
            if not os.path.exists(file_path):
                continue
            try:
                content = self._read_text_file(file_path)
                original_content = content
                content, matches_in_file = self._apply_junk_patterns_to_text(content, patterns, mode, use_regex)

                if content != original_content:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(content)
                    count_files += 1
                    total_matches += matches_in_file
            except Exception as e:
                print(f"Error processing file {file_path}: {e}")
        return count_files, total_matches

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

        for tag, i1, i2, _j1, _j2 in matcher.get_opcodes():
            if tag not in ("delete", "replace"):
                continue
            removed = before_lines[i1:i2]
            if not removed:
                continue
            deleted_total += len(removed)
            ctx_before_start = max(0, i1 - context_lines)
            ctx_after_end = min(len(before_lines), i2 + context_lines)
            blocks.append(
                {
                    "line_start": i1 + 1,
                    "line_end": i2,
                    "context_before": before_lines[ctx_before_start:i1],
                    "removed": removed,
                    "context_after": before_lines[i2:ctx_after_end],
                }
            )
        return blocks, deleted_total

    def _pick_representative_blocks(self, blocks: list, limit=2):
        if len(blocks) <= limit:
            return blocks
        selected = []
        seen_signatures = set()
        for block in blocks:
            signature = "\n".join(block["removed"][:3]).strip()
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
        meta = data.get("junk_ai_dataset") if isinstance(data, dict) else {}
        return meta if isinstance(meta, dict) else {}

    def _junk_dataset_cache_path(self):
        return os.path.join(BASE_DIR, "local", "junk_dataset_cache.json")

    def _junk_dataset_builtin_path(self):
        return os.path.join(BASE_DIR, "junk_dataset.json")

    def _extract_junk_dataset_urls(self, meta: dict):
        urls = []
        primary = meta.get("primary_url") if isinstance(meta, dict) else None
        backup = meta.get("backup_url") if isinstance(meta, dict) else None
        url_list = meta.get("urls") if isinstance(meta, dict) else None
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

    def _load_junk_dataset(self):
        if hasattr(self, "_junk_dataset_cache_obj"):
            return self._junk_dataset_cache_obj or {}
        meta = self._junk_dataset_manifest_meta()
        urls = self._extract_junk_dataset_urls(meta)
        cache_path = self._junk_dataset_cache_path()
        dataset = {}

        use_local_only = bool(getattr(self, "use_local_manifest_only", False))
        if not use_local_only:
            for url in urls:
                try:
                    data = self._fetch_json_from_url(url, timeout=10)
                    if self._is_valid_junk_dataset(data):
                        dataset = data
                        try:
                            os.makedirs(os.path.dirname(cache_path), exist_ok=True)
                            with open(cache_path, "w", encoding="utf-8") as f:
                                json.dump(dataset, f, ensure_ascii=False, indent=2)
                        except Exception:
                            pass
                        self.log("[Xóa rác][AI] Đã tải dataset từ URL manifest.")
                        break
                except Exception:
                    continue

        if not dataset:
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if self._is_valid_junk_dataset(data):
                    dataset = data
                    self.log("[Xóa rác][AI] Dùng dataset cache local.")
            except Exception:
                pass

        if not dataset:
            builtin_path = self._junk_dataset_builtin_path()
            try:
                with open(builtin_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if self._is_valid_junk_dataset(data):
                    dataset = data
                    self.log("[Xóa rác][AI] Dùng dataset local mặc định.")
            except Exception:
                dataset = {}

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

    def _suggest_junk_patterns_ai(self, target_files):
        dataset = self._load_junk_dataset()
        if not dataset:
            return []
        training_sets = dataset.get("training_sets", [])
        if not training_sets:
            return []

        exact_candidates = []
        for line in dataset.get("exact_patterns", []):
            if isinstance(line, str) and len(line.strip()) >= 3:
                exact_candidates.append({"pattern": line.strip(), "use_regex": False})

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
            coverage_score = min(1.0, hit_lines / 50.0)
            final_score = 0.75 * metric["f1"] + 0.25 * coverage_score
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

    def _open_junk_ai_picker(self, parent_dialog, suggestions, pattern_text, mode_var, match_var):
        win = tk.Toplevel(parent_dialog)
        win.title("Gợi ý Xóa rác (AI local)")
        win.geometry("980x520")
        win.transient(parent_dialog)
        win.grab_set()

        ttk.Label(
            win,
            text="Chọn pattern gợi ý (đã chấm trên dataset JSON). Có thể chọn nhiều dòng.",
        ).pack(anchor="w", padx=10, pady=(10, 6))

        list_frame = ttk.Frame(win)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 10))
        list_frame.columnconfigure(0, weight=1)
        list_frame.rowconfigure(0, weight=1)

        cols = ("type", "pattern", "f1", "precision", "recall", "target_lines", "target_files", "score")
        tree = ttk.Treeview(list_frame, columns=cols, show="headings", selectmode="extended")
        tree.heading("type", text="Loại")
        tree.heading("pattern", text="Pattern")
        tree.heading("f1", text="F1 train")
        tree.heading("precision", text="P")
        tree.heading("recall", text="R")
        tree.heading("target_lines", text="Hit dòng")
        tree.heading("target_files", text="Hit file")
        tree.heading("score", text="Score")
        tree.column("type", width=70, anchor="center")
        tree.column("pattern", width=520, anchor="w")
        tree.column("f1", width=70, anchor="center")
        tree.column("precision", width=60, anchor="center")
        tree.column("recall", width=60, anchor="center")
        tree.column("target_lines", width=70, anchor="center")
        tree.column("target_files", width=70, anchor="center")
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
            existing = [x.strip() for x in pattern_text.get("1.0", tk.END).splitlines() if x.strip()]
            to_add = []
            selected_types = set()
            for iid in sel:
                item = suggestions[int(iid)]
                selected_types.add(item["type"])
                if item["pattern"] not in existing and item["pattern"] not in to_add:
                    to_add.append(item["pattern"])
            if not to_add:
                messagebox.showinfo("Gợi ý AI", "Pattern đã tồn tại trong danh sách.", parent=win)
                return
            if existing and not pattern_text.get("1.0", tk.END).endswith("\n"):
                pattern_text.insert(tk.END, "\n")
            pattern_text.insert(tk.END, "\n".join(to_add) + "\n")
            if selected_types == {"regex"}:
                mode_var.set("line")
                match_var.set("regex")
            elif selected_types == {"exact"}:
                mode_var.set("line")
                match_var.set("exact")
            self.log(f"[Xóa rác][AI] Đã thêm {len(to_add)} pattern gợi ý.")
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

    def _load_junk_patterns(self):
        try:
            if os.path.exists("junk_patterns.json"):
                with open("junk_patterns.json", "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            return []
        return []

    def _save_junk_patterns(self, patterns):
        try:
            with open("junk_patterns.json", "w", encoding="utf-8") as f:
                json.dump(patterns, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Failed to save junk patterns: {e}")
