use std::fmt::Write as _;

use crate::CoreError;
use crate::upload::protocol::{canonical_wiki_book_path, resolve_wiki_url};
use crate::upload::reconcile::{BookCountObservation, HistoryEntry, parse_history_message};

const VOID_TAGS: &[&str] = &[
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source",
    "track", "wbr",
];

#[derive(Debug, Clone)]
enum HtmlNode {
    Element(ElementNode),
    Text(String),
}

#[derive(Debug, Clone)]
struct ElementNode {
    tag: String,
    attrs: Vec<(String, String)>,
    children: Vec<HtmlNode>,
}

impl ElementNode {
    fn attr(&self, name: &str) -> Option<&str> {
        self.attrs
            .iter()
            .rev()
            .find(|(k, _)| k.eq_ignore_ascii_case(name))
            .map(|(_, v)| v.as_str())
    }

    fn has_class(&self, class_name: &str) -> bool {
        self.attr("class")
            .is_some_and(|raw| raw.split_whitespace().any(|c| c == class_name))
    }

    fn has_id(&self, id: &str) -> bool {
        self.attr("id").is_some_and(|v| v == id)
    }

    fn child_elements(&self) -> impl Iterator<Item = &ElementNode> {
        self.children.iter().filter_map(|node| match node {
            HtmlNode::Element(el) => Some(el),
            HtmlNode::Text(_) => None,
        })
    }

    fn find_all<'a>(
        &'a self,
        predicate: &dyn Fn(&ElementNode) -> bool,
        out: &mut Vec<&'a ElementNode>,
    ) {
        if predicate(self) {
            out.push(self);
        }
        for child in self.child_elements() {
            child.find_all(predicate, out);
        }
    }

    fn find_first(&self, predicate: &dyn Fn(&ElementNode) -> bool) -> Option<&ElementNode> {
        if predicate(self) {
            return Some(self);
        }
        for child in self.child_elements() {
            if let Some(found) = child.find_first(predicate) {
                return Some(found);
            }
        }
        None
    }

    fn text_excluding(&self, skip: Option<&ElementNode>) -> String {
        fn collect(node: &ElementNode, skip: Option<&ElementNode>, out: &mut String) {
            if let Some(target) = skip
                && std::ptr::eq(node, target)
            {
                return;
            }
            if node.tag == "script" || node.tag == "style" {
                return;
            }
            for child in &node.children {
                match child {
                    HtmlNode::Text(text) => out.push_str(text),
                    HtmlNode::Element(el) => {
                        if el.tag == "br" {
                            out.push(' ');
                        }
                        collect(el, skip, out);
                    }
                }
            }
        }
        let mut raw = String::new();
        collect(self, skip, &mut raw);
        let decoded = decode_html_entities(&raw);
        decoded.split_whitespace().collect::<Vec<_>>().join(" ")
    }

    fn text(&self) -> String {
        self.text_excluding(None)
    }
}

pub fn decode_html_entities(raw: &str) -> String {
    if !raw.contains('&') {
        return raw.to_owned();
    }
    let mut out = String::with_capacity(raw.len());
    let mut rest = raw;
    while let Some(amp) = rest.find('&') {
        out.push_str(&rest[..amp]);
        let after_amp = &rest[amp + 1..];
        if let Some(semi) = after_amp.find(';')
            && semi <= 12
        {
            let entity = &after_amp[..semi];
            let replacement = match entity {
                "amp" => Some('&'),
                "lt" => Some('<'),
                "gt" => Some('>'),
                "quot" => Some('"'),
                "#39" | "apos" => Some('\''),
                "nbsp" => Some(' '),
                _ if entity.starts_with("#x") || entity.starts_with("#X") => {
                    u32::from_str_radix(&entity[2..], 16)
                        .ok()
                        .and_then(char::from_u32)
                }
                _ if entity.starts_with('#') => {
                    entity[1..].parse::<u32>().ok().and_then(char::from_u32)
                }
                _ => None,
            };
            if let Some(ch) = replacement {
                out.push(ch);
                rest = &after_amp[semi + 1..];
                continue;
            }
        }
        out.push('&');
        rest = after_amp;
    }
    out.push_str(rest);
    out
}

fn parse_attributes(raw: &str) -> (Vec<(String, String)>, bool) {
    let bytes = raw.as_bytes();
    let len = bytes.len();
    let mut pos = 0usize;
    let mut attrs = Vec::new();
    let mut self_closing = false;

    while pos < len {
        while pos < len && bytes[pos].is_ascii_whitespace() {
            pos += 1;
        }
        if pos >= len {
            break;
        }
        if bytes[pos] == b'/' {
            self_closing = true;
            pos += 1;
            continue;
        }
        let name_start = pos;
        while pos < len
            && !bytes[pos].is_ascii_whitespace()
            && bytes[pos] != b'='
            && bytes[pos] != b'/'
        {
            pos += 1;
        }
        if pos == name_start {
            pos += 1;
            continue;
        }
        let name = raw[name_start..pos].to_ascii_lowercase();
        while pos < len && bytes[pos].is_ascii_whitespace() {
            pos += 1;
        }
        let value = if pos < len && bytes[pos] == b'=' {
            pos += 1;
            while pos < len && bytes[pos].is_ascii_whitespace() {
                pos += 1;
            }
            if pos < len && (bytes[pos] == b'"' || bytes[pos] == b'\'') {
                let quote = bytes[pos];
                pos += 1;
                let val_start = pos;
                while pos < len && bytes[pos] != quote {
                    pos += 1;
                }
                let val = decode_html_entities(&raw[val_start..pos]);
                if pos < len {
                    pos += 1;
                }
                val
            } else {
                let val_start = pos;
                while pos < len && !bytes[pos].is_ascii_whitespace() && bytes[pos] != b'>' {
                    pos += 1;
                }
                let slice = raw[val_start..pos].trim_end_matches('/');
                if raw[val_start..pos].ends_with('/') {
                    self_closing = true;
                }
                decode_html_entities(slice)
            }
        } else {
            String::new()
        };
        attrs.push((name, value));
    }

    (attrs, self_closing)
}

fn find_tag_end(html: &str, start: usize) -> Option<usize> {
    let bytes = html.as_bytes();
    let mut i = start;
    let mut quote: Option<u8> = None;
    while i < bytes.len() {
        let b = bytes[i];
        match quote {
            Some(q) if b == q => quote = None,
            Some(_) => {}
            None if b == b'"' || b == b'\'' => quote = Some(b),
            None if b == b'>' => return Some(i),
            None => {}
        }
        i += 1;
    }
    None
}

fn find_ci_substr(haystack: &str, start: usize, needle_lower: &str) -> Option<usize> {
    let slice = &haystack[start..];
    let n_len = needle_lower.len();
    if n_len == 0 {
        return Some(start);
    }
    let h_bytes = slice.as_bytes();
    let n_bytes = needle_lower.as_bytes();
    if h_bytes.len() < n_len {
        return None;
    }
    for idx in 0..=h_bytes.len() - n_len {
        if h_bytes[idx..idx + n_len].eq_ignore_ascii_case(n_bytes) {
            return Some(start + idx);
        }
    }
    None
}

fn parse_html(html: &str) -> ElementNode {
    let mut stack = vec![ElementNode {
        tag: "__root__".to_owned(),
        attrs: Vec::new(),
        children: Vec::new(),
    }];

    let mut pos = 0usize;
    let len = html.len();
    while pos < len {
        let Some(rel_lt) = html[pos..].find('<') else {
            if pos < len {
                stack
                    .last_mut()
                    .expect("root")
                    .children
                    .push(HtmlNode::Text(html[pos..].to_owned()));
            }
            break;
        };
        let lt = pos + rel_lt;
        if lt > pos {
            stack
                .last_mut()
                .expect("root")
                .children
                .push(HtmlNode::Text(html[pos..lt].to_owned()));
        }

        if html[lt..].starts_with("<!--") {
            if let Some(rel_end) = html[lt + 4..].find("-->") {
                pos = lt + 4 + rel_end + 3;
                continue;
            }
            break;
        }

        if html[lt..].starts_with("<!") || html[lt..].starts_with("<?") {
            if let Some(gt) = find_tag_end(html, lt + 2) {
                pos = gt + 1;
                continue;
            }
            break;
        }

        let Some(gt) = find_tag_end(html, lt + 1) else {
            break;
        };
        let inside = html[lt + 1..gt].trim();
        pos = gt + 1;

        if inside.is_empty() {
            continue;
        }

        if let Some(closing) = inside.strip_prefix('/') {
            let tag = closing
                .split_whitespace()
                .next()
                .unwrap_or("")
                .to_ascii_lowercase();
            if let Some(open_idx) = stack
                .iter()
                .rposition(|el| el.tag == tag && el.tag != "__root__")
            {
                while stack.len() > open_idx {
                    let finished = stack.pop().expect("non-empty");
                    stack
                        .last_mut()
                        .expect("parent")
                        .children
                        .push(HtmlNode::Element(finished));
                }
            }
            continue;
        }

        let mut split_at = inside.len();
        for (i, ch) in inside.char_indices() {
            if ch.is_ascii_whitespace() || ch == '/' {
                split_at = i;
                break;
            }
        }
        let tag = inside[..split_at].to_ascii_lowercase();
        if tag.is_empty() || !tag.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-') {
            continue;
        }

        if tag == "li"
            && let Some(open_li) = stack.iter().rposition(|el| el.tag == "li")
            && !stack[open_li + 1..]
                .iter()
                .any(|el| el.tag == "ul" || el.tag == "ol")
        {
            while stack.len() > open_li {
                let finished = stack.pop().expect("non-empty");
                stack
                    .last_mut()
                    .expect("parent")
                    .children
                    .push(HtmlNode::Element(finished));
            }
        }

        let attr_slice = &inside[split_at..];
        let (attrs, mut self_closing) = parse_attributes(attr_slice);
        if VOID_TAGS.contains(&tag.as_str()) {
            self_closing = true;
        }

        if tag == "script" || tag == "style" {
            let close_pat = format!("</{tag}");
            if let Some(close_pos) = find_ci_substr(html, pos, &close_pat)
                && let Some(close_gt) = find_tag_end(html, close_pos + close_pat.len())
            {
                pos = close_gt + 1;
            }
            continue;
        }

        let el = ElementNode {
            tag,
            attrs,
            children: Vec::new(),
        };
        if self_closing {
            stack
                .last_mut()
                .expect("parent")
                .children
                .push(HtmlNode::Element(el));
        } else {
            stack.push(el);
        }
    }

    while stack.len() > 1 {
        let finished = stack.pop().expect("non-empty");
        stack
            .last_mut()
            .expect("parent")
            .children
            .push(HtmlNode::Element(finished));
    }

    stack.pop().expect("root")
}

/// Mã hóa component URL theo RFC 3986 (giữ `[A-Za-z0-9-_.~]`, UTF-8 sang `%XX`).
pub fn percent_encode_component(raw: &str) -> String {
    let mut out = String::with_capacity(raw.len());
    for byte in raw.as_bytes() {
        if byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.' | b'~') {
            out.push(*byte as char);
        } else {
            let _ = write!(out, "%{byte:02X}");
        }
    }
    out
}

pub fn percent_decode_utf8(raw: &str) -> Result<String, CoreError> {
    let bytes = raw.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0usize;
    while i < bytes.len() {
        if bytes[i] == b'%' {
            if i + 2 >= bytes.len() {
                return Err("Chuỗi percent-encoding không hợp lệ.".into());
            }
            let hex = std::str::from_utf8(&bytes[i + 1..i + 3])
                .map_err(|_| "Chuỗi percent-encoding không hợp lệ.")?;
            let decoded =
                u8::from_str_radix(hex, 16).map_err(|_| "Chuỗi percent-encoding không hợp lệ.")?;
            out.push(decoded);
            i += 3;
        } else {
            out.push(bytes[i]);
            i += 1;
        }
    }
    String::from_utf8(out).map_err(|_| "Chuỗi UTF-8 giải mã từ URL không hợp lệ.".into())
}

pub fn is_cloudflare_challenge(html: &str) -> bool {
    let lower = html.to_ascii_lowercase();
    if lower.contains("cf-chl-") || lower.contains("challenge-platform") {
        return true;
    }
    if let Some(title_start) = lower.find("<title")
        && let Some(gt) = lower[title_start..].find('>')
    {
        let title_body = lower[title_start + gt + 1..].trim_start();
        if title_body.starts_with("just a moment") || title_body.starts_with("attention required") {
            return true;
        }
    }
    false
}

pub fn guard_read_html<'a>(status: u16, url: &str, html: &'a str) -> Result<&'a str, CoreError> {
    let lower_url = url.to_ascii_lowercase();
    let has_login_redirect = ["/dang-nhap", "/login"].iter().any(|needle| {
        lower_url.find(needle).is_some_and(|idx| {
            let after = lower_url.as_bytes().get(idx + needle.len()).copied();
            matches!(after, None | Some(b'?') | Some(b'#') | Some(b'/'))
        })
    });
    if status == 401 || has_login_redirect {
        return Err("Phiên đăng nhập đã hết hạn.".into());
    }
    if status == 403 || is_cloudflare_challenge(html) {
        return Err("Mở trình duyệt để xác thực.".into());
    }
    if !(200..300).contains(&status) {
        return Err(format!("HTTP {status}").into());
    }
    Ok(html)
}

fn user_slug_from_href(href: &str, allowed_host: &str) -> Option<String> {
    let resolved = resolve_wiki_url(href, allowed_host).ok()?;
    let parsed = crate::upload::protocol::parse_https_url(&resolved).ok()?;
    if parsed.port.is_some() || parsed.host != allowed_host.to_ascii_lowercase() {
        return None;
    }
    let trimmed = parsed.path.trim_end_matches('/');
    let encoded_slug = trimmed.strip_prefix("/user/")?;
    if encoded_slug.is_empty() || encoded_slug.contains('/') {
        return None;
    }
    let decoded = percent_decode_utf8(encoded_slug).ok()?;
    if decoded.is_empty()
        || decoded
            .chars()
            .any(|c| matches!(c, '/' | '\\' | '?' | '#') || c.is_control())
    {
        return None;
    }
    Some(decoded)
}

pub fn parse_current_account(html: &str, allowed_host: &str) -> String {
    let root = parse_html(html);

    let mut preferred_containers = Vec::new();
    root.find_all(
        &|el| el.has_id("ddUser") || el.tag == "nav" || el.has_class("side-nav"),
        &mut preferred_containers,
    );

    for container in preferred_containers {
        let mut links = Vec::new();
        container.find_all(&|el| el.tag == "a" && el.attr("href").is_some(), &mut links);
        for link in links {
            if link.text().contains("Hồ sơ của tôi")
                && let Some(href) = link.attr("href")
                && let Some(slug) = user_slug_from_href(href, allowed_host)
            {
                return slug;
            }
        }
    }

    let mut all_links = Vec::new();
    root.find_all(
        &|el| el.tag == "a" && el.attr("href").is_some(),
        &mut all_links,
    );
    for link in all_links {
        if link.text().contains("Hồ sơ của tôi")
            && let Some(href) = link.attr("href")
            && let Some(slug) = user_slug_from_href(href, allowed_host)
        {
            return slug;
        }
    }

    String::new()
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HistoryPage {
    pub rows: Vec<HistoryEntry>,
    pub last: usize,
}

pub fn parse_history_page(html: &str, start: usize) -> Result<HistoryPage, CoreError> {
    let root = parse_html(html);
    let Some(list) = root.find_first(&|el| el.has_class("report-history-list")) else {
        return Err("Chưa đọc được lịch sử truyện.".into());
    };

    let mut rows = Vec::new();
    for item in list.child_elements().filter(|el| el.tag == "li") {
        let body = item.find_first(&|el| el.has_class("report-message"));
        let actor = body.and_then(|msg| {
            msg.find_first(&|el| {
                el.tag == "a"
                    && el
                        .attr("href")
                        .is_some_and(|href| href.starts_with("/user/"))
            })
        });
        let account = actor
            .and_then(|a| a.attr("href"))
            .and_then(|href| {
                let raw = href
                    .strip_prefix("/user/")?
                    .split('?')
                    .next()?
                    .trim_end_matches('/');
                percent_decode_utf8(raw).ok()
            })
            .unwrap_or_default();
        let message = body
            .map(|msg| msg.text_excluding(actor))
            .unwrap_or_default();
        rows.push(parse_history_message(&account, &message));
    }

    let mut pager_nodes = Vec::new();
    root.find_all(
        &|el| el.attr("data-action") == Some("loadBookHistory") && el.attr("data-start").is_some(),
        &mut pager_nodes,
    );
    let max_start = pager_nodes
        .into_iter()
        .filter_map(|el| el.attr("data-start")?.trim().parse::<usize>().ok())
        .max()
        .unwrap_or(start);

    Ok(HistoryPage {
        rows,
        last: start.max(max_start),
    })
}

pub fn parse_chapter_count_text(raw: &str) -> Option<usize> {
    let trimmed = raw.trim();
    if trimmed.starts_with('-') || !trimmed.chars().any(|c| c.is_ascii_digit()) {
        return None;
    }
    let digits: String = trimmed.chars().filter(char::is_ascii_digit).collect();
    let count: i32 = digits.parse().ok()?;
    usize::try_from(count).ok()
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorksBookMatch {
    pub url: Option<String>,
    pub count: Option<BookCountObservation>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorksPageResult {
    pub matched: Option<WorksBookMatch>,
    pub next_cursor: usize,
}

fn find_pagination_starts(root: &ElementNode) -> Vec<usize> {
    let mut pagers = Vec::new();
    root.find_all(
        &|el| el.tag == "ul" && el.has_class("pagination"),
        &mut pagers,
    );
    let mut starts = Vec::new();
    for pager in pagers {
        let mut anchors = Vec::new();
        pager.find_all(
            &|el| el.tag == "a" && el.attr("data-start").is_some(),
            &mut anchors,
        );
        for a in anchors {
            if let Some(n) = a
                .attr("data-start")
                .and_then(|s| s.trim().parse::<usize>().ok())
            {
                starts.push(n);
            }
        }
    }
    starts
}

fn works_book_nodes(list: &ElementNode) -> Vec<&ElementNode> {
    let mut infos: Vec<_> = list
        .child_elements()
        .filter(|child| child.has_class("book-info"))
        .collect();
    if infos.is_empty() {
        list.find_all(&|el| el.has_class("book-info"), &mut infos);
    }
    infos
}

pub(crate) fn parse_works_catalog_page(
    html: &str,
    host: &str,
) -> Result<(Option<usize>, Vec<crate::wiki_works::WorkRow>), CoreError> {
    let root = parse_html(html);
    let total = root
        .find_first(&|el| el.has_class("book-count"))
        .and_then(|node| parse_chapter_count_text(&node.text()));
    let list = root
        .find_first(&|el| el.has_class("book-list"))
        .ok_or("Trang không có danh sách Works.")?;
    let rows = works_book_nodes(list)
        .into_iter()
        .map(|info| {
            let id = info
                .find_first(&|el| el.tag == "input" && el.attr("name") == Some("bookId"))
                .and_then(|node| node.attr("value"))
                .filter(|id| !id.trim().is_empty())
                .ok_or("Một mục Works thiếu ID truyện.")?;
            let title = info
                .find_first(&|el| el.has_class("book-title"))
                .ok_or("Một mục Works thiếu tên truyện.")?;
            let url = resolve_wiki_url(title.attr("href").unwrap_or_default(), host)?;
            canonical_wiki_book_path(&url, host)?;
            let chapter_count = info
                .find_first(&|el| el.has_class("book-chapter-count"))
                .and_then(|el| parse_chapter_count_text(&el.text()));
            Ok(crate::wiki_works::WorkRow {
                id: id.to_owned(),
                title: title.text(),
                url: Some(url),
                chapter_count,
                local_only: false,
            })
        })
        .collect::<Result<_, CoreError>>()?;
    Ok((total, rows))
}

pub fn parse_works_page(
    html: &str,
    book_id: &str,
    current_cursor: usize,
    allowed_host: &str,
) -> Result<WorksPageResult, CoreError> {
    let root = parse_html(html);
    let Some(list) = root.find_first(&|el| el.has_class("book-list")) else {
        return Err("Chưa đọc được Works.".into());
    };

    let next_cursor = find_pagination_starts(&root)
        .into_iter()
        .filter(|&n| n > current_cursor)
        .min()
        .unwrap_or(0);

    let infos = works_book_nodes(list);

    let matched = infos.into_iter().find_map(|info| {
        info.find_first(&|el| {
            el.tag == "input"
                && el.attr("name") == Some("bookId")
                && el.attr("value") == Some(book_id)
        })?;
        let title_node = info.find_first(&|el| el.has_class("book-title"))?;
        let title_text = title_node.text();
        let url = title_node.attr("href").and_then(|href| {
            let resolved = resolve_wiki_url(href, allowed_host).ok()?;
            canonical_wiki_book_path(&resolved, allowed_host).ok()?;
            Some(resolved)
        });
        let count = info
            .find_first(&|el| el.has_class("book-chapter-count"))
            .and_then(|el| parse_chapter_count_text(&el.text()))
            .map(|n| BookCountObservation {
                book_id: book_id.to_owned(),
                title: title_text,
                count: n,
                source: "works".to_owned(),
            });
        Some(WorksBookMatch { url, count })
    });

    Ok(WorksPageResult {
        matched,
        next_cursor,
    })
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CountDetail {
    pub id: String,
    pub title: String,
    pub count: Option<usize>,
    pub key: String,
    pub rotate: usize,
}

fn is_ident_char(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || byte == b'_'
}

fn parse_js_string_var(html: &str, key: &str) -> String {
    let bytes = html.as_bytes();
    let mut search_from = 0usize;
    while let Some(rel) = html[search_from..].find(key) {
        let start = search_from + rel;
        let end = start + key.len();
        search_from = end;

        if start > 0 && is_ident_char(bytes[start - 1]) {
            continue;
        }
        if end < bytes.len() && is_ident_char(bytes[end]) {
            continue;
        }
        let mut cursor = end;
        while cursor < bytes.len() && bytes[cursor].is_ascii_whitespace() {
            cursor += 1;
        }
        if cursor >= bytes.len() || bytes[cursor] != b'=' {
            continue;
        }
        cursor += 1;
        while cursor < bytes.len() && bytes[cursor].is_ascii_whitespace() {
            cursor += 1;
        }
        if cursor >= bytes.len() || (bytes[cursor] != b'"' && bytes[cursor] != b'\'') {
            continue;
        }
        let quote = bytes[cursor];
        cursor += 1;
        let val_start = cursor;
        while cursor < bytes.len() && bytes[cursor] != quote && bytes[cursor] != b'\n' {
            cursor += 1;
        }
        if cursor < bytes.len() && bytes[cursor] == quote && cursor > val_start {
            return html[val_start..cursor].to_owned();
        }
    }
    String::new()
}

fn parse_fuzzy_sign_rotate(html: &str) -> Result<usize, CoreError> {
    let Some(fn_pos) = html.find("function") else {
        return Ok(0);
    };
    let mut scan = fn_pos;
    while let Some(pos) = html[scan..].find("function") {
        let abs = scan + pos;
        let after_fn = html[abs + "function".len()..].trim_start();
        if let Some(after_name) = after_fn.strip_prefix("fuzzySign") {
            let trimmed = after_name.trim_start();
            if trimmed.starts_with('(')
                && let Some(open_brace) = trimmed.find('{')
                && let Some(close_brace) = trimmed[open_brace + 1..].find('}')
            {
                let body = &trimmed[open_brace + 1..open_brace + 1 + close_brace];
                let compact: String = body.chars().filter(|c| !c.is_whitespace()).collect();
                if let Some(first_sub) = compact.find("text.substring(")
                    && let Some(first_end) = compact[first_sub + 15..].find(')')
                {
                    let n_str = &compact[first_sub + 15..first_sub + 15 + first_end];
                    if let Ok(n) = n_str.parse::<usize>() {
                        let after_first = &compact[first_sub + 15 + first_end + 1..];
                        if let Some(after_plus) = after_first.strip_prefix("+text.substring(")
                            && let Some(second_end) = after_plus.find(')')
                        {
                            let arg = &after_plus[..second_end];
                            let valid =
                                arg == "0" || arg == format!("0,{n}") || arg == format!("0{n}");
                            if valid {
                                return Ok(n);
                            }
                        }
                    }
                }
                return Err("Cách ký mục lục đã đổi.".into());
            }
        }
        scan = abs + "function".len();
    }
    Ok(0)
}

pub fn parse_detail_page(html: &str) -> Result<CountDetail, CoreError> {
    let root = parse_html(html);
    let info = root
        .find_first(&|el| el.has_class("cover-info"))
        .unwrap_or(&root);

    let id = root
        .find_first(&|el| el.tag == "input" && el.attr("name") == Some("bookId"))
        .and_then(|el| el.attr("value"))
        .filter(|s| !s.is_empty())
        .map(str::to_owned)
        .unwrap_or_else(|| parse_js_string_var(html, "bookId"));

    let title = info
        .find_first(&|el| el.tag == "h2")
        .map(ElementNode::text)
        .or_else(|| root.find_first(&|el| el.tag == "h1").map(ElementNode::text))
        .unwrap_or_default();

    let count = info
        .find_first(&|el| el.has_class("book-chapter-count"))
        .and_then(|el| parse_chapter_count_text(&el.text()));

    let key = parse_js_string_var(html, "signKey");
    let rotate = parse_fuzzy_sign_rotate(html)?;

    Ok(CountDetail {
        id,
        title,
        count,
        key,
        rotate,
    })
}

pub fn parse_index_page(html: &str, start: usize) -> (usize, usize) {
    let root = parse_html(html);

    let count_anchors = |container_pred: &dyn Fn(&ElementNode) -> bool| -> usize {
        let mut containers = Vec::new();
        root.find_all(container_pred, &mut containers);
        let mut total = 0usize;
        for c in containers {
            let mut links = Vec::new();
            c.find_all(&|el| el.tag == "a", &mut links);
            total += links.len();
        }
        total
    };

    let mut count = count_anchors(&|el| el.tag == "li" && el.has_class("chapter-name"));
    if count == 0 {
        let mut lists = Vec::new();
        root.find_all(&|el| el.tag == "ul" && el.has_id("chapters"), &mut lists);
        for ul in lists {
            let mut items = Vec::new();
            ul.find_all(&|el| el.tag == "li", &mut items);
            for li in items {
                let mut links = Vec::new();
                li.find_all(&|el| el.tag == "a", &mut links);
                count += links.len();
            }
        }
    }
    if count == 0 {
        count = count_anchors(&|el| el.has_class("chapter-name"));
    }

    let last = find_pagination_starts(&root)
        .into_iter()
        .max()
        .unwrap_or(start);

    (count, start.max(last))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::upload::protocol::{BOOK_INDEX_PAGE_SIZE, DEFAULT_WIKI_HOST, sign_book_index};
    use crate::upload::reconcile::HistoryEntryType;

    #[test]
    fn works_accepts_zero_and_grouped_numbers_and_rejects_invalid() {
        let id = "a".repeat(24);
        let make_works = |count: &str| {
            format!(
                "<div class='book-list'><div class='book-info'><input name='bookId' value='{id}'><a class='book-title'>Tên truyện</a><span class='book-chapter-count'>{count}</span></div></div>"
            )
        };

        assert_eq!(
            parse_works_page(&make_works("0"), &id, 0, DEFAULT_WIKI_HOST)
                .expect("ok")
                .matched
                .and_then(|m| m.count)
                .map(|c| c.count),
            Some(0)
        );
        assert_eq!(
            parse_works_page(&make_works("12.345 chương"), &id, 0, DEFAULT_WIKI_HOST)
                .expect("ok")
                .matched
                .and_then(|m| m.count)
                .map(|c| c.count),
            Some(12345)
        );

        for invalid in ["…", "-1", "999999999999999"] {
            assert!(
                parse_works_page(&make_works(invalid), &id, 0, DEFAULT_WIKI_HOST)
                    .expect("ok")
                    .matched
                    .and_then(|m| m.count)
                    .is_none()
            );
        }
        assert!(
            parse_works_page(&make_works("10"), &"b".repeat(24), 0, DEFAULT_WIKI_HOST)
                .expect("ok")
                .matched
                .is_none()
        );
    }

    #[test]
    fn detail_ignores_small_page_size_and_parses_fuzzy_signing() {
        let id = "a".repeat(24);
        let html = format!(
            "<script>var bookId='{id}';var signKey='abc';function fuzzySign(text){{return text.substring(1)+text.substring(0,1)}};loadBookIndex(0,99)</script><div class='cover-info'><h2>Tên</h2></div>"
        );
        let d = parse_detail_page(&html).expect("detail");
        assert_eq!(d.id, id);
        assert_eq!(d.title, "Tên");
        assert_eq!(d.count, None);
        assert_eq!(d.rotate, 1);
        assert_eq!(BOOK_INDEX_PAGE_SIZE, 501);
        assert_eq!(
            sign_book_index(&d.key, 0, BOOK_INDEX_PAGE_SIZE, d.rotate),
            sign_book_index("abc", 0, 501, 1)
        );

        let changed_sign =
            "<script>function fuzzySign(text){return text.split('').reverse().join('')}</script>";
        assert!(parse_detail_page(changed_sign).is_err());
    }

    #[test]
    fn index_counts_only_chapter_links_and_finds_last_offset() {
        let html = "<a>Other</a><li class='chapter-name'><a>Chương 1</a></li><li class='chapter-name'><a>Chương 2</a></li><ul class='pagination'><a data-start='9519'>Cuối</a></ul>";
        assert_eq!(parse_index_page(html, 0), (2, 9519));
        assert_eq!(parse_index_page("<ul id='chapters'></ul>", 501), (0, 501));

        let mut list_255 = String::from("<div class=\"row\"><ul>");
        for i in 1..=255 {
            let _ = write!(
                list_255,
                "<li class=\"chapter-name\"><a href=\"/truyen/local-test/chuong-{i}\">Chương {i}</a></li>"
            );
        }
        list_255.push_str("</ul></div>");
        assert_eq!(parse_index_page(&list_255, 0), (255, 0));
    }

    #[test]
    fn account_history_and_guards_handle_unicode_and_challenges() {
        let encoded = percent_encode_component("người-đọc233");
        let html = format!("<nav><a href=\"/user/{encoded}\">Hồ sơ của tôi</a></nav>");
        assert_eq!(
            parse_current_account(&html, DEFAULT_WIKI_HOST),
            "người-đọc233"
        );
        assert_eq!(
            parse_current_account(
                "<a href=\"https://evil.org/user/other\">Hồ sơ của tôi</a>",
                DEFAULT_WIKI_HOST
            ),
            ""
        );

        let hist_html = "<ul class='report-history-list'><li><div class='report-time'>16-10-2026</div><div class='report-message'><a href='/user/reader'>Tên</a> đã thêm file bổ sung (10-20) vào quyển Một</div></li></ul><a data-action='loadBookHistory' data-start='10'></a>";
        let page = parse_history_page(hist_html, 0).expect("history");
        assert_eq!(page.last, 10);
        assert_eq!(page.rows.len(), 1);
        assert_eq!(page.rows[0].account, "reader");
        assert_eq!(page.rows[0].kind, HistoryEntryType::Append);
        assert_eq!(page.rows[0].note, "10-20");
        assert_eq!(page.rows[0].volume, "Một");

        assert!(
            guard_read_html(
                200,
                "https://wikicv.org/",
                "<title>Just a moment...</title>"
            )
            .is_err()
        );
        assert!(guard_read_html(401, "https://wikicv.org/works", "ok").is_err());
        assert!(guard_read_html(200, "https://wikicv.org/login?next=/", "ok").is_err());
        assert!(guard_read_html(200, "https://wikicv.org/works", "ok").is_ok());
    }
}
