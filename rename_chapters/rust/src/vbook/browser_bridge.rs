use std::collections::{BTreeMap, HashMap};
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde_json::{Value, json};
use sha2::{Digest, Sha256};

use crate::CoreError;

pub trait VBookBrowserBackend: Send + Sync {
    fn create_session(&self) -> Result<String, CoreError>;
    fn set_user_agent(&self, session_id: &str, user_agent: &str) -> Result<(), CoreError>;
    fn set_cookie(
        &self,
        session_id: &str,
        cookies: &BTreeMap<String, String>,
        cookie_header: Option<&str>,
    ) -> Result<(), CoreError>;
    fn launch(&self, session_id: &str, url: &str, timeout_ms: u64) -> Result<String, CoreError>;
    fn load_html(
        &self,
        session_id: &str,
        base_url: &str,
        html: &str,
        timeout_ms: u64,
    ) -> Result<(), CoreError>;
    fn run_js(&self, session_id: &str, script: &str, wait_ms: u64) -> Result<String, CoreError>;
    fn get_html(&self, session_id: &str, wait_ms: u64) -> Result<String, CoreError>;
    fn get_var(&self, session_id: &str, key: &str) -> Result<String, CoreError>;
    fn urls(&self, session_id: &str) -> Result<Vec<String>, CoreError>;
    fn wait_url(
        &self,
        session_id: &str,
        patterns: &[String],
        timeout_ms: u64,
    ) -> Result<(), CoreError>;
    fn close_session(&self, session_id: &str) -> Result<(), CoreError>;
}

pub struct VBookBrowserBridgeServer {
    endpoint_url: String,
    token: String,
    stop: Arc<AtomicBool>,
    join: Option<JoinHandle<()>>,
}

impl VBookBrowserBridgeServer {
    pub fn start(backend: Arc<dyn VBookBrowserBackend>) -> Result<Self, CoreError> {
        let listener = TcpListener::bind("127.0.0.1:0")?;
        listener.set_nonblocking(true)?;
        let port = listener.local_addr()?.port();
        let token = generate_bridge_token();
        let endpoint_url = format!("http://127.0.0.1:{port}/vbook-browser");
        let stop = Arc::new(AtomicBool::new(false));
        let stop_loop = Arc::clone(&stop);
        let expected_token = token.clone();

        let join = thread::Builder::new()
            .name("vbook-browser-bridge".to_owned())
            .spawn(move || {
                while !stop_loop.load(Ordering::Relaxed) {
                    match listener.accept() {
                        Ok((stream, _)) => {
                            let backend_ref = Arc::clone(&backend);
                            let token_ref = expected_token.clone();
                            thread::spawn(move || {
                                let _ = handle_connection(stream, &token_ref, backend_ref.as_ref());
                            });
                        }
                        Err(err) if err.kind() == std::io::ErrorKind::WouldBlock => {
                            thread::sleep(Duration::from_millis(25));
                        }
                        Err(_) => break,
                    }
                }
            })?;

        Ok(Self {
            endpoint_url,
            token,
            stop,
            join: Some(join),
        })
    }

    pub fn endpoint_url(&self) -> &str {
        &self.endpoint_url
    }

    pub fn token(&self) -> &str {
        &self.token
    }
}

impl Drop for VBookBrowserBridgeServer {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::Relaxed);
        let _ = TcpStream::connect(
            self.endpoint_url
                .trim_start_matches("http://")
                .split('/')
                .next()
                .unwrap_or("127.0.0.1:0"),
        );
        if let Some(join) = self.join.take() {
            let _ = join.join();
        }
    }
}

fn generate_bridge_token() -> String {
    static COUNTER: AtomicU64 = AtomicU64::new(1);
    let seq = COUNTER.fetch_add(1, Ordering::Relaxed);
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let pid = std::process::id();
    let mut hasher = Sha256::new();
    hasher.update(format!("{pid}:{nanos}:{seq}").as_bytes());
    let digest = hasher.finalize();
    let mut hex = String::with_capacity(48);
    for byte in &digest[..24] {
        hex.push_str(&format!("{byte:02x}"));
    }
    hex
}

fn handle_connection(
    mut stream: TcpStream,
    expected_token: &str,
    backend: &dyn VBookBrowserBackend,
) -> Result<(), CoreError> {
    // Trên Windows Winsock, TcpStream từ listener non-blocking kế thừa trạng thái non-blocking.
    stream.set_nonblocking(false)?;
    let _ = stream.set_read_timeout(Some(Duration::from_secs(30)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(30)));

    let mut reader = BufReader::new(stream.try_clone()?);
    let mut request_line = String::new();
    if reader.read_line(&mut request_line)? == 0 {
        return Ok(());
    }
    let mut parts = request_line.split_whitespace();
    let method = parts.next().unwrap_or("");
    let path = parts.next().unwrap_or("");

    let mut headers: HashMap<String, String> = HashMap::new();
    loop {
        let mut line = String::new();
        let n = reader.read_line(&mut line)?;
        if n == 0 || line == "\r\n" || line == "\n" {
            break;
        }
        if let Some((k, v)) = line.split_once(':') {
            headers.insert(k.trim().to_ascii_lowercase(), v.trim().to_owned());
        }
    }

    let body_bytes = if headers
        .get("transfer-encoding")
        .is_some_and(|v| v.to_ascii_lowercase().contains("chunked"))
    {
        read_chunked_body(&mut reader)?
    } else if let Some(len) = headers
        .get("content-length")
        .and_then(|v| v.parse::<usize>().ok())
    {
        let mut buf = vec![0u8; len.min(16 * 1024 * 1024)];
        reader.read_exact(&mut buf)?;
        buf
    } else {
        Vec::new()
    };

    if !method.eq_ignore_ascii_case("POST") || !path.starts_with("/vbook-browser") {
        write_json_response(
            &mut stream,
            "404 Not Found",
            &json!({ "ok": false, "error": "Not found" }),
        )?;
        return Ok(());
    }

    let presented = headers
        .get("x-rc-bridge-token")
        .map(String::as_str)
        .unwrap_or("");
    if presented != expected_token {
        write_json_response(
            &mut stream,
            "403 Forbidden",
            &json!({ "ok": false, "error": "Invalid bridge token" }),
        )?;
        return Ok(());
    }

    let payload: Value = match serde_json::from_slice(&body_bytes) {
        Ok(v) => v,
        Err(err) => {
            write_json_response(
                &mut stream,
                "400 Bad Request",
                &json!({ "ok": false, "error": format!("Invalid JSON: {err}") }),
            )?;
            return Ok(());
        }
    };

    let response = dispatch_bridge_op(&payload, backend);
    write_json_response(&mut stream, "200 OK", &response)?;
    Ok(())
}

fn read_chunked_body(reader: &mut BufReader<TcpStream>) -> Result<Vec<u8>, CoreError> {
    let mut out = Vec::new();
    loop {
        let mut size_line = String::new();
        if reader.read_line(&mut size_line)? == 0 {
            break;
        }
        let hex_size = size_line.split(';').next().unwrap_or("").trim();
        let chunk_len = usize::from_str_radix(hex_size, 16)
            .map_err(|_| "Chunked HTTP body size không hợp lệ.")?;
        if chunk_len == 0 {
            break;
        }
        let mut buf = vec![0u8; chunk_len.min(16 * 1024 * 1024)];
        reader.read_exact(&mut buf)?;
        out.extend_from_slice(&buf);
        let mut crlf = [0u8; 2];
        let _ = reader.read_exact(&mut crlf);
    }
    Ok(out)
}

fn write_json_response(
    stream: &mut TcpStream,
    status: &str,
    payload: &Value,
) -> Result<(), CoreError> {
    let body = serde_json::to_vec(payload)?;
    let header = format!(
        "HTTP/1.1 {status}\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        body.len()
    );
    stream.write_all(header.as_bytes())?;
    stream.write_all(&body)?;
    stream.flush()?;
    Ok(())
}

fn req_str<'a>(payload: &'a Value, key: &str) -> &'a str {
    payload.get(key).and_then(Value::as_str).unwrap_or_default()
}

fn req_u64(payload: &Value, key: &str, default_val: u64) -> u64 {
    payload
        .get(key)
        .and_then(|v| v.as_u64().or_else(|| v.as_f64().map(|f| f.max(0.0) as u64)))
        .unwrap_or(default_val)
}

fn parse_url_patterns(raw: Option<&Value>) -> Vec<String> {
    match raw {
        Some(Value::Array(items)) => items
            .iter()
            .filter_map(|v| v.as_str().map(str::trim).filter(|s| !s.is_empty()))
            .map(ToOwned::to_owned)
            .collect(),
        Some(Value::String(s)) => {
            let trimmed = s.trim();
            if trimmed.is_empty() {
                Vec::new()
            } else {
                vec![trimmed.to_owned()]
            }
        }
        _ => Vec::new(),
    }
}

fn dispatch_bridge_op(payload: &Value, backend: &dyn VBookBrowserBackend) -> Value {
    let op = req_str(payload, "op");
    let session_id = req_str(payload, "session_id");
    let res: Result<Value, CoreError> = match op {
        "CREATE_SESSION" => backend
            .create_session()
            .map(|id| json!({ "ok": true, "session_id": id })),
        "SET_USER_AGENT" => backend
            .set_user_agent(session_id, req_str(payload, "user_agent"))
            .map(|()| json!({ "ok": true })),
        "SET_COOKIE" => {
            let mut cookies = BTreeMap::new();
            if let Some(obj) = payload.get("cookies").and_then(Value::as_object) {
                for (k, v) in obj {
                    let key = k.trim();
                    if !key.is_empty()
                        && let Some(val) = v.as_str()
                    {
                        cookies.insert(key.to_owned(), val.to_owned());
                    }
                }
            }
            let header = payload
                .get("cookie_header")
                .and_then(Value::as_str)
                .map(str::trim)
                .filter(|s| !s.is_empty());
            backend
                .set_cookie(session_id, &cookies, header)
                .map(|()| json!({ "ok": true }))
        }
        "LAUNCH" => backend
            .launch(
                session_id,
                req_str(payload, "url"),
                req_u64(payload, "timeout_ms", 15_000),
            )
            .map(|html| json!({ "ok": true, "html": html })),
        "LOAD_HTML" => backend
            .load_html(
                session_id,
                req_str(payload, "base_url"),
                req_str(payload, "html"),
                req_u64(payload, "timeout_ms", 4_000),
            )
            .map(|()| json!({ "ok": true })),
        "RUN_JS" => backend
            .run_js(
                session_id,
                req_str(payload, "script"),
                req_u64(payload, "wait_ms", 0),
            )
            .map(|html| json!({ "ok": true, "html": html })),
        "GET_HTML" => backend
            .get_html(session_id, req_u64(payload, "wait_ms", 0))
            .map(|html| json!({ "ok": true, "html": html })),
        "GET_VAR" => backend
            .get_var(session_id, req_str(payload, "key"))
            .map(|value| json!({ "ok": true, "value": value })),
        "URLS" => backend
            .urls(session_id)
            .map(|urls| json!({ "ok": true, "urls": urls })),
        "WAIT_URL" => {
            let patterns = parse_url_patterns(payload.get("urls"));
            let timeout_ms = req_u64(payload, "timeout_ms", 15_000);
            backend
                .wait_url(session_id, &patterns, timeout_ms)
                .map(|()| json!({ "ok": true }))
        }
        "CLOSE_SESSION" => backend
            .close_session(session_id)
            .map(|()| json!({ "ok": true })),
        other => Err(format!("Unsupported browser bridge op: {other}").into()),
    };

    match res {
        Ok(val) => val,
        Err(err) => json!({ "ok": false, "error": err.to_string() }),
    }
}

/// Kiểm tra tập URL đã ghi nhận có khớp bất kỳ pattern nào không (hỗ trợ `*` wildcard và substring).
pub fn url_matches_any_pattern(urls: &[String], patterns: &[String]) -> bool {
    if patterns.is_empty() {
        return !urls.is_empty();
    }
    urls.iter().any(|url| {
        patterns.iter().any(|pat| {
            let p = pat.trim();
            if p.is_empty() {
                return false;
            }
            if !p.contains('*') {
                return url.contains(p);
            }
            wildcard_match(p, url)
        })
    })
}

fn wildcard_match(pattern: &str, text: &str) -> bool {
    let parts: Vec<&str> = pattern.split('*').collect();
    if parts.len() == 1 {
        return text.contains(pattern);
    }
    let mut pos = 0usize;
    for (idx, part) in parts.iter().enumerate() {
        if part.is_empty() {
            continue;
        }
        if idx == 0 && !pattern.starts_with('*') {
            if !text[pos..].starts_with(part) {
                return false;
            }
            pos += part.len();
        } else if idx + 1 == parts.len() && !pattern.ends_with('*') {
            return text[pos..].ends_with(part);
        } else if let Some(found) = text[pos..].find(part) {
            pos += found + part.len();
        } else {
            return false;
        }
    }
    true
}

#[derive(Default)]
pub struct MemoryBrowserBackend {
    next_id: AtomicU64,
    sessions: Mutex<HashMap<String, MemorySession>>,
}

struct MemorySession {
    user_agent: String,
    cookies: BTreeMap<String, String>,
    html: String,
    vars: HashMap<String, String>,
    urls: Vec<String>,
}

impl VBookBrowserBackend for MemoryBrowserBackend {
    fn create_session(&self) -> Result<String, CoreError> {
        let id = format!("mem-{}", self.next_id.fetch_add(1, Ordering::Relaxed) + 1);
        let mut guard = self.sessions.lock().map_err(|_| "Memory backend lock")?;
        guard.insert(
            id.clone(),
            MemorySession {
                user_agent: String::new(),
                cookies: BTreeMap::new(),
                html: String::new(),
                vars: HashMap::new(),
                urls: Vec::new(),
            },
        );
        Ok(id)
    }

    fn set_user_agent(&self, session_id: &str, user_agent: &str) -> Result<(), CoreError> {
        let mut guard = self.sessions.lock().map_err(|_| "Memory backend lock")?;
        let sess = guard.get_mut(session_id).ok_or("Session not found")?;
        sess.user_agent = user_agent.to_owned();
        Ok(())
    }

    fn set_cookie(
        &self,
        session_id: &str,
        cookies: &BTreeMap<String, String>,
        cookie_header: Option<&str>,
    ) -> Result<(), CoreError> {
        let mut guard = self.sessions.lock().map_err(|_| "Memory backend lock")?;
        let sess = guard.get_mut(session_id).ok_or("Session not found")?;
        for (k, v) in cookies {
            sess.cookies.insert(k.clone(), v.clone());
        }
        if let Some(raw) = cookie_header {
            sess.vars
                .insert("__cookie_header".to_owned(), raw.to_owned());
        }
        Ok(())
    }

    fn launch(&self, session_id: &str, url: &str, _timeout_ms: u64) -> Result<String, CoreError> {
        let mut guard = self.sessions.lock().map_err(|_| "Memory backend lock")?;
        let sess = guard.get_mut(session_id).ok_or("Session not found")?;
        sess.urls.push(url.to_owned());
        sess.html = format!(
            "<html><body><h1>STV Mock Page</h1><p data-url=\"{url}\" data-ua=\"{}\">Đã vượt kiểm tra DOM</p></body></html>",
            sess.user_agent
        );
        Ok(sess.html.clone())
    }

    fn load_html(
        &self,
        session_id: &str,
        base_url: &str,
        html: &str,
        _timeout_ms: u64,
    ) -> Result<(), CoreError> {
        let mut guard = self.sessions.lock().map_err(|_| "Memory backend lock")?;
        let sess = guard.get_mut(session_id).ok_or("Session not found")?;
        if !base_url.is_empty() {
            sess.urls.push(base_url.to_owned());
        }
        sess.html = html.to_owned();
        Ok(())
    }

    fn run_js(&self, session_id: &str, script: &str, _wait_ms: u64) -> Result<String, CoreError> {
        let mut guard = self.sessions.lock().map_err(|_| "Memory backend lock")?;
        let sess = guard.get_mut(session_id).ok_or("Session not found")?;
        sess.vars
            .insert("last_script".to_owned(), script.to_owned());
        if script.contains("ajax/chapters") {
            sess.urls
                .push("https://sangtacviet.app/api/ajax/chapters?book=1".to_owned());
        }
        Ok(sess.html.clone())
    }

    fn get_html(&self, session_id: &str, _wait_ms: u64) -> Result<String, CoreError> {
        let guard = self.sessions.lock().map_err(|_| "Memory backend lock")?;
        let sess = guard.get(session_id).ok_or("Session not found")?;
        Ok(sess.html.clone())
    }

    fn get_var(&self, session_id: &str, key: &str) -> Result<String, CoreError> {
        let guard = self.sessions.lock().map_err(|_| "Memory backend lock")?;
        let sess = guard.get(session_id).ok_or("Session not found")?;
        Ok(sess.vars.get(key).cloned().unwrap_or_default())
    }

    fn urls(&self, session_id: &str) -> Result<Vec<String>, CoreError> {
        let guard = self.sessions.lock().map_err(|_| "Memory backend lock")?;
        let sess = guard.get(session_id).ok_or("Session not found")?;
        Ok(sess.urls.clone())
    }

    fn wait_url(
        &self,
        session_id: &str,
        patterns: &[String],
        _timeout_ms: u64,
    ) -> Result<(), CoreError> {
        let guard = self.sessions.lock().map_err(|_| "Memory backend lock")?;
        let sess = guard.get(session_id).ok_or("Session not found")?;
        if url_matches_any_pattern(&sess.urls, patterns) {
            Ok(())
        } else {
            Err("Timeout waiting for URL".into())
        }
    }

    fn close_session(&self, session_id: &str) -> Result<(), CoreError> {
        let mut guard = self.sessions.lock().map_err(|_| "Memory backend lock")?;
        guard.remove(session_id);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vbook::runner::{
        JavaVBookRunnerExecutor, RunnerExecConfig, VBookScriptExecutor, find_java_bin,
        find_runner_jar,
    };

    fn raw_post(url: &str, token: &str, body: &Value) -> (u16, Value) {
        let addr = url.trim_start_matches("http://").split('/').next().unwrap();
        let path = format!(
            "/{}",
            url.trim_start_matches("http://")
                .split_once('/')
                .map(|(_, p)| p)
                .unwrap_or("")
        );
        let mut stream = TcpStream::connect(addr).expect("connect bridge");
        let bytes = serde_json::to_vec(body).expect("json");
        let req = format!(
            "POST {path} HTTP/1.1\r\nHost: {addr}\r\nContent-Type: application/json\r\nX-RC-Bridge-Token: {token}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
            bytes.len()
        );
        stream.write_all(req.as_bytes()).unwrap();
        stream.write_all(&bytes).unwrap();
        stream.flush().unwrap();

        let mut raw = String::new();
        stream.read_to_string(&mut raw).unwrap();
        let (head, body_str) = raw.split_once("\r\n\r\n").expect("http split");
        let code: u16 = head
            .lines()
            .next()
            .unwrap()
            .split_whitespace()
            .nth(1)
            .unwrap()
            .parse()
            .unwrap();
        (code, serde_json::from_str(body_str).expect("json reply"))
    }

    #[test]
    fn browser_bridge_server_enforces_token_and_dispatches_all_ops() {
        let backend = Arc::new(MemoryBrowserBackend::default());
        let server = VBookBrowserBridgeServer::start(backend).expect("start server");

        let (bad_code, _) = raw_post(
            server.endpoint_url(),
            "wrong-token",
            &json!({"op": "CREATE_SESSION"}),
        );
        assert_eq!(bad_code, 403);

        let (code, created) = raw_post(
            server.endpoint_url(),
            server.token(),
            &json!({"op": "CREATE_SESSION"}),
        );
        assert_eq!(code, 200);
        let sid = created["session_id"].as_str().unwrap().to_owned();

        assert_eq!(
            raw_post(
                server.endpoint_url(),
                server.token(),
                &json!({"op": "SET_USER_AGENT", "session_id": sid, "user_agent": "NovelStudioTest/1.0"})
            ).1["ok"],
            json!(true)
        );
        let (_, launched) = raw_post(
            server.endpoint_url(),
            server.token(),
            &json!({"op": "LAUNCH", "session_id": sid, "url": "https://69shuba.tw/book/123", "timeout_ms": 5000}),
        );
        assert!(launched["html"].as_str().unwrap().contains("STV Mock Page"));

        let (_, run_js_res) = raw_post(
            server.endpoint_url(),
            server.token(),
            &json!({"op": "RUN_JS", "session_id": sid, "script": "fetch('/api/ajax/chapters')", "wait_ms": 10}),
        );
        assert_eq!(run_js_res["ok"], json!(true));

        let (_, wait_res) = raw_post(
            server.endpoint_url(),
            server.token(),
            &json!({"op": "WAIT_URL", "session_id": sid, "urls": ["*/ajax/chapters*"], "timeout_ms": 500}),
        );
        assert_eq!(wait_res["ok"], json!(true));

        let (_, urls_res) = raw_post(
            server.endpoint_url(),
            server.token(),
            &json!({"op": "URLS", "session_id": sid}),
        );
        assert_eq!(urls_res["urls"].as_array().unwrap().len(), 2);

        let (_, var_res) = raw_post(
            server.endpoint_url(),
            server.token(),
            &json!({"op": "GET_VAR", "session_id": sid, "key": "last_script"}),
        );
        assert!(var_res["value"].as_str().unwrap().contains("ajax/chapters"));

        assert_eq!(
            raw_post(
                server.endpoint_url(),
                server.token(),
                &json!({"op": "CLOSE_SESSION", "session_id": sid})
            )
            .1["ok"],
            json!(true)
        );
    }

    #[test]
    fn real_vbook_runner_executes_engine_new_browser_over_bridge_when_installed() {
        let Some(jar) = find_runner_jar() else {
            return;
        };
        let Some(_java) = find_java_bin(Some(&jar)) else {
            return;
        };

        let backend = Arc::new(MemoryBrowserBackend::default());
        let server = VBookBrowserBridgeServer::start(backend).expect("start bridge");

        let dir = tempfile::tempdir().expect("tempdir");
        let plugin_dir = dir.path().join("plugin");
        let src_dir = plugin_dir.join("src");
        std::fs::create_dir_all(&src_dir).unwrap();
        std::fs::write(
            plugin_dir.join("plugin.json"),
            br#"{"metadata":{"name":"STV Bridge Test","author":"Test","version":1,"source":"https://sangtacviet.app","type":"chinese_novel"},"script":{"chap":"chap.js"}}"#,
        )
        .unwrap();
        std::fs::write(
            src_dir.join("chap.js"),
            br#"function execute(url) {
  var browser = Engine.newBrowser();
  browser.launch(url, 3000);
  browser.callJs("fetch('/api/ajax/chapters')", 10);
  browser.waitUrl("*ajax/chapters*", 1000);
  var text = browser.html().select("p").text();
  var reqs = browser.urls();
  browser.close();
  return Response.success(text + "|" + reqs);
}"#,
        )
        .unwrap();

        let mut exec = JavaVBookRunnerExecutor::with_runtime(
            None,
            Some(server.endpoint_url().to_owned()),
            Some(server.token().to_owned()),
        );
        let cfg = RunnerExecConfig {
            storage_path: dir
                .path()
                .join("storage.json")
                .to_string_lossy()
                .into_owned(),
            plugin_config: BTreeMap::new(),
            browser_bridge_url: String::new(),
            browser_bridge_token: String::new(),
        };
        let out = exec
            .run_script(
                &plugin_dir,
                "chap",
                &[json!("https://sangtacviet.app/truyen/1/2/")],
                &cfg,
            )
            .expect("real vbook_runner browser execution");
        assert_eq!(out["code"].as_f64().map(|n| n as i64), Some(0));
        let data = out["data"].as_str().unwrap_or("");
        assert!(data.contains("Đã vượt kiểm tra DOM"), "got: {data}");
        assert!(data.contains("ajax/chapters"), "got: {data}");
    }
}
