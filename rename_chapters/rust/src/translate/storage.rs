use std::collections::{BTreeMap, HashMap};
use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tempfile::NamedTempFile;

use crate::CoreError;
use crate::translate::dichngay::{TranslateBatchConfig, TranslationHttpTransport};
use crate::translate::name_set::{
    NameRightSuggestion, NameSuggestionDicts, build_name_right_suggestions, normalize_name_set,
    normalize_name_sets_collection,
};
use crate::translate::pipeline::{
    TranslationDetailedResult, TranslationMemoryStore, TranslationSignatureOptions,
    TranslationUnitMapRow, chapter_trans_signature, normalize_translation_mode, sha1_hex,
    translate_detailed, translate_detailed_with_unit_reuse, translation_signature,
};
use crate::translate::selection::{
    SelectionNameMapResult, SelectionSourceSegmentResult, map_selection_to_name_source,
    map_selection_to_source_segment,
};
use crate::translate::text::{
    HvIncrementalSuggestion, build_hanviet_from_map, build_incremental_hv_suggestions,
    contains_cjk, contains_name_split_delimiter, is_cjk_char, normalize_newlines,
    normalize_translation_cache_source,
};

pub const TRANSLATION_STORE_SCHEMA_VERSION: u32 = 1;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NameSetState {
    pub sets: BTreeMap<String, BTreeMap<String, String>>,
    pub active_set: String,
    pub version: u32,
}

impl Default for NameSetState {
    fn default() -> Self {
        let mut sets = BTreeMap::new();
        sets.insert("Mặc định".to_owned(), BTreeMap::new());
        Self {
            sets,
            active_set: "Mặc định".to_owned(),
            version: 1,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VpSetState {
    pub entries: BTreeMap<String, String>,
    pub version: u32,
}

impl Default for VpSetState {
    fn default() -> Self {
        Self {
            entries: BTreeMap::new(),
            version: 1,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct GlobalDictsState {
    pub name: BTreeMap<String, String>,
    pub vp: BTreeMap<String, String>,
    pub version: u32,
}

impl Default for GlobalDictsState {
    fn default() -> Self {
        Self {
            name: BTreeMap::new(),
            vp: BTreeMap::new(),
            version: 1,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct BookNameHistoryRow {
    pub event_id: String,
    pub book_id: String,
    pub set_name: String,
    pub action_type: String,
    pub source_text: String,
    pub target_text: String,
    pub previous_target_text: String,
    pub origin: String,
    pub chapter_id: String,
    pub created_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TranslationMemoryRow {
    pub source_hash: String,
    pub source_text: String,
    pub mode: String,
    pub trans_sig: String,
    pub translated_text: String,
    pub hit_count: u64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ChapterTranslationCacheRow {
    pub chapter_id: String,
    pub trans_sig: String,
    pub translation_mode: String,
    pub translated_text: String,
    pub unit_map: Vec<TranslationUnitMapRow>,
    pub name_set_snapshot: BTreeMap<String, String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TranslationCacheStats {
    pub translation_memory_count: usize,
    pub translation_unit_map_count: usize,
    pub chapter_cache_count: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ClearTranslationCacheOutcome {
    pub tm_deleted: usize,
    pub unit_map_deleted: usize,
    pub chapter_cache_deleted: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NameSuggestItem {
    pub index: usize,
    pub source_text: String,
    pub han_viet: String,
    pub google_translate_url: String,
    pub google_search_url: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NameSuggestResponse {
    pub source_text: String,
    pub han_viet_raw: String,
    pub items: Vec<NameSuggestItem>,
    pub right_items: Vec<NameRightSuggestion>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PersistedNameWorkspace {
    version: u32,
    global_name_sets: NameSetState,
    #[serde(default)]
    book_name_sets: BTreeMap<String, NameSetState>,
    #[serde(default)]
    book_vp_sets: BTreeMap<String, VpSetState>,
    #[serde(default)]
    global_dicts: GlobalDictsState,
    #[serde(default)]
    book_name_history: BTreeMap<String, Vec<BookNameHistoryRow>>,
    #[serde(default)]
    server_config: TranslateBatchConfig,
}

impl Default for PersistedNameWorkspace {
    fn default() -> Self {
        Self {
            version: TRANSLATION_STORE_SCHEMA_VERSION,
            global_name_sets: NameSetState::default(),
            book_name_sets: BTreeMap::new(),
            book_vp_sets: BTreeMap::new(),
            global_dicts: GlobalDictsState::default(),
            book_name_history: BTreeMap::new(),
            server_config: TranslateBatchConfig::default(),
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct PersistedMemoryFile {
    version: u32,
    /// Khóa: `"{mode}|{trans_sig}|{source_hash}"`.
    entries: BTreeMap<String, TranslationMemoryRow>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct PersistedChaptersFile {
    version: u32,
    /// Khóa: `"{chapter_id}|{translation_mode}"` lưu bản dịch chương gần nhất kèm `unit_map` và `name_set_snapshot`.
    latest_by_chapter_mode: BTreeMap<String, ChapterTranslationCacheRow>,
}

/// Kho lưu trữ bền vững, atomic cho Translation Memory, Unit Map, Name riêng và VP riêng
/// dùng chung trên Windows, Linux và Android.
pub struct TranslationStore {
    directory: PathBuf,
}

impl TranslationStore {
    pub fn new(directory: impl Into<PathBuf>) -> Self {
        Self {
            directory: directory.into(),
        }
    }

    pub fn directory(&self) -> &Path {
        &self.directory
    }

    fn lock(&self) -> Result<File, CoreError> {
        fs::create_dir_all(&self.directory)?;
        let lock = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(false)
            .open(self.directory.join("translation.lock"))?;
        lock.lock()?;
        Ok(lock)
    }

    fn workspace_path(&self) -> PathBuf {
        self.directory.join("translation-workspace.json")
    }

    fn memory_path(&self) -> PathBuf {
        self.directory.join("translation-memory.json")
    }

    fn chapters_path(&self) -> PathBuf {
        self.directory.join("translation-chapters.json")
    }

    fn load_workspace(&self) -> Result<PersistedNameWorkspace, CoreError> {
        let path = self.workspace_path();
        if !path.exists() {
            return Ok(PersistedNameWorkspace::default());
        }
        let bytes = fs::read(&path)?;
        Ok(serde_json::from_slice(&bytes)?)
    }

    fn save_workspace(&self, ws: &PersistedNameWorkspace) -> Result<(), CoreError> {
        atomic_write_json(&self.directory, &self.workspace_path(), ws)
    }

    fn load_memory_file(&self) -> Result<PersistedMemoryFile, CoreError> {
        let path = self.memory_path();
        if !path.exists() {
            return Ok(PersistedMemoryFile {
                version: TRANSLATION_STORE_SCHEMA_VERSION,
                entries: BTreeMap::new(),
            });
        }
        let bytes = fs::read(&path)?;
        Ok(serde_json::from_slice(&bytes)?)
    }

    fn save_memory_file(&self, mem: &PersistedMemoryFile) -> Result<(), CoreError> {
        atomic_write_json(&self.directory, &self.memory_path(), mem)
    }

    fn load_chapters_file(&self) -> Result<PersistedChaptersFile, CoreError> {
        let path = self.chapters_path();
        if !path.exists() {
            return Ok(PersistedChaptersFile {
                version: TRANSLATION_STORE_SCHEMA_VERSION,
                latest_by_chapter_mode: BTreeMap::new(),
            });
        }
        let bytes = fs::read(&path)?;
        Ok(serde_json::from_slice(&bytes)?)
    }

    fn save_chapters_file(&self, ch: &PersistedChaptersFile) -> Result<(), CoreError> {
        atomic_write_json(&self.directory, &self.chapters_path(), ch)
    }

    pub fn get_server_config(&self) -> Result<TranslateBatchConfig, CoreError> {
        let _guard = self.lock()?;
        let ws = self.load_workspace()?;
        Ok(ws.server_config)
    }

    pub fn set_server_config(
        &self,
        mut cfg: TranslateBatchConfig,
    ) -> Result<TranslateBatchConfig, CoreError> {
        let _guard = self.lock()?;
        if cfg.server_url.trim().is_empty() {
            cfg.server_url = crate::translate::dichngay::DEFAULT_DICHNGAY_URL.to_owned();
        } else {
            cfg.server_url = cfg.server_url.trim().to_owned();
        }
        cfg.max_chars = cfg.max_chars.clamp(500, 9000);
        cfg.timeout_sec = cfg.timeout_sec.clamp(5, 180);
        if cfg.target_lang.trim().is_empty() {
            cfg.target_lang = "vi".to_owned();
        }
        let mut ws = self.load_workspace()?;
        ws.server_config = cfg.clone();
        self.save_workspace(&ws)?;
        Ok(cfg)
    }

    pub fn get_name_set_state(&self, book_id: Option<&str>) -> Result<NameSetState, CoreError> {
        let _guard = self.lock()?;
        let ws = self.load_workspace()?;
        Ok(resolve_name_set_state_from_ws(&ws, book_id))
    }

    pub fn set_name_set_state(
        &self,
        sets: BTreeMap<String, BTreeMap<String, String>>,
        active_set: Option<&str>,
        bump_version: bool,
        book_id: Option<&str>,
        origin: Option<&str>,
        chapter_id: Option<&str>,
    ) -> Result<NameSetState, CoreError> {
        let _guard = self.lock()?;
        let mut ws = self.load_workspace()?;
        let current = resolve_name_set_state_from_ws(&ws, book_id);
        let mut normalized_sets = normalize_name_sets_collection(&sets);
        let mut desired_active = active_set
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .unwrap_or(&current.active_set)
            .to_owned();
        if normalized_sets.is_empty() {
            let fallback = if desired_active.is_empty() {
                "Mặc định".to_owned()
            } else {
                desired_active.clone()
            };
            normalized_sets.insert(fallback, BTreeMap::new());
        }
        if !normalized_sets.contains_key(&desired_active) {
            desired_active = normalized_sets
                .keys()
                .next()
                .cloned()
                .unwrap_or_else(|| "Mặc định".to_owned());
        }
        let next_version = if bump_version {
            current.version.saturating_add(1).max(1)
        } else {
            current.version.max(1)
        };
        let next_state = NameSetState {
            sets: normalized_sets,
            active_set: desired_active,
            version: next_version,
        };

        if let Some(bid) = book_id.map(str::trim).filter(|s| !s.is_empty()) {
            log_name_set_history_diff(
                &mut ws,
                bid,
                &current,
                &next_state,
                origin.unwrap_or("reader_edit"),
                chapter_id.unwrap_or(""),
            );
            ws.book_name_sets.insert(bid.to_owned(), next_state.clone());
        } else {
            ws.global_name_sets = next_state.clone();
        }
        self.save_workspace(&ws)?;
        Ok(next_state)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn update_name_set_entry(
        &self,
        source: &str,
        target: &str,
        set_name: Option<&str>,
        delete: bool,
        book_id: Option<&str>,
        origin: Option<&str>,
        chapter_id: Option<&str>,
    ) -> Result<NameSetState, CoreError> {
        let source_key = source.trim();
        if source_key.is_empty() {
            return Err("Thiếu source cho entry name set.".into());
        }
        if contains_name_split_delimiter(source_key) {
            return Err("Tên gốc không được chứa dấu tách câu (.,;:!? xuống dòng).".into());
        }
        let target_value = target.trim();
        if !target_value.is_empty() && contains_name_split_delimiter(target_value) {
            return Err("Tên dịch không được chứa dấu tách câu (.,;:!? xuống dòng).".into());
        }

        let current = self.get_name_set_state(book_id)?;
        let mut sets = normalize_name_sets_collection(&current.sets);
        let mut active = set_name
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .unwrap_or(&current.active_set)
            .to_owned();
        if active.is_empty() {
            active = "Mặc định".to_owned();
        }
        let entry_map = sets.entry(active.clone()).or_default();
        if delete || target_value.is_empty() {
            entry_map.remove(source_key);
        } else {
            entry_map.insert(source_key.to_owned(), target_value.to_owned());
        }

        self.set_name_set_state(sets, Some(&active), true, book_id, origin, chapter_id)
    }

    pub fn list_book_name_history(
        &self,
        book_id: &str,
        limit: usize,
    ) -> Result<Vec<BookNameHistoryRow>, CoreError> {
        let _guard = self.lock()?;
        let bid = book_id.trim();
        if bid.is_empty() {
            return Ok(Vec::new());
        }
        let ws = self.load_workspace()?;
        let Some(rows) = ws.book_name_history.get(bid) else {
            return Ok(Vec::new());
        };
        let safe_limit = limit.clamp(1, 1000);
        let mut out: Vec<BookNameHistoryRow> =
            rows.iter().rev().take(safe_limit).cloned().collect();
        out.sort_by(|a, b| {
            b.created_at
                .cmp(&a.created_at)
                .then_with(|| b.event_id.cmp(&a.event_id))
        });
        Ok(out)
    }

    pub fn get_book_vp_set(&self, book_id: &str) -> Result<VpSetState, CoreError> {
        let _guard = self.lock()?;
        let bid = book_id.trim();
        if bid.is_empty() {
            return Err("Thiếu book_id cho VP riêng.".into());
        }
        let ws = self.load_workspace()?;
        Ok(ws.book_vp_sets.get(bid).cloned().unwrap_or_default())
    }

    pub fn update_book_vp_entry(
        &self,
        book_id: &str,
        source: &str,
        target: &str,
        delete: bool,
    ) -> Result<VpSetState, CoreError> {
        let _guard = self.lock()?;
        let bid = book_id.trim();
        if bid.is_empty() {
            return Err("Thiếu book_id cho VP riêng.".into());
        }
        let source_key = source.trim();
        if source_key.is_empty() {
            return Err("Thiếu source cho VP riêng.".into());
        }
        let mut ws = self.load_workspace()?;
        let mut state = ws.book_vp_sets.get(bid).cloned().unwrap_or_default();
        let target_val = target.trim();
        if delete || target_val.is_empty() {
            state.entries.remove(source_key);
        } else {
            state
                .entries
                .insert(source_key.to_owned(), target_val.to_owned());
        }
        state.entries = normalize_name_set(&state.entries);
        state.version = state.version.saturating_add(1).max(1);
        ws.book_vp_sets.insert(bid.to_owned(), state.clone());
        self.save_workspace(&ws)?;
        Ok(state)
    }

    pub fn get_global_dicts(&self) -> Result<GlobalDictsState, CoreError> {
        let _guard = self.lock()?;
        let ws = self.load_workspace()?;
        Ok(ws.global_dicts)
    }

    pub fn set_global_dicts(
        &self,
        name: Option<BTreeMap<String, String>>,
        vp: Option<BTreeMap<String, String>>,
    ) -> Result<GlobalDictsState, CoreError> {
        let _guard = self.lock()?;
        let mut ws = self.load_workspace()?;
        if let Some(n) = name {
            ws.global_dicts.name = normalize_name_set(&n);
        }
        if let Some(v) = vp {
            ws.global_dicts.vp = normalize_name_set(&v);
        }
        ws.global_dicts.version = ws.global_dicts.version.saturating_add(1).max(1);
        let out = ws.global_dicts.clone();
        self.save_workspace(&ws)?;
        Ok(out)
    }

    /// Tra cứu lô `translation_memory` theo `(mode, trans_sig, source_hash)` và tăng `hit_count`.
    pub fn get_translation_memory_batch(
        &self,
        source_texts: &[String],
        mode: &str,
        trans_sig: &str,
    ) -> Result<HashMap<String, String>, CoreError> {
        let _guard = self.lock()?;
        let mode_norm = normalize_translation_mode(mode);
        let sig = trans_sig.trim();
        if sig.is_empty() || source_texts.is_empty() {
            return Ok(HashMap::new());
        }
        let mut mem = self.load_memory_file()?;
        let now = now_iso_string();
        let mut out = HashMap::new();
        let mut dirty = false;

        for raw in source_texts {
            let key = normalize_translation_cache_source(raw);
            if key.is_empty() || out.contains_key(&key) {
                continue;
            }
            let source_hash = sha1_hex(key.as_bytes());
            let map_key = format!("{mode_norm}|{sig}|{source_hash}");
            if let Some(row) = mem.entries.get_mut(&map_key)
                && normalize_translation_cache_source(&row.source_text) == key
                && !row.translated_text.is_empty()
            {
                out.insert(key, normalize_newlines(&row.translated_text));
                row.hit_count = row.hit_count.saturating_add(1);
                row.updated_at = now.clone();
                dirty = true;
            }
        }
        if dirty {
            self.save_memory_file(&mem)?;
        }
        Ok(out)
    }

    /// Lưu lô `translation_memory` theo `(source_hash, mode, trans_sig)`.
    pub fn set_translation_memory_batch(
        &self,
        entries: &[(String, String)],
        mode: &str,
        trans_sig: &str,
    ) -> Result<usize, CoreError> {
        let _guard = self.lock()?;
        let mode_norm = normalize_translation_mode(mode);
        let sig = trans_sig.trim();
        if sig.is_empty() || entries.is_empty() {
            return Ok(0);
        }
        let mut mem = self.load_memory_file()?;
        let now = now_iso_string();
        let mut count = 0usize;

        for (src, tr) in entries {
            let source_key = normalize_translation_cache_source(src);
            let translated = normalize_newlines(tr);
            if source_key.is_empty() || translated.is_empty() {
                continue;
            }
            let source_hash = sha1_hex(source_key.as_bytes());
            let map_key = format!("{mode_norm}|{sig}|{source_hash}");
            if let Some(existing) = mem.entries.get_mut(&map_key) {
                existing.source_text = source_key;
                existing.translated_text = translated;
                existing.updated_at = now.clone();
            } else {
                mem.entries.insert(
                    map_key,
                    TranslationMemoryRow {
                        source_hash,
                        source_text: source_key,
                        mode: mode_norm.to_owned(),
                        trans_sig: sig.to_owned(),
                        translated_text: translated,
                        hit_count: 0,
                        created_at: now.clone(),
                        updated_at: now.clone(),
                    },
                );
            }
            count += 1;
        }
        if count > 0 {
            self.save_memory_file(&mem)?;
        }
        Ok(count)
    }

    pub fn save_chapter_translation_cache(
        &self,
        chapter_id: &str,
        trans_sig: &str,
        translation_mode: &str,
        translated_text: &str,
        unit_map: Vec<TranslationUnitMapRow>,
        name_set_snapshot: BTreeMap<String, String>,
    ) -> Result<usize, CoreError> {
        let _guard = self.lock()?;
        let cid = chapter_id.trim();
        let sig = trans_sig.trim();
        let mode = normalize_translation_mode(translation_mode);
        if cid.is_empty() || sig.is_empty() {
            return Ok(0);
        }
        let mut ch = self.load_chapters_file()?;
        let now = now_iso_string();
        let unit_count = unit_map.len();
        let key = format!("{cid}|{mode}");
        ch.latest_by_chapter_mode.insert(
            key,
            ChapterTranslationCacheRow {
                chapter_id: cid.to_owned(),
                trans_sig: sig.to_owned(),
                translation_mode: mode.to_owned(),
                translated_text: normalize_newlines(translated_text),
                unit_map,
                name_set_snapshot: normalize_name_set(&name_set_snapshot),
                created_at: now.clone(),
                updated_at: now,
            },
        );
        self.save_chapters_file(&ch)?;
        Ok(unit_count)
    }

    pub fn get_chapter_translation_cache(
        &self,
        chapter_id: &str,
        translation_mode: &str,
    ) -> Result<Option<ChapterTranslationCacheRow>, CoreError> {
        let _guard = self.lock()?;
        let cid = chapter_id.trim();
        let mode = normalize_translation_mode(translation_mode);
        if cid.is_empty() {
            return Ok(None);
        }
        let ch = self.load_chapters_file()?;
        let key = format!("{cid}|{mode}");
        Ok(ch.latest_by_chapter_mode.get(&key).cloned())
    }

    pub fn get_translation_unit_map(
        &self,
        chapter_id: &str,
        trans_sig: &str,
        translation_mode: &str,
    ) -> Result<Vec<TranslationUnitMapRow>, CoreError> {
        let Some(row) = self.get_chapter_translation_cache(chapter_id, translation_mode)? else {
            return Ok(Vec::new());
        };
        if row.trans_sig == trans_sig.trim() {
            Ok(row.unit_map)
        } else {
            Ok(Vec::new())
        }
    }

    pub fn get_translation_cache_stats(&self) -> Result<TranslationCacheStats, CoreError> {
        let _guard = self.lock()?;
        let mem = self.load_memory_file()?;
        let ch = self.load_chapters_file()?;
        let unit_count: usize = ch
            .latest_by_chapter_mode
            .values()
            .map(|r| r.unit_map.len())
            .sum();
        Ok(TranslationCacheStats {
            translation_memory_count: mem.entries.len(),
            translation_unit_map_count: unit_count,
            chapter_cache_count: ch.latest_by_chapter_mode.len(),
        })
    }

    /// Xóa riêng cache dịch của chương hiện tại (phục vụ nút `Tải lại chương`, không đụng `translation_memory` toàn cục).
    pub fn clear_chapter_translated_cache(&self, chapter_id: &str) -> Result<usize, CoreError> {
        let _guard = self.lock()?;
        let cid = chapter_id.trim();
        if cid.is_empty() {
            return Ok(0);
        }
        let mut ch = self.load_chapters_file()?;
        let prefix = format!("{cid}|");
        let before = ch.latest_by_chapter_mode.len();
        ch.latest_by_chapter_mode
            .retain(|k, _| !k.starts_with(&prefix));
        let removed = before.saturating_sub(ch.latest_by_chapter_mode.len());
        if removed > 0 {
            self.save_chapters_file(&ch)?;
        }
        Ok(removed)
    }

    /// Xóa toàn bộ cache dịch chương + translation memory + unit map (`POST /api/library/cache/clear`).
    pub fn clear_all_translated_cache(&self) -> Result<ClearTranslationCacheOutcome, CoreError> {
        let _guard = self.lock()?;
        let mut mem = self.load_memory_file()?;
        let mut ch = self.load_chapters_file()?;
        let tm_deleted = mem.entries.len();
        let unit_map_deleted: usize = ch
            .latest_by_chapter_mode
            .values()
            .map(|r| r.unit_map.len())
            .sum();
        let chapter_cache_deleted = ch.latest_by_chapter_mode.len();

        mem.entries.clear();
        ch.latest_by_chapter_mode.clear();
        self.save_memory_file(&mem)?;
        self.save_chapters_file(&ch)?;

        Ok(ClearTranslationCacheOutcome {
            tm_deleted,
            unit_map_deleted,
            chapter_cache_deleted,
        })
    }

    pub fn effective_signature_options_for_book(
        &self,
        book_id: Option<&str>,
        mode: &str,
        name_set_override: Option<BTreeMap<String, String>>,
    ) -> Result<TranslationSignatureOptions, CoreError> {
        let mode_norm = normalize_translation_mode(mode);
        let state = self.get_name_set_state(book_id)?;
        let active_entries = name_set_override.unwrap_or_else(|| {
            state
                .sets
                .get(&state.active_set)
                .cloned()
                .unwrap_or_default()
        });
        let mut effective = if matches!(
            mode_norm,
            "server" | "tm_translate_beta" | "google_translate"
        ) {
            self.get_global_dicts()?.name
        } else {
            BTreeMap::new()
        };
        for (k, v) in normalize_name_set(&active_entries) {
            effective.insert(k, v);
        }
        let vp_set = if let Some(bid) = book_id.map(str::trim).filter(|s| !s.is_empty()) {
            self.get_book_vp_set(bid)?.entries
        } else {
            BTreeMap::new()
        };
        Ok(TranslationSignatureOptions {
            mode: mode_norm.to_owned(),
            active_set_name: state.active_set,
            name_set_version: state.version,
            effective_name_set: effective,
            vp_set,
            source_lang_override: String::new(),
        })
    }

    /// Dịch nội dung chương có tận dụng:
    /// 1) Cache chương đã dịch khớp `current_sig`
    /// 2) `translate_detailed_with_unit_reuse` khi người dùng vừa thêm/sửa Name riêng trong chương
    /// 3) `translation_memory` dùng chung toàn kho trước khi gọi `TranslationHttpTransport`.
    pub fn translate_chapter_content(
        &self,
        book_id: Option<&str>,
        chapter_id: &str,
        raw_text: &str,
        mode: &str,
        force_reload: bool,
        mut transport: Option<&mut dyn TranslationHttpTransport>,
    ) -> Result<TranslationDetailedResult, CoreError> {
        if force_reload {
            let _ = self.clear_chapter_translated_cache(chapter_id);
        }
        let mode_norm = normalize_translation_mode(mode);
        let sig_opts = self.effective_signature_options_for_book(book_id, mode_norm, None)?;
        let base_sig = translation_signature(&sig_opts);
        let current_sig = chapter_trans_signature(&base_sig, 1);
        let batch_cfg = self.get_server_config()?;

        if !force_reload
            && let Some(cached) = self.get_chapter_translation_cache(chapter_id, mode_norm)?
        {
            if cached.trans_sig == current_sig && !cached.unit_map.is_empty() {
                return Ok(TranslationDetailedResult {
                    source_text: raw_text.trim().to_owned(),
                    processed_text: String::new(),
                    translated_with_placeholders: cached.translated_text.clone(),
                    translated: cached.translated_text,
                    mode: mode_norm.to_owned(),
                    unit_map: cached.unit_map,
                    token_map: Vec::new(),
                    name_map: crate::translate::pipeline::NameMapSummary {
                        active_set: sig_opts.active_set_name,
                        version: sig_opts.name_set_version,
                        size: sig_opts.effective_name_set.len(),
                        placeholders: Vec::new(),
                        hits: Vec::new(),
                    },
                    hanviet_source: String::new(),
                    trans_sig: current_sig,
                    cache_hit_count: 0,
                    missing_count: 0,
                    stored_count: 0,
                });
            }

            if mode_norm == "server"
                && !cached.translated_text.is_empty()
                && !cached.unit_map.is_empty()
            {
                let mut tm_bridge = StoreTmBridge { store: self };
                let reborrowed = transport
                    .as_mut()
                    .map(|t| &mut **t as &mut dyn TranslationHttpTransport);
                if let Some(mut reused) = translate_detailed_with_unit_reuse(
                    raw_text,
                    &cached.translated_text,
                    &cached.unit_map,
                    &cached.name_set_snapshot,
                    &sig_opts,
                    &batch_cfg,
                    Some(&mut tm_bridge),
                    reborrowed,
                ) {
                    reused.trans_sig = current_sig.clone();
                    self.save_chapter_translation_cache(
                        chapter_id,
                        &current_sig,
                        mode_norm,
                        &reused.translated,
                        reused.unit_map.clone(),
                        sig_opts.effective_name_set.clone(),
                    )?;
                    return Ok(reused);
                }
            }
        }

        let mut tm_bridge = StoreTmBridge { store: self };
        let mut detail = translate_detailed(
            raw_text,
            &sig_opts,
            &batch_cfg,
            Some(&mut tm_bridge),
            transport,
        );
        detail.trans_sig = current_sig.clone();
        self.save_chapter_translation_cache(
            chapter_id,
            &current_sig,
            mode_norm,
            &detail.translated,
            detail.unit_map.clone(),
            sig_opts.effective_name_set,
        )?;
        Ok(detail)
    }

    /// Map đoạn bôi đen của người dùng trong chương sang cặp Name gốc ↔ Việt (`selection-map`).
    #[allow(clippy::too_many_arguments)]
    pub fn map_chapter_selection_to_name(
        &self,
        book_id: Option<&str>,
        chapter_id: &str,
        raw_text: &str,
        translated_text: &str,
        selected_text: &str,
        start_offset: isize,
        end_offset: isize,
        translation_mode: &str,
        hanviet_map: Option<&HashMap<String, String>>,
    ) -> Result<SelectionNameMapResult, CoreError> {
        let mode_norm = normalize_translation_mode(translation_mode);
        let sig_opts = self.effective_signature_options_for_book(book_id, mode_norm, None)?;
        let cached = self.get_chapter_translation_cache(chapter_id, mode_norm)?;
        let (unit_map, effective_names) = if let Some(c) = cached {
            let names = if c.name_set_snapshot.is_empty() {
                sig_opts.effective_name_set
            } else {
                c.name_set_snapshot
            };
            (c.unit_map, names)
        } else {
            (Vec::new(), sig_opts.effective_name_set)
        };

        Ok(map_selection_to_name_source(
            raw_text,
            translated_text,
            selected_text,
            start_offset,
            end_offset,
            &effective_names,
            &unit_map,
            &[],
            mode_norm,
            hanviet_map,
        ))
    }

    #[allow(clippy::too_many_arguments)]
    pub fn map_chapter_selection_to_source(
        &self,
        chapter_id: &str,
        raw_text: &str,
        translated_text: &str,
        selected_text: &str,
        start_offset: isize,
        end_offset: isize,
        translation_mode: &str,
    ) -> Result<SelectionSourceSegmentResult, CoreError> {
        let mode_norm = normalize_translation_mode(translation_mode);
        let unit_map = self
            .get_chapter_translation_cache(chapter_id, mode_norm)?
            .map(|c| c.unit_map)
            .unwrap_or_default();
        Ok(map_selection_to_source_segment(
            raw_text,
            translated_text,
            selected_text,
            start_offset,
            end_offset,
            &unit_map,
            &[],
            mode_norm,
        ))
    }

    /// Gợi ý Name theo Hán-Việt viết hoa tăng dần (bảng trái) và từ điển Name/VP hiện có (bảng phải)
    /// theo đúng `POST /api/name-suggest` trong `reader_backend/routes/misc.py`.
    #[allow(clippy::too_many_arguments)]
    pub fn build_name_suggestions(
        &self,
        source_text: &str,
        book_id: Option<&str>,
        set_name: Option<&str>,
        prefer_kind: &str,
        prefer_scope: &str,
        hanviet_map: Option<&HashMap<String, String>>,
        transport: Option<&mut dyn TranslationHttpTransport>,
    ) -> Result<NameSuggestResponse, CoreError> {
        let cleaned_source = normalize_newlines(source_text);
        if cleaned_source.is_empty() {
            return Err("Thiếu source_text để gợi ý name.".into());
        }
        if !contains_cjk(&cleaned_source) {
            return Err("source_text phải chứa chữ Trung.".into());
        }
        let source_cjk: String = cleaned_source
            .chars()
            .filter(|&ch| is_cjk_char(ch))
            .collect();

        let state = self.get_name_set_state(book_id)?;
        let active_key = set_name
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .unwrap_or(&state.active_set);
        let personal_name = state.sets.get(active_key).cloned().unwrap_or_default();
        let personal_vp = if let Some(bid) = book_id.map(str::trim).filter(|s| !s.is_empty()) {
            self.get_book_vp_set(bid)?.entries
        } else {
            BTreeMap::new()
        };
        let global_dicts = self.get_global_dicts()?;

        let mut hv_text = String::new();
        if let Some(http) = transport {
            let mut cfg = self.get_server_config()?;
            cfg.target_lang = "hv".to_owned();
            let list = crate::translate::dichngay::translate_text_chunks(
                std::slice::from_ref(&source_cjk),
                &cfg,
                http,
            );
            if let Some(first) = list.first() {
                let trimmed = first.trim();
                if !trimmed.is_empty() && !trimmed.starts_with("[Lỗi") {
                    hv_text = trimmed.to_owned();
                }
            }
        }
        if hv_text.is_empty()
            && let Some(hv_map) = hanviet_map
        {
            let mapped = build_hanviet_from_map(&source_cjk, hv_map);
            if !mapped.trim().is_empty() {
                hv_text = mapped;
            }
        }
        if hv_text.is_empty() {
            hv_text = source_cjk.clone();
        }

        let inc_rows: Vec<HvIncrementalSuggestion> =
            build_incremental_hv_suggestions(&source_cjk, &hv_text);
        let mut items = Vec::with_capacity(inc_rows.len());
        for (idx, row) in inc_rows.into_iter().enumerate() {
            let zh = row.source_text.trim().to_owned();
            let hv = row.han_viet.trim().to_owned();
            if zh.is_empty() || hv.is_empty() {
                continue;
            }
            let encoded_zh = crate::upload::html::percent_encode_component(&zh);
            items.push(NameSuggestItem {
                index: idx + 1,
                source_text: zh,
                han_viet: hv,
                google_translate_url: format!(
                    "https://translate.google.com/?sl=zh-CN&tl=vi&text={encoded_zh}&op=translate"
                ),
                google_search_url: format!("https://www.google.com/search?q={encoded_zh}"),
            });
        }

        let dicts = NameSuggestionDicts {
            personal_name,
            personal_vp,
            global_name: global_dicts.name,
            global_vp: global_dicts.vp,
        };
        let right_items = build_name_right_suggestions(
            &cleaned_source,
            &hv_text,
            &dicts,
            prefer_kind,
            prefer_scope,
        );

        Ok(NameSuggestResponse {
            source_text: cleaned_source,
            han_viet_raw: hv_text,
            items,
            right_items,
        })
    }
}

struct StoreTmBridge<'a> {
    store: &'a TranslationStore,
}

impl TranslationMemoryStore for StoreTmBridge<'_> {
    fn lookup_batch(
        &mut self,
        source_texts: &[String],
        mode: &str,
        trans_sig: &str,
    ) -> HashMap<String, String> {
        self.store
            .get_translation_memory_batch(source_texts, mode, trans_sig)
            .unwrap_or_default()
    }

    fn store_batch(&mut self, entries: &[(String, String)], mode: &str, trans_sig: &str) -> usize {
        self.store
            .set_translation_memory_batch(entries, mode, trans_sig)
            .unwrap_or(0)
    }
}

fn resolve_name_set_state_from_ws(
    ws: &PersistedNameWorkspace,
    book_id: Option<&str>,
) -> NameSetState {
    let raw = if let Some(bid) = book_id.map(str::trim).filter(|s| !s.is_empty()) {
        ws.book_name_sets.get(bid).unwrap_or(&ws.global_name_sets)
    } else {
        &ws.global_name_sets
    };
    let sets = normalize_name_sets_collection(&raw.sets);
    let active_set = if sets.contains_key(&raw.active_set) {
        raw.active_set.clone()
    } else {
        sets.keys()
            .next()
            .cloned()
            .unwrap_or_else(|| "Mặc định".to_owned())
    };
    NameSetState {
        sets,
        active_set,
        version: raw.version.max(1),
    }
}

fn log_name_set_history_diff(
    ws: &mut PersistedNameWorkspace,
    book_id: &str,
    current: &NameSetState,
    next: &NameSetState,
    origin: &str,
    chapter_id: &str,
) {
    let created_at = now_iso_string();
    let list = ws.book_name_history.entry(book_id.to_owned()).or_default();
    let mut seq = list.len() + 1;
    let mut push_event = |set_name: &str,
                          action_type: &str,
                          source_text: &str,
                          target_text: &str,
                          previous_target_text: &str| {
        list.push(BookNameHistoryRow {
            event_id: format!("bnh_{}_{}", now_epoch_ms(), seq),
            book_id: book_id.to_owned(),
            set_name: set_name.to_owned(),
            action_type: action_type.to_owned(),
            source_text: source_text.to_owned(),
            target_text: target_text.to_owned(),
            previous_target_text: previous_target_text.to_owned(),
            origin: origin.to_owned(),
            chapter_id: chapter_id.to_owned(),
            created_at: created_at.clone(),
        });
        seq += 1;
    };

    for set_name in next.sets.keys() {
        if !current.sets.contains_key(set_name) {
            push_event(set_name, "set_added", "", "", "");
        }
    }
    for set_name in current.sets.keys() {
        if !next.sets.contains_key(set_name) {
            push_event(set_name, "set_deleted", "", "", "");
        }
    }
    for (set_name, after_entries) in &next.sets {
        let Some(before_entries) = current.sets.get(set_name) else {
            continue;
        };
        for (src, after_target) in after_entries {
            match before_entries.get(src) {
                None => push_event(set_name, "entry_added", src, after_target, ""),
                Some(before_target) if before_target != after_target => {
                    push_event(set_name, "entry_updated", src, after_target, before_target);
                }
                Some(_) => {}
            }
        }
        for (src, before_target) in before_entries {
            if !after_entries.contains_key(src) {
                push_event(set_name, "entry_deleted", src, "", before_target);
            }
        }
    }
}

fn atomic_write_json<T: Serialize>(dir: &Path, dest: &Path, data: &T) -> Result<(), CoreError> {
    fs::create_dir_all(dir)?;
    let mut tmp = NamedTempFile::new_in(dir)?;
    serde_json::to_writer_pretty(&mut tmp, data)?;
    tmp.write_all(b"\n")?;
    tmp.as_file().sync_all()?;
    tmp.persist(dest).map_err(|err| err.error)?;
    Ok(())
}

fn now_epoch_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as u64)
}

fn now_iso_string() -> String {
    format!("{}", now_epoch_ms())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    struct FakeHttp {
        calls: usize,
    }

    impl TranslationHttpTransport for FakeHttp {
        fn post_dichngay_json(
            &mut self,
            _server_url: &str,
            body_json: &str,
            _timeout_sec: u64,
        ) -> Result<String, CoreError> {
            self.calls += 1;
            let req: serde_json::Value = serde_json::from_str(body_json)?;
            let tl = req["tl"].as_str().unwrap_or("vi");
            let items: Vec<String> = serde_json::from_str(req["content"].as_str().unwrap_or("[]"))?;
            let out: Vec<String> = items
                .into_iter()
                .map(|s| {
                    if tl == "hv" {
                        "tiêu viêm thiếu gia".to_owned()
                    } else {
                        s.replace("你好", "Xin chào ").replace("世界", "thế giới")
                    }
                })
                .collect();
            let resp = json!({
                "data": {
                    "content": serde_json::to_string(&out)?
                }
            });
            Ok(serde_json::to_string(&resp)?)
        }

        fn sleep_ms(&mut self, _ms: u64) {}
    }

    #[test]
    fn persists_name_sets_translation_memory_and_selection_mapping() {
        let dir = tempfile::tempdir().unwrap();
        let store = TranslationStore::new(dir.path());

        let state = store
            .update_name_set_entry(
                "萧炎",
                "Tiêu Viêm",
                None,
                false,
                Some("book_1"),
                Some("reader_selection"),
                Some("ch_1"),
            )
            .unwrap();
        assert_eq!(state.version, 2);
        assert_eq!(
            state.sets["Mặc định"].get("萧炎").map(String::as_str),
            Some("Tiêu Viêm")
        );

        let history = store.list_book_name_history("book_1", 10).unwrap();
        assert_eq!(history.len(), 1);
        assert_eq!(history[0].action_type, "entry_added");
        assert_eq!(history[0].source_text, "萧炎");
        assert_eq!(history[0].target_text, "Tiêu Viêm");

        let mut http = FakeHttp { calls: 0 };
        let detail = store
            .translate_chapter_content(
                Some("book_1"),
                "ch_1",
                "萧炎，你好世界！",
                "server",
                false,
                Some(&mut http),
            )
            .unwrap();
        assert_eq!(detail.translated, "Tiêu Viêm, xin chào thế giới!");
        assert_eq!(http.calls, 1);

        // Lần gọi thứ 2 đọc thẳng từ chapter cache, không gọi HTTP
        let cached_detail = store
            .translate_chapter_content(
                Some("book_1"),
                "ch_1",
                "萧炎，你好世界！",
                "server",
                false,
                Some(&mut http),
            )
            .unwrap();
        assert_eq!(cached_detail.translated, "Tiêu Viêm, xin chào thế giới!");
        assert_eq!(http.calls, 1);

        // Map selection trên chữ "Tiêu Viêm" trả đúng "萧炎"
        let mapped = store
            .map_chapter_selection_to_name(
                Some("book_1"),
                "ch_1",
                "萧炎，你好世界！",
                &cached_detail.translated,
                "Tiêu Viêm",
                0,
                9,
                "server",
                None,
            )
            .unwrap();
        assert_eq!(mapped.source_candidate, "萧炎");
        assert_eq!(mapped.target_candidate, "Tiêu Viêm");

        // Gợi ý Hán-Việt + từ điển Name riêng
        let suggest = store
            .build_name_suggestions(
                "萧炎少爷",
                Some("book_1"),
                None,
                "name",
                "book",
                None,
                Some(&mut http),
            )
            .unwrap();
        assert_eq!(suggest.items.len(), 3);
        assert_eq!(suggest.items[2].han_viet, "Tiêu Viêm thiếu gia");
        assert!(!suggest.right_items.is_empty());

        let stats = store.get_translation_cache_stats().unwrap();
        assert!(stats.translation_memory_count >= 1);
        assert_eq!(stats.chapter_cache_count, 1);
    }
}
