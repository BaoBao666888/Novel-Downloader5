from __future__ import annotations

import re
from typing import Any, Dict, List
from urllib.parse import quote_plus

from bs4 import BeautifulSoup

from app.nd5.plugin_api import ND5Context


class FanqieBridgePlugin:
    id = "fanqie"
    name = "Fanqie (bridge)"
    domains = ["fanqienovel.com"]
    sample_url = "https://fanqienovel.com/page/123456"
    icon = "icons/fanqie.png"
    requires_bridge = True

    _DEFAULT_HEADERS = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    }
    _SEARCH_UA = "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Mobile Safari/537.36"

    def supports_url(self, url: str) -> bool:
        return "fanqienovel.com" in (url or "")

    def _extract_book_id(self, raw_url: str):
        if not raw_url:
            return None
        m = re.search(r"/(?:page|book|reader)/(\d+)", raw_url)
        if m:
            return m.group(1)
        m = re.search(r"(\d{6,})", raw_url)
        return m.group(1) if m else None

    def _headers(self):
        return dict(self._DEFAULT_HEADERS)

    def fetch_book_and_toc(self, url: str, ctx: ND5Context) -> tuple[Dict[str, Any], List[Dict[str, Any]]]:
        book_id = self._extract_book_id(url)
        if not book_id:
            raise ValueError("Không tìm thấy book_id trong URL.")
        meta = self._fetch_book_metadata(book_id, ctx)
        toc = self._fetch_toc(book_id, ctx)
        return meta, toc

    def _fetch_book_metadata(self, book_id: str, ctx: ND5Context) -> Dict[str, Any]:
        api_url = (
            "https://api5-normal-sinfonlineb.fqnovel.com/reading/bookapi/multi-detail/v/"
            f"?aid=2329&iid=1&version_code=999&book_id={book_id}"
        )
        ctx.sleep_between_requests()
        resp = ctx.request_with_retry(api_url, headers=self._headers())
        resp.raise_for_status()
        data = resp.json()
        raw = None
        if isinstance(data, dict):
            if isinstance(data.get("data"), list) and data["data"]:
                raw = data["data"][0]
            elif isinstance(data.get("data"), dict):
                raw = data["data"].get(str(book_id)) or data["data"]
        return {
            "book_id": book_id,
            "title": (raw or {}).get("book_name") or (raw or {}).get("title") or f"Fanqie_{book_id}",
            "author": (raw or {}).get("author") or (raw or {}).get("author_name") or "",
            "intro": (raw or {}).get("abstract") or (raw or {}).get("description") or "",
            "cover": (raw or {}).get("thumb_url") or (raw or {}).get("cover") or "",
            "raw": raw or data,
        }

    def _fetch_toc(self, book_id: str, ctx: ND5Context) -> List[Dict[str, Any]]:
        url = f"https://fanqienovel.com/page/{book_id}"
        ctx.sleep_between_requests()
        try:
            resp = ctx.request_with_retry(url, headers=self._headers())
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            nodes = soup.select(".page-directory-content .chapter-item") or soup.select(".page-directory-content a.chapter-item-title")
            toc = []
            if nodes:
                for idx, node in enumerate(nodes, start=1):
                    a_tag = node if getattr(node, "name", "") == "a" else node.select_one("a.chapter-item-title") or node.select_one("a")
                    href = a_tag.get("href", "") if a_tag else ""
                    cid_match = re.search(r"/reader/(\d+)", href) if href else None
                    cid = cid_match.group(1) if cid_match else None
                    title = a_tag.get_text(strip=True) if a_tag else (node.get_text(strip=True) if hasattr(node, "get_text") else f"Chương {idx}")
                    toc.append({"num": idx, "id": cid or str(idx), "title": title})
            if toc:
                return toc
        except Exception:
            pass
        return self._fetch_toc_api(book_id, ctx)

    def _fetch_toc_api(self, book_id: str, ctx: ND5Context) -> List[Dict[str, Any]]:
        url = f"https://fanqienovel.com/api/reader/directory/detail?bookId={book_id}"
        ctx.sleep_between_requests()
        resp = ctx.request_with_retry(url, headers=self._headers())
        resp.raise_for_status()
        data = resp.json()
        volumes = (data.get("data") or {}).get("chapterListWithVolume") if isinstance(data, dict) else None
        toc: List[Dict[str, Any]] = []
        if not isinstance(volumes, list):
            return toc
        for volume in volumes:
            chapter_list = []
            if isinstance(volume, list):
                chapter_list = volume
            elif isinstance(volume, dict):
                chapter_list = volume.get("chapterList") or volume.get("chapters") or []
            if not isinstance(chapter_list, list):
                continue
            for chapter in chapter_list:
                if not isinstance(chapter, dict):
                    continue
                title = chapter.get("title") or chapter.get("chapterTitle") or chapter.get("name") or ""
                if not title:
                    continue
                cid = chapter.get("itemId") or chapter.get("item_id") or chapter.get("chapterId") or chapter.get("chapter_id")
                toc.append({"num": len(toc) + 1, "id": str(cid or len(toc) + 1), "title": title})
        return toc

    def _extract_chapter_payload(self, raw: Dict[str, Any], ids: List[str], fallback_titles: Dict[str, str]):
        results: Dict[str, Dict[str, Any]] = {}
        candidates = []
        if isinstance(raw, dict):
            if isinstance(raw.get("chapters"), dict):
                candidates.append(raw["chapters"])
            if isinstance(raw.get("data"), dict):
                candidates.append(raw["data"])
            if not candidates:
                candidates.append(raw)
        for cand in candidates:
            if not isinstance(cand, dict):
                continue
            for cid in ids:
                entry = cand.get(cid) or cand.get(str(cid))
                if entry is None:
                    continue
                if isinstance(entry, str):
                    title = fallback_titles.get(cid) or fallback_titles.get(str(cid))
                    results[str(cid)] = {"title": title or f"Chương {cid}", "content": entry}
                    continue
                if isinstance(entry, dict):
                    title = (
                        entry.get("title")
                        or entry.get("chapter_title")
                        or fallback_titles.get(cid)
                        or fallback_titles.get(str(cid))
                        or f"Chương {cid}"
                    )
                    content = (
                        entry.get("content")
                        or entry.get("data", {}).get("content")
                        or entry.get("chapter", {}).get("content")
                        or entry.get("text")
                        or entry.get("value")
                    )
                    results[str(cid)] = {"title": title, "content": content}
        if results:
            return results
        data_list = raw.get("data") if isinstance(raw, dict) else None
        if isinstance(data_list, list):
            for entry in data_list:
                if not isinstance(entry, dict):
                    continue
                cid = str(entry.get("item_id") or entry.get("chapter_id") or entry.get("cid") or entry.get("id") or "")
                if not cid:
                    continue
                title = entry.get("title") or fallback_titles.get(cid) or f"Chương {cid}"
                content = entry.get("content") or entry.get("data", {}).get("content")
                results[cid] = {"title": title, "content": content}
        return results

    def download_chapter_batch(
        self,
        book: Dict[str, Any],
        ids: List[str],
        fmt: str,
        fallback_titles: Dict[str, str],
        ctx: ND5Context
    ) -> Dict[str, Dict[str, Any]]:
        if not ids:
            return {}
        try:
            url = f"http://127.0.0.1:9999/content?item_id={','.join(ids)}"
            if fmt == "epub":
                url += "&format=epub"
            ctx.sleep_between_requests()
            resp = ctx.request_with_retry(url)
            resp.raise_for_status()
            payload = resp.json()
            return self._extract_chapter_payload(payload, ids, fallback_titles)
        except Exception:
            return {}

    def _normalize_newlines(self, text: str):
        return re.sub(r"\n{2,}", "\n", text.replace("\r\n", "\n").replace("\r", "\n"))

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
        """Tìm kiếm fanqie (ad-free). Trả (list, next_page|None)."""
        if not query:
            return [], None
        try:
            page = max(1, int(page or 1))
        except Exception:
            page = 1
        offset = (page - 1) * 10
        url = (
            "https://novel.snssdk.com/api/novel/channel/homepage/search/search/v1/"
            f"?device_platform=android&parent_enterfrom=novel_channel_search.tab.&offset={offset}&aid=1967&q={quote_plus(query)}"
        )
        headers = {"User-Agent": self._SEARCH_UA}
        ctx.sleep_between_requests()
        resp = ctx.request_with_retry(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        items = (data.get("data") or {}).get("ret_data") if isinstance(data, dict) else None
        results = []
        if isinstance(items, list):
            for el in items:
                title = el.get("title")
                if not title:
                    continue
                book_id = el.get("book_id") or el.get("bookId")
                cover = el.get("thumb_url") or ""
                cover = self._replace_cover_cdn(cover)
                results.append(
                    {
                        "title": title,
                        "author": el.get("author") or "",
                        "cover": cover,
                        "url": f"https://fanqienovel.com/page/{book_id}" if book_id else "",
                        "desc": el.get("abstract") or el.get("description") or "",
                    }
                )
        next_page = page + 1 if results else None
        return results, next_page

    def _replace_cover_cdn(self, url: str) -> str:
        if not url:
            return ""
        u = url
        u = u.replace("https://", "").replace("http://", "")
        parts = u.split("/")
        if not parts:
            return url
        parts[0] = "https://i0.wp.com/p6-novel.byteimg.com/origin"
        clean = []
        for p in parts:
            if "?" in p or "~" in p:
                clean.append(p.split("~")[0].split("?")[0])
            else:
                clean.append(p)
        return "/".join(clean)


def get_plugin():
    return FanqieBridgePlugin()
