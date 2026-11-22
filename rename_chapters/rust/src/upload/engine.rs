use std::time::{SystemTime, UNIX_EPOCH};

use crate::CoreError;
use crate::upload::model::{
    ChapterRef, JobMetadata, JobMode, JobStatus, UploadJob, UploadStage, VolumeStatus,
};
use crate::upload::protocol::{
    ChapterValidationInput, DEFAULT_WIKI_HOST, PartSpec, WriteReplyError, build_metadata_parts,
    build_upload_parts, parse_volume_result, parse_write_response, resolve_wiki_url,
    validate_chapters,
};

pub trait Clock: Send + Sync {
    fn now_ms(&self) -> u64;
}

#[derive(Debug, Default, Clone, Copy)]
pub struct SystemClock;

impl Clock for SystemClock {
    fn now_ms(&self) -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_or(0, |d| d.as_millis() as u64)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WriteAction {
    CreateVolume,
    Upload,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FormRequest {
    pub url: String,
    pub fields: Vec<(String, String)>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MultipartRequest {
    pub url: String,
    pub parts: Vec<PartSpec>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TransportReply {
    pub status: u16,
    pub body: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ScheduledVerify {
    pub attempt: u32,
    pub next_at: u64,
}

/// Ranh giới I/O trừu tượng cho Desktop, Android và test mock/fixture.
pub trait UploadIo {
    fn save(&mut self, job: &UploadJob) -> Result<(), CoreError>;
    fn authorize(&mut self, job: &UploadJob) -> Result<(), CoreError>;
    fn chapters(
        &mut self,
        chapter_ids: &[String],
        job: &UploadJob,
    ) -> Result<Vec<ChapterRef>, CoreError>;

    fn before_write(
        &mut self,
        _job: &mut UploadJob,
        _volume_index: usize,
        _action: WriteAction,
    ) -> Result<(), CoreError> {
        Ok(())
    }

    fn send_form(&mut self, req: FormRequest) -> Result<TransportReply, CoreError>;
    fn send_multipart(&mut self, req: MultipartRequest) -> Result<TransportReply, CoreError>;
    fn fresh_metadata(&mut self, job: &UploadJob) -> Result<JobMetadata, CoreError>;
    fn verify(&mut self, job: &UploadJob) -> Result<bool, CoreError>;

    fn has_schedule_verify(&self) -> bool {
        false
    }

    fn schedule_verify(&mut self, _job: &UploadJob) -> Result<ScheduledVerify, CoreError> {
        Err("Chưa cấu hình lịch đối chiếu.".into())
    }

    fn has_reconcile_failure(&self) -> bool {
        false
    }

    fn reconcile_failure(&mut self, _job: &mut UploadJob) -> Result<(), CoreError> {
        Ok(())
    }
}

struct EngineFailure {
    message: String,
    rejected: bool,
}

impl EngineFailure {
    fn from_core(err: CoreError) -> Self {
        Self {
            message: err.to_string(),
            rejected: false,
        }
    }

    fn from_write_reply(err: WriteReplyError) -> Self {
        Self {
            rejected: err.is_server_rejected(),
            message: err.to_string(),
        }
    }

    fn plain(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            rejected: false,
        }
    }
}

impl From<CoreError> for EngineFailure {
    fn from(value: CoreError) -> Self {
        Self::from_core(value)
    }
}

impl From<WriteReplyError> for EngineFailure {
    fn from(value: WriteReplyError) -> Self {
        Self::from_write_reply(value)
    }
}

struct RunningGuard<'a>(&'a mut bool);

impl Drop for RunningGuard<'_> {
    fn drop(&mut self) {
        *self.0 = false;
    }
}

/// State machine điều phối upload bất biến trước lỗi mạng:
/// luôn lưu trạng thái trước mỗi thao tác ghi và không bao giờ tự retry write.
#[derive(Debug, Clone)]
pub struct UploadEngine {
    running: bool,
    allowed_host: String,
}

impl Default for UploadEngine {
    fn default() -> Self {
        Self::new(DEFAULT_WIKI_HOST)
    }
}

impl UploadEngine {
    pub fn new(allowed_host: impl Into<String>) -> Self {
        Self {
            running: false,
            allowed_host: allowed_host.into(),
        }
    }

    pub fn is_running(&self) -> bool {
        self.running
    }

    pub fn run(
        &mut self,
        job: &mut UploadJob,
        io: &mut dyn UploadIo,
        clock: &dyn Clock,
    ) -> Result<(), CoreError> {
        if self.running {
            return Err("Đang chạy một lượt upload.".into());
        }
        if matches!(
            job.status,
            JobStatus::Uncertain
                | JobStatus::Sending
                | JobStatus::Verifying
                | JobStatus::Waiting
                | JobStatus::Complete
        ) {
            return Err("Cần đối chiếu trước khi gửi lại.".into());
        }

        let host = self.allowed_host.clone();
        self.running = true;
        let _guard = RunningGuard(&mut self.running);

        match Self::run_inner(&host, job, io, clock) {
            Ok(()) => Ok(()),
            Err(failure) => {
                job.last_upload_error = Some(failure.message.clone());
                job.failed_stage = Some(job.stage);
                job.error = failure.message.clone();
                if matches!(
                    job.status,
                    JobStatus::Sending | JobStatus::Verifying | JobStatus::Waiting
                ) {
                    job.status = JobStatus::Uncertain;
                    job.needs_reconcile = true;
                } else {
                    job.status = JobStatus::Failed;
                }
                job.rejected = failure.rejected;
                io.save(job)?;

                if (job.write_attempted || job.needs_reconcile) && io.has_reconcile_failure() {
                    if io.reconcile_failure(job).is_err() {
                        job.status = JobStatus::Uncertain;
                        job.error.clear();
                        job.verification_message = Some(
                            "Chưa hẹn được lịch đối chiếu. Kiểm tra server trước khi gửi lại."
                                .to_owned(),
                        );
                        io.save(job)?;
                    }
                    return Ok(());
                }

                Err(failure.message.into())
            }
        }
    }

    fn run_inner(
        allowed_host: &str,
        job: &mut UploadJob,
        io: &mut dyn UploadIo,
        clock: &dyn Clock,
    ) -> Result<(), EngineFailure> {
        job.status = JobStatus::Running;
        job.stage = UploadStage::Authorize;
        job.error.clear();
        io.save(job)?;

        io.authorize(job)?;
        job.status = JobStatus::Running;
        job.error.clear();
        io.save(job)?;

        for vol_idx in 0..job.volumes.len() {
            if job.volumes[vol_idx].status.is_uploaded() {
                continue;
            }
            let chapter_ids = job.volumes[vol_idx].chapter_ids.clone();
            let chapters = io.chapters(&chapter_ids, job)?;
            let validation_inputs: Vec<ChapterValidationInput> = chapters
                .iter()
                .map(|c| ChapterValidationInput {
                    id: c.id.clone(),
                    title: c.title.clone(),
                    number: c.number,
                    bytes: c.bytes,
                })
                .collect();
            let check = validate_chapters(&validation_inputs);
            if !check.errors.is_empty() {
                return Err(EngineFailure::plain(check.errors.join("\n")));
            }

            if job.volumes[vol_idx].remote_id.is_empty() {
                io.before_write(job, vol_idx, WriteAction::CreateVolume)?;
                job.transfer = None;
                job.volumes[vol_idx].create_attempted_at = clock.now_ms();
                job.write_attempted = true;
                job.stage = UploadStage::CreateVolume;
                job.active_volume = Some(job.volumes[vol_idx].key.clone());
                job.status = JobStatus::Sending;
                io.save(job)?;

                let mut fields = vec![
                    ("nameCn".to_owned(), job.volumes[vol_idx].name.clone()),
                    ("numFile".to_owned(), chapters.len().to_string()),
                ];
                if !job.book_id.is_empty() {
                    fields.push(("bookId".to_owned(), job.book_id.clone()));
                }
                if job.mode == JobMode::Existing {
                    fields.push(("clearBook".to_owned(), "0".to_owned()));
                }

                let reply = io.send_form(FormRequest {
                    url: format!("https://{allowed_host}/volume"),
                    fields,
                })?;
                let created = parse_volume_result(reply.status, &reply.body)?;
                if !job.book_id.is_empty() && job.book_id != created.book_id {
                    return Err(EngineFailure::plain("Server tạo quyển thuộc truyện khác."));
                }
                job.book_id = created.book_id;
                job.volumes[vol_idx].remote_id = created.volume_id;
                job.volumes[vol_idx].status = VolumeStatus::Created;
                job.status = JobStatus::Running;
                io.save(job)?;
            }

            io.before_write(job, vol_idx, WriteAction::Upload)?;
            job.volumes[vol_idx].upload_attempted_at = clock.now_ms();
            job.write_attempted = true;
            job.stage = UploadStage::Upload;
            job.active_volume = Some(job.volumes[vol_idx].key.clone());
            job.status = JobStatus::Sending;
            job.transfer = None;
            io.save(job)?;

            let parts = {
                let vol = &job.volumes[vol_idx];
                build_upload_parts(
                    &job.book_id,
                    &vol.remote_id,
                    vol.append,
                    vol.can_append,
                    Some(&vol.note),
                    &validation_inputs,
                )?
            };
            let reply = io.send_multipart(MultipartRequest {
                url: format!("https://{allowed_host}/upload-content"),
                parts,
            })?;
            parse_write_response(reply.status, &reply.body)?;
            job.volumes[vol_idx].status = VolumeStatus::Uploaded;
            job.status = JobStatus::Running;
            io.save(job)?;
        }

        if job.mode == JobMode::New
            && job.published_url.as_deref().is_none_or(str::is_empty)
            && !job.publish_accepted
        {
            let mut model = io.fresh_metadata(job)?;
            model.fields.retain(|(key, _)| key != "bookId");
            model
                .fields
                .push(("bookId".to_owned(), job.book_id.clone()));
            let parts = build_metadata_parts(&model.to_protocol_input())?;

            job.transfer = None;
            job.publish_attempted_at = clock.now_ms();
            job.write_attempted = true;
            job.stage = UploadStage::Publish;
            job.status = JobStatus::Sending;
            io.save(job)?;

            let reply = io.send_multipart(MultipartRequest {
                url: format!("https://{allowed_host}/nhung-file"),
                parts,
            })?;
            let payload = parse_write_response(reply.status, &reply.body)?;
            job.publish_accepted = true;
            io.save(job)?;

            let link = payload
                .get("data")
                .and_then(|d| d.get("link"))
                .and_then(serde_json::Value::as_str)
                .filter(|s| !s.is_empty())
                .ok_or_else(|| EngineFailure::plain("Đang tìm liên kết truyện trong Works."))?;
            job.published_url = Some(resolve_wiki_url(link, allowed_host)?);
            job.status = JobStatus::Running;
            io.save(job)?;
        }

        if io.has_schedule_verify() {
            job.last_upload_error = None;
            job.failed_stage = None;
            job.needs_reconcile = false;
            job.rejected = false;
            job.uploaded_at = Some(clock.now_ms());
            job.stage = UploadStage::VerifyWait;
            job.status = JobStatus::Waiting;
            job.transfer = None;
            io.save(job)?;

            let scheduled = io.schedule_verify(job)?;
            job.next_verify_at = Some(scheduled.next_at);
            job.verify_attempt = scheduled.attempt;
            io.save(job)?;
            return Ok(());
        }

        job.stage = UploadStage::Verify;
        job.status = JobStatus::Verifying;
        io.save(job)?;

        if !io.verify(job)? {
            return Err(EngineFailure::plain("Chưa xác nhận đủ chương."));
        }

        for vol in &mut job.volumes {
            vol.status = VolumeStatus::Verified;
        }
        job.status = JobStatus::Complete;
        job.completed_at = Some(clock.now_ms());
        io.save(job)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::upload::model::{
        CoverFileRef, HistoryBaseline, ServerState, TransferProgress, VolumePlan, append_note,
        progress_snapshot, release_completed_files, retry_label,
    };
    use std::sync::atomic::{AtomicU64, Ordering};

    struct FakeClock(AtomicU64);

    impl FakeClock {
        fn new(start: u64) -> Self {
            Self(AtomicU64::new(start))
        }
    }

    impl Clock for FakeClock {
        fn now_ms(&self) -> u64 {
            self.0.fetch_add(10, Ordering::SeqCst)
        }
    }

    #[derive(Debug, Clone)]
    enum RecordedCall {
        Form(FormRequest),
        Multipart(MultipartRequest),
    }

    impl RecordedCall {
        fn url(&self) -> &str {
            match self {
                Self::Form(r) => &r.url,
                Self::Multipart(r) => &r.url,
            }
        }
    }

    type FormHandler = Box<dyn FnMut(&FormRequest) -> Result<TransportReply, CoreError>>;
    type MultipartHandler = Box<dyn FnMut(&MultipartRequest) -> Result<TransportReply, CoreError>>;
    type BeforeWriteHandler =
        Box<dyn FnMut(&mut UploadJob, usize, WriteAction) -> Result<(), CoreError>>;
    type ReconcileHandler = Box<dyn FnMut(&mut UploadJob) -> Result<(), CoreError>>;

    struct MockIo {
        calls: Vec<RecordedCall>,
        saved: Vec<UploadJob>,
        auth_error: Option<String>,
        verify_ok: bool,
        schedule_verify_mode: Option<Result<ScheduledVerify, String>>,
        before_write_fn: Option<BeforeWriteHandler>,
        form_fn: Option<FormHandler>,
        multipart_fn: Option<MultipartHandler>,
        reconcile_fn: Option<ReconcileHandler>,
    }

    impl Default for MockIo {
        fn default() -> Self {
            Self {
                calls: Vec::new(),
                saved: Vec::new(),
                auth_error: None,
                verify_ok: true,
                schedule_verify_mode: None,
                before_write_fn: None,
                form_fn: None,
                multipart_fn: None,
                reconcile_fn: None,
            }
        }
    }

    impl UploadIo for MockIo {
        fn save(&mut self, job: &UploadJob) -> Result<(), CoreError> {
            self.saved.push(job.clone());
            Ok(())
        }

        fn authorize(&mut self, _job: &UploadJob) -> Result<(), CoreError> {
            if let Some(err) = &self.auth_error {
                return Err(err.clone().into());
            }
            Ok(())
        }

        fn chapters(
            &mut self,
            chapter_ids: &[String],
            _job: &UploadJob,
        ) -> Result<Vec<ChapterRef>, CoreError> {
            Ok(chapter_ids
                .iter()
                .enumerate()
                .map(|(i, id)| ChapterRef {
                    id: id.clone(),
                    title: format!("第{}章 测试", i + 1),
                    number: Some((i + 1) as i64),
                    bytes: 1024,
                    ..Default::default()
                })
                .collect())
        }

        fn before_write(
            &mut self,
            job: &mut UploadJob,
            volume_index: usize,
            action: WriteAction,
        ) -> Result<(), CoreError> {
            if let Some(f) = &mut self.before_write_fn {
                return f(job, volume_index, action);
            }
            Ok(())
        }

        fn send_form(&mut self, req: FormRequest) -> Result<TransportReply, CoreError> {
            self.calls.push(RecordedCall::Form(req.clone()));
            if let Some(f) = &mut self.form_fn {
                return f(&req);
            }
            Ok(TransportReply {
                status: 200,
                body: r#"{"err":0,"data":{"volume":{"book":{"$oid":"book-id"},"_id":{"$oid":"volume-id"}}}}"#.to_owned(),
            })
        }

        fn send_multipart(&mut self, req: MultipartRequest) -> Result<TransportReply, CoreError> {
            self.calls.push(RecordedCall::Multipart(req.clone()));
            if let Some(f) = &mut self.multipart_fn {
                return f(&req);
            }
            if req.url.ends_with("/nhung-file") {
                return Ok(TransportReply {
                    status: 200,
                    body: r#"{"err":0,"data":{"link":"/truyen/test"}}"#.to_owned(),
                });
            }
            Ok(TransportReply {
                status: 200,
                body: r#"{"err":0}"#.to_owned(),
            })
        }

        fn fresh_metadata(&mut self, job: &UploadJob) -> Result<JobMetadata, CoreError> {
            Ok(job.metadata.clone())
        }

        fn verify(&mut self, _job: &UploadJob) -> Result<bool, CoreError> {
            Ok(self.verify_ok)
        }

        fn has_schedule_verify(&self) -> bool {
            self.schedule_verify_mode.is_some()
        }

        fn schedule_verify(&mut self, _job: &UploadJob) -> Result<ScheduledVerify, CoreError> {
            match self.schedule_verify_mode.as_ref().expect("mode") {
                Ok(v) => Ok(*v),
                Err(msg) => Err(msg.clone().into()),
            }
        }

        fn has_reconcile_failure(&self) -> bool {
            self.reconcile_fn.is_some()
        }

        fn reconcile_failure(&mut self, job: &mut UploadJob) -> Result<(), CoreError> {
            let f = self.reconcile_fn.as_mut().expect("reconcile_fn");
            f(job)
        }
    }

    fn base_job(mode: JobMode) -> UploadJob {
        UploadJob {
            id: "job".into(),
            mode,
            status: JobStatus::Planned,
            metadata: JobMetadata {
                fields: vec![
                    ("titleVi".into(), "Thử".into()),
                    ("titleCn".into(), "测试".into()),
                    ("authorCn".into(), "作者".into()),
                ],
                ..Default::default()
            },
            volumes: vec![VolumePlan {
                key: "v1".into(),
                name: "正文".into(),
                chapter_ids: vec!["file-1".into(), "file-2".into()],
                status: VolumeStatus::Planned,
                ..Default::default()
            }],
            ..Default::default()
        }
    }

    #[test]
    fn upload_engine_creates_uploads_publishes_then_verifies() {
        let mut engine = UploadEngine::default();
        let mut io = MockIo::default();
        let clock = FakeClock::new(1000);
        let mut job = base_job(JobMode::New);

        engine.run(&mut job, &mut io, &clock).expect("success");
        assert_eq!(job.status, JobStatus::Complete);
        assert!(!engine.is_running());

        let endpoints: Vec<&str> = io
            .calls
            .iter()
            .map(|c| c.url().rsplit('/').next().expect("segment"))
            .collect();
        assert_eq!(endpoints, ["volume", "upload-content", "nhung-file"]);

        let snapshots: Vec<_> = io.saved.iter().map(progress_snapshot).collect();
        assert_eq!(snapshots[0].phase, "Kiểm tra");
        assert!(
            snapshots
                .iter()
                .any(|p| p.phase == "Tải chương lên · quyển 1/1" && p.detail.starts_with("0/2"))
        );
        assert!(
            snapshots
                .iter()
                .any(|p| p.phase == "Đối chiếu" && p.percent < 100 && p.detail.starts_with("2/2"))
        );
        assert_eq!(snapshots.last().expect("last").percent, 100);
        assert!(!snapshots.last().expect("last").active);
        assert!(snapshots.windows(2).all(|w| w[1].percent >= w[0].percent));
    }

    #[test]
    fn creating_volume_ignores_stale_note_and_appending_keeps_desc_cn() {
        for mode in [JobMode::New, JobMode::Existing] {
            let mut engine = UploadEngine::default();
            let mut io = MockIo::default();
            let clock = FakeClock::new(1000);
            let mut job = base_job(mode);
            if mode == JobMode::Existing {
                job.book_id = "book-id".into();
            }
            job.volumes[0].note = "Stale note from an old draft".into();

            engine.run(&mut job, &mut io, &clock).expect("ok");

            let create = io
                .calls
                .iter()
                .find_map(|c| match c {
                    RecordedCall::Form(r) if r.url.ends_with("/volume") => Some(r),
                    _ => None,
                })
                .expect("create");
            assert!(!create.fields.iter().any(|(k, _)| k == "noteCn"));
            let sent_book_id = create
                .fields
                .iter()
                .find(|(k, _)| k == "bookId")
                .map(|(_, v)| v.as_str());
            assert_eq!(
                sent_book_id,
                if mode == JobMode::Existing {
                    Some("book-id")
                } else {
                    None
                }
            );

            let upload = io
                .calls
                .iter()
                .find_map(|c| match c {
                    RecordedCall::Multipart(r) if r.url.ends_with("/upload-content") => Some(r),
                    _ => None,
                })
                .expect("upload");
            assert!(!upload.parts.iter().any(|p| p.name() == "descCn"));
        }

        let mut engine = UploadEngine::default();
        let mut io = MockIo::default();
        let clock = FakeClock::new(1000);
        let mut job = base_job(JobMode::Existing);
        job.book_id = "book-id".into();
        job.volumes[0].remote_id = "existing-volume".into();
        job.volumes[0].append = true;
        job.volumes[0].can_append = true;
        job.volumes[0].note = "23–24".into();

        engine.run(&mut job, &mut io, &clock).expect("ok");
        assert_eq!(io.calls.len(), 1);
        match &io.calls[0] {
            RecordedCall::Multipart(r) => {
                assert!(r.url.ends_with("/upload-content"));
                assert_eq!(
                    r.parts
                        .iter()
                        .find(|p| p.name() == "descCn")
                        .and_then(PartSpec::text_value),
                    Some("23–24")
                );
            }
            _ => panic!("expected multipart upload"),
        }
    }

    #[test]
    fn lost_upload_response_is_never_automatically_retried() {
        let mut engine = UploadEngine::default();
        let mut io = MockIo {
            multipart_fn: Some(Box::new(|_| Err("connection lost".into()))),
            ..Default::default()
        };
        let clock = FakeClock::new(1000);
        let mut job = base_job(JobMode::New);

        assert!(engine.run(&mut job, &mut io, &clock).is_err());
        assert_eq!(job.status, JobStatus::Uncertain);
        assert_eq!(job.volumes[0].remote_id, "volume-id");
        assert!(job.write_attempted);
        assert!(job.needs_reconcile);

        let second = engine
            .run(&mut job, &mut io, &clock)
            .expect_err("must refuse");
        assert!(second.to_string().contains("đối chiếu"));
    }

    #[test]
    fn create_response_missing_id_cannot_repeat_creation() {
        let mut engine = UploadEngine::default();
        let mut io = MockIo {
            form_fn: Some(Box::new(|_| {
                Ok(TransportReply {
                    status: 200,
                    body: r#"{"err":0}"#.to_owned(),
                })
            })),
            ..Default::default()
        };
        let clock = FakeClock::new(1000);
        let mut job = base_job(JobMode::New);

        assert!(engine.run(&mut job, &mut io, &clock).is_err());
        assert_eq!(job.status, JobStatus::Uncertain);
        assert!(engine.run(&mut job, &mut io, &clock).is_err());
    }

    #[test]
    fn partial_multi_volume_progress_and_verify_failure() {
        let mut uploads = 0usize;
        let mut form_count = 0usize;
        let mut engine = UploadEngine::default();
        let mut io = MockIo {
            form_fn: Some(Box::new(move |_| {
                form_count += 1;
                Ok(TransportReply {
                    status: 200,
                    body: format!(
                        r#"{{"err":0,"data":{{"volume":{{"book":{{"$oid":"b"}},"_id":{{"$oid":"v{form_count}"}}}}}}}}"#
                    ),
                })
            })),
            multipart_fn: Some(Box::new(move |_| {
                uploads += 1;
                if uploads == 2 {
                    return Err("lost response".into());
                }
                Ok(TransportReply {
                    status: 200,
                    body: r#"{"err":0}"#.to_owned(),
                })
            })),
            ..Default::default()
        };
        let clock = FakeClock::new(1000);
        let mut job = base_job(JobMode::Existing);
        job.book_id = "b".into();
        let mut v2 = job.volumes[0].clone();
        v2.key = "v2".into();
        job.volumes.push(v2);

        assert!(engine.run(&mut job, &mut io, &clock).is_err());
        assert_eq!(job.volumes[0].status, VolumeStatus::Uploaded);
        assert_eq!(job.volumes[1].status, VolumeStatus::Created);
        assert_eq!(job.status, JobStatus::Uncertain);

        let snap = progress_snapshot(&job);
        assert_eq!(snap.phase, "Cần kiểm tra");
        assert!(!snap.active);
        assert!(snap.detail.starts_with("2/4"));
        assert!(snap.percent > 0 && snap.percent < 100);
        assert_eq!(snap.error, "lost response");

        let mut engine2 = UploadEngine::default();
        let mut io2 = MockIo {
            verify_ok: false,
            ..Default::default()
        };
        let mut job2 = base_job(JobMode::New);
        assert!(engine2.run(&mut job2, &mut io2, &clock).is_err());
        assert_eq!(job2.status, JobStatus::Uncertain);
        assert!(job2.published_url.is_some());
    }

    #[test]
    fn auth_or_before_write_failure_leaves_zero_writes() {
        let mut engine = UploadEngine::default();
        let mut io = MockIo {
            auth_error: Some("Login expired".into()),
            reconcile_fn: Some(Box::new(|_| panic!("must not reconcile"))),
            ..Default::default()
        };
        let clock = FakeClock::new(1000);
        let mut job = base_job(JobMode::Existing);
        job.book_id = "book".into();
        job.volumes[0].remote_id = "existing".into();
        job.volumes[0].append = true;
        job.volumes[0].can_append = true;

        let err = engine.run(&mut job, &mut io, &clock).expect_err("auth err");
        assert!(err.to_string().contains("Login expired"));
        assert!(io.calls.is_empty());
        assert_eq!(job.status, JobStatus::Failed);
        assert!(!job.write_attempted);

        use std::sync::{Arc, Mutex};
        let events = Arc::new(Mutex::new(Vec::new()));
        let events_hook = Arc::clone(&events);
        let mut io_before = MockIo {
            before_write_fn: Some(Box::new(move |j, idx, action| {
                events_hook.lock().expect("lock").push(action);
                if action == WriteAction::Upload {
                    j.volumes[idx].history_before = Some(HistoryBaseline {
                        total: 10,
                        rows: Vec::new(),
                    });
                }
                Ok(())
            })),
            ..Default::default()
        };
        let mut job_ex = base_job(JobMode::Existing);
        job_ex.book_id = "book-id".into();
        engine.run(&mut job_ex, &mut io_before, &clock).expect("ok");
        assert_eq!(
            *events.lock().expect("lock"),
            [WriteAction::CreateVolume, WriteAction::Upload]
        );
        let sent_snap = io_before
            .saved
            .iter()
            .find(|s| s.stage == UploadStage::Upload && s.status == JobStatus::Sending)
            .expect("sending snapshot");
        assert_eq!(
            sent_snap.volumes[0]
                .history_before
                .as_ref()
                .expect("baseline")
                .total,
            10
        );

        let mut blocked = MockIo {
            before_write_fn: Some(Box::new(|_, _, _| Err("history unavailable".into()))),
            ..Default::default()
        };
        assert!(
            engine
                .run(&mut base_job(JobMode::Existing), &mut blocked, &clock)
                .is_err()
        );
        assert!(blocked.calls.is_empty());
    }

    #[test]
    fn resume_skips_uploaded_and_accepted_publish_and_handles_delayed_verify() {
        let mut engine = UploadEngine::default();
        let mut io = MockIo::default();
        let clock = FakeClock::new(1000);

        let mut job = base_job(JobMode::New);
        job.book_id = "book-id".into();
        job.publish_accepted = true;
        job.volumes[0].status = VolumeStatus::Uploaded;
        job.volumes[0].remote_id = "done-volume".into();
        engine.run(&mut job, &mut io, &clock).expect("complete");
        assert!(io.calls.is_empty());
        assert_eq!(job.status, JobStatus::Complete);

        let mut job_partial = base_job(JobMode::Existing);
        job_partial.book_id = "book-id".into();
        job_partial.volumes[0].status = VolumeStatus::Uploaded;
        job_partial.volumes[0].remote_id = "done-volume".into();
        let mut v2 = job_partial.volumes[0].clone();
        v2.key = "v2".into();
        v2.status = VolumeStatus::Created;
        v2.remote_id = "pending-volume".into();
        job_partial.volumes.push(v2);

        let mut io_partial = MockIo::default();
        engine
            .run(&mut job_partial, &mut io_partial, &clock)
            .expect("ok");
        assert_eq!(io_partial.calls.len(), 1);
        match &io_partial.calls[0] {
            RecordedCall::Multipart(r) => {
                assert_eq!(
                    r.parts
                        .iter()
                        .find(|p| p.name() == "volumeId")
                        .and_then(PartSpec::text_value),
                    Some("pending-volume")
                );
            }
            _ => panic!("expected multipart"),
        }

        let mut io_wait = MockIo {
            schedule_verify_mode: Some(Ok(ScheduledVerify {
                attempt: 0,
                next_at: 61_000,
            })),
            ..Default::default()
        };
        let mut job_wait = base_job(JobMode::New);
        engine
            .run(&mut job_wait, &mut io_wait, &clock)
            .expect("waiting");
        assert_eq!(job_wait.status, JobStatus::Waiting);
        assert_eq!(job_wait.stage, UploadStage::VerifyWait);
        assert_eq!(job_wait.next_verify_at, Some(61_000));
        assert!(!engine.is_running());

        let mut io_lost_sched = MockIo {
            schedule_verify_mode: Some(Err("lost schedule response".into())),
            ..Default::default()
        };
        let mut job_lost = base_job(JobMode::New);
        assert!(
            engine
                .run(&mut job_lost, &mut io_lost_sched, &clock)
                .is_err()
        );
        assert_eq!(job_lost.status, JobStatus::Uncertain);
        assert_eq!(job_lost.volumes[0].status, VolumeStatus::Uploaded);
        assert!(job_lost.published_url.is_some());
    }

    #[test]
    fn reconcile_failure_handoff_and_error_isolation() {
        let mut engine = UploadEngine::default();
        let clock = FakeClock::new(1000);

        let mut io_ok = MockIo {
            form_fn: Some(Box::new(|_| Err("timeout".into()))),
            reconcile_fn: Some(Box::new(|j| {
                j.status = JobStatus::Waiting;
                j.verification_message = Some("Đang đối chiếu".into());
                Ok(())
            })),
            ..Default::default()
        };
        let mut job = base_job(JobMode::New);
        engine
            .run(&mut job, &mut io_ok, &clock)
            .expect("handed off");
        assert_eq!(job.status, JobStatus::Waiting);
        assert_eq!(job.failed_stage, Some(UploadStage::CreateVolume));
        assert_eq!(job.last_upload_error.as_deref(), Some("timeout"));
        assert!(job.write_attempted);

        let mut io_fail = MockIo {
            form_fn: Some(Box::new(|_| Err("raw timeout".into()))),
            reconcile_fn: Some(Box::new(|_| Err("bridge lost".into()))),
            ..Default::default()
        };
        let mut job2 = base_job(JobMode::New);
        engine
            .run(&mut job2, &mut io_fail, &clock)
            .expect("review fallback");
        assert_eq!(job2.status, JobStatus::Uncertain);
        assert!(job2.error.is_empty());
        assert!(
            job2.verification_message
                .as_deref()
                .is_some_and(|m| m.contains("đối chiếu"))
        );
        assert_eq!(job2.last_upload_error.as_deref(), Some("raw timeout"));
    }

    #[test]
    fn progress_retry_label_append_note_and_file_release() {
        let mut j = base_job(JobMode::New);
        j.status = JobStatus::Sending;
        j.stage = UploadStage::Upload;
        j.transfer = Some(TransferProgress {
            job_id: "job".into(),
            bytes: 1024,
            total: 4096,
        });
        assert_eq!(progress_snapshot(&j).percent, 25);
        assert_eq!(progress_snapshot(&j).detail, "1/4 KB");

        let mut append_waiting = base_job(JobMode::Existing);
        append_waiting.status = JobStatus::Waiting;
        append_waiting.failed_stage = Some(UploadStage::Upload);
        append_waiting.last_upload_error = Some("Mất mạng".into());
        assert_eq!(retry_label(&append_waiting), Some("Thử lại"));
        assert_eq!(retry_label(&base_job(JobMode::New)), Some("Tiếp tục"));

        let mut resume_job = base_job(JobMode::New);
        resume_job.status = JobStatus::Uncertain;
        resume_job.server_state = Some(ServerState::Resume);
        assert_eq!(retry_label(&resume_job), Some("Tiếp tục"));

        let chapters = vec![
            ChapterRef {
                id: "a".into(),
                number: Some(19),
                ..Default::default()
            },
            ChapterRef {
                id: "b".into(),
                number: Some(100),
                ..Default::default()
            },
        ];
        assert_eq!(append_note(&chapters, true, false, 1), "19-100");
        assert_eq!(append_note(&chapters, false, false, 1), "");
        assert_eq!(append_note(&chapters, true, true, 31), "31-32");

        let mut jobs: Vec<UploadJob> = ["old", "recent", "newest"]
            .into_iter()
            .enumerate()
            .map(|(i, id)| {
                let mut job = base_job(JobMode::New);
                job.id = id.into();
                job.status = JobStatus::Complete;
                job.completed_at = Some((i + 1) as u64);
                job.chapters = Some(vec![ChapterRef {
                    id: format!("file-{id}"),
                    bytes: 100,
                    ..Default::default()
                }]);
                job.metadata.cover_file = Some(CoverFileRef {
                    id: format!("cover-{id}"),
                    bytes: 10,
                    ..Default::default()
                });
                job.volumes[0].status = VolumeStatus::Uploaded;
                job.volumes[0].chapter_ids = vec![format!("file-{id}")];
                job
            })
            .collect();

        let mut active = base_job(JobMode::New);
        active.status = JobStatus::Uncertain;
        active.chapters = Some(vec![ChapterRef {
            id: "retry".into(),
            bytes: 20 * 1024 * 1024,
            ..Default::default()
        }]);
        jobs.push(active);

        assert_eq!(release_completed_files(&mut jobs), 1);
        assert!(jobs[0].files_released);
        assert!(jobs[0].chapters.is_none());
        assert!(jobs[0].metadata.cover_file.is_none());
        assert_eq!(
            progress_snapshot(&jobs[0]).detail,
            "1/1 chương đã gửi · 1/1 quyển"
        );
        assert!(jobs[1].chapters.is_some());
        assert!(jobs[2].chapters.is_some());
        assert!(jobs[3].chapters.is_some());
    }
}
