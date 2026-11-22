use std::{fs, io, path::PathBuf};

use serde::Deserialize;
use tauri::webview::NewWindowResponse;
use tauri::{AppHandle, Manager, Url, WebviewUrl, WebviewWindowBuilder};

use novel_studio_core::upload::protocol::DEFAULT_WIKI_HOST;

const DEFAULT_PROFILE: &str = "mac-dinh";
#[derive(Deserialize)]
pub struct OpenOptions {
    profile: String,
    address: String,
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

#[tauri::command]
pub fn list_wiki_profiles(app: AppHandle) -> Result<Vec<String>, String> {
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
    Ok(profiles)
}

#[tauri::command]
pub async fn open_wiki(app: AppHandle, options: OpenOptions) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let directory = profile_path(&app, &options.profile)?;
        let url = resolve_address(&options.address)?;
        let label = format!("wiki-browser-{}", options.profile);
        if let Some(existing) = app.get_webview_window(&label) {
            existing.set_focus().map_err(|err| err.to_string())?;
            return Err("Hồ sơ đang mở. Đóng cửa sổ đó nếu muốn đổi địa chỉ.".into());
        }
        let data = directory.join("webview");
        fs::create_dir_all(&data).map_err(|err| err.to_string())?;
        let builder = WebviewWindowBuilder::new(&app, label, WebviewUrl::External(url))
            .title(format!("Wikidich — {}", options.profile))
            .inner_size(1050.0, 720.0)
            .data_directory(data)
            .on_navigation(allowed_url)
            .on_new_window(|_, _| NewWindowResponse::Deny);
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
    fn validates_profile_ids() {
        assert!(valid_profile("nguoi-doc-2"));
        for name in ["../escape", "con", "COM1", "com1", "lpt9", "", "lỗi"] {
            assert!(!valid_profile(name));
        }
    }
}
