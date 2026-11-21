use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::python::{self, Error};

const LEGACY: &str = concat!(
    include_str!("../../app/core/renamer.py"),
    "\n",
    include_str!("rename_source.py")
);

#[derive(Deserialize)]
pub struct Request {
    folder: String,
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
    folder: &'a str,
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

#[derive(Serialize)]
pub struct Row {
    #[serde(flatten)]
    analysis: Analysis,
    proposed_name: Option<String>,
    status: Status,
    issues: Vec<Issue>,
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

pub fn preview(request: Request) -> Result<Vec<Row>, Error> {
    let mut analyses: Vec<Analysis> = python::json(
        LEGACY,
        ScanRequest {
            scan: Scan {
                folder: &request.folder,
                filename_regexes: &request.filename_regexes,
                content_regexes: &request.content_regexes,
            },
        },
    )?;
    analyses.sort_by(|left, right| {
        compare_numbers(
            left.sort_number(&request.sort_by),
            right.sort_number(&request.sort_by),
        )
    });

    let proposed: Vec<Option<String>> = python::json(
        LEGACY,
        Format {
            rows: &analyses,
            strategy: &request.strategy,
            name_format: &request.name_format,
            custom_titles: request.custom_titles.as_deref(),
        },
    )?;
    if proposed.len() != analyses.len() {
        return Err("Số tên gợi ý không khớp với số file đã phân tích".into());
    }

    let mut rows: Vec<_> = analyses
        .into_iter()
        .zip(proposed)
        .map(|(analysis, proposed_name)| {
            let status = match proposed_name.as_deref() {
                _ if request.excluded.contains(&analysis.filename) => Status::Excluded,
                None => Status::MissingNumber,
                Some(name) if name == analysis.filename => Status::Unchanged,
                Some(_) => Status::Proposed,
            };
            Row {
                analysis,
                proposed_name,
                status,
                issues: Vec::new(),
            }
        })
        .collect();
    inspect_destinations(Path::new(&request.folder), &mut rows);
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

pub fn destination_key(name: &str) -> String {
    if cfg!(windows) {
        name.to_lowercase()
    } else {
        name.to_owned()
    }
}

pub fn valid_target(name: &str) -> bool {
    if matches!(name, "" | "." | "..") || name.contains(['\0', '/', '\\']) {
        return false;
    }
    if cfg!(windows) {
        let stem = name
            .split('.')
            .next()
            .unwrap_or_default()
            .trim_end_matches(' ');
        let reserved = stem.to_ascii_uppercase();
        let serial_device = reserved
            .strip_prefix("COM")
            .or_else(|| reserved.strip_prefix("LPT"));
        return !name.contains([':', '"', '*', '?', '<', '>', '|'])
            && !name.ends_with(['.', ' '])
            && !name.chars().any(|ch| ch < ' ')
            && !matches!(
                reserved.as_str(),
                "CON" | "PRN" | "AUX" | "NUL" | "CONIN$" | "CONOUT$"
            )
            && !matches!(
                serial_device,
                Some("1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "¹" | "²" | "³")
            );
    }
    true
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
