from __future__ import annotations

from collections.abc import Callable
from typing import Any
from urllib.parse import urlparse


DEFAULT_VBOOK_IMAGE_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36 NovelStudio/vBook"
)


def build_vbook_image_headers(
    *,
    image_url: str,
    plugin_id: str = "",
    referer: str = "",
    normalize_host: Callable[[str], str],
    require_plugin: Callable[[str], Any],
    bridge_enabled: bool,
    load_bridge_state: Callable[[], dict[str, Any]],
    pick_bridge_host_entry: Callable[[dict[str, Any], str], dict[str, Any]],
    fallback_cookie_header_from_bridge_state: Callable[[str, dict[str, Any]], str],
) -> dict[str, str]:
    headers: dict[str, str] = {
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
    }
    parsed = urlparse(str(image_url or "").strip())
    host = normalize_host(parsed.netloc)

    resolved_referer = str(referer or "").strip()
    pid = str(plugin_id or "").strip()
    if (not resolved_referer) and pid:
        try:
            plugin = require_plugin(pid)
            source = str(getattr(plugin, "source", "") or "").strip()
            if source:
                if source.startswith("http://") or source.startswith("https://"):
                    resolved_referer = source
                else:
                    resolved_referer = "https://" + source.lstrip("/")
        except Exception:
            resolved_referer = ""
    if (not resolved_referer) and parsed.scheme and parsed.netloc:
        resolved_referer = f"{parsed.scheme}://{parsed.netloc}/"
    if resolved_referer:
        headers["Referer"] = resolved_referer
        parsed_ref = urlparse(resolved_referer)
        if parsed_ref.scheme and parsed_ref.netloc:
            headers["Origin"] = f"{parsed_ref.scheme}://{parsed_ref.netloc}"
    headers["Accept-Language"] = "zh-CN,zh;q=0.9,en;q=0.8,vi;q=0.7"
    headers["Sec-Fetch-Dest"] = "image"
    headers["Sec-Fetch-Mode"] = "no-cors"
    headers["Sec-Fetch-Site"] = "cross-site"

    user_agent = ""
    cookie_header = ""
    if host and bridge_enabled:
        state = load_bridge_state()
        entry = pick_bridge_host_entry(state, host)
        user_agent = str(entry.get("user_agent") or "").strip()
        cookie_header = str(entry.get("cookie_header") or "").strip()
        if (not cookie_header) and entry:
            cookie_header = fallback_cookie_header_from_bridge_state(host, state)

    headers["User-Agent"] = user_agent or DEFAULT_VBOOK_IMAGE_USER_AGENT
    if cookie_header:
        headers["Cookie"] = cookie_header
    return headers
