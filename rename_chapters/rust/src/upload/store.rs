use std::collections::HashSet;
use std::fs::{self, File, OpenOptions};
use std::io::{self, BufReader, Write};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};

use serde::{Deserialize, Serialize};

use crate::CoreError;
use crate::upload::model::{JobStatus, UPLOAD_SCHEMA_VERSION, UploadJob};
use crate::upload::policy::{
    UploadLease, can_claim, compact_job_metadata, is_blocked_by_prior_write, linked_conflicts,
    merge_jobs, parent_confirmed, suspend_restored, validate_immediate, validate_link,
    validate_removal, validate_schedule,
};
use crate::upload::protocol::DEFAULT_WIKI_HOST;

const MAX_SCHEDULE_ROWS: usize = 100;
const BLOCKED_DEFER_MS: u64 = 15 * 60_000;
const STATE_FILENAME: &str = "upload-state.json";
const SCHEDULES_FILENAME: &str = "upload-schedules.json";
const LOCK_FILENAME: &str = "upload.lock";
const INTERRUPTED_MESSAGE: &str = "Lượt tải bị dừng. Kiểm tra công việc trước khi tiếp tục.";

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleRow {
    pub id: String,
    #[serde(default)]
    pub at: u64,
    #[serde(default)]
    pub key: String,
    #[serde(default)]
    pub running: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub after_job_id: Option<String>,
    #[serde(default)]
    pub immediate: bool,
    #[serde(default)]
    pub cancel_requested: bool,
    #[serde(default)]
    pub startup_retry: bool,
}

impl ScheduleRow {
    pub fn is_ready(
        &self,
        jobs: &[UploadJob],
        verified_ids: &HashSet<String>,
        now_ms: u64,
    ) -> bool {
        if self.running || self.cancel_requested || self.at > now_ms {
            return false;
        }
        match self.after_job_id.as_deref() {
            None | Some("") => true,
            Some(parent_id) => parent_confirmed(parent_id, jobs, verified_ids),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PersistedUploadState {
    schema: u32,
    #[serde(default)]
    jobs: Vec<UploadJob>,
}

impl Default for PersistedUploadState {
    fn default() -> Self {
        Self {
            schema: UPLOAD_SCHEMA_VERSION,
            jobs: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct CrashRecoveryReport {
    pub uncertain_ids: Vec<String>,
    pub failed_ids: Vec<String>,
}

/// Kho lưu trạng thái upload & lịch hẹn bền vững dùng atomic replace + file lock.
pub struct UploadStore {
    directory: PathBuf,
    allowed_host: String,
    lease: Arc<UploadLease>,
    schedule_epoch: AtomicU64,
}

impl UploadStore {
    pub fn new(directory: PathBuf) -> Self {
        Self {
            directory,
            allowed_host: DEFAULT_WIKI_HOST.to_owned(),
            lease: Arc::new(UploadLease::new()),
            schedule_epoch: AtomicU64::new(0),
        }
    }

    pub fn with_allowed_host(mut self, allowed_host: impl Into<String>) -> Self {
        self.allowed_host = allowed_host.into();
        self
    }

    pub fn with_lease(mut self, lease: Arc<UploadLease>) -> Self {
        self.lease = lease;
        self
    }

    pub fn lease(&self) -> &Arc<UploadLease> {
        &self.lease
    }

    pub fn schedule_epoch(&self) -> u64 {
        self.schedule_epoch.load(Ordering::SeqCst)
    }

    pub fn directory(&self) -> &Path {
        &self.directory
    }

    fn lock(&self) -> Result<File, CoreError> {
        fs::create_dir_all(&self.directory)?;
        let lock = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(false)
            .open(self.directory.join(LOCK_FILENAME))?;
        lock.lock()?;
        Ok(lock)
    }

    fn read_state(&self) -> Result<PersistedUploadState, CoreError> {
        let path = self.directory.join(STATE_FILENAME);
        let file = match File::open(path) {
            Ok(file) => file,
            Err(err) if err.kind() == io::ErrorKind::NotFound => {
                return Ok(PersistedUploadState::default());
            }
            Err(err) => return Err(err.into()),
        };
        let state: PersistedUploadState = serde_json::from_reader(BufReader::new(file))
            .map_err(|err| format!("Không đọc được trạng thái upload: {err}"))?;
        if state.schema != UPLOAD_SCHEMA_VERSION {
            return Err("Phiên bản dữ liệu upload không được hỗ trợ.".into());
        }
        Ok(state)
    }

    fn read_schedules(&self) -> Result<Vec<ScheduleRow>, CoreError> {
        let path = self.directory.join(SCHEDULES_FILENAME);
        let file = match File::open(path) {
            Ok(file) => file,
            Err(err) if err.kind() == io::ErrorKind::NotFound => return Ok(Vec::new()),
            Err(err) => return Err(err.into()),
        };
        let rows: Vec<ScheduleRow> = serde_json::from_reader(BufReader::new(file))
            .map_err(|err| format!("Không đọc được danh sách lịch upload: {err}"))?;
        Ok(rows)
    }

    fn save_json<T: Serialize>(&self, filename: &str, value: &T) -> Result<(), CoreError> {
        fs::create_dir_all(&self.directory)?;
        let mut temp = tempfile::NamedTempFile::new_in(&self.directory)?;
        serde_json::to_writer(&mut temp, value)?;
        temp.flush()?;
        temp.as_file().sync_all()?;
        temp.persist(self.directory.join(filename))
            .map_err(|err| err.error)?;
        Ok(())
    }

    fn save_state(&self, state: &PersistedUploadState) -> Result<(), CoreError> {
        self.save_json(STATE_FILENAME, state)
    }

    fn save_schedules(&self, rows: &[ScheduleRow]) -> Result<(), CoreError> {
        self.save_json(SCHEDULES_FILENAME, &rows)
    }

    pub fn load_jobs(&self) -> Result<Vec<UploadJob>, CoreError> {
        let _lock = self.lock()?;
        let mut state = self.read_state()?;
        for job in &mut state.jobs {
            compact_job_metadata(job);
        }
        Ok(state.jobs)
    }

    pub fn save_jobs(&self, incoming: Vec<UploadJob>) -> Result<Vec<UploadJob>, CoreError> {
        let _lock = self.lock()?;
        let current = self.read_state()?.jobs;
        let owner = self.lease.current();
        let merged = merge_jobs(&current, incoming, owner.as_deref());
        validate_removal(&current, &merged)?;
        self.save_state(&PersistedUploadState {
            schema: UPLOAD_SCHEMA_VERSION,
            jobs: merged.clone(),
        })?;
        Ok(merged)
    }

    pub fn upsert_job(&self, mut job: UploadJob) -> Result<UploadJob, CoreError> {
        let _lock = self.lock()?;
        let mut state = self.read_state()?;
        compact_job_metadata(&mut job);
        if let Some(pos) = state.jobs.iter().position(|existing| existing.id == job.id) {
            state.jobs[pos] = job.clone();
        } else {
            state.jobs.push(job.clone());
        }
        self.save_state(&state)?;
        Ok(job)
    }

    pub fn update_job<F>(&self, id: &str, mut change: F) -> Result<UploadJob, CoreError>
    where
        F: FnMut(&mut UploadJob) -> Result<(), CoreError>,
    {
        let _lock = self.lock()?;
        self.update_job_locked(id, &mut change)
    }

    fn update_job_locked<F>(&self, id: &str, change: &mut F) -> Result<UploadJob, CoreError>
    where
        F: FnMut(&mut UploadJob) -> Result<(), CoreError>,
    {
        let mut state = self.read_state()?;
        let Some(job) = state.jobs.iter_mut().find(|item| item.id == id) else {
            return Err("Công việc đã bị xóa.".into());
        };
        change(job)?;
        compact_job_metadata(job);
        job.schedule_revision = job.schedule_revision.saturating_add(1);
        let updated = job.clone();
        self.save_state(&state)?;
        self.schedule_epoch.fetch_add(1, Ordering::SeqCst);
        Ok(updated)
    }

    pub fn schedule_job(
        &self,
        id: &str,
        at_ms: u64,
        now_ms: u64,
        allow_duplicate: bool,
    ) -> Result<UploadJob, CoreError> {
        let _lock = self.lock()?;
        let mut rows = self.read_schedules()?;
        if rows.len() >= MAX_SCHEDULE_ROWS {
            return Err("Đang có 100 lịch chờ. Xử lý bớt trước khi hẹn thêm.".into());
        }
        let state = self.read_state()?;
        let Some(job) = state.jobs.iter().find(|item| item.id == id) else {
            return Err("Công việc đã bị xóa.".into());
        };
        let key = validate_schedule(job, at_ms, now_ms, &self.allowed_host)?;
        if rows.iter().any(|row| row.id == id) {
            return Err("Công việc đã có lịch.".into());
        }
        if !allow_duplicate && rows.iter().any(|row| row.key == key) {
            return Err("Truyện này đã có lịch chờ. Kiểm tra để tránh đăng trùng.".into());
        }

        rows.push(ScheduleRow {
            id: id.to_owned(),
            at: at_ms,
            key: key.clone(),
            ..Default::default()
        });
        self.save_schedules(&rows)?;

        let updated = self.update_job_locked(id, &mut |target| {
            target.status = JobStatus::Scheduled;
            target.scheduled_at = Some(at_ms);
            target.schedule_identity = Some(key.clone());
            Ok(())
        });
        if updated.is_err() {
            rows.retain(|row| row.id != id);
            let _ = self.save_schedules(&rows);
        }
        updated
    }

    pub fn link_job(
        &self,
        id: &str,
        parent_id: &str,
        now_ms: u64,
        allow_duplicate: bool,
    ) -> Result<UploadJob, CoreError> {
        let _lock = self.lock()?;
        let mut rows = self.read_schedules()?;
        if rows.len() >= MAX_SCHEDULE_ROWS {
            return Err("Đang có 100 lượt chờ. Xử lý bớt trước khi liên kết thêm.".into());
        }
        let jobs = self.read_state()?.jobs;
        let Some(job) = jobs.iter().find(|item| item.id == id) else {
            return Err("Công việc đã bị xóa.".into());
        };
        let key = validate_link(job, parent_id, &jobs, &self.allowed_host)?;
        if rows.iter().any(|row| row.id == id) {
            return Err("Công việc đã có lịch hoặc liên kết.".into());
        }
        if !allow_duplicate && !linked_conflicts(job, &jobs, &self.allowed_host)?.is_empty() {
            return Err("Truyện này còn lượt chờ. Kiểm tra để tránh gửi trùng.".into());
        }

        rows.push(ScheduleRow {
            id: id.to_owned(),
            at: 0,
            key: key.clone(),
            after_job_id: Some(parent_id.to_owned()),
            ..Default::default()
        });
        self.save_schedules(&rows)?;

        let updated = self.update_job_locked(id, &mut |target| {
            target.status = JobStatus::Linked;
            target.after_job_id = Some(parent_id.to_owned());
            target.schedule_identity = Some(key.clone());
            target.linked_at = Some(now_ms);
            target.scheduled_at = None;
            Ok(())
        });
        if updated.is_err() {
            rows.retain(|row| row.id != id);
            let _ = self.save_schedules(&rows);
        }
        updated
    }

    pub fn start_now(
        &self,
        id: &str,
        revision: u64,
        consent: &HashSet<String>,
        now_ms: u64,
    ) -> Result<UploadJob, CoreError> {
        let _lock = self.lock()?;
        let mut rows = self.read_schedules()?;
        if rows.len() >= MAX_SCHEDULE_ROWS {
            return Err("Xử lý bớt công việc trước khi gửi thêm.".into());
        }
        let jobs = self.read_state()?.jobs;
        let Some(job) = jobs.iter().find(|item| item.id == id) else {
            return Err("Công việc đã bị xóa.".into());
        };
        let key = validate_immediate(job, revision, &jobs, consent, &self.allowed_host)?;
        if self.lease.current().is_some() {
            return Err("Đang có công việc khác gửi dữ liệu.".into());
        }
        if rows.iter().any(|row| row.id == id) {
            return Err("Công việc đã chờ gửi.".into());
        }

        rows.push(ScheduleRow {
            id: id.to_owned(),
            at: now_ms,
            key,
            immediate: true,
            ..Default::default()
        });
        self.save_schedules(&rows)?;

        let updated = self.update_job_locked(id, &mut |target| {
            target.status = JobStatus::Queued;
            target.background_upload = true;
            target.schedule_started_at = None;
            target.schedule_message = None;
            Ok(())
        });
        if updated.is_err() {
            rows.retain(|row| row.id != id);
            let _ = self.save_schedules(&rows);
        }
        updated
    }

    pub fn ready_ids(
        &self,
        now_ms: u64,
        requested_id: Option<&str>,
        verified_ids: &HashSet<String>,
    ) -> Result<Vec<String>, CoreError> {
        let _lock = self.lock()?;
        if self.lease.current().is_some() {
            return Ok(Vec::new());
        }
        let jobs = self.read_state()?.jobs;
        let mut ready: Vec<ScheduleRow> = self
            .read_schedules()?
            .into_iter()
            .filter(|row| {
                requested_id.is_none_or(|req| row.id == req)
                    && row.is_ready(&jobs, verified_ids, now_ms)
            })
            .collect();
        ready.sort_by_key(|row| row.at);
        Ok(ready.into_iter().map(|row| row.id).collect())
    }

    pub fn claim_next_ready(
        &self,
        now_ms: u64,
        verified_ids: &HashSet<String>,
        only_id: Option<&str>,
    ) -> Result<Option<UploadJob>, CoreError> {
        let _lock = self.lock()?;
        let mut rows = self.read_schedules()?;
        let jobs = self.read_state()?.jobs;
        let Some(row_pos) = rows
            .iter()
            .enumerate()
            .filter(|(_, row)| {
                only_id.is_none_or(|id| row.id == id) && row.is_ready(&jobs, verified_ids, now_ms)
            })
            .min_by_key(|(_, row)| row.at)
            .map(|(idx, _)| idx)
        else {
            return Ok(None);
        };

        let id = rows[row_pos].id.clone();
        let immediate = rows[row_pos].immediate;
        let Some(candidate) = jobs.iter().find(|job| job.id == id) else {
            rows.retain(|row| row.id != id);
            self.save_schedules(&rows)?;
            return Ok(None);
        };

        if !immediate
            && is_blocked_by_prior_write(candidate, &jobs, verified_ids, &self.allowed_host)?
        {
            rows[row_pos].at = now_ms.saturating_add(BLOCKED_DEFER_MS);
            self.save_schedules(&rows)?;
            self.update_job_locked(&id, &mut |job| {
                job.schedule_message = Some(
                    "Chờ lượt trước của truyện này được đối chiếu. Kiểm tra Công việc nếu lượt trước cần xử lý."
                        .to_owned(),
                );
                Ok(())
            })?;
            return Ok(None);
        }

        let owner = format!("scheduled:{id}");
        if !self.lease.acquire(&owner) {
            return Ok(None);
        }

        rows[row_pos].running = true;
        rows[row_pos].startup_retry = false;
        if let Err(err) = self.save_schedules(&rows) {
            self.lease.release(&owner);
            return Err(err);
        }

        let updated = self.update_job_locked(&id, &mut |job| {
            if !can_claim(job, immediate) {
                return Err("Công việc không hợp lệ để nhận lượt chạy.".into());
            }
            job.status = JobStatus::Running;
            job.background_upload = true;
            job.started_at = Some(now_ms);
            job.verification_message = None;
            job.schedule_message = None;
            if !immediate {
                job.schedule_started_at = Some(now_ms);
            }
            Ok(())
        });

        match updated {
            Ok(job) => Ok(Some(job)),
            Err(err) => {
                self.lease.release(&owner);
                rows.retain(|row| row.id != id);
                let _ = self.save_schedules(&rows);
                Err(err)
            }
        }
    }

    pub fn save_running_progress(&self, job: &UploadJob) -> Result<UploadJob, CoreError> {
        let _lock = self.lock()?;
        let expected_owner = format!("scheduled:{}", job.id);
        if self.lease.current().as_deref() != Some(expected_owner.as_str()) {
            return Err("Lượt hẹn giờ đã dừng.".into());
        }
        self.update_job_locked(&job.id, &mut |target| {
            *target = job.clone();
            Ok(())
        })
    }

    pub fn finish_job(&self, id: &str, interrupted: bool) -> Result<(), CoreError> {
        let _lock = self.lock()?;
        self.finish_job_locked(id, interrupted)
    }

    fn finish_job_locked(&self, id: &str, interrupted: bool) -> Result<(), CoreError> {
        let mut state = self.read_state()?;
        let mut changed = false;
        if let Some(job) = state.jobs.iter_mut().find(|item| item.id == id)
            && (interrupted
                || matches!(
                    job.status,
                    JobStatus::Planned
                        | JobStatus::Scheduled
                        | JobStatus::Queued
                        | JobStatus::Running
                        | JobStatus::Sending
                        | JobStatus::Verifying
                ))
        {
            job.status = if job.write_attempted {
                JobStatus::Uncertain
            } else {
                JobStatus::Failed
            };
            job.needs_reconcile = job.write_attempted;
            job.error = INTERRUPTED_MESSAGE.to_owned();
            compact_job_metadata(job);
            job.schedule_revision = job.schedule_revision.saturating_add(1);
            changed = true;
        }
        if changed {
            self.save_state(&state)?;
        }

        let mut rows = self.read_schedules()?;
        let prev_len = rows.len();
        rows.retain(|row| row.id != id);
        if rows.len() != prev_len {
            self.save_schedules(&rows)?;
        }

        self.lease.release(&format!("scheduled:{id}"));
        self.schedule_epoch.fetch_add(1, Ordering::SeqCst);
        Ok(())
    }

    pub fn request_stop(&self, id: &str) -> Result<bool, CoreError> {
        let _lock = self.lock()?;
        let mut rows = self.read_schedules()?;
        let Some(row) = rows.iter_mut().find(|item| item.id == id) else {
            return Ok(false);
        };
        row.cancel_requested = true;
        self.save_schedules(&rows)?;
        Ok(true)
    }

    pub fn finish_pending_stop(&self, id: &str) -> Result<(), CoreError> {
        let _lock = self.lock()?;
        let mut rows = self.read_schedules()?;
        let Some(pos) = rows
            .iter()
            .position(|row| row.id == id && row.cancel_requested && !row.running)
        else {
            return Ok(());
        };
        self.update_job_locked(id, &mut |job| {
            job.status = if job.write_attempted {
                JobStatus::Uncertain
            } else {
                JobStatus::Failed
            };
            job.needs_reconcile = job.write_attempted;
            job.error = "Đã dừng tải.".to_owned();
            Ok(())
        })?;
        rows.remove(pos);
        self.save_schedules(&rows)?;
        Ok(())
    }

    pub fn cancel_schedules(&self, ids: &HashSet<String>) -> Result<Vec<UploadJob>, CoreError> {
        let _lock = self.lock()?;
        let mut rows = self.read_schedules()?;
        if rows.iter().any(|row| ids.contains(&row.id) && row.running) {
            return Err("Công việc đã bắt đầu. Chờ gửi và đối chiếu xong.".into());
        }
        let mut canceled = Vec::new();
        for row in rows.iter().filter(|row| ids.contains(&row.id)) {
            let job = self.update_job_locked(&row.id, &mut |target| {
                target.status = JobStatus::Planned;
                target.scheduled_at = None;
                target.after_job_id = None;
                target.schedule_message = None;
                Ok(())
            })?;
            canceled.push(job);
        }
        rows.retain(|row| !ids.contains(&row.id));
        self.save_schedules(&rows)?;
        Ok(canceled)
    }

    /// Khôi phục trạng thái sau sự cố/tắt app đột ngột:
    /// không bao giờ tự retry request đã đánh dấu `write_attempted`, chuyển sang `Uncertain` để đối chiếu.
    pub fn recover_after_crash(&self) -> Result<CrashRecoveryReport, CoreError> {
        let _lock = self.lock()?;
        let active_owner = self.lease.current();
        let rows = self.read_schedules()?;
        let state = self.read_state()?;

        let mut orphan_ids = Vec::new();
        let mut seen = HashSet::new();

        for row in &rows {
            let owned = active_owner
                .as_deref()
                .is_some_and(|owner| owner == format!("scheduled:{}", row.id));
            if row.running && !owned && seen.insert(row.id.clone()) {
                orphan_ids.push(row.id.clone());
            }
        }
        for job in &state.jobs {
            let owned = active_owner
                .as_deref()
                .is_some_and(|owner| owner == format!("scheduled:{}", job.id));
            if matches!(
                job.status,
                JobStatus::Running | JobStatus::Sending | JobStatus::Verifying
            ) && !owned
                && seen.insert(job.id.clone())
            {
                orphan_ids.push(job.id.clone());
            }
        }

        let mut report = CrashRecoveryReport::default();
        for id in orphan_ids {
            let was_written = state
                .jobs
                .iter()
                .find(|j| j.id == id)
                .is_some_and(|j| j.write_attempted);
            self.finish_job_locked(&id, true)?;
            if was_written {
                report.uncertain_ids.push(id);
            } else {
                report.failed_ids.push(id);
            }
        }
        Ok(report)
    }

    /// Khôi phục danh sách công việc từ snapshot sao lưu mà không kích hoạt lại lệnh hẹn ghi ngầm.
    pub fn restore_jobs_safely(
        &self,
        mut backup_jobs: Vec<UploadJob>,
    ) -> Result<Vec<UploadJob>, CoreError> {
        let _lock = self.lock()?;
        if self.lease.current().is_some() {
            return Err("Đợi tải lên xong hoặc dừng lượt tải trước khi khôi phục snapshot.".into());
        }
        for job in &mut backup_jobs {
            suspend_restored(job);
            compact_job_metadata(job);
        }
        let schedules_path = self.directory.join(SCHEDULES_FILENAME);
        if schedules_path.exists() {
            fs::remove_file(schedules_path)?;
        }
        self.save_state(&PersistedUploadState {
            schema: UPLOAD_SCHEMA_VERSION,
            jobs: backup_jobs.clone(),
        })?;
        self.schedule_epoch.fetch_add(1, Ordering::SeqCst);
        Ok(backup_jobs)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::upload::model::{
        BookSummary, ChapterRef, JobMetadata, JobMode, UploadStage, VolumePlan, VolumeStatus,
    };
    use tempfile::tempdir;

    fn planned_job(id: &str) -> UploadJob {
        UploadJob {
            id: id.into(),
            account: "owner".into(),
            mode: JobMode::Existing,
            status: JobStatus::Planned,
            book_id: "book-1".into(),
            book: Some(BookSummary {
                url: "https://wikicv.org/truyen/test".into(),
                ..Default::default()
            }),
            cleanup_chosen_at: Some(1),
            metadata: JobMetadata {
                fields: vec![("titleVi".into(), "Truyện test".into())],
                ..Default::default()
            },
            chapters: Some(vec![ChapterRef {
                id: "ch-1".into(),
                title: "第1章".into(),
                bytes: 100,
                ..Default::default()
            }]),
            volumes: vec![VolumePlan {
                key: "v1".into(),
                name: "Chính văn".into(),
                chapter_ids: vec!["ch-1".into()],
                status: VolumeStatus::Planned,
                ..Default::default()
            }],
            ..Default::default()
        }
    }

    #[test]
    fn crash_recovery_moves_written_jobs_to_uncertain_and_unwritten_to_failed() {
        let dir = tempdir().expect("tempdir");

        let mut written_crash = planned_job("written");
        written_crash.status = JobStatus::Sending;
        written_crash.stage = UploadStage::Upload;
        written_crash.write_attempted = true;
        written_crash.volumes[0].remote_id = "vol-remote-1".into();
        written_crash.volumes[0].status = VolumeStatus::Created;

        let mut clean_crash = planned_job("unwritten");
        clean_crash.status = JobStatus::Running;
        clean_crash.stage = UploadStage::Authorize;
        clean_crash.write_attempted = false;

        {
            let store = UploadStore::new(dir.path().to_path_buf());
            store
                .save_jobs(vec![written_crash.clone(), clean_crash.clone()])
                .expect("save");
            store
                .save_schedules(&[
                    ScheduleRow {
                        id: "written".into(),
                        at: 100,
                        key: "book:/truyen/test".into(),
                        running: true,
                        ..Default::default()
                    },
                    ScheduleRow {
                        id: "unwritten".into(),
                        at: 200,
                        key: "book:/truyen/test".into(),
                        running: true,
                        ..Default::default()
                    },
                ])
                .expect("save rows");
        }

        // Mở store mới mô phỏng app khởi động lại sau crash.
        let restarted = UploadStore::new(dir.path().to_path_buf());
        let report = restarted.recover_after_crash().expect("recover");
        assert_eq!(report.uncertain_ids, ["written"]);
        assert_eq!(report.failed_ids, ["unwritten"]);

        let jobs = restarted.load_jobs().expect("load");
        let w = jobs.iter().find(|j| j.id == "written").expect("w");
        assert_eq!(w.status, JobStatus::Uncertain);
        assert!(w.needs_reconcile);
        assert_eq!(w.volumes[0].remote_id, "vol-remote-1");

        let u = jobs.iter().find(|j| j.id == "unwritten").expect("u");
        assert_eq!(u.status, JobStatus::Failed);
        assert!(!u.needs_reconcile);

        assert!(
            restarted
                .ready_ids(1_000_000, None, &HashSet::new())
                .expect("ready")
                .is_empty()
        );
    }

    #[test]
    fn schedule_claim_defers_blocked_duplicate_and_restore_disarms_auto_writes() {
        let dir = tempdir().expect("tempdir");
        let store = UploadStore::new(dir.path().to_path_buf());

        let mut prior = planned_job("prior");
        prior.status = JobStatus::Waiting;
        prior.write_attempted = true;

        let next = planned_job("next");
        store.save_jobs(vec![prior, next]).expect("save");

        store
            .schedule_job("next", 100_000, 10_000, false)
            .expect("schedule");

        let claimed = store
            .claim_next_ready(100_000, &HashSet::new(), None)
            .expect("defer");
        assert!(claimed.is_none());

        let jobs_after_defer = store.load_jobs().expect("load");
        let next_job = jobs_after_defer
            .iter()
            .find(|j| j.id == "next")
            .expect("next");
        assert!(
            next_job
                .schedule_message
                .as_deref()
                .is_some_and(|m| m.contains("đối chiếu"))
        );

        let verified: HashSet<String> = ["prior".into()].into_iter().collect();
        assert!(
            store
                .claim_next_ready(100_000, &verified, None)
                .expect("still deferred")
                .is_none()
        );
        let claimed_later = store
            .claim_next_ready(100_000 + BLOCKED_DEFER_MS, &verified, None)
            .expect("claim ok")
            .expect("claimed");
        assert_eq!(claimed_later.status, JobStatus::Running);
        assert!(store.lease().current().is_some());

        // Đang giữ lease thì không được restore snapshot.
        assert!(store.restore_jobs_safely(vec![planned_job("x")]).is_err());

        store.finish_job("next", false).expect("finish");
        assert!(store.lease().current().is_none());

        let mut armed = planned_job("armed");
        armed.status = JobStatus::Scheduled;
        armed.scheduled_at = Some(500);
        let restored = store.restore_jobs_safely(vec![armed]).expect("restore ok");
        assert_eq!(restored[0].status, JobStatus::Planned);
        assert!(restored[0].scheduled_at.is_none());
    }
}
