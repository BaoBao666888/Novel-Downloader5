use std::collections::HashSet;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::CoreError;
use crate::upload::engine::Clock;
use crate::upload::html::parse_current_account;
use crate::upload::model::{JobStatus, UploadJob, UploadStage, stage_label};
use crate::upload::objects::generate_object_id;
use crate::upload::protocol::DEFAULT_WIKI_HOST;
use crate::upload::reconcile::{ReconcileRecord, is_valid_hex_book_id_str};
use crate::upload::runner::{UploadCoordinator, UploadHttpTransport, build_verify_input_for_job};
use crate::upload::verifier::{ReadCancellation, VerifierError};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveRunProgress {
    pub job_id: String,
    pub title: String,
    pub stage: UploadStage,
    pub phase: String,
    pub bytes: u64,
    pub total: u64,
    pub percent: u8,
    pub active: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionCheckResult {
    pub authenticated: bool,
    pub account: String,
    pub host: String,
    pub message: String,
}

/// Điều phối chạy upload tức thì, lịch hẹn và đối chiếu live dùng chung Desktop & Android.
pub struct UploadWorker {
    coordinator: UploadCoordinator,
}

impl UploadWorker {
    pub fn new(workspace_dir: PathBuf) -> Self {
        Self {
            coordinator: UploadCoordinator::new(workspace_dir),
        }
    }

    pub fn with_allowed_host(mut self, allowed_host: impl Into<String>) -> Self {
        self.coordinator = self.coordinator.with_allowed_host(allowed_host);
        self
    }

    pub fn coordinator(&self) -> &UploadCoordinator {
        &self.coordinator
    }

    /// Kiểm tra phiên đăng nhập hiện tại trên WikiCV bằng request chỉ-đọc `GET /`.
    pub fn check_session(
        &self,
        transport: &mut dyn UploadHttpTransport,
        cancel: &ReadCancellation,
    ) -> Result<SessionCheckResult, CoreError> {
        let host = self.coordinator.allowed_host().to_owned();
        let url = format!("https://{host}/");
        let html = match transport.get_html(&url, cancel) {
            Ok(html) => html,
            Err(VerifierError::Canceled) => return Err("Đã hủy kiểm tra phiên.".into()),
            Err(VerifierError::Failed(msg)) => {
                if msg.contains("hết hạn") || msg.contains("xác thực") {
                    return Ok(SessionCheckResult {
                        authenticated: false,
                        account: String::new(),
                        host,
                        message: msg,
                    });
                }
                return Err(msg.into());
            }
        };

        let account = parse_current_account(&html, &host);
        if account.is_empty() {
            return Ok(SessionCheckResult {
                authenticated: false,
                account,
                host,
                message: "Chưa thấy phiên đăng nhập. Hãy dán Cookie hợp lệ rồi thử lại.".to_owned(),
            });
        }

        Ok(SessionCheckResult {
            authenticated: true,
            account: account.clone(),
            host,
            message: format!("Đã xác thực tài khoản {account}."),
        })
    }

    /// Khởi chạy ngay một công việc `Planned` hoặc `Failed`, giữ nguyên rào chống trùng & không auto-retry ghi.
    #[allow(clippy::too_many_arguments)]
    pub fn start_job_now<F>(
        &self,
        job_id: &str,
        expected_revision: u64,
        consent_ids: &HashSet<String>,
        transport: &mut dyn UploadHttpTransport,
        clock: &dyn Clock,
        cancel: &ReadCancellation,
        mut on_progress: F,
    ) -> Result<UploadJob, CoreError>
    where
        F: FnMut(LiveRunProgress),
    {
        self.coordinator.store().recover_after_crash()?;
        let queued = self.coordinator.store().start_now(
            job_id,
            expected_revision,
            consent_ids,
            clock.now_ms(),
        )?;
        let title = queued.display_title().to_owned();

        on_progress(LiveRunProgress {
            job_id: job_id.to_owned(),
            title: title.clone(),
            stage: queued.stage,
            phase: stage_label(queued.stage).to_owned(),
            bytes: 0,
            total: 0,
            percent: 0,
            active: true,
        });

        let verified = self.coordinator.ledger().confirmed_ids()?;
        let Some(_claimed) =
            self.coordinator
                .store()
                .claim_next_ready(clock.now_ms(), &verified, Some(job_id))?
        else {
            let _ = self.coordinator.store().finish_job(job_id, false);
            return Err("Công việc chưa sẵn sàng nhận lượt chạy.".into());
        };

        let result = self
            .coordinator
            .run_job(job_id, transport, clock, cancel, |bytes, total| {
                let percent = if total > 0 {
                    ((bytes.saturating_mul(100)) / total).min(100) as u8
                } else {
                    0
                };
                on_progress(LiveRunProgress {
                    job_id: job_id.to_owned(),
                    title: title.clone(),
                    stage: UploadStage::Upload,
                    phase: "Đang tải chương lên".to_owned(),
                    bytes,
                    total,
                    percent,
                    active: true,
                });
            });

        let latest = self
            .coordinator
            .store()
            .load_jobs()?
            .into_iter()
            .find(|j| j.id == job_id);

        if let Some(ref job) = latest {
            on_progress(LiveRunProgress {
                job_id: job.id.clone(),
                title: job.display_title().to_owned(),
                stage: job.stage,
                phase: stage_label(job.stage).to_owned(),
                bytes: 0,
                total: 0,
                percent: if job.status == JobStatus::Complete || job.status == JobStatus::Waiting {
                    100
                } else {
                    0
                },
                active: false,
            });
        }

        match result {
            Ok(job) => Ok(job),
            Err(err) => Err(err),
        }
    }

    /// Chạy đối chiếu chỉ-đọc ngay cho một job `Waiting`/`Uncertain` theo sổ hoặc tạo mới mục đối chiếu nếu có `book_id`.
    pub fn verify_job_now(
        &self,
        job_id: &str,
        transport: &mut dyn UploadHttpTransport,
        clock: &dyn Clock,
        cancel: &ReadCancellation,
    ) -> Result<Option<ReconcileRecord>, CoreError> {
        let now_ms = clock.now_ms();
        let job = self
            .coordinator
            .store()
            .load_jobs()?
            .into_iter()
            .find(|j| j.id == job_id)
            .ok_or("Công việc không tồn tại.")?;

        if job.status == JobStatus::Complete {
            return Ok(self
                .coordinator
                .ledger()
                .records()?
                .into_iter()
                .find(|r| r.id == job_id));
        }

        if !self.coordinator.ledger().bump_due_now(job_id, now_ms)? {
            if job.account.trim().is_empty()
                || !is_valid_hex_book_id_str(&job.book_id)
                || !job.write_attempted
            {
                return Err(
                    "Công việc chưa có ID truyện hợp lệ trên server; hãy kiểm tra thủ công hoặc sao lưu ZIP."
                        .into(),
                );
            }
            let input = build_verify_input_for_job(&job, generate_object_id("gen"));
            self.coordinator.ledger().schedule(input, now_ms)?;
            self.coordinator.ledger().bump_due_now(job_id, now_ms)?;
        }

        let updated = self
            .coordinator
            .run_due_verifications(transport, clock, cancel, Some(job_id))
            .map_err(|err| -> CoreError { err.to_string().into() })?;
        Ok(updated.into_iter().find(|r| r.id == job_id))
    }

    pub fn run_due_verifications(
        &self,
        transport: &mut dyn UploadHttpTransport,
        clock: &dyn Clock,
        cancel: &ReadCancellation,
    ) -> Result<Vec<ReconcileRecord>, CoreError> {
        self.coordinator
            .run_due_verifications(transport, clock, cancel, None)
            .map_err(|err| -> CoreError { err.to_string().into() })
    }

    /// Nhận và chạy tối đa 1 lịch hẹn đến hạn tiếp theo (tôn trọng chống trùng & parent link).
    pub fn run_next_due_scheduled<F>(
        &self,
        transport: &mut dyn UploadHttpTransport,
        clock: &dyn Clock,
        cancel: &ReadCancellation,
        mut on_progress: F,
    ) -> Result<Option<UploadJob>, CoreError>
    where
        F: FnMut(LiveRunProgress),
    {
        self.coordinator.store().recover_after_crash()?;
        let verified = self.coordinator.ledger().confirmed_ids()?;
        let Some(job) =
            self.coordinator
                .store()
                .claim_next_ready(clock.now_ms(), &verified, None)?
        else {
            return Ok(None);
        };

        let job_id = job.id.clone();
        let title = job.display_title().to_owned();
        on_progress(LiveRunProgress {
            job_id: job_id.clone(),
            title: title.clone(),
            stage: job.stage,
            phase: stage_label(job.stage).to_owned(),
            bytes: 0,
            total: 0,
            percent: 0,
            active: true,
        });

        let run_res =
            self.coordinator
                .run_job(&job_id, transport, clock, cancel, |bytes, total| {
                    let percent = if total > 0 {
                        ((bytes.saturating_mul(100)) / total).min(100) as u8
                    } else {
                        0
                    };
                    on_progress(LiveRunProgress {
                        job_id: job_id.clone(),
                        title: title.clone(),
                        stage: UploadStage::Upload,
                        phase: "Đang tải chương lên".to_owned(),
                        bytes,
                        total,
                        percent,
                        active: true,
                    });
                });

        on_progress(LiveRunProgress {
            job_id: job_id.clone(),
            title,
            stage: UploadStage::Verify,
            phase: "Hoàn tất lượt chạy".to_owned(),
            bytes: 0,
            total: 0,
            percent: 100,
            active: false,
        });

        run_res.map(Some)
    }
}

pub fn make_default_host() -> String {
    DEFAULT_WIKI_HOST.to_owned()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::upload::model::JobMode;
    use crate::upload::multipart::{CreditPosition, UTF8_BOM};
    use crate::upload::session::{LoopbackHttpTransport, SessionCookieJar};
    use crate::upload::workspace::{CreateJobInput, UploadWorkspace};
    use std::fs;
    use std::io::{BufRead, BufReader, Read, Write};
    use std::net::TcpListener;
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
    struct ServerState {
        authed: bool,
        upload_count: usize,
        last_cookie: String,
        uploaded_body: Vec<u8>,
        published: bool,
        history: Vec<String>,
        shutdown: bool,
    }

    struct MockServer {
        port: u16,
        state: Arc<Mutex<ServerState>>,
        handle: Option<thread::JoinHandle<()>>,
    }

    impl MockServer {
        fn start() -> Self {
            let listener = TcpListener::bind("127.0.0.1:0").expect("bind");
            listener.set_nonblocking(true).expect("nb");
            let port = listener.local_addr().expect("addr").port();
            let state = Arc::new(Mutex::new(ServerState {
                authed: true,
                ..Default::default()
            }));
            let bg = Arc::clone(&state);
            let handle = thread::spawn(move || {
                while !bg.lock().expect("lock").shutdown {
                    match listener.accept() {
                        Ok((mut stream, _)) => {
                            let _ = stream.set_nonblocking(false);
                            let mut reader = BufReader::new(stream.try_clone().expect("clone"));
                            let mut req_line = String::new();
                            if reader.read_line(&mut req_line).unwrap_or(0) == 0 {
                                continue;
                            }
                            let mut parts = req_line.split_whitespace();
                            let method = parts.next().unwrap_or("").to_owned();
                            let path_q = parts.next().unwrap_or("/").to_owned();
                            let path = path_q.split('?').next().unwrap_or("/").to_owned();

                            let mut len = 0usize;
                            let mut cookie_seen = String::new();
                            loop {
                                let mut line = String::new();
                                if reader.read_line(&mut line).unwrap_or(0) == 0 {
                                    break;
                                }
                                let t = line.trim_end_matches(['\r', '\n']);
                                if t.is_empty() {
                                    break;
                                }
                                if let Some((k, v)) = t.split_once(':') {
                                    if k.eq_ignore_ascii_case("content-length") {
                                        len = v.trim().parse().unwrap_or(0);
                                    } else if k.eq_ignore_ascii_case("cookie") {
                                        cookie_seen = v.trim().to_owned();
                                    }
                                }
                            }
                            let mut body = vec![0u8; len];
                            if len > 0 {
                                let _ = reader.read_exact(&mut body);
                            }

                            let mut st = bg.lock().expect("lock");
                            if !cookie_seen.is_empty() {
                                st.last_cookie = cookie_seen;
                            }
                            let reply = match (method.as_str(), path.as_str()) {
                                ("GET", "/") => {
                                    if st.authed {
                                        "<nav><a href='/user/bao'>Hồ sơ của tôi</a></nav>"
                                            .to_owned()
                                    } else {
                                        "<div>Guest</div>".to_owned()
                                    }
                                }
                                ("GET", p) if p.starts_with("/user/") && p.ends_with("/works") => {
                                    let card = if st.published {
                                        format!(
                                            "<div class='book-info'><input name='bookId' value='{BOOK_ID}'><a class='book-title' href='/truyen/test'>Truyện</a><span class='book-chapter-count'>2</span></div>"
                                        )
                                    } else {
                                        String::new()
                                    };
                                    format!(
                                        "<nav><a href='/user/bao'>Hồ sơ của tôi</a></nav><div class='book-list'>{card}</div>"
                                    )
                                }
                                ("GET", "/history") => {
                                    let items: String = st
                                        .history
                                        .iter()
                                        .rev()
                                        .map(|m| format!("<li><div class='report-message'><a href='/user/bao'>Bao</a> {m}</div></li>"))
                                        .collect();
                                    format!("<ul class='report-history-list'>{items}</ul>")
                                }
                                ("POST", "/volume") => {
                                    format!(
                                        r#"{{"err":0,"data":{{"volume":{{"book":{{"$oid":"{BOOK_ID}"}},"_id":{{"$oid":"vol-1"}}}}}}}}"#
                                    )
                                }
                                ("POST", "/upload-content") => {
                                    st.upload_count += 1;
                                    st.uploaded_body = body;
                                    st.history.push("đã thêm file quyển Chính văn".to_owned());
                                    r#"{"err":0}"#.to_owned()
                                }
                                ("POST", "/nhung-file") => {
                                    st.published = true;
                                    st.history.push("đã tạo truyện".to_owned());
                                    r#"{"err":0,"data":{"link":"/truyen/test"}}"#.to_owned()
                                }
                                _ => "{}".to_owned(),
                            };
                            let resp = format!(
                                "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                                reply.len(),
                                reply
                            );
                            let _ = stream.write_all(resp.as_bytes());
                        }
                        Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
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

    impl Drop for MockServer {
        fn drop(&mut self) {
            self.state.lock().expect("lock").shutdown = true;
            if let Some(h) = self.handle.take() {
                let _ = h.join();
            }
        }
    }

    #[test]
    fn worker_checks_session_streams_bom_upload_and_verifies_without_duplicate_writes() {
        let dir = tempdir().expect("dir");
        let ch_dir = dir.path().join("chapters");
        fs::create_dir(&ch_dir).expect("mkdir");
        fs::write(ch_dir.join("001-Chương 1.txt"), "Nội dung 1").expect("c1");
        fs::write(ch_dir.join("002-Chương 2.txt"), "Nội dung 2").expect("c2");

        let ws_dir = dir.path().join("ws");
        let workspace = UploadWorkspace::new(ws_dir.clone());
        let job = workspace
            .create_planned_job(
                CreateJobInput {
                    folder: ch_dir.display().to_string(),
                    mode: JobMode::New,
                    account: "bao".into(),
                    title_vi: "Truyện Worker".into(),
                    title_cn: "测试".into(),
                    author_cn: "作者".into(),
                    desc_vi: "Mô tả".into(),
                    book_url: String::new(),
                    volume_name: "Chính văn".into(),
                    volume_note: String::new(),
                    append: false,
                    credit_text: String::new(),
                    credit_position: CreditPosition::End,
                },
                1_000,
            )
            .expect("create");

        let srv = MockServer::start();
        let jar = SessionCookieJar::from_cookie_header("sid=demo_cookie", DEFAULT_WIKI_HOST);
        let mut transport = LoopbackHttpTransport::new(
            &format!("http://127.0.0.1:{}", srv.port),
            DEFAULT_WIKI_HOST,
            jar,
        )
        .expect("transport");

        let worker = UploadWorker::new(ws_dir.clone());
        let cancel = ReadCancellation::new();
        let sess = worker.check_session(&mut transport, &cancel).expect("sess");
        assert!(sess.authenticated);
        assert_eq!(sess.account, "bao");

        let mut progress_events = Vec::new();
        let uploaded = worker
            .start_job_now(
                &job.id,
                job.schedule_revision,
                &HashSet::new(),
                &mut transport,
                &FixedClock(10_000),
                &cancel,
                |ev| progress_events.push(ev),
            )
            .expect("start ok");
        assert_eq!(uploaded.status, JobStatus::Waiting);
        assert!(!progress_events.is_empty());

        let rec = worker
            .verify_job_now(&job.id, &mut transport, &FixedClock(50_000), &cancel)
            .expect("verify")
            .expect("record");
        assert_eq!(rec.status, JobStatus::Complete);

        let snap = UploadWorkspace::new(ws_dir).snapshot().expect("snap");
        assert_eq!(snap.jobs[0].status, JobStatus::Complete);

        let st = srv.state.lock().expect("lock");
        assert_eq!(st.upload_count, 1);
        assert_eq!(st.last_cookie, "sid=demo_cookie");
        assert!(st.uploaded_body.windows(3).any(|w| w == UTF8_BOM));
        assert_eq!(
            fs::read_to_string(ch_dir.join("001-Chương 1.txt")).expect("c1"),
            "Nội dung 1"
        );
    }
}
