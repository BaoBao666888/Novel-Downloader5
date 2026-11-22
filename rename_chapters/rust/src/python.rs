use std::env;
use std::ffi::OsString;
use std::io::Write;
use std::path::Path;
use std::process::{Command, Stdio};

use serde::{Serialize, de::DeserializeOwned};

use crate::CoreError;

pub fn json<Request: Serialize, Response: DeserializeOwned>(
    script: &str,
    request: Request,
    interpreter: Option<&Path>,
) -> Result<Response, CoreError> {
    let input = serde_json::to_vec(&request)?;
    let bytes = run(script, &[], Some(&input), interpreter)?;
    Ok(serde_json::from_slice(&bytes)?)
}

pub fn run(
    script: &str,
    args: &[OsString],
    input: Option<&[u8]>,
    interpreter: Option<&Path>,
) -> Result<Vec<u8>, CoreError> {
    let python = interpreter
        .map(|path| path.as_os_str().to_owned())
        .or_else(|| env::var_os("NOVEL_STUDIO_PYTHON"))
        .unwrap_or_else(|| if cfg!(windows) { "python" } else { "python3" }.into());
    let mut command = Command::new(python);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        use windows_sys::Win32::System::Threading::CREATE_NO_WINDOW;

        command.creation_flags(CREATE_NO_WINDOW);
    }
    // The adapter protocol is UTF-8 even when Windows redirects pipes using a legacy code page.
    command
        .args(["-I", "-B", "-X", "utf8", "-c", script])
        .args(args);

    let output = match input {
        Some(input) => {
            let mut child = command
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .map_err(|err| format!("Không thể chạy Python: {err}"))?;
            let written = child.stdin.take().expect("piped stdin").write_all(input);
            let output = child.wait_with_output()?;
            if output.status.success() {
                written?;
            }
            output
        }
        None => command
            .output()
            .map_err(|err| format!("Không thể chạy Python cho regex: {err}"))?,
    };
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python thoát với {}: {}", output.status, stderr.trim()).into());
    }
    Ok(output.stdout)
}

#[cfg(test)]
mod tests {
    #[test]
    fn json_uses_utf8_for_both_pipes() {
        let text = "Chương mới 第1章 📝";
        let output: String = super::json(
            "import json, sys; print(json.dumps(json.load(sys.stdin), ensure_ascii=False))",
            text,
            None,
        )
        .unwrap();
        assert_eq!(output, text);
    }
}
