use std::collections::{BTreeMap, BTreeSet};
use std::fs::{self, File, OpenOptions};
use std::io::{BufRead, BufReader, BufWriter, Read, Write};
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::Serialize;
use serde::de::DeserializeOwned;
use serde_json::Value;
use tempfile::NamedTempFile;

use crate::CoreError;
use crate::vbook::catalog::{
    build_catalog_views, compute_extension_updates, extension_matches_remote,
    normalize_repo_meta_into, parse_repo_catalog,
};
use crate::vbook::model::{
    DEFAULT_VBOOK_REPO_URL, ExtensionRepo, InstalledExtension, RefreshError, RemoteExtension,
    VBookBatchUpdateResult, VBookRefreshResult, VBookWorkspaceSnapshot,
};
use crate::vbook::package::{ParsedExtensionPackage, deterministic_extension_id, parse_vbook_zip};

const MAX_REMOTE_TEXT_BYTES: usize = 8 * 1024 * 1024;
const MAX_REMOTE_ZIP_BYTES: usize = 32 * 1024 * 1024;

pub trait VBookHttpTransport {
    fn get_text(&mut self, url: &str, timeout_sec: u64) -> Result<String, CoreError>;
    fn get_bytes(&mut self, url: &str, timeout_sec: u64) -> Result<Vec<u8>, CoreError>;
}

/// Transport HTTP/1.1 thuần Rust cho server loopback `127.0.0.1` trong kiểm thử.
pub struct LoopbackVBookTransport {
    base_url: Option<String>,
}

impl LoopbackVBookTransport {
    pub fn new(base_url: Option<String>) -> Self {
        Self {
            base_url: base_url.map(|u| u.trim_end_matches('/').to_owned()),
        }
    }

    fn rewrite_url(&self, raw_url: &str) -> Result<String, CoreError> {
        let trimmed = raw_url.trim();
        if let Some(base) = &self.base_url
            && !base.is_empty()
            && let Some(after_scheme) = trimmed
                .strip_prefix("https://")
                .or_else(|| trimmed.strip_prefix("http://"))
        {
            let path = after_scheme
                .find('/')
                .map(|i| &after_scheme[i..])
                .unwrap_or("/");
            return Ok(format!("{base}{path}"));
        }
        if trimmed.starts_with("http://127.0.0.1:") {
            return Ok(trimmed.to_owned());
        }
        Err("LoopbackVBookTransport chỉ hỗ trợ URL http://127.0.0.1:<port>.".into())
    }

    fn fetch_raw(
        &self,
        raw_url: &str,
        timeout_sec: u64,
        max_bytes: usize,
    ) -> Result<Vec<u8>, CoreError> {
        let mut current = self.rewrite_url(raw_url)?;
        for _ in 0..4 {
            let after_http = current
                .strip_prefix("http://")
                .ok_or("Chỉ hỗ trợ HTTP loopback.")?;
            let (host_port, req_path) = match after_http.find('/') {
                Some(idx) => (&after_http[..idx], &after_http[idx..]),
                None => (after_http, "/"),
            };
            let mut stream = TcpStream::connect(host_port)
                .map_err(|err| format!("Không kết nối được loopback {host_port}: {err}"))?;
            let timeout = Some(Duration::from_secs(timeout_sec.clamp(2, 60)));
            let _ = stream.set_read_timeout(timeout);
            let _ = stream.set_write_timeout(timeout);

            {
                let mut writer = BufWriter::new(&mut stream);
                write!(
                    writer,
                    "GET {req_path} HTTP/1.1\r\nHost: {host_port}\r\nConnection: close\r\nUser-Agent: NovelStudio-VBook/0.1\r\n\r\n"
                )?;
                writer.flush()?;
            }

            let mut reader = BufReader::new(stream);
            let mut status_line = String::new();
            if reader.read_line(&mut status_line)? == 0 {
                return Err("Server đóng kết nối khi chưa gửi HTTP status.".into());
            }
            let status_code = status_line
                .split_whitespace()
                .nth(1)
                .and_then(|s| s.parse::<u16>().ok())
                .ok_or("HTTP status line không hợp lệ.")?;

            let mut content_length: Option<usize> = None;
            let mut chunked = false;
            let mut location: Option<String> = None;
            loop {
                let mut line = String::new();
                reader.read_line(&mut line)?;
                let trimmed = line.trim_end_matches(['\r', '\n']);
                if trimmed.is_empty() {
                    break;
                }
                if let Some((k, v)) = trimmed.split_once(':') {
                    let k_low = k.trim().to_ascii_lowercase();
                    let v_trim = v.trim();
                    match k_low.as_str() {
                        "content-length" => content_length = v_trim.parse::<usize>().ok(),
                        "transfer-encoding" if v_trim.to_ascii_lowercase().contains("chunked") => {
                            chunked = true;
                        }
                        "location" => location = Some(v_trim.to_owned()),
                        _ => {}
                    }
                }
            }

            if (300..400).contains(&status_code)
                && let Some(loc) = location
            {
                current = self.rewrite_url(&loc)?;
                continue;
            }
            if !(200..300).contains(&status_code) {
                return Err(format!("HTTP {status_code} khi tải {req_path}").into());
            }

            let body = if chunked {
                read_chunked_body(&mut reader, max_bytes)?
            } else if let Some(len) = content_length {
                if len > max_bytes {
                    return Err("Phản hồi vượt quá giới hạn kích thước cho phép.".into());
                }
                let mut buf = vec![0u8; len];
                reader.read_exact(&mut buf)?;
                buf
            } else {
                let mut buf = Vec::new();
                reader.take((max_bytes + 1) as u64).read_to_end(&mut buf)?;
                if buf.len() > max_bytes {
                    return Err("Phản hồi vượt quá giới hạn kích thước cho phép.".into());
                }
                buf
            };
            return Ok(body);
        }
        Err("Quá số lần chuyển hướng HTTP cho phép.".into())
    }
}

impl VBookHttpTransport for LoopbackVBookTransport {
    fn get_text(&mut self, url: &str, timeout_sec: u64) -> Result<String, CoreError> {
        let bytes = self.fetch_raw(url, timeout_sec, MAX_REMOTE_TEXT_BYTES)?;
        Ok(String::from_utf8(bytes)?)
    }

    fn get_bytes(&mut self, url: &str, timeout_sec: u64) -> Result<Vec<u8>, CoreError> {
        self.fetch_raw(url, timeout_sec, MAX_REMOTE_ZIP_BYTES)
    }
}

fn read_chunked_body<R: BufRead>(reader: &mut R, max_bytes: usize) -> Result<Vec<u8>, CoreError> {
    let mut out = Vec::new();
    loop {
        let mut size_line = String::new();
        if reader.read_line(&mut size_line)? == 0 {
            break;
        }
        let hex_str = size_line.split(';').next().unwrap_or("").trim();
        let chunk_len = usize::from_str_radix(hex_str, 16)
            .map_err(|_| "Định dạng chunked HTTP không hợp lệ.")?;
        if chunk_len == 0 {
            break;
        }
        if out.len() + chunk_len > max_bytes {
            return Err("Dữ liệu chunked vượt quá giới hạn kích thước.".into());
        }
        let prev = out.len();
        out.resize(prev + chunk_len, 0);
        reader.read_exact(&mut out[prev..])?;
        let mut crlf = [0u8; 2];
        reader.read_exact(&mut crlf)?;
    }
    Ok(out)
}

#[derive(Debug)]
pub struct VBookExtensionStore {
    root: PathBuf,
}

struct StoreLockGuard {
    path: PathBuf,
}

impl Drop for StoreLockGuard {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.path);
    }
}

impl VBookExtensionStore {
    pub fn new(root: impl AsRef<Path>) -> Result<Self, CoreError> {
        let root_path = root.as_ref().to_path_buf();
        fs::create_dir_all(&root_path)?;
        fs::create_dir_all(root_path.join("packages"))?;
        Ok(Self { root: root_path })
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    fn repos_path(&self) -> PathBuf {
        self.root.join("repos.json")
    }

    fn catalog_cache_path(&self) -> PathBuf {
        self.root.join("catalog-cache.json")
    }

    fn installed_path(&self) -> PathBuf {
        self.root.join("installed.json")
    }

    fn packages_dir(&self) -> PathBuf {
        self.root.join("packages")
    }

    fn acquire_lock(&self) -> Result<StoreLockGuard, CoreError> {
        let lock_path = self.root.join("vbook.lock");
        for _ in 0..40 {
            match OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&lock_path)
            {
                Ok(mut f) => {
                    let _ = writeln!(f, "pid={}", std::process::id());
                    return Ok(StoreLockGuard { path: lock_path });
                }
                Err(err) if err.kind() == std::io::ErrorKind::AlreadyExists => {
                    std::thread::sleep(Duration::from_millis(25));
                }
                Err(err) => return Err(err.into()),
            }
        }
        Err("Kho extension đang bận bởi thao tác khác. Vui lòng thử lại.".into())
    }

    fn load_repos(&self) -> Result<Vec<ExtensionRepo>, CoreError> {
        let path = self.repos_path();
        if !path.exists() {
            let defaults = vec![ExtensionRepo {
                url: DEFAULT_VBOOK_REPO_URL.to_owned(),
                name: "VBook Extensions Official".to_owned(),
                author: "vBook".to_owned(),
                description: "Kho nguồn mở rộng mặc định (vbookext.me)".to_owned(),
                enabled: true,
                locked: false,
                last_synced_at: 0,
                last_error: None,
                plugin_count: 0,
            }];
            write_json_atomic(&path, &defaults)?;
            return Ok(defaults);
        }
        read_json_file(&path)
    }

    fn load_catalog(&self) -> Result<Vec<RemoteExtension>, CoreError> {
        let path = self.catalog_cache_path();
        if !path.exists() {
            return Ok(Vec::new());
        }
        read_json_file(&path)
    }

    fn load_installed(&self) -> Result<Vec<InstalledExtension>, CoreError> {
        let path = self.installed_path();
        if !path.exists() {
            return Ok(Vec::new());
        }
        read_json_file(&path)
    }

    pub fn snapshot(&self) -> Result<VBookWorkspaceSnapshot, CoreError> {
        let repos = self.load_repos()?;
        let enabled_urls: BTreeSet<&str> = repos
            .iter()
            .filter(|r| r.enabled)
            .map(|r| r.url.as_str())
            .collect();
        let all_remote = self.load_catalog()?;
        let active_remote: Vec<RemoteExtension> = all_remote
            .into_iter()
            .filter(|item| enabled_urls.is_empty() || enabled_urls.contains(item.repo_url.as_str()))
            .collect();

        let mut installed = self.load_installed()?;
        installed.sort_by(|a, b| {
            b.pinned
                .cmp(&a.pinned)
                .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
        });

        let updates = compute_extension_updates(&installed, &active_remote);
        let catalog = build_catalog_views(&installed, &active_remote);

        let mut types_set = BTreeSet::new();
        let mut lang_set = BTreeSet::new();
        let mut author_set = BTreeSet::new();
        for item in &active_remote {
            types_set.insert(item.ext_type.as_str().to_owned());
            if !item.language.is_empty() {
                lang_set.insert(item.language.clone());
            }
            if !item.author.trim().is_empty() {
                author_set.insert(item.author.trim().to_owned());
            }
        }

        Ok(VBookWorkspaceSnapshot {
            repos,
            updates,
            installed,
            catalog,
            types: types_set.into_iter().collect(),
            languages: lang_set.into_iter().collect(),
            authors: author_set.into_iter().collect(),
        })
    }

    pub fn add_repo(&self, raw_url: &str) -> Result<VBookWorkspaceSnapshot, CoreError> {
        let _lock = self.acquire_lock()?;
        let url = normalize_repo_url(raw_url)?;
        let mut repos = self.load_repos()?;
        if let Some(existing) = repos.iter_mut().find(|r| r.url.eq_ignore_ascii_case(&url)) {
            existing.enabled = true;
        } else {
            repos.push(ExtensionRepo {
                name: infer_repo_name(&url),
                url,
                author: String::new(),
                description: String::new(),
                enabled: true,
                locked: false,
                last_synced_at: 0,
                last_error: None,
                plugin_count: 0,
            });
        }
        write_json_atomic(&self.repos_path(), &repos)?;
        self.snapshot()
    }

    pub fn remove_repo(&self, repo_url: &str) -> Result<VBookWorkspaceSnapshot, CoreError> {
        let _lock = self.acquire_lock()?;
        let target = repo_url.trim();
        let mut repos = self.load_repos()?;
        if repos.iter().any(|r| r.url == target && r.locked) {
            return Err("Không thể xóa kho nguồn đang được khóa.".into());
        }
        repos.retain(|r| r.url != target);
        write_json_atomic(&self.repos_path(), &repos)?;
        let mut catalog = self.load_catalog()?;
        catalog.retain(|item| item.repo_url != target);
        write_json_atomic(&self.catalog_cache_path(), &catalog)?;
        self.snapshot()
    }

    pub fn toggle_repo(
        &self,
        repo_url: &str,
        enabled: bool,
    ) -> Result<VBookWorkspaceSnapshot, CoreError> {
        let _lock = self.acquire_lock()?;
        let target = repo_url.trim();
        let mut repos = self.load_repos()?;
        let repo = repos
            .iter_mut()
            .find(|r| r.url == target)
            .ok_or("Không tìm thấy kho nguồn.")?;
        repo.enabled = enabled;
        write_json_atomic(&self.repos_path(), &repos)?;
        self.snapshot()
    }

    pub fn refresh_repos(
        &self,
        transport: &mut dyn VBookHttpTransport,
    ) -> Result<VBookRefreshResult, CoreError> {
        let _lock = self.acquire_lock()?;
        let mut repos = self.load_repos()?;
        let existing_catalog = self.load_catalog()?;
        let mut next_catalog: Vec<RemoteExtension> = Vec::new();
        let mut errors: Vec<RefreshError> = Vec::new();
        let mut fetched_repos = 0usize;
        let now = now_epoch_ms();

        for repo in &mut repos {
            if !repo.enabled {
                next_catalog.extend(
                    existing_catalog
                        .iter()
                        .filter(|item| item.repo_url == repo.url)
                        .cloned(),
                );
                continue;
            }
            match transport
                .get_text(&repo.url, 25)
                .and_then(|body| parse_repo_catalog(&repo.url, &body))
            {
                Ok(parsed) => {
                    fetched_repos += 1;
                    normalize_repo_meta_into(repo, &parsed, now);
                    next_catalog.extend(parsed.items);
                }
                Err(err) => {
                    let msg = err.to_string();
                    repo.last_error = Some(msg.clone());
                    errors.push(RefreshError {
                        repo_url: repo.url.clone(),
                        message: msg,
                    });
                    next_catalog.extend(
                        existing_catalog
                            .iter()
                            .filter(|item| item.repo_url == repo.url)
                            .cloned(),
                    );
                }
            }
        }

        write_json_atomic(&self.repos_path(), &repos)?;
        write_json_atomic(&self.catalog_cache_path(), &next_catalog)?;
        let snapshot = self.snapshot()?;
        let total_remote = snapshot.catalog.len();
        Ok(VBookRefreshResult {
            snapshot,
            errors,
            fetched_repos,
            total_remote,
        })
    }

    pub fn install_from_url(
        &self,
        plugin_url: &str,
        target_installed_id: Option<&str>,
        transport: &mut dyn VBookHttpTransport,
    ) -> Result<InstalledExtension, CoreError> {
        let url = normalize_repo_url(plugin_url)?;
        let zip_bytes = transport.get_bytes(&url, 45)?;
        let parsed = parse_vbook_zip(&zip_bytes)?;

        let _lock = self.acquire_lock()?;
        let mut installed = self.load_installed()?;
        let catalog = self.load_catalog()?;
        let catalog_item = catalog.iter().find(|item| item.path == url);

        let existing_idx = find_existing_extension_idx(
            &installed,
            target_installed_id,
            &url,
            catalog_item,
            &parsed,
        );
        let id = existing_idx
            .map(|i| installed[i].id.clone())
            .or_else(|| catalog_item.map(|c| c.id.clone()))
            .unwrap_or_else(|| deterministic_extension_id(&url));

        let now = now_epoch_ms();
        let entry = self.write_package_and_merge(
            &id,
            &parsed,
            existing_idx.map(|i| &installed[i]),
            InstallOrigin {
                is_local: false,
                source_url: url,
                repo_url: catalog_item.map(|c| c.repo_url.clone()).unwrap_or_default(),
            },
            now,
        )?;

        if let Some(idx) = existing_idx {
            installed[idx] = entry.clone();
        } else {
            installed.push(entry.clone());
        }
        write_json_atomic(&self.installed_path(), &installed)?;
        Ok(entry)
    }

    pub fn update_extension(
        &self,
        installed_id: &str,
        transport: &mut dyn VBookHttpTransport,
    ) -> Result<InstalledExtension, CoreError> {
        let snapshot = self.snapshot()?;
        let update = snapshot
            .updates
            .into_iter()
            .find(|u| u.installed_id == installed_id)
            .ok_or("Không tìm thấy bản cập nhật mới cho nguồn này.")?;
        self.install_from_url(&update.remote.path, Some(installed_id), transport)
    }

    pub fn update_all_extensions(
        &self,
        transport: &mut dyn VBookHttpTransport,
    ) -> Result<VBookBatchUpdateResult, CoreError> {
        let updates = self.snapshot()?.updates;
        let mut updated_ids = Vec::new();
        let mut failed = Vec::new();
        for item in updates {
            match self.install_from_url(&item.remote.path, Some(&item.installed_id), transport) {
                Ok(installed) => updated_ids.push(installed.id),
                Err(err) => failed.push(RefreshError {
                    repo_url: item.remote.path,
                    message: format!("{}: {err}", item.remote.name),
                }),
            }
        }
        let snapshot = self.snapshot()?;
        Ok(VBookBatchUpdateResult {
            snapshot,
            updated_ids,
            failed,
        })
    }

    pub fn install_from_local_zip(
        &self,
        filename: &str,
        zip_bytes: &[u8],
    ) -> Result<InstalledExtension, CoreError> {
        let parsed = parse_vbook_zip(zip_bytes)?;
        let _lock = self.acquire_lock()?;
        let mut installed = self.load_installed()?;
        let existing_idx = installed.iter().position(|inst| {
            !inst.host.is_empty()
                && inst.host == parsed.host
                && inst.name.trim().eq_ignore_ascii_case(parsed.name.trim())
                && inst
                    .author
                    .trim()
                    .eq_ignore_ascii_case(parsed.author.trim())
        });
        let id = existing_idx
            .map(|i| installed[i].id.clone())
            .unwrap_or_else(|| {
                let stem = Path::new(filename)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or(&parsed.name);
                deterministic_extension_id(&format!("local:{stem}:{}", parsed.host))
            });
        let now = now_epoch_ms();
        let entry = self.write_package_and_merge(
            &id,
            &parsed,
            existing_idx.map(|i| &installed[i]),
            InstallOrigin {
                is_local: true,
                source_url: String::new(),
                repo_url: String::new(),
            },
            now,
        )?;
        if let Some(idx) = existing_idx {
            installed[idx] = entry.clone();
        } else {
            installed.push(entry.clone());
        }
        write_json_atomic(&self.installed_path(), &installed)?;
        Ok(entry)
    }

    pub fn uninstall_extension(
        &self,
        installed_id: &str,
    ) -> Result<VBookWorkspaceSnapshot, CoreError> {
        let _lock = self.acquire_lock()?;
        let mut installed = self.load_installed()?;
        let before = installed.len();
        installed.retain(|e| e.id != installed_id);
        if installed.len() == before {
            return Err("Không tìm thấy nguồn mở rộng cần gỡ.".into());
        }
        write_json_atomic(&self.installed_path(), &installed)?;
        let pkg_dir = self.packages_dir().join(installed_id);
        if pkg_dir.exists() {
            fs::remove_dir_all(&pkg_dir)?;
        }
        self.snapshot()
    }

    pub fn set_extension_pinned(
        &self,
        installed_id: &str,
        pinned: bool,
    ) -> Result<VBookWorkspaceSnapshot, CoreError> {
        let _lock = self.acquire_lock()?;
        let mut installed = self.load_installed()?;
        let ext = installed
            .iter_mut()
            .find(|e| e.id == installed_id)
            .ok_or("Không tìm thấy nguồn mở rộng.")?;
        ext.pinned = pinned;
        ext.updated_at = now_epoch_ms();
        write_json_atomic(&self.installed_path(), &installed)?;
        self.snapshot()
    }

    pub fn save_extension_config(
        &self,
        installed_id: &str,
        user_config: BTreeMap<String, Value>,
    ) -> Result<InstalledExtension, CoreError> {
        let _lock = self.acquire_lock()?;
        let mut installed = self.load_installed()?;
        let ext = installed
            .iter_mut()
            .find(|e| e.id == installed_id)
            .ok_or("Không tìm thấy nguồn mở rộng.")?;
        ext.user_config = user_config;
        ext.updated_at = now_epoch_ms();
        let cloned = ext.clone();
        write_json_atomic(&self.installed_path(), &installed)?;
        Ok(cloned)
    }

    pub fn package_dir(&self, installed_id: &str) -> PathBuf {
        self.packages_dir().join(installed_id)
    }

    pub fn storage_file(&self, installed_id: &str) -> Result<PathBuf, CoreError> {
        let dir = self.root.join("storage");
        fs::create_dir_all(&dir)?;
        Ok(dir.join(format!("{installed_id}.json")))
    }

    pub fn get_installed(&self, installed_id: &str) -> Result<InstalledExtension, CoreError> {
        self.load_installed()?
            .into_iter()
            .find(|e| e.id == installed_id)
            .ok_or_else(|| "Không tìm thấy nguồn mở rộng đã cài.".into())
    }

    pub fn save_extension_config_json(
        &self,
        installed_id: &str,
        config_json: &str,
    ) -> Result<InstalledExtension, CoreError> {
        let parsed: BTreeMap<String, Value> = serde_json::from_str(config_json)
            .map_err(|err| format!("Cấu hình nguồn không hợp lệ: {err}"))?;
        self.save_extension_config(installed_id, parsed)
    }

    fn write_package_and_merge(
        &self,
        id: &str,
        parsed: &ParsedExtensionPackage,
        previous: Option<&InstalledExtension>,
        origin: InstallOrigin,
        now: i64,
    ) -> Result<InstalledExtension, CoreError> {
        let packages_dir = self.packages_dir();
        fs::create_dir_all(&packages_dir)?;
        let stage_dir = packages_dir.join(format!(".tmp-{id}-{}", now));
        if stage_dir.exists() {
            let _ = fs::remove_dir_all(&stage_dir);
        }
        fs::create_dir_all(&stage_dir)?;
        fs::write(
            stage_dir.join("plugin.json"),
            parsed.raw_plugin_json.as_bytes(),
        )?;
        if let Some((icon_rel, bytes)) = &parsed.icon_bytes {
            let safe_icon = stage_dir.join(icon_rel);
            if let Some(parent) = safe_icon.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::write(safe_icon, bytes)?;
        }
        for (rel, bytes) in &parsed.source_files {
            let dest = stage_dir.join(rel);
            if let Some(parent) = dest.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::write(dest, bytes)?;
        }

        let target_dir = packages_dir.join(id);
        let backup_dir = packages_dir.join(format!(".bak-{id}-{}", now));
        if target_dir.exists() {
            fs::rename(&target_dir, &backup_dir)?;
        }
        if let Err(err) = fs::rename(&stage_dir, &target_dir) {
            if backup_dir.exists() {
                let _ = fs::rename(&backup_dir, &target_dir);
            }
            let _ = fs::remove_dir_all(&stage_dir);
            return Err(err.into());
        }
        if backup_dir.exists() {
            let _ = fs::remove_dir_all(&backup_dir);
        }

        // Bảo toàn cấu hình người dùng, localStorage, ghim & thời điểm tạo theo vbook-beta `ui6.b`.
        let (pinned, user_config, local_storage, created_at) = match previous {
            Some(prev) => (
                prev.pinned,
                prev.user_config.clone(),
                prev.local_storage.clone(),
                prev.created_at,
            ),
            None => (false, BTreeMap::new(), BTreeMap::new(), now),
        };

        Ok(InstalledExtension {
            id: id.to_owned(),
            name: parsed.name.clone(),
            author: parsed.author.clone(),
            version: parsed.version,
            source: parsed.source.clone(),
            host: parsed.host.clone(),
            regexp: parsed.regexp.clone(),
            icon_data_url: parsed.icon_data_url.clone(),
            description: parsed.description.clone(),
            locale: parsed.locale.clone(),
            ext_type: parsed.ext_type,
            is_nsfw: parsed.is_nsfw,
            is_local: origin.is_local,
            is_encrypted: parsed.is_encrypted,
            pinned,
            source_url: origin.source_url,
            repo_url: origin.repo_url,
            scripts: parsed.scripts.clone(),
            config_schema: parsed.config_schema.clone(),
            actions: parsed.actions.clone(),
            user_config,
            local_storage,
            created_at,
            updated_at: now,
        })
    }
}

struct InstallOrigin {
    is_local: bool,
    source_url: String,
    repo_url: String,
}

fn find_existing_extension_idx(
    installed: &[InstalledExtension],
    target_installed_id: Option<&str>,
    url: &str,
    catalog_item: Option<&RemoteExtension>,
    parsed: &ParsedExtensionPackage,
) -> Option<usize> {
    if let Some(tid) = target_installed_id
        && let Some(idx) = installed.iter().position(|e| e.id == tid)
    {
        return Some(idx);
    }
    if let Some(c) = catalog_item
        && let Some(idx) = installed
            .iter()
            .position(|e| extension_matches_remote(e, c))
    {
        return Some(idx);
    }
    let url_id = deterministic_extension_id(url);
    if let Some(idx) = installed
        .iter()
        .position(|e| e.id == url_id || (!e.source_url.is_empty() && e.source_url == url))
    {
        return Some(idx);
    }
    installed.iter().position(|e| {
        !e.host.is_empty()
            && e.host == parsed.host
            && e.name.trim().eq_ignore_ascii_case(parsed.name.trim())
            && e.author.trim().eq_ignore_ascii_case(parsed.author.trim())
    })
}

fn normalize_repo_url(raw: &str) -> Result<String, CoreError> {
    let trimmed = raw.trim();
    if !trimmed.starts_with("https://") && !trimmed.starts_with("http://") {
        return Err("URL phải bắt đầu bằng https:// hoặc http://.".into());
    }
    Ok(trimmed.to_owned())
}

fn infer_repo_name(url: &str) -> String {
    url.strip_prefix("https://")
        .or_else(|| url.strip_prefix("http://"))
        .and_then(|s| s.split('/').next())
        .unwrap_or("Kho tùy chỉnh")
        .to_owned()
}

fn now_epoch_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| i64::try_from(d.as_millis()).unwrap_or(0))
        .unwrap_or(0)
}

fn read_json_file<T: DeserializeOwned>(path: &Path) -> Result<T, CoreError> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    Ok(serde_json::from_reader(reader)?)
}

fn write_json_atomic<T: Serialize>(path: &Path, value: &T) -> Result<(), CoreError> {
    let parent = path.parent().ok_or("Đường dẫn tệp không hợp lệ.")?;
    fs::create_dir_all(parent)?;
    let mut tmp = NamedTempFile::new_in(parent)?;
    serde_json::to_writer_pretty(&mut tmp, value)?;
    tmp.as_file_mut().write_all(b"\n")?;
    tmp.as_file_mut().flush()?;
    tmp.persist(path).map_err(|e| e.error)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use std::io::Read;
    use std::net::TcpListener;
    use std::sync::{
        Arc,
        atomic::{AtomicUsize, Ordering},
    };
    use std::thread;

    use serde_json::json;

    use super::*;
    use crate::vbook::package::build_test_zip;

    #[test]
    fn store_refreshes_installs_updates_and_preserves_user_config_over_loopback() {
        let dir = tempfile::tempdir().expect("tempdir");
        let store = VBookExtensionStore::new(dir.path()).expect("store");
        let version_stage = Arc::new(AtomicUsize::new(1));
        let stage_clone = Arc::clone(&version_stage);

        let listener = TcpListener::bind("127.0.0.1:0").expect("bind");
        let port = listener.local_addr().expect("addr").port();
        let stop_flag = Arc::new(AtomicUsize::new(0));
        let stop_clone = Arc::clone(&stop_flag);

        let server = thread::spawn(move || {
            let _ = listener.set_nonblocking(true);
            while stop_clone.load(Ordering::Relaxed) == 0 {
                match listener.accept() {
                    Ok((mut sock, _)) => {
                        let _ = sock.set_nonblocking(false);
                        let mut buf = [0u8; 4096];
                        let n = sock.read(&mut buf).unwrap_or(0);
                        let req = String::from_utf8_lossy(&buf[..n]);
                        let path = req
                            .lines()
                            .next()
                            .and_then(|l| l.split_whitespace().nth(1))
                            .unwrap_or("/");
                        let ver = stage_clone.load(Ordering::Relaxed);
                        if path == "/api/plugin.json" {
                            let body = format!(
                                r#"{{
                                    "metadata": {{"name": "Mock Repo", "author": "Tester"}},
                                    "data": [{{
                                        "name": "Mau Tien Hiep",
                                        "path": "ext/tien-hiep.zip",
                                        "version": {ver},
                                        "source": "https://tienhiep.example",
                                        "type": "novel",
                                        "locale": "zh_CN",
                                        "author": "A"
                                    }}]
                                }}"#
                            );
                            let resp = format!(
                                "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                                body.len()
                            );
                            let _ = sock.write_all(resp.as_bytes());
                        } else if path == "/api/ext/tien-hiep.zip" {
                            let pjson = format!(
                                r#"{{
                                    "metadata": {{
                                        "name": "Mau Tien Hiep",
                                        "author": "A",
                                        "version": {ver},
                                        "source": "https://tienhiep.example",
                                        "type": "novel",
                                        "locale": "zh_CN"
                                    }},
                                    "script": {{"chap": "chap.js"}},
                                    "config": {{"api_key": {{"type": "string", "default": "demo"}}}}
                                }}"#
                            );
                            let chap_js = format!("// version {ver}\nfunction execute() {{}}");
                            let zip = build_test_zip(
                                &[
                                    ("plugin.json", pjson.as_bytes()),
                                    ("src/chap.js", chap_js.as_bytes()),
                                ],
                                true,
                            );
                            let head = format!(
                                "HTTP/1.1 200 OK\r\nContent-Type: application/zip\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                                zip.len()
                            );
                            let _ = sock.write_all(head.as_bytes());
                            let _ = sock.write_all(&zip);
                        } else {
                            let _ = sock.write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
                        }
                    }
                    Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                        thread::sleep(Duration::from_millis(15));
                    }
                    Err(_) => break,
                }
            }
        });

        let repo_url = format!("http://127.0.0.1:{port}/api/plugin.json");
        store
            .toggle_repo(DEFAULT_VBOOK_REPO_URL, false)
            .expect("disable default");
        store.add_repo(&repo_url).expect("add mock repo");

        let mut transport = LoopbackVBookTransport::new(None);
        let refreshed = store.refresh_repos(&mut transport).expect("refresh v1");
        assert!(refreshed.errors.is_empty());
        assert_eq!(refreshed.snapshot.catalog.len(), 1);
        assert_eq!(refreshed.snapshot.catalog[0].remote.version, 1);

        let zip_url = &refreshed.snapshot.catalog[0].remote.path;
        let inst_v1 = store
            .install_from_url(zip_url, None, &mut transport)
            .expect("install v1");
        assert_eq!(inst_v1.version, 1);
        assert!(store.snapshot().expect("snap").updates.is_empty());

        store.set_extension_pinned(&inst_v1.id, true).expect("pin");
        let mut cfg = BTreeMap::new();
        cfg.insert("api_key".to_owned(), json!("custom-secret-key"));
        store
            .save_extension_config(&inst_v1.id, cfg)
            .expect("save config");

        // Nâng remote lên v2
        version_stage.store(2, Ordering::Relaxed);
        let refreshed2 = store.refresh_repos(&mut transport).expect("refresh v2");
        assert_eq!(refreshed2.snapshot.updates.len(), 1);
        assert_eq!(refreshed2.snapshot.updates[0].installed_version, 1);
        assert_eq!(refreshed2.snapshot.updates[0].remote_version, 2);

        let batch = store
            .update_all_extensions(&mut transport)
            .expect("update all");
        assert!(batch.failed.is_empty());
        assert_eq!(batch.updated_ids, vec![inst_v1.id.clone()]);
        assert!(batch.snapshot.updates.is_empty());
        let inst_v2 = &batch.snapshot.installed[0];
        assert_eq!(inst_v2.version, 2);
        assert!(inst_v2.pinned, "must preserve pinned across update");
        assert_eq!(
            inst_v2.user_config.get("api_key"),
            Some(&json!("custom-secret-key")),
            "must preserve user_config across update"
        );
        assert_eq!(inst_v2.created_at, inst_v1.created_at);

        let pkg_chap = fs::read_to_string(
            store
                .root()
                .join("packages")
                .join(&inst_v1.id)
                .join("src")
                .join("chap.js"),
        )
        .expect("read chap.js");
        assert!(pkg_chap.contains("// version 2"));

        stop_flag.store(1, Ordering::Relaxed);
        let _ = server.join();
    }
}
