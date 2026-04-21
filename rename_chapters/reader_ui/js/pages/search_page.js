import { initShell } from "../site_common.js?v=20260421-rawguard1";
import { normalizeDisplayTitle } from "../reader_text.js?v=20260307-br2";

const refs = {
  searchInput: document.getElementById("search-input"),
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
  booksLoading: false,
  chaptersLoading: false,
  searchSeq: 0,
  searchController: null,
  translationEnabled: true,
  translationMode: "server",
  translationLocalSig: "{}",
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

function updateQueryUrl() {
  const params = new URLSearchParams();
  const query = String(state.query || "").trim();
  if (query) params.set("q", query);
  const next = params.toString() ? `/search?${params.toString()}` : "/search";
  if (`${window.location.pathname}${window.location.search}` !== next) {
    window.history.replaceState({}, "", next);
  }
}

function createSkeletonBlock(className = "") {
  const node = document.createElement("div");
  node.className = `ui-skeleton-block${className ? ` ${className}` : ""}`;
  return node;
}

function createSearchBookSkeletonCard(index = 0) {
  const card = document.createElement("article");
  card.className = "book-card book-card-shell book-card-loading";
  card.setAttribute("aria-hidden", "true");
  card.dataset.skeletonId = String(index);

  const cover = document.createElement("div");
  cover.className = "book-card-cover book-card-cover-skeleton";

  const body = document.createElement("div");
  body.append(
    createSkeletonBlock("book-card-skeleton-title"),
    createSkeletonBlock("book-card-skeleton-meta"),
  );

  const progressRow = document.createElement("div");
  progressRow.className = "book-card-progress-row";
  progressRow.append(
    createSkeletonBlock("book-card-skeleton-text"),
    createSkeletonBlock("book-card-skeleton-pill"),
  );
  body.append(progressRow, createSkeletonBlock("book-card-skeleton-download"));

  card.append(cover, body);
  return card;
}

function createSearchChapterSkeleton(index = 0) {
  const li = document.createElement("li");
  li.setAttribute("aria-hidden", "true");
  li.dataset.skeletonId = String(index);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chapter-hit is-skeleton";
  btn.disabled = true;

  const title = createSkeletonBlock("chapter-hit-skeleton-line");
  const sub = createSkeletonBlock("chapter-hit-skeleton-line is-short");
  btn.append(title, sub);
  li.appendChild(btn);
  return li;
}

function renderBooks() {
  refs.searchBooksGrid.innerHTML = "";
  refs.searchBooksCount.textContent = state.booksLoading
    ? "..."
    : state.shell.t("libraryCount", { count: state.books.length });

  if (state.booksLoading) {
    refs.searchBooksEmpty.textContent = state.shell.t("searchBooksLoading");
    for (let i = 0; i < 6; i += 1) {
      refs.searchBooksGrid.appendChild(createSearchBookSkeletonCard(i));
    }
    return;
  }

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
  refs.chapterHitsCount.textContent = state.chaptersLoading
    ? "..."
    : state.shell.t("searchChapterCount", { count: state.chapters.length });

  if (state.chaptersLoading) {
    refs.chapterHitsEmpty.textContent = state.shell.t("chapterHitsLoading");
    for (let i = 0; i < 5; i += 1) {
      refs.chapterHitList.appendChild(createSearchChapterSkeleton(i));
    }
    return;
  }

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

async function fetchSearchScope(queryText, scope, signal) {
  return state.shell.api(
    `/api/search?q=${encodeURIComponent(queryText)}&scope=${encodeURIComponent(scope)}`,
    { signal },
  );
}

async function runSearch(queryText, { updateUrl = true } = {}) {
  state.query = String(queryText || "").trim();
  if (refs.searchInput) refs.searchInput.value = state.query;
  if (updateUrl) updateQueryUrl();
  if (state.searchController) {
    try {
      state.searchController.abort();
    } catch {
      // ignore aborted controller cleanup
    }
    state.searchController = null;
  }

  if (!state.query) {
    state.books = [];
    state.chapters = [];
    state.booksLoading = false;
    state.chaptersLoading = false;
    renderBooks();
    renderChapterHits();
    return;
  }

  const searchSeq = state.searchSeq + 1;
  state.searchSeq = searchSeq;
  const controller = new AbortController();
  state.searchController = controller;
  state.books = [];
  state.chapters = [];
  state.booksLoading = true;
  state.chaptersLoading = true;
  renderBooks();
  renderChapterHits();
  state.shell.showStatus(state.shell.t("statusSearching"));
  try {
    const booksData = await fetchSearchScope(state.query, "books", controller.signal);
    if (searchSeq !== state.searchSeq) return;
    state.books = Array.isArray(booksData && booksData.books) ? booksData.books : [];
    state.booksLoading = false;
    renderBooks();

    const chaptersData = await fetchSearchScope(state.query, "chapters", controller.signal);
    if (searchSeq !== state.searchSeq) return;
    state.chapters = Array.isArray(chaptersData && chaptersData.chapters) ? chaptersData.chapters : [];
    state.chaptersLoading = false;
    renderChapterHits();
  } catch (error) {
    if (error && error.name === "AbortError") return;
    state.booksLoading = false;
    state.chaptersLoading = false;
    renderBooks();
    renderChapterHits();
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    if (state.searchController === controller) state.searchController = null;
    if (searchSeq === state.searchSeq) state.shell.hideStatus();
  }
}

async function init() {
  state.shell = await initShell({
    page: "search",
    onSearchSubmit: (q) => runSearch(q, { updateUrl: true }),
  });
  state.translationEnabled = typeof state.shell.getTranslationEnabled === "function"
    ? state.shell.getTranslationEnabled()
    : true;
  state.translationMode = typeof state.shell.getTranslationMode === "function"
    ? state.shell.getTranslationMode()
    : "server";

  refs.searchBooksTitle.textContent = state.shell.t("searchBooksTitle");
  refs.chapterHitsTitle.textContent = state.shell.t("chapterHitsTitle");

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
    runSearch(state.query, { updateUrl: false }).catch(() => {});
  });

  const query = state.shell.parseQuery();
  state.translationLocalSig = localTranslationSettingsSignature(state.shell);
  state.query = String(query.q || "").trim();
  await runSearch(state.query, { updateUrl: false });
}

init();
