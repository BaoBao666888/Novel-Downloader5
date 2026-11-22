use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use novel_studio_core::CoreError;
use novel_studio_core::upload::engine::SystemClock;
use novel_studio_core::upload::objects::UNUSED_OBJECT_GRACE_MS;
use novel_studio_core::upload::protocol::DEFAULT_WIKI_HOST;
use novel_studio_core::upload::reconcile::ReconcileRecord;
use novel_studio_core::upload::recovery::RecoveryReport;
use novel_studio_core::upload::verifier::ReadCancellation;
use novel_studio_core::upload::worker::{SessionCheckResult, UploadWorker};
use novel_studio_core::upload::workspace::{
    CreateJobInput, FolderChapterScan, StorageCleanupReport, UploadWorkspace,
    UploadWorkspaceSnapshot,
};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

use crate::secret_store::{SessionSecretStatus, SessionSecretStore};
use crate::upload_runtime::{UploadRuntime, UploadRuntimeStatus};
use crate::winhttp_transport::open_desktop_transport;

const UPLOAD_WORKSPACE_ENV: &str = "NOVEL_STUDIO_UPLOAD_DIR";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportRecoveryOutcome {
    pub path: String,
    pub report: RecoveryReport,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupZipInspection {
    pub path: String,
    pub report: RecoveryReport,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreBackupOutcome {
    pub restored_job_id: String,
    pub snapshot: UploadWorkspaceSnapshot,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupStorageOutcome {
    pub report: StorageCleanupReport,
    pub snapshot: UploadWorkspaceSnapshot,
}

pub(crate) fn resolve_workspace_dir(
    override_dir: Option<&str>,
    base_local_data: Result<PathBuf, String>,
) -> Result<PathBuf, String> {
    if let Some(custom) = override_dir.map(str::trim).filter(|s| !s.is_empty()) {
        return Ok(PathBuf::from(custom));
    }
    Ok(base_local_data?.join("upload-workspace"))
}

pub fn upload_workspace_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let override_dir = std::env::var(UPLOAD_WORKSPACE_ENV).ok();
    resolve_workspace_dir(
        override_dir.as_deref(),
        app.path()
            .app_local_data_dir()
            .map_err(|err| err.to_string()),
    )
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as u64)
}

async fn run_upload<T: Send + 'static>(
    app: AppHandle,
    action: impl FnOnce(UploadWorkspace) -> Result<T, CoreError> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = upload_workspace_dir(&app)?;
        action(UploadWorkspace::new(dir)).map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn list_upload_workspace(app: AppHandle) -> Result<UploadWorkspaceSnapshot, String> {
    run_upload(app, |ws| ws.snapshot()).await
}

#[tauri::command]
pub async fn choose_upload_folder(
    window: WebviewWindow,
) -> Result<Option<FolderChapterScan>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(folder) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Chọn thư mục chứa các chương .txt cần tải lên")
            .blocking_pick_folder()
        else {
            return Ok(None);
        };
        let path = folder.into_path().map_err(|err| err.to_string())?;
        UploadWorkspace::inspect_chapter_folder(&path)
            .map(Some)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn scan_upload_folder(
    _app: AppHandle,
    folder: String,
) -> Result<FolderChapterScan, String> {
    tauri::async_runtime::spawn_blocking(move || {
        UploadWorkspace::inspect_chapter_folder(Path::new(folder.trim()))
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn create_upload_job(
    app: AppHandle,
    input: CreateJobInput,
) -> Result<UploadWorkspaceSnapshot, String> {
    run_upload(app, move |ws| {
        ws.create_planned_job(input, now_ms())?;
        ws.snapshot()
    })
    .await
}

#[tauri::command]
pub async fn schedule_upload_job(
    app: AppHandle,
    id: String,
    at_ms: u64,
    allow_duplicate: bool,
) -> Result<UploadWorkspaceSnapshot, String> {
    run_upload(app, move |ws| {
        ws.schedule_job(&id, at_ms, now_ms(), allow_duplicate)?;
        ws.snapshot()
    })
    .await
}

#[tauri::command]
pub async fn link_upload_job(
    app: AppHandle,
    id: String,
    parent_id: String,
    allow_duplicate: bool,
) -> Result<UploadWorkspaceSnapshot, String> {
    run_upload(app, move |ws| {
        ws.link_job(&id, &parent_id, now_ms(), allow_duplicate)?;
        ws.snapshot()
    })
    .await
}

#[tauri::command]
pub async fn cancel_upload_schedule(
    app: AppHandle,
    id: String,
) -> Result<UploadWorkspaceSnapshot, String> {
    run_upload(app, move |ws| {
        ws.cancel_schedule(&id)?;
        ws.snapshot()
    })
    .await
}

#[tauri::command]
pub async fn delete_upload_job(
    app: AppHandle,
    id: String,
) -> Result<UploadWorkspaceSnapshot, String> {
    run_upload(app, move |ws| {
        ws.delete_job(&id)?;
        ws.snapshot()
    })
    .await
}

#[tauri::command]
pub async fn preview_upload_job_recovery(
    app: AppHandle,
    id: String,
) -> Result<RecoveryReport, String> {
    run_upload(app, move |ws| ws.preview_recovery(&id)).await
}

#[tauri::command]
pub async fn export_upload_job_recovery(
    window: WebviewWindow,
    id: String,
    suggested_name: String,
) -> Result<Option<ExportRecoveryOutcome>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = upload_workspace_dir(window.app_handle())?;
        let ws = UploadWorkspace::new(dir);
        ws.preview_recovery(&id).map_err(|err| err.to_string())?;

        let clean_name = suggested_name
            .trim()
            .trim_matches(['.', '/', '\\'])
            .chars()
            .map(|c| {
                if matches!(c, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|')
                    || c.is_control()
                {
                    '_'
                } else {
                    c
                }
            })
            .collect::<String>();
        let filename = if clean_name.is_empty() {
            "sao-luu-cong-viec.zip".to_owned()
        } else if clean_name.to_ascii_lowercase().ends_with(".zip") {
            clean_name
        } else {
            format!("{clean_name}.zip")
        };

        let Some(target) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Xuất gói sao lưu công việc (.zip)")
            .set_file_name(&filename)
            .add_filter("ZIP archive", &["zip"])
            .blocking_save_file()
        else {
            return Ok(None);
        };
        let path = target.into_path().map_err(|err| err.to_string())?;
        let report = ws
            .export_recovery_zip(&id, &path)
            .map_err(|err| err.to_string())?;
        Ok(Some(ExportRecoveryOutcome {
            path: path.display().to_string(),
            report,
        }))
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn pick_upload_backup_zip(
    window: WebviewWindow,
) -> Result<Option<BackupZipInspection>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = upload_workspace_dir(window.app_handle())?;
        let Some(file) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Chọn tệp ZIP sao lưu công việc cần khôi phục")
            .add_filter("ZIP archive", &["zip"])
            .blocking_pick_file()
        else {
            return Ok(None);
        };
        let path = file.into_path().map_err(|err| err.to_string())?;
        let ws = UploadWorkspace::new(dir);
        let report = ws
            .inspect_backup_zip(&path)
            .map_err(|err| err.to_string())?;
        Ok(Some(BackupZipInspection {
            path: path.display().to_string(),
            report,
        }))
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn restore_upload_backup_zip(
    app: AppHandle,
    zip_path: String,
    account: String,
) -> Result<RestoreBackupOutcome, String> {
    run_upload(app, move |ws| {
        let restored = ws.restore_backup_zip(Path::new(zip_path.trim()), &account, now_ms())?;
        let snapshot = ws.snapshot()?;
        Ok(RestoreBackupOutcome {
            restored_job_id: restored.id,
            snapshot,
        })
    })
    .await
}

#[tauri::command]
pub async fn cleanup_upload_storage(app: AppHandle) -> Result<CleanupStorageOutcome, String> {
    run_upload(app, move |ws| {
        let report = ws.cleanup_storage(now_ms(), UNUSED_OBJECT_GRACE_MS)?;
        let snapshot = ws.snapshot()?;
        Ok(CleanupStorageOutcome { report, snapshot })
    })
    .await
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyNowOutcome {
    pub record: Option<ReconcileRecord>,
    pub snapshot: UploadWorkspaceSnapshot,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunDueVerificationsOutcome {
    pub checked_count: usize,
    pub snapshot: UploadWorkspaceSnapshot,
}

#[tauri::command]
pub async fn get_upload_session_status(app: AppHandle) -> Result<SessionSecretStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = upload_workspace_dir(&app)?;
        Ok(SessionSecretStore::new(dir).status())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn save_upload_session_cookie(
    app: AppHandle,
    cookie: String,
) -> Result<SessionSecretStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = upload_workspace_dir(&app)?;
        let status = SessionSecretStore::new(dir).save(&cookie)?;
        app.state::<UploadRuntime>().set_verified_result(
            None,
            Some("Đã lưu Cookie phiên bằng Windows DPAPI.".to_owned()),
        );
        Ok(status)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn clear_upload_session_cookie(app: AppHandle) -> Result<SessionSecretStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = upload_workspace_dir(&app)?;
        let store = SessionSecretStore::new(dir);
        store.clear()?;
        app.state::<UploadRuntime>()
            .set_verified_result(None, Some("Đã xóa phiên đăng nhập đã lưu.".to_owned()));
        Ok(store.status())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn check_upload_session(app: AppHandle) -> Result<SessionCheckResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = upload_workspace_dir(&app)?;
        let cookie = SessionSecretStore::new(dir.clone()).load()?;
        let mut transport = open_desktop_transport(DEFAULT_WIKI_HOST, cookie.as_deref())
            .map_err(|err| err.to_string())?;
        let cancel = ReadCancellation::new();
        let res = UploadWorker::new(dir)
            .check_session(&mut transport, &cancel)
            .map_err(|err| err.to_string())?;
        let acct = res.authenticated.then(|| res.account.clone());
        app.state::<UploadRuntime>()
            .set_verified_result(acct, Some(res.message.clone()));
        Ok(res)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn get_upload_runtime_status(app: AppHandle) -> Result<UploadRuntimeStatus, String> {
    Ok(app.state::<UploadRuntime>().status())
}

#[tauri::command]
pub async fn set_upload_auto_schedule(
    app: AppHandle,
    enabled: bool,
) -> Result<UploadRuntimeStatus, String> {
    Ok(app.state::<UploadRuntime>().set_auto_schedule(enabled))
}

#[tauri::command]
pub async fn start_upload_job_now(
    app: AppHandle,
    id: String,
    revision: u64,
    consent_ids: Vec<String>,
) -> Result<UploadRuntimeStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = upload_workspace_dir(&app)?;
        let consent: HashSet<String> = consent_ids.into_iter().collect();
        app.state::<UploadRuntime>()
            .start_immediate(app.clone(), dir, id, revision, consent)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn stop_active_upload(app: AppHandle) -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = upload_workspace_dir(&app)?;
        app.state::<UploadRuntime>().stop_active(dir)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn verify_upload_job_now(app: AppHandle, id: String) -> Result<VerifyNowOutcome, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = upload_workspace_dir(&app)?;
        let cookie = SessionSecretStore::new(dir.clone()).load()?;
        let mut transport = open_desktop_transport(DEFAULT_WIKI_HOST, cookie.as_deref())
            .map_err(|err| err.to_string())?;
        let cancel = ReadCancellation::new();
        let record = UploadWorker::new(dir.clone())
            .verify_job_now(&id, &mut transport, &SystemClock, &cancel)
            .map_err(|err| err.to_string())?;
        let snapshot = UploadWorkspace::new(dir)
            .snapshot()
            .map_err(|err| err.to_string())?;
        Ok(VerifyNowOutcome { record, snapshot })
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn run_due_upload_verifications(
    app: AppHandle,
) -> Result<RunDueVerificationsOutcome, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dir = upload_workspace_dir(&app)?;
        let cookie = SessionSecretStore::new(dir.clone()).load()?;
        let mut transport = open_desktop_transport(DEFAULT_WIKI_HOST, cookie.as_deref())
            .map_err(|err| err.to_string())?;
        let cancel = ReadCancellation::new();
        let updated = UploadWorker::new(dir.clone())
            .run_due_verifications(&mut transport, &SystemClock, &cancel)
            .map_err(|err| err.to_string())?;
        let snapshot = UploadWorkspace::new(dir)
            .snapshot()
            .map_err(|err| err.to_string())?;
        Ok(RunDueVerificationsOutcome {
            checked_count: updated.len(),
            snapshot,
        })
    })
    .await
    .map_err(|err| err.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    use novel_studio_core::upload::model::{JobMode, JobStatus};
    use novel_studio_core::upload::multipart::CreditPosition;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn workspace_dir_override_beats_local_data_and_defaults_cleanly() {
        let overridden =
            resolve_workspace_dir(Some("  /tmp/custom-upload  "), Err("unused".to_owned()))
                .expect("override ok");
        assert_eq!(overridden, PathBuf::from("/tmp/custom-upload"));

        let defaulted = resolve_workspace_dir(
            Some("   "),
            Ok(PathBuf::from("C:/Users/Test/AppData/Local/NovelStudio")),
        )
        .expect("default ok");
        assert_eq!(
            defaulted,
            PathBuf::from("C:/Users/Test/AppData/Local/NovelStudio").join("upload-workspace")
        );
    }

    #[test]
    fn adapter_roundtrips_create_schedule_export_inspect_and_restore() {
        let dir = tempdir().expect("tempdir");
        let src = dir.path().join("chapters");
        fs::create_dir(&src).expect("mkdir");
        fs::write(src.join("001-Chương 1.txt"), "Nội dung chương 1").expect("write c1");
        fs::write(src.join("002-Chương 2.txt"), "Nội dung chương 2").expect("write c2");

        let ws = UploadWorkspace::new(dir.path().join("ws"));
        let created = ws
            .create_planned_job(
                CreateJobInput {
                    folder: src.display().to_string(),
                    mode: JobMode::New,
                    account: "demo".into(),
                    title_vi: "Truyện Adapter".into(),
                    title_cn: "测试适配器".into(),
                    author_cn: "作者".into(),
                    desc_vi: "Giới thiệu".into(),
                    book_url: String::new(),
                    volume_name: "Quyển 1".into(),
                    volume_note: String::new(),
                    append: false,
                    credit_text: String::new(),
                    credit_position: CreditPosition::End,
                },
                10_000,
            )
            .expect("create");

        ws.schedule_job(&created.id, 120_000, 20_000, false)
            .expect("schedule");

        let zip_path = dir.path().join("recovery.zip");
        let report = ws
            .export_recovery_zip(&created.id, &zip_path)
            .expect("export");
        let export_out = ExportRecoveryOutcome {
            path: zip_path.display().to_string(),
            report: report.clone(),
        };
        assert_eq!(export_out.report.available_chapters, 2);

        let inspected = ws.inspect_backup_zip(&zip_path).expect("inspect");
        let inspect_out = BackupZipInspection {
            path: zip_path.display().to_string(),
            report: inspected,
        };
        assert_eq!(inspect_out.report.title, "Truyện Adapter");

        let restored = ws
            .restore_backup_zip(&zip_path, "restored-demo", 30_000)
            .expect("restore");
        assert_eq!(restored.status, JobStatus::Planned);
        let snap = ws.snapshot().expect("snap");
        assert_eq!(snap.jobs.len(), 2);
    }
}
