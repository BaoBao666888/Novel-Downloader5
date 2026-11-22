use std::collections::{BTreeMap, HashMap, HashSet};

use serde::{Deserialize, Serialize};

use crate::translate::text::{
    NAME_PLACEHOLDER_PREFIX, contains_name_split_delimiter, extract_name_lookup_text,
    format_name_hanviet_suggestion, normalize_for_compare, normalize_newlines,
    split_multi_translation_values,
};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NameHit {
    /// Chỉ số ký tự Unicode (`char` index) trong văn bản nguồn.
    pub start: usize,
    pub end: usize,
    pub source: String,
    pub target: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct PlaceholderEntry {
    pub placeholder: String,
    pub source: String,
    pub target: String,
}

pub fn normalize_name_set(raw: &BTreeMap<String, String>) -> BTreeMap<String, String> {
    let mut output = BTreeMap::new();
    for (k, v) in raw {
        let key = k.trim();
        let val = v.trim();
        if !key.is_empty() && !val.is_empty() {
            output.insert(key.to_owned(), val.to_owned());
        }
    }
    output
}

pub fn normalize_name_sets_collection(
    raw: &BTreeMap<String, BTreeMap<String, String>>,
) -> BTreeMap<String, BTreeMap<String, String>> {
    let mut cleaned = BTreeMap::new();
    for (raw_name, set_data) in raw {
        let set_name = if raw_name.trim().is_empty() {
            "Mặc định".to_owned()
        } else {
            raw_name.trim().to_owned()
        };
        cleaned.insert(set_name, normalize_name_set(set_data));
    }
    if cleaned.is_empty() {
        cleaned.insert("Mặc định".to_owned(), BTreeMap::new());
    }
    cleaned
}

/// Tìm toàn bộ các vị trí khớp Name riêng theo thuật toán ưu tiên từ khóa dài nhất trước (`longest-first`)
/// và không chồng lấn, bảo toàn 100% `reader_server.py::collect_name_hits` (offset theo `char`).
pub fn collect_name_hits(text: &str, name_set: &BTreeMap<String, String>) -> Vec<NameHit> {
    if text.is_empty() || name_set.is_empty() {
        return Vec::new();
    }
    let clean = normalize_name_set(name_set);
    if clean.is_empty() {
        return Vec::new();
    }
    let text_chars: Vec<char> = text.chars().collect();
    let total_chars = text_chars.len();

    let mut keys: Vec<(String, Vec<char>, String)> = clean
        .into_iter()
        .map(|(k, v)| {
            let k_chars: Vec<char> = k.chars().collect();
            (k, k_chars, v)
        })
        .filter(|(_, kc, _)| !kc.is_empty() && kc.len() <= total_chars)
        .collect();

    // Sắp xếp từ dài xuống ngắn; nếu bằng độ dài thì giữ thứ tự từ điển ổn định.
    keys.sort_by(|a, b| b.1.len().cmp(&a.1.len()).then_with(|| a.0.cmp(&b.0)));

    let mut used = vec![false; total_chars];
    let mut hits = Vec::new();

    for (key_str, key_chars, target) in keys {
        let klen = key_chars.len();
        let mut idx = 0usize;
        while idx + klen <= total_chars {
            if text_chars[idx..idx + klen] == key_chars[..] {
                let end = idx + klen;
                if !used[idx..end].iter().any(|&u| u) {
                    for flag in &mut used[idx..end] {
                        *flag = true;
                    }
                    hits.push(NameHit {
                        start: idx,
                        end,
                        source: key_str.clone(),
                        target: target.clone(),
                    });
                }
            }
            idx += 1;
        }
    }

    hits.sort_by(|a, b| {
        a.start
            .cmp(&b.start)
            .then_with(|| b.source.chars().count().cmp(&a.source.chars().count()))
    });
    hits
}

/// Thay thế các từ khóa Name riêng bằng `__TM_NAME_{i}__` theo thứ tự giảm dần độ dài từ khóa.
/// Bảo toàn 100% hành vi của `reader_server.py::apply_name_placeholders`.
pub fn apply_name_placeholders(
    text: &str,
    name_set: &BTreeMap<String, String>,
) -> (String, BTreeMap<String, PlaceholderEntry>, Vec<NameHit>) {
    if text.is_empty() {
        return (String::new(), BTreeMap::new(), Vec::new());
    }
    let clean = normalize_name_set(name_set);
    if clean.is_empty() {
        return (text.to_owned(), BTreeMap::new(), Vec::new());
    }

    let mut keys: Vec<String> = clean.keys().cloned().collect();
    keys.sort_by(|a, b| {
        b.chars()
            .count()
            .cmp(&a.chars().count())
            .then_with(|| a.cmp(b))
    });

    let mut placeholder_by_name: HashMap<String, String> = HashMap::new();
    let mut placeholder_map: BTreeMap<String, PlaceholderEntry> = BTreeMap::new();
    let mut output = text.to_owned();

    for key in keys {
        if !output.contains(&key) {
            continue;
        }
        let placeholder = if let Some(existing) = placeholder_by_name.get(&key) {
            existing.clone()
        } else {
            let ph = format!("{NAME_PLACEHOLDER_PREFIX}{}__", placeholder_map.len());
            placeholder_by_name.insert(key.clone(), ph.clone());
            placeholder_map.insert(
                ph.clone(),
                PlaceholderEntry {
                    placeholder: ph.clone(),
                    source: key.clone(),
                    target: clean.get(&key).cloned().unwrap_or_default(),
                },
            );
            ph
        };
        output = output.replace(&key, &placeholder);
    }

    let hits = collect_name_hits(text, &clean);
    (output, placeholder_map, hits)
}

/// Khôi phục placeholder `__TM_NAME_{i}__` về tên đích tiếng Việt,
/// tự động chèn 1 khoảng trắng giữa 2 placeholder liền kề (`__TM_NAME_0____TM_NAME_1__`)
/// theo đúng `reader_server.py::restore_name_placeholders`.
pub fn restore_name_placeholders(
    text: &str,
    placeholder_map: &BTreeMap<String, PlaceholderEntry>,
) -> String {
    if text.is_empty() || placeholder_map.is_empty() {
        return text.to_owned();
    }
    let mut result = insert_space_between_adjacent_placeholders(text);

    // Thay thế từ placeholder dài nhất xuống ngắn nhất để `__TM_NAME_10__` không bị ảnh hưởng.
    let mut entries: Vec<(&String, &PlaceholderEntry)> = placeholder_map.iter().collect();
    entries.sort_by(|a, b| b.0.len().cmp(&a.0.len()).then_with(|| a.0.cmp(b.0)));

    for (ph, data) in entries {
        if result.contains(ph.as_str()) {
            result = result.replace(ph.as_str(), &data.target);
        }
    }

    // Dọn khoảng trắng thừa quanh dấu câu như restore_name_placeholders trong Python:
    // result = re.sub(r"\s+([,.;!?\)]|”|’|:)", r"\1", result)
    // result = re.sub(r"([\(\[“‘])\s+", r"\1", result)
    // result = re.sub(r"\s{2,}", " ", result)
    let is_close = |ch: char| matches!(ch, ',' | '.' | ';' | '!' | '?' | ')' | '”' | '’' | ':');
    let is_open = |ch: char| matches!(ch, '(' | '[' | '“' | '‘');

    let chars: Vec<char> = result.chars().collect();
    let mut s1 = String::with_capacity(result.len());
    let mut i = 0;
    while i < chars.len() {
        if chars[i].is_whitespace() {
            let start = i;
            while i < chars.len() && chars[i].is_whitespace() {
                i += 1;
            }
            if i < chars.len() && is_close(chars[i]) {
                continue;
            }
            for &c in &chars[start..i] {
                s1.push(c);
            }
            continue;
        }
        s1.push(chars[i]);
        i += 1;
    }

    let c1: Vec<char> = s1.chars().collect();
    let mut s2 = String::with_capacity(s1.len());
    let mut j = 0;
    while j < c1.len() {
        let ch = c1[j];
        s2.push(ch);
        j += 1;
        if is_open(ch) {
            while j < c1.len() && c1[j].is_whitespace() {
                j += 1;
            }
        }
    }

    let mut s3 = String::with_capacity(s2.len());
    let mut ws_run = 0usize;
    for ch in s2.chars() {
        if ch.is_whitespace() {
            ws_run += 1;
            if ws_run == 1 {
                s3.push(if ws_run == 1 && ch == '\n' { '\n' } else { ch });
            } else if ws_run == 2 {
                // Nếu có >= 2 whitespace liên tiếp thì gom về 1 dấu cách `' '` như `re.sub(r"\s{2,}", " ", result)`
                if let Some(last) = s3.pop() {
                    let _ = last;
                }
                s3.push(' ');
            }
        } else {
            ws_run = 0;
            s3.push(ch);
        }
    }
    s3.trim().to_owned()
}

fn insert_space_between_adjacent_placeholders(text: &str) -> String {
    if !text.contains(NAME_PLACEHOLDER_PREFIX) {
        return text.to_owned();
    }
    let mut out = String::with_capacity(text.len() + 8);
    let mut rest = text;
    while let Some(pos) = rest.find(NAME_PLACEHOLDER_PREFIX) {
        out.push_str(&rest[..pos]);
        let after_prefix = &rest[pos + NAME_PLACEHOLDER_PREFIX.len()..];
        let digits_len = after_prefix
            .bytes()
            .take_while(|b| b.is_ascii_digit())
            .count();
        if digits_len > 0 && after_prefix[digits_len..].starts_with("__") {
            let token_len = NAME_PLACEHOLDER_PREFIX.len() + digits_len + 2;
            out.push_str(&rest[pos..pos + token_len]);
            rest = &rest[pos + token_len..];
            if let Some(next_after) = rest.strip_prefix(NAME_PLACEHOLDER_PREFIX) {
                let next_digits = next_after
                    .bytes()
                    .take_while(|b| b.is_ascii_digit())
                    .count();
                if next_digits > 0 && next_after[next_digits..].starts_with("__") {
                    out.push(' ');
                }
            }
        } else {
            out.push_str(NAME_PLACEHOLDER_PREFIX);
            rest = after_prefix;
        }
    }
    out.push_str(rest);
    out
}

/// Phân tích văn bản Name set dạng `중문=Việt` (bỏ dòng trống, BOM và dòng `#` comment)
/// tương thích với `reader_ui/js/name_set_text.js::parseNameSetText` và `TM Translate.user.js`.
pub fn parse_name_set_text(raw: &str) -> BTreeMap<String, String> {
    let text = raw.strip_prefix('\u{FEFF}').unwrap_or(raw);
    let mut entries = BTreeMap::new();
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        let Some((left, right)) = trimmed.split_once('=') else {
            continue;
        };
        let source = left.trim();
        let target = right.trim();
        if !source.is_empty()
            && !target.is_empty()
            && !contains_name_split_delimiter(source)
            && !contains_name_split_delimiter(target)
        {
            entries.insert(source.to_owned(), target.to_owned());
        }
    }
    entries
}

pub fn serialize_name_set_text(entries: &BTreeMap<String, String>) -> String {
    let mut lines = Vec::with_capacity(entries.len());
    for (raw_source, raw_target) in entries {
        let source = raw_source.trim();
        let target = raw_target.trim();
        if !source.is_empty() && !target.is_empty() {
            lines.push(format!("{source}={target}"));
        }
    }
    lines.join("\n")
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NameRightSuggestion {
    pub index: usize,
    pub source_text: String,
    pub target_text: String,
    pub origin: String,
    pub score: i32,
}

#[derive(Debug, Default, Clone)]
pub struct NameSuggestionDicts {
    pub personal_name: BTreeMap<String, String>,
    pub personal_vp: BTreeMap<String, String>,
    pub global_name: BTreeMap<String, String>,
    pub global_vp: BTreeMap<String, String>,
}

fn collect_dict_suggestion_rows(
    source_key: &str,
    mapping: &BTreeMap<String, String>,
    origin: &str,
    base_score: i32,
    display_source_text: &str,
    allow_subsegments: bool,
) -> Vec<NameRightSuggestion> {
    if source_key.is_empty() || mapping.is_empty() {
        return Vec::new();
    }
    let mut rows = Vec::new();
    let mut seen_pairs: HashSet<(String, String)> = HashSet::new();
    let source_norm = extract_name_lookup_text(source_key, true);
    let mut normalized_mapping: HashMap<String, Vec<(String, String)>> = HashMap::new();
    for (raw_key, raw_val) in mapping {
        let norm_key = extract_name_lookup_text(raw_key, true);
        if norm_key.is_empty() {
            continue;
        }
        normalized_mapping
            .entry(norm_key)
            .or_default()
            .push((raw_key.clone(), raw_val.clone()));
    }

    let mut add_for_key = |rows: &mut Vec<NameRightSuggestion>, candidate_key: &str| {
        if candidate_key.is_empty() {
            return;
        }
        let candidate_norm = extract_name_lookup_text(candidate_key, true);
        if candidate_norm.is_empty() {
            return;
        }
        let mut raw_pairs: Vec<(String, String)> = Vec::new();
        if let Some(raw_val) = mapping.get(candidate_key) {
            raw_pairs.push((candidate_key.to_owned(), raw_val.clone()));
        }
        if let Some(norm_list) = normalized_mapping.get(&candidate_norm) {
            for pair in norm_list {
                if !raw_pairs.contains(pair) {
                    raw_pairs.push(pair.clone());
                }
            }
        }
        if raw_pairs.is_empty() {
            return;
        }
        let full_match_bonus = if candidate_norm == source_norm { 28 } else { 0 };
        let score_base = base_score + full_match_bonus + (candidate_key.chars().count() as i32);
        for (raw_key, raw_value_text) in raw_pairs {
            let values = split_multi_translation_values(&raw_value_text);
            if values.is_empty() {
                continue;
            }
            let raw_match_bonus = if raw_key == candidate_key { 4 } else { 0 };
            for (idx, target) in values.into_iter().enumerate() {
                let pair_key = (candidate_key.to_owned(), target.clone());
                if !seen_pairs.insert(pair_key) {
                    continue;
                }
                let src_out = if candidate_norm == source_norm && !display_source_text.is_empty() {
                    display_source_text.to_owned()
                } else {
                    candidate_key.to_owned()
                };
                rows.push(NameRightSuggestion {
                    index: 0,
                    source_text: src_out,
                    target_text: target,
                    origin: origin.to_owned(),
                    score: score_base + raw_match_bonus - (idx as i32),
                });
            }
        }
    };

    add_for_key(&mut rows, source_key);
    if !allow_subsegments {
        return rows;
    }
    let chars: Vec<char> = source_key.chars().collect();
    let source_len = chars.len();
    if source_len < 2 {
        return rows;
    }
    let cap_len = source_len.min(14);
    for seg_len in (2..=cap_len).rev() {
        for start in 0..=(source_len - seg_len) {
            let segment: String = chars[start..start + seg_len].iter().collect();
            add_for_key(&mut rows, &segment);
            if rows.len() >= 120 {
                return rows;
            }
        }
    }
    rows
}

/// Tạo bảng gợi ý cột phải (từ các bộ Name riêng / VP riêng / Name chung / VP chung / Hán Việt)
/// theo `reader_server.py::build_name_right_suggestions`.
pub fn build_name_right_suggestions(
    source_text: &str,
    hv_text: &str,
    dicts: &NameSuggestionDicts,
    prefer_kind: &str,
    prefer_scope: &str,
) -> Vec<NameRightSuggestion> {
    let source_lookup = extract_name_lookup_text(source_text, true);
    let source_cjk = extract_name_lookup_text(source_text, false);
    let source_display = normalize_newlines(source_text);
    if source_lookup.is_empty() || source_cjk.is_empty() {
        return Vec::new();
    }

    let kind = if prefer_kind.trim().eq_ignore_ascii_case("vp") {
        "vp"
    } else {
        "name"
    };
    let scope = if prefer_scope.trim().eq_ignore_ascii_case("global") {
        "global"
    } else {
        "book"
    };
    let boost_book_name = if scope == "book" && kind == "name" {
        18
    } else {
        0
    };
    let boost_book_vp = if scope == "book" && kind == "vp" {
        18
    } else {
        0
    };
    let boost_global_name = if scope == "global" && kind == "name" {
        18
    } else {
        0
    };
    let boost_global_vp = if scope == "global" && kind == "vp" {
        18
    } else {
        0
    };

    let dict_sources: [(&BTreeMap<String, String>, &str, i32); 4] = [
        (&dicts.personal_name, "Name riêng", 160 + boost_book_name),
        (&dicts.personal_vp, "VP riêng", 148 + boost_book_vp),
        (&dicts.global_name, "Name chung", 138 + boost_global_name),
        (&dicts.global_vp, "VP chung", 128 + boost_global_vp),
    ];

    let mut rows = Vec::new();
    for (mapping, origin, score) in dict_sources {
        let clean = normalize_name_set(mapping);
        rows.extend(collect_dict_suggestion_rows(
            &source_lookup,
            &clean,
            origin,
            score,
            &source_display,
            false,
        ));
    }

    let base_source = if source_display.is_empty() {
        &source_cjk
    } else {
        &source_display
    };
    let hv_candidate = format_name_hanviet_suggestion(base_source, hv_text);
    if !hv_candidate.is_empty() {
        rows.push(NameRightSuggestion {
            index: 0,
            source_text: if source_display.is_empty() {
                source_lookup
            } else {
                source_display
            },
            target_text: hv_candidate,
            origin: "Name Trung".to_owned(),
            score: 88,
        });
    }

    if rows.is_empty() {
        return Vec::new();
    }

    rows.sort_by(|a, b| {
        b.score
            .cmp(&a.score)
            .then_with(|| {
                a.source_text
                    .chars()
                    .count()
                    .cmp(&b.source_text.chars().count())
            })
            .then_with(|| {
                a.target_text
                    .chars()
                    .count()
                    .cmp(&b.target_text.chars().count())
            })
    });

    let mut dedup = Vec::new();
    let mut seen = HashSet::new();
    for mut row in rows {
        let source_key = normalize_for_compare(&row.source_text);
        let target_key = normalize_for_compare(&row.target_text);
        if source_key.is_empty() || target_key.is_empty() {
            continue;
        }
        let hash_key = format!("{source_key}|{target_key}");
        if !seen.insert(hash_key) {
            continue;
        }
        row.index = dedup.len() + 1;
        dedup.push(row);
        if dedup.len() >= 40 {
            break;
        }
    }
    dedup
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn longest_name_wins_and_adjacent_placeholders_are_spaced() {
        let mut names = BTreeMap::new();
        names.insert("沈庄".into(), "Thẩm Trang".into());
        names.insert("沈庄园".into(), "Thẩm trang viên".into());
        names.insert("萧炎".into(), "Tiêu Viêm".into());

        let (processed, pmap, hits) = apply_name_placeholders("沈庄园里的沈庄萧炎。", &names);
        assert_eq!(hits.len(), 3);
        assert_eq!(hits[0].source, "沈庄园");
        assert_eq!(hits[0].start, 0);
        assert_eq!(hits[0].end, 3);
        assert_eq!(hits[1].source, "沈庄");
        assert_eq!(hits[1].start, 5);
        assert_eq!(hits[1].end, 7);
        assert_eq!(hits[2].source, "萧炎");
        assert_eq!(hits[2].start, 7);
        assert_eq!(hits[2].end, 9);

        let restored = restore_name_placeholders(&processed, &pmap);
        assert_eq!(restored, "Thẩm trang viên里的Thẩm Trang Tiêu Viêm。");
    }

    #[test]
    fn parses_and_serializes_name_set_text_safely() {
        let raw = "\u{feff}# Comment\n萧炎 = Tiêu Viêm\n药老=Dược Lão\n无效,名字=Bad\n";
        let parsed = parse_name_set_text(raw);
        assert_eq!(parsed.len(), 2);
        assert_eq!(parsed.get("萧炎").map(String::as_str), Some("Tiêu Viêm"));
        assert_eq!(parsed.get("药老").map(String::as_str), Some("Dược Lão"));

        let serialized = serialize_name_set_text(&parsed);
        assert_eq!(parse_name_set_text(&serialized), parsed);
    }
}
