import os

from app.paths import BASE_DIR

MODERN_THEME_NAME = "RenameModern"
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")

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
        "User-Agent": "Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/6.10.0 Chrome/134.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "vi,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Upgrade-Insecure-Requests": "1"
    },
    'fanqie_headers': {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    }
}

# Column configuration for Wikidich/Koanchay table
# Key: column id, Value: (label, default_width, visible_by_default)
# Note: "title" is always visible and cannot be hidden
WIKIDICH_COLUMNS_CONFIG = {
    'title': ('Tiêu đề', 240, True),        # Always visible - mandatory
    'status': ('Trạng thái', 110, True),
    'updated': ('Cập nhật', 110, True),
    'chapters': ('Wiki', 80, True),
    'new_chapters': ('New', 90, True),
    'notes': ('Ghi chú', 150, True),        # New column
    'views': ('Lượt xem', 90, False),       # Hidden by default
    'author': ('Tác giả', 160, False),      # Hidden by default
}

# Default visible columns (based on WIKIDICH_COLUMNS_CONFIG)
DEFAULT_VISIBLE_COLUMNS = ['title', 'status', 'updated', 'chapters', 'new_chapters', 'notes']

DEFAULT_UPLOAD_SETTINGS = {
    "filename_regex": r"第(\d+)章\s*(.*)",
    "content_regex": r"第(\d+)章\s*(.*)",
    "template": "第{num}章 {title}",
    "priority": "filename",  # filename | content
    "warn_kb": 4,
    "append_desc": "{num-d}-{num-c}",
    "sort_by_number": True,
}

DEFAULT_BACKGROUND_SETTINGS = {
    'enable': False,
    'start_hidden': False
}

DEFAULT_ND5_OPTIONS = {
    "include_info": True,
    "include_cover": True,
    "heading_in_zip": True,
    "format": "zip",
    "title_tpl": "{num}. {title}",
    "range": "",
    "out_dir": "",
    "req_delay_min": 2.0,
    "req_delay_max": 3.0,
    "request_timeout": 20.0,
    "filename_tpl": "{title}_{author}",
    "request_retries": 3,
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
    },
    {
        "id": "douban",
        "label": "Douban",
        "domain": "read.douban.com",
        "site_value": "read.douban.com",
        "sample": "https://read.douban.com/column/69676484/",
        "icon": "icons/douban.png"
    },
    {
        "id": "qimao",
        "label": "Qimao",
        "domain": "qimao.com",
        "site_value": "qimao.com",
        "sample": "https://www.qimao.com/shuku/123456",
        "icon": "icons/qimao.png"
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
