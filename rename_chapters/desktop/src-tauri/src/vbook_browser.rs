use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Condvar, Mutex};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

use novel_studio_core::CoreError;
use novel_studio_core::vbook::browser_bridge::{
    VBookBrowserBackend, VBookBrowserBridgeServer, url_matches_any_pattern,
};
use tauri::webview::{NewWindowResponse, PageLoadEvent};
use tauri::{AppHandle, Manager, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

const MAX_WAIT_MS: u64 = 60_000;
const CALLBACK_TIMEOUT: Duration = Duration::from_secs(8);

pub struct VBookBrowserBridgeState {
    server: Mutex<Option<VBookBrowserBridgeServer>>,
}

impl Default for VBookBrowserBridgeState {
    fn default() -> Self {
        Self {
            server: Mutex::new(None),
        }
    }
}

impl VBookBrowserBridgeState {
    pub fn init(&self, app: AppHandle, sessions_root: PathBuf) -> Result<(), String> {
        let mut guard = self
            .server
            .lock()
            .map_err(|_| "Browser bridge state lock failed".to_owned())?;
        if guard.is_some() {
            return Ok(());
        }
        let backend = Arc::new(
            DesktopVBookBrowserBackend::new(app, sessions_root).map_err(|err| err.to_string())?,
        );
        let server = VBookBrowserBridgeServer::start(backend).map_err(|err| err.to_string())?;
        *guard = Some(server);
        Ok(())
    }

    pub fn bridge_info(&self) -> (Option<String>, Option<String>) {
        let Ok(guard) = self.server.lock() else {
            return (None, None);
        };
        match guard.as_ref() {
            Some(srv) => (
                Some(srv.endpoint_url().to_owned()),
                Some(srv.token().to_owned()),
            ),
            None => (None, None),
        }
    }

    pub fn is_ready(&self) -> bool {
        self.server
            .lock()
            .map(|guard| guard.is_some())
            .unwrap_or(false)
    }
}

struct SessionEntry {
    label: String,
    data_dir: PathBuf,
    user_agent: String,
    pending_cookies: Vec<String>,
    nav_urls: Arc<Mutex<Vec<String>>>,
    load_signal: Arc<(Mutex<u64>, Condvar)>,
    window_created: bool,
}

type CallbackSlot = Arc<(Mutex<Option<String>>, Condvar)>;
type EnsureWindowHandle = (
    WebviewWindow,
    Arc<(Mutex<u64>, Condvar)>,
    Arc<Mutex<Vec<String>>>,
);

pub struct DesktopVBookBrowserBackend {
    app: AppHandle,
    sessions_root: PathBuf,
    next_session: AtomicU64,
    next_cb: AtomicU64,
    sessions: Mutex<HashMap<String, SessionEntry>>,
    callbacks: Arc<Mutex<HashMap<String, CallbackSlot>>>,
    cb_port: u16,
    cb_token: String,
    cb_stop: Arc<AtomicBool>,
    cb_join: Option<JoinHandle<()>>,
}

impl DesktopVBookBrowserBackend {
    pub fn new(app: AppHandle, sessions_root: PathBuf) -> Result<Self, CoreError> {
        fs::create_dir_all(&sessions_root)?;
        let listener = TcpListener::bind("127.0.0.1:0")?;
        listener.set_nonblocking(true)?;
        let cb_port = listener.local_addr()?.port();
        let cb_token = format!("cb-{}", std::process::id());
        let callbacks: Arc<Mutex<HashMap<String, CallbackSlot>>> =
            Arc::new(Mutex::new(HashMap::new()));
        let cb_stop = Arc::new(AtomicBool::new(false));
        let stop_loop = Arc::clone(&cb_stop);
        let callbacks_ref = Arc::clone(&callbacks);
        let token_ref = cb_token.clone();

        let cb_join = thread::Builder::new()
            .name("vbook-webview-cb".to_owned())
            .spawn(move || {
                while !stop_loop.load(Ordering::Relaxed) {
                    match listener.accept() {
                        Ok((stream, _)) => {
                            let cbs = Arc::clone(&callbacks_ref);
                            let tok = token_ref.clone();
                            thread::spawn(move || {
                                let _ = handle_callback_conn(stream, &tok, &cbs);
                            });
                        }
                        Err(err) if err.kind() == std::io::ErrorKind::WouldBlock => {
                            thread::sleep(Duration::from_millis(15));
                        }
                        Err(_) => break,
                    }
                }
            })?;

        Ok(Self {
            app,
            sessions_root,
            next_session: AtomicU64::new(1),
            next_cb: AtomicU64::new(1),
            sessions: Mutex::new(HashMap::new()),
            callbacks,
            cb_port,
            cb_token,
            cb_stop,
            cb_join: Some(cb_join),
        })
    }

    fn ensure_window(
        &self,
        session_id: &str,
        initial_url: Url,
    ) -> Result<EnsureWindowHandle, CoreError> {
        let (label, data_dir, ua, cookies, nav_urls, load_signal, already_created) = {
            let mut guard = self.sessions.lock().map_err(|_| "Session lock poisoned")?;
            let sess = guard
                .get_mut(session_id)
                .ok_or("Browser session không tồn tại hoặc đã đóng.")?;
            (
                sess.label.clone(),
                sess.data_dir.clone(),
                sess.user_agent.clone(),
                sess.pending_cookies.clone(),
                Arc::clone(&sess.nav_urls),
                Arc::clone(&sess.load_signal),
                sess.window_created,
            )
        };

        if already_created && let Some(win) = self.app.get_webview_window(&label) {
            return Ok((win, load_signal, nav_urls));
        }

        fs::create_dir_all(&data_dir)?;
        let nav_urls_hook = Arc::clone(&nav_urls);
        let load_hook = Arc::clone(&load_signal);

        let mut init_js = String::from(
            r#"(function(){
  if (window.__nsVbookInit) return;
  window.__nsVbookInit = true;
  window.__nsVbookUrls = [];
  function rec(u){ try { if (u && typeof u === 'string' && !window.__nsVbookUrls.includes(u)) window.__nsVbookUrls.push(u); } catch(_){} }
  if (typeof window.fetch === 'function') {
    var origFetch = window.fetch;
    window.fetch = function(input) {
      try { rec(typeof input === 'string' ? input : (input && input.url ? input.url : '')); } catch(_){}
      return origFetch.apply(this, arguments);
    };
  }
  if (window.XMLHttpRequest && window.XMLHttpRequest.prototype) {
    var origOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url) {
      try { rec(String(url || '')); } catch(_){}
      return origOpen.apply(this, arguments);
    };
  }
})();"#,
        );
        for c in &cookies {
            if let Ok(lit) = serde_json::to_string(c) {
                init_js.push_str(&format!(
                    "\ntry {{ document.cookie = {lit}; }} catch(_){{}}"
                ));
            }
        }

        let mut builder =
            WebviewWindowBuilder::new(&self.app, label.clone(), WebviewUrl::External(initial_url))
                .title("VBook Browser Bridge")
                .inner_size(1024.0, 720.0)
                .visible(false)
                .data_directory(data_dir)
                .initialization_script(&init_js)
                .on_navigation(move |url| {
                    let s = url.as_str();
                    if let Ok(mut list) = nav_urls_hook.lock()
                        && !list.iter().any(|u| u == s)
                    {
                        list.push(s.to_owned());
                    }
                    matches!(url.scheme(), "http" | "https" | "about")
                })
                .on_new_window(|_, _| NewWindowResponse::Deny)
                .on_page_load(move |_win, payload| {
                    if matches!(payload.event(), PageLoadEvent::Finished) {
                        let (lock, cvar) = &*load_hook;
                        if let Ok(mut load_gen) = lock.lock() {
                            *load_gen += 1;
                            cvar.notify_all();
                        }
                    }
                });

        if !ua.is_empty() {
            builder = builder.user_agent(&ua);
        }

        let win = builder
            .build()
            .map_err(|err| format!("Không tạo được WebView2 bridge session: {err}"))?;

        if let Ok(mut guard) = self.sessions.lock()
            && let Some(sess) = guard.get_mut(session_id)
        {
            sess.window_created = true;
        }
        Ok((win, load_signal, nav_urls))
    }

    fn eval_and_collect(
        &self,
        win: &WebviewWindow,
        expr_returning_string: &str,
    ) -> Result<String, CoreError> {
        let cb_id = format!("r{}", self.next_cb.fetch_add(1, Ordering::Relaxed));
        let slot: CallbackSlot = Arc::new((Mutex::new(None), Condvar::new()));
        {
            let mut guard = self.callbacks.lock().map_err(|_| "Callback lock failed")?;
            guard.insert(cb_id.clone(), Arc::clone(&slot));
        }

        let cb_url = format!(
            "http://127.0.0.1:{}/cb/{}/{}",
            self.cb_port, self.cb_token, cb_id
        );
        let cb_url_json = serde_json::to_string(&cb_url)?;
        let script = format!(
            "(function(){{ var val = ''; try {{ val = String({expr_returning_string} ?? ''); }} catch(e) {{ val = ''; }} fetch({cb_url_json}, {{ method: 'POST', mode: 'no-cors', body: val }}).catch(function(){{}}); }})();"
        );
        if let Err(err) = win.eval(&script) {
            if let Ok(mut guard) = self.callbacks.lock() {
                guard.remove(&cb_id);
            }
            return Err(format!("Không thể chạy JS trong WebView2 bridge: {err}").into());
        }

        let (lock, cvar) = &*slot;
        let deadline = Instant::now() + CALLBACK_TIMEOUT;
        let mut guard = lock.lock().map_err(|_| "Callback slot lock failed")?;
        while guard.is_none() {
            let now = Instant::now();
            if now >= deadline {
                if let Ok(mut cbs) = self.callbacks.lock() {
                    cbs.remove(&cb_id);
                }
                return Err("Hết thời gian chờ kết quả JS từ WebView2 bridge.".into());
            }
            let (next_guard, _) = cvar
                .wait_timeout(guard, deadline - now)
                .map_err(|_| "Callback wait poisoned")?;
            guard = next_guard;
        }
        let result = guard.take().unwrap_or_default();
        if let Ok(mut cbs) = self.callbacks.lock() {
            cbs.remove(&cb_id);
        }
        Ok(result)
    }

    fn record_url(&self, session_id: &str, url: &str) {
        if let Ok(guard) = self.sessions.lock()
            && let Some(sess) = guard.get(session_id)
            && let Ok(mut list) = sess.nav_urls.lock()
            && !list.iter().any(|u| u == url)
        {
            list.push(url.to_owned());
        }
    }
}

impl Drop for DesktopVBookBrowserBackend {
    fn drop(&mut self) {
        self.cb_stop.store(true, Ordering::Relaxed);
        let _ = TcpStream::connect(format!("127.0.0.1:{}", self.cb_port));
        if let Some(join) = self.cb_join.take() {
            let _ = join.join();
        }
        if let Ok(mut guard) = self.sessions.lock() {
            for (_, sess) in guard.drain() {
                if let Some(win) = self.app.get_webview_window(&sess.label) {
                    let _ = win.destroy();
                }
                cleanup_dir_quiet(&sess.data_dir);
            }
        }
    }
}

impl VBookBrowserBackend for DesktopVBookBrowserBackend {
    fn create_session(&self) -> Result<String, CoreError> {
        let id = format!("vb-{}", self.next_session.fetch_add(1, Ordering::Relaxed));
        let label = format!("vbook-bridge-{id}");
        let data_dir = self.sessions_root.join(&id);
        let mut guard = self.sessions.lock().map_err(|_| "Session lock poisoned")?;
        guard.insert(
            id.clone(),
            SessionEntry {
                label,
                data_dir,
                user_agent: String::new(),
                pending_cookies: Vec::new(),
                nav_urls: Arc::new(Mutex::new(Vec::new())),
                load_signal: Arc::new((Mutex::new(0), Condvar::new())),
                window_created: false,
            },
        );
        Ok(id)
    }

    fn set_user_agent(&self, session_id: &str, user_agent: &str) -> Result<(), CoreError> {
        let mut guard = self.sessions.lock().map_err(|_| "Session lock poisoned")?;
        let sess = guard
            .get_mut(session_id)
            .ok_or("Browser session không tồn tại.")?;
        sess.user_agent = user_agent.trim().to_owned();
        Ok(())
    }

    fn set_cookie(
        &self,
        session_id: &str,
        cookies: &BTreeMap<String, String>,
        cookie_header: Option<&str>,
    ) -> Result<(), CoreError> {
        let mut entries = Vec::new();
        for (k, v) in cookies {
            entries.push(format!("{k}={v}; path=/"));
        }
        if let Some(raw) = cookie_header {
            for part in raw.split(';') {
                let trimmed = part.trim();
                if !trimmed.is_empty() && trimmed.contains('=') {
                    entries.push(format!("{trimmed}; path=/"));
                }
            }
        }
        let label = {
            let mut guard = self.sessions.lock().map_err(|_| "Session lock poisoned")?;
            let sess = guard
                .get_mut(session_id)
                .ok_or("Browser session không tồn tại.")?;
            sess.pending_cookies.extend(entries.iter().cloned());
            if sess.window_created {
                Some(sess.label.clone())
            } else {
                None
            }
        };
        if let Some(lbl) = label
            && let Some(win) = self.app.get_webview_window(&lbl)
        {
            for entry in entries {
                if let Ok(lit) = serde_json::to_string(&entry) {
                    let _ = win.eval(format!("try {{ document.cookie = {lit}; }} catch(_){{}}"));
                }
            }
        }
        Ok(())
    }

    fn launch(&self, session_id: &str, url: &str, timeout_ms: u64) -> Result<String, CoreError> {
        let parsed =
            Url::parse(url.trim()).map_err(|_| format!("URL trình duyệt không hợp lệ: {url}"))?;
        if !matches!(parsed.scheme(), "http" | "https") {
            return Err("VBook browser chỉ hỗ trợ URL HTTP/HTTPS.".into());
        }
        self.record_url(session_id, parsed.as_str());

        let was_created = {
            let guard = self.sessions.lock().map_err(|_| "Session lock poisoned")?;
            guard
                .get(session_id)
                .ok_or("Browser session không tồn tại.")?
                .window_created
        };

        let (win, load_signal, _) = self.ensure_window(session_id, parsed.clone())?;
        let start_gen = {
            let (lock, _) = &*load_signal;
            *lock.lock().map_err(|_| "Load lock poisoned")?
        };
        if was_created {
            win.navigate(parsed)
                .map_err(|err| format!("Điều hướng WebView2 thất bại: {err}"))?;
        }

        let wait_limit = Duration::from_millis(timeout_ms.clamp(200, MAX_WAIT_MS));
        let deadline = Instant::now() + wait_limit;
        let (lock, cvar) = &*load_signal;
        let mut load_gen = lock.lock().map_err(|_| "Load lock poisoned")?;
        let target_gen = if was_created { start_gen + 1 } else { 1 };
        while *load_gen < target_gen {
            let now = Instant::now();
            if now >= deadline {
                break;
            }
            let (next_gen, _) = cvar
                .wait_timeout(load_gen, deadline - now)
                .map_err(|_| "Load wait poisoned")?;
            load_gen = next_gen;
        }
        drop(load_gen);

        self.eval_and_collect(
            &win,
            "(document.documentElement ? document.documentElement.outerHTML : '')",
        )
    }

    fn load_html(
        &self,
        session_id: &str,
        base_url: &str,
        html: &str,
        timeout_ms: u64,
    ) -> Result<(), CoreError> {
        let target_url = if base_url.trim().is_empty() {
            Url::parse("about:blank").map_err(|err| err.to_string())?
        } else {
            Url::parse(base_url.trim()).map_err(|_| format!("baseUrl không hợp lệ: {base_url}"))?
        };
        if !base_url.trim().is_empty() {
            self.record_url(session_id, target_url.as_str());
        }
        let (win, _, _) = self.ensure_window(session_id, target_url)?;
        let html_lit = serde_json::to_string(html)?;
        let script = format!("document.open(); document.write({html_lit}); document.close();");
        win.eval(&script)
            .map_err(|err| format!("Không nạp được HTML vào WebView2: {err}"))?;
        let pause = timeout_ms.min(250);
        if pause > 0 {
            thread::sleep(Duration::from_millis(pause));
        }
        Ok(())
    }

    fn run_js(&self, session_id: &str, script: &str, wait_ms: u64) -> Result<String, CoreError> {
        let label = {
            let guard = self.sessions.lock().map_err(|_| "Session lock poisoned")?;
            let sess = guard
                .get(session_id)
                .ok_or("Browser session không tồn tại.")?;
            sess.label.clone()
        };
        let win = self
            .app
            .get_webview_window(&label)
            .ok_or("Browser session chưa mở trang nào.")?;
        win.eval(script)
            .map_err(|err| format!("Thực thi JS thất bại: {err}"))?;
        if wait_ms > 0 {
            thread::sleep(Duration::from_millis(wait_ms.min(MAX_WAIT_MS)));
        }
        self.eval_and_collect(
            &win,
            "(document.documentElement ? document.documentElement.outerHTML : '')",
        )
    }

    fn get_html(&self, session_id: &str, wait_ms: u64) -> Result<String, CoreError> {
        if wait_ms > 0 {
            thread::sleep(Duration::from_millis(wait_ms.min(MAX_WAIT_MS)));
        }
        let label = {
            let guard = self.sessions.lock().map_err(|_| "Session lock poisoned")?;
            let sess = guard
                .get(session_id)
                .ok_or("Browser session không tồn tại.")?;
            sess.label.clone()
        };
        let win = self
            .app
            .get_webview_window(&label)
            .ok_or("Browser session chưa mở trang nào.")?;
        self.eval_and_collect(
            &win,
            "(document.documentElement ? document.documentElement.outerHTML : '')",
        )
    }

    fn get_var(&self, session_id: &str, key: &str) -> Result<String, CoreError> {
        let label = {
            let guard = self.sessions.lock().map_err(|_| "Session lock poisoned")?;
            let sess = guard
                .get(session_id)
                .ok_or("Browser session không tồn tại.")?;
            sess.label.clone()
        };
        let win = self
            .app
            .get_webview_window(&label)
            .ok_or("Browser session chưa mở trang nào.")?;
        let key_lit = serde_json::to_string(key)?;
        self.eval_and_collect(&win, &format!("window[{key_lit}]"))
    }

    fn urls(&self, session_id: &str) -> Result<Vec<String>, CoreError> {
        let (label, nav_urls, created) = {
            let guard = self.sessions.lock().map_err(|_| "Session lock poisoned")?;
            let sess = guard
                .get(session_id)
                .ok_or("Browser session không tồn tại.")?;
            (
                sess.label.clone(),
                Arc::clone(&sess.nav_urls),
                sess.window_created,
            )
        };
        let mut out = nav_urls.lock().map(|list| list.clone()).unwrap_or_default();
        if created
            && let Some(win) = self.app.get_webview_window(&label)
            && let Ok(js_urls) =
                self.eval_and_collect(&win, "((window.__nsVbookUrls || []).join('\\n'))")
        {
            for line in js_urls.lines() {
                let u = line.trim();
                if !u.is_empty() && !out.iter().any(|existing| existing == u) {
                    out.push(u.to_owned());
                }
            }
        }
        Ok(out)
    }

    fn wait_url(
        &self,
        session_id: &str,
        patterns: &[String],
        timeout_ms: u64,
    ) -> Result<(), CoreError> {
        let deadline = Instant::now() + Duration::from_millis(timeout_ms.clamp(100, MAX_WAIT_MS));
        loop {
            let collected = self.urls(session_id)?;
            if url_matches_any_pattern(&collected, patterns) {
                return Ok(());
            }
            if Instant::now() >= deadline {
                return Err(format!("Hết thời gian chờ URL khớp {:?}", patterns).into());
            }
            thread::sleep(Duration::from_millis(120));
        }
    }

    fn close_session(&self, session_id: &str) -> Result<(), CoreError> {
        let removed = {
            let mut guard = self.sessions.lock().map_err(|_| "Session lock poisoned")?;
            guard.remove(session_id)
        };
        if let Some(sess) = removed {
            if let Some(win) = self.app.get_webview_window(&sess.label) {
                let _ = win.destroy();
            }
            cleanup_dir_quiet(&sess.data_dir);
        }
        Ok(())
    }
}

fn cleanup_dir_quiet(dir: &Path) {
    for _ in 0..3 {
        if !dir.exists() {
            return;
        }
        if fs::remove_dir_all(dir).is_ok() {
            return;
        }
        thread::sleep(Duration::from_millis(80));
    }
}

fn handle_callback_conn(
    mut stream: TcpStream,
    expected_token: &str,
    callbacks: &Arc<Mutex<HashMap<String, CallbackSlot>>>,
) -> Result<(), CoreError> {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
    let mut reader = BufReader::new(stream.try_clone()?);
    let mut request_line = String::new();
    if reader.read_line(&mut request_line)? == 0 {
        return Ok(());
    }
    let path = request_line.split_whitespace().nth(1).unwrap_or("");
    let mut content_len = 0usize;
    loop {
        let mut line = String::new();
        let n = reader.read_line(&mut line)?;
        if n == 0 || line == "\r\n" || line == "\n" {
            break;
        }
        if let Some((k, v)) = line.split_once(':')
            && k.trim().eq_ignore_ascii_case("content-length")
        {
            content_len = v.trim().parse::<usize>().unwrap_or(0);
        }
    }

    let mut body = vec![0u8; content_len.min(16 * 1024 * 1024)];
    if content_len > 0 {
        reader.read_exact(&mut body)?;
    }

    let rest = path.strip_prefix("/cb/").unwrap_or("");
    if let Some((tok, req_id)) = rest.split_once('/')
        && tok == expected_token
        && let Ok(guard) = callbacks.lock()
        && let Some(slot) = guard.get(req_id)
    {
        let text = String::from_utf8_lossy(&body).into_owned();
        let (lock, cvar) = &**slot;
        if let Ok(mut holder) = lock.lock() {
            *holder = Some(text);
            cvar.notify_all();
        }
    }

    let _ = stream.write_all(b"HTTP/1.1 204 No Content\r\nConnection: close\r\n\r\n");
    let _ = stream.flush();
    Ok(())
}

// Re-export minimal serde_json helper from novel_studio_core::vbook so desktop does not need direct dep.
mod serde_json {
    pub fn to_string(value: &str) -> Result<String, super::CoreError> {
        novel_studio_core::vbook::runner::encode_json_string(value)
    }
}
