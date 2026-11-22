use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::{CoreError, python};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TocMode {
    Append,
    Replace,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TextChange {
    pub index: usize,
    pub line_number: usize,
    pub before: String,
    pub after: String,
    #[serde(default, skip_serializing)]
    pub start_byte: Option<usize>,
    #[serde(default, skip_serializing)]
    pub end_byte: Option<usize>,
    #[serde(default, skip_serializing)]
    pub applied_text: Option<String>,
}

#[derive(Debug, Clone)]
pub struct Plan {
    pub file: PathBuf,
    pub original_sha256: [u8; 32],
    pub original_bytes: Vec<u8>,
    pub new_bytes: Vec<u8>,
    pub match_count: usize,
    pub toc_entries: Option<usize>,
    pub changes: Vec<TextChange>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PreviewSummary {
    pub file: String,
    pub match_count: usize,
    pub changed_count: usize,
    pub toc_entries: Option<usize>,
    pub changes: Vec<TextChange>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ApplyOutcome {
    pub file: String,
    pub backup: String,
    pub changed_count: usize,
}

#[derive(Serialize)]
struct RenumberRequest<'a> {
    action: &'static str,
    content: &'a str,
    find_regex: &'a str,
    replace_format: &'a str,
    start_num: i64,
}

#[derive(Serialize)]
struct ApplyTocRequest<'a> {
    action: &'static str,
    main_content: &'a str,
    toc_content: &'a str,
    toc_regex: &'a str,
    main_regex: &'a str,
    mode: &'static str,
}

#[derive(Serialize, Deserialize)]
pub struct ReplaceOptions {
    pub search: String,
    pub replacement: String,
    pub use_regex: bool,
    pub whole_word: bool,
    pub match_case: bool,
}

#[derive(Serialize)]
struct ReplaceRequest<'a> {
    action: &'static str,
    content: &'a str,
    #[serde(flatten)]
    options: ReplaceOptions,
}

#[derive(Deserialize)]
struct ChangeSpan {
    start_byte: usize,
    end_byte: usize,
    applied_text: String,
}

#[derive(Deserialize)]
#[serde(tag = "status", rename_all = "snake_case")]
enum PythonResponse {
    Ok {
        new_content: String,
        count: usize,
        toc_entries: Option<usize>,
        changes: Vec<TextChange>,
        #[serde(default)]
        spans: Vec<ChangeSpan>,
    },
    Error {
        message: String,
    },
}

fn sha256(bytes: &[u8]) -> [u8; 32] {
    Sha256::digest(bytes).into()
}

fn read_utf8_with_bom_and_eol(
    path: &Path,
) -> Result<(Vec<u8>, bool, &'static str, String), CoreError> {
    let raw =
        fs::read(path).map_err(|err| format!("Không thể đọc tệp {}: {err}", path.display()))?;
    let has_bom = raw.starts_with(b"\xef\xbb\xbf");
    let body = if has_bom { &raw[3..] } else { &raw[..] };
    let text =
        std::str::from_utf8(body).map_err(|err| format!("Tệp không phải UTF-8 hợp lệ: {err}"))?;
    let eol = if text.contains("\r\n") { "\r\n" } else { "\n" };
    let text = text.to_owned();
    Ok((raw, has_bom, eol, text))
}

fn encode_with_bom_and_eol(content_lf: &str, has_bom: bool, eol: &str) -> Vec<u8> {
    let mut out = Vec::with_capacity(content_lf.len() + if has_bom { 3 } else { 0 });
    if has_bom {
        out.extend_from_slice(b"\xef\xbb\xbf");
    }
    if eol == "\r\n" {
        out.extend_from_slice(content_lf.replace('\n', "\r\n").as_bytes());
    } else {
        out.extend_from_slice(content_lf.as_bytes());
    }
    out
}

impl Plan {
    pub fn summary(&self) -> PreviewSummary {
        PreviewSummary {
            file: self.file.display().to_string(),
            match_count: self.match_count,
            changed_count: self.changes.len(),
            toc_entries: self.toc_entries,
            changes: self.changes.clone(),
        }
    }

    pub fn has_changes(&self) -> bool {
        self.original_bytes != self.new_bytes
    }

    pub fn filter_changes(&self, selected_indices: &[usize]) -> Result<Self, CoreError> {
        use std::collections::HashSet;

        let wanted: HashSet<usize> = selected_indices.iter().copied().collect();
        if wanted.is_empty() {
            return Err("Hãy chọn ít nhất một thay đổi để áp dụng.".into());
        }
        let chosen: Vec<TextChange> = self
            .changes
            .iter()
            .filter(|c| wanted.contains(&c.index))
            .cloned()
            .collect();
        if chosen.is_empty() || chosen.len() != wanted.len() {
            return Err("Danh sách thay đổi được chọn không hợp lệ.".into());
        }
        if chosen.len() == self.changes.len() {
            return Ok(self.clone());
        }

        let has_bom = self.original_bytes.starts_with(b"\xef\xbb\xbf");
        let body = if has_bom {
            &self.original_bytes[3..]
        } else {
            &self.original_bytes[..]
        };

        let mut rebuilt = Vec::with_capacity(self.original_bytes.len());
        if has_bom {
            rebuilt.extend_from_slice(b"\xef\xbb\xbf");
        }
        let mut cursor = 0usize;
        for change in &chosen {
            let (Some(start), Some(end), Some(applied)) = (
                change.start_byte,
                change.end_byte,
                change.applied_text.as_deref(),
            ) else {
                return Err("Thao tác này không hỗ trợ chọn từng dòng thay đổi.".into());
            };
            if start < cursor || end < start || end > body.len() {
                return Err("Vị trí thay đổi không hợp lệ.".into());
            }
            rebuilt.extend_from_slice(&body[cursor..start]);
            rebuilt.extend_from_slice(applied.as_bytes());
            cursor = end;
        }
        rebuilt.extend_from_slice(&body[cursor..]);

        Ok(Self {
            file: self.file.clone(),
            original_sha256: self.original_sha256,
            original_bytes: self.original_bytes.clone(),
            new_bytes: rebuilt,
            match_count: self.match_count,
            toc_entries: self.toc_entries,
            changes: chosen,
        })
    }

    pub fn undo_plan(&self) -> Self {
        Self {
            file: self.file.clone(),
            original_sha256: sha256(&self.new_bytes),
            original_bytes: self.new_bytes.clone(),
            new_bytes: self.original_bytes.clone(),
            match_count: self.match_count,
            toc_entries: self.toc_entries,
            changes: self
                .changes
                .iter()
                .map(|c| TextChange {
                    index: c.index,
                    line_number: c.line_number,
                    before: c.after.clone(),
                    after: c.before.clone(),
                    start_byte: None,
                    end_byte: None,
                    applied_text: None,
                })
                .collect(),
        }
    }
}

pub fn preview_renumber(
    file: &Path,
    find_regex: &str,
    replace_format: &str,
    start_num: i64,
    interpreter: Option<&Path>,
) -> Result<Plan, CoreError> {
    if find_regex.is_empty() {
        return Err("Hãy nhập biểu thức regex tìm kiếm.".into());
    }
    let (raw, has_bom, eol, text) = read_utf8_with_bom_and_eol(file)?;
    let response: PythonResponse = python::json(
        include_str!("text_tools_source.py"),
        RenumberRequest {
            action: "renumber",
            content: &text,
            find_regex,
            replace_format,
            start_num,
        },
        interpreter,
    )?;
    match response {
        PythonResponse::Ok {
            new_content,
            count,
            toc_entries,
            changes,
            ..
        } => {
            let new_bytes = encode_with_bom_and_eol(&new_content, has_bom, eol);
            Ok(Plan {
                file: file.to_path_buf(),
                original_sha256: sha256(&raw),
                original_bytes: raw,
                new_bytes,
                match_count: count,
                toc_entries,
                changes,
            })
        }
        PythonResponse::Error { message } => Err(message.into()),
    }
}

pub fn preview_apply_toc(
    main_file: &Path,
    toc_file: &Path,
    toc_regex: &str,
    main_regex: &str,
    mode: TocMode,
    interpreter: Option<&Path>,
) -> Result<Plan, CoreError> {
    if toc_regex.is_empty() || main_regex.is_empty() {
        return Err("Hãy nhập đầy đủ regex mục lục và regex truyện chính.".into());
    }
    let (raw, has_bom, eol, main_text) = read_utf8_with_bom_and_eol(main_file)?;
    let (_, _, _, toc_text) = read_utf8_with_bom_and_eol(toc_file)?;
    let response: PythonResponse = python::json(
        include_str!("text_tools_source.py"),
        ApplyTocRequest {
            action: "apply_toc",
            main_content: &main_text,
            toc_content: &toc_text,
            toc_regex,
            main_regex,
            mode: match mode {
                TocMode::Append => "append",
                TocMode::Replace => "replace",
            },
        },
        interpreter,
    )?;
    match response {
        PythonResponse::Ok {
            new_content,
            count,
            toc_entries,
            changes,
            ..
        } => {
            let new_bytes = encode_with_bom_and_eol(&new_content, has_bom, eol);
            Ok(Plan {
                file: main_file.to_path_buf(),
                original_sha256: sha256(&raw),
                original_bytes: raw,
                new_bytes,
                match_count: count,
                toc_entries,
                changes,
            })
        }
        PythonResponse::Error { message } => Err(message.into()),
    }
}

pub fn preview_replace(
    file: &Path,
    options: ReplaceOptions,
    interpreter: Option<&Path>,
) -> Result<Plan, CoreError> {
    let (raw, has_bom, _, text) = read_utf8_with_bom_and_eol(file)?;
    let response: PythonResponse = python::json(
        include_str!("text_tools_source.py"),
        ReplaceRequest {
            action: "replace",
            content: &text,
            options,
        },
        interpreter,
    )?;
    match response {
        PythonResponse::Ok {
            new_content,
            count,
            toc_entries,
            mut changes,
            spans,
        } => {
            for (change, span) in changes.iter_mut().zip(spans) {
                change.start_byte = Some(span.start_byte);
                change.end_byte = Some(span.end_byte);
                change.applied_text = Some(span.applied_text);
            }
            Ok(Plan {
                file: file.to_path_buf(),
                original_sha256: sha256(&raw),
                original_bytes: raw,
                // The replacement adapter retains the original newlines outside edits.
                new_bytes: encode_with_bom_and_eol(&new_content, has_bom, "\n"),
                match_count: count,
                toc_entries,
                changes,
            })
        }
        PythonResponse::Error { message } => Err(message.into()),
    }
}

fn create_backup_file(target: &Path, original_bytes: &[u8]) -> Result<PathBuf, CoreError> {
    let parent = target.parent().unwrap_or_else(|| Path::new("."));
    let name = target
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("chapter.txt");
    for suffix in 0..10_000usize {
        let candidate_name = if suffix == 0 {
            format!("{name}.bak")
        } else {
            format!("{name}.bak.{suffix}")
        };
        let candidate = parent.join(candidate_name);
        match OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&candidate)
        {
            Ok(mut file) => {
                file.write_all(original_bytes)?;
                file.sync_all()?;
                return Ok(candidate);
            }
            Err(err) if err.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(err) => return Err(format!("Không thể tạo tệp sao lưu: {err}").into()),
        }
    }
    Err("Không thể tạo tên tệp sao lưu duy nhất.".into())
}

pub fn apply(plan: &Plan) -> Result<(ApplyOutcome, Plan), CoreError> {
    let metadata = fs::symlink_metadata(&plan.file)
        .map_err(|err| format!("Không thể kiểm tra tệp đích: {err}"))?;
    if !metadata.is_file() {
        return Err("Đích không phải tệp thường.".into());
    }
    if metadata.permissions().readonly() {
        return Err("Tệp đang ở chế độ chỉ đọc (read-only).".into());
    }

    let current_bytes = fs::read(&plan.file)
        .map_err(|err| format!("Không thể đọc tệp nguồn trước khi ghi: {err}"))?;
    if sha256(&current_bytes) != plan.original_sha256 {
        return Err("Nội dung tệp đã thay đổi sau khi xem trước. Hãy xem trước lại.".into());
    }

    let parent = plan
        .file
        .parent()
        .filter(|path| !path.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."));
    let mut staged = tempfile::NamedTempFile::new_in(parent)?;
    staged.write_all(&plan.new_bytes)?;
    staged.as_file().set_permissions(metadata.permissions())?;
    staged.as_file().sync_all()?;

    let backup = create_backup_file(&plan.file, &current_bytes)?;
    if fs::read(&plan.file)? != current_bytes {
        return Err("Nội dung tệp đã thay đổi trong lúc chuẩn bị lưu. Hãy xem trước lại.".into());
    }
    staged.persist(&plan.file).map_err(|err| {
        format!(
            "Không thể ghi tệp (bản sao lưu tại {}): {err}",
            backup.display()
        )
    })?;

    let outcome = ApplyOutcome {
        file: plan.file.display().to_string(),
        backup: backup.display().to_string(),
        changed_count: plan.changes.len(),
    };
    Ok((outcome, plan.undo_plan()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renumber_preview_apply_and_undo_preserve_bom_and_crlf() {
        let dir = tempfile::tempdir().unwrap();
        let file = dir.path().join("story.txt");
        let original = b"\xef\xbb\xbfCh. 10\r\nNoi dung 1\r\nCh. 99\r\nNoi dung 2\r\n";
        fs::write(&file, original).unwrap();

        let plan = preview_renumber(&file, r"^Ch\.\s*\d+", "Chương {num}", 1, None).unwrap();
        assert_eq!(plan.match_count, 2);
        assert_eq!(plan.changes.len(), 2);
        assert_eq!(plan.changes[0].before, "Ch. 10");
        assert_eq!(plan.changes[0].after, "Chương 1");
        assert_eq!(plan.changes[1].after, "Chương 2");

        let (outcome, undo_plan) = apply(&plan).unwrap();
        assert_eq!(outcome.changed_count, 2);
        assert_eq!(
            fs::read(&file).unwrap(),
            b"\xef\xbb\xbfCh\xc6\xb0\xc6\xa1ng 1\r\nNoi dung 1\r\nCh\xc6\xb0\xc6\xa1ng 2\r\nNoi dung 2\r\n"
        );
        assert_eq!(fs::read(&outcome.backup).unwrap(), original);

        // Stale check fails if file changes before undo
        fs::write(&file, b"tampered").unwrap();
        assert!(apply(&undo_plan).is_err());

        // Restore applied bytes and undo cleanly
        fs::write(&file, &plan.new_bytes).unwrap();
        let (_undo_out, _) = apply(&undo_plan).unwrap();
        assert_eq!(fs::read(&file).unwrap(), original);
    }

    #[test]
    fn apply_toc_supports_append_and_replace_modes() {
        let dir = tempfile::tempdir().unwrap();
        let main = dir.path().join("main.txt");
        let toc = dir.path().join("toc.txt");
        fs::write(&main, "第1章\nBody 1\n第2章\nBody 2\n第3章\nBody 3\n").unwrap();
        fs::write(&toc, "第1章 Khởi đầu\n第2章 Cao trào\n").unwrap();

        let append_plan = preview_apply_toc(
            &main,
            &toc,
            r"^(第\d+章)",
            r"^第\d+章$",
            TocMode::Append,
            None,
        )
        .unwrap();
        assert_eq!(append_plan.toc_entries, Some(2));
        assert_eq!(append_plan.changes.len(), 2);
        assert_eq!(append_plan.changes[0].after, "第1章 Khởi đầu");
        assert_eq!(
            String::from_utf8(append_plan.new_bytes.clone()).unwrap(),
            "第1章 Khởi đầu\nBody 1\n第2章 Cao trào\nBody 2\n第3章\nBody 3\n"
        );

        let replace_plan = preview_apply_toc(
            &main,
            &toc,
            r"^(第\d+章)",
            r"^第\d+章$",
            TocMode::Replace,
            None,
        )
        .unwrap();
        assert_eq!(replace_plan.changes.len(), 2);
        assert_eq!(replace_plan.changes[1].after, "第2章 Cao trào");
    }

    #[test]
    fn replacement_preserves_mixed_endings_bom_and_rolls_back_exactly() {
        let dir = tempfile::tempdir().unwrap();
        let file = dir.path().join("story.txt");
        let original = "\u{feff}第1章\r\nMột chương\n第2章\rDòng mới";
        let expected = "\u{feff}Chương 1\r\nMột chương\nChương 2\rDòng mới";
        fs::write(&file, original).unwrap();
        let plan = preview_replace(
            &file,
            ReplaceOptions {
                search: r"(?m)^第(\d+)章$".into(),
                replacement: "Chương $1".into(),
                use_regex: true,
                whole_word: true,
                match_case: false,
            },
            None,
        )
        .unwrap();
        assert_eq!(plan.match_count, 2);
        assert_eq!(plan.changes[1].line_number, 3);
        assert_eq!(plan.new_bytes, expected.as_bytes());
        assert_eq!(fs::read(&file).unwrap(), original.as_bytes());

        let (outcome, undo) = apply(&plan).unwrap();
        assert_eq!(fs::read(&file).unwrap(), expected.as_bytes());
        assert_eq!(fs::read(outcome.backup).unwrap(), original.as_bytes());
        apply(&undo).unwrap();
        assert_eq!(fs::read(&file).unwrap(), original.as_bytes());
    }

    #[test]
    fn selective_replace_applies_only_checked_matches_and_undoes_cleanly() {
        let dir = tempfile::tempdir().unwrap();
        let file = dir.path().join("selective.txt");
        let original = b"\xef\xbb\xbfold one\r\nold two\r\nold three\r\n";
        fs::write(&file, original).unwrap();

        let plan = preview_replace(
            &file,
            ReplaceOptions {
                search: "old".into(),
                replacement: "new".into(),
                use_regex: false,
                whole_word: true,
                match_case: true,
            },
            None,
        )
        .unwrap();
        assert_eq!(plan.changes.len(), 3);

        let subset = plan.filter_changes(&[1, 3]).unwrap();
        assert_eq!(subset.changes.len(), 2);
        let (outcome, undo_plan) = apply(&subset).unwrap();
        assert_eq!(outcome.changed_count, 2);
        assert_eq!(
            fs::read(&file).unwrap(),
            b"\xef\xbb\xbfnew one\r\nold two\r\nnew three\r\n"
        );
        apply(&undo_plan).unwrap();
        assert_eq!(fs::read(&file).unwrap(), original);
    }
}
