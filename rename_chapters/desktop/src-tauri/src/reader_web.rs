use std::net::{Ipv4Addr, SocketAddrV4, UdpSocket};
use std::path::PathBuf;
use std::sync::{
    Arc, Mutex,
    atomic::{AtomicBool, Ordering},
};
use std::thread::{self, JoinHandle};
use std::time::Duration;

use novel_studio_core::{
    CoreError,
    library::{Cursor, Library, ReadCache},
};
use serde::Serialize;
use tauri::{AppHandle, Manager, Url};
use tiny_http::{Header, Method, Request, Response, Server};

use crate::translate_commands::library_workspace_dir;

const CSP: &str = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";

#[derive(Clone, Default, Serialize)]
pub struct WebStatus {
    url: Option<String>,
    lan: bool,
}

struct Session {
    status: WebStatus,
    stop: Arc<AtomicBool>,
    worker: JoinHandle<()>,
}

impl Drop for Session {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::Release);
    }
}

#[derive(Default)]
pub struct ReaderWeb(Mutex<Option<Session>>);

fn lan_address() -> Option<Ipv4Addr> {
    let probe = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).ok()?;
    // Ask the operating system which IPv4 address it would route from. No packet is sent.
    probe.connect((Ipv4Addr::new(192, 0, 2, 1), 9)).ok()?;
    if let std::net::SocketAddr::V4(local) = probe.local_addr().ok()? {
        return Some(*local.ip());
    }
    None
}

impl Session {
    fn start(directory: PathBuf, lan: bool, port: u16) -> Result<Self, CoreError> {
        let mut random = [0; 32];
        getrandom::fill(&mut random).map_err(|err| err.to_string())?;
        let key = random
            .iter()
            .map(|b| format!("{b:02x}"))
            .collect::<String>();
        let address = if lan {
            lan_address()
                .filter(|ip| ip.is_private() || ip.is_link_local())
                .ok_or("Không tìm thấy địa chỉ mạng nội bộ IPv4. Hãy chọn chỉ mở trên máy này.")?
        } else {
            Ipv4Addr::LOCALHOST
        };
        let server = Server::http(SocketAddrV4::new(address, port))
            .map_err(|err| format!("Không mở được Dịch vụ web: {err}"))?;
        let port = server
            .server_addr()
            .to_ip()
            .ok_or("Không tìm được địa chỉ Dịch vụ web.")?
            .port();
        let status = WebStatus {
            url: Some(format!("http://{address}:{port}/#{key}")),
            lan,
        };
        let stop = Arc::new(AtomicBool::new(false));
        let signal = stop.clone();
        let worker = thread::Builder::new()
            .name("novel-studio-reader-web".into())
            .spawn(move || {
                let library = Library::new(directory);
                let mut cache = ReadCache::default();
                let credential = format!("Bearer {key}");
                while !signal.load(Ordering::Acquire) {
                    match server.recv_timeout(Duration::from_millis(150)) {
                        Ok(Some(request)) if !signal.load(Ordering::Acquire) => {
                            let reply = dispatch(&request, &library, &mut cache, &credential);
                            respond(request, reply);
                        }
                        Ok(_) => (),
                        Err(_) => break,
                    }
                }
            })?;
        Ok(Self {
            status,
            stop,
            worker,
        })
    }
}

struct Reply(u16, &'static str, Vec<u8>);

fn text(status: u16, message: &str) -> Reply {
    Reply(
        status,
        "text/plain; charset=utf-8",
        message.as_bytes().to_vec(),
    )
}

fn json<T: Serialize>(value: Result<T, CoreError>) -> Reply {
    match value.and_then(|value| Ok(serde_json::to_vec(&value)?)) {
        Ok(bytes) => Reply(200, "application/json; charset=utf-8", bytes),
        Err(_) => text(422, "Không đọc được nội dung. Hãy kiểm tra tệp ở máy chủ."),
    }
}

fn respond(request: Request, Reply(status, format, body): Reply) {
    let mut response = Response::from_data(body).with_status_code(status);
    for (name, value) in [
        ("Content-Type", format),
        ("Content-Security-Policy", CSP),
        ("Cache-Control", "no-store"),
        ("Referrer-Policy", "no-referrer"),
        ("X-Content-Type-Options", "nosniff"),
    ] {
        response.add_header(Header::from_bytes(name, value).expect("static valid response header"));
    }
    let _ = request.respond(response);
}

fn dispatch(req: &Request, library: &Library, cache: &mut ReadCache, credential: &str) -> Reply {
    if req.method() != &Method::Get {
        return text(405, "Chỉ hỗ trợ đọc.");
    }
    let Ok(url) = Url::parse(&format!("http://localhost{}", req.url())) else {
        return text(400, "Địa chỉ không hợp lệ.");
    };
    match url.path() {
        "/" => {
            return Reply(
                200,
                "text/html; charset=utf-8",
                include_bytes!("reader_web/index.html").to_vec(),
            );
        }
        "/reader.js" => {
            return Reply(
                200,
                "text/javascript; charset=utf-8",
                include_bytes!("reader_web/reader.js").to_vec(),
            );
        }
        "/reader.css" => {
            return Reply(
                200,
                "text/css; charset=utf-8",
                include_bytes!("reader_web/reader.css").to_vec(),
            );
        }
        path if path.starts_with("/api/") => {}
        _ => return text(404, "Không tìm thấy trang."),
    }
    if !req
        .headers()
        .iter()
        .any(|h| h.field.equiv("Authorization") && h.value.as_str() == credential)
    {
        return text(401, "Hãy mở liên kết được chia sẻ từ Novel Studio.");
    }
    let segments: Vec<_> = url.path().trim_start_matches('/').split('/').collect();
    if segments.as_slice() == ["api", "books"] {
        return json(library.reading_shelf());
    }
    let ["api", "books", id, action, tail @ ..] = segments.as_slice() else {
        return text(404, "Không tìm thấy trang.");
    };
    let Ok(id) = id.parse::<u32>() else {
        return text(400, "Truyện không hợp lệ.");
    };
    match (*action, tail) {
        ("toc", []) => json(library.chapters_cached(id, cache, None)),
        ("chapters", [index]) => match index.parse::<usize>() {
            Ok(index) => json(library.read_chapter_without_progress(id, index, cache)),
            Err(_) => text(400, "Chương không hợp lệ."),
        },
        ("page", []) => {
            let query: Vec<_> = url.query_pairs().collect();
            let cursor = match query.as_slice() {
                [] => None,
                [(a, offset), (b, stamp)] if a == "offset" && b == "stamp" => {
                    let Ok(offset) = offset.parse::<u64>() else {
                        return text(400, "Trang không hợp lệ.");
                    };
                    let Ok(cursor) = serde_json::from_value::<Cursor>(
                        serde_json::json!({ "offset": offset, "stamp": stamp }),
                    ) else {
                        return text(400, "Trang không hợp lệ.");
                    };
                    Some(cursor)
                }
                _ => return text(400, "Trang không hợp lệ."),
            };
            json(library.read(id, cursor))
        }
        _ => text(404, "Không tìm thấy trang."),
    }
}

#[tauri::command]
pub fn reader_web_status(app: AppHandle) -> Result<WebStatus, String> {
    let state = app.state::<ReaderWeb>();
    let session = state.0.lock().map_err(|err| err.to_string())?;
    Ok(session
        .as_ref()
        .filter(|s| !s.worker.is_finished())
        .map_or_else(WebStatus::default, |s| s.status.clone()))
}

#[tauri::command]
pub async fn start_reader_web(app: AppHandle, lan: bool, port: u16) -> Result<WebStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<ReaderWeb>();
        let mut current = state.0.lock().map_err(|err| err.to_string())?;
        if current.as_ref().is_some_and(|s| !s.worker.is_finished()) {
            return Err("Dịch vụ web đang mở.".to_owned());
        }
        let session = Session::start(library_workspace_dir(&app)?, lan, port)
            .map_err(|err| err.to_string())?;
        let status = session.status.clone();
        *current = Some(session);
        Ok(status)
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
pub async fn stop_reader_web(app: AppHandle) -> Result<WebStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<ReaderWeb>();
        let mut current = state.0.lock().map_err(|err| err.to_string())?;
        if let Some(session) = current.as_ref() {
            session.stop.store(true, Ordering::Release);
            // Normally the server is idle and returns at the next receive interval.
            for _ in 0..20 {
                if session.worker.is_finished() {
                    break;
                }
                thread::sleep(Duration::from_millis(25));
            }
            if !session.worker.is_finished() {
                return Err("Đang đóng kết nối đang đọc. Hãy thử lại.".into());
            }
        }
        *current = None;
        Ok(WebStatus::default())
    })
    .await
    .map_err(|err| err.to_string())?
}
