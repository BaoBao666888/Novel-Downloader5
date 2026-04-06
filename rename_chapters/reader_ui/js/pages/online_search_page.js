import { initShell } from "../site_common.js?v=20260406-vbookonline2";
import { normalizeDisplayTitle, normalizeParagraphDisplayText } from "../reader_text.js?v=20260307-br2";

const refs = {
  searchInput: document.getElementById("search-input"),
  onlineSearchTitle: document.getElementById("online-search-title"),
  onlineSearchMeta: document.getElementById("online-search-meta"),
  onlineSearchHint: document.getElementById("online-search-hint"),
  vbookPluginLabel: document.getElementById("vbook-plugin-label"),
  btnVbookPluginPickerToggle: document.getElementById("btn-vbook-plugin-picker-toggle"),
  vbookPluginPickerBody: document.getElementById("vbook-plugin-picker-body"),
  vbookPluginSelect: document.getElementById("vbook-plugin-select"),
  vbookPluginVisualList: document.getElementById("vbook-plugin-visual-list"),
  btnOnlineSearchRun: document.getElementById("btn-online-search-run"),
  btnOnlineSearchRunBottom: document.getElementById("btn-online-search-run-bottom"),
  btnOnlineSearchReset: document.getElementById("btn-online-search-reset"),
  btnOnlineSearchToggleFilter: document.getElementById("btn-online-search-toggle-filter"),
  onlineSearchFilterPanel: document.getElementById("online-search-filter-panel"),
  onlineSearchFilterTitle: document.getElementById("online-search-filter-title"),
  onlineSearchFilterMeta: document.getElementById("online-search-filter-meta"),
  onlineSearchFilterChips: document.getElementById("online-search-filter-chips"),
  onlineSearchFilterGroups: document.getElementById("online-search-filter-groups"),
  onlineSearchFilterEmpty: document.getElementById("online-search-filter-empty"),
  onlineSearchResultsTitle: document.getElementById("online-search-results-title"),
  onlineSearchResultsCount: document.getElementById("online-search-results-count"),
  onlineSearchResultsGrid: document.getElementById("online-search-results-grid"),
  onlineSearchResultsEmpty: document.getElementById("online-search-results-empty"),
  btnOnlineSearchPrev: document.getElementById("btn-online-search-prev"),
  onlineSearchPage: document.getElementById("online-search-page"),
  btnOnlineSearchNext: document.getElementById("btn-online-search-next"),

  vbookDetailDialog: document.getElementById("vbook-detail-dialog"),
  vbookDetailDialogTitle: document.getElementById("vbook-detail-dialog-title"),
  btnVbookDetailClose: document.getElementById("btn-vbook-detail-close"),
  vbookDetailSubtitle: document.getElementById("vbook-detail-subtitle"),
  vbookDetailCover: document.getElementById("vbook-detail-cover"),
  vbookDetailTitle: document.getElementById("vbook-detail-title"),
  vbookDetailAuthor: document.getElementById("vbook-detail-author"),
  vbookDetailStatus: document.getElementById("vbook-detail-status"),
  vbookDetailDesc: document.getElementById("vbook-detail-desc"),
  vbookDetailGenresTitle: document.getElementById("vbook-detail-genres-title"),
  vbookDetailGenresList: document.getElementById("vbook-detail-genres-list"),
  vbookDetailGenresEmpty: document.getElementById("vbook-detail-genres-empty"),
  vbookDetailExtraTitle: document.getElementById("vbook-detail-extra-title"),
  vbookDetailExtraList: document.getElementById("vbook-detail-extra-list"),
  vbookDetailExtraEmpty: document.getElementById("vbook-detail-extra-empty"),
  vbookDetailSuggestTitle: document.getElementById("vbook-detail-suggest-title"),
  vbookDetailSuggestCount: document.getElementById("vbook-detail-suggest-count"),
  vbookDetailSuggestList: document.getElementById("vbook-detail-suggest-list"),
  vbookDetailSuggestEmpty: document.getElementById("vbook-detail-suggest-empty"),
  vbookDetailCommentTitle: document.getElementById("vbook-detail-comment-title"),
  vbookDetailCommentCount: document.getElementById("vbook-detail-comment-count"),
  vbookDetailCommentList: document.getElementById("vbook-detail-comment-list"),
  vbookDetailCommentEmpty: document.getElementById("vbook-detail-comment-empty"),
  btnVbookDetailLoadToc: document.getElementById("btn-vbook-detail-load-toc"),
  btnVbookDetailImport: document.getElementById("btn-vbook-detail-import"),
  btnVbookDetailDownload: document.getElementById("btn-vbook-detail-download"),
  btnVbookDetailReadNow: document.getElementById("btn-vbook-detail-read-now"),
  vbookDetailTocTitle: document.getElementById("vbook-detail-toc-title"),
  vbookDetailTocList: document.getElementById("vbook-detail-toc-list"),
  vbookDetailTocEmpty: document.getElementById("vbook-detail-toc-empty"),
  btnVbookTocReverse: document.getElementById("btn-vbook-toc-reverse"),

  vbookGenreDialog: document.getElementById("vbook-genre-dialog"),
  vbookGenreDialogTitle: document.getElementById("vbook-genre-dialog-title"),
  btnVbookGenreClose: document.getElementById("btn-vbook-genre-close"),
  vbookGenreDialogSubtitle: document.getElementById("vbook-genre-dialog-subtitle"),
  vbookGenreGrid: document.getElementById("vbook-genre-grid"),
  vbookGenreEmpty: document.getElementById("vbook-genre-empty"),
};

function createSearchBucket() {
  return {
    page: 1,
    hasNext: false,
    tokenByPage: { 1: null },
    items: [],
    loading: false,
    errorMessage: "",
    loadingTextKey: "statusLoadingVbookSearch",
  };
}

const state = {
  shell: null,
  query: "",
  online: {
    plugins: [],
    pluginId: "",
    search: createSearchBucket(),
  },
  filter: {
    loading: false,
    supported: false,
    panelVisible: false,
    mode: "search",
    defaultMode: "search",
    queryPlaceholder: "",
    selected: {},
    defaults: {},
    chips: [],
    visibleGroups: [],
    message: "",
  },
  pluginPickerOpen: false,
  detail: {
    item: null,
    detail: null,
    requestId: "",
    loading: false,
    errorMessage: "",
    pluginId: "",
    lastReadChapterUrl: "",
    lastReadChapterTitle: "",
    lastReadRatio: null,
    toc: [],
    tocVisible: false,
    tocLoaded: false,
    tocLoading: false,
    tocError: "",
    tocReversed: false,
    selectedChapterUrl: "",
    selectedChapterTitle: "",
    actionBusy: "",
  },
  genreModal: {
    open: false,
    title: "",
    pluginId: "",
    tabScript: "genre",
    tabInput: null,
    items: [],
    loading: false,
    errorMessage: "",
  },
  requestControllers: new Map(),
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

function getCurrentQuery() {
  return String((refs.searchInput && refs.searchInput.value) || state.query || "").trim();
}

function getErrorMessage(error) {
  if (!error) return state.shell ? state.shell.t("toastError") : "Có lỗi xảy ra.";
  return String(error.displayMessage || error.message || (state.shell ? state.shell.t("toastError") : "Có lỗi xảy ra."));
}

function isAbortError(error) {
  if (!error) return false;
  const name = String(error.name || "").toLowerCase();
  if (name === "aborterror") return true;
  const message = String(error.message || "").toLowerCase();
  return message.includes("aborted") || message.includes("abort");
}

function showToastError(error) {
  if (isAbortError(error)) return;
  state.shell.showToast(getErrorMessage(error));
}

function parseRatio(value) {
  if (value == null || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (num <= 0) return 0;
  if (num >= 1) return 1;
  return num;
}

function beginRequest(key) {
  if (!key) return null;
  const prev = state.requestControllers.get(key);
  if (prev) {
    try {
      prev.abort();
    } catch {
      // ignore
    }
  }
  const controller = new AbortController();
  state.requestControllers.set(key, controller);
  return controller;
}

function finishRequest(key, controller) {
  if (!key || !controller) return;
  if (state.requestControllers.get(key) === controller) {
    state.requestControllers.delete(key);
  }
}

function abortPageRequests() {
  for (const controller of state.requestControllers.values()) {
    try {
      controller.abort();
    } catch {
      // ignore
    }
  }
  state.requestControllers.clear();
}

async function apiWithRequest(key, path, options = {}) {
  const controller = beginRequest(key);
  try {
    return await state.shell.api(path, {
      ...options,
      signal: controller ? controller.signal : undefined,
    });
  } finally {
    finishRequest(key, controller);
  }
}

function formatPluginLabel(plugin) {
  const base = String((plugin && (plugin.name || plugin.plugin_id)) || "").trim() || state.shell.t("vbookUnknownPlugin");
  const locale = String((plugin && plugin.locale) || "").trim();
  const type = String((plugin && plugin.type) || "").trim();
  const meta = [locale, type].filter(Boolean).join(" • ");
  return meta ? `${base} • ${meta}` : base;
}

function pluginDisplayName(plugin) {
  return String((plugin && (plugin.name || plugin.plugin_id)) || "").trim() || state.shell.t("vbookUnknownPlugin");
}

function getSelectedPlugin() {
  const pid = String(state.online.pluginId || "").trim();
  if (!pid) return null;
  return state.online.plugins.find((x) => String((x && x.plugin_id) || "").trim() === pid) || null;
}

function renderPluginPicker() {
  const hasPlugins = Array.isArray(state.online.plugins) && state.online.plugins.length > 0;
  const selectedPlugin = getSelectedPlugin();
  if (refs.btnVbookPluginPickerToggle) {
    let text = state.shell.t("explorePluginPickerShow");
    if (!hasPlugins) {
      text = state.shell.t("explorePluginPickerNoSource");
    } else if (!state.pluginPickerOpen && selectedPlugin) {
      text = state.shell.t("explorePluginPickerCurrent", { name: pluginDisplayName(selectedPlugin) });
    } else if (state.pluginPickerOpen) {
      text = state.shell.t("explorePluginPickerHide");
    }
    refs.btnVbookPluginPickerToggle.textContent = text;
    refs.btnVbookPluginPickerToggle.disabled = !hasPlugins;
    refs.btnVbookPluginPickerToggle.setAttribute("aria-expanded", state.pluginPickerOpen ? "true" : "false");
  }
  if (refs.vbookPluginPickerBody) {
    refs.vbookPluginPickerBody.classList.toggle("hidden", !state.pluginPickerOpen || !hasPlugins);
  }
}

function renderOnlinePluginOptions() {
  refs.vbookPluginSelect.innerHTML = "";
  const auto = document.createElement("option");
  auto.value = "";
  auto.textContent = state.shell.t("vbookSearchSelectPlugin");
  refs.vbookPluginSelect.appendChild(auto);

  refs.vbookPluginVisualList.innerHTML = "";
  for (const plugin of state.online.plugins) {
    const pid = String(plugin.plugin_id || "").trim();
    if (!pid) continue;
    const opt = document.createElement("option");
    opt.value = pid;
    opt.textContent = formatPluginLabel(plugin);
    refs.vbookPluginSelect.appendChild(opt);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vbook-plugin-visual-item";
    btn.dataset.pluginId = pid;
    if (pid === String(state.online.pluginId || "").trim()) btn.classList.add("active");

    const iconWrap = document.createElement("span");
    iconWrap.className = "vbook-plugin-visual-icon";
    const iconUrl = String(plugin.icon_url || "").trim();
    if (iconUrl) {
      const img = document.createElement("img");
      img.src = iconUrl;
      img.alt = String(plugin.name || plugin.plugin_id || "plugin");
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", () => {
        img.remove();
        iconWrap.textContent = "EXT";
      }, { once: true });
      iconWrap.appendChild(img);
    } else {
      iconWrap.textContent = "EXT";
    }

    const textWrap = document.createElement("span");
    textWrap.className = "vbook-plugin-visual-text";
    const nameNode = document.createElement("span");
    nameNode.className = "vbook-plugin-visual-name";
    nameNode.textContent = pluginDisplayName(plugin);
    const metaNode = document.createElement("span");
    metaNode.className = "vbook-plugin-visual-meta";
    metaNode.textContent = [String(plugin.locale || "").trim(), String(plugin.type || "").trim()].filter(Boolean).join(" • ");
    textWrap.append(nameNode, metaNode);

    btn.append(iconWrap, textWrap);
    btn.addEventListener("click", async () => {
      const target = String(btn.dataset.pluginId || "").trim();
      if (!target) return;
      refs.vbookPluginSelect.value = target;
      await handlePluginSelectionChange(target, { autoSearch: true });
    });
    refs.vbookPluginVisualList.appendChild(btn);
  }
  refs.vbookPluginSelect.value = state.online.pluginId || "";
  renderPluginPicker();
}

function serializeFiltersForUrl(filters) {
  const source = (filters && typeof filters === "object") ? filters : {};
  const clean = {};
  for (const [key, value] of Object.entries(source)) {
    const k = String(key || "").trim();
    const v = String(value || "").trim();
    if (!k || !v) continue;
    clean[k] = v;
  }
  if (!Object.keys(clean).length) return "";
  try {
    return JSON.stringify(clean);
  } catch {
    return "";
  }
}

function parseFiltersFromQuery(raw) {
  const text = String(raw || "").trim();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out = {};
    for (const [key, value] of Object.entries(parsed)) {
      const k = String(key || "").trim();
      const v = String(value || "").trim();
      if (!k || !v) continue;
      out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function updateQueryUrl() {
  const params = new URLSearchParams();
  const query = String(state.query || "").trim();
  if (query && state.filter.mode !== "filter") params.set("q", query);
  if (state.online.pluginId) params.set("vpid", state.online.pluginId);
  if (state.filter.mode === "filter") params.set("mode", "filter");
  const filters = serializeFiltersForUrl(state.filter.selected);
  if (filters) params.set("filters", filters);
  const next = params.toString() ? `/online-search?${params.toString()}` : "/online-search";
  if (`${window.location.pathname}${window.location.search}` !== next) {
    window.history.replaceState({}, "", next);
  }
}

function applySearchInputUi() {
  const placeholder = String(state.filter.queryPlaceholder || "").trim();
  if (refs.searchInput) {
    refs.searchInput.disabled = state.filter.mode === "filter";
    refs.searchInput.placeholder = state.filter.mode === "filter"
      ? state.shell.t("onlineSearchQueryDisabled")
      : (placeholder || state.shell.t("searchPlaceholder"));
  }
}

function canRunSearchAction() {
  if (!state.online.pluginId) return false;
  if (state.filter.loading || state.online.search.loading) return false;
  if (state.filter.mode === "filter") return state.filter.supported;
  return Boolean(String(state.query || "").trim());
}

function renderSearchControls() {
  const runLabelKey = state.filter.mode === "filter" ? "onlineSearchApplyFilter" : "vbookSearchRun";
  const canRun = canRunSearchAction();
  const plugin = getSelectedPlugin();
  refs.onlineSearchMeta.textContent = plugin
    ? `${formatPluginLabel(plugin)} • ${state.shell.t(state.filter.mode === "filter" ? "onlineSearchModeTagFilter" : "onlineSearchModeTagSearch")}`
    : state.shell.t("onlineSearchMetaIdle");
  refs.onlineSearchHint.textContent = state.filter.mode === "filter"
    ? (state.filter.supported ? state.shell.t("onlineSearchFilterHint") : state.shell.t("onlineSearchFilterUnsupported"))
    : state.shell.t("onlineSearchSearchHint");
  refs.btnOnlineSearchRun.textContent = state.shell.t(runLabelKey);
  refs.btnOnlineSearchRun.disabled = !canRun;
  if (refs.btnOnlineSearchRunBottom) {
    refs.btnOnlineSearchRunBottom.textContent = state.shell.t(runLabelKey);
    refs.btnOnlineSearchRunBottom.disabled = !canRun;
  }
  refs.btnOnlineSearchToggleFilter.textContent = state.shell.t(state.filter.mode === "filter" ? "onlineSearchBackToSearch" : "onlineSearchFilterToggle");
  refs.btnOnlineSearchToggleFilter.disabled = !state.online.pluginId || state.filter.loading;
  refs.btnOnlineSearchReset.textContent = state.shell.t("onlineSearchReset");
  applySearchInputUi();
}

function renderFilterPanel() {
  refs.onlineSearchFilterPanel.classList.toggle("hidden", !state.filter.panelVisible);
  refs.onlineSearchFilterMeta.textContent = state.filter.loading
    ? state.shell.t("onlineSearchFilterLoading")
    : state.shell.t("onlineSearchFilterMeta", { count: state.filter.visibleGroups.length });

  refs.onlineSearchFilterChips.innerHTML = "";
  for (const chip of state.filter.chips) {
    const item = document.createElement("span");
    item.className = "online-search-filter-chip";
    item.textContent = String(chip.text || "").trim();
    refs.onlineSearchFilterChips.appendChild(item);
  }

  refs.onlineSearchFilterGroups.innerHTML = "";
  for (const group of state.filter.visibleGroups) {
    const wrap = document.createElement("section");
    wrap.className = "online-search-filter-group";

    const head = document.createElement("div");
    head.className = "online-search-filter-group-head";
    const label = document.createElement("h4");
    label.className = "online-search-filter-label";
    label.textContent = String(group.label || group.key || "").trim() || group.key || "";
    const depth = document.createElement("span");
    depth.className = "online-search-filter-depth";
    if (Number(group.depth || 0) > 0) {
      depth.textContent = state.shell.t("onlineSearchFilterDepth", { depth: Number(group.depth || 0) });
    } else {
      depth.textContent = "";
    }
    head.append(label, depth);

    if (group.hint) {
      const hint = document.createElement("p");
      hint.className = "book-card-meta";
      hint.textContent = String(group.hint || "").trim();
      wrap.append(head, hint);
    } else {
      wrap.append(head);
    }

    const options = document.createElement("div");
    options.className = "online-search-filter-options";
    for (const option of Array.isArray(group.options) ? group.options : []) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-small online-search-filter-option";
      if (option.selected) btn.classList.add("active");
      btn.textContent = String(option.label || option.value || "").trim() || option.value || "";
      btn.disabled = state.filter.loading;
      btn.addEventListener("click", async () => {
        if (state.filter.loading) return;
        state.filter.selected[String(group.key || "").trim()] = String(option.value || "").trim();
        await loadFilterConfig({ preserveMode: true });
        updateQueryUrl();
        renderAll();
      });
      options.appendChild(btn);
    }
    wrap.appendChild(options);
    refs.onlineSearchFilterGroups.appendChild(wrap);
  }

  if (state.filter.loading) {
    refs.onlineSearchFilterEmpty.textContent = state.shell.t("onlineSearchFilterLoading");
  } else if (!state.online.pluginId) {
    refs.onlineSearchFilterEmpty.textContent = state.shell.t("onlineSearchFilterNoPlugin");
  } else if (!state.filter.supported) {
    refs.onlineSearchFilterEmpty.textContent = state.shell.t("onlineSearchFilterUnsupported");
  } else if (!state.filter.visibleGroups.length) {
    refs.onlineSearchFilterEmpty.textContent = state.shell.t("onlineSearchFilterEmpty");
  } else {
    refs.onlineSearchFilterEmpty.textContent = "";
  }
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
  const authorText = normalizeParagraphDisplayText(item.author || "", { singleLine: true });
  const descText = normalizeParagraphDisplayText(item.description || "", { singleLine: true });
  if (authorText && descText) author.textContent = `${authorText} • ${descText}`;
  else if (authorText) author.textContent = authorText;
  else if (descText) author.textContent = descText;
  else author.textContent = "Khuyết danh";

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

function renderSearchResults() {
  const bucket = state.online.search;
  refs.onlineSearchResultsGrid.innerHTML = "";
  const count = Array.isArray(bucket.items) ? bucket.items.length : 0;
  refs.onlineSearchResultsCount.textContent = state.shell.t("vbookSearchResultCount", { count });

  let emptyKey = "";
  if (!state.online.plugins.length) emptyKey = state.shell.t("vbookSearchNoPlugins");
  else if (!state.online.pluginId) emptyKey = state.shell.t("vbookSearchNeedPlugin");
  else if (state.filter.mode === "filter" && !state.filter.supported) emptyKey = state.shell.t("onlineSearchFilterUnsupported");
  else if (state.filter.mode !== "filter" && !state.query) emptyKey = state.shell.t("onlineSearchNoQuery");
  else if (!count) emptyKey = state.shell.t("exploreSearchEmpty");

  if (bucket.loading) {
    refs.onlineSearchResultsEmpty.textContent = state.shell.t(bucket.loadingTextKey || "statusLoadingVbookSearch");
  } else if (bucket.errorMessage) {
    refs.onlineSearchResultsEmpty.textContent = bucket.errorMessage;
  } else if (emptyKey) {
    refs.onlineSearchResultsEmpty.textContent = emptyKey;
  } else {
    refs.onlineSearchResultsEmpty.textContent = "";
    for (const item of bucket.items) {
      refs.onlineSearchResultsGrid.appendChild(buildOnlineBookCard(item));
    }
  }

  const page = Math.max(1, Number(bucket.page || 1));
  refs.onlineSearchPage.textContent = state.shell.t("vbookSearchPage", { page });
  refs.btnOnlineSearchPrev.disabled = page <= 1 || bucket.loading;
  refs.btnOnlineSearchNext.disabled = !bucket.hasNext || bucket.loading;
}

function renderAll() {
  renderSearchControls();
  renderPluginPicker();
  renderFilterPanel();
  renderSearchResults();
}

async function loadVbookPlugins() {
  const payload = await apiWithRequest("plugins", "/api/vbook/plugins");
  const list = Array.isArray(payload && payload.items) ? payload.items : [];
  state.online.plugins = list;
  if (state.online.pluginId && !list.some((x) => String(x.plugin_id || "").trim() === state.online.pluginId)) {
    state.online.pluginId = "";
  }
  renderOnlinePluginOptions();
}

async function loadFilterConfig({ preserveMode = true } = {}) {
  if (!state.online.pluginId) {
    state.filter.loading = false;
    state.filter.supported = false;
    state.filter.defaultMode = "search";
    state.filter.queryPlaceholder = "";
    state.filter.selected = {};
    state.filter.defaults = {};
    state.filter.chips = [];
    state.filter.visibleGroups = [];
    state.filter.message = "";
    state.filter.panelVisible = false;
    if (!preserveMode || state.filter.mode === "filter") state.filter.mode = "search";
    renderAll();
    return;
  }
  state.filter.loading = true;
  renderAll();
  try {
    const data = await apiWithRequest("search-filters", "/api/vbook/search/filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plugin_id: state.online.pluginId,
        filters: state.filter.selected,
      }),
    });
    state.filter.supported = Boolean(data && data.supported);
    state.filter.defaultMode = String((data && data.default_mode) || "search").trim().toLowerCase() === "filter" ? "filter" : "search";
    state.filter.queryPlaceholder = String((data && data.query_placeholder) || "").trim();
    state.filter.selected = (data && data.selected && typeof data.selected === "object") ? data.selected : {};
    state.filter.defaults = (data && data.defaults && typeof data.defaults === "object") ? data.defaults : {};
    state.filter.chips = Array.isArray(data && data.chips) ? data.chips : [];
    state.filter.visibleGroups = Array.isArray(data && data.visible_groups) ? data.visible_groups : [];
    state.filter.message = "";
    if (!preserveMode) {
      state.filter.mode = state.filter.supported ? state.filter.defaultMode : "search";
      state.filter.panelVisible = state.filter.mode === "filter";
    } else if (!state.filter.supported && state.filter.mode === "filter") {
      state.filter.mode = "search";
      state.filter.panelVisible = false;
    }
  } catch (error) {
    if (!isAbortError(error)) {
      state.filter.supported = false;
      state.filter.selected = {};
      state.filter.defaults = {};
      state.filter.visibleGroups = [];
      state.filter.chips = [];
      state.filter.message = getErrorMessage(error);
      if (state.filter.mode === "filter") {
        state.filter.mode = "search";
        state.filter.panelVisible = false;
      }
    }
  } finally {
    state.filter.loading = false;
    renderAll();
  }
}

function bucketPayloadToken(bucket, page) {
  if (!bucket || typeof bucket !== "object") return undefined;
  if (!Object.prototype.hasOwnProperty.call(bucket.tokenByPage || {}, page)) return undefined;
  return bucket.tokenByPage[page];
}

function updateBucketByApi(bucket, data, page) {
  const items = Array.isArray(data && data.items) ? data.items : [];
  const pageNum = Math.max(1, Number((data && data.page) || page || 1));
  const nextToken = (data && Object.prototype.hasOwnProperty.call(data, "next")) ? data.next : null;
  const hasNext = Boolean(data && data.has_next);

  bucket.page = pageNum;
  bucket.items = items;
  bucket.hasNext = hasNext;
  if (!Object.prototype.hasOwnProperty.call(bucket.tokenByPage, pageNum)) {
    bucket.tokenByPage[pageNum] = null;
  }
  if (hasNext && nextToken != null && String(nextToken).trim() !== "") {
    bucket.tokenByPage[pageNum + 1] = nextToken;
  } else {
    delete bucket.tokenByPage[pageNum + 1];
  }
}

async function loadSearchItems({ page = 1, reset = false } = {}) {
  const bucket = state.online.search;
  if (reset) bucket.tokenByPage = { 1: null };
  bucket.loading = true;
  bucket.errorMessage = "";
  if (reset) bucket.items = [];
  renderAll();

  const runInFilterMode = state.filter.mode === "filter";
  if (!state.online.pluginId || (!runInFilterMode && !state.query) || (runInFilterMode && !state.filter.supported)) {
    bucket.items = [];
    bucket.page = 1;
    bucket.hasNext = false;
    bucket.loading = false;
    renderAll();
    return;
  }

  const payload = {
    plugin_id: state.online.pluginId,
    query: runInFilterMode ? "" : state.query,
    page: Math.max(1, Number(page || 1)),
    filters: state.filter.selected,
    search_mode: runInFilterMode ? "filter" : "search",
  };
  const token = bucketPayloadToken(bucket, payload.page);
  if (token != null && String(token).trim() !== "") payload.next = token;

  try {
    const data = await apiWithRequest("search-items", "/api/vbook/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    updateBucketByApi(bucket, data, payload.page);
  } catch (error) {
    if (!isAbortError(error)) {
      bucket.errorMessage = getErrorMessage(error);
    }
  } finally {
    bucket.loading = false;
    renderAll();
  }
}

async function runSearch(queryText, { updateUrl = true } = {}) {
  state.query = String(queryText || "").trim();
  if (refs.searchInput) refs.searchInput.value = state.query;
  if (updateUrl) updateQueryUrl();

  state.shell.showStatus(state.shell.t("statusLoadingVbookSearch"));
  try {
    await loadSearchItems({ page: 1, reset: true });
  } catch (error) {
    showToastError(error);
  } finally {
    state.shell.hideStatus();
  }
}

async function runCurrentSearchAction() {
  if (!canRunSearchAction()) return;
  await runSearch(getCurrentQuery(), { updateUrl: true });
}

async function handlePluginSelectionChange(pluginId, { autoSearch = false } = {}) {
  abortPageRequests();
  state.online.pluginId = String(pluginId || "").trim();
  state.pluginPickerOpen = false;
  state.online.search = createSearchBucket();
  state.filter.selected = {};
  state.filter.defaults = {};
  state.filter.chips = [];
  state.filter.visibleGroups = [];
  resetDetailState();
  renderOnlinePluginOptions();
  await loadFilterConfig({ preserveMode: false });
  updateQueryUrl();
  renderAll();
  if (autoSearch && (state.query || state.filter.mode === "filter")) {
    await runSearch(state.query, { updateUrl: false });
  }
}

function resetDetailState() {
  state.detail.item = null;
  state.detail.detail = null;
  state.detail.requestId = "";
  state.detail.loading = false;
  state.detail.errorMessage = "";
  state.detail.pluginId = "";
  state.detail.lastReadChapterUrl = "";
  state.detail.lastReadChapterTitle = "";
  state.detail.lastReadRatio = null;
  state.detail.toc = [];
  state.detail.tocVisible = false;
  state.detail.tocLoaded = false;
  state.detail.tocLoading = false;
  state.detail.tocError = "";
  state.detail.tocReversed = false;
  state.detail.selectedChapterUrl = "";
  state.detail.selectedChapterTitle = "";
  state.detail.actionBusy = "";
  if (refs.vbookDetailDialog && refs.vbookDetailDialog.open) refs.vbookDetailDialog.close();
  state.genreModal.open = false;
  state.genreModal.title = "";
  state.genreModal.pluginId = "";
  state.genreModal.items = [];
  state.genreModal.loading = false;
  state.genreModal.errorMessage = "";
  if (refs.vbookGenreDialog && refs.vbookGenreDialog.open) refs.vbookGenreDialog.close();
}

function getCurrentTranslationMode() {
  return (typeof state.shell.getTranslationMode === "function" ? state.shell.getTranslationMode() : state.translationMode) || "server";
}

function getCurrentReaderMode() {
  const enabled = typeof state.shell.getTranslationEnabled === "function"
    ? state.shell.getTranslationEnabled()
    : state.translationEnabled;
  return enabled ? "trans" : "raw";
}

function resolveReaderModeForBook(book) {
  const preferred = getCurrentReaderMode();
  if (preferred !== "trans") return "raw";
  if (book && typeof book.translation_supported === "boolean") return book.translation_supported ? "trans" : "raw";
  const sourceType = String((book && book.source_type) || "").trim().toLowerCase();
  return sourceType.includes("comic") ? "raw" : preferred;
}

function buildReaderUrl(bookId, chapterId = "", mode = getCurrentReaderMode()) {
  const params = new URLSearchParams();
  params.set("book_id", String(bookId || "").trim());
  const chapter = String(chapterId || "").trim();
  if (chapter) params.set("chapter_id", chapter);
  params.set("mode", mode);
  if (mode === "trans") params.set("translation_mode", getCurrentTranslationMode());
  return `/reader?${params.toString()}`;
}

function buildImportSeed(sourceUrl, pluginId, historyOnly = false) {
  const payload = {
    url: String(sourceUrl || "").trim(),
    plugin_id: String(pluginId || "").trim(),
    history_only: Boolean(historyOnly),
  };
  const activeDetailUrl = String((state.detail.detail && state.detail.detail.url) || "").trim();
  if (activeDetailUrl && activeDetailUrl === payload.url && state.detail.detail && typeof state.detail.detail === "object") {
    payload.detail = { ...state.detail.detail };
  }
  if (activeDetailUrl && activeDetailUrl === payload.url && state.detail.tocLoaded && Array.isArray(state.detail.toc) && state.detail.toc.length) {
    payload.toc = state.detail.toc.map((row) => ({ ...row }));
  }
  return payload;
}

async function upsertHistoryFromDetail({
  chapterUrl = "",
  chapterTitle = "",
  chapterRatio = null,
} = {}) {
  const detail = state.detail.detail || {};
  const item = state.detail.item || {};
  const sourceUrl = String(detail.url || item.detail_url || "").trim();
  if (!sourceUrl) return;

  const payload = {
    plugin_id: String(state.detail.pluginId || item.plugin_id || "").trim(),
    source_url: sourceUrl,
    title: String(detail.title || detail.name || item.title || sourceUrl).trim() || sourceUrl,
    title_raw: String(detail.title_raw || item.title_raw || "").trim(),
    author: String(detail.author || item.author || "").trim(),
    author_raw: String(detail.author_raw || item.author_raw || "").trim(),
    cover_url: String(detail.cover || item.cover || "").trim(),
  };
  const chapterUrlText = String(chapterUrl || state.detail.lastReadChapterUrl || "").trim();
  const chapterTitleText = String(chapterTitle || state.detail.lastReadChapterTitle || "").trim();
  const ratio = parseRatio(chapterRatio != null ? chapterRatio : state.detail.lastReadRatio);
  if (!chapterUrlText) return;
  payload.last_read_chapter_url = chapterUrlText;
  if (chapterTitleText) payload.last_read_chapter_title = chapterTitleText;
  if (chapterTitleText) payload.last_read_chapter_title_raw = chapterTitleText;
  if (ratio != null) payload.last_read_ratio = ratio;

  try {
    await apiWithRequest("history-upsert", "/api/library/history/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // ignore
  }
}

function detailSourceContext() {
  const detail = state.detail.detail || {};
  const item = state.detail.item || {};
  const sourceUrl = String(detail.url || item.detail_url || "").trim();
  const pluginId = String(state.detail.pluginId || item.plugin_id || "").trim();
  return { sourceUrl, pluginId, detail, item };
}

function setSelectedDetailChapter(chapterUrl, chapterTitle = "") {
  const url = String(chapterUrl || "").trim();
  if (!url) return;
  state.detail.selectedChapterUrl = url;
  state.detail.selectedChapterTitle = String(chapterTitle || "").trim();
  state.detail.lastReadChapterUrl = url;
  if (state.detail.selectedChapterTitle) state.detail.lastReadChapterTitle = state.detail.selectedChapterTitle;
}

function getPreferredDetailChapter() {
  const toc = Array.isArray(state.detail.toc) ? state.detail.toc : [];
  if (!toc.length) return null;
  const bySelected = toc.find((row) => String((row && row.url) || "").trim() === String(state.detail.selectedChapterUrl || "").trim());
  if (bySelected) return bySelected;
  const byLastRead = toc.find((row) => String((row && row.url) || "").trim() === String(state.detail.lastReadChapterUrl || "").trim());
  if (byLastRead) return byLastRead;
  return toc[0] || null;
}

function renderGenreDialog() {
  const count = Array.isArray(state.genreModal.items) ? state.genreModal.items.length : 0;
  refs.vbookGenreDialogTitle.textContent = state.genreModal.title || state.shell.t("vbookGenreDialogTitle");
  refs.vbookGenreDialogSubtitle.textContent = state.genreModal.loading
    ? state.shell.t("statusLoadingVbookGenre")
    : state.genreModal.errorMessage || state.shell.t("vbookGenreDialogSubtitle", { count });
  refs.vbookGenreGrid.innerHTML = "";
  if (count > 0) {
    refs.vbookGenreEmpty.textContent = "";
    for (const item of state.genreModal.items) {
      refs.vbookGenreGrid.appendChild(buildOnlineBookCard(item));
    }
    return;
  }
  if (state.genreModal.loading) refs.vbookGenreEmpty.textContent = state.shell.t("statusLoadingVbookGenre");
  else if (state.genreModal.errorMessage) refs.vbookGenreEmpty.textContent = state.genreModal.errorMessage;
  else refs.vbookGenreEmpty.textContent = state.shell.t("vbookGenreEmpty");
}

async function loadGenreDialogItems() {
  if (!state.genreModal.pluginId) return;
  state.genreModal.loading = true;
  state.genreModal.errorMessage = "";
  renderGenreDialog();
  try {
    const data = await apiWithRequest("genre-dialog", "/api/vbook/genre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plugin_id: state.genreModal.pluginId,
        tab_script: state.genreModal.tabScript || "genre",
        tab_input: state.genreModal.tabInput,
        page: 1,
      }),
    });
    state.genreModal.items = Array.isArray(data && data.items) ? data.items : [];
  } catch (error) {
    if (!isAbortError(error)) {
      state.genreModal.items = [];
      state.genreModal.errorMessage = getErrorMessage(error);
    }
  } finally {
    state.genreModal.loading = false;
    renderGenreDialog();
  }
}

async function openGenreDialog(tag) {
  const genre = (tag && typeof tag === "object") ? tag : {};
  state.genreModal.open = true;
  state.genreModal.title = String(genre.title || "").trim() || state.shell.t("vbookGenreDialogTitle");
  state.genreModal.pluginId = String(state.detail.pluginId || "").trim();
  state.genreModal.tabScript = String(genre.script || "genre").trim() || "genre";
  state.genreModal.tabInput = Object.prototype.hasOwnProperty.call(genre, "input") ? genre.input : null;
  state.genreModal.items = [];
  state.genreModal.loading = true;
  state.genreModal.errorMessage = "";
  renderGenreDialog();
  if (!refs.vbookGenreDialog.open) refs.vbookGenreDialog.showModal();
  await loadGenreDialogItems();
}

function renderVbookDetail() {
  const detail = state.detail.detail || {};
  const loading = Boolean(state.detail.loading);
  const detailError = String(state.detail.errorMessage || "").trim();
  const title = normalizeParagraphDisplayText(detail.title || detail.name || "", { singleLine: true }) || "Không tiêu đề";
  const authorText = normalizeParagraphDisplayText(detail.author || "", { singleLine: true });
  const author = authorText || (loading ? "" : "Khuyết danh");
  const desc = normalizeParagraphDisplayText(detail.description || "") || (loading ? "" : state.shell.t("vbookDetailNoDescription"));
  const cover = String(detail.cover || "").trim();
  const statusText = normalizeParagraphDisplayText(detail.status_text || "", { singleLine: true });
  const genres = Array.isArray(detail.genres) ? detail.genres : [];
  const extras = Array.isArray(detail.extra_fields) ? detail.extra_fields : [];
  const suggests = Array.isArray(detail.suggest_items) ? detail.suggest_items : [];
  const comments = Array.isArray(detail.comment_items) ? detail.comment_items : [];

  refs.vbookDetailTitle.textContent = normalizeDisplayTitle(title);
  refs.vbookDetailAuthor.textContent = author;
  refs.vbookDetailDesc.textContent = desc;
  refs.vbookDetailStatus.textContent = statusText;
  refs.vbookDetailStatus.classList.toggle("hidden", !statusText);

  if (loading) refs.vbookDetailSubtitle.textContent = state.shell.t("statusLoadingVbookDetail");
  else if (detailError) refs.vbookDetailSubtitle.textContent = detailError;
  else refs.vbookDetailSubtitle.textContent = state.shell.t("vbookDetailSubtitle");

  refs.btnVbookDetailLoadToc.textContent = state.detail.tocVisible
    ? state.shell.t("vbookDetailHideToc")
    : state.shell.t("vbookDetailShowToc");
  const actionBusy = String(state.detail.actionBusy || "").trim();
  const isBusy = actionBusy !== "";
  refs.btnVbookDetailLoadToc.disabled = loading || state.detail.tocLoading || isBusy;
  refs.btnVbookDetailReadNow.disabled = loading || isBusy;
  refs.btnVbookDetailImport.disabled = loading || isBusy;
  refs.btnVbookDetailDownload.disabled = loading || isBusy;
  refs.btnVbookDetailReadNow.textContent = actionBusy === "read"
    ? state.shell.t("vbookOpeningReaderAction")
    : state.shell.t("vbookDetailReadNow");
  refs.btnVbookDetailImport.textContent = actionBusy === "import"
    ? state.shell.t("vbookImportingAction")
    : state.shell.t("vbookSearchImportBook");
  refs.btnVbookDetailDownload.textContent = actionBusy === "download"
    ? state.shell.t("downloadQueueing")
    : state.shell.t("downloadBook");

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

  refs.vbookDetailGenresList.innerHTML = "";
  if (loading) refs.vbookDetailGenresEmpty.textContent = state.shell.t("statusLoadingVbookDetail");
  else if (detailError) refs.vbookDetailGenresEmpty.textContent = detailError;
  else if (!genres.length) refs.vbookDetailGenresEmpty.textContent = state.shell.t("vbookDetailGenresEmpty");
  else {
    refs.vbookDetailGenresEmpty.textContent = "";
    for (const tag of genres) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-small vbook-genre-chip";
      btn.textContent = String((tag && tag.title) || "").trim();
      btn.addEventListener("click", async () => {
        await openGenreDialog(tag);
      });
      refs.vbookDetailGenresList.appendChild(btn);
    }
  }

  refs.vbookDetailExtraList.innerHTML = "";
  if (loading) refs.vbookDetailExtraEmpty.textContent = state.shell.t("statusLoadingVbookDetail");
  else if (detailError) refs.vbookDetailExtraEmpty.textContent = detailError;
  else if (!extras.length) refs.vbookDetailExtraEmpty.textContent = state.shell.t("vbookDetailExtraEmpty");
  else {
    refs.vbookDetailExtraEmpty.textContent = "";
    for (const row of extras) {
      const item = document.createElement("article");
      item.className = "vbook-detail-extra-item";
      const key = document.createElement("h5");
      key.className = "vbook-detail-extra-key";
      key.textContent = normalizeParagraphDisplayText((row && row.key) || "", { singleLine: true });
      const value = document.createElement("pre");
      value.className = "vbook-detail-extra-value";
      value.textContent = normalizeParagraphDisplayText((row && row.value) || "");
      item.append(key, value);
      refs.vbookDetailExtraList.appendChild(item);
    }
  }

  refs.vbookDetailSuggestCount.textContent = state.shell.t("vbookDetailCount", { count: loading ? 0 : suggests.length });
  refs.vbookDetailSuggestList.innerHTML = "";
  if (loading) refs.vbookDetailSuggestEmpty.textContent = state.shell.t("statusLoadingVbookDetail");
  else if (detailError) refs.vbookDetailSuggestEmpty.textContent = detailError;
  else if (!suggests.length) refs.vbookDetailSuggestEmpty.textContent = state.shell.t("vbookDetailSuggestEmpty");
  else {
    refs.vbookDetailSuggestEmpty.textContent = "";
    for (const row of suggests) {
      const li = document.createElement("li");
      const wrap = document.createElement("div");
      wrap.className = "vbook-detail-suggest-item";

      const info = document.createElement("div");
      info.className = "vbook-detail-suggest-info";
      const t = document.createElement("div");
      t.className = "chapter-hit-title";
      t.textContent = normalizeDisplayTitle(String((row && row.title) || "").trim() || "Không tiêu đề");
      const sub = document.createElement("div");
      sub.className = "chapter-hit-sub";
      const subParts = [];
      const subAuthor = normalizeParagraphDisplayText((row && row.author) || "", { singleLine: true });
      if (subAuthor) subParts.push(subAuthor);
      const subHost = normalizeParagraphDisplayText((row && row.host) || "", { singleLine: true });
      if (subHost) subParts.push(subHost);
      sub.textContent = subParts.join(" • ");
      info.append(t, sub);

      const actions = document.createElement("div");
      actions.className = "vbook-detail-suggest-actions";
      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.className = "btn btn-small";
      const detailUrl = String((row && row.detail_url) || "").trim();
      openBtn.textContent = detailUrl ? state.shell.t("vbookDetailOpenSuggest") : state.shell.t("vbookDetailSuggestNoLink");
      openBtn.disabled = !detailUrl;
      openBtn.addEventListener("click", async () => {
        const item = {
          title: normalizeParagraphDisplayText((row && row.title) || "", { singleLine: true }),
          author: normalizeParagraphDisplayText((row && row.author) || "", { singleLine: true }),
          description: normalizeParagraphDisplayText((row && row.description) || ""),
          cover: String((row && row.cover) || "").trim(),
          detail_url: detailUrl,
          plugin_id: String((row && row.plugin_id) || state.detail.pluginId || "").trim(),
        };
        if (!item.detail_url) return;
        await openDetailDialog(item);
      });
      actions.append(openBtn);

      wrap.append(info, actions);
      li.appendChild(wrap);
      refs.vbookDetailSuggestList.appendChild(li);
    }
  }

  refs.vbookDetailCommentCount.textContent = state.shell.t("vbookDetailCount", { count: loading ? 0 : comments.length });
  refs.vbookDetailCommentList.innerHTML = "";
  if (loading) refs.vbookDetailCommentEmpty.textContent = state.shell.t("statusLoadingVbookDetail");
  else if (detailError) refs.vbookDetailCommentEmpty.textContent = detailError;
  else if (!comments.length) refs.vbookDetailCommentEmpty.textContent = state.shell.t("vbookDetailCommentEmpty");
  else {
    refs.vbookDetailCommentEmpty.textContent = "";
    for (const row of comments) {
      const li = document.createElement("li");
      const box = document.createElement("article");
      box.className = "vbook-detail-comment-item";
      const head = document.createElement("div");
      head.className = "vbook-detail-comment-head";
      const user = document.createElement("span");
      user.className = "vbook-detail-comment-author";
      user.textContent = normalizeParagraphDisplayText((row && row.author) || "", { singleLine: true }) || state.shell.t("vbookDetailCommentGuest");
      const when = document.createElement("span");
      when.className = "vbook-detail-comment-time";
      when.textContent = normalizeParagraphDisplayText((row && row.time) || "", { singleLine: true });
      head.append(user, when);
      const content = document.createElement("p");
      content.className = "vbook-detail-comment-content";
      content.textContent = normalizeParagraphDisplayText((row && row.content) || "");
      box.append(head, content);
      li.appendChild(box);
      refs.vbookDetailCommentList.appendChild(li);
    }
  }

  const tocWrap = refs.vbookDetailTocList.closest(".vbook-detail-toc-wrap");
  if (tocWrap) tocWrap.classList.toggle("hidden", !state.detail.tocVisible);
  refs.btnVbookTocReverse.disabled = !state.detail.tocLoaded || state.detail.tocLoading || state.detail.toc.length <= 1;
  refs.btnVbookTocReverse.textContent = state.detail.tocReversed
    ? state.shell.t("vbookTocOrderDesc")
    : state.shell.t("vbookTocOrderAsc");

  refs.vbookDetailTocList.innerHTML = "";
  if (!state.detail.tocVisible) {
    refs.vbookDetailTocEmpty.textContent = "";
    return;
  }
  if (state.detail.tocLoading) {
    refs.vbookDetailTocEmpty.textContent = state.shell.t("statusLoadingVbookToc");
    return;
  }
  if (state.detail.tocError) {
    refs.vbookDetailTocEmpty.textContent = state.detail.tocError;
    return;
  }
  if (!state.detail.toc.length) {
    refs.vbookDetailTocEmpty.textContent = state.shell.t("vbookTocEmpty");
  } else {
    refs.vbookDetailTocEmpty.textContent = "";
    const list = state.detail.tocReversed ? [...state.detail.toc].reverse() : state.detail.toc;
    for (const row of list) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chapter-hit";
      const chapterUrl = String(row.url || "").trim();
      if (chapterUrl && chapterUrl === String(state.detail.selectedChapterUrl || "").trim()) btn.classList.add("active");
      const titleNode = document.createElement("div");
      titleNode.className = "chapter-hit-title";
      titleNode.textContent = normalizeDisplayTitle(row.title || `Chương ${row.index || "?"}`);
      const sub = document.createElement("div");
      sub.className = "chapter-hit-sub";
      sub.textContent = `#${row.index || "?"}`;
      btn.append(titleNode, sub);
      btn.addEventListener("click", async () => {
        const chapterTitle = String(row.title || "").trim();
        setSelectedDetailChapter(chapterUrl, chapterTitle);
        state.detail.lastReadRatio = 0;
        renderVbookDetail();
        await readNowFromDetail();
      });
      li.appendChild(btn);
      refs.vbookDetailTocList.appendChild(li);
    }
  }
}

async function loadDetailToc({ force = false } = {}) {
  if (state.detail.tocLoading) return;
  if (state.detail.tocLoaded && !force) return;
  const { sourceUrl, pluginId } = detailSourceContext();
  if (!sourceUrl) return;

  state.detail.tocLoading = true;
  state.detail.tocError = "";
  state.detail.tocVisible = true;
  renderVbookDetail();

  try {
    const data = await apiWithRequest("detail-toc", "/api/vbook/toc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: sourceUrl,
        plugin_id: pluginId,
        all: true,
      }),
    });
    state.detail.toc = Array.isArray(data && data.items) ? data.items : [];
    state.detail.tocLoaded = true;
    if (state.detail.lastReadChapterUrl && !state.detail.lastReadChapterTitle) {
      const matched = state.detail.toc.find(
        (row) => String((row && row.url) || "").trim() === String(state.detail.lastReadChapterUrl || "").trim(),
      );
      if (matched) state.detail.lastReadChapterTitle = String((matched && matched.title) || "").trim();
    }
    const preferred = getPreferredDetailChapter();
    if (preferred) setSelectedDetailChapter(preferred.url, preferred.title);
  } catch (error) {
    if (!isAbortError(error)) {
      state.detail.toc = [];
      state.detail.tocLoaded = false;
      state.detail.tocError = getErrorMessage(error);
    }
  } finally {
    state.detail.tocLoading = false;
    renderVbookDetail();
  }
}

async function openDetailDialog(item, options = {}) {
  const openOptions = options && typeof options === "object" ? options : {};
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  state.detail.item = item;
  state.detail.requestId = requestId;
  state.detail.loading = true;
  state.detail.errorMessage = "";
  state.detail.detail = {
    title: item.title || "",
    author: item.author || "",
    description: "",
    cover: item.cover || "",
    url: item.detail_url || "",
  };
  state.detail.pluginId = String(item.plugin_id || "").trim();
  state.detail.lastReadChapterUrl = String(openOptions.chapterUrl || "").trim();
  state.detail.lastReadChapterTitle = String(openOptions.chapterTitle || "").trim();
  state.detail.lastReadRatio = parseRatio(openOptions.chapterRatio);
  state.detail.selectedChapterUrl = String(openOptions.chapterUrl || "").trim();
  state.detail.selectedChapterTitle = String(openOptions.chapterTitle || "").trim();
  state.detail.toc = [];
  state.detail.tocVisible = false;
  state.detail.tocLoaded = false;
  state.detail.tocLoading = false;
  state.detail.tocError = "";
  state.detail.tocReversed = false;
  state.detail.actionBusy = "";
  renderVbookDetail();
  if (!refs.vbookDetailDialog.open) refs.vbookDetailDialog.showModal();

  state.shell.showStatus(state.shell.t("statusLoadingVbookDetail"));
  try {
    const data = await apiWithRequest("detail", "/api/vbook/detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: item.detail_url || "",
        plugin_id: item.plugin_id || "",
      }),
    });
    if (state.detail.requestId !== requestId) return;
    const detail = (data && data.detail) || {};
    if (detail && typeof detail === "object") state.detail.detail = detail;
    const plugin = (data && data.plugin) || {};
    if (plugin && plugin.plugin_id) state.detail.pluginId = String(plugin.plugin_id || "").trim();
    state.detail.loading = false;
  } catch (error) {
    if (state.detail.requestId !== requestId) return;
    if (!isAbortError(error)) {
      state.detail.loading = false;
      state.detail.errorMessage = getErrorMessage(error);
      showToastError(error);
    }
  } finally {
    if (state.detail.requestId !== requestId) return;
    renderVbookDetail();
    state.shell.hideStatus();
  }
}

async function resolveImportedBookFallback(sourceUrl, pluginId) {
  try {
    const payload = await apiWithRequest("library-books", "/api/library/books");
    const items = Array.isArray(payload && payload.items) ? payload.items : [];
    const found = items.find((row) => {
      const rowSource = String((row && row.source_url) || "").trim();
      const rowPlugin = String((row && row.source_plugin) || "").trim();
      if (!rowSource || rowSource !== sourceUrl) return false;
      if (pluginId && rowPlugin) return rowPlugin === pluginId;
      return true;
    }) || null;
    if (!found) return { bookId: "", book: null };
    return {
      bookId: String((found && found.book_id) || "").trim(),
      book: found,
    };
  } catch {
    return { bookId: "", book: null };
  }
}

async function importOnlineBook(item, { openReader = false } = {}) {
  const sourceUrl = String((item.detail_url || (state.detail.detail && state.detail.detail.url) || "")).trim();
  if (!sourceUrl) return;
  const pluginId = String((item.plugin_id || state.detail.pluginId || "")).trim();
  const activeDetailSource = String(((state.detail.detail && state.detail.detail.url) || (state.detail.item && state.detail.item.detail_url) || "")).trim();
  const busyAction = openReader ? "read" : "import";
  const shouldRenderBusy = Boolean(activeDetailSource && activeDetailSource === sourceUrl);

  if (shouldRenderBusy) {
    state.detail.errorMessage = "";
    state.detail.actionBusy = busyAction;
    renderVbookDetail();
  }
  state.shell.showStatus(state.shell.t(openReader ? "statusOpeningReaderFromOnline" : "statusAddingBookToLibrary"));
  try {
    const data = await apiWithRequest("import-url", "/api/library/import-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildImportSeed(sourceUrl, pluginId, Boolean(openReader))),
    });
    let importedBook = (data && data.book && typeof data.book === "object") ? data.book : null;
    let bookId = String((importedBook && importedBook.book_id) || "").trim();

    if (!bookId && !openReader) {
      const fallback = await resolveImportedBookFallback(sourceUrl, pluginId);
      bookId = String(fallback.bookId || "").trim();
      if (!importedBook) importedBook = fallback.book;
    }
    if (!bookId) {
      state.shell.showToast(state.shell.t("toastImportBookMissingId"));
      return;
    }

    if (!openReader) {
      state.shell.showToast(state.shell.t("toastBookAddedToLibrary"));
      return;
    }

    let chapters = Array.isArray(importedBook && importedBook.chapters) ? importedBook.chapters : [];
    if (!chapters.length) {
      try {
        const detailPayload = await apiWithRequest(`book-detail-${bookId}`, `/api/library/book/${encodeURIComponent(bookId)}`);
        const detailBook = (detailPayload && detailPayload.book) || {};
        chapters = Array.isArray(detailBook.chapters) ? detailBook.chapters : [];
      } catch {
        // ignore
      }
    }

    const preferred = getPreferredDetailChapter();
    const selectedUrl = String((preferred && preferred.url) || state.detail.selectedChapterUrl || "").trim();
    const matchedChapter = chapters.find((row) => String((row && row.remote_url) || "").trim() === selectedUrl) || chapters[0];
    const chapterId = String((matchedChapter && matchedChapter.chapter_id) || "").trim();
    const readerMode = resolveReaderModeForBook(importedBook);
    if (chapterId) {
      try {
        await apiWithRequest(`book-progress-${bookId}`, `/api/library/book/${encodeURIComponent(bookId)}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapter_id: chapterId,
            ratio: 0,
            mode: readerMode,
          }),
        });
      } catch {
        // ignore
      }
    }
    window.location.href = buildReaderUrl(bookId, chapterId, readerMode);
  } catch (error) {
    if (shouldRenderBusy && !isAbortError(error)) {
      state.detail.errorMessage = getErrorMessage(error);
    }
    showToastError(error);
  } finally {
    state.detail.actionBusy = "";
    if (shouldRenderBusy) renderVbookDetail();
    state.shell.hideStatus();
  }
}

async function readNowFromDetail() {
  if (!state.detail.item) {
    state.shell.showToast(state.shell.t("vbookDetailNoBookSelected"));
    return;
  }
  if (!state.detail.tocLoaded) {
    state.shell.showStatus(state.shell.t("statusLoadingVbookToc"));
    try {
      await loadDetailToc({ force: false });
    } finally {
      state.shell.hideStatus();
    }
  }
  if (!state.detail.toc.length) {
    if (state.detail.tocError) state.shell.showToast(state.detail.tocError);
    else state.shell.showToast(state.shell.t("vbookTocEmpty"));
    return;
  }
  const preferred = getPreferredDetailChapter();
  if (preferred) {
    setSelectedDetailChapter(preferred.url, preferred.title);
    state.detail.lastReadRatio = 0;
    renderVbookDetail();
    await upsertHistoryFromDetail({
      chapterUrl: state.detail.selectedChapterUrl,
      chapterTitle: state.detail.selectedChapterTitle,
      chapterRatio: 0,
    });
  }
  await importOnlineBook(state.detail.item, { openReader: true });
}

async function downloadFromDetail() {
  if (!state.detail.item) {
    state.shell.showToast(state.shell.t("vbookDetailNoBookSelected"));
    return;
  }
  const sourceUrl = String((state.detail.item.detail_url || "")).trim();
  if (!sourceUrl) {
    state.shell.showToast(state.shell.t("vbookDetailNoBookSelected"));
    return;
  }
  const pluginId = String(state.detail.pluginId || state.detail.item.plugin_id || "").trim();
  state.detail.actionBusy = "download";
  state.detail.errorMessage = "";
  renderVbookDetail();
  state.shell.showStatus(state.shell.t("statusQueueDownload"));
  try {
    const data = await apiWithRequest("import-url", "/api/library/import-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildImportSeed(sourceUrl, pluginId, false)),
    });
    let importedBook = (data && data.book && typeof data.book === "object") ? data.book : null;
    let bookId = String((importedBook && importedBook.book_id) || "").trim();
    if (!bookId) {
      const fallback = await resolveImportedBookFallback(sourceUrl, pluginId);
      importedBook = importedBook || fallback.book;
      bookId = String(fallback.bookId || "").trim();
    }
    if (!bookId) {
      state.shell.showToast(state.shell.t("toastImportBookMissingId"));
      return;
    }
    const queued = await apiWithRequest(`book-download-${bookId}`, `/api/library/book/${encodeURIComponent(bookId)}/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (queued && queued.already_downloaded) state.shell.showToast(state.shell.t("downloadAlreadyDone"));
    else state.shell.showToast(state.shell.t("downloadQueued"));
  } catch (error) {
    if (!isAbortError(error)) state.detail.errorMessage = getErrorMessage(error);
    showToastError(error);
  } finally {
    state.detail.actionBusy = "";
    renderVbookDetail();
    state.shell.hideStatus();
  }
}

async function refreshPageByReaderSettings() {
  const detailWasOpen = Boolean(refs.vbookDetailDialog && refs.vbookDetailDialog.open);
  const detailSeed = state.detail.item ? { ...state.detail.item } : null;
  const chapterUrl = String(state.detail.selectedChapterUrl || state.detail.lastReadChapterUrl || "").trim();
  const chapterTitle = String(state.detail.selectedChapterTitle || state.detail.lastReadChapterTitle || "").trim();
  const chapterRatio = parseRatio(state.detail.lastReadRatio);

  abortPageRequests();
  await loadFilterConfig({ preserveMode: true });
  if (state.online.pluginId && (state.query || state.filter.mode === "filter")) {
    await runSearch(state.query, { updateUrl: false });
  } else {
    renderAll();
  }

  if (detailWasOpen && detailSeed && detailSeed.detail_url) {
    await openDetailDialog(detailSeed, {
      chapterUrl,
      chapterTitle,
      chapterRatio,
    });
    if (state.detail.tocVisible) {
      await loadDetailToc({ force: true });
    }
  }
}

async function init() {
  state.shell = await initShell({
    page: "online-search",
    onSearchSubmit: (q) => runSearch(q, { updateUrl: true }),
  });
  state.translationEnabled = typeof state.shell.getTranslationEnabled === "function"
    ? state.shell.getTranslationEnabled()
    : true;
  state.translationMode = typeof state.shell.getTranslationMode === "function"
    ? state.shell.getTranslationMode()
    : "server";
  state.translationLocalSig = localTranslationSettingsSignature(state.shell);

  refs.onlineSearchTitle.textContent = state.shell.t("onlineSearchTitle");
  refs.onlineSearchFilterTitle.textContent = state.shell.t("onlineSearchFilterTitle");
  refs.onlineSearchResultsTitle.textContent = state.shell.t("onlineSearchResultsTitle");
  refs.vbookPluginLabel.textContent = state.shell.t("vbookSearchPluginLabel");
  refs.btnOnlineSearchReset.textContent = state.shell.t("onlineSearchReset");
  refs.btnOnlineSearchRun.textContent = state.shell.t("vbookSearchRun");
  if (refs.btnOnlineSearchRunBottom) refs.btnOnlineSearchRunBottom.textContent = state.shell.t("onlineSearchApplyFilter");
  refs.btnOnlineSearchToggleFilter.textContent = state.shell.t("onlineSearchFilterToggle");
  refs.btnOnlineSearchPrev.textContent = state.shell.t("tocPrev");
  refs.btnOnlineSearchNext.textContent = state.shell.t("tocNext");
  refs.vbookDetailDialogTitle.textContent = state.shell.t("vbookDetailDialogTitle");
  refs.btnVbookDetailClose.textContent = state.shell.t("close");
  refs.btnVbookDetailLoadToc.textContent = state.shell.t("vbookDetailShowToc");
  refs.btnVbookDetailImport.textContent = state.shell.t("vbookSearchImportBook");
  refs.btnVbookDetailDownload.textContent = state.shell.t("downloadBook");
  refs.btnVbookDetailReadNow.textContent = state.shell.t("vbookDetailReadNow");
  refs.vbookDetailGenresTitle.textContent = state.shell.t("vbookDetailGenresTitle");
  refs.vbookDetailExtraTitle.textContent = state.shell.t("vbookDetailExtraTitle");
  refs.vbookDetailSuggestTitle.textContent = state.shell.t("vbookDetailSuggestTitle");
  refs.vbookDetailCommentTitle.textContent = state.shell.t("vbookDetailCommentTitle");
  refs.vbookDetailTocTitle.textContent = state.shell.t("vbookDetailTocTitle");
  refs.btnVbookTocReverse.textContent = state.shell.t("vbookTocOrderAsc");
  refs.vbookDetailSubtitle.textContent = state.shell.t("vbookDetailSubtitle");
  refs.vbookGenreDialogTitle.textContent = state.shell.t("vbookGenreDialogTitle");
  refs.btnVbookGenreClose.textContent = state.shell.t("close");
  refs.vbookGenreDialogSubtitle.textContent = state.shell.t("vbookGenreDialogSubtitle", { count: 0 });
  refs.vbookGenreEmpty.textContent = state.shell.t("vbookGenreEmpty");

  const queryParams = state.shell.parseQuery();
  state.query = String(queryParams.q || "").trim();
  state.online.pluginId = String(queryParams.vpid || "").trim();
  state.filter.mode = String(queryParams.mode || "").trim().toLowerCase() === "filter" ? "filter" : "search";
  state.filter.panelVisible = state.filter.mode === "filter";
  state.filter.selected = parseFiltersFromQuery(queryParams.filters);
  if (refs.searchInput) refs.searchInput.value = state.query;

  try {
    await loadVbookPlugins();
    await loadFilterConfig({ preserveMode: true });
    if (state.online.pluginId && (state.query || state.filter.mode === "filter")) {
      await runSearch(state.query, { updateUrl: false });
    }
  } catch (error) {
    showToastError(error);
  }
  renderAll();

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
    refreshPageByReaderSettings().catch(() => { });
  });

  refs.vbookPluginSelect.addEventListener("change", async () => {
    state.pluginPickerOpen = false;
    renderPluginPicker();
    await handlePluginSelectionChange(String(refs.vbookPluginSelect.value || "").trim(), { autoSearch: true });
  });

  refs.btnVbookPluginPickerToggle.addEventListener("click", () => {
    state.pluginPickerOpen = !state.pluginPickerOpen;
    renderPluginPicker();
  });

  refs.btnOnlineSearchRun.addEventListener("click", async () => {
    await runCurrentSearchAction();
  });

  if (refs.btnOnlineSearchRunBottom) {
    refs.btnOnlineSearchRunBottom.addEventListener("click", async () => {
      await runCurrentSearchAction();
    });
  }

  refs.btnOnlineSearchReset.addEventListener("click", async () => {
    state.query = "";
    state.online.search = createSearchBucket();
    state.filter.selected = {};
    if (refs.searchInput) refs.searchInput.value = "";
    await loadFilterConfig({ preserveMode: false });
    updateQueryUrl();
    renderAll();
  });

  refs.btnOnlineSearchToggleFilter.addEventListener("click", async () => {
    if (!state.online.pluginId) {
      state.shell.showToast(state.shell.t("onlineSearchFilterNoPlugin"));
      return;
    }
    if (!state.filter.supported) {
      state.filter.panelVisible = !state.filter.panelVisible;
      renderAll();
      state.shell.showToast(state.shell.t("onlineSearchFilterUnsupported"));
      return;
    }
    state.filter.mode = state.filter.mode === "filter" ? "search" : "filter";
    state.filter.panelVisible = state.filter.mode === "filter";
    if (state.filter.mode === "filter") {
      state.query = "";
      if (refs.searchInput) refs.searchInput.value = "";
    }
    updateQueryUrl();
    renderAll();
    if (state.filter.mode === "filter") {
      await runSearch(state.query, { updateUrl: false });
    }
  });

  refs.btnOnlineSearchPrev.addEventListener("click", async () => {
    const nextPage = Math.max(1, state.online.search.page - 1);
    if (nextPage === state.online.search.page) return;
    state.shell.showStatus(state.shell.t("statusLoadingVbookSearch"));
    try {
      await loadSearchItems({ page: nextPage, reset: false });
    } catch (error) {
      showToastError(error);
    } finally {
      state.shell.hideStatus();
    }
  });

  refs.btnOnlineSearchNext.addEventListener("click", async () => {
    if (!state.online.search.hasNext) return;
    state.shell.showStatus(state.shell.t("statusLoadingVbookSearch"));
    try {
      await loadSearchItems({ page: state.online.search.page + 1, reset: false });
    } catch (error) {
      showToastError(error);
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

  refs.btnVbookDetailDownload.addEventListener("click", async () => {
    await downloadFromDetail();
  });

  refs.btnVbookDetailReadNow.addEventListener("click", async () => {
    await readNowFromDetail();
  });

  refs.btnVbookDetailLoadToc.addEventListener("click", async () => {
    state.detail.tocVisible = !state.detail.tocVisible;
    renderVbookDetail();
    if (!state.detail.tocVisible) return;
    if (state.detail.tocLoaded) return;
    state.shell.showStatus(state.shell.t("statusLoadingVbookToc"));
    try {
      await loadDetailToc({ force: false });
    } catch (error) {
      showToastError(error);
    } finally {
      state.shell.hideStatus();
    }
  });

  refs.btnVbookTocReverse.addEventListener("click", () => {
    state.detail.tocReversed = !state.detail.tocReversed;
    renderVbookDetail();
  });

  refs.btnVbookGenreClose.addEventListener("click", () => {
    if (refs.vbookGenreDialog.open) refs.vbookGenreDialog.close();
  });
}

init();
