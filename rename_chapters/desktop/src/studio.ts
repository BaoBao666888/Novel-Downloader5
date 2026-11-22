import { invoke } from '@tauri-apps/api/core';

type Match = { num: string | null; title: string | null; source: string };

export type Row = {
  filename: string;
  from_filename: Match;
  from_content: Match;
  error: string | null;
  proposed_name: string | null;
  first_line?: string;
  status: 'proposed' | 'unchanged' | 'missing_number' | 'excluded';
  issues: Array<'invalid_target' | 'duplicate_target' | 'target_exists' | 'target_check_failed'>;
};

export type Preview = { revision: number; rows: Row[]; eligible: string[] };

export type Options = {
  name_format: string;
  strategy: string;
  sort_by: string;
  filename_regexes: string[];
  content_regexes: string[];
  custom_titles: string[] | null;
  include_first_line: boolean;
};

type Operation = { source: string; target: string };
export type Outcome = {
  renamed: Operation[];
  failure: { operation: Operation; error: string } | null;
};

type LineEdit = { file: string; replacement: string };
export type LinePreview = { revision: number; rows: (LineEdit & { current_line: string })[] };
export type LineResult = {
  changed: { file: string; backup: string }[];
  failure: { file: string; error: string; recovery_dir: string | null } | null;
  undo_revision: number | null;
};

export type PrefaceMode = 'separate' | 'merge' | 'remove';

export type SplitSelection = {
  file: string;
  output_dir: string;
};

export type SplitOptions = {
  pattern: string;
  position: 'before' | 'after';
  preface_mode: PrefaceMode;
  name_format: string;
};

export type SplitPart = {
  part_index: number;
  boundary_index: number;
  start_byte: number;
  start_char: number;
  title: string;
  filename: string | null;
  preview: string;
  char_count: number;
  is_preface: boolean;
  is_empty: boolean;
  manual: boolean;
  warnings: string[];
  context_before: string;
  context_after: string;
};

export type SplitPreview = {
  revision: number;
  output_dir: string;
  parts: SplitPart[];
  writable_count: number;
  can_undo: boolean;
  can_redo: boolean;
};

export type SplitSearchHit = {
  line_start_byte: number;
  line_start_char: number;
  line_number: number;
  snippet: string;
};

export type SplitOutcome = {
  output_dir: string;
  written: string[];
  skipped_empty: number;
  failure: { filename: string; error: string } | null;
};

export type TocMode = 'append' | 'replace';

export type TextChange = {
  index: number;
  line_number: number;
  before: string;
  after: string;
};

export type TextPreview = {
  revision: number;
  summary: {
    file: string;
    match_count: number;
    changed_count: number;
    toc_entries: number | null;
    changes: TextChange[];
  };
  has_changes: boolean;
};

export type TextResult = {
  outcome: {
    file: string;
    backup: string;
    changed_count: number;
  };
  undo_revision: number | null;
};

export type ArchiveEntry = {
  index: number;
  raw_name: string;
  display_name: string;
  size: number;
  compressed_size: number;
  is_txt: boolean;
  safe: boolean;
  issue: string | null;
};

export type ArchivePreview = {
  revision: number;
  output_dir: string;
  info: {
    archive: string;
    default_output_dir: string;
    entries: ArchiveEntry[];
    total_size: number;
    safe_count: number;
    txt_count: number;
    blocked_count: number;
  };
};

export type EntryPreview = {
  display_name: string;
  encoding: string;
  truncated: boolean;
  text: string;
};

export type ExtractOutcome = {
  output_dir: string;
  extracted: string[];
  failure: { entry: string; error: string } | null;
};

export const chooseFolder = () => invoke<string | null>('choose_folder');
export const choosePython = () => invoke<string | null>('choose_python');
export const previewRename = (options: Options) => invoke<Preview>('preview_rename', { options });
export const applyRename = (revision: number, selection: string[]) =>
  invoke<Outcome>('apply_rename', { revision, selection });
export const previewFirstLine = (scanRevision: number, edits: LineEdit[]) =>
  invoke<LinePreview>('preview_first_line', { scanRevision, edits });
export const applyFirstLine = (revision: number) => invoke<LineResult>('apply_first_line', { revision });
export const undoFirstLine = (revision: number) => invoke<LineResult>('undo_first_line', { revision });

export const chooseSplitFile = () => invoke<SplitSelection | null>('choose_split_file');
export const chooseSplitOutputDir = () => invoke<string | null>('choose_split_output_dir');
export const previewSplit = (options: SplitOptions) => invoke<SplitPreview>('preview_split', { options });
export const refreshSplitView = (revision: number, prefaceMode: PrefaceMode, nameFormat: string) =>
  invoke<SplitPreview>('refresh_split_view', { revision, prefaceMode, nameFormat });
export const nudgeSplitBoundary = (
  revision: number,
  boundaryIndex: number,
  lineDelta: number,
  prefaceMode: PrefaceMode,
  nameFormat: string,
) => invoke<SplitPreview>('nudge_split_boundary', { revision, boundaryIndex, lineDelta, prefaceMode, nameFormat });
export const mergeSplitBoundary = (
  revision: number,
  boundaryIndex: number,
  prefaceMode: PrefaceMode,
  nameFormat: string,
) => invoke<SplitPreview>('merge_split_boundary', { revision, boundaryIndex, prefaceMode, nameFormat });
export const renameSplitBoundary = (
  revision: number,
  boundaryIndex: number,
  title: string,
  prefaceMode: PrefaceMode,
  nameFormat: string,
) => invoke<SplitPreview>('rename_split_boundary', { revision, boundaryIndex, title, prefaceMode, nameFormat });
export const addSplitBoundary = (
  revision: number,
  startByte: number,
  title: string | null,
  prefaceMode: PrefaceMode,
  nameFormat: string,
) => invoke<SplitPreview>('add_split_boundary', { revision, startByte, title, prefaceMode, nameFormat });
export const undoSplit = (revision: number, prefaceMode: PrefaceMode, nameFormat: string) =>
  invoke<SplitPreview>('undo_split', { revision, prefaceMode, nameFormat });
export const redoSplit = (revision: number, prefaceMode: PrefaceMode, nameFormat: string) =>
  invoke<SplitPreview>('redo_split', { revision, prefaceMode, nameFormat });
export const searchSplitText = (revision: number, query: string) =>
  invoke<SplitSearchHit[]>('search_split_text', { revision, query });
export const applySplit = (
  revision: number,
  prefaceMode: PrefaceMode,
  nameFormat: string,
  overwrite: boolean,
) => invoke<SplitOutcome>('apply_split', { revision, prefaceMode, nameFormat, overwrite });

export const chooseTextFile = () => invoke<string | null>('choose_text_file');
export const chooseTocFile = () => invoke<string | null>('choose_toc_file');
export const previewRenumber = (findRegex: string, replaceFormat: string, startNum: number) =>
  invoke<TextPreview>('preview_renumber', { findRegex, replaceFormat, startNum });
export const previewApplyToc = (tocRegex: string, mainRegex: string, mode: TocMode) =>
  invoke<TextPreview>('preview_apply_toc', { tocRegex, mainRegex, mode });
export const previewReplace = (options: {
  search: string;
  replacement: string;
  use_regex: boolean;
  whole_word: boolean;
  match_case: boolean;
}) => invoke<TextPreview>('preview_replace', { options });
export const applyTextEdit = (revision: number) => invoke<TextResult>('apply_text_edit', { revision });
export const undoTextEdit = (revision: number) => invoke<TextResult>('undo_text_edit', { revision });

export const chooseArchiveFile = () => invoke<SplitSelection | null>('choose_archive_file');
export const chooseArchiveOutputDir = () => invoke<string | null>('choose_archive_output_dir');
export const inspectArchive = () => invoke<ArchivePreview>('inspect_archive');
export const previewArchiveEntry = (revision: number, entryIndex: number) =>
  invoke<EntryPreview>('preview_archive_entry', { revision, entryIndex });
export const extractArchive = (revision: number, indices: number[], overwrite: boolean) =>
  invoke<ExtractOutcome>('extract_archive', { revision, indices, overwrite });

const issueLabels: Record<Row['issues'][number], string> = {
  invalid_target: 'Tên đích không hợp lệ',
  duplicate_target: 'Trùng tên trong danh sách',
  target_exists: 'Tên đích đã tồn tại',
  target_check_failed: 'Không kiểm tra được tên đích',
};

export function rowStatus(row: Row, eligible: boolean): string {
  if (row.issues.length) return row.issues.map((issue) => issueLabels[issue]).join(' · ');
  if (row.status === 'unchanged') return 'Tên đã đúng';
  if (row.status === 'missing_number') return 'Thiếu số chương';
  if (row.status === 'excluded') return 'Đã loại trừ';
  return eligible ? 'Có thể đổi' : 'File đã thay đổi';
}
