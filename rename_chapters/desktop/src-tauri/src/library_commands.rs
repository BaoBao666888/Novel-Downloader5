use std::path::PathBuf;
use std::sync::Mutex;

use novel_studio_core::{CoreError, library};
use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

use crate::workspace::Workspace;

async fn run<T: Send + 'static>(
    app: AppHandle,
    action: impl FnOnce(library::Library, Option<PathBuf>) -> Result<T, CoreError> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let directory = app
            .path()
            .app_local_data_dir()
            .map_err(|err| err.to_string())?;
        let interpreter = app
            .state::<Mutex<Workspace>>()
            .lock()
            .ok()
            .and_then(|ws| ws.interpreter());
        action(library::Library::new(directory), interpreter).map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn list_library(app: AppHandle) -> Result<Vec<library::Item>, String> {
    run(app, |library, _| library.list()).await
}

#[tauri::command]
pub async fn import_library(
    window: WebviewWindow,
) -> Result<Option<library::ImportResult>, String> {
    run(window.app_handle().clone(), move |library, _| {
        let Some(files) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Thêm truyện TXT hoặc ZIP vào thư viện")
            .add_filter("Truyện TXT & ZIP", &["txt", "zip"])
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
    run(app, move |library, _| library.remove(id)).await
}

#[tauri::command]
pub async fn read_library(
    app: AppHandle,
    id: u32,
    cursor: Option<library::Cursor>,
) -> Result<library::Page, String> {
    run(app, move |library, _| library.read(id, cursor)).await
}

#[tauri::command]
pub async fn list_library_chapters(
    app: AppHandle,
    id: u32,
) -> Result<library::ChapterList, String> {
    run(app, move |library, interpreter| {
        library.chapters(id, interpreter.as_deref())
    })
    .await
}

#[tauri::command]
pub async fn read_library_chapter(
    app: AppHandle,
    id: u32,
    chapter_index: usize,
) -> Result<library::ChapterContent, String> {
    run(app, move |library, interpreter| {
        library.read_chapter(id, chapter_index, interpreter.as_deref())
    })
    .await
}
