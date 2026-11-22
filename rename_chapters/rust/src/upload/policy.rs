use std::collections::{HashMap, HashSet};
use std::sync::Mutex;

use serde::Serialize;

use crate::CoreError;
use crate::upload::model::{JobMode, JobStatus, UploadJob, VolumeStatus};
use crate::upload::protocol::canonical_wiki_book_path;

pub const MIN_SCHEDULE_DELAY_MS: u64 = 30_000;
pub const MAX_SCHEDULE_MS: u64 = 366 * 86_400_000;

pub fn is_parent_status(status: JobStatus) -> bool {
    matches!(
        status,
        JobStatus::Scheduled
            | JobStatus::Linked
            | JobStatus::Queued
            | JobStatus::Running
            | JobStatus::Sending
            | JobStatus::Verifying
            | JobStatus::Waiting
            | JobStatus::Uncertain
    )
}

/// Xóa danh sách lựa chọn form cồng kềnh nhưng giữ toàn bộ lựa chọn đã gán và tệp đã ghim.
pub fn compact_job_metadata(job: &mut UploadJob) {
    job.metadata.options.clear();
    job.metadata.extra.clear();
}

pub fn can_start(job: &UploadJob, expected_revision: u64) -> bool {
    job.schedule_revision == expected_revision
        && matches!(job.status, JobStatus::Planned | JobStatus::Failed)
}

/// Hợp nhất danh sách job từ màn hình foreground với tiến độ mới nhất từ worker nền.
pub fn merge_jobs(
    current: &[UploadJob],
    mut incoming: Vec<UploadJob>,
    active_owner: Option<&str>,
) -> Vec<UploadJob> {
    let latest: HashMap<&str, &UploadJob> =
        current.iter().map(|job| (job.id.as_str(), job)).collect();

    for job in &mut incoming {
        if let Some(old) = latest.get(job.id.as_str()) {
            let owned = active_owner.is_some_and(|owner| owner == format!("scheduled:{}", job.id));
            if old.schedule_revision > job.schedule_revision || owned {
                *job = (*old).clone();
            }
        }
        compact_job_metadata(job);
    }

    if let Some(active_id) = active_owner.and_then(|o| o.strip_prefix("scheduled:"))
        && !incoming.iter().any(|job| job.id == active_id)
        && let Some(old) = latest.get(active_id)
    {
        let mut retained = (*old).clone();
        compact_job_metadata(&mut retained);
        incoming.push(retained);
    }

    incoming
}

fn is_identity_whitespace(c: char) -> bool {
    c.is_whitespace()
        || matches!(
            c,
            '\u{00A0}' | '\u{1680}' | '\u{180E}' | '\u{2000}'
                ..='\u{200A}' | '\u{202F}' | '\u{205F}' | '\u{3000}' | '\u{FEFF}'
        )
}

fn normalize_identity_part(raw: &str) -> String {
    let mut mapped = String::with_capacity(raw.len());
    for ch in raw.chars() {
        let converted = match ch {
            '\u{FF01}'..='\u{FF5E}' => char::from_u32(ch as u32 - 0xFEE0).unwrap_or(ch),
            '\u{3000}' => ' ',
            _ => ch,
        };
        if !is_identity_whitespace(converted) {
            for lower in converted.to_lowercase() {
                mapped.push(lower);
            }
        }
    }
    mapped
}

#[derive(Serialize)]
struct NewIdentity<'a> {
    title: &'a str,
    author: &'a str,
}

/// Tạo khóa nhận diện chuẩn cho truyện để chống hẹn trùng hoặc gửi đè khi đang chờ đối chiếu.
pub fn job_identity(job: &UploadJob, allowed_host: &str) -> Result<String, CoreError> {
    if job.mode == JobMode::Existing {
        let path = canonical_wiki_book_path(job.effective_book_url(), allowed_host)?;
        return Ok(format!("book:{path}"));
    }
    let find_field = |key: &str| -> String {
        job.metadata
            .fields
            .iter()
            .find(|(k, _)| k == key)
            .map(|(_, v)| normalize_identity_part(v))
            .unwrap_or_default()
    };
    let title = find_field("titleCn");
    let author = find_field("authorCn");
    if title.is_empty() || author.is_empty() {
        return Err("Hẹn đăng truyện mới cần tên truyện và tác giả tiếng Trung.".into());
    }
    let json = serde_json::to_string(&NewIdentity {
        title: &title,
        author: &author,
    })?;
    Ok(format!("new:{json}"))
}

pub fn validate_prepared(job: &UploadJob, allowed_host: &str) -> Result<String, CoreError> {
    if job.account.trim().is_empty()
        || !matches!(job.status, JobStatus::Planned | JobStatus::Scheduled)
    {
        return Err("Công việc không ở trạng thái sẵn sàng để hẹn giờ.".into());
    }
    if job.write_attempted || job.publish_attempted_at != 0 || job.publish_accepted {
        return Err("Công việc đã gửi dữ liệu, cần đối chiếu trước.".into());
    }
    if job.volumes.is_empty() {
        return Err("Chưa có quyển để hẹn đăng.".into());
    }
    for volume in &job.volumes {
        if volume.status != VolumeStatus::Planned
            || volume.upload_attempted_at != 0
            || volume.create_attempted_at != 0
        {
            return Err("Công việc đã gửi dữ liệu, cần đối chiếu trước.".into());
        }
    }
    if job.chapters.as_ref().is_none_or(Vec::is_empty) {
        return Err("Chưa có file để hẹn đăng.".into());
    }
    job_identity(job, allowed_host)
}

pub fn validate_schedule(
    job: &UploadJob,
    at_ms: u64,
    now_ms: u64,
    allowed_host: &str,
) -> Result<String, CoreError> {
    if at_ms <= now_ms.saturating_add(MIN_SCHEDULE_DELAY_MS)
        || at_ms > now_ms.saturating_add(MAX_SCHEDULE_MS)
    {
        return Err("Chọn lịch từ một phút đến một năm tới.".into());
    }
    validate_prepared(job, allowed_host)
}

pub fn validate_link(
    job: &UploadJob,
    parent_id: &str,
    others: &[UploadJob],
    allowed_host: &str,
) -> Result<String, CoreError> {
    let identity = validate_prepared(job, allowed_host)?;
    if parent_id == job.id {
        return Err("Liên kết tạo thành vòng lặp. Chọn công việc khác.".into());
    }
    let by_id: HashMap<&str, &UploadJob> =
        others.iter().map(|item| (item.id.as_str(), item)).collect();
    let Some(parent) = by_id.get(parent_id) else {
        return Err("Chọn công việc cùng tài khoản đang chờ xác nhận.".into());
    };
    if parent.account != job.account
        || (!is_parent_status(parent.status) && parent.status != JobStatus::Complete)
    {
        return Err("Chọn công việc cùng tài khoản đang chờ xác nhận.".into());
    }

    let mut seen = HashSet::new();
    seen.insert(job.id.as_str());
    let mut cursor = parent_id;
    while !cursor.is_empty() {
        if !seen.insert(cursor) {
            return Err("Liên kết tạo thành vòng lặp. Chọn công việc khác.".into());
        }
        cursor = by_id
            .get(cursor)
            .and_then(|item| item.after_job_id.as_deref())
            .unwrap_or("");
    }

    Ok(identity)
}

pub fn parent_confirmed(
    parent_id: &str,
    jobs: &[UploadJob],
    verified_ids: &HashSet<String>,
) -> bool {
    jobs.iter().any(|job| {
        job.id == parent_id
            && (job.status == JobStatus::Complete || verified_ids.contains(parent_id))
    })
}

pub fn linked_conflicts(
    job: &UploadJob,
    others: &[UploadJob],
    allowed_host: &str,
) -> Result<HashSet<String>, CoreError> {
    let key = job_identity(job, allowed_host)?;
    Ok(others
        .iter()
        .filter(|other| {
            other.id != job.id
                && is_parent_status(other.status)
                && job_identity(other, allowed_host).is_ok_and(|k| k == key)
        })
        .map(|other| other.id.clone())
        .collect())
}

pub fn pending_conflicts(
    job: &UploadJob,
    others: &[UploadJob],
    allowed_host: &str,
) -> HashSet<String> {
    let Ok(key) = job_identity(job, allowed_host) else {
        return HashSet::new();
    };
    others
        .iter()
        .filter(|other| {
            other.id != job.id
                && (matches!(
                    other.status,
                    JobStatus::Scheduled | JobStatus::Linked | JobStatus::Queued
                ) || (other.schedule_started_at.unwrap_or(0) > 0
                    && matches!(
                        other.status,
                        JobStatus::Running | JobStatus::Sending | JobStatus::Verifying
                    )))
                && job_identity(other, allowed_host).is_ok_and(|k| k == key)
        })
        .map(|other| other.id.clone())
        .collect()
}

pub fn is_blocked_by_prior_write(
    job: &UploadJob,
    others: &[UploadJob],
    verified_ids: &HashSet<String>,
    allowed_host: &str,
) -> Result<bool, CoreError> {
    let key = job_identity(job, allowed_host)?;
    Ok(others.iter().any(|other| {
        other.id != job.id
            && !verified_ids.contains(&other.id)
            && other.write_attempted
            && matches!(
                other.status,
                JobStatus::Waiting
                    | JobStatus::Uncertain
                    | JobStatus::Running
                    | JobStatus::Sending
                    | JobStatus::Verifying
            )
            && job_identity(other, allowed_host).is_ok_and(|k| k == key)
    }))
}

pub fn validate_removal(current: &[UploadJob], incoming: &[UploadJob]) -> Result<(), CoreError> {
    let retained: HashSet<&str> = incoming.iter().map(|job| job.id.as_str()).collect();
    let removed: HashSet<&str> = current
        .iter()
        .map(|job| job.id.as_str())
        .filter(|id| !retained.contains(id))
        .collect();

    let breaks_child = incoming.iter().any(|job| {
        job.status == JobStatus::Linked
            && job
                .after_job_id
                .as_deref()
                .is_some_and(|parent_id| removed.contains(parent_id))
    });
    if breaks_child {
        return Err("Công việc còn thẻ liên kết phía sau. Hủy liên kết trước khi xóa.".into());
    }
    Ok(())
}

pub fn suspend_restored(job: &mut UploadJob) {
    if matches!(
        job.status,
        JobStatus::Scheduled | JobStatus::Linked | JobStatus::Queued
    ) {
        job.status = JobStatus::Planned;
    }
    job.scheduled_at = None;
    job.schedule_revision = 0;
    job.after_job_id = None;
    job.background_upload = false;
    job.schedule_started_at = None;
}

pub fn validate_immediate(
    job: &UploadJob,
    revision: u64,
    others: &[UploadJob],
    consent: &HashSet<String>,
    allowed_host: &str,
) -> Result<String, CoreError> {
    if !can_start(job, revision) {
        return Err("Công việc đã đổi. Làm mới trước khi gửi tiếp.".into());
    }
    if !pending_conflicts(job, others, allowed_host)
        .iter()
        .all(|id| consent.contains(id))
    {
        return Err("Truyện này đã có lịch chờ. Kiểm tra Công việc trước khi gửi thêm.".into());
    }
    if job.cleanup_chosen_at.unwrap_or(0) == 0 || job.chapters.as_ref().is_none_or(Vec::is_empty) {
        return Err("Chưa chuẩn bị đủ file.".into());
    }
    job_identity(job, allowed_host)
}

pub fn can_claim(job: &UploadJob, immediate: bool) -> bool {
    if immediate {
        job.status == JobStatus::Queued
    } else {
        matches!(
            job.status,
            JobStatus::Planned | JobStatus::Scheduled | JobStatus::Linked
        ) && !job.write_attempted
    }
}

/// Khóa độc quyền tiến trình upload trên một phiên làm việc.
#[derive(Debug, Default)]
pub struct UploadLease {
    owner: Mutex<Option<String>>,
}

impl UploadLease {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn acquire(&self, owner: &str) -> bool {
        let mut guard = self.owner.lock().expect("lease mutex");
        if guard.is_some() {
            return false;
        }
        *guard = Some(owner.to_owned());
        true
    }

    pub fn release(&self, owner: &str) {
        let mut guard = self.owner.lock().expect("lease mutex");
        if guard.as_deref() == Some(owner) {
            *guard = None;
        }
    }

    pub fn current(&self) -> Option<String> {
        self.owner.lock().expect("lease mutex").clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::upload::model::{
        BookSummary, ChapterRef, CoverFileRef, FieldOption, JobMetadata, VolumePlan,
    };
    use crate::upload::protocol::DEFAULT_WIKI_HOST;
    use crate::upload::store::ScheduleRow;
    use std::collections::BTreeMap;

    fn sample_job(id: &str, status: JobStatus) -> UploadJob {
        UploadJob {
            id: id.into(),
            account: "bao".into(),
            mode: JobMode::New,
            status,
            metadata: JobMetadata {
                fields: vec![
                    ("titleCn".into(), "测试 小说".into()),
                    ("authorCn".into(), "作者".into()),
                ],
                ..Default::default()
            },
            chapters: Some(vec![ChapterRef {
                id: "file".into(),
                ..Default::default()
            }]),
            volumes: vec![VolumePlan {
                key: "v1".into(),
                status: VolumeStatus::Planned,
                ..Default::default()
            }],
            ..Default::default()
        }
    }

    #[test]
    fn stale_foreground_merge_and_active_lease_protection() {
        let mut current = sample_job("upload", JobStatus::Waiting);
        current.schedule_revision = 5;
        current.write_attempted = true;
        let mut incoming = sample_job("upload", JobStatus::Scheduled);
        incoming.schedule_revision = 4;

        let merged = merge_jobs(&[current.clone()], vec![incoming], None);
        assert_eq!(merged[0].status, JobStatus::Waiting);
        assert!(merged[0].write_attempted);

        let mut sending = sample_job("upload", JobStatus::Sending);
        sending.schedule_revision = 5;
        let mut stale_fail = sample_job("upload", JobStatus::Failed);
        stale_fail.schedule_revision = 5;
        assert_eq!(
            merge_jobs(
                &[sending.clone()],
                vec![stale_fail],
                Some("scheduled:upload")
            )[0]
            .status,
            JobStatus::Sending
        );

        let mut complete = sample_job("upload", JobStatus::Complete);
        complete.schedule_revision = 5;
        assert_eq!(
            merge_jobs(&[current], vec![complete.clone()], None)[0].status,
            JobStatus::Complete
        );

        assert!(merge_jobs(&[complete], Vec::new(), None).is_empty());

        let retained = merge_jobs(&[sending], Vec::new(), Some("scheduled:upload"));
        assert_eq!(retained.len(), 1);
        assert_eq!(retained[0].id, "upload");

        assert!(!can_start(&sample_job("u", JobStatus::Waiting), 0));
        assert!(!can_start(&sample_job("u", JobStatus::Uncertain), 0));
        assert!(can_start(&sample_job("u", JobStatus::Planned), 0));
        assert!(can_start(&sample_job("u", JobStatus::Failed), 0));
    }

    #[test]
    fn metadata_compaction_keeps_selected_labels_repeated_fields_and_pinned_files() {
        let mut labels = BTreeMap::new();
        labels.insert(
            "tag".into(),
            vec![FieldOption {
                value: "a".into(),
                label: "Tiên hiệp".into(),
                required: false,
            }],
        );
        let mut options = BTreeMap::new();
        options.insert(
            "tag".into(),
            (1..=600)
                .map(|i| FieldOption {
                    value: format!("v{i}"),
                    label: format!("Unused {i}"),
                    required: false,
                })
                .collect(),
        );
        let mut extra = BTreeMap::new();
        extra.insert(
            "groups".into(),
            serde_json::json!((1..=200).map(|i| format!("Unused {i}")).collect::<Vec<_>>()),
        );

        let mut original = sample_job("upload", JobStatus::Failed);
        original.metadata = JobMetadata {
            url: Some("https://wikicv.org/nhung-file".into()),
            fields: vec![
                ("titleVi".into(), "Tên".into()),
                ("tag".into(), "a".into()),
                ("tag".into(), "b".into()),
            ],
            cover_file: Some(CoverFileRef {
                id: "cover".into(),
                ..Default::default()
            }),
            selected_labels: labels,
            options,
            extra,
            ..Default::default()
        };
        original.chapters = Some(vec![ChapterRef {
            id: "pinned".into(),
            ..Default::default()
        }]);

        let before_len = serde_json::to_string(&original).expect("json").len();
        compact_job_metadata(&mut original);
        let after_len = serde_json::to_string(&original).expect("json").len();
        assert!(after_len < before_len / 5);
        assert_eq!(original.metadata.fields.len(), 3);
        assert_eq!(
            original.metadata.selected_labels.get("tag").expect("tag")[0].label,
            "Tiên hiệp"
        );
        assert!(original.metadata.options.is_empty());
        assert!(original.metadata.extra.is_empty());
        assert_eq!(
            original.metadata.cover_file.as_ref().expect("cover").id,
            "cover"
        );
        assert_eq!(original.chapters.as_ref().expect("ch")[0].id, "pinned");
    }

    #[test]
    fn identity_schedule_gates_and_lease_exclusion() {
        let a = sample_job("job", JobStatus::Planned);
        let mut b = sample_job("job", JobStatus::Planned);
        b.metadata.fields = vec![
            ("titleCn".into(), "测试\u{3000}小说".into()),
            ("authorCn".into(), " 作 者 ".into()),
        ];
        assert_eq!(
            job_identity(&a, DEFAULT_WIKI_HOST).expect("id a"),
            job_identity(&b, DEFAULT_WIKI_HOST).expect("id b")
        );

        let mut fw1 = sample_job("fw1", JobStatus::Planned);
        fw1.metadata.fields = vec![
            ("titleCn".into(), "ＡＢＣ １２３".into()),
            ("authorCn".into(), "Ｔｅｓｔ".into()),
        ];
        let mut fw2 = sample_job("fw2", JobStatus::Planned);
        fw2.metadata.fields = vec![
            ("titleCn".into(), "abc123".into()),
            ("authorCn".into(), "test".into()),
        ];
        assert_eq!(
            job_identity(&fw1, DEFAULT_WIKI_HOST).expect("fw1"),
            job_identity(&fw2, DEFAULT_WIKI_HOST).expect("fw2")
        );

        let mut no_author = sample_job("job", JobStatus::Planned);
        no_author.metadata.fields = vec![("titleCn".into(), "测试".into())];
        assert!(job_identity(&no_author, DEFAULT_WIKI_HOST).is_err());

        let mut existing = sample_job("job", JobStatus::Planned);
        existing.mode = JobMode::Existing;
        existing.book = Some(BookSummary {
            url: "https://wikicv.org/truyen/test/?page=2#x".into(),
            ..Default::default()
        });
        assert_eq!(
            job_identity(&existing, DEFAULT_WIKI_HOST).expect("existing"),
            "book:/truyen/test"
        );
        existing.book = Some(BookSummary {
            url: "https://wikicv.org.evil.example/truyen/test".into(),
            ..Default::default()
        });
        assert!(job_identity(&existing, DEFAULT_WIKI_HOST).is_err());

        for bad_flag in ["write", "publishAccepted", "volAttempt"] {
            let mut j = sample_job("job", JobStatus::Planned);
            match bad_flag {
                "write" => j.write_attempted = true,
                "publishAccepted" => j.publish_accepted = true,
                _ => j.volumes[0].upload_attempted_at = 1,
            }
            assert!(validate_schedule(&j, 120_000, 0, DEFAULT_WIKI_HOST).is_err());
        }

        for status in [
            JobStatus::Complete,
            JobStatus::Sending,
            JobStatus::Waiting,
            JobStatus::Uncertain,
            JobStatus::Failed,
        ] {
            assert!(
                validate_schedule(&sample_job("job", status), 120_000, 0, DEFAULT_WIKI_HOST)
                    .is_err()
            );
        }

        validate_schedule(&a, 120_000, 0, DEFAULT_WIKI_HOST).expect("valid");
        assert!(validate_schedule(&a, 1, 0, DEFAULT_WIKI_HOST).is_err());
        assert!(validate_schedule(&a, 400 * 86_400_000, 0, DEFAULT_WIKI_HOST).is_err());

        let lease = UploadLease::new();
        assert!(lease.acquire("foreground:a"));
        assert!(!lease.acquire("scheduled:b"));
        lease.release("scheduled:b");
        assert_eq!(lease.current().as_deref(), Some("foreground:a"));
        lease.release("foreground:a");
        assert!(lease.acquire("scheduled:b"));
    }

    #[test]
    fn blocking_duplicates_manual_handoff_and_dependencies() {
        let scheduled = sample_job("job", JobStatus::Planned);
        let mut old = sample_job("older", JobStatus::Waiting);
        old.write_attempted = true;
        assert!(
            is_blocked_by_prior_write(
                &scheduled,
                std::slice::from_ref(&old),
                &HashSet::new(),
                DEFAULT_WIKI_HOST
            )
            .expect("blocked")
        );
        let verified: HashSet<String> = ["older".into()].into_iter().collect();
        assert!(
            !is_blocked_by_prior_write(
                &scheduled,
                std::slice::from_ref(&old),
                &verified,
                DEFAULT_WIKI_HOST
            )
            .expect("verified unblocks")
        );

        let mut immediate = sample_job("job", JobStatus::Planned);
        immediate.cleanup_chosen_at = Some(1);
        immediate.schedule_revision = 3;
        let other = sample_job("old", JobStatus::Scheduled);
        assert!(
            validate_immediate(&immediate, 2, &[], &HashSet::new(), DEFAULT_WIKI_HOST).is_err()
        );
        assert!(
            validate_immediate(
                &immediate,
                3,
                std::slice::from_ref(&other),
                &HashSet::new(),
                DEFAULT_WIKI_HOST
            )
            .is_err()
        );
        let consent: HashSet<String> = ["old".into()].into_iter().collect();
        validate_immediate(&immediate, 3, &[other], &consent, DEFAULT_WIKI_HOST).expect("ok");

        let mut a = sample_job("a", JobStatus::Complete);
        let mut b = sample_job("b", JobStatus::Linked);
        b.after_job_id = Some("a".into());
        let mut c = sample_job("c", JobStatus::Linked);
        c.after_job_id = Some("b".into());
        let jobs = vec![a.clone(), b.clone(), c.clone()];

        let row_b = ScheduleRow {
            id: "b".into(),
            after_job_id: Some("a".into()),
            at: 0,
            ..Default::default()
        };
        let row_c = ScheduleRow {
            id: "c".into(),
            after_job_id: Some("b".into()),
            at: 0,
            ..Default::default()
        };
        assert!(row_b.is_ready(&jobs, &HashSet::new(), 100));
        assert!(!row_c.is_ready(&jobs, &HashSet::new(), 100));
        assert!(row_c.is_ready(&jobs, &["b".into()].into_iter().collect(), 100));

        assert!(validate_link(&a, "a", &jobs, DEFAULT_WIKI_HOST).is_err());
        a.status = JobStatus::Planned;
        assert!(
            validate_link(
                &a,
                "c",
                &[a.clone(), b.clone(), c.clone()],
                DEFAULT_WIKI_HOST
            )
            .is_err()
        );

        let p = sample_job("a", JobStatus::Waiting);
        assert!(validate_removal(&[p.clone(), b.clone()], std::slice::from_ref(&b)).is_err());
        validate_removal(&[p.clone(), b.clone()], &[]).expect("empty removal ok");
        b.status = JobStatus::Planned;
        b.after_job_id = None;
        validate_removal(&[p, b.clone()], &[b]).expect("unlinked ok");

        for st in [JobStatus::Scheduled, JobStatus::Queued, JobStatus::Linked] {
            let mut restored = sample_job("test", st);
            restored.after_job_id = Some("prev".into());
            restored.schedule_revision = 5;
            restored.scheduled_at = Some(100);
            restored.background_upload = true;
            suspend_restored(&mut restored);
            assert_eq!(restored.status, JobStatus::Planned);
            assert!(restored.after_job_id.is_none());
            assert_eq!(restored.schedule_revision, 0);
        }

        let mut sent = sample_job("sent", JobStatus::Uncertain);
        sent.write_attempted = true;
        suspend_restored(&mut sent);
        assert_eq!(sent.status, JobStatus::Uncertain);
        assert!(sent.write_attempted);

        let mut stop_row = row_b.clone();
        stop_row.cancel_requested = true;
        assert!(!stop_row.is_ready(&jobs, &HashSet::new(), 100));
    }
}
