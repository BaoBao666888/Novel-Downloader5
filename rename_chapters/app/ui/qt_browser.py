"""Qt-based browser window launched từ UI Tk, hỗ trợ multi-tab + cookie."""

import json
import os
import re
import shutil
import sys
import time
import urllib.parse
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Callable, List, Optional
from app.core.utils_data import transform_str, revert_str
import requests
from PyQt6.QtCore import Qt, QTimer, QUrl, QStringListModel
from PyQt6.QtGui import QDesktopServices, QIcon
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
    QFileDialog,
    QCompleter,
    QCheckBox,
    QInputDialog,
    QMenu,
    QProgressBar,
    QStackedWidget,
    QTabBar,
    QTabWidget,
    QVBoxLayout,
    QWidget,
)
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import (
    QWebEngineProfile,
    QWebEnginePage,
    QWebEngineSettings,
    QWebEngineDownloadRequest,
    QWebEngineUrlRequestInterceptor,
    QWebEngineCookieStore,
    QWebEngineScript,
)

from app.paths import BASE_DIR
from app.ui.constants import CONFIG_PATH
from app.userscripts import UserscriptHost

DEFAULT_HOME = "https://www.google.com/"
PROFILE_DIR = os.path.join(BASE_DIR, "qt_browser_profile")
HISTORY_FILE = os.path.join(PROFILE_DIR, "history.json")
MAX_HISTORY = 500
DOWNLOAD_SETTINGS_FILE = os.path.join(PROFILE_DIR, "downloads.json")
DOWNLOAD_RECORDS_FILE = os.path.join(PROFILE_DIR, "download_records.json")
USERSCRIPT_REGISTRY_FILE = os.path.join(PROFILE_DIR, "userscripts_registry.json")
USERSCRIPT_DIR = os.path.join(PROFILE_DIR, "userscripts")
SCHEME_RE = re.compile(r'^[a-zA-Z][a-zA-Z0-9+\-.]*://')
DOMAIN_LIKE_RE = re.compile(r'^[\w.-]+\.[a-zA-Z]{2,}(:\d+)?(/.*)?$')
PROFILE_NAME_CLEAN_RE = re.compile(r"[^a-zA-Z0-9 _-]")
PROFILE_RESTORE_KEY = "profile_recycle"
PASSWORDS_FILE = os.path.join(PROFILE_DIR, "passwords.json")

def set_profile_dir(path: str):
    global PROFILE_DIR, HISTORY_FILE, DOWNLOAD_SETTINGS_FILE, DOWNLOAD_RECORDS_FILE, USERSCRIPT_REGISTRY_FILE, USERSCRIPT_DIR, PASSWORDS_FILE
    PROFILE_DIR = path
    HISTORY_FILE = os.path.join(PROFILE_DIR, "history.json")
    DOWNLOAD_SETTINGS_FILE = os.path.join(PROFILE_DIR, "downloads.json")
    DOWNLOAD_RECORDS_FILE = os.path.join(PROFILE_DIR, "download_records.json")
    USERSCRIPT_REGISTRY_FILE = os.path.join(PROFILE_DIR, "userscripts_registry.json")
    USERSCRIPT_DIR = os.path.join(PROFILE_DIR, "userscripts")
    PASSWORDS_FILE = os.path.join(PROFILE_DIR, "passwords.json")


def _find_app_icon() -> Optional[str]:
    candidates = [
        os.path.join(BASE_DIR, "icon.ico"),
        os.path.join(BASE_DIR, "icons", "icon.ico"),
        os.path.join(BASE_DIR, "icon.png"),
        os.path.join(BASE_DIR, "icons", "icon.png"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            return path
    return None


def build_persistent_profile(parent=None) -> QWebEngineProfile:
    profile = QWebEngineProfile("RenameBrowser", parent)
    profile.setPersistentCookiesPolicy(QWebEngineProfile.PersistentCookiesPolicy.ForcePersistentCookies)
    profile.setCachePath(os.path.join(PROFILE_DIR, "cache"))
    profile.setPersistentStoragePath(os.path.join(PROFILE_DIR, "storage"))
    return profile


def _sanitize_profile_name(name: str) -> str:
    clean = PROFILE_NAME_CLEAN_RE.sub("", (name or "").strip())
    return clean.strip()


def _load_profile_recycle() -> dict:
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, "r", encoding="utf-8") as cfg:
                data = json.load(cfg)
            recycle = data.get(PROFILE_RESTORE_KEY, {})
            return recycle if isinstance(recycle, dict) else {}
    except Exception:
        pass
    return {}


def _default_download_directory() -> str:
    home = os.path.expanduser("~")
    if not home or home == "~":
        home = BASE_DIR
    return os.path.join(home, "Downloads", "RenameBrowser")


class BrowserView(QWebEngineView):
    def __init__(self, profile: QWebEngineProfile, window: "_BrowserWindow"):
        super().__init__(window)
        self.window = window
        self.setPage(BrowserPage(profile, self))
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


class DownloadManagerDialog(QDialog):
    def __init__(
        self,
        on_open_dir: Callable[[], None],
        on_change_dir: Callable[[], None],
        on_toggle_ask: Callable[[bool], None],
        on_toggle_permission: Callable[[bool], None],
        on_open_file: Callable[[int], None],
        on_copy_source: Callable[[int], None],
        on_cancel: Callable[[int], None],
        on_retry: Callable[[int], None],
        on_remove: Callable[[int], None],
        parent=None
    ):
        super().__init__(parent)
        self.setWindowTitle("Tải xuống")
        self.resize(620, 520)
        self._on_open_dir = on_open_dir
        self._on_change_dir = on_change_dir
        self._on_toggle_ask = on_toggle_ask
        self._on_toggle_permission = on_toggle_permission
        self._on_open_file = on_open_file
        self._on_copy_source = on_copy_source
        self._on_cancel = on_cancel
        self._on_retry = on_retry
        self._on_remove = on_remove
        layout = QVBoxLayout(self)
        layout.setSpacing(10)
        layout.setContentsMargins(12, 12, 12, 12)

        self.path_label = QLabel()
        self.path_label.setWordWrap(True)
        layout.addWidget(self.path_label)

        self.list_widget = QListWidget()
        self.list_widget.setSpacing(8)
        layout.addWidget(self.list_widget, 1)

        btn_row = QHBoxLayout()
        btn_open = QPushButton("Mở thư mục")
        btn_change = QPushButton("Đổi thư mục...")
        btn_row.addWidget(btn_open)
        btn_row.addWidget(btn_change)
        btn_row.addStretch(1)
        layout.addLayout(btn_row)

        btn_open.clicked.connect(self._on_open_dir)
        btn_change.clicked.connect(self._on_change_dir)

        self.ask_checkbox = QCheckBox("Hỏi thư mục mỗi lần tải xuống")
        self.permission_checkbox = QCheckBox("Luôn hỏi xác nhận quyền truy cập")
        layout.addWidget(self.ask_checkbox)
        layout.addWidget(self.permission_checkbox)
        self.ask_checkbox.toggled.connect(self._on_toggle_ask)
        self.permission_checkbox.toggled.connect(self._on_toggle_permission)

        close_buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Close)
        close_buttons.rejected.connect(self.reject)
        layout.addWidget(close_buttons)

    def update_records(self, records: List[dict], directory: str):
        if directory:
            self.path_label.setText(f"Thư mục tải xuống: {directory}")
        else:
            self.path_label.setText("Chưa cấu hình thư mục tải xuống.")
        self.list_widget.clear()
        # Hiển thị mới nhất trước
        for record in reversed(records):
            item = QListWidgetItem()
            item_widget = self._build_record_widget(record, directory)
            item.setSizeHint(item_widget.sizeHint())
            self.list_widget.addItem(item)
            self.list_widget.setItemWidget(item, item_widget)

    def _build_record_widget(self, record: dict, directory: str):
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(10, 8, 10, 8)
        layout.setSpacing(6)

        name = record.get("filename") or record.get("url") or "Tập tin"
        state = record.get("state", "pending")
        received = record.get("received") or 0
        total = record.get("total") or 0
        progress_bar = QProgressBar()
        progress_bar.setTextVisible(True)
        if total > 0:
            progress_bar.setMaximum(total)
            progress_bar.setValue(received)
        elif state == "finished":
            progress_bar.setMaximum(1)
            progress_bar.setValue(1)
        else:
            progress_bar.setMaximum(0)  # indeterminate
            progress_bar.setValue(0)

        top_row = QHBoxLayout()
        lbl_name = QLabel(f"<b>{name}</b>")
        lbl_name.setTextFormat(Qt.TextFormat.RichText)
        lbl_state = QLabel(self._format_state(state))
        lbl_state.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        top_row.addWidget(lbl_name, 1)
        top_row.addWidget(lbl_state, 0)
        layout.addLayout(top_row)
        layout.addWidget(progress_bar)

        path = record.get("path") or ""
        if path:
            lbl_path = QLabel(f'<span style="color:#666;">{path}</span>')
            lbl_path.setTextFormat(Qt.TextFormat.RichText)
            lbl_path.setWordWrap(True)
            layout.addWidget(lbl_path)

        btn_row = QHBoxLayout()
        rid = record.get("id")
        btn_open_file = QPushButton("Mở file")
        btn_open_dir = QPushButton("Mở thư mục")
        btn_copy_url = QPushButton("Sao chép link")
        btn_row.addWidget(btn_open_file)
        btn_row.addWidget(btn_open_dir)
        btn_row.addWidget(btn_copy_url)

        if state in {"downloading", "requested"}:
            btn_cancel = QPushButton("Hủy")
            btn_cancel.clicked.connect(lambda _=False, rid=rid: self._on_cancel(rid))
            btn_row.addWidget(btn_cancel)
        elif state in {"interrupted", "cancelled"}:
            btn_retry = QPushButton("Tải lại")
            btn_retry.clicked.connect(lambda _=False, rid=rid: self._on_retry(rid))
            btn_row.addWidget(btn_retry)

        btn_row.addStretch(1)
        layout.addLayout(btn_row)

        btn_open_file.clicked.connect(lambda _=False, rid=rid: self._on_open_file(rid))
        btn_open_dir.clicked.connect(self._on_open_dir)
        btn_copy_url.clicked.connect(lambda _=False, rid=rid: self._on_copy_source(rid))

        close_btn = QPushButton("X")
        close_btn.setFixedWidth(28)
        close_btn.clicked.connect(lambda _=False, rid=rid: self._on_remove(rid))
        top_row.insertWidget(0, close_btn)

        widget.setStyleSheet("""
            QWidget {
                background: #f8f9fb;
                border: 1px solid #e1e5ea;
                border-radius: 8px;
            }
            QProgressBar {
                border: 1px solid #cdd4dc;
                border-radius: 4px;
                text-align: center;
                background: #eef2f6;
                height: 14px;
            }
            QProgressBar::chunk {
                background: #4a90e2;
                border-radius: 4px;
            }
        """)
        return widget

    def _format_state(self, state: str) -> str:
        mapping = {
            "requested": "Đang chờ",
            "downloading": "Đang tải",
            "finished": "Hoàn tất",
            "cancelled": "Đã hủy",
            "interrupted": "Lỗi",
        }
        return mapping.get(state, state)

    def sync_options(self, ask_each_time: bool, require_permission: bool):
        self._block_and_set(self.ask_checkbox, ask_each_time)
        self._block_and_set(self.permission_checkbox, require_permission)

    def _block_and_set(self, checkbox: QCheckBox, checked: bool):
        checkbox.blockSignals(True)
        checkbox.setChecked(checked)
        checkbox.blockSignals(False)


class UserscriptManagerDialog(QDialog):
    def __init__(
        self,
        on_import_local: Callable[[], None],
        on_download_url: Callable[[str], None],
        on_remove: Callable[[str], None],
        on_toggle: Callable[[str, bool], None],
        on_update: Callable[[str], None],
        on_open_folder: Callable[[], None],
        parent=None
    ):
        super().__init__(parent)
        self.setWindowTitle("Quản lý Userscript")
        self.resize(660, 360)
        self._on_import_local = on_import_local
        self._on_download_url = on_download_url
        self._on_remove = on_remove
        self._on_toggle = on_toggle
        self._on_update = on_update
        self._on_open_folder = on_open_folder
        self._block_item_signal = False

        layout = QVBoxLayout(self)
        self.list_widget = QListWidget()
        self.list_widget.setSelectionMode(QListWidget.SelectionMode.SingleSelection)
        self.list_widget.itemChanged.connect(self._handle_item_changed)
        layout.addWidget(self.list_widget, 1)

        self.info_label = QLabel("Chọn script để xem chi tiết.")
        self.info_label.setWordWrap(True)
        layout.addWidget(self.info_label)

        button_row = QHBoxLayout()
        btn_import = QPushButton("Import từ file...")
        btn_download = QPushButton("Tải từ URL...")
        btn_remove = QPushButton("Xoá script")
        btn_update = QPushButton("Cập nhật script")
        btn_open_dir = QPushButton("Mở thư mục script")
        button_row.addWidget(btn_import)
        button_row.addWidget(btn_download)
        button_row.addWidget(btn_remove)
        button_row.addWidget(btn_update)
        button_row.addWidget(btn_open_dir)
        layout.addLayout(button_row)

        btn_import.clicked.connect(self._on_import_local)
        btn_download.clicked.connect(self._prompt_download_url)
        btn_remove.clicked.connect(self._remove_selected)
        btn_update.clicked.connect(self._update_selected)
        btn_open_dir.clicked.connect(self._on_open_folder)

        close_buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Close)
        close_buttons.rejected.connect(self.reject)
        layout.addWidget(close_buttons)

    def update_scripts(self, scripts: List[dict]):
        self._block_item_signal = True
        self.list_widget.clear()
        for script in scripts:
            name = script.get("name") or os.path.basename(script.get("path") or "") or "Script"
            path = script.get("path") or ""
            enabled = bool(script.get("enabled", True))
            patterns = script.get("matches") or script.get("includes") or []
            error = script.get("last_error")
            text_lines = [name, path]
            if patterns:
                preview = ", ".join(patterns[:2])
                if len(patterns) > 2:
                    preview += ", ..."
                text_lines.append(f"URL: {preview}")
            if error:
                text_lines.append(f"⚠ {error}")
            item = QListWidgetItem("\n".join(text_lines))
            item.setFlags(item.flags() | Qt.ItemFlag.ItemIsUserCheckable | Qt.ItemFlag.ItemIsSelectable | Qt.ItemFlag.ItemIsEnabled)
            item.setCheckState(Qt.CheckState.Checked if enabled else Qt.CheckState.Unchecked)
            item.setData(Qt.ItemDataRole.UserRole, script.get("id"))
            self.list_widget.addItem(item)
        self._block_item_signal = False
        self.info_label.setText("Chọn script để xem chi tiết.")

    def _handle_item_changed(self, item: QListWidgetItem):
        if self._block_item_signal:
            return
        script_id = item.data(Qt.ItemDataRole.UserRole)
        if not script_id:
            return
        enabled = item.checkState() == Qt.CheckState.Checked
        self._on_toggle(script_id, enabled)

    def _prompt_download_url(self):
        url, ok = QInputDialog.getText(self, "Tải userscript", "Nhập URL script (.user.js):")
        if ok and url.strip():
            self._on_download_url(url.strip())

    def _selected_script_id(self) -> Optional[str]:
        item = self.list_widget.currentItem()
        if not item:
            return None
        return item.data(Qt.ItemDataRole.UserRole)

    def _remove_selected(self):
        script_id = self._selected_script_id()
        if not script_id:
            QMessageBox.information(self, "Chọn script", "Vui lòng chọn script cần xoá.")
            return
        if QMessageBox.question(self, "Xác nhận", "Bạn có chắc muốn xoá script này?") == QMessageBox.StandardButton.Yes:
            self._on_remove(script_id)

    def _update_selected(self):
        script_id = self._selected_script_id()
        if not script_id:
            QMessageBox.information(self, "Chọn script", "Vui lòng chọn script cần cập nhật.")
            return
        self._on_update(script_id)


class _HeaderSpy(QWebEngineUrlRequestInterceptor):
    def __init__(self, event_conn, targets=None, cookie_store: Optional[QWebEngineCookieStore] = None):
        super().__init__()
        self.event_conn = event_conn
        self.targets = set(targets or [])
        self.cookie_store = cookie_store

    def interceptRequest(self, info):
        try:
            host = info.requestUrl().host()
            if self.targets and host not in self.targets:
                return
            headers = {}
            for name in info.rawHeaderList():
                key = bytes(name).decode("latin1", errors="ignore").strip()
                if not key:
                    continue
                val = bytes(info.rawHeader(name)).decode("latin1", errors="ignore").strip()
                headers[key] = val
            if headers and self.event_conn:
                try:
                    self.event_conn.send(("REQUEST_HEADERS", {"host": host, "headers": headers}))
                except Exception:
                    pass
            # lấy cookie hiện tại gửi về
            if self.cookie_store and host and self.event_conn:
                try:
                    def _dump_cookies(cookies):
                        serialized = []
                        for c in cookies:
                            try:
                                serialized.append({
                                    "name": bytes(c.name()).decode("utf-8", errors="ignore"),
                                    "value": bytes(c.value()).decode("utf-8", errors="ignore"),
                                    "domain": c.domain(),
                                    "path": c.path(),
                                    "secure": c.isSecure(),
                                    "http_only": c.isHttpOnly(),
                                    "expires": c.expirationDate().toSecsSinceEpoch() if c.expirationDate().isValid() else None,
                                })
                            except Exception:
                                pass
                        try:
                            self.event_conn.send(("REQUEST_COOKIES", {"host": host, "cookies": serialized}))
                        except Exception:
                            pass
                    self.cookie_store.cookiesForUrl(info.requestUrl(), _dump_cookies)
                except Exception:
                    pass
        except Exception:
            pass

PASSWORD_DETECTOR_JS = r"""
(function() {
    function tryCapture(element) {
        try {
            var passInput = null;
            // 1. Look for password field in the same form
            if (element.form) {
                var passInputs = element.form.querySelectorAll("input[type='password']");
                if (passInputs.length > 0) passInput = passInputs[0];
            }
            // 2. If no form or not found, look near the element (siblings or parent's siblings)
            if (!passInput) {
                var wrapper = element.closest("div, form, fieldset, body");
                if (wrapper) {
                    var passInputs = wrapper.querySelectorAll("input[type='password']");
                    if (passInputs.length > 0) passInput = passInputs[0];
                }
            }
            // 3. Document wide search if active element is involved
            if (!passInput) {
                var all = document.querySelectorAll("input[type='password']");
                for(var i=0; i<all.length; i++) {
                    if (all[i].value) { passInput = all[i]; break; }
                }
            }

            if (passInput && passInput.value) {
                var userInput = null;
                // findUsernameField logic inline or reused? function defined below. 
                // Wait, findUsernameField is needed. I will keep it but remove logs.
                
                if (passInput.form) {
                     var inputs = passInput.form.querySelectorAll("input");
                     var passIdx = -1;
                     for (var i = 0; i < inputs.length; i++) {
                         if (inputs[i] === passInput) { passIdx = i; break; }
                     }
                     for (var i = passIdx - 1; i >= 0; i--) {
                         var t = inputs[i].type ? inputs[i].type.toLowerCase() : "";
                         if (t === "text" || t === "email" || t === "tel") { userInput=inputs[i]; break; }
                     }
                }
                
                if (!userInput) {
                    // Fallback
                    var all = document.querySelectorAll("input");
                    var passIdx = -1;
                    for (var i = 0; i < all.length; i++) {
                         if (all[i] === passInput) { passIdx = i; break; }
                    }
                    for (var i = passIdx - 1; i >= 0; i--) {
                         var t = all[i].type ? all[i].type.toLowerCase() : "";
                         if (t === "text" || t === "email" || t === "tel") { userInput=all[i]; break; }
                    }
                }

                var userVal = userInput ? userInput.value : "";
                
                if (passInput.value.length < 1) return;

                var data = {
                    url: window.location.href,
                    domain: window.location.hostname,
                    username: userVal,
                    password: passInput.value
                };
                console.log("PASSWORD_CAPTURE:" + JSON.stringify(data));
            }
        } catch(e) {}
    }

    document.addEventListener("submit", function(e) {
        tryCapture(e.target);
    }, true);

    document.addEventListener("click", function(e) {
        var t = e.target;
        if (t.tagName === "BUTTON" || (t.tagName === "INPUT" && (t.type === "submit" || t.type === "button"))) {
             setTimeout(function() { tryCapture(t); }, 100);
        }
    }, true);

    document.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
             setTimeout(function() { tryCapture(e.target); }, 100);
        }
    }, true);
})();
"""

from PyQt6.QtCore import pyqtSignal

class BrowserPage(QWebEnginePage):
    passwordCaptured = pyqtSignal(dict)

    def javaScriptConsoleMessage(self, level, message, lineNumber, sourceID):
        if message and message.startswith("PASSWORD_CAPTURE:"):
            try:
                json_str = message[len("PASSWORD_CAPTURE:"):]
                data = json.loads(json_str)
                self.passwordCaptured.emit(data)
            except Exception:
                pass
        super().javaScriptConsoleMessage(level, message, lineNumber, sourceID)


class PasswordManagerDialog(QDialog):
    def __init__(self, load_passwords_cb, delete_password_cb, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Quản lý Mật khẩu")
        self.resize(500, 400)
        self._load_passwords_cb = load_passwords_cb
        self._delete_password_cb = delete_password_cb
        
        layout = QVBoxLayout(self)
        
        # Search bar
        search_layout = QHBoxLayout()
        search_layout.addWidget(QLabel("Tìm kiếm:"))
        self.search_input = QLineEdit()
        self.search_input.textChanged.connect(self._refresh_list)
        search_layout.addWidget(self.search_input)
        layout.addLayout(search_layout)

        self.list_widget = QListWidget()
        layout.addWidget(self.list_widget)
        
        btn_layout = QHBoxLayout()
        self.btn_show = QPushButton("Hiện mật khẩu")
        self.btn_delete = QPushButton("Xóa mục chọn")
        self.btn_close = QPushButton("Đóng")
        btn_layout.addWidget(self.btn_show)
        btn_layout.addWidget(self.btn_delete)
        btn_layout.addStretch()
        btn_layout.addWidget(self.btn_close)
        layout.addLayout(btn_layout)
        
        self.btn_show.clicked.connect(self._show_password)
        self.btn_delete.clicked.connect(self._delete_selected)
        self.btn_close.clicked.connect(self.accept)
        
        self.password_data = {}  # {domain: [{user, pass, ...}]}
        self._load_data()

    def _load_data(self):
        if self._load_passwords_cb:
            self.password_data = self._load_passwords_cb()
        self._refresh_list()

    def _refresh_list(self):
        self.list_widget.clear()
        query = self.search_input.text().strip().lower()
        
        for domain, accounts in self.password_data.items():
            for acc in accounts:
                user = acc.get("username", "")
                if query:
                    if query not in domain.lower() and query not in user.lower():
                        continue
                
                item_text = f"{domain} | {user}"
                item = QListWidgetItem(item_text)
                item.setData(Qt.ItemDataRole.UserRole, (domain, acc))
                self.list_widget.addItem(item)

    def _show_password(self):
        item = self.list_widget.currentItem()
        if not item:
            return
        domain, acc = item.data(Qt.ItemDataRole.UserRole)
        password = acc.get("password", "")
        username = acc.get("username", "")
        
        # Display password in a read-only dialog for copying
        QInputDialog.getText(
            self, 
            "Xem mật khẩu", 
            f"Mật khẩu cho {domain} ({username}):", 
            QLineEdit.EchoMode.Normal, 
            password
        )

    def _delete_selected(self):
        item = self.list_widget.currentItem()
        if not item:
            return
        domain, acc = item.data(Qt.ItemDataRole.UserRole)
        username = acc.get("username")
        
        if QMessageBox.question(self, "Xác nhận", f"Xóa mật khẩu cho {domain} ({username})?") == QMessageBox.StandardButton.Yes:
            if self._delete_password_cb:
                self._delete_password_cb(domain, username)
            self._load_data()


class _BrowserWindow(QMainWindow):
    def __init__(self, initial_url: Optional[str], cmd_conn, event_conn):
        super().__init__()
        self.setWindowTitle("Rename Chapters - Browser")
        self.resize(1320, 900)
        try:
            icon_path = _find_app_icon()
            if icon_path:
                icon = QIcon(icon_path)
                self.setWindowIcon(icon)
                app = QApplication.instance()
                if app:
                    app.setWindowIcon(icon)
        except Exception:
            pass
        self.cmd_conn = cmd_conn
        self.event_conn = event_conn
        self._closing = False
        self._plus_tab = None
        self._view_progress = {}

        os.makedirs(PROFILE_DIR, exist_ok=True)
        self.profile = build_persistent_profile(self)
        self.history_entries = self._load_history_file()
        self.download_settings = self._load_download_settings()
        self.download_records: List[dict] = self._load_download_records()
        self._download_record_index: dict[int, int] = {rec["id"]: idx for idx, rec in enumerate(self.download_records) if "id" in rec}
        self._active_downloads: dict[int, QWebEngineDownloadRequest] = {}
        self._pending_retries: dict[str, dict] = {}
        self._download_dialog: Optional[DownloadManagerDialog] = None
        self._search_term_counter: Counter[str] = Counter()
        self.userscript_host: Optional[UserscriptHost] = None
        self._script_button: Optional[QPushButton] = None
        self._userscript_dialog: Optional[UserscriptManagerDialog] = None

        self.passwords = {} # {domain: [accounts]}
        self._load_passwords()
        
        # Inject Password Detector
        script = QWebEngineScript()
        script.setName("_password_detector")
        script.setSourceCode(PASSWORD_DETECTOR_JS)
        script.setInjectionPoint(QWebEngineScript.InjectionPoint.DocumentReady)
        script.setWorldId(QWebEngineScript.ScriptWorldId.MainWorld)
        self.profile.scripts().insert(script)

        # Gửi user-agent và headers thực tế về tiến trình cha để tái sử dụng cho requests
        try:
            targets = {"koanchay.org", "koanchay.net", "wikicv.net"}
            self._header_spy = _HeaderSpy(self.event_conn, targets=targets, cookie_store=self.profile.cookieStore())
            self.profile.setUrlRequestInterceptor(self._header_spy)
            if self.event_conn:
                self.event_conn.send(("USER_AGENT", self.profile.httpUserAgent()))
        except Exception:
            self._header_spy = None

        self._build_ui()
        self._refresh_address_suggestions()
        self._bind_events()
        self._init_userscript_host()
        self.profile.downloadRequested.connect(self._handle_download_request)

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
        self._address_suggestions_model = QStringListModel(self)
        self.address_completer = QCompleter(self._address_suggestions_model, self)
        self.address_completer.setCaseSensitivity(Qt.CaseSensitivity.CaseInsensitive)
        self.address_completer.setFilterMode(Qt.MatchFlag.MatchContains)
        self.address_completer.activated.connect(self._on_address_completer_activated)
        self.address_bar.setCompleter(self.address_completer)

        btn_home = QPushButton("Home")
        btn_back = QPushButton("◀")
        btn_forward = QPushButton("▶")
        btn_reload = QPushButton("↻")
        btn_go = QPushButton("Go")
        btn_translate = QPushButton("Dịch")
        btn_devtools = QPushButton("F12")
        btn_downloads = QPushButton("⬇")
        btn_scripts = QPushButton("Script")
        btn_settings = QPushButton("⚙")
        btn_profiles = QPushButton("👤")
        btn_settings.clicked.connect(self._open_settings_menu)
        btn_scripts.clicked.connect(self._show_userscript_menu)
        btn_downloads.clicked.connect(self._open_download_dialog)
        btn_profiles.clicked.connect(self._open_profile_menu)
        self._script_button = btn_scripts
        self._tab_control_buttons = [btn_home, btn_back, btn_forward, btn_reload, btn_translate, btn_devtools, btn_downloads, btn_scripts]

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
                    btn_translate, btn_devtools, btn_downloads, btn_scripts, btn_profiles, btn_settings):
            toolbar.addWidget(btn)

        toolbar_widget = QWidget()
        toolbar_widget.setLayout(toolbar)
        main_layout.addWidget(toolbar_widget)

        self.progress_wrapper = QWidget()
        self.progress_wrapper.setFixedHeight(6)
        progress_layout = QVBoxLayout(self.progress_wrapper)
        progress_layout.setContentsMargins(0, 0, 0, 0)
        progress_layout.setSpacing(0)
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setTextVisible(False)
        self.progress_bar.setFixedHeight(4)
        self.progress_bar.hide()
        progress_layout.addWidget(self.progress_bar)
        main_layout.addWidget(self.progress_wrapper)

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

    def _load_download_settings(self):
        defaults = {
            "directory": _default_download_directory(),
            "ask_each_time": False,
            "require_permission": True,
        }
        if not os.path.exists(DOWNLOAD_SETTINGS_FILE):
            return defaults
        try:
            with open(DOWNLOAD_SETTINGS_FILE, "r", encoding="utf-8") as handle:
                data = json.load(handle)
            if isinstance(data, dict):
                defaults.update({k: data.get(k, v) for k, v in defaults.items()})
                defaults.update({k: data[k] for k in data if k in defaults})
                return defaults
        except Exception:
            pass
        return defaults

    def _save_download_settings(self):
        os.makedirs(PROFILE_DIR, exist_ok=True)
        with open(DOWNLOAD_SETTINGS_FILE, "w", encoding="utf-8") as handle:
            json.dump(self.download_settings, handle, ensure_ascii=False, indent=2)

    def _load_download_records(self) -> List[dict]:
        if not os.path.exists(DOWNLOAD_RECORDS_FILE):
            return []
        try:
            with open(DOWNLOAD_RECORDS_FILE, "r", encoding="utf-8") as handle:
                data = json.load(handle)
            if isinstance(data, list):
                return data
        except Exception:
            pass
        return []

    def _save_download_records(self):
        os.makedirs(PROFILE_DIR, exist_ok=True)
        try:
            with open(DOWNLOAD_RECORDS_FILE, "w", encoding="utf-8") as handle:
                json.dump(self.download_records, handle, ensure_ascii=False, indent=2)
        except Exception:
            pass

    def _ensure_download_directory(self, directory: str):
        try:
            os.makedirs(directory, exist_ok=True)
        except OSError:
            pass

    def _unique_filename(self, directory: str, filename: str) -> str:
        base, ext = os.path.splitext(filename or "downloaded_file")
        if not base:
            base = "downloaded_file"
        directory = directory or ""
        existing_paths = set()
        for rec in self.download_records:
            path = rec.get("path")
            if not path:
                continue
            if directory and os.path.dirname(path) != directory:
                continue
            existing_paths.add(os.path.normcase(path))
        candidate = f"{base}{ext}"
        idx = 1
        while True:
            candidate_path = os.path.join(directory, candidate) if directory else candidate
            if os.path.normcase(candidate_path) not in existing_paths and (not directory or not os.path.exists(candidate_path)):
                return candidate
            candidate = f"{base} ({idx}){ext}"
            idx += 1

    def _choose_download_dir(self):
        current = self.download_settings.get("directory") or _default_download_directory()
        directory = QFileDialog.getExistingDirectory(self, "Chọn thư mục tải xuống", current)
        if not directory:
            return
        self.download_settings["directory"] = directory
        self._ensure_download_directory(directory)
        self._save_download_settings()
        self._update_download_dialog()

    def _open_download_dir(self):
        directory = self.download_settings.get("directory")
        if not directory:
            QMessageBox.warning(self, "Tải xuống", "Chưa cấu hình thư mục tải xuống.")
            return
        self._ensure_download_directory(directory)
        QDesktopServices.openUrl(QUrl.fromLocalFile(directory))

    def _set_download_ask_each_time(self, value: bool):
        self.download_settings["ask_each_time"] = bool(value)
        self._save_download_settings()

    def _set_download_require_permission(self, value: bool):
        self.download_settings["require_permission"] = bool(value)
        self._save_download_settings()

    def _handle_download_request(self, download: QWebEngineDownloadRequest):
        if not download:
            return
        suggested_name = download.downloadFileName() or os.path.basename(download.url().path()) or "downloaded_file"
        retry_record = self._pending_retries.pop(download.url().toString(), None)
        directory = self.download_settings.get("directory")
        if retry_record:
            directory = os.path.dirname(retry_record.get("path") or directory or _default_download_directory())
            suggested_name = retry_record.get("filename") or suggested_name
        if not directory or self.download_settings.get("ask_each_time"):
            directory = QFileDialog.getExistingDirectory(
                self,
                "Chọn nơi lưu tập tin",
                directory or _default_download_directory()
            )
            if not directory:
                download.cancel()
                return
            if not self.download_settings.get("ask_each_time"):
                self.download_settings["directory"] = directory
                self._save_download_settings()
        self._ensure_download_directory(directory)
        if self.download_settings.get("require_permission", True) and not retry_record:
            page_url = download.page().url().toString() if download.page() else ""
            message = (
                "Trang đang yêu cầu lưu tập tin:\n"
                f"- Tập tin: {suggested_name}\n"
                f"- Từ: {page_url or download.url().toString()}\n"
                f"- Thư mục: {directory}\n\n"
                "Bạn có cho phép không?"
            )
            if QMessageBox.question(self, "Xác nhận tải xuống", message) != QMessageBox.StandardButton.Yes:
                download.cancel()
                return
        if not retry_record and suggested_name:
            suggested_name = self._unique_filename(directory, suggested_name)
            download.setDownloadFileName(suggested_name)
        elif suggested_name:
            download.setDownloadFileName(suggested_name)
        download.setDownloadDirectory(directory)
        self._register_download(download, directory, reuse_record=retry_record)
        download.accept()

    def _register_download(self, download: QWebEngineDownloadRequest, directory: str, reuse_record: Optional[dict] = None):
        filename = download.downloadFileName() or os.path.basename(download.url().path()) or "downloaded_file"
        if reuse_record:
            old_id = reuse_record.get("id")
            reuse_record.update({
                "id": download.id(),
                "filename": filename,
                "url": download.url().toString(),
                "path": os.path.join(directory, filename),
                "state": "requested",
                "received": 0,
                "total": 0,
            })
            idx = self._download_record_index.pop(old_id, None)
            if idx is None:
                idx = 0
            self._download_record_index[reuse_record["id"]] = idx
        else:
            reuse_record = {
                "id": download.id(),
                "filename": filename,
                "url": download.url().toString(),
                "path": os.path.join(directory, filename),
                "state": "requested",
                "received": 0,
                "total": 0,
            }
            self._download_record_index[reuse_record["id"]] = len(self.download_records)
            self.download_records.append(reuse_record)

        self._active_downloads[reuse_record["id"]] = download

        download.receivedBytesChanged.connect(
            lambda _val=None, rid=reuse_record["id"], d=download: self._on_download_bytes_changed(d, rid)
        )
        download.totalBytesChanged.connect(
            lambda _val=None, rid=reuse_record["id"], d=download: self._on_download_bytes_changed(d, rid)
        )
        download.stateChanged.connect(
            lambda state, rid=reuse_record["id"]: self._on_download_state_changed(rid, state)
        )
        download.isFinishedChanged.connect(
            lambda *_, rid=reuse_record["id"], d=download: self._on_download_finished(rid) if d.isFinished() else None
        )
        self._on_download_bytes_changed(download, reuse_record["id"])
        self._save_download_records()
        self._update_download_dialog()

    def _get_download_record(self, record_id: int):
        idx = self._download_record_index.get(record_id)
        if idx is None or idx >= len(self.download_records):
            return None
        return self.download_records[idx]

    def _on_download_bytes_changed(self, download: QWebEngineDownloadRequest, record_id: int):
        self._on_download_progress(record_id, download.receivedBytes(), download.totalBytes())

    def _on_download_progress(self, record_id: int, received: int, total: int):
        record = self._get_download_record(record_id)
        if not record:
            return
        record["received"] = received
        record["total"] = total
        record["state"] = "downloading"
        self._save_download_records()
        self._update_download_dialog()

    def _on_download_state_changed(self, record_id: int, state):
        record = self._get_download_record(record_id)
        if not record:
            return
        state_map = {
            QWebEngineDownloadRequest.DownloadState.DownloadRequested: "requested",
            QWebEngineDownloadRequest.DownloadState.DownloadInProgress: "downloading",
            QWebEngineDownloadRequest.DownloadState.DownloadCompleted: "finished",
            QWebEngineDownloadRequest.DownloadState.DownloadCancelled: "cancelled",
            QWebEngineDownloadRequest.DownloadState.DownloadInterrupted: "interrupted",
        }
        record["state"] = state_map.get(state, str(state))
        if state in {
            QWebEngineDownloadRequest.DownloadState.DownloadCancelled,
            QWebEngineDownloadRequest.DownloadState.DownloadInterrupted,
            QWebEngineDownloadRequest.DownloadState.DownloadCompleted,
        }:
            self._active_downloads.pop(record_id, None)
        self._save_download_records()
        self._update_download_dialog()

    def _on_download_finished(self, record_id: int):
        record = self._get_download_record(record_id)
        if not record:
            return
        if record.get("state") not in {"cancelled", "interrupted"}:
            record["state"] = "finished"
        self._active_downloads.pop(record_id, None)
        self._save_download_records()
        self._update_download_dialog()

    def _open_download_dialog(self):
        if self._download_dialog is None:
            self._download_dialog = DownloadManagerDialog(
                on_open_dir=self._open_download_dir,
                on_change_dir=self._choose_download_dir,
                on_toggle_ask=self._set_download_ask_each_time,
                on_toggle_permission=self._set_download_require_permission,
                on_open_file=self._open_download_file,
                on_copy_source=self._on_copy_source,
                on_cancel=self._cancel_download,
                on_retry=self._retry_download,
                on_remove=self._remove_download_record,
                parent=self
            )
            self._download_dialog.finished.connect(self._on_download_dialog_closed)
        self._download_dialog.sync_options(
            self.download_settings.get("ask_each_time", False),
            self.download_settings.get("require_permission", True)
        )
        self._download_dialog.update_records(self.download_records, self.download_settings.get("directory"))
        self._download_dialog.show()
        self._download_dialog.raise_()
        self._download_dialog.activateWindow()

    def _update_download_dialog(self):
        if self._download_dialog:
            self._download_dialog.update_records(self.download_records, self.download_settings.get("directory"))

    def _on_download_dialog_closed(self, _result):
        self._download_dialog = None

    def _open_download_file(self, record_id: int):
        record = self._get_download_record(record_id)
        if not record:
            return
        path = record.get("path")
        if path and os.path.exists(path):
            QDesktopServices.openUrl(QUrl.fromLocalFile(path))

    def _open_download_source(self, record_id: int):
        record = self._get_download_record(record_id)
        if not record:
            return
        url = record.get("url")
        if not url:
            return
        self._navigate(url)

    def _on_copy_source(self, record_id: int):
        record = self._get_download_record(record_id)
        if not record:
            return
        url = record.get("url")
        if not url:
            return
        clipboard = QApplication.clipboard()
        clipboard.setText(url)

    def _cancel_download(self, record_id: int):
        download = self._active_downloads.get(record_id)
        if download:
            download.cancel()
        record = self._get_download_record(record_id)
        if record:
            record["state"] = "cancelled"
        self._save_download_records()
        self._update_download_dialog()

    def _retry_download(self, record_id: int):
        record = self._get_download_record(record_id)
        if not record:
            return
        url = record.get("url")
        path = record.get("path")
        if not url or not path:
            return
        record["state"] = "requested"
        record["received"] = 0
        record["total"] = 0
        self._pending_retries[url] = record
        view = self._current_view() or self._create_tab(switch=False, auto_close=True)
        if view:
            view.page().download(QUrl(url), os.path.basename(path))
        self._save_download_records()
        self._update_download_dialog()

    def _remove_download_record(self, record_id: int):
        record = self._get_download_record(record_id)
        if not record:
            return
        self._active_downloads.pop(record_id, None)
        idx = self._download_record_index.pop(record_id, None)
        if idx is not None:
            if 0 <= idx < len(self.download_records):
                self.download_records.pop(idx)
                # rebuild index map
                self._download_record_index = {rec["id"]: i for i, rec in enumerate(self.download_records)}
        self._save_download_records()
        self._update_download_dialog()


    def _open_userscript_manager(self):
        if not self.userscript_host:
            QMessageBox.warning(self, "Userscript", "Runtime chưa sẵn sàng.")
            return
        if self._userscript_dialog is None:
            self._userscript_dialog = UserscriptManagerDialog(
                on_import_local=self._handle_userscript_local_import,
                on_download_url=self._handle_userscript_url_download,
                on_remove=self._handle_userscript_remove,
                on_toggle=self._handle_userscript_toggle,
                on_update=self._handle_userscript_update,
                on_open_folder=self._open_userscript_folder,
                parent=self
            )
            self._userscript_dialog.finished.connect(self._on_userscript_dialog_closed)
        self._refresh_userscript_dialog()
        self._userscript_dialog.show()
        self._userscript_dialog.raise_()
        self._userscript_dialog.activateWindow()

    def _open_userscript_folder(self):
        os.makedirs(USERSCRIPT_DIR, exist_ok=True)
        QDesktopServices.openUrl(QUrl.fromLocalFile(USERSCRIPT_DIR))

    def _handle_userscript_local_import(self):
        if not self.userscript_host:
            QMessageBox.warning(self, "Userscript", "Runtime chưa sẵn sàng.")
            return
        source, _ = QFileDialog.getOpenFileName(
            self,
            "Chọn file userscript",
            os.path.expanduser("~"),
            "UserScript (*.user.js);;Tất cả các file (*.*)"
        )
        if not source:
            return
        try:
            dest = self._persist_userscript_file(source)
        except Exception as exc:
            QMessageBox.critical(self, "Lỗi import", f"Không thể import script:\n{exc}")
            return
        try:
            self.userscript_host.register_script(dest)
            QMessageBox.information(self, "Thành công", f"Đã import script đến:\n{dest}")
            self._reload_userscript_runtime()
        except Exception as exc:
            QMessageBox.critical(self, "Lỗi", f"Không thể đăng ký script:\n{exc}")
        finally:
            self._refresh_userscript_dialog()

    def _handle_userscript_url_download(self, url: str):
        if not self.userscript_host:
            QMessageBox.warning(self, "Userscript", "Runtime chưa sẵn sàng.")
            return
        try:
            response = requests.get(url, timeout=60)
            response.raise_for_status()
        except Exception as exc:
            QMessageBox.critical(self, "Lỗi tải script", f"Không thể tải script từ URL:\n{exc}")
            return
        filename = os.path.basename(urllib.parse.urlparse(url).path) or f"userscript_{int(time.time())}.user.js"
        if not filename.endswith(".user.js"):
            filename = f"{filename}.user.js"
        dest = os.path.join(USERSCRIPT_DIR, filename)
        suffix = 1
        while os.path.exists(dest):
            name, ext = os.path.splitext(filename)
            ext = ext or ".user.js"
            dest = os.path.join(USERSCRIPT_DIR, f"{name}_{suffix}{ext}")
            suffix += 1
        os.makedirs(USERSCRIPT_DIR, exist_ok=True)
        try:
            with open(dest, "w", encoding="utf-8") as handle:
                handle.write(response.text)
        except Exception as exc:
            QMessageBox.critical(self, "Lỗi ghi file", f"Không thể lưu script:\n{exc}")
            return
        try:
            self.userscript_host.register_script(dest, download_url=url)
            QMessageBox.information(self, "Thành công", f"Đã tải script:\n{dest}")
            self._reload_userscript_runtime()
        except Exception as exc:
            QMessageBox.critical(self, "Lỗi", f"Không thể đăng ký script:\n{exc}")
        finally:
            self._refresh_userscript_dialog()

    def _handle_userscript_remove(self, script_id: str):
        if not self.userscript_host:
            return
        try:
            self.userscript_host.remove_script(script_id)
            self._reload_userscript_runtime()
        except Exception as exc:
            QMessageBox.critical(self, "Lỗi", f"Không thể xoá script:\n{exc}")
        finally:
            self._refresh_userscript_dialog()

    def _handle_userscript_toggle(self, script_id: str, enabled: bool):
        if not self.userscript_host:
            return
        try:
            self.userscript_host.set_script_enabled(script_id, enabled)
            print("[Userscript] Đã lưu trạng thái, vui lòng tải lại trang/tab để áp dụng.")
            self._refresh_userscript_button()
        except Exception as exc:
            QMessageBox.critical(self, "Lỗi", f"Không thể thay đổi trạng thái script:\n{exc}")
        finally:
            self._refresh_userscript_dialog()

    def _handle_userscript_update(self, script_id: str):
        if not self.userscript_host:
            return
        try:
            self.userscript_host.update_script_from_url(script_id)
            QMessageBox.information(self, "Cập nhật", "Đã tải script mới nhất.")
            self._reload_userscript_runtime()
        except ValueError as exc:
            QMessageBox.warning(self, "Cập nhật", str(exc))
        except Exception as exc:
            QMessageBox.critical(self, "Lỗi", f"Không thể cập nhật script:\n{exc}")
        finally:
            self._refresh_userscript_dialog()

    def _persist_userscript_file(self, source_path: str) -> str:
        os.makedirs(USERSCRIPT_DIR, exist_ok=True)
        base_name = os.path.basename(source_path) or f"userscript_{int(time.time())}.user.js"
        dest_path = os.path.join(USERSCRIPT_DIR, base_name)
        suffix = 1
        while os.path.exists(dest_path):
            name, ext = os.path.splitext(base_name)
            dest_path = os.path.join(USERSCRIPT_DIR, f"{name}_{suffix}{ext or '.user.js'}")
            suffix += 1
        shutil.copy2(source_path, dest_path)
        return dest_path

    def _on_userscript_dialog_closed(self, _result):
        self._userscript_dialog = None

    def _init_userscript_host(self):
        storage_path = os.path.join(PROFILE_DIR, "userscript_storage.json")
        default_script = os.path.join(BASE_DIR, "novelDownloaderVietSub.user.js")
        self.userscript_host = UserscriptHost(
            self,
            registry_path=USERSCRIPT_REGISTRY_FILE,
            storage_path=storage_path,
            default_script_path=default_script
        )
        if self.userscript_host:
            try:
                self.userscript_host.environment["platform"]["browserVersion"] = self.profile.httpUserAgent()
            except Exception:
                pass
        self._refresh_userscript_button()
        self._refresh_userscript_dialog()

    def _refresh_userscript_button(self):
        if self._script_button:
            has_scripts = bool(self.userscript_host and self.userscript_host.list_scripts())
            self._script_button.setEnabled(has_scripts)

    def _refresh_userscript_dialog(self):
        if self._userscript_dialog and self.userscript_host:
            self._userscript_dialog.update_scripts(self.userscript_host.list_scripts())

    def _reload_userscript_runtime(self):
        if not self.userscript_host:
            return
        self.userscript_host.reload_scripts()
        for idx in self._real_tab_indexes():
            view = self.tabs.widget(idx)
            if isinstance(view, BrowserView):
                view.reload()
        self._refresh_userscript_button()
        self._refresh_userscript_dialog()

    def _default_userscript_path(self) -> str:
        return os.path.join(BASE_DIR, "novelDownloaderVietSub.user.js")

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
        # Handle password capture
        if hasattr(view.page(), "passwordCaptured"):
            view.page().passwordCaptured.connect(self._on_password_captured)

        view.urlChanged.connect(lambda url, v=view: self._handle_tab_url_change(v, url))
        view.titleChanged.connect(lambda title, v=view: self._update_tab_title(v, title))
        view.loadProgress.connect(lambda value, v=view: self._handle_view_progress(v, value))
        view.loadFinished.connect(lambda ok, v=view: self._on_page_load_finished(v, ok))
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
        if self.userscript_host:
            self.userscript_host.attach_view(view)
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

    def _on_address_completer_activated(self, text: str):
        if not text:
            return
        self.address_bar.setText(text)
        self._handle_navigate()

    def _handle_navigate(self):
        raw = self.address_bar.text().strip()
        url, search_term = self._normalize_input_to_url(raw)
        if search_term:
            self._record_search_term(search_term)
        self._navigate(url)

    def _navigate(self, url: str, view: Optional[BrowserView] = None):
        view = view or self._current_view()
        if not view:
            view = self._create_tab(switch=True)
        view.setUrl(QUrl.fromUserInput(url))

    def _normalize_input_to_url(self, text: str):
        if not text:
            return DEFAULT_HOME, None
        value = text.strip()
        if value.lower().startswith("file://"):
            return value, None
        if os.path.exists(value):
            try:
                return Path(value).resolve().as_uri(), None
            except Exception:
                pass
        if re.match(r'^[a-zA-Z]:[\\/]', value) or value.startswith("\\\\"):
            try:
                return Path(value).resolve().as_uri(), None
            except Exception:
                pass
        if SCHEME_RE.match(value):
            return value, None
        if DOMAIN_LIKE_RE.match(value):
            return f"https://{value}", None
        encoded = urllib.parse.quote_plus(value)
        return f"https://www.google.com/search?q={encoded}", value

    def _record_search_term(self, term: str):
        term = (term or "").strip()
        if not term:
            return
        self._search_term_counter[term] += 1
        self._refresh_address_suggestions()

    def _refresh_address_suggestions(self):
        if not hasattr(self, "_address_suggestions_model") or self._address_suggestions_model is None:
            return
        suggestions = [term for term, _ in self._search_term_counter.most_common(25)]
        urls: List[str] = []
        hosts: List[str] = []
        for entry in reversed(self.history_entries[-200:]):
            url = entry.get("url")
            if url and url not in suggestions and url not in urls:
                urls.append(url)
            host = self._extract_host(url)
            if host and host not in suggestions and host not in urls and host not in hosts:
                hosts.append(host)
        self._address_suggestions_model.setStringList(suggestions + urls + hosts)

    def _extract_host(self, url: Optional[str]) -> Optional[str]:
        if not url:
            return None
        try:
            parsed = urllib.parse.urlparse(url)
        except Exception:
            return None
        if parsed.scheme == "file":
            return url
        return parsed.netloc or url

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
        if self.userscript_host:
            self.userscript_host.shutdown()
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
        self._refresh_address_suggestions()

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

    def _show_userscript_menu(self):
        if not self.userscript_host:
            QMessageBox.information(self, "Script", "Userscript runtime chưa sẵn sàng.")
            return
        view = self._current_view()
        if not view:
            QMessageBox.information(self, "Script", "Không có tab nào đang mở.")
            return
        commands = self.userscript_host.get_menu_commands(view)
        if not commands:
            QMessageBox.information(self, "Script", "Không có menu nào cho trang này.")
            return
        menu = QMenu(self)
        for entry in commands:
            command_id = entry.get("id")
            script_id = entry.get("script_id")
            script_name = entry.get("script_name") or "Script"
            title = entry.get("title") or "Command"
            label = f"{script_name}: {title}"
            action = menu.addAction(label)
            action.triggered.connect(
                lambda _checked=False, sid=script_id, cid=command_id: self.userscript_host.execute_menu_command(view, sid, cid)
            )
        sender = self.sender()
        if isinstance(sender, QPushButton):
            menu.exec(sender.mapToGlobal(sender.rect().bottomLeft()))
        else:
            menu.exec(self.mapToGlobal(self.rect().center()))

    def _open_settings_menu(self):
        menu = QMenu(self)
        menu.addAction("Lịch sử", self._show_history_dialog)
        
        act_pass = menu.addAction("Quản lý mật khẩu")
        act_pass.triggered.connect(self._open_password_manager)
        
        menu.addSeparator()
        menu.addAction("Quản lý userscript", self._open_userscript_manager)
        menu.addSeparator()
        menu.addAction("Xóa cache", self._clear_cache)
        button = self.sender()
        if isinstance(button, QPushButton):
            menu.exec(button.mapToGlobal(button.rect().bottomLeft()))

    def _open_profile_menu(self):
        menu = QMenu(self)
        
        # Scan profiles
        base_dir = os.path.dirname(PROFILE_DIR) if "qt_browser_profile" in PROFILE_DIR else os.path.join(PROFILE_DIR, "..")
        # Actually PROFILE_DIR is full path.
        # We assume BASE_DIR is parent of PROFILE_DIR.
        # But we don't have BASE_DIR easily here except via imports if we had them or deducing.
        # Let's deduce from PROFILE_DIR (which is Global).
        parent_dir = os.path.dirname(PROFILE_DIR.rstrip(os.sep))
        
        current_name = "Profile 1"
        try:
             name = os.path.basename(PROFILE_DIR)
             if name == "qt_browser_profile":
                  current_name = "Profile 1"
             elif name.startswith("qt_browser_profile_"):
                  current_name = name.replace("qt_browser_profile_", "").replace("_", " ")
        except Exception:
             pass

        recycle_entries = _load_profile_recycle()
        deleted_names = set()
        for key, entry in recycle_entries.items():
            if isinstance(entry, dict):
                deleted_names.add(entry.get("profile") or key)
            else:
                deleted_names.add(key)
             
        menu.addAction(f"Hiện tại: {current_name}").setEnabled(False)
        menu.addSeparator()

        profiles = []
        try:
            for name in os.listdir(parent_dir):
                full = os.path.join(parent_dir, name)
                if os.path.isdir(full) and name.startswith("qt_browser_profile"):
                    pname = "Profile 1" if name == "qt_browser_profile" else name.replace("qt_browser_profile_", "").replace("_", " ")
                    if pname not in deleted_names:
                        profiles.append((pname, name))
        except Exception:
            profiles = [("Profile 1", "qt_browser_profile")]
            
        profiles.sort(key=lambda x: (0 if x[0] == "Profile 1" else 1, x[0]))
        
        for pname, dirname in profiles:
             if pname == current_name:
                 continue
             action = menu.addAction(f"Chuyển sang: {pname}")
             # We send the display name to parent, parent knows how to convert to dir or match it.
             # Actually parent main app uses "Profile 1" style names.
             action.triggered.connect(lambda checked=False, n=pname: self._request_switch_profile(n))
             
        menu.addSeparator()
        menu.addAction("Thêm Profile mới", self._request_new_profile)
        menu.addAction("Đổi tên Profile hiện tại", lambda: self._request_rename_profile(current_name))
        menu.addAction("Xóa Profile hiện tại", lambda: self._request_delete_profile(current_name))

        restore_menu = menu.addMenu("Khôi phục Profile")
        if not deleted_names:
            restore_menu.setEnabled(False)
        else:
            for pname in sorted(deleted_names, key=lambda x: (0 if x == "Profile 1" else 1, x)):
                action = restore_menu.addAction(pname)
                action.triggered.connect(lambda checked=False, n=pname: self._request_restore_profile(n))
        
        button = self.sender()
        if isinstance(button, QPushButton):
            menu.exec(button.mapToGlobal(button.rect().bottomLeft()))
            
    def _request_switch_profile(self, name):
         if self.event_conn:
             try:
                 self.event_conn.send(("PROFILE_SWITCH_REQUEST", name))
             except Exception:
                 pass
                 
    def _request_new_profile(self):
        name, ok = QInputDialog.getText(self, "Tạo Profile", "Tên Profile mới:")
        if ok and name.strip():
             # Basic validation
             clean = _sanitize_profile_name(name)
             if clean:
                  self._request_switch_profile(clean)
             else:
                  QMessageBox.warning(self, "Lỗi", "Tên không hợp lệ.")

    def _request_delete_profile(self, name: str):
        target = (name or "").strip()
        if not target:
            return
        if QMessageBox.question(
            self,
            "Xóa Profile",
            f"Xóa profile '{target}'? Cache Wikidich/Koanchay sẽ được đưa vào thùng rác trong 7 ngày."
        ) != QMessageBox.StandardButton.Yes:
            return
        if self.event_conn:
            try:
                self.event_conn.send(("PROFILE_DELETE_REQUEST", target))
            except Exception:
                pass

    def _request_rename_profile(self, current_name: str):
        target = (current_name or "").strip()
        if not target:
            return
        new_name, ok = QInputDialog.getText(self, "Đổi tên Profile", f"Đổi tên profile '{target}' thành:")
        if not ok:
            return
        clean = _sanitize_profile_name(new_name)
        if not clean:
            QMessageBox.warning(self, "Lỗi", "Tên không hợp lệ.")
            return
        if clean == target:
            return
        if self.event_conn:
            try:
                self.event_conn.send(("PROFILE_RENAME_REQUEST", {"old": target, "new": clean}))
            except Exception:
                pass

    def _request_restore_profile(self, name: str):
        target = (name or "").strip()
        if not target:
            return
        if self.event_conn:
            try:
                self.event_conn.send(("PROFILE_RESTORE_REQUEST", target))
            except Exception:
                pass


    def _load_passwords(self):
        if not os.path.exists(PASSWORDS_FILE):
             return
        try:
            with open(PASSWORDS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Decrypt loaded passwords
            for domain, accounts in data.items():
                for acc in accounts:
                    if "password" in acc:
                        acc["password"] = revert_str(acc["password"])
            self.passwords = data
        except Exception as e:
            print(f"Error loading passwords: {e}")

    def _save_passwords_to_file(self):
        try:
            # Create a copy with encrypted passwords
            import copy
            data_to_save = copy.deepcopy(self.passwords)
            for domain, accounts in data_to_save.items():
                for acc in accounts:
                    if "password" in acc:
                        acc["password"] = transform_str(acc["password"])
            
            with open(PASSWORDS_FILE, "w", encoding="utf-8") as f:
                json.dump(data_to_save, f, indent=2, ensure_ascii=False)
        except Exception:
            pass

    def _open_password_manager(self):
        dlg = PasswordManagerDialog(
            load_passwords_cb=lambda: self.passwords,
            delete_password_cb=self._delete_password,
            parent=self
        )
        dlg.exec()

    def _delete_password(self, domain, username):
        if domain in self.passwords:
            self.passwords[domain] = [acc for acc in self.passwords[domain] if acc.get("username") != username]
            if not self.passwords[domain]:
                del self.passwords[domain]
            self._save_passwords_to_file()

    def _on_password_captured(self, data):
        domain = data.get("domain")
        username = data.get("username")
        password = data.get("password")
        if not domain or not password:
            return

        # Check if already saved
        if domain in self.passwords:
            for acc in self.passwords[domain]:
                if acc.get("username") == username and acc.get("password") == password:
                    return # Already saved

        # Prompt user
        msg = f"Bạn có muốn lưu mật khẩu cho trang {domain} không?\nTài khoản: {username or '(Không tên)'}"
        if QMessageBox.question(self, "Lưu mật khẩu", msg) == QMessageBox.StandardButton.Yes:
            if domain not in self.passwords:
                self.passwords[domain] = []
            
            # Update if username exists, else append
            existing = False
            for acc in self.passwords[domain]:
                if acc.get("username") == username:
                    acc["password"] = password
                    acc["updated_at"] = datetime.now().isoformat()
                    existing = True
                    break
            
            if not existing:
                self.passwords[domain].append({
                    "username": username,
                    "password": password,
                    "created_at": datetime.now().isoformat()
                })
            
            self._save_passwords_to_file()

    def _on_page_load_finished(self, view, ok):
        if not ok:
            return
        try:
            url = view.url()
            domain = url.host()
            if domain in self.passwords and self.passwords[domain]:
                # Auto-fill using the first account (or most recently updated)
                # Sort by updated_at desc if possible, or just take last
                acc = self.passwords[domain][-1]
                u = acc.get("username", "")
                p = acc.get("password", "")
                if p:
                    js = f"""
                    (function() {{
                        var u = {json.dumps(u)};
                        var p = {json.dumps(p)};
                        var inputs = Array.from(document.querySelectorAll("input"));
                        var pass = null;
                        
                        // Find password field
                        for(var i=0; i<inputs.length; i++) {{
                            if(inputs[i].type == "password") {{ pass=inputs[i]; break; }}
                        }}
                        
                        if(pass) {{
                            // Fill password
                            pass.value = p;
                            pass.dispatchEvent(new Event('input', {{ bubbles: true }}));
                            pass.dispatchEvent(new Event('change', {{ bubbles: true }}));
                            
                            // Find user field by searching backwards from password field
                            var userField = null;
                            var passIdx = inputs.indexOf(pass);
                            for (var i = passIdx - 1; i >= 0; i--) {{
                                var t = inputs[i].type ? inputs[i].type.toLowerCase() : "";
                                if (t === "text" || t === "email" || t === "tel") {{
                                    userField = inputs[i];
                                    break;
                                }}
                            }}
                            
                            if (userField) {{
                                console.log("DEBUG: Auto-filling username on", userField);
                                userField.value = u;
                                userField.dispatchEvent(new Event('input', {{ bubbles: true }}));
                                userField.dispatchEvent(new Event('change', {{ bubbles: true }}));
                            }} else {{
                                console.log("DEBUG: No username field found to fill");
                            }}
                        }}
                    }})();
                    """
                    view.page().runJavaScript(js)
        except Exception:
            pass

def run_browser(initial_url: Optional[str], cmd_conn, event_conn, profile_dir: Optional[str] = None):
    """Entry-point for the multiprocessing worker."""
    if profile_dir:
        set_profile_dir(profile_dir)
    app = QApplication(sys.argv)
    window = _BrowserWindow(initial_url, cmd_conn, event_conn)
    window.show()
    app.exec()
