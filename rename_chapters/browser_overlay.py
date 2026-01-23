import multiprocessing
import queue
import re
import threading

try:
    from app.ui.qt_browser import run_browser as _run_qt_browser
    _QT_AVAILABLE = True
except Exception as _exc:  # pragma: no cover - defensive
    _run_qt_browser = None
    _QT_AVAILABLE = False
    _QT_ERROR = _exc
else:
    _QT_ERROR = None

DEFAULT_URL = "https://www.google.com/"


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

    def set_profile(self, path):
        self.profile_dir = path
        if self.proc:
            self.hide()

    def available(self):
        return _QT_AVAILABLE

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

        parent_conn, child_conn = multiprocessing.Pipe()
        parent_events, child_events = multiprocessing.Pipe()
        self.cmd_conn = parent_conn
        self.event_conn = parent_events
        self._event_conn_id += 1
        conn_id = self._event_conn_id
        self.proc = multiprocessing.Process(
            target=_run_qt_browser,
            args=(self.current_url, child_conn, child_events, self.profile_dir),
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
                        self.event_queue.put((conn_id, event))
            except EOFError:
                pass
            except OSError:
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
