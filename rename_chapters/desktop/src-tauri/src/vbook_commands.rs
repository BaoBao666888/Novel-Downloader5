use std::fs;
use std::path::PathBuf;

use novel_studio_core::vbook::model::{
    InstalledExtension, VBookBatchUpdateResult, VBookRefreshResult, VBookWorkspaceSnapshot,
};
use novel_studio_core::vbook::runner::{
    CoreVBookExecutor, RunnerStatus, VBookAiReply, VBookChapterContent, VBookChatMessage,
    VBookDetail, VBookResolvedTrack, VBookRunnerService, VBookSearchPage, VBookTocItem,
    VBookTranslateMeta, VBookTranslateResult, VBookTtsAudio, VBookTtsVoice,
};
use novel_studio_core::vbook::store::VBookExtensionStore;
use tauri::{AppHandle, Manager, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

use crate::winhttp_transport::open_desktop_vbook_transport;

pub const VBOOK_DIR_ENV: &str = "NOVEL_STUDIO_VBOOK_DIR";
pub const VBOOK_MOCK_RUNNER_ENV: &str = "NOVEL_STUDIO_VBOOK_MOCK_RUNNER";

fn is_mock_runner_enabled() -> bool {
    matches!(
        std::env::var(VBOOK_MOCK_RUNNER_ENV)
            .unwrap_or_default()
            .trim()
            .to_ascii_lowercase()
            .as_str(),
        "1" | "true" | "yes"
    )
}

fn open_executor() -> CoreVBookExecutor {
    CoreVBookExecutor::open(is_mock_runner_enabled())
}

fn resolve_vbook_dir(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(raw) = std::env::var(VBOOK_DIR_ENV) {
        let trimmed = raw.trim();
        if !trimmed.is_empty() {
            return Ok(PathBuf::from(trimmed));
        }
    }
    let root = app
        .path()
        .app_local_data_dir()
        .map_err(|err| format!("Không xác định được thư mục dữ liệu ứng dụng: {err}"))?;
    Ok(root.join("vbook-extensions"))
}

fn open_store(app: &AppHandle) -> Result<VBookExtensionStore, String> {
    let dir = resolve_vbook_dir(app)?;
    VBookExtensionStore::new(dir).map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn vbook_get_snapshot(app: AppHandle) -> Result<VBookWorkspaceSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || {
        open_store(&app)?.snapshot().map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_add_repo(app: AppHandle, url: String) -> Result<VBookWorkspaceSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || {
        open_store(&app)?
            .add_repo(&url)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_remove_repo(
    app: AppHandle,
    url: String,
) -> Result<VBookWorkspaceSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || {
        open_store(&app)?
            .remove_repo(&url)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_toggle_repo(
    app: AppHandle,
    url: String,
    enabled: bool,
) -> Result<VBookWorkspaceSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || {
        open_store(&app)?
            .toggle_repo(&url, enabled)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_refresh_repos(app: AppHandle) -> Result<VBookRefreshResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = open_store(&app)?;
        let snapshot = store.snapshot().map_err(|err| err.to_string())?;
        let hint = snapshot
            .repos
            .iter()
            .find(|r| r.enabled)
            .map(|r| r.url.clone())
            .unwrap_or_default();
        let mut transport = open_desktop_vbook_transport(&hint).map_err(|err| err.to_string())?;
        store
            .refresh_repos(&mut transport)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_install_from_url(
    app: AppHandle,
    url: String,
    target_installed_id: Option<String>,
) -> Result<InstalledExtension, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = open_store(&app)?;
        let mut transport = open_desktop_vbook_transport(&url).map_err(|err| err.to_string())?;
        store
            .install_from_url(&url, target_installed_id.as_deref(), &mut transport)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_update_extension(
    app: AppHandle,
    installed_id: String,
) -> Result<InstalledExtension, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = open_store(&app)?;
        let snap = store.snapshot().map_err(|err| err.to_string())?;
        let hint = snap
            .updates
            .iter()
            .find(|u| u.installed_id == installed_id)
            .map(|u| u.remote.path.clone())
            .unwrap_or_default();
        let mut transport = open_desktop_vbook_transport(&hint).map_err(|err| err.to_string())?;
        store
            .update_extension(&installed_id, &mut transport)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_update_all(app: AppHandle) -> Result<VBookBatchUpdateResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = open_store(&app)?;
        let snap = store.snapshot().map_err(|err| err.to_string())?;
        let hint = snap
            .updates
            .first()
            .map(|u| u.remote.path.clone())
            .unwrap_or_default();
        let mut transport = open_desktop_vbook_transport(&hint).map_err(|err| err.to_string())?;
        store
            .update_all_extensions(&mut transport)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_pick_and_install_local_zip(
    window: WebviewWindow,
    app: AppHandle,
) -> Result<Option<InstalledExtension>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(selected) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Chọn gói nguồn mở rộng VBook (.zip)")
            .add_filter("VBook Extension ZIP", &["zip"])
            .blocking_pick_file()
        else {
            return Ok(None);
        };
        let path = selected.into_path().map_err(|err| err.to_string())?;
        let filename = path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("plugin.zip")
            .to_owned();
        if !filename.to_ascii_lowercase().ends_with(".zip") {
            return Err("Chỉ hỗ trợ cài đặt gói nguồn mở rộng định dạng .zip.".into());
        }
        let bytes = fs::read(&path).map_err(|err| format!("Không đọc được tệp ZIP: {err}"))?;
        let store = open_store(&app)?;
        let installed = store
            .install_from_local_zip(&filename, &bytes)
            .map_err(|err| err.to_string())?;
        Ok(Some(installed))
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_uninstall_extension(
    app: AppHandle,
    installed_id: String,
) -> Result<VBookWorkspaceSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || {
        open_store(&app)?
            .uninstall_extension(&installed_id)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_toggle_pin_extension(
    app: AppHandle,
    installed_id: String,
    pinned: bool,
) -> Result<VBookWorkspaceSnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || {
        open_store(&app)?
            .set_extension_pinned(&installed_id, pinned)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_save_extension_config(
    app: AppHandle,
    installed_id: String,
    config_json: String,
) -> Result<InstalledExtension, String> {
    tauri::async_runtime::spawn_blocking(move || {
        open_store(&app)?
            .save_extension_config_json(&installed_id, &config_json)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_runner_status() -> Result<RunnerStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        Ok(CoreVBookExecutor::probe_status(is_mock_runner_enabled()))
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_search(
    app: AppHandle,
    installed_id: String,
    query: String,
    page: Option<String>,
) -> Result<VBookSearchPage, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = open_store(&app)?;
        let mut exec = open_executor();
        VBookRunnerService::new(&store)
            .search(&installed_id, &query, page.as_deref(), &mut exec)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_detail(
    app: AppHandle,
    installed_id: String,
    url: String,
) -> Result<VBookDetail, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = open_store(&app)?;
        let mut exec = open_executor();
        VBookRunnerService::new(&store)
            .detail(&installed_id, &url, &mut exec)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_toc(
    app: AppHandle,
    installed_id: String,
    book_url: String,
) -> Result<Vec<VBookTocItem>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = open_store(&app)?;
        let mut exec = open_executor();
        VBookRunnerService::new(&store)
            .toc(&installed_id, &book_url, &mut exec)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_chap(
    app: AppHandle,
    installed_id: String,
    chapter_url: String,
    content_type_hint: Option<String>,
) -> Result<VBookChapterContent, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = open_store(&app)?;
        let mut exec = open_executor();
        VBookRunnerService::new(&store)
            .chap(
                &installed_id,
                &chapter_url,
                content_type_hint.as_deref(),
                &mut exec,
            )
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_resolve_track(
    app: AppHandle,
    installed_id: String,
    track_data: String,
) -> Result<VBookResolvedTrack, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = open_store(&app)?;
        let mut exec = open_executor();
        VBookRunnerService::new(&store)
            .resolve_track(&installed_id, &track_data, &mut exec)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_tts_voices(
    app: AppHandle,
    installed_id: String,
) -> Result<Vec<VBookTtsVoice>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = open_store(&app)?;
        let mut exec = open_executor();
        VBookRunnerService::new(&store)
            .tts_voices(&installed_id, &mut exec)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_tts_synthesize(
    app: AppHandle,
    installed_id: String,
    text: String,
    voice_id: String,
) -> Result<VBookTtsAudio, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = open_store(&app)?;
        let mut exec = open_executor();
        VBookRunnerService::new(&store)
            .tts_synthesize(&installed_id, &text, &voice_id, &mut exec)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_translate_meta(
    app: AppHandle,
    installed_id: String,
) -> Result<VBookTranslateMeta, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = open_store(&app)?;
        let mut exec = open_executor();
        VBookRunnerService::new(&store)
            .translate_meta(&installed_id, &mut exec)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn vbook_translate_text(
    app: AppHandle,
    installed_id: String,
    text: String,
    from: String,
    to: String,
    source: String,
    model: String,
    style: String,
) -> Result<VBookTranslateResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = open_store(&app)?;
        let mut exec = open_executor();
        VBookRunnerService::new(&store)
            .translate_text(
                &installed_id,
                &text,
                &from,
                &to,
                &source,
                &model,
                &style,
                &mut exec,
            )
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn vbook_ai_chat(
    app: AppHandle,
    installed_id: String,
    messages: Vec<VBookChatMessage>,
    selected_model: String,
) -> Result<VBookAiReply, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let store = open_store(&app)?;
        let mut exec = open_executor();
        VBookRunnerService::new(&store)
            .ai_chat_messages(&installed_id, &messages, &selected_model, &mut exec)
            .map_err(|err| err.to_string())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[cfg(test)]
mod tests {
    use std::io::{Read, Write};
    use std::net::TcpListener;
    use std::sync::{
        Arc, Mutex,
        atomic::{AtomicUsize, Ordering},
    };
    use std::thread;

    use novel_studio_core::vbook::model::DEFAULT_VBOOK_REPO_URL;

    use super::*;
    use crate::winhttp_transport::VBOOK_MOCK_BASE_URL_ENV;

    static ENV_GUARD: Mutex<()> = Mutex::new(());

    fn make_stored_zip(entries: &[(&str, &[u8])]) -> Vec<u8> {
        let mut cursor = std::io::Cursor::new(Vec::new());
        let stored_entries: Vec<novel_studio_core::upload::backup_zip::ZipStoredEntry> = entries
            .iter()
            .map(
                |(n, d)| novel_studio_core::upload::backup_zip::ZipStoredEntry {
                    name: (*n).to_owned(),
                    data: (*d).to_vec(),
                },
            )
            .collect();
        novel_studio_core::upload::backup_zip::write_stored_zip(&mut cursor, &stored_entries)
            .expect("write zip");
        cursor.into_inner()
    }

    #[test]
    fn desktop_vbook_transport_refreshes_installs_and_updates_via_mock_env() {
        let _guard = ENV_GUARD.lock().expect("env lock");
        let dir = tempfile::tempdir().expect("tempdir");
        let listener = TcpListener::bind("127.0.0.1:0").expect("bind");
        let port = listener.local_addr().expect("addr").port();
        let ver = Arc::new(AtomicUsize::new(1));
        let stop = Arc::new(AtomicUsize::new(0));
        let ver_srv = Arc::clone(&ver);
        let stop_srv = Arc::clone(&stop);

        let srv = thread::spawn(move || {
            let _ = listener.set_nonblocking(true);
            while stop_srv.load(Ordering::Relaxed) == 0 {
                match listener.accept() {
                    Ok((mut sock, _)) => {
                        let _ = sock.set_nonblocking(false);
                        let mut buf = [0u8; 2048];
                        let n = sock.read(&mut buf).unwrap_or(0);
                        let req = String::from_utf8_lossy(&buf[..n]);
                        let path = req
                            .lines()
                            .next()
                            .and_then(|l| l.split_whitespace().nth(1))
                            .unwrap_or("/");
                        let v = ver_srv.load(Ordering::Relaxed);
                        if path == "/api/plugin.json" {
                            let body = format!(
                                r#"{{"metadata":{{"name":"WinMock"}},"data":[{{"name":"Demo Nguon","path":"ext/demo.zip","version":{v},"source":"https://demo.test","type":"novel","locale":"vi_VN","author":"Dev"}}]}}"#
                            );
                            let resp = format!(
                                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                                body.len()
                            );
                            let _ = sock.write_all(resp.as_bytes());
                        } else if path == "/api/ext/demo.zip" {
                            let pjson = format!(
                                r#"{{"metadata":{{"name":"Demo Nguon","author":"Dev","version":{v},"source":"https://demo.test","type":"novel"}},"script":{{"chap":"chap.js"}}}}"#
                            );
                            let zip = make_stored_zip(&[("plugin.json", pjson.as_bytes())]);
                            let head = format!(
                                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                                zip.len()
                            );
                            let _ = sock.write_all(head.as_bytes());
                            let _ = sock.write_all(&zip);
                        } else {
                            let _ = sock.write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
                        }
                    }
                    Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                        thread::sleep(std::time::Duration::from_millis(10));
                    }
                    Err(_) => break,
                }
            }
        });

        unsafe {
            std::env::set_var(VBOOK_MOCK_BASE_URL_ENV, format!("http://127.0.0.1:{port}"));
        }

        let store = VBookExtensionStore::new(dir.path()).expect("store");
        store
            .toggle_repo(DEFAULT_VBOOK_REPO_URL, false)
            .expect("disable default");
        store
            .add_repo("https://mock.invalid/api/plugin.json")
            .expect("add mock");

        let mut transport = open_desktop_vbook_transport("https://mock.invalid/api/plugin.json")
            .expect("transport");
        let r1 = store.refresh_repos(&mut transport).expect("refresh 1");
        assert_eq!(r1.snapshot.catalog.len(), 1);
        let url = r1.snapshot.catalog[0].remote.path.clone();
        let inst = store
            .install_from_url(&url, None, &mut transport)
            .expect("install v1");
        assert_eq!(inst.version, 1);

        store
            .save_extension_config_json(&inst.id, r#"{"timeout":42}"#)
            .expect("save cfg");

        ver.store(2, Ordering::Relaxed);
        let r2 = store.refresh_repos(&mut transport).expect("refresh 2");
        assert_eq!(r2.snapshot.updates.len(), 1);
        let updated = store
            .update_extension(&inst.id, &mut transport)
            .expect("update to v2");
        assert_eq!(updated.version, 2);
        assert_eq!(
            updated.user_config.get("timeout").and_then(|v| v.as_i64()),
            Some(42)
        );

        unsafe {
            std::env::remove_var(VBOOK_MOCK_BASE_URL_ENV);
        }
        stop.store(1, Ordering::Relaxed);
        let _ = srv.join();
    }

    #[test]
    fn desktop_mock_runner_executes_video_audio_tts_translate_and_ai() {
        let _guard = ENV_GUARD.lock().expect("env lock");
        let dir = tempfile::tempdir().expect("tempdir");
        let store = VBookExtensionStore::new(dir.path()).expect("store");
        unsafe {
            std::env::set_var(VBOOK_MOCK_RUNNER_ENV, "1");
        }

        let status = CoreVBookExecutor::probe_status(is_mock_runner_enabled());
        assert!(status.ready && status.mock_mode);
        let mut exec = open_executor();
        let svc = VBookRunnerService::new(&store);

        let video_zip = make_stored_zip(&[(
            "plugin.json",
            br#"{"metadata":{"name":"Anime Mock","type":"video","version":1,"source":"https://video.example"},"script":{"search":"search.js","detail":"detail.js","toc":"toc.js","chap":"chap.js","track":"track.js"}}"#,
        )]);
        let video = store
            .install_from_local_zip("anime.zip", &video_zip)
            .expect("install video");
        let search = svc
            .search(&video.id, "tu tien", None, &mut exec)
            .expect("search");
        assert_eq!(search.items.len(), 2);
        let detail = svc
            .detail(&video.id, &search.items[0].link, &mut exec)
            .expect("detail");
        assert_eq!(detail.detail_type, "video");
        let toc = svc.toc(&video.id, &detail.url, &mut exec).expect("toc");
        let chap = svc
            .chap(&video.id, &toc[0].url, None, &mut exec)
            .expect("chap");
        let VBookChapterContent::MediaTracks { tracks, .. } = chap else {
            panic!("expected MediaTracks");
        };
        let resolved = svc
            .resolve_track(&video.id, &tracks[0].data, &mut exec)
            .expect("track");
        assert!(resolved.data.ends_with("master.m3u8"));

        let tts_zip = make_stored_zip(&[(
            "plugin.json",
            br#"{"metadata":{"name":"TTS Mock","type":"tts","version":1},"script":{"voice":"voice.js","tts":"tts.js"}}"#,
        )]);
        let tts = store
            .install_from_local_zip("tts.zip", &tts_zip)
            .expect("install tts");
        let voices = svc.tts_voices(&tts.id, &mut exec).expect("voices");
        let audio = svc
            .tts_synthesize(&tts.id, "Xin chào", &voices[0].id, &mut exec)
            .expect("tts");
        assert_eq!(audio.mime_type, "audio/wav");

        let tr_zip = make_stored_zip(&[(
            "plugin.json",
            br#"{"metadata":{"name":"Translate Mock","type":"translate","version":1},"script":{"language":"language.js","model":"model.js","style":"style.js","translate":"translate.js"}}"#,
        )]);
        let tr = store
            .install_from_local_zip("tr.zip", &tr_zip)
            .expect("install tr");
        let meta = svc.translate_meta(&tr.id, &mut exec).expect("meta");
        assert!(!meta.models.is_empty());
        let tr_res = svc
            .translate_text(&tr.id, "你好", "zh", "vi", "", "fast", "hanviet", &mut exec)
            .expect("translate");
        assert!(tr_res.text.contains("你好"));

        let ai_zip = make_stored_zip(&[(
            "plugin.json",
            br#"{"metadata":{"name":"AI Mock","type":"ai","version":1},"script":{"chatStream":"chat.js"}}"#,
        )]);
        let ai = store
            .install_from_local_zip("ai.zip", &ai_zip)
            .expect("install ai");
        let reply = svc
            .ai_chat_messages(
                &ai.id,
                &[VBookChatMessage {
                    role: "user".to_owned(),
                    content: "Tóm tắt chương 1".to_owned(),
                }],
                "gpt-4o",
                &mut exec,
            )
            .expect("ai chat");
        assert!(reply.text.contains("Tóm tắt chương 1"));

        unsafe {
            std::env::remove_var(VBOOK_MOCK_RUNNER_ENV);
        }
    }
}
