# renamer_logic.py
import os
import re

# --- Chuyển chữ Hán sang số (Giữ nguyên, đã tối ưu) ---
def chinese_to_arabic(chinese: str) -> int:
    chinese = chinese.strip()
    if chinese.isdigit():
        return int(chinese)

    chinese_numerals = {'零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9}
    units = {'十': 10, '百': 100, '千': 1000, '万': 10000}

    result = 0
    section = 0
    number = 0
    is_zero = False

    for char in chinese:
        if char in chinese_numerals:
            number = chinese_numerals[char]
            is_zero = (number == 0)
        elif char in units:
            unit_val = units[char]
            if unit_val == 10 and number == 0: # Xử lý trường hợp "十" đứng đầu (như 十三)
                number = 1
            section += number * unit_val
            number = 0
            is_zero = False
        elif char == '万':
            result += (section + number) * 10000
            section = 0
            number = 0
            is_zero = False
        else:
            continue
    
    if not is_zero: # Xử lý chữ số cuối cùng nếu có
        result += section + number
    
    # Xử lý trường hợp đặc biệt như "二百五" thay vì "二百五十"
    if len(chinese) > 1 and chinese.startswith('十'):
        if result == 10 and number > 0:
            result += number - 10 # Ví dụ: 十三 -> 10 + 3
    
    return result

# --- Làm sạch tên file (Giữ nguyên, đã tốt) ---
def sanitize_filename(name: str) -> str:
    # Các ký tự không hợp lệ trong Windows và các hệ điều hành khác
    invalid_chars = r'[\\/:"*?<>|]'
    # Thay thế bằng ký tự tương đương hoặc bỏ đi
    sanitized = re.sub(invalid_chars, '', name)
    return sanitized.strip()

# --- Phân tích file để trích xuất thông tin ---
def analyze_file(filepath: str):
    """
    Phân tích tên file và dòng đầu tiên để trích xuất số chương và tiêu đề.
    Trả về một dictionary chứa các thông tin tìm được.
    """
    analysis = {
        'filepath': filepath,
        'filename': os.path.basename(filepath),
        'from_filename': {'num': None, 'title': None},
        'from_content': {'num': None, 'title': None},
        'error': None
    }

    # 1. Phân tích từ tên file
    filename = analysis['filename'].rsplit('.', 1)[0] # Bỏ phần extension
    
    # Mẫu 1: "Chương 123: Tên chương" hoặc "C123 - Tên chương"
    match = re.search(r'(?:chương|c|q|quyển|chap|chapter|第)?\s*(\d+)\s*[:\-.]*\s*(.*)', filename, re.IGNORECASE)
    if match:
        analysis['from_filename']['num'] = int(match.group(1))
        analysis['from_filename']['title'] = match.group(2).strip()

    # Mẫu 2: Tên file dạng Hán Việt "第十二章"
    match = re.search(r'第\s*([一二三四五六七八九十百千万两零\d]+)\s*章\s*(.*)', filename)
    if match:
        analysis['from_filename']['num'] = chinese_to_arabic(match.group(1))
        analysis['from_filename']['title'] = match.group(2).strip()

    # 2. Phân tích từ nội dung (dòng đầu tiên)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip()
            if first_line:
                # Mẫu 1: "第十二章 Tên chương"
                match = re.match(r'第\s*([一二三四五六七八九十百千万两零\d]+)\s*章\s*(.*)', first_line)
                if match:
                    analysis['from_content']['num'] = chinese_to_arabic(match.group(1))
                    analysis['from_content']['title'] = match.group(2).strip()
                else:
                    # Mẫu 2: "123. Tên chương" hoặc "123 Tên chương"
                    match = re.match(r'(\d+)[\s.\-:]*(.*)', first_line)
                    if match:
                        analysis['from_content']['num'] = int(match.group(1))
                        analysis['from_content']['title'] = match.group(2).strip()

    except Exception as e:
        analysis['error'] = str(e)

    return analysis


# --- Tạo tên file mới dựa trên lựa chọn và phân tích ---
def generate_new_name(analysis: dict, strategy: str, custom_format: str = "第{num}章 {title}.txt") -> str:
    """
    Tạo tên file mới dựa trên chiến lược người dùng chọn.
    - strategy: 'content_first', 'filename_first', 'content_only', 'filename_only', 'custom'
    - custom_format: Chuỗi định dạng, ví dụ: "Q{num}: {title}.txt"
    """
    num = None
    title = ""

    # Ưu tiên lấy thông tin theo chiến lược
    if strategy == 'content_first':
        num = analysis['from_content']['num'] or analysis['from_filename']['num']
        title = analysis['from_content']['title'] or analysis['from_filename']['title'] or ""
    elif strategy == 'filename_first':
        num = analysis['from_filename']['num'] or analysis['from_content']['num']
        title = analysis['from_filename']['title'] or analysis['from_content']['title'] or ""
    elif strategy == 'content_only':
        num = analysis['from_content']['num']
        title = analysis['from_content']['title'] or ""
    elif strategy == 'filename_only':
        num = analysis['from_filename']['num']
        title = analysis['from_filename']['title'] or ""
    elif strategy == 'custom':
        # Logic cho custom pattern sẽ được xử lý riêng để linh hoạt hơn
        # Ở đây chỉ là placeholder, hàm đổi tên thực tế sẽ dùng regex
        num = analysis['from_content']['num'] or analysis['from_filename']['num']
        title = analysis['from_content']['title'] or analysis['from_filename']['title'] or ""

    if num is None:
        return None # Không tìm thấy số chương, không thể đổi tên

    # Tạo tên file mới từ chuỗi định dạng
    try:
        new_name_raw = custom_format.format(num=num, title=title.strip())
        return sanitize_filename(new_name_raw)
    except (KeyError, TypeError):
        # Nếu format string sai, trả về một tên mặc định an toàn
        return sanitize_filename(f"第{num}章 {title}.txt")