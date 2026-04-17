import { initShell } from "../site_common.js?v=20260417-notify1";
import { normalizeDisplayTitle, normalizeParagraphDisplayText } from "../reader_text.js?v=20260307-br2";
import { downloadPlainTextFile, parseNameSetText, serializeNameSetText } from "../name_set_text.js?v=20260405-name1";

const refs = {
  bookInfoTitle: document.getElementById("book-info-title"),
  bookEmpty: document.getElementById("book-empty"),
  bookViewSkeleton: document.getElementById("book-view-skeleton"),
  bookViewWrap: document.getElementById("book-view-wrap"),
  bookCover: document.getElementById("book-cover"),
  bookTitleDisplay: document.getElementById("book-title-display"),
  bookSubtitle: document.getElementById("book-subtitle"),
  bookCategoriesRow: document.getElementById("book-categories-row"),
  bookCategoriesLabel: document.getElementById("book-categories-label"),
  bookCategoriesList: document.getElementById("book-categories-list"),
  btnBookCategoriesEdit: document.getElementById("btn-book-categories-edit"),
  btnOpenExtraLink: document.getElementById("btn-open-extra-link"),
  btnOpenReaderFromBook: document.getElementById("btn-open-reader-from-book"),
  btnDownloadBook: document.getElementById("btn-download-book"),
  btnBookNameFilter: document.getElementById("btn-book-name-filter"),
  btnOpenBookNames: document.getElementById("btn-open-book-names"),
  btnOpenBookEdit: document.getElementById("btn-open-book-edit"),

  labelViewTitle: document.getElementById("label-view-title"),
  labelViewTitleVi: document.getElementById("label-view-title-vi"),
  labelViewAuthor: document.getElementById("label-view-author"),
  labelViewAuthorVi: document.getElementById("label-view-author-vi"),
  labelViewSummary: document.getElementById("label-view-summary"),
  labelViewExtraLink: document.getElementById("label-view-extra-link"),
  labelViewSourceDetail: document.getElementById("label-view-source-detail"),
  labelViewSourceFields: document.getElementById("label-view-source-fields"),
  viewTitle: document.getElementById("view-title"),
  viewTitleVi: document.getElementById("view-title-vi"),
  viewAuthor: document.getElementById("view-author"),
  viewAuthorVi: document.getElementById("view-author-vi"),
  viewSummary: document.getElementById("view-summary"),
  viewExtraLink: document.getElementById("view-extra-link"),
  viewSourceDetailItem: document.getElementById("view-source-detail-item"),
  viewSourceFieldsItem: document.getElementById("view-source-fields-item"),
  viewSourceDetail: document.getElementById("view-source-detail"),
  viewSourceFields: document.getElementById("view-source-fields"),

  tocTitle: document.getElementById("toc-title"),
  btnTocModeRaw: document.getElementById("btn-toc-mode-raw"),
  btnTocModeTrans: document.getElementById("btn-toc-mode-trans"),
  btnTranslateTitles: document.getElementById("btn-translate-titles"),
  btnRefreshBookToc: document.getElementById("btn-refresh-book-toc"),
  tocSkeleton: document.getElementById("toc-skeleton"),
  tocList: document.getElementById("toc-list"),
  btnTocPrev: document.getElementById("btn-toc-prev"),
  tocPageSelect: document.getElementById("toc-page-select"),
  btnTocNext: document.getElementById("btn-toc-next"),

  bookEditDialog: document.getElementById("book-edit-dialog"),
  bookEditTitle: document.getElementById("book-edit-title"),
  btnCloseBookEdit: document.getElementById("btn-close-book-edit"),
  bookMetaForm: document.getElementById("book-meta-form"),
  labelFieldTitle: document.getElementById("label-field-title"),
  labelFieldTitleVi: document.getElementById("label-field-title-vi"),
  labelFieldAuthor: document.getElementById("label-field-author"),
  labelFieldAuthorVi: document.getElementById("label-field-author-vi"),
  labelFieldSummary: document.getElementById("label-field-summary"),
  labelFieldExtraLink: document.getElementById("label-field-extra-link"),
  labelFieldCoverUrl: document.getElementById("label-field-cover-url"),
  fieldTitle: document.getElementById("field-title"),
  fieldTitleVi: document.getElementById("field-title-vi"),
  fieldAuthor: document.getElementById("field-author"),
  fieldAuthorVi: document.getElementById("field-author-vi"),
  fieldSummary: document.getElementById("field-summary"),
  fieldExtraLink: document.getElementById("field-extra-link"),
  fieldCoverUrl: document.getElementById("field-cover-url"),
  coverUploadInput: document.getElementById("cover-upload-input"),
  btnUploadCover: document.getElementById("btn-upload-cover"),
  btnApplyCoverUrl: document.getElementById("btn-apply-cover-url"),
  btnSaveMeta: document.getElementById("btn-save-meta"),

  bookNameDialog: document.getElementById("book-name-dialog"),
  bookNameTitle: document.getElementById("book-name-title"),
  btnCloseBookNames: document.getElementById("btn-close-book-names"),
  btnBookNameRefresh: document.getElementById("btn-book-name-refresh"),
  btnBookNameAddSet: document.getElementById("btn-book-name-add-set"),
  btnBookNameDelSet: document.getElementById("btn-book-name-del-set"),
  btnBookNameQuickAdd: document.getElementById("btn-book-name-quick-add"),
  btnBookNameExport: document.getElementById("btn-book-name-export"),
  btnBookNameImport: document.getElementById("btn-book-name-import"),
  bookNameImportFile: document.getElementById("book-name-import-file"),
  bookNameSetLabel: document.getElementById("book-name-set-label"),
  bookNameSetSelect: document.getElementById("book-name-set-select"),
  bookNameCount: document.getElementById("book-name-count"),
  bookNameEntryForm: document.getElementById("book-name-entry-form"),
  bookNameSource: document.getElementById("book-name-source"),
  bookNameTarget: document.getElementById("book-name-target"),
  btnBookNameSaveEntry: document.getElementById("btn-book-name-save-entry"),
  bookNameBody: document.getElementById("book-name-body"),
  bookNameBulkDialog: document.getElementById("book-name-bulk-dialog"),
  bookNameBulkTitle: document.getElementById("book-name-bulk-title"),
  btnCloseBookNameBulk: document.getElementById("btn-close-book-name-bulk"),
  bookNameBulkForm: document.getElementById("book-name-bulk-form"),
  bookNameBulkHint: document.getElementById("book-name-bulk-hint"),
  bookNameBulkInputLabel: document.getElementById("book-name-bulk-input-label"),
  bookNameBulkInput: document.getElementById("book-name-bulk-input"),
  btnCancelBookNameBulk: document.getElementById("btn-cancel-book-name-bulk"),
  btnConfirmBookNameBulk: document.getElementById("btn-confirm-book-name-bulk"),
  bookNameFilterDialog: document.getElementById("book-name-filter-dialog"),
  bookNameFilterTitle: document.getElementById("book-name-filter-title"),
  btnCloseBookNameFilter: document.getElementById("btn-close-book-name-filter"),
  bookNameFilterHint: document.getElementById("book-name-filter-hint"),
  bookNameFilterForm: document.getElementById("book-name-filter-form"),
  bookNameFilterScopeLabel: document.getElementById("book-name-filter-scope-label"),
  bookNameFilterScope: document.getElementById("book-name-filter-scope"),
  bookNameFilterFirstNWrap: document.getElementById("book-name-filter-first-n-wrap"),
  bookNameFilterFirstNLabel: document.getElementById("book-name-filter-first-n-label"),
  bookNameFilterFirstN: document.getElementById("book-name-filter-first-n"),
  bookNameFilterStartWrap: document.getElementById("book-name-filter-start-wrap"),
  bookNameFilterStartLabel: document.getElementById("book-name-filter-start-label"),
  bookNameFilterStart: document.getElementById("book-name-filter-start"),
  bookNameFilterEndWrap: document.getElementById("book-name-filter-end-wrap"),
  bookNameFilterEndLabel: document.getElementById("book-name-filter-end-label"),
  bookNameFilterEnd: document.getElementById("book-name-filter-end"),
  bookNameFilterMinCountLabel: document.getElementById("book-name-filter-min-count-label"),
  bookNameFilterMinCount: document.getElementById("book-name-filter-min-count"),
  bookNameFilterMinLengthLabel: document.getElementById("book-name-filter-min-length-label"),
  bookNameFilterMinLength: document.getElementById("book-name-filter-min-length"),
  bookNameFilterMaxLengthLabel: document.getElementById("book-name-filter-max-length-label"),
  bookNameFilterMaxLength: document.getElementById("book-name-filter-max-length"),
  bookNameFilterMaxItemsLabel: document.getElementById("book-name-filter-max-items-label"),
  bookNameFilterMaxItems: document.getElementById("book-name-filter-max-items"),
  bookNameFilterMaxChaptersLabel: document.getElementById("book-name-filter-max-chapters-label"),
  bookNameFilterMaxChapters: document.getElementById("book-name-filter-max-chapters"),
  bookNameFilterIncludeLabel: document.getElementById("book-name-filter-include-label"),
  bookNameFilterIncludePerson: document.getElementById("book-name-filter-include-person"),
  bookNameFilterIncludePersonLabel: document.getElementById("book-name-filter-include-person-label"),
  bookNameFilterIncludePlace: document.getElementById("book-name-filter-include-place"),
  bookNameFilterIncludePlaceLabel: document.getElementById("book-name-filter-include-place-label"),
  bookNameFilterIncludeTitle: document.getElementById("book-name-filter-include-title"),
  bookNameFilterIncludeTitleLabel: document.getElementById("book-name-filter-include-title-label"),
  bookNameFilterSkipExisting: document.getElementById("book-name-filter-skip-existing"),
  bookNameFilterSkipExistingLabel: document.getElementById("book-name-filter-skip-existing-label"),
  btnBookNameFilterRun: document.getElementById("btn-book-name-filter-run"),
  bookNameFilterSummary: document.getElementById("book-name-filter-summary"),
  bookNameFilterColSelect: document.getElementById("book-name-filter-col-select"),
  bookNameFilterColSource: document.getElementById("book-name-filter-col-source"),
  bookNameFilterColType: document.getElementById("book-name-filter-col-type"),
  bookNameFilterColTarget: document.getElementById("book-name-filter-col-target"),
  bookNameFilterColHv: document.getElementById("book-name-filter-col-hv"),
  bookNameFilterColMeta: document.getElementById("book-name-filter-col-meta"),
  bookNameFilterColContext: document.getElementById("book-name-filter-col-context"),
  bookNameFilterBody: document.getElementById("book-name-filter-body"),
  bookNameFilterSelectAll: document.getElementById("book-name-filter-select-all"),
  bookNameFilterSelectAllLabel: document.getElementById("book-name-filter-select-all-label"),
  btnBookNameFilterImport: document.getElementById("btn-book-name-filter-import"),
  bookNameSuggestDialog: document.getElementById("book-name-suggest-dialog"),
  bookNameSuggestTitle: document.getElementById("book-name-suggest-title"),
  btnCloseBookNameSuggest: document.getElementById("btn-close-book-name-suggest"),
  bookNameSuggestHint: document.getElementById("book-name-suggest-hint"),
  bookNameSuggestColIndex: document.getElementById("book-name-suggest-col-index"),
  bookNameSuggestColSource: document.getElementById("book-name-suggest-col-source"),
  bookNameSuggestColHv: document.getElementById("book-name-suggest-col-hv"),
  bookNameSuggestColTarget: document.getElementById("book-name-suggest-col-target"),
  bookNameSuggestColOrigin: document.getElementById("book-name-suggest-col-origin"),
  bookNameSuggestColAction: document.getElementById("book-name-suggest-col-action"),
  bookNameSuggestLeftBody: document.getElementById("book-name-suggest-left-body"),
  bookNameSuggestRightBody: document.getElementById("book-name-suggest-right-body"),
  btnBookNameSuggestGoogleTranslate: document.getElementById("btn-book-name-suggest-google-translate"),
  btnBookNameSuggestGoogleSearch: document.getElementById("btn-book-name-suggest-google-search"),

  bookReplaceDialog: document.getElementById("book-replace-dialog"),
  bookReplaceTitle: document.getElementById("book-replace-title"),
  btnCloseBookReplaces: document.getElementById("btn-close-book-replaces"),
  btnBookReplaceRefresh: document.getElementById("btn-book-replace-refresh"),
  bookReplaceHint: document.getElementById("book-replace-hint"),
  bookReplaceEntryForm: document.getElementById("book-replace-entry-form"),
  bookReplaceSourceLabel: document.getElementById("book-replace-source-label"),
  bookReplaceSource: document.getElementById("book-replace-source"),
  bookReplaceTargetLabel: document.getElementById("book-replace-target-label"),
  bookReplaceTarget: document.getElementById("book-replace-target"),
  bookReplaceRegexInput: document.getElementById("book-replace-regex-input"),
  bookReplaceRegexLabel: document.getElementById("book-replace-regex-label"),
  bookReplaceIgnoreCaseInput: document.getElementById("book-replace-ignore-case-input"),
  bookReplaceIgnoreCaseLabel: document.getElementById("book-replace-ignore-case-label"),
  btnBookReplaceSaveEntry: document.getElementById("btn-book-replace-save-entry"),
  bookReplacePreviewHint: document.getElementById("book-replace-preview-hint"),
  bookReplaceColSource: document.getElementById("book-replace-col-source"),
  bookReplaceColTarget: document.getElementById("book-replace-col-target"),
  bookReplaceColAction: document.getElementById("book-replace-col-action"),
  bookReplaceBody: document.getElementById("book-replace-body"),

  bookCategoriesDialog: document.getElementById("book-categories-dialog"),
  bookCategoriesDialogTitle: document.getElementById("book-categories-dialog-title"),
  btnCloseBookCategoriesDialog: document.getElementById("btn-close-book-categories-dialog"),
  bookCategoriesDialogSubtitle: document.getElementById("book-categories-dialog-subtitle"),
  bookCategoriesDialogSearchLabel: document.getElementById("book-categories-dialog-search-label"),
  bookCategoriesDialogSearch: document.getElementById("book-categories-dialog-search"),
  bookCategoriesDialogList: document.getElementById("book-categories-dialog-list"),
  bookCategoriesDialogEmpty: document.getElementById("book-categories-dialog-empty"),
  btnCancelBookCategoriesDialog: document.getElementById("btn-cancel-book-categories-dialog"),
  btnSaveBookCategoriesDialog: document.getElementById("btn-save-book-categories-dialog"),
};

const state = {
  shell: null,
  bookId: "",
  book: null,
  mode: "trans",
  translateMode: "server",
  pagination: {
    page: 1,
    page_size: 40,
    total_pages: 1,
    total_items: 0,
  },
  tocItems: [],
  bookNameSets: { "Mặc định": {} },
  bookActiveNameSet: "Mặc định",
  bookNameFilterResults: [],
  bookNameFilterMeta: null,
  bookNameFilterJobId: "",
  bookNameFilterJobStatus: "",
  bookNameFilterWatchTimer: null,
  bookNameFilterEventSource: null,
  bookNameFilterWatchReconnectTimer: null,
  bookNameFilterWatchBusy: false,
  translationEnabled: true,
  translationLocalSig: "{}",
  categories: [],
  bookCategoryDraftIds: [],
  bookReplaceEntries: [],
  translationSupportedHint: null,
  isComicHint: null,
  downloadWatchTimer: null,
  downloadEventSource: null,
  downloadWatchReconnectTimer: null,
  downloadWatchBusy: false,
  downloadWatchSig: "",
  downloadWatchHadActive: false,
  downloadWatchIdleTicks: 0,
  onlineDetailRequestId: 0,
};

const TOC_ICON_MARKUP = Object.freeze({
  download: '<svg class="toc-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"></path><path d="m8 11 4 4 4-4"></path><path d="M4 18h16"></path></svg>',
  done: '<svg class="toc-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="m8.5 12 2.4 2.4 4.6-4.8"></path></svg>',
  refresh: '<svg class="toc-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 5v6h-6"></path><path d="M20 11a8 8 0 1 1-2.34-5.66L20 7.66"></path></svg>',
});

function setTocIcon(button, kind) {
  if (!button) return;
  button.innerHTML = TOC_ICON_MARKUP[kind] || "";
}

function populateChapterTitleNode(node, title, isVip = false) {
  if (!node) return;
  node.textContent = "";
  const label = document.createElement("span");
  label.textContent = String(title || "").trim();
  node.appendChild(label);
  if (!isVip) return;
  const badge = document.createElement("span");
  badge.className = "chapter-vip-badge";
  badge.textContent = state.shell.t("vipBadge");
  node.appendChild(badge);
}

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

function supportsTranslation(book) {
  if (!book) return false;
  if (typeof book.translation_supported === "boolean") return book.translation_supported;
  const sourceType = String(book.source_type || "").toLowerCase();
  if (sourceType === "vbook_comic" || sourceType === "comic") return false;
  const lang = String(book.lang_source || "").toLowerCase();
  return lang === "zh" || lang.startsWith("zh-");
}

function supportsRawTextReplace(book) {
  if (!book) return false;
  if (supportsTranslation(book)) return false;
  if (Boolean(book.is_comic)) return false;
  const sourceType = String(book.source_type || "").toLowerCase();
  return sourceType !== "vbook_comic" && sourceType !== "comic";
}

function parseBooleanLike(value) {
  if (typeof value === "boolean") return value;
  const raw = String(value == null ? "" : value).trim().toLowerCase();
  if (!raw) return null;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return null;
}

function hintedSupportsTranslation() {
  if (state.book) return supportsTranslation(state.book);
  if (typeof state.translationSupportedHint === "boolean") return state.translationSupportedHint;
  return true;
}

function hintedSupportsRawReplace() {
  if (state.book) return supportsRawTextReplace(state.book);
  if (state.translationSupportedHint === false) return state.isComicHint !== true;
  return false;
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
      <text x="54" y="102" fill="rgba(255,255,255,0.78)" font-size="26" font-family="Arial, sans-serif">${escapeSvgText(String(tag || "BOOK").trim().toUpperCase())}</text>
      <text x="54" y="250" fill="${text}" font-size="122" font-weight="700" font-family="Arial, sans-serif">${escapeSvgText(initials)}</text>
      <foreignObject x="54" y="300" width="372" height="228">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; color: ${text}; font-size: 36px; line-height: 1.25; font-weight: 700; word-break: break-word;">
          ${escapeSvgText(safeTitle)}
        </div>
      </foreignObject>
      <text x="54" y="626" fill="rgba(255,255,255,0.86)" font-size="28" font-family="Arial, sans-serif">${escapeSvgText(String(author || state.shell.t("unknownAuthor")).trim())}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function isOnlineSourceBook(book) {
  const sourceType = String((book && book.source_type) || "").trim().toLowerCase();
  return sourceType === "vbook" || sourceType === "vbook_comic" || sourceType.startsWith("vbook_session");
}

function effectiveModeForBook(book, mode) {
  if (!supportsTranslation(book)) return "raw";
  return mode === "trans" ? "trans" : "raw";
}

function setCover(url) {
  const wrap = refs.bookCover.parentElement;
  const fallbackUrl = buildFallbackCoverDataUrl({
    title: state.book && (state.book.title_display || state.book.title) || "",
    author: state.book && (state.book.author_display || state.book.author) || "",
    tag: "BOOK",
  });
  refs.bookCover.dataset.fallbackUrl = fallbackUrl;
  refs.bookCover.dataset.fallbackApplied = "0";
  refs.bookCover.src = String(url || "").trim() || fallbackUrl;
  wrap.classList.add("has-image");
}

function validateRegexPattern(pattern) {
  try {
    // eslint-disable-next-line no-new
    new RegExp(String(pattern || ""));
    return null;
  } catch (error) {
    return error;
  }
}

function ensureValidRegexOrToast(pattern, useRegex) {
  if (!useRegex) return true;
  const error = validateRegexPattern(pattern);
  if (!error) return true;
  state.shell.showToast(state.shell.t("invalidRegexPattern", {
    message: error && error.message ? error.message : String(error || ""),
  }));
  return false;
}

function syncBookRuleButton() {
  if (!refs.btnOpenBookNames || !state.shell) return;
  const canTranslate = hintedSupportsTranslation();
  const canReplace = hintedSupportsRawReplace();
  refs.btnOpenBookNames.classList.toggle("hidden", !(canTranslate || canReplace));
  refs.btnOpenBookNames.textContent = canReplace
    ? state.shell.t("openReplaceEditor")
    : state.shell.t("bookPrivateNames");
}

function canUseBookNameFilter(book = state.book) {
  const item = book || state.book;
  if (!item) return false;
  if (Boolean(item.is_comic)) return false;
  return Math.max(0, Number(item.chapter_count || 0)) > 0;
}

function syncBookNameFilterButton() {
  if (!refs.btnBookNameFilter || !state.shell) return;
  const visible = !!state.book && canUseBookNameFilter(state.book);
  refs.btnBookNameFilter.classList.toggle("hidden", !visible);
  if (!visible) return;
  const downloaded = Math.max(0, Number((state.book && state.book.downloaded_chapters) || 0));
  const enabled = downloaded > 0;
  refs.btnBookNameFilter.disabled = !enabled;
  refs.btnBookNameFilter.textContent = state.shell.t("bookNameFilter");
  refs.btnBookNameFilter.title = enabled
    ? state.shell.t("bookNameFilter")
    : state.shell.t("nameFilterNeedDownloaded");
}

function applyBookUrlHints(params, book) {
  if (!book || typeof book !== "object") return;
  const translationSupported = parseBooleanLike(book.translation_supported);
  const isComic = parseBooleanLike(book.is_comic);
  if (translationSupported !== null) params.set("translation_supported", translationSupported ? "1" : "0");
  if (isComic !== null) params.set("is_comic", isComic ? "1" : "0");
}

function buildBookUrl(bookOrId, mode = state.mode || "raw") {
  const book = bookOrId && typeof bookOrId === "object" ? bookOrId : null;
  const bookId = book ? String(book.book_id || "").trim() : String(bookOrId || "").trim();
  const params = new URLSearchParams();
  params.set("book_id", bookId);
  params.set("mode", mode);
  if (mode === "trans") params.set("translation_mode", state.translateMode);
  applyBookUrlHints(params, book);
  return `/book?${params.toString()}`;
}

function buildReaderUrl(bookOrId, chapterId = "", mode = state.mode || "raw") {
  const book = bookOrId && typeof bookOrId === "object" ? bookOrId : null;
  const bookId = book ? String(book.book_id || "").trim() : String(bookOrId || "").trim();
  const params = new URLSearchParams();
  params.set("book_id", bookId);
  const chapter = String(chapterId || "").trim();
  if (chapter) params.set("chapter_id", chapter);
  params.set("mode", mode);
  if (mode === "trans") params.set("translation_mode", state.translateMode);
  applyBookUrlHints(params, book);
  return `/reader?${params.toString()}`;
}

function applyInitialBookUiHints() {
  const canTranslate = hintedSupportsTranslation();
  if (refs.btnTocModeTrans) refs.btnTocModeTrans.classList.toggle("hidden", !canTranslate);
  if (refs.btnTranslateTitles) refs.btnTranslateTitles.classList.toggle("hidden", !canTranslate);
  syncBookRuleButton();
  syncBookNameFilterButton();
}

function normalizeCategoryIds(values) {
  return Array.from(new Set(
    (Array.isArray(values) ? values : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean),
  ));
}

function getBookCategories() {
  return Array.isArray(state.book && state.book.categories) ? state.book.categories : [];
}

function createCategoryChip(category, { active = false, onClick = null } = {}) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "btn category-chip";
  if (active) chip.classList.add("active");
  chip.textContent = String((category && category.name) || "").trim();
  if (typeof onClick === "function") chip.addEventListener("click", onClick);
  return chip;
}

function renderBookCategoriesRow() {
  if (!refs.bookCategoriesRow || !refs.bookCategoriesList || !refs.bookCategoriesLabel) return;
  refs.bookCategoriesRow.classList.remove("hidden");
  refs.bookCategoriesLabel.textContent = state.shell.t("bookCategoriesLabel");
  refs.bookCategoriesList.innerHTML = "";
  const items = getBookCategories();
  if (!items.length) {
    const empty = document.createElement("span");
    empty.className = "empty-text";
    empty.textContent = state.shell.t("bookCategoriesNone");
    refs.bookCategoriesList.appendChild(empty);
    return;
  }
  for (const category of items) {
    const chip = createCategoryChip(category);
    chip.addEventListener("click", () => {
      const cid = String((category && category.category_id) || "").trim();
      if (!cid) return;
      window.location.href = `/library?category_ids=${encodeURIComponent(cid)}`;
    });
    refs.bookCategoriesList.appendChild(chip);
  }
}

function goLibraryWithAuthorFilter(authorText) {
  const author = normalizeParagraphDisplayText(authorText || "", { singleLine: true });
  if (!author) return;
  const params = new URLSearchParams();
  params.set("author", author);
  window.location.href = `/library?${params.toString()}`;
}

function createAuthorFilterLink(authorText) {
  const author = normalizeParagraphDisplayText(authorText || "", { singleLine: true });
  if (!author) return null;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "text-action-link";
  button.textContent = author;
  button.addEventListener("click", () => {
    goLibraryWithAuthorFilter(author);
  });
  return button;
}

function renderAuthorField(container, authorText) {
  if (!container) return;
  container.innerHTML = "";
  const link = createAuthorFilterLink(authorText);
  if (link) {
    container.appendChild(link);
    return;
  }
  container.textContent = normalizeParagraphDisplayText(authorText || "", { singleLine: true });
}

function renderBookOnlineDetail(detail) {
  if (!(refs.viewSourceDetailItem && refs.viewSourceFieldsItem && refs.viewSourceDetail && refs.viewSourceFields)) return;
  const payload = (detail && typeof detail === "object") ? detail : {};
  const detailParts = [];
  const detailText = normalizeParagraphDisplayText(payload.detail || payload.info_text || payload.status_text || "");
  if (detailText) detailParts.push(detailText);
  refs.viewSourceDetail.textContent = detailParts.join("\n\n");
  refs.viewSourceDetailItem.classList.toggle("hidden", detailParts.length <= 0);

  refs.viewSourceFields.innerHTML = "";
  const fields = Array.isArray(payload.extra_fields) ? payload.extra_fields : [];
  const fieldRows = fields
    .map((item) => ({
      key: normalizeDisplayTitle((item && item.key) || ""),
      value: normalizeParagraphDisplayText((item && item.value) || "", { singleLine: true }),
    }))
    .filter((item) => item.key || item.value);
  refs.viewSourceFieldsItem.classList.toggle("hidden", fieldRows.length <= 0);
  for (const row of fieldRows) {
    const chip = document.createElement("div");
    chip.className = "book-source-field-chip";
    const key = document.createElement("strong");
    key.textContent = row.key || "•";
    const value = document.createElement("span");
    value.textContent = row.value || "—";
    chip.append(key, value);
    refs.viewSourceFields.appendChild(chip);
  }
}

async function loadBookOnlineDetail(book, { suppressToast = true } = {}) {
  const requestId = state.onlineDetailRequestId + 1;
  state.onlineDetailRequestId = requestId;
  const currentBookId = String(state.bookId || "").trim();
  if (!book || !isOnlineSourceBook(book)) {
    renderBookOnlineDetail(null);
    return null;
  }
  const sourceUrl = String(book.source_url || book.extra_link || "").trim();
  const pluginId = String(book.source_plugin || "").trim();
  if (!sourceUrl) {
    renderBookOnlineDetail(null);
    return null;
  }
  try {
    const data = await state.shell.api("/api/vbook/detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: sourceUrl,
        plugin_id: pluginId,
        translate_ui: supportsTranslation(book) && state.mode === "trans",
      }),
    });
    if (requestId !== state.onlineDetailRequestId || String(state.bookId || "").trim() !== currentBookId) return null;
    const detail = (data && data.detail && typeof data.detail === "object") ? data.detail : {};
    if (state.book && String(state.book.book_id || "").trim() === currentBookId) {
      state.book.online_detail = detail;
    }
    renderBookOnlineDetail(detail);
    return detail;
  } catch (error) {
    if (requestId === state.onlineDetailRequestId && String(state.bookId || "").trim() === currentBookId) {
      renderBookOnlineDetail(null);
    }
    if (!suppressToast) state.shell.showToast(error.message || state.shell.t("toastError"));
    return null;
  }
}

function renderBookCategoriesDialogList() {
  if (!refs.bookCategoriesDialogList || !refs.bookCategoriesDialogEmpty) return;
  refs.bookCategoriesDialogList.innerHTML = "";
  const term = String((refs.bookCategoriesDialogSearch && refs.bookCategoriesDialogSearch.value) || "").trim().toLowerCase();
  const items = (state.categories || []).filter((item) => {
    const name = String((item && item.name) || "").trim();
    return !term || name.toLowerCase().includes(term);
  });
  refs.bookCategoriesDialogEmpty.classList.toggle("hidden", items.length > 0);
  refs.bookCategoriesDialogEmpty.textContent = state.shell.t("categoryQuickEmpty");
  for (const category of items) {
    const id = String(category.category_id || "").trim();
    const chip = createCategoryChip(category, {
      active: normalizeCategoryIds(state.bookCategoryDraftIds).includes(id),
      onClick: () => {
        const next = new Set(normalizeCategoryIds(state.bookCategoryDraftIds));
        if (next.has(id)) next.delete(id);
        else next.add(id);
        state.bookCategoryDraftIds = Array.from(next);
        renderBookCategoriesDialogList();
      },
    });
    refs.bookCategoriesDialogList.appendChild(chip);
  }
}

async function loadCategories({ silent = true } = {}) {
  try {
    const data = await state.shell.api("/api/library/categories");
    state.categories = Array.isArray(data && data.items) ? data.items : [];
    return state.categories;
  } catch (error) {
    if (!silent) state.shell.showToast(error.message || state.shell.t("toastError"));
    throw error;
  }
}

async function openBookCategoriesDialog() {
  await loadCategories({ silent: true }).catch(() => null);
  state.bookCategoryDraftIds = normalizeCategoryIds(getBookCategories().map((item) => item && item.category_id));
  if (refs.bookCategoriesDialogSubtitle) {
    refs.bookCategoriesDialogSubtitle.textContent = normalizeDisplayTitle((state.book && (state.book.title_display || state.book.title)) || "");
  }
  if (refs.bookCategoriesDialogSearch) refs.bookCategoriesDialogSearch.value = "";
  renderBookCategoriesDialogList();
  if (refs.bookCategoriesDialog && !refs.bookCategoriesDialog.open) refs.bookCategoriesDialog.showModal();
}

async function saveBookCategories() {
  if (!state.bookId) return;
  try {
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_ids: normalizeCategoryIds(state.bookCategoryDraftIds) }),
    });
    if (state.book) state.book.categories = Array.isArray(data && data.categories) ? data.categories : [];
    await loadCategories({ silent: true }).catch(() => null);
    renderBookCategoriesRow();
    if (refs.bookCategoriesDialog && refs.bookCategoriesDialog.open) refs.bookCategoriesDialog.close();
    state.shell.showToast(state.shell.t("bookCategoriesSaved"));
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  }
}

function createSkeletonBlock(className = "") {
  const node = document.createElement("div");
  node.className = `ui-skeleton-block${className ? ` ${className}` : ""}`;
  return node;
}

function renderBookInfoSkeleton() {
  if (!refs.bookViewSkeleton) return;
  refs.bookViewSkeleton.innerHTML = "";

  const hero = document.createElement("div");
  hero.className = "book-meta-skeleton-hero";
  hero.append(
    createSkeletonBlock("book-meta-skeleton-cover"),
  );

  const info = document.createElement("div");
  info.className = "book-meta-skeleton-info";
  info.append(
    createSkeletonBlock("book-meta-skeleton-title"),
    createSkeletonBlock("book-meta-skeleton-subtitle"),
    createSkeletonBlock("book-meta-skeleton-link"),
  );
  hero.appendChild(info);
  refs.bookViewSkeleton.appendChild(hero);

  const grid = document.createElement("div");
  grid.className = "book-meta-skeleton-grid";
  const cardKinds = [
    ["is-short"],
    ["is-medium"],
    ["is-short"],
    ["is-medium"],
    ["is-wide", "is-multiline"],
    ["is-wide", "is-medium"],
  ];
  for (const kinds of cardKinds) {
    const card = document.createElement("div");
    card.className = "book-meta-skeleton-card";
    if (kinds.includes("is-wide")) card.classList.add("is-wide");
    card.appendChild(createSkeletonBlock("book-meta-skeleton-label"));
    const value = createSkeletonBlock("book-meta-skeleton-value");
    for (const kind of kinds) {
      if (kind !== "is-wide") value.classList.add(kind);
    }
    card.appendChild(value);
    grid.appendChild(card);
  }
  refs.bookViewSkeleton.appendChild(grid);
}

function showBookInfoSkeleton(visible) {
  if (!refs.bookViewSkeleton) return;
  if (visible) {
    renderBookInfoSkeleton();
    refs.bookViewSkeleton.classList.remove("hidden");
    refs.bookViewSkeleton.setAttribute("aria-hidden", "false");
    refs.bookViewWrap.classList.add("hidden");
    refs.bookEmpty.classList.add("hidden");
    return;
  }
  refs.bookViewSkeleton.classList.add("hidden");
  refs.bookViewSkeleton.setAttribute("aria-hidden", "true");
  if (state.book) {
    refs.bookViewWrap.classList.remove("hidden");
    refs.bookEmpty.classList.add("hidden");
  } else {
    refs.bookViewWrap.classList.add("hidden");
    refs.bookEmpty.classList.remove("hidden");
  }
}

function renderTocSkeleton(count = 8) {
  if (!refs.tocSkeleton) return;
  refs.tocSkeleton.innerHTML = "";
  const total = Math.max(3, Number(count) || 8);
  for (let index = 0; index < total; index += 1) {
    const row = document.createElement("div");
    row.className = "toc-skeleton-row";
    const main = document.createElement("div");
    main.className = "toc-skeleton-main";
    const title = createSkeletonBlock("toc-skeleton-title");
    if (index % 3 === 1) title.style.width = "64%";
    if (index % 3 === 2) title.style.width = "78%";
    main.append(
      title,
      createSkeletonBlock("toc-skeleton-sub"),
    );
    row.append(
      main,
      createSkeletonBlock("toc-skeleton-action"),
    );
    refs.tocSkeleton.appendChild(row);
  }
}

function showTocSkeleton(visible, count = 8) {
  if (!refs.tocSkeleton || !refs.tocList) return;
  if (visible) {
    renderTocSkeleton(count);
    refs.tocSkeleton.classList.remove("hidden");
    refs.tocSkeleton.setAttribute("aria-hidden", "false");
    refs.tocList.classList.add("hidden");
    refs.tocList.setAttribute("aria-busy", "true");
    return;
  }
  refs.tocSkeleton.classList.add("hidden");
  refs.tocSkeleton.setAttribute("aria-hidden", "true");
  refs.tocList.classList.remove("hidden");
  refs.tocList.setAttribute("aria-busy", "false");
}

function populateBook() {
  showBookInfoSkeleton(false);
  const book = state.book;
  if (!book) {
    refs.bookViewWrap.classList.add("hidden");
    refs.bookEmpty.classList.remove("hidden");
    return;
  }
  refs.bookViewWrap.classList.remove("hidden");
  refs.bookEmpty.classList.add("hidden");

  refs.bookTitleDisplay.textContent = normalizeDisplayTitle(book.title_display || book.title || "Không tiêu đề");
  refs.bookSubtitle.innerHTML = "";
  const subtitleAuthor = createAuthorFilterLink(book.author_display || book.author || "");
  if (subtitleAuthor) refs.bookSubtitle.appendChild(subtitleAuthor);
  else refs.bookSubtitle.appendChild(document.createTextNode(book.author_display || book.author || "Khuyết danh"));
  refs.bookSubtitle.appendChild(document.createTextNode(` • ${book.chapter_count || 0} chương • ${book.lang_source || "zh"}`));

  refs.viewTitle.textContent = normalizeParagraphDisplayText(book.title || "", { singleLine: true });
  refs.viewTitleVi.textContent = normalizeDisplayTitle(
    supportsTranslation(book) ? (book.title_display || book.title_vi || "") : (book.title_vi || ""),
  );
  renderAuthorField(refs.viewAuthor, book.author || "");
  renderAuthorField(
    refs.viewAuthorVi,
    supportsTranslation(book) ? (book.author_display || book.author_vi || "") : (book.author_vi || ""),
  );
  refs.viewSummary.textContent = normalizeParagraphDisplayText(book.summary_display || book.summary || "");
  refs.viewExtraLink.innerHTML = "";
  if (book.extra_link) {
    const a = document.createElement("a");
    a.href = book.extra_link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = book.extra_link;
    refs.viewExtraLink.appendChild(a);
  }
  renderBookOnlineDetail(book.online_detail || null);

  setCover(book.cover_url || "");
  renderBookCategoriesRow();
  refs.btnOpenExtraLink.disabled = !(book.extra_link || "").trim();
  if (refs.btnDownloadBook) {
    const downloaded = Math.max(0, Number(book.downloaded_chapters || 0));
    const total = Math.max(0, Number(book.chapter_count || 0));
    refs.btnDownloadBook.textContent = state.shell.t("downloadedCountShort", { downloaded, total });
    refs.btnDownloadBook.disabled = total > 0 && downloaded >= total;
  }

  refs.fieldTitle.value = book.title || "";
  refs.fieldTitleVi.value = book.title_vi || "";
  refs.fieldAuthor.value = book.author || "";
  refs.fieldAuthorVi.value = book.author_vi || "";
  refs.fieldSummary.value = book.summary || "";
  refs.fieldExtraLink.value = book.extra_link || "";
  refs.fieldCoverUrl.value = book.cover_remote_url || ((String(book.cover_path || "").startsWith("http://") || String(book.cover_path || "").startsWith("https://") || String(book.cover_path || "").startsWith("data:")) ? (book.cover_path || "") : "");

  const canTranslate = supportsTranslation(book);
  refs.btnTocModeTrans.classList.toggle("hidden", !canTranslate);
  refs.btnTranslateTitles.classList.toggle("hidden", !canTranslate);
  syncBookRuleButton();
  syncBookNameFilterButton();
  updateBookNameFilterScopeOptions();
  updateBookNameFilterHint();
  if (!state.bookNameFilterMeta) {
    renderBookNameFilterSummary(null);
  } else {
    renderBookNameFilterSummary(state.bookNameFilterMeta);
  }
  if (refs.btnRefreshBookToc) {
    refs.btnRefreshBookToc.classList.toggle("hidden", !isOnlineSourceBook(book));
  }
}

function renderToc() {
  refs.tocList.innerHTML = "";
  if (!state.tocItems.length) {
    const li = document.createElement("li");
    li.className = "empty-text";
    li.textContent = state.shell.t("tocNoData");
    refs.tocList.appendChild(li);
  }
  for (const chapter of state.tocItems) {
    const li = document.createElement("li");
    li.className = "toc-row";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toc-item";

    const title = document.createElement("div");
    title.className = "toc-item-title";
    populateChapterTitleNode(
      title,
      `${chapter.chapter_order}. ${normalizeDisplayTitle(chapter.title_display || chapter.title_raw || "")}`,
      Boolean(chapter.is_vip),
    );

    const sub = document.createElement("div");
    sub.className = "toc-item-sub";
    if (state.book && state.book.is_comic) {
      sub.textContent = `${chapter.word_count || 0} ảnh`;
    } else {
      sub.textContent = `${chapter.word_count || 0} ký tự`;
    }

    btn.append(title, sub);
    btn.addEventListener("click", () => {
      const mode = effectiveModeForBook(state.book, state.mode);
      window.location.href = buildReaderUrl(state.book || state.bookId, chapter.chapter_id, mode);
    });
    const iconBtn = document.createElement("button");
    iconBtn.type = "button";
    iconBtn.className = "btn toc-icon-btn";
    if (!chapter.is_downloaded) {
      iconBtn.classList.add("is-download");
      setTocIcon(iconBtn, "download");
      iconBtn.title = state.shell.t("downloadChapter");
      iconBtn.setAttribute("aria-label", state.shell.t("downloadChapter"));
      iconBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await downloadSingleChapter(chapter.chapter_id);
      });
    } else {
      iconBtn.classList.add("is-done");
      setTocIcon(iconBtn, "done");
      iconBtn.title = state.shell.t("downloadedTag");
      iconBtn.setAttribute("aria-label", state.shell.t("downloadedTag"));
      iconBtn.disabled = true;
    }
    li.append(btn, iconBtn);
    refs.tocList.appendChild(li);
  }

  refs.btnTocPrev.disabled = state.pagination.page <= 1;
  refs.btnTocNext.disabled = state.pagination.page >= state.pagination.total_pages;
  renderTocPageSelect();
  showTocSkeleton(false);
}

function buildTocPageLabel(page, pagination = state.pagination) {
  const pageSize = Math.max(1, Number((pagination && pagination.page_size) || state.pagination.page_size || 40));
  const totalItems = Math.max(0, Number((pagination && pagination.total_items) || 0));
  const totalPages = Math.max(1, Number((pagination && pagination.total_pages) || 1));
  const safePage = Math.min(totalPages, Math.max(1, Number(page || 1)));
  const start = ((safePage - 1) * pageSize) + 1;
  const fallbackEnd = start + pageSize - 1;
  const end = totalItems > 0 ? Math.min(totalItems, fallbackEnd) : fallbackEnd;
  return `${start}-${end}`;
}

function renderTocPageSelect() {
  if (!refs.tocPageSelect) return;
  refs.tocPageSelect.innerHTML = "";
  const totalPages = Math.max(1, Number(state.pagination.total_pages || 1));
  const currentPage = Math.min(totalPages, Math.max(1, Number(state.pagination.page || 1)));
  for (let page = 1; page <= totalPages; page += 1) {
    const option = document.createElement("option");
    option.value = String(page);
    option.textContent = buildTocPageLabel(page);
    refs.tocPageSelect.appendChild(option);
  }
  refs.tocPageSelect.value = String(currentPage);
  refs.tocPageSelect.disabled = totalPages <= 1;
  refs.tocPageSelect.title = state.shell.t("tocJumpPage");
  refs.tocPageSelect.setAttribute("aria-label", state.shell.t("tocJumpPage"));
}

async function loadBook({ silent = false, suppressToast = false, refreshOnline = false, showSkeleton = !state.book } = {}) {
  if (!state.bookId) {
    showBookInfoSkeleton(false);
    refs.bookEmpty.textContent = `${state.shell.t("noBookSelected")}. ${state.shell.t("noBookSelectedHint")}`;
    return;
  }
  const shouldShowSkeleton = !silent && showSkeleton;
  if (!silent) state.shell.showStatus(state.shell.t("statusLoadingBookInfo"));
  if (shouldShowSkeleton) showBookInfoSkeleton(true);
  try {
    const mode = state.mode;
    const detail = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}?mode=${encodeURIComponent(mode)}&translation_mode=${encodeURIComponent(state.translateMode)}&refresh_online=${refreshOnline ? "1" : "0"}&include_chapters=0`);
    state.book = detail;
    populateBook();
    loadBookOnlineDetail(detail, { suppressToast: true }).catch(() => {});
  } catch (error) {
    if (!suppressToast) state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    if (shouldShowSkeleton) showBookInfoSkeleton(false);
    if (!silent) state.shell.hideStatus();
  }
}

async function loadToc(page = 1, { silent = false, suppressToast = false, showSkeleton = !silent } = {}) {
  if (!state.bookId || !state.book) {
    showTocSkeleton(false);
    return;
  }
  const shouldShowSkeleton = !silent && showSkeleton;
  if (!silent) state.shell.showStatus(state.shell.t("statusLoadingToc"));
  if (shouldShowSkeleton) showTocSkeleton(true, Math.min(10, Number(state.pagination.page_size || 8) || 8));
  try {
    const mode = effectiveModeForBook(state.book, state.mode);
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}/chapters?page=${page}&page_size=${state.pagination.page_size}&mode=${mode}&translation_mode=${encodeURIComponent(state.translateMode)}`);
    state.tocItems = data.items || [];
    state.pagination = { ...state.pagination, ...(data.pagination || {}) };
    renderToc();
  } catch (error) {
    if (!suppressToast) state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    if (shouldShowSkeleton) showTocSkeleton(false);
    if (!silent) state.shell.hideStatus();
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
  if (state.downloadWatchReconnectTimer) {
    window.clearTimeout(state.downloadWatchReconnectTimer);
    state.downloadWatchReconnectTimer = null;
  }
  if (state.downloadWatchTimer) {
    window.clearInterval(state.downloadWatchTimer);
    state.downloadWatchTimer = null;
  }
  state.downloadWatchBusy = false;
  state.downloadWatchSig = "";
  state.downloadWatchHadActive = false;
  state.downloadWatchIdleTicks = 0;
}

async function refreshDownloadStateSilent() {
  const keepPage = Math.max(1, Number(state.pagination.page || 1));
  await Promise.all([
    loadBook({ silent: true, suppressToast: true }),
    loadToc(keepPage, { silent: true, suppressToast: true }),
  ]);
}

function scheduleDownloadWatcherReconnect() {
  if (state.downloadWatchReconnectTimer) return;
  state.downloadWatchReconnectTimer = window.setTimeout(() => {
    state.downloadWatchReconnectTimer = null;
    startDownloadWatcher();
  }, 1200);
}

function isCacheEventForCurrentBook(detail) {
  if (!state.bookId) return false;
  const payload = (detail && typeof detail === "object") ? detail : {};
  const oneBookId = String(payload.book_id || "").trim();
  if (oneBookId && oneBookId === state.bookId) return true;
  const list = Array.isArray(payload.book_ids) ? payload.book_ids : [];
  return list.some((x) => String(x || "").trim() === state.bookId);
}

async function handleDownloadWatcherPayload(data) {
  const jobs = Array.isArray(data && data.items) ? data.items : [];
  const related = jobs
    .filter((job) => String(job.book_id || "").trim() === state.bookId)
    .map((job) => ({
      id: String(job.job_id || ""),
      status: String(job.status || ""),
      downloaded: Number(job.downloaded_chapters || 0),
      total: Number(job.total_chapters || 0),
    }));
  const sig = related.map((x) => `${x.id}:${x.status}:${x.downloaded}:${x.total}`).join("|");
  const hasActive = related.length > 0;
  if (hasActive) {
    if ((sig !== state.downloadWatchSig) || (!state.downloadWatchHadActive)) {
      await refreshDownloadStateSilent();
    }
    state.downloadWatchSig = sig;
    state.downloadWatchHadActive = true;
    state.downloadWatchIdleTicks = 0;
    return;
  }
  if (state.downloadWatchHadActive) {
    await refreshDownloadStateSilent();
  }
  state.downloadWatchHadActive = false;
  state.downloadWatchSig = "";
  state.downloadWatchIdleTicks += 1;
  if (state.downloadWatchIdleTicks >= 6) {
    state.downloadWatchIdleTicks = 0;
  }
}

async function pollDownloadWatcherTick() {
  if (!state.bookId || state.downloadWatchBusy) return;
  state.downloadWatchBusy = true;
  try {
    const data = await state.shell.api(`/api/library/download/jobs?book_id=${encodeURIComponent(state.bookId)}`);
    await handleDownloadWatcherPayload(data);
  } catch {
    // ignore poll errors
  } finally {
    state.downloadWatchBusy = false;
  }
}

function startDownloadWatcher() {
  if (!state.bookId) return;
  state.downloadWatchIdleTicks = 0;
  if (state.downloadEventSource || state.downloadWatchTimer) return;
  if (typeof window.EventSource === "function") {
    const streamUrl = `/api/library/download/jobs/stream?book_id=${encodeURIComponent(state.bookId)}`;
    const stream = new window.EventSource(streamUrl);
    state.downloadEventSource = stream;
    stream.addEventListener("jobs", (event) => {
      let payload = null;
      try {
        payload = JSON.parse(event.data || "{}");
      } catch {
        payload = null;
      }
      if (!payload || !Array.isArray(payload.items)) return;
      handleDownloadWatcherPayload(payload).catch(() => {});
    });
    stream.onmessage = (event) => {
      let payload = null;
      try {
        payload = JSON.parse(event.data || "{}");
      } catch {
        payload = null;
      }
      if (!payload || !Array.isArray(payload.items)) return;
      handleDownloadWatcherPayload(payload).catch(() => {});
    };
    stream.onerror = () => {
      if (state.downloadEventSource !== stream) return;
      try {
        stream.close();
      } catch {
        // ignore
      }
      state.downloadEventSource = null;
      scheduleDownloadWatcherReconnect();
    };
    return;
  }
  if (state.downloadWatchTimer) return;
  state.downloadWatchTimer = window.setInterval(() => {
    pollDownloadWatcherTick().catch(() => {});
  }, 1500);
  pollDownloadWatcherTick().catch(() => {});
}

async function saveMeta(event) {
  event.preventDefault();
  if (!state.bookId) return;
  state.shell.showStatus(state.shell.t("statusSavingMeta"));
  try {
    const payload = {
      title: refs.fieldTitle.value.trim(),
      title_vi: refs.fieldTitleVi.value.trim(),
      author: refs.fieldAuthor.value.trim(),
      author_vi: refs.fieldAuthorVi.value.trim(),
      summary: refs.fieldSummary.value.trim(),
      extra_link: refs.fieldExtraLink.value.trim(),
    };
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    state.book = data.book;
    populateBook();
    state.shell.showToast(state.shell.t("toastMetaSaved"));
    if (refs.bookEditDialog.open) refs.bookEditDialog.close();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function uploadCover(file) {
  if (!state.bookId || !file) return;
  state.shell.showStatus(state.shell.t("statusUploadingCover"));
  try {
    const form = new FormData();
    form.set("file", file);
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}/cover`, {
      method: "POST",
      body: form,
    });
    state.book = data.book;
    populateBook();
    state.shell.showToast(state.shell.t("bookMetaUpdated"));
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function applyCoverUrl() {
  const coverUrl = refs.fieldCoverUrl.value.trim();
  if (!coverUrl || !state.bookId) return;
  state.shell.showStatus(state.shell.t("statusUploadingCover"));
  try {
    const form = new FormData();
    form.set("cover_url", coverUrl);
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}/cover`, {
      method: "POST",
      body: form,
    });
    state.book = data.book;
    populateBook();
    state.shell.showToast(state.shell.t("bookMetaUpdated"));
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function translateTitles() {
  if (!state.bookId || !state.book || !supportsTranslation(state.book)) return;
  state.shell.showStatus(state.shell.t("statusTranslatingTitles"));
  try {
    await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}/translate-titles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translation_mode: state.translateMode }),
    });
    await loadBook();
    await loadToc(state.pagination.page || 1);
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function downloadBookChapters() {
  if (!state.bookId) return;
  state.shell.showStatus(state.shell.t("statusQueueDownload"));
  try {
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (data && data.already_downloaded) {
      state.shell.showToast(state.shell.t("downloadAlreadyDone"));
    } else {
      state.shell.showToast(state.shell.t("downloadQueued"));
    }
    window.dispatchEvent(new CustomEvent("reader-cache-changed", {
      detail: {
        source: "book-download",
        action: "enqueue_book_download",
        book_id: state.bookId,
      },
    }));
    await refreshDownloadStateSilent();
    startDownloadWatcher();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function downloadSingleChapter(chapterId) {
  const cid = String(chapterId || "").trim();
  if (!cid) return;
  state.shell.showStatus(state.shell.t("statusQueueDownload"));
  try {
    const data = await state.shell.api(`/api/library/chapter/${encodeURIComponent(cid)}/download`, {
      method: "POST",
    });
    if (data && data.already_downloaded) {
      state.shell.showToast(state.shell.t("downloadAlreadyDone"));
    } else {
      state.shell.showToast(state.shell.t("downloadQueued"));
    }
    window.dispatchEvent(new CustomEvent("reader-cache-changed", {
      detail: {
        source: "book-download",
        action: "enqueue_chapter_download",
        book_id: state.bookId,
        chapter_id: cid,
      },
    }));
    await refreshDownloadStateSilent();
    startDownloadWatcher();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function refreshBookToc() {
  if (!state.bookId) return;
  state.shell.showStatus(state.shell.t("statusCheckingBookUpdates"));
  try {
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}/refresh-toc`, {
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
    await refreshDownloadStateSilent();
    window.dispatchEvent(new CustomEvent("reader-cache-changed", {
      detail: {
        source: "book-refresh-toc",
        action: "refresh_toc",
        book_id: state.bookId,
      },
    }));
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

function renderBookNameRows() {
  refs.bookNameBody.innerHTML = "";
  const current = state.bookNameSets[state.bookActiveNameSet] || {};
  const entries = Object.entries(current);
  if (!entries.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.className = "empty-text";
    td.textContent = state.shell.t("bookNameEmpty");
    tr.appendChild(td);
    refs.bookNameBody.appendChild(tr);
  } else {
    for (const [source, target] of entries) {
      const tr = document.createElement("tr");
      tr.className = "name-entry-row";
      const tdAction = document.createElement("td");
      tdAction.colSpan = 3;
      const card = document.createElement("div");
      card.className = "name-entry-card";
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "btn name-entry-chip";
      chip.textContent = `${source}=${target || ""}`;
      chip.title = `${source}=${target || ""}`;
      chip.addEventListener("click", () => {
        openBookNameEntrySuggestFromList(source, target || "").catch((error) => {
          state.shell.showToast(error.message || state.shell.t("toastError"));
        });
      });
      const btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.className = "btn btn-small";
      btnDelete.textContent = state.shell.t("deleteNameEntry");
      btnDelete.addEventListener("click", async () => {
        await updateBookNameEntry(source, "", true);
      });
      card.append(chip, btnDelete);
      tdAction.appendChild(card);
      tr.appendChild(tdAction);
      refs.bookNameBody.appendChild(tr);
    }
  }
  refs.bookNameCount.textContent = state.shell.t("bookNameCount", { count: entries.length });
}

async function updateBookNameEntry(source, target, del = false) {
  if (!state.bookId) return;
  if (!source) return;
  state.shell.showStatus(state.shell.t("statusApplyingNameEntry"));
  try {
    if (del) {
      await deleteBookNameEntry(source);
    } else {
      await saveBookNameEntries({ [source]: target }, { replace: false });
    }
    await refreshBookNameEffects();
    state.shell.showToast(state.shell.t("nameEntryApplied"));
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

function normalizeBookNameEntries(entries) {
  const result = {};
  for (const [rawSource, rawTarget] of Object.entries(entries || {})) {
    const source = String(rawSource || "").trim();
    const target = String(rawTarget || "").trim();
    if (!source || !target) continue;
    result[source] = target;
  }
  return result;
}

function mergeBookNameEntriesWithPriority(currentEntries, incomingEntries) {
  const current = normalizeBookNameEntries(currentEntries);
  const incoming = normalizeBookNameEntries(incomingEntries);
  const merged = { ...incoming };
  for (const [source, target] of Object.entries(current)) {
    if (Object.prototype.hasOwnProperty.call(merged, source)) continue;
    merged[source] = target;
  }
  return merged;
}

function buildBookNameExportText() {
  const active = state.bookActiveNameSet || "Mặc định";
  return serializeNameSetText(state.bookNameSets[active] || {});
}

function parseBookNameEntriesOrThrow(rawText) {
  const parsed = parseNameSetText(rawText);
  if (!parsed.entryCount) {
    throw new Error(state.shell.t("nameSetImportInvalid"));
  }
  return normalizeBookNameEntries(parsed.entries);
}

async function loadBookReplaceEntries() {
  if (!state.bookId) {
    state.bookReplaceEntries = [];
    return;
  }
  const data = await state.shell.api(`/api/book-replaces/book/${encodeURIComponent(state.bookId)}`);
  state.bookReplaceEntries = Array.isArray(data && data.entries)
    ? data.entries.map((item) => ({
        source: String(item && item.source || "").trim(),
        target: String(item && item.target || "").trim(),
        use_regex: Boolean(item && item.use_regex),
        ignore_case: Boolean(item && item.ignore_case),
      })).filter((item) => item.source)
    : [];
}

function syncBookReplaceEntriesFromState(payload) {
  state.bookReplaceEntries = Array.isArray(payload && payload.entries)
    ? payload.entries.map((item) => ({
        source: String(item && item.source || "").trim(),
        target: String(item && item.target || "").trim(),
        use_regex: Boolean(item && item.use_regex),
        ignore_case: Boolean(item && item.ignore_case),
      })).filter((item) => item.source)
    : [];
}

function renderBookReplaceRows() {
  if (!refs.bookReplaceBody) return;
  refs.bookReplaceBody.innerHTML = "";
  const entries = Array.isArray(state.bookReplaceEntries) ? state.bookReplaceEntries.slice() : [];
  if (refs.bookReplacePreviewHint) {
    refs.bookReplacePreviewHint.textContent = entries.length
      ? state.shell.t("replacePreviewCount", { count: entries.length })
      : state.shell.t("replacePreviewEmpty");
  }
  if (!entries.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.className = "empty-text";
    td.textContent = state.shell.t("replacePreviewEmpty");
    tr.appendChild(td);
    refs.bookReplaceBody.appendChild(tr);
    return;
  }
  for (const entry of entries) {
    const source = String(entry && entry.source || "").trim();
    const target = String(entry && entry.target || "").trim();
    const useRegex = Boolean(entry && entry.use_regex);
    const ignoreCase = Boolean(entry && entry.ignore_case);
    const tr = document.createElement("tr");

    const tdSource = document.createElement("td");
    const wrap = document.createElement("div");
    wrap.className = "junk-entry-row";
    const sourceInput = document.createElement("input");
    sourceInput.type = "text";
    sourceInput.className = "name-target-inline";
    sourceInput.value = source;
    const regexLabel = document.createElement("label");
    regexLabel.className = "checkbox-row";
    const regexInput = document.createElement("input");
    regexInput.type = "checkbox";
    regexInput.checked = useRegex;
    const regexText = document.createElement("span");
    regexText.textContent = state.shell.t("junkRegexLabel");
    regexLabel.append(regexInput, regexText);
    const ignoreLabel = document.createElement("label");
    ignoreLabel.className = "checkbox-row";
    const ignoreInput = document.createElement("input");
    ignoreInput.type = "checkbox";
    ignoreInput.checked = ignoreCase;
    const ignoreText = document.createElement("span");
    ignoreText.textContent = state.shell.t("junkIgnoreCaseLabel");
    ignoreLabel.append(ignoreInput, ignoreText);
    wrap.append(sourceInput, regexLabel, ignoreLabel);
    tdSource.appendChild(wrap);

    const tdTarget = document.createElement("td");
    const targetInput = document.createElement("input");
    targetInput.type = "text";
    targetInput.className = "name-target-inline";
    targetInput.value = target;
    tdTarget.appendChild(targetInput);

    const tdAction = document.createElement("td");
    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.className = "btn btn-small";
    btnSave.textContent = state.shell.t("saveNameEntry");
    btnSave.addEventListener("click", async () => {
      const nextSource = String(sourceInput.value || "").trim();
      const nextTarget = String(targetInput.value || "").trim();
      if (!nextSource) {
        state.shell.showToast(state.shell.t("replaceSourceRequired"));
        sourceInput.focus();
        return;
      }
      if (!nextTarget) {
        state.shell.showToast(state.shell.t("replaceTargetRequired"));
        targetInput.focus();
        return;
      }
      if (!ensureValidRegexOrToast(nextSource, Boolean(regexInput.checked))) {
        sourceInput.focus();
        return;
      }
      try {
        const result = await state.shell.api(`/api/book-replaces/book/${encodeURIComponent(state.bookId)}/entry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source,
            target,
            use_regex: useRegex,
            ignore_case: ignoreCase,
            new_source: nextSource,
            new_target: nextTarget,
            new_use_regex: Boolean(regexInput.checked),
            new_ignore_case: Boolean(ignoreInput.checked),
          }),
        });
        syncBookReplaceEntriesFromState(result);
        renderBookReplaceRows();
        state.shell.showToast(state.shell.t("replaceEntryApplied"));
      } catch (error) {
        state.shell.showToast(error.message || state.shell.t("toastError"));
      }
    });
    const btnDelete = document.createElement("button");
    btnDelete.type = "button";
    btnDelete.className = "btn btn-small";
    btnDelete.textContent = state.shell.t("deleteNameEntry");
    btnDelete.addEventListener("click", async () => {
      try {
        const result = await state.shell.api(`/api/book-replaces/book/${encodeURIComponent(state.bookId)}/entry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source,
            target,
            use_regex: useRegex,
            ignore_case: ignoreCase,
            delete: true,
          }),
        });
        syncBookReplaceEntriesFromState(result);
        renderBookReplaceRows();
        state.shell.showToast(state.shell.t("replaceEntryDeleted"));
      } catch (error) {
        state.shell.showToast(error.message || state.shell.t("toastError"));
      }
    });
    tdAction.append(btnSave, btnDelete);
    tr.append(tdSource, tdTarget, tdAction);
    refs.bookReplaceBody.appendChild(tr);
  }
}

async function openBookReplaceDialog() {
  if (!state.bookId) return;
  try {
    await loadBookReplaceEntries();
    renderBookReplaceRows();
    if (refs.bookReplaceDialog && !refs.bookReplaceDialog.open) refs.bookReplaceDialog.showModal();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  }
}

async function refreshBookNameEffects() {
  const keepPage = Math.max(1, Number(state.pagination.page || 1));
  await Promise.all([
    loadBookNameSets(),
    loadBook({ silent: true, suppressToast: true }),
  ]);
  if (state.book) {
    await loadToc(keepPage, { silent: true, suppressToast: true });
  }
}

async function deleteBookNameEntry(source) {
  const sourceKey = String(source || "").trim();
  if (!sourceKey || !state.bookId) return false;
  const active = state.bookActiveNameSet || "Mặc định";
  const nextEntries = normalizeBookNameEntries(state.bookNameSets[active] || {});
  if (!Object.prototype.hasOwnProperty.call(nextEntries, sourceKey)) return true;
  delete nextEntries[sourceKey];
  await state.shell.api("/api/name-sets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sets: { ...state.bookNameSets, [active]: nextEntries },
      active_set: active,
      bump_version: true,
      book_id: state.bookId,
    }),
  });
  return true;
}

async function saveBookNameEntries(entries, { replace = false } = {}) {
  const active = state.bookActiveNameSet || "Mặc định";
  const nextEntries = replace
    ? normalizeBookNameEntries(entries)
    : mergeBookNameEntriesWithPriority(state.bookNameSets[active] || {}, entries);
  await state.shell.api("/api/name-sets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sets: { ...state.bookNameSets, [active]: nextEntries },
      active_set: active,
      bump_version: true,
      book_id: state.bookId,
    }),
  });
}

async function applyBookNameEntries(entries, { replace = false, toastKey = "nameSetImported" } = {}) {
  const nextEntries = normalizeBookNameEntries(entries);
  if (!Object.keys(nextEntries).length) {
    state.shell.showToast(state.shell.t("nameSetImportInvalid"));
    return false;
  }
  state.shell.showStatus(state.shell.t("statusApplyingNameEntry"));
  try {
    await saveBookNameEntries(nextEntries, { replace });
    await refreshBookNameEffects();
    if (toastKey) {
      state.shell.showToast(state.shell.t(toastKey));
    }
    return true;
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
    return false;
  } finally {
    state.shell.hideStatus();
  }
}

function openBookNameBulkDialog() {
  if (!refs.bookNameBulkDialog) return;
  refs.bookNameBulkForm.reset();
  refs.bookNameBulkDialog.showModal();
  if (refs.bookNameBulkInput) refs.bookNameBulkInput.focus();
}

async function submitBookNameBulkEntries(event) {
  event.preventDefault();
  try {
    const entries = parseBookNameEntriesOrThrow(refs.bookNameBulkInput ? refs.bookNameBulkInput.value : "");
    const applied = await applyBookNameEntries(entries, { replace: false, toastKey: "nameSetQuickAddApplied" });
    if (applied && refs.bookNameBulkDialog) {
      refs.bookNameBulkDialog.close();
    }
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  }
}

function bookDownloadedChapterCount() {
  return Math.max(0, Number((state.book && state.book.downloaded_chapters) || 0));
}

function bookChapterTotalCount() {
  return Math.max(0, Number((state.book && state.book.chapter_count) || 0));
}

function isBookNameFilterJobActive(status = state.bookNameFilterJobStatus) {
  return ["queued", "running"].includes(String(status || "").trim().toLowerCase());
}

function updateBookNameFilterScopeOptions() {
  if (!refs.bookNameFilterScope || !state.shell) return;
  const options = refs.bookNameFilterScope.querySelectorAll("option");
  const downloaded = bookDownloadedChapterCount();
  if (options[0]) options[0].textContent = state.shell.t("nameFilterScopeDownloadedCount", { count: downloaded });
  if (options[1]) options[1].textContent = state.shell.t("nameFilterScopeFirstN");
  if (options[2]) options[2].textContent = state.shell.t("nameFilterScopeRange");
}

function updateBookNameFilterHint() {
  if (!refs.bookNameFilterHint || !state.shell) return;
  refs.bookNameFilterHint.textContent = state.shell.t("nameFilterHintDetail", {
    downloaded: bookDownloadedChapterCount(),
    total: bookChapterTotalCount(),
  });
}

function setBookNameFilterRunningUi(running = isBookNameFilterJobActive()) {
  const active = Boolean(running);
  if (refs.btnBookNameFilterRun) {
    refs.btnBookNameFilterRun.disabled = active;
    refs.btnBookNameFilterRun.textContent = state.shell.t(active ? "nameFilterRunActive" : "nameFilterRun");
  }
  syncBookNameFilterSelectionUi();
}

function syncBookNameFilterScopeFields() {
  const scope = String((refs.bookNameFilterScope && refs.bookNameFilterScope.value) || "downloaded").trim();
  if (refs.bookNameFilterFirstNWrap) refs.bookNameFilterFirstNWrap.classList.toggle("hidden", scope !== "first_n");
  if (refs.bookNameFilterStartWrap) refs.bookNameFilterStartWrap.classList.toggle("hidden", scope !== "range");
  if (refs.bookNameFilterEndWrap) refs.bookNameFilterEndWrap.classList.toggle("hidden", scope !== "range");
}

function countSelectedBookNameFilterRows() {
  return (Array.isArray(state.bookNameFilterResults) ? state.bookNameFilterResults : [])
    .filter((item) => item && item.selected && String(item.source || "").trim() && String(item.target_suggested || "").trim())
    .length;
}

function syncBookNameFilterSelectionUi() {
  const items = Array.isArray(state.bookNameFilterResults) ? state.bookNameFilterResults : [];
  const selected = countSelectedBookNameFilterRows();
  const active = isBookNameFilterJobActive();
  if (refs.bookNameFilterSelectAll) {
    refs.bookNameFilterSelectAll.disabled = active || !items.length;
    refs.bookNameFilterSelectAll.checked = !!items.length && selected === items.length;
    refs.bookNameFilterSelectAll.indeterminate = selected > 0 && selected < items.length;
  }
  if (refs.btnBookNameFilterImport) {
    refs.btnBookNameFilterImport.disabled = active || selected <= 0;
  }
}

function renderBookNameFilterRows() {
  if (!refs.bookNameFilterBody) return;
  const items = Array.isArray(state.bookNameFilterResults) ? state.bookNameFilterResults : [];
  const active = isBookNameFilterJobActive();
  refs.bookNameFilterBody.innerHTML = "";
  if (!items.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "empty-text";
    td.textContent = state.shell.t("nameFilterEmpty");
    tr.appendChild(td);
    refs.bookNameFilterBody.appendChild(tr);
    syncBookNameFilterSelectionUi();
    return;
  }
  items.forEach((item) => {
    const tr = document.createElement("tr");

    const tdSelect = document.createElement("td");
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = Boolean(item.selected);
    check.disabled = active;
    check.addEventListener("change", () => {
      item.selected = Boolean(check.checked);
      syncBookNameFilterSelectionUi();
    });
    tdSelect.appendChild(check);

    const tdSource = document.createElement("td");
    tdSource.textContent = String(item.source || "").trim();

    const tdType = document.createElement("td");
    tdType.textContent = String(item.entity_type || "").trim();

    const tdTarget = document.createElement("td");
    const targetInput = document.createElement("input");
    targetInput.type = "text";
    targetInput.className = "name-target-inline";
    targetInput.value = String(item.target_suggested || "").trim();
    targetInput.placeholder = String(item.han_viet || "").trim();
    targetInput.disabled = active;
    targetInput.addEventListener("input", () => {
      item.target_suggested = targetInput.value;
      syncBookNameFilterSelectionUi();
    });
    tdTarget.appendChild(targetInput);

    const tdHv = document.createElement("td");
    tdHv.textContent = String(item.han_viet || "").trim();

    const tdMeta = document.createElement("td");
    const metaParts = [
      `${state.shell.t("nameFilterCountShort")}: ${Number(item.count || 0)}`,
      `Conf: ${Number(item.confidence || 0)}`,
    ];
    const origins = Array.isArray(item.origins) ? item.origins.filter(Boolean) : [];
    if (origins.length) metaParts.push(origins.join(", "));
    tdMeta.textContent = metaParts.join(" • ");

    const tdContext = document.createElement("td");
    const contexts = Array.isArray(item.sample_contexts) ? item.sample_contexts : [];
    tdContext.textContent = contexts.join("\n");
    tdContext.className = "book-name-filter-context";

    tr.append(tdSelect, tdSource, tdType, tdTarget, tdHv, tdMeta, tdContext);
    refs.bookNameFilterBody.appendChild(tr);
  });
  syncBookNameFilterSelectionUi();
}

function resetBookNameFilterDialog() {
  state.bookNameFilterResults = [];
  state.bookNameFilterMeta = null;
  state.bookNameFilterJobId = "";
  state.bookNameFilterJobStatus = "";
  if (refs.bookNameFilterForm) refs.bookNameFilterForm.reset();
  if (refs.bookNameFilterScope) refs.bookNameFilterScope.value = "downloaded";
  const downloaded = bookDownloadedChapterCount();
  const chapterTotal = bookChapterTotalCount();
  if (refs.bookNameFilterFirstN) refs.bookNameFilterFirstN.value = String(Math.min(Math.max(1, downloaded || 1), 20));
  if (refs.bookNameFilterStart) refs.bookNameFilterStart.value = "1";
  if (refs.bookNameFilterEnd) refs.bookNameFilterEnd.value = String(Math.min(Math.max(1, downloaded || chapterTotal || 1), 20));
  if (refs.bookNameFilterMaxChapters) refs.bookNameFilterMaxChapters.value = String(Math.min(Math.max(1, downloaded || 1), 80));
  if (refs.bookNameFilterIncludePerson) refs.bookNameFilterIncludePerson.checked = true;
  if (refs.bookNameFilterIncludePlace) refs.bookNameFilterIncludePlace.checked = true;
  if (refs.bookNameFilterIncludeTitle) refs.bookNameFilterIncludeTitle.checked = true;
  if (refs.bookNameFilterSkipExisting) refs.bookNameFilterSkipExisting.checked = true;
  if (refs.bookNameFilterSummary) refs.bookNameFilterSummary.textContent = "";
  if (refs.bookNameFilterSelectAll) {
    refs.bookNameFilterSelectAll.checked = false;
    refs.bookNameFilterSelectAll.indeterminate = false;
  }
  updateBookNameFilterScopeOptions();
  updateBookNameFilterHint();
  setBookNameFilterRunningUi(false);
  syncBookNameFilterScopeFields();
  renderBookNameFilterRows();
}

function buildBookNameFilterPayload() {
  const scope = String((refs.bookNameFilterScope && refs.bookNameFilterScope.value) || "downloaded").trim();
  return {
    scope,
    first_n: Number(refs.bookNameFilterFirstN && refs.bookNameFilterFirstN.value || 0),
    start_order: Number(refs.bookNameFilterStart && refs.bookNameFilterStart.value || 0),
    end_order: Number(refs.bookNameFilterEnd && refs.bookNameFilterEnd.value || 0),
    min_count: Number(refs.bookNameFilterMinCount && refs.bookNameFilterMinCount.value || 5),
    min_length: Number(refs.bookNameFilterMinLength && refs.bookNameFilterMinLength.value || 2),
    max_length: Number(refs.bookNameFilterMaxLength && refs.bookNameFilterMaxLength.value || 4),
    max_items: Number(refs.bookNameFilterMaxItems && refs.bookNameFilterMaxItems.value || 120),
    max_chapters: Number(refs.bookNameFilterMaxChapters && refs.bookNameFilterMaxChapters.value || 80),
    skip_existing: Boolean(refs.bookNameFilterSkipExisting && refs.bookNameFilterSkipExisting.checked),
    include_person: Boolean(refs.bookNameFilterIncludePerson && refs.bookNameFilterIncludePerson.checked),
    include_place: Boolean(refs.bookNameFilterIncludePlace && refs.bookNameFilterIncludePlace.checked),
    include_title: Boolean(refs.bookNameFilterIncludeTitle && refs.bookNameFilterIncludeTitle.checked),
  };
}

function renderBookNameFilterSummary(payload = state.bookNameFilterMeta) {
  if (!refs.bookNameFilterSummary || !state.shell) return;
  if (!payload || typeof payload !== "object") {
    refs.bookNameFilterSummary.textContent = "";
    return;
  }
  const status = String(payload.status || state.bookNameFilterJobStatus || "").trim().toLowerCase();
  if (status === "failed") {
    refs.bookNameFilterSummary.textContent = state.shell.t("nameFilterSummaryFailed", {
      message: String(payload.message || state.shell.t("toastError")),
    });
    return;
  }
  const downloaded = Number(payload.downloaded_chapters || bookDownloadedChapterCount());
  const total = Number(payload.chapter_total || bookChapterTotalCount());
  const selected = Number(payload.selected_chapters || payload.total_chapters || downloaded);
  const scanned = Number(payload.scanned_chapters || payload.processed_chapters || 0);
  const processed = Number(payload.processed_chapters || 0);
  const count = Array.isArray(payload.items) ? payload.items.length : Number(payload.found_candidates || 0);
  let text = "";
  if (isBookNameFilterJobActive(status)) {
    text = state.shell.t("nameFilterSummaryRunning", {
      processed,
      selected,
      downloaded,
      total,
      count,
    });
    const currentOrder = Number(payload.current_chapter_order || 0);
    const currentTitle = String(payload.current_chapter_title || "").trim();
    if (currentOrder > 0) {
      text += ` | ${state.shell.t("nameFilterSummaryCurrent", {
        order: currentOrder,
        title: currentTitle || `Chương ${currentOrder}`,
      })}`;
    }
    refs.bookNameFilterSummary.textContent = text;
    return;
  }
  refs.bookNameFilterSummary.textContent = state.shell.t("nameFilterSummaryDone", {
    scanned,
    selected,
    downloaded,
    total,
    count,
  });
}

function applyBookNameFilterJobPayload(job) {
  if (!job || typeof job !== "object") return;
  state.bookNameFilterMeta = job;
  state.bookNameFilterJobId = String(job.job_id || state.bookNameFilterJobId || "");
  state.bookNameFilterJobStatus = String(job.status || "");
  state.bookNameFilterResults = Array.isArray(job.items)
    ? job.items.map((item) => ({ ...item, selected: item.selected !== false }))
    : [];
  setBookNameFilterRunningUi();
  renderBookNameFilterSummary(job);
  renderBookNameFilterRows();
}

function pickBookNameFilterJob(items) {
  const jobs = Array.isArray(items) ? items : [];
  if (!jobs.length) return null;
  const currentId = String(state.bookNameFilterJobId || "").trim();
  if (currentId) {
    const matched = jobs.find((job) => String((job && job.job_id) || "").trim() === currentId);
    if (matched) return matched;
  }
  const active = jobs.find((job) => isBookNameFilterJobActive(job && job.status));
  if (active) return active;
  return jobs[0] || null;
}

function clearBookNameFilterWatcher({ resetJob = false } = {}) {
  if (state.bookNameFilterEventSource) {
    try {
      state.bookNameFilterEventSource.close();
    } catch {
      // ignore
    }
    state.bookNameFilterEventSource = null;
  }
  if (state.bookNameFilterWatchReconnectTimer) {
    window.clearTimeout(state.bookNameFilterWatchReconnectTimer);
    state.bookNameFilterWatchReconnectTimer = null;
  }
  if (state.bookNameFilterWatchTimer) {
    window.clearInterval(state.bookNameFilterWatchTimer);
    state.bookNameFilterWatchTimer = null;
  }
  state.bookNameFilterWatchBusy = false;
  if (resetJob) {
    state.bookNameFilterJobId = "";
    state.bookNameFilterJobStatus = "";
  }
}

function scheduleBookNameFilterWatcherReconnect() {
  if (state.bookNameFilterWatchReconnectTimer) return;
  state.bookNameFilterWatchReconnectTimer = window.setTimeout(() => {
    state.bookNameFilterWatchReconnectTimer = null;
    startBookNameFilterWatcher();
  }, 1200);
}

function handleBookNameFilterWatcherPayload(data) {
  const jobs = Array.isArray(data && data.items) ? data.items : [];
  const relevant = jobs.filter((job) => String((job && job.book_id) || "").trim() === state.bookId);
  const picked = pickBookNameFilterJob(relevant);
  if (!picked) return;
  applyBookNameFilterJobPayload(picked);
}

async function pollBookNameFilterWatcherTick() {
  if (!state.bookId || state.bookNameFilterWatchBusy) return;
  state.bookNameFilterWatchBusy = true;
  try {
    const data = await state.shell.api(`/api/library/name-filter/jobs?book_id=${encodeURIComponent(state.bookId)}`);
    handleBookNameFilterWatcherPayload(data);
  } catch {
    // ignore poll errors
  } finally {
    state.bookNameFilterWatchBusy = false;
  }
}

function startBookNameFilterWatcher() {
  if (!state.bookId || !refs.bookNameFilterDialog || !refs.bookNameFilterDialog.open) return;
  if (state.bookNameFilterEventSource || state.bookNameFilterWatchTimer) return;
  if (typeof window.EventSource === "function") {
    const streamUrl = `/api/library/name-filter/jobs/stream?book_id=${encodeURIComponent(state.bookId)}`;
    const stream = new window.EventSource(streamUrl);
    state.bookNameFilterEventSource = stream;
    stream.addEventListener("jobs", (event) => {
      let payload = null;
      try {
        payload = JSON.parse(event.data || "{}");
      } catch {
        payload = null;
      }
      if (!payload || !Array.isArray(payload.items)) return;
      handleBookNameFilterWatcherPayload(payload);
    });
    stream.onmessage = (event) => {
      let payload = null;
      try {
        payload = JSON.parse(event.data || "{}");
      } catch {
        payload = null;
      }
      if (!payload || !Array.isArray(payload.items)) return;
      handleBookNameFilterWatcherPayload(payload);
    };
    stream.onerror = () => {
      if (state.bookNameFilterEventSource !== stream) return;
      try {
        stream.close();
      } catch {
        // ignore
      }
      state.bookNameFilterEventSource = null;
      scheduleBookNameFilterWatcherReconnect();
    };
    return;
  }
  state.bookNameFilterWatchTimer = window.setInterval(() => {
    pollBookNameFilterWatcherTick().catch(() => {});
  }, 1500);
  pollBookNameFilterWatcherTick().catch(() => {});
}

async function openBookNameFilterDialog() {
  if (!state.book || !canUseBookNameFilter(state.book)) return;
  if (bookDownloadedChapterCount() <= 0) {
    state.shell.showToast(state.shell.t("nameFilterNeedDownloaded"));
    return;
  }
  clearBookNameFilterWatcher({ resetJob: true });
  resetBookNameFilterDialog();
  if (refs.bookNameFilterDialog && !refs.bookNameFilterDialog.open) {
    refs.bookNameFilterDialog.showModal();
  }
  startBookNameFilterWatcher();
}

async function submitBookNameFilterPreview(event) {
  event.preventDefault();
  if (!state.bookId || isBookNameFilterJobActive()) return;
  const payload = buildBookNameFilterPayload();
  state.shell.showStatus(state.shell.t("statusFilteringBookNames"));
  try {
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}/name-filter/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    applyBookNameFilterJobPayload(data.job || {});
    startBookNameFilterWatcher();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
    setBookNameFilterRunningUi(false);
  } finally {
    state.shell.hideStatus();
  }
}

async function importSelectedBookNameFilterRows() {
  const entries = {};
  for (const item of Array.isArray(state.bookNameFilterResults) ? state.bookNameFilterResults : []) {
    if (!item || !item.selected) continue;
    const source = String(item.source || "").trim();
    const target = String(item.target_suggested || "").trim();
    if (!source || !target) continue;
    entries[source] = target;
  }
  if (!Object.keys(entries).length) {
    state.shell.showToast(state.shell.t("nameFilterPickOne"));
    return;
  }
  const applied = await applyBookNameEntries(entries, { replace: false, toastKey: "nameFilterImported" });
  if (applied && refs.bookNameFilterDialog && refs.bookNameFilterDialog.open) {
    refs.bookNameFilterDialog.close();
  }
}

function currentBookNameSuggestSourceText() {
  return String(refs.bookNameSource.value || "").trim();
}

function syncBookNameSuggestExternalActions() {
  const source = currentBookNameSuggestSourceText();
  const disabled = !source;
  if (refs.btnBookNameSuggestGoogleTranslate) refs.btnBookNameSuggestGoogleTranslate.disabled = disabled;
  if (refs.btnBookNameSuggestGoogleSearch) refs.btnBookNameSuggestGoogleSearch.disabled = disabled;
}

function renderBookNameSuggestRows(items, rightItems = []) {
  refs.bookNameSuggestLeftBody.innerHTML = "";
  refs.bookNameSuggestRightBody.innerHTML = "";
  const list = Array.isArray(items) ? items : [];
  const rightList = Array.isArray(rightItems) ? rightItems : [];
  refs.bookNameSuggestHint.textContent = state.shell.t("nameSuggestCount", { count: list.length });

  let selectedIndex = -1;
  const selectRow = (idx) => {
    selectedIndex = idx;
    const row = list[idx];
    if (!row) return;
    refs.bookNameSource.value = String(row.source_text || "").trim();
    refs.bookNameTarget.value = String(row.han_viet || "").trim();
    const rows = refs.bookNameSuggestLeftBody.querySelectorAll("tr");
    rows.forEach((el, i) => el.classList.toggle("active", i === idx));
    syncBookNameSuggestExternalActions();
  };

  for (const row of list) {
    const trLeft = document.createElement("tr");
    trLeft.className = "name-suggest-row";
    const tdIdx = document.createElement("td");
    tdIdx.textContent = String(row.index || "");
    const tdSource = document.createElement("td");
    tdSource.textContent = row.source_text || "";
    const tdHv = document.createElement("td");
    tdHv.textContent = row.han_viet || "";
    trLeft.append(tdIdx, tdSource, tdHv);
    trLeft.addEventListener("click", () => {
      const idx = list.indexOf(row);
      selectRow(idx);
      refs.bookNameSuggestDialog.close();
      refs.bookNameTarget.focus();
    });
    refs.bookNameSuggestLeftBody.appendChild(trLeft);
  }

  if (!list.length) {
    const trEmptyLeft = document.createElement("tr");
    const tdEmptyLeft = document.createElement("td");
    tdEmptyLeft.colSpan = 3;
    tdEmptyLeft.className = "empty-text";
    tdEmptyLeft.textContent = state.shell.t("nameSuggestEmpty");
    trEmptyLeft.appendChild(tdEmptyLeft);
    refs.bookNameSuggestLeftBody.appendChild(trEmptyLeft);
  }

  if (!rightList.length) {
    const trPending = document.createElement("tr");
    const tdPending = document.createElement("td");
    tdPending.colSpan = 3;
    tdPending.className = "empty-text";
    tdPending.textContent = state.shell.t("nameSuggestRightPending");
    trPending.appendChild(tdPending);
    refs.bookNameSuggestRightBody.appendChild(trPending);
  } else {
    for (const row of rightList) {
      const tr = document.createElement("tr");
      const tdTarget = document.createElement("td");
      tdTarget.textContent = String(row.target_text || "").trim();
      const tdOrigin = document.createElement("td");
      tdOrigin.textContent = String(row.origin || "").trim();
      const tdAction = document.createElement("td");
      const btnUse = document.createElement("button");
      btnUse.type = "button";
      btnUse.className = "btn btn-small";
      btnUse.textContent = state.shell.t("nameSuggestUse");
      btnUse.addEventListener("click", () => {
        const source = String(row.source_text || refs.bookNameSource.value || "").trim();
        const target = String(row.target_text || "").trim();
        if (source) refs.bookNameSource.value = source;
        if (target) refs.bookNameTarget.value = target;
        refs.bookNameSuggestDialog.close();
        refs.bookNameTarget.focus();
        syncBookNameSuggestExternalActions();
      });
      tdAction.append(btnUse);
      tr.append(tdTarget, tdOrigin, tdAction);
      refs.bookNameSuggestRightBody.appendChild(tr);
    }
  }

  if (selectedIndex < 0 && list.length) {
    selectRow(0);
  } else {
    syncBookNameSuggestExternalActions();
  }
}

async function openBookNameSuggestDialog(sourceText = String(refs.bookNameSource.value || "").trim()) {
  const source = String(sourceText || "").trim();
  if (!source) {
    state.shell.showToast(state.shell.t("nameSourceTargetRequired"));
    refs.bookNameSource.focus();
    return;
  }
  state.shell.showStatus(state.shell.t("statusLoadingNameSuggest"));
  try {
    const data = await state.shell.api("/api/name-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_text: source,
        translation_mode: state.translateMode,
        book_id: state.bookId,
        set_name: state.bookActiveNameSet,
        dict_type: "name",
        scope: "book",
      }),
    });
    renderBookNameSuggestRows(data.items || [], data.right_items || []);
    refs.bookNameSuggestDialog.showModal();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function openBookNameEntrySuggestFromList(source, target) {
  refs.bookNameSource.value = String(source || "").trim();
  refs.bookNameTarget.value = String(target || "").trim();
  await openBookNameSuggestDialog(source);
}

async function loadBookNameSets() {
  if (!state.bookId) return;
  const data = await state.shell.api(`/api/name-sets?book_id=${encodeURIComponent(state.bookId)}`);
  state.bookNameSets = data.sets || { "Mặc định": {} };
  state.bookActiveNameSet = data.active_set || Object.keys(state.bookNameSets)[0] || "Mặc định";

  refs.bookNameSetSelect.innerHTML = "";
  for (const setName of Object.keys(state.bookNameSets)) {
    const opt = document.createElement("option");
    opt.value = setName;
    opt.textContent = setName;
    refs.bookNameSetSelect.appendChild(opt);
  }
  refs.bookNameSetSelect.value = state.bookActiveNameSet;
  renderBookNameRows();
}

async function openBookNameDialog() {
  if (!state.bookId) return;
  if (supportsRawTextReplace(state.book)) {
    await openBookReplaceDialog();
    return;
  }
  state.shell.showStatus(state.shell.t("statusLoadingBookNames"));
  try {
    await loadBookNameSets();
    refs.bookNameDialog.showModal();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function init() {
  state.shell = await initShell({
    page: "book",
    onSearchSubmit: (q) => state.shell.goSearchPage(q),
    onImported: (data) => {
      const book = data && data.book;
      const bid = book && book.book_id;
      if (bid) {
        const mode = effectiveModeForBook(book, state.translationEnabled ? "trans" : "raw");
        window.location.href = buildBookUrl(book, mode);
      }
    },
  });
  if (state.shell && typeof state.shell.getTranslationMode === "function") {
    state.translateMode = state.shell.getTranslationMode();
  }
  if (state.shell && typeof state.shell.getTranslationEnabled === "function") {
    state.translationEnabled = state.shell.getTranslationEnabled();
  }

  refs.bookInfoTitle.textContent = state.shell.t("bookInfoTitle");
  refs.bookEmpty.textContent = `${state.shell.t("noBookSelected")}. ${state.shell.t("noBookSelectedHint")}`;
  refs.btnOpenExtraLink.textContent = state.shell.t("openExtraLink");
  if (refs.bookCategoriesLabel) refs.bookCategoriesLabel.textContent = state.shell.t("bookCategoriesLabel");
  refs.btnOpenReaderFromBook.textContent = state.shell.t("openBookFromInfo");
  if (refs.btnDownloadBook) refs.btnDownloadBook.textContent = state.shell.t("downloadBook");
  if (refs.btnBookNameFilter) refs.btnBookNameFilter.textContent = state.shell.t("bookNameFilter");
  refs.btnOpenBookNames.textContent = state.shell.t("bookPrivateNames");
  refs.btnOpenBookEdit.textContent = state.shell.t("editBookFromInfo");

  refs.labelViewTitle.textContent = state.shell.t("viewTitleRaw");
  refs.labelViewTitleVi.textContent = state.shell.t("viewTitleVi");
  refs.labelViewAuthor.textContent = state.shell.t("viewAuthorRaw");
  refs.labelViewAuthorVi.textContent = state.shell.t("viewAuthorVi");
  refs.labelViewSummary.textContent = state.shell.t("viewSummary");
  refs.labelViewExtraLink.textContent = state.shell.t("viewExtraLink");
  if (refs.labelViewSourceDetail) refs.labelViewSourceDetail.textContent = state.shell.t("viewSourceDetail");
  if (refs.labelViewSourceFields) refs.labelViewSourceFields.textContent = state.shell.t("viewSourceFields");

  refs.tocTitle.textContent = state.shell.t("tocTitle");
  refs.btnTocModeRaw.textContent = state.shell.t("tocModeRaw");
  refs.btnTocModeTrans.textContent = state.shell.t("tocModeTrans");
  refs.btnTranslateTitles.textContent = state.shell.t("translateTitles");
  refs.btnTocPrev.textContent = state.shell.t("tocPrev");
  refs.btnTocNext.textContent = state.shell.t("tocNext");
  if (refs.tocPageSelect) {
    refs.tocPageSelect.title = state.shell.t("tocJumpPage");
    refs.tocPageSelect.setAttribute("aria-label", state.shell.t("tocJumpPage"));
  }
  if (refs.btnRefreshBookToc) {
    setTocIcon(refs.btnRefreshBookToc, "refresh");
    refs.btnRefreshBookToc.title = state.shell.t("checkBookUpdates");
    refs.btnRefreshBookToc.setAttribute("aria-label", state.shell.t("checkBookUpdates"));
  }

  refs.bookEditTitle.textContent = state.shell.t("bookEditTitle");
  refs.btnCloseBookEdit.textContent = state.shell.t("close");
  refs.labelFieldTitle.textContent = state.shell.t("fieldTitle");
  refs.labelFieldTitleVi.textContent = state.shell.t("fieldTitleVi");
  refs.labelFieldAuthor.textContent = state.shell.t("fieldAuthor");
  refs.labelFieldAuthorVi.textContent = state.shell.t("fieldAuthorVi");
  refs.labelFieldSummary.textContent = state.shell.t("fieldSummary");
  refs.labelFieldExtraLink.textContent = state.shell.t("fieldExtraLink");
  refs.labelFieldCoverUrl.textContent = state.shell.t("fieldCoverUrl");
  refs.btnUploadCover.textContent = state.shell.t("uploadCover");
  refs.btnApplyCoverUrl.textContent = state.shell.t("applyCoverUrl");
  refs.btnSaveMeta.textContent = state.shell.t("saveBookMeta");
  refs.bookNameTitle.textContent = state.shell.t("bookPrivateNamesTitle");
  refs.btnCloseBookNames.textContent = state.shell.t("close");
  refs.btnBookNameRefresh.textContent = state.shell.t("refreshNamePreview");
  refs.btnBookNameAddSet.textContent = state.shell.t("nameSetAdd");
  refs.btnBookNameDelSet.textContent = state.shell.t("nameSetDelete");
  refs.btnBookNameQuickAdd.textContent = state.shell.t("nameSetQuickAdd");
  refs.btnBookNameExport.textContent = state.shell.t("nameSetExport");
  refs.btnBookNameImport.textContent = state.shell.t("nameSetImport");
  refs.bookNameSetLabel.textContent = state.shell.t("nameSetLabel");
  refs.bookNameCount.textContent = state.shell.t("bookNameCount", { count: 0 });
  refs.btnBookNameSaveEntry.textContent = state.shell.t("addNameEntry");
  refs.bookNameBulkTitle.textContent = state.shell.t("nameSetQuickAddTitle");
  refs.btnCloseBookNameBulk.textContent = state.shell.t("close");
  refs.bookNameBulkHint.textContent = state.shell.t("nameSetQuickAddHint");
  refs.bookNameBulkInputLabel.textContent = state.shell.t("nameSetQuickAddInput");
  refs.bookNameBulkInput.placeholder = state.shell.t("nameSetQuickAddPlaceholder");
  refs.btnCancelBookNameBulk.textContent = state.shell.t("cancel");
  refs.btnConfirmBookNameBulk.textContent = state.shell.t("nameSetQuickAdd");
  if (refs.bookNameFilterTitle) refs.bookNameFilterTitle.textContent = state.shell.t("bookNameFilterTitle");
  if (refs.btnCloseBookNameFilter) refs.btnCloseBookNameFilter.textContent = state.shell.t("close");
  updateBookNameFilterHint();
  if (refs.bookNameFilterScopeLabel) refs.bookNameFilterScopeLabel.textContent = state.shell.t("nameFilterScopeLabel");
  updateBookNameFilterScopeOptions();
  if (refs.bookNameFilterFirstNLabel) refs.bookNameFilterFirstNLabel.textContent = state.shell.t("nameFilterFirstNLabel");
  if (refs.bookNameFilterStartLabel) refs.bookNameFilterStartLabel.textContent = state.shell.t("nameFilterStartLabel");
  if (refs.bookNameFilterEndLabel) refs.bookNameFilterEndLabel.textContent = state.shell.t("nameFilterEndLabel");
  if (refs.bookNameFilterMinCountLabel) refs.bookNameFilterMinCountLabel.textContent = state.shell.t("nameFilterMinCountLabel");
  if (refs.bookNameFilterMinLengthLabel) refs.bookNameFilterMinLengthLabel.textContent = state.shell.t("nameFilterMinLengthLabel");
  if (refs.bookNameFilterMaxLengthLabel) refs.bookNameFilterMaxLengthLabel.textContent = state.shell.t("nameFilterMaxLengthLabel");
  if (refs.bookNameFilterMaxItemsLabel) refs.bookNameFilterMaxItemsLabel.textContent = state.shell.t("nameFilterMaxItemsLabel");
  if (refs.bookNameFilterMaxChaptersLabel) refs.bookNameFilterMaxChaptersLabel.textContent = state.shell.t("nameFilterMaxChaptersLabel");
  if (refs.bookNameFilterIncludeLabel) refs.bookNameFilterIncludeLabel.textContent = state.shell.t("nameFilterIncludeLabel");
  if (refs.bookNameFilterIncludePersonLabel) refs.bookNameFilterIncludePersonLabel.textContent = state.shell.t("nameFilterIncludePerson");
  if (refs.bookNameFilterIncludePlaceLabel) refs.bookNameFilterIncludePlaceLabel.textContent = state.shell.t("nameFilterIncludePlace");
  if (refs.bookNameFilterIncludeTitleLabel) refs.bookNameFilterIncludeTitleLabel.textContent = state.shell.t("nameFilterIncludeTitle");
  if (refs.bookNameFilterSkipExistingLabel) refs.bookNameFilterSkipExistingLabel.textContent = state.shell.t("nameFilterSkipExistingLabel");
  setBookNameFilterRunningUi();
  renderBookNameFilterSummary(state.bookNameFilterMeta);
  if (refs.bookNameFilterColSelect) refs.bookNameFilterColSelect.textContent = state.shell.t("nameFilterColSelect");
  if (refs.bookNameFilterColSource) refs.bookNameFilterColSource.textContent = state.shell.t("nameFilterColSource");
  if (refs.bookNameFilterColType) refs.bookNameFilterColType.textContent = state.shell.t("nameFilterColType");
  if (refs.bookNameFilterColTarget) refs.bookNameFilterColTarget.textContent = state.shell.t("nameFilterColTarget");
  if (refs.bookNameFilterColHv) refs.bookNameFilterColHv.textContent = state.shell.t("nameFilterColHv");
  if (refs.bookNameFilterColMeta) refs.bookNameFilterColMeta.textContent = state.shell.t("nameFilterColMeta");
  if (refs.bookNameFilterColContext) refs.bookNameFilterColContext.textContent = state.shell.t("nameFilterColContext");
  if (refs.bookNameFilterSelectAllLabel) refs.bookNameFilterSelectAllLabel.textContent = state.shell.t("nameFilterSelectAll");
  if (refs.btnBookNameFilterImport) refs.btnBookNameFilterImport.textContent = state.shell.t("nameFilterImportSelected");
  refs.bookNameSuggestTitle.textContent = state.shell.t("nameSuggestTitle");
  refs.btnCloseBookNameSuggest.textContent = state.shell.t("close");
  refs.bookNameSuggestHint.textContent = state.shell.t("nameSuggestHint");
  refs.bookNameSuggestColIndex.textContent = state.shell.t("nameSuggestColIndex");
  refs.bookNameSuggestColSource.textContent = state.shell.t("nameSuggestColSource");
  refs.bookNameSuggestColHv.textContent = state.shell.t("nameSuggestColHv");
  refs.bookNameSuggestColTarget.textContent = state.shell.t("nameSuggestColTarget");
  refs.bookNameSuggestColOrigin.textContent = state.shell.t("nameSuggestColOrigin");
  refs.bookNameSuggestColAction.textContent = state.shell.t("nameSuggestColAction");
  refs.btnBookNameSuggestGoogleTranslate.textContent = state.shell.t("nameSuggestGoogleTranslate");
  refs.btnBookNameSuggestGoogleSearch.textContent = state.shell.t("nameSuggestGoogleSearch");
  if (refs.bookReplaceTitle) refs.bookReplaceTitle.textContent = state.shell.t("replaceEditorTitle");
  if (refs.btnCloseBookReplaces) refs.btnCloseBookReplaces.textContent = state.shell.t("close");
  if (refs.btnBookReplaceRefresh) refs.btnBookReplaceRefresh.textContent = state.shell.t("refreshNamePreview");
  if (refs.bookReplaceHint) refs.bookReplaceHint.textContent = state.shell.t("replaceEditorHint");
  if (refs.bookReplaceSourceLabel) refs.bookReplaceSourceLabel.textContent = state.shell.t("replaceSourceLabel");
  if (refs.bookReplaceTargetLabel) refs.bookReplaceTargetLabel.textContent = state.shell.t("replaceTargetLabel");
  if (refs.bookReplaceRegexLabel) refs.bookReplaceRegexLabel.textContent = state.shell.t("junkRegexLabel");
  if (refs.bookReplaceIgnoreCaseLabel) refs.bookReplaceIgnoreCaseLabel.textContent = state.shell.t("junkIgnoreCaseLabel");
  if (refs.btnBookReplaceSaveEntry) refs.btnBookReplaceSaveEntry.textContent = state.shell.t("addNameEntry");
  if (refs.bookReplacePreviewHint) refs.bookReplacePreviewHint.textContent = state.shell.t("replacePreviewEmpty");
  if (refs.bookReplaceColSource) refs.bookReplaceColSource.textContent = state.shell.t("replaceColSource");
  if (refs.bookReplaceColTarget) refs.bookReplaceColTarget.textContent = state.shell.t("replaceColTarget");
  if (refs.bookReplaceColAction) refs.bookReplaceColAction.textContent = state.shell.t("replaceColAction");
  if (refs.bookCategoriesDialogTitle) refs.bookCategoriesDialogTitle.textContent = state.shell.t("bookCategoriesDialogTitle");
  if (refs.btnCloseBookCategoriesDialog) refs.btnCloseBookCategoriesDialog.textContent = state.shell.t("close");
  if (refs.bookCategoriesDialogSearchLabel) refs.bookCategoriesDialogSearchLabel.textContent = state.shell.t("categorySearchLabel");
  if (refs.btnCancelBookCategoriesDialog) refs.btnCancelBookCategoriesDialog.textContent = state.shell.t("cancel");
  if (refs.btnSaveBookCategoriesDialog) refs.btnSaveBookCategoriesDialog.textContent = state.shell.t("save");
  renderBookInfoSkeleton();
  renderTocSkeleton();
  refs.bookCover.addEventListener("error", () => {
    const fallbackUrl = String(refs.bookCover.dataset.fallbackUrl || "").trim();
    if (!fallbackUrl || refs.bookCover.dataset.fallbackApplied === "1") return;
    refs.bookCover.dataset.fallbackApplied = "1";
    refs.bookCover.src = fallbackUrl;
  });

  refs.btnOpenExtraLink.addEventListener("click", () => {
    if (!state.book || !state.book.extra_link) return;
    window.open(state.book.extra_link, "_blank", "noopener,noreferrer");
  });

  refs.btnOpenReaderFromBook.addEventListener("click", () => {
    if (!state.bookId) return;
    const targetChapterId = state.book && state.book.last_read_chapter_id ? state.book.last_read_chapter_id : "";
    const mode = effectiveModeForBook(state.book, state.mode);
    window.location.href = buildReaderUrl(state.book || state.bookId, targetChapterId, mode);
  });
  if (refs.btnBookCategoriesEdit) refs.btnBookCategoriesEdit.addEventListener("click", () => {
    openBookCategoriesDialog().catch(() => {});
  });
  if (refs.btnCloseBookCategoriesDialog) refs.btnCloseBookCategoriesDialog.addEventListener("click", () => {
    if (refs.bookCategoriesDialog && refs.bookCategoriesDialog.open) refs.bookCategoriesDialog.close();
  });
  if (refs.btnCancelBookCategoriesDialog) refs.btnCancelBookCategoriesDialog.addEventListener("click", () => {
    if (refs.bookCategoriesDialog && refs.bookCategoriesDialog.open) refs.bookCategoriesDialog.close();
  });
  if (refs.bookCategoriesDialogSearch) refs.bookCategoriesDialogSearch.addEventListener("input", renderBookCategoriesDialogList);
  if (refs.btnSaveBookCategoriesDialog) refs.btnSaveBookCategoriesDialog.addEventListener("click", () => {
    saveBookCategories().catch(() => {});
  });
  if (refs.btnDownloadBook) refs.btnDownloadBook.addEventListener("click", () => {
    downloadBookChapters().catch(() => {});
  });
  if (refs.btnBookNameFilter) refs.btnBookNameFilter.addEventListener("click", () => {
    openBookNameFilterDialog().catch(() => {});
  });
  refs.btnOpenBookNames.addEventListener("click", openBookNameDialog);
  refs.btnOpenBookEdit.addEventListener("click", () => refs.bookEditDialog.showModal());
  refs.btnCloseBookEdit.addEventListener("click", () => refs.bookEditDialog.close());
  refs.btnCloseBookNames.addEventListener("click", () => refs.bookNameDialog.close());
  if (refs.btnCloseBookNameFilter) refs.btnCloseBookNameFilter.addEventListener("click", () => refs.bookNameFilterDialog.close());
  if (refs.btnCloseBookReplaces) refs.btnCloseBookReplaces.addEventListener("click", () => refs.bookReplaceDialog.close());
  if (refs.btnBookReplaceRefresh) refs.btnBookReplaceRefresh.addEventListener("click", () => {
    openBookReplaceDialog().catch(() => {});
  });
  refs.btnCloseBookNameBulk.addEventListener("click", () => refs.bookNameBulkDialog.close());
  refs.btnCloseBookNameSuggest.addEventListener("click", () => refs.bookNameSuggestDialog.close());
  refs.btnCancelBookNameBulk.addEventListener("click", () => refs.bookNameBulkDialog.close());
  if (refs.bookNameFilterDialog) refs.bookNameFilterDialog.addEventListener("close", () => {
    clearBookNameFilterWatcher({ resetJob: true });
    state.bookNameFilterResults = [];
    state.bookNameFilterMeta = null;
    renderBookNameFilterSummary(null);
    renderBookNameFilterRows();
  });
  refs.bookNameBulkDialog.addEventListener("close", () => {
    if (refs.bookNameBulkForm) refs.bookNameBulkForm.reset();
  });
  refs.bookNameBulkForm.addEventListener("submit", submitBookNameBulkEntries);
  if (refs.bookNameFilterScope) refs.bookNameFilterScope.addEventListener("change", syncBookNameFilterScopeFields);
  if (refs.bookNameFilterForm) refs.bookNameFilterForm.addEventListener("submit", submitBookNameFilterPreview);
  if (refs.bookNameFilterSelectAll) refs.bookNameFilterSelectAll.addEventListener("change", () => {
    if (isBookNameFilterJobActive()) return;
    const checked = Boolean(refs.bookNameFilterSelectAll.checked);
    for (const item of Array.isArray(state.bookNameFilterResults) ? state.bookNameFilterResults : []) {
      if (!item) continue;
      item.selected = checked;
    }
    renderBookNameFilterRows();
  });
  if (refs.btnBookNameFilterImport) refs.btnBookNameFilterImport.addEventListener("click", () => {
    importSelectedBookNameFilterRows().catch(() => {});
  });
  refs.bookNameSource.addEventListener("input", syncBookNameSuggestExternalActions);
  if (refs.btnBookNameSuggestGoogleTranslate) {
    refs.btnBookNameSuggestGoogleTranslate.addEventListener("click", () => {
      const source = currentBookNameSuggestSourceText();
      if (!source) return;
      window.open(
        `https://translate.google.com/?sl=zh-CN&tl=vi&text=${encodeURIComponent(source)}&op=translate`,
        "_blank",
        "noopener,noreferrer",
      );
    });
  }
  if (refs.btnBookNameSuggestGoogleSearch) {
    refs.btnBookNameSuggestGoogleSearch.addEventListener("click", () => {
      const source = currentBookNameSuggestSourceText();
      if (!source) return;
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(source)}`,
        "_blank",
        "noopener,noreferrer",
      );
    });
  }
  refs.btnBookNameRefresh.addEventListener("click", loadBookNameSets);
  refs.btnBookNameAddSet.addEventListener("click", async () => {
    const setName = window.prompt(state.shell.t("promptNameSetNew"), "");
    const trimmed = String(setName || "").trim();
    if (!trimmed) return;
    if (state.bookNameSets[trimmed]) {
      state.shell.showToast(state.shell.t("nameSetExists"));
      return;
    }
    const sets = { ...state.bookNameSets, [trimmed]: {} };
    state.shell.showStatus(state.shell.t("statusSwitchingNameSet"));
    try {
      await state.shell.api("/api/name-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sets, active_set: trimmed, bump_version: false, book_id: state.bookId }),
      });
      await refreshBookNameEffects();
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    } finally {
      state.shell.hideStatus();
    }
  });
  refs.btnBookNameDelSet.addEventListener("click", async () => {
    const names = Object.keys(state.bookNameSets || {});
    if (names.length <= 1) {
      state.shell.showToast(state.shell.t("nameSetNeedOne"));
      return;
    }
    if (!window.confirm(state.shell.t("confirmDeleteNameSet"))) {
      return;
    }
    const nextSets = { ...state.bookNameSets };
    delete nextSets[state.bookActiveNameSet];
    const nextActive = Object.keys(nextSets)[0] || "Mặc định";
    state.shell.showStatus(state.shell.t("statusSwitchingNameSet"));
    try {
      await state.shell.api("/api/name-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sets: nextSets, active_set: nextActive, bump_version: false, book_id: state.bookId }),
      });
      await refreshBookNameEffects();
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    } finally {
      state.shell.hideStatus();
    }
  });
  refs.btnBookNameQuickAdd.addEventListener("click", openBookNameBulkDialog);
  refs.btnBookNameExport.addEventListener("click", () => {
    const active = state.bookActiveNameSet || "Mặc định";
    const filename = `book_name_set_${active}`.replace(/[^\w\-]+/g, "_");
    downloadPlainTextFile(buildBookNameExportText(), `${filename}.txt`);
  });
  refs.btnBookNameImport.addEventListener("click", () => refs.bookNameImportFile.click());
  refs.bookNameImportFile.addEventListener("change", async () => {
    const file = refs.bookNameImportFile.files && refs.bookNameImportFile.files[0];
    refs.bookNameImportFile.value = "";
    if (!file) return;
    try {
      const raw = await file.text();
      const entries = parseBookNameEntriesOrThrow(raw);
      await applyBookNameEntries(entries, { replace: true, toastKey: "nameSetImported" });
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    }
  });
  refs.bookNameEntryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const source = refs.bookNameSource.value.trim();
    const target = refs.bookNameTarget.value.trim();
    if (!source || !target) {
      state.shell.showToast(state.shell.t("nameSourceTargetRequired"));
      return;
    }
    await updateBookNameEntry(source, target, false);
    refs.bookNameEntryForm.reset();
  });
  refs.bookNameSetSelect.addEventListener("change", async () => {
    if (!state.bookId) return;
    const chosen = refs.bookNameSetSelect.value;
    state.shell.showStatus(state.shell.t("statusSwitchingNameSet"));
    try {
      const data = await state.shell.api("/api/name-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active_set: chosen, bump_version: false, book_id: state.bookId }),
      });
      state.bookNameSets = data.sets || state.bookNameSets;
      state.bookActiveNameSet = data.active_set || chosen;
      renderBookNameRows();
      await loadBook({ silent: true, suppressToast: true });
      if (state.book) {
        await loadToc(Math.max(1, Number(state.pagination.page || 1)), { silent: true, suppressToast: true });
      }
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    } finally {
      state.shell.hideStatus();
    }
  });
  if (refs.bookReplaceEntryForm) refs.bookReplaceEntryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const source = String(refs.bookReplaceSource && refs.bookReplaceSource.value || "").trim();
    const target = String(refs.bookReplaceTarget && refs.bookReplaceTarget.value || "").trim();
    const useRegex = Boolean(refs.bookReplaceRegexInput && refs.bookReplaceRegexInput.checked);
    const ignoreCase = Boolean(refs.bookReplaceIgnoreCaseInput && refs.bookReplaceIgnoreCaseInput.checked);
    if (!source) {
      state.shell.showToast(state.shell.t("replaceSourceRequired"));
      if (refs.bookReplaceSource) refs.bookReplaceSource.focus();
      return;
    }
    if (!target) {
      state.shell.showToast(state.shell.t("replaceTargetRequired"));
      if (refs.bookReplaceTarget) refs.bookReplaceTarget.focus();
      return;
    }
    if (!ensureValidRegexOrToast(source, useRegex)) {
      if (refs.bookReplaceSource) refs.bookReplaceSource.focus();
      return;
    }
    try {
      const result = await state.shell.api(`/api/book-replaces/book/${encodeURIComponent(state.bookId)}/entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          target,
          use_regex: useRegex,
          ignore_case: ignoreCase,
        }),
      });
      syncBookReplaceEntriesFromState(result);
      renderBookReplaceRows();
      refs.bookReplaceEntryForm.reset();
      state.shell.showToast(state.shell.t("replaceEntryApplied"));
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    }
  });

  refs.bookMetaForm.addEventListener("submit", saveMeta);
  refs.btnUploadCover.addEventListener("click", () => refs.coverUploadInput.click());
  refs.coverUploadInput.addEventListener("change", async () => {
    const f = refs.coverUploadInput.files && refs.coverUploadInput.files[0];
    if (!f) return;
    await uploadCover(f);
    refs.coverUploadInput.value = "";
  });
  refs.btnApplyCoverUrl.addEventListener("click", applyCoverUrl);

  refs.btnTocModeRaw.addEventListener("click", async () => {
    state.mode = "raw";
    await loadBook();
    await loadToc(1);
  });
  refs.btnTocModeTrans.addEventListener("click", async () => {
    state.mode = "trans";
    await loadBook();
    await loadToc(1);
  });
  refs.btnTranslateTitles.addEventListener("click", translateTitles);
  if (refs.btnRefreshBookToc) refs.btnRefreshBookToc.addEventListener("click", () => {
    refreshBookToc().catch(() => {});
  });
  refs.btnTocPrev.addEventListener("click", () => {
    if (state.pagination.page > 1) loadToc(state.pagination.page - 1);
  });
  if (refs.tocPageSelect) {
    refs.tocPageSelect.addEventListener("change", () => {
      const nextPage = Math.max(1, Number(refs.tocPageSelect.value || 1));
      if (nextPage === Number(state.pagination.page || 1)) return;
      loadToc(nextPage);
    });
  }
  refs.btnTocNext.addEventListener("click", () => {
    if (state.pagination.page < state.pagination.total_pages) loadToc(state.pagination.page + 1);
  });

  window.addEventListener("reader-settings-changed", () => {
    if (!state.bookId) return;
    const prevEnabled = state.translationEnabled;
    const enabled = state.shell && typeof state.shell.getTranslationEnabled === "function"
      ? state.shell.getTranslationEnabled()
      : true;
    const mode = state.shell && typeof state.shell.getTranslationMode === "function"
      ? state.shell.getTranslationMode()
      : state.translateMode;
    const localSig = localTranslationSettingsSignature(state.shell);
    const localChanged = localSig !== state.translationLocalSig;
    if (enabled === state.translationEnabled && mode === state.translateMode && !((["local", "hanviet", "dichngay_local"].includes(mode)) && localChanged)) return;
    state.translationEnabled = enabled;
    state.translationLocalSig = localSig;
    if (!enabled) {
      state.mode = "raw";
    } else if (!prevEnabled && state.book && supportsTranslation(state.book)) {
      state.mode = "trans";
    }
    if (state.shell && typeof state.shell.getTranslationMode === "function") {
      state.translateMode = mode;
    }
    const keepPage = Math.max(1, Number(state.pagination.page || 1));
    loadBook()
      .then(() => loadToc(keepPage))
      .catch(() => {});
  });

  window.addEventListener("reader-cache-changed", (event) => {
    if (!state.bookId) return;
    if (!isCacheEventForCurrentBook(event && event.detail)) return;
    refreshDownloadStateSilent().catch(() => {});
  });

  window.addEventListener("beforeunload", () => {
    clearDownloadWatcher();
  });

  const query = state.shell.parseQuery();
  state.translationLocalSig = localTranslationSettingsSignature(state.shell);
  state.bookId = (query.book_id || "").trim();
  state.translationSupportedHint = parseBooleanLike(query.translation_supported);
  state.isComicHint = parseBooleanLike(query.is_comic);
  state.mode = (query.mode || "trans").toLowerCase() === "raw" ? "raw" : "trans";
  if (!state.translationEnabled || state.translationSupportedHint === false) {
    state.mode = "raw";
  }
  applyInitialBookUiHints();

  await Promise.all([
    loadCategories({ silent: true }).catch(() => null),
    loadBook({ refreshOnline: true, showSkeleton: true }),
  ]);
  await loadToc(1, { showSkeleton: true });
  startDownloadWatcher();
}

init();
