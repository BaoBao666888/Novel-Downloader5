use std::fs::{self, File};
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::webview::NewWindowResponse;
use tauri::{AppHandle, Manager, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_dialog::DialogExt;

use novel_studio_core::upload::protocol::DEFAULT_WIKI_HOST;

const DEFAULT_PROFILE: &str = "mac-dinh";
const SCRIPT_LIMIT: u64 = 1024 * 1024;
const SCRIPT_FILE: &str = "selected.user.js";

#[derive(Serialize)]
pub struct Profile {
    name: String,
    has_script: bool,
}

#[derive(Deserialize)]
pub struct OpenOptions {
    profile: String,
    address: String,
    run_script: bool,
}

#[derive(Serialize)]
struct MatchPattern<'a> {
    host: &'a str,
    path: &'a str,
}

#[derive(Default)]
enum Timing {
    Start,
    End,
    #[default]
    Idle,
}

fn wiki_host(host: &str) -> bool {
    matches!(host, DEFAULT_WIKI_HOST | "wikicv.net")
}

fn allowed_url(url: &Url) -> bool {
    url.scheme() == "https"
        && url.host_str().is_some_and(wiki_host)
        && url.port().is_none()
        && url.username().is_empty()
        && url.password().is_none()
}

fn resolve_address(address: &str) -> Result<Url, String> {
    let address = address.trim();
    let home = format!("https://{DEFAULT_WIKI_HOST}/");
    let url = Url::parse(if address.is_empty() { &home } else { address })
        .map_err(|_| "Hãy nhập địa chỉ HTTPS đầy đủ của Wikidich.".to_owned())?;
    if !allowed_url(&url) {
        return Err("Cửa sổ này chỉ mở Wikidich trên wikicv.org hoặc wikicv.net.".into());
    }
    Ok(url)
}

fn valid_profile(name: &str) -> bool {
    let starts_with_letter = name.as_bytes().first().is_some_and(u8::is_ascii_lowercase);
    let reserved_port = name
        .strip_prefix("com")
        .or_else(|| name.strip_prefix("lpt"))
        .is_some_and(|suffix| matches!(suffix.as_bytes(), [b'1'..=b'9']));
    starts_with_letter
        && name.len() <= 32
        && name
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
        && !reserved_port
        && !matches!(name, "con" | "prn" | "aux" | "nul")
}

fn profile_root(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_local_data_dir()
        .map(|dir| dir.join("wiki-browser"))
        .map_err(|err| err.to_string())
}

fn profile_path(app: &AppHandle, name: &str) -> Result<PathBuf, String> {
    if !valid_profile(name) {
        return Err("Tên hồ sơ cần bắt đầu bằng chữ thường, dài tối đa 32 ký tự, chỉ dùng a–z, số và dấu gạch ngang.".into());
    }
    Ok(profile_root(app)?.join(name))
}

fn match_pattern(raw: &str) -> Option<MatchPattern<'_>> {
    let (scheme, location) = raw.split_once("://")?;
    let (host, _) = location.split_once('/')?;
    let path = &location[host.len()..];
    (matches!(scheme, "https" | "*") && wiki_host(host) && !path.contains(['#', '\t', ' ']))
        .then_some(MatchPattern { host, path })
}

fn script_source(source: &str) -> Result<String, String> {
    let mut lines = source.trim_start_matches('\u{feff}').lines();
    if !lines.any(|line| line.trim() == "// ==UserScript==") {
        return Err("Không tìm thấy phần metadata ==UserScript==.".into());
    }
    let mut matches = Vec::new();
    let mut excludes = Vec::new();
    let mut timing = Timing::default();
    let mut closed = false;
    for line in lines {
        let line = line.trim();
        if line == "// ==/UserScript==" {
            closed = true;
            break;
        }
        let Some(directive) = line
            .strip_prefix("//")
            .map(str::trim)
            .filter(|line| line.starts_with('@'))
        else {
            continue;
        };
        let (name, value) = directive
            .split_once(char::is_whitespace)
            .unwrap_or((directive, ""));
        let value = value.trim();
        match name {
            "@match" | "@exclude-match" => {
                let pattern = match_pattern(value)
                    .ok_or("@match và @exclude-match cần chỉ rõ miền Wikidich và đường dẫn.")?;
                if name == "@match" {
                    matches.push(pattern);
                } else {
                    excludes.push(pattern);
                }
            }
            "@run-at" => {
                timing = match value {
                    "document-start" => Timing::Start,
                    "document-end" => Timing::End,
                    "document-idle" => Timing::Idle,
                    _ => return Err("Userscript có thời điểm chạy chưa được hỗ trợ.".into()),
                }
            }
            "@grant" if value == "none" => {}
            "@grant" | "@require" | "@resource" | "@include" | "@exclude" | "@inject-into"
            | "@sandbox" => {
                return Err(format!(
                    "Userscript này dùng {name}. Chỉ hỗ trợ script DOM với @grant none và @match."
                ));
            }
            _ => {}
        }
    }
    if !closed || matches.is_empty() {
        return Err("Userscript cần đóng metadata và có ít nhất một @match Wikidich.".into());
    }

    // Serialize metadata as data. The user's code runs inside this remote view only.
    let includes = serde_json::to_string(&matches).map_err(|err| err.to_string())?;
    let excludes = serde_json::to_string(&excludes).map_err(|err| err.to_string())?;
    let run = match timing {
        Timing::Start => "run();",
        Timing::End => {
            "if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, {once:true}); else run();"
        }
        Timing::Idle => {
            "if (document.readyState === 'complete') setTimeout(run, 0); else window.addEventListener('load', run, {once:true});"
        }
    };
    Ok(format!(
        r#"
(() => {{
  if (window !== window.top || location.protocol !== 'https:' || location.port) return;
  const matches = ({{host, path}}) => location.hostname === host && new RegExp('^' + path.split('*').map(
    token => token.replace(/[.*+?^${{}}()|[\]\\]/g, '\\$&')).join('.*') + '$').test(location.pathname + location.search);
  if (!{includes}.some(matches) || {excludes}.some(matches)) return;
  function run() {{
{source}
  }}
  {run}
}})();"#
    ))
}

fn read_script(path: &Path) -> Result<String, String> {
    let mut source = String::new();
    File::open(path)
        .and_then(|file| file.take(SCRIPT_LIMIT + 1).read_to_string(&mut source))
        .map_err(|err| format!("Không đọc được userscript UTF-8: {err}"))?;
    if source.len() as u64 > SCRIPT_LIMIT {
        return Err("Userscript lớn hơn 1 MiB.".into());
    }
    Ok(source)
}

#[tauri::command]
pub fn list_wiki_profiles(app: AppHandle) -> Result<Vec<Profile>, String> {
    let root = profile_root(&app)?;
    let mut profiles = vec![DEFAULT_PROFILE.to_owned()];
    match fs::read_dir(&root) {
        Ok(entries) => {
            for entry in entries {
                let entry = entry.map_err(|err| err.to_string())?;
                if let Ok(name) = entry.file_name().into_string()
                    && name != DEFAULT_PROFILE
                    && valid_profile(&name)
                    && entry.file_type().is_ok_and(|kind| kind.is_dir())
                {
                    profiles.push(name);
                }
            }
        }
        Err(err) if err.kind() == io::ErrorKind::NotFound => {}
        Err(err) => return Err(err.to_string()),
    }
    profiles[1..].sort_unstable();
    Ok(profiles
        .into_iter()
        .map(|name| Profile {
            has_script: root.join(&name).join(SCRIPT_FILE).is_file(),
            name,
        })
        .collect())
}

#[tauri::command]
pub async fn import_wiki_script(window: WebviewWindow, profile: String) -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let directory = profile_path(window.app_handle(), &profile)?;
        let Some(file) = window
            .dialog()
            .file()
            .set_parent(&window)
            .set_title("Chọn userscript Wikidich")
            .add_filter("Userscript", &["js"])
            .blocking_pick_file()
        else {
            return Ok(false);
        };
        let file = file.into_path().map_err(|err| err.to_string())?;
        if !file
            .file_name()
            .and_then(|name| name.to_str())
            .is_some_and(|name| name.to_ascii_lowercase().ends_with(".user.js"))
        {
            return Err("Hãy chọn tệp .user.js.".into());
        }
        let source = read_script(&file)?;
        script_source(&source)?;
        fs::create_dir_all(&directory).map_err(|err| err.to_string())?;
        let mut staged =
            tempfile::NamedTempFile::new_in(&directory).map_err(|err| err.to_string())?;
        staged
            .write_all(source.as_bytes())
            .and_then(|()| staged.as_file().sync_all())
            .map_err(|err| err.to_string())?;
        staged
            .persist(directory.join(SCRIPT_FILE))
            .map_err(|err| err.to_string())?;
        Ok(true)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn open_wiki(app: AppHandle, options: OpenOptions) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let directory = profile_path(&app, &options.profile)?;
        let url = resolve_address(&options.address)?;
        let label = format!("wiki-browser-{}", options.profile);
        if let Some(existing) = app.get_webview_window(&label) {
            existing.set_focus().map_err(|err| err.to_string())?;
            return Err(
                "Hồ sơ đang mở. Đóng cửa sổ đó nếu muốn đổi địa chỉ hoặc userscript.".into(),
            );
        }
        let script = if options.run_script {
            Some(script_source(&read_script(&directory.join(SCRIPT_FILE))?)?)
        } else {
            None
        };
        let data = directory.join("webview");
        fs::create_dir_all(&data).map_err(|err| err.to_string())?;
        let mut builder = WebviewWindowBuilder::new(&app, label, WebviewUrl::External(url))
            .title(format!("Wikidich — {}", options.profile))
            .inner_size(1050.0, 720.0)
            .data_directory(data)
            .on_navigation(allowed_url)
            .on_new_window(|_, _| NewWindowResponse::Deny);
        if let Some(script) = script {
            builder = builder.initialization_script(script);
        }
        builder.build().map_err(|err| err.to_string())?;
        Ok(())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn browser_addresses_require_an_exact_wiki_origin() {
        assert_eq!(
            resolve_address("").unwrap().host_str(),
            Some(DEFAULT_WIKI_HOST)
        );
        assert!(resolve_address("https://wikicv.net/truyen/a").is_ok());
        for url in [
            "http://wikicv.org/",
            "https://wikicv.org.evil.com/",
            "https://wikicv.org:444/",
            "https://user@wikicv.org/",
            "https://koanchay.org/",
            "tauri://localhost",
        ] {
            assert!(resolve_address(url).is_err(), "{url}");
        }
    }

    #[test]
    fn validates_whitelisted_metadata_and_profile_ids() {
        let source = "// ==UserScript==\n// @match https://wikicv.org/truyen/*\n// @exclude-match https://wikicv.org/truyen/no*\n// @run-at document-end\n// @grant none\n// ==/UserScript==\nconsole.log('ok');";
        let code = script_source(source).unwrap();
        assert!(code.contains("DOMContentLoaded"));
        assert!(code.contains("/truyen/no*"));
        assert!(script_source(&source.replace("@grant none", "@grant GM_xmlhttpRequest")).is_err());
        assert!(script_source(&source.replace("wikicv.org/truyen/*", "evil.test/*")).is_err());
        assert!(
            script_source(&source.replace("@grant none", "@require https://example.com/script.js"))
                .is_err()
        );
        assert!(valid_profile("nguoi-doc-2"));
        for name in ["../escape", "con", "COM1", "com1", "lpt9", "", "lỗi"] {
            assert!(!valid_profile(name));
        }
    }
}
