use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::CoreError;
use crate::text_tools::{sha256, write_reviewed};

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Position {
    Start,
    End,
    Line(usize),
}

#[derive(Deserialize)]
pub struct Options {
    text: String,
    position: Position,
}

pub struct Plan {
    folder: PathBuf,
    options: Options,
    files: BTreeMap<String, [u8; 32]>,
}

#[derive(Serialize)]
pub struct Row {
    pub name: String,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct Sample {
    before: String,
    credit: String,
    after: String,
}

#[derive(Default, Serialize)]
pub struct Report {
    pub written: Vec<String>,
    pub error: Option<String>,
}

struct Backup {
    name: String,
    file: PathBuf,
    saved: PathBuf,
    before: [u8; 32],
    after: [u8; 32],
}

#[derive(Default)]
pub struct Undo(Vec<Backup>);

fn checked_file(path: &Path) -> Result<Vec<u8>, CoreError> {
    let metadata = fs::symlink_metadata(path)?;
    if !metadata.is_file() || metadata.permissions().readonly() {
        return Err("Tệp phải là TXT thường và có thể ghi.".into());
    }
    Ok(fs::read(path)?)
}

fn breaks(body: &str) -> impl Iterator<Item = (usize, usize)> + '_ {
    body.match_indices(['\r', '\n'])
        .filter_map(|(start, line_break)| {
            let bytes = body.as_bytes();
            match line_break {
                "\n" if start > 0 && bytes[start - 1] == b'\r' => None,
                "\r" if bytes.get(start + 1) == Some(&b'\n') => Some((start, start + 2)),
                _ => Some((start, start + 1)),
            }
        })
}

fn split<'a>(raw: &'a [u8], options: &Options) -> Result<(&'a str, String, &'a str), CoreError> {
    let body = std::str::from_utf8(raw).map_err(|_| "Tệp không phải UTF-8.")?;
    let bom = if body.starts_with('\u{feff}') { 3 } else { 0 };
    let text = &body[bom..];
    let pos = match options.position {
        Position::Start | Position::Line(1) => 0,
        Position::End => text.len(),
        Position::Line(line) => breaks(text)
            .nth(line - 2)
            .map_or(text.len(), |(_, end)| end),
    };
    let (before, after) = body.split_at(bom + pos);
    let next_break = breaks(&text[pos..])
        .next()
        .map(|(a, b)| &text[pos + a..pos + b]);
    let eol = next_break
        .or_else(|| breaks(&text[..pos]).last().map(|(a, b)| &text[a..b]))
        .unwrap_or("\n");
    let mut insertion = String::new();
    if pos == text.len() && pos > 0 && !text.ends_with(['\n', '\r']) {
        insertion.push_str(eol);
    }
    insertion.push_str(
        &options
            .text
            .replace("\r\n", "\n")
            .replace('\r', "\n")
            .replace('\n', eol),
    );
    insertion.push_str(eol);
    Ok((before, insertion, after))
}

pub fn preview(folder: PathBuf, mut options: Options) -> Result<(Vec<Row>, Plan), CoreError> {
    options.text = options.text.trim().to_owned();
    if options.text.is_empty() || options.text.contains('\0') {
        return Err("Hãy nhập nội dung credit.".into());
    }
    if matches!(options.position, Position::Line(0)) {
        return Err("Số dòng phải từ 1 trở lên.".into());
    }
    let mut files = BTreeMap::new();
    let mut rows = Vec::new();
    for entry in fs::read_dir(&folder)? {
        let entry = entry?;
        let path = entry.path();
        if !entry.file_type()?.is_file()
            || !path
                .extension()
                .is_some_and(|ext| ext.eq_ignore_ascii_case("txt"))
        {
            continue;
        }
        let Ok(name) = entry.file_name().into_string() else {
            continue;
        };
        let check = checked_file(&path).and_then(|bytes| {
            std::str::from_utf8(&bytes).map_err(|_| "Tệp không phải UTF-8.")?;
            files.insert(name.clone(), sha256(&bytes));
            Ok(())
        });
        rows.push(Row {
            name,
            error: check.err().map(|err| err.to_string()),
        });
    }
    rows.sort_by(|a, b| {
        a.name
            .to_lowercase()
            .cmp(&b.name.to_lowercase())
            .then_with(|| a.name.cmp(&b.name))
    });
    Ok((
        rows,
        Plan {
            folder,
            options,
            files,
        },
    ))
}

fn verify(path: &Path, expected: [u8; 32]) -> Result<Vec<u8>, CoreError> {
    let bytes = checked_file(path)?;
    if sha256(&bytes) != expected {
        return Err("Nội dung đã đổi từ lần duyệt cuối.".into());
    }
    Ok(bytes)
}

fn normalize(text: &str) -> String {
    text.replace("\r\n", "\n").replace('\r', "\n")
}

impl Plan {
    pub fn sample(&self, name: &str) -> Result<Sample, CoreError> {
        let expected = self
            .files
            .get(name)
            .ok_or("Tệp này không nằm trong bản xem trước.")?;
        let bytes = verify(&self.folder.join(name), *expected)?;
        let (before, credit, after) = split(&bytes, &self.options)?;
        let before = before.trim_start_matches('\u{feff}');
        let start = before.char_indices().rev().nth(519).map_or(0, |(i, _)| i);
        let end = after
            .char_indices()
            .nth(520)
            .map_or(after.len(), |(i, _)| i);
        Ok(Sample {
            before: normalize(&before[start..]),
            credit: normalize(&credit),
            after: normalize(&after[..end]),
        })
    }

    pub fn apply(&self, names: Vec<String>) -> Result<(Report, Undo), CoreError> {
        let selected = names.into_iter().collect::<BTreeSet<_>>();
        if selected.is_empty() || selected.iter().any(|name| !self.files.contains_key(name)) {
            return Err("Chỉ có thể lưu các tệp hợp lệ trong bản xem trước.".into());
        }
        for name in &selected {
            verify(&self.folder.join(name), self.files[name])
                .map_err(|err| format!("{name}: {err}"))?;
        }
        let mut report = Report::default();
        let mut undo = Undo::default();
        for name in selected {
            let file = self.folder.join(&name);
            let before = self.files[&name];
            let result = (|| -> Result<Backup, CoreError> {
                let bytes = verify(&file, before)?;
                let (prefix, insert, tail) = split(&bytes, &self.options)?;
                let revised = [prefix.as_bytes(), insert.as_bytes(), tail.as_bytes()].concat();
                let saved = write_reviewed(&file, before, &revised)?;
                Ok(Backup {
                    name: name.clone(),
                    file,
                    saved,
                    before,
                    after: sha256(&revised),
                })
            })();
            match result {
                Ok(backup) => {
                    report.written.push(name);
                    undo.0.push(backup);
                }
                Err(err) => {
                    report.error = Some(format!("{name}: {err}"));
                    break;
                }
            }
        }
        Ok((report, undo))
    }
}

impl Undo {
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    pub fn apply(&mut self) -> Result<Report, CoreError> {
        for backup in &self.0 {
            verify(&backup.file, backup.after)
                .and_then(|_| verify(&backup.saved, backup.before))
                .map_err(|err| format!("{}: {err}", backup.name))?;
        }
        let mut report = Report::default();
        for backup in &self.0 {
            match verify(&backup.saved, backup.before)
                .and_then(|bytes| write_reviewed(&backup.file, backup.after, &bytes))
            {
                Ok(_) => report.written.push(backup.name.clone()),
                Err(err) => {
                    report.error = Some(format!("{}: {err}", backup.name));
                    break;
                }
            }
        }
        self.0.drain(..report.written.len());
        Ok(report)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn inserts_after_bom_and_keeps_original_line_endings() {
        let body = "\u{feff}A\r\nB\nC\rD";
        for (position, expected) in [
            (Position::Start, "\u{feff}Đề\r\nTựa\r\nA\r\nB\nC\rD"),
            (Position::Line(2), "\u{feff}A\r\nĐề\nTựa\nB\nC\rD"),
            (Position::End, "\u{feff}A\r\nB\nC\rD\rĐề\rTựa\r"),
            (Position::Line(99), "\u{feff}A\r\nB\nC\rD\rĐề\rTựa\r"),
        ] {
            let (before, inserted, after) = split(
                body.as_bytes(),
                &Options {
                    text: "Đề\nTựa".into(),
                    position,
                },
            )
            .unwrap();
            assert_eq!(format!("{before}{inserted}{after}"), expected);
        }
    }

    #[test]
    fn stale_batch_blocks_every_write_and_undo_restores_original_bytes() {
        let dir = tempfile::tempdir().unwrap();
        let a = dir.path().join("a.txt");
        let b = dir.path().join("b.TXT");
        fs::write(&a, b"A").unwrap();
        fs::write(&b, b"B\r\n").unwrap();
        fs::write(dir.path().join("invalid.txt"), b"\xff").unwrap();
        let (rows, plan) = preview(
            dir.path().to_path_buf(),
            Options {
                text: "Credit".into(),
                position: Position::End,
            },
        )
        .unwrap();
        assert_eq!(rows.iter().filter(|r| r.error.is_none()).count(), 2);
        fs::write(&b, b"External").unwrap();
        assert!(plan.apply(vec!["a.txt".into(), "b.TXT".into()]).is_err());
        assert_eq!(fs::read(&a).unwrap(), b"A");
        fs::write(&b, b"B\r\n").unwrap();
        let (result, mut undo) = plan.apply(vec!["a.txt".into(), "b.TXT".into()]).unwrap();
        assert!(result.error.is_none());
        assert_eq!(result.written.len(), 2);
        assert_eq!(fs::read(&a).unwrap(), b"A\nCredit\n");
        assert_eq!(fs::read(&b).unwrap(), b"B\r\nCredit\r\n");
        assert_eq!(undo.apply().unwrap().written.len(), 2);
        assert!(undo.is_empty());
        assert_eq!(fs::read(&a).unwrap(), b"A");
        assert_eq!(fs::read(&b).unwrap(), b"B\r\n");
    }
}
