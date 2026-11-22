use std::fs::File;
use std::io::{self, BufReader, Read, Write};
use std::path::Path;

use encoding_rs::GB18030;
use zip::{CompressionMethod, ZipArchive, read::ZipFile};

use crate::CoreError;

pub struct TextMember {
    pub index: usize,
    pub name: String,
    pub size: u64,
}

pub(crate) fn safe_member_name(file: &ZipFile<'_, impl Read>) -> Result<String, &'static str> {
    if file.is_dir() || file.is_symlink() {
        return Err("Không thể mở thư mục hoặc liên kết trong ZIP.");
    }
    if file.encrypted() {
        return Err("Tệp được bảo vệ bằng mật khẩu.");
    }
    let raw = file.name_raw();
    let decoded = std::str::from_utf8(raw)
        .ok()
        .map(std::borrow::Cow::Borrowed)
        .or_else(|| GB18030.decode_without_bom_handling_and_without_replacement(raw));
    normalize_member_name(decoded.as_deref().unwrap_or_else(|| file.name()))
        .ok_or("Tên hoặc thư mục của tệp này không an toàn.")
}

fn normalize_member_name(name: &str) -> Option<String> {
    let name = name.replace('\\', "/");
    if name.starts_with('/') || name.ends_with('/') {
        return None;
    }
    let parts = name
        .split('/')
        .filter(|part| !matches!(*part, "" | "."))
        .collect::<Vec<_>>();
    if parts.is_empty() || parts.iter().any(|part| !safe_component(part)) {
        return None;
    }
    Some(parts.join("/"))
}

fn safe_component(part: &str) -> bool {
    if part == ".."
        || part.ends_with(['.', ' '])
        || part
            .chars()
            .any(|c| c.is_ascii_control() || matches!(c, ':' | '<' | '>' | '"' | '|' | '?' | '*'))
    {
        return false;
    }
    let stem = part
        .split('.')
        .next()
        .unwrap_or_default()
        .trim_end_matches(' ')
        .to_ascii_uppercase();
    if matches!(
        stem.as_str(),
        "CON" | "PRN" | "AUX" | "NUL" | "CONIN$" | "CONOUT$"
    ) {
        return false;
    }
    !stem
        .strip_prefix("COM")
        .or_else(|| stem.strip_prefix("LPT"))
        .is_some_and(|end| {
            matches!(
                end,
                "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "¹" | "²" | "³"
            )
        })
}

pub(crate) fn is_text(name: &str) -> bool {
    Path::new(name)
        .extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| ext.eq_ignore_ascii_case("txt"))
}

fn text_member(file: &ZipFile<'_, impl Read>) -> Option<String> {
    safe_member_name(file).ok().filter(|name| is_text(name))
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
    if text_member(&archive.by_index_raw(index)?).is_none() {
        return Err("Mục này không phải chương TXT có thể đọc.".into());
    }
    read_member(&mut archive, index, limit)
}

pub(crate) fn read_member(
    archive: &mut ZipArchive<File>,
    index: usize,
    limit: usize,
) -> Result<(Vec<u8>, bool), CoreError> {
    let mut bytes = Vec::new();
    let truncated = copy_member(archive, index, &mut bytes, limit as u64)?;
    Ok((bytes, truncated))
}

pub(crate) fn copy_member(
    archive: &mut ZipArchive<File>,
    index: usize,
    output: &mut impl Write,
    limit: u64,
) -> Result<bool, CoreError> {
    let raw = archive.by_index_raw(index)?;
    let size = raw.size();
    let truncated = size > limit;
    if raw.compression() == CompressionMethod::LZMA {
        copy_zip_lzma(raw, output, limit)?;
        return Ok(truncated);
    }
    drop(raw);

    let read_limit = if truncated {
        limit
    } else {
        size.saturating_add(1)
    };
    let mut data = archive.by_index(index)?.take(read_limit);
    if io::copy(&mut data, output)? != size.min(limit) {
        return Err("Kích thước giải nén không khớp.".into());
    }
    Ok(truncated)
}

struct LimitedOutput<'a, W> {
    target: &'a mut W,
    remaining: u64,
    checksum: crc32fast::Hasher,
    limit_hit: bool,
}

impl<W: Write> Write for LimitedOutput<'_, W> {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        if self.remaining == 0 && !bytes.is_empty() {
            self.limit_hit = true;
            return Err(io::Error::other("Đã đạt giới hạn xem trước."));
        }
        let allowed = self.remaining.min(bytes.len() as u64) as usize;
        let written = self.target.write(&bytes[..allowed])?;
        self.checksum.update(&bytes[..written]);
        self.remaining -= written as u64;
        Ok(written)
    }

    fn flush(&mut self) -> io::Result<()> {
        self.target.flush()
    }
}

fn copy_zip_lzma(
    mut item: ZipFile<'_, impl Read>,
    target: &mut impl Write,
    limit: u64,
) -> Result<(), CoreError> {
    // ZIP wraps the LZMA properties with a two-byte version and property length.
    // The uncompressed size is in the ZIP directory, not in the LZMA stream.
    let size = item.size();
    let crc = item.crc32();
    let mut prefix = [0; 4];
    item.read_exact(&mut prefix)?;
    if u16::from_le_bytes([prefix[2], prefix[3]]) != 5 {
        return Err("Dữ liệu LZMA trong tệp ZIP không hợp lệ.".into());
    }
    let mut output = LimitedOutput {
        target,
        remaining: size.min(limit),
        checksum: crc32fast::Hasher::new(),
        limit_hit: false,
    };
    let options = lzma_rs::decompress::Options {
        unpacked_size: lzma_rs::decompress::UnpackedSize::UseProvided(Some(size)),
        memlimit: Some(64 * 1024 * 1024),
        allow_incomplete: false,
    };
    let result =
        lzma_rs::lzma_decompress_with_options(&mut BufReader::new(item), &mut output, &options);
    if output.limit_hit && size > limit {
        return Ok(());
    }
    result?;
    if output.remaining != 0 || output.checksum.finalize() != crc {
        return Err("Dữ liệu giải nén không khớp với tệp ZIP.".into());
    }
    Ok(())
}
