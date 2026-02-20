import { initShell } from "../site_common.js?v=20260220-vb11";
import { normalizeDisplayTitle } from "../reader_text.js?v=20260220-vb04";

const refs = {
  searchInput: document.getElementById("search-input"),
  exploreTitle: document.getElementById("explore-title"),
  exploreMeta: document.getElementById("explore-meta"),
  vbookPluginLabel: document.getElementById("vbook-plugin-label"),
  vbookPluginSelect: document.getElementById("vbook-plugin-select"),
  btnVbookSearchRun: document.getElementById("btn-vbook-search-run"),
  btnVbookSearchReset: document.getElementById("btn-vbook-search-reset"),
  btnExploreTogglePlugin: document.getElementById("btn-explore-toggle-plugin"),
  btnExploreLoadHome: document.getElementById("btn-explore-load-home"),
  btnExploreLoadGenre: document.getElementById("btn-explore-load-genre"),
  explorePluginPanel: document.getElementById("explore-plugin-panel"),
  explorePluginTitle: document.getElementById("explore-plugin-title"),
  explorePluginVersion: document.getElementById("explore-plugin-version"),
  explorePluginAuthorLabel: document.getElementById("explore-plugin-author-label"),
  explorePluginAuthorValue: document.getElementById("explore-plugin-author-value"),
  explorePluginTypeLabel: document.getElementById("explore-plugin-type-label"),
  explorePluginTypeValue: document.getElementById("explore-plugin-type-value"),
  explorePluginLocaleLabel: document.getElementById("explore-plugin-locale-label"),
  explorePluginLocaleValue: document.getElementById("explore-plugin-locale-value"),
  explorePluginSourceLabel: document.getElementById("explore-plugin-source-label"),
  explorePluginSourceValue: document.getElementById("explore-plugin-source-value"),
  explorePluginDescriptionLabel: document.getElementById("explore-plugin-description-label"),
  explorePluginDescriptionValue: document.getElementById("explore-plugin-description-value"),
  explorePluginSettingsTitle: document.getElementById("explore-plugin-settings-title"),
  explorePluginSettingsEffective: document.getElementById("explore-plugin-settings-effective"),
  explorePluginDelayLabel: document.getElementById("explore-plugin-delay-label"),
  explorePluginDelayInput: document.getElementById("explore-plugin-delay-input"),
  explorePluginThreadsLabel: document.getElementById("explore-plugin-threads-label"),
  explorePluginThreadsInput: document.getElementById("explore-plugin-threads-input"),
  explorePluginPrefetchLabel: document.getElementById("explore-plugin-prefetch-label"),
  explorePluginPrefetchInput: document.getElementById("explore-plugin-prefetch-input"),
  explorePluginSupplementalLabel: document.getElementById("explore-plugin-supplemental-label"),
  explorePluginSupplementalInput: document.getElementById("explore-plugin-supplemental-input"),
  explorePluginSettingsHint: document.getElementById("explore-plugin-settings-hint"),
  btnExplorePluginSettingsLoad: document.getElementById("btn-explore-plugin-settings-load"),
  btnExplorePluginSettingsSave: document.getElementById("btn-explore-plugin-settings-save"),
  btnExplorePluginSettingsClear: document.getElementById("btn-explore-plugin-settings-clear"),

  exploreHomeTitle: document.getElementById("explore-home-title"),
  exploreHomeCount: document.getElementById("explore-home-count"),
  exploreHomeTabs: document.getElementById("explore-home-tabs"),
  exploreHomeGrid: document.getElementById("explore-home-grid"),
  exploreHomeEmpty: document.getElementById("explore-home-empty"),
  btnExploreHomePrev: document.getElementById("btn-explore-home-prev"),
  exploreHomePage: document.getElementById("explore-home-page"),
  btnExploreHomeNext: document.getElementById("btn-explore-home-next"),

  exploreGenreTitle: document.getElementById("explore-genre-title"),
  exploreGenreCount: document.getElementById("explore-genre-count"),
  exploreGenreTabs: document.getElementById("explore-genre-tabs"),
  exploreGenreGrid: document.getElementById("explore-genre-grid"),
  exploreGenreEmpty: document.getElementById("explore-genre-empty"),
  btnExploreGenrePrev: document.getElementById("btn-explore-genre-prev"),
  exploreGenrePage: document.getElementById("explore-genre-page"),
  btnExploreGenreNext: document.getElementById("btn-explore-genre-next"),

  exploreSearchTitle: document.getElementById("explore-search-title"),
  exploreSearchCount: document.getElementById("explore-search-count"),
  exploreSearchGrid: document.getElementById("explore-search-grid"),
  exploreSearchEmpty: document.getElementById("explore-search-empty"),
  btnExploreSearchPrev: document.getElementById("btn-explore-search-prev"),
  exploreSearchPage: document.getElementById("explore-search-page"),
  btnExploreSearchNext: document.getElementById("btn-explore-search-next"),

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

function createBucket() {
  return {
    tabs: [],
    activeTab: -1,
    page: 1,
    hasNext: false,
    tokenByPage: { 1: null },
    items: [],
    loading: false,
    errorMessage: "",
    loadingTextKey: "",
  };
}

function createHomeBucket() {
  const bucket = createBucket();
  bucket.loadingTextKey = "statusLoadingVbookHome";
  return bucket;
}

function createGenreBucket() {
  const bucket = createBucket();
  bucket.loadingTextKey = "statusLoadingVbookGenre";
  return bucket;
}

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
  autoOpen: {
    sourceUrl: "",
    pluginId: "",
    chapterUrl: "",
    chapterTitle: "",
    chapterRatio: null,
  },
  online: {
    plugins: [],
    pluginId: "",
    home: createHomeBucket(),
    genre: createGenreBucket(),
    search: createSearchBucket(),
  },
  pluginSwitchToken: 0,
  pluginPanelVisible: false,
  pluginSettings: {
    pluginInfo: null,
    loading: false,
    overrideLoaded: false,
    override: {
      request_delay_ms: null,
      download_threads: null,
      prefetch_unread_count: null,
      supplemental_code: "",
    },
    effective: {
      request_delay_ms: 0,
      download_threads: 4,
      prefetch_unread_count: 2,
    },
  },
  detail: {
    item: null,
    detail: null,
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
};

function getCurrentQuery() {
  return String((refs.searchInput && refs.searchInput.value) || state.query || "").trim();
}

function parseRatio(value) {
  if (value == null || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (num <= 0) return 0;
  if (num >= 1) return 1;
  return num;
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

function abortExploreRequests() {
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

function getSelectedPlugin() {
  const pid = String(state.online.pluginId || "").trim();
  if (!pid) return null;
  return state.online.plugins.find((x) => String((x && x.plugin_id) || "").trim() === pid) || null;
}

function pluginSupports(scriptKey) {
  const plugin = getSelectedPlugin();
  const scripts = Array.isArray(plugin && plugin.scripts) ? plugin.scripts : [];
  return scripts.includes(scriptKey);
}

function updateQueryUrl() {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.online.pluginId) params.set("vpid", state.online.pluginId);
  const next = params.toString() ? `/explore?${params.toString()}` : "/explore";
  if (`${window.location.pathname}${window.location.search}` !== next) {
    window.history.replaceState({}, "", next);
  }
}

function resetDetailForPluginSwitch() {
  state.detail.item = null;
  state.detail.detail = null;
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

function resetBucket(bucket) {
  bucket.page = 1;
  bucket.hasNext = false;
  bucket.tokenByPage = { 1: null };
  bucket.items = [];
  bucket.loading = false;
  bucket.errorMessage = "";
}

function setTabs(bucket, tabs) {
  bucket.tabs = Array.isArray(tabs) ? tabs.filter((x) => x && typeof x === "object") : [];
  bucket.activeTab = bucket.tabs.length ? 0 : -1;
  resetBucket(bucket);
}

function activeTab(bucket) {
  if (!bucket || !Array.isArray(bucket.tabs)) return null;
  const idx = Number(bucket.activeTab);
  if (!Number.isInteger(idx) || idx < 0 || idx >= bucket.tabs.length) return null;
  return bucket.tabs[idx] || null;
}

function renderOnlinePluginOptions() {
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

function renderExploreMeta() {
  const plugin = getSelectedPlugin();
  refs.exploreMeta.textContent = plugin
    ? formatPluginLabel(plugin)
    : state.shell.t("exploreMetaIdle");
  refs.btnExploreLoadHome.disabled = !plugin || !pluginSupports("home");
  refs.btnExploreLoadGenre.disabled = !plugin || !pluginSupports("genre");
}

function renderPluginPanelVisibility() {
  const open = Boolean(state.pluginPanelVisible);
  if (refs.explorePluginPanel) {
    refs.explorePluginPanel.classList.toggle("hidden", !open);
  }
  if (refs.btnExploreTogglePlugin) {
    refs.btnExploreTogglePlugin.textContent = open
      ? state.shell.t("exploreHidePluginPanel")
      : state.shell.t("exploreShowPluginPanel");
  }
}

function parseNullableIntInput(value, { min = 0, max = Number.POSITIVE_INFINITY } = {}) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const num = Number.parseInt(raw, 10);
  if (!Number.isFinite(num)) return null;
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

function renderPluginSection() {
  const plugin = getSelectedPlugin();
  state.pluginSettings.pluginInfo = plugin || null;
  const loading = Boolean(state.pluginSettings.loading);
  const override = state.pluginSettings.override || {};
  const effective = state.pluginSettings.effective || {};

  refs.explorePluginTitle.textContent = plugin
    ? (String(plugin.name || plugin.plugin_id || "").trim() || state.shell.t("vbookUnknownPlugin"))
    : state.shell.t("explorePluginInfoEmpty");
  refs.explorePluginVersion.textContent = plugin
    ? state.shell.t("explorePluginVersion", { version: plugin.version ?? "?" })
    : "";
  refs.explorePluginAuthorValue.textContent = plugin
    ? (String(plugin.author || "").trim() || state.shell.t("vbookDetailCommentGuest"))
    : "-";
  refs.explorePluginTypeValue.textContent = plugin
    ? (String(plugin.type || "").trim() || "-")
    : "-";
  refs.explorePluginLocaleValue.textContent = plugin
    ? (String(plugin.locale || "").trim() || "-")
    : "-";
  refs.explorePluginSourceValue.textContent = plugin
    ? (String(plugin.source || "").trim() || "-")
    : "-";
  refs.explorePluginDescriptionValue.textContent = plugin
    ? (String(plugin.description || "").trim() || state.shell.t("explorePluginDescriptionEmpty"))
    : state.shell.t("explorePluginDescriptionEmpty");

  refs.explorePluginSettingsEffective.textContent = plugin
    ? state.shell.t("explorePluginEffective", {
      delay: Number(effective.request_delay_ms || 0),
      threads: Number(effective.download_threads || 0),
      prefetch: Number(effective.prefetch_unread_count || 0),
    })
    : "";

  refs.explorePluginDelayInput.value = override.request_delay_ms == null ? "" : String(override.request_delay_ms);
  refs.explorePluginThreadsInput.value = override.download_threads == null ? "" : String(override.download_threads);
  refs.explorePluginPrefetchInput.value = override.prefetch_unread_count == null ? "" : String(override.prefetch_unread_count);
  refs.explorePluginSupplementalInput.value = String(override.supplemental_code || "");

  const disabled = !plugin || loading;
  refs.explorePluginDelayInput.disabled = disabled;
  refs.explorePluginThreadsInput.disabled = disabled;
  refs.explorePluginPrefetchInput.disabled = disabled;
  refs.explorePluginSupplementalInput.disabled = disabled;
  refs.btnExplorePluginSettingsLoad.disabled = !plugin || loading;
  refs.btnExplorePluginSettingsSave.disabled = !plugin || loading;
  refs.btnExplorePluginSettingsClear.disabled = !plugin || loading;
}

async function loadPluginSettings() {
  const plugin = getSelectedPlugin();
  if (!plugin) {
    state.pluginSettings.overrideLoaded = false;
    state.pluginSettings.override = {
      request_delay_ms: null,
      download_threads: null,
      prefetch_unread_count: null,
      supplemental_code: "",
    };
    state.pluginSettings.effective = {
      request_delay_ms: 0,
      download_threads: 4,
      prefetch_unread_count: 2,
    };
    renderPluginSection();
    return;
  }
  state.pluginSettings.loading = true;
  renderPluginSection();
  try {
    const pid = String(plugin.plugin_id || "").trim();
    const [overrideData, effectiveData] = await Promise.all([
      apiWithRequest("plugin-settings-override", `/api/vbook/settings/plugin/${encodeURIComponent(pid)}`),
      apiWithRequest("plugin-settings-effective", `/api/vbook/settings/effective?plugin_id=${encodeURIComponent(pid)}`),
    ]);
    state.pluginSettings.overrideLoaded = true;
    state.pluginSettings.override = (overrideData && overrideData.override) || {
      request_delay_ms: null,
      download_threads: null,
      prefetch_unread_count: null,
      supplemental_code: "",
    };
    state.pluginSettings.effective = (effectiveData && effectiveData.settings) || {
      request_delay_ms: 0,
      download_threads: 4,
      prefetch_unread_count: 2,
    };
  } catch (error) {
    showToastError(error);
  } finally {
    state.pluginSettings.loading = false;
    renderPluginSection();
  }
}

async function savePluginSettings() {
  const plugin = getSelectedPlugin();
  if (!plugin) return;
  const pid = String(plugin.plugin_id || "").trim();
  const payload = {
    request_delay_ms: parseNullableIntInput(refs.explorePluginDelayInput.value, { min: 0, max: 15000 }),
    download_threads: parseNullableIntInput(refs.explorePluginThreadsInput.value, { min: 1, max: 16 }),
    prefetch_unread_count: parseNullableIntInput(refs.explorePluginPrefetchInput.value, { min: 0, max: 50 }),
    supplemental_code: String(refs.explorePluginSupplementalInput.value || ""),
  };
  state.shell.showStatus(state.shell.t("statusSavingVbookPluginSettings"));
  try {
    await apiWithRequest(`plugin-settings-save-${pid}`, `/api/vbook/settings/plugin/${encodeURIComponent(pid)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    state.shell.showToast(state.shell.t("toastVbookPluginSettingsSaved"));
    await loadPluginSettings();
  } catch (error) {
    showToastError(error);
  } finally {
    state.shell.hideStatus();
  }
}

async function clearPluginSettings() {
  const plugin = getSelectedPlugin();
  if (!plugin) return;
  const pid = String(plugin.plugin_id || "").trim();
  state.shell.showStatus(state.shell.t("statusSavingVbookPluginSettings"));
  try {
    await apiWithRequest(`plugin-settings-clear-${pid}`, `/api/vbook/settings/plugin/${encodeURIComponent(pid)}`, {
      method: "DELETE",
    });
    state.shell.showToast(state.shell.t("toastVbookPluginSettingsCleared"));
    await loadPluginSettings();
  } catch (error) {
    showToastError(error);
  } finally {
    state.shell.hideStatus();
  }
}

function renderTabList(container, bucket, onClick) {
  container.innerHTML = "";
  if (!bucket.tabs.length) return;
  bucket.tabs.forEach((tab, idx) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab-btn";
    btn.textContent = String(tab.title || `Tab ${idx + 1}`);
    if (idx === bucket.activeTab) btn.classList.add("active");
    btn.addEventListener("click", () => onClick(idx));
    li.appendChild(btn);
    container.appendChild(li);
  });
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

function renderBucketBooks({ bucket, gridEl, emptyEl, countEl, pageEl, prevEl, nextEl, emptyKey }) {
  gridEl.innerHTML = "";
  const count = Array.isArray(bucket.items) ? bucket.items.length : 0;
  countEl.textContent = state.shell.t("vbookSearchResultCount", { count });

  if (bucket.loading) {
    emptyEl.textContent = state.shell.t(bucket.loadingTextKey || "statusLoadingVbookSearch");
  } else if (bucket.errorMessage) {
    emptyEl.textContent = bucket.errorMessage;
  } else if (!count) {
    emptyEl.textContent = emptyKey;
  } else {
    emptyEl.textContent = "";
    for (const item of bucket.items) {
      gridEl.appendChild(buildOnlineBookCard(item));
    }
  }

  const page = Math.max(1, Number(bucket.page || 1));
  pageEl.textContent = state.shell.t("vbookSearchPage", { page });
  prevEl.disabled = page <= 1;
  nextEl.disabled = !bucket.hasNext;
}

function renderHome() {
  renderTabList(refs.exploreHomeTabs, state.online.home, async (idx) => {
    if (idx === state.online.home.activeTab) return;
    state.online.home.activeTab = idx;
    resetBucket(state.online.home);
    await loadHomeItems({ page: 1, reset: true });
  });

  let emptyKey = state.shell.t("exploreHomeEmpty");
  if (!state.online.pluginId) emptyKey = state.shell.t("exploreNeedPlugin");
  else if (!pluginSupports("home")) emptyKey = state.shell.t("exploreHomeUnsupported");
  else if (!state.online.home.tabs.length && !state.online.home.items.length) emptyKey = state.shell.t("exploreTabEmpty");

  renderBucketBooks({
    bucket: state.online.home,
    gridEl: refs.exploreHomeGrid,
    emptyEl: refs.exploreHomeEmpty,
    countEl: refs.exploreHomeCount,
    pageEl: refs.exploreHomePage,
    prevEl: refs.btnExploreHomePrev,
    nextEl: refs.btnExploreHomeNext,
    emptyKey,
  });
}

function renderGenre() {
  renderTabList(refs.exploreGenreTabs, state.online.genre, async (idx) => {
    if (idx === state.online.genre.activeTab && Array.isArray(state.online.genre.items) && state.online.genre.items.length) return;
    state.online.genre.activeTab = idx;
    resetBucket(state.online.genre);
    await loadGenreItems({ page: 1, reset: true });
  });

  let emptyKey = state.shell.t("exploreGenreEmpty");
  if (!state.online.pluginId) emptyKey = state.shell.t("exploreNeedPlugin");
  else if (!pluginSupports("genre")) emptyKey = state.shell.t("exploreGenreUnsupported");
  else if (!state.online.genre.tabs.length && !state.online.genre.items.length) emptyKey = state.shell.t("exploreTabEmpty");

  renderBucketBooks({
    bucket: state.online.genre,
    gridEl: refs.exploreGenreGrid,
    emptyEl: refs.exploreGenreEmpty,
    countEl: refs.exploreGenreCount,
    pageEl: refs.exploreGenrePage,
    prevEl: refs.btnExploreGenrePrev,
    nextEl: refs.btnExploreGenreNext,
    emptyKey,
  });
}

function renderSearch() {
  const bucket = state.online.search;
  refs.exploreSearchGrid.innerHTML = "";
  const count = Array.isArray(bucket.items) ? bucket.items.length : 0;
  refs.exploreSearchCount.textContent = state.shell.t("vbookSearchResultCount", { count });

  let emptyKey = "";
  if (!state.online.plugins.length) emptyKey = state.shell.t("vbookSearchNoPlugins");
  else if (!state.online.pluginId) emptyKey = state.shell.t("exploreNeedPlugin");
  else if (!state.query) emptyKey = state.shell.t("searchHint");
  else if (!count) emptyKey = state.shell.t("exploreSearchEmpty");

  if (bucket.loading) {
    refs.exploreSearchEmpty.textContent = state.shell.t(bucket.loadingTextKey || "statusLoadingVbookSearch");
  } else if (bucket.errorMessage) {
    refs.exploreSearchEmpty.textContent = bucket.errorMessage;
  } else if (emptyKey) {
    refs.exploreSearchEmpty.textContent = emptyKey;
  } else {
    refs.exploreSearchEmpty.textContent = "";
    for (const item of bucket.items) {
      refs.exploreSearchGrid.appendChild(buildOnlineBookCard(item));
    }
  }

  const page = Math.max(1, Number(bucket.page || 1));
  refs.exploreSearchPage.textContent = state.shell.t("vbookSearchPage", { page });
  refs.btnExploreSearchPrev.disabled = page <= 1 || !state.online.pluginId || !state.query;
  refs.btnExploreSearchNext.disabled = !bucket.hasNext || !state.online.pluginId || !state.query;
}

function renderAll() {
  renderExploreMeta();
  renderPluginPanelVisibility();
  renderPluginSection();
  renderHome();
  renderGenre();
  renderSearch();
}

async function loadVbookPlugins() {
  const payload = await apiWithRequest("plugins", "/api/vbook/plugins");
  const list = Array.isArray(payload && payload.items) ? payload.items : [];
  state.online.plugins = list;
  if (state.online.pluginId && !list.some((x) => String(x.plugin_id || "").trim() === state.online.pluginId)) {
    state.online.pluginId = "";
  }
  if (!state.online.pluginId && list.length) {
    state.online.pluginId = String(list[0].plugin_id || "").trim();
  }
  renderOnlinePluginOptions();
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

async function loadHomeTabs() {
  const bucket = state.online.home;
  if (!state.online.pluginId) {
    setTabs(bucket, []);
    bucket.items = [];
    bucket.hasNext = false;
    return;
  }
  if (!pluginSupports("home")) {
    setTabs(bucket, []);
    bucket.items = [];
    bucket.hasNext = false;
    return;
  }
  const pluginSnapshot = String(state.online.pluginId || "").trim();
  bucket.loading = true;
  bucket.errorMessage = "";
  renderHome();
  try {
    const data = await apiWithRequest("home-tabs", "/api/vbook/home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plugin_id: pluginSnapshot }),
    });
    if (pluginSnapshot !== String(state.online.pluginId || "").trim()) return;
    const tabs = Array.isArray(data && data.tabs) ? data.tabs : [];
    const items = Array.isArray(data && data.items) ? data.items : [];
    setTabs(bucket, tabs);
    if (!tabs.length) {
      bucket.items = items;
    }
  } catch (error) {
    if (isAbortError(error)) return;
    bucket.errorMessage = getErrorMessage(error);
  } finally {
    if (pluginSnapshot === String(state.online.pluginId || "").trim()) {
      bucket.loading = false;
      renderHome();
    }
  }
}

async function loadGenreTabs() {
  const bucket = state.online.genre;
  if (!state.online.pluginId) {
    setTabs(bucket, []);
    bucket.items = [];
    bucket.hasNext = false;
    return;
  }
  if (!pluginSupports("genre")) {
    setTabs(bucket, []);
    bucket.items = [];
    bucket.hasNext = false;
    return;
  }
  const pluginSnapshot = String(state.online.pluginId || "").trim();
  bucket.loading = true;
  bucket.errorMessage = "";
  renderGenre();
  try {
    const data = await apiWithRequest("genre-tabs", "/api/vbook/genre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plugin_id: pluginSnapshot }),
    });
    if (pluginSnapshot !== String(state.online.pluginId || "").trim()) return;
    const tabs = Array.isArray(data && data.tabs) ? data.tabs : [];
    const items = Array.isArray(data && data.items) ? data.items : [];
    setTabs(bucket, tabs);
    if (!tabs.length) {
      bucket.items = items;
    }
  } catch (error) {
    if (isAbortError(error)) return;
    bucket.errorMessage = getErrorMessage(error);
  } finally {
    if (pluginSnapshot === String(state.online.pluginId || "").trim()) {
      bucket.loading = false;
      renderGenre();
    }
  }
}

async function loadHomeItems({ page = 1, reset = false } = {}) {
  const bucket = state.online.home;
  if (!state.online.pluginId) {
    resetBucket(bucket);
    renderHome();
    return;
  }
  const tab = activeTab(bucket);
  if (!tab) {
    renderHome();
    return;
  }
  if (reset) bucket.tokenByPage = { 1: null };
  const pluginSnapshot = String(state.online.pluginId || "").trim();
  bucket.loading = true;
  bucket.errorMessage = "";
  if (reset) bucket.items = [];
  renderHome();

  const payload = {
    plugin_id: pluginSnapshot,
    tab_script: String(tab.script || "").trim(),
    tab_input: Object.prototype.hasOwnProperty.call(tab, "input") ? tab.input : null,
    page: Math.max(1, Number(page || 1)),
  };
  const token = bucketPayloadToken(bucket, payload.page);
  if (token != null && String(token).trim() !== "") payload.next = token;

  try {
    const data = await apiWithRequest("home-items", "/api/vbook/home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (pluginSnapshot !== String(state.online.pluginId || "").trim()) return;
    updateBucketByApi(bucket, data, payload.page);
  } catch (error) {
    if (isAbortError(error)) return;
    bucket.errorMessage = getErrorMessage(error);
  } finally {
    if (pluginSnapshot === String(state.online.pluginId || "").trim()) {
      bucket.loading = false;
      renderHome();
    }
  }
}

async function loadGenreItems({ page = 1, reset = false } = {}) {
  const bucket = state.online.genre;
  if (!state.online.pluginId) {
    resetBucket(bucket);
    renderGenre();
    return;
  }
  const tab = activeTab(bucket);
  if (!tab) {
    renderGenre();
    return;
  }
  if (reset) bucket.tokenByPage = { 1: null };
  const pluginSnapshot = String(state.online.pluginId || "").trim();
  bucket.loading = true;
  bucket.errorMessage = "";
  if (reset) bucket.items = [];
  renderGenre();

  const payload = {
    plugin_id: pluginSnapshot,
    tab_script: String(tab.script || "").trim(),
    tab_input: Object.prototype.hasOwnProperty.call(tab, "input") ? tab.input : null,
    page: Math.max(1, Number(page || 1)),
  };
  const token = bucketPayloadToken(bucket, payload.page);
  if (token != null && String(token).trim() !== "") payload.next = token;

  try {
    const data = await apiWithRequest("genre-items", "/api/vbook/genre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (pluginSnapshot !== String(state.online.pluginId || "").trim()) return;
    updateBucketByApi(bucket, data, payload.page);
  } catch (error) {
    if (isAbortError(error)) return;
    bucket.errorMessage = getErrorMessage(error);
  } finally {
    if (pluginSnapshot === String(state.online.pluginId || "").trim()) {
      bucket.loading = false;
      renderGenre();
    }
  }
}

async function loadSearchItems({ page = 1, reset = false } = {}) {
  const bucket = state.online.search;
  if (reset) bucket.tokenByPage = { 1: null };
  const pluginSnapshot = String(state.online.pluginId || "").trim();
  bucket.loading = true;
  bucket.errorMessage = "";
  if (reset) bucket.items = [];
  renderSearch();

  if (!state.query || !state.online.pluginId) {
    bucket.items = [];
    bucket.page = 1;
    bucket.hasNext = false;
    bucket.loading = false;
    renderSearch();
    return;
  }

  const payload = {
    plugin_id: state.online.pluginId,
    query: state.query,
    page: Math.max(1, Number(page || 1)),
  };
  const token = bucketPayloadToken(bucket, payload.page);
  if (token != null && String(token).trim() !== "") payload.next = token;

  try {
    const data = await apiWithRequest("search-items", "/api/vbook/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (pluginSnapshot !== String(state.online.pluginId || "").trim()) return;
    updateBucketByApi(bucket, data, payload.page);
  } catch (error) {
    if (isAbortError(error)) return;
    bucket.errorMessage = getErrorMessage(error);
  } finally {
    if (pluginSnapshot === String(state.online.pluginId || "").trim()) {
      bucket.loading = false;
      renderSearch();
    }
  }
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
    author: String(detail.author || item.author || "").trim(),
    cover_url: String(detail.cover || item.cover || "").trim(),
  };
  const chapterUrlText = String(chapterUrl || state.detail.lastReadChapterUrl || "").trim();
  const chapterTitleText = String(chapterTitle || state.detail.lastReadChapterTitle || "").trim();
  const ratio = parseRatio(chapterRatio != null ? chapterRatio : state.detail.lastReadRatio);
  if (chapterUrlText) payload.last_read_chapter_url = chapterUrlText;
  if (chapterTitleText) payload.last_read_chapter_title = chapterTitleText;
  if (ratio != null) payload.last_read_ratio = ratio;

  try {
    await apiWithRequest("history-upsert", "/api/library/history/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Không chặn UX khi chỉ lỗi phần ghi lịch sử.
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
  if (state.detail.selectedChapterTitle) {
    state.detail.lastReadChapterTitle = state.detail.selectedChapterTitle;
  }
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
  if (state.genreModal.loading) {
    refs.vbookGenreEmpty.textContent = state.shell.t("statusLoadingVbookGenre");
  } else if (state.genreModal.errorMessage) {
    refs.vbookGenreEmpty.textContent = state.genreModal.errorMessage;
  } else {
    refs.vbookGenreEmpty.textContent = state.shell.t("vbookGenreEmpty");
  }
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
    if (isAbortError(error)) return;
    state.genreModal.items = [];
    state.genreModal.errorMessage = getErrorMessage(error);
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
  const title = String(detail.title || detail.name || "").trim() || "Không tiêu đề";
  const author = String(detail.author || "").trim() || "Khuyết danh";
  const desc = String(detail.description || "").trim() || state.shell.t("vbookDetailNoDescription");
  const cover = String(detail.cover || "").trim();
  const statusText = String(detail.status_text || "").trim();
  const genres = Array.isArray(detail.genres) ? detail.genres : [];
  const extras = Array.isArray(detail.extra_fields) ? detail.extra_fields : [];
  const suggests = Array.isArray(detail.suggest_items) ? detail.suggest_items : [];
  const comments = Array.isArray(detail.comment_items) ? detail.comment_items : [];

  refs.vbookDetailTitle.textContent = normalizeDisplayTitle(title);
  refs.vbookDetailAuthor.textContent = author;
  refs.vbookDetailDesc.textContent = desc;
  refs.vbookDetailStatus.textContent = statusText;
  refs.vbookDetailStatus.classList.toggle("hidden", !statusText);

  if (loading) {
    refs.vbookDetailSubtitle.textContent = state.shell.t("statusLoadingVbookDetail");
  } else if (detailError) {
    refs.vbookDetailSubtitle.textContent = detailError;
  } else {
    refs.vbookDetailSubtitle.textContent = state.shell.t("vbookDetailSubtitle");
  }

  refs.btnVbookDetailLoadToc.textContent = state.detail.tocVisible
    ? state.shell.t("vbookDetailHideToc")
    : state.shell.t("vbookDetailShowToc");
  const actionBusy = String(state.detail.actionBusy || "").trim();
  const isBusy = actionBusy !== "";
  refs.btnVbookDetailLoadToc.disabled = loading || state.detail.tocLoading || isBusy;
  refs.btnVbookDetailReadNow.disabled = loading || isBusy;
  refs.btnVbookDetailImport.disabled = loading || isBusy;
  refs.btnVbookDetailReadNow.textContent = actionBusy === "read"
    ? state.shell.t("vbookOpeningReaderAction")
    : state.shell.t("vbookDetailReadNow");
  refs.btnVbookDetailImport.textContent = actionBusy === "import"
    ? state.shell.t("vbookImportingAction")
    : state.shell.t("vbookSearchImportBook");

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
  if (loading) {
    refs.vbookDetailGenresEmpty.textContent = state.shell.t("statusLoadingVbookDetail");
  } else if (detailError) {
    refs.vbookDetailGenresEmpty.textContent = detailError;
  } else if (!genres.length) {
    refs.vbookDetailGenresEmpty.textContent = state.shell.t("vbookDetailGenresEmpty");
  } else {
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
  if (loading) {
    refs.vbookDetailExtraEmpty.textContent = state.shell.t("statusLoadingVbookDetail");
  } else if (detailError) {
    refs.vbookDetailExtraEmpty.textContent = detailError;
  } else if (!extras.length) {
    refs.vbookDetailExtraEmpty.textContent = state.shell.t("vbookDetailExtraEmpty");
  } else {
    refs.vbookDetailExtraEmpty.textContent = "";
    for (const row of extras) {
      const item = document.createElement("article");
      item.className = "vbook-detail-extra-item";
      const key = document.createElement("h5");
      key.className = "vbook-detail-extra-key";
      key.textContent = String((row && row.key) || "").trim();
      const value = document.createElement("pre");
      value.className = "vbook-detail-extra-value";
      value.textContent = String((row && row.value) || "").trim();
      item.append(key, value);
      refs.vbookDetailExtraList.appendChild(item);
    }
  }

  refs.vbookDetailSuggestCount.textContent = state.shell.t("vbookDetailCount", { count: loading ? 0 : suggests.length });
  refs.vbookDetailSuggestList.innerHTML = "";
  if (loading) {
    refs.vbookDetailSuggestEmpty.textContent = state.shell.t("statusLoadingVbookDetail");
  } else if (detailError) {
    refs.vbookDetailSuggestEmpty.textContent = detailError;
  } else if (!suggests.length) {
    refs.vbookDetailSuggestEmpty.textContent = state.shell.t("vbookDetailSuggestEmpty");
  } else {
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
      const subAuthor = String((row && row.author) || "").trim();
      if (subAuthor) subParts.push(subAuthor);
      const subHost = String((row && row.host) || "").trim();
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
          title: String((row && row.title) || "").trim(),
          author: String((row && row.author) || "").trim(),
          description: String((row && row.description) || "").trim(),
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
  if (loading) {
    refs.vbookDetailCommentEmpty.textContent = state.shell.t("statusLoadingVbookDetail");
  } else if (detailError) {
    refs.vbookDetailCommentEmpty.textContent = detailError;
  } else if (!comments.length) {
    refs.vbookDetailCommentEmpty.textContent = state.shell.t("vbookDetailCommentEmpty");
  } else {
    refs.vbookDetailCommentEmpty.textContent = "";
    for (const row of comments) {
      const li = document.createElement("li");
      const box = document.createElement("article");
      box.className = "vbook-detail-comment-item";
      const head = document.createElement("div");
      head.className = "vbook-detail-comment-head";
      const user = document.createElement("span");
      user.className = "vbook-detail-comment-author";
      user.textContent = String((row && row.author) || "").trim() || state.shell.t("vbookDetailCommentGuest");
      const when = document.createElement("span");
      when.className = "vbook-detail-comment-time";
      when.textContent = String((row && row.time) || "").trim();
      head.append(user, when);
      const content = document.createElement("p");
      content.className = "vbook-detail-comment-content";
      content.textContent = String((row && row.content) || "").trim();
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
      if (chapterUrl && chapterUrl === String(state.detail.selectedChapterUrl || "").trim()) {
        btn.classList.add("active");
      }
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
      if (matched) {
        state.detail.lastReadChapterTitle = String((matched && matched.title) || "").trim();
      }
    }
    const preferred = getPreferredDetailChapter();
    if (preferred) {
      setSelectedDetailChapter(preferred.url, preferred.title);
    }
  } catch (error) {
    if (isAbortError(error)) return;
    state.detail.toc = [];
    state.detail.tocLoaded = false;
    state.detail.tocError = getErrorMessage(error);
  } finally {
    state.detail.tocLoading = false;
    renderVbookDetail();
  }
}

async function openDetailDialog(item, options = {}) {
  const openOptions = options && typeof options === "object" ? options : {};
  state.detail.item = item;
  state.detail.loading = true;
  state.detail.errorMessage = "";
  state.detail.detail = {
    title: item.title || "",
    author: item.author || "",
    description: item.description || "",
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
    const detail = (data && data.detail) || {};
    if (detail && typeof detail === "object") {
      state.detail.detail = detail;
    }
    const plugin = (data && data.plugin) || {};
    if (plugin && plugin.plugin_id) {
      state.detail.pluginId = String(plugin.plugin_id || "").trim();
    }
    state.detail.loading = false;
    await upsertHistoryFromDetail({
      chapterUrl: state.detail.lastReadChapterUrl,
      chapterTitle: state.detail.lastReadChapterTitle,
      chapterRatio: state.detail.lastReadRatio,
    });
  } catch (error) {
    if (isAbortError(error)) return;
    state.detail.loading = false;
    state.detail.errorMessage = getErrorMessage(error);
    showToastError(error);
  } finally {
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
  const activeDetailSource = String(
    ((state.detail.detail && state.detail.detail.url) || (state.detail.item && state.detail.item.detail_url) || ""),
  ).trim();
  const busyAction = openReader ? "read" : "import";
  const shouldRenderBusy = Boolean(activeDetailSource && activeDetailSource === sourceUrl);

  if (shouldRenderBusy) {
    state.detail.errorMessage = "";
    state.detail.actionBusy = busyAction;
    renderVbookDetail();
  }
  state.shell.showStatus(
    state.shell.t(openReader ? "statusOpeningReaderFromOnline" : "statusAddingBookToLibrary"),
  );
  try {
    const data = await apiWithRequest("import-url", "/api/library/import-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: sourceUrl,
        plugin_id: pluginId,
      }),
    });
    let importedBook = (data && data.book && typeof data.book === "object") ? data.book : null;
    let bookId = String((importedBook && importedBook.book_id) || "").trim();

    if (!bookId) {
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
        // fallback giữ danh sách rỗng, reader vẫn mở được
      }
    }

    const preferred = getPreferredDetailChapter();
    const selectedUrl = String((preferred && preferred.url) || state.detail.selectedChapterUrl || "").trim();
    const matchedChapter = chapters.find(
      (row) => String((row && row.remote_url) || "").trim() === selectedUrl,
    ) || chapters[0];
    const chapterId = String((matchedChapter && matchedChapter.chapter_id) || "").trim();
    if (chapterId) {
      try {
        await apiWithRequest(`book-progress-${bookId}`, `/api/library/book/${encodeURIComponent(bookId)}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapter_id: chapterId,
            ratio: 0,
            mode: "raw",
          }),
        });
      } catch {
        // Không chặn mở reader nếu chỉ lỗi lưu tiến độ.
      }
    }
    window.location.href = `/reader?book_id=${encodeURIComponent(bookId)}`;
  } catch (error) {
    if (shouldRenderBusy && !isAbortError(error)) {
      state.detail.errorMessage = getErrorMessage(error);
    }
    showToastError(error);
  } finally {
    state.detail.actionBusy = "";
    if (shouldRenderBusy) {
      renderVbookDetail();
    }
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

async function autoOpenDetailFromQuery() {
  const sourceUrl = String(state.autoOpen.sourceUrl || "").trim();
  if (!sourceUrl) return;

  const pluginId = String(state.autoOpen.pluginId || "").trim();
  const seedItem = {
    title: sourceUrl,
    author: "",
    description: "",
    cover: "",
    detail_url: sourceUrl,
    plugin_id: pluginId,
  };
  await openDetailDialog(seedItem, {
    chapterUrl: state.autoOpen.chapterUrl,
    chapterTitle: state.autoOpen.chapterTitle,
    chapterRatio: state.autoOpen.chapterRatio,
  });
  state.autoOpen = {
    sourceUrl: "",
    pluginId: "",
    chapterUrl: "",
    chapterTitle: "",
    chapterRatio: null,
  };
  updateQueryUrl();
}

async function reloadHomeAndGenre() {
  if (!state.online.pluginId) {
    renderAll();
    return;
  }
  if (pluginSupports("home")) {
    state.shell.showStatus(state.shell.t("statusLoadingVbookHome"));
    try {
      await loadHomeTabs();
      if (activeTab(state.online.home)) {
        await loadHomeItems({ page: 1, reset: true });
      }
    } catch (error) {
      showToastError(error);
    } finally {
      state.shell.hideStatus();
    }
  } else {
    setTabs(state.online.home, []);
    state.online.home.items = [];
    state.online.home.hasNext = false;
  }

  if (pluginSupports("genre")) {
    state.shell.showStatus(state.shell.t("statusLoadingVbookGenre"));
    try {
      await loadGenreTabs();
      // Genre chỉ nạp truyện khi user nhấn tab.
    } catch (error) {
      showToastError(error);
    } finally {
      state.shell.hideStatus();
    }
  } else {
    setTabs(state.online.genre, []);
    state.online.genre.items = [];
    state.online.genre.hasNext = false;
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

async function applyPluginSelection(token) {
  try {
    await reloadHomeAndGenre();
    if (token !== state.pluginSwitchToken) return;
    await Promise.all([
      loadSearchItems({ page: 1, reset: true }),
      loadPluginSettings(),
    ]);
  } catch (error) {
    showToastError(error);
  } finally {
    if (token === state.pluginSwitchToken) {
      renderAll();
    }
  }
}

async function init() {
  state.shell = await initShell({
    page: "explore",
    onSearchSubmit: (q) => runSearch(q, { updateUrl: true }),
  });

  refs.exploreTitle.textContent = state.shell.t("exploreTitle");
  refs.vbookPluginLabel.textContent = state.shell.t("vbookSearchPluginLabel");
  refs.btnVbookSearchRun.textContent = state.shell.t("vbookSearchRun");
  refs.btnVbookSearchReset.textContent = state.shell.t("vbookSearchReset");
  refs.btnExploreTogglePlugin.textContent = state.shell.t("exploreShowPluginPanel");
  refs.btnExploreLoadHome.textContent = state.shell.t("exploreLoadHome");
  refs.btnExploreLoadGenre.textContent = state.shell.t("exploreLoadGenre");
  refs.explorePluginTitle.textContent = state.shell.t("explorePluginInfoEmpty");
  refs.explorePluginVersion.textContent = "";
  refs.explorePluginAuthorLabel.textContent = state.shell.t("explorePluginAuthor");
  refs.explorePluginTypeLabel.textContent = state.shell.t("explorePluginType");
  refs.explorePluginLocaleLabel.textContent = state.shell.t("explorePluginLocale");
  refs.explorePluginSourceLabel.textContent = state.shell.t("explorePluginSource");
  refs.explorePluginDescriptionLabel.textContent = state.shell.t("explorePluginDescription");
  refs.explorePluginSettingsTitle.textContent = state.shell.t("explorePluginSettingsTitle");
  refs.explorePluginDelayLabel.textContent = state.shell.t("vbookPluginDelayLabel");
  refs.explorePluginThreadsLabel.textContent = state.shell.t("vbookPluginThreadsLabel");
  refs.explorePluginPrefetchLabel.textContent = state.shell.t("vbookPluginPrefetchLabel");
  refs.explorePluginSupplementalLabel.textContent = state.shell.t("vbookPluginSupplementalLabel");
  refs.explorePluginSettingsHint.textContent = state.shell.t("vbookPluginFallbackHint");
  refs.btnExplorePluginSettingsLoad.textContent = state.shell.t("vbookReloadSettings");
  refs.btnExplorePluginSettingsSave.textContent = state.shell.t("vbookSavePluginSettings");
  refs.btnExplorePluginSettingsClear.textContent = state.shell.t("vbookClearPluginSettings");

  refs.exploreHomeTitle.textContent = state.shell.t("exploreHomeTitle");
  refs.exploreGenreTitle.textContent = state.shell.t("exploreGenreTitle");
  refs.exploreSearchTitle.textContent = state.shell.t("exploreSearchTitle");
  refs.btnExploreHomePrev.textContent = state.shell.t("tocPrev");
  refs.btnExploreHomeNext.textContent = state.shell.t("tocNext");
  refs.btnExploreGenrePrev.textContent = state.shell.t("tocPrev");
  refs.btnExploreGenreNext.textContent = state.shell.t("tocNext");
  refs.btnExploreSearchPrev.textContent = state.shell.t("tocPrev");
  refs.btnExploreSearchNext.textContent = state.shell.t("tocNext");

  refs.vbookDetailDialogTitle.textContent = state.shell.t("vbookDetailDialogTitle");
  refs.btnVbookDetailClose.textContent = state.shell.t("close");
  refs.btnVbookDetailLoadToc.textContent = state.shell.t("vbookDetailShowToc");
  refs.btnVbookDetailImport.textContent = state.shell.t("vbookSearchImportBook");
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
  renderPluginSection();

  const queryParams = state.shell.parseQuery();
  state.query = String(queryParams.q || "").trim();
  state.online.pluginId = String(queryParams.vpid || "").trim();
  state.autoOpen.sourceUrl = String(queryParams.open_url || "").trim();
  state.autoOpen.pluginId = String(queryParams.vpid || "").trim();
  state.autoOpen.chapterUrl = String(queryParams.chapter_url || "").trim();
  state.autoOpen.chapterTitle = String(queryParams.chapter_title || "").trim();
  state.autoOpen.chapterRatio = parseRatio(queryParams.chapter_ratio);
  if (refs.searchInput) refs.searchInput.value = state.query;

  try {
    await loadVbookPlugins();
    await reloadHomeAndGenre();
    await loadSearchItems({ page: 1, reset: true });
    await loadPluginSettings();
  } catch (error) {
    showToastError(error);
  }
  renderAll();

  if (state.autoOpen.sourceUrl) {
    await autoOpenDetailFromQuery();
  }

  refs.vbookPluginSelect.addEventListener("change", async () => {
    abortExploreRequests();
    state.online.pluginId = String(refs.vbookPluginSelect.value || "").trim();
    state.pluginSwitchToken += 1;
    const token = state.pluginSwitchToken;
    state.online.home = createHomeBucket();
    state.online.genre = createGenreBucket();
    state.online.search = createSearchBucket();
    resetDetailForPluginSwitch();
    updateQueryUrl();
    renderAll();
    await applyPluginSelection(token);
  });

  refs.btnExplorePluginSettingsLoad.addEventListener("click", async () => {
    await loadPluginSettings();
  });

  refs.btnExplorePluginSettingsSave.addEventListener("click", async () => {
    await savePluginSettings();
  });

  refs.btnExplorePluginSettingsClear.addEventListener("click", async () => {
    await clearPluginSettings();
  });

  refs.btnExploreTogglePlugin.addEventListener("click", () => {
    state.pluginPanelVisible = !state.pluginPanelVisible;
    renderPluginPanelVisibility();
  });

  refs.btnVbookSearchRun.addEventListener("click", async () => {
    await runSearch(getCurrentQuery(), { updateUrl: true });
  });

  refs.btnVbookSearchReset.addEventListener("click", async () => {
    state.query = "";
    if (refs.searchInput) refs.searchInput.value = "";
    state.online.search = createSearchBucket();
    updateQueryUrl();
    renderSearch();
  });

  refs.btnExploreLoadHome.addEventListener("click", async () => {
    if (!pluginSupports("home")) return;
    state.shell.showStatus(state.shell.t("statusLoadingVbookHome"));
    try {
      await loadHomeTabs();
      if (activeTab(state.online.home)) {
        await loadHomeItems({ page: 1, reset: true });
      }
      renderHome();
    } catch (error) {
      showToastError(error);
    } finally {
      state.shell.hideStatus();
    }
  });

  refs.btnExploreLoadGenre.addEventListener("click", async () => {
    if (!pluginSupports("genre")) return;
    state.shell.showStatus(state.shell.t("statusLoadingVbookGenre"));
    try {
      await loadGenreTabs();
      // Chỉ nạp tabs thể loại, chưa nạp truyện.
      renderGenre();
    } catch (error) {
      showToastError(error);
    } finally {
      state.shell.hideStatus();
    }
  });

  refs.btnExploreHomePrev.addEventListener("click", async () => {
    const nextPage = Math.max(1, state.online.home.page - 1);
    if (nextPage === state.online.home.page) return;
    state.shell.showStatus(state.shell.t("statusLoadingVbookHome"));
    try {
      await loadHomeItems({ page: nextPage, reset: false });
    } catch (error) {
      showToastError(error);
    } finally {
      state.shell.hideStatus();
    }
  });

  refs.btnExploreHomeNext.addEventListener("click", async () => {
    if (!state.online.home.hasNext) return;
    state.shell.showStatus(state.shell.t("statusLoadingVbookHome"));
    try {
      await loadHomeItems({ page: state.online.home.page + 1, reset: false });
    } catch (error) {
      showToastError(error);
    } finally {
      state.shell.hideStatus();
    }
  });

  refs.btnExploreGenrePrev.addEventListener("click", async () => {
    const nextPage = Math.max(1, state.online.genre.page - 1);
    if (nextPage === state.online.genre.page) return;
    state.shell.showStatus(state.shell.t("statusLoadingVbookGenre"));
    try {
      await loadGenreItems({ page: nextPage, reset: false });
    } catch (error) {
      showToastError(error);
    } finally {
      state.shell.hideStatus();
    }
  });

  refs.btnExploreGenreNext.addEventListener("click", async () => {
    if (!state.online.genre.hasNext) return;
    state.shell.showStatus(state.shell.t("statusLoadingVbookGenre"));
    try {
      await loadGenreItems({ page: state.online.genre.page + 1, reset: false });
    } catch (error) {
      showToastError(error);
    } finally {
      state.shell.hideStatus();
    }
  });

  refs.btnExploreSearchPrev.addEventListener("click", async () => {
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

  refs.btnExploreSearchNext.addEventListener("click", async () => {
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
