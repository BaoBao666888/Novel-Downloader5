import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
import json
import os
from app.paths import BASE_DIR

LIBRARY_FILE = os.path.join(BASE_DIR, "local", "library.json")

class LibraryMixin:
    def _lib_get_book_folders(self, book):
        folders = book.get("folders")
        if isinstance(folders, list):
            return [f for f in folders if isinstance(f, str) and f]
        folder = book.get("folder")
        if isinstance(folder, str) and folder:
            return [folder]
        return []

    def _lib_set_book_folders(self, book, folders):
        clean = [f for f in folders if isinstance(f, str) and f]
        book["folders"] = clean
        book["folder"] = clean[0] if len(clean) == 1 else ""

    def _lib_ensure_data(self):
        if not hasattr(self, "_lib_data") or not isinstance(self._lib_data, dict):
            self._lib_data = self._lib_load_data()

    def _lib_open_library_window(self):
        if hasattr(self, "_lib_window") and self._lib_window.winfo_exists():
            self._lib_window.lift()
            return
            
        win = tk.Toplevel(self)
        win.title("Thư viện")
        win.geometry("900x600")
        self._lib_window = win
        
        self._lib_data = self._lib_load_data()
        self._build_library_ui(win)
        self._lib_refresh_tree()

    def _lib_load_data(self):
        if not os.path.exists(LIBRARY_FILE):
            return {"folders": ["Đang đọc", "Hoàn thành", "Tạm dừng"], "books": []}
        try:
            with open(LIBRARY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {"folders": ["Đang đọc", "Hoàn thành", "Tạm dừng"], "books": []}

    def _lib_save_data(self):
        try:
            os.makedirs(os.path.dirname(LIBRARY_FILE), exist_ok=True)
            with open(LIBRARY_FILE, 'w', encoding='utf-8') as f:
                json.dump(self._lib_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            self.log(f"[Library] Lỗi lưu dữ liệu: {e}")

    def _build_library_ui(self, tab):
        # Layout: Left (Folders List), Right (Books List)
        paned = ttk.PanedWindow(tab, orient=tk.HORIZONTAL)
        paned.pack(fill=tk.BOTH, expand=True)

        # Left Panel (Folders)
        left_frame = ttk.LabelFrame(paned, text="Danh mục", padding=5)
        paned.add(left_frame, weight=1)
        
        btn_row = ttk.Frame(left_frame)
        btn_row.pack(fill=tk.X, pady=(0, 5))
        ttk.Button(btn_row, text="Thêm", width=6, command=self._lib_add_folder_prompt).pack(side=tk.LEFT, padx=(0, 2))
        ttk.Button(btn_row, text="Xóa", width=6, command=self._lib_delete_folder).pack(side=tk.LEFT)

        self.lib_folder_list = tk.Listbox(left_frame, exportselection=False)
        self.lib_folder_list.pack(fill=tk.BOTH, expand=True)
        self.lib_folder_list.bind("<<ListboxSelect>>", self._lib_on_folder_select)

        # Right Panel (Books)
        right_frame = ttk.LabelFrame(paned, text="Truyện", padding=5)
        paned.add(right_frame, weight=4)

        r_btn_row = ttk.Frame(right_frame)
        r_btn_row.pack(fill=tk.X, pady=(0, 5))
        self.lib_move_btn = ttk.Button(r_btn_row, text="Di chuyển...", command=self._lib_move_book_prompt, state=tk.DISABLED)
        self.lib_move_btn.pack(side=tk.LEFT, padx=(0, 5))
        self.lib_del_book_btn = ttk.Button(r_btn_row, text="Xóa khỏi thư viện", command=self._lib_delete_book, state=tk.DISABLED)
        self.lib_del_book_btn.pack(side=tk.LEFT)
        self.lib_read_btn = ttk.Button(r_btn_row, text="Đọc / Chi tiết", command=self._lib_open_book, state=tk.DISABLED)
        self.lib_read_btn.pack(side=tk.LEFT, padx=(5, 0))
        
        ttk.Separator(r_btn_row, orient=tk.VERTICAL).pack(side=tk.LEFT, padx=10, fill=tk.Y)
        
        self.lib_add_match_btn = ttk.Button(r_btn_row, text="Thêm từ KQ lọc", command=self._lib_add_from_filter, state=tk.NORMAL)
        self.lib_add_match_btn.pack(side=tk.LEFT)
        
        self.lib_filter_main_btn = ttk.Button(r_btn_row, text="Xem tại bảng chính", command=self._lib_filter_main_tree, state=tk.DISABLED)
        self.lib_filter_main_btn.pack(side=tk.LEFT, padx=(5,0))

        columns = ("title", "author", "chapters", "status", "updated")
        self.lib_tree_frame = ttk.Frame(right_frame)
        self.lib_tree_frame.pack(fill=tk.BOTH, expand=True)
        
        self.lib_tree = ttk.Treeview(self.lib_tree_frame, columns=columns, show="headings", selectmode="extended")
        self.lib_tree.heading("title", text="Tiêu đề")
        self.lib_tree.column("title", width=250)
        self.lib_tree.heading("author", text="Tác giả")
        self.lib_tree.column("author", width=120)
        self.lib_tree.heading("chapters", text="Số chương")
        self.lib_tree.column("chapters", width=80)
        self.lib_tree.heading("status", text="Trạng thái")
        self.lib_tree.column("status", width=80)
        self.lib_tree.heading("updated", text="Cập nhật")
        self.lib_tree.column("updated", width=100)
        
        lib_scroll = ttk.Scrollbar(self.lib_tree_frame, orient="vertical", command=self.lib_tree.yview)
        self.lib_tree.configure(yscrollcommand=lib_scroll.set)
        
        self.lib_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        lib_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.lib_tree.bind("<<TreeviewSelect>>", self._lib_on_book_select)
        
        # Drag and Drop bindings
        self.lib_tree.bind("<Button-1>", self._lib_drag_start)
        self.lib_tree.bind("<B1-Motion>", self._lib_drag_motion)
        self.lib_tree.bind("<ButtonRelease-1>", self._lib_drag_stop)

    def _lib_refresh_folders(self):
        self.lib_folder_list.delete(0, tk.END)
        self.lib_folder_list.insert(tk.END, "Tất cả")
        for f in self._lib_data.get("folders", []):
            self.lib_folder_list.insert(tk.END, f)
        # Select first
        self.lib_folder_list.selection_set(0)
        self._lib_on_folder_select()

    def _lib_refresh_tree(self, filter_folder=None):
        # If not init called yet or window closed
        if not hasattr(self, "lib_folder_list"):
            return
        try:
            if not self.lib_folder_list.winfo_exists():
                return
        except Exception:
            return
        
        # Reload folders list if needed (basic check)
        try:
            if self.lib_folder_list.size() == 0:
                self._lib_refresh_folders()
                return
        except Exception:
            return

        self.lib_tree.delete(*self.lib_tree.get_children())
        books = self._lib_data.get("books", [])
        
        for book in books:
            if filter_folder and filter_folder != "Tất cả":
                folders = self._lib_get_book_folders(book)
                if filter_folder not in folders:
                    continue
            
            self.lib_tree.insert("", "end", values=(
                book.get("title", ""),
                book.get("author", ""),
                book.get("chapters", ""),
                book.get("status", ""),
                book.get("updated_text", "")
            ), tags=(book.get("id"),))

    def _lib_on_folder_select(self, event=None):
        sel = self.lib_folder_list.curselection()
        if not sel: return
        folder = self.lib_folder_list.get(sel[0])
        self._lib_refresh_tree(folder)
        self._lib_current_folder = folder

    def _lib_on_book_select(self, event=None):
        sel = self.lib_tree.selection()
        state = tk.NORMAL if sel else tk.DISABLED
        self.lib_move_btn.config(state=state)
        self.lib_del_book_btn.config(state=state)
        self.lib_read_btn.config(state=state)
        # self.lib_filter_main_btn.config(state=tk.NORMAL) # This button is always valid if folder has books, or based on folder selection?
        # Actually it filters based on folder, so it depends on folder not selection.
        # But wait, button says "Xem tại bảng chính".
        self.lib_filter_main_btn.config(state=tk.NORMAL if self.lib_tree.get_children() else tk.DISABLED)

    def _lib_add_from_filter(self):
        # Add all books currently in the MAIN wikidich tree to the current library folder
        if not hasattr(self, "wd_tree"):
             messagebox.showinfo("Lỗi", "Không tìm thấy dữ liệu bảng chính.", parent=self._lib_window)
             return
             
        # Get items from wd_tree
        # Items in tree are usually filtered.
        # But we need the book data.
        # self.wd_tree contains IDs in tags? No, usually I insert ID as first value or tag.
        # Inspect wikidich_mixin._wd_refresh_tree: tags=(id,) or similar?
        # In _wd_refresh_tree: tags = (tags from logic)
        # But I don't store ID in tags exclusively.
        # However, self.wikidich_filtered contains the list of books currently shown!
        
        books = getattr(self, "wikidich_filtered", [])
        if not books:
            # Fallback to full list if no filter active? No, usually filtered is set.
            # If nil, maybe full list.
            books = getattr(self, "wikidich_data", {}).get("books", {}).values()
            
        if not books:
            messagebox.showinfo("Trống", "Không có truyện nào để thêm.", parent=self._lib_window)
            return
            
        folder = getattr(self, "_lib_current_folder", "")
        if folder == "Tất cả":
            folder = ""
        
        count = 0
        for b in books:
            bid = b.get("id")
            if not bid:
                continue
            existing = next((x for x in self._lib_data["books"] if x.get("id") == bid), None)
            if existing:
                if folder:
                    current_folders = self._lib_get_book_folders(existing)
                    if folder not in current_folders:
                        self._lib_set_book_folders(existing, current_folders + [folder])
                        count += 1
                continue
            new_entry = {
                "id": bid,
                "title": b.get("title"),
                "author": b.get("author"),
                "chapters": b.get("chapters"),
                "status": b.get("status"),
                "updated_text": b.get("updated_text"),
                "folders": [folder] if folder else [],
                "url": b.get("url")
            }
            self._lib_data["books"].append(new_entry)
            count += 1
            
        if count > 0:
            self._lib_save_data()
            self._lib_refresh_tree(getattr(self, "_lib_current_folder", "Tất cả"))
            messagebox.showinfo("Thành công", f"Đã thêm {count} truyện vào thư viện.", parent=self._lib_window)
        else:
             messagebox.showinfo("Thông báo", "Không có truyện mới nào được thêm (đã tồn tại).", parent=self._lib_window)

    def _lib_filter_main_tree(self):
        # Filter the main tree to show only books in current library folder.
        # Get IDs in current folder
        try:
            current_folder = getattr(self, "_lib_current_folder", "Tất cả")
            # Get IDs
            target_ids = []
            for b in self._lib_data["books"]:
                if current_folder == "Tất cả":
                    target_ids.append(b.get("id"))
                    continue
                folders = self._lib_get_book_folders(b)
                if current_folder in folders:
                    target_ids.append(b.get("id"))
            
            if not target_ids:
                messagebox.showinfo("Trống", "Danh mục hiện tại không có truyện.", parent=self._lib_window)
                return
                
            # Filter main
            # We construct a list of books from main data that match IDs
            main_books = self.wikidich_data.get("books", {})
            filtered = []
            for bid in target_ids:
                if bid in main_books:
                    filtered.append(main_books[bid])
            
            # Update main tree
            self.wikidich_filtered = filtered # Set this so other ops work
            self._wd_refresh_tree(filtered)
            
            # Switch to main window?
            self.notebook.select(self._wd_tabs["wikidich"])
            
            # Update status label to indicate filtering
            if hasattr(self, "wd_adv_status_var"):
                 self.wd_adv_status_var.set(f"Đang lọc từ thư viện: {current_folder}")
                 # Force basic toggle if collapsed so user sees the status? 
                 # Maybe not force, but user requested "hiện trạng thái... như lọc cơ bản".
                 # The status usually helps.
            
            # Maybe minimize lib?
            # self._lib_window.iconify()
        except Exception as e:
            self.log(f"Lỗi filter main: {e}")

    def _lib_add_folder_prompt(self):
        name = simpledialog.askstring("Thêm danh mục", "Tên danh mục mới:", parent=self)
        if name and name.strip():
            folders = self._lib_data.get("folders", [])
            if name in folders:
                messagebox.showerror("Lỗi", "Danh mục đã tồn tại.", parent=self)
                return
            folders.append(name.strip())
            self._lib_data["folders"] = folders
            self._lib_save_data()
            self._lib_refresh_folders()

    def _lib_delete_folder(self):
        sel = self.lib_folder_list.curselection()
        if not sel: return
        folder = self.lib_folder_list.get(sel[0])
        if folder == "Tất cả":
            messagebox.showinfo("Thông báo", "Không thể xóa danh mục mặc định.", parent=self)
            return
        if not messagebox.askyesno("Xác nhận", f"Xóa danh mục '{folder}'? Các truyện trong danh mục này sẽ chuyển về 'Tất cả' (không có danh mục).", parent=self):
            return
        
        # Remove folder
        if folder in self._lib_data["folders"]:
            self._lib_data["folders"].remove(folder)
        
        # Update books
        for book in self._lib_data["books"]:
            folders = self._lib_get_book_folders(book)
            if folder in folders:
                folders = [f for f in folders if f != folder]
                self._lib_set_book_folders(book, folders)
        
        self._lib_save_data()
        self._lib_refresh_folders()

    def _lib_move_book_prompt(self):
        sel = self.lib_tree.selection()
        if not sel: return
        
        # Get list of folders
        folders = self._lib_data.get("folders", [])
        if not folders:
            messagebox.showinfo("Lỗi", "Chưa có danh mục nào.", parent=self)
            return
            
        # Create dialog to pick folder
        win = tk.Toplevel(self)
        win.title("Chuyển danh mục")
        ttk.Label(win, text="Chọn danh mục:").pack(padx=10, pady=5)
        
        folder_var = tk.StringVar(value=folders[0])
        cb = ttk.Combobox(win, textvariable=folder_var, values=folders, state="readonly")
        cb.pack(padx=10, pady=5)
        
        def _confirm():
            target = folder_var.get()
            target_ids = []
            for item in sel:
                tags = self.lib_tree.item(item, "tags")
                if tags:
                    target_ids.append(tags[0])
            
            count = 0
            for book in self._lib_data["books"]:
                if book.get("id") in target_ids:
                    self._lib_set_book_folders(book, [target] if target else [])
                    count += 1
            
            self._lib_save_data()
            self._lib_refresh_tree(getattr(self, "_lib_current_folder", "Tất cả"))
            win.destroy()
            self.log(f"[Library] Đã chuyển {count} truyện sang {target}")

        ttk.Button(win, text="OK", command=_confirm).pack(pady=10)

    def _lib_delete_book(self):
        sel = self.lib_tree.selection()
        if not sel: return
        if not messagebox.askyesno("Xác nhận", f"Xóa {len(sel)} truyện khỏi thư viện?", parent=self):
            return
            
        target_ids = []
        for item in sel:
            tags = self.lib_tree.item(item, "tags")
            if tags:
                target_ids.append(tags[0])
            
        original_len = len(self._lib_data["books"])
        self._lib_data["books"] = [b for b in self._lib_data["books"] if b.get("id") not in target_ids]
        
        if len(self._lib_data["books"]) < original_len:
            self._lib_save_data()
            self._lib_refresh_tree(getattr(self, "_lib_current_folder", "Tất cả"))

    def _lib_add_book_from_data(self, book_data, folders=None):
        self._lib_ensure_data()
        book_id = book_data.get("id")
        if not book_id:
            return
        if folders is None:
            current = getattr(self, "_lib_current_folder", "")
            if current == "Tất cả":
                current = ""
            folders = [current] if current else []
        folders = [f for f in folders if isinstance(f, str) and f]

        existing = next((b for b in self._lib_data["books"] if b.get("id") == book_id), None)
        if existing:
            current_folders = self._lib_get_book_folders(existing)
            merged = list(dict.fromkeys(current_folders + folders))
            self._lib_set_book_folders(existing, merged)
            self._lib_save_data()
            if hasattr(self, "lib_folder_list") and self.lib_folder_list.winfo_exists():
                self._lib_refresh_tree(getattr(self, "_lib_current_folder", "Tất cả"))
            if folders:
                messagebox.showinfo("Đã cập nhật", "Đã thêm truyện vào thư viện đã chọn.", parent=self)
            else:
                messagebox.showinfo("Đã có", "Truyện này đã có trong thư viện.", parent=self)
            return

        new_entry = {
            "id": book_id,
            "title": book_data.get("title"),
            "author": book_data.get("author"),
            "chapters": book_data.get("chapters"),
            "status": book_data.get("status"),
            "updated_text": book_data.get("updated_text"),
            "folders": folders,
            "url": book_data.get("url")
        }
        self._lib_data["books"].append(new_entry)
        self._lib_save_data()
        if hasattr(self, "lib_folder_list") and self.lib_folder_list.winfo_exists():
            self._lib_refresh_tree(getattr(self, "_lib_current_folder", "Tất cả"))
        messagebox.showinfo("Thành công", "Đã thêm vào thư viện.", parent=self)

    def _lib_prompt_add_to_folders(self, book_data):
        self._lib_ensure_data()
        folders = [f for f in self._lib_data.get("folders", []) if isinstance(f, str) and f]
        if not folders:
            messagebox.showinfo("Trống", "Chưa có thư viện nào. Vui lòng tạo thư viện trước.", parent=self)
            return

        win = tk.Toplevel(self)
        win.title("Chọn thư viện")
        win.geometry("360x360")
        win.transient(self)
        win.grab_set()

        ttk.Label(win, text="Chọn thư viện để thêm:").pack(anchor="w", padx=10, pady=(10, 6))
        listbox = tk.Listbox(win, selectmode="multiple")
        listbox.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 10))
        for name in folders:
            listbox.insert(tk.END, name)

        btn_frame = ttk.Frame(win)
        btn_frame.pack(fill=tk.X, padx=10, pady=(0, 10))
        btn_frame.columnconfigure(1, weight=1)

        def _confirm():
            sel = listbox.curselection()
            if not sel:
                messagebox.showinfo("Thiếu lựa chọn", "Chọn ít nhất một thư viện.", parent=win)
                return
            selected = [folders[i] for i in sel]
            self._lib_add_book_from_data(book_data, folders=selected)
            win.destroy()

        ttk.Button(btn_frame, text="Hủy", command=win.destroy).grid(row=0, column=0, sticky="w")
        ttk.Button(btn_frame, text="OK", command=_confirm).grid(row=0, column=2, sticky="e")

    def _lib_open_book(self):
        sel = self.lib_tree.selection()
        if not sel: return
        tags = self.lib_tree.item(sel[0], "tags")
        if not tags: return
        book_id = tags[0]
        
        found = next((b for b in self._lib_data["books"] if b.get("id") == book_id), None)
        if not found:
            return

        url = found.get("url", "")
        site = "wikidich"
        if "koanchay" in url:
            site = "koanchay"
        
        # Switch tab
        if hasattr(self, "_wd_switch_site"):
             self._wd_switch_site(site)
        
        # Check if we have fresher data in the active site cache
        if hasattr(self, "wikidich_data") and isinstance(self.wikidich_data.get("books"), dict):
            cached = self.wikidich_data["books"].get(book_id)
            if cached:
                found = cached
        
        if hasattr(self, "_wd_show_detail"):
            self._wd_show_detail(found)

    # --- Drag and Drop Logic ---
    def _lib_drag_start(self, event):
        tv = self.lib_tree
        region = tv.identify("region", event.x, event.y)
        if region != "cell":
            return
        item = tv.identify_row(event.y)
        if not item:
            return
        self._lib_dragged_item = item

    def _lib_drag_motion(self, event):
        if not hasattr(self, "_lib_dragged_item"):
            return
        tv = self.lib_tree
        item = tv.identify_row(event.y)
        if item:
             tv.selection_set(item)

    def _lib_drag_stop(self, event):
        if not hasattr(self, "_lib_dragged_item"):
             return
        source = self._lib_dragged_item
        del self._lib_dragged_item
        try:
            tv = self.lib_tree
            target = tv.identify_row(event.y)
            if not target or target == source:
                 return
            self._lib_move_book_order(source, target)
        except Exception:
            pass
        
    def _lib_move_book_order(self, source_iid, target_iid):
        # We need to map iid to book entries in self._lib_data
        try:
            s_tags = self.lib_tree.item(source_iid, "tags")
            t_tags = self.lib_tree.item(target_iid, "tags")
        except Exception:
            return
        
        if not s_tags or not t_tags: 
            return
            
        sid = s_tags[0]
        tid = t_tags[0]
        
        books = self._lib_data["books"]
        s_idx = -1
        t_idx = -1
        
        for i, b in enumerate(books):
            if str(b.get("id")) == str(sid): s_idx = i
            if str(b.get("id")) == str(tid): t_idx = i
            
        if s_idx == -1 or t_idx == -1: 
            return
        
        # Move item
        item = books.pop(s_idx)
        if s_idx < t_idx:
            t_idx -= 1
        books.insert(t_idx, item)
        
        self._lib_save_data()
        current_folder = getattr(self, "_lib_current_folder", "Tất cả")
        self._lib_refresh_tree(current_folder)
