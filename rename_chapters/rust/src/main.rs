use std::env;
use std::ffi::OsString;
use std::io::{self, Read, Write};
use std::process::ExitCode;

use novel_studio_core::split::{self, PreviewChunk, SplitError};
use serde::{Deserialize, Serialize};

mod python;
mod rename;

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

fn run_split(args: &[OsString]) -> Result<ExitCode, Box<dyn std::error::Error>> {
    if !(2..=3).contains(&args.len()) {
        return Err("Cách dùng: novel-studio-core FILE REGEX [after|before]".into());
    }

    let bytes = python::run(include_str!("split_source.py"), args, None)?;

    let result = match serde_json::from_slice(&bytes)? {
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

fn run(args: &[OsString]) -> Result<ExitCode, python::Error> {
    match args {
        [command] if command == "rename-preview" => {
            let mut input = Vec::new();
            io::stdin().lock().read_to_end(&mut input)?;
            let json = input.strip_prefix(b"\xef\xbb\xbf").unwrap_or(&input);
            let request = serde_json::from_slice(json)?;
            let rows = rename::preview(request)?;
            let mut stdout = io::stdout().lock();
            serde_json::to_writer(&mut stdout, &rows)?;
            writeln!(stdout)?;
            Ok(ExitCode::SUCCESS)
        }
        _ => run_split(args),
    }
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
