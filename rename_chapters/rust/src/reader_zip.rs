use std::fs::File;
use std::io::Read;
use std::path::Path;

use encoding_rs::GB18030;
use zip::{ZipArchive, read::ZipFile};

use crate::CoreError;

pub struct TextMember {
    pub index: usize,
    pub name: String,
    pub size: u64,
}

fn text_member(file: &ZipFile<'_, impl Read>) -> Option<String> {
    if file.is_dir() || file.is_symlink() || file.encrypted() {
        return None;
    }
    let raw = file.name_raw();
    let decoded = std::str::from_utf8(raw)
        .ok()
        .map(std::borrow::Cow::Borrowed)
        .or_else(|| GB18030.decode_without_bom_handling_and_without_replacement(raw));
    let name = decoded.as_deref().unwrap_or_else(|| file.name());
    let normalized = name.replace('\\', "/");
    if normalized.starts_with('/')
        || normalized.as_bytes().get(1) == Some(&b':')
        || normalized.contains('\0')
        || normalized.split('/').any(|part| part == "..")
        || normalized.ends_with('/')
        || !normalized.to_ascii_lowercase().ends_with(".txt")
    {
        return None;
    }
    Some(normalized)
}

pub fn list(path: &Path) -> Result<Vec<TextMember>, CoreError> {
    let mut archive = ZipArchive::new(File::open(path)?)?;
    let mut members = Vec::new();
    for index in 0..archive.len() {
        let file = archive.by_index_raw(index)?;
        if let Some(name) = text_member(&file) {
            members.push(TextMember {
                index,
                name,
                size: file.size(),
            });
        }
    }
    Ok(members)
}

pub fn read(path: &Path, index: usize, limit: usize) -> Result<(Vec<u8>, bool), CoreError> {
    let mut archive = ZipArchive::new(File::open(path)?)?;
    let file = archive.by_index(index)?;
    if text_member(&file).is_none() {
        return Err("Mục này không phải chương TXT có thể đọc.".into());
    }
    let mut bytes = Vec::new();
    file.take(limit as u64 + 1).read_to_end(&mut bytes)?;
    let truncated = bytes.len() > limit;
    bytes.truncate(limit);
    Ok((bytes, truncated))
}
