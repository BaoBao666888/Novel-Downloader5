use std::collections::HashSet;
use std::ffi::OsStr;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use novel_studio_core::{archive, first_line, merge, rename, rename_apply, split, text_tools};
use serde::{Deserialize, Serialize};

#[derive(Default)]
pub struct Workspace {
    folder: Option<PathBuf>,
    interpreter: Option<PathBuf>,
    revision: u32,
    prepared: Option<Prepared>,
    line_plan: Option<(u32, first_line::Plan)>,
    line_undo: Option<(u32, first_line::Plan)>,
    split_file: Option<PathBuf>,
    split_output_dir: Option<PathBuf>,
    split_session: Option<(u32, split::SplitSession)>,
    text_main_file: Option<PathBuf>,
    text_toc_file: Option<PathBuf>,
    text_plan: Option<(u32, text_tools::Plan)>,
    text_undo: Option<(u32, text_tools::Plan)>,
    archive_file: Option<PathBuf>,
    archive_output_dir: Option<PathBuf>,
    archive_plan: Option<(u32, archive::ArchivePlan)>,
    merge_folder: Option<PathBuf>,
    merge_output_file: Option<PathBuf>,
    merge_revision: Option<u32>,
}

#[derive(Serialize)]
pub struct MergePreview {
    pub revision: u32,
    pub output_file: String,
    pub info: merge::MergeInspection,
}

#[derive(Serialize)]
pub struct ArchivePreview {
    pub revision: u32,
    pub output_dir: String,
    pub info: archive::ArchiveInspection,
}

#[derive(Serialize)]
pub struct TextPreview {
    pub revision: u32,
    pub summary: text_tools::PreviewSummary,
    pub has_changes: bool,
}

#[derive(Serialize)]
pub struct TextResult {
    pub outcome: text_tools::ApplyOutcome,
    pub undo_revision: Option<u32>,
}

#[derive(Serialize)]
pub struct SplitSelection {
    pub file: String,
    pub output_dir: String,
}

#[derive(Deserialize)]
pub struct SplitOptions {
    pub pattern: String,
    pub position: String,
    pub preface_mode: split::PrefaceMode,
    pub name_format: String,
}

#[derive(Serialize)]
pub struct SplitPreview {
    pub revision: u32,
    pub output_dir: String,
    pub parts: Vec<split::PartSummary>,
    pub writable_count: usize,
    pub can_undo: bool,
    pub can_redo: bool,
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

    pub fn interpreter(&self) -> Option<PathBuf> {
        self.interpreter.clone()
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
        self.split_session = None;
        self.text_plan = None;
        self.archive_plan = None;
        Ok(label)
    }

    pub fn select_archive_file(&mut self, file: PathBuf) -> Result<SplitSelection, String> {
        let metadata = fs::symlink_metadata(&file).map_err(|err| err.to_string())?;
        if !metadata.is_file() {
            return Err("Hãy chọn một tệp nén .zip hợp lệ.".into());
        }
        let is_zip = file
            .extension()
            .and_then(|ext| ext.to_str())
            .is_some_and(|ext| ext.eq_ignore_ascii_case("zip"));
        if !is_zip {
            return Err("Hiện hỗ trợ xem trước và giải nén tệp .zip.".into());
        }
        let canonical = file.canonicalize().map_err(|err| err.to_string())?;
        let default_dir = archive::default_extract_dir(&canonical);
        let file_label = file.display().to_string();
        let dir_label = default_dir.display().to_string();
        self.archive_file = Some(canonical);
        self.archive_output_dir = Some(default_dir);
        self.archive_plan = None;
        Ok(SplitSelection {
            file: file_label,
            output_dir: dir_label,
        })
    }

    pub fn select_archive_output_dir(&mut self, folder: PathBuf) -> Result<String, String> {
        let canonical = folder.canonicalize().map_err(|err| err.to_string())?;
        if !canonical.is_dir() {
            return Err("Hãy chọn một thư mục đích hợp lệ.".into());
        }
        let label = folder.display().to_string();
        self.archive_output_dir = Some(canonical);
        Ok(label)
    }

    pub fn inspect_archive(&mut self) -> Result<ArchivePreview, String> {
        self.archive_plan = None;
        let file = self
            .archive_file
            .as_ref()
            .ok_or("Hãy chọn tệp nén .zip trước.")?;
        let (plan, info) =
            archive::inspect(file, self.interpreter.as_deref()).map_err(|err| err.to_string())?;
        let output_dir = self
            .archive_output_dir
            .clone()
            .unwrap_or_else(|| archive::default_extract_dir(file));
        let revision = self.next_revision();
        self.archive_plan = Some((revision, plan));
        Ok(ArchivePreview {
            revision,
            output_dir: output_dir.display().to_string(),
            info,
        })
    }

    pub fn preview_archive_entry(
        &self,
        revision: u32,
        entry_index: usize,
    ) -> Result<archive::EntryPreview, String> {
        let (_, plan) = self
            .archive_plan
            .as_ref()
            .filter(|(id, _)| *id == revision)
            .ok_or("Danh sách tệp nén đã hết hiệu lực. Hãy quét lại.")?;
        archive::preview_entry(plan, entry_index, self.interpreter.as_deref())
            .map_err(|err| err.to_string())
    }

    pub fn extract_archive(
        &self,
        revision: u32,
        indices: Vec<usize>,
        overwrite: bool,
    ) -> Result<archive::ExtractOutcome, String> {
        let (_, plan) = self
            .archive_plan
            .as_ref()
            .filter(|(id, _)| *id == revision)
            .ok_or("Danh sách tệp nén đã hết hiệu lực. Hãy quét lại.")?;
        let output_dir = self
            .archive_output_dir
            .clone()
            .unwrap_or_else(|| archive::default_extract_dir(&plan.archive_path));
        archive::extract(
            plan,
            &output_dir,
            &indices,
            overwrite,
            self.interpreter.as_deref(),
        )
        .map_err(|err| err.to_string())
    }

    pub fn select_merge_folder(&mut self, folder: PathBuf) -> Result<MergePreview, String> {
        let canonical = folder.canonicalize().map_err(|err| err.to_string())?;
        if !canonical.is_dir() {
            return Err("Hãy chọn một thư mục chứa tệp .txt.".into());
        }
        let default_out = merge::default_merge_output(&canonical);
        let info = merge::inspect_folder(&canonical).map_err(|err| err.to_string())?;
        let revision = self.next_revision();
        self.merge_folder = Some(canonical);
        self.merge_output_file = Some(default_out.clone());
        self.merge_revision = Some(revision);
        Ok(MergePreview {
            revision,
            output_file: default_out.display().to_string(),
            info,
        })
    }

    pub fn select_merge_output(&mut self, file: PathBuf) -> Result<String, String> {
        let label = file.display().to_string();
        self.merge_output_file = Some(file);
        Ok(label)
    }

    pub fn refresh_merge(&mut self) -> Result<MergePreview, String> {
        let folder = self
            .merge_folder
            .clone()
            .ok_or("Hãy chọn thư mục chứa tệp .txt trước.")?;
        let info = merge::inspect_folder(&folder).map_err(|err| err.to_string())?;
        let output_file = self
            .merge_output_file
            .clone()
            .unwrap_or_else(|| merge::default_merge_output(&folder));
        let revision = self.next_revision();
        self.merge_revision = Some(revision);
        Ok(MergePreview {
            revision,
            output_file: output_file.display().to_string(),
            info,
        })
    }

    pub fn apply_merge(
        &self,
        revision: u32,
        options: merge::MergeOptions,
    ) -> Result<merge::MergeOutcome, String> {
        if self.merge_revision != Some(revision) {
            return Err("Danh sách ghép đã hết hiệu lực. Hãy quét lại thư mục.".into());
        }
        let folder = self
            .merge_folder
            .as_ref()
            .ok_or("Hãy chọn thư mục chứa tệp .txt trước.")?;
        let output = self
            .merge_output_file
            .clone()
            .unwrap_or_else(|| merge::default_merge_output(folder));
        merge::execute_merge(folder, &output, options).map_err(|err| err.to_string())
    }

    pub fn select_text_file(&mut self, file: PathBuf) -> Result<String, String> {
        let metadata = fs::symlink_metadata(&file).map_err(|err| err.to_string())?;
        if !metadata.is_file() {
            return Err("Hãy chọn một tệp văn bản .txt hợp lệ.".into());
        }
        let is_txt = file
            .extension()
            .and_then(|ext| ext.to_str())
            .is_some_and(|ext| ext.eq_ignore_ascii_case("txt"));
        if !is_txt {
            return Err("Chỉ hỗ trợ xử lý tệp .txt.".into());
        }
        let canonical = file.canonicalize().map_err(|err| err.to_string())?;
        let label = file.display().to_string();
        self.text_main_file = Some(canonical);
        self.text_plan = None;
        self.text_undo = None;
        Ok(label)
    }

    pub fn select_toc_file(&mut self, file: PathBuf) -> Result<String, String> {
        let metadata = fs::symlink_metadata(&file).map_err(|err| err.to_string())?;
        if !metadata.is_file() {
            return Err("Hãy chọn một tệp mục lục .txt hợp lệ.".into());
        }
        let is_txt = file
            .extension()
            .and_then(|ext| ext.to_str())
            .is_some_and(|ext| ext.eq_ignore_ascii_case("txt"));
        if !is_txt {
            return Err("Chỉ hỗ trợ tệp mục lục .txt.".into());
        }
        let canonical = file.canonicalize().map_err(|err| err.to_string())?;
        let label = file.display().to_string();
        self.text_toc_file = Some(canonical);
        self.text_plan = None;
        Ok(label)
    }

    pub fn preview_renumber(
        &mut self,
        find_regex: String,
        replace_format: String,
        start_num: i64,
    ) -> Result<TextPreview, String> {
        self.text_plan = None;
        let file = self
            .text_main_file
            .as_ref()
            .ok_or("Hãy chọn tệp .txt cần xử lý trước.")?;
        let plan = text_tools::preview_renumber(
            file,
            &find_regex,
            &replace_format,
            start_num,
            self.interpreter.as_deref(),
        )
        .map_err(|err| err.to_string())?;
        Ok(self.prepare_text_plan(plan))
    }

    pub fn preview_apply_toc(
        &mut self,
        toc_regex: String,
        main_regex: String,
        mode: text_tools::TocMode,
    ) -> Result<TextPreview, String> {
        self.text_plan = None;
        let main_file = self
            .text_main_file
            .as_ref()
            .ok_or("Hãy chọn tệp truyện chính (.txt) trước.")?;
        let toc_file = self
            .text_toc_file
            .as_ref()
            .ok_or("Hãy chọn tệp mục lục (.txt) trước.")?;
        let plan = text_tools::preview_apply_toc(
            main_file,
            toc_file,
            &toc_regex,
            &main_regex,
            mode,
            self.interpreter.as_deref(),
        )
        .map_err(|err| err.to_string())?;
        Ok(self.prepare_text_plan(plan))
    }

    pub fn preview_replace(
        &mut self,
        options: text_tools::ReplaceOptions,
    ) -> Result<TextPreview, String> {
        self.text_plan = None;
        let file = self
            .text_main_file
            .as_ref()
            .ok_or("Hãy chọn tệp .txt cần xử lý trước.")?;
        let plan = text_tools::preview_replace(file, options, self.interpreter.as_deref())
            .map_err(|err| err.to_string())?;
        Ok(self.prepare_text_plan(plan))
    }

    fn prepare_text_plan(&mut self, plan: text_tools::Plan) -> TextPreview {
        let summary = plan.summary();
        let has_changes = plan.has_changes();
        let revision = self.next_revision();
        if has_changes {
            self.text_plan = Some((revision, plan));
        }
        TextPreview {
            revision,
            summary,
            has_changes,
        }
    }

    pub fn apply_text_edit(
        &mut self,
        revision: u32,
        selected_indices: Option<Vec<usize>>,
    ) -> Result<TextResult, String> {
        let (_, plan) = self
            .text_plan
            .take_if(|(id, _)| *id == revision)
            .ok_or("Bản xem trước công cụ văn bản đã hết hiệu lực. Hãy xem trước lại.")?;
        let effective = match selected_indices {
            Some(indices) => plan
                .filter_changes(&indices)
                .map_err(|err| err.to_string())?,
            None => plan,
        };
        let (outcome, undo_plan) = text_tools::apply(&effective).map_err(|err| err.to_string())?;
        let undo_rev = self.next_revision();
        self.text_undo = Some((undo_rev, undo_plan));
        Ok(TextResult {
            outcome,
            undo_revision: Some(undo_rev),
        })
    }

    pub fn undo_text_edit(&mut self, revision: u32) -> Result<TextResult, String> {
        let (_, plan) = self
            .text_undo
            .as_ref()
            .filter(|(id, _)| *id == revision)
            .ok_or("Lần sửa này không còn khả dụng để hoàn tác.")?;
        self.text_plan = None;
        let (outcome, _) = text_tools::apply(plan).map_err(|err| err.to_string())?;
        self.text_undo = None;
        Ok(TextResult {
            outcome,
            undo_revision: None,
        })
    }

    pub fn select_split_file(&mut self, file: PathBuf) -> Result<SplitSelection, String> {
        let metadata = fs::symlink_metadata(&file).map_err(|err| err.to_string())?;
        if !metadata.is_file() {
            return Err("Hãy chọn một tệp văn bản .txt hợp lệ.".into());
        }
        let is_txt = file
            .extension()
            .and_then(|ext| ext.to_str())
            .is_some_and(|ext| ext.eq_ignore_ascii_case("txt"));
        if !is_txt {
            return Err("Chỉ hỗ trợ chia tệp .txt.".into());
        }
        let canonical = file.canonicalize().map_err(|err| err.to_string())?;
        let stem = canonical
            .file_stem()
            .and_then(|s| s.to_str())
            .filter(|s| !s.is_empty())
            .unwrap_or("chapters");
        let default_dir = canonical
            .parent()
            .unwrap_or_else(|| Path::new("."))
            .join(format!("{stem}_split"));
        let file_label = file.display().to_string();
        let dir_label = default_dir.display().to_string();
        self.split_file = Some(canonical);
        self.split_output_dir = Some(default_dir);
        self.split_session = None;
        Ok(SplitSelection {
            file: file_label,
            output_dir: dir_label,
        })
    }

    pub fn select_split_output_dir(&mut self, folder: PathBuf) -> Result<String, String> {
        let canonical = folder.canonicalize().map_err(|err| err.to_string())?;
        if !canonical.is_dir() {
            return Err("Hãy chọn một thư mục xuất hợp lệ.".into());
        }
        let label = folder.display().to_string();
        self.split_output_dir = Some(canonical);
        Ok(label)
    }

    fn build_split_preview(
        revision: u32,
        session: &split::SplitSession,
        output_dir: &Path,
        preface_mode: split::PrefaceMode,
        name_format: &str,
    ) -> SplitPreview {
        let parts = session.summaries(preface_mode, name_format);
        let writable_count = parts.iter().filter(|p| !p.is_empty).count();
        SplitPreview {
            revision,
            output_dir: output_dir.display().to_string(),
            parts,
            writable_count,
            can_undo: session.can_undo(),
            can_redo: session.can_redo(),
        }
    }

    pub fn preview_split(&mut self, options: SplitOptions) -> Result<SplitPreview, String> {
        self.split_session = None;
        let file = self
            .split_file
            .as_ref()
            .ok_or("Hãy chọn tệp .txt cần chia trước.")?;
        if options.pattern.trim().is_empty() {
            return Err("Hãy nhập biểu thức regex để tìm điểm chia.".into());
        }
        let session = split::SplitSession::from_regex(
            file,
            OsStr::new(&options.pattern),
            Some(OsStr::new(&options.position)),
            self.interpreter.as_deref(),
        )
        .map_err(|err| err.to_string())?;
        let output_dir = self
            .split_output_dir
            .clone()
            .unwrap_or_else(|| session.default_output_dir());
        let revision = self.next_revision();
        let preview = Self::build_split_preview(
            revision,
            &session,
            &output_dir,
            options.preface_mode,
            &options.name_format,
        );
        self.split_session = Some((revision, session));
        Ok(preview)
    }

    fn current_split_output(&self, session: &split::SplitSession) -> PathBuf {
        self.split_output_dir
            .clone()
            .unwrap_or_else(|| session.default_output_dir())
    }

    pub fn refresh_split_view(
        &self,
        revision: u32,
        preface_mode: split::PrefaceMode,
        name_format: String,
    ) -> Result<SplitPreview, String> {
        let (_, session) = self
            .split_session
            .as_ref()
            .filter(|(id, _)| *id == revision)
            .ok_or("Phiên chia chương đã hết hiệu lực. Hãy xem trước lại.")?;
        let output_dir = self.current_split_output(session);
        Ok(Self::build_split_preview(
            revision,
            session,
            &output_dir,
            preface_mode,
            &name_format,
        ))
    }

    pub fn nudge_split_boundary(
        &mut self,
        revision: u32,
        boundary_index: usize,
        line_delta: isize,
        preface_mode: split::PrefaceMode,
        name_format: String,
    ) -> Result<SplitPreview, String> {
        let output_dir = self.split_output_dir.clone();
        let (_, session) = self
            .split_session
            .as_mut()
            .filter(|(id, _)| *id == revision)
            .ok_or("Phiên chia chương đã hết hiệu lực. Hãy xem trước lại.")?;
        session.nudge_boundary(boundary_index, line_delta)?;
        let dir = output_dir.unwrap_or_else(|| session.default_output_dir());
        Ok(Self::build_split_preview(
            revision,
            session,
            &dir,
            preface_mode,
            &name_format,
        ))
    }

    pub fn merge_split_boundary(
        &mut self,
        revision: u32,
        boundary_index: usize,
        preface_mode: split::PrefaceMode,
        name_format: String,
    ) -> Result<SplitPreview, String> {
        let output_dir = self.split_output_dir.clone();
        let (_, session) = self
            .split_session
            .as_mut()
            .filter(|(id, _)| *id == revision)
            .ok_or("Phiên chia chương đã hết hiệu lực. Hãy xem trước lại.")?;
        session.remove_boundary(boundary_index)?;
        let dir = output_dir.unwrap_or_else(|| session.default_output_dir());
        Ok(Self::build_split_preview(
            revision,
            session,
            &dir,
            preface_mode,
            &name_format,
        ))
    }

    pub fn rename_split_boundary(
        &mut self,
        revision: u32,
        boundary_index: usize,
        title: String,
        preface_mode: split::PrefaceMode,
        name_format: String,
    ) -> Result<SplitPreview, String> {
        let output_dir = self.split_output_dir.clone();
        let (_, session) = self
            .split_session
            .as_mut()
            .filter(|(id, _)| *id == revision)
            .ok_or("Phiên chia chương đã hết hiệu lực. Hãy xem trước lại.")?;
        session.rename_boundary(boundary_index, title)?;
        let dir = output_dir.unwrap_or_else(|| session.default_output_dir());
        Ok(Self::build_split_preview(
            revision,
            session,
            &dir,
            preface_mode,
            &name_format,
        ))
    }

    pub fn add_split_boundary(
        &mut self,
        revision: u32,
        start_byte: usize,
        title: Option<String>,
        preface_mode: split::PrefaceMode,
        name_format: String,
    ) -> Result<SplitPreview, String> {
        let output_dir = self.split_output_dir.clone();
        let (_, session) = self
            .split_session
            .as_mut()
            .filter(|(id, _)| *id == revision)
            .ok_or("Phiên chia chương đã hết hiệu lực. Hãy xem trước lại.")?;
        session.add_boundary(start_byte, title)?;
        let dir = output_dir.unwrap_or_else(|| session.default_output_dir());
        Ok(Self::build_split_preview(
            revision,
            session,
            &dir,
            preface_mode,
            &name_format,
        ))
    }

    pub fn undo_split(
        &mut self,
        revision: u32,
        preface_mode: split::PrefaceMode,
        name_format: String,
    ) -> Result<SplitPreview, String> {
        let output_dir = self.split_output_dir.clone();
        let (_, session) = self
            .split_session
            .as_mut()
            .filter(|(id, _)| *id == revision)
            .ok_or("Phiên chia chương đã hết hiệu lực. Hãy xem trước lại.")?;
        session.undo();
        let dir = output_dir.unwrap_or_else(|| session.default_output_dir());
        Ok(Self::build_split_preview(
            revision,
            session,
            &dir,
            preface_mode,
            &name_format,
        ))
    }

    pub fn redo_split(
        &mut self,
        revision: u32,
        preface_mode: split::PrefaceMode,
        name_format: String,
    ) -> Result<SplitPreview, String> {
        let output_dir = self.split_output_dir.clone();
        let (_, session) = self
            .split_session
            .as_mut()
            .filter(|(id, _)| *id == revision)
            .ok_or("Phiên chia chương đã hết hiệu lực. Hãy xem trước lại.")?;
        session.redo();
        let dir = output_dir.unwrap_or_else(|| session.default_output_dir());
        Ok(Self::build_split_preview(
            revision,
            session,
            &dir,
            preface_mode,
            &name_format,
        ))
    }

    pub fn search_split_text(
        &self,
        revision: u32,
        query: String,
    ) -> Result<Vec<split::SearchHit>, String> {
        let (_, session) = self
            .split_session
            .as_ref()
            .filter(|(id, _)| *id == revision)
            .ok_or("Phiên chia chương đã hết hiệu lực. Hãy xem trước lại.")?;
        Ok(session.search_lines(&query, 40))
    }

    pub fn apply_split(
        &mut self,
        revision: u32,
        preface_mode: split::PrefaceMode,
        name_format: String,
        overwrite: bool,
    ) -> Result<split::SplitOutcome, String> {
        let (_, session) = self
            .split_session
            .as_ref()
            .filter(|(id, _)| *id == revision)
            .ok_or("Phiên chia chương đã hết hiệu lực. Hãy xem trước lại.")?;
        let output_dir = self.current_split_output(session);
        session.execute(&output_dir, preface_mode, &name_format, overwrite)
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

    #[test]
    fn split_workspace_rejects_directories_and_enforces_revision() {
        let dir = tempfile::tempdir().unwrap();
        let fake_txt_dir = dir.path().join("folder.txt");
        fs::create_dir(&fake_txt_dir).unwrap();
        let mut workspace = Workspace::default();
        assert!(workspace.select_split_file(fake_txt_dir).is_err());

        let non_txt = dir.path().join("note.md");
        fs::write(&non_txt, "hello").unwrap();
        assert!(workspace.select_split_file(non_txt).is_err());

        let source = dir.path().join("book.txt");
        let text = "Mở đầu\n第1章 Một\nNội dung 1\n第2章 Hai\nNội dung 2";
        fs::write(&source, text).unwrap();
        let selected = workspace.select_split_file(source.clone()).unwrap();
        assert!(selected.output_dir.ends_with("book_split"));

        let session = split::SplitSession::from_file_points(
            &source.canonicalize().unwrap(),
            &[
                "Mở đầu\n".chars().count(),
                "Mở đầu\n第1章 Một\nNội dung 1\n".chars().count(),
            ],
        )
        .unwrap();
        let revision = workspace.next_revision();
        workspace.split_session = Some((revision, session));

        // Wrong revision is rejected
        assert!(
            workspace
                .refresh_split_view(
                    revision + 1,
                    split::PrefaceMode::Separate,
                    "c_{num}.txt".into(),
                )
                .is_err()
        );

        let merged = workspace
            .merge_split_boundary(
                revision,
                2,
                split::PrefaceMode::Separate,
                "c_{num}.txt".into(),
            )
            .unwrap();
        assert_eq!(merged.parts.len(), 2);
        assert!(merged.can_undo);

        let undone = workspace
            .undo_split(revision, split::PrefaceMode::Separate, "c_{num}.txt".into())
            .unwrap();
        assert_eq!(undone.parts.len(), 3);
        assert!(undone.can_redo);

        let outcome = workspace
            .apply_split(
                revision,
                split::PrefaceMode::Remove,
                "chuong_{num}.txt".into(),
                false,
            )
            .unwrap();
        assert_eq!(outcome.written, vec!["chuong_1.txt", "chuong_2.txt"]);
        assert!(outcome.failure.is_none());
    }
}
