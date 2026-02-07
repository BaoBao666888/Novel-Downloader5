from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional, Tuple

from bs4 import BeautifulSoup

from app.nd5.plugin_api import ND5Context


class IhuabenPlugin:
    id = "ihuaben"
    name = "Ihuaben"
    version = 1
    batch_size = 1
    author = "BaoBao"
    source = "https://www.ihuaben.com/"
    description = "Tải truyện từ Ihuaben"
    type = "chinese_novel"
    locale = "zh_CN"
    domains = ["ihuaben.com"]
    sample_url = "https://www.ihuaben.com/book/1343385.html"
    icon = "icon.png"
    requires_bridge = False

    _MOBILE_UA = (
        "Mozilla/5.0 (Linux; Android 10; Mobile; rv:109.0) "
        "Gecko/20100101 Firefox/110.0"
    )
    _API_TOC = "https://www.ihuaben.com/book/chapters/{book_id}"
    _API_CHAPTER = "https://www.ihuaben.com/book/app/chapter?bookId={book_id}&chapterId={chapter_id}"
    _IMG_RE = re.compile(r"\[img:([^\]]+)\]")

    def supports_url(self, url: str) -> bool:
        return bool(url and "ihuaben.com" in url and "/book/" in url)

    def fetch_book_and_toc(self, url: str, ctx: ND5Context) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        book_id = self._extract_book_id(url)
        if not book_id:
            raise ValueError("Invalid Ihuaben url. Expected https://www.ihuaben.com/book/<ID>.html")

        book_url = f"https://www.ihuaben.com/book/{book_id}.html"
        ctx.sleep_between_requests()
        resp = ctx.request_with_retry(book_url, headers=self._build_headers(book_id))
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text or "", "html.parser")

        title = (
            self._query_attr(soup, [
                'meta[property="og:novel:book_name"]',
                'meta[property="og:title"]',
            ], "content")
            or self._query_text(soup, [
                ".infodetail .simpleinfo h1.text-danger",
                ".infodetail .simpleinfo h1",
                "h1.text-danger",
                "h1",
            ])
        )
        author = (
            self._query_attr(soup, ['meta[property="og:novel:author"]'], "content")
            or self._query_text(soup, [
                ".infodetail .simpleinfo a.text-muted",
                ".infodetail .simpleinfo a",
                ".simpleinfo a.text-muted",
            ])
        )
        cover = self._query_attr(soup, [
            '.biginfo .cover img',
            '.cover img',
            'meta[property="og:image"]',
        ], "src")
        if not cover:
            cover = self._query_attr(soup, [
                'meta[property="og:image"]',
                'meta[property="og:img"]',
            ], "content")
        cover = self._normalize_cover_url(cover)

        intro = self._query_html(soup, [
            ".infodetail .aboutbook",
            ".infodetail .text-muted.aboutbook",
            ".aboutbook",
        ])
        if intro:
            intro = self._html_to_text(intro)
        if not intro:
            intro = self._query_attr(soup, [
                'meta[property="og:description"]',
                'meta[name="description"]',
                'meta[name="Description"]',
            ], "content")
            intro = self._html_to_text(intro or "")
        intro = re.sub(r"^\s*简介[:：]\s*", "", intro or "").strip()

        status_hint = (
            self._query_attr(soup, ['meta[property="og:novel:status"]'], "content")
            or self._query_text(soup, [
                ".simpleinfo label",
                ".infodetail .simpleinfo label",
            ])
        )
        status, ongoing = self._parse_status(status_hint)

        meta = {
            "book_id": book_id,
            "title": title or f"Ihuaben_{book_id}",
            "author": author or "",
            "intro": intro or "",
            "cover": cover or "",
            "status": status,
            "ongoing": ongoing,
        }

        toc = self._fetch_toc(book_id, ctx)
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
            content, title = self._fetch_chapter(book_id, str(cid), ctx)
            if content is None:
                continue
            final_title = (
                title
                or fallback_titles.get(cid)
                or fallback_titles.get(str(cid))
                or f"Chuong {cid}"
            )
            results[str(cid)] = {"title": final_title, "content": content}
        return results

    def content_to_text(self, content: str) -> str:
        if content is None:
            return ""
        text = self._replace_img_tokens(str(content))
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

    def _fetch_toc(self, book_id: str, ctx: ND5Context) -> List[Dict[str, Any]]:
        api_url = self._API_TOC.format(book_id=book_id)
        headers = {
            "User-Agent": self._MOBILE_UA,
            "Accept": "application/json,text/javascript,*/*;q=0.01",
            "Referer": f"https://www.ihuaben.com/book/{book_id}.html",
        }
        ctx.sleep_between_requests()
        resp = ctx.request_with_retry(api_url, headers=headers)
        resp.raise_for_status()
        payload = self._parse_json_or_jsonp(resp.text or "")
        if not isinstance(payload, dict) or payload.get("code") != 0:
            raise ValueError("Ihuaben API returned invalid payload")
        chapters = payload.get("chapters") or []
        if not isinstance(chapters, list) or not chapters:
            raise ValueError("Ihuaben API returned empty chapter list")
        toc: List[Dict[str, Any]] = []
        for idx, chap in enumerate(chapters, start=1):
            if not isinstance(chap, dict):
                continue
            chapter_id = chap.get("chapterId") or chap.get("id") or chap.get("chapter_id")
            if chapter_id is None:
                continue
            title = (chap.get("title") or "").strip() or f"Chuong {idx}"
            toc.append({"num": idx, "id": str(chapter_id), "title": title})
        return toc

    def _fetch_chapter(self, book_id: str, chapter_id: str, ctx: ND5Context) -> Tuple[Optional[str], str]:
        api_url = self._API_CHAPTER.format(book_id=book_id, chapter_id=chapter_id)
        headers = {
            "User-Agent": self._MOBILE_UA,
            "Accept": "application/json,text/javascript,*/*;q=0.01",
            "Referer": f"https://www.ihuaben.com/book/{book_id}.html",
        }
        ctx.sleep_between_requests()
        resp = ctx.request_with_retry(api_url, headers=headers)
        resp.raise_for_status()
        payload = self._parse_json_or_jsonp(resp.text or "")
        if not isinstance(payload, dict):
            return None, ""
        chapter = payload.get("chapter") if isinstance(payload, dict) else None
        if not isinstance(chapter, dict):
            return None, ""
        title = (chapter.get("title") or "").strip()
        content = chapter.get("content")
        if not content:
            marks = chapter.get("marks")
            if isinstance(marks, dict):
                content = marks.get("content") or marks.get("contentText") or marks.get("content_text")
        if content is None:
            return None, title
        if isinstance(content, list):
            content = "\n".join(str(item) for item in content if item is not None)
        else:
            content = str(content)
        content = self._format_dialogue_content(content)
        return content, title

    def _format_dialogue_content(self, content: str) -> str:
        if not content:
            return ""
        normalized = self._replace_img_tokens(str(content))
        lines = re.split(r"\r?\n+", normalized)
        processed: List[str] = []
        for line in lines:
            raw = line.strip()
            if not raw or raw == ".":
                continue
            if raw.startswith("##"):
                rest = raw[2:].strip()
                if not rest:
                    continue
                parts = rest.split(None, 1)
                if len(parts) == 2:
                    processed.append(f"{parts[0]}：“{parts[1]}”")
                else:
                    processed.append(rest)
                continue
            if raw.startswith("#"):
                rest = raw[1:].strip()
                if not rest:
                    continue
                parts = rest.split(None, 1)
                if len(parts) == 2:
                    processed.append(f"{parts[0]}：“{parts[1]}”")
                else:
                    processed.append(rest)
                continue
            processed.append(raw)
        return "\n\n".join(processed).strip()

    def _parse_status(self, raw: str | None) -> Tuple[Optional[str], Optional[bool]]:
        if not raw:
            return None, None
        text = raw.strip()
        if not text:
            return None, None
        if any(k in text for k in ("连载", "連載", "更新")):
            return "Đang ra", True
        if any(k in text for k in ("完结", "完結", "已完结")):
            return "Hoàn thành", False
        return text, None

    def _extract_book_id(self, url: str) -> Optional[str]:
        m = re.search(r"/book/(\d+)", url or "")
        return m.group(1) if m else None

    def _build_headers(self, book_id: str) -> Dict[str, str]:
        return {
            "User-Agent": self._MOBILE_UA,
            "Referer": f"https://www.ihuaben.com/book/{book_id}.html",
        }

    def _parse_json_or_jsonp(self, text: str) -> Any:
        raw = (text or "").strip()
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass
        m = re.search(r"\(([\s\S]*)\)\s*$", raw)
        if m:
            return json.loads(m.group(1))
        raise ValueError("Invalid JSON/JSONP payload")

    def _normalize_cover_url(self, url: str | None) -> str:
        if not url:
            return ""
        u = str(url).strip()
        if not u:
            return ""
        u = u.split("?")[0].split("@")[0]
        if u.startswith("//"):
            return "https:" + u
        if u.startswith("http://"):
            return "https://" + u[len("http://"):]
        if u.startswith("https://"):
            return u
        return "https://piccn.ihuaben.com/" + u.lstrip("/")

    def _replace_img_tokens(self, text: str) -> str:
        if not text:
            return text

        def repl(match: re.Match) -> str:
            path = match.group(1).strip()
            url = self._normalize_img_url(path)
            return f"[img:{url}]" if url else ""

        return self._IMG_RE.sub(repl, text)

    def _normalize_img_url(self, path: str) -> str:
        if not path:
            return ""
        if path.startswith("//"):
            return "https:" + path
        if path.startswith("http://"):
            return "https://" + path[len("http://"):]
        if path.startswith("https://"):
            return path
        return "https://piccn.ihuaben.com/" + path.lstrip("/")

    def _normalize_newlines(self, text: str) -> str:
        return re.sub(r"\n{2,}", "\n", str(text or "").replace("\r\n", "\n").replace("\r", "\n"))

    def _query_text(self, soup: BeautifulSoup, selectors: List[str]) -> str:
        for sel in selectors:
            el = soup.select_one(sel)
            if el:
                text = el.get_text(strip=True)
                if text:
                    return text
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
                return str(el)
        return ""

    def _html_to_text(self, html: str) -> str:
        if not html:
            return ""
        try:
            soup = BeautifulSoup(html, "html.parser")
            return soup.get_text("\n", strip=True)
        except Exception:
            return str(html)


def get_plugin():
    return IhuabenPlugin()
