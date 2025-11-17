"""Qt-based browser window launched từ UI Tk, hỗ trợ multi-tab + cookie."""

import json
import os
import sys
from datetime import datetime
from typing import Callable, List, Optional

from PyQt6.QtCore import Qt, QTimer, QUrl
from PyQt6.QtWidgets import (
    QApplication,
    QDialog,
    QDialogButtonBox,
    QHBoxLayout,
    QLabel,
    QListWidget,
    QListWidgetItem,
    QLineEdit,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QMenu,
    QProgressBar,
    QStackedWidget,
    QTabBar,
    QTabWidget,
    QVBoxLayout,
    QWidget,
)
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEngineProfile, QWebEnginePage, QWebEngineSettings



from app.paths import BASE_DIR

DEFAULT_HOME = "https://www.google.com/"
PROFILE_DIR = os.path.join(BASE_DIR, "qt_browser_profile")
HISTORY_FILE = os.path.join(PROFILE_DIR, "history.json")
MAX_HISTORY = 500


def build_persistent_profile(parent=None) -> QWebEngineProfile:
    profile = QWebEngineProfile("RenameBrowser", parent)
    profile.setPersistentCookiesPolicy(QWebEngineProfile.PersistentCookiesPolicy.ForcePersistentCookies)
    profile.setCachePath(os.path.join(PROFILE_DIR, "cache"))
    profile.setPersistentStoragePath(os.path.join(PROFILE_DIR, "storage"))
    return profile


class BrowserView(QWebEngineView):
    def __init__(self, profile: QWebEngineProfile, window: "_BrowserWindow"):
        super().__init__(window)
        self.window = window
        self.setPage(QWebEnginePage(profile, self))
        self._devtools_view = None
        self._devtools_page = None
        self._inspect_hooked = False
        self._enable_devtools_setting()
        self._hook_inspect_action()

    def createWindow(self, _type):
        return self.window._create_tab(switch=True, auto_close=True)

    def keyPressEvent(self, event):
        if event.key() == Qt.Key.Key_F12:
            self._toggle_devtools()
            return
        super().keyPressEvent(event)

    def _enable_devtools_setting(self):
        settings = self.page().settings()
        attr = getattr(QWebEngineSettings.WebAttribute, "DeveloperExtrasEnabled", None)
        if attr is not None:
            try:
                settings.setAttribute(attr, True)
            except Exception:
                pass

    def _ensure_devtools_ready(self):
        if self._devtools_view and self._devtools_page:
            return True
        try:
            dev_view = QWebEngineView()
            dev_page = QWebEnginePage(self.page().profile(), dev_view)
            dev_view.setPage(dev_page)
            dev_view.setWindowTitle("DevTools")
            dev_view.resize(960, 720)
            dev_view.setAttribute(Qt.WidgetAttribute.WA_DeleteOnClose, True)
            dev_view.hide()
            dev_view.destroyed.connect(self._reset_devtools)
            self.page().setDevToolsPage(dev_page)
            self._devtools_view = dev_view
            self._devtools_page = dev_page
            return True
        except Exception:
            self._devtools_view = None
            self._devtools_page = None
            return False

    def _hook_inspect_action(self):
        if self._inspect_hooked:
            return
        action = self.pageAction(QWebEnginePage.WebAction.InspectElement)
        if action:
            try:
                action.triggered.connect(lambda _checked=False: self._show_devtools())
                self._inspect_hooked = True
            except Exception:
                pass

    def _reset_devtools(self):
        self._devtools_view = None
        self._devtools_page = None
        try:
            self.page().setDevToolsPage(None)
        except Exception:
            pass

    def _show_devtools(self):
        if not self._ensure_devtools_ready():
            return
        if self._devtools_view:
            if not self._devtools_view.isVisible():
                self._devtools_view.show()
            self._devtools_view.raise_()
            self._devtools_view.activateWindow()

    def _toggle_devtools(self):
        if not self._ensure_devtools_ready():
            return
        if self._devtools_view.isVisible():
            self._devtools_view.hide()
        else:
            self._show_devtools()

class HistoryDialog(QDialog):
    def __init__(
        self,
        entries: List[dict],
        on_open: Callable[[str], None],
        on_clear_all: Callable[[], None],
        on_delete_entry: Callable[[dict], None],
        parent=None
    ):
        super().__init__(parent)
        self.setWindowTitle("Lịch sử phiên hiện tại")
        self.resize(480, 360)
        self._on_open = on_open
        self._on_clear_all = on_clear_all
        self._on_delete_entry = on_delete_entry
        layout = QVBoxLayout(self)

        self.list_widget = QListWidget()
        layout.addWidget(self.list_widget, 1)
        self.list_widget.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.list_widget.customContextMenuRequested.connect(self._show_context_menu)

        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Close)
        self.clear_button = buttons.addButton("Xóa tất cả", QDialogButtonBox.ButtonRole.ActionRole)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

        for entry in entries:
            title = entry.get("title") or entry.get("url")
            timestamp = entry.get("time", "")
            text = f"[{timestamp}] {title}"
            list_item = QListWidgetItem(text)
            list_item.setData(Qt.ItemDataRole.UserRole, entry)
            self.list_widget.addItem(list_item)

        self.list_widget.itemDoubleClicked.connect(self._navigate)
        self.clear_button.clicked.connect(self._handle_clear)

    def _navigate(self, item: QListWidgetItem):
        entry = item.data(Qt.ItemDataRole.UserRole) or {}
        url = entry.get("url")
        if url and self._on_open:
            self._on_open(url)
        self.accept()

    def _handle_clear(self):
        if QMessageBox.question(self, "Xóa lịch sử", "Bạn có chắc muốn xóa toàn bộ lịch sử duyệt web?") == QMessageBox.StandardButton.Yes:
            if self._on_clear_all:
                self._on_clear_all()
            self.list_widget.clear()

    def _show_context_menu(self, position):
        item = self.list_widget.itemAt(position)
        if not item:
            return
        menu = QMenu(self)
        delete_action = menu.addAction("Xóa mục này")
        action = menu.exec(self.list_widget.mapToGlobal(position))
        if action == delete_action:
            entry = item.data(Qt.ItemDataRole.UserRole)
            if self._on_delete_entry and entry:
                self._on_delete_entry(entry)
            row = self.list_widget.row(item)
            self.list_widget.takeItem(row)


class _BrowserWindow(QMainWindow):
    def __init__(self, initial_url: Optional[str], cmd_conn, event_conn):
        super().__init__()
        self.setWindowTitle("Rename Chapters - Browser")
        self.resize(1320, 900)
        self.cmd_conn = cmd_conn
        self.event_conn = event_conn
        self._closing = False
        self._plus_tab = None
        self._view_progress = {}

        os.makedirs(PROFILE_DIR, exist_ok=True)
        self.profile = build_persistent_profile(self)
        self.history_entries = self._load_history_file()

        self._build_ui()
        self._bind_events()

        start_url = initial_url or DEFAULT_HOME
        self._create_tab(start_url=start_url)
        self._ensure_plus_tab()
        self._update_empty_state()

        self.timer = QTimer(self)
        self.timer.timeout.connect(self._poll_commands)
        self.timer.start(120)

    # --- UI helpers -------------------------------------------------------------
    def _build_ui(self):
        central = QWidget()
        main_layout = QVBoxLayout(central)
        main_layout.setContentsMargins(8, 8, 8, 8)

        toolbar = QHBoxLayout()
        self.address_bar = QLineEdit()
        self.address_bar.setPlaceholderText("https://")
        self.address_bar.returnPressed.connect(self._handle_navigate)

        btn_home = QPushButton("Home")
        btn_back = QPushButton("◀")
        btn_forward = QPushButton("▶")
        btn_reload = QPushButton("↻")
        btn_go = QPushButton("Go")
        btn_translate = QPushButton("Dịch")
        btn_devtools = QPushButton("F12")
        btn_settings = QPushButton("⚙")
        btn_settings.clicked.connect(self._open_settings_menu)
        self._tab_control_buttons = [btn_home, btn_back, btn_forward, btn_reload, btn_translate, btn_devtools]

        btn_home.clicked.connect(lambda: self._navigate(DEFAULT_HOME))
        btn_back.clicked.connect(lambda: self._current_view_action("back"))
        btn_forward.clicked.connect(lambda: self._current_view_action("forward"))
        btn_reload.clicked.connect(lambda: self._current_view_action("reload"))
        btn_go.clicked.connect(self._handle_navigate)
        btn_translate.clicked.connect(self._translate_current_page)
        btn_devtools.clicked.connect(self._open_devtools)
        toolbar.addWidget(QLabel("URL:"))
        toolbar.addWidget(self.address_bar, stretch=1)
        for btn in (btn_home, btn_back, btn_forward, btn_reload, btn_go,
                    btn_translate, btn_devtools, btn_settings):
            toolbar.addWidget(btn)

        toolbar_widget = QWidget()
        toolbar_widget.setLayout(toolbar)
        main_layout.addWidget(toolbar_widget)

        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setTextVisible(False)
        self.progress_bar.setFixedHeight(4)
        self.progress_bar.hide()
        main_layout.addWidget(self.progress_bar)

        self.content_stack = QStackedWidget()
        self.tabs = QTabWidget()
        self.tabs.setTabsClosable(True)
        self.tabs.tabCloseRequested.connect(self._close_tab_index)
        self.tabs.currentChanged.connect(self._on_tab_changed)
        self.tabs.tabBar().tabBarClicked.connect(self._on_tab_bar_clicked)
        self.empty_label = QLabel("Không có tab nào đang mở")
        self.empty_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.empty_label.setStyleSheet("font-size: 18px; color: #666;")
        self.content_stack.addWidget(self.tabs)
        self.content_stack.addWidget(self.empty_label)
        main_layout.addWidget(self.content_stack, stretch=1)

        self.setCentralWidget(central)

    def _bind_events(self):
        pass

    def _ensure_plus_tab(self):
        if self._plus_tab is not None:
            return
        self._plus_tab = QWidget()
        idx = self.tabs.addTab(self._plus_tab, "+")
        bar = self.tabs.tabBar()
        bar.setTabButton(idx, QTabBar.ButtonPosition.LeftSide, None)
        bar.setTabButton(idx, QTabBar.ButtonPosition.RightSide, None)

    # --- Tab management ---------------------------------------------------------
    def _create_tab(self, start_url: Optional[str] = None, switch: bool = True, auto_close=False):
        view = BrowserView(self.profile, self)
        view.urlChanged.connect(lambda url, v=view: self._handle_tab_url_change(v, url))
        view.titleChanged.connect(lambda title, v=view: self._update_tab_title(v, title))
        view.loadProgress.connect(lambda value, v=view: self._handle_view_progress(v, value))
        if auto_close:
            view.page().windowCloseRequested.connect(lambda v=view: self._close_view(v))

        if self._plus_tab and self.tabs.indexOf(self._plus_tab) != -1:
            insert_index = max(0, self.tabs.indexOf(self._plus_tab))
        else:
            insert_index = self.tabs.count()
        idx = self.tabs.insertTab(insert_index, view, "Tab mới")
        if switch or start_url:
            self.tabs.setCurrentIndex(idx)
        if start_url:
            self._navigate(start_url, view=view)
        self._view_progress[view] = 0
        if view is self._current_view():
            self._apply_progress_value(0)
        self._update_empty_state()
        return view

    def _close_view(self, view: BrowserView):
        idx = self.tabs.indexOf(view)
        if idx != -1:
            self._close_tab_index(idx)

    def _close_tab_index(self, index: int):
        widget = self.tabs.widget(index)
        if widget is self._plus_tab:
            return
        was_current = self.tabs.currentIndex() == index
        if widget:
            widget.deleteLater()
        if isinstance(widget, BrowserView):
            self._view_progress.pop(widget, None)
        self.tabs.removeTab(index)
        real_indexes = self._real_tab_indexes()
        if was_current and real_indexes:
            target = None
            for idx in reversed(real_indexes):
                if idx < index:
                    target = idx
                    break
            if target is None:
                target = real_indexes[0]
            self.tabs.setCurrentIndex(target)
        self._update_empty_state()

    def _real_tab_indexes(self):
        plus_idx = self.tabs.indexOf(self._plus_tab) if self._plus_tab else -1
        return [i for i in range(self.tabs.count()) if i != plus_idx]

    def _on_tab_changed(self, index: int):
        if self._closing:
            return
        view = self.tabs.widget(index)
        plus_idx = self.tabs.indexOf(self._plus_tab) if self._plus_tab else -1
        if plus_idx != -1 and index == plus_idx:
            return
        if isinstance(view, BrowserView):
            self._update_address_bar(view.url())
            self._apply_progress_value(self._view_progress.get(view, 0))
        else:
            self.address_bar.clear()
            self._apply_progress_value(None)

    def _on_tab_bar_clicked(self, index: int):
        plus_idx = self.tabs.indexOf(self._plus_tab) if self._plus_tab else -1
        if plus_idx != -1 and index == plus_idx:
            self._create_tab(start_url=DEFAULT_HOME, switch=True)

    def _update_tab_title(self, view: BrowserView, title: str):
        idx = self.tabs.indexOf(view)
        if idx != -1:
            self.tabs.setTabText(idx, title or "Trang mới")

    def _handle_tab_url_change(self, view: BrowserView, qurl: QUrl):
        idx = self.tabs.indexOf(view)
        if idx != -1:
            self.tabs.setTabText(idx, view.title() or qurl.toString())
        if view is self.tabs.currentWidget():
            self._update_address_bar(qurl)
            self._emit_url_changed(qurl)
            self._record_history_entry(view.title(), qurl.toString())

    # --- Browser actions --------------------------------------------------------
    def _current_view(self) -> Optional[BrowserView]:
        widget = self.tabs.currentWidget()
        if widget is self._plus_tab:
            return None
        return widget if isinstance(widget, BrowserView) else None

    def _current_view_action(self, action: str):
        view = self._current_view()
        if not view:
            return
        if action == "back":
            view.back()
        elif action == "forward":
            view.forward()
        elif action == "reload":
            view.reload()

    def _open_devtools(self):
        view = self._current_view()
        if not view:
            return
        view._show_devtools()

    def _handle_navigate(self):
        url = self.address_bar.text().strip() or DEFAULT_HOME
        self._navigate(url)

    def _navigate(self, url: str, view: Optional[BrowserView] = None):
        view = view or self._current_view()
        if not view:
            view = self._create_tab(switch=True)
        view.setUrl(QUrl.fromUserInput(url))

    def _update_address_bar(self, qurl: QUrl):
        self.address_bar.blockSignals(True)
        self.address_bar.setText(qurl.toString())
        self.address_bar.blockSignals(False)

    def _emit_url_changed(self, qurl: QUrl):
        if self.event_conn:
            try:
                self.event_conn.send(("URL_CHANGED", qurl.toString()))
            except Exception:
                pass

    def _handle_view_progress(self, view: BrowserView, value: int):
        self._view_progress[view] = value
        if view is self._current_view():
            self._apply_progress_value(value)

    def _apply_progress_value(self, value: Optional[int]):
        if not hasattr(self, "progress_bar"):
            return
        if value is None or value <= 0 or value >= 100:
            self.progress_bar.hide()
            self.progress_bar.setValue(0)
        else:
            self.progress_bar.setValue(max(0, min(100, value)))
            self.progress_bar.show()

    def _translate_current_page(self):
        view = self._current_view()
        if not view:
            return
        injection = """
(function() {
    if (window.__rcTranslateActive) {
        return;
    }
    window.__rcTranslateActive = true;
    const existingBar = document.querySelector('.goog-te-banner-frame');
    if (existingBar) {
        return;
    }
    const initCallback = '__rcTranslateInit_' + Date.now();
    window[initCallback] = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'auto',
            includedLanguages: 'vi',
            autoDisplay: true,
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE
        }, '__rc_translate_container');
        if (typeof google.translate.TranslateElement !== 'undefined') {
            const select = document.querySelector('.goog-te-combo');
            if (select) {
                select.value = 'vi';
                select.dispatchEvent(new Event('change'));
            }
        }
    };
    if (!document.getElementById('__rc_translate_container')) {
        const holder = document.createElement('div');
        holder.id = '__rc_translate_container';
        holder.style.position = 'fixed';
        holder.style.zIndex = '2147483647';
        holder.style.top = '8px';
        holder.style.right = '8px';
        holder.style.background = 'rgba(15,23,42,0.9)';
        holder.style.padding = '8px 12px';
        holder.style.borderRadius = '6px';
        holder.style.boxShadow = '0 4px 12px rgba(0,0,0,0.35)';
        holder.style.color = '#fff';
        holder.style.fontFamily = 'sans-serif';
        holder.style.fontSize = '13px';
        holder.innerText = 'Đang dịch...';
        document.body.appendChild(holder);
    }
    const script = document.createElement('script');
    script.src = 'https://translate.googleapis.com/translate_a/element.js?cb=' + initCallback;
    script.onload = function() {
        const bar = document.querySelector('.goog-te-banner-frame');
        if (bar) bar.style.display = 'none';
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = 'vi';
            select.dispatchEvent(new Event('change'));
        }
    };
    var holder = document.getElementById('__rc_translate_container');
    script.onerror = function() {
        window.__rcTranslateActive = false;
        if (holder) {
            holder.innerText = 'Không tải được script Google Translate.';
        }
    };
    document.head.appendChild(script);
})();
"""
        view.page().runJavaScript(injection)

    def _show_history_dialog(self):
        if not self.history_entries:
            QMessageBox.information(self, "Lịch sử trống", "Hiện chưa có lịch sử nào được lưu.")
            return
        dlg = HistoryDialog(
            entries=list(reversed(self.history_entries)),
            on_open=lambda url: self._navigate(url),
            on_clear_all=self._clear_history,
            on_delete_entry=self._delete_history_entry
        )
        dlg.exec()

    def _clear_cache(self):
        if QMessageBox.question(self, "Xóa cache", "Xóa toàn bộ cache trình duyệt?") != QMessageBox.StandardButton.Yes:
            return
        profile = self.profile
        if profile:
            profile.clearHttpCache()
        cache_dir = os.path.join(PROFILE_DIR, "cache")
        if os.path.isdir(cache_dir):
            for root, dirs, files in os.walk(cache_dir, topdown=False):
                for file in files:
                    try:
                        os.remove(os.path.join(root, file))
                    except OSError:
                        pass
                for d in dirs:
                    try:
                        os.rmdir(os.path.join(root, d))
                    except OSError:
                        pass
        QMessageBox.information(self, "Hoàn tất", "Đã xóa cache.")

    # --- IPC --------------------------------------------------------------------
    def _poll_commands(self):
        if not self.cmd_conn:
            return
        try:
            while self.cmd_conn.poll():
                cmd, payload = self.cmd_conn.recv()
                if cmd == "EXIT":
                    self.close()
                    return
                elif cmd == "LOAD" and payload:
                    self.address_bar.setText(payload)
                    self._navigate(payload)
                elif cmd == "RELOAD":
                    self._current_view_action("reload")
                elif cmd == "BACK":
                    self._current_view_action("back")
                elif cmd == "FORWARD":
                    self._current_view_action("forward")
                elif cmd == "NEW_TAB":
                    self._create_tab(start_url=payload or DEFAULT_HOME)
        except EOFError:
            self.close()

    def closeEvent(self, event):
        self._closing = True
        # ensure tất cả web views bị dọn trước khi profile release để tránh cảnh báo
        while self.tabs.count():
            widget = self.tabs.widget(0)
            if widget:
                widget.deleteLater()
            self.tabs.removeTab(0)
        self._plus_tab = None
        self.profile.deleteLater()
        try:
            if self.event_conn:
                self.event_conn.send(("WINDOW_CLOSED", None))
        except Exception:
            pass
        return super().closeEvent(event)

    # --- History persistence ----------------------------------------------------
    def _load_history_file(self) -> List[dict]:
        if not os.path.exists(HISTORY_FILE):
            return []
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                return data[-MAX_HISTORY:]
        except Exception:
            pass
        return []

    def _save_history_file(self):
        try:
            with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump(self.history_entries[-MAX_HISTORY:], f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    def _record_history_entry(self, title: str, url: str):
        if not url:
            return
        entry = {
            "url": url,
            "title": title or url,
            "time": datetime.now().strftime("%Y-%m-%d %H:%M")
        }
        if self.history_entries and self.history_entries[-1]["url"] == url:
            self.history_entries[-1] = entry
        else:
            self.history_entries.append(entry)
            if len(self.history_entries) > MAX_HISTORY:
                self.history_entries = self.history_entries[-MAX_HISTORY:]
        self._save_history_file()

    def _clear_history(self):
        self.history_entries = []
        try:
            if os.path.exists(HISTORY_FILE):
                os.remove(HISTORY_FILE)
        except Exception:
            pass

    def _delete_history_entry(self, entry: dict):
        url = entry.get("url")
        time = entry.get("time")
        self.history_entries = [e for e in self.history_entries if not (e.get("url") == url and e.get("time") == time)]
        self._save_history_file()

    def _update_empty_state(self):
        has_tabs = bool(self._real_tab_indexes())
        if hasattr(self, "content_stack"):
            self.content_stack.setCurrentWidget(self.tabs if has_tabs else self.empty_label)
        for btn in getattr(self, "_tab_control_buttons", []):
            btn.setEnabled(has_tabs)
        if not has_tabs:
            self.address_bar.clear()
            self._apply_progress_value(None)

    def _open_settings_menu(self):
        menu = QMenu(self)
        menu.addAction("Lịch sử", self._show_history_dialog)
        menu.addSeparator()
        menu.addAction("Xóa cache", self._clear_cache)
        button = self.sender()
        if isinstance(button, QPushButton):
            menu.exec(button.mapToGlobal(button.rect().bottomLeft()))


def run_browser(initial_url: Optional[str], cmd_conn, event_conn):
    """Entry-point for the multiprocessing worker."""
    app = QApplication(sys.argv)
    window = _BrowserWindow(initial_url, cmd_conn, event_conn)
    window.show()
    app.exec()
