import datetime
import os
import re
import io
import json
import time
import html
import zipfile
import random
import threading
import subprocess
import sys
import shutil
import tempfile
from typing import Optional

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext

import requests
from bs4 import BeautifulSoup
from packaging.version import parse as parse_version

from app.nd5.loader import load_nd5_plugins
from app.nd5.plugin_api import ND5Context
from app.core.browser_cookies import load_browser_cookie_jar
from app.paths import BASE_DIR
from app.ui.constants import DEFAULT_API_SETTINGS, DEFAULT_ND5_OPTIONS

_Popen = subprocess.Popen
CREATE_NO_WINDOW = 0x08000000 if sys.platform == "win32" else 0


class ND5Mixin:

    def _ensure_fanqie_bridge_running(self):
        """Khởi chạy tools/fanqie_bridge_win.exe âm thầm nếu có."""
        try:
            exe_path = os.path.join(BASE_DIR, "tools", "fanqie_bridge_win.exe")
            if not os.path.isfile(exe_path):
                return False
            if getattr(self, "_fanqie_bridge_proc", None) and self._fanqie_bridge_proc.poll() is None:  # type: ignore[attr-defined]
                return True
            creation = 0
            try:
                creation = CREATE_NO_WINDOW
            except Exception:
                creation = 0
            self._fanqie_bridge_proc = _Popen(  # type: ignore[attr-defined]
                [exe_path],
                creationflags=creation,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return True
        except Exception as exc:
            try:
                self.log(f"[Fanqie] Không khởi chạy được bridge: {exc}")
            except Exception:
                pass
            return False

    def _stop_fanqie_bridge(self):
        """Tắt tiến trình fanqie_bridge nếu đang chạy."""
        proc = getattr(self, "_fanqie_bridge_proc", None)
        if not proc:
            return
        try:
            if proc.poll() is None:
                try:
                    proc.terminate()
                except Exception:
                    pass
                for _ in range(5):
                    if proc.poll() is not None:
                        break
                    time.sleep(0.2)
                if proc.poll() is None:
                    try:
                        proc.kill()
                    except Exception:
                        pass
            self._fanqie_bridge_proc = None
        except Exception as exc:
            try:
                self.log(f"[Fanqie] Không tắt được bridge: {exc}")
            except Exception:
                pass
        if sys.platform.startswith("win"):
            try:
                subprocess.run(
                    ["taskkill", "/IM", "fanqie_bridge_win.exe", "/F", "/T"],
                    check=False,
                    creationflags=CREATE_NO_WINDOW if 'CREATE_NO_WINDOW' in globals() else 0,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            except Exception:
                pass

    def _fanqie_progress_dir(self) -> str:
        path = os.path.join(BASE_DIR, "local", "fanqie_progress")
        os.makedirs(path, exist_ok=True)
        return path

    def _fanqie_progress_path(self, book_id: str) -> str:
        safe = re.sub(r"[^A-Za-z0-9_-]+", "_", book_id or "unknown")
        return os.path.join(self._fanqie_progress_dir(), f"{safe}.json")

    def _fanqie_load_progress(self, book_id: str):
        if not book_id:
            return None
        try:
            path = self._fanqie_progress_path(book_id)
            if not os.path.isfile(path):
                return None
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def _fanqie_save_progress(self, book_id: str, data: dict):
        if not book_id or not isinstance(data, dict):
            return
        try:
            path = self._fanqie_progress_path(book_id)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as exc:
            try:
                self.log(f"[Fanqie] Không ghi được tiến độ: {exc}")
            except Exception:
                pass

    def _fanqie_clear_progress_cache(self):
        try:
            cache_dir = os.path.join(BASE_DIR, "local", "fanqie_progress")
            if os.path.isdir(cache_dir):
                shutil.rmtree(cache_dir, ignore_errors=True)
        except Exception:
            pass

    def _open_fanqie_downloader(self, out_dir_override: str = None, prefill_url: str = None):
        """Mở cửa sổ tải Fanqie/ND5 (non-modal)."""
        win = tk.Toplevel(self)
        self._apply_window_icon(win)
        win.title("Download Novel 5 (Plugin)")
        win.geometry("880x720")
        win.columnconfigure(0, weight=1)
        win.rowconfigure(4, weight=1)

        plugins, plugin_errors = load_nd5_plugins(BASE_DIR, include_builtin=True)
        if not plugins:
            msg = "Không tìm thấy plugin nào trong thư mục nd5_plugins."
            if plugin_errors:
                msg += f"\nLỗi: {plugin_errors}"
            messagebox.showerror("ND5", msg, parent=win)
            win.destroy()
            return

        # state
        current_book = {"meta": None, "toc": []}
        cover_cache = {"bytes": None}
        cover_photo = {"image": None}
        api_status_var = tk.StringVar(value="Dùng HTTP trực tiếp (không cần bridge).")
        status_var = tk.StringVar(value="Sẵn sàng.")
        book_title_var = tk.StringVar(value="")
        book_meta_var = tk.StringVar(value="")
        book_status_var = tk.StringVar(value="")
        url_var = tk.StringVar(value=prefill_url or "")
        ext_var = tk.StringVar(value=plugins[0].id)
        fmt_var = tk.StringVar(value="zip")
        title_tpl_var = tk.StringVar(value="{num}. {title}")
        filename_tpl_var = tk.StringVar(value=DEFAULT_ND5_OPTIONS["filename_tpl"])
        range_var = tk.StringVar(value="")
        include_info_var = tk.BooleanVar(value=True)
        include_cover_var = tk.BooleanVar(value=True)
        heading_in_zip_var = tk.BooleanVar(value=True)
        req_delay_min_var = tk.DoubleVar(value=self.nd5_options.get("req_delay_min", DEFAULT_ND5_OPTIONS["req_delay_min"]))
        req_delay_max_var = tk.DoubleVar(value=self.nd5_options.get("req_delay_max", DEFAULT_ND5_OPTIONS["req_delay_max"]))
        req_timeout_var = tk.DoubleVar(value=self.nd5_options.get("request_timeout", DEFAULT_ND5_OPTIONS["request_timeout"]))
        req_retries_var = tk.IntVar(value=self.nd5_options.get("request_retries", DEFAULT_ND5_OPTIONS["request_retries"]))
        out_dir_var = tk.StringVar(value=out_dir_override or self.nd5_options.get("out_dir", ""))
        plugin_values_cache = self.app_config.get("nd5_plugin_values")
        if not isinstance(plugin_values_cache, dict):
            plugin_values_cache = {}
        plugin_values_cache = dict(plugin_values_cache)

        def _get_plugin_by_id(pid: str):
            for p in plugins:
                if p.id == pid:
                    return p
            return None

        def _current_plugin():
            return _get_plugin_by_id(ext_var.get())

        def _plugin_matches_url(plugin, url: str) -> bool:
            if not plugin or not url:
                return False
            checker = getattr(plugin, "supports_url", None)
            if callable(checker):
                try:
                    return bool(checker(url))
                except Exception:
                    return False
            domains = getattr(plugin, "domains", None) or []
            url_lower = url.lower()
            for domain in domains:
                if domain and domain.lower() in url_lower:
                    return True
            return False

        def _find_plugin_for_url(url: str):
            for plugin in plugins:
                if _plugin_matches_url(plugin, url):
                    return plugin
            return None

        def _plugin_label():
            p = _current_plugin()
            return p.name if p else "N/A"

        def _plugin_sample():
            p = _current_plugin()
            return getattr(p, "sample_url", "") or "https://fanqienovel.com/page/123456"

        def _plugin_requires_bridge():
            p = _current_plugin()
            return bool(getattr(p, "requires_bridge", False))

        def _plugin_supports_search():
            p = _current_plugin()
            return callable(getattr(p, "search", None))

        def _normalize_extra_fields(items):
            results = []
            if not isinstance(items, list):
                return results
            for item in items:
                if isinstance(item, dict):
                    key = item.get("key") or item.get("name")
                    if not key:
                        continue
                    results.append(
                        {
                            "key": str(key),
                            "label": item.get("label") or key,
                            "description": item.get("description") or item.get("desc") or "",
                            "default": item.get("default") or "",
                            "secret": bool(item.get("secret") or item.get("password")),
                        }
                    )
                elif isinstance(item, (list, tuple)) and len(item) >= 2:
                    key = item[0]
                    if not key:
                        continue
                    results.append(
                        {
                            "key": str(key),
                            "label": item[1] or key,
                            "description": item[2] if len(item) > 2 else "",
                            "default": item[3] if len(item) > 3 else "",
                            "secret": False,
                        }
                    )
            return results

        def _get_plugin_extra_fields():
            plugin = _current_plugin()
            if not plugin:
                return []
            fields = []
            getter = getattr(plugin, "get_additional_fields", None)
            if callable(getter):
                try:
                    fields = getter() or []
                except Exception:
                    fields = []
            if not fields:
                fields = getattr(plugin, "additional_fields", []) or []
            return _normalize_extra_fields(fields)

        def _get_plugin_extra_ui_builder():
            plugin = _current_plugin()
            if not plugin:
                return None
            builder = getattr(plugin, "build_additional_values_ui", None)
            if callable(builder):
                return builder
            builder = getattr(plugin, "build_extra_values_ui", None)
            if callable(builder):
                return builder
            return None

        def _plugin_has_extra_values():
            return bool(_get_plugin_extra_fields() or _get_plugin_extra_ui_builder())

        def _get_plugin_values(plugin_id: str):
            raw = plugin_values_cache.get(plugin_id)
            return dict(raw) if isinstance(raw, dict) else {}

        def _save_plugin_values(plugin_id: str, values: dict):
            plugin_values_cache[plugin_id] = dict(values)
            self.app_config["nd5_plugin_values"] = dict(plugin_values_cache)
            try:
                self.save_config()
            except Exception:
                pass

        def _build_ctx():
            plugin = _current_plugin()
            timeout_val = max(5.0, float(req_timeout_var.get() or DEFAULT_ND5_OPTIONS["request_timeout"]))
            try:
                retries = int(req_retries_var.get())
            except Exception:
                retries = DEFAULT_ND5_OPTIONS["request_retries"]
            extra_values = {}
            cookies = None
            if plugin:
                extra_values = _get_plugin_values(plugin.id)
                for field in _get_plugin_extra_fields():
                    key = field["key"]
                    if key not in extra_values and field.get("default") not in (None, ""):
                        extra_values[key] = field.get("default")
                if getattr(plugin, "requires_cookies", False):
                    domains = getattr(plugin, "cookie_domains", None) or getattr(plugin, "domains", None) or []
                    try:
                        cookies = load_browser_cookie_jar(domains)
                    except Exception:
                        cookies = None
                    if cookies is None:
                        try:
                            self.log(f"[ND5][{plugin.id}] Không đọc được cookie cho plugin (domain={domains}).")
                        except Exception:
                            pass
            return ND5Context(self, plugin.id if plugin else "", timeout=timeout_val, retries=retries, extra=extra_values, cookies=cookies)

        def _get_proxy():
            try:
                return self._get_proxy_for_request("fanqie")
            except Exception:
                return None

        def _get_fanqie_headers():
            try:
                return dict(self.api_settings.get("fanqie_headers", {}))
            except Exception:
                return {}

        def _get_delay_range():
            try:
                mn = float(req_delay_min_var.get())
                mx = float(req_delay_max_var.get())
                if mx < mn:
                    mx = mn
                return mn, mx
            except Exception:
                return DEFAULT_ND5_OPTIONS["req_delay_min"], DEFAULT_ND5_OPTIONS["req_delay_max"]

        def _open_search_dialog():
            plugin = _current_plugin()
            if not plugin or not _plugin_supports_search():
                messagebox.showinfo("Tìm kiếm", "Plugin hiện tại không hỗ trợ tìm kiếm.", parent=win)
                return
            dlg = tk.Toplevel(win)
            self._apply_window_icon(dlg)
            dlg.title(f"Tìm kiếm ({plugin.id})")
            dlg.geometry("640x420")
            dlg.columnconfigure(0, weight=1)
            dlg.rowconfigure(2, weight=1)

            query_var = tk.StringVar()
            page_var = tk.StringVar(value="1")
            url_var_local = tk.StringVar()
            status_var2 = tk.StringVar(value="Nhập từ khóa rồi bấm Tìm.")
            results_store = []
            next_page_store = {"value": None}

            top = ttk.Frame(dlg, padding=10)
            top.grid(row=0, column=0, sticky="ew")
            top.columnconfigure(1, weight=1)
            ttk.Label(top, text="Từ khóa:").grid(row=0, column=0, sticky="w", padx=(0, 6))
            ttk.Entry(top, textvariable=query_var).grid(row=0, column=1, sticky="ew")
            ttk.Label(top, text="Trang:").grid(row=0, column=2, sticky="e", padx=(8, 4))
            ttk.Spinbox(top, from_=1, to=999, textvariable=page_var, width=5).grid(row=0, column=3, sticky="w")
            search_btn_local = ttk.Button(top, text="Tìm", width=8)
            search_btn_local.grid(row=0, column=4, padx=(8, 0))

            cols = ("title", "author", "url")
            tree = ttk.Treeview(dlg, columns=cols, show="headings")
            tree.heading("title", text="Tiêu đề")
            tree.heading("author", text="Tác giả")
            tree.heading("url", text="URL")
            tree.column("title", width=320)
            tree.column("author", width=120)
            tree.column("url", width=200)
            tree.grid(row=2, column=0, sticky="nsew", padx=10, pady=(0, 4))
            tree_scroll = ttk.Scrollbar(dlg, orient="vertical", command=tree.yview)
            tree.configure(yscrollcommand=tree_scroll.set)
            tree_scroll.grid(row=2, column=1, sticky="ns", pady=(0, 4))

            ttk.Label(dlg, textvariable=status_var2, padding=(10, 4)).grid(row=3, column=0, columnspan=2, sticky="w")

            def _on_select():
                sel = tree.selection()
                if not sel:
                    return
                idx = int(sel[0])
                if 0 <= idx < len(results_store):
                    item = results_store[idx]
                    url_var.set(item.get("url") or "")
                dlg.destroy()

            def _run_search():
                q = query_var.get().strip()
                if not q:
                    status_var2.set("Nhập từ khóa trước.")
                    return
                try:
                    page_val = max(1, int(page_var.get()))
                except Exception:
                    page_val = 1
                status_var2.set("Đang tìm...")
                search_btn_local.state(["disabled"])
                next_btn.state(["disabled"])
                tree.delete(*tree.get_children())

                def worker():
                    ctx_local = _build_ctx()
                    try:
                        result = plugin.search(q, page_val, ctx_local)
                        items = []
                        next_page = None
                        if isinstance(result, tuple) and len(result) >= 1:
                            items = result[0] or []
                            if len(result) >= 2:
                                next_page = result[1]
                        elif isinstance(result, list):
                            items = result
                        else:
                            items = []

                        def _fill():
                            results_store.clear()
                            results_store.extend(items)
                            for idx, it in enumerate(items):
                                tree.insert(
                                    "",
                                    "end",
                                    iid=str(idx),
                                    values=(
                                        it.get("title") or it.get("name") or "",
                                        it.get("author") or it.get("desc") or "",
                                        it.get("url") or it.get("link") or "",
                                    ),
                                )
                            next_page_store["value"] = next_page
                            if next_page:
                                page_var.set(next_page)
                                status_var2.set(f"Tìm thấy {len(items)} kết quả. Trang tiếp: {next_page}")
                                next_btn.state(["!disabled"])
                            else:
                                status_var2.set(f"Tìm thấy {len(items)} kết quả.")
                                next_btn.state(["disabled"])
                            search_btn_local.state(["!disabled"])

                        self.after(0, _fill)
                    except Exception as exc:
                        self.after(0, lambda exc=exc: status_var2.set(f"Lỗi: {exc}"))
                        self.after(0, lambda: search_btn_local.state(["!disabled"]))

                threading.Thread(target=worker, daemon=True).start()

            def _next_page():
                nxt = next_page_store.get("value")
                if not nxt:
                    return
                try:
                    page_var.set(int(nxt))
                except Exception:
                    page_var.set(nxt)
                _run_search()

            search_btn_local.configure(command=_run_search)
            btn_row = ttk.Frame(dlg, padding=(10, 0, 10, 10))
            btn_row.grid(row=4, column=0, columnspan=2, sticky="ew")
            btn_row.columnconfigure(1, weight=1)
            next_btn = ttk.Button(btn_row, text="Trang tiếp", command=_next_page, state=tk.DISABLED)
            next_btn.grid(row=0, column=0, sticky="w")
            ttk.Button(btn_row, text="Dùng URL", command=_on_select).grid(row=0, column=2, sticky="e")
            tree.bind("<Double-1>", lambda _e: _on_select())
            dlg.protocol("WM_DELETE_WINDOW", dlg.destroy)
            query_var.set(url_var.get() or "")

        nd5_settings_win = {"ref": None}

        def _open_settings_dialog():
            existing = nd5_settings_win.get("ref")
            if existing and existing.winfo_exists():
                try:
                    existing.lift()
                    existing.focus_set()
                    return
                except Exception:
                    nd5_settings_win["ref"] = None

            dlg = tk.Toplevel(win)
            self._apply_window_icon(dlg)
            dlg.title("Cài đặt ND5")
            dlg.geometry("820x600")
            dlg.columnconfigure(0, weight=1)
            dlg.rowconfigure(0, weight=1)
            nd5_settings_win["ref"] = dlg

            content = ttk.Frame(dlg, padding=12)
            content.grid(row=0, column=0, sticky="nsew")
            content.rowconfigure(0, weight=1)
            content.columnconfigure(0, weight=1)

            notebook = ttk.Notebook(content)
            notebook.grid(row=0, column=0, sticky="nsew")

            tab_options = ttk.Frame(notebook, padding=12)
            tab_repo = ttk.Frame(notebook, padding=12)
            tab_installed = ttk.Frame(notebook, padding=12)
            notebook.add(tab_options, text="Tuỳ chọn")
            notebook.add(tab_repo, text="Kho plugin")
            notebook.add(tab_installed, text="Plugin đã cài")

            tab_options.columnconfigure(1, weight=1)

            ttk.Label(tab_options, text="Tiêu đề trong file:").grid(row=0, column=0, sticky="w")
            ttk.Entry(tab_options, textvariable=title_tpl_var).grid(row=0, column=1, sticky="ew", padx=(6, 0))
            ttk.Label(tab_options, text="Dùng {num} và/hoặc {title}").grid(row=1, column=1, sticky="w", padx=(6, 0), pady=(2, 8))

            ttk.Label(tab_options, text="Tên file xuất:").grid(row=2, column=0, sticky="w")
            ttk.Entry(tab_options, textvariable=filename_tpl_var).grid(row=2, column=1, sticky="ew", padx=(6, 0))
            ttk.Label(
                tab_options,
                text="Dùng {title}, {author}, {book_id}. Đuôi tự thêm theo định dạng.",
            ).grid(row=3, column=1, sticky="w", padx=(6, 0), pady=(2, 8))

            delay_frame = ttk.Frame(tab_options)
            delay_frame.grid(row=4, column=0, columnspan=2, sticky="w", pady=(4, 0))
            ttk.Label(delay_frame, text="Độ trễ giữa các request (giây):").pack(side=tk.LEFT)
            ttk.Entry(delay_frame, textvariable=req_delay_min_var, width=8).pack(side=tk.LEFT, padx=(6, 4))
            ttk.Label(delay_frame, text="đến").pack(side=tk.LEFT)
            ttk.Entry(delay_frame, textvariable=req_delay_max_var, width=8).pack(side=tk.LEFT, padx=(4, 0))

            timeout_frame = ttk.Frame(tab_options)
            timeout_frame.grid(row=5, column=0, columnspan=2, sticky="w", pady=(8, 0))
            ttk.Label(timeout_frame, text="Timeout request (giây):").pack(side=tk.LEFT)
            ttk.Entry(timeout_frame, textvariable=req_timeout_var, width=8).pack(side=tk.LEFT, padx=(6, 0))
            ttk.Label(timeout_frame, text="Số lần thử lại:").pack(side=tk.LEFT, padx=(12, 0))
            ttk.Entry(timeout_frame, textvariable=req_retries_var, width=6).pack(side=tk.LEFT, padx=(6, 0))

            plugin_status_var = tk.StringVar(value="Sẵn sàng.")
            installed_status_var = tk.StringVar(value="Sẵn sàng.")
            source_entry_var = tk.StringVar()
            search_var = tk.StringVar()
            available_plugins = []
            available_view = []
            available_by_path = {}
            installed_view = []

            def _load_plugin_sources():
                sources = self.app_config.get("nd5_plugin_sources")
                if not isinstance(sources, list):
                    sources = []
                cleaned = []
                for item in sources:
                    if not isinstance(item, str):
                        continue
                    url = item.strip()
                    if url and url not in cleaned:
                        cleaned.append(url)
                return cleaned

            def _save_plugin_sources(sources):
                self.app_config["nd5_plugin_sources"] = list(sources)
                try:
                    self.save_config()
                except Exception:
                    pass

            def _load_plugin_registry():
                registry = self.app_config.get("nd5_plugin_registry")
                return registry if isinstance(registry, dict) else {}

            def _save_plugin_registry(registry):
                self.app_config["nd5_plugin_registry"] = dict(registry)
                try:
                    self.save_config()
                except Exception:
                    pass

            plugin_sources = _load_plugin_sources()
            plugin_registry = _load_plugin_registry()

            def _normalize_plugin_entry(raw, list_url):
                if not isinstance(raw, dict):
                    return None
                path = raw.get("path") or raw.get("url") or raw.get("link")
                if not path:
                    return None
                return {
                    "name": raw.get("name") or raw.get("title") or "",
                    "author": raw.get("author") or "",
                    "path": str(path),
                    "version": raw.get("version") or raw.get("ver") or "",
                    "source": raw.get("source") or "",
                    "icon": raw.get("icon") or "",
                    "description": raw.get("description") or "",
                    "type": raw.get("type") or "",
                    "locale": raw.get("locale") or "",
                    "tag": raw.get("tag") or "",
                    "list_url": list_url,
                }

            def _fetch_plugin_list(list_url):
                resp = requests.get(list_url, timeout=20)
                resp.raise_for_status()
                payload = resp.json()
                items = []
                if isinstance(payload, dict):
                    items = payload.get("data") or payload.get("items") or []
                elif isinstance(payload, list):
                    items = payload
                results = []
                if isinstance(items, list):
                    for raw in items:
                        entry = _normalize_plugin_entry(raw, list_url)
                        if entry:
                            results.append(entry)
                return results

            def _safe_extract_zip(zip_path, dest_dir):
                with zipfile.ZipFile(zip_path) as zf:
                    for member in zf.infolist():
                        name = member.filename
                        if not name:
                            continue
                        target = os.path.normpath(os.path.join(dest_dir, name))
                        if not target.startswith(os.path.abspath(dest_dir)):
                            raise ValueError("Đường dẫn trong zip không hợp lệ.")
                        zf.extract(member, dest_dir)

            def _find_manifest(root_dir):
                for base, _dirs, files in os.walk(root_dir):
                    if "manifest.json" in files:
                        return os.path.join(base, "manifest.json")
                return None

            def _read_manifest(path):
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)

            def _version_value(val):
                try:
                    return parse_version(str(val))
                except Exception:
                    return parse_version("0")

            def _install_plugin_entry(entry, action_label="Cài đặt"):
                if not entry:
                    return
                pkg_url = entry.get("path")
                if not pkg_url:
                    messagebox.showerror("Plugin", "Không có link tải plugin.", parent=dlg)
                    return

                plugin_status_var.set(f"Đang {action_label.lower()} plugin...")

                def worker():
                    tmp_dir = None
                    tmp_file = None
                    try:
                        resp = requests.get(pkg_url, stream=True, timeout=30)
                        resp.raise_for_status()
                        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
                        for chunk in resp.iter_content(chunk_size=8192):
                            if chunk:
                                tmp_file.write(chunk)
                        tmp_file.close()

                        tmp_dir = tempfile.mkdtemp(prefix="nd5_plugin_")
                        _safe_extract_zip(tmp_file.name, tmp_dir)
                        manifest_path = _find_manifest(tmp_dir)
                        if not manifest_path:
                            raise ValueError("Không tìm thấy manifest.json trong plugin zip.")
                        manifest = _read_manifest(manifest_path)
                        plugin_id = manifest.get("id") or ""
                        if not plugin_id:
                            raise ValueError("manifest.json thiếu id.")
                        if not re.match(r"^[A-Za-z0-9_-]+$", str(plugin_id)):
                            raise ValueError("id plugin không hợp lệ.")
                        plugin_root = os.path.dirname(manifest_path)
                        entry_file = manifest.get("entry") or "plugin.py"
                        entry_path = os.path.join(plugin_root, entry_file)
                        if not os.path.isfile(entry_path):
                            raise ValueError("Không tìm thấy file entry trong plugin.")

                        dest_root = os.path.join(BASE_DIR, "nd5_plugins")
                        os.makedirs(dest_root, exist_ok=True)
                        dest_path = os.path.join(dest_root, str(plugin_id))
                        if os.path.isdir(dest_path):
                            shutil.rmtree(dest_path, ignore_errors=True)
                        shutil.copytree(plugin_root, dest_path)

                        plugin_registry[str(plugin_id)] = {
                            "id": str(plugin_id),
                            "name": manifest.get("name") or entry.get("name") or str(plugin_id),
                            "author": manifest.get("author") or entry.get("author") or "",
                            "version": manifest.get("version") or entry.get("version") or "",
                            "source_list": entry.get("list_url") or "",
                            "package_url": entry.get("path") or "",
                            "installed_at": datetime.datetime.now().isoformat(timespec="seconds"),
                        }
                        _save_plugin_registry(plugin_registry)

                        self.after(0, lambda: plugin_status_var.set(f"{action_label} thành công: {plugin_id}"))
                        self.after(0, _refresh_installed_plugins)
                    except Exception as exc:
                        self.after(0, lambda exc=exc: messagebox.showerror("Plugin", f"{action_label} thất bại: {exc}", parent=dlg))
                        self.after(0, lambda: plugin_status_var.set("Lỗi khi cài plugin."))
                    finally:
                        try:
                            if tmp_file and os.path.isfile(tmp_file.name):
                                os.unlink(tmp_file.name)
                        except Exception:
                            pass
                        if tmp_dir:
                            shutil.rmtree(tmp_dir, ignore_errors=True)

                threading.Thread(target=worker, daemon=True).start()

            def _scan_installed_plugins():
                results = []
                root = os.path.join(BASE_DIR, "nd5_plugins")
                if not os.path.isdir(root):
                    return results
                for name in sorted(os.listdir(root)):
                    folder = os.path.join(root, name)
                    if not os.path.isdir(folder):
                        continue
                    manifest_path = os.path.join(folder, "manifest.json")
                    if not os.path.isfile(manifest_path):
                        continue
                    try:
                        manifest = _read_manifest(manifest_path)
                    except Exception:
                        continue
                    plugin_id = manifest.get("id") or name
                    registry = plugin_registry.get(plugin_id, {})
                    results.append(
                        {
                            "id": str(plugin_id),
                            "name": manifest.get("name") or name,
                            "version": manifest.get("version") or registry.get("version") or "",
                            "author": manifest.get("author") or registry.get("author") or "",
                            "package_url": registry.get("package_url") or "",
                            "source_list": registry.get("source_list") or "",
                        }
                    )
                return results

            def _refresh_available_plugins():
                sources = list(plugin_sources)
                if not sources:
                    plugin_status_var.set("Chưa có link nguồn plugin.")
                    return
                plugin_status_var.set("Đang tải danh sách plugin...")

                def worker():
                    merged = []
                    errors = []
                    for src in sources:
                        try:
                            merged.extend(_fetch_plugin_list(src))
                        except Exception as exc:
                            errors.append(f"{src}: {exc}")
                    dedup = {}
                    for item in merged:
                        path = item.get("path")
                        if path and path not in dedup:
                            dedup[path] = item
                    items = list(dedup.values())

                    def _apply():
                        nonlocal available_plugins, available_by_path
                        available_plugins = items
                        available_by_path = {it["path"]: it for it in items if it.get("path")}
                        _apply_available_filter()
                        _refresh_installed_plugins()
                        if errors:
                            plugin_status_var.set(f"Lỗi tải một số nguồn ({len(errors)}).")
                        else:
                            plugin_status_var.set(f"Tìm thấy {len(items)} plugin.")

                    self.after(0, _apply)

                threading.Thread(target=worker, daemon=True).start()

            def _render_available_list(items):
                nonlocal available_view
                available_view = list(items)
                available_tree.delete(*available_tree.get_children())
                for idx, item in enumerate(available_view):
                    available_tree.insert(
                        "",
                        "end",
                        iid=str(idx),
                        values=(
                            item.get("name", ""),
                            item.get("author", ""),
                            item.get("version", ""),
                            item.get("source", ""),
                            item.get("type", ""),
                            item.get("locale", ""),
                        ),
                    )

            def _apply_available_filter(*_args):
                query = search_var.get().strip().lower()
                if not query:
                    _render_available_list(available_plugins)
                    return
                filtered = []
                for item in available_plugins:
                    blob = " ".join(
                        str(item.get(key, "") or "")
                        for key in ("name", "author", "source", "description", "type", "locale", "tag")
                    ).lower()
                    if query in blob:
                        filtered.append(item)
                _render_available_list(filtered)

            def _install_selected_plugin():
                sel = available_tree.selection()
                if not sel:
                    messagebox.showinfo("Plugin", "Chọn plugin để cài đặt.", parent=dlg)
                    return
                idx = int(sel[0])
                if idx < 0 or idx >= len(available_view):
                    return
                _install_plugin_entry(available_view[idx], action_label="Cài đặt")

            def _render_installed_list(items):
                nonlocal installed_view
                installed_view = list(items)
                installed_tree.delete(*installed_tree.get_children())
                for idx, item in enumerate(installed_view):
                    installed_tree.insert(
                        "",
                        "end",
                        iid=str(idx),
                        values=(
                            item.get("id", ""),
                            item.get("name", ""),
                            item.get("version", ""),
                            item.get("update", ""),
                            item.get("source", ""),
                        ),
                    )

            def _refresh_installed_plugins():
                items = _scan_installed_plugins()
                for item in items:
                    update_entry = None
                    pkg_url = item.get("package_url")
                    if pkg_url and pkg_url in available_by_path:
                        update_entry = available_by_path[pkg_url]
                    item["update_entry"] = update_entry
                    if update_entry:
                        installed_v = _version_value(item.get("version"))
                        available_v = _version_value(update_entry.get("version"))
                        item["update"] = "Có" if available_v > installed_v else ""
                        item["source"] = update_entry.get("source") or item.get("source_list") or ""
                    else:
                        item["update"] = ""
                        item["source"] = item.get("source_list") or ""
                _render_installed_list(items)
                installed_status_var.set(f"Đã cài {len(items)} plugin.")

            def _remove_selected_plugin():
                sel = installed_tree.selection()
                if not sel:
                    messagebox.showinfo("Plugin", "Chọn plugin để gỡ.", parent=dlg)
                    return
                idx = int(sel[0])
                if idx < 0 or idx >= len(installed_view):
                    return
                item = installed_view[idx]
                plugin_id = item.get("id")
                if not plugin_id:
                    return
                if not messagebox.askyesno("Xác nhận", f"Gỡ plugin '{plugin_id}'?", parent=dlg):
                    return
                folder = os.path.join(BASE_DIR, "nd5_plugins", plugin_id)
                if os.path.isdir(folder):
                    shutil.rmtree(folder, ignore_errors=True)
                plugin_registry.pop(plugin_id, None)
                _save_plugin_registry(plugin_registry)
                _refresh_installed_plugins()

            def _update_selected_plugin():
                sel = installed_tree.selection()
                if not sel:
                    messagebox.showinfo("Plugin", "Chọn plugin để cập nhật.", parent=dlg)
                    return
                idx = int(sel[0])
                if idx < 0 or idx >= len(installed_view):
                    return
                item = installed_view[idx]
                entry = item.get("update_entry")
                if not entry:
                    messagebox.showinfo("Plugin", "Không có bản cập nhật mới.", parent=dlg)
                    return
                _install_plugin_entry(entry, action_label="Cập nhật")

            def _render_source_list():
                source_listbox.delete(0, tk.END)
                for src in plugin_sources:
                    source_listbox.insert(tk.END, src)

            def _add_source():
                url = source_entry_var.get().strip()
                if not url:
                    return
                if url not in plugin_sources:
                    plugin_sources.append(url)
                    _save_plugin_sources(plugin_sources)
                    _render_source_list()
                source_entry_var.set("")

            def _remove_source():
                sel = source_listbox.curselection()
                if not sel:
                    return
                idx = sel[0]
                if 0 <= idx < len(plugin_sources):
                    plugin_sources.pop(idx)
                    _save_plugin_sources(plugin_sources)
                    _render_source_list()

            tab_repo.columnconfigure(0, weight=1)
            tab_repo.rowconfigure(1, weight=1)

            sources_frame = ttk.LabelFrame(tab_repo, text="Nguồn danh sách plugin", padding=10)
            sources_frame.grid(row=0, column=0, sticky="ew")
            sources_frame.columnconfigure(0, weight=1)
            source_listbox = tk.Listbox(sources_frame, height=4)
            source_listbox.grid(row=0, column=0, sticky="ew")
            source_scroll = ttk.Scrollbar(sources_frame, orient="vertical", command=source_listbox.yview)
            source_scroll.grid(row=0, column=1, sticky="ns")
            source_listbox.configure(yscrollcommand=source_scroll.set)

            entry_row = ttk.Frame(sources_frame)
            entry_row.grid(row=1, column=0, columnspan=2, sticky="ew", pady=(6, 0))
            entry_row.columnconfigure(0, weight=1)
            ttk.Entry(entry_row, textvariable=source_entry_var).grid(row=0, column=0, sticky="ew")
            ttk.Button(entry_row, text="Thêm", command=_add_source).grid(row=0, column=1, padx=(6, 0))
            ttk.Button(entry_row, text="Xóa", command=_remove_source).grid(row=0, column=2, padx=(6, 0))
            ttk.Button(entry_row, text="Tải danh sách", command=_refresh_available_plugins).grid(row=0, column=3, padx=(6, 0))

            available_frame = ttk.LabelFrame(tab_repo, text="Danh sách plugin", padding=10)
            available_frame.grid(row=1, column=0, sticky="nsew", pady=(10, 0))
            available_frame.columnconfigure(0, weight=1)
            available_frame.rowconfigure(1, weight=1)

            search_row = ttk.Frame(available_frame)
            search_row.grid(row=0, column=0, sticky="ew", pady=(0, 6))
            search_row.columnconfigure(1, weight=1)
            ttk.Label(search_row, text="Tìm:").grid(row=0, column=0, sticky="w")
            ttk.Entry(search_row, textvariable=search_var).grid(row=0, column=1, sticky="ew", padx=(6, 0))
            ttk.Button(search_row, text="Làm mới", command=_refresh_available_plugins).grid(row=0, column=2, padx=(6, 0))

            cols = ("name", "author", "version", "source", "type", "locale")
            available_tree = ttk.Treeview(available_frame, columns=cols, show="headings", selectmode="browse")
            available_tree.heading("name", text="Tên")
            available_tree.heading("author", text="Tác giả")
            available_tree.heading("version", text="Version")
            available_tree.heading("source", text="Source")
            available_tree.heading("type", text="Type")
            available_tree.heading("locale", text="Locale")
            available_tree.column("name", width=200)
            available_tree.column("author", width=120)
            available_tree.column("version", width=70)
            available_tree.column("source", width=200)
            available_tree.column("type", width=80)
            available_tree.column("locale", width=80)
            available_tree.grid(row=1, column=0, sticky="nsew")
            available_scroll = ttk.Scrollbar(available_frame, orient="vertical", command=available_tree.yview)
            available_tree.configure(yscrollcommand=available_scroll.set)
            available_scroll.grid(row=1, column=1, sticky="ns")

            available_btns = ttk.Frame(available_frame)
            available_btns.grid(row=2, column=0, sticky="ew", pady=(6, 0))
            available_btns.columnconfigure(1, weight=1)
            ttk.Button(available_btns, text="Cài đặt", command=_install_selected_plugin).grid(row=0, column=0, sticky="w")
            ttk.Button(available_btns, text="Xem plugin đã cài", command=lambda: notebook.select(tab_installed)).grid(row=0, column=2, sticky="e")
            ttk.Label(available_frame, textvariable=plugin_status_var).grid(row=3, column=0, sticky="w", pady=(6, 0))

            tab_installed.columnconfigure(0, weight=1)
            tab_installed.rowconfigure(0, weight=1)

            installed_frame = ttk.LabelFrame(tab_installed, text="Plugin đã cài", padding=10)
            installed_frame.grid(row=0, column=0, sticky="nsew")
            installed_frame.columnconfigure(0, weight=1)
            installed_frame.rowconfigure(0, weight=1)

            installed_cols = ("id", "name", "version", "update", "source")
            installed_tree = ttk.Treeview(installed_frame, columns=installed_cols, show="headings", selectmode="browse")
            installed_tree.heading("id", text="ID")
            installed_tree.heading("name", text="Tên")
            installed_tree.heading("version", text="Version")
            installed_tree.heading("update", text="Update")
            installed_tree.heading("source", text="Source")
            installed_tree.column("id", width=120)
            installed_tree.column("name", width=200)
            installed_tree.column("version", width=80)
            installed_tree.column("update", width=70)
            installed_tree.column("source", width=200)
            installed_tree.grid(row=0, column=0, sticky="nsew")
            installed_scroll = ttk.Scrollbar(installed_frame, orient="vertical", command=installed_tree.yview)
            installed_tree.configure(yscrollcommand=installed_scroll.set)
            installed_scroll.grid(row=0, column=1, sticky="ns")

            installed_btns = ttk.Frame(tab_installed)
            installed_btns.grid(row=1, column=0, sticky="ew", pady=(6, 0))
            installed_btns.columnconfigure(1, weight=1)
            ttk.Button(installed_btns, text="Làm mới", command=_refresh_installed_plugins).grid(row=0, column=0, sticky="w")
            ttk.Button(installed_btns, text="Cập nhật", command=_update_selected_plugin).grid(row=0, column=2, sticky="e")
            ttk.Button(installed_btns, text="Gỡ", command=_remove_selected_plugin).grid(row=0, column=3, sticky="e", padx=(6, 0))
            ttk.Label(tab_installed, textvariable=installed_status_var).grid(row=2, column=0, sticky="w", pady=(6, 0))

            search_var.trace_add("write", _apply_available_filter)  # type: ignore[arg-type]
            _render_source_list()
            _refresh_installed_plugins()

            btn_row = ttk.Frame(content)
            btn_row.grid(row=1, column=0, sticky="e", pady=(10, 0))
            def _save_and_notify():
                _persist_nd5_options()
                messagebox.showinfo("ND5", "Đã lưu cài đặt.", parent=dlg)

            ttk.Button(btn_row, text="Lưu", command=_save_and_notify).pack(side=tk.RIGHT)
            ttk.Button(btn_row, text="Đóng", command=dlg.destroy).pack(side=tk.RIGHT, padx=(0, 8))

            def _on_close():
                _persist_nd5_options()
                dlg.destroy()

            dlg.protocol("WM_DELETE_WINDOW", _on_close)

        def _open_extra_values_dialog():
            plugin = _current_plugin()
            if not plugin:
                messagebox.showinfo("ND5", "Chưa chọn plugin.", parent=win)
                return
            fields = _get_plugin_extra_fields()
            builder = _get_plugin_extra_ui_builder()
            if not fields and not builder:
                messagebox.showinfo("ND5", "Plugin này không có giá trị bổ sung.", parent=win)
                return
            dlg = tk.Toplevel(win)
            self._apply_window_icon(dlg)
            dlg.title(f"Giá trị bổ sung ({plugin.id})")
            dlg.geometry("560x420")
            dlg.columnconfigure(0, weight=1)
            dlg.rowconfigure(0, weight=1)

            container = ttk.Frame(dlg, padding=12)
            container.grid(row=0, column=0, sticky="nsew")
            container.columnconfigure(0, weight=1)
            container.rowconfigure(0, weight=1)

            canvas = tk.Canvas(container, highlightthickness=0)
            canvas.grid(row=0, column=0, sticky="nsew")
            scroll = ttk.Scrollbar(container, orient="vertical", command=canvas.yview)
            scroll.grid(row=0, column=1, sticky="ns")
            canvas.configure(yscrollcommand=scroll.set)

            inner = ttk.Frame(canvas)
            inner.columnconfigure(1, weight=1)
            inner_id = canvas.create_window((0, 0), window=inner, anchor="nw")

            def _sync_inner(_event=None):
                bbox = canvas.bbox("all")
                if bbox:
                    canvas.configure(scrollregion=bbox)
                canvas.itemconfigure(inner_id, width=canvas.winfo_width())

            inner.bind("<Configure>", _sync_inner)
            canvas.bind("<Configure>", lambda e: canvas.itemconfigure(inner_id, width=e.width))

            values = _get_plugin_values(plugin.id)
            field_vars = {}

            def _set_value(key: str, value):
                if not key:
                    return
                if value is None:
                    values.pop(key, None)
                    return
                text_val = str(value).strip()
                if text_val:
                    values[key] = text_val
                else:
                    values.pop(key, None)

            def _delete_value(key: str):
                if not key:
                    return
                values.pop(key, None)

            def _collect_field_values():
                for key, var in field_vars.items():
                    raw = var.get().strip()
                    if raw:
                        values[key] = raw
                    else:
                        values.pop(key, None)

            def _save_values(payload=None):
                if payload is None:
                    _collect_field_values()
                    data = dict(values)
                else:
                    data = dict(payload)
                _save_plugin_values(plugin.id, data)

            def _run_task(task, on_done=None, on_error=None):
                def worker():
                    try:
                        result = task()
                    except Exception as exc:
                        if on_error:
                            self.after(0, lambda exc=exc: on_error(exc))
                        return
                    if on_done:
                        self.after(0, lambda: on_done(result))
                threading.Thread(target=worker, daemon=True).start()

            def _open_browser(url: str):
                opener = getattr(self, "_open_in_app_browser", None)
                if callable(opener):
                    try:
                        opener(url, force_overlay=True)
                        return
                    except TypeError:
                        try:
                            opener(url)
                            return
                        except Exception:
                            pass
                    except Exception:
                        pass
                try:
                    import webbrowser

                    webbrowser.open(url)
                except Exception:
                    messagebox.showerror("ND5", "Không mở được trình duyệt.", parent=dlg)

            row = 0
            skip_default = False
            if builder:
                custom_frame = ttk.Frame(inner)
                custom_frame.grid(row=row, column=0, columnspan=2, sticky="ew", pady=(0, 10))
                custom_frame.columnconfigure(0, weight=1)
                try:
                    result = builder(
                        custom_frame,
                        values,
                        _set_value,
                        _delete_value,
                        _save_values,
                        _run_task,
                        _open_browser,
                    )
                    if result is False:
                        skip_default = True
                    elif isinstance(result, dict) and result.get("skip_default"):
                        skip_default = True
                except Exception as exc:
                    messagebox.showerror("ND5", f"Lỗi plugin: {exc}", parent=dlg)
                row += 1

            if fields and not skip_default:
                for field in fields:
                    key = field["key"]
                    label = field["label"] or key
                    desc = field.get("description") or "Không có mô tả."
                    default_val = field.get("default", "")
                    var = tk.StringVar(value=str(values.get(key, default_val) or ""))
                    field_vars[key] = var

                    ttk.Label(inner, text=f"{label}:").grid(row=row, column=0, sticky="w", padx=(0, 8), pady=(2, 0))
                    show_char = "*" if field.get("secret") else ""
                    ttk.Entry(inner, textvariable=var, show=show_char).grid(row=row, column=1, sticky="ew", pady=(2, 0))
                    row += 1
                    ttk.Label(inner, text=desc, foreground="#6b7280", wraplength=460, justify="left").grid(
                        row=row, column=1, sticky="w", pady=(0, 8)
                    )
                    row += 1

            btn_row = ttk.Frame(container)
            btn_row.grid(row=1, column=0, columnspan=2, sticky="e", pady=(10, 0))

            def _save():
                _save_values()
                messagebox.showinfo("ND5", "Đã lưu giá trị bổ sung.", parent=dlg)

            ttk.Button(btn_row, text="Lưu", command=_save).pack(side=tk.RIGHT)
            ttk.Button(btn_row, text="Đóng", command=dlg.destroy).pack(side=tk.RIGHT, padx=(0, 8))

            dlg.protocol("WM_DELETE_WINDOW", dlg.destroy)

        def _safe_filename(name: str, default="fanqie_book"):
            cleaned = re.sub(r'[\\\\/:*?"<>|]+', "_", name or "").strip()
            return cleaned or default

        def _build_filename(meta: dict, tpl: str, fmt: str):
            base_tpl = tpl or DEFAULT_ND5_OPTIONS["filename_tpl"]
            try:
                rendered = base_tpl.format(
                    title=meta.get("title", ""),
                    author=meta.get("author", ""),
                    book_id=meta.get("book_id", ""),
                )
            except Exception:
                rendered = meta.get("title", "") or "fanqie_book"
            stem = _safe_filename(rendered, default="fanqie_book")
            ext = f".{fmt.lower()}" if fmt else ".zip"
            return stem + ext

        def _normalize_newlines(text: str):
            text = text.replace("\r\n", "\n").replace("\r", "\n")
            return re.sub(r"\n{2,}", "\n", text)

        def _resolve_output_path(path: str):
            if not os.path.exists(path):
                return path
            filename = os.path.basename(path)
            resp = messagebox.askyesnocancel(
                "File đã tồn tại",
                f"File '{filename}' đã tồn tại.\nYes: Ghi đè\nNo: Đổi tên\nCancel: Thoát",
                parent=win
            )
            if resp is True:
                return path
            if resp is None:
                return None
            root, ext = os.path.splitext(path)
            idx = 1
            new_path = f"{root}({idx}){ext}"
            while os.path.exists(new_path):
                idx += 1
                new_path = f"{root}({idx}){ext}"
            return new_path

        def _content_to_text(content: str):
            if content is None:
                return ""
            text = str(content)
            if "<" in text and ">" in text:
                try:
                    soup = BeautifulSoup(text, "html.parser")
                    paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
                    if paragraphs:
                        return _normalize_newlines("\n\n".join(p for p in paragraphs if p))
                    return _normalize_newlines(soup.get_text("\n", strip=True))
                except Exception:
                    return _normalize_newlines(text)
            return _normalize_newlines(text)

        def _content_to_html(content: str):
            if content is None:
                return ""
            text = str(content)
            if "<" in text and ">" in text:
                return text
            lines = [line.strip() for line in re.split(r"\r?\n+", text) if line.strip()]
            escaped = [html.escape(line) for line in lines]
            return "<p>" + "</p><p>".join(escaped) + "</p>" if escaped else ""

        def _req_with_retry(url: str, method: str = "get", **kwargs):
            ctx = _build_ctx()
            return ctx.request_with_retry(url, method=method, **kwargs)

        def _pick_output():
            path = filedialog.askdirectory(title="Chọn thư mục lưu", initialdir=out_dir_var.get() or BASE_DIR)
            if path:
                out_dir_var.set(path)
                _persist_nd5_options()

        def _set_info(text: str):
            info_text.config(state="normal")
            info_text.delete("1.0", tk.END)
            if text:
                info_text.insert("1.0", text)
            info_text.config(state="disabled")

        def _set_cover_image(data: Optional[bytes]):
            if not data:
                cover_label.config(image="", text="Không có bìa")
                cover_photo["image"] = None
                return
            try:
                from PIL import Image, ImageTk

                img = Image.open(io.BytesIO(data))
                img.thumbnail((140, 200), Image.LANCZOS)
                photo = ImageTk.PhotoImage(img)
            except Exception:
                try:
                    photo = tk.PhotoImage(data=data)
                except Exception:
                    cover_label.config(image="", text="Không có bìa")
                    cover_photo["image"] = None
                    return
            cover_label.config(image=photo, text="")
            cover_photo["image"] = photo

        def _update_info_header(meta: Optional[dict]):
            if not meta:
                book_title_var.set("")
                book_meta_var.set("")
                book_status_var.set("")
                _set_cover_image(None)
                return
            title = meta.get("title", "")
            author = meta.get("author", "")
            status = meta.get("status")
            if not status and "ongoing" in meta:
                ongoing = meta.get("ongoing")
                if isinstance(ongoing, bool):
                    status = "Đang ra" if ongoing else "Hoàn thành"
            meta_lines = []
            if author:
                meta_lines.append(f"Tác giả: {author}")
            book_title_var.set(title)
            book_meta_var.set("\n".join(meta_lines))
            book_status_var.set(f"Trạng thái: {status}" if status else "")

        def _update_status(msg: str):
            status_var.set(msg)

        def _update_api_status(msg: str, also_log=False):
            api_status_var.set(msg)
            if also_log:
                try:
                    self.log(f"[ND5][{ext_var.get()}] {msg}")
                except Exception:
                    pass

        def _toggle_progress(active: bool, mode: str = "determinate"):
            if active:
                progress.grid()
                progress.config(mode=mode)
                if mode == "indeterminate":
                    progress.start()
            else:
                try:
                    progress.stop()
                except Exception:
                    pass
                progress.grid_remove()
                progress.config(mode="determinate", value=0, maximum=1)

        allow_save_out_dir = out_dir_override is None

        def _persist_nd5_options():
            try:
                delay_min = max(0.0, float(req_delay_min_var.get()))
            except Exception:
                delay_min = DEFAULT_ND5_OPTIONS["req_delay_min"]
            try:
                delay_max = max(delay_min, float(req_delay_max_var.get()))
            except Exception:
                delay_max = delay_min
            try:
                timeout_val = max(1.0, float(req_timeout_var.get()))
            except Exception:
                timeout_val = DEFAULT_ND5_OPTIONS["request_timeout"]
            try:
                retries_val = max(1, int(req_retries_var.get()))
            except Exception:
                retries_val = DEFAULT_ND5_OPTIONS["request_retries"]
            self.nd5_options = {
                "include_info": include_info_var.get(),
                "include_cover": include_cover_var.get(),
                "heading_in_zip": heading_in_zip_var.get(),
                "format": fmt_var.get(),
                "title_tpl": title_tpl_var.get(),
                "range": range_var.get(),
                "out_dir": out_dir_var.get() if allow_save_out_dir else self.nd5_options.get("out_dir", ""),
                "req_delay_min": delay_min,
                "req_delay_max": delay_max,
                "request_timeout": timeout_val,
                "filename_tpl": filename_tpl_var.get(),
                "request_retries": retries_val,
            }
            self.app_config['novel_downloader5'] = dict(self.nd5_options)
            try:
                self.save_config()
            except Exception:
                pass

        def _parse_range(raw: str, max_num: Optional[int] = None):
            raw = (raw or "").replace(" ", "").lower()
            if not raw:
                return []
            if max_num is not None:
                try:
                    max_num = int(max_num)
                except Exception:
                    max_num = None
                if max_num is not None and max_num <= 0:
                    max_num = None
            result = set()
            for part in raw.split(","):
                if not part:
                    continue
                if "-" in part:
                    try:
                        start_s, end_s = part.split("-", 1)
                        if not start_s and not end_s:
                            continue
                        start_i = int(start_s) if start_s else 1
                        end_i = int(end_s) if end_s else (max_num if max_num is not None else start_i)
                        if end_i is None:
                            end_i = start_i
                        if end_i < start_i:
                            start_i, end_i = end_i, start_i
                        if max_num is not None:
                            if start_i > max_num:
                                continue
                            end_i = min(end_i, max_num)
                        if end_i < start_i:
                            continue
                        for i in range(start_i, end_i + 1):
                            result.add(i)
                    except Exception:
                        continue
                else:
                    try:
                        result.add(int(part))
                    except Exception:
                        continue
            return sorted(result)

        def _check_backend():
            plugin = _current_plugin()
            if not plugin:
                _update_api_status("Không tìm thấy plugin đã chọn.", also_log=True)
                return False
            if not getattr(plugin, "requires_bridge", False):
                _update_api_status("Dùng HTTP trực tiếp (không cần bridge).")
                return True
            if not self._ensure_fanqie_bridge_ready():
                _update_api_status("Bridge chưa chạy hoặc thiếu tools/fanqie_bridge_win.exe.", also_log=True)
                return False
            try:
                timeout_val = max(5.0, float(req_timeout_var.get() or 0))
                resp = _req_with_retry("http://127.0.0.1:9999/healthz", timeout=timeout_val)
                if resp.ok:
                    data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                    iid = data.get("install_id") or "unknown"
                    _update_api_status(f"Bridge đang chạy (install_id={iid})", also_log=True)
                else:
                    _update_api_status(f"Bridge phản hồi mã {resp.status_code}", also_log=True)
            except Exception as exc:
                _update_api_status(f"Bridge không phản hồi: {exc}", also_log=True)
            return True

        def _start_bridge_async():
            if not _plugin_requires_bridge():
                _update_api_status("Plugin này không cần bridge.")
                return
            _update_api_status("Đang bật bridge (nền)...")

            def runner():
                started = self._ensure_fanqie_bridge_ready()
                if not started:
                    self.after(0, lambda: _update_api_status("Không chạy được fanqie_bridge_win.exe.", also_log=True))
                    return
                timeout_val = max(5.0, float(req_timeout_var.get() or 0))
                attempts = 5
                for _ in range(attempts):
                    try:
                        resp = _req_with_retry("http://127.0.0.1:9999/healthz", timeout=timeout_val)
                        if resp.ok:
                            data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                            iid = data.get("install_id") or "unknown"
                            self.after(0, lambda: _update_api_status(f"Bridge đang chạy (install_id={iid})", also_log=True))
                            return
                        else:
                            self.after(0, lambda code=resp.status_code: _update_api_status(f"Bridge phản hồi mã {code}", also_log=True))
                            return
                    except Exception:
                        time.sleep(0.8)
                self.after(0, lambda: _update_api_status("Bridge không phản hồi sau khi khởi động.", also_log=True))

            threading.Thread(target=runner, daemon=True).start()
            return

        def _fetch_cover_bytes(url: str, ctx: ND5Context):
            if not url:
                return None
            try:
                ctx.sleep_between_requests()
                resp = ctx.request_with_retry(url)
                resp.raise_for_status()
                return resp.content
            except Exception as exc:
                ctx.log(f"Không tải được ảnh bìa: {exc}")
                return None

        def _format_info(meta: dict, toc: list):
            lines = []
            title = (meta or {}).get("title", "")
            author = (meta or {}).get("author", "")
            status = (meta or {}).get("status")
            if not status and "ongoing" in (meta or {}):
                ongoing = meta.get("ongoing")
                if isinstance(ongoing, bool):
                    status = "Đang ra" if ongoing else "Hoàn thành"
            if title:
                lines.append(f"Tên truyện: {title}")
            if author:
                lines.append(f"Tác giả: {author}")
            if status:
                lines.append(f"Trạng thái: {status}")
            if lines:
                lines.append("")
            detail = (meta or {}).get("detail")
            if detail:
                detail_text = str(detail)
                detail_text = detail_text.replace("<br/>", "\n").replace("<br />", "\n").replace("<br>", "\n")
                detail_lines = [line.strip() for line in detail_text.splitlines() if line.strip()]
                if detail_lines:
                    lines.append("Chi tiết:")
                    lines.extend(detail_lines)
                    lines.append("")
            intro = (meta or {}).get("intro") or ""
            intro = str(intro).strip()
            if intro:
                lines.append("Giới thiệu:")
                lines.extend(intro.splitlines())
                lines.append("")
            if meta.get("cover"):
                lines.append(f"Link ảnh bìa: {meta.get('cover')}")
                lines.append("")
            lines.append("Mục lục (đánh số từ trên xuống):")
            vip_map = (meta or {}).get("chapter_vip_map") or {}
            for item in toc:
                cid = str(item.get("id", "?"))
                is_vip = bool(item.get("vip")) if "vip" in item else bool(vip_map.get(cid))
                vip_mark = " [VIP]" if is_vip else ""
                lines.append(f"{item['num']:>4}: {item.get('title', '')} [ID: {cid}]{vip_mark}")
            if include_info_var.get():
                lines.append("\n* Sẽ thêm chương 0: Thông tin sách (nếu chọn).")
            return "\n".join(lines).strip()

        def _download_batch(book: dict, ids: list, fmt: str, fallback_titles: dict, ctx: ND5Context):
            if not ids:
                return {}
            plugin = _current_plugin()
            if not plugin:
                return {}
            try:
                vip_map = (book or {}).get("chapter_vip_map") or {}
                vip_loader = getattr(plugin, "download_vip_chapter_batch", None)
                if vip_map and callable(vip_loader):
                    vip_ids = [cid for cid in ids if vip_map.get(str(cid))]
                    normal_ids = [cid for cid in ids if not vip_map.get(str(cid))]
                    results = {}
                    if normal_ids:
                        results.update(plugin.download_chapter_batch(book, normal_ids, fmt, fallback_titles, ctx))
                    if vip_ids:
                        results.update(vip_loader(book, vip_ids, fmt, fallback_titles, ctx))
                    return results
                return plugin.download_chapter_batch(book, ids, fmt, fallback_titles, ctx)
            except Exception as exc:
                ctx.log(f"Lỗi tải batch {ids}: {exc}")
                return {}

        def _write_txt(chapters: list, meta: dict, out_dir: str, title_tpl: str, fname_tpl: str):
            filename = _build_filename(meta, fname_tpl, "txt")
            path = _resolve_output_path(os.path.join(out_dir, filename))
            if not path:
                return None
            os.makedirs(out_dir, exist_ok=True)
            parts = [
                meta.get("title", ""),
                f"Tác giả: {meta.get('author', '')}",
                meta.get("intro", "").strip(),
                "",
            ]
            for ch in chapters:
                try:
                    title_line = title_tpl.format(num=ch["num"], title=ch["title"])
                except Exception:
                    title_line = f"{ch['num']}. {ch['title']}"
                parts.append(title_line)
                parts.append(_content_to_text(ch.get("content") or ""))
                parts.append("")
            with open(path, "w", encoding="utf-8") as f:
                f.write("\n".join(parts))
            return path

        def _write_zip(chapters: list, meta: dict, out_dir: str, cover_bytes: bytes = None, add_heading: bool = True, title_tpl: str = "{num}. {title}", fname_tpl: str = ""):
            filename = _build_filename(meta, fname_tpl, "zip")
            path = _resolve_output_path(os.path.join(out_dir, filename))
            if not path:
                return None
            os.makedirs(out_dir, exist_ok=True)
            with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
                if cover_bytes:
                    zf.writestr("cover.jpg", cover_bytes)
                for ch in chapters:
                    name = f"{ch['num']:04d}-{_safe_filename(ch['title'] or str(ch['num']))}.txt"
                    content_text = _content_to_text(ch.get("content") or "")
                    if add_heading:
                        try:
                            heading = title_tpl.format(num=ch["num"], title=ch["title"])
                        except Exception:
                            heading = f"{ch['num']}. {ch['title']}"
                        content_text = f"{heading}\n\n{content_text}"
                    zf.writestr(name, content_text)
            return path

        def _write_epub(chapters: list, meta: dict, out_dir: str, cover_bytes: bytes = None, fname_tpl: str = ""):
            filename = _build_filename(meta, fname_tpl, "epub")
            path = _resolve_output_path(os.path.join(out_dir, filename))
            if not path:
                return None
            os.makedirs(out_dir, exist_ok=True)
            with zipfile.ZipFile(path, "w") as zf:
                zf.writestr("mimetype", "application/epub+zip", compress_type=zipfile.ZIP_STORED)
                container_xml = """<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>"""
                zf.writestr("META-INF/container.xml", container_xml)

                manifest_items = []
                spine_items = []
                nav_entries = []
                for idx, ch in enumerate(chapters):
                    href = f"chap{idx:05d}.xhtml"
                    cid = f"c{idx}"
                    title = ch.get("title") or f"{ch.get('num')}"
                    display_title = f"0. {title}" if ch.get("num") == 0 else f"{ch.get('num')}. {title}"
                    body_html = _content_to_html(ch.get("content") or "")
                    chapter_html = f"""<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>{html.escape(display_title)}</title></head>
  <body>
    <h2>{html.escape(display_title)}</h2>
    {body_html}
  </body>
</html>"""
                    zf.writestr(f"OEBPS/{href}", chapter_html)
                    manifest_items.append(f'<item id="{cid}" href="{href}" media-type="application/xhtml+xml"/>')
                    spine_items.append(f'<itemref idref="{cid}"/>')
                    nav_label = f"0. {title}" if ch.get("num") == 0 else f"{ch.get('num')}. {title}"
                    nav_entries.append(f'<li><a href="{href}">{html.escape(nav_label)}</a></li>')

                if cover_bytes:
                    zf.writestr("OEBPS/cover.jpg", cover_bytes)
                    manifest_items.append('<item id="cover-image" href="cover.jpg" media-type="image/jpeg"/>')
                    cover_meta = '<meta name="cover" content="cover-image"/>'
                else:
                    cover_meta = ""

                nav_body = "\n        ".join(nav_entries)
                nav_html = f"""<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head><title>Nav</title></head>
  <body>
    <nav epub:type="toc">
      <h1>{html.escape(meta.get('title','Mục lục'))}</h1>
      <ol>
        {nav_body}
      </ol>
    </nav>
  </body>
</html>"""
                zf.writestr("OEBPS/nav.xhtml", nav_html)
                manifest_items.append('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>')

                manifest_text = "\n    ".join(manifest_items)
                spine_text = "\n    ".join(spine_items)
                opf = f"""<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">{html.escape(meta.get('book_id','fanqie'))}</dc:identifier>
    <dc:title>{html.escape(meta.get('title','Fanqie'))}</dc:title>
    <dc:creator>{html.escape(meta.get('author',''))}</dc:creator>
    <dc:language>zh</dc:language>
    {cover_meta}
  </metadata>
  <manifest>
    {manifest_text}
  </manifest>
  <spine>
    {spine_text}
  </spine>
</package>"""
                zf.writestr("OEBPS/content.opf", opf)
            return path

        def _fetch_info():
            plugin = _current_plugin()
            if not plugin:
                messagebox.showerror("Plugin ND5", "Không tìm thấy plugin đã chọn.", parent=win)
                return
            book_url = url_var.get().strip()
            if not book_url:
                messagebox.showinfo("Thiếu URL", "Nhập URL truyện trước.", parent=win)
                return
            if not _plugin_matches_url(plugin, book_url):
                matched = _find_plugin_for_url(book_url)
                if matched and matched.id != ext_var.get():
                    ext_var.set(matched.id)
                    _refresh_plugin_ui()
                    plugin = matched
                    _update_status(f"Đã tự đổi nguồn sang {matched.id}.")
                elif not matched:
                    use_anyway = messagebox.askyesno(
                        "Không khớp nguồn",
                        "Link không khớp với nguồn hiện tại.\nBạn có muốn tiếp tục dùng nguồn hiện tại không?",
                        parent=win,
                    )
                    if not use_anyway:
                        open_store = messagebox.askyesno(
                            "Cài thêm plugin",
                            "Không tìm thấy plugin phù hợp.\nMở Cài đặt ND5 để thêm plugin?",
                            parent=win,
                        )
                        if open_store:
                            _open_settings_dialog()
                        _update_status("Chọn lại nguồn hoặc link.")
                        return
            _persist_nd5_options()
            _update_status("Đang lấy thông tin truyện...")
            _toggle_progress(True, "indeterminate")

            def worker():
                ctx = _build_ctx()
                try:
                    if getattr(plugin, "requires_bridge", False) and not _check_backend():
                        return
                    meta, toc = plugin.fetch_book_and_toc(book_url, ctx)
                    if meta is not None and not meta.get("chapter_vip_map"):
                        inferred_vip = {
                            str(item.get("id")): bool(item.get("vip"))
                            for item in (toc or [])
                            if "vip" in item
                        }
                        if inferred_vip:
                            meta["chapter_vip_map"] = inferred_vip
                    cover_cache["bytes"] = None
                    cover_bytes = None
                    if meta.get("cover"):
                        cover_bytes = _fetch_cover_bytes(meta.get("cover"), ctx)
                        cover_cache["bytes"] = cover_bytes
                    current_book["meta"] = meta
                    current_book["toc"] = toc
                    info_text_content = _format_info(meta, toc)
                    self.after(0, lambda: _update_info_header(meta))
                    self.after(0, lambda: _set_cover_image(cover_bytes))
                    self.after(0, lambda: _set_info(info_text_content))
                    self.after(0, lambda: _update_status(f"Đã lấy {len(toc)} chương. Sẵn sàng tải."))
                except Exception as exc:
                    ctx.log(f"Lỗi lấy thông tin: {exc}")
                    self.after(0, lambda exc=exc: messagebox.showerror("Lỗi", f"Lấy thông tin thất bại: {exc}", parent=win))
                    self.after(0, lambda: _update_status("Lỗi khi lấy thông tin."))
                finally:
                    self.after(0, lambda: _toggle_progress(False))

            threading.Thread(target=worker, daemon=True).start()

        def _start_download():
            plugin = _current_plugin()
            if not plugin:
                messagebox.showerror("Plugin ND5", "Không tìm thấy plugin đã chọn.", parent=win)
                return
            meta = current_book.get("meta")
            toc = current_book.get("toc") or []
            if not meta or not toc:
                messagebox.showinfo("Thiếu dữ liệu", "Hãy Lấy thông tin trước khi tải.", parent=win)
                return
            max_num = None
            if toc:
                try:
                    max_num = max(item.get("num", 0) for item in toc)
                except Exception:
                    max_num = None
            numbers = _parse_range(range_var.get(), max_num=max_num)
            num_set = set(numbers) if numbers else set(item["num"] for item in toc)
            include_info = include_info_var.get()
            if include_info:
                num_set.add(0)
            out_dir = out_dir_var.get().strip() or BASE_DIR
            fmt = (fmt_var.get() or "zip").lower()

            _update_status("Đang chuẩn bị tải...")
            _toggle_progress(True, "determinate")
            progress.config(maximum=max(1, len(num_set)), value=0)

            def worker():
                ctx = _build_ctx()
                try:
                    _persist_nd5_options()
                    if getattr(plugin, "requires_bridge", False) and not _check_backend():
                        return
                    try:
                        max_attempts = max(1, int(req_retries_var.get()))
                    except Exception:
                        max_attempts = DEFAULT_ND5_OPTIONS["request_retries"]
                    tpl = title_tpl_var.get().strip()
                    if fmt in ("txt", "zip") or (fmt == "epub" and heading_in_zip_var.get()):
                        if not tpl:
                            raise ValueError("Template tiêu đề không được rỗng.")
                        if "{num}" not in tpl and "{title}" not in tpl:
                            raise ValueError("Template phải chứa {num} hoặc {title}.")
                    book_id = (meta or {}).get("book_id") or (meta or {}).get("id") or ""
                    use_progress_cache = ext_var.get() == "fanqie" and bool(book_id)
                    progress_data = {}
                    progress_chapters = {}
                    if use_progress_cache:
                        progress_data = self._fanqie_load_progress(book_id) or {}
                        progress_chapters = progress_data.get("chapters", {})
                    tasks = []
                    if include_info and 0 in num_set:
                        info_content = (
                            f"{meta.get('title','')}\nTác giả: {meta.get('author','')}\n\n{meta.get('intro','')}"
                        )
                        tasks.append({"num": 0, "id": "book-info", "title": "Thông tin sách", "content": info_content})
                        if use_progress_cache and book_id:
                            progress_chapters["book-info"] = {"title": "Thông tin sách", "content": info_content}
                    id_map = {}
                    for item in toc:
                        if not num_set or item["num"] in num_set:
                            tasks.append(
                                {
                                    "num": item["num"],
                                    "id": str(item.get("id") or item["num"]),
                                    "title": item.get("title"),
                                    "vip": bool(item.get("vip")),
                                }
                            )
                            id_map[str(item.get("id") or item["num"])] = item.get("title")
                    total = len(tasks)
                    done = 0
                    self.after(0, lambda: progress.config(maximum=max(1, total)))

                    real_chapters = [t for t in tasks if t["num"] != 0]
                    fetched = dict(progress_chapters) if progress_chapters else {}
                    batch_size = getattr(plugin, "batch_size", 0)
                    try:
                        batch_size = int(batch_size)
                    except Exception:
                        batch_size = 0
                    if batch_size <= 0:
                        batch_size = 20
                    vip_map = (meta or {}).get("chapter_vip_map") or {}
                    for i in range(0, len(real_chapters), batch_size):
                        batch = real_chapters[i:i + batch_size]
                        ids = [t["id"] for t in batch]
                        missing = [cid for cid in ids if str(cid) not in fetched or not fetched.get(str(cid), {}).get("content")]
                        for attempt in range(1, max_attempts + 1):
                            if not missing:
                                break
                            partial = _download_batch(meta, missing, fmt, id_map, ctx)
                            fetched.update(partial)
                            missing = [
                                cid for cid in ids
                                if str(cid) not in fetched
                                or not fetched.get(str(cid), {}).get("content")
                            ]
                            if missing and attempt < max_attempts:
                                try:
                                    ctx.log(f"[ND5] Thiếu nội dung {len(missing)} chương, thử lại ({attempt}/{max_attempts})...")
                                except Exception:
                                    pass
                                try:
                                    ctx.sleep_between_requests()
                                except Exception:
                                    pass
                        if missing:
                            vip_missing = [cid for cid in missing if vip_map.get(str(cid))]
                            if vip_missing:
                                raise RuntimeError(
                                    f"Không tải được nội dung {len(missing)} chương sau {max_attempts} lần thử. "
                                    f"Có {len(vip_missing)} chương VIP, hãy kiểm tra token Android."
                                )
                            raise RuntimeError(f"Không tải được nội dung {len(missing)} chương sau {max_attempts} lần thử.")
                        if use_progress_cache and book_id:
                            progress_chapters.update({str(k): v for k, v in fetched.items()})
                            progress_data["chapters"] = progress_chapters
                            progress_data["meta"] = meta
                            self._fanqie_save_progress(book_id, progress_data)
                        done += len(batch)
                        self.after(0, lambda d=done, tot=total: (progress.config(value=d), _update_status(f"Đang tải {d}/{tot}...")))

                    for idx, ch in enumerate(tasks):
                        if ch["num"] == 0:
                            continue
                        payload = fetched.get(str(ch["id"]))
                        if payload:
                            ch["title"] = payload.get("title") or ch.get("title") or f"Chương {ch['num']}"
                            ch["content"] = payload.get("content") or ""
                        else:
                            ch["content"] = ""
                    tasks.sort(key=lambda x: x["num"])

                    cover_bytes = cover_cache.get("bytes") if include_cover_var.get() else None
                    if include_cover_var.get() and cover_bytes is None and meta.get("cover"):
                        cover_bytes = _fetch_cover_bytes(meta["cover"], ctx)

                    title_tpl = title_tpl_var.get().strip() or "{num}. {title}"
                    saved_path = None
                    fname_tpl = filename_tpl_var.get().strip() or DEFAULT_ND5_OPTIONS["filename_tpl"]
                    if fmt == "txt":
                        saved_path = _write_txt(tasks, meta, out_dir, title_tpl, fname_tpl)
                    elif fmt == "zip":
                        saved_path = _write_zip(
                            tasks,
                            meta,
                            out_dir,
                            cover_bytes if include_cover_var.get() else None,
                            heading_in_zip_var.get(),
                            title_tpl,
                            fname_tpl
                        )
                    else:
                        saved_path = _write_epub(tasks, meta, out_dir, cover_bytes if include_cover_var.get() else None, fname_tpl=fname_tpl)

                    if not saved_path:
                        self.after(0, lambda: _update_status("Đã hủy lưu file."))
                        return

                    try:
                        self.log(f"[ND5][{plugin.id}] Đã tải xong {len(tasks)} mục. Lưu tại: {saved_path}")
                    except Exception:
                        pass
                    self.after(0, lambda: _update_status(f"Đã lưu: {saved_path}"))
                    self.after(0, lambda: messagebox.showinfo("Hoàn tất", f"Tải xong. File: {saved_path}", parent=win))
                except Exception as exc:
                    ctx.log(f"Lỗi tải: {exc}")
                    self.after(0, lambda exc=exc: messagebox.showerror("Lỗi tải", f"{exc}", parent=win))
                    self.after(0, lambda: _update_status("Tải thất bại."))
                finally:
                    self.after(0, lambda: _toggle_progress(False))

            threading.Thread(target=worker, daemon=True).start()

        # UI layout
        top_frame = ttk.Frame(win, padding=(10, 8))
        top_frame.grid(row=0, column=0, sticky="ew")
        top_frame.columnconfigure(1, weight=1)
        top_frame.columnconfigure(2, weight=1)
        top_frame.columnconfigure(3, weight=0)
        plugin_ids = [p.id for p in plugins]
        source_desc_var = tk.StringVar(value=f"{_plugin_label()} | {_plugin_sample()}")
        url_label_var = tk.StringVar(value=f"URL {_plugin_label()}:")
        url_sample_var = tk.StringVar(value=_plugin_sample())
        ttk.Label(top_frame, text="Nguồn:").grid(row=0, column=0, sticky="w", padx=(0, 6))
        source_combo = ttk.Combobox(top_frame, state="readonly", width=14, values=plugin_ids, textvariable=ext_var)
        source_combo.grid(row=0, column=1, sticky="w")
        ttk.Label(top_frame, textvariable=source_desc_var, foreground="#6b7280").grid(row=0, column=2, sticky="w", padx=(10, 0))
        settings_btn = ttk.Button(top_frame, text="Cài đặt", command=_open_settings_dialog)
        settings_btn.grid(row=0, column=3, sticky="e")
        extra_btn = ttk.Button(top_frame, text="Giá trị bổ sung", command=_open_extra_values_dialog)
        extra_btn.grid(row=1, column=1, sticky="w", pady=(4, 0))
        extra_btn.grid_remove()

        backend_frame = ttk.Frame(win, padding=(10, 2))
        backend_frame.grid(row=1, column=0, sticky="ew")
        backend_frame.columnconfigure(1, weight=1)
        ttk.Label(backend_frame, textvariable=api_status_var, foreground="#3b82f6").grid(row=0, column=0, sticky="w", pady=(4, 0))
        def _reset_bridge():
            _update_api_status("Đang reset bridge...", also_log=True)
            try:
                self._stop_fanqie_bridge()
            except Exception:
                pass
            self.after(150, _start_bridge_async)
        reset_btn = ttk.Button(backend_frame, text="Reset bridge", command=_reset_bridge)
        reset_btn.grid(row=0, column=1, sticky="e", padx=(6, 0), pady=(4, 0))

        url_frame = ttk.Frame(win, padding=(10, 4))
        url_frame.grid(row=2, column=0, sticky="ew")
        url_frame.columnconfigure(1, weight=1)
        ttk.Label(url_frame, textvariable=url_label_var).grid(row=0, column=0, sticky="w", padx=(0, 6))
        ttk.Entry(url_frame, textvariable=url_var).grid(row=0, column=1, sticky="ew")
        ttk.Button(url_frame, text="Lấy thông tin", command=_fetch_info).grid(row=0, column=2, padx=(6, 0))
        search_btn = ttk.Button(url_frame, text="Tìm kiếm", command=_open_search_dialog)
        search_btn.grid(row=0, column=3, padx=(6, 0))
        ttk.Label(url_frame, textvariable=url_sample_var, foreground="#6b7280").grid(row=1, column=1, sticky="w", pady=(2, 0))

        def _refresh_plugin_ui(event=None):
            source_desc_var.set(f"{_plugin_label()} | {_plugin_sample()}")
            url_label_var.set(f"URL {_plugin_label()}:")
            url_sample_var.set(_plugin_sample())
            if _plugin_requires_bridge():
                reset_btn.grid()
                api_status_var.set("Chưa kiểm tra bridge.")
            else:
                reset_btn.grid_remove()
                api_status_var.set("Dùng HTTP trực tiếp (không cần bridge).")
            if _plugin_supports_search():
                search_btn.state(["!disabled"])
            else:
                search_btn.state(["disabled"])
            current_book["meta"] = None
            current_book["toc"] = []
            cover_cache["bytes"] = None
            _update_info_header(None)
            _set_info("")
            _update_status("Nhập URL và bấm Lấy thông tin.")
            if _plugin_has_extra_values():
                extra_btn.grid()
            else:
                extra_btn.grid_remove()
        source_combo.bind("<<ComboboxSelected>>", _refresh_plugin_ui)

        opt_frame = ttk.LabelFrame(win, text="Tuỳ chọn", padding=10)
        opt_frame.grid(row=3, column=0, sticky="ew", padx=10, pady=(4, 4))
        for c in range(0, 6):
            opt_frame.columnconfigure(c, weight=0)
        opt_frame.columnconfigure(1, weight=1)
        opt_frame.columnconfigure(3, weight=1)
        ttk.Checkbutton(opt_frame, text="Tải thông tin sách (chương 0)", variable=include_info_var).grid(row=0, column=0, sticky="w")
        ttk.Checkbutton(opt_frame, text="Tải ảnh bìa", variable=include_cover_var).grid(row=0, column=1, sticky="w", padx=(10, 0))
        zip_heading_chk = ttk.Checkbutton(opt_frame, text="Ghi tiêu đề vào mỗi file (ZIP)", variable=heading_in_zip_var)
        zip_heading_chk.grid(row=0, column=2, sticky="w", padx=(10, 0))
        fmt_frame = ttk.Frame(opt_frame)
        fmt_frame.grid(row=0, column=3, sticky="e", padx=(10, 0))
        ttk.Label(fmt_frame, text="Định dạng:").pack(side=tk.LEFT, padx=(0, 4))
        fmt_combo = ttk.Combobox(fmt_frame, values=["epub", "txt", "zip"], width=8, state="readonly", textvariable=fmt_var)
        fmt_combo.pack(side=tk.LEFT)
        def _toggle_zip_heading(event=None):
            fmt = fmt_var.get().lower()
            if fmt == "zip":
                zip_heading_chk.grid()
            else:
                zip_heading_chk.grid_remove()
        fmt_combo.bind("<<ComboboxSelected>>", _toggle_zip_heading)
        _toggle_zip_heading()

        ttk.Label(opt_frame, text="Phạm vi tải (vd 1-10,15, -5,10-; trống = tất cả):").grid(row=1, column=0, sticky="w", pady=(8, 0))
        range_entry = ttk.Entry(opt_frame, textvariable=range_var)
        range_entry.grid(row=1, column=1, sticky="ew", padx=(6, 12), pady=(8, 0))

        ttk.Label(opt_frame, text="Thư mục lưu:").grid(row=1, column=2, sticky="w", pady=(8, 0))
        out_entry = ttk.Entry(opt_frame, textvariable=out_dir_var)
        out_entry.grid(row=1, column=3, sticky="ew", padx=(6, 0), pady=(8, 0))
        ttk.Button(opt_frame, text="Chọn...", command=_pick_output).grid(row=1, column=4, sticky="w", padx=(6, 0), pady=(8, 0))

        info_frame = ttk.LabelFrame(win, text="Thông tin truyện", padding=10)
        info_frame.grid(row=4, column=0, sticky="nsew", padx=10, pady=(4, 4))
        info_frame.columnconfigure(1, weight=1)
        info_frame.rowconfigure(0, weight=1)

        cover_frame = ttk.Frame(info_frame)
        cover_frame.grid(row=0, column=0, sticky="nsw", padx=(0, 12))
        cover_frame.columnconfigure(0, weight=1)
        cover_label = ttk.Label(cover_frame, text="Không có bìa", anchor="center", width=18)
        cover_label.grid(row=0, column=0, sticky="n")

        title_label = ttk.Label(cover_frame, textvariable=book_title_var, font=("TkDefaultFont", 11, "bold"), wraplength=180, justify="left")
        title_label.grid(row=1, column=0, sticky="w", pady=(8, 0))
        meta_label = ttk.Label(cover_frame, textvariable=book_meta_var, foreground="#6b7280", justify="left", wraplength=180)
        meta_label.grid(row=2, column=0, sticky="w", pady=(4, 0))
        status_label = ttk.Label(cover_frame, textvariable=book_status_var, foreground="#2563eb", justify="left", wraplength=180)
        status_label.grid(row=3, column=0, sticky="w", pady=(4, 0))

        info_body = ttk.Frame(info_frame)
        info_body.grid(row=0, column=1, sticky="nsew")
        info_body.columnconfigure(0, weight=1)
        info_body.rowconfigure(0, weight=1)

        info_text = scrolledtext.ScrolledText(info_body, wrap=tk.WORD, state="disabled", height=12)
        info_text.grid(row=0, column=0, sticky="nsew")
        _refresh_plugin_ui()

        progress_frame = ttk.Frame(win, padding=(10, 6))
        progress_frame.grid(row=5, column=0, sticky="ew")
        progress_frame.columnconfigure(0, weight=1)
        progress = ttk.Progressbar(progress_frame, mode="determinate")
        progress.grid(row=0, column=0, sticky="ew")
        progress.grid_remove()
        ttk.Label(progress_frame, textvariable=status_var).grid(row=1, column=0, sticky="w", pady=(4, 0))
        action_inline = ttk.Frame(progress_frame)
        action_inline.grid(row=1, column=1, sticky="e", pady=(4, 0))
        ttk.Button(action_inline, text="Bắt đầu tải", command=_start_download).pack(side=tk.RIGHT, padx=(0, 6))
        ttk.Button(action_inline, text="Đóng", command=lambda: (_persist_nd5_options(), win.destroy())).pack(side=tk.RIGHT)

        self.after(200, _start_bridge_async)
        win.protocol("WM_DELETE_WINDOW", lambda: (_persist_nd5_options(), win.destroy()))

    def _nd5_delay_range(self):
        opts = getattr(self, "nd5_options", {}) or {}
        try:
            min_v = float(opts.get("req_delay_min", DEFAULT_ND5_OPTIONS["req_delay_min"]))
            max_v = float(opts.get("req_delay_max", DEFAULT_ND5_OPTIONS["req_delay_max"]))
        except Exception:
            min_v, max_v = DEFAULT_ND5_OPTIONS["req_delay_min"], DEFAULT_ND5_OPTIONS["req_delay_max"]
        min_v = max(0.0, min_v)
        max_v = max(min_v, max_v)
        return min_v, max_v

    def _nd5_sleep_between_requests(self):
        mn, mx = self._nd5_delay_range()
        if mx <= 0:
            return
        delay = random.uniform(mn, mx)
        if delay > 0:
            time.sleep(delay)

    def _get_fanqie_headers(self):
        headers = dict(DEFAULT_API_SETTINGS.get("fanqie_headers", {}))
        custom = self.api_settings.get("fanqie_headers") if isinstance(self.api_settings, dict) else {}
        if isinstance(custom, dict):
            for k, v in custom.items():
                if v:
                    headers[k] = v
        return headers

    def _ensure_fanqie_bridge_ready(self, attempts: int = 6, delay: float = 0.8) -> bool:
        """Khởi chạy bridge nếu cần và đợi healthz phản hồi."""
        started = self._ensure_fanqie_bridge_running()
        if not started:
            return False
        for _ in range(max(1, attempts)):
            try:
                resp = requests.get("http://127.0.0.1:9999/healthz", timeout=10)
                if resp.ok:
                    return True
            except Exception:
                pass
            time.sleep(max(0.1, delay))
        return False

    def _fanqie_extract_book_id(self, raw_url: str):
        if not raw_url:
            return None
        m = re.search(r"/(?:page|book|reader)/(\d+)", raw_url)
        if m:
            return m.group(1)
        m = re.search(r"(\d{6,})", raw_url)
        return m.group(1) if m else None

    def _fanqie_request_with_retry(self, url: str, headers=None, proxies=None, timeout: float = None, retries: int = None):
        if retries is None:
            try:
                retries = int((self.nd5_options or {}).get("request_retries", DEFAULT_ND5_OPTIONS["request_retries"]))
            except Exception:
                retries = DEFAULT_ND5_OPTIONS["request_retries"]
        retries = max(1, retries)
        if timeout is None:
            try:
                timeout = float((self.nd5_options or {}).get("request_timeout", DEFAULT_ND5_OPTIONS["request_timeout"]))
            except Exception:
                timeout = DEFAULT_ND5_OPTIONS["request_timeout"]
        timeout = max(5.0, timeout)
        last_exc = None
        for attempt in range(1, retries + 1):
            try:
                return requests.get(url, headers=headers, proxies=proxies, timeout=timeout)
            except Exception as exc:
                last_exc = exc
                if attempt >= retries:
                    break
                try:
                    self.log(f"[Fanqie] Thử lại ({attempt}/{retries}) {url}: {exc}")
                except Exception:
                    pass
                time.sleep(0.5)
        if last_exc:
            raise last_exc
        raise RuntimeError("Request thất bại không rõ lý do")

    def _fanqie_fetch_toc(self, book_id: str, proxies=None, headers=None):
        """Lấy mục lục Fanqie gồm id và tiêu đề."""
        if not book_id:
            return []
        url = f"https://fanqienovel.com/page/{book_id}"
        hdrs = dict(self._get_fanqie_headers())
        if isinstance(headers, dict):
            for k, v in headers.items():
                if v:
                    hdrs[k] = v
        resp = self._fanqie_request_with_retry(url, headers=hdrs, proxies=proxies)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        nodes = soup.select(".page-directory-content .chapter-item") or soup.select(".page-directory-content a.chapter-item-title")
        toc = []
        if nodes:
            for idx, node in enumerate(nodes, start=1):
                a_tag = node if getattr(node, "name", "") == "a" else node.select_one("a.chapter-item-title") or node.select_one("a")
                href = a_tag.get("href", "") if a_tag else ""
                cid_match = re.search(r"/reader/(\d+)", href) if href else None
                cid = cid_match.group(1) if cid_match else None
                title = a_tag.get_text(strip=True) if a_tag else (node.get_text(strip=True) if hasattr(node, "get_text") else f"Chương {idx}")
                toc.append({"num": idx, "id": cid or str(idx), "title": title})
        if not toc:
            self.log("[Fanqie] Không tìm thấy mục lục bằng selector mặc định.")
        return toc

    def _fanqie_extract_chapter_payload(self, raw: dict, ids: list, fallback_titles: dict):
        """Chuyển response bridge thành dict {cid: {title, content}}."""
        results = {}
        candidates = []
        if isinstance(raw, dict):
            if isinstance(raw.get("chapters"), dict):
                candidates.append(raw["chapters"])
            if isinstance(raw.get("data"), dict):
                candidates.append(raw["data"])
            if not candidates:
                candidates.append(raw)
        for cand in candidates:
            if not isinstance(cand, dict):
                continue
            for cid in ids:
                entry = cand.get(cid) or cand.get(str(cid))
                if entry is None:
                    continue
                if isinstance(entry, str):
                    title = fallback_titles.get(cid) or fallback_titles.get(str(cid))
                    results[str(cid)] = {"title": title or f"Chương {cid}", "content": entry}
                    continue
                if isinstance(entry, dict):
                    title = entry.get("title") or entry.get("chapter_title") or fallback_titles.get(cid) or fallback_titles.get(str(cid)) or f"Chương {cid}"
                    content = (
                        entry.get("content")
                        or entry.get("data", {}).get("content")
                        or entry.get("chapter", {}).get("content")
                        or entry.get("text")
                        or entry.get("value")
                    )
                    results[str(cid)] = {"title": title, "content": content}
        if results:
            return results
        data_list = raw.get("data") if isinstance(raw, dict) else None
        if isinstance(data_list, list):
            for entry in data_list:
                if not isinstance(entry, dict):
                    continue
                cid = str(entry.get("item_id") or entry.get("chapter_id") or entry.get("cid") or entry.get("id") or "")
                if not cid:
                    continue
                title = entry.get("title") or fallback_titles.get(cid) or f"Chương {cid}"
                content = entry.get("content") or entry.get("data", {}).get("content")
                results[cid] = {"title": title, "content": content}
        return results

    def _fanqie_download_batch(self, ids: list, fallback_titles: dict):
        if not ids:
            return {}
        try:
            url = f"http://127.0.0.1:9999/content?item_id={','.join(ids)}"
            self._nd5_sleep_between_requests()
            resp = self._fanqie_request_with_retry(url, proxies=self._get_proxy_for_request("fanqie"))
            resp.raise_for_status()
            payload = resp.json()
            return self._fanqie_extract_chapter_payload(payload, ids, fallback_titles)
        except Exception as exc:
            self.log(f"[Fanqie] Lỗi tải batch {ids}: {exc}")
            return {}

    def _fanqie_content_to_text(self, content: str):
        if content is None:
            return ""
        text = str(content)
        if "<" in text and ">" in text:
            try:
                soup = BeautifulSoup(text, "html.parser")
                paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
                if paragraphs:
                    return re.sub(r"\n{2,}", "\n", "\n\n".join(p for p in paragraphs if p))
                return re.sub(r"\n{2,}", "\n", soup.get_text("\n", strip=True))
            except Exception:
                return re.sub(r"\n{2,}", "\n", text.replace("\r\n", "\n").replace("\r", "\n"))
        return re.sub(r"\n{2,}", "\n", text.replace("\r\n", "\n").replace("\r", "\n"))

    def _prepare_auto_update_dir(self, book_id: str):
        root = getattr(self, "_auto_update_temp_root", os.path.join(BASE_DIR, "tmp_auto_update"))
        os.makedirs(root, exist_ok=True)
        safe = re.sub(r"[^A-Za-z0-9_-]+", "_", book_id or "auto")
        target = os.path.join(root, safe)
        try:
            if os.path.isdir(target):
                shutil.rmtree(target, ignore_errors=True)
            os.makedirs(target, exist_ok=True)
        except Exception:
            pass
        return target

    def _should_auto_credit(self) -> bool:
        return bool((self.api_settings or {}).get("auto_credit", True))
