import { initShell } from "../site_common.js?v=20260421-cacheraw1";
import { normalizeDisplayTitle } from "../reader_text.js?v=20260403-exportq1";

const refs = {
  historyTitle: document.getElementById("history-title"),
  historyCount: document.getElementById("history-count"),
  historyGrid: document.getElementById("history-grid"),
  historyEmpty: document.getElementById("history-empty"),

  libraryTitle: document.getElementById("library-title"),
  libraryCount: document.getElementById("library-count"),
  libraryListScroll: document.getElementById("library-list-scroll"),
  libraryGrid: document.getElementById("library-grid"),
  libraryLoadMoreStatus: document.getElementById("library-load-more-status"),
  libraryLoadMoreSentinel: document.getElementById("library-load-more-sentinel"),
  libraryEmpty: document.getElementById("library-empty"),
  btnLibraryFilter: document.getElementById("btn-library-filter"),
  libraryFilterLabel: document.getElementById("library-filter-label"),
  libraryFilterCount: document.getElementById("library-filter-count"),
  btnManageCategories: document.getElementById("btn-manage-categories"),
  downloadJobsTitle: document.getElementById("download-jobs-title"),
  downloadJobsCount: document.getElementById("download-jobs-count"),
  downloadJobsList: document.getElementById("download-jobs-list"),
  downloadJobsEmpty: document.getElementById("download-jobs-empty"),
  exportJobsTitle: document.getElementById("export-jobs-title"),
  exportJobsCount: document.getElementById("export-jobs-count"),
  exportJobsList: document.getElementById("export-jobs-list"),
  exportJobsEmpty: document.getElementById("export-jobs-empty"),
  exportJobsSearchLabel: document.getElementById("export-jobs-search-label"),
  exportJobsSearchInput: document.getElementById("export-jobs-search-input"),
  exportJobsFormatLabel: document.getElementById("export-jobs-format-label"),
  exportJobsFormatFilter: document.getElementById("export-jobs-format-filter"),
  exportJobsDateFromLabel: document.getElementById("export-jobs-date-from-label"),
  exportJobsDateFrom: document.getElementById("export-jobs-date-from"),
  exportJobsDateToLabel: document.getElementById("export-jobs-date-to-label"),
  exportJobsDateTo: document.getElementById("export-jobs-date-to"),
  btnExportJobsFilterClear: document.getElementById("btn-export-jobs-filter-clear"),
  exportJobsSummary: document.getElementById("export-jobs-summary"),
  exportJobsPageSummary: document.getElementById("export-jobs-page-summary"),
  btnExportJobsPrev: document.getElementById("btn-export-jobs-prev"),
  btnExportJobsNext: document.getElementById("btn-export-jobs-next"),

  bookActionsDialog: document.getElementById("book-actions-dialog"),
  bookActionsTitle: document.getElementById("book-actions-title"),
  bookActionsSubtitle: document.getElementById("book-actions-subtitle"),
  bookActionsCategoriesRow: document.getElementById("book-actions-categories-row"),
  bookActionsCategoriesLabel: document.getElementById("book-actions-categories-label"),
  bookActionsCategoriesList: document.getElementById("book-actions-categories-list"),
  btnBookActionsCategories: document.getElementById("btn-book-actions-categories"),
  btnCloseBookActions: document.getElementById("btn-close-book-actions"),
  btnActionOpenBook: document.getElementById("btn-action-open-book"),
  btnActionOpenReader: document.getElementById("btn-action-open-reader"),
  btnActionCheckUpdates: document.getElementById("btn-action-check-updates"),
  btnActionDownload: document.getElementById("btn-action-download"),
  btnActionExport: document.getElementById("btn-action-export"),
  btnActionDeleteBook: document.getElementById("btn-action-delete-book"),

  exportDialog: document.getElementById("export-dialog"),
  exportDialogTitle: document.getElementById("export-dialog-title"),
  exportDialogSubtitle: document.getElementById("export-dialog-subtitle"),
  btnCloseExportDialog: document.getElementById("btn-close-export-dialog"),
  btnCancelExportDialog: document.getElementById("btn-cancel-export-dialog"),
  btnSubmitExportDialog: document.getElementById("btn-submit-export-dialog"),
  exportCover: document.getElementById("export-cover"),
  exportBookKind: document.getElementById("export-book-kind"),
  exportBookCounts: document.getElementById("export-book-counts"),
  exportMetaTitleLabel: document.getElementById("export-meta-title-label"),
  exportMetaTitle: document.getElementById("export-meta-title"),
  exportMetaAuthorLabel: document.getElementById("export-meta-author-label"),
  exportMetaAuthor: document.getElementById("export-meta-author"),
  exportMetaSummaryLabel: document.getElementById("export-meta-summary-label"),
  exportMetaSummary: document.getElementById("export-meta-summary"),
  exportIncludeCategories: document.getElementById("export-include-categories"),
  exportIncludeCategoriesLabel: document.getElementById("export-include-categories-label"),
  exportFormatLabel: document.getElementById("export-format-label"),
  exportFormatSelect: document.getElementById("export-format-select"),
  exportOptionsList: document.getElementById("export-options-list"),
  exportUseCachedOnly: document.getElementById("export-use-cached-only"),
  exportUseCachedOnlyLabel: document.getElementById("export-use-cached-only-label"),
  exportChaptersTitle: document.getElementById("export-chapters-title"),
  exportChapterStats: document.getElementById("export-chapter-stats"),
  exportRangeStartLabel: document.getElementById("export-range-start-label"),
  exportRangeStartSelect: document.getElementById("export-range-start-select"),
  exportRangeEndLabel: document.getElementById("export-range-end-label"),
  exportRangeEndSelect: document.getElementById("export-range-end-select"),
  exportChapterHint: document.getElementById("export-chapter-hint"),
  exportChapterList: document.getElementById("export-chapter-list"),

  libraryCategoryFilterDialog: document.getElementById("library-category-filter-dialog"),
  libraryCategoryFilterTitle: document.getElementById("library-category-filter-title"),
  btnCloseLibraryCategoryFilter: document.getElementById("btn-close-library-category-filter"),
  libraryCategoryFilterHint: document.getElementById("library-category-filter-hint"),
  libraryAuthorFilterLabel: document.getElementById("library-author-filter-label"),
  libraryAuthorFilterInput: document.getElementById("library-author-filter-input"),
  libraryCategoryMatchModeLabel: document.getElementById("library-category-match-mode-label"),
  libraryCategoryMatchModeSelect: document.getElementById("library-category-match-mode-select"),
  libraryCategoryFilterSearchLabel: document.getElementById("library-category-filter-search-label"),
  libraryCategoryFilterSearch: document.getElementById("library-category-filter-search"),
  libraryCategoryIncludeTitle: document.getElementById("library-category-include-title"),
  libraryCategoryIncludeCount: document.getElementById("library-category-include-count"),
  libraryCategoryFilterIncludeList: document.getElementById("library-category-filter-include-list"),
  libraryCategoryExcludeTitle: document.getElementById("library-category-exclude-title"),
  libraryCategoryExcludeCount: document.getElementById("library-category-exclude-count"),
  libraryCategoryFilterExcludeList: document.getElementById("library-category-filter-exclude-list"),
  libraryCategoryFilterEmpty: document.getElementById("library-category-filter-empty"),
  btnLibraryCategoryFilterClear: document.getElementById("btn-library-category-filter-clear"),
  btnLibraryCategoryFilterApply: document.getElementById("btn-library-category-filter-apply"),

  categoryManagerDialog: document.getElementById("category-manager-dialog"),
  categoryManagerTitle: document.getElementById("category-manager-title"),
  btnCloseCategoryManager: document.getElementById("btn-close-category-manager"),
  categoryManagerHint: document.getElementById("category-manager-hint"),
  categoryManagerSearchLabel: document.getElementById("category-manager-search-label"),
  categoryManagerSearchInput: document.getElementById("category-manager-search-input"),
  categoryManagerList: document.getElementById("category-manager-list"),
  categoryManagerEmpty: document.getElementById("category-manager-empty"),
  categoryManagerForm: document.getElementById("category-manager-form"),
  categoryManagerNameLabel: document.getElementById("category-manager-name-label"),
  categoryManagerNameInput: document.getElementById("category-manager-name-input"),
  btnCategoryCreate: document.getElementById("btn-category-create"),
  btnCategoryRename: document.getElementById("btn-category-rename"),
  btnCategoryDelete: document.getElementById("btn-category-delete"),
  categoryManagerBooksTitle: document.getElementById("category-manager-books-title"),
  categoryManagerBooksSearchLabel: document.getElementById("category-manager-books-search-label"),
  categoryManagerBooksSearchInput: document.getElementById("category-manager-books-search-input"),
  categoryManagerBooksSelectAll: document.getElementById("category-manager-books-select-all"),
  categoryManagerBooksSelectAllLabel: document.getElementById("category-manager-books-select-all-label"),
  btnCategoryManagerAddBooks: document.getElementById("btn-category-manager-add-books"),
  btnCategoryManagerRemoveBooks: document.getElementById("btn-category-manager-remove-books"),
  categoryManagerBooksList: document.getElementById("category-manager-books-list"),
  categoryManagerBooksEmpty: document.getElementById("category-manager-books-empty"),

  bookCategoriesDialog: document.getElementById("book-categories-dialog"),
  bookCategoriesTitle: document.getElementById("book-categories-title"),
  btnCloseBookCategories: document.getElementById("btn-close-book-categories"),
  bookCategoriesSubtitle: document.getElementById("book-categories-subtitle"),
  bookCategoriesSearchLabel: document.getElementById("book-categories-search-label"),
  bookCategoriesSearchInput: document.getElementById("book-categories-search-input"),
  bookCategoriesList: document.getElementById("book-categories-list"),
  bookCategoriesEmpty: document.getElementById("book-categories-empty"),
  btnCancelBookCategories: document.getElementById("btn-cancel-book-categories"),
  btnSaveBookCategories: document.getElementById("btn-save-book-categories"),

  btnOpenGlobalJunk: document.getElementById("btn-open-global-junk"),
  globalJunkDialog: document.getElementById("global-junk-dialog"),
  globalJunkTitle: document.getElementById("global-junk-title"),
  btnCloseGlobalJunk: document.getElementById("btn-close-global-junk"),
  globalJunkTopHint: document.getElementById("global-junk-top-hint"),
  btnRefreshGlobalJunk: document.getElementById("btn-refresh-global-junk"),
  globalJunkLineLabel: document.getElementById("global-junk-line-label"),
  globalJunkLineInput: document.getElementById("global-junk-line-input"),
  globalJunkRegexInput: document.getElementById("global-junk-regex-input"),
  globalJunkRegexLabel: document.getElementById("global-junk-regex-label"),
  globalJunkIgnoreCaseInput: document.getElementById("global-junk-ignore-case-input"),
  globalJunkIgnoreCaseLabel: document.getElementById("global-junk-ignore-case-label"),
  globalJunkEntryForm: document.getElementById("global-junk-entry-form"),
  btnAddGlobalJunkEntry: document.getElementById("btn-add-global-junk-entry"),
  globalJunkHint: document.getElementById("global-junk-hint"),
  globalJunkColLine: document.getElementById("global-junk-col-line"),
  globalJunkColAction: document.getElementById("global-junk-col-action"),
  globalJunkBody: document.getElementById("global-junk-body"),

  btnOpenGlobalDicts: document.getElementById("btn-open-global-dicts"),
  globalDictsDialog: document.getElementById("global-dicts-dialog"),
  globalDictsTitle: document.getElementById("global-dicts-title"),
  btnCloseGlobalDicts: document.getElementById("btn-close-global-dicts"),
  globalDictsTypeLabel: document.getElementById("global-dicts-type-label"),
  globalDictsTypeSelect: document.getElementById("global-dicts-type-select"),
  btnRefreshGlobalDicts: document.getElementById("btn-refresh-global-dicts"),
  globalDictsSourceLabel: document.getElementById("global-dicts-source-label"),
  globalDictsSourceInput: document.getElementById("global-dicts-source-input"),
  globalDictsTargetLabel: document.getElementById("global-dicts-target-label"),
  globalDictsTargetInput: document.getElementById("global-dicts-target-input"),
  globalDictsEntryForm: document.getElementById("global-dicts-entry-form"),
  btnAddGlobalDictEntry: document.getElementById("btn-add-global-dict-entry"),
  globalDictsHint: document.getElementById("global-dicts-hint"),
  globalDictsColSource: document.getElementById("global-dicts-col-source"),
  globalDictsColTarget: document.getElementById("global-dicts-col-target"),
  globalDictsColAction: document.getElementById("global-dicts-col-action"),
  globalDictsBody: document.getElementById("global-dicts-body"),

  btnImportCustomize: document.getElementById("btn-import-customize"),
  importDialog: document.getElementById("import-dialog"),
  importForm: document.getElementById("import-form"),
  importFileInput: document.getElementById("import-file"),
  importModeSelect: document.getElementById("import-mode-select"),
  importBatchNote: document.getElementById("import-batch-note"),
  importLangInput: document.getElementById("import-lang"),
  importBookTitleInput: document.getElementById("import-book-title"),
  importAuthorInput: document.getElementById("import-author"),
  importSkipPrepareInput: document.getElementById("import-skip-prepare"),
  importCategoriesLabel: document.getElementById("import-categories-label"),
  importCategoriesCount: document.getElementById("import-categories-count"),
  btnImportCategoriesClear: document.getElementById("btn-import-categories-clear"),
  importCategoriesHint: document.getElementById("import-categories-hint"),
  importCategoriesSearchLabel: document.getElementById("import-categories-search-label"),
  importCategoriesSearchInput: document.getElementById("import-categories-search"),
  importCategoriesList: document.getElementById("import-categories-list"),
  importCategoriesEmpty: document.getElementById("import-categories-empty"),
  importCustomizeDialog: document.getElementById("import-customize-dialog"),
  btnImportCustomizeClose: document.getElementById("btn-import-customize-close"),
  importCustomizeForm: document.getElementById("import-customize-form"),
  btnImportCustomizeReset: document.getElementById("btn-import-customize-reset"),
  importHeadingPatternsInput: document.getElementById("import-heading-patterns-input"),
  importTargetSizeInput: document.getElementById("import-target-size-input"),
  importPrefaceTitleInput: document.getElementById("import-preface-title-input"),
  importHeadingPresets: document.getElementById("import-heading-presets"),
  importEpubTitleKeysInput: document.getElementById("import-epub-title-keys-input"),
  importEpubAuthorKeysInput: document.getElementById("import-epub-author-keys-input"),
  importEpubSummaryKeysInput: document.getElementById("import-epub-summary-keys-input"),
  importEpubLanguageKeysInput: document.getElementById("import-epub-language-keys-input"),
  importEpubCoverMetaInput: document.getElementById("import-epub-cover-meta-input"),
  importEpubCoverPropsInput: document.getElementById("import-epub-cover-props-input"),
  importEpubPresets: document.getElementById("import-epub-presets"),

  importPreviewDialog: document.getElementById("import-preview-dialog"),
  btnImportPreviewClose: document.getElementById("btn-import-preview-close"),
  btnImportPreviewCancel: document.getElementById("btn-import-preview-cancel"),
  btnImportPreviewCommit: document.getElementById("btn-import-preview-commit"),
  importPreviewFileName: document.getElementById("import-preview-file-name"),
  importPreviewFileType: document.getElementById("import-preview-file-type"),
  importPreviewChapterCount: document.getElementById("import-preview-chapter-count"),
  importPreviewDetectedLang: document.getElementById("import-preview-detected-lang"),
  importPreviewBookTitleInput: document.getElementById("import-preview-book-title-input"),
  importPreviewAuthorInput: document.getElementById("import-preview-author-input"),
  importPreviewSummaryInput: document.getElementById("import-preview-summary-input"),
  importPreviewLangSelect: document.getElementById("import-preview-lang-select"),
  importPreviewDiagnostics: document.getElementById("import-preview-diagnostics"),
  importPreviewMetadataCandidates: document.getElementById("import-preview-metadata-candidates"),
  importPreviewChapters: document.getElementById("import-preview-chapters"),
  importBatchDialog: document.getElementById("import-batch-dialog"),
  importBatchTitle: document.getElementById("import-batch-title"),
  btnImportBatchClose: document.getElementById("btn-import-batch-close"),
  importBatchHint: document.getElementById("import-batch-hint"),
  importBatchSummary: document.getElementById("import-batch-summary"),
  importBatchGrid: document.getElementById("import-batch-grid"),
  importBatchEmpty: document.getElementById("import-batch-empty"),
  btnImportBatchCancel: document.getElementById("btn-import-batch-cancel"),
  btnImportBatchCommit: document.getElementById("btn-import-batch-commit"),
  importProgressDialog: document.getElementById("import-progress-dialog"),
  importProgressTitle: document.getElementById("import-progress-title"),
  btnImportProgressHide: document.getElementById("btn-import-progress-hide"),
  importProgressHint: document.getElementById("import-progress-hint"),
  importProgressFill: document.getElementById("import-progress-fill"),
  importProgressSummary: document.getElementById("import-progress-summary"),
  importProgressStats: document.getElementById("import-progress-stats"),
  importProgressCurrentFile: document.getElementById("import-progress-current-file"),
};

const state = {
  historyItems: [],
  books: [],
  libraryTotalCount: 0,
  libraryHasMore: false,
  libraryNextOffset: 0,
  libraryPageSize: 48,
  libraryLoadingPage: false,
  libraryLoadingMode: "",
  libraryLoadRequestSeq: 0,
  libraryLoadObserver: null,
  libraryScrollFallbackBound: false,
  pendingImports: [],
  downloadJobs: [],
  downloadJobsSig: "",
  exportJobs: [],
  exportOptimisticJobs: [],
  exportJobsSig: "",
  exportJobsPage: 1,
  exportJobsPageSize: 8,
  exportJobsFilters: {
    search: "",
    format: "all",
    dateFrom: "",
    dateTo: "",
  },
  selectedBookId: null,
  deletingBookIds: new Set(),
  shell: null,
  categories: [],
  categoryMap: new Map(),
  selectedCategoryIds: [],
  selectedExcludedCategoryIds: [],
  selectedCategoryMatchMode: "or",
  selectedAuthorFilter: "",
  categoryFilterDraftIds: [],
  categoryFilterDraftExcludeIds: [],
  categoryFilterDraftMatchMode: "or",
  categorySectionExpanded: {},
  authorFilterDraft: "",
  categoryManagerBooks: [],
  categoryManagerBooksLoaded: false,
  categoryManagerBooksLoading: false,
  categoryManagerSelectedId: "",
  categoryManagerBookCheckedIds: new Set(),
  bookCategoriesDraftIds: [],
  bookCategoriesTargetBookId: "",
  translationEnabled: true,
  translationMode: "server",
  translationLocalSig: "{}",
  globalJunkLines: [],
  globalDicts: { name: {}, vp: {} },
  globalDictType: "name",
  downloadPollTimer: null,
  downloadEventSource: null,
  downloadStreamReconnectTimer: null,
  exportPollTimer: null,
  exportEventSource: null,
  exportStreamReconnectTimer: null,
  exportCodeTimer: null,
  exportJobsLoadedAt: 0,
  libraryRefreshBusy: false,
  lastLibraryRefreshTs: 0,
  importSettings: null,
  importPresets: null,
  importPreviewToken: "",
  importPreviewData: null,
  importPreviewContext: "single",
  importPreviewBatchItemId: "",
  importSelectedCategoryIds: [],
  batchImportItems: [],
  batchImportPrepareRunId: 0,
  batchImportCommitBusy: false,
  batchImportRenderTimer: 0,
  batchImportProgress: {
    active: false,
    total: 0,
    completed: 0,
    success: 0,
    failed: 0,
    currentFile: "",
    phase: "idle",
    title: "",
    hidden: false,
    notificationId: "",
    detail: "",
    errors: [],
    mode: "import",
    uploadBytesLoaded: 0,
    uploadBytesTotal: 0,
    finalHandled: false,
  },
  exportBookDetail: null,
  exportFormats: [],
  libraryRenderToken: 0,
  libraryCardObserver: null,
  libraryHydrateQueue: [],
  libraryHydrateFrame: 0,
  libraryCardRefreshQueue: [],
  libraryCardRefreshQueuedIds: new Set(),
  libraryCardRefreshBusy: false,
  libraryCardRefreshTimer: 0,
  libraryPendingTitleBookIds: new Set(),
  libraryTitlePollTimer: 0,
  libraryTitlePollInFlight: false,
};

const LIBRARY_LOADING_SKELETON_COUNT = 12;
const LIBRARY_INITIAL_HYDRATE_COUNT = 12;
const LIBRARY_HYDRATE_BATCH_SIZE = 8;
const BATCH_IMPORT_PREPARE_CONCURRENCY = 6;
const BATCH_IMPORT_COMMIT_CONCURRENCY = 3;
const EXPORT_JOBS_PAGE_SIZE = 8;
const CATEGORY_SECTION_USER_KEY = "user_custom";
const CATEGORY_SECTION_REMOVED_KEY = "removed_default";
const CATEGORY_SECTION_USER_ORDER = 1000;
const CATEGORY_SECTION_REMOVED_ORDER = 1100;

function localTranslationSettingsSignature(shell) {
  try {
    const data = shell && typeof shell.getTranslationLocalSettings === "function"
      ? shell.getTranslationLocalSettings()
      : {};
    return JSON.stringify(data || {});
  } catch {
    return "{}";
  }
}

function getErrorMessage(error) {
  if (!error) return state.shell ? state.shell.t("toastError") : "Có lỗi xảy ra.";
  return String(error.displayMessage || error.message || (state.shell ? state.shell.t("toastError") : "Có lỗi xảy ra."));
}

function getImportUploadWarningText() {
  return state.shell
    ? state.shell.t("importUploadWarning")
    : "Đừng tắt web hoặc trình duyệt trước khi tải file lên server xong.";
}

function extractUploadErrorDetail(details) {
  if (typeof details === "string") return details.trim();
  if (!details || typeof details !== "object") return "";
  for (const key of ["display_message", "user_message", "hint", "message"]) {
    const text = String(details[key] || "").trim();
    if (text) return text;
  }
  const nested = details.error;
  if (nested && typeof nested === "object") {
    for (const key of ["display_message", "user_message", "hint", "message"]) {
      const text = String(nested[key] || "").trim();
      if (text) return text;
    }
  }
  return "";
}

function buildImportUploadForm(file) {
  const form = new FormData();
  form.set("file", file, (file && file.name) || "import.txt");
  return form;
}

function uploadImportFileToServer(file, { onProgress = null } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/library/import/upload", true);
    xhr.responseType = "text";
    xhr.upload.addEventListener("progress", (event) => {
      if (typeof onProgress !== "function") return;
      const loaded = Math.max(0, Number(event && event.loaded || 0));
      const total = Math.max(0, Number(event && event.total || (file && file.size) || 0));
      onProgress({
        loaded,
        total,
        lengthComputable: Boolean(event && event.lengthComputable),
      });
    });
    xhr.onerror = () => {
      reject(new Error(state.shell ? state.shell.t("importUploadFailed") : "Tải file lên server thất bại."));
    };
    xhr.onabort = () => {
      reject(new Error(state.shell ? state.shell.t("importUploadCancelled") : "Đã hủy tải file lên server."));
    };
    xhr.onload = () => {
      let payload = null;
      try {
        payload = JSON.parse(xhr.responseText || "null");
      } catch {
        payload = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload || {});
        return;
      }
      const baseMessage = String((payload && payload.message) || `HTTP ${xhr.status}`);
      const error = new Error(baseMessage);
      error.status = xhr.status;
      error.errorCode = payload && payload.error_code;
      error.traceId = payload && payload.trace_id;
      error.details = payload && payload.details;
      const detailText = extractUploadErrorDetail(error.details);
      error.displayMessage = detailText && detailText !== baseMessage
        ? `${baseMessage}\n${detailText}`
        : baseMessage;
      reject(error);
    };
    xhr.send(buildImportUploadForm(file));
  });
}

function shouldSkipImportPrepare() {
  return Boolean(refs.importSkipPrepareInput && refs.importSkipPrepareInput.checked);
}

function ensureBatchImportNotificationId(prefix = "import_file") {
  const current = String((state.batchImportProgress && state.batchImportProgress.notificationId) || "").trim();
  if (current) return current;
  const created = state.shell && typeof state.shell.createNotificationTaskId === "function"
    ? state.shell.createNotificationTaskId(prefix)
    : `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  state.batchImportProgress.notificationId = created;
  return created;
}

function buildImportProgressPreview(progress) {
  const total = Math.max(0, Number((progress && progress.total) || 0));
  const completed = Math.max(0, Number((progress && progress.completed) || 0));
  const success = Math.max(0, Number((progress && progress.success) || 0));
  const failed = Math.max(0, Number((progress && progress.failed) || 0));
  if ((progress && progress.phase) === "finishing") {
    return `Đang hoàn tất nhập: ${success} thành công, ${failed} lỗi.`;
  }
  if (total > 0) {
    return `Đã xử lý ${completed}/${total} truyện • thành công ${success} • lỗi ${failed}`;
  }
  return "Đang nhập truyện vào thư viện...";
}

function buildImportProgressDetail(progress) {
  const lines = [];
  const title = String((progress && progress.title) || "").trim();
  const total = Math.max(0, Number((progress && progress.total) || 0));
  const completed = Math.max(0, Number((progress && progress.completed) || 0));
  const success = Math.max(0, Number((progress && progress.success) || 0));
  const failed = Math.max(0, Number((progress && progress.failed) || 0));
  if (title) lines.push(title);
  lines.push(`Đã xử lý: ${completed}/${total}`);
  lines.push(`Thành công: ${success}`);
  lines.push(`Thất bại: ${failed}`);
  if ((progress && progress.phase) === "finishing") {
    lines.push("Đang hoàn tất và gán danh mục...");
  }
  const currentFile = String((progress && progress.currentFile) || "").trim();
  if (currentFile) lines.push(`Đang xử lý: ${currentFile}`);
  const errorItems = Array.isArray(progress && progress.errors) ? progress.errors : [];
  if (errorItems.length) {
    lines.push("");
    lines.push("Các file lỗi:");
    for (const item of errorItems.slice(0, 12)) {
      lines.push(`- ${String(item.file_name || "").trim() || "Không rõ file"}: ${String(item.error || "").trim() || "Lỗi không rõ"}`);
    }
    if (errorItems.length > 12) {
      lines.push(`- ... còn ${errorItems.length - 12} file lỗi khác`);
    }
  }
  return lines.join("\n").trim();
}

async function syncBatchImportNotification({
  status = "running",
  title = "",
  kind = "import_file",
} = {}) {
  if (!state.shell || typeof state.shell.upsertNotificationTask !== "function") return;
  const progress = state.batchImportProgress || {};
  const notificationId = ensureBatchImportNotificationId(kind);
  try {
    await state.shell.upsertNotificationTask({
      id: notificationId,
      kind,
      topic: "import",
      topic_label: "Nhập vào thư viện",
      title: String(title || progress.title || "").trim() || "Nhập vào thư viện",
      preview: buildImportProgressPreview(progress),
      detail: buildImportProgressDetail(progress),
      status,
      progress_current: Math.max(0, Number(progress.completed || 0)),
      progress_total: Math.max(0, Number(progress.total || 0)),
      progress_percent: Math.max(0, Math.min(100, Number(progress.total || 0) > 0 ? (Number(progress.completed || 0) / Number(progress.total || 1)) * 100 : 0)),
    });
  } catch {
    // notification lỗi không chặn luồng import chính
  }
}

async function finalizeBatchImportNotification({
  status = "success",
  title = "",
  kind = "import_file",
} = {}) {
  if (!state.batchImportProgress) return;
  await syncBatchImportNotification({
    status,
    title: String(title || state.batchImportProgress.title || "").trim(),
    kind: String(kind || state.batchImportProgress.kind || "import_file").trim() || "import_file",
  });
}

function validateRegexPattern(pattern) {
  try {
    new RegExp(String(pattern || ""));
    return "";
  } catch (error) {
    return String(error && error.message || "Regex không hợp lệ.");
  }
}

function normalizeCategoryIds(values) {
  return Array.from(new Set(
    (Array.isArray(values) ? values : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean),
  ));
}

function normalizeCategoryItem(item) {
  return {
    ...(item && typeof item === "object" ? item : {}),
    category_id: String((item && item.category_id) || "").trim(),
    name: String((item && item.name) || "").trim(),
    book_count: Math.max(0, Number(item && item.book_count || 0)),
    is_user_category: Boolean(item && item.is_user_category),
    is_default_category: Boolean(item && item.is_default_category),
    is_default_removed: Boolean(item && item.is_default_removed),
    default_group_key: String((item && item.default_group_key) || "").trim(),
    default_group_label: String((item && item.default_group_label) || "").trim(),
    default_group_order: Number(item && item.default_group_order || 999),
    default_selection_mode: String((item && item.default_selection_mode) || "multi").trim().toLowerCase() === "single" ? "single" : "multi",
    default_input_name: String((item && item.default_input_name) || "").trim(),
    default_input_type: String((item && item.default_input_type) || "").trim(),
    default_subgroup_label: String((item && item.default_subgroup_label) || "").trim(),
    default_subgroup_order: Number(item && item.default_subgroup_order || 999),
    default_item_order: Number(item && item.default_item_order || 999999),
    default_source_id: String((item && item.default_source_id) || "").trim(),
  };
}

function normalizeAuthorFilterValue(value) {
  return String(value || "").trim();
}

function normalizeCategoryMatchMode(value) {
  return String(value || "").trim().toLowerCase() === "and" ? "and" : "or";
}

function buildDistinctCategoryFilters(includeValues, excludeValues) {
  const include = normalizeCategoryIds(includeValues);
  const includeSet = new Set(include);
  const exclude = normalizeCategoryIds(excludeValues).filter((item) => !includeSet.has(item));
  return { include, exclude };
}

function getCategoryById(categoryId) {
  const id = String(categoryId || "").trim();
  if (!id) return null;
  return (state.categoryMap instanceof Map ? state.categoryMap.get(id) : null) || null;
}

function getCategorySingleSelectionGroupKey(category) {
  const item = normalizeCategoryItem(category);
  if (!item.category_id || !item.is_default_category) return "";
  if (item.default_selection_mode !== "single") return "";
  return String(item.default_group_key || "").trim().toLowerCase();
}

function applySingleSelectionRules(categoryIds) {
  const normalized = normalizeCategoryIds(categoryIds);
  const lastChoiceByGroup = new Map();
  for (const categoryId of normalized) {
    const groupKey = getCategorySingleSelectionGroupKey(getCategoryById(categoryId));
    if (groupKey) lastChoiceByGroup.set(groupKey, categoryId);
  }
  return normalized.filter((categoryId) => {
    const groupKey = getCategorySingleSelectionGroupKey(getCategoryById(categoryId));
    return !groupKey || lastChoiceByGroup.get(groupKey) === categoryId;
  });
}

function toggleCategoryIdWithRules(currentIds, categoryId) {
  const id = String(categoryId || "").trim();
  if (!id) return applySingleSelectionRules(currentIds);
  const next = new Set(normalizeCategoryIds(currentIds));
  if (next.has(id)) {
    next.delete(id);
    return Array.from(next);
  }
  const groupKey = getCategorySingleSelectionGroupKey(getCategoryById(id));
  if (groupKey) {
    for (const category of state.categories || []) {
      if (getCategorySingleSelectionGroupKey(category) === groupKey) {
        next.delete(String((category && category.category_id) || "").trim());
      }
    }
  }
  next.add(id);
  return applySingleSelectionRules(Array.from(next));
}

function categoryMatchesSearch(category, term) {
  const needle = String(term || "").trim().toLowerCase();
  if (!needle) return true;
  const item = normalizeCategoryItem(category);
  return [
    item.name,
    item.default_group_label,
    item.default_subgroup_label,
  ].some((value) => String(value || "").trim().toLowerCase().includes(needle));
}

function compareCategoriesForDisplay(left, right) {
  const a = normalizeCategoryItem(left);
  const b = normalizeCategoryItem(right);
  return a.default_group_order - b.default_group_order
    || a.default_subgroup_order - b.default_subgroup_order
    || a.default_item_order - b.default_item_order
    || String(a.name || "").localeCompare(String(b.name || ""), "vi", { sensitivity: "base" });
}

function getCategoryDisplaySections(category) {
  const item = normalizeCategoryItem(category);
  const sections = [];
  if (item.is_default_category && item.default_group_key) {
    sections.push({
      section_key: `default:${item.default_group_key}`,
      section_label: item.default_group_label || item.default_group_key,
      section_order: Number(item.default_group_order || 999),
      subgroup_label: item.default_subgroup_label || "",
      subgroup_order: Number(item.default_subgroup_order || 999),
    });
  }
  if (item.is_user_category) {
    sections.push({
      section_key: CATEGORY_SECTION_USER_KEY,
      section_label: state.shell ? state.shell.t("categorySectionUser") : "Danh mục của bạn",
      section_order: CATEGORY_SECTION_USER_ORDER,
      subgroup_label: "",
      subgroup_order: 999,
    });
  }
  if (item.is_default_removed) {
    sections.push({
      section_key: CATEGORY_SECTION_REMOVED_KEY,
      section_label: state.shell ? state.shell.t("categorySectionRemovedDefault") : "Danh mục bị xóa khỏi mặc định",
      section_order: CATEGORY_SECTION_REMOVED_ORDER,
      subgroup_label: "",
      subgroup_order: 999,
    });
  }
  return sections;
}

function buildVisibleCategorySections(term) {
  const sectionsByKey = new Map();
  for (const raw of state.categories || []) {
    const category = normalizeCategoryItem(raw);
    if (!category.category_id || !categoryMatchesSearch(category, term)) continue;
    for (const sectionEntry of getCategoryDisplaySections(category)) {
      let section = sectionsByKey.get(sectionEntry.section_key);
      if (!section) {
        section = {
          key: sectionEntry.section_key,
          label: sectionEntry.section_label,
          order: Number(sectionEntry.section_order || 999),
          groupsByKey: new Map(),
        };
        sectionsByKey.set(sectionEntry.section_key, section);
      }
      const subgroupLabel = String(sectionEntry.subgroup_label || "").trim();
      const subgroupOrder = Number(sectionEntry.subgroup_order || 999);
      const subgroupKey = subgroupLabel ? `subgroup:${subgroupOrder}:${subgroupLabel}` : "__default__";
      let subgroup = section.groupsByKey.get(subgroupKey);
      if (!subgroup) {
        subgroup = {
          key: subgroupKey,
          label: subgroupLabel,
          order: subgroupLabel ? subgroupOrder : -1,
          items: [],
        };
        section.groupsByKey.set(subgroupKey, subgroup);
      }
      subgroup.items.push(category);
    }
  }
  return Array.from(sectionsByKey.values())
    .map((section) => ({
      ...section,
      groups: Array.from(section.groupsByKey.values())
        .map((group) => ({
          ...group,
          items: group.items.slice().sort(compareCategoriesForDisplay),
        }))
        .sort((a, b) => a.order - b.order || String(a.label || "").localeCompare(String(b.label || ""), "vi", { sensitivity: "base" })),
    }))
    .sort((a, b) => a.order - b.order || String(a.label || "").localeCompare(String(b.label || ""), "vi", { sensitivity: "base" }));
}

function isCategoryTagsSection(section) {
  const key = String((section && section.key) || "").trim().toLowerCase();
  if (key === "default:tags" || key.endsWith(":tags")) return true;
  const label = String((section && section.label) || "").trim().toLowerCase();
  return label === "tags" || label === "tag";
}

function getCategorySectionExpandStateKey(scopeKey, sectionKey) {
  return `${String(scopeKey || "default").trim() || "default"}::${String(sectionKey || "").trim()}`;
}

function isCategorySectionExpanded(scopeKey, section, activeSet = new Set()) {
  const sectionKey = getCategorySectionExpandStateKey(scopeKey, section && section.key);
  if (Object.prototype.hasOwnProperty.call(state.categorySectionExpanded, sectionKey)) {
    return state.categorySectionExpanded[sectionKey] !== false;
  }
  for (const group of (section && section.groups) || []) {
    for (const category of (group && group.items) || []) {
      const id = String((category && category.category_id) || "").trim();
      if (id && activeSet.has(id)) return true;
    }
  }
  return !isCategoryTagsSection(section);
}

function setCategorySectionExpanded(scopeKey, section, expanded) {
  const sectionKey = getCategorySectionExpandStateKey(scopeKey, section && section.key);
  state.categorySectionExpanded[sectionKey] = Boolean(expanded);
}

function renderCategoryPickerSections(container, {
  term = "",
  activeIds = [],
  emptyNode = null,
  emptyText = "",
  showCount = false,
  onToggle = null,
  scopeKey = "",
  collapsibleSections = false,
} = {}) {
  if (!container) return [];
  container.innerHTML = "";
  const activeSet = new Set(normalizeCategoryIds(activeIds));
  const sections = buildVisibleCategorySections(term);
  if (emptyNode) {
    emptyNode.classList.toggle("hidden", sections.length > 0);
    emptyNode.textContent = emptyText || "";
  }
  for (const section of sections) {
    const sectionEl = document.createElement("section");
    sectionEl.className = "category-picker-section";

    const head = document.createElement("div");
    head.className = "category-picker-section-head";
    const title = document.createElement("strong");
    title.textContent = String(section.label || "").trim();
    head.appendChild(title);
    const expanded = collapsibleSections ? isCategorySectionExpanded(scopeKey, section, activeSet) : true;
    if (collapsibleSections) {
      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "btn btn-small category-section-toggle";
      toggleBtn.textContent = expanded ? state.shell.t("categorySectionHide") : state.shell.t("categorySectionShow");
      toggleBtn.addEventListener("click", () => {
        setCategorySectionExpanded(scopeKey, section, !expanded);
        renderCategoryPickerSections(container, {
          term,
          activeIds,
          emptyNode,
          emptyText,
          showCount,
          onToggle,
          scopeKey,
          collapsibleSections,
        });
      });
      head.appendChild(toggleBtn);
    }
    sectionEl.appendChild(head);

    if (!expanded) {
      container.appendChild(sectionEl);
      continue;
    }

    for (const group of section.groups || []) {
      let target = sectionEl;
      if (group.label) {
        const subgroup = document.createElement("div");
        subgroup.className = "category-picker-subgroup";
        const subgroupTitle = document.createElement("div");
        subgroupTitle.className = "category-picker-subgroup-title";
        subgroupTitle.textContent = String(group.label || "").trim();
        subgroup.appendChild(subgroupTitle);
        sectionEl.appendChild(subgroup);
        target = subgroup;
      }
      const list = document.createElement("div");
      list.className = "category-chip-picker-row";
      for (const category of group.items || []) {
        const id = String((category && category.category_id) || "").trim();
        const chip = createCategoryChip(category, {
          active: activeSet.has(id),
          titleSuffix: showCount ? ` • ${Math.max(0, Number(category && category.book_count || 0))}` : "",
          onClick: typeof onToggle === "function" ? () => onToggle(id, category, section) : null,
        });
        if (showCount) {
          const count = document.createElement("span");
          count.className = "category-chip-count";
          count.textContent = String(Math.max(0, Number(category && category.book_count || 0)));
          chip.appendChild(count);
        }
        list.appendChild(chip);
      }
      target.appendChild(list);
    }

    container.appendChild(sectionEl);
  }
  return sections;
}

function getBookCategories(book) {
  return Array.isArray(book && book.categories) ? book.categories : [];
}

function getBookCategoryIds(book) {
  return normalizeCategoryIds(getBookCategories(book).map((item) => item && item.category_id));
}

function parseCategoryIdsQueryParam(key) {
  const query = state.shell && typeof state.shell.parseQuery === "function"
    ? state.shell.parseQuery()
    : {};
  const raw = String((query && query[key]) || "").trim();
  if (!raw) return [];
  return normalizeCategoryIds(raw.split(","));
}

function parseLibraryCategoryIdsFromQuery() {
  return parseCategoryIdsQueryParam("category_ids");
}

function parseLibraryExcludedCategoryIdsFromQuery() {
  return parseCategoryIdsQueryParam("category_exclude_ids");
}

function parseLibraryCategoryMatchModeFromQuery() {
  const query = state.shell && typeof state.shell.parseQuery === "function"
    ? state.shell.parseQuery()
    : {};
  return normalizeCategoryMatchMode((query && query.category_mode) || "or");
}

function parseLibraryAuthorFromQuery() {
  const query = state.shell && typeof state.shell.parseQuery === "function"
    ? state.shell.parseQuery()
    : {};
  return normalizeAuthorFilterValue((query && query.author) || "");
}

function bookMatchesClientSearch(book, rawNeedle) {
  const needle = String(rawNeedle || "").trim().toLowerCase();
  if (!needle) return true;
  const values = [
    book && book.title_display,
    book && book.title_vi,
    book && book.title,
    book && book.author_display,
    book && book.author_vi,
    book && book.author,
  ];
  return values.some((value) => String(value || "").trim().toLowerCase().includes(needle));
}

function syncLibraryQuery() {
  const params = new URLSearchParams(window.location.search || "");
  const ids = normalizeCategoryIds(state.selectedCategoryIds);
  const excludeIds = normalizeCategoryIds(state.selectedExcludedCategoryIds);
  const matchMode = normalizeCategoryMatchMode(state.selectedCategoryMatchMode);
  const author = normalizeAuthorFilterValue(state.selectedAuthorFilter);
  if (ids.length) params.set("category_ids", ids.join(","));
  else params.delete("category_ids");
  if (excludeIds.length) params.set("category_exclude_ids", excludeIds.join(","));
  else params.delete("category_exclude_ids");
  if (ids.length > 1 && matchMode === "and") params.set("category_mode", "and");
  else params.delete("category_mode");
  if (author) params.set("author", author);
  else params.delete("author");
  params.delete("q");
  const next = params.toString();
  const target = `${window.location.pathname}${next ? `?${next}` : ""}`;
  window.history.replaceState({}, "", target);
}

function hasActiveLibraryFilter() {
  return normalizeCategoryIds(state.selectedCategoryIds).length > 0
    || normalizeCategoryIds(state.selectedExcludedCategoryIds).length > 0
    || !!normalizeAuthorFilterValue(state.selectedAuthorFilter);
}

function bookMatchesAuthorFilter(book, rawNeedle) {
  const needle = normalizeAuthorFilterValue(rawNeedle).toLowerCase();
  if (!needle) return true;
  const values = [
    book && book.author,
    book && book.author_vi,
    book && book.author_display,
  ];
  return values.some((value) => String(value || "").trim().toLowerCase().includes(needle));
}

function getFilteredBooks() {
  return Array.isArray(state.books) ? state.books : [];
}

function updateLibraryFilterBadge() {
  const count = normalizeCategoryIds(state.selectedCategoryIds).length
    + normalizeCategoryIds(state.selectedExcludedCategoryIds).length
    + (normalizeAuthorFilterValue(state.selectedAuthorFilter) ? 1 : 0);
  if (refs.libraryFilterCount) {
    refs.libraryFilterCount.textContent = String(count);
    refs.libraryFilterCount.classList.toggle("hidden", count <= 0);
  }
  if (refs.btnLibraryFilter) {
    refs.btnLibraryFilter.classList.toggle("has-active-filter", count > 0);
  }
}

function createCategoryChip(category, { active = false, onClick = null, titleSuffix = "" } = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn category-chip";
  if (active) button.classList.add("active");
  const name = String((category && category.name) || "").trim();
  const count = Math.max(0, Number(category && category.book_count || 0));
  button.textContent = name || state.shell.t("categoryUncategorized");
  if (titleSuffix) {
    button.title = `${name}${titleSuffix}`;
  } else if (count > 0) {
    button.title = `${name} • ${count}`;
  }
  if (typeof onClick === "function") {
    button.addEventListener("click", onClick);
  }
  return button;
}

function syncSelectedCategoryIdsWithCatalog() {
  const known = new Set((state.categories || []).map((item) => String(item.category_id || "").trim()).filter(Boolean));
  const selectedPair = buildDistinctCategoryFilters(
    normalizeCategoryIds(state.selectedCategoryIds).filter((item) => known.has(item)),
    normalizeCategoryIds(state.selectedExcludedCategoryIds).filter((item) => known.has(item)),
  );
  const nextInclude = applySingleSelectionRules(selectedPair.include);
  const nextExclude = applySingleSelectionRules(selectedPair.exclude);
  const prevInclude = normalizeCategoryIds(state.selectedCategoryIds);
  const prevExclude = normalizeCategoryIds(state.selectedExcludedCategoryIds);
  const selectedChanged = nextInclude.length !== prevInclude.length
    || nextExclude.length !== prevExclude.length
    || nextInclude.some((item, idx) => item !== prevInclude[idx])
    || nextExclude.some((item, idx) => item !== prevExclude[idx]);
  state.selectedCategoryIds = nextInclude;
  state.selectedExcludedCategoryIds = nextExclude;
  state.categoryFilterDraftIds = applySingleSelectionRules(normalizeCategoryIds(state.categoryFilterDraftIds).filter((item) => known.has(item)));
  state.categoryFilterDraftExcludeIds = applySingleSelectionRules(normalizeCategoryIds(state.categoryFilterDraftExcludeIds).filter((item) => known.has(item)));
  state.importSelectedCategoryIds = applySingleSelectionRules(normalizeCategoryIds(state.importSelectedCategoryIds).filter((item) => known.has(item)));
  state.bookCategoriesDraftIds = applySingleSelectionRules(normalizeCategoryIds(state.bookCategoriesDraftIds).filter((item) => known.has(item)));
  if (selectedChanged) syncLibraryQuery();
  updateLibraryFilterBadge();
  renderImportCategoryList();
}

function buildCategoryCatalogMap() {
  const output = new Map();
  for (const raw of state.categories || []) {
    const item = normalizeCategoryItem(raw);
    if (!item.category_id) continue;
    output.set(item.category_id, item);
  }
  return output;
}

function normalizeBookCategoriesFromCatalog(categoryIds) {
  const catalog = state.categoryMap instanceof Map ? state.categoryMap : buildCategoryCatalogMap();
  const output = [];
  for (const id of normalizeCategoryIds(categoryIds)) {
    const category = catalog.get(id);
    if (!category) continue;
    output.push({ ...category });
  }
  return output;
}

function getStateBooksCollection() {
  return Array.isArray(state.books) ? state.books : [];
}

function getCategoryManagerBooksCollection() {
  return Array.isArray(state.categoryManagerBooks) ? state.categoryManagerBooks : [];
}

function forEachLocalBookCollection(callback) {
  for (const collection of [getStateBooksCollection(), getCategoryManagerBooksCollection()]) {
    callback(collection);
  }
}

function reconcileCategoryListWithCatalog(list) {
  for (const book of Array.isArray(list) ? list : []) {
    book.categories = normalizeBookCategoriesFromCatalog(getBookCategoryIds(book));
  }
}

function invalidateCategoryManagerBooks() {
  state.categoryManagerBooks = [];
  state.categoryManagerBooksLoaded = false;
  state.categoryManagerBooksLoading = false;
}

function setBookCategoriesLocal(bookId, categories) {
  const bid = String(bookId || "").trim();
  if (!bid) return;
  const next = Array.isArray(categories)
    ? categories
      .map((item) => normalizeCategoryItem(item))
      .filter((item) => item.category_id)
    : [];
  forEachLocalBookCollection((collection) => {
    for (const book of collection) {
      if (String((book && book.book_id) || "").trim() !== bid) continue;
      book.categories = next.map((item) => ({ ...item }));
    }
  });
}

function reconcileBookCategoriesWithCatalog() {
  reconcileCategoryListWithCatalog(state.books || []);
  reconcileCategoryListWithCatalog(state.categoryManagerBooks || []);
}

function setCategoriesCatalog(items) {
  state.categories = Array.isArray(items)
    ? items.map((item) => normalizeCategoryItem(item)).filter((item) => item.category_id)
    : [];
  state.categoryMap = buildCategoryCatalogMap();
  syncSelectedCategoryIdsWithCatalog();
  reconcileBookCategoriesWithCatalog();
  renderLibraryCategoryFilterList();
  renderBookCategoriesDialogList();
}

function applyBooksCategoryActionLocal(bookIds, categoryIds, action) {
  const normalizedBookIds = normalizeCategoryIds(bookIds);
  const normalizedCategoryIds = applySingleSelectionRules(categoryIds);
  if (!normalizedBookIds.length || !normalizedCategoryIds.length) return;
  const actionKey = String(action || "").trim().toLowerCase();
  const categoryMap = state.categoryMap instanceof Map ? state.categoryMap : buildCategoryCatalogMap();
  forEachLocalBookCollection((collection) => {
    for (const book of collection) {
      const bid = String((book && book.book_id) || "").trim();
      if (!normalizedBookIds.includes(bid)) continue;
      const current = new Set(getBookCategoryIds(book));
      if (actionKey === "remove") {
        for (const categoryId of normalizedCategoryIds) current.delete(categoryId);
      } else {
        for (const categoryId of normalizedCategoryIds) {
          const groupKey = getCategorySingleSelectionGroupKey(categoryMap.get(categoryId));
          if (groupKey) {
            for (const existingId of Array.from(current)) {
              if (getCategorySingleSelectionGroupKey(categoryMap.get(existingId)) === groupKey) {
                current.delete(existingId);
              }
            }
          }
          if (categoryMap.has(categoryId)) current.add(categoryId);
        }
      }
      book.categories = normalizeBookCategoriesFromCatalog(Array.from(current));
    }
  });
}

function syncSelectedBookActions() {
  if (!(refs.bookActionsDialog && refs.bookActionsDialog.open) || !state.selectedBookId) return;
  const book = (state.books || []).find((item) => String(item.book_id || "") === String(state.selectedBookId || ""));
  if (!book) return;
  openActions(book.book_id);
}

function normalizeBookIds(values) {
  return Array.from(new Set(
    (Array.isArray(values) ? values : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean),
  ));
}

function collectDownloadJobBookIds(items) {
  return normalizeBookIds((Array.isArray(items) ? items : []).map((job) => job && job.book_id));
}

function findStateBook(bookId) {
  const bid = String(bookId || "").trim();
  if (!bid) return null;
  return (state.books || []).find((item) => String((item && item.book_id) || "").trim() === bid) || null;
}

function replaceStateBook(book) {
  const bid = String((book && book.book_id) || "").trim();
  if (!bid) return false;
  const index = (state.books || []).findIndex((item) => String((item && item.book_id) || "").trim() === bid);
  if (index < 0) return false;
  const current = state.books[index] || {};
  state.books[index] = {
    ...current,
    ...book,
    _libraryCardNeedsHydrate: false,
    _libraryCardLazyRefreshDone: Boolean(book && book._libraryCardLazyRefreshDone != null ? book._libraryCardLazyRefreshDone : true),
    _libraryCardLazyRefreshQueued: false,
  };
  return true;
}

function upsertStateBook(book, { prepend = true } = {}) {
  const bid = String((book && book.book_id) || "").trim();
  if (!bid) return null;
  const normalizedCategories = Array.isArray(book.categories)
    ? book.categories
      .map((item) => normalizeCategoryItem(item))
      .filter((item) => item.category_id)
    : null;
  const index = (state.books || []).findIndex((item) => String((item && item.book_id) || "").trim() === bid);
  if (index >= 0) {
    const current = state.books[index] || {};
    const next = { ...current, ...book };
    if (normalizedCategories) next.categories = normalizedCategories.map((item) => ({ ...item }));
    state.books[index] = next;
    return next;
  }
  const next = { ...book };
  if (normalizedCategories) next.categories = normalizedCategories.map((item) => ({ ...item }));
  if (!Array.isArray(state.books)) state.books = [];
  if (prepend) state.books.unshift(next);
  else state.books.push(next);
  return next;
}

function needsLazyLibraryCardRefresh(book) {
  if (!book) return false;
  if (Boolean(book._libraryCardLazyRefreshDone) || Boolean(book._libraryCardLazyRefreshQueued)) return false;
  if (getCurrentReaderMode() === "trans" && getCurrentTranslationMode() === "server") return false;
  if (Boolean(book._libraryCardNeedsHydrate)) return true;
  if (getCurrentReaderMode() !== "trans") return false;
  if (!Boolean(parseBooleanLike(book.translation_supported))) return false;
  const titleVi = String(book.title_vi || "").trim();
  const currentVi = String(book.current_chapter_title_vi || "").trim();
  const rawTitle = String(book.title || "").trim();
  const rawCurrent = String(book.current_chapter_title_raw || book.current_chapter_title || "").trim();
  const titleDisplay = String(book.title_display || "").trim();
  const currentDisplay = String(book.current_chapter_title_display || "").trim();
  const titleNeeds = !titleVi && (!titleDisplay || titleDisplay === rawTitle);
  const currentNeeds = !currentVi && (!currentDisplay || currentDisplay === rawCurrent);
  return titleNeeds || currentNeeds;
}

function prepareLibraryPageBook(book) {
  const prepared = { ...(book && typeof book === "object" ? book : {}) };
  prepared._libraryCardNeedsHydrate = true;
  prepared._libraryCardLazyRefreshDone = false;
  prepared._libraryCardLazyRefreshQueued = false;
  return prepared;
}

function isServerLibraryTitleCacheMode() {
  return getCurrentReaderMode() === "trans" && getCurrentTranslationMode() === "server";
}

function bookNeedsServerTitleCache(book) {
  if (!book || !isServerLibraryTitleCacheMode()) return false;
  if (!Boolean(parseBooleanLike(book.translation_supported))) return false;
  const rawTitle = String(book.title || "").trim();
  const titleVi = String(book.title_vi || "").trim();
  const rawCurrent = String(book.current_chapter_title_raw || "").trim();
  const currentVi = String(book.current_chapter_title_vi || "").trim();
  return (Boolean(rawTitle) && !titleVi) || (Boolean(rawCurrent) && !currentVi);
}

function clearLibraryTitleCacheState() {
  state.libraryPendingTitleBookIds = new Set();
  if (state.libraryTitlePollTimer) {
    window.clearTimeout(state.libraryTitlePollTimer);
    state.libraryTitlePollTimer = 0;
  }
  state.libraryTitlePollInFlight = false;
}

function collectPendingLibraryTitleCacheBookIds(bookIds = null) {
  const filterIds = bookIds ? new Set(normalizeBookIds(bookIds)) : null;
  const pending = [];
  for (const book of Array.isArray(state.books) ? state.books : []) {
    const bookId = String((book && book.book_id) || "").trim();
    if (!bookId) continue;
    if (filterIds && !filterIds.has(bookId)) continue;
    if (!bookNeedsServerTitleCache(book)) continue;
    pending.push(bookId);
  }
  return normalizeBookIds(pending);
}

async function ensureLibraryTitleCacheForBookIds(bookIds = null) {
  if (!state.shell || !isServerLibraryTitleCacheMode()) {
    clearLibraryTitleCacheState();
    return;
  }
  const pendingIds = collectPendingLibraryTitleCacheBookIds(bookIds);
  if (!pendingIds.length) return;
  try {
    const data = await state.shell.api("/api/library/books/title-cache/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        book_ids: pendingIds,
        translation_mode: getCurrentTranslationMode(),
      }),
    });
    const nextPendingIds = normalizeBookIds(data && data.pending_ids);
    for (const bookId of nextPendingIds) state.libraryPendingTitleBookIds.add(bookId);
    if (state.libraryPendingTitleBookIds.size) scheduleLibraryTitleCachePoll();
  } catch {
    // Dịch title nền là best-effort, không làm gián đoạn UI thư viện.
  }
}

function scheduleLibraryTitleCachePoll(delay = 650) {
  if (state.libraryTitlePollTimer || state.libraryTitlePollInFlight) return;
  if (!state.libraryPendingTitleBookIds.size || !isServerLibraryTitleCacheMode()) return;
  state.libraryTitlePollTimer = window.setTimeout(() => {
    state.libraryTitlePollTimer = 0;
    flushLibraryTitleCachePoll().catch(() => {});
  }, Math.max(120, Number(delay || 0) || 650));
}

async function flushLibraryTitleCachePoll() {
  if (state.libraryTitlePollInFlight) return;
  if (!isServerLibraryTitleCacheMode()) {
    clearLibraryTitleCacheState();
    return;
  }
  const bookIds = normalizeBookIds(Array.from(state.libraryPendingTitleBookIds));
  if (!bookIds.length) return;
  state.libraryTitlePollInFlight = true;
  try {
    const data = await state.shell.api("/api/library/books/by-ids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ book_ids: bookIds }),
    });
    const items = Array.isArray(data && data.items) ? data.items : [];
    const touchedIds = [];
    for (const item of items) {
      if (!item || !replaceStateBook(item)) continue;
      touchedIds.push(String(item.book_id || "").trim());
    }
    if (touchedIds.length) syncLibraryBookCards(touchedIds);
    state.libraryPendingTitleBookIds = new Set(collectPendingLibraryTitleCacheBookIds(bookIds));
  } catch {
    // Poll lỗi thì vòng sau thử lại, không chặn thao tác khác.
  } finally {
    state.libraryTitlePollInFlight = false;
    if (state.libraryPendingTitleBookIds.size) scheduleLibraryTitleCachePoll(900);
  }
}

function getLibraryBookTitleText(book) {
  const rawTitle = normalizeDisplayTitle(String((book && book.title) || "").trim());
  const translatedTitle = normalizeDisplayTitle(String((book && (book.title_display || book.title_vi)) || "").trim());
  if (bookNeedsServerTitleCache(book)) {
    if (translatedTitle && translatedTitle !== rawTitle) return translatedTitle;
    return state.shell.t("libraryTitleTranslating");
  }
  return translatedTitle || rawTitle || "Không tiêu đề";
}

function clearLibraryCardRefreshQueue() {
  state.libraryCardRefreshQueue = [];
  state.libraryCardRefreshQueuedIds = new Set();
  state.libraryCardRefreshBusy = false;
  if (state.libraryCardRefreshTimer) {
    window.clearTimeout(state.libraryCardRefreshTimer);
    state.libraryCardRefreshTimer = 0;
  }
}

function markLibraryCardRefreshFinished(bookIds) {
  for (const bookId of normalizeBookIds(bookIds)) {
    const book = findStateBook(bookId);
    if (!book) continue;
    book._libraryCardNeedsHydrate = false;
    book._libraryCardLazyRefreshDone = true;
    book._libraryCardLazyRefreshQueued = false;
  }
}

function scheduleLibraryCardRefreshFlush() {
  if (state.libraryCardRefreshTimer) return;
  state.libraryCardRefreshTimer = window.setTimeout(() => {
    state.libraryCardRefreshTimer = 0;
    flushLibraryCardRefreshQueue().catch(() => {});
  }, 100);
}

async function flushLibraryCardRefreshQueue() {
  if (state.libraryCardRefreshBusy) return;
  const batch = [];
  while (state.libraryCardRefreshQueue.length && batch.length < 6) {
    const bookId = String(state.libraryCardRefreshQueue.shift() || "").trim();
    if (!bookId) continue;
    state.libraryCardRefreshQueuedIds.delete(bookId);
    batch.push(bookId);
  }
  if (!batch.length) return;
  state.libraryCardRefreshBusy = true;
  try {
    await refreshLibraryBooksByIds(batch);
  } finally {
    markLibraryCardRefreshFinished(batch);
    state.libraryCardRefreshBusy = false;
    if (state.libraryCardRefreshQueue.length) scheduleLibraryCardRefreshFlush();
  }
}

function queueLibraryCardRefresh(book) {
  if (!needsLazyLibraryCardRefresh(book)) return;
  const bookId = String((book && book.book_id) || "").trim();
  if (!bookId || state.libraryCardRefreshQueuedIds.has(bookId)) return;
  state.libraryCardRefreshQueuedIds.add(bookId);
  book._libraryCardLazyRefreshQueued = true;
  state.libraryCardRefreshQueue.push(bookId);
  scheduleLibraryCardRefreshFlush();
}

function syncLibraryBookCards(bookIds) {
  const ids = normalizeBookIds(bookIds);
  if (!ids.length || !refs.libraryGrid) {
    syncSelectedBookActions();
    return;
  }
  for (const bookId of ids) {
    const book = findStateBook(bookId);
    if (!book) continue;
    const selector = `[data-book-id="${escapeAttrSelectorValue(bookId)}"]`;
    for (const card of Array.from(refs.libraryGrid.querySelectorAll(selector))) {
      card.__book = book;
      card.classList.toggle("book-card-deleting", isBookDeleting(bookId));
      card.setAttribute("aria-busy", isBookDeleting(bookId) ? "true" : "false");
      if (String(card.dataset.hydrated || "") === "1") {
        populateLibraryBookCard(card, book);
      }
    }
  }
  syncSelectedBookActions();
}

function applyLocalDownloadJobStateToBooks(items) {
  const byBook = new Map();
  for (const job of Array.isArray(items) ? items : []) {
    const bookId = String((job && job.book_id) || "").trim();
    if (!bookId) continue;
    const current = byBook.get(bookId) || { downloaded: 0, total: 0 };
    current.downloaded = Math.max(current.downloaded, Math.max(0, Number(job && job.downloaded_chapters || 0)));
    current.total = Math.max(current.total, Math.max(0, Number(job && job.total_chapters || 0)));
    byBook.set(bookId, current);
  }
  const touched = [];
  for (const [bookId, summary] of byBook.entries()) {
    const book = findStateBook(bookId);
    if (!book) continue;
    const limit = Math.max(0, Number(summary.total || book.chapter_count || 0));
    const nextDownloaded = Math.max(0, Math.min(limit || Number(summary.downloaded || 0), Number(summary.downloaded || 0)));
    book.downloaded_chapters = nextDownloaded;
    touched.push(bookId);
  }
  if (touched.length) syncLibraryBookCards(touched);
  return touched;
}

async function refreshLibraryBooksByIds(bookIds) {
  const ids = normalizeBookIds(bookIds);
  if (!ids.length) return;
  const results = await Promise.all(ids.map(async (bookId) => {
    try {
      const book = findStateBook(bookId);
      const mode = resolveReaderModeForBook(book);
      const translateMode = getCurrentTranslationMode();
      return await state.shell.api(
        `/api/library/book/${encodeURIComponent(bookId)}?include_chapters=0&mode=${encodeURIComponent(mode)}&translation_mode=${encodeURIComponent(translateMode)}`,
      );
    } catch {
      return null;
    }
  }));
  const refreshedIds = [];
  for (const book of results) {
    if (!book || !replaceStateBook(book)) continue;
    refreshedIds.push(String(book.book_id || "").trim());
  }
  if (refreshedIds.length) syncLibraryBookCards(refreshedIds);
}

function renderBookActionsCategories(book) {
  if (!refs.bookActionsCategoriesRow || !refs.bookActionsCategoriesList || !refs.bookActionsCategoriesLabel) return;
  refs.bookActionsCategoriesRow.classList.remove("hidden");
  refs.bookActionsCategoriesLabel.textContent = state.shell.t("bookCategoriesLabel");
  refs.bookActionsCategoriesList.innerHTML = "";
  const categories = getBookCategories(book);
  if (!categories.length) {
    const empty = document.createElement("span");
    empty.className = "empty-text";
    empty.textContent = state.shell.t("bookCategoriesNone");
    refs.bookActionsCategoriesList.appendChild(empty);
    return;
  }
  for (const category of categories) {
    refs.bookActionsCategoriesList.appendChild(createCategoryChip(category));
  }
}

function splitMultilineValues(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isBookDeleting(bookId) {
  return state.deletingBookIds.has(String(bookId || "").trim());
}

function escapeAttrSelectorValue(value) {
  const raw = String(value || "");
  if (window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(raw);
  }
  return raw.replace(/["\\]/g, "\\$&");
}

function setBookDeletingVisual(bookId, deleting) {
  const bid = String(bookId || "").trim();
  if (!bid) return;
  const selector = `[data-book-id="${escapeAttrSelectorValue(bid)}"]`;
  for (const card of Array.from(refs.libraryGrid.querySelectorAll(selector))) {
    card.classList.toggle("book-card-deleting", Boolean(deleting));
    card.setAttribute("aria-busy", deleting ? "true" : "false");
  }
}

function joinMultilineValues(values) {
  return (Array.isArray(values) ? values : []).map((item) => String(item || "").trim()).filter(Boolean).join("\n");
}

function cloneImportSettings(settings) {
  try {
    return JSON.parse(JSON.stringify(settings || {}));
  } catch {
    return {
      txt: { target_size: 4500, preface_title: "Mở đầu", heading_patterns: [] },
      epub: {
        title_keys: [],
        author_keys: [],
        summary_keys: [],
        language_keys: [],
        cover_meta_names: [],
        cover_properties: [],
      },
    };
  }
}

function applyImportSettingsToInputs(settings, refsMap) {
  const data = cloneImportSettings(settings);
  if (refsMap.targetSize) refsMap.targetSize.value = String((((data.txt || {}).target_size) || 4500));
  if (refsMap.prefaceTitle) refsMap.prefaceTitle.value = String((((data.txt || {}).preface_title) || "Mở đầu"));
  if (refsMap.headingPatterns) refsMap.headingPatterns.value = joinMultilineValues((data.txt || {}).heading_patterns || []);
  if (refsMap.epubTitleKeys) refsMap.epubTitleKeys.value = joinMultilineValues((data.epub || {}).title_keys || []);
  if (refsMap.epubAuthorKeys) refsMap.epubAuthorKeys.value = joinMultilineValues((data.epub || {}).author_keys || []);
  if (refsMap.epubSummaryKeys) refsMap.epubSummaryKeys.value = joinMultilineValues((data.epub || {}).summary_keys || []);
  if (refsMap.epubLanguageKeys) refsMap.epubLanguageKeys.value = joinMultilineValues((data.epub || {}).language_keys || []);
  if (refsMap.epubCoverMeta) refsMap.epubCoverMeta.value = joinMultilineValues((data.epub || {}).cover_meta_names || []);
  if (refsMap.epubCoverProps) refsMap.epubCoverProps.value = joinMultilineValues((data.epub || {}).cover_properties || []);
}

function collectImportSettingsFromInputs(refsMap) {
  return {
    txt: {
      target_size: Math.max(800, Math.min(30000, Number.parseInt(String((refsMap.targetSize && refsMap.targetSize.value) || "4500"), 10) || 4500)),
      preface_title: String((refsMap.prefaceTitle && refsMap.prefaceTitle.value) || "").trim() || "Mở đầu",
      heading_patterns: splitMultilineValues(refsMap.headingPatterns && refsMap.headingPatterns.value),
    },
    epub: {
      title_keys: splitMultilineValues(refsMap.epubTitleKeys && refsMap.epubTitleKeys.value),
      author_keys: splitMultilineValues(refsMap.epubAuthorKeys && refsMap.epubAuthorKeys.value),
      summary_keys: splitMultilineValues(refsMap.epubSummaryKeys && refsMap.epubSummaryKeys.value),
      language_keys: splitMultilineValues(refsMap.epubLanguageKeys && refsMap.epubLanguageKeys.value),
      cover_meta_names: splitMultilineValues(refsMap.epubCoverMeta && refsMap.epubCoverMeta.value),
      cover_properties: splitMultilineValues(refsMap.epubCoverProps && refsMap.epubCoverProps.value),
    },
  };
}

function customImportInputs() {
  return {
    targetSize: refs.importTargetSizeInput,
    prefaceTitle: refs.importPrefaceTitleInput,
    headingPatterns: refs.importHeadingPatternsInput,
    epubTitleKeys: refs.importEpubTitleKeysInput,
    epubAuthorKeys: refs.importEpubAuthorKeysInput,
    epubSummaryKeys: refs.importEpubSummaryKeysInput,
    epubLanguageKeys: refs.importEpubLanguageKeysInput,
    epubCoverMeta: refs.importEpubCoverMetaInput,
    epubCoverProps: refs.importEpubCoverPropsInput,
  };
}

function addTextareaValue(textarea, value) {
  if (!textarea) return;
  const current = splitMultilineValues(textarea.value);
  if (current.includes(value)) return;
  current.push(value);
  textarea.value = current.join("\n");
}

function renderPresetChipList(container, items, onClick) {
  if (!container) return;
  container.innerHTML = "";
  for (const item of Array.isArray(items) ? items : []) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset-chip";
    btn.textContent = String(item.label || item.value || "");
    btn.title = String(item.description || item.value || item.label || "");
    btn.addEventListener("click", () => onClick(item));
    container.appendChild(btn);
  }
}

function renderImportPresetButtons() {
  const presets = state.importPresets || {};
  const txtItems = Array.isArray(presets.txt_patterns) ? presets.txt_patterns : [];
  renderPresetChipList(refs.importHeadingPresets, txtItems, (item) => {
    addTextareaValue(refs.importHeadingPatternsInput, String(item.pattern || "").trim());
  });

  const epubFieldGroups = [];
  const epubFields = presets.epub_fields || {};
  for (const [field, values] of Object.entries(epubFields)) {
    for (const value of Array.isArray(values) ? values : []) {
      epubFieldGroups.push({
        label: `${field}: ${value}`,
        value: String(value || ""),
        field,
      });
    }
  }
  const applyEpubPreset = (targetField, value) => {
    const map = {
      title_keys: refs.importEpubTitleKeysInput,
      author_keys: refs.importEpubAuthorKeysInput,
      summary_keys: refs.importEpubSummaryKeysInput,
      language_keys: refs.importEpubLanguageKeysInput,
      cover_meta_names: refs.importEpubCoverMetaInput,
      cover_properties: refs.importEpubCoverPropsInput,
    };
    addTextareaValue(map[targetField], value);
  };
  renderPresetChipList(refs.importEpubPresets, epubFieldGroups, (item) => applyEpubPreset(item.field, item.value));
}

async function loadImportSettings({ silent = true } = {}) {
  if (!silent) state.shell.showStatus(state.shell.t("statusLoadingImportSettings"));
  try {
    const data = await state.shell.api("/api/library/import/settings");
    state.importSettings = cloneImportSettings(data && data.settings ? data.settings : {});
    state.importPresets = data && data.presets ? data.presets : {};
    applyImportSettingsToInputs(state.importSettings, customImportInputs());
    renderImportPresetButtons();
    return state.importSettings;
  } catch (error) {
    if (!silent) state.shell.showToast(getErrorMessage(error));
    throw error;
  } finally {
    if (!silent) state.shell.hideStatus();
  }
}

function openImportCustomizeDialog() {
  if (!refs.importCustomizeDialog) return;
  applyImportSettingsToInputs(state.importSettings || {}, customImportInputs());
  renderImportPresetButtons();
  if (!refs.importCustomizeDialog.open) refs.importCustomizeDialog.showModal();
}

function buildImportCategorySummaryText() {
  const catalog = buildCategoryCatalogMap();
  const names = normalizeCategoryIds(state.importSelectedCategoryIds)
    .map((item) => catalog.get(item))
    .filter(Boolean)
    .map((item) => String(item.name || "").trim())
    .filter(Boolean);
  if (!names.length) return "";
  return names.join(", ");
}

function renderImportCategoryList() {
  if (!refs.importCategoriesList || !refs.importCategoriesEmpty) return;
  const selectedIds = applySingleSelectionRules(state.importSelectedCategoryIds);
  state.importSelectedCategoryIds = selectedIds;
  const selectedSet = new Set(selectedIds);
  const term = String((refs.importCategoriesSearchInput && refs.importCategoriesSearchInput.value) || "").trim().toLowerCase();
  if (refs.importCategoriesCount) {
    refs.importCategoriesCount.textContent = String(selectedSet.size);
    refs.importCategoriesCount.classList.toggle("hidden", selectedSet.size <= 0);
    const summary = buildImportCategorySummaryText();
    refs.importCategoriesCount.title = summary || "";
  }
  renderCategoryPickerSections(refs.importCategoriesList, {
    term,
    activeIds: selectedIds,
    emptyNode: refs.importCategoriesEmpty,
    emptyText: state.shell.t("importCategoriesEmpty"),
    showCount: true,
    onToggle: (id) => {
      state.importSelectedCategoryIds = toggleCategoryIdWithRules(state.importSelectedCategoryIds, id);
      renderImportCategoryList();
    },
  });
}

function scheduleBatchImportDialogRender() {
  if (state.batchImportRenderTimer) return;
  state.batchImportRenderTimer = window.setTimeout(() => {
    state.batchImportRenderTimer = 0;
    renderBatchImportDialog();
  }, 80);
}

function resetBatchImportProgress() {
  state.batchImportProgress = {
    active: false,
    total: 0,
    completed: 0,
    success: 0,
    failed: 0,
    currentFile: "",
    phase: "idle",
    title: "",
    hidden: false,
    notificationId: "",
    detail: "",
    errors: [],
    mode: "import",
    uploadBytesLoaded: 0,
    uploadBytesTotal: 0,
    finalHandled: false,
  };
  syncImportUploadUnloadGuard();
}

function syncImportUploadUnloadGuard() {
  const progress = state.batchImportProgress || {};
  const isUploading = Boolean(progress.active) && String(progress.mode || "").trim() === "upload";
  if (!window.__readerImportUploadUnloadGuard) {
    window.__readerImportUploadUnloadGuard = (event) => {
      event.preventDefault();
      event.returnValue = getImportUploadWarningText();
      return getImportUploadWarningText();
    };
  }
  if (isUploading) {
    window.addEventListener("beforeunload", window.__readerImportUploadUnloadGuard);
  } else {
    window.removeEventListener("beforeunload", window.__readerImportUploadUnloadGuard);
  }
}

function renderBatchImportProgressDialog() {
  if (!refs.importProgressDialog) return;
  const progress = state.batchImportProgress || {};
  const mode = String(progress.mode || "import").trim() || "import";
  const total = Math.max(0, Number(progress.total || 0));
  const completed = Math.max(0, Math.min(total || 0, Number(progress.completed || 0)));
  const success = Math.max(0, Number(progress.success || 0));
  const failed = Math.max(0, Number(progress.failed || 0));
  const uploadLoaded = Math.max(0, Number(progress.uploadBytesLoaded || 0));
  const uploadTotal = Math.max(0, Number(progress.uploadBytesTotal || 0));
  const percent = mode === "upload"
    ? (uploadTotal > 0 ? Math.max(0, Math.min(100, (uploadLoaded / uploadTotal) * 100)) : 0)
    : (total > 0 ? Math.max(0, Math.min(100, (completed / total) * 100)) : 0);
  if (refs.importProgressTitle) {
    const fallbackKey = mode === "upload"
      ? "importUploadTitle"
      : (total <= 1 ? "importProgressTitleSingle" : "importProgressTitle");
    refs.importProgressTitle.textContent = String(progress.title || "").trim() || state.shell.t(fallbackKey);
  }
  if (refs.importProgressHint) {
    if (mode === "upload") {
      refs.importProgressHint.textContent = state.shell.t("importUploadWarning");
    } else if (progress.phase === "finishing") {
      refs.importProgressHint.textContent = state.shell.t("importProgressFinishing");
    } else if (progress.phase === "queued") {
      refs.importProgressHint.textContent = state.shell.t("importProgressQueuedHint");
    } else {
      refs.importProgressHint.textContent = state.shell.t("importProgressServerHint");
    }
  }
  if (refs.btnImportProgressHide) refs.btnImportProgressHide.disabled = !progress.active || mode === "upload";
  if (refs.importProgressFill) refs.importProgressFill.style.width = `${percent.toFixed(1)}%`;
  if (refs.importProgressSummary) {
    refs.importProgressSummary.textContent = mode === "upload"
      ? state.shell.t("importUploadSummary", { done: completed, total })
      : state.shell.t("importProgressSummary", { done: completed, total });
  }
  if (refs.importProgressStats) {
    refs.importProgressStats.textContent = mode === "upload"
      ? state.shell.t("importUploadStats", { percent: percent.toFixed(0) })
      : state.shell.t("importProgressStats", { success, failed });
  }
  if (refs.importProgressCurrentFile) {
    const currentFile = String(progress.currentFile || "").trim();
    refs.importProgressCurrentFile.textContent = currentFile
      ? state.shell.t(mode === "upload" ? "importUploadCurrentFile" : "importProgressCurrentFile", { name: currentFile })
      : "";
  }
  if (progress.active && !progress.hidden) {
    if (!refs.importProgressDialog.open) refs.importProgressDialog.showModal();
  } else if (refs.importProgressDialog.open) {
    refs.importProgressDialog.close();
  }
}

function openBatchImportProgressDialog(total, {
  title = "",
  notificationId = "",
  kind = "import_file",
  mode = "import",
} = {}) {
  state.batchImportProgress = {
    active: true,
    total: Math.max(0, Number(total || 0)),
    completed: 0,
    success: 0,
    failed: 0,
    currentFile: "",
    phase: "importing",
    title: String(title || "").trim(),
    hidden: false,
    notificationId: String(notificationId || "").trim(),
    detail: "",
    errors: [],
    kind: String(kind || "import_file").trim() || "import_file",
    mode: String(mode || "import").trim() || "import",
    uploadBytesLoaded: 0,
    uploadBytesTotal: 0,
    finalHandled: false,
  };
  syncImportUploadUnloadGuard();
  renderBatchImportProgressDialog();
}

function updateBatchImportProgress(patch = {}) {
  state.batchImportProgress = {
    ...(state.batchImportProgress || {}),
    ...(patch || {}),
  };
  syncImportUploadUnloadGuard();
  renderBatchImportProgressDialog();
}

function closeBatchImportProgressDialog() {
  if (refs.importProgressDialog && refs.importProgressDialog.open) refs.importProgressDialog.close();
  resetBatchImportProgress();
}

async function uploadFilesBeforeImport(files, { title = "" } = {}) {
  const items = Array.isArray(files) ? files.filter(Boolean) : [];
  if (!items.length) return [];
  const totalBytes = items.reduce((sum, file) => sum + Math.max(0, Number((file && file.size) || 0)), 0);
  let uploadedBytes = 0;
  let completedFiles = 0;
  const uploaded = [];
  openBatchImportProgressDialog(items.length, {
    title: String(title || "").trim() || state.shell.t("importUploadTitle"),
    mode: "upload",
  });
  updateBatchImportProgress({
    total: items.length,
    completed: 0,
    currentFile: "",
    uploadBytesLoaded: 0,
    uploadBytesTotal: totalBytes,
    phase: "uploading",
  });
  try {
    for (const file of items) {
      const fileName = String((file && file.name) || "").trim() || "import.txt";
      updateBatchImportProgress({
        currentFile: fileName,
        completed: completedFiles,
        uploadBytesLoaded: uploadedBytes,
        uploadBytesTotal: totalBytes,
        phase: "uploading",
      });
      const data = await uploadImportFileToServer(file, {
        onProgress: ({ loaded, total }) => {
          const currentTotal = Math.max(0, Number(total || (file && file.size) || 0));
          const effectiveTotal = totalBytes > 0 ? totalBytes : (uploadedBytes + currentTotal);
          updateBatchImportProgress({
            currentFile: fileName,
            completed: completedFiles,
            uploadBytesLoaded: uploadedBytes + Math.max(0, Math.min(currentTotal || loaded, loaded)),
            uploadBytesTotal: effectiveTotal,
            phase: "uploading",
          });
        },
      });
      uploaded.push({
        file,
        token: String((data && data.token) || "").trim(),
        file_name: String((data && data.file_name) || fileName).trim() || fileName,
        file_ext: String((data && data.file_ext) || "").trim().toLowerCase(),
      });
      uploadedBytes += Math.max(0, Number((file && file.size) || 0));
      completedFiles += 1;
      updateBatchImportProgress({
        currentFile: fileName,
        completed: completedFiles,
        uploadBytesLoaded: uploadedBytes,
        uploadBytesTotal: totalBytes,
        phase: "uploading",
      });
    }
    return uploaded;
  } catch (error) {
    await cancelImportPreviewTokens(uploaded.map((item) => item && item.token), { silent: true });
    throw error;
  }
}

function trackServerImportJob(job, { title = "", kind = "import_file" } = {}) {
  if (!job || typeof job !== "object") return;
  state.batchImportProgress = {
    ...(state.batchImportProgress || {}),
    active: true,
    hidden: false,
    mode: "import",
    total: Math.max(0, Number(job.total || 0)),
    completed: Math.max(0, Number(job.completed || 0)),
    success: Math.max(0, Number(job.success || 0)),
    failed: Math.max(0, Number(job.failed || 0)),
    currentFile: String(job.current_file || "").trim(),
    phase: String(job.status || "queued").trim().toLowerCase() === "queued" ? "queued" : "importing",
    title: String(title || job.title || "").trim() || "Nhập vào thư viện",
    notificationId: String(job.notification_id || "").trim(),
    kind: String(kind || job.kind || "import_file").trim() || "import_file",
    uploadBytesLoaded: 0,
    uploadBytesTotal: 0,
    finalHandled: false,
  };
  syncImportUploadUnloadGuard();
  renderBatchImportProgressDialog();
}

async function enqueueImportJobRequest(items, { title = "", kind = "import_file" } = {}) {
  const rows = Array.isArray(items) ? items.filter((item) => item && String(item.token || "").trim()) : [];
  if (!rows.length) return null;
  const data = await state.shell.api("/api/library/import/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: String(title || "").trim(),
      kind: String(kind || "import_file").trim() || "import_file",
      category_ids: applySingleSelectionRules(state.importSelectedCategoryIds),
      items: rows.map((item) => ({
        token: String(item.token || "").trim(),
        file_name: String(item.file_name || "").trim(),
        title: String(item.title || "").trim(),
        author: String(item.author || "").trim(),
        summary: String(item.summary || "").trim(),
        lang_source: String(item.lang_source || "zh").trim() || "zh",
        import_settings: item.import_settings && typeof item.import_settings === "object"
          ? item.import_settings
          : undefined,
      })),
    }),
  });
  return data && data.job ? data.job : null;
}

function isActiveNotificationStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return normalized === "running" || normalized === "queued" || normalized === "active" || normalized === "progress";
}

async function handleTrackedImportNotificationListing(payload) {
  const progress = state.batchImportProgress || {};
  const notificationId = String(progress.notificationId || "").trim();
  if (!notificationId || String(progress.mode || "").trim() !== "import") return;
  const items = Array.isArray(payload && payload.items) ? payload.items : [];
  const current = items.find((item) => String((item && item.id) || "").trim() === notificationId);
  if (!current) return;
  const meta = (current && current.meta && typeof current.meta === "object") ? current.meta : {};
  const nextStatus = String((current && current.status) || "").trim().toLowerCase();
  const nextPhase = String(meta.phase || "").trim().toLowerCase() || (isActiveNotificationStatus(nextStatus) ? "importing" : "done");
  state.batchImportProgress = {
    ...(state.batchImportProgress || {}),
    total: Math.max(0, Number((current && current.progress_total) || progress.total || 0)),
    completed: Math.max(0, Number((current && current.progress_current) || 0)),
    success: Math.max(0, Number(meta.success_count || progress.success || 0)),
    failed: Math.max(0, Number(meta.failed_count || progress.failed || 0)),
    currentFile: String(meta.current_file || "").trim(),
    phase: nextPhase,
    detail: String((current && current.detail) || "").trim(),
    errors: [],
  };
  renderBatchImportProgressDialog();
  if (isActiveNotificationStatus(nextStatus)) return;
  if (state.batchImportProgress.finalHandled) return;
  state.batchImportProgress = {
    ...(state.batchImportProgress || {}),
    finalHandled: true,
  };
  closeBatchImportProgressDialog();
  await loadLibraryData({ silent: true }).catch(() => null);
  const success = Math.max(0, Number(meta.success_count || 0));
  const failed = Math.max(0, Number(meta.failed_count || 0));
  if (success > 0 && failed <= 0) {
    state.shell.showToast(success > 1 ? state.shell.t("importBatchImported") : state.shell.t("toastImportSuccess"));
  } else if (success > 0 && failed > 0) {
    state.shell.showToast(state.shell.t("importBatchSkippedFailed", { count: failed }));
  } else {
    const detailLines = String((current && current.detail) || "").split("\n");
    const firstError = detailLines.find((line) => String(line || "").trim().startsWith("- "));
    state.shell.showToast(
      (firstError ? String(firstError || "").trim().replace(/^-+\s*/, "") : "")
      || String((current && current.preview) || "").trim()
      || state.shell.t("toastError"),
    );
  }
}

function clearBatchImportSession() {
  state.batchImportPrepareRunId = 0;
  state.batchImportCommitBusy = false;
  state.batchImportItems = [];
  state.importPreviewBatchItemId = "";
  state.importPreviewContext = "single";
  state.importPreviewToken = "";
  state.importPreviewData = null;
  if (state.batchImportRenderTimer) {
    window.clearTimeout(state.batchImportRenderTimer);
    state.batchImportRenderTimer = 0;
  }
  renderBatchImportDialog();
}

function clearImportPreviewState() {
  state.importPreviewToken = "";
  state.importPreviewData = null;
  state.importPreviewContext = "single";
  state.importPreviewBatchItemId = "";
}

function collectBatchImportTokens() {
  return (state.batchImportItems || [])
    .map((item) => String((item && item.token) || "").trim())
    .filter(Boolean);
}

async function cancelImportPreviewTokens(tokens, { silent = true } = {}) {
  const normalized = Array.from(new Set(
    (Array.isArray(tokens) ? tokens : [])
      .map((token) => String(token || "").trim())
      .filter(Boolean),
  ));
  if (!normalized.length || !state.shell) return null;
  try {
    return await state.shell.api("/api/library/import/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens: normalized }),
    });
  } catch (error) {
    if (!silent) {
      state.shell.showToast(getErrorMessage(error));
    }
    return null;
  }
}

async function runItemsWithConcurrency(items, limit, worker) {
  const queue = Array.isArray(items) ? items : [];
  const total = queue.length;
  if (!total) return;
  const workerCount = Math.max(1, Math.min(Math.floor(Number(limit) || 1), total));
  let nextIndex = 0;
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < total) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      await worker(queue[currentIndex], currentIndex);
    }
  }));
}

async function applyImportCategoriesToBooks(bookIds, { silent = false } = {}) {
  const targetBookIds = normalizeBookIds(bookIds);
  const categoryIds = applySingleSelectionRules(state.importSelectedCategoryIds);
  if (!targetBookIds.length || !categoryIds.length) return true;
  try {
    await state.shell.api("/api/library/categories/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        book_ids: targetBookIds,
        category_ids: categoryIds,
        action: "add",
      }),
    });
    applyBooksCategoryActionLocal(targetBookIds, categoryIds, "add");
    await loadCategories({ silent: true }).catch(() => null);
    renderBooks();
    renderCategoryManagerList();
    renderCategoryManagerBooks();
    syncSelectedBookActions();
    return true;
  } catch (error) {
    if (!silent) {
      state.shell.showToast(`${state.shell.t("importCategoriesAssignFailed")} ${getErrorMessage(error)}`);
    }
    return false;
  }
}

function renderImportMetadataCandidates(items) {
  if (!refs.importPreviewMetadataCandidates) return;
  refs.importPreviewMetadataCandidates.innerHTML = "";
  const rows = Array.isArray(items) ? items : [];
  if (!rows.length) return;
  const title = document.createElement("p");
  title.className = "dialog-subtitle";
  title.textContent = state.shell.t("importMetadataCandidates");
  refs.importPreviewMetadataCandidates.appendChild(title);
  for (const row of rows) {
    const chip = document.createElement("div");
    chip.className = "import-candidate-row";
    chip.textContent = `${String((row && row.key) || "").trim()}: ${String((row && row.value) || "").trim()}`;
    refs.importPreviewMetadataCandidates.appendChild(chip);
  }
}

function currentImportMode() {
  return String((refs.importModeSelect && refs.importModeSelect.value) || "single").trim().toLowerCase() === "batch"
    ? "batch"
    : "single";
}

function syncImportModeUi() {
  const batch = currentImportMode() === "batch";
  if (refs.importBatchNote) refs.importBatchNote.hidden = !batch;
  if (refs.importFileInput) {
    refs.importFileInput.multiple = batch;
    refs.importFileInput.setAttribute("accept", ".txt,.epub");
  }
  if (refs.importBookTitleInput) refs.importBookTitleInput.disabled = batch;
  const submitButton = document.getElementById("btn-import-submit");
  if (submitButton && state.shell) {
    submitButton.textContent = state.shell.t(shouldSkipImportPrepare() ? "importDirectSubmit" : "prepareImport");
  }
  const fileLabel = document.getElementById("import-file-label");
  if (fileLabel && state.shell) {
    fileLabel.textContent = state.shell.t(batch ? "importFileBatch" : "importFile");
  }
}

function resetImportFormUi() {
  const mode = currentImportMode();
  const lang = String((refs.importLangInput && refs.importLangInput.value) || "zh").trim() || "zh";
  const skipPrepare = shouldSkipImportPrepare();
  if (refs.importForm) refs.importForm.reset();
  if (refs.importModeSelect) refs.importModeSelect.value = mode;
  if (refs.importLangInput) refs.importLangInput.value = lang;
  if (refs.importSkipPrepareInput) refs.importSkipPrepareInput.checked = skipPrepare;
  if (refs.importCategoriesSearchInput) refs.importCategoriesSearchInput.value = "";
  syncImportModeUi();
  renderImportCategoryList();
}

function getBatchImportItem(itemId) {
  const targetId = String(itemId || "").trim();
  return (state.batchImportItems || []).find((item) => String(item && item.id || "").trim() === targetId) || null;
}

function getBatchImportItemPayload(item) {
  const preview = item && item.preview && typeof item.preview === "object" ? item.preview : {};
  const metadata = preview && preview.metadata && typeof preview.metadata === "object" ? preview.metadata : {};
  return {
    title: String((item && item.edits && item.edits.title) || metadata.title || "").trim(),
    author: String((item && item.edits && item.edits.author) || metadata.author || "").trim(),
    summary: String((item && item.edits && item.edits.summary) || metadata.summary || "").trim(),
    lang_source: String((item && item.edits && item.edits.lang_source) || metadata.lang_source || "zh").trim() || "zh",
  };
}

function updateBatchImportItem(itemId, patch) {
  const targetId = String(itemId || "").trim();
  if (!targetId) return;
  state.batchImportItems = (state.batchImportItems || []).map((item) => (
    String((item && item.id) || "").trim() === targetId
      ? { ...item, ...(patch || {}) }
      : item
  ));
  scheduleBatchImportDialogRender();
}

function buildBatchImportCardTitle(item) {
  const payload = getBatchImportItemPayload(item);
  return payload.title || String((item && item.file_name) || "").trim() || state.shell.t("importBatchPreparing");
}

function syncImportPreviewCommitButton() {
  if (!refs.btnImportPreviewCommit || !state.shell) return;
  refs.btnImportPreviewCommit.textContent = state.shell.t(
    state.importPreviewContext === "batch" ? "importPreviewSaveEdits" : "confirmImport",
  );
}

function renderImportPreview(preview, { context = "single", batchItemId = "" } = {}) {
  if (!preview || !refs.importPreviewDialog) return;
  if (preview.presets) state.importPresets = preview.presets;
  state.importPreviewContext = context === "batch" ? "batch" : "single";
  state.importPreviewBatchItemId = state.importPreviewContext === "batch" ? String(batchItemId || "").trim() : "";
  state.importPreviewData = preview;
  state.importPreviewToken = state.importPreviewContext === "batch"
    ? String((getBatchImportItem(state.importPreviewBatchItemId) && getBatchImportItem(state.importPreviewBatchItemId).token) || "").trim()
    : String(state.importPreviewToken || "").trim();
  const metadata = preview.metadata || {};
  const payload = state.importPreviewContext === "batch"
    ? getBatchImportItemPayload(getBatchImportItem(state.importPreviewBatchItemId))
    : {
      title: String(metadata.title || ""),
      author: String(metadata.author || ""),
      summary: String(metadata.summary || ""),
      lang_source: String(metadata.lang_source || "zh").trim() || "zh",
    };
  refs.importPreviewFileName.textContent = String(preview.file_name || "");
  refs.importPreviewFileType.textContent = String(preview.file_ext || "").toUpperCase();
  refs.importPreviewChapterCount.textContent = String(metadata.chapter_count || 0);
  refs.importPreviewDetectedLang.textContent = String(metadata.detected_lang || metadata.lang_source || "-").trim() || "-";
  refs.importPreviewBookTitleInput.value = payload.title;
  refs.importPreviewAuthorInput.value = payload.author;
  refs.importPreviewSummaryInput.value = payload.summary;
  refs.importPreviewLangSelect.value = String(payload.lang_source || "zh").trim().toLowerCase() === "vi" ? "vi" : "zh";

  const diagnostics = preview.diagnostics || {};
  const splitStrategy = String(diagnostics.split_strategy || "").trim();
  const fallbackReasonKeyMap = {
    empty_after_regex: "importFallbackReasonEmptyRegex",
    too_many_long_blocks: "importFallbackReasonTooManyLongBlocks",
    heading_titles_too_long: "importFallbackReasonHeadingTitlesTooLong",
    headings_too_dense: "importFallbackReasonDenseHeadings",
    too_few_headings: "importFallbackReasonTooFewHeadings",
  };
  let strategyLabel = state.shell.t("importSplitStrategyFallback");
  if (splitStrategy === "regex") strategyLabel = state.shell.t("importSplitStrategyRegex");
  else if (splitStrategy === "regex_fallback") strategyLabel = state.shell.t("importSplitStrategyRegexFallback");
  const diagnosticParts = [strategyLabel];
  const matchedCount = Number(diagnostics.matched_heading_count || 0);
  const usedCount = Number(diagnostics.used_heading_count || 0);
  if (matchedCount > 0) {
    diagnosticParts.push(state.shell.t("importPreviewDiagnosticsMatched", { count: matchedCount }));
  }
  if (splitStrategy === "regex" && usedCount > 0) {
    diagnosticParts.push(state.shell.t("importPreviewDiagnosticsUsed", { count: usedCount }));
  }
  const fallbackReasonKey = fallbackReasonKeyMap[String(diagnostics.fallback_reason || "").trim()] || "";
  if (splitStrategy === "regex_fallback" && fallbackReasonKey) {
    diagnosticParts.push(state.shell.t("importPreviewDiagnosticsReason", { reason: state.shell.t(fallbackReasonKey) }));
  }
  const categorySummary = buildImportCategorySummaryText();
  if (categorySummary) {
    diagnosticParts.push(`${state.shell.t("importCategoriesLabel")}: ${categorySummary}`);
  }
  refs.importPreviewDiagnostics.textContent = diagnosticParts.join(" • ");
  renderImportMetadataCandidates(diagnostics.metadata_candidates || []);

  refs.importPreviewChapters.innerHTML = "";
  for (const row of Array.isArray(preview.chapters) ? preview.chapters : []) {
    const card = document.createElement("article");
    card.className = "import-preview-chapter-item";
    const head = document.createElement("div");
    head.className = "import-preview-chapter-head";
    head.textContent = `${Number(row.index || 0)}. ${normalizeDisplayTitle(row.title || "")}`;
    const meta = document.createElement("div");
    meta.className = "import-preview-chapter-meta";
    meta.textContent = state.shell.t("importPreviewChapterMeta", { words: Number(row.word_count || 0) });
    const body = document.createElement("div");
    body.className = "import-preview-chapter-text";
    body.textContent = String(row.preview || "").trim();
    card.append(head, meta, body);
    refs.importPreviewChapters.appendChild(card);
  }
  syncImportPreviewCommitButton();
  if (!refs.importPreviewDialog.open) refs.importPreviewDialog.showModal();
}

function collectImportPreviewPayload() {
  return {
    token: state.importPreviewToken,
    title: String((refs.importPreviewBookTitleInput && refs.importPreviewBookTitleInput.value) || "").trim(),
    author: String((refs.importPreviewAuthorInput && refs.importPreviewAuthorInput.value) || "").trim(),
    summary: String((refs.importPreviewSummaryInput && refs.importPreviewSummaryInput.value) || "").trim(),
    lang_source: String((refs.importPreviewLangSelect && refs.importPreviewLangSelect.value) || "zh").trim(),
  };
}

function buildPendingImportRecord() {
  const preview = state.importPreviewData || {};
  const metadata = preview.metadata || {};
  return {
    temp_id: `pending_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    import_kind: "file",
    token: String(state.importPreviewToken || "").trim(),
    title: String((refs.importPreviewBookTitleInput && refs.importPreviewBookTitleInput.value) || metadata.title || preview.file_name || "Đang nhập truyện").trim() || "Đang nhập truyện",
    author: String((refs.importPreviewAuthorInput && refs.importPreviewAuthorInput.value) || metadata.author || "").trim(),
    file_name: String(preview.file_name || "").trim(),
    file_ext: String(preview.file_ext || "").trim().toUpperCase(),
    lang_source: String((refs.importPreviewLangSelect && refs.importPreviewLangSelect.value) || metadata.lang_source || "zh").trim(),
    chapter_count: Math.max(0, Number(metadata.chapter_count || 0)),
    summary: String((refs.importPreviewSummaryInput && refs.importPreviewSummaryInput.value) || metadata.summary || "").trim(),
    source_label: `${state.shell.t("importPendingSource")} • ${String(preview.file_ext || "").trim().toUpperCase() || "TXT"}`,
    status_text: state.shell.t("importPendingStatus"),
    badge_text: state.shell.t("importPendingBadge"),
    meta_text: state.shell.t("importPendingMeta", { count: Math.max(0, Number(metadata.chapter_count || 0)) }),
  };
}

function buildSingleDirectImportPendingRecord(file) {
  const fileName = String((file && file.name) || "").trim() || "import.txt";
  const fileExt = fileName.includes(".") ? fileName.split(".").pop() : "txt";
  const titleInput = String((refs.importBookTitleInput && refs.importBookTitleInput.value) || "").trim();
  const authorInput = String((refs.importAuthorInput && refs.importAuthorInput.value) || "").trim();
  return {
    temp_id: `pending_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    import_kind: "file",
    token: "",
    title: titleInput || fileName || "Đang nhập truyện",
    author: authorInput,
    file_name: fileName,
    file_ext: String(fileExt || "txt").trim().toUpperCase(),
    lang_source: String((refs.importLangInput && refs.importLangInput.value) || "zh").trim() || "zh",
    chapter_count: 0,
    summary: "",
    source_label: `${state.shell.t("importPendingSource")} • ${String(fileExt || "txt").trim().toUpperCase() || "TXT"}`,
    status_text: state.shell.t("importPendingStatus"),
    badge_text: state.shell.t("importPendingBadge"),
    meta_text: "",
  };
}

function createBatchImportSkeletonCard(item) {
  const card = document.createElement("article");
  card.className = "book-card book-card-shell book-card-loading";
  card.setAttribute("aria-hidden", "true");

  const cover = document.createElement("div");
  cover.className = "book-card-cover book-card-cover-skeleton";
  cover.appendChild(createSkeletonBlock("book-card-cover-glow"));

  const body = document.createElement("div");
  body.className = "book-card-shell-body";
  body.append(
    createSkeletonBlock("book-card-skeleton-title"),
    createSkeletonBlock("book-card-skeleton-meta"),
  );
  const chipRow = document.createElement("div");
  chipRow.className = "book-card-skeleton-chip-row";
  chipRow.append(createSkeletonBlock("book-card-skeleton-chip"));
  const progressRow = document.createElement("div");
  progressRow.className = "book-card-progress-row";
  progressRow.append(
    createSkeletonBlock("book-card-skeleton-text"),
    createSkeletonBlock("book-card-skeleton-pill"),
  );
  body.append(chipRow, progressRow, createSkeletonBlock("book-card-skeleton-download"));
  card.append(cover, body);
  return card;
}

function setOverflowMarqueeText(element, text) {
  if (!element) return;
  const value = String(text || "").trim();
  element.innerHTML = "";
  element.classList.remove("overflow-marquee", "is-overflowing");
  if (!value) {
    element.textContent = "";
    element.removeAttribute("title");
    return;
  }
  element.title = value;
  element.classList.add("overflow-marquee");
  const track = document.createElement("span");
  track.className = "overflow-marquee-track";
  const primary = document.createElement("span");
  primary.className = "overflow-marquee-segment";
  primary.textContent = value;
  const duplicate = document.createElement("span");
  duplicate.className = "overflow-marquee-segment overflow-marquee-copy";
  duplicate.textContent = value;
  track.append(primary, duplicate);
  element.appendChild(track);

  const syncOverflow = () => {
    const needs = primary.scrollWidth > (element.clientWidth + 4);
    element.classList.toggle("is-overflowing", needs);
  };
  const schedule = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 16));
  schedule(() => schedule(syncOverflow));
  window.setTimeout(syncOverflow, 120);
}

function renderBatchImportCard(item) {
  if (!item || item.status === "loading") return createBatchImportSkeletonCard(item);
  const payload = getBatchImportItemPayload(item);
  const card = document.createElement("article");
  card.className = "book-card";
  if (item.status === "ready") card.classList.add("book-card-import-ready");
  if (item.status === "error") card.classList.add("book-card-import-error");
  if (item.status === "done") card.classList.add("book-card-import-done");
  const interactive = item.status === "ready" || (item.status === "error" && !!item.preview);
  if (interactive) {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
  } else {
    card.setAttribute("aria-disabled", "true");
  }

  const cover = document.createElement("div");
  cover.className = "book-card-cover";
  appendCoverMedia(cover, {
    title: buildBatchImportCardTitle(item),
    author: payload.author || "",
    tag: String((item.file_ext || "TXT")).toUpperCase(),
  });

  const body = document.createElement("div");
  const title = document.createElement("div");
  title.className = "book-card-title";
  setOverflowMarqueeText(title, normalizeDisplayTitle(buildBatchImportCardTitle(item)));

  const author = document.createElement("div");
  author.className = "book-card-meta";
  author.textContent = payload.author || state.shell.t("unknownAuthor");

  const source = document.createElement("div");
  source.className = "book-card-source";
  setOverflowMarqueeText(
    source,
    state.shell.t("importBatchFileName", { name: String(item.file_name || "").trim() || "unknown.txt" }),
  );

  const infoRow = document.createElement("div");
  infoRow.className = "book-card-progress-row";

  const chapterInfo = document.createElement("div");
  chapterInfo.className = "book-card-chapter";
  chapterInfo.textContent = state.shell.t("importBatchChapterCount", { count: Math.max(0, Number(item.chapter_count || 0)) });

  const badge = document.createElement("div");
  badge.className = "book-card-percent";
  if (item.status === "error") badge.textContent = state.shell.t("importBatchPrepareFailed");
  else if (item.status === "importing") badge.textContent = state.shell.t("importBatchImporting");
  else if (item.status === "done") badge.textContent = state.shell.t("importBatchImported");
  else badge.textContent = state.shell.t("importBatchReady");

  infoRow.append(chapterInfo, badge);

  const meta = document.createElement("div");
  meta.className = "book-card-download";
  meta.textContent = `${String((item.file_ext || "txt")).toUpperCase()} • ${String(payload.lang_source || "zh").toUpperCase()}`;

  body.append(title, author, source, infoRow, meta);

  if (item.status === "error" || interactive) {
    const hint = document.createElement("div");
    hint.className = "book-card-inline-hint";
    hint.textContent = item.status === "error"
      ? String(item.error || state.shell.t("importBatchPrepareFailed"))
      : state.shell.t("importBatchOpenEditor");
    body.appendChild(hint);
  }

  card.append(cover, body);
  if (interactive) {
    const openEditor = () => {
      const current = getBatchImportItem(item.id);
      if (!current || !current.preview) return;
      renderImportPreview(current.preview, { context: "batch", batchItemId: current.id });
    };
    card.addEventListener("click", openEditor);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openEditor();
      }
    });
  }
  return card;
}

function renderBatchImportDialog() {
  if (!refs.importBatchGrid || !refs.importBatchSummary || !refs.btnImportBatchCommit || !refs.importBatchEmpty) return;
  if (state.batchImportRenderTimer) {
    window.clearTimeout(state.batchImportRenderTimer);
    state.batchImportRenderTimer = 0;
  }
  refs.importBatchGrid.innerHTML = "";
  const items = Array.isArray(state.batchImportItems) ? state.batchImportItems : [];
  const total = items.length;
  const loadingCount = items.filter((item) => item.status === "loading").length;
  const readyCount = items.filter((item) => item.status === "ready").length;
  const doneCount = items.filter((item) => item.status === "done").length;
  const failedCount = items.filter((item) => item.status === "error").length;
  const importingCount = items.filter((item) => item.status === "importing").length;
  const preparedCount = total - loadingCount;

  if (!total) {
    refs.importBatchEmpty.classList.remove("hidden");
    refs.importBatchEmpty.textContent = state.shell.t("importBatchEmpty");
    refs.importBatchSummary.textContent = "";
    if (refs.importBatchHint) refs.importBatchHint.textContent = state.shell.t("importBatchHint");
    refs.btnImportBatchCommit.textContent = state.shell.t("importBatchCommit");
    refs.btnImportBatchCommit.disabled = true;
    return;
  }
  refs.importBatchEmpty.classList.add("hidden");

  if (refs.importBatchHint) {
    const categorySummary = buildImportCategorySummaryText();
    refs.importBatchHint.textContent = categorySummary
      ? `${state.shell.t("importBatchHint")}\n${state.shell.t("importCategoriesLabel")}: ${categorySummary}`
      : state.shell.t("importBatchHint");
  }

  for (const item of items) {
    refs.importBatchGrid.appendChild(renderBatchImportCard(item));
  }

  const summaryParts = [];
  if (loadingCount > 0) {
    summaryParts.push(state.shell.t("importBatchSummaryLoading", { done: preparedCount, total }));
  } else if (state.batchImportCommitBusy || importingCount > 0 || (doneCount > 0 && readyCount <= 0)) {
    summaryParts.push(state.shell.t("importBatchSummaryDone", { done: doneCount, total }));
  } else {
    summaryParts.push(state.shell.t("importBatchSummaryReady", { ready: readyCount, total }));
  }
  if (failedCount > 0) summaryParts.push(state.shell.t("importBatchSummaryFailed", { failed: failedCount }));
  refs.importBatchSummary.textContent = summaryParts.join(" • ");

  const commitCount = state.batchImportCommitBusy ? importingCount || readyCount : readyCount;
  refs.btnImportBatchCommit.textContent = commitCount > 0
    ? state.shell.t("importBatchCommitCount", { count: commitCount })
    : state.shell.t("importBatchCommit");
  refs.btnImportBatchCommit.disabled = state.batchImportCommitBusy || loadingCount > 0 || readyCount <= 0;
}

async function saveBatchImportPreviewEdits() {
  const itemId = String(state.importPreviewBatchItemId || "").trim();
  const item = getBatchImportItem(itemId);
  if (!item) return;
  const payload = collectImportPreviewPayload();
  updateBatchImportItem(itemId, {
    status: item.status === "error" ? "ready" : item.status,
    error: "",
    edits: {
      title: String(payload.title || "").trim(),
      author: String(payload.author || "").trim(),
      summary: String(payload.summary || "").trim(),
      lang_source: String(payload.lang_source || "zh").trim() || "zh",
    },
  });
  if (refs.importPreviewDialog && refs.importPreviewDialog.open) refs.importPreviewDialog.close();
}

function addPendingImport(record) {
  state.pendingImports = [record, ...state.pendingImports.filter((item) => String(item.temp_id || "") !== String(record.temp_id || ""))];
  renderBooks();
}

function updatePendingImport(tempId, patch) {
  const targetId = String(tempId || "").trim();
  if (!targetId) return;
  state.pendingImports = state.pendingImports.map((item) => (
    String(item.temp_id || "") === targetId ? { ...item, ...(patch || {}) } : item
  ));
  renderBooks();
}

function removePendingImport(tempId) {
  const targetId = String(tempId || "").trim();
  if (!targetId) return;
  state.pendingImports = state.pendingImports.filter((item) => String(item.temp_id || "") !== targetId);
  renderBooks();
}

async function applyImportedBookLocal(book, { pendingTempId = "", refresh = true } = {}) {
  const bid = String((book && book.book_id) || "").trim();
  if (pendingTempId) {
    const pendingId = String(pendingTempId || "").trim();
    if (pendingId) {
      state.pendingImports = state.pendingImports.filter((item) => String(item.temp_id || "") !== pendingId);
    }
  }
  invalidateCategoryManagerBooks();
  if (!bid) {
    renderBooks();
    return null;
  }
  if (refresh) {
    await reloadLibraryBooks({ silent: true }).catch(() => null);
  } else {
    renderBooks();
  }
  return findStateBook(bid);
}

function buildPendingUrlImportRecord({ url, pluginId }) {
  let host = "";
  try {
    host = new URL(String(url || "").trim()).host || "";
  } catch {
    host = "";
  }
  const pluginText = String(pluginId || "").trim();
  return {
    temp_id: `pending_url_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    import_kind: "url",
    source_url: String(url || "").trim(),
    plugin_id: pluginText,
    cover_url: "",
    title: host || String(url || "").trim() || state.shell.t("importPendingUrlTitle"),
    author: "",
    source_label: `${state.shell.t("importPendingUrlSource")} • ${host || pluginText || state.shell.t("importUrlPluginAuto")}`,
    status_text: state.shell.t("importPendingUrlResolving"),
    badge_text: state.shell.t("importPendingBadge"),
    meta_text: state.shell.t("importPendingUrlWaiting"),
    summary: "",
    chapter_count: 0,
    lang_source: "zh",
  };
}

function pendingUrlSourceLabel(preview, fallbackUrl, fallbackPluginId) {
  let host = "";
  const sourceUrl = String((preview && preview.source_url) || fallbackUrl || "").trim();
  try {
    host = sourceUrl ? (new URL(sourceUrl).host || "") : "";
  } catch {
    host = "";
  }
  const pluginName = String((preview && preview.plugin_name) || "").trim();
  const pluginText = String(fallbackPluginId || "").trim();
  return `${state.shell.t("importPendingUrlSource")} • ${pluginName || host || pluginText || state.shell.t("importUrlPluginAuto")}`;
}

function buildImportPrepareForm(file, { title = "", author = "" } = {}) {
  const form = new FormData();
  form.set("file", file, (file && file.name) || "import.txt");
  form.set("lang_source", String((refs.importLangInput && refs.importLangInput.value) || "zh").trim() || "zh");
  form.set("title", String(title || "").trim());
  form.set("author", String(author || "").trim());
  form.set("import_settings", JSON.stringify(state.importSettings || {}));
  return form;
}

function buildBatchImportItem(file, index) {
  const rawName = String((file && file.name) || "").trim() || `import_${index + 1}.txt`;
  const fileExt = rawName.includes(".") ? rawName.split(".").pop() : "txt";
  return {
    id: `batch_${Date.now()}_${index}_${Math.random().toString(16).slice(2, 8)}`,
    file,
    file_size: Math.max(0, Number((file && file.size) || 0)),
    file_name: rawName,
    file_ext: String(fileExt || "txt").toLowerCase(),
    token: "",
    preview: null,
    edits: {},
    chapter_count: 0,
    status: "loading",
    error: "",
  };
}

async function prepareBatchImports(files) {
  const items = Array.isArray(files) ? files.filter(Boolean) : [];
  if (!items.length) return;
  const runId = Date.now();
  closeBatchImportProgressDialog();
  state.batchImportPrepareRunId = runId;
  state.batchImportCommitBusy = false;
  state.batchImportItems = items.map((file, index) => buildBatchImportItem(file, index));
  if (refs.importDialog && refs.importDialog.open) refs.importDialog.close();

  const sharedAuthor = String((refs.importAuthorInput && refs.importAuthorInput.value) || "").trim();
  const sharedTitle = items.length === 1
    ? String((refs.importBookTitleInput && refs.importBookTitleInput.value) || "").trim()
    : "";

  state.shell.showStatus(state.shell.t("importBatchPreparing"));
  try {
    const uploaded = await uploadFilesBeforeImport(items, {
      title: state.shell.t("importUploadTitle"),
    });
    state.batchImportItems = state.batchImportItems.map((item, index) => ({
      ...item,
      file: null,
      token: String((uploaded[index] && uploaded[index].token) || "").trim(),
      file_name: String((uploaded[index] && uploaded[index].file_name) || item.file_name || "").trim() || item.file_name,
      file_ext: String((uploaded[index] && uploaded[index].file_ext) || item.file_ext || "").trim().toLowerCase() || item.file_ext,
      status: "loading",
      error: "",
    }));
    renderBatchImportDialog();
    closeBatchImportProgressDialog();
    if (refs.importBatchDialog && !refs.importBatchDialog.open) refs.importBatchDialog.showModal();
    await runItemsWithConcurrency(state.batchImportItems, BATCH_IMPORT_PREPARE_CONCURRENCY, async (item) => {
      if (state.batchImportPrepareRunId !== runId) return;
      if (!String(item.token || "").trim()) {
        updateBatchImportItem(item.id, {
          status: "error",
          error: state.shell.t("importUploadFailed"),
        });
        return;
      }
      try {
        const data = await state.shell.api("/api/library/import/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: String(item.token || "").trim(),
            title: sharedTitle,
            author: sharedAuthor,
            lang_source: String((refs.importLangInput && refs.importLangInput.value) || "zh").trim() || "zh",
            import_settings: state.importSettings || {},
          }),
        });
        if (state.batchImportPrepareRunId !== runId) return;
        const preview = data && data.preview ? data.preview : null;
        const metadata = preview && preview.metadata && typeof preview.metadata === "object" ? preview.metadata : {};
        updateBatchImportItem(item.id, {
          token: String((data && data.token) || "").trim(),
          preview,
          chapter_count: Math.max(0, Number(metadata.chapter_count || 0)),
          status: "ready",
          error: "",
          edits: {
            title: String(metadata.title || "").trim(),
            author: String(metadata.author || "").trim(),
            summary: String(metadata.summary || "").trim(),
            lang_source: String(metadata.lang_source || "zh").trim() || "zh",
          },
        });
      } catch (error) {
        if (state.batchImportPrepareRunId !== runId) return;
        await cancelImportPreviewTokens([item.token], { silent: true });
        updateBatchImportItem(item.id, {
          status: "error",
          token: "",
          error: getErrorMessage(error),
        });
      }
    });
    resetImportFormUi();
    renderBatchImportDialog();
  } catch (error) {
    const tokens = collectBatchImportTokens();
    clearBatchImportSession();
    await cancelImportPreviewTokens(tokens, { silent: true });
    closeBatchImportProgressDialog();
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function importSingleFileDirect(file) {
  if (!file) return;
  if (refs.importDialog && refs.importDialog.open) refs.importDialog.close();
  state.shell.showStatus(state.shell.t("statusImporting"));
  let uploadedTokens = [];
  try {
    const uploaded = await uploadFilesBeforeImport([file], {
      title: state.shell.t("importUploadTitle"),
    });
    uploadedTokens = uploaded.map((item) => String((item && item.token) || "").trim()).filter(Boolean);
    const uploadedItem = uploaded[0] || null;
    if (!uploadedItem || !String(uploadedItem.token || "").trim()) {
      throw new Error(state.shell.t("importUploadFailed"));
    }
    const job = await enqueueImportJobRequest([
      {
        token: String(uploadedItem.token || "").trim(),
        file_name: String(uploadedItem.file_name || file.name || "").trim(),
        title: (refs.importBookTitleInput && refs.importBookTitleInput.value) || "",
        author: (refs.importAuthorInput && refs.importAuthorInput.value) || "",
        lang_source: String((refs.importLangInput && refs.importLangInput.value) || "zh").trim() || "zh",
        import_settings: state.importSettings || {},
      },
    ], {
      title: "Nhập file vào thư viện",
      kind: "import_file",
    });
    closeBatchImportProgressDialog();
    trackServerImportJob(job, {
      title: "Nhập file vào thư viện",
      kind: "import_file",
    });
    uploadedTokens = [];
    resetImportFormUi();
  } catch (error) {
    await cancelImportPreviewTokens(uploadedTokens, { silent: true });
    closeBatchImportProgressDialog();
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function importBatchFilesDirect(files) {
  const items = Array.isArray(files) ? files.filter(Boolean) : [];
  if (!items.length) return;
  if (refs.importDialog && refs.importDialog.open) refs.importDialog.close();
  state.shell.showStatus(state.shell.t("importBatchImporting"));
  let uploadedTokens = [];
  try {
    const uploaded = await uploadFilesBeforeImport(items, {
      title: state.shell.t("importUploadTitle"),
    });
    uploadedTokens = uploaded.map((item) => String((item && item.token) || "").trim()).filter(Boolean);
    const job = await enqueueImportJobRequest(
      uploaded.map((item) => ({
        token: String(item.token || "").trim(),
        file_name: String(item.file_name || "").trim(),
        title: "",
        author: (refs.importAuthorInput && refs.importAuthorInput.value) || "",
        lang_source: String((refs.importLangInput && refs.importLangInput.value) || "zh").trim() || "zh",
        import_settings: state.importSettings || {},
      })),
      {
        title: "Nhập file hàng loạt vào thư viện",
        kind: "import_file_batch",
      },
    );
    closeBatchImportProgressDialog();
    trackServerImportJob(job, {
      title: "Nhập file hàng loạt vào thư viện",
      kind: "import_file_batch",
    });
    uploadedTokens = [];
    resetImportFormUi();
  } catch (error) {
    await cancelImportPreviewTokens(uploadedTokens, { silent: true });
    closeBatchImportProgressDialog();
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function handlePrepareImport() {
  const fileInput = refs.importFileInput;
  const files = Array.from((fileInput && fileInput.files) || []).filter(Boolean);
  if (!files.length) return;
  if (shouldSkipImportPrepare()) {
    if (currentImportMode() === "batch") {
      await importBatchFilesDirect(files);
      return;
    }
    await importSingleFileDirect(files[0]);
    return;
  }
  if (currentImportMode() === "batch") {
    await prepareBatchImports(files);
    return;
  }

  const file = files[0];
  state.shell.showStatus(state.shell.t("statusPreparingImport"));
  let previewToken = "";
  try {
    const uploaded = await uploadFilesBeforeImport([file], {
      title: state.shell.t("importUploadTitle"),
    });
    const uploadedItem = uploaded[0] || null;
    if (!uploadedItem || !String(uploadedItem.token || "").trim()) {
      throw new Error(state.shell.t("importUploadFailed"));
    }
    previewToken = String(uploadedItem.token || "").trim();
    const data = await state.shell.api("/api/library/import/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: previewToken,
        title: (refs.importBookTitleInput && refs.importBookTitleInput.value) || "",
        author: (refs.importAuthorInput && refs.importAuthorInput.value) || "",
        lang_source: String((refs.importLangInput && refs.importLangInput.value) || "zh").trim() || "zh",
        import_settings: state.importSettings || {},
      }),
    });
    closeBatchImportProgressDialog();
    state.importPreviewToken = String((data && data.token) || "").trim();
    state.importPreviewContext = "single";
    state.importPreviewBatchItemId = "";
    if (refs.importDialog && refs.importDialog.open) refs.importDialog.close();
    renderImportPreview(data && data.preview ? data.preview : null, { context: "single" });
    previewToken = "";
  } catch (error) {
    await cancelImportPreviewTokens([previewToken], { silent: true });
    closeBatchImportProgressDialog();
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function commitBatchImports() {
  if (state.batchImportCommitBusy) return;
  const items = (state.batchImportItems || []).filter((item) => item.status === "ready" && String(item.token || "").trim());
  if (!items.length) return;
  state.batchImportCommitBusy = true;
  const tokens = items.map((item) => String(item.token || "").trim()).filter(Boolean);
  if (refs.importPreviewDialog && refs.importPreviewDialog.open) refs.importPreviewDialog.close();
  if (refs.importBatchDialog && refs.importBatchDialog.open) refs.importBatchDialog.close();
  state.shell.showStatus(state.shell.t("importBatchImporting"));
  try {
    const job = await enqueueImportJobRequest(
      items.map((item) => ({
        token: String(item.token || "").trim(),
        file_name: String(item.file_name || "").trim(),
        ...getBatchImportItemPayload(item),
      })),
      {
        title: "Nhập file hàng loạt vào thư viện",
        kind: "import_file_batch",
      },
    );
    trackServerImportJob(job, {
      title: "Nhập file hàng loạt vào thư viện",
      kind: "import_file_batch",
    });
  } catch (error) {
    await cancelImportPreviewTokens(tokens, { silent: true });
    state.shell.showToast(getErrorMessage(error));
  } finally {
    clearBatchImportSession();
    state.shell.hideStatus();
  }
}

async function commitPreparedImport() {
  if (state.importPreviewContext === "batch") {
    await saveBatchImportPreviewEdits();
    return;
  }
  if (!state.importPreviewToken) return;
  const payload = collectImportPreviewPayload();
  const token = String(state.importPreviewToken || "").trim();
  clearImportPreviewState();
  if (refs.importPreviewDialog && refs.importPreviewDialog.open) refs.importPreviewDialog.close();
  try {
    const job = await enqueueImportJobRequest([
      {
        token,
        file_name: String((state.importPreviewData && state.importPreviewData.file_name) || "").trim(),
        ...payload,
      },
    ], {
      title: "Nhập file vào thư viện",
      kind: "import_file",
    });
    trackServerImportJob(job, {
      title: "Nhập file vào thư viện",
      kind: "import_file",
    });
    resetImportFormUi();
  } catch (error) {
    await cancelImportPreviewTokens([token], { silent: true });
    state.shell.showToast(getErrorMessage(error));
  }
}

async function handleImportUrlPrepare({ url, pluginId, resetForm, closeDialog }) {
  const pending = buildPendingUrlImportRecord({ url, pluginId });
  const notificationId = state.shell.createNotificationTaskId("import_url");
  closeDialog();
  resetForm();
  addPendingImport(pending);
  try {
    await state.shell.upsertNotificationTask({
      id: notificationId,
      kind: "import_url",
      topic: "import",
      topic_label: "Nhập bằng URL",
      title: "Nhập truyện bằng URL",
      preview: `Đang lấy thông tin: ${url}`,
      detail: `URL: ${url}\nPlugin: ${pluginId || "Tự nhận diện"}`,
      status: "running",
    }).catch(() => {});
    const prepared = await state.shell.api("/api/library/import-url/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        plugin_id: pluginId || "",
      }),
    });
    const existingBookId = String((prepared && prepared.book && prepared.book.book_id) || "").trim();
    if (existingBookId) {
      pending.resolved_book_id = existingBookId;
      state.shell.showToast(state.shell.t("toastImportUrlExisting"));
      await applyImportedBookLocal(prepared && prepared.book, { pendingTempId: pending.temp_id, refresh: true });
      await state.shell.upsertNotificationTask({
        id: notificationId,
        kind: "import_url",
        topic: "import",
        topic_label: "Nhập bằng URL",
        title: "Nhập truyện bằng URL",
        preview: "Truyện này đã có sẵn trong thư viện.",
        detail: `URL: ${url}\nKết quả: truyện đã có sẵn trong thư viện.`,
        status: "success",
        book_id: existingBookId,
        book_title: String((prepared && prepared.book && (prepared.book.title_display || prepared.book.title)) || "").trim(),
      }).catch(() => {});
      return;
    }

    const preview = (prepared && prepared.preview) || {};
    await state.shell.upsertNotificationTask({
      id: notificationId,
      kind: "import_url",
      topic: "import",
      topic_label: "Nhập bằng URL",
      title: "Nhập truyện bằng URL",
      preview: "Đã lấy thông tin, đang nhập mục lục...",
      detail: `URL: ${url}\nTên truyện: ${String(preview.title || pending.title || "").trim() || "Không rõ"}\nĐang lấy mục lục và tạo truyện local.`,
      status: "running",
    }).catch(() => {});
    updatePendingImport(pending.temp_id, {
      token: String((prepared && prepared.token) || "").trim(),
      title: String(preview.title || pending.title || "").trim() || pending.title,
      author: String(preview.author || "").trim(),
      cover_url: String(preview.cover || "").trim(),
      summary: String(preview.summary || "").trim(),
      lang_source: String(preview.lang_source || pending.lang_source || "zh").trim(),
      source_label: pendingUrlSourceLabel(preview, url, pluginId),
      status_text: state.shell.t("importPendingUrlLoadingToc"),
      meta_text: state.shell.t("importPendingUrlResolved"),
    });

    const committed = await state.shell.api("/api/library/import-url/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: String((prepared && prepared.token) || "").trim(),
      }),
    });
    const bid = String((committed && committed.book && committed.book.book_id) || "").trim();
    if (bid) pending.resolved_book_id = bid;
    state.shell.showToast(state.shell.t("toastImportSuccess"));
    await applyImportedBookLocal(committed && committed.book, { pendingTempId: pending.temp_id, refresh: true });
    await state.shell.upsertNotificationTask({
      id: notificationId,
      kind: "import_url",
      topic: "import",
      topic_label: "Nhập bằng URL",
      title: "Nhập truyện bằng URL",
      preview: "Hoàn tất: thành công 1 • lỗi 0",
      detail: `URL: ${url}\nTên truyện: ${String((committed && committed.book && (committed.book.title_display || committed.book.title)) || preview.title || pending.title || "").trim() || "Không rõ"}\nKết quả: thành công 1 • lỗi 0`,
      status: "success",
      book_id: bid,
      book_title: String((committed && committed.book && (committed.book.title_display || committed.book.title)) || preview.title || pending.title || "").trim(),
    }).catch(() => {});
  } catch (error) {
    removePendingImport(pending.temp_id);
    await state.shell.upsertNotificationTask({
      id: notificationId,
      kind: "import_url",
      topic: "import",
      topic_label: "Nhập bằng URL",
      title: "Nhập truyện bằng URL",
      preview: `Thất bại: ${url}`,
      detail: `URL: ${url}\nLỗi: ${getErrorMessage(error)}`,
      status: "failed",
    }).catch(() => {});
    state.shell.showToast(getErrorMessage(error));
  }
}

function buildSourceLabel(book) {
  const sourceType = String((book && book.source_type) || "").trim().toLowerCase();
  if (sourceType !== "vbook" && sourceType !== "vbook_comic") return "";
  const pluginId = String((book && book.source_plugin) || "").trim();
  const sourceUrl = String((book && book.source_url) || "").trim();
  const isComic = Boolean(book && book.is_comic);
  let host = "";
  if (sourceUrl) {
    try {
      host = new URL(sourceUrl).host || "";
    } catch {
      host = "";
    }
  }
  const base = isComic ? "vBook Comic" : "vBook";
  if (host) return `${base} • ${host}`;
  if (pluginId) return `${base} • ${pluginId}`;
  return base;
}

function buildHistorySourceLabel(item) {
  const pluginId = String((item && item.plugin_id) || "").trim();
  const sourceUrl = String((item && item.source_url) || "").trim();
  let host = "";
  if (sourceUrl) {
    try {
      host = new URL(sourceUrl).host || "";
    } catch {
      host = "";
    }
  }
  if (host) return `vBook • ${host}`;
  if (pluginId) return `vBook • ${pluginId}`;
  return "vBook";
}

function parseBooleanLike(value) {
  if (typeof value === "boolean") return value;
  const raw = String(value == null ? "" : value).trim().toLowerCase();
  if (!raw) return null;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return null;
}

function coverHashSeed(...parts) {
  const seed = parts.map((item) => String(item || "").trim()).filter(Boolean).join("|") || "reader";
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash * 33) + seed.charCodeAt(index)) >>> 0;
  }
  return hash >>> 0;
}

function escapeSvgText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildFallbackCoverDataUrl({ title = "", author = "", tag = "" } = {}) {
  const safeTitle = normalizeDisplayTitle(title || state.shell.t("noCover") || "No Cover");
  const initials = safeTitle
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item.charAt(0).toUpperCase())
    .join("") || "BK";
  const palette = [
    ["#233a7a", "#6aa0ff", "#eef5ff"],
    ["#23545f", "#6bc8d7", "#edfdfd"],
    ["#5a345b", "#e7a7dd", "#fff1fb"],
    ["#6b3f28", "#f2b07c", "#fff6ef"],
    ["#3c4f2d", "#b9d96b", "#f8ffe8"],
    ["#40456f", "#9ca5ff", "#f3f4ff"],
  ];
  const [bg1, bg2, text] = palette[coverHashSeed(safeTitle, author, tag) % palette.length];
  const safeAuthor = String(author || "").trim();
  const safeTag = String(tag || "").trim().toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 680">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg1}"/>
          <stop offset="100%" stop-color="${bg2}"/>
        </linearGradient>
      </defs>
      <rect width="480" height="680" rx="28" fill="url(#g)"/>
      <circle cx="402" cy="90" r="62" fill="rgba(255,255,255,0.10)"/>
      <circle cx="90" cy="590" r="88" fill="rgba(255,255,255,0.08)"/>
      <text x="54" y="102" fill="rgba(255,255,255,0.78)" font-size="26" font-family="Arial, sans-serif">${escapeSvgText(safeTag || "READER")}</text>
      <text x="54" y="250" fill="${text}" font-size="122" font-weight="700" font-family="Arial, sans-serif">${escapeSvgText(initials)}</text>
      <foreignObject x="54" y="300" width="372" height="228">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; color: ${text}; font-size: 36px; line-height: 1.25; font-weight: 700; word-break: break-word;">
          ${escapeSvgText(safeTitle)}
        </div>
      </foreignObject>
      <text x="54" y="626" fill="rgba(255,255,255,0.86)" font-size="28" font-family="Arial, sans-serif">${escapeSvgText(safeAuthor || state.shell.t("unknownAuthor"))}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function appendCoverMedia(container, { coverUrl = "", title = "", author = "", tag = "" } = {}) {
  if (!container) return;
  container.innerHTML = "";
  const fallbackUrl = buildFallbackCoverDataUrl({ title, author, tag });
  const img = document.createElement("img");
  img.loading = "lazy";
  img.decoding = "async";
  img.alt = normalizeDisplayTitle(title || state.shell.t("noCover"));
  img.src = String(coverUrl || "").trim() || fallbackUrl;
  img.addEventListener("error", () => {
    if (img.dataset.fallbackApplied === "1") return;
    img.dataset.fallbackApplied = "1";
    img.src = fallbackUrl;
  });
  container.appendChild(img);
}

function applyBookUrlHints(params, book) {
  if (!book || typeof book !== "object") return;
  const translationSupported = parseBooleanLike(book.translation_supported);
  const isComic = parseBooleanLike(book.is_comic);
  if (translationSupported !== null) params.set("translation_supported", translationSupported ? "1" : "0");
  if (isComic !== null) params.set("is_comic", isComic ? "1" : "0");
}

function isOnlineSourceBook(book) {
  const sourceType = String((book && book.source_type) || "").trim().toLowerCase();
  return sourceType === "vbook" || sourceType === "vbook_comic" || sourceType.startsWith("vbook_session");
}

function closeActions() {
  if (refs.bookActionsDialog && refs.bookActionsDialog.open) {
    refs.bookActionsDialog.close();
  }
}

function openActions(bookId) {
  if (isBookDeleting(bookId)) return;
  const book = state.books.find((x) => x.book_id === bookId);
  if (!book) return;
  state.selectedBookId = bookId;
  const downloaded = Math.max(0, Number(book.downloaded_chapters || 0));
  const total = Math.max(0, Number(book.chapter_count || 0));
  refs.bookActionsSubtitle.textContent = `${book.title_display || book.title || ""} • ${book.author_display || book.author || "Khuyết danh"} • ${state.shell.t("downloadedCountShort", { downloaded, total })}`;
  if (refs.btnActionOpenReader) {
    const percent = Number(book.progress_percent || 0);
    refs.btnActionOpenReader.textContent = percent > 0 ? state.shell.t("openReaderContinue") : state.shell.t("openReader");
  }
  if (refs.btnActionDownload) {
    refs.btnActionDownload.textContent = state.shell.t("downloadBook");
    refs.btnActionDownload.disabled = total > 0 && downloaded >= total;
  }
  if (refs.btnActionCheckUpdates) {
    refs.btnActionCheckUpdates.textContent = state.shell.t("checkBookUpdates");
    refs.btnActionCheckUpdates.classList.toggle("hidden", !isOnlineSourceBook(book));
  }
  renderBookActionsCategories(book);
  if (refs.btnActionExport) refs.btnActionExport.textContent = state.shell.t("exportBook");
  if (!refs.bookActionsDialog.open) {
    refs.bookActionsDialog.showModal();
  }
}

function renderPendingImportCard(item) {
  const card = document.createElement("article");
  card.className = "book-card book-card-pending";
  card.setAttribute("aria-disabled", "true");

  const cover = document.createElement("div");
  cover.className = "book-card-cover book-card-cover-pending";
  appendCoverMedia(cover, {
    coverUrl: item.cover_url,
    title: item.title || state.shell.t("importPendingUrlTitle"),
    author: item.author || "",
    tag: item.import_kind === "url" ? "URL" : (item.file_ext || "TXT"),
  });

  const body = document.createElement("div");
  const title = document.createElement("div");
  title.className = "book-card-title";
  setOverflowMarqueeText(title, normalizeDisplayTitle(item.title || state.shell.t("importPendingUrlTitle")));

  const author = document.createElement("div");
  author.className = "book-card-meta";
  author.textContent = item.author || state.shell.t("unknownAuthor");

  const source = document.createElement("div");
  source.className = "book-card-source";
  setOverflowMarqueeText(source, String(item.source_label || `${state.shell.t("importPendingSource")} • ${item.file_ext || "TXT"}`));

  const infoRow = document.createElement("div");
  infoRow.className = "book-card-progress-row";

  const status = document.createElement("div");
  status.className = "book-card-chapter";
  status.textContent = String(item.status_text || state.shell.t("importPendingStatus"));

  const badge = document.createElement("div");
  badge.className = "book-card-percent";
  badge.textContent = String(item.badge_text || state.shell.t("importPendingBadge"));

  infoRow.append(status, badge);

  const meta = document.createElement("div");
  meta.className = "book-card-download";
  meta.textContent = String(item.meta_text || state.shell.t("importPendingMeta", { count: Math.max(0, Number(item.chapter_count || 0)) }));

  const bar = document.createElement("div");
  bar.className = "book-card-import-progress";
  const fill = document.createElement("div");
  fill.className = "book-card-import-progress-fill";
  bar.appendChild(fill);

  body.append(title, author, source, infoRow, meta, bar);
  card.append(cover, body);
  return card;
}

function cancelLibraryHydrationFrame() {
  if (!state.libraryHydrateFrame) return;
  const cancel = window.cancelAnimationFrame || window.clearTimeout;
  cancel(state.libraryHydrateFrame);
  state.libraryHydrateFrame = 0;
}

function teardownLibraryLazyRender() {
  if (state.libraryCardObserver) {
    try {
      state.libraryCardObserver.disconnect();
    } catch {
      // ignore
    }
    state.libraryCardObserver = null;
  }
  cancelLibraryHydrationFrame();
  state.libraryHydrateQueue = [];
}

function teardownLibraryLoadObserver() {
  if (state.libraryLoadObserver) {
    try {
      state.libraryLoadObserver.disconnect();
    } catch {
      // ignore
    }
    state.libraryLoadObserver = null;
  }
}

function maybeLoadMoreLibraryBooks() {
  if (state.libraryLoadingPage || !state.libraryHasMore) return;
  const sentinel = refs.libraryLoadMoreSentinel;
  if (!sentinel) return;
  const scrollRoot = refs.libraryListScroll;
  const rect = sentinel.getBoundingClientRect();
  const viewportBottom = scrollRoot
    ? scrollRoot.getBoundingClientRect().bottom
    : (window.innerHeight || document.documentElement.clientHeight || 0);
  if (rect.top <= viewportBottom + 1200) {
    loadNextLibraryPage().catch(() => {});
  }
}

function bindLibraryScrollFallback() {
  if (state.libraryScrollFallbackBound) return;
  const onScroll = () => {
    maybeLoadMoreLibraryBooks();
  };
  if (refs.libraryListScroll) refs.libraryListScroll.addEventListener("scroll", onScroll, { passive: true });
  else window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  state.libraryScrollFallbackBound = true;
}

function ensureLibraryLoadObserver() {
  teardownLibraryLoadObserver();
  if (!refs.libraryLoadMoreSentinel) return;
  if (typeof IntersectionObserver !== "function") {
    bindLibraryScrollFallback();
    return;
  }
  state.libraryLoadObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      loadNextLibraryPage().catch(() => {});
    }
  }, {
    root: refs.libraryListScroll || null,
    rootMargin: "1200px 0px",
    threshold: 0.01,
  });
  state.libraryLoadObserver.observe(refs.libraryLoadMoreSentinel);
}

function createLibraryCardObserver(renderToken) {
  teardownLibraryLazyRender();
  if (typeof IntersectionObserver !== "function") {
    state.libraryCardObserver = null;
    return null;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      queueLibraryCardHydration(entry.target, renderToken);
    }
  }, {
    root: refs.libraryListScroll || null,
    rootMargin: "520px 0px",
    threshold: 0.01,
  });
  state.libraryCardObserver = observer;
  return observer;
}

function scheduleLibraryHydrationFlush() {
  if (state.libraryHydrateFrame) return;
  const schedule = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 16));
  state.libraryHydrateFrame = schedule(() => {
    state.libraryHydrateFrame = 0;
    flushLibraryHydrationQueue();
  });
}

function queueLibraryCardHydration(card, renderToken = state.libraryRenderToken) {
  if (!card || !card.isConnected) return;
  if (String(card.dataset.hydrated || "") === "1") return;
  if (Number(card.dataset.renderToken || 0) !== Number(renderToken || 0)) return;
  if (String(card.dataset.hydrateQueued || "") === "1") return;
  card.dataset.hydrateQueued = "1";
  state.libraryHydrateQueue.push(card);
  scheduleLibraryHydrationFlush();
}

function flushLibraryHydrationQueue() {
  const activeToken = state.libraryRenderToken;
  let processed = 0;
  while (state.libraryHydrateQueue.length && processed < LIBRARY_HYDRATE_BATCH_SIZE) {
    const card = state.libraryHydrateQueue.shift();
    if (!card || !card.isConnected) continue;
    card.dataset.hydrateQueued = "";
    if (String(card.dataset.hydrated || "") === "1") continue;
    if (Number(card.dataset.renderToken || 0) !== Number(activeToken || 0)) continue;
    hydrateLibraryBookCard(card);
    processed += 1;
  }
  if (state.libraryHydrateQueue.length) scheduleLibraryHydrationFlush();
}

function createSkeletonBlock(className = "") {
  const node = document.createElement("div");
  node.className = `book-card-skeleton-block${className ? ` ${className}` : ""}`;
  return node;
}

function createLibraryBookCardShell(book, renderToken) {
  const card = document.createElement("article");
  card.className = "book-card book-card-shell";
  if (isBookDeleting(book && book.book_id)) card.classList.add("book-card-deleting");
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-busy", isBookDeleting(book && book.book_id) ? "true" : "false");
  card.dataset.bookId = String((book && book.book_id) || "");
  card.dataset.renderToken = String(renderToken || 0);
  card.dataset.hydrated = "0";
  card.dataset.hydrateQueued = "";

  const cover = document.createElement("div");
  cover.className = "book-card-cover book-card-cover-skeleton";
  cover.appendChild(createSkeletonBlock("book-card-cover-glow"));

  const body = document.createElement("div");
  body.className = "book-card-shell-body";
  body.append(
    createSkeletonBlock("book-card-skeleton-title"),
    createSkeletonBlock("book-card-skeleton-meta"),
  );
  const chipRow = document.createElement("div");
  chipRow.className = "book-card-skeleton-chip-row";
  chipRow.append(
    createSkeletonBlock("book-card-skeleton-chip"),
  );
  const progressRow = document.createElement("div");
  progressRow.className = "book-card-progress-row";
  progressRow.append(
    createSkeletonBlock("book-card-skeleton-text"),
    createSkeletonBlock("book-card-skeleton-pill"),
  );
  body.append(
    chipRow,
    progressRow,
    createSkeletonBlock("book-card-skeleton-download"),
  );

  card.append(cover, body);
  card.addEventListener("click", () => {
    if (isBookDeleting(book.book_id)) return;
    openActions(book.book_id);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isBookDeleting(book.book_id)) return;
      openActions(book.book_id);
    }
  });
  card.__book = book;
  return card;
}

function renderHistoryLoadingSkeleton(count = 4) {
  if (!refs.historyGrid || !refs.historyCount || !refs.historyEmpty) return;
  refs.historyGrid.innerHTML = "";
  refs.historyCount.textContent = state.shell.t("historyCount", { count: 0 });
  refs.historyEmpty.classList.add("hidden");
  const total = Math.max(1, Math.min(8, Number(count || 0) || 4));
  for (let index = 0; index < total; index += 1) {
    const card = document.createElement("article");
    card.className = "book-card book-card-shell";
    card.setAttribute("aria-hidden", "true");

    const cover = document.createElement("div");
    cover.className = "book-card-cover book-card-cover-skeleton";
    cover.appendChild(createSkeletonBlock("book-card-cover-glow"));

    const body = document.createElement("div");
    body.className = "book-card-shell-body";
    body.append(
      createSkeletonBlock("book-card-skeleton-title"),
      createSkeletonBlock("book-card-skeleton-meta"),
      createSkeletonBlock("book-card-skeleton-meta"),
    );
    const progressRow = document.createElement("div");
    progressRow.className = "book-card-progress-row";
    progressRow.append(
      createSkeletonBlock("book-card-skeleton-text"),
      createSkeletonBlock("book-card-skeleton-pill"),
    );
    const toolRow = document.createElement("div");
    toolRow.className = "book-card-tools";
    toolRow.append(
      createSkeletonBlock("book-card-skeleton-chip"),
      createSkeletonBlock("book-card-skeleton-chip"),
      createSkeletonBlock("book-card-skeleton-chip"),
    );
    body.append(progressRow, toolRow);

    card.append(cover, body);
    refs.historyGrid.appendChild(card);
  }
}

function populateLibraryBookCard(card, book) {
  card.innerHTML = "";
  card.classList.remove("book-card-shell");
  card.classList.toggle("book-card-deleting", isBookDeleting(book && book.book_id));
  card.setAttribute("aria-busy", isBookDeleting(book && book.book_id) ? "true" : "false");
  card.dataset.hydrated = "1";

  const cover = document.createElement("div");
  cover.className = "book-card-cover";
  const displayTitle = getLibraryBookTitleText(book);
  appendCoverMedia(cover, {
    coverUrl: book.cover_url,
    title: String((book && (book.title_vi || book.title_display || book.title)) || "").trim(),
    author: book.author_display || book.author || "",
    tag: buildSourceLabel(book),
  });

  const body = document.createElement("div");
  const title = document.createElement("div");
  title.className = "book-card-title";
  setOverflowMarqueeText(title, displayTitle);

  const author = document.createElement("div");
  author.className = "book-card-meta";
  author.textContent = book.author_display || book.author || "Khuyết danh";

  const sourceLabel = buildSourceLabel(book);
  let source = null;
  if (sourceLabel) {
    source = document.createElement("div");
    source.className = "book-card-source";
    setOverflowMarqueeText(source, sourceLabel);
  }

  const infoRow = document.createElement("div");
  infoRow.className = "book-card-progress-row";

  const ch = document.createElement("div");
  ch.className = "book-card-chapter";
  ch.textContent = normalizeDisplayTitle(
    book.current_chapter_title_display
      || book.current_chapter_title_vi
      || book.current_chapter_title_raw
      || book.current_chapter_title
      || "Chương 1",
  );

  const pct = document.createElement("div");
  pct.className = "book-card-percent";
  const percent = Math.max(0, Math.min(100, Number(book.progress_percent || 0)));
  pct.textContent = `${percent.toFixed(1)}%`;

  infoRow.append(ch, pct);
  const downloaded = Math.max(0, Number(book.downloaded_chapters || 0));
  const total = Math.max(0, Number(book.chapter_count || 0));
  const dl = document.createElement("div");
  dl.className = "book-card-download";
  dl.textContent = state.shell.t("downloadedCountShort", { downloaded, total });

  if (source) body.append(title, author, source, infoRow, dl);
  else body.append(title, author, infoRow, dl);
  card.append(cover, body);
}

function hydrateLibraryBookCard(card) {
  if (!card || String(card.dataset.hydrated || "") === "1") return;
  const book = card.__book;
  if (!book) return;
  populateLibraryBookCard(card, book);
  queueLibraryCardRefresh(book);
}

function getLibraryVisiblePendingItems() {
  if (hasActiveLibraryFilter()) return [];
  return state.pendingImports.filter((item) => {
    const resolvedBookId = String((item && item.resolved_book_id) || "").trim();
    if (!resolvedBookId) return true;
    return !(state.books || []).some((book) => String((book && book.book_id) || "").trim() === resolvedBookId);
  });
}

function updateLibraryCountDisplay() {
  const visiblePending = getLibraryVisiblePendingItems();
  const totalCount = Math.max(0, Number(state.libraryTotalCount || 0)) + visiblePending.length;
  const visibleCount = Math.max(0, (state.books || []).length) + visiblePending.length;
  refs.libraryCount.textContent = hasActiveLibraryFilter()
    ? state.shell.t("libraryCountFiltered", { visible: visibleCount, total: totalCount })
    : state.shell.t("libraryCount", { count: totalCount });
}

function renderLibraryLoadMoreStatus() {
  if (!refs.libraryLoadMoreStatus) return;
  const visiblePending = getLibraryVisiblePendingItems();
  const loadedCount = Math.max(0, (state.books || []).length) + visiblePending.length;
  const totalCount = Math.max(0, Number(state.libraryTotalCount || 0)) + visiblePending.length;
  if (state.libraryLoadingPage && loadedCount > 0) {
    refs.libraryLoadMoreStatus.classList.remove("hidden");
    refs.libraryLoadMoreStatus.textContent = state.shell.t("libraryLoadingMore");
    return;
  }
  if (loadedCount <= 0 || totalCount <= loadedCount) {
    refs.libraryLoadMoreStatus.classList.add("hidden");
    refs.libraryLoadMoreStatus.textContent = "";
    return;
  }
  refs.libraryLoadMoreStatus.classList.remove("hidden");
  refs.libraryLoadMoreStatus.textContent = state.shell.t("libraryCountFiltered", { visible: loadedCount, total: totalCount });
}

function beginLibraryRenderSession() {
  teardownLibraryLazyRender();
  refs.libraryGrid.innerHTML = "";
  const renderToken = Date.now();
  state.libraryRenderToken = renderToken;
  const observer = createLibraryCardObserver(renderToken);
  ensureLibraryLoadObserver();
  return { renderToken, observer };
}

function appendLibraryBookCards(items, { renderToken = state.libraryRenderToken, observer = state.libraryCardObserver } = {}) {
  const books = Array.isArray(items) ? items : [];
  const initialCards = [];
  for (const book of books) {
    const card = createLibraryBookCardShell(book, renderToken);
    refs.libraryGrid.appendChild(card);
    if (observer) observer.observe(card);
    if (initialCards.length < LIBRARY_INITIAL_HYDRATE_COUNT) initialCards.push(card);
  }
  if (!observer) {
    for (const card of initialCards) hydrateLibraryBookCard(card);
    for (const card of Array.from(refs.libraryGrid.querySelectorAll(".book-card-shell"))) {
      hydrateLibraryBookCard(card);
    }
    return;
  }
  for (const card of initialCards) queueLibraryCardHydration(card, renderToken);
}

function renderLibraryLoadingSkeleton(count = LIBRARY_LOADING_SKELETON_COUNT) {
  teardownLibraryLazyRender();
  teardownLibraryLoadObserver();
  clearLibraryCardRefreshQueue();
  refs.libraryGrid.innerHTML = "";
  refs.libraryEmpty.classList.add("hidden");
  if (refs.libraryLoadMoreStatus) {
    refs.libraryLoadMoreStatus.classList.add("hidden");
    refs.libraryLoadMoreStatus.textContent = "";
  }
  const total = Math.max(1, Number(count || LIBRARY_LOADING_SKELETON_COUNT));
  for (let i = 0; i < total; i += 1) {
    const shell = createLibraryBookCardShell({ book_id: `loading_${i}` }, -1);
    shell.classList.add("book-card-loading");
    shell.tabIndex = -1;
    shell.removeAttribute("role");
    refs.libraryGrid.appendChild(shell);
  }
}

function renderBooks({ append = false, appendedItems = [] } = {}) {
  const visiblePending = getLibraryVisiblePendingItems();
  updateLibraryFilterBadge();
  updateLibraryCountDisplay();
  const visibleCount = (state.books || []).length + visiblePending.length;
  if (!append) {
    teardownLibraryLoadObserver();
    const { renderToken, observer } = beginLibraryRenderSession();
    if (!visibleCount) {
      refs.libraryEmpty.classList.remove("hidden");
      refs.libraryEmpty.textContent = hasActiveLibraryFilter()
        ? state.shell.t("libraryEmptyFiltered")
        : state.shell.t("libraryEmpty");
      renderLibraryLoadMoreStatus();
      return;
    }
    refs.libraryEmpty.classList.add("hidden");
    for (const pending of visiblePending) {
      refs.libraryGrid.appendChild(renderPendingImportCard(pending));
    }
    appendLibraryBookCards(state.books || [], { renderToken, observer });
    renderLibraryLoadMoreStatus();
    return;
  }

  if (!visibleCount) {
    refs.libraryEmpty.classList.remove("hidden");
    refs.libraryEmpty.textContent = hasActiveLibraryFilter()
      ? state.shell.t("libraryEmptyFiltered")
      : state.shell.t("libraryEmpty");
    renderLibraryLoadMoreStatus();
    return;
  }
  updateLibraryFilterBadge();
  refs.libraryEmpty.classList.add("hidden");
  appendLibraryBookCards(appendedItems || []);
  renderLibraryLoadMoreStatus();
}

function renderLibraryCategoryFilterList() {
  if (!refs.libraryCategoryFilterEmpty || !refs.libraryCategoryFilterIncludeList || !refs.libraryCategoryFilterExcludeList) return;
  const term = String((refs.libraryCategoryFilterSearch && refs.libraryCategoryFilterSearch.value) || "").trim().toLowerCase();
  const draftPair = buildDistinctCategoryFilters(state.categoryFilterDraftIds, state.categoryFilterDraftExcludeIds);
  state.categoryFilterDraftIds = applySingleSelectionRules(draftPair.include);
  state.categoryFilterDraftExcludeIds = applySingleSelectionRules(draftPair.exclude);
  const includeSet = new Set(state.categoryFilterDraftIds);
  const excludeSet = new Set(state.categoryFilterDraftExcludeIds);
  if (refs.libraryCategoryMatchModeSelect) {
    refs.libraryCategoryMatchModeSelect.value = normalizeCategoryMatchMode(state.categoryFilterDraftMatchMode);
    refs.libraryCategoryMatchModeSelect.disabled = includeSet.size < 2;
  }
  if (refs.libraryCategoryIncludeCount) {
    refs.libraryCategoryIncludeCount.textContent = String(includeSet.size);
    refs.libraryCategoryIncludeCount.classList.toggle("hidden", includeSet.size <= 0);
  }
  if (refs.libraryCategoryExcludeCount) {
    refs.libraryCategoryExcludeCount.textContent = String(excludeSet.size);
    refs.libraryCategoryExcludeCount.classList.toggle("hidden", excludeSet.size <= 0);
  }
  renderCategoryPickerSections(refs.libraryCategoryFilterIncludeList, {
    term,
    activeIds: state.categoryFilterDraftIds,
    emptyNode: refs.libraryCategoryFilterEmpty,
    emptyText: state.shell.t("categoryFilterEmpty"),
    showCount: true,
    scopeKey: "library-filter-include",
    collapsibleSections: true,
    onToggle: (id) => {
      const nextExclude = new Set(normalizeCategoryIds(state.categoryFilterDraftExcludeIds));
      nextExclude.delete(id);
      state.categoryFilterDraftIds = toggleCategoryIdWithRules(state.categoryFilterDraftIds, id);
      state.categoryFilterDraftExcludeIds = Array.from(nextExclude);
      renderLibraryCategoryFilterList();
    },
  });
  renderCategoryPickerSections(refs.libraryCategoryFilterExcludeList, {
    term,
    activeIds: state.categoryFilterDraftExcludeIds,
    showCount: true,
    scopeKey: "library-filter-exclude",
    collapsibleSections: true,
    onToggle: (id) => {
      const nextInclude = new Set(normalizeCategoryIds(state.categoryFilterDraftIds));
      nextInclude.delete(id);
      state.categoryFilterDraftExcludeIds = toggleCategoryIdWithRules(state.categoryFilterDraftExcludeIds, id);
      state.categoryFilterDraftIds = Array.from(nextInclude);
      renderLibraryCategoryFilterList();
    },
  });
}

function openLibraryCategoryFilterDialog() {
  state.categoryFilterDraftIds = [...normalizeCategoryIds(state.selectedCategoryIds)];
  state.categoryFilterDraftExcludeIds = [...normalizeCategoryIds(state.selectedExcludedCategoryIds)];
  state.categoryFilterDraftMatchMode = normalizeCategoryMatchMode(state.selectedCategoryMatchMode);
  state.authorFilterDraft = normalizeAuthorFilterValue(state.selectedAuthorFilter);
  if (refs.libraryAuthorFilterInput) refs.libraryAuthorFilterInput.value = state.authorFilterDraft;
  if (refs.libraryCategoryMatchModeSelect) refs.libraryCategoryMatchModeSelect.value = state.categoryFilterDraftMatchMode;
  if (refs.libraryCategoryFilterSearch) refs.libraryCategoryFilterSearch.value = "";
  renderLibraryCategoryFilterList();
  if (refs.libraryCategoryFilterDialog && !refs.libraryCategoryFilterDialog.open) {
    refs.libraryCategoryFilterDialog.showModal();
  }
}

async function applyLibraryCategoryFilter() {
  const draftPair = buildDistinctCategoryFilters(state.categoryFilterDraftIds, state.categoryFilterDraftExcludeIds);
  state.selectedCategoryIds = applySingleSelectionRules(draftPair.include);
  state.selectedExcludedCategoryIds = applySingleSelectionRules(draftPair.exclude);
  state.selectedCategoryMatchMode = state.selectedCategoryIds.length >= 2
    ? normalizeCategoryMatchMode(
    (refs.libraryCategoryMatchModeSelect && refs.libraryCategoryMatchModeSelect.value) || state.categoryFilterDraftMatchMode,
    )
    : "or";
  state.selectedAuthorFilter = normalizeAuthorFilterValue(
    (refs.libraryAuthorFilterInput && refs.libraryAuthorFilterInput.value) || state.authorFilterDraft,
  );
  syncLibraryQuery();
  updateLibraryFilterBadge();
  await reloadLibraryBooks({ silent: true });
  if (refs.libraryCategoryFilterDialog && refs.libraryCategoryFilterDialog.open) {
    refs.libraryCategoryFilterDialog.close();
  }
}

function getCategoryManagerSelected() {
  return (state.categories || []).find((item) => String(item.category_id || "") === String(state.categoryManagerSelectedId || "")) || null;
}

function syncCategoryManagerBookSelectionToVisible(checked) {
  const term = String((refs.categoryManagerBooksSearchInput && refs.categoryManagerBooksSearchInput.value) || "").trim().toLowerCase();
  const visible = getCategoryManagerBooksCollection().filter((book) => bookMatchesClientSearch(book, term));
  for (const book of visible) {
    const bid = String(book.book_id || "").trim();
    if (!bid) continue;
    if (checked) state.categoryManagerBookCheckedIds.add(bid);
    else state.categoryManagerBookCheckedIds.delete(bid);
  }
}

function syncCategoryManagerControls() {
  const selected = getCategoryManagerSelected();
  if (refs.categoryManagerNameInput && selected && document.activeElement !== refs.categoryManagerNameInput) {
    refs.categoryManagerNameInput.value = String(selected.name || "");
  }
  if (refs.btnCategoryRename) refs.btnCategoryRename.disabled = !selected || Boolean(selected && (selected.is_default_category || selected.is_default_removed));
  if (refs.btnCategoryDelete) refs.btnCategoryDelete.disabled = !selected || !Boolean(selected && selected.is_user_category);
  const hasChecked = state.categoryManagerBookCheckedIds.size > 0;
  if (refs.btnCategoryManagerAddBooks) refs.btnCategoryManagerAddBooks.disabled = !selected || !hasChecked;
  if (refs.btnCategoryManagerRemoveBooks) refs.btnCategoryManagerRemoveBooks.disabled = !selected || !hasChecked;
}

function renderCategoryManagerList() {
  if (!refs.categoryManagerList || !refs.categoryManagerEmpty) return;
  refs.categoryManagerList.innerHTML = "";
  const term = String((refs.categoryManagerSearchInput && refs.categoryManagerSearchInput.value) || "").trim().toLowerCase();
  const items = (state.categories || [])
    .map((item) => normalizeCategoryItem(item))
    .filter((item) => item.is_user_category)
    .filter((item) => categoryMatchesSearch(item, term));
  refs.categoryManagerEmpty.classList.toggle("hidden", items.length > 0);
  refs.categoryManagerEmpty.textContent = state.shell.t("categoryManagerEmpty");
  if (state.categoryManagerSelectedId && !items.some((item) => String(item.category_id || "") === String(state.categoryManagerSelectedId || ""))) {
    state.categoryManagerSelectedId = items.length ? String(items[0].category_id || "") : "";
  }
  for (const category of items) {
    const id = String(category.category_id || "").trim();
    const row = document.createElement("button");
    row.type = "button";
    row.className = "category-manager-item";
    if (id === state.categoryManagerSelectedId) row.classList.add("active");
    const name = document.createElement("span");
    name.className = "category-manager-item-name";
    name.textContent = String(category.name || "");
    const count = document.createElement("span");
    count.className = "tag";
    count.textContent = String(Math.max(0, Number(category.book_count || 0)));
    row.append(name, count);
    row.addEventListener("click", () => {
      state.categoryManagerSelectedId = id;
      state.categoryManagerBookCheckedIds = new Set();
      syncCategoryManagerControls();
      renderCategoryManagerList();
      renderCategoryManagerBooks();
    });
    refs.categoryManagerList.appendChild(row);
  }
  const selected = getCategoryManagerSelected();
  if (!selected && items.length) {
    state.categoryManagerSelectedId = String(items[0].category_id || "");
  }
  syncCategoryManagerControls();
}

function renderCategoryManagerBooks() {
  if (!refs.categoryManagerBooksList || !refs.categoryManagerBooksEmpty || !refs.categoryManagerBooksTitle) return;
  refs.categoryManagerBooksList.innerHTML = "";
  const selected = getCategoryManagerSelected();
  refs.categoryManagerBooksTitle.textContent = selected
    ? state.shell.t("categoryManagerBooksTitle", { name: selected.name || "" })
    : state.shell.t("categoryManagerBooksTitleEmpty");
  if (!selected) {
    refs.categoryManagerBooksEmpty.classList.remove("hidden");
    refs.categoryManagerBooksEmpty.textContent = state.shell.t("categoryManagerSelectHint");
    syncCategoryManagerControls();
    return;
  }
  if (state.categoryManagerBooksLoading && !state.categoryManagerBooksLoaded) {
    refs.categoryManagerBooksEmpty.classList.remove("hidden");
    refs.categoryManagerBooksEmpty.textContent = state.shell.t("categoryManagerBooksLoading");
    syncCategoryManagerControls();
    return;
  }
  const selectedId = String(selected.category_id || "");
  const term = String((refs.categoryManagerBooksSearchInput && refs.categoryManagerBooksSearchInput.value) || "").trim().toLowerCase();
  const items = getCategoryManagerBooksCollection().filter((book) => bookMatchesClientSearch(book, term));
  refs.categoryManagerBooksEmpty.classList.toggle("hidden", items.length > 0);
  refs.categoryManagerBooksEmpty.textContent = state.shell.t("categoryManagerBooksEmpty");
  const membershipSet = new Set();
  for (const book of getCategoryManagerBooksCollection()) {
    if (getBookCategoryIds(book).includes(selectedId)) {
      membershipSet.add(String(book.book_id || "").trim());
    }
  }
  let visibleChecked = 0;
  for (const book of items) {
    const bid = String(book.book_id || "").trim();
    const row = document.createElement("label");
    row.className = "category-manager-book-row";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.categoryManagerBookCheckedIds.has(bid);
    if (checkbox.checked) visibleChecked += 1;
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) state.categoryManagerBookCheckedIds.add(bid);
      else state.categoryManagerBookCheckedIds.delete(bid);
      syncCategoryManagerControls();
    });

    const meta = document.createElement("div");
    meta.className = "category-manager-book-meta";
    const title = document.createElement("strong");
    title.textContent = normalizeDisplayTitle(book.title_display || book.title || "");
    const sub = document.createElement("span");
    sub.textContent = String(book.author_display || book.author || state.shell.t("unknownAuthor"));
    meta.append(title, sub);

    const status = document.createElement("span");
    status.className = membershipSet.has(bid) ? "tag" : "empty-text";
    status.textContent = membershipSet.has(bid)
      ? state.shell.t("categoryManagerInCategory")
      : state.shell.t("categoryManagerNotInCategory");

    row.append(checkbox, meta, status);
    refs.categoryManagerBooksList.appendChild(row);
  }
  if (refs.categoryManagerBooksSelectAll) {
    refs.categoryManagerBooksSelectAll.checked = items.length > 0 && visibleChecked === items.length;
    refs.categoryManagerBooksSelectAll.indeterminate = visibleChecked > 0 && visibleChecked < items.length;
  }
  syncCategoryManagerControls();
}

async function openCategoryManagerDialog() {
  if (refs.categoryManagerSearchInput) refs.categoryManagerSearchInput.value = "";
  if (refs.categoryManagerBooksSearchInput) refs.categoryManagerBooksSearchInput.value = "";
  state.categoryManagerBookCheckedIds = new Set();
  if (!state.categoryManagerSelectedId) {
    const firstUserCategory = (state.categories || []).find((item) => Boolean(item && item.is_user_category));
    state.categoryManagerSelectedId = String((firstUserCategory && firstUserCategory.category_id) || "");
  }
  renderCategoryManagerList();
  renderCategoryManagerBooks();
  try {
    await ensureCategoryManagerBooksLoaded();
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  }
  renderCategoryManagerList();
  renderCategoryManagerBooks();
  if (refs.categoryManagerDialog && !refs.categoryManagerDialog.open) {
    refs.categoryManagerDialog.showModal();
  }
}

async function createCategoryFromManager() {
  const name = String((refs.categoryManagerNameInput && refs.categoryManagerNameInput.value) || "").trim();
  if (!name) {
    state.shell.showToast(state.shell.t("categoryNameRequired"));
    return;
  }
  try {
    const data = await state.shell.api("/api/library/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    state.categoryManagerSelectedId = String((data && data.category && data.category.category_id) || "");
    setCategoriesCatalog(Array.isArray(data && data.items) ? data.items : []);
    renderBooks();
    renderCategoryManagerList();
    renderCategoryManagerBooks();
    syncSelectedBookActions();
    state.shell.showToast(state.shell.t("categoryCreated"));
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  }
}

async function renameCategoryFromManager() {
  const selected = getCategoryManagerSelected();
  const name = String((refs.categoryManagerNameInput && refs.categoryManagerNameInput.value) || "").trim();
  if (!selected) {
    state.shell.showToast(state.shell.t("categoryManagerSelectHint"));
    return;
  }
  if (!name) {
    state.shell.showToast(state.shell.t("categoryNameRequired"));
    return;
  }
  try {
    const data = await state.shell.api(`/api/library/categories/${encodeURIComponent(String(selected.category_id || ""))}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setCategoriesCatalog(Array.isArray(data && data.items) ? data.items : []);
    renderBooks();
    renderCategoryManagerList();
    renderCategoryManagerBooks();
    syncSelectedBookActions();
    state.shell.showToast(state.shell.t("categoryRenamed"));
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  }
}

async function deleteCategoryFromManager() {
  const selected = getCategoryManagerSelected();
  if (!selected) {
    state.shell.showToast(state.shell.t("categoryManagerSelectHint"));
    return;
  }
  const confirmed = await state.shell.confirmDialog({
    title: "Xóa danh mục",
    message: state.shell.t("confirmDeleteCategory", { name: selected.name || "" }),
    confirmText: "Xóa danh mục",
  });
  if (!confirmed) return;
  try {
    const data = await state.shell.api(`/api/library/categories/${encodeURIComponent(String(selected.category_id || ""))}`, {
      method: "DELETE",
    });
    state.categoryManagerSelectedId = "";
    state.categoryManagerBookCheckedIds = new Set();
    setCategoriesCatalog(Array.isArray(data && data.items) ? data.items : []);
    renderBooks();
    renderCategoryManagerList();
    renderCategoryManagerBooks();
    syncSelectedBookActions();
    state.shell.showToast(state.shell.t("categoryDeleted"));
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  }
}

async function applyCategoryManagerBooks(action) {
  const selected = getCategoryManagerSelected();
  const bookIds = Array.from(state.categoryManagerBookCheckedIds);
  if (!selected) {
    state.shell.showToast(state.shell.t("categoryManagerSelectHint"));
    return;
  }
  if (!bookIds.length) {
    state.shell.showToast(state.shell.t("categoryManagerBooksChoose"));
    return;
  }
  try {
    await state.shell.api("/api/library/categories/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        book_ids: bookIds,
        category_ids: [String(selected.category_id || "")],
        action,
      }),
    });
    applyBooksCategoryActionLocal(bookIds, [String(selected.category_id || "")], action);
    state.categoryManagerBookCheckedIds = new Set();
    await loadCategories({ silent: true }).catch(() => null);
    renderBooks();
    renderCategoryManagerList();
    renderCategoryManagerBooks();
    syncSelectedBookActions();
    state.shell.showToast(state.shell.t(action === "add" ? "categoryBooksAdded" : "categoryBooksRemoved"));
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  }
}

function renderBookCategoriesDialogList() {
  if (!refs.bookCategoriesList || !refs.bookCategoriesEmpty) return;
  const term = String((refs.bookCategoriesSearchInput && refs.bookCategoriesSearchInput.value) || "").trim().toLowerCase();
  state.bookCategoriesDraftIds = applySingleSelectionRules(state.bookCategoriesDraftIds);
  renderCategoryPickerSections(refs.bookCategoriesList, {
    term,
    activeIds: state.bookCategoriesDraftIds,
    emptyNode: refs.bookCategoriesEmpty,
    emptyText: state.shell.t("categoryQuickEmpty"),
    scopeKey: "library-book-categories",
    collapsibleSections: true,
    onToggle: (id) => {
      state.bookCategoriesDraftIds = toggleCategoryIdWithRules(state.bookCategoriesDraftIds, id);
      renderBookCategoriesDialogList();
    },
  });
}

function openBookCategoriesDialog(bookId = state.selectedBookId) {
  const bid = String(bookId || "").trim();
  const book = (state.books || []).find((item) => String(item.book_id || "") === bid);
  if (!book) return;
  state.bookCategoriesTargetBookId = bid;
  state.bookCategoriesDraftIds = applySingleSelectionRules(getBookCategoryIds(book));
  if (refs.bookCategoriesSearchInput) refs.bookCategoriesSearchInput.value = "";
  if (refs.bookCategoriesSubtitle) {
    refs.bookCategoriesSubtitle.textContent = normalizeDisplayTitle(book.title_display || book.title || "");
  }
  renderBookCategoriesDialogList();
  if (refs.bookCategoriesDialog && !refs.bookCategoriesDialog.open) {
    refs.bookCategoriesDialog.showModal();
  }
}

async function saveBookCategoriesDialog() {
  const bid = String(state.bookCategoriesTargetBookId || "").trim();
  if (!bid) return;
  try {
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(bid)}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_ids: applySingleSelectionRules(state.bookCategoriesDraftIds) }),
    });
    setBookCategoriesLocal(bid, Array.isArray(data && data.categories) ? data.categories : []);
    await loadCategories({ silent: true }).catch(() => null);
    renderBooks();
    syncSelectedBookActions();
    renderCategoryManagerList();
    renderCategoryManagerBooks();
    if (refs.bookCategoriesDialog && refs.bookCategoriesDialog.open) refs.bookCategoriesDialog.close();
    state.shell.showToast(state.shell.t("bookCategoriesSaved"));
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  }
}

function renderHistory() {
  refs.historyGrid.innerHTML = "";
  refs.historyCount.textContent = state.shell.t("historyCount", { count: state.historyItems.length });

  if (!state.historyItems.length) {
    refs.historyEmpty.classList.remove("hidden");
    refs.historyEmpty.textContent = state.shell.t("historyEmpty");
    return;
  }
  refs.historyEmpty.classList.add("hidden");

  for (const item of state.historyItems) {
    const card = document.createElement("article");
    card.className = "book-card";

    const cover = document.createElement("div");
    cover.className = "book-card-cover";
    appendCoverMedia(cover, {
      coverUrl: item.cover_url,
      title: item.title || "",
      author: item.author || "",
      tag: buildHistorySourceLabel(item),
    });

    const body = document.createElement("div");
    const title = document.createElement("div");
    title.className = "book-card-title";
    setOverflowMarqueeText(title, normalizeDisplayTitle(item.title || "Không tiêu đề"));

    const author = document.createElement("div");
    author.className = "book-card-meta";
    author.textContent = item.author || "Khuyết danh";

    const source = document.createElement("div");
    source.className = "book-card-source";
    setOverflowMarqueeText(source, buildHistorySourceLabel(item));

    const infoRow = document.createElement("div");
    infoRow.className = "book-card-progress-row";

    const ch = document.createElement("div");
    ch.className = "book-card-chapter";
    ch.textContent = normalizeDisplayTitle(
      item.last_read_chapter_title
        || state.shell.t("historyChapterDefault"),
    );

    const pct = document.createElement("div");
    pct.className = "book-card-percent";
    const percent = Math.max(0, Math.min(100, Number(item.progress_percent || 0)));
    pct.textContent = `${percent.toFixed(1)}%`;
    infoRow.append(ch, pct);

    const tools = document.createElement("div");
    tools.className = "book-card-tools";

    const btnContinue = document.createElement("button");
    btnContinue.type = "button";
    btnContinue.className = "btn btn-small btn-primary";
    btnContinue.textContent = state.shell.t("historyContinueRead");
    btnContinue.addEventListener("click", async (event) => {
      event.stopPropagation();
      await openHistoryDetail(item);
    });

    const btnImport = document.createElement("button");
    btnImport.type = "button";
    btnImport.className = "btn btn-small";
    btnImport.textContent = state.shell.t("historyImportBook");
    btnImport.addEventListener("click", async (event) => {
      event.stopPropagation();
      await importHistoryItem(item);
    });

    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "btn btn-small";
    btnDelete.textContent = state.shell.t("historyDelete");
    btnDelete.addEventListener("click", async (event) => {
      event.stopPropagation();
      await deleteHistoryItem(item.history_id);
    });

    tools.append(btnContinue, btnImport, btnDelete);
    body.append(title, author, source, infoRow, tools);
    card.append(cover, body);
    card.addEventListener("click", async () => {
      await openHistoryDetail(item);
    });
    refs.historyGrid.appendChild(card);
  }
}

async function openHistoryDetail(item) {
  const sourceUrl = String((item && item.source_url) || "").trim();
  if (!sourceUrl) return;
  const pluginId = String((item && item.plugin_id) || "").trim();
  const chapterUrl = String((item && item.last_read_chapter_url) || "").trim();
  const chapterTitle = String((item && item.last_read_chapter_title) || "").trim();
  const ratioRaw = Number(item && item.last_read_ratio);
  const ratio = Number.isFinite(ratioRaw) ? Math.max(0, Math.min(1, ratioRaw)) : 0;

  state.shell.showStatus(state.shell.t("statusImportingUrl"));
  try {
    const data = await state.shell.api("/api/library/import-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: sourceUrl,
        plugin_id: pluginId,
        history_only: true,
      }),
    });
    const book = (data && data.book) || {};
    const bid = String(book.book_id || "").trim();
    if (!bid) return;
    const chapters = Array.isArray(book.chapters) ? book.chapters : [];
    let targetChapter = null;
    if (chapterUrl) {
      targetChapter = chapters.find((row) => String((row && row.remote_url) || "").trim() === chapterUrl) || null;
    }
    if (!targetChapter && chapterTitle) {
      const needle = normalizeDisplayTitle(chapterTitle).toLowerCase();
      targetChapter = chapters.find((row) => {
        const rowTitle = normalizeDisplayTitle(String((row && row.title_display) || (row && row.title_raw) || ""));
        return rowTitle.toLowerCase() === needle;
      }) || null;
    }
    if (!targetChapter && chapters.length) {
      targetChapter = chapters[0];
    }
    const readerMode = resolveReaderModeForBook(book);
    if (targetChapter && targetChapter.chapter_id) {
      await state.shell.api(`/api/library/book/${encodeURIComponent(bid)}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter_id: String(targetChapter.chapter_id || ""),
          ratio,
          mode: readerMode,
        }),
      });
    }
    window.location.href = buildReaderUrl(book, targetChapter && targetChapter.chapter_id, readerMode);
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function importHistoryItem(item) {
  const sourceUrl = String((item && item.source_url) || "").trim();
  if (!sourceUrl) return;
  const prevHistory = Array.isArray(state.historyItems) ? [...state.historyItems] : [];
  const pending = {
    ...buildPendingUrlImportRecord({
      url: sourceUrl,
      pluginId: String((item && item.plugin_id) || "").trim(),
    }),
    title: String((item && item.title) || "").trim() || state.shell.t("importPendingUrlTitle"),
    author: String((item && item.author) || "").trim(),
    cover_url: String((item && item.cover_url) || "").trim(),
    source_label: buildHistorySourceLabel(item),
    status_text: state.shell.t("importPendingStatus"),
    meta_text: state.shell.t("importPendingUrlWaiting"),
  };
  state.historyItems = prevHistory.filter((row) => String((row && row.history_id) || "").trim() !== String((item && item.history_id) || "").trim());
  renderHistory();
  addPendingImport(pending);
  state.shell.showStatus(state.shell.t("statusImportingUrl"));
  try {
    const data = await state.shell.api("/api/library/import-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: sourceUrl,
        plugin_id: String((item && item.plugin_id) || "").trim(),
      }),
    });
    state.shell.showToast(state.shell.t("toastImportSuccess"));
    await applyImportedBookLocal(data && data.book, { pendingTempId: pending.temp_id, refresh: true });
    if (item && item.history_id) {
      state.shell.api(`/api/library/history/${encodeURIComponent(String(item.history_id || "").trim())}`, {
        method: "DELETE",
      }).catch(() => {});
    }
  } catch (error) {
    removePendingImport(pending.temp_id);
    state.historyItems = prevHistory;
    renderHistory();
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function loadCategories({ silent = true } = {}) {
  try {
    const data = await state.shell.api("/api/library/categories");
    setCategoriesCatalog(Array.isArray(data && data.items) ? data.items : []);
    return state.categories;
  } catch (error) {
    if (!silent) state.shell.showToast(getErrorMessage(error));
    throw error;
  }
}

function buildLibraryBooksApiPath({ offset = 0, limit = state.libraryPageSize } = {}) {
  const params = new URLSearchParams();
  params.set("offset", String(Math.max(0, Number(offset || 0))));
  params.set("limit", String(Math.max(1, Number(limit || state.libraryPageSize || 48))));
  const ids = normalizeCategoryIds(state.selectedCategoryIds);
  const excludeIds = normalizeCategoryIds(state.selectedExcludedCategoryIds);
  const matchMode = normalizeCategoryMatchMode(state.selectedCategoryMatchMode);
  const author = normalizeAuthorFilterValue(state.selectedAuthorFilter);
  if (ids.length) params.set("category_ids", ids.join(","));
  if (excludeIds.length) params.set("category_exclude_ids", excludeIds.join(","));
  if (ids.length > 1 && matchMode === "and") params.set("category_mode", "and");
  if (author) params.set("author", author);
  return `/api/library/books?${params.toString()}`;
}

function resetLibraryPaginationState() {
  clearLibraryCardRefreshQueue();
  clearLibraryTitleCacheState();
  state.books = [];
  state.libraryTotalCount = 0;
  state.libraryHasMore = false;
  state.libraryNextOffset = 0;
  state.libraryLoadingPage = false;
  state.libraryLoadingMode = "";
}

async function loadLibraryBooksPage({ reset = false, silent = false } = {}) {
  const requestSeq = ++state.libraryLoadRequestSeq;
  const offset = reset ? 0 : Math.max(0, Number(state.libraryNextOffset || (state.books || []).length || 0));
  const mode = reset ? "reset" : "append";
  state.libraryLoadingPage = true;
  state.libraryLoadingMode = mode;
  if (reset) {
    resetLibraryPaginationState();
    state.libraryLoadingPage = true;
    state.libraryLoadingMode = mode;
    if (!silent) {
      state.shell.showStatus(state.shell.t("statusLoadingBooks"));
      renderLibraryLoadingSkeleton();
    } else {
      renderLibraryLoadMoreStatus();
    }
  } else {
    renderLibraryLoadMoreStatus();
  }
  try {
    const data = await state.shell.api(buildLibraryBooksApiPath({ offset, limit: state.libraryPageSize }));
    if (requestSeq !== state.libraryLoadRequestSeq) return;
    const items = Array.isArray(data && data.items) ? data.items.map((item) => prepareLibraryPageBook(item)) : [];
    const appendedItems = [];
    if (reset) {
      state.books = items;
    } else {
      const known = new Set((state.books || []).map((item) => String((item && item.book_id) || "").trim()).filter(Boolean));
      for (const item of items) {
        const bid = String((item && item.book_id) || "").trim();
        if (!bid || known.has(bid)) continue;
        known.add(bid);
        state.books.push(item);
        appendedItems.push(item);
      }
    }
    state.libraryTotalCount = Math.max(0, Number(data && data.total_count || 0));
    state.libraryHasMore = Boolean(data && data.has_more);
    state.libraryNextOffset = Math.max(0, Number(
      (data && data.next_offset != null)
        ? data.next_offset
        : ((state.books || []).length || 0),
    ));
    renderBooks({ append: !reset, appendedItems: reset ? [] : appendedItems });
    const visibleIds = reset
      ? (state.books || []).map((item) => item && item.book_id)
      : (appendedItems || []).map((item) => item && item.book_id);
    ensureLibraryTitleCacheForBookIds(visibleIds).catch(() => {});
  } catch (error) {
    if (requestSeq !== state.libraryLoadRequestSeq) return;
    if (reset) {
      state.books = [];
      state.libraryTotalCount = 0;
      state.libraryHasMore = false;
      state.libraryNextOffset = 0;
      renderBooks();
    } else {
      state.shell.showToast(getErrorMessage(error));
    }
    throw error;
  } finally {
    if (requestSeq === state.libraryLoadRequestSeq) {
      state.libraryLoadingPage = false;
      state.libraryLoadingMode = "";
      renderLibraryLoadMoreStatus();
      if (reset && !silent) state.shell.hideStatus();
    }
  }
}

async function loadNextLibraryPage() {
  if (state.libraryLoadingPage || !state.libraryHasMore) return;
  await loadLibraryBooksPage({ reset: false, silent: true });
}

async function reloadLibraryBooks({ silent = false } = {}) {
  await loadLibraryBooksPage({ reset: true, silent });
  syncSelectedBookActions();
}

async function ensureCategoryManagerBooksLoaded({ force = false } = {}) {
  if (!force && state.categoryManagerBooksLoaded) return state.categoryManagerBooks;
  if (state.categoryManagerBooksLoading) return state.categoryManagerBooks;
  state.categoryManagerBooksLoading = true;
  try {
    const data = await state.shell.api("/api/library/books/all");
    state.categoryManagerBooks = Array.isArray(data && data.items) ? data.items : [];
    state.categoryManagerBooksLoaded = true;
    return state.categoryManagerBooks;
  } finally {
    state.categoryManagerBooksLoading = false;
  }
}

async function deleteHistoryItem(historyId) {
  const hid = String(historyId || "").trim();
  if (!hid) return;
  const prevItems = Array.isArray(state.historyItems) ? [...state.historyItems] : [];
  state.historyItems = prevItems.filter((item) => String((item && item.history_id) || "").trim() !== hid);
  renderHistory();
  try {
    await state.shell.api(`/api/library/history/${encodeURIComponent(hid)}`, { method: "DELETE" });
  } catch (error) {
    state.historyItems = prevItems;
    renderHistory();
    state.shell.showToast(getErrorMessage(error));
  }
}

async function loadLibraryData({ silent = false } = {}) {
  if (!silent) {
    state.shell.showStatus(state.shell.t("statusLoadingBooks"));
    renderHistoryLoadingSkeleton();
  }
  const loadBooks = async () => {
    await reloadLibraryBooks({ silent });
    syncSelectedBookActions();
  };
  const loadHistory = async () => {
    const prevHistory = Array.isArray(state.historyItems) ? [...state.historyItems] : [];
    try {
      const data = await state.shell.api("/api/library/history");
      state.historyItems = data.items || [];
      renderHistory();
    } catch (error) {
      if (!silent) {
        state.historyItems = prevHistory;
        renderHistory();
      }
      throw error;
    }
  };
  const loadCategories = async () => {
    const prevCategories = Array.isArray(state.categories) ? [...state.categories] : [];
    try {
      const data = await state.shell.api("/api/library/categories");
      setCategoriesCatalog(Array.isArray(data && data.items) ? data.items : []);
      syncSelectedBookActions();
    } catch (error) {
      if (!silent) {
        state.categories = prevCategories;
        syncSelectedCategoryIdsWithCatalog();
      }
      throw error;
    }
  };

  const results = await Promise.allSettled([
    loadBooks(),
    loadHistory(),
    loadCategories(),
  ]);
  if (!silent) {
    const firstRejected = results.find((item) => item.status === "rejected");
    if (firstRejected && firstRejected.reason) {
      state.shell.showToast(getErrorMessage(firstRejected.reason));
    }
    if (!state.libraryLoadingPage) state.shell.hideStatus();
  }
}

function renderDownloadJobs() {
  if (!refs.downloadJobsList || !refs.downloadJobsCount || !refs.downloadJobsEmpty) return;
  refs.downloadJobsList.innerHTML = "";
  refs.downloadJobsCount.textContent = state.shell.t("downloadJobsCount", { count: state.downloadJobs.length });
  if (!state.downloadJobs.length) {
    refs.downloadJobsEmpty.classList.remove("hidden");
    refs.downloadJobsEmpty.textContent = state.shell.t("downloadJobsEmpty");
    return;
  }
  refs.downloadJobsEmpty.classList.add("hidden");
  for (const job of state.downloadJobs) {
    const row = document.createElement("article");
    row.className = "download-job-row";

    const title = document.createElement("div");
    title.className = "download-job-title";
    title.textContent = normalizeDisplayTitle(job.book_title || state.shell.t("libraryTitle"));

    const meta = document.createElement("div");
    meta.className = "download-job-meta";
    const downloaded = Math.max(0, Number(job.downloaded_chapters || 0));
    const total = Math.max(0, Number(job.total_chapters || 0));
    const pct = total > 0 ? (downloaded / total) * 100 : Number(job.progress || 0) * 100;
    const queuePos = Number(job.queue_position || 0);
    const queueText = queuePos > 0 ? state.shell.t("downloadQueuePos", { pos: queuePos }) : "";
    meta.textContent = `${state.shell.t("downloadedCountShort", { downloaded, total })} • ${state.shell.t("bookPercent", { percent: pct.toFixed(1) })}${queueText ? ` • ${queueText}` : ""}`;

    const status = document.createElement("div");
    status.className = "download-job-status";
    const msg = String(job.message || "").trim();
    if (msg) {
      status.textContent = msg;
    } else if (String(job.status || "") === "running") {
      status.textContent = state.shell.t("downloadStatusRunning");
    } else {
      status.textContent = state.shell.t("downloadStatusQueued");
    }

    const actions = document.createElement("div");
    actions.className = "download-job-actions";
    const btnStop = document.createElement("button");
    btnStop.type = "button";
    btnStop.className = "btn btn-small";
    btnStop.textContent = state.shell.t("downloadStop");
    btnStop.addEventListener("click", async () => {
      try {
        await state.shell.api(`/api/library/download/${encodeURIComponent(String(job.job_id || ""))}/stop`, {
          method: "POST",
        });
        await loadDownloadJobs({ syncLibrary: false });
      } catch (error) {
        state.shell.showToast(getErrorMessage(error));
      }
    });
    actions.appendChild(btnStop);

    row.append(title, meta, status, actions);
    refs.downloadJobsList.appendChild(row);
  }
}

function buildDownloadJobsSignature(items) {
  if (!Array.isArray(items) || !items.length) return "";
  const rows = [];
  for (const job of items) {
    rows.push([
      String(job.job_id || ""),
      String(job.status || ""),
      Number(job.downloaded_chapters || 0),
      Number(job.total_chapters || 0),
      Number(job.queue_position || 0),
    ].join(":"));
  }
  return rows.join("|");
}

async function applyDownloadJobsPayload(payload, { syncLibrary = false } = {}) {
  const prevItems = Array.isArray(state.downloadJobs) ? state.downloadJobs : [];
  const nextItems = Array.isArray(payload && payload.items) ? payload.items : [];
  state.downloadJobs = nextItems;
  const nextSig = buildDownloadJobsSignature(nextItems);
  const changed = nextSig !== state.downloadJobsSig;
  state.downloadJobsSig = nextSig;
  renderDownloadJobs();
  if (!changed && !syncLibrary) return;

  const nextBookIds = collectDownloadJobBookIds(nextItems);
  const prevBookIds = collectDownloadJobBookIds(prevItems);
  const activeTouchedIds = applyLocalDownloadJobStateToBooks(nextItems);
  const disappearedIds = prevBookIds.filter((bookId) => !nextBookIds.includes(bookId));
  const completedIds = disappearedIds.filter((bookId) => !activeTouchedIds.includes(bookId));
  if (completedIds.length) {
    await refreshLibraryBooksByIds(completedIds);
  }
}

async function loadDownloadJobs({ syncLibrary = false } = {}) {
  try {
    const data = await state.shell.api("/api/library/download/jobs");
    await applyDownloadJobsPayload(data, { syncLibrary });
  } catch {
    await applyDownloadJobsPayload({ items: [] }, { syncLibrary });
  }
}

function triggerFileDownload(url, fileName = "") {
  const link = document.createElement("a");
  link.href = String(url || "");
  if (fileName) link.download = String(fileName || "");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function formatFileSize(bytes) {
  const size = Math.max(0, Number(bytes || 0));
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatCountdownSeconds(seconds) {
  const total = Math.max(0, Math.ceil(Number(seconds || 0)));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function currentProtectionCountdown(protection) {
  if (!protection || !protection.access_code_enabled) return 0;
  const expiresAt = Math.max(0, Number(protection.access_code_expires_at_ts || 0));
  if (!expiresAt) return Math.max(0, Number(protection.access_code_seconds_remaining || 0));
  return Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
}

function getExportJobProtectionInfo(job) {
  return (job && job.protection && typeof job.protection === "object") ? job.protection : {};
}

function getAllExportJobs() {
  const optimistic = Array.isArray(state.exportOptimisticJobs) ? state.exportOptimisticJobs : [];
  const serverJobs = Array.isArray(state.exportJobs) ? state.exportJobs : [];
  return [...optimistic, ...serverJobs];
}

function parseIsoMs(value) {
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : 0;
}

function formatExportJobDateTime(value) {
  const ms = parseIsoMs(value);
  if (!ms) return "";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toLocaleString("vi-VN");
  }
}

function exportJobFilterTimeMs(job) {
  return Math.max(
    parseIsoMs(job && job.finished_at),
    parseIsoMs(job && job.created_at),
  );
}

function exportJobTimeLabel(job) {
  const finishedText = formatExportJobDateTime(job && job.finished_at);
  if (finishedText) return `Xuất: ${finishedText}`;
  const createdText = formatExportJobDateTime(job && job.created_at);
  if (createdText) return `Tạo: ${createdText}`;
  return "";
}

function parseLocalDateStartMs(value) {
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const parts = raw.split("-").map((item) => Number.parseInt(item, 10));
  if (parts.length !== 3 || parts.some((item) => !Number.isFinite(item))) return 0;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
}

function parseLocalDateEndExclusiveMs(value) {
  const startMs = parseLocalDateStartMs(value);
  if (!startMs) return 0;
  return startMs + (24 * 60 * 60 * 1000);
}

function exportJobMatchesFilters(job) {
  const filters = state.exportJobsFilters || {};
  const query = String(filters.search || "").trim().toLowerCase();
  if (query) {
    const haystack = [
      String((job && job.book_title) || ""),
      String((job && job.file_name) || ""),
      String((job && job.format_label) || ""),
      String((job && job.format) || ""),
      String((job && job.message) || ""),
    ].join(" ").toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  const formatFilter = String(filters.format || "all").trim().toLowerCase();
  if (formatFilter && formatFilter !== "all") {
    if (String((job && job.format) || "").trim().toLowerCase() !== formatFilter) return false;
  }
  const fromMs = parseLocalDateStartMs(filters.dateFrom);
  const toExclusiveMs = parseLocalDateEndExclusiveMs(filters.dateTo);
  if (fromMs || toExclusiveMs) {
    const jobMs = exportJobFilterTimeMs(job);
    if (!jobMs) return false;
    if (fromMs && jobMs < fromMs) return false;
    if (toExclusiveMs && jobMs >= toExclusiveMs) return false;
  }
  return true;
}

function getFilteredExportJobs() {
  return getAllExportJobs().filter((job) => exportJobMatchesFilters(job));
}

function syncExportJobsFormatFilterOptions() {
  if (!refs.exportJobsFormatFilter) return;
  const current = String((refs.exportJobsFormatFilter.value || state.exportJobsFilters.format || "all")).trim().toLowerCase() || "all";
  const formats = Array.from(new Set(
    getAllExportJobs()
      .map((job) => String((job && job.format) || "").trim().toLowerCase())
      .filter(Boolean),
  )).sort((a, b) => a.localeCompare(b));
  refs.exportJobsFormatFilter.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "Tất cả";
  refs.exportJobsFormatFilter.appendChild(allOption);
  for (const fmt of formats) {
    const option = document.createElement("option");
    option.value = fmt;
    option.textContent = String(fmt || "").toUpperCase();
    refs.exportJobsFormatFilter.appendChild(option);
  }
  refs.exportJobsFormatFilter.value = formats.includes(current) || current === "all" ? current : "all";
  state.exportJobsFilters.format = String(refs.exportJobsFormatFilter.value || "all").trim().toLowerCase() || "all";
}

function clampExportJobsPage(filteredCount) {
  const pageSize = Math.max(1, Number(state.exportJobsPageSize || EXPORT_JOBS_PAGE_SIZE || 8));
  const totalPages = Math.max(1, Math.ceil(Math.max(0, Number(filteredCount || 0)) / pageSize));
  state.exportJobsPage = Math.max(1, Math.min(totalPages, Number(state.exportJobsPage || 1)));
  return totalPages;
}

function resetExportJobsFilters() {
  state.exportJobsFilters = {
    search: "",
    format: "all",
    dateFrom: "",
    dateTo: "",
  };
  state.exportJobsPage = 1;
  if (refs.exportJobsSearchInput) refs.exportJobsSearchInput.value = "";
  if (refs.exportJobsFormatFilter) refs.exportJobsFormatFilter.value = "all";
  if (refs.exportJobsDateFrom) refs.exportJobsDateFrom.value = "";
  if (refs.exportJobsDateTo) refs.exportJobsDateTo.value = "";
}

function addOptimisticExportJob(job) {
  if (!job || typeof job !== "object") return;
  state.exportOptimisticJobs = [
    job,
    ...(Array.isArray(state.exportOptimisticJobs) ? state.exportOptimisticJobs : []),
  ];
}

function removeOptimisticExportJob(jobId) {
  const target = String(jobId || "").trim();
  if (!target) return;
  state.exportOptimisticJobs = (Array.isArray(state.exportOptimisticJobs) ? state.exportOptimisticJobs : [])
    .filter((job) => String((job && job.job_id) || "").trim() !== target);
}

function nextOptimisticExportQueuePosition() {
  return getAllExportJobs().reduce((maxPos, job) => {
    const status = String((job && job.status) || "").trim().toLowerCase();
    if (status !== "queued") return maxPos;
    return Math.max(maxPos, Number((job && job.queue_position) || 0));
  }, 0) + 1;
}

function buildOptimisticExportJob({ book, spec, options, chapterIds, pendingTranslation }) {
  const createdAt = new Date().toISOString();
  return {
    job_id: `pending_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    status: "queued",
    current_phase: "queued",
    current_index: 0,
    current_chapter_order: 0,
    current_title: "",
    message: "Đang thêm vào hàng đợi xuất file...",
    book_id: String((book && book.book_id) || "").trim(),
    book_title: normalizeDisplayTitle((book && (book.title_display || book.title)) || state.shell.t("libraryTitle")),
    format: String((spec && spec.id) || "").trim().toLowerCase(),
    format_label: String((spec && (spec.label || spec.id)) || "").trim(),
    translation_mode: getCurrentTranslationMode(),
    use_translated_text: Boolean(options && options.use_translated_text),
    total_chapters: Math.max(0, Number((chapterIds && chapterIds.length) || 0)),
    completed_chapters: 0,
    translation_pending_chapters: Boolean(options && options.use_translated_text) ? Math.max(0, Number(pendingTranslation || 0)) : 0,
    remaining_translation_chapters: Boolean(options && options.use_translated_text) ? Math.max(0, Number(pendingTranslation || 0)) : 0,
    progress: 0,
    created_at: createdAt,
    updated_at: createdAt,
    started_at: "",
    finished_at: "",
    expires_at: "",
    file_name: "",
    download_url: "",
    file_exists: false,
    file_size_bytes: 0,
    queue_position: nextOptimisticExportQueuePosition(),
    protection: {},
  };
}

function stopExportCodeTicker() {
  if (!state.exportCodeTimer) return;
  window.clearInterval(state.exportCodeTimer);
  state.exportCodeTimer = null;
}

function ensureExportCodeTicker() {
  const hasProtectedCodes = getAllExportJobs().some((job) => Boolean(getExportJobProtectionInfo(job).access_code_enabled));
  if (!hasProtectedCodes) {
    stopExportCodeTicker();
    return;
  }
  if (state.exportCodeTimer) return;
  state.exportCodeTimer = window.setInterval(() => {
    const jobs = getAllExportJobs();
    const needsReload = jobs.some((job) => {
      const protection = getExportJobProtectionInfo(job);
      return Boolean(protection.access_code_enabled) && currentProtectionCountdown(protection) <= 0;
    });
    if (needsReload && (Date.now() - Number(state.exportJobsLoadedAt || 0)) > 1200) {
      loadExportJobs().catch(() => {});
      return;
    }
    renderExportJobs();
  }, 1000);
}

function computeExportJobPercent(job) {
  const total = Math.max(0, Number(job.total_chapters || 0));
  const done = Math.max(0, Number(job.completed_chapters || 0));
  const ratioDone = total > 0 ? (done / total) : 0;
  const ratioProgress = Math.max(0, Math.min(1, Number(job.progress || 0)));
  let ratio = Math.max(ratioDone, ratioProgress);
  if (String(job.status || "") === "completed") ratio = 1;
  return Math.max(0, Math.min(100, ratio * 100));
}

function buildExportJobProgressSummary(job) {
  const status = String(job.status || "").trim().toLowerCase();
  const phase = String(job.current_phase || "").trim().toLowerCase();
  const done = Math.max(0, Number(job.completed_chapters || 0));
  const total = Math.max(0, Number(job.total_chapters || 0));
  const pendingTotal = Math.max(0, Number(job.translation_pending_chapters || 0));
  const remaining = Math.max(0, Number(job.remaining_translation_chapters || 0));
  const translatedDone = Math.max(0, pendingTotal - remaining);
  const parts = [];
  if (status === "queued") {
    parts.push(state.shell.t("exportProgressWaiting"));
    if (pendingTotal > 0) {
      parts.push(state.shell.t("exportProgressNeedTranslateShort", { count: pendingTotal }));
    }
    return parts.join(" • ");
  }
  if (Boolean(job.use_translated_text)) {
    parts.push(state.shell.t("exportProgressHandledShort", { current: done, total }));
    if (pendingTotal > 0) {
      parts.push(state.shell.t("exportProgressTranslatedShort", { current: translatedDone, total: pendingTotal }));
    } else {
      parts.push(state.shell.t("exportProgressNoExtraTranslation"));
    }
  } else {
    parts.push(state.shell.t("exportProgressHandledRawShort", { current: done, total }));
  }
  if (phase === "packaging") {
    parts.push(state.shell.t("exportProgressPackaging"));
  } else if (status === "completed") {
    parts.push(state.shell.t("exportProgressReady"));
  }
  return parts.join(" • ");
}

function renderExportJobs() {
  if (!refs.exportJobsList || !refs.exportJobsCount || !refs.exportJobsEmpty) return;
  refs.exportJobsList.innerHTML = "";
  syncExportJobsFormatFilterOptions();
  const allJobs = getAllExportJobs();
  const filteredJobs = getFilteredExportJobs();
  const totalCount = allJobs.length;
  const filteredCount = filteredJobs.length;
  const pageSize = Math.max(1, Number(state.exportJobsPageSize || EXPORT_JOBS_PAGE_SIZE || 8));
  const totalPages = clampExportJobsPage(filteredCount);
  const pageIndex = Math.max(1, Number(state.exportJobsPage || 1));
  const sliceStart = Math.max(0, (pageIndex - 1) * pageSize);
  const pageItems = filteredJobs.slice(sliceStart, sliceStart + pageSize);

  refs.exportJobsCount.textContent = filteredCount === totalCount
    ? state.shell.t("exportJobsCount", { count: filteredCount })
    : `Số file: ${filteredCount}/${totalCount}`;
  if (refs.exportJobsSummary) {
    if (!totalCount) {
      refs.exportJobsSummary.textContent = "";
    } else if (filteredCount === totalCount) {
      refs.exportJobsSummary.textContent = `Hiện ${pageItems.length}/${filteredCount} file trong hàng đợi xuất.`;
    } else {
      refs.exportJobsSummary.textContent = `Hiện ${pageItems.length}/${filteredCount} file phù hợp bộ lọc, tổng ${totalCount} file.`;
    }
  }
  if (refs.exportJobsPageSummary) {
    refs.exportJobsPageSummary.textContent = filteredCount
      ? `Trang ${pageIndex}/${totalPages}`
      : "";
  }
  if (refs.btnExportJobsPrev) refs.btnExportJobsPrev.disabled = pageIndex <= 1;
  if (refs.btnExportJobsNext) refs.btnExportJobsNext.disabled = pageIndex >= totalPages;

  if (!allJobs.length) {
    refs.exportJobsEmpty.classList.remove("hidden");
    refs.exportJobsEmpty.textContent = state.shell.t("exportJobsEmpty");
    return;
  }
  if (!filteredCount) {
    refs.exportJobsEmpty.classList.remove("hidden");
    refs.exportJobsEmpty.textContent = "Không có file export nào khớp bộ lọc hiện tại.";
    return;
  }
  refs.exportJobsEmpty.classList.add("hidden");
  for (const job of pageItems) {
    const protection = getExportJobProtectionInfo(job);
    const row = document.createElement("article");
    row.className = "download-job-row";
    if (String(job.status || "") === "completed") row.classList.add("is-completed");
    if (String(job.status || "") === "failed") row.classList.add("is-failed");

    const title = document.createElement("div");
    title.className = "download-job-title";
    const formatLabel = String(job.format_label || job.format || "").trim();
    title.textContent = `${normalizeDisplayTitle(job.book_title || state.shell.t("libraryTitle"))}${formatLabel ? ` • ${formatLabel}` : ""}`;

    const fileName = String(job.file_name || "").trim();
    const fileNameNode = document.createElement("div");
    fileNameNode.className = "export-job-file-name";
    fileNameNode.hidden = !fileName;
    fileNameNode.textContent = fileName ? `Tệp: ${fileName}` : "";

    const meta = document.createElement("div");
    meta.className = "download-job-meta";
    const done = Math.max(0, Number(job.completed_chapters || 0));
    const total = Math.max(0, Number(job.total_chapters || 0));
    const pct = computeExportJobPercent(job);
    const queuePos = Math.max(0, Number(job.queue_position || 0));
    const queueText = queuePos > 0 ? state.shell.t("downloadQueuePos", { pos: queuePos }) : "";
    const translatedText = Boolean(job.use_translated_text)
      ? state.shell.t("exportTranslatedTag")
      : state.shell.t("exportRawTag");
    const sizeText = formatFileSize(job.file_size_bytes || 0);
    const timeText = exportJobTimeLabel(job);
    meta.textContent = `${translatedText} • ${state.shell.t("exportChapterCountShort", { current: done, total })} • ${state.shell.t("bookPercent", { percent: pct.toFixed(1) })}${queueText ? ` • ${queueText}` : ""}${sizeText ? ` • ${sizeText}` : ""}${timeText ? ` • ${timeText}` : ""}`;

    let protectionNode = null;
    if (protection.enabled) {
      protectionNode = document.createElement("div");
      protectionNode.className = "download-job-protection";

      const badge = document.createElement("span");
      badge.className = "download-job-chip";
      badge.textContent = state.shell.t("exportProtectedTag");
      protectionNode.appendChild(badge);

      if (protection.access_code_enabled) {
        const code = document.createElement("strong");
        code.className = "download-job-code";
        code.textContent = protection.access_code_display || protection.access_code || "";
        protectionNode.appendChild(code);

        const countdown = document.createElement("span");
        countdown.className = "download-job-protection-meta";
        countdown.textContent = state.shell.t("exportAccessCodeCountdown", {
          time: formatCountdownSeconds(currentProtectionCountdown(protection)),
        });
        protectionNode.appendChild(countdown);
      } else {
        const hint = document.createElement("span");
        hint.className = "download-job-protection-meta";
        hint.textContent = state.shell.t("exportProtectedNoCode");
        protectionNode.appendChild(hint);
      }
    }

    const progress = document.createElement("div");
    progress.className = "download-job-progress";

    const progressTrack = document.createElement("div");
    progressTrack.className = "download-job-progress-track";
    progressTrack.setAttribute("role", "progressbar");
    progressTrack.setAttribute("aria-valuemin", "0");
    progressTrack.setAttribute("aria-valuemax", "100");
    progressTrack.setAttribute("aria-valuenow", pct.toFixed(1));

    const progressFill = document.createElement("div");
    progressFill.className = "download-job-progress-fill";
    progressFill.style.width = `${pct.toFixed(1)}%`;
    progressTrack.appendChild(progressFill);

    const progressSummary = document.createElement("div");
    progressSummary.className = "download-job-progress-summary";
    progressSummary.textContent = buildExportJobProgressSummary(job);

    progress.append(progressTrack, progressSummary);

    const status = document.createElement("div");
    status.className = "download-job-status";
    const msg = String(job.message || "").trim();
    if (msg) {
      status.textContent = msg;
    } else if (String(job.status || "") === "running") {
      status.textContent = state.shell.t("exportStatusRunning");
    } else if (String(job.status || "") === "queued") {
      status.textContent = state.shell.t("exportStatusQueued");
    } else if (String(job.status || "") === "completed") {
      status.textContent = state.shell.t("exportStatusCompleted");
    } else {
      status.textContent = state.shell.t("exportStatusFailed");
    }

    const actions = document.createElement("div");
    actions.className = "download-job-actions";
    if (String(job.status || "") === "completed" && job.download_url) {
      const btnDownload = document.createElement("button");
      btnDownload.type = "button";
      btnDownload.className = "btn btn-small btn-primary";
      btnDownload.textContent = state.shell.t("downloadExportFile");
      btnDownload.addEventListener("click", () => {
        triggerFileDownload(job.download_url, job.file_name || "");
      });
      actions.appendChild(btnDownload);
    }
    if (String(job.status || "") === "completed" || String(job.status || "") === "failed") {
      const btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.className = "btn btn-small";
      btnDelete.textContent = state.shell.t("deleteExportFile");
      btnDelete.addEventListener("click", async () => {
        const confirmKey = protection.access_code_enabled
          ? "confirmDeleteExportJobProtected"
          : "confirmDeleteExportJob";
        const confirmed = await state.shell.confirmDialog({
          title: state.shell.t("deleteExportFile"),
          message: state.shell.t(confirmKey, {
            file: String(job.file_name || formatLabel || job.job_id || "").trim() || state.shell.t("exportDialogTitle"),
            code: String(protection.access_code_display || protection.access_code || "").trim(),
          }),
          confirmText: state.shell.t("deleteExportFile"),
        });
        if (!confirmed) return;
        try {
          await state.shell.api(`/api/library/export/${encodeURIComponent(String(job.job_id || ""))}`, {
            method: "DELETE",
          });
          await loadExportJobs();
        } catch (error) {
          state.shell.showToast(getErrorMessage(error));
        }
      });
      actions.appendChild(btnDelete);
    }

    row.append(title);
    if (!fileNameNode.hidden) row.appendChild(fileNameNode);
    row.append(meta);
    if (protectionNode) row.appendChild(protectionNode);
    row.append(progress, status, actions);
    refs.exportJobsList.appendChild(row);
  }
}

function buildExportJobsSignature(items) {
  if (!Array.isArray(items) || !items.length) return "";
  return items.map((job) => [
    String(job.job_id || ""),
    String(job.status || ""),
    Number(job.completed_chapters || 0),
    Number(job.total_chapters || 0),
    Number(job.remaining_translation_chapters || 0),
    Number(job.queue_position || 0),
    String(job.file_name || ""),
    Number(job.file_exists ? 1 : 0),
    String((job.protection && job.protection.access_code) || ""),
    Number((job.protection && job.protection.access_code_expires_at_ts) || 0),
  ].join(":")).join("|");
}

async function applyExportJobsPayload(payload) {
  const nextItems = Array.isArray(payload && payload.items) ? payload.items : [];
  state.exportJobs = nextItems;
  state.exportJobsSig = buildExportJobsSignature(nextItems);
  state.exportJobsLoadedAt = Date.now();
  renderExportJobs();
  ensureExportCodeTicker();
}

async function loadExportJobs() {
  try {
    const data = await state.shell.api("/api/library/export/jobs");
    await applyExportJobsPayload(data);
  } catch {
    await applyExportJobsPayload({ items: [] });
  }
}

function clearExportWatcher() {
  stopExportCodeTicker();
  if (state.exportEventSource) {
    try {
      state.exportEventSource.close();
    } catch {
      // ignore
    }
    state.exportEventSource = null;
  }
  if (state.exportStreamReconnectTimer) {
    window.clearTimeout(state.exportStreamReconnectTimer);
    state.exportStreamReconnectTimer = null;
  }
  if (state.exportPollTimer) {
    window.clearInterval(state.exportPollTimer);
    state.exportPollTimer = null;
  }
}

function scheduleExportStreamReconnect() {
  if (state.exportStreamReconnectTimer) return;
  state.exportStreamReconnectTimer = window.setTimeout(() => {
    state.exportStreamReconnectTimer = null;
    startExportPolling();
  }, 1200);
}

function startExportPolling() {
  if (state.exportEventSource || state.exportPollTimer) return;
  if (typeof window.EventSource === "function") {
    const stream = new window.EventSource("/api/library/export/jobs/stream");
    state.exportEventSource = stream;
    stream.addEventListener("jobs", (event) => {
      let payload = null;
      try {
        payload = JSON.parse(event.data || "{}");
      } catch {
        payload = null;
      }
      applyExportJobsPayload(payload || { items: [] }).catch(() => {});
    });
    stream.onmessage = (event) => {
      let payload = null;
      try {
        payload = JSON.parse(event.data || "{}");
      } catch {
        payload = null;
      }
      if (!payload || !Array.isArray(payload.items)) return;
      applyExportJobsPayload(payload).catch(() => {});
    };
    stream.onerror = () => {
      if (state.exportEventSource !== stream) return;
      try {
        stream.close();
      } catch {
        // ignore
      }
      state.exportEventSource = null;
      scheduleExportStreamReconnect();
    };
    return;
  }
  state.exportPollTimer = window.setInterval(() => {
    loadExportJobs().catch(() => {});
  }, 1500);
}

function clearDownloadWatcher() {
  if (state.downloadEventSource) {
    try {
      state.downloadEventSource.close();
    } catch {
      // ignore
    }
    state.downloadEventSource = null;
  }
  if (state.downloadStreamReconnectTimer) {
    window.clearTimeout(state.downloadStreamReconnectTimer);
    state.downloadStreamReconnectTimer = null;
  }
  if (state.downloadPollTimer) {
    window.clearInterval(state.downloadPollTimer);
    state.downloadPollTimer = null;
  }
}

function scheduleDownloadStreamReconnect() {
  if (state.downloadStreamReconnectTimer) return;
  state.downloadStreamReconnectTimer = window.setTimeout(() => {
    state.downloadStreamReconnectTimer = null;
    startDownloadPolling();
  }, 1200);
}

function startDownloadPolling() {
  if (state.downloadEventSource || state.downloadPollTimer) return;
  if (typeof window.EventSource === "function") {
    const stream = new window.EventSource("/api/library/download/jobs/stream");
    state.downloadEventSource = stream;
    stream.addEventListener("jobs", (event) => {
      let payload = null;
      try {
        payload = JSON.parse(event.data || "{}");
      } catch {
        payload = null;
      }
      applyDownloadJobsPayload(payload || { items: [] }, { syncLibrary: false }).catch(() => {});
    });
    stream.onmessage = (event) => {
      let payload = null;
      try {
        payload = JSON.parse(event.data || "{}");
      } catch {
        payload = null;
      }
      if (!payload || !Array.isArray(payload.items)) return;
      applyDownloadJobsPayload(payload, { syncLibrary: false }).catch(() => {});
    };
    stream.onerror = () => {
      if (state.downloadEventSource !== stream) return;
      try {
        stream.close();
      } catch {
        // ignore
      }
      state.downloadEventSource = null;
      scheduleDownloadStreamReconnect();
    };
    return;
  }
  state.downloadPollTimer = window.setInterval(() => {
    loadDownloadJobs({ syncLibrary: false }).catch(() => {});
  }, 1300);
}

async function enqueueBookDownload(bookId) {
  const bid = String(bookId || "").trim();
  if (!bid) return;
  state.shell.showStatus(state.shell.t("statusQueueDownload"));
  try {
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(bid)}/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (data && data.already_downloaded) {
      state.shell.showToast(state.shell.t("downloadAlreadyDone"));
      await refreshLibraryBooksByIds([bid]);
    } else {
      state.shell.showToast(state.shell.t("downloadQueued"));
      await loadDownloadJobs({ syncLibrary: false });
    }
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function checkBookUpdates(bookId) {
  const bid = String(bookId || "").trim();
  if (!bid) return;
  state.shell.showStatus(state.shell.t("statusCheckingBookUpdates"));
  try {
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(bid)}/refresh-toc`, {
      method: "POST",
    });
    if (data && data.changed) {
      state.shell.showToast(state.shell.t("toastBookUpdatesApplied", {
        added: Number(data.added || 0),
        removed: Number(data.removed || 0),
        renamed: Number(data.renamed || 0),
      }));
    } else {
      state.shell.showToast(state.shell.t("toastBookUpdatesNoChange"));
    }
    await Promise.all([loadLibraryData({ silent: true }), loadDownloadJobs({ syncLibrary: false })]);
    if (refs.bookActionsDialog && refs.bookActionsDialog.open && state.selectedBookId === bid) {
      openActions(bid);
    }
    window.dispatchEvent(new CustomEvent("reader-cache-changed", {
      detail: {
        source: "library-refresh-toc",
        action: "refresh_toc",
        book_id: bid,
      },
    }));
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function loadGlobalDicts() {
  const data = await state.shell.api("/api/local-dicts/global");
  const dicts = (data && data.global_dicts && typeof data.global_dicts === "object") ? data.global_dicts : {};
  state.globalDicts = {
    name: (dicts.name && typeof dicts.name === "object") ? dicts.name : {},
    vp: (dicts.vp && typeof dicts.vp === "object") ? dicts.vp : {},
  };
}

async function loadGlobalJunkLines() {
  const data = await state.shell.api("/api/junk-lines/global");
  if (Array.isArray(data && data.entries)) {
    state.globalJunkLines = data.entries
      .map((item) => ({
        text: String(item && (item.text ?? item.line) || "").trim(),
        use_regex: Boolean(item && (item.use_regex ?? item.regex)),
        ignore_case: Boolean(item && (item.ignore_case ?? item.case_insensitive)),
      }))
      .filter((item) => item.text);
    return;
  }
  state.globalJunkLines = Array.isArray(data && data.lines)
    ? data.lines.map((item) => ({
        text: String(item || "").trim(),
        use_regex: false,
        ignore_case: false,
      })).filter((item) => item.text)
    : [];
}

function renderGlobalJunkRows() {
  if (!refs.globalJunkBody) return;
  refs.globalJunkBody.innerHTML = "";
  const items = Array.isArray(state.globalJunkLines) ? state.globalJunkLines.slice() : [];
  if (refs.globalJunkTopHint) {
    refs.globalJunkTopHint.textContent = items.length
      ? state.shell.t("junkPreviewCount", { count: items.length })
      : state.shell.t("junkPreviewEmpty");
  }
  if (refs.globalJunkHint) {
    refs.globalJunkHint.textContent = items.length
      ? state.shell.t("junkPreviewHint")
      : state.shell.t("junkPreviewEmpty");
  }
  for (const entry of items) {
    const line = String(entry && entry.text || "").trim();
    const useRegex = Boolean(entry && entry.use_regex);
    const ignoreCase = Boolean(entry && entry.ignore_case);
    const tr = document.createElement("tr");
    const tdLine = document.createElement("td");
    const wrap = document.createElement("div");
    wrap.className = "junk-entry-row";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "name-target-inline";
    input.value = line || "";
    const regexLabel = document.createElement("label");
    regexLabel.className = "checkbox-row";
    const regexInput = document.createElement("input");
    regexInput.type = "checkbox";
    regexInput.checked = useRegex;
    const regexText = document.createElement("span");
    regexText.textContent = state.shell.t("junkRegexLabel");
    regexLabel.append(regexInput, regexText);
    const ignoreCaseLabel = document.createElement("label");
    ignoreCaseLabel.className = "checkbox-row";
    const ignoreCaseInput = document.createElement("input");
    ignoreCaseInput.type = "checkbox";
    ignoreCaseInput.checked = ignoreCase;
    const ignoreCaseText = document.createElement("span");
    ignoreCaseText.textContent = state.shell.t("junkIgnoreCaseLabel");
    ignoreCaseLabel.append(ignoreCaseInput, ignoreCaseText);
    wrap.append(input, regexLabel, ignoreCaseLabel);
    tdLine.appendChild(wrap);
    const tdAction = document.createElement("td");

    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.className = "btn btn-small";
    btnSave.textContent = state.shell.t("saveJunkEntry");
    btnSave.addEventListener("click", async () => {
      const nextValue = String(input.value || "").trim();
      if (!nextValue) {
        state.shell.showToast(state.shell.t("junkLineRequired"));
        return;
      }
      if (regexInput.checked) {
        const regexError = validateRegexPattern(nextValue);
        if (regexError) {
          state.shell.showToast(state.shell.t("invalidRegexPattern", { message: regexError }));
          input.focus();
          return;
        }
      }
      try {
        await state.shell.api("/api/junk-lines/global/entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            line,
            use_regex: useRegex,
            ignore_case: ignoreCase,
            new_line: nextValue,
            new_use_regex: Boolean(regexInput.checked),
            new_ignore_case: Boolean(ignoreCaseInput.checked),
          }),
        });
        await loadGlobalJunkLines();
        renderGlobalJunkRows();
        state.shell.showToast(state.shell.t("junkEntryApplied"));
      } catch (error) {
        state.shell.showToast(getErrorMessage(error));
      }
    });

    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "btn btn-small";
    btnDelete.textContent = state.shell.t("deleteJunkEntry");
    btnDelete.addEventListener("click", async () => {
      try {
        await state.shell.api("/api/junk-lines/global/entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ line, use_regex: useRegex, ignore_case: ignoreCase, delete: true }),
        });
        await loadGlobalJunkLines();
        renderGlobalJunkRows();
        state.shell.showToast(state.shell.t("junkEntryDeleted"));
      } catch (error) {
        state.shell.showToast(getErrorMessage(error));
      }
    });

    tdAction.append(btnSave, btnDelete);
    tr.append(tdLine, tdAction);
    refs.globalJunkBody.appendChild(tr);
  }
}

function renderGlobalDictRows() {
  if (!refs.globalDictsBody) return;
  refs.globalDictsBody.innerHTML = "";
  const kind = state.globalDictType === "vp" ? "vp" : "name";
  const entries = Object.entries((state.globalDicts && state.globalDicts[kind]) || {}).sort((a, b) => a[0].localeCompare(b[0], "zh-Hans-CN"));
  refs.globalDictsHint.textContent = entries.length
    ? state.shell.t("namePreviewCount", { count: entries.length })
    : state.shell.t("namePreviewEmpty");
  for (const [source, target] of entries) {
    const tr = document.createElement("tr");
    const tdSource = document.createElement("td");
    tdSource.textContent = source;
    const tdTarget = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "name-target-inline";
    input.value = target || "";
    tdTarget.appendChild(input);
    const tdAction = document.createElement("td");

    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.className = "btn btn-small";
    btnSave.textContent = state.shell.t("saveNameEntry");
    btnSave.addEventListener("click", async () => {
      const nextTarget = String(input.value || "").trim();
      if (!nextTarget) {
        state.shell.showToast(state.shell.t("nameTargetRequired"));
        return;
      }
      try {
        await state.shell.api("/api/local-dicts/global/entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dict_type: kind, source, target: nextTarget }),
        });
        await loadGlobalDicts();
        renderGlobalDictRows();
      } catch (error) {
        state.shell.showToast(getErrorMessage(error));
      }
    });

    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "btn btn-small";
    btnDelete.textContent = state.shell.t("deleteNameEntry");
    btnDelete.addEventListener("click", async () => {
      try {
        await state.shell.api("/api/local-dicts/global/entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dict_type: kind, source, target: "", delete: true }),
        });
        await loadGlobalDicts();
        renderGlobalDictRows();
      } catch (error) {
        state.shell.showToast(getErrorMessage(error));
      }
    });
    tdAction.append(btnSave, btnDelete);
    tr.append(tdSource, tdTarget, tdAction);
    refs.globalDictsBody.appendChild(tr);
  }
}

async function openGlobalDictsDialog() {
  state.shell.showStatus(state.shell.t("statusLoadingNamePreview"));
  try {
    await loadGlobalDicts();
    renderGlobalDictRows();
    if (refs.globalDictsTypeSelect) refs.globalDictsTypeSelect.value = state.globalDictType;
    if (refs.globalDictsDialog && !refs.globalDictsDialog.open) refs.globalDictsDialog.showModal();
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function openGlobalJunkDialog() {
  state.shell.showStatus(state.shell.t("statusLoadingJunkLines"));
  try {
    await loadGlobalJunkLines();
    renderGlobalJunkRows();
    if (refs.globalJunkDialog && !refs.globalJunkDialog.open) refs.globalJunkDialog.showModal();
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

function getCurrentTranslationMode() {
  return (typeof state.shell.getTranslationMode === "function" ? state.shell.getTranslationMode() : state.translationMode) || "server";
}

function getCurrentReaderMode() {
  const enabled = typeof state.shell.getTranslationEnabled === "function"
    ? state.shell.getTranslationEnabled()
    : state.translationEnabled;
  return enabled ? "trans" : "raw";
}

function resolveReaderModeForBook(book) {
  const preferred = getCurrentReaderMode();
  if (preferred !== "trans") return "raw";
  if (book && typeof book.translation_supported === "boolean") {
    return book.translation_supported ? "trans" : "raw";
  }
  const sourceType = String((book && book.source_type) || "").trim().toLowerCase();
  return sourceType.includes("comic") ? "raw" : preferred;
}

function buildBookUrl(bookOrId, mode = getCurrentReaderMode()) {
  const book = bookOrId && typeof bookOrId === "object" ? bookOrId : null;
  const bookId = book ? String(book.book_id || "").trim() : String(bookOrId || "").trim();
  const params = new URLSearchParams();
  params.set("book_id", bookId);
  params.set("mode", mode);
  if (mode === "trans") {
    params.set("translation_mode", getCurrentTranslationMode());
  }
  applyBookUrlHints(params, book);
  return `/book?${params.toString()}`;
}

function buildReaderUrl(bookOrId, chapterId = "", mode = getCurrentReaderMode()) {
  const book = bookOrId && typeof bookOrId === "object" ? bookOrId : null;
  const bookId = book ? String(book.book_id || "").trim() : String(bookOrId || "").trim();
  const params = new URLSearchParams();
  params.set("book_id", bookId);
  const chapter = String(chapterId || "").trim();
  if (chapter) params.set("chapter_id", chapter);
  params.set("mode", mode);
  if (mode === "trans") {
    params.set("translation_mode", getCurrentTranslationMode());
  }
  applyBookUrlHints(params, book);
  return `/reader?${params.toString()}`;
}

function currentExportInfo() {
  const info = state.exportBookDetail && state.exportBookDetail.export_info;
  return (info && typeof info === "object") ? info : {};
}

function currentExportFormatSpec() {
  const formatId = String((refs.exportFormatSelect && refs.exportFormatSelect.value) || "").trim().toLowerCase();
  return (state.exportFormats || []).find((item) => String(item.id || "").trim().toLowerCase() === formatId) || null;
}

function getExportableChapterRows() {
  const chapters = Array.isArray(state.exportBookDetail && state.exportBookDetail.chapters)
    ? state.exportBookDetail.chapters
    : [];
  const result = [];
  for (const chapter of chapters) {
    const exportState = (chapter && chapter.export && typeof chapter.export === "object") ? chapter.export : {};
    if (!exportState.can_export) continue;
    const chapterId = String((chapter && chapter.chapter_id) || "").trim();
    if (chapterId) result.push(chapter);
  }
  return result;
}

function buildExportRangeOptionLabel(chapter, fallbackIndex = 1) {
  const order = Math.max(1, Number((chapter && chapter.chapter_order) || fallbackIndex || 1));
  const title = normalizeDisplayTitle(
    (chapter && (chapter.title_display || chapter.title_raw || chapter.title_vi)) || "",
  );
  return `${order}. ${title || `Chương ${order}`}`;
}

function syncExportRangeOptions() {
  const startSelect = refs.exportRangeStartSelect;
  const endSelect = refs.exportRangeEndSelect;
  if (!startSelect || !endSelect) return;
  const chapters = getExportableChapterRows();
  const prevStart = String(startSelect.value || "").trim();
  const prevEnd = String(endSelect.value || "").trim();
  startSelect.innerHTML = "";
  endSelect.innerHTML = "";
  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index];
    const chapterId = String((chapter && chapter.chapter_id) || "").trim();
    if (!chapterId) continue;
    const label = buildExportRangeOptionLabel(chapter, index + 1);
    const optionStart = document.createElement("option");
    optionStart.value = chapterId;
    optionStart.textContent = label;
    startSelect.appendChild(optionStart);
    const optionEnd = document.createElement("option");
    optionEnd.value = chapterId;
    optionEnd.textContent = label;
    endSelect.appendChild(optionEnd);
  }
  if (!chapters.length) {
    startSelect.disabled = true;
    endSelect.disabled = true;
    return;
  }
  const chapterIds = chapters.map((chapter) => String((chapter && chapter.chapter_id) || "").trim());
  startSelect.disabled = false;
  endSelect.disabled = false;
  startSelect.value = chapterIds.includes(prevStart) ? prevStart : chapterIds[0];
  endSelect.value = chapterIds.includes(prevEnd) ? prevEnd : chapterIds[chapterIds.length - 1];
  const startIndex = chapterIds.indexOf(String(startSelect.value || "").trim());
  const endIndex = chapterIds.indexOf(String(endSelect.value || "").trim());
  if (startIndex > endIndex) endSelect.value = startSelect.value;
}

function getSelectedExportChapterRows() {
  const chapters = getExportableChapterRows();
  if (!chapters.length) return [];
  const chapterIds = chapters.map((chapter) => String((chapter && chapter.chapter_id) || "").trim());
  const startId = String((refs.exportRangeStartSelect && refs.exportRangeStartSelect.value) || "").trim();
  const endId = String((refs.exportRangeEndSelect && refs.exportRangeEndSelect.value) || "").trim();
  let startIndex = chapterIds.indexOf(startId);
  let endIndex = chapterIds.indexOf(endId);
  if (startIndex < 0) startIndex = 0;
  if (endIndex < 0) endIndex = chapterIds.length - 1;
  if (startIndex > endIndex) [startIndex, endIndex] = [endIndex, startIndex];
  return chapters.slice(startIndex, endIndex + 1);
}

function currentExportableChapterIds() {
  return getSelectedExportChapterRows()
    .map((chapter) => String((chapter && chapter.chapter_id) || "").trim())
    .filter(Boolean);
}

function currentExportPendingTranslationCount() {
  if (!isExportTranslatedSelected()) return 0;
  return getSelectedExportChapterRows().reduce((count, chapter) => {
    const exportState = (chapter && chapter.export && typeof chapter.export === "object") ? chapter.export : {};
    return count + (exportState.needs_translation ? 1 : 0);
  }, 0);
}

function isExportTranslatedSelected() {
  const spec = currentExportFormatSpec();
  if (!spec || !Array.isArray(spec.options)) return false;
  const hasTranslatedOption = spec.options.some((item) => String(item && item.key || "") === "use_translated_text");
  if (!hasTranslatedOption) return false;
  const checkbox = refs.exportOptionsList
    ? refs.exportOptionsList.querySelector('input[data-option-key="use_translated_text"]')
    : null;
  return Boolean(checkbox && checkbox.checked);
}

function closeExportDialog() {
  if (refs.exportDialog && refs.exportDialog.open) refs.exportDialog.close();
}

function getExportOptionInput(key) {
  if (!refs.exportOptionsList) return null;
  return refs.exportOptionsList.querySelector(`input[data-option-key="${String(key || "")}"]`);
}

function isExportOptionEnabled(key) {
  const input = getExportOptionInput(key);
  if (!(input instanceof HTMLInputElement)) return false;
  if (input.disabled) return false;
  const row = input.closest(".export-option-item");
  if (row && row.hidden) return false;
  if (input.type === "checkbox") return Boolean(input.checked);
  return Boolean(String(input.value || "").trim());
}

function updateExportOptionVisibility() {
  if (!refs.exportOptionsList) return;
  const items = Array.from(refs.exportOptionsList.querySelectorAll(".export-option-item"));
  for (const row of items) {
    const dependsOn = String(row.dataset.dependsOn || "").trim();
    const visible = !dependsOn || isExportOptionEnabled(dependsOn);
    row.hidden = !visible;
    const input = row.querySelector("[data-option-key]");
    if (input instanceof HTMLInputElement) input.disabled = !visible;
  }
}

function renderExportOptions() {
  const spec = currentExportFormatSpec();
  if (!refs.exportOptionsList) return;
  refs.exportOptionsList.innerHTML = "";
  if (!spec || !Array.isArray(spec.options) || !spec.options.length) {
    const empty = document.createElement("p");
    empty.className = "empty-text";
    empty.textContent = state.shell.t("exportOptionNone");
    refs.exportOptionsList.appendChild(empty);
    return;
  }
  for (const option of spec.options) {
    const optionType = String(option && option.type || "bool").trim().toLowerCase();
    const wrapper = document.createElement("div");
    wrapper.className = `export-option-item export-option-item-${optionType}`;
    wrapper.dataset.optionRowKey = String(option.key || "");
    wrapper.dataset.dependsOn = String(option.depends_on || option.dependsOn || "");

    if (optionType === "number") {
      wrapper.classList.add("export-option-row");
      const label = document.createElement("label");
      label.className = "export-option-field";
      label.htmlFor = `export-option-${String(option.key || "")}`;

      const text = document.createElement("span");
      text.className = "export-option-label";
      text.textContent = String(option.label || option.key || "");

      const inline = document.createElement("div");
      inline.className = "export-option-inline";

      const input = document.createElement("input");
      input.type = "number";
      input.id = `export-option-${String(option.key || "")}`;
      input.className = "name-target-inline export-option-number";
      input.value = String(option.default_value ?? option.defaultValue ?? 0);
      input.min = String(option.min ?? 0);
      input.max = String(option.max ?? 9999);
      input.step = String(option.step ?? 1);
      input.dataset.optionKey = String(option.key || "");
      input.addEventListener("input", updateExportOptionVisibility);

      inline.appendChild(input);
      if (option.suffix) {
        const suffix = document.createElement("span");
        suffix.className = "export-option-unit";
        suffix.textContent = String(option.suffix || "");
        inline.appendChild(suffix);
      }

      label.append(text, inline);
      wrapper.appendChild(label);
    } else {
      wrapper.classList.add("export-option-row");
      const label = document.createElement("label");
      label.className = "checkbox-row";
      label.htmlFor = `export-option-${String(option.key || "")}`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `export-option-${String(option.key || "")}`;
      checkbox.checked = Boolean(option.default_enabled ?? option.defaultEnabled);
      checkbox.dataset.optionKey = String(option.key || "");
      checkbox.addEventListener("change", () => {
        updateExportOptionVisibility();
        renderExportChapterList(state.exportBookDetail);
      });

      const text = document.createElement("span");
      text.textContent = String(option.label || option.key || "");
      label.append(checkbox, text);
      wrapper.appendChild(label);
    }

    if (option.hint) {
      const hint = document.createElement("small");
      hint.className = "export-option-help";
      hint.textContent = String(option.hint || "");
      wrapper.appendChild(hint);
    }

    refs.exportOptionsList.appendChild(wrapper);
  }
  updateExportOptionVisibility();
}

function renderExportChapterList(book) {
  if (!refs.exportChapterList) return;
  refs.exportChapterList.innerHTML = "";
  const exportInfo = currentExportInfo();
  const chapters = Array.isArray(book && book.chapters) ? book.chapters : [];
  const exportableRows = getExportableChapterRows();
  const selectedRows = getSelectedExportChapterRows();
  const counts = (exportInfo && typeof exportInfo.counts === "object") ? exportInfo.counts : {};
  const downloaded = Math.max(0, Number(counts.downloaded_chapters || (book && book.downloaded_chapters) || 0));
  const total = Math.max(0, Number(counts.total_chapters || chapters.length || 0));
  const missingDownload = Math.max(0, Number(counts.missing_download_chapters || 0));
  const pendingTranslation = currentExportPendingTranslationCount();
  const selectedCount = selectedRows.length;
  const exportableCount = exportableRows.length;
  if (refs.exportChapterStats) {
    refs.exportChapterStats.textContent = `${selectedCount}/${exportableCount || downloaded || 0} chương xuất`;
  }
  if (refs.exportChapterHint) {
    const rangeText = selectedCount > 0
      ? `Đang chọn ${selectedCount} chương đã tải để xuất`
      : "Chưa có chương đã tải để chọn xuất";
    if (selectedCount > 0 && selectedCount < exportableCount) {
      refs.exportChapterHint.textContent = `${rangeText}. Có ${exportableCount - selectedCount} chương đã tải nằm ngoài khoảng đang chọn.`;
    } else if (missingDownload > 0 && selectedCount === exportableCount) {
      refs.exportChapterHint.textContent = `${rangeText}. ${state.shell.t("exportMissingDownloadHint", { count: missingDownload })}`;
    } else if (pendingTranslation > 0) {
      refs.exportChapterHint.textContent = `${rangeText}. ${state.shell.t("exportPendingTranslateHint", { count: pendingTranslation })}`;
    } else if (isExportTranslatedSelected() && selectedCount > 0) {
      refs.exportChapterHint.textContent = `${rangeText}. ${state.shell.t("exportAllTranslatedReady")}`;
    } else {
      refs.exportChapterHint.textContent = `${rangeText}. ${state.shell.t("exportCachedOnlyLocked")}`;
    }
  }
  if (!selectedRows.length) {
    const empty = document.createElement("p");
    empty.className = "empty-text";
    empty.textContent = exportableRows.length ? "Khoảng chọn hiện tại chưa hợp lệ." : state.shell.t("tocNoData");
    refs.exportChapterList.appendChild(empty);
    return;
  }
  for (const chapter of selectedRows) {
    const row = document.createElement("div");
    row.className = "export-chapter-row";
    const exportState = (chapter && chapter.export && typeof chapter.export === "object") ? chapter.export : {};
    const canExport = Boolean(exportState.can_export);
    const needsTranslation = Boolean(isExportTranslatedSelected() && exportState.needs_translation);
    const translationReady = Boolean(isExportTranslatedSelected() && exportState.translation_cached);
    const title = document.createElement("div");
    title.className = "export-chapter-title";
    title.textContent = `${chapter.chapter_order || "?"}. ${chapter.title_display || chapter.title_raw || ""}`;
    const meta = document.createElement("div");
    meta.className = "export-chapter-meta";
    if (!canExport) {
      meta.textContent = state.shell.t("exportNeedsDownload");
      row.classList.add("is-blocked");
    } else if (needsTranslation) {
      meta.textContent = state.shell.t("exportWillTranslate");
      row.classList.add("is-pending-translation");
    } else if (translationReady) {
      meta.textContent = state.shell.t("exportTranslationReady");
      row.classList.add("is-downloaded");
    } else {
      meta.textContent = state.shell.t("exportReady");
      row.classList.add("is-downloaded");
    }
    row.append(title, meta);
    refs.exportChapterList.appendChild(row);
  }
}

function renderExportCover(book) {
  if (!refs.exportCover) return;
  appendCoverMedia(refs.exportCover, {
    coverUrl: String((book && book.cover_url) || "").trim(),
    title: book && (book.title_display || book.title) || "",
    author: book && (book.author_display || book.author) || "",
    tag: "EXPORT",
  });
}

function renderExportDialog(book) {
  state.exportBookDetail = book || null;
  const exportInfo = currentExportInfo();
  state.exportFormats = exportInfo.formats || [];
  if (refs.exportFormatSelect) {
    refs.exportFormatSelect.innerHTML = "";
    for (const format of state.exportFormats) {
      const option = document.createElement("option");
      option.value = String(format.id || "");
      option.textContent = String(format.label || format.id || "");
      refs.exportFormatSelect.appendChild(option);
    }
    refs.exportFormatSelect.value = String(exportInfo.default_format || exportInfo.defaultFormat || ((state.exportFormats[0] || {}).id || ""));
  }
  if (refs.exportDialogTitle) refs.exportDialogTitle.textContent = state.shell.t("exportDialogTitle");
  if (refs.exportDialogSubtitle) {
    refs.exportDialogSubtitle.textContent = `${book.title_display || book.title || ""} • ${book.author_display || book.author || state.shell.t("unknownAuthor")}`;
  }
  if (refs.exportMetaTitle) refs.exportMetaTitle.value = String(book.title_display || book.title || "");
  if (refs.exportMetaAuthor) refs.exportMetaAuthor.value = String(book.author_display || book.author || "");
  if (refs.exportMetaSummary) refs.exportMetaSummary.value = String(book.summary_display || book.summary || "");
  if (refs.exportIncludeCategories) refs.exportIncludeCategories.checked = true;
  if (refs.exportBookKind) {
    const isZh = Boolean(book && !book.is_comic && String(book.lang_source || "").toLowerCase().startsWith("zh"));
    refs.exportBookKind.textContent = book.is_comic
      ? state.shell.t("exportKindComic")
      : (isZh ? state.shell.t("exportKindZhNovel") : state.shell.t("exportKindNovel"));
  }
  if (refs.exportBookCounts) {
    refs.exportBookCounts.textContent = state.shell.t("exportCountsLine", {
      total: Number(book.chapter_count || (Array.isArray(book.chapters) ? book.chapters.length : 0) || 0),
      downloaded: Number(book.downloaded_chapters || 0),
    });
  }
  if (refs.exportUseCachedOnly) {
    refs.exportUseCachedOnly.checked = true;
    refs.exportUseCachedOnly.disabled = true;
  }
  renderExportCover(book);
  renderExportOptions();
  syncExportRangeOptions();
  renderExportChapterList(book);
}

async function openExportDialog() {
  if (!state.selectedBookId) return;
  closeActions();
  state.shell.showStatus(state.shell.t("statusLoadingExport"));
  try {
    const translateMode = getCurrentTranslationMode();
    const mode = (typeof state.shell.getTranslationEnabled === "function" ? state.shell.getTranslationEnabled() : true) ? "trans" : "raw";
    const book = await state.shell.api(
      `/api/library/book/${encodeURIComponent(state.selectedBookId)}?mode=${encodeURIComponent(mode)}&translation_mode=${encodeURIComponent(translateMode)}`,
    );
    renderExportDialog(book);
    if (refs.exportDialog && !refs.exportDialog.open) refs.exportDialog.showModal();
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function submitExportDialog() {
  if (!state.selectedBookId || !state.exportBookDetail) return;
  const spec = currentExportFormatSpec();
  if (!spec) return;
  const counts = (currentExportInfo() && currentExportInfo().counts) || {};
  if (Math.max(0, Number(counts.exportable_chapters || 0)) <= 0) {
    state.shell.showToast(state.shell.t("exportNoDownloadedChapters"));
    return;
  }
  const options = {};
  for (const input of Array.from(refs.exportOptionsList.querySelectorAll("input[data-option-key]"))) {
    const key = String(input.dataset.optionKey || "").trim();
    if (!key || input.disabled) continue;
    if (input.type === "checkbox") {
      options[key] = Boolean(input.checked);
      continue;
    }
    if (input.type === "number") {
      const rawValue = Number.parseInt(String(input.value || "").trim(), 10);
      options[key] = Number.isFinite(rawValue) ? rawValue : 0;
      continue;
    }
  }
  const chapterIds = currentExportableChapterIds();
  if (!chapterIds.length) {
    state.shell.showToast(state.shell.t("exportNoDownloadedChapters"));
    return;
  }
  const pendingTranslation = currentExportPendingTranslationCount();
  const optimisticJob = buildOptimisticExportJob({
    book: state.exportBookDetail,
    spec,
    options,
    chapterIds,
    pendingTranslation,
  });
  closeExportDialog();
  addOptimisticExportJob(optimisticJob);
  state.exportJobsPage = 1;
  renderExportJobs();
  ensureExportCodeTicker();
  try {
    const categoryNames = Array.isArray(state.exportBookDetail && state.exportBookDetail.categories)
      ? state.exportBookDetail.categories
        .map((item) => String((item && item.name) || "").trim())
        .filter(Boolean)
      : [];
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(state.selectedBookId)}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: spec.id,
        format_label: String(spec.label || spec.id || "").trim(),
        translation_mode: getCurrentTranslationMode(),
        use_cached_only: true,
        chapter_ids: chapterIds,
        translation_pending_chapters: pendingTranslation,
        metadata: {
          title: String((refs.exportMetaTitle && refs.exportMetaTitle.value) || "").trim(),
          author: String((refs.exportMetaAuthor && refs.exportMetaAuthor.value) || "").trim(),
          summary: String((refs.exportMetaSummary && refs.exportMetaSummary.value) || "").trim(),
          categories_text: (refs.exportIncludeCategories && refs.exportIncludeCategories.checked && categoryNames.length)
            ? categoryNames.join(", ")
            : "",
        },
        options,
      }),
    });
    removeOptimisticExportJob(optimisticJob.job_id);
    if (data && data.job) {
      const nextJob = data.job;
      state.exportJobs = [
        nextJob,
        ...(Array.isArray(state.exportJobs) ? state.exportJobs : [])
          .filter((job) => String((job && job.job_id) || "").trim() !== String(nextJob.job_id || "").trim()),
      ];
      state.exportJobsLoadedAt = Date.now();
      renderExportJobs();
      ensureExportCodeTicker();
    } else {
      renderExportJobs();
    }
    state.shell.showToast(state.shell.t("exportQueued"));
    loadExportJobs().catch(() => {});
  } catch (error) {
    removeOptimisticExportJob(optimisticJob.job_id);
    renderExportJobs();
    ensureExportCodeTicker();
    state.shell.showToast(getErrorMessage(error));
  }
}

async function deleteBook() {
  if (!state.selectedBookId) return;
  const bookId = String(state.selectedBookId || "").trim();
  if (!bookId || isBookDeleting(bookId)) return;
  closeActions();
  if (!await state.shell.confirmDialog({
    title: state.shell.t("deleteBook"),
    message: state.shell.t("confirmDeleteBook"),
    confirmText: state.shell.t("deleteBook"),
  })) return;
  state.deletingBookIds.add(bookId);
  setBookDeletingVisual(bookId, true);
  try {
    await state.shell.api(`/api/library/book/${encodeURIComponent(bookId)}`, { method: "DELETE" });
    state.deletingBookIds.delete(bookId);
    state.books = (state.books || []).filter((item) => String((item && item.book_id) || "").trim() !== bookId);
    state.libraryTotalCount = Math.max(0, Number(state.libraryTotalCount || 0) - 1);
    state.libraryNextOffset = Math.max(0, Number(state.libraryNextOffset || 0) - 1);
    invalidateCategoryManagerBooks();
    if (state.selectedBookId === bookId) state.selectedBookId = null;
    if (state.bookCategoriesTargetBookId === bookId) state.bookCategoriesTargetBookId = "";
    renderBooks();
    await Promise.all([
      loadCategories({ silent: true }).catch(() => null),
      loadDownloadJobs({ syncLibrary: false }).catch(() => null),
    ]);
    renderBooks();
    renderCategoryManagerList();
    renderCategoryManagerBooks();
    state.shell.showToast(state.shell.t("toastBookDeleted"));
  } catch (error) {
    state.deletingBookIds.delete(bookId);
    setBookDeletingVisual(bookId, false);
    state.shell.showToast(getErrorMessage(error));
  }
}

async function init() {
  state.shell = await initShell({
    page: "library",
    onSearchSubmit: (q) => state.shell.goSearchPage(q),
    onPrepareImport: handlePrepareImport,
    onImportUrl: handleImportUrlPrepare,
    onImported: (data) => {
      applyImportedBookLocal(data && data.book, { refresh: true }).catch((error) => {
        state.shell.showToast(getErrorMessage(error));
      });
    },
  });
  if (state.shell && typeof state.shell.subscribeNotifications === "function") {
    state.shell.subscribeNotifications((payload) => {
      handleTrackedImportNotificationListing(payload).catch(() => {});
    });
  }
  state.translationEnabled = typeof state.shell.getTranslationEnabled === "function"
    ? state.shell.getTranslationEnabled()
    : true;
  state.translationMode = typeof state.shell.getTranslationMode === "function"
    ? state.shell.getTranslationMode()
    : "server";
  state.exportJobsPageSize = EXPORT_JOBS_PAGE_SIZE;
  const initialCategoryPair = buildDistinctCategoryFilters(
    parseLibraryCategoryIdsFromQuery(),
    parseLibraryExcludedCategoryIdsFromQuery(),
  );
  state.selectedCategoryIds = initialCategoryPair.include;
  state.selectedExcludedCategoryIds = initialCategoryPair.exclude;
  state.selectedCategoryMatchMode = parseLibraryCategoryMatchModeFromQuery();
  state.selectedAuthorFilter = parseLibraryAuthorFromQuery();
  state.authorFilterDraft = state.selectedAuthorFilter;

  refs.historyTitle.textContent = state.shell.t("historyTitle");
  refs.libraryTitle.textContent = state.shell.t("libraryTitle");
  if (refs.libraryFilterLabel) refs.libraryFilterLabel.textContent = state.shell.t("categoryFilterButton");
  if (refs.btnManageCategories) refs.btnManageCategories.textContent = state.shell.t("categoryManageButton");

  refs.bookActionsTitle.textContent = state.shell.t("bookActionsTitle");
  refs.btnCloseBookActions.textContent = state.shell.t("close");
  refs.btnActionOpenBook.textContent = state.shell.t("openBookInfo");
  refs.btnActionOpenReader.textContent = state.shell.t("openReader");
  if (refs.btnActionCheckUpdates) refs.btnActionCheckUpdates.textContent = state.shell.t("checkBookUpdates");
  if (refs.btnActionDownload) refs.btnActionDownload.textContent = state.shell.t("downloadBook");
  if (refs.btnActionExport) refs.btnActionExport.textContent = state.shell.t("exportBook");
  refs.btnActionDeleteBook.textContent = state.shell.t("deleteBook");
  if (refs.bookActionsCategoriesLabel) refs.bookActionsCategoriesLabel.textContent = state.shell.t("bookCategoriesLabel");
  if (refs.exportDialogTitle) refs.exportDialogTitle.textContent = state.shell.t("exportDialogTitle");
  if (refs.btnCloseExportDialog) refs.btnCloseExportDialog.textContent = state.shell.t("close");
  if (refs.btnCancelExportDialog) refs.btnCancelExportDialog.textContent = state.shell.t("cancel");
  if (refs.btnSubmitExportDialog) refs.btnSubmitExportDialog.textContent = state.shell.t("exportSubmit");
  if (refs.exportMetaTitleLabel) refs.exportMetaTitleLabel.textContent = state.shell.t("fieldTitle");
  if (refs.exportMetaAuthorLabel) refs.exportMetaAuthorLabel.textContent = state.shell.t("fieldAuthor");
  if (refs.exportMetaSummaryLabel) refs.exportMetaSummaryLabel.textContent = state.shell.t("fieldSummary");
  if (refs.exportIncludeCategoriesLabel) refs.exportIncludeCategoriesLabel.textContent = state.shell.t("exportIncludeCategories");
  if (refs.exportFormatLabel) refs.exportFormatLabel.textContent = state.shell.t("exportFormat");
  if (refs.exportUseCachedOnlyLabel) refs.exportUseCachedOnlyLabel.textContent = state.shell.t("exportCachedOnly");
  if (refs.exportChaptersTitle) refs.exportChaptersTitle.textContent = state.shell.t("tocTitle");
  if (refs.exportRangeStartLabel) refs.exportRangeStartLabel.textContent = "Từ chương đã tải";
  if (refs.exportRangeEndLabel) refs.exportRangeEndLabel.textContent = "Đến chương đã tải";
  if (refs.btnOpenGlobalJunk) refs.btnOpenGlobalJunk.textContent = state.shell.t("junkButton");
  if (refs.btnOpenGlobalDicts) refs.btnOpenGlobalDicts.textContent = state.shell.t("globalDictsButton");
  if (refs.downloadJobsTitle) refs.downloadJobsTitle.textContent = state.shell.t("downloadJobsTitle");
  if (refs.downloadJobsEmpty) refs.downloadJobsEmpty.textContent = state.shell.t("downloadJobsEmpty");
  if (refs.exportJobsTitle) refs.exportJobsTitle.textContent = state.shell.t("exportJobsTitle");
  if (refs.exportJobsEmpty) refs.exportJobsEmpty.textContent = state.shell.t("exportJobsEmpty");
  if (refs.exportJobsSearchLabel) refs.exportJobsSearchLabel.textContent = "Tìm nhanh";
  if (refs.exportJobsSearchInput) refs.exportJobsSearchInput.placeholder = "Tên truyện, tên file...";
  if (refs.exportJobsFormatLabel) refs.exportJobsFormatLabel.textContent = "Định dạng";
  if (refs.exportJobsDateFromLabel) refs.exportJobsDateFromLabel.textContent = "Từ ngày";
  if (refs.exportJobsDateToLabel) refs.exportJobsDateToLabel.textContent = "Đến ngày";
  if (refs.btnExportJobsFilterClear) refs.btnExportJobsFilterClear.textContent = state.shell.t("clearFilter");
  if (refs.btnExportJobsPrev) refs.btnExportJobsPrev.textContent = "Trang trước";
  if (refs.btnExportJobsNext) refs.btnExportJobsNext.textContent = "Trang sau";
  syncExportJobsFormatFilterOptions();
  if (refs.libraryCategoryFilterTitle) refs.libraryCategoryFilterTitle.textContent = state.shell.t("categoryFilterTitle");
  if (refs.btnCloseLibraryCategoryFilter) refs.btnCloseLibraryCategoryFilter.textContent = state.shell.t("close");
  if (refs.libraryCategoryFilterHint) refs.libraryCategoryFilterHint.textContent = state.shell.t("categoryFilterHint");
  if (refs.libraryAuthorFilterLabel) refs.libraryAuthorFilterLabel.textContent = state.shell.t("libraryAuthorFilterLabel");
  if (refs.libraryAuthorFilterInput) refs.libraryAuthorFilterInput.placeholder = state.shell.t("libraryAuthorFilterPlaceholder");
  if (refs.libraryCategoryMatchModeLabel) refs.libraryCategoryMatchModeLabel.textContent = state.shell.t("categoryFilterMatchModeLabel");
  const libraryCategoryMatchModeOr = document.getElementById("library-category-match-mode-or");
  const libraryCategoryMatchModeAnd = document.getElementById("library-category-match-mode-and");
  if (libraryCategoryMatchModeOr) libraryCategoryMatchModeOr.textContent = state.shell.t("categoryFilterModeOr");
  if (libraryCategoryMatchModeAnd) libraryCategoryMatchModeAnd.textContent = state.shell.t("categoryFilterModeAnd");
  if (refs.libraryCategoryFilterSearchLabel) refs.libraryCategoryFilterSearchLabel.textContent = state.shell.t("categorySearchLabel");
  if (refs.libraryCategoryIncludeTitle) refs.libraryCategoryIncludeTitle.textContent = state.shell.t("categoryFilterIncludeTitle");
  if (refs.libraryCategoryExcludeTitle) refs.libraryCategoryExcludeTitle.textContent = state.shell.t("categoryFilterExcludeTitle");
  if (refs.btnLibraryCategoryFilterClear) refs.btnLibraryCategoryFilterClear.textContent = state.shell.t("clearFilter");
  if (refs.btnLibraryCategoryFilterApply) refs.btnLibraryCategoryFilterApply.textContent = state.shell.t("applyFilter");
  if (refs.categoryManagerTitle) refs.categoryManagerTitle.textContent = state.shell.t("categoryManagerTitle");
  if (refs.btnCloseCategoryManager) refs.btnCloseCategoryManager.textContent = state.shell.t("close");
  if (refs.categoryManagerHint) refs.categoryManagerHint.textContent = state.shell.t("categoryManagerHint");
  if (refs.categoryManagerSearchLabel) refs.categoryManagerSearchLabel.textContent = state.shell.t("categorySearchLabel");
  if (refs.categoryManagerNameLabel) refs.categoryManagerNameLabel.textContent = state.shell.t("categoryNameLabel");
  if (refs.btnCategoryCreate) refs.btnCategoryCreate.textContent = state.shell.t("categoryCreate");
  if (refs.btnCategoryRename) refs.btnCategoryRename.textContent = state.shell.t("categoryRename");
  if (refs.btnCategoryDelete) refs.btnCategoryDelete.textContent = state.shell.t("categoryDelete");
  if (refs.categoryManagerBooksSearchLabel) refs.categoryManagerBooksSearchLabel.textContent = state.shell.t("categoryManagerBooksSearchLabel");
  if (refs.categoryManagerBooksSelectAllLabel) refs.categoryManagerBooksSelectAllLabel.textContent = state.shell.t("selectAll");
  if (refs.btnCategoryManagerAddBooks) refs.btnCategoryManagerAddBooks.textContent = state.shell.t("categoryAddBooks");
  if (refs.btnCategoryManagerRemoveBooks) refs.btnCategoryManagerRemoveBooks.textContent = state.shell.t("categoryRemoveBooks");
  if (refs.bookCategoriesTitle) refs.bookCategoriesTitle.textContent = state.shell.t("bookCategoriesDialogTitle");
  if (refs.btnCloseBookCategories) refs.btnCloseBookCategories.textContent = state.shell.t("close");
  if (refs.bookCategoriesSearchLabel) refs.bookCategoriesSearchLabel.textContent = state.shell.t("categorySearchLabel");
  if (refs.btnCancelBookCategories) refs.btnCancelBookCategories.textContent = state.shell.t("cancel");
  if (refs.btnSaveBookCategories) refs.btnSaveBookCategories.textContent = state.shell.t("save");
  if (refs.importCategoriesLabel) refs.importCategoriesLabel.textContent = state.shell.t("importCategoriesLabel");
  if (refs.btnImportCategoriesClear) refs.btnImportCategoriesClear.textContent = state.shell.t("importCategoriesClear");
  if (refs.importCategoriesHint) refs.importCategoriesHint.textContent = state.shell.t("importCategoriesHint");
  if (refs.importCategoriesSearchLabel) refs.importCategoriesSearchLabel.textContent = state.shell.t("importCategoriesSearchLabel");

  if (refs.globalJunkTitle) refs.globalJunkTitle.textContent = state.shell.t("junkDialogTitle");
  if (refs.btnCloseGlobalJunk) refs.btnCloseGlobalJunk.textContent = state.shell.t("close");
  if (refs.btnRefreshGlobalJunk) refs.btnRefreshGlobalJunk.textContent = state.shell.t("refreshJunkEntries");
  if (refs.globalJunkLineLabel) refs.globalJunkLineLabel.textContent = state.shell.t("junkLineLabel");
  if (refs.globalJunkRegexLabel) refs.globalJunkRegexLabel.textContent = state.shell.t("junkRegexLabel");
  if (refs.globalJunkIgnoreCaseLabel) refs.globalJunkIgnoreCaseLabel.textContent = state.shell.t("junkIgnoreCaseLabel");
  if (refs.btnAddGlobalJunkEntry) refs.btnAddGlobalJunkEntry.textContent = state.shell.t("addJunkEntry");
  if (refs.globalJunkColLine) refs.globalJunkColLine.textContent = state.shell.t("junkColLine");
  if (refs.globalJunkColAction) refs.globalJunkColAction.textContent = state.shell.t("junkColAction");

  if (refs.globalDictsTitle) refs.globalDictsTitle.textContent = state.shell.t("globalDictsTitle");
  if (refs.btnCloseGlobalDicts) refs.btnCloseGlobalDicts.textContent = state.shell.t("close");
  if (refs.globalDictsTypeLabel) refs.globalDictsTypeLabel.textContent = state.shell.t("globalDictsTypeLabel");
  const globalTypeNameOpt = document.getElementById("global-dicts-type-name");
  const globalTypeVpOpt = document.getElementById("global-dicts-type-vp");
  if (globalTypeNameOpt) globalTypeNameOpt.textContent = state.shell.t("nameDictTypeName");
  if (globalTypeVpOpt) globalTypeVpOpt.textContent = state.shell.t("nameDictTypeVp");
  if (refs.globalDictsSourceLabel) refs.globalDictsSourceLabel.textContent = state.shell.t("nameSourceLabel");
  if (refs.globalDictsTargetLabel) refs.globalDictsTargetLabel.textContent = state.shell.t("nameTargetLabel");
  if (refs.btnAddGlobalDictEntry) refs.btnAddGlobalDictEntry.textContent = state.shell.t("addNameEntry");
  if (refs.globalDictsColSource) refs.globalDictsColSource.textContent = state.shell.t("nameColSource");
  if (refs.globalDictsColTarget) refs.globalDictsColTarget.textContent = state.shell.t("nameColTarget");
  if (refs.globalDictsColAction) refs.globalDictsColAction.textContent = state.shell.t("nameColAction");
  if (refs.btnRefreshGlobalDicts) refs.btnRefreshGlobalDicts.textContent = state.shell.t("refreshNamePreview");

  refs.btnCloseBookActions.addEventListener("click", closeActions);
  if (refs.btnLibraryFilter) refs.btnLibraryFilter.addEventListener("click", openLibraryCategoryFilterDialog);
  if (refs.btnManageCategories) refs.btnManageCategories.addEventListener("click", () => {
    openCategoryManagerDialog().catch((error) => {
      state.shell.showToast(getErrorMessage(error));
    });
  });
  if (refs.btnCloseLibraryCategoryFilter) refs.btnCloseLibraryCategoryFilter.addEventListener("click", () => {
    if (refs.libraryCategoryFilterDialog && refs.libraryCategoryFilterDialog.open) refs.libraryCategoryFilterDialog.close();
  });
  if (refs.libraryCategoryFilterSearch) refs.libraryCategoryFilterSearch.addEventListener("input", renderLibraryCategoryFilterList);
  if (refs.libraryAuthorFilterInput) {
    refs.libraryAuthorFilterInput.addEventListener("input", () => {
      state.authorFilterDraft = normalizeAuthorFilterValue(refs.libraryAuthorFilterInput.value);
    });
    refs.libraryAuthorFilterInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyLibraryCategoryFilter().catch((error) => {
          state.shell.showToast(getErrorMessage(error));
        });
      }
    });
  }
  if (refs.libraryCategoryMatchModeSelect) {
    refs.libraryCategoryMatchModeSelect.addEventListener("change", () => {
      state.categoryFilterDraftMatchMode = normalizeCategoryMatchMode(refs.libraryCategoryMatchModeSelect.value);
      renderLibraryCategoryFilterList();
    });
  }
  if (refs.btnLibraryCategoryFilterClear) refs.btnLibraryCategoryFilterClear.addEventListener("click", () => {
    state.categoryFilterDraftIds = [];
    state.categoryFilterDraftExcludeIds = [];
    state.categoryFilterDraftMatchMode = "or";
    state.authorFilterDraft = "";
    if (refs.libraryAuthorFilterInput) refs.libraryAuthorFilterInput.value = "";
    if (refs.libraryCategoryMatchModeSelect) refs.libraryCategoryMatchModeSelect.value = "or";
    renderLibraryCategoryFilterList();
  });
  if (refs.btnLibraryCategoryFilterApply) refs.btnLibraryCategoryFilterApply.addEventListener("click", () => {
    applyLibraryCategoryFilter().catch((error) => {
      state.shell.showToast(getErrorMessage(error));
    });
  });
  if (refs.importModeSelect) refs.importModeSelect.addEventListener("change", () => {
    if (refs.importFileInput) refs.importFileInput.value = "";
    syncImportModeUi();
  });
  if (refs.importSkipPrepareInput) refs.importSkipPrepareInput.addEventListener("change", () => {
    syncImportModeUi();
  });
  if (refs.importCategoriesSearchInput) refs.importCategoriesSearchInput.addEventListener("input", renderImportCategoryList);
  if (refs.btnImportCategoriesClear) refs.btnImportCategoriesClear.addEventListener("click", () => {
    state.importSelectedCategoryIds = [];
    if (refs.importCategoriesSearchInput) refs.importCategoriesSearchInput.value = "";
    renderImportCategoryList();
  });
  if (refs.btnBookActionsCategories) refs.btnBookActionsCategories.addEventListener("click", () => {
    openBookCategoriesDialog(state.selectedBookId);
  });
  if (refs.btnCloseBookCategories) refs.btnCloseBookCategories.addEventListener("click", () => {
    if (refs.bookCategoriesDialog && refs.bookCategoriesDialog.open) refs.bookCategoriesDialog.close();
  });
  if (refs.btnCancelBookCategories) refs.btnCancelBookCategories.addEventListener("click", () => {
    if (refs.bookCategoriesDialog && refs.bookCategoriesDialog.open) refs.bookCategoriesDialog.close();
  });
  if (refs.bookCategoriesSearchInput) refs.bookCategoriesSearchInput.addEventListener("input", renderBookCategoriesDialogList);
  if (refs.btnSaveBookCategories) refs.btnSaveBookCategories.addEventListener("click", () => {
    saveBookCategoriesDialog().catch(() => {});
  });
  if (refs.btnCloseCategoryManager) refs.btnCloseCategoryManager.addEventListener("click", () => {
    if (refs.categoryManagerDialog && refs.categoryManagerDialog.open) refs.categoryManagerDialog.close();
  });
  if (refs.categoryManagerSearchInput) refs.categoryManagerSearchInput.addEventListener("input", renderCategoryManagerList);
  if (refs.categoryManagerBooksSearchInput) refs.categoryManagerBooksSearchInput.addEventListener("input", renderCategoryManagerBooks);
  if (refs.categoryManagerBooksSelectAll) refs.categoryManagerBooksSelectAll.addEventListener("change", () => {
    syncCategoryManagerBookSelectionToVisible(Boolean(refs.categoryManagerBooksSelectAll.checked));
    renderCategoryManagerBooks();
  });
  if (refs.categoryManagerForm) refs.categoryManagerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await createCategoryFromManager();
  });
  if (refs.btnCategoryRename) refs.btnCategoryRename.addEventListener("click", () => {
    renameCategoryFromManager().catch(() => {});
  });
  if (refs.btnCategoryDelete) refs.btnCategoryDelete.addEventListener("click", () => {
    deleteCategoryFromManager().catch(() => {});
  });
  if (refs.btnCategoryManagerAddBooks) refs.btnCategoryManagerAddBooks.addEventListener("click", () => {
    applyCategoryManagerBooks("add").catch(() => {});
  });
  if (refs.btnCategoryManagerRemoveBooks) refs.btnCategoryManagerRemoveBooks.addEventListener("click", () => {
    applyCategoryManagerBooks("remove").catch(() => {});
  });
  refs.btnActionOpenBook.addEventListener("click", () => {
    if (!state.selectedBookId) return;
    closeActions();
    const book = findStateBook(state.selectedBookId);
    const mode = resolveReaderModeForBook(book);
    window.location.href = buildBookUrl(book || state.selectedBookId, mode);
  });
  refs.btnActionOpenReader.addEventListener("click", () => {
    if (!state.selectedBookId) return;
    closeActions();
    const book = findStateBook(state.selectedBookId);
    const targetChapterId = book && book.last_read_chapter_id ? book.last_read_chapter_id : "";
    const mode = resolveReaderModeForBook(book);
    window.location.href = buildReaderUrl(book || state.selectedBookId, targetChapterId, mode);
  });
  if (refs.btnActionCheckUpdates) {
    refs.btnActionCheckUpdates.addEventListener("click", async () => {
      if (!state.selectedBookId) return;
      await checkBookUpdates(state.selectedBookId);
    });
  }
  if (refs.btnActionDownload) {
    refs.btnActionDownload.addEventListener("click", async () => {
      if (!state.selectedBookId) return;
      closeActions();
      await enqueueBookDownload(state.selectedBookId);
    });
  }
  if (refs.btnActionExport) refs.btnActionExport.addEventListener("click", () => {
    openExportDialog().catch(() => {});
  });
  refs.btnActionDeleteBook.addEventListener("click", deleteBook);
  if (refs.btnCloseExportDialog) refs.btnCloseExportDialog.addEventListener("click", closeExportDialog);
  if (refs.btnCancelExportDialog) refs.btnCancelExportDialog.addEventListener("click", closeExportDialog);
  if (refs.btnSubmitExportDialog) refs.btnSubmitExportDialog.addEventListener("click", () => {
    submitExportDialog().catch(() => {});
  });
  if (refs.exportRangeStartSelect) {
    refs.exportRangeStartSelect.addEventListener("change", () => {
      const chapters = getExportableChapterRows();
      const ids = chapters.map((chapter) => String((chapter && chapter.chapter_id) || "").trim());
      const startId = String(refs.exportRangeStartSelect.value || "").trim();
      const endId = String((refs.exportRangeEndSelect && refs.exportRangeEndSelect.value) || "").trim();
      const startIndex = ids.indexOf(startId);
      const endIndex = ids.indexOf(endId);
      if (startIndex >= 0 && endIndex >= 0 && startIndex > endIndex && refs.exportRangeEndSelect) {
        refs.exportRangeEndSelect.value = startId;
      }
      renderExportChapterList(state.exportBookDetail);
    });
  }
  if (refs.exportRangeEndSelect) {
    refs.exportRangeEndSelect.addEventListener("change", () => {
      const chapters = getExportableChapterRows();
      const ids = chapters.map((chapter) => String((chapter && chapter.chapter_id) || "").trim());
      const startId = String((refs.exportRangeStartSelect && refs.exportRangeStartSelect.value) || "").trim();
      const endId = String(refs.exportRangeEndSelect.value || "").trim();
      const startIndex = ids.indexOf(startId);
      const endIndex = ids.indexOf(endId);
      if (startIndex >= 0 && endIndex >= 0 && endIndex < startIndex && refs.exportRangeStartSelect) {
        refs.exportRangeStartSelect.value = endId;
      }
      renderExportChapterList(state.exportBookDetail);
    });
  }
  if (refs.exportJobsSearchInput) {
    refs.exportJobsSearchInput.addEventListener("input", () => {
      state.exportJobsFilters.search = String(refs.exportJobsSearchInput.value || "").trim();
      state.exportJobsPage = 1;
      renderExportJobs();
    });
  }
  if (refs.exportJobsFormatFilter) {
    refs.exportJobsFormatFilter.addEventListener("change", () => {
      state.exportJobsFilters.format = String(refs.exportJobsFormatFilter.value || "all").trim().toLowerCase() || "all";
      state.exportJobsPage = 1;
      renderExportJobs();
    });
  }
  if (refs.exportJobsDateFrom) {
    refs.exportJobsDateFrom.addEventListener("change", () => {
      state.exportJobsFilters.dateFrom = String(refs.exportJobsDateFrom.value || "").trim();
      state.exportJobsPage = 1;
      renderExportJobs();
    });
  }
  if (refs.exportJobsDateTo) {
    refs.exportJobsDateTo.addEventListener("change", () => {
      state.exportJobsFilters.dateTo = String(refs.exportJobsDateTo.value || "").trim();
      state.exportJobsPage = 1;
      renderExportJobs();
    });
  }
  if (refs.btnExportJobsFilterClear) {
    refs.btnExportJobsFilterClear.addEventListener("click", () => {
      resetExportJobsFilters();
      renderExportJobs();
    });
  }
  if (refs.btnExportJobsPrev) {
    refs.btnExportJobsPrev.addEventListener("click", () => {
      state.exportJobsPage = Math.max(1, Number(state.exportJobsPage || 1) - 1);
      renderExportJobs();
    });
  }
  if (refs.btnExportJobsNext) {
    refs.btnExportJobsNext.addEventListener("click", () => {
      state.exportJobsPage = Math.max(1, Number(state.exportJobsPage || 1) + 1);
      renderExportJobs();
    });
  }
  if (refs.exportFormatSelect) refs.exportFormatSelect.addEventListener("change", () => {
    renderExportOptions();
    syncExportRangeOptions();
    renderExportChapterList(state.exportBookDetail);
  });
  if (refs.btnOpenGlobalJunk) refs.btnOpenGlobalJunk.addEventListener("click", () => {
    openGlobalJunkDialog().catch(() => {});
  });
  if (refs.btnCloseGlobalJunk) refs.btnCloseGlobalJunk.addEventListener("click", () => {
    if (refs.globalJunkDialog && refs.globalJunkDialog.open) refs.globalJunkDialog.close();
  });
  if (refs.btnRefreshGlobalJunk) {
    refs.btnRefreshGlobalJunk.addEventListener("click", () => {
      openGlobalJunkDialog().catch(() => {});
    });
  }
  if (refs.globalJunkEntryForm) {
    refs.globalJunkEntryForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const line = String((refs.globalJunkLineInput && refs.globalJunkLineInput.value) || "").trim();
      if (!line) {
        state.shell.showToast(state.shell.t("junkLineRequired"));
        return;
      }
      if (refs.globalJunkRegexInput && refs.globalJunkRegexInput.checked) {
        const regexError = validateRegexPattern(line);
        if (regexError) {
          state.shell.showToast(state.shell.t("invalidRegexPattern", { message: regexError }));
          refs.globalJunkLineInput.focus();
          return;
        }
      }
      try {
        await state.shell.api("/api/junk-lines/global/entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            new_line: line,
            use_regex: Boolean(refs.globalJunkRegexInput && refs.globalJunkRegexInput.checked),
            ignore_case: Boolean(refs.globalJunkIgnoreCaseInput && refs.globalJunkIgnoreCaseInput.checked),
          }),
        });
        refs.globalJunkEntryForm.reset();
        await loadGlobalJunkLines();
        renderGlobalJunkRows();
        state.shell.showToast(state.shell.t("junkEntryApplied"));
      } catch (error) {
        state.shell.showToast(getErrorMessage(error));
      }
    });
  }
  if (refs.btnOpenGlobalDicts) refs.btnOpenGlobalDicts.addEventListener("click", () => {
    openGlobalDictsDialog().catch(() => {});
  });
  if (refs.btnCloseGlobalDicts) refs.btnCloseGlobalDicts.addEventListener("click", () => {
    if (refs.globalDictsDialog && refs.globalDictsDialog.open) refs.globalDictsDialog.close();
  });
  if (refs.btnRefreshGlobalDicts) {
    refs.btnRefreshGlobalDicts.addEventListener("click", () => {
      openGlobalDictsDialog().catch(() => {});
    });
  }
  if (refs.globalDictsTypeSelect) {
    refs.globalDictsTypeSelect.addEventListener("change", () => {
      state.globalDictType = String(refs.globalDictsTypeSelect.value || "name").trim().toLowerCase() === "vp" ? "vp" : "name";
      renderGlobalDictRows();
    });
  }
  if (refs.globalDictsEntryForm) {
    refs.globalDictsEntryForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const source = String((refs.globalDictsSourceInput && refs.globalDictsSourceInput.value) || "").trim();
      const target = String((refs.globalDictsTargetInput && refs.globalDictsTargetInput.value) || "").trim();
      if (!source || !target) {
        state.shell.showToast(state.shell.t("nameSourceTargetRequired"));
        return;
      }
      try {
        await state.shell.api("/api/local-dicts/global/entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dict_type: state.globalDictType, source, target }),
        });
        refs.globalDictsEntryForm.reset();
        await loadGlobalDicts();
        renderGlobalDictRows();
        state.shell.showToast(state.shell.t("nameEntryApplied"));
      } catch (error) {
        state.shell.showToast(getErrorMessage(error));
      }
    });
  }

  if (refs.btnImportCustomize) {
    refs.btnImportCustomize.addEventListener("click", async () => {
      try {
        if (!state.importSettings) {
          await loadImportSettings({ silent: false });
        }
        openImportCustomizeDialog();
      } catch {
        // toast already shown in loader
      }
    });
  }
  if (refs.btnImportCustomizeClose) {
    refs.btnImportCustomizeClose.addEventListener("click", () => {
      if (refs.importCustomizeDialog && refs.importCustomizeDialog.open) refs.importCustomizeDialog.close();
    });
  }
  if (refs.btnImportCustomizeReset) {
    refs.btnImportCustomizeReset.addEventListener("click", async () => {
      try {
        const data = await state.shell.api("/api/library/import/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        state.importSettings = cloneImportSettings((data && data.settings) || {});
        state.importPresets = (data && data.presets) || state.importPresets || {};
        applyImportSettingsToInputs(state.importSettings, customImportInputs());
        renderImportPresetButtons();
        state.shell.showToast(state.shell.t("toastImportSettingsReset"));
      } catch (error) {
        state.shell.showToast(getErrorMessage(error));
      }
    });
  }
  if (refs.importCustomizeForm) {
    refs.importCustomizeForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const payload = collectImportSettingsFromInputs(customImportInputs());
        const data = await state.shell.api("/api/library/import/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        state.importSettings = cloneImportSettings((data && data.settings) || payload);
        state.importPresets = (data && data.presets) || state.importPresets || {};
        renderImportPresetButtons();
        state.shell.showToast(state.shell.t("toastImportSettingsSaved"));
        if (refs.importCustomizeDialog && refs.importCustomizeDialog.open) refs.importCustomizeDialog.close();
      } catch (error) {
        state.shell.showToast(getErrorMessage(error));
      }
    });
  }

  if (refs.btnImportPreviewClose) {
    refs.btnImportPreviewClose.addEventListener("click", () => {
      if (refs.importPreviewDialog && refs.importPreviewDialog.open) refs.importPreviewDialog.close();
    });
  }
  if (refs.btnImportPreviewCancel) {
    refs.btnImportPreviewCancel.addEventListener("click", () => {
      if (refs.importPreviewDialog && refs.importPreviewDialog.open) refs.importPreviewDialog.close();
    });
  }
  if (refs.btnImportPreviewCommit) {
    refs.btnImportPreviewCommit.addEventListener("click", () => {
      commitPreparedImport().catch(() => {});
    });
  }
  if (refs.btnImportBatchClose) {
    refs.btnImportBatchClose.addEventListener("click", () => {
      if (refs.importBatchDialog && refs.importBatchDialog.open) refs.importBatchDialog.close();
    });
  }
  if (refs.btnImportBatchCancel) {
    refs.btnImportBatchCancel.addEventListener("click", () => {
      if (refs.importBatchDialog && refs.importBatchDialog.open) refs.importBatchDialog.close();
    });
  }
  if (refs.btnImportBatchCommit) {
    refs.btnImportBatchCommit.addEventListener("click", () => {
      commitBatchImports().catch(() => {});
    });
  }
  if (refs.importPreviewDialog) {
    refs.importPreviewDialog.addEventListener("close", () => {
      if (state.importPreviewContext !== "single") {
        clearImportPreviewState();
        return;
      }
      const token = String(state.importPreviewToken || "").trim();
      clearImportPreviewState();
      if (token) {
        cancelImportPreviewTokens([token], { silent: true }).catch(() => {});
      }
    });
  }
  if (refs.importBatchDialog) {
    refs.importBatchDialog.addEventListener("close", () => {
      if (state.batchImportCommitBusy) return;
      const tokens = collectBatchImportTokens();
      if (!tokens.length && !(state.batchImportItems || []).length) return;
      clearBatchImportSession();
      cancelImportPreviewTokens(tokens, { silent: true }).catch(() => {});
    });
  }
  if (refs.importProgressDialog) {
    refs.importProgressDialog.addEventListener("cancel", (event) => {
      if (state.batchImportProgress && state.batchImportProgress.active) {
        event.preventDefault();
      }
    });
  }
  if (refs.btnImportProgressHide) {
    refs.btnImportProgressHide.addEventListener("click", () => {
      if (!state.batchImportProgress || !state.batchImportProgress.active) return;
      state.batchImportProgress = {
        ...(state.batchImportProgress || {}),
        hidden: true,
      };
      renderBatchImportProgressDialog();
    });
  }

  window.addEventListener("reader-settings-changed", () => {
    const enabled = typeof state.shell.getTranslationEnabled === "function"
      ? state.shell.getTranslationEnabled()
      : true;
    const mode = typeof state.shell.getTranslationMode === "function"
      ? state.shell.getTranslationMode()
      : "server";
    const localSig = localTranslationSettingsSignature(state.shell);
    const localChanged = localSig !== state.translationLocalSig;
    if (enabled === state.translationEnabled && mode === state.translationMode && !((["local", "hanviet", "dichngay_local"].includes(mode)) && localChanged)) return;
    state.translationEnabled = enabled;
    state.translationMode = mode;
    state.translationLocalSig = localSig;
    clearLibraryTitleCacheState();
    reloadLibraryBooks({ silent: true }).catch(() => {});
  });

  window.addEventListener("reader-cache-changed", () => {
    clearLibraryTitleCacheState();
    reloadLibraryBooks({ silent: true }).catch(() => {});
    loadDownloadJobs({ syncLibrary: false }).catch(() => {});
  });

  window.addEventListener("beforeunload", () => {
    clearLibraryTitleCacheState();
    clearDownloadWatcher();
    clearExportWatcher();
  });

  state.translationLocalSig = localTranslationSettingsSignature(state.shell);
  syncImportModeUi();
  renderImportCategoryList();
  syncImportPreviewCommitButton();
  await Promise.all([
    loadImportSettings({ silent: true }).catch(() => null),
    loadLibraryData(),
    loadDownloadJobs({ syncLibrary: false }),
    loadExportJobs(),
  ]);
  startDownloadPolling();
  startExportPolling();
  updateLibraryFilterBadge();
}

init();
