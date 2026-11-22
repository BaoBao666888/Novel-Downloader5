use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::upload::protocol::{MetadataCoverInput, MetadataModelInput, MetadataOptionInput};

pub const UPLOAD_SCHEMA_VERSION: u32 = 1;
pub const COMPLETED_FILE_BUDGET_BYTES: u64 = 8 * 1024 * 1024;
pub const COMPLETED_KEEP_COUNT: usize = 2;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum JobMode {
    #[default]
    New,
    Existing,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum JobStatus {
    #[default]
    Planned,
    Scheduled,
    Linked,
    Queued,
    Running,
    Sending,
    Verifying,
    Waiting,
    Uncertain,
    Failed,
    Complete,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum UploadStage {
    #[default]
    Prepare,
    Authorize,
    History,
    CreateVolume,
    Upload,
    Publish,
    Verify,
    VerifyWait,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum VolumeStatus {
    #[default]
    Planned,
    Created,
    Uploaded,
    Verified,
}

impl VolumeStatus {
    pub fn is_uploaded(self) -> bool {
        matches!(self, Self::Uploaded | Self::Verified)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ServerState {
    Processing,
    Partial,
    Checking,
    Locating,
    Connection,
    Resume,
    Review,
    Complete,
}

pub fn stage_label(stage: UploadStage) -> &'static str {
    match stage {
        UploadStage::Prepare => "Chuẩn bị",
        UploadStage::Authorize => "Kiểm tra",
        UploadStage::History => "Kiểm tra lịch sử",
        UploadStage::CreateVolume => "Tạo quyển",
        UploadStage::Upload => "Tải chương lên",
        UploadStage::Publish => "Đăng truyện",
        UploadStage::Verify => "Đối chiếu",
        UploadStage::VerifyWait => "Chờ đối chiếu",
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldOption {
    #[serde(default)]
    pub value: String,
    #[serde(default)]
    pub label: String,
    #[serde(default)]
    pub required: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoverFileRef {
    pub id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub mime: String,
    #[serde(default)]
    pub bytes: u64,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobMetadata {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(default)]
    pub fields: Vec<(String, String)>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cover_file: Option<CoverFileRef>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub book_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cover_url: Option<String>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub selected_labels: BTreeMap<String, Vec<FieldOption>>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub options: BTreeMap<String, Vec<FieldOption>>,
    #[serde(flatten, default, skip_serializing_if = "BTreeMap::is_empty")]
    pub extra: BTreeMap<String, serde_json::Value>,
}

impl JobMetadata {
    pub fn to_protocol_input(&self) -> MetadataModelInput {
        let mut options = BTreeMap::new();
        for (group, list) in &self.options {
            options.insert(
                group.clone(),
                list.iter()
                    .map(|opt| MetadataOptionInput {
                        value: opt.value.clone(),
                        label: opt.label.clone(),
                        required: opt.required,
                    })
                    .collect(),
            );
        }
        MetadataModelInput {
            fields: self.fields.clone(),
            options,
            cover_file: self.cover_file.as_ref().map(|cover| MetadataCoverInput {
                id: cover.id.clone(),
                name: cover.name.clone(),
                mime: cover.mime.clone(),
            }),
            cover_url: self.cover_url.clone().unwrap_or_default(),
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryBaseline {
    pub total: i64,
    #[serde(default)]
    pub rows: Vec<serde_json::Value>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferProgress {
    #[serde(default)]
    pub job_id: String,
    #[serde(default)]
    pub bytes: u64,
    #[serde(default)]
    pub total: u64,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookSummary {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub url: String,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChapterRef {
    pub id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub number: Option<i64>,
    #[serde(default)]
    pub bytes: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_file: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub original_id: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VolumePlan {
    pub key: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub note: String,
    #[serde(default)]
    pub append: bool,
    #[serde(default)]
    pub can_append: bool,
    #[serde(default)]
    pub remote_id: String,
    #[serde(default)]
    pub status: VolumeStatus,
    #[serde(default)]
    pub chapter_ids: Vec<String>,
    #[serde(default)]
    pub create_attempted_at: u64,
    #[serde(default)]
    pub upload_attempted_at: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub history_before: Option<HistoryBaseline>,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadJob {
    pub id: String,
    #[serde(default)]
    pub account: String,
    #[serde(default)]
    pub mode: JobMode,
    #[serde(default)]
    pub status: JobStatus,
    #[serde(default)]
    pub stage: UploadStage,
    #[serde(default)]
    pub book_id: String,
    #[serde(default)]
    pub book_url: String,
    #[serde(default)]
    pub book_title: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub book: Option<BookSummary>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub baseline_book: Option<BookSummary>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub published_url: Option<String>,
    #[serde(default)]
    pub publish_accepted: bool,
    #[serde(default)]
    pub write_attempted: bool,
    #[serde(default)]
    pub needs_reconcile: bool,
    #[serde(default)]
    pub rejected: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub active_volume: Option<String>,
    #[serde(default)]
    pub error: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub last_upload_error: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failed_stage: Option<UploadStage>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub verification_message: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub server_state: Option<ServerState>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub server_chapter_count: Option<usize>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub baseline_count: Option<usize>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub baseline: Vec<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub combined_expected_count: Option<usize>,
    #[serde(default)]
    pub created_at: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub started_at: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub uploaded_at: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<u64>,
    #[serde(default)]
    pub publish_attempted_at: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub scheduled_at: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub schedule_started_at: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub linked_at: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cleanup_chosen_at: Option<u64>,
    #[serde(default)]
    pub schedule_revision: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub after_job_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub schedule_identity: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub schedule_message: Option<String>,
    #[serde(default)]
    pub background_upload: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub next_verify_at: Option<u64>,
    #[serde(default)]
    pub verify_attempt: u32,
    #[serde(default)]
    pub files_released: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub transfer: Option<TransferProgress>,
    #[serde(default)]
    pub metadata: JobMetadata,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub chapters: Option<Vec<ChapterRef>>,
    #[serde(default)]
    pub volumes: Vec<VolumePlan>,
}

impl UploadJob {
    pub fn effective_book_url(&self) -> &str {
        if !self.book_url.is_empty() {
            return &self.book_url;
        }
        self.book.as_ref().map_or("", |b| b.url.as_str())
    }

    pub fn effective_book_title(&self) -> &str {
        if !self.book_title.is_empty() {
            return &self.book_title;
        }
        if let Some(title) = self
            .book
            .as_ref()
            .map(|b| b.title.as_str())
            .filter(|t| !t.is_empty())
        {
            return title;
        }
        self.baseline_book.as_ref().map_or("", |b| b.title.as_str())
    }

    pub fn display_title(&self) -> &str {
        if let Some(title) = self
            .metadata
            .fields
            .iter()
            .find(|(key, value)| key == "titleVi" && !value.is_empty())
            .map(|(_, value)| value.as_str())
        {
            return title;
        }
        let book = self.effective_book_title();
        if !book.is_empty() {
            return book;
        }
        "Upload truyện"
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressSnapshot {
    pub id: String,
    pub title: String,
    pub status: JobStatus,
    pub active: bool,
    pub phase: String,
    pub detail: String,
    pub error: String,
    pub done: usize,
    pub max: usize,
    pub percent: u8,
}

pub fn expected_count(job: &UploadJob) -> usize {
    let baseline = job.baseline_count.unwrap_or(job.baseline.len());
    let uploaded: usize = job.volumes.iter().map(|v| v.chapter_ids.len()).sum();
    baseline
        .saturating_add(uploaded)
        .max(job.combined_expected_count.unwrap_or(0))
}

pub fn format_status_message(mode: JobMode, value: &str) -> String {
    if mode == JobMode::Existing {
        value.replace("Đã tải file và nhúng thành công.", "Đã tải file.")
    } else {
        value.to_owned()
    }
}

pub fn upload_issue(job: &UploadJob) -> Option<String> {
    if !matches!(
        job.status,
        JobStatus::Waiting | JobStatus::Uncertain | JobStatus::Failed
    ) {
        return None;
    }
    let last_err = job.last_upload_error.as_deref().filter(|s| !s.is_empty())?;
    let all_uploaded = job.volumes.iter().all(|v| v.status.is_uploaded());
    let publish_done = job.mode != JobMode::New
        || job.publish_accepted
        || job.published_url.as_deref().is_some_and(|s| !s.is_empty());
    if all_uploaded && publish_done {
        return None;
    }
    let stage = job.failed_stage.map(stage_label).unwrap_or("Tải lên");
    Some(format!("{stage} bị gián đoạn. {last_err}"))
}

pub fn retry_label(job: &UploadJob) -> Option<&'static str> {
    if job.status == JobStatus::Planned {
        return Some("Tiếp tục");
    }
    if job.status == JobStatus::Failed {
        return Some("Thử lại");
    }
    let pending = job.volumes.iter().any(|v| !v.status.is_uploaded());
    if job.status == JobStatus::Waiting
        && job.mode == JobMode::Existing
        && pending
        && job.failed_stage == Some(UploadStage::Upload)
        && job
            .last_upload_error
            .as_deref()
            .is_some_and(|s| !s.is_empty())
    {
        return Some("Thử lại");
    }
    let publish_missing = job.mode == JobMode::New
        && !job.publish_accepted
        && job.published_url.as_deref().is_none_or(str::is_empty);
    if job.status == JobStatus::Uncertain && (pending || publish_missing) {
        return Some(if job.server_state == Some(ServerState::Resume) {
            "Tiếp tục"
        } else {
            "Thử lại"
        });
    }
    None
}

pub fn progress_snapshot(job: &UploadJob) -> ProgressSnapshot {
    let chapters: usize = job.volumes.iter().map(|v| v.chapter_ids.len()).sum();
    let sent: usize = job
        .volumes
        .iter()
        .filter(|v| v.status.is_uploaded())
        .map(|v| v.chapter_ids.len())
        .sum();
    let uploaded_volumes = job
        .volumes
        .iter()
        .filter(|v| v.status.is_uploaded())
        .count();
    let complete = job.status == JobStatus::Complete;
    let active = matches!(
        job.status,
        JobStatus::Running | JobStatus::Sending | JobStatus::Verifying
    );
    let max = chapters + job.volumes.len() + 2 + usize::from(job.mode == JobMode::New);
    let done_raw = usize::from(!matches!(
        job.stage,
        UploadStage::Prepare | UploadStage::Authorize
    )) + job
        .volumes
        .iter()
        .filter(|v| !v.remote_id.is_empty())
        .count()
        + sent
        + usize::from(job.published_url.as_deref().is_some_and(|s| !s.is_empty()));

    let active_vol_idx = job
        .active_volume
        .as_deref()
        .and_then(|key| job.volumes.iter().position(|v| v.key == key));

    let phase_base = match job.status {
        JobStatus::Linked => "Chờ công việc trước",
        JobStatus::Queued => "Chờ tải lên",
        JobStatus::Scheduled => "Đã hẹn giờ",
        JobStatus::Complete => "Đã xác nhận",
        JobStatus::Waiting if upload_issue(job).is_some() => "Tải lên bị gián đoạn",
        JobStatus::Waiting => match job.server_state {
            Some(ServerState::Processing) => "Chờ server xử lý",
            Some(ServerState::Partial) => "Đang hiện từng quyển",
            Some(ServerState::Locating) => "Đang tìm truyện",
            Some(ServerState::Connection) => "Chờ kết nối",
            _ => "Đang đối chiếu",
        },
        JobStatus::Uncertain => {
            if job.server_state == Some(ServerState::Resume) {
                "Còn phần chưa gửi"
            } else {
                "Cần kiểm tra"
            }
        }
        JobStatus::Failed => "Tạm dừng",
        _ => stage_label(job.stage),
    };

    let current_suffix =
        if active && matches!(job.stage, UploadStage::CreateVolume | UploadStage::Upload) {
            if let Some(idx) = active_vol_idx {
                format!(" · quyển {}/{}", idx + 1, job.volumes.len())
            } else {
                String::new()
            }
        } else {
            String::new()
        };

    let base_detail = if let Some(server_count) = job.server_chapter_count {
        format!("Server: {server_count}/{} chương", expected_count(job))
    } else {
        format!(
            "{sent}/{chapters} chương đã gửi · {uploaded_volumes}/{} quyển",
            job.volumes.len()
        )
    };

    let transfer = job
        .transfer
        .as_ref()
        .filter(|t| job.status == JobStatus::Sending && t.total > 0);
    let detail = if let Some(t) = transfer {
        format!("{}/{} KB", t.bytes.div_ceil(1024), t.total.div_ceil(1024))
    } else {
        base_detail
    };

    let percent = if let Some(t) = transfer {
        ((100 * t.bytes) / t.total).min(100) as u8
    } else if complete
        || (job.status == JobStatus::Waiting && job.volumes.iter().all(|v| v.status.is_uploaded()))
    {
        100
    } else {
        ((100 * done_raw) / max).min(99) as u8
    };

    let done = if complete {
        max
    } else {
        done_raw.min(max.saturating_sub(1))
    };

    ProgressSnapshot {
        id: job.id.clone(),
        title: job.display_title().to_owned(),
        status: job.status,
        active,
        phase: format!("{phase_base}{current_suffix}"),
        detail,
        error: job.error.clone(),
        done,
        max,
        percent,
    }
}

pub fn append_note(
    chapters: &[ChapterRef],
    auto_sort: bool,
    first_line_only: bool,
    start: usize,
) -> String {
    if chapters.is_empty() {
        return String::new();
    }
    if first_line_only {
        return format!("{start}-{}", start + chapters.len() - 1);
    }
    if !auto_sort {
        return String::new();
    }
    let first = chapters.first().and_then(|c| c.number);
    let last = chapters.last().and_then(|c| c.number);
    match (first, last) {
        (Some(f), Some(l)) if f >= 0 && l >= f => format!("{f}-{l}"),
        _ => String::new(),
    }
}

/// Giải phóng bộ nhớ tệp đã ghim trên các job hoàn tất cũ, giữ tối đa 2 job mới nhất trong 8 MiB.
pub fn release_completed_files(jobs: &mut [UploadJob]) -> usize {
    let mut completed: Vec<(usize, u64)> = jobs
        .iter()
        .enumerate()
        .filter(|(_, job)| job.status == JobStatus::Complete && !job.files_released)
        .map(|(idx, job)| (idx, job.completed_at.unwrap_or(job.created_at)))
        .collect();

    completed.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| b.0.cmp(&a.0)));

    let mut kept = 0usize;
    let mut bytes_used = 0u64;
    let mut released = 0usize;

    for (idx, _) in completed {
        let job = &mut jobs[idx];
        let chapters_size: u64 = job
            .chapters
            .as_deref()
            .unwrap_or(&[])
            .iter()
            .map(|c| {
                c.bytes
                    .saturating_mul(if c.source_file.is_some() { 2 } else { 1 })
            })
            .sum();
        let cover_size = job.metadata.cover_file.as_ref().map_or(0, |c| c.bytes);
        let total_size = chapters_size.saturating_add(cover_size);

        if kept < COMPLETED_KEEP_COUNT
            && bytes_used.saturating_add(total_size) <= COMPLETED_FILE_BUDGET_BYTES
        {
            kept += 1;
            bytes_used = bytes_used.saturating_add(total_size);
            continue;
        }

        job.chapters = None;
        job.metadata.cover_file = None;
        job.files_released = true;
        released += 1;
    }

    released
}
