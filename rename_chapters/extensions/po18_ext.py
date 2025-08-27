# extensions/po18_ext.py
import os
import re
import json
import requests
from requests.cookies import RequestsCookieJar
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

# ----- Thư viện giao diện và Selenium -----
import tkinter as tk
from tkinter import ttk
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service as ChromeService
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    from webdriver_manager.chrome import ChromeDriverManager
    from webdriver_manager.core.manager import DriverCacheManager
except ImportError:
    webdriver = None

COOKIE_FILE = 'po18_cookies.json'

# ========== CÁC HÀM TIỆN ÍCH (Không thay đổi nhiều) ==========

def _load_cookies_from_file():
    if not os.path.exists(COOKIE_FILE): return None
    try:
        with open(COOKIE_FILE, 'r', encoding='utf-8') as f:
            cookies_data = json.load(f)
        jar = RequestsCookieJar()
        for c in cookies_data:
            if 'name' in c and 'value' in c:
                jar.set(c['name'], c['value'], domain=c.get('domain'), path=c.get('path'))
        return jar
    except Exception:
        return None

def _save_cookies_to_file(selenium_cookies):
    with open(COOKIE_FILE, 'w', encoding='utf-8') as f:
        json.dump(selenium_cookies, f, indent=4)

def _validate_cookies(cookie_jar, validation_url):
    try:
        s = requests.Session(); s.cookies = cookie_jar
        s.headers.update({'User-Agent': 'Mozilla/5.0'})
        resp = s.get(validation_url, timeout=10, allow_redirects=False)
        if resp.status_code in (301, 302, 307) and 'login' in resp.headers.get('Location', ''):
            return False
        return resp.ok
    except Exception:
        return False

# ========== HÀM ĐĂNG NHẬP TƯƠNG TÁC (Đã nâng cấp) ==========

def _interactive_selenium_login(root_window):
    def create_prompt(title, message, button_text):
        """Hàm tiện ích tạo và canh giữa hộp thoại."""
        prompt = tk.Toplevel(root_window)
        prompt.title(title)
        prompt.transient(root_window)
        prompt.grab_set()
        prompt.resizable(False, False)
        ttk.Label(prompt, text=message, padding="20", justify=tk.LEFT).pack()
        ttk.Button(prompt, text=button_text, command=prompt.destroy).pack(pady=10)
        root_window.update_idletasks()
        x = root_window.winfo_x() + (root_window.winfo_width() // 2) - (prompt.winfo_width() // 2)
        y = root_window.winfo_y() + (root_window.winfo_height() // 2) - (prompt.winfo_height() // 2)
        prompt.geometry(f"+{x}+{y}")
        return prompt

    driver = None
    try:
        # --- BƯỚC 1: Mở trình duyệt và hộp thoại hướng dẫn đăng nhập ---
        cache_manager = DriverCacheManager(root_dir=".")
        driver_path = ChromeDriverManager(cache_manager=cache_manager).install()
        service = ChromeService(executable_path=driver_path)
        opts = ChromeOptions(); opts.add_argument("--start-maximized")
        driver = webdriver.Chrome(service=service, options=opts)
        
        driver.get("https://members.po18.tw/apps/login.php")
        
        login_prompt = create_prompt(
            "Bước 1: Đăng nhập",
            "Một cửa sổ trình duyệt đã mở ra.\n\n"
            "Vui lòng ĐĂNG NHẬP vào tài khoản PO18 của bạn.\n\n"
            "Sau khi đăng nhập xong, nhấn nút 'Tiếp tục' bên dưới.",
            "Tiếp tục"
        )
        root_window.wait_window(login_prompt) # Chờ người dùng nhấn "Tiếp tục"

        # --- BƯỚC 2: Điều hướng và hiện hộp thoại hướng dẫn xác nhận ---
        print("Đăng nhập đã được xác nhận. Đang điều hướng đến trang chủ...")
        driver.get("https://www.po18.tw/")

        confirm_prompt = create_prompt(
            "Bước 2: Xác nhận tải trang",
            "Trình duyệt đang tải trang chủ PO18.\n\n"
            "Vui lòng đợi cho đến khi trang TẢI XONG HOÀN TOÀN.\n\n"
            "Sau đó, nhấn nút 'OK' bên dưới để chương trình lấy cookie.",
            "OK, trang đã tải xong"
        )
        root_window.wait_window(confirm_prompt) # Chờ người dùng nhấn "OK"

        # --- BƯỚC 3: Lấy và lưu cookie ---
        print("Đã xác nhận tải xong. Đang lấy và lưu cookie...")
        selenium_cookies = driver.get_cookies()
        
        is_logged_in = any('auth' in c['name'].lower() or 'token' in c['name'].lower() for c in selenium_cookies)
        if not is_logged_in:
            raise Exception("Đăng nhập không thành công! Không tìm thấy cookie xác thực (authtoken). Vui lòng thử lại.")
        
        print("Lưu cookie thành công!")
        _save_cookies_to_file(selenium_cookies)
        
        jar = RequestsCookieJar()
        for c in selenium_cookies:
            jar.set(c['name'], c['value'], domain=c.get('domain'), path=c.get('path'))
        return jar
            
    finally:
        if driver:
            driver.quit()

# ========== CÁC HÀM XỬ LÝ TRANG WEB (Giữ nguyên) ==========
# (Các hàm get_clean_url và parse_chapters_from_page không thay đổi)
def get_clean_url(url: str):
    parsed = urlparse(url)
    book_id_match = re.search(r'/books/(\d+)', parsed.path)
    if not book_id_match: return None
    book_id = book_id_match.group(1)
    return f"https://www.po18.tw/books/{book_id}/articles"

def parse_chapters_from_page(soup):
    chapters = []
    chapter_rows = soup.select('.chapter_list .c_l')
    for row in chapter_rows:
        counter_tag = row.select_one('.l_counter'); chaptname_tag = row.select_one('.l_chaptname')
        if not counter_tag or not chaptname_tag: continue
        num_str = counter_tag.text.strip()
        title_tag = chaptname_tag.find('a')
        title = title_tag.text.strip() if title_tag else chaptname_tag.text.strip()
        if num_str.isdigit():
            chapters.append({'num': int(num_str), 'title1': title, 'title2': 'N/A'})
    return chapters

# ========== HÀM CHÍNH (GIAO TIẾP VỚI UI - Giữ nguyên logic) ==========

def fetch_chapters(url: str, root_window=None, proxies=None):
    if not root_window:
        return {'error': 'Lỗi hệ thống: Thiếu tham chiếu đến cửa sổ chính.'}

    base_url = get_clean_url(url)
    if not base_url:
        return {'error': 'URL không hợp lệ. URL phải có dạng .../books/#######/...'}

    cookie_jar = _load_cookies_from_file()
    
    if cookie_jar and _validate_cookies(cookie_jar, base_url):
        print("Sử dụng cookie đã lưu thành công!")
    else:
        if cookie_jar: print("Cookie đã lưu không còn hợp lệ hoặc đã hết hạn.")
        else: print("Không tìm thấy file cookie đã lưu.")
        
        print("Chuẩn bị mở trình duyệt để bạn đăng nhập...")
        try:
            cookie_jar = _interactive_selenium_login(root_window)
        except Exception as e:
            error_str = str(e)
            if 'admin' in error_str.lower() or 'permission' in error_str.lower():
                 return {'error': 'ADMIN_REQUIRED'}
            return {'error': f"Lỗi trong quá trình đăng nhập: {e}"}

    # --- PHẦN LẤY DỮ LIỆU (Giữ nguyên) ---
    try:
        s = requests.Session(); s.cookies = cookie_jar
        s.headers.update({'User-Agent': 'Mozilla/5.0'})
        all_chapters = []; current_page_url = base_url; processed_pages = set()

        while current_page_url and current_page_url not in processed_pages:
            print(f"Đang tải trang mục lục: {current_page_url.split('?')[0]}")
            resp = s.get(current_page_url, timeout=60, proxies=proxies); resp.raise_for_status()
            processed_pages.add(current_page_url)
            
            soup = BeautifulSoup(resp.text, 'html.parser')
            all_chapters.extend(parse_chapters_from_page(soup))
            
            next_page_tag = soup.select_one('.pagenum a.num:-soup-contains(">")')
            if next_page_tag and next_page_tag.get('href') and next_page_tag['href'] != '#':
                current_page_url = urljoin(base_url, next_page_tag['href'])
            else:
                current_page_url = None

        if not all_chapters:
            return {'error': 'Không tìm thấy chương nào. Có thể URL sai hoặc bạn không có quyền truy cập.'}
        
        all_chapters.sort(key=lambda x: x['num'])
        return {'data': all_chapters}

    except requests.exceptions.RequestException as e:
        return {'error': f"Lỗi mạng: {e}"}
    except Exception as e:
        return {'error': f"Lỗi không xác định khi xử lý trang: {e}"}