use std::env;
use std::ffi::OsString;
use std::io::Write;
use std::process::{Command, Stdio};

use serde::{Serialize, de::DeserializeOwned};

use crate::CoreError;

pub fn json<Request: Serialize, Response: DeserializeOwned>(
    script: &str,
    request: Request,
) -> Result<Response, CoreError> {
    let input = serde_json::to_vec(&request)?;
    let bytes = run(script, &[], Some(&input))?;
    Ok(serde_json::from_slice(&bytes)?)
}

pub fn run(script: &str, args: &[OsString], input: Option<&[u8]>) -> Result<Vec<u8>, CoreError> {
    let python = env::var_os("NOVEL_STUDIO_PYTHON")
        .unwrap_or_else(|| if cfg!(windows) { "python" } else { "python3" }.into());
    let mut command = Command::new(python);
    command.args(["-I", "-B", "-c", script]).args(args);

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
