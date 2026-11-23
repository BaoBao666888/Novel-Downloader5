#[cfg(windows)]
use std::path::Path;
use std::path::PathBuf;

#[cfg(windows)]
#[derive(Clone, Copy)]
pub enum Runtime {
    Java,
    WebView2,
}

#[cfg(windows)]
impl Runtime {
    fn folder(self) -> &'static str {
        match self {
            Self::Java => "java",
            Self::WebView2 => "webview2",
        }
    }

    fn binary(self) -> &'static str {
        match self {
            Self::Java => "bin/java.exe",
            Self::WebView2 => "msedgewebview2.exe",
        }
    }
}

#[cfg(windows)]
fn runtime_root() -> std::io::Result<PathBuf> {
    let exe = std::env::current_exe()?;
    let dir = exe.parent().ok_or(std::io::ErrorKind::NotFound)?;
    Ok(dir.join("runtime"))
}

pub fn local_java() -> Option<PathBuf> {
    #[cfg(windows)]
    {
        return local_runtime(Runtime::Java);
    }
    #[cfg(not(windows))]
    None
}

#[cfg(windows)]
fn local_runtime(runtime: Runtime) -> Option<PathBuf> {
    let path = runtime_root()
        .ok()?
        .join(runtime.folder())
        .join(runtime.binary());
    path.is_file().then_some(path)
}

#[cfg(windows)]
pub fn install(runtime: Runtime) -> Result<(), String> {
    use novel_studio_core::vbook::package::encode_base64;
    use std::os::windows::process::CommandExt;
    use std::path::{Component, Prefix};

    if local_runtime(runtime).is_some() {
        return Ok(());
    }
    let root = runtime_root().map_err(|err| format!("RUNTIME_DIR ({err})"))?;
    let network_path = matches!(
        root.components().next(),
        Some(Component::Prefix(prefix))
            if matches!(prefix.kind(), Prefix::UNC(..) | Prefix::VerbatimUNC(..))
    );
    if matches!(runtime, Runtime::WebView2) && network_path {
        return Err("WEBVIEW_LOCAL_DISK".into());
    }
    std::fs::create_dir_all(&root).map_err(|err| format!("RUNTIME_WRITE ({err})"))?;
    let stage = tempfile::Builder::new()
        .prefix(".novel-studio-")
        .tempdir_in(&root)
        .map_err(|err| format!("RUNTIME_STAGE ({err})"))?;
    let script = format!(
        "{}\ntry {{ Install-NovelStudioRuntime $env:NOVEL_STUDIO_RUNTIME_KIND $env:NOVEL_STUDIO_RUNTIME_ROOT $env:NOVEL_STUDIO_RUNTIME_STAGE; exit 0 }} catch {{ [Console]::Error.WriteLine($_.Exception.Message); exit 1 }}",
        include_str!("windows_runtime.ps1")
    );
    let encoded = encode_base64(
        &script
            .encode_utf16()
            .flat_map(u16::to_le_bytes)
            .collect::<Vec<_>>(),
    );
    let system_root = std::env::var_os("SystemRoot").ok_or("RUNTIME_SYSTEM_ROOT")?;
    let powershell = Path::new(&system_root).join("System32/WindowsPowerShell/v1.0/powershell.exe");
    let output = std::process::Command::new(powershell)
        .args(["-NoProfile", "-NonInteractive", "-EncodedCommand", &encoded])
        .env("NOVEL_STUDIO_RUNTIME_KIND", runtime.folder())
        .env("NOVEL_STUDIO_RUNTIME_ROOT", &root)
        .env("NOVEL_STUDIO_RUNTIME_STAGE", stage.path())
        .creation_flags(0x0800_0000)
        .output()
        .map_err(|err| format!("RUNTIME_DOWNLOAD ({err})"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "RUNTIME_DOWNLOAD ({})",
            stderr.trim().chars().take(240).collect::<String>()
        ));
    }
    if local_runtime(runtime).is_none() {
        return Err("RUNTIME_LAYOUT".into());
    }
    Ok(())
}

#[cfg(windows)]
pub fn prepare_webview2() -> bool {
    use std::ptr::null_mut;
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        IDYES, MB_DEFBUTTON2, MB_ICONERROR, MB_ICONQUESTION, MB_OK, MB_YESNO, MessageBoxW,
    };

    if tauri::webview_version().is_ok() {
        return true;
    }
    let message_box = |message: &str, buttons| {
        let message: Vec<_> = message.encode_utf16().chain([0]).collect();
        let title: Vec<_> = "Novel Studio".encode_utf16().chain([0]).collect();
        // Both strings are NUL-terminated and live until the Win32 call returns.
        unsafe { MessageBoxW(null_mut(), message.as_ptr(), title.as_ptr(), buttons) }
    };
    if local_runtime(Runtime::WebView2).is_none() {
        let approved = message_box(
            "Novel Studio cần WebView2 để mở. Tải WebView2 từ Microsoft vào thư mục ứng dụng? Có thể mất vài phút.",
            MB_YESNO | MB_ICONQUESTION | MB_DEFBUTTON2,
        ) == IDYES;
        if !approved {
            return false;
        }
        if let Err(err) = install(Runtime::WebView2) {
            message_box(
                &format!("Không tải được WebView2. Hãy mở lại ứng dụng để thử lại.\n\n{err}"),
                MB_OK | MB_ICONERROR,
            );
            return false;
        }
    }
    let Some(exe) = local_runtime(Runtime::WebView2) else {
        return false;
    };
    let Some(dir) = exe.parent() else {
        return false;
    };
    // This runs at the start of main, before Tauri creates any windows.
    unsafe { std::env::set_var("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER", dir) };
    true
}
