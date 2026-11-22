use std::collections::{BTreeMap, HashMap, HashSet};

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};

use crate::translate::dichngay::{
    TranslateBatchConfig, TranslationHttpTransport, translate_text_chunks,
};
use crate::translate::name_set::{
    NameHit, PlaceholderEntry, apply_name_placeholders, normalize_name_set,
    restore_name_placeholders,
};
use crate::translate::text::{
    CacheTokenKind, TM_TRANSLATE_BETA_MODE, build_text_units_with_offsets,
    capitalize_after_quote_vi, capitalize_tm_translate_text, lowercase_first_alpha,
    needs_server_translation, normalize_newlines, normalize_text_for_translation,
    normalize_translated_text, normalize_translation_cache_source, normalize_vi_punctuation,
    smart_capitalize_vi, source_starts_with_cjk, split_space_edges,
    split_text_for_translation_cache, starts_with_target_name, tokenize_tm_translate_text,
};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TranslationUnitMapRow {
    pub unit_index: usize,
    pub source_text: String,
    #[serde(default)]
    pub processed_source_text: String,
    #[serde(default)]
    pub target_placeholder_text: String,
    pub target_text: String,
    /// Chỉ số ký tự Unicode (`char` index) để tương thích 100% với Python `len()` và SQLite `translation_unit_map`.
    pub source_start: usize,
    pub source_end: usize,
    pub target_start: usize,
    pub target_end: usize,
    #[serde(default)]
    pub name_hits: Vec<NameHit>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TranslationTokenMapRow {
    #[serde(default)]
    pub unit_index: usize,
    pub source_text: String,
    pub target_text: String,
    pub source_start: usize,
    pub source_end: usize,
    pub target_start: usize,
    pub target_end: usize,
    #[serde(default)]
    pub token_type: i32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NameMapSummary {
    pub active_set: String,
    pub version: u32,
    pub size: usize,
    pub placeholders: Vec<PlaceholderEntry>,
    pub hits: Vec<NameHit>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TranslationDetailedResult {
    pub source_text: String,
    pub processed_text: String,
    pub translated_with_placeholders: String,
    pub translated: String,
    pub mode: String,
    pub unit_map: Vec<TranslationUnitMapRow>,
    #[serde(default)]
    pub token_map: Vec<TranslationTokenMapRow>,
    pub name_map: NameMapSummary,
    #[serde(default)]
    pub hanviet_source: String,
    pub trans_sig: String,
    pub cache_hit_count: usize,
    pub missing_count: usize,
    pub stored_count: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TranslationSignatureOptions {
    pub mode: String,
    pub active_set_name: String,
    pub name_set_version: u32,
    pub effective_name_set: BTreeMap<String, String>,
    pub vp_set: BTreeMap<String, String>,
    pub source_lang_override: String,
}

impl Default for TranslationSignatureOptions {
    fn default() -> Self {
        Self {
            mode: "server".to_owned(),
            active_set_name: "Mặc định".to_owned(),
            name_set_version: 1,
            effective_name_set: BTreeMap::new(),
            vp_set: BTreeMap::new(),
            source_lang_override: String::new(),
        }
    }
}

/// Giao diện tra cứu và lưu trữ Translation Memory theo lô.
pub trait TranslationMemoryStore {
    fn lookup_batch(
        &mut self,
        source_texts: &[String],
        mode: &str,
        trans_sig: &str,
    ) -> HashMap<String, String>;

    fn store_batch(&mut self, entries: &[(String, String)], mode: &str, trans_sig: &str) -> usize;
}

pub fn normalize_translation_mode(mode: &str) -> &'static str {
    let m = mode.trim().to_ascii_lowercase();
    match m.as_str() {
        "google" | "gg" | "gg_translate" | "google_translate" => "google_translate",
        "tm_translate_beta" => TM_TRANSLATE_BETA_MODE,
        "local" => "local",
        "hanviet" => "hanviet",
        "dichngay_local" => "dichngay_local",
        "vbook_ext" => "vbook_ext",
        _ => "server",
    }
}

/// Tạo JSON payload cho `translation_signature` khớp 100% với `reader_server.py::translation_signature_payload`
/// (cả `text_norm_version=9` cho `server` và `text_norm_version=10`, `tm_translate_script_version="3.5.5.18_beta"` cho `tm_translate_beta`).
pub fn translation_signature_payload(opts: &TranslationSignatureOptions) -> Value {
    let mode_norm = normalize_translation_mode(&opts.mode);
    let clean_names = normalize_name_set(&opts.effective_name_set);
    let mut name_map = Map::new();
    for (k, v) in clean_names {
        name_map.insert(k, Value::String(v));
    }

    let mut map = Map::new();
    map.insert(
        "active_set".into(),
        Value::String(if opts.active_set_name.trim().is_empty() {
            "Mặc định".to_owned()
        } else {
            opts.active_set_name.clone()
        }),
    );
    map.insert("mode".into(), Value::String(mode_norm.to_owned()));
    map.insert("name_set".into(), Value::Object(name_map));
    map.insert(
        "text_norm_version".into(),
        Value::Number(
            (if mode_norm == TM_TRANSLATE_BETA_MODE {
                10
            } else {
                9
            })
            .into(),
        ),
    );
    if mode_norm == TM_TRANSLATE_BETA_MODE {
        map.insert(
            "tm_translate_script_version".into(),
            Value::String("3.5.5.18_beta".into()),
        );
    }
    map.insert(
        "version".into(),
        Value::Number(opts.name_set_version.max(1).into()),
    );
    if matches!(mode_norm, "local" | "dichngay_local") {
        let clean_vp = normalize_name_set(&opts.vp_set);
        let mut vp_map = Map::new();
        for (k, v) in clean_vp {
            vp_map.insert(k, Value::String(v));
        }
        map.insert("vp_set".into(), Value::Object(vp_map));
    }
    if mode_norm == "google_translate" {
        let sl = if opts.source_lang_override.trim().is_empty() {
            "auto".to_owned()
        } else {
            opts.source_lang_override.trim().to_ascii_lowercase()
        };
        map.insert(
            "google_translate".into(),
            json!({
                "endpoint": "translate.googleapis.com/translate_a/single",
                "source_lang": sl,
                "target_lang": "vi",
            }),
        );
    }
    Value::Object(map)
}

/// Băm SHA-1 (40 ký tự hex thường) thuần Rust theo chuẩn FIPS 180-4,
/// dùng cho `source_hash` của `translation_memory` và `trans_sig` của `reader_server.py`.
pub fn sha1_hex(data: &[u8]) -> String {
    let mut h0: u32 = 0x67452301;
    let mut h1: u32 = 0xEFCDAB89;
    let mut h2: u32 = 0x98BADCFE;
    let mut h3: u32 = 0x10325476;
    let mut h4: u32 = 0xC3D2E1F0;

    let bit_len = (data.len() as u64).wrapping_mul(8);
    let mut padded = Vec::with_capacity(data.len() + 72);
    padded.extend_from_slice(data);
    padded.push(0x80);
    while (padded.len() % 64) != 56 {
        padded.push(0);
    }
    padded.extend_from_slice(&bit_len.to_be_bytes());

    for chunk in padded.chunks_exact(64) {
        let mut w = [0u32; 80];
        for (i, word) in chunk.chunks_exact(4).enumerate() {
            w[i] = u32::from_be_bytes([word[0], word[1], word[2], word[3]]);
        }
        for i in 16..80 {
            w[i] = (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]).rotate_left(1);
        }

        let mut a = h0;
        let mut b = h1;
        let mut c = h2;
        let mut d = h3;
        let mut e = h4;

        for (i, &wi) in w.iter().enumerate() {
            let (f, k) = match i {
                0..=19 => ((b & c) | ((!b) & d), 0x5A827999u32),
                20..=39 => (b ^ c ^ d, 0x6ED9EBA1u32),
                40..=59 => ((b & c) | (b & d) | (c & d), 0x8F1BBCDCu32),
                _ => (b ^ c ^ d, 0xCA62C1D6u32),
            };
            let temp = a
                .rotate_left(5)
                .wrapping_add(f)
                .wrapping_add(e)
                .wrapping_add(k)
                .wrapping_add(wi);
            e = d;
            d = c;
            c = b.rotate_left(30);
            b = a;
            a = temp;
        }

        h0 = h0.wrapping_add(a);
        h1 = h1.wrapping_add(b);
        h2 = h2.wrapping_add(c);
        h3 = h3.wrapping_add(d);
        h4 = h4.wrapping_add(e);
    }

    format!("{h0:08x}{h1:08x}{h2:08x}{h3:08x}{h4:08x}")
}

/// Tạo `translation_signature` khớp 100% với `json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))` + SHA-1.
pub fn translation_signature(opts: &TranslationSignatureOptions) -> String {
    let payload = translation_signature_payload(opts);
    // serde_json::Value::Object dùng BTreeMap theo mặc định nên keys đã sort_keys=True,
    // và serde_json::to_string xuất compact separators=(",", ":") cùng UTF-8 (ensure_ascii=False).
    let raw = serde_json::to_string(&payload).unwrap_or_default();
    sha1_hex(raw.as_bytes())
}

pub fn chapter_trans_signature(base_sig: &str, junk_version: u32) -> String {
    let norm = if base_sig.trim().is_empty() {
        "raw"
    } else {
        base_sig.trim()
    };
    format!("{norm}|junk:v{}", junk_version.max(1))
}

pub fn should_lowercase_after_comma(
    prev_piece: &str,
    source_text: &str,
    translated_text: &str,
    unit_hits: &[NameHit],
    protected_name_targets: &[String],
) -> bool {
    let prev_trimmed = prev_piece.trim_end();
    if !(prev_trimmed.ends_with(',')
        || prev_trimmed.ends_with('，')
        || prev_trimmed.ends_with('、'))
    {
        return false;
    }
    if !source_starts_with_cjk(source_text) {
        return false;
    }
    let core_lstrip = translated_text.trim_start();
    if core_lstrip.is_empty() {
        return false;
    }
    for hit in unit_hits {
        if starts_with_target_name(core_lstrip, &hit.target) {
            return false;
        }
    }
    for target_name in protected_name_targets {
        if starts_with_target_name(core_lstrip, target_name) {
            return false;
        }
    }
    true
}

pub fn prepend_space_if_needed(prev_piece: &str, next_piece: &str) -> String {
    if prev_piece.is_empty() || next_piece.is_empty() {
        return next_piece.to_owned();
    }
    if next_piece.chars().next().is_some_and(|c| c.is_whitespace()) {
        return next_piece.to_owned();
    }
    if prev_piece.ends_with([' ', '\t', '\n']) {
        return next_piece.to_owned();
    }
    let next_head = next_piece.trim_start();
    if let Some(first_head) = next_head.chars().next()
        && matches!(
            first_head,
            ',' | '.'
                | ';'
                | ':'
                | '!'
                | '?'
                | '…'
                | ')'
                | ']'
                | '}'
                | '”'
                | '’'
                | '»'
                | '"'
                | '\''
        )
    {
        return next_piece.to_owned();
    }
    if let Some(last_prev) = prev_piece.chars().last()
        && matches!(last_prev, ',' | '.' | ';' | ':' | '!' | '?' | '…')
    {
        return format!(" {next_piece}");
    }
    next_piece.to_owned()
}

fn protected_targets_from_name_set(name_set: &BTreeMap<String, String>) -> Vec<String> {
    let mut set: HashSet<String> = HashSet::new();
    for v in name_set.values() {
        let trimmed = v.trim();
        if !trimmed.is_empty() {
            set.insert(trimmed.to_owned());
        }
    }
    let mut list: Vec<String> = set.into_iter().collect();
    list.sort_by(|a, b| {
        b.chars()
            .count()
            .cmp(&a.chars().count())
            .then_with(|| a.cmp(b))
    });
    list
}

/// Luồng dịch `tm_translate_beta` đồng bộ với `reader_server.py::_translate_tm_beta_detailed` và `TM Translate.user.js`.
pub fn translate_tm_beta_detailed(
    source_raw: &str,
    sig_opts: &TranslationSignatureOptions,
    batch_cfg: &TranslateBatchConfig,
    tm_store: Option<&mut dyn TranslationMemoryStore>,
    transport: Option<&mut dyn TranslationHttpTransport>,
) -> TranslationDetailedResult {
    let source = normalize_text_for_translation(source_raw).trim().to_owned();
    let name_set = normalize_name_set(&sig_opts.effective_name_set);
    let mut beta_opts = sig_opts.clone();
    beta_opts.mode = TM_TRANSLATE_BETA_MODE.to_owned();
    beta_opts.effective_name_set = name_set.clone();
    let trans_sig = translation_signature(&beta_opts);

    if source.is_empty() {
        return empty_detailed_result(TM_TRANSLATE_BETA_MODE, &beta_opts, trans_sig);
    }

    let (processed_text, placeholder_map, hits) = apply_name_placeholders(&source, &name_set);
    let source_lines: Vec<&str> = source.split('\n').collect();
    let processed_lines: Vec<&str> = processed_text.split('\n').collect();

    struct LineRow {
        line_index: usize,
        source_text: String,
        processed_source_text: String,
        tokens: Vec<(String, String)>,
        token_indexes: Vec<usize>,
        source_start: usize,
        source_end: usize,
    }

    let mut line_rows = Vec::with_capacity(source_lines.len());
    let mut text_tokens: Vec<String> = Vec::new();
    let mut source_cursor = 0usize;

    for (line_index, &raw_line) in source_lines.iter().enumerate() {
        let processed_line = processed_lines.get(line_index).copied().unwrap_or(raw_line);
        let raw_len_chars = raw_line.chars().count();
        let lstripped = raw_line.trim_start();
        let rstripped = raw_line.trim_end();
        let left_size = raw_len_chars - lstripped.chars().count();
        let right_size = raw_len_chars - rstripped.chars().count();
        let source_start = source_cursor + left_size;
        let source_end = if right_size > 0 {
            (source_cursor + raw_len_chars).saturating_sub(right_size)
        } else {
            source_cursor + raw_len_chars
        };
        let raw_trimmed = raw_line.trim().to_owned();
        let processed_trimmed = processed_line.trim().to_owned();
        let tokens = if processed_trimmed.is_empty() {
            Vec::new()
        } else {
            tokenize_tm_translate_text(&processed_trimmed)
        };
        let mut token_indexes = Vec::new();
        for (kind, token) in &tokens {
            if kind != "text" || token.trim().is_empty() {
                continue;
            }
            token_indexes.push(text_tokens.len());
            text_tokens.push(token.clone());
        }
        line_rows.push(LineRow {
            line_index,
            source_text: raw_trimmed,
            processed_source_text: processed_trimmed,
            tokens,
            token_indexes,
            source_start,
            source_end,
        });
        source_cursor += raw_len_chars + usize::from(line_index + 1 < source_lines.len());
    }

    let mut unique_tokens = Vec::new();
    let mut seen_tokens = HashSet::new();
    let mut resolved: HashMap<String, String> = HashMap::new();
    for token in &text_tokens {
        let key = normalize_translation_cache_source(token);
        if key.is_empty() || !seen_tokens.insert(key.clone()) {
            continue;
        }
        if needs_server_translation(&key) {
            unique_tokens.push(key);
        } else {
            resolved.insert(key.clone(), key);
        }
    }

    let mut tm_store = tm_store;
    if !unique_tokens.is_empty()
        && let Some(store) = tm_store.as_deref_mut()
    {
        let cached = store.lookup_batch(&unique_tokens, TM_TRANSLATE_BETA_MODE, &trans_sig);
        for (raw_key, raw_val) in cached {
            let key = normalize_translation_cache_source(&raw_key);
            let val = normalize_translated_text(&normalize_newlines(&raw_val));
            if !key.is_empty() && !val.is_empty() {
                resolved.insert(key, val);
            }
        }
    }

    let missing: Vec<String> = unique_tokens
        .iter()
        .filter(|&k| !resolved.contains_key(k))
        .cloned()
        .collect();
    let mut stored_count = 0usize;
    if !missing.is_empty() {
        let translated_list = if let Some(http) = transport {
            translate_text_chunks(&missing, batch_cfg, http)
        } else {
            missing.clone()
        };
        let mut pending_store = Vec::new();
        for (idx, key) in missing.iter().enumerate() {
            let mut translated =
                normalize_newlines(translated_list.get(idx).map(String::as_str).unwrap_or(key));
            if translated.is_empty() || translated.starts_with("[Lỗi") {
                translated = key.clone();
            }
            if &translated != key {
                pending_store.push((key.clone(), translated.clone()));
            }
            resolved.insert(key.clone(), translated);
        }
        if !pending_store.is_empty()
            && let Some(store) = tm_store
        {
            stored_count = store.store_batch(&pending_store, TM_TRANSLATE_BETA_MODE, &trans_sig);
        }
    }

    let mut translated_lines = Vec::with_capacity(line_rows.len());
    let mut placeholder_lines = Vec::with_capacity(line_rows.len());
    let mut unit_map = Vec::new();
    let mut target_cursor = 0usize;
    let total_rows = line_rows.len();

    for row in line_rows {
        let mut token_idx_iter = row.token_indexes.into_iter();
        let mut placeholder_parts = Vec::with_capacity(row.tokens.len());
        for (kind, token) in row.tokens {
            if kind == "text" && !token.trim().is_empty() {
                if let Some(t_idx) = token_idx_iter.next() {
                    let key = normalize_translation_cache_source(&text_tokens[t_idx]);
                    placeholder_parts
                        .push(resolved.get(&key).cloned().unwrap_or_else(|| token.clone()));
                } else {
                    placeholder_parts.push(token);
                }
            } else {
                placeholder_parts.push(token);
            }
        }
        let placeholder_line = placeholder_parts.join("");
        let restored_line = restore_name_placeholders(&placeholder_line, &placeholder_map);
        let translated_line = capitalize_tm_translate_text(&restored_line);
        let translated_line_len = translated_line.chars().count();

        if !row.source_text.is_empty() {
            let unit_hits: Vec<NameHit> = hits
                .iter()
                .filter(|h| h.start < row.source_end && h.end > row.source_start)
                .cloned()
                .collect();
            unit_map.push(TranslationUnitMapRow {
                unit_index: row.line_index,
                source_text: row.source_text,
                processed_source_text: row.processed_source_text,
                target_placeholder_text: placeholder_line.clone(),
                target_text: translated_line.clone(),
                source_start: row.source_start,
                source_end: row.source_end,
                target_start: target_cursor,
                target_end: target_cursor + translated_line_len,
                name_hits: unit_hits,
            });
        }
        placeholder_lines.push(placeholder_line);
        translated_lines.push(translated_line);
        target_cursor += translated_line_len + usize::from(row.line_index + 1 < total_rows);
    }

    let translated = translated_lines.join("\n");
    let translated_with_placeholders = placeholder_lines.join("\n");
    let placeholders: Vec<PlaceholderEntry> = placeholder_map.into_values().collect();

    TranslationDetailedResult {
        source_text: source.clone(),
        processed_text,
        translated_with_placeholders,
        translated: if translated.is_empty() {
            source
        } else {
            translated
        },
        mode: TM_TRANSLATE_BETA_MODE.to_owned(),
        unit_map,
        token_map: Vec::new(),
        name_map: NameMapSummary {
            active_set: beta_opts.active_set_name,
            version: beta_opts.name_set_version.max(1),
            size: name_set.len(),
            placeholders,
            hits,
        },
        hanviet_source: String::new(),
        trans_sig,
        cache_hit_count: unique_tokens.len().saturating_sub(missing.len()),
        missing_count: missing.len(),
        stored_count,
    }
}

/// Luồng dịch `translate_detailed` đầy đủ (hỗ trợ cả `server` và `tm_translate_beta`),
/// tra cứu `translation_memory` trước khi gọi mạng, dựng `unit_map` với offset ký tự chuẩn xác
/// và xử lý viết hoa/thường sau dấu phẩy theo đúng `reader_server.py::translate_detailed`.
pub fn translate_detailed(
    text: &str,
    sig_opts: &TranslationSignatureOptions,
    batch_cfg: &TranslateBatchConfig,
    tm_store: Option<&mut dyn TranslationMemoryStore>,
    transport: Option<&mut dyn TranslationHttpTransport>,
) -> TranslationDetailedResult {
    let source = text.trim();
    let mode_norm = normalize_translation_mode(&sig_opts.mode);
    if mode_norm == TM_TRANSLATE_BETA_MODE {
        return translate_tm_beta_detailed(source, sig_opts, batch_cfg, tm_store, transport);
    }

    let name_set = normalize_name_set(&sig_opts.effective_name_set);
    let mut norm_opts = sig_opts.clone();
    norm_opts.mode = mode_norm.to_owned();
    norm_opts.effective_name_set = name_set.clone();
    let trans_sig = translation_signature(&norm_opts);

    if source.is_empty() {
        return empty_detailed_result(mode_norm, &norm_opts, trans_sig);
    }

    let (processed_text, placeholder_map, hits) = apply_name_placeholders(source, &name_set);
    let source_unit_infos = build_text_units_with_offsets(source);
    let mut units = split_text_for_translation_cache(&processed_text);
    if units.is_empty() {
        units.push((CacheTokenKind::Text, processed_text.clone()));
    }

    let mut resolved_core: HashMap<String, String> = HashMap::new();
    let mut uniq_lookup: Vec<String> = Vec::new();
    let mut seen_lookup: HashSet<String> = HashSet::new();

    for (kind, unit) in &units {
        if *kind != CacheTokenKind::Text {
            continue;
        }
        let (_, core, _) = split_space_edges(unit);
        let key = normalize_translation_cache_source(core);
        if key.is_empty() || resolved_core.contains_key(&key) {
            continue;
        }
        if !needs_server_translation(&key) {
            resolved_core.insert(key.clone(), key);
            continue;
        }
        if seen_lookup.insert(key.clone()) {
            uniq_lookup.push(key);
        }
    }

    let mut tm_store = tm_store;
    if !uniq_lookup.is_empty()
        && let Some(store) = tm_store.as_deref_mut()
    {
        let cached = store.lookup_batch(&uniq_lookup, mode_norm, &trans_sig);
        for (src_key, trans_val) in cached {
            let key = normalize_translation_cache_source(&src_key);
            let val = normalize_translated_text(&normalize_newlines(&trans_val));
            if !key.is_empty() && !val.is_empty() {
                resolved_core.insert(key, val);
            }
        }
    }

    let missing: Vec<String> = uniq_lookup
        .iter()
        .filter(|&x| !resolved_core.contains_key(x))
        .cloned()
        .collect();
    let cache_hit_count = uniq_lookup.len().saturating_sub(missing.len());
    let mut stored_count = 0usize;

    if !missing.is_empty() {
        let translated_list = if let Some(http) = transport {
            translate_text_chunks(&missing, batch_cfg, http)
        } else {
            missing.clone()
        };
        let mut to_store = Vec::new();
        for (idx, source_key) in missing.iter().enumerate() {
            let mut translated_piece = normalize_newlines(
                translated_list
                    .get(idx)
                    .map(String::as_str)
                    .unwrap_or(source_key),
            );
            if translated_piece.is_empty() || translated_piece.starts_with("[Lỗi") {
                translated_piece = source_key.clone();
            }
            if !translated_piece.is_empty()
                && &translated_piece != source_key
                && !translated_piece.starts_with("[Lỗi")
            {
                to_store.push((source_key.clone(), translated_piece.clone()));
            }
            resolved_core.insert(source_key.clone(), translated_piece);
        }
        if !to_store.is_empty()
            && let Some(store) = tm_store
        {
            stored_count = store.store_batch(&to_store, mode_norm, &trans_sig);
        }
    }

    let mut translated_parts: Vec<String> = Vec::new();
    let mut translated_placeholder_parts: Vec<String> = Vec::new();
    let mut unit_map: Vec<TranslationUnitMapRow> = Vec::new();
    let mut target_cursor = 0usize;
    let mut text_idx = 0usize;
    let protected_name_targets = protected_targets_from_name_set(&name_set);

    for (kind, unit) in &units {
        if *kind != CacheTokenKind::Text {
            translated_parts.push(unit.clone());
            translated_placeholder_parts.push(unit.clone());
            target_cursor += unit.chars().count();
            continue;
        }

        let (left, core, right) = split_space_edges(unit);
        let key = normalize_translation_cache_source(core);
        let translated_core = if key.is_empty() {
            core.to_owned()
        } else {
            resolved_core
                .get(&key)
                .cloned()
                .unwrap_or_else(|| key.clone())
        };
        let translated_core_with_placeholder = if translated_core.is_empty() {
            core
        } else {
            &translated_core
        };
        let raw_placeholder_piece = format!("{left}{translated_core_with_placeholder}{right}");
        let prev_placeholder = translated_placeholder_parts
            .last()
            .map(String::as_str)
            .unwrap_or("");
        let translated_placeholder_piece =
            prepend_space_if_needed(prev_placeholder, &raw_placeholder_piece);
        translated_placeholder_parts.push(translated_placeholder_piece.clone());

        let mut restored_core =
            restore_name_placeholders(translated_core_with_placeholder, &placeholder_map);
        restored_core = normalize_vi_punctuation(&restored_core);
        let prev_piece = translated_parts.last().map(String::as_str).unwrap_or("");

        let (u_index, s_text, s_start, s_end) = if let Some(info) = source_unit_infos.get(text_idx)
        {
            (info.unit_index, info.text.as_str(), info.start, info.end)
        } else {
            (
                text_idx,
                if core.is_empty() { unit.as_str() } else { core },
                0,
                0,
            )
        };

        let unit_hits: Vec<NameHit> = hits
            .iter()
            .filter(|h| h.start < s_end && h.end > s_start)
            .cloned()
            .collect();

        if should_lowercase_after_comma(
            prev_piece,
            s_text,
            &restored_core,
            &unit_hits,
            &protected_name_targets,
        ) {
            restored_core = lowercase_first_alpha(&restored_core);
        }
        restored_core = capitalize_after_quote_vi(&restored_core);

        let raw_final_piece = format!("{left}{restored_core}{right}");
        let final_piece = prepend_space_if_needed(prev_piece, &raw_final_piece);
        let final_piece_chars = final_piece.chars().count();

        unit_map.push(TranslationUnitMapRow {
            unit_index: u_index,
            source_text: s_text.trim().to_owned(),
            processed_source_text: key,
            target_placeholder_text: translated_placeholder_piece.trim().to_owned(),
            target_text: final_piece.trim().to_owned(),
            source_start: s_start,
            source_end: s_end,
            target_start: target_cursor,
            target_end: target_cursor + final_piece_chars,
            name_hits: unit_hits,
        });
        translated_parts.push(final_piece);
        target_cursor += final_piece_chars;
        text_idx += 1;
    }

    let translated_with_placeholders = if translated_placeholder_parts.is_empty() {
        processed_text.clone()
    } else {
        translated_placeholder_parts.join("")
    };
    let joined_translated = if translated_parts.is_empty() {
        source.to_owned()
    } else {
        translated_parts.join("")
    };
    let mut translated = smart_capitalize_vi(&joined_translated);
    if translated.is_empty() {
        translated = source.to_owned();
    }

    let placeholders: Vec<PlaceholderEntry> = placeholder_map.into_values().collect();

    TranslationDetailedResult {
        source_text: source.to_owned(),
        processed_text,
        translated_with_placeholders,
        translated,
        mode: mode_norm.to_owned(),
        unit_map,
        token_map: Vec::new(),
        name_map: NameMapSummary {
            active_set: norm_opts.active_set_name,
            version: norm_opts.name_set_version.max(1),
            size: name_set.len(),
            placeholders,
            hits,
        },
        hanviet_source: String::new(),
        trans_sig,
        cache_hit_count,
        missing_count: missing.len(),
        stored_count,
    }
}

/// Tái sử dụng các cụm dịch không bị ảnh hưởng khi người dùng chỉ sửa 1-2 Name riêng trong chương,
/// tránh phải dịch lại toàn bộ chương qua server (`reader_server.py::translate_detailed_with_unit_reuse`).
#[allow(clippy::too_many_arguments)]
pub fn translate_detailed_with_unit_reuse(
    text: &str,
    previous_translated_text: &str,
    previous_unit_map: &[TranslationUnitMapRow],
    previous_name_set: &BTreeMap<String, String>,
    sig_opts: &TranslationSignatureOptions,
    batch_cfg: &TranslateBatchConfig,
    mut tm_store: Option<&mut dyn TranslationMemoryStore>,
    mut transport: Option<&mut dyn TranslationHttpTransport>,
) -> Option<TranslationDetailedResult> {
    let source = text.trim();
    let mode_norm = normalize_translation_mode(&sig_opts.mode);
    if mode_norm != "server" {
        return None;
    }
    if source.is_empty() || previous_translated_text.is_empty() || previous_unit_map.is_empty() {
        return None;
    }

    let current_name_set = normalize_name_set(&sig_opts.effective_name_set);
    let old_name_set = normalize_name_set(previous_name_set);
    let all_keys: HashSet<&String> = old_name_set.keys().chain(current_name_set.keys()).collect();
    let mut changed_sources: HashSet<String> = HashSet::new();
    for key in all_keys {
        if old_name_set.get(key) != current_name_set.get(key) {
            let trimmed = key.trim();
            if !trimmed.is_empty() {
                changed_sources.insert(trimmed.to_owned());
            }
        }
    }
    let mut changed_sources_sorted: Vec<String> = changed_sources.iter().cloned().collect();
    changed_sources_sorted.sort_by(|a, b| {
        b.chars()
            .count()
            .cmp(&a.chars().count())
            .then_with(|| a.cmp(b))
    });

    let (processed_text, placeholder_map, hits) =
        apply_name_placeholders(source, &current_name_set);
    let source_unit_infos = build_text_units_with_offsets(source);
    let mut units = split_text_for_translation_cache(&processed_text);
    if units.is_empty() {
        units.push((CacheTokenKind::Text, processed_text.clone()));
    }

    let mut previous_rows: HashMap<usize, &TranslationUnitMapRow> = HashMap::new();
    for row in previous_unit_map {
        previous_rows.insert(row.unit_index, row);
    }
    if previous_rows.is_empty() {
        return None;
    }

    let protected_name_targets = protected_targets_from_name_set(&current_name_set);
    let prev_trans_chars: Vec<char> = previous_translated_text.chars().collect();

    let row_touches_changed_sources = |row: &TranslationUnitMapRow, source_text: &str| -> bool {
        if changed_sources_sorted.is_empty() {
            return false;
        }
        for hit in &row.name_hits {
            let hit_src = hit.source.trim();
            if !hit_src.is_empty() && changed_sources.contains(hit_src) {
                return true;
            }
        }
        for changed in &changed_sources_sorted {
            if !changed.is_empty() && source_text.contains(changed.as_str()) {
                return true;
            }
        }
        false
    };

    let mut translated_parts: Vec<String> = Vec::new();
    let mut unit_map: Vec<TranslationUnitMapRow> = Vec::new();
    let mut target_cursor = 0usize;
    let mut text_idx = 0usize;
    let mut reused_any = false;

    for (kind, unit) in &units {
        if *kind != CacheTokenKind::Text {
            translated_parts.push(unit.clone());
            target_cursor += unit.chars().count();
            continue;
        }

        let (unit_index, source_text, s_start, s_end) =
            if let Some(info) = source_unit_infos.get(text_idx) {
                (info.unit_index, info.text.as_str(), info.start, info.end)
            } else {
                (text_idx, unit.as_str(), 0, 0)
            };
        let unit_hits: Vec<NameHit> = hits
            .iter()
            .filter(|h| h.start < s_end && h.end > s_start)
            .cloned()
            .collect();
        let (_, core, _) = split_space_edges(unit);
        let current_processed_core = normalize_translation_cache_source(core);

        let previous_row = previous_rows.get(&unit_index).copied();
        let mut final_piece = String::new();
        let mut placeholder_piece_for_row = String::new();

        if let Some(prev_row) = previous_row {
            let prev_source_text = prev_row.source_text.trim();
            let prev_processed_core =
                normalize_translation_cache_source(&prev_row.processed_source_text);
            let prev_placeholder_piece = prev_row.target_placeholder_text.as_str();

            if prev_source_text == source_text.trim()
                && !prev_processed_core.is_empty()
                && !current_processed_core.is_empty()
                && prev_processed_core == current_processed_core
                && !prev_placeholder_piece.is_empty()
            {
                let mut restored_piece =
                    restore_name_placeholders(prev_placeholder_piece, &placeholder_map);
                restored_piece = normalize_vi_punctuation(&restored_piece);
                let prev_piece = translated_parts.last().map(String::as_str).unwrap_or("");
                if should_lowercase_after_comma(
                    prev_piece,
                    source_text,
                    &restored_piece,
                    &unit_hits,
                    &protected_name_targets,
                ) {
                    restored_piece = lowercase_first_alpha(&restored_piece);
                }
                restored_piece = capitalize_after_quote_vi(&restored_piece);
                final_piece = prepend_space_if_needed(prev_piece, &restored_piece);
                placeholder_piece_for_row = prev_placeholder_piece.trim().to_owned();
                reused_any = true;
            }

            if final_piece.is_empty()
                && prev_source_text == source_text.trim()
                && prev_row.target_end > prev_row.target_start
                && prev_row.target_end <= prev_trans_chars.len()
                && !row_touches_changed_sources(prev_row, source_text)
            {
                final_piece = prev_trans_chars[prev_row.target_start..prev_row.target_end]
                    .iter()
                    .collect();
                placeholder_piece_for_row = prev_row.target_placeholder_text.trim().to_owned();
                reused_any = true;
            }
        }

        if final_piece.is_empty() {
            let reborrowed_tm = tm_store
                .as_mut()
                .map(|s| &mut **s as &mut dyn TranslationMemoryStore);
            let reborrowed_http = transport
                .as_mut()
                .map(|t| &mut **t as &mut dyn TranslationHttpTransport);
            let piece_detail = translate_detailed(
                source_text,
                sig_opts,
                batch_cfg,
                reborrowed_tm,
                reborrowed_http,
            );
            final_piece = normalize_newlines(&piece_detail.translated);
            if final_piece.is_empty() {
                final_piece = source_text.to_owned();
            }
            let prev_piece = translated_parts.last().map(String::as_str).unwrap_or("");
            if should_lowercase_after_comma(
                prev_piece,
                source_text,
                &final_piece,
                &unit_hits,
                &protected_name_targets,
            ) {
                final_piece = lowercase_first_alpha(&final_piece);
            }
            final_piece = capitalize_after_quote_vi(&final_piece);
            final_piece = prepend_space_if_needed(prev_piece, &final_piece);
            if let Some(prev_row) = previous_row {
                let prev_processed_core =
                    normalize_translation_cache_source(&prev_row.processed_source_text);
                if !prev_processed_core.is_empty() && prev_processed_core == current_processed_core
                {
                    placeholder_piece_for_row = prev_row.target_placeholder_text.trim().to_owned();
                }
            }
        }

        let final_len = final_piece.chars().count();
        unit_map.push(TranslationUnitMapRow {
            unit_index,
            source_text: source_text.trim().to_owned(),
            processed_source_text: current_processed_core,
            target_placeholder_text: placeholder_piece_for_row,
            target_text: final_piece.trim().to_owned(),
            source_start: s_start,
            source_end: s_end,
            target_start: target_cursor,
            target_end: target_cursor + final_len,
            name_hits: unit_hits,
        });
        translated_parts.push(final_piece);
        target_cursor += final_len;
        text_idx += 1;
    }

    if !reused_any && !changed_sources_sorted.is_empty() {
        return None;
    }

    let mut translated = if translated_parts.is_empty() {
        source.to_owned()
    } else {
        translated_parts.join("")
    };
    translated = normalize_vi_punctuation(&translated);
    translated = smart_capitalize_vi(&translated);
    if translated.is_empty() {
        translated = source.to_owned();
    }

    let mut norm_opts = sig_opts.clone();
    norm_opts.mode = mode_norm.to_owned();
    norm_opts.effective_name_set = current_name_set.clone();
    let trans_sig = translation_signature(&norm_opts);
    let placeholders: Vec<PlaceholderEntry> = placeholder_map.into_values().collect();

    Some(TranslationDetailedResult {
        source_text: source.to_owned(),
        processed_text,
        translated_with_placeholders: translated.clone(),
        translated,
        mode: mode_norm.to_owned(),
        unit_map,
        token_map: Vec::new(),
        name_map: NameMapSummary {
            active_set: norm_opts.active_set_name,
            version: norm_opts.name_set_version.max(1),
            size: current_name_set.len(),
            placeholders,
            hits,
        },
        hanviet_source: String::new(),
        trans_sig,
        cache_hit_count: 0,
        missing_count: 0,
        stored_count: 0,
    })
}

fn empty_detailed_result(
    mode_norm: &str,
    opts: &TranslationSignatureOptions,
    trans_sig: String,
) -> TranslationDetailedResult {
    TranslationDetailedResult {
        source_text: String::new(),
        processed_text: String::new(),
        translated_with_placeholders: String::new(),
        translated: String::new(),
        mode: mode_norm.to_owned(),
        unit_map: Vec::new(),
        token_map: Vec::new(),
        name_map: NameMapSummary {
            active_set: if opts.active_set_name.trim().is_empty() {
                "Mặc định".to_owned()
            } else {
                opts.active_set_name.clone()
            },
            version: opts.name_set_version.max(1),
            size: 0,
            placeholders: Vec::new(),
            hits: Vec::new(),
        },
        hanviet_source: String::new(),
        trans_sig,
        cache_hit_count: 0,
        missing_count: 0,
        stored_count: 0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(Default)]
    struct InMemoryTmStore {
        entries: HashMap<(String, String, String), String>,
    }

    impl TranslationMemoryStore for InMemoryTmStore {
        fn lookup_batch(
            &mut self,
            source_texts: &[String],
            mode: &str,
            trans_sig: &str,
        ) -> HashMap<String, String> {
            let mut out = HashMap::new();
            for s in source_texts {
                let key = normalize_translation_cache_source(s);
                if let Some(val) =
                    self.entries
                        .get(&(mode.to_owned(), trans_sig.to_owned(), key.clone()))
                {
                    out.insert(key, val.clone());
                }
            }
            out
        }

        fn store_batch(
            &mut self,
            entries: &[(String, String)],
            mode: &str,
            trans_sig: &str,
        ) -> usize {
            for (k, v) in entries {
                let key = normalize_translation_cache_source(k);
                self.entries
                    .insert((mode.to_owned(), trans_sig.to_owned(), key), v.clone());
            }
            entries.len()
        }
    }

    struct EchoTranslator {
        map: HashMap<String, String>,
        calls: usize,
    }

    impl TranslationHttpTransport for EchoTranslator {
        fn post_dichngay_json(
            &mut self,
            _server_url: &str,
            body_json: &str,
            _timeout_sec: u64,
        ) -> Result<String, crate::CoreError> {
            self.calls += 1;
            let payload: Value = serde_json::from_str(body_json)?;
            let content_str = payload["content"].as_str().unwrap_or("[]");
            let items: Vec<String> = serde_json::from_str(content_str)?;
            let out: Vec<String> = items
                .into_iter()
                .map(|item| {
                    if let Some(exact) = self.map.get(&item) {
                        return exact.clone();
                    }
                    item.replace("看向", " nhìn về phía ")
                })
                .collect();
            let resp = json!({
                "data": {
                    "content": serde_json::to_string(&out)?
                }
            });
            Ok(serde_json::to_string(&resp)?)
        }

        fn sleep_ms(&mut self, _ms: u64) {}
    }

    #[test]
    fn sha1_matches_fips_test_vectors() {
        assert_eq!(sha1_hex(b"abc"), "a9993e364706816aba3e25717850c26c9cd0d89d");
        assert_eq!(sha1_hex(b""), "da39a3ee5e6b4b0d3255bfef95601890afd80709");
    }

    #[test]
    fn translate_detailed_preserves_capital_name_after_comma_and_reuses_units() {
        let mut names = BTreeMap::new();
        names.insert("萧炎".into(), "Tiêu Viêm".into());
        names.insert("药老".into(), "Dược Lão".into());

        let sig_opts = TranslationSignatureOptions {
            mode: "server".into(),
            active_set_name: "Mặc định".into(),
            name_set_version: 1,
            effective_name_set: names.clone(),
            ..Default::default()
        };
        let batch_cfg = TranslateBatchConfig {
            delay_ms: 0,
            retry_count: 0,
            ..Default::default()
        };

        let mut tm = InMemoryTmStore::default();
        let mut http = EchoTranslator {
            map: HashMap::from([
                ("清晨，".into(), "Sáng sớm,".into()),
                (
                    "__TM_NAME_0__看向__TM_NAME_1__，".into(),
                    "__TM_NAME_0__ nhìn về phía __TM_NAME_1__,".into(),
                ),
                ("微微一笑。".into(), "Khẽ mỉm cười.".into()),
            ]),
            calls: 0,
        };

        let raw = "清晨，萧炎看向药老，微微一笑。";
        let first = translate_detailed(raw, &sig_opts, &batch_cfg, Some(&mut tm), Some(&mut http));
        // Sau dấu phẩy đầu tiên là Name riêng "Tiêu Viêm" -> giữ nguyên chữ T hoa.
        // Sau dấu phẩy thứ hai là cụm thường "Khẽ mỉm cười." -> hạ chữ đầu thành "khẽ mỉm cười."
        assert_eq!(
            first.translated,
            "Sáng sớm, Tiêu Viêm nhìn về phía Dược Lão, khẽ mỉm cười."
        );
        assert_eq!(first.unit_map.len(), 3);
        assert_eq!(first.missing_count, 3);
        assert_eq!(http.calls, 1);

        // Bây giờ đổi tên "药老" -> "Dược Trần" và dùng translate_detailed_with_unit_reuse:
        // Không cần gọi HTTP vì placeholder `__TM_NAME_0__ nhìn về phía __TM_NAME_1__,` được tái sử dụng!
        let mut new_names = names.clone();
        new_names.insert("药老".into(), "Dược Trần".into());
        let new_sig_opts = TranslationSignatureOptions {
            effective_name_set: new_names,
            name_set_version: 2,
            ..sig_opts
        };

        let reused = translate_detailed_with_unit_reuse(
            raw,
            &first.translated,
            &first.unit_map,
            &names,
            &new_sig_opts,
            &batch_cfg,
            Some(&mut tm),
            Some(&mut http),
        )
        .expect("should reuse units without network");

        assert_eq!(
            reused.translated,
            "Sáng sớm, Tiêu Viêm nhìn về phía Dược Trần, khẽ mỉm cười."
        );
        assert_eq!(http.calls, 1);
    }
}
