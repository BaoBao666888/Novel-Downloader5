# main_ui.py
import os
import socket
import re
import io
import gzip
import time
import html
import zipfile
import textwrap
from datetime import datetime
from typing import Optional
import tkinter.font as tkfont
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext, simpledialog, colorchooser

try:
    import ctypes
except ImportError:
    ctypes = None

import requests
from bs4 import BeautifulSoup
try:
    import pystray
except ImportError:
    pystray = None

from PIL import Image, ImageTk, ImageFilter, ImageDraw, ImageFont
import numpy as np
import cv2
from app.core import renamer as logic
import json
import threading
import urllib.request
from urllib.parse import urlparse, urljoin, quote, unquote
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
from app.core.browser_cookies import load_browser_cookie_jar
from app.nd5.loader import load_nd5_plugins
from app.nd5.plugin_api import ND5Context
import pythoncom
import random
import subprocess
import sys
import shutil
import webbrowser
try:
    import win32event
    import win32api
    import winerror
except Exception:
    win32event = None
    win32api = None
    winerror = None
from concurrent.futures import ThreadPoolExecutor, as_completed
from browser_overlay import BrowserOverlay
from app.paths import BASE_DIR, RESOURCE_DIR, BACKGROUND_DIR
from app.ui.constants import CONFIG_PATH, DEFAULT_API_SETTINGS, DEFAULT_BACKGROUND_SETTINGS, DEFAULT_ND5_OPTIONS, DEFAULT_UI_SETTINGS, DEFAULT_UPLOAD_SETTINGS, MODERN_THEME_NAME, ONLINE_SOURCES, SOURCE_BY_ID, THEME_PRESETS, WD_SORT_OPTIONS
from app.ui.wikidich_mixin import WikidichMixin
from app.ui.nd5_mixin import ND5Mixin
from app.ui.rename_tab_mixin import RenameTabMixin
from app.ui.credit_tab_mixin import CreditTabMixin
from app.ui.online_tab_mixin import OnlineTabMixin
from app.ui.settings_tab_mixin import SettingsTabMixin
from app.ui.text_ops_mixin import TextOpsMixin
from app.ui.translate_tab_mixin import TranslateTabMixin
from app.ui.image_tab_mixin import ImageTabMixin
from app.ui.proxy_mixin import ProxyMixin
from app.ui.radical_checker import open_radical_checker_dialog
from app.ui.library_mixin import LibraryMixin
from app.ui.wikidich import WikidichController, WikidichState

# Đảm bảo chỉ một instance (dùng localhost TCP)
_SINGLE_INSTANCE_HOST = "127.0.0.1"
_SINGLE_INSTANCE_PORT = int(os.environ.get("RC_SINGLE_INSTANCE_PORT", "45952"))
_SINGLE_INSTANCE_MUTEX = "Global\\RenameChaptersSingleInstanceMutex"
_instance_mutex_handle = None


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


def _hex_to_rgb(hex_color, fallback=(99, 102, 241)):
    """Convert hex color to RGB tuple."""
    normalized = _normalize_hex_color(hex_color)
    try:
        return tuple(int(normalized[i:i + 2], 16) for i in (1, 3, 5))
    except Exception:
        return fallback


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
    """Trả về đường dẫn tuyệt đối, chuẩn hóa dấu gạch và cả mẫu ổ đĩa Windows."""
    if not path:
        return ''
    normalized = str(path).strip()
    if not normalized:
        return ''
    # Chuẩn hóa cả dấu gạch chéo ngược khi chạy trên hệ khác
    normalized = normalized.replace("\\", os.sep)
    # Nhận diện mẫu ổ đĩa Windows (C:\...) kể cả khi chạy trên non-Windows
    if re.match(r"^[A-Za-z]:", normalized):
        return os.path.normpath(normalized)
    if os.path.isabs(normalized):
        return os.path.normpath(normalized)
    return os.path.normpath(os.path.join(BASE_DIR, normalized))


def _env_bool(name, default=False, env_map=None):
    value = None
    if env_map:
        value = env_map.get(name)
    if value is None:
        value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in ('1', 'true', 'yes', 'y', 'on')


def _acquire_single_instance_mutex() -> bool:
    """Trả về True nếu chiếm được mutex; False nếu đã có instance."""
    global _instance_mutex_handle
    if not win32event or not win32api or not winerror:
        return True
    try:
        handle = win32event.CreateMutex(None, False, _SINGLE_INSTANCE_MUTEX)
        err = win32api.GetLastError()
        _instance_mutex_handle = handle
        if err == winerror.ERROR_ALREADY_EXISTS:
            return False
        return True
    except Exception:
        return True


def _release_single_instance_mutex():
    global _instance_mutex_handle
    if _instance_mutex_handle:
        try:
            win32api.CloseHandle(_instance_mutex_handle)
        except Exception:
            pass
    _instance_mutex_handle = None


def ensure_single_instance_or_exit():
    """Bind cổng nội bộ; nếu đã có instance, gửi lệnh SHOW và thoát."""
    if not _acquire_single_instance_mutex():
        try:
            with socket.create_connection((_SINGLE_INSTANCE_HOST, _SINGLE_INSTANCE_PORT), timeout=1.5) as conn:
                conn.sendall(b"SHOW")
        except Exception:
            pass
        sys.exit(0)
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        sock.bind((_SINGLE_INSTANCE_HOST, _SINGLE_INSTANCE_PORT))
        sock.listen(1)
        return sock
    except OSError:
        try:
            with socket.create_connection((_SINGLE_INSTANCE_HOST, _SINGLE_INSTANCE_PORT), timeout=1.5) as conn:
                conn.sendall(b"SHOW")
        except Exception:
            pass
        sys.exit(0)


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
APP_VERSION = ENV_VARS.get('APP_VERSION', '0.2.9.1')
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

class RenamerApp(
    tk.Tk,
    ProxyMixin,
    WikidichMixin,
    ND5Mixin,
    RenameTabMixin,
    CreditTabMixin,
    OnlineTabMixin,
    SettingsTabMixin,
    TextOpsMixin,
    TranslateTabMixin,
    ImageTabMixin,
    LibraryMixin,
):
    CURRENT_VERSION = APP_VERSION
    VERSION_CHECK_URL = os.environ.get(
        "VERSION_CHECK_URL",
        "https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/refs/heads/main/rename_chapters/version.json"
    )
    def __init__(self, instance_server=None):
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
        self.background_settings = dict(DEFAULT_BACKGROUND_SETTINGS)
        self.background_settings.update(self.app_config.get('background', {}))
        # Biến trạng thái cho UI settings (dùng ở Settings tab)
        self.ui_settings_vars = {
            'use_classic_theme': tk.BooleanVar(value=self.ui_settings.get('use_classic_theme', False)),
            'mouse_glow': tk.BooleanVar(value=self.ui_settings.get('mouse_glow', False)),
        }
        self._tray_icon = None
        self._tray_icon_thread = None
        self._tray_image = None
        self._hidden_to_tray = False
        self._force_exit = False
        self._pending_font_value = self.ui_settings.get('font_size', DEFAULT_UI_SETTINGS['font_size'])
        self._theme_ready = False
        self._cursor_motion_binding_active = False
        self._cursor_glow_window = None
        self._cursor_glow_canvas = None
        self.nd5_options = dict(DEFAULT_ND5_OPTIONS)
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
        self._icon_path = None
        self._app_icon_image = None
        self._instance_server = instance_server
        self._instance_thread = None
        self.use_local_manifest_only = USE_LOCAL_MANIFEST_ONLY

        wd_cfg = self.app_config.get('wikidich', {})
        self.wikidich_cache_path = wd_cfg.get('cache_path', os.path.join(BASE_DIR, "local", "wikidich_cache.json"))
        self.wikidich_filters = dict(wd_cfg.get('advanced_filter', {}))
        self.wikidich_filters.setdefault('extraLinkSearch', '')
        self.wikidich_open_mode = wd_cfg.get('open_mode', 'in_app')
        self.wikidich_auto_pick_mode = wd_cfg.get('auto_pick_mode', 'extract_then_pick')
        self.wikidich_links = dict(self.app_config.get('wikidich_links', {}))
        self.api_settings = dict(self.app_config.get('api_settings', {}))
        self.wikidich_upload_settings = dict(self.app_config.get('wikidich_upload_settings', DEFAULT_UPLOAD_SETTINGS))
        self.wikidich_data = {"username": None, "book_ids": [], "books": {}, "synced_at": None}
        self._wd_cover_cache = {}
        self._wd_loading = False
        self._wd_cancel_requested = False
        self._wd_progress_running = False
        self.wd_new_chapters = {}
        self.wd_not_found = []
        self.wd_site = "wikidich"
        self._wd_contexts = {}
        self._wd_site_states = {}
        self._wd_tabs = {}
        self._wd_cache_paths = {
            "wikidich": self.wikidich_cache_path,
            "koanchay": os.path.join(BASE_DIR, "local", "koanchay_cache.json")
        }
        self.wikidich_notes = self._wd_normalize_notes(self.app_config.get('wikidich_notes', {}))
        self._wd_chapter_win = None
        self._wd_chapter_tree = None
        self._wd_chapter_status = None
        self._wd_chapter_data = []
        self._wd_chapter_buttons = {}
        self._wd_global_notes_win = None
        self._wd_notes_tree = None
        self._wd_notes_preview = None
        self._wd_global_links_win = None
        self._wd_link_tree = None
        self._browser_user_agent = None
        self._browser_headers = {}
        self._browser_cookies = {}
        self._wd_resume_works = None
        self._wd_resume_details = None
        self._wd_load_resume_state()
        self._wd_load_detail_resume()
        self._fanqie_bridge_proc = None
        self._auto_update_temp_root = os.path.join(BASE_DIR, "tmp_auto_update")
        
        # NEW: Khởi tạo WikidichController cho mỗi site
        self._wd_controllers = {
            "wikidich": WikidichController("wikidich", self),
            "koanchay": WikidichController("koanchay", self)
        }
        # Load config vào controllers
        wd_cfg = self.app_config.get('wikidich', {})
        kc_cfg = self.app_config.get('koanchay', {})
        self._wd_controllers["wikidich"].load_from_config(wd_cfg)
        self._wd_controllers["koanchay"].load_from_config(kc_cfg)
        
        self.create_widgets()
        self._start_single_instance_listener()
        self.load_config()
        self._set_app_icon()
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
                'extraLinkSearch': '',
                'categories': [],
                'roles': [],
                'flags': [],
                    'fromDate': '',
                    'toDate': '',
                    'sortBy': 'recent'
                },
                'open_mode': 'in_app',
                'auto_pick_mode': 'extract_then_pick'
            },
            'koanchay': {
                'cache_path': os.path.join(BASE_DIR, "local", "koanchay_cache.json"),
                'advanced_filter': {
                    'status': 'all',
                    'search': '',
                    'summarySearch': '',
                    'extraLinkSearch': '',
                    'categories': [],
                    'roles': [],
                    'flags': [],
                    'fromDate': '',
                    'toDate': '',
                    'sortBy': 'recent'
                },
                'open_mode': 'in_app',
                'auto_pick_mode': 'extract_then_pick'
            },
            'wikidich_notes': {},
            'wikidich_links': {},
            'api_settings': dict(DEFAULT_API_SETTINGS),
            'wikidich_upload_settings': dict(DEFAULT_UPLOAD_SETTINGS),
            'novel_downloader5': dict(DEFAULT_ND5_OPTIONS),
            'background': dict(DEFAULT_BACKGROUND_SETTINGS),
            'radical_map': {},
            'radical_output_dir': "",
            'profile_recycle': {}
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
        try:
            if os.path.exists(CONFIG_PATH):
                with open(CONFIG_PATH, 'r', encoding='utf-8') as cfg:
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
            if hasattr(self, "_wd_get_profile_dir") and hasattr(self, "wd_profile_var"):
                profile_name = (self.wd_profile_var.get() or "Profile 1").strip()
                profile_dir = self._wd_get_profile_dir(profile_name)
                if not os.path.isdir(profile_dir):
                    profiles = self._get_all_profiles()
                    if profiles:
                        profile_name = profiles[0]
                        if hasattr(self, "wd_profile_var"):
                            self.wd_profile_var.set(profile_name)
                        profile_dir = self._wd_get_profile_dir(profile_name)
                self.browser_overlay.set_profile(profile_dir)
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
        
        # Lấy danh sách profiles và profile hiện tại
        profiles = self._get_all_profiles()
        current_profile = self._get_current_browser_profile()
        db_path = self._wd_get_cookie_db_path(current_profile)
        
        cookie_dir = os.path.dirname(db_path)
        if cookie_dir:
            os.makedirs(cookie_dir, exist_ok=True)
        
        self.cookie_window = CookieManagerWindow(
            self,
            db_path,
            on_close=self._on_cookie_window_closed,
            profiles=profiles,
            current_profile=current_profile,
            on_profile_change=self._on_cookie_profile_change
        )
        self._update_cookie_menu_state()

    def _get_all_profiles(self):
        """Lấy danh sách tất cả profiles."""
        profiles = []
        deleted = set()
        if hasattr(self, "_wd_get_deleted_profile_names"):
            deleted = self._wd_get_deleted_profile_names()
        try:
            default_dir = os.path.join(BASE_DIR, "qt_browser_profile")
            if os.path.isdir(default_dir):
                profiles.append("Profile 1")
            for name in os.listdir(BASE_DIR):
                full = os.path.join(BASE_DIR, name)
                if os.path.isdir(full) and name.startswith("qt_browser_profile_"):
                    pname = name.replace("qt_browser_profile_", "").replace("_", " ")
                    if pname and pname not in profiles and pname not in deleted:
                        profiles.append(pname)
            profiles.sort(key=lambda x: (0 if x == "Profile 1" else 1, x))
        except Exception:
            pass
        if "Profile 1" in deleted and "Profile 1" in profiles:
            profiles = [p for p in profiles if p != "Profile 1"]
        if not profiles:
            profiles = ["Profile 1"]
        return profiles

    def _get_current_browser_profile(self):
        """Lấy profile hiện tại của browser overlay, hoặc mặc định."""
        if hasattr(self, "browser_overlay") and self.browser_overlay and self.browser_overlay.profile_dir:
            # Trích xuất tên profile từ path
            profile_dir = self.browser_overlay.profile_dir
            dir_name = os.path.basename(profile_dir)
            if dir_name.startswith("qt_browser_profile_"):
                return dir_name.replace("qt_browser_profile_", "").replace("_", " ")
            elif dir_name == "qt_browser_profile":
                return "Profile 1"
        return "Profile 1"

    def _on_cookie_profile_change(self, profile_name: str) -> str:
        """Callback khi user đổi profile trong cửa sổ Cookie. Trả về db_path mới."""
        return self._wd_get_cookie_db_path(profile_name)

    def _on_cookie_window_closed(self):
        self.cookie_window = None
        self._update_cookie_menu_state()

    def _set_browser_menu_state(self, enabled: bool):
        state = tk.NORMAL if enabled else tk.DISABLED
        if getattr(self, "menubar", None):
            try:
                self.menubar.entryconfig(self.browser_menu_label, state=state)
            except tk.TclError:
                pass

    def _set_cookie_menu_state(self, enabled: bool):
        state = tk.NORMAL if enabled else tk.DISABLED
        if getattr(self, "menubar", None):
            try:
                self.menubar.entryconfig(self.cookie_menu_label, state=state)
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

    def _on_browser_headers(self, payload: dict):
        host = (payload or {}).get("host")
        headers = (payload or {}).get("headers") or {}
        if not host or not headers:
            return
        filtered = {k: v for k, v in headers.items() if k and v}
        if not filtered:
            return
        self._browser_headers[host] = filtered
        try:
            ua_logged = filtered.get("User-Agent") or filtered.get("user-agent")
            self.log(f"[BrowserSpy] Headers from {host}: UA='{ua_logged}' keys={list(filtered.keys())}")
        except Exception:
            pass
        for key, val in filtered.items():
            if key and val and key.lower() == "user-agent":
                self._browser_user_agent = val
                break

    def _on_browser_user_agent(self, ua: str):
        if ua:
            self._browser_user_agent = ua

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

    def _open_in_app_browser(self, url: str, force_overlay: bool = False):
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
        elif force_overlay:
            messagebox.showerror("Trình duyệt tích hợp", "Không khởi tạo được trình duyệt tích hợp (PyQt6 WebEngine).")
        else:
            webbrowser.open(url)

    def _open_source_selector(self):
        if getattr(self, "_source_selector_window", None):
            try:
                self._source_selector_window.focus_set()
                return
            except Exception:
                self._source_selector_window = None
        selector = tk.Toplevel(self)
        self._apply_window_icon(selector)
        selector.title("Chọn nguồn lấy mục lục")
        selector.geometry("520x340")
        selector.resizable(True, True)
        self._source_selector_window = selector

        def _cleanup():
            if getattr(self, "_source_selector_window", None):
                try:
                    self._source_selector_window.grab_release()
                except Exception:
                    pass
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
        if hasattr(self, "ui_settings_vars"):
            self.ui_settings_vars.get('use_classic_theme', tk.BooleanVar()).set(bool(self.ui_settings.get('use_classic_theme', False)))
            self.ui_settings_vars.get('mouse_glow', tk.BooleanVar()).set(bool(self.ui_settings.get('mouse_glow', False)))
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

    def _sync_background_controls(self):
        if hasattr(self, "bg_enable_var"):
            self.bg_enable_var.set(bool(self.background_settings.get('enable', False)))
        if hasattr(self, "bg_start_hidden_var"):
            self.bg_start_hidden_var.set(bool(self.background_settings.get('start_hidden', False)))

    def _update_background_settings(self, save=True, **changes):
        disable_requested = bool(changes.get('enable') is False) if changes else False
        if changes:
            for key, value in changes.items():
                if value is not None:
                    self.background_settings[key] = bool(value)
        if disable_requested:
            self._hidden_to_tray = False
            self._stop_tray_icon()
        if save:
            self.save_config()
        self._sync_background_controls()

    def _toggle_background_mode(self):
        desired = bool(self.bg_enable_var.get()) if hasattr(self, "bg_enable_var") else False
        if desired and pystray is None:
            messagebox.showerror("Thiếu thư viện", "Cần cài gói 'pystray' để dùng chế độ chạy ngầm.\nChạy lệnh: pip install pystray")
            if hasattr(self, "bg_enable_var"):
                self.bg_enable_var.set(False)
            desired = False
        if not desired:
            self.background_settings['start_hidden'] = False
            if hasattr(self, "bg_start_hidden_var"):
                self.bg_start_hidden_var.set(False)
        self._update_background_settings(enable=desired, save=True)

    def _toggle_start_hidden(self):
        desired = bool(self.bg_start_hidden_var.get()) if hasattr(self, "bg_start_hidden_var") else False
        if desired and not self.background_settings.get('enable'):
            messagebox.showinfo("Cần bật chạy ngầm", "Bật tùy chọn chạy ngầm trước khi chọn khởi động ẩn vào khay.")
            if hasattr(self, "bg_start_hidden_var"):
                self.bg_start_hidden_var.set(False)
            return
        if desired and pystray is None:
            messagebox.showerror("Thiếu thư viện", "Cần cài gói 'pystray' để dùng chế độ chạy ngầm.")
            if hasattr(self, "bg_start_hidden_var"):
                self.bg_start_hidden_var.set(False)
            return
        self._update_background_settings(start_hidden=desired, save=True)

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
        # Lưu dùng dấu gạch xuôi để tương thích đa nền tảng; khi đọc sẽ normpath lại
        rel_path = os.path.relpath(dest_path, BASE_DIR)
        return rel_path.replace("\\", "/")

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

    def _apply_window_icon(self, window):
        """Áp icon app cho cửa sổ con (Toplevel/Dialog)."""
        if not window:
            return
        try:
            if window is self:
                if self._app_icon_image:
                    window.iconphoto(False, self._app_icon_image)
                if self._icon_path and self._icon_path.lower().endswith(".ico"):
                    try:
                        window.iconbitmap(self._icon_path)
                    except Exception:
                        pass
                return

            if self._app_icon_image:
                # Giảm nháy: tạm withdraw, đặt icon, sau đó deiconify lại
                was_withdrawn = False
                try:
                    if window.state() != "withdrawn":
                        window.withdraw()
                    else:
                        was_withdrawn = True
                except Exception:
                    pass
                try:
                    window.iconphoto(False, self._app_icon_image)
                except Exception:
                    pass
                try:
                    if not was_withdrawn:
                        window.after(1, window.deiconify)
                except Exception:
                    pass
        except Exception:
            pass

    def _set_app_icon(self):
        """Đặt icon cửa sổ từ file icon*.ico/png (root hoặc thư mục icons)."""
        candidates = [
            os.path.join(BASE_DIR, "icon.ico"),
            os.path.join(BASE_DIR, "icons", "icon.ico"),
            os.path.join(BASE_DIR, "icon.png"),
            os.path.join(BASE_DIR, "icons", "icon.png"),
        ]
        icon_path = next((p for p in candidates if os.path.isfile(p)), None)
        if not icon_path:
            return
        try:
            self._icon_path = icon_path
            # Luôn chuẩn bị PhotoImage để dùng cho child windows (tránh nháy cửa sổ)
            loaded_image = None
            if icon_path.lower().endswith(".png"):
                loaded_image = tk.PhotoImage(file=icon_path)
            elif icon_path.lower().endswith(".ico"):
                try:
                    from PIL import Image
                    import io
                    with Image.open(icon_path) as pil_img:
                        pil_img = pil_img.convert("RGBA")
                        buf = io.BytesIO()
                        pil_img.save(buf, format="PNG")
                        buf.seek(0)
                        loaded_image = tk.PhotoImage(data=buf.read())
                except Exception:
                    loaded_image = None
            if loaded_image:
                self._app_icon_image = loaded_image
                try:
                    self.iconphoto(False, self._app_icon_image)
                except tk.TclError:
                    self.iconphoto(True, self._app_icon_image)
            if icon_path.lower().endswith(".ico"):
                # Giữ iconbitmap cho taskbar chính (root)
                try:
                    self.iconbitmap(icon_path)
                except Exception:
                    pass
        except Exception as exc:
            try:
                self.log(f"Không thể đặt icon cửa sổ: {exc}")
            except Exception:
                pass

    def _build_tray_image(self):
        accent = self.ui_settings.get('accent_color', '#6366f1')
        primary = _hex_to_rgb(accent)
        highlight = _hex_to_rgb(_adjust_color_luminance(accent, 0.18), primary)
        img = Image.new("RGBA", (64, 64), (*primary, 255))
        draw = ImageDraw.Draw(img)
        draw.rectangle((6, 10, 58, 54), fill=(*highlight, 235), outline=(255, 255, 255, 40), width=2)
        font = ImageFont.load_default()
        text = "RC"
        try:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_w = bbox[2] - bbox[0]
            text_h = bbox[3] - bbox[1]
        except Exception:
            text_w, text_h = draw.textsize(text, font=font)
        draw.text(((64 - text_w) / 2, (64 - text_h) / 2), text, font=font, fill=(255, 255, 255, 255))
        return img

    def _load_tray_image_from_disk(self):
        """Tìm icon người dùng cung cấp nếu có (icon.ico/png...)."""
        candidates = [
            os.path.join(BASE_DIR, "icon.png"),
            os.path.join(BASE_DIR, "icon.ico"),
            os.path.join(BASE_DIR, "icons", "icon.png"),
            os.path.join(BASE_DIR, "icons", "icon.ico"),
            os.path.join(BASE_DIR, "icons", "tray.png"),
        ]
        for path in candidates:
            if os.path.isfile(path):
                try:
                    return Image.open(path).convert("RGBA")
                except Exception:
                    continue
        return None

    def _prepare_tray_image(self, image: Image.Image, size: int = 32) -> Image.Image:
        """Đảm bảo icon khay kích thước nhỏ, định dạng RGBA."""
        if not image:
            return None
        try:
            img = image.convert("RGBA")
            if img.size != (size, size):
                img = img.resize((size, size), Image.LANCZOS)
            return img
        except Exception:
            return None

    def _pick_tray_image(self):
        """Chọn icon khay: ưu tiên icon người dùng, fallback icon RC."""
        fallback = self._build_tray_image()
        disk_img = self._load_tray_image_from_disk()
        if disk_img:
            try:
                return self._prepare_tray_image(disk_img)
            except Exception:
                pass
        return self._prepare_tray_image(fallback)

    def _ensure_tray_icon(self):
        if self._tray_icon:
            return True
        if pystray is None:
            messagebox.showerror("Thiếu thư viện", "Cần cài gói 'pystray' để dùng khay hệ thống.\nChạy lệnh: pip install pystray")
            return False
        try:
            image = self._pick_tray_image()
            if image is None:
                raise ValueError("Không tạo được icon khay (thiếu pillow ICO encoder?). Thêm file icon.png hoặc cài lại Pillow.")
            menu = pystray.Menu(
                pystray.MenuItem("Mở cửa sổ", lambda _icon, _item: self.after(0, self._restore_from_tray), default=True),
                pystray.MenuItem("Thoát", lambda _icon, _item: self.after(0, self._exit_from_tray))
            )
            self._tray_image = image
            self._tray_icon = pystray.Icon(
                "rename_chapters",
                image=image.copy(),
                title=f"Rename Chapters v{self.CURRENT_VERSION}",
                menu=menu
            )
            # Explicitly set icon once to ensure driver has data before run()
            self._tray_icon.icon = image.copy()

            def _run_tray():
                try:
                    self._tray_icon.run()
                except Exception as exc:
                    self.after(0, lambda: self._handle_tray_failure(exc))

            self._tray_icon_thread = threading.Thread(target=_run_tray, daemon=True)
            self._tray_icon_thread.start()
            return True
        except Exception as exc:
            self._tray_icon = None
            self._tray_image = None
            self._tray_icon_thread = None
            self.log(f"Không thể khởi tạo khay hệ thống: {exc}")
            messagebox.showerror("Lỗi khay hệ thống", f"Không thể bật chạy ngầm: {exc}")
            return False

    def _hide_to_tray(self, show_message=True, close_on_fail=False):
        if self._hidden_to_tray:
            return
        if not self._ensure_tray_icon():
            if close_on_fail:
                self._perform_exit()
            return
        try:
            if hasattr(self, "browser_overlay") and self.browser_overlay:
                self.browser_overlay.hide()
        except Exception:
            pass
        self.withdraw()
        self._hidden_to_tray = True
        if show_message:
            self.log("Ứng dụng đang chạy ngầm ở khay hệ thống. Nhấp biểu tượng để mở lại hoặc chọn Thoát.")

    def _restore_from_tray(self, _icon=None, _item=None):
        def _do_restore():
            if self._hidden_to_tray:
                self.deiconify()
                self._hidden_to_tray = False
                try:
                    self.lift()
                    self.focus_force()
                except Exception:
                    pass
        self.after(0, _do_restore)

    def _exit_from_tray(self, _icon=None, _item=None):
        self._force_exit = True
        self.after(0, self.on_closing)

    def _stop_tray_icon(self):
        icon = getattr(self, "_tray_icon", None)
        if icon:
            try:
                icon.stop()
            except Exception:
                pass
        if getattr(self, "_tray_icon_thread", None):
            try:
                self._tray_icon_thread.join(timeout=1)
            except Exception:
                pass
        self._tray_icon = None
        self._tray_icon_thread = None
        self._tray_image = None
        self._hidden_to_tray = False

    def _start_single_instance_listener(self):
        # Nếu đã có socket (từ ensure_single_instance_or_exit) thì dùng lại
        if self._instance_server is None:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                sock.bind((_SINGLE_INSTANCE_HOST, _SINGLE_INSTANCE_PORT))
                sock.listen(1)
                self._instance_server = sock
            except Exception:
                self._instance_server = None
                return
        if self._instance_thread:
            return

        def _listen():
            while self._instance_server:
                try:
                    conn, _addr = self._instance_server.accept()
                except OSError:
                    break
                with conn:
                    try:
                        data = conn.recv(32)
                        if data and data.strip().upper() == b"SHOW":
                            self.after(0, self._restore_from_tray)
                    except Exception:
                        pass

        self._instance_thread = threading.Thread(target=_listen, daemon=True)
        self._instance_thread.start()

    def _extract_archive_to(self, archive_path: str, dest_path: str):
        """Giải nén bằng thư viện chuẩn; fallback 7-Zip cho .7z/.rar."""
        os.makedirs(dest_path, exist_ok=True)
        try:
            shutil.unpack_archive(archive_path, dest_path)
            return
        except (shutil.ReadError, ValueError):
            pass

        ext = os.path.splitext(archive_path)[1].lower()
        if ext == ".gz":
            try:
                base_name = os.path.basename(os.path.splitext(archive_path)[0]) or os.path.basename(archive_path)
                target_path = os.path.join(dest_path, base_name)
                with gzip.open(archive_path, "rb") as src, open(target_path, "wb") as dst:
                    shutil.copyfileobj(src, dst)
                return
            except Exception as exc:
                raise RuntimeError(f"Lỗi giải nén .gz: {exc}")

        if ext in {".7z", ".rar"}:
            seven_zip = shutil.which("7z") or shutil.which("7za")
            if not seven_zip:
                raise RuntimeError("Cần sẵn 7-Zip (7z/7za trong PATH) để giải nén .7z/.rar.")
            result = subprocess.run(
                [seven_zip, "x", archive_path, f"-o{dest_path}", "-y"],
                capture_output=True,
                text=True
            )
            if result.returncode != 0:
                err_output = (result.stderr or result.stdout or "").strip()
                raise RuntimeError(err_output or "Lệnh 7z thất bại.")
            return

        raise RuntimeError(f"Không hỗ trợ định dạng nén: {ext or 'không xác định'}")

    def _stop_single_instance_listener(self):
        sock = getattr(self, "_instance_server", None)
        if sock:
            try:
                sock.close()
            except Exception:
                pass
        self._instance_server = None
        self._instance_thread = None

    def _cleanup_temp_extraction(self):
        """Xóa thư mục tạm _MEI* nếu còn (onefile) để tránh rác khi lỗi."""
        candidates = set()
        mei = getattr(sys, "_MEIPASS", None)
        if mei:
            candidates.add(mei)
        env_mei = os.environ.get("_MEIPASS2")
        if env_mei:
            candidates.add(env_mei)
        for path in candidates:
            try:
                if path and os.path.isdir(path):
                    shutil.rmtree(path, ignore_errors=True)
            except Exception:
                pass
        self._cleanup_leftover_mei_dirs()

    def _cleanup_leftover_mei_dirs(self):
        """Xóa các thư mục _MEI* còn sót (PyInstaller tạm) trong app và thư mục TEMP hệ thống."""
        roots = [BASE_DIR]
        try:
            import tempfile
            temp_root = tempfile.gettempdir()
            if temp_root and os.path.isdir(temp_root):
                roots.append(temp_root)
        except Exception:
            pass
        for root in roots:
            try:
                for name in os.listdir(root):
                    if not name.startswith("_MEI"):
                        continue
                    path = os.path.join(root, name)
                    if os.path.isdir(path):
                        shutil.rmtree(path, ignore_errors=True)
            except Exception:
                pass

    def _cleanup_auto_update_temp(self):
        """Xóa thư mục tạm dùng cho Auto update Fanqie."""
        root = getattr(self, "_auto_update_temp_root", None)
        if not root:
            return
        try:
            if os.path.isdir(root):
                shutil.rmtree(root, ignore_errors=True)
        except Exception:
            pass

    def _handle_tray_failure(self, exc):
        self.log(f"Lỗi khay hệ thống: {exc}")
        try:
            messagebox.showerror("Khay hệ thống", f"Không thể bật chạy ngầm: {exc}")
        except Exception:
            pass
        self._update_background_settings(enable=False, start_hidden=False, save=True)
        self._stop_tray_icon()
        try:
            self.deiconify()
            self.lift()
        except Exception:
            pass

    def _maybe_start_hidden(self):
        if self.background_settings.get('enable') and self.background_settings.get('start_hidden'):
            self.after(500, lambda: self._hide_to_tray(show_message=False))

    def _perform_exit(self):
        if hasattr(self, "browser_overlay") and self.browser_overlay:
            try:
                self.browser_overlay.hide()
            except Exception:
                pass
        self._stop_tray_icon()
        self._detach_mouse_glow()
        self._stop_single_instance_listener()
        self._cleanup_temp_extraction()
        self._stop_fanqie_bridge()
        self._fanqie_clear_progress_cache()
        self._cleanup_leftover_mei_dirs()
        self._cleanup_auto_update_temp()
        _release_single_instance_mutex()
        try:
            self.destroy()
        except Exception:
            pass

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
                    self._force_exit = False
                    return
            elif response is None:
                self._force_exit = False
                return
        if hasattr(self, "_image_ai_clear_cache"):
            try:
                self._image_ai_clear_cache()
            except Exception:
                pass
        self.save_config()
        if self.background_settings.get('enable') and not self._force_exit:
            self._hide_to_tray(close_on_fail=True)
            return
        self._perform_exit()

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
            'background': dict(self.background_settings),
            'wikidich_notes': dict(self.wikidich_notes or {}),
            'wikidich_links': dict(self.wikidich_links or {}),
            'wd_not_found': list(self.wd_not_found or []),
            'novel_downloader5': dict(self.nd5_options or {}),
        })
        self.app_config['ui_settings'] = self.ui_settings
        if hasattr(self, "wd_search_var"):
            self._wd_collect_advanced_filter_values()
            # Update store for current site before saving
            current_site = getattr(self, "wd_site", "wikidich")
            if hasattr(self, "_wd_filters_store") and hasattr(self, "wikidich_filters"):
                self._wd_filters_store[current_site] = dict(self.wikidich_filters)

        # Dùng Controllers mới để save config
        if hasattr(self, "_wd_controllers"):
            # Collect filter values từ view hiện tại trước khi save
            current_site = getattr(self, "wd_site", "wikidich")
            
            if current_site in self._wd_controllers:
                ctrl = self._wd_controllers[current_site]
                ctrl.collect_filters_from_view()
            
            # Save cả 2 sites từ Controllers
            wd_config = self._wd_controllers["wikidich"].save_to_config()
            kc_config = self._wd_controllers["koanchay"].save_to_config()
            self.app_config['wikidich'] = wd_config
            self.app_config['koanchay'] = kc_config
        self.app_config['api_settings'] = dict(self.api_settings or {})
        self.app_config['wikidich_upload_settings'] = dict(self.wikidich_upload_settings or {})
        if hasattr(self, "profile_recycle"):
            self.app_config['profile_recycle'] = dict(self.profile_recycle or {})
        self.app_config['regex_pins'] = dict(self.regex_pins)
        try:
            with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
                json.dump(self.app_config, f, indent=4)
        except Exception as e:
            print(f"Không thể lưu config: {e}")

    # main_ui.py

    def load_config(self):
        """Tải và áp dụng cài đặt từ config.json nếu có."""
        try:
            if os.path.exists(CONFIG_PATH):
                with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
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
            # Luôn dùng header mặc định/bắt từ trình duyệt, bỏ User-Agent tùy chỉnh cũ
            self.api_settings['wiki_headers'] = dict(DEFAULT_API_SETTINGS['wiki_headers'])
            self.api_settings['fanqie_headers'] = dict(DEFAULT_API_SETTINGS['fanqie_headers'])
            if 'auto_credit' not in self.api_settings:
                self.api_settings['auto_credit'] = True
            upload_cfg = config_data.get('wikidich_upload_settings', {}) if isinstance(config_data.get('wikidich_upload_settings'), dict) else {}
            self.wikidich_upload_settings = {**DEFAULT_UPLOAD_SETTINGS, **upload_cfg}
            self.wd_not_found = list(config_data.get('wd_not_found', []) or [])
            recycle_cfg = config_data.get('profile_recycle', {})
            self.profile_recycle = dict(recycle_cfg) if isinstance(recycle_cfg, dict) else {}
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

            # Load wikidich notes & links
            self.wikidich_notes = dict(config_data.get('wikidich_notes', {}) or {})
            self.wikidich_links = dict(config_data.get('wikidich_links', {}) or {})

            wd_cfg = config_data.get('wikidich', {})
            if isinstance(wd_cfg, dict):
                self.wikidich_cache_path = wd_cfg.get('cache_path', self.wikidich_cache_path)
                self.wikidich_open_mode = wd_cfg.get('open_mode', self.wikidich_open_mode)
                self.wikidich_auto_pick_mode = wd_cfg.get('auto_pick_mode', getattr(self, "wikidich_auto_pick_mode", "extract_then_pick"))
                adv_filter = wd_cfg.get('advanced_filter')
                if isinstance(adv_filter, dict):
                    self.wikidich_filters.update(adv_filter)
                self._wd_cache_paths["wikidich"] = self.wikidich_cache_path
                self._wd_cache_paths["koanchay"] = self._wd_cache_paths.get("koanchay") or os.path.join(BASE_DIR, "local", "koanchay_cache.json")
            
            # Update _wd_filters_store for both sites from config to ensure persistence
            if hasattr(self, "_wd_filters_store"):
                wd_adv = config_data.get('wikidich', {}).get('advanced_filter', {})
                kc_adv = config_data.get('koanchay', {}).get('advanced_filter', {})
                if isinstance(wd_adv, dict):
                    self._wd_filters_store["wikidich"] = dict(wd_adv)
                if isinstance(kc_adv, dict):
                    self._wd_filters_store["koanchay"] = dict(kc_adv)
                # Also update current wikidich_filters if we're on wikidich site
                current_site = getattr(self, "wd_site", "wikidich")
                if current_site in self._wd_filters_store:
                    self.wikidich_filters = dict(self._wd_filters_store[current_site])
            
            # NEW: Load config vào Controllers mới nếu có
            if hasattr(self, "_wd_controllers"):
                wd_cfg = config_data.get('wikidich', {})
                kc_cfg = config_data.get('koanchay', {})
                self._wd_controllers["wikidich"].load_from_config(wd_cfg)
                self._wd_controllers["koanchay"].load_from_config(kc_cfg)
            
            if hasattr(self, "wd_search_var"):
                self.wd_search_var.set(self.wikidich_filters.get('search', ''))
                self.wd_summary_var.set(self.wikidich_filters.get('summarySearch', ''))
                if hasattr(self, "wd_extra_link_var"):
                    self.wd_extra_link_var.set(self.wikidich_filters.get('extraLinkSearch', ''))
                self.wd_status_var.set(self.wikidich_filters.get('status', 'all'))
                self._wd_set_sort_label_from_value(self.wikidich_filters.get('sortBy', 'recent'))
            self._wd_sync_filter_controls_from_filters()
            if hasattr(self, "_wd_sync_profile_for_startup"):
                self._wd_sync_profile_for_startup()
            self._wd_load_cache()

            if self.folder_path.get(): self.schedule_preview_update()
            self.selected_file.set(config_data.get('selected_file', ''))
            bg_cfg = config_data.get('background', {})
            if isinstance(bg_cfg, dict):
                self.background_settings.update(DEFAULT_BACKGROUND_SETTINGS)
                self.background_settings.update(bg_cfg)
            else:
                self.background_settings = dict(DEFAULT_BACKGROUND_SETTINGS)
            ui_settings = config_data.get('ui_settings')
            if isinstance(ui_settings, dict):
                self.ui_settings.update(ui_settings)
                self._apply_modern_theme(refresh_existing=True)
                self._sync_ui_settings_controls()
                self._apply_mouse_glow_setting()
            self.app_config['api_settings'] = dict(self.api_settings)
            self._sync_background_controls()
            self.wikidich_notes = self._wd_normalize_notes(config_data.get('wikidich_notes'))
            self.wikidich_links = dict(config_data.get('wikidich_links', {}))
            nd5_cfg = config_data.get('novel_downloader5', {})
            if isinstance(nd5_cfg, dict):
                self.nd5_options = {**DEFAULT_ND5_OPTIONS, **nd5_cfg}
            if hasattr(self, "wd_auto_mode_var"):
                label = None
                if hasattr(self, "_wd_mode_labels"):
                    label = self._wd_mode_labels.get(getattr(self, "wikidich_auto_pick_mode", "extract_then_pick"))
                self.wd_auto_mode_var.set(label or getattr(self, "wikidich_auto_pick_mode", "extract_then_pick"))
            if hasattr(self, "_wd_cleanup_profile_recycle"):
                self._wd_cleanup_profile_recycle()
            self._maybe_start_hidden()
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
        tools_menu.add_command(label="Download Novel 5...", command=self._open_fanqie_downloader)
        tools_menu.add_command(label="Kiểm tra Radical...", command=lambda: open_radical_checker_dialog(self))
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
        help_menu.add_command(label="Xóa cache ảnh bìa...", command=self._clear_cover_cache_dialog)
        help_menu.add_separator()
        help_menu.add_command(label="Kiểm tra cập nhật...", command=lambda: self.check_for_updates(manual_check=True))

        self.folder_frame = ttk.LabelFrame(main_frame, text="1. Chọn thư mục", padding="12", style="Section.TLabelframe")
        self.folder_frame.pack(fill=tk.X, expand=False, pady=(0, 8))
        
        ttk.Entry(self.folder_frame, textvariable=self.folder_path, state="readonly").pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 8))
        ttk.Button(self.folder_frame, text="Chọn...", command=self.select_folder).pack(side=tk.LEFT)

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
        self.create_image_processing_tab()
        self.create_wikidich_tab()
        self.create_settings_tab()

        log_frame = ttk.LabelFrame(self.main_paned_window, text="Nhật ký hoạt động", padding="8", style="Section.TLabelframe")
        self.log_text = scrolledtext.ScrolledText(log_frame, height=3, state='disabled', wrap=tk.WORD)
        if not classic_theme:
            self.log_text.configure(bg=colors.get("input_bg", "#111a32"), fg=colors.get("text", "#f5f7ff"),
                                    insertbackground=colors.get("accent", "#6366f1"), highlightthickness=1,
                                    highlightbackground=colors.get("border", "#273553"), relief=tk.FLAT, bd=0)
        self.log_text.pack(fill=tk.BOTH, expand=True)
        self._flush_pending_logs()
        self.main_paned_window.add(log_frame, weight=0)
        self._apply_mouse_glow_setting()
        self._apply_background_image()
        self.browser_overlay = BrowserOverlay(self)
        if not self.browser_overlay.available():
            self._set_browser_menu_state(False)
        self._update_cookie_menu_state()

    # ==== Logging util ====
    def log(self, message):
        text = "" if message is None else str(message)
        try:
            logs_dir = os.path.join(BASE_DIR, "logs")
            os.makedirs(logs_dir, exist_ok=True)
            now = datetime.now()
            log_path = os.path.join(logs_dir, f"{now:%Y-%m-%d}.log")
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(f"[{now:%H:%M:%S}] {text}\n")
            last_cleanup = getattr(self, "_last_log_cleanup", 0)
            if time.time() - last_cleanup > 3600:
                self._cleanup_old_logs(logs_dir)
                self._last_log_cleanup = time.time()
        except Exception:
            pass
        widget = getattr(self, "log_text", None)
        if not widget:
            pending = getattr(self, "_pending_logs", None)
            if pending is None:
                self._pending_logs = []
            self._pending_logs.append(text)
            print(text)
            return
        widget.config(state='normal')
        widget.insert(tk.END, text + "\n")
        widget.see(tk.END)
        widget.config(state='disabled')

    def _flush_pending_logs(self):
        pending = getattr(self, "_pending_logs", None)
        widget = getattr(self, "log_text", None)
        if not pending or not widget:
            return
        widget.config(state='normal')
        for text in pending:
            widget.insert(tk.END, text + "\n")
        widget.see(tk.END)
        widget.config(state='disabled')
        self._pending_logs = []

    def _cleanup_old_logs(self, logs_dir: str):
        """Xóa log cũ hơn 30 ngày để tránh phình ổ đĩa."""
        try:
            cutoff = time.time() - 30 * 24 * 3600
            for name in os.listdir(logs_dir):
                if not name.endswith(".log"):
                    continue
                path = os.path.join(logs_dir, name)
                try:
                    if os.path.getmtime(path) < cutoff:
                        os.remove(path)
                except Exception:
                    continue
        except Exception:
            pass

    def show_regex_guide(self, guide_type="rename"):
        """Hiển thị hướng dẫn Regex chi tiết (multi-tab)."""
        help_window = tk.Toplevel(self)
        self._apply_window_icon(help_window)
        help_window.title("Hướng dẫn sử dụng Regex")
        help_window.geometry("700x600")

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
- Tìm:    \"(.*?)\"
- Thay:   『$1』
- Giải thích: Dấu \" bên ngoài tìm ngoặc kép. '(.*?)' bắt tất cả nội dung bên trong một cách 'lười biếng' (lazy) để nó dừng lại ở dấu \" gần nhất. $1 chèn lại nội dung đó.

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

    def _clear_cover_cache_dialog(self):
        """Hiển thị hộp thoại xác nhận và xóa cache ảnh bìa."""
        cache_size = self._wd_get_cover_cache_size()
        if cache_size < 1024:
            size_str = f"{cache_size} bytes"
        elif cache_size < 1024 * 1024:
            size_str = f"{cache_size / 1024:.1f} KB"
        else:
            size_str = f"{cache_size / (1024 * 1024):.2f} MB"
        
        msg = f"Dung lượng cache ảnh bìa hiện tại: {size_str}\n\nBạn có muốn xóa toàn bộ cache không?"
        if messagebox.askyesno("Xóa cache ảnh bìa", msg):
            self._wd_clear_cover_cache()
            messagebox.showinfo("Hoàn tất", "Đã xóa cache ảnh bìa.")

    def show_operation_guide(self):
        guide_win = tk.Toplevel(self)
        self._apply_window_icon(guide_win)
        guide_win.title("Hướng dẫn thao tác")
        guide_win.geometry("800x650")

        main_frame = ttk.Frame(guide_win, padding="15")
        main_frame.pack(fill="both", expand=True)

        selector_frame = ttk.Frame(main_frame)
        selector_frame.pack(fill="x", pady=(0, 5))
        ttk.Label(selector_frame, text="Chọn mục:", padding=(0, 0, 8, 0)).pack(side=tk.LEFT)
        tab_selector = ttk.Combobox(selector_frame, state="readonly")
        tab_selector.pack(side=tk.LEFT, fill="x", expand=True)

        guide_text = scrolledtext.ScrolledText(main_frame, wrap=tk.WORD, padx=10, pady=10)
        guide_text.pack(fill="both", expand=True, pady=(0, 10))

        tabs_meta = []

        def create_tab(title, content):
            tabs_meta.append((title, textwrap.dedent(content).strip()))

        browser_guide = """
        --- TRÌNH DUYỆT ---
        - Mở tab mới: bấm nút “+” hoặc phím tắt (nếu có).
        - Nút Script: xem menu userscript, bấm để chạy menu command.
        - Thanh địa chỉ: gợi ý URL/phổ biến; chọn gợi ý sẽ tự load trang.
        - Tabs: click để chuyển, click nút “x” để đóng; có tab ẩn auto đóng khi cần.
        - DevTools: nút F12 để bật/tắt.
        - Tải xuống: nút ⬇ mở danh sách download, có thể hủy/tải lại/mở file/thư mục/copy link; trạng thái được lưu lại khi mở lại app.
        - Profile: menu Trình duyệt cho phép đổi tên/xóa/khôi phục. Khi thao tác, app sẽ tự đóng trình duyệt trước để tránh khóa file rồi mở lại.
        - Profile đã xóa sẽ ẩn khỏi danh sách chính; muốn xem/khôi phục thì dùng mục Khôi phục.
        - Nếu xóa profile có cache Wikidich/Koanchay, cache sẽ chuyển vào `local/profile_recycle/<profile>` và tự xóa sau 7 ngày. Nếu profile không có cache thì xóa vĩnh viễn.
        - Khi tạo profile mới trùng tên profile cũ có cache, app sẽ hỏi có phục hồi hay không.
        """
        create_tab("Trình duyệt", browser_guide)

        cookie_guide = """
        --- COOKIE ---
        - Menu Trình duyệt → Cookie: mở trình quản lý cookie.
        - Mặc định mở theo profile của trình duyệt tích hợp đang dùng; có combobox để chọn profile khác.
        - Cho phép nhập/xóa cookie cho các domain, hỗ trợ tải cookie từ trình duyệt hệ thống nếu đã đăng nhập.
        - Khi cần đăng nhập trang bảo vệ, mở trình duyệt tích hợp, đăng nhập, đóng trình duyệt rồi dùng cookie đã lưu cho các request/tải về.
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

        **2. Kiểm tra Radical**:
        -   **Chức năng**: Quét file .txt để tìm ký tự thuộc Radical block và chuẩn hóa.
        -   **Cách dùng**:
            1.  Vào menu **Công cụ -> Kiểm tra Radical...** rồi chọn 1 hoặc nhiều file .txt.
            2.  App tự kiểm tra và chia ra 3 nhóm: **NFKC tự chuyển**, **MAP đã có**, **cần nhập thủ công**.
            3.  Dùng nút **Sao chép** để lấy mẫu JSON (có chú thích), điền vào `value`, rồi **Dán** lại để áp dụng.
            4.  Chọn **Thư mục xuất** nếu muốn lưu riêng; bấm **Chuẩn hóa file** để tạo `.normalized.txt`.
        """
        create_tab("Công cụ", tools_guide)

        wikidich_guide = """
        --- WIKIDICH / KOANCHAY ---
        - **Tải Works / Tải chi tiết**: dùng cookie từ trình duyệt tích hợp. Khi bị Cloudflare sẽ tạm dừng và **resume theo từng site**, kể cả sau khi mở lại app (thao tác lại Tải Works/Tải chi tiết). Koanchay tự dùng domain koanchay.org/net.
        - **Works không chính chủ**: Sync ▾ → “Tải Works (không chính chủ)” (nhập URL/user_id). Chỉ chạy khi profile trống hoặc đang dùng Works không chính chủ; sẽ tắt “Chỉ đồng bộ số chương”, ẩn Auto Update/Chỉnh sửa/Cập nhật chương và ẩn khu Liên kết.
        - **DS Chương cho Works không chính chủ**: app sẽ tự lấy `bookId` thật trước khi tải danh sách chương.
        - **Cache theo profile**: mỗi profile có cache riêng; xóa profile có cache sẽ được chuyển vào `profile_recycle` và tự dọn sau 7 ngày.
        - **Cache ảnh bìa**: ảnh bìa được lưu xuống `local/cover_cache/`. Menu Trợ giúp → “Xóa cache ảnh bìa...” để xem dung lượng và dọn.
        - **Lọc cơ bản & nâng cao**: Tên/Tác giả, Văn án, Link bổ sung; trạng thái và sắp xếp. Lọc nâng cao có ngày cập nhật, thể loại, vai trò, thuộc tính Nhúng link/file; có nút Đặt lại.
        - **DS Chương**: tải danh sách chương mới nhất (đồng thời cập nhật chi tiết/số chương), xem nội dung gộp các phần, sửa nội dung ngay trong app (PUT lên server). Koanchay tự dùng domain đúng và tự trừ cột “New”.
        - **Mô tả bổ sung mặc định** (Cài đặt request): hỗ trợ `{num-d}`/`{num-c}` (tương đương `{num-đầu}`/`{num-cuối}`) để điền số chương đầu/cuối của batch đã parse khi upload thủ công.
        - **Ghi chú & Liên kết**: Ghi chú cục bộ + toàn cục (lưu trong config). Liên kết thư mục per‑truyện + toàn cục, có “Chọn tự động” (giải nén rồi chọn / chọn thư mục mới nhất) và nút “Mở thư mục...”.
        - **Thêm vào thư viện**: trong trang truyện, bấm “Thêm vào thư viện” để chọn một hoặc nhiều thư viện muốn lưu.
        - **Thêm link hỗ trợ**: thêm link Fanqie/JJWXC/PO18/Qidian/Ihuaben vào trang sửa truyện rồi tải chi tiết/kiểm tra cập nhật để đồng bộ.
        - **Cập nhật chương**: nút chỉ sáng khi có “New”; nhập số để cộng tổng chương và trừ cột “New”. Sai lệch có thể tải lại chi tiết/DS Chương để đồng bộ.
        - **Auto update**: chỉ khi có link Fanqie, app tự bật bridge, tải mục lục, tạo file bổ sung, thêm Credit (nếu bật) rồi mở upload đã điền sẵn.
        - **Proxy**: bật “Wikidich/Fanqie” trong tab Proxy để áp dụng cho Works/Chi tiết/Check cập nhật; Koanchay dùng cùng cấu hình.
        """
        create_tab("Wikidich", wikidich_guide)

        nd5_guide = """
        --- NOVEL DOWNLOADER 5 (ND5) ---
        - Mở từ menu **Công cụ → Download Novel 5...** (cửa sổ riêng, không chặn UI).
        - ND5 hỗ trợ **plugin** do người dùng cài. Chọn nguồn ở combo “Nguồn”, có nút **Cài đặt** góc phải để mở cấu hình.
        - **Cài đặt ND5**: chỉnh template tiêu đề, tên file, delay/timeout/retry; quản lý **Kho plugin** (thêm link list, tải danh sách, cài/cập nhật), và **Plugin đã cài** (xem/gỡ/cập nhật).
        - Nhập URL, bấm **Lấy thông tin**: ND5 sẽ kiểm tra URL có khớp nguồn không; nếu không khớp sẽ tự đổi nguồn phù hợp hoặc hỏi có tiếp tục dùng nguồn hiện tại. Khi không có plugin phù hợp, có thể mở **Cài đặt** để thêm plugin.
        - Thông tin truyện hiển thị **ảnh bìa**, **chi tiết**, **trạng thái**; link ảnh bìa nằm trước mục lục để dễ copy.
        - Nếu plugin có cờ VIP, mục lục sẽ đánh dấu **[VIP]**. ND5 ưu tiên tải VIP bằng hàm riêng và sẽ báo nếu thiếu giá trị bổ sung (token/cookie...).
        - Nút **Giá trị bổ sung**: nhập các biến mà plugin yêu cầu (token/cookie/tuỳ chọn).
        - **Phạm vi tải**: hỗ trợ nhiều phần bằng dấu `,` (bỏ qua khoảng trắng). `-5` = từ 1→5, `10-` = từ 10→hết, `7-8`/`15` là khoảng/điểm. Các khoảng chồng nhau sẽ tự gộp.
        - Bấm **Bắt đầu tải**: tải theo batch do plugin quy định, thêm tiêu đề vào file (nếu chọn), lưu zip/txt/epub.
        - Một số nguồn cần bridge; app tự bật/kiểm tra. Tiến độ tải được cache để resume nếu ngắt giữa chừng.
        - Auto update trong tab Wikidich dùng cùng bridge/nguồn tương ứng và tái sử dụng credit/tùy chọn từ đây.
        """
        create_tab("Novel Downloader 5", nd5_guide)

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
            -   **Double-click vào một dòng**: Mở cửa sổ xem nhanh nội dung file kèm nút **Đổi tên** để đặt tên thủ công; lưu xong sẽ tự làm mới bảng đổi tên.
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
            -   **Cookie profile**: chọn profile cookie để dùng khi tải dữ liệu; có thể đổi nhanh giữa các profile.
            -   **URL mục lục**: Dán đường link của trang mục lục truyện vào đây.
            -   **Bắt đầu lấy dữ liệu**: Nhấn để chương trình truy cập URL và lấy về danh sách chương.
            -   **Reset profile**: Ngay lập tức cập nhận combox theo danh sách profile mới nhất.
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
            2.  **Regex file Mục lục**: Nhập mẫu để đọc mục lục. Cần có một **nhóm bắt (...)** để xác định đâu là tag chương (ví dụ: `(第\\d+章)` sẽ bắt `第123章`).
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

        3.  **Tăng cường AI & Lưu ảnh**:
            -   **Mở tăng cường AI**: bấm nút để hiện khối AI (mặc định ẩn).
            -   **Cài tool & Quản lý model**: nếu chưa có tool/model thì bấm cài hoặc vào **Quản lý** để tải model.
            -   **Chọn model**: xem mô tả để chọn đúng loại ảnh cần xử lý.
            -   **Tham số**: chỉnh Tile/Pad/Pre pad; **Reset mặc định** để quay về thông số gốc. Scale cố định 4x.
            -   **Áp dụng**: chạy tăng cường AI, theo dõi trạng thái ở nhãn thông báo.
            -   **Hoàn tác về gốc**: quay lại ảnh ban đầu.
            -   **Giảm kích thước**: giảm theo % hoặc theo kích thước (W/H), có tùy chọn giữ tỉ lệ.
            -   **Lưu ảnh...**: chọn định dạng rồi lưu ảnh đã xử lý.
        """
        create_tab("Xử lý Ảnh", image_guide)

        tab_selector['values'] = [title for title, _content in tabs_meta]
        if tabs_meta:
            tab_selector.current(0)
            self._render_markdown_guide(guide_text, tabs_meta[0][1])

        def on_select_combo(event=None):
            idx = tab_selector.current()
            if 0 <= idx < len(tabs_meta):
                self._render_markdown_guide(guide_text, tabs_meta[idx][1])

        tab_selector.bind("<<ComboboxSelected>>", on_select_combo)

        close_button = ttk.Button(main_frame, text="Đóng", command=guide_win.destroy)
        close_button.pack()

    def _render_markdown_guide(self, text_widget, markdown_text):
        """Render markdown đơn giản (heading dạng ---...---, bold **...**)."""
        text_widget.config(state='normal')
        text_widget.delete('1.0', tk.END)
        markdown_text = markdown_text.replace("\r\n", "\n").replace("\r", "\n")

        base_font = tkfont.Font(font=text_widget.cget("font"))
        bold_font = tkfont.Font(font=base_font)
        bold_font.configure(weight='bold')
        heading_font = tkfont.Font(font=base_font)
        heading_font.configure(size=base_font.cget('size') + 2, weight='bold')

        text_widget.tag_configure('bold', font=bold_font)
        text_widget.tag_configure('heading', font=heading_font, foreground="#0b5394", spacing1=5, spacing3=10)

        tag_regex = re.compile(r'^[ \t]*---(.*?)---[ \t]*$|\*\*(.*?)\*\*', re.MULTILINE)
        last_end = 0

        for match in tag_regex.finditer(markdown_text):
            text_widget.insert(tk.END, markdown_text[last_end:match.start()])

            if match.group(1) is not None:
                content = match.group(1).strip()
                text_widget.insert(tk.END, content + "\n", 'heading')
            elif match.group(2) is not None:
                content = match.group(2)
                text_widget.insert(tk.END, content, 'bold')

            last_end = match.end()

        text_widget.insert(tk.END, markdown_text[last_end:])
        text_widget.config(state='disabled')

    def _on_notebook_tab_changed(self, event=None):
        """Ẩn/hiện khung chọn thư mục và đồng bộ khi chuyển tab."""
        try:
            tab_id = self.notebook.select()
            tab_text = self.notebook.tab(tab_id, 'text')

            if hasattr(self, 'folder_frame'):
                if tab_text in ("Đổi Tên", "Thêm Credit"):
                    if not self.folder_frame.winfo_ismapped():
                        self.folder_frame.pack(fill=tk.X, expand=False, pady=(0, 8), before=self.main_paned_window)
                else:
                    if self.folder_frame.winfo_ismapped():
                        self.folder_frame.pack_forget()

            if tab_text in ("Wikidich", "Koanchay"):
                target_site = "koanchay" if tab_text == "Koanchay" else "wikidich"
                self._wd_set_active_site(target_site)

            if tab_text == "Xử lý Văn bản":
                filepath = self.selected_file.get()
                if filepath and os.path.isfile(filepath):
                    if getattr(self, "_last_loaded_file", "") != filepath:
                        self._select_file_for_ops(filepath=filepath)
                        self._last_loaded_file = filepath
            if tab_text == "Xử lý Ảnh" and hasattr(self, "_image_ai_check_tool_state"):
                if not getattr(self, "_image_ai_tool_checked_on_tab", False):
                    self._image_ai_tool_checked_on_tab = True
                    self._image_ai_check_tool_state(force=True)
        except Exception as e:
            print(f"Lỗi trong _on_notebook_tab_changed: {e}")

    def _select_tab_by_name(self, name_to_find: str):
        """Tìm và chọn một tab trong notebook chính dựa vào tên của nó."""
        for tab_id in self.notebook.tabs():
            if self.notebook.tab(tab_id, "text") == name_to_find:
                self.notebook.select(tab_id)
                break

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
                self.log(f"[Giải nén] Bắt đầu giải nén '{os.path.basename(archive_path)}'...")
                self._extract_archive_to(archive_path, dest_path)
                self.log(f"[Giải nén] Hoàn tất! Đã giải nén vào: {dest_path}")
                self.after(0, lambda: messagebox.showinfo("Thành công", "Đã giải nén file thành công!"))
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
    
def main(instance_server=None):
    """Launch the Tkinter application."""
    app = RenamerApp(instance_server=instance_server)
    app.mainloop()
    _release_single_instance_mutex()


if __name__ == "__main__":
    main()
