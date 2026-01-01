from __future__ import annotations

import base64
import datetime
import hashlib
import json
import re
from typing import Any, Dict, List, Optional
from urllib.parse import quote, quote_plus, urljoin

from bs4 import BeautifulSoup

from app.nd5.plugin_api import ND5Context

_DES_IP = [
    58, 50, 42, 34, 26, 18, 10, 2,
    60, 52, 44, 36, 28, 20, 12, 4,
    62, 54, 46, 38, 30, 22, 14, 6,
    64, 56, 48, 40, 32, 24, 16, 8,
    57, 49, 41, 33, 25, 17, 9, 1,
    59, 51, 43, 35, 27, 19, 11, 3,
    61, 53, 45, 37, 29, 21, 13, 5,
    63, 55, 47, 39, 31, 23, 15, 7,
]

_DES_FP = [
    40, 8, 48, 16, 56, 24, 64, 32,
    39, 7, 47, 15, 55, 23, 63, 31,
    38, 6, 46, 14, 54, 22, 62, 30,
    37, 5, 45, 13, 53, 21, 61, 29,
    36, 4, 44, 12, 52, 20, 60, 28,
    35, 3, 43, 11, 51, 19, 59, 27,
    34, 2, 42, 10, 50, 18, 58, 26,
    33, 1, 41, 9, 49, 17, 57, 25,
]

_DES_E = [
    32, 1, 2, 3, 4, 5,
    4, 5, 6, 7, 8, 9,
    8, 9, 10, 11, 12, 13,
    12, 13, 14, 15, 16, 17,
    16, 17, 18, 19, 20, 21,
    20, 21, 22, 23, 24, 25,
    24, 25, 26, 27, 28, 29,
    28, 29, 30, 31, 32, 1,
]

_DES_P = [
    16, 7, 20, 21,
    29, 12, 28, 17,
    1, 15, 23, 26,
    5, 18, 31, 10,
    2, 8, 24, 14,
    32, 27, 3, 9,
    19, 13, 30, 6,
    22, 11, 4, 25,
]

_DES_PC1 = [
    57, 49, 41, 33, 25, 17, 9,
    1, 58, 50, 42, 34, 26, 18,
    10, 2, 59, 51, 43, 35, 27,
    19, 11, 3, 60, 52, 44, 36,
    63, 55, 47, 39, 31, 23, 15,
    7, 62, 54, 46, 38, 30, 22,
    14, 6, 61, 53, 45, 37, 29,
    21, 13, 5, 28, 20, 12, 4,
]

_DES_PC2 = [
    14, 17, 11, 24, 1, 5,
    3, 28, 15, 6, 21, 10,
    23, 19, 12, 4, 26, 8,
    16, 7, 27, 20, 13, 2,
    41, 52, 31, 37, 47, 55,
    30, 40, 51, 45, 33, 48,
    44, 49, 39, 56, 34, 53,
    46, 42, 50, 36, 29, 32,
]

_DES_SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1]

_DES_SBOX = [
    [
        [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
        [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
        [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
        [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13],
    ],
    [
        [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
        [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
        [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
        [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9],
    ],
    [
        [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
        [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
        [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
        [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12],
    ],
    [
        [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
        [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
        [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
        [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14],
    ],
    [
        [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
        [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
        [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
        [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3],
    ],
    [
        [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
        [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
        [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
        [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13],
    ],
    [
        [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
        [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
        [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
        [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12],
    ],
    [
        [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
        [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
        [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
        [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11],
    ],
]


def _permute(block: int, table: List[int], size: int) -> int:
    out = 0
    for pos in table:
        out = (out << 1) | ((block >> (size - pos)) & 1)
    return out


def _left_rotate(val: int, shift: int, size: int) -> int:
    mask = (1 << size) - 1
    return ((val << shift) & mask) | (val >> (size - shift))


def _des_subkeys(key_bytes: bytes) -> List[int]:
    key_int = int.from_bytes(key_bytes, "big")
    permuted = _permute(key_int, _DES_PC1, 64)
    c = (permuted >> 28) & 0x0FFFFFFF
    d = permuted & 0x0FFFFFFF
    subkeys = []
    for shift in _DES_SHIFTS:
        c = _left_rotate(c, shift, 28)
        d = _left_rotate(d, shift, 28)
        cd = (c << 28) | d
        subkeys.append(_permute(cd, _DES_PC2, 56))
    return subkeys


def _des_f(right: int, subkey: int) -> int:
    expanded = _permute(right, _DES_E, 32)
    x = expanded ^ subkey
    out = 0
    for idx in range(8):
        chunk = (x >> (42 - 6 * idx)) & 0x3F
        row = ((chunk & 0x20) >> 4) | (chunk & 0x01)
        col = (chunk >> 1) & 0x0F
        out = (out << 4) | _DES_SBOX[idx][row][col]
    return _permute(out, _DES_P, 32)


def _des_block_decrypt(block: int, subkeys: List[int]) -> int:
    permuted = _permute(block, _DES_IP, 64)
    left = (permuted >> 32) & 0xFFFFFFFF
    right = permuted & 0xFFFFFFFF
    for subkey in reversed(subkeys):
        left, right = right, left ^ _des_f(right, subkey)
    merged = (right << 32) | left
    return _permute(merged, _DES_FP, 64)


def _pkcs7_unpad(data: bytes, block_size: int = 8) -> bytes:
    if not data:
        return data
    pad_len = data[-1]
    if pad_len < 1 or pad_len > block_size:
        return data
    if data[-pad_len:] != bytes([pad_len]) * pad_len:
        return data
    return data[:-pad_len]


def _des_cbc_decrypt_b64(cipher_text: str, key: str, iv: str) -> str:
    cipher_text = (cipher_text or "").strip()
    if not cipher_text:
        return ""
    raw = base64.b64decode(cipher_text)
    subkeys = _des_subkeys(key.encode("utf-8"))
    prev = int.from_bytes(iv.encode("utf-8"), "big")
    out = bytearray()
    for offset in range(0, len(raw), 8):
        block = raw[offset:offset + 8]
        if len(block) < 8:
            break
        block_int = int.from_bytes(block, "big")
        plain_int = _des_block_decrypt(block_int, subkeys) ^ prev
        out.extend(plain_int.to_bytes(8, "big"))
        prev = block_int
    out = _pkcs7_unpad(bytes(out))
    return out.decode("utf-8", errors="ignore")


def _md5_hex(text: str) -> str:
    return hashlib.md5(text.encode("utf-8")).hexdigest()


class JjwxcPlugin:
    id = "jjwxc"
    name = "JJWXC"
    version = 1
    author = "BaoBao"
    source = "https://www.jjwxc.net/"
    description = "Tải JJWXC"
    type = "chinese_novel"
    locale = "zh_CN"
    domains = [
        "jjwxc.net",
        "jjwxc.com",
        "my.jjwxc.net",
        "m.jjwxc.net",
        "m.jjwxc.com",
    ]
    sample_url = "https://www.jjwxc.net/onebook.php?novelid=123456"
    icon = None
    requires_bridge = False
    requires_cookies = True
    cookie_domains = [
        "jjwxc.net",
        "jjwxc.com",
        "my.jjwxc.net",
        "m.jjwxc.net",
        "m.jjwxc.com",
    ]
    batch_size = 1
    additional_fields = [
        {
            "key": "android_token",
            "label": "Token Android",
            "description": "Nhập token Android (từ app JJWXC). Ưu tiên token Android; nếu trống sẽ dùng cookie trình duyệt.",
            "secret": True,
        }
    ]

    _WEB_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
    _ANDROID_UA = (
        "Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro Build/TP1A.251005.002.B2; wv) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.109 "
        "Mobile Safari/537.36/JINJIANG-Android/381(Pixel9Pro;Scale/3.5;isHarmonyOS/false)"
    )
    _ANDROID_REFERER = "http://android.jjwxc.net?v=381"
    _ANDROID_VERSION = "381"

    _MSG_NO_NOVEL_ID = "Không tìm thấy novelid trong URL."
    _MSG_NEED_AUTH = "Thiếu xác thực: hãy nhập token Android trong Giá trị bổ sung hoặc đăng nhập trình duyệt để lấy cookie."
    _MSG_FAIL_CHAPTER = "Không tải được chương {cid}: {exc}"
    _MSG_NO_CONTENT = "Không tải được nội dung chương {cid}."
    _MSG_ENCRYPTED = "Nội dung chương đang mã hóa, chưa hỗ trợ giải mã."
    _MSG_TOKEN_INVALID = "Token Android không hợp lệ hoặc đã hết hạn."
    _MSG_VIP_NEED_TOKEN = "Chương VIP cần token Android hợp lệ (đã mua chương)."
    _MSG_VIP_COOKIE_LIMIT = "Chương {cid} là VIP, cookie web thường không đủ. Hãy nhập token Android."

    _MSG_TOKEN_SAVED = "Đã lưu token Android."
    _MSG_TOKEN_EMPTY = "Token Android trống."
    _MSG_TOKEN_REMOVED = "Đã xóa token Android."
    _DESC_TOKEN = "Nhập token Android (từ app JJWXC)."
    _DESC_PRIORITY = "Ưu tiên token Android; nếu trống sẽ dùng cookie trình duyệt."
    _BTN_OPEN_BROWSER = "Mở trình duyệt đăng nhập"

    def supports_url(self, url: str) -> bool:
        return bool(url and "jjwxc" in url)

    def _extract_book_id(self, url: str) -> Optional[str]:
        if not url:
            return None
        m = re.search(r"novelid=(\d+)", url, re.IGNORECASE)
        if m:
            return m.group(1)
        m = re.search(r"/book2/(\d+)", url)
        if m:
            return m.group(1)
        return None

    def _extract_chapter_id(self, url: str) -> Optional[str]:
        if not url:
            return None
        m = re.search(r"chapterid=(\d+)", url, re.IGNORECASE)
        if m:
            return m.group(1)
        return None

    def _get_android_token(self, ctx: ND5Context) -> str:
        token = ctx.get_extra("android_token", "")
        if token is None:
            return ""
        return str(token).strip()

    def _require_auth(self, ctx: ND5Context) -> str:
        token = self._get_android_token(ctx)
        cookies = ctx.get_cookies()
        if token:
            return token
        if cookies:
            return ""
        raise ValueError(self._MSG_NEED_AUTH)

    def _request_web(self, url: str, ctx: ND5Context):
        self._require_auth(ctx)
        headers = {
            "User-Agent": self._WEB_UA,
            "Referer": "https://www.jjwxc.net/",
        }
        return ctx.request_with_retry(url, headers=headers)

    def _request_api(self, url: str, ctx: ND5Context):
        headers = {
            "User-Agent": self._ANDROID_UA,
            "Referer": self._ANDROID_REFERER,
        }
        return ctx.request_with_retry(url, headers=headers)

    def _build_android_chapter_url(self, chapter_url: str, token: str) -> str:
        api_url = chapter_url.replace(
            "http://www.jjwxc.net/onebook.php?",
            "https://app.jjwxc.net/androidapi/chapterContent?",
        )
        api_url = api_url.replace(
            "https://www.jjwxc.net/onebook.php?",
            "https://app.jjwxc.net/androidapi/chapterContent?",
        )
        api_url = api_url.replace(
            "http://my.jjwxc.net/onebook_vip.php?",
            "https://app.jjwxc.net/androidapi/chapterContent?",
        )
        api_url = api_url.replace(
            "https://my.jjwxc.net/onebook_vip.php?",
            "https://app.jjwxc.net/androidapi/chapterContent?",
        )
        api_url = re.sub(r"novelid=", "novelId=", api_url, flags=re.IGNORECASE)
        api_url = re.sub(r"chapterid=", "chapterId=", api_url, flags=re.IGNORECASE)
        if "versionCode=" not in api_url:
            api_url += f"&versionCode={self._ANDROID_VERSION}"
        if "token=" not in api_url:
            api_url += f"&token={quote(token)}"
        return api_url

    def _decode_encrypted_response(self, content: str, access_key: str, key_string: str) -> Optional[str]:
        if not content or not access_key or not key_string:
            return None
        try:
            v9 = sum(ord(ch) for ch in access_key)
            v6 = ord(access_key[-1])
            v15 = v9 % len(key_string)
            v17 = v9 // 65
            v18 = len(key_string)
            if v17 + v15 > v18:
                v43 = key_string[v15:(v18 - v17) + v15]
            else:
                v43 = key_string[v15:v17 + v15]
            if v6 & 1:
                v38 = content[-12:]
                dest = content[:-12]
            else:
                v38 = content[:12]
                dest = content[12:]
            key = _md5_hex(v43 + v38)[:8]
            iv = _md5_hex(v38)[:8]
            return _des_cbc_decrypt_b64(dest, key, iv)
        except Exception:
            return None

    def _decrypt_vip_content(self, content: str) -> str:
        if not content or len(content) <= 30:
            return ""
        return _des_cbc_decrypt_b64(content, "KW8Dvm2N", "1ae2c94b")

    def _parse_api_payload(self, resp) -> Optional[Dict[str, Any]]:
        text = resp.text.strip() if hasattr(resp, "text") else ""
        payload = None
        try:
            payload = resp.json()
        except Exception:
            payload = None
        if isinstance(payload, dict):
            return payload
        access_key = resp.headers.get("accesskey") or resp.headers.get("AccessKey")
        key_string = resp.headers.get("keystring") or resp.headers.get("KeyString")
        decoded = self._decode_encrypted_response(text, access_key or "", key_string or "")
        if decoded:
            try:
                return json.loads(decoded)
            except Exception:
                return None
        return None

    def _fetch_chapter_via_api(self, chapter_url: str, token: str, ctx: ND5Context) -> Optional[Dict[str, Any]]:
        api_url = self._build_android_chapter_url(chapter_url, token)
        resp = self._request_api(api_url, ctx)
        resp.raise_for_status()
        payload = self._parse_api_payload(resp)
        if not isinstance(payload, dict):
            return None
        message = payload.get("message")
        code = str(payload.get("code", ""))
        if message == "try again!":
            return None
        if message and ("token" in str(message).lower() or code == "2016"):
            ctx.log(self._MSG_TOKEN_INVALID)
            return None
        return payload

    def _format_chapter_content(self, content: str, say_body: str, chapter_intro: str) -> str:
        text = str(content or "")
        text = text.replace("&lt;", "<").replace("&gt;", ">")
        text = text.replace("\n　　", "<br>").replace("<br><br>", "<br>")
        say_body = str(say_body or "")
        if say_body.strip():
            text += "<br>---------<br>作者留言：<br>" + say_body.replace("\r\n", "<br>")
        return text

    def _convert_china_time(self, raw: str) -> str:
        raw = (raw or "").strip()
        if not raw:
            return ""
        try:
            china_dt = datetime.datetime.strptime(raw, "%Y-%m-%d %H:%M:%S")
            vn_dt = china_dt - datetime.timedelta(hours=1)
            return vn_dt.strftime("%H:%M:%S %d-%m-%Y")
        except Exception:
            return raw

    def _describe_character_relations(self, data: Dict[str, Any]) -> str:
        characters = data.get("characters")
        relations = data.get("character_relations")
        if not isinstance(characters, list) or not isinstance(relations, list):
            return ""
        by_id = {}
        for char in characters:
            if isinstance(char, dict):
                cid = char.get("character_id")
                if cid:
                    by_id[cid] = char
        pov = next((c for c in characters if isinstance(c, dict) and c.get("is_pov") == "1"), None)
        if not pov:
            return "Không tìm thấy nhân vật thị giác."

        def gender_label(val):
            if val == "1":
                return "【男】"
            if val == "0":
                return "【女】"
            return "【其他】"

        lovers = []
        lover_ids = set()
        for rel in relations:
            if not isinstance(rel, dict):
                continue
            if rel.get("start") == pov.get("character_id") and rel.get("end") in by_id:
                lover = by_id[rel.get("end")]
                lovers.append(lover)
                lover_ids.add(rel.get("end"))
        main_line = f"主角视角：{pov.get('character_name', '')}{gender_label(pov.get('character_gender'))}"
        if lovers:
            lover_str = ", ".join(
                f"{item.get('character_name', '')}{gender_label(item.get('character_gender'))}" for item in lovers
            )
            main_line += f"(互动){lover_str}"
        other_lines = []
        for char in characters:
            if not isinstance(char, dict):
                continue
            cid = char.get("character_id")
            if cid == pov.get("character_id") or cid in lover_ids:
                continue
            other_lines.append(
                f"配角: {char.get('character_name', '')} {gender_label(char.get('character_gender'))}"
            )
        return "\n".join([main_line] + other_lines)

    def _fetch_book_info_api(self, book_id: str, ctx: ND5Context) -> Dict[str, Any]:
        url = f"https://app.jjwxc.net/androidapi/novelbasicinfo?novelId={book_id}"
        ctx.sleep_between_requests()
        resp = self._request_api(url, ctx)
        resp.raise_for_status()
        data = resp.json()
        intro = str(data.get("novelIntro") or "")
        intro = intro.replace("&lt;", "<").replace("&gt;", ">")
        intro = intro.replace("<br/>", "\n").replace("<br />", "\n").replace("<br>", "\n")
        intro = re.sub(r"\n{3,}", "\n\n", intro).strip()
        extra_desc = self._describe_character_relations(data)
        if extra_desc:
            intro = (intro + "\n\n" + extra_desc).strip()
        cover = data.get("novelCover") or ""
        if cover:
            cover_proxy = f"https://images.weserv.nl/?url={cover}&output=jpg&w=300"
            try:
                check = ctx.request_with_retry(cover_proxy, method="head")
                if check.status_code == 200:
                    cover = cover_proxy
            except Exception:
                pass
        detail = (
            f"作者： {data.get('authorName', '')}\n"
            f"文章类型： {data.get('novelClass', '')}\n"
            f"内容标签： {data.get('novelTags', '')}\n"
            f"全文字数： {data.get('novelSize', '')}字\n"
            f"章节数： {data.get('maxChapterId', '')}\n"
            f"最新更新： {data.get('renewChapterName', '')}\n"
            f"更新时间： {self._convert_china_time(data.get('renewDate'))}"
        ).strip()
        status = None
        ongoing = None
        step = str(data.get("novelStep") or "").strip()
        if step:
            if step == "1":
                status = "Đang ra"
                ongoing = True
            elif step == "2":
                status = "Hoàn thành"
                ongoing = False
        return {
            "book_id": book_id,
            "title": data.get("novelName") or f"JJWXC_{book_id}",
            "author": data.get("authorName") or "",
            "intro": intro,
            "cover": cover,
            "detail": detail,
            "status": status,
            "ongoing": ongoing,
        }

    def _fetch_toc_api(self, book_id: str, ctx: ND5Context) -> tuple[List[Dict[str, Any]], Dict[str, str], Dict[str, bool]]:
        url = f"https://app-cdn.jjwxc.net/androidapi/chapterList?novelId={book_id}&more=0&whole=1"
        ctx.sleep_between_requests()
        resp = self._request_api(url, ctx)
        resp.raise_for_status()
        payload = resp.json()
        chapters = payload.get("chapterlist") if isinstance(payload, dict) else None
        toc: List[Dict[str, Any]] = []
        url_map: Dict[str, str] = {}
        vip_map: Dict[str, bool] = {}
        if isinstance(chapters, list):
            for entry in chapters:
                if not isinstance(entry, dict):
                    continue
                if str(entry.get("chaptertype", "")) == "1":
                    continue
                chapter_id = str(entry.get("chapterid") or "").strip()
                if not chapter_id:
                    continue
                title = entry.get("chaptername") or f"Chương {chapter_id}"
                url_map[chapter_id] = f"https://www.jjwxc.net/onebook.php?novelid={book_id}&chapterid={chapter_id}"
                try:
                    is_vip = int(str(entry.get("isvip") or 0)) > 0
                except Exception:
                    is_vip = False
                vip_map[chapter_id] = is_vip
                toc.append({"num": len(toc) + 1, "id": chapter_id, "title": title, "vip": is_vip})
        return toc, url_map, vip_map

    def build_additional_values_ui(
        self,
        parent,
        values: Dict[str, Any],
        set_value,
        delete_value,
        save_values,
        run_task,
        open_browser,
    ):
        import tkinter as tk
        from tkinter import ttk, messagebox

        parent.columnconfigure(1, weight=1)
        ttk.Label(parent, text="Token Android:").grid(row=0, column=0, sticky="w", padx=(0, 8))
        token_var = tk.StringVar(value=str(values.get("android_token", "") or ""))
        ttk.Entry(parent, textvariable=token_var, show="*").grid(row=0, column=1, sticky="ew")

        def _sync_token(*_args):
            token = token_var.get().strip()
            if token:
                set_value("android_token", token)
            else:
                delete_value("android_token")

        token_var.trace_add("write", _sync_token)
        ttk.Label(parent, text=self._DESC_TOKEN, foreground="#6b7280", wraplength=420, justify="left").grid(
            row=1, column=1, sticky="w", pady=(2, 0)
        )
        ttk.Label(parent, text=self._DESC_PRIORITY, foreground="#6b7280", wraplength=420, justify="left").grid(
            row=2, column=1, sticky="w", pady=(0, 8)
        )

        btn_row = ttk.Frame(parent)
        btn_row.grid(row=3, column=1, sticky="w")

        def _save_token():
            token = token_var.get().strip()
            if not token:
                messagebox.showwarning("JJWXC", self._MSG_TOKEN_EMPTY, parent=parent.winfo_toplevel())
                return
            set_value("android_token", token)
            save_values()
            messagebox.showinfo("JJWXC", self._MSG_TOKEN_SAVED, parent=parent.winfo_toplevel())

        def _remove_token():
            delete_value("android_token")
            token_var.set("")
            save_values()
            messagebox.showinfo("JJWXC", self._MSG_TOKEN_REMOVED, parent=parent.winfo_toplevel())

        def _open_login():
            open_browser("https://www.jjwxc.net/login.php")

        ttk.Button(btn_row, text="Lưu token", command=_save_token).pack(side=tk.LEFT)
        ttk.Button(btn_row, text="Xóa token", command=_remove_token).pack(side=tk.LEFT, padx=(8, 0))
        ttk.Button(btn_row, text=self._BTN_OPEN_BROWSER, command=_open_login).pack(side=tk.LEFT, padx=(8, 0))

        return False

    def fetch_book_and_toc(self, url: str, ctx: ND5Context) -> tuple[Dict[str, Any], List[Dict[str, Any]]]:
        book_id = self._extract_book_id(url)
        if not book_id:
            raise ValueError(self._MSG_NO_NOVEL_ID)
        try:
            meta = self._fetch_book_info_api(book_id, ctx)
            toc, url_map, vip_map = self._fetch_toc_api(book_id, ctx)
            meta["chapter_url_map"] = url_map
            meta["chapter_vip_map"] = vip_map
            return meta, toc
        except Exception as exc:
            ctx.log(f"Không lấy được API, thử lấy từ web: {exc}")

        page_url = f"https://www.jjwxc.net/onebook.php?novelid={book_id}"
        ctx.sleep_between_requests()
        resp = ctx.request_with_retry(page_url, headers={"User-Agent": self._WEB_UA, "Referer": "https://www.jjwxc.net/"})
        resp.raise_for_status()
        resp.encoding = resp.encoding or "gb18030"
        soup = BeautifulSoup(resp.text, "html.parser")

        title = ""
        title_node = soup.select_one("#oneboolt .bigtext") or soup.select_one(".noveltitle h1")
        if title_node:
            title = title_node.get_text(strip=True)
        author = ""
        author_node = soup.select_one("#oneboolt h2 a") or soup.select_one(".noveltitle a")
        if author_node:
            author = author_node.get_text(strip=True)
        intro = ""
        intro_node = soup.select_one("#novelintro") or soup.select_one("div.introduce > p.jj")
        if intro_node:
            intro = intro_node.get_text("\n", strip=True)
        cover = ""
        cover_node = soup.select_one(".noveldefaultimage")
        if cover_node and cover_node.get("src"):
            cover = cover_node.get("src")

        toc: List[Dict[str, Any]] = []
        url_map: Dict[str, str] = {}
        for link in soup.select("#oneboolt a[href*='chapterid=']"):
            href = link.get("href")
            if not href:
                continue
            full_url = urljoin(page_url, href)
            chapter_id = self._extract_chapter_id(full_url)
            if not chapter_id:
                continue
            if chapter_id in url_map:
                continue
            chapter_title = link.get_text(strip=True)
            if not chapter_title:
                continue
            url_map[chapter_id] = full_url
            toc.append({"num": len(toc) + 1, "id": chapter_id, "title": chapter_title})

        meta = {
            "book_id": book_id,
            "title": title or f"JJWXC_{book_id}",
            "author": author,
            "intro": intro,
            "cover": cover,
            "chapter_url_map": url_map,
            "chapter_vip_map": {},
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
        if not ids:
            return {}
        token = self._get_android_token(ctx)
        cookies = ctx.get_cookies()
        if not token and not cookies:
            raise ValueError(self._MSG_NEED_AUTH)
        book_id = (book or {}).get("book_id") or (book or {}).get("id")
        if not book_id:
            return {}
        url_map = (book or {}).get("chapter_url_map") or {}
        vip_map = (book or {}).get("chapter_vip_map") or {}
        results: Dict[str, Dict[str, Any]] = {}
        def _resolve_title(chapter_id: str) -> str:
            return (
                fallback_titles.get(chapter_id)
                or fallback_titles.get(str(chapter_id))
                or f"Chương {chapter_id}"
            )

        for cid in ids:
            ctx.sleep_between_requests()
            chapter_id = str(cid)
            chapter_url = url_map.get(chapter_id) or f"https://www.jjwxc.net/onebook.php?novelid={book_id}&chapterid={chapter_id}"
            is_vip = bool(vip_map.get(chapter_id))
            warned_vip_cookie = False
            if is_vip and not token:
                ctx.log(self._MSG_VIP_COOKIE_LIMIT.format(cid=chapter_id))
                warned_vip_cookie = True
            if token:
                try:
                    payload = self._fetch_chapter_via_api(chapter_url, token, ctx) or {}
                except Exception as exc:
                    ctx.log(self._MSG_FAIL_CHAPTER.format(cid=chapter_id, exc=exc))
                    payload = {}
                content = payload.get("content") if isinstance(payload, dict) else None
                if content:
                    content = self._decrypt_vip_content(str(content)) or content
                    say_body = payload.get("sayBodyV2") or payload.get("sayBody") or ""
                    chapter_intro = payload.get("chapterIntro") or ""
                    content_html = self._format_chapter_content(content, say_body, chapter_intro)
                    title = _resolve_title(chapter_id)
                    results[str(chapter_id)] = {"title": title, "content": content_html}
                    continue
                message = payload.get("message") if isinstance(payload, dict) else None
                code = str(payload.get("code", "")) if isinstance(payload, dict) else ""
                if message:
                    msg = str(message)
                    if code in {"1004", "1025"} or "VIP" in msg or "登录" in msg or "登陆" in msg or "购买" in msg:
                        ctx.log(self._MSG_VIP_NEED_TOKEN)
                    else:
                        ctx.log(f"Chương {chapter_id}: {msg}")
                if not cookies:
                    ctx.log(self._MSG_NO_CONTENT.format(cid=chapter_id))
                    continue
            try:
                resp = self._request_web(chapter_url, ctx)
                resp.raise_for_status()
                resp.encoding = resp.encoding or "gb18030"
            except Exception as exc:
                ctx.log(self._MSG_FAIL_CHAPTER.format(cid=chapter_id, exc=exc))
                continue
            soup = BeautifulSoup(resp.text, "html.parser")
            content_node = soup.select_one("div#noveltext") or soup.select_one("div.noveltext")
            if not content_node:
                if not warned_vip_cookie:
                    ctx.log(self._MSG_NO_CONTENT.format(cid=chapter_id))
                continue
            for tag in content_node.select("script, style"):
                tag.decompose()
            content_html = content_node.decode_contents()
            title = _resolve_title(chapter_id)
            results[str(chapter_id)] = {"title": title, "content": content_html}
        return results

    def download_vip_chapter_batch(
        self,
        book: Dict[str, Any],
        ids: List[str],
        fmt: str,
        fallback_titles: Dict[str, str],
        ctx: ND5Context,
    ) -> Dict[str, Dict[str, Any]]:
        if not ids:
            return {}
        token = self._get_android_token(ctx)
        if not token:
            raise ValueError(self._MSG_VIP_NEED_TOKEN)
        book_id = (book or {}).get("book_id") or (book or {}).get("id")
        if not book_id:
            return {}
        url_map = (book or {}).get("chapter_url_map") or {}
        results: Dict[str, Dict[str, Any]] = {}

        def _resolve_title(chapter_id: str) -> str:
            return (
                fallback_titles.get(chapter_id)
                or fallback_titles.get(str(chapter_id))
                or f"Chương {chapter_id}"
            )

        for cid in ids:
            ctx.sleep_between_requests()
            chapter_id = str(cid)
            chapter_url = url_map.get(chapter_id) or f"https://www.jjwxc.net/onebook.php?novelid={book_id}&chapterid={chapter_id}"
            try:
                payload = self._fetch_chapter_via_api(chapter_url, token, ctx) or {}
            except Exception as exc:
                ctx.log(self._MSG_FAIL_CHAPTER.format(cid=chapter_id, exc=exc))
                continue
            content = payload.get("content") if isinstance(payload, dict) else None
            if not content:
                message = payload.get("message") if isinstance(payload, dict) else None
                if message:
                    msg = str(message)
                    if "VIP" in msg or "登录" in msg or "登陆" in msg or "购买" in msg:
                        ctx.log(self._MSG_VIP_NEED_TOKEN)
                    else:
                        ctx.log(f"Chương {chapter_id}: {msg}")
                continue
            content = self._decrypt_vip_content(str(content)) or content
            say_body = payload.get("sayBodyV2") or payload.get("sayBody") or ""
            chapter_intro = payload.get("chapterIntro") or ""
            content_html = self._format_chapter_content(content, say_body, chapter_intro)
            title = _resolve_title(chapter_id)
            results[str(chapter_id)] = {"title": title, "content": content_html}
        return results

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
        page = page or 1
        url = (
            "https://app.jjwxc.net/androidapi/search"
            f"?keyword={quote_plus(query)}&type=1&page={page}&token=null&searchType=1&sortMode=DESC&versionCode=133"
        )
        ctx.sleep_between_requests()
        resp = self._request_api(url, ctx)
        resp.raise_for_status()
        data = resp.json()
        items = data.get("items") if isinstance(data, dict) else []
        results = []
        if isinstance(items, list):
            for item in items:
                if not isinstance(item, dict):
                    continue
                novel_id = item.get("novelid") or ""
                results.append(
                    {
                        "title": item.get("novelname") or "",
                        "author": item.get("authorname") or "",
                        "cover": item.get("cover") or "",
                        "url": f"https://www.jjwxc.net/onebook.php?novelid={novel_id}" if novel_id else "",
                        "desc": item.get("authorname") or "",
                    }
                )
        return results, None


def get_plugin():
    return JjwxcPlugin()
