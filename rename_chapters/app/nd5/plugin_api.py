from __future__ import annotations

import time
from typing import Any, Dict, List, Protocol, runtime_checkable

import requests


class ND5Context:
    """
    Chứa các tiện ích dùng chung cho plugin (retry, proxy, sleep giữa request, log).
    Host (app chính) sẽ khởi tạo context với timeout/retries hiện tại.
    """

    def __init__(self, host: Any, plugin_id: str, timeout: float = 20.0, retries: int = 3):
        self.host = host
        self.plugin_id = plugin_id
        try:
            self.timeout = max(1.0, float(timeout or 0))
        except Exception:
            self.timeout = 20.0
        try:
            self.retries = max(1, int(retries or 1))
        except Exception:
            self.retries = 3

    def log(self, msg: str):
        try:
            self.host.log(f"[ND5][{self.plugin_id}] {msg}")
        except Exception:
            try:
                print(msg)
            except Exception:
                pass

    def get_proxy(self):
        try:
            return self.host._get_proxy_for_request(self.plugin_id)
        except Exception:
            return None

    def sleep_between_requests(self):
        try:
            self.host._nd5_sleep_between_requests()
        except Exception:
            pass

    def request_with_retry(self, url: str, method: str = "get", **kwargs):
        timeout_val = kwargs.pop("timeout", self.timeout)
        proxies = kwargs.pop("proxies", self.get_proxy())
        last_exc = None
        for attempt in range(1, self.retries + 1):
            try:
                if method.lower() == "get":
                    return requests.get(url, timeout=timeout_val, proxies=proxies, **kwargs)
                return requests.request(method, url, timeout=timeout_val, proxies=proxies, **kwargs)
            except Exception as exc:
                last_exc = exc
                if attempt >= self.retries:
                    break
                self.sleep_between_requests()
                time.sleep(0.5)
        if last_exc:
            raise last_exc
        raise RuntimeError("Request thất bại không rõ lý do")


@runtime_checkable
class ND5Plugin(Protocol):
    id: str
    name: str
    domains: List[str]
    sample_url: str
    icon: str | None
    requires_bridge: bool

    def supports_url(self, url: str) -> bool:
        ...

    def fetch_book_and_toc(self, url: str, ctx: ND5Context) -> tuple[Dict[str, Any], List[Dict[str, Any]]]:
        ...

    def download_chapter_batch(
        self,
        book: Dict[str, Any],
        ids: List[str],
        fmt: str,
        fallback_titles: Dict[str, str],
        ctx: ND5Context
    ) -> Dict[str, Dict[str, Any]]:
        ...

    def content_to_text(self, content: str) -> str:
        ...
