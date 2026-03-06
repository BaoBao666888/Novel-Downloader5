from __future__ import annotations

import hashlib
import re
from typing import Any, Dict, List
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from app.nd5.plugin_api import ND5Context


class ReaderVBookBridgePlugin:
    """
    Adapter ND5 -> Reader Server vBook API.
    Dùng ext vBook đã cài trong Reader để ND5 lấy detail/toc/chap.
    """

    requires_bridge = False
    requires_reader_server = True
    is_vbook_bridge = True
    requires_cookies = False
    batch_size = 20

    def __init__(self, *, reader_base_url: str, plugin_payload: dict[str, Any]):
        self.reader_base_url = str(reader_base_url or "").rstrip("/")
        self.plugin_payload = dict(plugin_payload or {})

        plugin_id = str(self.plugin_payload.get("plugin_id") or "").strip()
        self.vbook_plugin_id = plugin_id
        self.id = f"vbook_ext::{plugin_id}" if plugin_id else "vbook_ext::unknown"
        self.name = f"vBook • {self.plugin_payload.get('name') or plugin_id or 'Plugin'}"
        self.version = self.plugin_payload.get("version") or ""
        self.author = self.plugin_payload.get("author") or ""
        self.source = self.plugin_payload.get("source") or ""
        self.description = self.plugin_payload.get("description") or ""
        self.type = self.plugin_payload.get("type") or "novel"
        self.locale = self.plugin_payload.get("locale") or "zh_CN"
        self.icon = self.plugin_payload.get("icon_url") or None
        self.sample_url = self.source or ""

        regexp_raw = str(self.plugin_payload.get("regexp") or "").strip()
        self._regexp_raw = regexp_raw
        self._regexp = self._compile_regexp(regexp_raw)
        self.domains = self._derive_domains()

    def _compile_regexp(self, value: str):
        pattern = str(value or "").strip()
        if not pattern:
            return None
        try:
            return re.compile(pattern, re.IGNORECASE)
        except Exception:
            return None

    def _derive_domains(self) -> List[str]:
        out: List[str] = []
        source = str(self.source or "").strip()
        if source:
            try:
                host = (urlparse(source).hostname or "").strip().lower()
                if host:
                    out.append(host)
            except Exception:
                pass
        if self._regexp_raw:
            for part in re.findall(r"[A-Za-z0-9-]+(?:\\\.)+[A-Za-z0-9.-]+", self._regexp_raw):
                host = part.replace("\\.", ".").strip().lower()
                if host and host not in out:
                    out.append(host)
        return out

    def _api(self, ctx: ND5Context, method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        if not self.reader_base_url:
            raise RuntimeError("Thiếu reader_base_url cho plugin vBook bridge.")
        url = f"{self.reader_base_url}{path}"
        kwargs: dict[str, Any] = {
            "timeout": max(5.0, float(getattr(ctx, "timeout", 20.0) or 20.0)),
        }
        if payload is not None:
            kwargs["json"] = payload
        resp = requests.request(method.upper(), url, **kwargs)
        try:
            data = resp.json() if resp.content else {}
        except Exception:
            data = {}
        if not resp.ok:
            message = str((data or {}).get("message") or f"HTTP {resp.status_code}").strip()
            details = (data or {}).get("details")
            if details:
                message = f"{message} | {details}"
            raise RuntimeError(message)
        if not isinstance(data, dict):
            raise RuntimeError("Reader API trả về dữ liệu không hợp lệ.")
        return data

    def supports_url(self, url: str) -> bool:
        target = str(url or "").strip()
        if not target:
            return False
        if self._regexp is not None:
            try:
                return bool(self._regexp.search(target))
            except Exception:
                pass
        lower = target.lower()
        for domain in self.domains:
            if domain and domain in lower:
                return True
        return False

    def search(self, query: str, page: int, ctx: ND5Context):
        q = str(query or "").strip()
        if not q:
            return [], None
        payload = {
            "plugin_id": self.vbook_plugin_id,
            "query": q,
            "page": max(1, int(page or 1)),
        }
        data = self._api(ctx, "POST", "/api/vbook/search", payload)
        rows = data.get("items") if isinstance(data.get("items"), list) else []
        items: List[Dict[str, Any]] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            items.append(
                {
                    "title": str(row.get("title") or row.get("name") or "").strip(),
                    "author": str(row.get("author") or "").strip(),
                    "cover": str(row.get("cover") or row.get("image") or "").strip(),
                    "url": str(row.get("url") or row.get("link") or "").strip(),
                }
            )
        return items, data.get("next")

    def fetch_book_and_toc(self, url: str, ctx: ND5Context) -> tuple[Dict[str, Any], List[Dict[str, Any]]]:
        source_url = str(url or "").strip()
        if not source_url:
            raise ValueError("Thiếu URL truyện.")

        detail_resp = self._api(
            ctx,
            "POST",
            "/api/vbook/detail",
            {"plugin_id": self.vbook_plugin_id, "url": source_url},
        )
        detail = detail_resp.get("detail") if isinstance(detail_resp.get("detail"), dict) else {}

        toc_resp = self._api(
            ctx,
            "POST",
            "/api/vbook/toc",
            {"plugin_id": self.vbook_plugin_id, "url": source_url, "all": True},
        )
        rows = toc_resp.get("items") if isinstance(toc_resp.get("items"), list) else []

        chapter_url_map: Dict[str, str] = {}
        toc: List[Dict[str, Any]] = []
        for idx, row in enumerate(rows, start=1):
            if not isinstance(row, dict):
                continue
            chapter_url = str(row.get("url") or row.get("link") or "").strip()
            cid = f"c{idx}"
            chapter_url_map[cid] = chapter_url
            toc.append(
                {
                    "num": idx,
                    "id": cid,
                    "title": str(row.get("title") or row.get("title_raw") or f"Chương {idx}").strip(),
                }
            )

        book_seed = f"{self.vbook_plugin_id}|{source_url}"
        book_id = hashlib.sha1(book_seed.encode("utf-8", errors="ignore")).hexdigest()[:16]
        meta: Dict[str, Any] = {
            "book_id": f"vbook_{book_id}",
            "title": str(detail.get("title") or source_url).strip(),
            "author": str(detail.get("author") or "").strip(),
            "intro": str(detail.get("description") or "").strip(),
            "cover": str(detail.get("cover") or "").strip(),
            "detail": str(detail.get("info_text") or "").strip(),
            "status": str(detail.get("status_text") or "").strip(),
            "source_url": source_url,
            "source_plugin": self.vbook_plugin_id,
            "chapter_url_map": chapter_url_map,
        }
        return meta, toc

    def download_chapter_batch(
        self,
        book: Dict[str, Any],
        ids: List[str],
        fmt: str,
        fallback_titles: Dict[str, str],
        ctx: ND5Context,
    ) -> Dict[str, Dict[str, Any]]:
        chapter_map = book.get("chapter_url_map") if isinstance(book.get("chapter_url_map"), dict) else {}
        out: Dict[str, Dict[str, Any]] = {}
        for cid in ids or []:
            chapter_id = str(cid or "").strip()
            if not chapter_id:
                continue
            chapter_url = str(chapter_map.get(chapter_id) or "").strip()
            if not chapter_url:
                continue
            try:
                data = self._api(
                    ctx,
                    "POST",
                    "/api/vbook/chap",
                    {"plugin_id": self.vbook_plugin_id, "url": chapter_url},
                )
                chapter = data.get("chapter") if isinstance(data.get("chapter"), dict) else {}
                is_comic = bool(chapter.get("is_comic"))
                images = chapter.get("images") if isinstance(chapter.get("images"), list) else []
                if is_comic and images:
                    content = "\n".join(str(x).strip() for x in images if str(x).strip())
                else:
                    content = str(chapter.get("content") or "").strip()
                out[chapter_id] = {
                    "title": fallback_titles.get(chapter_id) or f"Chương {chapter_id}",
                    "content": content,
                }
            except Exception as exc:
                ctx.log(f"Lỗi tải chương {chapter_id} qua bridge vBook: {exc}")
            finally:
                ctx.sleep_between_requests()
        return out

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
