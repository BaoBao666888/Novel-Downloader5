import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import tkinter as tk
from tkinter import ttk, messagebox, simpledialog

CHROME_EPOCH = datetime(1601, 1, 1)


def _chrome_ts_to_str(value: int) -> str:
    if not value:
        return "Phiên hiện tại"
    try:
        dt = CHROME_EPOCH + timedelta(microseconds=value)
        return dt.strftime("%Y-%m-%d %H:%M")
    except Exception:
        return str(value)


def _now_chrome_ts() -> int:
    delta = datetime.utcnow() - CHROME_EPOCH
    return int(delta.total_seconds() * 1_000_000)


@dataclass
class CookieRecord:
    host_key: str
    name: str
    value: str
    path: str
    expires_utc: int
    is_secure: int
    is_httponly: int

    def expires_label(self) -> str:
        return _chrome_ts_to_str(self.expires_utc)

    def short_value(self, limit: int = 80) -> str:
        text = self.value or ""
        return text if len(text) <= limit else text[:limit - 1] + "…"


class _EditCookieDialog(simpledialog.Dialog):
    def __init__(self, parent, record: CookieRecord):
        self.record = record
        self.result = None
        super().__init__(parent, title="Sửa cookie")

    def body(self, master):
        ttk.Label(master, text=f"Tên miền: {self.record.host_key or '(trống)'}").grid(
            row=0, column=0, columnspan=2, sticky="w", pady=(0, 4)
        )
        ttk.Label(master, text=f"Tên cookie: {self.record.name}").grid(
            row=1, column=0, columnspan=2, sticky="w", pady=(0, 6)
        )

        ttk.Label(master, text="Giá trị:").grid(row=2, column=0, sticky="nw")
        self.text = tk.Text(master, width=60, height=8, wrap="word")
        self.text.insert("1.0", self.record.value or "")
        self.text.grid(row=2, column=1, sticky="nsew")

        master.grid_columnconfigure(1, weight=1)
        return self.text

    def apply(self):
        self.result = self.text.get("1.0", "end-1c")


class CookieManagerWindow(tk.Toplevel):
    def __init__(self, master, db_path: str, *, on_close=None):
        super().__init__(master)
        self.db_path = db_path
        self._on_close = on_close
        self.title("Quản lý cookie trình duyệt")
        self.geometry("860x520")
        self.minsize(640, 420)
        self.cookies_by_domain: Dict[str, List[CookieRecord]] = {}
        self._domain_index: List[str] = []
        self.current_domain = None
        self.status_var = tk.StringVar(value="")

        self._build_ui()
        self.refresh_cookies()
        self.protocol("WM_DELETE_WINDOW", self._handle_close)

    def _build_ui(self):
        container = ttk.Frame(self, padding=14)
        container.pack(fill=tk.BOTH, expand=True)

        paned = ttk.PanedWindow(container, orient=tk.HORIZONTAL)
        paned.pack(fill=tk.BOTH, expand=True)

        # Domain list
        domain_frame = ttk.LabelFrame(paned, text="Tên miền")
        domain_frame.columnconfigure(0, weight=1)
        domain_frame.rowconfigure(0, weight=1)
        self.domain_list = tk.Listbox(domain_frame, exportselection=False)
        domain_scroll = ttk.Scrollbar(domain_frame, orient=tk.VERTICAL, command=self.domain_list.yview)
        self.domain_list.config(yscrollcommand=domain_scroll.set)
        self.domain_list.grid(row=0, column=0, sticky="nsew")
        domain_scroll.grid(row=0, column=1, sticky="ns")
        self.domain_list.bind("<<ListboxSelect>>", self._on_domain_select)

        # Cookie list
        cookies_frame = ttk.LabelFrame(paned, text="Cookie")
        cookies_frame.columnconfigure(0, weight=1)
        cookies_frame.rowconfigure(0, weight=1)
        columns = ("name", "value", "path", "expires")
        self.cookie_tree = ttk.Treeview(cookies_frame, columns=columns, show="headings", selectmode="browse")
        self.cookie_tree.heading("name", text="Tên")
        self.cookie_tree.heading("value", text="Giá trị")
        self.cookie_tree.heading("path", text="Đường dẫn")
        self.cookie_tree.heading("expires", text="Hết hạn")
        self.cookie_tree.column("name", width=160, anchor="w")
        self.cookie_tree.column("value", width=320, anchor="w")
        self.cookie_tree.column("path", width=120, anchor="w")
        self.cookie_tree.column("expires", width=120, anchor="center")

        tree_scroll_y = ttk.Scrollbar(cookies_frame, orient=tk.VERTICAL, command=self.cookie_tree.yview)
        tree_scroll_x = ttk.Scrollbar(cookies_frame, orient=tk.HORIZONTAL, command=self.cookie_tree.xview)
        self.cookie_tree.configure(yscrollcommand=tree_scroll_y.set, xscrollcommand=tree_scroll_x.set)
        self.cookie_tree.grid(row=0, column=0, sticky="nsew")
        tree_scroll_y.grid(row=0, column=1, sticky="ns")
        tree_scroll_x.grid(row=1, column=0, sticky="ew")
        self.cookie_tree.bind("<Double-1>", lambda _evt: self._edit_selected_cookie())

        paned.add(domain_frame, weight=1)
        paned.add(cookies_frame, weight=3)

        # Buttons
        button_frame = ttk.Frame(container)
        button_frame.pack(fill=tk.X, pady=(10, 0))
        ttk.Button(button_frame, text="Làm mới", command=self.refresh_cookies).pack(side=tk.RIGHT)
        ttk.Button(button_frame, text="Xóa tất cả", command=self._delete_all).pack(side=tk.RIGHT, padx=(0, 6))
        ttk.Button(button_frame, text="Xóa domain", command=self._delete_domain).pack(side=tk.LEFT)
        ttk.Button(button_frame, text="Xóa cookie", command=self._delete_selected_cookie).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(button_frame, text="Sửa giá trị...", command=self._edit_selected_cookie).pack(side=tk.LEFT, padx=(6, 0))

        ttk.Label(container, textvariable=self.status_var, foreground="#8c8c8c").pack(anchor="w", pady=(8, 0))

    def refresh_cookies(self):
        if not os.path.exists(self.db_path):
            self.cookies_by_domain.clear()
            self._render_domains()
            self._render_cookies(None)
            self.status_var.set("Không tìm thấy file cookie.")
            return

        try:
            with sqlite3.connect(self.db_path, timeout=3) as conn:
                cursor = conn.execute(
                    """
                    SELECT host_key, name, value, path, expires_utc, is_secure, is_httponly
                    FROM cookies
                    ORDER BY host_key COLLATE NOCASE, name COLLATE NOCASE
                    """
                )
                rows = cursor.fetchall()
        except sqlite3.OperationalError as exc:
            self.status_var.set("Không thể đọc cookie (file đang được sử dụng?).")
            messagebox.showerror("Lỗi", f"Không thể truy cập file cookie:\n{exc}")
            return

        cookies: Dict[str, List[CookieRecord]] = {}
        for row in rows:
            record = CookieRecord(
                host_key=row[0] or "",
                name=row[1] or "",
                value=row[2] or "",
                path=row[3] or "/",
                expires_utc=row[4] or 0,
                is_secure=row[5] or 0,
                is_httponly=row[6] or 0,
            )
            cookies.setdefault(record.host_key, []).append(record)
        self.cookies_by_domain = cookies
        self._render_domains()
        self._render_cookies(self.current_domain if self.current_domain in self.cookies_by_domain else None)
        total = sum(len(v) for v in cookies.values())
        self.status_var.set(f"Đã tải {total} cookie từ {len(cookies)} domain.")

    def _render_domains(self):
        self.domain_list.delete(0, tk.END)
        self._domain_index = []
        for domain in sorted(self.cookies_by_domain.keys(), key=lambda x: (x or "").lower()):
            count = len(self.cookies_by_domain[domain])
            display = f"{self._format_domain(domain)} ({count})"
            self.domain_list.insert(tk.END, display)
            self._domain_index.append(domain)
            if domain == self.current_domain:
                self.domain_list.selection_set(tk.END)

    def _render_cookies(self, domain):
        self.cookie_tree.delete(*self.cookie_tree.get_children())
        if not domain or domain not in self.cookies_by_domain:
            self.current_domain = None
            return
        self.current_domain = domain
        for record in self.cookies_by_domain[domain]:
            iid = self._make_cookie_iid(record)
            self.cookie_tree.insert(
                "", tk.END, iid=iid,
                values=(record.name, record.short_value(), record.path, record.expires_label())
            )

    def _on_domain_select(self, _event=None):
        if not self.domain_list.curselection():
            return
        index = self.domain_list.curselection()[0]
        if index >= len(self._domain_index):
            return
        domain = self._domain_index[index]
        self._render_cookies(domain)

    def _selected_record(self) -> Optional[CookieRecord]:
        item = self.cookie_tree.selection()
        if not item or not self.current_domain:
            return None
        iid = item[0]
        cookies = self.cookies_by_domain.get(self.current_domain, [])
        for record in cookies:
            if self._make_cookie_iid(record) == iid:
                return record
        return None

    def _make_cookie_iid(self, record: CookieRecord) -> str:
        return f"{record.host_key}|{record.name}|{record.path}"

    def _edit_selected_cookie(self):
        record = self._selected_record()
        if not record:
            messagebox.showinfo("Cookie", "Vui lòng chọn cookie cần sửa.")
            return
        dialog = _EditCookieDialog(self, record)
        if dialog.result is None:
            return
        new_value = dialog.result
        try:
            with sqlite3.connect(self.db_path, timeout=3) as conn:
                conn.execute(
                    """
                    UPDATE cookies
                SET value = ?, encrypted_value = ?, last_update_utc = ?
                WHERE host_key = ? AND name = ? AND path = ?
                """,
                (new_value, b"", _now_chrome_ts(), record.host_key, record.name, record.path)
            )
            self.status_var.set(f"Đã cập nhật cookie '{record.name}'.")
        except sqlite3.OperationalError as exc:
            messagebox.showerror("Lỗi", f"Không thể sửa cookie: {exc}")
            return
        self.refresh_cookies()

    def _delete_selected_cookie(self):
        record = self._selected_record()
        if not record:
            messagebox.showinfo("Cookie", "Vui lòng chọn cookie cần xóa.")
            return
        if not messagebox.askyesno(
            "Xóa cookie",
            f"Bạn có chắc muốn xóa cookie '{record.name}' thuộc domain '{self._format_domain(record.host_key)}'?"
        ):
            return
        self._delete_cookie_in_db(record)
        self.refresh_cookies()

    def _delete_cookie_in_db(self, record: CookieRecord):
        try:
            with sqlite3.connect(self.db_path, timeout=3) as conn:
                conn.execute(
                    "DELETE FROM cookies WHERE host_key = ? AND name = ? AND path = ?",
                    (record.host_key, record.name, record.path)
            )
            self.status_var.set(f"Đã xóa cookie '{record.name}'.")
        except sqlite3.OperationalError as exc:
            messagebox.showerror("Lỗi", f"Không thể xóa cookie: {exc}")

    def _delete_domain(self):
        if not self.current_domain:
            messagebox.showinfo("Cookie", "Vui lòng chọn domain.")
            return
        domain_label = self._format_domain(self.current_domain)
        if not messagebox.askyesno("Xóa domain", f"Xóa tất cả cookie của domain '{domain_label}'?"):
            return
        try:
            with sqlite3.connect(self.db_path, timeout=3) as conn:
                conn.execute("DELETE FROM cookies WHERE host_key = ?", (self.current_domain,))
            self.status_var.set(f"Đã xóa cookie domain '{domain_label}'.")
        except sqlite3.OperationalError as exc:
            messagebox.showerror("Lỗi", f"Không thể xóa domain: {exc}")
            return
        self.refresh_cookies()

    def _delete_all(self):
        if not self.cookies_by_domain:
            return
        if not messagebox.askyesno("Xóa tất cả", "Bạn có chắc muốn xóa toàn bộ cookie?"):
            return
        try:
            with sqlite3.connect(self.db_path, timeout=3) as conn:
                conn.execute("DELETE FROM cookies")
            self.status_var.set("Đã xóa toàn bộ cookie.")
        except sqlite3.OperationalError as exc:
            messagebox.showerror("Lỗi", f"Không thể xóa cookie: {exc}")
            return
        self.refresh_cookies()

    def _handle_close(self):
        if callable(self._on_close):
            try:
                self._on_close()
            except Exception:
                pass
        self.destroy()

    @staticmethod
    def _format_domain(domain: str) -> str:
        return domain or "(không xác định)"
