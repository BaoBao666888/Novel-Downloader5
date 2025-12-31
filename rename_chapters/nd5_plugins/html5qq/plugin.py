from __future__ import annotations

import re
from typing import Any, Dict, List
from urllib.parse import quote_plus

from bs4 import BeautifulSoup

from app.nd5.plugin_api import ND5Context


class Html5QQPlugin:
    """
    Downloader cho https://bookshelf.html5.qq.com (quảng cáo miễn phí).
    Dựa trên plugin JS html5qq_plugin.
    """

    id = "html5qq"
    name = "html5.qq.com"
    version = 8
    author = "Moleys"
    source = "https://bookshelf.html5.qq.com/"
    description = "Đọc truyện trên trang https://bookshelf.html5.qq.com"
    type = "chinese_novel"
    locale = "zh_CN"
    domains = ["bookshelf.html5.qq.com", "novel.html5.qq.com"]
    sample_url = "https://bookshelf.html5.qq.com/autojump/intro?bookid=123456"
    icon = "icon.png"
    requires_bridge = False

    _UA = "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Mobile Safari/537.36"
    _REFERER = "https://bookshelf.html5.qq.com/qbread"
    _GUID = "0ee63838b72eb075f63e93ae0bc288cb"
    _QIMEI36 = "8ff310843a87a71101958f5610001e316a11"

    def supports_url(self, url: str) -> bool:
        return bool(url and "bookid=" in url and ("bookshelf.html5.qq.com" in url or "novel.html5.qq.com" in url))

    def _extract_book_id(self, url: str) -> str | None:
        m = re.search(r"bookid=(\d+)", url or "")
        return m.group(1) if m else None

    def _extract_book_id_any(self, url: str) -> str | None:
        if not url:
            return None
        m = re.search(r"[?&]book(?:id|Id)=(\d+)", url)
        if m:
            return m.group(1)
        return self._extract_book_id(url)

    def _build_intro_headers(self):
        return {
            "user-agent": self._UA,
            "Referer": self._REFERER,
        }

    def _build_catalog_headers(self):
        return {
            "Referer": "https://bookshelf.html5.qq.com/qbread/adread/catalog",
            "user-agent": self._UA,
        }

    def _build_content_headers(self):
        return {
            "Referer": "https://novel.html5.qq.com/",
            "Q-GUID": self._GUID,
            "QIMEI36": self._QIMEI36,
            "Content-Type": "application/json;charset=utf-8",
            "user-agent": self._UA,
        }

    def fetch_book_and_toc(self, url: str, ctx: ND5Context) -> tuple[Dict[str, Any], List[Dict[str, Any]]]:
        book_id = self._extract_book_id(url)
        if not book_id:
            raise ValueError("Không tìm thấy bookid= trong URL.")

        intro_url = f"https://bookshelf.html5.qq.com/qbread/api/novel/intro-info?bookid={book_id}"
        ctx.sleep_between_requests()
        intro_resp = ctx.request_with_retry(intro_url, headers=self._build_intro_headers())
        intro_resp.raise_for_status()
        intro_json = intro_resp.json()
        book_info = (intro_json.get("data") or {}).get("bookInfo") if isinstance(intro_json, dict) else {}
        meta = {
            "book_id": book_id,
            "title": book_info.get("resourceName") or book_info.get("bookName") or f"HTML5QQ_{book_id}",
            "author": book_info.get("author") or "",
            "intro": (book_info.get("summary") or "").replace("\n", "\n\n"),
            "cover": book_info.get("picurl") or "",
        }

        catalog_url = f"https://novel.html5.qq.com/cgi-bin/novel_reader/catalog?book_id={book_id}"
        ctx.sleep_between_requests()
        cat_resp = ctx.request_with_retry(catalog_url, headers=self._build_catalog_headers())
        cat_resp.raise_for_status()
        cat_json = cat_resp.json()
        catalog = cat_json.get("catalog") if isinstance(cat_json, dict) else None
        toc: List[Dict[str, Any]] = []
        if isinstance(catalog, list):
            for idx, entry in enumerate(catalog, start=1):
                serial_id = entry.get("serial_id") or entry.get("serialId") or idx
                title = entry.get("serial_name") or entry.get("serialName") or f"Chương {idx}"
                toc.append({"num": idx, "id": str(serial_id), "title": title})
        return meta, toc

    def download_chapter_batch(
        self,
        book: Dict[str, Any],
        ids: List[str],
        fmt: str,
        fallback_titles: Dict[str, str],
        ctx: ND5Context,
    ) -> Dict[str, Dict[str, Any]]:
        if not ids:
            return {}
        book_id = (book or {}).get("book_id") or (book or {}).get("id")
        if not book_id:
            return {}
        results: Dict[str, Dict[str, Any]] = {}
        for cid in ids:
            text = self._fetch_single_chapter(book_id, cid, ctx)
            if text is None:
                continue
            results[str(cid)] = {
                "title": fallback_titles.get(cid) or fallback_titles.get(str(cid)) or f"Chương {cid}",
                "content": text,
            }
        return results

    def _fetch_single_chapter(self, book_id: str, chapter_id: str, ctx: ND5Context):
        if not str(chapter_id).isdigit():
            return None
        payload = {
            "ContentAnchorBatch": [
                {
                    "BookID": int(book_id),
                    "ChapterSeqNo": [int(chapter_id)],
                }
            ],
            "Scene": "chapter",
        }
        ctx.sleep_between_requests()
        resp = ctx.request_with_retry(
            "https://novel.html5.qq.com/be-api/content/ads-read",
            method="post",
            headers=self._build_content_headers(),
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        content = self._extract_ads_read_content(data)
        if content is None:
            return None
        return str(content).replace("\r\n", "<br>")

    def _extract_ads_read_content(self, payload: Any):
        if not isinstance(payload, dict):
            return None
        data = payload.get("data") or {}
        content = data.get("Content") if isinstance(data, dict) else None
        if isinstance(content, list) and content:
            first = content[0]
            if isinstance(first, dict):
                inner = first.get("Content")
                if isinstance(inner, list) and inner:
                    return inner[0]
                if isinstance(inner, str):
                    return inner
            elif isinstance(first, list) and first:
                return first[0]
        if isinstance(data, dict):
            return data.get("content") or data.get("text")
        return None

    def _normalize_newlines(self, text: str) -> str:
        return re.sub(r"\n{2,}", "\n", str(text or "").replace("\r\n", "\n").replace("\r", "\n"))

    def content_to_text(self, content: str) -> str:
        if content is None:
            return ""
        text = str(content)
        if "<" in text and ">" in text:
            try:
                soup = BeautifulSoup(text, "html.parser")
                paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
                if paragraphs:
                    return self._normalize_newlines("\n\n".join(p for p in paragraphs if p))
                return self._normalize_newlines(soup.get_text("\n", strip=True))
            except Exception:
                return self._normalize_newlines(text)
        return self._normalize_newlines(text)

    def search(self, query: str, page: int, ctx: ND5Context):
        if not query:
            return [], None
        url = (
            "https://so.html5.qq.com/ajax/real/search_result"
            f"?tabId=360&noTab=1&q={quote_plus(query)}"
        )
        headers = {"user-agent": self._UA, "Referer": "https://so.html5.qq.com/"}
        ctx.sleep_between_requests()
        resp = ctx.request_with_retry(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        states = (data.get("data") or {}).get("state") if isinstance(data, dict) else None
        results = []
        if isinstance(states, list):
            for entry in states:
                if not isinstance(entry, dict):
                    continue
                items = entry.get("items")
                if not isinstance(items, list) or not items:
                    continue
                item = items[0]
                if not isinstance(item, dict):
                    continue
                if str(item.get("adfree")) != "1":
                    continue
                jump_url = item.get("jump_url") or item.get("jumpUrl") or ""
                book_id = (
                    item.get("bookid")
                    or item.get("bookId")
                    or self._extract_book_id_any(jump_url)
                )
                url_val = (
                    f"https://bookshelf.html5.qq.com/autojump/intro?bookid={book_id}"
                    if book_id
                    else ""
                )
                results.append(
                    {
                        "title": item.get("title") or "",
                        "author": item.get("author") or "",
                        "cover": item.get("cover_url") or "",
                        "url": url_val,
                        "desc": item.get("author") or "",
                    }
                )
        return results, None


def get_plugin():
    return Html5QQPlugin()
