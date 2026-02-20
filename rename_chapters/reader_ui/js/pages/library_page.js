import { initShell } from "../site_common.js?v=20260220-vb11";
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

  bookActionsDialog: document.getElementById("book-actions-dialog"),
  bookActionsTitle: document.getElementById("book-actions-title"),
  bookActionsSubtitle: document.getElementById("book-actions-subtitle"),
  btnCloseBookActions: document.getElementById("btn-close-book-actions"),
  btnActionOpenBook: document.getElementById("btn-action-open-book"),
  btnActionOpenReader: document.getElementById("btn-action-open-reader"),
  btnActionExportTxt: document.getElementById("btn-action-export-txt"),
  btnActionExportEpub: document.getElementById("btn-action-export-epub"),
  btnActionDeleteBook: document.getElementById("btn-action-delete-book"),
};

const state = {
  historyItems: [],
  books: [],
  selectedBookId: null,
  shell: null,
};

function getErrorMessage(error) {
  if (!error) return state.shell ? state.shell.t("toastError") : "Có lỗi xảy ra.";
  return String(error.displayMessage || error.message || (state.shell ? state.shell.t("toastError") : "Có lỗi xảy ra."));
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

function closeActions() {
  if (refs.bookActionsDialog && refs.bookActionsDialog.open) {
    refs.bookActionsDialog.close();
  }
}

function openActions(bookId) {
  const book = state.books.find((x) => x.book_id === bookId);
  if (!book) return;
  state.selectedBookId = bookId;
  refs.bookActionsSubtitle.textContent = `${book.title_display || book.title || ""} • ${book.author_display || book.author || "Khuyết danh"}`;
  if (refs.btnActionOpenReader) {
    const percent = Number(book.progress_percent || 0);
    refs.btnActionOpenReader.textContent = percent > 0 ? state.shell.t("openReaderContinue") : state.shell.t("openReader");
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

    if (source) {
      body.append(title, author, source, infoRow);
    } else {
      body.append(title, author, infoRow);
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

async function loadLibraryData() {
  state.shell.showStatus(state.shell.t("statusLoadingBooks"));
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
    state.shell.showToast(getErrorMessage(error));
  } finally {
    state.shell.hideStatus();
  }
}

async function exportBook(format) {
  if (!state.selectedBookId) return;
  closeActions();
  const ensureTranslated = window.confirm(state.shell.t("ensureTranslate"));
  state.shell.showStatus(state.shell.t("statusExporting"));
  try {
    const payload = await state.shell.api(`/api/library/book/${encodeURIComponent(state.selectedBookId)}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format, ensure_translated: ensureTranslated, translation_mode: "server" }),
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
    onImported: (data) => {
      const bid = data && data.book && data.book.book_id;
      if (bid) {
        window.location.href = `/book?book_id=${encodeURIComponent(bid)}`;
        return;
      }
      loadLibraryData();
    },
  });

  refs.historyTitle.textContent = state.shell.t("historyTitle");
  refs.libraryTitle.textContent = state.shell.t("libraryTitle");

  refs.bookActionsTitle.textContent = state.shell.t("bookActionsTitle");
  refs.btnCloseBookActions.textContent = state.shell.t("close");
  refs.btnActionOpenBook.textContent = state.shell.t("openBookInfo");
  refs.btnActionOpenReader.textContent = state.shell.t("openReader");
  refs.btnActionExportTxt.textContent = state.shell.t("exportTxt");
  refs.btnActionExportEpub.textContent = state.shell.t("exportEpub");
  refs.btnActionDeleteBook.textContent = state.shell.t("deleteBook");

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
  refs.btnActionExportTxt.addEventListener("click", () => exportBook("txt"));
  refs.btnActionExportEpub.addEventListener("click", () => exportBook("epub"));
  refs.btnActionDeleteBook.addEventListener("click", deleteBook);

  await loadLibraryData();
}

init();
