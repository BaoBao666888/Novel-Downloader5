use std::collections::BTreeMap;
use std::path::PathBuf;
use std::sync::Mutex;

use novel_studio_core::translate::dichngay::{TranslateBatchConfig, TranslationHttpTransport};
use novel_studio_core::translate::name_set::{parse_name_set_text, serialize_name_set_text};
use novel_studio_core::translate::selection::{
    SelectionNameMapResult, SelectionSourceSegmentResult,
};
use novel_studio_core::translate::storage::{
    BookNameHistoryRow, ClearTranslationCacheOutcome, GlobalDictsState, NameSetState,
    NameSuggestResponse, TranslationCacheStats, TranslationStore, VpSetState,
};
use novel_studio_core::translate::text::normalize_vi_display_text;
use novel_studio_core::{CoreError, library};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::winhttp_transport::open_desktop_translate_transport;
use crate::workspace::Workspace;

pub const TRANSLATE_WORKSPACE_ENV: &str = "NOVEL_STUDIO_TRANSLATE_DIR";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslatedChapterView {
    pub book_id: u32,
    pub chapter_index: usize,
    pub chapter_id: String,
    pub title_raw: String,
    pub title_translated: String,
    pub raw_text: String,
    pub translated_text: String,
    pub translation_mode: String,
    pub trans_sig: String,
    pub unit_count: usize,
    pub name_hit_count: usize,
    pub active_set: String,
    pub name_set_version: u32,
    pub cache_hit_count: usize,
    pub missing_count: usize,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SelectionMapRequest {
    pub book_id: u32,
    pub chapter_index: usize,
    pub selected_text: String,
    pub start_offset: isize,
    pub end_offset: isize,
    #[serde(default)]
    pub translation_mode: String,
    #[serde(default)]
    pub translated_text: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct NameSuggestRequest {
    pub source_text: String,
    pub book_id: Option<u32>,
    pub set_name: Option<String>,
    #[serde(default)]
    pub dict_type: String,
    #[serde(default)]
    pub scope: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateNameEntryRequest {
    pub book_id: Option<u32>,
    pub source: String,
    pub target: String,
    pub set_name: Option<String>,
    #[serde(default)]
    pub delete: bool,
    pub chapter_index: Option<usize>,
    pub origin: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SetNameSetsRequest {
    pub book_id: Option<u32>,
    pub sets: BTreeMap<String, BTreeMap<String, String>>,
    pub active_set: Option<String>,
    #[serde(default = "default_true")]
    pub bump_version: bool,
    pub origin: Option<String>,
    pub chapter_index: Option<usize>,
}

fn default_true() -> bool {
    true
}

pub fn translate_workspace_dir(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(custom) = std::env::var(TRANSLATE_WORKSPACE_ENV)
        && !custom.trim().is_empty()
    {
        return Ok(PathBuf::from(custom.trim()));
    }
    let base = app
        .path()
        .app_local_data_dir()
        .map_err(|err| err.to_string())?;
    Ok(base.join("translate-workspace"))
}

pub fn library_workspace_dir(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(custom) = std::env::var(TRANSLATE_WORKSPACE_ENV)
        && !custom.trim().is_empty()
    {
        return Ok(PathBuf::from(custom.trim()));
    }
    app.path()
        .app_local_data_dir()
        .map_err(|err| err.to_string())
}

fn book_key(book_id: Option<u32>) -> Option<String> {
    book_id.map(|id| format!("lib_{id}"))
}

fn chapter_key(book_id: u32, chapter_index: usize) -> String {
    format!("lib_{book_id}_ch_{chapter_index}")
}

async fn run_translate<T: Send + 'static>(
    app: AppHandle,
    action: impl FnOnce(TranslationStore, library::Library, Option<PathBuf>) -> Result<T, CoreError>
    + Send
    + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store_dir = translate_workspace_dir(&app)?;
        let lib_dir = library_workspace_dir(&app)?;
        let interpreter = app
            .state::<Mutex<Workspace>>()
            .lock()
            .ok()
            .and_then(|ws| ws.interpreter());
        action(
            TranslationStore::new(store_dir),
            library::Library::new(lib_dir),
            interpreter,
        )
        .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn get_translate_server_config(app: AppHandle) -> Result<TranslateBatchConfig, String> {
    run_translate(app, |store, _, _| store.get_server_config()).await
}

#[tauri::command]
pub async fn save_translate_server_config(
    app: AppHandle,
    config: TranslateBatchConfig,
) -> Result<TranslateBatchConfig, String> {
    run_translate(app, move |store, _, _| store.set_server_config(config)).await
}

#[tauri::command]
pub async fn get_reader_name_sets(
    app: AppHandle,
    book_id: Option<u32>,
) -> Result<NameSetState, String> {
    let bkey = book_key(book_id);
    run_translate(app, move |store, _, _| {
        store.get_name_set_state(bkey.as_deref())
    })
    .await
}

#[tauri::command]
pub async fn save_reader_name_sets(
    app: AppHandle,
    request: SetNameSetsRequest,
) -> Result<NameSetState, String> {
    let bkey = book_key(request.book_id);
    let ckey = request
        .book_id
        .zip(request.chapter_index)
        .map(|(b, c)| chapter_key(b, c));
    run_translate(app, move |store, _, _| {
        store.set_name_set_state(
            request.sets,
            request.active_set.as_deref(),
            request.bump_version,
            bkey.as_deref(),
            request.origin.as_deref(),
            ckey.as_deref(),
        )
    })
    .await
}

#[tauri::command]
pub async fn update_reader_name_entry(
    app: AppHandle,
    request: UpdateNameEntryRequest,
) -> Result<NameSetState, String> {
    let bkey = book_key(request.book_id);
    let ckey = request
        .book_id
        .zip(request.chapter_index)
        .map(|(b, c)| chapter_key(b, c));
    run_translate(app, move |store, _, _| {
        store.update_name_set_entry(
            &request.source,
            &request.target,
            request.set_name.as_deref(),
            request.delete,
            bkey.as_deref(),
            request.origin.as_deref(),
            ckey.as_deref(),
        )
    })
    .await
}

#[tauri::command]
pub async fn import_reader_name_set_text(
    app: AppHandle,
    book_id: Option<u32>,
    set_name: Option<String>,
    raw_text: String,
    replace: bool,
) -> Result<NameSetState, String> {
    let bkey = book_key(book_id);
    run_translate(app, move |store, _, _| {
        let parsed = parse_name_set_text(&raw_text);
        if parsed.is_empty() {
            return Err("Không tìm thấy dòng Tên_gốc=Tên_dịch hợp lệ nào.".into());
        }
        let current = store.get_name_set_state(bkey.as_deref())?;
        let mut sets = current.sets;
        let active = set_name
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .unwrap_or(&current.active_set)
            .to_owned();
        let target_map = sets.entry(active.clone()).or_default();
        if replace {
            *target_map = parsed;
        } else {
            for (k, v) in parsed {
                target_map.insert(k, v);
            }
        }
        store.set_name_set_state(
            sets,
            Some(&active),
            true,
            bkey.as_deref(),
            Some("reader_import"),
            None,
        )
    })
    .await
}

#[tauri::command]
pub async fn export_reader_name_set_text(
    app: AppHandle,
    book_id: Option<u32>,
    set_name: Option<String>,
) -> Result<String, String> {
    let bkey = book_key(book_id);
    run_translate(app, move |store, _, _| {
        let state = store.get_name_set_state(bkey.as_deref())?;
        let active = set_name
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .unwrap_or(&state.active_set);
        let entries = state.sets.get(active).cloned().unwrap_or_default();
        Ok(serialize_name_set_text(&entries))
    })
    .await
}

#[tauri::command]
pub async fn list_reader_name_history(
    app: AppHandle,
    book_id: u32,
    limit: Option<usize>,
) -> Result<Vec<BookNameHistoryRow>, String> {
    let bkey = format!("lib_{book_id}");
    run_translate(app, move |store, _, _| {
        store.list_book_name_history(&bkey, limit.unwrap_or(100))
    })
    .await
}

#[tauri::command]
pub async fn get_reader_book_vp_set(app: AppHandle, book_id: u32) -> Result<VpSetState, String> {
    let bkey = format!("lib_{book_id}");
    run_translate(app, move |store, _, _| store.get_book_vp_set(&bkey)).await
}

#[tauri::command]
pub async fn update_reader_book_vp_entry(
    app: AppHandle,
    book_id: u32,
    source: String,
    target: String,
    delete: bool,
) -> Result<VpSetState, String> {
    let bkey = format!("lib_{book_id}");
    run_translate(app, move |store, _, _| {
        store.update_book_vp_entry(&bkey, &source, &target, delete)
    })
    .await
}

#[tauri::command]
pub async fn get_reader_global_dicts(app: AppHandle) -> Result<GlobalDictsState, String> {
    run_translate(app, |store, _, _| store.get_global_dicts()).await
}

#[tauri::command]
pub async fn save_reader_global_dicts(
    app: AppHandle,
    name: Option<BTreeMap<String, String>>,
    vp: Option<BTreeMap<String, String>>,
) -> Result<GlobalDictsState, String> {
    run_translate(app, move |store, _, _| store.set_global_dicts(name, vp)).await
}

#[tauri::command]
pub async fn translate_library_chapter(
    app: AppHandle,
    book_id: u32,
    chapter_index: usize,
    translation_mode: Option<String>,
    force_reload: Option<bool>,
) -> Result<TranslatedChapterView, String> {
    let app_handle = app.clone();
    run_translate(app, move |store, library, interpreter| {
        let ch = {
            let cache_state = app_handle.state::<Mutex<library::ReadCache>>();
            let mut cache = cache_state
                .lock()
                .map_err(|_| "Bộ đệm thư viện đang bận.")?;
            library.read_chapter_cached(
                book_id,
                chapter_index,
                &mut cache,
                interpreter.as_deref(),
            )?
        };
        let bkey = format!("lib_{book_id}");
        let ckey = chapter_key(book_id, chapter_index);
        let mode = translation_mode.as_deref().unwrap_or("server");
        let cfg = store.get_server_config()?;
        let mut transport = open_desktop_translate_transport(&cfg.server_url).ok();
        let transport_ref: Option<&mut dyn TranslationHttpTransport> = match transport {
            Some(ref mut t) => Some(t as &mut dyn TranslationHttpTransport),
            None => None,
        };

        let detail = store.translate_chapter_content(
            Some(&bkey),
            &ckey,
            &ch.text,
            mode,
            force_reload.unwrap_or(false),
            transport_ref,
        )?;

        let mut transport_title = open_desktop_translate_transport(&cfg.server_url).ok();
        let sig_opts = store.effective_signature_options_for_book(Some(&bkey), mode, None)?;
        let title_detail = novel_studio_core::translate::pipeline::translate_detailed(
            &ch.title,
            &sig_opts,
            &cfg,
            None,
            match transport_title {
                Some(ref mut t) => Some(t as &mut dyn TranslationHttpTransport),
                None => None,
            },
        );
        let title_vi = normalize_vi_display_text(&title_detail.translated);
        let title_translated = if title_vi.is_empty() {
            ch.title.clone()
        } else {
            title_vi
        };

        Ok(TranslatedChapterView {
            book_id,
            chapter_index,
            chapter_id: ckey,
            title_raw: ch.title,
            title_translated,
            raw_text: ch.text,
            translated_text: detail.translated,
            translation_mode: detail.mode,
            trans_sig: detail.trans_sig,
            unit_count: detail.unit_map.len(),
            name_hit_count: detail.name_map.hits.len(),
            active_set: detail.name_map.active_set,
            name_set_version: detail.name_map.version,
            cache_hit_count: detail.cache_hit_count,
            missing_count: detail.missing_count,
        })
    })
    .await
}

#[tauri::command]
pub async fn map_reader_selection_to_name(
    app: AppHandle,
    request: SelectionMapRequest,
) -> Result<SelectionNameMapResult, String> {
    let app_handle = app.clone();
    run_translate(app, move |store, library, interpreter| {
        let ch = {
            let cache_state = app_handle.state::<Mutex<library::ReadCache>>();
            let mut cache = cache_state
                .lock()
                .map_err(|_| "Bộ đệm thư viện đang bận.")?;
            library.read_chapter_cached(
                request.book_id,
                request.chapter_index,
                &mut cache,
                interpreter.as_deref(),
            )?
        };
        let bkey = format!("lib_{}", request.book_id);
        let ckey = chapter_key(request.book_id, request.chapter_index);
        let mode = if request.translation_mode.trim().is_empty() {
            "server"
        } else {
            request.translation_mode.trim()
        };
        let translated_text = if !request.translated_text.trim().is_empty() {
            request.translated_text
        } else if let Some(cached) = store.get_chapter_translation_cache(&ckey, mode)? {
            cached.translated_text
        } else {
            String::new()
        };
        store.map_chapter_selection_to_name(
            Some(&bkey),
            &ckey,
            &ch.text,
            &translated_text,
            &request.selected_text,
            request.start_offset,
            request.end_offset,
            mode,
            None,
        )
    })
    .await
}

#[tauri::command]
pub async fn map_reader_selection_to_source(
    app: AppHandle,
    request: SelectionMapRequest,
) -> Result<SelectionSourceSegmentResult, String> {
    let app_handle = app.clone();
    run_translate(app, move |store, library, interpreter| {
        let ch = {
            let cache_state = app_handle.state::<Mutex<library::ReadCache>>();
            let mut cache = cache_state
                .lock()
                .map_err(|_| "Bộ đệm thư viện đang bận.")?;
            library.read_chapter_cached(
                request.book_id,
                request.chapter_index,
                &mut cache,
                interpreter.as_deref(),
            )?
        };
        let ckey = chapter_key(request.book_id, request.chapter_index);
        let mode = if request.translation_mode.trim().is_empty() {
            "server"
        } else {
            request.translation_mode.trim()
        };
        let translated_text = if !request.translated_text.trim().is_empty() {
            request.translated_text
        } else if let Some(cached) = store.get_chapter_translation_cache(&ckey, mode)? {
            cached.translated_text
        } else {
            String::new()
        };
        store.map_chapter_selection_to_source(
            &ckey,
            &ch.text,
            &translated_text,
            &request.selected_text,
            request.start_offset,
            request.end_offset,
            mode,
        )
    })
    .await
}

#[tauri::command]
pub async fn suggest_reader_name(
    app: AppHandle,
    request: NameSuggestRequest,
) -> Result<NameSuggestResponse, String> {
    let bkey = book_key(request.book_id);
    run_translate(app, move |store, _, _| {
        let cfg = store.get_server_config()?;
        let mut transport = open_desktop_translate_transport(&cfg.server_url).ok();
        let transport_ref: Option<&mut dyn TranslationHttpTransport> = match transport {
            Some(ref mut t) => Some(t as &mut dyn TranslationHttpTransport),
            None => None,
        };
        store.build_name_suggestions(
            &request.source_text,
            bkey.as_deref(),
            request.set_name.as_deref(),
            &request.dict_type,
            &request.scope,
            None,
            transport_ref,
        )
    })
    .await
}

#[tauri::command]
pub async fn get_reader_translation_cache_stats(
    app: AppHandle,
) -> Result<TranslationCacheStats, String> {
    run_translate(app, |store, _, _| store.get_translation_cache_stats()).await
}

#[tauri::command]
pub async fn reload_reader_chapter_translation(
    app: AppHandle,
    book_id: u32,
    chapter_index: usize,
    translation_mode: Option<String>,
) -> Result<TranslatedChapterView, String> {
    translate_library_chapter(app, book_id, chapter_index, translation_mode, Some(true)).await
}

#[tauri::command]
pub async fn clear_reader_translation_cache(
    app: AppHandle,
) -> Result<ClearTranslationCacheOutcome, String> {
    run_translate(app, |store, _, _| store.clear_all_translated_cache()).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{BufRead, BufReader, Read, Write};
    use std::net::TcpListener;
    use std::thread;

    #[test]
    fn desktop_translate_transport_roundtrips_dichngay_json_over_loopback() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let addr = listener.local_addr().unwrap();

        let server = thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            let mut reader = BufReader::new(&mut stream);
            let mut content_len = 0usize;
            loop {
                let mut line = String::new();
                reader.read_line(&mut line).unwrap();
                let t = line.trim();
                if t.is_empty() {
                    break;
                }
                if let Some((k, v)) = t.split_once(':')
                    && k.trim().eq_ignore_ascii_case("content-length")
                {
                    content_len = v.trim().parse().unwrap_or(0);
                }
            }
            let mut body = vec![0u8; content_len];
            reader.read_exact(&mut body).unwrap();
            let body_str = String::from_utf8(body).unwrap();
            assert!(body_str.contains("__TM_NAME_0__"));

            let resp_body = r#"{"data":{"content":"[\"__TM_NAME_0__ nhìn bầu trời.\"]"}}"#;
            let resp = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                resp_body.len(),
                resp_body
            );
            stream.write_all(resp.as_bytes()).unwrap();
            stream.flush().unwrap();
        });

        let mock_url = format!("http://{addr}/translate/text");
        let mut transport = open_desktop_translate_transport(&mock_url).unwrap();
        let dir = tempfile::tempdir().unwrap();
        let store = TranslationStore::new(dir.path());
        store
            .update_name_set_entry("萧炎", "Tiêu Viêm", None, false, Some("lib_1"), None, None)
            .unwrap();

        let detail = store
            .translate_chapter_content(
                Some("lib_1"),
                "lib_1_ch_0",
                "萧炎望向天空。",
                "server",
                false,
                Some(&mut transport),
            )
            .unwrap();
        assert_eq!(detail.translated, "Tiêu Viêm nhìn bầu trời.");
        assert_eq!(detail.unit_map.len(), 1);
        server.join().unwrap();
    }
}
