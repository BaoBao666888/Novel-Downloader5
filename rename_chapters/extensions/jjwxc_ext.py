# extensions/jjwxc_ext.py
import requests
from bs4 import BeautifulSoup

def fetch_chapters(url: str):
    """
    Lấy danh sách chương từ một URL của jjwxc.net.
    Trả về một list các dictionary, mỗi dict chứa: num, title1, title2.
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status() # Báo lỗi nếu request thất bại
        
        # JJWXC dùng encoding GB18030
        response.encoding = 'GB18030'
        soup = BeautifulSoup(response.text, 'html.parser')

        chapter_table = soup.find('table', id='oneboolt')
        if not chapter_table:
            return {'error': 'Không tìm thấy bảng chương truyện (table id="oneboolt").'}

        chapters = []
        # Dùng CSS selector để tìm kiếm linh hoạt
        rows = chapter_table.select('tr[itemprop~="chapter"]')

        for row in rows:
            cells = row.find_all('td')
            if len(cells) < 3:
                continue
            
            # Lấy số chương từ ô đầu tiên
            chapter_num_str = cells[0].text.strip()
            
            # Lấy tiêu đề 1 (标题) từ link trong ô thứ hai
            title1_tag = cells[1].find('a')
            title1 = title1_tag.text.strip() if title1_tag else 'N/A'

            # Lấy tiêu đề 2 (内容提要) từ ô thứ ba
            title2 = cells[2].text.strip()

            if chapter_num_str.isdigit():
                chapters.append({
                    'num': int(chapter_num_str),
                    'title1': title1,
                    'title2': title2
                })

        if not chapters:
            return {'error': 'Không tìm thấy chương nào. Vui lòng kiểm tra lại URL hoặc cấu trúc trang web.'}
            
        return {'data': chapters}

    except requests.exceptions.RequestException as e:
        return {'error': f"Lỗi mạng: {e}"}
    except Exception as e:
        return {'error': f"Lỗi không xác định: {e}"}