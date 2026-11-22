use novel_studio_core::CoreError;
use novel_studio_core::upload::engine::{FormRequest, TransportReply};
use novel_studio_core::upload::multipart::MultipartPart;
use novel_studio_core::upload::runner::UploadHttpTransport;
use novel_studio_core::upload::session::{LoopbackHttpTransport, SessionCookieJar};
use novel_studio_core::upload::verifier::{ReadCancellation, VerifierError};

pub const MOCK_BASE_URL_ENV: &str = "NOVEL_STUDIO_UPLOAD_MOCK_BASE_URL";

pub fn is_mock_transport_enabled() -> bool {
    std::env::var(MOCK_BASE_URL_ENV)
        .ok()
        .is_some_and(|v| !v.trim().is_empty())
}

pub enum DesktopUploadTransport {
    Loopback(LoopbackHttpTransport),
    #[cfg(windows)]
    WinHttp(win_impl::WinHttpTransport),
}

pub fn open_desktop_transport(
    allowed_host: &str,
    cookie_header: Option<&str>,
) -> Result<DesktopUploadTransport, CoreError> {
    let jar = SessionCookieJar::from_cookie_header(cookie_header.unwrap_or(""), allowed_host);
    if let Ok(base_url) = std::env::var(MOCK_BASE_URL_ENV)
        && !base_url.trim().is_empty()
    {
        return Ok(DesktopUploadTransport::Loopback(
            LoopbackHttpTransport::new(base_url.trim(), allowed_host, jar)?,
        ));
    }

    #[cfg(windows)]
    {
        Ok(DesktopUploadTransport::WinHttp(
            win_impl::WinHttpTransport::new(allowed_host, jar)?,
        ))
    }

    #[cfg(not(windows))]
    {
        Err("WinHTTP transport chỉ hỗ trợ trên Windows.".into())
    }
}

impl UploadHttpTransport for DesktopUploadTransport {
    fn get_html(&mut self, url: &str, cancel: &ReadCancellation) -> Result<String, VerifierError> {
        match self {
            Self::Loopback(inner) => inner.get_html(url, cancel),
            #[cfg(windows)]
            Self::WinHttp(inner) => inner.get_html(url, cancel),
        }
    }

    fn post_form(&mut self, req: &FormRequest) -> Result<TransportReply, CoreError> {
        match self {
            Self::Loopback(inner) => inner.post_form(req),
            #[cfg(windows)]
            Self::WinHttp(inner) => inner.post_form(req),
        }
    }

    fn post_multipart(
        &mut self,
        url: &str,
        boundary: &str,
        parts: &[MultipartPart],
        total_bytes: u64,
        on_progress: &mut dyn FnMut(u64, u64),
    ) -> Result<TransportReply, CoreError> {
        match self {
            Self::Loopback(inner) => {
                inner.post_multipart(url, boundary, parts, total_bytes, on_progress)
            }
            #[cfg(windows)]
            Self::WinHttp(inner) => {
                inner.post_multipart(url, boundary, parts, total_bytes, on_progress)
            }
        }
    }
}

#[cfg(windows)]
mod win_impl {
    use std::ffi::c_void;
    use std::io::{self, Write};
    use std::time::Instant;

    use novel_studio_core::CoreError;
    use novel_studio_core::upload::engine::{FormRequest, TransportReply};
    use novel_studio_core::upload::html::{guard_read_html, percent_encode_component};
    use novel_studio_core::upload::multipart::{MultipartPart, write_multipart};
    use novel_studio_core::upload::runner::UploadHttpTransport;
    use novel_studio_core::upload::session::{
        DEFAULT_USER_AGENT, MAX_FORM_BODY_BYTES, MAX_RESPONSE_BYTES, SessionCookieJar,
        SessionExchange,
    };
    use novel_studio_core::upload::verifier::{ReadCancellation, VerifierError};
    use windows_sys::Win32::Foundation::GetLastError;
    use windows_sys::Win32::Networking::WinHttp::{
        WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_ADDREQ_FLAG_ADD, WINHTTP_ADDREQ_FLAG_REPLACE,
        WINHTTP_DECOMPRESSION_FLAG_DEFLATE, WINHTTP_DECOMPRESSION_FLAG_GZIP,
        WINHTTP_DISABLE_COOKIES, WINHTTP_DISABLE_REDIRECTS, WINHTTP_FLAG_SECURE,
        WINHTTP_OPTION_DECOMPRESSION, WINHTTP_OPTION_DISABLE_FEATURE, WINHTTP_QUERY_FLAG_NUMBER,
        WINHTTP_QUERY_RAW_HEADERS_CRLF, WINHTTP_QUERY_STATUS_CODE, WinHttpAddRequestHeaders,
        WinHttpCloseHandle, WinHttpConnect, WinHttpOpen, WinHttpOpenRequest,
        WinHttpQueryDataAvailable, WinHttpQueryHeaders, WinHttpReadData, WinHttpReceiveResponse,
        WinHttpSendRequest, WinHttpSetOption, WinHttpSetTimeouts, WinHttpWriteData,
    };

    const MAX_REDIRECTS: usize = 5;

    struct HInternet(*mut c_void);

    impl Drop for HInternet {
        fn drop(&mut self) {
            if !self.0.is_null() {
                unsafe {
                    WinHttpCloseHandle(self.0);
                }
            }
        }
    }

    fn to_wide_null(text: &str) -> Vec<u16> {
        text.encode_utf16().chain(std::iter::once(0)).collect()
    }

    fn last_win_err(context: &str) -> String {
        let code = unsafe { GetLastError() };
        format!("{context} (WinHTTP lỗi {code}).")
    }

    pub struct WinHttpTransport {
        session: HInternet,
        allowed_host: String,
        jar: SessionCookieJar,
    }

    impl WinHttpTransport {
        pub fn new(allowed_host: &str, jar: SessionCookieJar) -> Result<Self, CoreError> {
            let ua = to_wide_null(DEFAULT_USER_AGENT);
            let session = unsafe {
                WinHttpOpen(
                    ua.as_ptr(),
                    WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
                    std::ptr::null(),
                    std::ptr::null(),
                    0,
                )
            };
            if session.is_null() {
                return Err(last_win_err("Không khởi tạo được WinHTTP session").into());
            }

            let mut decomp: u32 =
                WINHTTP_DECOMPRESSION_FLAG_GZIP | WINHTTP_DECOMPRESSION_FLAG_DEFLATE;
            let _ = unsafe {
                WinHttpSetOption(
                    session,
                    WINHTTP_OPTION_DECOMPRESSION,
                    (&mut decomp as *mut u32).cast(),
                    std::mem::size_of::<u32>() as u32,
                )
            };

            Ok(Self {
                session: HInternet(session),
                allowed_host: allowed_host.to_ascii_lowercase(),
                jar,
            })
        }

        fn execute_request(
            &self,
            url: &str,
            method: &str,
            supplied: &[(String, String)],
            cancel: Option<&ReadCancellation>,
            total_len: u32,
            stream_body: &mut dyn FnMut(*mut c_void) -> Result<(), CoreError>,
        ) -> Result<(u16, String, Vec<u8>), CoreError> {
            let mut current = url.to_owned();
            for redirect in 0..=MAX_REDIRECTS {
                if let Some(token) = cancel {
                    token.check()?;
                }
                let parsed =
                    SessionExchange::validate_request_url(&current, method, &self.allowed_host)?;
                let headers = SessionExchange::build_request_headers(
                    &current,
                    url,
                    method,
                    supplied,
                    &self.jar,
                    &self.allowed_host,
                    DEFAULT_USER_AGENT,
                )?;
                let timeout_ms =
                    SessionExchange::read_timeout_ms(&current, method, &self.allowed_host)
                        .min(i32::MAX as u64) as i32;

                let host_w = to_wide_null(&parsed.host);
                let conn_raw = unsafe { WinHttpConnect(self.session.0, host_w.as_ptr(), 443, 0) };
                if conn_raw.is_null() {
                    return Err(last_win_err("Không kết nối được tới server HTTPS").into());
                }
                let conn = HInternet(conn_raw);

                let method_w = to_wide_null(&method.to_ascii_uppercase());
                let path_q = format!("{}{}", parsed.path, parsed.suffix);
                let path_w = to_wide_null(&path_q);
                let req_raw = unsafe {
                    WinHttpOpenRequest(
                        conn.0,
                        method_w.as_ptr(),
                        path_w.as_ptr(),
                        std::ptr::null(),
                        std::ptr::null(),
                        std::ptr::null(),
                        WINHTTP_FLAG_SECURE,
                    )
                };
                if req_raw.is_null() {
                    return Err(last_win_err("Không mở được HTTPS request").into());
                }
                let req = HInternet(req_raw);

                let _ = unsafe { WinHttpSetTimeouts(req.0, 15_000, 25_000, 60_000, timeout_ms) };

                let disable_flags: u32 = WINHTTP_DISABLE_REDIRECTS | WINHTTP_DISABLE_COOKIES;
                if unsafe {
                    WinHttpSetOption(
                        req.0,
                        WINHTTP_OPTION_DISABLE_FEATURE,
                        (&disable_flags as *const u32).cast(),
                        std::mem::size_of::<u32>() as u32,
                    )
                } == 0
                {
                    return Err(
                        last_win_err("Không cấu hình được chính sách redirect/cookie").into(),
                    );
                }

                for (k, v) in &headers {
                    let line = to_wide_null(&format!("{k}: {v}\r\n"));
                    if unsafe {
                        WinHttpAddRequestHeaders(
                            req.0,
                            line.as_ptr(),
                            u32::MAX,
                            WINHTTP_ADDREQ_FLAG_ADD | WINHTTP_ADDREQ_FLAG_REPLACE,
                        )
                    } == 0
                    {
                        return Err(last_win_err("Không gắn được HTTP header").into());
                    }
                }

                if unsafe {
                    WinHttpSendRequest(
                        req.0,
                        std::ptr::null(),
                        0,
                        std::ptr::null(),
                        0,
                        total_len,
                        0,
                    )
                } == 0
                {
                    return Err(last_win_err("Không gửi được yêu cầu HTTPS").into());
                }

                if total_len > 0 {
                    stream_body(req.0)?;
                }

                if let Some(token) = cancel {
                    token.check()?;
                }

                if unsafe { WinHttpReceiveResponse(req.0, std::ptr::null_mut()) } == 0 {
                    return Err(last_win_err("Không nhận được phản hồi từ server").into());
                }

                let mut status: u32 = 0;
                let mut status_len = std::mem::size_of::<u32>() as u32;
                let mut idx: u32 = 0;
                if unsafe {
                    WinHttpQueryHeaders(
                        req.0,
                        WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
                        std::ptr::null(),
                        (&mut status as *mut u32).cast(),
                        &mut status_len,
                        &mut idx,
                    )
                } == 0
                {
                    return Err(last_win_err("Không đọc được mã HTTP status").into());
                }

                let raw_headers = query_raw_headers(req.0)?;
                let mut location: Option<String> = None;
                for line in raw_headers.lines() {
                    if let Some((k, v)) = line.split_once(':') {
                        let key = k.trim();
                        let val = v.trim();
                        if key.eq_ignore_ascii_case("set-cookie") {
                            self.jar.apply_set_cookie(&parsed.host, val);
                        } else if key.eq_ignore_ascii_case("location") {
                            location = Some(val.to_owned());
                        }
                    }
                }

                if matches!(status, 301 | 302 | 303 | 307 | 308) {
                    if redirect >= MAX_REDIRECTS {
                        return Err("Quá nhiều redirect.".into());
                    }
                    let loc = location.ok_or("Redirect thiếu Location.")?;
                    current = SessionExchange::validate_redirect(
                        &current,
                        &loc,
                        method,
                        &self.allowed_host,
                    )?;
                    continue;
                }

                let body = read_winhttp_body(req.0, cancel)?;
                return Ok((status as u16, current, body));
            }
            Err("Quá nhiều redirect.".into())
        }
    }

    fn query_raw_headers(req: *mut c_void) -> Result<String, CoreError> {
        let mut needed: u32 = 0;
        let mut idx: u32 = 0;
        unsafe {
            WinHttpQueryHeaders(
                req,
                WINHTTP_QUERY_RAW_HEADERS_CRLF,
                std::ptr::null(),
                std::ptr::null_mut(),
                &mut needed,
                &mut idx,
            );
        }
        if needed == 0 {
            return Ok(String::new());
        }
        let words = (needed as usize).div_ceil(2);
        let mut buf = vec![0u16; words];
        let mut actual = needed;
        let mut idx2: u32 = 0;
        if unsafe {
            WinHttpQueryHeaders(
                req,
                WINHTTP_QUERY_RAW_HEADERS_CRLF,
                std::ptr::null(),
                buf.as_mut_ptr().cast(),
                &mut actual,
                &mut idx2,
            )
        } == 0
        {
            return Err(last_win_err("Không đọc được HTTP headers").into());
        }
        let used = (actual as usize / 2).min(buf.len());
        Ok(String::from_utf16_lossy(&buf[..used]))
    }

    fn read_winhttp_body(
        req: *mut c_void,
        cancel: Option<&ReadCancellation>,
    ) -> Result<Vec<u8>, CoreError> {
        let mut out = Vec::new();
        loop {
            if let Some(token) = cancel {
                token.check()?;
            }
            let mut avail: u32 = 0;
            if unsafe { WinHttpQueryDataAvailable(req, &mut avail) } == 0 {
                return Err(last_win_err("Không kiểm tra được dữ liệu phản hồi").into());
            }
            if avail == 0 {
                break;
            }
            let chunk = avail.min(64 * 1024) as usize;
            if out.len().saturating_add(chunk) > MAX_RESPONSE_BYTES {
                return Err("Response quá lớn.".into());
            }
            let mut buf = vec![0u8; chunk];
            let mut read_len: u32 = 0;
            if unsafe { WinHttpReadData(req, buf.as_mut_ptr().cast(), chunk as u32, &mut read_len) }
                == 0
            {
                return Err(last_win_err("Lỗi đọc phản hồi từ server").into());
            }
            if read_len == 0 {
                break;
            }
            out.extend_from_slice(&buf[..read_len as usize]);
        }
        Ok(out)
    }

    struct WinHttpBodyWriter {
        req: *mut c_void,
    }

    impl Write for WinHttpBodyWriter {
        fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
            if buf.is_empty() {
                return Ok(0);
            }
            let mut written: u32 = 0;
            let chunk =
                u32::try_from(buf.len()).map_err(|_| io::Error::other("chunk too large"))?;
            let ok =
                unsafe { WinHttpWriteData(self.req, buf.as_ptr().cast(), chunk, &mut written) };
            if ok == 0 {
                return Err(io::Error::other(last_win_err("Lỗi ghi dữ liệu lên server")));
            }
            Ok(written as usize)
        }

        fn flush(&mut self) -> io::Result<()> {
            Ok(())
        }
    }

    impl UploadHttpTransport for WinHttpTransport {
        fn get_html(
            &mut self,
            url: &str,
            cancel: &ReadCancellation,
        ) -> Result<String, VerifierError> {
            let supplied = [
                (
                    "Referer".to_owned(),
                    format!("https://{}/", self.allowed_host),
                ),
                ("X-Requested-With".to_owned(), "XMLHttpRequest".to_owned()),
            ];
            let (status, final_url, body) = self
                .execute_request(url, "GET", &supplied, Some(cancel), 0, &mut |_| Ok(()))
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
            let total = u32::try_from(bytes.len()).map_err(|_| "Request quá lớn.")?;
            let supplied = [(
                "Content-Type".to_owned(),
                "application/x-www-form-urlencoded; charset=UTF-8".to_owned(),
            )];
            let (status, _, body) =
                self.execute_request(&req.url, "POST", &supplied, None, total, &mut |handle| {
                    let mut writer = WinHttpBodyWriter { req: handle };
                    writer.write_all(&bytes)?;
                    Ok(())
                })?;
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
            let total_u32 = u32::try_from(total_bytes).map_err(|_| "Request upload quá lớn.")?;
            let supplied = [(
                "Content-Type".to_owned(),
                format!("multipart/form-data; boundary={boundary}"),
            )];
            let (status, _, body) =
                self.execute_request(url, "POST", &supplied, None, total_u32, &mut |handle| {
                    let mut writer = WinHttpBodyWriter { req: handle };
                    let mut last_tick = Instant::now();
                    let written = write_multipart(&mut writer, boundary, parts, &mut |sent| {
                        if sent == total_bytes || last_tick.elapsed().as_millis() >= 120 {
                            last_tick = Instant::now();
                            on_progress(sent, total_bytes);
                        }
                    })?;
                    if written != total_bytes {
                        return Err("Kích thước multipart không khớp Content-Length.".into());
                    }
                    Ok(())
                })?;
            Ok(TransportReply {
                status,
                body: String::from_utf8_lossy(&body).into_owned(),
            })
        }
    }
}
