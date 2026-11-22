use std::collections::HashSet;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::CoreError;
use crate::upload::model::{ChapterRef, UploadJob};
use crate::upload::multipart::{CreditPosition, apply_upload_credit, normalize_credit_text};

pub const UNUSED_OBJECT_GRACE_MS: u64 = 120_000;
pub const TEMP_CACHE_TTL_MS: u64 = 86_400_000;
pub const MAX_CHAPTER_OBJECT_BYTES: usize = 2 * 1024 * 1024;

static NEXT_OBJECT_SEQ: AtomicU64 = AtomicU64::new(1);

const CACHE_PREFIXES: &[&str] = &[
    "txt-archive-",
    "txt-unpack-",
    "export-",
    "attachment-",
    "snapshot-import-",
    "snapshot-check-",
    "restore-",
];

pub fn validate_object_id(id: &str) -> Result<(), CoreError> {
    if id.is_empty()
        || id.len() > 80
        || !id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
    {
        return Err("ID file không hợp lệ.".into());
    }
    Ok(())
}

pub fn generate_object_id(prefix: &str) -> String {
    let clean_prefix: String = prefix
        .bytes()
        .filter(|b| b.is_ascii_alphanumeric() || *b == b'_' || *b == b'-')
        .take(16)
        .map(char::from)
        .collect();
    let tag = if clean_prefix.is_empty() {
        "obj"
    } else {
        clean_prefix.as_str()
    };
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_nanos() as u64);
    let seq = NEXT_OBJECT_SEQ.fetch_add(1, Ordering::Relaxed);
    format!("{tag}_{nanos:x}_{seq:x}")
}

/// Kho lưu trữ bất biến theo ID nội dung (`<root>/objects/<id>`), dùng ghi atomic.
#[derive(Debug, Clone)]
pub struct ObjectStore {
    root: PathBuf,
}

impl ObjectStore {
    pub fn new(root: PathBuf) -> Self {
        Self { root }
    }

    pub fn objects_dir(&self) -> PathBuf {
        self.root.join("objects")
    }

    pub fn object_path(&self, id: &str) -> Result<PathBuf, CoreError> {
        validate_object_id(id)?;
        Ok(self.objects_dir().join(id))
    }

    pub fn exists(&self, id: &str) -> bool {
        self.object_path(id).ok().is_some_and(|path| path.is_file())
    }

    pub fn len(&self, id: &str) -> Result<u64, CoreError> {
        let path = self.object_path(id)?;
        Ok(fs::metadata(path)?.len())
    }

    pub fn put_bytes(&self, id: &str, bytes: &[u8]) -> Result<u64, CoreError> {
        let target = self.object_path(id)?;
        let dir = self.objects_dir();
        fs::create_dir_all(&dir)?;
        let mut temp = tempfile::NamedTempFile::new_in(&dir)?;
        temp.write_all(bytes)?;
        temp.flush()?;
        temp.as_file().sync_all()?;
        temp.persist(target).map_err(|err| err.error)?;
        Ok(bytes.len() as u64)
    }

    pub fn put_utf8(&self, id: &str, text: &str) -> Result<u64, CoreError> {
        if text.len() > MAX_CHAPTER_OBJECT_BYTES {
            return Err("Một chương vượt 2 MB.".into());
        }
        self.put_bytes(id, text.as_bytes())
    }

    pub fn read_bytes(&self, id: &str) -> Result<Vec<u8>, CoreError> {
        let path = self.object_path(id)?;
        Ok(fs::read(path)?)
    }

    pub fn read_utf8(&self, id: &str) -> Result<String, CoreError> {
        let bytes = self.read_bytes(id)?;
        String::from_utf8(bytes).map_err(|_| "Nội dung chương không phải UTF-8 hợp lệ.".into())
    }

    pub fn delete(&self, id: &str) -> Result<bool, CoreError> {
        let path = self.object_path(id)?;
        match fs::remove_file(path) {
            Ok(()) => Ok(true),
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(false),
            Err(err) => Err(err.into()),
        }
    }

    /// Tạo bản sao bất biến mới cho từng chương trước khi upload/đóng gói, giữ nguyên bản gốc.
    pub fn clone_chapters_for_upload(
        &self,
        chapters: &[ChapterRef],
        credit_text: &str,
        credit_pos: CreditPosition,
        preserve_original: bool,
    ) -> Result<Vec<ChapterRef>, CoreError> {
        let credit_active = !normalize_credit_text(credit_text).is_empty();
        let mut created_ids = Vec::with_capacity(chapters.len());
        let mut cloned = Vec::with_capacity(chapters.len());

        let result: Result<(), CoreError> = (|| {
            for chapter in chapters {
                let previous = chapter.id.clone();
                let new_id = generate_object_id("up");
                let new_len = if credit_active {
                    if self.len(&previous)? > MAX_CHAPTER_OBJECT_BYTES as u64 {
                        return Err("Một chương vượt 2 MB.".into());
                    }
                    let body = self.read_utf8(&previous)?;
                    let prepared = apply_upload_credit(&body, credit_text, credit_pos);
                    if preserve_original && prepared.len() > MAX_CHAPTER_OBJECT_BYTES {
                        return Err("Nội dung sau lọc vượt 2 MB.".into());
                    }
                    self.put_bytes(&new_id, prepared.as_bytes())?
                } else {
                    let bytes = self.read_bytes(&previous)?;
                    self.put_bytes(&new_id, &bytes)?
                };
                created_ids.push(new_id.clone());

                let mut next = chapter.clone();
                next.id = new_id;
                next.bytes = new_len;
                next.original_id = if preserve_original {
                    chapter.original_id.clone().or(Some(previous))
                } else {
                    None
                };
                cloned.push(next);
            }
            Ok(())
        })();

        if let Err(err) = result {
            for id in created_ids {
                let _ = self.delete(&id);
            }
            return Err(err);
        }

        Ok(cloned)
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SweepResult {
    pub files: usize,
    pub bytes: u64,
}

fn visit_json_references(value: &serde_json::Value, out: &mut HashSet<String>) {
    match value {
        serde_json::Value::Object(map) => {
            for key in ["id", "originalId", "sourceFile", "fileId"] {
                if let Some(serde_json::Value::String(val)) = map.get(key)
                    && !val.is_empty()
                {
                    out.insert(val.clone());
                }
            }
            for child in map.values() {
                visit_json_references(child, out);
            }
        }
        serde_json::Value::Array(items) => {
            for child in items {
                visit_json_references(child, out);
            }
        }
        _ => {}
    }
}

/// Gom toàn bộ ID object đang được job hoặc snapshot JSON tham chiếu để không bao giờ dọn nhầm.
pub fn collect_referenced_ids(
    jobs: &[UploadJob],
    extra_json: Option<&serde_json::Value>,
) -> HashSet<String> {
    let mut refs = HashSet::new();
    for job in jobs {
        if let Some(chapters) = &job.chapters {
            for ch in chapters {
                if !ch.id.is_empty() {
                    refs.insert(ch.id.clone());
                }
                if let Some(orig) = &ch.original_id
                    && !orig.is_empty()
                {
                    refs.insert(orig.clone());
                }
                if let Some(src) = &ch.source_file
                    && !src.is_empty()
                {
                    refs.insert(src.clone());
                }
            }
        }
        if let Some(cover) = &job.metadata.cover_file
            && !cover.id.is_empty()
        {
            refs.insert(cover.id.clone());
        }
    }
    if let Some(extra) = extra_json {
        visit_json_references(extra, &mut refs);
    }
    refs
}

fn modified_ms(meta: &fs::Metadata) -> u64 {
    meta.modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map_or(0, |d| d.as_millis() as u64)
}

fn strip_sidecar_suffix(name: &str) -> &str {
    let mut base = name;
    loop {
        if let Some(stripped) = base.strip_suffix(".bak") {
            base = stripped;
        } else if let Some(stripped) = base.strip_suffix(".new") {
            base = stripped;
        } else {
            return base;
        }
    }
}

pub fn sweep_unused_objects(
    objects_dir: &Path,
    referenced: &HashSet<String>,
    now_ms: u64,
    minimum_age_ms: u64,
) -> Result<SweepResult, CoreError> {
    if !objects_dir.is_dir() {
        return Ok(SweepResult::default());
    }
    let mut result = SweepResult::default();
    for entry in fs::read_dir(objects_dir)? {
        let entry = entry?;
        let meta = fs::symlink_metadata(entry.path())?;
        if !meta.is_file() {
            continue;
        }
        let Some(name) = entry.file_name().to_str().map(str::to_owned) else {
            continue;
        };
        let id = strip_sidecar_suffix(&name);
        if !referenced.contains(id) && now_ms.saturating_sub(modified_ms(&meta)) >= minimum_age_ms {
            let size = meta.len();
            if fs::remove_file(entry.path()).is_ok() {
                result.files += 1;
                result.bytes = result.bytes.saturating_add(size);
            }
        }
    }
    Ok(result)
}

fn dir_files_size(path: &Path) -> u64 {
    let Ok(meta) = fs::symlink_metadata(path) else {
        return 0;
    };
    if meta.is_file() {
        return meta.len();
    }
    if !meta.is_dir() {
        return 0;
    }
    let mut total = 0u64;
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            total = total.saturating_add(dir_files_size(&entry.path()));
        }
    }
    total
}

pub fn sweep_temporary_cache(cache_dir: &Path, now_ms: u64) -> Result<SweepResult, CoreError> {
    if !cache_dir.is_dir() {
        return Ok(SweepResult::default());
    }
    let mut result = SweepResult::default();
    for entry in fs::read_dir(cache_dir)? {
        let entry = entry?;
        let Some(name) = entry.file_name().to_str().map(str::to_owned) else {
            continue;
        };
        if !CACHE_PREFIXES.iter().any(|prefix| name.starts_with(prefix)) {
            continue;
        }
        let path = entry.path();
        let meta = fs::symlink_metadata(&path)?;
        if now_ms.saturating_sub(modified_ms(&meta)) <= TEMP_CACHE_TTL_MS {
            continue;
        }
        let size = dir_files_size(&path);
        let removed = if meta.is_dir() {
            fs::remove_dir_all(&path).is_ok()
        } else {
            fs::remove_file(&path).is_ok()
        };
        if removed {
            result.files += 1;
            result.bytes = result.bytes.saturating_add(size);
        }
    }
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::upload::model::{CoverFileRef, JobMetadata, JobStatus};
    use tempfile::tempdir;

    #[test]
    fn references_protect_draft_covers_originals_and_undo_extra() {
        let extra = serde_json::json!({
            "chapters": [{"id": "chapter", "originalId": "raw", "sourceFile": "import"}],
            "drafts": {"new": {"model": {"coverFile": {"id": "cover"}}}},
            "txtHistory": {
                "past": [{"chapters": [{"id": "old", "originalId": "original"}]}],
                "future": [{"chapters": [{"id": "redo"}]}]
            }
        });
        let mut job = UploadJob {
            id: "j1".into(),
            status: JobStatus::Uncertain,
            chapters: Some(vec![ChapterRef {
                id: "pinned".into(),
                ..Default::default()
            }]),
            metadata: JobMetadata {
                cover_file: Some(CoverFileRef {
                    id: "job-cover".into(),
                    ..Default::default()
                }),
                ..Default::default()
            },
            ..Default::default()
        };
        let refs = collect_referenced_ids(&[job.clone()], Some(&extra));
        for key in [
            "chapter",
            "raw",
            "import",
            "cover",
            "old",
            "original",
            "redo",
            "pinned",
            "job-cover",
        ] {
            assert!(refs.contains(key), "missing {key}");
        }
        job.chapters = None;
        assert!(collect_referenced_ids(&[job], None).contains("job-cover"));
    }

    #[test]
    fn sweep_removes_only_unreferenced_old_objects_and_old_temp_prefixes() {
        let dir = tempdir().expect("tempdir");
        let objects = dir.path().join("objects");
        fs::create_dir_all(&objects).expect("mkdir");

        for name in ["keep", "keep.bak", "old", "old.bak", "old.new", "recent"] {
            fs::write(objects.join(name), b"TXT").expect("write");
        }

        let recent_ms = modified_ms(&fs::metadata(objects.join("recent")).expect("meta"));
        let now_ms = recent_ms + UNUSED_OBJECT_GRACE_MS - 1_000;
        let referenced: HashSet<String> = ["keep".into(), "recent".into()].into_iter().collect();

        // Chưa qua grace period thì không xóa gì cả.
        let before_grace =
            sweep_unused_objects(&objects, &referenced, now_ms, UNUSED_OBJECT_GRACE_MS)
                .expect("sweep");
        assert_eq!(before_grace.files, 0);

        // Ép xóa ngay ở mốc future hoặc grace = 0 trên các mục không tham chiếu.
        let mut refs_keep: HashSet<String> = ["keep".into()].into_iter().collect();
        refs_keep.insert("recent".into());
        let swept = sweep_unused_objects(&objects, &refs_keep, now_ms + 1, 0).expect("sweep");
        assert_eq!(swept.files, 3);
        assert_eq!(swept.bytes, 9);
        assert!(objects.join("keep").is_file());
        assert!(objects.join("keep.bak").is_file());
        assert!(objects.join("recent").is_file());
        assert!(!objects.join("old").exists());
        assert!(!objects.join("old.bak").exists());
        assert!(!objects.join("old.new").exists());

        let cache = dir.path().join("cache");
        fs::create_dir_all(&cache).expect("cache");
        for name in [
            "export-old",
            "WebView",
            "Cookie",
            "txt-archive-old",
            "attachment-old",
        ] {
            fs::write(cache.join(name), b"data").expect("write");
        }
        let cache_now = modified_ms(&fs::metadata(cache.join("export-old")).expect("meta"))
            + TEMP_CACHE_TTL_MS
            + 5_000;
        let cache_swept = sweep_temporary_cache(&cache, cache_now).expect("cache sweep");
        assert_eq!(cache_swept.files, 3);
        assert!(cache.join("WebView").is_file());
        assert!(cache.join("Cookie").is_file());
    }

    #[test]
    fn clone_chapters_applies_credit_without_mutating_originals_and_rolls_back_on_error() {
        let dir = tempdir().expect("tempdir");
        let store = ObjectStore::new(dir.path().to_path_buf());
        store.put_utf8("c1", "Nội dung gốc").expect("put c1");

        let cloned = store
            .clone_chapters_for_upload(
                &[ChapterRef {
                    id: "c1".into(),
                    title: "Chương 1".into(),
                    bytes: "Nội dung gốc".len() as u64,
                    ..Default::default()
                }],
                "Nguồn: Novel Studio",
                CreditPosition::End,
                true,
            )
            .expect("cloned");
        assert_ne!(cloned[0].id, "c1");
        assert_eq!(cloned[0].original_id.as_deref(), Some("c1"));
        assert_eq!(store.read_utf8("c1").expect("orig"), "Nội dung gốc");
        assert_eq!(
            store.read_utf8(&cloned[0].id).expect("clone"),
            "Nội dung gốc\n\nNguồn: Novel Studio"
        );

        let before_count = fs::read_dir(store.objects_dir()).expect("dir").count();
        assert!(
            store
                .clone_chapters_for_upload(
                    &[
                        ChapterRef {
                            id: "c1".into(),
                            ..Default::default()
                        },
                        ChapterRef {
                            id: "missing-id".into(),
                            ..Default::default()
                        },
                    ],
                    "",
                    CreditPosition::End,
                    false
                )
                .is_err()
        );
        let after_count = fs::read_dir(store.objects_dir()).expect("dir").count();
        assert_eq!(before_count, after_count);
    }
}
