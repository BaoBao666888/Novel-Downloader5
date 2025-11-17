# extensions/po18_ext.py
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

from app.core.browser_cookies import load_browser_cookie_jar

# ========== CÁC HÀM TIỆN ÍCH (Không thay đổi nhiều) ==========

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

def _load_browser_cookies():
    jar = load_browser_cookie_jar(["po18.tw", "members.po18.tw"])
    if not jar:
        return None
    for cookie in jar:
        name = (cookie.name or "").lower()
        if "auth" in name or "token" in name:
            return jar
    return None

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
    base_url = get_clean_url(url)
    if not base_url:
        return {'error': 'URL không hợp lệ. URL phải có dạng .../books/#######/...'}

    cookie_jar = _load_browser_cookies()
    if not cookie_jar:
        return {'error': 'Không tìm thấy cookie đăng nhập PO18 trong trình duyệt tích hợp. Vui lòng mở menu Trình duyệt, đăng nhập tài khoản PO18 rồi thử lại. Lưu ý: Phải tắt trình duyệt để sử dụng.'}

    if not _validate_cookies(cookie_jar, base_url):
        return {'error': 'Cookie PO18 đã hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại trong trình duyệt tích hợp rồi thử lại. Lưu ý: Phải tắt trình duyệt để sử dụng.'}

    print("Sử dụng cookie từ trình duyệt tích hợp.")

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
