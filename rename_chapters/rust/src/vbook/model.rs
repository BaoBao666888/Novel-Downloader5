use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

pub const DEFAULT_VBOOK_REPO_URL: &str = "https://www.vbookext.me/api/plugin.json";

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExtensionType {
    Novel,
    Comic,
    ChineseNovel,
    Video,
    Translate,
    Ai,
    Unknown,
}

impl ExtensionType {
    /// Parse `metadata.type` hoặc trường `type` trong catalog của vbook-beta.
    pub fn from_raw(raw: &str) -> Self {
        match raw.trim().to_ascii_lowercase().as_str() {
            "" | "novel" => Self::Novel,
            "comic" => Self::Comic,
            "chinese_novel" | "chinesenovel" => Self::ChineseNovel,
            "video" => Self::Video,
            "translate" => Self::Translate,
            "ai" => Self::Ai,
            _ => Self::Unknown,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Novel => "novel",
            Self::Comic => "comic",
            Self::ChineseNovel => "chinese_novel",
            Self::Video => "video",
            Self::Translate => "translate",
            Self::Ai => "ai",
            Self::Unknown => "unknown",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ExtensionRepo {
    pub url: String,
    pub name: String,
    #[serde(default)]
    pub author: String,
    #[serde(default)]
    pub description: String,
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default)]
    pub locked: bool,
    #[serde(default)]
    pub last_synced_at: i64,
    #[serde(default)]
    pub last_error: Option<String>,
    #[serde(default)]
    pub plugin_count: usize,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RemoteExtension {
    pub id: String,
    pub name: String,
    pub author: String,
    pub version: i32,
    pub source: String,
    pub host: String,
    pub icon: String,
    pub description: String,
    pub ext_type: ExtensionType,
    pub locale: String,
    pub language: String,
    pub country: String,
    pub is_nsfw: bool,
    pub path: String,
    pub repo_url: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct InstalledExtension {
    pub id: String,
    pub name: String,
    pub author: String,
    pub version: i32,
    pub source: String,
    pub host: String,
    pub regexp: String,
    pub icon_data_url: String,
    pub description: String,
    pub locale: String,
    pub ext_type: ExtensionType,
    pub is_nsfw: bool,
    pub is_local: bool,
    pub is_encrypted: bool,
    pub pinned: bool,
    pub source_url: String,
    pub repo_url: String,
    #[serde(default)]
    pub scripts: BTreeMap<String, String>,
    #[serde(default)]
    pub config_schema: BTreeMap<String, Value>,
    #[serde(default)]
    pub actions: BTreeMap<String, Value>,
    #[serde(default)]
    pub user_config: BTreeMap<String, Value>,
    #[serde(default)]
    pub local_storage: BTreeMap<String, String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ExtensionUpdate {
    pub installed_id: String,
    pub remote: RemoteExtension,
    pub installed_version: i32,
    pub remote_version: i32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CatalogExtensionView {
    pub remote: RemoteExtension,
    pub installed: bool,
    pub installed_id: Option<String>,
    pub installed_version: Option<i32>,
    pub update_available: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct VBookWorkspaceSnapshot {
    pub repos: Vec<ExtensionRepo>,
    pub updates: Vec<ExtensionUpdate>,
    pub installed: Vec<InstalledExtension>,
    pub catalog: Vec<CatalogExtensionView>,
    pub types: Vec<String>,
    pub languages: Vec<String>,
    pub authors: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RefreshError {
    pub repo_url: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct VBookRefreshResult {
    pub snapshot: VBookWorkspaceSnapshot,
    pub errors: Vec<RefreshError>,
    pub fetched_repos: usize,
    pub total_remote: usize,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct VBookBatchUpdateResult {
    pub snapshot: VBookWorkspaceSnapshot,
    pub updated_ids: Vec<String>,
    pub failed: Vec<RefreshError>,
}
