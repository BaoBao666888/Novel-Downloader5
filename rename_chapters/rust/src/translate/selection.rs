use std::collections::{BTreeMap, HashMap, HashSet};

use serde::{Deserialize, Serialize};

use crate::translate::name_set::normalize_name_set;
use crate::translate::pipeline::{TranslationTokenMapRow, TranslationUnitMapRow};
use crate::translate::text::{
    TM_TRANSLATE_BETA_MODE, contains_cjk, contains_name_split_delimiter, is_cjk_char,
    is_wordish_char, normalize_for_compare, normalize_newlines, pick_primary_translation_value,
    slice_chars, strip_edge_punctuation, text_snippet,
};

const TM_EDIT_PUNCTUATION_GROUPS: &[(&str, &str)] = &[
    (",", "，,、､﹐﹑︐"),
    (".", "。｡.．﹒…⋯︙"),
    ("!", "！!﹗"),
    ("?", "？?﹖"),
    (";", "；;﹔"),
    (":", "：:﹕"),
    ("<", "《〈<＜‹«︽︿"),
    (">", "》〉>＞›»︾﹀"),
    ("(", "（(﹙︵"),
    (")", "）)﹚︶"),
    ("[", "【〔［[〖〘〚﹇︹︻"),
    ("]", "】〕］]〗〙〛﹈︺︼"),
    ("{", "｛{﹛︷"),
    ("}", "｝}﹜︸"),
    ("\"", "“”„‟「」『』〝〞﹁﹂﹃﹄\"＂"),
    ("'", "‘’‚‛'＇"),
    ("-", "—–―－-‐‑‒﹘"),
    ("·", "·・•‧∙⋅"),
    ("~", "～~"),
    ("/", "／/"),
    ("\\", "＼\\"),
    ("|", "｜|"),
    ("=", "＝="),
    ("+", "＋+"),
    ("*", "＊*"),
    ("\n", "\n\r"),
];

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SourceCandidateScore {
    pub source: String,
    pub score: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SelectionSourceSegmentResult {
    pub selected_text: String,
    pub source_candidate: String,
    pub translated_candidate: String,
    pub match_type: String,
    pub source_context: String,
    pub translated_context: String,
    pub source_start: isize,
    pub source_end: isize,
    pub target_start: isize,
    pub target_end: isize,
    pub candidates: Vec<SourceCandidateScore>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SelectionNameMapResult {
    pub selected_text: String,
    pub source_candidate: String,
    pub target_candidate: String,
    pub match_type: String,
    pub score: f64,
    pub source_context: String,
    pub translated_context: String,
    pub unit_start: isize,
    pub unit_end: isize,
    #[serde(default)]
    pub name_suggestions: Vec<String>,
    pub candidates: Vec<SourceCandidateScore>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TmBetaPrediction {
    pub source: String,
    pub target: String,
    pub method: String,
    pub refined: bool,
    pub raw_start: usize,
    pub raw_end: usize,
    pub target_start: usize,
    pub target_end: usize,
}

fn canonical_punctuation(ch: char) -> Option<&'static str> {
    for &(canonical, group) in TM_EDIT_PUNCTUATION_GROUPS {
        if group.contains(ch) {
            return Some(canonical);
        }
    }
    if ch.is_ascii_punctuation() {
        for &(canonical, _) in TM_EDIT_PUNCTUATION_GROUPS {
            if canonical.starts_with(ch) {
                return Some(canonical);
            }
        }
    }
    None
}

fn is_latin_token_char(ch: char) -> bool {
    if ch.is_numeric() {
        return true;
    }
    let u = ch as u32;
    (0x0300..=0x036F).contains(&u)
        || ch.is_ascii_alphabetic()
        || (0x00C0..=0x024F).contains(&u)
        || (0x1E00..=0x1EFF).contains(&u)
}

fn tm_edit_structural_punctuation(chars: &[char], index: usize) -> Option<String> {
    let ch = *chars.get(index)?;
    let canonical = canonical_punctuation(ch).map(str::to_owned)?;
    if canonical != "-" || !matches!(ch, '-' | '‐' | '‑' | '﹘' | '－') {
        return Some(canonical);
    }
    let before = index.checked_sub(1).and_then(|i| chars.get(i)).copied();
    let after = chars.get(index + 1).copied();
    if let (Some(b), Some(a)) = (before, after)
        && is_latin_token_char(b)
        && is_latin_token_char(a)
    {
        return None;
    }
    Some(canonical)
}

#[derive(Debug, Clone)]
struct ClauseSpan {
    start: usize,
    end: usize,
    separator_end: usize,
    separator: String,
}

fn tm_edit_split_clauses(value: &str) -> Vec<ClauseSpan> {
    let chars: Vec<char> = value.chars().collect();
    let len = chars.len();
    let mut clauses = Vec::new();

    let push = |clauses: &mut Vec<ClauseSpan>,
                raw_start: usize,
                raw_end: usize,
                separator_end: usize,
                separator: String| {
        let mut content_start = raw_start;
        let mut content_end = raw_end;
        while content_start < content_end && chars[content_start].is_whitespace() {
            content_start += 1;
        }
        while content_end > content_start && chars[content_end - 1].is_whitespace() {
            content_end -= 1;
        }
        if content_end > content_start {
            clauses.push(ClauseSpan {
                start: content_start,
                end: content_end,
                separator_end,
                separator,
            });
        }
    };

    let mut start = 0usize;
    let mut index = 0usize;
    while index < len {
        if tm_edit_structural_punctuation(&chars, index).is_none() {
            index += 1;
            continue;
        }
        let separator_start = index;
        let mut canonical: Vec<String> = Vec::new();
        while index < len {
            let Some(mark) = tm_edit_structural_punctuation(&chars, index) else {
                break;
            };
            if !canonical.contains(&mark) {
                canonical.push(mark);
            }
            index += 1;
            let mut next_punct = index;
            while next_punct < len
                && !matches!(chars[next_punct], '\r' | '\n')
                && chars[next_punct].is_whitespace()
            {
                next_punct += 1;
            }
            if next_punct > index && tm_edit_structural_punctuation(&chars, next_punct).is_some() {
                index = next_punct;
            }
        }
        push(
            &mut clauses,
            start,
            separator_start,
            index,
            canonical.join(""),
        );
        start = index;
    }
    push(&mut clauses, start, len, len, String::new());
    clauses
}

#[derive(Debug, Clone)]
struct WordToken {
    value: String,
    start: usize,
    end: usize,
    source: &'static str,
}

fn tm_edit_word_tokens(value: &str) -> Vec<WordToken> {
    let chars: Vec<char> = value.chars().collect();
    let mut output = Vec::new();
    let mut start: Option<usize> = None;
    for (index, &ch) in chars.iter().enumerate() {
        let is_word = is_wordish_char(ch);
        if is_word && start.is_none() {
            start = Some(index);
        } else if !is_word && let Some(s) = start.take() {
            let slice: String = chars[s..index].iter().collect();
            let norm = slice.to_lowercase();
            if !norm.is_empty() {
                output.push(WordToken {
                    value: norm,
                    start: s,
                    end: index,
                    source: "word",
                });
            }
        }
    }
    if let Some(s) = start {
        let slice: String = chars[s..].iter().collect();
        let norm = slice.to_lowercase();
        if !norm.is_empty() {
            output.push(WordToken {
                value: norm,
                start: s,
                end: chars.len(),
                source: "word",
            });
        }
    }
    output
}

fn is_han_char_for_tm_edit(ch: char) -> bool {
    is_cjk_char(ch)
        || ('\u{F900}'..='\u{FAFF}').contains(&ch)
        || ('\u{20000}'..='\u{2FA1F}').contains(&ch)
}

fn tm_edit_hanviet_tokens(raw: &str, hanviet_map: &HashMap<String, String>) -> Vec<WordToken> {
    let chars: Vec<char> = raw.chars().collect();
    let mut output = Vec::new();
    let mut latin_start: Option<usize> = None;

    let flush_latin = |output: &mut Vec<WordToken>, start_opt: &mut Option<usize>, end: usize| {
        if let Some(s) = start_opt.take() {
            let literal: String = chars[s..end].iter().collect();
            for token in tm_edit_word_tokens(&literal) {
                output.push(WordToken {
                    value: token.value,
                    start: s + token.start,
                    end: s + token.end,
                    source: "latin",
                });
            }
        }
    };

    let mut ch_buf = String::new();
    for (index, &ch) in chars.iter().enumerate() {
        if is_han_char_for_tm_edit(ch) {
            flush_latin(&mut output, &mut latin_start, index);
            ch_buf.clear();
            ch_buf.push(ch);
            let mapped = hanviet_map
                .get(&ch_buf)
                .map(|m| m.split('/').next().unwrap_or(m.as_str()).trim())
                .unwrap_or(ch_buf.as_str());
            for token in tm_edit_word_tokens(mapped) {
                output.push(WordToken {
                    value: token.value,
                    start: index,
                    end: index + 1,
                    source: "hanviet",
                });
            }
        } else if is_wordish_char(ch) {
            if latin_start.is_none() {
                latin_start = Some(index);
            }
        } else {
            flush_latin(&mut output, &mut latin_start, index);
        }
    }
    flush_latin(&mut output, &mut latin_start, chars.len());
    output
}

#[derive(Debug, Clone)]
struct RefineResult {
    raw_start: usize,
    raw_end: usize,
    viet_start: usize,
    viet_end: usize,
    refined: bool,
    name_anchored: bool,
    hanviet_refined: bool,
}

fn tm_edit_refine_hanviet(
    raw: &str,
    translated: &str,
    mut selection_start: usize,
    mut selection_end: usize,
    hanviet_map: &HashMap<String, String>,
) -> RefineResult {
    let raw_len = raw.chars().count();
    let trans_len = translated.chars().count();
    let viet_tokens = tm_edit_word_tokens(translated);
    let han_tokens = tm_edit_hanviet_tokens(raw, hanviet_map);
    if viet_tokens.is_empty() || han_tokens.is_empty() {
        return RefineResult {
            raw_start: 0,
            raw_end: raw_len,
            viet_start: 0,
            viet_end: trans_len,
            refined: false,
            name_anchored: false,
            hanviet_refined: false,
        };
    }

    let touched: Vec<&WordToken> = viet_tokens
        .iter()
        .filter(|row| selection_end > row.start && selection_start < row.end)
        .collect();
    if let (Some(first), Some(last)) = (touched.first(), touched.last()) {
        selection_start = first.start;
        selection_end = last.end;
    }

    let selected_slice = slice_chars(translated, selection_start, selection_end);
    let selected_words: Vec<String> = tm_edit_word_tokens(&selected_slice)
        .into_iter()
        .map(|r| r.value)
        .collect();

    if !selected_words.is_empty() && han_tokens.len() >= selected_words.len() {
        let mut exact = Vec::new();
        for idx in 0..=(han_tokens.len() - selected_words.len()) {
            let matches = han_tokens[idx..idx + selected_words.len()]
                .iter()
                .zip(selected_words.iter())
                .all(|(h, s)| &h.value == s);
            if matches {
                exact.push((
                    han_tokens[idx].start,
                    han_tokens[idx + selected_words.len() - 1].end,
                ));
            }
        }
        if exact.len() == 1 && exact[0].1 > exact[0].0 {
            return RefineResult {
                raw_start: exact[0].0,
                raw_end: exact[0].1,
                viet_start: selection_start,
                viet_end: selection_end,
                refined: true,
                name_anchored: false,
                hanviet_refined: true,
            };
        }
    }

    let mut viet_freq: HashMap<&str, usize> = HashMap::new();
    for row in &viet_tokens {
        *viet_freq.entry(row.value.as_str()).or_insert(0) += 1;
    }
    let mut han_freq: HashMap<&str, usize> = HashMap::new();
    for row in &han_tokens {
        *han_freq.entry(row.value.as_str()).or_insert(0) += 1;
    }

    #[derive(Debug, Clone, Copy)]
    struct Anchor {
        viet_start: usize,
        viet_end: usize,
        raw_start: usize,
        raw_end: usize,
        length: usize,
    }

    let mut anchors = Vec::new();
    for (vi, viet_token) in viet_tokens.iter().enumerate() {
        for (hv, han_token) in han_tokens.iter().enumerate() {
            if viet_token.value != han_token.value {
                continue;
            }
            if vi > 0 && hv > 0 && viet_tokens[vi - 1].value == han_tokens[hv - 1].value {
                continue;
            }
            let mut length = 1usize;
            while vi + length < viet_tokens.len()
                && hv + length < han_tokens.len()
                && viet_tokens[vi + length].value == han_tokens[hv + length].value
            {
                length += 1;
            }
            let word = viet_token.value.as_str();
            let reliable_single = length == 1
                && (word.chars().count() >= 2 || han_token.source == "latin")
                && viet_freq.get(word).copied().unwrap_or(0) == 1
                && han_freq.get(word).copied().unwrap_or(0) == 1;
            if length < 2 && !reliable_single {
                continue;
            }
            anchors.push(Anchor {
                viet_start: viet_token.start,
                viet_end: viet_tokens[vi + length - 1].end,
                raw_start: han_token.start,
                raw_end: han_tokens[hv + length - 1].end,
                length,
            });
        }
    }

    let mut before: Vec<Anchor> = anchors
        .iter()
        .copied()
        .filter(|row| row.viet_end <= selection_start)
        .collect();
    before.sort_by(|a, b| {
        b.viet_end
            .cmp(&a.viet_end)
            .then_with(|| b.length.cmp(&a.length))
    });

    let mut after: Vec<Anchor> = anchors
        .iter()
        .copied()
        .filter(|row| row.viet_start >= selection_end)
        .collect();
    after.sort_by(|a, b| {
        a.viet_start
            .cmp(&b.viet_start)
            .then_with(|| b.length.cmp(&a.length))
    });

    let mut left = before.first().copied();
    let mut right = after.first().copied();
    if let (Some(l), Some(r)) = (left, right)
        && l.raw_end > r.raw_start
    {
        let mut valid_pair = None;
        'outer: for a in &before {
            for b in &after {
                if a.raw_end <= b.raw_start {
                    valid_pair = Some((*a, *b));
                    break 'outer;
                }
            }
        }
        if let Some((va, vb)) = valid_pair {
            left = Some(va);
            right = Some(vb);
        } else if l.length >= r.length {
            right = None;
        } else {
            left = None;
        }
    }

    let raw_start = left.map_or(0, |l| l.raw_end);
    let raw_end = right.map_or(raw_len, |r| r.raw_start);
    if (left.is_none() && right.is_none()) || raw_end <= raw_start {
        return RefineResult {
            raw_start: 0,
            raw_end: raw_len,
            viet_start: 0,
            viet_end: trans_len,
            refined: false,
            name_anchored: false,
            hanviet_refined: false,
        };
    }

    RefineResult {
        raw_start,
        raw_end,
        viet_start: left.map_or(0, |l| l.viet_end),
        viet_end: right.map_or(trans_len, |r| r.viet_start),
        refined: true,
        name_anchored: false,
        hanviet_refined: true,
    }
}

fn find_char_occurrences(
    haystack: &str,
    needle: &str,
    case_insensitive: bool,
) -> Vec<(usize, usize)> {
    if haystack.is_empty() || needle.is_empty() {
        return Vec::new();
    }
    let h_chars: Vec<char> = if case_insensitive {
        haystack.to_lowercase().chars().collect()
    } else {
        haystack.chars().collect()
    };
    let n_chars: Vec<char> = if case_insensitive {
        needle.to_lowercase().chars().collect()
    } else {
        needle.chars().collect()
    };
    if n_chars.is_empty() || n_chars.len() > h_chars.len() {
        return Vec::new();
    }
    let mut out = Vec::new();
    let mut i = 0usize;
    while i + n_chars.len() <= h_chars.len() {
        if h_chars[i..i + n_chars.len()] == n_chars[..] {
            out.push((i, i + n_chars.len()));
            i += n_chars.len().max(1);
        } else {
            i += 1;
        }
    }
    out
}

fn tm_edit_refine_with_names(
    raw: &str,
    translated: &str,
    selection_start: usize,
    selection_end: usize,
    hanviet_map: &HashMap<String, String>,
    name_set: &BTreeMap<String, String>,
) -> RefineResult {
    #[derive(Debug, Clone, Copy)]
    struct NameSpanPair {
        raw_start: usize,
        raw_end: usize,
        viet_start: usize,
        viet_end: usize,
    }

    let mut candidates = Vec::new();
    for (raw_name, translated_raw) in name_set {
        let source_name = raw_name.trim();
        let translated_name = pick_primary_translation_value(translated_raw.trim());
        if source_name.is_empty() || translated_name.is_empty() {
            continue;
        }
        let raw_occ = find_char_occurrences(raw, source_name, false);
        let trans_occ = find_char_occurrences(translated, &translated_name, true);
        for (r_span, t_span) in raw_occ.into_iter().zip(trans_occ.into_iter()) {
            candidates.push(NameSpanPair {
                raw_start: r_span.0,
                raw_end: r_span.1,
                viet_start: t_span.0,
                viet_end: t_span.1,
            });
        }
    }
    candidates.sort_by(|a, b| {
        a.raw_start
            .cmp(&b.raw_start)
            .then_with(|| (b.raw_end - b.raw_start).cmp(&(a.raw_end - a.raw_start)))
            .then_with(|| a.viet_start.cmp(&b.viet_start))
    });

    let mut anchors: Vec<NameSpanPair> = Vec::new();
    for cand in candidates {
        if let Some(prev) = anchors.last()
            && (cand.raw_start < prev.raw_end || cand.viet_start < prev.viet_end)
        {
            continue;
        }
        anchors.push(cand);
    }

    if anchors.is_empty() {
        return tm_edit_refine_hanviet(
            raw,
            translated,
            selection_start,
            selection_end,
            hanviet_map,
        );
    }

    #[derive(Debug, Clone, Copy)]
    struct Segment {
        is_name: bool,
        raw_start: usize,
        raw_end: usize,
        viet_start: usize,
        viet_end: usize,
    }

    let raw_len = raw.chars().count();
    let trans_len = translated.chars().count();
    let mut segments = Vec::new();
    let mut raw_cursor = 0usize;
    let mut viet_cursor = 0usize;
    for anchor in anchors {
        if anchor.raw_start > raw_cursor || anchor.viet_start > viet_cursor {
            segments.push(Segment {
                is_name: false,
                raw_start: raw_cursor,
                raw_end: anchor.raw_start,
                viet_start: viet_cursor,
                viet_end: anchor.viet_start,
            });
        }
        segments.push(Segment {
            is_name: true,
            raw_start: anchor.raw_start,
            raw_end: anchor.raw_end,
            viet_start: anchor.viet_start,
            viet_end: anchor.viet_end,
        });
        raw_cursor = anchor.raw_end;
        viet_cursor = anchor.viet_end;
    }
    if raw_cursor < raw_len || viet_cursor < trans_len {
        segments.push(Segment {
            is_name: false,
            raw_start: raw_cursor,
            raw_end: raw_len,
            viet_start: viet_cursor,
            viet_end: trans_len,
        });
    }

    let selected_indexes: Vec<usize> = segments
        .iter()
        .enumerate()
        .filter_map(|(idx, seg)| {
            if selection_end > seg.viet_start && selection_start < seg.viet_end {
                Some(idx)
            } else {
                None
            }
        })
        .collect();

    if selected_indexes.is_empty() {
        return tm_edit_refine_hanviet(
            raw,
            translated,
            selection_start,
            selection_end,
            hanviet_map,
        );
    }

    let first_idx = selected_indexes[0];
    let last_idx = *selected_indexes.last().unwrap();
    let first = segments[first_idx];
    let last = segments[last_idx];

    let refine_edge = |seg: Segment| -> RefineResult {
        if seg.is_name {
            return RefineResult {
                raw_start: 0,
                raw_end: seg.raw_end.saturating_sub(seg.raw_start),
                viet_start: 0,
                viet_end: seg.viet_end.saturating_sub(seg.viet_start),
                refined: false,
                name_anchored: true,
                hanviet_refined: false,
            };
        }
        let local_start = selection_start.saturating_sub(seg.viet_start);
        let seg_viet_len = seg.viet_end.saturating_sub(seg.viet_start);
        let local_end = seg_viet_len.min(
            selection_end
                .saturating_sub(seg.viet_start)
                .max(local_start),
        );
        tm_edit_refine_hanviet(
            &slice_chars(raw, seg.raw_start, seg.raw_end),
            &slice_chars(translated, seg.viet_start, seg.viet_end),
            local_start,
            local_end,
            hanviet_map,
        )
    };

    let first_res = refine_edge(first);
    let last_res = if first_idx == last_idx {
        first_res.clone()
    } else {
        refine_edge(last)
    };

    RefineResult {
        raw_start: first.raw_start + first_res.raw_start,
        raw_end: last.raw_start + last_res.raw_end,
        viet_start: first.viet_start + first_res.viet_start,
        viet_end: last.viet_start + last_res.viet_end,
        refined: true,
        name_anchored: true,
        hanviet_refined: first_res.refined || last_res.refined,
    }
}

/// Dự đoán cụm gốc tiếng Trung từ đoạn bôi đen tiếng Việt bằng thuật toán 3 tầng của TM Translate:
/// 1) Tách mệnh đề theo dấu câu cấu trúc (`_tm_edit_split_clauses`)
/// 2) Neo theo các Name riêng đã biết trong câu (`_tm_edit_refine_with_names`)
/// 3) Neo theo từ vựng Hán-Việt đơn nhất/cụm khớp (`_tm_edit_refine_hanviet`)
pub fn tm_beta_predict_name_source(
    raw_text: &str,
    translated_text: &str,
    selection_start: usize,
    selection_end: usize,
    hanviet_map: Option<&HashMap<String, String>>,
    name_set: &BTreeMap<String, String>,
) -> TmBetaPrediction {
    let raw_clauses = tm_edit_split_clauses(raw_text);
    let translated_clauses = tm_edit_split_clauses(translated_text);
    let aligned = !raw_clauses.is_empty()
        && raw_clauses.len() == translated_clauses.len()
        && raw_clauses
            .iter()
            .zip(translated_clauses.iter())
            .all(|(r, t)| r.separator == t.separator);
    if !aligned {
        return TmBetaPrediction {
            source: raw_text.trim().to_owned(),
            target: translated_text.trim().to_owned(),
            method: "safe-full-chunk".to_owned(),
            refined: false,
            raw_start: 0,
            raw_end: raw_text.chars().count(),
            target_start: 0,
            target_end: translated_text.chars().count(),
        };
    }

    let mut selected_indexes: Vec<usize> = translated_clauses
        .iter()
        .enumerate()
        .filter_map(|(idx, clause)| {
            if selection_end > clause.start && selection_start < clause.end {
                Some(idx)
            } else {
                None
            }
        })
        .collect();
    if selected_indexes.is_empty() {
        let nearest = translated_clauses
            .iter()
            .position(|clause| selection_start <= clause.separator_end)
            .unwrap_or_else(|| translated_clauses.len().saturating_sub(1));
        selected_indexes.push(nearest);
    }

    let first = selected_indexes[0];
    let last = *selected_indexes.last().unwrap();
    if first != last {
        let raw_start = raw_clauses[first].start;
        let raw_end = raw_clauses[last].end;
        let viet_start = translated_clauses[first].start;
        let viet_end = translated_clauses[last].end;
        return TmBetaPrediction {
            source: slice_chars(raw_text, raw_start, raw_end).trim().to_owned(),
            target: slice_chars(translated_text, viet_start, viet_end)
                .trim()
                .to_owned(),
            method: "punctuation".to_owned(),
            refined: true,
            raw_start,
            raw_end,
            target_start: viet_start,
            target_end: viet_end,
        };
    }

    let raw_clause = &raw_clauses[first];
    let translated_clause = &translated_clauses[first];
    let raw_start = raw_clause.start;
    let raw_end = raw_clause.end;
    let viet_start = translated_clause.start;
    let viet_end = translated_clause.end;

    let empty_hv = HashMap::new();
    let hv = hanviet_map.unwrap_or(&empty_hv);
    let clean_names = normalize_name_set(name_set);
    let refined = tm_edit_refine_with_names(
        &slice_chars(raw_text, raw_start, raw_end),
        &slice_chars(translated_text, viet_start, viet_end),
        selection_start.saturating_sub(viet_start),
        selection_end.saturating_sub(viet_start),
        hv,
        &clean_names,
    );

    let final_raw_start = raw_start + refined.raw_start;
    let final_raw_end = raw_start + refined.raw_end;
    let final_viet_start = viet_start + refined.viet_start;
    let final_viet_end = viet_start + refined.viet_end;
    let method = if refined.name_anchored && refined.hanviet_refined {
        "punctuation-name-hanviet"
    } else if refined.name_anchored {
        "punctuation-name"
    } else if refined.refined {
        "punctuation-hanviet"
    } else {
        "punctuation"
    };

    TmBetaPrediction {
        source: slice_chars(raw_text, final_raw_start, final_raw_end)
            .trim()
            .to_owned(),
        target: slice_chars(translated_text, final_viet_start, final_viet_end)
            .trim()
            .to_owned(),
        method: method.to_owned(),
        refined: true,
        raw_start: final_raw_start,
        raw_end: final_raw_end,
        target_start: final_viet_start,
        target_end: final_viet_end,
    }
}

/// Ánh xạ đoạn văn bản bôi đen trong bản dịch sang đoạn gốc tương ứng (phục vụ Xóa rác / Sửa từ)
/// bảo toàn 100% `reader_server.py::map_selection_to_source_segment`.
#[allow(clippy::too_many_arguments)]
pub fn map_selection_to_source_segment(
    raw_text: &str,
    translated_text: &str,
    selected_text: &str,
    start_offset: isize,
    end_offset: isize,
    unit_map: &[TranslationUnitMapRow],
    token_map: &[TranslationTokenMapRow],
    translation_mode: &str,
) -> SelectionSourceSegmentResult {
    let mut selected = normalize_newlines(selected_text);
    let source_raw = normalize_newlines(raw_text);
    let source_trans = normalize_newlines(translated_text);
    let total_len = source_trans.chars().count();

    let mut start = start_offset.clamp(0, total_len as isize) as usize;
    let mut end = end_offset.clamp(0, total_len as isize) as usize;
    if end < start {
        std::mem::swap(&mut start, &mut end);
    }
    if end == start {
        end = total_len.min(start + selected.chars().count().max(1));
    }
    if selected.is_empty() && start < end {
        selected = slice_chars(&source_trans, start, end);
    }

    let build_result = |source_candidate: &str,
                        translated_candidate: &str,
                        match_type: &str,
                        source_start: isize,
                        source_end: isize,
                        target_start: isize,
                        target_end: isize,
                        candidates: Vec<SourceCandidateScore>| {
        let sc = strip_edge_punctuation(source_candidate.trim());
        let tc = strip_edge_punctuation(translated_candidate.trim());
        let tc_final = if tc.is_empty() {
            strip_edge_punctuation(&selected)
        } else {
            tc
        };
        let src_ctx = if source_start >= 0 && source_end >= 0 {
            text_snippet(&source_raw, source_start, source_end, 56)
        } else {
            String::new()
        };
        let tgt_ctx = if target_start >= 0 && target_end >= 0 {
            text_snippet(&source_trans, target_start, target_end, 56)
        } else {
            text_snippet(&source_trans, start as isize, end as isize, 56)
        };
        SelectionSourceSegmentResult {
            selected_text: selected.clone(),
            source_candidate: sc,
            translated_candidate: tc_final,
            match_type: match_type.to_owned(),
            source_context: src_ctx,
            translated_context: tgt_ctx,
            source_start,
            source_end,
            target_start,
            target_end,
            candidates,
        }
    };

    if contains_cjk(&selected) {
        let occ = find_char_occurrences(&source_raw, &selected, false);
        let (s_start, s_end) = occ
            .first()
            .map(|&(s, e)| (s as isize, e as isize))
            .unwrap_or((-1, -1));
        return build_result(
            &selected,
            &selected,
            "selection_is_cjk",
            s_start,
            s_end,
            start as isize,
            end as isize,
            vec![SourceCandidateScore {
                source: selected.clone(),
                score: 1.0,
            }],
        );
    }

    if !source_raw.is_empty() && source_raw == source_trans {
        let occ = find_char_occurrences(&source_raw, &selected, false);
        let (s_start, s_end) = occ
            .first()
            .map(|&(s, e)| (s as isize, e as isize))
            .unwrap_or((-1, -1));
        let cands = if selected.is_empty() {
            Vec::new()
        } else {
            vec![SourceCandidateScore {
                source: selected.clone(),
                score: 1.0,
            }]
        };
        return build_result(
            &selected,
            &selected,
            "raw_text_match",
            s_start,
            s_end,
            start as isize,
            end as isize,
            cands,
        );
    }

    let mode_norm = translation_mode.trim().to_ascii_lowercase();
    let mut token_rows: Vec<&TranslationTokenMapRow> = token_map
        .iter()
        .filter(|row| {
            row.token_type != 4 && !strip_edge_punctuation(row.source_text.trim()).is_empty()
        })
        .collect();
    token_rows.sort_by(|a, b| {
        a.target_start
            .cmp(&b.target_start)
            .then_with(|| a.target_end.cmp(&b.target_end))
    });

    if matches!(mode_norm.as_str(), "local" | "hanviet" | "dichngay_local")
        && !token_rows.is_empty()
    {
        let chosen_rows = select_cover_slice(
            &token_rows,
            start,
            end,
            |r| r.target_start,
            |r| r.target_end,
        );
        if !chosen_rows.is_empty() {
            let source_start = chosen_rows
                .iter()
                .map(|r| r.source_start)
                .min()
                .unwrap_or(0);
            let source_end = chosen_rows.iter().map(|r| r.source_end).max().unwrap_or(0);
            let target_start = chosen_rows
                .iter()
                .map(|r| r.target_start)
                .min()
                .unwrap_or(0);
            let target_end = chosen_rows.iter().map(|r| r.target_end).max().unwrap_or(0);
            let mut source_candidate: String = chosen_rows
                .iter()
                .map(|r| r.source_text.as_str())
                .collect::<String>()
                .trim()
                .to_owned();
            if source_candidate.is_empty() {
                source_candidate = slice_chars(&source_raw, source_start, source_end)
                    .trim()
                    .to_owned();
            }
            let mut translated_candidate = slice_chars(&source_trans, target_start, target_end)
                .trim()
                .to_owned();
            if translated_candidate.is_empty() {
                translated_candidate = selected.clone();
            }
            let candidates: Vec<SourceCandidateScore> = chosen_rows
                .iter()
                .take(8)
                .filter_map(|row| {
                    let s = strip_edge_punctuation(row.source_text.trim());
                    if s.is_empty() {
                        return None;
                    }
                    let ov = row
                        .target_end
                        .min(end)
                        .saturating_sub(row.target_start.max(start));
                    Some(SourceCandidateScore {
                        source: s,
                        score: ov as f64,
                    })
                })
                .collect();
            return build_result(
                &source_candidate,
                &translated_candidate,
                "local_token_cover",
                source_start as isize,
                source_end as isize,
                target_start as isize,
                target_end as isize,
                candidates,
            );
        }
    }

    let mut units: Vec<&TranslationUnitMapRow> = unit_map.iter().collect();
    units.sort_by_key(|u| u.unit_index);
    let chosen_units = select_cover_slice(&units, start, end, |u| u.target_start, |u| u.target_end);
    if !chosen_units.is_empty() {
        let source_start = chosen_units
            .iter()
            .map(|u| u.source_start)
            .min()
            .unwrap_or(0);
        let source_end = chosen_units.iter().map(|u| u.source_end).max().unwrap_or(0);
        let target_start = chosen_units
            .iter()
            .map(|u| u.target_start)
            .min()
            .unwrap_or(0);
        let target_end = chosen_units.iter().map(|u| u.target_end).max().unwrap_or(0);
        let mut source_candidate: String = chosen_units
            .iter()
            .map(|u| u.source_text.as_str())
            .collect::<String>()
            .trim()
            .to_owned();
        if source_candidate.is_empty() {
            source_candidate = slice_chars(&source_raw, source_start, source_end)
                .trim()
                .to_owned();
        }
        let mut translated_candidate: String = chosen_units
            .iter()
            .map(|u| u.target_text.as_str())
            .collect::<String>()
            .trim()
            .to_owned();
        if translated_candidate.is_empty() {
            translated_candidate = slice_chars(&source_trans, target_start, target_end)
                .trim()
                .to_owned();
            if translated_candidate.is_empty() {
                translated_candidate = selected.clone();
            }
        }
        let candidates: Vec<SourceCandidateScore> = chosen_units
            .iter()
            .take(8)
            .filter_map(|row| {
                let s = strip_edge_punctuation(row.source_text.trim());
                if s.is_empty() {
                    return None;
                }
                let ov = row
                    .target_end
                    .min(end)
                    .saturating_sub(row.target_start.max(start));
                Some(SourceCandidateScore {
                    source: s,
                    score: ov as f64,
                })
            })
            .collect();
        return build_result(
            &source_candidate,
            &translated_candidate,
            "unit_cover",
            source_start as isize,
            source_end as isize,
            target_start as isize,
            target_end as isize,
            candidates,
        );
    }

    let occ = find_char_occurrences(&source_raw, &selected, false);
    let (idx, s_end) = occ
        .first()
        .map(|&(s, e)| (s as isize, e as isize))
        .unwrap_or((-1, -1));
    let fallback = if idx >= 0 || (!source_raw.is_empty() && source_trans.is_empty()) {
        selected.clone()
    } else {
        String::new()
    };
    let cands = if fallback.is_empty() {
        Vec::new()
    } else {
        vec![SourceCandidateScore {
            source: fallback.clone(),
            score: 0.25,
        }]
    };
    build_result(
        &fallback,
        &selected,
        "fallback",
        idx,
        s_end,
        start as isize,
        end as isize,
        cands,
    )
}

fn select_cover_slice<'a, T>(
    ordered: &[&'a T],
    seg_start: usize,
    seg_end: usize,
    get_start: impl Fn(&T) -> usize,
    get_end: impl Fn(&T) -> usize,
) -> Vec<&'a T> {
    if ordered.is_empty() {
        return Vec::new();
    }
    let overlap_indices: Vec<usize> = ordered
        .iter()
        .enumerate()
        .filter_map(|(idx, row)| {
            if get_end(row) > seg_start && get_start(row) < seg_end {
                Some(idx)
            } else {
                None
            }
        })
        .collect();
    if let (Some(&first), Some(&last)) = (overlap_indices.first(), overlap_indices.last()) {
        return ordered[first..=last].to_vec();
    }
    let center = (seg_start + seg_end) as f64 / 2.0;
    let nearest_idx = (0..ordered.len())
        .min_by(|&a, &b| {
            let ca = (get_start(ordered[a]) + get_end(ordered[a])) as f64 / 2.0;
            let cb = (get_start(ordered[b]) + get_end(ordered[b])) as f64 / 2.0;
            (ca - center)
                .abs()
                .partial_cmp(&(cb - center).abs())
                .unwrap_or(std::cmp::Ordering::Equal)
        })
        .unwrap_or(0);
    vec![ordered[nearest_idx]]
}

fn choose_best_unit<'a>(
    cands: &[&'a TranslationUnitMapRow],
    seg_start: usize,
    seg_end: usize,
) -> &'a TranslationUnitMapRow {
    cands
        .iter()
        .copied()
        .max_by(|a, b| {
            let score_for = |u: &TranslationUnitMapRow| -> (f64, f64, f64) {
                let unit_len = u.target_end.saturating_sub(u.target_start).max(1);
                let ov = u
                    .target_end
                    .min(seg_end)
                    .saturating_sub(u.target_start.max(seg_start));
                let ratio = (ov as f64) / (unit_len as f64);
                (ov as f64, ratio, -(unit_len as f64))
            };
            let sa = score_for(a);
            let sb = score_for(b);
            sa.0.partial_cmp(&sb.0)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| sa.1.partial_cmp(&sb.1).unwrap_or(std::cmp::Ordering::Equal))
                .then_with(|| sa.2.partial_cmp(&sb.2).unwrap_or(std::cmp::Ordering::Equal))
        })
        .unwrap_or(cands[0])
}

#[derive(Debug, Clone)]
struct TransNameMatch {
    source: String,
    target: String,
    start: usize,
    end: usize,
}

/// Ánh xạ đoạn văn bản bôi đen trong Reader sang cặp `(source_candidate, target_candidate)`
/// để sửa Name riêng theo map V3 (`reader_server.py::map_selection_to_name_source`).
#[allow(clippy::too_many_arguments)]
pub fn map_selection_to_name_source(
    raw_text: &str,
    translated_text: &str,
    selected_text: &str,
    start_offset: isize,
    end_offset: isize,
    name_set: &BTreeMap<String, String>,
    unit_map: &[TranslationUnitMapRow],
    token_map: &[TranslationTokenMapRow],
    translation_mode: &str,
    hanviet_map: Option<&HashMap<String, String>>,
) -> SelectionNameMapResult {
    let mut selected = selected_text.trim().to_owned();
    let source_raw = normalize_newlines(raw_text);
    let source_trans = normalize_newlines(translated_text);
    let cleaned_set = normalize_name_set(name_set);
    let total_len = source_trans.chars().count();
    let mut start = start_offset.clamp(0, total_len as isize) as usize;
    let mut end = end_offset.clamp(0, total_len as isize) as usize;
    if end < start {
        std::mem::swap(&mut start, &mut end);
    }
    if end == start {
        end = total_len.min(start + selected.chars().count().max(1));
    }
    if selected.is_empty() && start < end {
        selected = slice_chars(&source_trans, start, end);
    }

    if contains_name_split_delimiter(&selected) {
        return SelectionNameMapResult {
            selected_text: selected.clone(),
            source_candidate: String::new(),
            target_candidate: strip_edge_punctuation(&selected),
            match_type: "selection_contains_delimiter".to_owned(),
            score: 0.0,
            source_context: String::new(),
            translated_context: text_snippet(&source_trans, start as isize, end as isize, 56),
            unit_start: -1,
            unit_end: -1,
            name_suggestions: Vec::new(),
            candidates: Vec::new(),
        };
    }

    if contains_cjk(&selected) {
        let cjk_value = strip_edge_punctuation(selected.trim());
        let target_val = cleaned_set
            .get(&cjk_value)
            .cloned()
            .unwrap_or_else(|| cjk_value.clone());
        let occ = find_char_occurrences(&source_raw, &cjk_value, false);
        let src_ctx = if let Some(&(s, e)) = occ.first() {
            text_snippet(&source_raw, s as isize, e as isize, 56)
        } else {
            String::new()
        };
        let cands = if cjk_value.is_empty() {
            Vec::new()
        } else {
            vec![SourceCandidateScore {
                source: cjk_value.clone(),
                score: 1.0,
            }]
        };
        return SelectionNameMapResult {
            selected_text: selected,
            source_candidate: cjk_value,
            target_candidate: pick_primary_translation_value(&target_val),
            match_type: "selection_is_cjk".to_owned(),
            score: 1.0,
            source_context: src_ctx,
            translated_context: text_snippet(&source_trans, start as isize, end as isize, 56),
            unit_start: -1,
            unit_end: -1,
            name_suggestions: Vec::new(),
            candidates: cands,
        };
    }

    let mut name_matches: Vec<TransNameMatch> = Vec::new();
    for (source_name, target_raw) in &cleaned_set {
        let target_main = target_raw.trim();
        if target_main.is_empty() {
            continue;
        }
        let mut target_opts: Vec<String> = vec![target_main.to_owned()];
        for opt in target_main.split('/') {
            let trimmed = opt.trim();
            if !trimmed.is_empty() && !target_opts.iter().any(|x| x == trimmed) {
                target_opts.push(trimmed.to_owned());
            }
        }
        for opt in target_opts {
            for (s, e) in find_char_occurrences(&source_trans, &opt, false) {
                name_matches.push(TransNameMatch {
                    source: source_name.clone(),
                    target: opt.clone(),
                    start: s,
                    end: e,
                });
            }
        }
    }

    let selected_norm = normalize_for_compare(&selected);
    let related_name_matches: Vec<&TransNameMatch> = name_matches
        .iter()
        .filter(|nm| nm.end > start && nm.start < end)
        .collect();

    let mut chosen_name_exact: Option<&TransNameMatch> = None;
    if !related_name_matches.is_empty() {
        let mut covering: Vec<&TransNameMatch> = related_name_matches
            .iter()
            .copied()
            .filter(|nm| nm.start <= start && nm.end >= end)
            .collect();
        if !covering.is_empty() {
            covering.sort_by(|a, b| {
                b.target
                    .chars()
                    .count()
                    .cmp(&a.target.chars().count())
                    .then_with(|| b.source.chars().count().cmp(&a.source.chars().count()))
            });
            chosen_name_exact = covering.first().copied();
        }
        if chosen_name_exact.is_none() {
            let mut exact_cands: Vec<&TransNameMatch> = Vec::new();
            let selected_len = selected_norm.chars().count();
            for &nm in &related_name_matches {
                let target_norm = normalize_for_compare(&nm.target);
                if selected_norm.is_empty() || target_norm.is_empty() {
                    continue;
                }
                let target_len = target_norm.chars().count();
                let is_exact = selected_norm == target_norm;
                let min_partial = (((target_len as f64) * 0.45) as usize).max(2);
                let is_partial =
                    target_norm.contains(&selected_norm) && selected_len >= min_partial;
                if is_exact || is_partial {
                    exact_cands.push(nm);
                }
            }
            if !exact_cands.is_empty() {
                exact_cands.sort_by(|a, b| {
                    b.target
                        .chars()
                        .count()
                        .cmp(&a.target.chars().count())
                        .then_with(|| b.source.chars().count().cmp(&a.source.chars().count()))
                });
                chosen_name_exact = exact_cands.first().copied();
            }
        }
    }

    let build_suggestions = |source_start: usize,
                             source_end: usize,
                             candidate_source: &str,
                             row_sources: &[&str]|
     -> Vec<String> {
        let mut suggestion_sources: Vec<String> = Vec::new();
        let cand_clean = strip_edge_punctuation(candidate_source);
        if !cand_clean.is_empty() {
            suggestion_sources.push(cand_clean);
        }
        let span_raw = slice_chars(&source_raw, source_start, source_end);
        for nm in &related_name_matches {
            let src = strip_edge_punctuation(nm.source.trim());
            if !src.is_empty() && span_raw.contains(&src) {
                suggestion_sources.push(src);
            }
        }
        for &row_src in row_sources.iter().take(8) {
            let src = strip_edge_punctuation(row_src.trim());
            if !src.is_empty() {
                suggestion_sources.push(src);
            }
        }
        // Quét các cụm chữ Hán dài 2..=6 ký tự trong span_raw
        let mut run = String::new();
        for ch in span_raw.chars() {
            if is_cjk_char(ch) {
                run.push(ch);
            } else {
                let run_len = run.chars().count();
                if (2..=6).contains(&run_len) {
                    suggestion_sources.push(run.clone());
                }
                run.clear();
            }
        }
        let run_len = run.chars().count();
        if (2..=6).contains(&run_len) {
            suggestion_sources.push(run);
        }

        let mut dedup = Vec::new();
        let mut seen = HashSet::new();
        for src in suggestion_sources {
            if src.is_empty() || contains_name_split_delimiter(&src) || !seen.insert(src.clone()) {
                continue;
            }
            dedup.push(src);
            if dedup.len() >= 8 {
                break;
            }
        }
        dedup
    };

    let mut token_rows: Vec<&TranslationTokenMapRow> = token_map
        .iter()
        .filter(|row| {
            row.token_type != 4
                && !strip_edge_punctuation(row.source_text.trim()).is_empty()
                && !strip_edge_punctuation(row.target_text.trim()).is_empty()
        })
        .collect();
    token_rows.sort_by(|a, b| {
        a.target_start
            .cmp(&b.target_start)
            .then_with(|| a.target_end.cmp(&b.target_end))
    });

    let mode_norm = translation_mode.trim().to_ascii_lowercase();
    if matches!(mode_norm.as_str(), "local" | "hanviet" | "dichngay_local")
        && !token_rows.is_empty()
    {
        let overlaps = select_cover_slice(
            &token_rows,
            start,
            end,
            |r| r.target_start,
            |r| r.target_end,
        );
        if !overlaps.is_empty() {
            let mut chosen_rows = overlaps;
            let mut match_type = "local_token_cover".to_owned();
            let mut score_value = 0.97;

            if !related_name_matches.is_empty() {
                let mut sorted_names = related_name_matches.clone();
                sorted_names.sort_by(|a, b| {
                    let ova = a.end.min(end).saturating_sub(a.start.max(start));
                    let ovb = b.end.min(end).saturating_sub(b.start.max(start));
                    ovb.cmp(&ova)
                        .then_with(|| b.target.chars().count().cmp(&a.target.chars().count()))
                });
                let best_name = sorted_names[0];
                let name_pool: Vec<&TranslationTokenMapRow> = token_rows
                    .iter()
                    .copied()
                    .filter(|u| u.target_end > best_name.start && u.target_start < best_name.end)
                    .collect();
                let name_tokens = select_cover_slice(
                    &name_pool,
                    best_name.start,
                    best_name.end,
                    |r| r.target_start,
                    |r| r.target_end,
                );
                if !name_tokens.is_empty() && best_name.start <= start && best_name.end >= end {
                    chosen_rows = name_tokens;
                    match_type = "local_name_token_cover".to_owned();
                    score_value = 1.0;
                }
            }

            let source_start = chosen_rows
                .iter()
                .map(|r| r.source_start)
                .min()
                .unwrap_or(0);
            let source_end = chosen_rows.iter().map(|r| r.source_end).max().unwrap_or(0);
            let target_start = chosen_rows
                .iter()
                .map(|r| r.target_start)
                .min()
                .unwrap_or(0);
            let target_end = chosen_rows.iter().map(|r| r.target_end).max().unwrap_or(0);
            let mut source_candidate = strip_edge_punctuation(
                chosen_rows
                    .iter()
                    .map(|r| r.source_text.as_str())
                    .collect::<String>()
                    .trim(),
            );
            if source_candidate.is_empty() {
                source_candidate = strip_edge_punctuation(
                    slice_chars(&source_raw, source_start, source_end).trim(),
                );
            }
            let mut target_candidate =
                strip_edge_punctuation(slice_chars(&source_trans, target_start, target_end).trim());
            if target_candidate.is_empty() {
                target_candidate = strip_edge_punctuation(&selected);
            }

            if let Some(exact) = chosen_name_exact {
                let chosen_source_name = strip_edge_punctuation(exact.source.trim());
                let chosen_target_name = cleaned_set
                    .get(&chosen_source_name)
                    .map(|s| s.trim())
                    .unwrap_or("");
                let chosen_target_main = pick_primary_translation_value(chosen_target_name);
                if !chosen_source_name.is_empty() && !chosen_target_main.is_empty() {
                    source_candidate = chosen_source_name;
                    target_candidate = chosen_target_main;
                    match_type = "name_exact_target".to_owned();
                    score_value = 1.0;
                }
            }

            let candidate_rows: Vec<SourceCandidateScore> = chosen_rows
                .iter()
                .take(6)
                .filter_map(|u| {
                    let s = strip_edge_punctuation(u.source_text.trim());
                    if s.is_empty() {
                        return None;
                    }
                    let ov = u
                        .target_end
                        .min(end)
                        .saturating_sub(u.target_start.max(start));
                    Some(SourceCandidateScore {
                        source: s,
                        score: ov as f64,
                    })
                })
                .collect();
            let row_sources: Vec<&str> =
                chosen_rows.iter().map(|r| r.source_text.as_str()).collect();
            let unit_start = chosen_rows.iter().map(|r| r.unit_index).min().unwrap_or(0) as isize;
            let unit_end = chosen_rows.iter().map(|r| r.unit_index).max().unwrap_or(0) as isize;

            return SelectionNameMapResult {
                selected_text: selected,
                source_candidate: source_candidate.clone(),
                target_candidate,
                match_type,
                score: score_value,
                source_context: text_snippet(
                    &source_raw,
                    source_start as isize,
                    source_end as isize,
                    56,
                ),
                translated_context: text_snippet(
                    &source_trans,
                    target_start as isize,
                    target_end as isize,
                    56,
                ),
                unit_start,
                unit_end,
                name_suggestions: build_suggestions(
                    source_start,
                    source_end,
                    &source_candidate,
                    &row_sources,
                ),
                candidates: candidate_rows,
            };
        }
    }

    let mut units: Vec<&TranslationUnitMapRow> = unit_map.iter().collect();
    units.sort_by_key(|u| u.unit_index);
    let overlaps: Vec<&TranslationUnitMapRow> = units
        .iter()
        .copied()
        .filter(|u| u.target_end > start && u.target_start < end)
        .collect();

    if overlaps.is_empty() {
        return SelectionNameMapResult {
            selected_text: selected.clone(),
            source_candidate: String::new(),
            target_candidate: selected,
            match_type: "unit_map_missing".to_owned(),
            score: 0.0,
            source_context: String::new(),
            translated_context: text_snippet(&source_trans, start as isize, end as isize, 56),
            unit_start: -1,
            unit_end: -1,
            name_suggestions: Vec::new(),
            candidates: Vec::new(),
        };
    }

    let mut chosen_units = overlaps.clone();
    let mut match_type = "unit_best_overlap".to_owned();
    let mut score_value = 0.9;

    if !related_name_matches.is_empty() {
        let mut sorted_names = related_name_matches.clone();
        sorted_names.sort_by(|a, b| {
            let ova = a.end.min(end).saturating_sub(a.start.max(start));
            let ovb = b.end.min(end).saturating_sub(b.start.max(start));
            ovb.cmp(&ova)
                .then_with(|| b.target.chars().count().cmp(&a.target.chars().count()))
        });
        let best_name = sorted_names[0];
        let name_units: Vec<&TranslationUnitMapRow> = units
            .iter()
            .copied()
            .filter(|u| u.target_end > best_name.start && u.target_start < best_name.end)
            .collect();
        if !name_units.is_empty() {
            chosen_units = vec![choose_best_unit(
                &name_units,
                best_name.start,
                best_name.end,
            )];
            match_type = "name_unit_cover".to_owned();
            score_value = 1.0;
        }
    }

    let chosen = if chosen_units.len() > 1 {
        choose_best_unit(&chosen_units, start, end)
    } else {
        chosen_units[0]
    };

    let mut source_start = chosen.source_start;
    let mut source_end = chosen.source_end;
    let mut target_start = chosen.target_start;
    let mut target_end = chosen.target_end;

    let unit_source_value = |u: &TranslationUnitMapRow| -> String {
        if !u.source_text.trim().is_empty() {
            u.source_text.clone()
        } else if u.source_end > u.source_start {
            slice_chars(&source_raw, u.source_start, u.source_end)
        } else {
            String::new()
        }
    };
    let unit_target_value = |u: &TranslationUnitMapRow| -> String {
        if !u.target_text.trim().is_empty() {
            u.target_text.clone()
        } else if u.target_end > u.target_start {
            slice_chars(&source_trans, u.target_start, u.target_end)
        } else {
            String::new()
        }
    };

    struct ServerChoice {
        source_candidate: String,
        target_candidate: String,
        source_start: usize,
        source_end: usize,
        target_start: usize,
        target_end: usize,
        match_type: String,
        score: f64,
    }

    let mut server_choice: Option<ServerChoice> = None;
    if mode_norm == TM_TRANSLATE_BETA_MODE && chosen_name_exact.is_none() {
        let chosen_source_text = unit_source_value(chosen);
        let chosen_target_text = unit_target_value(chosen);
        let predicted = tm_beta_predict_name_source(
            &chosen_source_text,
            &chosen_target_text,
            start.saturating_sub(target_start),
            end.saturating_sub(target_start),
            hanviet_map,
            &cleaned_set,
        );
        if predicted.refined && !predicted.source.trim().is_empty() {
            let p_score = if predicted.method.contains("hanviet") {
                0.98
            } else {
                0.96
            };
            let t_cand = if predicted.target.trim().is_empty() {
                selected.clone()
            } else {
                predicted.target.trim().to_owned()
            };
            server_choice = Some(ServerChoice {
                source_candidate: predicted.source.trim().to_owned(),
                target_candidate: t_cand,
                source_start: source_start + predicted.raw_start,
                source_end: source_start + predicted.raw_end,
                target_start: target_start + predicted.target_start,
                target_end: target_start + predicted.target_end,
                match_type: format!("tm_beta_{}", predicted.method),
                score: p_score,
            });
        }
    }

    if matches!(mode_norm.as_str(), "server" | TM_TRANSLATE_BETA_MODE)
        && chosen_name_exact.is_none()
    {
        let chosen_target_full = strip_edge_punctuation(unit_target_value(chosen).trim());
        let chosen_target_norm = normalize_for_compare(&chosen_target_full);
        if !(selected_norm.is_empty()
            || chosen_target_norm.is_empty()
            || chosen_target_norm.contains(&selected_norm)
            || selected_norm.contains(&chosen_target_norm))
        {
            return SelectionNameMapResult {
                selected_text: selected.clone(),
                source_candidate: String::new(),
                target_candidate: selected,
                match_type: "unit_text_mismatch".to_owned(),
                score: 0.0,
                source_context: String::new(),
                translated_context: text_snippet(&source_trans, start as isize, end as isize, 56),
                unit_start: chosen.unit_index as isize,
                unit_end: chosen.unit_index as isize,
                name_suggestions: Vec::new(),
                candidates: Vec::new(),
            };
        }

        if server_choice.is_none() {
            let unit_name_matches: Vec<&TransNameMatch> = name_matches
                .iter()
                .filter(|nm| nm.end > target_start && nm.start < target_end)
                .collect();
            if let Some(sub) = try_pick_unit_subsegment(
                chosen,
                &unit_name_matches,
                start,
                end,
                &source_raw,
                &source_trans,
                &selected,
            ) {
                server_choice = Some(ServerChoice {
                    source_candidate: sub.0,
                    target_candidate: sub.1,
                    source_start: sub.2,
                    source_end: sub.3,
                    target_start: sub.4,
                    target_end: sub.5,
                    match_type: "anchored_fragment_cover".to_owned(),
                    score: 0.97,
                });
            }
        }
    }

    let (mut source_candidate, mut target_candidate) = if let Some(sc) = server_choice {
        source_start = sc.source_start;
        source_end = sc.source_end;
        target_start = sc.target_start;
        target_end = sc.target_end;
        match_type = sc.match_type;
        score_value = sc.score;
        let s_cand = strip_edge_punctuation(sc.source_candidate.trim());
        let mut t_cand = strip_edge_punctuation(sc.target_candidate.trim());
        if t_cand.is_empty() {
            t_cand = strip_edge_punctuation(&selected);
        }
        (s_cand, t_cand)
    } else {
        let mut s_cand = strip_edge_punctuation(chosen.source_text.trim());
        if s_cand.is_empty() {
            s_cand =
                strip_edge_punctuation(slice_chars(&source_raw, source_start, source_end).trim());
        }
        let mut t_cand = strip_edge_punctuation(chosen.target_text.trim());
        if t_cand.is_empty() {
            t_cand =
                strip_edge_punctuation(slice_chars(&source_trans, target_start, target_end).trim());
            if t_cand.is_empty() {
                t_cand = strip_edge_punctuation(&selected);
            }
        }
        (s_cand, t_cand)
    };

    if let Some(exact) = chosen_name_exact {
        let chosen_source_name = strip_edge_punctuation(exact.source.trim());
        let chosen_target_name = cleaned_set
            .get(&chosen_source_name)
            .map(|s| s.trim())
            .unwrap_or("");
        let chosen_target_main = pick_primary_translation_value(chosen_target_name);
        if !chosen_source_name.is_empty() && !chosen_target_main.is_empty() {
            source_candidate = chosen_source_name;
            target_candidate = chosen_target_main;
            match_type = "name_exact_target".to_owned();
            score_value = 1.0;
        }
    }

    let candidate_rows: Vec<SourceCandidateScore> = overlaps
        .iter()
        .take(6)
        .filter_map(|u| {
            let s = strip_edge_punctuation(u.source_text.trim());
            if s.is_empty() {
                return None;
            }
            let ov = u
                .target_end
                .min(end)
                .saturating_sub(u.target_start.max(start));
            Some(SourceCandidateScore {
                source: s,
                score: ov as f64,
            })
        })
        .collect();
    let overlap_sources: Vec<&str> = overlaps.iter().map(|u| u.source_text.as_str()).collect();

    SelectionNameMapResult {
        selected_text: selected,
        source_candidate: source_candidate.clone(),
        target_candidate,
        match_type,
        score: score_value,
        source_context: text_snippet(&source_raw, source_start as isize, source_end as isize, 56),
        translated_context: text_snippet(
            &source_trans,
            target_start as isize,
            target_end as isize,
            56,
        ),
        unit_start: chosen.unit_index as isize,
        unit_end: chosen.unit_index as isize,
        name_suggestions: build_suggestions(
            source_start,
            source_end,
            &source_candidate,
            &overlap_sources,
        ),
        candidates: candidate_rows,
    }
}

fn try_pick_unit_subsegment(
    chosen_unit: &TranslationUnitMapRow,
    unit_name_rows: &[&TransNameMatch],
    start: usize,
    end: usize,
    source_raw: &str,
    source_trans: &str,
    selected: &str,
) -> Option<(String, String, usize, usize, usize, usize)> {
    let source_start_all = chosen_unit.source_start;
    let source_end_all = chosen_unit.source_end;
    let target_start_all = chosen_unit.target_start;
    let target_end_all = chosen_unit.target_end;

    let mut source_hits: Vec<_> = chosen_unit
        .name_hits
        .iter()
        .filter(|h| h.end > source_start_all && h.start < source_end_all)
        .collect();
    source_hits.sort_by(|a, b| a.start.cmp(&b.start).then_with(|| a.end.cmp(&b.end)));

    let mut target_hits: Vec<&TransNameMatch> = unit_name_rows
        .iter()
        .copied()
        .filter(|r| r.end > target_start_all && r.start < target_end_all)
        .collect();
    target_hits.sort_by(|a, b| a.start.cmp(&b.start).then_with(|| a.end.cmp(&b.end)));

    let pair_count = source_hits.len().min(target_hits.len());
    if pair_count == 0 {
        return None;
    }

    #[derive(Clone, Copy)]
    struct Fragment {
        source_start: usize,
        source_end: usize,
        target_start: usize,
        target_end: usize,
    }

    let mut fragments = Vec::new();
    for idx in 0..pair_count {
        let sh = source_hits[idx];
        let th = target_hits[idx];
        fragments.push(Fragment {
            source_start: sh.start,
            source_end: sh.end,
            target_start: th.start,
            target_end: th.end,
        });
        if idx + 1 < pair_count {
            let next_sh = source_hits[idx + 1];
            let next_th = target_hits[idx + 1];
            if next_sh.start > sh.end && next_th.start > th.end {
                fragments.push(Fragment {
                    source_start: sh.end,
                    source_end: next_sh.start,
                    target_start: th.end,
                    target_end: next_th.start,
                });
            }
        }
    }

    let mut touched: Vec<Fragment> = fragments
        .into_iter()
        .filter(|f| f.target_end > start && f.target_start < end)
        .collect();
    if touched.is_empty() {
        return None;
    }
    touched.sort_by(|a, b| {
        a.target_start
            .cmp(&b.target_start)
            .then_with(|| a.target_end.cmp(&b.target_end))
    });

    let mut covered_until = start;
    for frag in &touched {
        if frag.target_start > covered_until {
            return None;
        }
        covered_until = covered_until.max(frag.target_end);
        if covered_until >= end {
            break;
        }
    }
    if covered_until < end {
        return None;
    }

    let src_s = touched.iter().map(|f| f.source_start).min()?;
    let src_e = touched.iter().map(|f| f.source_end).max()?;
    let tgt_s = touched.iter().map(|f| f.target_start).min()?;
    let tgt_e = touched.iter().map(|f| f.target_end).max()?;

    let source_cand = strip_edge_punctuation(slice_chars(source_raw, src_s, src_e).trim());
    let mut target_cand = strip_edge_punctuation(slice_chars(source_trans, tgt_s, tgt_e).trim());
    if target_cand.is_empty() {
        target_cand = strip_edge_punctuation(selected);
    }
    if source_cand.is_empty() || target_cand.is_empty() {
        return None;
    }
    Some((source_cand, target_cand, src_s, src_e, tgt_s, tgt_e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::translate::name_set::NameHit;

    #[test]
    fn maps_selection_to_exact_name_and_anchored_subsegment() {
        let raw = "萧炎与韩立在云岚宗相遇。";
        let trans = "Tiêu Viêm cùng Hàn Lập tại Vân Lam Tông gặp nhau.";
        let mut names = BTreeMap::new();
        names.insert("萧炎".into(), "Tiêu Viêm".into());
        names.insert("云岚宗".into(), "Vân Lam Tông".into());

        let unit_map = vec![TranslationUnitMapRow {
            unit_index: 0,
            source_text: raw.into(),
            processed_source_text: raw.into(),
            target_placeholder_text: trans.into(),
            target_text: trans.into(),
            source_start: 0,
            source_end: raw.chars().count(),
            target_start: 0,
            target_end: trans.chars().count(),
            name_hits: vec![
                NameHit {
                    start: 0,
                    end: 2,
                    source: "萧炎".into(),
                    target: "Tiêu Viêm".into(),
                },
                NameHit {
                    start: 6,
                    end: 9,
                    source: "云岚宗".into(),
                    target: "Vân Lam Tông".into(),
                },
            ],
        }];

        // 1) Bôi đen trúng Name đã có "Vân Lam Tông" -> trả đúng cặp "云岚宗" = "Vân Lam Tông"
        let vlt_start = trans.find("Vân Lam Tông").unwrap();
        let char_start = trans[..vlt_start].chars().count() as isize;
        let char_end = char_start + "Vân Lam Tông".chars().count() as isize;
        let exact = map_selection_to_name_source(
            raw,
            trans,
            "Vân Lam Tông",
            char_start,
            char_end,
            &names,
            &unit_map,
            &[],
            "server",
            None,
        );
        assert_eq!(exact.match_type, "name_exact_target");
        assert_eq!(exact.source_candidate, "云岚宗");
        assert_eq!(exact.target_candidate, "Vân Lam Tông");

        // 2) Bôi đen phần gap nằm giữa 2 Name đã neo ("cùng Hàn Lập tại") -> anchored_fragment_cover
        let gap_byte = trans.find("cùng Hàn Lập tại").unwrap();
        let g_start = trans[..gap_byte].chars().count() as isize;
        let g_end = g_start + "cùng Hàn Lập tại".chars().count() as isize;
        let sub = map_selection_to_name_source(
            raw,
            trans,
            "cùng Hàn Lập tại",
            g_start,
            g_end,
            &names,
            &unit_map,
            &[],
            "server",
            None,
        );
        assert_eq!(sub.match_type, "anchored_fragment_cover");
        assert_eq!(sub.source_candidate, "与韩立在");
    }

    #[test]
    fn tm_beta_refines_name_source_using_hanviet_and_name_anchors() {
        let raw = "沈庄走进云乡酒店，看向白修。";
        let trans = "Thẩm Trang bước vào khách sạn Vân Hương, nhìn về phía Bạch Tu.";
        let hv_map = HashMap::from([
            ("沈".into(), "thẩm".into()),
            ("庄".into(), "trang".into()),
            ("走".into(), "tẩu".into()),
            ("进".into(), "tiến".into()),
            ("云".into(), "vân".into()),
            ("乡".into(), "hương".into()),
            ("酒".into(), "tửu".into()),
            ("店".into(), "điếm".into()),
            ("看".into(), "khán".into()),
            ("向".into(), "hướng".into()),
            ("白".into(), "bạch".into()),
            ("修".into(), "tu".into()),
        ]);
        let names = BTreeMap::from([("沈庄".into(), "Thẩm Trang".into())]);

        let bt_byte = trans.find("Bạch Tu").unwrap();
        let bt_start = trans[..bt_byte].chars().count();
        let bt_end = bt_start + "Bạch Tu".chars().count();

        let pred = tm_beta_predict_name_source(raw, trans, bt_start, bt_end, Some(&hv_map), &names);
        assert!(pred.refined);
        assert_eq!(pred.source, "白修");
        assert_eq!(pred.target, "Bạch Tu");
        assert_eq!(pred.method, "punctuation-hanviet");
    }
}
