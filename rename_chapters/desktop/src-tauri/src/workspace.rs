use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use novel_studio_core::{first_line, rename, rename_apply};
use serde::Serialize;

#[derive(Default)]
pub struct Workspace {
    folder: Option<PathBuf>,
    interpreter: Option<PathBuf>,
    revision: u32,
    prepared: Option<Prepared>,
    line_plan: Option<(u32, first_line::Plan)>,
    line_undo: Option<(u32, first_line::Plan)>,
}

#[derive(Serialize)]
pub struct Preview {
    revision: u32,
    rows: Vec<rename::Row>,
    eligible: Vec<String>,
}

struct Prepared {
    revision: u32,
    choices: Vec<Reviewed>,
    files: HashSet<String>,
}

#[derive(Serialize)]
pub struct LinePreview {
    revision: u32,
    rows: Vec<first_line::Review>,
}

#[derive(Serialize)]
pub struct LineResult {
    changed: Vec<first_line::Change>,
    failure: Option<first_line::Failure>,
    undo_revision: Option<u32>,
}

struct Reviewed {
    operation: rename_apply::Operation,
    snapshot: FileStamp,
}

#[derive(PartialEq)]
struct FileStamp {
    size: u64,
    modified: SystemTime,
}

impl FileStamp {
    fn read(path: &Path) -> Option<Self> {
        let metadata = fs::symlink_metadata(path).ok()?;
        if !metadata.is_file() {
            return None;
        }
        Some(Self {
            size: metadata.len(),
            modified: metadata.modified().ok()?,
        })
    }
}

impl Workspace {
    pub fn with_interpreter(interpreter: Option<PathBuf>) -> Self {
        Self {
            interpreter,
            ..Self::default()
        }
    }

    pub fn select(&mut self, folder: PathBuf) -> Result<String, String> {
        let canonical = folder.canonicalize().map_err(|err| err.to_string())?;
        if !canonical.is_dir() {
            return Err("Hãy chọn một thư mục.".into());
        }
        let label = folder.display().to_string();
        self.folder = Some(canonical);
        self.prepared = None;
        self.line_plan = None;
        self.line_undo = None;
        Ok(label)
    }

    pub fn select_interpreter(&mut self, executable: PathBuf) -> Result<String, String> {
        let filename = executable
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or("Tên tệp Python không hợp lệ.")?;
        let lower = filename.to_ascii_lowercase();
        let stem = if cfg!(windows) {
            lower
                .strip_suffix(".exe")
                .ok_or("Hãy chọn tệp python.exe.")?
        } else {
            lower.as_str()
        };
        let valid_stem = stem.strip_prefix("python").is_some_and(|version| {
            version
                .bytes()
                .all(|byte| byte.is_ascii_digit() || byte == b'.')
        });
        if !valid_stem || !executable.is_file() {
            return Err("Hãy chọn chương trình Python 3.".into());
        }
        let label = filename.to_owned();
        self.interpreter = Some(executable);
        self.prepared = None;
        self.line_plan = None;
        Ok(label)
    }

    pub fn preview(&mut self, options: rename::Options) -> Result<Preview, String> {
        self.prepared = None;
        self.line_plan = None;
        let folder = self.folder.as_ref().ok_or("Hãy chọn thư mục trước.")?;
        let rows = rename::preview_folder(folder, options, self.interpreter.as_deref())
            .map_err(|err| err.to_string())?;
        let choices: Vec<_> = rows
            .iter()
            .filter_map(|row| {
                let (source, target) = row.rename_pair()?;
                Some(Reviewed {
                    operation: rename_apply::Operation {
                        source: source.into(),
                        target: target.into(),
                    },
                    snapshot: FileStamp::read(&folder.join(source))?,
                })
            })
            .collect();
        let eligible = choices
            .iter()
            .map(|item| item.operation.source.clone())
            .collect();
        let revision = self.next_revision();
        let files = rows.iter().map(|row| row.filename().to_owned()).collect();
        self.prepared = Some(Prepared {
            revision,
            choices,
            files,
        });
        Ok(Preview {
            revision,
            rows,
            eligible,
        })
    }

    pub fn apply(
        &mut self,
        revision: u32,
        selection: Vec<String>,
    ) -> Result<rename_apply::Outcome, String> {
        self.line_plan = None;
        let folder = self.folder.as_ref().ok_or("Hãy chọn thư mục trước.")?;
        let Some(prepared) = self
            .prepared
            .take()
            .filter(|plan| plan.revision == revision)
        else {
            return Err("Bản xem trước đã hết hiệu lực. Hãy xem trước lại.".into());
        };
        let selected: HashSet<_> = selection.iter().map(String::as_str).collect();
        let reviewed: Vec<_> = prepared
            .choices
            .into_iter()
            .filter(|item| selected.contains(item.operation.source.as_str()))
            .collect();
        if reviewed.is_empty() || reviewed.len() != selection.len() {
            return Err("Chỉ có thể đổi các file hợp lệ trong bản xem trước.".into());
        }

        for entry in &reviewed {
            if FileStamp::read(&folder.join(&entry.operation.source)).as_ref()
                != Some(&entry.snapshot)
            {
                return Err(format!(
                    "{} đã thay đổi. Hãy xem trước lại.",
                    entry.operation.source
                ));
            }
        }
        let operations = reviewed.into_iter().map(|entry| entry.operation).collect();
        rename_apply::apply(rename_apply::Request {
            folder: folder.clone(),
            operations,
        })
        .map_err(|err| err.to_string())
    }

    pub fn preview_lines(
        &mut self,
        scan_revision: u32,
        edits: Vec<first_line::Edit>,
    ) -> Result<LinePreview, String> {
        self.line_plan = None;
        let folder = self.folder.as_ref().ok_or("Hãy chọn thư mục trước.")?;
        let scan = self
            .prepared
            .as_ref()
            .filter(|scan| scan.revision == scan_revision)
            .ok_or("Danh sách chương đã hết hiệu lực. Hãy xem trước lại.")?;
        if edits.is_empty() || !edits.iter().all(|edit| scan.files.contains(&edit.file)) {
            return Err("Chỉ có thể sửa các file trong danh sách đã xem trước.".into());
        }
        let mut plan = first_line::preview(first_line::PreviewRequest {
            folder: folder.clone(),
            edits,
        })
        .map_err(|err| err.to_string())?;
        let rows: Vec<_> = plan.review().collect();
        let changed: HashSet<_> = rows
            .iter()
            .filter(|row| row.current_line != row.replacement)
            .map(|row| row.file.as_str())
            .collect();
        plan.retain(|file| changed.contains(file));
        let revision = self.next_revision();
        if !plan.is_empty() {
            self.line_plan = Some((revision, plan));
        }
        Ok(LinePreview { revision, rows })
    }

    pub fn apply_lines(&mut self, revision: u32) -> Result<LineResult, String> {
        let (_, plan) = self
            .line_plan
            .take_if(|(id, _)| *id == revision)
            .ok_or("Bản đối chiếu dòng đầu đã hết hiệu lực. Hãy đối chiếu lại.")?;
        self.prepared = None;
        let outcome = first_line::apply(plan).map_err(|err| err.to_string())?;
        if !outcome.undo.is_empty() {
            self.line_undo = Some((self.next_revision(), outcome.undo));
        }
        Ok(LineResult {
            changed: outcome.changed,
            failure: outcome.failure,
            undo_revision: self.line_undo.as_ref().map(|(revision, _)| *revision),
        })
    }

    pub fn undo_lines(&mut self, revision: u32) -> Result<LineResult, String> {
        let (_, plan) = self
            .line_undo
            .as_mut()
            .filter(|(id, _)| *id == revision)
            .ok_or("Lần sửa này không còn khả dụng để hoàn tác.")?;
        self.prepared = None;
        self.line_plan = None;
        let outcome = first_line::apply(plan.clone()).map_err(|err| err.to_string())?;
        let undone: HashSet<_> = outcome
            .changed
            .iter()
            .map(|change| change.file.as_str())
            .collect();
        plan.retain(|file| !undone.contains(file));
        if plan.is_empty() {
            self.line_undo = None;
        }
        Ok(LineResult {
            changed: outcome.changed,
            failure: outcome.failure,
            undo_revision: self.line_undo.as_ref().map(|(revision, _)| *revision),
        })
    }

    fn next_revision(&mut self) -> u32 {
        self.revision = self.revision.wrapping_add(1);
        self.revision
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn choosing_a_folder_discards_a_plan() {
        let first = tempfile::tempdir().unwrap();
        let second = tempfile::tempdir().unwrap();
        let mut workspace = Workspace::default();
        workspace.select(first.path().to_owned()).unwrap();
        workspace.prepared = Some(Prepared {
            revision: 1,
            choices: vec![],
            files: HashSet::new(),
        });
        workspace.select(second.path().to_owned()).unwrap();
        assert!(workspace.prepared.is_none());
    }

    #[test]
    fn file_modified_since_preview_blocks_the_whole_selection() {
        let folder = tempfile::tempdir().unwrap();
        let source = folder.path().join("1.txt");
        fs::write(&source, "1").unwrap();
        let mut workspace = Workspace::default();
        workspace.select(folder.path().to_owned()).unwrap();
        workspace.prepared = Some(Prepared {
            revision: 1,
            choices: vec![Reviewed {
                operation: rename_apply::Operation {
                    source: "1.txt".into(),
                    target: "Chapter 1.txt".into(),
                },
                snapshot: FileStamp::read(&source).unwrap(),
            }],
            files: HashSet::new(),
        });
        fs::write(&source, "changed").unwrap();
        assert!(workspace.apply(1, vec!["1.txt".into()]).is_err());
        assert_eq!(fs::read_to_string(source).unwrap(), "changed");
        assert!(!folder.path().join("Chapter 1.txt").exists());
        assert!(workspace.prepared.is_none());
    }

    #[test]
    fn applies_only_the_reviewed_selection_once() {
        let folder = tempfile::tempdir().unwrap();
        let mut workspace = Workspace::default();
        workspace.select(folder.path().to_owned()).unwrap();
        let choices = ["1.txt", "2.txt"]
            .into_iter()
            .map(|name| {
                let path = folder.path().join(name);
                fs::write(&path, name).unwrap();
                Reviewed {
                    operation: rename_apply::Operation {
                        source: name.into(),
                        target: format!("chapter-{name}"),
                    },
                    snapshot: FileStamp::read(&path).unwrap(),
                }
            })
            .collect();
        workspace.prepared = Some(Prepared {
            revision: 1,
            choices,
            files: HashSet::new(),
        });
        assert!(workspace.apply(1, vec!["2.txt".into()]).is_ok());
        assert_eq!(
            fs::read_to_string(folder.path().join("chapter-2.txt")).unwrap(),
            "2.txt"
        );
        assert!(folder.path().join("1.txt").is_file());
        assert!(workspace.apply(1, vec!["1.txt".into()]).is_err());
    }

    fn line_fixture() -> (tempfile::TempDir, Workspace) {
        let folder = tempfile::tempdir().unwrap();
        fs::write(folder.path().join("1.txt"), b"\xef\xbb\xbfOld\r\nbody\r\n").unwrap();
        fs::write(folder.path().join("2.txt"), b"Second\n").unwrap();
        fs::write(folder.path().join("extra.txt"), b"Outside the scan\n").unwrap();
        let mut workspace = Workspace::default();
        workspace.select(folder.path().to_owned()).unwrap();
        let revision = workspace.next_revision();
        workspace.prepared = Some(Prepared {
            revision,
            choices: vec![],
            files: ["1.txt".into(), "2.txt".into()].into(),
        });
        (folder, workspace)
    }

    fn line(file: &str, replacement: &str) -> first_line::Edit {
        first_line::Edit {
            file: file.into(),
            replacement: replacement.into(),
        }
    }

    #[test]
    fn line_review_is_bound_to_scan_and_saves_only_changed_rows() {
        let (folder, mut workspace) = line_fixture();
        assert!(
            workspace
                .preview_lines(8, vec![line("1.txt", "New")])
                .is_err()
        );
        assert!(
            workspace
                .preview_lines(1, vec![line("extra.txt", "New")])
                .is_err()
        );
        let review = workspace
            .preview_lines(1, vec![line("1.txt", "New"), line("2.txt", "Second")])
            .unwrap();
        assert_eq!(review.rows[0].current_line, "Old");
        assert_eq!(review.rows[0].replacement, "New");
        assert!(workspace.apply_lines(review.revision + 1).is_err());
        // An unchanged row was shown for review but need not match when saving.
        fs::write(folder.path().join("2.txt"), b"Unrelated update\n").unwrap();
        let result = workspace.apply_lines(review.revision).unwrap();
        assert_eq!(result.changed.len(), 1);
        assert!(workspace.apply_lines(review.revision).is_err());
        let file = folder.path().join("1.txt");
        let saved = b"\xef\xbb\xbfNew\r\nbody\r\n";
        assert_eq!(fs::read(&file).unwrap(), saved);
        fs::write(&file, b"\xef\xbb\xbfNew\r\nupdated\r\n").unwrap();
        let undo = result.undo_revision.unwrap();
        assert!(workspace.undo_lines(undo).is_err());
        assert_eq!(fs::read(&file).unwrap(), b"\xef\xbb\xbfNew\r\nupdated\r\n");
        fs::write(&file, saved).unwrap();
        assert!(workspace.undo_lines(undo).unwrap().undo_revision.is_none());
        assert_eq!(fs::read(file).unwrap(), b"\xef\xbb\xbfOld\r\nbody\r\n");
    }

    #[test]
    fn changing_chapter_content_after_line_review_blocks_batch() {
        let (folder, mut workspace) = line_fixture();
        let review = workspace
            .preview_lines(1, vec![line("1.txt", "New"), line("2.txt", "New second")])
            .unwrap();
        let second = folder.path().join("2.txt");
        fs::write(&second, b"Second\nnew body\n").unwrap();
        assert!(workspace.apply_lines(review.revision).is_err());
        assert_eq!(fs::read(second).unwrap(), b"Second\nnew body\n");
        assert_eq!(
            fs::read(folder.path().join("1.txt")).unwrap(),
            b"\xef\xbb\xbfOld\r\nbody\r\n"
        );
        assert!(workspace.line_undo.is_none());
    }
}
