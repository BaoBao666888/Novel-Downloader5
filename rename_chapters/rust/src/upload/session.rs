use std::io::{BufRead, BufReader, BufWriter, Read, Write};
use std::net::TcpStream;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use crate::CoreError;
use crate::upload::engine::{FormRequest, TransportReply};
use crate::upload::html::{guard_read_html, percent_encode_component};
use crate::upload::multipart::{MultipartPart, write_multipart};
use crate::upload::protocol::{ParsedHttpsUrl, parse_https_url, resolve_wiki_url};
use crate::upload::runner::UploadHttpTransport;
use crate::upload::verifier::{ReadCancellation, VerifierError};

pub const DEFAULT_USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) NovelStudio/0.1";
pub const MAX_RESPONSE_BYTES: usize = 8 * 1024 * 1024;
pub const MAX_FORM_BODY_BYTES: usize = 2 * 1024 * 1024;
const MAX_REDIRECTS: usize = 5;

#[derive(Debug, Clone, PartialEq, Eq)]
struct CookieEntry {
    name: String,
    value: String,
}

/// Kho cookie tối giản trong bộ nhớ cho một phiên làm việc, tách biệt hoàn toàn giữa các host.
#[derive(Debug, Clone, Default)]
pub struct SessionCookieJar {
    allowed_host: String,
    cookies: Arc<Mutex<Vec<CookieEntry>>>,
}

impl SessionCookieJar {
    pub fn new(allowed_host: impl Into<String>) -> Self {
        Self {
            allowed_host: allowed_host.into().to_ascii_lowercase(),
            cookies: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn from_cookie_header(raw_cookie_header: &str, allowed_host: impl Into<String>) -> Self {
        let jar = Self::new(allowed_host);
        let mut entries = jar.cookies.lock().expect("cookie jar lock");
        for part in raw_cookie_header.split(';') {
            let trimmed = part.trim();
            let Some((raw_name, raw_val)) = trimmed.split_once('=') else {
                continue;
            };
            let name = raw_name.trim();
            let value = raw_val.trim();
            if is_valid_cookie_token(name) && is_valid_cookie_value(value) {
                upsert_cookie(&mut entries, name, value);
            }
        }
        drop(entries);
        jar
    }

    pub fn is_empty(&self) -> bool {
        self.cookies.lock().expect("cookie jar lock").is_empty()
    }

    /// Cập nhật cookie từ header `Set-Cookie` chỉ khi `url_host` khớp host được phép.
    pub fn apply_set_cookie(&self, url_host: &str, set_cookie: &str) {
        if !url_host.eq_ignore_ascii_case(&self.allowed_host) {
            return;
        }
        let mut segments = set_cookie.split(';');
        let Some(first) = segments.next() else {
            return;
        };
        let Some((raw_name, raw_val)) = first.trim().split_once('=') else {
            return;
        };
        let name = raw_name.trim();
        let value = raw_val.trim();
        if !is_valid_cookie_token(name) {
            return;
        }

        let mut max_age_zero = false;
        for attr in segments {
            let trimmed = attr.trim();
            if let Some((k, v)) = trimmed.split_once('=') {
                let k_low = k.trim().to_ascii_lowercase();
                let v_trim = v.trim();
                if k_low == "domain" {
                    let dom = v_trim.trim_start_matches('.').to_ascii_lowercase();
                    if dom.is_empty()
                        || (!self.allowed_host.eq_ignore_ascii_case(&dom)
                            && !self.allowed_host.ends_with(&format!(".{dom}")))
                    {
                        return;
                    }
                } else if k_low == "max-age" && v_trim == "0" {
                    max_age_zero = true;
                }
            }
        }

        let mut entries = self.cookies.lock().expect("cookie jar lock");
        if max_age_zero || value.is_empty() {
            entries.retain(|c| c.name != name);
        } else if is_valid_cookie_value(value) {
            upsert_cookie(&mut entries, name, value);
        }
    }

    /// Chỉ xuất `Cookie` header khi URL thuộc đúng host được phép.
    pub fn cookie_header_for(&self, url: &str) -> Option<String> {
        let parsed = parse_https_url(url).ok()?;
        if parsed.port.is_some() || parsed.host != self.allowed_host {
            return None;
        }
        let entries = self.cookies.lock().expect("cookie jar lock");
        if entries.is_empty() {
            return None;
        }
        let joined: Vec<String> = entries
            .iter()
            .map(|c| format!("{}={}", c.name, c.value))
            .collect();
        Some(joined.join("; "))
    }
}

fn is_valid_cookie_token(name: &str) -> bool {
    !name.is_empty()
        && !name
            .chars()
            .any(|c| c.is_control() || c.is_whitespace() || c == ';')
}

fn is_valid_cookie_value(val: &str) -> bool {
    !val.chars()
        .any(|c| c.is_control() || c == '\r' || c == '\n')
}

fn upsert_cookie(entries: &mut Vec<CookieEntry>, name: &str, value: &str) {
    if let Some(existing) = entries.iter_mut().find(|c| c.name == name) {
        existing.value = value.to_owned();
    } else {
        entries.push(CookieEntry {
            name: name.to_owned(),
            value: value.to_owned(),
        });
    }
}

/// Quy tắc bảo mật header, timeout và redirect dùng chung giữa WinHTTP (Desktop) & HttpURLConnection (Android).
pub struct SessionExchange;

impl SessionExchange {
    pub fn is_safe_header(name: &str, value: &str) -> bool {
        if name.contains(['\r', '\n', '\0']) || value.contains(['\r', '\n', '\0']) {
            return false;
        }
        matches!(
            name.trim().to_ascii_lowercase().as_str(),
            "accept"
                | "accept-language"
                | "content-type"
                | "x-requested-with"
                | "referer"
                | "user-agent"
        )
    }

    pub fn read_timeout_ms(url: &str, method: &str, allowed_host: &str) -> u64 {
        if method.eq_ignore_ascii_case("POST")
            && let Ok(parsed) = parse_https_url(url)
            && parsed.port.is_none()
            && parsed.host == allowed_host.to_ascii_lowercase()
            && parsed.path == "/upload-content"
        {
            return 180_000;
        }
        60_000
    }

    pub fn validate_request_url(
        url: &str,
        method: &str,
        allowed_host: &str,
    ) -> Result<ParsedHttpsUrl, CoreError> {
        let upper = method.to_ascii_uppercase();
        if !matches!(upper.as_str(), "GET" | "HEAD" | "POST") {
            return Err("HTTP method không được hỗ trợ.".into());
        }
        let parsed = parse_https_url(url)?;
        if parsed.port.is_some() || !parsed.host.eq_ignore_ascii_case(allowed_host) {
            return Err(format!("Domain chưa được hỗ trợ: {}", parsed.host).into());
        }
        Ok(parsed)
    }

    pub fn build_request_headers(
        url: &str,
        original_url: &str,
        method: &str,
        supplied: &[(String, String)],
        jar: &SessionCookieJar,
        allowed_host: &str,
        user_agent: &str,
    ) -> Result<Vec<(String, String)>, CoreError> {
        let dest = Self::validate_request_url(url, method, allowed_host)?;
        let mut headers = Vec::new();
        let ua = if user_agent.trim().is_empty() || user_agent.contains(['\r', '\n']) {
            DEFAULT_USER_AGENT
        } else {
            user_agent
        };
        headers.push(("User-Agent".to_owned(), ua.to_owned()));
        headers.push(("Accept".to_owned(), "*/*".to_owned()));

        if let Ok(orig) = parse_https_url(original_url)
            && orig.host == dest.host
            && orig.port == dest.port
        {
            for (name, value) in supplied {
                if !Self::is_safe_header(name, value) {
                    return Err("HTTP header không được hỗ trợ.".into());
                }
                if name.eq_ignore_ascii_case("user-agent") {
                    if !value.trim().is_empty() {
                        headers[0].1 = value.clone();
                    }
                } else if !name.eq_ignore_ascii_case("cookie") {
                    headers.push((name.clone(), value.clone()));
                }
            }
        }

        if !matches!(method.to_ascii_uppercase().as_str(), "GET" | "HEAD") {
            headers.push(("Origin".to_owned(), format!("https://{}", dest.host)));
        }
        if let Some(cookie) = jar.cookie_header_for(url) {
            headers.push(("Cookie".to_owned(), cookie));
        }

        Ok(headers)
    }

    pub fn validate_redirect(
        current_url: &str,
        location: &str,
        method: &str,
        allowed_host: &str,
    ) -> Result<String, CoreError> {
        let upper = method.to_ascii_uppercase();
        if !matches!(upper.as_str(), "GET" | "HEAD") {
            return Err(
                "Server redirect thao tác ghi. Cần đăng nhập và kiểm tra lại trước khi gửi lại."
                    .into(),
            );
        }
        let trimmed = location.trim();
        if trimmed.is_empty() {
            return Err("Redirect thiếu Location.".into());
        }
        let next = if trimmed.starts_with('/') || trimmed.starts_with("http") {
            resolve_wiki_url(trimmed, allowed_host)?
        } else {
            let current = parse_https_url(current_url)?;
            let dir = current
                .path
                .rsplit_once('/')
                .map_or("/", |(parent, _)| parent);
            let rel = if dir.is_empty() || dir == "/" {
                format!("/{trimmed}")
            } else {
                format!("{dir}/{trimmed}")
            };
            resolve_wiki_url(&rel, allowed_host)?
        };
        Self::validate_request_url(&next, &upper, allowed_host)?;
        Ok(next)
    }
}

/// Transport HTTP thật qua TCP loopback (`http://127.0.0.1:<port>`) phục vụ kiểm thử nội bộ & mock Tauri/Android.
pub struct LoopbackHttpTransport {
    port: u16,
    allowed_host: String,
    jar: SessionCookieJar,
    user_agent: String,
}

impl LoopbackHttpTransport {
    pub fn new(
        base_url: &str,
        allowed_host: impl Into<String>,
        jar: SessionCookieJar,
    ) -> Result<Self, CoreError> {
        let trimmed = base_url.trim().trim_end_matches('/');
        let Some(rest) = trimmed.strip_prefix("http://127.0.0.1:") else {
            return Err("Loopback transport chỉ chấp nhận http://127.0.0.1:<port>.".into());
        };
        let port_str = rest.split('/').next().unwrap_or("");
        let port: u16 = port_str
            .parse()
            .map_err(|_| "Port loopback không hợp lệ.")?;
        Ok(Self {
            port,
            allowed_host: allowed_host.into().to_ascii_lowercase(),
            jar,
            user_agent: DEFAULT_USER_AGENT.to_owned(),
        })
    }

    pub fn jar(&self) -> &SessionCookieJar {
        &self.jar
    }

    fn execute(
        &self,
        url: &str,
        method: &str,
        supplied: &[(String, String)],
        cancel: Option<&ReadCancellation>,
        write_body: &mut dyn FnMut(&mut BufWriter<&mut TcpStream>) -> Result<(), CoreError>,
    ) -> Result<(u16, String, Vec<u8>), CoreError> {
        let mut current = url.to_owned();
        for redirect in 0..=MAX_REDIRECTS {
            if let Some(token) = cancel {
                token.check()?;
            }
            let parsed =
                SessionExchange::validate_request_url(&current, method, &self.allowed_host)?;
            let path_and_query = format!("{}{}", parsed.path, parsed.suffix);
            let headers = SessionExchange::build_request_headers(
                &current,
                url,
                method,
                supplied,
                &self.jar,
                &self.allowed_host,
                &self.user_agent,
            )?;

            let timeout = Duration::from_millis(SessionExchange::read_timeout_ms(
                &current,
                method,
                &self.allowed_host,
            ));
            let mut stream = TcpStream::connect(("127.0.0.1", self.port))?;
            stream.set_read_timeout(Some(timeout))?;
            stream.set_write_timeout(Some(timeout))?;

            {
                let mut writer = BufWriter::new(&mut stream);
                write!(
                    writer,
                    "{} {path_and_query} HTTP/1.1\r\n",
                    method.to_ascii_uppercase()
                )?;
                write!(writer, "Host: {}\r\n", parsed.host)?;
                write!(writer, "Connection: close\r\n")?;
                for (k, v) in &headers {
                    write!(writer, "{k}: {v}\r\n")?;
                }
                write!(writer, "\r\n")?;
                write_body(&mut writer)?;
                writer.flush()?;
            }

            if let Some(token) = cancel {
                token.check()?;
            }

            let resp = read_http_response(stream, cancel)?;
            for cookie in resp.set_cookies {
                self.jar.apply_set_cookie(&parsed.host, &cookie);
            }

            if matches!(resp.status, 301 | 302 | 303 | 307 | 308) {
                if redirect >= MAX_REDIRECTS {
                    return Err("Quá nhiều redirect.".into());
                }
                let loc = resp.location.ok_or("Redirect thiếu Location.")?;
                current =
                    SessionExchange::validate_redirect(&current, &loc, method, &self.allowed_host)?;
                continue;
            }

            return Ok((resp.status, current, resp.body));
        }
        Err("Quá nhiều redirect.".into())
    }
}

struct RawHttpResponse {
    status: u16,
    location: Option<String>,
    set_cookies: Vec<String>,
    body: Vec<u8>,
}

fn read_http_response(
    stream: TcpStream,
    cancel: Option<&ReadCancellation>,
) -> Result<RawHttpResponse, CoreError> {
    let mut reader = BufReader::new(stream);
    let mut status_line = String::new();
    if reader.read_line(&mut status_line)? == 0 {
        return Err("Server đóng kết nối khi chưa gửi HTTP status.".into());
    }
    let status: u16 = status_line
        .split_whitespace()
        .nth(1)
        .and_then(|s| s.parse().ok())
        .ok_or("Phản hồi HTTP không hợp lệ.")?;

    let mut content_length: Option<usize> = None;
    let mut chunked = false;
    let mut location: Option<String> = None;
    let mut set_cookies = Vec::new();

    loop {
        if let Some(token) = cancel {
            token.check()?;
        }
        let mut line = String::new();
        if reader.read_line(&mut line)? == 0 {
            break;
        }
        let trimmed = line.trim_end_matches(['\r', '\n']);
        if trimmed.is_empty() {
            break;
        }
        if let Some((k, v)) = trimmed.split_once(':') {
            let key = k.trim();
            let val = v.trim();
            if key.eq_ignore_ascii_case("content-length") {
                content_length = val.parse().ok();
            } else if key.eq_ignore_ascii_case("transfer-encoding")
                && val.to_ascii_lowercase().contains("chunked")
            {
                chunked = true;
            } else if key.eq_ignore_ascii_case("location") {
                location = Some(val.to_owned());
            } else if key.eq_ignore_ascii_case("set-cookie") {
                set_cookies.push(val.to_owned());
            }
        }
    }

    let mut body = Vec::new();
    if chunked {
        loop {
            let mut size_line = String::new();
            if reader.read_line(&mut size_line)? == 0 {
                return Err("Chunked response bị ngắt giữa chừng.".into());
            }
            let hex = size_line.trim().split(';').next().unwrap_or("").trim();
            let chunk_size = usize::from_str_radix(hex, 16)
                .map_err(|_| "Kích thước chunk HTTP không hợp lệ.")?;
            if chunk_size == 0 {
                break;
            }
            if body.len().saturating_add(chunk_size) > MAX_RESPONSE_BYTES {
                return Err("Response quá lớn.".into());
            }
            let start = body.len();
            body.resize(start + chunk_size, 0);
            reader.read_exact(&mut body[start..])?;
            let mut crlf = [0u8; 2];
            let _ = reader.read_exact(&mut crlf);
        }
    } else if let Some(len) = content_length {
        if len > MAX_RESPONSE_BYTES {
            return Err("Response quá lớn.".into());
        }
        body.resize(len, 0);
        if len > 0 {
            reader.read_exact(&mut body)?;
        }
    } else {
        let mut buf = [0u8; 32 * 1024];
        loop {
            if let Some(token) = cancel {
                token.check()?;
            }
            let n = reader.read(&mut buf)?;
            if n == 0 {
                break;
            }
            if body.len().saturating_add(n) > MAX_RESPONSE_BYTES {
                return Err("Response quá lớn.".into());
            }
            body.extend_from_slice(&buf[..n]);
        }
    }

    Ok(RawHttpResponse {
        status,
        location,
        set_cookies,
        body,
    })
}

impl UploadHttpTransport for LoopbackHttpTransport {
    fn get_html(&mut self, url: &str, cancel: &ReadCancellation) -> Result<String, VerifierError> {
        let supplied = vec![
            (
                "Referer".to_owned(),
                format!("https://{}/", self.allowed_host),
            ),
            ("X-Requested-With".to_owned(), "XMLHttpRequest".to_owned()),
        ];
        let (status, final_url, body) = self
            .execute(url, "GET", &supplied, Some(cancel), &mut |_| Ok(()))
            .map_err(|err| VerifierError::Failed(err.to_string()))?;
        cancel.check()?;
        let html = String::from_utf8_lossy(&body).into_owned();
        guard_read_html(status, &final_url, &html)
            .map_err(|err| VerifierError::Failed(err.to_string()))?;
        Ok(html)
    }

    fn post_form(&mut self, req: &FormRequest) -> Result<TransportReply, CoreError> {
        let encoded = req
            .fields
            .iter()
            .map(|(k, v)| {
                format!(
                    "{}={}",
                    percent_encode_component(k),
                    percent_encode_component(v)
                )
            })
            .collect::<Vec<_>>()
            .join("&");
        let bytes = encoded.into_bytes();
        if bytes.len() > MAX_FORM_BODY_BYTES {
            return Err("Request quá lớn.".into());
        }
        let safe_supplied = [(
            "Content-Type".to_owned(),
            "application/x-www-form-urlencoded; charset=UTF-8".to_owned(),
        )];
        let (status, _, body) = self.execute_with_extra(
            &req.url,
            "POST",
            &safe_supplied,
            &[("Content-Length".to_owned(), bytes.len().to_string())],
            None,
            &mut |writer| {
                writer.write_all(&bytes)?;
                Ok(())
            },
        )?;
        Ok(TransportReply {
            status,
            body: String::from_utf8_lossy(&body).into_owned(),
        })
    }

    fn post_multipart(
        &mut self,
        url: &str,
        boundary: &str,
        parts: &[MultipartPart],
        total_bytes: u64,
        on_progress: &mut dyn FnMut(u64, u64),
    ) -> Result<TransportReply, CoreError> {
        let safe_supplied = vec![(
            "Content-Type".to_owned(),
            format!("multipart/form-data; boundary={boundary}"),
        )];
        let (status, _, body) = self.execute_with_extra(
            url,
            "POST",
            &safe_supplied,
            &[("Content-Length".to_owned(), total_bytes.to_string())],
            None,
            &mut |writer| {
                let written = write_multipart(writer, boundary, parts, &mut |sent| {
                    on_progress(sent, total_bytes);
                })?;
                if written != total_bytes {
                    return Err("Kích thước multipart không khớp Content-Length.".into());
                }
                Ok(())
            },
        )?;
        Ok(TransportReply {
            status,
            body: String::from_utf8_lossy(&body).into_owned(),
        })
    }
}

impl LoopbackHttpTransport {
    fn execute_with_extra(
        &self,
        url: &str,
        method: &str,
        supplied: &[(String, String)],
        extra_wire_headers: &[(String, String)],
        cancel: Option<&ReadCancellation>,
        write_body: &mut dyn FnMut(&mut BufWriter<&mut TcpStream>) -> Result<(), CoreError>,
    ) -> Result<(u16, String, Vec<u8>), CoreError> {
        let parsed = SessionExchange::validate_request_url(url, method, &self.allowed_host)?;
        let path_and_query = format!("{}{}", parsed.path, parsed.suffix);
        let headers = SessionExchange::build_request_headers(
            url,
            url,
            method,
            supplied,
            &self.jar,
            &self.allowed_host,
            &self.user_agent,
        )?;
        let timeout = Duration::from_millis(SessionExchange::read_timeout_ms(
            url,
            method,
            &self.allowed_host,
        ));
        let mut stream = TcpStream::connect(("127.0.0.1", self.port))?;
        stream.set_read_timeout(Some(timeout))?;
        stream.set_write_timeout(Some(timeout))?;

        {
            let mut writer = BufWriter::new(&mut stream);
            write!(
                writer,
                "{} {path_and_query} HTTP/1.1\r\n",
                method.to_ascii_uppercase()
            )?;
            write!(writer, "Host: {}\r\n", parsed.host)?;
            write!(writer, "Connection: close\r\n")?;
            for (k, v) in &headers {
                write!(writer, "{k}: {v}\r\n")?;
            }
            for (k, v) in extra_wire_headers {
                write!(writer, "{k}: {v}\r\n")?;
            }
            write!(writer, "\r\n")?;
            write_body(&mut writer)?;
            writer.flush()?;
        }

        let resp = read_http_response(stream, cancel)?;
        for cookie in resp.set_cookies {
            self.jar.apply_set_cookie(&parsed.host, &cookie);
        }
        if matches!(resp.status, 301 | 302 | 303 | 307 | 308) {
            let loc = resp.location.unwrap_or_default();
            SessionExchange::validate_redirect(url, &loc, method, &self.allowed_host)?;
        }
        Ok((resp.status, url.to_owned(), resp.body))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::upload::protocol::DEFAULT_WIKI_HOST;

    #[test]
    fn cookie_jar_and_session_exchange_enforce_origin_and_write_redirect_rules() {
        let jar = SessionCookieJar::from_cookie_header(
            "sid=secret123; theme=ocean; bad=a\r\nb",
            DEFAULT_WIKI_HOST,
        );
        assert_eq!(
            jar.cookie_header_for("https://wikicv.org/upload-content")
                .as_deref(),
            Some("sid=secret123; theme=ocean")
        );
        // Không gửi cookie sang domain khác.
        assert!(
            jar.cookie_header_for("https://evil.example/upload-content")
                .is_none()
        );

        // Chặn Set-Cookie gắn Domain lạ, chấp nhận Set-Cookie hợp lệ.
        jar.apply_set_cookie(DEFAULT_WIKI_HOST, "hijack=1; Domain=.evil.com");
        jar.apply_set_cookie(DEFAULT_WIKI_HOST, "sid=rotated456; Domain=.wikicv.org");
        assert_eq!(
            jar.cookie_header_for("https://wikicv.org/works").as_deref(),
            Some("sid=rotated456; theme=ocean")
        );

        assert_eq!(
            SessionExchange::read_timeout_ms(
                "https://wikicv.org/upload-content",
                "POST",
                DEFAULT_WIKI_HOST
            ),
            180_000
        );
        assert_eq!(
            SessionExchange::read_timeout_ms(
                "https://wikicv.org/volume",
                "POST",
                DEFAULT_WIKI_HOST
            ),
            60_000
        );

        // Chặn mọi redirect trên thao tác ghi.
        assert!(
            SessionExchange::validate_redirect(
                "https://wikicv.org/upload-content",
                "https://wikicv.org/dang-nhap",
                "POST",
                DEFAULT_WIKI_HOST
            )
            .is_err()
        );
        // Cho phép redirect nội bộ hợp lệ trên GET.
        assert_eq!(
            SessionExchange::validate_redirect(
                "https://wikicv.org/user/a",
                "/user/a/works?start=0",
                "GET",
                DEFAULT_WIKI_HOST
            )
            .expect("redirect ok"),
            "https://wikicv.org/user/a/works?start=0"
        );
        // Chặn redirect ra ngoài origin.
        assert!(
            SessionExchange::validate_redirect(
                "https://wikicv.org/user/a",
                "https://wikicv.org.evil.example/x",
                "GET",
                DEFAULT_WIKI_HOST
            )
            .is_err()
        );
        // Chặn CRLF injection ở supplied headers.
        assert!(
            SessionExchange::build_request_headers(
                "https://wikicv.org/works",
                "https://wikicv.org/",
                "GET",
                &[("Referer".into(), "https://wikicv.org/\r\nX-Evil: 1".into())],
                &jar,
                DEFAULT_WIKI_HOST,
                DEFAULT_USER_AGENT
            )
            .is_err()
        );
    }
}
