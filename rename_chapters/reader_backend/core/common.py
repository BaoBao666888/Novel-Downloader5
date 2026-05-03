from __future__ import annotations

import hashlib
import time
from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote, urlparse


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def utc_now_ts() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def parse_iso_ts(value: Any) -> float:
    raw = str(value or "").strip()
    if not raw:
        return 0.0
    try:
        if raw.endswith("Z"):
            raw = raw[:-1] + "+00:00"
        return float(datetime.fromisoformat(raw).timestamp())
    except Exception:
        return 0.0


def normalize_host(value: str) -> str:
    raw = str(value or "").strip().lower()
    if not raw:
        return ""
    if "://" not in raw:
        raw = "https://" + raw
    try:
        parsed = urlparse(raw)
        host = (parsed.hostname or "").strip().lower()
    except Exception:
        host = ""
    return host


def host_aliases(host: str) -> list[str]:
    raw = normalize_host(host)
    if not raw:
        return []
    aliases: list[str] = []
    for item in (raw, raw.lstrip("www."), "www." + raw.lstrip("www.")):
        value = str(item or "").strip().lower()
        if value and value not in aliases:
            aliases.append(value)
    return aliases


def host_matches_domain(host: str, domain: str) -> bool:
    h = str(host or "").strip().lower().lstrip(".")
    d = str(domain or "").strip().lower().lstrip(".")
    if not h or not d:
        return False
    return h == d or h.endswith("." + d)


def hash_text(value: str) -> str:
    return hashlib.sha1(value.encode("utf-8", errors="ignore")).hexdigest()


def quote_url_path(value: str) -> str:
    return quote(value or "", safe="")


def sleep_retry(attempt: int) -> None:
    time.sleep(0.05 * (int(attempt) + 1))

