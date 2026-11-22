use std::collections::{BTreeMap, HashMap};

use miniz_oxide::inflate::decompress_to_vec;
use serde_json::{Map, Value};
use sha2::{Digest, Sha256};

use crate::CoreError;
use crate::upload::backup_zip::crc32_bytes;
use crate::vbook::model::ExtensionType;

const LOCAL_FILE_HEADER_SIG: u32 = 0x0403_4B50;
const CENTRAL_DIR_HEADER_SIG: u32 = 0x0201_4B50;
const EOCD_SIG: u32 = 0x0605_4B50;
const METHOD_STORED: u16 = 0;
const METHOD_DEFLATE: u16 = 8;

pub const MAX_PACKAGE_ZIP_BYTES: usize = 32 * 1024 * 1024;
pub const MAX_PACKAGE_UNPACK_BYTES: usize = 32 * 1024 * 1024;
pub const MAX_PACKAGE_ENTRIES: usize = 2_048;
pub const MAX_ICON_BYTES: usize = 512 * 1024;

#[derive(Debug, Clone, PartialEq)]
pub struct ParsedExtensionPackage {
    pub name: String,
    pub author: String,
    pub version: i32,
    pub source: String,
    pub host: String,
    pub regexp: String,
    pub description: String,
    pub locale: String,
    pub ext_type: ExtensionType,
    pub is_nsfw: bool,
    pub is_encrypted: bool,
    pub icon_data_url: String,
    pub icon_bytes: Option<(String, Vec<u8>)>,
    pub raw_plugin_json: String,
    pub scripts: BTreeMap<String, String>,
    pub config_schema: BTreeMap<String, Value>,
    pub actions: BTreeMap<String, Value>,
    pub source_files: BTreeMap<String, Vec<u8>>,
}

/// Tạo ID 32 ký tự hex ổn định từ `path` hoặc khóa mở rộng (tương tự `lsl.m(umg.w(path))`).
pub fn deterministic_extension_id(path_or_key: &str) -> String {
    let trimmed = path_or_key.trim();
    let digest = Sha256::digest(trimmed.as_bytes());
    let mut out = String::with_capacity(32);
    for byte in &digest[..16] {
        use std::fmt::Write;
        let _ = write!(&mut out, "{byte:02x}");
    }
    out
}

pub fn normalize_host_from_source(source: &str) -> String {
    let trimmed = source.trim();
    let without_scheme = trimmed
        .strip_prefix("https://")
        .or_else(|| trimmed.strip_prefix("http://"))
        .or_else(|| {
            let low = trimmed.to_ascii_lowercase();
            if low.starts_with("https://") {
                Some(&trimmed[8..])
            } else if low.starts_with("http://") {
                Some(&trimmed[7..])
            } else {
                None
            }
        })
        .unwrap_or(trimmed);
    let host_port = without_scheme.split('/').next().unwrap_or("");
    let host = host_port.split('?').next().unwrap_or("");
    host.trim().to_ascii_lowercase()
}

pub fn parse_version_i32(value: Option<&Value>) -> i32 {
    match value {
        Some(Value::Number(n)) => n
            .as_i64()
            .and_then(|v| i32::try_from(v).ok())
            .unwrap_or(0)
            .max(0),
        Some(Value::String(s)) => s.trim().parse::<i32>().unwrap_or(0).max(0),
        _ => 0,
    }
}

/// Giải nén gói extension `.zip` (Stored hoặc Deflate) và trích xuất `plugin.json`, `icon`, `src/*`.
pub fn parse_vbook_zip(bytes: &[u8]) -> Result<ParsedExtensionPackage, CoreError> {
    if bytes.len() > MAX_PACKAGE_ZIP_BYTES {
        return Err("Tệp plugin ZIP vượt quá giới hạn 32 MiB.".into());
    }
    let raw_entries = unzip_entries(bytes)?;
    if raw_entries.is_empty() {
        return Err("Tệp plugin ZIP rỗng.".into());
    }

    let prefix = find_plugin_json_prefix(&raw_entries)?;
    let mut files: BTreeMap<String, Vec<u8>> = BTreeMap::new();
    for (name, data) in raw_entries {
        if prefix.is_empty() {
            files.insert(name, data);
        } else if let Some(stripped) = name.strip_prefix(&prefix)
            && !stripped.is_empty()
        {
            files.insert(stripped.to_owned(), data);
        }
    }

    let plugin_bytes = files
        .get("plugin.json")
        .ok_or("Tệp ZIP không chứa plugin.json hợp lệ.")?;
    let raw_plugin_json = String::from_utf8(plugin_bytes.clone())
        .map_err(|_| "plugin.json phải dùng mã hóa UTF-8 hợp lệ.")?;
    let root_val: Value = serde_json::from_str(&raw_plugin_json)
        .map_err(|err| format!("plugin.json không đúng định dạng JSON: {err}"))?;
    let root_obj = root_val
        .as_object()
        .ok_or("plugin.json phải là JSON object.")?;

    let metadata = root_obj
        .get("metadata")
        .and_then(Value::as_object)
        .ok_or("plugin.json thiếu mục metadata.")?;

    let name = read_str(metadata, "name");
    if name.is_empty() {
        return Err("plugin.json thiếu metadata.name.".into());
    }
    let author = read_str(metadata, "author");
    let version = parse_version_i32(metadata.get("version"));
    let source = read_str(metadata, "source");
    let host = normalize_host_from_source(&source);
    let regexp = read_str(metadata, "regexp");
    let description = read_str(metadata, "description");
    let raw_locale = read_str(metadata, "locale");
    let locale = if raw_locale.eq_ignore_ascii_case("global") {
        String::new()
    } else {
        raw_locale.replace('_', "-")
    };
    let ext_type = ExtensionType::from_raw(&read_str(metadata, "type"));
    let is_nsfw = parse_bool_field(metadata.get("nsfw"))
        .unwrap_or_else(|| read_str(metadata, "tag").eq_ignore_ascii_case("nsfw"));
    let is_encrypted = parse_bool_field(metadata.get("encrypt")).unwrap_or(false);

    let scripts = parse_string_map(root_obj.get("script").and_then(Value::as_object));
    let config_schema = parse_value_map(root_obj.get("config").and_then(Value::as_object));
    let actions = parse_value_map(root_obj.get("actions").and_then(Value::as_object));

    let icon_hint = read_str(metadata, "icon");
    let (icon_data_url, icon_bytes) = extract_icon(&files, &icon_hint);

    let mut source_files = BTreeMap::new();
    for (rel_path, data) in files {
        if rel_path.starts_with("src/") || rel_path.ends_with(".js") {
            source_files.insert(rel_path, data);
        }
    }

    Ok(ParsedExtensionPackage {
        name,
        author,
        version,
        source,
        host,
        regexp,
        description,
        locale,
        ext_type,
        is_nsfw,
        is_encrypted,
        icon_data_url,
        icon_bytes,
        raw_plugin_json,
        scripts,
        config_schema,
        actions,
        source_files,
    })
}

fn find_plugin_json_prefix(entries: &HashMap<String, Vec<u8>>) -> Result<String, CoreError> {
    if entries.contains_key("plugin.json") {
        return Ok(String::new());
    }
    let mut candidates: Vec<&str> = entries
        .keys()
        .filter_map(|k| k.strip_suffix("/plugin.json"))
        .collect();
    candidates.sort_unstable();
    if let Some(first) = candidates.first()
        && !first.is_empty()
        && !first.contains('/')
    {
        return Ok(format!("{first}/"));
    }
    Err("Tệp ZIP không chứa plugin.json ở thư mục gốc hoặc thư mục con cấp 1.".into())
}

fn extract_icon(
    files: &BTreeMap<String, Vec<u8>>,
    icon_hint: &str,
) -> (String, Option<(String, Vec<u8>)>) {
    let mut candidates: Vec<&str> = Vec::new();
    let trimmed_hint = icon_hint.trim().trim_start_matches("./");
    if !trimmed_hint.is_empty()
        && !trimmed_hint.starts_with("http://")
        && !trimmed_hint.starts_with("https://")
    {
        candidates.push(trimmed_hint);
    }
    candidates.extend(["icon.png", "icon.jpg", "icon.jpeg", "icon.webp"]);

    for candidate in candidates {
        if let Some(bytes) = files.get(candidate)
            && !bytes.is_empty()
            && bytes.len() <= MAX_ICON_BYTES
        {
            let mime = if candidate.ends_with(".jpg") || candidate.ends_with(".jpeg") {
                "image/jpeg"
            } else if candidate.ends_with(".webp") {
                "image/webp"
            } else {
                "image/png"
            };
            let data_url = format!("data:{mime};base64,{}", encode_base64(bytes));
            return (data_url, Some((candidate.to_owned(), bytes.clone())));
        }
    }
    (String::new(), None)
}

fn read_str(obj: &Map<String, Value>, key: &str) -> String {
    match obj.get(key) {
        Some(Value::String(s)) => s.trim().to_owned(),
        Some(Value::Number(n)) => n.to_string(),
        _ => String::new(),
    }
}

fn parse_bool_field(val: Option<&Value>) -> Option<bool> {
    match val {
        Some(Value::Bool(b)) => Some(*b),
        Some(Value::String(s)) => {
            let low = s.trim().to_ascii_lowercase();
            if low == "true" || low == "1" {
                Some(true)
            } else if low == "false" || low == "0" {
                Some(false)
            } else {
                None
            }
        }
        _ => None,
    }
}

fn parse_string_map(obj: Option<&Map<String, Value>>) -> BTreeMap<String, String> {
    let mut out = BTreeMap::new();
    let Some(map) = obj else {
        return out;
    };
    for (k, v) in map {
        if let Some(s) = v.as_str() {
            let val = s.trim();
            if !val.is_empty() {
                out.insert(k.clone(), val.to_owned());
            }
        }
    }
    out
}

fn parse_value_map(obj: Option<&Map<String, Value>>) -> BTreeMap<String, Value> {
    let mut out = BTreeMap::new();
    let Some(map) = obj else {
        return out;
    };
    for (k, v) in map {
        out.insert(k.clone(), v.clone());
    }
    out
}

fn sanitize_zip_entry_path(raw: &str) -> Result<String, CoreError> {
    let normalized = raw.replace('\\', "/");
    let trimmed = normalized.trim_start_matches("./");
    if trimmed.is_empty() || trimmed.ends_with('/') {
        return Ok(String::new());
    }
    if trimmed.starts_with('/') || trimmed.contains('\0') {
        return Err(format!("Đường dẫn trong ZIP không an toàn: {raw}").into());
    }
    let mut parts = Vec::new();
    for seg in trimmed.split('/') {
        if seg.is_empty() || seg == "." {
            continue;
        }
        if seg == ".." || seg.contains(':') {
            return Err(format!("Đường dẫn trong ZIP chứa thành phần bị cấm: {raw}").into());
        }
        parts.push(seg);
    }
    if parts.is_empty() {
        return Ok(String::new());
    }
    Ok(parts.join("/"))
}

fn unzip_entries(bytes: &[u8]) -> Result<HashMap<String, Vec<u8>>, CoreError> {
    let eocd_offset = find_eocd(bytes)?;
    let total_entries = read_u16_le(bytes, eocd_offset + 10)? as usize;
    let cd_size = read_u32_le(bytes, eocd_offset + 12)? as usize;
    let cd_offset = read_u32_le(bytes, eocd_offset + 16)? as usize;
    if total_entries > MAX_PACKAGE_ENTRIES {
        return Err("Gói plugin ZIP chứa quá nhiều tệp.".into());
    }
    let cd_end = cd_offset
        .checked_add(cd_size)
        .filter(|&end| end <= eocd_offset)
        .ok_or("Central Directory trong ZIP vượt ngoài phạm vi tệp.")?;

    let mut out = HashMap::with_capacity(total_entries);
    let mut cursor = cd_offset;
    let mut total_unpacked = 0usize;

    for _ in 0..total_entries {
        if cursor + 46 > cd_end || read_u32_le(bytes, cursor)? != CENTRAL_DIR_HEADER_SIG {
            return Err("Central Directory Header trong ZIP bị hỏng.".into());
        }
        let method = read_u16_le(bytes, cursor + 10)?;
        let expected_crc = read_u32_le(bytes, cursor + 16)?;
        let comp_size = read_u32_le(bytes, cursor + 20)? as usize;
        let uncomp_size = read_u32_le(bytes, cursor + 24)? as usize;
        let name_len = read_u16_le(bytes, cursor + 28)? as usize;
        let extra_len = read_u16_le(bytes, cursor + 30)? as usize;
        let comment_len = read_u16_le(bytes, cursor + 32)? as usize;
        let local_offset = read_u32_le(bytes, cursor + 42)? as usize;

        let name_start = cursor + 46;
        let name_end = name_start + name_len;
        if name_end + extra_len + comment_len > cd_end {
            return Err("Mục Central Directory bị cắt cụt.".into());
        }
        let raw_name = String::from_utf8_lossy(&bytes[name_start..name_end]).into_owned();
        cursor = name_end + extra_len + comment_len;

        let safe_path = sanitize_zip_entry_path(&raw_name)?;
        if safe_path.is_empty() {
            continue;
        }
        if uncomp_size > MAX_PACKAGE_UNPACK_BYTES {
            return Err("Kích thước tệp trong plugin ZIP vượt quá giới hạn an toàn.".into());
        }

        if local_offset + 30 > bytes.len()
            || read_u32_le(bytes, local_offset)? != LOCAL_FILE_HEADER_SIG
        {
            return Err(format!("Local File Header của `{safe_path}` không hợp lệ.").into());
        }
        let local_name_len = read_u16_le(bytes, local_offset + 26)? as usize;
        let local_extra_len = read_u16_le(bytes, local_offset + 28)? as usize;
        let data_start = local_offset + 30 + local_name_len + local_extra_len;
        let data_end = data_start
            .checked_add(comp_size)
            .filter(|&end| end <= bytes.len())
            .ok_or("Dữ liệu nén trong ZIP vượt ngoài tệp.")?;
        let comp_slice = &bytes[data_start..data_end];

        let unpacked = match method {
            METHOD_STORED => comp_slice.to_vec(),
            METHOD_DEFLATE => decompress_to_vec(comp_slice)
                .map_err(|err| format!("Giải nén Deflate `{safe_path}` thất bại: {err:?}"))?,
            other => return Err(format!("Phương thức nén ZIP chưa hỗ trợ: {other}").into()),
        };
        if unpacked.len() != uncomp_size || crc32_bytes(&unpacked) != expected_crc {
            return Err(format!("Sai kích thước hoặc CRC-32 ở mục `{safe_path}`.").into());
        }
        total_unpacked = total_unpacked
            .checked_add(unpacked.len())
            .filter(|&n| n <= MAX_PACKAGE_UNPACK_BYTES)
            .ok_or("Tổng dung lượng giải nén plugin ZIP vượt quá 32 MiB.")?;
        out.insert(safe_path, unpacked);
    }

    Ok(out)
}

fn find_eocd(bytes: &[u8]) -> Result<usize, CoreError> {
    if bytes.len() < 22 {
        return Err("Tệp không phải định dạng ZIP hợp lệ.".into());
    }
    let min_pos = bytes.len().saturating_sub(22 + u16::MAX as usize);
    for pos in (min_pos..=bytes.len() - 22).rev() {
        if bytes[pos..pos + 4] == EOCD_SIG.to_le_bytes() {
            let comment_len = read_u16_le(bytes, pos + 20)? as usize;
            if pos + 22 + comment_len == bytes.len() {
                return Ok(pos);
            }
        }
    }
    Err("Không tìm thấy End of Central Directory trong tệp ZIP.".into())
}

fn read_u16_le(bytes: &[u8], offset: usize) -> Result<u16, CoreError> {
    let slice: [u8; 2] = bytes
        .get(offset..offset + 2)
        .and_then(|s| s.try_into().ok())
        .ok_or("Đọc ZIP vượt giới hạn u16.")?;
    Ok(u16::from_le_bytes(slice))
}

fn read_u32_le(bytes: &[u8], offset: usize) -> Result<u32, CoreError> {
    let slice: [u8; 4] = bytes
        .get(offset..offset + 4)
        .and_then(|s| s.try_into().ok())
        .ok_or("Đọc ZIP vượt giới hạn u32.")?;
    Ok(u32::from_le_bytes(slice))
}

pub fn encode_base64(input: &[u8]) -> String {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity(input.len().div_ceil(3) * 4);
    for chunk in input.chunks(3) {
        let b0 = chunk[0];
        let b1 = chunk.get(1).copied().unwrap_or(0);
        let b2 = chunk.get(2).copied().unwrap_or(0);
        let triple = (u32::from(b0) << 16) | (u32::from(b1) << 8) | u32::from(b2);
        out.push(TABLE[((triple >> 18) & 0x3F) as usize] as char);
        out.push(TABLE[((triple >> 12) & 0x3F) as usize] as char);
        out.push(if chunk.len() > 1 {
            TABLE[((triple >> 6) & 0x3F) as usize] as char
        } else {
            '='
        });
        out.push(if chunk.len() > 2 {
            TABLE[(triple & 0x3F) as usize] as char
        } else {
            '='
        });
    }
    out
}

#[cfg(test)]
pub(crate) fn build_test_zip(entries: &[(&str, &[u8])], use_deflate: bool) -> Vec<u8> {
    use miniz_oxide::deflate::compress_to_vec;

    let mut out = Vec::new();
    let mut central = Vec::new();
    for (name, raw) in entries {
        let crc = crc32_bytes(raw);
        let (method, payload) = if use_deflate {
            (METHOD_DEFLATE, compress_to_vec(raw, 6))
        } else {
            (METHOD_STORED, raw.to_vec())
        };
        let local_offset = out.len() as u32;
        let name_bytes = name.as_bytes();
        out.extend_from_slice(&LOCAL_FILE_HEADER_SIG.to_le_bytes());
        out.extend_from_slice(&20u16.to_le_bytes());
        out.extend_from_slice(&0x0800u16.to_le_bytes());
        out.extend_from_slice(&method.to_le_bytes());
        out.extend_from_slice(&0u32.to_le_bytes());
        out.extend_from_slice(&crc.to_le_bytes());
        out.extend_from_slice(&(payload.len() as u32).to_le_bytes());
        out.extend_from_slice(&(raw.len() as u32).to_le_bytes());
        out.extend_from_slice(&(name_bytes.len() as u16).to_le_bytes());
        out.extend_from_slice(&0u16.to_le_bytes());
        out.extend_from_slice(name_bytes);
        out.extend_from_slice(&payload);

        central.extend_from_slice(&CENTRAL_DIR_HEADER_SIG.to_le_bytes());
        central.extend_from_slice(&20u16.to_le_bytes());
        central.extend_from_slice(&20u16.to_le_bytes());
        central.extend_from_slice(&0x0800u16.to_le_bytes());
        central.extend_from_slice(&method.to_le_bytes());
        central.extend_from_slice(&0u32.to_le_bytes());
        central.extend_from_slice(&crc.to_le_bytes());
        central.extend_from_slice(&(payload.len() as u32).to_le_bytes());
        central.extend_from_slice(&(raw.len() as u32).to_le_bytes());
        central.extend_from_slice(&(name_bytes.len() as u16).to_le_bytes());
        central.extend_from_slice(&0u16.to_le_bytes());
        central.extend_from_slice(&0u16.to_le_bytes());
        central.extend_from_slice(&0u16.to_le_bytes());
        central.extend_from_slice(&0u16.to_le_bytes());
        central.extend_from_slice(&0u32.to_le_bytes());
        central.extend_from_slice(&local_offset.to_le_bytes());
        central.extend_from_slice(name_bytes);
    }
    let cd_offset = out.len() as u32;
    let cd_size = central.len() as u32;
    out.extend_from_slice(&central);
    let count = entries.len() as u16;
    out.extend_from_slice(&EOCD_SIG.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&count.to_le_bytes());
    out.extend_from_slice(&count.to_le_bytes());
    out.extend_from_slice(&cd_size.to_le_bytes());
    out.extend_from_slice(&cd_offset.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes());
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_stored_and_deflate_vbook_zip_packages() {
        let plugin_json = r#"{
            "metadata": {
                "name": "Truyen Demo",
                "author": "TacGia",
                "version": 3,
                "source": "https://example.org/novels",
                "regexp": "example\\.org/truyen/\\d+",
                "description": "Mo ta demo",
                "locale": "zh_CN",
                "type": "novel",
                "tag": "nsfw"
            },
            "script": {
                "chap": "chap.js",
                "detail": "detail.js"
            },
            "config": {
                "timeout": { "type": "number", "default": 15 }
            }
        }"#;
        let entries = [
            ("demo-ext/plugin.json", plugin_json.as_bytes()),
            ("demo-ext/icon.png", &[0x89, b'P', b'N', b'G', 1, 2, 3]),
            ("demo-ext/src/chap.js", b"function execute(url) {}"),
        ];

        for use_deflate in [false, true] {
            let zip_bytes = build_test_zip(&entries, use_deflate);
            let pkg = parse_vbook_zip(&zip_bytes).expect("parse vbook zip");
            assert_eq!(pkg.name, "Truyen Demo");
            assert_eq!(pkg.author, "TacGia");
            assert_eq!(pkg.version, 3);
            assert_eq!(pkg.host, "example.org");
            assert_eq!(pkg.locale, "zh-CN");
            assert_eq!(pkg.ext_type, ExtensionType::Novel);
            assert!(pkg.is_nsfw);
            assert_eq!(pkg.scripts.get("chap").map(String::as_str), Some("chap.js"));
            assert!(pkg.config_schema.contains_key("timeout"));
            assert!(pkg.icon_data_url.starts_with("data:image/png;base64,"));
            assert!(pkg.source_files.contains_key("src/chap.js"));
        }
    }

    #[test]
    fn rejects_zip_with_path_traversal() {
        let zip_bytes = build_test_zip(&[("../evil.txt", b"boom")], false);
        let err = parse_vbook_zip(&zip_bytes).expect_err("must block ..");
        assert!(err.to_string().contains("cấm"));
    }
}
