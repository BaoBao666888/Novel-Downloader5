"""
WikidichController - Controller xử lý logic cho tab Wikidich/Koanchay.

Mỗi site sẽ có 1 instance riêng của WikidichController với state riêng.
Controller này sẽ:
- Quản lý state (WikidichState)
- Xử lý events từ View
- Gọi wikidich_ext để fetch/process data
- Không trực tiếp tạo UI widgets
"""
import os
import threading
from typing import Optional, Dict, Any, List, Callable

from extensions import wikidich_ext
from app.paths import BASE_DIR
from .state import WikidichState


class WikidichController:
    """
    Controller cho một site Wikidich hoặc Koanchay.
    
    Attributes:
        site: Tên site ("wikidich" hoặc "koanchay")
        state: WikidichState instance chứa data
        app: Reference đến RenamerApp (để truy cập shared resources)
        view: Reference đến WikidichTabView (sẽ được set sau)
    """
    
    def __init__(self, site: str, app):
        """
        Khởi tạo controller.
        
        Args:
            site: "wikidich" hoặc "koanchay"
            app: RenamerApp instance
        """
        self.site = site
        self.app = app
        self.state = WikidichState(site=site)
        self.view = None  # Sẽ được set bởi View khi khởi tạo
        
        # Callbacks cho progress updates (optional)
        self._on_progress: Optional[Callable] = None
        self._on_complete: Optional[Callable] = None
    
    # ==================== Lifecycle ====================
    
    def on_tab_activated(self):
        """Được gọi khi tab được kích hoạt (user chuyển đến tab này)."""
        # Load cache nếu chưa có data
        if not self.state.data.get('books'):
            self.load_cache_async()
    
    def on_tab_deactivated(self):
        """Được gọi khi user rời khỏi tab này."""
        # Collect filter values từ UI trước khi rời
        if self.view:
            self.collect_filters_from_view()
    
    # ==================== Data Operations ====================
    
    def load_cache(self) -> bool:
        """
        Load cache từ file (sync).
        
        Returns:
            True nếu load thành công, False nếu không có cache
        """
        cached = wikidich_ext.load_cache(self.state.cache_path)
        if cached:
            self.state.data = cached
            return True
        else:
            self.state.reset_data()
            return False
    
    def load_cache_async(self):
        """Load cache trong background thread."""
        def _worker():
            try:
                self.state.start_loading("Đang tải cache...")
                success = self.load_cache()
                
                # Update UI on main thread
                if self.app and hasattr(self.app, 'after'):
                    self.app.after(0, lambda: self._on_cache_loaded(success))
            except Exception as e:
                if self.app and hasattr(self.app, 'after'):
                    self.app.after(0, lambda: self._on_load_error(str(e)))
            finally:
                self.state.stop_loading()
        
        threading.Thread(target=_worker, daemon=True).start()
    
    def _on_cache_loaded(self, success: bool):
        """Callback sau khi load cache xong (chạy trên main thread)."""
        self.apply_filters()
        if self.view:
            self.view.refresh_from_state()
    
    def _on_load_error(self, error: str):
        """Callback khi load cache thất bại."""
        self.log(f"Lỗi load cache: {error}")
        if self.view:
            self.view.refresh_from_state()
    
    def save_cache(self):
        """Lưu cache xuống file."""
        try:
            cache_dir = os.path.dirname(self.state.cache_path)
            if cache_dir:
                os.makedirs(cache_dir, exist_ok=True)
            wikidich_ext.save_cache(self.state.cache_path, self.state.data)
        except Exception as e:
            self.log(f"Lỗi lưu cache: {e}")
    
    # ==================== Filter Operations ====================
    
    def apply_filters(self):
        """Áp dụng bộ lọc và cập nhật filtered list."""
        self.state.filtered = wikidich_ext.filter_books(
            self.state.data, 
            self.state.filters
        )
        
        # Update view nếu có
        if self.view:
            self.view.refresh_tree(self.state.filtered)
            self.view.update_filter_status()
    
    def reset_filters(self):
        """Reset bộ lọc về mặc định."""
        self.state.reset_filters()
        self.apply_filters()
        
        if self.view:
            self.view.sync_filter_controls_from_state()
    
    def collect_filters_from_view(self):
        """Thu thập giá trị filter từ UI controls."""
        # Nếu có View mới thì dùng View
        if self.view:
            filters = self.view.get_filter_values()
            if filters:
                self.state.filters.update(filters)
            return
        
        # Fallback: Đọc từ app's existing UI vars (khi View chưa integrate)
        # Chỉ đọc nếu đang ở đúng site này
        current_site = getattr(self.app, "wd_site", "wikidich")
        if current_site != self.site:
            return  # Không phải site hiện tại, không cần collect
        
        if hasattr(self.app, "wd_search_var"):
            try:
                filters = {
                    'search': self.app.wd_search_var.get().strip(),
                    'status': self.app.wd_status_var.get() if hasattr(self.app, "wd_status_var") else 'all',
                    'summarySearch': self.app.wd_summary_var.get().strip() if hasattr(self.app, "wd_summary_var") else '',
                    'extraLinkSearch': self.app.wd_extra_link_var.get().strip() if hasattr(self.app, "wd_extra_link_var") else '',
                    'fromDate': self.app.wd_from_date_var.get().strip() if hasattr(self.app, "wd_from_date_var") else '',
                    'toDate': self.app.wd_to_date_var.get().strip() if hasattr(self.app, "wd_to_date_var") else '',
                }
                
                # Flags
                if hasattr(self.app, "wd_flag_vars"):
                    filters['flags'] = [flag for flag, var in self.app.wd_flag_vars.items() if var.get()]
                
                # Roles
                if hasattr(self.app, "wd_role_vars"):
                    filters['roles'] = [role for role, var in self.app.wd_role_vars.items() if var.get()]
                
                # Categories
                if hasattr(self.app, "_wd_get_selected_categories"):
                    filters['categories'] = self.app._wd_get_selected_categories()
                
                # Sort
                if hasattr(self.app, "_wd_get_sort_value"):
                    filters['sortBy'] = self.app._wd_get_sort_value()
                
                self.state.filters.update(filters)
            except Exception as e:
                self.log(f"Lỗi collect filters: {e}")
    
    def update_filter(self, key: str, value: Any):
        """Cập nhật một filter cụ thể."""
        self.state.filters[key] = value
    
    # ==================== Config Operations ====================
    
    def save_to_config(self) -> Dict[str, Any]:
        """
        Chuyển state thành config dict để lưu vào config.json.
        
        Returns:
            Dict chứa config của site này
        """
        # Collect filters từ view trước khi save
        self.collect_filters_from_view()
        return self.state.to_config()
    
    def load_from_config(self, cfg: Dict[str, Any]):
        """
        Load state từ config dict.
        
        Args:
            cfg: Config dict từ config.json
        """
        self.state.load_from_config(cfg)
    
    # ==================== Fetch Operations ====================
    
    def fetch_works_async(self, callback: Optional[Callable] = None):
        """
        Fetch works từ server trong background.
        
        Args:
            callback: Callback function khi hoàn thành
        """
        if self.state.is_loading():
            return
        
        def _worker():
            try:
                self.state.start_loading("Đang tải danh sách truyện...")
                
                # Build session
                session, username = self._build_session()
                if not session or not username:
                    raise ValueError("Không thể tạo session. Hãy đăng nhập trước.")
                
                # Fetch works
                data = wikidich_ext.fetch_all_works(
                    session=session,
                    user_slug=username,
                    base_url=self.state.get_base_url(),
                    proxies=self._get_proxies(),
                    progress_callback=self._progress_callback
                )
                
                if data:
                    self.state.data = data
                    self.save_cache()
                
                # Update UI
                if self.app:
                    self.app.after(0, lambda: self._on_fetch_complete(callback))
                    
            except Exception as e:
                if self.app:
                    self.app.after(0, lambda: self._on_fetch_error(str(e), callback))
            finally:
                self.state.stop_loading()
        
        threading.Thread(target=_worker, daemon=True).start()
    
    def _on_fetch_complete(self, callback: Optional[Callable]):
        """Callback sau khi fetch xong."""
        self.apply_filters()
        if self.view:
            self.view.refresh_from_state()
        if callback:
            callback(True, "Hoàn thành")
    
    def _on_fetch_error(self, error: str, callback: Optional[Callable]):
        """Callback khi fetch thất bại."""
        self.log(f"Lỗi fetch: {error}")
        if callback:
            callback(False, error)
    
    def _progress_callback(self, stage: str, current: int, total: int, message: str):
        """Callback update progress."""
        self.state.update_progress(current, total, message)
        
        # Check cancel
        if self.state.cancel_requested:
            raise wikidich_ext.WikidichCancelled()
        
        # Update UI
        if self.app and self.view:
            self.app.after(0, lambda: self.view.set_progress(message, current, total))
    
    # ==================== Session & Network ====================
    
    def _build_session(self):
        """
        Build requests session với cookies.
        
        Returns:
            Tuple (session, username) hoặc (None, None) nếu thất bại
        """
        if hasattr(self.app, '_wd_build_wiki_session'):
            # Delegate to app's session builder (vẫn dùng code cũ tạm thời)
            return self.app._wd_build_wiki_session()
        return None, None
    
    def _get_proxies(self) -> Optional[Dict]:
        """Lấy proxy settings từ app."""
        if hasattr(self.app, '_wd_get_proxies'):
            return self.app._wd_get_proxies()
        return None
    
    # ==================== Utilities ====================
    
    def log(self, message: str):
        """Log message."""
        if hasattr(self.app, 'log'):
            self.app.log(f"[{self.site.capitalize()}] {message}")
        else:
            print(f"[{self.site.capitalize()}] {message}")
    
    def request_cancel(self):
        """Yêu cầu hủy task đang chạy."""
        self.state.request_cancel()
    
    def get_selected_book(self) -> Optional[Dict]:
        """Lấy book đang được chọn trong tree."""
        if self.view:
            return self.view.get_selected_book()
        return None
    
    def get_book_by_id(self, book_id: str) -> Optional[Dict]:
        """Lấy book theo ID."""
        return self.state.data.get('books', {}).get(book_id)
    
    def update_book(self, book_id: str, updates: Dict):
        """Cập nhật thông tin book."""
        if book_id in self.state.data.get('books', {}):
            self.state.data['books'][book_id].update(updates)
