# translator_logic.py
import requests
import json
import time
import re

# --- BIẾN TOÀN CỤC CHO CACHE ---
hanviet_map_cache = None
_CJK_RE = re.compile(r"[\u3400-\u9fff]")

def load_hanviet_json(url: str):
    """Tải và cache file Hán-Việt JSON từ URL."""
    global hanviet_map_cache
    if hanviet_map_cache is not None:
        return hanviet_map_cache
    
    if not url:
        hanviet_map_cache = {}
        return hanviet_map_cache
        
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        hanviet_map_cache = response.json()
        return hanviet_map_cache
    except Exception as e:
        print(f"Không thể tải file Hán-Việt: {e}")
        hanviet_map_cache = {} # Trả về dict rỗng nếu lỗi để không thử lại
        return hanviet_map_cache

def build_hanviet_from_map(chinese_text: str, hanviet_map: dict):
    """Tạo chuỗi Hán-Việt từ text và map đã tải."""
    if not hanviet_map or not chinese_text:
        return ""
    # Xử lý đa âm, lấy âm đầu tiên
    return ' '.join(hanviet_map.get(char, char).split('/')[0] for char in chinese_text)

def progressive_capitalizations(s: str):
    """Tạo các biến thể viết hoa cho một chuỗi."""
    words = s.split()
    if not words:
        return []
    
    lines = [s.lower()] # Dòng đầu không viết hoa
    for i in range(1, len(words) + 1):
        capitalized_part = ' '.join(w.capitalize() for w in words[:i])
        remaining_part = ' '.join(words[i:]).lower()
        lines.append(f"{capitalized_part} {remaining_part}".strip())
    return lines

def _build_name_set_replacer(name_set: dict):
    sorted_keys = sorted(name_set.keys(), key=len, reverse=True)
    placeholder_map = {}
    
    def replacer(text: str):
        nonlocal placeholder_map
        output_text = text
        for key in sorted_keys:
            if not key: continue
            if key in output_text:
                if key not in [v['orig'] for v in placeholder_map.values()]:
                    placeholder_id = f"__TM_NAME_{len(placeholder_map)}__"
                    placeholder_map[placeholder_id] = {'orig': key, 'viet': name_set[key]}
                
                found_placeholder = next((pid for pid, data in placeholder_map.items() if data['orig'] == key), None)
                if found_placeholder:
                    output_text = output_text.replace(key, found_placeholder)
        return output_text
        
    return replacer, placeholder_map

def _restore_names(text: str, placeholder_map: dict):
    if not text or not placeholder_map:
        return text
    result = text
    for placeholder, data in placeholder_map.items():
        result = re.sub(re.escape(placeholder), data['viet'], result)
    return result

def _split_into_batches(text_list: list, max_chars: int, max_items: int = 40):
    batches = []
    current_batch = []
    current_len = 0
    item_limit = max(1, int(max_items or 1))
    for text in text_list:
        text_len = len(text)
        next_count = len(current_batch) + 1
        if ((current_len + text_len > max_chars) or (next_count > item_limit)) and current_batch:
            batches.append(current_batch)
            current_batch = [text]
            current_len = text_len
        else:
            current_batch.append(text)
            current_len += text_len
    if current_batch:
        batches.append(current_batch)
    return batches


def _count_cjk_chars(text: str) -> int:
    return len(_CJK_RE.findall(str(text or "")))


def _looks_untranslated_translation(source_text: str, translated_text: str) -> bool:
    source = str(source_text or "").strip()
    translated = str(translated_text or "").strip()
    if not source or not translated:
        return False
    if translated.startswith("[Lỗi"):
        return False
    source_cjk = _count_cjk_chars(source)
    if source_cjk <= 0:
        return False
    translated_cjk = _count_cjk_chars(translated)
    if translated == source:
        return True
    if translated_cjk >= max(2, int(source_cjk * 0.55)):
        return True
    source_compact = re.sub(r"[\s\W_]+", "", source)
    translated_compact = re.sub(r"[\s\W_]+", "", translated)
    if source_compact and translated_compact and source_compact == translated_compact:
        return True
    return False


def _decode_loose_json_escape(ch: str) -> str:
    mapping = {
        '"': '"',
        "\\": "\\",
        "/": "/",
        "b": "\b",
        "f": "\f",
        "n": "\n",
        "r": "\r",
        "t": "\t",
    }
    return mapping.get(ch, ch)


def _parse_loose_json_array(content):
    if isinstance(content, list):
        return [str(item or "") for item in content]

    raw = str(content or "").strip()
    if not raw:
        return []

    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(item or "") for item in parsed]
    except Exception:
        pass

    body = raw
    if body.startswith("["):
        body = body[1:]
    if body.endswith("]"):
        body = body[:-1]

    items = []
    i = 0
    n = len(body)
    while i < n:
        while i < n and body[i] in " \t\r\n,":
            i += 1
        if i >= n:
            break

        if body[i] != '"':
            start = i
            while i < n and body[i] != ",":
                i += 1
            token = body[start:i].strip()
            if token:
                items.append(token)
            continue

        i += 1
        buf = []
        while i < n:
            ch = body[i]
            if ch == "\\":
                i += 1
                if i >= n:
                    buf.append("\\")
                    break
                next_ch = body[i]
                if next_ch == "u" and i + 4 < n:
                    hex_part = body[i + 1:i + 5]
                    try:
                        buf.append(chr(int(hex_part, 16)))
                        i += 5
                        continue
                    except Exception:
                        buf.append("u")
                        i += 1
                        continue
                buf.append(_decode_loose_json_escape(next_ch))
                i += 1
                continue
            if ch == '"':
                j = i + 1
                while j < n and body[j] in " \t\r\n":
                    j += 1
                if j >= n or body[j] == ",":
                    i = j + 1 if j < n and body[j] == "," else j
                    break
                buf.append('"')
                i += 1
                continue
            buf.append(ch)
            i += 1
        items.append("".join(buf))
    return [str(item or "") for item in items]

def _post_translate_batch(
    content_array: list,
    server_url: str,
    proxies=None,
    target_lang: str = 'vi',
    retry_count: int = 2,
    retry_backoff_ms: int = 700,
    timeout_sec: int = 60,
):
    payload = {'content': json.dumps(content_array, ensure_ascii=False), 'tl': target_lang}
    headers = {'Content-Type': 'application/json', 'Referer': 'https://dichngay.com/'}
    attempts = max(1, int(retry_count or 0) + 1)
    last_request_error = None
    last_parse_error = None
    for attempt in range(attempts):
        try:
            response = requests.post(
                server_url,
                json=payload,
                headers=headers,
                timeout=max(10, int(timeout_sec or 60)),
                proxies=proxies,
            )
            response.raise_for_status()
            json_response = response.json()
            translated_content = json_response.get('data', {}).get('content')
            if translated_content in (None, ""):
                translated_content = json_response.get('translatedText', [])
            parsed = _parse_loose_json_array(translated_content)
            if len(parsed) == len(content_array):
                return parsed
            if parsed:
                return parsed
        except requests.exceptions.RequestException as e:
            last_request_error = e
        except json.JSONDecodeError as e:
            last_parse_error = e
        if attempt < attempts - 1:
            time.sleep(max(0.1, int(retry_backoff_ms or 700) / 1000.0))
    if last_request_error is not None:
        return [f"[Lỗi mạng: {last_request_error}]"] * len(content_array)
    return [f"[Lỗi server response]"] * len(content_array)


def _translate_batch_resilient(
    content_array: list,
    server_url: str,
    proxies=None,
    target_lang: str = 'vi',
    retry_count: int = 2,
    retry_backoff_ms: int = 700,
    timeout_sec: int = 60,
):
    if not content_array:
        return []

    translated = _post_translate_batch(
        content_array,
        server_url,
        proxies,
        target_lang=target_lang,
        retry_count=retry_count,
        retry_backoff_ms=retry_backoff_ms,
        timeout_sec=timeout_sec,
    )
    if len(translated) == len(content_array):
        suspicious = [
            idx
            for idx, (source_text, translated_text) in enumerate(zip(content_array, translated))
            if _looks_untranslated_translation(source_text, translated_text)
        ]
        if not suspicious:
            return translated

    if len(content_array) <= 1:
        if translated:
            return translated[:1]
        return ["[Lỗi server response thiếu item]"]

    mid = max(1, len(content_array) // 2)
    left = _translate_batch_resilient(
        content_array[:mid],
        server_url,
        proxies,
        target_lang=target_lang,
        retry_count=retry_count,
        retry_backoff_ms=retry_backoff_ms,
        timeout_sec=timeout_sec,
    )
    right = _translate_batch_resilient(
        content_array[mid:],
        server_url,
        proxies,
        target_lang=target_lang,
        retry_count=retry_count,
        retry_backoff_ms=retry_backoff_ms,
        timeout_sec=timeout_sec,
    )
    return left + right

def translate_text_chunks(chunks: list, name_set: dict, settings: dict, update_progress_callback=None, target_lang: str = 'vi'):
    if not chunks:
        return []

    server_url = settings.get('serverUrl', 'https://dichngay.com/translate/text')
    max_chars = settings.get('maxChars', 4500)
    max_items = settings.get('maxItems', 40)
    delay_ms = settings.get('delayMs', 400)
    retry_count = settings.get('retryCount', 2)
    retry_backoff_ms = settings.get('retryBackoffMs', 700)
    timeout_sec = settings.get('timeoutSec', 60)

    if update_progress_callback:
        update_progress_callback("Chuẩn bị và thay thế tên...", 0)

    replacer, placeholder_map = _build_name_set_replacer(name_set)
    texts_with_placeholders = [replacer(chunk) for chunk in chunks]

    batches = _split_into_batches(texts_with_placeholders, max_chars, max_items)
    total_batches = len(batches)
    
    all_translated_texts = []
    for i, batch in enumerate(batches):
        if update_progress_callback:
            progress = int((i / total_batches) * 100)
            update_progress_callback(f"Đang dịch gói {i+1}/{total_batches}...", progress)
        
        translated_batch = _translate_batch_resilient(
            batch,
            server_url,
            settings.get('proxies'),
            target_lang=target_lang or 'vi',
            retry_count=retry_count,
            retry_backoff_ms=retry_backoff_ms,
            timeout_sec=timeout_sec,
        )
        all_translated_texts.extend(translated_batch)
        
        if i < total_batches - 1:
            time.sleep(delay_ms / 1000.0)

    suspicious_indexes = [
        idx
        for idx, (source_text, translated_text) in enumerate(zip(texts_with_placeholders, all_translated_texts))
        if _looks_untranslated_translation(source_text, translated_text)
    ]
    if suspicious_indexes:
        retry_batches = _split_into_batches(
            [texts_with_placeholders[idx] for idx in suspicious_indexes],
            min(max(200, int(max_chars or 4500)), 900),
            max_items=4,
        )
        retried_results: list[str] = []
        for batch in retry_batches:
            retried_results.extend(
                _translate_batch_resilient(
                    batch,
                    server_url,
                    settings.get('proxies'),
                    target_lang=target_lang or 'vi',
                    retry_count=retry_count,
                    retry_backoff_ms=retry_backoff_ms,
                    timeout_sec=timeout_sec,
                )
            )
        for idx, candidate in zip(suspicious_indexes, retried_results):
            if not _looks_untranslated_translation(texts_with_placeholders[idx], candidate):
                all_translated_texts[idx] = candidate

    if len(all_translated_texts) < len(texts_with_placeholders):
        all_translated_texts.extend(texts_with_placeholders[len(all_translated_texts):])
    elif len(all_translated_texts) > len(texts_with_placeholders):
        all_translated_texts = all_translated_texts[:len(texts_with_placeholders)]

    if update_progress_callback:
        update_progress_callback("Khôi phục tên và hoàn tất...", 95)
        
    final_results = [_restore_names(text, placeholder_map) for text in all_translated_texts]
    
    if update_progress_callback:
        update_progress_callback("Hoàn tất!", 100)
        
    return final_results
