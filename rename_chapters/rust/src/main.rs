use std::env;
use std::ffi::{OsStr, OsString};
use std::io::{self, Write};
use std::process::{Command, ExitCode};

use novel_studio_core::split::{self, PreviewChunk, SplitError};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
#[serde(tag = "status", rename_all = "snake_case")]
enum SplitSource {
    Matched { content: String, points: Vec<usize> },
    Error { message: String },
}

#[derive(Serialize)]
struct PreviewOutput {
    chunks: Vec<PreviewChunk>,
    error: Option<String>,
}

fn run(args: &[OsString]) -> Result<ExitCode, Box<dyn std::error::Error>> {
    if !(2..=3).contains(&args.len()) {
        return Err("Cách dùng: novel-studio-core FILE REGEX [after|before]".into());
    }

    let python = env::var_os("NOVEL_STUDIO_PYTHON").unwrap_or_else(|| {
        if cfg!(windows) {
            OsStr::new("python").to_owned()
        } else {
            OsStr::new("python3").to_owned()
        }
    });
    let output = Command::new(python)
        .args(["-I", "-B", "-c", include_str!("split_source.py")])
        .args(args)
        .output()
        .map_err(|err| format!("Không thể chạy Python cho regex: {err}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python thoát với {}: {}", output.status, stderr.trim()).into());
    }

    let result = match serde_json::from_slice(&output.stdout)? {
        SplitSource::Matched { content, points } => match split::preview(&content, &points) {
            Ok(chunks) => Ok(chunks),
            Err(SplitError::NoMatches) => Err(split::NO_MATCHES.to_owned()),
            Err(SplitError::InvalidOffsets) => return Err("Vị trí chia không hợp lệ".into()),
        },
        SplitSource::Error { message } => Err(message),
    };
    let (preview, exit_code) = match result {
        Ok(chunks) => (
            PreviewOutput {
                chunks,
                error: None,
            },
            ExitCode::SUCCESS,
        ),
        Err(error) => (
            PreviewOutput {
                chunks: Vec::new(),
                error: Some(error),
            },
            ExitCode::FAILURE,
        ),
    };

    let mut stdout = io::stdout().lock();
    serde_json::to_writer(&mut stdout, &preview)?;
    writeln!(stdout)?;
    Ok(exit_code)
}

fn main() -> ExitCode {
    let args: Vec<_> = env::args_os().skip(1).collect();
    match run(&args) {
        Ok(exit_code) => exit_code,
        Err(error) => {
            eprintln!("{error}");
            ExitCode::FAILURE
        }
    }
}
