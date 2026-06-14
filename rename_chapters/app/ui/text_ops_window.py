import hashlib
import os
import re
import tkinter as tk
import tkinter.font as tkfont
import uuid
from tkinter import ttk, filedialog, messagebox, scrolledtext

from app.core.text_ops import TextOperations
from app.ui.text_ops_state import TextOpsStateStore


TEXT_ENCODING_OPTIONS = (
    ("utf-8", "UTF-8"),
    ("utf-8-sig", "UTF-8 có BOM"),
    ("utf-16", "Unicode (UTF-16/BOM)"),
    ("utf-16-le", "Unicode (UTF-16 LE)"),
    ("utf-16-be", "Unicode (UTF-16 BE)"),
    ("gb18030", "Chinese GB18030"),
    ("gb2312", "Chinese GB2312"),
    ("cp936", "Chinese CP936/GBK"),
    ("big5", "Chinese Big5"),
    ("cp950", "Chinese CP950"),
)
TEXT_ENCODINGS = tuple(encoding for encoding, _label in TEXT_ENCODING_OPTIONS)
TEXT_ENCODING_LABELS = dict(TEXT_ENCODING_OPTIONS)
SAVE_TEXT_ENCODINGS = ("utf-8", "utf-8-sig", "utf-16", "utf-16-le", "utf-16-be", "gb18030", "big5")

TEXTOPS_CHINESE_FONT = "Microsoft YaHei"
TEXTOPS_VIETNAMESE_FONT = "Arial"
TEXTOPS_FALLBACK_FONT = "Segoe UI"
TEXTOPS_DEFAULT_SPLIT_REGEX = r"第.*?章"
TEXTOPS_DEFAULT_QUICK_REGEX = r"^(第\d+章)"
TEXTOPS_MIXED_FONT_CANDIDATES = (
    "Arial Unicode MS",
    "Noto Sans CJK SC",
    "Noto Sans CJK",
    "Microsoft JhengHei UI",
    "Microsoft JhengHei",
    "SimSun",
    "Arial",
    TEXTOPS_FALLBACK_FONT,
)
TEXTOPS_AUTOSAVE_DELAY_MS = 700

VIETNAMESE_MARKS = set(
    "ăâđêôơư"
    "áàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩị"
    "óòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ"
    "ĂÂĐÊÔƠƯ"
    "ÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊ"
    "ÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ"
)
CHINESE_CHAR_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]")


def _encoding_label(encoding: str) -> str:
    encoding = (encoding or "utf-8").lower()
    return TEXT_ENCODING_LABELS.get(encoding, encoding)


def _encoding_combo_values(encodings=TEXT_ENCODINGS) -> list[str]:
    return [f"{_encoding_label(encoding)} [{encoding}]" for encoding in encodings]


def _encoding_from_combo_value(value: str) -> str:
    match = re.search(r"\[([^\]]+)\]\s*$", value or "")
    if match:
        return match.group(1).strip()
    label = (value or "").strip()
    for encoding, display in TEXT_ENCODING_OPTIONS:
        if label in (encoding, display):
            return encoding
    return label or "utf-8"


def _ordered_text_encodings(raw: bytes) -> list[str]:
    encodings: list[str] = []

    def add(encoding: str):
        if encoding not in encodings:
            encodings.append(encoding)

    if raw.startswith((b"\xff\xfe", b"\xfe\xff")):
        add("utf-16")
        add("utf-16-le")
        add("utf-16-be")

    add("utf-8-sig")
    add("utf-8")

    sample = raw[:8000]
    if len(sample) >= 4:
        even_nulls = sample[0::2].count(0)
        odd_nulls = sample[1::2].count(0)
        half_len = max(1, len(sample) // 2)
        if odd_nulls / half_len > 0.22:
            add("utf-16-le")
            add("utf-16")
        if even_nulls / half_len > 0.22:
            add("utf-16-be")
            add("utf-16")

    for encoding in ("gb18030", "gb2312", "cp936", "big5", "cp950", "utf-16-le", "utf-16-be"):
        add(encoding)
    return encodings


def _decoded_text_score(text: str) -> float:
    sample = (text or "")[:40000]
    if not sample:
        return 100.0
    length = len(sample)
    replacement = sample.count("\ufffd")
    nulls = sample.count("\x00")
    controls = sum(1 for ch in sample if ord(ch) < 32 and ch not in "\r\n\t")
    printable = sum(1 for ch in sample if ch.isprintable() or ch in "\r\n\t")
    chinese = len(CHINESE_CHAR_RE.findall(sample))
    vietnamese = sum(1 for ch in sample if ch in VIETNAMESE_MARKS)
    ascii_letters = sum(1 for ch in sample if "a" <= ch.lower() <= "z")
    readable_bonus = min(25.0, chinese * 0.08 + vietnamese * 0.35 + ascii_letters * 0.02)
    bad_penalty = replacement * 10.0 + nulls * 18.0 + controls * 4.0
    return (printable / length) * 100.0 + readable_bonus - bad_penalty


def _decode_text_bytes_auto(raw: bytes) -> tuple[str, str, float]:
    candidates: list[tuple[float, int, str, str]] = []
    last_error = None
    for order, encoding in enumerate(_ordered_text_encodings(raw)):
        try:
            text = raw.decode(encoding)
        except UnicodeDecodeError as exc:
            last_error = exc
            continue
        candidates.append((_decoded_text_score(text), -order, encoding, text))
    if candidates:
        score, _order, encoding, text = max(candidates, key=lambda item: (item[0], item[1]))
        return text, encoding, score
    try:
        text = raw.decode("utf-8", errors="replace")
        return text, "utf-8-replace", _decoded_text_score(text)
    except Exception as exc:
        raise last_error or exc


def _needs_encoding_dialog(text: str, encoding: str, score: float) -> bool:
    sample = (text or "")[:8000]
    return (
        encoding == "utf-8-replace"
        or score < 45.0
        or "\ufffd" in sample
        or "\x00" in sample
    )


def select_text_encoding_dialog(parent, path: str, raw: bytes, initial_encoding: str = "utf-8"):
    result: dict[str, str | None] = {"text": None, "encoding": None}
    win = tk.Toplevel(parent)
    win.title(f"Chọn mã văn bản - {os.path.basename(path)}")
    win.geometry("760x520")
    win.minsize(640, 420)
    try:
        win.transient(parent)
        win.grab_set()
    except Exception:
        pass

    root = ttk.Frame(win, padding=10)
    root.pack(fill=tk.BOTH, expand=True)
    root.columnconfigure(1, weight=1)
    root.rowconfigure(2, weight=1)

    ttk.Label(root, text="Chọn encoding làm nội dung đọc được. File sẽ lưu mặc định bằng UTF-8.").grid(
        row=0, column=0, columnspan=2, sticky="w"
    )
    ttk.Label(root, text="Text encoding:").grid(row=1, column=0, sticky="nw", pady=(8, 4))

    list_frame = ttk.Frame(root)
    list_frame.grid(row=1, column=1, sticky="nsew", pady=(8, 4))
    list_frame.columnconfigure(0, weight=1)
    list_frame.rowconfigure(0, weight=1)
    encoding_list = tk.Listbox(list_frame, exportselection=False, height=8)
    encoding_list.grid(row=0, column=0, sticky="nsew")
    list_scroll = ttk.Scrollbar(list_frame, orient="vertical", command=encoding_list.yview)
    list_scroll.grid(row=0, column=1, sticky="ns")
    encoding_list.configure(yscrollcommand=list_scroll.set)

    encodings = list(TEXT_ENCODINGS)
    for encoding in encodings:
        encoding_list.insert(tk.END, f"{_encoding_label(encoding)} [{encoding}]")

    preview = scrolledtext.ScrolledText(root, wrap=tk.WORD, height=12, font=(TEXTOPS_FALLBACK_FONT, 11))
    preview.grid(row=2, column=0, columnspan=2, sticky="nsew", pady=(6, 0))
    status_var = tk.StringVar(value="")
    ttk.Label(root, textvariable=status_var).grid(row=3, column=0, columnspan=2, sticky="w", pady=(4, 0))

    def selected_encoding() -> str:
        selection = encoding_list.curselection()
        if not selection:
            return initial_encoding or "utf-8"
        return encodings[selection[0]]

    def decode_selected():
        encoding = selected_encoding()
        try:
            text = raw.decode(encoding)
            return text, encoding, None
        except Exception as exc:
            return "", encoding, exc

    def refresh_preview(_event=None):
        text, encoding, error = decode_selected()
        preview.configure(state="normal")
        preview.delete("1.0", tk.END)
        if error:
            preview.insert("1.0", f"Không đọc được bằng {_encoding_label(encoding)}:\n{error}")
            status_var.set("Chọn encoding khác.")
        else:
            preview.insert("1.0", text[:20000])
            status_var.set(f"Preview: {_encoding_label(encoding)} [{encoding}]")
        preview.configure(state="disabled")

    def ok():
        text, encoding, error = decode_selected()
        if error:
            messagebox.showerror("Encoding", f"Không đọc được bằng {_encoding_label(encoding)}:\n{error}", parent=win)
            return
        result["text"] = text
        result["encoding"] = encoding
        win.destroy()

    def cancel():
        win.destroy()

    initial_encoding = (initial_encoding or "utf-8").lower()
    try:
        encoding_list.selection_set(encodings.index(initial_encoding))
        encoding_list.see(encodings.index(initial_encoding))
    except ValueError:
        encoding_list.selection_set(0)
    encoding_list.bind("<<ListboxSelect>>", refresh_preview)
    encoding_list.bind("<Double-1>", lambda _e: ok())
    refresh_preview()

    buttons = ttk.Frame(root)
    buttons.grid(row=4, column=0, columnspan=2, sticky="e", pady=(10, 0))
    ttk.Button(buttons, text="OK", command=ok).pack(side=tk.LEFT)
    ttk.Button(buttons, text="Cancel", command=cancel).pack(side=tk.LEFT, padx=(6, 0))
    win.protocol("WM_DELETE_WINDOW", cancel)
    try:
        win.wait_window()
    except Exception:
        pass
    if result["text"] is None or result["encoding"] is None:
        return None
    return result["text"], result["encoding"]


def read_text_file_auto(
    path: str,
    *,
    parent=None,
    interactive: bool = False,
    force_dialog: bool = False,
) -> tuple[str, str]:
    with open(path, "rb") as handle:
        raw = handle.read()
    text, encoding, score = _decode_text_bytes_auto(raw)
    if parent is not None and (force_dialog or (interactive and _needs_encoding_dialog(text, encoding, score))):
        selected = select_text_encoding_dialog(parent, path, raw, encoding)
        if selected:
            return selected
        if force_dialog:
            raise ValueError("Đã hủy chọn mã văn bản.")
    return text, encoding


def _snippet(text: str, start: int, end: int, radius: int = 34) -> str:
    left = max(0, start - radius)
    right = min(len(text), end + radius)
    prefix = "..." if left > 0 else ""
    suffix = "..." if right < len(text) else ""
    return (prefix + text[left:right].replace("\n", "\\n") + suffix).strip()


def _clean_preview_text(text: str) -> str:
    return (text or "").replace("\t", "    ").replace("\r", "").replace("\n", "\\n")


def _crop_preview_line(line: str, start: int, end: int, radius: int = 70) -> str:
    left = max(0, start - radius)
    right = min(len(line), end + radius)
    prefix = "..." if left > 0 else ""
    suffix = "..." if right < len(line) else ""
    return _clean_preview_text(prefix + line[left:right] + suffix)


def _preview_line_change(content: str, start: int, end: int, replacement: str) -> tuple[int, str, str]:
    line_start = content.rfind("\n", 0, start) + 1
    line_end = content.find("\n", end)
    if line_end == -1:
        line_end = len(content)
    line = content[line_start:line_end]
    rel_start = max(0, start - line_start)
    rel_end = max(rel_start, end - line_start)
    changed = line[:rel_start] + replacement + line[rel_end:]
    line_no = content.count("\n", 0, start) + 1
    return (
        line_no,
        _crop_preview_line(line, rel_start, rel_end),
        _crop_preview_line(changed, rel_start, rel_start + len(replacement)),
    )


def _path_autosave_id(path: str) -> str:
    digest = hashlib.sha1(os.path.normcase(os.path.normpath(path)).encode("utf-8", errors="ignore")).hexdigest()
    return f"file-{digest}"


def _content_hash(content: str) -> str:
    return hashlib.sha1((content or "").encode("utf-8", errors="ignore")).hexdigest()


class TextOpsWindow(tk.Toplevel):
    def __init__(
        self,
        app,
        state_store: TextOpsStateStore,
        *,
        initial_file: str = "",
        quick_toc_text: str = "",
    ):
        super().__init__(app)
        self.app = app
        self.state_store = state_store
        self.docs: dict[str, dict] = {}
        self._dialog_refs: dict[str, tk.Toplevel] = {}
        self._font_controls_updating = False
        self.title("Xử lý văn bản")
        self.geometry("980x720")
        self.minsize(720, 480)
        try:
            app._apply_window_icon(self)
        except Exception:
            pass

        self._configure_textops_styles()
        self._build_menu()
        self._build_body()
        self.protocol("WM_DELETE_WINDOW", self.close_window)
        self.bind("<Control-o>", lambda _e: self.open_file_dialog())
        self.bind("<Control-s>", lambda _e: self.save_current())
        self.bind("<Control-Shift-S>", lambda _e: self.save_current_as())
        self.bind("<Control-f>", lambda _e: self.open_find_dialog())
        self.bind("<Control-h>", lambda _e: self.open_replace_dialog())
        self.bind("<Control-n>", lambda _e: self.new_document())
        self.bind("<Control-w>", lambda _e: (self.close_current_tab(), "break")[1])
        self.bind("<Control-W>", lambda _e: (self.close_current_tab(), "break")[1])
        self.bind("<Control-Shift-W>", lambda _e: (self.close_other_tabs(), "break")[1])
        self.bind("<Control-Alt-w>", lambda _e: (self.close_all_tabs(), "break")[1])
        self.bind("<Control-Alt-W>", lambda _e: (self.close_all_tabs(), "break")[1])

        opened_initial = False
        if initial_file:
            opened_initial = self.open_file(initial_file)
        restored = self._restore_autosave_docs()
        if not opened_initial and not restored:
            self.new_document()
        if quick_toc_text:
            self.open_quick_tools_dialog(initial_toc=quick_toc_text)
        self._refresh_controls()

    def _build_menu(self):
        self.menubar = tk.Menu(self)
        self.config(menu=self.menubar)

        self.file_menu = tk.Menu(self.menubar, tearoff=False)
        self.file_menu.add_command(label="Mở cửa sổ mới", command=self.app._open_text_ops_window)
        self.file_menu.add_command(label="Tab mới", accelerator="Ctrl+N", command=self.new_document)
        self.file_menu.add_command(label="Mở...", accelerator="Ctrl+O", command=self.open_file_dialog)
        self.file_menu.add_command(label="Mở lại với mã...", command=self.reopen_current_with_encoding)
        self.file_menu.add_command(label="Lưu", accelerator="Ctrl+S", command=self.save_current)
        self.file_menu.add_command(label="Lưu như...", accelerator="Ctrl+Shift+S", command=self.save_current_as)
        self.file_menu.add_command(label="Chọn mã lưu...", command=self.choose_save_encoding)
        self.file_menu.add_separator()
        self.file_menu.add_command(label="Đóng tab", accelerator="Ctrl+W", command=self.close_current_tab)
        self.file_menu.add_command(label="Đóng tab khác", accelerator="Ctrl+Shift+W", command=self.close_other_tabs)
        self.file_menu.add_command(label="Đóng tất cả tab", accelerator="Ctrl+Alt+W", command=self.close_all_tabs)
        self.file_menu.add_command(label="Đóng cửa sổ", command=self.close_window)
        self.menubar.add_cascade(label="File", menu=self.file_menu)

        self.edit_menu = tk.Menu(self.menubar, tearoff=False)
        self.edit_menu.add_command(label="Hoàn tác", accelerator="Ctrl+Z", command=self.undo_current)
        self.edit_menu.add_command(label="Làm lại", accelerator="Ctrl+Y", command=self.redo_current)
        self.menubar.add_cascade(label="Sửa", menu=self.edit_menu)

        self.search_menu = tk.Menu(self.menubar, tearoff=False)
        self.search_menu.add_command(label="Tìm...", accelerator="Ctrl+F", command=self.open_find_dialog)
        self.search_menu.add_command(label="Tìm & Thay thế...", accelerator="Ctrl+H", command=self.open_replace_dialog)
        self.menubar.add_cascade(label="Tìm kiếm", menu=self.search_menu)

        self.tools_menu = tk.Menu(self.menubar, tearoff=False)
        self.tools_menu.add_command(label="Chia file...", command=self.open_split_dialog)
        self.tools_menu.add_command(label="Công cụ nhanh...", command=self.open_quick_tools_dialog)
        self.tools_menu.add_command(label="Xóa rác...", command=self.open_junk_remover)
        self.menubar.add_cascade(label="Công cụ", menu=self.tools_menu)

        self.view_menu = tk.Menu(self.menubar, tearoff=False)
        self.toolbar_visible_var = tk.BooleanVar(value=self.state_store.get_toolbar_visible())
        self.view_menu.add_checkbutton(
            label="Hiện thanh công cụ",
            variable=self.toolbar_visible_var,
            command=self.toggle_toolbar,
        )
        self.view_menu.add_separator()
        self.view_menu.add_command(label="Áp dụng font", command=self.apply_font_from_controls)
        self.menubar.add_cascade(label="Hiển thị", menu=self.view_menu)

        help_menu = tk.Menu(self.menubar, tearoff=False)
        help_menu.add_command(label="Hướng dẫn Xử lý văn bản", command=self.open_guide)
        self.menubar.add_cascade(label="Trợ giúp", menu=help_menu)

    def _configure_textops_styles(self):
        try:
            default_font = tkfont.nametofont("TkDefaultFont").copy()
            default_font.configure(weight="bold")
            self._doc_title_font = default_font
            self._doc_path_font = tkfont.nametofont("TkSmallCaptionFont").copy()
        except Exception:
            self._doc_title_font = (TEXTOPS_FALLBACK_FONT, 10, "bold")
            self._doc_path_font = (TEXTOPS_FALLBACK_FONT, 9)
        try:
            style = ttk.Style(self)
            style.configure(
                "TextOps.TNotebook.Tab",
                font=(TEXTOPS_FALLBACK_FONT, 10, "bold"),
                padding=(10, 5),
                foreground="#111827",
            )
            style.map("TextOps.TNotebook.Tab", foreground=[("selected", "#000000"), ("!selected", "#1f2937")])
            style.configure("TextOpsSplit.Treeview", font=(TEXTOPS_FALLBACK_FONT, 13), rowheight=40)
            style.configure("TextOpsSplit.Treeview.Heading", font=(TEXTOPS_FALLBACK_FONT, 10, "bold"))
        except Exception:
            pass

    def _build_body(self):
        root = ttk.Frame(self, padding=(8, 8, 8, 4))
        root.pack(fill=tk.BOTH, expand=True)
        root.rowconfigure(1, weight=1)
        root.columnconfigure(0, weight=1)

        self.toolbar = ttk.Frame(root)
        self.toolbar.grid(row=0, column=0, sticky="ew", pady=(0, 6))
        toolbar = self.toolbar
        ttk.Button(toolbar, text="Mở", command=self.open_file_dialog).pack(side=tk.LEFT)
        ttk.Button(toolbar, text="Lưu", command=self.save_current).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(toolbar, text="Tìm", command=self.open_find_dialog).pack(side=tk.LEFT, padx=(12, 0))
        ttk.Button(toolbar, text="Tìm & Thay", command=self.open_replace_dialog).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(toolbar, text="Chia file", command=self.open_split_dialog).pack(side=tk.LEFT, padx=(12, 0))
        ttk.Button(toolbar, text="Công cụ nhanh", command=self.open_quick_tools_dialog).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(toolbar, text="Xóa rác", command=self.open_junk_remover).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(toolbar, text="Thu gọn", command=self.hide_toolbar).pack(side=tk.LEFT, padx=(12, 0))

        ttk.Label(toolbar, text="Tìm font:").pack(side=tk.LEFT, padx=(18, 4))
        installed_families = set(tkfont.families(self))
        self.installed_font_families = installed_families
        self.font_families = sorted(
            installed_families
            | {TEXTOPS_CHINESE_FONT, TEXTOPS_VIETNAMESE_FONT, TEXTOPS_FALLBACK_FONT}
            | set(TEXTOPS_MIXED_FONT_CANDIDATES)
        )
        family, size = self.state_store.get_font()
        self.font_search_var = tk.StringVar()
        self.font_family_var = tk.StringVar(value=family)
        self.font_size_var = tk.IntVar(value=size)
        self.font_bold_var = tk.BooleanVar(value=self.state_store.get_font_weight() == "bold")
        self.font_search_entry = ttk.Entry(toolbar, width=14, textvariable=self.font_search_var)
        self.font_search_entry.pack(side=tk.LEFT)
        self.font_combo = ttk.Combobox(toolbar, values=self.font_families, width=22, textvariable=self.font_family_var)
        self.font_combo.pack(side=tk.LEFT)
        self.font_size_spin = ttk.Spinbox(toolbar, from_=8, to=36, width=4, textvariable=self.font_size_var, command=self.apply_font_from_controls)
        self.font_size_spin.pack(side=tk.LEFT, padx=(4, 0))
        self.font_bold_check = ttk.Checkbutton(toolbar, text="Đậm", variable=self.font_bold_var, command=self.apply_font_from_controls)
        self.font_bold_check.pack(side=tk.LEFT, padx=(6, 0))
        self.font_combo.bind("<<ComboboxSelected>>", lambda _e: self.apply_font_from_controls())
        self.font_combo.bind("<Return>", lambda _e: self.apply_font_from_controls())
        self.font_search_entry.bind("<KeyRelease>", self._filter_font_list)
        self.font_search_entry.bind("<Return>", self._select_first_font_match)
        self.font_size_spin.bind("<Return>", lambda _e: self.apply_font_from_controls())
        if not self.toolbar_visible_var.get():
            self.toolbar.grid_remove()

        self.notebook = ttk.Notebook(root)
        try:
            self.notebook.configure(style="TextOps.TNotebook")
        except Exception:
            pass
        self.notebook.grid(row=1, column=0, sticky="nsew")
        self.notebook.bind("<<NotebookTabChanged>>", lambda _e: self._refresh_controls())

        self.status_var = tk.StringVar(value="Sẵn sàng.")
        ttk.Label(root, textvariable=self.status_var).grid(row=2, column=0, sticky="ew", pady=(4, 0))

    def _current_doc(self) -> dict | None:
        tab_id = self.notebook.select()
        if not tab_id:
            return None
        return self.docs.get(tab_id)

    def _current_text(self):
        doc = self._current_doc()
        return doc.get("text") if doc else None

    def hide_toolbar(self):
        self.toolbar_visible_var.set(False)
        self.toggle_toolbar()

    def toggle_toolbar(self):
        visible = bool(self.toolbar_visible_var.get())
        if visible:
            self.toolbar.grid()
        else:
            self.toolbar.grid_remove()
        self.state_store.set_toolbar_visible(visible)

    def _filter_font_list(self, _event=None):
        term = self.font_search_var.get().strip().lower()
        values = [family for family in self.font_families if term in family.lower()] if term else list(self.font_families)
        self.font_combo.configure(values=values or self.font_families)

    def _select_first_font_match(self, _event=None):
        values = list(self.font_combo.cget("values") or [])
        if values:
            self.font_family_var.set(values[0])
            self.apply_font_from_controls()
        return "break"

    def _safe_font_family(self, family: str) -> str:
        family = (family or "").strip()
        if family:
            return family
        if TEXTOPS_FALLBACK_FONT in self.installed_font_families:
            return TEXTOPS_FALLBACK_FONT
        try:
            return tkfont.nametofont("TkDefaultFont").actual("family")
        except Exception:
            return TEXTOPS_FALLBACK_FONT

    def _first_available_font(self, *families: str) -> str:
        installed = getattr(self, "installed_font_families", set()) or set()
        for family in families:
            family = (family or "").strip()
            if family and family in installed:
                return family
        return self._safe_font_family(TEXTOPS_FALLBACK_FONT)

    def _detect_font_family(self, content: str) -> str:
        sample = (content or "")[:30000]
        chinese_count = len(CHINESE_CHAR_RE.findall(sample))
        vietnamese_count = sum(1 for ch in sample if ch in VIETNAMESE_MARKS)
        if chinese_count and vietnamese_count:
            return self._first_available_font(*TEXTOPS_MIXED_FONT_CANDIDATES)
        if chinese_count:
            return self._safe_font_family(TEXTOPS_CHINESE_FONT)
        if vietnamese_count:
            return self._safe_font_family(TEXTOPS_VIETNAMESE_FONT)
        return self._safe_font_family(TEXTOPS_FALLBACK_FONT)

    def _set_doc_font(
        self,
        doc: dict,
        family: str,
        size: int | None = None,
        *,
        manual: bool = False,
        weight: str | None = None,
    ):
        if not doc:
            return
        try:
            size = int(size or doc.get("font_size") or self.font_size_var.get() or 11)
        except Exception:
            size = 11
        size = max(8, min(36, size))
        family = self._safe_font_family(family)
        if weight is None:
            weight = doc.get("font_weight") or self.state_store.get_font_weight()
        weight = "bold" if str(weight).lower() == "bold" else "normal"
        doc["font_family"] = family
        doc["font_size"] = size
        doc["font_weight"] = weight
        if manual:
            doc["font_manual"] = True
            self.state_store.set_font(family, size, weight)
        try:
            doc["text"].configure(font=(family, size, weight))
        except Exception:
            pass
        if self._current_doc() is doc:
            self._sync_font_controls_with_doc(doc)

    def _auto_apply_font_for_doc(self, doc: dict, content: str | None = None):
        if not doc or doc.get("font_manual"):
            return
        if content is None:
            content = doc["text"].get("1.0", "1.0+30000c")
        family = self._detect_font_family(content)
        self._set_doc_font(doc, family, doc.get("font_size") or self.font_size_var.get(), manual=False)

    def _sync_font_controls_with_doc(self, doc: dict | None):
        if not doc:
            return
        self._font_controls_updating = True
        try:
            self.font_family_var.set(doc.get("font_family") or self.state_store.get_font()[0])
            self.font_size_var.set(int(doc.get("font_size") or self.state_store.get_font()[1]))
            self.font_bold_var.set((doc.get("font_weight") or self.state_store.get_font_weight()) == "bold")
        finally:
            self._font_controls_updating = False

    def _restore_autosave_docs(self) -> bool:
        restored = False
        for item in reversed(self.state_store.get_autosave_docs()):
            doc_id = str(item.get("id") or "")
            path = os.path.normpath(str(item.get("path") or "")) if item.get("path") else ""
            if self._has_doc_autosave(doc_id, path):
                continue
            content = str(item.get("content") or "")
            title = os.path.basename(path) if path else str(item.get("title") or "Chưa lưu")
            baseline = ""
            if path and os.path.exists(path):
                try:
                    baseline, _encoding = read_text_file_auto(path)
                except Exception:
                    baseline = ""
            doc = self.new_document(content=content, title=title, autosave_id=doc_id, baseline_content=baseline)
            doc["path"] = path
            doc["encoding"] = str(item.get("encoding") or "utf-8")
            doc["save_encoding"] = "utf-8"
            doc["font_manual"] = False
            self._auto_apply_font_for_doc(doc, content)
            self._refresh_doc_modified_state(doc, content)
            self._update_doc_title(doc)
            self._set_status_for_doc(doc)
            restored = True
        if restored:
            self.app.log("Đã khôi phục bản lưu tạm Xử lý văn bản.")
        return restored

    def _has_doc_autosave(self, autosave_id: str, path: str = "") -> bool:
        target_path = os.path.normcase(os.path.normpath(path)) if path else ""
        for doc in self.docs.values():
            if autosave_id and str(doc.get("autosave_id") or "") == autosave_id:
                return True
            doc_path = doc.get("path") or ""
            if target_path and os.path.normcase(os.path.normpath(doc_path)) == target_path:
                return True
        return False

    def _schedule_autosave(self, doc: dict):
        if not doc or not doc.get("modified"):
            return
        after_id = doc.get("autosave_after_id")
        if after_id:
            try:
                self.after_cancel(after_id)
            except Exception:
                pass
        doc["autosave_after_id"] = self.after(TEXTOPS_AUTOSAVE_DELAY_MS, lambda d=doc: self._autosave_doc(d))

    def _autosave_doc(self, doc: dict):
        if not doc or doc.get("tab_id") not in self.docs:
            return
        doc["autosave_after_id"] = None
        if not doc.get("modified"):
            return
        content = doc["text"].get("1.0", "end-1c")
        if not content and not doc.get("path"):
            return
        doc_id = doc.get("autosave_id") or f"draft-{uuid.uuid4().hex}"
        doc["autosave_id"] = doc_id
        self.state_store.save_autosave_doc(
            doc_id,
            path=doc.get("path") or "",
            title=doc.get("title") or "Chưa lưu",
            encoding=doc.get("encoding") or "utf-8",
            content=content,
            modified=True,
        )
        if self._current_doc() is doc:
            self._set_status_for_doc(doc)

    def _remove_autosave_for_doc(self, doc: dict):
        after_id = doc.get("autosave_after_id")
        if after_id:
            try:
                self.after_cancel(after_id)
            except Exception:
                pass
        doc["autosave_after_id"] = None
        doc_id = doc.get("autosave_id")
        if doc_id:
            self.state_store.remove_autosave_doc(str(doc_id))

    def _doc_content(self, doc: dict) -> str:
        text = doc.get("text")
        return text.get("1.0", "end-1c") if text else ""

    def _set_doc_baseline(self, doc: dict, content: str):
        doc["baseline_hash"] = _content_hash(content)

    def _refresh_doc_modified_state(self, doc: dict, content: str | None = None):
        if not doc:
            return
        if content is None:
            content = self._doc_content(doc)
        doc["modified"] = _content_hash(content) != doc.get("baseline_hash")
        if doc.get("modified"):
            self._schedule_autosave(doc)
        else:
            self._remove_autosave_for_doc(doc)
        self._update_doc_title(doc)
        self._set_status_for_doc(doc)
        self._refresh_controls()

    def _doc_title(self, doc: dict) -> str:
        name = os.path.basename(doc.get("path") or "") or doc.get("title") or "Chưa lưu"
        return f"*{name}" if doc.get("modified") else name

    def _update_doc_title(self, doc: dict):
        tab_id = doc.get("tab_id")
        if tab_id:
            self.notebook.tab(tab_id, text=self._doc_title(doc))

    def _set_status_for_doc(self, doc: dict | None = None):
        doc = doc or self._current_doc()
        if not doc:
            self.status_var.set("Không có tài liệu.")
            return
        path = doc.get("path") or "Chưa lưu"
        encoding = doc.get("encoding") or "utf-8"
        save_encoding = doc.get("save_encoding") or "utf-8"
        state = "đã sửa" if doc.get("modified") else "đã lưu"
        self.status_var.set(
            f"{path}  |  đọc: {_encoding_label(encoding)} [{encoding}]"
            f"  |  lưu: {_encoding_label(save_encoding)} [{save_encoding}]  |  {state}"
        )

    def _on_text_modified(self, doc: dict):
        text = doc.get("text")
        if not text:
            return
        if text.edit_modified():
            text.edit_modified(False)
            if not doc.get("font_manual"):
                self._auto_apply_font_for_doc(doc)
            self._refresh_doc_modified_state(doc)

    def new_document(
        self,
        content: str = "",
        title: str = "Chưa lưu",
        *,
        autosave_id: str = "",
        baseline_content: str | None = None,
    ) -> dict:
        baseline_content = content if baseline_content is None else baseline_content
        frame = ttk.Frame(self.notebook)
        frame.rowconfigure(0, weight=1)
        frame.columnconfigure(0, weight=1)
        text = scrolledtext.ScrolledText(frame, wrap=tk.WORD, undo=True)
        text.grid(row=0, column=0, sticky="nsew")
        _, size = self.state_store.get_font()
        weight = self.state_store.get_font_weight()
        family = self._detect_font_family(content)
        text.configure(font=(family, size, weight))
        doc = {
            "tab_id": "",
            "frame": frame,
            "text": text,
            "path": "",
            "encoding": "utf-8",
            "save_encoding": "utf-8",
            "modified": _content_hash(content) != _content_hash(baseline_content),
            "title": title,
            "autosave_id": autosave_id or f"draft-{uuid.uuid4().hex}",
            "autosave_after_id": None,
            "baseline_hash": _content_hash(baseline_content),
            "font_family": family,
            "font_size": size,
            "font_weight": weight,
            "font_manual": False,
        }
        self.notebook.add(frame, text="")
        tab_id = self.notebook.tabs()[-1]
        doc["tab_id"] = tab_id
        self.docs[tab_id] = doc
        if content:
            text.insert("1.0", content)
            text.edit_reset()
        text.edit_modified(False)
        text.bind("<<Modified>>", lambda _e, d=doc: self._on_text_modified(d))
        self._update_doc_title(doc)
        self.notebook.select(tab_id)
        self._set_status_for_doc(doc)
        return doc

    def open_file_dialog(self):
        paths = filedialog.askopenfilenames(
            title="Mở file văn bản",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
            parent=self,
        )
        for path in paths:
            self.open_file(path)

    def open_file(self, path: str) -> bool:
        if not path:
            return False
        path = os.path.normpath(path)
        for doc in list(self.docs.values()):
            if os.path.normcase(doc.get("path") or "") == os.path.normcase(path):
                self.notebook.select(doc["tab_id"])
                self.focus_force()
                return True
        autosaved = self.state_store.find_autosave_for_path(path)
        if autosaved:
            content = str(autosaved.get("content") or "")
            encoding = str(autosaved.get("encoding") or "utf-8")
            try:
                baseline, _baseline_encoding = read_text_file_auto(path)
            except Exception:
                baseline = ""
            doc = self.new_document(
                content=content,
                title=os.path.basename(path),
                autosave_id=str(autosaved.get("id") or _path_autosave_id(path)),
                baseline_content=baseline,
            )
            self.app.log(f"Đã mở bản lưu tạm của '{os.path.basename(path)}' trong Xử lý văn bản.")
        else:
            try:
                content, encoding = read_text_file_auto(path, parent=self, interactive=True)
            except Exception as exc:
                messagebox.showerror("Lỗi", f"Không thể đọc file:\n{path}\n\n{exc}", parent=self)
                return False
            doc = self.new_document(
                content=content,
                title=os.path.basename(path),
                autosave_id=_path_autosave_id(path),
                baseline_content=content,
            )
        doc["path"] = path
        doc["encoding"] = encoding
        doc["save_encoding"] = "utf-8"
        text = doc["text"]
        text.edit_reset()
        text.edit_modified(False)
        self._auto_apply_font_for_doc(doc, content)
        self._refresh_doc_modified_state(doc, content)
        self._update_doc_title(doc)
        self._set_status_for_doc(doc)
        self.state_store.record_file(path)
        if not autosaved:
            self.app.log(f"Đã mở file '{os.path.basename(path)}' trong Xử lý văn bản.")
        return True

    def save_current(self) -> bool:
        doc = self._current_doc()
        if not doc:
            return False
        if not doc.get("path"):
            return self.save_current_as()
        return self._save_doc_to_path(doc, doc["path"])

    def save_current_as(self) -> bool:
        doc = self._current_doc()
        if not doc:
            return False
        initial = os.path.basename(doc.get("path") or "untitled.txt")
        path = filedialog.asksaveasfilename(
            title="Lưu như",
            initialfile=initial,
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
            parent=self,
        )
        if not path:
            return False
        return self._save_doc_to_path(doc, path)

    def choose_save_encoding(self):
        doc = self._current_doc()
        if not doc:
            return
        win = tk.Toplevel(self)
        win.title("Chọn mã lưu")
        win.geometry("420x150")
        win.resizable(False, False)
        try:
            win.transient(self)
            win.grab_set()
        except Exception:
            pass
        frame = ttk.Frame(win, padding=12)
        frame.pack(fill=tk.BOTH, expand=True)
        ttk.Label(frame, text="Mã lưu file:").grid(row=0, column=0, sticky="w")
        values = _encoding_combo_values(SAVE_TEXT_ENCODINGS)
        current = doc.get("save_encoding") or "utf-8"
        var = tk.StringVar(value=f"{_encoding_label(current)} [{current}]")
        combo = ttk.Combobox(frame, values=values, textvariable=var, state="readonly", width=32)
        combo.grid(row=0, column=1, sticky="ew", padx=(8, 0))
        frame.columnconfigure(1, weight=1)
        ttk.Label(frame, text="Mặc định nên dùng UTF-8 để tránh lỗi Unicode khi mở lại.").grid(
            row=1, column=0, columnspan=2, sticky="w", pady=(8, 0)
        )

        def apply():
            encoding = _encoding_from_combo_value(var.get())
            doc["save_encoding"] = encoding or "utf-8"
            self._update_doc_title(doc)
            self._set_status_for_doc(doc)
            win.destroy()

        buttons = ttk.Frame(frame)
        buttons.grid(row=2, column=0, columnspan=2, sticky="e", pady=(14, 0))
        ttk.Button(buttons, text="OK", command=apply).pack(side=tk.LEFT)
        ttk.Button(buttons, text="Đóng", command=win.destroy).pack(side=tk.LEFT, padx=(6, 0))

    def reopen_current_with_encoding(self):
        doc = self._current_doc()
        if not doc or not doc.get("path"):
            messagebox.showinfo("Mở lại với mã", "Tài liệu hiện tại chưa có file trên đĩa.", parent=self)
            return
        if doc.get("modified"):
            response = messagebox.askyesnocancel(
                "Mở lại với mã",
                "Tài liệu đang có thay đổi chưa lưu. Lưu trước khi mở lại không?",
                parent=self,
            )
            if response is None:
                return
            if response is True and not self.save_current():
                return
        path = doc["path"]
        try:
            content, encoding = read_text_file_auto(path, parent=self, force_dialog=True)
        except Exception as exc:
            messagebox.showerror("Lỗi", f"Không thể đọc file:\n{path}\n\n{exc}", parent=self)
            return
        text = doc["text"]
        text.delete("1.0", tk.END)
        text.insert("1.0", content)
        text.edit_reset()
        text.edit_modified(False)
        doc["encoding"] = encoding
        doc["save_encoding"] = "utf-8"
        self._set_doc_baseline(doc, content)
        self._auto_apply_font_for_doc(doc, content)
        self._refresh_doc_modified_state(doc, content)
        self._update_doc_title(doc)
        self._set_status_for_doc(doc)

    def _save_doc_to_path(self, doc: dict, path: str) -> bool:
        try:
            content = doc["text"].get("1.0", "end-1c")
            save_encoding = doc.get("save_encoding") or "utf-8"
            with open(path, "w", encoding=save_encoding) as handle:
                handle.write(content)
            old_autosave_id = doc.get("autosave_id")
            doc["path"] = os.path.normpath(path)
            doc["autosave_id"] = _path_autosave_id(doc["path"])
            doc["encoding"] = save_encoding
            doc["save_encoding"] = save_encoding
            doc["modified"] = False
            self._set_doc_baseline(doc, content)
            doc["text"].edit_modified(False)
            if old_autosave_id:
                self.state_store.remove_autosave_doc(str(old_autosave_id))
            self.state_store.remove_autosave_doc(str(doc["autosave_id"]))
            self._update_doc_title(doc)
            self._set_status_for_doc(doc)
            self.state_store.record_file(path)
            self.app.log(f"Đã lưu file TextOps: {os.path.basename(path)}")
            return True
        except Exception as exc:
            messagebox.showerror("Lỗi", f"Không thể lưu file:\n{exc}", parent=self)
            return False

    def close_current_tab(self) -> bool:
        tab_id = self.notebook.select()
        return self.close_tab(tab_id)

    def close_other_tabs(self) -> bool:
        current = self.notebook.select()
        for tab_id in list(self.notebook.tabs()):
            if tab_id != current and not self.close_tab(tab_id):
                return False
        return True

    def close_all_tabs(self) -> bool:
        for tab_id in list(self.notebook.tabs()):
            if tab_id in self.docs and not self.close_tab(tab_id):
                return False
        return True

    def close_tab(self, tab_id: str) -> bool:
        doc = self.docs.get(tab_id)
        if not doc:
            return True
        if not self._confirm_close_doc(doc):
            return False
        self._remove_autosave_for_doc(doc)
        self.notebook.forget(tab_id)
        self.docs.pop(tab_id, None)
        if not self.docs:
            self.new_document()
        self._refresh_controls()
        return True

    def _confirm_close_doc(self, doc: dict) -> bool:
        if not doc.get("modified"):
            return True
        name = os.path.basename(doc.get("path") or "") or doc.get("title") or "Chưa lưu"
        response = messagebox.askyesnocancel(
            "Lưu thay đổi?",
            f"'{name}' có thay đổi chưa lưu. Lưu trước khi đóng không?",
            parent=self,
        )
        if response is None:
            return False
        if response is True:
            current = self.notebook.select()
            self.notebook.select(doc["tab_id"])
            ok = self.save_current()
            if current:
                try:
                    self.notebook.select(current)
                except Exception:
                    pass
            return ok
        return True

    def close_window(self) -> bool:
        for doc in list(self.docs.values()):
            if not self._confirm_close_doc(doc):
                return False
            self._remove_autosave_for_doc(doc)
        try:
            self.app._text_ops_windows.discard(self)
        except Exception:
            pass
        self.destroy()
        return True

    def undo_current(self):
        text = self._current_text()
        if text:
            try:
                text.edit_undo()
            except tk.TclError:
                pass

    def redo_current(self):
        text = self._current_text()
        if text:
            try:
                text.edit_redo()
            except tk.TclError:
                pass

    def apply_font_from_controls(self):
        if self._font_controls_updating:
            return
        doc = self._current_doc()
        if not doc:
            return
        family = self.font_family_var.get().strip() or TEXTOPS_FALLBACK_FONT
        try:
            size = int(self.font_size_var.get())
        except Exception:
            size = 11
        weight = "bold" if self.font_bold_var.get() else "normal"
        self._set_doc_font(doc, family, size, manual=True, weight=weight)

    def _add_combo_history(self, combo: ttk.Combobox, history_key: str, pin_key: str = ""):
        value = combo.get().strip()
        if value:
            self.state_store.add_history_value(history_key, value)
        values = self.state_store.history_with_pins(history_key, pin_key) if pin_key else self.state_store.get_list(history_key)
        combo.configure(values=values)

    def _make_history_combo(self, parent, history_key: str, pin_key: str = "", width: int = 34):
        values = self.state_store.history_with_pins(history_key, pin_key) if pin_key else self.state_store.get_list(history_key)
        combo = ttk.Combobox(parent, values=values, width=width)
        return combo

    def _toggle_window_maximized(self, win, button=None):
        try:
            if win.state() == "zoomed":
                win.state("normal")
                if button:
                    button.configure(text="Phóng to")
            else:
                win.state("zoomed")
                if button:
                    button.configure(text="Thu nhỏ")
            return
        except Exception:
            pass
        try:
            full = bool(win.attributes("-fullscreen"))
            win.attributes("-fullscreen", not full)
            if button:
                button.configure(text="Thu nhỏ" if not full else "Phóng to")
        except Exception:
            pass

    def _make_maximize_button(self, parent, win):
        button = ttk.Button(parent, text="Phóng to")
        button.configure(command=lambda: self._toggle_window_maximized(win, button))
        return button

    def _make_scrollable_content(self, parent):
        container = ttk.Frame(parent)
        canvas = tk.Canvas(container, highlightthickness=0)
        scrollbar = ttk.Scrollbar(container, orient="vertical", command=canvas.yview)
        inner = ttk.Frame(canvas)
        window_id = canvas.create_window((0, 0), window=inner, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        def update_scrollregion(_event=None):
            canvas.configure(scrollregion=canvas.bbox("all"))

        def sync_width(event):
            canvas.itemconfigure(window_id, width=event.width)

        inner.bind("<Configure>", update_scrollregion)
        canvas.bind("<Configure>", sync_width)

        def wheel(event):
            delta = event.delta
            if delta == 0 and getattr(event, "num", None) in (4, 5):
                delta = 120 if event.num == 4 else -120
            canvas.yview_scroll(int(-1 * (delta / 120)), "units")

        def bind_wheel(_event):
            canvas.bind_all("<MouseWheel>", wheel)
            canvas.bind_all("<Button-4>", wheel)
            canvas.bind_all("<Button-5>", wheel)

        def unbind_wheel(_event):
            canvas.unbind_all("<MouseWheel>")
            canvas.unbind_all("<Button-4>")
            canvas.unbind_all("<Button-5>")

        container.bind("<Enter>", bind_wheel)
        container.bind("<Leave>", unbind_wheel)
        return container, inner

    def _sync_textops_pin_button(self, combo, pin_key: str, button):
        if not button:
            return
        value = combo.get().strip()
        button.configure(text="Bỏ ghim" if value and value in self.state_store.get_pins(pin_key) else "Ghim")

    def _toggle_combo_pin(self, combo, history_key: str, pin_key: str, button=None):
        value = combo.get().strip()
        if not value:
            messagebox.showinfo("Ghim", "Không có nội dung để ghim.", parent=self)
            return
        self.state_store.add_history_value(history_key, value)
        self.state_store.toggle_pin(pin_key, value)
        combo.configure(values=self.state_store.history_with_pins(history_key, pin_key))
        self._sync_textops_pin_button(combo, pin_key, button)

    def open_find_dialog(self):
        self.open_find_replace_dialog("find")

    def open_replace_dialog(self):
        self.open_find_replace_dialog("replace")

    def open_find_replace_dialog(self, initial_tab: str = "find"):
        if not self._current_doc():
            return
        win = self._dialog_refs.get("find_replace")
        if win and win.winfo_exists():
            win.lift()
            notebook = getattr(win, "_find_replace_notebook", None)
            if notebook:
                try:
                    notebook.select(1 if initial_tab == "replace" else 0)
                except Exception:
                    pass
            return

        win = tk.Toplevel(self)
        self._dialog_refs["find_replace"] = win
        win.title("Tìm & Thay thế")
        win.geometry("640x300")
        win.transient(self)
        root = ttk.Frame(win, padding=10)
        root.pack(fill=tk.BOTH, expand=True)
        root.rowconfigure(0, weight=1)
        root.columnconfigure(0, weight=1)

        notebook = ttk.Notebook(root)
        notebook.grid(row=0, column=0, sticky="nsew")
        win._find_replace_notebook = notebook

        find_var = tk.StringVar()
        replace_var = tk.StringVar()
        current_text = self._current_text()
        if current_text:
            try:
                selected_text = current_text.get(tk.SEL_FIRST, tk.SEL_LAST)
                if selected_text and "\n" not in selected_text and len(selected_text) <= 200:
                    find_var.set(selected_text)
            except tk.TclError:
                pass
        opts = {
            "case": tk.BooleanVar(value=False),
            "word": tk.BooleanVar(value=False),
            "regex": tk.BooleanVar(value=False),
        }
        find_values = self.state_store.history_with_pins("find_history", "find")
        replace_find_values = self.state_store.history_with_pins("replace_find_history", "replace")
        replace_values = self.state_store.get_list("replace_history")

        def make_opts(parent, start_row: int = 1):
            ttk.Checkbutton(parent, text="Khớp hoa/thường", variable=opts["case"]).grid(row=start_row, column=0, sticky="w", pady=(8, 0))
            ttk.Checkbutton(parent, text="Toàn bộ từ", variable=opts["word"]).grid(row=start_row, column=1, sticky="w", pady=(8, 0))
            ttk.Checkbutton(parent, text="Regex", variable=opts["regex"]).grid(row=start_row + 1, column=0, sticky="w")

        find_tab = ttk.Frame(notebook, padding=10)
        find_tab.columnconfigure(1, weight=1)
        notebook.add(find_tab, text="Tìm")
        ttk.Label(find_tab, text="Tìm:").grid(row=0, column=0, sticky="w")
        find_combo = ttk.Combobox(find_tab, values=find_values, width=42, textvariable=find_var)
        find_combo.grid(row=0, column=1, sticky="ew", padx=(8, 0))
        find_pin_btn = ttk.Button(
            find_tab,
            text="Ghim",
            width=8,
            command=lambda: self._toggle_combo_pin(find_combo, "find_history", "find", find_pin_btn),
        )
        find_pin_btn.grid(row=0, column=2, sticky="e", padx=(6, 0))
        self._sync_textops_pin_button(find_combo, "find", find_pin_btn)
        make_opts(find_tab, 1)
        find_buttons = ttk.Frame(find_tab)
        find_buttons.grid(row=3, column=0, columnspan=3, sticky="e", pady=(16, 0))
        ttk.Button(find_buttons, text="Tìm tiếp", command=lambda: self._find_from_dialog(find_combo, opts, False)).pack(side=tk.LEFT)
        ttk.Button(find_buttons, text="Tìm ngược", command=lambda: self._find_from_dialog(find_combo, opts, True)).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(find_buttons, text="Đóng", command=win.destroy).pack(side=tk.LEFT, padx=(6, 0))

        replace_tab = ttk.Frame(notebook, padding=10)
        replace_tab.columnconfigure(1, weight=1)
        notebook.add(replace_tab, text="Thay thế")
        ttk.Label(replace_tab, text="Tìm:").grid(row=0, column=0, sticky="w")
        replace_find_combo = ttk.Combobox(replace_tab, values=replace_find_values, width=42, textvariable=find_var)
        replace_find_combo.grid(row=0, column=1, sticky="ew", padx=(8, 0))
        replace_find_pin_btn = ttk.Button(
            replace_tab,
            text="Ghim",
            width=8,
            command=lambda: self._toggle_combo_pin(
                replace_find_combo,
                "replace_find_history",
                "replace",
                replace_find_pin_btn,
            ),
        )
        replace_find_pin_btn.grid(row=0, column=2, sticky="e", padx=(6, 0))
        self._sync_textops_pin_button(replace_find_combo, "replace", replace_find_pin_btn)
        ttk.Label(replace_tab, text="Thay thế:").grid(row=1, column=0, sticky="w", pady=(8, 0))
        replace_combo = ttk.Combobox(replace_tab, values=replace_values, width=42, textvariable=replace_var)
        replace_combo.grid(row=1, column=1, columnspan=2, sticky="ew", padx=(8, 0), pady=(8, 0))
        make_opts(replace_tab, 2)
        replace_buttons = ttk.Frame(replace_tab)
        replace_buttons.grid(row=4, column=0, columnspan=3, sticky="e", pady=(16, 0))
        ttk.Button(
            replace_buttons,
            text="Tìm tiếp",
            command=lambda: self._find_from_dialog(replace_find_combo, opts, False, "replace_find_history", "replace"),
        ).pack(side=tk.LEFT)
        ttk.Button(
            replace_buttons,
            text="Thay thế",
            command=lambda: self._replace_current_from_dialog(
                replace_find_combo,
                replace_combo,
                opts,
                "replace_find_history",
                "replace",
            ),
        ).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(
            replace_buttons,
            text="Thay tất cả",
            command=lambda: self._replace_all_from_dialog(
                replace_find_combo,
                replace_combo,
                opts,
                "replace_find_history",
                "replace",
            ),
        ).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(replace_buttons, text="Đóng", command=win.destroy).pack(side=tk.LEFT, padx=(6, 0))

        find_combo.bind("<Return>", lambda _e: self._find_from_dialog(find_combo, opts, False))
        find_combo.bind("<<ComboboxSelected>>", lambda _e: self._sync_textops_pin_button(find_combo, "find", find_pin_btn))
        find_combo.bind("<KeyRelease>", lambda _e: self._sync_textops_pin_button(find_combo, "find", find_pin_btn))
        replace_find_combo.bind(
            "<Return>",
            lambda _e: self._find_from_dialog(replace_find_combo, opts, False, "replace_find_history", "replace"),
        )
        replace_find_combo.bind(
            "<<ComboboxSelected>>",
            lambda _e: self._sync_textops_pin_button(replace_find_combo, "replace", replace_find_pin_btn),
        )
        replace_find_combo.bind(
            "<KeyRelease>",
            lambda _e: self._sync_textops_pin_button(replace_find_combo, "replace", replace_find_pin_btn),
        )
        replace_combo.bind(
            "<Return>",
            lambda _e: self._replace_current_from_dialog(
                replace_find_combo,
                replace_combo,
                opts,
                "replace_find_history",
                "replace",
            ),
        )
        notebook.select(1 if initial_tab == "replace" else 0)
        (replace_find_combo if initial_tab == "replace" else find_combo).focus_set()

    def _find_from_dialog(self, combo, opts, search_up: bool, history_key: str = "find_history", pin_key: str = "find"):
        text = self._current_text()
        if not text:
            return
        find_what = combo.get().strip()
        if not find_what:
            return
        self._add_combo_history(combo, history_key, pin_key)
        result = TextOperations.find_text(
            text,
            find_what,
            match_case=opts["case"].get(),
            match_word=opts["word"].get(),
            use_regex=opts["regex"].get(),
            search_up=search_up,
        )
        if not result:
            messagebox.showinfo("Không tìm thấy", f"Không tìm thấy '{find_what}'.", parent=self)
            return
        start_pos, length = result
        text.tag_remove(tk.SEL, "1.0", tk.END)
        end_pos = f"{start_pos}+{length}c"
        text.tag_add(tk.SEL, start_pos, end_pos)
        text.mark_set(tk.INSERT, end_pos)
        text.see(start_pos)
        text.focus_set()

    def _replace_preview_matches(self, find_what, replace_with, match_case, match_word, use_regex, show_all=False):
        text = self._current_text()
        if not text or not find_what:
            return [], None, 0
        content = text.get("1.0", "end-1c")
        limit = None if show_all else 200
        results = []
        total = 0
        try:
            if use_regex:
                flags = re.MULTILINE if match_case else re.MULTILINE | re.IGNORECASE
                pattern = find_what if not match_word else rf"\b(?:{find_what})\b"
                repl = re.sub(r"\$(\d)", r"\\\1", replace_with)
                for match in re.finditer(pattern, content, flags):
                    total += 1
                    if not limit or len(results) < limit:
                        replacement = match.expand(repl)
                        line_no, before, after = _preview_line_change(content, match.start(), match.end(), replacement)
                        results.append({
                            "line": line_no,
                            "match": _clean_preview_text(match.group(0)),
                            "before": before,
                            "after": after,
                        })
            else:
                flags = 0 if match_case else re.IGNORECASE
                pattern = re.escape(find_what)
                if match_word:
                    pattern = rf"\b{pattern}\b"
                for match in re.finditer(pattern, content, flags):
                    total += 1
                    if not limit or len(results) < limit:
                        line_no, before, after = _preview_line_change(content, match.start(), match.end(), replace_with)
                        results.append({
                            "line": line_no,
                            "match": _clean_preview_text(match.group(0)),
                            "before": before,
                            "after": after,
                        })
        except re.error as exc:
            return [], f"Regex lỗi: {exc}", 0
        return results, None, total

    def _replace_current_from_dialog(
        self,
        find_combo,
        replace_combo,
        opts,
        find_history_key: str = "find_history",
        find_pin_key: str = "find",
    ):
        text = self._current_text()
        if not text:
            return
        find_what = find_combo.get().strip()
        replace_with = replace_combo.get()
        if not find_what:
            return
        self._add_combo_history(find_combo, find_history_key, find_pin_key)
        self._add_combo_history(replace_combo, "replace_history")
        if not text.tag_ranges(tk.SEL):
            self._find_from_dialog(find_combo, opts, False, find_history_key, find_pin_key)
        replaced = TextOperations.replace_text(
            text,
            find_what,
            replace_with,
            match_case=opts["case"].get(),
            use_regex=opts["regex"].get(),
        )
        if replaced:
            doc = self._current_doc()
            if doc:
                self._refresh_doc_modified_state(doc)

    def _replace_all_from_dialog(
        self,
        find_combo,
        replace_combo,
        opts,
        find_history_key: str = "find_history",
        find_pin_key: str = "find",
    ):
        text = self._current_text()
        if not text:
            return
        find_what = find_combo.get().strip()
        replace_with = replace_combo.get()
        if not find_what:
            return
        self._add_combo_history(find_combo, find_history_key, find_pin_key)
        self._add_combo_history(replace_combo, "replace_history")

        def apply_replace_all(parent=None):
            count = TextOperations.replace_all(
                text,
                find_what,
                replace_with,
                match_case=opts["case"].get(),
                match_word=opts["word"].get(),
                use_regex=opts["regex"].get(),
            )
            doc = self._current_doc()
            if doc and count:
                self._refresh_doc_modified_state(doc)
            messagebox.showinfo("Hoàn tất", f"Đã thay thế {count} kết quả.", parent=parent or self)
            return count

        choice = messagebox.askyesnocancel(
            "Thay tất cả",
            "Mở bảng preview để xem trước khi thay tất cả không?",
            parent=self,
        )
        if choice is None:
            return
        if choice is True:
            self._open_replace_preview_modal(
                find_what,
                replace_with,
                opts,
                apply_replace_all,
            )
            return
        apply_replace_all(self)

    def _open_replace_preview_modal(self, find_what, replace_with, opts, apply_replace_all):
        win = tk.Toplevel(self)
        win.title("Preview thay thế")
        win.geometry("980x520")
        win.transient(self)
        win.grab_set()
        root = ttk.Frame(win, padding=10)
        root.pack(fill=tk.BOTH, expand=True)
        root.rowconfigure(0, weight=1)
        root.columnconfigure(0, weight=1)

        cols = ("#", "Dòng", "Khớp", "Trước", "Sau")
        tree = ttk.Treeview(root, columns=cols, show="headings", height=14)
        widths = [48, 70, 180, 330, 330]
        for col, width in zip(cols, widths):
            tree.heading(col, text=col)
            tree.column(col, width=width, anchor="w")
        tree.grid(row=0, column=0, sticky="nsew")
        vsb = ttk.Scrollbar(root, orient="vertical", command=tree.yview)
        vsb.grid(row=0, column=1, sticky="ns")
        tree.configure(yscrollcommand=vsb.set)

        status_var = tk.StringVar(value="")
        ttk.Label(root, textvariable=status_var).grid(row=1, column=0, sticky="w", pady=(6, 0))

        def load_preview(show_all=False):
            matches, error, total = self._replace_preview_matches(
                find_what,
                replace_with,
                opts["case"].get(),
                opts["word"].get(),
                opts["regex"].get(),
                show_all=show_all,
            )
            tree.delete(*tree.get_children())
            if error:
                status_var.set(error)
                return
            for idx, item in enumerate(matches, 1):
                tree.insert("", "end", values=(idx, item["line"], item["match"], item["before"], item["after"]))
            if len(matches) < total:
                status_var.set(f"Đang hiển thị {len(matches)}/{total} kết quả. Nhấn Hiện tất cả nếu cần.")
            else:
                status_var.set(f"Đang hiển thị {len(matches)} kết quả.")

        def apply_and_close():
            apply_replace_all(win)
            win.destroy()

        buttons = ttk.Frame(root)
        buttons.grid(row=2, column=0, columnspan=2, sticky="e", pady=(10, 0))
        ttk.Button(buttons, text="Hiện tất cả", command=lambda: load_preview(True)).pack(side=tk.LEFT)
        ttk.Button(buttons, text="Thay tất cả", command=apply_and_close).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(buttons, text="Đóng", command=win.destroy).pack(side=tk.LEFT, padx=(6, 0))
        load_preview(False)

    def open_split_dialog(self):
        if not self._current_doc():
            return
        win = tk.Toplevel(self)
        win.title("Chia file")
        win.geometry("980x640")
        win.minsize(820, 520)
        try:
            self.app._apply_window_icon(win)
        except Exception:
            pass
        root = ttk.Frame(win, padding=10)
        root.pack(fill=tk.BOTH, expand=True)
        root.columnconfigure(0, weight=1)
        root.rowconfigure(1, weight=3)
        root.rowconfigure(2, weight=1)

        options = ttk.LabelFrame(root, text="Tùy chọn chia", padding=10)
        options.grid(row=0, column=0, sticky="ew")
        options.columnconfigure(1, weight=1)
        ttk.Label(options, text="Regex chia:").grid(row=0, column=0, sticky="w")
        regex_combo = self._make_history_combo(options, "split_regex_history", "split", width=38)
        split_values = list(regex_combo.cget("values") or [])
        regex_combo.set(split_values[0] if split_values else TEXTOPS_DEFAULT_SPLIT_REGEX)
        regex_combo.grid(row=0, column=1, sticky="ew", padx=(8, 6))
        split_pin_btn = ttk.Button(
            options,
            text="Ghim",
            width=8,
            command=lambda: self._toggle_combo_pin(regex_combo, "split_regex_history", "split", split_pin_btn),
        )
        split_pin_btn.grid(row=0, column=2, sticky="w", padx=(0, 6))
        self._sync_textops_pin_button(regex_combo, "split", split_pin_btn)
        ttk.Label(options, text="Tên file:").grid(row=1, column=0, sticky="w", pady=(6, 0))
        format_combo = self._make_history_combo(options, "split_format_history", "", width=38)
        if not format_combo.get():
            values = self.state_store.get_list("split_format_history") or ["part_{num}.txt"]
            format_combo.set(values[0])
        format_combo.grid(row=1, column=1, sticky="ew", padx=(8, 6), pady=(6, 0))
        position_var = tk.StringVar(value="before")
        ttk.Radiobutton(options, text="Chia sau regex", variable=position_var, value="after").grid(row=0, column=3, sticky="w")
        ttk.Radiobutton(options, text="Chia trước regex", variable=position_var, value="before").grid(row=1, column=3, sticky="w", pady=(6, 0))
        edit_source_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(
            options,
            text="Sửa file gốc khi lưu raw",
            variable=edit_source_var,
        ).grid(row=2, column=1, columnspan=3, sticky="w", padx=(8, 0), pady=(6, 0))
        regex_combo.bind("<<ComboboxSelected>>", lambda _e: self._sync_textops_pin_button(regex_combo, "split", split_pin_btn))
        regex_combo.bind("<KeyRelease>", lambda _e: self._sync_textops_pin_button(regex_combo, "split", split_pin_btn))

        tree_frame = ttk.Frame(root)
        tree_frame.grid(row=1, column=0, sticky="nsew", pady=(10, 0))
        tree_frame.rowconfigure(0, weight=1)
        tree_frame.columnconfigure(0, weight=1)
        tree = ttk.Treeview(
            tree_frame,
            columns=("#", "Tên file", "Bắt đầu", "Kích thước"),
            show="headings",
            style="TextOpsSplit.Treeview",
            selectmode="browse",
        )
        for col, width in zip(("#", "Tên file", "Bắt đầu", "Kích thước"), [58, 260, 520, 120]):
            tree.heading(col, text=col)
            tree.column(col, width=width, anchor="w")
        tree.grid(row=0, column=0, sticky="nsew")
        vsb = ttk.Scrollbar(tree_frame, orient="vertical", command=tree.yview)
        vsb.grid(row=0, column=1, sticky="ns")
        hsb = ttk.Scrollbar(tree_frame, orient="horizontal", command=tree.xview)
        hsb.grid(row=1, column=0, sticky="ew")
        tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)

        search_frame = ttk.LabelFrame(root, text="Tìm trong kết quả chia", padding=8)
        search_frame.grid(row=2, column=0, sticky="nsew", pady=(10, 0))
        search_frame.columnconfigure(1, weight=1)
        search_frame.rowconfigure(1, weight=1)
        search_var = tk.StringVar()
        search_regex_var = tk.BooleanVar(value=True)
        ttk.Label(search_frame, text="Tìm:").grid(row=0, column=0, sticky="w")
        search_entry = ttk.Entry(search_frame, textvariable=search_var)
        search_entry.grid(row=0, column=1, sticky="ew", padx=(8, 6))
        ttk.Checkbutton(search_frame, text="Regex", variable=search_regex_var).grid(row=0, column=2, sticky="w", padx=(0, 6))
        ttk.Button(search_frame, text="Tìm", command=lambda: search_in_chunks()).grid(row=0, column=3, sticky="e")
        search_tree = ttk.Treeview(
            search_frame,
            columns=("#", "Phần", "Dòng", "Khớp"),
            show="headings",
            height=5,
            selectmode="browse",
        )
        for col, width in zip(("#", "Phần", "Dòng", "Khớp"), [58, 90, 80, 640]):
            search_tree.heading(col, text=col)
            search_tree.column(col, width=width, anchor="w")
        search_tree.grid(row=1, column=0, columnspan=4, sticky="nsew", pady=(6, 0))
        search_scroll = ttk.Scrollbar(search_frame, orient="vertical", command=search_tree.yview)
        search_scroll.grid(row=1, column=4, sticky="ns", pady=(6, 0))
        search_tree.configure(yscrollcommand=search_scroll.set)
        search_status = tk.StringVar(value="Chưa tìm.")
        ttk.Label(search_frame, textvariable=search_status).grid(row=2, column=0, columnspan=5, sticky="w", pady=(4, 0))

        status = tk.StringVar(value="")
        ttk.Label(root, textvariable=status).grid(row=3, column=0, sticky="w", pady=(4, 0))
        preview_state = {"chunks": [], "names": [], "ranges": [], "source_hash": ""}
        search_result_rows = {}

        def render_name(index: int) -> str:
            name = TextOperations.render_split_filename(format_combo.get(), index + 1)
            if "{" in name or "}" in name:
                name = f"part_{index + 1}.txt"
            return TextOperations._sanitize_filename(name) or f"part_{index + 1}.txt"

        def row_preview(content: str) -> str:
            cleaned = " ".join((content or "").strip().split())
            return cleaned[:180] + ("..." if len(cleaned) > 180 else "")

        def update_tree_row(index: int):
            chunks = preview_state.get("chunks") or []
            names = preview_state.get("names") or []
            if index < 0 or index >= len(chunks):
                return
            iid = str(index)
            values = (index + 1, names[index], row_preview(chunks[index]), f"{len(chunks[index])} chars")
            if tree.exists(iid):
                tree.item(iid, values=values)
            else:
                tree.insert("", "end", iid=iid, values=values)

        def get_chunks():
            return self._split_current_content(regex_combo.get(), position_var.get(), include_ranges=True)

        def source_edit_status(chunks_count: int) -> str:
            target = "file gốc + preview/output" if edit_source_var.get() else "preview/output"
            return f"{chunks_count} phần. Sửa raw sẽ cập nhật {target}."

        def current_source_hash() -> str:
            text = self._current_text()
            if not text:
                return ""
            return _content_hash(text.get("1.0", "end-1c"))

        def preview_is_stale() -> bool:
            expected = str(preview_state.get("source_hash") or "")
            return bool(expected and expected != current_source_hash())

        def clear_search_results():
            search_tree.delete(*search_tree.get_children())
            search_result_rows.clear()
            search_status.set("Chưa tìm.")

        def build_preview() -> bool:
            self._add_combo_history(regex_combo, "split_regex_history", "split")
            self._add_combo_history(format_combo, "split_format_history")
            chunks, ranges, error = get_chunks()
            tree.delete(*tree.get_children())
            if error:
                status.set(error)
                return False
            preview_state["chunks"] = list(chunks)
            preview_state["names"] = [render_name(idx) for idx in range(len(chunks))]
            preview_state["ranges"] = list(ranges)
            preview_state["source_hash"] = current_source_hash()
            for idx, chunk in enumerate(chunks, 1):
                update_tree_row(idx - 1)
            clear_search_results()
            status.set(source_edit_status(len(chunks)))
            return True

        def update_source_edit_status(*_args):
            if preview_state.get("chunks"):
                status.set(source_edit_status(len(preview_state.get("chunks") or [])))

        edit_source_var.trace_add("write", update_source_edit_status)

        def preview():
            build_preview()

        def search_in_chunks():
            pattern = search_var.get().strip()
            search_tree.delete(*search_tree.get_children())
            search_result_rows.clear()
            if not pattern:
                search_status.set("Nhập nội dung cần tìm.")
                return
            if not preview_state.get("chunks") and not build_preview():
                search_status.set("Không có preview để tìm.")
                return
            if search_regex_var.get():
                try:
                    matcher = re.compile(pattern, re.MULTILINE)
                except re.error as exc:
                    search_status.set(f"Regex không hợp lệ: {exc}")
                    return
            else:
                matcher = re.compile(re.escape(pattern), re.IGNORECASE)
            display_limit = 1000
            total = 0
            for chunk_index, chunk in enumerate(preview_state.get("chunks") or []):
                for match in matcher.finditer(chunk or ""):
                    total += 1
                    if total > display_limit:
                        continue
                    line_no = (chunk or "").count("\n", 0, match.start()) + 1
                    snippet = " ".join(match.group(0).split())
                    if len(snippet) > 180:
                        snippet = snippet[:180] + "..."
                    iid = str(total)
                    search_result_rows[iid] = chunk_index
                    search_tree.insert("", "end", iid=iid, values=(total, chunk_index + 1, line_no, snippet))
            if total > display_limit:
                search_status.set(f"Tìm thấy {total} kết quả, đang hiển thị {display_limit} kết quả đầu.")
            else:
                search_status.set(f"Tìm thấy {total} kết quả.")

        def selected_index():
            selected = tree.selection()
            if not selected:
                return None
            try:
                return int(selected[0])
            except Exception:
                return None

        def open_raw_editor(index: int | None = None):
            if index is None:
                index = selected_index()
            chunks = preview_state.get("chunks") or []
            names = preview_state.get("names") or []
            if index is None or index < 0 or index >= len(chunks):
                messagebox.showinfo("Sửa raw", "Chọn một phần trong bảng preview trước.", parent=win)
                return
            file_name = names[index]
            editor = tk.Toplevel(win)
            editor.title(file_name)
            editor.geometry("860x640")
            editor.minsize(680, 460)
            try:
                self.app._apply_window_icon(editor)
            except Exception:
                pass
            editor_root = ttk.Frame(editor, padding=10)
            editor_root.pack(fill=tk.BOTH, expand=True)
            editor_root.rowconfigure(1, weight=1)
            editor_root.columnconfigure(0, weight=1)
            editor_top = ttk.Frame(editor_root)
            editor_top.grid(row=0, column=0, sticky="ew", pady=(0, 8))
            editor_top.columnconfigure(0, weight=1)
            title_var = tk.StringVar(value=file_name)
            ttk.Label(editor_top, textvariable=title_var, font=self._doc_title_font, foreground="#111827").grid(row=0, column=0, sticky="w")
            ttk.Button(editor_top, text="Lưu", command=lambda: save_editor()).grid(row=0, column=1, padx=(6, 0))

            text_widget = scrolledtext.ScrolledText(
                editor_root,
                wrap=tk.WORD,
                undo=True,
                font=(self._detect_font_family(chunks[index]), 13, self.state_store.get_font_weight()),
                spacing1=6,
                spacing3=10,
            )
            text_widget.grid(row=1, column=0, sticky="nsew")
            text_widget.insert("1.0", chunks[index])
            text_widget.edit_reset()
            text_widget.edit_modified(False)
            modified = {"value": False}

            def mark_modified(_event=None):
                if text_widget.edit_modified():
                    modified["value"] = True
                    title_var.set(f"* {file_name}")
                    editor.title(f"* {file_name}")
                    text_widget.edit_modified(False)

            def apply_chunk_to_source(next_content: str) -> bool:
                if not edit_source_var.get():
                    return True
                if preview_is_stale():
                    messagebox.showwarning(
                        "Preview đã cũ",
                        "Văn bản gốc đã thay đổi sau lần preview gần nhất. Hãy bấm Xem trước lại rồi sửa raw để tránh ghi nhầm đoạn.",
                        parent=editor,
                    )
                    return False
                doc = self._current_doc()
                source_text = self._current_text()
                ranges = preview_state.get("ranges") or []
                if not doc or not source_text or index >= len(ranges):
                    messagebox.showerror("Sửa raw", "Không xác định được đoạn trong văn bản gốc.", parent=editor)
                    return False
                start, end = ranges[index]
                start = max(0, int(start))
                end = max(start, int(end))
                try:
                    scroll = source_text.yview()
                    insert_mark = source_text.index(tk.INSERT)
                    source_text.delete(f"1.0+{start}c", f"1.0+{end}c")
                    source_text.insert(f"1.0+{start}c", next_content)
                    try:
                        source_text.mark_set(tk.INSERT, insert_mark)
                    except tk.TclError:
                        source_text.mark_set(tk.INSERT, f"1.0+{start + len(next_content)}c")
                    try:
                        source_text.yview_moveto(scroll[0])
                    except Exception:
                        pass
                except Exception as exc:
                    messagebox.showerror("Sửa raw", f"Không cập nhật được văn bản gốc:\n{exc}", parent=editor)
                    return False
                delta = len(next_content) - (end - start)
                next_ranges = []
                for range_index, (range_start, range_end) in enumerate(ranges):
                    if range_index < index:
                        next_ranges.append((range_start, range_end))
                    elif range_index == index:
                        next_ranges.append((start, start + len(next_content)))
                    else:
                        next_ranges.append((range_start + delta, range_end + delta))
                preview_state["ranges"] = next_ranges
                preview_state["source_hash"] = current_source_hash()
                self._refresh_doc_modified_state(doc)
                return True

            def save_editor():
                next_content = text_widget.get("1.0", "end-1c")
                if not apply_chunk_to_source(next_content):
                    return False
                chunks[index] = next_content
                preview_state["chunks"] = chunks
                modified["value"] = False
                title_var.set(file_name)
                editor.title(file_name)
                text_widget.edit_modified(False)
                update_tree_row(index)
                if search_var.get().strip():
                    search_in_chunks()
                target = "văn bản gốc và preview/output" if edit_source_var.get() else "preview/output"
                status.set(f"Đã cập nhật raw cho {file_name} trong {target}.")
                return True

            def close_editor():
                if modified["value"]:
                    response = messagebox.askyesnocancel(
                        "Lưu thay đổi?",
                        f"'{file_name}' có thay đổi chưa lưu. Lưu vào preview trước khi đóng không?",
                        parent=editor,
                    )
                    if response is None:
                        return
                    if response is True and not save_editor():
                        return
                editor.destroy()

            text_widget.bind("<<Modified>>", mark_modified)
            editor.protocol("WM_DELETE_WINDOW", close_editor)
            text_widget.focus_set()

        def open_selected_from_event(event):
            item_id = tree.identify_row(event.y)
            if item_id:
                tree.selection_set(item_id)
                open_raw_editor(int(item_id))

        def execute():
            self._add_combo_history(regex_combo, "split_regex_history", "split")
            self._add_combo_history(format_combo, "split_format_history")
            if preview_state.get("chunks") and preview_is_stale():
                messagebox.showwarning(
                    "Preview đã cũ",
                    "Văn bản gốc đã thay đổi sau lần preview gần nhất. Hãy bấm Xem trước lại trước khi chia file.",
                    parent=win,
                )
                return
            if not preview_state.get("chunks"):
                chunks, ranges, error = get_chunks()
                if error:
                    messagebox.showerror("Lỗi", error, parent=win)
                    return
                preview_state["chunks"] = list(chunks)
                preview_state["names"] = [render_name(idx) for idx in range(len(chunks))]
                preview_state["ranges"] = list(ranges)
                preview_state["source_hash"] = current_source_hash()
            doc = self._current_doc()
            base_path = doc.get("path") if doc else ""
            if base_path:
                output_dir = f"{os.path.splitext(base_path)[0]}_split"
            else:
                output_dir = filedialog.askdirectory(title="Chọn thư mục lưu các phần", parent=win)
                if not output_dir:
                    return
            os.makedirs(output_dir, exist_ok=True)
            count = 0
            if not messagebox.askyesno("Chia file", f"Tạo file vào thư mục:\n{output_dir}?", parent=win):
                return
            for idx, chunk in enumerate(preview_state.get("chunks") or []):
                cleaned = chunk.strip()
                if not cleaned:
                    continue
                count += 1
                names = preview_state.get("names") or []
                name = names[idx] if idx < len(names) else render_name(idx)
                with open(os.path.join(output_dir, name), "w", encoding="utf-8") as handle:
                    handle.write(cleaned)
            messagebox.showinfo("Hoàn tất", f"Đã chia thành {count} file.\n{output_dir}", parent=win)

        buttons = ttk.Frame(root)
        buttons.grid(row=4, column=0, sticky="e", pady=(10, 0))
        ttk.Button(buttons, text="Xem trước", command=preview).pack(side=tk.LEFT)
        ttk.Button(buttons, text="Sửa raw...", command=lambda: open_raw_editor()).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(buttons, text="Bắt đầu chia", command=execute).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(buttons, text="Đóng", command=win.destroy).pack(side=tk.LEFT, padx=(6, 0))
        tree.bind("<Double-1>", open_selected_from_event)
        search_entry.bind("<Return>", lambda _e: search_in_chunks())
        search_tree.bind(
            "<Double-1>",
            lambda event: (
                open_raw_editor(search_result_rows.get(search_tree.identify_row(event.y)))
                if search_tree.identify_row(event.y) in search_result_rows
                else None
            ),
        )

    def _split_current_content(self, regex: str, position: str, *, include_ranges: bool = False):
        text = self._current_text()
        if not text:
            return ([], [], "Không có tài liệu.") if include_ranges else ([], "Không có tài liệu.")
        content = text.get("1.0", "end-1c")
        if not regex:
            return ([], [], "Vui lòng nhập regex.") if include_ranges else ([], "Vui lòng nhập regex.")
        try:
            matches = list(re.finditer(regex, content, re.MULTILINE))
        except re.error as exc:
            return ([], [], f"Regex không hợp lệ: {exc}") if include_ranges else ([], f"Regex không hợp lệ: {exc}")
        if not matches:
            return ([], [], "Không tìm thấy điểm chia nào.") if include_ranges else ([], "Không tìm thấy điểm chia nào.")
        split_points = [match.end() if position == "after" else match.start() for match in matches]
        split_points.insert(0, 0)
        split_points.append(len(content))
        chunks = [content[split_points[i]:split_points[i + 1]] for i in range(len(split_points) - 1)]
        if include_ranges:
            ranges = [(split_points[i], split_points[i + 1]) for i in range(len(split_points) - 1)]
            return chunks, ranges, None
        return chunks, None

    def open_quick_tools_dialog(self, initial_toc: str = ""):
        if not self._current_doc():
            self.new_document()
        win = tk.Toplevel(self)
        win.title("Công cụ nhanh")
        win.geometry("900x620")
        win.minsize(760, 500)
        try:
            self.app._apply_window_icon(win)
        except Exception:
            pass
        outer = ttk.Frame(win, padding=10)
        outer.pack(fill=tk.BOTH, expand=True)
        outer.columnconfigure(0, weight=1)
        outer.rowconfigure(1, weight=1)
        topbar = ttk.Frame(outer)
        topbar.grid(row=0, column=0, sticky="ew", pady=(0, 8))
        topbar.columnconfigure(0, weight=1)
        ttk.Label(topbar, text="Công cụ nhanh", font=self._doc_title_font, foreground="#111827").grid(row=0, column=0, sticky="w")
        self._make_maximize_button(topbar, win).grid(row=0, column=1, sticky="e")

        root = ttk.Frame(outer)
        root.grid(row=1, column=0, sticky="nsew")
        root.columnconfigure(0, weight=1)
        root.rowconfigure(1, weight=1)

        renumber = ttk.LabelFrame(root, text="Đánh lại số chương", padding=10)
        renumber.grid(row=0, column=0, sticky="ew")
        renumber.columnconfigure(1, weight=1)
        ttk.Label(renumber, text="Regex tìm kiếm:").grid(row=0, column=0, sticky="w")
        quick_combo = self._make_history_combo(renumber, "quick_regex_history", "quick_regex")
        quick_combo.grid(row=0, column=1, sticky="ew", padx=(8, 6))
        if not quick_combo.get():
            quick_values = list(quick_combo.cget("values") or [])
            quick_combo.set(quick_values[0] if quick_values else TEXTOPS_DEFAULT_QUICK_REGEX)
        pin_btn = ttk.Button(
            renumber,
            text="Ghim" if quick_combo.get() not in self.state_store.get_pins("quick_regex") else "Bỏ ghim",
            command=lambda: self._toggle_quick_pin(quick_combo, pin_btn),
        )
        pin_btn.grid(row=0, column=2, padx=(0, 6))
        quick_combo.bind("<<ComboboxSelected>>", lambda _e: self._sync_textops_pin_button(quick_combo, "quick_regex", pin_btn))
        quick_combo.bind("<KeyRelease>", lambda _e: self._sync_textops_pin_button(quick_combo, "quick_regex", pin_btn))
        ttk.Label(renumber, text="Thay bằng:").grid(row=1, column=0, sticky="w", pady=(6, 0))
        replace_entry = ttk.Entry(renumber)
        replace_entry.insert(0, "第{num}章")
        replace_entry.grid(row=1, column=1, sticky="ew", padx=(8, 6), pady=(6, 0))
        start_var = tk.StringVar(value="1")
        source_var = tk.StringVar(value="current")
        ttk.Radiobutton(renumber, text="File hiện tại", variable=source_var, value="current").grid(row=2, column=0, sticky="w", pady=(6, 0))
        ttk.Radiobutton(renumber, text="Mục lục", variable=source_var, value="toc").grid(row=2, column=1, sticky="w", pady=(6, 0))
        ttk.Label(renumber, text="Bắt đầu:").grid(row=1, column=2, sticky="e", pady=(6, 0))
        ttk.Entry(renumber, textvariable=start_var, width=6).grid(row=1, column=3, sticky="w", pady=(6, 0))

        toc_frame = ttk.LabelFrame(root, text="Mục lục", padding=10)
        toc_frame.grid(row=1, column=0, sticky="nsew", pady=(10, 0))
        toc_frame.rowconfigure(1, weight=1)
        toc_frame.columnconfigure(0, weight=1)
        top = ttk.Frame(toc_frame)
        top.grid(row=0, column=0, sticky="ew")
        ttk.Label(top, text="Dán hoặc tải nội dung mục lục:").pack(side=tk.LEFT)
        ttk.Button(top, text="Tải file...", command=lambda: self._load_toc_file(toc_text)).pack(side=tk.RIGHT)
        toc_text = scrolledtext.ScrolledText(toc_frame, wrap=tk.WORD, height=8)
        toc_text.grid(row=1, column=0, sticky="nsew", pady=(6, 0))
        if initial_toc:
            toc_text.insert("1.0", initial_toc)
        regex_frame = ttk.Frame(toc_frame)
        regex_frame.grid(row=2, column=0, sticky="ew", pady=(8, 0))
        regex_frame.columnconfigure(1, weight=1)
        regex_frame.columnconfigure(3, weight=1)
        ttk.Label(regex_frame, text="Regex mục lục:").grid(row=0, column=0, sticky="w")
        toc_regex = ttk.Entry(regex_frame)
        toc_regex.insert(0, r"^(第\d+章)")
        toc_regex.grid(row=0, column=1, sticky="ew", padx=(6, 10))
        ttk.Label(regex_frame, text="Regex truyện:").grid(row=0, column=2, sticky="w")
        main_regex = ttk.Entry(regex_frame)
        main_regex.insert(0, r"^(第\d+章)$")
        main_regex.grid(row=0, column=3, sticky="ew", padx=(6, 0))
        mode_var = tk.StringVar(value="append")
        ttk.Radiobutton(regex_frame, text="Bổ sung tiêu đề", variable=mode_var, value="append").grid(row=1, column=0, sticky="w", pady=(6, 0))
        ttk.Radiobutton(regex_frame, text="Thay thế toàn bộ", variable=mode_var, value="replace").grid(row=1, column=1, sticky="w", pady=(6, 0))

        def renumber_action():
            self.state_store.add_history_value("quick_regex_history", quick_combo.get())
            target = self._current_text() if source_var.get() == "current" else toc_text
            try:
                start_num = int(start_var.get())
            except Exception:
                messagebox.showerror("Lỗi", "Số bắt đầu phải là số nguyên.", parent=win)
                return
            new_content, count, error = TextOperations.renumber_chapters(
                target.get("1.0", "end-1c"),
                quick_combo.get(),
                replace_entry.get(),
                start_num,
            )
            if error:
                messagebox.showerror("Lỗi", error, parent=win)
                return
            target.delete("1.0", tk.END)
            target.insert("1.0", new_content)
            self._mark_current_modified_if_target(target)
            messagebox.showinfo("Hoàn tất", f"Đã đánh lại {count} mục.", parent=win)

        def apply_toc():
            target = self._current_text()
            if not target:
                return
            new_content, count, error = TextOperations.apply_toc_to_content(
                target.get("1.0", "end-1c"),
                toc_text.get("1.0", "end-1c").strip(),
                toc_regex.get(),
                main_regex.get(),
                mode_var.get(),
            )
            if error:
                messagebox.showerror("Lỗi", error, parent=win)
                return
            target.delete("1.0", tk.END)
            target.insert("1.0", new_content)
            self._mark_current_modified_if_target(target)
            messagebox.showinfo("Hoàn tất", f"Đã áp dụng mục lục cho {count} chương.", parent=win)

        buttons = ttk.Frame(outer)
        buttons.grid(row=2, column=0, sticky="e", pady=(10, 0))
        ttk.Button(buttons, text="Đánh số lại", command=renumber_action).pack(side=tk.LEFT)
        ttk.Button(buttons, text="Áp dụng mục lục", command=apply_toc).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(buttons, text="Đóng", command=win.destroy).pack(side=tk.LEFT, padx=(6, 0))

    def _toggle_quick_pin(self, combo, button):
        value = combo.get().strip()
        if not value:
            return
        self.state_store.toggle_pin("quick_regex", value)
        combo.configure(values=self.state_store.history_with_pins("quick_regex_history", "quick_regex"))
        button.configure(text="Bỏ ghim" if value in self.state_store.get_pins("quick_regex") else "Ghim")

    def _load_toc_file(self, widget):
        path = filedialog.askopenfilename(title="Chọn file mục lục", filetypes=[("Text files", "*.txt"), ("All files", "*.*")], parent=self)
        if not path:
            return
        try:
            content, _encoding = read_text_file_auto(path, parent=self, interactive=True)
            widget.delete("1.0", tk.END)
            widget.insert("1.0", content)
        except Exception as exc:
            messagebox.showerror("Lỗi", f"Không thể đọc file: {exc}", parent=self)

    def _mark_current_modified_if_target(self, target):
        doc = self._current_doc()
        if doc and target is doc.get("text"):
            if not doc.get("font_manual"):
                self._auto_apply_font_for_doc(doc)
            self._refresh_doc_modified_state(doc)

    def open_junk_remover(self):
        doc = self._current_doc()
        folder = os.path.dirname(doc.get("path") or "") if doc else ""
        try:
            self.app._open_junk_remover(source_label="Xử lý văn bản", folder_path=folder)
        except Exception as exc:
            messagebox.showerror("Lỗi", f"Không mở được Xóa rác: {exc}", parent=self)

    def open_guide(self):
        win = tk.Toplevel(self)
        win.title("Hướng dẫn Xử lý văn bản")
        win.geometry("760x540")
        win.transient(self)
        text = scrolledtext.ScrolledText(win, wrap=tk.WORD, padx=10, pady=10)
        text.pack(fill=tk.BOTH, expand=True)
        guide = """
Xử lý văn bản

Phím tắt:
- Ctrl+N: tạo tab mới
- Ctrl+O: mở file
- Ctrl+S: lưu
- Ctrl+Shift+S: lưu như
- Ctrl+W: đóng tab hiện tại
- Ctrl+Shift+W: đóng các tab khác
- Ctrl+Alt+W: đóng tất cả tab
- Ctrl+F: tìm
- Ctrl+H: tìm & thay thế
- Ctrl+Z / Ctrl+Y: hoàn tác / làm lại

Ghi chú:
- Tìm và Thay thế nằm chung một hộp thoại có tab chuyển qua lại như Word.
- Tab Tìm và tab Thay thế có nút Ghim/Bỏ ghim riêng cho regex; regex đã ghim luôn đứng trước lịch sử của đúng tab đó.
- Khi bật Regex, ô Thay thế hỗ trợ group bắt được bằng cú pháp $1, $2... Ví dụ tìm `Chương (\\d+)` và thay `第$1章` sẽ giữ lại số chương.
- Khi nhấn Thay tất cả, app hỏi có mở preview không. Chọn Không thì thay ngay; chọn Có thì mở modal preview với dòng, đoạn khớp, trước và sau.
- File UTF-16/Unicode, GB2312/GB18030/CP936 sẽ được chuyển thành Unicode khi mở; nếu nội dung đáng ngờ, app mở bảng chọn encoding có preview.
- Menu File > Mở lại với mã... cho phép chọn encoding thủ công. Menu File > Chọn mã lưu... mặc định UTF-8 nhưng có thể đổi khi cần.
- Chia file mở bằng cửa sổ riêng, có bảng cuộn và editor raw cho từng phần preview bằng double-click hoặc nút Sửa raw.
- Công cụ nhanh mở bằng cửa sổ riêng, có nút phóng to và vùng cuộn.
- Menu Hiển thị > Hiện thanh công cụ dùng để thu gọn/mở lại dải nút phía trên.
- TextOps tự chọn Microsoft Sans Serif cho tiếng Việt, Microsoft YaHei cho tiếng Trung, và Segoe UI cho ngôn ngữ khác.
- File đang sửa được lưu tạm trong local/text_ops_autosave để khôi phục nếu app/máy tắt đột ngột.
- Lịch sử file và regex nằm trong local/text_ops_state.json, không còn phụ thuộc config.json.
- Preview thay tất cả mặc định hiển thị tối đa 200 kết quả; bấm Hiện tất cả nếu cần xem toàn bộ.
"""
        text.insert("1.0", guide.strip())
        text.config(state="disabled")

    def _refresh_controls(self):
        has_doc = bool(self._current_doc())
        for menu, labels in (
            (self.file_menu, ("Mở lại với mã...", "Lưu", "Lưu như...", "Chọn mã lưu...", "Đóng tab", "Đóng tab khác", "Đóng tất cả tab")),
            (self.edit_menu, ("Hoàn tác", "Làm lại")),
            (self.search_menu, ("Tìm...", "Tìm & Thay thế...")),
            (self.tools_menu, ("Chia file...", "Công cụ nhanh...", "Xóa rác...")),
        ):
            for label in labels:
                try:
                    menu.entryconfig(label, state=(tk.NORMAL if has_doc else tk.DISABLED))
                except Exception:
                    pass
        self._sync_font_controls_with_doc(self._current_doc())
        self._set_status_for_doc()
