import { initShell } from "../site_common.js?v=20260210-r13";
import { normalizeDisplayTitle } from "../reader_text.js?v=20260210-r13";

const refs = {
  searchBooksTitle: document.getElementById("search-books-title"),
  searchBooksCount: document.getElementById("search-books-count"),
  searchBooksGrid: document.getElementById("search-books-grid"),
  searchBooksEmpty: document.getElementById("search-books-empty"),

  chapterHitsTitle: document.getElementById("chapter-hits-title"),
  chapterHitsCount: document.getElementById("chapter-hits-count"),
  chapterHitList: document.getElementById("chapter-hit-list"),
  chapterHitsEmpty: document.getElementById("chapter-hits-empty"),
};

const state = {
  shell: null,
  query: "",
  books: [],
  chapters: [],
};

function renderBooks() {
  refs.searchBooksGrid.innerHTML = "";
  refs.searchBooksCount.textContent = state.shell.t("libraryCount", { count: state.books.length });

  if (!state.books.length) {
    refs.searchBooksEmpty.textContent = state.query
      ? state.shell.t("searchBooksEmpty")
      : state.shell.t("searchHint");
    return;
  }

  refs.searchBooksEmpty.textContent = "";
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
    card.addEventListener("click", () => {
      window.location.href = `/book?book_id=${encodeURIComponent(book.book_id)}`;
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.location.href = `/book?book_id=${encodeURIComponent(book.book_id)}`;
      }
    });

    refs.searchBooksGrid.appendChild(card);
  }
}

function renderChapterHits() {
  refs.chapterHitList.innerHTML = "";
  refs.chapterHitsCount.textContent = state.shell.t("searchChapterCount", { count: state.chapters.length });

  if (!state.chapters.length) {
    refs.chapterHitsEmpty.textContent = state.query
      ? state.shell.t("chapterHitsEmpty")
      : state.shell.t("searchHint");
    return;
  }

  refs.chapterHitsEmpty.textContent = "";
  for (const hit of state.chapters) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chapter-hit";

    const title = document.createElement("div");
    title.className = "chapter-hit-title";
    title.textContent = `${hit.book_title_display || hit.book_title || ""} • ${hit.title_display || hit.title_raw || ""}`;

    const sub = document.createElement("div");
    sub.className = "chapter-hit-sub";
    sub.textContent = `#${hit.chapter_order || "?"} • ${state.shell.t("jumpToChapter")}`;

    btn.append(title, sub);
    btn.addEventListener("click", () => {
      window.location.href = `/reader?book_id=${encodeURIComponent(hit.book_id)}&chapter_id=${encodeURIComponent(hit.chapter_id)}`;
    });

    li.appendChild(btn);
    refs.chapterHitList.appendChild(li);
  }
}

async function loadResults(queryText) {
  state.query = String(queryText || "").trim();
  if (!state.query) {
    state.books = [];
    state.chapters = [];
    renderBooks();
    renderChapterHits();
    return;
  }

  state.shell.showStatus(state.shell.t("statusSearching"));
  try {
    const data = await state.shell.api(`/api/search?q=${encodeURIComponent(state.query)}`);
    state.books = data.books || [];
    state.chapters = data.chapters || [];
    renderBooks();
    renderChapterHits();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function init() {
  state.shell = await initShell({
    page: "search",
    onSearchSubmit: (q) => {
      const query = String(q || "").trim();
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      const next = params.toString() ? `/search?${params.toString()}` : "/search";
      window.history.replaceState({}, "", next);
      loadResults(query);
    },
  });

  refs.searchBooksTitle.textContent = state.shell.t("searchBooksTitle");
  refs.chapterHitsTitle.textContent = state.shell.t("chapterHitsTitle");

  const query = state.shell.parseQuery();
  await loadResults((query.q || "").trim());
}

init();
