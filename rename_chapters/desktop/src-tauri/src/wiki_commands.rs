use std::sync::Mutex;
use std::time::Duration;

use novel_studio_core::upload::protocol::DEFAULT_WIKI_HOST;
use novel_studio_core::upload::runner::TransportReadAdapter;
use novel_studio_core::upload::verifier::ReadCancellation;
use novel_studio_core::wiki_works::{WorksStore, WorksView};
use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

use crate::secret_store::SessionSecretStore;
use crate::upload_commands::upload_workspace_dir;
use crate::winhttp_transport::open_desktop_transport;

#[derive(Default)]
pub struct WikiWorksRuntime {
    write: Mutex<()>,
    sync: Mutex<Option<ReadCancellation>>,
}

fn store(app: &AppHandle) -> Result<WorksStore, String> {
    app.path()
        .app_local_data_dir()
        .map(|dir| WorksStore::new(dir.join("wiki-works")))
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn load_wiki_works(app: AppHandle, account: String) -> Result<WorksView, String> {
    tauri::async_runtime::spawn_blocking(move || {
        store(&app)?.view(&account).map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn import_wiki_works(window: WebviewWindow) -> Result<Option<WorksView>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(file) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Nhập danh sách Wikidich từ Python")
            .add_filter("JSON", &["json"])
            .blocking_pick_file()
        else {
            return Ok(None);
        };
        let path = file.into_path().map_err(|err| err.to_string())?;
        let runtime = window.state::<WikiWorksRuntime>();
        let _guard = runtime
            .write
            .try_lock()
            .map_err(|_| "Đang xử lý danh sách Wikidich.")?;
        store(window.app_handle())?
            .import_legacy(&path)
            .map(Some)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn sync_wiki_works(app: AppHandle, account: String) -> Result<WorksView, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let runtime = app.state::<WikiWorksRuntime>();
        let _guard = runtime
            .write
            .try_lock()
            .map_err(|_| "Đang xử lý danh sách Wikidich.")?;
        let store = store(&app)?;
        let cookie = SessionSecretStore::new(upload_workspace_dir(&app)?)
            .load()?
            .ok_or("Hãy lưu phiên Wikidich trong Cài đặt → Tài khoản.")?;
        let mut transport = open_desktop_transport(DEFAULT_WIKI_HOST, Some(&cookie))
            .map_err(|err| err.to_string())?;
        let cancel = ReadCancellation::new();
        *runtime.sync.lock().map_err(|err| err.to_string())? = Some(cancel.clone());
        let result = store.sync(
            &account,
            &mut TransportReadAdapter(&mut transport),
            &cancel,
            Duration::from_millis(1500),
        );
        *runtime.sync.lock().map_err(|err| err.to_string())? = None;
        result.map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub fn cancel_wiki_sync(app: AppHandle) -> Result<(), String> {
    let runtime = app.state::<WikiWorksRuntime>();
    let sync = runtime.sync.lock().map_err(|err| err.to_string())?;
    if let Some(cancel) = sync.as_ref() {
        cancel.cancel();
    }
    Ok(())
}

#[tauri::command]
pub async fn remove_local_wiki_works(
    app: AppHandle,
    account: String,
    ids: Vec<String>,
) -> Result<WorksView, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let runtime = app.state::<WikiWorksRuntime>();
        let _guard = runtime
            .write
            .try_lock()
            .map_err(|_| "Đang xử lý danh sách Wikidich.")?;
        store(&app)?
            .remove_local(&account, ids)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}
