use std::env;
use std::ffi::OsString;
use std::io::{self, Read, Write};
use std::process::ExitCode;

use novel_studio_core::{CoreError, first_line, rename, rename_apply, split};
use serde::Serialize;
use std::path::Path;

fn run_split(args: &[OsString]) -> Result<ExitCode, CoreError> {
    if !(2..=3).contains(&args.len()) {
        return Err("Cách dùng: novel-studio-core FILE REGEX [after|before]".into());
    }

    let preview = split::preview_file(
        Path::new(&args[0]),
        &args[1],
        args.get(2).map(OsString::as_os_str),
    )?;
    write_json(&preview)?;
    Ok(if preview.error.is_some() {
        ExitCode::FAILURE
    } else {
        ExitCode::SUCCESS
    })
}

fn read_json<T: serde::de::DeserializeOwned>() -> Result<T, CoreError> {
    let mut input = Vec::new();
    io::stdin().lock().read_to_end(&mut input)?;
    let json = input.strip_prefix(b"\xef\xbb\xbf").unwrap_or(&input);
    Ok(serde_json::from_slice(json)?)
}

fn write_json<T: Serialize>(data: &T) -> Result<(), CoreError> {
    let mut stdout = io::stdout().lock();
    serde_json::to_writer(&mut stdout, data)?;
    writeln!(stdout)?;
    Ok(())
}

fn run(args: &[OsString]) -> Result<ExitCode, CoreError> {
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
        [command] if command == "first-line-preview" => {
            write_json(&first_line::preview(read_json()?)?)?;
            Ok(ExitCode::SUCCESS)
        }
        [command, confirm] if command == "first-line-apply" && confirm == "--confirm" => {
            let output = first_line::apply(read_json()?)?;
            write_json(&output)?;
            Ok(if output.failure.is_some() {
                ExitCode::FAILURE
            } else {
                ExitCode::SUCCESS
            })
        }
        [command, ..] if command == "first-line-apply" => {
            Err("Cách dùng: novel-studio-core first-line-apply --confirm".into())
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
