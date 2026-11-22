use std::collections::{HashMap, HashSet};

pub const NAME_PLACEHOLDER_PREFIX: &str = "__TM_NAME_";
pub const TM_TRANSLATE_BETA_MODE: &str = "tm_translate_beta";

const VI_PUNCT_REPLACEMENTS: &[(&str, &str)] = &[
    ("，", ","),
    ("、", ","),
    ("。", "."),
    ("！", "!"),
    ("？", "?"),
    ("：", ":"),
    ("；", ";"),
    ("（", "("),
    ("）", ")"),
    ("「", "“"),
    ("」", "”"),
    ("『", "“"),
    ("』", "”"),
];

/// Danh sách hậu tố chức danh/xưng hô tiếng Trung cần hạ chữ thường phần hậu tố trong gợi ý Hán-Việt,
/// đã sắp xếp giảm dần theo độ dài (bảo toàn 100% tập từ khóa của `reader_server.py`).
pub const LOWERCASE_NAME_SUFFIXES_CJK: &[&str] = &[
    "老太爷",
    "老太爺",
    "老太太",
    "老爷子",
    "老爺子",
    "老夫人",
    "研究员",
    "研究員",
    "董事长",
    "董事長",
    "副主任",
    "上人",
    "上将",
    "上將",
    "三爷",
    "三爺",
    "九爷",
    "九爺",
    "二爷",
    "二爺",
    "五爷",
    "五爺",
    "仙君",
    "伯伯",
    "侯爷",
    "侯爺",
    "先生",
    "公公",
    "公子",
    "八爷",
    "八爺",
    "六爷",
    "六爺",
    "副官",
    "前辈",
    "前輩",
    "博士",
    "夫人",
    "夫子",
    "太太",
    "太傅",
    "太后",
    "太师",
    "太師",
    "女士",
    "奶奶",
    "妹妹",
    "姐姐",
    "姑娘",
    "婕妤",
    "婆婆",
    "婶婶",
    "嬤嬤",
    "嬷嬷",
    "少主",
    "少将",
    "少將",
    "少爷",
    "少爺",
    "尚书",
    "尚書",
    "局长",
    "峰主",
    "师兄",
    "师伯",
    "师叔",
    "师妹",
    "师姐",
    "师弟",
    "师傅",
    "师父",
    "师尊",
    "師兄",
    "師伯",
    "師叔",
    "師妹",
    "師姐",
    "師弟",
    "師傅",
    "師父",
    "師尊",
    "帝君",
    "庄主",
    "总管",
    "总裁",
    "總管",
    "總裁",
    "掌柜",
    "掌櫃",
    "掌门",
    "掌門",
    "教官",
    "教授",
    "教练",
    "教練",
    "天君",
    "真人",
    "真君",
    "神医",
    "神醫",
    "组长",
    "組長",
    "经理",
    "經理",
    "老板",
    "老师",
    "老師",
    "老头",
    "老頭",
    "老大",
    "老弟",
    "营长",
    "營長",
    "董事长",
    "部长",
    "部長",
    "队长",
    "隊長",
    "阿姨",
    "院长",
    "皇后",
    "督军",
    "督軍",
    "贵妃",
    "貴妃",
    "员外",
    "員外",
    "国公",
    "國公",
    "团长",
    "團長",
    "城主",
    "大人",
    "大哥",
    "大姐",
    "大嫂",
    "大婶",
    "大师",
    "大師",
    "大帅",
    "大帥",
    "大爷",
    "大爺",
    "官人",
    "家主",
    "导演",
    "導演",
    "尊者",
    "将军",
    "將軍",
    "政委",
    "书记",
    "書記",
    "主任",
    "宗主",
    "四爷",
    "四爺",
    "七爷",
    "七爺",
    "哥哥",
    "弟弟",
    "叔叔",
    "妈妈",
    "媽媽",
    "爸爸",
    "爷爷",
    "爺爺",
    "王妃",
    "爱卿",
    "愛卿",
    "淑仪",
    "淑儀",
    "管家",
    "长官",
    "長官",
    "长老",
    "長老",
    "影后",
    "医生",
    "醫生",
    "同学",
    "同學",
    "郡主",
    "郡王",
    "哥",
    "姐",
    "妹",
    "弟",
    "叔",
    "伯",
    "姨",
    "嫂",
    "婶",
    "嬸",
    "姑",
    "婆",
    "爷",
    "爺",
    "妈",
    "媽",
    "爸",
    "总",
    "總",
    "导",
    "導",
    "董",
    "少",
    "宝",
    "寶",
    "氏",
    "家",
    "府",
    "宅",
    "派",
    "宗",
    "族",
    "队",
    "隊",
];

pub fn is_cjk_char(ch: char) -> bool {
    ('\u{3400}'..='\u{9fff}').contains(&ch)
}

pub fn contains_cjk(text: &str) -> bool {
    text.chars().any(is_cjk_char)
}

pub fn count_cjk_chars(text: &str) -> usize {
    text.chars().filter(|&ch| is_cjk_char(ch)).count()
}

pub fn is_invisible_formatting_char(ch: char) -> bool {
    ch == '\u{00AD}'
        || ('\u{200B}'..='\u{200F}').contains(&ch)
        || ('\u{202A}'..='\u{202E}').contains(&ch)
        || ('\u{2060}'..='\u{2064}').contains(&ch)
        || ('\u{2066}'..='\u{206F}').contains(&ch)
        || ch == '\u{FEFF}'
}

pub fn is_inline_space(ch: char) -> bool {
    matches!(ch, ' ' | '\t' | '\x0c' | '\x0b')
}

/// Kiểm tra ký tự thuộc nhóm từ (Letter / Number / Combining Mark) đồng nhất với `unicodedata.category(ch)[0] in {"L", "N", "M"}`.
pub fn is_wordish_char(ch: char) -> bool {
    if ch.is_alphabetic() || ch.is_numeric() {
        return true;
    }
    let u = ch as u32;
    // Combining Diacritical Marks & common Unicode Mark ranges (Mn, Mc, Me)
    (0x0300..=0x036F).contains(&u)
        || (0x1AB0..=0x1AFF).contains(&u)
        || (0x1DC0..=0x1DFF).contains(&u)
        || (0x20D0..=0x20FF).contains(&u)
        || (0xFE20..=0xFE2F).contains(&u)
}

fn should_attach_quote_left(ch: char) -> bool {
    is_wordish_char(ch) || matches!(ch, '.' | '!' | '?' | ',' | '…')
}

/// Chuẩn hóa xuống dòng theo `reader_backend/text/cleanup.py::normalize_newlines`.
pub fn normalize_newlines(text: &str) -> String {
    if text.is_empty() {
        return String::new();
    }
    let mut value = text.replace("\r\n", "\n").replace('\r', "\n");
    if value.contains("\\n") {
        value = value
            .replace("\\r\\n", "\n")
            .replace("\\n", "\n")
            .replace("\\r", "\n");
    }
    value = value.replace(['\u{2028}', '\u{2029}'], "\n");
    collapse_triple_newlines(&value).trim().to_owned()
}

fn collapse_triple_newlines(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut newline_run = 0usize;
    for ch in text.chars() {
        if ch == '\n' {
            newline_run += 1;
            if newline_run <= 2 {
                out.push('\n');
            }
        } else {
            newline_run = 0;
            out.push(ch);
        }
    }
    out
}

/// Chuẩn hóa text trước khi dịch theo `translator.py::normalize_text_for_translation`.
pub fn normalize_text_for_translation(text: &str) -> String {
    if text.is_empty() {
        return String::new();
    }
    let mut out = String::with_capacity(text.len());
    let chars: Vec<char> = text.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        let ch = chars[i];
        if ch == '\r' {
            if i + 1 < chars.len() && chars[i + 1] == '\n' {
                i += 1;
            }
            out.push('\n');
            i += 1;
            continue;
        }
        if ch == '\u{2028}' || ch == '\u{2029}' {
            out.push('\n');
            i += 1;
            continue;
        }
        if !is_invisible_formatting_char(ch) {
            out.push(ch);
        }
        i += 1;
    }
    out
}

pub fn normalize_translation_cache_source(text: &str) -> String {
    normalize_newlines(&normalize_text_for_translation(text))
}

pub fn normalize_straight_quote_pairs(text: &str) -> String {
    if text.is_empty() {
        return String::new();
    }
    let chars: Vec<char> = text.chars().collect();
    let mut result: Vec<char> = Vec::with_capacity(chars.len() + 8);
    let mut inside_quote = false;
    let mut i = 0;
    let n = chars.len();
    while i < n {
        let ch = chars[i];
        if ch != '"' {
            result.push(ch);
            i += 1;
            continue;
        }
        if !inside_quote {
            if let Some(&prev) = result.last()
                && !prev.is_whitespace()
                && !matches!(prev, '(' | '[' | '{')
            {
                result.push(' ');
            }
            result.push('"');
            i += 1;
            while i < n && is_inline_space(chars[i]) {
                i += 1;
            }
            inside_quote = true;
            continue;
        }
        while let Some(&last) = result.last() {
            if is_inline_space(last) {
                result.pop();
            } else {
                break;
            }
        }
        result.push('"');
        i += 1;
        while i < n && is_inline_space(chars[i]) {
            i += 1;
        }
        if i < n && is_wordish_char(chars[i]) {
            result.push(' ');
        }
        inside_quote = false;
    }
    result.into_iter().collect()
}

/// Chuẩn hóa kết quả dịch từ server theo `translator.py::normalize_translated_text` & `TM Translate.user.js`.
pub fn normalize_translated_text(text: &str) -> String {
    let base = normalize_text_for_translation(text);
    if base.is_empty() {
        return String::new();
    }
    // 1) re.sub(r'\\+\s*(["”“‘’])', r"\1", value)
    let chars: Vec<char> = base.chars().collect();
    let mut step1 = String::with_capacity(base.len());
    let mut i = 0;
    while i < chars.len() {
        if chars[i] == '\\' {
            let start = i;
            while i < chars.len() && chars[i] == '\\' {
                i += 1;
            }
            let mut j = i;
            while j < chars.len() && chars[j].is_whitespace() {
                j += 1;
            }
            if j < chars.len() && matches!(chars[j], '"' | '“' | '”' | '‘' | '’') {
                step1.push(chars[j]);
                i = j + 1;
                continue;
            }
            for &c in &chars[start..i] {
                step1.push(c);
            }
            continue;
        }
        step1.push(chars[i]);
        i += 1;
    }

    // 2) _normalize_straight_quote_pairs
    let step2 = normalize_straight_quote_pairs(&step1);

    // 3) re.sub(r'([:;,])([“‘])', r"\1 \2", value)
    let mut step3 = String::with_capacity(step2.len() + 8);
    let c2: Vec<char> = step2.chars().collect();
    for idx in 0..c2.len() {
        step3.push(c2[idx]);
        if matches!(c2[idx], ':' | ';' | ',')
            && idx + 1 < c2.len()
            && matches!(c2[idx + 1], '“' | '‘')
        {
            step3.push(' ');
        }
    }

    // 4) re.sub(r'(^|[\s([{:])([“‘])[ \t\f\v]+', r"\1\2", value, flags=re.MULTILINE)
    let c3: Vec<char> = step3.chars().collect();
    let mut step4 = String::with_capacity(step3.len());
    let mut k = 0;
    while k < c3.len() {
        let ch = c3[k];
        let at_eligible_boundary = k == 0 || {
            let prev = c3[k - 1];
            prev.is_whitespace() || matches!(prev, '(' | '[' | '{' | ':')
        };
        if at_eligible_boundary && matches!(ch, '“' | '‘') {
            step4.push(ch);
            k += 1;
            while k < c3.len() && is_inline_space(c3[k]) {
                k += 1;
            }
            continue;
        }
        step4.push(ch);
        k += 1;
    }

    // 5) re.sub(r'(\S)[ \t\f\v]+([”’])', ...)
    let c4: Vec<char> = step4.chars().collect();
    let mut step5 = String::with_capacity(step4.len());
    let mut m = 0;
    while m < c4.len() {
        let ch = c4[m];
        if !ch.is_whitespace() && should_attach_quote_left(ch) {
            let mut look = m + 1;
            while look < c4.len() && is_inline_space(c4[look]) {
                look += 1;
            }
            if look > m + 1 && look < c4.len() && matches!(c4[look], '”' | '’') {
                step5.push(ch);
                step5.push(c4[look]);
                m = look + 1;
                continue;
            }
        }
        step5.push(ch);
        m += 1;
    }

    // 6) re.sub(r'([”’])([^\s\n])', lambda m: f'{m.group(1)} {m.group(2)}' if _is_wordish_char(m.group(2)) else m.group(0))
    let c5: Vec<char> = step5.chars().collect();
    let mut step6 = String::with_capacity(step5.len() + 8);
    for idx in 0..c5.len() {
        step6.push(c5[idx]);
        if matches!(c5[idx], '”' | '’')
            && idx + 1 < c5.len()
            && !c5[idx + 1].is_whitespace()
            && is_wordish_char(c5[idx + 1])
        {
            step6.push(' ');
        }
    }

    // 7) Strip spaces around \n, collapse inline spaces to single space, collapse \n{3,} to \n\n
    let cleaned_lines = strip_spaces_around_newlines(&step6);
    let mut step7 = String::with_capacity(cleaned_lines.len());
    let mut in_space = false;
    for ch in cleaned_lines.chars() {
        if is_inline_space(ch) {
            if !in_space {
                step7.push(' ');
                in_space = true;
            }
        } else {
            in_space = false;
            step7.push(ch);
        }
    }
    collapse_triple_newlines(&step7).trim().to_owned()
}

fn strip_spaces_around_newlines(text: &str) -> String {
    let mut lines: Vec<&str> = text.split('\n').collect();
    let len = lines.len();
    for (idx, line) in lines.iter_mut().enumerate() {
        if idx + 1 < len {
            *line = line.trim_end_matches([' ', '\t']);
        }
        if idx > 0 {
            *line = line.trim_start_matches([' ', '\t']);
        }
    }
    lines.join("\n")
}

fn is_edge_punctuation_char(ch: char) -> bool {
    ch.is_whitespace()
        || matches!(
            ch,
            '.' | ','
                | ';'
                | ':'
                | '!'
                | '?'
                | '…'
                | '，'
                | '。'
                | '！'
                | '？'
                | '；'
                | '：'
                | '、'
                | '“'
                | '”'
                | '"'
                | '\''
                | '‘'
                | '’'
                | '('
                | ')'
                | '['
                | ']'
                | '{'
                | '}'
                | '<'
                | '>'
                | '《'
                | '》'
                | '「'
                | '」'
                | '『'
                | '』'
                | '-'
                | '—'
        )
}

/// Bỏ dấu câu/khoảng trắng ở 2 mép theo `reader_server.py::strip_edge_punctuation`.
pub fn strip_edge_punctuation(text: &str) -> String {
    if text.is_empty() {
        return String::new();
    }
    text.trim_matches(is_edge_punctuation_char)
        .trim()
        .to_owned()
}

pub fn starts_with_target_name(text: &str, target_name: &str) -> bool {
    let name = target_name.trim();
    if name.is_empty() {
        return false;
    }
    let probe = strip_edge_punctuation(text);
    if probe.is_empty() {
        return false;
    }
    probe.to_lowercase().starts_with(&name.to_lowercase())
}

pub fn source_starts_with_cjk(text: &str) -> bool {
    let trimmed = text.trim_start_matches(is_edge_punctuation_char);
    trimmed.chars().next().is_some_and(is_cjk_char)
}

pub fn contains_name_split_delimiter(text: &str) -> bool {
    text.chars().any(|ch| {
        matches!(
            ch,
            '\n' | '\r'
                | ','
                | '，'
                | '、'
                | '。'
                | '！'
                | '？'
                | '!'
                | '?'
                | '；'
                | ';'
                | '：'
                | ':'
        )
    })
}

pub fn normalize_for_compare(text: &str) -> String {
    let lower = text.trim().to_lowercase();
    if lower.is_empty() {
        return String::new();
    }
    lower
        .chars()
        .filter(|&ch| ch.is_alphabetic() || ch.is_numeric())
        .collect()
}

/// Chuẩn hóa dấu câu Trung -> Việt và khoảng trắng theo `reader_server.py::normalize_vi_punctuation`.
pub fn normalize_vi_punctuation(text: &str) -> String {
    if text.is_empty() {
        return String::new();
    }
    let mut value = text.replace("\r\n", "\n").replace('\r', "\n");
    if value.contains("\\n") {
        value = value
            .replace("\\r\\n", "\n")
            .replace("\\n", "\n")
            .replace("\\r", "\n");
    }
    value = value.replace(['\u{2028}', '\u{2029}'], "\n");
    for &(src, dst) in VI_PUNCT_REPLACEMENTS {
        value = value.replace(src, dst);
    }
    value = value.replace("……", "…");

    // 1) re.sub(r"\s+([,.;:!?…，。！？；：、])", r"\1", value)
    // 2) re.sub(r"\s+([”’)\]}>»])", r"\1", value)
    let is_punct_1 = |ch: char| {
        matches!(
            ch,
            ',' | '.'
                | ';'
                | ':'
                | '!'
                | '?'
                | '…'
                | '，'
                | '。'
                | '！'
                | '？'
                | '；'
                | '：'
                | '、'
        )
    };
    let is_closing_2 = |ch: char| matches!(ch, '”' | '’' | ')' | ']' | '}' | '>' | '»');
    let is_opening_3 = |ch: char| matches!(ch, '(' | '[' | '“' | '‘');

    let chars: Vec<char> = value.chars().collect();
    let mut s12 = String::with_capacity(value.len());
    let mut i = 0;
    while i < chars.len() {
        if chars[i].is_whitespace() {
            let start = i;
            while i < chars.len() && chars[i].is_whitespace() {
                i += 1;
            }
            if i < chars.len() && (is_punct_1(chars[i]) || is_closing_2(chars[i])) {
                continue;
            }
            for &c in &chars[start..i] {
                s12.push(c);
            }
            continue;
        }
        s12.push(chars[i]);
        i += 1;
    }

    // 3) re.sub(r"([(\[“‘])\s+", r"\1", value)
    let c12: Vec<char> = s12.chars().collect();
    let mut s3 = String::with_capacity(s12.len());
    let mut j = 0;
    while j < c12.len() {
        let ch = c12[j];
        s3.push(ch);
        j += 1;
        if is_opening_3(ch) {
            while j < c12.len() && c12[j].is_whitespace() {
                j += 1;
            }
        }
    }

    // 4) re.sub(r"([,.;:!?])(?![\s\n,.;:!?…，。！？；：、”’)\]}>»\"'])", r"\1 ", value)
    // 5) re.sub(r"(…)(?![\s\n,.;:!?…，。！？；：、”’)\]}>»\"'])", r"\1 ", value)
    let is_no_space_after = |ch: char| {
        ch.is_whitespace() || is_punct_1(ch) || is_closing_2(ch) || matches!(ch, '"' | '\'')
    };
    let c3: Vec<char> = s3.chars().collect();
    let mut s45 = String::with_capacity(s3.len() + 16);
    for idx in 0..c3.len() {
        let ch = c3[idx];
        s45.push(ch);
        if matches!(ch, ',' | '.' | ';' | ':' | '!' | '?' | '…')
            && idx + 1 < c3.len()
            && !is_no_space_after(c3[idx + 1])
        {
            s45.push(' ');
        }
    }

    // 6) Strip spaces/tabs around \n, collapse multiple ' ' to single ' ', collapse \n{3,} to \n\n
    let s6 = strip_spaces_around_newlines(&s45);
    let mut s7 = String::with_capacity(s6.len());
    let mut prev_space = false;
    for ch in s6.chars() {
        if ch == ' ' {
            if !prev_space {
                s7.push(' ');
                prev_space = true;
            }
        } else {
            prev_space = false;
            s7.push(ch);
        }
    }
    collapse_triple_newlines(&s7).trim().to_owned()
}

/// Viết hoa đầu câu tiếng Việt theo `reader_server.py::smart_capitalize_vi`.
pub fn smart_capitalize_vi(text: &str) -> String {
    if text.is_empty() {
        return String::new();
    }
    let mut value = text.replace("\r\n", "\n").replace('\r', "\n");
    if value.contains("\\n") {
        value = value
            .replace("\\r\\n", "\n")
            .replace("\\n", "\n")
            .replace("\\r", "\n");
    }
    value = value.replace(['\u{2028}', '\u{2029}'], "\n");
    if value.is_empty() {
        return value;
    }

    let is_sentence_breaker = |ch: char| {
        matches!(
            ch,
            '.' | '!' | '?' | ';' | '…' | '\n' | '。' | '！' | '？' | ':'
        )
    };
    let is_skip_when_cap = |ch: char| {
        matches!(
            ch,
            ' ' | '\t'
                | '"'
                | '\''
                | '“'
                | '”'
                | '‘'
                | '’'
                | '('
                | '['
                | '{'
                | '<'
                | '-'
                | '—'
                | '–'
                | '―'
                | '*'
                | '•'
                | '>'
                | '»'
                | '«'
        )
    };
    let is_quote_mark = |ch: char| matches!(ch, '"' | '\'' | '“' | '”' | '‘' | '’' | '«' | '»');
    let is_skip_after_quote = |ch: char| {
        matches!(
            ch,
            ' ' | '\t'
                | '\n'
                | ','
                | '.'
                | ';'
                | ':'
                | '!'
                | '?'
                | '…'
                | '，'
                | '。'
                | '！'
                | '？'
                | '；'
                | '：'
                | '、'
        )
    };

    let mut out = String::with_capacity(value.len());
    let mut cap_next = true;
    let mut cap_after_quote = false;

    for ch in value.chars() {
        if cap_next || cap_after_quote {
            if ch.is_alphabetic() {
                for u in ch.to_uppercase() {
                    out.push(u);
                }
                cap_next = false;
                cap_after_quote = false;
                continue;
            }
            if ch.is_numeric() {
                cap_next = false;
                cap_after_quote = false;
                out.push(ch);
                continue;
            }
            if cap_next && (is_skip_when_cap(ch) || ch.is_whitespace()) {
                out.push(ch);
                if is_sentence_breaker(ch) {
                    cap_next = true;
                }
                if is_quote_mark(ch) {
                    cap_after_quote = true;
                }
                continue;
            }
            if cap_after_quote && (is_skip_after_quote(ch) || ch.is_whitespace()) {
                out.push(ch);
                if is_sentence_breaker(ch) {
                    cap_next = true;
                }
                if is_quote_mark(ch) {
                    cap_after_quote = true;
                }
                continue;
            }
            cap_next = false;
            cap_after_quote = false;
        }
        out.push(ch);
        if is_sentence_breaker(ch) {
            cap_next = true;
        }
        if is_quote_mark(ch) {
            cap_after_quote = true;
        }
    }
    out.trim().to_owned()
}

pub fn normalize_vi_display_text(text: &str) -> String {
    let value = normalize_vi_punctuation(&normalize_newlines(text));
    if value.is_empty() {
        return String::new();
    }
    smart_capitalize_vi(&value)
}

pub fn capitalize_word_vi(word: &str) -> String {
    let value = word.trim();
    if value.is_empty() {
        return String::new();
    }
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return String::new();
    };
    if first.is_numeric() {
        return value.to_owned();
    }
    let mut out = String::with_capacity(value.len());
    for u in first.to_uppercase() {
        out.push(u);
    }
    for ch in chars {
        for l in ch.to_lowercase() {
            out.push(l);
        }
    }
    out
}

pub fn lowercase_word_vi(word: &str) -> String {
    let value = word.trim();
    if value.is_empty() {
        return String::new();
    }
    if value.chars().next().is_some_and(|ch| ch.is_numeric()) {
        return value.to_owned();
    }
    value.to_lowercase()
}

pub fn lowercase_first_alpha(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut done = false;
    for ch in text.chars() {
        if !done && ch.is_alphabetic() {
            for l in ch.to_lowercase() {
                out.push(l);
            }
            done = true;
        } else {
            out.push(ch);
        }
    }
    out
}

pub fn capitalize_after_quote_vi(text: &str) -> String {
    if text.is_empty() {
        return String::new();
    }
    let is_quote_mark = |ch: char| matches!(ch, '"' | '\'' | '“' | '”' | '‘' | '’' | '«' | '»');
    let is_skip_after_quote = |ch: char| {
        matches!(
            ch,
            ' ' | '\t'
                | '\n'
                | ','
                | '.'
                | ';'
                | ':'
                | '!'
                | '?'
                | '…'
                | '，'
                | '。'
                | '！'
                | '？'
                | '；'
                | '：'
                | '、'
        )
    };
    let mut out = String::with_capacity(text.len());
    let mut cap_after_quote = false;
    for ch in text.chars() {
        if cap_after_quote {
            if ch.is_alphabetic() {
                for u in ch.to_uppercase() {
                    out.push(u);
                }
                cap_after_quote = false;
                continue;
            }
            if is_skip_after_quote(ch) || ch.is_whitespace() {
                out.push(ch);
                if is_quote_mark(ch) {
                    cap_after_quote = true;
                }
                continue;
            }
            cap_after_quote = false;
        }
        out.push(ch);
        if is_quote_mark(ch) {
            cap_after_quote = true;
        }
    }
    out
}

pub fn titlecase_token_vi(token: &str) -> String {
    if token.is_empty() {
        return String::new();
    }
    let mut out = String::with_capacity(token.len());
    let mut found_first = false;
    for ch in token.chars() {
        if ch.is_alphabetic() {
            if !found_first {
                for u in ch.to_uppercase() {
                    out.push(u);
                }
                found_first = true;
            } else {
                for l in ch.to_lowercase() {
                    out.push(l);
                }
            }
        } else {
            out.push(ch);
        }
    }
    out
}

pub fn titlecase_hanviet_text(text: &str) -> String {
    let value = normalize_vi_punctuation(&normalize_newlines(text));
    if value.is_empty() {
        return String::new();
    }
    let mut out = String::with_capacity(value.len());
    let mut token = String::new();
    for ch in value.chars() {
        if ch.is_whitespace() {
            if !token.is_empty() {
                out.push_str(&titlecase_token_vi(&token));
                token.clear();
            }
            out.push(ch);
        } else {
            token.push(ch);
        }
    }
    if !token.is_empty() {
        out.push_str(&titlecase_token_vi(&token));
    }
    out.trim().to_owned()
}

pub fn extract_name_lookup_text(text: &str, keep_ascii: bool) -> String {
    let value = normalize_newlines(text);
    if value.is_empty() {
        return String::new();
    }
    let mut out = String::new();
    for ch in value.chars() {
        if is_cjk_char(ch) || (keep_ascii && ch.is_ascii_alphanumeric()) {
            out.push(ch);
        }
    }
    out.trim().to_owned()
}

/// Format gợi ý Hán-Việt có hạ chữ thường hậu tố chức danh/xưng hô theo `reader_server.py::format_name_hanviet_suggestion`.
pub fn format_name_hanviet_suggestion(source_text: &str, hv_text: &str) -> String {
    let source_cjk = extract_name_lookup_text(source_text, false);
    let hv_norm = titlecase_hanviet_text(hv_text);
    if source_cjk.is_empty() || hv_norm.is_empty() {
        return hv_norm;
    }
    let words: Vec<&str> = hv_norm
        .split_whitespace()
        .filter(|w| !w.is_empty())
        .collect();
    if words.is_empty() {
        return hv_norm;
    }
    let source_char_len = source_cjk.chars().count();
    for &suffix in LOWERCASE_NAME_SUFFIXES_CJK {
        if !source_cjk.ends_with(suffix) {
            continue;
        }
        let suffix_len = extract_name_lookup_text(suffix, false).chars().count();
        if suffix_len == 0 || words.len() < suffix_len {
            continue;
        }
        if source_char_len <= suffix_len || words.len() <= suffix_len {
            return words
                .iter()
                .map(|w| lowercase_word_vi(w))
                .collect::<Vec<_>>()
                .join(" ")
                .trim()
                .to_owned();
        }
        let split_at = words.len() - suffix_len;
        let mut formatted: Vec<String> = words[..split_at].iter().map(|&w| w.to_owned()).collect();
        for &w in &words[split_at..] {
            formatted.push(lowercase_word_vi(w));
        }
        return formatted.join(" ").trim().to_owned();
    }
    hv_norm
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub struct HvIncrementalSuggestion {
    pub source_text: String,
    pub han_viet: String,
}

/// Xây dựng danh sách gợi ý Hán-Việt viết hoa tăng dần theo `reader_server.py::build_incremental_hv_suggestions`.
pub fn build_incremental_hv_suggestions(
    source_text: &str,
    hv_text: &str,
) -> Vec<HvIncrementalSuggestion> {
    let source_raw = normalize_newlines(source_text);
    let hv_raw = normalize_newlines(hv_text);
    if source_raw.is_empty() || hv_raw.is_empty() {
        return Vec::new();
    }
    let source_cjk: String = source_raw.chars().filter(|&ch| is_cjk_char(ch)).collect();
    let formatted_base = format_name_hanviet_suggestion(&source_cjk, &hv_raw);
    let base_for_words = if formatted_base.is_empty() {
        &hv_raw
    } else {
        &formatted_base
    };
    let hv_words_raw: Vec<&str> = base_for_words
        .split_whitespace()
        .filter(|x| !x.is_empty())
        .collect();
    if source_cjk.is_empty() || hv_words_raw.is_empty() {
        return Vec::new();
    }
    let hv_words: Vec<String> = hv_words_raw.iter().map(|w| lowercase_word_vi(w)).collect();
    let mut lock_lower_from = hv_words.len();
    for (idx, &word) in hv_words_raw.iter().enumerate() {
        if titlecase_token_vi(word) != word {
            lock_lower_from = idx;
            break;
        }
    }

    let mut variants = Vec::with_capacity(lock_lower_from + 1);
    variants.push(hv_words.join(" ").trim().to_owned());
    for idx in 0..lock_lower_from {
        let mut row_words = Vec::with_capacity(hv_words.len());
        for (w_idx, w) in hv_words.iter().enumerate() {
            if w_idx <= idx {
                row_words.push(capitalize_word_vi(w));
            } else {
                row_words.push(lowercase_word_vi(w));
            }
        }
        variants.push(row_words.join(" ").trim().to_owned());
    }

    let mut seen = HashSet::new();
    let mut out = Vec::new();
    for v in variants {
        let key = v.trim().to_owned();
        if key.is_empty() || !seen.insert(key.clone()) {
            continue;
        }
        out.push(HvIncrementalSuggestion {
            source_text: source_cjk.clone(),
            han_viet: key,
        });
    }
    out
}

pub fn build_hanviet_from_map(chinese_text: &str, hanviet_map: &HashMap<String, String>) -> String {
    if hanviet_map.is_empty() || chinese_text.is_empty() {
        return String::new();
    }
    let mut buf = String::new();
    let mut pieces = Vec::new();
    for ch in chinese_text.chars() {
        buf.clear();
        buf.push(ch);
        let mapped = hanviet_map
            .get(&buf)
            .map(|s| s.split('/').next().unwrap_or(s.as_str()))
            .unwrap_or(&buf);
        pieces.push(mapped.to_owned());
    }
    pieces.join(" ")
}

pub fn split_multi_translation_values(raw_value: &str) -> Vec<String> {
    let value = normalize_newlines(raw_value);
    if value.is_empty() {
        return Vec::new();
    }
    let mut out = Vec::new();
    let mut seen = HashSet::new();
    for part in value.split(['\\', '/', '|']) {
        let item = part.trim();
        if item.is_empty() {
            continue;
        }
        let key = normalize_for_compare(item);
        if key.is_empty() || !seen.insert(key) {
            continue;
        }
        out.push(item.to_owned());
    }
    out
}

pub fn pick_primary_translation_value(raw_value: &str) -> String {
    let values = split_multi_translation_values(raw_value);
    if let Some(first) = values.into_iter().next() {
        return first;
    }
    normalize_newlines(raw_value)
}

pub fn split_space_edges(text: &str) -> (&str, &str, &str) {
    if text.is_empty() {
        return ("", "", "");
    }
    let trimmed_start = text.trim_start();
    let left_len = text.len() - trimmed_start.len();
    let core = trimmed_start.trim_end();
    let right_len = trimmed_start.len() - core.len();
    let left = &text[..left_len];
    let right = &text[text.len() - right_len..];
    (left, core, right)
}

pub fn needs_server_translation(text: &str) -> bool {
    if text.is_empty() {
        return false;
    }
    contains_cjk(text) || text.contains(NAME_PLACEHOLDER_PREFIX)
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum CacheTokenKind {
    #[serde(rename = "text")]
    Text,
    #[serde(rename = "sep")]
    Sep,
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub struct TextUnitWithOffset {
    pub unit_index: usize,
    pub text: String,
    /// Offset theo chỉ số ký tự Unicode (`char` index) để khớp 100% với Python `len(token)`.
    pub start: usize,
    pub end: usize,
}

/// Tách văn bản thành các cụm dịch theo xuống dòng và dấu câu (`。！？!?；;：:，,、`)
/// bảo toàn 100% hành vi của `reader_server.py::split_text_for_translation_cache`.
pub fn split_text_for_translation_cache(text: &str) -> Vec<(CacheTokenKind, String)> {
    if text.is_empty() {
        return Vec::new();
    }
    let is_split_punct = |ch: char| {
        matches!(
            ch,
            '。' | '！' | '？' | '!' | '?' | '；' | ';' | '：' | ':' | '，' | ',' | '、'
        )
    };
    let mut out = Vec::new();
    let chars: Vec<char> = text.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        if chars[i] == '\n' {
            let start = i;
            while i < chars.len() && chars[i] == '\n' {
                i += 1;
            }
            let sep: String = chars[start..i].iter().collect();
            out.push((CacheTokenKind::Sep, sep));
            continue;
        }
        let mut buf = String::new();
        while i < chars.len() && chars[i] != '\n' {
            let ch = chars[i];
            buf.push(ch);
            i += 1;
            if is_split_punct(ch) && !buf.is_empty() {
                out.push((CacheTokenKind::Text, std::mem::take(&mut buf)));
            }
        }
        if !buf.is_empty() {
            out.push((CacheTokenKind::Text, buf));
        }
    }
    out
}

pub fn build_text_units_with_offsets(text: &str) -> Vec<TextUnitWithOffset> {
    if text.is_empty() {
        return Vec::new();
    }
    let tokens = split_text_for_translation_cache(text);
    let mut out = Vec::new();
    let mut cursor = 0usize;
    let mut unit_index = 0usize;
    for (kind, token) in tokens {
        let token_len = token.chars().count();
        if kind == CacheTokenKind::Text {
            out.push(TextUnitWithOffset {
                unit_index,
                text: token,
                start: cursor,
                end: cursor + token_len,
            });
            unit_index += 1;
        }
        cursor += token_len;
    }
    out
}

fn is_punctuation_char(ch: char) -> bool {
    ch.is_ascii_punctuation()
        || matches!(
            ch,
            '，' | '。'
                | '！'
                | '？'
                | '；'
                | '：'
                | '、'
                | '…'
                | '⋯'
                | '︙'
                | '“'
                | '”'
                | '‘'
                | '’'
                | '„'
                | '‟'
                | '‚'
                | '‛'
                | '「'
                | '」'
                | '『'
                | '』'
                | '《'
                | '》'
                | '〈'
                | '〉'
                | '（'
                | '）'
                | '【'
                | '】'
                | '〔'
                | '〕'
                | '［'
                | '］'
                | '〖'
                | '〗'
                | '〘'
                | '〙'
                | '〚'
                | '〛'
                | '｛'
                | '｝'
                | '—'
                | '–'
                | '―'
                | '－'
                | '‐'
                | '‑'
                | '‒'
                | '﹘'
                | '·'
                | '・'
                | '•'
                | '‧'
                | '∙'
                | '⋅'
                | '～'
                | '／'
                | '＼'
                | '｜'
                | '«'
                | '»'
                | '‹'
                | '›'
                | '､'
                | '｡'
                | '．'
                | '﹐'
                | '﹑'
                | '﹒'
                | '﹔'
                | '﹕'
                | '﹖'
                | '﹗'
                | '﹙'
                | '﹚'
                | '﹛'
                | '﹜'
                | '﹝'
                | '﹞'
                | '︵'
                | '︶'
                | '︷'
                | '︸'
                | '︹'
                | '︺'
                | '︻'
                | '︼'
                | '︽'
                | '︾'
                | '︿'
                | '﹀'
                | '﹁'
                | '﹂'
                | '﹃'
                | '﹄'
                | '︐'
                | '〝'
                | '〞'
                | '＂'
                | '＇'
        )
}

/// Mirror `reader_server.py::tokenize_tm_translate_text`: tách token `text` và `special`
/// mà không cắt ở dấu câu (`L`, `N`, `M`, `P` và khoảng trắng được gom vào `text`).
pub fn tokenize_tm_translate_text(text: &str) -> Vec<(String, String)> {
    let value = normalize_text_for_translation(text);
    if value.is_empty() {
        return Vec::new();
    }
    let mut tokens: Vec<(String, String)> = Vec::new();
    let mut buffer = String::new();
    let mut buffer_kind = "";

    for ch in value.chars() {
        let is_special = !ch.is_whitespace() && !is_wordish_char(ch) && !is_punctuation_char(ch);
        let kind = if is_special { "special" } else { "text" };
        if !buffer_kind.is_empty() && kind != buffer_kind {
            tokens.push((buffer_kind.to_owned(), std::mem::take(&mut buffer)));
        }
        buffer_kind = kind;
        buffer.push(ch);
    }
    if !buffer.is_empty() {
        tokens.push((buffer_kind.to_owned(), buffer));
    }

    let mut merged: Vec<(String, String)> = Vec::new();
    for (kind, token) in tokens {
        if kind == "text"
            && let Some(last) = merged.last_mut()
            && last.0 == "text"
        {
            last.1.push_str(&token);
            continue;
        }
        merged.push((kind, token));
    }
    merged
}

/// Mirror `reader_server.py::capitalize_tm_translate_text`.
pub fn capitalize_tm_translate_text(text: &str) -> String {
    let value = normalize_translated_text(text);
    if value.is_empty() {
        return String::new();
    }
    let mut output = String::with_capacity(value.len());
    let mut should_capitalize = true;
    for ch in value.chars() {
        if should_capitalize {
            if ch.is_whitespace() || matches!(ch, '"' | '\'' | '“' | '‘' | '(' | '[') {
                output.push(ch);
                continue;
            }
            if ch.is_alphabetic() {
                for u in ch.to_uppercase() {
                    output.push(u);
                }
                should_capitalize = false;
                continue;
            }
            output.push(ch);
            should_capitalize = matches!(ch, '.' | '?' | '!' | '…' | ':');
            continue;
        }
        output.push(ch);
        if matches!(ch, '.' | '?' | '!' | '…' | ':') {
            should_capitalize = true;
        }
    }
    output
}

/// Cắt đoạn trích ngữ cảnh theo chỉ số ký tự (`char` offset) giống `reader_server.py::_text_snippet`.
pub fn text_snippet(text: &str, start: isize, end: isize, radius: usize) -> String {
    if text.is_empty() {
        return String::new();
    }
    let chars: Vec<char> = text.chars().collect();
    let len = chars.len();
    let s = (start - radius as isize).max(0) as usize;
    let e = ((end + radius as isize).max(0) as usize).min(len);
    if s >= e || s >= len {
        return String::new();
    }
    let slice: String = chars[s..e].iter().collect();
    slice.trim().to_owned()
}

pub fn slice_chars(text: &str, start: usize, end: usize) -> String {
    if start >= end || text.is_empty() {
        return String::new();
    }
    text.chars().skip(start).take(end - start).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    use serde::Deserialize;
    use serde_json::json;
    use std::collections::BTreeMap;

    #[test]
    fn normalizes_vi_punctuation_and_smart_capitalization() {
        let raw = "“xin chào ，tôi là tiêu viêm ！”  hắn nói……\n\n\n“thật sao ？” 123 người đáp.";
        let punct = normalize_vi_punctuation(raw);
        assert_eq!(
            punct,
            "“xin chào, tôi là tiêu viêm!” hắn nói…\n\n“thật sao?” 123 người đáp."
        );
        let display = smart_capitalize_vi(&punct);
        assert_eq!(
            display,
            "“Xin chào, tôi là tiêu viêm!” Hắn nói…\n\n“Thật sao?” 123 người đáp."
        );
    }

    #[test]
    fn formats_hanviet_name_suffix_and_incremental_suggestions() {
        let formatted = format_name_hanviet_suggestion("萧炎少爷", "tiêu viêm thiếu gia");
        assert_eq!(formatted, "Tiêu Viêm thiếu gia");

        let rows = build_incremental_hv_suggestions("萧炎少爷", "tiêu viêm thiếu gia");
        let hv_list: Vec<&str> = rows.iter().map(|r| r.han_viet.as_str()).collect();
        assert_eq!(
            hv_list,
            vec![
                "tiêu viêm thiếu gia",
                "Tiêu viêm thiếu gia",
                "Tiêu Viêm thiếu gia",
            ]
        );
    }

    #[test]
    fn splits_translation_units_with_exact_unicode_char_offsets() {
        let text = "第1章 教官，你好！\n再见。";
        let units = build_text_units_with_offsets(text);
        assert_eq!(units.len(), 3);
        assert_eq!(units[0].text, "第1章 教官，");
        assert_eq!(units[0].start, 0);
        assert_eq!(units[0].end, 7);
        assert_eq!(units[1].text, "你好！");
        assert_eq!(units[1].start, 7);
        assert_eq!(units[1].end, 10);
        assert_eq!(units[2].text, "再见。");
        assert_eq!(units[2].start, 11);
        assert_eq!(units[2].end, 14);
    }

    #[test]
    fn parity_with_python_reader_server_and_translator() {
        let script = r#"
import ast, hashlib, html, json, pathlib, re, sys, unicodedata

root = pathlib.Path(sys.argv[1])
sys.path.insert(0, str(root))

from reader_backend.text import cleanup as text_cleanup_support

# Load pure functions from app/core/translator.py without requiring requests
tr_src = (root / "app" / "core" / "translator.py").read_text(encoding="utf-8")
tr_tree = ast.parse(tr_src)
tr_keep = [n for n in tr_tree.body if not (isinstance(n, ast.Import) and any(a.name == "requests" for a in n.names))]
tr_mod = {"re": re, "json": json, "time": __import__("time"), "unicodedata": unicodedata}
exec(compile(ast.Module(body=tr_keep, type_ignores=[]), "translator.py", "exec"), tr_mod)

class FakeTranslatorLogic:
    pass
tl = FakeTranslatorLogic()
for k, v in tr_mod.items():
    setattr(tl, k, v)

# Extract pure functions & constants from reader_server.py (lines 515..2627)
rs_lines = (root / "reader_server.py").read_text(encoding="utf-8").splitlines()
rs_subset = "\n".join(rs_lines[514:2627])
rs_env = {
    "Any": object,
    "re": re,
    "html": html,
    "json": json,
    "hashlib": hashlib,
    "unicodedata": unicodedata,
    "normalize_newlines": text_cleanup_support.normalize_newlines,
    "translator_logic": tl,
    "vbook_local_translate": None,
}
exec(compile(rs_subset, "reader_server_subset.py", "exec"), rs_env)

req = json.load(sys.stdin)
out = {}
out["vi_punct"] = [rs_env["normalize_vi_punctuation"](s) for s in req["vi_samples"]]
out["smart_cap"] = [rs_env["smart_capitalize_vi"](rs_env["normalize_vi_punctuation"](s)) for s in req["vi_samples"]]
out["norm_trans"] = [tr_mod["normalize_translated_text"](s) for s in req["trans_samples"]]
out["hv_format"] = [rs_env["format_name_hanviet_suggestion"](zh, hv) for zh, hv in req["hv_samples"]]
out["hv_inc"] = [rs_env["build_incremental_hv_suggestions"](zh, hv) for zh, hv in req["hv_samples"]]
out["units"] = rs_env["build_text_units_with_offsets"](req["unit_sample"])
processed, pmap, hits = rs_env["apply_name_placeholders"](req["name_sample"], req["name_set"])
restored = rs_env["restore_name_placeholders"](processed, pmap)
out["name_hits"] = hits
out["name_restored"] = restored
out["tm_beta_pred"] = rs_env["tm_beta_predict_name_source"](
    req["beta_raw"], req["beta_trans"], req["beta_start"], req["beta_end"], req["beta_hv"], req["name_set"]
)
out["sel_map"] = rs_env["map_selection_to_name_source"](
    raw_text=req["sel_raw"],
    translated_text=req["sel_trans"],
    selected_text=req["sel_text"],
    start_offset=req["sel_start"],
    end_offset=req["sel_end"],
    name_set=req["name_set"],
    unit_map=req["sel_unit_map"],
    token_map=[],
    translation_mode="server",
    hanviet_map=None,
)
print(json.dumps(out, ensure_ascii=False))
"#;

        let vi_samples = vec![
            "“xin chào ，tôi là tiêu viêm ！”  hắn nói……\n\n\n“thật sao ？” 123 người đáp.",
            "chương 28: giáo quan... không, dị giáo đồ giáng lâm! (thượng)",
            "「ngươi dám ！」 — hắn hét lớn ，rồi lao tới.",
        ];
        let trans_samples = vec![
            r#"\\ "Xin chào đạo hữu"  , hắn mỉm cười nói: “ đi thôi ! ”"#,
            "Hắn nói \"không sao đâu\" rồi quay lưng.\r\n\r\n\r\nĐoạn kế tiếp\u{200B}\u{FEFF}.",
        ];
        let hv_samples = vec![
            ("萧炎少爷", "tiêu viêm thiếu gia"),
            ("韩立长老", "hàn lập trưởng lão"),
            ("云岚宗", "vân lam tông"),
            ("太上老君", "thái thượng lão quân"),
        ];
        let unit_sample = "第1章 教官，你好！\n\n再见；朋友：走吧。";
        let name_sample = "沈庄园里的沈庄与萧炎看向云岚宗。";
        let name_set = BTreeMap::from([
            ("沈庄".to_owned(), "Thẩm Trang".to_owned()),
            ("沈庄园".to_owned(), "Thẩm trang viên".to_owned()),
            ("萧炎".to_owned(), "Tiêu Viêm".to_owned()),
            ("云岚宗".to_owned(), "Vân Lam Tông".to_owned()),
        ]);

        let beta_raw = "沈庄走进云乡酒店，看向白修。";
        let beta_trans = "Thẩm Trang bước vào khách sạn Vân Hương, nhìn về phía Bạch Tu.";
        let beta_byte = beta_trans.find("Bạch Tu").unwrap();
        let beta_start = beta_trans[..beta_byte].chars().count();
        let beta_end = beta_start + "Bạch Tu".chars().count();
        let beta_hv = HashMap::from([
            ("沈".to_owned(), "thẩm".to_owned()),
            ("庄".to_owned(), "trang".to_owned()),
            ("走".to_owned(), "tẩu".to_owned()),
            ("进".to_owned(), "tiến".to_owned()),
            ("云".to_owned(), "vân".to_owned()),
            ("乡".to_owned(), "hương".to_owned()),
            ("酒".to_owned(), "tửu".to_owned()),
            ("店".to_owned(), "điếm".to_owned()),
            ("看".to_owned(), "khán".to_owned()),
            ("向".to_owned(), "hướng".to_owned()),
            ("白".to_owned(), "bạch".to_owned()),
            ("修".to_owned(), "tu".to_owned()),
        ]);

        let sel_raw = "萧炎与韩立在云岚宗相遇。";
        let sel_trans = "Tiêu Viêm cùng Hàn Lập tại Vân Lam Tông gặp nhau.";
        let gap_byte = sel_trans.find("cùng Hàn Lập tại").unwrap();
        let sel_start = sel_trans[..gap_byte].chars().count() as isize;
        let sel_end = sel_start + "cùng Hàn Lập tại".chars().count() as isize;
        let sel_unit_map = vec![crate::translate::pipeline::TranslationUnitMapRow {
            unit_index: 0,
            source_text: sel_raw.into(),
            processed_source_text: sel_raw.into(),
            target_placeholder_text: sel_trans.into(),
            target_text: sel_trans.into(),
            source_start: 0,
            source_end: sel_raw.chars().count(),
            target_start: 0,
            target_end: sel_trans.chars().count(),
            name_hits: vec![
                crate::translate::name_set::NameHit {
                    start: 0,
                    end: 2,
                    source: "萧炎".into(),
                    target: "Tiêu Viêm".into(),
                },
                crate::translate::name_set::NameHit {
                    start: 6,
                    end: 9,
                    source: "云岚宗".into(),
                    target: "Vân Lam Tông".into(),
                },
            ],
        }];

        let root_dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .expect("rename_chapters root");
        let req = json!({
            "vi_samples": vi_samples,
            "trans_samples": trans_samples,
            "hv_samples": hv_samples,
            "unit_sample": unit_sample,
            "name_sample": name_sample,
            "name_set": name_set,
            "beta_raw": beta_raw,
            "beta_trans": beta_trans,
            "beta_start": beta_start,
            "beta_end": beta_end,
            "beta_hv": beta_hv,
            "sel_raw": sel_raw,
            "sel_trans": sel_trans,
            "sel_text": "cùng Hàn Lập tại",
            "sel_start": sel_start,
            "sel_end": sel_end,
            "sel_unit_map": sel_unit_map,
        });

        #[derive(Deserialize)]
        struct PyOracleOutput {
            vi_punct: Vec<String>,
            smart_cap: Vec<String>,
            norm_trans: Vec<String>,
            hv_format: Vec<String>,
            hv_inc: Vec<Vec<HvIncrementalSuggestion>>,
            units: Vec<TextUnitWithOffset>,
            name_hits: Vec<crate::translate::name_set::NameHit>,
            name_restored: String,
            tm_beta_pred: serde_json::Value,
            sel_map: crate::translate::selection::SelectionNameMapResult,
        }

        let input_bytes = serde_json::to_vec(&req).unwrap();
        let out_bytes = crate::python::run(
            script,
            &[root_dir.as_os_str().to_owned()],
            Some(&input_bytes),
            None,
        )
        .expect("run python parity oracle");
        let py: PyOracleOutput = serde_json::from_slice(&out_bytes).unwrap();

        for (i, sample) in vi_samples.iter().enumerate() {
            let rust_punct = normalize_vi_punctuation(sample);
            assert_eq!(rust_punct, py.vi_punct[i], "vi_punct mismatch at {i}");
            let rust_cap = smart_capitalize_vi(&rust_punct);
            assert_eq!(rust_cap, py.smart_cap[i], "smart_cap mismatch at {i}");
        }
        for (i, sample) in trans_samples.iter().enumerate() {
            let rust_norm = normalize_translated_text(sample);
            assert_eq!(rust_norm, py.norm_trans[i], "norm_trans mismatch at {i}");
        }
        for (i, (zh, hv)) in hv_samples.iter().enumerate() {
            assert_eq!(
                format_name_hanviet_suggestion(zh, hv),
                py.hv_format[i],
                "hv_format mismatch at {i}"
            );
            assert_eq!(
                build_incremental_hv_suggestions(zh, hv),
                py.hv_inc[i],
                "hv_inc mismatch at {i}"
            );
        }
        assert_eq!(build_text_units_with_offsets(unit_sample), py.units);

        let (processed, pmap, hits) =
            crate::translate::name_set::apply_name_placeholders(name_sample, &name_set);
        let restored = crate::translate::name_set::restore_name_placeholders(&processed, &pmap);
        assert_eq!(hits, py.name_hits);
        assert_eq!(restored, py.name_restored);

        let rust_beta = crate::translate::selection::tm_beta_predict_name_source(
            beta_raw,
            beta_trans,
            beta_start,
            beta_end,
            Some(&beta_hv),
            &name_set,
        );
        assert_eq!(
            rust_beta.source,
            py.tm_beta_pred["source"].as_str().unwrap_or("")
        );
        assert_eq!(
            rust_beta.target,
            py.tm_beta_pred["target"].as_str().unwrap_or("")
        );
        assert_eq!(
            rust_beta.method,
            py.tm_beta_pred["method"].as_str().unwrap_or("")
        );

        let rust_sel = crate::translate::selection::map_selection_to_name_source(
            sel_raw,
            sel_trans,
            "cùng Hàn Lập tại",
            sel_start,
            sel_end,
            &name_set,
            &sel_unit_map,
            &[],
            "server",
            None,
        );
        assert_eq!(rust_sel, py.sel_map);
    }
}
