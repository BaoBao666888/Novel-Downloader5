import hashlib
import json
import os
import re
import unicodedata
import time
from datetime import datetime
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple
from urllib.parse import urljoin, urlparse, parse_qs, unquote

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://truyenwikidich.net"
USER_AGENT = "RenameChapters-Wikidich/0.2"

STATUS_OPTIONS = ["Còn tiếp", "Hoàn thành", "Tạm ngưng", "Chưa xác minh"]
ROLE_OPTIONS = ["poster", "managerOwner", "managerGuest", "editorOwner", "editorGuest"]
FLAG_OPTIONS = ["embedLink", "embedFile"]


class CloudflareBlocked(Exception):
    def __init__(self, partial_data: Optional[Dict[str, Any]] = None, next_start: int = 0, page_size: int = 0):
        super().__init__("Cloudflare challenge")
        self.partial_data = partial_data or {}
        self.next_start = next_start
        self.page_size = page_size


def _normalize(text: str) -> str:
    if not text:
        return ""
    lowered = unicodedata.normalize("NFD", text)
    ascii_text = "".join(ch for ch in lowered if unicodedata.category(ch) != "Mn")
    return ascii_text.lower().strip()


def _is_cloudflare_response(resp: requests.Response) -> bool:
    if resp is None:
        return False
    status = resp.status_code
    text = (resp.text or "").lower()
    markers = [
        "__cf_chl",
        "cf-browser-verification",
        "attention required",
        "just a moment",
        "please enable cookies",
        "ray id",
        "cf-error-code",
    ]
    if status in (403, 429, 503, 520):
        return True
    return any(m in text for m in markers)


def _parse_abbr(raw: str) -> Optional[int]:
    if raw is None:
        return None
    txt = raw.strip().upper()
    match = re.match(r"([0-9]+(?:\.[0-9]+)?)([KMB]?)", txt)
    if not match:
        digits = re.sub(r"[^0-9]", "", txt)
        return int(digits) if digits.isdigit() else None
    value = float(match.group(1))
    suffix = match.group(2)
    if suffix == "K":
        value *= 1_000
    elif suffix == "M":
        value *= 1_000_000
    elif suffix == "B":
        value *= 1_000_000_000
    return int(value)


def _parse_vn_date(text: str) -> Tuple[str, int]:
    """
    Trả về (iso_string, timestamp_ms) hoặc ("", 0) nếu không parse được.
    Hỗ trợ dd-mm-yyyy, dd/mm/yyyy, yyyy-mm-dd kèm giờ phút.
    """
    if not text:
        return "", 0
    s = text.strip()
    # Loại bỏ nhãn kiểu "Thời gian đổi mới:" hoặc dấu gạch đầu dòng
    s = re.sub(r"^[\-\u2013\u2014]\s*", "", s)
    s = re.sub(r"^[^0-9]*?:\s*", "", s)
    s = s.replace(".", "/").replace("-", "/")
    parts = s.split("/")
    dt: Optional[datetime] = None
    try:
        if len(parts) >= 3:
            if len(parts[0]) == 4:
                # yyyy/mm/dd
                dt = datetime(int(parts[0]), int(parts[1]), int(parts[2]))
            else:
                # dd/mm/yyyy
                dt = datetime(int(parts[2]), int(parts[1]), int(parts[0]))
    except Exception:
        dt = None
    if not dt:
        m = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", s)
        if m:
            try:
                dt = datetime(int(m.group(3)), int(m.group(2)), int(m.group(1)))
            except Exception:
                dt = None
    if not dt:
        return "", 0
    iso = dt.strftime("%Y-%m-%d")
    return iso, int(dt.timestamp() * 1000)


def _default_flags() -> Dict[str, bool]:
    return {
        "poster": False,
        "managerOwner": False,
        "managerGuest": False,
        "editorOwner": False,
        "editorGuest": False,
        "private": False,
        "embedLink": False,
        "embedFile": False,
        "duplicate": False,
        "vip": False,
    }


def _make_session(cookies=None, proxies=None) -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": USER_AGENT,
            "X-Requested-With": "XMLHttpRequest",
        }
    )
    if cookies:
        session.cookies.update(cookies)
    if proxies:
        session.proxies.update(proxies)
    return session


def _extract_current_user(doc: BeautifulSoup) -> Optional[str]:
    for anchor in doc.select('a[href^="/user/"]'):
        text = anchor.get_text(strip=True)
        if "Hồ sơ của tôi" in text:
            href = anchor.get("href", "")
            parts = href.split("/")
            if len(parts) >= 3:
                return parts[2]
    return None


def fetch_current_user(session: requests.Session, base_url: str = BASE_URL, proxies=None) -> Optional[str]:
    resp = session.get(base_url, timeout=30, proxies=proxies)
    if resp.status_code != 200:
        return None
    doc = BeautifulSoup(resp.text, "html.parser")
    return _extract_current_user(doc)


def _read_total(doc: BeautifulSoup) -> Optional[int]:
    node = doc.select_one(".book-count")
    if not node:
        return None
    digits = re.sub(r"[^0-9]", "", node.get_text())
    return int(digits) if digits.isdigit() else None


def _read_page_size(doc: BeautifulSoup) -> int:
    container = doc.select_one(".book-list")
    if not container:
        return 0
    return len(container.select(":scope > .book-info"))


def _read_max_pages(doc: BeautifulSoup, page_size: int) -> int:
    if page_size:
        total = _read_total(doc)
        if total:
            return max(1, (total + page_size - 1) // page_size)
    paginations = doc.select("ul.pagination a[data-start]")
    if paginations and page_size:
        try:
            last_start = max(int(a.get("data-start", "0") or 0) for a in paginations)
            return (last_start // page_size) + 1
        except Exception:
            return 1
    return 1


def _parse_book_node(node, base_url: str) -> Optional[Dict[str, Any]]:
    try:
        checkbox = node.select_one('input[name="bookId"]')
        book_id = checkbox.get("value", "").strip() if checkbox else ""
        if not book_id:
            return None

        title_anchor = node.select_one(".book-title")
        title = title_anchor.get_text(strip=True) if title_anchor else ""
        url = urljoin(base_url, title_anchor.get("href", "")) if title_anchor else ""
        cover_img = node.select_one(".book-cover img")
        cover_url = urljoin(base_url, cover_img.get("src", "")) if cover_img else ""

        authors = node.select(".book-author")
        author = authors[0].get_text(strip=True) if authors else ""
        status = ""
        tags: List[str] = []
        for idx, p in enumerate(authors):
            if idx == 0:
                continue
            href = p.select_one("a")
            href_val = href.get("href", "") if href else ""
            text_val = p.get_text(strip=True)
            if "status=" in href_val:
                status = text_val
            elif text_val:
                tags.append(text_val)

        stats = {"views": None, "rating": None, "comments": None}
        for span in node.select(".book-stats"):
            icon = span.select_one("i")
            value_node = span.select_one("[data-ready]") or span
            raw = value_node.get_text(strip=True)
            icon_name = (icon.get_text(strip=True) if icon and "material-icons" in icon.get("class", []) else (icon.get("class", [""])[0] if icon else ""))
            if icon_name == "visibility":
                stats["views"] = _parse_abbr(raw)
            elif icon_name == "star":
                stats["rating"] = _parse_abbr(raw)
            elif "fa-comment" in icon_name:
                stats["comments"] = _parse_abbr(raw)

        extra = node.select_one(".book-info-extra")
        chapters = None
        updated_text = ""
        if extra:
            chap_node = extra.select_one(".book-chapter-count")
            if chap_node:
                digits = re.sub(r"[^0-9]", "", chap_node.get_text())
                if digits.isdigit():
                    chapters = int(digits)
            upd_node = extra.select_one(".book-last-update")
            if upd_node:
                raw = upd_node.get_text(strip=True)
                updated_text = re.sub(r"^[^:]*:\s*", "", raw).strip()

        updated_iso, updated_ts = _parse_vn_date(updated_text)

        return {
            "id": book_id,
            "title": title,
            "title_norm": _normalize(title),
            "author": author,
            "author_norm": _normalize(author),
            "status": status,
            "status_norm": _normalize(status),
            "url": url,
            "cover_url": cover_url,
            "stats": stats,
            "chapters": chapters,
            "updated_text": updated_text,
            "updated_iso": updated_iso,
            "updated_ts": updated_ts,
            "collections": [],
            "tags": tags,
            "summary": "",
            "summary_norm": "",
            "flags": _default_flags(),
            "extra_links": [],
            "collected_at": datetime.utcnow().isoformat(),
        }
    except Exception:
        return None


def fetch_works(
    session: requests.Session,
    user_slug: str,
    base_url: str = BASE_URL,
    proxies=None,
    progress_cb: Optional[Callable[[str, int, int, str], None]] = None,
    delay: float = 1.5,
    max_retries: int = 5,
    stop_after: Optional[int] = None,
    existing_data: Optional[Dict[str, Any]] = None,
    start_offset: Optional[int] = None,
    page_size_hint: Optional[int] = None,
    stop_when_found_id: Optional[str] = None,
) -> Dict[str, Any]:
    works_url = f"{base_url}/user/{user_slug}/works"
    total: Optional[int] = None
    page_size: Optional[int] = page_size_hint
    book_ids: List[str] = []
    books: Dict[str, Dict[str, Any]] = {}

    if existing_data:
        book_ids = list(existing_data.get("book_ids") or [])
        books = dict(existing_data.get("books") or {})
        total = existing_data.get("total_count", total)

    start = start_offset if start_offset is not None else len(book_ids)

    while True:
        params = {"start": start} if start else {}
        resp = None
        for attempt in range(max_retries):
            try:
                resp = session.get(works_url, params=params, timeout=50, proxies=proxies)
                if resp.status_code == 503:
                    raise requests.HTTPError(f"HTTP 503 at start={start}")
                resp.raise_for_status()
                break
            except Exception:
                if attempt + 1 >= max_retries:
                    raise
                time.sleep(delay * (attempt + 1))
        if resp is None:
            break
        # Cloudflare detection: nếu gặp CF, trả về dữ liệu tạm để resume
        if _is_cloudflare_response(resp):
            partial = {
                "username": user_slug,
                "book_ids": book_ids,
                "books": books,
                "synced_at": datetime.utcnow().isoformat(),
                "total_count": total if total is not None else len(book_ids),
            }
            raise CloudflareBlocked(partial, next_start=start, page_size=page_size or 0)
        doc = BeautifulSoup(resp.text, "html.parser")
        if total is None:
            total = _read_total(doc)
        container = doc.select_one(".book-list")
        if not container:
            break
        nodes = container.select(":scope > .book-info")
        page_books = [_parse_book_node(node, base_url) for node in nodes]
        page_books = [b for b in page_books if b]
        found_anchor = False
        for b in page_books:
            if b["id"] not in books:
                book_ids.append(b["id"])
            books[b["id"]] = b
            if stop_when_found_id and b["id"] == stop_when_found_id:
                found_anchor = True
        if page_size is None:
            page_size = len(page_books) if page_books else 0
        if progress_cb:
            progress_cb("works", len(book_ids), total or 0, f"Đã lấy {len(book_ids)} truyện")
        if stop_after and len(book_ids) >= stop_after:
            break
        if found_anchor:
            break
        if not page_size or (total is not None and len(book_ids) >= total):
            break
        start += page_size
        time.sleep(delay)

    total_count = total if total is not None else len(book_ids)
    return {
        "username": user_slug,
        "book_ids": book_ids,
        "books": books,
        "synced_at": datetime.utcnow().isoformat(),
        "total_count": total_count,
    }


def fetch_works_meta(
    session: requests.Session,
    user_slug: str,
    base_url: str = BASE_URL,
    proxies=None,
    max_retries: int = 5,
) -> Dict[str, Any]:
    works_url = f"{base_url}/user/{user_slug}/works"
    resp = None
    for attempt in range(max_retries):
        try:
            resp = session.get(works_url, params={"start": 0}, timeout=40, proxies=proxies)
            resp.raise_for_status()
            break
        except Exception:
            if attempt + 1 >= max_retries:
                raise
            time.sleep(0.8 * (attempt + 1))
    if resp is None:
        raise RuntimeError("Không lấy được trang Works đầu tiên")
    doc = BeautifulSoup(resp.text, "html.parser")
    total = _read_total(doc)
    container = doc.select_one(".book-list")
    latest_id = None
    first_page_ids: List[str] = []
    if container:
        nodes = container.select(":scope > .book-info")
        parsed = [_parse_book_node(node, base_url) for node in nodes]
        parsed = [b for b in parsed if b]
        if parsed:
            latest_id = parsed[0]["id"]
            first_page_ids = [b["id"] for b in parsed]
    return {"total": total, "latest_id": latest_id, "first_page_ids": first_page_ids}


def _fetch_document(session: requests.Session, url: str, params: dict, proxies, max_retries: int, delay: float) -> BeautifulSoup:
    last_err = None
    for attempt in range(max_retries):
        try:
            resp = session.get(url, params=params, timeout=60, proxies=proxies)
            resp.raise_for_status()
            return BeautifulSoup(resp.text, "html.parser")
        except Exception as e:
            last_err = e
            time.sleep(delay * (attempt + 1))
    if last_err:
        raise last_err
    raise RuntimeError("fetch_document failed without exception")


def analyze_filter_tasks(session: requests.Session, user_slug: str, base_url: str, proxies=None, delay: float = 1.5, max_retries: int = 5) -> List[Dict[str, Any]]:
    works_url = f"{base_url}/user/{user_slug}/works"
    clean_doc = _fetch_document(session, works_url, {"start": 0}, proxies, max_retries, delay)
    anchors = clean_doc.select("#ddFilter a")
    handlers = {"bc": "Thể loại", "ba": "Vai trò", "be": "Vai trò", "bt": "Thuộc tính", "bs": "Trạng thái"}
    tasks = []
    page_size = _read_page_size(clean_doc)

    for anchor in anchors:
        label = anchor.get_text(strip=True)
        href = anchor.get("href", "")
        if not href or href == "#!" or not label or label == "Tất cả":
            continue
        try:
            url = urljoin(base_url, href)
            parsed = urlparse(url)
            query = dict([p.split("=", 1) for p in parsed.query.split("&") if "=" in p])
            if len(query) != 1:
                continue
            key, value = next(iter(query.items()))
            if key not in handlers:
                continue
            filter_doc = _fetch_document(session, url, {}, proxies, max_retries, delay)
            total = _read_total(filter_doc) or 0
            pages = _read_max_pages(filter_doc, page_size or _read_page_size(filter_doc))
            tasks.append({"label": label, "key": key, "value": value, "group": handlers[key], "total": total, "pages": pages, "params": {key: value}})
        except Exception:
            continue
        time.sleep(delay * 0.5)
    return tasks


def _apply_task(book: Dict[str, Any], task: Dict[str, Any]):
    if not book:
        return
    flags = book.get("flags") or _default_flags()
    collections = book.get("collections") or []
    key = task.get("key")
    val = task.get("value")
    if key == "bc":
        if val and task.get("label") not in collections:
            collections.append(task.get("label"))
    elif key == "ba":
        if val == "1":
            flags["managerOwner"] = True
            flags["poster"] = True
        elif val == "3":
            flags["poster"] = True
        elif val == "2":
            flags["managerGuest"] = True
    elif key == "be":
        if val == "1":
            flags["editorOwner"] = True
            flags["poster"] = True
        elif val == "2":
            flags["editorGuest"] = True
    elif key == "bt":
        if val == "1":
            flags["embedLink"] = True
        elif val == "2":
            flags["embedFile"] = True
    book["flags"] = flags
    book["collections"] = collections


def _fetch_ids_for_task(session: requests.Session, task: Dict[str, Any], user_slug: str, base_url: str, proxies=None, delay: float = 1.5, max_retries: int = 5) -> Iterable[str]:
    works_url = f"{base_url}/user/{user_slug}/works"
    start = 0
    total = task.get("total") or None
    page_size = None
    while True:
        doc = _fetch_document(session, works_url, {**task.get("params", {}), "start": start}, proxies, max_retries, delay)
        if page_size is None:
            page_size = _read_page_size(doc)
        container = doc.select_one(".book-list")
        if not container:
            break
        nodes = container.select(":scope > .book-info")
        for node in nodes:
            parsed = _parse_book_node(node, base_url)
            if parsed:
                yield parsed["id"]
        if total is not None and page_size:
            if start + page_size >= total:
                break
            start += page_size
        else:
            paginations = doc.select("ul.pagination a[data-start]")
            if not paginations:
                break
            last_start = max(int(a.get("data-start", "0") or 0) for a in paginations)
            if start >= last_start:
                break
            start += page_size or 10
        time.sleep(delay)


def collect_additional_metadata(
    session: requests.Session,
    aggregated: Dict[str, Any],
    user_slug: str,
    base_url: str = BASE_URL,
    proxies=None,
    delay: float = 1.5,
    max_retries: int = 5,
    progress_cb: Optional[Callable[[str, int, int, str], None]] = None,
) -> Dict[str, Any]:
    # Reset flags/collections
    for book in aggregated.get("books", {}).values():
        book["flags"] = _default_flags()
        book["collections"] = []

    tasks = analyze_filter_tasks(session, user_slug, base_url, proxies=proxies, delay=delay, max_retries=max_retries)
    task_groups: Dict[str, List[Dict[str, Any]]] = {}
    for t in tasks:
        task_groups.setdefault(t["group"], []).append(t)

    master_ids = set(aggregated.get("book_ids", []))
    total_groups = len(task_groups)
    group_index = 0

    for group_name, group_tasks in task_groups.items():
        group_index += 1
        progress_base = 33 + (66 * (group_index - 1) / max(total_groups, 1))
        if progress_cb:
            progress_cb("meta", 0, 100, f"Đang xử lý nhóm {group_name}")
        if not group_tasks:
            continue
        group_tasks.sort(key=lambda t: t.get("total", 0), reverse=True)
        majority = group_tasks[0]
        minorities = group_tasks[1:]
        processed = set()

        for idx, task in enumerate(minorities, start=1):
            ids = list(_fetch_ids_for_task(session, task, user_slug, base_url, proxies=proxies, delay=delay, max_retries=max_retries))
            for bid in ids:
                if bid in aggregated["books"]:
                    _apply_task(aggregated["books"][bid], task)
                    processed.add(bid)
            if progress_cb:
                progress_cb("meta", idx, len(minorities), f"Quét {task['label']} ({len(ids)} truyện)")

        y = majority.get("total", 0)
        x = majority.get("pages", 1)
        remaining = [bid for bid in master_ids if bid not in processed]
        is_safe = y >= (x - 1) * 10 and y <= x * 10
        if is_safe:
            for bid in remaining:
                if bid in aggregated["books"]:
                    _apply_task(aggregated["books"][bid], majority)
        else:
            ids = list(_fetch_ids_for_task(session, majority, user_slug, base_url, proxies=proxies, delay=delay, max_retries=max_retries))
            for bid in ids:
                if bid in aggregated["books"]:
                    _apply_task(aggregated["books"][bid], majority)
        if progress_cb:
            progress_cb("meta", 100, 100, f"Xong nhóm {group_name}")

    return aggregated
    # return {"username": user_slug, "book_ids": book_ids, "books": books, "synced_at": datetime.utcnow().isoformat()}


def _build_fuzzy_ctx(doc_text: str) -> Optional[Callable[[str], str]]:
    """
    Tìm hàm fuzzySign trong HTML (đơn giản kiểu xoay chuỗi) và trả về callable Python.
    Nếu không tìm thấy, trả về None để dùng chuỗi gốc.
    """
    match = re.search(r"function\s+fuzzySign\s*\(\s*\w+\s*\)\s*\{([^}]*)\}", doc_text)
    if not match:
        return None
    body = match.group(1)
    rot = re.search(r"text\.substring\(\s*(\d+)\s*\)\s*\+\s*text\.substring\(\s*0\s*,?\s*\1?\s*\)", body)
    if rot:
        shift = int(rot.group(1))

        def _rotate(text: str) -> str:
            return text[shift:] + text[:shift]

        return _rotate
    return None


def _gen_sign(sign_key: str, start: int, size: int, fuzzy_ctx: Optional[Callable[[str], str]]) -> str:
    base = f"{sign_key}{start}{size}"
    try:
        fuzzy_input = fuzzy_ctx(base) if callable(fuzzy_ctx) else base
    except Exception:
        fuzzy_input = base
    return hashlib.sha256(fuzzy_input.encode()).hexdigest()


def _fetch_chapter_count(
    session: requests.Session,
    base_url: str,
    book_id: str,
    sign_key: str,
    size: int,
    fuzzy_ctx: Optional[Callable[[str], str]],
    proxies=None,
) -> Optional[int]:
    total = 0
    start = 0
    # Ngăn vòng lặp vô hạn
    max_pages = 200
    for _ in range(max_pages):
        params = {
            "bookId": book_id,
            "signKey": sign_key,
            "sign": _gen_sign(sign_key, start, size, fuzzy_ctx),
            "size": size,
            "start": start,
        }
        resp = session.get(f"{base_url}/book/index", params=params, timeout=40, proxies=proxies)
        if resp.status_code != 200:
            break
        doc = BeautifulSoup(resp.text, "html.parser")
        chapters = doc.select("li.chapter-name a")
        total += len(chapters)
        pagination = doc.select("ul.pagination a[data-start]")
        if not pagination:
            break
        last_start = max(int(a.get("data-start", "0") or 0) for a in pagination)
        if start >= last_start:
            break
        start += size
    return total if total > 0 else None


def _parse_update_block(info_block: BeautifulSoup) -> Tuple[str, str, int]:
    updated_text = ""
    for p in info_block.select("p"):
        raw_text = p.get_text(" ", strip=True)
        norm = _normalize(raw_text)
        norm_fallback = norm.replace("đ", "d").replace("ð", "d")
        if (
            "thoi gian doi moi" in norm
            or "thoi gian doi moi" in norm_fallback
            or "thời gian đổi mới" in raw_text.lower()
        ):
            span = p.select_one("span")
            raw = span.get_text(strip=True) if span else raw_text
            updated_text = re.sub(r"^[^:]*:\s*", "", raw).strip()
            break
    updated_iso, updated_ts = _parse_vn_date(updated_text)
    return updated_text, updated_iso, updated_ts


def _parse_manager_flags(doc: BeautifulSoup, current_user: str) -> Dict[str, bool]:
    flags = _default_flags()
    manager_divs = doc.select(".book-manager")

    def _role(div) -> str:
        if not div:
            return ""
        role_el = div.select_one(".manager-role")
        return role_el.get_text(strip=True) if role_el else ""

    co_managers = [div for div in manager_divs if _role(div) == "Đồng quản lý"]
    poster_div = next((div for div in manager_divs if _role(div) == "Người đăng"), None)

    def _slug_from(div) -> Optional[str]:
        link = div.select_one('.manager-name a[href^="/user/"]') if div else None
        if not link:
            return None
        href = link.get("href", "")
        parts = href.split("/")
        return parts[2] if len(parts) >= 3 else None

    if poster_div and current_user:
        poster_slug = _slug_from(poster_div)
        if poster_slug and poster_slug == current_user:
            flags["poster"] = True
            if co_managers:
                flags["managerOwner"] = True

    if co_managers and current_user and not flags["poster"]:
        if current_user in filter(None, (_slug_from(div) for div in co_managers)):
            flags["managerGuest"] = True

    # Embed detection
    desc = doc.select_one(".book-desc")
    if desc:
        has_embed_link = any("liên kết nhúng" in a.get_text(strip=True).lower() for a in desc.select("a"))
        flags["embedLink"] = has_embed_link
        flags["embedFile"] = not has_embed_link
    return flags


def _normalize_external_link(href: str, base_url: str) -> str:
    abs_url = urljoin(base_url, href)
    parsed = urlparse(abs_url)
    if parsed.path.startswith("/redirect"):
        params = parse_qs(parsed.query or "")
        target = params.get("u", [""])[0]
        if target:
            return unquote(target)
    return abs_url


def _parse_additional_links(desc_block: BeautifulSoup, base_url: str, ignore_block: Optional[BeautifulSoup]) -> List[Dict[str, str]]:
    links: List[Dict[str, str]] = []
    if not desc_block:
        return links
    genre_links = ignore_block.select("a") if ignore_block else []
    for a in desc_block.select("a"):
        if not a.get("href"):
            continue
        if genre_links and a in genre_links:
            continue
        label = a.get_text(strip=True)
        if not label:
            continue
        href = a.get("href", "")
        if href.startswith("/tim-kiem"):
            continue
        links.append({"label": label, "url": _normalize_external_link(href, base_url)})
    return links


def _parse_book_page(
    doc: BeautifulSoup,
    text: str,
    book: Dict[str, Any],
    current_user_slug: str,
    base_url: str,
) -> Tuple[Dict[str, Any], str, str, int, Optional[Callable[[str], str]]]:
    """Phân tích trang truyện -> trả về (book cập nhật, book_id, sign_key, size, fuzzy_ctx)."""
    info = doc.select_one(".cover-info") or doc
    title = info.select_one("h2").get_text(strip=True) if info.select_one("h2") else book.get("title", "")
    stats = {"views": None, "rating": None, "comments": None}
    for span in info.select(".book-stats"):
        icon = span.select_one("i")
        value_node = span.select_one("[data-ready]") or span
        raw = value_node.get_text(strip=True)
        icon_name = icon.get_text(strip=True) if icon and "material-icons" in icon.get("class", []) else (icon.get("class", [""])[0] if icon else "")
        if icon_name == "visibility":
            stats["views"] = _parse_abbr(raw)
        elif icon_name == "star":
            stats["rating"] = _parse_abbr(raw)
        elif "fa-comment" in icon_name:
            stats["comments"] = _parse_abbr(raw)

    author = ""
    status = ""
    updated_text, updated_iso, updated_ts = _parse_update_block(info)
    for p in info.select("p"):
        normed = _normalize(p.get_text(" ", strip=True))
        if "tac gia" in normed and not author:
            author = p.get_text(" ", strip=True).split(":", 1)[-1].strip()
        if "tinh trang" in normed and not status:
            status = p.get_text(" ", strip=True).split(":", 1)[-1].strip()

    cover_el = doc.select_one(".cover-wrapper img")
    cover_url = urljoin(base_url, cover_el.get("src", "")) if cover_el else book.get("cover_url", "")

    genre_p = next((p for p in doc.select(".book-desc p") if "Thể loại" in p.get_text()), None)
    collections = [a.get_text(strip=True) for a in genre_p.select("a")] if genre_p else []

    desc_block = doc.select_one(".book-desc")
    summary_el = doc.select_one(".book-desc-detail")
    summary = summary_el.get_text("\n", strip=True) if summary_el else ""
    summary_norm = _normalize(summary)
    extra_links = _parse_additional_links(desc_block, base_url, genre_p)

    book_id = book.get("id") or (
        doc.select_one('input[name="bookId"]') or {}
    ).get("value", "")
    if not book_id:
        match = re.search(r'bookId\s*=\s*"([^"]+)"', text)
        book_id = match.group(1) if match else ""
    sign_key_match = re.search(r'signKey\s*=\s*"([^"]+)"', text)
    size_match = re.search(r"loadBookIndex\(\s*0\s*,\s*(\d+)", text)
    sign_key = sign_key_match.group(1) if sign_key_match else ""
    size = int(size_match.group(1)) if size_match else 500
    fuzzy_ctx = _build_fuzzy_ctx(text)
    flags = _parse_manager_flags(doc, current_user_slug)

    updated_book = dict(book)
    updated_book.update(
        {
            "title": title or book.get("title", ""),
            "title_norm": _normalize(title or book.get("title", "")),
            "author": author or book.get("author", ""),
            "author_norm": _normalize(author or book.get("author", "")),
            "status": status or book.get("status", ""),
            "status_norm": _normalize(status or book.get("status", "")),
            "stats": stats,
            "cover_url": cover_url,
            "chapters": book.get("chapters"),
            "collections": collections or book.get("collections", []),
            "summary": summary,
            "summary_norm": summary_norm,
            "extra_links": extra_links,
            "updated_text": updated_text or book.get("updated_text", ""),
            "updated_iso": updated_iso or book.get("updated_iso", ""),
            "updated_ts": updated_ts or book.get("updated_ts", 0),
            "flags": {**_default_flags(), **book.get("flags", {}), **flags},
        }
    )
    return updated_book, book_id, sign_key, size, fuzzy_ctx


def fetch_book_detail(
    session: requests.Session,
    book: Dict[str, Any],
    current_user_slug: str,
    base_url: str = BASE_URL,
    proxies=None,
    skip_chapter_count: bool = False,
) -> Dict[str, Any]:
    resp = session.get(book["url"], timeout=50, proxies=proxies)
    resp.raise_for_status()
    doc = BeautifulSoup(resp.text, "html.parser")
    text = resp.text

    updated_book, book_id, sign_key, size, fuzzy_ctx = _parse_book_page(doc, text, book, current_user_slug, base_url)

    chapters = None
    if not skip_chapter_count:
        if book_id and sign_key:
            chapters = _fetch_chapter_count(session, base_url, book_id, sign_key, size, fuzzy_ctx, proxies=proxies)
        if chapters is None:
            latest_link = next(
                (a for a in doc.select(".cover-info p a") if "/chuong-" in a.get("href", "")),
                None,
            )
            if latest_link:
                m = re.search(r"(\d+)", latest_link.get_text(strip=True))
                if m:
                    chapters = int(m.group(1))
    if chapters is not None:
        updated_book["chapters"] = chapters
    return updated_book


def _parse_chapter_nodes(doc: BeautifulSoup, base_url: str, start_offset: int = 0) -> List[Dict[str, Any]]:
    anchors = (
        doc.select("li.chapter-name a")
        or doc.select("ul#chapters li a")
        or doc.select(".chapter-name a")
        or []
    )
    chapters: List[Dict[str, Any]] = []
    for idx, a in enumerate(anchors, start=1):
        title = a.get_text(strip=True)
        href = urljoin(base_url, a.get("href", ""))
        cid = a.get("data-id") or a.get("data-chapterid") or a.get("data-chapter-id") or ""
        num = None
        for attr in ("data-order", "data-chapter", "data-chapternum", "data-idx", "data-index"):
            raw = a.get(attr)
            if raw and str(raw).strip().lstrip("-").replace(".", "", 1).isdigit():
                try:
                    num = int(float(raw))
                    break
                except Exception:
                    num = None
        if num is None:
            m = re.search(r"(\d+(?:\.\d+)?)", title)
            if m:
                try:
                    num = int(float(m.group(1)))
                except Exception:
                    num = None
        if num is None:
            num = start_offset + idx
        chapters.append({"id": cid, "number": num, "title": title, "url": href})
    return chapters


def _fetch_book_index(
    session: requests.Session,
    base_url: str,
    book_id: str,
    sign_key: str,
    size: int,
    fuzzy_ctx: Optional[Callable[[str], str]],
    proxies=None,
) -> List[Dict[str, Any]]:
    chapters: List[Dict[str, Any]] = []
    start = 0
    max_pages = 200
    for _ in range(max_pages):
        params = {
            "bookId": book_id,
            "signKey": sign_key,
            "sign": _gen_sign(sign_key, start, size, fuzzy_ctx),
            "size": size,
            "start": start,
        }
        resp = session.get(f"{base_url}/book/index", params=params, timeout=40, proxies=proxies)
        if resp.status_code != 200:
            break
        doc = BeautifulSoup(resp.text, "html.parser")
        chapters.extend(_parse_chapter_nodes(doc, base_url, start_offset=start))
        pagination = doc.select("ul.pagination a[data-start]")
        if not pagination:
            break
        last_start = max(int(a.get("data-start", "0") or 0) for a in pagination)
        if start >= last_start:
            break
        start += size
    seen = set()
    unique: List[Dict[str, Any]] = []
    for ch in chapters:
        key = (ch.get("number"), ch.get("url"))
        if key in seen:
            continue
        seen.add(key)
        unique.append(ch)
    unique.sort(key=lambda x: (x.get("number") if isinstance(x.get("number"), int) else 10**9, x.get("title", "")))
    return unique


def fetch_book_chapters(
    session: requests.Session,
    book: Dict[str, Any],
    current_user_slug: str,
    base_url: str = BASE_URL,
    proxies=None,
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Tải lại chi tiết truyện + danh sách chương mới nhất từ server."""
    resp = session.get(book["url"], timeout=50, proxies=proxies)
    resp.raise_for_status()
    doc = BeautifulSoup(resp.text, "html.parser")
    text = resp.text
    updated_book, book_id, sign_key, size, fuzzy_ctx = _parse_book_page(doc, text, book, current_user_slug, base_url)
    chapters: List[Dict[str, Any]] = []
    if book_id and sign_key:
        chapters = _fetch_book_index(session, base_url, book_id, sign_key, size, fuzzy_ctx, proxies=proxies)
    if chapters:
        updated_book["chapters"] = len(chapters)
    return updated_book, chapters


def fetch_chapter_content(
    session: requests.Session,
    chapter_url: str,
    base_url: str = BASE_URL,
    proxies=None,
) -> Dict[str, str]:
    """Tải nội dung chương (gộp các phần) và trả về html/text."""
    resp = session.get(chapter_url, timeout=50, proxies=proxies)
    resp.raise_for_status()
    text = resp.text
    doc = BeautifulSoup(text, "html.parser")
    content_node = doc.select_one("div#bookContentBody") or doc.select_one(".book-content-body")
    base_html = content_node.decode_contents() if content_node else ""
    parts = doc.select(".chapter-part")
    sign_key_match = re.search(r'signKey\s*=\s*"([^"]+)"', text)
    sign_key = sign_key_match.group(1) if sign_key_match else ""
    fuzzy_ctx = _build_fuzzy_ctx(text)
    extra_parts: List[str] = []
    if parts and sign_key:
        for part in parts[1:]:
            pid = part.get("data-id")
            ptype = part.get("data-type") or part.get("data-type")
            pn = part.get("data-pn")
            if not (pid and ptype and pn):
                continue
            base = f"{sign_key}{ptype}{pn}false"
            try:
                fuzzy_input = fuzzy_ctx(base) if callable(fuzzy_ctx) else base
            except Exception:
                fuzzy_input = base
            sign = hashlib.sha256(fuzzy_input.encode()).hexdigest()
            try:
                r = session.post(
                    f"{base_url}/chapters/part",
                    data={"id": pid, "type": ptype, "pn": pn, "en": "false", "signKey": sign_key, "sign": sign},
                    timeout=40,
                    proxies=proxies,
                )
                if r.status_code == 200:
                    data = r.json()
                    part_html = (data.get("data") or {}).get("content") or data.get("content")
                    if part_html:
                        extra_parts.append(part_html)
            except Exception:
                continue
    combined_html = base_html
    if extra_parts:
        combined_html = (combined_html or "") + "<br/>" + "<br/>".join(extra_parts)
    text_content = BeautifulSoup(combined_html, "html.parser").get_text("\n", strip=True) if combined_html else ""
    return {"html": combined_html or "", "text": text_content}


def fetch_chapter_edit(
    session: requests.Session,
    edit_url: str,
    proxies=None,
) -> Dict[str, str]:
    """Tải trang chỉnh sửa chương và trích xuất form (nameCn, contentCn)."""
    resp = session.get(edit_url, timeout=50, proxies=proxies)
    resp.raise_for_status()
    doc = BeautifulSoup(resp.text, "html.parser")
    name_cn = ""
    content_cn = ""
    title_vn = ""
    name_el = doc.select_one("#txtNameCn")
    content_el = doc.select_one("#txtContentCn")
    title_el = doc.select_one("#txtName") or doc.select_one("#txtNameVn")
    if name_el:
        name_cn = name_el.get("value", "") or name_el.get_text(strip=True)
    if content_el:
        content_cn = content_el.get("value", "") or content_el.get_text()
    if title_el:
        title_vn = title_el.get("value", "") or title_el.get_text(strip=True)
    if not name_el or not content_el:
        raise ValueError("Không tìm thấy form chỉnh sửa (có thể chưa đăng nhập?)")
    return {"name_cn": name_cn, "content_cn": content_cn, "title_vn": title_vn}


def save_chapter_edit(
    session: requests.Session,
    edit_url: str,
    name_cn: str,
    content_cn: str,
    proxies=None,
) -> Dict[str, Any]:
    """Lưu nội dung chương lên server qua PUT giống giao diện web."""
    data = {
        "nameCn": name_cn or "",
        "contentCn": content_cn or "",
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
    }
    resp = session.put(edit_url, data=data, headers=headers, timeout=50, proxies=proxies)
    try:
        payload = resp.json()
    except Exception:
        payload = None
    if resp.status_code == 200 and isinstance(payload, dict) and payload.get("err") == 0:
        return payload
    raise ValueError(f"Lưu thất bại: {payload or {'status': resp.status_code, 'text': resp.text[:200]}}")


def filter_books(data: Dict[str, Any], criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
    if not data:
        return []
    books = [data["books"][bid] for bid in data.get("book_ids", []) if bid in data.get("books", {})]
    status = criteria.get("status", "all")
    search = _normalize(criteria.get("search", ""))
    summary_q = _normalize(criteria.get("summarySearch", ""))
    extra_link_q = _normalize(criteria.get("extraLinkSearch", ""))
    categories: Iterable[str] = criteria.get("categories", [])
    roles: Iterable[str] = criteria.get("roles", [])
    flags: Iterable[str] = criteria.get("flags", [])
    from_date = criteria.get("fromDate") or ""
    to_date = criteria.get("toDate") or ""
    sort_by = criteria.get("sortBy", "recent")
    try:
        from_limit = int(datetime.fromisoformat(from_date).timestamp() * 1000) if from_date else 0
    except Exception:
        from_limit = 0
    try:
        to_limit = int(datetime.fromisoformat(to_date).timestamp() * 1000) if to_date else 0
    except Exception:
        to_limit = 0

    def to_ms_value(val: Any) -> int:
        if isinstance(val, (int, float)):
            return int(val)
        if isinstance(val, str):
            try:
                return int(datetime.fromisoformat(val).timestamp() * 1000)
            except Exception:
                return 0
        return 0

    filtered = []
    for book in books:
        if status != "all" and book.get("status_norm") != _normalize(status):
            continue
        if search and not (
            book.get("title_norm", "").find(search) != -1
            or book.get("author_norm", "").find(search) != -1
        ):
            continue
        if summary_q:
            summary_norm = book.get("summary_norm") or _normalize(book.get("summary", ""))
            if summary_q not in summary_norm:
                continue
        if extra_link_q:
            links = book.get("extra_links") or []
            matched_link = False
            for link in links:
                label = _normalize(link.get("label") if isinstance(link, dict) else "")
                url = (link.get("url") if isinstance(link, dict) else link or "").lower()
                if extra_link_q in label or extra_link_q in url:
                    matched_link = True
                    break
            if not matched_link:
                continue
        if categories:
            cols = book.get("collections", []) or []
            if not any(c in cols for c in categories):
                continue
        if roles:
            flags_obj = book.get("flags", {})
            if not any(flags_obj.get(role, False) for role in roles):
                continue
        if flags:
            flags_obj = book.get("flags", {})
            if not all(flags_obj.get(flag, False) for flag in flags):
                continue
        updated_ts = to_ms_value(book.get("updated_ts") or book.get("updated_iso"))
        if from_limit and updated_ts and updated_ts < from_limit:
            continue
        if to_limit and updated_ts and updated_ts > to_limit:
            continue
        filtered.append(book)

    def sort_key(item: Dict[str, Any]):
        if sort_by == "oldest":
            return item.get("updated_ts", 0)
        if sort_by == "views":
            return item.get("stats", {}).get("views") or 0
        if sort_by == "rating":
            return item.get("stats", {}).get("rating") or 0
        if sort_by == "title":
            return item.get("title", "").lower()
        # default recent
        return item.get("updated_ts", 0)

    reverse = sort_by in {"recent", "views", "rating"}
    filtered.sort(key=sort_key, reverse=reverse)
    return filtered


def load_cache(path: str) -> Optional[Dict[str, Any]]:
    if not path or not os.path.exists(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Bổ sung các trường còn thiếu
        for book in data.get("books", {}).values():
            book.setdefault("flags", _default_flags())
            book.setdefault("collections", [])
            book.setdefault("summary", "")
            book.setdefault("summary_norm", _normalize(book.get("summary", "")))
            book.setdefault("tags", [])
            book.setdefault("extra_links", [])
            book["title_norm"] = _normalize(book.get("title", ""))
            book["author_norm"] = _normalize(book.get("author", ""))
            book["status_norm"] = _normalize(book.get("status", ""))
        return data
    except Exception:
        return None


def save_cache(path: str, data: Dict[str, Any]) -> None:
    if not path:
        return
    folder = os.path.dirname(path)
    os.makedirs(folder, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def build_session_with_cookies(cookies, proxies=None) -> requests.Session:
    return _make_session(cookies=cookies, proxies=proxies)
