use std::path::PathBuf;

use novel_studio_core::{CoreError, library};
use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

async fn run<T: Send + 'static>(
    app: AppHandle,
    action: impl FnOnce(library::Library) -> Result<T, CoreError> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let directory = app
            .path()
            .app_local_data_dir()
            .map_err(|err| err.to_string())?;
        action(library::Library::new(directory)).map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn list_library(app: AppHandle) -> Result<Vec<library::Item>, String> {
    run(app, |library| library.list()).await
}

#[tauri::command]
pub async fn import_library(
    window: WebviewWindow,
) -> Result<Option<library::ImportResult>, String> {
    run(window.app_handle().clone(), move |library| {
        let Some(files) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Thêm TXT vào thư viện")
            .add_filter("Văn bản TXT", &["txt"])
            .blocking_pick_files()
        else {
            return Ok(None);
        };
        let paths = files
            .into_iter()
            .map(|file| file.into_path())
            .collect::<Result<Vec<PathBuf>, _>>()?;
        library.import(paths).map(Some)
    })
    .await
}

#[tauri::command]
pub async fn remove_library(app: AppHandle, id: u32) -> Result<Vec<library::Item>, String> {
    run(app, move |library| library.remove(id)).await
}

#[tauri::command]
pub async fn read_library(
    app: AppHandle,
    id: u32,
    cursor: Option<library::Cursor>,
) -> Result<library::Page, String> {
    run(app, move |library| library.read(id, cursor)).await
}
