use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::{CoreError, python};

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
}

#[derive(Serialize)]
struct InspectRequest<'a> {
    action: &'static str,
    archive: &'a str,
}

#[derive(Serialize)]
struct PreviewRequest<'a> {
    action: &'static str,
    archive: &'a str,
    entry_index: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    byte_limit: Option<usize>,
}

#[derive(Serialize)]
struct ExtractRequest<'a> {
    action: &'static str,
    archive: &'a str,
    output_dir: &'a str,
    indices: &'a [usize],
    overwrite: bool,
}

#[derive(Deserialize)]
#[serde(tag = "status", rename_all = "snake_case")]
enum InspectResponse {
    Ok {
        entries: Vec<ArchiveEntry>,
        total_size: u64,
    },
    Error {
        message: String,
    },
}

#[derive(Deserialize)]
#[serde(tag = "status", rename_all = "snake_case")]
enum PreviewResponse {
    Ok {
        display_name: String,
        encoding: String,
        truncated: bool,
        text: String,
    },
    Error {
        message: String,
    },
}

#[derive(Deserialize)]
#[serde(tag = "status", rename_all = "snake_case")]
enum ExtractResponse {
    Ok {
        output_dir: String,
        extracted: Vec<String>,
        failure: Option<ExtractFailure>,
    },
    Error {
        message: String,
    },
}

fn sha256_file(path: &Path) -> Result<[u8; 32], CoreError> {
    let bytes = fs::read(path).map_err(|err| format!("Không thể đọc tệp nén: {err}"))?;
    Ok(Sha256::digest(&bytes).into())
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

pub fn inspect(
    archive: &Path,
    interpreter: Option<&Path>,
) -> Result<(ArchivePlan, ArchiveInspection), CoreError> {
    let archive_sha256 = sha256_file(archive)?;
    let archive_str = archive.to_string_lossy();
    let response: InspectResponse = python::json(
        include_str!("archive_source.py"),
        InspectRequest {
            action: "inspect",
            archive: &archive_str,
        },
        interpreter,
    )?;

    match response {
        InspectResponse::Ok {
            entries,
            total_size,
        } => {
            let safe_count = entries.iter().filter(|e| e.safe).count();
            let txt_count = entries.iter().filter(|e| e.safe && e.is_txt).count();
            let blocked_count = entries.len().saturating_sub(safe_count);
            let plan = ArchivePlan {
                archive_path: archive.to_path_buf(),
                archive_sha256,
                entries: entries.clone(),
            };
            let inspection = ArchiveInspection {
                archive: archive.display().to_string(),
                default_output_dir: default_extract_dir(archive).display().to_string(),
                entries,
                total_size,
                safe_count,
                txt_count,
                blocked_count,
            };
            Ok((plan, inspection))
        }
        InspectResponse::Error { message } => Err(message.into()),
    }
}

pub fn preview_entry(
    plan: &ArchivePlan,
    entry_index: usize,
    interpreter: Option<&Path>,
) -> Result<EntryPreview, CoreError> {
    read_entry_with_limit(&plan.archive_path, entry_index, None, interpreter)
}

pub fn read_entry_text(
    archive: &Path,
    entry_index: usize,
    byte_limit: usize,
    interpreter: Option<&Path>,
) -> Result<EntryPreview, CoreError> {
    read_entry_with_limit(archive, entry_index, Some(byte_limit), interpreter)
}

fn read_entry_with_limit(
    archive: &Path,
    entry_index: usize,
    byte_limit: Option<usize>,
    interpreter: Option<&Path>,
) -> Result<EntryPreview, CoreError> {
    let archive_str = archive.to_string_lossy();
    let response: PreviewResponse = python::json(
        include_str!("archive_source.py"),
        PreviewRequest {
            action: "preview",
            archive: &archive_str,
            entry_index,
            byte_limit,
        },
        interpreter,
    )?;
    match response {
        PreviewResponse::Ok {
            display_name,
            encoding,
            truncated,
            text,
        } => Ok(EntryPreview {
            display_name,
            encoding,
            truncated,
            text,
        }),
        PreviewResponse::Error { message } => Err(message.into()),
    }
}

pub fn extract(
    plan: &ArchivePlan,
    output_dir: &Path,
    indices: &[usize],
    overwrite: bool,
    interpreter: Option<&Path>,
) -> Result<ExtractOutcome, CoreError> {
    let current_sha = sha256_file(&plan.archive_path)?;
    if current_sha != plan.archive_sha256 {
        return Err("Tệp nén đã thay đổi sau khi quét. Hãy quét lại trước khi giải nén.".into());
    }
    let archive_str = plan.archive_path.to_string_lossy();
    let out_str = output_dir.to_string_lossy();
    let response: ExtractResponse = python::json(
        include_str!("archive_source.py"),
        ExtractRequest {
            action: "extract",
            archive: &archive_str,
            output_dir: &out_str,
            indices,
            overwrite,
        },
        interpreter,
    )?;
    match response {
        ExtractResponse::Ok {
            output_dir,
            extracted,
            failure,
        } => Ok(ExtractOutcome {
            output_dir,
            extracted,
            failure,
        }),
        ExtractResponse::Error { message } => Err(message.into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;

    fn make_sample_zip(path: &Path) {
        let script = r#"
import sys, zipfile
with zipfile.ZipFile(sys.argv[1], "w") as zf:
    zf.writestr("0028-第28章 教官...不，异教徒降临.txt", "第28章 Nội dung hợp lệ".encode("utf-8"))
    zf.writestr("sub/0029.txt", "Chương 29".encode("utf-8"))
    zf.writestr("../evil.txt", "blocked".encode("utf-8"))
"#;
        let py = if cfg!(windows) { "python" } else { "python3" };
        let status = Command::new(py)
            .args(["-I", "-B", "-c", script])
            .arg(path)
            .status()
            .unwrap();
        assert!(status.success());
    }

    #[test]
    fn allows_ellipsis_filenames_blocks_traversal_and_enforces_no_overwrite() {
        let dir = tempfile::tempdir().unwrap();
        let zip_path = dir.path().join("novel.zip");
        make_sample_zip(&zip_path);

        let (plan, info) = inspect(&zip_path, None).unwrap();
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
        let preview = preview_entry(&plan, ellipsis.index, None).unwrap();
        assert!(preview.text.contains("Nội dung hợp lệ"));

        // Extracting blocked traversal entry must fail
        let out_dir = dir.path().join("out");
        assert!(extract(&plan, &out_dir, &[blocked.index], false, None).is_err());

        // Extracting safe entries succeeds and preserves '...'
        let safe_indices: Vec<usize> = info
            .entries
            .iter()
            .filter(|e| e.safe)
            .map(|e| e.index)
            .collect();
        let outcome = extract(&plan, &out_dir, &safe_indices, false, None).unwrap();
        assert_eq!(outcome.extracted.len(), 2);
        assert!(outcome.failure.is_none());
        assert!(
            out_dir
                .join("0028-第28章 教官...不，异教徒降临.txt")
                .is_file()
        );

        // Re-extracting without overwrite fails
        assert!(extract(&plan, &out_dir, &safe_indices, false, None).is_err());
    }
}
