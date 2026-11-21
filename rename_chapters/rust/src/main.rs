use std::env;
use std::ffi::OsString;
use std::io::{self, Read, Write};
use std::process::ExitCode;

use novel_studio_core::split::{self, PreviewChunk, SplitError};
use serde::{Deserialize, Serialize};

mod python;
mod rename;
mod rename_apply;

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

    write_json(&preview)?;
    Ok(exit_code)
}

fn read_json<T: serde::de::DeserializeOwned>() -> Result<T, python::Error> {
    let mut input = Vec::new();
    io::stdin().lock().read_to_end(&mut input)?;
    let json = input.strip_prefix(b"\xef\xbb\xbf").unwrap_or(&input);
    Ok(serde_json::from_slice(json)?)
}

fn write_json<T: Serialize>(data: &T) -> Result<(), python::Error> {
    let mut stdout = io::stdout().lock();
    serde_json::to_writer(&mut stdout, data)?;
    writeln!(stdout)?;
    Ok(())
}

fn run(args: &[OsString]) -> Result<ExitCode, python::Error> {
    match args {
        [command] if command == "rename-preview" => {
            write_json(&rename::preview(read_json()?)?)?;
            Ok(ExitCode::SUCCESS)
        }
        [command, confirm] if command == "rename-apply" && confirm == "--confirm" => {
            let output = rename_apply::apply(read_json()?)?;
            write_json(&output)?;
            Ok(if output.failure.is_some() {
                ExitCode::FAILURE
            } else {
                ExitCode::SUCCESS
            })
        }
        [command, ..] if command == "rename-apply" => {
            Err("Cách dùng: novel-studio-core rename-apply --confirm".into())
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
