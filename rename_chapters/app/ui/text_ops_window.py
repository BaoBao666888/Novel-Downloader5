import hashlib
import os
import re
import tkinter as tk
import tkinter.font as tkfont
import uuid
from tkinter import ttk, filedialog, messagebox, scrolledtext

from app.core.text_ops import TextOperations
from app.ui.text_ops_state import MAX_TEXT_OPS_HISTORY, TextOpsStateStore


TEXT_ENCODINGS = (
    "utf-8-sig",
    "utf-8",
    "gb18030",
    "gb2312",
    "cp936",
    "big5",
    "cp950",
)

TEXTOPS_CHINESE_FONT = "Microsoft YaHei"
TEXTOPS_VIETNAMESE_FONT = "Microsoft Sans Serif"
TEXTOPS_FALLBACK_FONT = "Segoe UI"
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


def read_text_file_auto(path: str) -> tuple[str, str]:
    with open(path, "rb") as handle:
        raw = handle.read()
    last_error = None
    for encoding in TEXT_ENCODINGS:
        try:
            return raw.decode(encoding), encoding
        except UnicodeDecodeError as exc:
            last_error = exc
    try:
        return raw.decode("utf-8", errors="replace"), "utf-8-replace"
    except Exception as exc:
        raise last_error or exc


def _snippet(text: str, start: int, end: int, radius: int = 34) -> str:
    left = max(0, start - radius)
    right = min(len(text), end + radius)
    prefix = "..." if left > 0 else ""
    suffix = "..." if right < len(text) else ""
    return (prefix + text[left:right].replace("\n", "\\n") + suffix).strip()


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
        self.file_menu.add_command(label="Lưu", accelerator="Ctrl+S", command=self.save_current)
        self.file_menu.add_command(label="Lưu như...", accelerator="Ctrl+Shift+S", command=self.save_current_as)
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
        self.font_families = sorted(installed_families | {TEXTOPS_CHINESE_FONT, TEXTOPS_VIETNAMESE_FONT, TEXTOPS_FALLBACK_FONT})
        family, size = self.state_store.get_font()
        self.font_search_var = tk.StringVar()
        self.font_family_var = tk.StringVar(value=family)
        self.font_size_var = tk.IntVar(value=size)
        self.font_search_entry = ttk.Entry(toolbar, width=14, textvariable=self.font_search_var)
        self.font_search_entry.pack(side=tk.LEFT)
        self.font_combo = ttk.Combobox(toolbar, values=self.font_families, width=22, textvariable=self.font_family_var)
        self.font_combo.pack(side=tk.LEFT)
        self.font_size_spin = ttk.Spinbox(toolbar, from_=8, to=36, width=4, textvariable=self.font_size_var, command=self.apply_font_from_controls)
        self.font_size_spin.pack(side=tk.LEFT, padx=(4, 0))
        self.font_combo.bind("<<ComboboxSelected>>", lambda _e: self.apply_font_from_controls())
        self.font_combo.bind("<Return>", lambda _e: self.apply_font_from_controls())
        self.font_search_entry.bind("<KeyRelease>", self._filter_font_list)
        self.font_search_entry.bind("<Return>", self._select_first_font_match)
        self.font_size_spin.bind("<Return>", lambda _e: self.apply_font_from_controls())
        if not self.toolbar_visible_var.get():
            self.toolbar.grid_remove()

        self.notebook = ttk.Notebook(root)
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

    def _detect_font_family(self, content: str) -> str:
        sample = (content or "")[:30000]
        chinese_count = len(CHINESE_CHAR_RE.findall(sample))
        vietnamese_count = sum(1 for ch in sample if ch in VIETNAMESE_MARKS)
        if chinese_count and chinese_count >= vietnamese_count:
            return self._safe_font_family(TEXTOPS_CHINESE_FONT)
        if vietnamese_count:
            return self._safe_font_family(TEXTOPS_VIETNAMESE_FONT)
        return self._safe_font_family(TEXTOPS_FALLBACK_FONT)

    def _set_doc_font(self, doc: dict, family: str, size: int | None = None, *, manual: bool = False):
        if not doc:
            return
        try:
            size = int(size or doc.get("font_size") or self.font_size_var.get() or 11)
        except Exception:
            size = 11
        size = max(8, min(36, size))
        family = self._safe_font_family(family)
        doc["font_family"] = family
        doc["font_size"] = size
        if manual:
            doc["font_manual"] = True
            self.state_store.set_font(family, size)
        try:
            doc["text"].configure(font=(family, size))
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
        state = "đã sửa" if doc.get("modified") else "đã lưu"
        self.status_var.set(f"{path}  |  {encoding}  |  {state}")

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
        family = self._detect_font_family(content)
        text.configure(font=(family, size))
        doc = {
            "tab_id": "",
            "frame": frame,
            "text": text,
            "path": "",
            "encoding": "utf-8",
            "modified": _content_hash(content) != _content_hash(baseline_content),
            "title": title,
            "autosave_id": autosave_id or f"draft-{uuid.uuid4().hex}",
            "autosave_after_id": None,
            "baseline_hash": _content_hash(baseline_content),
            "font_family": family,
            "font_size": size,
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
                content, encoding = read_text_file_auto(path)
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

    def _save_doc_to_path(self, doc: dict, path: str) -> bool:
        try:
            content = doc["text"].get("1.0", "end-1c")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(content)
            old_autosave_id = doc.get("autosave_id")
            doc["path"] = os.path.normpath(path)
            doc["autosave_id"] = _path_autosave_id(doc["path"])
            doc["encoding"] = "utf-8"
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
        self._set_doc_font(doc, family, size, manual=True)

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

    def open_find_dialog(self):
        doc = self._current_doc()
        if not doc:
            return
        win = self._dialog_refs.get("find")
        if win and win.winfo_exists():
            win.lift()
            return
        win = tk.Toplevel(self)
        self._dialog_refs["find"] = win
        win.title("Tìm")
        win.geometry("460x150")
        win.transient(self)
        frame = ttk.Frame(win, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)
        frame.columnconfigure(1, weight=1)
        ttk.Label(frame, text="Tìm:").grid(row=0, column=0, sticky="w")
        find_combo = self._make_history_combo(frame, "find_history", "find")
        find_combo.grid(row=0, column=1, sticky="ew", padx=(8, 0))
        opts = {
            "case": tk.BooleanVar(value=False),
            "word": tk.BooleanVar(value=False),
            "regex": tk.BooleanVar(value=False),
        }
        ttk.Checkbutton(frame, text="Khớp hoa/thường", variable=opts["case"]).grid(row=1, column=0, sticky="w", pady=(8, 0))
        ttk.Checkbutton(frame, text="Toàn bộ từ", variable=opts["word"]).grid(row=1, column=1, sticky="w", pady=(8, 0))
        ttk.Checkbutton(frame, text="Regex", variable=opts["regex"]).grid(row=2, column=0, sticky="w")
        buttons = ttk.Frame(frame)
        buttons.grid(row=3, column=0, columnspan=2, sticky="e", pady=(10, 0))
        ttk.Button(buttons, text="Tìm tiếp", command=lambda: self._find_from_dialog(find_combo, opts, False)).pack(side=tk.LEFT)
        ttk.Button(buttons, text="Tìm ngược", command=lambda: self._find_from_dialog(find_combo, opts, True)).pack(side=tk.LEFT, padx=(6, 0))
        find_combo.focus_set()

    def _find_from_dialog(self, combo, opts, search_up: bool):
        text = self._current_text()
        if not text:
            return
        find_what = combo.get().strip()
        if not find_what:
            return
        self._add_combo_history(combo, "find_history", "find")
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

    def open_replace_dialog(self):
        if not self._current_doc():
            return
        win = self._dialog_refs.get("replace")
        if win and win.winfo_exists():
            win.lift()
            return
        win = tk.Toplevel(self)
        self._dialog_refs["replace"] = win
        win.title("Tìm & Thay thế")
        win.geometry("860x440")
        win.transient(self)
        root = ttk.Frame(win, padding=10)
        root.pack(fill=tk.BOTH, expand=True)
        root.columnconfigure(1, weight=1)
        root.rowconfigure(0, weight=1)

        controls = ttk.Frame(root)
        controls.grid(row=0, column=0, sticky="nsw", padx=(0, 10))
        ttk.Label(controls, text="Tìm:").grid(row=0, column=0, sticky="w")
        find_combo = self._make_history_combo(controls, "find_history", "find", width=28)
        find_combo.grid(row=1, column=0, sticky="ew", pady=(2, 8))
        ttk.Label(controls, text="Thay thế:").grid(row=2, column=0, sticky="w")
        replace_combo = self._make_history_combo(controls, "replace_history", "replace", width=28)
        replace_combo.grid(row=3, column=0, sticky="ew", pady=(2, 8))
        opts = {
            "case": tk.BooleanVar(value=False),
            "word": tk.BooleanVar(value=False),
            "regex": tk.BooleanVar(value=False),
            "all": tk.BooleanVar(value=False),
        }
        ttk.Checkbutton(controls, text="Khớp hoa/thường", variable=opts["case"]).grid(row=4, column=0, sticky="w")
        ttk.Checkbutton(controls, text="Toàn bộ từ", variable=opts["word"]).grid(row=5, column=0, sticky="w")
        ttk.Checkbutton(controls, text="Regex", variable=opts["regex"]).grid(row=6, column=0, sticky="w")
        ttk.Checkbutton(controls, text="Hiện tất cả", variable=opts["all"]).grid(row=7, column=0, sticky="w")

        preview_frame = ttk.LabelFrame(root, text="Preview")
        preview_frame.grid(row=0, column=1, sticky="nsew")
        preview_frame.rowconfigure(0, weight=1)
        preview_frame.columnconfigure(0, weight=1)
        cols = ("#", "Trước", "Sau")
        tree = ttk.Treeview(preview_frame, columns=cols, show="headings", height=10)
        for col, width in zip(cols, [48, 320, 320]):
            tree.heading(col, text=col)
            tree.column(col, width=width, anchor="w")
        tree.grid(row=0, column=0, sticky="nsew")
        vsb = ttk.Scrollbar(preview_frame, orient="vertical", command=tree.yview)
        vsb.grid(row=0, column=1, sticky="ns")
        tree.configure(yscrollcommand=vsb.set)
        count_var = tk.StringVar(value="Chưa preview.")
        ttk.Label(preview_frame, textvariable=count_var).grid(row=1, column=0, sticky="w", pady=(4, 0))

        def refresh_preview():
            matches, error = self._replace_preview_matches(
                find_combo.get(),
                replace_combo.get(),
                opts["case"].get(),
                opts["word"].get(),
                opts["regex"].get(),
                show_all=opts["all"].get(),
            )
            tree.delete(*tree.get_children())
            if error:
                count_var.set(error)
                return
            for idx, item in enumerate(matches, 1):
                tree.insert("", "end", values=(idx, item["before"], item["after"]))
            suffix = "" if opts["all"].get() else " đầu tiên"
            count_var.set(f"Đang hiển thị {len(matches)} kết quả{suffix}.")

        buttons = ttk.Frame(root)
        buttons.grid(row=1, column=0, columnspan=2, sticky="e", pady=(10, 0))
        ttk.Button(buttons, text="Preview", command=refresh_preview).pack(side=tk.LEFT)
        ttk.Button(buttons, text="Thay lựa chọn", command=lambda: self._replace_current_from_dialog(find_combo, replace_combo, opts)).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(buttons, text="Thay tất cả", command=lambda: self._replace_all_from_dialog(find_combo, replace_combo, opts, refresh_preview)).pack(side=tk.LEFT, padx=(6, 0))
        find_combo.bind("<KeyRelease>", lambda _e: refresh_preview())
        replace_combo.bind("<KeyRelease>", lambda _e: refresh_preview())
        for key in ("case", "word", "regex", "all"):
            opts[key].trace_add("write", lambda *_: refresh_preview())
        refresh_preview()

    def _replace_preview_matches(self, find_what, replace_with, match_case, match_word, use_regex, show_all=False):
        text = self._current_text()
        if not text or not find_what:
            return [], None
        content = text.get("1.0", "end-1c")
        limit = None if show_all else 100
        results = []
        try:
            if use_regex:
                flags = re.MULTILINE if match_case else re.MULTILINE | re.IGNORECASE
                pattern = find_what if not match_word else rf"\b(?:{find_what})\b"
                repl = re.sub(r"\$(\d)", r"\\\1", replace_with)
                for match in re.finditer(pattern, content, flags):
                    after_piece = re.sub(pattern, repl, match.group(0), count=1, flags=flags)
                    results.append({"before": _snippet(content, match.start(), match.end()), "after": after_piece.replace("\n", "\\n")})
                    if limit and len(results) >= limit:
                        break
            else:
                flags = 0 if match_case else re.IGNORECASE
                pattern = re.escape(find_what)
                if match_word:
                    pattern = rf"\b{pattern}\b"
                for match in re.finditer(pattern, content, flags):
                    results.append({"before": _snippet(content, match.start(), match.end()), "after": replace_with.replace("\n", "\\n")})
                    if limit and len(results) >= limit:
                        break
        except re.error as exc:
            return [], f"Regex lỗi: {exc}"
        return results, None

    def _replace_current_from_dialog(self, find_combo, replace_combo, opts):
        text = self._current_text()
        if not text:
            return
        find_what = find_combo.get().strip()
        replace_with = replace_combo.get()
        if not find_what:
            return
        self._add_combo_history(find_combo, "find_history", "find")
        self._add_combo_history(replace_combo, "replace_history", "replace")
        if not text.tag_ranges(tk.SEL):
            self._find_from_dialog(find_combo, opts, False)
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

    def _replace_all_from_dialog(self, find_combo, replace_combo, opts, refresh_preview):
        text = self._current_text()
        if not text:
            return
        find_what = find_combo.get().strip()
        replace_with = replace_combo.get()
        if not find_what:
            return
        self._add_combo_history(find_combo, "find_history", "find")
        self._add_combo_history(replace_combo, "replace_history", "replace")
        if not messagebox.askyesno("Xác nhận", "Thay thế tất cả trong tài liệu hiện tại?", parent=self):
            return
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
        refresh_preview()
        messagebox.showinfo("Hoàn tất", f"Đã thay thế {count} kết quả.", parent=self)

    def open_split_dialog(self):
        if not self._current_doc():
            return
        win = tk.Toplevel(self)
        win.title("Chia file")
        win.geometry("760x440")
        win.transient(self)
        root = ttk.Frame(win, padding=10)
        root.pack(fill=tk.BOTH, expand=True)
        root.columnconfigure(0, weight=1)
        root.rowconfigure(2, weight=1)
        options = ttk.Frame(root)
        options.grid(row=0, column=0, sticky="ew")
        options.columnconfigure(1, weight=1)
        ttk.Label(options, text="Regex chia:").grid(row=0, column=0, sticky="w")
        regex_combo = self._make_history_combo(options, "split_regex_history", "split", width=38)
        regex_combo.grid(row=0, column=1, sticky="ew", padx=(8, 6))
        ttk.Label(options, text="Tên file:").grid(row=1, column=0, sticky="w", pady=(6, 0))
        format_combo = self._make_history_combo(options, "split_format_history", "", width=38)
        if not format_combo.get():
            values = self.state_store.get_list("split_format_history") or ["part_{num}.txt"]
            format_combo.set(values[0])
        format_combo.grid(row=1, column=1, sticky="ew", padx=(8, 6), pady=(6, 0))
        position_var = tk.StringVar(value="after")
        ttk.Radiobutton(options, text="Chia sau regex", variable=position_var, value="after").grid(row=0, column=2, sticky="w")
        ttk.Radiobutton(options, text="Chia trước regex", variable=position_var, value="before").grid(row=1, column=2, sticky="w", pady=(6, 0))

        tree = ttk.Treeview(root, columns=("#", "Bắt đầu", "Kích thước"), show="headings")
        for col, width in zip(("#", "Bắt đầu", "Kích thước"), [52, 520, 110]):
            tree.heading(col, text=col)
            tree.column(col, width=width, anchor="w")
        tree.grid(row=2, column=0, sticky="nsew", pady=(10, 0))
        status = tk.StringVar(value="")
        ttk.Label(root, textvariable=status).grid(row=3, column=0, sticky="w", pady=(4, 0))

        def get_chunks():
            return self._split_current_content(regex_combo.get(), position_var.get())

        def preview():
            self._add_combo_history(regex_combo, "split_regex_history", "split")
            self._add_combo_history(format_combo, "split_format_history")
            chunks, error = get_chunks()
            tree.delete(*tree.get_children())
            if error:
                status.set(error)
                return
            for idx, chunk in enumerate(chunks, 1):
                tree.insert("", "end", values=(idx, chunk[:80].replace("\n", "\\n"), f"{len(chunk)} chars"))
            status.set(f"{len(chunks)} phần.")

        def execute():
            self._add_combo_history(regex_combo, "split_regex_history", "split")
            self._add_combo_history(format_combo, "split_format_history")
            chunks, error = get_chunks()
            if error:
                messagebox.showerror("Lỗi", error, parent=win)
                return
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
            for chunk in chunks:
                cleaned = chunk.strip()
                if not cleaned:
                    continue
                count += 1
                name = TextOperations.render_split_filename(format_combo.get(), count)
                if "{" in name or "}" in name:
                    name = f"part_{count}.txt"
                name = TextOperations._sanitize_filename(name) or f"part_{count}.txt"
                with open(os.path.join(output_dir, name), "w", encoding="utf-8") as handle:
                    handle.write(cleaned)
            messagebox.showinfo("Hoàn tất", f"Đã chia thành {count} file.\n{output_dir}", parent=win)

        buttons = ttk.Frame(root)
        buttons.grid(row=4, column=0, sticky="e", pady=(10, 0))
        ttk.Button(buttons, text="Xem trước", command=preview).pack(side=tk.LEFT)
        ttk.Button(buttons, text="Bắt đầu chia", command=execute).pack(side=tk.LEFT, padx=(6, 0))

    def _split_current_content(self, regex: str, position: str):
        text = self._current_text()
        if not text:
            return [], "Không có tài liệu."
        content = text.get("1.0", "end-1c")
        if not regex:
            return [], "Vui lòng nhập regex."
        try:
            matches = list(re.finditer(regex, content, re.MULTILINE))
        except re.error as exc:
            return [], f"Regex không hợp lệ: {exc}"
        if not matches:
            return [], "Không tìm thấy điểm chia nào."
        split_points = [match.end() if position == "after" else match.start() for match in matches]
        split_points.insert(0, 0)
        split_points.append(len(content))
        chunks = [content[split_points[i]:split_points[i + 1]] for i in range(len(split_points) - 1)]
        return chunks, None

    def open_quick_tools_dialog(self, initial_toc: str = ""):
        if not self._current_doc():
            self.new_document()
        win = tk.Toplevel(self)
        win.title("Công cụ nhanh")
        win.geometry("820x520")
        win.transient(self)
        root = ttk.Frame(win, padding=10)
        root.pack(fill=tk.BOTH, expand=True)
        root.columnconfigure(0, weight=1)
        root.rowconfigure(1, weight=1)

        renumber = ttk.LabelFrame(root, text="Đánh lại số chương", padding=10)
        renumber.grid(row=0, column=0, sticky="ew")
        renumber.columnconfigure(1, weight=1)
        ttk.Label(renumber, text="Regex tìm kiếm:").grid(row=0, column=0, sticky="w")
        quick_combo = self._make_history_combo(renumber, "quick_regex_history", "quick_regex")
        quick_combo.grid(row=0, column=1, sticky="ew", padx=(8, 6))
        if not quick_combo.get():
            quick_combo.set(r"第\d+章")
        pin_btn = ttk.Button(
            renumber,
            text="Ghim" if quick_combo.get() not in self.state_store.get_pins("quick_regex") else "Bỏ ghim",
            command=lambda: self._toggle_quick_pin(quick_combo, pin_btn),
        )
        pin_btn.grid(row=0, column=2, padx=(0, 6))
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

        buttons = ttk.Frame(root)
        buttons.grid(row=2, column=0, sticky="e", pady=(10, 0))
        ttk.Button(buttons, text="Đánh số lại", command=renumber_action).pack(side=tk.LEFT)
        ttk.Button(buttons, text="Áp dụng mục lục", command=apply_toc).pack(side=tk.LEFT, padx=(6, 0))

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
            content, _encoding = read_text_file_auto(path)
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
- File GB2312/GB18030/CP936 sẽ được chuyển thành Unicode khi mở.
- Khi lưu, file được ghi UTF-8.
- Menu Hiển thị > Hiện thanh công cụ dùng để thu gọn/mở lại dải nút phía trên.
- TextOps tự chọn Microsoft Sans Serif cho tiếng Việt, Microsoft YaHei cho tiếng Trung, và Segoe UI cho ngôn ngữ khác.
- File đang sửa được lưu tạm trong local/text_ops_autosave để khôi phục nếu app/máy tắt đột ngột.
- Lịch sử file và regex nằm trong local/text_ops_state.json, không còn phụ thuộc config.json.
- Tìm & Thay thế preview mặc định tối đa 100 kết quả; bật Hiện tất cả nếu cần xem toàn bộ.
"""
        text.insert("1.0", guide.strip())
        text.config(state="disabled")

    def _refresh_controls(self):
        has_doc = bool(self._current_doc())
        for menu, labels in (
            (self.file_menu, ("Lưu", "Lưu như...", "Đóng tab", "Đóng tab khác", "Đóng tất cả tab")),
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
