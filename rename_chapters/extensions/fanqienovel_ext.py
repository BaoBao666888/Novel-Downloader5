# extensions/fanqienovel_ext.py
import re
import requests
from bs4 import BeautifulSoup

def get_clean_url(url: str):
    """Trích xuất book_id và tạo URL chuẩn cho trang mục lục."""
    # Regex này sẽ tìm chuỗi số dài ở cuối URL
    match = re.search(r'/page/(\d+)', url)
    if match:
        book_id = match.group(1)
        return f"https://fanqienovel.com/page/{book_id}"
    return None

def parse_chapters_from_page(html_content: str):
    """Trích xuất danh sách chương từ nội dung HTML."""
    soup = BeautifulSoup(html_content, 'html.parser')
    chapters = []
    
    # Selector tương ứng với '.page-directory-content a.chapter-item-title'
    chapter_links = soup.select('.page-directory-content a.chapter-item-title')
    
    if not chapter_links:
        return []

    for i, link_tag in enumerate(chapter_links, start=1):
        title = link_tag.get_text(strip=True)
        chapters.append({
            'num': i,
            'title1': title,
            'title2': 'N/A'
        })
            
    return chapters

def fetch_chapters(url: str, proxies=None, headers=None):
    """
    Lấy danh sách chương từ URL Fanqie Novel.
    """
    base_url = get_clean_url(url)
    if not base_url:
        return {'error': 'URL Fanqie Novel không hợp lệ. URL phải có dạng .../page/#######/...'}

    try:
        base_headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
        }
        if isinstance(headers, dict):
            base_headers.update(headers)
        
        print(f"Đang tải trang mục lục Fanqie Novel: {base_url}")
        resp = requests.get(base_url, headers=base_headers, timeout=60, proxies=proxies)
        resp.raise_for_status()
        resp.encoding = 'utf-8'
        
        all_chapters = parse_chapters_from_page(resp.text)

        if not all_chapters:
            return {'error': 'Không tìm thấy chương nào. URL hoặc cấu trúc trang có thể đã thay đổi.'}
        
        return {'data': all_chapters}

    except requests.exceptions.RequestException as e:
        return {'error': f"Lỗi mạng khi lấy dữ liệu Fanqie Novel: {e}"}
    except Exception as e:
        return {'error': f"Lỗi không xác định khi xử lý trang Fanqie Novel: {e}"}
