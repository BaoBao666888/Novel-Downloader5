#![cfg_attr(all(windows, not(test)), windows_subsystem = "windows")]

use std::sync::{Mutex, MutexGuard};

use novel_studio_core::{rename, rename_apply};
use tauri::{Manager, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

use workspace::{Preview, Workspace};

mod workspace;

fn state<'a>(
    app: &'a tauri::State<'_, Mutex<Workspace>>,
) -> Result<MutexGuard<'a, Workspace>, String> {
    app.lock()
        .map_err(|_| "Phiên làm việc đang lỗi. Hãy mở lại Novel Studio.".into())
}

#[tauri::command]
async fn choose_folder(window: WebviewWindow) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(folder) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Chọn thư mục chứa các chương")
            .blocking_pick_folder()
        else {
            return Ok(None);
        };
        let folder = folder.into_path().map_err(|err| err.to_string())?;
        let workspace = window.state::<Mutex<Workspace>>();
        state(&workspace)?.select(folder).map(Some)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn choose_python(window: WebviewWindow) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let picker = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Chọn chương trình Python 3");
        #[cfg(windows)]
        let picker = picker.add_filter("Python executable", &["exe"]);
        let Some(executable) = picker.blocking_pick_file() else {
            return Ok(None);
        };
        let executable = executable.into_path().map_err(|err| err.to_string())?;
        let workspace = window.state::<Mutex<Workspace>>();
        state(&workspace)?.select_interpreter(executable).map(Some)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn preview_rename(
    app: tauri::AppHandle,
    options: rename::Options,
) -> Result<Preview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.preview(options)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn apply_rename(
    app: tauri::AppHandle,
    revision: u32,
    selection: Vec<String>,
) -> Result<rename_apply::Outcome, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.apply(revision, selection)
    })
    .await
    .map_err(|err| err.to_string())?
}

fn main() {
    tauri::Builder::default()
        .manage(Mutex::new(Workspace::default()))
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            choose_folder,
            choose_python,
            preview_rename,
            apply_rename
        ])
        .run(tauri::generate_context!())
        .expect("failed to start Novel Studio");
}
