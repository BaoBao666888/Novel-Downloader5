# extensions/qidian_ext.py
import re
import requests
from bs4 import BeautifulSoup

from app.core.browser_cookies import load_browser_cookie_jar


def _load_browser_cookies(cookie_db_path=None):
    return load_browser_cookie_jar(["qidian.com"], required_names=["_csrftoken"], cookie_db_path=cookie_db_path)

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

def fetch_chapters(url: str, root_window=None, proxies=None, cookie_db_path=None):
    base_url = get_clean_url(url)
    if not base_url:
        return {'error': 'URL Qidian không hợp lệ. URL phải có dạng .../book/#######/...'}

    cookie_jar = _load_browser_cookies(cookie_db_path=cookie_db_path)
    if not cookie_jar:
        return {'error': 'Không tìm thấy cookie Qidian trong trình duyệt tích hợp. Vui lòng mở menu Trình duyệt, đăng nhập Qidian rồi thử lại. Lưu ý: Phải tắt trình duyệt để sử dụng.'}

    # Dùng cookie đã có để gửi request
    try:
        session = requests.Session()
        session.cookies = cookie_jar

        headers = {
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
                return {'error': 'Cookie Qidian đã hết hạn. Vui lòng đăng nhập lại trong trình duyệt tích hợp rồi thử lại.'}
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
