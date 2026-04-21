# translator_logic.py
import requests
import json
import time
import re
import unicodedata

# --- BIẾN TOÀN CỤC CHO CACHE ---
hanviet_map_cache = None
_CJK_RE = re.compile(r"[\u3400-\u9fff]")
_INVISIBLE_TEXT_FORMATTING_RE = re.compile(r"[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]")
_INLINE_SPACE_RE = re.compile(r"[ \t\f\v]+")


def _is_wordish_char(ch: str) -> bool:
    if not ch:
        return False
    try:
        return unicodedata.category(ch)[0] in {"L", "N", "M"}
    except Exception:
        return False


def _should_attach_quote_left(ch: str) -> bool:
    return _is_wordish_char(ch) or ch in {".", "!", "?", ",", "…"}


def normalize_text_for_translation(text: str) -> str:
    value = str(text or "")
    if not value:
        return ""
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = value.replace("\u2028", "\n").replace("\u2029", "\n")
    return _INVISIBLE_TEXT_FORMATTING_RE.sub("", value)


def _normalize_straight_quote_pairs(text: str) -> str:
    if not text:
        return ""
    result: list[str] = []
    inside_quote = False
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch != '"':
            result.append(ch)
            i += 1
            continue
        if not inside_quote:
            prev = result[-1] if result else ""
            if prev and not (prev.isspace() or prev in "([{"):
                result.append(" ")
            result.append('"')
            i += 1
            while i < n and text[i] in " \t\f\v":
                i += 1
            inside_quote = True
            continue
        while result and result[-1] in " \t\f\v":
            result.pop()
        result.append('"')
        i += 1
        while i < n and text[i] in " \t\f\v":
            i += 1
        if i < n and _is_wordish_char(text[i]):
            result.append(" ")
        inside_quote = False
    return "".join(result)


def normalize_translated_text(text: str) -> str:
    value = normalize_text_for_translation(text)
    if not value:
        return ""
    value = re.sub(r'\\+\s*(["”“‘’])', r"\1", value)
    value = _normalize_straight_quote_pairs(value)
    value = re.sub(r'([:;,])([“‘])', r"\1 \2", value)
    value = re.sub(r'(^|[\s([{:])([“‘])[ \t\f\v]+', r"\1\2", value, flags=re.MULTILINE)
    value = re.sub(
        r'(\S)[ \t\f\v]+([”’])',
        lambda m: f"{m.group(1)}{m.group(2)}" if _should_attach_quote_left(m.group(1)) else m.group(0),
        value,
    )
    value = re.sub(
        r'([”’])([^\s\n])',
        lambda m: f'{m.group(1)} {m.group(2)}' if _is_wordish_char(m.group(2)) else m.group(0),
        value,
    )
    value = re.sub(r"[ \t]+\n", "\n", value)
    value = re.sub(r"\n[ \t]+", "\n", value)
    value = _INLINE_SPACE_RE.sub(" ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()

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
        result = re.sub(re.escape(placeholder), f"{data['viet']} ", result)
    result = re.sub(r"\s+([,.;!?\)]|”|’|:)", r"\1", result)
    result = re.sub(r"([(\[“‘])\s+", r"\1", result)
    def _normalize_colon_spacing(match: re.Match[str]) -> str:
        next_char = match.group(1)
        prev_char = match.string[match.start() - 1] if match.start() > 0 else ""
        if next_char == "/" or (prev_char.isdigit() and next_char.isdigit()):
            return f":{next_char}"
        return f": {next_char}"
    result = re.sub(r":([^\s])", _normalize_colon_spacing, result)
    result = _INLINE_SPACE_RE.sub(" ", result)
    return normalize_translated_text(result)

def _split_into_batches(text_list: list, max_chars: int, max_items: int | None = None):
    batches = []
    current_batch = []
    current_len = 0
    max_chars = max(100, min(9000, int(max_chars or 4500)))
    for text in text_list:
        text_len = len(text)
        if (current_len + text_len > max_chars) and current_batch:
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
            parsed = [normalize_translated_text(item) for item in _parse_loose_json_array(translated_content)]
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


def _translation_needs_retry(source_text: str, translated_text: str) -> bool:
    source = normalize_text_for_translation(source_text).strip()
    translated = normalize_translated_text(translated_text).strip()
    if not source:
        return False
    if (not translated) or translated.startswith("[Lỗi"):
        return True
    return _looks_untranslated_translation(source, translated)


def _translate_single_text_final(
    text: str,
    server_url: str,
    proxies=None,
    target_lang: str = 'vi',
    retry_count: int = 2,
    retry_backoff_ms: int = 700,
    timeout_sec: int = 60,
):
    translated = _post_translate_batch(
        [text],
        server_url,
        proxies,
        target_lang=target_lang,
        retry_count=retry_count,
        retry_backoff_ms=retry_backoff_ms,
        timeout_sec=timeout_sec,
    )
    candidate = translated[0] if translated else ""
    if _translation_needs_retry(text, candidate):
        return normalize_translated_text(text)
    return normalize_translated_text(candidate)


def _translate_failed_batch_final(
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
        return [
            normalize_translated_text(item) if not _translation_needs_retry(source, item) else _translate_single_text_final(
                source,
                server_url,
                proxies,
                target_lang=target_lang,
                retry_count=retry_count,
                retry_backoff_ms=retry_backoff_ms,
                timeout_sec=timeout_sec,
            )
            for source, item in zip(content_array, translated)
        ]
    if len(content_array) <= 1:
        return [
            _translate_single_text_final(
                content_array[0],
                server_url,
                proxies,
                target_lang=target_lang,
                retry_count=retry_count,
                retry_backoff_ms=retry_backoff_ms,
                timeout_sec=timeout_sec,
            )
        ]
    mid = max(1, len(content_array) // 2)
    return _translate_failed_batch_final(
        content_array[:mid],
        server_url,
        proxies,
        target_lang=target_lang,
        retry_count=retry_count,
        retry_backoff_ms=retry_backoff_ms,
        timeout_sec=timeout_sec,
    ) + _translate_failed_batch_final(
        content_array[mid:],
        server_url,
        proxies,
        target_lang=target_lang,
        retry_count=retry_count,
        retry_backoff_ms=retry_backoff_ms,
        timeout_sec=timeout_sec,
    )


def _retry_suspicious_texts(
    source_texts: list[str],
    server_url: str,
    proxies=None,
    target_lang: str = 'vi',
    retry_count: int = 2,
    retry_backoff_ms: int = 700,
    timeout_sec: int = 60,
    max_chars: int = 4500,
):
    if not source_texts:
        return []
    retry_chars = max(300, min(1800, int(max_chars or 4500)))
    batches = _split_into_batches(source_texts, retry_chars)
    results: list[str] = []
    for batch in batches:
        translated = _post_translate_batch(
            batch,
            server_url,
            proxies,
            target_lang=target_lang,
            retry_count=retry_count,
            retry_backoff_ms=retry_backoff_ms,
            timeout_sec=timeout_sec,
        )
        if len(translated) != len(batch):
            results.extend(
                _translate_failed_batch_final(
                    batch,
                    server_url,
                    proxies,
                    target_lang=target_lang,
                    retry_count=retry_count,
                    retry_backoff_ms=retry_backoff_ms,
                    timeout_sec=timeout_sec,
                )
            )
            continue
        for source_text, translated_text in zip(batch, translated):
            if _translation_needs_retry(source_text, translated_text):
                results.append(
                    _translate_single_text_final(
                        source_text,
                        server_url,
                        proxies,
                        target_lang=target_lang,
                        retry_count=retry_count,
                        retry_backoff_ms=retry_backoff_ms,
                        timeout_sec=timeout_sec,
                    )
                )
            else:
                results.append(normalize_translated_text(translated_text))
    return results


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
    if len(translated) != len(content_array):
        return _translate_failed_batch_final(
            content_array,
            server_url,
            proxies,
            target_lang=target_lang,
            retry_count=retry_count,
            retry_backoff_ms=retry_backoff_ms,
            timeout_sec=timeout_sec,
        )

    resolved = [normalize_translated_text(item) for item in translated]
    suspicious_indexes = [
        idx
        for idx, (source_text, translated_text) in enumerate(zip(content_array, resolved))
        if _translation_needs_retry(source_text, translated_text)
    ]
    if not suspicious_indexes:
        return resolved

    retried_results = _retry_suspicious_texts(
        [content_array[idx] for idx in suspicious_indexes],
        server_url,
        proxies,
        target_lang=target_lang,
        retry_count=retry_count,
        retry_backoff_ms=retry_backoff_ms,
        timeout_sec=timeout_sec,
        max_chars=max(300, min(9000, int(sum(len(text or "") for text in content_array) or 4500))),
    )
    for idx, candidate in zip(suspicious_indexes, retried_results):
        resolved[idx] = normalize_translated_text(candidate)
    return resolved

def translate_text_chunks(chunks: list, name_set: dict, settings: dict, update_progress_callback=None, target_lang: str = 'vi'):
    if not chunks:
        return []

    server_url = settings.get('serverUrl', 'https://dichngay.com/translate/text')
    max_chars = max(500, min(9000, int(settings.get('maxChars', 9000) or 9000)))
    delay_ms = settings.get('delayMs', 400)
    retry_count = settings.get('retryCount', 2)
    retry_backoff_ms = settings.get('retryBackoffMs', 700)
    timeout_sec = settings.get('timeoutSec', 60)

    if update_progress_callback:
        update_progress_callback("Chuẩn bị và thay thế tên...", 0)

    replacer, placeholder_map = _build_name_set_replacer(name_set)
    texts_with_placeholders = [replacer(normalize_text_for_translation(chunk)) for chunk in chunks]

    batches = _split_into_batches(texts_with_placeholders, max_chars)
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

    if len(all_translated_texts) < len(texts_with_placeholders):
        all_translated_texts.extend(texts_with_placeholders[len(all_translated_texts):])
    elif len(all_translated_texts) > len(texts_with_placeholders):
        all_translated_texts = all_translated_texts[:len(texts_with_placeholders)]

    if update_progress_callback:
        update_progress_callback("Khôi phục tên và hoàn tất...", 95)
    
    final_results = [normalize_translated_text(_restore_names(text, placeholder_map)) for text in all_translated_texts]
    
    if update_progress_callback:
        update_progress_callback("Hoàn tất!", 100)
        
    return final_results
