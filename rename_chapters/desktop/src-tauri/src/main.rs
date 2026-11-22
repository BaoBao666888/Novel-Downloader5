#![cfg_attr(all(windows, not(test)), windows_subsystem = "windows")]

use std::sync::{Mutex, MutexGuard};

use novel_studio_core::{archive, first_line, merge, rename, rename_apply, split, text_tools};
use tauri::{Manager, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

use workspace::{
    ArchivePreview, LinePreview, LineResult, MergePreview, Preview, SplitOptions, SplitPreview,
    SplitSelection, TextPreview, TextResult, Workspace,
};

mod library_commands;
mod upload_commands;
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

#[tauri::command]
async fn preview_first_line(
    app: tauri::AppHandle,
    scan_revision: u32,
    edits: Vec<first_line::Edit>,
) -> Result<LinePreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.preview_lines(scan_revision, edits)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn apply_first_line(app: tauri::AppHandle, revision: u32) -> Result<LineResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.apply_lines(revision)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn undo_first_line(app: tauri::AppHandle, revision: u32) -> Result<LineResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.undo_lines(revision)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn choose_split_file(window: WebviewWindow) -> Result<Option<SplitSelection>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(file) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Chọn tệp .txt cần chia chương")
            .add_filter("Text file", &["txt"])
            .blocking_pick_file()
        else {
            return Ok(None);
        };
        let file = file.into_path().map_err(|err| err.to_string())?;
        let workspace = window.state::<Mutex<Workspace>>();
        state(&workspace)?.select_split_file(file).map(Some)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn choose_split_output_dir(window: WebviewWindow) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(folder) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Chọn thư mục xuất các chương đã chia")
            .blocking_pick_folder()
        else {
            return Ok(None);
        };
        let folder = folder.into_path().map_err(|err| err.to_string())?;
        let workspace = window.state::<Mutex<Workspace>>();
        state(&workspace)?.select_split_output_dir(folder).map(Some)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn preview_split(
    app: tauri::AppHandle,
    options: SplitOptions,
) -> Result<SplitPreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.preview_split(options)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn refresh_split_view(
    app: tauri::AppHandle,
    revision: u32,
    preface_mode: split::PrefaceMode,
    name_format: String,
) -> Result<SplitPreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.refresh_split_view(revision, preface_mode, name_format)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn nudge_split_boundary(
    app: tauri::AppHandle,
    revision: u32,
    boundary_index: usize,
    line_delta: isize,
    preface_mode: split::PrefaceMode,
    name_format: String,
) -> Result<SplitPreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.nudge_split_boundary(
            revision,
            boundary_index,
            line_delta,
            preface_mode,
            name_format,
        )
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn merge_split_boundary(
    app: tauri::AppHandle,
    revision: u32,
    boundary_index: usize,
    preface_mode: split::PrefaceMode,
    name_format: String,
) -> Result<SplitPreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.merge_split_boundary(revision, boundary_index, preface_mode, name_format)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn rename_split_boundary(
    app: tauri::AppHandle,
    revision: u32,
    boundary_index: usize,
    title: String,
    preface_mode: split::PrefaceMode,
    name_format: String,
) -> Result<SplitPreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.rename_split_boundary(
            revision,
            boundary_index,
            title,
            preface_mode,
            name_format,
        )
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn add_split_boundary(
    app: tauri::AppHandle,
    revision: u32,
    start_byte: usize,
    title: Option<String>,
    preface_mode: split::PrefaceMode,
    name_format: String,
) -> Result<SplitPreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.add_split_boundary(
            revision,
            start_byte,
            title,
            preface_mode,
            name_format,
        )
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn undo_split(
    app: tauri::AppHandle,
    revision: u32,
    preface_mode: split::PrefaceMode,
    name_format: String,
) -> Result<SplitPreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.undo_split(revision, preface_mode, name_format)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn redo_split(
    app: tauri::AppHandle,
    revision: u32,
    preface_mode: split::PrefaceMode,
    name_format: String,
) -> Result<SplitPreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.redo_split(revision, preface_mode, name_format)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn search_split_text(
    app: tauri::AppHandle,
    revision: u32,
    query: String,
) -> Result<Vec<split::SearchHit>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.search_split_text(revision, query)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn apply_split(
    app: tauri::AppHandle,
    revision: u32,
    preface_mode: split::PrefaceMode,
    name_format: String,
    overwrite: bool,
) -> Result<split::SplitOutcome, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.apply_split(revision, preface_mode, name_format, overwrite)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn choose_text_file(window: WebviewWindow) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(file) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Chọn tệp truyện chính (.txt)")
            .add_filter("Text file", &["txt"])
            .blocking_pick_file()
        else {
            return Ok(None);
        };
        let file = file.into_path().map_err(|err| err.to_string())?;
        let workspace = window.state::<Mutex<Workspace>>();
        state(&workspace)?.select_text_file(file).map(Some)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn choose_toc_file(window: WebviewWindow) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(file) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Chọn tệp mục lục (.txt)")
            .add_filter("Text file", &["txt"])
            .blocking_pick_file()
        else {
            return Ok(None);
        };
        let file = file.into_path().map_err(|err| err.to_string())?;
        let workspace = window.state::<Mutex<Workspace>>();
        state(&workspace)?.select_toc_file(file).map(Some)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn preview_renumber(
    app: tauri::AppHandle,
    find_regex: String,
    replace_format: String,
    start_num: i64,
) -> Result<TextPreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.preview_renumber(find_regex, replace_format, start_num)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn preview_apply_toc(
    app: tauri::AppHandle,
    toc_regex: String,
    main_regex: String,
    mode: text_tools::TocMode,
) -> Result<TextPreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.preview_apply_toc(toc_regex, main_regex, mode)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn preview_replace(
    app: tauri::AppHandle,
    options: text_tools::ReplaceOptions,
) -> Result<TextPreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.preview_replace(options)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn apply_text_edit(
    app: tauri::AppHandle,
    revision: u32,
    selected_indices: Option<Vec<usize>>,
) -> Result<TextResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.apply_text_edit(revision, selected_indices)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn undo_text_edit(app: tauri::AppHandle, revision: u32) -> Result<TextResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.undo_text_edit(revision)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn choose_archive_file(window: WebviewWindow) -> Result<Option<SplitSelection>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(file) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Chọn tệp nén .zip cần xem trước hoặc giải nén")
            .add_filter("ZIP archive", &["zip"])
            .blocking_pick_file()
        else {
            return Ok(None);
        };
        let file = file.into_path().map_err(|err| err.to_string())?;
        let workspace = window.state::<Mutex<Workspace>>();
        state(&workspace)?.select_archive_file(file).map(Some)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn choose_archive_output_dir(window: WebviewWindow) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(folder) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Chọn thư mục đích để giải nén")
            .blocking_pick_folder()
        else {
            return Ok(None);
        };
        let folder = folder.into_path().map_err(|err| err.to_string())?;
        let workspace = window.state::<Mutex<Workspace>>();
        state(&workspace)?
            .select_archive_output_dir(folder)
            .map(Some)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn inspect_archive(app: tauri::AppHandle) -> Result<ArchivePreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.inspect_archive()
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn preview_archive_entry(
    app: tauri::AppHandle,
    revision: u32,
    entry_index: usize,
) -> Result<archive::EntryPreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.preview_archive_entry(revision, entry_index)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn extract_archive(
    app: tauri::AppHandle,
    revision: u32,
    indices: Vec<usize>,
    overwrite: bool,
) -> Result<archive::ExtractOutcome, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.extract_archive(revision, indices, overwrite)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn choose_merge_folder(window: WebviewWindow) -> Result<Option<MergePreview>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(folder) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Chọn thư mục chứa các tệp .txt cần ghép")
            .blocking_pick_folder()
        else {
            return Ok(None);
        };
        let folder = folder.into_path().map_err(|err| err.to_string())?;
        let workspace = window.state::<Mutex<Workspace>>();
        state(&workspace)?.select_merge_folder(folder).map(Some)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn choose_merge_output(window: WebviewWindow) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(file) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Chọn tệp .txt đầu ra sau khi ghép")
            .add_filter("Text file", &["txt"])
            .blocking_save_file()
        else {
            return Ok(None);
        };
        let file = file.into_path().map_err(|err| err.to_string())?;
        let workspace = window.state::<Mutex<Workspace>>();
        state(&workspace)?.select_merge_output(file).map(Some)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn refresh_merge(app: tauri::AppHandle) -> Result<MergePreview, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.refresh_merge()
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
async fn apply_merge(
    app: tauri::AppHandle,
    revision: u32,
    options: merge::MergeOptions,
) -> Result<merge::MergeOutcome, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let workspace = app.state::<Mutex<Workspace>>();
        state(&workspace)?.apply_merge(revision, options)
    })
    .await
    .map_err(|err| err.to_string())?
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let bundled = app
                .path()
                .resolve(
                    "runtime/python/python.exe",
                    tauri::path::BaseDirectory::Resource,
                )
                .ok()
                .filter(|path| cfg!(windows) && path.is_file());
            app.manage(Mutex::new(Workspace::with_interpreter(bundled)));
            app.manage(Mutex::new(novel_studio_core::library::ReadCache::default()));
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            choose_folder,
            choose_python,
            preview_rename,
            apply_rename,
            preview_first_line,
            apply_first_line,
            undo_first_line,
            choose_split_file,
            choose_split_output_dir,
            preview_split,
            refresh_split_view,
            nudge_split_boundary,
            merge_split_boundary,
            rename_split_boundary,
            add_split_boundary,
            undo_split,
            redo_split,
            search_split_text,
            apply_split,
            choose_text_file,
            choose_toc_file,
            preview_renumber,
            preview_apply_toc,
            preview_replace,
            apply_text_edit,
            undo_text_edit,
            choose_archive_file,
            choose_archive_output_dir,
            inspect_archive,
            preview_archive_entry,
            extract_archive,
            library_commands::list_library,
            library_commands::import_library,
            library_commands::remove_library,
            library_commands::read_library,
            library_commands::list_library_chapters,
            library_commands::read_library_chapter,
            upload_commands::list_upload_workspace,
            upload_commands::choose_upload_folder,
            upload_commands::scan_upload_folder,
            upload_commands::create_upload_job,
            upload_commands::schedule_upload_job,
            upload_commands::link_upload_job,
            upload_commands::cancel_upload_schedule,
            upload_commands::delete_upload_job,
            upload_commands::preview_upload_job_recovery,
            upload_commands::export_upload_job_recovery,
            upload_commands::pick_upload_backup_zip,
            upload_commands::restore_upload_backup_zip,
            upload_commands::cleanup_upload_storage,
            choose_merge_folder,
            choose_merge_output,
            refresh_merge,
            apply_merge
        ])
        .run(tauri::generate_context!())
        .expect("failed to start Novel Studio");
}
