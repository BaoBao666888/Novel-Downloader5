use std::collections::{BTreeMap, HashMap, HashSet};
use std::fmt::Write as _;

use serde::{Deserialize, Serialize};

use crate::upload::model::{ChapterRef, FieldOption, JobMetadata, JobMode, UploadJob};

const RECOVERY_FIELDS: [(&str, &str); 15] = [
    ("titleVi", "Tên Việt"),
    ("titleCn", "Tên Trung"),
    ("authorCn", "Tác giả"),
    ("descVi", "Giới thiệu"),
    ("coverUrl", "Link bìa"),
    ("moreLinkDesc", "Tên nguồn"),
    ("moreLinkUrl", "Link nguồn"),
    ("status", "Tình trạng"),
    ("official", "Tính chất"),
    ("gender", "Giới tính"),
    ("age", "Thời đại"),
    ("ending", "Kết thúc"),
    ("genre", "Loại hình"),
    ("tag", "Tag"),
    ("bookId", "ID truyện"),
];

const MAX_SAFE_PART_BYTES: usize = 140;

pub fn clean_text(raw: Option<&str>) -> String {
    match raw {
        None => String::new(),
        Some(value) if value.trim().eq_ignore_ascii_case("null") => String::new(),
        Some(value) => value.to_owned(),
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryMetadata {
    pub fields: Vec<(String, String)>,
    pub selected_labels: BTreeMap<String, Vec<FieldOption>>,
}

/// Lọc chỉ 15 trường metadata truyện công khai, loại bỏ toàn bộ cookie/csrf/token/options thừa.
pub fn sanitize_recovery_metadata(metadata: &JobMetadata) -> RecoveryMetadata {
    let allowed: HashSet<&str> = RECOVERY_FIELDS.iter().map(|(k, _)| *k).collect();
    let fields: Vec<(String, String)> = metadata
        .fields
        .iter()
        .filter(|(k, _)| allowed.contains(k.as_str()))
        .map(|(k, v)| (k.clone(), clean_text(Some(v))))
        .collect();

    let mut selected_labels = BTreeMap::new();
    for (key, _) in RECOVERY_FIELDS {
        let Some(saved_options) = metadata.selected_labels.get(key) else {
            continue;
        };
        let active_values: HashSet<&str> = fields
            .iter()
            .filter(|(k, _)| k == key)
            .map(|(_, v)| v.as_str())
            .collect();
        let chosen: Vec<FieldOption> = saved_options
            .iter()
            .filter_map(|opt| {
                let value = clean_text(Some(&opt.value));
                if active_values.contains(value.as_str()) {
                    Some(FieldOption {
                        value,
                        label: clean_text(Some(&opt.label)),
                        required: false,
                    })
                } else {
                    None
                }
            })
            .collect();
        if !chosen.is_empty() {
            selected_labels.insert(key.to_owned(), chosen);
        }
    }

    RecoveryMetadata {
        fields,
        selected_labels,
    }
}

pub fn safe_chapter_part(value: &str) -> String {
    let replaced: String = value
        .chars()
        .map(|ch| {
            if matches!(ch, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|') || ch.is_control()
            {
                '_'
            } else {
                ch
            }
        })
        .collect();
    let trimmed = replaced.trim().trim_matches('.');
    let mut out = String::new();
    let mut bytes = 0usize;
    for ch in trimmed.chars() {
        let len = ch.len_utf8();
        if bytes + len > MAX_SAFE_PART_BYTES {
            break;
        }
        out.push(ch);
        bytes += len;
    }
    if out.is_empty() {
        "chuong".to_owned()
    } else {
        out
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryChapterItem {
    pub title: String,
    pub filename: String,
    pub available: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryVolume {
    pub name: String,
    pub note: String,
    pub append: bool,
    pub remote_id: String,
    pub chapters: Vec<RecoveryChapterItem>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryReport {
    pub schema: u32,
    pub job_id: String,
    pub title: String,
    pub mode: JobMode,
    pub book_url: String,
    pub book_id: String,
    pub metadata: RecoveryMetadata,
    pub volumes: Vec<RecoveryVolume>,
    pub available_chapters: usize,
    pub missing_chapters: usize,
    pub text: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecoveryArchiveEntry {
    pub chapter_id: String,
    pub filename: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecoveryPlan {
    pub report: RecoveryReport,
    pub entries: Vec<RecoveryArchiveEntry>,
}

/// Lập kế hoạch khôi phục công việc chỉ đọc (dữ liệu ZIP `thong-tin.json` / `thong-tin.md` + danh sách tệp).
pub fn build_recovery_plan<F>(
    job: &UploadJob,
    legacy_chapters: &[ChapterRef],
    mut object_exists: F,
) -> RecoveryPlan
where
    F: FnMut(&str) -> bool,
{
    let clean = sanitize_recovery_metadata(&job.metadata);
    let field_first = |key: &str| -> String {
        clean
            .fields
            .iter()
            .find(|(k, _)| k == key)
            .map(|(_, v)| v.as_str())
            .unwrap_or("")
            .to_owned()
    };

    let title = [
        field_first("titleVi"),
        clean_text(Some(job.effective_book_title())),
    ]
    .into_iter()
    .find(|s| !s.trim().is_empty())
    .unwrap_or_else(|| "Công việc".to_owned());

    let mut summary = format!("{title}\n");
    for (key, label) in RECOVERY_FIELDS {
        let values: Vec<String> = clean
            .fields
            .iter()
            .filter(|(k, _)| k == key)
            .filter_map(|(_, raw_id)| {
                let id = clean_text(Some(raw_id));
                let labeled = clean
                    .selected_labels
                    .get(key)
                    .and_then(|opts| opts.iter().find(|opt| opt.value == id))
                    .map(|opt| opt.label.clone())
                    .filter(|s| !s.trim().is_empty());
                let resolved = labeled.unwrap_or(id);
                (!resolved.trim().is_empty()).then_some(resolved)
            })
            .collect();
        if !values.is_empty() {
            let _ = writeln!(summary, "\n{label}: {}", values.join(" · "));
        }
    }

    let url = [
        clean_text(job.published_url.as_deref()),
        clean_text(Some(job.effective_book_url())),
    ]
    .into_iter()
    .find(|s| !s.trim().is_empty())
    .unwrap_or_default();
    if !url.is_empty() {
        let _ = writeln!(summary, "\nLink truyện: {url}");
    }

    let pinned: &[ChapterRef] = if let Some(chapters) = &job.chapters {
        chapters.as_slice()
    } else if job.files_released {
        &[]
    } else {
        legacy_chapters
    };
    let chapter_map: HashMap<&str, &ChapterRef> =
        pinned.iter().map(|c| (c.id.as_str(), c)).collect();

    let mut entries = Vec::new();
    let mut volumes = Vec::with_capacity(job.volumes.len());
    let mut missing = 0usize;

    for (v_idx, vol) in job.volumes.iter().enumerate() {
        let mut items = Vec::with_capacity(vol.chapter_ids.len());
        for (c_idx, id) in vol.chapter_ids.iter().enumerate() {
            let chapter = chapter_map.get(id.as_str()).copied();
            let available = chapter.is_some() && object_exists(id);
            let ch_title = clean_text(chapter.map(|c| c.title.as_str()));
            let filename = format!(
                "{:03}-{:05}-{}.txt",
                v_idx + 1,
                c_idx + 1,
                safe_chapter_part(&ch_title)
            );
            items.push(RecoveryChapterItem {
                title: ch_title,
                filename: filename.clone(),
                available,
            });
            if available {
                entries.push(RecoveryArchiveEntry {
                    chapter_id: id.clone(),
                    filename,
                });
            } else {
                missing += 1;
            }
        }
        volumes.push(RecoveryVolume {
            name: clean_text(Some(&vol.name)),
            note: clean_text(Some(&vol.note)),
            append: vol.append,
            remote_id: clean_text(Some(&vol.remote_id)),
            chapters: items,
        });
    }

    let _ = writeln!(
        summary,
        "\nNội dung còn trên máy: {} / {} chương",
        entries.len(),
        entries.len() + missing
    );
    if missing > 0 {
        let _ = writeln!(
            summary,
            "Thiếu {missing} file chương. Có thể tìm lại trong snapshot nếu đã lưu."
        );
    }
    for (i, volume) in volumes.iter().enumerate() {
        let _ = writeln!(
            summary,
            "\n{}. {} · {} chương",
            i + 1,
            volume.name,
            volume.chapters.len()
        );
    }

    let report = RecoveryReport {
        schema: 1,
        job_id: job.id.clone(),
        title,
        mode: job.mode,
        book_url: url,
        book_id: clean_text(Some(&job.book_id)),
        metadata: clean,
        volumes,
        available_chapters: entries.len(),
        missing_chapters: missing,
        text: summary,
    };

    RecoveryPlan { report, entries }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::upload::model::{BookSummary, JobStatus, VolumePlan};

    fn sample_job() -> UploadJob {
        let mut selected_labels = BTreeMap::new();
        selected_labels.insert(
            "tag".into(),
            vec![
                FieldOption {
                    value: "tag-a".into(),
                    label: "Tiên hiệp".into(),
                    required: false,
                },
                FieldOption {
                    value: "not-picked".into(),
                    label: "Thừa".into(),
                    required: false,
                },
            ],
        );
        let mut extra = BTreeMap::new();
        extra.insert("token".into(), serde_json::json!("secret-token"));

        UploadJob {
            id: "job-a".into(),
            mode: JobMode::New,
            status: JobStatus::Failed,
            write_attempted: true,
            metadata: JobMetadata {
                fields: vec![
                    ("titleVi".into(), "Tên Việt".into()),
                    ("titleCn".into(), "测试".into()),
                    ("authorCn".into(), "作者".into()),
                    ("tag".into(), "tag-a".into()),
                    ("tag".into(), "tag-b".into()),
                    ("descVi".into(), "Mô tả\nDòng 2".into()),
                    ("csrf".into(), "secret-csrf".into()),
                ],
                selected_labels,
                extra,
                ..Default::default()
            },
            chapters: Some(vec![
                ChapterRef {
                    id: "a".into(),
                    title: "第1章 😀".into(),
                    ..Default::default()
                },
                ChapterRef {
                    id: "b".into(),
                    title: "第2章".into(),
                    ..Default::default()
                },
            ]),
            volumes: vec![VolumePlan {
                key: "v1".into(),
                name: "Quyển một".into(),
                note: "Ghi chú".into(),
                append: true,
                chapter_ids: vec!["a".into(), "b".into()],
                ..Default::default()
            }],
            ..Default::default()
        }
    }

    #[test]
    fn null_fields_are_blank_and_secrets_never_leak_into_recovery_plan() {
        let mut j = sample_job();
        j.published_url = None;
        j.book = Some(BookSummary {
            url: "https://wikicv.org/truyen/test".into(),
            ..Default::default()
        });
        j.metadata.fields = vec![
            ("titleVi".into(), "null".into()),
            ("descVi".into(), "null".into()),
            ("authorCn".into(), "NULL".into()),
        ];
        let null_plan = build_recovery_plan(&j, &[], |_| false);
        assert_eq!(null_plan.report.title, "Công việc");
        assert!(!null_plan.report.text.to_lowercase().contains("null"));
        assert_eq!(null_plan.report.book_url, "https://wikicv.org/truyen/test");

        let original = sample_job();
        let before = original.clone();
        let plan = build_recovery_plan(&original, &[], |_| false);
        let json = serde_json::to_string(&plan.report).expect("json");
        for secret in [
            "secret-csrf",
            "secret-token",
            "writeAttempted",
            "not-picked",
        ] {
            assert!(!json.contains(secret), "leaked {secret}");
        }
        assert!(plan.report.text.contains("Tên Trung: 测试"));
        assert!(plan.report.text.contains("Tác giả: 作者"));
        assert!(plan.report.text.contains("Tiên hiệp · tag-b"));
        assert_eq!(plan.report.metadata.fields.len(), 6);
        assert_eq!(original, before);
    }

    #[test]
    fn missing_chapters_legacy_fallback_released_guard_and_utf8_safe_filenames() {
        let original = sample_job();
        let plan = build_recovery_plan(&original, &[], |id| id == "a");
        assert_eq!(plan.report.available_chapters, 1);
        assert_eq!(plan.report.missing_chapters, 1);
        assert_eq!(plan.entries.len(), 1);
        assert_eq!(plan.report.volumes[0].note, "Ghi chú");
        assert!(plan.report.volumes[0].append);

        let mut old_job = sample_job();
        old_job.chapters = None;
        let legacy = vec![
            ChapterRef {
                id: "a".into(),
                title: "旧章".into(),
                ..Default::default()
            },
            ChapterRef {
                id: "unrelated".into(),
                title: "别的书".into(),
                ..Default::default()
            },
        ];
        assert_eq!(
            build_recovery_plan(&old_job, &legacy, |id| id == "a")
                .entries
                .len(),
            1
        );

        old_job.files_released = true;
        let released = build_recovery_plan(&old_job, &legacy, |id| id == "a");
        assert!(released.entries.is_empty());
        assert_eq!(released.report.missing_chapters, 2);

        let mut unsafe_names = sample_job();
        let bad_title = format!("../a\\b:{}", "😀".repeat(300));
        if let Some(chs) = &mut unsafe_names.chapters {
            for ch in chs {
                ch.title = bad_title.clone();
            }
        }
        let unsafe_plan = build_recovery_plan(&unsafe_names, &[], |_| true);
        let filenames: HashSet<&str> = unsafe_plan
            .entries
            .iter()
            .map(|e| e.filename.as_str())
            .collect();
        assert_eq!(filenames.len(), 2);
        for name in filenames {
            assert!(!name.contains('/'));
            assert!(!name.contains('\\'));
            assert!(!name.contains(':'));
            assert!(name.len() < 200);
        }
    }
}
