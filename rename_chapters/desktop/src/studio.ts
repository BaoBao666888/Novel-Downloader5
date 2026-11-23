import { invoke } from '@tauri-apps/api/core';

export type ReaderWebStatus = { url: string | null; lan: boolean };
export const getReaderWebStatus = () => invoke<ReaderWebStatus>('reader_web_status');
export const startReaderWeb = (lan: boolean, port: number) => invoke<ReaderWebStatus>('start_reader_web', { lan, port });
export const stopReaderWeb = () => invoke<ReaderWebStatus>('stop_reader_web');

export const listWikiProfiles = () => invoke<string[]>('list_wiki_profiles');
export const openWiki = (profile: string, address: string) =>
  invoke<void>('open_wiki', { options: { profile, address } });

export type WikiWork = { id: string; title: string; url: string | null; chapter_count: number | null; local_only: boolean };
export type WikiWorks = { account: string; server_count: number | null; rows: WikiWork[] };
export const loadWikiWorks = (account: string) => invoke<WikiWorks>('load_wiki_works', { account });
export const importWikiWorks = () => invoke<WikiWorks | null>('import_wiki_works');
export const syncWikiWorks = (account: string) => invoke<WikiWorks>('sync_wiki_works', { account });
export const cancelWikiSync = () => invoke<void>('cancel_wiki_sync');
export const removeLocalWikiWorks = (account: string, ids: string[]) =>
  invoke<WikiWorks>('remove_local_wiki_works', { account, ids });

export type CreditPlacement = 'start' | 'end' | { line: number };
export type CreditPreview = { revision: number; rows: { name: string; error: string | null }[] };
export type CreditSample = { before: string; credit: string; after: string };
export type CreditResult = { report: { written: string[]; error: string | null }; can_undo: boolean };
export const chooseCreditFolder = () => invoke<string | null>('choose_credit_folder');
export const previewCredit = (text: string, position: CreditPlacement) =>
  invoke<CreditPreview>('preview_credit', { options: { text, position } });
export const sampleCredit = (revision: number, name: string) => invoke<CreditSample>('sample_credit', { revision, name });
export const saveCredit = (revision: number, selection: string[]) => invoke<CreditResult>('save_credit', { revision, selection });
export const undoCredit = () => invoke<CreditResult>('undo_credit');

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
export const importLibraryPaths = (paths: string[]) =>
  invoke<{ entries: LibraryItem[]; added: number }>('import_library_paths', { paths });
export const removeLibrary = (id: number) => invoke<LibraryItem[]>('remove_library', { id });
export const readLibrary = (id: number, cursor: ReadingCursor | null) =>
  invoke<LibraryPage>('read_library', { id, cursor });
export const listLibraryChapters = (id: number) => invoke<LibraryChapterList>('list_library_chapters', { id });
export const readLibraryChapter = (id: number, chapterIndex: number) =>
  invoke<LibraryChapterContent>('read_library_chapter', { id, chapterIndex });

export type TranslationMode = 'server' | 'tm_translate_beta';

export type TranslateBatchConfig = {
  serverUrl: string;
  maxChars: number;
  delayMs: number;
  retryCount: number;
  retryBackoffMs: number;
  timeoutSec: number;
  targetLang: string;
};

export type NameSetState = {
  sets: Record<string, Record<string, string>>;
  active_set: string;
  version: number;
};

export type VpSetState = {
  entries: Record<string, string>;
  version: number;
};

export type GlobalDictsState = {
  name: Record<string, string>;
  vp: Record<string, string>;
  version: number;
};

export type BookNameHistoryRow = {
  event_id: string;
  book_id: string;
  set_name: string;
  action_type: string;
  source_text: string;
  target_text: string;
  previous_target_text: string;
  origin: string;
  chapter_id: string;
  created_at: string;
};

export type TranslatedChapterView = {
  book_id: number;
  chapter_index: number;
  chapter_id: string;
  title_raw: string;
  title_translated: string;
  raw_text: string;
  translated_text: string;
  translation_mode: string;
  trans_sig: string;
  unit_count: number;
  name_hit_count: number;
  active_set: string;
  name_set_version: number;
  cache_hit_count: number;
  missing_count: number;
};

export type SourceCandidateScore = {
  source: string;
  score: number;
};

export type SelectionNameMapResult = {
  selected_text: string;
  source_candidate: string;
  target_candidate: string;
  match_type: string;
  score: number;
  source_context: string;
  translated_context: string;
  unit_start: number;
  unit_end: number;
  name_suggestions: string[];
  candidates: SourceCandidateScore[];
};

export type SelectionSourceSegmentResult = {
  selected_text: string;
  source_candidate: string;
  translated_candidate: string;
  match_type: string;
  source_context: string;
  translated_context: string;
  source_start: number;
  source_end: number;
  target_start: number;
  target_end: number;
  candidates: SourceCandidateScore[];
};

export type NameSuggestItem = {
  index: number;
  source_text: string;
  han_viet: string;
  google_translate_url: string;
  google_search_url: string;
};

export type NameRightSuggestion = {
  index: number;
  source_text: string;
  target_text: string;
  origin: string;
  score: number;
};

export type NameSuggestResponse = {
  source_text: string;
  han_viet_raw: string;
  items: NameSuggestItem[];
  right_items: NameRightSuggestion[];
};

export type TranslationCacheStats = {
  translation_memory_count: number;
  translation_unit_map_count: number;
  chapter_cache_count: number;
};

export type ClearTranslationCacheOutcome = {
  tm_deleted: number;
  unit_map_deleted: number;
  chapter_cache_deleted: number;
};

export const getTranslateServerConfig = () =>
  invoke<TranslateBatchConfig>('get_translate_server_config');
export const saveTranslateServerConfig = (config: TranslateBatchConfig) =>
  invoke<TranslateBatchConfig>('save_translate_server_config', { config });
export const getReaderNameSets = (bookId: number | null) =>
  invoke<NameSetState>('get_reader_name_sets', { bookId });
export const saveReaderNameSets = (request: {
  book_id: number | null;
  sets: Record<string, Record<string, string>>;
  active_set?: string | null;
  bump_version?: boolean;
  origin?: string | null;
  chapter_index?: number | null;
}) => invoke<NameSetState>('save_reader_name_sets', { request });
export const updateReaderNameEntry = (request: {
  book_id: number | null;
  source: string;
  target: string;
  set_name?: string | null;
  delete?: boolean;
  chapter_index?: number | null;
  origin?: string | null;
}) => invoke<NameSetState>('update_reader_name_entry', { request });
export const importReaderNameSetText = (
  bookId: number | null,
  setName: string | null,
  rawText: string,
  replace: boolean,
) => invoke<NameSetState>('import_reader_name_set_text', { bookId, setName, rawText, replace });
export const exportReaderNameSetText = (bookId: number | null, setName: string | null) =>
  invoke<string>('export_reader_name_set_text', { bookId, setName });
export const listReaderNameHistory = (bookId: number, limit?: number) =>
  invoke<BookNameHistoryRow[]>('list_reader_name_history', { bookId, limit: limit ?? 100 });
export const getReaderBookVpSet = (bookId: number) =>
  invoke<VpSetState>('get_reader_book_vp_set', { bookId });
export const updateReaderBookVpEntry = (
  bookId: number,
  source: string,
  target: string,
  del = false,
) => invoke<VpSetState>('update_reader_book_vp_entry', { bookId, source, target, delete: del });
export const getReaderGlobalDicts = () => invoke<GlobalDictsState>('get_reader_global_dicts');
export const saveReaderGlobalDicts = (
  name?: Record<string, string> | null,
  vp?: Record<string, string> | null,
) => invoke<GlobalDictsState>('save_reader_global_dicts', { name: name ?? null, vp: vp ?? null });
export const translateLibraryChapter = (
  bookId: number,
  chapterIndex: number,
  translationMode: TranslationMode = 'server',
  forceReload = false,
) =>
  invoke<TranslatedChapterView>('translate_library_chapter', {
    bookId,
    chapterIndex,
    translationMode,
    forceReload,
  });
export const reloadReaderChapterTranslation = (
  bookId: number,
  chapterIndex: number,
  translationMode: TranslationMode = 'server',
) =>
  invoke<TranslatedChapterView>('reload_reader_chapter_translation', {
    bookId,
    chapterIndex,
    translationMode,
  });
export const mapReaderSelectionToName = (request: {
  book_id: number;
  chapter_index: number;
  selected_text: string;
  start_offset: number;
  end_offset: number;
  translation_mode: TranslationMode;
  translated_text: string;
}) => invoke<SelectionNameMapResult>('map_reader_selection_to_name', { request });
export const mapReaderSelectionToSource = (request: {
  book_id: number;
  chapter_index: number;
  selected_text: string;
  start_offset: number;
  end_offset: number;
  translation_mode: TranslationMode;
  translated_text: string;
}) => invoke<SelectionSourceSegmentResult>('map_reader_selection_to_source', { request });
export const suggestReaderName = (request: {
  source_text: string;
  book_id: number | null;
  set_name?: string | null;
  dict_type?: string;
  scope?: string;
}) => invoke<NameSuggestResponse>('suggest_reader_name', { request });
export const getReaderTranslationCacheStats = () =>
  invoke<TranslationCacheStats>('get_reader_translation_cache_stats');
export const clearReaderTranslationCache = () =>
  invoke<ClearTranslationCacheOutcome>('clear_reader_translation_cache');

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

export type VBookExtensionType =
  | 'novel'
  | 'chinese_novel'
  | 'comic'
  | 'video'
  | 'audio'
  | 'tts'
  | 'translate'
  | 'ai'
  | 'forum'
  | 'news'
  | 'unknown';

export type ExtensionRepo = {
  url: string;
  name: string;
  author: string;
  description: string;
  enabled: boolean;
  locked: boolean;
  last_synced_at: number;
  last_error: string | null;
  plugin_count: number;
};

export type RemoteExtension = {
  id: string;
  name: string;
  author: string;
  version: number;
  source: string;
  host: string;
  icon: string;
  description: string;
  ext_type: VBookExtensionType;
  locale: string;
  language: string;
  country: string;
  is_nsfw: boolean;
  path: string;
  repo_url: string;
};

export type InstalledExtension = {
  id: string;
  name: string;
  author: string;
  version: number;
  source: string;
  host: string;
  regexp: string;
  icon_data_url: string;
  description: string;
  locale: string;
  ext_type: VBookExtensionType;
  is_nsfw: boolean;
  is_local: boolean;
  is_encrypted: boolean;
  pinned: boolean;
  source_url: string;
  repo_url: string;
  scripts: Record<string, string>;
  config_schema: Record<string, unknown>;
  actions: Record<string, unknown>;
  user_config: Record<string, unknown>;
  local_storage: Record<string, string>;
  created_at: number;
  updated_at: number;
};

export type ExtensionUpdate = {
  installed_id: string;
  remote: RemoteExtension;
  installed_version: number;
  remote_version: number;
};

export type CatalogExtensionView = {
  remote: RemoteExtension;
  installed: boolean;
  installed_id: string | null;
  installed_version: number | null;
  update_available: boolean;
};

export type VBookWorkspaceSnapshot = {
  repos: ExtensionRepo[];
  updates: ExtensionUpdate[];
  installed: InstalledExtension[];
  catalog: CatalogExtensionView[];
  types: string[];
  languages: string[];
  authors: string[];
};

export type VBookRefreshError = {
  repo_url: string;
  message: string;
};

export type VBookRefreshResult = {
  snapshot: VBookWorkspaceSnapshot;
  errors: VBookRefreshError[];
  fetched_repos: number;
  total_remote: number;
};

export type VBookBatchUpdateResult = {
  snapshot: VBookWorkspaceSnapshot;
  updated_ids: string[];
  failed: VBookRefreshError[];
};

export const vbookGetSnapshot = () => invoke<VBookWorkspaceSnapshot>('vbook_get_snapshot');
export const vbookAddRepo = (url: string) =>
  invoke<VBookWorkspaceSnapshot>('vbook_add_repo', { url });
export const vbookRemoveRepo = (url: string) =>
  invoke<VBookWorkspaceSnapshot>('vbook_remove_repo', { url });
export const vbookToggleRepo = (url: string, enabled: boolean) =>
  invoke<VBookWorkspaceSnapshot>('vbook_toggle_repo', { url, enabled });
export const vbookRefreshRepos = () => invoke<VBookRefreshResult>('vbook_refresh_repos');
export const vbookInstallFromUrl = (url: string, targetInstalledId: string | null = null) =>
  invoke<InstalledExtension>('vbook_install_from_url', { url, targetInstalledId });
export const vbookUpdateExtension = (installedId: string) =>
  invoke<InstalledExtension>('vbook_update_extension', { installedId });
export const vbookUpdateAll = () => invoke<VBookBatchUpdateResult>('vbook_update_all');
export const vbookPickAndInstallLocalZip = () =>
  invoke<InstalledExtension | null>('vbook_pick_and_install_local_zip');
export const vbookUninstallExtension = (installedId: string) =>
  invoke<VBookWorkspaceSnapshot>('vbook_uninstall_extension', { installedId });
export const vbookTogglePinExtension = (installedId: string, pinned: boolean) =>
  invoke<VBookWorkspaceSnapshot>('vbook_toggle_pin_extension', { installedId, pinned });
export const vbookSaveExtensionConfig = (installedId: string, configJson: string) =>
  invoke<InstalledExtension>('vbook_save_extension_config', { installedId, configJson });

export type VBookRunnerStatus = {
  ready: boolean;
  mock_mode: boolean;
  browser_bridge_ready?: boolean;
  java_path: string | null;
  jar_path: string | null;
  message: string;
};

export type VBookSearchItem = {
  name: string;
  link: string;
  cover: string;
  description: string;
  host: string;
  item_type: string;
};

export type VBookSearchPage = {
  items: VBookSearchItem[];
  next: string | null;
};

export type VBookDetail = {
  name: string;
  cover: string;
  host: string;
  author: string;
  description: string;
  detail_html: string;
  detail_text: string;
  ongoing: boolean | null;
  genres: string[];
  detail_type: string;
  format: string;
  url: string;
};

export type VBookTocItem = {
  name: string;
  url: string;
  host: string;
  pay: boolean;
  item_type: string;
  index: number;
};

export type VBookMediaImage = {
  url: string;
  headers: Record<string, string>;
};

export type VBookTrackEntry = {
  title: string;
  data: string;
  quality: string;
  track_type: string;
  subtitles: unknown[];
  raw: unknown;
};

export type VBookChapterContent =
  | { kind: 'novel'; html: string; text: string; title: string }
  | { kind: 'comic'; images: VBookMediaImage[] }
  | { kind: 'media_tracks'; media_kind: string; tracks: VBookTrackEntry[] }
  | { kind: 'raw'; data: unknown };

export type VBookResolvedTrack = {
  data: string;
  title: string;
  track_type: string;
  mime_type: string;
  headers: Record<string, string>;
  subtitles: unknown[];
  audios: unknown[];
  lyrics: unknown[];
  time_skip: unknown[];
  raw: unknown;
};

export type VBookTtsVoice = {
  id: string;
  name: string;
  language: string;
};

export type VBookTtsAudio = {
  base64_data: string;
  mime_type: string;
  byte_len: number;
};

export type VBookTranslateOption = {
  id: string;
  name: string;
  direction: string;
  description: string;
};

export type VBookTranslateMeta = {
  languages: VBookTranslateOption[];
  models: VBookTranslateOption[];
  styles: VBookTranslateOption[];
};

export type VBookTranslateResult = {
  text: string;
  segments: unknown[];
};

export type VBookChatMessage = {
  role: string;
  content: string;
};

export type VBookAiReply = {
  text: string;
  model: string;
};

export type VBookRunnerRuntimeConfig = {
  custom_java_path: string | null;
};

export type LibraryStats = {
  book_count: number;
  txt_count: number;
  zip_count: number;
  measured_books: number;
  total_chapters: number;
  total_words: number;
  total_chars: number;
  total_source_bytes: number;
  total_compressed_bytes: number;
  compression_ratio_percent: number;
  elapsed_ms: number;
};

export const vbookRunnerStatus = () => invoke<VBookRunnerStatus>('vbook_runner_status');
export const vbookInstallJava = () => invoke<VBookRunnerStatus | null>('vbook_install_java');
export const vbookGetRuntimeConfig = () =>
  invoke<VBookRunnerRuntimeConfig>('vbook_get_runtime_config');
export const vbookSetCustomJavaPath = (path: string | null) =>
  invoke<VBookRunnerStatus>('vbook_set_custom_java_path', { path });
export const vbookPickCustomJavaPath = () =>
  invoke<VBookRunnerStatus | null>('vbook_pick_custom_java_path');
export const getLibraryStats = (refreshStale = false) =>
  invoke<LibraryStats>('library_stats', { refreshStale });
export const vbookSearch = (installedId: string, query: string, page: string | null = null) =>
  invoke<VBookSearchPage>('vbook_search', { installedId, query, page });
export const vbookDetail = (installedId: string, url: string) =>
  invoke<VBookDetail>('vbook_detail', { installedId, url });
export const vbookToc = (installedId: string, bookUrl: string) =>
  invoke<VBookTocItem[]>('vbook_toc', { installedId, bookUrl });
export const vbookChap = (
  installedId: string,
  chapterUrl: string,
  contentTypeHint: string | null = null,
) => invoke<VBookChapterContent>('vbook_chap', { installedId, chapterUrl, contentTypeHint });
export const vbookResolveTrack = (installedId: string, trackData: string) =>
  invoke<VBookResolvedTrack>('vbook_resolve_track', { installedId, trackData });
export const vbookTtsVoices = (installedId: string) =>
  invoke<VBookTtsVoice[]>('vbook_tts_voices', { installedId });
export const vbookTtsSynthesize = (installedId: string, text: string, voiceId: string) =>
  invoke<VBookTtsAudio>('vbook_tts_synthesize', { installedId, text, voiceId });
export const vbookTranslateMeta = (installedId: string) =>
  invoke<VBookTranslateMeta>('vbook_translate_meta', { installedId });
export const vbookTranslateText = (
  installedId: string,
  text: string,
  from: string,
  to: string,
  source: string,
  model: string,
  style: string,
) => invoke<VBookTranslateResult>('vbook_translate_text', { installedId, text, from, to, source, model, style });
export const vbookAiChat = (
  installedId: string,
  messages: VBookChatMessage[],
  selectedModel: string,
) => invoke<VBookAiReply>('vbook_ai_chat', { installedId, messages, selectedModel });
export const vbookSaveChapterToLibrary = (
  bookTitle: string,
  chapterTitle: string,
  content: string,
) =>
  invoke<{ entries: LibraryItem[]; added: number }>('vbook_save_chapter_to_library', {
    bookTitle,
    chapterTitle,
    content,
  });

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
