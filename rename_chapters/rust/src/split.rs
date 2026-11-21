use std::ffi::OsStr;
use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::{CoreError, python};

const PREVIEW_LIMIT: usize = 50;
pub const NO_MATCHES: &str = "Không tìm thấy điểm chia nào với regex đã cho";

#[derive(Debug, PartialEq, Eq, Serialize)]
pub struct PreviewChunk {
    pub text: String,
    pub size: usize,
}

#[derive(Debug, PartialEq, Eq)]
pub enum SplitError {
    NoMatches,
    InvalidOffsets,
}

#[derive(Deserialize)]
#[serde(tag = "status", rename_all = "snake_case")]
enum SplitSource {
    Matched { content: String, points: Vec<usize> },
    Error { message: String },
}

#[derive(Serialize)]
pub struct PreviewOutput {
    pub chunks: Vec<PreviewChunk>,
    pub error: Option<String>,
}

/// Preview an existing file using the legacy regex semantics.
pub fn preview_file(
    file: &Path,
    pattern: &OsStr,
    position: Option<&OsStr>,
) -> Result<PreviewOutput, CoreError> {
    let mut args = vec![file.as_os_str().to_owned(), pattern.to_owned()];
    if let Some(position) = position {
        args.push(position.to_owned());
    }
    let bytes = python::run(include_str!("split_source.py"), &args, None)?;
    let result = match serde_json::from_slice(&bytes)? {
        SplitSource::Matched { content, points } => match preview(&content, &points) {
            Ok(chunks) => Ok(chunks),
            Err(SplitError::NoMatches) => Err(NO_MATCHES.to_owned()),
            Err(SplitError::InvalidOffsets) => return Err("Vị trí chia không hợp lệ".into()),
        },
        SplitSource::Error { message } => Err(message),
    };
    Ok(match result {
        Ok(chunks) => PreviewOutput {
            chunks,
            error: None,
        },
        Err(error) => PreviewOutput {
            chunks: Vec::new(),
            error: Some(error),
        },
    })
}

/// Split normalized UTF-8 text at sorted Python string offsets (Unicode code
/// points). Preserve repeated offsets and the implicit start and end pieces.
pub fn preview(content: &str, split_points: &[usize]) -> Result<Vec<PreviewChunk>, SplitError> {
    if split_points.is_empty() {
        return Err(SplitError::NoMatches);
    }

    let mut chunks = Vec::new();
    let mut start = 0;
    let mut remaining = content;
    for &end in split_points {
        let size = end.checked_sub(start).ok_or(SplitError::InvalidOffsets)?;
        let byte_offset = remaining
            .char_indices()
            .map(|(index, _)| index)
            .chain(std::iter::once(remaining.len()))
            .nth(size)
            .ok_or(SplitError::InvalidOffsets)?;
        let (chunk, rest) = remaining.split_at(byte_offset);
        chunks.push(preview_chunk(chunk, size));
        remaining = rest;
        start = end;
    }
    chunks.push(preview_chunk(remaining, remaining.chars().count()));
    Ok(chunks)
}

fn preview_chunk(chunk: &str, size: usize) -> PreviewChunk {
    let head: String = chunk.chars().take(PREVIEW_LIMIT).collect();
    PreviewChunk {
        text: head.replace('\n', "\\n"),
        size,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_split_offsets_outside_the_source_or_out_of_order() {
        assert_eq!(preview("🙂", &[2]), Err(SplitError::InvalidOffsets));
        assert_eq!(preview("中文", &[2, 1]), Err(SplitError::InvalidOffsets));
    }

    #[test]
    fn distinguishes_no_matches_from_a_match_in_empty_text() {
        assert_eq!(preview("", &[]), Err(SplitError::NoMatches));
        let chunks = preview("", &[0]).unwrap();
        assert_eq!(chunks.len(), 2);
        assert!(
            chunks
                .iter()
                .all(|chunk| chunk.size == 0 && chunk.text.is_empty())
        );
    }
}
