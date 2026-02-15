"""
WikidichState - Lớp chứa state cho MỘT site (wikidich hoặc koanchay).

Mỗi site sẽ có instance riêng của WikidichState, giải quyết vấn đề
shared state giữa 2 tabs.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple
import os

from app.paths import BASE_DIR


def _default_filters() -> Dict[str, Any]:
    """Trả về bộ lọc mặc định."""
    return {
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
    }


def _default_data() -> Dict[str, Any]:
    """Trả về data mặc định."""
    return {
        'username': None,
        'book_ids': [],
        'books': {},
        'synced_at': None
    }


@dataclass
class WikidichState:
    """
    State cho MỘT site (wikidich hoặc koanchay).
    
    Attributes:
        site: Tên site ("wikidich" hoặc "koanchay")
        data: Dữ liệu books đã fetch từ server
        filtered: Danh sách books sau khi lọc
        new_chapters: Map book_id -> số chương mới
        not_found: Danh sách books đã bị xóa trên server (404)
        filters: Bộ lọc hiện tại
        cache_path: Đường dẫn file cache
        profile: Profile browser đang dùng
        loading: Đang trong quá trình load không
        cancel_requested: User yêu cầu hủy không
        progress: Tuple (current, total) cho progress bar
        progress_message: Thông báo progress hiện tại
    """
    site: str
    
    # Data
    data: Dict[str, Any] = field(default_factory=_default_data)
    filtered: List[Dict[str, Any]] = field(default_factory=list)
    new_chapters: Dict[str, int] = field(default_factory=dict)
    not_found: List[Dict[str, Any]] = field(default_factory=list)
    
    # Filters
    filters: Dict[str, Any] = field(default_factory=_default_filters)
    
    # Config
    cache_path: str = ""
    profile: str = "Profile 1"
    open_mode: str = "in_app"
    auto_pick_mode: str = "extract_then_pick"
    
    # Loading state
    loading: bool = False
    cancel_requested: bool = False
    progress: Tuple[int, int] = (0, 0)
    progress_message: str = ""
    
    def __post_init__(self):
        """Thiết lập cache_path mặc định nếu chưa có."""
        if not self.cache_path:
            cache_name = "koanchay_cache.json" if self.site == "koanchay" else "wikidich_cache.json"
            self.cache_path = os.path.join(BASE_DIR, "local", cache_name)
    
    def get_base_url(self) -> str:
        """Trả về base URL của site."""
        if self.site == "koanchay":
            return "https://koanchay.org"
        return "https://wikicv.net"
    
    def get_cookie_domains(self) -> List[str]:
        """Trả về danh sách domain để lấy cookies."""
        if self.site == "koanchay":
            return ["koanchay.org", "koanchay.net"]
        return ["wikicv.net", "koanchay.net"]
    
    def reset_data(self):
        """Reset data về mặc định."""
        self.data = _default_data()
        self.filtered = []
        self.new_chapters = {}
    
    def reset_filters(self):
        """Reset filters về mặc định."""
        self.filters = _default_filters()
    
    def to_config(self) -> Dict[str, Any]:
        """Chuyển state thành config dict để lưu."""
        return {
            'cache_path': self.cache_path,
            'advanced_filter': dict(self.filters),
            'open_mode': self.open_mode,
            'auto_pick_mode': self.auto_pick_mode
        }
    
    def load_from_config(self, cfg: Dict[str, Any]):
        """Load state từ config dict."""
        if not isinstance(cfg, dict):
            return
        
        self.cache_path = cfg.get('cache_path', self.cache_path)
        self.open_mode = cfg.get('open_mode', self.open_mode)
        self.auto_pick_mode = cfg.get('auto_pick_mode', self.auto_pick_mode)
        
        adv_filter = cfg.get('advanced_filter')
        if isinstance(adv_filter, dict):
            # Merge với default để đảm bảo có đủ keys
            default = _default_filters()
            default.update(adv_filter)
            self.filters = default
    
    def is_loading(self) -> bool:
        """Kiểm tra có đang loading không."""
        return self.loading
    
    def start_loading(self, message: str = ""):
        """Bắt đầu loading."""
        self.loading = True
        self.cancel_requested = False
        self.progress = (0, 0)
        self.progress_message = message
    
    def stop_loading(self):
        """Kết thúc loading."""
        self.loading = False
        self.cancel_requested = False
        self.progress = (0, 0)
        self.progress_message = ""
    
    def request_cancel(self):
        """Yêu cầu hủy task đang chạy."""
        self.cancel_requested = True
    
    def update_progress(self, current: int, total: int, message: str = ""):
        """Cập nhật progress."""
        self.progress = (current, total)
        if message:
            self.progress_message = message
