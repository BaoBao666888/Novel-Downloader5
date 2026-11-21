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

export const chooseFolder = () => invoke<string | null>('choose_folder');
export const choosePython = () => invoke<string | null>('choose_python');
export const previewRename = (options: Options) => invoke<Preview>('preview_rename', { options });
export const applyRename = (revision: number, selection: string[]) =>
  invoke<Outcome>('apply_rename', { revision, selection });
export const previewFirstLine = (scanRevision: number, edits: LineEdit[]) =>
  invoke<LinePreview>('preview_first_line', { scanRevision, edits });
export const applyFirstLine = (revision: number) => invoke<LineResult>('apply_first_line', { revision });
export const undoFirstLine = (revision: number) => invoke<LineResult>('undo_first_line', { revision });

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
