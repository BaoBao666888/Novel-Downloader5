use encoding_rs::{GB18030, WINDOWS_1252};

use crate::CoreError;

pub(crate) fn decode_txt_bytes(raw: &[u8]) -> Result<(String, String), CoreError> {
    if let Some(rest) = raw.strip_prefix(b"\xef\xbb\xbf") {
        let text = std::str::from_utf8(rest)
            .map_err(|_| "Tệp TXT không dùng UTF-8 hợp lệ.")?
            .replace("\r\n", "\n")
            .replace('\r', "\n");
        return Ok((text, "utf-8-bom".to_owned()));
    }
    if let Some(rest) = raw.strip_prefix(b"\xff\xfe") {
        let units: Vec<u16> = rest
            .chunks_exact(2)
            .map(|c| u16::from_le_bytes([c[0], c[1]]))
            .collect();
        let text = String::from_utf16_lossy(&units)
            .replace("\r\n", "\n")
            .replace('\r', "\n");
        return Ok((text, "utf-16le".to_owned()));
    }
    if let Some(rest) = raw.strip_prefix(b"\xfe\xff") {
        let units: Vec<u16> = rest
            .chunks_exact(2)
            .map(|c| u16::from_be_bytes([c[0], c[1]]))
            .collect();
        let text = String::from_utf16_lossy(&units)
            .replace("\r\n", "\n")
            .replace('\r', "\n");
        return Ok((text, "utf-16be".to_owned()));
    }
    if let Ok(utf8) = std::str::from_utf8(raw) {
        return Ok((
            utf8.replace("\r\n", "\n").replace('\r', "\n"),
            "utf-8".to_owned(),
        ));
    }
    let text = GB18030
        .decode_without_bom_handling_and_without_replacement(raw)
        .ok_or("Tệp TXT không phải UTF-8, UTF-16 hay GB18030 hợp lệ.")?;
    Ok((
        text.replace("\r\n", "\n").replace('\r', "\n"),
        "gb18030".to_owned(),
    ))
}

pub(crate) fn decode_zip_text(raw: &[u8], truncated: bool) -> (String, String) {
    let utf8 = raw.strip_prefix(b"\xef\xbb\xbf").unwrap_or(raw);
    if truncated
        && let Err(error) = std::str::from_utf8(utf8)
        && error.error_len().is_none()
        && let Ok((text, encoding)) =
            decode_txt_bytes(&raw[..raw.len() - (utf8.len() - error.valid_up_to())])
    {
        return (text, encoding);
    }
    if let Ok(decoded) = decode_txt_bytes(raw) {
        return decoded;
    }
    if raw.starts_with(b"\xef\xbb\xbf") {
        return (
            String::from_utf8_lossy(utf8)
                .replace("\r\n", "\n")
                .replace('\r', "\n"),
            "utf-8-lossy".to_owned(),
        );
    }
    let (text, _) = WINDOWS_1252.decode_without_bom_handling(raw);
    (
        text.replace("\r\n", "\n").replace('\r', "\n"),
        "windows-1252".to_owned(),
    )
}
