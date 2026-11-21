use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};

use crate::first_line::valid_replacement;
use crate::names::{destination_key, valid_target};
use serde::{Deserialize, Serialize};

use crate::{CoreError, python};

const LEGACY: &str = concat!(
    include_str!("../../app/core/renamer.py"),
    "\n",
    include_str!("rename_source.py")
);

#[derive(Deserialize)]
pub struct Request {
    folder: PathBuf,
    #[serde(flatten)]
    options: Options,
}

#[derive(Deserialize)]
pub struct Options {
    #[serde(default)]
    filename_regexes: Vec<String>,
    #[serde(default)]
    content_regexes: Vec<String>,
    #[serde(default = "default_sort")]
    sort_by: String,
    #[serde(default = "default_strategy")]
    strategy: String,
    #[serde(default = "default_format")]
    name_format: String,
    custom_titles: Option<Vec<String>>,
    #[serde(default)]
    include_first_line: bool,
    #[serde(default)]
    excluded: HashSet<String>,
}

fn default_sort() -> String {
    "content".to_owned()
}

fn default_strategy() -> String {
    "content_first".to_owned()
}

fn default_format() -> String {
    "第{num}章 {title}.txt".to_owned()
}

#[derive(Serialize)]
struct Scan<'a> {
    folder: &'a Path,
    regular_files_only: bool,
    filename_regexes: &'a [String],
    content_regexes: &'a [String],
}

#[derive(Serialize)]
struct ScanRequest<'a> {
    scan: Scan<'a>,
}

#[derive(Serialize)]
struct Format<'a> {
    rows: &'a [Analysis],
    strategy: &'a str,
    name_format: &'a str,
    custom_titles: Option<&'a [String]>,
    include_first_line: bool,
}

#[derive(Deserialize, Serialize)]
struct Match {
    num: Option<String>,
    title: Option<String>,
    source: String,
}

#[derive(Deserialize, Serialize)]
struct Analysis {
    filename: String,
    from_filename: Match,
    from_content: Match,
    error: Option<String>,
}

impl Analysis {
    fn sort_number(&self, sort_by: &str) -> Option<&str> {
        let (first, second) = if sort_by == "content" {
            (&self.from_content, &self.from_filename)
        } else {
            (&self.from_filename, &self.from_content)
        };
        first.num.as_deref().or(second.num.as_deref())
    }
}

#[derive(Deserialize)]
struct FormattedName {
    proposed_name: Option<String>,
    first_line: Option<String>,
}

#[derive(Serialize)]
pub struct Row {
    #[serde(flatten)]
    analysis: Analysis,
    proposed_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    first_line: Option<String>,
    status: Status,
    issues: Vec<Issue>,
}

impl Row {
    pub fn filename(&self) -> &str {
        &self.analysis.filename
    }

    pub fn rename_pair(&self) -> Option<(&str, &str)> {
        if self.status != Status::Proposed || !self.issues.is_empty() {
            return None;
        }
        Some((&self.analysis.filename, self.proposed_name.as_deref()?))
    }
}

#[derive(Serialize, PartialEq)]
#[serde(rename_all = "snake_case")]
enum Status {
    Excluded,
    MissingNumber,
    Unchanged,
    Proposed,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
enum Issue {
    InvalidTarget,
    DuplicateTarget,
    TargetExists,
    TargetCheckFailed,
}

pub fn preview(request: Request) -> Result<Vec<Row>, CoreError> {
    build_preview(&request.folder, request.options, false, None)
}

/// Preview regular TXT files in a directory selected by the desktop user.
pub fn preview_folder(
    folder: &Path,
    options: Options,
    interpreter: Option<&Path>,
) -> Result<Vec<Row>, CoreError> {
    build_preview(folder, options, true, interpreter)
}

fn build_preview(
    folder: &Path,
    options: Options,
    regular_files_only: bool,
    interpreter: Option<&Path>,
) -> Result<Vec<Row>, CoreError> {
    let mut analyses: Vec<Analysis> = python::json(
        LEGACY,
        ScanRequest {
            scan: Scan {
                folder,
                regular_files_only,
                filename_regexes: &options.filename_regexes,
                content_regexes: &options.content_regexes,
            },
        },
        interpreter,
    )?;
    analyses.sort_by(|left, right| {
        compare_numbers(
            left.sort_number(&options.sort_by),
            right.sort_number(&options.sort_by),
        )
    });

    let proposed: Vec<FormattedName> = python::json(
        LEGACY,
        Format {
            rows: &analyses,
            strategy: &options.strategy,
            name_format: &options.name_format,
            custom_titles: options.custom_titles.as_deref(),
            include_first_line: options.include_first_line,
        },
        interpreter,
    )?;
    if proposed.len() != analyses.len() {
        return Err("Số tên gợi ý không khớp với số file đã phân tích".into());
    }

    let mut rows: Vec<_> = analyses
        .into_iter()
        .zip(proposed)
        .map(
            |(
                analysis,
                FormattedName {
                    proposed_name,
                    first_line,
                },
            )| {
                let status = match proposed_name.as_deref() {
                    _ if options.excluded.contains(&analysis.filename) => Status::Excluded,
                    None => Status::MissingNumber,
                    Some(name) if name == analysis.filename => Status::Unchanged,
                    Some(_) => Status::Proposed,
                };
                Row {
                    analysis,
                    proposed_name,
                    first_line: first_line
                        .filter(|line| status != Status::Excluded && valid_replacement(line)),
                    status,
                    issues: Vec::new(),
                }
            },
        )
        .collect();
    inspect_destinations(folder, &mut rows);
    Ok(rows)
}

fn compare_numbers(left: Option<&str>, right: Option<&str>) -> Ordering {
    match (left, right) {
        (Some(left), Some(right)) => {
            // The adapter sends canonical Python int strings, which may exceed i128.
            let left_negative = left.starts_with('-');
            let right_negative = right.starts_with('-');
            let magnitude = left.len().cmp(&right.len()).then_with(|| left.cmp(right));
            match (left_negative, right_negative) {
                (true, true) => magnitude.reverse(),
                (false, false) => magnitude,
                _ => right_negative.cmp(&left_negative),
            }
        }
        _ => right.is_some().cmp(&left.is_some()),
    }
}

fn inspect_destinations(folder: &Path, rows: &mut [Row]) {
    let mut counts = HashMap::new();
    for row in rows.iter().filter(|row| row.status == Status::Proposed) {
        if let Some(name) = row
            .proposed_name
            .as_deref()
            .filter(|name| valid_target(name))
        {
            *counts.entry(destination_key(name)).or_insert(0) += 1;
        }
    }

    for row in rows.iter_mut().filter(|row| row.status == Status::Proposed) {
        let Some(name) = row.proposed_name.as_deref() else {
            continue;
        };
        if !valid_target(name) {
            row.issues.push(Issue::InvalidTarget);
            continue;
        }
        if counts[&destination_key(name)] > 1 {
            row.issues.push(Issue::DuplicateTarget);
        }
        match fs::symlink_metadata(folder.join(name)) {
            Ok(_) => row.issues.push(Issue::TargetExists),
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => {}
            Err(_) => row.issues.push(Issue::TargetCheckFailed),
        }
    }
}
