import random
import threading
import time
import tkinter as tk
from concurrent.futures import ThreadPoolExecutor, as_completed
from tkinter import ttk, messagebox, scrolledtext

import requests


class ProxyMixin:
    """Quản lý proxy và helper delay dùng chung."""

    def _open_proxy_manager_window(self):
        proxy_win = tk.Toplevel(self)
        self._apply_window_icon(proxy_win)
        proxy_win.title("Quản lý Proxy")
        proxy_win.geometry("700x550")

        main_paned = ttk.PanedWindow(proxy_win, orient=tk.VERTICAL)
        main_paned.pack(fill=tk.BOTH, expand=True, padx=15, pady=15)

        input_frame = ttk.Frame(main_paned)
        main_paned.add(input_frame, weight=2)
        input_frame.rowconfigure(1, weight=1)
        input_frame.columnconfigure(0, weight=1)
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

        proxy_settings = self.app_config.get("proxy_settings", {})
        proxy_list = proxy_settings.get("proxies", [])

        if proxy_list:
            proxy_text.insert("1.0", "\n".join(proxy_list))
        else:
            add_placeholder()

        result_frame = ttk.LabelFrame(main_paned, text="Kết quả kiểm tra", padding=10)
        main_paned.add(result_frame, weight=1)
        result_frame.rowconfigure(0, weight=1)
        result_frame.columnconfigure(0, weight=1)
        result_text = scrolledtext.ScrolledText(result_frame, wrap=tk.WORD, height=5, state="disabled")
        result_text.grid(row=0, column=0, sticky="nsew")

        bottom_frame = ttk.Frame(proxy_win)
        bottom_frame.pack(fill=tk.X, padx=15, pady=(0, 15))

        options_frame = ttk.LabelFrame(bottom_frame, text="Sử dụng proxy cho các chức năng", padding=10)
        options_frame.pack(side=tk.LEFT, fill=tk.Y, expand=True)

        use_for_wikidich = tk.BooleanVar(value=proxy_settings.get("use_for_wikidich", proxy_settings.get("use_for_fetch_titles", False)))
        use_for_translate = tk.BooleanVar(value=proxy_settings.get("use_for_translate", False))
        use_for_images = tk.BooleanVar(value=proxy_settings.get("use_for_images", False))

        ttk.Checkbutton(options_frame, text="Wikidich / Fanqie (Works, chi tiết, kiểm tra cập nhật)", variable=use_for_wikidich).pack(anchor="w")
        ttk.Checkbutton(options_frame, text="Dịch thuật", variable=use_for_translate).pack(anchor="w")
        ttk.Checkbutton(options_frame, text="Tải ảnh từ URL", variable=use_for_images).pack(anchor="w")

        def _save_proxy_settings():
            proxies_raw = proxy_text.get("1.0", tk.END).strip()
            if proxies_raw == placeholder_text:
                proxy_entries = []
            else:
                proxy_entries = [line.strip() for line in proxies_raw.split("\n") if line.strip()]

            self.app_config["proxy_settings"] = {
                "proxies": proxy_entries,
                "use_for_fetch_titles": use_for_wikidich.get(),
                "use_for_wikidich": use_for_wikidich.get(),
                "use_for_translate": use_for_translate.get(),
                "use_for_images": use_for_images.get(),
            }
            self.save_config()
            messagebox.showinfo("Thành công", "Đã lưu cài đặt proxy.", parent=proxy_win)
            proxy_win.destroy()

        action_frame = ttk.Frame(bottom_frame)
        action_frame.pack(side=tk.RIGHT)

        check_btn = ttk.Button(action_frame, text="Kiểm tra Proxy", command=lambda: self._start_proxy_check_thread(proxy_text, result_text, check_btn))
        check_btn.pack(fill=tk.X, pady=2)

        save_btn = ttk.Button(action_frame, text="Lưu và Đóng", command=_save_proxy_settings)
        save_btn.pack(fill=tk.X, pady=2)

    def _get_proxy_for_request(self, feature_name: str):
        """
        Lấy một proxy ngẫu nhiên từ danh sách đã lưu (không kiểm tra lại).
        feature_name: 'fetch_titles', 'wikidich', 'fanqie', 'translate', 'images'
        """
        proxy_settings = self.app_config.get("proxy_settings", {})
        use_proxy_flag = proxy_settings.get(f"use_for_{feature_name}", False)
        if feature_name in ("fetch_titles", "wikidich", "fanqie"):
            use_proxy_flag = proxy_settings.get("use_for_wikidich", proxy_settings.get("use_for_fetch_titles", use_proxy_flag))

        if not use_proxy_flag:
            return None

        proxy_list = proxy_settings.get("proxies", [])
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
        proxies_raw = proxy_widget.get("1.0", tk.END).strip()
        proxy_list = [line.strip() for line in proxies_raw.split("\n") if line.strip() and not line.startswith("#")]

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
            daemon=True,
        )
        thread.start()

    def _check_single_proxy(self, proxy_str, timeout=30):
        try:
            proxies_dict = {"http": proxy_str, "https": proxy_str}
            start_time = time.time()
            response = requests.get("http://httpbin.org/get", proxies=proxies_dict, timeout=timeout)
            response.raise_for_status()
            latency = (time.time() - start_time) * 1000
            return proxy_str, True, f"{latency:.0f}ms"
        except Exception as e:
            return proxy_str, False, str(e).splitlines()[-1]

    def _check_proxies_worker(self, proxy_list, result_widget, button, proxy_widget):
        working_proxies = []

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

            if messagebox.askyesno(
                "Cập nhật danh sách?",
                f"Tìm thấy {len(working_proxies)} proxy hoạt động. Bạn có muốn cập nhật lại danh sách chỉ với các proxy này không?",
            ):
                proxy_widget.delete("1.0", tk.END)
                proxy_widget.insert("1.0", "\n".join(working_proxies))

            button.config(state="normal")

        self.after(0, final_update)
