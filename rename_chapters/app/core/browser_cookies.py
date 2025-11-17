import os
import sqlite3
from typing import Iterable, Optional, Set

from requests.cookies import RequestsCookieJar

from app.paths import BASE_DIR

COOKIES_DB_PATH = os.path.join(BASE_DIR, "qt_browser_profile", "storage", "Cookies")


def _domain_match(host_key: str, domain: str) -> bool:
    host = (host_key or "").lstrip(".").lower()
    domain = (domain or "").lstrip(".").lower()
    if not host or not domain:
        return False
    return host == domain or host.endswith("." + domain)


def load_browser_cookie_jar(domains: Iterable[str], required_names: Optional[Iterable[str]] = None) -> Optional[RequestsCookieJar]:
    """
    Đọc cookie từ profile của trình duyệt tích hợp (Qt WebEngine).
    Chỉ trả về những cookie thuộc các domain mong muốn.
    Nếu chỉ định `required_names`, tất cả cookie này (theo tên, không phân biệt hoa thường) phải tồn tại.
    """
    if not os.path.exists(COOKIES_DB_PATH):
        return None

    normalized_domains = [d.lstrip(".").lower() for d in domains if d]
    if not normalized_domains:
        return None
    required: Set[str] = {name.lower() for name in (required_names or []) if name}

    jar = RequestsCookieJar()
    cookies_added = False
    found_required: Set[str] = set()
    dedup_keys: Set[tuple] = set()

    try:
        conn = sqlite3.connect(COOKIES_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        for domain in normalized_domains:
            like_pattern = f"%{domain}"
            for row in cursor.execute(
                "SELECT host_key, name, value, path FROM cookies WHERE lower(host_key) LIKE ?", (like_pattern,)
            ):
                host_key = row["host_key"] or ""
                if not _domain_match(host_key, domain):
                    continue
                cookie_name = row["name"] or ""
                dedup_id = (host_key, cookie_name, row["path"] or "/")
                if dedup_id in dedup_keys:
                    continue
                dedup_keys.add(dedup_id)
                jar.set(cookie_name, row["value"] or "", domain=host_key or domain, path=row["path"] or "/")
                cookies_added = True
                name_lower = cookie_name.lower()
                if name_lower in required:
                    found_required.add(name_lower)
    except sqlite3.Error:
        return None
    finally:
        try:
            conn.close()
        except Exception:
            pass

    if not cookies_added:
        return None
    if required and not required.issubset(found_required):
        return None
    return jar
