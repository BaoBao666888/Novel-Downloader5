import { initShell } from "../site_common.js?v=20260307-export2";
import { normalizeDisplayTitle } from "../reader_text.js?v=20260307-br2";

const refs = {
  historyTitle: document.getElementById("history-title"),
  historyCount: document.getElementById("history-count"),
  historyGrid: document.getElementById("history-grid"),
  historyEmpty: document.getElementById("history-empty"),

  libraryTitle: document.getElementById("library-title"),
  libraryCount: document.getElementById("library-count"),
  libraryGrid: document.getElementById("library-grid"),
  libraryEmpty: document.getElementById("library-empty"),
  downloadJobsTitle: document.getElementById("download-jobs-title"),
  downloadJobsCount: document.getElementById("download-jobs-count"),
  downloadJobsList: document.getElementById("download-jobs-list"),
  downloadJobsEmpty: document.getElementById("download-jobs-empty"),

  bookActionsDialog: document.getElementById("book-actions-dialog"),
  bookActionsTitle: document.getElementById("book-actions-title"),
  bookActionsSubtitle: document.getElementById("book-actions-subtitle"),
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
  exportFormatLabel: document.getElementById("export-format-label"),
  exportFormatSelect: document.getElementById("export-format-select"),
  exportOptionsList: document.getElementById("export-options-list"),
  exportUseCachedOnly: document.getElementById("export-use-cached-only"),
  exportUseCachedOnlyLabel: document.getElementById("export-use-cached-only-label"),
  exportChaptersTitle: document.getElementById("export-chapters-title"),
  exportChapterStats: document.getElementById("export-chapter-stats"),
  exportChapterList: document.getElementById("export-chapter-list"),

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
};

const state = {
  historyItems: [],
  books: [],
  pendingImports: [],
  downloadJobs: [],
  downloadJobsSig: "",
  selectedBookId: null,
  shell: null,
  translationEnabled: true,
  translationMode: "server",
  translationLocalSig: "{}",
  globalDicts: { name: {}, vp: {} },
  globalDictType: "name",
  downloadPollTimer: null,
  downloadEventSource: null,
  downloadStreamReconnectTimer: null,
  libraryRefreshBusy: false,
  lastLibraryRefreshTs: 0,
  importSettings: null,
  importPresets: null,
  importPreviewToken: "",
  importPreviewData: null,
  exportBookDetail: null,
  exportFormats: [],
};

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

function splitMultilineValues(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
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

function renderImportPreview(preview) {
  if (!preview || !refs.importPreviewDialog) return;
  if (preview.presets) state.importPresets = preview.presets;
  state.importPreviewData = preview;
  const metadata = preview.metadata || {};
  refs.importPreviewFileName.textContent = String(preview.file_name || "");
  refs.importPreviewFileType.textContent = String(preview.file_ext || "").toUpperCase();
  refs.importPreviewChapterCount.textContent = String(metadata.chapter_count || 0);
  refs.importPreviewDetectedLang.textContent = String(metadata.detected_lang || metadata.lang_source || "-").trim() || "-";
  refs.importPreviewBookTitleInput.value = String(metadata.title || "");
  refs.importPreviewAuthorInput.value = String(metadata.author || "");
  refs.importPreviewSummaryInput.value = String(metadata.summary || "");
  refs.importPreviewLangSelect.value = String(metadata.lang_source || "zh").trim().toLowerCase() === "vi" ? "vi" : "zh";

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

async function handlePrepareImport() {
  const fileInput = document.getElementById("import-file");
  const file = fileInput && fileInput.files && fileInput.files[0];
  if (!file) return;

  const form = new FormData();
  form.set("file", file, file.name || "import.txt");
  form.set("lang_source", (document.getElementById("import-lang") && document.getElementById("import-lang").value) || "zh");
  form.set("title", (document.getElementById("import-book-title") && document.getElementById("import-book-title").value) || "");
  form.set("author", (document.getElementById("import-author") && document.getElementById("import-author").value) || "");
  form.set("import_settings", JSON.stringify(state.importSettings || {}));

  state.shell.showStatus(state.shell.t("statusPreparingImport"));
  try {
    const data = await state.shell.api("/api/library/import/prepare", { method: "POST", body: form });
    state.importPreviewToken = String((data && data.token) || "").trim();
    if (document.getElementById("import-dialog") && document.getElementById("import-dialog").open) {
      document.getElementById("import-dialog").close();
    }
    renderImportPreview(data && data.preview ? data.preview : null);
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function commitPreparedImport() {
  if (!state.importPreviewToken) return;
  const payload = collectImportPreviewPayload();
  const pending = buildPendingImportRecord();
  const token = String(state.importPreviewToken || "").trim();
  state.importPreviewToken = "";
  if (refs.importPreviewDialog && refs.importPreviewDialog.open) refs.importPreviewDialog.close();
  addPendingImport(pending);
  try {
    const data = await state.shell.api("/api/library/import/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, token }),
    });
    const importForm = document.getElementById("import-form");
    if (importForm) importForm.reset();
    const bid = String((data && data.book && data.book.book_id) || "").trim();
    if (bid) pending.resolved_book_id = bid;
    state.shell.showToast(state.shell.t("toastImportSuccess"));
    await loadLibraryData();
    removePendingImport(pending.temp_id);
  } catch (error) {
    state.importPreviewToken = token;
    removePendingImport(pending.temp_id);
    if (refs.importPreviewDialog && !refs.importPreviewDialog.open) refs.importPreviewDialog.showModal();
    state.shell.showToast(getErrorMessage(error));
  }
}

async function handleImportUrlPrepare({ url, pluginId, resetForm, closeDialog }) {
  const pending = buildPendingUrlImportRecord({ url, pluginId });
  closeDialog();
  resetForm();
  addPendingImport(pending);
  try {
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
      removePendingImport(pending.temp_id);
      state.shell.showToast(state.shell.t("toastImportUrlExisting"));
      await loadLibraryData({ silent: true });
      return;
    }

    const preview = (prepared && prepared.preview) || {};
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
    await loadLibraryData({ silent: true });
    removePendingImport(pending.temp_id);
  } catch (error) {
    removePendingImport(pending.temp_id);
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
  if (item.cover_url) {
    const img = document.createElement("img");
    img.src = item.cover_url;
    img.alt = normalizeDisplayTitle(item.title || state.shell.t("importPendingUrlTitle"));
    cover.appendChild(img);
  } else {
    const coverText = document.createElement("div");
    coverText.className = "book-card-cover-text";
    coverText.textContent = item.import_kind === "url" ? "URL" : (item.file_ext || "TXT");
    cover.appendChild(coverText);
  }

  const body = document.createElement("div");
  const title = document.createElement("div");
  title.className = "book-card-title";
  title.textContent = normalizeDisplayTitle(item.title || state.shell.t("importPendingUrlTitle"));

  const author = document.createElement("div");
  author.className = "book-card-meta";
  author.textContent = item.author || state.shell.t("unknownAuthor");

  const source = document.createElement("div");
  source.className = "book-card-source";
  source.textContent = String(item.source_label || `${state.shell.t("importPendingSource")} • ${item.file_ext || "TXT"}`);

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

function renderBooks() {
  refs.libraryGrid.innerHTML = "";
  const visiblePending = state.pendingImports.filter((item) => {
    const resolvedBookId = String((item && item.resolved_book_id) || "").trim();
    if (!resolvedBookId) return true;
    return !state.books.some((book) => String((book && book.book_id) || "").trim() === resolvedBookId);
  });
  const totalCount = state.books.length + visiblePending.length;
  refs.libraryCount.textContent = state.shell.t("libraryCount", { count: totalCount });

  if (!totalCount) {
    refs.libraryEmpty.classList.remove("hidden");
    refs.libraryEmpty.textContent = state.shell.t("libraryEmpty");
    return;
  }

  refs.libraryEmpty.classList.add("hidden");

  for (const pending of visiblePending) {
    refs.libraryGrid.appendChild(renderPendingImportCard(pending));
  }

  for (const book of state.books) {
    const card = document.createElement("article");
    card.className = "book-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    const cover = document.createElement("div");
    cover.className = "book-card-cover";
    if (book.cover_url) {
      const img = document.createElement("img");
      img.src = book.cover_url;
      img.alt = book.title_display || book.title || "Ảnh bìa";
      cover.appendChild(img);
    } else {
      const txt = document.createElement("div");
      txt.className = "book-card-cover-text";
      txt.textContent = state.shell.t("noCover");
      cover.appendChild(txt);
    }

    const body = document.createElement("div");
    const title = document.createElement("div");
    title.className = "book-card-title";
    title.textContent = normalizeDisplayTitle(book.title_display || book.title || "Không tiêu đề");

    const author = document.createElement("div");
    author.className = "book-card-meta";
    author.textContent = book.author_display || book.author || "Khuyết danh";

    const sourceLabel = buildSourceLabel(book);
    let source = null;
    if (sourceLabel) {
      source = document.createElement("div");
      source.className = "book-card-source";
      source.textContent = sourceLabel;
    }

    const infoRow = document.createElement("div");
    infoRow.className = "book-card-progress-row";

    const ch = document.createElement("div");
    ch.className = "book-card-chapter";
    ch.textContent = normalizeDisplayTitle(book.current_chapter_title_display || book.current_chapter_title || "Chương 1");

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

    if (source) {
      body.append(title, author, source, infoRow, dl);
    } else {
      body.append(title, author, infoRow, dl);
    }
    card.append(cover, body);
    card.addEventListener("click", () => openActions(book.book_id));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openActions(book.book_id);
      }
    });

    refs.libraryGrid.appendChild(card);
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
    if (item.cover_url) {
      const img = document.createElement("img");
      img.src = item.cover_url;
      img.alt = item.title || "Ảnh bìa";
      cover.appendChild(img);
    } else {
      const txt = document.createElement("div");
      txt.className = "book-card-cover-text";
      txt.textContent = state.shell.t("noCover");
      cover.appendChild(txt);
    }

    const body = document.createElement("div");
    const title = document.createElement("div");
    title.className = "book-card-title";
    title.textContent = normalizeDisplayTitle(item.title || "Không tiêu đề");

    const author = document.createElement("div");
    author.className = "book-card-meta";
    author.textContent = item.author || "Khuyết danh";

    const source = document.createElement("div");
    source.className = "book-card-source";
    source.textContent = buildHistorySourceLabel(item);

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
    if (targetChapter && targetChapter.chapter_id) {
      await state.shell.api(`/api/library/book/${encodeURIComponent(bid)}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter_id: String(targetChapter.chapter_id || ""),
          ratio,
          mode: "raw",
        }),
      });
    }
    window.location.href = `/reader?book_id=${encodeURIComponent(bid)}`;
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function importHistoryItem(item) {
  const sourceUrl = String((item && item.source_url) || "").trim();
  if (!sourceUrl) return;
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
    const bid = data && data.book && data.book.book_id;
    if (bid) {
      window.location.href = `/book?book_id=${encodeURIComponent(bid)}`;
      return;
    }
    await loadLibraryData();
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function deleteHistoryItem(historyId) {
  const hid = String(historyId || "").trim();
  if (!hid) return;
  try {
    await state.shell.api(`/api/library/history/${encodeURIComponent(hid)}`, { method: "DELETE" });
    await loadLibraryData();
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  }
}

async function loadLibraryData({ silent = false } = {}) {
  if (!silent) state.shell.showStatus(state.shell.t("statusLoadingBooks"));
  try {
    const [booksData, historyData] = await Promise.all([
      state.shell.api("/api/library/books"),
      state.shell.api("/api/library/history"),
    ]);
    state.books = booksData.items || [];
    state.historyItems = historyData.items || [];
    renderHistory();
    renderBooks();
  } catch (error) {
    if (!silent) state.shell.showToast(getErrorMessage(error));
  } finally {
    if (!silent) state.shell.hideStatus();
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
        await Promise.all([loadDownloadJobs(), loadLibraryData()]);
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
  const nextItems = Array.isArray(payload && payload.items) ? payload.items : [];
  state.downloadJobs = nextItems;
  const nextSig = buildDownloadJobsSignature(nextItems);
  const changed = nextSig !== state.downloadJobsSig;
  state.downloadJobsSig = nextSig;
  renderDownloadJobs();
  if (!syncLibrary) return;

  const now = Date.now();
  const hasActive = state.downloadJobs.length > 0;
  const shouldRefresh = changed || (hasActive && (now - state.lastLibraryRefreshTs >= 2800));
  if (!shouldRefresh || state.libraryRefreshBusy) return;
  state.libraryRefreshBusy = true;
  try {
    await loadLibraryData({ silent: true });
    state.lastLibraryRefreshTs = Date.now();
  } finally {
    state.libraryRefreshBusy = false;
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
      applyDownloadJobsPayload(payload || { items: [] }, { syncLibrary: true }).catch(() => {});
    });
    stream.onmessage = (event) => {
      let payload = null;
      try {
        payload = JSON.parse(event.data || "{}");
      } catch {
        payload = null;
      }
      if (!payload || !Array.isArray(payload.items)) return;
      applyDownloadJobsPayload(payload, { syncLibrary: true }).catch(() => {});
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
    loadDownloadJobs({ syncLibrary: true }).catch(() => {});
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
    } else {
      state.shell.showToast(state.shell.t("downloadQueued"));
    }
    await Promise.all([loadDownloadJobs(), loadLibraryData()]);
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

function getCurrentTranslationMode() {
  return (typeof state.shell.getTranslationMode === "function" ? state.shell.getTranslationMode() : state.translationMode) || "server";
}

function buildExportFormats(book) {
  const isComic = Boolean(book && book.is_comic);
  const isZh = Boolean(book && !isComic && String(book.lang_source || "").toLowerCase().startsWith("zh"));
  const opt = (key, code, labelKey, defaultEnabled) => ({ key, code, labelKey, defaultEnabled: Boolean(defaultEnabled) });
  if (isComic) {
    return {
      defaultFormat: "epub",
      formats: [
        {
          id: "epub",
          label: "EPUB",
          options: [
            opt("include_intro", "1b", "exportOptionIntro", true),
            opt("include_chapter_titles", "3b", "exportOptionChapterTitles", true),
            opt("include_toc_page", "4b", "exportOptionToc", true),
          ],
        },
        {
          id: "html",
          label: "HTML",
          options: [
            opt("include_intro", "1b", "exportOptionIntro", true),
            opt("merge_single_file", "2", "exportOptionMerge", false),
            opt("include_chapter_titles", "3b", "exportOptionChapterTitles", true),
            opt("include_toc_page", "4b", "exportOptionToc", true),
          ],
        },
        { id: "cbz", label: "CBZ", options: [] },
      ],
    };
  }
  const htmlOptions = [
    opt("include_intro", "1b", "exportOptionIntro", true),
    opt("merge_single_file", "2b", "exportOptionMerge", true),
    opt("include_chapter_titles", "3b", "exportOptionChapterTitles", true),
    opt("include_toc_page", "4", "exportOptionToc", false),
  ];
  const txtOptions = [
    opt("merge_single_file", "2b", "exportOptionMerge", true),
    opt("include_chapter_titles", "3b", "exportOptionChapterTitles", true),
  ];
  const epubOptions = [
    opt("include_intro", "1b", "exportOptionIntro", true),
    opt("include_chapter_titles", "3b", "exportOptionChapterTitles", true),
    opt("include_toc_page", "4", "exportOptionToc", false),
  ];
  if (isZh) {
    htmlOptions.push(opt("use_translated_text", "5b", "exportOptionTranslatedText", true));
    txtOptions.push(opt("use_translated_text", "5b", "exportOptionTranslatedText", true));
    epubOptions.push(opt("use_translated_text", "5b", "exportOptionTranslatedText", true));
  }
  return {
    defaultFormat: "txt",
    formats: [
      { id: "txt", label: "TXT", options: txtOptions },
      { id: "epub", label: "EPUB", options: epubOptions },
      { id: "html", label: "HTML", options: htmlOptions },
    ],
  };
}

function currentExportFormatSpec() {
  const formatId = String((refs.exportFormatSelect && refs.exportFormatSelect.value) || "").trim().toLowerCase();
  return (state.exportFormats || []).find((item) => String(item.id || "").trim().toLowerCase() === formatId) || null;
}

function closeExportDialog() {
  if (refs.exportDialog && refs.exportDialog.open) refs.exportDialog.close();
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
    const row = document.createElement("label");
    row.className = "checkbox-row export-option-row";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(option.defaultEnabled);
    checkbox.dataset.optionKey = String(option.key || "");
    const text = document.createElement("span");
    const code = String(option.code || "").trim();
    const label = state.shell.t(String(option.labelKey || ""));
    text.textContent = code ? `${code} • ${label}` : label;
    row.append(checkbox, text);
    refs.exportOptionsList.appendChild(row);
  }
}

function renderExportChapterList(book) {
  if (!refs.exportChapterList) return;
  refs.exportChapterList.innerHTML = "";
  const chapters = Array.isArray(book && book.chapters) ? book.chapters : [];
  const downloaded = chapters.filter((item) => Boolean(item && item.is_downloaded)).length;
  if (refs.exportChapterStats) {
    refs.exportChapterStats.textContent = state.shell.t("downloadedCountShort", {
      downloaded,
      total: chapters.length,
    });
  }
  if (!chapters.length) {
    const empty = document.createElement("p");
    empty.className = "empty-text";
    empty.textContent = state.shell.t("tocNoData");
    refs.exportChapterList.appendChild(empty);
    return;
  }
  for (const chapter of chapters) {
    const row = document.createElement("div");
    row.className = "export-chapter-row";
    const title = document.createElement("div");
    title.className = "export-chapter-title";
    title.textContent = `${chapter.chapter_order || "?"}. ${chapter.title_display || chapter.title_raw || ""}`;
    const meta = document.createElement("div");
    meta.className = "export-chapter-meta";
    meta.textContent = chapter.is_downloaded
      ? state.shell.t("downloadedTag")
      : state.shell.t("exportNotDownloaded");
    row.append(title, meta);
    if (chapter.is_downloaded) row.classList.add("is-downloaded");
    refs.exportChapterList.appendChild(row);
  }
}

function renderExportCover(book) {
  if (!refs.exportCover) return;
  refs.exportCover.innerHTML = "";
  const coverUrl = String((book && book.cover_url) || "").trim();
  if (coverUrl) {
    const img = document.createElement("img");
    img.src = coverUrl;
    img.alt = normalizeDisplayTitle(book && (book.title_display || book.title) || state.shell.t("noCover"));
    refs.exportCover.appendChild(img);
    return;
  }
  refs.exportCover.textContent = state.shell.t("noCover");
}

function renderExportDialog(book) {
  state.exportBookDetail = book || null;
  const exportInfo = buildExportFormats(book || {});
  state.exportFormats = exportInfo.formats || [];
  if (refs.exportFormatSelect) {
    refs.exportFormatSelect.innerHTML = "";
    for (const format of state.exportFormats) {
      const option = document.createElement("option");
      option.value = String(format.id || "");
      option.textContent = String(format.label || format.id || "");
      refs.exportFormatSelect.appendChild(option);
    }
    refs.exportFormatSelect.value = String(exportInfo.defaultFormat || ((state.exportFormats[0] || {}).id || ""));
  }
  if (refs.exportDialogTitle) refs.exportDialogTitle.textContent = state.shell.t("exportDialogTitle");
  if (refs.exportDialogSubtitle) {
    refs.exportDialogSubtitle.textContent = `${book.title_display || book.title || ""} • ${book.author_display || book.author || state.shell.t("unknownAuthor")}`;
  }
  if (refs.exportMetaTitle) refs.exportMetaTitle.value = String(book.title_display || book.title || "");
  if (refs.exportMetaAuthor) refs.exportMetaAuthor.value = String(book.author_display || book.author || "");
  if (refs.exportMetaSummary) refs.exportMetaSummary.value = String(book.summary_display || book.summary || "");
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
  if (refs.exportUseCachedOnly) refs.exportUseCachedOnly.checked = false;
  renderExportCover(book);
  renderExportOptions();
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
  const options = {};
  for (const checkbox of Array.from(refs.exportOptionsList.querySelectorAll("input[data-option-key]"))) {
    options[String(checkbox.dataset.optionKey || "")] = Boolean(checkbox.checked);
  }
  state.shell.showStatus(state.shell.t("statusExporting"));
  try {
    const payload = await state.shell.api(`/api/library/book/${encodeURIComponent(state.selectedBookId)}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: spec.id,
        translation_mode: getCurrentTranslationMode(),
        use_cached_only: Boolean(refs.exportUseCachedOnly && refs.exportUseCachedOnly.checked),
        metadata: {
          title: String((refs.exportMetaTitle && refs.exportMetaTitle.value) || "").trim(),
          author: String((refs.exportMetaAuthor && refs.exportMetaAuthor.value) || "").trim(),
          summary: String((refs.exportMetaSummary && refs.exportMetaSummary.value) || "").trim(),
        },
        options,
      }),
    });
    closeExportDialog();
    if (payload.download_url) {
      const link = document.createElement("a");
      link.href = payload.download_url;
      if (payload.file_name) link.download = String(payload.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  } catch (error) {
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function deleteBook() {
  if (!state.selectedBookId) return;
  closeActions();
  if (!window.confirm(state.shell.t("confirmDeleteBook"))) return;
  try {
    await state.shell.api(`/api/library/book/${encodeURIComponent(state.selectedBookId)}`, { method: "DELETE" });
    state.shell.showToast(state.shell.t("toastBookDeleted"));
    await loadLibraryData();
  } catch (error) {
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
      const bid = data && data.book && data.book.book_id;
      if (bid) {
        window.location.href = `/book?book_id=${encodeURIComponent(bid)}`;
        return;
      }
      loadLibraryData();
    },
  });
  state.translationEnabled = typeof state.shell.getTranslationEnabled === "function"
    ? state.shell.getTranslationEnabled()
    : true;
  state.translationMode = typeof state.shell.getTranslationMode === "function"
    ? state.shell.getTranslationMode()
    : "server";

  refs.historyTitle.textContent = state.shell.t("historyTitle");
  refs.libraryTitle.textContent = state.shell.t("libraryTitle");

  refs.bookActionsTitle.textContent = state.shell.t("bookActionsTitle");
  refs.btnCloseBookActions.textContent = state.shell.t("close");
  refs.btnActionOpenBook.textContent = state.shell.t("openBookInfo");
  refs.btnActionOpenReader.textContent = state.shell.t("openReader");
  if (refs.btnActionCheckUpdates) refs.btnActionCheckUpdates.textContent = state.shell.t("checkBookUpdates");
  if (refs.btnActionDownload) refs.btnActionDownload.textContent = state.shell.t("downloadBook");
  if (refs.btnActionExport) refs.btnActionExport.textContent = state.shell.t("exportBook");
  refs.btnActionDeleteBook.textContent = state.shell.t("deleteBook");
  if (refs.exportDialogTitle) refs.exportDialogTitle.textContent = state.shell.t("exportDialogTitle");
  if (refs.btnCloseExportDialog) refs.btnCloseExportDialog.textContent = state.shell.t("close");
  if (refs.btnCancelExportDialog) refs.btnCancelExportDialog.textContent = state.shell.t("cancel");
  if (refs.btnSubmitExportDialog) refs.btnSubmitExportDialog.textContent = state.shell.t("exportSubmit");
  if (refs.exportMetaTitleLabel) refs.exportMetaTitleLabel.textContent = state.shell.t("fieldTitle");
  if (refs.exportMetaAuthorLabel) refs.exportMetaAuthorLabel.textContent = state.shell.t("fieldAuthor");
  if (refs.exportMetaSummaryLabel) refs.exportMetaSummaryLabel.textContent = state.shell.t("fieldSummary");
  if (refs.exportFormatLabel) refs.exportFormatLabel.textContent = state.shell.t("exportFormat");
  if (refs.exportUseCachedOnlyLabel) refs.exportUseCachedOnlyLabel.textContent = state.shell.t("exportCachedOnly");
  if (refs.exportChaptersTitle) refs.exportChaptersTitle.textContent = state.shell.t("tocTitle");
  if (refs.btnOpenGlobalDicts) refs.btnOpenGlobalDicts.textContent = state.shell.t("globalDictsButton");
  if (refs.downloadJobsTitle) refs.downloadJobsTitle.textContent = state.shell.t("downloadJobsTitle");
  if (refs.downloadJobsEmpty) refs.downloadJobsEmpty.textContent = state.shell.t("downloadJobsEmpty");

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
  refs.btnActionOpenBook.addEventListener("click", () => {
    if (!state.selectedBookId) return;
    closeActions();
    window.location.href = `/book?book_id=${encodeURIComponent(state.selectedBookId)}`;
  });
  refs.btnActionOpenReader.addEventListener("click", () => {
    if (!state.selectedBookId) return;
    closeActions();
    window.location.href = `/reader?book_id=${encodeURIComponent(state.selectedBookId)}`;
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
  if (refs.exportFormatSelect) refs.exportFormatSelect.addEventListener("change", renderExportOptions);
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

  window.addEventListener("reader-settings-changed", () => {
    const enabled = typeof state.shell.getTranslationEnabled === "function"
      ? state.shell.getTranslationEnabled()
      : true;
    const mode = typeof state.shell.getTranslationMode === "function"
      ? state.shell.getTranslationMode()
      : "server";
    const localSig = localTranslationSettingsSignature(state.shell);
    const localChanged = localSig !== state.translationLocalSig;
    if (enabled === state.translationEnabled && mode === state.translationMode && !(["local", "hanviet"].includes(mode) && localChanged)) return;
    state.translationEnabled = enabled;
    state.translationMode = mode;
    state.translationLocalSig = localSig;
    loadLibraryData().catch(() => {});
  });

  window.addEventListener("reader-cache-changed", () => {
    loadLibraryData({ silent: true }).catch(() => {});
    loadDownloadJobs({ syncLibrary: false }).catch(() => {});
  });

  window.addEventListener("beforeunload", () => {
    clearDownloadWatcher();
  });

  state.translationLocalSig = localTranslationSettingsSignature(state.shell);
  await Promise.all([loadImportSettings({ silent: true }).catch(() => null), loadLibraryData(), loadDownloadJobs({ syncLibrary: false })]);
  startDownloadPolling();
}

init();
