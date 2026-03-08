import multiprocessing
import queue
import re
import threading
import time

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
    """Điều khiển cửa sổ trình duyệt Qt thông qua Tk UI (không thay đổi giao diện chính)."""

    def __init__(self, app):
        self.app = app
        self.current_url = DEFAULT_URL
        self.proc = None
        self.cmd_conn = None
        self.event_conn = None
        self.event_queue = queue.Queue()
        self.listener_thread = None
        self.profile_dir = None
        self._event_conn_id = 0
        self._fetch_lock = threading.Lock()
        self._fetch_waiters = {}
        self._fetch_seq = 0

    def set_profile(self, path):
        self.profile_dir = path
        if self.proc:
            self.hide()

    def available(self):
        return _ensure_qt_runner() is not None

    def is_running(self):
        return bool(self.proc)

    def toggle(self):
        if self.proc:
            self.hide()
        else:
            self.show()

    def show(self):
        if self.proc:
            if hasattr(self.app, "log"):
                self.app.log("Trình duyệt Qt đang chạy, vui lòng thao tác trên cửa sổ đó.")
            return
        if not self.available():
            if hasattr(self.app, "log"):
                self.app.log(f"Không thể mở trình duyệt: thiếu PyQt5/PyQtWebEngine ({_QT_ERROR}).")
            return
        runner = _ensure_qt_runner()
        if runner is None:
            if hasattr(self.app, "log"):
                self.app.log(f"Không thể mở trình duyệt: thiếu PyQt5/PyQtWebEngine ({_QT_ERROR}).")
            return

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
        self.proc = multiprocessing.Process(
            target=runner,
            args=(self.current_url, child_conn, child_events, self.profile_dir, spy_targets),
            daemon=True
        )
        self.proc.start()
        self._start_listener_thread(conn_id)
        if hasattr(self.app, "on_browser_overlay_opened"):
            self.app.on_browser_overlay_opened()
        if hasattr(self.app, "log"):
            self.app.log("Đang mở cửa sổ trình duyệt Qt...")

    def hide(self):
        if not self.proc and not self.cmd_conn:
            return
        if self.cmd_conn:
            try:
                self.cmd_conn.send(("EXIT", None))
            except Exception:
                pass
        if self.proc:
            self.proc.join(timeout=2)
            if self.proc.is_alive():
                self.proc.terminate()
        self.proc = None
        self.cmd_conn = None
        self.event_conn = None
        self._event_conn_id += 1
        self._fail_all_fetch_waiters("Trình duyệt Qt đã đóng.")
        if hasattr(self.app, "on_browser_overlay_closed"):
            self.app.on_browser_overlay_closed()
        if hasattr(self.app, "log"):
            self.app.log("Đã đóng cửa sổ trình duyệt Qt.")

    def navigate(self, url: str):
        url = self._normalize_url(url)
        if url and self.cmd_conn:
            self.cmd_conn.send(("LOAD", url))

    def reload(self):
        if self.cmd_conn:
            self.cmd_conn.send(("RELOAD", None))

    def back(self):
        if self.cmd_conn:
            self.cmd_conn.send(("BACK", None))

    def forward(self):
        if self.cmd_conn:
            self.cmd_conn.send(("FORWARD", None))

    def fetch_html(self, url: str, timeout_sec: float = 30.0, open_if_needed: bool = False) -> str:
        raw_url = (url or "").strip()
        if not raw_url:
            raise ValueError("URL rỗng.")
        target = self._normalize_url(raw_url)
        if not self.available():
            raise RuntimeError("Trình duyệt Qt chưa sẵn sàng.")
        if not self.is_running():
            if open_if_needed:
                self.current_url = target
                self.show()
            else:
                raise RuntimeError("Trình duyệt Qt chưa chạy.")
        if not self.cmd_conn:
            raise RuntimeError("Không thể kết nối tiến trình trình duyệt Qt.")

        req_id = self._next_fetch_id()
        waiter = queue.Queue(maxsize=1)
        with self._fetch_lock:
            self._fetch_waiters[req_id] = waiter
        payload = {
            "id": req_id,
            "url": target,
            "timeout_ms": max(2000, int(float(timeout_sec or 30.0) * 1000)),
        }
        try:
            self.cmd_conn.send(("FETCH_HTML", payload))
        except Exception as exc:
            with self._fetch_lock:
                self._fetch_waiters.pop(req_id, None)
            raise RuntimeError(f"Gửi lệnh FETCH_HTML thất bại: {exc}") from exc

        try:
            result = waiter.get(timeout=max(2.0, float(timeout_sec or 30.0) + 3.0))
        except queue.Empty as exc:
            with self._fetch_lock:
                self._fetch_waiters.pop(req_id, None)
            raise TimeoutError(f"Trình duyệt Qt fetch quá hạn ({timeout_sec}s).") from exc

        if not isinstance(result, dict):
            raise RuntimeError("FETCH_HTML trả dữ liệu không hợp lệ.")
        if not result.get("ok"):
            raise RuntimeError(str(result.get("error") or "FETCH_HTML thất bại."))
        return str(result.get("html") or "")

    def _normalize_url(self, url: str) -> str:
        url = (url or "").strip()
        if not url:
            return DEFAULT_URL
        if not re.match(r'^[a-zA-Z]+://', url):
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
                        self.event_queue.put((conn_id, event))
            except EOFError:
                self._fail_all_fetch_waiters("Pipe trình duyệt đã đóng.")
                pass
            except OSError:
                self._fail_all_fetch_waiters("Kết nối trình duyệt bị ngắt.")
                pass

        self.listener_thread = threading.Thread(target=_listen, daemon=True)
        self.listener_thread.start()
        self._poll_events()

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
            if event[0] == "URL_CHANGED":
                self.current_url = event[1]
            elif event[0] == "WINDOW_CLOSED":
                self.hide()
            elif event[0] == "REQUEST_HEADERS":
                if hasattr(self.app, "_on_browser_headers"):
                    try:
                        self.app._on_browser_headers(event[1])
                    except Exception:
                        pass
            elif event[0] == "USER_AGENT":
                if hasattr(self.app, "_on_browser_user_agent"):
                    try:
                        self.app._on_browser_user_agent(event[1])
                    except Exception:
                        pass
            elif event[0] == "REQUEST_COOKIES":
                if hasattr(self.app, "_on_browser_cookies"):
                    try:
                        self.app._on_browser_cookies(event[1])
                    except Exception:
                        pass
            elif event[0] == "PROFILE_SWITCH_REQUEST":
                # Handle profile switch request from browser
                try:
                    new_profile_name = event[1]
                    if hasattr(self.app, "_on_browser_profile_switched"):
                        # Notify main app to update its state/UI.
                        # Main app will update self.app.wd_profile_var, which calls _wd_on_profile_change,
                        # which calls self.set_profile -> hide().
                        # So we assume main app handles the logic.
                        self.app._on_browser_profile_switched(new_profile_name)
                    else:
                        # Fallback if no main app handler
                        self.hide()
                        if new_profile_name == "Profile 1":
                             self.profile_dir = None
                        else:
                             # We need base dir... assuming we can construct it or just rely on main app.
                             # If main app didn't handle it, we might be lost on path.
                             # But _on_browser_profile_switched should exist.
                             pass
                except Exception:
                    pass
            elif event[0] == "PROFILE_DELETE_REQUEST":
                try:
                    profile_name = event[1]
                    if hasattr(self.app, "_on_browser_profile_delete_request"):
                        self.app._on_browser_profile_delete_request(profile_name)
                except Exception:
                    pass
            elif event[0] == "PROFILE_RENAME_REQUEST":
                try:
                    payload = event[1]
                    if hasattr(self.app, "_on_browser_profile_rename_request"):
                        self.app._on_browser_profile_rename_request(payload)
                except Exception:
                    pass
            elif event[0] == "PROFILE_RESTORE_REQUEST":
                try:
                    profile_name = event[1]
                    if hasattr(self.app, "_on_browser_profile_restore_request"):
                        self.app._on_browser_profile_restore_request(profile_name)
                except Exception:
                    pass
        if self.proc:
            self.app.after(200, self._poll_events)

    def _next_fetch_id(self) -> str:
        with self._fetch_lock:
            self._fetch_seq += 1
            return f"fetch-{int(time.time() * 1000)}-{self._fetch_seq}"

    def _resolve_fetch_waiter(self, payload: dict):
        req_id = str((payload or {}).get("id") or "").strip()
        if not req_id:
            return
        waiter = None
        with self._fetch_lock:
            waiter = self._fetch_waiters.pop(req_id, None)
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
