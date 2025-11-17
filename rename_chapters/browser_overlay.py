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

    def available(self):
        return _QT_AVAILABLE

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
        self.proc = multiprocessing.Process(
            target=_run_qt_browser,
            args=(self.current_url, child_conn, child_events),
            daemon=True
        )
        self.proc.start()
        self._start_listener_thread()
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

    def _start_listener_thread(self):
        if not self.event_conn:
            return

        def _listen():
            try:
                while self.event_conn:
                    if self.event_conn.poll(0.2):
                        event = self.event_conn.recv()
                        self.event_queue.put(event)
            except EOFError:
                pass

        self.listener_thread = threading.Thread(target=_listen, daemon=True)
        self.listener_thread.start()
        self._poll_events()

    def _poll_events(self):
        while not self.event_queue.empty():
            event = self.event_queue.get()
            if event[0] == "URL_CHANGED":
                self.current_url = event[1]
            elif event[0] == "WINDOW_CLOSED":
                self.hide()
        if self.proc:
            self.app.after(200, self._poll_events)
