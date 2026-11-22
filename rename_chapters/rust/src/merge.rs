use std::cmp::Ordering;
use std::collections::HashSet;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::CoreError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeEntry {
    pub filename: String,
    pub path: String,
    pub size: u64,
    pub first_line: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct MergeInspection {
    pub folder: String,
    pub default_output: String,
    pub entries: Vec<MergeEntry>,
    pub total_size: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MergeOptions {
    pub filenames: Vec<String>,
    pub separator: String,
    pub include_filename_heading: bool,
    pub overwrite: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct MergeOutcome {
    pub output_file: String,
    pub merged_count: usize,
    pub total_chars: usize,
}

pub fn default_merge_output(folder: &Path) -> PathBuf {
    let name = folder
        .file_name()
        .and_then(|s| s.to_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("merged");
    let parent = folder.parent().unwrap_or_else(|| Path::new("."));
    parent.join(format!("{name}_merged.txt"))
}

pub fn inspect_folder(folder: &Path) -> Result<MergeInspection, CoreError> {
    if !folder.is_dir() {
        return Err("Hãy chọn một thư mục chứa các tệp .txt.".into());
    }
    let mut files: Vec<(String, PathBuf, u64)> = Vec::new();
    for entry in fs::read_dir(folder)? {
        let entry = entry?;
        let path = entry.path();
        let meta = match fs::symlink_metadata(&path) {
            Ok(meta) if meta.is_file() => meta,
            _ => continue,
        };
        let is_txt = path
            .extension()
            .and_then(|ext| ext.to_str())
            .is_some_and(|ext| ext.eq_ignore_ascii_case("txt"));
        if !is_txt {
            continue;
        }
        let Some(filename) = path.file_name().and_then(|n| n.to_str()) else {
            continue;
        };
        files.push((filename.to_owned(), path, meta.len()));
    }

    files.sort_by(|a, b| natural_cmp(&a.0, &b.0));

    let mut entries = Vec::with_capacity(files.len());
    let mut total_size = 0u64;
    for (filename, path, size) in files {
        total_size = total_size.saturating_add(size);
        let first_line = read_first_non_empty_line(&path);
        entries.push(MergeEntry {
            filename,
            path: path.display().to_string(),
            size,
            first_line,
        });
    }

    Ok(MergeInspection {
        folder: folder.display().to_string(),
        default_output: default_merge_output(folder).display().to_string(),
        entries,
        total_size,
    })
}

pub fn execute_merge(
    folder: &Path,
    output_file: &Path,
    options: MergeOptions,
) -> Result<MergeOutcome, CoreError> {
    if options.filenames.is_empty() {
        return Err("Hãy chọn ít nhất một tệp .txt để ghép.".into());
    }
    if output_file.exists() && output_file.is_dir() {
        return Err("Đường dẫn tệp xuất đang là một thư mục.".into());
    }
    if !options.overwrite && output_file.exists() {
        return Err(format!(
            "Tệp đích đã tồn tại: {}. Hãy đổi tên tệp xuất hoặc bật cho phép ghi đè.",
            output_file.display()
        )
        .into());
    }

    let mut seen = HashSet::new();
    let mut source_paths = Vec::with_capacity(options.filenames.len());
    let output_canon = output_file.canonicalize().ok();

    for name in &options.filenames {
        if name.contains(['/', '\\', '\0']) || matches!(name.as_str(), "" | "." | "..") {
            return Err(format!("Tên tệp nguồn không hợp lệ: {name}").into());
        }
        if !seen.insert(name.clone()) {
            return Err(format!("Tệp nguồn bị trùng lặp trong danh sách ghép: {name}").into());
        }
        let path = folder.join(name);
        let meta =
            fs::symlink_metadata(&path).map_err(|_| format!("Không tìm thấy tệp nguồn: {name}"))?;
        if !meta.is_file() {
            return Err(format!("Nguồn không phải tệp thường: {name}").into());
        }
        if let Some(ref out_c) = output_canon
            && path.canonicalize().ok().as_ref() == Some(out_c)
        {
            return Err("Tệp đích không thể trùng với một trong các tệp nguồn.".into());
        }
        source_paths.push((name.clone(), path));
    }

    if let Some(parent) = output_file.parent()
        && !parent.as_os_str().is_empty()
    {
        fs::create_dir_all(parent)?;
    }

    let mut combined = String::new();
    let mut merged_count = 0usize;

    for (idx, (filename, path)) in source_paths.iter().enumerate() {
        let raw = fs::read(path).map_err(|err| format!("Không thể đọc tệp {filename}: {err}"))?;
        let text =
            decode_text(&raw).map_err(|err| format!("Không thể giải mã tệp {filename}: {err}"))?;
        let body = text.trim();
        if idx > 0 {
            combined.push_str(&options.separator);
        }
        if options.include_filename_heading {
            let heading = filename
                .strip_suffix(".txt")
                .or_else(|| filename.strip_suffix(".TXT"))
                .unwrap_or(filename);
            combined.push_str(heading);
            if !body.is_empty() {
                combined.push('\n');
            }
        }
        combined.push_str(body);
        merged_count += 1;
    }

    let mut open = OpenOptions::new();
    open.write(true);
    if options.overwrite {
        open.create(true).truncate(true);
    } else {
        open.create_new(true);
    }
    let mut out = open
        .open(output_file)
        .map_err(|err| format!("Không thể tạo tệp xuất: {err}"))?;
    out.write_all(combined.as_bytes())?;
    out.flush()?;

    Ok(MergeOutcome {
        output_file: output_file.display().to_string(),
        merged_count,
        total_chars: combined.chars().count(),
    })
}

pub(crate) fn decode_text(raw: &[u8]) -> Result<String, CoreError> {
    if let Some(rest) = raw.strip_prefix(b"\xef\xbb\xbf") {
        let s = std::str::from_utf8(rest).map_err(|_| "UTF-8 không hợp lệ")?;
        return Ok(s.replace("\r\n", "\n").replace('\r', "\n"));
    }
    if let Some(rest) = raw.strip_prefix(b"\xff\xfe") {
        let units: Vec<u16> = rest
            .chunks_exact(2)
            .map(|c| u16::from_le_bytes([c[0], c[1]]))
            .collect();
        return Ok(String::from_utf16_lossy(&units)
            .replace("\r\n", "\n")
            .replace('\r', "\n"));
    }
    if let Some(rest) = raw.strip_prefix(b"\xfe\xff") {
        let units: Vec<u16> = rest
            .chunks_exact(2)
            .map(|c| u16::from_be_bytes([c[0], c[1]]))
            .collect();
        return Ok(String::from_utf16_lossy(&units)
            .replace("\r\n", "\n")
            .replace('\r', "\n"));
    }
    let s = std::str::from_utf8(raw).map_err(|_| "Tệp cần dùng UTF-8 hoặc UTF-16 có BOM")?;
    Ok(s.replace("\r\n", "\n").replace('\r', "\n"))
}

fn read_first_non_empty_line(path: &Path) -> String {
    let Ok(raw) = fs::read(path) else {
        return String::new();
    };
    let slice = &raw[..raw.len().min(4096)];
    let Ok(text) = decode_text(slice) else {
        return String::new();
    };
    for line in text.lines() {
        let t = line.trim();
        if !t.is_empty() {
            return t.chars().take(100).collect();
        }
    }
    String::new()
}

fn natural_cmp(a: &str, b: &str) -> Ordering {
    let (mut ai, mut bi) = (a.as_bytes(), b.as_bytes());
    while !ai.is_empty() && !bi.is_empty() {
        if ai[0].is_ascii_digit() && bi[0].is_ascii_digit() {
            let a_len = ai.iter().take_while(|c| c.is_ascii_digit()).count();
            let b_len = bi.iter().take_while(|c| c.is_ascii_digit()).count();
            let a_num = std::str::from_utf8(&ai[..a_len])
                .unwrap_or("0")
                .trim_start_matches('0');
            let b_num = std::str::from_utf8(&bi[..b_len])
                .unwrap_or("0")
                .trim_start_matches('0');
            let ord = a_num
                .len()
                .cmp(&b_num.len())
                .then_with(|| a_num.cmp(b_num))
                .then_with(|| a_len.cmp(&b_len));
            if ord != Ordering::Equal {
                return ord;
            }
            ai = &ai[a_len..];
            bi = &bi[b_len..];
        } else {
            let ord = ai[0].to_ascii_lowercase().cmp(&bi[0].to_ascii_lowercase());
            if ord != Ordering::Equal {
                return ord;
            }
            ai = &ai[1..];
            bi = &bi[1..];
        }
    }
    ai.len().cmp(&bi.len())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sorts_naturally_merges_utf8_and_utf16_and_blocks_overwrite() {
        let root = tempfile::tempdir().unwrap();
        let src = root.path().join("chapters");
        fs::create_dir(&src).unwrap();

        fs::write(src.join("10.txt"), "\u{feff}Chương 10\r\nNội dung 10").unwrap();
        let mut utf16 = vec![0xffu8, 0xfeu8];
        for u in "Chương 2\r\nNội dung 2".encode_utf16() {
            utf16.extend_from_slice(&u.to_le_bytes());
        }
        fs::write(src.join("2.txt"), utf16).unwrap();
        fs::create_dir(src.join("fake.txt")).unwrap();

        let info = inspect_folder(&src).unwrap();
        assert_eq!(info.entries.len(), 2);
        assert_eq!(info.entries[0].filename, "2.txt");
        assert_eq!(info.entries[1].filename, "10.txt");

        let out = root.path().join("full.txt");
        let outcome = execute_merge(
            &src,
            &out,
            MergeOptions {
                filenames: vec!["2.txt".into(), "10.txt".into()],
                separator: "\n\n".into(),
                include_filename_heading: false,
                overwrite: false,
            },
        )
        .unwrap();
        assert_eq!(outcome.merged_count, 2);
        assert_eq!(
            fs::read_to_string(&out).unwrap(),
            "Chương 2\nNội dung 2\n\nChương 10\nNội dung 10"
        );

        // Overwrite=false blocks second run
        assert!(
            execute_merge(
                &src,
                &out,
                MergeOptions {
                    filenames: vec!["2.txt".into()],
                    separator: "\n\n".into(),
                    include_filename_heading: true,
                    overwrite: false,
                },
            )
            .is_err()
        );
    }
}
