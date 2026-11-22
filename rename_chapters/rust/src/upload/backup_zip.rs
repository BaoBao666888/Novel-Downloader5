use std::collections::{BTreeMap, HashMap, HashSet};
use std::fs;
use std::io::Write;
use std::path::Path;

use serde::Deserialize;

use crate::CoreError;
use crate::upload::model::{
    ChapterRef, FieldOption, JobMetadata, JobMode, VolumePlan, VolumeStatus,
};
use crate::upload::objects::{MAX_CHAPTER_OBJECT_BYTES, ObjectStore, generate_object_id};
use crate::upload::protocol::canonical_wiki_book_path;
use crate::upload::recovery::{
    RecoveryMetadata, RecoveryPlan, RecoveryReport, clean_text, sanitize_recovery_metadata,
};

const LOCAL_FILE_HEADER_SIG: u32 = 0x0403_4B50;
const CENTRAL_DIR_HEADER_SIG: u32 = 0x0201_4B50;
const EOCD_SIG: u32 = 0x0605_4B50;
const FLAG_UTF8: u16 = 0x0800;
const FLAG_DATA_DESCRIPTOR: u16 = 0x0008;
const METHOD_STORED: u16 = 0;

const MAX_BACKUP_ZIP_BYTES: u64 = 128 * 1024 * 1024;
const MAX_BACKUP_ENTRIES: usize = 10_002;
const MAX_MANIFEST_BYTES: usize = 4 * 1024 * 1024;
const MAX_ENTRY_BYTES: usize = 16 * 1024 * 1024;
const MAX_TOTAL_UNPACK_BYTES: u64 = 256 * 1024 * 1024;
const MAX_FIELDS_COUNT: usize = 5_000;
const MAX_VOLUMES_COUNT: usize = 10_000;
const MAX_CHAPTERS_COUNT: usize = 10_000;

pub fn crc32_bytes(data: &[u8]) -> u32 {
    let mut crc = 0xFFFF_FFFFu32;
    for &byte in data {
        crc ^= u32::from(byte);
        for _ in 0..8 {
            let mask = (crc & 1).wrapping_neg();
            crc = (crc >> 1) ^ (0xEDB8_8320 & mask);
        }
    }
    !crc
}

pub fn safe_zip_name(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 250
        && !name.contains('/')
        && !name.contains('\\')
        && name != ".."
        && name != "."
        && !name.chars().any(|c| (c as u32) < 32)
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ZipStoredEntry {
    pub name: String,
    pub data: Vec<u8>,
}

struct CentralRecord<'a> {
    name: &'a [u8],
    crc: u32,
    size: u32,
    offset: u32,
}

/// Ghi tệp ZIP chuẩn Stored (không nén) tương thích đa nền tảng và UTF-8 filename.
pub fn write_stored_zip<W: Write>(
    writer: &mut W,
    entries: &[ZipStoredEntry],
) -> Result<(), CoreError> {
    if entries.len() > u16::MAX as usize {
        return Err("ZIP có quá nhiều mục.".into());
    }
    let mut seen = HashSet::with_capacity(entries.len());
    let mut records = Vec::with_capacity(entries.len());
    let mut cursor = 0u64;

    for entry in entries {
        if !safe_zip_name(&entry.name) || !seen.insert(entry.name.as_str()) {
            return Err("Tên file ZIP không hợp lệ hoặc trùng.".into());
        }
        let name_bytes = entry.name.as_bytes();
        let name_len = u16::try_from(name_bytes.len()).map_err(|_| "Tên file ZIP quá dài.")?;
        let data_len = u32::try_from(entry.data.len()).map_err(|_| "Nội dung file quá 4 GB.")?;
        let offset = u32::try_from(cursor).map_err(|_| "Kích thước ZIP vượt giới hạn 4 GB.")?;
        let crc = crc32_bytes(&entry.data);

        let mut local = [0u8; 30];
        local[0..4].copy_from_slice(&LOCAL_FILE_HEADER_SIG.to_le_bytes());
        local[4..6].copy_from_slice(&20u16.to_le_bytes());
        local[6..8].copy_from_slice(&FLAG_UTF8.to_le_bytes());
        local[8..10].copy_from_slice(&METHOD_STORED.to_le_bytes());
        local[14..18].copy_from_slice(&crc.to_le_bytes());
        local[18..22].copy_from_slice(&data_len.to_le_bytes());
        local[22..26].copy_from_slice(&data_len.to_le_bytes());
        local[26..28].copy_from_slice(&name_len.to_le_bytes());

        writer.write_all(&local)?;
        writer.write_all(name_bytes)?;
        writer.write_all(&entry.data)?;

        cursor = cursor
            .checked_add(30 + name_bytes.len() as u64 + entry.data.len() as u64)
            .ok_or("Kích thước ZIP vượt giới hạn.")?;
        records.push(CentralRecord {
            name: name_bytes,
            crc,
            size: data_len,
            offset,
        });
    }

    let cd_offset = u32::try_from(cursor).map_err(|_| "Kích thước ZIP vượt giới hạn.")?;
    let mut cd_size = 0u64;
    for rec in &records {
        let name_len = rec.name.len() as u16;
        let mut cd = [0u8; 46];
        cd[0..4].copy_from_slice(&CENTRAL_DIR_HEADER_SIG.to_le_bytes());
        cd[4..6].copy_from_slice(&20u16.to_le_bytes());
        cd[6..8].copy_from_slice(&20u16.to_le_bytes());
        cd[8..10].copy_from_slice(&FLAG_UTF8.to_le_bytes());
        cd[10..12].copy_from_slice(&METHOD_STORED.to_le_bytes());
        cd[16..20].copy_from_slice(&rec.crc.to_le_bytes());
        cd[20..24].copy_from_slice(&rec.size.to_le_bytes());
        cd[24..28].copy_from_slice(&rec.size.to_le_bytes());
        cd[28..30].copy_from_slice(&name_len.to_le_bytes());
        cd[42..46].copy_from_slice(&rec.offset.to_le_bytes());

        writer.write_all(&cd)?;
        writer.write_all(rec.name)?;
        cd_size += 46 + rec.name.len() as u64;
    }

    let cd_size_u32 = u32::try_from(cd_size).map_err(|_| "Thư mục ZIP quá lớn.")?;
    let count_u16 = records.len() as u16;
    let mut eocd = [0u8; 22];
    eocd[0..4].copy_from_slice(&EOCD_SIG.to_le_bytes());
    eocd[8..10].copy_from_slice(&count_u16.to_le_bytes());
    eocd[10..12].copy_from_slice(&count_u16.to_le_bytes());
    eocd[12..16].copy_from_slice(&cd_size_u32.to_le_bytes());
    eocd[16..20].copy_from_slice(&cd_offset.to_le_bytes());
    writer.write_all(&eocd)?;
    Ok(())
}

fn read_u16_le(buf: &[u8], off: usize) -> Result<u16, CoreError> {
    let slice = buf.get(off..off + 2).ok_or("File ZIP bị cắt hoặc hỏng.")?;
    Ok(u16::from_le_bytes([slice[0], slice[1]]))
}

fn read_u32_le(buf: &[u8], off: usize) -> Result<u32, CoreError> {
    let slice = buf.get(off..off + 4).ok_or("File ZIP bị cắt hoặc hỏng.")?;
    Ok(u32::from_le_bytes([slice[0], slice[1], slice[2], slice[3]]))
}

pub fn read_stored_zip(
    bytes: &[u8],
    max_entries: usize,
    max_total_bytes: u64,
) -> Result<Vec<ZipStoredEntry>, CoreError> {
    if bytes.len() < 22 {
        return Err("File ZIP không hợp lệ.".into());
    }
    let min_eocd = bytes.len().saturating_sub(22 + 65_535);
    let mut eocd_pos = None;
    for pos in (min_eocd..=bytes.len() - 22).rev() {
        if read_u32_le(bytes, pos)? == EOCD_SIG {
            let comment_len = read_u16_le(bytes, pos + 20)? as usize;
            if pos + 22 + comment_len == bytes.len() {
                eocd_pos = Some(pos);
                break;
            }
        }
    }
    let eocd_pos = eocd_pos.ok_or("Không tìm thấy cấu trúc kết thúc ZIP.")?;
    let disk = read_u16_le(bytes, eocd_pos + 4)?;
    let cd_disk = read_u16_le(bytes, eocd_pos + 6)?;
    let entries_disk = read_u16_le(bytes, eocd_pos + 8)? as usize;
    let entries_total = read_u16_le(bytes, eocd_pos + 10)? as usize;
    if disk != 0 || cd_disk != 0 || entries_disk != entries_total {
        return Err("Không hỗ trợ ZIP chia nhiều tập.".into());
    }
    if entries_total > max_entries {
        return Err("ZIP có quá nhiều mục.".into());
    }
    let cd_size = read_u32_le(bytes, eocd_pos + 12)? as usize;
    let cd_offset = read_u32_le(bytes, eocd_pos + 16)? as usize;
    if cd_offset.saturating_add(cd_size) > eocd_pos {
        return Err("Cấu trúc thư mục ZIP không hợp lệ.".into());
    }

    let mut pos = cd_offset;
    let cd_end = cd_offset + cd_size;
    let mut seen = HashSet::with_capacity(entries_total);
    let mut total_bytes = 0u64;
    let mut out = Vec::with_capacity(entries_total);

    for _ in 0..entries_total {
        if pos + 46 > cd_end || read_u32_le(bytes, pos)? != CENTRAL_DIR_HEADER_SIG {
            return Err("Thư mục ZIP bị hỏng.".into());
        }
        let flags = read_u16_le(bytes, pos + 8)?;
        let method = read_u16_le(bytes, pos + 10)?;
        if method != METHOD_STORED {
            return Err("Chỉ hỗ trợ ZIP backup lưu trực tiếp (Stored).".into());
        }
        let crc = read_u32_le(bytes, pos + 16)?;
        let comp_size = read_u32_le(bytes, pos + 20)? as usize;
        let uncomp_size = read_u32_le(bytes, pos + 24)? as usize;
        if comp_size != uncomp_size {
            return Err("Kích thước nén trong ZIP không khớp.".into());
        }
        let name_len = read_u16_le(bytes, pos + 28)? as usize;
        let extra_len = read_u16_le(bytes, pos + 30)? as usize;
        let comment_len = read_u16_le(bytes, pos + 32)? as usize;
        let ext_attr = read_u32_le(bytes, pos + 38)?;
        let local_offset = read_u32_le(bytes, pos + 42)? as usize;

        if pos + 46 + name_len + extra_len + comment_len > cd_end {
            return Err("Thư mục ZIP vượt biên dữ liệu.".into());
        }
        let name_raw = &bytes[pos + 46..pos + 46 + name_len];
        let name = std::str::from_utf8(name_raw)
            .map_err(|_| "Tên file ZIP không phải UTF-8 hợp lệ.")?
            .to_owned();
        if (ext_attr & 0x10) != 0 || !safe_zip_name(&name) || !seen.insert(name.clone()) {
            return Err("Tên file ZIP không hợp lệ hoặc trùng.".into());
        }
        pos += 46 + name_len + extra_len + comment_len;

        if local_offset + 30 > cd_offset
            || read_u32_le(bytes, local_offset)? != LOCAL_FILE_HEADER_SIG
        {
            return Err("Header file trong ZIP bị hỏng.".into());
        }
        let local_name_len = read_u16_le(bytes, local_offset + 26)? as usize;
        let local_extra_len = read_u16_le(bytes, local_offset + 28)? as usize;
        let data_start = local_offset
            .checked_add(30)
            .and_then(|v| v.checked_add(local_name_len))
            .and_then(|v| v.checked_add(local_extra_len))
            .ok_or("Vị trí dữ liệu ZIP không hợp lệ.")?;
        let data_end = data_start
            .checked_add(uncomp_size)
            .ok_or("Kích thước file ZIP không hợp lệ.")?;
        if data_end > cd_offset {
            return Err("Dữ liệu file trong ZIP vượt phạm vi.".into());
        }
        if bytes.get(local_offset + 30..local_offset + 30 + local_name_len) != Some(name_raw) {
            return Err("Header tên file trong ZIP không khớp.".into());
        }

        total_bytes = total_bytes
            .checked_add(uncomp_size as u64)
            .ok_or("Nội dung ZIP vượt giới hạn.")?;
        if total_bytes > max_total_bytes {
            return Err("Nội dung ZIP vượt giới hạn.".into());
        }

        let payload = &bytes[data_start..data_end];
        let actual_crc = crc32_bytes(payload);
        if actual_crc != crc {
            return Err("File ZIP bị hỏng.".into());
        }
        if (flags & FLAG_DATA_DESCRIPTOR) == 0 && read_u32_le(bytes, local_offset + 14)? != crc {
            return Err("File ZIP bị hỏng.".into());
        }

        out.push(ZipStoredEntry {
            name,
            data: payload.to_vec(),
        });
    }

    Ok(out)
}

pub fn export_job_recovery_zip(
    output_path: &Path,
    plan: &RecoveryPlan,
    objects: &ObjectStore,
) -> Result<(), CoreError> {
    let mut entries = Vec::with_capacity(2 + plan.entries.len());
    let report_json = serde_json::to_vec_pretty(&plan.report)?;
    entries.push(ZipStoredEntry {
        name: "thong-tin.json".to_owned(),
        data: report_json,
    });
    entries.push(ZipStoredEntry {
        name: "thong-tin.md".to_owned(),
        data: plan.report.text.as_bytes().to_vec(),
    });

    for entry in &plan.entries {
        let data = objects.read_bytes(&entry.chapter_id)?;
        entries.push(ZipStoredEntry {
            name: entry.filename.clone(),
            data,
        });
    }

    let parent = output_path
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."));
    fs::create_dir_all(parent)?;
    let mut temp = tempfile::NamedTempFile::new_in(parent)?;
    write_stored_zip(&mut temp, &entries)?;
    temp.flush()?;
    temp.as_file().sync_all()?;
    temp.persist(output_path).map_err(|err| err.error)?;
    Ok(())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawBackupChapter {
    #[serde(default)]
    title: serde_json::Value,
    #[serde(default)]
    filename: serde_json::Value,
    #[serde(default)]
    available: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawBackupVolume {
    #[serde(default)]
    name: serde_json::Value,
    #[serde(default)]
    note: serde_json::Value,
    #[serde(default)]
    append: bool,
    #[serde(default)]
    remote_id: serde_json::Value,
    #[serde(default)]
    chapters: Vec<RawBackupChapter>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawBackupMetadata {
    #[serde(default)]
    fields: Vec<Vec<serde_json::Value>>,
    #[serde(default)]
    selected_labels: BTreeMap<String, Vec<RawBackupLabel>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawBackupLabel {
    #[serde(default)]
    value: serde_json::Value,
    #[serde(default)]
    label: serde_json::Value,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawBackupManifest {
    #[serde(default)]
    schema: u32,
    #[serde(default)]
    job_id: serde_json::Value,
    #[serde(default)]
    title: serde_json::Value,
    #[serde(default)]
    mode: String,
    #[serde(default)]
    book_url: serde_json::Value,
    #[serde(default)]
    book_id: serde_json::Value,
    metadata: RawBackupMetadata,
    volumes: Vec<RawBackupVolume>,
    #[serde(default)]
    text: serde_json::Value,
}

fn json_text(value: &serde_json::Value) -> String {
    match value {
        serde_json::Value::Null => String::new(),
        serde_json::Value::String(s) => clean_text(Some(s)),
        other => clean_text(Some(&other.to_string())),
    }
}

fn validate_and_inspect_entries(
    entries: &[ZipStoredEntry],
    allowed_host: &str,
) -> Result<(RecoveryReport, HashMap<String, usize>), CoreError> {
    if entries.len() > MAX_BACKUP_ENTRIES {
        return Err("ZIP có quá nhiều mục.".into());
    }
    let mut by_name = HashMap::with_capacity(entries.len());
    for (idx, entry) in entries.iter().enumerate() {
        let limit = if entry.name == "thong-tin.json" {
            MAX_MANIFEST_BYTES
        } else {
            MAX_ENTRY_BYTES
        };
        if entry.data.len() > limit {
            return Err("Nội dung ZIP vượt giới hạn.".into());
        }
        by_name.insert(entry.name.as_str(), idx);
    }

    let manifest_idx = *by_name
        .get("thong-tin.json")
        .ok_or("ZIP không có thông tin công việc. Chọn ZIP xuất từ Lấy lại dữ liệu.")?;
    let manifest_str = std::str::from_utf8(&entries[manifest_idx].data)
        .map_err(|_| "Manifest công việc không phải UTF-8 hợp lệ.")?;
    let raw: RawBackupManifest =
        serde_json::from_str(manifest_str).map_err(|_| "Bản sao công việc không được hỗ trợ.")?;

    if raw.schema != 1 || !matches!(raw.mode.as_str(), "new" | "existing") {
        return Err("Bản sao công việc không được hỗ trợ.".into());
    }
    if raw.metadata.fields.len() > MAX_FIELDS_COUNT {
        return Err("Thông tin truyện quá lớn.".into());
    }
    if raw.volumes.len() > MAX_VOLUMES_COUNT {
        return Err("Có quá nhiều quyển.".into());
    }

    let meta_input = JobMetadata {
        fields: raw
            .metadata
            .fields
            .iter()
            .filter_map(|pair| {
                let key = pair.first()?.as_str()?.to_owned();
                let val = pair.get(1).map(json_text).unwrap_or_default();
                Some((key, val))
            })
            .collect(),
        selected_labels: raw
            .metadata
            .selected_labels
            .iter()
            .map(|(k, opts)| {
                (
                    k.clone(),
                    opts.iter()
                        .map(|o| FieldOption {
                            value: json_text(&o.value),
                            label: json_text(&o.label),
                            required: false,
                        })
                        .collect(),
                )
            })
            .collect(),
        ..Default::default()
    };
    let clean_meta: RecoveryMetadata = sanitize_recovery_metadata(&meta_input);

    let mut available = 0usize;
    let mut missing = 0usize;
    let mut referenced = HashSet::new();
    let mut volumes = Vec::with_capacity(raw.volumes.len());

    for raw_vol in &raw.volumes {
        let mut items = Vec::with_capacity(raw_vol.chapters.len());
        for raw_ch in &raw_vol.chapters {
            if available + missing >= MAX_CHAPTERS_COUNT {
                return Err("Có quá nhiều chương.".into());
            }
            let filename = json_text(&raw_ch.filename);
            if !safe_zip_name(&filename)
                || !filename.to_ascii_lowercase().ends_with(".txt")
                || !referenced.insert(filename.clone())
            {
                return Err("Tên file chương không hợp lệ hoặc trùng.".into());
            }
            let zip_idx = by_name.get(filename.as_str()).copied();
            if raw_ch.available && zip_idx.is_none() {
                return Err(format!("ZIP thiếu file chương đã khai báo: {filename}").into());
            }
            if !raw_ch.available && zip_idx.is_some() {
                return Err("Thông tin file chương trong ZIP không khớp.".into());
            }
            if let Some(idx) = zip_idx {
                if entries[idx].data.len() > MAX_CHAPTER_OBJECT_BYTES {
                    return Err("Một chương vượt 2 MB.".into());
                }
                available += 1;
            } else {
                missing += 1;
            }
            items.push(crate::upload::recovery::RecoveryChapterItem {
                title: json_text(&raw_ch.title),
                filename,
                available: raw_ch.available,
            });
        }
        volumes.push(crate::upload::recovery::RecoveryVolume {
            name: json_text(&raw_vol.name),
            note: json_text(&raw_vol.note),
            append: raw_vol.append,
            remote_id: json_text(&raw_vol.remote_id),
            chapters: items,
        });
    }

    for name in by_name.keys() {
        if *name != "thong-tin.json" && *name != "thong-tin.md" && !referenced.contains(*name) {
            return Err("ZIP chứa file ngoài bản sao công việc.".into());
        }
    }

    let mode = if raw.mode == "existing" {
        JobMode::Existing
    } else {
        JobMode::New
    };
    let book_url = json_text(&raw.book_url);
    if mode == JobMode::Existing
        && !book_url.is_empty()
        && canonical_wiki_book_path(&book_url, allowed_host).is_err()
    {
        return Err("Thiếu link truyện WikiCV hợp lệ.".into());
    }

    let title = {
        let t = json_text(&raw.title);
        if t.trim().is_empty() {
            "Dữ liệu công việc".to_owned()
        } else {
            t
        }
    };
    let report = RecoveryReport {
        schema: 1,
        job_id: json_text(&raw.job_id),
        title,
        mode,
        book_url,
        book_id: json_text(&raw.book_id),
        metadata: clean_meta,
        volumes,
        available_chapters: available,
        missing_chapters: missing,
        text: json_text(&raw.text),
    };

    let entry_indices = by_name
        .into_iter()
        .map(|(k, v)| (k.to_owned(), v))
        .collect();
    Ok((report, entry_indices))
}

pub fn inspect_job_backup_zip(
    zip_path: &Path,
    allowed_host: &str,
) -> Result<RecoveryReport, CoreError> {
    let meta = fs::metadata(zip_path)?;
    if meta.len() > MAX_BACKUP_ZIP_BYTES {
        return Err("ZIP vượt 128 MB.".into());
    }
    let bytes = fs::read(zip_path)?;
    let entries = read_stored_zip(&bytes, MAX_BACKUP_ENTRIES, MAX_TOTAL_UNPACK_BYTES)?;
    let (report, _) = validate_and_inspect_entries(&entries, allowed_host)?;
    Ok(report)
}

#[derive(Debug, Clone, PartialEq)]
pub struct RestoredJobBackup {
    pub report: RecoveryReport,
    pub chapters: Vec<ChapterRef>,
    pub volumes: Vec<VolumePlan>,
}

/// Khôi phục dữ liệu công việc từ ZIP backup vào `ObjectStore`, rollback toàn bộ nếu bất kỳ tệp nào hỏng UTF-8.
pub fn restore_job_backup_zip(
    zip_path: &Path,
    objects: &ObjectStore,
    allowed_host: &str,
) -> Result<RestoredJobBackup, CoreError> {
    let meta = fs::metadata(zip_path)?;
    if meta.len() > MAX_BACKUP_ZIP_BYTES {
        return Err("ZIP vượt 128 MB.".into());
    }
    let bytes = fs::read(zip_path)?;
    let entries = read_stored_zip(&bytes, MAX_BACKUP_ENTRIES, MAX_TOTAL_UNPACK_BYTES)?;
    let (report, by_name) = validate_and_inspect_entries(&entries, allowed_host)?;

    let mut created_ids = Vec::new();
    let mut chapters = Vec::new();
    let mut volumes = Vec::new();

    let result: Result<(), CoreError> = (|| {
        for (v_idx, vol) in report.volumes.iter().enumerate() {
            let mut vol_chapter_ids = Vec::new();
            for item in &vol.chapters {
                if !item.available {
                    continue;
                }
                let entry_idx = *by_name
                    .get(&item.filename)
                    .ok_or("Thiếu file chương trong ZIP.")?;
                let payload = &entries[entry_idx].data;
                std::str::from_utf8(payload)
                    .map_err(|_| "File chương trong ZIP không phải UTF-8 hợp lệ.")?;

                let id = generate_object_id("imp");
                if objects.exists(&id) {
                    return Err("Trùng ID đối tượng khôi phục.".into());
                }
                created_ids.push(id.clone());
                let size = objects.put_bytes(&id, payload)?;

                let title = if item.title.trim().is_empty() {
                    item.filename
                        .strip_suffix(".txt")
                        .or_else(|| item.filename.strip_suffix(".TXT"))
                        .unwrap_or(&item.filename)
                        .to_owned()
                } else {
                    item.title.clone()
                };

                chapters.push(ChapterRef {
                    id: id.clone(),
                    title,
                    number: None,
                    bytes: size,
                    source_file: Some(id.clone()),
                    original_id: Some(id.clone()),
                });
                vol_chapter_ids.push(id);
            }

            if !vol_chapter_ids.is_empty() {
                volumes.push(VolumePlan {
                    key: generate_object_id(&format!("vol{}", v_idx + 1)),
                    name: vol.name.clone(),
                    note: vol.note.clone(),
                    append: vol.append,
                    can_append: vol.append,
                    remote_id: vol.remote_id.clone(),
                    status: VolumeStatus::Planned,
                    chapter_ids: vol_chapter_ids,
                    ..Default::default()
                });
            }
        }
        Ok(())
    })();

    if let Err(err) = result {
        for id in created_ids {
            let _ = objects.delete(&id);
        }
        return Err(err);
    }

    Ok(RestoredJobBackup {
        report,
        chapters,
        volumes,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::upload::model::{BookSummary, JobStatus, UploadJob};
    use crate::upload::protocol::DEFAULT_WIKI_HOST;
    use crate::upload::recovery::build_recovery_plan;
    use tempfile::tempdir;

    #[test]
    fn crc32_matches_standard_vector() {
        assert_eq!(crc32_bytes(b"123456789"), 0xCBF4_3926);
    }

    #[test]
    fn export_and_restore_preserve_exact_bytes_and_metadata_while_stripping_secrets() {
        let dir = tempdir().expect("tempdir");
        let objects = ObjectStore::new(dir.path().to_path_buf());
        let body = "\u{FEFF}第1章\r\n正文😀\u{200b}\r\n".as_bytes();
        objects.put_bytes("a", body).expect("put a");

        let mut selected_labels = BTreeMap::new();
        selected_labels.insert(
            "tag".into(),
            vec![FieldOption {
                value: "t1".into(),
                label: "Tiên hiệp".into(),
                required: false,
            }],
        );
        let mut extra = BTreeMap::new();
        extra.insert("token".into(), serde_json::json!("secret-token"));

        let job = UploadJob {
            id: "j".into(),
            mode: JobMode::Existing,
            status: JobStatus::Failed,
            book_id: "abc".into(),
            book: Some(BookSummary {
                url: "https://wikicv.org/truyen/test".into(),
                ..Default::default()
            }),
            metadata: JobMetadata {
                fields: vec![
                    ("titleVi".into(), "Tên".into()),
                    ("tag".into(), "t1".into()),
                    ("csrf".into(), "secret-csrf".into()),
                ],
                selected_labels,
                extra,
                ..Default::default()
            },
            chapters: Some(vec![ChapterRef {
                id: "a".into(),
                title: "第1章".into(),
                bytes: body.len() as u64,
                ..Default::default()
            }]),
            volumes: vec![VolumePlan {
                key: "v1".into(),
                name: "Một".into(),
                note: "1-1".into(),
                append: true,
                remote_id: "volume".into(),
                chapter_ids: vec!["a".into()],
                ..Default::default()
            }],
            ..Default::default()
        };

        let plan = build_recovery_plan(&job, &[], |id| objects.exists(id));
        let zip_path = dir.path().join("export.zip");
        export_job_recovery_zip(&zip_path, &plan, &objects).expect("export");

        let target_store = ObjectStore::new(dir.path().join("restored_ws"));
        let restored =
            restore_job_backup_zip(&zip_path, &target_store, DEFAULT_WIKI_HOST).expect("restore");
        assert_eq!(restored.chapters.len(), 1);
        assert_eq!(
            target_store
                .read_bytes(&restored.chapters[0].id)
                .expect("read"),
            body
        );
        assert!(restored.volumes[0].append);
        assert_eq!(restored.volumes[0].remote_id, "volume");
        assert_eq!(restored.volumes[0].note, "1-1");
        assert_eq!(restored.report.book_id, "abc");
        let meta_json = serde_json::to_string(&restored.report.metadata).expect("json");
        assert!(!meta_json.contains("secret"));
        assert!(meta_json.contains("Tiên hiệp"));
        // Bản gốc không bị thay đổi.
        assert_eq!(objects.read_bytes("a").expect("orig"), body);
    }

    #[test]
    fn failed_export_or_malformed_zip_never_leaves_partial_files() {
        let dir = tempdir().expect("tempdir");
        let objects = ObjectStore::new(dir.path().to_path_buf());
        objects.put_utf8("a", "正文").expect("put");

        let job = UploadJob {
            id: "j".into(),
            mode: JobMode::New,
            metadata: JobMetadata {
                fields: vec![("titleVi".into(), "Truyện".into())],
                ..Default::default()
            },
            chapters: Some(vec![ChapterRef {
                id: "a".into(),
                title: "第1章".into(),
                bytes: 6,
                ..Default::default()
            }]),
            volumes: vec![VolumePlan {
                key: "v1".into(),
                name: "Một".into(),
                chapter_ids: vec!["a".into()],
                ..Default::default()
            }],
            ..Default::default()
        };

        let plan = build_recovery_plan(&job, &[], |id| objects.exists(id));
        objects.delete("a").expect("del");
        let export_out = dir.path().join("fail.zip");
        assert!(export_job_recovery_zip(&export_out, &plan, &objects).is_err());
        assert!(!export_out.exists());

        // Job mất mọi chương vẫn xuất được ZIP chỉ chứa metadata.
        let metadata_only_plan = build_recovery_plan(&job, &[], |id| objects.exists(id));
        let meta_zip = dir.path().join("metadata.zip");
        export_job_recovery_zip(&meta_zip, &metadata_only_plan, &objects).expect("meta zip");
        let inspected = inspect_job_backup_zip(&meta_zip, DEFAULT_WIKI_HOST).expect("inspect");
        assert_eq!(inspected.available_chapters, 0);
        assert_eq!(inspected.missing_chapters, 1);

        let write_custom_zip = |name: &str, entries: Vec<ZipStoredEntry>| {
            let p = dir.path().join(name);
            let mut buf = Vec::new();
            write_stored_zip(&mut buf, &entries).expect("zip");
            fs::write(&p, buf).expect("write");
            p
        };

        let valid_manifest = r#"{"schema":1,"mode":"new","title":"Truyện","metadata":{"fields":[["titleVi","Truyện"]]},"volumes":[{"name":"Một","append":false,"chapters":[{"title":"第1章","filename":"001.txt","available":true}]}]}"#.as_bytes();

        // Invalid UTF-8 rolls back created objects completely.
        let bad_utf8_zip = write_custom_zip(
            "bad_utf8.zip",
            vec![
                ZipStoredEntry {
                    name: "thong-tin.json".into(),
                    data: valid_manifest.to_vec(),
                },
                ZipStoredEntry {
                    name: "001.txt".into(),
                    data: vec![0xC3, 0x28],
                },
            ],
        );
        let rollback_store = ObjectStore::new(dir.path().join("rollback_ws"));
        assert!(restore_job_backup_zip(&bad_utf8_zip, &rollback_store, DEFAULT_WIKI_HOST).is_err());
        assert!(
            !rollback_store.objects_dir().exists()
                || fs::read_dir(rollback_store.objects_dir())
                    .expect("dir")
                    .count()
                    == 0
        );

        // Unlisted file rejected.
        let unlisted_zip = write_custom_zip(
            "unlisted.zip",
            vec![
                ZipStoredEntry {
                    name: "thong-tin.json".into(),
                    data: valid_manifest.to_vec(),
                },
                ZipStoredEntry {
                    name: "001.txt".into(),
                    data: b"ok".to_vec(),
                },
                ZipStoredEntry {
                    name: "extra.txt".into(),
                    data: b"bad".to_vec(),
                },
            ],
        );
        assert!(inspect_job_backup_zip(&unlisted_zip, DEFAULT_WIKI_HOST).is_err());

        // Missing promised file rejected.
        let missing_promised = write_custom_zip(
            "missing.zip",
            vec![ZipStoredEntry {
                name: "thong-tin.json".into(),
                data: valid_manifest.to_vec(),
            }],
        );
        assert!(inspect_job_backup_zip(&missing_promised, DEFAULT_WIKI_HOST).is_err());

        // Unknown schema rejected.
        let bad_schema = br#"{"schema":999,"mode":"new","metadata":{"fields":[]},"volumes":[]}"#;
        let bad_schema_zip = write_custom_zip(
            "schema.zip",
            vec![ZipStoredEntry {
                name: "thong-tin.json".into(),
                data: bad_schema.to_vec(),
            }],
        );
        assert!(inspect_job_backup_zip(&bad_schema_zip, DEFAULT_WIKI_HOST).is_err());

        // Traversal entry cannot even be written or read.
        let mut raw_traversal = Vec::new();
        assert!(
            write_stored_zip(
                &mut raw_traversal,
                &[ZipStoredEntry {
                    name: "../escape.txt".into(),
                    data: b"x".to_vec(),
                }]
            )
            .is_err()
        );

        // Corrupted header filename and corrupted payload CRC detected.
        let ok_zip_bytes = fs::read(&meta_zip).expect("read");
        for offset in [35usize, 60usize] {
            let mut corrupt_bytes = ok_zip_bytes.clone();
            if let Some(byte) = corrupt_bytes.get_mut(offset) {
                *byte ^= 0xFF;
            }
            let corrupt_path = dir.path().join(format!("corrupt_{offset}.zip"));
            fs::write(&corrupt_path, corrupt_bytes).expect("write");
            assert!(inspect_job_backup_zip(&corrupt_path, DEFAULT_WIKI_HOST).is_err());
        }
    }
}
