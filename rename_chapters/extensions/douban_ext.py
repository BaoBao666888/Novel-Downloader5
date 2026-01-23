# extensions/douban_ext.py
import random
import re
import time

import requests


def _extract_column_id(url: str):
    if not url:
        return None
    match = re.search(r"/column/(\d+)", url)
    if match:
        return match.group(1)
    match = re.search(r"(\d+)(?:/chapters)?/?$", url)
    return match.group(1) if match else None


def get_clean_url(url: str):
    column_id = _extract_column_id(url)
    if not column_id:
        return None
    return f"https://read.douban.com/column/{column_id}/chapters"


def _safe_int(value):
    try:
        return int(value)
    except Exception:
        return None


def _extract_total(payload):
    if not isinstance(payload, dict):
        return None
    for key in ("total", "count", "totalCount"):
        total = _safe_int(payload.get(key))
        if total is not None:
            return total
    data = payload.get("data")
    if isinstance(data, dict):
        for key in ("total", "count", "totalCount"):
            total = _safe_int(data.get(key))
            if total is not None:
                return total
    return None


def _extract_items(payload):
    if not isinstance(payload, dict):
        return []
    for key in ("chapters", "items", "list"):
        value = payload.get(key)
        if isinstance(value, list):
            return value
        if isinstance(value, dict):
            for subkey in ("chapters", "items", "list"):
                subval = value.get(subkey)
                if isinstance(subval, list):
                    return subval
    data = payload.get("data")
    if isinstance(data, dict):
        for key in ("chapters", "items", "list"):
            value = data.get(key)
            if isinstance(value, list):
                return value
            if isinstance(value, dict):
                for subkey in ("chapters", "items", "list"):
                    subval = value.get(subkey)
                    if isinstance(subval, list):
                        return subval
    return []


def _pick_text(data, keys):
    if not isinstance(data, dict):
        return ""
    for key in keys:
        value = data.get(key)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return ""


def _parse_chapters(payload):
    items = _extract_items(payload)
    chapters = []
    for idx, item in enumerate(items, start=1):
        if not isinstance(item, dict):
            continue
        title = _pick_text(item, ("title", "name", "chapterTitle", "chapter_name"))
        if not title and isinstance(item.get("chapter"), dict):
            title = _pick_text(item.get("chapter"), ("title", "name"))
        if not title:
            continue
        title2 = _pick_text(item, ("subtitle", "summary", "abstract", "desc", "short_content"))
        chapters.append(
            {
                "num": idx,
                "title1": title,
                "title2": title2 or "N/A",
            }
        )
    return chapters


def fetch_chapters(url: str, proxies=None, headers=None, delay_range=None):
    column_id = _extract_column_id(url)
    if not column_id:
        return {"error": "Invalid Douban column URL. Use https://read.douban.com/column/<id>/ or /chapters."}

    base_headers = {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
        "Referer": f"https://read.douban.com/column/{column_id}/",
        "X-Requested-With": "XMLHttpRequest",
    }
    if isinstance(headers, dict):
        base_headers.update(headers)

    session = requests.Session()
    try:
        probe_url = f"https://read.douban.com/j/column_v2/{column_id}/chapters?start=0&limit=3&latestFirst=0"
        resp = session.get(probe_url, headers=base_headers, timeout=60, proxies=proxies)
        resp.raise_for_status()
        try:
            probe_payload = resp.json()
        except Exception:
            return {"error": "Failed to parse Douban probe response as JSON."}
        total = _extract_total(probe_payload)
        if total is None:
            return {"error": "Failed to detect total chapters from Douban response."}
        if total <= 0:
            return {"error": "No chapters found in Douban column."}

        delay = 0.0
        if delay_range:
            try:
                min_delay, max_delay = delay_range
                min_delay = max(0.0, float(min_delay))
                max_delay = max(min_delay, float(max_delay))
                if max_delay > 0:
                    delay = random.uniform(min_delay, max_delay)
            except Exception:
                delay = 0.0
        if delay > 0:
            time.sleep(delay)

        full_url = f"https://read.douban.com/j/column_v2/{column_id}/chapters?start=0&limit={total}&latestFirst=0"
        resp = session.get(full_url, headers=base_headers, timeout=60, proxies=proxies)
        resp.raise_for_status()
        try:
            payload = resp.json()
        except Exception:
            return {"error": "Failed to parse Douban full response as JSON."}

        chapters = _parse_chapters(payload)
        if not chapters:
            return {"error": "No chapters parsed from Douban response."}
        return {"data": chapters}
    except requests.exceptions.RequestException as exc:
        return {"error": f"Network error while fetching Douban data: {exc}"}
    except Exception as exc:
        return {"error": f"Unexpected error while parsing Douban data: {exc}"}
