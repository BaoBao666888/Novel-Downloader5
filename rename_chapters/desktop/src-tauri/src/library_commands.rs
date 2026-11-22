use std::path::PathBuf;
use std::sync::Mutex;

use novel_studio_core::{CoreError, library};
use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

use crate::translate_commands::library_workspace_dir;
use crate::workspace::Workspace;

async fn run<T: Send + 'static>(
    app: AppHandle,
    action: impl FnOnce(library::Library, Option<PathBuf>) -> Result<T, CoreError> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let directory = library_workspace_dir(&app)?;
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
pub async fn import_library_paths(
    app: AppHandle,
    paths: Vec<String>,
) -> Result<library::ImportResult, String> {
    run(app, move |library, _| {
        let buf_paths: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();
        library.import(buf_paths)
    })
    .await
}

#[tauri::command]
pub async fn remove_library(app: AppHandle, id: u32) -> Result<Vec<library::Item>, String> {
    if let Ok(mut cache) = app.state::<Mutex<library::ReadCache>>().lock() {
        cache.invalidate(id);
    }
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
    let app_handle = app.clone();
    run(app, move |library, interpreter| {
        let cache_state = app_handle.state::<Mutex<library::ReadCache>>();
        let mut cache = cache_state
            .lock()
            .map_err(|_| "Bộ đệm thư viện đang bận.")?;
        library.chapters_cached(id, &mut cache, interpreter.as_deref())
    })
    .await
}

#[tauri::command]
pub async fn read_library_chapter(
    app: AppHandle,
    id: u32,
    chapter_index: usize,
) -> Result<library::ChapterContent, String> {
    let app_handle = app.clone();
    run(app, move |library, interpreter| {
        let cache_state = app_handle.state::<Mutex<library::ReadCache>>();
        let mut cache = cache_state
            .lock()
            .map_err(|_| "Bộ đệm thư viện đang bận.")?;
        library.read_chapter_cached(id, chapter_index, &mut cache, interpreter.as_deref())
    })
    .await
}

#[tauri::command]
pub async fn library_stats(
    app: AppHandle,
    refresh_stale: Option<bool>,
) -> Result<library::LibraryStats, String> {
    run(app, move |library, interpreter| {
        library.stats_with_interpreter(refresh_stale.unwrap_or(false), interpreter.as_deref())
    })
    .await
}
