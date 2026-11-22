use std::collections::{BTreeMap, HashSet};
use std::fmt;

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::CoreError;

pub const DEFAULT_WIKI_HOST: &str = "wikicv.org";
pub const BOOK_INDEX_PAGE_SIZE: usize = 501;
pub const MAX_CHAPTER_BYTES: u64 = 100 * 1024;
pub const MAX_VOLUME_BYTES: u64 = 5 * 1024 * 1024;
pub const MAX_VOLUME_FILES: usize = 5000;
pub const METADATA_GROUPS: [&str; 7] = [
    "status", "official", "gender", "age", "ending", "genre", "tag",
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedHttpsUrl {
    pub host: String,
    pub port: Option<u16>,
    pub path: String,
    pub suffix: String,
}

impl ParsedHttpsUrl {
    pub fn canonical_origin(&self) -> String {
        match self.port {
            Some(port) => format!("https://{}:{port}", self.host),
            None => format!("https://{}", self.host),
        }
    }

    pub fn canonical_href(&self) -> String {
        format!("{}{}{}", self.canonical_origin(), self.path, self.suffix)
    }
}

pub fn parse_https_url(raw: &str) -> Result<ParsedHttpsUrl, CoreError> {
    let trimmed = raw.trim();
    if trimmed.is_empty()
        || trimmed
            .chars()
            .any(|c| c.is_control() || c == '\\' || c.is_whitespace())
    {
        return Err("URL không hợp lệ.".into());
    }
    let Some(rest) = trimmed
        .strip_prefix("https://")
        .or_else(|| trimmed.strip_prefix("HTTPS://"))
    else {
        return Err("Chỉ hỗ trợ URL HTTPS.".into());
    };
    let authority_end = rest.find(['/', '?', '#']).unwrap_or(rest.len());
    let authority = &rest[..authority_end];
    let remainder = &rest[authority_end..];
    if authority.is_empty() || authority.contains('@') {
        return Err("URL không hợp lệ hoặc chứa thông tin xác thực.".into());
    }

    let (host_raw, port) = if let Some((h, p)) = authority.split_once(':') {
        if h.is_empty() || p.is_empty() || h.contains('[') {
            return Err("Host hoặc port URL không hợp lệ.".into());
        }
        let parsed_port: u16 = p.parse().map_err(|_| "Port URL không hợp lệ.")?;
        (h, (parsed_port != 443).then_some(parsed_port))
    } else {
        (authority, None)
    };

    let host = host_raw.to_ascii_lowercase();
    if host.is_empty() || host.contains("..") {
        return Err("Tên miền URL không hợp lệ.".into());
    }

    let suffix_start = remainder.find(['?', '#']).unwrap_or(remainder.len());
    let path_raw = &remainder[..suffix_start];
    let path = if path_raw.is_empty() {
        "/".to_owned()
    } else {
        path_raw.to_owned()
    };
    let suffix = remainder[suffix_start..].to_owned();

    Ok(ParsedHttpsUrl {
        host,
        port,
        path,
        suffix,
    })
}

pub fn resolve_wiki_url(raw: &str, allowed_host: &str) -> Result<String, CoreError> {
    let trimmed = raw.trim();
    if trimmed.is_empty()
        || trimmed
            .chars()
            .any(|c| c.is_control() || c == '\\' || c.is_whitespace())
    {
        return Err("Link WikiCV không hợp lệ.".into());
    }
    let expected_host = allowed_host.to_ascii_lowercase();
    let full = if trimmed.starts_with("https://")
        || trimmed.starts_with("HTTPS://")
        || trimmed.starts_with("http://")
        || trimmed.starts_with("HTTP://")
    {
        trimmed.to_owned()
    } else if let Some(after_slashes) = trimmed.strip_prefix("//") {
        format!("https://{after_slashes}")
    } else if trimmed.starts_with('/') {
        format!("https://{expected_host}{trimmed}")
    } else {
        let before_delim = trimmed.split(['/', '?', '#']).next().unwrap_or(trimmed);
        if before_delim.contains(':') {
            return Err("Link WikiCV khác domain.".into());
        }
        format!("https://{expected_host}/{trimmed}")
    };

    let parsed = parse_https_url(&full).map_err(|_| "Link WikiCV khác domain.")?;
    if parsed.port.is_some() || parsed.host != expected_host {
        return Err("Link WikiCV khác domain.".into());
    }
    Ok(parsed.canonical_href())
}

/// Kiểm tra và chuẩn hóa đường dẫn truyện `/truyen/<slug>` thuộc đúng host WikiCV.
pub fn canonical_wiki_book_path(raw: &str, allowed_host: &str) -> Result<String, CoreError> {
    let parsed = parse_https_url(raw).map_err(|_| "Link truyện chưa hợp lệ.")?;
    if parsed.port.is_some() || parsed.host != allowed_host.to_ascii_lowercase() {
        return Err("Link truyện chưa hợp lệ.".into());
    }
    let trimmed = parsed.path.trim_end_matches('/');
    let Some(slug) = trimmed.strip_prefix("/truyen/") else {
        return Err("Link truyện chưa hợp lệ.".into());
    };
    if slug.is_empty() || slug.contains('/') {
        return Err("Link truyện chưa hợp lệ.".into());
    }
    Ok(format!("/truyen/{slug}"))
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChapterValidationInput {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub number: Option<i64>,
    #[serde(default)]
    pub bytes: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChapterValidationReport {
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub bytes: u64,
}

pub fn validate_chapters(chapters: &[ChapterValidationInput]) -> ChapterValidationReport {
    let mut errors = Vec::new();
    let mut seen_errors = HashSet::new();
    let mut push_error = |msg: String| {
        if seen_errors.insert(msg.clone()) {
            errors.push(msg);
        }
    };

    let mut warnings = Vec::new();
    let mut seen_numbers = HashSet::new();
    let mut total_bytes = 0u64;
    let mut previous: Option<i64> = None;

    if chapters.is_empty() {
        push_error("Chưa có chương để upload.".to_owned());
    }
    if chapters.len() > MAX_VOLUME_FILES {
        push_error("Một quyển tối đa 5000 file.".to_owned());
    }

    for chapter in chapters {
        total_bytes = total_bytes.saturating_add(chapter.bytes);
        if chapter.id.is_empty() || chapter.title.trim().is_empty() {
            push_error("Chương thiếu file hoặc tên.".to_owned());
        }
        if chapter.bytes > MAX_CHAPTER_BYTES {
            push_error(format!("File «{}» vượt 100 KB.", chapter.title));
        }
        if chapter.bytes == 0 {
            push_error(format!("Chương «{}» trống.", chapter.title));
        }
        if let Some(num) = chapter.number {
            if !seen_numbers.insert(num) {
                push_error(format!("Trùng số chương {num}."));
            }
            if let Some(prev) = previous {
                if num < prev {
                    push_error("Chương sai thứ tự.".to_owned());
                } else if num > prev + 1 {
                    warnings.push(format!("Thiếu chương {}–{}.", prev + 1, num - 1));
                }
            }
            previous = Some(num);
        }
    }

    if total_bytes > MAX_VOLUME_BYTES {
        push_error("Tổng nội dung quyển vượt 5 MB.".to_owned());
    }

    ChapterValidationReport {
        errors,
        warnings,
        bytes: total_bytes,
    }
}

/// Mở rộng xuống dòng đơn lẻ thành hai `\n\n` (idempotent, giữ nguyên khối >= 2 `\n`).
pub fn normalize_description(value: &str) -> String {
    let mut lf = String::with_capacity(value.len());
    let mut chars = value.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\r' {
            if chars.peek() == Some(&'\n') {
                chars.next();
            }
            lf.push('\n');
        } else {
            lf.push(c);
        }
    }

    let bytes = lf.as_bytes();
    let mut out = String::with_capacity(lf.len() + 8);
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'\n' {
            let start = i;
            let mut nl_count = 1usize;
            i += 1;
            loop {
                let checkpoint = i;
                while i < bytes.len() && (bytes[i] == b' ' || bytes[i] == b'\t') {
                    i += 1;
                }
                if i < bytes.len() && bytes[i] == b'\n' {
                    nl_count += 1;
                    i += 1;
                } else {
                    i = checkpoint;
                    break;
                }
            }
            if nl_count < 2 {
                out.push_str("\n\n");
            } else {
                out.push_str(&lf[start..i]);
            }
        } else {
            let ch = lf[i..].chars().next().expect("valid utf8");
            out.push(ch);
            i += ch.len_utf8();
        }
    }
    out
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum PartSpec {
    Text {
        name: String,
        value: String,
    },
    File {
        name: String,
        file_id: String,
        filename: String,
        content_type: String,
    },
}

impl PartSpec {
    pub fn name(&self) -> &str {
        match self {
            Self::Text { name, .. } | Self::File { name, .. } => name,
        }
    }

    pub fn text_value(&self) -> Option<&str> {
        match self {
            Self::Text { value, .. } => Some(value),
            Self::File { .. } => None,
        }
    }
}

pub fn build_upload_parts(
    book_id: &str,
    volume_id: &str,
    append: bool,
    can_append: bool,
    note: Option<&str>,
    chapters: &[ChapterValidationInput],
) -> Result<Vec<PartSpec>, CoreError> {
    if book_id.is_empty() || volume_id.is_empty() {
        return Err("Upload cần bookId và volumeId thực từ server.".into());
    }
    let check = validate_chapters(chapters);
    if !check.errors.is_empty() {
        return Err(check.errors.join("\n").into());
    }
    if append && !can_append {
        return Err("Quyển này không cho phép bổ sung.".into());
    }

    let mut parts = Vec::with_capacity(3 + if append { 2 } else { 0 } + chapters.len() * 2);
    parts.push(PartSpec::Text {
        name: "bookId".to_owned(),
        value: book_id.to_owned(),
    });
    parts.push(PartSpec::Text {
        name: "volumeId".to_owned(),
        value: volume_id.to_owned(),
    });
    parts.push(PartSpec::Text {
        name: "numFile".to_owned(),
        value: chapters.len().to_string(),
    });

    if append {
        parts.push(PartSpec::Text {
            name: "appendMode".to_owned(),
            value: "true".to_owned(),
        });
        parts.push(PartSpec::Text {
            name: "descCn".to_owned(),
            value: note.unwrap_or("").to_owned(),
        });
    }

    for (index, chapter) in chapters.iter().enumerate() {
        parts.push(PartSpec::Text {
            name: "name".to_owned(),
            value: chapter.title.clone(),
        });
        parts.push(PartSpec::File {
            name: "files".to_owned(),
            file_id: chapter.id.clone(),
            filename: format!("{:04}.txt", index + 1),
            content_type: "text/plain; charset=UTF-8".to_owned(),
        });
    }

    Ok(parts)
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataOptionInput {
    pub value: String,
    #[serde(default)]
    pub label: String,
    #[serde(default)]
    pub required: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataCoverInput {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub mime: String,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetadataModelInput {
    #[serde(default)]
    pub fields: Vec<(String, String)>,
    #[serde(default)]
    pub options: BTreeMap<String, Vec<MetadataOptionInput>>,
    #[serde(default)]
    pub cover_file: Option<MetadataCoverInput>,
    #[serde(default)]
    pub cover_url: String,
}

pub fn build_metadata_parts(model: &MetadataModelInput) -> Result<Vec<PartSpec>, CoreError> {
    for required_field in ["titleVi", "titleCn", "authorCn"] {
        let present = model
            .fields
            .iter()
            .any(|(k, v)| k == required_field && !v.trim().is_empty());
        if !present {
            return Err(format!("Thiếu {required_field}.").into());
        }
    }

    for group in METADATA_GROUPS {
        let Some(opts) = model.options.get(group) else {
            continue;
        };
        if opts.is_empty() {
            continue;
        }
        let selected: Vec<&str> = model
            .fields
            .iter()
            .filter(|(k, _)| k == group)
            .map(|(_, v)| v.as_str())
            .collect();

        if selected
            .iter()
            .any(|id| !opts.iter().any(|opt| opt.value == *id))
        {
            return Err(
                format!("Lựa chọn {group} không còn có trên form. Làm mới dữ liệu.").into(),
            );
        }
        if opts.iter().any(|opt| opt.required) && selected.is_empty() {
            return Err(format!("Chưa chọn {group} bắt buộc.").into());
        }
    }

    let mut parts: Vec<PartSpec> = model
        .fields
        .iter()
        .filter(|(key, _)| key != "coverUrl")
        .map(|(name, value)| PartSpec::Text {
            name: name.clone(),
            value: if name == "descVi" {
                normalize_description(value)
            } else {
                value.clone()
            },
        })
        .collect();

    if let Some(cover) = &model.cover_file {
        let mime = if cover.mime.trim().is_empty() {
            "image/jpeg".to_owned()
        } else {
            cover.mime.clone()
        };
        parts.push(PartSpec::File {
            name: "coverUrl".to_owned(),
            file_id: cover.id.clone(),
            filename: cover.name.clone(),
            content_type: mime,
        });
    } else {
        let cover_url = model
            .fields
            .iter()
            .find(|(k, _)| k == "coverUrl")
            .map(|(_, v)| v.clone())
            .filter(|v| !v.is_empty())
            .unwrap_or_else(|| model.cover_url.clone());
        parts.push(PartSpec::Text {
            name: "coverUrl".to_owned(),
            value: cover_url,
        });
    }

    Ok(parts)
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WriteReplyError {
    ServerRejected { code: i64, message: String },
    Uncertain(String),
}

impl WriteReplyError {
    pub fn is_server_rejected(&self) -> bool {
        matches!(self, Self::ServerRejected { .. })
    }
}

impl fmt::Display for WriteReplyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ServerRejected { message, .. } | Self::Uncertain(message) => f.write_str(message),
        }
    }
}

impl std::error::Error for WriteReplyError {}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct VolumeCreated {
    pub book_id: String,
    pub volume_id: String,
}

pub fn parse_write_response(status: u16, body: &str) -> Result<serde_json::Value, WriteReplyError> {
    if !(200..300).contains(&status) {
        return Err(WriteReplyError::Uncertain(format!("HTTP {status}")));
    }
    let json: serde_json::Value = serde_json::from_str(body).map_err(|_| {
        WriteReplyError::Uncertain("Response không phải JSON. Cần đối chiếu.".into())
    })?;
    let Some(obj) = json.as_object() else {
        return Err(WriteReplyError::Uncertain(
            "Response thiếu mã err của WikiCV.".into(),
        ));
    };
    let Some(err) = obj.get("err").and_then(serde_json::Value::as_i64) else {
        return Err(WriteReplyError::Uncertain(
            "Response thiếu mã err của WikiCV.".into(),
        ));
    };
    if err != 0 {
        return Err(WriteReplyError::ServerRejected {
            code: err,
            message: format!("WikiCV từ chối thao tác (err={err})."),
        });
    }
    Ok(json)
}

pub fn parse_volume_result(status: u16, body: &str) -> Result<VolumeCreated, WriteReplyError> {
    let json = parse_write_response(status, body)?;
    let volume = json
        .get("data")
        .and_then(|d| d.get("volume"))
        .ok_or_else(|| WriteReplyError::Uncertain("Thiếu Mongo ID quyển. Cần đối chiếu.".into()))?;
    let book_id = volume
        .get("book")
        .and_then(|b| b.get("$oid"))
        .and_then(serde_json::Value::as_str)
        .filter(|s| !s.is_empty());
    let volume_id = volume
        .get("_id")
        .and_then(|v| v.get("$oid"))
        .and_then(serde_json::Value::as_str)
        .filter(|s| !s.is_empty());

    match (book_id, volume_id) {
        (Some(book_id), Some(volume_id)) => Ok(VolumeCreated {
            book_id: book_id.to_owned(),
            volume_id: volume_id.to_owned(),
        }),
        _ => Err(WriteReplyError::Uncertain(
            "Thiếu Mongo ID quyển. Cần đối chiếu.".into(),
        )),
    }
}

pub fn sign_book_index(sign_key: &str, start: usize, size: usize, rotate: usize) -> String {
    let raw = format!("{sign_key}{start}{size}");
    let chars: Vec<char> = raw.chars().collect();
    let r = rotate.min(chars.len());
    let mut rotated = String::with_capacity(raw.len());
    for &c in &chars[r..] {
        rotated.push(c);
    }
    for &c in &chars[..r] {
        rotated.push(c);
    }

    let digest = Sha256::digest(rotated.as_bytes());
    let mut hex = String::with_capacity(64);
    for byte in digest {
        use fmt::Write;
        let _ = write!(hex, "{byte:02x}");
    }
    hex
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ch(n: i64) -> ChapterValidationInput {
        ChapterValidationInput {
            id: format!("file-{n}"),
            title: format!("第{n}章 测试"),
            number: Some(n),
            bytes: 1024,
        }
    }

    #[test]
    fn domain_and_book_url_pinning() {
        assert_eq!(
            resolve_wiki_url("/volume", DEFAULT_WIKI_HOST).expect("ok"),
            "https://wikicv.org/volume"
        );
        assert!(resolve_wiki_url("https://wikicv.org.evil.com/volume", DEFAULT_WIKI_HOST).is_err());
        assert!(resolve_wiki_url("http://wikicv.org/volume", DEFAULT_WIKI_HOST).is_err());
        assert!(resolve_wiki_url("javascript:alert(1)", DEFAULT_WIKI_HOST).is_err());
        assert_eq!(
            canonical_wiki_book_path(
                "https://wikicv.org/truyen/test/?page=2#x",
                DEFAULT_WIKI_HOST
            )
            .expect("canonical"),
            "/truyen/test"
        );
        assert!(
            canonical_wiki_book_path("https://wikicv.org/truyen/test/1", DEFAULT_WIKI_HOST)
                .is_err()
        );
    }

    #[test]
    fn write_responses_distinguish_rejection_from_uncertain() {
        let rej = parse_write_response(200, r#"{"err":-3}"#).expect_err("rejected");
        assert!(rej.is_server_rejected());
        assert!(rej.to_string().contains("err=-3"));

        let html = parse_write_response(200, "<html>Login</html>").expect_err("html");
        assert!(!html.is_server_rejected());
        assert!(html.to_string().contains("JSON"));

        let missing_err = parse_write_response(200, r#"{"data":{}}"#).expect_err("missing err");
        assert!(!missing_err.is_server_rejected());
        assert!(missing_err.to_string().contains("err"));

        let missing_mongo = parse_volume_result(200, r#"{"err":0,"data":{"volume":{"id":"x"}}}"#)
            .expect_err("missing mongo");
        assert!(!missing_mongo.is_server_rejected());
        assert!(missing_mongo.to_string().contains("Mongo"));
    }

    #[test]
    fn upload_parts_and_chapter_validation() {
        let parts =
            build_upload_parts("b", "v", false, false, None, &[ch(1), ch(2)]).expect("parts");
        let names: Vec<&str> = parts.iter().map(PartSpec::name).collect();
        assert_eq!(
            names,
            [
                "bookId", "volumeId", "numFile", "name", "files", "name", "files"
            ]
        );

        let append_parts =
            build_upload_parts("b", "v", true, true, Some("23–24"), &[ch(23), ch(24)])
                .expect("append");
        assert_eq!(
            append_parts
                .iter()
                .find(|p| p.name() == "appendMode")
                .and_then(PartSpec::text_value),
            Some("true")
        );
        assert_eq!(
            append_parts
                .iter()
                .find(|p| p.name() == "descCn")
                .and_then(PartSpec::text_value),
            Some("23–24")
        );

        assert!(build_upload_parts("b", "v", true, false, None, &[ch(1)]).is_err());

        assert!(
            validate_chapters(&[ch(1), ch(1)])
                .errors
                .iter()
                .any(|e| e.contains("Trùng"))
        );
        assert!(
            !validate_chapters(&[ch(1), ch(3)]).warnings.is_empty(),
            "gap should warn"
        );
        assert!(
            validate_chapters(&[ch(3), ch(1)])
                .errors
                .contains(&"Chương sai thứ tự.".to_owned())
        );
        let mut oversized = ch(1);
        oversized.bytes = 102_401;
        assert!(!validate_chapters(&[oversized]).errors.is_empty());

        let too_big: Vec<_> = (1..=60)
            .map(|i| ChapterValidationInput {
                bytes: 100_000,
                ..ch(i)
            })
            .collect();
        assert!(
            validate_chapters(&too_big)
                .errors
                .iter()
                .any(|e| e.contains("5 MB"))
        );
    }

    #[test]
    fn metadata_parts_normalize_description_and_validate_options() {
        let model = MetadataModelInput {
            fields: vec![
                ("titleVi".into(), "A".into()),
                ("titleCn".into(), "甲".into()),
                ("authorCn".into(), "乙".into()),
                ("genre".into(), "one".into()),
                ("genre".into(), "two".into()),
                ("descVi".into(), "A\r\nB\nC".into()),
            ],
            ..Default::default()
        };
        let parts = build_metadata_parts(&model).expect("parts");
        assert_eq!(parts.iter().filter(|p| p.name() == "genre").count(), 2);
        assert_eq!(
            parts
                .iter()
                .find(|p| p.name() == "descVi")
                .and_then(PartSpec::text_value),
            Some("A\n\nB\n\nC")
        );
        assert_eq!(model.fields.last().expect("last").1, "A\r\nB\nC");

        for input in ["A\nB", "A\n\nB", "A\n\n\nB", "A\n \nB", "甲\r乙\r\n丙", ""] {
            let out = normalize_description(input);
            assert_eq!(normalize_description(&out), out);
        }
        assert_eq!(normalize_description("A\n\n\nB"), "A\n\n\nB");

        let mut stale = model.clone();
        stale.fields.push(("status".into(), "stale".into()));
        stale.options.insert(
            "status".into(),
            vec![MetadataOptionInput {
                value: "live".into(),
                label: "Live".into(),
                required: false,
            }],
        );
        let err = build_metadata_parts(&stale).expect_err("stale option");
        assert!(err.to_string().contains("không còn"));

        let mut missing_req = model;
        missing_req.options.insert(
            "status".into(),
            vec![MetadataOptionInput {
                value: "live".into(),
                label: "Live".into(),
                required: true,
            }],
        );
        let err = build_metadata_parts(&missing_req).expect_err("missing required");
        assert!(err.to_string().contains("bắt buộc"));
    }

    #[test]
    fn sha256_signing_matches_legacy_rotated_protocol() {
        let digest = Sha256::digest(b"bc050a");
        let expected: String = digest.iter().map(|b| format!("{b:02x}")).collect();
        assert_eq!(sign_book_index("abc", 0, 50, 1), expected);
    }
}
