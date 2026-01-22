"""
WikidichTabView - Lớp tạo và quản lý UI cho tab Wikidich/Koanchay.

View chỉ:
- Tạo widgets
- Render data từ Controller
- Bind events đến Controller
- KHÔNG xử lý business logic
"""
import tkinter as tk
from tkinter import ttk, scrolledtext
from typing import Optional, Dict, Any, List, TYPE_CHECKING

from extensions import wikidich_ext
from app.ui.constants import WD_SORT_OPTIONS

if TYPE_CHECKING:
    from .controller import WikidichController


class WikidichTabView:
    """
    View cho tab Wikidich hoặc Koanchay.
    
    Mỗi site có instance riêng của View, liên kết với Controller riêng.
    """
    
    FLAG_LABELS = {
        "embedLink": "Có nhúng link",
        "embedFile": "Có nhúng file"
    }
    
    ROLE_LABELS = {
        "poster": "Tôi là người đăng",
        "managerOwner": "Đồng quản lý - chủ",
        "managerGuest": "Đồng quản lý - khách",
        "editorOwner": "Biên tập - chủ",
        "editorGuest": "Biên tập - khách"
    }
    
    def __init__(self, parent: ttk.Frame, controller: 'WikidichController', app):
        """
        Khởi tạo View.
        
        Args:
            parent: Frame cha (tab trong notebook)
            controller: WikidichController instance
            app: RenamerApp instance (để truy cập theme, shared resources)
        """
        self.parent = parent
        self.controller = controller
        self.app = app
        self.site = controller.site
        
        # Liên kết Controller với View
        controller.view = self
        
        # UI Variables
        self._init_variables()
        
        # Build UI
        self._build_ui()
    
    def _init_variables(self):
        """Khởi tạo các tk Variables."""
        state = self.controller.state
        filters = state.filters
        
        # Header
        self.user_label_var = tk.StringVar(value="Chưa kiểm tra đăng nhập")
        self.count_var = tk.StringVar(value="Số truyện: 0")
        self.profile_var = tk.StringVar(value=state.profile)
        
        # Filter - Basic
        self.search_var = tk.StringVar(value=filters.get('search', ''))
        self.status_var = tk.StringVar(value=filters.get('status', 'all'))
        self.summary_var = tk.StringVar(value=filters.get('summarySearch', ''))
        self.extra_link_var = tk.StringVar(value=filters.get('extraLinkSearch', ''))
        self.flag_vars = {flag: tk.BooleanVar(value=flag in filters.get('flags', [])) 
                         for flag in self.FLAG_LABELS}
        
        # Filter - Sort
        self._sort_value_to_label = {value: label for value, label in WD_SORT_OPTIONS}
        self._sort_label_to_value = {label: value for value, label in WD_SORT_OPTIONS}
        initial_sort = self._sort_value_to_label.get(filters.get('sortBy', 'recent'), WD_SORT_OPTIONS[0][1])
        self.sort_label_var = tk.StringVar(value=initial_sort)
        
        # Filter - Advanced
        self.from_date_var = tk.StringVar(value=filters.get('fromDate', ''))
        self.to_date_var = tk.StringVar(value=filters.get('toDate', ''))
        self.role_vars = {role: tk.BooleanVar(value=role in filters.get('roles', []))
                        for role in wikidich_ext.ROLE_OPTIONS}
        
        # Status
        self.basic_status_var = tk.StringVar(value="")
        self.adv_status_var = tk.StringVar(value="")
        self.ticker_var = tk.StringVar(value="")
        
        # Detail panel
        self.info_vars = {
            'author': tk.StringVar(value=""),
            'status': tk.StringVar(value=""),
            'updated': tk.StringVar(value=""),
            'chapters': tk.StringVar(value=""),
        }
        self.link_path_var = tk.StringVar(value="Chưa liên kết")
        
        # Internal state
        self._adv_section_visible = False
        self._basic_collapsed = False
        self._progress_visible = False
        self._category_options = []
        self._tree_index = {}  # item_id -> book_id
        self._current_links = []
    
    def _build_ui(self):
        """Build toàn bộ UI."""
        self.parent.columnconfigure(0, weight=1)
        self.parent.rowconfigure(3, weight=1)
        
        self._build_header()
        self._build_progress_bar()
        self._build_filter_section()
        self._build_main_content()
    
    # ==================== Header ====================
    
    def _build_header(self):
        """Build header với user label, buttons, profile select."""
        header = ttk.Frame(self.parent)
        header.grid(row=0, column=0, sticky="ew")
        
        # User label
        self.user_label = ttk.Label(header, textvariable=self.user_label_var, width=25, anchor="w")
        self.user_label.grid(row=0, column=0, sticky="w")
        
        # Sync menu
        sync_mb = ttk.Menubutton(header, text="Sync")
        sync_menu = tk.Menu(sync_mb, tearoff=0)
        sync_menu.add_command(label="Tải Works", command=self._on_fetch_works)
        sync_menu.add_command(label="Tải chi tiết", command=self._on_fetch_details)
        sync_mb.config(menu=sync_menu)
        sync_mb.grid(row=0, column=1, padx=(10, 0))
        
        # Tools buttons
        tools_frame = ttk.Frame(header)
        tools_frame.grid(row=0, column=3, columnspan=4, padx=(6, 0))
        ttk.Button(tools_frame, text="Ghi chú", command=self._on_open_notes).pack(side=tk.LEFT, padx=(0, 2))
        ttk.Button(tools_frame, text="Thư viện", command=self._on_open_library).pack(side=tk.LEFT, padx=(2, 2))
        ttk.Button(tools_frame, text="Liên kết", command=self._on_open_links).pack(side=tk.LEFT, padx=(2, 2))
        ttk.Button(tools_frame, text="Cài đặt", command=self._on_open_settings).pack(side=tk.LEFT, padx=(2, 0))
        
        # Profile select
        ttk.Label(header, text="Profile:").grid(row=0, column=7, padx=(10, 2))
        self.profile_cb = ttk.Combobox(header, textvariable=self.profile_var, width=15, state="readonly")
        self.profile_cb.grid(row=0, column=8, padx=(0, 6))
        self.profile_cb.bind("<<ComboboxSelected>>", self._on_profile_change)
        
        # Spacer
        header.columnconfigure(9, weight=1)
        ttk.Frame(header).grid(row=0, column=9, sticky="ew")
        
        # Count label
        ttk.Label(header, textvariable=self.count_var).grid(row=0, column=10, padx=(0, 8), sticky="e")
        
        # Toggle basic filter button
        self.basic_toggle_btn = ttk.Button(header, text="Thu gọn lọc cơ bản", 
                                           command=self._on_toggle_basic_section)
        self.basic_toggle_btn.grid(row=0, column=11, padx=(6, 0))
        
        # Switch site button
        other_site = "koanchay" if self.site == "wikidich" else "wikidich"
        self.site_button = ttk.Button(header, text=other_site.capitalize(),
                                      command=lambda: self._on_switch_site(other_site))
        self.site_button.grid(row=0, column=12, padx=(12, 0))
    
    # ==================== Progress Bar ====================
    
    def _build_progress_bar(self):
        """Build progress bar (hidden by default)."""
        self.progress_frame = ttk.Frame(self.parent)
        self.progress_frame.grid(row=1, column=0, sticky="ew", pady=(6, 4))
        self.progress_frame.columnconfigure(1, weight=1)
        
        ttk.Label(self.progress_frame, text="Tiến độ:").grid(row=0, column=0, sticky="w")
        self.progress_bar = ttk.Progressbar(self.progress_frame, mode="determinate")
        self.progress_bar.grid(row=0, column=1, sticky="ew", padx=(6, 6))
        self.progress_label = ttk.Label(self.progress_frame, text="Chờ thao tác...")
        self.progress_label.grid(row=0, column=2, sticky="w")
        self.cancel_btn = ttk.Button(self.progress_frame, text="X", width=1,
                                     command=self._on_cancel, state=tk.DISABLED)
        self.cancel_btn.grid(row=0, column=3, padx=(6, 0))
        
        # Hide by default
        self.progress_frame.grid_remove()
    
    # ==================== Filter Section ====================
    
    def _build_filter_section(self):
        """Build filter section với basic và advanced filters."""
        self.filter_container = ttk.LabelFrame(self.parent, text="Bộ lọc cơ bản", padding=2)
        self.filter_container.grid(row=2, column=0, sticky="ew")
        self.filter_container.columnconfigure(0, weight=1)
        
        # Scrollable canvas
        self.filter_canvas = tk.Canvas(self.filter_container, height=160, bd=0, highlightthickness=0)
        filter_scrollbar = ttk.Scrollbar(self.filter_container, orient="vertical", 
                                         command=self.filter_canvas.yview)
        
        self.filter_frame = ttk.Frame(self.filter_canvas)
        self._filter_window_id = self.filter_canvas.create_window((0, 0), window=self.filter_frame, anchor="nw")
        self.filter_canvas.configure(yscrollcommand=filter_scrollbar.set)
        
        self.filter_canvas.grid(row=0, column=0, sticky="nsew")
        filter_scrollbar.grid(row=0, column=1, sticky="ns")
        
        # Bind events
        self.filter_frame.bind("<Configure>", lambda e: self._update_filter_scroll())
        self.filter_canvas.bind("<Configure>", self._on_filter_canvas_configure)
        self.filter_canvas.bind("<MouseWheel>", self._on_filter_mousewheel)
        self.filter_frame.bind("<MouseWheel>", self._on_filter_mousewheel)
        
        # Build filter controls
        self._build_filter_controls()
        self._build_advanced_filter()
    
    def _build_filter_controls(self):
        """Build basic filter controls."""
        self.filter_frame.columnconfigure(0, weight=1)
        
        # Input frame (left side)
        input_frame = ttk.Frame(self.filter_frame)
        input_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 5))
        input_frame.columnconfigure(1, weight=1)
        input_frame.columnconfigure(3, weight=1)
        
        # Row 0: Search + Status
        ttk.Label(input_frame, text="Tiêu đề / Tác giả:").grid(row=0, column=0, sticky="w")
        ttk.Entry(input_frame, textvariable=self.search_var).grid(row=0, column=1, sticky="ew", padx=(4, 10))
        ttk.Label(input_frame, text="Trạng thái:").grid(row=0, column=2, sticky="w")
        status_values = ["all"] + wikidich_ext.STATUS_OPTIONS
        ttk.Combobox(input_frame, state="readonly", textvariable=self.status_var, 
                    values=status_values, width=18).grid(row=0, column=3, sticky="w")
        
        # Row 1: Summary + Sort
        ttk.Label(input_frame, text="Tìm trong văn án:").grid(row=1, column=0, sticky="w", pady=(6, 0))
        ttk.Entry(input_frame, textvariable=self.summary_var).grid(row=1, column=1, sticky="ew", padx=(4, 10), pady=(6, 0))
        ttk.Label(input_frame, text="Sắp xếp:").grid(row=1, column=2, sticky="w", pady=(6, 0))
        ttk.Combobox(input_frame, state="readonly", textvariable=self.sort_label_var,
                    values=[label for _, label in WD_SORT_OPTIONS], width=18).grid(row=1, column=3, sticky="w", pady=(6, 0))
        
        # Row 2: Extra link
        ttk.Label(input_frame, text="Link bổ sung:").grid(row=2, column=0, sticky="w", pady=(6, 0))
        ttk.Entry(input_frame, textvariable=self.extra_link_var).grid(row=2, column=1, columnspan=3, sticky="ew", padx=(4, 10), pady=(6, 0))
        
        # Row 3: Flags
        ttk.Label(input_frame, text="Thuộc tính:").grid(row=3, column=0, sticky="nw", pady=(8, 0))
        flag_frame = ttk.Frame(input_frame)
        flag_frame.grid(row=3, column=1, columnspan=3, sticky="w", pady=(8, 0))
        for flag, label in self.FLAG_LABELS.items():
            ttk.Checkbutton(flag_frame, text=label, variable=self.flag_vars[flag]).pack(side=tk.LEFT, padx=(0, 12))
        
        # Action frame (right side)
        action_frame = ttk.Frame(self.filter_frame)
        action_frame.grid(row=0, column=1, sticky="ne")
        
        ttk.Button(action_frame, text="Áp dụng", command=self._on_apply_filters).grid(row=0, column=0, sticky="ew")
        ttk.Button(action_frame, text="Kiểm tra cập nhật", command=self._on_check_updates).grid(row=1, column=0, sticky="ew", pady=(6, 0))
        self.adv_toggle_btn = ttk.Button(action_frame, text="Hiện lọc nâng cao", 
                                         command=self._on_toggle_advanced_section)
        self.adv_toggle_btn.grid(row=2, column=0, sticky="ew", pady=(10, 0))
        
        # Status ticker
        ttk.Label(action_frame, textvariable=self.ticker_var, width=36, 
                 anchor="w", foreground="#16a34a").grid(row=3, column=0, sticky="ew", pady=(4, 0))
    
    def _build_advanced_filter(self):
        """Build advanced filter section (hidden by default)."""
        self.adv_container = ttk.LabelFrame(self.filter_frame, text="Lọc nâng cao", padding=8)
        self.adv_container.grid(row=4, column=0, columnspan=6, sticky="ew", pady=(12, 0))
        self.adv_container.columnconfigure(0, weight=1)
        
        # Header
        adv_header = ttk.Frame(self.adv_container)
        adv_header.grid(row=0, column=0, sticky="ew")
        ttk.Label(adv_header, text="Khoảng ngày cập nhật (YYYY-MM-DD)").pack(side=tk.LEFT)
        ttk.Button(adv_header, text="Đặt lại bộ lọc", command=self._on_reset_filters).pack(side=tk.RIGHT)
        
        # Date pickers
        date_frame = ttk.Frame(self.adv_container)
        date_frame.grid(row=1, column=0, sticky="ew", pady=(4, 10))
        
        from_row = ttk.Frame(date_frame)
        from_row.pack(fill=tk.X, pady=2)
        ttk.Label(from_row, text="Từ:").pack(side=tk.LEFT)
        ttk.Entry(from_row, textvariable=self.from_date_var, state="readonly", width=12).pack(side=tk.LEFT, padx=(4, 4))
        ttk.Button(from_row, text="Chọn", command=lambda: self._on_pick_date(self.from_date_var, "Chọn ngày bắt đầu")).pack(side=tk.LEFT, padx=(0, 4))
        ttk.Button(from_row, text="Xóa", command=lambda: self.from_date_var.set("")).pack(side=tk.LEFT)
        
        to_row = ttk.Frame(date_frame)
        to_row.pack(fill=tk.X, pady=2)
        ttk.Label(to_row, text="Đến:").pack(side=tk.LEFT)
        ttk.Entry(to_row, textvariable=self.to_date_var, state="readonly", width=12).pack(side=tk.LEFT, padx=(4, 4))
        ttk.Button(to_row, text="Chọn", command=lambda: self._on_pick_date(self.to_date_var, "Chọn ngày kết thúc")).pack(side=tk.LEFT, padx=(0, 4))
        ttk.Button(to_row, text="Xóa", command=lambda: self.to_date_var.set("")).pack(side=tk.LEFT)
        
        # Categories
        ttk.Label(self.adv_container, text="Thể loại đang có").grid(row=2, column=0, sticky="w", pady=(4, 2))
        self.category_listbox = tk.Listbox(self.adv_container, selectmode=tk.MULTIPLE, height=6, exportselection=False)
        self.category_listbox.grid(row=3, column=0, sticky="ew")
        
        # Roles
        ttk.Label(self.adv_container, text="Vai trò của bạn").grid(row=4, column=0, sticky="w", pady=(8, 2))
        roles_frame = ttk.Frame(self.adv_container)
        roles_frame.grid(row=5, column=0, sticky="w")
        for role in wikidich_ext.ROLE_OPTIONS:
            ttk.Checkbutton(roles_frame, text=self.ROLE_LABELS.get(role, role), 
                           variable=self.role_vars[role]).pack(anchor="w")
        
        # Hide by default
        self.adv_container.grid_remove()
    
    # ==================== Main Content ====================
    
    def _build_main_content(self):
        """Build main content với detail panel và tree."""
        main_pane = ttk.PanedWindow(self.parent, orient=tk.HORIZONTAL)
        main_pane.grid(row=3, column=0, sticky="nsew", pady=(8, 0))
        
        # Detail panel (left)
        self._build_detail_panel(main_pane)
        
        # Tree (right)
        self._build_tree(main_pane)
    
    def _build_detail_panel(self, main_pane):
        """Build detail panel."""
        detail_container = ttk.Frame(main_pane)
        detail_container.columnconfigure(0, weight=1)
        detail_container.rowconfigure(1, weight=1)
        main_pane.add(detail_container, weight=3)
        
        # Header with title
        header_frame = ttk.Frame(detail_container, padding=(6, 6, 6, 0))
        header_frame.grid(row=0, column=0, sticky="ew")
        header_frame.columnconfigure(0, weight=1)
        
        self.title_text = tk.Text(header_frame, height=2, wrap=tk.WORD, 
                                  font=("Segoe UI", 11, "bold"), relief="flat", bd=0)
        self.title_text.grid(row=0, column=0, sticky="ew")
        self.title_text.insert("1.0", "Chưa chọn truyện")
        self.title_text.configure(state="disabled")
        
        # Action buttons
        self.btn_flow = ttk.Frame(header_frame)
        self.btn_flow.grid(row=1, column=0, sticky="ew", pady=(6, 0))
        
        ttk.Button(self.btn_flow, text="Mở trang truyện", command=self._on_open_book).pack(side=tk.LEFT, padx=(0, 4))
        ttk.Button(self.btn_flow, text="Chỉnh sửa", command=self._on_edit_book).pack(side=tk.LEFT, padx=(0, 4))
        ttk.Button(self.btn_flow, text="DS Chương", command=self._on_chapter_list).pack(side=tk.LEFT, padx=(0, 4))
        ttk.Button(self.btn_flow, text="Cập nhật chương", command=self._on_update_chapters).pack(side=tk.LEFT, padx=(0, 4))
        ttk.Button(self.btn_flow, text="Ghi chú", command=self._on_book_note).pack(side=tk.LEFT, padx=(0, 4))
        ttk.Button(self.btn_flow, text="Xóa", command=self._on_delete_book).pack(side=tk.LEFT, padx=(0, 4))
        
        # Detail canvas (scrollable)
        content_container = ttk.Frame(detail_container, padding=(6, 0, 6, 6))
        content_container.grid(row=1, column=0, sticky="nsew")
        content_container.rowconfigure(0, weight=1)
        content_container.columnconfigure(0, weight=1)
        
        self.detail_canvas = tk.Canvas(content_container, highlightthickness=0, bd=0)
        detail_scrollbar = ttk.Scrollbar(content_container, orient="vertical", command=self.detail_canvas.yview)
        self.detail_canvas.configure(yscrollcommand=detail_scrollbar.set)
        self.detail_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        detail_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        detail_frame = ttk.Frame(self.detail_canvas, padding=6)
        self._detail_window = self.detail_canvas.create_window((0, 0), window=detail_frame, anchor="nw")
        detail_frame.columnconfigure(1, weight=1)
        
        # Cover
        cover_frame = ttk.Frame(detail_frame)
        cover_frame.grid(row=0, column=0, rowspan=2, sticky="nw", pady=(6, 0))
        self.cover_label = tk.Label(cover_frame, text="(Bìa)", bd=0)
        self.cover_label.pack()
        
        # Info fields
        info_frame = ttk.Frame(detail_frame)
        info_frame.grid(row=0, column=1, sticky="new", padx=(10, 0), pady=(6, 0))
        info_frame.columnconfigure(1, weight=1)
        
        for idx, (key, label) in enumerate([('author', 'Tác giả:'), ('status', 'Trạng thái:'),
                                            ('updated', 'Cập nhật:'), ('chapters', 'Số chương:')]):
            ttk.Label(info_frame, text=label).grid(row=idx, column=0, sticky="w")
            ttk.Entry(info_frame, textvariable=self.info_vars[key], state="readonly").grid(row=idx, column=1, sticky="ew")
        
        # Collections
        ttk.Label(info_frame, text="Thể loại/Tag:").grid(row=4, column=0, sticky="nw", pady=(4, 0))
        self.collections_text = scrolledtext.ScrolledText(info_frame, wrap=tk.WORD, height=3)
        self.collections_text.grid(row=4, column=1, sticky="ew", pady=(4, 0))
        self.collections_text.configure(state="disabled")
        
        # Flags
        ttk.Label(info_frame, text="Vai trò/Thuộc tính:").grid(row=5, column=0, sticky="nw", pady=(4, 0))
        self.flags_text = scrolledtext.ScrolledText(info_frame, wrap=tk.WORD, height=3)
        self.flags_text.grid(row=5, column=1, sticky="ew", pady=(4, 0))
        self.flags_text.configure(state="disabled")
        
        # Extra links
        links_frame = ttk.LabelFrame(detail_frame, text="Link bổ sung", padding=6)
        links_frame.grid(row=1, column=1, sticky="ew", padx=(10, 0), pady=(6, 0))
        links_frame.columnconfigure(0, weight=1)
        self.links_listbox = tk.Listbox(links_frame, height=2)
        self.links_listbox.grid(row=0, column=0, sticky="ew")
        self.links_listbox.bind("<Double-Button-1>", self._on_open_extra_link)
        
        # Summary
        summary_frame = ttk.LabelFrame(detail_frame, text="Văn án", padding=6)
        summary_frame.grid(row=3, column=0, columnspan=2, sticky="nsew", pady=(8, 0))
        summary_frame.columnconfigure(0, weight=1)
        summary_frame.rowconfigure(0, weight=1)
        self.summary_text = scrolledtext.ScrolledText(summary_frame, wrap=tk.WORD, height=12)
        self.summary_text.grid(row=0, column=0, sticky="nsew")
        self.summary_text.configure(state="disabled")
        
        # Bind scroll events
        detail_frame.bind("<Configure>", lambda e: self._update_detail_scroll())
        self.detail_canvas.bind("<MouseWheel>", lambda e: self.detail_canvas.yview_scroll(int(-1 * (e.delta / 120)), "units"))
    
    def _build_tree(self, main_pane):
        """Build book tree."""
        tree_frame = ttk.Frame(main_pane)
        main_pane.add(tree_frame, weight=2)
        tree_frame.columnconfigure(0, weight=1)
        tree_frame.rowconfigure(0, weight=1)
        
        columns = ("title", "status", "updated", "chapters", "new_chapters", "views", "author")
        self.tree = ttk.Treeview(tree_frame, columns=columns, show="headings", selectmode="browse")
        
        column_config = {
            "title": ("Tiêu đề", 240),
            "status": ("Trạng thái", 110),
            "updated": ("Cập nhật", 110),
            "chapters": ("Wiki", 80),
            "new_chapters": ("New", 90),
            "views": ("Lượt xem", 90),
            "author": ("Tác giả", 160)
        }
        
        for col, (label, width) in column_config.items():
            self.tree.heading(col, text=label)
            self.tree.column(col, width=width, anchor="w")
        
        # Tags
        self.tree.tag_configure("has_new", foreground="#16a34a")
        self.tree.tag_configure("not_found", foreground="#ef4444")
        self.tree.tag_configure("server_lower", foreground="#f97316")
        self.tree.tag_configure("high_new", foreground="#dc2626")
        
        self.tree.grid(row=0, column=0, sticky="nsew")
        self.tree.bind("<<TreeviewSelect>>", self._on_tree_select)
        
        tree_scroll = ttk.Scrollbar(tree_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=tree_scroll.set)
        tree_scroll.grid(row=0, column=1, sticky="ns")
    
    # ==================== Public Methods ====================
    
    def refresh_tree(self, books: List[Dict]):
        """Refresh tree với danh sách books."""
        self.tree.delete(*self.tree.get_children())
        self._tree_index = {}
        
        new_map = self.controller.state.new_chapters or {}
        
        for book in books:
            book_id = book.get('id')
            stats = book.get('stats', {}) or {}
            
            # Determine new chapters count
            new_count = ""
            is_high = False
            if book_id and isinstance(new_map, dict):
                val = new_map.get(book_id)
                if isinstance(val, int) and val > 0:
                    new_count = str(val)
                    if val >= 50:
                        is_high = True
            
            # Determine tags
            if book.get("deleted_404"):
                tags = ("not_found",)
            elif book.get("server_lower"):
                tags = ("server_lower",)
            elif new_count:
                tags = ("high_new",) if is_high else ("has_new",)
            else:
                tags = ()
            
            item_id = self.tree.insert(
                "", "end", tags=tags,
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
            self._tree_index[item_id] = book_id
        
        # Select first item
        if books:
            first = self.tree.get_children()[0]
            self.tree.selection_set(first)
            self._on_tree_select()
        
        # Update count
        self.count_var.set(f"Số truyện: {len(books)}")
    
    def refresh_from_state(self):
        """Refresh toàn bộ UI từ state."""
        state = self.controller.state
        self.user_label_var.set(state.data.get('username') or "Chưa đăng nhập")
        self.refresh_tree(state.filtered)
        self.update_filter_status()
    
    def get_filter_values(self) -> Dict[str, Any]:
        """Thu thập giá trị filter từ UI controls."""
        return {
            'search': self.search_var.get().strip(),
            'status': self.status_var.get(),
            'summarySearch': self.summary_var.get().strip(),
            'extraLinkSearch': self.extra_link_var.get().strip(),
            'flags': [flag for flag, var in self.flag_vars.items() if var.get()],
            'roles': [role for role, var in self.role_vars.items() if var.get()],
            'categories': self._get_selected_categories(),
            'fromDate': self.from_date_var.get().strip(),
            'toDate': self.to_date_var.get().strip(),
            'sortBy': self._sort_label_to_value.get(self.sort_label_var.get(), 'recent')
        }
    
    def sync_filter_controls_from_state(self):
        """Đồng bộ UI controls từ state.filters."""
        filters = self.controller.state.filters
        self.search_var.set(filters.get('search', ''))
        self.status_var.set(filters.get('status', 'all'))
        self.summary_var.set(filters.get('summarySearch', ''))
        self.extra_link_var.set(filters.get('extraLinkSearch', ''))
        self.from_date_var.set(filters.get('fromDate', ''))
        self.to_date_var.set(filters.get('toDate', ''))
        
        for flag, var in self.flag_vars.items():
            var.set(flag in filters.get('flags', []))
        for role, var in self.role_vars.items():
            var.set(role in filters.get('roles', []))
        
        sort_value = filters.get('sortBy', 'recent')
        sort_label = self._sort_value_to_label.get(sort_value, WD_SORT_OPTIONS[0][1])
        self.sort_label_var.set(sort_label)
    
    def set_progress(self, message: str, current: int = 0, total: int = 0):
        """Cập nhật progress bar."""
        if not self._progress_visible and message:
            self.progress_frame.grid()
            self._progress_visible = True
            self.cancel_btn.configure(state=tk.NORMAL)
        
        if not message:
            self.progress_frame.grid_remove()
            self._progress_visible = False
            self.cancel_btn.configure(state=tk.DISABLED)
            return
        
        self.progress_label.configure(text=message)
        if total > 0:
            self.progress_bar['value'] = (current / total) * 100
        else:
            self.progress_bar['value'] = 0
    
    def update_filter_status(self):
        """Cập nhật status text của filter."""
        filters = self.controller.state.filters
        parts = []
        if filters.get('search'):
            parts.append(f"Tìm: {filters['search']}")
        if filters.get('status') != 'all':
            parts.append(f"TT: {filters['status']}")
        if filters.get('categories'):
            parts.append(f"{len(filters['categories'])} thể loại")
        
        status = ", ".join(parts) if parts else ""
        self.ticker_var.set(f"Đang lọc: {status}" if status else "")
    
    def get_selected_book(self) -> Optional[Dict]:
        """Lấy book đang được chọn trong tree."""
        selection = self.tree.selection()
        if not selection:
            return None
        book_id = self._tree_index.get(selection[0])
        if book_id:
            return self.controller.get_book_by_id(book_id)
        return None
    
    # ==================== Private Helpers ====================
    
    def _get_selected_categories(self) -> List[str]:
        """Lấy categories đang được chọn."""
        indices = self.category_listbox.curselection()
        return [self._category_options[i] for i in indices if i < len(self._category_options)]
    
    def _update_filter_scroll(self):
        """Update filter canvas scroll region."""
        self.filter_canvas.configure(scrollregion=self.filter_canvas.bbox("all"))
    
    def _update_detail_scroll(self):
        """Update detail canvas scroll region."""
        self.detail_canvas.configure(scrollregion=self.detail_canvas.bbox("all"))
        self.detail_canvas.itemconfigure(self._detail_window, width=self.detail_canvas.winfo_width())
    
    def _on_filter_canvas_configure(self, event):
        """Handle filter canvas resize."""
        self.filter_canvas.itemconfigure(self._filter_window_id, width=event.width)
        self._update_filter_scroll()
    
    def _on_filter_mousewheel(self, event):
        """Handle mousewheel on filter canvas."""
        if event.delta:
            self.filter_canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
    
    # ==================== Event Handlers (delegate to Controller or App) ====================
    
    def _on_fetch_works(self):
        if hasattr(self.app, '_wd_start_fetch_works'):
            self.app._wd_start_fetch_works()
    
    def _on_fetch_details(self):
        if hasattr(self.app, '_wd_prompt_detail_fetch'):
            self.app._wd_prompt_detail_fetch()
    
    def _on_apply_filters(self):
        self.controller.state.filters = self.get_filter_values()
        self.controller.apply_filters()
    
    def _on_reset_filters(self):
        self.controller.reset_filters()
    
    def _on_check_updates(self):
        if hasattr(self.app, '_wd_prompt_check_updates'):
            self.app._wd_prompt_check_updates()
    
    def _on_toggle_basic_section(self):
        if hasattr(self.app, '_wd_toggle_basic_section'):
            self.app._wd_toggle_basic_section()
    
    def _on_toggle_advanced_section(self):
        if self._adv_section_visible:
            self.adv_container.grid_remove()
            self.adv_toggle_btn.configure(text="Hiện lọc nâng cao")
        else:
            self.adv_container.grid()
            self.adv_toggle_btn.configure(text="Ẩn lọc nâng cao")
        self._adv_section_visible = not self._adv_section_visible
        self._update_filter_scroll()
    
    def _on_switch_site(self, site: str):
        if hasattr(self.app, '_wd_switch_site'):
            self.app._wd_switch_site(site)
    
    def _on_profile_change(self, event=None):
        if hasattr(self.app, '_wd_on_profile_change'):
            self.app._wd_on_profile_change()
    
    def _on_cancel(self):
        self.controller.request_cancel()
    
    def _on_tree_select(self, event=None):
        book = self.get_selected_book()
        if book:
            self._show_detail(book)
    
    def _on_open_book(self):
        if hasattr(self.app, '_wd_open_book_in_browser'):
            self.app._wd_open_book_in_browser()
    
    def _on_edit_book(self):
        if hasattr(self.app, '_wd_open_wiki_edit_uploader'):
            self.app._wd_open_wiki_edit_uploader()
    
    def _on_chapter_list(self):
        if hasattr(self.app, '_wd_open_chapter_list'):
            self.app._wd_open_chapter_list()
    
    def _on_update_chapters(self):
        if hasattr(self.app, '_wd_open_update_dialog'):
            self.app._wd_open_update_dialog()
    
    def _on_book_note(self):
        if hasattr(self.app, '_wd_open_local_note'):
            self.app._wd_open_local_note()
    
    def _on_delete_book(self):
        if hasattr(self.app, '_wd_delete_book'):
            self.app._wd_delete_book()
    
    def _on_open_notes(self):
        if hasattr(self.app, '_wd_open_global_notes'):
            self.app._wd_open_global_notes()
    
    def _on_open_library(self):
        if hasattr(self.app, '_lib_open_library_window'):
            self.app._lib_open_library_window()
    
    def _on_open_links(self):
        if hasattr(self.app, '_wd_open_global_links'):
            self.app._wd_open_global_links()
    
    def _on_open_settings(self):
        if hasattr(self.app, '_open_api_settings_dialog'):
            self.app._open_api_settings_dialog()
    
    def _on_pick_date(self, var, title):
        if hasattr(self.app, '_wd_open_date_picker'):
            self.app._wd_open_date_picker(var, title)
    
    def _on_open_extra_link(self, event=None):
        if hasattr(self.app, '_wd_open_extra_link'):
            self.app._wd_open_extra_link(event)
    
    def _show_detail(self, book: Dict):
        """Hiển thị chi tiết book."""
        # Update title
        self.title_text.configure(state="normal")
        self.title_text.delete("1.0", tk.END)
        self.title_text.insert("1.0", book.get('title', 'Không có tiêu đề'))
        self.title_text.configure(state="disabled")
        
        # Update info
        self.info_vars['author'].set(book.get('author', ''))
        self.info_vars['status'].set(book.get('status', ''))
        self.info_vars['updated'].set(book.get('updated_text', ''))
        self.info_vars['chapters'].set(str(book.get('chapters', '')))
        
        # Update collections
        self.collections_text.configure(state="normal")
        self.collections_text.delete("1.0", tk.END)
        self.collections_text.insert("1.0", ", ".join(book.get('collections', [])))
        self.collections_text.configure(state="disabled")
        
        # Update summary
        self.summary_text.configure(state="normal")
        self.summary_text.delete("1.0", tk.END)
        self.summary_text.insert("1.0", book.get('summary', ''))
        self.summary_text.configure(state="disabled")
        
        # Update links
        self.links_listbox.delete(0, tk.END)
        self._current_links = book.get('extra_links', [])
        for link in self._current_links:
            self.links_listbox.insert(tk.END, link.get('label', link.get('url', '')))
