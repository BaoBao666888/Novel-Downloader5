# main_ui.py
import os
import re
import io
import time
from datetime import datetime
import tkinter.font as tkfont
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext, simpledialog, colorchooser

try:
    import ctypes
except ImportError:
    ctypes = None

import requests
from PIL import Image, ImageTk, ImageFilter
import numpy as np
import cv2
from app.core import renamer as logic
import json
import threading
import urllib.request
from packaging.version import parse as parse_version
from extensions import jjwxc_ext
from extensions import po18_ext
from extensions import qidian_ext
from extensions import fanqienovel_ext
from extensions import ihuaben_ext
from extensions import wikidich_ext
from app.core.text_ops import TextOperations
from app.ui.update_dialog import show_update_window, fetch_manifest_from_url
from app.ui.cookie_manager import CookieManagerWindow
from app.core import translator as trans_logic
from app.core.browser_cookies import load_browser_cookie_jar
import pythoncom
import random
import subprocess
import sys
import shutil
import webbrowser
from concurrent.futures import ThreadPoolExecutor, as_completed
from browser_overlay import BrowserOverlay
from app.paths import BASE_DIR, RESOURCE_DIR, BACKGROUND_DIR

MODERN_THEME_NAME = "RenameModern"

THEME_PRESETS = {
    "Midnight": {
        "bg": "#0f172a",
        "card": "#17213b",
        "card_alt": "#1f2a44",
        "border": "#273553",
        "text": "#f5f7ff",
        "muted": "#98a2c3",
        "input_bg": "#111a32",
        "disabled": "#3b4362"
    },
    "Aurora": {
        "bg": "#111827",
        "card": "#1f2937",
        "card_alt": "#243447",
        "border": "#2f3c4f",
        "text": "#ecfeff",
        "muted": "#b5c6d6",
        "input_bg": "#162032",
        "disabled": "#475569"
    },
    "Forest": {
        "bg": "#0d1712",
        "card": "#14241a",
        "card_alt": "#193322",
        "border": "#1e3a26",
        "text": "#e6fffa",
        "muted": "#9fe7c7",
        "input_bg": "#10261a",
        "disabled": "#30593f"
    },
    "Daylight": {
        "bg": "#f5f5f5",
        "card": "#ffffff",
        "card_alt": "#f7f7fb",
        "border": "#dfe3ef",
        "text": "#1f2933",
        "muted": "#6b7280",
        "input_bg": "#edf1fb",
        "disabled": "#c3c8d7"
    }
}

DEFAULT_UI_SETTINGS = {
    'theme': 'Midnight',
    'accent_color': '#6366f1',
    'text_color': '',
    'font_size': 10,
    'mouse_glow': False,
    'background_image': '',
    'use_classic_theme': False
}

DEFAULT_API_SETTINGS = {
    'wiki_delay_min': 2.0,
    'wiki_delay_max': 3.0,
    'fanqie_delay_min': 0.0,
    'fanqie_delay_max': 0.0,
    'wiki_headers': {
        "User-Agent": "RenameChapters-Wikidich/0.2",
        "X-Requested-With": "XMLHttpRequest"
    },
    'fanqie_headers': {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    }
}

ONLINE_SOURCES = [
    {
        "id": "jjwxc",
        "label": "JJWXC",
        "domain": "jjwxc.net",
        "site_value": "jjwxc.net",
        "sample": "https://www.jjwxc.net/onebook.php?novelid=123456",
        "icon": "icons/jjwxc.png"
    },
    {
        "id": "po18",
        "label": "PO18",
        "domain": "po18.tw",
        "site_value": "po18.tw",
        "sample": "https://www.po18.tw/books/123456",
        "icon": "icons/po18.png"
    },
    {
        "id": "qidian",
        "label": "QiDian",
        "domain": "qidian.com",
        "site_value": "qidian.com",
        "sample": "https://www.qidian.com/book/1037076300/",
        "icon": "icons/qidian.png"
    },
    {
        "id": "fanqie",
        "label": "番茄小说",
        "domain": "fanqienovel.com",
        "site_value": "fanqienovel.com",
        "sample": "https://fanqienovel.com/page/123456",
        "icon": "icons/fanqie.png"
    },
    {
        "id": "ihuaben",
        "label": "Ihuaben",
        "domain": "ihuaben.com",
        "site_value": "ihuaben.com",
        "sample": "https://www.ihuaben.com/book/9219715.html",
        "icon": "icons/ihuaben.png"
    }
]

SOURCE_BY_ID = {src["id"]: src for src in ONLINE_SOURCES}

WD_SORT_OPTIONS = [
    ("recent", "Mới nhất"),
    ("oldest", "Cũ nhất"),
    ("views", "Lượt xem cao"),
    ("rating", "Đánh giá cao"),
    ("title", "Theo tên (A-Z)")
]


def _load_env_file(path):
    """Đọc file .env đơn giản và đưa biến vào os.environ."""
    env_data = {}
    try:
        with open(path, 'r', encoding='utf-8') as env_file:
            for line in env_file:
                stripped = line.strip()
                if not stripped or stripped.startswith('#') or '=' not in stripped:
                    continue
                key, value = stripped.split('=', 1)
                key = key.strip()
                value = value.strip()
                env_data[key] = value
                os.environ.setdefault(key, value)
    except FileNotFoundError:
        pass
    return env_data


def _normalize_hex_color(value, fallback="#6366f1"):
    if not value:
        return fallback
    value = value.strip()
    if not value:
        return fallback
    if not value.startswith("#"):
        value = f"#{value}"
    if len(value) == 4:
        value = "#" + "".join(ch * 2 for ch in value[1:])
    if len(value) != 7:
        return fallback
    try:
        int(value[1:], 16)
        return value.lower()
    except ValueError:
        return fallback


def _adjust_color_luminance(hex_color, delta=0.1):
    color = _normalize_hex_color(hex_color)
    rgb = [int(color[i:i + 2], 16) for i in (1, 3, 5)]
    adjusted = []
    for channel in rgb:
        if delta >= 0:
            channel = channel + (255 - channel) * delta
        else:
            channel = channel * (1 + delta)
        adjusted.append(int(max(0, min(255, round(channel)))))
    return "#%02x%02x%02x" % tuple(adjusted)


def _make_window_clickthrough(window):
    if not (sys.platform.startswith('win') and ctypes):
        return
    try:
        hwnd = window.winfo_id()
        GWL_EXSTYLE = -20
        WS_EX_LAYERED = 0x00080000
        WS_EX_TRANSPARENT = 0x00000020
        current = ctypes.windll.user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
        ctypes.windll.user32.SetWindowLongW(hwnd, GWL_EXSTYLE, current | WS_EX_LAYERED | WS_EX_TRANSPARENT)
        ctypes.windll.user32.SetLayeredWindowAttributes(hwnd, 0, 255, 0x00000002)
    except Exception:
        pass


def _resolve_path(path):
    if not path:
        return ''
    if os.path.isabs(path):
        return path
    return os.path.join(BASE_DIR, path)


def _env_bool(name, default=False, env_map=None):
    value = None
    if env_map:
        value = env_map.get(name)
    if value is None:
        value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in ('1', 'true', 'yes', 'y', 'on')


def _sync_versioned_files(version):
    """Đồng bộ version.json và update_notes.html với phiên bản trong .env."""
    if not version:
        return
    try:
        _sync_version_manifest(version)
    except Exception as exc:
        print(f"Không thể đồng bộ version.json: {exc}")
    try:
        _sync_update_notes(version)
    except Exception as exc:
        print(f"Không thể đồng bộ update_notes.html: {exc}")


def _sync_version_manifest(version):
    manifest_path = os.path.join(BASE_DIR, 'version.json')
    if not os.path.exists(manifest_path):
        return
    try:
        with open(manifest_path, 'r', encoding='utf-8') as mf:
            manifest = json.load(mf)
    except Exception:
        return
    original = json.dumps(manifest, ensure_ascii=False, sort_keys=True)
    manifest['version'] = version
    url = manifest.get('url', '')
    if isinstance(url, str):
        manifest['url'] = re.sub(r'(rename_chapters/)(\d+\.\d+\.\d+)',
                                 rf'\1{version}', url, count=1)
    if json.dumps(manifest, ensure_ascii=False, sort_keys=True) != original:
        with open(manifest_path, 'w', encoding='utf-8', newline='\n') as mf:
            json.dump(manifest, mf, indent=2, ensure_ascii=False)


def _sync_update_notes(version):
    notes_path = os.path.join(BASE_DIR, 'update_notes.html')
    if not os.path.exists(notes_path):
        return
    try:
        with open(notes_path, 'r', encoding='utf-8') as nf:
            content = nf.read()
    except Exception:
        return
    new_content = content
    new_content = re.sub(r'(Phiên bản\s+)(\d+\.\d+\.\d+)',
                         rf'\1{version}', new_content, count=1)
    new_content = re.sub(r'(Bản cập nhật\s+)(\d+\.\d+\.\d+)',
                         rf'\1{version}', new_content, count=1)
    if new_content != content:
        with open(notes_path, 'w', encoding='utf-8', newline='\n') as nf:
            nf.write(new_content)


ENV_VARS = _load_env_file(os.path.join(BASE_DIR, '.env'))
APP_VERSION = ENV_VARS.get('APP_VERSION', '0.1.9')
USE_LOCAL_MANIFEST_ONLY = _env_bool('USE_LOCAL_MANIFEST_ONLY', False, ENV_VARS)
SYNC_VERSIONED_FILES = _env_bool('SYNC_VERSIONED_FILES', False, ENV_VARS)
if SYNC_VERSIONED_FILES:
    _sync_versioned_files(APP_VERSION)

if sys.platform == 'win32':
    class DummyStream:
        def __init__(self, *args, **kwargs):
            # Tự do định nghĩa thuộc tính encoding vì đây là lớp của chúng ta
            self.encoding = 'utf-8'
        
        # Cung cấp các phương thức mà các thư viện khác có thể gọi
        def write(self, s):
            pass # Bỏ qua, không làm gì cả
        
        def flush(self):
            pass # Bỏ qua, không làm gì cả

    if sys.stdout is None:
        sys.stdout = DummyStream()
    if sys.stderr is None:
        sys.stderr = DummyStream()
    _Popen = subprocess.Popen
    CREATE_NO_WINDOW = 0x08000000

    def Popen_no_window(*args, **kwargs):
        kwargs['creationflags'] = CREATE_NO_WINDOW
        kwargs['stdout'] = subprocess.PIPE
        kwargs['stderr'] = subprocess.PIPE
        return _Popen(*args, **kwargs)

    subprocess.Popen = Popen_no_window

class RenamerApp(tk.Tk):
    CURRENT_VERSION = APP_VERSION
    VERSION_CHECK_URL = os.environ.get(
        "VERSION_CHECK_URL",
        "https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/refs/heads/main/rename_chapters/version.json"
    )
    def __init__(self):
        super().__init__()
        self.title(f"Rename Chapters v{self.CURRENT_VERSION} (by BaoBao)")
        self.geometry("1200x800")
        self._style = ttk.Style(self)
        self._base_theme = self._style.theme_use()
        self._base_bg = self.cget("background")
        self.text_modified = tk.BooleanVar(value=False)
        self.folder_path = tk.StringVar()
        self.selected_file = tk.StringVar()
        self.files_data = []
        self.preview_job = None
        self.sorted_files_cache = []
        self.excluded_files = set()
        self.sort_strategy = tk.StringVar(value="content")
        self.combine_titles_var = tk.BooleanVar(value=False)
        self.title_format_var = tk.StringVar(value="{t1} - {t2}")
        self.regex_pins = {'find': [], 'replace': [], 'split': []}

        self.downloaded_image_data = None
        self.image_zoom_factor = 1.0
        self.image_original_pil = None
        self.image_display_pil = None
        self.tk_photo_image = None
        self._image_drag_data = {"x": 0, "y": 0}

        self.app_config = {}
        self._set_default_config()
        self._preload_ui_settings()
        self.ui_settings = dict(self.app_config.get('ui_settings', {}))
        self._pending_font_value = self.ui_settings.get('font_size', DEFAULT_UI_SETTINGS['font_size'])
        self._theme_ready = False
        self._cursor_motion_binding_active = False
        self._cursor_glow_window = None
        self._cursor_glow_canvas = None
        self._cursor_glow_after = None
        self._cursor_glow_enabled = False
        self._cursor_glow_item = None
        self._mouse_glow_warning_shown = False
        self._cursor_last_update = 0.0
        self.cookie_window = None
        self.cookies_db_path = os.path.join(BASE_DIR, "qt_browser_profile", "storage", "Cookies")
        self._background_canvas = tk.Canvas(self, highlightthickness=0, bd=0, bg=self._base_bg)
        self._background_canvas.pack(fill=tk.BOTH, expand=True)
        self._background_canvas.bind("<Configure>", self._on_canvas_configure)
        self._background_image_original = None
        self._background_image = None
        self._background_image_path = ''
        self._background_image_item = None
        self._canvas_width = 0
        self._canvas_height = 0
        self._content_window = None
        self.use_local_manifest_only = USE_LOCAL_MANIFEST_ONLY

        wd_cfg = self.app_config.get('wikidich', {})
        self.wikidich_cache_path = wd_cfg.get('cache_path', os.path.join(BASE_DIR, "local", "wikidich_cache.json"))
        self.wikidich_filters = dict(wd_cfg.get('advanced_filter', {}))
        self.api_settings = dict(self.app_config.get('api_settings', {}))
        self.wikidich_data = {"username": None, "book_ids": [], "books": {}, "synced_at": None}
        self._wd_cover_cache = {}
        self._wd_loading = False
        self._wd_progress_running = False
        self.wd_new_chapters = {}
        self.create_widgets()
        self.load_config()
        threading.Thread(target=self._cleanup_legacy_files, daemon=True).start()
        # Đẩy các tác vụ không cần chờ (kiểm tra update, preload nhỏ) sang luồng nền sau khi UI đã lên
        self.after(200, self._schedule_background_tasks)
        self.protocol("WM_DELETE_WINDOW", self.on_closing)

    def _set_default_config(self):
        """Khởi tạo các giá trị mặc định cho config."""
        self.app_config = {
            'nameSets': {'Mặc định': {}},
            'activeNameSet': 'Mặc định',
            'translator_settings': {
                'serverUrl': 'https://dichngay.com/translate/text',
                'hanvietJsonUrl': 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/han_viet/output.json',
                'delayMs': 400,
                'maxChars': 4500
            },
            'proxy_settings': {
                'proxies': [],
                'use_for_fetch_titles': False,
                'use_for_wikidich': False,
                'use_for_translate': False,
                'use_for_images': False
            },
            'ui_settings': dict(DEFAULT_UI_SETTINGS),
            'regex_pins': {'find': [], 'replace': [], 'split': []},
            'wikidich': {
                'cache_path': os.path.join(BASE_DIR, "local", "wikidich_cache.json"),
                'advanced_filter': {
                    'status': 'all',
                    'search': '',
                    'summarySearch': '',
                    'categories': [],
                    'roles': [],
                    'flags': [],
                    'fromDate': '',
                    'toDate': '',
                    'sortBy': 'recent'
                }
            },
            'api_settings': dict(DEFAULT_API_SETTINGS)
        }

    def _cleanup_legacy_files(self):
        """Xóa các file/cấu trúc cũ không còn dùng."""
        targets = [
            os.path.join(BASE_DIR, "qidian_guest_cookies.json"),
            os.path.join(BASE_DIR, "po18_cookies.json"),
        ]
        folders = [
            os.path.join(BASE_DIR, ".wdm"),
        ]
        for path in targets:
            try:
                if os.path.isfile(path):
                    os.remove(path)
            except Exception:
                pass
        for folder in folders:
            try:
                if os.path.isdir(folder):
                    shutil.rmtree(folder, ignore_errors=True)
            except Exception:
                pass

    def _schedule_background_tasks(self):
        """Khởi chạy các tác vụ hậu khởi động trong luồng nền để tránh chậm UI."""
        threading.Thread(target=self._run_background_tasks, daemon=True).start()

    def _run_background_tasks(self):
        # Kiểm tra cập nhật (đã có luồng riêng bên trong)
        try:
            self.check_for_updates()
        except Exception:
            pass
        # Có thể bổ sung thêm các bước preload nhẹ ở đây nếu cần

    def _preload_ui_settings(self):
        """Nạp nhanh cấu hình UI từ file config trước khi dựng widget."""
        config_path = os.path.join(BASE_DIR, 'config.json')
        try:
            if os.path.exists(config_path):
                with open(config_path, 'r', encoding='utf-8') as cfg:
                    data = json.load(cfg)
                ui_settings = data.get('ui_settings')
                if isinstance(ui_settings, dict):
                    self.app_config['ui_settings'].update(ui_settings)
        except Exception:
            pass

    def _apply_modern_theme(self, refresh_existing=False):
        """Thiết lập bảng màu và style ttk cho giao diện hiện đại hơn."""
        settings = getattr(self, "ui_settings", {}) or {}
        use_classic = bool(settings.get('use_classic_theme'))
        style = ttk.Style(self)
        if not hasattr(self, "_base_theme"):
            self._base_theme = style.theme_use()
            self._base_bg = self.cget("background")
        self.option_clear()

        if use_classic:
            style.theme_use(self._base_theme)
            colors = {
                "bg": self._base_bg,
                "card": self._base_bg,
                "card_alt": self._base_bg,
                "border": "#d0d5dd",
                "accent": "#3b82f6",
                "accent_hover": "#2563eb",
                "accent_soft": "#dbeafe",
                "text": "#111827",
                "muted": "#475467",
                "input_bg": "#ffffff",
                    "disabled": "#cbd5f5"
            }
            self._theme_colors = colors
            self.configure(bg=self._base_bg)
            if self._background_canvas:
                self._background_canvas.config(bg=self._base_bg)
            self._theme_ready = False
            self._apply_background_image()
            return

        if MODERN_THEME_NAME not in style.theme_names():
            parent_theme = "clam" if "clam" in style.theme_names() else self._base_theme
            try:
                style.theme_create(MODERN_THEME_NAME, parent=parent_theme)
            except tk.TclError:
                pass
        try:
            style.theme_use(MODERN_THEME_NAME)
        except tk.TclError:
            pass

        theme_name = settings.get('theme', 'Midnight')
        base_palette = THEME_PRESETS.get(theme_name, next(iter(THEME_PRESETS.values())))
        colors = dict(base_palette)
        accent = _normalize_hex_color(settings.get('accent_color', '#6366f1'), '#6366f1')
        colors["accent"] = accent
        colors["accent_hover"] = _adjust_color_luminance(accent, 0.2)
        colors["accent_soft"] = _adjust_color_luminance(accent, -0.2)
        text_override = settings.get('text_color')
        if text_override:
            text_color = _normalize_hex_color(text_override, colors["text"])
            colors["text"] = text_color
            colors["muted"] = _adjust_color_luminance(text_color, 0.4)
        self._theme_colors = colors
        font_size = int(settings.get('font_size', 10))
        base_font = ("Segoe UI", font_size)
        self.configure(bg=colors["bg"])
        if self._background_canvas:
            self._background_canvas.config(bg=colors["bg"])
        self.option_add("*Font", base_font)
        self.option_add("*Label.Font", base_font)
        self.option_add("*Entry.Background", colors["input_bg"])
        self.option_add("*Entry.Foreground", colors["text"])
        self.option_add("*Entry.Font", base_font)
        self.option_add("*Text.Background", colors["input_bg"])
        self.option_add("*Text.Foreground", colors["text"])
        self.option_add("*Text.InsertBackground", colors["accent"])
        self.option_add("*Text.HighlightThickness", 1)
        self.option_add("*Text.HighlightBackground", colors["border"])
        self.option_add("*Text.BorderWidth", 0)
        self.option_add("*Text.Relief", "flat")
        self.option_add("*Menubutton.Font", base_font)

        style.configure("TFrame", background=colors["card"])
        style.configure("Card.TFrame", background=colors["card"])
        style.configure("App.TFrame", background=colors["bg"])
        style.configure("TLabelframe", background=colors["card"], foreground=colors["muted"], borderwidth=1, relief="solid")
        style.configure("TLabelframe.Label", background=colors["card"], foreground=colors["accent"], font=("Segoe UI", 10, "bold"))
        style.configure("Section.TLabelframe", background=colors["card"], foreground=colors["muted"], borderwidth=1,
                        relief="solid")
        style.configure("Section.TLabelframe.Label", background=colors["card"], foreground=colors["accent"],
                        font=("Segoe UI", 10, "bold"))
        style.configure("TLabel", background=colors["card"], foreground=colors["text"])
        style.configure("TCheckbutton", background=colors["card"], foreground=colors["text"], padding=2)
        style.configure("TRadiobutton", background=colors["card"], foreground=colors["text"], padding=2)
        style.configure("TPanedwindow", background=colors["bg"], borderwidth=0)
        style.configure("TNotebook", background=colors["bg"], borderwidth=0, padding=0)
        style.configure("TNotebook.Tab", background=colors["bg"], foreground=colors["muted"], padding=(16, 8))
        style.map("TNotebook.Tab",
                  background=[("selected", colors["card_alt"])],
                  foreground=[("selected", colors["text"])])
        style.configure("TButton", font=("Segoe UI Semibold", 10), background=colors["accent"],
                        foreground="#ffffff", borderwidth=0, padding=(12, 6), relief="flat")
        style.map("TButton",
                  background=[("active", colors["accent_hover"]), ("pressed", colors["accent_hover"]),
                              ("disabled", colors["border"])],
                  foreground=[("disabled", colors["muted"])])
        style.configure("TEntry", fieldbackground=colors["input_bg"], background=colors["input_bg"],
                        foreground=colors["text"], bordercolor=colors["border"], relief="flat", padding=6)
        style.map("TEntry",
                  fieldbackground=[("focus", colors["card_alt"])],
                  bordercolor=[("focus", colors["accent"])])
        style.configure("TCombobox", fieldbackground=colors["input_bg"], background=colors["input_bg"],
                        foreground=colors["text"], arrowcolor=colors["accent"], padding=6)
        style.map("TCombobox",
                  fieldbackground=[("readonly", colors["input_bg"])],
                  foreground=[("disabled", colors["muted"])])
        style.configure("Treeview", background=colors["card_alt"], fieldbackground=colors["card_alt"],
                        foreground=colors["text"], rowheight=24, bordercolor=colors["border"])
        style.configure("Treeview.Heading", background=colors["bg"], foreground=colors["text"],
                        font=("Segoe UI Semibold", 10))
        style.map("Treeview",
                  background=[("selected", colors["accent"])],
                  foreground=[("selected", "#ffffff")])
        style.configure("Horizontal.TProgressbar", background=colors["accent"], troughcolor=colors["card_alt"],
                        borderwidth=0)
        style.configure("TScrollbar", background=colors["card_alt"], troughcolor=colors["card"],
                        bordercolor=colors["card_alt"])

        self.style = style
        if refresh_existing and getattr(self, "_theme_ready", False):
            self._refresh_text_widgets()
        self._theme_ready = True
        self._apply_background_image()
        self._refresh_source_tiles_theme()

    def _style_text_widget(self, widget):
        if not isinstance(widget, tk.Text):
            return
        colors = getattr(self, "_theme_colors", None)
        if not colors:
            return
        prev_state = widget.cget("state")
        if prev_state == "disabled":
            widget.config(state="normal")
        widget.configure(bg=colors["input_bg"], fg=colors["text"],
                         insertbackground=colors["accent"],
                         highlightthickness=1, highlightbackground=colors["border"],
                         highlightcolor=colors["accent"], relief=tk.FLAT, bd=0)
        if prev_state == "disabled":
            widget.config(state="disabled")

    def _refresh_text_widgets(self):
        if not getattr(self, "_theme_ready", False):
            return
        def _walk(widget):
            if isinstance(widget, tk.Text):
                self._style_text_widget(widget)
            for child in widget.winfo_children():
                _walk(child)
        _walk(self)
        self._apply_background_image()

    def _apply_background_image(self):
        path = self.ui_settings.get('background_image') or ''
        if path:
            path = _resolve_path(path)
        if path and os.path.exists(path):
            if path != getattr(self, "_background_image_path", ""):
                try:
                    self._background_image_original = Image.open(path).convert("RGBA")
                    self._background_image_path = path
                except Exception as exc:
                    print(f"Không thể tải ảnh nền: {exc}")
                    self._background_image_original = None
                    self._background_image_path = ''
            self._refresh_background_image()
        else:
            self._background_image_original = None
            self._background_image_path = ''
            self._background_image = None
            self._background_image_item = None
            if self._background_canvas:
                self._background_canvas.delete("background_image")
                bg_color = self._theme_colors.get('bg') if getattr(self, "_theme_colors", None) else self._base_bg
                self._background_canvas.config(bg=bg_color)
                if self._content_window is not None:
                    self._background_canvas.tag_raise(self._content_window)

    def _load_source_icon(self, relative_path, source_id):
        """
        Tải icon nguồn từ thư mục dự án. Bạn có thể thay icon bằng cách đặt file vào
        đường dẫn relative (ví dụ icons/jjwxc.png) và cập nhật trong ONLINE_SOURCES.
        """
        if not relative_path:
            return None
        candidates = [
            os.path.join(BASE_DIR, relative_path),
            os.path.join(RESOURCE_DIR, relative_path)
        ]
        abs_path = None
        for candidate in candidates:
            if candidate and os.path.exists(candidate):
                abs_path = candidate
                break
        if not abs_path:
            return None
        try:
            image = Image.open(abs_path).convert("RGBA")
            image = image.resize((48, 48), Image.LANCZOS)
            photo = ImageTk.PhotoImage(image)
            self.source_icon_images[source_id] = photo
            return photo
        except Exception as exc:
            print(f"Không thể tải icon {relative_path}: {exc}")
            return None

    def _update_source_info_labels(self):
        if not hasattr(self, "source_domain_var"):
            return
        config = SOURCE_BY_ID.get(self.selected_online_source.get())
        if not config:
            self.source_domain_var.set("Domain: —")
            self.source_sample_var.set('')
            if hasattr(self, "source_current_label"):
                self.source_current_label.config(text="(chưa chọn)")
            return
        if hasattr(self, "source_current_label"):
            self.source_current_label.config(text=config['label'])
        self.source_domain_var.set(f"Domain: {config['domain']}")
        sample = config.get('sample') or ''
        self.source_sample_var.set(sample)

    def _refresh_source_tiles_theme(self):
        if not hasattr(self, "source_tiles") or not self.source_tiles:
            return
        colors = getattr(self, "_theme_colors", {}) or {}
        default_bg = colors.get("card_alt", "#1f2a44")
        selected_bg = colors.get("accent_soft", "#2a385f")
        text_color = colors.get("text", "#f5f7ff")
        border = colors.get("border", "#273553")
        accent = colors.get("accent", "#6366f1")
        if hasattr(self, "source_tile_container") and self.source_tile_container:
            self.source_tile_container.configure(bg=colors.get("bg", "#0f172a"))
        current = self.selected_online_source.get() if hasattr(self, "selected_online_source") else None
        for sid, tile_info in self.source_tiles.items():
            tile = tile_info['frame']
            selected = sid == current
            bg = selected_bg if selected else default_bg
            border_color = accent if selected else border
            tile.configure(bg=bg, highlightbackground=border_color, highlightcolor=border_color,
                           highlightthickness=2 if selected else 1)
            for widget in tile_info['widgets']:
                widget.configure(bg=bg, fg=text_color)

    def toggle_browser_overlay(self):
        if self.cookie_window and self.cookie_window.winfo_exists():
            messagebox.showwarning("Trình duyệt", "Vui lòng đóng cửa sổ cookie trước khi mở trình duyệt.")
            return
        if hasattr(self, "browser_overlay") and self.browser_overlay:
            self.browser_overlay.toggle()

    def open_cookie_manager(self):
        overlay_active = (
            hasattr(self, "browser_overlay")
            and self.browser_overlay
            and self.browser_overlay.is_running()
        )
        if overlay_active:
            messagebox.showwarning("Cookie", "Vui lòng đóng cửa sổ trình duyệt trước khi quản lý cookie.")
            return
        if self.cookie_window and self.cookie_window.winfo_exists():
            try:
                self.cookie_window.lift()
                self.cookie_window.focus_set()
                return
            except Exception:
                self.cookie_window = None
        cookie_dir = os.path.dirname(self.cookies_db_path)
        if cookie_dir:
            os.makedirs(cookie_dir, exist_ok=True)
        self.cookie_window = CookieManagerWindow(
            self,
            self.cookies_db_path,
            on_close=self._on_cookie_window_closed
        )
        self._update_cookie_menu_state()

    def _open_source_selector(self):
        if getattr(self, "_source_selector_window", None):
            try:
                self._source_selector_window.focus_set()
                return
            except Exception:
                self._source_selector_window = None
        selector = tk.Toplevel(self)
        selector.title("Chọn nguồn lấy mục lục")
        selector.geometry("520x340")
        selector.transient(self)
        selector.grab_set()
        selector.resizable(False, False)
        self._source_selector_window = selector

        def _cleanup():
            if getattr(self, "_source_selector_window", None):
                self._source_selector_window.grab_release()
            self._source_selector_window = None
            self.source_tiles = {}
            self.source_tile_container = None
            selector.destroy()

        selector.protocol("WM_DELETE_WINDOW", _cleanup)

        outer = ttk.Frame(selector, padding=12)
        outer.pack(fill=tk.BOTH, expand=True)
        self.source_tile_container = tk.Frame(outer, bd=0)
        self.source_tile_container.pack(fill=tk.BOTH, expand=True)

        self.source_tiles = {}
        for idx, src in enumerate(ONLINE_SOURCES):
            row = idx // 3
            col = idx % 3
            self.source_tile_container.grid_rowconfigure(row, weight=1)
            self.source_tile_container.grid_columnconfigure(col, weight=1)
            tile = tk.Frame(self.source_tile_container, bd=0, highlightthickness=1, cursor="hand2")
            tile.grid(row=row, column=col, padx=6, pady=6, sticky="nsew")
            tile.configure(width=150, height=120)
            tile.pack_propagate(False)
            icon = self._load_source_icon(src.get('icon'), src['id'])
            if icon:
                icon_label = tk.Label(tile, image=icon, borderwidth=0)
            else:
                icon_label = tk.Label(tile, text=src['label'], font=("Segoe UI", 11, "bold"),
                                      borderwidth=0, wraplength=110, justify=tk.CENTER)
            icon_label.pack(pady=(6, 2))
            text_label = tk.Label(tile, text=src['label'], font=("Segoe UI", 10, "normal"))
            text_label.pack()
            self.source_tiles[src['id']] = {
                'frame': tile,
                'widgets': [icon_label, text_label]
            }
            def _bind(widget, sid):
                widget.bind("<Button-1>", lambda _e: self._handle_source_selection(sid))
            _bind(tile, src['id'])
            _bind(icon_label, src['id'])
            _bind(text_label, src['id'])

        ttk.Button(outer, text="Đóng", command=_cleanup).pack(pady=(8, 0))
        self._refresh_source_tiles_theme()

    def _handle_source_selection(self, source_id):
        self.selected_online_source.set(source_id)
        self._update_source_info_labels()
        if getattr(self, "_source_selector_window", None):
            try:
                self._source_selector_window.destroy()
            except Exception:
                pass
            self._source_selector_window = None
        self.source_tiles = {}
        self.source_tile_container = None

    def _refresh_background_image(self):
        if not self._background_image_original or not self._background_canvas:
            return
        width = max(1, self._canvas_width or self.winfo_width())
        height = max(1, self._canvas_height or self.winfo_height())
        try:
            resized = self._background_image_original.resize((width, height), Image.LANCZOS)
        except Exception:
            return
        self._background_image = ImageTk.PhotoImage(resized)
        if self._background_image_item is None:
            self._background_image_item = self._background_canvas.create_image(
                0, 0, anchor="nw", image=self._background_image, tags="background_image")
            self._background_canvas.tag_lower(self._background_image_item)
        else:
            self._background_canvas.itemconfig(self._background_image_item, image=self._background_image)
        if self._content_window is not None:
            self._background_canvas.tag_raise(self._content_window)

    def _on_canvas_configure(self, event):
        self._canvas_width = max(1, event.width)
        self._canvas_height = max(1, event.height)
        if self._content_window is not None:
            self._background_canvas.coords(self._content_window, 0, 0)
            self._background_canvas.itemconfigure(self._content_window,
                                                  width=self._canvas_width,
                                                  height=self._canvas_height)
        if self._background_image_original:
            self._refresh_background_image()

    def _update_ui_settings(self, save=True, **changes):
        if not changes:
            return
        self.ui_settings.update({k: v for k, v in changes.items() if v is not None})
        self._pending_font_value = self.ui_settings.get('font_size', self._pending_font_value)
        self._apply_modern_theme(refresh_existing=True)
        self._apply_mouse_glow_setting()
        if save:
            self.save_config()
        self._sync_ui_settings_controls()

    def _sync_ui_settings_controls(self):
        if hasattr(self, "ui_theme_var"):
            self.ui_theme_var.set(self.ui_settings.get('theme', DEFAULT_UI_SETTINGS['theme']))
        if hasattr(self, "ui_accent_var"):
            self.ui_accent_var.set(self.ui_settings.get('accent_color', DEFAULT_UI_SETTINGS['accent_color']))
        if hasattr(self, "ui_text_color_var"):
            self.ui_text_color_var.set(self.ui_settings.get('text_color', DEFAULT_UI_SETTINGS.get('text_color', '')))
        if hasattr(self, "ui_font_var"):
            self.ui_font_var.set(int(self.ui_settings.get('font_size', DEFAULT_UI_SETTINGS['font_size'])))
        if hasattr(self, "ui_glow_var"):
            self.ui_glow_var.set(bool(self.ui_settings.get('mouse_glow', False)))
        if hasattr(self, "font_size_label"):
            self.font_size_label.config(text=f"{self.ui_font_var.get()} pt")
        if hasattr(self, "ui_classic_var"):
            self.ui_classic_var.set(bool(self.ui_settings.get('use_classic_theme', False)))
        if hasattr(self, "ui_background_var"):
            self.ui_background_var.set(self.ui_settings.get('background_image', ''))
        if hasattr(self, "ui_theme_combo"):
            state = "disabled" if self.ui_settings.get('use_classic_theme') else "readonly"
            self.ui_theme_combo.configure(state=state)
        controls = [
            getattr(self, "accent_entry", None),
            getattr(self, "accent_button", None),
            getattr(self, "text_color_entry", None),
            getattr(self, "text_color_button", None),
        ]
        state = "disabled" if self.ui_settings.get('use_classic_theme') else "normal"
        for ctrl in controls:
            if ctrl:
                ctrl.configure(state=state)
        self._update_accent_preview()

    def _update_accent_preview(self):
        if hasattr(self, "accent_preview"):
            color = _normalize_hex_color(self.ui_settings.get('accent_color', '#6366f1'))
            self.accent_preview.config(bg=color)
        self._update_text_color_preview()

    def _update_text_color_preview(self):
        if hasattr(self, "text_color_preview"):
            text_color = self.ui_settings.get('text_color') or self._theme_colors.get('text', '#f5f7ff')
            text_color = _normalize_hex_color(text_color, '#f5f7ff')
            self.text_color_preview.config(bg=text_color)

    def _commit_accent_entry(self):
        entered = self.ui_accent_var.get()
        normalized = _normalize_hex_color(entered, self.ui_settings.get('accent_color', '#6366f1'))
        if normalized != entered:
            self.ui_accent_var.set(normalized)
        if normalized != self.ui_settings.get('accent_color'):
            self._update_ui_settings(accent_color=normalized)
        else:
            self._update_accent_preview()

    def _commit_text_color_entry(self):
        entered = self.ui_text_color_var.get()
        current = self.ui_settings.get('text_color', '')
        if not entered:
            if current:
                self._update_ui_settings(text_color='')
            else:
                self._update_text_color_preview()
            return
        normalized = _normalize_hex_color(entered, current or '#f5f7ff')
        if normalized != entered:
            self.ui_text_color_var.set(normalized)
        if normalized != current:
            self._update_ui_settings(text_color=normalized)
        else:
            self._update_text_color_preview()

    def _open_accent_picker(self):
        initial = self.ui_settings.get('accent_color', '#6366f1')
        color = colorchooser.askcolor(color=initial, parent=self)
        if color and color[1]:
            self.ui_accent_var.set(color[1])
            self._update_ui_settings(accent_color=color[1])

    def _open_text_color_picker(self):
        initial = self.ui_settings.get('text_color') or self._theme_colors.get('text', '#f5f7ff')
        color = colorchooser.askcolor(color=initial, parent=self)
        if color and color[1]:
            self.ui_text_color_var.set(color[1])
            self._update_ui_settings(text_color=color[1])

    def _on_font_scale_change(self, value):
        val = int(round(float(value)))
        self._pending_font_value = val
        if hasattr(self, "font_size_label"):
            self.font_size_label.config(text=f"{val} pt")

    def _commit_font_scale(self, _event=None):
        val = int(self._pending_font_value)
        if val != self.ui_settings.get('font_size'):
            self.ui_font_var.set(val)
            self._update_ui_settings(font_size=val)

    def _toggle_classic_theme(self):
        desired = bool(self.ui_classic_var.get())
        if desired != bool(self.ui_settings.get('use_classic_theme')):
            self._update_ui_settings(use_classic_theme=desired)
        else:
            self._sync_ui_settings_controls()

    def _toggle_mouse_glow(self):
        desired = bool(self.ui_glow_var.get())
        if desired != self.ui_settings.get('mouse_glow'):
            self._update_ui_settings(mouse_glow=desired)
        else:
            self._apply_mouse_glow_setting()

    def _choose_background_image(self):
        filetypes = [
            ("Ảnh", "*.png *.jpg *.jpeg *.bmp *.gif"),
            ("PNG", "*.png"),
            ("JPEG", "*.jpg *.jpeg"),
            ("BMP", "*.bmp"),
            ("GIF", "*.gif"),
            ("Tất cả", "*.*"),
        ]
        initial_src = self.ui_settings.get('background_image', '') or BASE_DIR
        initial_dir = initial_src if os.path.isdir(initial_src) else os.path.dirname(initial_src)
        if not initial_dir or not os.path.isdir(initial_dir):
            initial_dir = BASE_DIR
        path = filedialog.askopenfilename(title="Chọn ảnh nền", initialdir=initial_dir, filetypes=filetypes)
        if path:
            try:
                stored = self._copy_background_into_app(path)
            except Exception as exc:
                messagebox.showerror("Lỗi", f"Không thể sao chép ảnh nền: {exc}")
                return
            path = stored
            if hasattr(self, "ui_background_var"):
                self.ui_background_var.set(path)
            self._update_ui_settings(background_image=path)

    def _clear_background_image(self):
        if self.ui_settings.get('background_image'):
            if hasattr(self, "ui_background_var"):
                self.ui_background_var.set('')
            self._update_ui_settings(background_image='')
        else:
            if hasattr(self, "ui_background_var"):
                self.ui_background_var.set('')
            self._apply_background_image()

    def _copy_background_into_app(self, source_path):
        os.makedirs(BACKGROUND_DIR, exist_ok=True)
        base = os.path.basename(source_path)
        name, ext = os.path.splitext(base)
        sanitized = re.sub(r'[^A-Za-z0-9_-]+', '_', name).strip('_') or "bg"
        timestamp = int(time.time())
        dest_name = f"{sanitized}_{timestamp}{ext.lower()}"
        dest_path = os.path.join(BACKGROUND_DIR, dest_name)
        shutil.copy2(source_path, dest_path)
        return os.path.relpath(dest_path, BASE_DIR)

    def _reset_ui_theme(self):
        self.ui_settings = dict(DEFAULT_UI_SETTINGS)
        self._pending_font_value = self.ui_settings['font_size']
        self._apply_modern_theme(refresh_existing=True)
        self._apply_mouse_glow_setting()
        self._sync_ui_settings_controls()
        self.save_config()

    def _supports_mouse_glow(self):
        return sys.platform.startswith('win') and ctypes is not None

    def _apply_mouse_glow_setting(self):
        enable = bool(self.ui_settings.get('mouse_glow'))
        if enable and not self._supports_mouse_glow():
            if not self._mouse_glow_warning_shown:
                messagebox.showinfo("Thông báo", "Hiệu ứng chuột chỉ hỗ trợ trên Windows và cần quyền nâng cao.")
                self._mouse_glow_warning_shown = True
            enable = False
            self.ui_settings['mouse_glow'] = False
            if hasattr(self, "ui_glow_var"):
                self.ui_glow_var.set(False)
        if enable and not self._cursor_glow_window:
            self._attach_mouse_glow()
        elif not enable and self._cursor_glow_window:
            self._detach_mouse_glow()
        self._cursor_glow_enabled = enable

    def _attach_mouse_glow(self):
        if not self._supports_mouse_glow():
            return
        if not self._cursor_motion_binding_active:
            self.bind_all("<Motion>", self._handle_cursor_motion, add="+")
            self._cursor_motion_binding_active = True
        glow = tk.Toplevel(self)
        glow.withdraw()
        glow.overrideredirect(True)
        glow.attributes("-topmost", True)
        glow.configure(bg="white")
        try:
            glow.wm_attributes("-transparentcolor", "white")
        except tk.TclError:
            pass
        _make_window_clickthrough(glow)
        canvas = tk.Canvas(glow, width=48, height=48, highlightthickness=0, bd=0, bg="white")
        canvas.pack(fill=tk.BOTH, expand=True)
        self._cursor_glow_window = glow
        self._cursor_glow_canvas = canvas
        self._cursor_glow_item = None

    def _detach_mouse_glow(self):
        if self._cursor_glow_after:
            try:
                self.after_cancel(self._cursor_glow_after)
            except Exception:
                pass
            self._cursor_glow_after = None
        if self._cursor_glow_window:
            try:
                self._cursor_glow_window.withdraw()
                self._cursor_glow_window.destroy()
            except Exception:
                pass
        self._cursor_glow_window = None
        self._cursor_glow_canvas = None
        self._cursor_glow_item = None

    def _handle_cursor_motion(self, event):
        if not self.ui_settings.get('mouse_glow') or not self._cursor_glow_window or not self._cursor_glow_canvas:
            return
        now = time.perf_counter()
        if now - getattr(self, "_cursor_last_update", 0) < 0.03:
            return
        self._cursor_last_update = now
        size = 36
        x = event.x_root - size // 2
        y = event.y_root - size // 2
        self._cursor_glow_window.geometry(f"{size}x{size}+{x}+{y}")
        if not self._cursor_glow_window.winfo_viewable():
            self._cursor_glow_window.deiconify()
        color = self._theme_colors.get('accent', '#ffffff')
        canvas = self._cursor_glow_canvas
        if not self._cursor_glow_item:
            self._cursor_glow_item = canvas.create_oval(4, 4, size - 4, size - 4, fill=color, outline="")
        else:
            canvas.coords(self._cursor_glow_item, 4, 4, size - 4, size - 4)
            canvas.itemconfig(self._cursor_glow_item, fill=color)
        if self._cursor_glow_after:
            try:
                self.after_cancel(self._cursor_glow_after)
            except Exception:
                pass
        self._cursor_glow_after = self.after(90, self._fade_cursor_glow)

    def _fade_cursor_glow(self):
        if self._cursor_glow_window:
            self._cursor_glow_window.withdraw()
        self._cursor_glow_after = None

    def on_closing(self):
        """Hỏi lưu file nếu cần, sau đó lưu cấu hình trước khi đóng."""
        if self.text_modified.get():
            response = messagebox.askyesnocancel(
                "Lưu thay đổi?",
                "Bạn có các thay đổi chưa được lưu. Bạn có muốn lưu chúng trước khi thoát không?"
            )
            if response is True:
                saved_successfully = self._save_changes()
                if not saved_successfully:
                    return
            elif response is None:
                return
        self.save_config()
        if hasattr(self, "browser_overlay") and self.browser_overlay:
            self.browser_overlay.hide()
        self._detach_mouse_glow()
        self.destroy()

    def save_config(self):
        """Thu thập và lưu tất cả cài đặt vào file config.json."""
        # Cập nhật các giá trị từ UI vào self.app_config
        self.app_config.update({
            'folder_path': self.folder_path.get(),
            'rename_strategy': self.strategy.get(),
            'sort_strategy': self.sort_strategy.get(),
            'rename_format': self.format_combobox.get(),
            'rename_format_history': list(self.format_combobox['values']),
            'filename_regexes': self.filename_regex_text.get("1.0", tk.END).strip(),
            'content_regexes': self.content_regex_text.get("1.0", tk.END).strip(),
            'credit_text': self.credit_text_widget.get("1.0", tk.END).strip(),
            'credit_position': self.credit_position.get(),
            'credit_line_num': self.credit_line_num.get(),
            'find_replace_history': {
                'find': list(self.find_text['values']),
                'replace': list(self.replace_text['values'])
            },
            'split_regex_history': list(self.split_regex['values']),
            'split_regex_last': self.split_regex.get(),
            'split_format_history': list(self.split_format_combobox['values']),
            'selected_file': self.selected_file.get(),
            'split_position': self.split_position.get(),
            'combine_titles': self.combine_titles_var.get(),
            'title_format': self.title_format_var.get(),
        })
        self.app_config['ui_settings'] = self.ui_settings
        self.app_config['wikidich'] = {
            'cache_path': self.wikidich_cache_path
        }
        self.app_config['api_settings'] = dict(self.api_settings or {})
        self.app_config['regex_pins'] = dict(self.regex_pins)
        try:
            with open('config.json', 'w', encoding='utf-8') as f:
                json.dump(self.app_config, f, indent=4)
        except Exception as e:
            print(f"Không thể lưu config: {e}")

    # main_ui.py

    def load_config(self):
        """Tải và áp dụng cài đặt từ config.json nếu có."""
        try:
            if os.path.exists('config.json'):
                with open('config.json', 'r', encoding='utf-8') as f:
                    loaded_config = json.load(f)
                for key, value in loaded_config.items():
                    if isinstance(value, dict) and key in self.app_config:
                        self.app_config[key].update(value)
                    else:
                        self.app_config[key] = value

            config_data = self.app_config
            self.regex_pins = dict(config_data.get('regex_pins', {'find': [], 'replace': [], 'split': []}))
            api_cfg = config_data.get('api_settings', {}) if isinstance(config_data.get('api_settings'), dict) else {}
            self.api_settings = {**DEFAULT_API_SETTINGS, **api_cfg}
            self.folder_path.set(config_data.get('folder_path', ''))
            self.strategy.set(config_data.get('rename_strategy', 'content_first'))
            self.sort_strategy.set(config_data.get('sort_strategy', 'content'))
            
            format_history = config_data.get('rename_format_history', [])
            if not format_history: format_history = ["Chương {num} - {title}.txt"]
            self.format_combobox['values'] = format_history
            self.format_combobox.set(config_data.get('rename_format', format_history[0]))
            
            self.filename_regex_text.delete("1.0", tk.END); self.filename_regex_text.insert("1.0", config_data.get('filename_regexes', ''))
            self.content_regex_text.delete("1.0", tk.END); self.content_regex_text.insert("1.0", config_data.get('content_regexes', ''))
            self.credit_text_widget.delete("1.0", tk.END); self.credit_text_widget.insert("1.0", config_data.get('credit_text', ''))
            self.credit_position.set(config_data.get('credit_position', 'top'))
            self.credit_line_num.set(config_data.get('credit_line_num', 2))
            
            fr_history = config_data.get('find_replace_history', {})
            self._apply_history_with_pins(self.find_text, fr_history.get('find', []), 'find')
            self._apply_history_with_pins(self.replace_text, fr_history.get('replace', []), 'replace')
            split_regex_history = config_data.get('split_regex_history', [])
            self._apply_history_with_pins(self.split_regex, split_regex_history, 'split')
            # đồng bộ nút ghim
            self._sync_pin_button('find', self.find_text, getattr(self, "find_pin_btn", None))
            self._sync_pin_button('split', self.split_regex, getattr(self, "split_pin_btn", None))
            if split_regex_history:
                self.split_regex.set(config_data.get('split_regex_last', split_regex_history[0]))
            else:
                self.split_regex.set(config_data.get('split_regex_last', ''))
            
            split_format_history = config_data.get('split_format_history', []); self.split_format_combobox['values'] = split_format_history or ["{num}.txt"]; self.split_format_combobox.set((split_format_history or ["{num}.txt"])[0])
            self.split_position.set(config_data.get('split_position', 'after'))
            self.combine_titles_var.set(config_data.get('combine_titles', False)); self.title_format_var.set(config_data.get('title_format', '{t1} - {t2}'))
            
            name_sets_keys = list(self.app_config.get('nameSets', {}).keys())
            if name_sets_keys:
                self.translator_name_set_combo['values'] = name_sets_keys
            
            active_set = config_data.get('activeNameSet', 'Mặc định')
            if active_set in name_sets_keys:
                self.translator_name_set_combo.set(active_set)
            elif name_sets_keys:
                self.translator_name_set_combo.set(name_sets_keys[0])
            self._refresh_translator_name_preview()

            wd_cfg = config_data.get('wikidich', {})
            if isinstance(wd_cfg, dict):
                self.wikidich_cache_path = wd_cfg.get('cache_path', self.wikidich_cache_path)
            if hasattr(self, "wd_search_var"):
                self.wd_search_var.set(self.wikidich_filters.get('search', ''))
                self.wd_summary_var.set(self.wikidich_filters.get('summarySearch', ''))
                self.wd_status_var.set(self.wikidich_filters.get('status', 'all'))
                self._wd_set_sort_label_from_value(self.wikidich_filters.get('sortBy', 'recent'))
            self._wd_sync_filter_controls_from_filters()
            self._wd_load_cache()

            if self.folder_path.get(): self.schedule_preview_update()
            self.selected_file.set(config_data.get('selected_file', ''))
            ui_settings = config_data.get('ui_settings')
            if isinstance(ui_settings, dict):
                self.ui_settings.update(ui_settings)
                self._apply_modern_theme(refresh_existing=True)
                self._sync_ui_settings_controls()
                self._apply_mouse_glow_setting()
            self.app_config['api_settings'] = dict(self.api_settings)
        except Exception as e:
            print(f"Không thể tải config: {e}")
            self.log("Không tìm thấy file config hoặc file bị lỗi. Sử dụng cài đặt mặc định.")

    def _load_local_manifest(self):
        """Đọc version.json local và trả về manifest (kèm nội dung ghi chú nếu có)."""
        manifest_path = os.path.join(BASE_DIR, 'version.json')
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
        except Exception:
            return None

        nf = manifest.get('notes_file')
        if nf and not manifest.get('notes'):
            if isinstance(nf, str) and nf.lower().startswith(('http://', 'https://')):
                try:
                    with urllib.request.urlopen(nf, timeout=6) as r:
                        manifest['notes'] = r.read().decode('utf-8')
                except Exception:
                    manifest['notes'] = ''
            else:
                try:
                    with open(nf, 'r', encoding='utf-8') as nfobj:
                        manifest['notes'] = nfobj.read()
                except Exception:
                    manifest['notes'] = ''
        return manifest

    def check_for_updates(self, manual_check=False):
        """Kiểm tra phiên bản mới (thread riêng)."""
        def _check():
            try:
                manifest = None

                if not self.use_local_manifest_only:
                    try:
                        manifest = fetch_manifest_from_url(self.VERSION_CHECK_URL, timeout=10)
                    except Exception:
                        manifest = None

                if not manifest:
                    manifest = self._load_local_manifest()

                if not manifest:
                    if manual_check:
                        msg = "Không lấy được thông tin cập nhật (mất kết nối hoặc manifest không hợp lệ)."
                        if self.use_local_manifest_only:
                            msg = "Không đọc được version.json local để debug."
                        self.after(0, lambda: messagebox.showinfo("Kiểm tra cập nhật", msg))
                    return

                latest_version_str = manifest.get("version")
                download_url = manifest.get("url")

                if latest_version_str and parse_version(latest_version_str) > parse_version(self.CURRENT_VERSION):
                    try:
                        self.save_config()
                    except Exception:
                        pass
                    try:
                        self.after(0, lambda: show_update_window(self, manifest))
                    except Exception:
                        self.after(0, lambda: messagebox.showinfo("Cập nhật", f"Phát hiện phiên bản {latest_version_str}. Tải: {download_url}"))
                else:
                    if manual_check:
                        self.after(0, lambda: messagebox.showinfo("Kiểm tra cập nhật", "Bạn đang sử dụng phiên bản mới nhất."))
            except Exception as e:
                print(f"Lỗi kiểm tra cập nhật: {e}")
                if manual_check:
                    self.after(0, lambda: messagebox.showerror("Lỗi", "Không thể kiểm tra cập nhật. Vui lòng kiểm tra kết nối mạng."))
        threading.Thread(target=_check, daemon=True).start()

    def create_widgets(self):
        self._apply_modern_theme()
        colors = getattr(self, "_theme_colors", {})
        classic_theme = bool(self.ui_settings.get('use_classic_theme'))

        # --- Các phần layout chính (folder_frame, main_paned_window, notebook, log_frame)---
        main_frame = ttk.Frame(self._background_canvas, padding="18", style="App.TFrame")
        self._content_window = self._background_canvas.create_window(
            0, 0, anchor="nw", window=main_frame, width=self._canvas_width or self.winfo_width(),
            height=self._canvas_height or self.winfo_height()
        )
        self._background_canvas.tag_raise(self._content_window)

        # === TẠO MENU BAR ===
        if classic_theme:
            menubar = tk.Menu(self)
            menu_style = {"tearoff": 0}
        else:
            menu_style = {
                "tearoff": 0,
                "background": colors.get("card", "#1c2541"),
                "foreground": colors.get("text", "#f5f7ff"),
                "activebackground": colors.get("accent", "#6366f1"),
                "activeforeground": "#ffffff",
                "bd": 0,
                "relief": tk.FLAT
            }
        menubar = tk.Menu(self, background=colors.get("bg", "#0f172a"),
                              foreground=colors.get("text", "#f5f7ff"),
                              activebackground=colors.get("accent", "#6366f1"),
                              activeforeground="#ffffff",
                              bd=0, relief=tk.FLAT)
        self.config(menu=menubar)
        self.menubar = menubar
        self.browser_menu_label = "Trình duyệt"
        self.cookie_menu_label = "Cookie"

        tools_menu = tk.Menu(menubar, **menu_style)
        menubar.add_cascade(label="Công cụ", menu=tools_menu)
        tools_menu.add_command(label="Giải nén file (.zip, .7z, .rar...)", command=self._start_extraction)

        menubar.add_command(label="Dịch", command=lambda: self._select_tab_by_name("Dịch"))
        menubar.add_command(label="Proxy", command=self._open_proxy_manager_window)
        menubar.add_command(label=self.browser_menu_label, command=self.toggle_browser_overlay)
        menubar.add_command(label=self.cookie_menu_label, command=self.open_cookie_manager)

        # Menu Trợ giúp
        help_menu = tk.Menu(menubar, **menu_style)
        menubar.add_cascade(label="Trợ giúp", menu=help_menu)
        help_menu.add_command(label="Hướng dẫn Regex", command=lambda: self.show_regex_guide("general"))
        help_menu.add_command(label="Hướng dẫn thao tác", command=self.show_operation_guide)
        help_menu.add_separator()
        help_menu.add_command(label="Kiểm tra cập nhật...", command=lambda: self.check_for_updates(manual_check=True))

        folder_frame = ttk.LabelFrame(main_frame, text="1. Chọn thư mục", padding="12", style="Section.TLabelframe")
        folder_frame.pack(fill=tk.X, expand=False, pady=(0, 8))
        
        ttk.Entry(folder_frame, textvariable=self.folder_path, state="readonly").pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 8))
        ttk.Button(folder_frame, text="Chọn...", command=self.select_folder).pack(side=tk.LEFT)

        self.main_paned_window = ttk.PanedWindow(main_frame, orient=tk.VERTICAL)
        self.main_paned_window.pack(fill=tk.BOTH, expand=True)

        self.content_panel = ttk.Frame(self.main_paned_window, style="Card.TFrame")
        self.notebook = ttk.Notebook(self.content_panel)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        self.notebook.bind("<<NotebookTabChanged>>", self._on_notebook_tab_changed)
        self.main_paned_window.add(self.content_panel, weight=3)
        
        self.create_rename_tab()
        self.create_credit_tab()
        self.create_online_fetch_tab()
        self.create_text_operations_tab()
        self.create_translator_tab()
        self. create_image_processing_tab()
        self.create_wikidich_tab()
        self.create_settings_tab()

        log_frame = ttk.LabelFrame(self.main_paned_window, text="Nhật ký hoạt động", padding="8", style="Section.TLabelframe")
        self.log_text = scrolledtext.ScrolledText(log_frame, height=8, state='disabled', wrap=tk.WORD)
        if not classic_theme:
            self.log_text.configure(bg=colors.get("input_bg", "#111a32"), fg=colors.get("text", "#f5f7ff"),
                                    insertbackground=colors.get("accent", "#6366f1"), highlightthickness=1,
                                    highlightbackground=colors.get("border", "#273553"), relief=tk.FLAT, bd=0)
        self.log_text.pack(fill=tk.BOTH, expand=True)
        self.main_paned_window.add(log_frame, weight=1)
        self._apply_mouse_glow_setting()
        self._apply_background_image()
        self.browser_overlay = BrowserOverlay(self)
        if not self.browser_overlay.available():
            self._set_browser_menu_state(False)
        self._update_cookie_menu_state()

    def create_settings_tab(self):
        settings_tab = ttk.Frame(self.notebook, padding="16")
        self.notebook.add(settings_tab, text="Cài đặt")
        settings_tab.columnconfigure(1, weight=1)

        appearance_frame = ttk.LabelFrame(settings_tab, text="Giao diện hiện đại", padding=14, style="Section.TLabelframe")
        appearance_frame.grid(row=0, column=0, sticky="ew", columnspan=2)
        appearance_frame.columnconfigure(1, weight=1)

        ttk.Label(appearance_frame, text="Bảng màu:").grid(row=0, column=0, sticky="w", pady=(0, 6))
        self.ui_theme_var = tk.StringVar(value=self.ui_settings.get('theme', 'Midnight'))
        self.ui_theme_combo = ttk.Combobox(appearance_frame, state="readonly", values=list(THEME_PRESETS.keys()),
                                           textvariable=self.ui_theme_var)
        self.ui_theme_combo.grid(row=0, column=1, sticky="ew", padx=(0, 8), pady=(0, 6))
        self.ui_theme_combo.bind("<<ComboboxSelected>>", lambda _e: self._update_ui_settings(theme=self.ui_theme_var.get()))

        ttk.Label(appearance_frame, text="Màu nhấn (hex):").grid(row=1, column=0, sticky="w")
        self.ui_accent_var = tk.StringVar(value=self.ui_settings.get('accent_color', '#6366f1'))
        self.accent_entry = ttk.Entry(appearance_frame, textvariable=self.ui_accent_var)
        self.accent_entry.grid(row=1, column=1, sticky="ew", padx=(0, 8))
        self.accent_entry.bind("<FocusOut>", lambda _e: self._commit_accent_entry())
        self.accent_button = ttk.Button(appearance_frame, text="Chọn màu", command=self._open_accent_picker)
        self.accent_button.grid(row=1, column=2, sticky="w")
        self.accent_preview = tk.Label(appearance_frame, width=4, height=1, relief=tk.FLAT, borderwidth=0)
        self.accent_preview.grid(row=1, column=3, padx=(10, 0))

        ttk.Label(appearance_frame, text="Màu chữ:").grid(row=2, column=0, sticky="w")
        self.ui_text_color_var = tk.StringVar(value=self.ui_settings.get('text_color', ''))
        self.text_color_entry = ttk.Entry(appearance_frame, textvariable=self.ui_text_color_var)
        self.text_color_entry.grid(row=2, column=1, sticky="ew", padx=(0, 8))
        self.text_color_entry.bind("<FocusOut>", lambda _e: self._commit_text_color_entry())
        self.text_color_button = ttk.Button(appearance_frame, text="Chọn màu", command=self._open_text_color_picker)
        self.text_color_button.grid(row=2, column=2, sticky="w")
        self.text_color_preview = tk.Label(appearance_frame, width=4, height=1, relief=tk.FLAT, borderwidth=0)
        self.text_color_preview.grid(row=2, column=3, padx=(10, 0))

        ttk.Label(appearance_frame, text="Kích thước chữ:").grid(row=3, column=0, sticky="w", pady=(10, 0))
        self.ui_font_var = tk.IntVar(value=int(self.ui_settings.get('font_size', 10)))
        font_scale = ttk.Scale(appearance_frame, from_=9, to=14, orient=tk.HORIZONTAL,
                               command=self._on_font_scale_change)
        font_scale.set(self.ui_font_var.get())
        font_scale.grid(row=3, column=1, columnspan=2, sticky="ew", pady=(10, 0))
        font_scale.bind("<ButtonRelease-1>", self._commit_font_scale)
        self.font_size_label = ttk.Label(appearance_frame, text=f"{self.ui_font_var.get()} pt")
        self.font_size_label.grid(row=3, column=3, sticky="w", padx=(10, 0))

        self.ui_classic_var = tk.BooleanVar(value=bool(self.ui_settings.get('use_classic_theme', False)))
        ttk.Checkbutton(appearance_frame,
                        text="Sử dụng giao diện cổ điển (ttk gốc)",
                        variable=self.ui_classic_var,
                        command=self._toggle_classic_theme).grid(row=4, column=0, columnspan=3, sticky="w", pady=(12, 0))

        animation_frame = ttk.LabelFrame(settings_tab, text="Hiệu ứng chuột", padding=14, style="Section.TLabelframe")
        animation_frame.grid(row=1, column=0, sticky="ew", pady=(12, 0), columnspan=2)
        animation_frame.columnconfigure(0, weight=1)

        self.ui_glow_var = tk.BooleanVar(value=bool(self.ui_settings.get('mouse_glow', False)))
        ttk.Checkbutton(animation_frame,
                        text="Bật vòng sáng theo chuột (thử nghiệm)",
                        variable=self.ui_glow_var,
                        command=self._toggle_mouse_glow).grid(row=0, column=0, sticky="w")
        ttk.Label(animation_frame,
                  text="Tạo hiệu ứng highlight nhẹ khi di chuyển chuột quanh ứng dụng.").grid(row=1, column=0, sticky="w",
                                                                                          pady=(4, 0))

        bg_frame = ttk.LabelFrame(settings_tab, text="Ảnh nền", padding=14, style="Section.TLabelframe")
        bg_frame.grid(row=2, column=0, columnspan=2, sticky="ew", pady=(12, 0))
        bg_frame.columnconfigure(1, weight=1)
        ttk.Label(bg_frame, text="Đường dẫn:").grid(row=0, column=0, sticky="w")
        self.ui_background_var = tk.StringVar(value=self.ui_settings.get('background_image', ''))
        bg_entry = ttk.Entry(bg_frame, textvariable=self.ui_background_var, state="readonly")
        bg_entry.grid(row=0, column=1, sticky="ew", padx=(6, 6))
        ttk.Button(bg_frame, text="Chọn ảnh...", command=self._choose_background_image).grid(row=0, column=2, sticky="w")
        ttk.Button(bg_frame, text="Xóa ảnh", command=self._clear_background_image).grid(row=0, column=3, sticky="w", padx=(6, 0))
        ttk.Label(bg_frame, text="Ảnh sẽ tự co giãn theo cửa sổ. Hỗ trợ: PNG, JPG, JPEG, BMP.").grid(row=1, column=0, columnspan=4, sticky="w", pady=(6, 0))

        actions_frame = ttk.Frame(settings_tab)
        actions_frame.grid(row=3, column=0, columnspan=2, sticky="ew", pady=(16, 0))
        ttk.Button(actions_frame, text="Khôi phục mặc định", command=self._reset_ui_theme).pack(side=tk.LEFT)
        ttk.Button(actions_frame, text="Lưu cấu hình ngay", command=self.save_config).pack(side=tk.LEFT, padx=(8, 0))

        self._sync_ui_settings_controls()

    def create_rename_tab(self):
        rename_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(rename_tab, text="Đổi Tên")
        rename_tab.columnconfigure(0, weight=1)
        rename_tab.rowconfigure(1, weight=1)

        rename_paned_window = ttk.PanedWindow(rename_tab, orient=tk.VERTICAL)
        rename_paned_window.grid(row=0, column=0, sticky="nsew", rowspan=2)

        # Options frame in top pane
        options_frame = ttk.LabelFrame(rename_paned_window, text="2. Tùy chọn", padding="10")
        rename_paned_window.add(options_frame, weight=1)
        options_frame.columnconfigure(1, weight=1)

        # === KHU VỰC ĐƯỢC THAY ĐỔI ===
        # Frame chính cho hàng tùy chọn đầu tiên
        strategy_sort_frame = ttk.Frame(options_frame)
        strategy_sort_frame.grid(row=0, column=0, columnspan=3, sticky="ew")
        strategy_sort_frame.columnconfigure(0, weight=1)
        strategy_sort_frame.columnconfigure(1, weight=1)
        strategy_sort_frame.columnconfigure(2, weight=1)

        # Cột 1: Chọn nguồn lấy số chương
        num_source_frame = ttk.Frame(strategy_sort_frame)
        num_source_frame.grid(row=0, column=0, sticky="w")
        ttk.Label(num_source_frame, text="Lấy số từ:").pack(side=tk.LEFT, padx=(0, 10))
        self.strategy = tk.StringVar(value="content_first")
        ttk.Radiobutton(num_source_frame, text="Ưu tiên nội dung", variable=self.strategy, value="content_first", command=self.schedule_preview_update).pack(side=tk.LEFT)
        ttk.Radiobutton(num_source_frame, text="Ưu tiên tên file", variable=self.strategy, value="filename_first", command=self.schedule_preview_update).pack(side=tk.LEFT, padx=(5,0))

        # Cột 2: Chọn cách sắp xếp
        sort_by_frame = ttk.Frame(strategy_sort_frame)
        sort_by_frame.grid(row=0, column=1, sticky="w", padx=(20, 0))
        ttk.Label(sort_by_frame, text="Sắp xếp theo số của:").pack(side=tk.LEFT, padx=(0, 10))
        # self.sort_strategy đã được tạo trong __init__
        ttk.Radiobutton(sort_by_frame, text="Nội dung", variable=self.sort_strategy, value="content", command=self._sort_and_refresh_ui).pack(side=tk.LEFT)
        ttk.Radiobutton(sort_by_frame, text="Tên file", variable=self.sort_strategy, value="filename", command=self._sort_and_refresh_ui).pack(side=tk.LEFT, padx=(5,0))
        
         # Cột 3: Sửa dòng đầu file ---
        self.edit_first_line_var = tk.BooleanVar(value=False)
        edit_line_frame = ttk.Frame(strategy_sort_frame)
        edit_line_frame.grid(row=0, column=2, sticky="w", padx=(20, 0))
        self.edit_first_line_chk = ttk.Checkbutton(
            edit_line_frame,
            text="Sửa dòng đầu của file",
            variable=self.edit_first_line_var,
            command=lambda: self._toggle_force_edit_first_line(schedule=True)
        )
        self.edit_first_line_chk.pack(side=tk.LEFT)
        self.force_edit_first_line_var = tk.BooleanVar(value=False)
        self.force_edit_first_line_chk = ttk.Checkbutton(
            edit_line_frame,
            text="Bắt buộc sửa (kể cả khi lỗi)",
            variable=self.force_edit_first_line_var,
            state=tk.DISABLED
        )
        # chỉ hiển thị khi bật sửa dòng đầu
        self._toggle_force_edit_first_line(schedule=False)
        
        ttk.Label(options_frame, text="Cấu trúc mới:").grid(row=1, column=0, sticky="w", padx=5, pady=(10, 5))
        self.format_combobox = ttk.Combobox(options_frame, values=["Chương {num} - {title}.txt"])
        self.format_combobox.grid(row=1, column=1, columnspan=2, sticky="we", padx=5)
        self.format_combobox.set("Chương {num} - {title}.txt")
        self.format_combobox.bind("<KeyRelease>", self.schedule_preview_update)
        ttk.Label(options_frame, text="(Dùng {num}, {title}, và {num + n} hoặc {num - n})").grid(row=2, column=1, columnspan=2, sticky="w", padx=5)
        
        ttk.Label(options_frame, text="Regex (tên file):").grid(row=3, column=0, sticky="nw", padx=5, pady=(10, 5))
        self.filename_regex_text = tk.Text(options_frame, height=2, wrap=tk.WORD, undo=True)
        self.filename_regex_text.grid(row=3, column=1, sticky="we", padx=5)
        self.filename_regex_text.bind("<KeyRelease>", self.schedule_preview_update)
        ttk.Button(options_frame, text="?", width=1, command=self.show_regex_guide).grid(row=3, column=2, sticky="n", padx=(0, 5), pady=(10, 0))
        ttk.Label(options_frame, text="(Mỗi dòng là một mẫu Regex)").grid(row=4, column=1, sticky="w", padx=5)

        ttk.Label(options_frame, text="Regex (nội dung):").grid(row=5, column=0, sticky="nw", padx=5, pady=5)
        self.content_regex_text = tk.Text(options_frame, height=2, wrap=tk.WORD, undo=True)
        self.content_regex_text.grid(row=5, column=1, sticky="we", padx=5, pady=5)
        self.content_regex_text.bind("<KeyRelease>", self.schedule_preview_update)
        ttk.Button(options_frame, text="?", width=1, command=self.show_regex_guide).grid(row=5, column=2, sticky="n", padx=(0, 5), pady=(5, 0))
        ttk.Label(options_frame, text="(Mỗi dòng là một mẫu Regex)").grid(row=6, column=1, sticky="w", padx=5)

        # Custom title frame (giữ nguyên)
        custom_title_frame = ttk.LabelFrame(rename_paned_window, text="3. Sử dụng tiêu đề tùy chỉnh (Tùy chọn)", padding=10)
        rename_paned_window.add(custom_title_frame, weight=1)
        custom_title_frame.columnconfigure(0, weight=1)
        custom_title_frame.rowconfigure(1, weight=1)

        self.use_custom_titles = tk.BooleanVar(value=False)
        ttk.Checkbutton(custom_title_frame, text="Kích hoạt (Mỗi dòng là một tiêu đề, áp dụng theo thứ tự file đã sắp xếp)", variable=self.use_custom_titles, command=self.schedule_preview_update).grid(row=0, column=0, columnspan=2, sticky="w")
        
        self.custom_titles_text = scrolledtext.ScrolledText(custom_title_frame, height=5, wrap=tk.WORD, undo=True)
        self.custom_titles_text.grid(row=1, column=0, columnspan=2, sticky="ewns", pady=(5,0))
        
        # Preview frame (giữ nguyên)
        preview_frame = ttk.LabelFrame(rename_paned_window, text="4. Xem trước và Hành động", padding="10")
        rename_paned_window.add(preview_frame, weight=3)
        preview_frame.columnconfigure(0, weight=1)
        preview_frame.rowconfigure(1, weight=1)

        actions_bar = ttk.Frame(preview_frame)
        actions_bar.grid(row=0, column=0, sticky="ew", pady=(0, 5))
        ttk.Label(actions_bar, text="Tìm kiếm:").pack(side=tk.LEFT, padx=(0, 5))
        self.search_var = tk.StringVar()
        search_entry = ttk.Entry(actions_bar, textvariable=self.search_var)
        search_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
        search_entry.bind("<KeyRelease>", self._search_files)
        ttk.Button(actions_bar, text="Loại trừ file đã chọn", command=lambda: self._toggle_exclusion(exclude=True)).pack(side=tk.LEFT, padx=5)
        ttk.Button(actions_bar, text="Bao gồm lại", command=lambda: self._toggle_exclusion(exclude=False)).pack(side=tk.LEFT, padx=5)
        ttk.Button(actions_bar, text="BẮT ĐẦU ĐỔI TÊN", command=self.start_renaming).pack(side=tk.LEFT, padx=5)
        cols = ("Trạng thái", "Tên file gốc", "Số (tên file)", "Số (nội dung)", "Tên file mới")
        self.tree = ttk.Treeview(preview_frame, columns=cols, show='headings', selectmode='extended')

        self.tree_filepaths = {}
        self.tree.bind("<Double-1>", self._open_preview_from_rename)

        self.tree.grid(row=1, column=0, sticky="nsew")
        self.tree.tag_configure("excluded", foreground="red")
        for col, width in zip(cols, [80, 300, 100, 100, 300]):
            self.tree.heading(col, text=col); self.tree.column(col, width=width)
        
        vsb = ttk.Scrollbar(preview_frame, orient="vertical", command=self.tree.yview)
        vsb.grid(row=1, column=1, sticky="ns")
        self.tree.configure(yscrollcommand=vsb.set)

    def show_regex_guide(self, guide_type="rename"):
        help_window = tk.Toplevel(self)
        help_window.title("Hướng dẫn sử dụng Regex")
        help_window.geometry("700x600") 
        help_window.transient(self)

        main_frame = ttk.Frame(help_window, padding="15")
        main_frame.pack(fill="both", expand=True)

        guide_notebook = ttk.Notebook(main_frame)
        guide_notebook.pack(fill="both", expand=True, pady=(0, 10))

        # --- Tab 1: Ký hiệu chung ---
        common_symbols_tab = scrolledtext.ScrolledText(guide_notebook, wrap=tk.WORD)
        guide_notebook.add(common_symbols_tab, text="Ký hiệu chung")
        common_content = """
Regex (Biểu thức chính quy) là một công cụ mạnh mẽ để tìm kiếm và xử lý văn bản dựa trên các 'khuôn mẫu'.

--- CÁC KÝ HIỆU CƠ BẢN ---
.         - Khớp với bất kỳ ký tự nào (trừ dòng mới).
\\d        - Khớp với một chữ số (0-9).
\\D        - Khớp với ký tự KHÔNG phải là số.
\\w        - Khớp với ký tự chữ, số, hoặc gạch dưới (_).
\\s        - Khớp với khoảng trắng (dấu cách, tab, xuống dòng).
\\n        - Khớp với ký tự xuống dòng (new line).
\\t        - Khớp với ký tự tab.
^         - Bắt đầu một chuỗi hoặc một dòng (ở chế độ multi-line).
$         - Kết thúc một chuỗi hoặc một dòng.
\\b        - Ranh giới của một từ (word boundary).

--- LƯỢNG TỪ (Quantifiers) ---
*         - 0 hoặc nhiều lần. Vd: a*
+         - 1 hoặc nhiều lần. Vd: a+
?         - 0 hoặc 1 lần. Vd: colou?r (khớp 'color' và 'colour')
{n}       - Chính xác n lần. Vd: \\d{4} (tìm 4 chữ số).
{n,m}     - Từ n đến m lần. Vd: \\d{2,4} (tìm từ 2 đến 4 chữ số).

--- KÝ HIỆU NHÓM & KÝ TỰ ĐẶC BIỆT ---
(...)     - Nhóm bắt (Capturing Group). Nội dung khớp sẽ được 'lưu lại' để sử dụng sau (tham chiếu bằng $1, $2,...).
(?:...)   - Nhóm không bắt (Non-capturing Group). Dùng để gom nhóm mà không 'lưu lại'.
[...]     - Khớp với một ký tự trong tập hợp. Vd: [aeiou]
[^...]    - Khớp với ký tự KHÔNG có trong tập hợp.
|         - Hoặc (OR). Vd: cat|dog
\\         - Thoát (escape) một ký tự đặc biệt. Vd: \\. để tìm dấu chấm.

--- CẤU TRÚC THƯỜNG GẶP ---
- Tìm dòng chứa một từ cụ thể (Vd: "Error"):
  ^.*Error.*$
- Tìm và xóa các dòng trống thừa (2+ dòng trống):
  (\\r?\\n){2,}   -> Thay bằng: \\n
- Tham lam vs Lười biếng (Greedy vs Lazy):
  Mặc định, * và + là 'tham lam' (greedy), khớp chuỗi dài nhất có thể. Thêm ? để chuyển sang 'lười biếng' (lazy) và khớp chuỗi ngắn nhất.
  Vd: <a>.*<b>  sẽ khớp từ <a> đầu tiên đến <b> cuối cùng trong chuỗi.
      <a>.*?<b> sẽ khớp từ <a> đến <b> gần nhất. Rất hữu ích khi xử lý HTML/XML.
"""
        common_symbols_tab.insert("1.0", common_content)
        common_symbols_tab.config(state="disabled")

        # --- Tab 2: Ví dụ Đổi tên file ---
        rename_guide = scrolledtext.ScrolledText(guide_notebook, wrap=tk.WORD)
        guide_notebook.add(rename_guide, text="Ví dụ: Đổi tên")
        rename_content = """
YÊU CẦU BẮT BUỘC:
Khuôn mẫu của bạn phải tạo ra 2 'nhóm bắt' (...) để lấy ra SỐ CHƯƠNG và TIÊU ĐỀ.

    - Nhóm 1 (...): Phải chứa SỐ CHƯƠNG.
    - Nhóm 2 (...): Phải chứa TIÊU ĐỀ CHƯƠNG.

----------------------------------------------------
VÍ DỤ 1:
- Tên file: 'Truyen-A-Chap-123-Tieu-de-chuong.txt'
- Regex cần dùng: Chap-(\\d+)-(.*)
- Giải thích:
  'Chap-': Tìm chính xác chuỗi 'Chap-'.
  '(\\d+)': Nhóm 1, tìm và bắt 1 hoặc nhiều chữ số (số 123).
  '-': Tìm chính xác dấu gạch nối.
  '(.*)': Nhóm 2, tìm và bắt mọi ký tự cho đến hết tên file.

VÍ DỤ 2:
- Tên file: 'Quyển 3 - 098 . Tên chương.txt'
- Regex cần dùng: (\\d+)\\s*\\.\\s*(.*)
- Giải thích:
  '(\\d+)': Nhóm 1, tìm và bắt 1 hoặc nhiều chữ số (số 098).
  '\\s*': Tìm 0 hoặc nhiều khoảng trắng.
  '\\.': Tìm dấu chấm (phải có '\\' vì '.' là ký tự đặc biệt).
  '\\s*': Tìm tiếp 0 hoặc nhiều khoảng trắng.
  '(.*)': Nhóm 2, tìm và bắt phần còn lại của tên file.
"""
        rename_guide.insert("1.0", rename_content)
        rename_guide.config(state="disabled")

        # --- Tab 3: Ví dụ Tìm & thay thế ---
        find_replace_guide = scrolledtext.ScrolledText(guide_notebook, wrap=tk.WORD)
        guide_notebook.add(find_replace_guide, text="Ví dụ: Tìm & Thay thế")
        find_replace_content = """
Trong ô 'Thay thế', bạn có thể dùng $1, $2, ... (hoặc \\1, \\2) để tham chiếu đến nội dung đã được bắt bởi các nhóm (...) trong ô 'Tìm'. Hỗ trợ lịch sử và ghim regex, lịch sử tối đa ~20 mục.

----------------------------------------------------
VÍ DỤ 1: Đổi "Chương 123" thành "Chapter 123"
- Tìm:    Chương\\s*(\\d+)
- Thay:   Chapter $1
- Giải thích: 'Chương\\s*' tìm chữ 'Chương' và khoảng trắng theo sau. '(\\d+)' bắt số chương vào nhóm 1. '$1' ở ô thay thế sẽ chèn lại số đã bắt được.

VÍ DỤ 2: Đổi ngoặc kép thành ngoặc kiểu Trung
- Tìm:    "(.*?)"
- Thay:   『$1』
- Giải thích: Dấu " bên ngoài tìm ngoặc kép. '(.*?)' bắt tất cả nội dung bên trong một cách 'lười biếng' (lazy) để nó dừng lại ở dấu " gần nhất. $1 chèn lại nội dung đó.

VÍ DỤ 3: Xóa các dòng chỉ chứa khoảng trắng
- Tìm:    ^\\s+$\\n
- Thay:   (để trống)
- Giải thích: '^' bắt đầu dòng, '\\s+' tìm 1 hoặc nhiều khoảng trắng, '$' kết thúc dòng. Tìm các dòng chỉ có khoảng trắng và xóa chúng.
"""
        find_replace_guide.insert("1.0", find_replace_content)
        find_replace_guide.config(state="disabled")

        # --- Tab 4: Ví dụ Chia file ---
        split_guide = scrolledtext.ScrolledText(guide_notebook, wrap=tk.WORD)
        guide_notebook.add(split_guide, text="Ví dụ: Chia file")
        split_content = """
Regex chia file dùng để xác định các dòng mà tại đó file sẽ được cắt ra. Toàn bộ dòng phải khớp với mẫu. Hỗ trợ lịch sử + ghim (tối đa ~20 mục, ghim luôn ở đầu).

----------------------------------------------------
VÍ DỤ 1: Chia theo tên chương tiếng Trung
- Regex:   ^第.*?章.*$
- Giải thích: '^' bắt đầu dòng, '第' tìm chữ 'Đệ', '.*?' tìm số chương, '章' tìm chữ 'Chương', '.*' tìm tiêu đề, '$' kết thúc dòng.

VÍ DỤ 2: Chia theo tên chương tiếng Việt
- Regex:   ^Chương\\s*\\d+.*$
- Giải thích: Tương tự, tìm các dòng bắt đầu bằng 'Chương', theo sau là số và tiêu đề.

VÍ DỤ 3: Chia theo các dòng có 5 dấu sao trở lên
- Regex:   ^\\*{5,}$
- Giải thích: Tìm các dòng chỉ chứa 5 hoặc nhiều ký tự '*'.
"""
        split_guide.insert("1.0", split_content)
        split_guide.config(state="disabled")
        
        tab_map = {"general": 0, "rename": 1, "find_replace": 2, "split": 3}
        guide_notebook.select(tab_map.get(guide_type, 0))

        close_button = ttk.Button(main_frame, text="Đã hiểu", command=help_window.destroy)
        close_button.pack()
        
        # Đặt hàm này gần hàm show_regex_guide
    
    def show_operation_guide(self):
        guide_win = tk.Toplevel(self)
        guide_win.title("Hướng dẫn thao tác")
        guide_win.geometry("800x650")
        guide_win.transient(self)
        guide_win.grab_set()

        main_frame = ttk.Frame(guide_win, padding="15")
        main_frame.pack(fill="both", expand=True)

        notebook = ttk.Notebook(main_frame)
        tabs_meta = []

        selector_frame = ttk.Frame(main_frame)
        selector_frame.pack(fill="x", pady=(0, 5))
        ttk.Label(selector_frame, text="Chọn mục:", padding=(0, 0, 8, 0)).pack(side=tk.LEFT)
        tab_selector = ttk.Combobox(selector_frame, state="readonly")
        tab_selector.pack(side=tk.LEFT, fill="x", expand=True)

        notebook.pack(fill="both", expand=True, pady=(0, 10))

        def create_tab(title, content):
            tab = scrolledtext.ScrolledText(notebook, wrap=tk.WORD, padx=10, pady=10)
            notebook.add(tab, text=title)
            tabs_meta.append((tab, title))
            # SỬ DỤNG HÀM RENDER MỚI
            self._render_markdown_guide(tab, content.strip())
        
        browser_guide = """
        --- TRÌNH DUYỆT ---
        - Mở tab mới: bấm nút “+” hoặc phím tắt (nếu có).
        - Nút Script: xem menu userscript, bấm để chạy menu command.
        - Thanh địa chỉ: gợi ý URL/phổ biến; chọn gợi ý sẽ tự load trang.
        - Tabs: click để chuyển, click nút “x” để đóng; có tab ẩn auto đóng khi cần.
        - DevTools: nút F12 để bật/tắt.
        - Tải xuống: nút ⬇ mở danh sách download, có thể hủy/tải lại/mở file/thư mục/copy link; trạng thái được lưu lại khi mở lại app.
        """
        create_tab("Trình duyệt", browser_guide)

        cookie_guide = """
        --- COOKIE ---
        - Menu Trình duyệt → Cookie: mở trình quản lý cookie.
        - Cho phép nhập/xóa cookie cho các domain, hỗ trợ tải cookie từ trình duyệt hệ thống nếu đã đăng nhập.
        - Khi cần đăng nhập trang bảo vệ, mở trình duyệt tích hợp, đăng nhập, sau đó dùng cookie đã lưu cho các request/tải về.
        """
        create_tab("Cookie", cookie_guide)
        
        tools_guide = """
        --- MENU CÔNG CỤ ---
        Menu này chứa các tiện ích bổ sung giúp xử lý các file liên quan đến truyện.

        **1. Giải nén file (.zip, .7z, .rar...)**:
        -   **Chức năng**: Giải nén các file nén phổ biến, rất hữu ích khi bạn tải về truyện dưới dạng file nén.
        -   **Yêu cầu**:
            -   Máy tính của bạn cần có sẵn phần mềm giải nén tương ứng (ví dụ: **7-Zip** hoặc **WinRAR**).
        -   **Cách dùng**:
            1.  Vào menu **Công cụ -> Giải nén file...**
            2.  Chọn file nén bạn muốn giải nén.
            3.  Chọn thư mục để chứa các file sau khi giải nén.
            4.  Chương trình sẽ tự động thực hiện và thông báo khi hoàn tất.
        """
        create_tab("Công cụ", tools_guide)

        wikidich_guide = """
        --- WIKIDICH ---
        - **Tải Works**: lấy danh sách truyện đã đăng, dùng cookie trình duyệt. Cấu hình proxy và header trong nút **Cài đặt**.
        - **Tải chi tiết**: mở hộp chọn phạm vi (tất cả / đang lọc) và tuỳ chọn “Chỉ bổ sung chi tiết còn thiếu”.
        - **Lọc**:
            - Bộ lọc cơ bản: tìm tiêu đề/tác giả, văn án, trạng thái, sắp xếp (Mới nhất/Cũ nhất/...); hiển thị trạng thái lọc ngay trên khung.
            - Lọc nâng cao: ngày cập nhật (chọn từ date picker), thể loại, vai trò, thuộc tính (Nhúng link/file), reset để xoá sạch lọc nâng cao.
        - **Kiểm tra cập nhật**: chỉ kiểm tra các truyện đang hiển thị; cột “New” tô xanh toàn hàng khi có chương mới.
        - **Link bổ sung**: double‑click để mở bằng trình duyệt tích hợp.
        - **Tiến độ**: khung tiến độ ẩn, chỉ hiện khi đang chạy tác vụ.
        - **Cài đặt request**: chỉnh delay Wiki/Fanqie, User-Agent Wiki/Fanqie; có nút về mặc định.
        - **Proxy**: bật “Wikidich/Fanqie” trong tab Proxy để áp dụng cho Works/chi tiết/kiểm tra cập nhật.
        """
        create_tab("Wikidich", wikidich_guide)

        rename_guide = """
        --- TAB ĐỔI TÊN ---
        Tab này là chức năng chính, giúp bạn đổi tên hàng loạt file truyện theo một cấu trúc thống nhất.

        1.  **Chọn thư mục**:
            -   Nhấn nút **"Chọn..."** để chỉ định thư mục chứa các file .txt cần xử lý.
            -   Sau khi chọn, chương trình sẽ tự động quét và phân tích các file.

        2.  **Tùy chọn**:
            -   **Lấy số từ**: Quyết định chương trình sẽ ưu tiên lấy số chương từ đâu để điền vào tên file mới.
                -   *Ưu tiên nội dung*: Lấy số từ dòng đầu tiên của file. Nếu không có, mới lấy từ tên file.
                -   *Ưu tiên tên file*: Lấy số từ tên file. Nếu không có, mới lấy từ nội dung.
            -   **Sắp xếp theo số của**: Quyết định thứ tự các file trong bảng "Xem trước" sẽ được sắp xếp theo nguồn nào. Điều này rất quan trọng khi bạn dùng "Tiêu đề tùy chỉnh".
                -   *Nội dung*: Sắp xếp dựa trên số chương lấy từ nội dung.
                -   *Tên file*: Sắp xếp dựa trên số chương lấy từ tên file.
            -   **Sửa dòng đầu của file**: Khi được chọn, chương trình sẽ **ghi đè** dòng đầu tiên của mỗi file bằng chính tên file mới được tạo ra (không bao gồm đuôi file như .txt). Tính năng này chỉ hoạt động nếu file đó được tìm thấy số chương.
            -   **Cấu trúc mới**: Định dạng cho tên file mới.
            -   **Regex (Tên file / Nội dung)**: hỗ trợ lịch sử và ghim regex; regex nội dung áp dụng lên dòng đầu file. Hạn sử dụng trên lịch sử: tối đa 20, nhưng ghim sẽ luôn ở đầu và không bị trôi.
                -   `{num}`: Sẽ được thay bằng số chương.
                -   `{title}`: Sẽ được thay bằng tiêu đề chương.
                -   `{num+n}` hoặc `{num-n}`: Tự động cộng/trừ số chương (ví dụ: `{num+1}`).
            -   **Regex (tên file / nội dung)**: Dành cho người dùng nâng cao. Giúp chương trình nhận diện số và tiêu đề chương trong các trường hợp phức tạp mà mẫu có sẵn không xử lý được.

        3.  **Sử dụng tiêu đề tùy chỉnh**:
            -   Check vào ô **"Kích hoạt"**.
            -   Dán danh sách các tiêu đề vào ô văn bản bên dưới, mỗi tiêu đề một dòng.
            -   Các tiêu đề này sẽ được áp dụng lần lượt cho các file đã được sắp xếp trong bảng "Xem trước".

        4.  **Xem trước và Hành động**:
            -   **Bảng xem trước**: Hiển thị danh sách các file, số chương được nhận diện và tên file mới sẽ trông như thế nào. Có thể chọn nhiều file bằng **Ctrl + Click chuột trái** hoặc chọn 1 hàng sau đó đến hàng mới nhấn **Shift +  Click chuột trái** để chọn khoảng từ hàng trước tới hàng này.
            -   **Tìm kiếm**: Lọc nhanh các file trong bảng.
            -   **Loại trừ file đã chọn**: Chọn một hoặc nhiều file trong bảng và nhấn nút này để bỏ qua chúng khi đổi tên. Các file này sẽ được đánh dấu màu đỏ.
            -   **Bao gồm lại**: Chọn các file đã bị loại trừ để đưa chúng trở lại quá trình đổi tên.
            -   **BẮT ĐẦU ĐỔI TÊN**: Nút cuối cùng để thực hiện việc đổi tên hàng loạt.
            -   **Double-click vào một dòng**: Mở cửa sổ xem nhanh nội dung của file đó.
        """
        create_tab("Đổi Tên", rename_guide)

        credit_guide = """
        --- TAB THÊM CREDIT ---
        Chức năng này giúp bạn chèn một dòng thông tin (ví dụ: tên người convert, nguồn,...) vào tất cả các file trong thư mục đã chọn.

        1.  **Nội dung credit**: Nhập đoạn văn bản bạn muốn thêm vào đây.
        2.  **Vị trí thêm**:
            -   **Đầu file**: Chèn credit vào dòng đầu tiên của mỗi file.
            -   **Cuối file**: Chèn credit vào dòng cuối cùng của mỗi file.
            -   **Dòng thứ...**: Chèn credit vào một dòng cụ thể do bạn chỉ định.
        3.  **Xem trước**:
            -   Chọn một file từ danh sách thả xuống.
            -   Nhấn nút **"XEM TRƯỚC"** để xem nội dung file sẽ trông như thế nào sau khi thêm credit.
        4.  **ÁP DỤNG CHO TẤT CẢ FILE**:
            -   Nhấn nút này để thực hiện việc thêm credit vào tất cả các file.
            -   **Lưu ý**: Hành động này sẽ **ghi đè** lên các file gốc.
        """
        create_tab("Thêm Credit", credit_guide)

        online_guide = """
        --- TAB LẤY TIÊU ĐỀ ONLINE ---
        Công cụ mạnh mẽ giúp lấy danh sách tiêu đề chương trực tiếp từ các trang web truyện.

        1.  **Nguồn**:
            -   **Trang web**: Chọn trang bạn muốn lấy dữ liệu (ví dụ: jjwxc.net).
            -   **URL mục lục**: Dán đường link của trang mục lục truyện vào đây.
            -   **Bắt đầu lấy dữ liệu**: Nhấn để chương trình truy cập URL và lấy về danh sách chương.
            -   **Lưu ý**: Đảm bảo URL hợp lệ và có kết nối mạng. Nếu trang web yêu cầu đăng nhập, app sẽ mở trình duyệt để bạn đăng nhập hoặc tải cookie trước khi lấy dữ liệu.

        2.  **Kết quả**:
            -   Bảng này sẽ hiển thị danh sách các chương lấy được, bao gồm số chương, tiêu đề chính và tiêu đề phụ (nếu có).
            -   Có thể chọn nhiều dòng bằng **Ctrl + Click chuột trái** hoặc chọn 1 hàng sau đó đến hàng mới nhấn **Shift +  Click chuột trái** để chọn khoảng từ hàng trước tới hàng này.

        3.  **Áp dụng**:
            -   **Chọn nhanh theo khoảng**: Hỗ trợ nhiều khoảng, nhập `1-5,7,10-` để chọn 1-5,7 và từ 10 trở đi; `-100`, `80-`, `all/*` đều được.
            -   **Gộp 2 tiêu đề**:
                -   Kích hoạt tùy chọn này nếu bạn muốn kết hợp tiêu đề chính và phụ.
                -   Sử dụng `{t1}` cho tiêu đề chính và `{t2}` cho tiêu đề phụ trong ô cấu trúc.
            -   **Nếu không gộp, sử dụng cột**: Chọn cột tiêu đề bạn muốn dùng (chính hoặc phụ).
            -   **Sao chép tiêu đề...**: Sau khi đã chọn các chương mong muốn, nhấn nút này. Các tiêu đề tương ứng sẽ được tự động sao chép vào ô "Tiêu đề tùy chỉnh" ở Tab cần thiết.
        """
        create_tab("Lấy Tiêu Đề Online", online_guide)
        
        text_guide = """
        --- TAB XỬ LÝ VĂN BẢN ---
        Cung cấp các công cụ để chỉnh sửa nội dung file hoặc chia nhỏ file.

        1.  **Chọn file**: Chọn file .txt bạn muốn chỉnh sửa hoặc chia nhỏ. Nội dung file sẽ được tải vào ô bên dưới.

        **--- Sub-tab: Tìm & Thay thế ---**
        -   **Tìm / Thay thế**: Nhập văn bản cần tìm và văn bản sẽ thay thế. Hỗ trợ Regex, nhóm $1, $2,...
        -   **Lịch sử & Ghim**: Ô Tìm/Thay thế lưu tối đa ~20 mục; nút Ghim/Bỏ ghim giữ regex không bị trôi.
        -   **Các tùy chọn**:
            -   **Khớp chữ hoa/thường**: Bật để phân biệt A và a.
            -   **Khớp toàn bộ từ**: Chỉ tìm các từ đứng riêng lẻ (ví dụ: tìm "an" sẽ không khớp với "bàn").
            -   **Dùng Regex**: Kích hoạt chế độ tìm kiếm bằng biểu thức chính quy.
            -   **Tìm ngược lên**: Tìm từ vị trí con trỏ ngược về đầu file.
        -   **Các nút hành động**:
            -   **Tìm tiếp**: Nhảy đến kết quả trùng khớp tiếp theo.
            -   **Thay thế**: Thay thế kết quả đang được chọn và tự động tìm kết quả tiếp theo.
            -   **Thay thế tất cả**: Thay thế mọi kết quả tìm thấy trong toàn bộ file.
            -   **Lưu**: Ghi đè các thay đổi lên file gốc.
            -   **Lưu thành file mới...**: Lưu nội dung đã sửa vào một file mới.
            -   **Hoàn tác / Làm lại**: Quay lại hoặc tiến tới các bước chỉnh sửa.

        **--- Sub-tab: Chia file ---**
        -   **Regex chia file**: Nhập mẫu Regex để xác định dòng dùng làm điểm chia (hỗ trợ lịch sử + ghim). Ví dụ: `^Chương \\d+` sẽ chia file tại mỗi dòng bắt đầu bằng "Chương [số]".
        -   **Cấu trúc tên file**: Đặt tên cho các file con được tạo ra.
        -   **Chia sau/trước regex**: Quyết định dòng khớp với regex sẽ thuộc về file trước đó hay file sau đó.
        -   **Xem trước**: Hiển thị danh sách các phần sẽ được tạo ra. Double-click vào một dòng để xem trước toàn bộ nội dung của phần đó.
        -   **BẮT ĐẦU CHIA FILE**: Thực hiện việc chia file. Các file con sẽ được lưu trong một thư mục mới.

        **--- Sub-tab: Công cụ Nhanh ---**
        Đây là nơi chứa các công cụ xử lý văn bản chuyên dụng, giúp tự động hóa các tác vụ lặp đi lặp lại.

        **a. Đánh lại số chương:**
        -   **Chức năng**: Tự động tìm tất cả các dòng khớp với Regex và đánh số lại chúng một cách tuần tự.
        -   **Cách dùng**:
            1.  **Regex tìm kiếm**: Nhập mẫu để tìm dòng chương. Ví dụ: `第\\d+章` hoặc `Chương \\d+`.
            2.  **Cấu trúc thay thế**: Nhập định dạng bạn muốn cho dòng chương mới. **Bắt buộc** phải chứa `{num}`. Ví dụ: `第{num}章` hoặc `Chương {num}:`.
            3.  **Bắt đầu từ số**: Nhập số chương bắt đầu.
            4.  Nhấn **"Thực hiện"**.

        **b. Thêm tiêu đề từ Mục lục:**
        -   **Chức năng**: Dùng một danh sách mục lục (dán vào hoặc tải từ file) để cập nhật tiêu đề cho file truyện chính.
        -   **Cách dùng**:
            1.  **Nội dung Mục lục**: Dán danh sách mục lục vào ô văn bản lớn, hoặc nhấn **"Tải file Mục lục..."** để nạp từ file.
            2.  **Regex file Mục lục**: Nhập mẫu để đọc mục lục. Cần có một **nhóm bắt (...)** để xác định đâu là tag chương (ví dụ: `第123章`).
                -   *Ví dụ:* `(第\\d+章)` sẽ bắt `第123章` từ dòng `第123章 Tên chương`.
            3.  **Regex file Truyện**: Nhập mẫu để tìm các dòng/phần cần được thay thế trong file truyện chính.
                -   *Ví dụ:* `^(第\\d+章)$` sẽ chỉ khớp với các dòng chỉ chứa `第123章`.
            4.  **Chọn chế độ**:
                -   **Bổ sung Tiêu đề**: Giữ lại tag chương trong file truyện (`第123章`) và chỉ nối thêm phần tiêu đề từ mục lục.
                -   **Thay thế Toàn bộ**: Xóa hoàn toàn tag chương trong file truyện và thay bằng cả dòng tương ứng từ mục lục.
            5.  Nhấn **"Áp dụng Mục lục"**.
        """
        create_tab("Xử lý văn bản", text_guide)

        translate_guide = """
        --- TAB DỊCH ---
        Đây là công cụ dịch thuật mạnh mẽ được tích hợp, cho phép bạn dịch văn bản thuần túy và quản lý các thuật ngữ (name) một cách chuyên nghiệp.

        1.  **Văn bản gốc**:
            -   Dán văn bản cần dịch vào ô bên trái hoặc nhấn nút **"Tải file..."** để mở một file .txt.
            -   Mỗi dòng được coi là một "chunk" và sẽ được dịch riêng biệt để giữ nguyên định dạng.

        2.  **Quản lý Name**:
            -   **Bộ tên**: Chọn name-set bạn muốn sử dụng cho lần dịch này. Bạn có thể **Tạo mới**, **Xóa bộ**, **Nhập/Xuất** file name hoặc **Xóa hết name** trong một bộ.
            -   **Thêm/Sửa nhanh**: Nhập các cặp `Tiếng Trung=Tiếng Việt` (mỗi cặp một dòng) rồi nhấn nút "Thêm/Cập nhật" để thêm hàng loạt.
            -   **Danh sách name**: Hiển thị tất cả các name trong bộ hiện tại. Nhấn nút **"Sửa/Gợi ý"** để chỉnh sửa hoặc xem gợi ý cho một name.

        3.  **Nâng cao**:
            -   Cho phép tùy chỉnh các thông số kỹ thuật như URL server dịch, URL file Hán-Việt, độ trễ và số ký tự tối đa cho mỗi yêu cầu.

        4.  **Dịch và Sửa Name từ kết quả**:
            -   Nút **"Việt"** dịch sang tiếng Việt, **"Hán Việt"** dùng API dichngay với `tl=hv`.
            -   Thanh tiến độ ẩn mặc định, chỉ hiện khi đang dịch; nhãn trạng thái nằm cùng hàng với các nút.
            -   Sau khi dịch xong, bạn có thể **chuột phải** vào một đoạn văn bản trong ô "Kết quả dịch" và chọn **"Sửa Name..."**.
            -   Một cửa sổ sẽ hiện ra, cho phép bạn sửa cả name tiếng Trung và tiếng Việt. Nhấn nút **"Gợi ý..."** trong cửa sổ này để xem các gợi ý Hán-Việt và dịch máy.
            -   **Tự động cập nhật**: Sau khi bạn lưu một name, các đoạn dịch có chứa name đó sẽ được **tự động dịch lại** một cách thông minh mà không cần phải dịch lại toàn bộ.
            -   **Xuất kết quả**: Lưu nội dung đã dịch ra `.txt` hoặc `.json` (dạng list dòng) bằng nút **"Xuất kết quả..."**.
        """
        create_tab("Dịch", translate_guide)

        image_guide = """
        --- TAB XỬ LÝ ẢNH ---
        Công cụ này cho phép bạn tải, xem, chỉnh sửa cơ bản và lưu lại hình ảnh.

        1.  **Nguồn ảnh**:
            -   **Tải từ URL**: Dán đường link trực tiếp của một ảnh vào ô và nhấn nút.
            -   **Tải file lên...**: Mở một file ảnh từ máy tính của bạn.

        2.  **Xem trước & Tương tác**:
            -   **Phóng to / Thu nhỏ**: Sử dụng **con lăn chuột** trên ảnh để phóng to hoặc thu nhỏ.
            -   **Di chuyển ảnh**: **Nhấn và kéo chuột trái** để di chuyển ảnh trong khung xem.

        3.  **Công cụ & Lưu ảnh**:
            -   **Công cụ**: Chọn một trong các hiệu ứng nâng cao chất lượng ảnh:
                -   *Làm nét (Unsharp Mask)*: Tăng độ sắc nét của các chi tiết.
                -   *Tăng chi tiết (Detail)*: Làm nổi bật các cạnh và vân bề mặt.
                -   *Nâng cấp độ phân giải x2*: Tăng gấp đôi kích thước ảnh với thuật toán chất lượng cao.
            -   **Cường độ**: Dùng thanh trượt để điều chỉnh mức độ mạnh/yếu của hiệu ứng.
            -   **Áp dụng**: Sau khi chọn công cụ và cường độ, nhấn **"Áp dụng"** để xem kết quả.
            -   **Hoàn tác về gốc**: Nhấn nút này để hủy bỏ mọi thay đổi và quay về ảnh gốc ban đầu.
            -   **Lưu ảnh...**: Chọn định dạng và nhấn **"Lưu ảnh..."** để lưu lại ảnh đã qua xử lý.
        """
        create_tab("Xử lý Ảnh", image_guide)

        # Đồng bộ combobox chọn tab
        tab_selector['values'] = [title for _tab, title in tabs_meta]
        if tabs_meta:
            tab_selector.current(0)
            notebook.select(tabs_meta[0][0])

        def on_tab_changed(event=None):
            idx = notebook.index(notebook.select())
            try:
                tab_selector.current(idx)
            except Exception:
                pass

        def on_select_combo(event=None):
            idx = tab_selector.current()
            if 0 <= idx < len(tabs_meta):
                notebook.select(tabs_meta[idx][0])

        notebook.bind("<<NotebookTabChanged>>", on_tab_changed)
        tab_selector.bind("<<ComboboxSelected>>", on_select_combo)
        
        close_button = ttk.Button(main_frame, text="Đóng", command=guide_win.destroy)
        close_button.pack()

    def create_credit_tab(self):
        credit_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(credit_tab, text="Thêm Credit")
        credit_tab.columnconfigure(0, weight=1)
        credit_tab.rowconfigure(0, weight=1)

        credit_paned = ttk.PanedWindow(credit_tab, orient=tk.VERTICAL)
        credit_paned.grid(row=0, column=0, sticky="nsew")

        credit_options_frame = ttk.LabelFrame(credit_paned, text="2. Tùy chọn & Hành động", padding="10")
        credit_paned.add(credit_options_frame, weight=1)
        credit_options_frame.columnconfigure(1, weight=1)

        ttk.Label(credit_options_frame, text="Nội dung credit:").grid(row=0, column=0, sticky="nw", padx=5, pady=5)
        self.credit_text_widget = tk.Text(credit_options_frame, height=4, wrap=tk.WORD, undo=True)
        self.credit_text_widget.grid(row=0, column=1, columnspan=2, sticky="ew", padx=5, pady=5)
        self.credit_text_widget.insert("1.0", "Được convert bởi XYZ")  # Giá trị mặc định

        ttk.Label(credit_options_frame, text="Vị trí thêm:").grid(row=1, column=0, sticky="w", padx=5, pady=5)
        self.credit_position = tk.StringVar(value="top")
        positions = {"Đầu file": "top", "Cuối file": "bottom", "Dòng thứ...": "line"}
        pos_frame = ttk.Frame(credit_options_frame)
        pos_frame.grid(row=1, column=1, columnspan=2, sticky="w", padx=5, pady=5)
        for text, val in positions.items():
            ttk.Radiobutton(pos_frame, text=text, variable=self.credit_position, value=val, command=self._on_pos_change).pack(side=tk.LEFT, padx=(0, 10))

        self.credit_line_num = tk.IntVar(value=2)
        self.line_num_spinbox = ttk.Spinbox(pos_frame, from_=1, to=999, textvariable=self.credit_line_num, width=5, state="disabled")
        self.line_num_spinbox.pack(side=tk.LEFT)

        # Đưa nút "Xem trước" và "Áp dụng cho tất cả file" cùng hàng với "Xem trước cho file"
        ttk.Label(credit_options_frame, text="Xem trước cho file:").grid(row=2, column=0, sticky="w", padx=5, pady=(10, 5))
        self.credit_file_selector = ttk.Combobox(credit_options_frame, state="readonly")
        self.credit_file_selector.grid(row=2, column=1, sticky="ew", padx=5, pady=(10, 5))
        button_frame = ttk.Frame(credit_options_frame)
        button_frame.grid(row=2, column=2, sticky="e", padx=5, pady=(10, 5))
        ttk.Button(button_frame, text="XEM TRƯỚC", command=self.preview_credit).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="ÁP DỤNG CHO TẤT CẢ FILE", command=self.apply_credit_to_all).pack(side=tk.LEFT)

        # Initialize self.credit_preview_text
        credit_preview_frame = ttk.LabelFrame(credit_paned, text="3. Xem trước nội dung", padding="10")
        credit_paned.add(credit_preview_frame, weight=12)
        credit_preview_frame.columnconfigure(0, weight=1)
        credit_preview_frame.rowconfigure(0, weight=1)

        self.credit_preview_text = scrolledtext.ScrolledText(credit_preview_frame, wrap=tk.WORD, state="disabled")
        self.credit_preview_text.pack(fill=tk.BOTH, expand=True)

    def create_online_fetch_tab(self):
        online_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(online_tab, text="Lấy Tiêu Đề Online")
        online_tab.columnconfigure(0, weight=1)
        online_tab.rowconfigure(0, weight=1)

        online_paned = ttk.PanedWindow(online_tab, orient=tk.VERTICAL)
        online_paned.grid(row=0, column=0, sticky="nsew")

        # Frame 1: Nguồn (Không thay đổi)
        fetch_frame = ttk.LabelFrame(online_paned, text="1. Nguồn", padding=10)
        online_paned.add(fetch_frame, weight=1)
        fetch_frame.columnconfigure(0, weight=1)

        self.selected_online_source = tk.StringVar(value=ONLINE_SOURCES[0]['id'])
        if not hasattr(self, "source_icon_images"):
            self.source_icon_images = {}
        self.source_tiles = {}
        self.source_tile_container = None
        self._source_selector_window = None

        current_frame = ttk.Frame(fetch_frame)
        current_frame.grid(row=0, column=0, sticky="ew", pady=(0, 6))
        current_frame.columnconfigure(1, weight=1)
        ttk.Label(current_frame, text="Nguồn hiện tại:").grid(row=0, column=0, sticky="w")
        self.source_current_label = ttk.Label(current_frame, text="", font=("Segoe UI", 10, "bold"))
        self.source_current_label.grid(row=0, column=1, sticky="w", padx=(6, 0))
        ttk.Button(current_frame, text="Chọn nguồn...", command=self._open_source_selector).grid(row=0, column=2, padx=(10,0))

        info_frame = ttk.Frame(fetch_frame)
        info_frame.grid(row=1, column=0, sticky="ew")
        info_frame.columnconfigure(2, weight=1)
        self.source_domain_var = tk.StringVar()
        ttk.Label(info_frame, textvariable=self.source_domain_var, font=("Segoe UI", 10, "italic")).grid(row=0, column=0, sticky="w", padx=5, pady=(0,4))
        self.source_sample_var = tk.StringVar()
        self.source_sample_label = ttk.Label(info_frame, textvariable=self.source_sample_var)
        self.source_sample_label.grid(row=0, column=2, sticky="w", padx=5, pady=(0,4))
        url_row = ttk.Frame(fetch_frame)
        url_row.grid(row=2, column=0, sticky="ew", padx=5, pady=(8, 5))
        url_row.columnconfigure(1, weight=1)
        ttk.Label(url_row, text="URL mục lục:", padding=(0, 6)).grid(row=0, column=0, sticky="w")
        self.source_url = tk.StringVar()
        url_frame = ttk.Frame(url_row)
        url_frame.grid(row=0, column=1, sticky="ew", padx=(6,0))
        url_frame.columnconfigure(0, weight=1)
        ttk.Entry(url_frame, textvariable=self.source_url).grid(row=0, column=0, sticky="ew")
        ttk.Button(url_frame, text="Bắt đầu lấy dữ liệu", command=self._fetch_online_titles).grid(row=0, column=1, padx=(8,0))
        self._update_source_info_labels()

        # Frame 2: Kết quả (Không thay đổi)
        result_frame = ttk.LabelFrame(online_paned, text="2. Kết quả", padding=10)
        online_paned.add(result_frame, weight=3)
        result_frame.columnconfigure(0, weight=1)
        result_frame.rowconfigure(0, weight=1)
        cols = ("Số chương", "Tiêu đề chính", "Tiêu đề phụ/Tóm tắt")
        self.online_tree = ttk.Treeview(result_frame, columns=cols, show='headings', selectmode='extended')
        self.online_tree.grid(row=0, column=0, sticky="nsew")
        for col in cols: self.online_tree.heading(col, text=col)
        vsb = ttk.Scrollbar(result_frame, orient="vertical", command=self.online_tree.yview)
        vsb.grid(row=0, column=1, sticky="ns")
        self.online_tree.configure(yscrollcommand=vsb.set)
        
        apply_frame = ttk.LabelFrame(online_tab, text="3. Áp dụng", padding=10)
        apply_frame.grid(row=2, column=0, sticky="ew", pady=(5,0))
        apply_frame.columnconfigure(0, weight=1)
        apply_frame.columnconfigure(1, weight=1)

        select_frame = ttk.Frame(apply_frame)
        select_frame.grid(row=0, column=0, sticky="ew", padx=(0, 10))
        ttk.Label(select_frame, text="Chọn nhanh theo khoảng:").pack(side=tk.LEFT, padx=(0, 5))
        self.online_range_var = tk.StringVar()
        range_entry = ttk.Entry(select_frame, textvariable=self.online_range_var)
        range_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
        ttk.Button(select_frame, text="Chọn", command=self._select_online_range).pack(side=tk.LEFT, padx=5)

        # Phần bên phải cho "Gộp tiêu đề"
        combine_frame = ttk.Frame(apply_frame)
        combine_frame.grid(row=0, column=1, sticky="ew", padx=(10, 0))
        ttk.Checkbutton(combine_frame, text="Gộp 2 tiêu đề theo cấu trúc:", variable=self.combine_titles_var).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Entry(combine_frame, textvariable=self.title_format_var).pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        # --- Hàng 2: Các label chú thích ---
        ttk.Label(apply_frame, text="(Ví dụ: 1-10, -50, 100-, all)").grid(row=1, column=0, sticky="w", padx=5)
        ttk.Label(apply_frame, text="(Dùng {t1} và {t2})").grid(row=1, column=1, sticky="w", padx=(10, 0))

        # --- Hàng 3: Hàng hành động cuối cùng ---
        action_row_frame = ttk.Frame(apply_frame)
        action_row_frame.grid(row=2, column=0, columnspan=2, sticky="ew", pady=(10,0))
        ttk.Label(action_row_frame, text="Nếu không gộp, sử dụng cột:").pack(side=tk.LEFT, padx=5)
        self.title_choice = tk.StringVar(value="title2")
        ttk.Radiobutton(action_row_frame, text="Tiêu đề chính", variable=self.title_choice, value="title1").pack(side=tk.LEFT)
        ttk.Radiobutton(action_row_frame, text="Tiêu đề phụ", variable=self.title_choice, value="title2").pack(side=tk.LEFT)
        ttk.Button(action_row_frame, text="Sao chép vào Công cụ Nhanh", command=self._copy_titles_to_quick_tools).pack(side=tk.LEFT, padx=20)
        ttk.Button(action_row_frame, text="Sao chép tiêu đề đã chọn vào Tab Đổi Tên", command=self._apply_online_titles).pack(side=tk.RIGHT, padx=5)

    def create_wikidich_tab(self):
        wd_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(wd_tab, text="Wikidich")
        wd_tab.columnconfigure(0, weight=1)
        wd_tab.rowconfigure(3, weight=1)
        self.wd_missing_only_var = tk.BooleanVar(value=True)
        self.wd_detail_scope_var = tk.StringVar(value="filtered")
        self._wd_adv_section_visible = False
        self._wd_pending_categories = []
        self._wd_category_options = []

        header = ttk.Frame(wd_tab)
        header.grid(row=0, column=0, sticky="ew")
        header.columnconfigure(4, weight=1)
        self.wd_user_label = ttk.Label(header, text="Chưa kiểm tra đăng nhập")
        self.wd_user_label.grid(row=0, column=0, sticky="w")
        ttk.Button(header, text="Tải Works", command=self._wd_start_fetch_works).grid(row=0, column=1, padx=(10, 0))
        ttk.Button(header, text="Tải chi tiết", command=self._wd_prompt_detail_fetch).grid(row=0, column=2, padx=6)
        ttk.Button(header, text="Cài đặt", command=self._open_api_settings_dialog).grid(row=0, column=3, padx=(0, 6))

        progress_frame = ttk.Frame(wd_tab)
        progress_frame.grid(row=1, column=0, sticky="ew", pady=(6, 4))
        progress_frame.columnconfigure(1, weight=1)
        ttk.Label(progress_frame, text="Tiến độ:").grid(row=0, column=0, sticky="w")
        self.wd_progress = ttk.Progressbar(progress_frame, mode="determinate")
        self.wd_progress.grid(row=0, column=1, sticky="ew", padx=(6, 6))
        self.wd_progress_label = ttk.Label(progress_frame, text="Chờ thao tác...")
        self.wd_progress_label.grid(row=0, column=2, sticky="w")
        self.wd_progress_frame = progress_frame
        self._wd_progress_visible = False
        progress_frame.grid_remove()

        filter_frame = ttk.LabelFrame(wd_tab, text="Bộ lọc cơ bản", padding=10)
        filter_frame.grid(row=2, column=0, sticky="ew")
        filter_frame.columnconfigure(1, weight=1)
        filter_frame.columnconfigure(3, weight=1)
        filter_frame.columnconfigure(4, weight=0)
        filter_frame.columnconfigure(5, weight=0)
        ttk.Label(filter_frame, text="Tiêu đề / Tác giả:").grid(row=0, column=0, sticky="w")
        self.wd_search_var = tk.StringVar(value=self.wikidich_filters.get('search', ''))
        ttk.Entry(filter_frame, textvariable=self.wd_search_var).grid(row=0, column=1, sticky="ew", padx=(4, 10))
        ttk.Label(filter_frame, text="Trạng thái:").grid(row=0, column=2, sticky="w")
        self.wd_status_var = tk.StringVar(value=self.wikidich_filters.get('status', 'all'))
        status_values = ["all"] + wikidich_ext.STATUS_OPTIONS
        ttk.Combobox(filter_frame, state="readonly", textvariable=self.wd_status_var, values=status_values, width=18).grid(row=0, column=3, sticky="w")

        ttk.Label(filter_frame, text="Tìm trong văn án:").grid(row=1, column=0, sticky="w", pady=(6, 0))
        self.wd_summary_var = tk.StringVar(value=self.wikidich_filters.get('summarySearch', ''))
        ttk.Entry(filter_frame, textvariable=self.wd_summary_var).grid(row=1, column=1, sticky="ew", padx=(4, 10), pady=(6, 0))
        ttk.Label(filter_frame, text="Sắp xếp:").grid(row=1, column=2, sticky="w", pady=(6, 0))
        self._wd_sort_value_to_label = {value: label for value, label in WD_SORT_OPTIONS}
        self._wd_sort_label_to_value = {label: value for value, label in WD_SORT_OPTIONS}
        initial_sort_label = self._wd_sort_value_to_label.get(self.wikidich_filters.get('sortBy', 'recent'), WD_SORT_OPTIONS[0][1])
        self.wd_sort_label_var = tk.StringVar(value=initial_sort_label)
        ttk.Combobox(filter_frame, state="readonly", textvariable=self.wd_sort_label_var,
                     values=[label for _, label in WD_SORT_OPTIONS], width=18).grid(row=1, column=3, sticky="w", pady=(6, 0))

        action_frame = ttk.Frame(filter_frame)
        action_frame.grid(row=0, column=5, rowspan=3, sticky="ne", padx=(10, 0))
        ttk.Button(action_frame, text="Áp dụng", command=self._wd_apply_filters).pack(fill=tk.X)
        ttk.Button(action_frame, text="Kiểm tra cập nhật", command=self._wd_prompt_check_updates).pack(fill=tk.X, pady=(6, 0))
        self.wd_adv_toggle_btn = ttk.Button(action_frame, text="Hiện lọc nâng cao", command=self._wd_toggle_advanced_section)
        self.wd_adv_toggle_btn.pack(fill=tk.X, pady=(10, 0))

        status_info_frame = ttk.Frame(filter_frame)
        status_info_frame.grid(row=1, column=4, sticky="nw", padx=(10, 0))
        self.wd_basic_status_var = tk.StringVar(value="")
        self.wd_adv_status_var = tk.StringVar(value="")
        ttk.Label(status_info_frame, textvariable=self.wd_basic_status_var, foreground="#34d399").pack(anchor="w")
        ttk.Label(status_info_frame, textvariable=self.wd_adv_status_var, foreground="#fbbf24").pack(anchor="w", pady=(2, 0))

        flag_labels = {
            "embedLink": "Có nhúng link",
            "embedFile": "Có nhúng file"
        }
        ttk.Label(filter_frame, text="Thuộc tính:").grid(row=3, column=0, sticky="nw", pady=(8, 0))
        self.wd_flag_vars = {flag: tk.BooleanVar(value=flag in self.wikidich_filters.get('flags', [])) for flag in flag_labels}
        flag_frame = ttk.Frame(filter_frame)
        flag_frame.grid(row=3, column=1, columnspan=3, sticky="w", pady=(8, 0))
        for flag, label in flag_labels.items():
            ttk.Checkbutton(flag_frame, text=label, variable=self.wd_flag_vars[flag]).pack(side=tk.LEFT, padx=(0, 12))
        self.wd_count_var = tk.StringVar(value="Số truyện: 0")
        ttk.Label(filter_frame, textvariable=self.wd_count_var).grid(row=3, column=2, columnspan=2, sticky="w", pady=(8, 0))

        self.wd_adv_container = ttk.LabelFrame(filter_frame, text="Lọc nâng cao", padding=8)
        self.wd_adv_container.grid(row=4, column=0, columnspan=6, sticky="ew", pady=(12, 0))
        self.wd_adv_container.columnconfigure(0, weight=1)

        self.wd_from_date_var = tk.StringVar(value=self.wikidich_filters.get('fromDate', ''))
        self.wd_to_date_var = tk.StringVar(value=self.wikidich_filters.get('toDate', ''))
        adv_header = ttk.Frame(self.wd_adv_container)
        adv_header.grid(row=0, column=0, sticky="ew")
        ttk.Label(adv_header, text="Khoảng ngày cập nhật (YYYY-MM-DD)").pack(side=tk.LEFT)
        ttk.Button(adv_header, text="Đặt lại bộ lọc", command=self._wd_reset_filters).pack(side=tk.RIGHT)
        date_frame = ttk.Frame(self.wd_adv_container)
        date_frame.grid(row=1, column=0, sticky="ew", pady=(4, 10))
        from_row = ttk.Frame(date_frame)
        from_row.pack(fill=tk.X, pady=2)
        ttk.Label(from_row, text="Từ:").pack(side=tk.LEFT)
        ttk.Entry(from_row, textvariable=self.wd_from_date_var, state="readonly", width=12).pack(side=tk.LEFT, padx=(4, 4))
        ttk.Button(from_row, text="Chọn", command=lambda: self._wd_open_date_picker(self.wd_from_date_var, "Chọn ngày bắt đầu")).pack(side=tk.LEFT, padx=(0, 4))
        ttk.Button(from_row, text="Xóa", command=lambda: self._wd_clear_date(self.wd_from_date_var)).pack(side=tk.LEFT)
        to_row = ttk.Frame(date_frame)
        to_row.pack(fill=tk.X, pady=2)
        ttk.Label(to_row, text="Đến:").pack(side=tk.LEFT)
        ttk.Entry(to_row, textvariable=self.wd_to_date_var, state="readonly", width=12).pack(side=tk.LEFT, padx=(4, 4))
        ttk.Button(to_row, text="Chọn", command=lambda: self._wd_open_date_picker(self.wd_to_date_var, "Chọn ngày kết thúc")).pack(side=tk.LEFT, padx=(0, 4))
        ttk.Button(to_row, text="Xóa", command=lambda: self._wd_clear_date(self.wd_to_date_var)).pack(side=tk.LEFT)

        ttk.Label(self.wd_adv_container, text="Thể loại đang có").grid(row=2, column=0, sticky="w", pady=(4, 2))
        self.wd_category_listbox = tk.Listbox(self.wd_adv_container, selectmode=tk.MULTIPLE, height=6, exportselection=False)
        self.wd_category_listbox.grid(row=3, column=0, sticky="ew")

        ttk.Label(self.wd_adv_container, text="Vai trò của bạn").grid(row=4, column=0, sticky="w", pady=(8, 2))
        roles_frame = ttk.Frame(self.wd_adv_container)
        roles_frame.grid(row=5, column=0, sticky="w")
        role_labels = {
            "poster": "Tôi là người đăng",
            "managerOwner": "Đồng quản lý - chủ",
            "managerGuest": "Đồng quản lý - khách",
            "editorOwner": "Biên tập - chủ",
            "editorGuest": "Biên tập - khách"
        }
        self.wd_role_vars = {role: tk.BooleanVar(value=role in self.wikidich_filters.get('roles', [])) for role in wikidich_ext.ROLE_OPTIONS}
        for role in wikidich_ext.ROLE_OPTIONS:
            ttk.Checkbutton(roles_frame, text=role_labels.get(role, role), variable=self.wd_role_vars[role]).pack(anchor="w")

        self.wd_adv_container.grid_remove()

        self._wd_sync_filter_controls_from_filters()

        main_pane = ttk.PanedWindow(wd_tab, orient=tk.HORIZONTAL)
        main_pane.grid(row=3, column=0, sticky="nsew", pady=(8, 0))

        detail_frame = ttk.Frame(main_pane, padding=6)
        detail_frame.columnconfigure(1, weight=1)
        detail_frame.rowconfigure(3, weight=1)
        main_pane.add(detail_frame, weight=3)

        self.wd_title_label = ttk.Label(detail_frame, text="Chưa chọn truyện", font=("Segoe UI", 11, "bold"))
        self.wd_title_label.grid(row=0, column=0, columnspan=2, sticky="w")

        cover_frame = ttk.Frame(detail_frame)
        cover_frame.grid(row=1, column=0, rowspan=3, sticky="nw", pady=(6, 0))
        self.wd_cover_label = tk.Label(cover_frame, text="(Bìa)", bd=0)
        self.wd_cover_label.pack()

        info_frame = ttk.Frame(detail_frame)
        info_frame.grid(row=1, column=1, sticky="new", padx=(10, 0), pady=(6, 0))
        info_frame.columnconfigure(1, weight=1)
        self.wd_info_vars = {
            'author': tk.StringVar(value=""),
            'status': tk.StringVar(value=""),
            'updated': tk.StringVar(value=""),
            'chapters': tk.StringVar(value=""),
            'collections': tk.StringVar(value=""),
            'flags': tk.StringVar(value="")
        }
        ttk.Label(info_frame, text="Tác giả:").grid(row=0, column=0, sticky="w")
        ttk.Label(info_frame, textvariable=self.wd_info_vars['author']).grid(row=0, column=1, sticky="w")
        ttk.Label(info_frame, text="Trạng thái:").grid(row=1, column=0, sticky="w")
        ttk.Label(info_frame, textvariable=self.wd_info_vars['status']).grid(row=1, column=1, sticky="w")
        ttk.Label(info_frame, text="Cập nhật:").grid(row=2, column=0, sticky="w")
        ttk.Label(info_frame, textvariable=self.wd_info_vars['updated']).grid(row=2, column=1, sticky="w")
        ttk.Label(info_frame, text="Số chương:").grid(row=3, column=0, sticky="w")
        ttk.Label(info_frame, textvariable=self.wd_info_vars['chapters']).grid(row=3, column=1, sticky="w")
        ttk.Label(info_frame, text="Thể loại/Tag:").grid(row=4, column=0, sticky="nw", pady=(4, 0))
        ttk.Label(info_frame, textvariable=self.wd_info_vars['collections'], wraplength=320, justify=tk.LEFT).grid(row=4, column=1, sticky="w", pady=(4, 0))
        ttk.Label(info_frame, text="Vai trò/Thuộc tính:").grid(row=5, column=0, sticky="nw", pady=(4, 0))
        ttk.Label(info_frame, textvariable=self.wd_info_vars['flags'], wraplength=320, justify=tk.LEFT).grid(row=5, column=1, sticky="w", pady=(4, 0))

        links_frame = ttk.LabelFrame(detail_frame, text="Link bổ sung", padding=6)
        links_frame.grid(row=2, column=1, sticky="ew", padx=(10, 0), pady=(6, 0))
        links_frame.columnconfigure(0, weight=1)
        self.wd_links_listbox = tk.Listbox(links_frame, height=4)
        self.wd_links_listbox.grid(row=0, column=0, sticky="ew")
        self.wd_links_listbox.bind("<Double-Button-1>", self._wd_open_extra_link)
        self.wd_current_links = []

        summary_frame = ttk.LabelFrame(detail_frame, text="Văn án", padding=6)
        summary_frame.grid(row=3, column=0, columnspan=2, sticky="nsew", pady=(8, 0))
        summary_frame.columnconfigure(0, weight=1)
        summary_frame.rowconfigure(0, weight=1)
        self.wd_summary_text = scrolledtext.ScrolledText(summary_frame, wrap=tk.WORD, height=12, state="disabled")
        self.wd_summary_text.grid(row=0, column=0, sticky="nsew")
        button_row = ttk.Frame(summary_frame)
        button_row.grid(row=1, column=0, sticky="e", pady=(6, 0))
        ttk.Button(button_row, text="Mở trang truyện", command=self._wd_open_book_in_browser).pack(side=tk.LEFT)
        self.wd_update_button = ttk.Button(button_row, text="Bổ sung chương", command=self._wd_open_update_dialog, state=tk.DISABLED)
        self.wd_update_button.pack(side=tk.LEFT, padx=(8, 0))

        tree_frame = ttk.Frame(main_pane)
        main_pane.add(tree_frame, weight=2)

        columns = ("title", "status", "updated", "chapters", "new_chapters", "views", "author")
        self.wd_tree = ttk.Treeview(tree_frame, columns=columns, show="headings", selectmode="browse")
        column_labels = {
            "title": "Tiêu đề",
            "status": "Trạng thái",
            "updated": "Cập nhật",
            "chapters": "Wiki",
            "new_chapters": "New",
            "views": "Lượt xem",
            "author": "Tác giả"
        }
        for col, width in zip(columns, [240, 110, 110, 80, 90, 90, 160]):
            self.wd_tree.heading(col, text=column_labels.get(col, col.capitalize()))
            self.wd_tree.column(col, width=width, anchor="w")
        self.wd_tree.tag_configure("has_new", foreground="#16a34a")
        self.wd_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.wd_tree.bind("<<TreeviewSelect>>", self._wd_on_select)
        tree_scroll = ttk.Scrollbar(tree_frame, orient="vertical", command=self.wd_tree.yview)
        self.wd_tree.configure(yscrollcommand=tree_scroll.set)
        tree_scroll.pack(side=tk.RIGHT, fill=tk.Y)

        self._wd_update_user_label()
        self._wd_apply_filters()
    def create_text_operations_tab(self):
        text_ops_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(text_ops_tab, text="Xử lý Văn bản")
        text_ops_tab.rowconfigure(1, weight=1)
        text_ops_tab.columnconfigure(0, weight=1)

        file_frame = ttk.LabelFrame(text_ops_tab, text="1. Chọn file (dùng chung cho các tab bên dưới)", padding="10")
        file_frame.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        ttk.Entry(file_frame, textvariable=self.selected_file, state="readonly").pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        ttk.Button(file_frame, text="Chọn...", command=self._select_file_for_ops).pack(side=tk.LEFT)

        # Simplify: Remove automatic file loading logic
        self.ops_notebook = ttk.Notebook(text_ops_tab)
        ops_notebook = self.ops_notebook

        ops_notebook.grid(row=1, column=0, sticky="nsew")

        # Find/Replace sub-tab
        find_replace_frame = ttk.Frame(ops_notebook, padding="10")
        ops_notebook.add(find_replace_frame, text="Tìm & Thay thế")
        self._create_find_replace_widgets(find_replace_frame)

        # Split file sub-tab
        split_frame = ttk.Frame(ops_notebook, padding="10")
        ops_notebook.add(split_frame, text="Chia file")
        self._create_split_widgets(split_frame)

        tools_frame = ttk.Frame(ops_notebook, padding="10")
        ops_notebook.add(tools_frame, text="Công cụ Nhanh")
        self._create_quick_tools_widgets(tools_frame)

    def _create_find_replace_widgets(self, parent):
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(0, weight=1)

        # Tạo PanedWindow chính theo chiều dọc
        main_paned = ttk.PanedWindow(parent, orient=tk.VERTICAL)
        main_paned.grid(row=0, column=0, sticky="nsew")
        
        # Frame cho phần tùy chọn 
        options_frame = ttk.LabelFrame(main_paned, text="1. Tùy chọn", padding="10")
        main_paned.add(options_frame, weight=0)
        
        find_frame = ttk.Frame(options_frame)
        find_frame.pack(fill=tk.X)
        ttk.Label(find_frame, text="Tìm:        ").pack(side=tk.LEFT)
        self.find_text = ttk.Combobox(find_frame)
        self.find_text.pack(side=tk.LEFT, fill=tk.X, expand=True)
        ttk.Button(find_frame, text="?", width=1, command=lambda: self.show_regex_guide("find_replace")).pack(side=tk.LEFT, padx=5)
        self.find_pin_btn = ttk.Button(find_frame, text="Ghim", width=6, command=lambda: self._toggle_pin('find', self.find_text, self.find_pin_btn))
        self.find_pin_btn.pack(side=tk.LEFT)
        self.find_text.bind("<<ComboboxSelected>>", lambda e: self._sync_pin_button('find', self.find_text, self.find_pin_btn))
        self.find_text.bind("<KeyRelease>", lambda e: self._sync_pin_button('find', self.find_text, self.find_pin_btn))
        replace_frame = ttk.Frame(options_frame)
        replace_frame.pack(fill=tk.X, pady=5)
        ttk.Label(replace_frame, text="Thay thế:").pack(side=tk.LEFT)
        self.replace_text = ttk.Combobox(replace_frame)
        self.replace_text.pack(side=tk.LEFT, fill=tk.X, expand=True)
        ttk.Label(replace_frame, text="(Dùng $1, $2...)").pack(side=tk.LEFT, padx=5)
        opts_frame = ttk.Frame(options_frame)
        opts_frame.pack(fill=tk.X, pady=5)
        self.match_case = tk.BooleanVar(value=False)
        self.match_word = tk.BooleanVar(value=False)
        self.use_regex = tk.BooleanVar(value=False)
        self.search_up = tk.BooleanVar(value=False)
        ttk.Checkbutton(opts_frame, text="Khớp chữ hoa/thường", variable=self.match_case).pack(side=tk.LEFT, padx=5)
        ttk.Checkbutton(opts_frame, text="Khớp toàn bộ từ", variable=self.match_word).pack(side=tk.LEFT, padx=5)
        ttk.Checkbutton(opts_frame, text="Dùng Regex", variable=self.use_regex).pack(side=tk.LEFT, padx=5)
        ttk.Checkbutton(opts_frame, text="Tìm ngược lên", variable=self.search_up).pack(side=tk.LEFT, padx=5)


        # Frame cho phần nội dung 
        content_frame = ttk.LabelFrame(main_paned, text="2. Nội dung & Hành động", padding="10")
        main_paned.add(content_frame, weight=1)
        content_frame.rowconfigure(0, weight=1)
        content_frame.columnconfigure(0, weight=1)

        self.text_content = scrolledtext.ScrolledText(content_frame, wrap=tk.WORD, undo=True)
        self.text_content.grid(row=0, column=0, columnspan=7, sticky="nsew")
        self.text_content.bind("<<Modified>>", self._mark_text_as_modified)

        button_grid_frame = ttk.Frame(content_frame)
        button_grid_frame.grid(row=1, column=0, columnspan=7, pady=(10,0), sticky="ew")
        
        ttk.Button(button_grid_frame, text="Tìm tiếp", command=self._find_next).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0,5))
        ttk.Button(button_grid_frame, text="Thay thế", command=self._replace_current).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Thay thế tất cả", command=self._replace_all).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Lưu", command=self._save_changes).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Lưu thành file mới...", command=self._save_as).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Hoàn tác", command=self.text_content.edit_undo).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        ttk.Button(button_grid_frame, text="Làm lại", command=self.text_content.edit_redo).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(5,0))
    
    def _create_split_widgets(self, parent):
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(0, weight=1)

        # Tạo PanedWindow chính theo chiều dọc
        main_paned = ttk.PanedWindow(parent, orient=tk.VERTICAL)
        main_paned.grid(row=0, column=0, sticky="nsew")

        # Frame cho tùy chọn chia file
        options_frame = ttk.LabelFrame(main_paned, text="1. Tùy chọn chia file", padding="10")
        main_paned.add(options_frame, weight=0)
        options_frame.columnconfigure(1, weight=1)

        ttk.Label(options_frame, text="Regex chia file:").grid(row=0, column=0, sticky="w", padx=5, pady=5)
        self.split_regex = ttk.Combobox(options_frame)
        self.split_regex.grid(row=0, column=1, sticky="ew")
        ttk.Button(options_frame, text="?", width=1, command=lambda: self.show_regex_guide("split")).grid(row=0, column=2, padx=5)
        self.split_pin_btn = ttk.Button(options_frame, text="Ghim", width=6, command=lambda: self._toggle_pin('split', self.split_regex, self.split_pin_btn))
        self.split_pin_btn.grid(row=0, column=3, padx=(0,5))
        self.split_regex.bind("<<ComboboxSelected>>", lambda e: self._sync_pin_button('split', self.split_regex, self.split_pin_btn))
        self.split_regex.bind("<KeyRelease>", lambda e: self._sync_pin_button('split', self.split_regex, self.split_pin_btn))
        
        ttk.Label(options_frame, text="Cấu trúc tên file:").grid(row=1, column=0, sticky="w", padx=5, pady=5)
        self.split_format_combobox = ttk.Combobox(options_frame)
        self.split_format_combobox.grid(row=1, column=1, sticky="ew")
        self.split_format_combobox.set("part_{num}.txt")
        ttk.Label(options_frame, text="(Dùng {num}, {num+n}, {num-n})").grid(row=1, column=2, padx=5)

        pos_frame = ttk.Frame(options_frame)
        pos_frame.grid(row=2, column=0, columnspan=2, sticky="w", padx=5, pady=5)
        self.split_position = tk.StringVar(value="after")
        ttk.Radiobutton(pos_frame, text="Chia sau regex", variable=self.split_position, value="after").pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(pos_frame, text="Chia trước regex", variable=self.split_position, value="before").pack(side=tk.LEFT, padx=5)

        # Tạo frame riêng cho 2 nút ở cột 2
        button_frame = ttk.Frame(options_frame)
        button_frame.grid(row=2, column=2, sticky="e", padx=5, pady=5)

        ttk.Button(button_frame, text="Xem trước", command=self._preview_split).grid(row=0, column=0, padx=2)
        ttk.Button(button_frame, text="BẮT ĐẦU CHIA FILE", command=self._execute_split).grid(row=0, column=1, padx=2)


        # Frame cho xem trước kết quả 
        preview_frame = ttk.LabelFrame(main_paned, text="2. Xem trước kết quả chia", padding="10")
        main_paned.add(preview_frame, weight=1)

        cols = ("STT", "Nội dung bắt đầu", "Kích thước")
        self.split_tree = ttk.Treeview(preview_frame, columns=cols, show='headings')
        self.split_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.split_tree.bind("<Double-1>", self._open_preview_file)  # Bind double-click to open preview

        for col, width in zip(cols, [50, 400, 100]):
            self.split_tree.heading(col, text=col)
            self.split_tree.column(col, width=width, anchor='w')

        vsb = ttk.Scrollbar(preview_frame, orient="vertical", command=self.split_tree.yview)
        vsb.pack(side=tk.RIGHT, fill=tk.Y)
        self.split_tree.configure(yscrollcommand=vsb.set)
    
    
    def _open_preview_file(self, event):
        """Open a new window to display the content of the selected preview file."""
        item_id = self.split_tree.identify_row(event.y)
        if item_id:
            self.split_tree.selection_set(item_id)
        selected_item = self.split_tree.selection()
        if not selected_item:
            return

        item_data = self.split_tree.item(selected_item[0], 'values')
        if not item_data:
            return

        try:
            file_index = int(item_data[0]) - 1  # Get the file index from the first column
        except Exception:
            messagebox.showerror("Lỗi", "Dữ liệu hàng không hợp lệ.")
            return

        filepath = self.selected_file.get()
        regex = self.split_regex.get()
        name_format = self.split_format_combobox.get()

        # Lấy toàn bộ các phần (full chunks) thay vì chỉ preview
        chunks, error = TextOperations.get_split_chunks(filepath, regex, self.split_position.get())
        if error or file_index >= len(chunks):
            messagebox.showerror("Lỗi", "Không thể mở nội dung file.")
            return

        # chunks[i] = (full_chunk_string, size)
        file_content = chunks[file_index][0]
        file_name = TextOperations.render_split_filename(name_format, file_index + 1)

        # Create a new window to display the content
        preview_window = tk.Toplevel(self)
        preview_window.title(f"Xem trước: {file_name}")
        preview_window.geometry("800x600")

        text_widget = scrolledtext.ScrolledText(preview_window, wrap=tk.WORD, state="normal")
        text_widget.pack(fill=tk.BOTH, expand=True)
        text_widget.insert("1.0", file_content)
        text_widget.config(state="disabled")

    def _mark_text_as_modified(self, event=None):
        """Được gọi khi text widget được sửa đổi. Đặt cờ 'modified'."""
        if self.text_content.edit_modified():
            self.text_modified.set(True)
        self.text_content.edit_modified(False)

    def _save_as(self):
        """Lưu nội dung hiện tại vào một file mới."""
        new_filepath = filedialog.asksaveasfilename(
            title="Lưu thành file mới",
            initialfile=os.path.basename(self.selected_file.get() or "untitled.txt"),
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if new_filepath:
            try:
                content = self.text_content.get("1.0", tk.END)
                with open(new_filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                # Cập nhật file đang được chọn thành file mới
                self.selected_file.set(new_filepath)
                self.text_modified.set(False)
                self.log(f"Đã lưu file thành công với tên mới: '{os.path.basename(new_filepath)}'")
                messagebox.showinfo("Thành công", f"Đã lưu file thành công:\n{new_filepath}")
            except Exception as e:
                messagebox.showerror("Lỗi", f"Không thể lưu file: {str(e)}")
    
    def _select_file_for_ops(self, filepath=None):
        """Chọn file cần xử lý hoặc mở file được chỉ định."""
        if not filepath:
            filepath = filedialog.askopenfilename(
                title="Chọn file cần xử lý",
                filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
            )
        if filepath:
            if self.text_modified.get():
                response = messagebox.askyesnocancel(
                    "Lưu thay đổi?",
                    "File hiện tại đã bị thay đổi. Bạn có muốn lưu lại trước khi mở file mới không?"
                )
                if response is True:
                    if not self._save_changes():
                        return
                elif response is None:
                    return

            self.selected_file.set(filepath)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    self.text_content.delete('1.0', tk.END)
                    self.text_content.insert('1.0', content)
                    self.text_content.edit_reset()
                    self.text_content.edit_modified(False)
                    self.text_modified.set(False)
                    self.log(f"Đã mở file '{os.path.basename(filepath)}' để xử lý văn bản.")
                    self.text_content.mark_set(tk.INSERT, "1.0")
                    self.text_content.focus_set()
                    self.split_tree.delete(*self.split_tree.get_children())
                    self._last_loaded_file = filepath
            except Exception as e:
                messagebox.showerror("Lỗi", f"Không thể đọc file: {e}")

    def _find_next(self):
        find_what = self.find_text.get()
        if not find_what:
            return
        
        self._update_history_combobox(self.find_text, key='find')

        result = TextOperations.find_text(
            self.text_content,
            find_what,
            match_case=self.match_case.get(),
            match_word=self.match_word.get(),
            use_regex=self.use_regex.get(),
            search_up=self.search_up.get()
        )

        if result:
            self.log(f"Đã tìm thấy \"{find_what}\".")
            start_pos, length = result
            self.text_content.tag_remove(tk.SEL, '1.0', tk.END)
            end_pos = f"{start_pos}+{length}c"
            self.text_content.tag_add(tk.SEL, start_pos, end_pos)
            self.text_content.mark_set(tk.INSERT, end_pos)
            self.text_content.see(start_pos)
            self.text_content.focus_set() # Vẫn focus vào text để người dùng thấy kết quả
        else:
            self.log(f"Không tìm thấy \"{find_what}\".")
            messagebox.showinfo("Không tìm thấy", f"Không tìm thấy \"{find_what}\"", parent=self)
    
    def _replace_current(self):
        try:
            if not self.text_content.tag_ranges(tk.SEL):
                self._find_next()
                if not self.text_content.tag_ranges(tk.SEL): return
        except tk.TclError:
            self._find_next()
            if not self.text_content.tag_ranges(tk.SEL): return

        find_what = self.find_text.get()
        replace_with = self.replace_text.get()
        if find_what: self._update_history_combobox(self.find_text, key='find')
        if replace_with: self._update_history_combobox(self.replace_text, key='replace')

        replaced = TextOperations.replace_text(
            self.text_content,
            find_what,
            replace_with,
            match_case=self.match_case.get(),
            use_regex=self.use_regex.get()
        )

        if replaced:
            self.log(f"Đã thay thế lựa chọn hiện tại bằng '{replace_with}'.") # GHI LOG
            self._find_next()
        else:
            messagebox.showwarning("Thay thế", "Văn bản được chọn không khớp với văn bản tìm kiếm.", parent=self)

    def _replace_all(self):
        find_what = self.find_text.get()
        replace_with = self.replace_text.get()
        if not find_what: return
        
        if find_what: self._update_history_combobox(self.find_text, key='find')
        if replace_with: self._update_history_combobox(self.replace_text, key='replace')

        if not messagebox.askyesno("Xác nhận", "Bạn có chắc muốn thay thế tất cả trong file này?"):
            return

        count = TextOperations.replace_all(
            self.text_content, find_what, replace_with,
            match_case=self.match_case.get(),
            match_word=self.match_word.get(),
            use_regex=self.use_regex.get()
        )
        if count > 0:
            self.log(f"Thay thế tất cả: {count} kết quả được thay thế cho '{find_what}'.") # GHI LOG
            self._mark_text_as_modified()
        messagebox.showinfo("Hoàn tất", f"Đã thay thế {count} kết quả.", parent=self)

    def _save_changes(self):
        """Lưu các thay đổi vào file hiện tại. Trả về True nếu thành công, False nếu thất bại/hủy."""
        filepath = self.selected_file.get()
        if not filepath:
            messagebox.showerror("Lỗi", "Chưa có file nào được chọn.")
            return False
        
        if not messagebox.askyesno("Xác nhận", f"Lưu các thay đổi vào file:\n{os.path.basename(filepath)}?"):
            return False

        try:
            content = self.text_content.get("1.0", tk.END)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

            self.text_modified.set(False)
            self.log(f"Đã lưu thành công file: {os.path.basename(filepath)}")
            messagebox.showinfo("Thành công", "Đã lưu file thành công.")
            return True
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể lưu file: {str(e)}")
            return False

    def _save_as(self):
        """Lưu nội dung hiện tại vào một file mới."""
        new_filepath = filedialog.asksaveasfilename(
            title="Lưu thành file mới",
            initialfile=os.path.basename(self.selected_file.get() or "untitled.txt"),
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if new_filepath:
            try:
                content = self.text_content.get("1.0", tk.END)
                with open(new_filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                # Cập nhật file đang được chọn thành file mới
                self.selected_file.set(new_filepath)
                self.text_modified.set(False)
                self.log(f"Đã lưu file thành công với tên mới: '{os.path.basename(new_filepath)}'")
                messagebox.showinfo("Thành công", f"Đã lưu file thành công:\n{new_filepath}")
            except Exception as e:
                messagebox.showerror("Lỗi", f"Không thể lưu file: {str(e)}")

    def _preview_split(self):
        filepath = self.selected_file.get()
        regex = self.split_regex.get()
        if not filepath or not regex:
            messagebox.showwarning("Thiếu thông tin", "Vui lòng chọn file ở trên và nhập Regex.")
            return
        
        self._update_history_combobox(self.split_regex, key='split')
        preview_data, error = TextOperations.split_file(filepath, regex, self.split_position.get())

        self.split_tree.delete(*self.split_tree.get_children())
        if error:
            messagebox.showerror("Lỗi Regex", error)
            return
        
        for i, (content, size) in enumerate(preview_data):
            # Hiển thị nội dung đầy đủ thay vì chỉ hiển thị kích thước
            self.split_tree.insert("", "end", values=(i + 1, content.strip(), f"{size} bytes"))
        self.log(f"Xem trước chia file '{os.path.basename(filepath)}' thành {len(preview_data)} phần.")

    def _execute_split(self):
        filepath = self.selected_file.get()
        regex = self.split_regex.get()
        name_format = self.split_format_combobox.get()

        if not filepath or not regex or not name_format:
            messagebox.showwarning("Thiếu thông tin", "Vui lòng chọn file, nhập Regex và cấu trúc tên file.")
            return

        self._update_history_combobox(self.split_regex, key='split')
        self._update_history_combobox(self.split_format_combobox)

        if not messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn chia file '{os.path.basename(filepath)}'?"):
            return

        count, error = TextOperations.execute_split(filepath, regex, self.split_position.get(), name_format)
        if error:
            messagebox.showerror("Lỗi", f"Chia file thất bại: {error}")
        else:
            messagebox.showinfo("Hoàn tất", f"Đã chia file thành công thành {count} phần.")
            self.log(f"Đã chia file '{os.path.basename(filepath)}' thành {count} phần.")


    def _on_pos_change(self):
        self.line_num_spinbox.config(state="normal" if self.credit_position.get() == "line" else "disabled")

    def select_folder(self):
        path = filedialog.askdirectory(title="Chọn thư mục chứa file .txt")
        if path:
            self.folder_path.set(path)
            self.log(f"Đã chọn thư mục: {path}")
            self.schedule_preview_update(None)

    def log(self, message):
        self.log_text.config(state='normal')
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)
        self.log_text.config(state='disabled')

    def _on_cookie_window_closed(self):
        self.cookie_window = None
        self._update_cookie_menu_state()

    def _set_browser_menu_state(self, enabled: bool):
        state = tk.NORMAL if enabled else tk.DISABLED
        menubar = getattr(self, "menubar", None)
        if menubar:
            try:
                menubar.entryconfig(self.browser_menu_label, state=state)
            except tk.TclError:
                pass

    def _set_cookie_menu_state(self, enabled: bool):
        state = tk.NORMAL if enabled else tk.DISABLED
        menubar = getattr(self, "menubar", None)
        if menubar:
            try:
                menubar.entryconfig(self.cookie_menu_label, state=state)
            except tk.TclError:
                pass

    def _update_cookie_menu_state(self):
        overlay_active = (
            hasattr(self, "browser_overlay")
            and self.browser_overlay
            and self.browser_overlay.is_running()
        )
        cookie_window_open = bool(self.cookie_window and self.cookie_window.winfo_exists())
        self._set_cookie_menu_state(not overlay_active and not cookie_window_open)

    def _register_paned(self, paned: ttk.PanedWindow, key: str):
        """Ghi nhớ pane để khôi phục vị trí sash và lưu cấu hình."""
        pass

    def _restore_pane_size(self, key: str):
        return

    def _restore_all_panes(self):
        return

    def _update_pane_size(self, key: str):
        return

    def _capture_all_pane_sizes(self):
        return

    def _get_paned_size(self, paned: ttk.PanedWindow, is_horizontal: bool) -> int:
        return 0

    def on_browser_overlay_opened(self):
        self._set_browser_menu_state(False)
        self._update_cookie_menu_state()

    def on_browser_overlay_closed(self):
        self._set_browser_menu_state(True)
        self._update_cookie_menu_state()

    def _open_in_app_browser(self, url: str):
        url = (url or "").strip()
        if not url:
            return
        overlay = getattr(self, "browser_overlay", None)
        if overlay and overlay.available():
            if overlay.is_running():
                overlay.navigate(url)
            else:
                overlay.current_url = url
                overlay.show()
        else:
            webbrowser.open(url)

    def schedule_preview_update(self, event=None):
        if self.preview_job: self.after_cancel(self.preview_job)
        self.preview_job = self.after(300, self._update_rename_preview)

    def _update_rename_preview(self):
        path = self.folder_path.get()
        if not os.path.isdir(path): return
        # đảm bảo hiển thị/hide nút bắt buộc sửa theo trạng thái checkbox
        self._toggle_force_edit_first_line(schedule=False)

        # lưu selection hiện tại theo filename để phục hồi sau khi refresh
        current_selection = {self.tree.item(item, 'values')[1] for item in self.tree.selection()}
        self.tree.delete(*self.tree.get_children())
        self.files_data.clear()
        
        self.log("Bắt đầu quét và phân tích lại các file...")
        try:
            files = [f for f in os.listdir(path) if f.lower().endswith(".txt")]
        except Exception as e:
            self.log(f"Lỗi khi truy cập thư mục: {e}"); messagebox.showerror("Lỗi", f"Không thể đọc các file trong thư mục: {e}"); return

        for filename in files:
            filepath = os.path.join(path, filename)
            fn_regex_list = self.filename_regex_text.get("1.0", tk.END).strip().split('\n')
            ct_regex_list = self.content_regex_text.get("1.0", tk.END).strip().split('\n')
            analysis = logic.analyze_file(filepath, 
                                        custom_filename_regexes=fn_regex_list, 
                                        custom_content_regexes=ct_regex_list)
            self.files_data.append(analysis)
        
        # Sắp xếp file và lưu vào cache
        self._sort_files()

        # Hiển thị file đã sắp xếp lên Treeview
        for i, analysis in enumerate(self.sorted_files_cache):
            self._insert_file_to_tree(analysis, i)
            # phục hồi selection nếu trùng filename
            if analysis['filename'] in current_selection:
                try:
                    last_item = self.tree.get_children()[-1]
                    self.tree.selection_add(last_item)
                except Exception:
                    pass
        
        self.log(f"Phân tích hoàn tất cho {len(self.files_data)} file.")
        self.preview_job = None
        
        # Cập nhật combobox ở tab credit
        sorted_filenames = [f['filename'] for f in self.sorted_files_cache]
        if sorted_filenames:
            self.credit_file_selector['values'] = sorted_filenames
            self.credit_file_selector.current(0)
        else:
            self.credit_file_selector['values'] = []; self.credit_file_selector.set('')

    def start_renaming(self):
        if not self.sorted_files_cache: messagebox.showwarning("Cảnh báo", "Chưa có file nào để đổi tên."); return
        
        files_to_rename = [f for f in self.sorted_files_cache if f['filename'] not in self.excluded_files]
        if not files_to_rename: messagebox.showwarning("Cảnh báo", "Tất cả file đã bị loại trừ hoặc không có file nào."); return

        if not messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn đổi tên {len(files_to_rename)} file không?"): return
        
        self.log("="*20 + " BẮT ĐẦU ĐỔI TÊN " + "="*20)
        success, fail = 0, 0
        folder, strategy, name_format = self.folder_path.get(), self.strategy.get(), self.format_combobox.get()
        self._update_history_combobox(self.format_combobox)
        
        custom_titles = self.custom_titles_text.get("1.0", tk.END).strip().split('\n') if self.use_custom_titles.get() else None
        
        for i, analysis in enumerate(self.sorted_files_cache):
            if analysis['filename'] in self.excluded_files:
                self.log(f"[Loại trừ] Bỏ qua file: {analysis['filename']}")
                continue
            
            new_name = logic.generate_new_name(analysis, strategy, name_format, custom_titles, i)

            if self.edit_first_line_var.get():
                # Điều kiện để sửa: (có tên mới hợp lệ) HOẶC (người dùng bắt buộc sửa)
                if new_name is not None or self.force_edit_first_line_var.get():
                    try:
                        # Dùng định dạng gốc (không sanitize) cho dòng đầu để giữ ký tự đặc biệt nếu cần
                        preview_name_for_line = logic.generate_new_name(
                            analysis,
                            strategy,
                            name_format,
                            custom_titles=custom_titles,
                            file_index=i,
                            sanitize_output=False
                        ) or self._generate_preview_name(analysis, i)
                        new_first_line = os.path.splitext(preview_name_for_line)[0]
                        
                        with open(analysis['filepath'], 'r', encoding='utf-8') as f:
                            lines = f.readlines()
                        
                        if lines: lines[0] = new_first_line + '\n'
                        else: lines.append(new_first_line + '\n')
                        
                        with open(analysis['filepath'], 'w', encoding='utf-8') as f:
                            f.writelines(lines)
                        self.log(f"[Sửa nội dung] Đã cập nhật dòng đầu của file: {analysis['filename']}")
                    except Exception as e:
                        self.log(f"[Lỗi nội dung] Không thể sửa dòng đầu file {analysis['filename']}: {e}")
                else:
                    self.log(f"[Cảnh báo] Bỏ qua sửa dòng đầu cho file {analysis['filename']} vì không lấy được số chương và không bị bắt buộc.")

            if new_name is None: self.log(f"[Bỏ qua] {analysis['filename']}: Không tìm thấy số chương."); fail += 1; continue
            if new_name == analysis['filename']: self.log(f"[Bỏ qua] {analysis['filename']}: Tên đã đúng."); continue
            
            try:
                os.rename(analysis['filepath'], os.path.join(folder, new_name))
                self.log(f"[Thành công] {analysis['filename']} -> {new_name}"); success += 1
            except Exception as e:
                self.log(f"[Lỗi] {analysis['filename']}: {e}"); fail += 1
        
        self.log(f"Hoàn tất! Thành công: {success}, Thất bại/Bỏ qua: {fail}")
        messagebox.showinfo("Hoàn tất", f"Đã xong.\nThành công: {success}\nThất bại/Bỏ qua: {fail + len(self.excluded_files)}")
        self.schedule_preview_update(None)
        
    def preview_credit(self):
        # Lấy tên file trực tiếp từ Combobox, không cần qua tab khác
        filename = self.credit_file_selector.get()
        if not filename:
            messagebox.showinfo("Thông báo", "Vui lòng chọn một file từ danh sách thả xuống để xem trước.")
            return

        filepath = os.path.join(self.folder_path.get(), filename)
        # Lấy nội dung từ Text widget
        credit_content = self.credit_text_widget.get("1.0", tk.END).strip()
        try:
            line_num = self.credit_line_num.get()
        except tk.TclError:
            line_num = 1 # Mặc định là dòng 1 nếu ô trống
        new_content = logic.modify_content(filepath, credit_content, self.credit_position.get(), line_num, preview_only=True)
        
        self.credit_preview_text.config(state="normal")
        self.credit_preview_text.delete('1.0', tk.END)
        self.credit_preview_text.insert('1.0', new_content)
        self.credit_preview_text.config(state="disabled")
        self.log(f"Đã tạo xem trước credit cho file: {filename}")

    def apply_credit_to_all(self):
        if not self.files_data: messagebox.showwarning("Cảnh báo", "Chưa có file nào để áp dụng."); return
        if not messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn thêm credit vào {len(self.files_data)} file không? Hành động này sẽ GHI ĐÈ file."): return
        self.log("="*20 + " BẮT ĐẦU THÊM CREDIT " + "="*20)
        success, fail = 0, 0
        credit_text = self.credit_text_widget.get("1.0", tk.END).strip()
        pos = self.credit_position.get()
        try:
            line_num = self.credit_line_num.get()
        except tk.TclError:
            line_num = 1
        for file_info in self.files_data:
            result = logic.modify_content(file_info['filepath'], credit_text, pos, line_num)
            if result is True: self.log(f"[Thành công] Thêm credit vào file: {file_info['filename']}"); success += 1
            else: self.log(f"[Lỗi] {file_info['filename']}: {result}"); fail += 1
        self.log(f"Hoàn tất! Thành công: {success}, Thất bại: {fail}")
        messagebox.showinfo("Hoàn tất", f"Quá trình thêm credit đã xong.\nThành công: {success}\nThất bại: {fail}")
    
    def _apply_history_with_pins(self, combobox, history_list, pin_key=None):
        pins = []
        if pin_key:
            pins = [p for p in self.regex_pins.get(pin_key, []) if p]
        combined = []
        for v in pins + list(history_list or []):
            if v and v not in combined:
                combined.append(v)
        combobox['values'] = combined

    def _update_history_combobox(self, combobox, key=None, max_history=20):
        """Thêm giá trị hiện tại vào đầu danh sách lịch sử."""
        current_value = combobox.get().strip()
        if not current_value:
            return
        history = [item for item in combobox['values'] if item.strip()]
        pins = []
        if key:
            pins = [p for p in self.regex_pins.get(key, []) if p]
        if current_value in history:
            history.remove(current_value)
        history.insert(0, current_value)
        combined = []
        for v in pins + history:
            if v and v not in combined:
                combined.append(v)
        if pins:
            pin_set = set(pins)
            pinned_part = [v for v in combined if v in pin_set]
            other_part = [v for v in combined if v not in pin_set][:max_history]
            combined = pinned_part + other_part
        else:
            combined = combined[:max_history]
        combobox['values'] = combined

    def _toggle_pin(self, key, combobox, button=None):
        value = combobox.get().strip()
        if not value:
            messagebox.showinfo("Thông báo", "Không có nội dung để ghim.", parent=self)
            return
        pins = [p for p in self.regex_pins.get(key, []) if p]
        if value in pins:
            pins = [p for p in pins if p != value]
        else:
            pins = [value] + pins
        self.regex_pins[key] = pins[:50]
        self._update_history_combobox(combobox, key=key)
        if button:
            self._sync_pin_button(key, combobox, button)
        self.save_config()

    def _sync_pin_button(self, key, combobox, button):
        if not button:
            return
        value = combobox.get().strip()
        pins = [p for p in self.regex_pins.get(key, []) if p]
        button.config(text="Bỏ ghim" if value and value in pins else "Ghim")
    
    def _on_notebook_tab_changed(self, event=None):
        """Khi user chuyển tab: nếu chuyển tới tab 'Xử lý Văn bản' và có selected_file hợp lệ
        thì tự động load file đó (không hiện dialog)."""
        try:
            tab_id = self.notebook.select()
            tab_text = self.notebook.tab(tab_id, 'text')
            if tab_text == "Xử lý Văn bản":
                filepath = self.selected_file.get()
                if filepath and os.path.isfile(filepath):
                    # tránh load lại cùng file nhiều lần
                    if getattr(self, "_last_loaded_file", "") != filepath:
                        self._select_file_for_ops(filepath=filepath)
                        self._last_loaded_file = filepath
                # nếu không có file hợp lệ thì không làm gì (user có thể bấm Chọn... để mở)
        except Exception as e:
            # phòng khi notebook chưa sẵn sàng hoặc lỗi khác
            print(f"Lỗi trong _on_notebook_tab_changed: {e}")

    def _sort_files(self):
        """Sắp xếp danh sách file theo số chương và lưu vào cache."""
        sort_by = self.sort_strategy.get() # 'content' or 'filename'
        
        def get_sort_key(analysis):
            num = None
            if sort_by == 'content':
                num = analysis['from_content']['num']
            else: # 'filename'
                num = analysis['from_filename']['num']
            # Nếu không tìm thấy số ở nguồn ưu tiên, thử nguồn còn lại
            if num is None:
                num = analysis['from_filename']['num'] if sort_by == 'content' else analysis['from_content']['num']
            
            return num if num is not None else float('inf')
        self.sorted_files_cache = sorted(self.files_data, key=get_sort_key)

    def _sort_and_refresh_ui(self):
        """Sắp xếp lại cache và làm mới Treeview mà không cần phân tích lại file."""
        if not self.files_data:
            return
        self._sort_files()
        self.tree.delete(*self.tree.get_children())
        for i, analysis in enumerate(self.sorted_files_cache):
            self._insert_file_to_tree(analysis, i)
        self.log("Đã sắp xếp lại danh sách file.")

    def _search_files(self, event=None):
        search_term = self.search_var.get().lower()
        # Xóa hết item cũ
        self.tree.delete(*self.tree.get_children())
        # Thêm lại các item khớp với tìm kiếm
        for i, analysis in enumerate(self.sorted_files_cache):
            if search_term in analysis['filename'].lower():
                self._insert_file_to_tree(analysis, i)

    def _toggle_exclusion(self, exclude: bool):
        selected_items = self.tree.selection()
        if not selected_items: return
        
        for item_id in selected_items:
            try:
                filename = self.tree.item(item_id, 'values')[1]
                if exclude:
                    self.excluded_files.add(filename)
                else:
                    self.excluded_files.discard(filename)
            except IndexError:
                continue # Bỏ qua nếu không lấy được tên file
        
        self._refresh_tree_tags() # Gọi hàm làm mới màu sắc

    def _refresh_tree_tags(self):
        """Cập nhật lại tags và cột trạng thái cho tất cả các dòng."""
        for item_id in self.tree.get_children():
            try:
                values = list(self.tree.item(item_id, 'values'))
                filename = values[1] # Tên file giờ ở cột thứ 2

                if filename in self.excluded_files:
                    values[0] = "Loại trừ"
                    # Gộp 2 lệnh làm một: vừa cập nhật giá trị, vừa áp dụng tag màu
                    self.tree.item(item_id, values=values, tags=("excluded",))
                else:
                    values[0] = "OK"
                    # Gộp 2 lệnh làm một: vừa cập nhật giá trị, vừa xóa tag màu
                    self.tree.item(item_id, values=values, tags=())
                    
            except IndexError:
                pass

    def _insert_file_to_tree(self, analysis: dict, index: int):
        new_name = self._generate_preview_name(analysis, index)
        tags = ("excluded",) if analysis['filename'] in self.excluded_files else ()
        status = "Loại trừ" if analysis['filename'] in self.excluded_files else "OK"
        item_id = self.tree.insert("", "end", values=(
            status,
            analysis['filename'],
            analysis['from_filename']['num'] or "N/A",
            analysis['from_content']['num'] or "N/A",
            new_name
        ), tags=tags)

        # Lưu đường dẫn đầy đủ để dùng cho preview/chỉnh sửa
        try:
            folder = self.folder_path.get()
            fullpath = os.path.join(folder, analysis['filename'])
        except Exception:
            fullpath = analysis.get('filename', '')
        self.tree_filepaths[item_id] = fullpath


    def _generate_preview_name(self, analysis: dict, index: int) -> str:
        custom_titles = self.custom_titles_text.get("1.0", tk.END).strip().split('\n') if self.use_custom_titles.get() else None
        return logic.generate_new_name(
            analysis, self.strategy.get(), self.format_combobox.get(),
            custom_titles=custom_titles,
            file_index=index
        ) or "Lỗi/Thiếu số"

    def _toggle_force_edit_first_line(self, schedule: bool = True):
        if self.edit_first_line_var.get():
            if not getattr(self.force_edit_first_line_chk, "_packed", False):
                self.force_edit_first_line_chk.pack(side=tk.LEFT, padx=5)
                self.force_edit_first_line_chk._packed = True
            self.force_edit_first_line_chk.configure(state=tk.NORMAL)
        else:
            self.force_edit_first_line_var.set(False)
            if getattr(self.force_edit_first_line_chk, "_packed", False):
                self.force_edit_first_line_chk.pack_forget()
                self.force_edit_first_line_chk._packed = False
            self.force_edit_first_line_chk.configure(state=tk.DISABLED)
        if schedule:
            self.schedule_preview_update()

    def _fetch_online_titles(self):
        url = self.source_url.get()

        if not url:
            messagebox.showerror("Lỗi", "Vui lòng nhập URL mục lục.")
            return

        def _worker():
            pythoncom.CoInitialize()
            try:
                self.log(f"Đang lấy dữ liệu từ {url}...")
                
                config = SOURCE_BY_ID.get(self.selected_online_source.get())
                if not config:
                    result = {'error': 'Không tìm thấy cấu hình nguồn. Vui lòng chọn lại.'}
                else:
                    selected_site = config['site_value']
                    proxies = self._get_proxy_for_request('fetch_titles')
                    if proxies:
                        self.log(f"Sử dụng proxy: {proxies['http']}")

                    if selected_site == "jjwxc.net":
                        result = jjwxc_ext.fetch_chapters(url, proxies=proxies)
                    elif selected_site == "po18.tw":
                        result = po18_ext.fetch_chapters(url, root_window=self, proxies=proxies)
                    elif selected_site == "qidian.com":
                        result = qidian_ext.fetch_chapters(url, root_window=self, proxies=proxies)
                    elif selected_site == "fanqienovel.com":
                        result = fanqienovel_ext.fetch_chapters(url, proxies=proxies)
                    elif selected_site == "ihuaben.com":
                        result = ihuaben_ext.fetch_chapters(url, proxies=proxies)
                    else:
                        result = {'error': 'Trang web không được hỗ trợ.'}
                
                self.after(0, self._update_online_tree, result)
            finally:
                pythoncom.CoUninitialize()

        threading.Thread(target=_worker, daemon=True).start()

    def _update_online_tree(self, result):
        self.online_tree.delete(*self.online_tree.get_children())
        if 'error' in result:
            error_msg = result['error']
            self.log(f"Lỗi: {error_msg}")
            messagebox.showerror("Lỗi", error_msg)
            return # Dừng hàm sau khi xử lý lỗi
        
        chapters = result.get('data', [])
        for chap in chapters:
            self.online_tree.insert("", "end", values=(chap['num'], chap['title1'], chap['title2']))
        self.log(f"Lấy thành công {len(chapters)} chương.")

    def _apply_online_titles(self):
        selected_items = self.online_tree.selection()
        if not selected_items:
            messagebox.showinfo("Thông báo", "Vui lòng chọn ít nhất một chương từ bảng kết quả.")
            return
        
        selected_titles = []
        
        # Logic mới để gộp tiêu đề
        if self.combine_titles_var.get():
            format_str = self.title_format_var.get()
            for item_id in selected_items:
                item_data = self.online_tree.item(item_id, 'values')
                t1 = item_data[1]
                t2 = item_data[2]
                try:
                    combined_title = format_str.format(t1=t1, t2=t2)
                    selected_titles.append(combined_title)
                except KeyError:
                    # Nếu format string bị lỗi, dùng fallback
                    selected_titles.append(f"{t1} - {t2}")
        else:
            # Logic cũ
            title_key = self.title_choice.get() # 'title1' or 'title2'
            for item_id in selected_items:
                item_data = self.online_tree.item(item_id, 'values')
                title = item_data[1] if title_key == 'title1' else item_data[2]
                selected_titles.append(title)
        
        self.custom_titles_text.delete("1.0", tk.END)
        self.custom_titles_text.insert("1.0", "\n".join(selected_titles))
        self.use_custom_titles.set(True) # Tự động kích hoạt
        
        self.notebook.select(0) # Chuyển về tab Đổi Tên
        self.schedule_preview_update()
        self.log(f"Đã áp dụng {len(selected_titles)} tiêu đề tùy chỉnh.")

    def _render_markdown_guide(self, text_widget, markdown_text):
        """Render văn bản markdown đơn giản hỗ trợ heading (---...---) và bold (**...**)."""
        text_widget.config(state='normal')
        text_widget.delete('1.0', tk.END)

        # Cấu hình font
        base_font = tkfont.Font(font=text_widget.cget("font"))
        bold_font = tkfont.Font(font=base_font)
        bold_font.configure(weight='bold')
        heading_font = tkfont.Font(font=base_font)
        heading_font.configure(size=base_font.cget('size') + 2, weight='bold')

        # Cấu hình tag
        text_widget.tag_configure('bold', font=bold_font)
        text_widget.tag_configure('heading', font=heading_font, foreground="#0b5394", spacing1=5, spacing3=10)

        # Regex để tìm heading và bold
        tag_regex = re.compile(r'^---(.*?)---$|\*\*(.*?)\*\*', re.MULTILINE)
        last_end = 0

        for match in tag_regex.finditer(markdown_text):
            text_widget.insert(tk.END, markdown_text[last_end:match.start()])

            if match.group(1) is not None:  # Khớp với heading
                content = match.group(1).strip()
                text_widget.insert(tk.END, content + "\n", 'heading')
            elif match.group(2) is not None:  # Khớp với bold
                content = match.group(2)
                text_widget.insert(tk.END, content, 'bold')
            
            last_end = match.end()

        text_widget.insert(tk.END, markdown_text[last_end:])
        text_widget.config(state='disabled')

    def _select_online_range(self):
        """Chọn các chương trong bảng online dựa vào chuỗi nhập (hỗ trợ nhiều khoảng, dạng '1-5,7,10-')."""
        range_str = self.online_range_var.get().strip().lower()
        if not range_str:
            return

        all_items = self.online_tree.get_children()
        if not all_items:
            return

        def parse_token(tok: str):
            tok = tok.strip()
            if not tok:
                return None
            if tok in ('all', '*'):
                return ('all', None)
            m = re.match(r'^(\d+)?\s*-\s*(\d+)?$', tok)
            if m:
                start = int(m.group(1)) if m.group(1) else 1
                end = int(m.group(2)) if m.group(2) else float('inf')
                return (start, end)
            if tok.isdigit():
                v = int(tok)
                return (v, v)
            return None

        tokens = [t for t in re.split(r'[,\s]+', range_str) if t.strip()]
        ranges = []
        for tok in tokens:
            parsed = parse_token(tok)
            if not parsed:
                messagebox.showerror("Lỗi cú pháp", "Cú pháp không hợp lệ. Ví dụ: '1-10', '1-2,4-5', '-50', '100-', 'all', '7'.")
                return
            if parsed[0] == 'all':
                ranges = [('all', None)]
                break
            ranges.append(parsed)

        self.online_tree.selection_remove(self.online_tree.selection())  # Xóa lựa chọn cũ

        if ranges and ranges[0][0] == 'all':
            self.online_tree.selection_add(all_items)
            return

        items_to_select = []
        for item_id in all_items:
            try:
                chap_num = int(self.online_tree.item(item_id, 'values')[0])
            except Exception:
                continue
            for start, end in ranges:
                if start <= chap_num <= end:
                    items_to_select.append(item_id)
                    break

        if items_to_select:
            self.online_tree.selection_add(items_to_select)
    
    def _open_preview_from_rename(self, event):
        """Mở cửa sổ xem file khi double-click ở tab Đổi Tên."""
        selected = self.tree.selection()
        if not selected:
            return
        item = selected[0]
        filepath = self.tree_filepaths.get(item)
        if not filepath:
            # fallback lấy tên từ cột 2
            try:
                filename = self.tree.item(item, 'values')[1]
                filepath = os.path.join(self.folder_path.get(), filename)
            except Exception:
                messagebox.showerror("Lỗi", "Không xác định được đường dẫn file.")
                return

        if not os.path.isfile(filepath):
            messagebox.showerror("Lỗi", f"Không tìm thấy file:\n{filepath}")
            return

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc file: {e}")
            return

        preview_window = tk.Toplevel(self)
        preview_window.title(os.path.basename(filepath))
        preview_window.geometry("800x600")

        txt = scrolledtext.ScrolledText(preview_window, wrap=tk.WORD)
        txt.pack(fill=tk.BOTH, expand=True)
        txt.insert("1.0", content)
        txt.config(state="disabled")

        # Nút Chỉnh sửa — đặt giữa cửa sổ
        btn_frame = ttk.Frame(preview_window)
        # Không fill theo chiều X, để nội dung nằm giữa; nếu muốn có khoảng ngang rộng hơn, dùng fill=tk.X và thêm pady
        btn_frame.pack(fill=tk.X, pady=10)

        # Tạo một frame con để đảm bảo nút nằm chính giữa theo chiều ngang
        center_frame = ttk.Frame(btn_frame)
        center_frame.pack(anchor='center')  # => mọi widget con sẽ nằm ở giữa

        edit_btn = ttk.Button(center_frame, text="Chỉnh sửa", command=lambda: [preview_window.destroy(), self._jump_to_text_ops_and_load(filepath)])
        edit_btn.pack(side=tk.LEFT, padx=5)

        translate_btn = ttk.Button(center_frame, text="Dịch", command=lambda: [preview_window.destroy(), self._jump_to_translator_and_load(filepath)])
        translate_btn.pack(side=tk.LEFT, padx=5)

    def _jump_to_text_ops_and_load(self, filepath):
        """Chuyển sang tab Xử lý Văn bản -> Tìm & Thay thế và load file để chỉnh sửa."""
        # 1) chọn tab Xử lý Văn bản
        for tab_id in self.notebook.tabs():
            if self.notebook.tab(tab_id, 'text') == "Xử lý Văn bản":
                self.notebook.select(tab_id)
                break

        # 2) chọn sub-tab Tìm & Thay thế (giả sử tab thứ nhất trong ops_notebook là Find&Replace)
        try:
            # đảm bảo ops_notebook được lưu tới self.ops_notebook ở create_text_operations_tab
            if hasattr(self, 'ops_notebook'):
                # tìm tab index text == "Tìm & Thay thế"
                for t in self.ops_notebook.tabs():
                    if self.ops_notebook.tab(t, 'text') == "Tìm & Thay thế":
                        self.ops_notebook.select(t)
                        break
                # nếu ko tìm thấy, chọn tab 0
            else:
                # fallback: cố gắng chọn tab 0
                pass
        except Exception:
            pass

        # 3) set selected_file và load file (không show dialog)
        self._select_file_for_ops(filepath=filepath)

    def _jump_to_translator_and_load(self, filepath):
        """Chuyển sang tab Dịch và tải nội dung file vào."""
        # 1. Chuyển sang tab "Dịch"
        for i, tab_text in enumerate(self.notebook.tabs()):
            if self.notebook.tab(i, "text") == "Dịch":
                self.notebook.select(i)
                break
        
        # 2. Tải nội dung file
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            self.translator_input_text.delete("1.0", tk.END)
            self.translator_input_text.insert("1.0", content)
            self.log(f"Đã tải file '{os.path.basename(filepath)}' vào tab Dịch.")
            # 3. Tự động bắt đầu dịch
            self._start_translation_thread(self.translator_input_text, self.translator_output_text)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc hoặc tải file: {e}")

    def _select_tab_by_name(self, name_to_find):
        """Tìm và chọn một tab trong notebook chính dựa vào tên của nó."""
        for i, tab_id in enumerate(self.notebook.tabs()):
            if self.notebook.tab(tab_id, "text") == name_to_find:
                self.notebook.select(i)
                break

    # --------CÁC HÀM CHO TAB DỊCH--------
    def create_translator_tab(self):
        translator_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(translator_tab, text="Dịch")
        translator_tab.rowconfigure(0, weight=1)
        translator_tab.columnconfigure(0, weight=1)

        main_paned = ttk.PanedWindow(translator_tab, orient=tk.HORIZONTAL)
        main_paned.grid(row=0, column=0, sticky="nsew")

        left_frame = ttk.Frame(main_paned)
        main_paned.add(left_frame, weight=1)
        left_frame.rowconfigure(0, weight=1)
        left_frame.columnconfigure(0, weight=1)

        left_notebook = ttk.Notebook(left_frame)
        left_notebook.grid(row=0, column=0, sticky="nsew")

        input_tab = ttk.Frame(left_notebook, padding=5)
        left_notebook.add(input_tab, text="Văn bản gốc")
        input_tab.rowconfigure(0, weight=1)
        input_tab.columnconfigure(0, weight=1)
        
        # Lưu lại text widget để các hàm khác có thể truy cập
        self.translator_input_text = scrolledtext.ScrolledText(input_tab, wrap=tk.WORD, undo=True)
        self.translator_input_text.grid(row=0, column=0, sticky="nsew")
        
        name_tab = ttk.Frame(left_notebook, padding=10)
        left_notebook.add(name_tab, text="Quản lý Name")
        self._create_translator_name_manager(name_tab)
        
        adv_tab = ttk.Frame(left_notebook, padding=10)
        left_notebook.add(adv_tab, text="Nâng cao")
        self._create_translator_advanced_tab(adv_tab)

        right_frame = ttk.LabelFrame(main_paned, text="Kết quả dịch", padding=10)
        main_paned.add(right_frame, weight=1)
        right_frame.rowconfigure(0, weight=1)
        right_frame.columnconfigure(0, weight=1)

        # Lưu lại output widget và gán menu chuột phải
        self.translator_output_text = scrolledtext.ScrolledText(right_frame, wrap=tk.WORD, state="disabled")
        self.translator_output_text.grid(row=0, column=0, sticky="nsew")

        self.translator_output_text.chunk_data = {}

        self.translator_output_text.bind("<Button-3>", self._show_translator_context_menu)
        
        control_frame = ttk.Frame(translator_tab, padding=(0, 10, 0, 0))
        control_frame.grid(row=1, column=0, sticky="ew")
        control_frame.columnconfigure(2, weight=1)

        ttk.Button(control_frame, text="Tải file...", 
                command=lambda: self._load_file_into_translator(self.translator_input_text)
        ).grid(row=0, column=0)
        ttk.Button(control_frame, text="Xóa hết", 
                command=lambda: self.translator_input_text.delete("1.0", tk.END)
        ).grid(row=0, column=1, padx=5)

        self.translator_progress_bar = ttk.Progressbar(control_frame, orient="horizontal", mode="determinate")
        # Ẩn mặc định, sẽ show khi dịch
        self.translator_progress_bar.grid(row=0, column=2, sticky="ew", padx=10)
        self.translator_progress_bar.grid_remove()

        ttk.Button(control_frame, text="Việt", 
                command=lambda: self._start_translation_thread(self.translator_input_text, self.translator_output_text, target_lang='vi')
        ).grid(row=0, column=3, padx=(0,4))
        ttk.Button(control_frame, text="Hán Việt", 
                command=lambda: self._start_translation_thread(self.translator_input_text, self.translator_output_text, target_lang='hv')
        ).grid(row=0, column=4, padx=(0,4))
        ttk.Button(control_frame, text="Xuất kết quả...", 
                command=self._export_translation_result
        ).grid(row=0, column=5, padx=(0,4))

        self.translator_status_label = ttk.Label(control_frame, text="Sẵn sàng.")
        self.translator_status_label.grid(row=0, column=6, sticky="e", pady=(0,0))

    def _load_file_into_translator(self, text_widget):
        filepath = filedialog.askopenfilename(filetypes=[("Text files", "*.txt"), ("All files", "*.*")])
        if not filepath: return
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            text_widget.delete("1.0", tk.END); text_widget.insert("1.0", content)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc file: {e}", parent=self)
    
    def _export_translation_result(self):
        if not hasattr(self, "translator_output_text"):
            return
        content = self.translator_output_text.get("1.0", tk.END).strip()
        if not content:
            messagebox.showinfo("Thông báo", "Chưa có nội dung dịch để xuất.", parent=self)
            return
        filepath = filedialog.asksaveasfilename(
            title="Xuất kết quả dịch",
            defaultextension=".txt",
            filetypes=[("Text file", "*.txt"), ("JSON (list)", "*.json"), ("All files", "*.*")]
        )
        if not filepath:
            return
        try:
            if filepath.lower().endswith(".json"):
                lines = [line for line in content.split("\n")]
                with open(filepath, "w", encoding="utf-8") as f:
                    import json
                    json.dump(lines, f, ensure_ascii=False, indent=2)
            else:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
            messagebox.showinfo("Thành công", f"Đã xuất kết quả: {filepath}", parent=self)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể lưu file: {e}", parent=self)
            
    def _create_translator_name_manager(self, parent):
        parent.columnconfigure(0, weight=1); parent.rowconfigure(1, weight=1)
        
        # --- KHUNG ĐIỀU KHIỂN ---
        controls_frame = ttk.Frame(parent)
        controls_frame.grid(row=0, column=0, sticky="ew")
        
        set_selector_frame = ttk.Frame(controls_frame)
        set_selector_frame.pack(fill=tk.X, pady=(0, 5))
        ttk.Label(set_selector_frame, text="Bộ tên:").pack(side=tk.LEFT)
        self.translator_name_set_combo = ttk.Combobox(parent, state="readonly", values=list(self.app_config.get('nameSets', {}).keys()))
        self.translator_name_set_combo.pack(in_=set_selector_frame, side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        self.translator_name_set_combo.set(self.app_config.get('activeNameSet', 'Mặc định'))
        self.translator_name_set_combo.bind("<<ComboboxSelected>>", lambda e: self._refresh_translator_name_preview())
        ttk.Button(set_selector_frame, text="Tạo mới", command=self._create_new_set).pack(side=tk.LEFT)
        ttk.Button(set_selector_frame, text="Xóa bộ", command=self._delete_current_set).pack(side=tk.LEFT, padx=5)

        tools_frame = ttk.Frame(controls_frame)
        tools_frame.pack(fill=tk.X, pady=(5,10))
        ttk.Label(tools_frame, text="Công cụ:").pack(side=tk.LEFT, padx=(0,5))
        ttk.Button(tools_frame, text="Nhập từ file", command=self._import_names).pack(side=tk.LEFT)
        ttk.Button(tools_frame, text="Xuất ra TXT", command=self._export_names_txt).pack(side=tk.LEFT, padx=5)
        ttk.Button(tools_frame, text="Xóa hết name", command=self._clear_names).pack(side=tk.LEFT)
        
        ttk.Label(controls_frame, text="Thêm/Sửa nhanh (Trung=Việt):").pack(anchor="w", pady=(10,0))
        quick_add_text = scrolledtext.ScrolledText(controls_frame, height=5, wrap=tk.WORD, undo=True)
        quick_add_text.pack(fill=tk.X, expand=True, pady=(0, 5))

        def _quick_add_names():
            lines = quick_add_text.get("1.0", tk.END).strip().split('\n')
            set_name = self.translator_name_set_combo.get()
            if not set_name: return
            
            count = 0
            for line in lines:
                parts = line.split('=')
                if len(parts) == 2:
                    ch, vi = parts[0].strip(), parts[1].strip()
                    if ch and vi:
                        self.app_config['nameSets'][set_name][ch] = vi
                        count += 1
            if count > 0:
                self.save_config()
                quick_add_text.delete("1.0", tk.END)
                self._refresh_translator_name_preview()
                messagebox.showinfo("Thành công", f"Đã thêm/cập nhật {count} tên.", parent=self)
                added_keys = [line.split('=')[0].strip() for line in lines if '=' in line]
                if added_keys:
                    self._smart_retranslate(added_keys)

        ttk.Button(controls_frame, text="Thêm/Cập nhật các cặp này", command=_quick_add_names).pack(pady=(0, 10))

        # --- KHUNG XEM TRƯỚC ---
        preview_lf = ttk.LabelFrame(parent, text="Danh sách name")
        preview_lf.grid(row=1, column=0, sticky="nsew")
        preview_lf.rowconfigure(0, weight=1); preview_lf.columnconfigure(0, weight=1)

        self.name_preview_canvas = tk.Canvas(preview_lf)
        self.name_preview_canvas.grid(row=0, column=0, sticky="nsew")
        
        scrollbar = ttk.Scrollbar(preview_lf, orient="vertical", command=self.name_preview_canvas.yview)
        scrollbar.grid(row=0, column=1, sticky="ns")
        
        self.name_preview_frame = ttk.Frame(self.name_preview_canvas)
        self.name_preview_canvas.configure(yscrollcommand=scrollbar.set)
        self.name_preview_canvas.create_window((0, 0), window=self.name_preview_frame, anchor="nw")
        
        self.name_preview_frame.bind("<Configure>", lambda e: self.name_preview_canvas.configure(scrollregion=self.name_preview_canvas.bbox("all")))

        self._refresh_translator_name_preview()

    def _create_translator_advanced_tab(self, parent):
        parent.columnconfigure(1, weight=1)
        settings = self.app_config.get('translator_settings', {})

        self.adv_server_url = tk.StringVar(value=settings.get('serverUrl'))
        self.adv_hv_url = tk.StringVar(value=settings.get('hanvietJsonUrl'))
        self.adv_delay = tk.IntVar(value=settings.get('delayMs'))
        self.adv_max_chars = tk.IntVar(value=settings.get('maxChars'))

        ttk.Label(parent, text="URL Server Dịch:").grid(row=0, column=0, sticky="w", padx=5, pady=5)
        ttk.Entry(parent, textvariable=self.adv_server_url).grid(row=0, column=1, sticky="ew", padx=5)
        
        ttk.Label(parent, text="URL file Hán-Việt JSON:").grid(row=1, column=0, sticky="w", padx=5, pady=5)
        ttk.Entry(parent, textvariable=self.adv_hv_url).grid(row=1, column=1, sticky="ew", padx=5)

        ttk.Label(parent, text="Delay giữa các request (ms):").grid(row=2, column=0, sticky="w", padx=5, pady=5)
        ttk.Entry(parent, textvariable=self.adv_delay).grid(row=2, column=1, sticky="ew", padx=5)

        ttk.Label(parent, text="Số ký tự tối đa / request:").grid(row=3, column=0, sticky="w", padx=5, pady=5)
        ttk.Entry(parent, textvariable=self.adv_max_chars).grid(row=3, column=1, sticky="ew", padx=5)

    def _refresh_translator_name_preview(self):
        for widget in self.name_preview_frame.winfo_children():
            widget.destroy()
        
        set_name = self.translator_name_set_combo.get()
        current_set = self.app_config.get('nameSets', {}).get(set_name, {})
        
        if not current_set:
            ttk.Label(self.name_preview_frame, text="Bộ này trống.", padding=10).pack()
            return

        sorted_keys = sorted(current_set.keys())

        for i, key in enumerate(sorted_keys):
            row_frame = ttk.Frame(self.name_preview_frame, padding=(5, 3))
            row_frame.pack(fill=tk.X, expand=True)
            
            label_text = f"{key} = {current_set[key]}"
            ttk.Label(row_frame, text=label_text).pack(side=tk.LEFT, fill=tk.X, expand=True)

            ttk.Button(row_frame, text="Xóa", command=lambda k=key: self._delete_name_from_list(k)).pack(side=tk.RIGHT)
            ttk.Button(row_frame, text="Sửa/Gợi ý", command=lambda k=key, v=current_set[key]: self._edit_name(k, v)).pack(side=tk.RIGHT, padx=5)

    def _delete_name_from_list(self, key_to_delete: str):
        """Hàm mới để xử lý việc xóa name từ danh sách chính."""
        set_name = self.translator_name_set_combo.get()
        if not set_name: return

        if messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn xóa name '{key_to_delete}' không?", parent=self):
            if key_to_delete in self.app_config['nameSets'][set_name]:
                del self.app_config['nameSets'][set_name][key_to_delete]
                self.save_config()
                self._refresh_translator_name_preview() # Cập nhật lại danh sách

    def _create_new_set(self):
        name = simpledialog.askstring("Tạo bộ mới", "Nhập tên cho bộ mới:", parent=self)
        if name and name not in self.app_config['nameSets']:
            self.app_config['nameSets'][name] = {}
            self.translator_name_set_combo['values'] = list(self.app_config['nameSets'].keys())
            self.translator_name_set_combo.set(name)
            self._refresh_translator_name_preview()
            self.save_config()
        elif name:
            messagebox.showerror("Lỗi", "Tên bộ đã tồn tại.", parent=self)

    def _delete_current_set(self):
        set_name = self.translator_name_set_combo.get()
        if len(self.app_config['nameSets']) <= 1:
            messagebox.showerror("Lỗi", "Không thể xóa bộ tên cuối cùng.", parent=self); return
        if messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn xóa bộ '{set_name}'?", parent=self):
            del self.app_config['nameSets'][set_name]
            new_active_set = list(self.app_config['nameSets'].keys())[0]
            self.translator_name_set_combo['values'] = list(self.app_config['nameSets'].keys())
            self.translator_name_set_combo.set(new_active_set)
            self._refresh_translator_name_preview()
            self.save_config()

    def _import_names(self):
        filepath = filedialog.askopenfilename(filetypes=[("Text & JSON", "*.txt *.json"), ("All files", "*.*")], parent=self)
        if not filepath: return
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f: content = f.read()
            new_names = {}
            if filepath.endswith('.json'): new_names = json.loads(content)
            else:
                for line in content.split('\n'):
                    parts = line.split('=')
                    if len(parts) == 2 and parts[0].strip() and parts[1].strip():
                        new_names[parts[0].strip()] = parts[1].strip()
            
            set_name = self.translator_name_set_combo.get()
            self.app_config['nameSets'][set_name].update(new_names)
            self._refresh_translator_name_preview()
            self.save_config()
            messagebox.showinfo("Thành công", f"Đã nhập và cập nhật {len(new_names)} tên.", parent=self)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc file: {e}", parent=self)

    def _export_names_txt(self):
        set_name = self.translator_name_set_combo.get()
        current_set = self.app_config['nameSets'].get(set_name, {})
        filepath = filedialog.asksaveasfilename(defaultextension=".txt", initialfile=f"{set_name}.txt", filetypes=[("Text files", "*.txt")], parent=self)
        if not filepath: return
        try:
            content = "\n".join(f"{k}={v}" for k, v in current_set.items())
            with open(filepath, 'w', encoding='utf-8') as f: f.write(content)
            messagebox.showinfo("Thành công", "Đã xuất file thành công.", parent=self)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể lưu file: {e}", parent=self)

    def _clear_names(self):
        set_name = self.translator_name_set_combo.get()
        if messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn xóa TẤT CẢ name trong bộ '{set_name}'?", icon='warning', parent=self):
            self.app_config['nameSets'][set_name] = {}
            self._refresh_translator_name_preview()
            self.save_config()

    def _edit_name(self, key, current_viet=""):
        original_key = key # Lưu lại key gốc để xử lý đổi tên
        
        edit_win = tk.Toplevel(self)
        edit_win.title("Thêm / Sửa Name")
        edit_win.geometry("500x150")
        edit_win.transient(self)
        edit_win.grab_set()

        main_frame = ttk.Frame(edit_win, padding=15)
        main_frame.pack(fill=tk.BOTH, expand=True)
        main_frame.columnconfigure(1, weight=1)

        ttk.Label(main_frame, text="Tiếng Trung:").grid(row=0, column=0, sticky="w", pady=2)
        key_entry = ttk.Entry(main_frame)
        key_entry.insert(0, key)
        key_entry.grid(row=0, column=1, sticky="ew", pady=2)

        ttk.Label(main_frame, text="Tiếng Việt:").grid(row=1, column=0, sticky="w", pady=2)
        viet_entry = ttk.Entry(main_frame)
        initial_value = current_viet or self.app_config['nameSets'][self.translator_name_set_combo.get()].get(key, "")
        viet_entry.insert(0, initial_value)
        viet_entry.grid(row=1, column=1, sticky="ew", pady=2)
        viet_entry.focus_set()
        viet_entry.selection_range(0, tk.END)

        btn_frame = ttk.Frame(main_frame)
        btn_frame.grid(row=2, column=0, columnspan=2, pady=(15, 0), sticky="e")
        
        # --- LOGIC NÚT ĐỘNG ---

        def on_save_or_update():
            new_key = key_entry.get().strip()
            new_viet = viet_entry.get().strip()
            if not new_key or not new_viet:
                messagebox.showerror("Lỗi", "Không được để trống.", parent=edit_win)
                return

            set_name = self.translator_name_set_combo.get()
            # Nếu đổi key, xóa key cũ đi
            if original_key != new_key and original_key in self.app_config['nameSets'][set_name]:
                del self.app_config['nameSets'][set_name][original_key]
            
            self.app_config['nameSets'][set_name][new_key] = new_viet
            self._refresh_translator_name_preview()
            self.save_config()
            edit_win.destroy()
            self._smart_retranslate([new_key])

        def on_delete():
            key_to_delete = key_entry.get().strip()
            if not key_to_delete: return
            
            set_name = self.translator_name_set_combo.get()
            if messagebox.askyesno("Xác nhận", f"Bạn có chắc muốn xóa name '{key_to_delete}'?", parent=edit_win):
                if key_to_delete in self.app_config['nameSets'][set_name]:
                    del self.app_config['nameSets'][set_name][key_to_delete]
                    self.save_config()
                    self._refresh_translator_name_preview()
                edit_win.destroy()
        
        # Tạo tất cả các nút
        suggest_btn = ttk.Button(btn_frame, text="Gợi ý...",
                                command=lambda: self._show_suggestion_window(key_entry.get(), lambda v: (viet_entry.delete(0, tk.END), viet_entry.insert(0, v), edit_win.lift(), viet_entry.focus_set())))
        cancel_btn = ttk.Button(btn_frame, text="Hủy", command=edit_win.destroy)
        
        save_btn = ttk.Button(btn_frame, text="Lưu", command=on_save_or_update)
        update_btn = ttk.Button(btn_frame, text="Sửa", command=on_save_or_update)
        delete_btn = ttk.Button(btn_frame, text="Xóa", command=on_delete)
        
        # Hàm kiểm tra và thay đổi nút
        def update_buttons(event=None):
            current_key = key_entry.get().strip()
            set_name = self.translator_name_set_combo.get()
            exists = current_key in self.app_config['nameSets'][set_name]

            # Ẩn tất cả các nút hành động trước
            save_btn.grid_remove()
            update_btn.grid_remove()
            delete_btn.grid_remove()
            
            if exists:
                # Nếu name đã tồn tại -> hiện Sửa và Xóa
                update_btn.grid(row=0, column=2, padx=5)
                delete_btn.grid(row=0, column=3, padx=5)
            else:
                # Nếu là name mới -> hiện Lưu
                save_btn.grid(row=0, column=2, padx=5)

        # Đặt các nút cố định và gọi hàm update_buttons
        suggest_btn.grid(row=0, column=0)
        cancel_btn.grid(row=0, column=1, padx=5)
        
        # Gán sự kiện cho ô nhập Tiếng Trung
        key_entry.bind("<KeyRelease>", update_buttons)
        
        # Gọi lần đầu để có trạng thái đúng
        update_buttons()

    def _show_translator_context_menu(self, event):
        widget = event.widget
        index = widget.index(f"@{event.x},{event.y}")
        tags = widget.tag_names(index)
        chunk_tag = next((t for t in tags if t.startswith("chunk_")), None)
        if not chunk_tag: return

        original_chinese = widget.chunk_data.get(chunk_tag)
        # Lấy toàn bộ nội dung của chunk tiếng Việt tương ứng
        tag_range = widget.tag_ranges(chunk_tag)
        full_vietnamese_chunk = widget.get(tag_range[0], tag_range[1])

        if not original_chinese: return

        context_menu = tk.Menu(widget, tearoff=0)
        context_menu.add_command(
            label="Sửa Name...",
            command=lambda: self._edit_name(original_chinese, full_vietnamese_chunk.strip())
        )
        context_menu.tk_popup(event.x_root, event.y_root)

    def _show_suggestion_window(self, key, on_select_callback):
        suggest_win = tk.Toplevel(self)
        suggest_win.title(f"Gợi ý cho '{key}'")
        suggest_win.geometry("600x400")
        suggest_win.transient(self)
        suggest_win.grab_set()

        main_paned = ttk.PanedWindow(suggest_win, orient=tk.HORIZONTAL)
        main_paned.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        hv_frame = ttk.LabelFrame(main_paned, text="Hán-Việt")
        main_paned.add(hv_frame, weight=1)
        hv_text_frame = scrolledtext.ScrolledText(hv_frame, wrap=tk.WORD, state="disabled")
        hv_text_frame.pack(fill=tk.BOTH, expand=True)

        trans_frame = ttk.LabelFrame(main_paned, text="Gợi ý dịch")
        main_paned.add(trans_frame, weight=1)
        trans_text_frame = scrolledtext.ScrolledText(trans_frame, wrap=tk.WORD, state="disabled")
        trans_text_frame.pack(fill=tk.BOTH, expand=True)

        def update_and_close(new_name):
            on_select_callback(new_name) # Gọi callback để gửi dữ liệu về
            suggest_win.destroy()
        
        def create_clickable_label(parent_widget, text, callback):
            # Dùng Text widget để có thể tạo link dễ hơn
            parent_widget.config(state="normal")
            tag_name = f"link_{text.replace(' ', '_')}"
            parent_widget.insert(tk.END, text + "\n", (tag_name,))
            parent_widget.tag_config(tag_name, foreground="blue", underline=True, spacing1=3, spacing3=3)
            parent_widget.tag_bind(tag_name, "<Enter>", lambda e: parent_widget.config(cursor="hand2"))
            parent_widget.tag_bind(tag_name, "<Leave>", lambda e: parent_widget.config(cursor=""))
            parent_widget.tag_bind(tag_name, "<Button-1>", lambda e, t=text: callback(t))
            parent_widget.config(state="disabled")

        def worker():
            hv_url = self.app_config.get('translator_settings', {}).get('hanvietJsonUrl')
            hv_map = trans_logic.load_hanviet_json(hv_url)
            hv_suggestion = trans_logic.build_hanviet_from_map(key, hv_map)
            hv_lines = trans_logic.progressive_capitalizations(hv_suggestion)
            
            server_url = self.app_config.get('translator_settings', {}).get('serverUrl')
            translated_arr = trans_logic._post_translate_batch([key], server_url)
            trans_suggestion = translated_arr[0] if translated_arr else ""
            trans_lines = trans_logic.progressive_capitalizations(trans_suggestion)

            def update_ui():
                for line in hv_lines:
                    create_clickable_label(hv_text_frame, line, update_and_close)
                for line in trans_lines:
                    create_clickable_label(trans_text_frame, line, update_and_close)
            
            self.after(0, update_ui)
                
        threading.Thread(target=worker, daemon=True).start()

    def _start_translation_thread(self, input_widget, output_widget, target_lang='vi'):
        input_content = input_widget.get("1.0", tk.END).strip()
        if not input_content:
            messagebox.showwarning("Cảnh báo", "Không có nội dung để dịch.", parent=self); return
            
        if getattr(self, 'is_translating', False): return
        self.is_translating = True

        # Lưu lại cài đặt nâng cao trước khi dịch
        self.app_config['translator_settings']['serverUrl'] = self.adv_server_url.get()
        self.app_config['translator_settings']['hanvietJsonUrl'] = self.adv_hv_url.get()
        self.app_config['translator_settings']['delayMs'] = self.adv_delay.get()
        self.app_config['translator_settings']['maxChars'] = self.adv_max_chars.get()

        proxies = self._get_proxy_for_request('translate')
        if proxies:
            self.log(f"Dịch thuật sử dụng proxy: {proxies['http']}")
        self.app_config['translator_settings']['proxies'] = proxies

        set_name = self.translator_name_set_combo.get()
        active_name_set = self.app_config.get('nameSets', {}).get(set_name, {})
        
        thread = threading.Thread(target=self._translation_worker, args=(input_content, active_name_set, self.app_config['translator_settings'], output_widget, target_lang))
        thread.daemon = True
        thread.start()

    def _translation_worker(self, content, name_set, settings, output_widget, target_lang='vi'):
        def update_ui_progress(message, value):
            self.after(0, lambda: [
                self.translator_status_label.config(text=message),
                self.translator_progress_bar.config(value=value),
                self.translator_progress_bar.grid()
            ])

        chunks = content.split('\n')
        translated_chunks = trans_logic.translate_text_chunks(chunks, name_set, settings, update_ui_progress, target_lang=target_lang or 'vi')
        
        def update_output_widget():
            output_widget.config(state="normal")
            output_widget.delete("1.0", tk.END)
            output_widget.chunk_data = {}

            original_chunks = content.split('\n')

            for i, translated_chunk in enumerate(translated_chunks):
                tag_name = f"chunk_{i}"
                original_chunk = original_chunks[i] if i < len(original_chunks) else ""
                output_widget.chunk_data[tag_name] = original_chunk
                output_widget.insert(tk.END, translated_chunk + '\n', (tag_name,))
                
            output_widget.config(state="disabled")
            self._last_translation_lang = target_lang or 'vi'
            self.translator_progress_bar.grid_remove()
        self.after(0, update_output_widget)
        self.is_translating = False

    def _smart_retranslate(self, affected_keys):
        """Dịch lại một cách thông minh các chunk bị ảnh hưởng bởi việc thay đổi name."""
        if not hasattr(self, 'translator_output_text') or not self.translator_output_text.chunk_data:
            return

        output_widget = self.translator_output_text
        chunks_to_retranslate = []
        # update_plan sẽ lưu: {chỉ_số_của_chunk_cần_dịch: 'tag_name_tương_ứng'}
        update_plan = {}
        
        # 1. Thu thập các chunk cần dịch lại
        all_original_chunks = list(output_widget.chunk_data.values())
        for i, original_chunk in enumerate(all_original_chunks):
            if any(key in original_chunk for key in affected_keys):
                chunks_to_retranslate.append(original_chunk)
                # Tìm tag_name tương ứng với original_chunk này
                tag_name = next((tag for tag, text in output_widget.chunk_data.items() if text == original_chunk), None)
                if tag_name:
                    update_plan[len(chunks_to_retranslate) - 1] = tag_name

        if not chunks_to_retranslate:
            return # Không có gì để cập nhật

        # 2. Chạy dịch trong một thread mới
        def worker():
            self.after(0, lambda: self.translator_status_label.config(text=f"Đang cập nhật {len(chunks_to_retranslate)} đoạn..."))
            set_name = self.translator_name_set_combo.get()
            active_name_set = self.app_config.get('nameSets', {}).get(set_name, {})
            settings = self.app_config.get('translator_settings', {})

            newly_translated = trans_logic.translate_text_chunks(chunks_to_retranslate, active_name_set, settings, target_lang=getattr(self, "_last_translation_lang", 'vi'))

            # 3. Cập nhật lại UI
            def update_ui():
                output_widget.config(state="normal")
                for i, new_text in enumerate(newly_translated):
                    tag_name = update_plan.get(i)
                    if tag_name:
                        # Xóa nội dung cũ và chèn nội dung mới vào đúng tag đó
                        tag_range = output_widget.tag_ranges(tag_name)
                        if tag_range:
                            output_widget.delete(tag_range[0], tag_range[1])
                            output_widget.insert(tag_range[0], new_text + '\n', (tag_name,))
                output_widget.config(state="disabled")
                self.translator_status_label.config(text="Cập nhật hoàn tất.")

            self.after(0, update_ui)

        threading.Thread(target=worker, daemon=True).start()

    # ----------TAB TẢI ẢNH----------
    def create_image_processing_tab(self):
        img_tab = ttk.Frame(self.notebook, padding="10")
        self.notebook.add(img_tab, text="Xử lý Ảnh") # ĐÃ ĐỔI TÊN
        img_tab.rowconfigure(1, weight=1)
        img_tab.columnconfigure(0, weight=1)

        # --- KHUNG NGUỒN ẢNH ---
        url_frame = ttk.LabelFrame(img_tab, text="1. Nguồn ảnh", padding=10)
        url_frame.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        url_frame.columnconfigure(0, weight=1)
        
        self.image_url_var = tk.StringVar()
        url_entry = ttk.Entry(url_frame, textvariable=self.image_url_var)
        url_entry.grid(row=0, column=0, sticky="ew")
        
        # Frame chứa 2 nút tải
        download_buttons_frame = ttk.Frame(url_frame)
        download_buttons_frame.grid(row=0, column=1, padx=(10, 0))
        ttk.Button(download_buttons_frame, text="Tải từ URL", command=self._start_image_download_thread).pack(side=tk.LEFT)
        ttk.Button(download_buttons_frame, text="Tải file lên...", command=self._load_local_image).pack(side=tk.LEFT, padx=(5,0)) # NÚT MỚI

        # --- KHUNG XEM TRƯỚC VÀ XỬ LÝ ---
        preview_frame = ttk.LabelFrame(img_tab, text="2. Xem trước & Xử lý", padding=10)
        preview_frame.grid(row=1, column=0, sticky="nsew")
        preview_frame.rowconfigure(0, weight=1)
        preview_frame.columnconfigure(0, weight=1)

        self.image_canvas = tk.Canvas(preview_frame, bg="gray90", highlightthickness=0)
        self.image_canvas.grid(row=0, column=0, sticky="nsew")
        self.image_canvas.bind("<MouseWheel>", self._on_image_scroll)
        self.image_canvas.bind("<ButtonPress-1>", self._on_image_drag_start)
        self.image_canvas.bind("<B1-Motion>", self._on_image_drag_move)

        # --- KHUNG LƯU ẢNH ---
        tools_frame = ttk.LabelFrame(img_tab, text="3. Công cụ & Lưu ảnh", padding=10)
        tools_frame.grid(row=2, column=0, sticky="ew", pady=(10, 0))
        tools_frame.columnconfigure(1, weight=1) # Cho slider giãn ra

        # Hàng 1: Chọn công cụ
        ttk.Label(tools_frame, text="Công cụ:").grid(row=0, column=0, sticky="w", padx=5, pady=5)
        self.image_tool_combo = ttk.Combobox(tools_frame, state="readonly", values=[
            "Làm nét (Unsharp Mask)",
            "Tăng chi tiết (Detail)",
            "Nâng cấp độ phân giải x2 (Lanczos)"
        ])
        self.image_tool_combo.grid(row=0, column=1, columnspan=2, sticky="ew", padx=5)
        self.image_tool_combo.set("Làm nét (Unsharp Mask)")

        # Hàng 2: Thanh trượt cường độ
        ttk.Label(tools_frame, text="Cường độ:").grid(row=1, column=0, sticky="w", padx=5, pady=5)
        self.intensity_var = tk.DoubleVar(value=50)
        intensity_slider = ttk.Scale(tools_frame, from_=0, to=100, orient="horizontal", variable=self.intensity_var)
        intensity_slider.grid(row=1, column=1, sticky="ew", padx=5)
        intensity_label = ttk.Label(tools_frame, text="50%")
        intensity_label.grid(row=1, column=2, sticky="w", padx=5)
        self.intensity_var.trace_add("write", lambda *args: intensity_label.config(text=f"{int(self.intensity_var.get())}%"))

        # Hàng 3: Các nút hành động
        action_frame = ttk.Frame(tools_frame)
        action_frame.grid(row=2, column=0, columnspan=3, sticky="ew", pady=(10,0))
        self.apply_tool_btn = ttk.Button(action_frame, text="Áp dụng", command=self._apply_image_enhancement, state="disabled")
        self.apply_tool_btn.pack(side=tk.LEFT, padx=5)
        self.undo_image_btn = ttk.Button(action_frame, text="Hoàn tác về gốc", command=self._undo_image_enhancement, state="disabled")
        self.undo_image_btn.pack(side=tk.LEFT)

        ttk.Separator(action_frame, orient='vertical').pack(side=tk.LEFT, fill='y', padx=15, pady=5)

        ttk.Label(action_frame, text="Lưu định dạng:").pack(side=tk.LEFT)
        self.image_format_combo = ttk.Combobox(action_frame, state="readonly", values=["PNG", "JPEG", "WEBP", "BMP", "GIF"])
        self.image_format_combo.set("PNG")
        self.image_format_combo.pack(side=tk.LEFT, padx=5)
        self.save_image_btn = ttk.Button(action_frame, text="Lưu ảnh...", command=self._save_converted_image, state="disabled")
        self.save_image_btn.pack(side=tk.RIGHT, padx=5)

        self.image_status_label = ttk.Label(img_tab, text="Sẵn sàng.")
        self.image_status_label.grid(row=3, column=0, sticky="w", pady=(5,0))

    def _start_image_download_thread(self):
        url = self.image_url_var.get().strip()
        if not url:
            messagebox.showwarning("Thiếu thông tin", "Vui lòng nhập URL của ảnh.")
            return
        
        self.save_image_btn.config(state="disabled")
        self.image_status_label.config(text=f"Đang tải từ {url[:50]}...")
        
        thread = threading.Thread(target=self._download_image_worker, args=(url,), daemon=True)
        thread.start()

    def _download_image_worker(self, url):
        try:
            proxies = self._get_proxy_for_request('images')
            if proxies:
                self.log(f"Tải ảnh sử dụng proxy: {proxies['http']}")
            response = requests.get(url, timeout=60, headers={'User-Agent': 'Mozilla/5.0'}, proxies=proxies)
            response.raise_for_status()
            # Gọi hàm xử lý chung
            self._process_image_data(io.BytesIO(response.content))
        except Exception as e:
            self.downloaded_image_data = None
            self.image_original_pil = None
            def update_ui_error():
                self.image_canvas.delete("all")
                self.image_canvas.create_text(self.image_canvas.winfo_width()/2, self.image_canvas.winfo_height()/2, text="Lỗi khi tải hoặc xử lý ảnh.", anchor="center", fill="red")
                self.image_status_label.config(text=f"Lỗi: {e}")
            self.after(0, update_ui_error)

    def _save_converted_image(self):
        # Nếu đã có bản chỉnh (image_display_pil), ưu tiên lưu bản đó
        if getattr(self, "image_display_pil", None):
            img_to_save = self.image_display_pil
        else:
            # fallback mở lại dữ liệu gốc
            if not self.downloaded_image_data:
                messagebox.showerror("Lỗi", "Không có dữ liệu ảnh để lưu.")
                return
            self.downloaded_image_data.seek(0)
            img_to_save = Image.open(self.downloaded_image_data)

        selected_format = self.image_format_combo.get()
        file_types = {
            "PNG": [("PNG file", "*.png")],
            "JPEG": [("JPEG file", "*.jpg *.jpeg")],
            "WEBP": [("WEBP file", "*.webp")],
            "BMP": [("BMP file", "*.bmp")],
            "GIF": [("GIF file", "*.gif")],
        }

        filepath = filedialog.asksaveasfilename(
            title="Lưu ảnh",
            defaultextension=f".{selected_format.lower()}",
            filetypes=file_types.get(selected_format, [("All files", "*.*")])
        )

        if not filepath:
            return

        try:
            if selected_format == 'JPEG' and img_to_save.mode == 'RGBA':
                img_to_save = img_to_save.convert('RGB')
            img_to_save.save(filepath, format=selected_format)
            self.image_status_label.config(text=f"Đã lưu thành công tại: {filepath}")
            messagebox.showinfo("Thành công", "Đã lưu ảnh thành công!")
        except Exception as e:
            self.image_status_label.config(text=f"Lỗi khi lưu: {e}")
            messagebox.showerror("Lỗi", f"Không thể lưu ảnh: {e}")

    def _on_image_scroll(self, event):
        """Xử lý phóng to/thu nhỏ ảnh bằng con lăn chuột."""
        if not self.image_original_pil:
            return
        
        # event.delta > 0 là cuộn lên (phóng to), < 0 là cuộn xuống (thu nhỏ)
        if event.delta > 0:
            self.image_zoom_factor *= 1.1
        else:
            self.image_zoom_factor /= 1.1
        
        # Giới hạn mức zoom
        self.image_zoom_factor = max(0.1, min(self.image_zoom_factor, 5.0))
        self._update_image_display()

    def _on_image_drag_start(self, event):
        """Lưu vị trí bắt đầu khi nhấn chuột để kéo."""
        self._image_drag_data["x"] = event.x
        self._image_drag_data["y"] = event.y

    def _on_image_drag_move(self, event):
        """Di chuyển ảnh trên canvas khi kéo chuột."""
        if not self.image_original_pil:
            return
        
        dx = event.x - self._image_drag_data["x"]
        dy = event.y - self._image_drag_data["y"]
        
        # Di chuyển ảnh bằng cách thay đổi tọa độ của nó
        self.image_canvas.move("image", dx, dy)
        
        # Cập nhật lại vị trí bắt đầu cho lần di chuyển tiếp theo
        self._image_drag_data["x"] = event.x
        self._image_drag_data["y"] = event.y

    def _update_image_display(self):
        """Cập nhật ảnh trên Canvas dựa trên image_display_pil (nếu có) hoặc image_original_pil."""
        source = self.image_display_pil if getattr(self, "image_display_pil", None) else getattr(self, "image_original_pil", None)
        if not source:
            return

        # Tính toán kích thước mới dựa trên source (ảnh hiện đang muốn hiển thị)
        new_width = max(1, int(source.width * self.image_zoom_factor))
        new_height = max(1, int(source.height * self.image_zoom_factor))

        # Resize ảnh bằng Pillow (chất lượng cao)
        resized_pil = source.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Chuyển đổi và gán cho PhotoImage
        self.tk_photo_image = ImageTk.PhotoImage(resized_pil)

        # Xóa ảnh cũ và vẽ ảnh mới vào giữa Canvas
        self.image_canvas.delete("all")
        self.image_canvas.create_image(
            self.image_canvas.winfo_width() / 2,
            self.image_canvas.winfo_height() / 2,
            anchor="center",
            image=self.tk_photo_image,
            tags="image"
        )

        # Nếu ảnh đã bị chỉnh sửa khác với gốc thì hiển thị dấu hiệu
        if getattr(self, "image_display_pil", None) and getattr(self, "image_original_pil", None):
            if self.image_display_pil.tobytes() != self.image_original_pil.tobytes():
                self.image_status_label.config(text=f"Đã tải! {self.image_original_pil.width}x{self.image_original_pil.height} | Zoom: {self.image_zoom_factor:.1f}x (Đã chỉnh sửa)")
                return

        self.image_status_label.config(text=f"Đã tải! Kích thước: {self.image_original_pil.width}x{self.image_original_pil.height} | Zoom: {self.image_zoom_factor:.1f}x")


    def _load_local_image(self):
        filepath = filedialog.askopenfilename(
            title="Chọn một file ảnh",
            filetypes=[("Image Files", "*.png *.jpg *.jpeg *.bmp *.webp *.gif"), ("All files", "*.*")]
        )
        if not filepath:
            return

        self.save_image_btn.config(state="disabled")
        self.image_status_label.config(text=f"Đang mở file: {os.path.basename(filepath)}...")

        try:
            with open(filepath, 'rb') as f:
                image_data = io.BytesIO(f.read())
            # Gọi hàm xử lý chung
            self._process_image_data(image_data)
        except Exception as e:
            self.image_status_label.config(text=f"Lỗi: Không thể mở file ảnh.")
            messagebox.showerror("Lỗi", f"Không thể mở file ảnh: {e}")

    def _process_image_data(self, image_bytes_io):
        """Xử lý dữ liệu ảnh (BytesIO) và cập nhật UI."""
        self.downloaded_image_data = image_bytes_io
        
        # Mở ảnh và lưu cả bản gốc và bản hiển thị
        self.image_original_pil = Image.open(self.downloaded_image_data)
        self.image_display_pil = self.image_original_pil.copy() # Rất quan trọng
        
        self.image_zoom_factor = 1.0

        def update_ui_success():
            self._update_image_display()
            self.save_image_btn.config(state="normal")
            self.apply_tool_btn.config(state="normal")
            self.undo_image_btn.config(state="disabled")
        
        self.after(0, update_ui_success)

    def _sharpen_image(self):
        if not self.image_display_pil:
            return
        
        # Áp dụng bộ lọc làm nét
        self.image_display_pil = self.image_display_pil.filter(ImageFilter.SHARPEN)
        self.undo_image_btn.config(state="normal") # Cho phép hoàn tác
        self._update_image_display()
        self.image_status_label.config(text="Đã áp dụng bộ lọc làm nét.")

    def _undo_image_enhancement(self):
        if not self.image_original_pil:
            return

        # Phục hồi ảnh hiển thị từ bản gốc
        self.image_display_pil = self.image_original_pil.copy()
        self.undo_image_btn.config(state="disabled") # Không cần hoàn tác nữa
        self._update_image_display()
        self.image_status_label.config(text="Đã hoàn tác về ảnh gốc.")

    def _apply_image_enhancement(self):
        if not getattr(self, "image_original_pil", None):
            return

        # disable nút để tránh bấm liên tục
        self.apply_tool_btn.config(state="disabled")
        self.save_image_btn.config(state="disabled")
        self.image_status_label.config(text="Đang xử lý ảnh...")

        def worker():
            try:
                tool = self.image_tool_combo.get()
                intensity = self.intensity_var.get()
                img_to_process = self.image_original_pil.copy()

                result_pil = None
                if tool == "Làm nét (Unsharp Mask)":
                    cv_img = cv2.cvtColor(np.array(img_to_process), cv2.COLOR_RGB2BGR)
                    gaussian = cv2.GaussianBlur(cv_img, (0, 0), sigmaX=5)
                    alpha = 1.5 + (intensity / 100.0) * 2
                    sharpened_cv = cv2.addWeighted(cv_img, alpha, gaussian, 1 - alpha, 0)
                    result_pil = Image.fromarray(cv2.cvtColor(sharpened_cv, cv2.COLOR_BGR2RGB))

                elif tool == "Tăng chi tiết (Detail)":
                    tmp = img_to_process
                    times = max(1, int(intensity / 20))
                    for _ in range(times):
                        tmp = tmp.filter(ImageFilter.DETAIL)
                    result_pil = tmp

                elif tool == "Nâng cấp độ phân giải x2 (Lanczos)":
                    new_w = img_to_process.width * 2
                    new_h = img_to_process.height * 2
                    result_pil = img_to_process.resize((new_w, new_h), Image.Resampling.LANCZOS)

                else:
                    result_pil = img_to_process

                # cập nhật UI an toàn
                def finish():
                    self.image_display_pil = result_pil
                    self.undo_image_btn.config(state="normal")
                    self.apply_tool_btn.config(state="normal")
                    self.save_image_btn.config(state="normal")
                    self._update_image_display()
                    self.image_status_label.config(text=f"Đã áp dụng: {tool}")

                self.after(0, finish)

            except Exception as e:
                def on_err():
                    messagebox.showerror("Lỗi xử lý", f"Đã xảy ra lỗi: {e}")
                    self.image_status_label.config(text=f"Lỗi: {e}")
                    self.apply_tool_btn.config(state="normal")
                self.after(0, on_err)

        threading.Thread(target=worker, daemon=True).start()

    def _open_proxy_manager_window(self):
        proxy_win = tk.Toplevel(self)
        proxy_win.title("Quản lý Proxy")
        proxy_win.geometry("700x550") 
        proxy_win.transient(self)
        proxy_win.grab_set()

        main_paned = ttk.PanedWindow(proxy_win, orient=tk.VERTICAL)
        main_paned.pack(fill=tk.BOTH, expand=True, padx=15, pady=15)

        input_frame = ttk.Frame(main_paned)
        main_paned.add(input_frame, weight=2)
        input_frame.rowconfigure(1, weight=1); input_frame.columnconfigure(0, weight=1)
        ttk.Label(input_frame, text="Nhập danh sách proxy (mỗi proxy một dòng):").grid(row=0, column=0, sticky="w")
        proxy_text = scrolledtext.ScrolledText(input_frame, wrap=tk.WORD, height=10)
        proxy_text.grid(row=1, column=0, sticky="nsew", pady=5)
        
        placeholder_text = (
            "# Dán danh sách proxy vào đây. Ví dụ:\n"
            "http://123.45.67.89:8080\n"
            "socks5://user:pass@98.76.54.32:1080\n"
            "socks4://1.4.195.114:4145"
        )
        
        def add_placeholder(event=None):
            if not proxy_text.get("1.0", "end-1c").strip():
                proxy_text.config(foreground="grey")
                proxy_text.insert("1.0", placeholder_text)

        def remove_placeholder(event=None):
            if proxy_text.get("1.0", "end-1c") == placeholder_text:
                proxy_text.delete("1.0", tk.END)
                proxy_text.config(foreground="black")
        
        proxy_text.bind("<FocusIn>", remove_placeholder)
        proxy_text.bind("<FocusOut>", add_placeholder)

        proxy_settings = self.app_config.get('proxy_settings', {})
        proxy_list = proxy_settings.get('proxies', [])
        
        if proxy_list:
            proxy_text.insert("1.0", "\n".join(proxy_list))
        else:
            add_placeholder()

        result_frame = ttk.LabelFrame(main_paned, text="Kết quả kiểm tra", padding=10)
        main_paned.add(result_frame, weight=1)
        result_frame.rowconfigure(0, weight=1); result_frame.columnconfigure(0, weight=1)
        result_text = scrolledtext.ScrolledText(result_frame, wrap=tk.WORD, height=5, state="disabled")
        result_text.grid(row=0, column=0, sticky="nsew")

        # warning_label = ttk.Label(
        #     main_paned, 
        #     text="Lưu ý: Các proxy miễn phí trên mạng thường không ổn định, rất chậm và có thể không an toàn. Hãy cân nhắc kỹ trước khi sử dụng.",
        #     foreground="dark orange", # Màu cam sẫm để cảnh báo
        #     wraplength=550, # Tự động xuống dòng nếu văn bản quá dài
        #     justify=tk.LEFT
        # )
        # warning_label.grid(row=4, column=0, sticky="w", pady=(5, 10))

        # KHUNG TÙY CHỌN VÀ NÚT BẤM
        bottom_frame = ttk.Frame(proxy_win)
        bottom_frame.pack(fill=tk.X, padx=15, pady=(0, 15))

        options_frame = ttk.LabelFrame(bottom_frame, text="Sử dụng proxy cho các chức năng", padding=10)
        options_frame.pack(side=tk.LEFT, fill=tk.Y, expand=True)

        use_for_wikidich = tk.BooleanVar(value=proxy_settings.get('use_for_wikidich', proxy_settings.get('use_for_fetch_titles', False)))
        use_for_translate = tk.BooleanVar(value=proxy_settings.get('use_for_translate', False))
        use_for_images = tk.BooleanVar(value=proxy_settings.get('use_for_images', False))

        ttk.Checkbutton(options_frame, text="Wikidich / Fanqie (Works, chi tiết, kiểm tra cập nhật)", variable=use_for_wikidich).pack(anchor="w")
        ttk.Checkbutton(options_frame, text="Dịch thuật", variable=use_for_translate).pack(anchor="w")
        ttk.Checkbutton(options_frame, text="Tải ảnh từ URL", variable=use_for_images).pack(anchor="w")

        def _save_proxy_settings():
            # Lấy danh sách proxy, bỏ qua placeholder nếu còn
            proxies_raw = proxy_text.get("1.0", tk.END).strip()
            if proxies_raw == placeholder_text:
                proxy_list = []
            else:
                proxy_list = [line.strip() for line in proxies_raw.split('\n') if line.strip()]

            self.app_config['proxy_settings'] = {
                'proxies': proxy_list,
                'use_for_fetch_titles': use_for_wikidich.get(),
                'use_for_wikidich': use_for_wikidich.get(),
                'use_for_translate': use_for_translate.get(),
                'use_for_images': use_for_images.get()
            }
            self.save_config()
            messagebox.showinfo("Thành công", "Đã lưu cài đặt proxy.", parent=proxy_win)
            proxy_win.destroy()

        action_frame = ttk.Frame(bottom_frame)
        action_frame.pack(side=tk.RIGHT)
        
        check_btn = ttk.Button(action_frame, text="Kiểm tra Proxy", command=lambda: self._start_proxy_check_thread(proxy_text, result_text, check_btn))
        check_btn.pack(fill=tk.X, pady=2)
        
        save_btn = ttk.Button(action_frame, text="Lưu và Đóng", command=lambda: _save_proxy_settings())
        save_btn.pack(fill=tk.X, pady=2)

    def _get_proxy_for_request(self, feature_name: str):
        """
        Lấy một proxy ngẫu nhiên từ danh sách đã lưu (không kiểm tra lại).
        feature_name: 'fetch_titles', 'wikidich', 'fanqie', 'translate', 'images'
        """
        proxy_settings = self.app_config.get('proxy_settings', {})
        use_proxy_flag = proxy_settings.get(f'use_for_{feature_name}', False)
        if feature_name in ('fetch_titles', 'wikidich', 'fanqie'):
            use_proxy_flag = proxy_settings.get('use_for_wikidich', proxy_settings.get('use_for_fetch_titles', use_proxy_flag))

        if not use_proxy_flag:
            return None

        proxy_list = proxy_settings.get('proxies', [])
        if not proxy_list:
            self.log("[Proxy] Chức năng proxy được bật nhưng danh sách trống.")
            return None

        chosen_proxy = random.choice(proxy_list)
        self.log(f"[Proxy] Sử dụng proxy ngẫu nhiên: {chosen_proxy}")
        return {"http": chosen_proxy, "https": chosen_proxy}

    def _get_delay_range(self, min_key: str, max_key: str, default_min: float, default_max: float):
        settings = getattr(self, "api_settings", {}) or {}
        try:
            min_val = float(settings.get(min_key, default_min))
        except Exception:
            min_val = default_min
        try:
            max_val = float(settings.get(max_key, default_max))
        except Exception:
            max_val = max(default_max, min_val)
        if min_val < 0:
            min_val = 0.0
        if max_val < min_val:
            max_val = min_val
        return min_val, max_val

    def _start_proxy_check_thread(self, proxy_widget, result_widget, button):
        """Khởi động luồng kiểm tra proxy."""
        proxies_raw = proxy_widget.get("1.0", tk.END).strip()
        proxy_list = [line.strip() for line in proxies_raw.split('\n') if line.strip() and not line.startswith('#')]
        
        if not proxy_list:
            messagebox.showwarning("Thông báo", "Không có proxy nào để kiểm tra.", parent=proxy_widget)
            return

        button.config(state="disabled")
        result_widget.config(state="normal")
        result_widget.delete("1.0", tk.END)
        result_widget.insert("1.0", f"Bắt đầu kiểm tra {len(proxy_list)} proxy...\n")
        result_widget.config(state="disabled")

        thread = threading.Thread(
            target=self._check_proxies_worker,
            args=(proxy_list, result_widget, button, proxy_widget),
            daemon=True
        )
        thread.start()

    def _check_single_proxy(self, proxy_str, timeout=30):
        """Hàm con để kiểm tra một proxy duy nhất."""
        try:
            proxies_dict = {"http": proxy_str, "https": proxy_str}
            start_time = time.time()
            # httpbin.org/get là một endpoint nhẹ để kiểm tra
            response = requests.get("http://httpbin.org/get", proxies=proxies_dict, timeout=timeout)
            response.raise_for_status()
            latency = (time.time() - start_time) * 1000  # ms
            return proxy_str, True, f"{latency:.0f}ms"
        except Exception as e:
            return proxy_str, False, str(e).splitlines()[-1]

    def _check_proxies_worker(self, proxy_list, result_widget, button, proxy_widget):
        """Worker chạy trong thread để kiểm tra song song."""
        working_proxies = []
        
        # Giới hạn 100 luồng kiểm tra cùng lúc để tránh quá tải
        with ThreadPoolExecutor(max_workers=100) as executor:
            future_to_proxy = {executor.submit(self._check_single_proxy, proxy): proxy for proxy in proxy_list}
            
            for future in as_completed(future_to_proxy):
                proxy, is_working, result_msg = future.result()
                
                def update_ui():
                    result_widget.config(state="normal")
                    if is_working:
                        result_widget.insert(tk.END, f"SỐNG - {proxy} ({result_msg})\n", "ok")
                        working_proxies.append(proxy)
                    else:
                        result_widget.insert(tk.END, f"CHẾT - {proxy} - {result_msg}\n", "error")
                    result_widget.see(tk.END)
                    result_widget.config(state="disabled")

                self.after(0, update_ui)
        
        def final_update():
            result_widget.config(state="normal")
            result_widget.tag_config("ok", foreground="green")
            result_widget.tag_config("error", foreground="red")
            result_widget.insert(tk.END, f"\nHoàn tất! Tìm thấy {len(working_proxies)} proxy hoạt động.")
            result_widget.config(state="disabled")
            
            # Tự động cập nhật lại ô nhập liệu với các proxy còn sống
            if messagebox.askyesno("Cập nhật danh sách?", f"Tìm thấy {len(working_proxies)} proxy hoạt động. Bạn có muốn cập nhật lại danh sách chỉ với các proxy này không?"):
                proxy_widget.delete("1.0", tk.END)
                proxy_widget.insert("1.0", "\n".join(working_proxies))

            button.config(state="normal")

        self.after(0, final_update)
    
    def _create_quick_tools_widgets(self, parent):
        parent.columnconfigure(0, weight=1)

        # --- Công cụ 1: Đánh lại số chương ---
        renumber_frame = ttk.LabelFrame(parent, text="1. Đánh lại số chương", padding=10)
        renumber_frame.grid(row=0, column=0, columnspan=2, sticky="ew")
        renumber_frame.columnconfigure(1, weight=1)
        # ... (Nội dung của công cụ này giữ nguyên như lần trước) ...
        ttk.Label(renumber_frame, text="Regex tìm kiếm:").grid(row=0, column=0, sticky="w", padx=5, pady=2)
        self.renumber_find_regex = ttk.Entry(renumber_frame)
        self.renumber_find_regex.insert(0, r"第\d+章")
        self.renumber_find_regex.grid(row=0, column=1, sticky="ew", padx=5)
        ttk.Label(renumber_frame, text="Cấu trúc thay thế:").grid(row=1, column=0, sticky="w", padx=5, pady=2)
        self.renumber_replace_format = ttk.Entry(renumber_frame)
        self.renumber_replace_format.insert(0, "第{num}章")
        self.renumber_replace_format.grid(row=1, column=1, sticky="ew", padx=5)
        ttk.Label(renumber_frame, text="(Phải chứa {num})").grid(row=1, column=2, sticky="w")
        action_frame1 = ttk.Frame(renumber_frame)
        action_frame1.grid(row=2, column=1, sticky="e", pady=(5, 0))
        ttk.Label(action_frame1, text="Bắt đầu từ số:").pack(side=tk.LEFT)
        self.renumber_start_var = tk.StringVar(value="1")
        ttk.Entry(action_frame1, textvariable=self.renumber_start_var, width=5).pack(side=tk.LEFT, padx=5)
        ttk.Button(action_frame1, text="Thực hiện", command=self._renumber_chapters_in_text).pack(side=tk.LEFT)

        # --- Công cụ 2: Thêm tiêu đề từ mục lục (GIAO DIỆN MỚI HOÀN TOÀN) ---
        toc_frame = ttk.LabelFrame(parent, text="2. Thêm tiêu đề từ Mục lục", padding=10)
        toc_frame.grid(row=1, column=0, columnspan=2, sticky="ew", pady=10)
        toc_frame.columnconfigure(0, weight=1) # Cho cột 0 giãn ra
        toc_frame.rowconfigure(1, weight=1) # Cho ô text giãn ra

        # Hàng 1: Nút tải file
        toc_input_header = ttk.Frame(toc_frame)
        toc_input_header.grid(row=0, column=0, columnspan=2, sticky="ew")
        ttk.Label(toc_input_header, text="Dán hoặc tải nội dung Mục lục vào ô bên dưới:").pack(side=tk.LEFT)
        ttk.Button(toc_input_header, text="Tải file Mục lục...", command=self._load_toc_into_text).pack(side=tk.RIGHT)
        
        # Hàng 2: Ô nhập mục lục
        self.toc_content_text = scrolledtext.ScrolledText(toc_frame, wrap=tk.WORD, height=8)
        self.toc_content_text.grid(row=1, column=0, columnspan=2, sticky="nsew", pady=5)

        # Hàng 3 & 4: Regex
        regex_frame = ttk.Frame(toc_frame)
        regex_frame.grid(row=2, column=0, columnspan=2, sticky="ew", pady=5)
        regex_frame.columnconfigure(1, weight=1)
        ttk.Label(regex_frame, text="Regex file Mục lục:").grid(row=0, column=0, sticky="w", padx=5, pady=2)
        self.toc_file_regex = ttk.Entry(regex_frame)
        self.toc_file_regex.insert(0, r"^(第\d+章)")
        self.toc_file_regex.grid(row=0, column=1, sticky="ew", padx=5)
        ttk.Label(regex_frame, text="(Cần 1 nhóm bắt)").grid(row=0, column=2, sticky="w")
        ttk.Label(regex_frame, text="Regex file Truyện:").grid(row=1, column=0, sticky="w", padx=5, pady=2)
        self.main_file_regex = ttk.Entry(regex_frame)
        self.main_file_regex.insert(0, r"^(第\d+章)$")
        self.main_file_regex.grid(row=1, column=1, sticky="ew", padx=5)
        ttk.Label(regex_frame, text="(Khớp phần cần thay)").grid(row=1, column=2, sticky="w")
        
        # Hàng 5: Hành động
        action_frame2 = ttk.Frame(toc_frame)
        action_frame2.grid(row=3, column=0, columnspan=2, sticky="ew", pady=5)
        self.toc_mode_var = tk.StringVar(value="append")
        ttk.Radiobutton(action_frame2, text="Bổ sung Tiêu đề", variable=self.toc_mode_var, value="append").pack(side=tk.LEFT)
        ttk.Radiobutton(action_frame2, text="Thay thế Toàn bộ", variable=self.toc_mode_var, value="replace").pack(side=tk.LEFT, padx=10)
        ttk.Button(action_frame2, text="Áp dụng Mục lục", command=self._add_titles_from_toc_in_text).pack(side=tk.RIGHT)

    def _load_toc_into_text(self):
        """Tải nội dung từ file mục lục vào ô ScrolledText."""
        toc_path = filedialog.askopenfilename(title="Chọn file Mục lục", filetypes=[("Text files", "*.txt")])
        if not toc_path: return
        try:
            with open(toc_path, 'r', encoding='utf-8') as f:
                toc_content = f.read()
            self.toc_content_text.delete("1.0", tk.END)
            self.toc_content_text.insert("1.0", toc_content)
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể đọc file: {e}", parent=self)

    def _renumber_chapters_in_text(self):
        current_content = self.text_content.get("1.0", tk.END)
        if not current_content.strip():
            messagebox.showwarning("Thông báo", "Không có nội dung để xử lý.", parent=self); return
        
        find_regex = self.renumber_find_regex.get()
        replace_format = self.renumber_replace_format.get()
        
        try: start_num = int(self.renumber_start_var.get())
        except ValueError: messagebox.showerror("Lỗi", "Số bắt đầu phải là số nguyên.", parent=self); return

        if not messagebox.askyesno("Xác nhận", "Hành động này sẽ thay đổi nội dung hiện tại. Bạn có chắc muốn tiếp tục?"): return

        new_content, count, error = TextOperations.renumber_chapters(current_content, find_regex, replace_format, start_num)
        
        if error:
            messagebox.showerror("Lỗi", error, parent=self); return

        self.text_content.delete("1.0", tk.END)
        self.text_content.insert("1.0", new_content)
        self.log(f"[Công cụ nhanh] Đã đánh số lại {count} chương.")
        messagebox.showinfo("Hoàn tất", f"Đã đánh số lại thành công {count} chương.", parent=self)

    def _add_titles_from_toc_in_text(self):
        current_content = self.text_content.get("1.0", tk.END)
        toc_content = self.toc_content_text.get("1.0", tk.END).strip()
        
        if not current_content.strip() or not toc_content:
            messagebox.showwarning("Thiếu thông tin", "Vui lòng đảm bảo cả file truyện và nội dung mục lục đều đã có.", parent=self)
            return

        toc_regex = self.toc_file_regex.get()
        main_regex = self.main_file_regex.get()
        mode = self.toc_mode_var.get()
        
        if not messagebox.askyesno("Xác nhận", "Hành động này sẽ thay đổi nội dung file truyện hiện tại. Bạn có chắc?"): return
            
        new_content, count, error = TextOperations.apply_toc_to_content(current_content, toc_content, toc_regex, main_regex, mode)

        if error:
            messagebox.showerror("Lỗi", error, parent=self)
            return

        self.text_content.delete("1.0", tk.END)
        self.text_content.insert("1.0", new_content)
        self.log(f"[Công cụ nhanh] Đã áp dụng mục lục cho {count} chương.")
        messagebox.showinfo("Hoàn tất", f"Đã áp dụng thành công mục lục cho {count} chương.", parent=self)

    def _wd_update_user_label(self):
        if hasattr(self, "wd_user_label"):
            username = self.wikidich_data.get("username") or ""
            text = f"Tài khoản: {username}" if username else "Chưa kiểm tra đăng nhập"
            self.wd_user_label.config(text=text)

    def _wd_set_progress(self, message: str, current: int = 0, total: int = 0):
        def _update():
            if not hasattr(self, "wd_progress"):
                return
            self.wd_progress_label.config(text=message)
            if total > 0:
                self.wd_progress.config(mode="determinate", maximum=total, value=min(current, total))
                if self._wd_progress_running:
                    self.wd_progress.stop()
                    self._wd_progress_running = False
            else:
                self.wd_progress.config(mode="indeterminate", maximum=100, value=0)
                if not self._wd_progress_running:
                    self.wd_progress.start(12)
                    self._wd_progress_running = True
            self._wd_update_progress_visibility(message)
        self.after(0, _update)

    def _wd_update_progress_visibility(self, message: str):
        frame = getattr(self, "wd_progress_frame", None)
        if not frame:
            return
        active = bool(self._wd_loading or (message and message.strip() and message != "Chờ thao tác..."))
        visible = getattr(self, "_wd_progress_visible", False)
        if active and not visible:
            frame.grid()
            self._wd_progress_visible = True
        elif not active and visible:
            frame.grid_remove()
            self._wd_progress_visible = False

    def _wd_report_progress(self, stage: str, current: int, total: int, message: str):
        self._wd_set_progress(message, current, total)
        try:
            # Ghi log tiến độ (giảm spam bằng cách chỉ log khi message thay đổi hoặc ở mốc 0/100)
            if not hasattr(self, "_wd_last_log_msg"):
                self._wd_last_log_msg = ""
            if message != self._wd_last_log_msg or current in (0, total):
                self.log(f"[Wikidich] {message}")
                self._wd_last_log_msg = message
        except Exception:
            pass

    def _wd_collect_advanced_filter_values(self):
        if not hasattr(self, "wd_flag_vars"):
            return
        self.wikidich_filters['flags'] = [flag for flag, var in self.wd_flag_vars.items() if var.get()]
        self.wikidich_filters['roles'] = [role for role, var in self.wd_role_vars.items() if var.get()]
        self.wikidich_filters['categories'] = self._wd_get_selected_categories()
        self.wikidich_filters['fromDate'] = self.wd_from_date_var.get().strip()
        self.wikidich_filters['toDate'] = self.wd_to_date_var.get().strip()
        self.wikidich_filters['sortBy'] = self._wd_get_sort_value()

    def _wd_get_sort_value(self):
        if not hasattr(self, "wd_sort_label_var"):
            return "recent"
        return self._wd_sort_label_to_value.get(self.wd_sort_label_var.get(), "recent")

    def _wd_set_sort_label_from_value(self, value):
        if not hasattr(self, "wd_sort_label_var"):
            return
        label = self._wd_sort_value_to_label.get(value, WD_SORT_OPTIONS[0][1])
        self.wd_sort_label_var.set(label)

    def _wd_sync_filter_controls_from_filters(self):
        if not hasattr(self, "wd_flag_vars"):
            return
        filters = self.wikidich_filters
        for flag, var in self.wd_flag_vars.items():
            var.set(flag in filters.get('flags', []))
        for role, var in self.wd_role_vars.items():
            var.set(role in filters.get('roles', []))
        self.wd_from_date_var.set(filters.get('fromDate', ''))
        self.wd_to_date_var.set(filters.get('toDate', ''))
        self._wd_select_categories(filters.get('categories', []))
        self._wd_set_sort_label_from_value(filters.get('sortBy', 'recent'))
        self._wd_toggle_advanced_section(show=self._wd_has_advanced_filters())
        self._wd_update_adv_status()
        self._wd_update_basic_status()

    def _wd_reset_filters(self):
        if not hasattr(self, "wd_flag_vars"):
            return
        for var in self.wd_flag_vars.values():
            var.set(False)
        for var in self.wd_role_vars.values():
            var.set(False)
        self._wd_select_categories([])
        self.wd_from_date_var.set("")
        self.wd_to_date_var.set("")
        self._wd_apply_filters()

    def _wd_apply_filters(self):
        if not hasattr(self, "wd_tree"):
            return
        self._wd_collect_advanced_filter_values()
        self.wikidich_filters.setdefault('categories', [])
        self.wikidich_filters.setdefault('roles', [])
        self.wikidich_filters.setdefault('flags', [])
        self.wikidich_filters.setdefault('fromDate', '')
        self.wikidich_filters.setdefault('toDate', '')
        self.wikidich_filters.update({
            'search': self.wd_search_var.get().strip(),
            'summarySearch': self.wd_summary_var.get().strip(),
            'status': self.wd_status_var.get(),
            'sortBy': self._wd_get_sort_value()
        })
        filtered = wikidich_ext.filter_books(self.wikidich_data, self.wikidich_filters)
        self.wikidich_filtered = filtered
        self._wd_update_adv_status()
        self._wd_update_basic_status()
        self._wd_refresh_tree(filtered)

    def _wd_refresh_tree(self, books):
        self.wd_tree.delete(*self.wd_tree.get_children())
        self._wd_tree_index = {}
        new_map = getattr(self, "wd_new_chapters", {})
        for book in books:
            stats = book.get('stats', {}) or {}
            book_id = book.get('id')
            new_count = ""  # default empty
            if book_id and isinstance(new_map, dict):
                val = new_map.get(book_id)
                if isinstance(val, int) and val > 0:
                    new_count = str(val)
            tags = ("has_new",) if new_count else ()
            item_id = self.wd_tree.insert(
                "",
                "end",
                tags=tags,
                values=(
                    book.get('title', ''),
                    book.get('status', ''),
                    book.get('updated_text', ''),
                    book.get('chapters') or "",
                    new_count,
                    stats.get('views') or "",
                    book.get('author', '')
                )
            )
            self._wd_tree_index[item_id] = book_id
        if books:
            first = self.wd_tree.get_children()[0]
            self.wd_tree.selection_set(first)
            self._wd_on_select()
        else:
            self.wd_title_label.config(text="Chưa có dữ liệu phù hợp")
            self.wd_summary_text.config(state="normal")
            self.wd_summary_text.delete("1.0", tk.END)
            self.wd_summary_text.config(state="disabled")
            self.wd_links_listbox.delete(0, tk.END)
            self.wd_info_vars['author'].set("")
            self.wd_info_vars['status'].set("")
            self.wd_info_vars['updated'].set("")
            self.wd_info_vars['chapters'].set("")
            self.wd_info_vars['collections'].set("")
            self.wd_info_vars['flags'].set("")
        if hasattr(self, "wd_count_var"):
            self.wd_count_var.set(f"Số truyện: {len(books)}")

    def _wd_on_select(self, event=None):
        selection = self.wd_tree.selection()
        if not selection:
            return
        item = selection[0]
        book_id = getattr(self, "_wd_tree_index", {}).get(item)
        book = self.wikidich_data.get('books', {}).get(book_id)
        self._wd_show_detail(book)


    def _wd_show_detail(self, book):
        self.wd_selected_book = book
        if not book:
            self._wd_update_update_button_state()
            return
        self.wd_title_label.config(text=book.get('title', ''))
        self.wd_info_vars['author'].set(book.get('author', ''))
        self.wd_info_vars['status'].set(book.get('status', ''))
        self.wd_info_vars['updated'].set(book.get('updated_text') or book.get('updated_iso', ''))
        chapters = book.get('chapters')
        self.wd_info_vars['chapters'].set(str(chapters) if chapters not in (None, "") else "")
        collections = book.get('collections') or book.get('tags') or []
        self.wd_info_vars['collections'].set(", ".join(collections))
        flag_map = {
            "poster": "Người đăng",
            "managerOwner": "Đồng quản lý - chủ",
            "managerGuest": "Đồng quản lý - khách",
            "editorOwner": "Biên tập - chủ",
            "editorGuest": "Biên tập - khách",
            "embedLink": "Nhúng link",
            "embedFile": "Nhúng file"
        }
        flag_labels = [flag_map.get(k, k) for k, v in (book.get('flags') or {}).items() if v]
        self.wd_info_vars['flags'].set(", ".join(flag_labels))
        self.wd_summary_text.config(state="normal")
        self.wd_summary_text.delete("1.0", tk.END)
        self.wd_summary_text.insert("1.0", book.get('summary', ''))
        self.wd_summary_text.config(state="disabled")
        self.wd_links_listbox.delete(0, tk.END)
        self.wd_current_links = book.get('extra_links', [])
        for link in self.wd_current_links:
            label = link.get('label') or link.get('url')
            self.wd_links_listbox.insert(tk.END, label)
        self._wd_display_cover(book.get('cover_url'))
        self._wd_update_update_button_state()

    def _wd_open_extra_link(self, event=None):
        if not self.wd_current_links:
            return
        try:
            index = self.wd_links_listbox.curselection()[0]
        except IndexError:
            return
        link = self.wd_current_links[index]
        url = (link.get('url') if isinstance(link, dict) else link) or ""
        self._open_in_app_browser(url)

    def _wd_open_book_in_browser(self):
        if not getattr(self, "wd_selected_book", None):
            return
        url = self.wd_selected_book.get('url')
        self._open_in_app_browser(url)

    def _wd_update_update_button_state(self):
        btn = getattr(self, "wd_update_button", None)
        if not btn:
            return
        diff = 0
        selected = getattr(self, "wd_selected_book", None)
        if selected and isinstance(self.wd_new_chapters, dict):
            val = self.wd_new_chapters.get(selected.get('id'))
            if isinstance(val, int):
                diff = val
        btn_state = tk.NORMAL if diff and diff > 0 else tk.DISABLED
        btn.config(state=btn_state)

    def _wd_open_update_dialog(self):
        selected = getattr(self, "wd_selected_book", None)
        if not selected:
            messagebox.showinfo("Chưa chọn truyện", "Vui lòng chọn một truyện trước.", parent=self)
            return
        messagebox.showinfo("Bổ sung chương", "Tính năng cập nhật tự động đang được phát triển.", parent=self)

    def _wd_start_fetch_works(self):
        if self._wd_loading:
            messagebox.showinfo("Đang chạy", "Đang có tác vụ Wikidich khác đang chạy.")
            return
        threading.Thread(target=self._wd_fetch_works_worker, daemon=True).start()

    def _wd_fetch_works_worker(self):
        pythoncom.CoInitialize()
        self._wd_loading = True
        self.log("[Wikidich] Bắt đầu tải Works...")
        self._wd_set_progress("Đang kiểm tra đăng nhập...", 0, 0)
        try:
            proxies = self._get_proxy_for_request('fetch_titles')
            cookies = load_browser_cookie_jar(["truyenwikidich.net", "koanchay.net"])
            if not cookies:
                self.after(0, lambda: messagebox.showerror("Thiếu cookie", "Không đọc được cookie Wikidich từ trình duyệt tích hợp. Hãy mở trình duyệt, đăng nhập rồi thử lại."))
                self.log("[Wikidich] Không có cookie, dừng tải.")
                return
            session = wikidich_ext.build_session_with_cookies(cookies, proxies=proxies)
            wiki_headers = self.api_settings.get('wiki_headers') if isinstance(self.api_settings, dict) else {}
            if isinstance(wiki_headers, dict):
                session.headers.update(wiki_headers)
            user_slug = wikidich_ext.fetch_current_user(session, proxies=proxies)
            if not user_slug:
                self.after(0, lambda: messagebox.showerror("Chưa đăng nhập", "Không tìm thấy mục 'Hồ sơ của tôi'. Hãy đăng nhập Wikidich bằng trình duyệt tích hợp rồi thử lại."))
                self.log("[Wikidich] Không tìm thấy 'Hồ sơ của tôi' -> chưa đăng nhập.")
                return
            self.log(f"[Wikidich] Đăng nhập: {user_slug}")
            wiki_delay_min, wiki_delay_max = self._get_delay_range(
                'wiki_delay_min',
                'wiki_delay_max',
                DEFAULT_API_SETTINGS['wiki_delay_min'],
                DEFAULT_API_SETTINGS['wiki_delay_max']
            )
            delay_avg = (wiki_delay_min + wiki_delay_max) / 2 if wiki_delay_max > 0 else 0
            data = wikidich_ext.fetch_works(
                session,
                user_slug,
                proxies=proxies,
                progress_cb=self._wd_report_progress,
                delay=delay_avg
            )
            try:
                data = wikidich_ext.collect_additional_metadata(
                    session,
                    data,
                    user_slug,
                    proxies=proxies,
                    progress_cb=self._wd_report_progress
                )
            except Exception as e:
                self.log(f"[Wikidich] Thu thập metadata thất bại: {e}")
            self.log(f"[Wikidich] Đã lấy {len(data.get('book_ids', []))} works.")
            existing = self.wikidich_data.get('books', {})
            for bid, base in data.get('books', {}).items():
                if bid in existing:
                    old = existing[bid]
                    merged = dict(base)
                    for key in ["summary", "summary_norm", "collections", "flags", "extra_links", "chapters", "stats", "cover_url", "updated_text", "updated_iso", "updated_ts", "collected_at"]:
                        if key in old and old.get(key):
                            merged[key] = old[key]
                    data["books"][bid] = merged
            self.wikidich_data = data
            self._wd_update_user_label()
            self._wd_save_cache()
            self.after(0, self._wd_refresh_category_options)
            self.after(0, self._wd_apply_filters)
            self._wd_set_progress(f"Đã tải {len(data.get('book_ids', []))} works", len(data.get('book_ids', [])), len(data.get('book_ids', [])))
        except Exception as e:
            self.log(f"[Wikidich] Lỗi tải works: {e}")
            self.after(0, lambda: messagebox.showerror("Lỗi Wikidich", f"Không thể tải works: {e}"))
        finally:
            self._wd_loading = False
            pythoncom.CoUninitialize()
            self._wd_progress_running = False
            self._wd_set_progress("Chờ thao tác...", 0, 1)

    def _wd_start_fetch_details(self):
        if self._wd_loading:
            messagebox.showinfo("Đang chạy", "Đang có tác vụ Wikidich khác đang chạy.")
            return
        if not self.wikidich_data.get('book_ids'):
            messagebox.showinfo("Chưa có dữ liệu", "Vui lòng tải works trước.")
            return
        threading.Thread(target=self._wd_fetch_details_worker, daemon=True).start()

    def _wd_fetch_details_worker(self):
        pythoncom.CoInitialize()
        self._wd_loading = True
        self.log("[Wikidich] Bắt đầu tải chi tiết/văn án...")
        try:
            proxies = self._get_proxy_for_request('fetch_titles')
            cookies = load_browser_cookie_jar(["truyenwikidich.net", "koanchay.net"])
            if not cookies:
                self.after(0, lambda: messagebox.showerror("Thiếu cookie", "Không đọc được cookie Wikidich từ trình duyệt tích hợp."))
                self.log("[Wikidich] Không có cookie, dừng tải chi tiết.")
                return
            session = wikidich_ext.build_session_with_cookies(cookies, proxies=proxies)
            wiki_headers = self.api_settings.get('wiki_headers') if isinstance(self.api_settings, dict) else {}
            if isinstance(wiki_headers, dict):
                session.headers.update(wiki_headers)
            current_user = self.wikidich_data.get('username') or wikidich_ext.fetch_current_user(session, proxies=proxies) or ""
            scope = self.wd_detail_scope_var.get()
            if scope == "filtered":
                filtered_books = getattr(self, "wikidich_filtered", []) or []
                target_ids = [book.get('id') for book in filtered_books if book.get('id')]
                if not target_ids:
                    self._wd_set_progress("Không có truyện khớp bộ lọc hiện tại", 0, 1)
                    self.after(0, lambda: messagebox.showinfo("Không có truyện", "Không có truyện nào khớp bộ lọc hiện tại để tải chi tiết.", parent=self))
                    self.log("[Wikidich] Không có truyện phù hợp bộ lọc để tải chi tiết.")
                    return
            else:
                target_ids = list(self.wikidich_data.get('book_ids', []))
            target_ids = list(dict.fromkeys(target_ids))
            if self.wd_missing_only_var.get():
                target_ids = [bid for bid in target_ids if not self.wikidich_data.get('books', {}).get(bid, {}).get('summary')]
            total = len(target_ids)
            if total == 0:
                self._wd_set_progress("Không có truyện cần tải chi tiết", 0, 1)
                self.after(0, lambda: messagebox.showinfo("Không có gì để tải", "Tất cả truyện đã có văn án/chi tiết."))
                self.log("[Wikidich] Không có truyện cần tải chi tiết.")
                return
            self._wd_set_progress("Đang tải chi tiết...", 0, total)
            wiki_delay_min, wiki_delay_max = self._get_delay_range(
                'wiki_delay_min',
                'wiki_delay_max',
                DEFAULT_API_SETTINGS['wiki_delay_min'],
                DEFAULT_API_SETTINGS['wiki_delay_max']
            )
            for idx, bid in enumerate(target_ids, start=1):
                book = self.wikidich_data.get('books', {}).get(bid)
                if not book:
                    continue
                try:
                    updated = wikidich_ext.fetch_book_detail(session, book, current_user, proxies=proxies)
                    self.wikidich_data['books'][bid] = updated
                except Exception as e:
                    self.log(f"[Wikidich] Lỗi khi tải {book.get('title', bid)}: {e}")
                self._wd_report_progress("detail", idx, total, f"Đang tải chi tiết {idx}/{total}")
                delay = random.uniform(wiki_delay_min, wiki_delay_max) if wiki_delay_max > 0 else 0
                if delay > 0:
                    time.sleep(delay)
            self._wd_save_cache()
            self.after(0, self._wd_apply_filters)
            self._wd_set_progress("Hoàn tất tải chi tiết", total, total)
            self.log("[Wikidich] Hoàn tất tải chi tiết.")
        finally:
            self._wd_loading = False
            pythoncom.CoUninitialize()
            self._wd_progress_running = False

    def _wd_prompt_check_updates(self):
        filtered = list(getattr(self, "wikidich_filtered", []) or [])
        if not filtered:
            messagebox.showinfo("Chưa có dữ liệu", "Không có truyện nào đang hiển thị để kiểm tra.", parent=self)
            return
        messagebox.showinfo("Kiểm tra cập nhật", "Chức năng chỉ kiểm tra các truyện đang hiển thị trong bảng hiện tại.", parent=self)
        self._wd_start_check_updates()

    def _wd_start_check_updates(self):
        if self._wd_loading:
            messagebox.showinfo("Đang chạy", "Đang có tác vụ Wikidich khác đang chạy.")
            return
        threading.Thread(target=self._wd_check_updates_worker, daemon=True).start()

    def _wd_check_updates_worker(self):
        pythoncom.CoInitialize()
        self._wd_loading = True
        try:
            filtered = list(getattr(self, "wikidich_filtered", []) or [])
            if not filtered:
                self._wd_set_progress("Không có truyện để kiểm tra", 0, 1)
                return
            proxies = self._get_proxy_for_request('fetch_titles')
            fanqie_headers = self.api_settings.get('fanqie_headers') if isinstance(self.api_settings, dict) else {}
            fanqie_delay_min, fanqie_delay_max = self._get_delay_range(
                'fanqie_delay_min',
                'fanqie_delay_max',
                DEFAULT_API_SETTINGS['fanqie_delay_min'],
                DEFAULT_API_SETTINGS['fanqie_delay_max']
            )
            total = len(filtered)
            results = dict(self.wd_new_chapters) if isinstance(self.wd_new_chapters, dict) else {}
            self._wd_set_progress("Đang kiểm tra cập nhật...", 0, total)
            for idx, book in enumerate(filtered, start=1):
                book_id = book.get('id')
                diff = self._wd_calculate_new_chapters(book, proxies=proxies, headers=fanqie_headers)
                if book_id:
                    if isinstance(diff, int) and diff > 0:
                        results[book_id] = diff
                    else:
                        results.pop(book_id, None)
                self._wd_report_progress("check_update", idx, total, f"Đang kiểm tra {idx}/{total}")
                delay = random.uniform(fanqie_delay_min, fanqie_delay_max) if fanqie_delay_max > 0 else 0
                if delay > 0:
                    time.sleep(delay)
            self.wd_new_chapters = results
            self.after(0, lambda: self._wd_refresh_tree(filtered))
            self._wd_set_progress("Hoàn tất kiểm tra cập nhật", total, total)
        except Exception as exc:
            self.log(f"[Wikidich] Lỗi khi kiểm tra cập nhật: {exc}")
            self.after(0, lambda: messagebox.showerror("Lỗi", f"Không thể kiểm tra cập nhật: {exc}", parent=self))
        finally:
            self._wd_loading = False
            self._wd_progress_running = False
            pythoncom.CoUninitialize()

    def _wd_get_fanqie_link(self, book: dict):
        links = book.get('extra_links') or []
        for link in links:
            if isinstance(link, dict):
                url = link.get('url', '')
            else:
                url = str(link)
            if url and "fanqienovel.com" in url:
                return url
        return None

    def _wd_calculate_new_chapters(self, book: dict, proxies=None, headers=None):
        link = self._wd_get_fanqie_link(book)
        if not link:
            return None
        result = fanqienovel_ext.fetch_chapters(link, proxies=proxies, headers=headers)
        if not result or result.get('error'):
            if result and result.get('error'):
                self.log(f"[Wikidich] Không thể lấy chương Fanqie cho '{book.get('title', '')}': {result['error']}")
            return None
        remote_list = result.get('data') or []
        remote_total = len(remote_list)
        current_total = book.get('chapters') or 0
        try:
            current_total = int(current_total)
        except Exception:
            current_total = 0
        diff = remote_total - current_total
        return diff if diff > 0 else 0

    def _wd_display_cover(self, url: str):
        if not url:
            self.wd_cover_label.config(image='', text="(Không có bìa)")
            return
        if url in self._wd_cover_cache:
            photo = self._wd_cover_cache[url]
            self.wd_cover_label.config(image=photo, text="")
            self.wd_cover_label.image = photo
            return

        def _worker():
            try:
                proxies = self._get_proxy_for_request('images')
                resp = requests.get(url, timeout=25, proxies=proxies)
                resp.raise_for_status()
                img = Image.open(io.BytesIO(resp.content))
                img.thumbnail((220, 320))
                photo = ImageTk.PhotoImage(img)
            except Exception:
                photo = None
            self.after(0, lambda: self._wd_set_cover_image(url, photo))
        threading.Thread(target=_worker, daemon=True).start()

    def _wd_set_cover_image(self, url: str, photo):
        if photo:
            self._wd_cover_cache[url] = photo
            self.wd_cover_label.config(image=photo, text="")
            self.wd_cover_label.image = photo
        else:
            self.wd_cover_label.config(image='', text="(Không tải được bìa)")
            self.wd_cover_label.image = None

    def _wd_load_cache(self):
        cached = wikidich_ext.load_cache(self.wikidich_cache_path)
        if cached:
            self.wikidich_data = cached
            self._wd_update_user_label()
            self._wd_refresh_category_options()
            self._wd_apply_filters()

    def _wd_save_cache(self):
        try:
            if self.wikidich_data.get('book_ids'):
                wikidich_ext.save_cache(self.wikidich_cache_path, self.wikidich_data)
        except Exception as e:
            self.log(f"[Wikidich] Không thể lưu cache: {e}")

    def _open_api_settings_dialog(self):
        current = self.api_settings or {}
        wiki_min = current.get('wiki_delay_min', DEFAULT_API_SETTINGS['wiki_delay_min'])
        wiki_max = current.get('wiki_delay_max', DEFAULT_API_SETTINGS['wiki_delay_max'])
        fanqie_min = current.get('fanqie_delay_min', DEFAULT_API_SETTINGS['fanqie_delay_min'])
        fanqie_max = current.get('fanqie_delay_max', DEFAULT_API_SETTINGS['fanqie_delay_max'])
        wiki_headers = current.get('wiki_headers', {}) or {}
        fanqie_headers = current.get('fanqie_headers', {}) or {}

        win = tk.Toplevel(self)
        win.title("Cài đặt request")
        win.transient(self)
        win.grab_set()
        win.resizable(False, False)
        container = ttk.Frame(win, padding=12)
        container.pack(fill="both", expand=True)

        delay_frame = ttk.LabelFrame(container, text="Độ trễ giữa các request (giây)", padding=10)
        delay_frame.pack(fill="x", expand=True)

        wiki_row = ttk.Frame(delay_frame)
        wiki_row.pack(fill="x", pady=4)
        ttk.Label(wiki_row, text="Wiki:").pack(side=tk.LEFT)
        wiki_min_var = tk.DoubleVar(value=wiki_min)
        wiki_max_var = tk.DoubleVar(value=wiki_max)
        ttk.Label(wiki_row, text="Từ").pack(side=tk.LEFT, padx=(8, 2))
        ttk.Entry(wiki_row, textvariable=wiki_min_var, width=8).pack(side=tk.LEFT)
        ttk.Label(wiki_row, text="đến").pack(side=tk.LEFT, padx=(6, 2))
        ttk.Entry(wiki_row, textvariable=wiki_max_var, width=8).pack(side=tk.LEFT)

        fanqie_row = ttk.Frame(delay_frame)
        fanqie_row.pack(fill="x", pady=4)
        ttk.Label(fanqie_row, text="Fanqie:").pack(side=tk.LEFT)
        fanqie_min_var = tk.DoubleVar(value=fanqie_min)
        fanqie_max_var = tk.DoubleVar(value=fanqie_max)
        ttk.Label(fanqie_row, text="Từ").pack(side=tk.LEFT, padx=(8, 2))
        ttk.Entry(fanqie_row, textvariable=fanqie_min_var, width=8).pack(side=tk.LEFT)
        ttk.Label(fanqie_row, text="đến").pack(side=tk.LEFT, padx=(6, 2))
        ttk.Entry(fanqie_row, textvariable=fanqie_max_var, width=8).pack(side=tk.LEFT)

        headers_frame = ttk.LabelFrame(container, text="Header cho request", padding=10)
        headers_frame.pack(fill="both", expand=True, pady=(10, 0))
        headers_frame.columnconfigure(1, weight=1)

        ttk.Label(headers_frame, text="User-Agent (Wiki):").grid(row=0, column=0, sticky="w", padx=(0, 6))
        wiki_ua_var = tk.StringVar(value=wiki_headers.get("User-Agent", DEFAULT_API_SETTINGS['wiki_headers'].get("User-Agent", "")))
        ttk.Entry(headers_frame, textvariable=wiki_ua_var).grid(row=0, column=1, sticky="ew")

        ttk.Label(headers_frame, text="User-Agent (Fanqie):").grid(row=1, column=0, sticky="w", padx=(0, 6), pady=(8, 0))
        fanqie_ua_var = tk.StringVar(value=fanqie_headers.get("User-Agent", DEFAULT_API_SETTINGS['fanqie_headers'].get("User-Agent", "")))
        ttk.Entry(headers_frame, textvariable=fanqie_ua_var).grid(row=1, column=1, sticky="ew", pady=(8, 0))

        action_frame = ttk.Frame(container)
        action_frame.pack(fill="x", pady=(12, 0))

        def _reset_defaults():
            wiki_min_var.set(DEFAULT_API_SETTINGS['wiki_delay_min'])
            wiki_max_var.set(DEFAULT_API_SETTINGS['wiki_delay_max'])
            fanqie_min_var.set(DEFAULT_API_SETTINGS['fanqie_delay_min'])
            fanqie_max_var.set(DEFAULT_API_SETTINGS['fanqie_delay_max'])
            wiki_ua_var.set(DEFAULT_API_SETTINGS['wiki_headers'].get("User-Agent", ""))
            fanqie_ua_var.set(DEFAULT_API_SETTINGS['fanqie_headers'].get("User-Agent", ""))

        def _save_settings():
            try:
                wiki_min_val = float(wiki_min_var.get())
                wiki_max_val = float(wiki_max_var.get())
                fanqie_min_val = float(fanqie_min_var.get())
                fanqie_max_val = float(fanqie_max_var.get())
            except Exception:
                messagebox.showerror("Lỗi", "Giá trị độ trễ phải là số.", parent=win)
                return
            if wiki_min_val < 0 or wiki_max_val < 0 or fanqie_min_val < 0 or fanqie_max_val < 0:
                messagebox.showerror("Lỗi", "Độ trễ không được âm.", parent=win)
                return
            if wiki_max_val < wiki_min_val:
                wiki_max_val = wiki_min_val
            if fanqie_max_val < fanqie_min_val:
                fanqie_max_val = fanqie_min_val

            wiki_ua = wiki_ua_var.get().strip() or DEFAULT_API_SETTINGS['wiki_headers'].get("User-Agent", "")
            fanqie_ua = fanqie_ua_var.get().strip() or DEFAULT_API_SETTINGS['fanqie_headers'].get("User-Agent", "")
            wiki_hdr = dict(DEFAULT_API_SETTINGS['wiki_headers'])
            wiki_hdr["User-Agent"] = wiki_ua
            fanqie_hdr = dict(DEFAULT_API_SETTINGS['fanqie_headers'])
            fanqie_hdr["User-Agent"] = fanqie_ua

            self.api_settings = {
                'wiki_delay_min': wiki_min_val,
                'wiki_delay_max': wiki_max_val,
                'fanqie_delay_min': fanqie_min_val,
                'fanqie_delay_max': fanqie_max_val,
                'wiki_headers': wiki_hdr,
                'fanqie_headers': fanqie_hdr
            }
            self.app_config['api_settings'] = dict(self.api_settings)
            self.save_config()
            messagebox.showinfo("Đã lưu", "Đã lưu cài đặt request.", parent=win)
            win.destroy()

        ttk.Button(action_frame, text="Trở về mặc định", command=_reset_defaults).pack(side=tk.LEFT)
        ttk.Button(action_frame, text="Lưu", command=_save_settings).pack(side=tk.RIGHT, padx=(6, 0))
        ttk.Button(action_frame, text="Đóng", command=win.destroy).pack(side=tk.RIGHT)

    def _wd_prompt_detail_fetch(self):
        if self._wd_loading:
            messagebox.showinfo("Đang chạy", "Đang có tác vụ Wikidich khác đang chạy.")
            return
        if not self.wikidich_data.get('book_ids'):
            messagebox.showinfo("Chưa có dữ liệu", "Vui lòng tải works trước.")
            return
        win = tk.Toplevel(self)
        win.title("Tùy chọn tải chi tiết")
        win.transient(self)
        win.grab_set()
        win.resizable(False, False)
        container = ttk.Frame(win, padding=12)
        container.pack(fill="both", expand=True)
        ttk.Label(container, text="Chọn phạm vi tải chi tiết").pack(anchor="w")
        missing_var = tk.BooleanVar(value=self.wd_missing_only_var.get())
        ttk.Checkbutton(container, text="Chỉ bổ sung chi tiết còn thiếu", variable=missing_var).pack(anchor="w", pady=(6, 0))

        scope_var = tk.StringVar(value=self.wd_detail_scope_var.get())
        ttk.Label(container, text="Phạm vi:").pack(anchor="w", pady=(12, 4))
        ttk.Radiobutton(container, text="Tất cả truyện đã thu thập", variable=scope_var, value="all").pack(anchor="w")
        ttk.Radiobutton(container, text="Chỉ các truyện đang áp dụng bộ lọc (kể cả nâng cao)", variable=scope_var, value="filtered").pack(anchor="w", pady=(2, 0))

        btn_frame = ttk.Frame(container)
        btn_frame.pack(fill=tk.X, pady=(16, 0))

        def _start():
            self.wd_missing_only_var.set(missing_var.get())
            self.wd_detail_scope_var.set(scope_var.get())
            win.destroy()
            self._wd_start_fetch_details()

        ttk.Button(btn_frame, text="Bắt đầu tải", command=_start).pack(side=tk.RIGHT)
        ttk.Button(btn_frame, text="Hủy", command=win.destroy).pack(side=tk.RIGHT, padx=(0, 8))

    def _wd_toggle_advanced_section(self, show=None):
        if not hasattr(self, "wd_adv_container"):
            return
        if show is None:
            show = not getattr(self, "_wd_adv_section_visible", False)
        if show:
            self.wd_adv_container.grid()
        else:
            self.wd_adv_container.grid_remove()
        self._wd_adv_section_visible = show
        if hasattr(self, "wd_adv_toggle_btn"):
            self.wd_adv_toggle_btn.config(text="Ẩn lọc nâng cao" if show else "Hiện lọc nâng cao")

    def _wd_has_advanced_filters(self):
        if not hasattr(self, "wd_role_vars"):
            return False
        if self.wd_from_date_var.get().strip() or self.wd_to_date_var.get().strip():
            return True
        if self._wd_get_selected_categories():
            return True
        if any(var.get() for var in self.wd_role_vars.values()):
            return True
        return False

    def _wd_update_adv_status(self):
        if not hasattr(self, "wd_adv_status_var"):
            return
        parts = []
        if self.wd_from_date_var.get().strip() or self.wd_to_date_var.get().strip():
            parts.append("Ngày cập nhật")
        if self._wd_get_selected_categories():
            parts.append("Thể loại")
        if any(var.get() for var in getattr(self, "wd_role_vars", {}).values()):
            parts.append("Vai trò")
        text = f"Đang áp dụng lọc nâng cao ({', '.join(parts)})" if parts else ""
        self.wd_adv_status_var.set(text)

    def _wd_update_basic_status(self):
        if not hasattr(self, "wd_basic_status_var"):
            return
        parts = []
        search = self.wd_search_var.get().strip()
        if search:
            parts.append(f"Tên/TG chứa '{search}'")
        summary = self.wd_summary_var.get().strip()
        if summary:
            parts.append(f"Văn án chứa '{summary}'")
        status = self.wd_status_var.get()
        if status and status != "all":
            parts.append(f"Trạng thái: {status}")
        text = f"Đang lọc cơ bản ({', '.join(parts)})" if parts else ""
        self.wd_basic_status_var.set(text)

    def _wd_get_selected_categories(self):
        listbox = getattr(self, "wd_category_listbox", None)
        if not listbox or not self._wd_category_options:
            return list(self._wd_pending_categories)
        selected = []
        for idx in listbox.curselection():
            if 0 <= idx < len(self._wd_category_options):
                selected.append(self._wd_category_options[idx])
        self._wd_pending_categories = list(selected)
        return selected

    def _wd_select_categories(self, categories):
        self._wd_pending_categories = list(categories or [])
        listbox = getattr(self, "wd_category_listbox", None)
        if not listbox:
            return
        listbox.selection_clear(0, tk.END)
        if not getattr(self, "_wd_category_options", None):
            return
        for idx, cat in enumerate(self._wd_category_options):
            if cat in self._wd_pending_categories:
                listbox.selection_set(idx)

    def _wd_refresh_category_options(self):
        listbox = getattr(self, "wd_category_listbox", None)
        if not listbox:
            return
        categories = sorted({c for b in self.wikidich_data.get('books', {}).values() for c in (b.get('collections') or []) if c})
        self._wd_category_options = categories
        listbox.delete(0, tk.END)
        for cat in categories:
            listbox.insert(tk.END, cat)
        self._wd_select_categories(self._wd_pending_categories or self.wikidich_filters.get('categories', []))

    def _wd_open_date_picker(self, target_var, title):
        today = datetime.today()
        current_value = target_var.get().strip()
        try:
            current_dt = datetime.fromisoformat(current_value) if current_value else today
        except Exception:
            current_dt = today
        current_dt = min(current_dt, today)
        win = tk.Toplevel(self)
        win.title(title)
        win.transient(self)
        win.grab_set()
        win.resizable(False, False)
        frame = ttk.Frame(win, padding=12)
        frame.pack(fill="both", expand=True)
        ttk.Label(frame, text="Chọn ngày (không vượt quá hôm nay)").pack(anchor="w", pady=(0, 6))
        year_var = tk.IntVar(value=current_dt.year)
        month_var = tk.IntVar(value=current_dt.month)
        day_var = tk.IntVar(value=current_dt.day)

        spin_frame = ttk.Frame(frame)
        spin_frame.pack(pady=(0, 8))
        ttk.Label(spin_frame, text="Năm:").grid(row=0, column=0, padx=4)
        ttk.Spinbox(spin_frame, from_=2005, to=today.year, textvariable=year_var, width=6).grid(row=0, column=1)
        ttk.Label(spin_frame, text="Tháng:").grid(row=0, column=2, padx=4)
        ttk.Spinbox(spin_frame, from_=1, to=12, textvariable=month_var, width=4).grid(row=0, column=3)
        ttk.Label(spin_frame, text="Ngày:").grid(row=0, column=4, padx=4)
        ttk.Spinbox(spin_frame, from_=1, to=31, textvariable=day_var, width=4).grid(row=0, column=5)

        btn_frame = ttk.Frame(frame)
        btn_frame.pack(fill=tk.X)

        def _set_today():
            year_var.set(today.year)
            month_var.set(today.month)
            day_var.set(today.day)

        def _apply():
            try:
                selected = datetime(year_var.get(), month_var.get(), day_var.get())
            except ValueError:
                messagebox.showerror("Ngày không hợp lệ", "Vui lòng kiểm tra lại ngày/tháng/năm.", parent=win)
                return
            if selected > today:
                messagebox.showerror("Ngày không hợp lệ", "Không thể chọn ngày ở tương lai.", parent=win)
                return
            target_var.set(selected.strftime("%Y-%m-%d"))
            self._wd_update_adv_status()
            win.destroy()

        ttk.Button(btn_frame, text="Hôm nay", command=_set_today).pack(side=tk.LEFT)
        ttk.Button(btn_frame, text="Đồng ý", command=_apply).pack(side=tk.RIGHT)
        ttk.Button(btn_frame, text="Hủy", command=win.destroy).pack(side=tk.RIGHT, padx=(0, 8))

    def _wd_clear_date(self, target_var):
        target_var.set("")
        self._wd_update_adv_status()

    def _start_extraction(self):
        """Bắt đầu quá trình giải nén file trong một thread riêng."""
        archive_path = filedialog.askopenfilename(
            title="Chọn file nén cần giải nén",
            filetypes=[
                ("Archive files", "*.zip *.rar *.7z *.gz *.tar"), 
                ("All files", "*.*")
            ]
        )
        if not archive_path:
            return

        dest_path = filedialog.askdirectory(
            title="Chọn thư mục để giải nén vào"
        )
        if not dest_path:
            return

        def worker():
            try:
                import patoolib
                self.log(f"[Giải nén] Bắt đầu giải nén '{os.path.basename(archive_path)}'...")
                patoolib.extract_archive(archive_path, outdir=dest_path)
                self.log(f"[Giải nén] Hoàn tất! Đã giải nén vào: {dest_path}")
                self.after(0, lambda: messagebox.showinfo("Thành công", "Đã giải nén file thành công!"))
            except ImportError:
                self.log("[Lỗi] Thư viện 'patoolib' chưa được cài đặt.")
                self.after(0, lambda: messagebox.showerror("Lỗi", "Vui lòng cài đặt thư viện 'patoolib' để sử dụng tính năng này.\nChạy lệnh: pip install patoolib"))
            except Exception as e:
                self.log(f"[Lỗi giải nén] {e}")
                self.after(0, lambda: messagebox.showerror("Lỗi", f"Giải nén thất bại: {e}"))

        threading.Thread(target=worker, daemon=True).start()

    def _copy_titles_to_quick_tools(self):
        """Sao chép tiêu đề từ bảng online vào ô mục lục của Công cụ Nhanh."""
        selected_items = self.online_tree.selection()
        if not selected_items:
            messagebox.showinfo("Thông báo", "Vui lòng chọn ít nhất một chương.", parent=self)
            return

        # Lấy tiêu đề theo logic gộp hoặc chọn cột
        selected_titles = []
        if self.combine_titles_var.get():
            format_str = self.title_format_var.get()
            for item_id in selected_items:
                item_data = self.online_tree.item(item_id, 'values')
                try:
                    combined = format_str.format(t1=item_data[1], t2=item_data[2])
                    selected_titles.append(f"第{item_data[0]}章 {combined}") # Thêm số chương vào đầu
                except KeyError: pass
        else:
            title_key_index = 1 if self.title_choice.get() == 'title1' else 2
            for item_id in selected_items:
                item_data = self.online_tree.item(item_id, 'values')
                selected_titles.append(f"第{item_data[0]}章 {item_data[title_key_index]}")

        # Chuyển tab và điền dữ liệu
        self._select_tab_by_name("Xử lý Văn bản")
        self.ops_notebook.select(self.ops_notebook.tabs()[-1]) # Chọn sub-tab cuối cùng (Công cụ Nhanh)
        
        self.toc_content_text.delete("1.0", tk.END)
        self.toc_content_text.insert("1.0", "\n".join(selected_titles))
        
        self.log(f"Đã sao chép {len(selected_titles)} tiêu đề vào Công cụ Nhanh.")
    
def main():
    """Launch the Tkinter application."""
    app = RenamerApp()
    app.mainloop()


if __name__ == "__main__":
    main()
