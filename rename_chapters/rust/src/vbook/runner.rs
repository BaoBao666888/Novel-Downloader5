use std::collections::BTreeMap;
use std::env;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};

use crate::CoreError;
use crate::vbook::catalog::resolve_relative_url;
use crate::vbook::model::{ExtensionType, InstalledExtension};
use crate::vbook::package::encode_base64;
use crate::vbook::store::VBookExtensionStore;

pub const ENV_JAVA_BIN: &str = "NOVEL_STUDIO_JAVA_BIN";
pub const ENV_VBOOK_RUNNER_JAR: &str = "NOVEL_STUDIO_VBOOK_RUNNER_JAR";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VBookSearchItem {
    pub name: String,
    pub link: String,
    pub cover: String,
    pub description: String,
    pub host: String,
    pub item_type: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VBookSearchPage {
    pub items: Vec<VBookSearchItem>,
    pub next: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VBookDetail {
    pub name: String,
    pub cover: String,
    pub host: String,
    pub author: String,
    pub description: String,
    pub detail_html: String,
    pub detail_text: String,
    pub ongoing: Option<bool>,
    pub genres: Vec<String>,
    pub detail_type: String,
    pub format: String,
    pub url: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VBookTocItem {
    pub name: String,
    pub url: String,
    pub host: String,
    pub pay: bool,
    pub item_type: String,
    pub index: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VBookMediaImage {
    pub url: String,
    #[serde(default)]
    pub headers: BTreeMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct VBookTrackEntry {
    pub title: String,
    pub data: String,
    pub quality: String,
    pub track_type: String,
    #[serde(default)]
    pub subtitles: Vec<Value>,
    pub raw: Value,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum VBookChapterContent {
    Novel {
        html: String,
        text: String,
        title: String,
    },
    Comic {
        images: Vec<VBookMediaImage>,
    },
    MediaTracks {
        media_kind: String,
        tracks: Vec<VBookTrackEntry>,
    },
    Raw {
        data: Value,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct VBookResolvedTrack {
    pub data: String,
    pub title: String,
    pub track_type: String,
    pub mime_type: String,
    #[serde(default)]
    pub headers: BTreeMap<String, String>,
    #[serde(default)]
    pub subtitles: Vec<Value>,
    #[serde(default)]
    pub audios: Vec<Value>,
    #[serde(default)]
    pub lyrics: Vec<Value>,
    #[serde(default)]
    pub time_skip: Vec<Value>,
    pub raw: Value,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VBookTtsVoice {
    pub id: String,
    pub name: String,
    pub language: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VBookTtsAudio {
    pub base64_data: String,
    pub mime_type: String,
    pub byte_len: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VBookTranslateOption {
    pub id: String,
    pub name: String,
    pub direction: String,
    pub description: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VBookTranslateMeta {
    pub languages: Vec<VBookTranslateOption>,
    pub models: Vec<VBookTranslateOption>,
    pub styles: Vec<VBookTranslateOption>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct VBookTranslateResult {
    pub text: String,
    #[serde(default)]
    pub segments: Vec<Value>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VBookAiReply {
    pub text: String,
    pub model: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VBookChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RunnerStatus {
    pub ready: bool,
    pub mock_mode: bool,
    #[serde(default)]
    pub browser_bridge_ready: bool,
    pub java_path: Option<String>,
    pub jar_path: Option<String>,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct RunnerRuntimeConfig {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub custom_java_path: Option<String>,
}

pub const RUNTIME_CONFIG_FILENAME: &str = "runtime-config.json";

pub fn load_runtime_config(dir: &Path) -> Result<RunnerRuntimeConfig, CoreError> {
    let path = dir.join(RUNTIME_CONFIG_FILENAME);
    match std::fs::read_to_string(&path) {
        Ok(raw) => Ok(serde_json::from_str(&raw)?),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
            Ok(RunnerRuntimeConfig::default())
        }
        Err(err) => Err(err.into()),
    }
}

pub fn save_runtime_config(
    dir: &Path,
    config: &RunnerRuntimeConfig,
) -> Result<RunnerRuntimeConfig, CoreError> {
    std::fs::create_dir_all(dir)?;
    let normalized = RunnerRuntimeConfig {
        custom_java_path: config
            .custom_java_path
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(ToOwned::to_owned),
    };
    let mut tmp = tempfile::NamedTempFile::new_in(dir)?;
    serde_json::to_writer_pretty(&mut tmp, &normalized)?;
    std::io::Write::flush(&mut tmp)?;
    tmp.as_file().sync_all()?;
    tmp.persist(dir.join(RUNTIME_CONFIG_FILENAME))?;
    Ok(normalized)
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RunnerExecConfig {
    pub storage_path: String,
    pub plugin_config: BTreeMap<String, Value>,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub browser_bridge_url: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub browser_bridge_token: String,
}

pub trait VBookScriptExecutor {
    fn run_script(
        &mut self,
        plugin_dir: &Path,
        script_key: &str,
        args: &[Value],
        config: &RunnerExecConfig,
    ) -> Result<Value, CoreError>;
}

#[derive(Debug, Default, Clone)]
pub struct JavaVBookRunnerExecutor {
    custom_java_path: Option<PathBuf>,
    browser_bridge_url: Option<String>,
    browser_bridge_token: Option<String>,
}

impl JavaVBookRunnerExecutor {
    pub fn discover() -> Self {
        Self {
            custom_java_path: None,
            browser_bridge_url: None,
            browser_bridge_token: None,
        }
    }

    pub fn with_custom_java(custom_java: Option<PathBuf>) -> Self {
        Self::with_runtime(custom_java, None, None)
    }

    pub fn with_runtime(
        custom_java: Option<PathBuf>,
        browser_bridge_url: Option<String>,
        browser_bridge_token: Option<String>,
    ) -> Self {
        Self {
            custom_java_path: custom_java,
            browser_bridge_url: browser_bridge_url
                .map(|s| s.trim().to_owned())
                .filter(|s| !s.is_empty()),
            browser_bridge_token: browser_bridge_token
                .map(|s| s.trim().to_owned())
                .filter(|s| !s.is_empty()),
        }
    }

    pub fn probe_status() -> RunnerStatus {
        Self::probe_status_with_runtime(None, false)
    }

    pub fn probe_status_with_java(custom_java: Option<&Path>) -> RunnerStatus {
        Self::probe_status_with_runtime(custom_java, false)
    }

    pub fn probe_status_with_runtime(
        custom_java: Option<&Path>,
        browser_bridge_ready: bool,
    ) -> RunnerStatus {
        let jar = find_runner_jar();
        let java = find_java_bin_with_custom(jar.as_deref(), custom_java);
        let ready = jar.is_some() && java.is_some();
        let message = match (&java, &jar) {
            (Some(_), Some(_)) => "Java 21 & vbook_runner sẵn sàng.".to_owned(),
            (None, Some(_)) => {
                "Chưa tìm thấy Java 21+ (hãy chọn đường dẫn java.exe trong Cài đặt hoặc tải JRE)."
                    .to_owned()
            }
            (Some(_), None) => {
                "Chưa tìm thấy vbook_runner.jar (đặt trong tools/vbook_runner hoặc biến NOVEL_STUDIO_VBOOK_RUNNER_JAR)."
                    .to_owned()
            }
            (None, None) => {
                "Chưa có Java 21+ và vbook_runner.jar để chạy extension JS thật.".to_owned()
            }
        };
        RunnerStatus {
            ready,
            mock_mode: false,
            browser_bridge_ready,
            java_path: java.map(|p| p.display().to_string()),
            jar_path: jar.map(|p| p.display().to_string()),
            message,
        }
    }
}

impl VBookScriptExecutor for JavaVBookRunnerExecutor {
    fn run_script(
        &mut self,
        plugin_dir: &Path,
        script_key: &str,
        args: &[Value],
        config: &RunnerExecConfig,
    ) -> Result<Value, CoreError> {
        let jar = find_runner_jar().ok_or(
            "Không tìm thấy vbook_runner.jar (kiểm tra tools/vbook_runner/vbook_runner.jar).",
        )?;
        let java = find_java_bin_with_custom(Some(&jar), self.custom_java_path.as_deref())
            .ok_or("Không tìm thấy Java 21+ (kiểm tra tools/jre/bin/java.exe hoặc Cài đặt).")?;

        let mut merged_config = config.clone();
        if merged_config.browser_bridge_url.is_empty()
            && let Some(url) = &self.browser_bridge_url
        {
            merged_config.browser_bridge_url = url.clone();
        }
        if merged_config.browser_bridge_token.is_empty()
            && let Some(token) = &self.browser_bridge_token
        {
            merged_config.browser_bridge_token = token.clone();
        }

        let args_json = serde_json::to_string(args)?;
        let config_json = serde_json::to_string(&merged_config)?;
        let args_b64 = encode_base64(args_json.as_bytes());
        let config_b64 = encode_base64(config_json.as_bytes());

        let mut cmd = Command::new(&java);
        cmd.arg("-Dfile.encoding=UTF-8")
            .arg("-jar")
            .arg(&jar)
            .arg("run")
            .arg("--plugin")
            .arg(plugin_dir)
            .arg("--script")
            .arg(script_key)
            .arg("--args-base64")
            .arg(args_b64)
            .arg("--config-base64")
            .arg(config_b64);

        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x0800_0000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }

        let output = cmd
            .output()
            .map_err(|err| format!("Không khởi chạy được vbook_runner: {err}"))?;
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_owned();
        if stdout.is_empty() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_owned();
            return Err(format!("vbook_runner không trả dữ liệu ({stderr}).").into());
        }
        let parsed: Value = serde_json::from_str(&stdout)
            .map_err(|err| format!("Phản hồi JSON từ vbook_runner không hợp lệ: {err}"))?;
        if !parsed.get("ok").and_then(Value::as_bool).unwrap_or(false) {
            let msg = parsed
                .get("error")
                .and_then(|e| e.get("message"))
                .and_then(Value::as_str)
                .filter(|s| !s.is_empty())
                .unwrap_or("Script extension chạy thất bại.");
            return Err(msg.into());
        }
        Ok(parsed.get("result").cloned().unwrap_or(Value::Null))
    }
}

pub fn find_runner_jar() -> Option<PathBuf> {
    if let Ok(raw) = env::var(ENV_VBOOK_RUNNER_JAR) {
        let path = PathBuf::from(raw.trim());
        if path.is_file() {
            return Some(path);
        }
    }

    let mut search_roots = Vec::new();
    if let Ok(exe) = env::current_exe()
        && let Some(dir) = exe.parent()
    {
        push_ancestor_dirs(&mut search_roots, dir, 5);
    }
    if let Ok(cwd) = env::current_dir() {
        push_ancestor_dirs(&mut search_roots, &cwd, 6);
    }
    // Hỗ trợ cấu trúc worktree nằm cạnh checkout gốc `Novel-Downloader5\rename_chapters\tools\...`
    for root in search_roots.clone() {
        let sibling = root.join("Novel-Downloader5");
        if sibling.is_dir() {
            search_roots.push(sibling);
        }
    }

    let rel_candidates = [
        "vbook_runner.jar",
        "vbook_runner/vbook_runner.jar",
        "tools/vbook_runner/vbook_runner.jar",
        "rename_chapters/tools/vbook_runner/vbook_runner.jar",
    ];
    for base in search_roots {
        for rel in rel_candidates {
            let candidate = base.join(rel);
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }
    None
}

pub fn find_java_bin(jar_hint: Option<&Path>) -> Option<PathBuf> {
    find_java_bin_with_custom(jar_hint, None)
}

pub fn find_java_bin_with_custom(
    jar_hint: Option<&Path>,
    custom_java: Option<&Path>,
) -> Option<PathBuf> {
    let java_name = if cfg!(windows) { "java.exe" } else { "java" };
    if let Some(custom) = custom_java {
        if custom.is_file() {
            return Some(custom.to_path_buf());
        }
        let nested = custom.join("bin").join(java_name);
        if nested.is_file() {
            return Some(nested);
        }
    }
    if let Ok(raw) = env::var(ENV_JAVA_BIN) {
        let path = PathBuf::from(raw.trim());
        if path.is_file() {
            return Some(path);
        }
    }

    let mut candidate_bins: Vec<PathBuf> = Vec::new();
    if let Some(jar) = jar_hint
        && let Some(vbook_runner_dir) = jar.parent()
        && let Some(tools_dir) = vbook_runner_dir.parent()
    {
        candidate_bins.push(tools_dir.join("jre").join("bin").join(java_name));
    }

    let mut roots = Vec::new();
    if let Ok(exe) = env::current_exe()
        && let Some(dir) = exe.parent()
    {
        push_ancestor_dirs(&mut roots, dir, 5);
    }
    if let Ok(cwd) = env::current_dir() {
        push_ancestor_dirs(&mut roots, &cwd, 6);
    }
    for root in roots.clone() {
        let sibling = root.join("Novel-Downloader5");
        if sibling.is_dir() {
            roots.push(sibling);
        }
    }
    for base in roots {
        candidate_bins.push(base.join("jre").join("bin").join(java_name));
        candidate_bins.push(base.join("tools").join("jre").join("bin").join(java_name));
        candidate_bins.push(
            base.join("rename_chapters")
                .join("tools")
                .join("jre")
                .join("bin")
                .join(java_name),
        );
    }

    if let Ok(java_home) = env::var("JAVA_HOME")
        && !java_home.trim().is_empty()
    {
        candidate_bins.push(PathBuf::from(java_home.trim()).join("bin").join(java_name));
    }

    #[cfg(windows)]
    {
        candidate_bins.push(PathBuf::from(r"C:\Program Files\Java\jdk-21\bin\java.exe"));
    }

    for candidate in candidate_bins {
        if candidate.is_file() {
            return Some(candidate);
        }
    }

    if let Ok(path_var) = env::var("PATH") {
        for entry in env::split_paths(&path_var) {
            let candidate = entry.join(java_name);
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }
    None
}

fn push_ancestor_dirs(out: &mut Vec<PathBuf>, start: &Path, max_depth: usize) {
    let mut cur = Some(start);
    for _ in 0..max_depth {
        let Some(dir) = cur else {
            break;
        };
        let owned = dir.to_path_buf();
        if !out.contains(&owned) {
            out.push(owned);
        }
        cur = dir.parent();
    }
}

pub struct VBookRunnerService<'a> {
    store: &'a VBookExtensionStore,
}

impl<'a> VBookRunnerService<'a> {
    pub fn new(store: &'a VBookExtensionStore) -> Self {
        Self { store }
    }

    fn exec_for(
        &self,
        installed_id: &str,
        script_key: &str,
        args: &[Value],
        executor: &mut dyn VBookScriptExecutor,
    ) -> Result<(InstalledExtension, Value), CoreError> {
        let ext = self.store.get_installed(installed_id)?;
        let pkg_dir = self.store.package_dir(installed_id);
        let storage = self.store.storage_file(installed_id)?;
        let exec_cfg = build_exec_config(&ext, &storage);
        let raw = executor.run_script(&pkg_dir, script_key, args, &exec_cfg)?;
        Ok((ext, raw))
    }

    pub fn search(
        &self,
        installed_id: &str,
        query: &str,
        page: Option<&str>,
        executor: &mut dyn VBookScriptExecutor,
    ) -> Result<VBookSearchPage, CoreError> {
        let ext = self.store.get_installed(installed_id)?;
        if !ext.scripts.contains_key("search") {
            return Err("Nguồn này không khai báo script tìm kiếm (`search`).".into());
        }
        let page_arg = page.unwrap_or("1");
        let (_, raw) = self.exec_for(
            installed_id,
            "search",
            &[json!(query.trim()), json!(page_arg)],
            executor,
        )?;
        let (data, next_opt) = unwrap_vbook_response(&raw)?;
        let items_arr = data
            .as_array()
            .ok_or("Kết quả tìm kiếm phải là danh sách mục.")?;
        let mut items = Vec::with_capacity(items_arr.len());
        for entry in items_arr {
            let Some(obj) = entry.as_object() else {
                continue;
            };
            let name = read_str_any(obj, &["name", "title"]);
            let host = first_non_empty(&[read_str_any(obj, &["host"]), ext.source.clone()]);
            let raw_link = read_str_any(obj, &["link", "url"]);
            let link = normalize_vbook_link(&host, &raw_link);
            if name.is_empty() || link.is_empty() {
                continue;
            }
            let raw_cover = read_str_any(obj, &["cover", "icon"]);
            let cover = if raw_cover.is_empty() {
                String::new()
            } else {
                resolve_relative_url(&host, &raw_cover)
            };
            items.push(VBookSearchItem {
                name,
                link,
                cover,
                description: read_str_any(obj, &["description", "desc"]),
                host,
                item_type: first_non_empty(&[
                    read_str_any(obj, &["type"]),
                    ext.ext_type.as_str().to_owned(),
                ]),
            });
        }
        Ok(VBookSearchPage {
            items,
            next: next_opt.filter(|s| !s.is_empty()),
        })
    }

    pub fn detail(
        &self,
        installed_id: &str,
        url: &str,
        executor: &mut dyn VBookScriptExecutor,
    ) -> Result<VBookDetail, CoreError> {
        let clean_url = strip_trailing_slash_http(url);
        let (ext, raw) = self.exec_for(
            installed_id,
            "detail",
            &[json!(clean_url.clone())],
            executor,
        )?;
        let (data, _) = unwrap_vbook_response(&raw)?;
        let obj = data
            .as_object()
            .ok_or("Chi tiết truyện phải là JSON object.")?;
        let host = first_non_empty(&[read_str_any(obj, &["host"]), ext.source.clone()]);
        let raw_cover = read_str_any(obj, &["cover"]);
        let cover = if raw_cover.is_empty() {
            String::new()
        } else {
            resolve_relative_url(&host, &raw_cover)
        };
        let detail_html = read_str_any(obj, &["detail", "description"]);
        let description = first_non_empty(&[
            read_str_any(obj, &["description"]),
            html_to_plain_text(&detail_html),
        ]);
        let genres = match obj.get("genres") {
            Some(Value::Array(arr)) => arr
                .iter()
                .filter_map(|g| {
                    g.as_str().map(|s| s.trim().to_owned()).or_else(|| {
                        g.get("title")
                            .and_then(Value::as_str)
                            .map(|s| s.trim().to_owned())
                    })
                })
                .filter(|s| !s.is_empty())
                .collect(),
            _ => Vec::new(),
        };
        Ok(VBookDetail {
            name: read_str_any(obj, &["name", "title"]),
            cover,
            host,
            author: read_str_any(obj, &["author"]),
            description,
            detail_html: detail_html.clone(),
            detail_text: html_to_plain_text(&detail_html),
            ongoing: obj.get("ongoing").and_then(Value::as_bool),
            genres,
            detail_type: first_non_empty(&[
                read_str_any(obj, &["type"]),
                ext.ext_type.as_str().to_owned(),
            ]),
            format: read_str_any(obj, &["format"]),
            url: clean_url,
        })
    }

    pub fn toc(
        &self,
        installed_id: &str,
        book_url: &str,
        executor: &mut dyn VBookScriptExecutor,
    ) -> Result<Vec<VBookTocItem>, CoreError> {
        let clean_url = strip_trailing_slash_http(book_url);
        let ext = self.store.get_installed(installed_id)?;
        let page_urls = if ext.scripts.contains_key("page") {
            let (_, page_raw) =
                self.exec_for(installed_id, "page", &[json!(clean_url.clone())], executor)?;
            let (page_data, _) = unwrap_vbook_response(&page_raw)?;
            let mut list: Vec<String> = page_data
                .as_array()
                .into_iter()
                .flatten()
                .filter_map(Value::as_str)
                .map(strip_trailing_slash_http)
                .filter(|s| !s.is_empty())
                .collect();
            if list.is_empty() {
                list.push(clean_url.clone());
            }
            list
        } else {
            vec![clean_url]
        };

        let mut items = Vec::new();
        for toc_url in page_urls {
            let (_, raw) = self.exec_for(installed_id, "toc", &[json!(toc_url)], executor)?;
            let (data, _) = unwrap_vbook_response(&raw)?;
            let Some(arr) = data.as_array() else {
                continue;
            };
            for entry in arr {
                let Some(obj) = entry.as_object() else {
                    continue;
                };
                let name = read_str_any(obj, &["name", "title"]);
                let host = if obj.contains_key("host") {
                    read_str_any(obj, &["host"])
                } else {
                    ext.source.clone()
                };
                let raw_ch_url = read_str_any(obj, &["url", "link"]);
                let ch_url = if raw_ch_url.is_empty() {
                    String::new()
                } else if host.is_empty() {
                    raw_ch_url
                } else {
                    resolve_relative_url(&host, &raw_ch_url)
                };
                items.push(VBookTocItem {
                    name,
                    url: ch_url,
                    host,
                    pay: obj.get("pay").and_then(Value::as_bool).unwrap_or(false),
                    item_type: first_non_empty(&[
                        read_str_any(obj, &["type"]),
                        "chapter".to_owned(),
                    ]),
                    index: items.len(),
                });
            }
        }
        Ok(items)
    }

    pub fn chap(
        &self,
        installed_id: &str,
        chapter_url: &str,
        content_type_hint: Option<&str>,
        executor: &mut dyn VBookScriptExecutor,
    ) -> Result<VBookChapterContent, CoreError> {
        let clean_url = strip_trailing_slash_http(chapter_url);
        let (ext, raw) = self.exec_for(installed_id, "chap", &[json!(clean_url)], executor)?;
        let (data, data2) = unwrap_vbook_response(&raw)?;
        let resolved_type = content_type_hint
            .filter(|s| !s.trim().is_empty())
            .map(ExtensionType::from_raw)
            .unwrap_or(ext.ext_type);

        match resolved_type {
            ExtensionType::Comic => {
                let mut images = Vec::new();
                if let Some(arr) = data.as_array() {
                    for entry in arr {
                        if let Some(url) = entry.as_str() {
                            let clean = url.trim();
                            if !clean.is_empty() {
                                images.push(VBookMediaImage {
                                    url: resolve_relative_url(&ext.source, clean),
                                    headers: BTreeMap::new(),
                                });
                            }
                        } else if let Some(obj) = entry.as_object() {
                            let link = read_str_any(obj, &["link", "url", "data"]);
                            if !link.is_empty() {
                                images.push(VBookMediaImage {
                                    url: resolve_relative_url(&ext.source, &link),
                                    headers: parse_header_map(obj.get("headers")),
                                });
                            }
                        }
                    }
                }
                Ok(VBookChapterContent::Comic { images })
            }
            ExtensionType::Video | ExtensionType::Audio => {
                let tracks = parse_track_list(&data);
                Ok(VBookChapterContent::MediaTracks {
                    media_kind: resolved_type.as_str().to_owned(),
                    tracks,
                })
            }
            ExtensionType::Novel
            | ExtensionType::ChineseNovel
            | ExtensionType::Forum
            | ExtensionType::News => {
                if let Some(html) = data.as_str() {
                    Ok(VBookChapterContent::Novel {
                        html: html.to_owned(),
                        text: html_to_plain_text(html),
                        title: data2.unwrap_or_default(),
                    })
                } else {
                    Ok(VBookChapterContent::Raw { data })
                }
            }
            ExtensionType::Tts
            | ExtensionType::Translate
            | ExtensionType::Ai
            | ExtensionType::Unknown => {
                if let Some(html) = data.as_str() {
                    Ok(VBookChapterContent::Novel {
                        html: html.to_owned(),
                        text: html_to_plain_text(html),
                        title: data2.unwrap_or_default(),
                    })
                } else if data.as_array().is_some_and(|arr| {
                    arr.first()
                        .and_then(|v| v.as_object())
                        .is_some_and(|o| o.contains_key("data"))
                }) {
                    Ok(VBookChapterContent::MediaTracks {
                        media_kind: "media".to_owned(),
                        tracks: parse_track_list(&data),
                    })
                } else {
                    Ok(VBookChapterContent::Raw { data })
                }
            }
        }
    }

    pub fn resolve_track(
        &self,
        installed_id: &str,
        track_data: &str,
        executor: &mut dyn VBookScriptExecutor,
    ) -> Result<VBookResolvedTrack, CoreError> {
        let arg = strip_trailing_slash_http(track_data);
        let (_, raw) = self.exec_for(installed_id, "track", &[json!(arg)], executor)?;
        let (data, _) = unwrap_vbook_response(&raw)?;
        let obj = data
            .as_object()
            .ok_or("Dữ liệu resolve track phải là JSON object.")?;
        let url_or_payload = read_str_any(obj, &["data", "url"]);
        if url_or_payload.is_empty() {
            return Err("track.js trả về rỗng.".into());
        }
        Ok(VBookResolvedTrack {
            data: url_or_payload,
            title: read_str_any(obj, &["title"]),
            track_type: first_non_empty(&[read_str_any(obj, &["type"]), "auto".to_owned()]),
            mime_type: read_str_any(obj, &["mimeType", "mime_type"]),
            headers: parse_header_map(obj.get("headers")),
            subtitles: as_vec(obj.get("subtitles")),
            audios: as_vec(obj.get("audios")),
            lyrics: as_vec(obj.get("lyrics")),
            time_skip: as_vec(obj.get("timeSkip")),
            raw: data,
        })
    }

    pub fn tts_voices(
        &self,
        installed_id: &str,
        executor: &mut dyn VBookScriptExecutor,
    ) -> Result<Vec<VBookTtsVoice>, CoreError> {
        let (_, raw) = self.exec_for(installed_id, "voice", &[], executor)?;
        let (data, _) = unwrap_vbook_response(&raw)?;
        let arr = data
            .as_array()
            .ok_or("voice.js phải trả về danh sách giọng đọc.")?;
        let mut voices = Vec::with_capacity(arr.len());
        for entry in arr {
            let Some(obj) = entry.as_object() else {
                continue;
            };
            let id = read_str_any(obj, &["id"]);
            let language = read_str_any(obj, &["language", "locale"]);
            if id.is_empty() || language.is_empty() {
                continue;
            }
            let name = first_non_empty(&[read_str_any(obj, &["name"]), id.clone()]);
            voices.push(VBookTtsVoice { id, name, language });
        }
        Ok(voices)
    }

    pub fn tts_synthesize(
        &self,
        installed_id: &str,
        text: &str,
        voice_id: &str,
        executor: &mut dyn VBookScriptExecutor,
    ) -> Result<VBookTtsAudio, CoreError> {
        let (_, raw) = self.exec_for(
            installed_id,
            "tts",
            &[json!(text), json!(voice_id)],
            executor,
        )?;
        let (data, data2) = unwrap_vbook_response(&raw)?;
        let raw_b64 = data
            .as_str()
            .ok_or("tts.js phải trả về chuỗi âm thanh base64.")?
            .trim()
            .to_owned();
        if raw_b64.is_empty() {
            return Err("tts.js trả về dữ liệu âm thanh rỗng.".into());
        }
        let mime = data2
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| "audio/mpeg".to_owned());
        let byte_len = raw_b64.len() * 3 / 4;
        Ok(VBookTtsAudio {
            base64_data: raw_b64,
            mime_type: mime,
            byte_len,
        })
    }

    pub fn translate_meta(
        &self,
        installed_id: &str,
        executor: &mut dyn VBookScriptExecutor,
    ) -> Result<VBookTranslateMeta, CoreError> {
        let ext = self.store.get_installed(installed_id)?;
        let languages = self.load_translate_options(installed_id, "language", executor)?;
        let models = if ext.scripts.contains_key("model") {
            self.load_translate_options(installed_id, "model", executor)
                .unwrap_or_default()
        } else {
            Vec::new()
        };
        let styles = if ext.scripts.contains_key("style") {
            self.load_translate_options(installed_id, "style", executor)
                .unwrap_or_default()
        } else {
            Vec::new()
        };
        Ok(VBookTranslateMeta {
            languages,
            models,
            styles,
        })
    }

    fn load_translate_options(
        &self,
        installed_id: &str,
        script_key: &str,
        executor: &mut dyn VBookScriptExecutor,
    ) -> Result<Vec<VBookTranslateOption>, CoreError> {
        let (_, raw) = self.exec_for(installed_id, script_key, &[], executor)?;
        let (data, _) = unwrap_vbook_response(&raw)?;
        let Some(arr) = data.as_array() else {
            return Ok(Vec::new());
        };
        let mut out = Vec::with_capacity(arr.len());
        for entry in arr {
            let Some(obj) = entry.as_object() else {
                continue;
            };
            let id = read_str_any(obj, &["id"]);
            if id.is_empty() {
                continue;
            }
            out.push(VBookTranslateOption {
                name: first_non_empty(&[read_str_any(obj, &["name"]), id.clone()]),
                direction: read_str_any(obj, &["type"]),
                description: read_str_any(obj, &["description"]),
                id,
            });
        }
        Ok(out)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn translate_text(
        &self,
        installed_id: &str,
        text: &str,
        from: &str,
        to: &str,
        source: &str,
        model: &str,
        style: &str,
        executor: &mut dyn VBookScriptExecutor,
    ) -> Result<VBookTranslateResult, CoreError> {
        let (_, raw) = self.exec_for(
            installed_id,
            "translate",
            &[
                json!(text),
                json!(from),
                json!(to),
                json!(source),
                json!(model),
                json!(style),
            ],
            executor,
        )?;
        let (data, _) = unwrap_vbook_response(&raw)?;
        if let Some(s) = data.as_str() {
            return Ok(VBookTranslateResult {
                text: s.to_owned(),
                segments: Vec::new(),
            });
        }
        if let Some(obj) = data.as_object() {
            let translated = read_str_any(obj, &["text", "translated"]);
            return Ok(VBookTranslateResult {
                text: translated,
                segments: as_vec(obj.get("segments")),
            });
        }
        Err("Định dạng kết quả translate.js không hợp lệ.".into())
    }

    pub fn ai_chat(
        &self,
        installed_id: &str,
        messages: &[Value],
        selected_model: &str,
        executor: &mut dyn VBookScriptExecutor,
    ) -> Result<VBookAiReply, CoreError> {
        let ext = self.store.get_installed(installed_id)?;
        let script_key = if ext.scripts.contains_key("chatStream") {
            "chatStream"
        } else if ext.scripts.contains_key("chat") {
            "chat"
        } else {
            return Err("Extension AI không khai báo script `chatStream` hay `chat`.".into());
        };
        let messages_json = serde_json::to_string(messages)?;
        let (_, raw) = self.exec_for(
            installed_id,
            script_key,
            &[json!(messages_json), json!(selected_model)],
            executor,
        )?;
        let (data, _) = unwrap_vbook_response(&raw)?;
        let text = data
            .as_str()
            .map(ToOwned::to_owned)
            .unwrap_or_else(|| data.to_string());
        Ok(VBookAiReply {
            text,
            model: selected_model.to_owned(),
        })
    }

    pub fn ai_chat_messages(
        &self,
        installed_id: &str,
        messages: &[VBookChatMessage],
        selected_model: &str,
        executor: &mut dyn VBookScriptExecutor,
    ) -> Result<VBookAiReply, CoreError> {
        let vals: Vec<Value> = messages
            .iter()
            .map(|m| json!({ "role": m.role, "content": m.content }))
            .collect();
        self.ai_chat(installed_id, &vals, selected_model, executor)
    }
}

/// Executor giả lập dùng cho kiểm thử offline/smoke trên exe thật khi bật `NOVEL_STUDIO_VBOOK_MOCK_RUNNER=1`.
#[derive(Debug, Default)]
pub struct MockVBookRunnerExecutor;

impl VBookScriptExecutor for MockVBookRunnerExecutor {
    fn run_script(
        &mut self,
        plugin_dir: &Path,
        script_key: &str,
        args: &[Value],
        _config: &RunnerExecConfig,
    ) -> Result<Value, CoreError> {
        let plugin_raw =
            std::fs::read_to_string(plugin_dir.join("plugin.json")).unwrap_or_default();
        let plugin_val: Value = serde_json::from_str(&plugin_raw).unwrap_or(Value::Null);
        let meta = plugin_val.get("metadata").and_then(Value::as_object);
        let ext_name = meta
            .and_then(|m| m.get("name"))
            .and_then(Value::as_str)
            .unwrap_or("Nguồn VBook")
            .to_owned();
        let ext_type = meta
            .and_then(|m| m.get("type"))
            .and_then(Value::as_str)
            .unwrap_or("novel")
            .to_ascii_lowercase();
        let source = meta
            .and_then(|m| m.get("source"))
            .and_then(Value::as_str)
            .filter(|s| !s.is_empty())
            .unwrap_or("https://mock.example")
            .trim_end_matches('/')
            .to_owned();

        let resp = match script_key {
            "search" => {
                let query = args.first().and_then(Value::as_str).unwrap_or("").trim();
                let prefix = if query.is_empty() {
                    ext_name.clone()
                } else {
                    format!("{query} · {ext_name}")
                };
                json!({
                    "code": 0,
                    "data": [
                        {
                            "name": format!("{prefix} - Mẫu 1"),
                            "link": format!("{source}/item/1"),
                            "description": format!("Kết quả mẫu ({ext_type})"),
                            "host": source,
                            "type": ext_type
                        },
                        {
                            "name": format!("{prefix} - Mẫu 2"),
                            "link": format!("{source}/item/2"),
                            "description": "Mục mẫu thứ hai",
                            "host": source,
                            "type": ext_type
                        }
                    ],
                    "data2": "2"
                })
            }
            "detail" => {
                let target = args.first().and_then(Value::as_str).unwrap_or("");
                json!({
                    "code": 0,
                    "data": {
                        "name": format!("{ext_name} · Chi tiết"),
                        "author": "Tác giả Mẫu",
                        "host": source,
                        "detail": format!("<p>Chi tiết mẫu cho <b>{target}</b> (loại <i>{ext_type}</i>).</p>"),
                        "ongoing": true,
                        "genres": [ext_type, "Mock Loopback"],
                        "type": ext_type
                    }
                })
            }
            "page" => {
                let target = args.first().and_then(Value::as_str).unwrap_or("");
                json!({"code": 0, "data": [target]})
            }
            "toc" => json!({
                "code": 0,
                "data": [
                    { "name": "Mục 1: Khởi đầu", "url": format!("{source}/ep/1"), "host": source },
                    { "name": "Mục 2: Tiếp diễn", "url": format!("{source}/ep/2"), "host": source }
                ]
            }),
            "chap" => match ext_type.as_str() {
                "comic" => json!({
                    "code": 0,
                    "data": [
                        format!("{source}/pages/01.webp"),
                        { "link": format!("{source}/pages/02.webp"), "headers": { "Referer": source } }
                    ]
                }),
                "video" | "audio" => json!({
                    "code": 0,
                    "data": [
                        {
                            "title": if ext_type == "audio" { "Audio MP3 320k" } else { "Server HD 1080p" },
                            "data": format!("{source}/stream/1"),
                            "quality": if ext_type == "audio" { "320kbps" } else { "1080p" },
                            "type": ext_type
                        },
                        {
                            "title": "Server Dự Phòng",
                            "data": format!("{source}/stream/2"),
                            "quality": "720p",
                            "type": ext_type
                        }
                    ]
                }),
                _ => json!({
                    "code": 0,
                    "data": format!("<p>Nội dung đọc thử từ <b>{ext_name}</b> (loại {ext_type}).</p><p>Mọi định dạng nội dung chuẩn đều chạy qua một pipeline Rust thống nhất.</p>"),
                    "data2": "Mục 1: Khởi đầu"
                }),
            },
            "track" => {
                if ext_type == "audio" {
                    json!({
                        "code": 0,
                        "data": {
                            "type": "native",
                            "title": "Track âm thanh mẫu",
                            "data": format!("{source}/cdn/audio-1.mp3"),
                            "mimeType": "audio/mpeg",
                            "headers": { "Referer": source }
                        }
                    })
                } else {
                    json!({
                        "code": 0,
                        "data": {
                            "type": "native",
                            "title": "Luồng HLS 1080p",
                            "data": format!("{source}/cdn/master.m3u8"),
                            "mimeType": "application/x-mpegURL",
                            "headers": { "Referer": source },
                            "subtitles": [
                                { "data": format!("{source}/sub/vi.vtt"), "type": "vtt", "label": "Tiếng Việt", "language": "vi" }
                            ]
                        }
                    })
                }
            }
            "voice" => json!({
                "code": 0,
                "data": [
                    { "id": "vi-VN-Standard-A", "name": "Giọng Nữ Chuẩn", "language": "vi-VN" },
                    { "id": "vi-VN-Wavenet-B", "name": "Giọng Nam Ấm", "language": "vi-VN" }
                ]
            }),
            "tts" => {
                json!({
                    "code": 0,
                    "data": "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
                    "data2": "audio/wav"
                })
            }
            "language" => json!({
                "code": 0,
                "data": [
                    { "id": "zh", "name": "Tiếng Trung", "type": "from" },
                    { "id": "vi", "name": "Tiếng Việt", "type": "to" },
                    { "id": "en", "name": "English" }
                ]
            }),
            "model" => json!({
                "code": 0,
                "data": [
                    { "id": "fast", "name": "Nhanh (Fast)" },
                    { "id": "quality", "name": "Chất lượng cao" }
                ]
            }),
            "style" => json!({
                "code": 0,
                "data": [
                    { "id": "hanviet", "name": "Hán Việt / Tiên hiệp" },
                    { "id": "natural", "name": "Tự nhiên" }
                ]
            }),
            "translate" => {
                let text = args.first().and_then(Value::as_str).unwrap_or("");
                let from = args.get(1).and_then(Value::as_str).unwrap_or("auto");
                let to = args.get(2).and_then(Value::as_str).unwrap_or("vi");
                json!({
                    "code": 0,
                    "data": {
                        "text": format!("[Dịch {from}->{to}] {text}"),
                        "segments": []
                    }
                })
            }
            "chatStream" | "chat" => {
                let model = args.get(1).and_then(Value::as_str).unwrap_or("default");
                let raw_msgs = args.first().and_then(Value::as_str).unwrap_or("[]");
                let msgs: Vec<Value> = serde_json::from_str(raw_msgs).unwrap_or_default();
                let last = msgs
                    .last()
                    .and_then(|m| m.get("content"))
                    .and_then(Value::as_str)
                    .unwrap_or("");
                json!({
                    "code": 0,
                    "data": format!("[AI Mock · {model}] Đã nhận: {last}")
                })
            }
            other => {
                return Err(
                    format!("MockVBookRunnerExecutor không hỗ trợ script `{other}`.").into(),
                );
            }
        };
        Ok(resp)
    }
}

pub enum CoreVBookExecutor {
    Mock(MockVBookRunnerExecutor),
    Java(JavaVBookRunnerExecutor),
}

impl CoreVBookExecutor {
    pub fn open(mock_mode: bool) -> Self {
        Self::open_with_runtime(mock_mode, None, None, None)
    }

    pub fn open_with_java(mock_mode: bool, custom_java: Option<PathBuf>) -> Self {
        Self::open_with_runtime(mock_mode, custom_java, None, None)
    }

    pub fn open_with_runtime(
        mock_mode: bool,
        custom_java: Option<PathBuf>,
        browser_bridge_url: Option<String>,
        browser_bridge_token: Option<String>,
    ) -> Self {
        if mock_mode {
            Self::Mock(MockVBookRunnerExecutor)
        } else {
            Self::Java(JavaVBookRunnerExecutor::with_runtime(
                custom_java,
                browser_bridge_url,
                browser_bridge_token,
            ))
        }
    }

    pub fn probe_status(mock_mode: bool) -> RunnerStatus {
        Self::probe_status_with_runtime(mock_mode, None, false)
    }

    pub fn probe_status_with_java(mock_mode: bool, custom_java: Option<&Path>) -> RunnerStatus {
        Self::probe_status_with_runtime(mock_mode, custom_java, false)
    }

    pub fn probe_status_with_runtime(
        mock_mode: bool,
        custom_java: Option<&Path>,
        browser_bridge_ready: bool,
    ) -> RunnerStatus {
        if mock_mode {
            RunnerStatus {
                ready: true,
                mock_mode: true,
                browser_bridge_ready,
                java_path: None,
                jar_path: None,
                message:
                    "Đang chạy vbook_runner ở chế độ giả lập (NOVEL_STUDIO_VBOOK_MOCK_RUNNER=1)."
                        .to_owned(),
            }
        } else {
            JavaVBookRunnerExecutor::probe_status_with_runtime(custom_java, browser_bridge_ready)
        }
    }
}

impl VBookScriptExecutor for CoreVBookExecutor {
    fn run_script(
        &mut self,
        plugin_dir: &Path,
        script_key: &str,
        args: &[Value],
        config: &RunnerExecConfig,
    ) -> Result<Value, CoreError> {
        match self {
            Self::Mock(inner) => inner.run_script(plugin_dir, script_key, args, config),
            Self::Java(inner) => inner.run_script(plugin_dir, script_key, args, config),
        }
    }
}

pub fn build_exec_config(ext: &InstalledExtension, storage_path: &Path) -> RunnerExecConfig {
    let mut plugin_config = BTreeMap::new();
    for (k, raw_schema) in &ext.config_schema {
        if let Some(obj) = raw_schema.as_object() {
            let mode = obj.get("mode").and_then(Value::as_str).unwrap_or("");
            if mode == "database" {
                continue;
            }
            let val = ext
                .user_config
                .get(k)
                .cloned()
                .or_else(|| obj.get("default").cloned())
                .unwrap_or(Value::String(String::new()));
            plugin_config.insert(k.clone(), val);
        } else {
            let val = ext
                .user_config
                .get(k)
                .cloned()
                .unwrap_or_else(|| raw_schema.clone());
            plugin_config.insert(k.clone(), val);
        }
    }
    for (k, v) in &ext.user_config {
        plugin_config.entry(k.clone()).or_insert_with(|| v.clone());
    }
    RunnerExecConfig {
        storage_path: storage_path.display().to_string(),
        plugin_config,
        browser_bridge_url: String::new(),
        browser_bridge_token: String::new(),
    }
}

pub fn encode_json_string(value: &str) -> Result<String, CoreError> {
    Ok(serde_json::to_string(value)?)
}

pub fn unwrap_vbook_response(raw: &Value) -> Result<(Value, Option<String>), CoreError> {
    let Some(obj) = raw.as_object() else {
        return Ok((raw.clone(), None));
    };
    let is_code_error = obj
        .get("code")
        .and_then(|v| v.as_i64().or_else(|| v.as_f64().map(|f| f as i64)))
        .is_some_and(|code| code != 0);
    let is_flag_error = obj
        .get("isSuccess")
        .or_else(|| obj.get("success"))
        .and_then(Value::as_bool)
        .is_some_and(|ok| !ok);

    if is_code_error || is_flag_error {
        let msg = first_non_empty(&[
            read_str_any(obj, &["data2", "error", "message"]),
            "Extension trả về Response.error không kèm mô tả.".to_owned(),
        ]);
        return Err(msg.into());
    }
    if obj.contains_key("data") {
        let data = obj.get("data").cloned().unwrap_or(Value::Null);
        let data2 = obj.get("data2").and_then(|v| {
            v.as_str()
                .map(ToOwned::to_owned)
                .or_else(|| (!v.is_null()).then(|| v.to_string()))
        });
        return Ok((data, data2));
    }
    Ok((raw.clone(), None))
}

fn parse_track_list(data: &Value) -> Vec<VBookTrackEntry> {
    let Some(arr) = data.as_array() else {
        return Vec::new();
    };
    let mut tracks = Vec::with_capacity(arr.len());
    for entry in arr {
        let Some(obj) = entry.as_object() else {
            continue;
        };
        let track_data = read_str_any(obj, &["data", "url"]);
        if track_data.is_empty() {
            continue;
        }
        tracks.push(VBookTrackEntry {
            title: first_non_empty(&[
                read_str_any(obj, &["title", "name"]),
                format!("Server {}", tracks.len() + 1),
            ]),
            data: track_data,
            quality: read_str_any(obj, &["quality"]),
            track_type: read_str_any(obj, &["type"]),
            subtitles: as_vec(obj.get("subtitles")),
            raw: entry.clone(),
        });
    }
    tracks
}

fn normalize_vbook_link(host: &str, raw_link: &str) -> String {
    let resolved = if host.is_empty() {
        raw_link.trim().to_owned()
    } else {
        resolve_relative_url(host, raw_link)
    };
    strip_trailing_slash_http(&resolved)
}

pub fn strip_trailing_slash_http(url: &str) -> String {
    let trimmed = url.trim();
    if trimmed.starts_with("https://") || trimmed.starts_with("http://") {
        trimmed.trim_end_matches('/').to_owned()
    } else {
        trimmed.to_owned()
    }
}

pub fn html_to_plain_text(html: &str) -> String {
    let with_breaks = html
        .replace("<br>", "\n")
        .replace("<br/>", "\n")
        .replace("<br />", "\n")
        .replace("</p>", "\n\n")
        .replace("</div>", "\n")
        .replace("</li>", "\n");
    let mut out = String::with_capacity(with_breaks.len());
    let mut in_tag = false;
    for ch in with_breaks.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => out.push(ch),
            _ => {}
        }
    }
    let decoded = out
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'");
    let mut cleaned = Vec::new();
    let mut prev_blank = false;
    for line in decoded.lines() {
        let t = line.trim();
        if t.is_empty() {
            if !prev_blank && !cleaned.is_empty() {
                cleaned.push(String::new());
                prev_blank = true;
            }
        } else {
            cleaned.push(t.to_owned());
            prev_blank = false;
        }
    }
    cleaned.join("\n").trim().to_owned()
}

fn read_str_any(obj: &Map<String, Value>, keys: &[&str]) -> String {
    for key in keys {
        if let Some(val) = obj.get(*key) {
            if let Some(s) = val.as_str() {
                let t = s.trim();
                if !t.is_empty() {
                    return t.to_owned();
                }
            } else if val.is_number() || val.is_boolean() {
                return val.to_string();
            }
        }
    }
    String::new()
}

fn first_non_empty(candidates: &[String]) -> String {
    candidates
        .iter()
        .find(|s| !s.trim().is_empty())
        .cloned()
        .unwrap_or_default()
}

fn parse_header_map(value: Option<&Value>) -> BTreeMap<String, String> {
    let mut out = BTreeMap::new();
    let Some(obj) = value.and_then(Value::as_object) else {
        return out;
    };
    for (k, v) in obj {
        if let Some(s) = v.as_str() {
            out.insert(k.clone(), s.to_owned());
        }
    }
    out
}

fn as_vec(value: Option<&Value>) -> Vec<Value> {
    value.and_then(Value::as_array).cloned().unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vbook::model::ExtensionCategory;
    use crate::vbook::package::build_test_zip;

    struct MockExecutor {
        calls: Vec<(String, Vec<Value>, BTreeMap<String, Value>)>,
    }

    impl MockExecutor {
        fn new() -> Self {
            Self { calls: Vec::new() }
        }
    }

    impl VBookScriptExecutor for MockExecutor {
        fn run_script(
            &mut self,
            _plugin_dir: &Path,
            script_key: &str,
            args: &[Value],
            config: &RunnerExecConfig,
        ) -> Result<Value, CoreError> {
            self.calls.push((
                script_key.to_owned(),
                args.to_vec(),
                config.plugin_config.clone(),
            ));
            let res = match script_key {
                "search" => json!({
                    "code": 0,
                    "data": [{
                        "name": "Phàm Nhân Tu Tiên",
                        "link": "/phim/pham-nhan",
                        "cover": "/img/pn.jpg",
                        "description": "Hoạt hình 3D"
                    }],
                    "data2": "2"
                }),
                "detail" => json!({
                    "code": 0,
                    "data": {
                        "name": "Phàm Nhân Tu Tiên",
                        "author": "Vong Ngữ",
                        "detail": "<p>Hàn Lập <b>tu tiên</b>.</p>",
                        "ongoing": true,
                        "genres": ["Tiên hiệp", "3D"],
                        "type": "video"
                    }
                }),
                "page" => json!({
                    "code": 0,
                    "data": ["https://video.example/list?p=1", "https://video.example/list?p=2/"]
                }),
                "toc" => {
                    let u = args.first().and_then(Value::as_str).unwrap_or("");
                    if u.ends_with("p=1") {
                        json!({"code": 0, "data": [{"name": "Tập 1", "url": "/tap-1"}]})
                    } else {
                        json!({"code": 0, "data": [{"name": "Tập 2", "url": "/tap-2"}]})
                    }
                }
                "chap" => json!({
                    "code": 0,
                    "data": [{"title": "Server VIP", "data": "https://video.example/embed/1/"}]
                }),
                "track" => json!({
                    "code": 0,
                    "data": {
                        "type": "native",
                        "data": "https://cdn.example/master.m3u8",
                        "mimeType": "application/x-mpegURL",
                        "headers": {"Referer": "https://video.example"}
                    }
                }),
                "voice" => json!({
                    "code": 0,
                    "data": [{"id": "vi-A", "name": "Nữ Miền Bắc", "language": "vi-VN"}]
                }),
                "tts" => json!({"code": 0, "data": "UklGRgAA"}),
                "language" => {
                    json!({"code": 0, "data": [{"id": "zh", "name": "Trung", "type": "from"}, {"id": "vi", "name": "Việt"}]})
                }
                "model" => json!({"code": 0, "data": [{"id": "fast", "name": "Nhanh"}]}),
                "style" => json!({"code": 0, "data": [{"id": "hanviet", "name": "Kiếm hiệp"}]}),
                "translate" => {
                    json!({"code": 0, "data": {"text": "Xin chào", "segments": [{"src_start": 0}]}})
                }
                "chatStream" => json!({"code": 0, "data": "Chào đạo hữu!"}),
                _ => json!({"code": 1, "data2": "Unknown script"}),
            };
            Ok(res)
        }
    }

    #[test]
    fn parses_all_extension_types_and_categories() {
        for (raw, expected, cat) in [
            ("novel", ExtensionType::Novel, ExtensionCategory::Content),
            (
                "chinese_novel",
                ExtensionType::ChineseNovel,
                ExtensionCategory::Content,
            ),
            ("comic", ExtensionType::Comic, ExtensionCategory::Content),
            ("video", ExtensionType::Video, ExtensionCategory::Content),
            ("audio", ExtensionType::Audio, ExtensionCategory::Content),
            ("podcast", ExtensionType::Audio, ExtensionCategory::Content),
            ("forum", ExtensionType::Forum, ExtensionCategory::Content),
            ("news", ExtensionType::News, ExtensionCategory::Content),
            ("tts", ExtensionType::Tts, ExtensionCategory::Engine),
            (
                "translate",
                ExtensionType::Translate,
                ExtensionCategory::Engine,
            ),
            ("ai", ExtensionType::Ai, ExtensionCategory::Engine),
        ] {
            let parsed = ExtensionType::from_raw(raw);
            assert_eq!(parsed, expected);
            assert_eq!(parsed.category(), cat);
        }
    }

    #[test]
    fn runner_service_handles_video_page_toc_track_and_engine_scripts() {
        let dir = tempfile::tempdir().expect("tempdir");
        let store = VBookExtensionStore::new(dir.path()).expect("store");

        let video_pjson = r#"{
            "metadata": {"name": "Video Demo", "author": "Dev", "version": 1, "source": "https://video.example", "type": "video"},
            "script": {"search": "search.js", "detail": "detail.js", "page": "page.js", "toc": "toc.js", "chap": "chap.js", "track": "track.js"},
            "config": {"quality": {"title": "Chất lượng", "mode": "select", "default": "1080p", "values": ["720p", "1080p"]}}
        }"#;
        let video_zip = build_test_zip(&[("plugin.json", video_pjson.as_bytes())], false);
        let video_ext = store
            .install_from_local_zip("video.zip", &video_zip)
            .expect("install video");
        let caps = video_ext.capabilities();
        assert!(caps.has_search && caps.has_page && caps.has_track && !caps.has_tts);

        let mut cfg = BTreeMap::new();
        cfg.insert("quality".to_owned(), json!("720p"));
        store
            .save_extension_config(&video_ext.id, cfg)
            .expect("save cfg");

        let mut exec = MockExecutor::new();
        let svc = VBookRunnerService::new(&store);
        let found = svc
            .search(&video_ext.id, "pham nhan", None, &mut exec)
            .expect("search");
        assert_eq!(found.items.len(), 1);
        assert_eq!(found.items[0].link, "https://video.example/phim/pham-nhan");
        assert_eq!(found.next.as_deref(), Some("2"));

        let detail = svc
            .detail(
                &video_ext.id,
                "https://video.example/phim/pham-nhan/",
                &mut exec,
            )
            .expect("detail");
        assert_eq!(detail.detail_text, "Hàn Lập tu tiên.");
        assert_eq!(detail.url, "https://video.example/phim/pham-nhan");

        let toc = svc
            .toc(
                &video_ext.id,
                "https://video.example/phim/pham-nhan/",
                &mut exec,
            )
            .expect("toc");
        assert_eq!(toc.len(), 2);
        assert_eq!(toc[0].url, "https://video.example/tap-1");
        assert_eq!(toc[1].url, "https://video.example/tap-2");

        let chap = svc
            .chap(&video_ext.id, &toc[0].url, None, &mut exec)
            .expect("chap");
        let VBookChapterContent::MediaTracks { tracks, .. } = chap else {
            panic!("expected MediaTracks");
        };
        assert_eq!(tracks.len(), 1);
        let resolved = svc
            .resolve_track(&video_ext.id, &tracks[0].data, &mut exec)
            .expect("resolve track");
        assert_eq!(resolved.data, "https://cdn.example/master.m3u8");
        assert_eq!(resolved.track_type, "native");
        assert_eq!(
            exec.calls[0].2.get("quality"),
            Some(&json!("720p")),
            "user_config must override default in RunnerExecConfig"
        );

        // Engine extensions: TTS, Translate, AI
        for (fname, pjson) in [
            (
                "tts.zip",
                r#"{"metadata":{"name":"TTS","type":"tts","version":1},"script":{"voice":"voice.js","tts":"tts.js"}}"#,
            ),
            (
                "tr.zip",
                r#"{"metadata":{"name":"TR","type":"translate","version":1},"script":{"language":"language.js","model":"model.js","style":"style.js","translate":"translate.js"}}"#,
            ),
            (
                "ai.zip",
                r#"{"metadata":{"name":"AI","type":"ai","version":1},"script":{"chatStream":"chat.js"}}"#,
            ),
        ] {
            let z = build_test_zip(&[("plugin.json", pjson.as_bytes())], false);
            let inst = store
                .install_from_local_zip(fname, &z)
                .expect("install engine");
            match inst.ext_type {
                ExtensionType::Tts => {
                    let voices = svc.tts_voices(&inst.id, &mut exec).expect("voices");
                    assert_eq!(voices[0].id, "vi-A");
                    let audio = svc
                        .tts_synthesize(&inst.id, "Xin chào", "vi-A", &mut exec)
                        .expect("tts");
                    assert_eq!(audio.base64_data, "UklGRgAA");
                }
                ExtensionType::Translate => {
                    let meta = svc.translate_meta(&inst.id, &mut exec).expect("meta");
                    assert_eq!(meta.languages.len(), 2);
                    assert_eq!(meta.models[0].id, "fast");
                    assert_eq!(meta.styles[0].id, "hanviet");
                    let tr = svc
                        .translate_text(
                            &inst.id,
                            "你好",
                            "zh",
                            "vi",
                            "chapterContent",
                            "fast",
                            "hanviet",
                            &mut exec,
                        )
                        .expect("tr");
                    assert_eq!(tr.text, "Xin chào");
                }
                ExtensionType::Ai => {
                    let reply = svc
                        .ai_chat(
                            &inst.id,
                            &[json!({"role":"user","content":"Hi"})],
                            "gpt-4o",
                            &mut exec,
                        )
                        .expect("ai");
                    assert_eq!(reply.text, "Chào đạo hữu!");
                }
                _ => unreachable!(),
            }
        }
    }

    #[test]
    fn runtime_config_persists_and_custom_java_path_takes_priority() {
        let dir = tempfile::tempdir().expect("tempdir");
        let empty = load_runtime_config(dir.path()).expect("default load");
        assert_eq!(empty.custom_java_path, None);

        let fake_java = dir
            .path()
            .join(if cfg!(windows) { "java.exe" } else { "java" });
        std::fs::write(&fake_java, b"stub").expect("write stub");

        let saved = save_runtime_config(
            dir.path(),
            &RunnerRuntimeConfig {
                custom_java_path: Some(format!("  {}  ", fake_java.display())),
            },
        )
        .expect("save cfg");
        assert_eq!(
            saved.custom_java_path.as_deref(),
            Some(fake_java.to_string_lossy().as_ref())
        );

        let reloaded = load_runtime_config(dir.path()).expect("reload cfg");
        assert_eq!(reloaded, saved);

        let chosen = find_java_bin_with_custom(None, Some(&fake_java));
        assert_eq!(chosen.as_deref(), Some(fake_java.as_path()));

        let status = CoreVBookExecutor::probe_status_with_java(false, Some(&fake_java));
        assert_eq!(
            status.java_path.as_deref(),
            Some(fake_java.to_string_lossy().as_ref())
        );
    }
}
