use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use novel_studio_core::upload::engine::SystemClock;
use novel_studio_core::upload::protocol::DEFAULT_WIKI_HOST;
use novel_studio_core::upload::store::UploadStore;
use novel_studio_core::upload::verifier::ReadCancellation;
use novel_studio_core::upload::worker::{LiveRunProgress, UploadWorker};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};

use crate::secret_store::SessionSecretStore;
use crate::winhttp_transport::{is_mock_transport_enabled, open_desktop_transport};

const PROGRESS_EVENT: &str = "upload-progress";

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadRuntimeStatus {
    pub active_run: Option<LiveRunProgress>,
    pub auto_schedule_enabled: bool,
    pub last_message: Option<String>,
    pub last_error: Option<String>,
    pub verified_account: Option<String>,
    pub mock_mode: bool,
}

#[derive(Default)]
struct RuntimeInner {
    active_run: Option<LiveRunProgress>,
    last_message: Option<String>,
    last_error: Option<String>,
    verified_account: Option<String>,
}

pub struct UploadRuntime {
    inner: Mutex<RuntimeInner>,
    active_cancel: Mutex<Option<ReadCancellation>>,
    running: AtomicBool,
    auto_schedule_enabled: AtomicBool,
}

impl Default for UploadRuntime {
    fn default() -> Self {
        Self {
            inner: Mutex::new(RuntimeInner::default()),
            active_cancel: Mutex::new(None),
            running: AtomicBool::new(false),
            auto_schedule_enabled: AtomicBool::new(false),
        }
    }
}

impl UploadRuntime {
    pub fn status(&self) -> UploadRuntimeStatus {
        let guard = self.inner.lock().expect("runtime mutex");
        UploadRuntimeStatus {
            active_run: guard.active_run.clone(),
            auto_schedule_enabled: self.auto_schedule_enabled.load(Ordering::SeqCst),
            last_message: guard.last_message.clone(),
            last_error: guard.last_error.clone(),
            verified_account: guard.verified_account.clone(),
            mock_mode: is_mock_transport_enabled(),
        }
    }

    pub fn set_verified_result(&self, account: Option<String>, message: Option<String>) {
        let mut guard = self.inner.lock().expect("runtime mutex");
        guard.verified_account = account;
        guard.last_error = None;
        guard.last_message = message;
    }

    pub fn set_auto_schedule(&self, enabled: bool) -> UploadRuntimeStatus {
        self.auto_schedule_enabled.store(enabled, Ordering::SeqCst);
        self.status()
    }

    pub fn start_immediate(
        &self,
        app: AppHandle,
        workspace_dir: PathBuf,
        id: String,
        revision: u64,
        consent_ids: HashSet<String>,
    ) -> Result<UploadRuntimeStatus, String> {
        let cookie = SessionSecretStore::new(workspace_dir.clone())
            .load()?
            .ok_or_else(|| "Chưa lưu Cookie phiên đăng nhập.".to_owned())?;

        if self
            .running
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .is_err()
        {
            return Err("Đang có một lượt tải lên chạy nền.".into());
        }

        let cancel = ReadCancellation::new();
        {
            let mut inner = self.inner.lock().expect("runtime mutex");
            inner.last_error = None;
            inner.last_message = None;
            inner.active_run = Some(LiveRunProgress {
                job_id: id.clone(),
                title: "Đang chuẩn bị…".to_owned(),
                stage: novel_studio_core::upload::model::UploadStage::Prepare,
                phase: "Chuẩn bị gửi".to_owned(),
                bytes: 0,
                total: 0,
                percent: 0,
                active: true,
            });
            *self.active_cancel.lock().expect("cancel mutex") = Some(cancel.clone());
        }

        let initial_status = self.status();
        std::thread::spawn(move || {
            let outcome = (|| -> Result<String, String> {
                let mut transport = open_desktop_transport(DEFAULT_WIKI_HOST, Some(&cookie))
                    .map_err(|err| err.to_string())?;
                let worker = UploadWorker::new(workspace_dir);
                let job = worker
                    .start_job_now(
                        &id,
                        revision,
                        &consent_ids,
                        &mut transport,
                        &SystemClock,
                        &cancel,
                        |progress| {
                            let state = app.state::<UploadRuntime>();
                            state.update_progress(&app, progress);
                        },
                    )
                    .map_err(|err| err.to_string())?;
                Ok(format!(
                    "Đã hoàn tất bước gửi «{}» · chuyển sang theo dõi đối chiếu.",
                    job.display_title()
                ))
            })();

            let state = app.state::<UploadRuntime>();
            state.finish_run(&app, &id, outcome);
        });

        Ok(initial_status)
    }

    fn update_progress(&self, app: &AppHandle, progress: LiveRunProgress) {
        {
            let mut inner = self.inner.lock().expect("runtime mutex");
            inner.active_run = Some(progress.clone());
        }
        let _ = app.emit(PROGRESS_EVENT, progress);
    }

    fn finish_run(&self, app: &AppHandle, job_id: &str, outcome: Result<String, String>) {
        let final_event = LiveRunProgress {
            job_id: job_id.to_owned(),
            title: String::new(),
            stage: novel_studio_core::upload::model::UploadStage::Verify,
            phase: "Đã dừng lượt chạy".to_owned(),
            bytes: 0,
            total: 0,
            percent: if outcome.is_ok() { 100 } else { 0 },
            active: false,
        };
        {
            let mut inner = self.inner.lock().expect("runtime mutex");
            inner.active_run = None;
            match outcome {
                Ok(msg) => {
                    inner.last_message = Some(msg);
                    inner.last_error = None;
                }
                Err(err) => {
                    inner.last_error = Some(err);
                }
            }
        }
        *self.active_cancel.lock().expect("cancel mutex") = None;
        self.running.store(false, Ordering::SeqCst);
        let _ = app.emit(PROGRESS_EVENT, final_event);
    }

    pub fn stop_active(&self, workspace_dir: PathBuf) -> Result<bool, String> {
        let job_id = {
            let inner = self.inner.lock().expect("runtime mutex");
            inner.active_run.as_ref().map(|r| r.job_id.clone())
        };
        if let Some(cancel) = self.active_cancel.lock().expect("cancel mutex").as_ref() {
            cancel.cancel();
        }
        if let Some(id) = job_id {
            let _ = UploadStore::new(workspace_dir).request_stop(&id);
            Ok(true)
        } else {
            Ok(false)
        }
    }
}

pub fn spawn_scheduler_loop(
    app: AppHandle,
    resolve_dir: fn(&AppHandle) -> Result<PathBuf, String>,
) {
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(Duration::from_secs(15));
            let runtime = app.state::<UploadRuntime>();
            if !runtime.auto_schedule_enabled.load(Ordering::SeqCst) {
                continue;
            }
            if runtime
                .running
                .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
                .is_err()
            {
                continue;
            }

            let res = (|| -> Result<(), String> {
                let dir = resolve_dir(&app)?;
                let Some(cookie) = SessionSecretStore::new(dir.clone()).load()? else {
                    return Ok(());
                };
                let mut transport = open_desktop_transport(DEFAULT_WIKI_HOST, Some(&cookie))
                    .map_err(|err| err.to_string())?;
                let cancel = ReadCancellation::new();
                let worker = UploadWorker::new(dir);
                let _ = worker.run_due_verifications(&mut transport, &SystemClock, &cancel);
                let _ = worker.run_next_due_scheduled(
                    &mut transport,
                    &SystemClock,
                    &cancel,
                    |progress| {
                        app.state::<UploadRuntime>().update_progress(&app, progress);
                    },
                );
                Ok(())
            })();

            let rt = app.state::<UploadRuntime>();
            if let Err(err) = res {
                rt.inner.lock().expect("runtime mutex").last_error = Some(err);
            }
            rt.running.store(false, Ordering::SeqCst);
        }
    });
}
