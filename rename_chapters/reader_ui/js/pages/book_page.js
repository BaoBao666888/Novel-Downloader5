import { initShell } from "../site_common.js?v=20260220-vb03";
import { normalizeDisplayTitle } from "../reader_text.js?v=20260215-vb01";

const refs = {
  bookInfoTitle: document.getElementById("book-info-title"),
  bookEmpty: document.getElementById("book-empty"),
  bookViewWrap: document.getElementById("book-view-wrap"),
  bookCover: document.getElementById("book-cover"),
  bookTitleDisplay: document.getElementById("book-title-display"),
  bookSubtitle: document.getElementById("book-subtitle"),
  btnOpenExtraLink: document.getElementById("btn-open-extra-link"),
  btnOpenReaderFromBook: document.getElementById("btn-open-reader-from-book"),
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
};

function supportsTranslation(book) {
  if (!book) return false;
  if (typeof book.translation_supported === "boolean") return book.translation_supported;
  const sourceType = String(book.source_type || "").toLowerCase();
  if (sourceType === "vbook_comic" || sourceType === "comic") return false;
  const lang = String(book.lang_source || "").toLowerCase();
  return lang === "zh" || lang.startsWith("zh-");
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

function populateBook() {
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

  refs.viewTitle.textContent = book.title || "";
  refs.viewTitleVi.textContent = normalizeDisplayTitle(book.title_vi || "");
  refs.viewAuthor.textContent = book.author || "";
  refs.viewAuthorVi.textContent = book.author_vi || "";
  refs.viewSummary.textContent = book.summary || "";
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
  refs.btnOpenExtraLink.disabled = !(book.extra_link || "").trim();

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

    li.appendChild(btn);
    refs.tocList.appendChild(li);
  }

  refs.btnTocPrev.disabled = state.pagination.page <= 1;
  refs.btnTocNext.disabled = state.pagination.page >= state.pagination.total_pages;
}

async function loadBook() {
  if (!state.bookId) {
    refs.bookEmpty.textContent = `${state.shell.t("noBookSelected")}. ${state.shell.t("noBookSelectedHint")}`;
    return;
  }
  state.shell.showStatus(state.shell.t("statusLoadingBookInfo"));
  try {
    const mode = state.mode;
    const detail = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}?mode=${encodeURIComponent(mode)}&translation_mode=${encodeURIComponent(state.translateMode)}`);
    state.book = detail;
    populateBook();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function loadToc(page = 1) {
  if (!state.bookId || !state.book) return;
  state.shell.showStatus(state.shell.t("statusLoadingToc"));
  try {
    const mode = effectiveModeForBook(state.book, state.mode);
    const data = await state.shell.api(`/api/library/book/${encodeURIComponent(state.bookId)}/chapters?page=${page}&page_size=${state.pagination.page_size}&mode=${mode}&translation_mode=${encodeURIComponent(state.translateMode)}`);
    state.tocItems = data.items || [];
    state.pagination = { ...state.pagination, ...(data.pagination || {}) };
    renderToc();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
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

function renderBookNameRows() {
  refs.bookNameBody.innerHTML = "";
  const current = state.bookNameSets[state.bookActiveNameSet] || {};
  const entries = Object.entries(current).sort((a, b) => a[0].localeCompare(b[0], "zh-Hans-CN"));
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
        await updateBookNameEntry(source, input.value.trim(), false);
      });
      const btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.className = "btn btn-small";
      btnDelete.textContent = state.shell.t("deleteNameEntry");
      btnDelete.addEventListener("click", async () => {
        await updateBookNameEntry(source, "", true);
      });
      tdAction.append(btnSave, btnDelete);
      tr.append(tdSource, tdTarget, tdAction);
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
    await state.shell.api("/api/name-sets/entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        target,
        delete: del,
        set_name: state.bookActiveNameSet,
        book_id: state.bookId,
      }),
    });
    await loadBookNameSets();
    state.shell.showToast(state.shell.t("nameEntryApplied"));
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

function buildBookNameExportData() {
  const active = state.bookActiveNameSet || "Mặc định";
  const entries = state.bookNameSets[active] || {};
  return {
    type: "reader_name_set",
    version: 1,
    book_id: state.bookId,
    active_set: active,
    sets: { [active]: entries },
    exported_at: new Date().toISOString(),
  };
}

function downloadBookNameJson(data, filenameBase = "book_name_set") {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function normalizeBookImportedNameSet(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.sets && typeof payload.sets === "object") {
    const activeSet = String(payload.active_set || Object.keys(payload.sets)[0] || "Mặc định");
    return {
      sets: payload.sets,
      active_set: activeSet,
      bump_version: true,
      book_id: state.bookId,
    };
  }
  if (payload.entries && typeof payload.entries === "object") {
    const setName = String(payload.set_name || state.bookActiveNameSet || "Mặc định");
    return {
      sets: { [setName]: payload.entries },
      active_set: setName,
      bump_version: true,
      book_id: state.bookId,
    };
  }
  if (typeof payload === "object") {
    const setName = String(state.bookActiveNameSet || "Mặc định");
    return {
      sets: { [setName]: payload },
      active_set: setName,
      bump_version: true,
      book_id: state.bookId,
    };
  }
  return null;
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

  refs.bookInfoTitle.textContent = state.shell.t("bookInfoTitle");
  refs.bookEmpty.textContent = `${state.shell.t("noBookSelected")}. ${state.shell.t("noBookSelectedHint")}`;
  refs.btnOpenExtraLink.textContent = state.shell.t("openExtraLink");
  refs.btnOpenReaderFromBook.textContent = state.shell.t("openBookFromInfo");
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
  refs.btnBookNameExport.textContent = state.shell.t("nameSetExport");
  refs.btnBookNameImport.textContent = state.shell.t("nameSetImport");
  refs.bookNameSetLabel.textContent = state.shell.t("nameSetLabel");
  refs.bookNameCount.textContent = state.shell.t("bookNameCount", { count: 0 });
  refs.btnBookNameSaveEntry.textContent = state.shell.t("addNameEntry");

  refs.btnOpenExtraLink.addEventListener("click", () => {
    if (!state.book || !state.book.extra_link) return;
    window.open(state.book.extra_link, "_blank", "noopener,noreferrer");
  });

  refs.btnOpenReaderFromBook.addEventListener("click", () => {
    if (!state.bookId) return;
    window.location.href = `/reader?book_id=${encodeURIComponent(state.bookId)}`;
  });
  refs.btnOpenBookNames.addEventListener("click", openBookNameDialog);
  refs.btnOpenBookEdit.addEventListener("click", () => refs.bookEditDialog.showModal());
  refs.btnCloseBookEdit.addEventListener("click", () => refs.bookEditDialog.close());
  refs.btnCloseBookNames.addEventListener("click", () => refs.bookNameDialog.close());
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
      await loadBookNameSets();
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
      await loadBookNameSets();
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    } finally {
      state.shell.hideStatus();
    }
  });
  refs.btnBookNameExport.addEventListener("click", () => {
    const active = state.bookActiveNameSet || "Mặc định";
    const filename = `book_name_set_${active}`.replace(/[^\w\-]+/g, "_");
    downloadBookNameJson(buildBookNameExportData(), filename);
  });
  refs.btnBookNameImport.addEventListener("click", () => refs.bookNameImportFile.click());
  refs.bookNameImportFile.addEventListener("change", async () => {
    const file = refs.bookNameImportFile.files && refs.bookNameImportFile.files[0];
    refs.bookNameImportFile.value = "";
    if (!file) return;
    state.shell.showStatus(state.shell.t("statusLoadingBookNames"));
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const payload = normalizeBookImportedNameSet(parsed);
      if (!payload) {
        throw new Error(state.shell.t("nameSetImportInvalid"));
      }
      await state.shell.api("/api/name-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await loadBookNameSets();
      state.shell.showToast(state.shell.t("nameSetImported"));
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    } finally {
      state.shell.hideStatus();
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
  refs.btnTocPrev.addEventListener("click", () => {
    if (state.pagination.page > 1) loadToc(state.pagination.page - 1);
  });
  refs.btnTocNext.addEventListener("click", () => {
    if (state.pagination.page < state.pagination.total_pages) loadToc(state.pagination.page + 1);
  });

  const query = state.shell.parseQuery();
  state.bookId = (query.book_id || "").trim();
  state.mode = (query.mode || "trans").toLowerCase() === "raw" ? "raw" : "trans";

  await loadBook();
  await loadToc(1);
}

init();
