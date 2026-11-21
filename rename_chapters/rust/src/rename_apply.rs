use std::collections::HashSet;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::CoreError;
use crate::names::{destination_key, valid_chapter, valid_target};

#[derive(Deserialize)]
pub struct Request {
    pub folder: PathBuf,
    pub operations: Vec<Operation>,
}

#[derive(Deserialize, Serialize)]
pub struct Operation {
    pub source: String,
    pub target: String,
}

#[derive(Default, Serialize)]
pub struct Outcome {
    renamed: Vec<Operation>,
    pub failure: Option<Failure>,
}

#[derive(Serialize)]
pub struct Failure {
    operation: Operation,
    error: String,
}

pub fn apply(request: Request) -> Result<Outcome, CoreError> {
    let folder = fs::canonicalize(&request.folder)?;
    if !folder.is_dir() {
        return Err("Kế hoạch đổi tên cần một thư mục".into());
    }
    validate(&folder, &request.operations)?;

    let mut outcome = Outcome::default();
    for operation in request.operations {
        let source = folder.join(&operation.source);
        let target = folder.join(&operation.target);
        if let Err(err) =
            check_source(&source).and_then(|()| move_without_replacing(&source, &target))
        {
            outcome.failure = Some(Failure {
                operation,
                error: err.to_string(),
            });
            break;
        }
        outcome.renamed.push(operation);
    }
    Ok(outcome)
}

fn validate(folder: &Path, operations: &[Operation]) -> Result<(), CoreError> {
    let mut sources = HashSet::new();
    let mut targets = HashSet::new();
    for Operation { source, target } in operations {
        if !valid_chapter(source) {
            return Err(format!("Tên file nguồn TXT không hợp lệ: {source:?}").into());
        }
        if !valid_target(target) {
            return Err(format!("Tên đích không hợp lệ: {target:?}").into());
        }
        if !sources.insert(destination_key(source)) {
            return Err(format!("File nguồn lặp trong kế hoạch: {source:?}").into());
        }
        if !targets.insert(destination_key(target)) {
            return Err(format!("Tên đích trùng trong kế hoạch: {target:?}").into());
        }
    }

    for Operation { source, target } in operations {
        check_source(&folder.join(source)).map_err(|err| format!("{source:?}: {err}"))?;
        match fs::symlink_metadata(folder.join(target)) {
            Ok(_) => return Err(format!("Tên đích đã tồn tại: {target:?}").into()),
            Err(err) if err.kind() == io::ErrorKind::NotFound => {}
            Err(err) => return Err(format!("Không kiểm tra được đích {target:?}: {err}").into()),
        }
    }
    Ok(())
}

fn check_source(path: &Path) -> io::Result<()> {
    if fs::symlink_metadata(path)?.file_type().is_file() {
        Ok(())
    } else {
        Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "Nguồn phải là file thường",
        ))
    }
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn move_without_replacing(source: &Path, target: &Path) -> io::Result<()> {
    use rustix::fs::{CWD, RenameFlags, renameat_with};

    renameat_with(CWD, source, CWD, target, RenameFlags::NOREPLACE).map_err(Into::into)
}

#[cfg(windows)]
fn move_without_replacing(source: &Path, target: &Path) -> io::Result<()> {
    use std::os::windows::ffi::OsStrExt;

    let source: Vec<_> = source.as_os_str().encode_wide().chain([0]).collect();
    let target: Vec<_> = target.as_os_str().encode_wide().chain([0]).collect();

    // Both UTF-16 paths are nul-terminated and remain alive for this call.
    let result = unsafe {
        windows_sys::Win32::Storage::FileSystem::MoveFileExW(source.as_ptr(), target.as_ptr(), 0)
    };
    if result == 0 {
        Err(io::Error::last_os_error())
    } else {
        Ok(())
    }
}

#[cfg(not(any(windows, target_os = "linux", target_os = "macos")))]
fn move_without_replacing(_source: &Path, _target: &Path) -> io::Result<()> {
    Err(io::Error::new(
        io::ErrorKind::Unsupported,
        "Đổi tên chống ghi đè chưa hỗ trợ hệ điều hành này",
    ))
}

#[cfg(all(test, any(windows, target_os = "linux", target_os = "macos")))]
mod tests {
    use super::*;

    #[test]
    fn target_created_after_preflight_is_preserved() {
        let folder =
            std::env::temp_dir().join(format!("novel-studio-rename-test-{}", std::process::id()));
        fs::create_dir(&folder).unwrap();
        let source = folder.join("1.txt");
        let target = folder.join("new.txt");
        fs::write(&source, b"source").unwrap();
        validate(
            &folder,
            &[Operation {
                source: "1.txt".into(),
                target: "new.txt".into(),
            }],
        )
        .unwrap();
        fs::write(&target, b"created after preflight").unwrap();

        let result = move_without_replacing(&source, &target);
        let source_bytes = fs::read(&source);
        let target_bytes = fs::read(&target);
        fs::remove_dir_all(&folder).unwrap();
        assert_eq!(result.unwrap_err().kind(), io::ErrorKind::AlreadyExists);
        assert_eq!(source_bytes.unwrap(), b"source");
        assert_eq!(target_bytes.unwrap(), b"created after preflight");
    }
}
