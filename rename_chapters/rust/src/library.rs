use std::cmp::Ordering;
use std::collections::HashSet;
use std::fs::{self, File, Metadata, OpenOptions};
use std::io::{self, BufReader, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::{CoreError, archive};

const FORMAT_VERSION: u32 = 1;
const PAGE_BYTES: usize = 16 * 1024;
const MAX_CHAPTER_BYTES: usize = 2 * 1024 * 1024;
const MAX_TXT_SCAN_BYTES: u64 = 64 * 1024 * 1024;

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

#[derive(Deserialize, Serialize)]
struct Entry {
    id: u32,
    path: PathBuf,
}

#[derive(Serialize)]
pub struct Item {
    id: u32,
    title: String,
    path: String,
    kind: SourceKind,
    size: u64,
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
                catalog.entries.push(Entry { id, path });
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

    pub fn chapters(&self, id: u32, interpreter: Option<&Path>) -> Result<ChapterList, CoreError> {
        let path = self.lookup_path(id)?;
        if !fs::symlink_metadata(&path).is_ok_and(|metadata| metadata.is_file()) {
            return Err("Không tìm thấy tệp nguồn tại vị trí đã lưu.".into());
        }
        match source_kind(&path) {
            Some(SourceKind::Zip) => {
                let (_, info) = archive::inspect(&path, interpreter)?;
                let mut txt_entries: Vec<_> = info
                    .entries
                    .into_iter()
                    .filter(|e| e.safe && e.is_txt)
                    .collect();
                txt_entries.sort_by(|a, b| natural_cmp(&a.display_name, &b.display_name));
                let chapters = txt_entries
                    .into_iter()
                    .enumerate()
                    .map(|(idx, entry)| ChapterMeta {
                        index: idx,
                        title: clean_zip_chapter_title(&entry.display_name),
                        size: entry.size,
                    })
                    .collect();
                Ok(ChapterList {
                    book_id: id,
                    kind: SourceKind::Zip,
                    encoding: "auto".to_owned(),
                    chapters,
                })
            }
            Some(SourceKind::Txt) => {
                let meta = fs::metadata(&path)?;
                if meta.len() > MAX_TXT_SCAN_BYTES {
                    return Ok(ChapterList {
                        book_id: id,
                        kind: SourceKind::Txt,
                        encoding: "utf-8".to_owned(),
                        chapters: Vec::new(),
                    });
                }
                let raw = fs::read(&path)?;
                let (text, encoding) = decode_txt_bytes(&raw)?;
                let spans = detect_txt_chapters(&text);
                let chapters = spans
                    .into_iter()
                    .enumerate()
                    .map(|(idx, span)| ChapterMeta {
                        index: idx,
                        title: span.title,
                        size: (span.end_byte - span.start_byte) as u64,
                    })
                    .collect();
                Ok(ChapterList {
                    book_id: id,
                    kind: SourceKind::Txt,
                    encoding,
                    chapters,
                })
            }
            None => Err("Định dạng tệp không được hỗ trợ.".into()),
        }
    }

    pub fn read_chapter(
        &self,
        id: u32,
        chapter_index: usize,
        interpreter: Option<&Path>,
    ) -> Result<ChapterContent, CoreError> {
        let path = self.lookup_path(id)?;
        if !fs::symlink_metadata(&path).is_ok_and(|metadata| metadata.is_file()) {
            return Err("Không tìm thấy tệp nguồn tại vị trí đã lưu.".into());
        }
        match source_kind(&path) {
            Some(SourceKind::Zip) => {
                let (_, info) = archive::inspect(&path, interpreter)?;
                let mut txt_entries: Vec<_> = info
                    .entries
                    .into_iter()
                    .filter(|e| e.safe && e.is_txt)
                    .collect();
                txt_entries.sort_by(|a, b| natural_cmp(&a.display_name, &b.display_name));
                let total_chapters = txt_entries.len();
                let entry = txt_entries
                    .get(chapter_index)
                    .ok_or("Chương yêu cầu không tồn tại trong tệp ZIP.")?;
                let preview =
                    archive::read_entry_text(&path, entry.index, MAX_CHAPTER_BYTES, interpreter)?;
                Ok(ChapterContent {
                    index: chapter_index,
                    title: clean_zip_chapter_title(&entry.display_name),
                    text: preview.text,
                    encoding: preview.encoding,
                    total_chapters,
                    truncated: preview.truncated,
                })
            }
            Some(SourceKind::Txt) => {
                let raw = fs::read(&path)?;
                let (text, encoding) = decode_txt_bytes(&raw)?;
                let spans = detect_txt_chapters(&text);
                let total_chapters = spans.len();
                let span = spans
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
                Ok(ChapterContent {
                    index: chapter_index,
                    title: span.title.clone(),
                    text: body,
                    encoding,
                    total_chapters,
                    truncated,
                })
            }
            None => Err("Định dạng tệp không được hỗ trợ.".into()),
        }
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
    let text = std::str::from_utf8(raw)
        .map_err(|_| "Tệp TXT hiện cần dùng UTF-8 hoặc UTF-16 có BOM.")?
        .replace("\r\n", "\n")
        .replace('\r', "\n");
    Ok((text, "utf-8".to_owned()))
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
}
