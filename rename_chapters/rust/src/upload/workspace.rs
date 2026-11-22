use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::CoreError;
use crate::merge::{decode_text, inspect_folder};
use crate::upload::backup_zip::{
    export_job_recovery_zip, inspect_job_backup_zip, restore_job_backup_zip,
};
use crate::upload::model::{
    BookSummary, ChapterRef, JobMetadata, JobMode, JobStatus, ProgressSnapshot, UploadJob,
    UploadStage, VolumePlan, VolumeStatus, progress_snapshot, release_completed_files, retry_label,
    upload_issue,
};
use crate::upload::multipart::{CreditPosition, normalize_credit_text};
use crate::upload::objects::{
    MAX_CHAPTER_OBJECT_BYTES, ObjectStore, SweepResult, collect_referenced_ids, generate_object_id,
    sweep_unused_objects,
};
use crate::upload::policy::{
    pending_conflicts, suspend_restored, validate_prepared, validate_removal,
};
use crate::upload::protocol::{
    ChapterValidationInput, ChapterValidationReport, DEFAULT_WIKI_HOST, canonical_wiki_book_path,
    normalize_description, resolve_wiki_url, validate_chapters,
};
use crate::upload::reconcile::VerificationLedger;
use crate::upload::recovery::{RecoveryReport, build_recovery_plan};
use crate::upload::store::{CrashRecoveryReport, ScheduleRow, UploadStore};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannedChapter {
    pub filename: String,
    pub title: String,
    pub number: Option<i64>,
    pub bytes: u64,
    pub first_line: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderChapterScan {
    pub folder: String,
    pub chapters: Vec<ScannedChapter>,
    pub validation: ChapterValidationReport,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateJobInput {
    pub folder: String,
    pub mode: JobMode,
    pub account: String,
    #[serde(default)]
    pub title_vi: String,
    #[serde(default)]
    pub title_cn: String,
    #[serde(default)]
    pub author_cn: String,
    #[serde(default)]
    pub desc_vi: String,
    #[serde(default)]
    pub book_url: String,
    #[serde(default)]
    pub volume_name: String,
    #[serde(default)]
    pub volume_note: String,
    #[serde(default)]
    pub append: bool,
    #[serde(default)]
    pub credit_text: String,
    #[serde(default)]
    pub credit_position: CreditPosition,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobChapterView {
    pub id: String,
    pub title: String,
    pub number: Option<i64>,
    pub bytes: u64,
    pub available: bool,
    pub has_original: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobVolumeView {
    pub key: String,
    pub name: String,
    pub note: String,
    pub append: bool,
    pub remote_id: String,
    pub status: VolumeStatus,
    pub chapter_count: usize,
    pub chapter_ids: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobView {
    pub id: String,
    pub title: String,
    pub account: String,
    pub mode: JobMode,
    pub status: JobStatus,
    pub stage: UploadStage,
    pub book_id: String,
    pub book_url: String,
    pub published_url: Option<String>,
    pub error: String,
    pub verification_message: Option<String>,
    pub schedule_message: Option<String>,
    pub scheduled_at: Option<u64>,
    pub after_job_id: Option<String>,
    pub created_at: u64,
    pub completed_at: Option<u64>,
    pub write_attempted: bool,
    pub needs_reconcile: bool,
    pub files_released: bool,
    pub schedule_revision: u64,
    pub total_bytes: u64,
    pub chapter_count: usize,
    pub available_chapter_count: usize,
    pub progress: ProgressSnapshot,
    pub retry_label: Option<String>,
    pub upload_issue: Option<String>,
    pub pending_conflicts: Vec<String>,
    pub validation: ChapterValidationReport,
    pub volumes: Vec<JobVolumeView>,
    pub chapters: Vec<JobChapterView>,
    pub can_schedule: bool,
    pub schedule_block_reason: Option<String>,
    pub can_delete: bool,
    pub delete_block_reason: Option<String>,
    pub can_export_recovery: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageStats {
    pub object_files: usize,
    pub object_bytes: u64,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageCleanupReport {
    pub released_jobs: usize,
    pub swept: SweepResult,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadWorkspaceSnapshot {
    pub allowed_host: String,
    pub crash_recovery: CrashRecoveryReport,
    pub jobs: Vec<JobView>,
    pub schedules: Vec<ScheduleRow>,
    pub ledger_count: usize,
    pub storage: StorageStats,
}

fn strip_txt_extension(filename: &str) -> &str {
    filename
        .strip_suffix(".txt")
        .or_else(|| filename.strip_suffix(".TXT"))
        .unwrap_or(filename)
}

fn parse_first_digits_after(rest: &str) -> Option<i64> {
    let trimmed = rest.trim_start();
    let digits: String = trimmed.chars().take_while(char::is_ascii_digit).collect();
    if digits.is_empty() {
        None
    } else {
        digits.parse::<i64>().ok()
    }
}

/// Rút trích số chương từ tên file thuần Rust để kiểm tra thứ tự/thiếu chương trên Desktop & Android.
pub fn extract_chapter_number(stem: &str) -> Option<i64> {
    let trimmed = stem.trim();
    if trimmed.is_empty() {
        return None;
    }

    if let Some(pos) = trimmed.find('第')
        && let Some(num) = parse_first_digits_after(&trimmed[pos + '第'.len_utf8()..])
    {
        return Some(num);
    }

    let lower = trimmed.to_lowercase();
    for marker in ["chương", "chuong", "chapter", "ch."] {
        if let Some(byte_pos) = lower.find(marker) {
            let after = &trimmed[byte_pos..];
            if let Some(idx) = after.find(|c: char| c.is_ascii_digit())
                && let Some(num) = parse_first_digits_after(&after[idx..])
            {
                return Some(num);
            }
        }
    }

    let lead_digits: String = trimmed.chars().take_while(char::is_ascii_digit).collect();
    if !lead_digits.is_empty() {
        let rest = trimmed[lead_digits.len()..].trim_start();
        if rest.is_empty() || rest.starts_with(['-', '_', '.', ' ', '第']) {
            return lead_digits.parse::<i64>().ok();
        }
    }

    None
}

/// Facade dùng chung Desktop & Android để quản lý công việc upload, phục hồi sau crash và backup ZIP.
pub struct UploadWorkspace {
    store: UploadStore,
    objects: ObjectStore,
    ledger: VerificationLedger,
    allowed_host: String,
}

impl UploadWorkspace {
    pub fn new(workspace_dir: PathBuf) -> Self {
        Self {
            store: UploadStore::new(workspace_dir.clone()),
            objects: ObjectStore::new(workspace_dir.clone()),
            ledger: VerificationLedger::new(workspace_dir),
            allowed_host: DEFAULT_WIKI_HOST.to_owned(),
        }
    }

    pub fn with_allowed_host(mut self, allowed_host: impl Into<String>) -> Self {
        let host = allowed_host.into();
        self.store = UploadStore::new(self.store.directory().to_path_buf())
            .with_allowed_host(host.clone())
            .with_lease(std::sync::Arc::clone(self.store.lease()));
        self.allowed_host = host;
        self
    }

    pub fn store(&self) -> &UploadStore {
        &self.store
    }

    pub fn objects(&self) -> &ObjectStore {
        &self.objects
    }

    pub fn ledger(&self) -> &VerificationLedger {
        &self.ledger
    }

    pub fn allowed_host(&self) -> &str {
        &self.allowed_host
    }

    /// Quét thư mục chứa chương `.txt` theo thứ tự tự nhiên và kiểm tra trước điều kiện upload.
    pub fn inspect_chapter_folder(folder: &Path) -> Result<FolderChapterScan, CoreError> {
        let inspection = inspect_folder(folder)?;
        let mut chapters = Vec::with_capacity(inspection.entries.len());
        let mut inputs = Vec::with_capacity(inspection.entries.len());

        for entry in inspection.entries {
            let title = strip_txt_extension(&entry.filename).trim().to_owned();
            let number = extract_chapter_number(&title);
            inputs.push(ChapterValidationInput {
                id: entry.filename.clone(),
                title: title.clone(),
                number,
                bytes: entry.size,
            });
            chapters.push(ScannedChapter {
                filename: entry.filename,
                title,
                number,
                bytes: entry.size,
                first_line: entry.first_line,
            });
        }

        let validation = validate_chapters(&inputs);
        Ok(FolderChapterScan {
            folder: inspection.folder,
            chapters,
            validation,
        })
    }

    /// Chạy phục hồi sau crash trước khi dựng snapshot trạng thái toàn bộ workspace upload.
    pub fn snapshot(&self) -> Result<UploadWorkspaceSnapshot, CoreError> {
        let crash_recovery = self.store.recover_after_crash()?;
        self.build_snapshot_with_recovery(crash_recovery)
    }

    fn build_snapshot_with_recovery(
        &self,
        crash_recovery: CrashRecoveryReport,
    ) -> Result<UploadWorkspaceSnapshot, CoreError> {
        let jobs = self.store.load_jobs()?;
        let schedules = self.store.load_schedules()?;
        let ledger_count = self.ledger.records()?.len();
        let active_owner = self.store.lease().current();

        let mut views: Vec<JobView> = jobs
            .iter()
            .map(|job| self.build_job_view(job, &jobs, &schedules, active_owner.as_deref()))
            .collect();
        views.sort_by(|a, b| {
            b.created_at
                .cmp(&a.created_at)
                .then_with(|| b.id.cmp(&a.id))
        });

        let storage = self.measure_storage()?;
        Ok(UploadWorkspaceSnapshot {
            allowed_host: self.allowed_host.clone(),
            crash_recovery,
            jobs: views,
            schedules,
            ledger_count,
            storage,
        })
    }

    fn measure_storage(&self) -> Result<StorageStats, CoreError> {
        let dir = self.objects.objects_dir();
        if !dir.is_dir() {
            return Ok(StorageStats::default());
        }
        let mut stats = StorageStats::default();
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let meta = fs::symlink_metadata(entry.path())?;
            if meta.is_file() {
                stats.object_files += 1;
                stats.object_bytes = stats.object_bytes.saturating_add(meta.len());
            }
        }
        Ok(stats)
    }

    fn build_job_view(
        &self,
        job: &UploadJob,
        all_jobs: &[UploadJob],
        schedules: &[ScheduleRow],
        active_owner: Option<&str>,
    ) -> JobView {
        let progress = progress_snapshot(job);
        let issue = upload_issue(job);
        let retry = retry_label(job).map(str::to_owned);
        let mut conflicts: Vec<String> = pending_conflicts(job, all_jobs, &self.allowed_host)
            .into_iter()
            .collect();
        conflicts.sort();

        let (can_schedule, schedule_block_reason) = match validate_prepared(job, &self.allowed_host)
        {
            Ok(_) => (true, None),
            Err(err) => (false, Some(err.to_string())),
        };

        let delete_block_reason = if active_owner == Some(&format!("scheduled:{}", job.id)) {
            Some("Công việc đang chạy, hãy dừng trước khi xóa.".to_owned())
        } else if schedules.iter().any(|row| row.id == job.id && row.running) {
            Some("Công việc đã bắt đầu. Chờ gửi và đối chiếu xong.".to_owned())
        } else {
            let remaining: Vec<UploadJob> = all_jobs
                .iter()
                .filter(|other| other.id != job.id)
                .cloned()
                .collect();
            validate_removal(all_jobs, &remaining)
                .err()
                .map(|err| err.to_string())
        };
        let can_delete = delete_block_reason.is_none();

        let pinned = job.chapters.as_deref().unwrap_or(&[]);
        let mut chapters = Vec::with_capacity(pinned.len());
        let mut val_inputs = Vec::with_capacity(pinned.len());
        let mut available_chapter_count = 0usize;
        let mut total_bytes = 0u64;

        for ch in pinned {
            let available = self.objects.exists(&ch.id);
            if available {
                available_chapter_count += 1;
            }
            total_bytes = total_bytes.saturating_add(ch.bytes);
            val_inputs.push(ChapterValidationInput {
                id: ch.id.clone(),
                title: ch.title.clone(),
                number: ch.number,
                bytes: ch.bytes,
            });
            chapters.push(JobChapterView {
                id: ch.id.clone(),
                title: ch.title.clone(),
                number: ch.number,
                bytes: ch.bytes,
                available,
                has_original: ch.original_id.is_some(),
            });
        }

        let validation = if pinned.is_empty() {
            ChapterValidationReport {
                errors: Vec::new(),
                warnings: Vec::new(),
                bytes: 0,
            }
        } else {
            validate_chapters(&val_inputs)
        };

        let chapter_count = if !pinned.is_empty() {
            pinned.len()
        } else {
            job.volumes.iter().map(|v| v.chapter_ids.len()).sum()
        };

        let volumes = job
            .volumes
            .iter()
            .map(|vol| JobVolumeView {
                key: vol.key.clone(),
                name: vol.name.clone(),
                note: vol.note.clone(),
                append: vol.append,
                remote_id: vol.remote_id.clone(),
                status: vol.status,
                chapter_count: vol.chapter_ids.len(),
                chapter_ids: vol.chapter_ids.clone(),
            })
            .collect();

        JobView {
            id: job.id.clone(),
            title: job.display_title().to_owned(),
            account: job.account.clone(),
            mode: job.mode,
            status: job.status,
            stage: job.stage,
            book_id: job.book_id.clone(),
            book_url: job.effective_book_url().to_owned(),
            published_url: job.published_url.clone(),
            error: job.error.clone(),
            verification_message: job.verification_message.clone(),
            schedule_message: job.schedule_message.clone(),
            scheduled_at: job.scheduled_at,
            after_job_id: job.after_job_id.clone(),
            created_at: job.created_at,
            completed_at: job.completed_at,
            write_attempted: job.write_attempted,
            needs_reconcile: job.needs_reconcile,
            files_released: job.files_released,
            schedule_revision: job.schedule_revision,
            total_bytes,
            chapter_count,
            available_chapter_count,
            progress,
            retry_label: retry,
            upload_issue: issue,
            pending_conflicts: conflicts,
            validation,
            volumes,
            chapters,
            can_schedule,
            schedule_block_reason,
            can_delete,
            delete_block_reason,
            can_export_recovery: !job.volumes.is_empty() || !job.metadata.fields.is_empty(),
        }
    }

    fn rollback_objects(&self, ids: &[String]) {
        for id in ids {
            let _ = self.objects.delete(id);
        }
    }

    /// Tạo công việc upload `Planned` từ thư mục `.txt`, sao chép bất biến vào `ObjectStore` mà không sửa file gốc.
    pub fn create_planned_job(
        &self,
        input: CreateJobInput,
        now_ms: u64,
    ) -> Result<UploadJob, CoreError> {
        let account = input.account.trim().to_owned();
        if account.is_empty() {
            return Err("Hãy nhập tên tài khoản hoặc hồ sơ quản lý.".into());
        }
        let folder = input.folder.trim();
        if folder.is_empty() {
            return Err("Hãy chọn thư mục chứa các tệp chương .txt.".into());
        }

        let title_vi = input.title_vi.trim().to_owned();
        let title_cn = input.title_cn.trim().to_owned();
        let author_cn = input.author_cn.trim().to_owned();
        let desc_vi = normalize_description(input.desc_vi.trim());

        let (book_url, book_summary) = match input.mode {
            JobMode::Existing => {
                canonical_wiki_book_path(&input.book_url, &self.allowed_host)?;
                let canonical = resolve_wiki_url(&input.book_url, &self.allowed_host)?;
                let summary_title = if !title_vi.is_empty() {
                    title_vi.clone()
                } else {
                    canonical.clone()
                };
                (
                    canonical.clone(),
                    Some(BookSummary {
                        id: String::new(),
                        title: summary_title,
                        url: canonical,
                    }),
                )
            }
            JobMode::New => {
                if title_vi.is_empty() && title_cn.is_empty() {
                    return Err(
                        "Truyện mới cần nhập tên truyện (tiếng Việt hoặc tiếng Trung).".into(),
                    );
                }
                (String::new(), None)
            }
        };

        let folder_path = Path::new(folder);
        let scan = Self::inspect_chapter_folder(folder_path)?;
        if scan.chapters.is_empty() {
            return Err("Thư mục chưa có tệp .txt hợp lệ nào.".into());
        }

        let mut raw_ids = Vec::with_capacity(scan.chapters.len());
        let mut raw_chapters = Vec::with_capacity(scan.chapters.len());
        let ingest_res: Result<(), CoreError> = (|| {
            for item in &scan.chapters {
                let raw_bytes = fs::read(folder_path.join(&item.filename))?;
                let decoded = decode_text(&raw_bytes)?;
                if decoded.len() > MAX_CHAPTER_OBJECT_BYTES {
                    return Err(format!("Chương «{}» vượt 2 MB.", item.title).into());
                }
                let id = generate_object_id("ch");
                let bytes = self.objects.put_utf8(&id, &decoded)?;
                raw_ids.push(id.clone());
                raw_chapters.push(ChapterRef {
                    id,
                    title: item.title.clone(),
                    number: item.number,
                    bytes,
                    source_file: None,
                    original_id: None,
                });
            }
            Ok(())
        })();

        if let Err(err) = ingest_res {
            self.rollback_objects(&raw_ids);
            return Err(err);
        }

        let credit_active = !normalize_credit_text(&input.credit_text).is_empty();
        let (final_chapters, cloned_ids) = if credit_active {
            match self.objects.clone_chapters_for_upload(
                &raw_chapters,
                &input.credit_text,
                input.credit_position,
                true,
            ) {
                Ok(cloned) => {
                    let ids: Vec<String> = cloned.iter().map(|c| c.id.clone()).collect();
                    (cloned, ids)
                }
                Err(err) => {
                    self.rollback_objects(&raw_ids);
                    return Err(err);
                }
            }
        } else {
            (raw_chapters, Vec::new())
        };

        let val_inputs: Vec<ChapterValidationInput> = final_chapters
            .iter()
            .map(|c| ChapterValidationInput {
                id: c.id.clone(),
                title: c.title.clone(),
                number: c.number,
                bytes: c.bytes,
            })
            .collect();
        let validation = validate_chapters(&val_inputs);
        if !validation.errors.is_empty() {
            self.rollback_objects(&cloned_ids);
            self.rollback_objects(&raw_ids);
            return Err(validation.errors.join("\n").into());
        }

        let mut fields = Vec::new();
        if !title_vi.is_empty() {
            fields.push(("titleVi".to_owned(), title_vi.clone()));
        }
        if !title_cn.is_empty() {
            fields.push(("titleCn".to_owned(), title_cn));
        }
        if !author_cn.is_empty() {
            fields.push(("authorCn".to_owned(), author_cn));
        }
        if !desc_vi.is_empty() {
            fields.push(("descVi".to_owned(), desc_vi));
        }

        let volume_name = {
            let name = input.volume_name.trim();
            if name.is_empty() {
                "Chính văn".to_owned()
            } else {
                name.to_owned()
            }
        };
        let chapter_ids: Vec<String> = final_chapters.iter().map(|c| c.id.clone()).collect();
        let job = UploadJob {
            id: generate_object_id("job"),
            account,
            mode: input.mode,
            status: JobStatus::Planned,
            stage: UploadStage::Prepare,
            book_url,
            book_title: title_vi,
            book: book_summary,
            created_at: now_ms,
            cleanup_chosen_at: Some(now_ms),
            metadata: JobMetadata {
                fields,
                ..Default::default()
            },
            chapters: Some(final_chapters),
            volumes: vec![VolumePlan {
                key: generate_object_id("vol"),
                name: volume_name,
                note: input.volume_note.trim().to_owned(),
                append: input.append,
                can_append: input.append,
                status: VolumeStatus::Planned,
                chapter_ids,
                ..Default::default()
            }],
            ..Default::default()
        };

        match self.store.upsert_job(job) {
            Ok(saved) => Ok(saved),
            Err(err) => {
                self.rollback_objects(&cloned_ids);
                self.rollback_objects(&raw_ids);
                Err(err)
            }
        }
    }

    pub fn schedule_job(
        &self,
        id: &str,
        at_ms: u64,
        now_ms: u64,
        allow_duplicate: bool,
    ) -> Result<UploadJob, CoreError> {
        self.store.schedule_job(id, at_ms, now_ms, allow_duplicate)
    }

    pub fn link_job(
        &self,
        id: &str,
        parent_id: &str,
        now_ms: u64,
        allow_duplicate: bool,
    ) -> Result<UploadJob, CoreError> {
        self.store.link_job(id, parent_id, now_ms, allow_duplicate)
    }

    pub fn cancel_schedule(&self, id: &str) -> Result<Vec<UploadJob>, CoreError> {
        let mut ids = HashSet::new();
        ids.insert(id.to_owned());
        self.store.cancel_schedules(&ids)
    }

    pub fn delete_job(&self, id: &str) -> Result<Vec<UploadJob>, CoreError> {
        self.store.remove_job(id)
    }

    pub fn preview_recovery(&self, id: &str) -> Result<RecoveryReport, CoreError> {
        let job = self
            .store
            .load_jobs()?
            .into_iter()
            .find(|item| item.id == id)
            .ok_or("Công việc không tồn tại.")?;
        let plan = build_recovery_plan(&job, &[], |obj_id| self.objects.exists(obj_id));
        Ok(plan.report)
    }

    pub fn export_recovery_zip(
        &self,
        id: &str,
        output_path: &Path,
    ) -> Result<RecoveryReport, CoreError> {
        let job = self
            .store
            .load_jobs()?
            .into_iter()
            .find(|item| item.id == id)
            .ok_or("Công việc không tồn tại.")?;
        let plan = build_recovery_plan(&job, &[], |obj_id| self.objects.exists(obj_id));
        export_job_recovery_zip(output_path, &plan, &self.objects)?;
        Ok(plan.report)
    }

    pub fn inspect_backup_zip(&self, zip_path: &Path) -> Result<RecoveryReport, CoreError> {
        inspect_job_backup_zip(zip_path, &self.allowed_host)
    }

    /// Khôi phục một job từ ZIP sao lưu về trạng thái `Planned`, tuyệt đối không kích hoạt hẹn gửi ngầm.
    pub fn restore_backup_zip(
        &self,
        zip_path: &Path,
        account: &str,
        now_ms: u64,
    ) -> Result<UploadJob, CoreError> {
        let clean_account = account.trim();
        if clean_account.is_empty() {
            return Err("Hãy nhập tên tài khoản nhận công việc khôi phục.".into());
        }
        let restored = restore_job_backup_zip(zip_path, &self.objects, &self.allowed_host)?;
        let restored_ids: Vec<String> = restored.chapters.iter().map(|c| c.id.clone()).collect();

        let metadata = JobMetadata {
            fields: restored.report.metadata.fields.clone(),
            selected_labels: restored.report.metadata.selected_labels.clone(),
            book_id: (!restored.report.book_id.is_empty()).then(|| restored.report.book_id.clone()),
            ..Default::default()
        };
        let mut job = UploadJob {
            id: generate_object_id("job"),
            account: clean_account.to_owned(),
            mode: restored.report.mode,
            status: JobStatus::Planned,
            stage: UploadStage::Prepare,
            book_id: restored.report.book_id.clone(),
            book_url: restored.report.book_url.clone(),
            book_title: restored.report.title.clone(),
            book: (!restored.report.book_url.is_empty()).then(|| BookSummary {
                id: restored.report.book_id.clone(),
                title: restored.report.title.clone(),
                url: restored.report.book_url.clone(),
            }),
            created_at: now_ms,
            cleanup_chosen_at: Some(now_ms),
            metadata,
            chapters: Some(restored.chapters),
            volumes: restored.volumes,
            ..Default::default()
        };
        suspend_restored(&mut job);

        match self.store.upsert_job(job) {
            Ok(saved) => Ok(saved),
            Err(err) => {
                self.rollback_objects(&restored_ids);
                Err(err)
            }
        }
    }

    /// Giải phóng payload của các job hoàn tất cũ (> 2 job / 8 MiB) rồi quét object mồ côi đã quá thời hạn.
    pub fn cleanup_storage(
        &self,
        now_ms: u64,
        minimum_age_ms: u64,
    ) -> Result<StorageCleanupReport, CoreError> {
        let mut jobs = self.store.load_jobs()?;
        let released_jobs = release_completed_files(&mut jobs);
        if released_jobs > 0 {
            self.store.save_jobs(jobs.clone())?;
        }
        let referenced = collect_referenced_ids(&jobs, None);
        let swept = sweep_unused_objects(
            &self.objects.objects_dir(),
            &referenced,
            now_ms,
            minimum_age_ms,
        )?;
        Ok(StorageCleanupReport {
            released_jobs,
            swept,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::upload::protocol::DEFAULT_WIKI_HOST;
    use tempfile::tempdir;

    fn write_chapter_file(dir: &Path, name: &str, body: &str) {
        fs::write(dir.join(name), body.as_bytes()).expect("write chapter");
    }

    fn new_book_input(folder: &Path) -> CreateJobInput {
        CreateJobInput {
            folder: folder.display().to_string(),
            mode: JobMode::New,
            account: "tester".into(),
            title_vi: "Truyện Thử Nghiệm".into(),
            title_cn: "测试小说".into(),
            author_cn: "测试作者".into(),
            desc_vi: "Dòng 1\nDòng 2".into(),
            book_url: String::new(),
            volume_name: "Quyển 1".into(),
            volume_note: String::new(),
            append: false,
            credit_text: "Nguon test".into(),
            credit_position: CreditPosition::End,
        }
    }

    #[test]
    fn folder_scan_extracts_numbers_orders_naturally_and_detects_gaps() {
        let dir = tempdir().expect("tempdir");
        write_chapter_file(
            dir.path(),
            "004-Chương 4 Kết thúc.txt",
            "Chương 4\nNội dung 4",
        );
        write_chapter_file(dir.path(), "001-第1章 Khởi đầu.txt", "第1章\nNội dung 1");
        write_chapter_file(dir.path(), "002-Ch.2 Tiếp theo.txt", "Ch.2\nNội dung 2");

        let scan = UploadWorkspace::inspect_chapter_folder(dir.path()).expect("scan");
        let names: Vec<&str> = scan.chapters.iter().map(|c| c.filename.as_str()).collect();
        assert_eq!(
            names,
            [
                "001-第1章 Khởi đầu.txt",
                "002-Ch.2 Tiếp theo.txt",
                "004-Chương 4 Kết thúc.txt"
            ]
        );
        let nums: Vec<Option<i64>> = scan.chapters.iter().map(|c| c.number).collect();
        assert_eq!(nums, [Some(1), Some(2), Some(4)]);
        assert!(scan.validation.errors.is_empty());
        assert_eq!(scan.validation.warnings, ["Thiếu chương 3–3."]);
    }

    #[test]
    fn create_planned_job_preserves_sources_and_rolls_back_on_validation_error() {
        let root = tempdir().expect("root");
        let src = root.path().join("src_ok");
        fs::create_dir(&src).expect("mkdir");
        let raw_ch1 = "Chương 1 Mở đầu";
        write_chapter_file(&src, "001-第1章.txt", raw_ch1);
        write_chapter_file(&src, "002-第2章.txt", "Chương 2 Nội dung");

        let ws = UploadWorkspace::new(root.path().join("ws"));
        let job = ws
            .create_planned_job(new_book_input(&src), 1_000)
            .expect("create ok");
        assert_eq!(job.status, JobStatus::Planned);
        assert_eq!(job.chapters.as_ref().expect("chs").len(), 2);
        // Nguồn trên đĩa không bị sửa, object upload có credit và original_id được bảo toàn.
        assert_eq!(
            fs::read_to_string(src.join("001-第1章.txt")).expect("read"),
            raw_ch1
        );
        let ch0 = &job.chapters.as_ref().expect("chs")[0];
        assert!(ch0.original_id.is_some());
        let prepared = ws.objects().read_utf8(&ch0.id).expect("read obj");
        assert!(prepared.contains("Nguon test"));

        // Thư mục có file > 100 KB phải bị từ chối và không để lại object mồ côi.
        let bad_ws = UploadWorkspace::new(root.path().join("bad_ws"));
        let bad_src = root.path().join("src_bad");
        fs::create_dir(&bad_src).expect("mkdir");
        write_chapter_file(&bad_src, "001-第1章.txt", "Hợp lệ");
        write_chapter_file(&bad_src, "002-第2章.txt", &"A".repeat(102_500));
        assert!(
            bad_ws
                .create_planned_job(new_book_input(&bad_src), 2_000)
                .is_err()
        );
        let bad_snap = bad_ws.snapshot().expect("snap");
        assert!(bad_snap.jobs.is_empty());
        assert_eq!(bad_snap.storage.object_files, 0);
    }

    #[test]
    fn snapshot_recovers_crashes_enforces_conflicts_links_and_zip_backup_restore() {
        let root = tempdir().expect("root");
        let src = root.path().join("chapters");
        fs::create_dir(&src).expect("mkdir");
        write_chapter_file(&src, "001-第1章.txt", "Nội dung 1");
        write_chapter_file(&src, "002-第2章.txt", "Nội dung 2");

        let ws = UploadWorkspace::new(root.path().join("ws")).with_allowed_host(DEFAULT_WIKI_HOST);
        let job1 = ws
            .create_planned_job(new_book_input(&src), 10_000)
            .expect("job1");
        let job2 = ws
            .create_planned_job(new_book_input(&src), 11_000)
            .expect("job2");

        // Hẹn giờ job1 -> trùng identity phải chặn job2 trừ khi allow_duplicate = true.
        ws.schedule_job(&job1.id, 120_000, 20_000, false)
            .expect("schedule job1");
        assert!(ws.schedule_job(&job2.id, 180_000, 20_000, false).is_err());

        // Liên kết job2 sau job1 -> chặn xóa job1.
        ws.link_job(&job2.id, &job1.id, 25_000, true)
            .expect("link job2");
        let snap_linked = ws.snapshot().expect("snap linked");
        let j1_view = snap_linked
            .jobs
            .iter()
            .find(|j| j.id == job1.id)
            .expect("j1");
        assert!(!j1_view.can_delete);
        assert!(ws.delete_job(&job1.id).is_err());

        // Hủy liên kết job2, giả lập crash khi job1 đang Sending với write_attempted = true.
        ws.cancel_schedule(&job2.id).expect("cancel job2");
        ws.store()
            .update_job(&job1.id, |j| {
                j.status = JobStatus::Sending;
                j.stage = UploadStage::Upload;
                j.write_attempted = true;
                Ok(())
            })
            .expect("mark sending");

        let snap_crash = ws.snapshot().expect("snap crash");
        assert_eq!(
            snap_crash.crash_recovery.uncertain_ids,
            vec![job1.id.clone()]
        );
        let recovered = snap_crash
            .jobs
            .iter()
            .find(|j| j.id == job1.id)
            .expect("j1");
        assert_eq!(recovered.status, JobStatus::Uncertain);
        assert!(!recovered.can_schedule);
        assert!(recovered.needs_reconcile);

        // Xuất recovery ZIP từ job2 rồi khôi phục sang job mới ở trạng thái Planned an toàn.
        let zip_path = root.path().join("backup.zip");
        let exported = ws.export_recovery_zip(&job2.id, &zip_path).expect("export");
        assert_eq!(exported.available_chapters, 2);
        let inspected = ws.inspect_backup_zip(&zip_path).expect("inspect zip");
        assert_eq!(inspected.title, "Truyện Thử Nghiệm");

        let restored = ws
            .restore_backup_zip(&zip_path, "restored-user", 50_000)
            .expect("restore");
        assert_eq!(restored.status, JobStatus::Planned);
        assert_eq!(restored.account, "restored-user");
        assert!(restored.scheduled_at.is_none());

        // Dọn dẹp sau khi xóa job đã hủy lịch.
        ws.delete_job(&job2.id).expect("delete job2");
        let orphan_id = generate_object_id("orphan");
        ws.objects()
            .put_utf8(&orphan_id, "rác")
            .expect("put orphan");
        let cleanup = ws.cleanup_storage(u64::MAX / 2, 0).expect("cleanup");
        assert!(cleanup.swept.files >= 1);
        assert!(!ws.objects().exists(&orphan_id));
    }
}
