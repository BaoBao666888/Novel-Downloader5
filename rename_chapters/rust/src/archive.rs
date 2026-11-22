use std::collections::{BTreeSet, HashSet};
use std::fs::{self, File, Metadata};
use std::io::{self, Seek};
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use zip::{CompressionMethod, ZipArchive};

use crate::CoreError;
use crate::reader_zip::{copy_member, is_text, read_member, safe_member_name};
use crate::text_encoding::decode_zip_text;

const MAX_EXTRACT_BYTES: u64 = 2 * 1024 * 1024 * 1024;
const PREVIEW_BYTES: usize = 16 * 1024;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchiveEntry {
    pub index: usize,
    pub raw_name: String,
    pub display_name: String,
    pub size: u64,
    pub compressed_size: u64,
    pub is_txt: bool,
    pub safe: bool,
    pub issue: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ArchiveInspection {
    pub archive: String,
    pub default_output_dir: String,
    pub entries: Vec<ArchiveEntry>,
    pub total_size: u64,
    pub safe_count: usize,
    pub txt_count: usize,
    pub blocked_count: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct EntryPreview {
    pub display_name: String,
    pub encoding: String,
    pub truncated: bool,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractFailure {
    pub entry: String,
    pub error: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ExtractOutcome {
    pub output_dir: String,
    pub extracted: Vec<String>,
    pub failure: Option<ExtractFailure>,
}

#[derive(Debug, Clone)]
pub struct ArchivePlan {
    pub archive_path: PathBuf,
    pub archive_sha256: [u8; 32],
    pub entries: Vec<ArchiveEntry>,
    source_len: u64,
    source_modified: SystemTime,
}

fn open_source(path: &Path) -> Result<File, CoreError> {
    if !fs::symlink_metadata(path)?.is_file() {
        return Err("Hãy chọn một tệp ZIP.".into());
    }
    Ok(File::open(path)?)
}

fn sha256_file(file: &mut File) -> Result<[u8; 32], CoreError> {
    let mut hash = Sha256::new();
    io::copy(file, &mut hash)?;
    file.rewind()?;
    Ok(hash.finalize().into())
}

pub fn default_extract_dir(archive: &Path) -> PathBuf {
    let stem = archive
        .file_stem()
        .and_then(|s| s.to_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("archive");
    let parent = archive.parent().unwrap_or_else(|| Path::new("."));
    parent.join(format!("{stem}_extracted"))
}

pub fn inspect(path: &Path) -> Result<(ArchivePlan, ArchiveInspection), CoreError> {
    let mut source = open_source(path)?;
    let original = source.metadata()?;
    let archive_sha256 = sha256_file(&mut source)?;
    let current = source.metadata()?;
    if original.len() != current.len() || original.modified()? != current.modified()? {
        return Err("Tệp ZIP đã thay đổi. Hãy mở lại danh sách.".into());
    }

    let mut zip = ZipArchive::new(source).map_err(|err| format!("Không mở được tệp ZIP: {err}"))?;
    let mut entries = Vec::new();
    for index in 0..zip.len() {
        let item = zip.by_index_raw(index)?;
        if item.is_dir() {
            continue;
        }

        let raw_name = item.name().to_owned();
        let (display_name, mut issue) = match safe_member_name(&item) {
            Ok(name) => (name, None),
            Err(reason) => (raw_name.clone(), Some(reason.to_owned())),
        };
        if issue.is_none()
            && !matches!(
                item.compression(),
                CompressionMethod::Stored
                    | CompressionMethod::Deflated
                    | CompressionMethod::Bzip2
                    | CompressionMethod::LZMA
                    | CompressionMethod::Zstd
            )
        {
            issue = Some("Kiểu nén của tệp này chưa được hỗ trợ.".to_owned());
        }
        entries.push(ArchiveEntry {
            index,
            raw_name,
            is_txt: is_text(&display_name),
            display_name,
            size: item.size(),
            compressed_size: item.compressed_size(),
            safe: issue.is_none(),
            issue,
        });
    }
    let safe_count = entries.iter().filter(|e| e.safe).count();
    let inspection = ArchiveInspection {
        archive: path.display().to_string(),
        default_output_dir: default_extract_dir(path).display().to_string(),
        total_size: entries
            .iter()
            .fold(0u64, |total, entry| total.saturating_add(entry.size)),
        safe_count,
        txt_count: entries.iter().filter(|e| e.safe && e.is_txt).count(),
        blocked_count: entries.len() - safe_count,
        entries: entries.clone(),
    };
    let plan = ArchivePlan {
        archive_path: path.to_path_buf(),
        archive_sha256,
        entries,
        source_len: original.len(),
        source_modified: original.modified()?,
    };
    Ok((plan, inspection))
}

impl ArchivePlan {
    fn entry(&self, index: usize) -> Result<&ArchiveEntry, CoreError> {
        let entry = self
            .entries
            .binary_search_by_key(&index, |item| item.index)
            .ok()
            .map(|index| &self.entries[index])
            .ok_or("Không tìm thấy tệp trong danh sách.")?;
        if let Some(issue) = &entry.issue {
            return Err(format!("{}: {issue}", entry.display_name).into());
        }
        Ok(entry)
    }

    fn open_unchanged(&self) -> Result<File, CoreError> {
        let file = open_source(&self.archive_path)?;
        let metadata = file.metadata()?;
        if metadata.len() != self.source_len || metadata.modified()? != self.source_modified {
            return Err("Tệp ZIP đã thay đổi. Hãy mở lại danh sách.".into());
        }
        Ok(file)
    }
}

pub fn preview_entry(plan: &ArchivePlan, index: usize) -> Result<EntryPreview, CoreError> {
    let entry = plan.entry(index)?;
    if !entry.is_txt {
        return Err("Chỉ xem trước được nội dung TXT.".into());
    }
    let mut zip = ZipArchive::new(plan.open_unchanged()?)?;
    {
        let item = zip.by_index_raw(index)?;
        if safe_member_name(&item).ok().as_deref() != Some(entry.display_name.as_str()) {
            return Err("Danh sách ZIP đã thay đổi. Hãy mở lại tệp.".into());
        }
    }
    let (bytes, truncated) = read_member(&mut zip, index, PREVIEW_BYTES)?;
    let (text, encoding) = decode_zip_text(&bytes, truncated);
    Ok(EntryPreview {
        display_name: entry.display_name.clone(),
        encoding,
        truncated,
        text,
    })
}

fn path_key(path: &str) -> String {
    if cfg!(windows) {
        path.to_lowercase()
    } else {
        path.to_owned()
    }
}

fn redirected(metadata: &Metadata) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        metadata.file_attributes() & 0x400 != 0
    }
    #[cfg(not(windows))]
    metadata.is_symlink()
}

fn check_directory(path: &Path, create: bool) -> Result<(), CoreError> {
    match fs::symlink_metadata(path) {
        Ok(meta) if meta.is_dir() && !redirected(&meta) => Ok(()),
        Ok(_) => Err("Thư mục đích chứa liên kết hoặc trùng tên với một tệp.".into()),
        Err(err) if err.kind() == io::ErrorKind::NotFound => {
            if create {
                match fs::create_dir(path) {
                    Ok(()) => (),
                    Err(err) if err.kind() == io::ErrorKind::AlreadyExists => (),
                    Err(err) => return Err(err.into()),
                }
                check_directory(path, false)?;
            }
            Ok(())
        }
        Err(err) => Err(err.into()),
    }
}

fn resolve_destination(
    root: &Path,
    entry: &str,
    source: &Path,
    overwrite: bool,
    create: bool,
) -> Result<PathBuf, CoreError> {
    let mut target = root.to_path_buf();
    check_directory(root, false)?;
    let mut parts = entry.split('/').peekable();
    while let Some(part) = parts.next() {
        target.push(part);
        if parts.peek().is_some() {
            check_directory(&target, create)?;
        }
    }
    match fs::symlink_metadata(&target) {
        Ok(meta) => {
            if !meta.is_file() || redirected(&meta) {
                return Err(format!("Đường dẫn đích không phải tệp thường: {entry}").into());
            }
            if path_key(&target.canonicalize()?.to_string_lossy())
                == path_key(&source.to_string_lossy())
            {
                return Err("Tệp nén nguồn trùng với tệp đích.".into());
            }
            if !overwrite {
                return Err(format!(
                    "Tệp đã tồn tại: {entry}. Hãy đổi thư mục hoặc cho phép ghi đè."
                )
                .into());
            }
        }
        Err(err) if err.kind() == io::ErrorKind::NotFound => (),
        Err(err) => return Err(err.into()),
    }
    Ok(target)
}

fn write_entry(
    zip: &mut ZipArchive<File>,
    entry: &ArchiveEntry,
    root: &Path,
    source: &Path,
    overwrite: bool,
) -> Result<(), CoreError> {
    let target = resolve_destination(root, &entry.display_name, source, overwrite, true)?;
    {
        let item = zip.by_index_raw(entry.index)?;
        if safe_member_name(&item).ok().as_deref() != Some(entry.display_name.as_str())
            || item.size() != entry.size
        {
            return Err("Tệp trong ZIP đã thay đổi.".into());
        }
    }
    let parent = target.parent().ok_or("Không tìm thấy thư mục đích.")?;
    let mut temporary = tempfile::NamedTempFile::new_in(parent)?;
    if copy_member(zip, entry.index, temporary.as_file_mut(), entry.size)? {
        return Err("Kích thước giải nén không khớp.".into());
    }
    temporary.as_file().sync_all()?;
    resolve_destination(root, &entry.display_name, source, overwrite, false)?;
    if overwrite {
        temporary.persist(target)?;
    } else {
        temporary.persist_noclobber(target)?;
    }
    Ok(())
}

pub fn extract(
    plan: &ArchivePlan,
    output_dir: &Path,
    indices: &[usize],
    overwrite: bool,
) -> Result<ExtractOutcome, CoreError> {
    let mut file = plan.open_unchanged()?;
    if sha256_file(&mut file)? != plan.archive_sha256 {
        return Err("Tệp ZIP đã thay đổi. Hãy mở lại danh sách.".into());
    }
    let mut zip = ZipArchive::new(file)?;
    let mut paths = HashSet::new();
    let mut total_size = 0u64;
    let indices: BTreeSet<_> = indices.iter().copied().collect();
    if indices.is_empty() {
        return Err("Hãy chọn tệp cần giải nén.".into());
    }
    let mut selected = Vec::new();
    for index in indices {
        let entry = plan.entry(index)?;
        total_size = total_size.saturating_add(entry.size);
        if total_size > MAX_EXTRACT_BYTES {
            return Err("Mỗi lượt có thể giải nén tối đa 2 GiB.".into());
        }
        if !paths.insert(path_key(&entry.display_name)) {
            return Err(format!("Trùng tên tệp đích: {}", entry.display_name).into());
        }
        selected.push(entry);
    }

    let source = plan.archive_path.canonicalize()?;
    for entry in &selected {
        for (pos, _) in entry.display_name.match_indices('/') {
            if paths.contains(&path_key(&entry.display_name[..pos])) {
                return Err(format!("Tệp và thư mục trùng tên: {}", entry.display_name).into());
            }
        }
        resolve_destination(output_dir, &entry.display_name, &source, overwrite, false)?;
    }
    fs::create_dir_all(output_dir)?;
    check_directory(output_dir, false)?;
    let root = output_dir.canonicalize()?;

    let mut outcome = ExtractOutcome {
        output_dir: output_dir.display().to_string(),
        extracted: Vec::new(),
        failure: None,
    };
    for entry in selected {
        match write_entry(&mut zip, entry, &root, &source, overwrite) {
            Ok(()) => outcome.extracted.push(entry.display_name.clone()),
            Err(err) => {
                outcome.failure = Some(ExtractFailure {
                    entry: entry.display_name.clone(),
                    error: err.to_string(),
                });
                break;
            }
        }
    }
    Ok(outcome)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use zip::{ZipWriter, write::SimpleFileOptions};

    const ELLIPSIS: &str = "0028-第28章 教官...不，异教徒降临.txt";

    fn make_zip(path: &Path, entries: &[(&str, &[u8])], method: CompressionMethod) {
        let mut zip = ZipWriter::new(File::create(path).unwrap());
        let options = SimpleFileOptions::default().compression_method(method);
        for (name, bytes) in entries {
            zip.start_file(*name, options).unwrap();
            zip.write_all(bytes).unwrap();
        }
        zip.finish().unwrap();
    }

    fn make_sample_zip(path: &Path) {
        make_zip(
            path,
            &[
                (ELLIPSIS, "第28章 Nội dung hợp lệ".as_bytes()),
                ("sub/0029.txt", "Chương 29".as_bytes()),
                ("../evil.txt", b"blocked"),
            ],
            CompressionMethod::Deflated,
        );
    }

    #[test]
    fn allows_ellipsis_filenames_blocks_traversal_and_enforces_no_overwrite() {
        let dir = tempfile::tempdir().unwrap();
        let zip_path = dir.path().join("novel.zip");
        make_sample_zip(&zip_path);

        let (plan, info) = inspect(&zip_path).unwrap();
        assert_eq!(info.entries.len(), 3);
        assert_eq!(info.safe_count, 2);
        assert_eq!(info.blocked_count, 1);
        assert!(
            info.entries
                .iter()
                .any(|e| e.safe && e.display_name.contains("..."))
        );
        let blocked = info.entries.iter().find(|e| !e.safe).unwrap();

        // Preview entry with ellipsis
        let ellipsis = info
            .entries
            .iter()
            .find(|e| e.display_name.contains("..."))
            .unwrap();
        let preview = preview_entry(&plan, ellipsis.index).unwrap();
        assert!(preview.text.contains("Nội dung hợp lệ"));

        // Extracting blocked traversal entry must fail
        let out_dir = dir.path().join("out");
        assert!(extract(&plan, &out_dir, &[blocked.index], false).is_err());

        // Extracting safe entries succeeds and preserves '...'
        let safe_indices: Vec<usize> = info
            .entries
            .iter()
            .filter(|e| e.safe)
            .map(|e| e.index)
            .collect();
        let outcome = extract(&plan, &out_dir, &safe_indices, false).unwrap();
        assert_eq!(outcome.extracted.len(), 2);
        assert!(outcome.failure.is_none());
        assert!(
            out_dir
                .join("0028-第28章 教官...不，异教徒降临.txt")
                .is_file()
        );

        // Re-extracting without overwrite fails
        assert!(extract(&plan, &out_dir, &safe_indices, false).is_err());
    }

    #[test]
    fn corrupt_member_does_not_replace_an_existing_file() {
        let dir = tempfile::tempdir().unwrap();
        let zip = dir.path().join("corrupt.zip");
        make_zip(
            &zip,
            &[("chapter.txt", b"original chapter contents")],
            CompressionMethod::Stored,
        );
        let mut raw = fs::read(&zip).unwrap();
        let start = raw
            .windows(b"original chapter contents".len())
            .position(|bytes| bytes == b"original chapter contents")
            .unwrap();
        raw[start] = b'O';
        fs::write(&zip, raw).unwrap();

        let (plan, _) = inspect(&zip).unwrap();
        let out = dir.path().join("out");
        fs::create_dir(&out).unwrap();
        fs::write(out.join("chapter.txt"), b"keep me").unwrap();
        let result = extract(&plan, &out, &[0], true).unwrap();
        assert!(result.failure.is_some());
        assert!(result.extracted.is_empty());
        assert_eq!(fs::read(out.join("chapter.txt")).unwrap(), b"keep me");
        assert_eq!(fs::read_dir(out).unwrap().count(), 1);
    }

    #[test]
    fn checks_all_names_before_writing_and_leaves_changed_sources_unread() {
        let dir = tempfile::tempdir().unwrap();
        let zip = dir.path().join("conflicts.zip");
        make_zip(
            &zip,
            &[
                ("folder", b"a file"),
                ("folder/chapter.txt", b"a chapter"),
                ("chapter.txt:stream", b"forbidden name"),
                ("valid.txt", b"valid"),
            ],
            CompressionMethod::Deflated,
        );
        let (plan, info) = inspect(&zip).unwrap();
        assert!(!info.entries[2].safe);
        let out = dir.path().join("out");
        assert!(extract(&plan, &out, &[0, 1, 3], false).is_err());
        assert!(!out.exists());

        make_zip(
            &zip,
            &[("changed.txt", b"changed")],
            CompressionMethod::Stored,
        );
        assert!(preview_entry(&plan, 3).is_err());
        assert!(extract(&plan, &out, &[3], false).is_err());
        assert!(!out.exists());
    }

    #[cfg(unix)]
    #[test]
    fn destination_links_are_rejected_before_any_file_is_written() {
        let dir = tempfile::tempdir().unwrap();
        let zip = dir.path().join("links.zip");
        make_zip(
            &zip,
            &[("valid.txt", b"valid"), ("sub/chapter.txt", b"chapter")],
            CompressionMethod::Stored,
        );
        let (plan, _) = inspect(&zip).unwrap();
        let out = dir.path().join("out");
        let other = dir.path().join("other");
        fs::create_dir(&out).unwrap();
        fs::create_dir(&other).unwrap();
        std::os::unix::fs::symlink(&other, out.join("sub")).unwrap();
        assert!(extract(&plan, &out, &[0, 1], true).is_err());
        assert!(!out.join("valid.txt").exists());
        assert!(!other.join("chapter.txt").exists());
    }

    #[test]
    fn previews_and_extracts_zip_lzma_written_by_python() {
        // zipfile.ZIP_LZMA, one chapter containing 30,000 bytes.
        const PYTHON_LZMA_ZIP: &[u8] = &[
            0x50, 0x4b, 0x03, 0x04, 0x3f, 0x00, 0x02, 0x00, 0x0e, 0x00, 0x7d, 0x04, 0x77, 0x5d,
            0x4c, 0xfa, 0xd0, 0x91, 0x5b, 0x00, 0x00, 0x00, 0x30, 0x75, 0x00, 0x00, 0x0b, 0x00,
            0x00, 0x00, 0x63, 0x68, 0x61, 0x70, 0x74, 0x65, 0x72, 0x2e, 0x74, 0x78, 0x74, 0x09,
            0x04, 0x05, 0x00, 0x5d, 0x00, 0x00, 0x80, 0x00, 0x00, 0x18, 0x0c, 0x42, 0x92, 0x6a,
            0x67, 0xbc, 0x0e, 0xd1, 0x33, 0x34, 0x12, 0x3b, 0x0c, 0xe8, 0x93, 0x01, 0xaf, 0x64,
            0xe8, 0x1a, 0xd8, 0xa6, 0x78, 0xd6, 0x36, 0x92, 0xe9, 0x72, 0xd4, 0xf6, 0xaf, 0xf7,
            0x32, 0x73, 0xe7, 0x17, 0x9d, 0x78, 0x04, 0xd4, 0xa3, 0xb1, 0xf4, 0x72, 0xab, 0xb3,
            0x5d, 0x9c, 0xe7, 0x33, 0x13, 0x30, 0x0a, 0x57, 0x84, 0x92, 0x7e, 0x1a, 0xc9, 0x54,
            0xf9, 0x9a, 0x2c, 0xf6, 0x34, 0xc3, 0x13, 0x80, 0x34, 0xc8, 0xd9, 0xca, 0xd3, 0x4e,
            0x7f, 0xff, 0xfd, 0xde, 0x00, 0x00, 0x50, 0x4b, 0x01, 0x02, 0x3f, 0x03, 0x3f, 0x00,
            0x02, 0x00, 0x0e, 0x00, 0x7d, 0x04, 0x77, 0x5d, 0x4c, 0xfa, 0xd0, 0x91, 0x5b, 0x00,
            0x00, 0x00, 0x30, 0x75, 0x00, 0x00, 0x0b, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x80, 0x01, 0x00, 0x00, 0x00, 0x00, 0x63, 0x68, 0x61, 0x70,
            0x74, 0x65, 0x72, 0x2e, 0x74, 0x78, 0x74, 0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00,
            0x00, 0x01, 0x00, 0x01, 0x00, 0x39, 0x00, 0x00, 0x00, 0x84, 0x00, 0x00, 0x00, 0x00,
            0x00,
        ];
        let dir = tempfile::tempdir().unwrap();
        let zip = dir.path().join("lzma.zip");
        fs::write(&zip, PYTHON_LZMA_ZIP).unwrap();
        let (plan, _) = inspect(&zip).unwrap();
        let sample = preview_entry(&plan, 0).unwrap();
        assert!(sample.truncated);
        assert_eq!(sample.text.len(), PREVIEW_BYTES);
        assert!(sample.text.starts_with("0123456789"));
        let out = dir.path().join("out");
        let result = extract(&plan, &out, &[0], false).unwrap();
        assert!(result.failure.is_none(), "{:?}", result.failure);
        assert_eq!(
            fs::read(out.join("chapter.txt")).unwrap(),
            b"0123456789".repeat(3000)
        );
    }
}
