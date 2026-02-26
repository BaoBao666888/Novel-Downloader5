from __future__ import annotations

import datetime
import json
import re
from typing import Any, Dict, List
from urllib.parse import quote_plus

from bs4 import BeautifulSoup

from app.nd5.plugin_api import ND5Context


class FanqieBridgePlugin:
    id = "fanqie"
    name = "Fanqie (bridge)"
    batch_size = 20
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

    def _bridge_base_url(self, ctx: ND5Context) -> str:
        base = str(ctx.get_extra("fanqie_bridge_base", "") or "").strip()
        if base:
            return base.rstrip("/")
        port_raw = ctx.get_extra("fanqie_bridge_port", 9999)
        try:
            port = int(port_raw)
        except Exception:
            port = 9999
        if port < 1 or port > 65535:
            port = 9999
        return f"http://127.0.0.1:{port}"

    def _build_meta_from_raw(self, book_id: str, raw: Dict[str, Any], payload: Any = None) -> Dict[str, Any]:
        author = raw.get("author") or raw.get("author_name") or ""
        score = raw.get("score") or raw.get("book_score")
        serial_count = raw.get("serial_count") or raw.get("chapter_count") or raw.get("chapter_total")
        word_number = raw.get("word_number") or raw.get("word_count") or raw.get("wordNumber")
        read_count = raw.get("read_count") or raw.get("reading_count")
        last_publish_time = raw.get("last_publish_time") or raw.get("last_chapter_update_time") or raw.get("update_time")
        last_publish_str = self._format_publish_time(last_publish_time)
        last_chapter_title = raw.get("last_chapter_title") or raw.get("latest_chapter_title") or ""

        detail_lines = []
        if author:
            detail_lines.append(f"Tác giả: {author}")
        if score is not None:
            detail_lines.append(f"Đánh giá: {score} điểm")
        if serial_count:
            detail_lines.append(f"Số chương: {serial_count}")
        if word_number:
            detail_lines.append(f"Số chữ: {word_number}")
        if read_count:
            detail_lines.append(f"Lượt xem: {read_count}")
        if last_publish_str:
            detail_lines.append(f"Cập nhật: {last_publish_str}")
        if last_chapter_title:
            detail_lines.append(f"Chương mới nhất: {last_chapter_title}")
        detail = "\n".join(detail_lines).strip()

        creation_status = raw.get("creation_status")
        if creation_status is None:
            creation_status = raw.get("book_status")
        ongoing = None
        if creation_status is not None:
            try:
                status_raw = str(creation_status).strip().lower()
                if status_raw in {"1", "true", "ongoing", "serial", "连载"}:
                    ongoing = True
                elif status_raw in {"0", "2", "false", "end", "finished", "完结"}:
                    ongoing = False
            except Exception:
                ongoing = None
        status = None
        if isinstance(ongoing, bool):
            status = "Đang ra" if ongoing else "Hoàn thành"
        return {
            "book_id": book_id,
            "title": raw.get("book_name") or raw.get("title") or f"Fanqie_{book_id}",
            "author": author,
            "intro": raw.get("abstract") or raw.get("description") or raw.get("book_abstract") or "",
            "cover": raw.get("thumb_url") or raw.get("cover") or raw.get("cover_url") or "",
            "detail": detail,
            "status": status,
            "ongoing": ongoing,
            "raw": raw or payload or {},
        }

    def _fetch_book_metadata_from_bridge(self, book_id: str, ctx: ND5Context):
        base = self._bridge_base_url(ctx)
        url = f"{base}/detail?book_id={book_id}"
        resp = ctx.request_with_retry(url, headers={"Accept": "application/json"}, proxies=None)
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, dict):
            raise ValueError("Bridge detail trả dữ liệu không hợp lệ")
        raw = data.get("data")
        if not isinstance(raw, dict):
            raw = data.get("detail")
        if not isinstance(raw, dict):
            raise ValueError("Bridge detail rỗng")
        return self._build_meta_from_raw(book_id, raw, payload=data)

    def _normalize_cover_url(self, url: str) -> str:
        text = str(url or "").strip()
        if not text:
            return ""
        if text.startswith("//"):
            text = "https:" + text
        return text

    def _extract_initial_state_page(self, html_text: str):
        marker = "window.__INITIAL_STATE__="
        raw = str(html_text or "")
        start = raw.find(marker)
        if start < 0:
            return None
        i = start + len(marker)
        n = len(raw)
        while i < n and raw[i].isspace():
            i += 1
        if i >= n or raw[i] != "{":
            return None
        depth = 0
        in_string = False
        escaped = False
        for j in range(i, n):
            ch = raw[j]
            if in_string:
                if escaped:
                    escaped = False
                elif ch == "\\":
                    escaped = True
                elif ch == '"':
                    in_string = False
                continue
            if ch == '"':
                in_string = True
                continue
            if ch == "{":
                depth += 1
                continue
            if ch == "}":
                depth -= 1
                if depth == 0:
                    try:
                        obj = json.loads(raw[i : j + 1])
                    except Exception:
                        return None
                    if isinstance(obj, dict):
                        page = obj.get("page")
                        if isinstance(page, dict):
                            return page
                    return None
        return None

    def _fetch_book_metadata_from_web(self, book_id: str, ctx: ND5Context):
        page_url = f"https://fanqienovel.com/page/{book_id}"
        resp = ctx.request_with_retry(page_url, headers=self._headers())
        resp.raise_for_status()
        html_text = resp.text
        state_page = self._extract_initial_state_page(html_text)
        raw = dict(state_page) if isinstance(state_page, dict) else {}
        soup = BeautifulSoup(html_text, "html.parser")

        title = ""
        for sel in (".page-header-info .info-name h1", ".info-name h1", ".page-header-info h1", "h1"):
            node = soup.select_one(sel)
            if node:
                title = node.get_text(" ", strip=True)
                if title:
                    break
        author = ""
        for sel in (".author-name-text", ".author-name", ".page-header-author"):
            node = soup.select_one(sel)
            if node:
                author = node.get_text(" ", strip=True)
                if author:
                    break
        intro = ""
        intro_nodes = soup.select(".page-abstract-content p")
        if intro_nodes:
            intro = "\n".join(n.get_text(" ", strip=True) for n in intro_nodes if n.get_text(" ", strip=True))
        if not intro:
            for sel in (".page-abstract-content", ".page-abstract .content", ".description-content"):
                node = soup.select_one(sel)
                if node:
                    intro = node.get_text("\n", strip=True)
                    if intro:
                        break
        if not intro:
            meta_desc = soup.find("meta", attrs={"name": "description"})
            if meta_desc and meta_desc.get("content"):
                intro = str(meta_desc.get("content")).strip()
        cover = ""
        cover_node = soup.select_one(".book-cover-img") or soup.select_one(".book-cover img")
        if cover_node:
            cover = self._normalize_cover_url(cover_node.get("src") or cover_node.get("data-src") or "")
        label_text = ""
        label_node = soup.select_one(".page-header-info .info-label-yellow") or soup.select_one(".info-label")
        if label_node:
            label_text = label_node.get_text(" ", strip=True)
        chapter_total = ""
        directory_header = soup.select_one(".page-directory-header h3")
        if directory_header:
            m = re.search(r"(\d+)", directory_header.get_text(" ", strip=True))
            if m:
                chapter_total = m.group(1)
        word_number = ""
        word_node = soup.select_one(".info-count-word .detail")
        if word_node:
            word_number = word_node.get_text(" ", strip=True)
        last_chapter_title = ""
        last_title_node = soup.select_one(".info-last-title")
        if last_title_node:
            last_chapter_title = re.sub(
                r"^最近更新[:：]?\s*",
                "",
                last_title_node.get_text(" ", strip=True),
            )
        creation_status = None
        if "完结" in label_text:
            creation_status = "2"
        elif "连载" in label_text:
            creation_status = "1"

        if title and not (raw.get("book_name") or raw.get("title")):
            raw["book_name"] = title
        if author and not (raw.get("author") or raw.get("author_name")):
            raw["author"] = author
        if intro and not (raw.get("abstract") or raw.get("description") or raw.get("book_abstract")):
            raw["abstract"] = intro
        if cover and not (raw.get("thumb_url") or raw.get("cover") or raw.get("cover_url") or raw.get("detail_page_thumb_url")):
            raw["thumb_url"] = cover
        if chapter_total and not (raw.get("serial_count") or raw.get("chapter_count") or raw.get("chapter_total")):
            raw["chapter_total"] = chapter_total
        if word_number and not (raw.get("word_number") or raw.get("word_count") or raw.get("wordNumber")):
            raw["word_number"] = word_number
        if last_chapter_title and not (raw.get("last_chapter_title") or raw.get("latest_chapter_title")):
            raw["last_chapter_title"] = last_chapter_title
        if creation_status is not None and raw.get("creation_status") is None and raw.get("book_status") is None:
            raw["creation_status"] = creation_status
        if not (raw.get("book_name") or raw.get("title")):
            raw["book_name"] = f"Fanqie_{book_id}"

        payload_source = "web_state" if isinstance(state_page, dict) else "web_dom"
        meta = self._build_meta_from_raw(book_id, raw, payload={"source": payload_source})
        if label_text:
            extra = meta.get("detail") or ""
            if extra:
                extra += "\n"
            meta["detail"] = f"{extra}Nhãn: {label_text}".strip()
        return meta

    def _format_publish_time(self, raw_val):
        if raw_val is None or raw_val == "":
            return ""
        try:
            ts = int(float(raw_val))
            if ts > 10**12:
                ts = ts // 1000
            return datetime.datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M")
        except Exception:
            return str(raw_val)

    def fetch_book_and_toc(self, url: str, ctx: ND5Context) -> tuple[Dict[str, Any], List[Dict[str, Any]]]:
        book_id = self._extract_book_id(url)
        if not book_id:
            raise ValueError("Không tìm thấy book_id trong URL.")
        meta = self._fetch_book_metadata(book_id, ctx)
        toc = self._fetch_toc(book_id, ctx)
        return meta, toc

    def _fetch_book_metadata(self, book_id: str, ctx: ND5Context) -> Dict[str, Any]:
        try:
            return self._fetch_book_metadata_from_bridge(book_id, ctx)
        except Exception as exc:
            try:
                ctx.log(f"Bridge detail lỗi ({book_id}), fallback web: {exc}")
            except Exception:
                pass
        try:
            return self._fetch_book_metadata_from_web(book_id, ctx)
        except Exception as exc:
            try:
                ctx.log(f"Web detail lỗi ({book_id}): {exc}")
            except Exception:
                pass
        raise RuntimeError("Không lấy được metadata từ bridge và fallback web")

    def _fetch_toc(self, book_id: str, ctx: ND5Context) -> List[Dict[str, Any]]:
        url = f"https://fanqienovel.com/page/{book_id}"
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
            url = f"{self._bridge_base_url(ctx)}/content?item_id={','.join(ids)}"
            if fmt == "epub":
                url += "&format=epub"
            ctx.sleep_between_requests()
            resp = ctx.request_with_retry(url, proxies=None)
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
