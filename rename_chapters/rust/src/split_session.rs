use std::collections::HashSet;
use std::ffi::OsStr;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::CoreError;
use crate::names;
use crate::split::{SplitError, match_file};

const MAX_BOUNDARIES: usize = 10_000;
const MAX_HISTORY: usize = 20;
const PREVIEW_CHARS: usize = 90;
const CONTEXT_BEFORE_CHARS: usize = 200;
const CONTEXT_AFTER_CHARS: usize = 320;
const LONG_CHAPTER_CHARS: usize = 50_000;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum PrefaceMode {
    #[default]
    Separate,
    Merge,
    Remove,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Boundary {
    pub start_byte: usize,
    pub start_char: usize,
    pub title: String,
    pub is_preface: bool,
    pub manual: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct PartSummary {
    pub part_index: usize,
    pub boundary_index: usize,
    pub start_byte: usize,
    pub start_char: usize,
    pub title: String,
    pub filename: Option<String>,
    pub preview: String,
    pub char_count: usize,
    pub is_preface: bool,
    pub is_empty: bool,
    pub manual: bool,
    pub warnings: Vec<String>,
    pub context_before: String,
    pub context_after: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct SearchHit {
    pub line_start_byte: usize,
    pub line_start_char: usize,
    pub line_number: usize,
    pub snippet: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct SplitWriteFailure {
    pub filename: String,
    pub error: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct SplitOutcome {
    pub output_dir: String,
    pub written: Vec<String>,
    pub skipped_empty: usize,
    pub failure: Option<SplitWriteFailure>,
}

pub struct SplitSession {
    source_path: PathBuf,
    source_sha256: [u8; 32],
    content: String,
    boundaries: Vec<Boundary>,
    past: Vec<Vec<Boundary>>,
    future: Vec<Vec<Boundary>>,
}

/// Mirror `TextOperations.render_split_filename` and fallback rules from Python legacy.
pub fn render_split_filename(template: &str, num: usize) -> String {
    let rendered = if template.is_empty() {
        format!("part_{num}.txt")
    } else {
        replace_num_tokens(template, num)
    };
    let candidate = if rendered.contains('{') || rendered.contains('}') {
        format!("part_{num}.txt")
    } else {
        rendered
    };
    let sanitized = sanitize_split_filename(&candidate);
    if sanitized.is_empty() {
        format!("part_{num}.txt")
    } else {
        sanitized
    }
}

fn replace_num_tokens(template: &str, num: usize) -> String {
    let mut out = String::with_capacity(template.len() + 8);
    let bytes = template.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'{'
            && let Some(rel_end) = template[i + 1..].find(['{', '}'])
        {
            let end = i + 1 + rel_end;
            if bytes[end] == b'}' {
                let expr = template[i + 1..end].trim();
                if let Some(value) = eval_num_expr(expr, num) {
                    out.push_str(&value.to_string());
                    i = end + 1;
                    continue;
                }
                out.push_str(&template[i..=end]);
                i = end + 1;
                continue;
            }
        }
        let ch = template[i..].chars().next().unwrap();
        out.push(ch);
        i += ch.len_utf8();
    }
    out
}

fn eval_num_expr(expr: &str, num: usize) -> Option<i128> {
    if expr.len() < 3 || !expr[..3].eq_ignore_ascii_case("num") {
        return None;
    }
    let mut remainder = expr[3..].trim();
    let offset: i128 = if remainder.is_empty() {
        0
    } else {
        let mut sign: i128 = 1;
        if let Some(rest) = remainder.strip_prefix('+') {
            remainder = rest.trim();
        } else if let Some(rest) = remainder.strip_prefix('-') {
            sign = -1;
            remainder = rest.trim();
        }
        let parsed = if remainder.is_empty() {
            0
        } else {
            parse_python_int(remainder)?
        };
        sign.checked_mul(parsed)?
    };
    i128::try_from(num).ok()?.checked_add(offset)
}

/// Match Python `int()` for decimal integers with optional sign and underscores.
fn parse_python_int(raw: &str) -> Option<i128> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }
    let (sign, digits) = if let Some(rest) = trimmed.strip_prefix('+') {
        (1i128, rest)
    } else if let Some(rest) = trimmed.strip_prefix('-') {
        (-1i128, rest)
    } else {
        (1i128, trimmed)
    };
    if digits.is_empty()
        || digits.starts_with('_')
        || digits.ends_with('_')
        || digits.contains("__")
        || !digits.bytes().all(|b| b.is_ascii_digit() || b == b'_')
    {
        return None;
    }
    let clean: String = digits.chars().filter(|&c| c != '_').collect();
    let value: i128 = clean.parse().ok()?;
    sign.checked_mul(value)
}

pub fn sanitize_split_filename(name: &str) -> String {
    name.chars()
        .filter(|c| !matches!(c, '\\' | '/' | ':' | '"' | '*' | '?' | '<' | '>' | '|'))
        .collect::<String>()
        .trim()
        .to_owned()
}

fn sha256_file(path: &Path) -> Result<[u8; 32], CoreError> {
    let bytes = fs::read(path).map_err(|err| format!("Không thể đọc file nguồn: {err}"))?;
    Ok(Sha256::digest(&bytes).into())
}

fn char_to_byte_offsets(
    content: &str,
    points: &[usize],
) -> Result<Vec<(usize, usize)>, SplitError> {
    if points.is_empty() {
        return Err(SplitError::NoMatches);
    }
    let mut out = Vec::with_capacity(points.len());
    let mut current_char = 0usize;
    let mut current_byte = 0usize;
    let mut remaining = content;

    for &target_char in points {
        let delta = target_char
            .checked_sub(current_char)
            .ok_or(SplitError::InvalidOffsets)?;
        let rel_byte = remaining
            .char_indices()
            .map(|(idx, _)| idx)
            .chain(std::iter::once(remaining.len()))
            .nth(delta)
            .ok_or(SplitError::InvalidOffsets)?;
        current_byte += rel_byte;
        current_char = target_char;
        remaining = &remaining[rel_byte..];
        out.push((current_byte, current_char));
    }
    Ok(out)
}

fn suggest_title(slice: &str, fallback_index: usize) -> String {
    for line in slice.lines() {
        let cleaned = line.trim().trim_start_matches('\u{feff}').trim();
        if !cleaned.is_empty() {
            return cleaned.chars().take(120).collect();
        }
    }
    format!("Phần {fallback_index}")
}

fn slice_tail_chars(text: &str, max_chars: usize) -> String {
    let count = text.chars().count();
    if count <= max_chars {
        return text.to_owned();
    }
    let skip = count - max_chars;
    let start = text
        .char_indices()
        .nth(skip)
        .map(|(idx, _)| idx)
        .unwrap_or(0);
    format!("…{}", &text[start..])
}

fn slice_head_chars(text: &str, max_chars: usize) -> String {
    let mut chars = text.chars();
    let head: String = chars.by_ref().take(max_chars).collect();
    if chars.next().is_some() {
        format!("{head}…")
    } else {
        head
    }
}

impl SplitSession {
    pub fn from_regex(
        file: &Path,
        pattern: &OsStr,
        position: Option<&OsStr>,
        interpreter: Option<&Path>,
    ) -> Result<Self, CoreError> {
        let source_sha256 = sha256_file(file)?;
        let (content, points) = match_file(file, pattern, position, interpreter)?;
        Self::from_text(file.to_path_buf(), source_sha256, content, &points).map_err(
            |err| match err {
                SplitError::NoMatches => crate::split::NO_MATCHES.into(),
                SplitError::InvalidOffsets => "Vị trí chia không hợp lệ.".into(),
            },
        )
    }

    /// Build a session directly from a UTF-8 file and precomputed Unicode code-point offsets.
    pub fn from_file_points(file: &Path, split_points: &[usize]) -> Result<Self, CoreError> {
        let raw = fs::read(file).map_err(|err| format!("Không thể đọc file nguồn: {err}"))?;
        let source_sha256: [u8; 32] = Sha256::digest(&raw).into();
        let text = String::from_utf8(raw)
            .map_err(|err| format!("Tệp nguồn không phải UTF-8 hợp lệ: {err}"))?;
        let normalized = text.replace("\r\n", "\n").replace('\r', "\n");
        Self::from_text(file.to_path_buf(), source_sha256, normalized, split_points).map_err(
            |err| match err {
                SplitError::NoMatches => crate::split::NO_MATCHES.into(),
                SplitError::InvalidOffsets => "Vị trí chia không hợp lệ.".into(),
            },
        )
    }

    pub fn from_text(
        source_path: PathBuf,
        source_sha256: [u8; 32],
        content: String,
        split_points: &[usize],
    ) -> Result<Self, SplitError> {
        if content.is_empty() || split_points.is_empty() {
            return Err(SplitError::NoMatches);
        }

        let mapped = char_to_byte_offsets(&content, split_points)?;
        let mut unique_starts: Vec<(usize, usize)> = Vec::new();
        for (byte_pos, char_pos) in mapped {
            if byte_pos >= content.len() {
                continue;
            }
            if unique_starts.last().map(|(b, _)| *b) != Some(byte_pos) {
                unique_starts.push((byte_pos, char_pos));
            }
        }
        if unique_starts.is_empty() {
            return Err(SplitError::NoMatches);
        }

        let mut boundaries: Vec<Boundary> = Vec::new();
        if unique_starts[0].0 > 0 {
            let leading = &content[..unique_starts[0].0];
            if !leading.trim().trim_start_matches('\u{feff}').is_empty() {
                boundaries.push(Boundary {
                    start_byte: 0,
                    start_char: 0,
                    title: "Mở đầu".to_owned(),
                    is_preface: true,
                    manual: false,
                });
            } else {
                unique_starts[0] = (0, 0);
            }
        }

        for (idx, (start_byte, start_char)) in unique_starts.iter().copied().enumerate() {
            let end_byte = unique_starts
                .get(idx + 1)
                .map(|(b, _)| *b)
                .unwrap_or(content.len());
            let title = suggest_title(&content[start_byte..end_byte], boundaries.len() + 1);
            boundaries.push(Boundary {
                start_byte,
                start_char,
                title,
                is_preface: false,
                manual: false,
            });
        }

        if boundaries.len() > MAX_BOUNDARIES {
            return Err(SplitError::InvalidOffsets);
        }

        Ok(Self {
            source_path,
            source_sha256,
            content,
            boundaries,
            past: Vec::new(),
            future: Vec::new(),
        })
    }

    pub fn source_path(&self) -> &Path {
        &self.source_path
    }

    pub fn default_output_dir(&self) -> PathBuf {
        let stem = self
            .source_path
            .file_stem()
            .and_then(|s| s.to_str())
            .filter(|s| !s.is_empty())
            .unwrap_or("chapters");
        let parent = self.source_path.parent().unwrap_or_else(|| Path::new("."));
        parent.join(format!("{stem}_split"))
    }

    pub fn boundary_count(&self) -> usize {
        self.boundaries.len()
    }

    pub fn can_undo(&self) -> bool {
        !self.past.is_empty()
    }

    pub fn can_redo(&self) -> bool {
        !self.future.is_empty()
    }

    fn effective_ranges(&self, preface_mode: PrefaceMode) -> Vec<(usize, Boundary, usize)> {
        let mut active: Vec<(usize, Boundary)> =
            self.boundaries.iter().cloned().enumerate().collect();

        if active.len() > 1 && active[0].1.is_preface {
            match preface_mode {
                PrefaceMode::Separate => {}
                PrefaceMode::Merge => {
                    active.remove(0);
                    active[0].1.start_byte = 0;
                    active[0].1.start_char = 0;
                }
                PrefaceMode::Remove => {
                    active.remove(0);
                }
            }
        }

        let len = active.len();
        let mut ranges = Vec::with_capacity(len);
        for i in 0..len {
            let end_byte = active
                .get(i + 1)
                .map(|(_, b)| b.start_byte)
                .unwrap_or(self.content.len());
            ranges.push((active[i].0, active[i].1.clone(), end_byte));
        }
        ranges
    }

    pub fn summaries(&self, preface_mode: PrefaceMode, name_format: &str) -> Vec<PartSummary> {
        let ranges = self.effective_ranges(preface_mode);
        let mut out = Vec::with_capacity(ranges.len());
        let mut file_counter = 0usize;

        for (part_index, (boundary_index, boundary, end_byte)) in ranges.into_iter().enumerate() {
            let slice = &self.content[boundary.start_byte..end_byte];
            let trimmed = slice.trim();
            let is_empty = trimmed.is_empty();
            let filename = if is_empty {
                None
            } else {
                file_counter += 1;
                Some(render_split_filename(name_format, file_counter))
            };
            let char_count = slice.chars().count();
            let mut warnings = Vec::new();
            if is_empty {
                warnings.push("Phần rỗng · sẽ bỏ qua khi xuất".to_owned());
            } else if char_count > LONG_CHAPTER_CHARS {
                warnings.push("Chương dài · nên kiểm tra mốc chia".to_owned());
            }
            if boundary.title.chars().count() > 80 {
                warnings.push("Tiêu đề dài".to_owned());
            }

            let preview = slice_head_chars(trimmed, PREVIEW_CHARS).replace('\n', " ↵ ");
            let context_before = if boundary.start_byte == 0 {
                String::new()
            } else {
                slice_tail_chars(&self.content[..boundary.start_byte], CONTEXT_BEFORE_CHARS)
            };
            let context_after =
                slice_head_chars(&self.content[boundary.start_byte..], CONTEXT_AFTER_CHARS);

            out.push(PartSummary {
                part_index,
                boundary_index,
                start_byte: boundary.start_byte,
                start_char: boundary.start_char,
                title: boundary.title,
                filename,
                preview,
                char_count,
                is_preface: boundary.is_preface,
                is_empty,
                manual: boundary.manual,
                warnings,
                context_before,
                context_after,
            });
        }
        out
    }

    fn push_history(&mut self) {
        self.past.push(self.boundaries.clone());
        if self.past.len() > MAX_HISTORY {
            self.past.remove(0);
        }
        self.future.clear();
    }

    pub fn remove_boundary(&mut self, boundary_index: usize) -> Result<(), String> {
        if boundary_index == 0 || boundary_index >= self.boundaries.len() {
            return Err("Không thể gộp mốc đầu văn bản.".into());
        }
        self.push_history();
        self.boundaries.remove(boundary_index);
        Ok(())
    }

    pub fn rename_boundary(&mut self, boundary_index: usize, title: String) -> Result<(), String> {
        let trimmed = title.trim();
        if trimmed.is_empty() || trimmed.chars().count() > 300 {
            return Err("Tiêu đề cần từ 1 đến 300 ký tự.".into());
        }
        let Some(existing) = self.boundaries.get(boundary_index) else {
            return Err("Mốc chia không còn tồn tại.".into());
        };
        if existing.title == trimmed {
            return Ok(());
        }
        self.push_history();
        let entry = &mut self.boundaries[boundary_index];
        entry.title = trimmed.to_owned();
        entry.manual = true;
        Ok(())
    }

    pub fn nudge_boundary(
        &mut self,
        boundary_index: usize,
        line_delta: isize,
    ) -> Result<(), String> {
        if boundary_index == 0 || boundary_index >= self.boundaries.len() {
            return Err("Không thể dời mốc đầu văn bản.".into());
        }
        if line_delta == 0 {
            return Ok(());
        }
        let min_byte = self.boundaries[boundary_index - 1].start_byte + 1;
        let max_byte = self
            .boundaries
            .get(boundary_index + 1)
            .map(|b| b.start_byte)
            .unwrap_or(self.content.len());
        let mut cursor = self.boundaries[boundary_index].start_byte;

        if line_delta < 0 {
            for _ in 0..line_delta.unsigned_abs() {
                if cursor == 0 {
                    break;
                }
                let before = &self.content[..cursor];
                let trimmed = before.strip_suffix('\n').unwrap_or(before);
                cursor = trimmed.rfind('\n').map(|pos| pos + 1).unwrap_or(0);
            }
        } else {
            for _ in 0..line_delta as usize {
                let Some(rel) = self.content[cursor..].find('\n') else {
                    return Err("Đã ở dòng cuối văn bản.".into());
                };
                cursor += rel + 1;
            }
        }

        if cursor < min_byte || cursor >= max_byte || !self.content.is_char_boundary(cursor) {
            return Err("Mốc chia phải nằm giữa hai chương liền kề.".into());
        }

        let start_char = self.content[..cursor].chars().count();
        let new_title = suggest_title(&self.content[cursor..max_byte], boundary_index + 1);
        self.push_history();
        let entry = &mut self.boundaries[boundary_index];
        entry.start_byte = cursor;
        entry.start_char = start_char;
        entry.title = new_title;
        entry.manual = true;
        Ok(())
    }

    pub fn add_boundary(
        &mut self,
        start_byte: usize,
        title: Option<String>,
    ) -> Result<usize, String> {
        if self.boundaries.len() >= MAX_BOUNDARIES {
            return Err("Đã đạt tối đa 10.000 mốc chia.".into());
        }
        if start_byte == 0
            || start_byte >= self.content.len()
            || !self.content.is_char_boundary(start_byte)
        {
            return Err("Vị trí mốc chia không hợp lệ.".into());
        }
        if self.boundaries.iter().any(|b| b.start_byte == start_byte) {
            return Err("Vị trí này đã có mốc chia.".into());
        }

        let insert_at = self
            .boundaries
            .binary_search_by_key(&start_byte, |b| b.start_byte)
            .unwrap_err();
        let end_byte = self
            .boundaries
            .get(insert_at)
            .map(|b| b.start_byte)
            .unwrap_or(self.content.len());
        let resolved_title = title
            .as_deref()
            .map(str::trim)
            .filter(|t| !t.is_empty())
            .map(str::to_owned)
            .unwrap_or_else(|| suggest_title(&self.content[start_byte..end_byte], insert_at + 1));
        if resolved_title.chars().count() > 300 {
            return Err("Tiêu đề cần từ 1 đến 300 ký tự.".into());
        }
        let start_char = self.content[..start_byte].chars().count();

        self.push_history();
        self.boundaries.insert(
            insert_at,
            Boundary {
                start_byte,
                start_char,
                title: resolved_title,
                is_preface: false,
                manual: true,
            },
        );
        Ok(insert_at)
    }

    pub fn undo(&mut self) -> bool {
        let Some(previous) = self.past.pop() else {
            return false;
        };
        let current = std::mem::replace(&mut self.boundaries, previous);
        self.future.push(current);
        true
    }

    pub fn redo(&mut self) -> bool {
        let Some(next) = self.future.pop() else {
            return false;
        };
        let current = std::mem::replace(&mut self.boundaries, next);
        self.past.push(current);
        true
    }

    pub fn search_lines(&self, query: &str, limit: usize) -> Vec<SearchHit> {
        let needle = query.trim();
        if needle.is_empty() || limit == 0 {
            return Vec::new();
        }
        let needle_lower = needle.to_lowercase();
        let mut hits = Vec::new();
        let mut byte_offset = 0usize;
        let mut char_offset = 0usize;

        for (idx, raw_line) in self.content.split_inclusive('\n').enumerate() {
            let line = raw_line.strip_suffix('\n').unwrap_or(raw_line);
            if line.to_lowercase().contains(&needle_lower) {
                hits.push(SearchHit {
                    line_start_byte: byte_offset,
                    line_start_char: char_offset,
                    line_number: idx + 1,
                    snippet: slice_head_chars(line.trim(), 120),
                });
                if hits.len() >= limit {
                    break;
                }
            }
            byte_offset += raw_line.len();
            char_offset += raw_line.chars().count();
        }
        hits
    }

    pub fn execute(
        &self,
        output_dir: &Path,
        preface_mode: PrefaceMode,
        name_format: &str,
        overwrite: bool,
    ) -> Result<SplitOutcome, String> {
        let current_sha = sha256_file(&self.source_path).map_err(|err| err.to_string())?;
        if current_sha != self.source_sha256 {
            return Err("File nguồn đã thay đổi sau khi xem trước. Hãy xem trước lại.".into());
        }

        let ranges = self.effective_ranges(preface_mode);
        let mut planned: Vec<(String, &str)> = Vec::new();
        let mut skipped_empty = 0usize;
        let mut seen_names: HashSet<String> = HashSet::new();

        for (_, boundary, end_byte) in ranges {
            let trimmed = self.content[boundary.start_byte..end_byte].trim();
            if trimmed.is_empty() {
                skipped_empty += 1;
                continue;
            }
            let filename = render_split_filename(name_format, planned.len() + 1);
            if !names::valid_target(&filename) {
                return Err(format!("Tên file đích không hợp lệ: {filename}"));
            }
            let key = names::destination_key(&filename);
            if !seen_names.insert(key) {
                return Err(format!("Mẫu tên tạo ra tên file trùng lặp: {filename}"));
            }
            planned.push((filename, trimmed));
        }

        if planned.is_empty() {
            return Err("Không có phần nội dung nào để xuất.".into());
        }

        if output_dir.exists() && !output_dir.is_dir() {
            return Err("Đường dẫn xuất không phải là thư mục.".into());
        }

        if !overwrite && output_dir.is_dir() {
            for (filename, _) in &planned {
                if output_dir.join(filename).exists() {
                    return Err(format!(
                        "File đích đã tồn tại: {filename}. Hãy đổi thư mục xuất hoặc bật cho phép ghi đè."
                    ));
                }
            }
        }

        fs::create_dir_all(output_dir)
            .map_err(|err| format!("Không thể tạo thư mục xuất: {err}"))?;

        let mut written = Vec::with_capacity(planned.len());
        let mut failure = None;

        for (filename, chunk) in planned {
            let target = output_dir.join(&filename);
            let mut options = OpenOptions::new();
            options.write(true);
            if overwrite {
                options.create(true).truncate(true);
            } else {
                options.create_new(true);
            }
            let write_result = options
                .open(&target)
                .and_then(|mut file| file.write_all(chunk.as_bytes()));
            match write_result {
                Ok(()) => written.push(filename),
                Err(err) => {
                    failure = Some(SplitWriteFailure {
                        filename,
                        error: err.to_string(),
                    });
                    break;
                }
            }
        }

        Ok(SplitOutcome {
            output_dir: output_dir.display().to_string(),
            written,
            skipped_empty,
            failure,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renders_split_filename_with_python_parity() {
        assert_eq!(render_split_filename("", 3), "part_3.txt");
        assert_eq!(render_split_filename("chap_{num}.txt", 1), "chap_1.txt");
        assert_eq!(render_split_filename("chap_{NUM + 5}.txt", 2), "chap_7.txt");
        assert_eq!(render_split_filename("chap_{num - 2}.txt", 5), "chap_3.txt");
        assert_eq!(
            render_split_filename("chap_{num+_1_0}.txt", 1),
            "part_1.txt"
        );
        assert_eq!(
            render_split_filename("chap_{num+1_0}.txt", 1),
            "chap_11.txt"
        );
        assert_eq!(render_split_filename("chap_{other}.txt", 4), "part_4.txt");
        assert_eq!(render_split_filename("a:b*c?_{num}.txt", 2), "abc_2.txt");
    }

    #[test]
    fn manages_preface_editing_undo_and_utf8_boundaries() {
        let text =
            "Lời mở đầu 🙂\n第1章 Khởi đầu\nNội dung 1\nDòng phụ\n第2章 Kết thúc\nNội dung 2";
        let p1 = "Lời mở đầu 🙂\n".chars().count();
        let p2 = "Lời mở đầu 🙂\n第1章 Khởi đầu\nNội dung 1\nDòng phụ\n"
            .chars()
            .count();

        let mut session = SplitSession::from_text(
            PathBuf::from("novel.txt"),
            [0u8; 32],
            text.to_owned(),
            &[p1, p2],
        )
        .unwrap();

        let sep = session.summaries(PrefaceMode::Separate, "c_{num}.txt");
        assert_eq!(sep.len(), 3);
        assert!(sep[0].is_preface);
        assert_eq!(sep[0].filename.as_deref(), Some("c_1.txt"));
        assert_eq!(sep[1].title, "第1章 Khởi đầu");

        let merged = session.summaries(PrefaceMode::Merge, "c_{num}.txt");
        assert_eq!(merged.len(), 2);
        assert!(merged[0].preview.starts_with("Lời mở đầu"));

        let removed = session.summaries(PrefaceMode::Remove, "c_{num}.txt");
        assert_eq!(removed.len(), 2);
        assert!(removed[0].preview.starts_with("第1章"));

        // Nudge boundary 2 up by 1 line onto "Dòng phụ"
        session.nudge_boundary(2, -1).unwrap();
        let nudged = session.summaries(PrefaceMode::Separate, "c_{num}.txt");
        assert_eq!(nudged[2].title, "Dòng phụ");

        // Undo brings it back to 第2章
        assert!(session.undo());
        let restored = session.summaries(PrefaceMode::Separate, "c_{num}.txt");
        assert_eq!(restored[2].title, "第2章 Kết thúc");

        // Merge boundary 2 into boundary 1, then redo/undo
        session.remove_boundary(2).unwrap();
        assert_eq!(session.boundary_count(), 2);
        assert!(session.undo());
        assert_eq!(session.boundary_count(), 3);

        // Search and add manual boundary
        let hits = session.search_lines("Dòng phụ", 10);
        assert_eq!(hits.len(), 1);
        let inserted = session
            .add_boundary(hits[0].line_start_byte, Some("Phân đoạn".into()))
            .unwrap();
        assert_eq!(inserted, 2);
        assert_eq!(session.boundary_count(), 4);
    }

    #[test]
    fn execute_blocks_stale_source_and_existing_targets_without_overwrite() {
        let dir = tempfile::tempdir().unwrap();
        let source = dir.path().join("story.txt");
        let raw = "第1章 A\nBody 1\n第2章 B\nBody 2";
        fs::write(&source, raw).unwrap();
        let sha = sha256_file(&source).unwrap();
        let p2 = "第1章 A\nBody 1\n".chars().count();
        let session =
            SplitSession::from_text(source.clone(), sha, raw.to_owned(), &[0, p2]).unwrap();

        let out_dir = dir.path().join("out");
        let outcome = session
            .execute(&out_dir, PrefaceMode::Separate, "part_{num}.txt", false)
            .unwrap();
        assert_eq!(outcome.written, vec!["part_1.txt", "part_2.txt"]);
        assert!(outcome.failure.is_none());
        assert_eq!(
            fs::read_to_string(out_dir.join("part_1.txt")).unwrap(),
            "第1章 A\nBody 1"
        );
        assert_eq!(
            fs::read_to_string(out_dir.join("part_2.txt")).unwrap(),
            "第2章 B\nBody 2"
        );

        // Re-running without overwrite must be blocked
        assert!(
            session
                .execute(&out_dir, PrefaceMode::Separate, "part_{num}.txt", false)
                .is_err()
        );

        // Mutating source invalidates execution
        fs::write(&source, "changed").unwrap();
        let out_dir_2 = dir.path().join("out2");
        assert!(
            session
                .execute(&out_dir_2, PrefaceMode::Separate, "part_{num}.txt", false)
                .is_err()
        );
        assert!(!out_dir_2.exists());
    }
}
