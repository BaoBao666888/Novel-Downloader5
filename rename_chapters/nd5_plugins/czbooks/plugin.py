from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote_plus, urljoin

from bs4 import BeautifulSoup, Comment

from app.nd5.plugin_api import ND5Context


class CzbooksPlugin:
    id = "czbooks"
    name = "czbooks.net"
    version = 1
    batch_size = 2
    author = "BaoBao"
    source = "https://czbooks.net/"
    description = "Tải truyện trên trang https://czbooks.net"
    type = "chinese_novel"
    locale = "zh_CN"
    domains = ["czbooks.net", "www.czbooks.net"]
    sample_url = "https://czbooks.net/n/cpgm686"
    icon = "icon.png"
    requires_bridge = False
    requires_cookies = True
    cookie_domains = ["czbooks.net", ".czbooks.net"]

    _UA = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36"
    )

    def supports_url(self, url: str) -> bool:
        return bool(re.search(r"https?://(?:www\.)?czbooks\.net/n/[^/?#]+", url or "", flags=re.I))

    def fetch_book_and_toc(self, url: str, ctx: ND5Context) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        book_url = self._normalize_book_url(url)
        if not book_url:
            raise ValueError("URL czbooks không hợp lệ. Ví dụ: https://czbooks.net/n/cpgm686")

        soup = self._request_html(book_url, ctx, referer=self.source)

        title = self._normalize_space(self._query_text(soup, [".novel-detail .title", "h1"]))
        title = title.replace("《", "").replace("》", "") if title else ""
        author = self._normalize_space(self._query_text(soup, [".novel-detail .author > a", ".novel-detail .author", ".author a"]))
        cover = self._normalize_url(self._query_attr(soup, [".thumbnail img", ".novel-detail .thumbnail img", "meta[property='og:image']"], "src"), book_url)
        if not cover:
            cover = self._normalize_url(self._query_attr(soup, ["meta[property='og:image']"], "content"), book_url)

        desc_html = self._query_html(soup, [".novel-detail .description", ".description", "meta[property='og:description']"])
        intro = self._html_to_text(desc_html)

        state_rows = soup.select(".novel-detail .state tr")
        update_time = ""
        for tr in state_rows:
            txt = self._normalize_space(tr.get_text(" ", strip=True))
            if "更新" in txt:
                update_time = txt
                break

        status, ongoing = self._parse_status(state_rows)
        detail_lines = []
        if author:
            detail_lines.append(f"Tác giả: {author}")
        if update_time:
            detail_lines.append(update_time)

        book_id = self._extract_book_id(book_url)
        meta = {
            "book_id": book_id or book_url,
            "title": title or (book_id or "czbooks"),
            "author": author,
            "intro": intro,
            "cover": cover,
            "detail": "\n".join(detail_lines).strip(),
            "status": status,
            "ongoing": ongoing,
            "book_url": book_url,
        }

        toc = self._parse_toc(soup, book_url)
        if not toc:
            raise ValueError("Không tìm thấy danh sách chương. Có thể bị Cloudflare hoặc cần cookie trình duyệt.")

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

        book_url = (book or {}).get("book_url") or ""
        results: Dict[str, Dict[str, Any]] = {}

        for cid in ids:
            cid_str = str(cid)
            chapter_url = self._chapter_url_from_id(cid_str, book_url)
            if not chapter_url:
                continue

            try:
                soup = self._request_html(chapter_url, ctx, referer=book_url or self.source)
            except Exception as exc:
                ctx.log(f"Không tải được chương {cid_str}: {exc}")
                continue

            title = (
                self._normalize_space(self._query_text(soup, [".content-title", "h1", "title"]))
                or fallback_titles.get(cid_str)
                or fallback_titles.get(cid)
                or f"Chương {cid_str}"
            )
            content = self._extract_chapter_html(soup)
            if not content:
                ctx.log(f"Không lấy được nội dung chương {cid_str} ({chapter_url})")
                continue

            results[cid_str] = {
                "title": title,
                "content": content,
            }

        return results

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
        q = (query or "").strip()
        if not q:
            return [], None
        try:
            page_val = max(1, int(page or 1))
        except Exception:
            page_val = 1

        url = f"https://czbooks.net/s/{quote_plus(q)}/{page_val}"
        soup = self._request_html(url, ctx, referer=self.source)

        results: List[Dict[str, Any]] = []
        for item in soup.select(".container .novel-item"):
            link = item.select_one("a")
            title_el = item.select_one(".novel-item-title")
            author_el = item.select_one(".novel-item-author")
            cover_el = item.select_one(".novel-item-thumbnail img")
            if not link:
                continue
            item_url = self._normalize_url(link.get("href") or "", self.source)
            if not item_url:
                continue
            results.append(
                {
                    "title": self._normalize_space(title_el.get_text(" ", strip=True) if title_el else ""),
                    "author": self._normalize_space(author_el.get_text(" ", strip=True) if author_el else ""),
                    "cover": self._normalize_url((cover_el.get("src") if cover_el else "") or "", self.source),
                    "url": item_url,
                    "desc": self._normalize_space(author_el.get_text(" ", strip=True) if author_el else ""),
                }
            )

        next_btn = soup.select_one(".nav.paginate li.active + li")
        next_page = page_val + 1 if next_btn else None
        return results, next_page

    def _request_html(self, url: str, ctx: ND5Context, referer: str = "") -> BeautifulSoup:
        headers = {
            "User-Agent": self._UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,zh-CN;q=0.8,zh;q=0.7,en-US;q=0.6,en;q=0.5",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        }
        if referer:
            headers["Referer"] = referer

        ctx.sleep_between_requests()
        resp = ctx.request_with_retry(url, headers=headers, allow_redirects=True)

        if self._is_cloudflare_challenge(resp):
            raise RuntimeError(
                "Czbooks bị Cloudflare challenge. Hãy mở czbooks.net trên trình duyệt rồi thử lại (cần cookie cf_clearance)."
            )

        resp.raise_for_status()
        return BeautifulSoup(resp.text or "", "html.parser")

    def _is_cloudflare_challenge(self, resp) -> bool:
        try:
            if str(resp.headers.get("cf-mitigated", "")).lower() == "challenge":
                return True
            body = (resp.text or "")[:2000].lower()
            if "just a moment" in body and "cloudflare" in body:
                return True
            if "attention required" in body and "cloudflare" in body:
                return True
            if int(getattr(resp, "status_code", 0) or 0) == 403 and "cloudflare" in body:
                return True
        except Exception:
            return False
        return False

    def _normalize_book_url(self, url: str) -> str:
        m = re.search(r"https?://(?:www\.)?czbooks\.net/n/([^/?#]+)", url or "", flags=re.I)
        if not m:
            return ""
        return f"https://czbooks.net/n/{m.group(1)}"

    def _extract_book_id(self, url: str) -> str:
        m = re.search(r"/n/([^/?#]+)", url or "")
        return m.group(1) if m else ""

    def _parse_toc(self, soup: BeautifulSoup, book_url: str) -> List[Dict[str, Any]]:
        toc: List[Dict[str, Any]] = []
        links = soup.select("#chapter-list li > a")
        if not links:
            links = soup.select("#chapter-list a")
        for idx, link in enumerate(links, start=1):
            href = (link.get("href") or "").strip()
            if not href:
                continue
            chap_url = self._normalize_url(href, book_url)
            if not chap_url:
                continue
            title = self._normalize_space(link.get_text(" ", strip=True)) or f"Chương {idx}"
            toc.append({
                "num": idx,
                "id": chap_url,
                "title": title,
            })
        return toc

    def _extract_chapter_html(self, soup: BeautifulSoup) -> str:
        node = soup.select_one(".content") or soup.select_one("#content")
        if not node:
            return ""
        for bad in node.select("script, style, iframe, ins"):
            bad.decompose()
        for cmt in node.find_all(string=lambda t: isinstance(t, Comment)):
            cmt.extract()
        raw_html = "".join(str(child) for child in node.contents)
        return self._clean_html(raw_html)

    def _clean_html(self, html: str) -> str:
        if not html:
            return ""
        text = html.replace("\r\n", "\n").replace("\r", "\n")
        text = text.replace("\n", "<br>")
        text = re.sub(r"(<br\s*/?>\s*){2,}", "<br>", text, flags=re.I)
        text = re.sub(r"<!--[\s\S]*?-->", "", text)
        text = text.replace("&nbsp;", "")
        text = re.sub(r"^(?:\s*<br>\s*)+", "", text, flags=re.I)
        text = re.sub(r"(?:\s*<br>\s*)+$", "", text, flags=re.I)
        return text.strip()

    def _chapter_url_from_id(self, cid: str, book_url: str) -> str:
        c = (cid or "").strip()
        if not c:
            return ""
        if c.startswith("http://") or c.startswith("https://"):
            return c
        return self._normalize_url(c, book_url or self.source)

    def _normalize_url(self, url: str, base: str) -> str:
        u = (url or "").strip()
        if not u:
            return ""
        if u.startswith("//"):
            return "https:" + u
        if u.startswith("http://") or u.startswith("https://"):
            return u
        return urljoin(base, u)

    def _parse_status(self, state_rows) -> Tuple[Optional[str], Optional[bool]]:
        for row in state_rows or []:
            txt = self._normalize_space(row.get_text(" ", strip=True))
            if any(k in txt for k in ("连载", "連載", "更新中")):
                return "Đang ra", True
            if any(k in txt for k in ("完结", "完結", "已完结")):
                return "Hoàn thành", False
        return None, None

    def _query_text(self, soup: BeautifulSoup, selectors: List[str]) -> str:
        for sel in selectors:
            el = soup.select_one(sel)
            if el:
                val = el.get_text(" ", strip=True)
                if val:
                    return val
        return ""

    def _query_attr(self, soup: BeautifulSoup, selectors: List[str], attr: str) -> str:
        for sel in selectors:
            el = soup.select_one(sel)
            if not el:
                continue
            val = el.get(attr)
            if val:
                return str(val).strip()
        return ""

    def _query_html(self, soup: BeautifulSoup, selectors: List[str]) -> str:
        for sel in selectors:
            el = soup.select_one(sel)
            if el:
                if el.name == "meta":
                    content = el.get("content")
                    return str(content or "")
                return str(el)
        return ""

    def _html_to_text(self, html_text: str) -> str:
        if not html_text:
            return ""
        try:
            soup = BeautifulSoup(html_text, "html.parser")
            text = soup.get_text("\n", strip=True)
        except Exception:
            text = str(html_text)
        return self._normalize_newlines(text)

    def _normalize_space(self, text: str) -> str:
        return re.sub(r"\s+", " ", str(text or "")).strip()

    def _normalize_newlines(self, text: str) -> str:
        return re.sub(r"\n{3,}", "\n\n", str(text or "").replace("\r\n", "\n").replace("\r", "\n")).strip()


def get_plugin():
    return CzbooksPlugin()
