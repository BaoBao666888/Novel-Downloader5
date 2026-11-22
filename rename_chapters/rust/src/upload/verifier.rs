use std::fmt;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use crate::CoreError;
use crate::upload::html::{
    parse_current_account, parse_detail_page, parse_history_page, parse_index_page,
    parse_works_page, percent_encode_component,
};
use crate::upload::protocol::{BOOK_INDEX_PAGE_SIZE, sign_book_index};
use crate::upload::reconcile::{
    BookCountObservation, HistorySnapshot, ReconcileObservation, ReconcileRecord,
    VerificationLedger, reconcile_inspect,
};

#[derive(Debug, Clone, Default)]
pub struct ReadCancellation {
    canceled: Arc<AtomicBool>,
}

impl ReadCancellation {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn cancel(&self) {
        self.canceled.store(true, Ordering::SeqCst);
    }

    pub fn is_canceled(&self) -> bool {
        self.canceled.load(Ordering::SeqCst)
    }

    pub fn check(&self) -> Result<(), VerifierError> {
        if self.is_canceled() {
            Err(VerifierError::Canceled)
        } else {
            Ok(())
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VerifierError {
    Canceled,
    Failed(String),
}

impl VerifierError {
    pub fn is_canceled(&self) -> bool {
        matches!(self, Self::Canceled)
    }
}

impl fmt::Display for VerifierError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Canceled => f.write_str("Lượt tải đã dừng."),
            Self::Failed(msg) => f.write_str(msg),
        }
    }
}

impl std::error::Error for VerifierError {}

impl From<CoreError> for VerifierError {
    fn from(value: CoreError) -> Self {
        Self::Failed(value.to_string())
    }
}

/// Ranh giới đọc HTML chỉ-đọc cho `VerificationReader`.
pub trait ReadHttp {
    fn get_html(&mut self, url: &str, cancel: &ReadCancellation) -> Result<String, VerifierError>;
}

pub struct VerificationReader<'a, H: ReadHttp> {
    http: &'a mut H,
    allowed_host: String,
}

impl<'a, H: ReadHttp> VerificationReader<'a, H> {
    pub fn new(http: &'a mut H, allowed_host: impl Into<String>) -> Self {
        Self {
            http,
            allowed_host: allowed_host.into(),
        }
    }

    fn base_url(&self) -> String {
        format!("https://{}", self.allowed_host)
    }

    fn authorized(
        &mut self,
        url: &str,
        expected_account: &str,
        cancel: &ReadCancellation,
    ) -> Result<String, VerifierError> {
        cancel.check()?;
        let html = self.http.get_html(url, cancel)?;
        cancel.check()?;
        if parse_current_account(&html, &self.allowed_host) != expected_account {
            return Err(VerifierError::Failed(
                "Đăng nhập lại đúng ID tài khoản để kiểm tra.".to_owned(),
            ));
        }
        Ok(html)
    }

    pub fn fetch_history(
        &mut self,
        book_id: &str,
        limit: usize,
        cancel: &ReadCancellation,
    ) -> Result<HistorySnapshot, VerifierError> {
        let base = self.base_url();
        let encoded_id = percent_encode_component(book_id);
        let mut read_page =
            |start: usize| -> Result<crate::upload::html::HistoryPage, VerifierError> {
                cancel.check()?;
                let url = format!("{base}/history?bookId={encoded_id}&group=0&start={start}");
                let html = self.http.get_html(&url, cancel)?;
                cancel.check()?;
                parse_history_page(&html, start).map_err(VerifierError::from)
            };

        for _ in 0..3 {
            let first = read_page(0)?;
            let last = if first.last > 0 {
                read_page(first.last)?
            } else {
                first.clone()
            };
            if last.last == first.last && (first.last == 0 || read_page(0)? == first) {
                let total = first.last + last.rows.len();
                let mut rows = first.rows;
                let max_fetch = total.min(limit);
                let mut start = 10usize;
                while start < max_fetch {
                    if start == first.last {
                        rows.extend(last.rows.clone());
                    } else {
                        rows.extend(read_page(start)?.rows);
                    }
                    start += 10;
                }
                return Ok(HistorySnapshot {
                    rows,
                    total: total as i64,
                });
            }
        }

        Err(VerifierError::Failed(
            "Lịch sử đang thay đổi. App sẽ kiểm tra lại.".to_owned(),
        ))
    }

    fn find_count(
        &mut self,
        row: &mut ReconcileRecord,
        cancel: &ReadCancellation,
    ) -> Result<Option<BookCountObservation>, VerifierError> {
        let base = self.base_url();
        let account = row.account.clone();
        let book_id = row.book_id.clone();

        let queries: Vec<String> = if row.url.is_empty() {
            let mut list = Vec::new();
            for candidate in [row.title.clone(), row.title_cn.clone(), String::new()] {
                if !list.contains(&candidate) {
                    list.push(candidate);
                }
            }
            list
        } else {
            vec![row.title.clone()]
        };

        let mut works_read = false;
        let mut last_error: Option<VerifierError> = None;

        for query in queries {
            let encoded_acc = percent_encode_component(&account);
            let url = if query.is_empty() {
                format!("{base}/user/{encoded_acc}/works?start={}", row.works_cursor)
            } else {
                format!(
                    "{base}/user/{encoded_acc}/works?start=0&q={}",
                    percent_encode_component(&query)
                )
            };

            match self.authorized(&url, &account, cancel) {
                Ok(html) => {
                    match parse_works_page(&html, &book_id, row.works_cursor, &self.allowed_host) {
                        Ok(parsed) => {
                            works_read = true;
                            if query.is_empty() {
                                row.works_cursor = parsed.next_cursor;
                            }
                            if let Some(found) = parsed.matched
                                && let Some(found_url) = found.url
                            {
                                row.url = found_url;
                                row.published = true;
                                if let Some(obs) = found.count {
                                    return Ok(Some(obs));
                                }
                                break;
                            }
                        }
                        Err(err) => last_error = Some(VerifierError::from(err)),
                    }
                }
                Err(err @ VerifierError::Canceled) => return Err(err),
                Err(err) => last_error = Some(err),
            }
        }

        if row.url.is_empty() {
            if !works_read {
                return Err(last_error
                    .unwrap_or_else(|| VerifierError::Failed("Chưa đọc được Works.".to_owned())));
            }
            return Ok(None);
        }

        let resolved_url = row.url.clone();
        let detail_html = self.authorized(&resolved_url, &account, cancel)?;
        let detail = parse_detail_page(&detail_html)?;
        if detail.id != book_id {
            return Err(VerifierError::Failed("ID truyện không khớp.".to_owned()));
        }

        if !crate::upload::reconcile::title_matches(&row.title, &detail.title)
            && !detail.title.trim().is_empty()
        {
            let renamed_url = format!(
                "{base}/user/{}/works?start=0&q={}",
                percent_encode_component(&account),
                percent_encode_component(&detail.title)
            );
            if let Ok(renamed_html) = self.authorized(&renamed_url, &account, cancel)
                && let Ok(parsed) = parse_works_page(&renamed_html, &book_id, 0, &self.allowed_host)
                && let Some(found) = parsed.matched
                && let Some(obs) = found.count
            {
                return Ok(Some(obs));
            }
        }

        if let Some(count) = detail.count {
            return Ok(Some(BookCountObservation {
                book_id,
                title: detail.title,
                count,
                source: "detail".to_owned(),
            }));
        }
        if detail.key.is_empty() {
            return Err(VerifierError::Failed("Thiếu khóa mục lục.".to_owned()));
        }

        let mut start = 0usize;
        for _ in 0..6 {
            cancel.check()?;
            let sign = sign_book_index(&detail.key, start, BOOK_INDEX_PAGE_SIZE, detail.rotate);
            let index_url = format!(
                "{base}/book/index?bookId={}&signKey={}&sign={sign}&start={start}&size={BOOK_INDEX_PAGE_SIZE}",
                percent_encode_component(&book_id),
                percent_encode_component(&detail.key),
            );
            let html = self.http.get_html(&index_url, cancel)?;
            cancel.check()?;
            let (n, last) = parse_index_page(&html, start);
            if n == 0 && start != 0 {
                return Err(VerifierError::Failed(
                    "Trang mục lục cuối chưa sẵn sàng.".to_owned(),
                ));
            }
            if last <= start {
                return Ok(Some(BookCountObservation {
                    book_id,
                    title: detail.title,
                    count: start + n,
                    source: "index".to_owned(),
                }));
            }
            start = last;
        }

        Err(VerifierError::Failed(
            "Chưa xác định được trang mục lục cuối.".to_owned(),
        ))
    }

    pub fn inspect(
        &mut self,
        input: &ReconcileRecord,
        now_ms: u64,
        cancel: &ReadCancellation,
    ) -> Result<ReconcileRecord, VerifierError> {
        cancel.check()?;
        let mut working = input.clone();

        let history_res = match self.fetch_history(&working.book_id, 10, cancel) {
            Ok(mut snapshot) => {
                let pending_before = working
                    .volumes
                    .iter()
                    .filter(|v| !v.received)
                    .filter_map(|v| {
                        v.history_before
                            .as_ref()
                            .map(|h| h.total)
                            .filter(|&t| t >= 0)
                    })
                    .min();
                let pending_added = pending_before
                    .map(|before| snapshot.total - before)
                    .unwrap_or(0);
                if pending_added > 0 && pending_added as usize > snapshot.rows.len() {
                    let fetch_limit = (pending_added as usize).min(100);
                    match self.fetch_history(&working.book_id, fetch_limit, cancel) {
                        Ok(wider) => snapshot = wider,
                        Err(err @ VerifierError::Canceled) => return Err(err),
                        Err(_) => {}
                    }
                }
                Ok(snapshot)
            }
            Err(err @ VerifierError::Canceled) => return Err(err),
            Err(VerifierError::Failed(msg)) => Err(msg),
        };

        let count_res = match self.find_count(&mut working, cancel) {
            Ok(obs) => Ok(obs),
            Err(err @ VerifierError::Canceled) => return Err(err),
            Err(VerifierError::Failed(msg)) => Err(msg),
        };

        cancel.check()?;
        let observation = ReconcileObservation {
            history: history_res,
            count: count_res,
            resolved_url: (!working.url.is_empty()).then(|| working.url.clone()),
            resolved_published: working.published,
            updated_works_cursor: Some(working.works_cursor),
        };
        Ok(reconcile_inspect(&working, &observation, now_ms))
    }
}

pub fn run_due_ledger<H: ReadHttp>(
    ledger: &VerificationLedger,
    http: &mut H,
    allowed_host: &str,
    now_ms: u64,
    only_id: Option<&str>,
    cancel: &ReadCancellation,
) -> Result<Vec<ReconcileRecord>, VerifierError> {
    cancel.check()?;
    let due = ledger.due_records(now_ms, only_id)?;
    let mut updated = Vec::new();

    for row in due {
        cancel.check()?;
        let id = row.id.clone();
        let generation = row.generation.clone();
        let inspected =
            VerificationReader::new(http, allowed_host).inspect(&row, now_ms, cancel)?;
        cancel.check()?;
        if let Some(saved) = ledger.apply_inspection(&id, &generation, inspected, now_ms)? {
            updated.push(saved);
        }
    }
    Ok(updated)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::upload::model::{HistoryBaseline, JobMode, JobStatus, ServerState};
    use crate::upload::protocol::{DEFAULT_WIKI_HOST, parse_https_url};
    use crate::upload::reconcile::{ReconcileVolume, VerificationPolicy};

    const NOW: u64 = 1_000_000_000;

    fn book_id() -> String {
        "a".repeat(24)
    }

    fn user_nav(account: &str) -> String {
        format!("<nav><a href='/user/{account}'>Hồ sơ của tôi</a></nav>")
    }

    fn works_html(count: &str, id: &str, title: &str, account: &str) -> String {
        format!(
            "{}<div class='book-list'><div class='book-info'><input name='bookId' value='{id}'><a class='book-title' href='/truyen/test'>{title}</a><span class='book-chapter-count'>{count}</span></div></div>",
            user_nav(account)
        )
    }

    fn history_html(entries: &[(&str, &str)], last: usize) -> String {
        let mut out = String::from("<ul class='report-history-list'>");
        for (account, message) in entries {
            out.push_str(&format!(
                "<li><div class='report-time'>16-10-2026</div><div class='report-message'><a href='/user/{account}'>Tên</a> {message}</div></li>"
            ));
        }
        out.push_str("</ul>");
        if last > 0 {
            out.push_str(&format!(
                "<a data-action='loadBookHistory' data-start='{last}'></a>"
            ));
        }
        out
    }

    fn base_job(vols: Vec<ReconcileVolume>) -> ReconcileRecord {
        let expected: usize = vols.iter().map(|v| v.count).sum();
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
            volumes: vols,
            ..Default::default()
        }
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

    struct MockHttp<F>
    where
        F: FnMut(&str, &ReadCancellation) -> Result<String, VerifierError>,
    {
        calls: Vec<String>,
        handler: F,
    }

    impl<F> MockHttp<F>
    where
        F: FnMut(&str, &ReadCancellation) -> Result<String, VerifierError>,
    {
        fn new(handler: F) -> Self {
            Self {
                calls: Vec::new(),
                handler,
            }
        }
    }

    impl<F> ReadHttp for MockHttp<F>
    where
        F: FnMut(&str, &ReadCancellation) -> Result<String, VerifierError>,
    {
        fn get_html(
            &mut self,
            url: &str,
            cancel: &ReadCancellation,
        ) -> Result<String, VerifierError> {
            cancel.check()?;
            self.calls.push(url.to_owned());
            (self.handler)(url, cancel)
        }
    }

    #[test]
    fn missing_publication_link_is_found_only_by_stable_id_and_bounded_works_cursor() {
        let mut row = base_job(vec![vol("Một", 186, true, 0)]);
        row.url.clear();
        let cancel = ReadCancellation::new();

        let mut http = MockHttp::new(|url, _| {
            if parse_https_url(url).expect("url").path == "/history" {
                Ok(history_html(&[], 0))
            } else {
                Ok(works_html("186", &book_id(), "Tên gốc", "reader"))
            }
        });
        let found = VerificationReader::new(&mut http, DEFAULT_WIKI_HOST)
            .inspect(&row, NOW, &cancel)
            .expect("ok");
        assert_eq!(found.url, "https://wikicv.org/truyen/test");
        assert_eq!(found.status, JobStatus::Complete);
        assert!(
            !http
                .calls
                .iter()
                .any(|u| parse_https_url(u).expect("u").path == "/truyen/test")
        );

        // Same title but different book ID must stay locating instead of resolving.
        let mut http_wrong = MockHttp::new(|url, _| {
            if parse_https_url(url).expect("url").path == "/history" {
                Ok(history_html(&[], 0))
            } else {
                Ok(works_html("186", &"b".repeat(24), "Tên gốc", "reader"))
            }
        });
        let res_wrong = VerificationReader::new(&mut http_wrong, DEFAULT_WIKI_HOST)
            .inspect(&row, NOW, &cancel)
            .expect("ok");
        assert_eq!(res_wrong.server_state, Some(ServerState::Locating));
        assert!(res_wrong.url.is_empty());
        assert_eq!(res_wrong.next_at, NOW + VerificationPolicy::LOCATE_DELAY_MS);

        // Bounded Works cursor advances per check without fetching next pages eagerly.
        let empty = format!(
            "{}<div class='book-list'></div><ul class='pagination'><a data-start='10'>Sau</a></ul>",
            user_nav("reader")
        );
        let mut http_cursor = MockHttp::new(|url, _| {
            if parse_https_url(url).expect("url").path == "/history" {
                Ok(history_html(&[], 0))
            } else if url.ends_with("works?start=10") {
                Ok(works_html("186", &book_id(), "Tên gốc", "reader"))
            } else {
                Ok(empty.clone())
            }
        });
        let first = VerificationReader::new(&mut http_cursor, DEFAULT_WIKI_HOST)
            .inspect(&row, NOW, &cancel)
            .expect("first");
        assert_eq!(first.works_cursor, 10);
        assert!(!http_cursor.calls.iter().any(|u| u.contains("start=10")));

        let second = VerificationReader::new(&mut http_cursor, DEFAULT_WIKI_HOST)
            .inspect(&first, NOW + 180_000, &cancel)
            .expect("second");
        assert_eq!(second.status, JobStatus::Complete);
        assert!(
            http_cursor
                .calls
                .iter()
                .any(|u| u.ends_with("works?start=10"))
        );
    }

    #[test]
    fn history_reads_first_and_last_then_only_needed_and_skips_if_acknowledged() {
        let cancel = ReadCancellation::new();
        let row = base_job(vec![vol("Một", 186, false, 99)]);
        let mut http = MockHttp::new(|url, _| {
            if parse_https_url(url).expect("url").path != "/history" {
                return Ok(works_html("0", &book_id(), "Tên gốc", "reader"));
            }
            if url.contains("start=0") {
                let mut entries = vec![("reader", "đã thêm file quyển Một")];
                entries.extend(std::iter::repeat_n(("other", "đã thêm file quyển Khác"), 9));
                Ok(history_html(&entries, 100))
            } else {
                Ok(history_html(&[("reader", "đã sửa truyện")], 100))
            }
        });
        let res = VerificationReader::new(&mut http, DEFAULT_WIKI_HOST)
            .inspect(&row, NOW, &cancel)
            .expect("ok");
        assert_eq!(res.history_total, Some(101));
        assert!(res.volumes[0].received);
        assert_eq!(
            http.calls
                .iter()
                .filter(|u| parse_https_url(u).expect("u").path == "/history")
                .count(),
            3
        );

        let acked = base_job(vec![vol("Một", 186, true, 0)]);
        let mut http_acked = MockHttp::new(|url, _| {
            if parse_https_url(url).expect("url").path != "/history" {
                return Ok(works_html("0", &book_id(), "Tên gốc", "reader"));
            }
            let entries = vec![("reader", "đã sửa truyện"); 10];
            Ok(history_html(&entries, 1000))
        });
        let res_ack = VerificationReader::new(&mut http_acked, DEFAULT_WIKI_HOST)
            .inspect(&acked, NOW, &cancel)
            .expect("ok");
        assert_eq!(res_ack.status, JobStatus::Waiting);
        assert_eq!(
            http_acked
                .calls
                .iter()
                .filter(|u| parse_https_url(u).expect("u").path == "/history")
                .count(),
            3
        );
        assert!(!http_acked.calls.iter().any(|u| u.contains("start=10&")));
    }

    #[test]
    fn unknown_works_count_uses_last_index_page_and_guards_login_and_cancellation() {
        let cancel = ReadCancellation::new();
        let row = base_job(vec![vol("Một", 600, true, 0)]);
        let mut http = MockHttp::new(|url, _| {
            let path = parse_https_url(url).expect("url").path;
            match path.as_str() {
                "/history" => Ok(history_html(&[], 0)),
                "/user/reader/works" => Ok(works_html("…", &book_id(), "Tên gốc", "reader")),
                "/truyen/test" => Ok(format!(
                    "{}<input name='bookId' value='{}'><div class='cover-info'><h2>Tên</h2></div><script>var signKey='abc';function fuzzySign(text){{return text.substring(1)+text.substring(0,1)}}</script>",
                    user_nav("reader"),
                    book_id()
                )),
                "/book/index" => {
                    assert!(url.contains("size=501"));
                    if url.contains("start=0&") {
                        Ok("<ul class='pagination'><a data-start='501'>Cuối</a></ul>".into())
                    } else {
                        Ok("<li class='chapter-name'><a>C</a></li>".repeat(99))
                    }
                }
                _ => panic!("unexpected {url}"),
            }
        });
        let res = VerificationReader::new(&mut http, DEFAULT_WIKI_HOST)
            .inspect(&row, NOW, &cancel)
            .expect("complete");
        assert_eq!(res.status, JobStatus::Complete);
        assert_eq!(res.actual_count, Some(600));
        assert_eq!(
            http.calls
                .iter()
                .filter(|u| parse_https_url(u).expect("u").path == "/book/index")
                .count(),
            2
        );

        let mut wrong_login = MockHttp::new(|url, _| {
            if parse_https_url(url).expect("url").path == "/history" {
                Ok(history_html(&[], 0))
            } else {
                Ok(works_html("186", &book_id(), "Tên gốc", "another"))
            }
        });
        let res_login = VerificationReader::new(&mut wrong_login, DEFAULT_WIKI_HOST)
            .inspect(&base_job(vec![vol("Một", 186, true, 0)]), NOW, &cancel)
            .expect("waiting");
        assert_eq!(res_login.server_state, Some(ServerState::Connection));
        assert_eq!(res_login.status, JobStatus::Waiting);

        let mut hist_fail = MockHttp::new(|url, _| {
            if parse_https_url(url).expect("url").path == "/history" {
                Err(VerifierError::Failed("timeout".into()))
            } else {
                Ok(works_html("186", &book_id(), "Tên gốc", "reader"))
            }
        });
        let res_hf = VerificationReader::new(&mut hist_fail, DEFAULT_WIKI_HOST)
            .inspect(&base_job(vec![vol("Một", 186, true, 0)]), NOW, &cancel)
            .expect("complete");
        assert_eq!(res_hf.status, JobStatus::Complete);

        let cancel_now = ReadCancellation::new();
        cancel_now.cancel();
        let mut cancel_http = MockHttp::new(|_, _| Ok(String::new()));
        let err = VerificationReader::new(&mut cancel_http, DEFAULT_WIKI_HOST)
            .inspect(&row, NOW, &cancel_now)
            .expect_err("must cancel");
        assert!(err.is_canceled());
    }
}
