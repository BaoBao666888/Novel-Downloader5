use std::collections::HashSet;
use std::fs::{self, File, Metadata, OpenOptions};
use std::io::{self, BufReader, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::CoreError;

const FORMAT_VERSION: u32 = 1;
const PAGE_BYTES: usize = 16 * 1024;

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
                Item {
                    id: entry.id,
                    title: entry
                        .path
                        .file_stem()
                        .unwrap_or(entry.path.as_os_str())
                        .to_string_lossy()
                        .into_owned(),
                    path,
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
                    || !has_txt_extension(&entry.path)
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
                if !has_txt_extension(&file) || !fs::symlink_metadata(&file)?.is_file() {
                    return Err(format!("Hãy chọn tệp TXT thường: {}", file.display()).into());
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

    pub fn read(&self, id: u32, cursor: Option<Cursor>) -> Result<Page, CoreError> {
        let path = {
            let _lock = self.lock()?;
            self.load()?
                .entries
                .into_iter()
                .find(|entry| entry.id == id)
                .ok_or("Tệp này không còn trong thư viện.")?
                .path
        };
        if !fs::symlink_metadata(&path).is_ok_and(|metadata| metadata.is_file()) {
            return Err("Không tìm thấy tệp TXT tại vị trí đã lưu.".into());
        }
        read_page(File::open(path)?, cursor)
    }
}

fn has_txt_extension(file: &Path) -> bool {
    file.extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| ext.eq_ignore_ascii_case("txt"))
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
}
