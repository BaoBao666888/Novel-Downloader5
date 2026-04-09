from __future__ import annotations

import re
import time
from typing import Any


_CJK_ONLY_RE = re.compile(r"^[\u3400-\u9fff]+$")
_ELLIPSIS_MULTI_RE = re.compile(r"\.{3,}|…{2,}")

_TITLE_SUFFIX_RE = re.compile(
    r"([\u3400-\u9fff]{1,6}(?:师兄|師兄|师姐|師姐|师父|師父|师尊|師尊|师叔|師叔|师伯|師伯|师弟|師弟|师妹|師妹|长老|長老|掌门|掌門|宗主|老祖|真人|真君|尊者|帝君|天君|小姐|公子|少爷|少爺|姑娘|夫人|先生|女士|教官|教练|教練|同学|同學|老师|老師|前辈|前輩|道友|博士|大师|大師|营长|營長|长官|長官|夫子|神医|神醫|队长|隊長|经理|經理|老板|部长|部長|尚书|尚書|导演|導演|研究员|研究員|董事长|董事長|教授|影后|医生|醫生|师傅|師傅|团长|團長|政委|书记|書記|副官|副主任|主任|皇后|太后|郡主|郡王|总管|總管|国公|國公|公公|婕妤|淑仪|淑儀|督军|督軍|仙君|峰主|大帅|大帥|贵妃|貴妃|太傅|太师|太師|上人|城主|组长|組長|管家|上将|上將|少将|少將|侯爷|侯爺|王妃|员外|員外|官人|爱卿|愛卿|老爷子|老爺子|老太太|老太爷|老太爺|老夫人|老头|老頭|奶奶|婆婆|嬷嬷|嬤嬤))"
)
_SPEECH_RE = re.compile(
    r"([\u3400-\u9fff]{2,6}?)(?:轻声|低声|沉声|冷声|柔声|平静地|淡淡地|直接|突然|缓缓|开口|说道|说着|说|說道|說著|說|问道|问|問道|問|答道|答|笑道|笑着说|笑著說|冷笑|怒道|喝道|喊道|叫道|应道|應道|道)"
)
_INTRO_RE = re.compile(r"(?:名叫|名为|叫做|自称|化名为|化名為)([\u3400-\u9fff]{2,6})")
_ATTN_RE = re.compile(r"(?:对着|對著|看向|望向|朝着|朝著|冲着|衝著|望着|望著|盯着|盯著|看着|看著)([\u3400-\u9fff]{2,6})")
_PLACE_CONTEXT_RE = re.compile(
    r"(?:在|于|於|到|回到|来到|來到|前往|赶往|趕往|进入|進入|离开|離開|来自|來自|住在|坐镇|坐鎮|镇守|鎮守|赶到|趕到)([\u3400-\u9fff]{1,5}(?:城|镇|鎮|村|山|江|河|湖|海|谷|峰|宫|宮|殿|府|州|郡|国|國|界|境|岛|島|关|關|堡|园|園|苑|台|臺|京|都))"
)
_CLAN_SUFFIX_RE = re.compile(r"([\u3400-\u9fff]{1,4}(?:氏|家))")
_CALL_RE = re.compile(
    r"([\u3400-\u9fff]{1,4}(?:哥|姐|妹|弟|叔|伯|姨|嫂|婶|嬸|姑|婆|大爷|大爺|二爷|二爺|三爷|三爺|四爷|四爺|五爷|五爺|六爷|六爺|七爷|七爺|八爷|八爺|九爷|九爺|妈|媽|爸|总|總|导|導|董|少|老师|老師|先生|姑娘|小姐|夫人|公子|掌柜|掌櫃|前辈|前輩|大人|老大|总裁|總裁|少主|家主|阿姨|叔叔|伯伯|姐姐|哥哥|弟弟|妹妹|爷爷|爺爺|奶奶|婆婆|嬷嬷|嬤嬤|妈妈|媽媽|爸爸|太太|老头|老頭|老爷子|老爺子|老太太|老夫人|宝|寶|女士|大哥|大姐|大嫂|大婶|老弟))"
)
_ORG_SUFFIX_RE = re.compile(r"([\u3400-\u9fff]{1,6}(?:府|宅|派|宗|族|队|隊|国|國|城|镇|鎮))")

_PATTERN_RULES: tuple[dict[str, Any], ...] = (
    {"origin": "thoai", "entity_type": "person", "pattern": _SPEECH_RE, "capture": 1},
    {"origin": "xung_ho", "entity_type": "title", "pattern": _TITLE_SUFFIX_RE, "capture": 1},
    {"origin": "gioi_thieu", "entity_type": "person", "pattern": _INTRO_RE, "capture": 1},
    {"origin": "chu_y", "entity_type": "person", "pattern": _ATTN_RE, "capture": 1},
    {"origin": "dia_danh", "entity_type": "place", "pattern": _PLACE_CONTEXT_RE, "capture": 1},
    {"origin": "thế_lực", "entity_type": "place", "pattern": _ORG_SUFFIX_RE, "capture": 1},
    {"origin": "tộc_thị", "entity_type": "title", "pattern": _CLAN_SUFFIX_RE, "capture": 1},
    {"origin": "tên_gọi", "entity_type": "title", "pattern": _CALL_RE, "capture": 1},
)

_PATTERN_LABELS = {
    "thoai": "Thoại",
    "xung_ho": "Xưng hô",
    "gioi_thieu": "Giới thiệu",
    "chu_y": "Ngữ cảnh",
    "dia_danh": "Địa danh",
    "thế_lực": "Thế lực",
    "tộc_thị": "Tộc thị",
    "tên_gọi": "Tên gọi",
}

_PATTERN_WEIGHTS = {
    "thoai": 5,
    "xung_ho": 4,
    "gioi_thieu": 6,
    "chu_y": 2,
    "dia_danh": 5,
    "thế_lực": 5,
    "tộc_thị": 5,
    "tên_gọi": 5,
}

_ENTITY_LABELS = {
    "person": "Người",
    "place": "Địa danh",
    "title": "Tên gọi",
}

_COMMON_NAME_PREFIX_BLACKLIST = {
    "我",
    "你",
    "他",
    "她",
    "它",
    "这",
    "那",
    "其",
    "此",
    "该",
    "某",
    "每",
    "谁",
    "誰",
    "我们",
    "你们",
    "他们",
    "她们",
    "它们",
    "自己",
    "大家",
    "自家",
    "人家",
}

_COMMON_MODIFIER_PREFIXES = {"至", "最", "很", "不", "太", "真", "更", "越", "稍", "略", "还", "還"}

_COMMON_PHRASE_BLACKLIST = {
    "至少",
    "最少",
    "不少",
    "多少",
    "很少",
    "年少",
    "回家",
    "大家",
    "自家",
    "人家",
    "全家",
    "一家",
    "在家",
    "离家",
    "離家",
    "成家",
    "兄弟",
}

_TRAILING_DESCRIPTIVE_SUFFIXES = (
    "平静地",
    "淡淡地",
    "轻声",
    "低声",
    "沉声",
    "冷声",
    "柔声",
    "淡淡",
    "轻轻",
    "缓缓",
    "突然",
    "直接",
    "开口",
    "冷笑",
)

_STOPWORDS = {
    "自己",
    "我们",
    "你们",
    "他们",
    "她们",
    "它们",
    "不是",
    "什么",
    "一个",
    "两个",
    "这个",
    "那个",
    "时候",
    "现在",
    "現在",
    "今天",
    "明天",
    "此时",
    "此時",
    "已经",
    "可以",
    "怎么",
    "这么",
    "那么",
    "一下",
    "一起",
    "这里",
    "那里",
    "如果",
    "因为",
    "所以",
    "只是",
    "对于",
    "不过",
    "然后",
    "就是",
    "东西",
    "事情",
    "地方",
    "问题",
    "情况",
    "声音",
    "目光",
    "身影",
    "脸色",
    "心中",
    "体内",
    "四周",
    "周围",
    "此刻",
    "之前",
    "之后",
    "里面",
    "外面",
    "突然",
    "果然",
    "毕竟",
    "竟然",
    "终于",
    "依旧",
    "连忙",
    "顿时",
    "立刻",
    "缓缓",
    "轻轻",
    "慢慢",
    "冷冷",
    "淡淡",
    "平静",
    "微微",
    "哈哈",
    "呵呵",
    "难道",
    "大概",
    "应该",
    "或者",
    "虽然",
    "然而",
    "然后",
    "看来",
    "只见",
    "再次",
    "还有",
    "没有",
    "不能",
    "不会",
    "不会吧",
    "一下子",
    "与此同时",
    "谁知",
    "誰知",
    "至少",
}

_INVALID_EDGE_CHARS = set("的一了着过嗎吗呢啊呀吧么之其并且而且如果因为所以但是然后于是")
_INVALID_TRAILING_NAME_CHARS = {"说", "說", "道", "问", "問", "答", "看", "望", "叫", "喊", "笑", "知"}


def _parse_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    raw = str(value or "").strip().lower()
    if not raw:
        return default
    if raw in {"1", "true", "yes", "on"}:
        return True
    if raw in {"0", "false", "no", "off"}:
        return False
    return default


def _parse_int(value: Any, default: int, minimum: int, maximum: int) -> int:
    try:
        parsed = int(value)
    except Exception:
        parsed = default
    return max(minimum, min(maximum, parsed))


def normalize_name_filter_request(payload: dict[str, Any] | None) -> dict[str, Any]:
    body = payload if isinstance(payload, dict) else {}
    scope = str(body.get("scope") or "downloaded").strip().lower() or "downloaded"
    if scope not in {"downloaded", "first_n", "range"}:
        scope = "downloaded"
    min_length = _parse_int(body.get("min_length"), 2, 1, 8)
    request = {
        "scope": scope,
        "first_n": _parse_int(body.get("first_n"), 20, 1, 999999),
        "start_order": _parse_int(body.get("start_order"), 1, 1, 999999),
        "end_order": _parse_int(body.get("end_order"), 20, 1, 999999),
        "min_count": _parse_int(body.get("min_count"), 5, 1, 20),
        "min_length": min_length,
        "max_length": _parse_int(body.get("max_length"), 4, min_length, 12),
        "max_chapters": _parse_int(body.get("max_chapters"), 80, 1, 500),
        "max_items": _parse_int(body.get("max_items"), 120, 1, 500),
        "skip_existing": _parse_bool(body.get("skip_existing"), True),
        "include_person": _parse_bool(body.get("include_person"), True),
        "include_place": _parse_bool(body.get("include_place"), True),
        "include_title": _parse_bool(body.get("include_title"), True),
    }
    if request["end_order"] < request["start_order"]:
        request["end_order"] = request["start_order"]
    if not (request["include_person"] or request["include_place"] or request["include_title"]):
        request["include_person"] = True
        request["include_place"] = True
        request["include_title"] = True
    return request


def _collect_allowed_entity_types(request: dict[str, Any]) -> set[str]:
    allowed: set[str] = set()
    if bool(request.get("include_person")):
        allowed.add("person")
    if bool(request.get("include_place")):
        allowed.add("place")
    if bool(request.get("include_title")):
        allowed.add("title")
    if not allowed:
        allowed.update({"person", "place", "title"})
    return allowed


def _normalize_text(text: str, *, normalize_newlines) -> str:
    value = normalize_newlines(text or "").strip()
    if not value:
        return ""
    return _ELLIPSIS_MULTI_RE.sub("…", value)


def _looks_like_common_phrase(value: str) -> bool:
    text = str(value or "").strip()
    if not text:
        return True
    if text in _COMMON_PHRASE_BLACKLIST:
        return True
    if any(token in text for token in {"宗", "派", "族", "府", "宅", "国", "國", "城", "镇", "鎮", "队", "隊"}) and text[-1] in {"哥", "姐", "妹", "弟", "叔", "伯", "姨", "嫂", "婶", "嬸", "姑", "婆", "爷", "爺", "妈", "媽", "爸", "总", "總"}:
        return True
    if text.startswith(("诸位", "諸位", "各位")):
        return True
    if text.startswith(("和", "与", "與", "跟")) and text[-1] in {"家", "哥", "姐", "弟", "叔", "伯", "姨", "人"}:
        return True
    if len(text) <= 3 and text[:1] in _COMMON_MODIFIER_PREFIXES:
        return True
    for prefix in _COMMON_NAME_PREFIX_BLACKLIST:
        if text.startswith(prefix) and len(text) <= (len(prefix) + 2):
            return True
    return False


def _cleanup_candidate_text(text: str) -> str:
    value = str(text or "").strip()
    if not value:
        return ""
    changed = True
    while changed and value:
        changed = False
        for suffix in _TRAILING_DESCRIPTIVE_SUFFIXES:
            if value.endswith(suffix) and len(value) > len(suffix):
                value = value[: -len(suffix)].strip()
                changed = True
                break
    return value


def _is_valid_candidate(text: str, *, min_length: int, max_length: int) -> bool:
    value = str(text or "").strip()
    if not value:
        return False
    if not _CJK_ONLY_RE.fullmatch(value):
        return False
    if len(value) < min_length or len(value) > max_length:
        return False
    if value in _STOPWORDS:
        return False
    if _looks_like_common_phrase(value):
        return False
    if value[0] in _INVALID_EDGE_CHARS or value[-1] in _INVALID_EDGE_CHARS:
        return False
    if value[-1] in _INVALID_TRAILING_NAME_CHARS:
        return False
    if len(set(value)) == 1:
        return False
    return True


def _build_context_snippet(text: str, start: int, end: int, *, radius: int = 18) -> str:
    value = str(text or "")
    if not value:
        return ""
    left = max(0, start - radius)
    right = min(len(value), end + radius)
    snippet = value[left:right].strip()
    if left > 0:
        snippet = f"…{snippet}"
    if right < len(value):
        snippet = f"{snippet}…"
    return snippet


def _candidate_stat() -> dict[str, Any]:
    return {
        "count": 0,
        "chapters": set(),
        "origins": {},
        "types": {},
        "contexts": [],
        "seen_contexts": set(),
        "first_order": 0,
    }


def _add_candidate(
    bucket: dict[str, dict[str, Any]],
    source: str,
    *,
    chapter_order: int,
    origin: str,
    entity_type: str,
    context: str,
    min_length: int,
    max_length: int,
) -> None:
    candidate = _cleanup_candidate_text(source)
    if not _is_valid_candidate(
        candidate,
        min_length=min_length,
        max_length=max_length,
    ):
        return
    row = bucket.setdefault(candidate, _candidate_stat())
    row["count"] = int(row.get("count") or 0) + 1
    row["chapters"].add(int(chapter_order or 0))
    origins = row.get("origins") or {}
    origins[origin] = int(origins.get(origin) or 0) + 1
    row["origins"] = origins
    types = row.get("types") or {}
    types[entity_type] = int(types.get(entity_type) or 0) + 1
    row["types"] = types
    if not row.get("first_order"):
        row["first_order"] = int(chapter_order or 0)
    snippet = str(context or "").strip()
    if snippet and snippet not in row["seen_contexts"] and len(row["contexts"]) < 3:
        row["seen_contexts"].add(snippet)
        row["contexts"].append(snippet)


def _scan_text_candidates(
    text: str,
    *,
    chapter_order: int,
    min_length: int,
    max_length: int,
    allowed_entity_types: set[str],
    normalize_newlines,
) -> dict[str, dict[str, Any]]:
    rows: dict[str, dict[str, Any]] = {}
    normalized = _normalize_text(text, normalize_newlines=normalize_newlines)
    if not normalized:
        return rows
    for paragraph in [line.strip() for line in normalized.split("\n") if line.strip()]:
        for rule in _PATTERN_RULES:
            entity_type = str(rule.get("entity_type") or "").strip()
            if entity_type not in allowed_entity_types:
                continue
            pattern = rule.get("pattern")
            capture = int(rule.get("capture") or 1)
            if pattern is None:
                continue
            for match in pattern.finditer(paragraph):
                try:
                    source = str(match.group(capture) or "").strip()
                except Exception:
                    source = ""
                if not source:
                    continue
                context = _build_context_snippet(paragraph, match.start(capture), match.end(capture))
                _add_candidate(
                    rows,
                    source,
                    chapter_order=chapter_order,
                    origin=str(rule.get("origin") or "").strip(),
                    entity_type=entity_type,
                    context=context,
                    min_length=min_length,
                    max_length=max_length,
                )
    return rows


def _merge_scan_rows(
    merged: dict[str, dict[str, Any]],
    current: dict[str, dict[str, Any]],
) -> None:
    for source, item in current.items():
        row = merged.setdefault(source, _candidate_stat())
        row["count"] = int(row.get("count") or 0) + int(item.get("count") or 0)
        row["chapters"].update(item.get("chapters") or set())
        if not row.get("first_order"):
            row["first_order"] = int(item.get("first_order") or 0)
        origins = row.get("origins") or {}
        for key, value in (item.get("origins") or {}).items():
            origins[key] = int(origins.get(key) or 0) + int(value or 0)
        row["origins"] = origins
        types = row.get("types") or {}
        for key, value in (item.get("types") or {}).items():
            types[key] = int(types.get(key) or 0) + int(value or 0)
        row["types"] = types
        for snippet in item.get("contexts") or []:
            if snippet and snippet not in row["seen_contexts"] and len(row["contexts"]) < 3:
                row["seen_contexts"].add(snippet)
                row["contexts"].append(snippet)


def _choose_target_suggestion(
    source: str,
    *,
    hv_text: str,
    active_name_set: dict[str, str],
    active_vp_set: dict[str, str],
    global_name: dict[str, str],
    global_vp: dict[str, str],
    local_bundle: Any,
    build_name_right_suggestions,
) -> tuple[str, str]:
    source_key = str(source or "").strip()
    if not source_key:
        return "", ""
    rows = build_name_right_suggestions(
        source_key,
        hv_text=hv_text,
        personal_name=active_name_set,
        personal_vp=active_vp_set,
        global_name=global_name,
        global_vp=global_vp,
        bundle=local_bundle,
        prefer_kind="name",
        prefer_scope="book",
    )
    for row in rows:
        row_source = str(row.get("source_text") or "").strip()
        row_target = str(row.get("target_text") or "").strip()
        if row_source == source_key and row_target:
            return row_target, str(row.get("origin") or "").strip()
    return hv_text, "Hán Việt" if hv_text else ""


def _choose_target_suggestion_exact(
    source: str,
    *,
    hv_text: str,
    active_name_set: dict[str, str],
    active_vp_set: dict[str, str],
    global_name: dict[str, str],
    global_vp: dict[str, str],
    bundle_name_general: dict[str, str],
    bundle_vp_general: dict[str, str],
    bundle_name_extra: dict[str, str],
    bundle_vp_genre: dict[str, str],
) -> tuple[str, str]:
    source_key = str(source or "").strip()
    if not source_key:
        return "", ""
    for mapping, origin in (
        (active_name_set, "Name riêng"),
        (active_vp_set, "VP riêng"),
        (global_name, "Name chung"),
        (global_vp, "VP chung"),
        (bundle_name_general, "Name base"),
        (bundle_vp_general, "VP base"),
        (bundle_name_extra, "Name extra"),
        (bundle_vp_genre, "VP thể loại"),
    ):
        target = str((mapping or {}).get(source_key) or "").strip()
        if target:
            return target, origin
    return hv_text, "Hán Việt" if hv_text else ""


def _confidence_score(item: dict[str, Any], *, has_dict_target: bool) -> int:
    count = int(item.get("count") or 0)
    chapter_hits = len(item.get("chapters") or [])
    origin_score = 0
    for origin, value in (item.get("origins") or {}).items():
        origin_score += int(value or 0) * int(_PATTERN_WEIGHTS.get(origin, 1))
    score = (count * 10) + (chapter_hits * 8) + origin_score + (16 if has_dict_target else 0)
    return max(20, min(99, score))


def _list_origin_labels(origins: dict[str, Any], dict_origin: str) -> list[str]:
    labels: list[str] = []
    for key, _value in sorted((origins or {}).items(), key=lambda row: (-int(row[1] or 0), str(row[0]))):
        label = _PATTERN_LABELS.get(str(key or "").strip(), str(key or "").strip())
        if label and label not in labels:
            labels.append(label)
    if dict_origin and dict_origin not in labels:
        labels.append(dict_origin)
    return labels


def _primary_entity_type(item: dict[str, Any]) -> str:
    types = dict(item.get("types") or {})
    if not types:
        return "person"
    picked = sorted(types.items(), key=lambda row: (-int(row[1] or 0), str(row[0])))[0][0]
    return str(picked or "person")


def _build_context(
    service,
    book_id: str,
    request: dict[str, Any],
    *,
    api_error_cls,
    http_status,
    normalize_name_set,
    vbook_local_translate,
) -> dict[str, Any]:
    bid = str(book_id or "").strip()
    if not bid:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Thiếu book_id.")
    book = service.storage.find_book(bid)
    if not book:
        raise api_error_cls(http_status.NOT_FOUND, "NOT_FOUND", "Không tìm thấy truyện.")
    if bool(book.get("is_comic")):
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Truyện tranh chưa hỗ trợ lọc name.")

    chapter_rows = service.storage.get_chapter_rows(bid)
    if not chapter_rows:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Truyện chưa có chương để quét.")
    download_map = service.storage.get_book_download_map(bid)
    downloaded_rows = [
        row for row in chapter_rows
        if bool(download_map.get(str(row.get("chapter_id") or "").strip()))
    ]
    if not downloaded_rows:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Cần tải ít nhất 1 chương RAW để lọc name.")

    scope = str(request.get("scope") or "downloaded").strip().lower() or "downloaded"
    if scope == "range":
        start_order = int(request.get("start_order") or 1)
        end_order = int(request.get("end_order") or start_order)
        selected_rows = [
            row for row in downloaded_rows
            if start_order <= int(row.get("chapter_order") or 0) <= end_order
        ]
    elif scope == "first_n":
        selected_rows = downloaded_rows[: int(request.get("first_n") or len(downloaded_rows))]
    else:
        selected_rows = downloaded_rows
    selected_rows = selected_rows[: int(request.get("max_chapters") or len(selected_rows) or 1)]
    if not selected_rows:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Không có chương RAW hợp lệ theo phạm vi đã chọn.")

    default_sets = service._default_name_sets()
    _, active_name_set, _ = service.storage.get_active_name_set(
        default_sets=default_sets,
        active_default=service._default_active_name_set(default_sets),
        book_id=bid,
    )
    active_name_set = normalize_name_set(active_name_set)
    active_vp_set, _ = service.storage.get_book_vp_set(bid)
    active_vp_set = normalize_name_set(active_vp_set)
    global_dicts = service.get_local_global_dicts()
    global_name = normalize_name_set((global_dicts or {}).get("name") or {})
    global_vp = normalize_name_set((global_dicts or {}).get("vp") or {})
    try:
        local_bundle = vbook_local_translate.get_public_bundle(service.translator._local_settings())
    except Exception:
        local_bundle = None
    bundle_name_general = normalize_name_set(getattr(local_bundle, "name_general", {})) if local_bundle is not None else {}
    bundle_vp_general = normalize_name_set(getattr(local_bundle, "vp_general", {})) if local_bundle is not None else {}
    bundle_name_extra = normalize_name_set(getattr(local_bundle, "name_extra", {})) if local_bundle is not None else {}
    bundle_vp_genre = normalize_name_set(getattr(local_bundle, "vp_genre", {})) if local_bundle is not None else {}

    return {
        "book_id": bid,
        "book": book,
        "request": request,
        "chapter_rows": chapter_rows,
        "downloaded_rows": downloaded_rows,
        "selected_rows": selected_rows,
        "active_name_set": active_name_set,
        "active_vp_set": active_vp_set,
        "global_name": global_name,
        "global_vp": global_vp,
        "local_bundle": local_bundle,
        "bundle_name_general": bundle_name_general,
        "bundle_vp_general": bundle_vp_general,
        "bundle_name_extra": bundle_name_extra,
        "bundle_vp_genre": bundle_vp_genre,
        "allowed_entity_types": _collect_allowed_entity_types(request),
    }


def build_book_name_filter_context(
    service,
    book_id: str,
    payload: dict[str, Any] | None,
    *,
    api_error_cls,
    http_status,
    normalize_name_set,
    vbook_local_translate,
) -> dict[str, Any]:
    request = normalize_name_filter_request(payload)
    return _build_context(
        service,
        book_id,
        request,
        api_error_cls=api_error_cls,
        http_status=http_status,
        normalize_name_set=normalize_name_set,
        vbook_local_translate=vbook_local_translate,
    )


def _build_items_from_merged(
    service,
    merged: dict[str, dict[str, Any]],
    context: dict[str, Any],
    *,
    build_name_right_suggestions,
    max_items: int | None = None,
    suggestion_cache: dict[str, dict[str, str]] | None = None,
) -> list[dict[str, Any]]:
    request = dict(context.get("request") or {})
    active_name_set = dict(context.get("active_name_set") or {})
    active_vp_set = dict(context.get("active_vp_set") or {})
    global_name = dict(context.get("global_name") or {})
    global_vp = dict(context.get("global_vp") or {})
    bundle_name_general = dict(context.get("bundle_name_general") or {})
    bundle_vp_general = dict(context.get("bundle_vp_general") or {})
    bundle_name_extra = dict(context.get("bundle_name_extra") or {})
    bundle_vp_genre = dict(context.get("bundle_vp_genre") or {})
    min_count = int(request.get("min_count") or 5)
    skip_existing = bool(request.get("skip_existing"))
    limit = int(max_items if max_items is not None else (request.get("max_items") or 120))
    formatter = getattr(service, "format_name_hanviet_suggestion", None)
    cache = suggestion_cache if isinstance(suggestion_cache, dict) else {}

    items: list[dict[str, Any]] = []
    for source, item in merged.items():
        count = int(item.get("count") or 0)
        if count < min_count:
            continue
        existing_target = str(active_name_set.get(source) or "").strip()
        if skip_existing and existing_target:
            continue
        entity_type_key = _primary_entity_type(item)
        cached = cache.get(source)
        if cached is None:
            if callable(formatter):
                hv_text = str(formatter(source, single_line=True) or "").strip()
            else:
                hv_text = str(service._author_hanviet_display(source, single_line=True) or "").strip()
            suggested_target, dict_origin = _choose_target_suggestion_exact(
                source,
                hv_text=hv_text,
                active_name_set=active_name_set,
                active_vp_set=active_vp_set,
                global_name=global_name,
                global_vp=global_vp,
                bundle_name_general=bundle_name_general,
                bundle_vp_general=bundle_vp_general,
                bundle_name_extra=bundle_name_extra,
                bundle_vp_genre=bundle_vp_genre,
            )
            cached = {
                "hv_text": hv_text,
                "suggested_target": suggested_target,
                "dict_origin": dict_origin,
            }
            cache[source] = cached
        hv_text = str(cached.get("hv_text") or "").strip()
        suggested_target = str(cached.get("suggested_target") or "").strip()
        dict_origin = str(cached.get("dict_origin") or "").strip()
        has_dict_target = bool(dict_origin and dict_origin not in {"Hán Việt", "Name Trung"})
        confidence = _confidence_score(item, has_dict_target=has_dict_target)
        items.append(
            {
                "selected": True,
                "source": source,
                "target_suggested": suggested_target or hv_text or source,
                "han_viet": hv_text,
                "entity_type": _ENTITY_LABELS.get(entity_type_key, "Người"),
                "count": count,
                "chapter_hits": int(len(item.get("chapters") or [])),
                "confidence": confidence,
                "origins": _list_origin_labels(item.get("origins") or {}, dict_origin),
                "sample_contexts": list(item.get("contexts") or []),
                "existing_target": existing_target,
                "first_chapter_order": int(item.get("first_order") or 0),
            }
        )

    items.sort(
        key=lambda row: (
            -int(row.get("confidence") or 0),
            -int(row.get("count") or 0),
            -int(row.get("chapter_hits") or 0),
            int(row.get("first_chapter_order") or 0),
            str(row.get("source") or ""),
        )
    )
    return items[:limit]


def run_book_name_filter_with_context(
    service,
    context: dict[str, Any],
    *,
    api_error_cls,
    http_status,
    normalize_newlines,
    build_name_right_suggestions,
    progress_callback=None,
) -> dict[str, Any]:
    request = dict(context.get("request") or {})

    merged: dict[str, dict[str, Any]] = {}
    scanned_rows = 0
    cjk_rows = 0
    selected_rows = list(context.get("selected_rows") or [])
    downloaded_rows = list(context.get("downloaded_rows") or [])
    chapter_rows = list(context.get("chapter_rows") or [])
    total_rows = len(selected_rows)
    stream_progress = callable(progress_callback)
    suggestion_cache: dict[str, dict[str, str]] = {}
    last_live_items: list[dict[str, Any]] = []
    last_live_build_at = 0.0
    if total_rows <= 12:
        live_rebuild_every = 1
    elif total_rows <= 40:
        live_rebuild_every = 2
    elif total_rows <= 120:
        live_rebuild_every = 4
    else:
        live_rebuild_every = 6

    if stream_progress:
        progress_callback(
            {
                "processed_chapters": 0,
                "total_chapters": total_rows,
                "downloaded_chapters": len(downloaded_rows),
                "chapter_total": len(chapter_rows),
                "found_candidates": 0,
                "items": [],
            }
        )

    for idx, chapter in enumerate(selected_rows, start=1):
        chapter_order = int(chapter.get("chapter_order") or 0)
        raw_key = str(chapter.get("raw_key") or "").strip()
        raw_text = service.storage.read_cache(raw_key) or "" if raw_key else ""
        merged_dirty = False
        if raw_text:
            scanned_rows += 1
            if service._contains_cjk_text(raw_text):
                cjk_rows += 1
                current = _scan_text_candidates(
                    raw_text,
                    chapter_order=chapter_order,
                    min_length=int(request.get("min_length") or 2),
                    max_length=int(request.get("max_length") or 4),
                    allowed_entity_types=set(context.get("allowed_entity_types") or {"person", "place", "title"}),
                    normalize_newlines=normalize_newlines,
                )
                _merge_scan_rows(merged, current)
                merged_dirty = bool(current)
        if stream_progress:
            now = time.perf_counter()
            should_rebuild_live = False
            if merged and not last_live_items:
                should_rebuild_live = True
            elif idx >= total_rows:
                should_rebuild_live = True
            elif merged_dirty and ((idx % live_rebuild_every) == 0 or (now - last_live_build_at) >= 0.45):
                should_rebuild_live = True
            if should_rebuild_live:
                last_live_items = _build_items_from_merged(
                    service,
                    merged,
                    context,
                    build_name_right_suggestions=build_name_right_suggestions,
                    max_items=min(int(request.get("max_items") or 120), 80),
                    suggestion_cache=suggestion_cache,
                )
                last_live_build_at = now
            progress_callback(
                {
                    "processed_chapters": idx,
                    "total_chapters": total_rows,
                    "downloaded_chapters": len(downloaded_rows),
                    "chapter_total": len(chapter_rows),
                    "scanned_chapters": scanned_rows,
                    "chapters_with_cjk": cjk_rows,
                    "current_chapter_order": chapter_order,
                    "current_chapter_title": str(chapter.get("title_vi") or chapter.get("title_raw") or "").strip(),
                    "found_candidates": len(last_live_items),
                    "items": last_live_items,
                }
            )

    if scanned_rows <= 0:
        raise api_error_cls(http_status.BAD_REQUEST, "BAD_REQUEST", "Không đọc được nội dung RAW để quét name.")

    items = _build_items_from_merged(
        service,
        merged,
        context,
        build_name_right_suggestions=build_name_right_suggestions,
        suggestion_cache=suggestion_cache,
    )
    return {
        "ok": True,
        "book_id": str(context.get("book_id") or ""),
        "scope": str(request.get("scope") or "downloaded"),
        "scanned_chapters": int(scanned_rows),
        "chapters_with_cjk": int(cjk_rows),
        "downloaded_chapters": int(len(downloaded_rows)),
        "selected_chapters": int(len(selected_rows)),
        "chapter_total": int(len(chapter_rows)),
        "items": items,
        "filters": {
            "min_count": int(request.get("min_count") or 5),
            "min_length": int(request.get("min_length") or 2),
            "max_length": int(request.get("max_length") or 4),
            "max_chapters": int(request.get("max_chapters") or 80),
            "max_items": int(request.get("max_items") or 120),
            "skip_existing": bool(request.get("skip_existing")),
            "include_person": bool(request.get("include_person")),
            "include_place": bool(request.get("include_place")),
            "include_title": bool(request.get("include_title")),
        },
    }


def run_book_name_filter(
    service,
    book_id: str,
    payload: dict[str, Any] | None,
    *,
    api_error_cls,
    http_status,
    normalize_newlines,
    build_name_right_suggestions,
    normalize_name_set,
    vbook_local_translate,
    progress_callback=None,
) -> dict[str, Any]:
    context = build_book_name_filter_context(
        service,
        book_id,
        payload,
        api_error_cls=api_error_cls,
        http_status=http_status,
        normalize_name_set=normalize_name_set,
        vbook_local_translate=vbook_local_translate,
    )
    return run_book_name_filter_with_context(
        service,
        context,
        api_error_cls=api_error_cls,
        http_status=http_status,
        normalize_newlines=normalize_newlines,
        build_name_right_suggestions=build_name_right_suggestions,
        progress_callback=progress_callback,
    )


def preview_book_name_filter(
    service,
    book_id: str,
    payload: dict[str, Any] | None,
    *,
    api_error_cls,
    http_status,
    normalize_newlines,
    build_name_right_suggestions,
    normalize_name_set,
    vbook_local_translate,
) -> dict[str, Any]:
    return run_book_name_filter(
        service,
        book_id,
        payload,
        api_error_cls=api_error_cls,
        http_status=http_status,
        normalize_newlines=normalize_newlines,
        build_name_right_suggestions=build_name_right_suggestions,
        normalize_name_set=normalize_name_set,
        vbook_local_translate=vbook_local_translate,
        progress_callback=None,
    )
