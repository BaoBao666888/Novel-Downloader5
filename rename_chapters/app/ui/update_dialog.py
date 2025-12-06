# update.py
import os
import sys
import threading
import tempfile
import urllib.request
import subprocess
import re
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import tkinter.font as tkfont
import webbrowser

from app.paths import BASE_DIR

# -----------------------
# Private helpers
# -----------------------
# update.py

def _render_simplified_html(text_widget, html_text):
    """
    Render một file HTML đơn giản, hỗ trợ các tag:
    <h1>, <h2>, <b>, và <c color="#..."></c> (ĐÃ SỬA LỖI)
    """
    # --- Cấu hình font và tag cho Text Widget ---
    text_widget.config(state='normal')
    text_widget.delete('1.0', tk.END)

    base_font = tkfont.Font(font=text_widget.cget("font"))
    h1_font = tkfont.Font(font=base_font)
    h1_font.configure(size=base_font.cget('size') + 4, weight='bold')
    h2_font = tkfont.Font(font=base_font)
    h2_font.configure(weight='bold')

    text_widget.tag_configure('h1', font=h1_font, foreground="#0b5394", spacing1=5, spacing3=10)
    text_widget.tag_configure('h2', font=h2_font, foreground="#2e7d32", spacing1=10, spacing3=5)
    text_widget.tag_configure('b', font=h2_font)

    # --- Regex để tìm tất cả các tag được hỗ trợ ---
    tag_regex = re.compile(r'<(?:h1|h2|b)>(.*?)</(?:h1|h2|b)>|<c color="(.*?)">(.*?)</c>')
    last_end = 0

    # Xóa các dòng trống ở đầu file HTML để tránh lỗi hiển thị
    html_text = html_text.strip()

    for match in tag_regex.finditer(html_text):
        # Chèn phần text thường nằm giữa các tag
        text_widget.insert(tk.END, html_text[last_end:match.start()])

        # === PHẦN SỬA LỖI ===
        # Dựa vào group nào có kết quả để xác định đúng loại tag
        if match.group(1) is not None:  # Khớp với <h1>, <h2>, hoặc <b>
            content = match.group(1)
            full_tag_str = match.group(0)
            if full_tag_str.startswith('<h1>'):
                text_widget.insert(tk.END, content + "\n", 'h1')
            elif full_tag_str.startswith('<h2>'):
                text_widget.insert(tk.END, content + "\n", 'h2')
            else: # <b>
                text_widget.insert(tk.END, content, 'b')
        elif match.group(2) is not None:  # Khớp với <c color="...">
            color, content = match.group(2), match.group(3)
            tag_name = f"color_{color.replace('#', '')}"
            text_widget.tag_configure(tag_name, foreground=color)
            text_widget.insert(tk.END, content, tag_name)
        # =======================

        last_end = match.end()

    # Chèn phần text còn lại sau tag cuối cùng
    text_widget.insert(tk.END, html_text[last_end:])
    # Thêm một dòng trống ở cuối cho đẹp
    text_widget.insert(tk.END, "\n")
    text_widget.config(state='disabled')

    
# -----------------------
# Public API
# -----------------------
def fetch_manifest_from_url(url, timeout=10):
    """
    Tải manifest JSON từ URL, và nếu manifest có key 'notes_file' thì
    tải nội dung notes (từ URL hoặc file local) và gán vào manifest['notes'].
    Trả về dict hoặc None khi lỗi.
    """
    import json
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            raw = r.read().decode('utf-8')
            manifest = json.loads(raw)
    except Exception:
        return None

    # Nếu manifest có notes_file, tải nội dung của nó (hỗ trợ URL hoặc local path)
    notes_file = manifest.get('notes_file')
    if notes_file:
        try:
            if isinstance(notes_file, str) and notes_file.lower().startswith(('http://', 'https://')):
                # Tải từ web
                with urllib.request.urlopen(notes_file, timeout=timeout) as r:
                    notes_text = r.read().decode('utf-8')
                manifest['notes'] = notes_text
            else:
                # coi như là đường dẫn local (relative hoặc absolute)
                try:
                    # nếu là relative path, tìm theo working dir
                    with open(notes_file, 'r', encoding='utf-8') as nf:
                        manifest['notes'] = nf.read()
                except FileNotFoundError:
                    # thử interpret như relative to script dir
                    alt_path = os.path.join(BASE_DIR, notes_file)
                    with open(alt_path, 'r', encoding='utf-8') as nf:
                        manifest['notes'] = nf.read()
        except Exception:
            # Không quá quan trọng — chỉ bỏ qua notes nếu không tải được
            manifest['notes'] = manifest.get('notes', '')
    return manifest

def show_update_window(root, manifest):
    """
    Hiển thị Toplevel dialog báo có bản cập nhật.
    - root: cửa sổ Tk chính (để có parent)
    - manifest: dict có keys: 'version', 'url', 'notes' (notes có thể là HTML)
    """
    if manifest is None:
        return

    version = manifest.get('version', 'N/A')
    url = manifest.get('url', None)
    notes = manifest.get('notes', '')

    win = tk.Toplevel(root)
    try:
        if hasattr(root, "_apply_window_icon"):
            root._apply_window_icon(win)
    except Exception:
        pass
    win.title(f"Cập nhật phiên bản {version}")
    win.geometry("780x520")
    win.transient(root)
    win.grab_set()

    header = ttk.Frame(win)
    header.pack(fill=tk.X, padx=12, pady=8)
    ttk.Label(header, text=f"Phiên bản {version} đã có", font=('Segoe UI', 14, 'bold')).pack(side=tk.LEFT)
    ttk.Label(header, text="  —  Nhấn Tải & Cài đặt để cập nhật", foreground='#555').pack(side=tk.LEFT, padx=8)

    text_frame = ttk.Frame(win)
    text_frame.pack(fill=tk.BOTH, expand=True, padx=12)

    # progress + buttons
    ctl = ttk.Frame(win)
    ctl.pack(fill=tk.X, padx=12, pady=10)

    progress = ttk.Progressbar(ctl, orient='horizontal', mode='determinate')
    progress.pack(fill=tk.X, side=tk.LEFT, expand=True, padx=(0,8))

    btn_frame = ttk.Frame(ctl)
    btn_frame.pack(side=tk.RIGHT)
    btn_install = ttk.Button(btn_frame, text="Tải & Cài đặt")
    btn_browser = ttk.Button(btn_frame, text="Mở bằng trình duyệt") 
    btn_cancel = ttk.Button(btn_frame, text="Đóng", command=win.destroy)

    btn_install.grid(row=0, column=0, padx=6)
    btn_browser.grid(row=0, column=1, padx=6) 
    btn_cancel.grid(row=0, column=2) 

    status_lbl = ttk.Label(win, text="", font=('Segoe UI', 9))
    status_lbl.pack(fill=tk.X, padx=12, pady=(0,8))

    # ScrolledText fallback (parser nhẹ)
    txt = scrolledtext.ScrolledText(text_frame, wrap=tk.WORD)
    txt.pack(fill=tk.BOTH, expand=True)

    if isinstance(notes, str) and notes.strip().startswith('<'):
        # render parsed summary in text widget, but prefer browser for full fidelity
        _render_simplified_html(txt, notes)
    else:
        txt.insert('1.0', notes)
        txt.config(state='disabled')

    def _download_and_launch():
        if not url:
            messagebox.showerror("Lỗi", "Không có URL bản cài trong manifest.")
            btn_install.config(state='normal')
            return
        btn_install.config(state='disabled')
        status_lbl.config(text="Bắt đầu tải...")
        try:
            temp_dir = tempfile.gettempdir()
            fname = os.path.basename(url.split('?')[0]) or f"installer_{version}.exe"
            out_path = os.path.join(temp_dir, fname)

            # stream download
            req = urllib.request.urlopen(url, timeout=30)
            total = req.getheader('Content-Length')
            if total:
                total = int(total.strip())
            else:
                total = None

            CHUNK = 8192
            downloaded = 0
            # If unknown total, set indeterminate mode
            if not total:
                progress.config(mode='indeterminate')
                try:
                    progress.start(20)
                except Exception:
                    pass
            else:
                progress.config(mode='determinate', maximum=total, value=0)

            with open(out_path, 'wb') as out:
                while True:
                    chunk = req.read(CHUNK)
                    if not chunk:
                        break
                    out.write(chunk)
                    downloaded += len(chunk)
                    if total:
                        try:
                            progress['value'] = downloaded
                            status_lbl.config(text=f"Đã tải: {downloaded//1024} KB / {total//1024} KB")
                        except Exception:
                            pass

            # stop indeterminate if used
            try:
                progress.stop()
            except Exception:
                pass

            status_lbl.config(text=f"Tải xong: {out_path}")

            # Launch installer
            try:
                if sys.platform.startswith('win'):
                    os.startfile(out_path)
                else:
                    subprocess.Popen(['chmod', '+x', out_path])
                    subprocess.Popen([out_path])
            except Exception:
                # fallback
                try:
                    subprocess.Popen([out_path], shell=True)
                except Exception:
                    messagebox.showinfo("Lưu ý", f"Đã tải file tại: {out_path}. Hãy chạy thủ công.")
                    return

            status_lbl.config(text="Đã khởi chạy bộ cài. Ứng dụng sẽ đóng để tiến hành cập nhật.")
            # Delay a bit then close the main app
            def _close_app():
                try:
                    root.quit()
                    root.destroy()
                except Exception:
                    os._exit(0)
            win.after(800, _close_app)

        except Exception as e:
            messagebox.showerror("Lỗi tải", f"Không tải được file: {e}")
            btn_install.config(state='normal')
            status_lbl.config(text=f"Lỗi: {e}")

    def _on_install_click():
        t = threading.Thread(target=_download_and_launch, daemon=True)
        t.start()

    btn_install.config(command=_on_install_click)

    def _open_in_browser_and_quit():
        if not url:
            messagebox.showerror("Lỗi", "Không có URL tải xuống trong manifest.")
            return

        try:
            webbrowser.open(url, new=2)  # Mở URL trong tab mới của trình duyệt
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể mở trình duyệt: {e}")
            return # Không đóng app nếu không mở được trình duyệt

        # Hàm đóng ứng dụng chính
        def _close_app():
            try:
                root.quit()
                root.destroy()
            except Exception:
                os._exit(0)

        status_lbl.config(text="Đã mở link trong trình duyệt. Ứng dụng sẽ đóng.")
        win.after(800, _close_app) # Chờ 0.8s rồi đóng app

    btn_browser.config(command=_open_in_browser_and_quit) # Gán lệnh cho nút
    # Return control to caller (no mainloop here)
    return win
