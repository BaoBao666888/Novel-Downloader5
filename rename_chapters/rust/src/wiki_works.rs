use std::collections::{BTreeMap, BTreeSet};
use std::fs::{self, File};
use std::io::{BufReader, ErrorKind, Read};
use std::path::{Path, PathBuf};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::CoreError;
use crate::upload::html::{
    parse_current_account, parse_works_catalog_page, percent_encode_component,
};
use crate::upload::protocol::{DEFAULT_WIKI_HOST, canonical_wiki_book_path};
use crate::upload::verifier::{ReadCancellation, ReadHttp};

#[derive(Debug, Clone, Serialize)]
pub struct WorkRow {
    pub id: String,
    pub title: String,
    pub url: Option<String>,
    pub chapter_count: Option<usize>,
    pub local_only: bool,
}

#[derive(Serialize)]
pub struct WorksView {
    pub account: String,
    pub server_count: Option<usize>,
    pub rows: Vec<WorkRow>,
}

#[derive(Default, Deserialize, Serialize)]
struct Catalog {
    username: String,
    book_ids: Vec<String>,
    books: BTreeMap<String, Map<String, Value>>,
    #[serde(default)]
    full_works_ids: Option<BTreeSet<String>>,
}

impl Catalog {
    fn view(&self) -> WorksView {
        let rows = self
            .book_ids
            .iter()
            .map(|id| {
                let entry = self.books.get(id);
                let field = |name| entry.and_then(|book| book.get(name));
                let url = field("url")
                    .and_then(Value::as_str)
                    .filter(|url| canonical_wiki_book_path(url, DEFAULT_WIKI_HOST).is_ok())
                    .map(str::to_owned);
                WorkRow {
                    id: id.clone(),
                    title: field("title")
                        .and_then(Value::as_str)
                        .filter(|v| !v.is_empty())
                        .unwrap_or(id)
                        .to_owned(),
                    url,
                    chapter_count: field("chapters")
                        .and_then(Value::as_u64)
                        .and_then(|n| usize::try_from(n).ok()),
                    local_only: self
                        .full_works_ids
                        .as_ref()
                        .is_some_and(|server| !server.contains(id)),
                }
            })
            .collect();
        WorksView {
            account: self.username.clone(),
            server_count: self.full_works_ids.as_ref().map(BTreeSet::len),
            rows,
        }
    }
}

pub fn valid_account(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 240
        && value.trim() == value
        && !matches!(value, "." | "..")
        && !value
            .chars()
            .any(|c| c.is_control() || matches!(c, '/' | '\\' | '?' | '#'))
}

pub struct WorksStore(PathBuf);
impl WorksStore {
    pub fn new(root: PathBuf) -> Self {
        Self(root)
    }

    fn path(&self, account: &str) -> Result<PathBuf, CoreError> {
        if !valid_account(account) {
            return Err("ID tài khoản Wikidich không hợp lệ.".into());
        }
        let key = crate::text_tools::sha256(account.as_bytes());
        let key = key
            .iter()
            .map(|byte| format!("{byte:02x}"))
            .collect::<String>();
        Ok(self.0.join(format!("{key}.json")))
    }

    fn load(&self, account: &str) -> Result<Catalog, CoreError> {
        match File::open(self.path(account)?) {
            Ok(file) => {
                let catalog: Catalog = serde_json::from_reader(BufReader::new(file))?;
                if catalog.username != account {
                    return Err("Kho Works không khớp tài khoản.".into());
                }
                Ok(catalog)
            }
            Err(err) if err.kind() == ErrorKind::NotFound => Ok(Catalog {
                username: account.to_owned(),
                ..Catalog::default()
            }),
            Err(err) => Err(err.into()),
        }
    }

    fn save(&self, catalog: Catalog) -> Result<WorksView, CoreError> {
        let dest = self.path(&catalog.username)?;
        fs::create_dir_all(&self.0)?;
        let mut staged = tempfile::NamedTempFile::new_in(&self.0)?;
        serde_json::to_writer(staged.as_file_mut(), &catalog)?;
        staged.as_file().sync_all()?;
        staged.persist(dest)?;
        Ok(catalog.view())
    }

    pub fn view(&self, account: &str) -> Result<WorksView, CoreError> {
        Ok(self.load(account)?.view())
    }

    pub fn import_legacy(&self, path: &Path) -> Result<WorksView, CoreError> {
        let file = File::open(path)?;
        const MAX_LEGACY_BYTES: u64 = 128 * 1024 * 1024;
        if file.metadata()?.len() > MAX_LEGACY_BYTES {
            return Err("Cache Wikidich vượt 128 MiB.".into());
        }
        let mut data: Catalog =
            serde_json::from_reader(BufReader::new(file.take(MAX_LEGACY_BYTES)))?;
        let mut catalog = self.load(&data.username)?;
        let mut seen: BTreeSet<_> = catalog.book_ids.iter().cloned().collect();
        for id in data.book_ids {
            if id.trim().is_empty() {
                continue;
            }
            if seen.insert(id.clone()) {
                catalog.book_ids.push(id.clone());
            }
            let incoming = data.books.remove(&id).unwrap_or_default();
            let book = catalog.books.entry(id).or_default();
            for (key, value) in incoming {
                book.entry(key).or_insert(value);
            }
        }
        catalog.full_works_ids = None;
        self.save(catalog)
    }

    pub fn sync(
        &self,
        account: &str,
        http: &mut impl ReadHttp,
        cancel: &ReadCancellation,
        delay: Duration,
    ) -> Result<WorksView, CoreError> {
        let mut catalog = self.load(account)?;
        let path = format!(
            "https://{DEFAULT_WIKI_HOST}/user/{}/works",
            percent_encode_component(account)
        );
        let mut incoming = Vec::new();
        let mut ids = BTreeSet::new();
        let mut expected = None;
        for _ in 0..1_000 {
            cancel.check()?;
            let html = http.get_html(&format!("{path}?start={}", incoming.len()), cancel)?;
            if parse_current_account(&html, DEFAULT_WIKI_HOST) != account {
                return Err("Phiên Wikidich không khớp ID tài khoản đang chọn.".into());
            }
            let (total, page) = parse_works_catalog_page(&html, DEFAULT_WIKI_HOST)?;
            let count = match expected {
                Some(count) => count,
                None => *expected.insert(total.ok_or("Trang Works thiếu tổng số truyện.")?),
            };
            if total.is_some_and(|n| n != count)
                || incoming.len() + page.len() > count
                || (page.is_empty() && incoming.len() < count)
            {
                return Err("Danh sách Works chưa đầy đủ hoặc vừa thay đổi. Hãy tải lại.".into());
            }
            for row in page {
                if !ids.insert(row.id.clone()) {
                    return Err("Works có ID trùng giữa các trang. Hãy tải lại.".into());
                }
                incoming.push(row);
            }
            if incoming.len() == count {
                break;
            }
            let mut remaining = delay;
            while !remaining.is_zero() {
                cancel.check()?;
                let step = remaining.min(Duration::from_millis(100));
                std::thread::sleep(step);
                remaining -= step;
            }
        }
        if expected != Some(incoming.len()) {
            return Err("Works vượt giới hạn số trang của một lượt tải.".into());
        }
        cancel.check()?;
        let mut order: Vec<_> = incoming.iter().map(|row| row.id.clone()).collect();
        order.extend(catalog.book_ids.into_iter().filter(|id| !ids.contains(id)));
        catalog.book_ids = order;
        for row in incoming {
            let book = catalog.books.entry(row.id).or_default();
            book.insert("title".into(), Value::String(row.title));
            if let Some(url) = row.url {
                book.insert("url".into(), Value::String(url));
            }
            if let Some(count) = row.chapter_count {
                book.insert("chapters".into(), Value::from(count));
            }
        }
        catalog.full_works_ids = Some(ids);
        self.save(catalog)
    }

    pub fn remove_local(&self, account: &str, ids: Vec<String>) -> Result<WorksView, CoreError> {
        let mut catalog = self.load(account)?;
        let server = catalog
            .full_works_ids
            .as_ref()
            .ok_or("Cần tải toàn bộ Works trước khi xóa truyện local.")?;
        if ids.is_empty()
            || ids
                .iter()
                .any(|id| server.contains(id) || !catalog.book_ids.contains(id))
        {
            return Err("Lựa chọn đã thay đổi. Hãy mở lại danh sách truyện local.".into());
        }
        let ids: BTreeSet<_> = ids.into_iter().collect();
        catalog.book_ids.retain(|id| !ids.contains(id));
        catalog.books.retain(|id, _| !ids.contains(id));
        self.save(catalog)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::VecDeque;

    use crate::upload::verifier::VerifierError;

    struct MockPages(VecDeque<(usize, String)>);
    impl ReadHttp for MockPages {
        fn get_html(
            &mut self,
            url: &str,
            cancel: &ReadCancellation,
        ) -> Result<String, VerifierError> {
            cancel.check()?;
            let (offset, html) = self.0.pop_front().expect("unexpected page request");
            assert_eq!(
                url,
                format!("https://wikicv.org/user/beta/works?start={offset}")
            );
            Ok(html)
        }
    }

    fn page(account: &str, total: usize, ids: &[&str]) -> String {
        let books = ids.iter().map(|id| format!(
            "<div class='book-info'><input name='bookId' value='{id}'><a class='book-title' href='/truyen/test-{id}'>Truyện {id}</a></div>"
        )).collect::<Vec<_>>().join("");
        format!(
            "<nav><a href='/user/{account}'>Hồ sơ của tôi</a></nav><span class='book-count'>{total}</span><div class='book-list'>{books}</div>"
        )
    }

    #[test]
    fn identifies_exact_local_rows_after_complete_pagination_and_removes_only_selection() {
        let tmp = tempfile::tempdir().unwrap();
        let source = tmp.path().join("old.json");
        let legacy = r#"{"username":"beta","book_ids":["old","same","old2"],"books":{"old":{"title":"Truyện dư"},"old2":{"title":"Truyện giữ lại"},"same":{"notes":"ghi chú riêng","chapters":12}}}"#;
        fs::write(&source, legacy).unwrap();
        let store = WorksStore::new(tmp.path().join("rust"));
        let initial = store.import_legacy(&source).unwrap();
        assert!(initial.rows.iter().all(|row| !row.local_only));
        assert!(store.remove_local("beta", vec!["old".into()]).is_err());

        let mut http = MockPages(
            [
                (0, page("beta", 2, &["new"])),
                (1, page("beta", 2, &["same"])),
            ]
            .into(),
        );
        let view = store
            .sync("beta", &mut http, &ReadCancellation::new(), Duration::ZERO)
            .unwrap();
        assert_eq!(view.server_count, Some(2));
        assert_eq!(view.rows[1].chapter_count, Some(12));
        assert_eq!(
            view.rows
                .iter()
                .filter(|row| row.local_only)
                .map(|row| row.title.as_str())
                .collect::<Vec<_>>(),
            vec!["Truyện dư", "Truyện giữ lại"]
        );
        assert!(
            store
                .remove_local("beta", vec!["old".into(), "same".into()])
                .is_err()
        );
        assert_eq!(store.view("beta").unwrap().rows.len(), 4);
        let updated = store.remove_local("beta", vec!["old".into()]).unwrap();
        assert_eq!(
            updated
                .rows
                .iter()
                .map(|row| row.id.as_str())
                .collect::<Vec<_>>(),
            vec!["new", "same", "old2"]
        );
        assert_eq!(
            store.load("beta").unwrap().books["same"]["notes"],
            "ghi chú riêng"
        );
        assert_eq!(fs::read_to_string(source).unwrap(), legacy);
        assert!(store.view("another").unwrap().rows.is_empty());
    }

    #[test]
    fn incomplete_duplicate_wrong_account_and_cancelled_pages_leave_catalog_unchanged() {
        let tmp = tempfile::tempdir().unwrap();
        let store = WorksStore::new(tmp.path().join("rust"));
        for pages in [
            [(0, page("beta", 2, &["same"])), (1, page("beta", 2, &[]))],
            [
                (0, page("beta", 2, &["same"])),
                (1, page("beta", 2, &["same"])),
            ],
            [
                (0, page("beta", 2, &["same"])),
                (1, page("another", 2, &["other"])),
            ],
            [
                (0, page("beta", 2, &["same"])),
                (1, page("beta", 3, &["other"])),
            ],
        ] {
            let mut http = MockPages(pages.into());
            assert!(
                store
                    .sync("beta", &mut http, &ReadCancellation::new(), Duration::ZERO)
                    .is_err()
            );
            assert!(store.view("beta").unwrap().rows.is_empty());
            assert!(store.view("beta").unwrap().server_count.is_none());
        }
        let cancel = ReadCancellation::new();
        cancel.cancel();
        assert!(
            store
                .sync(
                    "beta",
                    &mut MockPages(VecDeque::new()),
                    &cancel,
                    Duration::ZERO
                )
                .is_err()
        );
        let empty = store
            .sync(
                "beta",
                &mut MockPages([(0, page("beta", 0, &[]))].into()),
                &ReadCancellation::new(),
                Duration::ZERO,
            )
            .unwrap();
        assert_eq!(empty.server_count, Some(0));
    }
}
