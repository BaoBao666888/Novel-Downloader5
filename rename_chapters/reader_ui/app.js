import { t } from "./i18n.vi.js";
import { buildParagraphNodes } from "./js/reader_text.js";
import { createNameEditor } from "./js/name_editor.js";

const SETTINGS_KEY = "reader.ui.settings.v2";

const DEFAULT_SETTINGS = {
  themeId: "sao_dem",
  fontFamily: "'Noto Serif', 'Palatino Linotype', 'Times New Roman', serif",
  fontSize: 21,
  textAlign: "justify",
  lineHeight: 1.9,
  paragraphSpacing: 1.1,
  readingMode: "vertical",
};

const refs = {
  appTitle: document.getElementById("app-title"),
  appSubtitle: document.getElementById("app-subtitle"),
  navLibrary: document.getElementById("nav-library"),
  navBook: document.getElementById("nav-book"),
  navReader: document.getElementById("nav-reader"),

  searchInput: document.getElementById("search-input"),
  btnImport: document.getElementById("btn-import"),
  btnClearCache: document.getElementById("btn-clear-cache"),
  btnOpenSettings: document.getElementById("btn-open-settings"),

  pageLibrary: document.getElementById("page-library"),
  pageBook: document.getElementById("page-book"),
  pageBookEdit: document.getElementById("page-book-edit"),
  pageReader: document.getElementById("page-reader"),

  libraryTitle: document.getElementById("library-title"),
  libraryCount: document.getElementById("library-count"),
  libraryGrid: document.getElementById("library-grid"),
  libraryEmpty: document.getElementById("library-empty"),

  chapterHitsTitle: document.getElementById("chapter-hits-title"),
  chapterHitList: document.getElementById("chapter-hit-list"),
  chapterHitsEmpty: document.getElementById("chapter-hits-empty"),

  bookInfoTitle: document.getElementById("book-info-title"),
  bookEditTitle: document.getElementById("book-edit-title"),
  bookEmpty: document.getElementById("book-empty"),
  bookEditEmpty: document.getElementById("book-edit-empty"),
  bookViewWrap: document.getElementById("book-view-wrap"),
  bookEditWrap: document.getElementById("book-edit-wrap"),
  bookCover: document.getElementById("book-cover"),
  bookCoverFallback: document.getElementById("book-cover-fallback"),
  bookTitleDisplay: document.getElementById("book-title-display"),
  bookSubtitle: document.getElementById("book-subtitle"),
  btnOpenExtraLink: document.getElementById("btn-open-extra-link"),
  btnOpenReaderFromBook: document.getElementById("btn-open-reader-from-book"),
  btnOpenBookEdit: document.getElementById("btn-open-book-edit"),
  btnBackBookView: document.getElementById("btn-back-book-view"),

  labelViewTitle: document.getElementById("label-view-title"),
  labelViewTitleVi: document.getElementById("label-view-title-vi"),
  labelViewAuthor: document.getElementById("label-view-author"),
  labelViewAuthorVi: document.getElementById("label-view-author-vi"),
  labelViewSummary: document.getElementById("label-view-summary"),
  labelViewExtraLink: document.getElementById("label-view-extra-link"),
  viewTitle: document.getElementById("view-title"),
  viewTitleVi: document.getElementById("view-title-vi"),
  viewAuthor: document.getElementById("view-author"),
  viewAuthorVi: document.getElementById("view-author-vi"),
  viewSummary: document.getElementById("view-summary"),
  viewExtraLink: document.getElementById("view-extra-link"),

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

  tocTitle: document.getElementById("toc-title"),
  btnTocModeRaw: document.getElementById("btn-toc-mode-raw"),
  btnTocModeTrans: document.getElementById("btn-toc-mode-trans"),
  btnTranslateTitles: document.getElementById("btn-translate-titles"),
  tocList: document.getElementById("toc-list"),
  btnTocPrev: document.getElementById("btn-toc-prev"),
  btnTocNext: document.getElementById("btn-toc-next"),

  readerBookTitle: document.getElementById("reader-book-title"),
  readerChapterSub: document.getElementById("reader-chapter-sub"),
  readerChapterTitle: document.getElementById("reader-chapter-title"),
  readerViewport: document.getElementById("reader-viewport"),
  readerContentScroll: document.getElementById("reader-content-scroll"),
  readerContentBody: document.getElementById("reader-content-body"),
  readerProgress: document.getElementById("reader-progress"),

  btnReaderToc: document.getElementById("btn-reader-toc"),
  btnModeRaw: document.getElementById("btn-mode-raw"),
  btnModeTrans: document.getElementById("btn-mode-trans"),
  btnTranslateMode: document.getElementById("btn-translate-mode"),
  btnOpenNameEditor: document.getElementById("btn-open-name-editor"),
  btnFoliate: document.getElementById("btn-foliate"),
  btnFullscreen: document.getElementById("btn-fullscreen"),
  btnPrev: document.getElementById("btn-prev"),
  btnNext: document.getElementById("btn-next"),

  settingsDrawer: document.getElementById("settings-drawer"),
  settingsBackdrop: document.getElementById("settings-backdrop"),
  settingsTitle: document.getElementById("settings-title"),
  btnCloseSettings: document.getElementById("btn-close-settings"),
  settingsForm: document.getElementById("settings-form"),
  labelTheme: document.getElementById("label-theme"),
  themeSelect: document.getElementById("theme-select"),
  labelFontFamily: document.getElementById("label-font-family"),
  fontFamilyInput: document.getElementById("font-family-input"),
  labelFontSize: document.getElementById("label-font-size"),
  fontSizeInput: document.getElementById("font-size-input"),
  fontSizeValue: document.getElementById("font-size-value"),
  labelTextAlign: document.getElementById("label-text-align"),
  textAlignSelect: document.getElementById("text-align-select"),
  alignJustify: document.getElementById("align-justify"),
  alignLeft: document.getElementById("align-left"),
  alignCenter: document.getElementById("align-center"),
  labelLineHeight: document.getElementById("label-line-height"),
  lineHeightInput: document.getElementById("line-height-input"),
  lineHeightValue: document.getElementById("line-height-value"),
  labelParagraphSpacing: document.getElementById("label-paragraph-spacing"),
  paragraphSpacingInput: document.getElementById("paragraph-spacing-input"),
  paragraphSpacingValue: document.getElementById("paragraph-spacing-value"),
  labelReadingMode: document.getElementById("label-reading-mode"),
  readingModeSelect: document.getElementById("reading-mode-select"),
  modeFlip: document.getElementById("mode-flip"),
  modeHorizontal: document.getElementById("mode-horizontal"),
  modeVertical: document.getElementById("mode-vertical"),
  modeHybrid: document.getElementById("mode-hybrid"),
  btnSaveSettings: document.getElementById("btn-save-settings"),
  btnResetSettings: document.getElementById("btn-reset-settings"),

  readerTocDrawer: document.getElementById("reader-toc-drawer"),
  readerTocTitle: document.getElementById("reader-toc-title"),
  readerTocList: document.getElementById("reader-toc-list"),
  btnCloseReaderToc: document.getElementById("btn-close-reader-toc"),

  importDialog: document.getElementById("import-dialog"),
  importForm: document.getElementById("import-form"),
  importTitle: document.getElementById("import-title"),
  importFileLabel: document.getElementById("import-file-label"),
  importLangLabel: document.getElementById("import-lang-label"),
  importBookTitleLabel: document.getElementById("import-book-title-label"),
  importAuthorLabel: document.getElementById("import-author-label"),
  importFile: document.getElementById("import-file"),
  importLang: document.getElementById("import-lang"),
  importLangZh: document.getElementById("import-lang-zh"),
  importLangVi: document.getElementById("import-lang-vi"),
  importBookTitle: document.getElementById("import-book-title"),
  importAuthor: document.getElementById("import-author"),
  btnImportCancel: document.getElementById("btn-import-cancel"),
  btnImportSubmit: document.getElementById("btn-import-submit"),

  statusDialog: document.getElementById("status-dialog"),
  statusText: document.getElementById("status-text"),

  foliateDialog: document.getElementById("foliate-dialog"),
  foliateTitle: document.getElementById("foliate-title"),
  foliateFrame: document.getElementById("foliate-frame"),
  btnCloseFoliate: document.getElementById("btn-close-foliate"),

  bookActionsDialog: document.getElementById("book-actions-dialog"),
  bookActionsTitle: document.getElementById("book-actions-title"),
  bookActionsSubtitle: document.getElementById("book-actions-subtitle"),
  btnCloseBookActions: document.getElementById("btn-close-book-actions"),
  btnActionOpenBook: document.getElementById("btn-action-open-book"),
  btnActionOpenReader: document.getElementById("btn-action-open-reader"),
  btnActionOpenEdit: document.getElementById("btn-action-open-edit"),
  btnActionExportTxt: document.getElementById("btn-action-export-txt"),
  btnActionExportEpub: document.getElementById("btn-action-export-epub"),
  btnActionDeleteBook: document.getElementById("btn-action-delete-book"),

  nameEditorDialog: document.getElementById("name-editor-dialog"),
  nameEditorTitle: document.getElementById("name-editor-title"),
  btnCloseNameEditor: document.getElementById("btn-close-name-editor"),
  btnRefreshNamePreview: document.getElementById("btn-refresh-name-preview"),
  nameSetLabel: document.getElementById("name-set-label"),
  nameSetSelect: document.getElementById("name-set-select"),
  nameEntryForm: document.getElementById("name-entry-form"),
  nameSourceLabel: document.getElementById("name-source-label"),
  nameTargetLabel: document.getElementById("name-target-label"),
  nameSourceInput: document.getElementById("name-source-input"),
  nameTargetInput: document.getElementById("name-target-input"),
  btnAddNameEntry: document.getElementById("btn-add-name-entry"),
  namePreviewHint: document.getElementById("name-preview-hint"),
  namePreviewBody: document.getElementById("name-preview-body"),
  nameColSource: document.getElementById("name-col-source"),
  nameColTarget: document.getElementById("name-col-target"),
  nameColCount: document.getElementById("name-col-count"),
  nameColAction: document.getElementById("name-col-action"),

  toast: document.getElementById("toast"),
};

const state = {
  books: [],
  chapterHits: [],
  selectedBookId: null,
  selectedBookDetail: null,
  selectedChapterId: null,
  themes: [],
  page: "library",
  tocItems: [],
  tocPagination: {
    page: 1,
    page_size: 40,
    total_items: 0,
    total_pages: 1,
  },
  mode: "trans",
  tocMode: "trans",
  translateMode: "server",
  settings: loadSettings(),
  searchTimer: null,
  saveProgressTimer: null,
  autoSwitchingChapter: false,
  chapterContentCache: new Map(),
  selectedBookActionId: null,
  stream: {
    enabled: false,
    mode: "single",
    loadedIds: [],
    nextIndex: -1,
    prevIndex: -1,
    loading: false,
  },
};

const nameEditor = createNameEditor({
  refs,
  api,
  t,
  showToast,
  showStatus,
  hideStatus,
  getContext: () => ({
    chapterId: state.selectedChapterId,
    translationMode: state.translateMode,
  }),
  onApplied: async () => {
    if (!state.selectedBookDetail) return;
    const anchorChapterId = state.selectedChapterId;
    const anchorRatio = getCurrentScrollRatio();
    const detailMode = state.mode === "trans" ? "trans" : state.tocMode;
    state.chapterContentCache.clear();
    const detail = await fetchBookDetail(state.selectedBookDetail.book_id, detailMode);
    state.selectedBookDetail = detail;
    populateBookMeta(detail);
    renderReaderToc();
    await loadTocPage(state.tocPagination.page || 1);
    if (anchorChapterId) {
      await selectChapter(anchorChapterId, { restoreRatio: anchorRatio });
    }
    await loadBooks(refs.searchInput.value.trim());
  },
});

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { ...DEFAULT_SETTINGS };
    }
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettingsLocal() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function applyI18n() {
  refs.appTitle.textContent = t("appTitle");
  refs.appSubtitle.textContent = t("appSubtitle");
  refs.navLibrary.textContent = t("navLibrary");
  refs.navBook.textContent = t("navBook");
  refs.navReader.textContent = t("navReader");

  refs.searchInput.placeholder = t("searchPlaceholder");
  refs.btnImport.textContent = t("import");
  refs.btnClearCache.textContent = t("clearCache");
  refs.btnOpenSettings.textContent = t("openSettings");

  refs.libraryTitle.textContent = t("libraryTitle");
  refs.chapterHitsTitle.textContent = t("chapterHitsTitle");
  refs.chapterHitsEmpty.textContent = t("chapterHitsEmpty");

  refs.bookInfoTitle.textContent = t("bookInfoTitle");
  refs.bookEditTitle.textContent = t("bookEditTitle");
  refs.bookEmpty.textContent = `${t("noBookSelected")}. ${t("noBookSelectedHint")}`;
  refs.bookEditEmpty.textContent = `${t("noBookSelected")}. ${t("noBookSelectedHint")}`;
  refs.bookCoverFallback.textContent = t("noCover");
  refs.btnOpenExtraLink.textContent = t("openExtraLink");
  refs.btnOpenReaderFromBook.textContent = t("openBookFromInfo");
  refs.btnOpenBookEdit.textContent = t("editBookFromInfo");
  refs.btnBackBookView.textContent = t("backBookInfo");

  refs.labelViewTitle.textContent = t("viewTitleRaw");
  refs.labelViewTitleVi.textContent = t("viewTitleVi");
  refs.labelViewAuthor.textContent = t("viewAuthorRaw");
  refs.labelViewAuthorVi.textContent = t("viewAuthorVi");
  refs.labelViewSummary.textContent = t("viewSummary");
  refs.labelViewExtraLink.textContent = t("viewExtraLink");
  refs.labelFieldTitle.textContent = t("fieldTitle");
  refs.labelFieldTitleVi.textContent = t("fieldTitleVi");
  refs.labelFieldAuthor.textContent = t("fieldAuthor");
  refs.labelFieldAuthorVi.textContent = t("fieldAuthorVi");
  refs.labelFieldSummary.textContent = t("fieldSummary");
  refs.labelFieldExtraLink.textContent = t("fieldExtraLink");
  refs.labelFieldCoverUrl.textContent = t("fieldCoverUrl");
  refs.btnUploadCover.textContent = t("uploadCover");
  refs.btnApplyCoverUrl.textContent = t("applyCoverUrl");
  refs.btnSaveMeta.textContent = t("saveBookMeta");

  refs.tocTitle.textContent = t("tocTitle");
  refs.btnTocModeRaw.textContent = t("tocModeRaw");
  refs.btnTocModeTrans.textContent = t("tocModeTrans");
  refs.btnTranslateTitles.textContent = t("translateTitles");
  refs.btnTocPrev.textContent = t("tocPrev");
  refs.btnTocNext.textContent = t("tocNext");

  refs.readerBookTitle.textContent = t("noBookSelected");
  refs.readerChapterSub.textContent = "";
  refs.readerChapterTitle.textContent = t("readerEmpty");
  refs.btnReaderToc.textContent = t("readerToc");
  refs.btnModeRaw.textContent = t("raw");
  refs.btnModeTrans.textContent = t("trans");
  refs.btnTranslateMode.textContent = t("modeServer");
  refs.btnOpenNameEditor.textContent = t("openNameEditor");
  refs.btnFoliate.textContent = t("openFoliate");
  refs.btnFullscreen.textContent = t("fullscreen");
  refs.btnPrev.textContent = t("prev");
  refs.btnNext.textContent = t("next");
  refs.readerProgress.textContent = t("progressEmpty");

  refs.settingsTitle.textContent = t("settingsTitle");
  refs.btnCloseSettings.textContent = t("closeSettings");
  refs.labelTheme.textContent = t("theme");
  refs.labelFontFamily.textContent = t("fontFamily");
  refs.fontFamilyInput.placeholder = t("fontFamilyPlaceholder");
  refs.labelFontSize.textContent = t("fontSize");
  refs.labelTextAlign.textContent = t("textAlign");
  refs.alignJustify.textContent = t("alignJustify");
  refs.alignLeft.textContent = t("alignLeft");
  refs.alignCenter.textContent = t("alignCenter");
  refs.labelLineHeight.textContent = t("lineHeight");
  refs.labelParagraphSpacing.textContent = t("paragraphSpacing");
  refs.labelReadingMode.textContent = t("readingMode");
  refs.modeFlip.textContent = t("modeFlip");
  refs.modeHorizontal.textContent = t("modeHorizontal");
  refs.modeVertical.textContent = t("modeVertical");
  refs.modeHybrid.textContent = t("modeHybrid");
  refs.btnSaveSettings.textContent = t("saveSettings");
  refs.btnResetSettings.textContent = t("resetSettings");

  refs.readerTocTitle.textContent = t("tocTitle");
  refs.btnCloseReaderToc.textContent = t("close");

  refs.importTitle.textContent = t("importTitle");
  refs.importFileLabel.textContent = t("importFile");
  refs.importLangLabel.textContent = t("importLang");
  refs.importBookTitleLabel.textContent = t("importBookTitle");
  refs.importAuthorLabel.textContent = t("importAuthor");
  refs.importLangZh.textContent = t("importLangZh");
  refs.importLangVi.textContent = t("importLangVi");
  refs.btnImportCancel.textContent = t("cancel");
  refs.btnImportSubmit.textContent = t("confirmImport");

  refs.foliateTitle.textContent = t("foliateTitle");

  refs.bookActionsTitle.textContent = t("bookActionsTitle");
  refs.btnCloseBookActions.textContent = t("closeBookActions");
  refs.btnActionOpenBook.textContent = t("openBookInfo");
  refs.btnActionOpenReader.textContent = t("openReader");
  refs.btnActionOpenEdit.textContent = t("openBookEdit");
  refs.btnActionExportTxt.textContent = t("exportTxt");
  refs.btnActionExportEpub.textContent = t("exportEpub");
  refs.btnActionDeleteBook.textContent = t("deleteBook");

  refs.nameEditorTitle.textContent = t("nameEditorTitle");
  refs.btnCloseNameEditor.textContent = t("close");
  refs.btnRefreshNamePreview.textContent = t("refreshNamePreview");
  refs.nameSetLabel.textContent = t("nameSetLabel");
  refs.nameSourceLabel.textContent = t("nameSourceLabel");
  refs.nameTargetLabel.textContent = t("nameTargetLabel");
  refs.btnAddNameEntry.textContent = t("addNameEntry");
  refs.nameColSource.textContent = t("nameColSource");
  refs.nameColTarget.textContent = t("nameColTarget");
  refs.nameColCount.textContent = t("nameColCount");
  refs.nameColAction.textContent = t("nameColAction");
  refs.namePreviewHint.textContent = t("namePreviewNeedChapter");
}

async function api(path, options = {}) {
  const res = await fetch(path, options);
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const message = (payload && payload.message) || (payload && payload.error_code) || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return payload;
}

function showToast(message) {
  refs.toast.textContent = message;
  refs.toast.classList.add("show");
  setTimeout(() => refs.toast.classList.remove("show"), 2400);
}

function showStatus(message) {
  refs.statusText.textContent = message;
  if (!refs.statusDialog.open) {
    refs.statusDialog.showModal();
  }
}

function hideStatus() {
  if (refs.statusDialog.open) {
    refs.statusDialog.close();
  }
}

function showPage(page) {
  state.page = page;
  for (const node of document.querySelectorAll(".page")) {
    node.classList.toggle("active", node.dataset.page === page);
  }
  refs.navLibrary.classList.toggle("active", page === "library");
  refs.navBook.classList.toggle("active", page === "book" || page === "book-edit");
  refs.navReader.classList.toggle("active", page === "reader");
}

function formatBookProgress(book) {
  if (!book || !book.last_read_chapter_id || typeof book.last_read_ratio !== "number") {
    return t("progressEmpty");
  }
  const ratio = Math.max(0, Math.min(1, Number(book.last_read_ratio) || 0));
  const detail = state.selectedBookDetail;
  let order = 1;
  if (detail && detail.book_id === book.book_id) {
    const matched = (detail.chapters || []).find((x) => x.chapter_id === book.last_read_chapter_id);
    if (matched && matched.chapter_order) {
      order = matched.chapter_order;
    }
  }
  return t("progressTemplate", {
    current: order,
    total: book.chapter_count || 0,
    percent: (ratio * 100).toFixed(1),
  });
}

function closeBookActions() {
  if (refs.bookActionsDialog.open) {
    refs.bookActionsDialog.close();
  }
}

function openBookActions(bookId) {
  const book = state.books.find((x) => x.book_id === bookId);
  if (!book || !refs.bookActionsDialog) return;
  state.selectedBookId = bookId;
  renderLibrary();
  state.selectedBookActionId = bookId;
  refs.bookActionsSubtitle.textContent = `${book.title_display || book.title || ""} • ${book.author_display || book.author || "Khuyết danh"}`;
  if (!refs.bookActionsDialog.open) {
    refs.bookActionsDialog.showModal();
  }
}

function renderLibrary() {
  refs.libraryGrid.innerHTML = "";
  refs.libraryCount.textContent = t("libraryCount", { count: state.books.length });

  if (!state.books.length) {
    refs.libraryEmpty.textContent = t("libraryEmpty");
    refs.libraryEmpty.classList.remove("hidden");
    return;
  }
  refs.libraryEmpty.classList.add("hidden");

  for (const book of state.books) {
    const card = document.createElement("article");
    card.className = "book-card";
    card.setAttribute("role", "button");
    card.tabIndex = 0;
    if (book.book_id === state.selectedBookId) {
      card.style.borderColor = "var(--accent)";
      card.style.boxShadow = "0 0 0 2px color-mix(in srgb, var(--accent) 28%, transparent)";
    }

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
      txt.textContent = t("noCover");
      cover.appendChild(txt);
    }

    const body = document.createElement("div");
    const title = document.createElement("div");
    title.className = "book-card-title";
    title.textContent = book.title_display || book.title || "Không tiêu đề";

    const author = document.createElement("div");
    author.className = "book-card-meta";
    author.textContent = book.author_display || book.author || "Khuyết danh";

    body.append(title, author);
    card.append(cover, body);
    card.addEventListener("click", () => openBookActions(book.book_id));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openBookActions(book.book_id);
      }
    });
    refs.libraryGrid.appendChild(card);
  }
}

function renderChapterHits() {
  refs.chapterHitList.innerHTML = "";
  if (!state.chapterHits.length) {
    refs.chapterHitsEmpty.textContent = t("chapterHitsEmpty");
    return;
  }
  refs.chapterHitsEmpty.textContent = "";

  for (const hit of state.chapterHits) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chapter-hit";

    const title = document.createElement("div");
    title.className = "chapter-hit-title";
    title.textContent = `${hit.book_title_display || hit.book_title || ""} • ${hit.title_display || hit.title_raw || ""}`;

    const sub = document.createElement("div");
    sub.className = "chapter-hit-sub";
    sub.textContent = `#${hit.chapter_order || "?"} • ${t("jumpToChapter")}`;

    btn.append(title, sub);
    btn.addEventListener("click", async () => {
      await selectBook(hit.book_id, { openPage: "reader", autoOpenChapter: false });
      await selectChapter(hit.chapter_id);
      showPage("reader");
    });

    li.appendChild(btn);
    refs.chapterHitList.appendChild(li);
  }
}

async function loadBooks(query = "") {
  showStatus(t("statusLoadingBooks"));
  try {
    if (query) {
      const data = await api(`/api/search?q=${encodeURIComponent(query)}`);
      state.books = data.books || [];
      state.chapterHits = data.chapters || [];
    } else {
      const data = await api("/api/library/books");
      state.books = data.items || [];
      state.chapterHits = [];
    }
    renderLibrary();
    renderChapterHits();
  } finally {
    hideStatus();
  }
}

function effectiveModeForBook(book, wantedMode) {
  if (!book || book.lang_source === "vi") return "raw";
  return wantedMode === "trans" ? "trans" : "raw";
}

async function fetchBookDetail(bookId, mode = "raw") {
  const params = new URLSearchParams({
    mode,
    translation_mode: state.translateMode,
  });
  return api(`/api/library/book/${encodeURIComponent(bookId)}?${params.toString()}`);
}

function updateReaderModeButtons() {
  const book = state.selectedBookDetail;
  const isVi = !!(book && book.lang_source === "vi");
  refs.btnModeRaw.classList.toggle("active", state.mode === "raw");
  refs.btnModeTrans.classList.toggle("active", state.mode === "trans");
  refs.btnModeTrans.classList.toggle("hidden", !!isVi);
  refs.btnTranslateMode.classList.toggle("hidden", !!isVi);
  refs.btnOpenNameEditor.classList.toggle("hidden", !!isVi);
  refs.btnTocModeTrans.classList.toggle("hidden", !!isVi);
  refs.btnTranslateTitles.classList.toggle("hidden", !!isVi);
  refs.btnTocModeRaw.classList.toggle("active", state.tocMode === "raw");
  refs.btnTocModeTrans.classList.toggle("active", state.tocMode === "trans");
}

function setBookCover(coverUrl) {
  const wrap = refs.bookCover.parentElement;
  if (!coverUrl) {
    refs.bookCover.removeAttribute("src");
    wrap.classList.remove("has-image");
    return;
  }
  refs.bookCover.src = coverUrl;
  wrap.classList.add("has-image");
}

function populateBookMeta(detail) {
  if (!detail) {
    refs.bookViewWrap.classList.add("hidden");
    refs.bookEditWrap.classList.add("hidden");
    refs.bookEmpty.classList.remove("hidden");
    refs.bookEditEmpty.classList.remove("hidden");
    return;
  }
  refs.bookViewWrap.classList.remove("hidden");
  refs.bookEditWrap.classList.remove("hidden");
  refs.bookEmpty.classList.add("hidden");
  refs.bookEditEmpty.classList.add("hidden");

  const displayTitle = detail.title_display || detail.title_vi || detail.title || "Không tiêu đề";
  refs.bookTitleDisplay.textContent = displayTitle;
  refs.bookSubtitle.textContent = `${detail.author_display || detail.author || "Khuyết danh"} • ${detail.chapter_count || 0} chương • ${detail.lang_source || "zh"}`;

  refs.viewTitle.textContent = detail.title || "";
  refs.viewTitleVi.textContent = detail.title_vi || "";
  refs.viewAuthor.textContent = detail.author || "";
  refs.viewAuthorVi.textContent = detail.author_vi || "";
  refs.viewSummary.textContent = detail.summary || "";
  refs.viewExtraLink.innerHTML = "";
  if (detail.extra_link) {
    const a = document.createElement("a");
    a.href = detail.extra_link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = detail.extra_link;
    refs.viewExtraLink.appendChild(a);
  }

  refs.fieldTitle.value = detail.title || "";
  refs.fieldTitleVi.value = detail.title_vi || "";
  refs.fieldAuthor.value = detail.author || "";
  refs.fieldAuthorVi.value = detail.author_vi || "";
  refs.fieldSummary.value = detail.summary || "";
  refs.fieldExtraLink.value = detail.extra_link || "";
  refs.fieldCoverUrl.value = detail.cover_path || detail.cover_url || "";

  setBookCover(detail.cover_url || "");

  const extraLink = (detail.extra_link || "").trim();
  refs.btnOpenExtraLink.disabled = !extraLink;
}

function getChapterDisplayTitle(chapter, mode = "raw") {
  if (!chapter) return "";
  if (mode === "trans" && chapter.title_vi) return chapter.title_vi;
  return chapter.title_raw || chapter.title_display || `Chương ${chapter.chapter_order || "?"}`;
}

function renderReaderToc() {
  refs.readerTocList.innerHTML = "";
  const detail = state.selectedBookDetail;
  if (!detail || !(detail.chapters && detail.chapters.length)) return;

  for (const chapter of detail.chapters) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "reader-toc-item";
    if (chapter.chapter_id === state.selectedChapterId) {
      btn.classList.add("active");
    }

    const title = document.createElement("div");
    title.className = "reader-toc-item-title";
    title.textContent = `${chapter.chapter_order}. ${getChapterDisplayTitle(chapter, state.mode)}`;
    btn.appendChild(title);

    btn.addEventListener("click", async () => {
      await selectChapter(chapter.chapter_id);
      closeReaderToc();
    });

    li.appendChild(btn);
    refs.readerTocList.appendChild(li);
  }
}

function renderBookTocList() {
  refs.tocList.innerHTML = "";
  if (!state.tocItems.length) {
    const li = document.createElement("li");
    li.className = "empty-text";
    li.textContent = t("tocNoData");
    refs.tocList.appendChild(li);
  }

  for (const chapter of state.tocItems) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toc-item";
    if (chapter.chapter_id === state.selectedChapterId) {
      btn.classList.add("active");
    }

    const title = document.createElement("div");
    title.className = "toc-item-title";
    title.textContent = `${chapter.chapter_order}. ${chapter.title_display || chapter.title_raw || ""}`;

    const sub = document.createElement("div");
    sub.className = "toc-item-sub";
    sub.textContent = `${chapter.word_count || 0} ký tự`;

    btn.append(title, sub);
    btn.addEventListener("click", async () => {
      showPage("reader");
      await selectChapter(chapter.chapter_id);
    });
    li.appendChild(btn);
    refs.tocList.appendChild(li);
  }

  refs.btnTocPrev.disabled = state.tocPagination.page <= 1;
  refs.btnTocNext.disabled = state.tocPagination.page >= state.tocPagination.total_pages;
}

async function loadTocPage(page = 1) {
  if (!state.selectedBookDetail) return;
  const book = state.selectedBookDetail;
  const mode = effectiveModeForBook(book, state.tocMode);

  showStatus(t("statusLoadingToc"));
  try {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(state.tocPagination.page_size),
      mode,
      translation_mode: state.translateMode,
    });
    const data = await api(`/api/library/book/${encodeURIComponent(book.book_id)}/chapters?${params.toString()}`);
    state.tocItems = data.items || [];
    state.tocPagination = {
      ...state.tocPagination,
      ...(data.pagination || {}),
    };
    renderBookTocList();
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

function updateReaderHeader(chapter) {
  const book = state.selectedBookDetail;
  if (!book) {
    refs.readerBookTitle.textContent = t("noBookSelected");
    refs.readerChapterSub.textContent = "";
    refs.readerChapterTitle.textContent = t("readerEmpty");
    return;
  }
  const bookTitle = state.mode === "trans" ? (book.title_vi || book.title_display || book.title) : (book.title || book.title_display);
  refs.readerBookTitle.textContent = bookTitle || "Không tiêu đề";
  refs.readerChapterSub.textContent = `${book.author_display || book.author || "Khuyết danh"} • ${book.chapter_count || 0} chương`;
  refs.readerChapterTitle.textContent = (chapter && chapter.title) || getChapterDisplayTitle(findChapterById(state.selectedChapterId), state.mode) || t("readerEmpty");
}

function findChapterById(chapterId) {
  if (!state.selectedBookDetail || !chapterId) return null;
  return (state.selectedBookDetail.chapters || []).find((x) => x.chapter_id === chapterId) || null;
}

function shouldUseInfiniteStream() {
  return state.settings.readingMode === "vertical" || state.settings.readingMode === "horizontal";
}

function resetReaderStream() {
  state.stream.enabled = false;
  state.stream.mode = "single";
  state.stream.loadedIds = [];
  state.stream.nextIndex = -1;
  state.stream.prevIndex = -1;
  state.stream.loading = false;
}

function chapterCacheKey(chapterId, mode) {
  return `${chapterId}|${mode}|${state.translateMode}`;
}

async function fetchChapterPayload(chapterId, mode) {
  const key = chapterCacheKey(chapterId, mode);
  if (state.chapterContentCache.has(key)) {
    return state.chapterContentCache.get(key);
  }
  const params = new URLSearchParams({
    mode,
    translation_mode: state.translateMode,
  });
  const chapter = await api(`/api/library/chapter/${encodeURIComponent(chapterId)}?${params.toString()}`);
  state.chapterContentCache.set(key, chapter);
  return chapter;
}

function renderReaderContent(text) {
  refs.readerContentBody.innerHTML = "";
  refs.readerContentBody.appendChild(buildParagraphNodes(text, t("readerEmpty")));
  if (state.settings.readingMode === "flip") {
    refs.readerContentBody.style.animation = "none";
    void refs.readerContentBody.offsetWidth;
    refs.readerContentBody.style.animation = "pageFlip 0.22s ease";
  }
}

function createStreamSection(chapterMeta, chapterPayload) {
  const section = document.createElement("section");
  section.className = "chapter-block";
  section.dataset.chapterId = chapterMeta.chapter_id;
  section.dataset.chapterOrder = String(chapterMeta.chapter_order || 0);
  section.dataset.chapterTitle = chapterPayload.title || getChapterDisplayTitle(chapterMeta, state.mode) || "";

  const title = document.createElement("h4");
  title.className = "chapter-block-title";
  title.textContent = `${chapterMeta.chapter_order || "?"}. ${section.dataset.chapterTitle}`;
  section.appendChild(title);

  const body = document.createElement("div");
  body.className = "chapter-block-content";
  body.appendChild(buildParagraphNodes(chapterPayload.content || "", t("readerEmpty")));
  section.appendChild(body);

  return section;
}

async function appendStreamChapterByIndex(index, { append = true } = {}) {
  const chapters = (state.selectedBookDetail && state.selectedBookDetail.chapters) || [];
  if (index < 0 || index >= chapters.length) return false;
  const chapterMeta = chapters[index];
  if (!chapterMeta || state.stream.loadedIds.includes(chapterMeta.chapter_id)) {
    return false;
  }

  const mode = effectiveModeForBook(state.selectedBookDetail, state.mode);
  const payload = await fetchChapterPayload(chapterMeta.chapter_id, mode);
  const section = createStreamSection(chapterMeta, payload);
  const wrap = refs.readerContentScroll;

  if (append) {
    refs.readerContentBody.appendChild(section);
    state.stream.loadedIds.push(chapterMeta.chapter_id);
  } else {
    const before = state.settings.readingMode === "horizontal" ? wrap.scrollWidth : wrap.scrollHeight;
    refs.readerContentBody.prepend(section);
    const after = state.settings.readingMode === "horizontal" ? wrap.scrollWidth : wrap.scrollHeight;
    if (state.settings.readingMode === "horizontal") {
      wrap.scrollLeft += Math.max(0, after - before);
    } else {
      wrap.scrollTop += Math.max(0, after - before);
    }
    state.stream.loadedIds.unshift(chapterMeta.chapter_id);
  }
  return true;
}

function getStreamReadPosition() {
  if (!state.stream.enabled) return null;
  const wrap = refs.readerContentScroll;
  const sections = Array.from(refs.readerContentBody.querySelectorAll(".chapter-block"));
  if (!sections.length) return null;

  const wrapRect = wrap.getBoundingClientRect();
  const isHorizontal = state.settings.readingMode === "horizontal";

  let best = null;
  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    const visible = isHorizontal
      ? rect.right > wrapRect.left && rect.left < wrapRect.right
      : rect.bottom > wrapRect.top && rect.top < wrapRect.bottom;
    const distance = isHorizontal
      ? Math.abs(rect.left - wrapRect.left)
      : Math.abs(rect.top - wrapRect.top);
    if (!visible) continue;
    if (!best || distance < best.distance) {
      best = { section, rect, distance };
    }
  }
  if (!best) {
    const section = sections[0];
    best = { section, rect: section.getBoundingClientRect(), distance: 0 };
  }

  let ratio = 0;
  if (isHorizontal) {
    const travel = wrapRect.left - best.rect.left;
    const total = Math.max(1, best.rect.width - wrap.clientWidth);
    ratio = total > 0 ? travel / total : 0;
  } else {
    const travel = wrapRect.top - best.rect.top;
    const total = Math.max(1, best.rect.height - wrap.clientHeight);
    ratio = total > 0 ? travel / total : 0;
  }
  ratio = Math.max(0, Math.min(1, Number(ratio) || 0));

  return {
    chapterId: best.section.dataset.chapterId || state.selectedChapterId,
    chapterTitle: best.section.dataset.chapterTitle || "",
    ratio,
  };
}

function syncStreamCurrentChapter() {
  const pos = getStreamReadPosition();
  if (!pos) return null;
  const changed = !!pos.chapterId && pos.chapterId !== state.selectedChapterId;
  if (changed) {
    state.selectedChapterId = pos.chapterId;
    updateReaderHeader({ title: pos.chapterTitle });
    renderBookTocList();
    renderReaderToc();
  }
  updateReaderProgress(pos.ratio);
  return pos;
}

async function maybeLoadStreamEdges() {
  if (!state.stream.enabled || state.stream.loading) return;
  const chapters = (state.selectedBookDetail && state.selectedBookDetail.chapters) || [];
  if (!chapters.length) return;
  const wrap = refs.readerContentScroll;

  const maxPos = state.settings.readingMode === "horizontal"
    ? Math.max(1, wrap.scrollWidth - wrap.clientWidth)
    : Math.max(1, wrap.scrollHeight - wrap.clientHeight);
  const curPos = state.settings.readingMode === "horizontal" ? wrap.scrollLeft : wrap.scrollTop;
  const nearStart = curPos <= Math.max(20, maxPos * 0.04);
  const nearEnd = curPos >= maxPos * 0.86;

  if (nearEnd && state.stream.nextIndex >= 0 && state.stream.nextIndex < chapters.length) {
    state.stream.loading = true;
    try {
      const ok = await appendStreamChapterByIndex(state.stream.nextIndex, { append: true });
      if (ok) state.stream.nextIndex += 1;
    } finally {
      state.stream.loading = false;
    }
  }

  if (nearStart && state.stream.prevIndex >= 0 && state.stream.prevIndex < chapters.length) {
    state.stream.loading = true;
    try {
      const ok = await appendStreamChapterByIndex(state.stream.prevIndex, { append: false });
      if (ok) state.stream.prevIndex -= 1;
    } finally {
      state.stream.loading = false;
    }
  }
}

function restoreStreamChapterRatio(chapterId, ratio) {
  const section = refs.readerContentBody.querySelector(`.chapter-block[data-chapter-id="${chapterId}"]`);
  if (!section) return;
  const wrap = refs.readerContentScroll;
  const safeRatio = Math.max(0, Math.min(1, Number(ratio) || 0));
  requestAnimationFrame(() => {
    const wrapRect = wrap.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    if (state.settings.readingMode === "horizontal") {
      const travel = Math.max(0, sectionRect.width - wrap.clientWidth);
      const target = wrap.scrollLeft + (sectionRect.left - wrapRect.left) + (travel * safeRatio);
      wrap.scrollLeft = Math.max(0, target);
      return;
    }
    const travel = Math.max(0, sectionRect.height - wrap.clientHeight);
    const target = wrap.scrollTop + (sectionRect.top - wrapRect.top) + (travel * safeRatio);
    wrap.scrollTop = Math.max(0, target);
  });
}

function scrollToStreamChapter(chapterId) {
  const section = refs.readerContentBody.querySelector(`.chapter-block[data-chapter-id="${chapterId}"]`);
  if (!section) return false;
  const wrap = refs.readerContentScroll;
  const wrapRect = wrap.getBoundingClientRect();
  const sectionRect = section.getBoundingClientRect();
  if (state.settings.readingMode === "horizontal") {
    const target = wrap.scrollLeft + (sectionRect.left - wrapRect.left);
    wrap.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    return true;
  }
  const target = wrap.scrollTop + (sectionRect.top - wrapRect.top);
  wrap.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  return true;
}

async function initInfiniteStream(chapterId, { restoreRatio = 0 } = {}) {
  const chapters = (state.selectedBookDetail && state.selectedBookDetail.chapters) || [];
  const anchorIndex = chapters.findIndex((x) => x.chapter_id === chapterId);
  if (anchorIndex < 0) return;

  refs.readerContentBody.innerHTML = "";
  state.stream.enabled = true;
  state.stream.mode = state.settings.readingMode;
  state.stream.loadedIds = [];
  state.stream.loading = false;
  state.stream.prevIndex = anchorIndex - 1;
  state.stream.nextIndex = anchorIndex + 1;

  await appendStreamChapterByIndex(anchorIndex, { append: true });
  await appendStreamChapterByIndex(anchorIndex + 1, { append: true });
  state.stream.nextIndex = anchorIndex + 2;
  state.selectedChapterId = chapterId;

  const chapterMeta = findChapterById(chapterId);
  updateReaderHeader({ title: getChapterDisplayTitle(chapterMeta, state.mode) });
  renderBookTocList();
  renderReaderToc();

  if (restoreRatio > 0) {
    restoreStreamChapterRatio(chapterId, restoreRatio);
  } else if (state.settings.readingMode === "horizontal") {
    refs.readerContentScroll.scrollLeft = 0;
  } else {
    refs.readerContentScroll.scrollTop = 0;
  }
  syncStreamCurrentChapter();
}

function getCurrentScrollRatio() {
  if (state.stream.enabled) {
    const pos = getStreamReadPosition();
    if (pos) return pos.ratio;
  }
  const wrap = refs.readerContentScroll;
  if (state.settings.readingMode === "horizontal") {
    const maxX = wrap.scrollWidth - wrap.clientWidth;
    return maxX > 0 ? wrap.scrollLeft / maxX : 0;
  }
  const maxY = wrap.scrollHeight - wrap.clientHeight;
  return maxY > 0 ? wrap.scrollTop / maxY : 0;
}

function restoreScrollRatio(ratio) {
  const wrap = refs.readerContentScroll;
  if (state.stream.enabled && state.selectedChapterId) {
    restoreStreamChapterRatio(state.selectedChapterId, ratio);
    return;
  }
  const safeRatio = Math.max(0, Math.min(1, Number(ratio) || 0));
  requestAnimationFrame(() => {
    if (state.settings.readingMode === "horizontal") {
      const maxX = wrap.scrollWidth - wrap.clientWidth;
      wrap.scrollLeft = maxX > 0 ? maxX * safeRatio : 0;
      return;
    }
    const maxY = wrap.scrollHeight - wrap.clientHeight;
    wrap.scrollTop = maxY > 0 ? maxY * safeRatio : 0;
  });
}

function updateReaderProgress(ratio = 0) {
  const detail = state.selectedBookDetail;
  if (!detail || !state.selectedChapterId) {
    refs.readerProgress.textContent = t("progressEmpty");
    return;
  }
  const chapter = findChapterById(state.selectedChapterId);
  const order = (chapter && chapter.chapter_order) || 1;
  const total = detail.chapter_count || (detail.chapters && detail.chapters.length) || 1;
  refs.readerProgress.textContent = t("progressTemplate", {
    current: order,
    total,
    percent: (Math.max(0, Math.min(1, ratio)) * 100).toFixed(1),
  });
}

async function saveProgress({ chapterId, ratio, silent = true } = {}) {
  if (!state.selectedBookDetail) return;
  const currentChapterId = chapterId || state.selectedChapterId;
  const currentRatio = typeof ratio === "number" ? ratio : getCurrentScrollRatio();
  const payload = {
    chapter_id: currentChapterId,
    ratio: currentRatio,
    mode: state.mode,
    theme_pref: state.settings.themeId,
  };
  try {
    await api(`/api/library/book/${encodeURIComponent(state.selectedBookDetail.book_id)}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!silent) showToast(t("toastSavedProgress"));
  } catch {
    // không chặn trải nghiệm đọc nếu save progress lỗi
  }
}

async function prefetchNextChapter() {
  if (!state.selectedBookDetail || state.selectedBookDetail.lang_source === "vi") return;
  if (state.mode !== "trans" || !state.selectedChapterId) return;
  const chapters = state.selectedBookDetail.chapters || [];
  const index = chapters.findIndex((x) => x.chapter_id === state.selectedChapterId);
  if (index < 0 || index >= chapters.length - 1) return;
  const next = chapters[index + 1];
  try {
    await api(`/api/library/chapter/${encodeURIComponent(next.chapter_id)}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translation_mode: state.translateMode }),
    });
  } catch {
    // prefetch lỗi thì bỏ qua
  }
}

async function selectChapter(chapterId, options = {}) {
  if (!state.selectedBookDetail || !chapterId) return;
  showStatus(t("statusLoadingChapter"));
  try {
    const mode = effectiveModeForBook(state.selectedBookDetail, state.mode);
    const restoreRatio = typeof options.restoreRatio === "number" ? options.restoreRatio : 0;
    if (shouldUseInfiniteStream()) {
      await initInfiniteStream(chapterId, { restoreRatio });
      const pos = syncStreamCurrentChapter();
      await saveProgress({
        chapterId: (pos && pos.chapterId) || chapterId,
        ratio: (pos && pos.ratio) || restoreRatio,
        silent: true,
      });
      if (mode === "trans") {
        maybeLoadStreamEdges().catch(() => {});
      }
      if (refs.nameEditorDialog && refs.nameEditorDialog.open) {
        nameEditor.refreshPreview().catch(() => {});
      }
      return;
    }

    resetReaderStream();
    const chapter = await fetchChapterPayload(chapterId, mode);
    state.selectedChapterId = chapter.chapter_id;
    updateReaderHeader(chapter);
    renderReaderContent(chapter.content || "");
    renderBookTocList();
    renderReaderToc();
    restoreScrollRatio(restoreRatio);
    updateReaderProgress(restoreRatio);
    await saveProgress({ chapterId: chapter.chapter_id, ratio: restoreRatio, silent: true });
    if (refs.nameEditorDialog && refs.nameEditorDialog.open) {
      nameEditor.refreshPreview().catch(() => {});
    }
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

async function selectBook(bookId, options = {}) {
  if (!bookId) return;
  showStatus(t("statusLoadingBookInfo"));
  try {
    const modeForDetail = state.mode === "trans" ? "trans" : state.tocMode;
    const detail = await fetchBookDetail(bookId, modeForDetail);

    state.selectedBookId = detail.book_id;
    state.selectedBookDetail = detail;
    state.selectedChapterId = null;
    resetReaderStream();

    if (detail.lang_source === "vi") {
      state.mode = "raw";
      state.tocMode = "raw";
    }

    populateBookMeta(detail);
    renderReaderToc();
    updateReaderModeButtons();

    await loadTocPage(1);
    renderLibrary();

    if (options.openPage) {
      showPage(options.openPage);
    }

    if (options.autoOpenChapter) {
      let chapterId = detail.last_read_chapter_id;
      if (!chapterId) {
        chapterId = (detail.chapters && detail.chapters[0] && detail.chapters[0].chapter_id) || null;
      }
      if (chapterId) {
        const ratio = typeof detail.last_read_ratio === "number" ? detail.last_read_ratio : 0;
        await selectChapter(chapterId, { restoreRatio: ratio });
      }
    }

    const shouldPrimeChapter = (options.openPage === "reader" || state.page === "reader");
    if (!options.autoOpenChapter && shouldPrimeChapter && !state.selectedChapterId && detail.chapters && detail.chapters.length) {
      await selectChapter(detail.chapters[0].chapter_id, { restoreRatio: 0 });
    }
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

async function switchMode(nextMode) {
  if (!state.selectedBookDetail) {
    state.mode = nextMode === "trans" ? "trans" : "raw";
    updateReaderModeButtons();
    return;
  }
  if (nextMode === "trans" && state.selectedBookDetail.lang_source === "vi") {
    showToast(t("sourceViNoTrans"));
    return;
  }
  const anchorChapterId = state.selectedChapterId;
  const anchorRatio = getCurrentScrollRatio();
  state.mode = nextMode === "trans" ? "trans" : "raw";
  state.tocMode = state.mode;
  updateReaderModeButtons();

  try {
    const detail = await fetchBookDetail(state.selectedBookDetail.book_id, state.mode);
    state.selectedBookDetail = detail;
    populateBookMeta(detail);
    renderReaderToc();
    await loadTocPage(state.tocPagination.page || 1);
    if (anchorChapterId) {
      await selectChapter(anchorChapterId, { restoreRatio: anchorRatio });
    } else if (detail.chapters && detail.chapters.length) {
      await selectChapter(detail.chapters[0].chapter_id, { restoreRatio: 0 });
    }
    renderLibrary();
  } catch (error) {
    showToast(error.message || t("toastError"));
  }
}

async function switchTocMode(nextMode) {
  if (!state.selectedBookDetail) return;
  if (nextMode === "trans" && state.selectedBookDetail.lang_source === "vi") {
    showToast(t("sourceViNoTrans"));
    return;
  }
  state.tocMode = nextMode === "trans" ? "trans" : "raw";
  updateReaderModeButtons();
  try {
    const detail = await fetchBookDetail(state.selectedBookDetail.book_id, state.tocMode);
    state.selectedBookDetail = detail;
    populateBookMeta(detail);
    renderReaderToc();
    await loadTocPage(1);
    renderLibrary();
  } catch (error) {
    showToast(error.message || t("toastError"));
  }
}

async function translateTitlesNow() {
  if (!state.selectedBookDetail) return;
  if (state.selectedBookDetail.lang_source === "vi") {
    showToast(t("sourceViNoTrans"));
    return;
  }
  showStatus(t("statusTranslatingTitles"));
  try {
    await api(`/api/library/book/${encodeURIComponent(state.selectedBookDetail.book_id)}/translate-titles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translation_mode: state.translateMode }),
    });

    const modeForDetail = state.mode === "trans" || state.tocMode === "trans" ? "trans" : "raw";
    const detail = await fetchBookDetail(state.selectedBookDetail.book_id, modeForDetail);
    state.selectedBookDetail = detail;

    populateBookMeta(detail);
    renderReaderToc();
    await loadTocPage(state.tocPagination.page || 1);

    if (state.selectedChapterId) {
      await selectChapter(state.selectedChapterId, { restoreRatio: getCurrentScrollRatio() });
    }
    renderLibrary();
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

async function exportBook(bookId, format) {
  const ensureTranslated = confirm(t("ensureTranslate"));
  showStatus(t("statusExporting"));
  try {
    const payload = await api(`/api/library/book/${encodeURIComponent(bookId)}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format,
        ensure_translated: ensureTranslated,
        translation_mode: state.translateMode,
      }),
    });
    if (payload.download_url) {
      window.open(payload.download_url, "_blank", "noopener,noreferrer");
    }
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

async function deleteBook(bookId) {
  if (!confirm(t("confirmDeleteBook"))) return;
  try {
    await api(`/api/library/book/${encodeURIComponent(bookId)}`, { method: "DELETE" });
    showToast(t("toastBookDeleted"));
    if (state.selectedBookActionId === bookId) {
      state.selectedBookActionId = null;
    }

    if (state.selectedBookId === bookId) {
      state.selectedBookId = null;
      state.selectedBookDetail = null;
      state.selectedChapterId = null;
      state.chapterContentCache.clear();
      resetReaderStream();
      populateBookMeta(null);
      refs.readerBookTitle.textContent = t("noBookSelected");
      refs.readerChapterSub.textContent = "";
      refs.readerChapterTitle.textContent = t("readerEmpty");
      refs.readerContentBody.innerHTML = "";
      refs.readerProgress.textContent = t("progressEmpty");
      refs.tocList.innerHTML = "";
      refs.readerTocList.innerHTML = "";
    }

    await loadBooks(refs.searchInput.value.trim());
  } catch (error) {
    showToast(error.message || t("toastError"));
  }
}

async function clearCache() {
  if (!confirm(t("confirmClearCache"))) return;
  showStatus(t("statusClearing"));
  try {
    await api("/api/library/cache/clear", { method: "POST" });
    state.chapterContentCache.clear();
    showToast(t("toastCacheCleared"));
    if (state.selectedChapterId) {
      await selectChapter(state.selectedChapterId, { restoreRatio: getCurrentScrollRatio() });
    }
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

function openSettings() {
  refs.settingsDrawer.classList.add("open");
  refs.settingsDrawer.setAttribute("aria-hidden", "false");
  refs.settingsBackdrop.hidden = false;
}

function closeSettings() {
  refs.settingsDrawer.classList.remove("open");
  refs.settingsDrawer.setAttribute("aria-hidden", "true");
  refs.settingsBackdrop.hidden = true;
}

function openReaderToc() {
  refs.readerTocDrawer.classList.add("open");
  refs.readerTocDrawer.setAttribute("aria-hidden", "false");
  refs.settingsBackdrop.hidden = false;
}

function closeReaderToc() {
  refs.readerTocDrawer.classList.remove("open");
  refs.readerTocDrawer.setAttribute("aria-hidden", "true");
  if (!refs.settingsDrawer.classList.contains("open")) {
    refs.settingsBackdrop.hidden = true;
  }
}

function applyTheme(themeId) {
  const theme = state.themes.find((x) => x.id === themeId) || state.themes[0];
  if (!theme) return;

  state.settings.themeId = theme.id;
  refs.themeSelect.value = theme.id;

  const tokens = theme.tokens || {};
  for (const [key, value] of Object.entries(tokens)) {
    const cssKey = key.replaceAll("_", "-");
    document.documentElement.style.setProperty(`--${cssKey}`, value);
  }

  document.body.classList.remove(
    "effect-stars",
    "effect-sparkle",
    "effect-bubbles",
    "effect-leaves",
    "effect-snow",
  );
  document.body.classList.add(`effect-${theme.effect || "stars"}`);
}

function applyReaderSettings() {
  const s = state.settings;
  document.documentElement.style.setProperty("--reader-font-family", s.fontFamily);
  document.documentElement.style.setProperty("--reader-font-size", `${s.fontSize}px`);
  document.documentElement.style.setProperty("--reader-line-height", `${s.lineHeight}`);
  document.documentElement.style.setProperty("--reader-paragraph-spacing", `${s.paragraphSpacing}em`);
  document.documentElement.style.setProperty("--reader-text-align", s.textAlign);

  refs.readerViewport.classList.remove("reading-flip", "reading-horizontal", "reading-vertical", "reading-hybrid");
  refs.readerViewport.classList.add(`reading-${s.readingMode}`);

  refs.fontSizeValue.textContent = `${s.fontSize}px`;
  refs.lineHeightValue.textContent = `${s.lineHeight.toFixed(2)}`;
  refs.paragraphSpacingValue.textContent = `${s.paragraphSpacing.toFixed(2)}em`;
}

function fillSettingsForm() {
  refs.themeSelect.value = state.settings.themeId;
  refs.fontFamilyInput.value = state.settings.fontFamily;
  refs.fontSizeInput.value = String(state.settings.fontSize);
  refs.textAlignSelect.value = state.settings.textAlign;
  refs.lineHeightInput.value = String(state.settings.lineHeight);
  refs.paragraphSpacingInput.value = String(state.settings.paragraphSpacing);
  refs.readingModeSelect.value = state.settings.readingMode;

  applyReaderSettings();
}

async function persistThemeRemote() {
  try {
    await api("/api/themes/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme_id: state.settings.themeId }),
    });
  } catch {
    // bỏ qua nếu lỗi network
  }
}

async function loadThemes() {
  const data = await api("/api/themes");
  state.themes = data.items || [];
  refs.themeSelect.innerHTML = "";
  for (const item of state.themes) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    refs.themeSelect.appendChild(option);
  }

  const availableIds = new Set(state.themes.map((x) => x.id));
  if (!availableIds.has(state.settings.themeId)) {
    state.settings.themeId = data.active || (state.themes[0] && state.themes[0].id) || DEFAULT_SETTINGS.themeId;
  }
  applyTheme(state.settings.themeId);
}

function resetSettingsToDefault() {
  const anchorChapterId = state.selectedChapterId;
  const anchorRatio = getCurrentScrollRatio();
  state.settings = { ...DEFAULT_SETTINGS };
  applyTheme(state.settings.themeId);
  fillSettingsForm();
  saveSettingsLocal();
  persistThemeRemote().catch(() => {});
  if (anchorChapterId) {
    selectChapter(anchorChapterId, { restoreRatio: anchorRatio }).catch(() => {});
  }
  showToast(t("toastSettingsReset"));
}

function handleReaderScroll() {
  if (!state.selectedBookDetail || !state.selectedChapterId) return;
  let ratio = getCurrentScrollRatio();
  if (state.stream.enabled) {
    maybeLoadStreamEdges().catch(() => {});
    const pos = syncStreamCurrentChapter();
    if (pos) {
      ratio = pos.ratio;
    }
  } else {
    updateReaderProgress(ratio);
  }

  if (!state.stream.enabled && state.mode === "trans" && ratio >= 0.55) {
    prefetchNextChapter();
  }

  if (!state.stream.enabled && state.settings.readingMode === "hybrid" && ratio >= 0.985 && !state.autoSwitchingChapter) {
    state.autoSwitchingChapter = true;
    goChapter(1).finally(() => {
      state.autoSwitchingChapter = false;
    });
    return;
  }

  clearTimeout(state.saveProgressTimer);
  state.saveProgressTimer = setTimeout(() => {
    saveProgress({ ratio, silent: true }).catch(() => {});
  }, 320);
}

async function goChapter(step) {
  if (!state.selectedBookDetail || !state.selectedChapterId) return;
  const list = state.selectedBookDetail.chapters || [];
  const idx = list.findIndex((x) => x.chapter_id === state.selectedChapterId);
  if (idx < 0) return;
  const next = idx + step;
  if (next < 0 || next >= list.length) return;
  const nextChapterId = list[next].chapter_id;

  if (state.stream.enabled) {
    if (!scrollToStreamChapter(nextChapterId)) {
      if (step > 0 && next === state.stream.nextIndex) {
        const ok = await appendStreamChapterByIndex(next, { append: true });
        if (ok) {
          state.stream.nextIndex += 1;
        }
      } else if (step < 0 && next === state.stream.prevIndex) {
        const ok = await appendStreamChapterByIndex(next, { append: false });
        if (ok) {
          state.stream.prevIndex -= 1;
        }
      }
      scrollToStreamChapter(nextChapterId);
    }
    state.selectedChapterId = nextChapterId;
    updateReaderHeader({ title: getChapterDisplayTitle(findChapterById(nextChapterId), state.mode) });
    renderBookTocList();
    renderReaderToc();
    setTimeout(() => {
      const pos = syncStreamCurrentChapter();
      saveProgress({
        chapterId: (pos && pos.chapterId) || nextChapterId,
        ratio: (pos && pos.ratio) || 0,
        silent: true,
      }).catch(() => {});
    }, 180);
    return;
  }

  await selectChapter(nextChapterId, { restoreRatio: 0 });
}

async function submitBookMeta(event) {
  event.preventDefault();
  if (!state.selectedBookDetail) return;

  showStatus(t("statusSavingMeta"));
  try {
    const payload = {
      title: refs.fieldTitle.value.trim(),
      title_vi: refs.fieldTitleVi.value.trim(),
      author: refs.fieldAuthor.value.trim(),
      author_vi: refs.fieldAuthorVi.value.trim(),
      summary: refs.fieldSummary.value.trim(),
      extra_link: refs.fieldExtraLink.value.trim(),
    };

    const data = await api(`/api/library/book/${encodeURIComponent(state.selectedBookDetail.book_id)}/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    state.selectedBookDetail = data.book;
    populateBookMeta(data.book);
    await loadBooks(refs.searchInput.value.trim());
    renderReaderToc();
    showPage("book");
    showToast(t("toastMetaSaved"));
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

async function uploadCoverFile(file) {
  if (!state.selectedBookDetail || !file) return;
  showStatus(t("statusUploadingCover"));
  try {
    const form = new FormData();
    form.set("file", file);
    const data = await api(`/api/library/book/${encodeURIComponent(state.selectedBookDetail.book_id)}/cover`, {
      method: "POST",
      body: form,
    });
    state.selectedBookDetail = data.book;
    populateBookMeta(data.book);
    await loadBooks(refs.searchInput.value.trim());
    showToast(t("bookMetaUpdated"));
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

async function applyCoverUrl() {
  if (!state.selectedBookDetail) return;
  const coverUrl = refs.fieldCoverUrl.value.trim();
  if (!coverUrl) return;
  showStatus(t("statusUploadingCover"));
  try {
    const form = new FormData();
    form.set("cover_url", coverUrl);
    const data = await api(`/api/library/book/${encodeURIComponent(state.selectedBookDetail.book_id)}/cover`, {
      method: "POST",
      body: form,
    });
    state.selectedBookDetail = data.book;
    populateBookMeta(data.book);
    await loadBooks(refs.searchInput.value.trim());
    showToast(t("bookMetaUpdated"));
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

async function openFoliate() {
  if (!state.selectedBookDetail) return;
  let epubUrl = state.selectedBookDetail.epub_url;
  if (!epubUrl) {
    try {
      const data = await api(`/api/library/book/${encodeURIComponent(state.selectedBookDetail.book_id)}/epub-url`);
      epubUrl = data.url;
    } catch {
      showToast(t("noEpubSource"));
      return;
    }
  }
  refs.foliateFrame.src = `/vendor/foliate/reader.html?url=${encodeURIComponent(epubUrl)}`;
  refs.foliateDialog.showModal();
}

function bindEvents() {
  refs.navLibrary.addEventListener("click", () => showPage("library"));
  refs.navBook.addEventListener("click", () => showPage("book"));
  refs.navReader.addEventListener("click", () => showPage("reader"));

  refs.btnOpenReaderFromBook.addEventListener("click", async () => {
    if (!state.selectedBookId) return;
    await selectBook(state.selectedBookId, { openPage: "reader", autoOpenChapter: true });
  });
  refs.btnOpenBookEdit.addEventListener("click", () => showPage("book-edit"));
  refs.btnBackBookView.addEventListener("click", () => showPage("book"));

  refs.btnCloseBookActions.addEventListener("click", closeBookActions);
  refs.btnActionOpenBook.addEventListener("click", async () => {
    if (!state.selectedBookActionId) return;
    closeBookActions();
    await selectBook(state.selectedBookActionId, { openPage: "book", autoOpenChapter: false });
  });
  refs.btnActionOpenReader.addEventListener("click", async () => {
    if (!state.selectedBookActionId) return;
    closeBookActions();
    await selectBook(state.selectedBookActionId, { openPage: "reader", autoOpenChapter: true });
  });
  refs.btnActionOpenEdit.addEventListener("click", async () => {
    if (!state.selectedBookActionId) return;
    closeBookActions();
    await selectBook(state.selectedBookActionId, { openPage: "book-edit", autoOpenChapter: false });
  });
  refs.btnActionExportTxt.addEventListener("click", async () => {
    if (!state.selectedBookActionId) return;
    closeBookActions();
    await exportBook(state.selectedBookActionId, "txt");
  });
  refs.btnActionExportEpub.addEventListener("click", async () => {
    if (!state.selectedBookActionId) return;
    closeBookActions();
    await exportBook(state.selectedBookActionId, "epub");
  });
  refs.btnActionDeleteBook.addEventListener("click", async () => {
    if (!state.selectedBookActionId) return;
    const deletingId = state.selectedBookActionId;
    closeBookActions();
    await deleteBook(deletingId);
  });

  refs.btnImport.addEventListener("click", () => refs.importDialog.showModal());
  refs.btnImportCancel.addEventListener("click", () => refs.importDialog.close());

  refs.importForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = refs.importFile.files && refs.importFile.files[0];
    if (!file) return;

    const form = new FormData();
    form.set("file", file);
    form.set("lang_source", refs.importLang.value || "zh");
    form.set("title", refs.importBookTitle.value || "");
    form.set("author", refs.importAuthor.value || "");

    showStatus(t("statusImporting"));
    try {
      const data = await api("/api/library/import", {
        method: "POST",
        body: form,
      });
      refs.importForm.reset();
      refs.importDialog.close();
      showToast(t("toastImportSuccess"));
      await loadBooks(refs.searchInput.value.trim());
      if (data.book && data.book.book_id) {
        await selectBook(data.book.book_id, { openPage: "book", autoOpenChapter: false });
      }
    } catch (error) {
      showToast(error.message || t("toastError"));
    } finally {
      hideStatus();
    }
  });

  refs.searchInput.addEventListener("input", () => {
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(() => {
      loadBooks(refs.searchInput.value.trim()).catch(() => {});
    }, 280);
  });

  refs.btnClearCache.addEventListener("click", clearCache);

  refs.btnOpenSettings.addEventListener("click", openSettings);
  refs.btnCloseSettings.addEventListener("click", closeSettings);

  refs.btnReaderToc.addEventListener("click", openReaderToc);
  refs.btnCloseReaderToc.addEventListener("click", closeReaderToc);

  refs.settingsBackdrop.addEventListener("click", () => {
    closeSettings();
    closeReaderToc();
  });

  refs.themeSelect.addEventListener("change", async () => {
    state.settings.themeId = refs.themeSelect.value;
    applyTheme(state.settings.themeId);
    saveSettingsLocal();
    await persistThemeRemote();
    await saveProgress({ silent: true });
  });

  refs.fontSizeInput.addEventListener("input", () => {
    state.settings.fontSize = Number(refs.fontSizeInput.value) || DEFAULT_SETTINGS.fontSize;
    applyReaderSettings();
  });

  refs.lineHeightInput.addEventListener("input", () => {
    state.settings.lineHeight = Number(refs.lineHeightInput.value) || DEFAULT_SETTINGS.lineHeight;
    applyReaderSettings();
  });

  refs.paragraphSpacingInput.addEventListener("input", () => {
    state.settings.paragraphSpacing = Number(refs.paragraphSpacingInput.value) || DEFAULT_SETTINGS.paragraphSpacing;
    applyReaderSettings();
  });

  refs.settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const anchorChapterId = state.selectedChapterId;
    const anchorRatio = getCurrentScrollRatio();
    const prevReadingMode = state.settings.readingMode;
    state.settings.fontFamily = refs.fontFamilyInput.value.trim() || DEFAULT_SETTINGS.fontFamily;
    state.settings.fontSize = Number(refs.fontSizeInput.value) || DEFAULT_SETTINGS.fontSize;
    state.settings.textAlign = refs.textAlignSelect.value || DEFAULT_SETTINGS.textAlign;
    state.settings.lineHeight = Number(refs.lineHeightInput.value) || DEFAULT_SETTINGS.lineHeight;
    state.settings.paragraphSpacing = Number(refs.paragraphSpacingInput.value) || DEFAULT_SETTINGS.paragraphSpacing;
    state.settings.readingMode = refs.readingModeSelect.value || DEFAULT_SETTINGS.readingMode;

    applyReaderSettings();
    saveSettingsLocal();
    await persistThemeRemote();
    if (anchorChapterId && prevReadingMode !== state.settings.readingMode) {
      await selectChapter(anchorChapterId, { restoreRatio: anchorRatio });
    }
    showToast(t("toastSettingsSaved"));
  });

  refs.btnResetSettings.addEventListener("click", resetSettingsToDefault);

  refs.readingModeSelect.addEventListener("change", () => {
    const anchorChapterId = state.selectedChapterId;
    const anchorRatio = getCurrentScrollRatio();
    state.settings.readingMode = refs.readingModeSelect.value || DEFAULT_SETTINGS.readingMode;
    applyReaderSettings();
    if (anchorChapterId) {
      selectChapter(anchorChapterId, { restoreRatio: anchorRatio }).catch(() => {});
      return;
    }
    restoreScrollRatio(0);
  });

  refs.btnModeRaw.addEventListener("click", () => switchMode("raw"));
  refs.btnModeTrans.addEventListener("click", () => switchMode("trans"));

  refs.btnTranslateMode.addEventListener("click", async () => {
    const anchorChapterId = state.selectedChapterId;
    const anchorRatio = getCurrentScrollRatio();
    state.translateMode = state.translateMode === "local" ? "server" : "local";
    state.chapterContentCache.clear();
    refs.btnTranslateMode.textContent = state.translateMode === "local" ? t("modeLocal") : t("modeServer");
    if (state.mode === "trans" && anchorChapterId) {
      await selectChapter(anchorChapterId, { restoreRatio: anchorRatio });
    }
  });

  refs.btnTocModeRaw.addEventListener("click", () => switchTocMode("raw"));
  refs.btnTocModeTrans.addEventListener("click", () => switchTocMode("trans"));
  refs.btnTranslateTitles.addEventListener("click", translateTitlesNow);

  refs.btnTocPrev.addEventListener("click", () => {
    if (state.tocPagination.page > 1) {
      loadTocPage(state.tocPagination.page - 1).catch(() => {});
    }
  });

  refs.btnTocNext.addEventListener("click", () => {
    if (state.tocPagination.page < state.tocPagination.total_pages) {
      loadTocPage(state.tocPagination.page + 1).catch(() => {});
    }
  });

  refs.bookMetaForm.addEventListener("submit", submitBookMeta);

  refs.btnUploadCover.addEventListener("click", () => {
    if (!state.selectedBookDetail) return;
    refs.coverUploadInput.click();
  });

  refs.coverUploadInput.addEventListener("change", async () => {
    const file = refs.coverUploadInput.files && refs.coverUploadInput.files[0];
    if (!file) return;
    await uploadCoverFile(file);
    refs.coverUploadInput.value = "";
  });

  refs.btnApplyCoverUrl.addEventListener("click", applyCoverUrl);

  refs.btnOpenExtraLink.addEventListener("click", () => {
    const url = (state.selectedBookDetail && state.selectedBookDetail.extra_link) || "";
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  });

  refs.btnFoliate.addEventListener("click", openFoliate);

  refs.btnCloseFoliate.addEventListener("click", () => {
    refs.foliateDialog.close();
    refs.foliateFrame.src = "about:blank";
  });

  refs.btnFullscreen.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // bỏ qua
    }
  });

  refs.btnPrev.addEventListener("click", () => goChapter(-1));
  refs.btnNext.addEventListener("click", () => goChapter(1));

  refs.readerContentScroll.addEventListener("scroll", handleReaderScroll);

  nameEditor.bind();

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSettings();
      closeReaderToc();
      closeBookActions();
      nameEditor.close();
    }
  });
}

async function init() {
  applyI18n();
  bindEvents();

  fillSettingsForm();
  showPage("library");

  try {
    await loadThemes();
    fillSettingsForm();
    await loadBooks();
  } catch (error) {
    showToast(error.message || t("toastError"));
  }

  updateReaderModeButtons();
}

init();
