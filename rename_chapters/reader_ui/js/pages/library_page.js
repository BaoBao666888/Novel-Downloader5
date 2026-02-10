import { initShell } from "../site_common.js?v=20260210-r13";
import { normalizeDisplayTitle } from "../reader_text.js?v=20260210-r13";

const refs = {
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
  books: [],
  selectedBookId: null,
  shell: null,
};

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

    body.append(title, author);
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

async function loadBooks() {
  state.shell.showStatus(state.shell.t("statusLoadingBooks"));
  try {
    const data = await state.shell.api("/api/library/books");
    state.books = data.items || [];
    renderBooks();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
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
    state.shell.showToast(error.message || state.shell.t("toastError"));
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
    await loadBooks();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
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
      loadBooks();
    },
  });

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

  await loadBooks();
}

init();
