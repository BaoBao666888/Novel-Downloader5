# extensions/qidian_ext.py
import os
import re
import json
import time
import requests
from bs4 import BeautifulSoup

import tkinter as tk
from tkinter import ttk

# ----- Thư viện Selenium để lấy cookie tự động -----
try:
    import undetected_chromedriver as uc
except ImportError:
    uc = None

# --- Tên file để lưu cookie của khách ---
COOKIE_FILE = 'qidian_guest_cookies.json'

def _load_cookies_from_file():
    if not os.path.exists(COOKIE_FILE): return None
    try:
        with open(COOKIE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return None

def _save_cookies_to_file(cookies):
    try:
        with open(COOKIE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cookies, f, indent=2)
    except Exception as e:
        print(f"Lỗi khi lưu cookie Qidian: {e}")

def _interactive_uc_cookie_retrieval(url: str, root_window):
    """
    Mở trình duyệt (uc) một cách tương tác để lấy cookie của khách.
    Hộp thoại sẽ tự đóng khi phát hiện có cookie cần thiết.
    """
    if uc is None:
        raise ImportError("Vui lòng cài đặt undetected-chromedriver:\npip install undetected-chromedriver")

    # --- Tạo hộp thoại hướng dẫn ---
    # Sửa: Dùng tk và ttk trực tiếp, không qua uc
    prompt = tk.Toplevel(root_window)
    prompt.title("Đang lấy Cookie Qidian")
    prompt.transient(root_window)
    prompt.grab_set()
    prompt.resizable(False, False)
    
    label = ttk.Label(prompt, text="Một trình duyệt đang mở để lấy cookie cần thiết.\n"
                                     "Vui lòng đợi một lát, cửa sổ này sẽ tự đóng...\n\n"
                                     "Nếu đợi quá lâu, bạn có thể nhấn OK để tiếp tục.", 
                                     padding="20", justify=tk.LEFT)
    label.pack()
    ttk.Button(prompt, text="OK", command=prompt.destroy).pack(pady=10)
    
    # Canh giữa cửa sổ prompt
    root_window.update_idletasks()
    x = root_window.winfo_x() + (root_window.winfo_width() // 2) - (prompt.winfo_width() // 2)
    y = root_window.winfo_y() + (root_window.winfo_height() // 2) - (prompt.winfo_height() // 2)
    prompt.geometry(f"+{x}+{y}")
    
    driver = None
    try:
        opts = uc.ChromeOptions()
        opts.add_argument("--window-size=1024,768")
        driver = uc.Chrome(options=opts)
        driver.get(url)

        # Vòng lặp theo dõi cookie trong khi prompt đang mở
        while prompt.winfo_exists():
            try:
                current_cookies = driver.get_cookies()
                if any('_csrfToken' in c['name'] for c in current_cookies):
                    print("Cookie Qidian đã được tự động phát hiện!")
                    prompt.destroy()
                    break
                
                root_window.update()
                time.sleep(0.5)
            except Exception:
                break
        
        final_cookies = driver.get_cookies()
        if not any('_csrfToken' in c['name'] for c in final_cookies):
            raise Exception("Không thể tự động lấy cookie cần thiết. Vui lòng thử lại.")
            
        print("Lấy cookie Qidian thành công.")
        _save_cookies_to_file(final_cookies)
        return final_cookies

    finally:
        if driver:
            driver.quit()

def get_clean_url(url: str):
    match = re.search(r'/book/(\d+)', url)
    if match:
        book_id = match.group(1)
        return f"https://www.qidian.com/book/{book_id}/"
    return None

def parse_chapters_from_page(html_content: str):
    soup = BeautifulSoup(html_content, 'html.parser')
    chapters = []
    catalog = soup.select_one('div#allCatalog')
    if not catalog: return []

    chapter_counter = 0
    volumes = catalog.select('.catalog-volume')
    for volume in volumes:
        chapter_links = volume.select('.volume-chapters li.chapter-item a.chapter-name')
        for link_tag in chapter_links:
            chapter_counter += 1
            title1 = link_tag.get_text(strip=True)
            title2 = link_tag.get('title', 'N/A').strip()
            chapters.append({'num': chapter_counter, 'title1': title1, 'title2': title2})
    return chapters

def fetch_chapters(url: str, root_window=None, proxies=None):
    base_url = get_clean_url(url)
    if not base_url:
        return {'error': 'URL Qidian không hợp lệ. URL phải có dạng .../book/#######/...'}

    cookies = _load_cookies_from_file()

    # Nếu không có cookie, chạy quy trình lấy cookie tương tác
    if not cookies:
        print("Không tìm thấy cookie Qidian. Bắt đầu phiên làm việc mới.")
        try:
            cookies = _interactive_uc_cookie_retrieval(base_url, root_window)
        except Exception as e:
            return {'error': f"Lỗi khi tự động lấy cookie: {e}"}

    # Dùng cookie đã có để gửi request
    try:
        session = requests.Session()
        cookie_jar = requests.cookies.RequestsCookieJar()
        for cookie in cookies:
            cookie_jar.set(cookie['name'], cookie['value'], domain=cookie.get('domain'))
        session.cookies = cookie_jar

        headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "vi-VN,vi;q=0.9,zh-CN;q=0.8,zh;q=0.7,fr-FR;q=0.6,fr;q=0.5,en-US;q=0.4,en;q=0.3",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Sec-Ch-Ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
            "Referer": "https://www.qidian.com/"
        }
        
        print(f"Đang tải mục lục Qidian với cookie đã lưu...")

        resp = session.get(base_url, headers=headers, timeout=60, proxies=proxies)
        resp.raise_for_status()
        resp.encoding = 'utf-8'

        #save response vào file .html
        # with open("qidian_response.html", "w", encoding="utf-8") as f:
        #     f.write(resp.text)
        #     print("Đã lưu nội dung trang Qidian vào qidian_response.html")

        all_chapters = parse_chapters_from_page(resp.text)
        if not all_chapters:
            if 'captcha' in resp.text:
                print("Cookie Qidian đã hết hạn. Đang làm mới...")
                if os.path.exists(COOKIE_FILE):
                    os.remove(COOKIE_FILE)
                return fetch_chapters(url, root_window)
            return {'error': 'Không tìm thấy mục lục. URL hoặc cấu trúc trang có thể đã thay đổi.'}
        
        return {'data': all_chapters}

    except requests.exceptions.RequestException as e:
        return {'error': f"Lỗi mạng: {e}"}
    except Exception as e:
        return {'error': f"Lỗi không xác định: {e}"}
    
# # Ví dụ sử dụng
# if __name__ == "__main__":
#     test_url = "https://www.qidian.com/book/1037076300/"
#     result = fetch_chapters(test_url)
    # if 'error' in result:
    #     print("Lỗi:", result['error'])
    # else:
    #     for chapter in result['data']:
    #         print(f"{chapter['num']}: {chapter['title1']} ({chapter['title2']})")