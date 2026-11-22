use std::fs::{self, File};
use std::io::{self, Cursor, Read, Write};
use std::path::Path;
use std::sync::Arc;

use serde::{Deserialize, Serialize};

use crate::CoreError;
use crate::upload::protocol::parse_https_url;

pub const UTF8_BOM: [u8; 3] = [0xEF, 0xBB, 0xBF];
const STREAM_BUFFER_SIZE: usize = 32 * 1024;

pub type StreamOpener = Arc<dyn Fn() -> io::Result<Box<dyn Read>> + Send + Sync>;

/// Một phần dữ liệu trong thân `multipart/form-data`.
#[derive(Clone)]
pub enum MultipartPart {
    Text {
        name: String,
        value: String,
    },
    Stream {
        name: String,
        filename: String,
        content_type: String,
        length: u64,
        open: StreamOpener,
    },
}

impl std::fmt::Debug for MultipartPart {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Text { name, value } => f
                .debug_struct("Text")
                .field("name", name)
                .field("value", value)
                .finish(),
            Self::Stream {
                name,
                filename,
                content_type,
                length,
                ..
            } => f
                .debug_struct("Stream")
                .field("name", name)
                .field("filename", filename)
                .field("content_type", content_type)
                .field("length", length)
                .finish(),
        }
    }
}

impl MultipartPart {
    pub fn text(name: impl Into<String>, value: impl Into<String>) -> Self {
        Self::Text {
            name: name.into(),
            value: value.into(),
        }
    }

    pub fn stream<F>(
        name: impl Into<String>,
        filename: impl Into<String>,
        content_type: impl Into<String>,
        length: u64,
        open: F,
    ) -> Self
    where
        F: Fn() -> io::Result<Box<dyn Read>> + Send + Sync + 'static,
    {
        Self::Stream {
            name: name.into(),
            filename: filename.into(),
            content_type: content_type.into(),
            length,
            open: Arc::new(open),
        }
    }

    pub fn bytes(
        name: impl Into<String>,
        filename: impl Into<String>,
        content_type: impl Into<String>,
        bytes: Vec<u8>,
    ) -> Self {
        let len = bytes.len() as u64;
        let shared = Arc::new(bytes);
        Self::Stream {
            name: name.into(),
            filename: filename.into(),
            content_type: content_type.into(),
            length: len,
            open: Arc::new(move || {
                let data = Arc::clone(&shared);
                Ok(Box::new(Cursor::new(data.as_ref().to_vec())) as Box<dyn Read>)
            }),
        }
    }

    pub fn open_stream(&self) -> io::Result<Box<dyn Read>> {
        match self {
            Self::Text { value, .. } => Ok(Box::new(Cursor::new(value.as_bytes().to_vec()))),
            Self::Stream { open, .. } => open(),
        }
    }

    pub fn content_type(&self) -> Option<&str> {
        match self {
            Self::Text { .. } => None,
            Self::Stream { content_type, .. } => Some(content_type.as_str()),
        }
    }

    pub fn payload_len(&self) -> u64 {
        match self {
            Self::Text { value, .. } => value.len() as u64,
            Self::Stream { length, .. } => *length,
        }
    }
}

pub fn validate_boundary(boundary: &str) -> Result<(), CoreError> {
    if boundary.is_empty()
        || boundary.len() > 80
        || !boundary
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-')
    {
        return Err("Boundary multipart không hợp lệ.".into());
    }
    Ok(())
}

pub fn quote_param(value: &str) -> Result<String, CoreError> {
    if value.contains('\r') || value.contains('\n') {
        return Err("Tên field/file không hợp lệ.".into());
    }
    Ok(value.replace(['\\', '"'], "_"))
}

fn part_header(boundary: &str, part: &MultipartPart) -> Result<Vec<u8>, CoreError> {
    match part {
        MultipartPart::Text { name, .. } => {
            let quoted_name = quote_param(name)?;
            Ok(format!(
                "--{boundary}\r\nContent-Disposition: form-data; name=\"{quoted_name}\"\r\n\r\n"
            )
            .into_bytes())
        }
        MultipartPart::Stream {
            name,
            filename,
            content_type,
            ..
        } => {
            if content_type.contains('\r') || content_type.contains('\n') {
                return Err("Content-Type multipart không hợp lệ.".into());
            }
            let quoted_name = quote_param(name)?;
            let quoted_file = quote_param(filename)?;
            Ok(format!(
                "--{boundary}\r\nContent-Disposition: form-data; name=\"{quoted_name}\"; filename=\"{quoted_file}\"\r\nContent-Type: {content_type}\r\n\r\n"
            )
            .into_bytes())
        }
    }
}

/// Tính chính xác `Content-Length` của payload `multipart/form-data` trước khi truyền.
pub fn content_length(boundary: &str, parts: &[MultipartPart]) -> Result<u64, CoreError> {
    validate_boundary(boundary)?;
    let mut total = 0u64;
    for part in parts {
        let header = part_header(boundary, part)?;
        let body_len = part.payload_len();
        total = total
            .checked_add(header.len() as u64)
            .and_then(|v| v.checked_add(body_len))
            .and_then(|v| v.checked_add(2))
            .ok_or("Kích thước multipart vượt giới hạn cho phép.")?;
    }
    let footer_len = boundary.len() as u64 + 6; // "--" + boundary + "--\r\n"
    total
        .checked_add(footer_len)
        .ok_or_else(|| "Kích thước multipart vượt giới hạn cho phép.".into())
}

/// Ghi toàn bộ `multipart/form-data` theo luồng đệm 32 KiB và báo tiến độ byte đơn điệu.
pub fn write_multipart<W: Write, F: FnMut(u64)>(
    writer: &mut W,
    boundary: &str,
    parts: &[MultipartPart],
    mut on_bytes: F,
) -> Result<u64, CoreError> {
    validate_boundary(boundary)?;
    let mut sent = 0u64;
    let mut buffer = vec![0u8; STREAM_BUFFER_SIZE];

    let mut emit = |w: &mut W, bytes: &[u8]| -> io::Result<()> {
        w.write_all(bytes)?;
        sent += bytes.len() as u64;
        on_bytes(sent);
        Ok(())
    };

    for part in parts {
        let header = part_header(boundary, part)?;
        emit(writer, &header)?;

        match part {
            MultipartPart::Text { value, .. } => {
                emit(writer, value.as_bytes())?;
            }
            MultipartPart::Stream {
                content_type,
                length,
                open,
                ..
            } => {
                if content_type.contains('\r') || content_type.contains('\n') {
                    return Err("Content-Type multipart không hợp lệ.".into());
                }
                let mut reader = open()?;
                let mut stream_read = 0u64;
                loop {
                    let count = reader.read(&mut buffer)?;
                    if count == 0 {
                        break;
                    }
                    stream_read += count as u64;
                    if stream_read > *length {
                        return Err(
                            "Kích thước tệp thay đổi trong lúc tải lên. Hủy để tránh sai Content-Length."
                                .into(),
                        );
                    }
                    emit(writer, &buffer[..count])?;
                }
                if stream_read != *length {
                    return Err(
                        "Kích thước tệp đọc được không khớp độ dài đã khai báo trước đó.".into(),
                    );
                }
            }
        }
        emit(writer, b"\r\n")?;
    }

    let footer = format!("--{boundary}--\r\n");
    emit(writer, footer.as_bytes())?;
    Ok(sent)
}

fn is_wiki_chapter_upload_part(url: &str, allowed_host: &str, name: &str, filename: &str) -> bool {
    if name != "files" || !filename.to_ascii_lowercase().ends_with(".txt") {
        return false;
    }
    let Ok(parsed) = parse_https_url(url) else {
        return false;
    };
    parsed.port.is_none()
        && parsed.host == allowed_host.to_ascii_lowercase()
        && parsed.path == "/upload-content"
}

fn stream_starts_with_bom(mut reader: Box<dyn Read>) -> io::Result<bool> {
    let mut head = [0u8; 3];
    let mut read_len = 0;
    while read_len < head.len() {
        let n = reader.read(&mut head[read_len..])?;
        if n == 0 {
            break;
        }
        read_len += n;
    }
    Ok(read_len == UTF8_BOM.len() && head == UTF8_BOM)
}

/// Tạo part stream cho một luồng trừu tượng (dùng chung cho File desktop và URI/Stream Android).
///
/// Khi gửi tệp `.txt` tới `https://<allowed_host>/upload-content` ở field `files`,
/// tự động thêm đúng 1 UTF-8 BOM trên đường truyền nếu dữ liệu nguồn chưa có BOM,
/// cập nhật `Content-Type: text/plain; charset=UTF-8` và độ dài thực gửi.
pub fn wiki_upload_stream_part<F>(
    url: &str,
    allowed_host: &str,
    name: impl Into<String>,
    filename: impl Into<String>,
    length: u64,
    content_type: impl Into<String>,
    open: F,
) -> Result<MultipartPart, CoreError>
where
    F: Fn() -> io::Result<Box<dyn Read>> + Send + Sync + 'static,
{
    let name = name.into();
    let filename = filename.into();
    let content_type = content_type.into();
    let opener: StreamOpener = Arc::new(open);

    let is_chapter = is_wiki_chapter_upload_part(url, allowed_host, &name, &filename);
    let needs_bom = if is_chapter {
        !stream_starts_with_bom(opener()?)?
    } else {
        false
    };

    let wire_length = if needs_bom {
        length
            .checked_add(UTF8_BOM.len() as u64)
            .ok_or("Kích thước tệp vượt giới hạn.")?
    } else {
        length
    };
    let wire_content_type = if is_chapter {
        "text/plain; charset=UTF-8".to_owned()
    } else {
        content_type
    };

    Ok(MultipartPart::Stream {
        name,
        filename,
        content_type: wire_content_type,
        length: wire_length,
        open: Arc::new(move || {
            let input = opener()?;
            if needs_bom {
                Ok(Box::new(Cursor::new(UTF8_BOM).chain(input)) as Box<dyn Read>)
            } else {
                Ok(input)
            }
        }),
    })
}

/// Phiên bản thuận tiện cho tệp thường trên filesystem (Desktop).
pub fn wiki_upload_file_part(
    url: &str,
    allowed_host: &str,
    name: impl Into<String>,
    filename: impl Into<String>,
    path: &Path,
    content_type: impl Into<String>,
) -> Result<MultipartPart, CoreError> {
    let meta = fs::metadata(path)?;
    if !meta.is_file() {
        return Err("Đường dẫn upload không phải tệp thường.".into());
    }
    let length = meta.len();
    let owned_path = path.to_path_buf();
    wiki_upload_stream_part(
        url,
        allowed_host,
        name,
        filename,
        length,
        content_type,
        move || Ok(Box::new(File::open(&owned_path)?) as Box<dyn Read>),
    )
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CreditPosition {
    Start,
    #[default]
    End,
    Line(i64),
}

fn is_credit_trim_char(c: char) -> bool {
    matches!(
        c,
        '\u{0009}'..='\u{000D}'
            | ' '
            | '\u{00A0}'
            | '\u{1680}'
            | '\u{2000}'..='\u{200A}'
            | '\u{2028}'
            | '\u{2029}'
            | '\u{202F}'
            | '\u{205F}'
            | '\u{3000}'
            | '\u{FEFF}'
    )
}

fn normalize_newlines(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut chars = text.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\r' {
            if chars.peek() == Some(&'\n') {
                chars.next();
            }
            out.push('\n');
        } else {
            out.push(c);
        }
    }
    out
}

pub fn normalize_credit_text(text: &str) -> String {
    normalize_newlines(text)
        .trim_matches(is_credit_trim_char)
        .to_owned()
}

/// Chèn credit vào bản sao tải lên theo đúng quy tắc Start / End / Line của mobile & userscript.
pub fn apply_upload_credit(content: &str, credit_text: &str, position: CreditPosition) -> String {
    let credit = normalize_credit_text(credit_text);
    if credit.is_empty() {
        return content.to_owned();
    }
    let body = normalize_credit_text(content);
    if body.is_empty() {
        return credit;
    }
    match position {
        CreditPosition::Start => format!("{credit}\n\n{body}"),
        CreditPosition::End => format!("{body}\n\n{credit}"),
        CreditPosition::Line(line) => {
            let mut lines: Vec<&str> = body.split('\n').collect();
            let idx = line.saturating_sub(1).clamp(0, lines.len() as i64) as usize;
            let credit_lines: Vec<&str> = credit.split('\n').collect();
            lines.splice(idx..idx, credit_lines);
            lines.join("\n")
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    const DEFAULT_HOST: &str = "wikicv.org";
    const UPLOAD_URL: &str = "https://wikicv.org/upload-content";

    fn read_part_bytes(part: &MultipartPart) -> Vec<u8> {
        let mut reader = part.open_stream().expect("open part");
        let mut out = Vec::new();
        reader.read_to_end(&mut out).expect("read part");
        out
    }

    #[test]
    fn imported_chinese_gets_unambiguous_bom_without_changing_draft_or_retry_bytes() {
        let dir = tempdir().expect("tempdir");
        let file = dir.path().join("chapter.txt");
        let text = "第1章:一人一狗\n(主角立场：混沌邪恶。)\n中文 Tiếng Việt 😀\n";
        let stored = text.as_bytes();
        fs::write(&file, stored).expect("write");

        let part = wiki_upload_file_part(
            UPLOAD_URL,
            DEFAULT_HOST,
            "files",
            "0001.txt",
            &file,
            "text/plain",
        )
        .expect("wiki part");
        let bytes = read_part_bytes(&part);

        let mut expected = UTF8_BOM.to_vec();
        expected.extend_from_slice(stored);

        assert_eq!(bytes, expected);
        assert_eq!(part.payload_len(), bytes.len() as u64);
        assert_eq!(part.content_type(), Some("text/plain; charset=UTF-8"));
        assert_eq!(read_part_bytes(&part), bytes);
        let retry_part = wiki_upload_file_part(
            UPLOAD_URL,
            DEFAULT_HOST,
            "files",
            "0001.txt",
            &file,
            "text/plain",
        )
        .expect("retry part");
        assert_eq!(read_part_bytes(&retry_part), bytes);
        assert_eq!(fs::read(&file).expect("source untouched"), stored);
    }

    #[test]
    fn existing_bom_is_not_duplicated() {
        let dir = tempdir().expect("tempdir");
        let file = dir.path().join("with_bom.txt");
        let mut stored = UTF8_BOM.to_vec();
        stored.extend_from_slice("第一章\r\n正文".as_bytes());
        fs::write(&file, &stored).expect("write");

        let part = wiki_upload_file_part(
            UPLOAD_URL,
            DEFAULT_HOST,
            "files",
            "0001.TXT",
            &file,
            "text/plain",
        )
        .expect("part");
        assert_eq!(read_part_bytes(&part), stored);
        assert_eq!(part.payload_len(), stored.len() as u64);
    }

    #[test]
    fn multipart_length_and_progress_include_bom_for_every_chapter() {
        let dir = tempdir().expect("tempdir");
        let file = dir.path().join("c.txt");
        fs::write(&file, "第一章\n正文".as_bytes()).expect("write");

        let parts = vec![
            MultipartPart::text("name", "第一章"),
            wiki_upload_file_part(
                UPLOAD_URL,
                DEFAULT_HOST,
                "files",
                "0001.txt",
                &file,
                "text/plain",
            )
            .expect("p1"),
            MultipartPart::text("name", "第二章"),
            wiki_upload_file_part(
                UPLOAD_URL,
                DEFAULT_HOST,
                "files",
                "0002.txt",
                &file,
                "text/plain",
            )
            .expect("p2"),
        ];

        let mut output = Vec::new();
        let mut progress = Vec::new();
        let written =
            write_multipart(&mut output, "Fixture", &parts, |n| progress.push(n)).expect("write");

        assert_eq!(written, output.len() as u64);
        assert_eq!(
            output.len() as u64,
            content_length("Fixture", &parts).expect("length")
        );
        assert_eq!(progress.last().copied(), Some(output.len() as u64));
        assert!(progress.windows(2).all(|w| w[0] <= w[1]));

        let body = String::from_utf8(output).expect("utf8");
        assert_eq!(body.chars().filter(|&c| c == '\u{FEFF}').count(), 2);
    }

    #[test]
    fn cover_archives_other_endpoints_and_other_origins_keep_exact_bytes() {
        let dir = tempdir().expect("tempdir");
        let file = dir.path().join("raw.bin");
        let raw = vec![0xFF, 0x00, 0x01];
        fs::write(&file, &raw).expect("write");

        let cases = [
            ("https://wikicv.org/nhung-file", "cover", "cover.jpg"),
            (UPLOAD_URL, "cover", "cover.txt"),
            (UPLOAD_URL, "files", "archive.zip"),
            ("https://wikicv.org/other", "files", "0001.txt"),
            (
                "https://wikicv.org.example.org/upload-content",
                "files",
                "0001.txt",
            ),
            ("http://wikicv.org/upload-content", "files", "0001.txt"),
            (
                "https://user@wikicv.org/upload-content",
                "files",
                "0001.txt",
            ),
        ];

        for (target, name, filename) in cases {
            let part = wiki_upload_file_part(
                target,
                DEFAULT_HOST,
                name,
                filename,
                &file,
                "application/octet-stream",
            )
            .expect("part");
            assert_eq!(read_part_bytes(&part), raw);
            assert_eq!(part.payload_len(), raw.len() as u64);
            assert_eq!(part.content_type(), Some("application/octet-stream"));
        }
    }

    #[test]
    fn multipart_rejects_header_injection_and_length_mismatch() {
        assert!(validate_boundary("bad boundary!").is_err());
        assert!(quote_param("bad\r\nname").is_err());
        assert_eq!(quote_param(r#"a"b\c"#).expect("quoted"), "a_b_c");

        let bad_part = MultipartPart::stream("files", "a.txt", "text/plain", 10, || {
            Ok(Box::new(Cursor::new(b"short".to_vec())))
        });
        let mut out = Vec::new();
        assert!(write_multipart(&mut out, "Boundary1", &[bad_part], |_| {}).is_err());
    }

    #[test]
    fn credit_matches_script_newlines_unicode_and_positions() {
        assert_eq!(
            apply_upload_credit(
                "\u{FEFF} 第一章\r\n正文😀 \r\n",
                "\r\nNguồn: 甲\rEditor: Việt\r\n",
                CreditPosition::End
            ),
            "第一章\n正文😀\n\nNguồn: 甲\nEditor: Việt"
        );
        assert_eq!(
            apply_upload_credit("正文", "Editor: Bảo", CreditPosition::Start),
            "Editor: Bảo\n\n正文"
        );
        assert_eq!(
            apply_upload_credit(
                "甲\r\n乙\r丙",
                "Credit 1\nCredit 2",
                CreditPosition::Line(2)
            ),
            "甲\nCredit 1\nCredit 2\n乙\n丙"
        );
        assert_eq!(
            apply_upload_credit("甲\n乙", "Credit", CreditPosition::Line(i64::MAX)),
            "甲\n乙\nCredit"
        );
        assert_eq!(
            apply_upload_credit("甲\n乙", "Credit", CreditPosition::Line(i64::MIN)),
            "Credit\n甲\n乙"
        );
        let original = "\u{FEFF} 甲\r\n乙\r\n ";
        assert_eq!(
            apply_upload_credit(original, " \t\r\n\u{FEFF}", CreditPosition::End),
            original
        );
        assert_eq!(
            apply_upload_credit(" \r\n", "Credit", CreditPosition::Start),
            "Credit"
        );
    }
}
