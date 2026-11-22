use std::collections::HashSet;
use std::path::PathBuf;

use crate::CoreError;
use crate::upload::engine::{
    Clock, FormRequest, MultipartRequest, ScheduledVerify, TransportReply, UploadEngine, UploadIo,
    WriteAction,
};
use crate::upload::html::{parse_current_account, percent_encode_component};
use crate::upload::model::{
    ChapterRef, HistoryBaseline, JobMetadata, JobMode, JobStatus, UploadJob, VolumeStatus,
    expected_count,
};
use crate::upload::multipart::{MultipartPart, content_length, wiki_upload_file_part};
use crate::upload::objects::{ObjectStore, generate_object_id};
use crate::upload::protocol::{DEFAULT_WIKI_HOST, PartSpec};
use crate::upload::reconcile::{
    ReconcileRecord, ReconcileVolume, ScheduleVerifyInput, VerificationLedger,
};
use crate::upload::store::UploadStore;
use crate::upload::verifier::{
    ReadCancellation, ReadHttp, VerificationReader, VerifierError, run_due_ledger,
};

pub const MAX_MULTIPART_PAYLOAD_BYTES: u64 = 8 * 1024 * 1024;

/// Ranh giới HTTP tối giản cho adapter nền tảng (Desktop `reqwest`/`ureq` hoặc Android `HttpURLConnection`/WebView).
pub trait UploadHttpTransport {
    fn get_html(&mut self, url: &str, cancel: &ReadCancellation) -> Result<String, VerifierError>;
    fn post_form(&mut self, req: &FormRequest) -> Result<TransportReply, CoreError>;
    fn post_multipart(
        &mut self,
        url: &str,
        boundary: &str,
        parts: &[MultipartPart],
        total_bytes: u64,
        on_progress: &mut dyn FnMut(u64, u64),
    ) -> Result<TransportReply, CoreError>;
}

pub struct TransportReadAdapter<'a>(pub &'a mut dyn UploadHttpTransport);

impl ReadHttp for TransportReadAdapter<'_> {
    fn get_html(&mut self, url: &str, cancel: &ReadCancellation) -> Result<String, VerifierError> {
        self.0.get_html(url, cancel)
    }
}

/// Điều phối trọn vẹn luồng upload, lưu trạng thái, lịch đối chiếu và kho object bất biến.
pub struct UploadCoordinator {
    store: UploadStore,
    objects: ObjectStore,
    ledger: VerificationLedger,
    allowed_host: String,
}

impl UploadCoordinator {
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

    /// Thực thi một job upload qua transport cung cấp bởi nền tảng.
    /// Tự động giữ lease, lưu tiến độ trước mọi write, không tự retry write và bàn giao đối chiếu khi lỗi.
    pub fn run_job<F>(
        &self,
        job_id: &str,
        transport: &mut dyn UploadHttpTransport,
        clock: &dyn Clock,
        cancel: &ReadCancellation,
        mut on_transfer: F,
    ) -> Result<UploadJob, CoreError>
    where
        F: FnMut(u64, u64),
    {
        cancel.check()?;
        let owner = format!("scheduled:{job_id}");
        if self.store.lease().current().as_deref() != Some(owner.as_str())
            && !self.store.lease().acquire(&owner)
        {
            return Err("Đang có công việc khác gửi dữ liệu.".into());
        }

        struct LeaseGuard<'a> {
            store: &'a UploadStore,
            job_id: &'a str,
            owner: String,
            armed: bool,
        }
        impl Drop for LeaseGuard<'_> {
            fn drop(&mut self) {
                if self.armed {
                    let _ = self.store.finish_job(self.job_id, false);
                    self.store.lease().release(&self.owner);
                }
            }
        }
        let mut guard = LeaseGuard {
            store: &self.store,
            job_id,
            owner,
            armed: true,
        };

        let mut job = self
            .store
            .load_jobs()?
            .into_iter()
            .find(|item| item.id == job_id)
            .ok_or("Công việc đã bị xóa.")?;

        let run_result = {
            let mut io = CoordinatorIo {
                coordinator: self,
                transport,
                clock,
                cancel,
                on_transfer: &mut on_transfer,
            };
            UploadEngine::new(&self.allowed_host).run(&mut job, &mut io, clock)
        };

        guard.armed = false;
        let _ = self.store.finish_job(job_id, false);
        run_result?;
        Ok(job)
    }

    /// Chạy đối chiếu đến hạn trên sổ `VerificationLedger` và đồng bộ ngược kết quả nhẹ sang `UploadStore`.
    pub fn run_due_verifications(
        &self,
        transport: &mut dyn UploadHttpTransport,
        clock: &dyn Clock,
        cancel: &ReadCancellation,
        only_id: Option<&str>,
    ) -> Result<Vec<ReconcileRecord>, VerifierError> {
        let mut reader_transport = TransportReadAdapter(transport);
        let updated = run_due_ledger(
            &self.ledger,
            &mut reader_transport,
            &self.allowed_host,
            clock.now_ms(),
            only_id,
            cancel,
        )?;

        for rec in &updated {
            let _ = self.store.update_job(&rec.id, |job| {
                sync_reconcile_to_job(job, rec, clock.now_ms());
                Ok(())
            });
        }
        Ok(updated)
    }
}

fn sync_reconcile_to_job(job: &mut UploadJob, rec: &ReconcileRecord, now_ms: u64) {
    job.server_state = rec.server_state;
    job.server_chapter_count = rec.actual_count;
    job.verification_message = Some(rec.message.clone());
    job.next_verify_at = Some(rec.next_at);
    job.verify_attempt = rec.attempt;

    if !rec.url.is_empty()
        && job.mode == JobMode::New
        && job.published_url.as_deref().is_none_or(str::is_empty)
    {
        job.published_url = Some(rec.url.clone());
        job.publish_accepted = true;
    }

    for jvol in &mut job.volumes {
        if let Some(rvol) = rec.volumes.iter().find(|v| v.key == jvol.key) {
            if rec.status == JobStatus::Complete {
                jvol.status = VolumeStatus::Verified;
            } else if rvol.received && jvol.status != VolumeStatus::Verified {
                jvol.status = VolumeStatus::Uploaded;
            }
        }
    }

    if rec.status == JobStatus::Complete {
        job.status = JobStatus::Complete;
        job.completed_at = rec.verified_at.or(Some(now_ms));
        job.needs_reconcile = false;
        job.error.clear();
    } else if rec.status == JobStatus::Uncertain {
        job.status = JobStatus::Uncertain;
        job.needs_reconcile = true;
    } else if rec.status == JobStatus::Waiting
        && matches!(job.status, JobStatus::Waiting | JobStatus::Uncertain)
    {
        job.status = JobStatus::Waiting;
    }
}

pub(crate) fn build_verify_input_for_job(
    job: &UploadJob,
    generation: String,
) -> ScheduleVerifyInput {
    let volumes = job
        .volumes
        .iter()
        .map(|vol| ReconcileVolume {
            key: vol.key.clone(),
            name: vol.name.clone(),
            count: vol.chapter_ids.len(),
            append: vol.append,
            note: vol.note.clone(),
            received: vol.status.is_uploaded(),
            confirmed_by_history: false,
            attempted: vol.upload_attempted_at > 0 || vol.status.is_uploaded(),
            history_before: vol.history_before.clone(),
        })
        .collect();

    ScheduleVerifyInput {
        id: job.id.clone(),
        generation,
        account: job.account.clone(),
        book_id: job.book_id.clone(),
        url: job
            .published_url
            .clone()
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| job.effective_book_url().to_owned()),
        title: job.display_title().to_owned(),
        title_cn: job
            .metadata
            .fields
            .iter()
            .find(|(k, _)| k == "titleCn")
            .map(|(_, v)| v.clone())
            .unwrap_or_default(),
        mode: job.mode,
        expected_count: expected_count(job),
        baseline_count: job.baseline_count.unwrap_or(job.baseline.len()),
        published: job.published_url.as_deref().is_some_and(|s| !s.is_empty()),
        publication_attempted: job.publish_attempted_at > 0 || job.publish_accepted,
        rejected: job.rejected,
        failed_stage: job.failed_stage,
        uploaded_at: job.uploaded_at,
        volumes,
    }
}

struct CoordinatorIo<'a> {
    coordinator: &'a UploadCoordinator,
    transport: &'a mut dyn UploadHttpTransport,
    clock: &'a dyn Clock,
    cancel: &'a ReadCancellation,
    on_transfer: &'a mut dyn FnMut(u64, u64),
}

impl CoordinatorIo<'_> {
    fn build_verify_input(&self, job: &UploadJob, generation: String) -> ScheduleVerifyInput {
        build_verify_input_for_job(job, generation)
    }
}

impl UploadIo for CoordinatorIo<'_> {
    fn save(&mut self, job: &UploadJob) -> Result<(), CoreError> {
        self.coordinator.store.save_running_progress(job)?;
        Ok(())
    }

    fn authorize(&mut self, job: &UploadJob) -> Result<(), CoreError> {
        self.cancel.check()?;
        let encoded = percent_encode_component(&job.account);
        let url = format!(
            "https://{}/user/{encoded}/works?start=0",
            self.coordinator.allowed_host
        );
        let html = self.transport.get_html(&url, self.cancel)?;
        self.cancel.check()?;
        if parse_current_account(&html, &self.coordinator.allowed_host) != job.account {
            return Err("Tài khoản đã thay đổi. Đăng nhập lại đúng ID trước khi gửi.".into());
        }
        Ok(())
    }

    fn chapters(
        &mut self,
        chapter_ids: &[String],
        job: &UploadJob,
    ) -> Result<Vec<ChapterRef>, CoreError> {
        let pinned = job.chapters.as_deref().unwrap_or(&[]);
        let mut seen = HashSet::with_capacity(chapter_ids.len());
        let mut out = Vec::with_capacity(chapter_ids.len());
        for id in chapter_ids {
            if !seen.insert(id.as_str()) {
                return Err("Danh sách chương trong quyển bị trùng ID.".into());
            }
            let meta = pinned
                .iter()
                .find(|c| c.id == *id)
                .ok_or("Thiếu thông tin chương trong bản nháp.")?;
            let actual_len = self.coordinator.objects.len(id)?;
            let mut item = meta.clone();
            item.bytes = actual_len;
            out.push(item);
        }
        Ok(out)
    }

    fn before_write(
        &mut self,
        job: &mut UploadJob,
        volume_index: usize,
        action: WriteAction,
    ) -> Result<(), CoreError> {
        self.cancel.check()?;
        if action == WriteAction::Upload && !job.book_id.is_empty() {
            let mut reader_transport = TransportReadAdapter(self.transport);
            let snap =
                VerificationReader::new(&mut reader_transport, &self.coordinator.allowed_host)
                    .fetch_history(&job.book_id, 10, self.cancel)?;
            job.volumes[volume_index].history_before = Some(HistoryBaseline {
                total: snap.total,
                rows: Vec::new(),
            });
        }
        Ok(())
    }

    fn send_form(&mut self, req: FormRequest) -> Result<TransportReply, CoreError> {
        self.cancel.check()?;
        self.transport.post_form(&req)
    }

    fn send_multipart(&mut self, req: MultipartRequest) -> Result<TransportReply, CoreError> {
        self.cancel.check()?;
        let mut parts = Vec::with_capacity(req.parts.len());
        let mut payload_sum = 0u64;

        for spec in req.parts {
            match spec {
                PartSpec::Text { name, value } => {
                    payload_sum = payload_sum.saturating_add(value.len() as u64);
                    parts.push(MultipartPart::text(name, value));
                }
                PartSpec::File {
                    name,
                    file_id,
                    filename,
                    content_type,
                } => {
                    let path = self.coordinator.objects.object_path(&file_id)?;
                    if !path.is_file() {
                        return Err("File upload không còn tồn tại.".into());
                    }
                    let part = wiki_upload_file_part(
                        &req.url,
                        &self.coordinator.allowed_host,
                        name,
                        filename,
                        &path,
                        content_type,
                    )?;
                    payload_sum = payload_sum.saturating_add(part.payload_len());
                    parts.push(part);
                }
            }
        }

        if payload_sum > MAX_MULTIPART_PAYLOAD_BYTES {
            return Err("Request upload quá lớn.".into());
        }

        let boundary = generate_object_id("NovelStudio").replace('_', "-");
        let total = content_length(&boundary, &parts)?;
        self.transport
            .post_multipart(&req.url, &boundary, &parts, total, self.on_transfer)
    }

    fn fresh_metadata(&mut self, job: &UploadJob) -> Result<JobMetadata, CoreError> {
        Ok(job.metadata.clone())
    }

    fn verify(&mut self, _job: &UploadJob) -> Result<bool, CoreError> {
        Ok(true)
    }

    fn has_schedule_verify(&self) -> bool {
        true
    }

    fn schedule_verify(&mut self, job: &UploadJob) -> Result<ScheduledVerify, CoreError> {
        let generation = generate_object_id("gen");
        let input = self.build_verify_input(job, generation);
        let rec = self
            .coordinator
            .ledger
            .schedule(input, self.clock.now_ms())?;
        Ok(ScheduledVerify {
            attempt: rec.attempt,
            next_at: rec.next_at,
        })
    }

    fn has_reconcile_failure(&self) -> bool {
        true
    }

    fn reconcile_failure(&mut self, job: &mut UploadJob) -> Result<(), CoreError> {
        if job.book_id.is_empty() {
            job.status = JobStatus::Uncertain;
            job.verification_message =
                Some("Cần kiểm tra trên server trước khi gửi lại.".to_owned());
            self.save(job)?;
            return Ok(());
        }
        let generation = generate_object_id("gen");
        let input = self.build_verify_input(job, generation);
        let rec = self
            .coordinator
            .ledger
            .schedule(input, self.clock.now_ms())?;
        job.status = JobStatus::Waiting;
        job.next_verify_at = Some(rec.next_at);
        job.verification_message = Some(rec.message);
        self.save(job)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::upload::backup_zip::{export_job_recovery_zip, restore_job_backup_zip};
    use crate::upload::html::guard_read_html;
    use crate::upload::model::VolumePlan;
    use crate::upload::multipart::{UTF8_BOM, write_multipart};
    use crate::upload::protocol::parse_https_url;
    use crate::upload::recovery::build_recovery_plan;
    use std::io::{BufRead, BufReader, Read, Write};
    use std::net::{Shutdown, TcpListener, TcpStream};
    use std::sync::{Arc, Mutex};
    use std::thread;
    use std::time::Duration;
    use tempfile::tempdir;

    const BOOK_ID: &str = "0123456789abcdef01234567";

    struct FixedClock(u64);

    impl Clock for FixedClock {
        fn now_ms(&self) -> u64 {
            self.0
        }
    }

    #[derive(Default)]
    struct MockServerState {
        drop_next_upload_reply: bool,
        chapter_count: usize,
        published: bool,
        upload_bodies: Vec<Vec<u8>>,
        history: Vec<(&'static str, String)>,
        requests: Vec<(String, String)>,
        shutdown: bool,
    }

    struct MockTcpServer {
        port: u16,
        state: Arc<Mutex<MockServerState>>,
        handle: Option<thread::JoinHandle<()>>,
    }

    impl MockTcpServer {
        fn start() -> Self {
            let listener = TcpListener::bind("127.0.0.1:0").expect("bind");
            listener.set_nonblocking(true).expect("nonblocking");
            let port = listener.local_addr().expect("addr").port();
            let state = Arc::new(Mutex::new(MockServerState::default()));
            let state_bg = Arc::clone(&state);

            let handle = thread::spawn(move || {
                loop {
                    if state_bg.lock().expect("lock").shutdown {
                        break;
                    }
                    match listener.accept() {
                        Ok((stream, _)) => {
                            let _ = stream.set_nonblocking(false);
                            let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
                            let _ = stream.set_write_timeout(Some(Duration::from_secs(5)));
                            handle_http_conn(stream, &state_bg);
                        }
                        Err(err) if err.kind() == std::io::ErrorKind::WouldBlock => {
                            thread::sleep(Duration::from_millis(10));
                        }
                        Err(_) => break,
                    }
                }
            });

            Self {
                port,
                state,
                handle: Some(handle),
            }
        }
    }

    impl Drop for MockTcpServer {
        fn drop(&mut self) {
            self.state.lock().expect("lock").shutdown = true;
            if let Some(handle) = self.handle.take() {
                let _ = handle.join();
            }
        }
    }

    fn handle_http_conn(mut stream: TcpStream, state: &Arc<Mutex<MockServerState>>) {
        let mut reader = BufReader::new(stream.try_clone().expect("clone"));
        let mut request_line = String::new();
        if reader.read_line(&mut request_line).unwrap_or(0) == 0 {
            return;
        }
        let mut parts = request_line.split_whitespace();
        let method = parts.next().unwrap_or("").to_owned();
        let path_query = parts.next().unwrap_or("/").to_owned();

        let mut content_len = 0usize;
        loop {
            let mut line = String::new();
            if reader.read_line(&mut line).unwrap_or(0) == 0 {
                break;
            }
            let trimmed = line.trim_end_matches(['\r', '\n']);
            if trimmed.is_empty() {
                break;
            }
            if let Some((k, v)) = trimmed.split_once(':')
                && k.eq_ignore_ascii_case("content-length")
            {
                content_len = v.trim().parse().unwrap_or(0);
            }
        }

        let mut body = vec![0u8; content_len];
        if content_len > 0 && reader.read_exact(&mut body).is_err() {
            return;
        }

        let path = path_query.split('?').next().unwrap_or("/");
        let mut st = state.lock().expect("lock");
        st.requests.push((method.clone(), path_query.clone()));

        let reply_body = match (method.as_str(), path) {
            ("GET", p) if p.starts_with("/user/") && p.ends_with("/works") => {
                let card = if st.published {
                    format!(
                        "<div class='book-info'><input name='bookId' value='{BOOK_ID}'><a class='book-title' href='/truyen/test'>Truyện</a><span class='book-chapter-count'>{}</span></div>",
                        st.chapter_count
                    )
                } else {
                    String::new()
                };
                format!(
                    "<nav><a href='/user/reader'>Hồ sơ của tôi</a></nav><div class='book-list'>{card}</div>"
                )
            }
            ("GET", "/history") => {
                let mut html = String::from("<ul class='report-history-list'>");
                for (acc, msg) in st.history.iter().rev() {
                    html.push_str(&format!(
                        "<li><div class='report-message'><a href='/user/{acc}'>Tên</a> {msg}</div></li>"
                    ));
                }
                html.push_str("</ul>");
                html
            }
            ("POST", "/volume") => {
                format!(
                    r#"{{"err":0,"data":{{"volume":{{"book":{{"$oid":"{BOOK_ID}"}},"_id":{{"$oid":"vol-remote-1"}}}}}}}}"#
                )
            }
            ("POST", "/upload-content") => {
                st.upload_bodies.push(body);
                st.history
                    .push(("reader", "đã thêm file quyển Chính văn".to_owned()));
                if st.drop_next_upload_reply {
                    st.drop_next_upload_reply = false;
                    let _ = stream.shutdown(Shutdown::Both);
                    return;
                }
                st.chapter_count = 1;
                r#"{"err":0}"#.to_owned()
            }
            ("POST", "/nhung-file") => {
                st.published = true;
                st.history.push(("reader", "đã tạo truyện".to_owned()));
                r#"{"err":0,"data":{"link":"/truyen/test"}}"#.to_owned()
            }
            _ => String::from(r#"{"err":0}"#),
        };
        drop(st);

        let resp = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            reply_body.len(),
            reply_body
        );
        let _ = stream.write_all(resp.as_bytes());
        let _ = stream.flush();
    }

    struct LoopbackTransport {
        port: u16,
    }

    impl LoopbackTransport {
        fn send_raw(
            &self,
            head: String,
            writer_fn: impl FnOnce(&mut TcpStream) -> Result<(), CoreError>,
        ) -> Result<TransportReply, CoreError> {
            let mut stream = TcpStream::connect(("127.0.0.1", self.port))?;
            stream.set_read_timeout(Some(Duration::from_secs(5)))?;
            stream.set_write_timeout(Some(Duration::from_secs(5)))?;
            stream.write_all(head.as_bytes())?;
            writer_fn(&mut stream)?;
            stream.flush()?;

            let mut raw = Vec::new();
            stream.read_to_end(&mut raw)?;
            if raw.is_empty() {
                return Err("Mất kết nối trước khi server phản hồi.".into());
            }
            let text = String::from_utf8(raw)?;
            let Some((headers_part, body)) = text.split_once("\r\n\r\n") else {
                return Err("Phản hồi HTTP không hợp lệ.".into());
            };
            let status_line = headers_part.lines().next().unwrap_or("");
            let status: u16 = status_line
                .split_whitespace()
                .nth(1)
                .and_then(|s| s.parse().ok())
                .ok_or("Thiếu HTTP status.")?;
            Ok(TransportReply {
                status,
                body: body.to_owned(),
            })
        }

        fn path_with_suffix(url: &str) -> Result<String, CoreError> {
            let parsed = parse_https_url(url)?;
            Ok(format!("{}{}", parsed.path, parsed.suffix))
        }
    }

    impl UploadHttpTransport for LoopbackTransport {
        fn get_html(
            &mut self,
            url: &str,
            cancel: &ReadCancellation,
        ) -> Result<String, VerifierError> {
            cancel.check()?;
            let path = Self::path_with_suffix(url)?;
            let req =
                format!("GET {path} HTTP/1.1\r\nHost: wikicv.org\r\nConnection: close\r\n\r\n");
            let reply = self
                .send_raw(req, |_| Ok(()))
                .map_err(|e| VerifierError::Failed(e.to_string()))?;
            cancel.check()?;
            let checked = guard_read_html(reply.status, url, &reply.body)
                .map_err(|e| VerifierError::Failed(e.to_string()))?;
            Ok(checked.to_owned())
        }

        fn post_form(&mut self, req: &FormRequest) -> Result<TransportReply, CoreError> {
            let path = Self::path_with_suffix(&req.url)?;
            let encoded: Vec<String> = req
                .fields
                .iter()
                .map(|(k, v)| {
                    format!(
                        "{}={}",
                        percent_encode_component(k),
                        percent_encode_component(v)
                    )
                })
                .collect();
            let body = encoded.join("&");
            let head = format!(
                "POST {path} HTTP/1.1\r\nHost: wikicv.org\r\nContent-Type: application/x-www-form-urlencoded; charset=UTF-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                body.len()
            );
            self.send_raw(head, |stream| {
                stream.write_all(body.as_bytes())?;
                Ok(())
            })
        }

        fn post_multipart(
            &mut self,
            url: &str,
            boundary: &str,
            parts: &[MultipartPart],
            total_bytes: u64,
            on_progress: &mut dyn FnMut(u64, u64),
        ) -> Result<TransportReply, CoreError> {
            let path = Self::path_with_suffix(url)?;
            let head = format!(
                "POST {path} HTTP/1.1\r\nHost: wikicv.org\r\nContent-Type: multipart/form-data; boundary={boundary}\r\nContent-Length: {total_bytes}\r\nConnection: close\r\n\r\n"
            );
            self.send_raw(head, |stream| {
                write_multipart(stream, boundary, parts, |sent| {
                    on_progress(sent, total_bytes)
                })?;
                Ok(())
            })
        }
    }

    fn make_job(id: &str) -> UploadJob {
        UploadJob {
            id: id.into(),
            account: "reader".into(),
            mode: JobMode::New,
            status: JobStatus::Planned,
            cleanup_chosen_at: Some(1),
            metadata: JobMetadata {
                fields: vec![
                    ("titleVi".into(), "Truyện thử".into()),
                    ("titleCn".into(), "测试小说".into()),
                    ("authorCn".into(), "作者".into()),
                ],
                ..Default::default()
            },
            chapters: Some(vec![ChapterRef {
                id: "ch1".into(),
                title: "第1章 Bắt đầu".into(),
                number: Some(1),
                bytes: 0,
                ..Default::default()
            }]),
            volumes: vec![VolumePlan {
                key: "v1".into(),
                name: "Chính văn".into(),
                chapter_ids: vec!["ch1".into()],
                status: VolumeStatus::Planned,
                ..Default::default()
            }],
            ..Default::default()
        }
    }

    #[test]
    fn happy_path_tcp_loopback_streams_bom_without_mutating_source_and_verifies() {
        let dir = tempdir().expect("tempdir");
        let coordinator = UploadCoordinator::new(dir.path().to_path_buf());
        let source_bytes = "第1章 Bắt đầu\nNội dung tiếng Việt 😀".as_bytes();
        coordinator
            .objects()
            .put_bytes("ch1", source_bytes)
            .expect("put");
        assert!(!source_bytes.starts_with(&UTF8_BOM));

        let mut job = make_job("job-happy");
        if let Some(chs) = &mut job.chapters {
            chs[0].bytes = source_bytes.len() as u64;
        }
        coordinator.store().save_jobs(vec![job]).expect("save");
        coordinator
            .store()
            .schedule_job("job-happy", 50_000, 10_000, false)
            .expect("schedule");
        coordinator
            .store()
            .claim_next_ready(50_000, &HashSet::new(), None)
            .expect("claim")
            .expect("claimed");

        let server = MockTcpServer::start();
        let mut transport = LoopbackTransport { port: server.port };
        let clock = FixedClock(50_000);
        let cancel = ReadCancellation::new();
        let mut transfer_ticks = Vec::new();

        let after_run = coordinator
            .run_job(
                "job-happy",
                &mut transport,
                &clock,
                &cancel,
                |sent, total| {
                    transfer_ticks.push((sent, total));
                },
            )
            .expect("run ok");
        assert_eq!(after_run.status, JobStatus::Waiting);
        assert_eq!(
            after_run.published_url.as_deref(),
            Some("https://wikicv.org/truyen/test")
        );
        assert!(!transfer_ticks.is_empty());
        assert_eq!(transfer_ticks.last().map(|(s, t)| s == t), Some(true));

        // Kiểm tra nguồn trên đĩa vẫn nguyên bản không BOM, còn payload trên TCP có đúng 1 BOM.
        assert_eq!(
            coordinator.objects().read_bytes("ch1").expect("orig"),
            source_bytes
        );
        {
            let st = server.state.lock().expect("lock");
            assert_eq!(st.upload_bodies.len(), 1);
            let mut needle = UTF8_BOM.to_vec();
            needle.extend_from_slice(source_bytes);
            assert!(
                st.upload_bodies[0]
                    .windows(needle.len())
                    .any(|w| w == needle.as_slice())
            );
        }

        // Đến hạn đối chiếu -> xác nhận Complete và đồng bộ về UploadStore.
        let verify_clock = FixedClock(120_000);
        let verified = coordinator
            .run_due_verifications(&mut transport, &verify_clock, &cancel, None)
            .expect("verify");
        assert_eq!(verified.len(), 1);
        assert_eq!(verified[0].status, JobStatus::Complete);

        let jobs = coordinator.store().load_jobs().expect("load");
        assert_eq!(jobs[0].status, JobStatus::Complete);
        assert_eq!(jobs[0].volumes[0].status, VolumeStatus::Verified);
    }

    #[test]
    fn lost_tcp_reply_never_retries_and_recovers_from_history_to_complete() {
        let dir = tempdir().expect("tempdir");
        let coordinator = UploadCoordinator::new(dir.path().to_path_buf());
        coordinator
            .objects()
            .put_utf8("ch1", "Nội dung chương")
            .expect("put");

        let mut job = make_job("job-drop");
        job.book_id = BOOK_ID.into();
        if let Some(chs) = &mut job.chapters {
            chs[0].bytes = coordinator.objects().len("ch1").expect("len");
        }
        coordinator.store().save_jobs(vec![job]).expect("save");

        let server = MockTcpServer::start();
        server.state.lock().expect("lock").drop_next_upload_reply = true;

        let mut transport = LoopbackTransport { port: server.port };
        let clock = FixedClock(50_000);
        let cancel = ReadCancellation::new();

        // Khi rớt kết nối ở /upload-content, coordinator bàn giao đối chiếu (trả Ok, status = Waiting)
        // và KHÔNG tự retry request ghi.
        let after_drop = coordinator
            .run_job("job-drop", &mut transport, &clock, &cancel, |_, _| {})
            .expect("reconciled handoff");
        assert!(after_drop.write_attempted);
        assert_eq!(after_drop.status, JobStatus::Waiting);
        assert_eq!(server.state.lock().expect("lock").upload_bodies.len(), 1);

        // Chặn chạy lại khi đang chờ đối chiếu.
        let mut stored_job = coordinator.store().load_jobs().expect("load").remove(0);
        assert!(
            UploadEngine::default()
                .run(
                    &mut stored_job,
                    &mut CoordinatorIo {
                        coordinator: &coordinator,
                        transport: &mut transport,
                        clock: &clock,
                        cancel: &cancel,
                        on_transfer: &mut |_, _| {},
                    },
                    &clock,
                )
                .is_err()
        );

        // Lần đối chiếu 1: server chưa cập nhật count (0) nhưng đã ghi nhận trong /history!
        let check_clock_1 = FixedClock(250_000);
        let pass1 = coordinator
            .run_due_verifications(&mut transport, &check_clock_1, &cancel, None)
            .expect("pass1");
        assert!(pass1[0].volumes[0].received);
        assert!(pass1[0].volumes[0].confirmed_by_history);

        // Server xử lý xong: hiện truyện trên Works với 1 chương.
        {
            let mut st = server.state.lock().expect("lock");
            st.published = true;
            st.chapter_count = 1;
        }
        let check_clock_2 = FixedClock(check_clock_1.0 + 3_600_000);
        let pass2 = coordinator
            .run_due_verifications(&mut transport, &check_clock_2, &cancel, None)
            .expect("pass2");
        assert_eq!(pass2[0].status, JobStatus::Complete);
        assert_eq!(server.state.lock().expect("lock").upload_bodies.len(), 1);

        // Backup & restore ZIP từ job thật trong UploadStore + ObjectStore.
        let final_jobs = coordinator.store().load_jobs().expect("load");
        let plan = build_recovery_plan(&final_jobs[0], &[], |id| coordinator.objects().exists(id));
        let zip_path = dir.path().join("job-backup.zip");
        export_job_recovery_zip(&zip_path, &plan, coordinator.objects()).expect("export zip");
        let restored_ws = ObjectStore::new(dir.path().join("fresh_ws"));
        let restored = restore_job_backup_zip(&zip_path, &restored_ws, DEFAULT_WIKI_HOST)
            .expect("restore zip");
        assert_eq!(restored.chapters.len(), 1);
        assert_eq!(
            restored_ws
                .read_utf8(&restored.chapters[0].id)
                .expect("read"),
            "Nội dung chương"
        );
    }
}
