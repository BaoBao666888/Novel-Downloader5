from __future__ import annotations

import json
import multiprocessing
import queue
import re
import secrets
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

_run_qt_browser = None
_QT_AVAILABLE = None
_QT_ERROR = None

DEFAULT_URL = "https://www.google.com/"


def _ensure_qt_runner():
    global _run_qt_browser, _QT_AVAILABLE, _QT_ERROR
    if _run_qt_browser is not None:
        _QT_AVAILABLE = True
        return _run_qt_browser
    if _QT_AVAILABLE is False:
        return None
    try:
        from app.ui.qt_browser import run_browser as runner
    except Exception as exc:  # pragma: no cover - defensive
        _run_qt_browser = None
        _QT_AVAILABLE = False
        _QT_ERROR = exc
        return None
    _run_qt_browser = runner
    _QT_AVAILABLE = True
    _QT_ERROR = None
    return _run_qt_browser


class BrowserOverlay:
    """Điều khiển trình duyệt Qt và cung cấp bridge sync cho worker ẩn."""

    def __init__(self, app):
        self.app = app
        self.current_url = DEFAULT_URL
        self.proc = None
        self.cmd_conn = None
        self.event_conn = None
        self.event_queue = queue.Queue()
        self.listener_thread = None
        self.profile_dir = None
        self.window_visible = False
        self._event_conn_id = 0
        self._fetch_lock = threading.Lock()
        self._fetch_waiters = {}
        self._fetch_seq = 0
        self._bridge_lock = threading.Lock()
        self._bridge_waiters = {}
        self._bridge_seq = 0
        self._event_pump_started = False

    def set_profile(self, path):
        self.profile_dir = path
        if self.proc:
            self.stop()

    def available(self):
        return _ensure_qt_runner() is not None

    def is_running(self):
        proc = self.proc
        if not proc:
            return False
        try:
            alive = proc.is_alive()
        except Exception:
            alive = False
        if alive:
            return True
        self._handle_worker_closed(notify=False)
        return False

    def is_visible(self):
        return bool(self.window_visible and self.is_running())

    def ensure_running(self, *, show_window: bool = False, initial_url: str | None = None, log: bool = False):
        if self.is_running():
            if show_window and self.cmd_conn:
                try:
                    self.cmd_conn.send(("SHOW_WINDOW", None))
                    self.window_visible = True
                    if hasattr(self.app, "on_browser_overlay_opened"):
                        self.app.on_browser_overlay_opened()
                except Exception:
                    pass
            return True
        if not self.available():
            if log and hasattr(self.app, "log"):
                self.app.log(f"Không thể mở trình duyệt: thiếu PyQt5/PyQtWebEngine ({_QT_ERROR}).")
            return False
        runner = _ensure_qt_runner()
        if runner is None:
            if log and hasattr(self.app, "log"):
                self.app.log(f"Không thể mở trình duyệt: thiếu PyQt5/PyQtWebEngine ({_QT_ERROR}).")
            return False

        parent_conn, child_conn = multiprocessing.Pipe()
        parent_events, child_events = multiprocessing.Pipe()
        self.cmd_conn = parent_conn
        self.event_conn = parent_events
        spy_targets = None
        if hasattr(self.app, "_get_browser_spy_targets"):
            try:
                targets = self.app._get_browser_spy_targets()
                if targets:
                    spy_targets = sorted(targets)
            except Exception:
                spy_targets = None
        self._event_conn_id += 1
        conn_id = self._event_conn_id
        start_url = self.current_url
        if initial_url:
            start_url = self._normalize_url(initial_url)
            self.current_url = start_url
        self.window_visible = bool(show_window)
        self.proc = multiprocessing.Process(
            target=runner,
            args=(start_url, child_conn, child_events, self.profile_dir, spy_targets, not show_window),
            daemon=True,
        )
        self.proc.start()
        self._start_listener_thread(conn_id)
        if show_window and hasattr(self.app, "on_browser_overlay_opened"):
            self.app.on_browser_overlay_opened()
        if log and hasattr(self.app, "log"):
            self.app.log("Đang mở cửa sổ trình duyệt Qt..." if show_window else "Đang mở ngầm trình duyệt Qt...")
        return True

    def toggle(self):
        if self.is_visible():
            self.hide()
        else:
            self.show()

    def show(self):
        started = self.ensure_running(show_window=True, log=True)
        self._schedule_event_poll()
        return started

    def start_event_pump(self):
        if self._event_pump_started:
            return
        self._event_pump_started = True
        self._schedule_event_poll()

    def hide(self):
        if not self.is_running():
            return
        if self.cmd_conn:
            try:
                self.cmd_conn.send(("HIDE_WINDOW", None))
            except Exception:
                pass
        self.window_visible = False
        if hasattr(self.app, "on_browser_overlay_closed"):
            self.app.on_browser_overlay_closed()
        if hasattr(self.app, "log"):
            self.app.log("Đã ẩn cửa sổ trình duyệt Qt.")

    def stop(self):
        if not self.proc and not self.cmd_conn:
            return
        if self.cmd_conn:
            try:
                self.cmd_conn.send(("EXIT", None))
            except Exception:
                pass
        if self.proc:
            try:
                self.proc.join(timeout=2.0)
                if self.proc.is_alive():
                    self.proc.terminate()
            except Exception:
                pass
        self._handle_worker_closed(notify=False)
        if hasattr(self.app, "on_browser_overlay_closed"):
            self.app.on_browser_overlay_closed()
        if hasattr(self.app, "log"):
            self.app.log("Đã đóng tiến trình trình duyệt Qt.")

    def navigate(self, url: str):
        url = self._normalize_url(url)
        if url and self.ensure_running(show_window=False):
            self.cmd_conn.send(("LOAD", url))

    def reload(self):
        if self.ensure_running(show_window=False):
            self.cmd_conn.send(("RELOAD", None))

    def back(self):
        if self.ensure_running(show_window=False):
            self.cmd_conn.send(("BACK", None))

    def forward(self):
        if self.ensure_running(show_window=False):
            self.cmd_conn.send(("FORWARD", None))

    def fetch_html(self, url: str, timeout_sec: float = 30.0, open_if_needed: bool = False) -> str:
        raw_url = (url or "").strip()
        if not raw_url:
            raise ValueError("URL rỗng.")
        target = self._normalize_url(raw_url)
        result = self.bridge_call(
            "FETCH_HTML",
            {
                "url": target,
                "timeout_ms": max(2000, int(float(timeout_sec or 30.0) * 1000)),
            },
            timeout_sec=max(3.0, float(timeout_sec or 30.0) + 3.0),
            open_if_needed=bool(open_if_needed),
        )
        return str(result.get("html") or "")

    def bridge_call(
        self,
        op: str,
        payload: dict | None = None,
        *,
        timeout_sec: float = 30.0,
        open_if_needed: bool = True,
    ) -> dict:
        operation = str(op or "").strip().upper()
        if not operation:
            raise ValueError("Thiếu op bridge.")
        if not self.available():
            raise RuntimeError("Trình duyệt Qt chưa sẵn sàng.")
        initial_url = ""
        if isinstance(payload, dict):
            initial_url = str(payload.get("url") or payload.get("base_url") or "").strip()
        if not self.is_running():
            if not open_if_needed:
                raise RuntimeError("Trình duyệt Qt chưa chạy.")
            if not self.ensure_running(show_window=False, initial_url=initial_url or None, log=True):
                raise RuntimeError("Không thể khởi động trình duyệt Qt ngầm.")
        if not self.cmd_conn:
            raise RuntimeError("Không thể kết nối tiến trình trình duyệt Qt.")

        req_id = self._next_bridge_id()
        waiter = queue.Queue(maxsize=1)
        with self._bridge_lock:
            self._bridge_waiters[req_id] = waiter
        message = {"id": req_id, "op": operation}
        if isinstance(payload, dict):
            message.update(payload)
        try:
            self.cmd_conn.send(("BRIDGE_CALL", message))
        except Exception as exc:
            with self._bridge_lock:
                self._bridge_waiters.pop(req_id, None)
            raise RuntimeError(f"Gửi lệnh bridge `{operation}` thất bại: {exc}") from exc
        try:
            result = waiter.get(timeout=max(2.0, float(timeout_sec or 30.0)))
        except queue.Empty as exc:
            with self._bridge_lock:
                self._bridge_waiters.pop(req_id, None)
            raise TimeoutError(f"Bridge `{operation}` quá hạn ({timeout_sec}s).") from exc
        if not isinstance(result, dict):
            raise RuntimeError(f"Bridge `{operation}` trả dữ liệu không hợp lệ.")
        if not result.get("ok"):
            raise RuntimeError(str(result.get("error") or f"Bridge `{operation}` thất bại."))
        return result

    def _normalize_url(self, url: str) -> str:
        url = (url or "").strip()
        if not url:
            return DEFAULT_URL
        if not re.match(r"^[a-zA-Z]+://", url):
            url = "https://" + url
        return url

    def _start_listener_thread(self, conn_id: int):
        if not self.event_conn:
            return
        conn = self.event_conn

        def _listen():
            try:
                while conn:
                    if conn.poll(0.2):
                        event = conn.recv()
                        if (
                            isinstance(event, tuple)
                            and len(event) >= 2
                            and event[0] == "FETCH_RESULT"
                            and isinstance(event[1], dict)
                        ):
                            self._resolve_fetch_waiter(event[1])
                            continue
                        if (
                            isinstance(event, tuple)
                            and len(event) >= 2
                            and event[0] == "BRIDGE_RESULT"
                            and isinstance(event[1], dict)
                        ):
                            self._resolve_bridge_waiter(event[1])
                            continue
                        self.event_queue.put((conn_id, event))
            except EOFError:
                self._fail_all_fetch_waiters("Pipe trình duyệt đã đóng.")
                self._fail_all_bridge_waiters("Pipe trình duyệt đã đóng.")
            except OSError:
                self._fail_all_fetch_waiters("Kết nối trình duyệt bị ngắt.")
                self._fail_all_bridge_waiters("Kết nối trình duyệt bị ngắt.")

        self.listener_thread = threading.Thread(target=_listen, daemon=True)
        self.listener_thread.start()
        if threading.current_thread() is threading.main_thread():
            self._schedule_event_poll()

    def _schedule_event_poll(self):
        if not hasattr(self.app, "after"):
            return
        try:
            self.app.after(50, self._poll_events)
        except Exception:
            pass

    def _poll_events(self):
        while not self.event_queue.empty():
            entry = self.event_queue.get()
            if isinstance(entry, tuple) and len(entry) == 2 and isinstance(entry[0], int):
                conn_id, event = entry
                if conn_id != self._event_conn_id:
                    continue
            else:
                event = entry
            if not event:
                continue
            event_name = event[0]
            if event_name == "URL_CHANGED":
                self.current_url = event[1]
            elif event_name == "WINDOW_SHOWN":
                self.window_visible = True
            elif event_name == "WINDOW_HIDDEN":
                self.window_visible = False
            elif event_name == "WINDOW_CLOSED":
                self._handle_worker_closed(notify=True)
            elif event_name == "REQUEST_HEADERS":
                if hasattr(self.app, "_on_browser_headers"):
                    try:
                        self.app._on_browser_headers(event[1])
                    except Exception:
                        pass
            elif event_name == "USER_AGENT":
                if hasattr(self.app, "_on_browser_user_agent"):
                    try:
                        self.app._on_browser_user_agent(event[1])
                    except Exception:
                        pass
            elif event_name == "REQUEST_COOKIES":
                if hasattr(self.app, "_on_browser_cookies"):
                    try:
                        self.app._on_browser_cookies(event[1])
                    except Exception:
                        pass
            elif event_name == "PROFILE_SWITCH_REQUEST":
                try:
                    new_profile_name = event[1]
                    if hasattr(self.app, "_on_browser_profile_switched"):
                        self.app._on_browser_profile_switched(new_profile_name)
                    else:
                        self.stop()
                        if new_profile_name == "Profile 1":
                            self.profile_dir = None
                except Exception:
                    pass
            elif event_name == "PROFILE_DELETE_REQUEST":
                try:
                    profile_name = event[1]
                    if hasattr(self.app, "_on_browser_profile_delete_request"):
                        self.app._on_browser_profile_delete_request(profile_name)
                except Exception:
                    pass
            elif event_name == "PROFILE_RENAME_REQUEST":
                try:
                    payload = event[1]
                    if hasattr(self.app, "_on_browser_profile_rename_request"):
                        self.app._on_browser_profile_rename_request(payload)
                except Exception:
                    pass
            elif event_name == "PROFILE_RESTORE_REQUEST":
                try:
                    profile_name = event[1]
                    if hasattr(self.app, "_on_browser_profile_restore_request"):
                        self.app._on_browser_profile_restore_request(profile_name)
                except Exception:
                    pass
        if self._event_pump_started:
            self.app.after(200, self._poll_events)

    def _next_fetch_id(self) -> str:
        with self._fetch_lock:
            self._fetch_seq += 1
            return f"fetch-{int(time.time() * 1000)}-{self._fetch_seq}"

    def _next_bridge_id(self) -> str:
        with self._bridge_lock:
            self._bridge_seq += 1
            return f"bridge-{int(time.time() * 1000)}-{self._bridge_seq}"

    def _resolve_fetch_waiter(self, payload: dict):
        req_id = str((payload or {}).get("id") or "").strip()
        if not req_id:
            return
        with self._fetch_lock:
            waiter = self._fetch_waiters.pop(req_id, None)
        if waiter is None:
            return
        try:
            waiter.put_nowait(payload)
        except Exception:
            pass

    def _resolve_bridge_waiter(self, payload: dict):
        req_id = str((payload or {}).get("id") or "").strip()
        if not req_id:
            return
        with self._bridge_lock:
            waiter = self._bridge_waiters.pop(req_id, None)
        if waiter is None:
            return
        try:
            waiter.put_nowait(payload)
        except Exception:
            pass

    def _fail_all_fetch_waiters(self, message: str):
        with self._fetch_lock:
            waiters = list(self._fetch_waiters.values())
            self._fetch_waiters.clear()
        for waiter in waiters:
            try:
                waiter.put_nowait({"ok": False, "error": message})
            except Exception:
                pass

    def _fail_all_bridge_waiters(self, message: str):
        with self._bridge_lock:
            waiters = list(self._bridge_waiters.values())
            self._bridge_waiters.clear()
        for waiter in waiters:
            try:
                waiter.put_nowait({"ok": False, "error": message})
            except Exception:
                pass

    def _handle_worker_closed(self, *, notify: bool):
        proc = self.proc
        self.proc = None
        self.cmd_conn = None
        self.event_conn = None
        self.listener_thread = None
        self.window_visible = False
        self._event_conn_id += 1
        self._fail_all_fetch_waiters("Trình duyệt Qt đã đóng.")
        self._fail_all_bridge_waiters("Trình duyệt Qt đã đóng.")
        try:
            if proc and proc.is_alive():
                proc.join(timeout=0.2)
        except Exception:
            pass
        if notify and hasattr(self.app, "on_browser_overlay_closed"):
            self.app.on_browser_overlay_closed()


class BrowserBridgeServer:
    def __init__(self, overlay: BrowserOverlay):
        self.overlay = overlay
        self.server = None
        self.thread = None
        self.token = ""
        self.endpoint = ""

    def is_running(self) -> bool:
        return bool(self.server and self.thread and self.thread.is_alive())

    def start(self) -> str:
        if self.is_running():
            return self.endpoint
        self.token = secrets.token_hex(24)
        overlay = self.overlay
        token = self.token

        class _Handler(BaseHTTPRequestHandler):
            server_version = "RCBrowserBridge/1.0"

            def log_message(self, fmt, *args):
                return

            def _write_json(self, status: int, payload: dict):
                try:
                    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
                    self.send_response(status)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                except (BrokenPipeError, ConnectionResetError, OSError):
                    self.close_connection = True

            def do_GET(self):
                if self.path.rstrip("/") == "/health":
                    self._write_json(
                        200,
                        {
                            "ok": True,
                            "running": overlay.is_running(),
                            "visible": overlay.is_visible(),
                        },
                    )
                    return
                self._write_json(404, {"ok": False, "error": "Not found"})

            def do_POST(self):
                if self.path.rstrip("/") != "/rpc":
                    self._write_json(404, {"ok": False, "error": "Not found"})
                    return
                try:
                    length = int(self.headers.get("Content-Length") or "0")
                except Exception:
                    length = 0
                raw = self.rfile.read(max(0, length)) if length > 0 else b"{}"
                try:
                    payload = json.loads(raw.decode("utf-8") or "{}")
                    if not isinstance(payload, dict):
                        raise ValueError("Payload phải là object.")
                except Exception as exc:
                    self._write_json(400, {"ok": False, "error": f"JSON không hợp lệ: {exc}"})
                    return
                auth = str(self.headers.get("X-RC-Bridge-Token") or payload.get("token") or "").strip()
                if auth != token:
                    self._write_json(403, {"ok": False, "error": "Sai token bridge."})
                    return
                op = str(payload.get("op") or "").strip().upper()
                if not op:
                    self._write_json(400, {"ok": False, "error": "Thiếu op."})
                    return
                try:
                    timeout_sec = float(payload.get("timeout_sec") or 30.0)
                except Exception:
                    timeout_sec = 30.0
                open_if_needed = bool(payload.get("open_if_needed", True))
                try:
                    result = overlay.bridge_call(
                        op,
                        payload,
                        timeout_sec=max(2.0, timeout_sec),
                        open_if_needed=open_if_needed,
                    )
                    self._write_json(200, result if isinstance(result, dict) else {"ok": True, "data": result})
                except Exception as exc:
                    self._write_json(200, {"ok": False, "error": str(exc)})

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
        self.server.daemon_threads = True
        host, port = self.server.server_address[:2]
        self.endpoint = f"http://{host}:{port}/rpc"
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        return self.endpoint

    def stop(self):
        server = self.server
        thread = self.thread
        self.server = None
        self.thread = None
        self.endpoint = ""
        self.token = ""
        if server:
            try:
                server.shutdown()
            except Exception:
                pass
            try:
                server.server_close()
            except Exception:
                pass
        if thread:
            try:
                thread.join(timeout=1.0)
            except Exception:
                pass
