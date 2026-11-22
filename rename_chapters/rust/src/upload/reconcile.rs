use std::collections::{BTreeMap, HashSet};
use std::fs::{self, File, OpenOptions};
use std::io::{self, BufReader, Write};
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::CoreError;
use crate::upload::model::{
    HistoryBaseline, JobMode, JobStatus, ServerState, UPLOAD_SCHEMA_VERSION, UploadStage,
};

const LEDGER_FILENAME: &str = "upload-verification.json";
const LEDGER_LOCK_FILENAME: &str = "upload-verification.lock";
const MAX_LEDGER_RECORDS: usize = 500;
const MAX_LEDGER_VOLUMES: usize = 1000;

pub struct VerificationPolicy;

impl VerificationPolicy {
    pub const FIRST_DELAY_MS: u64 = 60_000;
    pub const LOCATE_DELAY_MS: u64 = 3 * 60_000;
    pub const REVIEW_AFTER_MS: u64 = 24 * 60 * 60_000;

    pub fn next_check_at(attempt: u32, now_ms: u64) -> u64 {
        let step = if attempt <= 1 {
            30 * 60_000
        } else {
            60 * 60_000
        };
        now_ms.saturating_add(step)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum HistoryEntryType {
    Upload,
    Append,
    Publish,
    Delete,
    Edit,
    Other,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub account: String,
    pub kind: HistoryEntryType,
    pub volume: String,
    pub note: String,
    pub message: String,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistorySnapshot {
    pub rows: Vec<HistoryEntry>,
    pub total: i64,
}

fn strip_ci_prefix<'a>(text: &'a str, prefix_lower: &str) -> Option<&'a str> {
    let mut text_iter = text.char_indices();
    let mut prefix_iter = prefix_lower.chars();

    let mut consumed_bytes = 0usize;
    while let Some(expected) = prefix_iter.next() {
        let (_, actual) = text_iter.next()?;
        let mut lower_chars = actual.to_lowercase();
        let first_lower = lower_chars.next()?;
        if first_lower != expected {
            return None;
        }
        for extra in lower_chars {
            if prefix_iter.next() != Some(extra) {
                return None;
            }
        }
        consumed_bytes += actual.len_utf8();
    }
    Some(&text[consumed_bytes..])
}

fn starts_with_ci(text: &str, prefix_lower: &str) -> bool {
    strip_ci_prefix(text, prefix_lower).is_some()
}

fn parse_append_rest(after_prefix: &str) -> Option<(String, String)> {
    let trimmed = after_prefix.trim_start();
    if let Some(after_open) = trimmed.strip_prefix('(') {
        for (idx, _) in after_open.match_indices(')') {
            let note = after_open[..idx].trim();
            let after_paren = after_open[idx + 1..].trim_start();
            if let Some(after_vao) = strip_ci_prefix(after_paren, "vào quyển")
                && after_vao.chars().next().is_some_and(char::is_whitespace)
            {
                let volume = after_vao.trim();
                if !volume.is_empty() {
                    return Some((note.to_owned(), volume.to_owned()));
                }
            }
        }
    }
    if let Some(after_vao) = strip_ci_prefix(trimmed, "vào quyển")
        && after_vao.chars().next().is_some_and(char::is_whitespace)
    {
        let volume = after_vao.trim();
        if !volume.is_empty() {
            return Some((String::new(), volume.to_owned()));
        }
    }
    None
}

/// Phân tích một dòng lịch sử công khai của WikiCV thành hành động chuẩn hóa.
pub fn parse_history_message(account: &str, raw_message: &str) -> HistoryEntry {
    let message = raw_message.split_whitespace().collect::<Vec<_>>().join(" ");

    if let Some(after_append) = strip_ci_prefix(&message, "đã thêm file bổ sung")
        && (after_append.is_empty() || after_append.chars().next().is_some_and(char::is_whitespace))
        && let Some((note, volume)) = parse_append_rest(after_append)
    {
        return HistoryEntry {
            account: account.to_owned(),
            kind: HistoryEntryType::Append,
            volume,
            note,
            message,
        };
    }

    if let Some(after_upload) = strip_ci_prefix(&message, "đã thêm file quyển")
        && after_upload.chars().next().is_some_and(char::is_whitespace)
    {
        let volume = after_upload.trim();
        if !volume.is_empty() {
            return HistoryEntry {
                account: account.to_owned(),
                kind: HistoryEntryType::Upload,
                volume: volume.to_owned(),
                note: String::new(),
                message,
            };
        }
    }

    if message == "đã tạo truyện" {
        return HistoryEntry {
            account: account.to_owned(),
            kind: HistoryEntryType::Publish,
            volume: String::new(),
            note: String::new(),
            message,
        };
    }

    if starts_with_ci(&message, "đã xóa")
        || starts_with_ci(&message, "đã xoá")
        || starts_with_ci(&message, "đã hoàn tác")
    {
        return HistoryEntry {
            account: account.to_owned(),
            kind: HistoryEntryType::Delete,
            volume: String::new(),
            note: String::new(),
            message,
        };
    }

    if starts_with_ci(&message, "đã sửa")
        || starts_with_ci(&message, "đã chỉnh sửa")
        || starts_with_ci(&message, "đã cập nhật")
        || starts_with_ci(&message, "đã đổi")
    {
        return HistoryEntry {
            account: account.to_owned(),
            kind: HistoryEntryType::Edit,
            volume: String::new(),
            note: String::new(),
            message,
        };
    }

    HistoryEntry {
        account: account.to_owned(),
        kind: HistoryEntryType::Other,
        volume: String::new(),
        note: String::new(),
        message,
    }
}

pub fn title_matches(first: &str, second: &str) -> bool {
    let clean = |s: &str| {
        s.split_whitespace()
            .collect::<Vec<_>>()
            .join(" ")
            .to_lowercase()
    };
    let a = clean(first);
    a.is_empty() || a == clean(second)
}

/// Khớp biên nhận tải quyển/bổ sung trong cửa sổ lịch sử mới nhất mà không khớp nhầm bản ghi cũ hoặc claimed.
pub fn match_history_receipt(
    snapshot: &HistorySnapshot,
    before: Option<&HistoryBaseline>,
    account: &str,
    volume_name: &str,
    append: bool,
    note: &str,
    claimed: &HashSet<usize>,
) -> Option<usize> {
    let before = before?;
    if before.total < 0 || volume_name.trim().is_empty() {
        return None;
    }
    let added = snapshot.total - before.total;
    if added <= 0 || added as usize > snapshot.rows.len() {
        return None;
    }
    let target_kind = if append {
        HistoryEntryType::Append
    } else {
        HistoryEntryType::Upload
    };
    let expected_note = note.trim();

    (0..added as usize).rev().find(|&index| {
        if claimed.contains(&index) {
            return false;
        }
        let row = &snapshot.rows[index];
        row.account == account
            && row.kind == target_kind
            && title_matches(volume_name, &row.volume)
            && (!append || row.note.trim() == expected_note)
    })
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReconcileVolume {
    pub key: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub count: usize,
    #[serde(default)]
    pub append: bool,
    #[serde(default)]
    pub note: String,
    #[serde(default)]
    pub received: bool,
    #[serde(default)]
    pub confirmed_by_history: bool,
    #[serde(default = "default_true")]
    pub attempted: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub history_before: Option<HistoryBaseline>,
}

impl Default for ReconcileVolume {
    fn default() -> Self {
        Self {
            key: String::new(),
            name: String::new(),
            count: 0,
            append: false,
            note: String::new(),
            received: false,
            confirmed_by_history: false,
            attempted: true,
            history_before: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReconcileRecord {
    pub id: String,
    #[serde(default)]
    pub generation: String,
    #[serde(default)]
    pub policy: u32,
    pub account: String,
    pub book_id: String,
    #[serde(default)]
    pub mode: JobMode,
    #[serde(default)]
    pub url: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub title_cn: String,
    #[serde(default)]
    pub expected_count: usize,
    #[serde(default)]
    pub combined_expected_count: usize,
    #[serde(default)]
    pub baseline_count: usize,
    #[serde(default)]
    pub published: bool,
    #[serde(default = "default_true")]
    pub publication_attempted: bool,
    #[serde(default)]
    pub rejected: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub failed_stage: Option<UploadStage>,
    #[serde(default)]
    pub status: JobStatus,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub server_state: Option<ServerState>,
    #[serde(default)]
    pub message: String,
    #[serde(default)]
    pub error: String,
    #[serde(default)]
    pub attempt: u32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub actual_count: Option<usize>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub count_source: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub server_title: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub checked_at: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub checked_expected: Option<usize>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub verified_at: Option<u64>,
    #[serde(default)]
    pub uploaded_at: u64,
    #[serde(default)]
    pub last_progress_at: u64,
    #[serde(default)]
    pub next_at: u64,
    #[serde(default)]
    pub received_volumes: usize,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub history_total: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub history_checked_at: Option<u64>,
    #[serde(default)]
    pub history_changed: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub history_change: Option<String>,
    #[serde(default)]
    pub works_cursor: usize,
    #[serde(default)]
    pub volumes: Vec<ReconcileVolume>,
}

impl Default for ReconcileRecord {
    fn default() -> Self {
        Self {
            id: String::new(),
            generation: String::new(),
            policy: 2,
            account: String::new(),
            book_id: String::new(),
            mode: JobMode::New,
            url: String::new(),
            title: String::new(),
            title_cn: String::new(),
            expected_count: 0,
            combined_expected_count: 0,
            baseline_count: 0,
            published: false,
            publication_attempted: true,
            rejected: false,
            failed_stage: None,
            status: JobStatus::Waiting,
            server_state: None,
            message: String::new(),
            error: String::new(),
            attempt: 0,
            actual_count: None,
            count_source: None,
            server_title: None,
            checked_at: None,
            checked_expected: None,
            verified_at: None,
            uploaded_at: 0,
            last_progress_at: 0,
            next_at: 0,
            received_volumes: 0,
            history_total: None,
            history_checked_at: None,
            history_changed: false,
            history_change: None,
            works_cursor: 0,
            volumes: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BookCountObservation {
    pub book_id: String,
    pub title: String,
    pub count: usize,
    pub source: String,
}

#[derive(Debug, Clone)]
pub struct ReconcileObservation {
    pub history: Result<HistorySnapshot, String>,
    pub count: Result<Option<BookCountObservation>, String>,
    pub resolved_url: Option<String>,
    pub resolved_published: bool,
    pub updated_works_cursor: Option<usize>,
}

/// Đối chiếu trạng thái một công việc dựa trên lịch sử công khai và số chương hiện có trên server.
/// Không bao giờ chuyển lỗi đọc dữ liệu thành thất bại upload.
pub fn reconcile_inspect(
    input: &ReconcileRecord,
    obs: &ReconcileObservation,
    now_ms: u64,
) -> ReconcileRecord {
    let mut row = input.clone();

    let baseline = row
        .volumes
        .iter()
        .filter_map(|v| {
            v.history_before
                .as_ref()
                .map(|h| h.total)
                .filter(|&t| t >= 0)
        })
        .min();

    let mut history_error = false;
    match &obs.history {
        Ok(snapshot) => {
            let base_total = baseline.or(row.history_total).unwrap_or(snapshot.total);
            let added = snapshot.total - base_total;

            let mut claimed = HashSet::new();
            for volume in &mut row.volumes {
                if let Some(index) = match_history_receipt(
                    snapshot,
                    volume.history_before.as_ref(),
                    &row.account,
                    &volume.name,
                    volume.append,
                    &volume.note,
                    &claimed,
                ) {
                    claimed.insert(index);
                    volume.received = true;
                    volume.confirmed_by_history = true;
                }
            }

            if added > 0 {
                let take_len = (added as usize).min(snapshot.rows.len());
                let recent = &snapshot.rows[..take_len];
                if recent.iter().any(|entry| {
                    entry.kind == HistoryEntryType::Publish && entry.account == row.account
                }) {
                    row.published = true;
                }
                if let Some(change) = recent.iter().find(|entry| {
                    matches!(
                        entry.kind,
                        HistoryEntryType::Edit | HistoryEntryType::Delete
                    )
                }) {
                    row.history_changed = true;
                    row.history_change = Some(change.message.chars().take(250).collect());
                }
            }

            row.history_total = Some(snapshot.total);
            row.history_checked_at = Some(now_ms);
        }
        Err(_) => {
            history_error = true;
        }
    }

    if let Some(url) = &obs.resolved_url
        && !url.is_empty()
    {
        row.url = url.clone();
        row.published = true;
    }
    if obs.resolved_published {
        row.published = true;
    }
    if let Some(cursor) = obs.updated_works_cursor {
        row.works_cursor = cursor;
    }

    let count_ok = obs.count.is_ok();
    let actual = obs.count.as_ref().ok().and_then(|opt| opt.as_ref());
    let expected = row.combined_expected_count.max(row.expected_count);
    let attempt = row.attempt.saturating_add(1);
    let received = row.volumes.iter().filter(|v| v.received).count();
    let previous_count = row.actual_count;
    let previous_received = input.volumes.iter().filter(|v| v.received).count();

    if actual.is_some_and(|act| act.count > 0 && previous_count.is_none_or(|prev| act.count > prev))
        || received > previous_received
    {
        row.last_progress_at = now_ms;
    }

    let progress_anchor = if row.last_progress_at > 0 {
        row.last_progress_at
    } else if row.uploaded_at > 0 {
        row.uploaded_at
    } else {
        now_ms
    };
    let stale = now_ms.saturating_sub(progress_anchor) >= VerificationPolicy::REVIEW_AFTER_MS;

    row.attempt = attempt;
    row.checked_at = Some(now_ms);
    row.checked_expected = Some(expected);
    row.received_volumes = received;
    row.error.clear();

    if let Some(act) = actual {
        row.actual_count = Some(act.count);
        row.count_source = Some(act.source.clone());
        row.server_title = Some(act.title.clone());
    }

    let all_received = !row.volumes.is_empty() && received == row.volumes.len();
    let published = row.published || row.mode == JobMode::Existing;
    let success = if row.mode == JobMode::Existing {
        "Đã tải file. Chờ server xử lý. Bạn chưa cần thao tác."
    } else {
        "Đã tải file và nhúng thành công. Chờ server xử lý. Bạn chưa cần thao tác."
    };

    if let Some(act) = actual
        && act.book_id == row.book_id
        && act.count >= expected
    {
        row.status = JobStatus::Complete;
        row.verified_at = Some(now_ms);
        row.next_at = 0;
        row.server_state = Some(ServerState::Complete);
        row.message = if act.count == expected {
            format!("Server đã có đủ {expected} chương.")
        } else {
            format!(
                "Server có {} chương. Đủ {expected} chương của lượt tải.",
                act.count
            )
        };
        return row;
    }

    let (mut state, mut message) = if !count_ok {
        let msg = if all_received && published {
            format!("{success} Chưa đọc được số chương, app sẽ kiểm tra lại.")
        } else {
            "Chưa kết nối được server để đối chiếu. App sẽ kiểm tra lại.".to_owned()
        };
        (ServerState::Connection, msg)
    } else if actual.is_none() {
        let msg = if all_received && published {
            format!("{success} Đang tìm liên kết trong Works.")
        } else {
            "Đang tìm truyện trong Works và kiểm tra lịch sử. Bạn chưa cần gửi lại.".to_owned()
        };
        (ServerState::Locating, msg)
    } else {
        let act = actual.expect("checked Some");
        let mut st = if all_received && published {
            ServerState::Processing
        } else {
            ServerState::Checking
        };
        let mut msg = if all_received && published {
            success.to_owned()
        } else {
            "Chưa xác nhận server đã nhận file. App đang kiểm tra lịch sử.".to_owned()
        };

        let mut cumulative = row.baseline_count;
        let mut prefix = 0usize;
        for (index, volume) in row.volumes.iter().enumerate() {
            cumulative = cumulative.saturating_add(volume.count);
            if cumulative == act.count {
                prefix = index + 1;
            }
        }
        let vol_sum: usize = row.volumes.iter().map(|v| v.count).sum();
        if (1..row.volumes.len()).contains(&prefix) && expected == row.baseline_count + vol_sum {
            if all_received {
                st = ServerState::Partial;
                let range = if prefix + 1 < row.volumes.len() {
                    format!("{}–{}", prefix + 1, row.volumes.len())
                } else {
                    format!("{}", prefix + 1)
                };
                msg = format!(
                    "Server đã hiện {prefix}/{} quyển · {}/{expected} chương. Chờ xử lý quyển {range}. Bạn chưa cần thao tác.",
                    row.volumes.len(),
                    act.count
                );
            } else {
                st = ServerState::Checking;
                msg = format!(
                    "Server đã hiện {prefix}/{} quyển · {}/{expected} chương. App đang kiểm tra file của các quyển còn lại.",
                    row.volumes.len(),
                    act.count
                );
            }
        } else {
            msg.push_str(&format!(" Server: {}/{expected} chương.", act.count));
        }

        if row.history_changed
            && let Some(change) = &row.history_change
        {
            msg.push_str(&format!(" Lịch sử có thay đổi mới: {change}."));
        }
        (st, msg)
    };

    let pending_count = row.volumes.iter().filter(|v| !v.received).count();
    let unsent = row
        .volumes
        .iter()
        .filter(|v| !v.received && !v.attempted)
        .count();
    let unpublished_upload = row.mode == JobMode::New
        && !published
        && !row.publication_attempted
        && row.failed_stage == Some(UploadStage::Upload)
        && actual.is_none();
    let resume = count_ok
        && !history_error
        && (unpublished_upload
            || (pending_count > 0 && unsent == pending_count)
            || (all_received && !published && !row.publication_attempted));

    if resume {
        state = ServerState::Resume;
        message = if unpublished_upload && pending_count > 0 {
            "Tải quyển bị gián đoạn. Chưa nhúng truyện. Nhấn Tiếp tục để hoàn tất.".to_owned()
        } else if unsent > 0 {
            format!(
                "Server đã nhận {received}/{} quyển. Còn {unsent} quyển chưa gửi. Nhấn Tiếp tục để gửi phần còn lại.",
                row.volumes.len()
            )
        } else {
            "File đã tải lên. Chưa đăng truyện. Nhấn Tiếp tục để hoàn tất.".to_owned()
        };
    } else if unsent > 0 {
        message.push_str(&format!(" Còn {unsent} quyển chưa gửi."));
    }

    let rejected_publish = row.rejected
        && row.failed_stage == Some(UploadStage::Publish)
        && !published
        && actual.is_none()
        && count_ok
        && !history_error;
    let review = (stale && count_ok) || rejected_publish;

    if review && !resume {
        state = ServerState::Review;
        message = if rejected_publish {
            "Works chưa có truyện. Có thể kiểm tra rồi thử lại bước đăng truyện.".to_owned()
        } else if let Some(act) = actual {
            format!(
                "Server hiện {}/{expected} chương sau 24 giờ chưa có tiến triển. Kiểm tra truyện và lịch sử trước khi gửi lại.",
                act.count
            )
        } else {
            "Chưa tìm thấy truyện trong Works. Kiểm tra trên web trước khi gửi lại.".to_owned()
        };
        if row.history_changed
            && let Some(change) = &row.history_change
        {
            message.push_str(&format!(" Lịch sử có thay đổi: {change}."));
        }
    }

    if history_error && !all_received && !review {
        message.push_str(" Chưa đọc được lịch sử, app sẽ kiểm tra lại.");
    }

    row.status = if review || resume {
        JobStatus::Uncertain
    } else {
        JobStatus::Waiting
    };
    row.server_state = Some(state);
    row.message = message;
    row.next_at = if state == ServerState::Locating && attempt <= 2 {
        now_ms.saturating_add(VerificationPolicy::LOCATE_DELAY_MS)
    } else {
        VerificationPolicy::next_check_at(attempt, now_ms)
    };
    row
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PersistedLedger {
    schema: u32,
    #[serde(default)]
    records: Vec<ReconcileRecord>,
}

impl Default for PersistedLedger {
    fn default() -> Self {
        Self {
            schema: UPLOAD_SCHEMA_VERSION,
            records: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct ScheduleVerifyInput {
    pub id: String,
    pub generation: String,
    pub account: String,
    pub book_id: String,
    pub url: String,
    pub title: String,
    pub title_cn: String,
    pub mode: JobMode,
    pub expected_count: usize,
    pub baseline_count: usize,
    pub published: bool,
    pub publication_attempted: bool,
    pub rejected: bool,
    pub failed_stage: Option<UploadStage>,
    pub uploaded_at: Option<u64>,
    pub volumes: Vec<ReconcileVolume>,
}

fn is_valid_hex_book_id(id: &str) -> bool {
    id.len() == 24
        && id
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

fn is_valid_account(user: &str) -> bool {
    !user.trim().is_empty()
        && user.len() <= 200
        && !user
            .chars()
            .any(|c| matches!(c, '/' | '\\' | '?' | '#') || c.is_control())
}

/// Sổ đối chiếu độc lập với state chính: cập nhật tiến độ server không ghi đè draft job.
pub struct VerificationLedger {
    directory: PathBuf,
}

impl VerificationLedger {
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
            .open(self.directory.join(LEDGER_LOCK_FILENAME))?;
        lock.lock()?;
        Ok(lock)
    }

    fn read_all(&self) -> Result<PersistedLedger, CoreError> {
        let path = self.directory.join(LEDGER_FILENAME);
        let file = match File::open(path) {
            Ok(file) => file,
            Err(err) if err.kind() == io::ErrorKind::NotFound => {
                return Ok(PersistedLedger::default());
            }
            Err(err) => return Err(err.into()),
        };
        let ledger: PersistedLedger = serde_json::from_reader(BufReader::new(file))
            .map_err(|err| format!("Không đọc được sổ đối chiếu: {err}"))?;
        if ledger.schema != UPLOAD_SCHEMA_VERSION {
            return Err("Phiên bản sổ đối chiếu không được hỗ trợ.".into());
        }
        Ok(ledger)
    }

    fn save_all(&self, ledger: &PersistedLedger) -> Result<(), CoreError> {
        fs::create_dir_all(&self.directory)?;
        let mut temp = tempfile::NamedTempFile::new_in(&self.directory)?;
        serde_json::to_writer(&mut temp, ledger)?;
        temp.flush()?;
        temp.as_file().sync_all()?;
        temp.persist(self.directory.join(LEDGER_FILENAME))
            .map_err(|err| err.error)?;
        Ok(())
    }

    pub fn records(&self) -> Result<Vec<ReconcileRecord>, CoreError> {
        let _lock = self.lock()?;
        Ok(self.read_all()?.records)
    }

    pub fn confirmed_ids(&self) -> Result<HashSet<String>, CoreError> {
        let _lock = self.lock()?;
        Ok(self
            .read_all()?
            .records
            .into_iter()
            .filter(|r| r.status == JobStatus::Complete)
            .map(|r| r.id)
            .collect())
    }

    pub fn pending_count(&self, account: &str, book_id: &str) -> Result<usize, CoreError> {
        let _lock = self.lock()?;
        Ok(self
            .read_all()?
            .records
            .into_iter()
            .filter(|r| {
                r.account == account
                    && r.book_id == book_id
                    && matches!(
                        r.status,
                        JobStatus::Waiting | JobStatus::Verifying | JobStatus::Uncertain
                    )
            })
            .map(|r| r.expected_count.max(r.combined_expected_count))
            .max()
            .unwrap_or(0))
    }

    pub fn schedule(
        &self,
        input: ScheduleVerifyInput,
        now_ms: u64,
    ) -> Result<ReconcileRecord, CoreError> {
        if input.id.trim().is_empty() || input.id.len() > 120 {
            return Err("ID công việc không hợp lệ.".into());
        }
        if !is_valid_account(&input.account) {
            return Err("Tài khoản không hợp lệ.".into());
        }
        if !is_valid_hex_book_id(&input.book_id) {
            return Err("ID truyện không hợp lệ.".into());
        }
        if input.volumes.len() > MAX_LEDGER_VOLUMES {
            return Err("Số quyển vượt giới hạn cho phép.".into());
        }

        let _lock = self.lock()?;
        let mut ledger = self.read_all()?;
        let existing_pos = ledger.records.iter().position(|r| r.id == input.id);
        if existing_pos.is_none() && ledger.records.len() >= MAX_LEDGER_RECORDS {
            return Err("Dọn công việc cũ trước khi tạo thêm.".into());
        }

        let mut row = if let Some(pos) = existing_pos {
            let existing = &ledger.records[pos];
            if existing.account != input.account || existing.book_id != input.book_id {
                return Err("Công việc thuộc truyện hoặc ID tài khoản khác.".into());
            }
            if existing.status == JobStatus::Complete {
                return Ok(existing.clone());
            }
            existing.clone()
        } else {
            ReconcileRecord {
                id: input.id.clone(),
                account: input.account.clone(),
                book_id: input.book_id.clone(),
                policy: 0,
                ..Default::default()
            }
        };

        let upgrade = row.policy != 2;
        row.generation = input.generation;
        row.policy = 2;
        row.expected_count = row.expected_count.max(input.expected_count);
        row.title = input.title.chars().take(1000).collect();
        row.title_cn = input.title_cn.chars().take(1000).collect();
        row.mode = input.mode;
        row.publication_attempted = input.publication_attempted;
        row.baseline_count = input.baseline_count;
        row.rejected = input.rejected;
        row.failed_stage = input.failed_stage;
        row.error.clear();
        if !input.url.is_empty() {
            row.url = input.url;
        }
        row.published = row.published || input.published || !row.url.is_empty();

        let old_by_key: BTreeMap<String, (bool, bool)> = row
            .volumes
            .iter()
            .map(|v| (v.key.clone(), (v.received, v.confirmed_by_history)))
            .collect();
        let mut merged_volumes = input.volumes;
        for vol in &mut merged_volumes {
            if let Some(&(prev_recv, prev_hist)) = old_by_key.get(&vol.key) {
                if prev_recv {
                    vol.received = true;
                }
                if prev_hist {
                    vol.confirmed_by_history = true;
                }
            }
        }
        row.volumes = merged_volumes;

        if upgrade {
            row.status = JobStatus::Waiting;
            row.uploaded_at = input.uploaded_at.unwrap_or(now_ms).clamp(1, now_ms.max(1));
            row.last_progress_at = now_ms;
            row.next_at = now_ms.saturating_add(if row.url.is_empty() {
                VerificationPolicy::LOCATE_DELAY_MS
            } else {
                VerificationPolicy::FIRST_DELAY_MS
            });
            row.message = "Đang kiểm tra trạng thái gửi và lịch sử truyện.".to_owned();
            if !row.volumes.is_empty() && row.volumes.iter().all(|v| v.received) && row.published {
                row.server_state = Some(ServerState::Processing);
                row.message = if row.mode == JobMode::Existing {
                    "Đã tải file. Chờ server xử lý. Bạn chưa cần thao tác.".to_owned()
                } else {
                    "Đã tải file và nhúng thành công. Chờ server xử lý. Bạn chưa cần thao tác."
                        .to_owned()
                };
            }
        }

        for other in &mut ledger.records {
            if other.id != row.id
                && other.account == row.account
                && other.book_id == row.book_id
                && matches!(other.status, JobStatus::Waiting | JobStatus::Uncertain)
            {
                other.combined_expected_count = other
                    .combined_expected_count
                    .max(other.expected_count)
                    .max(input.expected_count);
                row.combined_expected_count = row
                    .combined_expected_count
                    .max(other.combined_expected_count);
            }
        }

        if let Some(pos) = existing_pos {
            ledger.records[pos] = row.clone();
        } else {
            ledger.records.push(row.clone());
        }
        self.save_all(&ledger)?;
        Ok(row)
    }

    pub fn due_records(
        &self,
        now_ms: u64,
        only_id: Option<&str>,
    ) -> Result<Vec<ReconcileRecord>, CoreError> {
        let _lock = self.lock()?;
        let ledger = self.read_all()?;
        let mut due: Vec<ReconcileRecord> = ledger
            .records
            .iter()
            .filter(|row| {
                row.policy == 2
                    && matches!(row.status, JobStatus::Waiting | JobStatus::Uncertain)
                    && row.next_at > 0
                    && row.next_at <= now_ms
                    && only_id.is_none_or(|id| row.id == id)
            })
            .cloned()
            .collect();

        for row in &mut due {
            let max_expected = ledger
                .records
                .iter()
                .filter(|other| {
                    other.account == row.account
                        && other.book_id == row.book_id
                        && other.uploaded_at >= row.uploaded_at
                })
                .map(|other| other.combined_expected_count.max(other.expected_count))
                .max()
                .unwrap_or(row.expected_count);
            row.combined_expected_count = row.combined_expected_count.max(max_expected);
        }
        Ok(due)
    }

    /// Lưu kết quả đối chiếu theo kiểm tra `generation` và `combined_expected_count` chống ghi đè lạc hậu.
    pub fn apply_inspection(
        &self,
        id: &str,
        generation: &str,
        result: ReconcileRecord,
        now_ms: u64,
    ) -> Result<Option<ReconcileRecord>, CoreError> {
        let _lock = self.lock()?;
        let mut ledger = self.read_all()?;
        let Some(pos) = ledger
            .records
            .iter()
            .position(|row| row.id == id && row.generation == generation)
        else {
            return Ok(None);
        };

        let latest_combined = ledger.records[pos].combined_expected_count;
        if latest_combined > result.checked_expected.unwrap_or(0) {
            ledger.records[pos].next_at = now_ms;
            let current = ledger.records[pos].clone();
            self.save_all(&ledger)?;
            return Ok(Some(current));
        }

        ledger.records[pos] = result.clone();
        self.save_all(&ledger)?;
        Ok(Some(result))
    }

    pub fn cancel(&self, ids: &HashSet<String>) -> Result<(), CoreError> {
        let _lock = self.lock()?;
        let mut ledger = self.read_all()?;
        ledger.records.retain(|r| !ids.contains(&r.id));
        self.save_all(&ledger)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    const NOW: u64 = 1_000_000_000;

    fn book_id() -> String {
        "a".repeat(24)
    }

    fn vol(name: &str, count: usize, received: bool, before: i64) -> ReconcileVolume {
        ReconcileVolume {
            key: name.into(),
            name: name.into(),
            count,
            received,
            history_before: Some(HistoryBaseline {
                total: before,
                rows: Vec::new(),
            }),
            ..Default::default()
        }
    }

    fn base_record(volumes: Vec<ReconcileVolume>) -> ReconcileRecord {
        let expected: usize = volumes.iter().map(|v| v.count).sum();
        ReconcileRecord {
            id: "job".into(),
            account: "reader".into(),
            book_id: book_id(),
            mode: JobMode::New,
            url: "https://wikicv.org/truyen/test".into(),
            title: "Tên gốc".into(),
            expected_count: expected,
            published: true,
            uploaded_at: NOW - 60_000,
            last_progress_at: NOW - 60_000,
            volumes,
            ..Default::default()
        }
    }

    fn obs(
        count: Result<Option<usize>, &str>,
        history_entries: Vec<(&str, &str)>,
        total: Option<i64>,
    ) -> ReconcileObservation {
        let rows: Vec<HistoryEntry> = history_entries
            .into_iter()
            .map(|(acc, msg)| parse_history_message(acc, msg))
            .collect();
        let total = total.unwrap_or(rows.len() as i64);
        ReconcileObservation {
            history: Ok(HistorySnapshot { rows, total }),
            count: count
                .map(|opt| {
                    opt.map(|n| BookCountObservation {
                        book_id: book_id(),
                        title: "Tên gốc".into(),
                        count: n,
                        source: "works".into(),
                    })
                })
                .map_err(|e| e.to_owned()),
            resolved_url: None,
            resolved_published: false,
            updated_works_cursor: None,
        }
    }

    #[test]
    fn existing_mode_never_claims_embed_and_waiting_schedules_30m() {
        let mut existing = base_record(vec![vol("Bổ sung", 10, true, 0)]);
        existing.mode = JobMode::Existing;
        let res = reconcile_inspect(&existing, &obs(Ok(Some(0)), vec![], None), NOW);
        assert!(res.message.starts_with("Đã tải file."));
        assert!(!res.message.contains("nhúng thành công"));

        let new_rec = base_record(vec![vol("Chính văn", 186, true, 0)]);
        let res_new = reconcile_inspect(&new_rec, &obs(Ok(Some(0)), vec![], None), NOW);
        assert_eq!(res_new.status, JobStatus::Waiting);
        assert_eq!(res_new.server_state, Some(ServerState::Processing));
        assert!(res_new.message.contains("nhúng thành công"));
        assert_eq!(res_new.next_at, NOW + 30 * 60_000);
        assert!(res_new.error.is_empty());
    }

    #[test]
    fn exact_or_extra_count_completes_and_partial_shows_volume_prefix() {
        for count in [186usize, 190] {
            let rec = base_record(vec![vol("Chính văn", 186, true, 0)]);
            let mut o = obs(Ok(Some(count)), vec![], None);
            if let Ok(Some(ref mut b)) = o.count {
                b.title = "Tên do user sửa".into();
            }
            let res = reconcile_inspect(&rec, &o, NOW);
            assert_eq!(res.status, JobStatus::Complete);
            assert_eq!(res.actual_count, Some(count));
            assert_eq!(res.next_at, 0);
        }

        let partial = base_record(vec![
            vol("Một", 100, true, 0),
            vol("Hai", 80, true, 0),
            vol("Ba", 6, true, 0),
        ]);
        let res_partial = reconcile_inspect(&partial, &obs(Ok(Some(100)), vec![], None), NOW);
        assert_eq!(res_partial.server_state, Some(ServerState::Partial));
        assert!(res_partial.message.contains("1/3 quyển"));
        assert!(res_partial.message.contains("quyển 2–3"));

        let non_boundary = base_record(vec![vol("Một", 100, true, 0), vol("Hai", 86, true, 0)]);
        let res_nb = reconcile_inspect(&non_boundary, &obs(Ok(Some(90)), vec![], None), NOW);
        assert_eq!(res_nb.server_state, Some(ServerState::Processing));
        assert!(res_nb.message.contains("90/186"));
        assert!(!res_nb.message.contains("1/2 quyển"));

        let mut with_base = base_record(vec![vol("Một", 100, true, 0), vol("Hai", 86, true, 0)]);
        with_base.mode = JobMode::Existing;
        with_base.baseline_count = 20;
        with_base.expected_count = 206;
        let res_base = reconcile_inspect(&with_base, &obs(Ok(Some(120)), vec![], None), NOW);
        assert_eq!(res_base.server_state, Some(ServerState::Partial));
        assert!(res_base.message.contains("120/206"));

        let mut combined = base_record(vec![vol("Một", 100, true, 0), vol("Hai", 86, true, 0)]);
        combined.combined_expected_count = 200;
        let res_comb = reconcile_inspect(&combined, &obs(Ok(Some(100)), vec![], None), NOW);
        assert!(!res_comb.message.contains("1/2 quyển"));
        assert_eq!(res_comb.checked_expected, Some(200));
    }

    #[test]
    fn history_receipt_recovery_append_note_and_single_claim_rules() {
        let mut lost = base_record(vec![vol("Chính văn", 186, false, 0)]);
        lost.published = false;
        let res = reconcile_inspect(
            &lost,
            &obs(
                Ok(Some(0)),
                vec![
                    ("reader", "đã tạo truyện"),
                    ("reader", "đã thêm file quyển Chính văn"),
                ],
                None,
            ),
            NOW,
        );
        assert!(res.volumes[0].received);
        assert!(res.volumes[0].confirmed_by_history);
        assert!(res.published);
        assert_eq!(res.server_state, Some(ServerState::Processing));

        for bad in [
            ("other", "đã thêm file bổ sung (10-20) vào quyển Một"),
            ("reader", "đã thêm file bổ sung (1-11) vào quyển Một"),
            ("reader", "đã thêm file quyển Một"),
        ] {
            let mut app = vol("Một", 11, false, 0);
            app.append = true;
            app.note = "10-20".into();
            let r = reconcile_inspect(
                &base_record(vec![app]),
                &obs(Ok(Some(0)), vec![bad], None),
                NOW,
            );
            assert!(!r.volumes[0].received);
        }

        let mut app_ok = vol("Một", 11, false, 0);
        app_ok.append = true;
        app_ok.note = "10-20".into();
        let r_ok = reconcile_inspect(
            &base_record(vec![app_ok]),
            &obs(
                Ok(Some(0)),
                vec![("reader", "đã thêm file bổ sung (10-20) vào quyển Một")],
                None,
            ),
            NOW,
        );
        assert!(r_ok.volumes[0].received);

        let old_match = reconcile_inspect(
            &base_record(vec![vol("Một", 1, false, 1)]),
            &obs(
                Ok(Some(0)),
                vec![
                    ("other", "đã sửa truyện"),
                    ("reader", "đã thêm file quyển Một"),
                ],
                None,
            ),
            NOW,
        );
        assert!(!old_match.volumes[0].received);

        let two_same = reconcile_inspect(
            &base_record(vec![vol("Một", 1, false, 0), vol("Một", 1, false, 0)]),
            &obs(
                Ok(Some(0)),
                vec![("reader", "đã thêm file quyển Một")],
                None,
            ),
            NOW,
        );
        assert_eq!(two_same.received_volumes, 1);

        // Nếu tổng số thay đổi lớn hơn số dòng đã đọc, không xác nhận nhầm.
        let truncated = reconcile_inspect(
            &base_record(vec![vol("Một", 1, false, 0)]),
            &obs(
                Ok(Some(0)),
                vec![("reader", "đã thêm file quyển Một")],
                Some(20),
            ),
            NOW,
        );
        assert!(!truncated.volumes[0].received);
    }

    #[test]
    fn outages_progress_review_and_resume_states() {
        let mut stale_row = base_record(vec![vol("Một", 186, true, 0)]);
        stale_row.actual_count = Some(10);
        let edited = reconcile_inspect(
            &stale_row,
            &obs(Ok(Some(10)), vec![("reader", "đã xóa quyển Một")], None),
            NOW,
        );
        assert!(edited.history_changed);
        assert!(edited.message.contains("đã xóa quyển Một"));
        assert_eq!(edited.status, JobStatus::Waiting);

        let later = reconcile_inspect(
            &edited,
            &obs(Ok(Some(10)), vec![("reader", "đã xóa quyển Một")], Some(1)),
            NOW + VerificationPolicy::REVIEW_AFTER_MS,
        );
        assert_eq!(later.status, JobStatus::Uncertain);
        assert_eq!(later.server_state, Some(ServerState::Review));
        assert!(later.message.contains("24 giờ"));

        let mut progressed = base_record(vec![vol("Một", 186, true, 0)]);
        progressed.attempt = 20;
        progressed.actual_count = Some(10);
        progressed.last_progress_at = NOW - VerificationPolicy::REVIEW_AFTER_MS;
        let res_prog = reconcile_inspect(&progressed, &obs(Ok(Some(11)), vec![], None), NOW);
        assert_eq!(res_prog.status, JobStatus::Waiting);
        assert_eq!(res_prog.last_progress_at, NOW);
        assert_eq!(res_prog.next_at, NOW + 60 * 60_000);

        let mut offline_long = base_record(vec![vol("Một", 186, true, 0)]);
        offline_long.last_progress_at = NOW - 2 * VerificationPolicy::REVIEW_AFTER_MS;
        let res_off = reconcile_inspect(&offline_long, &obs(Err("HTTP 503"), vec![], None), NOW);
        assert_eq!(res_off.status, JobStatus::Waiting);
        assert_eq!(res_off.server_state, Some(ServerState::Connection));
        assert!(res_off.error.is_empty());
        assert!(res_off.next_at > NOW);

        let mut missing_url = base_record(vec![vol("Một", 186, true, 0)]);
        missing_url.url.clear();
        let mut wrong_id_obs = obs(Ok(Some(186)), vec![], None);
        if let Ok(Some(ref mut b)) = wrong_id_obs.count {
            b.book_id = "b".repeat(24);
        }
        wrong_id_obs.count = Ok(None);
        let locating = reconcile_inspect(&missing_url, &wrong_id_obs, NOW);
        assert_eq!(locating.server_state, Some(ServerState::Locating));
        assert_eq!(locating.next_at, NOW + VerificationPolicy::LOCATE_DELAY_MS);
        assert_eq!(locating.status, JobStatus::Waiting);

        let mut unsent_later = vol("Hai", 86, false, 0);
        unsent_later.attempted = false;
        let partial_unsent = base_record(vec![vol("Một", 100, true, 0), unsent_later]);
        let res_resume = reconcile_inspect(&partial_unsent, &obs(Ok(Some(100)), vec![], None), NOW);
        assert_eq!(res_resume.status, JobStatus::Uncertain);
        assert_eq!(res_resume.server_state, Some(ServerState::Resume));
        assert!(res_resume.message.contains("1 quyển chưa gửi"));

        let mut unpub = base_record(vec![vol("Mục lục", 369, false, 1)]);
        unpub.url.clear();
        unpub.published = false;
        unpub.publication_attempted = false;
        unpub.failed_stage = Some(UploadStage::Upload);
        let mut no_count = obs(
            Ok(None),
            vec![("reader", "đã thêm file quyển Mục lục")],
            None,
        );
        no_count.count = Ok(None);
        let res_unpub = reconcile_inspect(&unpub, &no_count, NOW);
        assert_eq!(res_unpub.server_state, Some(ServerState::Resume));
        assert_eq!(res_unpub.status, JobStatus::Uncertain);
        assert!(!res_unpub.volumes[0].received);
        assert!(res_unpub.message.contains("Chưa nhúng"));

        unpub.publication_attempted = true;
        let res_attempted = reconcile_inspect(&unpub, &no_count, NOW);
        assert_eq!(res_attempted.server_state, Some(ServerState::Locating));
        assert_eq!(res_attempted.status, JobStatus::Waiting);

        let mut rej = base_record(vec![vol("Một", 186, true, 0)]);
        rej.url.clear();
        rej.published = false;
        rej.rejected = true;
        rej.failed_stage = Some(UploadStage::Publish);
        let res_rej = reconcile_inspect(&rej, &obs(Ok(None), vec![], None), NOW);
        assert_eq!(res_rej.status, JobStatus::Uncertain);
        assert_eq!(res_rej.server_state, Some(ServerState::Review));
    }

    #[test]
    fn ledger_persists_raises_combined_total_and_prevents_stale_override() {
        let dir = tempdir().expect("tempdir");
        let ledger = VerificationLedger::new(dir.path().to_path_buf());

        ledger
            .schedule(
                ScheduleVerifyInput {
                    id: "job-1".into(),
                    generation: "gen-1".into(),
                    account: "reader".into(),
                    book_id: book_id(),
                    expected_count: 100,
                    volumes: vec![vol("Một", 100, true, 0)],
                    ..Default::default()
                },
                NOW,
            )
            .expect("sched 1");

        let due = ledger
            .due_records(NOW + VerificationPolicy::LOCATE_DELAY_MS, None)
            .expect("due");
        assert_eq!(due.len(), 1);
        let inspected = reconcile_inspect(
            &due[0],
            &obs(Ok(Some(100)), vec![], None),
            NOW + VerificationPolicy::LOCATE_DELAY_MS,
        );
        assert_eq!(inspected.status, JobStatus::Complete);

        // Giữa chừng một job khác đẩy combined_expected_count của job-1 lên 200.
        ledger
            .schedule(
                ScheduleVerifyInput {
                    id: "job-2".into(),
                    generation: "gen-2".into(),
                    account: "reader".into(),
                    book_id: book_id(),
                    expected_count: 200,
                    volumes: vec![vol("Hai", 100, true, 0)],
                    ..Default::default()
                },
                NOW + 1000,
            )
            .expect("sched 2");

        let applied = ledger
            .apply_inspection(
                "job-1",
                "gen-1",
                inspected,
                NOW + VerificationPolicy::LOCATE_DELAY_MS,
            )
            .expect("apply")
            .expect("present");
        // Không được phép chốt Complete với 100 chương khi combined_expected_count đã tăng lên 200!
        assert_ne!(applied.status, JobStatus::Complete);
        assert_eq!(applied.combined_expected_count, 200);
        assert_eq!(applied.next_at, NOW + VerificationPolicy::LOCATE_DELAY_MS);
        assert_eq!(
            ledger.pending_count("reader", &book_id()).expect("pending"),
            200
        );
    }
}
