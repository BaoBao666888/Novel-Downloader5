import { initShell } from "../site_common.js?v=20260307-imp1";
import { normalizeDisplayTitle } from "../reader_text.js?v=20260215-vb01";

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
  btnActionExportTxt: document.getElementById("btn-action-export-txt"),
  btnActionExportEpub: document.getElementById("btn-action-export-epub"),
  btnActionDeleteBook: document.getElementById("btn-action-delete-book"),

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
  importPreviewTargetSizeInput: document.getElementById("import-preview-target-size-input"),
  importPreviewPrefaceTitleInput: document.getElementById("import-preview-preface-title-input"),
  importPreviewHeadingPatternsInput: document.getElementById("import-preview-heading-patterns-input"),
  importPreviewHeadingPresets: document.getElementById("import-preview-heading-presets"),
  importPreviewEpubTitleKeysInput: document.getElementById("import-preview-epub-title-keys-input"),
  importPreviewEpubAuthorKeysInput: document.getElementById("import-preview-epub-author-keys-input"),
  importPreviewEpubSummaryKeysInput: document.getElementById("import-preview-epub-summary-keys-input"),
  importPreviewEpubLanguageKeysInput: document.getElementById("import-preview-epub-language-keys-input"),
  importPreviewEpubCoverMetaInput: document.getElementById("import-preview-epub-cover-meta-input"),
  importPreviewEpubCoverPropsInput: document.getElementById("import-preview-epub-cover-props-input"),
  importPreviewEpubPresets: document.getElementById("import-preview-epub-presets"),
  importPreviewDiagnostics: document.getElementById("import-preview-diagnostics"),
  importPreviewMetadataCandidates: document.getElementById("import-preview-metadata-candidates"),
  importPreviewChapters: document.getElementById("import-preview-chapters"),
};

const state = {
  historyItems: [],
  books: [],
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
  importPreviewSeq: 0,
  importPreviewDebounceTimer: 0,
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

function previewImportInputs() {
  return {
    targetSize: refs.importPreviewTargetSizeInput,
    prefaceTitle: refs.importPreviewPrefaceTitleInput,
    headingPatterns: refs.importPreviewHeadingPatternsInput,
    epubTitleKeys: refs.importPreviewEpubTitleKeysInput,
    epubAuthorKeys: refs.importPreviewEpubAuthorKeysInput,
    epubSummaryKeys: refs.importPreviewEpubSummaryKeysInput,
    epubLanguageKeys: refs.importPreviewEpubLanguageKeysInput,
    epubCoverMeta: refs.importPreviewEpubCoverMetaInput,
    epubCoverProps: refs.importPreviewEpubCoverPropsInput,
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
  renderPresetChipList(refs.importPreviewHeadingPresets, txtItems, (item) => {
    addTextareaValue(refs.importPreviewHeadingPatternsInput, String(item.pattern || "").trim());
    scheduleImportPreviewRefresh();
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
  const applyEpubPreviewPreset = (targetField, value) => {
    const map = {
      title_keys: refs.importPreviewEpubTitleKeysInput,
      author_keys: refs.importPreviewEpubAuthorKeysInput,
      summary_keys: refs.importPreviewEpubSummaryKeysInput,
      language_keys: refs.importPreviewEpubLanguageKeysInput,
      cover_meta_names: refs.importPreviewEpubCoverMetaInput,
      cover_properties: refs.importPreviewEpubCoverPropsInput,
    };
    addTextareaValue(map[targetField], value);
    scheduleImportPreviewRefresh();
  };
  renderPresetChipList(refs.importEpubPresets, epubFieldGroups, (item) => applyEpubPreset(item.field, item.value));
  renderPresetChipList(refs.importPreviewEpubPresets, epubFieldGroups, (item) => applyEpubPreviewPreset(item.field, item.value));
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
  const metadata = preview.metadata || {};
  refs.importPreviewFileName.textContent = String(preview.file_name || "");
  refs.importPreviewFileType.textContent = String(preview.file_ext || "").toUpperCase();
  refs.importPreviewChapterCount.textContent = String(metadata.chapter_count || 0);
  refs.importPreviewDetectedLang.textContent = String(metadata.detected_lang || metadata.lang_source || "-").trim() || "-";
  refs.importPreviewBookTitleInput.value = String(metadata.title || "");
  refs.importPreviewAuthorInput.value = String(metadata.author || "");
  refs.importPreviewSummaryInput.value = String(metadata.summary || "");
  refs.importPreviewLangSelect.value = String(metadata.lang_source || "zh").trim().toLowerCase() === "vi" ? "vi" : "zh";
  applyImportSettingsToInputs(preview.import_settings || state.importSettings || {}, previewImportInputs());
  renderImportPresetButtons();

  const diagnostics = preview.diagnostics || {};
  const splitStrategy = String(diagnostics.split_strategy || "").trim();
  const strategyLabel = splitStrategy === "regex"
    ? state.shell.t("importSplitStrategyRegex")
    : state.shell.t("importSplitStrategyFallback");
  refs.importPreviewDiagnostics.textContent = state.shell.t("importPreviewDiagnostics", {
    strategy: strategyLabel,
    count: Number(diagnostics.matched_heading_count || 0),
  });
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
    import_settings: collectImportSettingsFromInputs(previewImportInputs()),
  };
}

async function refreshImportPreview() {
  const token = String(state.importPreviewToken || "").trim();
  if (!token) return;
  const seq = ++state.importPreviewSeq;
  try {
    const data = await state.shell.api("/api/library/import/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectImportPreviewPayload()),
    });
    if (seq !== state.importPreviewSeq) return;
    renderImportPreview(data && data.preview ? data.preview : null);
  } catch (error) {
    if (seq !== state.importPreviewSeq) return;
    state.shell.showToast(getErrorMessage(error));
  }
}

function scheduleImportPreviewRefresh() {
  if (state.importPreviewDebounceTimer) {
    window.clearTimeout(state.importPreviewDebounceTimer);
  }
  state.importPreviewDebounceTimer = window.setTimeout(() => {
    state.importPreviewDebounceTimer = 0;
    refreshImportPreview().catch(() => {});
  }, 350);
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
  state.shell.showStatus(state.shell.t("statusImporting"));
  try {
    const data = await state.shell.api("/api/library/import/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectImportPreviewPayload()),
    });
    state.importPreviewToken = "";
    if (refs.importPreviewDialog && refs.importPreviewDialog.open) refs.importPreviewDialog.close();
    const importForm = document.getElementById("import-form");
    if (importForm) importForm.reset();
    state.shell.showToast(state.shell.t("toastImportSuccess"));
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
  if (refs.btnActionExportTxt) refs.btnActionExportTxt.disabled = Boolean(book.is_comic);
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
  if (!refs.bookActionsDialog.open) {
    refs.bookActionsDialog.showModal();
  }
}

function renderBooks() {
  refs.libraryGrid.innerHTML = "";
  refs.libraryCount.textContent = state.shell.t("libraryCount", { count: state.books.length });

  if (!state.books.length) {
    refs.libraryEmpty.classList.remove("hidden");
    refs.libraryEmpty.textContent = state.shell.t("libraryEmpty");
    return;
  }

  refs.libraryEmpty.classList.add("hidden");

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

async function exportBook(format) {
  if (!state.selectedBookId) return;
  closeActions();
  const book = state.books.find((x) => x.book_id === state.selectedBookId) || null;
  const fmt = String(format || "txt").trim().toLowerCase();
  if (fmt === "txt" && book && book.is_comic) {
    state.shell.showToast(state.shell.t("comicExportTxtNotSupported"));
    return;
  }
  const ensureTranslated = (book && book.is_comic)
    ? false
    : window.confirm(state.shell.t("ensureTranslate"));
  const fetchMissing = window.confirm(state.shell.t("exportFetchMissingPrompt"));
  const useCachedOnly = !fetchMissing;
  state.shell.showStatus(state.shell.t("statusExporting"));
  try {
    const payload = await state.shell.api(`/api/library/book/${encodeURIComponent(state.selectedBookId)}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: fmt,
        ensure_translated: ensureTranslated,
        translation_mode: "server",
        use_cached_only: useCachedOnly,
      }),
    });
    if (payload.download_url) {
      window.open(payload.download_url, "_blank", "noopener,noreferrer");
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
  refs.btnActionExportTxt.textContent = state.shell.t("exportTxt");
  refs.btnActionExportEpub.textContent = state.shell.t("exportEpub");
  refs.btnActionDeleteBook.textContent = state.shell.t("deleteBook");
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
  refs.btnActionExportTxt.addEventListener("click", () => exportBook("txt"));
  refs.btnActionExportEpub.addEventListener("click", () => exportBook("epub"));
  refs.btnActionDeleteBook.addEventListener("click", deleteBook);
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

  [
    refs.importPreviewTargetSizeInput,
    refs.importPreviewPrefaceTitleInput,
    refs.importPreviewHeadingPatternsInput,
    refs.importPreviewEpubTitleKeysInput,
    refs.importPreviewEpubAuthorKeysInput,
    refs.importPreviewEpubSummaryKeysInput,
    refs.importPreviewEpubLanguageKeysInput,
    refs.importPreviewEpubCoverMetaInput,
    refs.importPreviewEpubCoverPropsInput,
  ].forEach((node) => {
    if (!node) return;
    node.addEventListener("input", scheduleImportPreviewRefresh);
    node.addEventListener("change", scheduleImportPreviewRefresh);
  });

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
