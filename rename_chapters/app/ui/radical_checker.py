import os
import json
import unicodedata
from typing import Optional
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext


RADICAL_RANGES = (
    (0x2F00, 0x2FDF),  # Kangxi Radicals
    (0x2E80, 0x2EFF),  # CJK Radicals Supplement
)

# Danh sách chuyển đổi mặc định
RADICAL_MAP = {
    "⻄": "西",  # U+2EC4 west
    "⻅": "见",  # U+2EC5 see
    "⻋": "车",  # U+2ECB vehicle
    "⻓": "长",  # U+2ED3 long
    "⻔": "门",  # U+2ED4 gate
    "⻚": "页",  # U+2EDA page / head
    "⻛": "风",  # U+2EDB wind
    "⻜": "飞",  # U+2EDC fly
    "⻢": "马",  # U+2EE2 horse
    "⻥": "鱼",  # U+2EE5 fish
    "⻮": "齿",  # U+2EEE tooth
}

def _is_radical(ch: str) -> bool:
    if not ch:
        return False
    code = ord(ch)
    for start, end in RADICAL_RANGES:
        if start <= code <= end:
            return True
    return False


def _format_codes(text: str) -> str:
    return " ".join(f"U+{ord(ch):04X}" for ch in text) if text else ""


def _normalize_text(text: str, mapping: dict) -> str:
    text = unicodedata.normalize("NFKC", text)
    return "".join(mapping.get(ch, ch) for ch in text)

def _nfkc_convert_char(ch: str) -> str:
    return unicodedata.normalize("NFKC", ch or "")


def _safe_output_path(path: str, out_dir: Optional[str] = None) -> str:
    target_dir = out_dir or os.path.dirname(path)
    base_name = os.path.basename(path)
    if base_name.lower().endswith(".txt"):
        base_name = base_name[:-4]
    candidate = os.path.join(target_dir, base_name + ".normalized.txt")
    template = os.path.join(target_dir, base_name + ".normalized({idx}).txt")
    if not os.path.exists(candidate):
        return candidate
    for idx in range(1, 1000):
        attempt = template.format(idx=idx)
        if not os.path.exists(attempt):
            return attempt
    return candidate


def open_radical_checker_dialog(app):
    existing = getattr(app, "_radical_checker_win", None)
    if existing and existing.winfo_exists():
        try:
            existing.lift()
            existing.focus_set()
            return
        except Exception:
            pass

    win = tk.Toplevel(app)
    app._radical_checker_win = win
    try:
        app._apply_window_icon(win)
    except Exception:
        pass
    win.title("Kiểm tra Radical")
    win.geometry("820x640")
    win.columnconfigure(0, weight=1)
    win.rowconfigure(0, weight=1)

    outer = ttk.Frame(win)
    outer.grid(row=0, column=0, sticky="nsew")
    outer.columnconfigure(0, weight=1)
    outer.rowconfigure(0, weight=1)

    canvas = tk.Canvas(outer, highlightthickness=0)
    canvas.grid(row=0, column=0, sticky="nsew")
    scroll = ttk.Scrollbar(outer, orient="vertical", command=canvas.yview)
    scroll.grid(row=0, column=1, sticky="ns")
    canvas.configure(yscrollcommand=scroll.set)

    container = ttk.Frame(canvas, padding=12)
    container.columnconfigure(0, weight=1)
    container.rowconfigure(5, weight=1)
    container_id = canvas.create_window((0, 0), window=container, anchor="nw")

    def _sync_container(_event=None):
        bbox = canvas.bbox("all")
        if bbox:
            canvas.configure(scrollregion=bbox)
        canvas.itemconfigure(container_id, width=canvas.winfo_width())

    container.bind("<Configure>", _sync_container)
    canvas.bind("<Configure>", lambda e: canvas.itemconfigure(container_id, width=e.width))

    selected_files = []
    found_radicals = []
    unknown_vars = {}
    custom_map = app.app_config.get("radical_map")
    if not isinstance(custom_map, dict):
        custom_map = {}
    custom_map = dict(custom_map)
    output_dir_var = tk.StringVar(value=app.app_config.get("radical_output_dir", ""))

    header = ttk.Label(
        container,
        text="Chọn file .txt để kiểm tra ký tự thuộc Radical block, sau đó chuẩn hóa nếu cần.",
    )
    header.grid(row=0, column=0, sticky="w")

    action_row = ttk.Frame(container)
    action_row.grid(row=1, column=0, sticky="ew", pady=(8, 6))
    action_row.columnconfigure(1, weight=1)
    ttk.Button(action_row, text="Chọn file .txt", command=lambda: _pick_files()).grid(row=0, column=0, sticky="w")
    ttk.Button(action_row, text="Kiểm tra", command=lambda: _scan_files()).grid(row=0, column=2, sticky="e")
    normalize_btn = ttk.Button(action_row, text="Chuẩn hóa file", command=lambda: _normalize_files())
    normalize_btn.grid(row=0, column=3, sticky="e", padx=(8, 0))

    files_frame = ttk.Frame(container)
    files_frame.grid(row=2, column=0, sticky="ew")
    files_frame.columnconfigure(0, weight=1)
    files_list = tk.Listbox(files_frame, height=4)
    files_list.grid(row=0, column=0, sticky="ew")
    files_scroll = ttk.Scrollbar(files_frame, orient="vertical", command=files_list.yview)
    files_scroll.grid(row=0, column=1, sticky="ns")
    files_list.configure(yscrollcommand=files_scroll.set)

    output_frame = ttk.Frame(container)
    output_frame.grid(row=3, column=0, sticky="ew", pady=(6, 0))
    output_frame.columnconfigure(1, weight=1)
    ttk.Label(output_frame, text="Thư mục xuất:").grid(row=0, column=0, sticky="w")
    ttk.Entry(output_frame, textvariable=output_dir_var).grid(row=0, column=1, sticky="ew", padx=(6, 0))
    ttk.Button(output_frame, text="Chọn...", command=lambda: _pick_output_dir()).grid(row=0, column=2, padx=(6, 0))

    status_var = tk.StringVar(value="Chưa chọn file.")
    ttk.Label(container, textvariable=status_var, anchor="w").grid(row=4, column=0, sticky="w", pady=(6, 0))

    result_frame = ttk.Frame(container)
    result_frame.grid(row=5, column=0, sticky="nsew", pady=(8, 0))
    result_frame.columnconfigure(0, weight=1)
    result_frame.rowconfigure(2, weight=1)

    auto_frame = ttk.LabelFrame(result_frame, text="Tự chuyển đổi (NFKC)", padding=8)
    auto_frame.grid(row=0, column=0, sticky="nsew")
    auto_frame.columnconfigure(0, weight=1)
    auto_text = scrolledtext.ScrolledText(auto_frame, height=6, state="disabled", wrap=tk.WORD)
    auto_text.grid(row=0, column=0, sticky="nsew")

    map_frame = ttk.LabelFrame(result_frame, text="Chuẩn hóa theo MAP (đã có)", padding=8)
    map_frame.grid(row=1, column=0, sticky="nsew", pady=(10, 0))
    map_frame.columnconfigure(0, weight=1)
    map_text = scrolledtext.ScrolledText(map_frame, height=6, state="disabled", wrap=tk.WORD)
    map_text.grid(row=0, column=0, sticky="nsew")

    manual_frame = ttk.LabelFrame(result_frame, text="Cần nhập thủ công", padding=8)
    manual_frame.grid(row=2, column=0, sticky="nsew", pady=(10, 0))
    manual_frame.columnconfigure(0, weight=1)
    manual_frame.rowconfigure(1, weight=1)
    manual_actions = ttk.Frame(manual_frame)
    manual_actions.grid(row=0, column=0, sticky="ew", pady=(0, 6))
    manual_actions.columnconfigure(0, weight=1)
    ttk.Button(manual_actions, text="Sao chép", command=lambda: _copy_manual_template()).pack(side=tk.LEFT)
    ttk.Button(manual_actions, text="Dán", command=lambda: _paste_manual_template()).pack(side=tk.LEFT, padx=(6, 0))
    manual_canvas = tk.Canvas(manual_frame, highlightthickness=0)
    manual_canvas.grid(row=1, column=0, sticky="nsew")
    manual_scroll = ttk.Scrollbar(manual_frame, orient="vertical", command=manual_canvas.yview)
    manual_scroll.grid(row=1, column=1, sticky="ns")
    manual_canvas.configure(yscrollcommand=manual_scroll.set)
    manual_inner = ttk.Frame(manual_canvas)
    manual_inner.columnconfigure(1, weight=1)
    inner_id = manual_canvas.create_window((0, 0), window=manual_inner, anchor="nw")

    def _sync_manual(_event=None):
        bbox = manual_canvas.bbox("all")
        if bbox:
            manual_canvas.configure(scrollregion=bbox)
        manual_canvas.itemconfigure(inner_id, width=manual_canvas.winfo_width())

    manual_inner.bind("<Configure>", _sync_manual)
    manual_canvas.bind("<Configure>", lambda e: manual_canvas.itemconfigure(inner_id, width=e.width))

    def _is_descendant(widget, ancestor):
        cur = widget
        while cur is not None:
            if cur == ancestor:
                return True
            cur = getattr(cur, "master", None)
        return False

    def _on_mousewheel(event):
        delta = -1 if event.delta > 0 else 1
        if _is_descendant(event.widget, manual_canvas):
            manual_canvas.yview_scroll(delta, "units")
        else:
            canvas.yview_scroll(delta, "units")

    def _on_wheel_up(_event):
        if _is_descendant(_event.widget, manual_canvas):
            manual_canvas.yview_scroll(-1, "units")
        else:
            canvas.yview_scroll(-1, "units")

    def _on_wheel_down(_event):
        if _is_descendant(_event.widget, manual_canvas):
            manual_canvas.yview_scroll(1, "units")
        else:
            canvas.yview_scroll(1, "units")

    win.bind("<MouseWheel>", _on_mousewheel)
    win.bind("<Button-4>", _on_wheel_up)
    win.bind("<Button-5>", _on_wheel_down)

    def _render_auto_list(radicals, mapping):
        auto_text.config(state="normal")
        auto_text.delete("1.0", tk.END)
        if not radicals:
            auto_text.insert(tk.END, "Không có Radical cần chuẩn hóa.\n")
        else:
            for ch in radicals:
                target = mapping.get(ch)
                if not target:
                    continue
                left = f"{ch} ({_format_codes(ch)})"
                right = f"{target} ({_format_codes(target)})"
                auto_text.insert(tk.END, f"- {left} -> {right}\n")
        auto_text.config(state="disabled")

    def _render_map_list(radicals, mapping):
        map_text.config(state="normal")
        map_text.delete("1.0", tk.END)
        if not radicals:
            map_text.insert(tk.END, "Không có Radical cần dùng MAP.\n")
        else:
            for ch in radicals:
                target = mapping.get(ch)
                if not target:
                    continue
                left = f"{ch} ({_format_codes(ch)})"
                right = f"{target} ({_format_codes(target)})"
                map_text.insert(tk.END, f"- {left} -> {right}\n")
        map_text.config(state="disabled")

    def _clear_manual_entries():
        for child in manual_inner.winfo_children():
            child.destroy()
        unknown_vars.clear()

    def _render_manual_entries(radicals):
        _clear_manual_entries()
        if not radicals:
            ttk.Label(manual_inner, text="Không có Radical cần nhập thủ công.").grid(row=0, column=0, sticky="w")
            return
        row = 0
        for ch in radicals:
            label = f"{ch} ({_format_codes(ch)})"
            ttk.Label(manual_inner, text=label).grid(row=row, column=0, sticky="w", pady=(2, 2))
            var = tk.StringVar(value="")
            entry = ttk.Entry(manual_inner, textvariable=var)
            entry.grid(row=row, column=1, sticky="ew", padx=(8, 0), pady=(2, 2))
            unknown_vars[ch] = var
            row += 1

    def _copy_manual_template():
        if not unknown_vars:
            messagebox.showinfo("Kiểm tra Radical", "Không có ký tự cần nhập thủ công.", parent=win)
            return
        payload = {
            "_note": "Điền giá trị thay thế vào trường value cho từng ký tự Radical.",
            "_format": "Ví dụ: \"⻄\": {\"value\": \"西\", \"note\": \"U+2EC4\"}",
        }
        for ch in unknown_vars.keys():
            payload[ch] = {
                "value": "",
                "note": _format_codes(ch),
            }
        text = json.dumps(payload, ensure_ascii=False, indent=2)
        try:
            win.clipboard_clear()
            win.clipboard_append(text)
        except Exception as exc:
            messagebox.showerror("Lỗi", f"Không sao chép được: {exc}", parent=win)
            return
        messagebox.showinfo("Đã sao chép", "Đã sao chép danh sách ký tự cần nhập.", parent=win)

    def _paste_manual_template():
        if not unknown_vars:
            messagebox.showinfo("Kiểm tra Radical", "Không có ký tự cần nhập thủ công.", parent=win)
            return
        try:
            text = win.clipboard_get()
        except Exception as exc:
            messagebox.showerror("Lỗi", f"Không đọc được clipboard: {exc}", parent=win)
            return
        if not text:
            return
        try:
            payload = json.loads(text)
        except Exception:
            payload = None
        if isinstance(payload, dict):
            for key, raw in payload.items():
                if not key or str(key).startswith("_"):
                    continue
                value = ""
                if isinstance(raw, dict):
                    if "value" in raw:
                        value = str(raw.get("value") or "")
                    elif "val" in raw:
                        value = str(raw.get("val") or "")
                elif raw is None:
                    value = ""
                else:
                    value = str(raw)
                var = unknown_vars.get(str(key))
                if var is not None:
                    var.set(value.strip())
            return
        for line in text.splitlines():
            raw = line.strip()
            if not raw:
                continue
            key = ""
            val = ""
            if "\t" in raw:
                key, val = raw.split("\t", 1)
            elif "->" in raw:
                key, val = raw.split("->", 1)
            elif "=" in raw:
                key, val = raw.split("=", 1)
            else:
                parts = raw.split()
                if parts:
                    key = parts[0]
                    val = " ".join(parts[1:]) if len(parts) > 1 else ""
            key = key.strip()
            val = val.strip()
            if not key:
                continue
            var = unknown_vars.get(key)
            if var is not None:
                var.set(val)

    def _pick_files():
        paths = filedialog.askopenfilenames(
            parent=win,
            title="Chọn file .txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
        )
        if not paths:
            return
        selected_files.clear()
        selected_files.extend(paths)
        files_list.delete(0, tk.END)
        for path in selected_files:
            files_list.insert(tk.END, path)
        status_var.set(f"Đã chọn {len(selected_files)} file.")
        _reset_results()
        _scan_files()

    def _pick_output_dir():
        path = filedialog.askdirectory(parent=win, title="Chọn thư mục xuất")
        if not path:
            return
        output_dir_var.set(path)
        app.app_config["radical_output_dir"] = path
        try:
            app.save_config()
        except Exception:
            pass

    def _reset_results():
        found_radicals.clear()
        _render_auto_list([], {})
        _render_map_list([], {})
        _render_manual_entries([])
        normalize_btn.config(state=tk.NORMAL)

    def _scan_files():
        if not selected_files:
            messagebox.showinfo("Kiểm tra Radical", "Chọn ít nhất 1 file .txt trước.", parent=win)
            return
        found = set()
        for path in selected_files:
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    data = f.read()
            except Exception as exc:
                messagebox.showerror("Lỗi", f"Không đọc được file: {path}\n{exc}", parent=win)
                return
            for ch in data:
                if _is_radical(ch):
                    found.add(ch)
        found_radicals[:] = sorted(found, key=lambda c: ord(c))
        if not found_radicals:
            status_var.set("Không phát hiện ký tự Radical.")
            _reset_results()
            return
        merged_map = dict(RADICAL_MAP)
        merged_map.update(custom_map)
        nfkc_map = {}
        for ch in found_radicals:
            converted = _nfkc_convert_char(ch)
            if converted and converted != ch:
                nfkc_map[ch] = converted
        remaining = [ch for ch in found_radicals if ch not in nfkc_map]
        map_radicals = [ch for ch in remaining if ch in merged_map]
        manual_radicals = [ch for ch in remaining if ch not in merged_map]
        _render_auto_list(list(nfkc_map.keys()), nfkc_map)
        _render_map_list(map_radicals, merged_map)
        _render_manual_entries(manual_radicals)
        status_var.set(
            "Phát hiện {total} Radical (NFKC: {auto}, MAP: {mapped}, cần nhập: {manual}).".format(
                total=len(found_radicals),
                auto=len(nfkc_map),
                mapped=len(map_radicals),
                manual=len(manual_radicals),
            )
        )
        normalize_btn.config(state=tk.NORMAL)

    def _collect_manual_map():
        updates = {}
        for ch, var in unknown_vars.items():
            value = var.get().strip()
            if value:
                updates[ch] = value
        return updates

    def _normalize_files():
        if not found_radicals:
            messagebox.showinfo("Kiểm tra Radical", "Chưa có dữ liệu để chuẩn hóa.", parent=win)
            return
        app.app_config["radical_output_dir"] = output_dir_var.get().strip()
        try:
            app.save_config()
        except Exception:
            pass
        merged_map = dict(RADICAL_MAP)
        merged_map.update(custom_map)
        missing = []
        for ch in found_radicals:
            converted = _nfkc_convert_char(ch)
            if converted and converted != ch:
                continue
            if ch not in merged_map:
                missing.append(ch)
        manual_updates = _collect_manual_map()
        for ch in missing:
            if ch not in manual_updates:
                messagebox.showerror(
                    "Thiếu mapping",
                    f"Vui lòng nhập ký tự thay thế cho {ch} ({_format_codes(ch)}).",
                    parent=win,
                )
                return
        if manual_updates:
            custom_map.update(manual_updates)
            app.app_config["radical_map"] = dict(custom_map)
            try:
                app.save_config()
            except Exception:
                pass
            merged_map.update(manual_updates)

        outputs = []
        target_dir = output_dir_var.get().strip()
        if target_dir and not os.path.isdir(target_dir):
            messagebox.showerror("Lỗi", "Thư mục xuất không hợp lệ.", parent=win)
            return
        for path in selected_files:
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    data = f.read()
            except Exception as exc:
                messagebox.showerror("Lỗi", f"Không đọc được file: {path}\n{exc}", parent=win)
                return
            normalized = _normalize_text(data, merged_map)
            out_path = _safe_output_path(path, target_dir or None)
            try:
                with open(out_path, "w", encoding="utf-8") as f:
                    f.write(normalized)
            except Exception as exc:
                messagebox.showerror("Lỗi", f"Không ghi được file: {out_path}\n{exc}", parent=win)
                return
            outputs.append(out_path)

        preview = "\n".join(outputs[:6])
        if len(outputs) > 6:
            preview += f"\n... và {len(outputs) - 6} file khác"
        messagebox.showinfo("Hoàn tất", f"Đã tạo {len(outputs)} file:\n{preview}", parent=win)

    def _on_close():
        try:
            app.app_config["radical_output_dir"] = output_dir_var.get().strip()
            app.save_config()
            app._radical_checker_win = None
        except Exception:
            pass
        win.destroy()

    win.protocol("WM_DELETE_WINDOW", _on_close)
