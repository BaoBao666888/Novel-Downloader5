use std::collections::HashMap;

use serde_json::{Map, Value};

use crate::CoreError;
use crate::vbook::model::{
    CatalogExtensionView, ExtensionRepo, ExtensionType, ExtensionUpdate, InstalledExtension,
    RemoteExtension,
};
use crate::vbook::package::{
    deterministic_extension_id, normalize_host_from_source, parse_version_i32,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedRepoCatalog {
    pub repo_name: String,
    pub repo_author: String,
    pub repo_description: String,
    pub items: Vec<RemoteExtension>,
}

/// Phân tích `plugin.json` từ repo VBook (hợp đồng `metadata` + `data`, tương thích mảng trần).
pub fn parse_repo_catalog(repo_url: &str, body_json: &str) -> Result<ParsedRepoCatalog, CoreError> {
    let trimmed = body_json.trim_start_matches('\u{feff}').trim();
    let root: Value =
        serde_json::from_str(trimmed).map_err(|err| format!("JSON repo không hợp lệ: {err}"))?;

    let (meta_obj, data_array) = match &root {
        Value::Object(obj) => {
            let meta = obj.get("metadata").and_then(Value::as_object);
            let arr = obj
                .get("data")
                .and_then(Value::as_array)
                .ok_or("JSON repo thiếu mảng `data`.")?;
            (meta, arr)
        }
        Value::Array(arr) => (None, arr),
        _ => return Err("JSON repo phải là object hoặc array.".into()),
    };

    let repo_name = meta_obj
        .and_then(|m| read_opt_str(m, "name"))
        .unwrap_or_else(|| normalize_host_from_source(repo_url));
    let repo_author = meta_obj
        .and_then(|m| read_opt_str(m, "author"))
        .unwrap_or_default();
    let repo_description = meta_obj
        .and_then(|m| read_opt_str(m, "description"))
        .unwrap_or_default();

    let mut items = Vec::with_capacity(data_array.len());
    for entry in data_array {
        let Some(obj) = entry.as_object() else {
            continue;
        };
        let raw_path = read_opt_str(obj, "path").unwrap_or_default();
        if raw_path.is_empty() {
            continue;
        }
        let path = resolve_relative_url(repo_url, &raw_path);
        let id = deterministic_extension_id(&path);
        let name = read_opt_str(obj, "name").unwrap_or_else(|| id.clone());
        let author = read_opt_str(obj, "author").unwrap_or_default();
        let version = parse_version_i32(obj.get("version"));
        let source = read_opt_str(obj, "source").unwrap_or_default();
        let host = normalize_host_from_source(&source);
        let raw_icon = read_opt_str(obj, "icon").unwrap_or_default();
        let icon = if raw_icon.is_empty() {
            String::new()
        } else {
            resolve_relative_url(repo_url, &raw_icon)
        };
        let description = read_opt_str(obj, "description").unwrap_or_default();
        let ext_type =
            ExtensionType::from_raw(obj.get("type").and_then(Value::as_str).unwrap_or_default());
        let (locale, language, country) = normalize_locale(
            obj.get("locale")
                .and_then(Value::as_str)
                .unwrap_or_default(),
        );
        let is_nsfw = parse_nsfw(obj);

        items.push(RemoteExtension {
            id,
            name,
            author,
            version,
            source,
            host,
            icon,
            description,
            ext_type,
            locale,
            language,
            country,
            is_nsfw,
            path,
            repo_url: repo_url.trim().to_owned(),
        });
    }

    Ok(ParsedRepoCatalog {
        repo_name,
        repo_author,
        repo_description,
        items,
    })
}

pub fn normalize_repo_meta_into(
    repo: &mut ExtensionRepo,
    parsed: &ParsedRepoCatalog,
    synced_at: i64,
) {
    if !parsed.repo_name.is_empty() {
        repo.name = parsed.repo_name.clone();
    }
    if !parsed.repo_author.is_empty() {
        repo.author = parsed.repo_author.clone();
    }
    if !parsed.repo_description.is_empty() {
        repo.description = parsed.repo_description.clone();
    }
    repo.last_synced_at = synced_at;
    repo.last_error = None;
    repo.plugin_count = parsed.items.len();
}

/// Theo `vbook-beta` (`cn6.smali`): CHỈ coi là có cập nhật khi `remote.version > installed.version`.
pub fn compute_extension_updates(
    installed: &[InstalledExtension],
    remote: &[RemoteExtension],
) -> Vec<ExtensionUpdate> {
    let mut best_by_installed: HashMap<String, ExtensionUpdate> = HashMap::new();

    for inst in installed {
        let mut best: Option<&RemoteExtension> = None;
        for cand in remote {
            if !extension_matches_remote(inst, cand) {
                continue;
            }
            if cand.version <= inst.version {
                continue;
            }
            if best.is_none_or(|prev| cand.version > prev.version) {
                best = Some(cand);
            }
        }
        if let Some(winner) = best {
            best_by_installed.insert(
                inst.id.clone(),
                ExtensionUpdate {
                    installed_id: inst.id.clone(),
                    remote: winner.clone(),
                    installed_version: inst.version,
                    remote_version: winner.version,
                },
            );
        }
    }

    let mut out: Vec<ExtensionUpdate> = best_by_installed.into_values().collect();
    out.sort_by(|a, b| {
        a.remote
            .name
            .to_lowercase()
            .cmp(&b.remote.name.to_lowercase())
            .then_with(|| a.installed_id.cmp(&b.installed_id))
    });
    out
}

pub fn build_catalog_views(
    installed: &[InstalledExtension],
    remote: &[RemoteExtension],
) -> Vec<CatalogExtensionView> {
    let mut out = Vec::with_capacity(remote.len());
    for item in remote {
        let matched = installed
            .iter()
            .find(|inst| extension_matches_remote(inst, item));
        let (is_installed, installed_id, installed_version, update_available) = match matched {
            Some(inst) => (
                true,
                Some(inst.id.clone()),
                Some(inst.version),
                item.version > inst.version,
            ),
            None => (false, None, None, false),
        };
        out.push(CatalogExtensionView {
            remote: item.clone(),
            installed: is_installed,
            installed_id,
            installed_version,
            update_available,
        });
    }
    out
}

pub fn extension_matches_remote(inst: &InstalledExtension, remote: &RemoteExtension) -> bool {
    if inst.id == remote.id {
        return true;
    }
    if !inst.source_url.is_empty() && inst.source_url == remote.path {
        return true;
    }
    let inst_host = normalize_host_from_source(&inst.host);
    let rem_host = normalize_host_from_source(&remote.host);
    !inst_host.is_empty()
        && inst_host == rem_host
        && inst.name.trim().eq_ignore_ascii_case(remote.name.trim())
        && inst
            .author
            .trim()
            .eq_ignore_ascii_case(remote.author.trim())
}

/// Tìm extension đã cài khớp với URL truyện dựa trên `host`, `source` hoặc biểu thức `regexp`.
pub fn match_extension_for_url<'a>(
    installed: &'a [InstalledExtension],
    url: &str,
) -> Option<&'a InstalledExtension> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return None;
    }
    let target_host = normalize_host_from_source(trimmed);
    if target_host.is_empty() {
        return None;
    }

    for ext in installed {
        let ext_host = normalize_host_from_source(&ext.host);
        if !ext_host.is_empty()
            && (target_host == ext_host || target_host.ends_with(&format!(".{ext_host}")))
        {
            return Some(ext);
        }
        let src_host = normalize_host_from_source(&ext.source);
        if !src_host.is_empty()
            && (target_host == src_host || target_host.ends_with(&format!(".{src_host}")))
        {
            return Some(ext);
        }
        if regexp_mentions_host(&ext.regexp, trimmed, &target_host) {
            return Some(ext);
        }
    }
    None
}

fn regexp_mentions_host(regexp: &str, full_url: &str, target_host: &str) -> bool {
    let raw = regexp.trim();
    if raw.is_empty() {
        return false;
    }
    let cleaned = raw
        .trim_start_matches('^')
        .trim_end_matches('$')
        .replace("\\.", ".");
    for branch in cleaned.split('|') {
        let stripped = branch
            .trim()
            .trim_start_matches("(https?://)?")
            .trim_start_matches("https?://")
            .trim_start_matches("https://")
            .trim_start_matches("http://")
            .trim_start_matches("(www\\.)?")
            .trim_start_matches("www.");
        let candidate_prefix = stripped
            .split(['[', '(', '*', '+', '?'])
            .next()
            .unwrap_or("")
            .trim_end_matches('/');
        if candidate_prefix.len() < 4 || !candidate_prefix.contains('.') {
            continue;
        }
        let cand_host = normalize_host_from_source(candidate_prefix);
        if target_host == cand_host
            || full_url
                .to_ascii_lowercase()
                .contains(&candidate_prefix.to_ascii_lowercase())
        {
            return true;
        }
    }
    false
}

pub fn resolve_relative_url(base_url: &str, rel_or_abs: &str) -> String {
    let target = rel_or_abs.trim();
    if target.is_empty()
        || target.starts_with("https://")
        || target.starts_with("http://")
        || target.starts_with("data:")
    {
        return target.to_owned();
    }
    let Some(scheme_end) = base_url.find("://") else {
        return target.to_owned();
    };
    let after_scheme = &base_url[scheme_end + 3..];
    let origin_end = after_scheme
        .find('/')
        .map(|i| scheme_end + 3 + i)
        .unwrap_or(base_url.len());
    let origin = &base_url[..origin_end];

    if target.starts_with('/') {
        return format!("{origin}{target}");
    }
    let clean_rel = target.trim_start_matches("./");
    let base_no_query = base_url.split(['?', '#']).next().unwrap_or(base_url);
    let dir_end = base_no_query.rfind('/').unwrap_or(origin_end);
    if dir_end <= scheme_end + 2 {
        format!("{origin}/{clean_rel}")
    } else {
        format!("{}/{clean_rel}", &base_no_query[..dir_end])
    }
}

fn read_opt_str(obj: &Map<String, Value>, key: &str) -> Option<String> {
    match obj.get(key) {
        Some(Value::String(s)) => Some(s.trim().to_owned()),
        Some(Value::Number(n)) => Some(n.to_string()),
        _ => None,
    }
}

fn parse_nsfw(obj: &Map<String, Value>) -> bool {
    if let Some(Value::Bool(b)) = obj.get("nsfw") {
        return *b;
    }
    if let Some(Value::String(s)) = obj.get("nsfw")
        && let Ok(parsed) = s.trim().to_ascii_lowercase().parse::<bool>()
    {
        return parsed;
    }
    obj.get("tag")
        .and_then(Value::as_str)
        .is_some_and(|t| t.trim().eq_ignore_ascii_case("nsfw"))
}

fn normalize_locale(raw: &str) -> (String, String, String) {
    let cleaned = raw.trim().replace('_', "-");
    if cleaned.is_empty()
        || cleaned.eq_ignore_ascii_case("global")
        || cleaned.eq_ignore_ascii_case("und")
    {
        return (String::new(), String::new(), String::new());
    }
    let mut parts = cleaned.split('-').filter(|p| !p.is_empty());
    let language = parts
        .next()
        .map(|s| s.to_ascii_lowercase())
        .unwrap_or_default();
    let country = parts
        .next()
        .map(|s| s.to_ascii_lowercase())
        .unwrap_or_default();
    let canonical = if country.is_empty() {
        language.clone()
    } else {
        format!("{language}-{}", country.to_ascii_uppercase())
    };
    (canonical, language, country)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_remote(id: &str, version: i32) -> RemoteExtension {
        RemoteExtension {
            id: id.to_owned(),
            name: "Truyen A".to_owned(),
            author: "Dev".to_owned(),
            version,
            source: "https://example.org".to_owned(),
            host: "example.org".to_owned(),
            icon: String::new(),
            description: String::new(),
            ext_type: ExtensionType::Novel,
            locale: "zh-CN".to_owned(),
            language: "zh".to_owned(),
            country: "cn".to_owned(),
            is_nsfw: false,
            path: "https://repo.test/ext/a.zip".to_owned(),
            repo_url: "https://repo.test/plugin.json".to_owned(),
        }
    }

    #[test]
    fn parses_repo_catalog_and_resolves_relative_urls() {
        let json = r#"{
            "metadata": { "name": "Kho Thu", "author": "Bao", "description": "Catalog demo" },
            "data": [
                {
                    "name": "Ext Mot",
                    "path": "plugins/ext1.zip",
                    "icon": "./icons/ext1.png",
                    "version": 4,
                    "source": "https://SiteOne.com/list",
                    "type": "comic",
                    "locale": "zh_CN",
                    "tag": "nsfw",
                    "author": "A"
                }
            ]
        }"#;
        let parsed = parse_repo_catalog("https://mirror.example/api/plugin.json", json)
            .expect("parse catalog");
        assert_eq!(parsed.repo_name, "Kho Thu");
        assert_eq!(parsed.items.len(), 1);
        let item = &parsed.items[0];
        assert_eq!(item.path, "https://mirror.example/api/plugins/ext1.zip");
        assert_eq!(item.icon, "https://mirror.example/api/icons/ext1.png");
        assert_eq!(item.host, "siteone.com");
        assert_eq!(item.ext_type, ExtensionType::Comic);
        assert_eq!(item.locale, "zh-CN");
        assert_eq!(item.language, "zh");
        assert_eq!(item.country, "cn");
        assert!(item.is_nsfw);
    }

    #[test]
    fn compute_updates_only_triggers_when_remote_version_is_strictly_greater() {
        let ext_id = deterministic_extension_id("https://repo.test/ext/a.zip");
        let installed = vec![InstalledExtension {
            id: ext_id.clone(),
            name: "Truyen A".to_owned(),
            author: "Dev".to_owned(),
            version: 2,
            source: "https://example.org".to_owned(),
            host: "example.org".to_owned(),
            regexp: "example\\.org/book/".to_owned(),
            icon_data_url: String::new(),
            description: String::new(),
            locale: "zh-CN".to_owned(),
            ext_type: ExtensionType::Novel,
            is_nsfw: false,
            is_local: false,
            is_encrypted: false,
            pinned: true,
            source_url: "https://repo.test/ext/a.zip".to_owned(),
            repo_url: "https://repo.test/plugin.json".to_owned(),
            scripts: Default::default(),
            config_schema: Default::default(),
            actions: Default::default(),
            user_config: Default::default(),
            local_storage: Default::default(),
            created_at: 100,
            updated_at: 100,
        }];

        // Remote v1 <= installed v2 -> không báo update
        let updates_lower = compute_extension_updates(&installed, &[sample_remote(&ext_id, 1)]);
        assert!(updates_lower.is_empty());

        // Remote v2 == installed v2 -> không báo update
        let updates_same = compute_extension_updates(&installed, &[sample_remote(&ext_id, 2)]);
        assert!(updates_same.is_empty());

        // Remote v3 > installed v2 -> báo đúng 1 update
        let updates_higher = compute_extension_updates(&installed, &[sample_remote(&ext_id, 3)]);
        assert_eq!(updates_higher.len(), 1);
        assert_eq!(updates_higher[0].installed_version, 2);
        assert_eq!(updates_higher[0].remote_version, 3);

        // Match URL hoạt động đúng
        assert!(match_extension_for_url(&installed, "https://sub.example.org/book/1").is_some());
        assert!(match_extension_for_url(&installed, "https://other.org/book/1").is_none());
    }
}
