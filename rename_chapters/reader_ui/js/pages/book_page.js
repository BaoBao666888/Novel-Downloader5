import { initShell } from "../site_common.js?v=20260405-name1";
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
  btnOpenBookNames: document.getElementById("btn-open-book-names"),
  btnOpenBookEdit: document.getElementById("btn-open-book-edit"),

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

  tocTitle: document.getElementById("toc-title"),
  btnTocModeRaw: document.getElementById("btn-toc-mode-raw"),
  btnTocModeTrans: document.getElementById("btn-toc-mode-trans"),
  btnTranslateTitles: document.getElementById("btn-translate-titles"),
  btnRefreshBookToc: document.getElementById("btn-refresh-book-toc"),
  tocSkeleton: document.getElementById("toc-skeleton"),
  tocList: document.getElementById("toc-list"),
  btnTocPrev: document.getElementById("btn-toc-prev"),
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
  },
  tocItems: [],
  bookNameSets: { "Mặc định": {} },
  bookActiveNameSet: "Mặc định",
  translationEnabled: true,
  translationLocalSig: "{}",
  categories: [],
  bookCategoryDraftIds: [],
  downloadWatchTimer: null,
  downloadEventSource: null,
  downloadWatchReconnectTimer: null,
  downloadWatchBusy: false,
  downloadWatchSig: "",
  downloadWatchHadActive: false,
  downloadWatchIdleTicks: 0,
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
  if (!url) {
    refs.bookCover.removeAttribute("src");
    wrap.classList.remove("has-image");
    return;
  }
  refs.bookCover.src = url;
  wrap.classList.add("has-image");
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
  refs.bookSubtitle.textContent = `${book.author_display || book.author || "Khuyết danh"} • ${book.chapter_count || 0} chương • ${book.lang_source || "zh"}`;

  refs.viewTitle.textContent = normalizeParagraphDisplayText(book.title || "", { singleLine: true });
  refs.viewTitleVi.textContent = normalizeDisplayTitle(
    supportsTranslation(book) ? (book.title_display || book.title_vi || "") : (book.title_vi || ""),
  );
  refs.viewAuthor.textContent = normalizeParagraphDisplayText(book.author || "", { singleLine: true });
  refs.viewAuthorVi.textContent = normalizeParagraphDisplayText(
    supportsTranslation(book) ? (book.author_display || book.author_vi || "") : (book.author_vi || ""),
    { singleLine: true },
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
  refs.fieldCoverUrl.value = book.cover_path || book.cover_url || "";

  const canTranslate = supportsTranslation(book);
  refs.btnTocModeTrans.classList.toggle("hidden", !canTranslate);
  refs.btnTranslateTitles.classList.toggle("hidden", !canTranslate);
  refs.btnOpenBookNames.classList.toggle("hidden", !canTranslate);
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
    title.textContent = `${chapter.chapter_order}. ${normalizeDisplayTitle(chapter.title_display || chapter.title_raw || "")}`;

    const sub = document.createElement("div");
    sub.className = "toc-item-sub";
    if (state.book && state.book.is_comic) {
      sub.textContent = `${chapter.word_count || 0} ảnh`;
    } else {
      sub.textContent = `${chapter.word_count || 0} ký tự`;
    }

    btn.append(title, sub);
    btn.addEventListener("click", () => {
      window.location.href = `/reader?book_id=${encodeURIComponent(state.bookId)}&chapter_id=${encodeURIComponent(chapter.chapter_id)}`;
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
  showTocSkeleton(false);
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
      const bid = data && data.book && data.book.book_id;
      if (bid) {
        window.location.href = `/book?book_id=${encodeURIComponent(bid)}`;
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
  refs.btnOpenBookNames.textContent = state.shell.t("bookPrivateNames");
  refs.btnOpenBookEdit.textContent = state.shell.t("editBookFromInfo");

  refs.labelViewTitle.textContent = state.shell.t("viewTitleRaw");
  refs.labelViewTitleVi.textContent = state.shell.t("viewTitleVi");
  refs.labelViewAuthor.textContent = state.shell.t("viewAuthorRaw");
  refs.labelViewAuthorVi.textContent = state.shell.t("viewAuthorVi");
  refs.labelViewSummary.textContent = state.shell.t("viewSummary");
  refs.labelViewExtraLink.textContent = state.shell.t("viewExtraLink");

  refs.tocTitle.textContent = state.shell.t("tocTitle");
  refs.btnTocModeRaw.textContent = state.shell.t("tocModeRaw");
  refs.btnTocModeTrans.textContent = state.shell.t("tocModeTrans");
  refs.btnTranslateTitles.textContent = state.shell.t("translateTitles");
  refs.btnTocPrev.textContent = state.shell.t("tocPrev");
  refs.btnTocNext.textContent = state.shell.t("tocNext");
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
  if (refs.bookCategoriesDialogTitle) refs.bookCategoriesDialogTitle.textContent = state.shell.t("bookCategoriesDialogTitle");
  if (refs.btnCloseBookCategoriesDialog) refs.btnCloseBookCategoriesDialog.textContent = state.shell.t("close");
  if (refs.bookCategoriesDialogSearchLabel) refs.bookCategoriesDialogSearchLabel.textContent = state.shell.t("categorySearchLabel");
  if (refs.btnCancelBookCategoriesDialog) refs.btnCancelBookCategoriesDialog.textContent = state.shell.t("cancel");
  if (refs.btnSaveBookCategoriesDialog) refs.btnSaveBookCategoriesDialog.textContent = state.shell.t("save");
  renderBookInfoSkeleton();
  renderTocSkeleton();

  refs.btnOpenExtraLink.addEventListener("click", () => {
    if (!state.book || !state.book.extra_link) return;
    window.open(state.book.extra_link, "_blank", "noopener,noreferrer");
  });

  refs.btnOpenReaderFromBook.addEventListener("click", () => {
    if (!state.bookId) return;
    window.location.href = `/reader?book_id=${encodeURIComponent(state.bookId)}`;
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
  refs.btnOpenBookNames.addEventListener("click", openBookNameDialog);
  refs.btnOpenBookEdit.addEventListener("click", () => refs.bookEditDialog.showModal());
  refs.btnCloseBookEdit.addEventListener("click", () => refs.bookEditDialog.close());
  refs.btnCloseBookNames.addEventListener("click", () => refs.bookNameDialog.close());
  refs.btnCloseBookNameBulk.addEventListener("click", () => refs.bookNameBulkDialog.close());
  refs.btnCloseBookNameSuggest.addEventListener("click", () => refs.bookNameSuggestDialog.close());
  refs.btnCancelBookNameBulk.addEventListener("click", () => refs.bookNameBulkDialog.close());
  refs.bookNameBulkDialog.addEventListener("close", () => {
    if (refs.bookNameBulkForm) refs.bookNameBulkForm.reset();
  });
  refs.bookNameBulkForm.addEventListener("submit", submitBookNameBulkEntries);
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
    if (enabled === state.translationEnabled && mode === state.translateMode && !(["local", "hanviet"].includes(mode) && localChanged)) return;
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
  state.mode = (query.mode || "trans").toLowerCase() === "raw" ? "raw" : "trans";

  await Promise.all([
    loadCategories({ silent: true }).catch(() => null),
    loadBook({ refreshOnline: true, showSkeleton: true }),
  ]);
  await loadToc(1, { showSkeleton: true });
  startDownloadWatcher();
}

init();
