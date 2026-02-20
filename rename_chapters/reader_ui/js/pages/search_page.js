import { initShell } from "../site_common.js?v=20260220-vb02";
import { normalizeDisplayTitle } from "../reader_text.js?v=20260220-vb02";

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

  vbookSearchTitle: document.getElementById("vbook-search-title"),
  vbookSearchMeta: document.getElementById("vbook-search-meta"),
  vbookPluginLabel: document.getElementById("vbook-plugin-label"),
  vbookPluginSelect: document.getElementById("vbook-plugin-select"),
  btnVbookSearchRun: document.getElementById("btn-vbook-search-run"),
  btnVbookSearchReset: document.getElementById("btn-vbook-search-reset"),
  vbookSearchGrid: document.getElementById("vbook-search-grid"),
  vbookSearchEmpty: document.getElementById("vbook-search-empty"),
  btnVbookSearchPrev: document.getElementById("btn-vbook-search-prev"),
  vbookSearchPage: document.getElementById("vbook-search-page"),
  btnVbookSearchNext: document.getElementById("btn-vbook-search-next"),

  vbookDetailDialog: document.getElementById("vbook-detail-dialog"),
  vbookDetailDialogTitle: document.getElementById("vbook-detail-dialog-title"),
  btnVbookDetailClose: document.getElementById("btn-vbook-detail-close"),
  vbookDetailSubtitle: document.getElementById("vbook-detail-subtitle"),
  vbookDetailCover: document.getElementById("vbook-detail-cover"),
  vbookDetailTitle: document.getElementById("vbook-detail-title"),
  vbookDetailAuthor: document.getElementById("vbook-detail-author"),
  vbookDetailDesc: document.getElementById("vbook-detail-desc"),
  btnVbookDetailImport: document.getElementById("btn-vbook-detail-import"),
  vbookDetailTocTitle: document.getElementById("vbook-detail-toc-title"),
  vbookDetailTocList: document.getElementById("vbook-detail-toc-list"),
  vbookDetailTocEmpty: document.getElementById("vbook-detail-toc-empty"),
  btnVbookTocPrev: document.getElementById("btn-vbook-toc-prev"),
  vbookTocPage: document.getElementById("vbook-toc-page"),
  btnVbookTocNext: document.getElementById("btn-vbook-toc-next"),
};

const state = {
  shell: null,
  query: "",
  books: [],
  chapters: [],
  online: {
    plugins: [],
    pluginId: "",
    page: 1,
    hasNext: false,
    items: [],
    tokenByPage: { 1: null },
  },
  detail: {
    item: null,
    detail: null,
    pluginId: "",
    toc: [],
    pagination: {
      page: 1,
      pageSize: 80,
      totalPages: 1,
      totalItems: 0,
    },
  },
};

function getCurrentQuery() {
  return String((refs.searchInput && refs.searchInput.value) || state.query || "").trim();
}

function formatPluginLabel(plugin) {
  const base = String((plugin && (plugin.name || plugin.plugin_id)) || "").trim() || state.shell.t("vbookUnknownPlugin");
  const locale = String((plugin && plugin.locale) || "").trim();
  const type = String((plugin && plugin.type) || "").trim();
  const meta = [locale, type].filter(Boolean).join(" • ");
  return meta ? `${base} • ${meta}` : base;
}

function updateQueryUrl() {
  const params = new URLSearchParams();
  const query = state.query.trim();
  if (query) params.set("q", query);
  if (state.online.pluginId) params.set("vpid", state.online.pluginId);
  const next = params.toString() ? `/search?${params.toString()}` : "/search";
  window.history.replaceState({}, "", next);
}

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

function renderOnlinePluginOptions() {
  if (!refs.vbookPluginSelect) return;
  refs.vbookPluginSelect.innerHTML = "";

  const auto = document.createElement("option");
  auto.value = "";
  auto.textContent = state.shell.t("vbookSearchSelectPlugin");
  refs.vbookPluginSelect.appendChild(auto);

  for (const plugin of state.online.plugins) {
    const pid = String(plugin.plugin_id || "").trim();
    if (!pid) continue;
    const opt = document.createElement("option");
    opt.value = pid;
    opt.textContent = formatPluginLabel(plugin);
    refs.vbookPluginSelect.appendChild(opt);
  }
  refs.vbookPluginSelect.value = state.online.pluginId || "";
}

function buildOnlineBookCard(item) {
  const card = document.createElement("article");
  card.className = "book-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");

  const cover = document.createElement("div");
  cover.className = "book-card-cover";
  if (item.cover) {
    const img = document.createElement("img");
    img.src = item.cover;
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
  author.textContent = String(item.author || "").trim() || "Khuyết danh";

  const source = document.createElement("div");
  source.className = "book-card-source";
  source.textContent = formatPluginLabel(item);

  const tools = document.createElement("div");
  tools.className = "book-card-tools";

  const btnDetail = document.createElement("button");
  btnDetail.type = "button";
  btnDetail.className = "btn btn-small";
  btnDetail.textContent = state.shell.t("vbookSearchViewDetail");
  btnDetail.addEventListener("click", (event) => {
    event.stopPropagation();
    openDetailDialog(item);
  });

  const btnImport = document.createElement("button");
  btnImport.type = "button";
  btnImport.className = "btn btn-small btn-primary";
  btnImport.textContent = state.shell.t("vbookSearchImportBook");
  btnImport.addEventListener("click", async (event) => {
    event.stopPropagation();
    await importOnlineBook(item);
  });

  tools.append(btnDetail, btnImport);
  body.append(title, author, source, tools);
  card.append(cover, body);

  card.addEventListener("click", () => openDetailDialog(item));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetailDialog(item);
    }
  });
  return card;
}

function renderOnlineSearch() {
  refs.vbookSearchGrid.innerHTML = "";

  const plugin = state.online.plugins.find((x) => String(x.plugin_id || "") === state.online.pluginId) || null;
  const count = Array.isArray(state.online.items) ? state.online.items.length : 0;
  const page = Math.max(1, Number(state.online.page || 1));
  refs.vbookSearchMeta.textContent = plugin
    ? `${formatPluginLabel(plugin)} • ${state.shell.t("vbookSearchResultCount", { count })}`
    : state.shell.t("vbookSearchMetaIdle");

  let emptyKey = "";
  if (!state.online.plugins.length) {
    emptyKey = "vbookSearchNoPlugins";
  } else if (!state.online.pluginId) {
    emptyKey = "vbookSearchNeedPlugin";
  } else if (!state.query) {
    emptyKey = "searchHint";
  } else if (!count) {
    emptyKey = "vbookSearchEmpty";
  }

  if (emptyKey) {
    refs.vbookSearchEmpty.textContent = state.shell.t(emptyKey);
  } else {
    refs.vbookSearchEmpty.textContent = "";
    for (const item of state.online.items) {
      refs.vbookSearchGrid.appendChild(buildOnlineBookCard(item));
    }
  }

  refs.vbookSearchPage.textContent = state.shell.t("vbookSearchPage", { page });
  refs.btnVbookSearchPrev.disabled = page <= 1 || !state.query || !state.online.pluginId;
  refs.btnVbookSearchNext.disabled = !state.online.hasNext || !state.query || !state.online.pluginId;
}

function renderVbookDetail() {
  const detail = state.detail.detail || {};
  const title = String(detail.title || detail.name || "").trim() || "Không tiêu đề";
  const author = String(detail.author || "").trim() || "Khuyết danh";
  const desc = String(detail.description || "").trim() || state.shell.t("vbookDetailNoDescription");
  const cover = String(detail.cover || "").trim();

  refs.vbookDetailTitle.textContent = normalizeDisplayTitle(title);
  refs.vbookDetailAuthor.textContent = author;
  refs.vbookDetailDesc.textContent = desc;

  refs.vbookDetailCover.innerHTML = "";
  refs.vbookDetailCover.classList.toggle("has-image", Boolean(cover));
  if (cover) {
    const img = document.createElement("img");
    img.src = cover;
    img.alt = title;
    refs.vbookDetailCover.appendChild(img);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "book-card-cover-text";
    fallback.textContent = state.shell.t("noCover");
    refs.vbookDetailCover.appendChild(fallback);
  }

  const page = Math.max(1, Number(state.detail.pagination.page || 1));
  const totalPages = Math.max(1, Number(state.detail.pagination.totalPages || 1));
  refs.vbookTocPage.textContent = state.shell.t("vbookTocPage", { page, total: totalPages });
  refs.btnVbookTocPrev.disabled = page <= 1;
  refs.btnVbookTocNext.disabled = page >= totalPages;

  refs.vbookDetailTocList.innerHTML = "";
  if (!state.detail.toc.length) {
    refs.vbookDetailTocEmpty.textContent = state.shell.t("vbookTocEmpty");
  } else {
    refs.vbookDetailTocEmpty.textContent = "";
    for (const row of state.detail.toc) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chapter-hit";
      const titleNode = document.createElement("div");
      titleNode.className = "chapter-hit-title";
      titleNode.textContent = normalizeDisplayTitle(row.title || `Chương ${row.index || "?"}`);
      const sub = document.createElement("div");
      sub.className = "chapter-hit-sub";
      sub.textContent = `#${row.index || "?"}`;
      btn.append(titleNode, sub);
      li.appendChild(btn);
      refs.vbookDetailTocList.appendChild(li);
    }
  }
}

async function loadVbookPlugins() {
  const payload = await state.shell.api("/api/vbook/plugins");
  const list = Array.isArray(payload && payload.items) ? payload.items : [];
  state.online.plugins = list;
  if (state.online.pluginId && !list.some((x) => String(x.plugin_id || "") === state.online.pluginId)) {
    state.online.pluginId = "";
  }
  if (!state.online.pluginId && list.length) {
    state.online.pluginId = String(list[0].plugin_id || "").trim();
  }
  renderOnlinePluginOptions();
}

async function loadLocalResults(queryText) {
  const q = String(queryText || "").trim();
  state.query = q;
  if (!q) {
    state.books = [];
    state.chapters = [];
    renderBooks();
    renderChapterHits();
    return;
  }
  const data = await state.shell.api(`/api/search?q=${encodeURIComponent(q)}`);
  state.books = Array.isArray(data.books) ? data.books : [];
  state.chapters = Array.isArray(data.chapters) ? data.chapters : [];
  renderBooks();
  renderChapterHits();
}

async function loadOnlineResults({ page = 1, reset = false } = {}) {
  if (reset) {
    state.online.page = 1;
    state.online.hasNext = false;
    state.online.items = [];
    state.online.tokenByPage = { 1: null };
  }
  const q = state.query.trim();
  const pid = String(state.online.pluginId || "").trim();
  if (!q || !pid) {
    state.online.items = [];
    state.online.hasNext = false;
    state.online.page = 1;
    renderOnlineSearch();
    return;
  }

  const targetPage = Math.max(1, Number(page || 1));
  const payload = {
    plugin_id: pid,
    query: q,
    page: targetPage,
  };

  const token = Object.prototype.hasOwnProperty.call(state.online.tokenByPage, targetPage)
    ? state.online.tokenByPage[targetPage]
    : undefined;
  if (token != null && String(token).trim() !== "") {
    payload.next = token;
  }

  const data = await state.shell.api("/api/vbook/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const items = Array.isArray(data && data.items) ? data.items : [];
  const pageNum = Math.max(1, Number((data && data.page) || targetPage));
  const nextToken = (data && Object.prototype.hasOwnProperty.call(data, "next")) ? data.next : null;
  const hasNext = Boolean(data && data.has_next);

  state.online.page = pageNum;
  state.online.items = items;
  state.online.hasNext = hasNext;
  if (!Object.prototype.hasOwnProperty.call(state.online.tokenByPage, pageNum)) {
    state.online.tokenByPage[pageNum] = null;
  }
  if (hasNext && nextToken != null && String(nextToken).trim() !== "") {
    state.online.tokenByPage[pageNum + 1] = nextToken;
  } else {
    delete state.online.tokenByPage[pageNum + 1];
  }
  renderOnlineSearch();
}

async function loadDetailToc(page = 1) {
  const item = state.detail.item;
  if (!item) return;
  const detail = state.detail.detail || {};
  const sourceUrl = String(detail.url || item.detail_url || "").trim();
  if (!sourceUrl) return;
  const pluginId = String((state.detail.pluginId || item.plugin_id) || "").trim();

  const data = await state.shell.api("/api/vbook/toc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: sourceUrl,
      plugin_id: pluginId,
      page,
      page_size: state.detail.pagination.pageSize,
    }),
  });
  const items = Array.isArray(data && data.items) ? data.items : [];
  const pg = (data && data.pagination) || {};
  state.detail.toc = items;
  state.detail.pagination = {
    page: Math.max(1, Number(pg.page || page)),
    pageSize: Math.max(1, Number(pg.page_size || state.detail.pagination.pageSize || 80)),
    totalPages: Math.max(1, Number(pg.total_pages || 1)),
    totalItems: Math.max(0, Number(pg.total_items || 0)),
  };
  renderVbookDetail();
}

async function openDetailDialog(item) {
  state.detail.item = item;
  state.detail.detail = {
    title: item.title || "",
    author: item.author || "",
    description: item.description || "",
    cover: item.cover || "",
    url: item.detail_url || "",
  };
  state.detail.pluginId = String(item.plugin_id || "").trim();
  state.detail.toc = [];
  state.detail.pagination = {
    page: 1,
    pageSize: 80,
    totalPages: 1,
    totalItems: 0,
  };
  renderVbookDetail();
  if (!refs.vbookDetailDialog.open) refs.vbookDetailDialog.showModal();

  state.shell.showStatus(state.shell.t("statusLoadingVbookDetail"));
  try {
    const data = await state.shell.api("/api/vbook/detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: item.detail_url || "",
        plugin_id: item.plugin_id || "",
      }),
    });
    const detail = (data && data.detail) || {};
    if (detail && typeof detail === "object") {
      state.detail.detail = detail;
    }
    const plugin = (data && data.plugin) || {};
    if (plugin && plugin.plugin_id) {
      state.detail.pluginId = String(plugin.plugin_id || "").trim();
    }
    renderVbookDetail();
    state.shell.showStatus(state.shell.t("statusLoadingVbookToc"));
    await loadDetailToc(1);
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function importOnlineBook(item) {
  const sourceUrl = String((item.detail_url || (state.detail.detail && state.detail.detail.url) || "")).trim();
  if (!sourceUrl) return;
  const pluginId = String((item.plugin_id || state.detail.pluginId || "")).trim();

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
    state.shell.showToast(state.shell.t("toastImportSuccess"));
    const bid = data && data.book && data.book.book_id;
    if (bid) {
      window.location.href = `/book?book_id=${encodeURIComponent(bid)}`;
    }
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function runSearch(queryText, { resetOnline = true, updateUrl = true } = {}) {
  state.query = String(queryText || "").trim();
  if (refs.searchInput) refs.searchInput.value = state.query;
  if (updateUrl) updateQueryUrl();

  state.shell.showStatus(state.shell.t("statusSearching"));
  try {
    await loadLocalResults(state.query);
    await loadOnlineResults({ page: 1, reset: resetOnline });
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  } finally {
    state.shell.hideStatus();
  }
}

async function init() {
  state.shell = await initShell({
    page: "search",
    onSearchSubmit: (q) => runSearch(q, { resetOnline: true, updateUrl: true }),
  });

  refs.searchBooksTitle.textContent = state.shell.t("searchBooksTitle");
  refs.chapterHitsTitle.textContent = state.shell.t("chapterHitsTitle");
  refs.vbookSearchTitle.textContent = state.shell.t("vbookSearchTitle");
  refs.vbookPluginLabel.textContent = state.shell.t("vbookSearchPluginLabel");
  refs.btnVbookSearchRun.textContent = state.shell.t("vbookSearchRun");
  refs.btnVbookSearchReset.textContent = state.shell.t("vbookSearchReset");
  refs.btnVbookSearchPrev.textContent = state.shell.t("tocPrev");
  refs.btnVbookSearchNext.textContent = state.shell.t("tocNext");

  refs.vbookDetailDialogTitle.textContent = state.shell.t("vbookDetailDialogTitle");
  refs.btnVbookDetailClose.textContent = state.shell.t("close");
  refs.btnVbookDetailImport.textContent = state.shell.t("vbookSearchImportBook");
  refs.vbookDetailTocTitle.textContent = state.shell.t("vbookDetailTocTitle");
  refs.btnVbookTocPrev.textContent = state.shell.t("tocPrev");
  refs.btnVbookTocNext.textContent = state.shell.t("tocNext");
  refs.vbookDetailSubtitle.textContent = state.shell.t("vbookDetailSubtitle");

  const queryParams = state.shell.parseQuery();
  state.query = String(queryParams.q || "").trim();
  state.online.pluginId = String(queryParams.vpid || "").trim();

  try {
    await loadVbookPlugins();
  } catch (error) {
    state.shell.showToast(error.message || state.shell.t("toastError"));
  }

  refs.vbookPluginSelect.addEventListener("change", async () => {
    state.online.pluginId = String(refs.vbookPluginSelect.value || "").trim();
    updateQueryUrl();
    if (!state.query) {
      renderOnlineSearch();
      return;
    }
    state.shell.showStatus(state.shell.t("statusLoadingVbookSearch"));
    try {
      await loadOnlineResults({ page: 1, reset: true });
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    } finally {
      state.shell.hideStatus();
    }
  });

  refs.btnVbookSearchRun.addEventListener("click", async () => {
    const q = getCurrentQuery();
    await runSearch(q, { resetOnline: true, updateUrl: true });
  });

  refs.btnVbookSearchReset.addEventListener("click", () => {
    state.online.pluginId = "";
    if (refs.vbookPluginSelect) refs.vbookPluginSelect.value = "";
    state.online.items = [];
    state.online.hasNext = false;
    state.online.page = 1;
    state.online.tokenByPage = { 1: null };
    updateQueryUrl();
    renderOnlineSearch();
  });

  refs.btnVbookSearchPrev.addEventListener("click", async () => {
    const nextPage = Math.max(1, state.online.page - 1);
    if (nextPage === state.online.page) return;
    state.shell.showStatus(state.shell.t("statusLoadingVbookSearch"));
    try {
      await loadOnlineResults({ page: nextPage, reset: false });
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    } finally {
      state.shell.hideStatus();
    }
  });

  refs.btnVbookSearchNext.addEventListener("click", async () => {
    if (!state.online.hasNext) return;
    state.shell.showStatus(state.shell.t("statusLoadingVbookSearch"));
    try {
      await loadOnlineResults({ page: state.online.page + 1, reset: false });
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    } finally {
      state.shell.hideStatus();
    }
  });

  refs.btnVbookDetailClose.addEventListener("click", () => {
    if (refs.vbookDetailDialog.open) refs.vbookDetailDialog.close();
  });

  refs.btnVbookDetailImport.addEventListener("click", async () => {
    if (!state.detail.item) return;
    await importOnlineBook(state.detail.item);
  });

  refs.btnVbookTocPrev.addEventListener("click", async () => {
    const page = Math.max(1, Number(state.detail.pagination.page || 1) - 1);
    if (page === Number(state.detail.pagination.page || 1)) return;
    state.shell.showStatus(state.shell.t("statusLoadingVbookToc"));
    try {
      await loadDetailToc(page);
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    } finally {
      state.shell.hideStatus();
    }
  });

  refs.btnVbookTocNext.addEventListener("click", async () => {
    const current = Math.max(1, Number(state.detail.pagination.page || 1));
    const total = Math.max(1, Number(state.detail.pagination.totalPages || 1));
    const page = Math.min(total, current + 1);
    if (page === current) return;
    state.shell.showStatus(state.shell.t("statusLoadingVbookToc"));
    try {
      await loadDetailToc(page);
    } catch (error) {
      state.shell.showToast(error.message || state.shell.t("toastError"));
    } finally {
      state.shell.hideStatus();
    }
  });

  await runSearch(state.query, { resetOnline: true, updateUrl: false });
}

init();
