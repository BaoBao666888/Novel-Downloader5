# renamer_logic.py
import os
import re

# --- Hàm chinese_to_arabic và sanitize_filename không thay đổi ---

def chinese_to_arabic(chinese: str) -> int:
    chinese = chinese.strip()
    if chinese.isdigit():
        return int(chinese)

    chinese_numerals = {'零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9}
    units = {'十': 10, '百': 100, '千': 1000, '万': 10000}

    result = 0
    section = 0
    number = 0

    for char in chinese:
        if char in chinese_numerals:
            number = chinese_numerals[char]
        elif char in units:
            unit_val = units[char]
            if unit_val == 10 and number == 0:
                number = 1
            section += number * unit_val
            number = 0
        elif char == '万':
            result += (section + number) * 10000
            section = 0
            number = 0
    
    result += section + number
    
    if len(chinese) > 1 and chinese.startswith('十'):
        if result > 10:
             result = int(str(result)[1:]) + 10

    return result

def sanitize_filename(name: str) -> str:
    invalid_chars = r'[\\/:"*?<>|]'
    sanitized = re.sub(invalid_chars, '', name)
    return sanitized.strip()

# --- Phân tích file để trích xuất thông tin (ĐÃ CẬP NHẬT) ---
def analyze_file(filepath: str, custom_filename_regex: str = None, custom_content_regex: str = None):
    """
    Phân tích file, ưu tiên sử dụng regex tùy chỉnh nếu được cung cấp.
    """
    analysis = {
        'filepath': filepath,
        'filename': os.path.basename(filepath),
        'from_filename': {'num': None, 'title': None, 'source': 'N/A'},
        'from_content': {'num': None, 'title': None, 'source': 'N/A'},
        'error': None
    }
    filename = analysis['filename'].rsplit('.', 1)[0]

    # 1. Phân tích từ tên file
    # Ưu tiên regex của người dùng
    if custom_filename_regex:
        try:
            match = re.search(custom_filename_regex, filename)
            # Yêu cầu regex phải có 2 nhóm bắt (group): 1 là số, 2 là tiêu đề
            if match and len(match.groups()) >= 2:
                analysis['from_filename']['num'] = int(match.group(1))
                analysis['from_filename']['title'] = match.group(2).strip()
                analysis['from_filename']['source'] = 'Custom Regex'
        except (re.error, IndexError, ValueError):
            pass # Bỏ qua nếu regex sai hoặc không khớp

    # Nếu regex người dùng không thành công, dùng các mẫu sẵn có
    if analysis['from_filename']['num'] is None:
        patterns = [
            r'(?:chương|c|q|quyển|chap|chapter|第)?\s*(\d+)\s*[:\-.]*\s*(.*)',
        ]
        for pattern in patterns:
            match = re.search(pattern, filename, re.IGNORECASE)
            if match:
                analysis['from_filename']['num'] = int(match.group(1))
                analysis['from_filename']['title'] = match.group(2).strip()
                analysis['from_filename']['source'] = 'Built-in Pattern'
                break
    
    # Mẫu Hán Việt riêng vì logic khác
    if analysis['from_filename']['num'] is None:
        match = re.search(r'第\s*([一二三四五六七八九十百千万两零\d]+)\s*章\s*(.*)', filename)
        if match:
            analysis['from_filename']['num'] = chinese_to_arabic(match.group(1))
            analysis['from_filename']['title'] = match.group(2).strip()
            analysis['from_filename']['source'] = 'Built-in (Chinese)'

    # 2. Phân tích từ nội dung (dòng đầu tiên)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip()
            if first_line:
                # Ưu tiên regex của người dùng
                if custom_content_regex:
                    try:
                        match = re.match(custom_content_regex, first_line)
                        if match and len(match.groups()) >= 2:
                            analysis['from_content']['num'] = int(match.group(1))
                            analysis['from_content']['title'] = match.group(2).strip()
                            analysis['from_content']['source'] = 'Custom Regex'
                    except (re.error, IndexError, ValueError):
                        pass

                # Nếu regex người dùng không thành công, dùng mẫu sẵn có
                if analysis['from_content']['num'] is None:
                    # Mẫu Hán Việt
                    match = re.match(r'第\s*([一二三四五六七八九十百千万两零\d]+)\s*章\s*(.*)', first_line)
                    if match:
                        analysis['from_content']['num'] = chinese_to_arabic(match.group(1))
                        analysis['from_content']['title'] = match.group(2).strip()
                        analysis['from_content']['source'] = 'Built-in (Chinese)'
                    else:
                        # Mẫu số thông thường
                        match = re.match(r'(\d+)[\s.\-:]*(.*)', first_line)
                        if match:
                            analysis['from_content']['num'] = int(match.group(1))
                            analysis['from_content']['title'] = match.group(2).strip()
                            analysis['from_content']['source'] = 'Built-in Pattern'
    except Exception as e:
        analysis['error'] = str(e)

    return analysis

# --- Hàm generate_new_name không thay đổi ---
def generate_new_name(analysis: dict, strategy: str, custom_format: str = "第{num}章 {title}.txt") -> str:
    num = None
    title = ""

    if strategy == 'content_first':
        num = analysis['from_content']['num'] or analysis['from_filename']['num']
        title = analysis['from_content']['title'] or analysis['from_filename']['title'] or ""
    elif strategy == 'filename_first':
        num = analysis['from_filename']['num'] or analysis['from_content']['num']
        title = analysis['from_filename']['title'] or analysis['from_content']['title'] or ""
    # Các strategy khác có thể thêm vào đây nếu cần

    if num is None:
        return None

    try:
        new_name_raw = custom_format.format(num=num, title=title.strip())
        return sanitize_filename(new_name_raw)
    except (KeyError, TypeError):
        return sanitize_filename(f"第{num}章 {title}.txt")