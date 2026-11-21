use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use novel_studio_core::{rename, rename_apply};
use serde::Serialize;

#[derive(Default)]
pub struct Workspace {
    folder: Option<PathBuf>,
    interpreter: Option<PathBuf>,
    revision: u32,
    prepared: Option<Prepared>,
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
    pub fn select(&mut self, folder: PathBuf) -> Result<String, String> {
        let canonical = folder.canonicalize().map_err(|err| err.to_string())?;
        if !canonical.is_dir() {
            return Err("Hãy chọn một thư mục.".into());
        }
        let label = folder.display().to_string();
        self.folder = Some(canonical);
        self.prepared = None;
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
        Ok(label)
    }

    pub fn preview(&mut self, options: rename::Options) -> Result<Preview, String> {
        self.prepared = None;
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
        self.revision = self.revision.wrapping_add(1);
        self.prepared = Some(Prepared {
            revision: self.revision,
            choices,
        });
        Ok(Preview {
            revision: self.revision,
            rows,
            eligible,
        })
    }

    pub fn apply(
        &mut self,
        revision: u32,
        selection: Vec<String>,
    ) -> Result<rename_apply::Outcome, String> {
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
        });
        assert!(workspace.apply(1, vec!["2.txt".into()]).is_ok());
        assert_eq!(
            fs::read_to_string(folder.path().join("chapter-2.txt")).unwrap(),
            "2.txt"
        );
        assert!(folder.path().join("1.txt").is_file());
        assert!(workspace.apply(1, vec!["1.txt".into()]).is_err());
    }
}
