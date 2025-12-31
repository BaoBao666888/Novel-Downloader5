# extensions/fanqienovel_ext.py
import re
import requests
from bs4 import BeautifulSoup

def _extract_book_id(url: str):
    """Lấy book_id từ URL Fanqie (page/book/reader hoặc query)."""
    if not url:
        return None
    match = re.search(r"(?:book_id=|bookid=|/page/|/book/|/reader/)(\d+)", url)
    if match:
        return match.group(1)
    match = re.search(r"(\d+)$", url)
    return match.group(1) if match else None


def get_clean_url(url: str):
    """Trích xuất book_id và tạo URL chuẩn cho trang mục lục."""
    book_id = _extract_book_id(url)
    if book_id:
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


def _parse_chapters_from_api(payload):
    chapters = []
    data = payload.get("data") if isinstance(payload, dict) else None
    volumes = data.get("chapterListWithVolume") if isinstance(data, dict) else None
    if not isinstance(volumes, list):
        return chapters
    for volume in volumes:
        chapter_list = []
        if isinstance(volume, list):
            chapter_list = volume
        elif isinstance(volume, dict):
            chapter_list = volume.get("chapterList") or volume.get("chapters") or []
        if not isinstance(chapter_list, list):
            continue
        for chapter in chapter_list:
            if not isinstance(chapter, dict):
                continue
            title = chapter.get("title") or chapter.get("chapterTitle") or chapter.get("name") or ""
            if not title:
                continue
            chapters.append(
                {
                    "num": len(chapters) + 1,
                    "title1": title,
                    "title2": "N/A",
                }
            )
    return chapters

def fetch_chapters(url: str, proxies=None, headers=None):
    """
    Lấy danh sách chương từ URL Fanqie Novel.
    """
    book_id = _extract_book_id(url)
    base_url = get_clean_url(url)
    if not base_url or not book_id:
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
        if all_chapters:
            return {'data': all_chapters}

        api_url = f"https://fanqienovel.com/api/reader/directory/detail?bookId={book_id}"
        api_resp = requests.get(api_url, headers=base_headers, timeout=60, proxies=proxies)
        api_resp.raise_for_status()
        api_data = api_resp.json()
        api_chapters = _parse_chapters_from_api(api_data)
        if api_chapters:
            return {'data': api_chapters}
        return {'error': 'Không tìm thấy chương nào (trang và API đều trống).'}

    except requests.exceptions.RequestException as e:
        try:
            api_url = f"https://fanqienovel.com/api/reader/directory/detail?bookId={book_id}"
            api_resp = requests.get(api_url, headers=base_headers, timeout=60, proxies=proxies)
            api_resp.raise_for_status()
            api_data = api_resp.json()
            api_chapters = _parse_chapters_from_api(api_data)
            if api_chapters:
                return {'data': api_chapters}
        except Exception:
            pass
        return {'error': f"Lỗi mạng khi lấy dữ liệu Fanqie Novel: {e}"}
    except Exception as e:
        return {'error': f"Lỗi không xác định khi xử lý trang Fanqie Novel: {e}"}
