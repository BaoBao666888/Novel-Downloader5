use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::CoreError;
use crate::translate::text::{
    count_cjk_chars, normalize_for_compare, normalize_text_for_translation,
    normalize_translated_text,
};

pub const DEFAULT_DICHNGAY_URL: &str = "https://dichngay.com/translate/text";
pub const DEFAULT_DICHNGAY_REFERER: &str = "https://dichngay.com/";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DichngayBatchPayload {
    pub content: String,
    pub tl: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslateBatchConfig {
    pub server_url: String,
    pub max_chars: usize,
    pub delay_ms: u64,
    pub retry_count: usize,
    pub retry_backoff_ms: u64,
    pub timeout_sec: u64,
    pub target_lang: String,
}

impl Default for TranslateBatchConfig {
    fn default() -> Self {
        Self {
            server_url: DEFAULT_DICHNGAY_URL.to_owned(),
            max_chars: 9000,
            delay_ms: 250,
            retry_count: 2,
            retry_backoff_ms: 700,
            timeout_sec: 60,
            target_lang: "vi".to_owned(),
        }
    }
}

/// Giao diện transport trừu tượng cho dịch server (DichNgay / loopback mock / WinHTTP / Android).
pub trait TranslationHttpTransport {
    fn post_dichngay_json(
        &mut self,
        server_url: &str,
        body_json: &str,
        timeout_sec: u64,
    ) -> Result<String, CoreError>;

    fn sleep_ms(&mut self, ms: u64) {
        if ms > 0 {
            std::thread::sleep(std::time::Duration::from_millis(ms));
        }
    }
}

pub fn build_dichngay_batch_payload(
    content_array: &[String],
    target_lang: &str,
) -> Result<String, CoreError> {
    let inner = serde_json::to_string(content_array)?;
    let payload = DichngayBatchPayload {
        content: inner,
        tl: if target_lang.trim().is_empty() {
            "vi".to_owned()
        } else {
            target_lang.trim().to_owned()
        },
    };
    Ok(serde_json::to_string(&payload)?)
}

/// Chia danh sách câu/cụm thành các lô không vượt quá `max_chars` (ràng buộc `100..=9000` ký tự)
/// theo đúng `translator.py::_split_into_batches` và `TM Translate.user.js::splitIntoBatches`.
pub fn split_into_batches(texts: &[String], max_chars: usize) -> Vec<Vec<String>> {
    let limit = max_chars.clamp(100, 9000);
    let mut batches: Vec<Vec<String>> = Vec::new();
    let mut current_batch: Vec<String> = Vec::new();
    let mut current_len = 0usize;

    for text in texts {
        let text_len = text.chars().count();
        if current_len + text_len > limit && !current_batch.is_empty() {
            batches.push(std::mem::take(&mut current_batch));
            current_batch.push(text.clone());
            current_len = text_len;
        } else {
            current_batch.push(text.clone());
            current_len += text_len;
        }
    }
    if !current_batch.is_empty() {
        batches.push(current_batch);
    }
    batches
}

/// Xóa control characters (`\u0000-\u0008\u000B\u000C\u000E-\u001F`) và nhân đôi backslash lẻ
/// không thuộc escape JSON hợp lệ (`\"`, `\\`, `\/`, `\b`, `\f`, `\n`, `\r`, `\t`, `\uXXXX`)
/// theo đúng `TM Translate.user.js::parseDichngayTranslationResponse`.
pub fn sanitize_dichngay_content_string(raw: &str) -> String {
    let chars: Vec<char> = raw
        .chars()
        .filter(|&ch| {
            let u = ch as u32;
            !((u <= 0x08) || u == 0x0B || u == 0x0C || (0x0E..=0x1F).contains(&u))
        })
        .collect();
    let mut out = String::with_capacity(chars.len() + 16);
    for idx in 0..chars.len() {
        let ch = chars[idx];
        if ch == '\\' {
            let valid_next = idx + 1 < chars.len()
                && matches!(
                    chars[idx + 1],
                    '"' | '\\' | '/' | 'b' | 'f' | 'n' | 'r' | 't' | 'u'
                );
            if !valid_next {
                out.push('\\');
                out.push('\\');
                continue;
            }
        }
        out.push(ch);
    }
    out
}

/// Sửa lỗi DichNgay đôi lúc trả về `\\ "Nội dung"` hoặc `\\\"Nội dung` cho lời thoại
/// khiến dấu quote mở trong từng phần tử không còn là escape JSON hợp lệ.
/// Tham chiếu `TM Translate.user.js::repairMalformedDichngayContentString`:
/// `.replace(/\\+\s*"(?=\s*[^,\]])/g, '\\"')`.
pub fn repair_malformed_dichngay_content_string(content: &str) -> String {
    if content.is_empty() {
        return String::new();
    }
    let chars: Vec<char> = content.chars().collect();
    let n = chars.len();
    let mut out = String::with_capacity(content.len());
    let mut i = 0;
    while i < n {
        if chars[i] == '\\' {
            let start = i;
            while i < n && chars[i] == '\\' {
                i += 1;
            }
            let mut j = i;
            while j < n && chars[j].is_whitespace() {
                j += 1;
            }
            if j < n && chars[j] == '"' {
                // Kiểm tra lookahead `(?=\s*[^,\]])`
                let mut k = j + 1;
                while k < n && chars[k].is_whitespace() {
                    k += 1;
                }
                if k < n && chars[k] != ',' && chars[k] != ']' {
                    out.push('\\');
                    out.push('"');
                    i = j + 1;
                    continue;
                }
            }
            for &c in &chars[start..i] {
                out.push(c);
            }
            continue;
        }
        out.push(chars[i]);
        i += 1;
    }
    out
}

fn decode_loose_escape(chars: &[char], index: &mut usize) -> char {
    let n = chars.len();
    if *index >= n || chars[*index] != '\\' {
        return '\0';
    }
    if *index + 1 >= n {
        *index += 1;
        return '\\';
    }
    let next = chars[*index + 1];
    if next == 'u' && *index + 5 < n {
        let hex: String = chars[*index + 2..*index + 6].iter().collect();
        if hex.chars().all(|c| c.is_ascii_hexdigit())
            && let Ok(code) = u32::from_str_radix(&hex, 16)
            && let Some(decoded) = char::from_u32(code)
        {
            *index += 6;
            return decoded;
        }
    }
    let mapped = match next {
        '"' => Some('"'),
        '\\' => Some('\\'),
        '/' => Some('/'),
        'b' => Some('\x08'),
        'f' => Some('\x0c'),
        'n' => Some('\n'),
        'r' => Some('\r'),
        't' => Some('\t'),
        _ => None,
    };
    if let Some(ch) = mapped {
        *index += 2;
        return ch;
    }
    let mut quote_idx = *index + 1;
    while quote_idx < n && chars[quote_idx].is_whitespace() {
        quote_idx += 1;
    }
    if quote_idx < n && chars[quote_idx] == '"' {
        *index = quote_idx + 1;
        return '"';
    }
    *index += 1;
    '\\'
}

/// Bộ phân tích mảng chuỗi JSON khoan dung (lenient array parser) hợp nhất từ
/// `TM Translate.user.js::parseDichngayStringArrayLenient` và `translator.py::_parse_loose_json_array`:
/// xử lý được dấu `"` trần bên trong câu thoại tiếng Việt जब sau nó không phải `,` hoặc `]`.
pub fn parse_dichngay_string_array_lenient(raw_content: &str) -> Vec<String> {
    let trimmed = raw_content.trim();
    if trimmed.is_empty() {
        return Vec::new();
    }
    if let Ok(parsed) = serde_json::from_str::<Vec<Value>>(trimmed) {
        return parsed
            .into_iter()
            .map(|v| match v {
                Value::String(s) => s,
                Value::Null => String::new(),
                other => other.to_string(),
            })
            .collect();
    }

    let body = trimmed
        .strip_prefix('[')
        .unwrap_or(trimmed)
        .strip_suffix(']')
        .unwrap_or(trimmed);
    let chars: Vec<char> = body.chars().collect();
    let n = chars.len();
    let mut items = Vec::new();
    let mut i = 0;

    while i < n {
        while i < n && (chars[i].is_whitespace() || chars[i] == ',') {
            i += 1;
        }
        if i >= n {
            break;
        }
        if chars[i] != '"' {
            let start = i;
            while i < n && chars[i] != ',' {
                i += 1;
            }
            let token: String = chars[start..i].iter().collect();
            let token = token.trim();
            if !token.is_empty() {
                items.push(token.to_owned());
            }
            continue;
        }

        i += 1; // skip opening quote
        let mut buf = String::new();
        while i < n {
            let ch = chars[i];
            if ch == '\\' {
                buf.push(decode_loose_escape(&chars, &mut i));
                continue;
            }
            if ch == '"' {
                let mut next_idx = i + 1;
                while next_idx < n && chars[next_idx].is_whitespace() {
                    next_idx += 1;
                }
                let is_end = next_idx >= n;
                let mut is_sep = false;
                if !is_end && chars[next_idx] == ',' {
                    let mut after_comma = next_idx + 1;
                    while after_comma < n && chars[after_comma].is_whitespace() {
                        after_comma += 1;
                    }
                    is_sep = after_comma >= n || chars[after_comma] == '"';
                }
                if is_end || is_sep {
                    i = if !is_end && chars[next_idx] == ',' {
                        next_idx + 1
                    } else {
                        next_idx
                    };
                    break;
                }
                buf.push('"');
                i += 1;
                continue;
            }
            buf.push(ch);
            i += 1;
        }
        items.push(buf);
    }
    items
}

/// Phân tích trọn vẹn phản hồi JSON từ DichNgay (`{"data":{"content":"[...]"}}` hoặc `{"translatedText":[...]}`)
/// theo pipeline của `TM Translate.user.js::parseDichngayTranslationResponse` và `translator.py::_post_translate_batch`.
pub fn parse_dichngay_response(
    response_text: &str,
    expected_count: usize,
    allow_plain_string: bool,
) -> Result<Vec<String>, CoreError> {
    let root: Value = serde_json::from_str(response_text)
        .map_err(|err| format!("DichNgay trả dữ liệu không phải JSON hợp lệ: {err}"))?;

    let content_val = root
        .get("data")
        .and_then(|d| d.get("content"))
        .filter(|v| !v.is_null() && v.as_str() != Some(""))
        .or_else(|| root.get("translatedText"));

    let Some(content_val) = content_val else {
        return Err("Server response thiếu trường 'data.content' hoặc 'translatedText'.".into());
    };

    if let Some(arr) = content_val.as_array() {
        let items: Vec<String> = arr
            .iter()
            .map(|v| normalize_translated_text(v.as_str().unwrap_or_default()))
            .collect();
        return Ok(items);
    }

    let Some(raw_str) = content_val.as_str() else {
        return Err("Server response 'content' không phải chuỗi hoặc mảng.".into());
    };

    let sanitized = sanitize_dichngay_content_string(raw_str);
    let trimmed = sanitized.trim();
    if allow_plain_string && !trimmed.is_empty() && !trimmed.starts_with(['[', '{', '"']) {
        return Ok(vec![normalize_translated_text(&sanitized)]);
    }

    if let Ok(parsed) = serde_json::from_str::<Vec<String>>(&sanitized) {
        let normalized: Vec<String> = parsed
            .iter()
            .map(|s| normalize_translated_text(s))
            .collect();
        if expected_count == 0 || normalized.len() == expected_count || !normalized.is_empty() {
            return Ok(normalized);
        }
    }

    let repaired = repair_malformed_dichngay_content_string(&sanitized);
    if repaired != sanitized
        && let Ok(parsed) = serde_json::from_str::<Vec<String>>(&repaired)
    {
        let normalized: Vec<String> = parsed
            .iter()
            .map(|s| normalize_translated_text(s))
            .collect();
        if expected_count == 0 || normalized.len() == expected_count || !normalized.is_empty() {
            return Ok(normalized);
        }
    }

    let lenient_src = if repaired.is_empty() {
        &sanitized
    } else {
        &repaired
    };
    let lenient = parse_dichngay_string_array_lenient(lenient_src);
    if !lenient.is_empty() {
        return Ok(lenient
            .iter()
            .map(|s| normalize_translated_text(s))
            .collect());
    }

    if allow_plain_string {
        return Ok(vec![normalize_translated_text(lenient_src)]);
    }

    Err("Không thể parse mảng kết quả dịch từ DichNgay.".into())
}

/// Kiểm tra bản dịch có bị nghi ngờ chưa dịch (còn nguyên chữ Hán hoặc tỷ lệ chữ Hán >= 55%)
/// theo đúng `translator.py::_looks_untranslated_translation`.
pub fn looks_untranslated_translation(source_text: &str, translated_text: &str) -> bool {
    let source = source_text.trim();
    let translated = translated_text.trim();
    if source.is_empty() || translated.is_empty() {
        return false;
    }
    if translated.starts_with("[Lỗi") {
        return false;
    }
    let source_cjk = count_cjk_chars(source);
    if source_cjk == 0 {
        return false;
    }
    let translated_cjk = count_cjk_chars(translated);
    if translated == source {
        return true;
    }
    let threshold = ((source_cjk as f64) * 0.55) as usize;
    if translated_cjk >= threshold.max(2) {
        return true;
    }
    let source_compact = normalize_for_compare(source);
    let translated_compact = normalize_for_compare(translated);
    !source_compact.is_empty()
        && !translated_compact.is_empty()
        && source_compact == translated_compact
}

pub fn translation_needs_retry(source_text: &str, translated_text: &str) -> bool {
    let source = normalize_text_for_translation(source_text);
    let source = source.trim();
    let translated = normalize_translated_text(translated_text);
    let translated = translated.trim();
    if source.is_empty() {
        return false;
    }
    if translated.is_empty() || translated.starts_with("[Lỗi") {
        return true;
    }
    looks_untranslated_translation(source, translated)
}

fn post_translate_batch(
    content_array: &[String],
    cfg: &TranslateBatchConfig,
    transport: &mut dyn TranslationHttpTransport,
) -> Vec<String> {
    if content_array.is_empty() {
        return Vec::new();
    }
    let body_json = match build_dichngay_batch_payload(content_array, &cfg.target_lang) {
        Ok(b) => b,
        Err(e) => return vec![format!("[Lỗi payload: {e}]"); content_array.len()],
    };
    let attempts = cfg.retry_count.saturating_add(1).max(1);
    let timeout = cfg.timeout_sec.max(10);
    let mut last_request_error: Option<String> = None;

    for attempt in 0..attempts {
        match transport.post_dichngay_json(&cfg.server_url, &body_json, timeout) {
            Ok(resp_text) => {
                match parse_dichngay_response(
                    &resp_text,
                    content_array.len(),
                    content_array.len() == 1,
                ) {
                    Ok(parsed) if parsed.len() == content_array.len() || !parsed.is_empty() => {
                        return parsed;
                    }
                    Ok(_) | Err(_) => {
                        last_request_error = None;
                    }
                }
            }
            Err(err) => {
                last_request_error = Some(err.to_string());
            }
        }
        if attempt + 1 < attempts {
            transport.sleep_ms(cfg.retry_backoff_ms.max(100));
        }
    }

    if let Some(err) = last_request_error {
        vec![format!("[Lỗi mạng: {err}]"); content_array.len()]
    } else {
        vec!["[Lỗi server response]".to_owned(); content_array.len()]
    }
}

fn translate_single_text_final(
    text: &str,
    cfg: &TranslateBatchConfig,
    transport: &mut dyn TranslationHttpTransport,
) -> String {
    let single = vec![text.to_owned()];
    let translated = post_translate_batch(&single, cfg, transport);
    let candidate = translated.first().map(String::as_str).unwrap_or("");
    if translation_needs_retry(text, candidate) {
        normalize_translated_text(text)
    } else {
        normalize_translated_text(candidate)
    }
}

fn translate_failed_batch_final(
    content_array: &[String],
    cfg: &TranslateBatchConfig,
    transport: &mut dyn TranslationHttpTransport,
) -> Vec<String> {
    if content_array.is_empty() {
        return Vec::new();
    }
    let translated = post_translate_batch(content_array, cfg, transport);
    if translated.len() == content_array.len() {
        return content_array
            .iter()
            .zip(translated.iter())
            .map(|(source, item)| {
                if !translation_needs_retry(source, item) {
                    normalize_translated_text(item)
                } else {
                    translate_single_text_final(source, cfg, transport)
                }
            })
            .collect();
    }
    if content_array.len() <= 1 {
        return vec![translate_single_text_final(
            &content_array[0],
            cfg,
            transport,
        )];
    }
    let mid = (content_array.len() / 2).max(1);
    let mut left = translate_failed_batch_final(&content_array[..mid], cfg, transport);
    let right = translate_failed_batch_final(&content_array[mid..], cfg, transport);
    left.extend(right);
    left
}

fn retry_suspicious_texts(
    source_texts: &[String],
    cfg: &TranslateBatchConfig,
    max_chars: usize,
    transport: &mut dyn TranslationHttpTransport,
) -> Vec<String> {
    if source_texts.is_empty() {
        return Vec::new();
    }
    let retry_chars = max_chars.clamp(300, 1800);
    let batches = split_into_batches(source_texts, retry_chars);
    let mut results = Vec::with_capacity(source_texts.len());
    for batch in batches {
        let translated = post_translate_batch(&batch, cfg, transport);
        if translated.len() != batch.len() {
            results.extend(translate_failed_batch_final(&batch, cfg, transport));
            continue;
        }
        for (source_text, translated_text) in batch.iter().zip(translated.iter()) {
            if translation_needs_retry(source_text, translated_text) {
                results.push(translate_single_text_final(source_text, cfg, transport));
            } else {
                results.push(normalize_translated_text(translated_text));
            }
        }
    }
    results
}

/// Dịch 1 batch có tự động chia đôi (recursive bisection) khi lệch số lượng phần tử và
/// dịch lại các câu nghi ngờ sót tiếng Trung (`_translate_batch_resilient`).
pub fn translate_batch_resilient(
    content_array: &[String],
    cfg: &TranslateBatchConfig,
    transport: &mut dyn TranslationHttpTransport,
) -> Vec<String> {
    if content_array.is_empty() {
        return Vec::new();
    }
    let translated = post_translate_batch(content_array, cfg, transport);
    if translated.len() != content_array.len() {
        return translate_failed_batch_final(content_array, cfg, transport);
    }
    let mut resolved: Vec<String> = translated
        .iter()
        .map(|item| normalize_translated_text(item))
        .collect();
    let suspicious_indexes: Vec<usize> = content_array
        .iter()
        .zip(resolved.iter())
        .enumerate()
        .filter_map(|(idx, (src, tr))| {
            if translation_needs_retry(src, tr) {
                Some(idx)
            } else {
                None
            }
        })
        .collect();
    if suspicious_indexes.is_empty() {
        return resolved;
    }
    let suspicious_sources: Vec<String> = suspicious_indexes
        .iter()
        .map(|&idx| content_array[idx].clone())
        .collect();
    let total_chars: usize = content_array.iter().map(|s| s.chars().count()).sum();
    let max_chars = if total_chars == 0 {
        4500
    } else {
        total_chars.clamp(300, 9000)
    };
    let retried = retry_suspicious_texts(&suspicious_sources, cfg, max_chars, transport);
    for (&idx, candidate) in suspicious_indexes.iter().zip(retried.iter()) {
        resolved[idx] = normalize_translated_text(candidate);
    }
    resolved
}

/// Dịch toàn bộ danh sách câu/cụm qua DichNgay theo đúng `translator.py::translate_text_chunks`.
pub fn translate_text_chunks(
    chunks: &[String],
    cfg: &TranslateBatchConfig,
    transport: &mut dyn TranslationHttpTransport,
) -> Vec<String> {
    if chunks.is_empty() {
        return Vec::new();
    }
    let normalized_chunks: Vec<String> = chunks
        .iter()
        .map(|c| normalize_text_for_translation(c))
        .collect();
    let max_chars = cfg.max_chars.clamp(500, 9000);
    let batches = split_into_batches(&normalized_chunks, max_chars);
    let total_batches = batches.len();
    let mut all_translated = Vec::with_capacity(normalized_chunks.len());

    for (i, batch) in batches.iter().enumerate() {
        let translated_batch = translate_batch_resilient(batch, cfg, transport);
        all_translated.extend(translated_batch);
        if i + 1 < total_batches && cfg.delay_ms > 0 {
            transport.sleep_ms(cfg.delay_ms);
        }
    }

    if all_translated.len() < normalized_chunks.len() {
        all_translated.extend_from_slice(&normalized_chunks[all_translated.len()..]);
    } else if all_translated.len() > normalized_chunks.len() {
        all_translated.truncate(normalized_chunks.len());
    }

    all_translated
        .into_iter()
        .map(|t| normalize_translated_text(&t))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    struct MockDichngayTransport {
        responses: Vec<String>,
        calls: usize,
    }

    impl TranslationHttpTransport for MockDichngayTransport {
        fn post_dichngay_json(
            &mut self,
            _server_url: &str,
            _body_json: &str,
            _timeout_sec: u64,
        ) -> Result<String, CoreError> {
            let idx = self.calls;
            self.calls += 1;
            self.responses
                .get(idx)
                .cloned()
                .ok_or_else(|| "out of mock responses".into())
        }

        fn sleep_ms(&mut self, _ms: u64) {}
    }

    #[test]
    fn repairs_and_leniently_parses_malformed_dichngay_arrays() {
        // Case 1: DichNgay trả `\\ "Lời thoại"` làm gãy JSON.parse thông thường
        let raw_resp = r#"{"data":{"content":"[\"\\\\ \"Xin chào!\"\", \"Câu hai.\"]"}}"#;
        let parsed = parse_dichngay_response(raw_resp, 2, false).unwrap();
        assert_eq!(parsed, vec!["\"Xin chào!\"", "Câu hai."]);

        // Case 2: Dấu ngoặc kép trần bên trong phần tử mảng
        let unescaped =
            r#"{"data":{"content":"[\"Hắn nói \"không sao\" rồi đi\", \"Đoạn kết\"]"}}"#;
        let parsed2 = parse_dichngay_response(unescaped, 2, false).unwrap();
        assert_eq!(parsed2, vec![r#"Hắn nói "không sao" rồi đi"#, "Đoạn kết"]);
    }

    #[test]
    fn bisects_mismatched_batches_and_retries_untranslated_cjk_items() {
        let mut transport = MockDichngayTransport {
            responses: vec![
                // Lần 1: gửi 2 câu nhưng server gộp nhầm còn 1 câu -> kích hoạt translate_failed_batch_final
                r#"{"data":{"content":"[\"Gộp nhầm\"]"}}"#.to_owned(),
                // Lần 2 (trong translate_failed_batch_final thử gửi lại batch 2 câu): vẫn trả 1 câu -> chia đôi (mid=1)
                r#"{"data":{"content":"[\"Gộp nhầm\"]"}}"#.to_owned(),
                // Nhánh trái (câu 1): trả bình thường
                r#"{"data":{"content":"[\"Xin chào đạo hữu.\"]"}}"#.to_owned(),
                // Nhánh phải (câu 2): trả nguyên chữ Hán -> kích hoạt translate_single_text_final
                r#"{"data":{"content":"[\"他转身离开。\"]"}}"#.to_owned(),
                // Retry câu 2: trả bản dịch tiếng Việt
                r#"{"data":{"content":"[\"Hắn xoay người rời đi.\"]"}}"#.to_owned(),
            ],
            calls: 0,
        };
        let cfg = TranslateBatchConfig {
            retry_count: 0,
            delay_ms: 0,
            ..Default::default()
        };
        let chunks = vec!["你好道友。".to_owned(), "他转身离开。".to_owned()];
        let out = translate_text_chunks(&chunks, &cfg, &mut transport);
        assert_eq!(out, vec!["Xin chào đạo hữu.", "Hắn xoay người rời đi."]);
        assert_eq!(transport.calls, 5);
    }
}
