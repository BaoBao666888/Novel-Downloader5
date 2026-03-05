from __future__ import annotations

import json
import os
import re
import glob
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote_plus, urljoin, urlparse

from bs4 import BeautifulSoup, Comment

from app.nd5.plugin_api import ND5Context


class CzbooksPlugin:
    id = "czbooks"
    name = "czbooks.net"
    version = 1
    batch_size = 1
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
    _BLOCK_MARKERS = (
        "just a moment",
        "attention required",
        "verify you are human",
        "cf-browser-verification",
        "__cf_chl",
        "captcha",
    )
    _bridge_state_cache: Dict[str, Any] = {}
    _bridge_state_mtime: Optional[float] = None

    def __init__(self):
        self._prefer_jina = False

    def supports_url(self, url: str) -> bool:
        return bool(re.search(r"https?://(?:www\.)?czbooks\.net/n/[^/?#]+", url or "", flags=re.I))

    def fetch_book_and_toc(self, url: str, ctx: ND5Context) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        book_url = self._normalize_book_url(url)
        if not book_url:
            raise ValueError("URL czbooks không hợp lệ. Ví dụ: https://czbooks.net/n/cpgm686")

        try:
            soup = self._request_html(book_url, ctx, referer=self.source)
        except Exception as exc:
            self._prefer_jina = True
            ctx.log(f"Lấy trực tiếp thất bại, thử fallback JinaAI: {exc}")
            return self._fetch_book_and_toc_via_jina(book_url, ctx)

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
            self._prefer_jina = True
            ctx.log("Không tìm thấy mục lục từ HTML trực tiếp, thử fallback JinaAI.")
            return self._fetch_book_and_toc_via_jina(book_url, ctx)
        self._prefer_jina = False

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

            if self._prefer_jina:
                jina_title, jina_content = self._fetch_chapter_via_jina(chapter_url, ctx)
                title = jina_title or fallback_titles.get(cid_str) or fallback_titles.get(cid) or f"Chương {cid_str}"
                if not jina_content:
                    ctx.log(f"Không lấy được nội dung chương {cid_str} ({chapter_url})")
                    continue
                results[cid_str] = {"title": title, "content": jina_content}
                continue

            try:
                soup = self._request_html(chapter_url, ctx, referer=book_url or self.source)
                title = (
                    self._normalize_space(self._query_text(soup, [".content-title", "h1", "title"]))
                    or fallback_titles.get(cid_str)
                    or fallback_titles.get(cid)
                    or f"Chương {cid_str}"
                )
                content = self._extract_chapter_html(soup)
                if not content:
                    raise RuntimeError("Nội dung chương rỗng từ HTML.")
            except Exception as exc:
                self._prefer_jina = True
                ctx.log(f"Tải HTML chương {cid_str} lỗi, thử fallback JinaAI: {exc}")
                jina_title, jina_content = self._fetch_chapter_via_jina(chapter_url, ctx)
                title = jina_title or fallback_titles.get(cid_str) or fallback_titles.get(cid) or f"Chương {cid_str}"
                content = jina_content
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
        try:
            soup = self._request_html(url, ctx, referer=self.source)
        except Exception:
            # search fallback từ jina khó chính xác, nên trả rỗng khi bị chặn
            return [], None

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

    def _fetch_book_and_toc_via_jina(self, book_url: str, ctx: ND5Context) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        raw = self._fetch_jina_text(book_url, ctx)
        md = self._extract_jina_markdown(raw)
        book_id = self._extract_book_id(book_url)
        title = ""
        m_title = re.search(r"《([^》]+)》", md)
        if m_title:
            title = self._normalize_space(m_title.group(1))
        author = ""
        m_author = re.search(r"作者:\s*\[([^\]]+)\]", md)
        if m_author:
            author = self._normalize_space(m_author.group(1))
        status = None
        ongoing = None
        m_status = re.search(r"連載狀態\s*([^\n\r]+)", md)
        if m_status:
            status_raw = self._normalize_space(m_status.group(1))
            if "已完結" in status_raw or "完結" in status_raw:
                status = "Hoàn thành"
                ongoing = False
            elif "連載" in status_raw or "更新" in status_raw:
                status = "Đang ra"
                ongoing = True
            else:
                status = status_raw
        intro = ""
        m_intro = re.search(r"作品簡介：\s*([\s\S]*?)(?:\n\*|\n\[加入收藏|\n其他作品：)", md)
        if m_intro:
            intro = self._normalize_newlines(self._normalize_space_blocks(m_intro.group(1)))
        detail_lines = []
        if author:
            detail_lines.append(f"Tác giả: {author}")
        m_update = re.search(r"更新時間\s*([^\n\r]+)", md)
        if m_update:
            detail_lines.append("更新時間 " + self._normalize_space(m_update.group(1)))
        toc = self._parse_jina_toc(md, book_id)
        if not toc:
            raise ValueError("Fallback JinaAI không đọc được mục lục.")
        meta = {
            "book_id": book_id or book_url,
            "title": title or (book_id or "czbooks"),
            "author": author,
            "intro": intro,
            "cover": "",
            "detail": "\n".join(detail_lines).strip(),
            "status": status,
            "ongoing": ongoing,
            "book_url": book_url,
        }
        return meta, toc

    def _fetch_chapter_via_jina(self, chapter_url: str, ctx: ND5Context) -> Tuple[str, str]:
        raw = self._fetch_jina_text(chapter_url, ctx)
        md = self._extract_jina_markdown(raw)
        title = ""
        m_title = re.search(r"^Title:\s*(.+)$", raw, flags=re.M)
        if m_title:
            title_raw = self._normalize_space(m_title.group(1))
            m_ch = re.search(r"】([^|]+)", title_raw)
            if m_ch:
                title = self._normalize_space(m_ch.group(1))
            else:
                title = title_raw
        content = self._normalize_newlines(md)
        content = self._strip_jina_noise(content)
        return title, content

    def _fetch_jina_text(self, source_url: str, ctx: ND5Context) -> str:
        jina_url = "https://r.jina.ai/http://" + source_url.replace("https://", "").replace("http://", "")
        headers = {
            "User-Agent": self._UA,
            "Accept": "text/plain,text/markdown,*/*",
        }
        ctx.sleep_between_requests()
        resp = ctx.request_with_retry(jina_url, headers=headers, allow_redirects=True)
        resp.raise_for_status()
        return resp.text or ""

    def _extract_jina_markdown(self, raw: str) -> str:
        text = str(raw or "")
        marker = "Markdown Content:"
        idx = text.find(marker)
        if idx >= 0:
            return text[idx + len(marker):].strip()
        return text.strip()

    def _parse_jina_toc(self, md: str, book_id: str) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        if not book_id:
            return out
        seen = set()
        pattern = re.compile(
            r"\[([^\]]+)\]\((https?://czbooks\.net/n/" + re.escape(book_id) + r"/[^)\s]+)\)",
            flags=re.I,
        )
        for title_raw, link in pattern.findall(md):
            title = self._normalize_space(title_raw)
            chapter_url = self._normalize_url(link, "https://czbooks.net/")
            if not chapter_url:
                continue
            key = chapter_url.split("#", 1)[0]
            if key in seen:
                continue
            seen.add(key)
            out.append(
                {
                    "num": len(out) + 1,
                    "id": chapter_url,
                    "title": title or f"Chương {len(out) + 1}",
                }
            )
        return out

    def _normalize_space_blocks(self, text: str) -> str:
        lines = [self._normalize_space(line) for line in str(text or "").splitlines()]
        lines = [line for line in lines if line]
        return "\n".join(lines)

    def _strip_jina_noise(self, text: str) -> str:
        s = str(text or "").strip()
        # một số trang có ký tự quảng cáo/chân trang ở cuối
        s = re.sub(r"\n?m4xs\.com\s*$", "", s, flags=re.I)
        s = re.sub(r"\n?小說狂人.*$", "", s, flags=re.I)
        return self._normalize_newlines(s)

    def _request_html(self, url: str, ctx: ND5Context, referer: str = "") -> BeautifulSoup:
        headers = {
            "User-Agent": self._UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,zh-CN;q=0.8,zh;q=0.7,en-US;q=0.6,en;q=0.5",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
        }
        parsed_ref = None
        if referer:
            parsed_ref = urlparse(referer)
            headers["Referer"] = referer
            if parsed_ref.scheme and parsed_ref.netloc:
                headers["Origin"] = f"{parsed_ref.scheme}://{parsed_ref.netloc}"

        bridge = self._bridge_headers_for_url(url)
        if bridge.get("headers"):
            headers.update(bridge["headers"])
        if bridge.get("user_agent"):
            headers["User-Agent"] = str(bridge["user_agent"])
        bridge_cookie_header = str(bridge.get("cookie_header") or "").strip()
        ctx_cookie_header = self._cookie_header_from_ctx_jar(ctx.get_cookies(), url)
        merged_cookie_header = self._merge_cookie_headers(bridge_cookie_header, ctx_cookie_header)
        # fallback: quét thêm tất cả profile Qt trong project để tránh lệch profile đang chọn
        if not self._has_cloudflare_cookie(merged_cookie_header):
            host = self._normalize_host(urlparse(url).hostname or "")
            all_profiles_cookie = self._cookie_header_from_all_profile_dbs(host)
            merged_cookie_header = self._merge_cookie_headers(merged_cookie_header, all_profiles_cookie)
        if merged_cookie_header:
            headers["Cookie"] = merged_cookie_header
        # Luôn ưu tiên referer/origin của request hiện tại.
        if referer:
            headers["Referer"] = referer
            if parsed_ref and parsed_ref.scheme and parsed_ref.netloc:
                headers["Origin"] = f"{parsed_ref.scheme}://{parsed_ref.netloc}"

        resp, soup = self._fetch_once(url, headers, ctx)
        if self._is_blocked_page(resp, soup):
            retry_headers = dict(headers)
            retry_headers.update(self._browser_like_headers(url, referer))
            resp2, soup2 = self._fetch_once(url, retry_headers, ctx)
            if not self._is_blocked_page(resp2, soup2):
                if int(getattr(resp2, "status_code", 0) or 0) >= 400 and not self._page_has_expected_content(soup2):
                    resp2.raise_for_status()
                return soup2
            try:
                page_title = soup2.title.get_text(" ", strip=True) if soup2 and soup2.title else ""
                ctx.log(
                    f"Chi tiết chặn: status={getattr(resp2, 'status_code', '')}, title={page_title!r}, url={url}"
                )
                cookie_names = self._cookie_names_from_header(merged_cookie_header)
                important = [
                    name for name in cookie_names
                    if (name.lower() in {"cf_clearance", "__cf_bm", "blackcat_sessid"})
                    or name.lower().startswith("cf_")
                    or name.lower().startswith("__cf")
                ]
                ctx.log(
                    f"Cookie debug: total={len(cookie_names)}, important={important}, bridge={bool(bridge_cookie_header)}, ctx={bool(ctx_cookie_header)}"
                )
            except Exception:
                pass
            raise RuntimeError(self._build_block_message(url, bridge_used=bool(bridge.get("headers") or merged_cookie_header)))

        if int(getattr(resp, "status_code", 0) or 0) >= 400 and not self._page_has_expected_content(soup):
            resp.raise_for_status()
        return soup

    def _fetch_once(self, url: str, headers: Dict[str, str], ctx: ND5Context):
        ctx.sleep_between_requests()
        resp = ctx.request_with_retry(url, headers=headers, allow_redirects=True)
        soup = BeautifulSoup(resp.text or "", "html.parser")
        return resp, soup

    def _build_block_message(self, url: str, bridge_used: bool = False) -> str:
        base = "Czbooks đang chặn request."
        if bridge_used:
            return base + " Đã thử lại với header/cookie từ trình duyệt nhưng vẫn bị chặn."
        return base + " Chưa lấy được header/cookie host này từ Trình duyệt Qt."

    def _is_blocked_page(self, resp, soup: BeautifulSoup) -> bool:
        try:
            status_code = int(getattr(resp, "status_code", 0) or 0)
            body = (resp.text or "")[:2000].lower()
            if str(resp.headers.get("cf-mitigated", "")).lower() == "challenge":
                return True
            has_expected = self._page_has_expected_content(soup)
            if has_expected:
                return False
            title = ""
            if soup.title:
                title = (soup.title.get_text(" ", strip=True) or "").lower()
            markers_hit = any(m in body for m in self._BLOCK_MARKERS) or any(m in title for m in self._BLOCK_MARKERS)
            if markers_hit:
                return True
            if status_code in (403, 429, 503):
                return True
        except Exception:
            return False
        return False

    def _page_has_expected_content(self, soup: BeautifulSoup) -> bool:
        return bool(
            soup.select_one(".novel-detail .title")
            or soup.select_one("#chapter-list")
            or soup.select_one(".content")
        )

    def _browser_like_headers(self, url: str, referer: str) -> Dict[str, str]:
        parsed = urlparse(url)
        host = parsed.netloc
        same_site = "same-origin"
        if referer:
            ref_host = urlparse(referer).netloc
            if ref_host and ref_host != host:
                same_site = "cross-site"
        out = {
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": same_site,
            "Sec-Fetch-User": "?1",
        }
        if referer:
            out["Referer"] = referer
        return out

    def _bridge_headers_for_url(self, url: str) -> Dict[str, Any]:
        host = self._normalize_host(urlparse(url).hostname or "")
        if not host:
            return {}
        state = self._load_bridge_state()
        entry = self._pick_bridge_host_entry(state, host)
        if not isinstance(entry, dict):
            entry = {}
        headers = self._filter_bridge_headers(entry.get("headers") if isinstance(entry, dict) else {})
        user_agent = str(entry.get("user_agent") or state.get("default_user_agent") or "").strip()
        cookie_header = str(entry.get("cookie_header") or "").strip()
        if not cookie_header:
            cookie_header = self._cookie_header_from_bridge_db(state, host)
        out = {
            "headers": headers,
            "user_agent": user_agent,
            "cookie_header": cookie_header,
        }
        return out

    def _project_root_dir(self) -> str:
        return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

    def _load_bridge_state(self) -> Dict[str, Any]:
        base_dir = self._project_root_dir()
        cfg_path = os.path.join(base_dir, "config.json")
        rel_state = os.path.join("local", "browser_bridge_state.json")
        try:
            with open(cfg_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            if isinstance(cfg, dict):
                vcfg = cfg.get("vbook")
                if isinstance(vcfg, dict):
                    rel_state = str(vcfg.get("browser_bridge_state") or rel_state).strip() or rel_state
        except Exception:
            pass
        state_path = rel_state if os.path.isabs(rel_state) else os.path.normpath(os.path.join(base_dir, rel_state))
        if not os.path.isfile(state_path):
            self.__class__._bridge_state_cache = {}
            self.__class__._bridge_state_mtime = None
            return {}
        try:
            mtime = os.path.getmtime(state_path)
        except Exception:
            mtime = None
        if mtime is not None and self.__class__._bridge_state_mtime == mtime:
            return dict(self.__class__._bridge_state_cache or {})
        payload: Dict[str, Any] = {}
        try:
            with open(state_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            if isinstance(raw, dict):
                payload = raw
        except Exception:
            payload = {}
        hosts = payload.get("hosts")
        if not isinstance(hosts, dict):
            payload["hosts"] = {}
        payload["_state_path"] = state_path
        self.__class__._bridge_state_cache = payload
        self.__class__._bridge_state_mtime = mtime
        return dict(payload)

    def _normalize_host(self, host: str) -> str:
        h = (host or "").strip().lower().lstrip(".")
        if h.startswith("www."):
            return h[4:]
        return h

    def _pick_bridge_host_entry(self, state: Dict[str, Any], host: str) -> Dict[str, Any]:
        hosts = state.get("hosts")
        if not isinstance(hosts, dict):
            return {}
        want = self._normalize_host(host)
        if not want:
            return {}
        for key, row in hosts.items():
            if not isinstance(row, dict):
                continue
            key_norm = self._normalize_host(str(key))
            if key_norm == want:
                return row
        # Fallback: chọn host cùng keyword, ưu tiên mới nhất.
        keyword = want.split(".")[0] if want else ""
        best_row: Dict[str, Any] = {}
        best_time = ""
        if keyword:
            for key, row in hosts.items():
                if not isinstance(row, dict):
                    continue
                key_norm = self._normalize_host(str(key))
                if keyword not in key_norm:
                    continue
                updated = str(row.get("updated_at") or "")
                if (not best_row) or (updated > best_time):
                    best_row = row
                    best_time = updated
        if best_row:
            return best_row
        return {}

    def _filter_bridge_headers(self, headers_raw: Any) -> Dict[str, str]:
        if not isinstance(headers_raw, dict):
            return {}
        disallow = {
            "cookie",
            "host",
            "content-length",
            "connection",
            "transfer-encoding",
            "accept-encoding",
        }
        out: Dict[str, str] = {}
        for k, v in headers_raw.items():
            key = str(k or "").strip()
            val = str(v or "").strip()
            if not key or not val:
                continue
            if key.lower() in disallow:
                continue
            out[key] = val
        return out

    def _cookie_header_from_bridge_db(self, state: Dict[str, Any], host: str) -> str:
        db_path = str(state.get("cookie_db_path") or "").strip()
        if not db_path:
            return ""
        host_norm = self._normalize_host(host)
        if not host_norm:
            return ""
        path = db_path if os.path.isabs(db_path) else os.path.join(self._project_root_dir(), db_path)
        path = os.path.normpath(path)
        return self._cookie_header_from_sqlite_db(path, host_norm)

    def _cookie_header_from_sqlite_db(self, path: str, host_norm: str) -> str:
        if not os.path.isfile(path):
            return ""
        try:
            import sqlite3
            conn = sqlite3.connect(path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            like_pattern = "%" + host_norm
            pairs: List[str] = []
            seen = set()
            for row in cursor.execute(
                "SELECT host_key, name, value FROM cookies WHERE lower(host_key) LIKE ?",
                (like_pattern,),
            ):
                domain = self._normalize_host(str(row["host_key"] or ""))
                if not domain:
                    continue
                if not (domain == host_norm or host_norm.endswith("." + domain) or domain.endswith("." + host_norm)):
                    continue
                name = str(row["name"] or "").strip()
                value = str(row["value"] or "")
                if not name:
                    continue
                name_l = name.lower()
                if name_l in seen:
                    continue
                seen.add(name_l)
                pairs.append(f"{name}={value}")
            conn.close()
            return "; ".join(pairs)
        except Exception:
            return ""

    def _cookie_header_from_all_profile_dbs(self, host_norm: str) -> str:
        if not host_norm:
            return ""
        base = self._project_root_dir()
        candidates: List[str] = []

        # default profile path
        candidates.append(os.path.join(base, "qt_browser_profile", "storage", "Cookies"))

        # all named profiles
        for prof_dir in glob.glob(os.path.join(base, "qt_browser_profile*")):
            candidates.append(os.path.join(prof_dir, "storage", "Cookies"))

        # de-dup + existing
        seen = set()
        uniq_paths: List[str] = []
        for p in candidates:
            np = os.path.normpath(p)
            if np in seen:
                continue
            seen.add(np)
            if os.path.isfile(np):
                uniq_paths.append(np)

        best_header = ""
        best_score = -1
        for db_path in uniq_paths:
            cookie_header = self._cookie_header_from_sqlite_db(db_path, host_norm)
            if not cookie_header:
                continue
            score = self._cookie_header_score(cookie_header)
            if score > best_score:
                best_score = score
                best_header = cookie_header
        return best_header

    def _cookie_header_score(self, header: str) -> int:
        names = {n.lower() for n in self._cookie_names_from_header(header)}
        score = 0
        if "cf_clearance" in names:
            score += 100
        if "__cf_bm" in names:
            score += 20
        if any(n.startswith("cf_") or n.startswith("__cf") for n in names):
            score += 10
        if "blackcat_sessid" in names:
            score += 5
        score += min(len(names), 50)
        return score

    def _has_cloudflare_cookie(self, header: str) -> bool:
        names = {n.lower() for n in self._cookie_names_from_header(header)}
        return ("cf_clearance" in names) or ("__cf_bm" in names) or any(
            n.startswith("cf_") or n.startswith("__cf") for n in names
        )

    def _cookie_header_from_ctx_jar(self, jar: Any, url: str) -> str:
        if jar is None:
            return ""
        host = self._normalize_host(urlparse(url).hostname or "")
        if not host:
            return ""
        pairs: List[str] = []
        seen = set()
        try:
            for cookie in jar:
                name = str(getattr(cookie, "name", "") or "").strip()
                value = str(getattr(cookie, "value", "") or "")
                domain = self._normalize_host(str(getattr(cookie, "domain", "") or ""))
                if not name:
                    continue
                if domain and not (domain == host or host.endswith("." + domain) or domain.endswith("." + host)):
                    continue
                key = name.lower()
                if key in seen:
                    continue
                seen.add(key)
                pairs.append(f"{name}={value}")
        except Exception:
            return ""
        return "; ".join(pairs)

    def _merge_cookie_headers(self, first: str, second: str) -> str:
        pairs: Dict[str, str] = {}

        def feed(header: str):
            for token in str(header or "").split(";"):
                chunk = token.strip()
                if not chunk or "=" not in chunk:
                    continue
                name, value = chunk.split("=", 1)
                name = name.strip()
                if not name:
                    continue
                pairs[name] = value.strip()

        feed(first)
        feed(second)
        if not pairs:
            return ""
        return "; ".join(f"{k}={v}" for k, v in pairs.items())

    def _cookie_names_from_header(self, header: str) -> List[str]:
        out: List[str] = []
        for token in str(header or "").split(";"):
            chunk = token.strip()
            if not chunk or "=" not in chunk:
                continue
            name = chunk.split("=", 1)[0].strip()
            if name:
                out.append(name)
        return out

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
