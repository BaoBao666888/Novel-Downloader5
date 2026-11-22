import { invoke } from '@tauri-apps/api/core';

export type SourceKind = 'txt' | 'zip';
export type LibraryItem = {
  id: number;
  title: string;
  path: string;
  kind: SourceKind;
  size: number;
  last_chapter?: number;
};
export type ReadingCursor = { offset: number; stamp: string };
export type LibraryPage = { text: string; next: ReadingCursor | null };
export type LibraryChapterMeta = { index: number; title: string; size: number };
export type LibraryChapterList = {
  book_id: number;
  kind: SourceKind;
  encoding: string;
  chapters: LibraryChapterMeta[];
};
export type LibraryChapterContent = {
  index: number;
  title: string;
  text: string;
  encoding: string;
  total_chapters: number;
  truncated: boolean;
};

export const listLibrary = () => invoke<LibraryItem[]>('list_library');
export const importLibrary = () => invoke<{ entries: LibraryItem[]; added: number } | null>('import_library');
export const removeLibrary = (id: number) => invoke<LibraryItem[]>('remove_library', { id });
export const readLibrary = (id: number, cursor: ReadingCursor | null) =>
  invoke<LibraryPage>('read_library', { id, cursor });
export const listLibraryChapters = (id: number) => invoke<LibraryChapterList>('list_library_chapters', { id });
export const readLibraryChapter = (id: number, chapterIndex: number) =>
  invoke<LibraryChapterContent>('read_library_chapter', { id, chapterIndex });

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

export type MergeEntry = {
  filename: string;
  path: string;
  size: number;
  first_line: string;
};

export type MergePreview = {
  revision: number;
  output_file: string;
  info: {
    folder: string;
    default_output: string;
    entries: MergeEntry[];
    total_size: number;
  };
};

export type MergeOptions = {
  filenames: string[];
  separator: string;
  include_filename_heading: boolean;
  overwrite: boolean;
};

export type MergeOutcome = {
  output_file: string;
  merged_count: number;
  total_chars: number;
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
export const applyTextEdit = (revision: number, selectedIndices?: number[]) =>
  invoke<TextResult>('apply_text_edit', { revision, selectedIndices: selectedIndices ?? null });
export const undoTextEdit = (revision: number) => invoke<TextResult>('undo_text_edit', { revision });

export const chooseArchiveFile = () => invoke<SplitSelection | null>('choose_archive_file');
export const chooseArchiveOutputDir = () => invoke<string | null>('choose_archive_output_dir');
export const inspectArchive = () => invoke<ArchivePreview>('inspect_archive');
export const previewArchiveEntry = (revision: number, entryIndex: number) =>
  invoke<EntryPreview>('preview_archive_entry', { revision, entryIndex });
export const extractArchive = (revision: number, indices: number[], overwrite: boolean) =>
  invoke<ExtractOutcome>('extract_archive', { revision, indices, overwrite });

export const chooseMergeFolder = () => invoke<MergePreview | null>('choose_merge_folder');
export const chooseMergeOutput = () => invoke<string | null>('choose_merge_output');
export const refreshMerge = () => invoke<MergePreview>('refresh_merge');
export const applyMerge = (revision: number, options: MergeOptions) =>
  invoke<MergeOutcome>('apply_merge', { revision, options });

export type JobMode = 'new' | 'existing';
export type JobStatus =
  | 'planned'
  | 'scheduled'
  | 'linked'
  | 'queued'
  | 'running'
  | 'sending'
  | 'verifying'
  | 'waiting'
  | 'uncertain'
  | 'failed'
  | 'complete';
export type UploadStage =
  | 'prepare'
  | 'authorize'
  | 'history'
  | 'createVolume'
  | 'upload'
  | 'publish'
  | 'verify'
  | 'verifyWait';
export type VolumeStatus = 'planned' | 'created' | 'uploaded' | 'verified';
export type CreditPosition = 'start' | 'end' | { line: number };

export type ChapterValidationReport = {
  errors: string[];
  warnings: string[];
  bytes: number;
};

export type ScannedChapter = {
  filename: string;
  title: string;
  number: number | null;
  bytes: number;
  firstLine: string;
};

export type FolderChapterScan = {
  folder: string;
  chapters: ScannedChapter[];
  validation: ChapterValidationReport;
};

export type CreateJobInput = {
  folder: string;
  mode: JobMode;
  account: string;
  titleVi: string;
  titleCn: string;
  authorCn: string;
  descVi: string;
  bookUrl: string;
  volumeName: string;
  volumeNote: string;
  append: boolean;
  creditText: string;
  creditPosition: CreditPosition;
};

export type ProgressSnapshot = {
  id: string;
  title: string;
  status: JobStatus;
  active: boolean;
  phase: string;
  detail: string;
  error: string;
  done: number;
  max: number;
  percent: number;
};

export type JobVolumeView = {
  key: string;
  name: string;
  note: string;
  append: boolean;
  remoteId: string;
  status: VolumeStatus;
  chapterCount: number;
  chapterIds: string[];
};

export type JobChapterView = {
  id: string;
  title: string;
  number: number | null;
  bytes: number;
  available: boolean;
  hasOriginal: boolean;
};

export type JobView = {
  id: string;
  title: string;
  account: string;
  mode: JobMode;
  status: JobStatus;
  stage: UploadStage;
  bookId: string;
  bookUrl: string;
  publishedUrl: string | null;
  error: string;
  verificationMessage: string | null;
  scheduleMessage: string | null;
  scheduledAt: number | null;
  afterJobId: string | null;
  createdAt: number;
  completedAt: number | null;
  writeAttempted: boolean;
  needsReconcile: boolean;
  filesReleased: boolean;
  scheduleRevision: number;
  totalBytes: number;
  chapterCount: number;
  availableChapterCount: number;
  progress: ProgressSnapshot;
  retryLabel: string | null;
  uploadIssue: string | null;
  pendingConflicts: string[];
  validation: ChapterValidationReport;
  volumes: JobVolumeView[];
  chapters: JobChapterView[];
  canSchedule: boolean;
  scheduleBlockReason: string | null;
  canDelete: boolean;
  deleteBlockReason: string | null;
  canExportRecovery: boolean;
};

export type ScheduleRow = {
  id: string;
  at: number;
  key: string;
  running: boolean;
  afterJobId: string | null;
  immediate: boolean;
  cancelRequested: boolean;
  startupRetry: boolean;
};

export type CrashRecoveryReport = {
  uncertainIds: string[];
  failedIds: string[];
};

export type StorageStats = {
  objectFiles: number;
  objectBytes: number;
};

export type SweepResult = {
  files: number;
  bytes: number;
};

export type StorageCleanupReport = {
  releasedJobs: number;
  swept: SweepResult;
};

export type UploadWorkspaceSnapshot = {
  allowedHost: string;
  crashRecovery: CrashRecoveryReport;
  jobs: JobView[];
  schedules: ScheduleRow[];
  ledgerCount: number;
  storage: StorageStats;
};

export type RecoveryChapterItem = {
  title: string;
  filename: string;
  available: boolean;
};

export type RecoveryVolume = {
  name: string;
  note: string;
  append: boolean;
  remoteId: string;
  chapters: RecoveryChapterItem[];
};

export type RecoveryReport = {
  schema: number;
  jobId: string;
  title: string;
  mode: JobMode;
  bookUrl: string;
  bookId: string;
  metadata: {
    fields: Array<[string, string]>;
    selectedLabels: Record<string, Array<{ value: string; label: string; required: boolean }>>;
  };
  volumes: RecoveryVolume[];
  availableChapters: number;
  missingChapters: number;
  text: string;
};

export type ExportRecoveryOutcome = {
  path: string;
  report: RecoveryReport;
};

export type BackupZipInspection = {
  path: string;
  report: RecoveryReport;
};

export type RestoreBackupOutcome = {
  restoredJobId: string;
  snapshot: UploadWorkspaceSnapshot;
};

export type CleanupStorageOutcome = {
  report: StorageCleanupReport;
  snapshot: UploadWorkspaceSnapshot;
};

export const listUploadWorkspace = () => invoke<UploadWorkspaceSnapshot>('list_upload_workspace');
export const chooseUploadFolder = () => invoke<FolderChapterScan | null>('choose_upload_folder');
export const scanUploadFolder = (folder: string) =>
  invoke<FolderChapterScan>('scan_upload_folder', { folder });
export const createUploadJob = (input: CreateJobInput) =>
  invoke<UploadWorkspaceSnapshot>('create_upload_job', { input });
export const scheduleUploadJob = (id: string, atMs: number, allowDuplicate: boolean) =>
  invoke<UploadWorkspaceSnapshot>('schedule_upload_job', { id, atMs, allowDuplicate });
export const linkUploadJob = (id: string, parentId: string, allowDuplicate: boolean) =>
  invoke<UploadWorkspaceSnapshot>('link_upload_job', { id, parentId, allowDuplicate });
export const cancelUploadSchedule = (id: string) =>
  invoke<UploadWorkspaceSnapshot>('cancel_upload_schedule', { id });
export const deleteUploadJob = (id: string) =>
  invoke<UploadWorkspaceSnapshot>('delete_upload_job', { id });
export const previewUploadJobRecovery = (id: string) =>
  invoke<RecoveryReport>('preview_upload_job_recovery', { id });
export const exportUploadJobRecovery = (id: string, suggestedName: string) =>
  invoke<ExportRecoveryOutcome | null>('export_upload_job_recovery', { id, suggestedName });
export const pickUploadBackupZip = () => invoke<BackupZipInspection | null>('pick_upload_backup_zip');
export const restoreUploadBackupZip = (zipPath: string, account: string) =>
  invoke<RestoreBackupOutcome>('restore_upload_backup_zip', { zipPath, account });
export const cleanupUploadStorage = () => invoke<CleanupStorageOutcome>('cleanup_upload_storage');

export type SessionSecretStatus = {
  configured: boolean;
  readable: boolean;
  masked: string;
};

export type SessionCheckResult = {
  authenticated: boolean;
  account: string;
  host: string;
  message: string;
};

export type LiveRunProgress = {
  jobId: string;
  title: string;
  stage: UploadStage;
  phase: string;
  bytes: number;
  total: number;
  percent: number;
  active: boolean;
};

export type UploadRuntimeStatus = {
  activeRun: LiveRunProgress | null;
  autoScheduleEnabled: boolean;
  lastMessage: string | null;
  lastError: string | null;
  verifiedAccount: string | null;
  mockMode: boolean;
};

export type VerifyNowOutcome = {
  record: { id: string; status: JobStatus; message: string } | null;
  snapshot: UploadWorkspaceSnapshot;
};

export type RunDueVerificationsOutcome = {
  checkedCount: number;
  snapshot: UploadWorkspaceSnapshot;
};

export const getUploadSessionStatus = () =>
  invoke<SessionSecretStatus>('get_upload_session_status');
export const saveUploadSessionCookie = (cookie: string) =>
  invoke<SessionSecretStatus>('save_upload_session_cookie', { cookie });
export const clearUploadSessionCookie = () =>
  invoke<SessionSecretStatus>('clear_upload_session_cookie');
export const checkUploadSession = () => invoke<SessionCheckResult>('check_upload_session');
export const getUploadRuntimeStatus = () =>
  invoke<UploadRuntimeStatus>('get_upload_runtime_status');
export const setUploadAutoSchedule = (enabled: boolean) =>
  invoke<UploadRuntimeStatus>('set_upload_auto_schedule', { enabled });
export const startUploadJobNow = (id: string, revision: number, consentIds: string[]) =>
  invoke<UploadRuntimeStatus>('start_upload_job_now', { id, revision, consentIds });
export const stopActiveUpload = () => invoke<boolean>('stop_active_upload');
export const verifyUploadJobNow = (id: string) =>
  invoke<VerifyNowOutcome>('verify_upload_job_now', { id });
export const runDueUploadVerifications = () =>
  invoke<RunDueVerificationsOutcome>('run_due_upload_verifications');

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
