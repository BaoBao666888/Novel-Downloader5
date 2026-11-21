use std::collections::HashSet;
use std::fs::{self, File};
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::names::{destination_key, valid_chapter};

#[derive(Deserialize)]
pub struct PreviewRequest {
    pub folder: PathBuf,
    pub edits: Vec<Edit>,
}

#[derive(Clone, Deserialize, Serialize)]
pub struct Edit {
    pub file: String,
    pub replacement: String,
}

#[derive(Clone, Deserialize, Serialize)]
pub struct Plan {
    folder: PathBuf,
    edits: Vec<PlannedEdit>,
}

#[derive(Clone, Deserialize, Serialize)]
struct PlannedEdit {
    #[serde(flatten)]
    edit: Edit,
    expected_sha256: String,
    current_line: String,
}

#[derive(Serialize)]
pub struct Review {
    pub file: String,
    pub current_line: String,
    pub replacement: String,
}

impl Plan {
    pub fn review(&self) -> impl Iterator<Item = Review> + '_ {
        self.edits.iter().map(|entry| Review {
            file: entry.edit.file.clone(),
            current_line: entry.current_line.clone(),
            replacement: entry.edit.replacement.clone(),
        })
    }

    pub fn is_empty(&self) -> bool {
        self.edits.is_empty()
    }

    pub fn retain(&mut self, mut keep: impl FnMut(&str) -> bool) {
        self.edits.retain(|entry| keep(&entry.edit.file));
    }
}

#[derive(Serialize)]
pub struct Outcome {
    pub changed: Vec<Change>,
    unchanged: Vec<String>,
    pub failure: Option<Failure>,
    pub undo: Plan,
}

#[derive(Serialize)]
pub struct Change {
    pub file: String,
    backup: PathBuf,
}

#[derive(Serialize)]
pub struct Failure {
    file: String,
    error: String,
    recovery_dir: Option<PathBuf>,
}

struct Snapshot {
    bytes: Vec<u8>,
    header: std::ops::Range<usize>,
    permissions: fs::Permissions,
}

impl Snapshot {
    fn read(path: &Path) -> io::Result<Self> {
        let metadata = fs::symlink_metadata(path)?;
        if !metadata.is_file() {
            return Err(invalid("Nguồn phải là file thường"));
        }
        let bytes = fs::read(path)?;
        let start = if bytes.starts_with(b"\xef\xbb\xbf") {
            3
        } else {
            0
        };
        let end = bytes[start..]
            .iter()
            .position(|byte| matches!(byte, b'\r' | b'\n'))
            .map_or(bytes.len(), |offset| start + offset);
        Ok(Self {
            bytes,
            header: start..end,
            permissions: metadata.permissions(),
        })
    }

    fn current_line(&self) -> io::Result<&str> {
        let line = std::str::from_utf8(&self.bytes[self.header.clone()])
            .map_err(|_| invalid("Dòng đầu phải là UTF-8"))?;
        if !valid_replacement(line) {
            return Err(invalid("Dòng đầu chứa ký tự nhị phân"));
        }
        Ok(line)
    }

    fn check_replacement(&self, line: &str) -> io::Result<()> {
        if self.header.start == 0 && line.starts_with('\u{feff}') {
            return Err(invalid("Dòng thay thế không được thêm BOM mới"));
        }
        Ok(())
    }

    fn matches(&self, expected: &str) -> io::Result<()> {
        if fingerprint(&self.bytes) != expected {
            return Err(invalid(
                "File đã thay đổi sau preview. Hãy tạo preview mới.",
            ));
        }
        Ok(())
    }

    fn write_replacement(&self, target: &Path, replacement: &str) -> io::Result<String> {
        let mut file = File::create_new(target)?;
        let mut hash = Sha256::new();
        for part in [
            &self.bytes[..self.header.start],
            replacement.as_bytes(),
            &self.bytes[self.header.end..],
        ] {
            file.write_all(part)?;
            hash.update(part);
        }
        #[cfg(unix)]
        file.set_permissions(self.permissions.clone())?;
        file.sync_all()?;
        Ok(format!("{:x}", hash.finalize()))
    }
}

fn invalid(message: &str) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidInput, message)
}

fn fingerprint(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn verify_folder(path: &Path) -> io::Result<PathBuf> {
    let folder = fs::canonicalize(path)?;
    if !folder.is_dir() {
        return Err(invalid("Kế hoạch sửa dòng đầu cần một thư mục"));
    }
    Ok(folder)
}

pub fn valid_replacement(line: &str) -> bool {
    !line.contains(['\r', '\n', '\0'])
}

fn validate_edits<'a>(edits: impl IntoIterator<Item = &'a Edit>) -> io::Result<()> {
    let mut names = HashSet::new();
    for edit in edits {
        if !valid_chapter(&edit.file) {
            return Err(invalid(&format!(
                "Tên file TXT không hợp lệ: {:?}",
                edit.file
            )));
        }
        if !names.insert(destination_key(&edit.file)) {
            return Err(invalid(&format!(
                "File lặp trong kế hoạch: {:?}",
                edit.file
            )));
        }
        if !valid_replacement(&edit.replacement) {
            return Err(invalid(&format!(
                "Nội dung thay thế phải vừa một dòng: {:?}",
                edit.file
            )));
        }
    }
    Ok(())
}

pub fn preview(request: PreviewRequest) -> io::Result<Plan> {
    let folder = verify_folder(&request.folder)?;
    validate_edits(&request.edits)?;
    let edits = request
        .edits
        .into_iter()
        .map(|edit| {
            let with_filename =
                |err: io::Error| io::Error::new(err.kind(), format!("{:?}: {err}", edit.file));
            let snapshot = Snapshot::read(&folder.join(&edit.file)).map_err(with_filename)?;
            snapshot
                .check_replacement(&edit.replacement)
                .map_err(with_filename)?;
            Ok(PlannedEdit {
                current_line: snapshot.current_line().map_err(with_filename)?.to_owned(),
                expected_sha256: fingerprint(&snapshot.bytes),
                edit,
            })
        })
        .collect::<io::Result<_>>()?;
    Ok(Plan { folder, edits })
}

fn checked_snapshot(folder: &Path, entry: &PlannedEdit) -> io::Result<Snapshot> {
    let snapshot = Snapshot::read(&folder.join(&entry.edit.file))?;
    snapshot.matches(&entry.expected_sha256)?;
    snapshot.check_replacement(&entry.edit.replacement)?;
    if snapshot.current_line()? != entry.current_line {
        return Err(invalid("Dòng đầu không khớp với preview"));
    }
    if snapshot.permissions.readonly() && entry.current_line != entry.edit.replacement {
        return Err(io::Error::new(
            io::ErrorKind::PermissionDenied,
            "File đang ở chế độ chỉ đọc",
        ));
    }
    Ok(snapshot)
}

pub fn apply(plan: Plan) -> io::Result<Outcome> {
    let folder = verify_folder(&plan.folder)?;
    validate_edits(plan.edits.iter().map(|entry| &entry.edit))?;
    for entry in &plan.edits {
        checked_snapshot(&folder, entry)
            .map_err(|err| io::Error::new(err.kind(), format!("{:?}: {err}", entry.edit.file)))?;
    }

    let mut outcome = Outcome {
        changed: Vec::new(),
        unchanged: Vec::new(),
        failure: None,
        undo: Plan {
            folder: folder.clone(),
            edits: Vec::new(),
        },
    };
    for entry in plan.edits {
        match apply_one(&folder, &entry) {
            Ok(Some((backup, expected_sha256))) => {
                outcome.changed.push(Change {
                    file: entry.edit.file.clone(),
                    backup,
                });
                outcome.undo.edits.push(PlannedEdit {
                    current_line: entry.edit.replacement,
                    expected_sha256,
                    edit: Edit {
                        file: entry.edit.file,
                        replacement: entry.current_line,
                    },
                });
            }
            Ok(None) => outcome.unchanged.push(entry.edit.file),
            Err(failure) => {
                outcome.failure = Some(failure);
                break;
            }
        }
    }
    Ok(outcome)
}

fn apply_one(folder: &Path, entry: &PlannedEdit) -> Result<Option<(PathBuf, String)>, Failure> {
    let failure = |err: io::Error| Failure {
        file: entry.edit.file.clone(),
        error: err.to_string(),
        recovery_dir: None,
    };
    let snapshot = checked_snapshot(folder, entry).map_err(failure)?;
    if entry.current_line == entry.edit.replacement {
        return Ok(None);
    }

    let original = folder.join(&entry.edit.file);
    let dir = tempfile::Builder::new()
        .prefix(".novel-studio-backup-")
        .tempdir_in(folder)
        .map_err(failure)?;
    let backup = dir.path().join("original.txt");
    let replacement = if cfg!(windows) {
        dir.path().join("edited.txt")
    } else {
        backup.clone()
    };

    let replacement_sha256 = snapshot
        .write_replacement(&replacement, &entry.edit.replacement)
        .map_err(failure)?;
    drop(snapshot);
    // The comparison runs again after staging, which can take time on slow disks.
    checked_snapshot(folder, entry).map_err(failure)?;
    if let Err(err) = replace_with_backup(&original, &replacement, &backup) {
        #[cfg(windows)]
        let recoverable_windows_failure = err.raw_os_error()
            == Some(windows_sys::Win32::Foundation::ERROR_UNABLE_TO_MOVE_REPLACEMENT_2 as i32);
        #[allow(unused_mut)]
        let mut result = failure(err);
        // Windows can return a failed replacement after moving the original to the backup.
        #[cfg(windows)]
        if recoverable_windows_failure || backup.try_exists().unwrap_or(true) {
            result.recovery_dir = Some(dir.keep());
        }
        return Err(result);
    }

    let kept = dir.keep();
    if let Err(err) =
        Snapshot::read(&backup).and_then(|saved| saved.matches(&entry.expected_sha256))
    {
        let mut result = failure(err);
        result.recovery_dir = Some(kept);
        return Err(result);
    }
    Ok(Some((backup, replacement_sha256)))
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn replace_with_backup(original: &Path, replacement: &Path, _backup: &Path) -> io::Result<()> {
    use rustix::fs::{CWD, RenameFlags, renameat_with};

    renameat_with(CWD, original, CWD, replacement, RenameFlags::EXCHANGE).map_err(Into::into)
}

#[cfg(windows)]
fn replace_with_backup(original: &Path, replacement: &Path, backup: &Path) -> io::Result<()> {
    use std::os::windows::ffi::OsStrExt;
    use std::ptr::null;

    let wide = |path: &Path| {
        path.as_os_str()
            .encode_wide()
            .chain([0])
            .collect::<Vec<_>>()
    };
    let original = wide(original);
    let replacement = wide(replacement);
    let backup = wide(backup);
    // Each path buffer is nul-terminated and alive for the call. Reserved arguments are null.
    let result = unsafe {
        windows_sys::Win32::Storage::FileSystem::ReplaceFileW(
            original.as_ptr(),
            replacement.as_ptr(),
            backup.as_ptr(),
            0,
            null(),
            null(),
        )
    };
    if result == 0 {
        Err(io::Error::last_os_error())
    } else {
        Ok(())
    }
}

#[cfg(not(any(windows, target_os = "linux", target_os = "macos")))]
fn replace_with_backup(_original: &Path, _replacement: &Path, _backup: &Path) -> io::Result<()> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "Chưa hỗ trợ lưu trên hệ điều hành này",
    ))
}
