# extensions/ihuaben_ext.py
import json
import re
import requests

API_TEMPLATE = "https://www.ihuaben.com/book/chapters/{book_id}"
MOBILE_UA = "Mozilla/5.0 (Linux; Android 10; Mobile; rv:109.0) Gecko/20100101 Firefox/110.0"


def _extract_book_id(url: str):
    match = re.search(r'/book/(\d+)', url)
    return match.group(1) if match else None


def _parse_json_or_jsonp(text: str):
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    jsonp_match = re.search(r'\(([\s\S]*)\)\s*$', text)
    if jsonp_match:
        body = jsonp_match.group(1)
        return json.loads(body)
    raise ValueError("Phản hồi API không phải JSON hoặc JSONP hợp lệ.")


def _format_titles(raw_title: str, index: int):
    raw_title = (raw_title or '').strip()
    if not raw_title:
        raw_title = f"Chương {index}"
    sub_title = raw_title if re.search(r'^第\d+章', raw_title) else f"第{index}章 {raw_title}"
    main_title = re.sub(r'^第\d+章\s*', '', sub_title).strip() or raw_title
    return main_title, sub_title


def fetch_chapters(url: str, proxies=None):
    book_id = _extract_book_id(url)
    if not book_id:
        return {'error': 'URL Ihuaben không hợp lệ. Vui lòng kiểm tra dạng https://www.ihuaben.com/book/<ID>.html'}

    api_url = API_TEMPLATE.format(book_id=book_id)
    headers = {
        "User-Agent": MOBILE_UA,
        "Accept": "application/json,text/javascript,*/*;q=0.01",
        "Referer": f"https://www.ihuaben.com/book/{book_id}.html",
    }

    try:
        resp = requests.get(api_url, headers=headers, timeout=30, proxies=proxies)
        resp.raise_for_status()
    except requests.exceptions.RequestException as exc:
        return {'error': f"Lỗi mạng khi gọi API Ihuaben: {exc}"}

    try:
        payload = _parse_json_or_jsonp(resp.text)
    except Exception as exc:
        return {'error': f"Lỗi phân tích dữ liệu Ihuaben: {exc}"}

    if not isinstance(payload, dict) or payload.get('code') != 0:
        return {'error': 'API Ihuaben trả về dữ liệu không hợp lệ.'}

    chapters_data = payload.get('chapters') or []
    if not isinstance(chapters_data, list) or not chapters_data:
        return {'error': 'API không có chương nào để hiển thị.'}

    formatted = []
    for idx, chap in enumerate(chapters_data, start=1):
        title = chap.get('title', '')
        title1, title2 = _format_titles(title, idx)
        formatted.append({
            'num': idx,
            'title1': title1,
            'title2': title2
        })

    return {'data': formatted}
