import os
import re
import tkinter as tk
from tkinter import messagebox

class TextOperations:
    @staticmethod
    def find_text(text_widget, search_text, match_case=False, match_word=False, use_regex=False, search_up=False):
        """Find text in the text widget and return the position."""
        content = text_widget.get('1.0', tk.END)
        try:
            if search_up and text_widget.tag_ranges(tk.SEL):
                start_pos_index = text_widget.index(tk.SEL_FIRST)
            else:
                start_pos_index = text_widget.index(tk.INSERT)
        except tk.TclError:
            start_pos_index = text_widget.index(tk.INSERT)

        # SỬA LỖI: Xử lý trường hợp .count() trả về None hoặc các kiểu dữ liệu khác nhau.
        # Điều này giúp chương trình "phòng thủ" trước sự không nhất quán của Tkinter.
        raw_count = text_widget.count('1.0', start_pos_index, 'chars')
        if isinstance(raw_count, tuple):
            current_index = raw_count[0]
        elif isinstance(raw_count, int):
            current_index = raw_count
        else: # Nếu là None hoặc kiểu dữ liệu không xác định, mặc định về 0.
            current_index = 0

        if use_regex:
            try:
                flags = 0 if match_case else re.IGNORECASE
                pattern = search_text
                matches = list(re.finditer(pattern, content, flags))
                if not matches: return None

                if search_up:
                    matches_before = [m for m in matches if m.start() < current_index]
                    if not matches_before: return None
                    match = matches_before[-1]
                else:
                    matches_after = [m for m in matches if m.start() >= current_index]
                    if not matches_after: return None
                    match = matches_after[0]

                start_pos_str = f"1.0 + {match.start()} chars"
                return start_pos_str, match.end() - match.start()

            except re.error as e:
                messagebox.showerror("Lỗi Regex", f"Regex không hợp lệ: {str(e)}")
                return None
        else:
            if search_up:
                start_pos = text_widget.search(search_text, f"{start_pos_index}-1c", backwards=True, regexp=match_word, nocase=not match_case)
            else:
                start_pos = text_widget.search(search_text, start_pos_index, backwards=False, regexp=match_word, nocase=not match_case)

            if start_pos:
                return start_pos, len(search_text)
            
            return None


    @staticmethod
    def replace_text(text_widget, find_text, replace_text, match_case=False, use_regex=False):
        """Replace the currently selected text if it matches the search text."""
        try:
            selected_text = text_widget.get(tk.SEL_FIRST, tk.SEL_LAST)
        except tk.TclError:
            return False

        if use_regex:
            try:
                # SỬA LỖI: Chuyển đổi $1, $2,... thành \1, \2,... để tương thích với Python
                replace_text_escaped = re.sub(r'\$(\d)', r'\\\1', replace_text)
                
                flags = 0 if match_case else re.IGNORECASE
                if re.fullmatch(find_text, selected_text, flags):
                    new_text = re.sub(find_text, replace_text_escaped, selected_text, flags=flags)
                    text_widget.delete(tk.SEL_FIRST, tk.SEL_LAST)
                    text_widget.insert(tk.INSERT, new_text)
                    return True
            except re.error:
                return False
        else:
            # Logic cũ cho tìm kiếm thông thường
            text_to_compare = selected_text if match_case else selected_text.lower()
            find_to_compare = find_text if match_case else find_text.lower()
            if text_to_compare == find_to_compare:
                text_widget.delete(tk.SEL_FIRST, tk.SEL_LAST)
                text_widget.insert(tk.INSERT, replace_text)
                return True
        return False

    @staticmethod
    def replace_all(text_widget, find_text, replace_text, match_case=False, match_word=False, use_regex=False):
        """Replace all occurrences of the search text."""
        content = text_widget.get('1.0', tk.END)
        count = 0
        
        if use_regex:
            try:
                # SỬA LỖI: Chuyển đổi $1, $2,... thành \1, \2,...
                replace_text_escaped = re.sub(r'\$(\d)', r'\\\1', replace_text)
                
                flags = 0 if match_case else re.IGNORECASE
                pattern = find_text
                # Thêm \b nếu match_word được chọn cùng regex
                if match_word:
                    pattern = r'\b' + pattern + r'\b'
                
                new_content, count = re.subn(pattern, replace_text_escaped, content, flags=flags)
            except re.error as e:
                messagebox.showerror("Lỗi Regex", f"Regex không hợp lệ: {str(e)}")
                return 0
        else:
            # Logic cũ cho tìm kiếm thông thường
            if match_word:
                pattern = r'\b' + re.escape(find_text) + r'\b'
                flags = 0 if match_case else re.IGNORECASE
                new_content, count = re.subn(pattern, replace_text, content, flags=flags)
            else:
                # Tối ưu hóa việc thay thế không phân biệt chữ hoa/thường
                if not match_case:
                    pattern = re.compile(re.escape(find_text), re.IGNORECASE)
                    new_content, count = pattern.subn(replace_text, content)
                else:
                    count = content.count(find_text)
                    new_content = content.replace(find_text, replace_text)

        if count > 0:
            # Lưu lại vị trí con trỏ và vùng chọn
            cursor_pos = text_widget.index(tk.INSERT)
            scroll_pos = text_widget.yview()
            
            text_widget.delete('1.0', tk.END)
            text_widget.insert('1.0', new_content)
            
            # Khôi phục vị trí con trỏ và thanh cuộn
            text_widget.mark_set(tk.INSERT, cursor_pos)
            text_widget.yview_moveto(scroll_pos[0])

        return count
    @staticmethod
    def split_file(filepath, split_regex, split_position="after"):
        """
        Split a file based on regex pattern.
        Returns a list of tuples (start_content, size) for preview.
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            return [], f"Không thể đọc file: {str(e)}"

        try:
            matches = list(re.finditer(split_regex, content, re.MULTILINE))
            if not matches:
                return [], "Không tìm thấy điểm chia nào với regex đã cho"

            split_points = []
            for match in matches:
                point = match.end() if split_position == "after" else match.start()
                split_points.append(point)

            # Add start and end points
            split_points.insert(0, 0)
            split_points.append(len(content))

            # Generate preview info
            preview_info = []
            for i in range(len(split_points) - 1):
                start = split_points[i]
                end = split_points[i + 1]
                chunk = content[start:min(start + 50, end)]  # First 50 chars for preview
                size = end - start
                preview_info.append((chunk.replace('\n', '\\n'), size))

            return preview_info, None

        except re.error as e:
            return [], f"Regex không hợp lệ: {str(e)}"
        except Exception as e:
            return [], f"Lỗi không xác định: {str(e)}"

    @staticmethod
    def _sanitize_filename(name: str) -> str:
        """Helper to remove invalid characters from a filename."""
        invalid_chars = r'[\\/:"*?<>|]'
        sanitized = re.sub(invalid_chars, '', name)
        return sanitized.strip()

    @staticmethod
    def execute_split(filepath, split_regex, split_position="after", name_format="part_{num}.txt"):
        """
        Actually split the file into multiple files.
        Returns (success_count, error_message).
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            matches = list(re.finditer(split_regex, content, re.MULTILINE))
            if not matches:
                return 0, "Không tìm thấy điểm chia nào"

            split_points = []
            for match in matches:
                point = match.end() if split_position == "after" else match.start()
                split_points.append(point)

            split_points.insert(0, 0)
            split_points.append(len(content))

            base_path = os.path.splitext(filepath)[0]
            output_dir = f"{base_path}_split"
            os.makedirs(output_dir, exist_ok=True)

            count = 0
            for i in range(len(split_points) - 1):
                start = split_points[i]
                end = split_points[i + 1]
                chunk = content[start:end].strip()
                
                if not chunk: continue
                count += 1
                
                # THÊM MỚI: Logic xử lý {num+n} và {num-n}
                current_num = count
                temp_format = name_format
                try:
                    match = re.search(r'\{num\s*([+\-])\s*(\d+)\}', temp_format)
                    if match:
                        operator = match.group(1)
                        value = int(match.group(2))
                        current_num = current_num + value if operator == '+' else current_num - value
                        temp_format = re.sub(r'\{num\s*([+\-])\s*(\d+)\}', '{num}', temp_format)
                except (TypeError, ValueError):
                    pass # Bỏ qua nếu có lỗi, dùng số gốc
                
                try:
                    new_filename = temp_format.format(num=current_num)
                except (KeyError, ValueError):
                    new_filename = f"part_{count}.txt"
                
                sanitized_filename = TextOperations._sanitize_filename(new_filename)
                output_path = os.path.join(output_dir, sanitized_filename)
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(chunk)

            return count, None

        except Exception as e:
            return 0, str(e)

