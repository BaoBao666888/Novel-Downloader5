import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
import zipfile
import webbrowser

import requests
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext, ttk

from app.paths import BASE_DIR
from app.ui.update_dialog import fetch_manifest_from_url


class ReaderTabMixin:
    """Tab quản lý app Đọc truyện local (UI + server)."""

    READER_DEFAULT_PORT = 17171
    DEFAULT_JAVA21_WIN_X64_URL = "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse"

    def create_reader_tab(self):
        tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(tab, text="Đọc truyện")
        tab.columnconfigure(0, weight=1)
        tab.rowconfigure(3, weight=1)

        cfg = self._reader_cfg()
        self.reader_port_var = tk.StringVar(value=str(cfg.get("port", self.READER_DEFAULT_PORT)))
        self.reader_allow_lan_var = tk.BooleanVar(value=bool(cfg.get("allow_lan", True)))

        self.reader_server_status_var = tk.StringVar(value="Trạng thái server: Chưa kiểm tra")
        self.reader_endpoint_var = tk.StringVar(value="Endpoint: —")
        self.reader_server_local_var = tk.StringVar(value="Server local: Chưa cài")
        self.reader_server_remote_var = tk.StringVar(value="Server bản mới: —")
        self.reader_ui_local_var = tk.StringVar(value="UI local: Chưa cài")
        self.reader_ui_remote_var = tk.StringVar(value="UI bản mới: —")
        self.reader_java_local_var = tk.StringVar(value="Java local: Chưa cài")
        self.reader_java_remote_var = tk.StringVar(value="Java bản mới: —")
        self.reader_manifest_src_var = tk.StringVar(value="Manifest: Chưa tải")

        top = ttk.LabelFrame(tab, text="Trạng thái", padding=10)
        top.grid(row=0, column=0, sticky="ew", pady=(0, 8))
        top.columnconfigure(0, weight=1)

        ttk.Label(top, textvariable=self.reader_server_status_var).grid(row=0, column=0, sticky="w")
        ttk.Label(top, textvariable=self.reader_endpoint_var).grid(row=1, column=0, sticky="w", pady=(2, 0))
        ttk.Label(top, textvariable=self.reader_manifest_src_var).grid(row=2, column=0, sticky="w", pady=(2, 0))

        controls = ttk.LabelFrame(tab, text="Điều khiển chạy", padding=10)
        controls.grid(row=1, column=0, sticky="ew", pady=(0, 8))
        controls.columnconfigure(8, weight=1)

        ttk.Label(controls, text="Cổng:").grid(row=0, column=0, sticky="w")
        self.reader_port_entry = ttk.Entry(controls, textvariable=self.reader_port_var, width=10)
        self.reader_port_entry.grid(row=0, column=1, sticky="w", padx=(4, 8))

        self.reader_allow_lan_chk = ttk.Checkbutton(
            controls,
            text="Cho phép LAN (0.0.0.0)",
            variable=self.reader_allow_lan_var,
            command=self._reader_save_config_from_ui,
        )
        self.reader_allow_lan_chk.grid(row=0, column=2, sticky="w", padx=(0, 8))

        self.reader_btn_start = ttk.Button(controls, text="Chạy server", command=self._reader_start_server)
        self.reader_btn_start.grid(row=0, column=3, sticky="w", padx=(0, 6))

        self.reader_btn_stop = ttk.Button(controls, text="Dừng server", command=self._reader_stop_server)
        self.reader_btn_stop.grid(row=0, column=4, sticky="w", padx=(0, 6))

        self.reader_btn_open = ttk.Button(controls, text="Mở Reader", command=self._reader_open_reader)
        self.reader_btn_open.grid(row=0, column=5, sticky="w", padx=(0, 6))

        self.reader_btn_refresh = ttk.Button(controls, text="Kiểm tra version", command=lambda: self._reader_refresh_manifest_async(manual=True))
        self.reader_btn_refresh.grid(row=0, column=6, sticky="w", padx=(0, 6))

        self.reader_btn_apply_port = ttk.Button(controls, text="Lưu cổng", command=self._reader_save_config_from_ui)
        self.reader_btn_apply_port.grid(row=0, column=7, sticky="w")

        versions = ttk.LabelFrame(tab, text="Quản lý phiên bản", padding=10)
        versions.grid(row=2, column=0, sticky="ew", pady=(0, 8))
        versions.columnconfigure(1, weight=1)
        versions.columnconfigure(3, weight=1)

        ttk.Label(versions, text="Server:").grid(row=0, column=0, sticky="nw")
        server_col = ttk.Frame(versions)
        server_col.grid(row=0, column=1, sticky="ew", padx=(6, 12))
        server_col.columnconfigure(0, weight=1)
        ttk.Label(server_col, textvariable=self.reader_server_local_var).grid(row=0, column=0, sticky="w")
        ttk.Label(server_col, textvariable=self.reader_server_remote_var).grid(row=1, column=0, sticky="w", pady=(2, 0))
        btn_server = ttk.Frame(server_col)
        btn_server.grid(row=2, column=0, sticky="w", pady=(6, 0))
        self.reader_btn_install_server = ttk.Button(btn_server, text="Cài/Cập nhật server", command=self._reader_install_or_update_server)
        self.reader_btn_install_server.pack(side=tk.LEFT)
        self.reader_btn_delete_server = ttk.Button(btn_server, text="Xóa server", command=self._reader_delete_server)
        self.reader_btn_delete_server.pack(side=tk.LEFT, padx=(6, 0))

        ttk.Label(versions, text="UI web:").grid(row=0, column=2, sticky="nw")
        ui_col = ttk.Frame(versions)
        ui_col.grid(row=0, column=3, sticky="ew", padx=(6, 0))
        ui_col.columnconfigure(0, weight=1)
        ttk.Label(ui_col, textvariable=self.reader_ui_local_var).grid(row=0, column=0, sticky="w")
        ttk.Label(ui_col, textvariable=self.reader_ui_remote_var).grid(row=1, column=0, sticky="w", pady=(2, 0))
        btn_ui = ttk.Frame(ui_col)
        btn_ui.grid(row=2, column=0, sticky="w", pady=(6, 0))
        self.reader_btn_install_ui = ttk.Button(btn_ui, text="Cài/Cập nhật UI", command=self._reader_install_or_update_ui)
        self.reader_btn_install_ui.pack(side=tk.LEFT)
        self.reader_btn_delete_ui = ttk.Button(btn_ui, text="Xóa UI", command=self._reader_delete_ui)
        self.reader_btn_delete_ui.pack(side=tk.LEFT, padx=(6, 0))

        ttk.Label(versions, text="Java 21 (vBook):").grid(row=1, column=0, sticky="nw", pady=(10, 0))
        java_col = ttk.Frame(versions)
        java_col.grid(row=1, column=1, columnspan=3, sticky="ew", padx=(6, 0), pady=(10, 0))
        java_col.columnconfigure(0, weight=1)
        ttk.Label(java_col, textvariable=self.reader_java_local_var).grid(row=0, column=0, sticky="w")
        ttk.Label(java_col, textvariable=self.reader_java_remote_var).grid(row=1, column=0, sticky="w", pady=(2, 0))
        btn_java = ttk.Frame(java_col)
        btn_java.grid(row=2, column=0, sticky="w", pady=(6, 0))
        self.reader_btn_install_java = ttk.Button(btn_java, text="Cài/Cập nhật Java", command=self._reader_install_or_update_java)
        self.reader_btn_install_java.pack(side=tk.LEFT)
        self.reader_btn_delete_java = ttk.Button(btn_java, text="Xóa Java", command=self._reader_delete_java)
        self.reader_btn_delete_java.pack(side=tk.LEFT, padx=(6, 0))

        log_frame = ttk.LabelFrame(tab, text="Nhật ký Reader", padding=8)
        log_frame.grid(row=3, column=0, sticky="nsew")
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)
        self.reader_log_text = scrolledtext.ScrolledText(log_frame, height=8, state="disabled", wrap=tk.WORD)
        self.reader_log_text.grid(row=0, column=0, sticky="nsew")

        self._reader_action_buttons = [
            self.reader_btn_start,
            self.reader_btn_stop,
            self.reader_btn_open,
            self.reader_btn_refresh,
            self.reader_btn_apply_port,
            self.reader_btn_install_server,
            self.reader_btn_delete_server,
            self.reader_btn_install_ui,
            self.reader_btn_delete_ui,
            self.reader_btn_install_java,
            self.reader_btn_delete_java,
        ]

        self._reader_server_proc = None
        self._reader_manifest_cache = {}
        self._reader_manifest_meta = {}
        self._reader_busy = False
        self._reader_update_labels()

    # ---------- Config ----------
    def _reader_cfg(self) -> dict:
        cfg = self.app_config.setdefault("reader_manager", {})
        if not isinstance(cfg, dict):
            cfg = {}
            self.app_config["reader_manager"] = cfg
        cfg.setdefault("port", self.READER_DEFAULT_PORT)
        cfg.setdefault("allow_lan", True)
        cfg.setdefault("server_path", "tools/reader_server.exe")
        cfg.setdefault("ui_dir", "reader_ui")
        cfg.setdefault("server_installed_version", "")
        cfg.setdefault("ui_installed_version", "")
        cfg.setdefault("java_installed_version", "")
        return cfg

    def _vbook_cfg(self) -> dict:
        vcfg = self.app_config.setdefault("vbook", {})
        if not isinstance(vcfg, dict):
            vcfg = {}
            self.app_config["vbook"] = vcfg
        vcfg.setdefault("java_bin", "")
        vcfg.setdefault("extensions_dir", "local/vbook_extensions")
        vcfg.setdefault("runner_jar", "tools/vbook_runner/vbook_runner.jar")
        return vcfg

    def _reader_save_config_from_ui(self):
        cfg = self._reader_cfg()
        port = self._reader_parse_port()
        if port is None:
            messagebox.showerror("Reader", "Cổng không hợp lệ. Vui lòng nhập số từ 1-65535.", parent=self)
            return False
        cfg["port"] = port
        cfg["allow_lan"] = bool(self.reader_allow_lan_var.get())
        self.save_config()
        self._reader_log(f"Đã lưu cấu hình Reader: port={port}, allow_lan={cfg['allow_lan']}")
        self._reader_update_runtime_status()
        return True

    def _reader_parse_port(self):
        raw = (self.reader_port_var.get() or "").strip()
        try:
            port = int(raw)
        except Exception:
            return None
        if port < 1 or port > 65535:
            return None
        return port

    def _reader_host(self) -> str:
        return "0.0.0.0" if bool(self.reader_allow_lan_var.get()) else "127.0.0.1"

    def _reader_ui_dir(self) -> str:
        cfg = self._reader_cfg()
        rel = (cfg.get("ui_dir") or "reader_ui").strip() or "reader_ui"
        return os.path.normpath(os.path.join(BASE_DIR, rel))

    def _reader_server_path(self) -> str:
        cfg = self._reader_cfg()
        rel = (cfg.get("server_path") or "tools/reader_server.exe").strip() or "tools/reader_server.exe"
        return os.path.normpath(os.path.join(BASE_DIR, rel))

    def _reader_db_path(self) -> str:
        return os.path.normpath(os.path.join(BASE_DIR, "local", "reader_library.db"))

    def _reader_java_dir(self) -> str:
        return os.path.normpath(os.path.join(BASE_DIR, "tools", "jre"))

    def _reader_java_exe_name(self) -> str:
        return "java.exe" if sys.platform.startswith("win") else "java"

    def _reader_java_default_bin_path(self) -> str:
        return os.path.normpath(os.path.join(self._reader_java_dir(), "bin", self._reader_java_exe_name()))

    def _reader_resolve_java_bin(self, java_bin: str) -> str:
        java_bin = (java_bin or "").strip()
        if not java_bin:
            return ""
        # Nếu là "java" (system PATH) thì giữ nguyên.
        if java_bin.lower() == "java":
            return java_bin
        # Resolve tương đối theo BASE_DIR.
        if not os.path.isabs(java_bin):
            java_bin = os.path.normpath(os.path.join(BASE_DIR, java_bin))
        return java_bin

    def _reader_guess_installed_java_bin(self) -> str:
        vcfg = self._vbook_cfg()
        java_bin_cfg = (vcfg.get("java_bin") or "").strip()
        resolved = self._reader_resolve_java_bin(java_bin_cfg)
        if resolved and (resolved.lower() == "java" or os.path.isfile(resolved)):
            return resolved
        default_bin = self._reader_java_default_bin_path()
        if os.path.isfile(default_bin):
            return default_bin
        if shutil.which("java"):
            return "java"
        return ""

    def _reader_get_java_version(self, java_bin: str) -> str:
        java_bin = (java_bin or "").strip()
        if not java_bin:
            return ""
        try:
            proc = subprocess.run(
                [java_bin, "-version"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=6,
                check=False,
                creationflags=(0x08000000 if sys.platform.startswith("win") else 0),
            )
            out = (proc.stderr or proc.stdout or b"").decode("utf-8", errors="ignore")
            m = re.search(r'version\\s+\"([^\"]+)\"', out)
            if m:
                return (m.group(1) or "").strip()
        except Exception:
            return ""
        return ""

    def _reader_local_url(self) -> str:
        port = self._reader_parse_port() or self.READER_DEFAULT_PORT
        return f"http://127.0.0.1:{port}/library"

    # ---------- Manifest ----------
    def _reader_load_manifest(self) -> dict:
        data = {}
        use_local_only = bool(getattr(self, "use_local_manifest_only", False))
        if not use_local_only:
            manifest_url = getattr(self, "VERSION_CHECK_URL", "")
            if manifest_url:
                try:
                    data = fetch_manifest_from_url(manifest_url, timeout=10) or {}
                    self.reader_manifest_src_var.set(f"Manifest: remote ({manifest_url})")
                except Exception:
                    data = {}
        if not data:
            path = os.path.join(BASE_DIR, "version.json")
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.reader_manifest_src_var.set("Manifest: local (version.json)")
            except Exception:
                data = {}
                self.reader_manifest_src_var.set("Manifest: Không tải được")

        meta = {}
        if isinstance(data, dict):
            meta = data.get("reader_app") or {}
            if not isinstance(meta, dict):
                meta = {}
        self._reader_manifest_cache = data if isinstance(data, dict) else {}
        self._reader_manifest_meta = meta
        return meta

    def _reader_refresh_manifest_async(self, manual=False):
        self._reader_set_busy(True, "Đang kiểm tra version Reader...")

        def worker():
            return self._reader_load_manifest()

        def done(meta):
            self._reader_set_busy(False)
            self._reader_update_labels(meta=meta)
            self._reader_update_runtime_status()
            if manual:
                self._reader_log("Đã kiểm tra version Reader.")

        def fail(exc):
            self._reader_set_busy(False)
            self._reader_update_labels(meta={})
            self._reader_update_runtime_status()
            self._reader_log(f"Không đọc được manifest Reader: {exc}")
            if manual:
                messagebox.showerror("Reader", f"Không thể đọc version Reader: {exc}", parent=self)

        self._reader_run_bg(worker, done, fail)

    # ---------- Server runtime ----------
    def _reader_server_alive(self, timeout=1.2):
        port = self._reader_parse_port()
        if port is None:
            return False
        url = f"http://127.0.0.1:{port}/api/health"
        try:
            resp = requests.get(url, timeout=timeout)
            return bool(resp.ok)
        except Exception:
            return False

    def _reader_port_occupied(self, port: int) -> bool:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.settimeout(0.3)
            return sock.connect_ex(("127.0.0.1", int(port))) == 0
        except Exception:
            return False
        finally:
            try:
                sock.close()
            except Exception:
                pass

    def _reader_find_free_port(self, start_port: int) -> int:
        p = max(1024, int(start_port))
        for _ in range(200):
            if not self._reader_port_occupied(p):
                return p
            p += 1
        return 0

    def _reader_update_runtime_status(self):
        port = self._reader_parse_port()
        if port is None:
            self.reader_server_status_var.set("Trạng thái server: Cổng không hợp lệ")
            self.reader_endpoint_var.set("Endpoint: —")
            return

        host = self._reader_host()
        local_url = f"http://127.0.0.1:{port}/library"
        lan_url = f"http://{host}:{port}/library"

        managed_running = bool(getattr(self, "_reader_server_proc", None) and self._reader_server_proc.poll() is None)
        alive = self._reader_server_alive(timeout=0.8)

        if managed_running and alive:
            status = "Đang chạy (quản lý bởi app)"
        elif (not managed_running) and alive:
            status = "Đang chạy (server ngoài)"
        elif managed_running and not alive:
            status = "Tiến trình đã bật nhưng chưa phản hồi health"
        else:
            status = "Đã dừng"

        self.reader_server_status_var.set(f"Trạng thái server: {status}")
        if host == "0.0.0.0":
            self.reader_endpoint_var.set(f"Endpoint: local {local_url} | LAN {lan_url}")
        else:
            self.reader_endpoint_var.set(f"Endpoint: {local_url}")

    def _reader_build_start_cmd(self):
        host = self._reader_host()
        port = self._reader_parse_port()
        if port is None:
            raise RuntimeError("Cổng không hợp lệ.")

        ui_dir = self._reader_ui_dir()
        if not os.path.isdir(ui_dir):
            raise RuntimeError(f"Chưa có UI tại: {ui_dir}. Hãy cài UI trước.")

        db_path = self._reader_db_path()
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

        exe_path = self._reader_server_path()
        if os.path.isfile(exe_path):
            cmd = [exe_path]
        else:
            script = os.path.join(BASE_DIR, "reader_server.py")
            if not os.path.isfile(script):
                raise RuntimeError("Thiếu reader_server.py và cũng chưa cài reader_server.exe")
            cmd = [sys.executable, script]

        cmd += ["--host", host, "--port", str(port), "--ui-dir", ui_dir, "--db", db_path]
        return cmd

    def _reader_start_server(self):
        if not self._reader_save_config_from_ui():
            return

        if self._reader_server_alive(timeout=0.8):
            self._reader_log("Server reader đã chạy, bỏ qua lệnh start.")
            self._reader_update_runtime_status()
            return

        self._reader_set_busy(True, "Đang khởi chạy server Reader...")

        def worker():
            cmd = self._reader_build_start_cmd()
            creationflags = 0x08000000 if sys.platform.startswith("win") else 0
            proc = subprocess.Popen(
                cmd,
                cwd=BASE_DIR,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=creationflags,
            )

            t0 = time.time()
            while time.time() - t0 < 8.0:
                if proc.poll() is not None:
                    raise RuntimeError("Server thoát ngay sau khi chạy.")
                if self._reader_server_alive(timeout=0.8):
                    return proc
                time.sleep(0.35)
            try:
                proc.terminate()
            except Exception:
                pass
            raise RuntimeError("Server không phản hồi health sau 8 giây.")

        def done(proc):
            self._reader_set_busy(False)
            self._reader_server_proc = proc
            self._reader_update_runtime_status()
            self._reader_log("Đã chạy server Reader thành công.")

        def fail(exc):
            self._reader_set_busy(False)
            self._reader_update_runtime_status()
            port = self._reader_parse_port() or self.READER_DEFAULT_PORT
            if self._reader_port_occupied(port):
                free_port = self._reader_find_free_port(port + 1)
                if free_port:
                    if messagebox.askyesno(
                        "Reader",
                        f"Không chạy được trên cổng {port}.\n"
                        f"Bạn có muốn đổi sang cổng {free_port} và thử lại không?",
                        parent=self,
                    ):
                        self.reader_port_var.set(str(free_port))
                        self._reader_save_config_from_ui()
                        self.after(100, self._reader_start_server)
                        return
            self._reader_log(f"Lỗi chạy server Reader: {exc}")
            messagebox.showerror("Reader", f"Không chạy được server Reader:\n{exc}", parent=self)

        self._reader_run_bg(worker, done, fail)

    def _reader_stop_server(self, silent=False):
        proc = getattr(self, "_reader_server_proc", None)
        alive = self._reader_server_alive(timeout=0.8)

        if proc and proc.poll() is None:
            try:
                proc.terminate()
            except Exception:
                pass
            for _ in range(10):
                if proc.poll() is not None:
                    break
                time.sleep(0.2)
            if proc.poll() is None:
                try:
                    proc.kill()
                except Exception:
                    pass
            self._reader_server_proc = None
            self._reader_update_runtime_status()
            if not silent:
                self._reader_log("Đã dừng server Reader (managed).")
            return

        if alive:
            if not silent:
                messagebox.showinfo(
                    "Reader",
                    "Server đang chạy nhưng không do app này khởi tạo.\n"
                    "Hãy tắt tiến trình đó thủ công nếu cần.",
                    parent=self,
                )
            self._reader_update_runtime_status()
            return

        if not silent:
            self._reader_log("Server Reader đang dừng.")
        self._reader_update_runtime_status()

    def _reader_open_reader(self):
        if not self._reader_server_alive(timeout=0.8):
            if messagebox.askyesno("Reader", "Server chưa chạy. Chạy server ngay bây giờ?", parent=self):
                self._reader_start_server()
                self.after(1200, self._reader_open_reader)
                return
            return
        url = self._reader_local_url()
        webbrowser.open(url)

    # ---------- Install / remove ----------
    def _reader_download_file(self, url: str, suffix: str = "") -> str:
        tmp_fd, tmp_path = tempfile.mkstemp(prefix="reader_dl_", suffix=suffix)
        os.close(tmp_fd)
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NovelStudio/Reader"}
            with requests.get(url, timeout=45, stream=True, headers=headers) as resp:
                resp.raise_for_status()
                with open(tmp_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=1024 * 64):
                        if chunk:
                            f.write(chunk)
            return tmp_path
        except Exception:
            try:
                os.remove(tmp_path)
            except Exception:
                pass
            raise

    def _reader_pick_zip_root(self, extracted_dir: str) -> str:
        entries = [os.path.join(extracted_dir, name) for name in os.listdir(extracted_dir)]
        dirs = [p for p in entries if os.path.isdir(p)]
        files = [p for p in entries if os.path.isfile(p)]
        if len(dirs) == 1 and not files:
            return dirs[0]
        return extracted_dir

    def _reader_install_or_update_server(self):
        meta = self._reader_manifest_meta or self._reader_load_manifest()
        srv = meta.get("server") if isinstance(meta, dict) else {}
        if not isinstance(srv, dict):
            srv = {}
        url = (srv.get("url") or "").strip()
        if not url:
            messagebox.showerror("Reader", "Chưa có link server trong version.json -> reader_app.server.url", parent=self)
            return

        self._reader_set_busy(True, "Đang cài/cập nhật server Reader...")

        def worker():
            downloaded = self._reader_download_file(url, suffix=os.path.splitext(url)[1] or ".bin")
            exe_name = (srv.get("exe_name") or "reader_server.exe").strip() or "reader_server.exe"
            target = self._reader_server_path()
            os.makedirs(os.path.dirname(target), exist_ok=True)

            if downloaded.lower().endswith(".zip"):
                with tempfile.TemporaryDirectory(prefix="reader_srv_unpack_") as tmpd:
                    with zipfile.ZipFile(downloaded, "r") as zf:
                        zf.extractall(tmpd)
                    root = self._reader_pick_zip_root(tmpd)
                    src = os.path.join(root, exe_name)
                    if not os.path.isfile(src):
                        exe_candidates = []
                        for r, _dirs, files in os.walk(root):
                            for fn in files:
                                if fn.lower().endswith(".exe"):
                                    exe_candidates.append(os.path.join(r, fn))
                        if not exe_candidates:
                            raise RuntimeError("Không tìm thấy file .exe trong gói server.")
                        src = exe_candidates[0]
                    shutil.copy2(src, target)
            else:
                shutil.copy2(downloaded, target)

            try:
                os.remove(downloaded)
            except Exception:
                pass

            cfg = self._reader_cfg()
            cfg["server_installed_version"] = str(srv.get("version") or "")
            cfg["server_path"] = os.path.relpath(target, BASE_DIR).replace("\\", "/")
            self.save_config()
            return cfg["server_installed_version"]

        def done(ver):
            self._reader_set_busy(False)
            self._reader_log(f"Đã cài/cập nhật server Reader. Version: {ver or 'không rõ'}")
            self._reader_update_labels()
            self._reader_update_runtime_status()

        def fail(exc):
            self._reader_set_busy(False)
            self._reader_log(f"Cài server Reader thất bại: {exc}")
            messagebox.showerror("Reader", f"Cài/cập nhật server thất bại:\n{exc}", parent=self)

        self._reader_run_bg(worker, done, fail)

    def _reader_install_or_update_ui(self):
        meta = self._reader_manifest_meta or self._reader_load_manifest()
        ui = meta.get("ui") if isinstance(meta, dict) else {}
        if not isinstance(ui, dict):
            ui = {}
        url = (ui.get("url") or "").strip()
        if not url:
            messagebox.showerror("Reader", "Chưa có link UI trong version.json -> reader_app.ui.url", parent=self)
            return

        self._reader_set_busy(True, "Đang cài/cập nhật UI Reader...")

        def worker():
            downloaded = self._reader_download_file(url, suffix=os.path.splitext(url)[1] or ".zip")
            if not downloaded.lower().endswith(".zip"):
                raise RuntimeError("Gói UI phải là file .zip")

            target = self._reader_ui_dir()
            backup = f"{target}.bak"

            with tempfile.TemporaryDirectory(prefix="reader_ui_unpack_") as tmpd:
                with zipfile.ZipFile(downloaded, "r") as zf:
                    zf.extractall(tmpd)
                root = self._reader_pick_zip_root(tmpd)

                if os.path.isdir(backup):
                    shutil.rmtree(backup, ignore_errors=True)
                if os.path.isdir(target):
                    if os.path.isdir(backup):
                        shutil.rmtree(backup, ignore_errors=True)
                    os.replace(target, backup)

                try:
                    shutil.copytree(root, target)
                    if os.path.isdir(backup):
                        shutil.rmtree(backup, ignore_errors=True)
                except Exception:
                    if os.path.isdir(target):
                        shutil.rmtree(target, ignore_errors=True)
                    if os.path.isdir(backup):
                        os.replace(backup, target)
                    raise

            try:
                os.remove(downloaded)
            except Exception:
                pass

            cfg = self._reader_cfg()
            cfg["ui_installed_version"] = str(ui.get("version") or "")
            cfg["ui_dir"] = os.path.relpath(target, BASE_DIR).replace("\\", "/")
            self.save_config()
            return cfg["ui_installed_version"]

        def done(ver):
            self._reader_set_busy(False)
            self._reader_log(f"Đã cài/cập nhật UI Reader. Version: {ver or 'không rõ'}")
            self._reader_update_labels()
            self._reader_update_runtime_status()

        def fail(exc):
            self._reader_set_busy(False)
            self._reader_log(f"Cài UI Reader thất bại: {exc}")
            messagebox.showerror("Reader", f"Cài/cập nhật UI thất bại:\n{exc}", parent=self)

        self._reader_run_bg(worker, done, fail)

    def _reader_install_or_update_java(self):
        meta = self._reader_manifest_meta or self._reader_load_manifest()
        java_meta = meta.get("java") if isinstance(meta, dict) else {}
        if not isinstance(java_meta, dict):
            java_meta = {}

        url = (java_meta.get("url") or "").strip()
        if not url:
            # Fallback: dùng API stable của Adoptium để lấy Temurin JRE 21 (Windows x64).
            if not sys.platform.startswith("win"):
                messagebox.showerror("Reader", "Tự tải Java hiện chỉ bật mặc định cho Windows. Hãy cài Java 21 thủ công.", parent=self)
                return
            url = self.DEFAULT_JAVA21_WIN_X64_URL

        self._reader_set_busy(True, "Đang cài/cập nhật Java 21 cho vBook...")

        def worker():
            downloaded = self._reader_download_file(url, suffix=".zip")
            target = self._reader_java_dir()
            backup = f"{target}.bak"

            with tempfile.TemporaryDirectory(prefix="reader_java_unpack_") as tmpd:
                with zipfile.ZipFile(downloaded, "r") as zf:
                    zf.extractall(tmpd)
                root = self._reader_pick_zip_root(tmpd)

                # Validate structure.
                expected = os.path.join(root, "bin", self._reader_java_exe_name())
                if not os.path.isfile(expected):
                    raise RuntimeError("Gói Java không hợp lệ: không tìm thấy bin/java.")

                if os.path.isdir(backup):
                    shutil.rmtree(backup, ignore_errors=True)
                if os.path.isdir(target):
                    if os.path.isdir(backup):
                        shutil.rmtree(backup, ignore_errors=True)
                    os.replace(target, backup)

                try:
                    shutil.copytree(root, target)
                    if os.path.isdir(backup):
                        shutil.rmtree(backup, ignore_errors=True)
                except Exception:
                    if os.path.isdir(target):
                        shutil.rmtree(target, ignore_errors=True)
                    if os.path.isdir(backup):
                        os.replace(backup, target)
                    raise

            try:
                os.remove(downloaded)
            except Exception:
                pass

            java_bin = self._reader_java_default_bin_path()
            vcfg = self._vbook_cfg()
            vcfg["java_bin"] = os.path.relpath(java_bin, BASE_DIR).replace("\\", "/")
            java_ver = self._reader_get_java_version(java_bin) or str(java_meta.get("version") or "").strip()

            cfg = self._reader_cfg()
            cfg["java_installed_version"] = java_ver
            self.save_config()
            return java_ver

        def done(ver):
            self._reader_set_busy(False)
            self._reader_log(f"Đã cài/cập nhật Java 21. Version: {ver or 'không rõ'}")
            self._reader_update_labels()
            self._reader_update_runtime_status()

        def fail(exc):
            self._reader_set_busy(False)
            self._reader_log(f"Cài Java thất bại: {exc}")
            messagebox.showerror("Reader", f"Cài/cập nhật Java thất bại:\n{exc}", parent=self)

        self._reader_run_bg(worker, done, fail)

    def _reader_delete_server(self):
        target = self._reader_server_path()
        if not os.path.isfile(target):
            messagebox.showinfo("Reader", "Server chưa được cài.", parent=self)
            return
        if not messagebox.askyesno("Reader", f"Xóa server tại:\n{target}\n\nTiếp tục?", parent=self):
            return
        self._reader_stop_server(silent=True)
        try:
            os.remove(target)
        except Exception as exc:
            messagebox.showerror("Reader", f"Không thể xóa server:\n{exc}", parent=self)
            return
        cfg = self._reader_cfg()
        cfg["server_installed_version"] = ""
        self.save_config()
        self._reader_log("Đã xóa server Reader.")
        self._reader_update_labels()
        self._reader_update_runtime_status()

    def _reader_delete_ui(self):
        target = self._reader_ui_dir()
        if not os.path.isdir(target):
            messagebox.showinfo("Reader", "UI chưa được cài.", parent=self)
            return
        if not messagebox.askyesno("Reader", f"Xóa UI tại:\n{target}\n\nTiếp tục?", parent=self):
            return
        try:
            shutil.rmtree(target, ignore_errors=True)
        except Exception as exc:
            messagebox.showerror("Reader", f"Không thể xóa UI:\n{exc}", parent=self)
            return
        cfg = self._reader_cfg()
        cfg["ui_installed_version"] = ""
        self.save_config()
        self._reader_log("Đã xóa UI Reader.")
        self._reader_update_labels()
        self._reader_update_runtime_status()

    def _reader_delete_java(self):
        target = self._reader_java_dir()
        if not os.path.isdir(target):
            messagebox.showinfo("Reader", "Java chưa được cài.", parent=self)
            return
        if not messagebox.askyesno("Reader", f"Xóa Java tại:\n{target}\n\nTiếp tục?", parent=self):
            return
        try:
            shutil.rmtree(target, ignore_errors=True)
        except Exception as exc:
            messagebox.showerror("Reader", f"Không thể xóa Java:\n{exc}", parent=self)
            return

        # Clear config nếu đang trỏ vào bundle.
        vcfg = self._vbook_cfg()
        java_bin_cfg = (vcfg.get("java_bin") or "").strip()
        if java_bin_cfg and ("tools/jre" in java_bin_cfg.replace("\\", "/")):
            vcfg["java_bin"] = ""

        cfg = self._reader_cfg()
        cfg["java_installed_version"] = ""
        self.save_config()
        self._reader_log("Đã xóa Java.")
        self._reader_update_labels()
        self._reader_update_runtime_status()

    # ---------- UI helpers ----------
    def _reader_set_busy(self, busy: bool, status_text: str = ""):
        self._reader_busy = bool(busy)
        for btn in getattr(self, "_reader_action_buttons", []):
            try:
                btn.configure(state=(tk.DISABLED if busy else tk.NORMAL))
            except Exception:
                pass
        if busy and status_text:
            self.reader_server_status_var.set(status_text)

    def _reader_log(self, text: str):
        try:
            now = time.strftime("%H:%M:%S")
            self.reader_log_text.configure(state="normal")
            self.reader_log_text.insert(tk.END, f"[{now}] {text}\n")
            self.reader_log_text.see(tk.END)
            self.reader_log_text.configure(state="disabled")
        except Exception:
            pass

    def _reader_update_labels(self, meta=None):
        cfg = self._reader_cfg()
        if meta is None:
            meta = self._reader_manifest_meta if isinstance(self._reader_manifest_meta, dict) else {}
        srv_meta = (meta or {}).get("server") if isinstance(meta, dict) else {}
        ui_meta = (meta or {}).get("ui") if isinstance(meta, dict) else {}
        java_meta = (meta or {}).get("java") if isinstance(meta, dict) else {}
        if not isinstance(srv_meta, dict):
            srv_meta = {}
        if not isinstance(ui_meta, dict):
            ui_meta = {}
        if not isinstance(java_meta, dict):
            java_meta = {}

        server_path = self._reader_server_path()
        ui_dir = self._reader_ui_dir()

        local_srv_ver = (cfg.get("server_installed_version") or "").strip()
        local_ui_ver = (cfg.get("ui_installed_version") or "").strip()
        local_java_ver = (cfg.get("java_installed_version") or "").strip()

        srv_state = "đã cài" if os.path.isfile(server_path) else "chưa cài"
        ui_state = "đã cài" if os.path.isdir(ui_dir) else "chưa cài"

        self.reader_server_local_var.set(f"Server local: {local_srv_ver or 'không rõ'} ({srv_state})")
        self.reader_server_remote_var.set(f"Server bản mới: {str(srv_meta.get('version') or '—')}")

        self.reader_ui_local_var.set(f"UI local: {local_ui_ver or 'không rõ'} ({ui_state})")
        self.reader_ui_remote_var.set(f"UI bản mới: {str(ui_meta.get('version') or '—')}")

        # Java: ưu tiên config vbook.java_bin, fallback tools/jre, rồi PATH.
        vcfg = self._vbook_cfg()
        java_bin = self._reader_guess_installed_java_bin()
        java_state = "chưa cài"
        if java_bin:
            if java_bin == "java":
                java_state = "system (PATH)"
            elif os.path.isfile(java_bin):
                java_state = "đã cài"
                # Nếu đã có bundle nhưng config chưa set thì tự set cho đồng nhất.
                if not (vcfg.get("java_bin") or "").strip() and java_bin.startswith(BASE_DIR):
                    vcfg["java_bin"] = os.path.relpath(java_bin, BASE_DIR).replace("\\", "/")
                    self.save_config()

        self.reader_java_local_var.set(f"Java local: {local_java_ver or 'không rõ'} ({java_state})")
        self.reader_java_remote_var.set(f"Java bản mới: {str(java_meta.get('version') or '—')}")

    def _reader_on_tab_activated(self):
        self._reader_update_runtime_status()
        self._reader_refresh_manifest_async(manual=False)

    def _reader_run_bg(self, worker, on_done, on_fail):
        def _task():
            try:
                result = worker()
            except Exception as exc:
                self.after(0, lambda: on_fail(exc))
                return
            self.after(0, lambda: on_done(result))

        threading.Thread(target=_task, daemon=True).start()
