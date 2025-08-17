# renamer_logic.py
import os
import re

# --- các hàm chinese_to_arabic, sanitize_filename, analyze_file, generate_new_name---

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
            if unit_val == 10 and number == 0: number = 1
            section += number * unit_val
            number = 0
        elif char == '万':
            result += (section + number) * 10000
            section = 0
            number = 0
    result += section + number
    if len(chinese) > 1 and chinese.startswith('十') and result > 10:
        result = int(str(result)[1:]) + 10 if str(result)[1:] else 10
    return result

def sanitize_filename(name: str) -> str:
    invalid_chars = r'[\\/:"*?<>|]'
    sanitized = re.sub(invalid_chars, '', name)
    return sanitized.strip()

def analyze_file(filepath: str, custom_filename_regex: str = None, custom_content_regex: str = None):
    analysis = {
        'filepath': filepath,
        'filename': os.path.basename(filepath),
        'from_filename': {'num': None, 'title': None, 'source': 'N/A'},
        'from_content': {'num': None, 'title': None, 'source': 'N/A'},
        'error': None
    }
    filename = analysis['filename'].rsplit('.', 1)[0]
    # 1. Phân tích từ tên file
    if custom_filename_regex:
        try:
            match = re.search(custom_filename_regex, filename)
            if match and len(match.groups()) >= 2:
                analysis['from_filename']['num'] = int(match.group(1))
                analysis['from_filename']['title'] = match.group(2).strip()
                analysis['from_filename']['source'] = 'Custom Regex'
        except (re.error, IndexError, ValueError): pass
    if analysis['from_filename']['num'] is None:
        patterns = [r'(?:chương|c|q|quyển|chap|chapter|第)?\s*(\d+)\s*[:\-.]*\s*(.*)']
        for pattern in patterns:
            match = re.search(pattern, filename, re.IGNORECASE)
            if match:
                analysis['from_filename']['num'] = int(match.group(1))
                analysis['from_filename']['title'] = match.group(2).strip()
                analysis['from_filename']['source'] = 'Built-in Pattern'
                break
    if analysis['from_filename']['num'] is None:
        match = re.search(r'第\s*([一二三四五六七八九十百千万两零\d]+)\s*章\s*(.*)', filename)
        if match:
            analysis['from_filename']['num'] = chinese_to_arabic(match.group(1))
            analysis['from_filename']['title'] = match.group(2).strip()
            analysis['from_filename']['source'] = 'Built-in (Chinese)'
    # 2. Phân tích từ nội dung
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip()
            if first_line:
                if custom_content_regex:
                    try:
                        match = re.match(custom_content_regex, first_line)
                        if match and len(match.groups()) >= 2:
                            analysis['from_content']['num'] = int(match.group(1))
                            analysis['from_content']['title'] = match.group(2).strip()
                            analysis['from_content']['source'] = 'Custom Regex'
                    except (re.error, IndexError, ValueError): pass
                if analysis['from_content']['num'] is None:
                    match = re.match(r'第\s*([一二三四五六七八九十百千万两零\d]+)\s*章\s*(.*)', first_line)
                    if match:
                        analysis['from_content']['num'] = chinese_to_arabic(match.group(1))
                        analysis['from_content']['title'] = match.group(2).strip()
                        analysis['from_content']['source'] = 'Built-in (Chinese)'
                    else:
                        match = re.match(r'(\d+)[\s.\-:]*(.*)', first_line)
                        if match:
                            analysis['from_content']['num'] = int(match.group(1))
                            analysis['from_content']['title'] = match.group(2).strip()
                            analysis['from_content']['source'] = 'Built-in Pattern'
    except Exception as e:
        analysis['error'] = str(e)
    return analysis

def generate_new_name(analysis: dict, strategy: str, custom_format: str = "第{num}章 {title}.txt") -> str:
    num = None; title = ""
    if strategy == 'content_first':
        num = analysis['from_content']['num'] or analysis['from_filename']['num']
        title = analysis['from_content']['title'] or analysis['from_filename']['title'] or ""
    elif strategy == 'filename_first':
        num = analysis['from_filename']['num'] or analysis['from_content']['num']
        title = analysis['from_filename']['title'] or analysis['from_content']['title'] or ""
    if num is None: return None
    try:
        new_name_raw = custom_format.format(num=num, title=title.strip())
        return sanitize_filename(new_name_raw)
    except (KeyError, TypeError):
        return sanitize_filename(f"第{num}章 {title}.txt")

# ---XỬ LÝ CREDIT ---

def modify_content(filepath: str, credit_text: str, position: str, line_num: int = 1, preview_only: bool = False):
    """
    Thêm credit vào nội dung file hoặc chỉ tạo bản xem trước.
    - position: 'top', 'bottom', 'line'
    - line_num: số dòng cụ thể (tính từ 1)
    - preview_only: True nếu chỉ muốn trả về nội dung mới, False để ghi đè file.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        return f"Lỗi đọc file: {e}"

    # Xử lý \n cho credit text
    credit_with_newline = credit_text + '\n'

    if position == 'top':
        lines.insert(0, credit_with_newline)
    elif position == 'bottom':
        # Đảm bảo dòng cuối cùng có \n trước khi thêm credit
        if lines and not lines[-1].endswith('\n'):
            lines[-1] += '\n'
        lines.append(credit_with_newline)
    elif position == 'line':
        # Chuyển đổi line_num từ 1-based sang 0-based index
        insert_index = line_num - 1
        if 0 <= insert_index <= len(lines):
            lines.insert(insert_index, credit_with_newline)
        else: # Nếu số dòng không hợp lệ, chèn vào cuối
            lines.append(credit_with_newline)
    
    new_content = "".join(lines)

    if preview_only:
        return new_content
    
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True # Thành công
    except Exception as e:
        return f"Lỗi ghi file: {e}" # Thất bại