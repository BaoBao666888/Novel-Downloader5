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
from html.parser import HTMLParser

from app.paths import BASE_DIR

# -----------------------
# Private helpers
# -----------------------
LOCAL_UPDATE_NOTES_PATH = os.path.join(BASE_DIR, "update_notes.html")


def _read_local_update_notes() -> str:
    try:
        with open(LOCAL_UPDATE_NOTES_PATH, "r", encoding="utf-8") as handle:
            return handle.read()
    except Exception:
        return ""


def _download_text(url: str, timeout: int = 10) -> str:
    with urllib.request.urlopen(url, timeout=timeout) as response:
        return response.read().decode("utf-8")


def load_update_notes_for_manifest(manifest: dict, timeout: int = 10) -> dict:
    """Ưu tiên notes_file từ Git/raw URL; lỗi mới fallback update_notes.html local."""
    manifest = manifest if isinstance(manifest, dict) else {}
    notes_file = manifest.get("notes_file")
    notes = ""
    source = ""

    if isinstance(notes_file, str) and notes_file.strip():
        notes_ref = notes_file.strip()
        try:
            if notes_ref.lower().startswith(("http://", "https://")):
                notes = _download_text(notes_ref, timeout=timeout)
                source = "git"
            else:
                path = notes_ref if os.path.isabs(notes_ref) else os.path.join(BASE_DIR, notes_ref)
                with open(path, "r", encoding="utf-8") as handle:
                    notes = handle.read()
                source = "manifest-local"
        except Exception:
            notes = ""

    if not notes:
        notes = _read_local_update_notes()
        source = "local" if notes else source

    if not notes:
        notes = str(manifest.get("notes") or "")
        source = "manifest" if notes else source

    manifest["notes"] = notes
    manifest["notes_source"] = source
    return manifest


class _UpdateNotesHTMLRenderer(HTMLParser):
    BLOCK_TAGS = {"h1", "h2", "h3", "p", "ul", "ol", "li", "div"}

    def __init__(self, text_widget):
        super().__init__(convert_charrefs=True)
        self.text_widget = text_widget
        self.tag_stack: list[str] = []
        self.list_stack: list[str] = []
        self.ol_counts: list[int] = []

    def _line_start(self) -> bool:
        return self.text_widget.index(tk.INSERT).split(".")[1] == "0"

    def _last_chars(self, count: int = 2) -> str:
        try:
            return self.text_widget.get(f"insert-{count}c", tk.INSERT)
        except Exception:
            return ""

    def _newline(self, max_blank: int = 1):
        if self.text_widget.index(tk.INSERT) == "1.0":
            return
        tail = self._last_chars(max_blank + 1)
        if tail.endswith("\n" * (max_blank + 1)):
            return
        if not tail.endswith("\n"):
            self.text_widget.insert(tk.END, "\n")

    def _tags(self, extra: tuple[str, ...] = ()) -> tuple[str, ...]:
        tags = list(self.tag_stack)
        if self.list_stack:
            tags.append("li")
        tags.extend(extra)
        return tuple(tags)

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        attrs_dict = dict(attrs or [])
        if tag in {"h1", "h2", "h3"}:
            self._newline(1)
            self.tag_stack.append(tag)
        elif tag in {"strong", "b"}:
            self.tag_stack.append("b")
        elif tag == "code":
            self.tag_stack.append("code")
        elif tag == "a":
            self.tag_stack.append("link")
        elif tag == "br":
            self._newline(0)
        elif tag == "p":
            self._newline(1)
        elif tag in {"ul", "ol"}:
            self._newline(1)
            self.list_stack.append(tag)
            if tag == "ol":
                self.ol_counts.append(0)
        elif tag == "li":
            self._newline(0)
            depth = max(0, len(self.list_stack) - 1)
            indent = "  " * depth
            bullet = "•"
            if self.list_stack and self.list_stack[-1] == "ol":
                self.ol_counts[-1] += 1
                bullet = f"{self.ol_counts[-1]}."
            self.text_widget.insert(tk.END, f"{indent}{bullet} ", ("bullet", "li"))
        elif tag == "c":
            color = attrs_dict.get("color", "").strip()
            if color:
                tag_name = f"color_{color.replace('#', '')}"
                self.text_widget.tag_configure(tag_name, foreground=color)
                self.tag_stack.append(tag_name)

    def handle_endtag(self, tag):
        tag = tag.lower()
        mapped = {"strong": "b"}.get(tag, tag)
        if mapped in {"h1", "h2", "h3", "p", "li"}:
            self._newline(0)
        if tag in {"ul", "ol"}:
            if self.list_stack:
                popped = self.list_stack.pop()
                if popped == "ol" and self.ol_counts:
                    self.ol_counts.pop()
            self._newline(1)
        if mapped in self.tag_stack:
            for idx in range(len(self.tag_stack) - 1, -1, -1):
                if self.tag_stack[idx] == mapped:
                    del self.tag_stack[idx]
                    break

    def handle_data(self, data):
        if not data:
            return
        text = data.replace("\r", "")
        text = re.sub(r"[ \t\n]+", " ", text)
        if not text.strip():
            return
        if self._line_start():
            text = text.lstrip()
        self.text_widget.insert(tk.END, text, self._tags())


def _configure_update_notes_text(text_widget):
    base_font = tkfont.Font(font=text_widget.cget("font"))
    body_font = tkfont.Font(family="Segoe UI", size=max(10, base_font.cget("size")))
    h1_font = tkfont.Font(family="Segoe UI", size=18, weight="bold")
    h2_font = tkfont.Font(family="Segoe UI", size=13, weight="bold")
    h3_font = tkfont.Font(family="Segoe UI", size=11, weight="bold")
    bold_font = tkfont.Font(family="Segoe UI", size=body_font.cget("size"), weight="bold")
    code_font = tkfont.Font(family="Consolas", size=body_font.cget("size"))

    text_widget.configure(
        font=body_font,
        background="#fbfdff",
        foreground="#111827",
        insertbackground="#111827",
        relief=tk.FLAT,
        borderwidth=0,
        padx=16,
        pady=14,
        spacing1=2,
        spacing2=2,
        spacing3=5,
    )
    text_widget.tag_configure("h1", font=h1_font, foreground="#0f3d7a", spacing1=8, spacing3=14)
    text_widget.tag_configure("h2", font=h2_font, foreground="#166534", spacing1=12, spacing3=6)
    text_widget.tag_configure("h3", font=h3_font, foreground="#374151", spacing1=8, spacing3=4)
    text_widget.tag_configure("b", font=bold_font)
    text_widget.tag_configure("code", font=code_font, background="#eef2f7", foreground="#7c2d12")
    text_widget.tag_configure("link", foreground="#2563eb", underline=True)
    text_widget.tag_configure("bullet", foreground="#4f46e5", font=bold_font)
    text_widget.tag_configure("li", lmargin1=24, lmargin2=46, spacing1=2, spacing3=3)


def _render_simplified_html(text_widget, html_text):
    """Render ghi chú HTML cơ bản thành Text widget dễ đọc hơn."""
    text_widget.config(state="normal")
    text_widget.delete("1.0", tk.END)
    _configure_update_notes_text(text_widget)

    html_text = (html_text or "").strip()
    if not html_text:
        text_widget.insert(tk.END, "Không có ghi chú cập nhật.")
    elif html_text.startswith("<"):
        parser = _UpdateNotesHTMLRenderer(text_widget)
        try:
            parser.feed(html_text)
            parser.close()
        except Exception:
            cleaned = re.sub(r"<[^>]+>", "", html_text)
            text_widget.insert(tk.END, cleaned.strip())
    else:
        text_widget.insert(tk.END, html_text)
    text_widget.insert(tk.END, "\n")
    text_widget.config(state="disabled")

    
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

    return load_update_notes_for_manifest(manifest, timeout=timeout)

def show_update_window(root, manifest, *, title=None, subtitle=None):
    """
    Hiển thị Toplevel dialog báo có bản cập nhật.
    - root: cửa sổ Tk chính (để có parent)
    - manifest: dict có keys: 'version', 'url', 'notes' (notes có thể là HTML)
    """
    if manifest is None:
        return

    version = manifest.get('version', 'N/A')
    url = manifest.get('url', None)
    if not manifest.get("notes") or not manifest.get("notes_source"):
        manifest = load_update_notes_for_manifest(manifest, timeout=8)
    notes = manifest.get('notes', '')
    notes_source = manifest.get("notes_source") or ""

    win = tk.Toplevel(root)
    try:
        if hasattr(root, "_apply_window_icon"):
            root._apply_window_icon(win)
    except Exception:
        pass
    win.title(title or f"Cập nhật phiên bản {version}")
    win.geometry("860x600")
    win.minsize(720, 480)

    header = ttk.Frame(win, padding=(14, 12, 14, 8))
    header.pack(fill=tk.X)
    ttk.Label(header, text=title or f"Phiên bản {version} đã có", font=('Segoe UI', 16, 'bold')).pack(anchor="w")
    subtitle_text = subtitle or "Nhấn Tải & Cài đặt nếu muốn cập nhật hoặc cài lại bản hiện tại."
    ttk.Label(header, text=subtitle_text, foreground='#555').pack(anchor="w", pady=(3, 0))
    if notes_source:
        source_label = {
            "git": "Ghi chú tải từ Git",
            "local": "Ghi chú local",
            "manifest-local": "Ghi chú từ manifest local",
            "manifest": "Ghi chú từ manifest",
        }.get(notes_source, f"Ghi chú: {notes_source}")
        ttk.Label(header, text=source_label, foreground="#6b7280").pack(anchor="w", pady=(2, 0))

    text_frame = ttk.LabelFrame(win, text="Ghi chú cập nhật", padding=1)
    text_frame.pack(fill=tk.BOTH, expand=True, padx=14)

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
