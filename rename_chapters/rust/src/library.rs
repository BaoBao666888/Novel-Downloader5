use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};
use std::fs::{self, File, Metadata, OpenOptions};
use std::io::{self, BufReader, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::time::Instant;

use serde::{Deserialize, Serialize};

use crate::{CoreError, reader_zip};
use encoding_rs::{GB18030, WINDOWS_1252};

const FORMAT_VERSION: u32 = 1;
const PAGE_BYTES: usize = 16 * 1024;
const MAX_CHAPTER_BYTES: usize = 2 * 1024 * 1024;
const MAX_TXT_SCAN_BYTES: u64 = 64 * 1024 * 1024;
const BLOB_MAGIC: &[u8; 4] = b"NSZ1";
const MAX_COMPRESSION_SAMPLE_BYTES: usize = 256 * 1024;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SourceKind {
    Txt,
    Zip,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChapterMeta {
    pub index: usize,
    pub title: String,
    pub size: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChapterList {
    pub book_id: u32,
    pub kind: SourceKind,
    pub encoding: String,
    pub chapters: Vec<ChapterMeta>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChapterContent {
    pub index: usize,
    pub title: String,
    pub text: String,
    pub encoding: String,
    pub total_chapters: usize,
    pub truncated: bool,
}

pub struct Library {
    directory: PathBuf,
}

#[derive(Deserialize, Serialize)]
struct Catalog {
    version: u32,
    next_id: u32,
    entries: Vec<Entry>,
}

impl Default for Catalog {
    fn default() -> Self {
        Self {
            version: FORMAT_VERSION,
            next_id: 1,
            entries: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct BookMetrics {
    pub chapter_count: usize,
    pub word_count: u64,
    pub char_count: u64,
    pub source_bytes: u64,
    pub compressed_bytes: u64,
    pub stamp: String,
}

#[derive(Deserialize, Serialize)]
struct Entry {
    id: u32,
    path: PathBuf,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    last_chapter: Option<usize>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    metrics: Option<BookMetrics>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LibraryStats {
    pub book_count: usize,
    pub txt_count: usize,
    pub zip_count: usize,
    pub measured_books: usize,
    pub total_chapters: usize,
    pub total_words: u64,
    pub total_chars: u64,
    pub total_source_bytes: u64,
    pub total_compressed_bytes: u64,
    pub compression_ratio_percent: u8,
    pub elapsed_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct LegacyReaderBookEntry {
    pub title: String,
    pub source_path: String,
    #[serde(default)]
    pub last_chapter: Option<usize>,
    #[serde(default)]
    pub chapter_count: Option<usize>,
    #[serde(default)]
    pub word_count: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LegacyImportResult {
    pub imported: usize,
    pub skipped_existing: usize,
    pub skipped_missing: usize,
}

#[derive(Serialize)]
pub struct Item {
    id: u32,
    title: String,
    path: String,
    kind: SourceKind,
    size: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    last_chapter: Option<usize>,
}

#[derive(Serialize)]
pub struct ShelfBook {
    pub id: u32,
    pub title: String,
    pub kind: SourceKind,
}

#[derive(Default)]
pub struct ReadCache {
    books: HashMap<u32, CachedToc>,
}

struct CachedToc {
    stamp: String,
    kind: SourceKind,
    encoding: String,
    zip_entries: Vec<(usize, String, u64)>,
    txt_text: Option<String>,
    txt_spans: Vec<TxtChapterSpan>,
}

impl ReadCache {
    pub fn invalidate(&mut self, id: u32) {
        self.books.remove(&id);
    }

    fn insert(&mut self, id: u32, entry: CachedToc) {
        if self.books.len() >= 12 && !self.books.contains_key(&id) {
            self.books.clear();
        }
        self.books.insert(id, entry);
    }
}

#[derive(Serialize)]
pub struct ImportResult {
    entries: Vec<Item>,
    added: usize,
}

#[derive(Clone, Deserialize, Serialize)]
pub struct Cursor {
    offset: u64,
    stamp: String,
}

#[derive(Serialize)]
pub struct Page {
    text: String,
    next: Option<Cursor>,
}

impl Catalog {
    fn items(&self) -> Vec<Item> {
        self.entries
            .iter()
            .rev()
            .map(|entry| {
                let path = entry.path.display().to_string();
                #[cfg(windows)]
                let path = if let Some(unc) = path.strip_prefix(r"\\?\UNC\") {
                    format!(r"\\{unc}")
                } else {
                    path.strip_prefix(r"\\?\").unwrap_or(&path).to_owned()
                };
                let kind = source_kind(&entry.path).unwrap_or(SourceKind::Txt);
                let size = fs::symlink_metadata(&entry.path)
                    .map(|m| m.len())
                    .unwrap_or(0);
                Item {
                    id: entry.id,
                    title: entry
                        .path
                        .file_stem()
                        .unwrap_or(entry.path.as_os_str())
                        .to_string_lossy()
                        .into_owned(),
                    path,
                    kind,
                    size,
                    last_chapter: entry.last_chapter,
                }
            })
            .collect()
    }
}

impl Library {
    pub fn new(directory: PathBuf) -> Self {
        Self { directory }
    }

    fn lock(&self) -> Result<File, CoreError> {
        fs::create_dir_all(&self.directory)?;
        let lock = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(false)
            .open(self.directory.join("library.lock"))?;
        lock.lock()?;
        Ok(lock)
    }

    fn load(&self) -> Result<Catalog, CoreError> {
        let file = match File::open(self.directory.join("library.json")) {
            Ok(file) => file,
            Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(Catalog::default()),
            Err(error) => return Err(error.into()),
        };
        let catalog: Catalog = serde_json::from_reader(BufReader::new(file))
            .map_err(|error| format!("Không đọc được danh mục thư viện: {error}"))?;
        let mut ids = HashSet::new();
        if catalog.version != FORMAT_VERSION
            || catalog.next_id == 0
            || catalog.entries.iter().any(|entry| {
                entry.id == 0
                    || entry.id >= catalog.next_id
                    || !ids.insert(entry.id)
                    || !entry.path.is_absolute()
                    || source_kind(&entry.path).is_none()
            })
        {
            return Err("Danh mục thư viện không hợp lệ hoặc thuộc phiên bản khác.".into());
        }
        Ok(catalog)
    }

    fn save(&self, catalog: &Catalog) -> Result<(), CoreError> {
        let mut file = tempfile::NamedTempFile::new_in(&self.directory)?;
        serde_json::to_writer(&mut file, catalog)?;
        file.flush()?;
        file.as_file().sync_all()?;
        file.persist(self.directory.join("library.json"))?;
        Ok(())
    }

    pub fn list(&self) -> Result<Vec<Item>, CoreError> {
        let _lock = self.lock()?;
        Ok(self.load()?.items())
    }

    pub fn reading_shelf(&self) -> Result<Vec<ShelfBook>, CoreError> {
        Ok(self
            .list()?
            .into_iter()
            .map(|entry| ShelfBook {
                id: entry.id,
                title: entry.title,
                kind: entry.kind,
            })
            .collect())
    }

    pub fn import(&self, files: Vec<PathBuf>) -> Result<ImportResult, CoreError> {
        let paths = files
            .into_iter()
            .map(|file| {
                if source_kind(&file).is_none() || !fs::symlink_metadata(&file)?.is_file() {
                    return Err(
                        format!("Hãy chọn tệp TXT hoặc ZIP thường: {}", file.display()).into(),
                    );
                }
                Ok(file.canonicalize()?)
            })
            .collect::<Result<Vec<_>, CoreError>>()?;
        let _lock = self.lock()?;
        let mut catalog = self.load()?;
        let mut known: HashSet<_> = catalog
            .entries
            .iter()
            .map(|entry| entry.path.clone())
            .collect();
        let mut added = 0;
        for path in paths {
            if known.insert(path.clone()) {
                let id = catalog.next_id;
                catalog.next_id = id
                    .checked_add(1)
                    .ok_or("Thư viện đã đạt giới hạn số tệp.")?;
                catalog.entries.push(Entry {
                    id,
                    path,
                    last_chapter: None,
                    metrics: None,
                });
                added += 1;
            }
        }
        if added > 0 {
            self.save(&catalog)?;
        }
        Ok(ImportResult {
            entries: catalog.items(),
            added,
        })
    }

    pub fn remove(&self, id: u32) -> Result<Vec<Item>, CoreError> {
        let _lock = self.lock()?;
        let mut catalog = self.load()?;
        if let Some(index) = catalog.entries.iter().position(|entry| entry.id == id) {
            catalog.entries.remove(index);
            self.save(&catalog)?;
        }
        Ok(catalog.items())
    }

    fn lookup_path(&self, id: u32) -> Result<PathBuf, CoreError> {
        let _lock = self.lock()?;
        self.load()?
            .entries
            .into_iter()
            .find(|entry| entry.id == id)
            .map(|entry| entry.path)
            .ok_or_else(|| "Tệp này không còn trong thư viện.".into())
    }

    pub fn read(&self, id: u32, cursor: Option<Cursor>) -> Result<Page, CoreError> {
        let path = self.lookup_path(id)?;
        if !fs::symlink_metadata(&path).is_ok_and(|metadata| metadata.is_file()) {
            return Err("Không tìm thấy tệp TXT tại vị trí đã lưu.".into());
        }
        if source_kind(&path) == Some(SourceKind::Zip) {
            return Err("Tệp ZIP được đọc theo từng chương trong mục lục.".into());
        }
        read_page(File::open(path)?, cursor)
    }

    fn save_last_chapter(&self, id: u32, chapter_index: usize) {
        let Ok(_lock) = self.lock() else {
            return;
        };
        let Ok(mut catalog) = self.load() else {
            return;
        };
        if let Some(entry) = catalog.entries.iter_mut().find(|entry| entry.id == id)
            && entry.last_chapter != Some(chapter_index)
        {
            entry.last_chapter = Some(chapter_index);
            let _ = self.save(&catalog);
        }
    }

    fn ensure_cached_toc<'a>(
        &self,
        id: u32,
        cache: &'a mut ReadCache,
    ) -> Result<(PathBuf, &'a CachedToc), CoreError> {
        let path = self.lookup_path(id)?;
        let metadata = fs::symlink_metadata(&path)
            .map_err(|_| "Không tìm thấy tệp nguồn tại vị trí đã lưu.")?;
        if !metadata.is_file() {
            return Err("Không tìm thấy tệp nguồn tại vị trí đã lưu.".into());
        }
        let stamp = file_stamp(&metadata)?;
        let cache_hit = cache
            .books
            .get(&id)
            .is_some_and(|cached| cached.stamp == stamp);
        if !cache_hit {
            let built = match source_kind(&path) {
                Some(SourceKind::Zip) => {
                    let mut entries = reader_zip::list(&path)?;
                    entries.sort_by(|a, b| natural_cmp(&a.name, &b.name));
                    let zip_entries = entries
                        .into_iter()
                        .map(|entry| {
                            (
                                entry.index,
                                clean_zip_chapter_title(&entry.name),
                                entry.size,
                            )
                        })
                        .collect();
                    CachedToc {
                        stamp,
                        kind: SourceKind::Zip,
                        encoding: "auto".to_owned(),
                        zip_entries,
                        txt_text: None,
                        txt_spans: Vec::new(),
                    }
                }
                Some(SourceKind::Txt) => {
                    if metadata.len() > MAX_TXT_SCAN_BYTES {
                        CachedToc {
                            stamp,
                            kind: SourceKind::Txt,
                            encoding: "utf-8".to_owned(),
                            zip_entries: Vec::new(),
                            txt_text: None,
                            txt_spans: Vec::new(),
                        }
                    } else {
                        let raw = fs::read(&path)?;
                        let (text, encoding) = decode_txt_bytes(&raw)?;
                        let mut txt_spans = detect_txt_chapters(&text);
                        if txt_spans.is_empty()
                            && !text.is_empty()
                            && !encoding.starts_with("utf-8")
                        {
                            txt_spans.push(TxtChapterSpan {
                                title: path
                                    .file_stem()
                                    .unwrap_or_default()
                                    .to_string_lossy()
                                    .into_owned(),
                                start_byte: 0,
                                end_byte: text.len(),
                            });
                        }
                        CachedToc {
                            stamp,
                            kind: SourceKind::Txt,
                            encoding,
                            zip_entries: Vec::new(),
                            txt_text: Some(text),
                            txt_spans,
                        }
                    }
                }
                None => return Err("Định dạng tệp không được hỗ trợ.".into()),
            };
            cache.insert(id, built);
        }
        Ok((path, cache.books.get(&id).expect("cached toc inserted")))
    }

    pub fn chapters(&self, id: u32, interpreter: Option<&Path>) -> Result<ChapterList, CoreError> {
        let mut cache = ReadCache::default();
        self.chapters_cached(id, &mut cache, interpreter)
    }

    pub fn chapters_cached(
        &self,
        id: u32,
        cache: &mut ReadCache,
        _interpreter: Option<&Path>,
    ) -> Result<ChapterList, CoreError> {
        let (_, cached) = self.ensure_cached_toc(id, cache)?;
        let chapters = match cached.kind {
            SourceKind::Zip => cached
                .zip_entries
                .iter()
                .enumerate()
                .map(|(idx, (_, title, size))| ChapterMeta {
                    index: idx,
                    title: title.clone(),
                    size: *size,
                })
                .collect(),
            SourceKind::Txt => cached
                .txt_spans
                .iter()
                .enumerate()
                .map(|(idx, span)| ChapterMeta {
                    index: idx,
                    title: span.title.clone(),
                    size: (span.end_byte - span.start_byte) as u64,
                })
                .collect(),
        };
        Ok(ChapterList {
            book_id: id,
            kind: cached.kind,
            encoding: cached.encoding.clone(),
            chapters,
        })
    }

    pub fn read_chapter(
        &self,
        id: u32,
        chapter_index: usize,
        interpreter: Option<&Path>,
    ) -> Result<ChapterContent, CoreError> {
        let mut cache = ReadCache::default();
        self.read_chapter_cached(id, chapter_index, &mut cache, interpreter)
    }

    pub fn read_chapter_cached(
        &self,
        id: u32,
        chapter_index: usize,
        cache: &mut ReadCache,
        _interpreter: Option<&Path>,
    ) -> Result<ChapterContent, CoreError> {
        let content = self.read_chapter_without_progress(id, chapter_index, cache)?;
        self.save_last_chapter(id, chapter_index);
        Ok(content)
    }

    pub fn read_chapter_without_progress(
        &self,
        id: u32,
        chapter_index: usize,
        cache: &mut ReadCache,
    ) -> Result<ChapterContent, CoreError> {
        let (path, cached) = self.ensure_cached_toc(id, cache)?;
        let content = match cached.kind {
            SourceKind::Zip => {
                let total_chapters = cached.zip_entries.len();
                let (entry_index, title, _) = cached
                    .zip_entries
                    .get(chapter_index)
                    .ok_or("Chương yêu cầu không tồn tại trong tệp ZIP.")?;
                let (bytes, truncated) = reader_zip::read(&path, *entry_index, MAX_CHAPTER_BYTES)?;
                let (text, encoding) = decode_zip_text(&bytes, truncated);
                ChapterContent {
                    index: chapter_index,
                    title: title.clone(),
                    text,
                    encoding,
                    total_chapters,
                    truncated,
                }
            }
            SourceKind::Txt => {
                let text = cached
                    .txt_text
                    .as_deref()
                    .ok_or("Tệp TXT quá lớn để đọc theo chương; hãy dùng chế độ đọc theo trang.")?;
                let total_chapters = cached.txt_spans.len();
                let span = cached
                    .txt_spans
                    .get(chapter_index)
                    .ok_or("Chương yêu cầu không tồn tại trong tệp TXT.")?;
                let slice = &text[span.start_byte..span.end_byte];
                let (body, truncated) = if slice.len() > MAX_CHAPTER_BYTES {
                    let mut cut = MAX_CHAPTER_BYTES;
                    while !slice.is_char_boundary(cut) {
                        cut -= 1;
                    }
                    (slice[..cut].to_owned(), true)
                } else {
                    (slice.to_owned(), false)
                };
                ChapterContent {
                    index: chapter_index,
                    title: span.title.clone(),
                    text: body,
                    encoding: cached.encoding.clone(),
                    total_chapters,
                    truncated,
                }
            }
        };
        Ok(content)
    }

    /// Trả về thống kê thư viện nhanh O(N_books) từ chỉ số cache; khi `refresh_stale = true`,
    /// chỉ đo lại những truyện chưa có chỉ số hoặc đã đổi size/mtime.
    pub fn stats(&self, refresh_stale: bool) -> Result<LibraryStats, CoreError> {
        self.stats_with_interpreter(refresh_stale, None)
    }

    pub fn stats_with_interpreter(
        &self,
        refresh_stale: bool,
        _interpreter: Option<&Path>,
    ) -> Result<LibraryStats, CoreError> {
        let started = Instant::now();
        let _lock = self.lock()?;
        let mut catalog = self.load()?;
        let mut mutated = false;

        if refresh_stale {
            for entry in &mut catalog.entries {
                let Ok(metadata) = fs::symlink_metadata(&entry.path) else {
                    continue;
                };
                if !metadata.is_file() {
                    continue;
                }
                let Ok(stamp) = file_stamp(&metadata) else {
                    continue;
                };
                let fresh = entry
                    .metrics
                    .as_ref()
                    .is_some_and(|existing| existing.stamp == stamp);
                if !fresh && let Ok(metrics) = measure_book_metrics(&entry.path, stamp, &metadata) {
                    entry.metrics = Some(metrics);
                    mutated = true;
                }
            }
            if mutated {
                self.save(&catalog)?;
            }
        }

        let mut txt_count = 0usize;
        let mut zip_count = 0usize;
        let mut measured_books = 0usize;
        let mut total_chapters = 0usize;
        let mut total_words = 0u64;
        let mut total_chars = 0u64;
        let mut total_source_bytes = 0u64;
        let mut total_compressed_bytes = 0u64;

        for entry in &catalog.entries {
            match source_kind(&entry.path).unwrap_or(SourceKind::Txt) {
                SourceKind::Txt => txt_count += 1,
                SourceKind::Zip => zip_count += 1,
            }
            if let Some(m) = &entry.metrics {
                measured_books += 1;
                total_chapters = total_chapters.saturating_add(m.chapter_count);
                total_words = total_words.saturating_add(m.word_count);
                total_chars = total_chars.saturating_add(m.char_count);
                total_source_bytes = total_source_bytes.saturating_add(m.source_bytes);
                total_compressed_bytes = total_compressed_bytes.saturating_add(m.compressed_bytes);
            }
        }

        let compression_ratio_percent = if total_source_bytes > 0 {
            let saved = total_source_bytes.saturating_sub(total_compressed_bytes);
            ((saved.saturating_mul(100)) / total_source_bytes).min(99) as u8
        } else {
            0
        };

        Ok(LibraryStats {
            book_count: catalog.entries.len(),
            txt_count,
            zip_count,
            measured_books,
            total_chapters,
            total_words,
            total_chars,
            total_source_bytes,
            total_compressed_bytes,
            compression_ratio_percent,
            elapsed_ms: started.elapsed().as_millis() as u64,
        })
    }

    /// Gộp danh sách truyện từ Reader Python cũ vào thư viện Rust (chống trùng theo path chuẩn hóa).
    pub fn merge_legacy_entries(
        &self,
        entries: Vec<LegacyReaderBookEntry>,
    ) -> Result<LegacyImportResult, CoreError> {
        let _lock = self.lock()?;
        let mut catalog = self.load()?;
        let mut known: HashSet<PathBuf> = catalog
            .entries
            .iter()
            .map(|entry| entry.path.clone())
            .collect();
        let mut imported = 0usize;
        let mut skipped_existing = 0usize;
        let mut skipped_missing = 0usize;

        for item in entries {
            let _ = &item.title;
            let trimmed = item.source_path.trim();
            if trimmed.is_empty() {
                skipped_missing += 1;
                continue;
            }
            let raw_path = Path::new(trimmed);
            if source_kind(raw_path).is_none()
                || !fs::symlink_metadata(raw_path).is_ok_and(|meta| meta.is_file())
            {
                skipped_missing += 1;
                continue;
            }
            let Ok(canonical) = raw_path.canonicalize() else {
                skipped_missing += 1;
                continue;
            };
            if !known.insert(canonical.clone()) {
                skipped_existing += 1;
                continue;
            }
            let metrics = if item.chapter_count.is_some() || item.word_count.is_some() {
                fs::symlink_metadata(&canonical).ok().and_then(|meta| {
                    let stamp = file_stamp(&meta).ok()?;
                    let words = item.word_count.unwrap_or(0);
                    Some(BookMetrics {
                        chapter_count: item.chapter_count.unwrap_or(0),
                        word_count: words,
                        char_count: words.saturating_mul(5),
                        source_bytes: meta.len(),
                        compressed_bytes: meta.len(),
                        stamp,
                    })
                })
            } else {
                None
            };
            let id = catalog.next_id;
            catalog.next_id = id
                .checked_add(1)
                .ok_or("Thư viện đã đạt giới hạn số tệp.")?;
            catalog.entries.push(Entry {
                id,
                path: canonical,
                last_chapter: item.last_chapter,
                metrics,
            });
            imported += 1;
        }

        if imported > 0 {
            self.save(&catalog)?;
        }
        Ok(LegacyImportResult {
            imported,
            skipped_existing,
            skipped_missing,
        })
    }
}

pub fn compress_text_blob(text: &str) -> Vec<u8> {
    if text.is_empty() {
        return Vec::new();
    }
    let compressed = miniz_oxide::deflate::compress_to_vec_zlib(text.as_bytes(), 6);
    let mut out = Vec::with_capacity(BLOB_MAGIC.len() + compressed.len());
    out.extend_from_slice(BLOB_MAGIC);
    out.extend_from_slice(&compressed);
    out
}

pub fn decompress_text_blob(data: &[u8]) -> Result<String, CoreError> {
    if data.is_empty() {
        return Ok(String::new());
    }
    if let Some(rest) = data.strip_prefix(BLOB_MAGIC) {
        let decoded = miniz_oxide::inflate::decompress_to_vec_zlib(rest)
            .map_err(|err| format!("Không giải nén được dữ liệu chương Reader: {err:?}"))?;
        let text = String::from_utf8(decoded)?;
        return Ok(text);
    }
    Ok(std::str::from_utf8(data)?.to_owned())
}

fn measure_book_metrics(
    path: &Path,
    stamp: String,
    metadata: &Metadata,
) -> Result<BookMetrics, CoreError> {
    match source_kind(path) {
        Some(SourceKind::Txt) => {
            let source_bytes = metadata.len();
            if source_bytes > MAX_TXT_SCAN_BYTES {
                return Ok(BookMetrics {
                    chapter_count: 1,
                    word_count: source_bytes / 6,
                    char_count: source_bytes / 3,
                    source_bytes,
                    compressed_bytes: source_bytes / 2,
                    stamp,
                });
            }
            let raw = fs::read(path)?;
            let text = match decode_txt_bytes(&raw) {
                Ok((t, _)) => t,
                Err(_) => String::from_utf8_lossy(&raw).into_owned(),
            };
            let chapter_count = detect_txt_chapters(&text).len().max(1);
            let char_count = text.chars().count() as u64;
            let word_count = text.split_whitespace().count() as u64;
            let sample_end = if text.len() > MAX_COMPRESSION_SAMPLE_BYTES {
                let mut end = MAX_COMPRESSION_SAMPLE_BYTES;
                while !text.is_char_boundary(end) {
                    end -= 1;
                }
                end
            } else {
                text.len()
            };
            let compressed_bytes = if sample_end == 0 {
                0
            } else {
                let sample_blob_len = compress_text_blob(&text[..sample_end]).len() as u64;
                if sample_end == text.len() {
                    sample_blob_len
                } else {
                    (sample_blob_len.saturating_mul(source_bytes)) / (sample_end as u64).max(1)
                }
            };
            Ok(BookMetrics {
                chapter_count,
                word_count,
                char_count,
                source_bytes,
                compressed_bytes,
                stamp,
            })
        }
        Some(SourceKind::Zip) => {
            let mut txt_entries = reader_zip::list(path)?;
            txt_entries.sort_by(|a, b| natural_cmp(&a.name, &b.name));
            let chapter_count = txt_entries.len();
            let raw_sum: u64 = txt_entries.iter().map(|e| e.size).sum();
            let source_bytes = raw_sum.max(metadata.len());
            let compressed_bytes = metadata.len();

            let sample_limit = txt_entries.len().min(8);
            let mut sampled_bytes = 0u64;
            let mut sampled_words = 0u64;
            let mut sampled_chars = 0u64;
            let step = if txt_entries.len() > sample_limit && sample_limit > 0 {
                txt_entries.len() / sample_limit
            } else {
                1
            };
            for idx in (0..txt_entries.len()).step_by(step).take(sample_limit) {
                let entry = &txt_entries[idx];
                if let Ok((bytes, truncated)) =
                    reader_zip::read(path, entry.index, MAX_CHAPTER_BYTES)
                {
                    let (text, _) = decode_zip_text(&bytes, truncated);
                    sampled_bytes = sampled_bytes.saturating_add(entry.size.max(1));
                    sampled_words =
                        sampled_words.saturating_add(text.split_whitespace().count() as u64);
                    sampled_chars = sampled_chars.saturating_add(text.chars().count() as u64);
                }
            }
            let (word_count, char_count) = if sampled_bytes > 0 && raw_sum > 0 {
                (
                    (sampled_words.saturating_mul(raw_sum)) / sampled_bytes,
                    (sampled_chars.saturating_mul(raw_sum)) / sampled_bytes,
                )
            } else {
                (raw_sum / 6, raw_sum / 2)
            };

            Ok(BookMetrics {
                chapter_count,
                word_count,
                char_count,
                source_bytes,
                compressed_bytes,
                stamp,
            })
        }
        None => Err("Định dạng tệp không được hỗ trợ.".into()),
    }
}

fn source_kind(file: &Path) -> Option<SourceKind> {
    let ext = file.extension()?.to_str()?;
    if ext.eq_ignore_ascii_case("txt") {
        Some(SourceKind::Txt)
    } else if ext.eq_ignore_ascii_case("zip") {
        Some(SourceKind::Zip)
    } else {
        None
    }
}

fn clean_zip_chapter_title(display_name: &str) -> String {
    let leaf = display_name.rsplit('/').next().unwrap_or(display_name);
    let stem = leaf
        .strip_suffix(".txt")
        .or_else(|| leaf.strip_suffix(".TXT"))
        .unwrap_or(leaf)
        .trim();
    if stem.is_empty() {
        display_name.to_owned()
    } else {
        stem.to_owned()
    }
}

fn decode_txt_bytes(raw: &[u8]) -> Result<(String, String), CoreError> {
    if let Some(rest) = raw.strip_prefix(b"\xef\xbb\xbf") {
        let text = std::str::from_utf8(rest)
            .map_err(|_| "Tệp TXT không dùng UTF-8 hợp lệ.")?
            .replace("\r\n", "\n")
            .replace('\r', "\n");
        return Ok((text, "utf-8-bom".to_owned()));
    }
    if let Some(rest) = raw.strip_prefix(b"\xff\xfe") {
        let units: Vec<u16> = rest
            .chunks_exact(2)
            .map(|c| u16::from_le_bytes([c[0], c[1]]))
            .collect();
        let text = String::from_utf16_lossy(&units)
            .replace("\r\n", "\n")
            .replace('\r', "\n");
        return Ok((text, "utf-16le".to_owned()));
    }
    if let Some(rest) = raw.strip_prefix(b"\xfe\xff") {
        let units: Vec<u16> = rest
            .chunks_exact(2)
            .map(|c| u16::from_be_bytes([c[0], c[1]]))
            .collect();
        let text = String::from_utf16_lossy(&units)
            .replace("\r\n", "\n")
            .replace('\r', "\n");
        return Ok((text, "utf-16be".to_owned()));
    }
    if let Ok(utf8) = std::str::from_utf8(raw) {
        return Ok((
            utf8.replace("\r\n", "\n").replace('\r', "\n"),
            "utf-8".to_owned(),
        ));
    }
    let text = GB18030
        .decode_without_bom_handling_and_without_replacement(raw)
        .ok_or("Tệp TXT không phải UTF-8, UTF-16 hay GB18030 hợp lệ.")?;
    Ok((
        text.replace("\r\n", "\n").replace('\r', "\n"),
        "gb18030".to_owned(),
    ))
}

fn decode_zip_text(raw: &[u8], truncated: bool) -> (String, String) {
    let utf8 = raw.strip_prefix(b"\xef\xbb\xbf").unwrap_or(raw);
    if truncated
        && let Err(error) = std::str::from_utf8(utf8)
        && error.error_len().is_none()
        && let Ok((text, encoding)) =
            decode_txt_bytes(&raw[..raw.len() - (utf8.len() - error.valid_up_to())])
    {
        return (text, encoding);
    }
    if let Ok(decoded) = decode_txt_bytes(raw) {
        return decoded;
    }
    if raw.starts_with(b"\xef\xbb\xbf") {
        return (
            String::from_utf8_lossy(utf8)
                .replace("\r\n", "\n")
                .replace('\r', "\n"),
            "utf-8-lossy".to_owned(),
        );
    }
    let (text, _) = WINDOWS_1252.decode_without_bom_handling(raw);
    (
        text.replace("\r\n", "\n").replace('\r', "\n"),
        "windows-1252".to_owned(),
    )
}

struct TxtChapterSpan {
    title: String,
    start_byte: usize,
    end_byte: usize,
}

fn is_chapter_heading(line: &str) -> bool {
    let trimmed = line.trim();
    if trimmed.is_empty() || trimmed.chars().count() > 100 {
        return false;
    }
    if let Some(rest) = trimmed.strip_prefix('第') {
        let mut count = 0usize;
        for ch in rest.chars() {
            if matches!(
                ch,
                '0'..='9'
                    | '零'
                    | '〇'
                    | '一'
                    | '二'
                    | '两'
                    | '三'
                    | '四'
                    | '五'
                    | '六'
                    | '七'
                    | '八'
                    | '九'
                    | '十'
                    | '百'
                    | '千'
                    | '万'
            ) {
                count += 1;
                continue;
            }
            return count > 0 && matches!(ch, '章' | '回' | '节' | '卷' | '集');
        }
        return false;
    }
    let lower = trimmed.to_lowercase();
    for prefix in ["chương ", "chuong ", "chapter ", "hồi ", "hoi "] {
        if let Some(rest) = lower.strip_prefix(prefix) {
            let first = rest.trim_start().chars().next();
            if first.is_some_and(|c| {
                c.is_ascii_digit() || matches!(c, 'i' | 'v' | 'x' | 'l' | 'c' | 'd' | 'm')
            }) {
                return true;
            }
        }
    }
    false
}

fn detect_txt_chapters(text: &str) -> Vec<TxtChapterSpan> {
    let mut hits: Vec<(usize, String)> = Vec::new();
    let mut offset = 0usize;
    for raw_line in text.split_inclusive('\n') {
        let line = raw_line.strip_suffix('\n').unwrap_or(raw_line);
        if is_chapter_heading(line) {
            hits.push((offset, line.trim().chars().take(100).collect()));
        }
        offset += raw_line.len();
    }
    if hits.is_empty() {
        return Vec::new();
    }
    let mut spans = Vec::with_capacity(hits.len() + 1);
    if hits[0].0 > 0 && !text[..hits[0].0].trim().is_empty() {
        spans.push(TxtChapterSpan {
            title: "Mở đầu".to_owned(),
            start_byte: 0,
            end_byte: hits[0].0,
        });
    }
    for i in 0..hits.len() {
        let start_byte = hits[i].0;
        let end_byte = hits.get(i + 1).map(|(b, _)| *b).unwrap_or(text.len());
        spans.push(TxtChapterSpan {
            title: hits[i].1.clone(),
            start_byte,
            end_byte,
        });
    }
    spans
}

fn natural_cmp(a: &str, b: &str) -> Ordering {
    let (mut ai, mut bi) = (a.as_bytes(), b.as_bytes());
    while !ai.is_empty() && !bi.is_empty() {
        if ai[0].is_ascii_digit() && bi[0].is_ascii_digit() {
            let a_len = ai.iter().take_while(|c| c.is_ascii_digit()).count();
            let b_len = bi.iter().take_while(|c| c.is_ascii_digit()).count();
            let a_num = std::str::from_utf8(&ai[..a_len])
                .unwrap_or("0")
                .trim_start_matches('0');
            let b_num = std::str::from_utf8(&bi[..b_len])
                .unwrap_or("0")
                .trim_start_matches('0');
            let ord = a_num
                .len()
                .cmp(&b_num.len())
                .then_with(|| a_num.cmp(b_num))
                .then_with(|| a_len.cmp(&b_len));
            if ord != Ordering::Equal {
                return ord;
            }
            ai = &ai[a_len..];
            bi = &bi[b_len..];
        } else {
            let ord = ai[0].to_ascii_lowercase().cmp(&bi[0].to_ascii_lowercase());
            if ord != Ordering::Equal {
                return ord;
            }
            ai = &ai[1..];
            bi = &bi[1..];
        }
    }
    ai.len().cmp(&bi.len())
}

fn file_stamp(metadata: &Metadata) -> io::Result<String> {
    Ok(format!("{}:{:?}", metadata.len(), metadata.modified()?))
}

fn read_page(mut file: File, cursor: Option<Cursor>) -> Result<Page, CoreError> {
    let metadata = file.metadata()?;
    if !metadata.is_file() {
        return Err("Nguồn đọc phải là tệp TXT thường.".into());
    }
    let stamp = file_stamp(&metadata)?;
    let offset = cursor.as_ref().map_or(0, |cursor| cursor.offset);
    if cursor.is_some_and(|cursor| cursor.stamp != stamp) || offset > metadata.len() {
        return Err("Tệp đã thay đổi. Hãy mở lại từ trang đầu.".into());
    }
    file.seek(SeekFrom::Start(offset))?;
    let mut bytes = Vec::with_capacity(PAGE_BYTES + 1);
    (&mut file)
        .take((PAGE_BYTES + 1) as u64)
        .read_to_end(&mut bytes)?;
    if file_stamp(&file.metadata()?)? != stamp {
        return Err("Tệp đã thay đổi trong lúc đọc. Hãy mở lại từ trang đầu.".into());
    }

    let more = bytes.len() > PAGE_BYTES;
    let from = if offset == 0 && bytes.starts_with(b"\xef\xbb\xbf") {
        3
    } else {
        0
    };
    let mut to = bytes.len().min(PAGE_BYTES);
    if let Err(error) = std::str::from_utf8(&bytes[from..to]) {
        if !more || error.error_len().is_some() {
            return Err("Trang này không dùng UTF-8. Thư viện hiện đọc TXT UTF-8.".into());
        }
        to = from + error.valid_up_to();
    }
    if more {
        // Prefer a nearby line break, otherwise keep the complete UTF-8 boundary.
        let tail = to.saturating_sub(2048).max(from);
        if let Some(pos) = bytes[tail..to].iter().rposition(|byte| *byte == b'\n') {
            to = tail + pos + 1;
        } else if bytes[to - 1] == b'\r' {
            to -= 1;
        }
    }
    let text = std::str::from_utf8(&bytes[from..to])?
        .replace("\r\n", "\n")
        .replace('\r', "\n");
    let next = more.then_some(Cursor {
        offset: offset + to as u64,
        stamp,
    });
    Ok(Page { text, next })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn persists_imports_and_removes_only_the_catalog_entry() {
        let root = tempfile::tempdir().unwrap();
        let source = root.path().join("Một truyện.TXT");
        fs::write(&source, "Nội dung").unwrap();
        let data = root.path().join("data");
        let library = Library::new(data.clone());
        let imported = library
            .import(vec![source.clone(), source.clone()])
            .unwrap();
        assert_eq!(imported.added, 1);
        assert_eq!(imported.entries[0].title, "Một truyện");
        let id = imported.entries[0].id;

        let reopened = Library::new(data);
        assert_eq!(reopened.list().unwrap()[0].id, id);
        assert_eq!(reopened.read(id, None).unwrap().text, "Nội dung");
        assert!(reopened.remove(id).unwrap().is_empty());
        assert!(reopened.read(id, None).is_err());
        assert_eq!(fs::read_to_string(&source).unwrap(), "Nội dung");
        assert_ne!(reopened.import(vec![source]).unwrap().entries[0].id, id);
    }

    #[test]
    fn competing_imports_keep_both_entries() {
        let root = tempfile::tempdir().unwrap();
        let data = root.path().join("data");
        std::thread::scope(|scope| {
            for name in ["one.txt", "two.txt"] {
                let source = root.path().join(name);
                fs::write(&source, name).unwrap();
                let data = data.clone();
                scope.spawn(move || Library::new(data).import(vec![source]).unwrap());
            }
        });
        let items = Library::new(data).list().unwrap();
        assert_eq!(items.len(), 2);
        assert_ne!(items[0].id, items[1].id);
    }

    #[test]
    fn pages_keep_unicode_and_mixed_line_breaks_and_reject_stale_offsets() {
        let root = tempfile::tempdir().unwrap();
        let source = root.path().join("story.txt");
        // Force the first page to stop within an emoji in its raw byte window.
        let first = "a".repeat(PAGE_BYTES - 5);
        let text = format!("\u{feff}{first}📝\r\n{}\rCuối", "Chương mới\n".repeat(2000));
        fs::write(&source, &text).unwrap();
        let read = |cursor| read_page(File::open(&source).unwrap(), cursor).unwrap();
        let mut page = read(None);
        assert_eq!(page.text, first);
        let saved_cursor = page.next.clone();
        let mut reconstructed = page.text;
        while let Some(cursor) = page.next {
            page = read(Some(cursor));
            assert!(page.text.len() <= PAGE_BYTES);
            reconstructed.push_str(&page.text);
        }
        assert_eq!(
            reconstructed,
            text[3..].replace("\r\n", "\n").replace('\r', "\n")
        );
        fs::write(&source, "Đã thay đổi").unwrap();
        assert!(read_page(File::open(&source).unwrap(), saved_cursor).is_err());
    }

    #[test]
    fn malformed_catalog_is_not_replaced_on_import() {
        let root = tempfile::tempdir().unwrap();
        let source = root.path().join("story.txt");
        let catalog = root.path().join("library.json");
        fs::write(&source, "story").unwrap();
        fs::write(&catalog, "broken data").unwrap();
        assert!(
            Library::new(root.path().into())
                .import(vec![source])
                .is_err()
        );
        assert_eq!(fs::read_to_string(catalog).unwrap(), "broken data");
    }

    #[test]
    fn detects_txt_chapters_and_reads_utf16le_sources() {
        let root = tempfile::tempdir().unwrap();
        let data = root.path().join("data");
        let source = root.path().join("novel_utf16.txt");
        let text = "Lời mở đầu\n第1章 Khởi hành\nĐoạn 1\nChương 2: Biến cố\nĐoạn 2\n";
        let mut bytes = vec![0xffu8, 0xfeu8];
        for unit in text.encode_utf16() {
            bytes.extend_from_slice(&unit.to_le_bytes());
        }
        fs::write(&source, bytes).unwrap();

        let library = Library::new(data);
        let imported = library.import(vec![source]).unwrap();
        let id = imported.entries[0].id;
        assert_eq!(imported.entries[0].kind, SourceKind::Txt);

        let toc = library.chapters(id, None).unwrap();
        assert_eq!(toc.encoding, "utf-16le");
        assert_eq!(toc.chapters.len(), 3);
        assert_eq!(toc.chapters[0].title, "Mở đầu");
        assert_eq!(toc.chapters[1].title, "第1章 Khởi hành");
        assert_eq!(toc.chapters[2].title, "Chương 2: Biến cố");

        let ch2 = library.read_chapter(id, 2, None).unwrap();
        assert!(ch2.text.contains("Đoạn 2"));
        assert!(!ch2.truncated);
    }

    #[test]
    fn imports_zip_archive_with_natural_chapter_order_and_ellipsis_names() {
        let root = tempfile::tempdir().unwrap();
        let data = root.path().join("data");
        let zip_path = root.path().join("truyen.zip");
        let script = r#"
import sys, zipfile
with zipfile.ZipFile(sys.argv[1], "w") as zf:
    zf.writestr("10-Chuong 10.txt", "Noi dung 10".encode("utf-8"))
    zf.writestr("2-第2章 教官...不.txt", "Noi dung 2".encode("utf-8"))
    zf.writestr("../evil.txt", "blocked".encode("utf-8"))
"#;
        let py = if cfg!(windows) { "python" } else { "python3" };
        assert!(
            std::process::Command::new(py)
                .args(["-I", "-B", "-c", script])
                .arg(&zip_path)
                .status()
                .unwrap()
                .success()
        );

        let library = Library::new(data);
        let imported = library.import(vec![zip_path]).unwrap();
        assert_eq!(imported.entries[0].kind, SourceKind::Zip);
        let id = imported.entries[0].id;

        let toc = library.chapters(id, None).unwrap();
        assert_eq!(toc.kind, SourceKind::Zip);
        assert_eq!(toc.chapters.len(), 2);
        // Natural sort puts 2 before 10
        assert!(toc.chapters[0].title.contains("..."));
        assert_eq!(toc.chapters[1].title, "10-Chuong 10");

        let first = library.read_chapter(id, 0, None).unwrap();
        assert_eq!(first.text, "Noi dung 2");
        assert_eq!(first.total_chapters, 2);
    }

    #[test]
    fn persists_reading_progress_and_invalidates_toc_cache_on_change() {
        let root = tempfile::tempdir().unwrap();
        let data = root.path().join("data");
        let source = root.path().join("series.txt");
        fs::write(
            &source,
            "Chương 1: Mở\nNội dung 1\nChương 2: Tiếp\nNội dung 2\n",
        )
        .unwrap();

        let library = Library::new(data.clone());
        let imported = library.import(vec![source.clone()]).unwrap();
        let id = imported.entries[0].id;
        assert_eq!(imported.entries[0].last_chapter, None);

        let mut cache = ReadCache::default();
        let ch1 = library
            .read_chapter_cached(id, 1, &mut cache, None)
            .unwrap();
        assert!(ch1.text.contains("Nội dung 2"));

        // Re-opening library restores last_chapter from library.json
        let reopened = Library::new(data);
        let items = reopened.list().unwrap();
        assert_eq!(items[0].last_chapter, Some(1));

        // Mutating file invalidates cached TOC automatically
        fs::write(
            &source,
            "Chương 1: Mở\nNội dung 1\nChương 2: Tiếp\nNội dung 2\nChương 3: Mới\nNội dung 3\n",
        )
        .unwrap();
        let updated_toc = reopened.chapters_cached(id, &mut cache, None).unwrap();
        assert_eq!(updated_toc.chapters.len(), 3);
    }

    #[test]
    fn decodes_gb18030_txt_chapters_directly_in_library() {
        let root = tempfile::tempdir().unwrap();
        let data = root.path().join("data");
        let source = root.path().join("raw_gbk.txt");
        let script = r#"
import sys
with open(sys.argv[1], "wb") as f:
    f.write("第1章 江湖夜雨\r\n正文第一段\r\n第2章 剑气长存\r\n正文第二段".encode("gb18030"))
"#;
        let py = if cfg!(windows) { "python" } else { "python3" };
        assert!(
            std::process::Command::new(py)
                .args(["-I", "-B", "-c", script])
                .arg(&source)
                .status()
                .unwrap()
                .success()
        );

        let library = Library::new(data);
        let id = library.import(vec![source]).unwrap().entries[0].id;
        let toc = library.chapters(id, None).unwrap();
        assert_eq!(toc.encoding, "gb18030");
        assert_eq!(toc.chapters.len(), 2);
        assert_eq!(toc.chapters[0].title, "第1章 江湖夜雨");
        let ch2 = library.read_chapter(id, 1, None).unwrap();
        assert!(ch2.text.contains("正文第二段"));
    }

    #[test]
    fn compress_blob_roundtrips_and_shrinks_repeated_chapters() {
        let sample = "Chương 1: Khởi đầu tu tiên.\n".repeat(120);
        let blob = compress_text_blob(&sample);
        assert!(blob.starts_with(BLOB_MAGIC));
        assert!(blob.len() < sample.len() / 2);
        assert_eq!(decompress_text_blob(&blob).unwrap(), sample);
        assert_eq!(
            decompress_text_blob(sample.as_bytes()).unwrap(),
            sample,
            "raw UTF-8 fallback must still decode transparently"
        );
    }

    #[test]
    fn stats_compute_cached_metrics_and_merge_legacy_books_without_duplicates() {
        let root = tempfile::tempdir().unwrap();
        let data = root.path().join("data");
        let b1 = root.path().join("truyen_1.txt");
        let b2 = root.path().join("truyen_2.txt");
        let missing = root.path().join("khong_ton_tai.txt");
        fs::write(
            &b1,
            "Chương 1: Mở đầu\nĐây là đoạn văn bản mẫu có nhiều từ tiếng Việt lặp lại.\n"
                .repeat(40),
        )
        .unwrap();
        fs::write(&b2, "Chương 1: Khác\nMột hai ba bốn năm sáu.\n").unwrap();

        let library = Library::new(data.clone());
        library.import(vec![b1.clone()]).unwrap();

        // Warm call before measuring -> 0 measured_books, fast return
        let cold_unmeasured = library.stats(false).unwrap();
        assert_eq!(cold_unmeasured.book_count, 1);
        assert_eq!(cold_unmeasured.measured_books, 0);

        // Refresh measures b1 and saves metrics in library.json
        let measured = library.stats(true).unwrap();
        assert_eq!(measured.book_count, 1);
        assert_eq!(measured.measured_books, 1);
        assert_eq!(measured.total_chapters, 40);
        assert!(measured.total_words > 100);
        assert!(measured.total_compressed_bytes < measured.total_source_bytes);
        assert!(measured.compression_ratio_percent > 20);

        // Warm read without refresh returns persisted totals in O(1)
        let warm = library.stats(false).unwrap();
        assert_eq!(warm.total_words, measured.total_words);
        assert_eq!(warm.total_chapters, measured.total_chapters);

        // Legacy merge deduplicates b1, imports b2, skips missing file
        let merged = library
            .merge_legacy_entries(vec![
                LegacyReaderBookEntry {
                    title: "Đã có".to_owned(),
                    source_path: b1.to_string_lossy().into_owned(),
                    last_chapter: Some(2),
                    chapter_count: Some(99),
                    word_count: Some(999),
                },
                LegacyReaderBookEntry {
                    title: "Truyện 2".to_owned(),
                    source_path: b2.to_string_lossy().into_owned(),
                    last_chapter: Some(0),
                    chapter_count: Some(1),
                    word_count: Some(8),
                },
                LegacyReaderBookEntry {
                    title: "Mất file".to_owned(),
                    source_path: missing.to_string_lossy().into_owned(),
                    last_chapter: None,
                    chapter_count: None,
                    word_count: None,
                },
            ])
            .unwrap();
        assert_eq!(merged.imported, 1);
        assert_eq!(merged.skipped_existing, 1);
        assert_eq!(merged.skipped_missing, 1);

        let after_merge = library.stats(false).unwrap();
        assert_eq!(after_merge.book_count, 2);
        assert_eq!(after_merge.measured_books, 2);
        assert_eq!(after_merge.total_chapters, 41);
    }
}
