import { t } from "../i18n.vi.js?v=20260221-vb27";

const SETTINGS_KEY = "reader.ui.settings.v3";
const THEME_CACHE_KEY = "reader.ui.theme.cache.v1";
const DEFAULT_SETTINGS = {
  themeId: "sao_dem",
  fontFamily: "'Noto Serif', 'Palatino Linotype', 'Times New Roman', serif",
  fontSize: 21,
  textAlign: "justify",
  lineHeight: 1.9,
  paragraphSpacing: 1.1,
  readingMode: "hybrid",
  panelTransparency: "clear",
  starStyle: "classic",
  backgroundMotion: "on",
  miniBarsEnabled: true,
  translationEnabled: true,
  translationMode: "server",
};

const LOCAL_TRANSLATION_DEFAULT = {
  split_mode: 0,
  name_vietphrase_priority: 0,
  personal_general_priority: 0,
  vp_priority: 1,
  luat_nhan_mode: 1,
  max_phrase_size: 12,
  convert_simplified: false,
  short_mode: true,
  use_pronouns: true,
  use_luat_nhan: true,
};

const FONT_PRESETS = [
  { id: "serif", text: "'Noto Serif', 'Palatino Linotype', 'Times New Roman', serif", labelKey: "fontPresetSerif" },
  { id: "sans", text: "'Be Vietnam Pro', 'Segoe UI', Tahoma, sans-serif", labelKey: "fontPresetSans" },
  { id: "book", text: "'Merriweather', 'Noto Serif', serif", labelKey: "fontPresetBook" },
  { id: "mono", text: "'JetBrains Mono', 'Fira Code', monospace", labelKey: "fontPresetMono" },
];

const EFFECT_CLASSES = ["effect-stars", "effect-sparkle", "effect-bubbles", "effect-leaves", "effect-snow"];
const STAR_STYLE_CLASSES = ["star-style-classic", "star-style-dense", "star-style-bling"];
const PANEL_STYLE_CLASSES = ["panel-style-clear", "panel-style-balanced", "panel-style-solid"];
let cacheManagerUi = null;

function qs(id) {
  return document.getElementById(id);
}

function parseQuery() {
  const out = {};
  const params = new URLSearchParams(window.location.search);
  for (const [k, v] of params.entries()) {
    out[k] = v;
  }
  return out;
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadThemeCache() {
  try {
    const raw = localStorage.getItem(THEME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.id || !parsed.tokens || typeof parsed.tokens !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveThemeCache(theme) {
  try {
    const safe = {
      id: String(theme.id || "sao_dem"),
      effect: String(theme.effect || "stars"),
      tokens: theme.tokens || {},
      name: String(theme.name || ""),
    };
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(safe));
  } catch {
    // ignore
  }
}

function emitSettingsChanged(settings) {
  window.dispatchEvent(new CustomEvent("reader-settings-changed", { detail: { ...settings } }));
}

function emitCacheChanged(detail = {}) {
  window.dispatchEvent(new CustomEvent("reader-cache-changed", { detail: { ...(detail || {}) } }));
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
    const baseMessage = (payload && payload.message) || `HTTP ${res.status}`;
    const err = new Error(baseMessage);
    err.status = res.status;
    err.errorCode = payload && payload.error_code;
    err.traceId = payload && payload.trace_id;
    err.details = payload && payload.details;
    let detailText = "";
    if (typeof err.details === "string") {
      detailText = err.details.trim();
    } else if (err.details && typeof err.details === "object") {
      try {
        detailText = JSON.stringify(err.details, null, 2);
      } catch {
        detailText = String(err.details);
      }
    } else if (err.details != null) {
      detailText = String(err.details);
    }
    err.displayMessage = detailText ? `${baseMessage}\n${detailText}` : baseMessage;
    throw err;
  }
  return payload;
}

function showToast(msg) {
  const toast = qs("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function showStatus(msg) {
  const bar = qs("status-inline");
  if (!bar) return;
  bar.textContent = msg || "";
  bar.classList.toggle("active", Boolean(msg));
  bar.setAttribute("aria-busy", msg ? "true" : "false");
}

function hideStatus() {
  const bar = qs("status-inline");
  if (!bar) return;
  bar.textContent = "";
  bar.classList.remove("active");
  bar.setAttribute("aria-busy", "false");
}

function applyReaderVars(settings) {
  const root = document.documentElement;
  root.style.setProperty("--reader-font-family", settings.fontFamily);
  root.style.setProperty("--reader-font-size", `${settings.fontSize}px`);
  root.style.setProperty("--reader-line-height", `${settings.lineHeight}`);
  root.style.setProperty("--reader-paragraph-spacing", `${settings.paragraphSpacing}em`);
  root.style.setProperty("--reader-text-align", settings.textAlign);
}

function normalizePanelTransparency(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "clear" || v === "balanced" || v === "solid") return v;
  return "balanced";
}

function normalizeTranslationMode(value) {
  const mode = String(value || "").trim().toLowerCase();
  if (mode === "local") return "local";
  if (mode === "hanviet") return "hanviet";
  return "server";
}

function normalizeLocalTranslationSettings(raw) {
  const src = (raw && typeof raw === "object") ? raw : {};
  const toInt = (value, fallback, min, max) => {
    const n = Number.parseInt(String(value ?? ""), 10);
    if (!Number.isFinite(n)) return fallback;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  };
  const toBool = (value, fallback) => {
    if (typeof value === "boolean") return value;
    const txt = String(value ?? "").trim().toLowerCase();
    if (!txt) return fallback;
    if (["1", "true", "yes", "on", "enabled"].includes(txt)) return true;
    if (["0", "false", "no", "off", "disabled"].includes(txt)) return false;
    return fallback;
  };
  return {
    split_mode: toInt(src.split_mode, LOCAL_TRANSLATION_DEFAULT.split_mode, 0, 1),
    name_vietphrase_priority: toInt(src.name_vietphrase_priority, LOCAL_TRANSLATION_DEFAULT.name_vietphrase_priority, 0, 1),
    personal_general_priority: toInt(src.personal_general_priority, LOCAL_TRANSLATION_DEFAULT.personal_general_priority, 0, 1),
    vp_priority: toInt(src.vp_priority, LOCAL_TRANSLATION_DEFAULT.vp_priority, 0, 3),
    luat_nhan_mode: toInt(src.luat_nhan_mode, LOCAL_TRANSLATION_DEFAULT.luat_nhan_mode, 0, 3),
    max_phrase_size: toInt(src.max_phrase_size, LOCAL_TRANSLATION_DEFAULT.max_phrase_size, 2, 24),
    convert_simplified: toBool(src.convert_simplified, LOCAL_TRANSLATION_DEFAULT.convert_simplified),
    short_mode: toBool(src.short_mode, LOCAL_TRANSLATION_DEFAULT.short_mode),
    use_pronouns: toBool(src.use_pronouns, LOCAL_TRANSLATION_DEFAULT.use_pronouns),
    use_luat_nhan: toBool(src.use_luat_nhan, LOCAL_TRANSLATION_DEFAULT.use_luat_nhan),
    // Extra dictionaries bị tắt theo pipeline local mới.
    use_vp_global: true,
    use_name_global: true,
    use_name_extra: false,
    use_vp_genre: false,
  };
}

function applyPanelStyle(settings) {
  const style = normalizePanelTransparency(settings.panelTransparency);
  settings.panelTransparency = style;
  document.documentElement.classList.remove(...PANEL_STYLE_CLASSES);
  document.body.classList.remove(...PANEL_STYLE_CLASSES);
  document.documentElement.classList.add(`panel-style-${style}`);
  document.body.classList.add(`panel-style-${style}`);
}

function lowPowerDevice() {
  const narrow = window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return narrow || reducedMotion;
}

const MOTION_CLASSES = ["effects-paused", "effects-lite", "effects-off"];

function applyThemeClasses(target, effect, settings) {
  if (!target) return;
  target.classList.remove(...EFFECT_CLASSES);
  target.classList.add(`effect-${effect || "stars"}`);
  target.classList.remove(...STAR_STYLE_CLASSES);
  target.classList.add(`star-style-${settings.starStyle || "classic"}`);
  const motion = settings.backgroundMotion || "on";
  target.classList.remove(...MOTION_CLASSES);
  if (motion === "off") target.classList.add("effects-off");
  else if (motion === "lite") target.classList.add("effects-lite");
  // "on": no extra class — full effects
}

function applyTheme(themes, settings) {
  const theme = themes.find((x) => x.id === settings.themeId) || themes[0] || loadThemeCache();
  if (!theme) return;
  settings.themeId = theme.id;

  for (const [key, value] of Object.entries(theme.tokens || {})) {
    document.documentElement.style.setProperty(`--${String(key).split("_").join("-")}`, value);
  }

  applyThemeClasses(document.documentElement, theme.effect, settings);
  applyThemeClasses(document.body, theme.effect, settings);

  // Auto-detect: nếu user chọn "on" nhưng thiết bị yếu → tự chuyển lite (chỉ visual, không lưu setting).
  if ((settings.backgroundMotion || "on") === "on" && lowPowerDevice()) {
    document.documentElement.classList.add("effects-lite");
    document.body.classList.add("effects-lite");
  }

  saveThemeCache(theme);
}

async function persistTheme(themeId) {
  try {
    await api("/api/themes/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme_id: themeId }),
    });
  } catch {
    // ignore network issue
  }
}

function setNavActive(page) {
  const mapping = {
    library: "nav-library",
    search: "nav-search",
    explore: "nav-explore",
    book: "nav-library",
    reader: "nav-library",
  };
  const allIds = ["nav-library", "nav-search", "nav-explore"];
  for (const id of allIds) {
    const el = qs(id);
    if (el) el.classList.remove("active");
  }
  const target = qs(mapping[page] || "nav-library");
  if (target) target.classList.add("active");
}

function goSearchPage(queryText) {
  const query = String(queryText || "").trim();
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const next = params.toString() ? `/search?${params.toString()}` : "/search";
  if (`${window.location.pathname}${window.location.search}` === next) return;
  window.location.href = next;
}

async function handleImport(onImported) {
  const fileInput = qs("import-file");
  const file = fileInput && fileInput.files && fileInput.files[0];
  if (!file) return;

  const form = new FormData();
  form.set("file", file);
  form.set("lang_source", (qs("import-lang") && qs("import-lang").value) || "zh");
  form.set("title", (qs("import-book-title") && qs("import-book-title").value) || "");
  form.set("author", (qs("import-author") && qs("import-author").value) || "");

  showStatus(t("statusImporting"));
  try {
    const data = await api("/api/library/import", { method: "POST", body: form });
    if (qs("import-form")) qs("import-form").reset();
    if (qs("import-dialog") && qs("import-dialog").open) qs("import-dialog").close();
    showToast(t("toastImportSuccess"));
    if (typeof onImported === "function") {
      onImported(data);
    }
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

async function handleImportUrl(onImported) {
  const input = qs("import-url-input");
  const url = input ? String(input.value || "").trim() : "";
  if (!url) return;
  const pluginSelect = qs("import-url-plugin");
  const pluginId = pluginSelect ? String(pluginSelect.value || "").trim() : "";

  showStatus(t("statusImportingUrl"));
  try {
    const data = await api("/api/library/import-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, plugin_id: pluginId || "" }),
    });
    if (qs("import-url-form")) qs("import-url-form").reset();
    if (qs("import-url-dialog") && qs("import-url-dialog").open) qs("import-url-dialog").close();
    showToast(t("toastImportSuccess"));
    if (typeof onImported === "function") {
      onImported(data);
    }
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

function formatBytes(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = n;
  let idx = 0;
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024;
    idx += 1;
  }
  const digits = size >= 100 ? 0 : (size >= 10 ? 1 : 2);
  return `${size.toFixed(digits)} ${units[idx]}`;
}

function ensureCacheManagerUi() {
  if (cacheManagerUi) return cacheManagerUi;
  const dialog = document.createElement("dialog");
  dialog.id = "cache-manager-dialog";
  dialog.className = "dialog cache-manager-dialog";
  dialog.innerHTML = `
    <div class="dialog-head">
      <h3 id="cache-manager-title"></h3>
      <button id="btn-cache-manager-close" class="btn btn-small" type="button"></button>
    </div>
    <p id="cache-manager-global-stats" class="empty-text"></p>
    <div class="cover-btns cache-manager-actions">
      <button id="btn-cache-manager-refresh" class="btn btn-small" type="button"></button>
      <button id="btn-cache-manager-clear-global-trans" class="btn btn-small" type="button"></button>
    </div>
    <div class="cover-btns cache-manager-actions">
      <label class="cache-manager-select-all">
        <input id="cache-manager-select-all" type="checkbox">
        <span id="cache-manager-select-all-label"></span>
      </label>
      <button id="btn-cache-manager-clear-raw" class="btn btn-small" type="button"></button>
      <button id="btn-cache-manager-clear-trans" class="btn btn-small" type="button"></button>
      <button id="btn-cache-manager-clear-images" class="btn btn-small" type="button"></button>
      <button id="btn-cache-manager-clear-all" class="btn btn-small" type="button"></button>
    </div>
    <div id="cache-manager-list" class="cache-manager-list"></div>
    <p id="cache-manager-empty" class="empty-text hidden"></p>
  `;
  document.body.appendChild(dialog);

  const refs = {
    dialog,
    title: dialog.querySelector("#cache-manager-title"),
    btnClose: dialog.querySelector("#btn-cache-manager-close"),
    globalStats: dialog.querySelector("#cache-manager-global-stats"),
    btnRefresh: dialog.querySelector("#btn-cache-manager-refresh"),
    btnClearGlobalTrans: dialog.querySelector("#btn-cache-manager-clear-global-trans"),
    selectAll: dialog.querySelector("#cache-manager-select-all"),
    selectAllLabel: dialog.querySelector("#cache-manager-select-all-label"),
    btnClearRaw: dialog.querySelector("#btn-cache-manager-clear-raw"),
    btnClearTrans: dialog.querySelector("#btn-cache-manager-clear-trans"),
    btnClearImages: dialog.querySelector("#btn-cache-manager-clear-images"),
    btnClearAll: dialog.querySelector("#btn-cache-manager-clear-all"),
    list: dialog.querySelector("#cache-manager-list"),
    empty: dialog.querySelector("#cache-manager-empty"),
  };
  cacheManagerUi = {
    refs,
    books: [],
    selected: new Set(),
  };

  refs.title.textContent = t("cacheManagerTitle");
  refs.btnClose.textContent = t("close");
  refs.btnRefresh.textContent = t("cacheManagerRefresh");
  refs.btnClearGlobalTrans.textContent = t("cacheManagerClearGlobalTrans");
  refs.selectAllLabel.textContent = t("cacheManagerSelectAll");
  refs.btnClearRaw.textContent = t("cacheManagerClearRaw");
  refs.btnClearTrans.textContent = t("cacheManagerClearTrans");
  refs.btnClearImages.textContent = t("cacheManagerClearImages");
  refs.btnClearAll.textContent = t("cacheManagerClearAll");
  refs.empty.textContent = t("cacheManagerEmpty");

  refs.btnClose.addEventListener("click", () => {
    if (dialog.open) dialog.close();
  });
  refs.selectAll.addEventListener("change", () => {
    const checked = Boolean(refs.selectAll.checked);
    cacheManagerUi.selected.clear();
    if (checked) {
      for (const row of cacheManagerUi.books) {
        const bid = String((row && row.book_id) || "").trim();
        if (bid) cacheManagerUi.selected.add(bid);
      }
    }
    renderCacheManagerList();
  });
  refs.btnRefresh.addEventListener("click", () => {
    loadCacheManagerSummary().catch(() => { });
  });
  refs.btnClearGlobalTrans.addEventListener("click", () => {
    runCacheManagerAction("clear_global_translation").catch(() => { });
  });
  refs.btnClearRaw.addEventListener("click", () => {
    runCacheManagerAction("clear_book_raw").catch(() => { });
  });
  refs.btnClearTrans.addEventListener("click", () => {
    runCacheManagerAction("clear_book_trans").catch(() => { });
  });
  refs.btnClearImages.addEventListener("click", () => {
    runCacheManagerAction("clear_book_images").catch(() => { });
  });
  refs.btnClearAll.addEventListener("click", () => {
    runCacheManagerAction("clear_book_all").catch(() => { });
  });
  return cacheManagerUi;
}

function renderCacheManagerList() {
  const ui = ensureCacheManagerUi();
  const { refs } = ui;
  refs.list.innerHTML = "";
  const books = Array.isArray(ui.books) ? ui.books : [];
  if (!books.length) {
    refs.empty.classList.remove("hidden");
    refs.selectAll.checked = false;
    return;
  }
  refs.empty.classList.add("hidden");
  let selectedCount = 0;
  for (const book of books) {
    const bid = String(book.book_id || "").trim();
    if (!bid) continue;
    if (ui.selected.has(bid)) selectedCount += 1;
    const row = document.createElement("label");
    row.className = "cache-manager-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "cache-manager-checkbox";
    checkbox.checked = ui.selected.has(bid);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) ui.selected.add(bid);
      else ui.selected.delete(bid);
      refs.selectAll.checked = ui.selected.size > 0 && ui.selected.size === books.length;
    });

    const cover = document.createElement("div");
    cover.className = "cache-book-cover";
    if (book.cover_url) {
      const img = document.createElement("img");
      img.src = String(book.cover_url);
      img.alt = String(book.title_display || book.title || "cover");
      cover.appendChild(img);
    } else {
      cover.textContent = t("noCover");
    }

    const meta = document.createElement("div");
    meta.className = "cache-book-meta";
    const title = document.createElement("div");
    title.className = "cache-book-title";
    title.textContent = String(book.title_display || book.title || "Không tiêu đề");
    const chapterLine = document.createElement("div");
    chapterLine.className = "cache-book-line";
    chapterLine.textContent = t("cacheManagerChapterLine", {
      raw: Number(book.cached_raw_chapters || 0),
      trans: Number(book.cached_trans_chapters || 0),
      total: Number(book.chapter_count || 0),
    });
    const imageLine = document.createElement("div");
    imageLine.className = "cache-book-line";
    imageLine.textContent = t("cacheManagerImageLine", {
      count: Number(book.cached_image_count || 0),
      size: formatBytes(book.image_bytes || 0),
    });
    const sizeLine = document.createElement("div");
    sizeLine.className = "cache-book-line";
    sizeLine.textContent = t("cacheManagerSizeLine", {
      raw: formatBytes(book.raw_bytes || 0),
      trans: formatBytes(book.trans_bytes || 0),
    });
    meta.append(title, chapterLine, imageLine, sizeLine);
    row.append(checkbox, cover, meta);
    refs.list.appendChild(row);
  }
  refs.selectAll.checked = books.length > 0 && selectedCount === books.length;
}

function renderCacheManagerGlobal(data) {
  const ui = ensureCacheManagerUi();
  const { refs } = ui;
  const global = (data && data.global) || {};
  refs.globalStats.textContent = t("cacheManagerGlobalLine", {
    trans_count: Number(global.translated_cache_count || 0),
    trans_size: formatBytes(global.translated_cache_bytes || 0),
    tm_count: Number(global.translation_memory_count || 0),
    unit_count: Number(global.translation_unit_map_count || 0),
  });
}

async function loadCacheManagerSummary() {
  const ui = ensureCacheManagerUi();
  showStatus(t("statusLoadingCacheManager"));
  try {
    const data = await api("/api/library/cache/summary");
    ui.books = Array.isArray(data.books) ? data.books : [];
    const valid = new Set(ui.books.map((x) => String((x && x.book_id) || "").trim()).filter(Boolean));
    ui.selected = new Set(Array.from(ui.selected).filter((x) => valid.has(x)));
    renderCacheManagerGlobal(data);
    renderCacheManagerList();
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

async function runCacheManagerAction(action) {
  const ui = ensureCacheManagerUi();
  const act = String(action || "").trim();
  const isGlobal = act === "clear_global_translation";
  const selectedBookIds = isGlobal ? [] : Array.from(ui.selected);
  if (!isGlobal && !selectedBookIds.length) {
    showToast(t("cacheManagerNeedSelect"));
    return;
  }
  if (!window.confirm(t("cacheManagerConfirmAction"))) return;
  showStatus(t("statusClearing"));
  try {
    const result = await api("/api/library/cache/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act, book_ids: selectedBookIds }),
    });
    emitCacheChanged({
      source: "cache-manager",
      action: act,
      book_ids: selectedBookIds,
      result,
    });
    showToast(t("toastCacheManagerDone"));
    await loadCacheManagerSummary();
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

async function openCacheManager() {
  const ui = ensureCacheManagerUi();
  if (!ui.refs.dialog.open) ui.refs.dialog.showModal();
  await loadCacheManagerSummary();
}

async function clearCache() {
  await openCacheManager();
}

function fillStaticTexts() {
  const pairs = [
    ["app-title", "appTitle"],
    ["app-subtitle", "appSubtitle"],
    ["nav-library", "navLibrary"],
    ["nav-search", "navSearch"],
    ["nav-explore", "navExplore"],
    ["btn-go-search", "search"],
    ["btn-import", "import"],
    ["btn-import-url", "importUrl"],
    ["btn-manage-vbook", "manageVbookSources"],
    ["btn-clear-cache", "clearCache"],
    ["btn-open-settings", "openSettings"],
    ["settings-title", "settingsTitle"],
    ["btn-close-settings", "closeSettings"],
    ["label-theme", "theme"],
    ["label-panel-transparency", "panelTransparency"],
    ["label-font-family", "fontFamily"],
    ["label-star-style", "starStyle"],
    ["label-background-motion", "backgroundMotion"],
    ["star-style-classic", "starStyleClassic"],
    ["star-style-dense", "starStyleDense"],
    ["star-style-bling", "starStyleBling"],
    ["motion-on", "motionOn"],
    ["motion-lite", "motionLite"],
    ["motion-off", "motionOff"],
    ["label-font-size", "fontSize"],
    ["label-text-align", "textAlign"],
    ["label-line-height", "lineHeight"],
    ["label-paragraph-spacing", "paragraphSpacing"],
    ["label-reading-mode", "readingMode"],
    ["mode-flip", "modeFlip"],
    ["mode-horizontal", "modeHorizontal"],
    ["mode-vertical", "modeVertical"],
    ["mode-hybrid", "modeHybrid"],
    ["label-mini-bars-enabled", "miniBarsEnabled"],
    ["mini-bars-on", "miniBarsOn"],
    ["mini-bars-off", "miniBarsOff"],
    ["label-translation-enabled", "translationEnabled"],
    ["translation-enabled-on", "translationEnabledOn"],
    ["translation-enabled-off", "translationEnabledOff"],
    ["label-translation-mode", "translationMode"],
    ["translation-mode-server", "translationModeServer"],
    ["translation-mode-local", "translationModeLocal"],
    ["translation-mode-hanviet", "translationModeHanviet"],
    ["label-local-translate-settings", "localTranslateSettings"],
    ["label-local-split-mode", "localSplitMode"],
    ["local-split-mode-punct", "localSplitModePunct"],
    ["local-split-mode-line", "localSplitModeLine"],
    ["label-local-name-vp-priority", "localNameVpPriority"],
    ["local-name-vp-priority-name-first", "localNameVpPriorityNameFirst"],
    ["local-name-vp-priority-vp-first", "localNameVpPriorityVpFirst"],
    ["label-local-personal-general-priority", "localPersonalGeneralPriority"],
    ["local-personal-general-priority-personal", "localPersonalGeneralPriorityPersonal"],
    ["local-personal-general-priority-general", "localPersonalGeneralPriorityGeneral"],
    ["label-local-vp-priority", "localVpPriority"],
    ["local-vp-priority-0", "localVpPriority0"],
    ["local-vp-priority-1", "localVpPriority1"],
    ["local-vp-priority-2", "localVpPriority2"],
    ["local-vp-priority-3", "localVpPriority3"],
    ["label-local-luat-nhan-mode", "localLuatNhanMode"],
    ["local-luat-nhan-mode-0", "localLuatNhanMode0"],
    ["local-luat-nhan-mode-1", "localLuatNhanMode1"],
    ["local-luat-nhan-mode-2", "localLuatNhanMode2"],
    ["local-luat-nhan-mode-3", "localLuatNhanMode3"],
    ["label-local-max-phrase-size", "localMaxPhraseSize"],
    ["label-local-convert-simplified", "localConvertSimplified"],
    ["local-convert-simplified-on", "localSwitchOn"],
    ["local-convert-simplified-off", "localSwitchOff"],
    ["label-local-short-mode", "localShortMode"],
    ["local-short-mode-on", "localSwitchOn"],
    ["local-short-mode-off", "localSwitchOff"],
    ["label-local-use-pronouns", "localUsePronouns"],
    ["local-use-pronouns-on", "localSwitchOn"],
    ["local-use-pronouns-off", "localSwitchOff"],
    ["label-local-use-luat-nhan", "localUseLuatNhan"],
    ["local-use-luat-nhan-on", "localSwitchOn"],
    ["local-use-luat-nhan-off", "localSwitchOff"],
    ["panel-clear", "panelClear"],
    ["panel-balanced", "panelBalanced"],
    ["panel-solid", "panelSolid"],
    ["btn-save-settings", "saveSettings"],
    ["btn-reset-settings", "resetSettings"],
    ["import-title", "importTitle"],
    ["import-file-label", "importFile"],
    ["import-lang-label", "importLang"],
    ["import-book-title-label", "importBookTitle"],
    ["import-author-label", "importAuthor"],
    ["import-lang-zh", "importLangZh"],
    ["import-lang-vi", "importLangVi"],
    ["btn-import-cancel", "cancel"],
    ["btn-import-submit", "confirmImport"],
    ["import-url-title", "importUrlTitle"],
    ["import-url-label", "importUrlLabel"],
    ["import-url-plugin-label", "importUrlPlugin"],
    ["import-url-plugin-auto", "importUrlPluginAuto"],
    ["btn-import-url-cancel", "cancel"],
    ["btn-import-url-submit", "confirmImportUrl"],
    ["vbook-manager-title", "vbookManagerTitle"],
    ["vbook-manager-hint", "vbookManagerHint"],
    ["btn-vbook-manager-close", "close"],
    ["vbook-installed-title", "vbookInstalledTitle"],
    ["btn-vbook-refresh-installed", "vbookRefreshInstalled"],
    ["btn-vbook-check-updates", "vbookCheckUpdates"],
    ["vbook-repo-title", "vbookRepoTitle"],
    ["btn-vbook-refresh-repo", "vbookRefreshRepo"],
    ["vbook-repo-label", "vbookRepoLabel"],
    ["btn-vbook-toggle-adv", "vbookRepoToggleAdv"],
    ["vbook-repo-custom-label", "vbookRepoCustomLabel"],
    ["btn-vbook-load-custom-repo", "vbookRepoCustomLoad"],
    ["btn-vbook-add-repo", "vbookRepoAdd"],
    ["btn-vbook-remove-repo", "vbookRepoRemove"],
    ["btn-vbook-save-repos", "vbookRepoSave"],
    ["vbook-plugin-url-label", "vbookPluginUrlLabel"],
    ["vbook-plugin-id-label", "vbookPluginIdLabel"],
    ["btn-vbook-install-url", "vbookInstallFromUrl"],
    ["vbook-plugin-file-label", "vbookPluginFileLabel"],
    ["vbook-plugin-id-local-label", "vbookPluginIdLocalLabel"],
    ["btn-vbook-install-local", "vbookInstallLocal"],
    ["vbook-runtime-title", "vbookRuntimeTitle"],
    ["vbook-runtime-hint", "vbookRuntimeHint"],
    ["vbook-runtime-global-title", "vbookRuntimeGlobalTitle"],
    ["vbook-global-delay-label", "vbookGlobalDelayLabel"],
    ["vbook-global-threads-label", "vbookGlobalThreadsLabel"],
    ["vbook-global-prefetch-label", "vbookGlobalPrefetchLabel"],
    ["vbook-global-retry-label", "vbookGlobalRetryLabel"],
    ["vbook-runtime-plugin-title", "vbookRuntimePluginTitle"],
    ["vbook-runtime-plugin-label", "vbookRuntimePluginLabel"],
    ["vbook-plugin-delay-label", "vbookPluginDelayLabel"],
    ["vbook-plugin-threads-label", "vbookPluginThreadsLabel"],
    ["vbook-plugin-prefetch-label", "vbookPluginPrefetchLabel"],
    ["vbook-plugin-supplemental-label", "vbookPluginSupplementalLabel"],
    ["vbook-plugin-fallback-hint", "vbookPluginFallbackHint"],
    ["btn-vbook-reload-settings", "vbookReloadSettings"],
    ["btn-vbook-save-global-settings", "vbookSaveGlobalSettings"],
    ["btn-vbook-save-plugin-settings", "vbookSavePluginSettings"],
    ["btn-vbook-clear-plugin-settings", "vbookClearPluginSettings"],
  ];
  for (const [id, key] of pairs) {
    const node = qs(id);
    if (node) node.textContent = t(key);
  }
  const search = qs("search-input");
  if (search) search.placeholder = t("searchPlaceholder");
}

export async function initShell({ page, onSearchSubmit, onImported, onSearch } = {}) {
  fillStaticTexts();
  setNavActive(page || "library");

  const state = {
    themes: [],
    settings: loadSettings(),
    readerTranslationLocal: { ...LOCAL_TRANSLATION_DEFAULT },
    vbook: {
      installed: [],
      repoUrls: [],
      repoPlugins: [],
      repoErrors: [],
      pluginUpdates: {},
      activeRepoUrl: "",
      globalSettings: {
        request_delay_ms: 0,
        download_threads: 4,
        prefetch_unread_count: 2,
        retry_count: 2,
      },
      pluginSettings: {},
      selectedRuntimePluginId: "",
    },
  };

  applyPanelStyle(state.settings);
  const cachedTheme = loadThemeCache();
  if (cachedTheme) {
    applyTheme([cachedTheme], state.settings);
  }
  applyReaderVars(state.settings);

  const themeSelect = qs("theme-select");
  const fontFamilySelect = qs("font-family-select");
  const starStyleSelect = qs("star-style-select");
  const backgroundMotionSelect = qs("background-motion-select");
  const fontSizeInput = qs("font-size-input");
  const lineHeightInput = qs("line-height-input");
  const paragraphSpacingInput = qs("paragraph-spacing-input");
  const textAlignSelect = qs("text-align-select");
  const readingModeSelect = qs("reading-mode-select");
  const panelTransparencySelect = qs("panel-transparency-select");
  const miniBarsEnabledSelect = qs("mini-bars-enabled-select");
  const translationEnabledSelect = qs("translation-enabled-select");
  const translationModeSelect = qs("translation-mode-select");
  const localSplitModeSelect = qs("local-split-mode-select");
  const localNameVpPrioritySelect = qs("local-name-vp-priority-select");
  const localPersonalGeneralPrioritySelect = qs("local-personal-general-priority-select");
  const localVpPrioritySelect = qs("local-vp-priority-select");
  const localLuatNhanModeSelect = qs("local-luat-nhan-mode-select");
  const localMaxPhraseSizeInput = qs("local-max-phrase-size-input");
  const localMaxPhraseSizeValue = qs("local-max-phrase-size-value");
  const localMaxPhraseSizeLabel = qs("label-local-max-phrase-size");
  const localConvertSimplifiedSelect = qs("local-convert-simplified-select");
  const localShortModeSelect = qs("local-short-mode-select");
  const localUsePronounsSelect = qs("local-use-pronouns-select");
  const localUseLuatNhanSelect = qs("local-use-luat-nhan-select");

  if (fontFamilySelect) {
    fontFamilySelect.innerHTML = "";
    for (const item of FONT_PRESETS) {
      const opt = document.createElement("option");
      opt.value = item.text;
      opt.textContent = t(item.labelKey);
      fontFamilySelect.appendChild(opt);
    }
    if (!FONT_PRESETS.some((x) => x.text === state.settings.fontFamily)) {
      state.settings.fontFamily = FONT_PRESETS[0].text;
    }
    fontFamilySelect.value = state.settings.fontFamily;
  }
  if (starStyleSelect) starStyleSelect.value = state.settings.starStyle || DEFAULT_SETTINGS.starStyle;
  if (backgroundMotionSelect) backgroundMotionSelect.value = state.settings.backgroundMotion || DEFAULT_SETTINGS.backgroundMotion;
  if (fontSizeInput) fontSizeInput.value = String(state.settings.fontSize);
  if (lineHeightInput) lineHeightInput.value = String(state.settings.lineHeight);
  if (paragraphSpacingInput) paragraphSpacingInput.value = String(state.settings.paragraphSpacing);
  if (textAlignSelect) textAlignSelect.value = state.settings.textAlign;
  if (readingModeSelect) readingModeSelect.value = state.settings.readingMode;
  if (panelTransparencySelect) panelTransparencySelect.value = normalizePanelTransparency(state.settings.panelTransparency);
  if (miniBarsEnabledSelect) miniBarsEnabledSelect.value = (state.settings.miniBarsEnabled === false) ? "off" : "on";
  state.settings.translationEnabled = state.settings.translationEnabled !== false;
  state.settings.translationMode = normalizeTranslationMode(state.settings.translationMode);
  if (translationEnabledSelect) translationEnabledSelect.value = state.settings.translationEnabled ? "on" : "off";
  if (translationModeSelect) translationModeSelect.value = state.settings.translationMode;
  if (qs("font-size-value")) qs("font-size-value").textContent = `${state.settings.fontSize}px`;
  if (qs("line-height-value")) qs("line-height-value").textContent = `${state.settings.lineHeight.toFixed(2)}`;
  if (qs("paragraph-spacing-value")) qs("paragraph-spacing-value").textContent = `${state.settings.paragraphSpacing.toFixed(2)}em`;

  try {
    const themesData = await api("/api/themes");
    state.themes = themesData.items || [];
    if (themeSelect) {
      themeSelect.innerHTML = "";
      for (const th of state.themes) {
        const opt = document.createElement("option");
        opt.value = th.id;
        opt.textContent = th.name;
        themeSelect.appendChild(opt);
      }
      if (!state.themes.some((x) => x.id === state.settings.themeId)) {
        state.settings.themeId = themesData.active || (state.themes[0] && state.themes[0].id) || state.settings.themeId;
      }
      themeSelect.value = state.settings.themeId;
    }
    applyTheme(state.themes, state.settings);
    saveSettings(state.settings);
    emitSettingsChanged(state.settings);
  } catch {
    // ignore
  }

  const settingsDrawer = qs("settings-drawer");
  const settingsBackdrop = qs("settings-backdrop");
  const syncBackdrop = () => {
    if (!settingsBackdrop) return;
    const tocDrawer = qs("reader-toc-drawer");
    const shouldOpen = Boolean(
      (settingsDrawer && settingsDrawer.classList.contains("open"))
      || (tocDrawer && tocDrawer.classList.contains("open"))
    );
    settingsBackdrop.hidden = !shouldOpen;
    settingsBackdrop.classList.toggle("open", shouldOpen);
  };
  const openSettings = () => {
    if (!settingsDrawer) return;
    settingsDrawer.classList.add("open");
    settingsDrawer.setAttribute("aria-hidden", "false");
    syncBackdrop();
  };
  const closeSettings = () => {
    if (!settingsDrawer) return;
    settingsDrawer.classList.remove("open");
    settingsDrawer.setAttribute("aria-hidden", "true");
    syncBackdrop();
  };
  syncBackdrop();

  const syncLocalMaxPhraseSizeValue = (rawValue) => {
    let value = Number.parseInt(String(rawValue ?? ""), 10);
    if (!Number.isFinite(value)) {
      value = Number.parseInt(String(localMaxPhraseSizeInput && localMaxPhraseSizeInput.value), 10);
    }
    if (!Number.isFinite(value)) {
      value = LOCAL_TRANSLATION_DEFAULT.max_phrase_size;
    }
    const unitLabel = t("localMaxPhraseUnit") || "ký tự";
    if (localMaxPhraseSizeValue) {
      localMaxPhraseSizeValue.textContent = `${value} ${unitLabel}`;
    }
    if (localMaxPhraseSizeLabel) {
      localMaxPhraseSizeLabel.textContent = `${t("localMaxPhraseSize")} (${value} ${unitLabel})`;
    }
  };

  const syncLocalTranslationForm = () => {
    const cfg = normalizeLocalTranslationSettings(state.readerTranslationLocal || {});
    state.readerTranslationLocal = cfg;
    if (localSplitModeSelect) localSplitModeSelect.value = String(cfg.split_mode);
    if (localNameVpPrioritySelect) localNameVpPrioritySelect.value = String(cfg.name_vietphrase_priority);
    if (localPersonalGeneralPrioritySelect) localPersonalGeneralPrioritySelect.value = String(cfg.personal_general_priority);
    if (localVpPrioritySelect) localVpPrioritySelect.value = String(cfg.vp_priority);
    if (localLuatNhanModeSelect) localLuatNhanModeSelect.value = String(cfg.luat_nhan_mode);
    if (localMaxPhraseSizeInput) localMaxPhraseSizeInput.value = String(cfg.max_phrase_size);
    syncLocalMaxPhraseSizeValue(cfg.max_phrase_size);
    if (localConvertSimplifiedSelect) localConvertSimplifiedSelect.value = cfg.convert_simplified ? "on" : "off";
    if (localShortModeSelect) localShortModeSelect.value = cfg.short_mode ? "on" : "off";
    if (localUsePronounsSelect) localUsePronounsSelect.value = cfg.use_pronouns ? "on" : "off";
    if (localUseLuatNhanSelect) localUseLuatNhanSelect.value = cfg.use_luat_nhan ? "on" : "off";
  };

  const collectLocalTranslationSettingsFromForm = () => {
    const current = normalizeLocalTranslationSettings(state.readerTranslationLocal || {});
    const parseOr = (raw, fallback, min, max) => {
      const n = Number.parseInt(String(raw ?? ""), 10);
      if (!Number.isFinite(n)) return fallback;
      if (n < min) return min;
      if (n > max) return max;
      return n;
    };
    const next = {
      ...current,
      split_mode: parseOr(localSplitModeSelect && localSplitModeSelect.value, current.split_mode, 0, 1),
      name_vietphrase_priority: parseOr(
        localNameVpPrioritySelect && localNameVpPrioritySelect.value,
        current.name_vietphrase_priority,
        0,
        1,
      ),
      personal_general_priority: parseOr(
        localPersonalGeneralPrioritySelect && localPersonalGeneralPrioritySelect.value,
        current.personal_general_priority,
        0,
        1,
      ),
      vp_priority: parseOr(localVpPrioritySelect && localVpPrioritySelect.value, current.vp_priority, 0, 3),
      luat_nhan_mode: parseOr(localLuatNhanModeSelect && localLuatNhanModeSelect.value, current.luat_nhan_mode, 0, 3),
      max_phrase_size: parseOr(localMaxPhraseSizeInput && localMaxPhraseSizeInput.value, current.max_phrase_size, 2, 24),
      convert_simplified: String((localConvertSimplifiedSelect && localConvertSimplifiedSelect.value) || "off").toLowerCase() === "on",
      short_mode: String((localShortModeSelect && localShortModeSelect.value) || "on").toLowerCase() === "on",
      use_pronouns: String((localUsePronounsSelect && localUsePronounsSelect.value) || "on").toLowerCase() === "on",
      use_luat_nhan: String((localUseLuatNhanSelect && localUseLuatNhanSelect.value) || "on").toLowerCase() === "on",
    };
    state.readerTranslationLocal = normalizeLocalTranslationSettings(next);
    return state.readerTranslationLocal;
  };

  const syncReaderTranslationForm = () => {
    state.settings.translationEnabled = state.settings.translationEnabled !== false;
    state.settings.translationMode = normalizeTranslationMode(state.settings.translationMode);
    if (translationEnabledSelect) translationEnabledSelect.value = state.settings.translationEnabled ? "on" : "off";
    if (translationModeSelect) {
      translationModeSelect.value = state.settings.translationMode;
      translationModeSelect.disabled = !state.settings.translationEnabled;
    }
    const localSection = qs("local-translation-settings");
    if (localSection) {
      localSection.hidden = !["local", "hanviet"].includes(String(state.settings.translationMode || "").toLowerCase());
    }
    syncLocalTranslationForm();
  };

  const applyReaderTranslationSettings = ({ enabled, mode, local }, { emit = true } = {}) => {
    state.settings.translationEnabled = enabled !== false;
    state.settings.translationMode = normalizeTranslationMode(mode);
    state.readerTranslationLocal = normalizeLocalTranslationSettings(local || state.readerTranslationLocal || {});
    syncReaderTranslationForm();
    saveSettings(state.settings);
    if (emit) emitSettingsChanged({ ...state.settings, translationLocal: state.readerTranslationLocal });
  };

  const persistReaderTranslationSettings = async () => {
    const localCfg = collectLocalTranslationSettingsFromForm();
    const payload = {
      translation: {
        enabled: state.settings.translationEnabled !== false,
        mode: normalizeTranslationMode(state.settings.translationMode),
        local: localCfg,
      },
    };
    const data = await api("/api/reader/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const serverTranslation = data && data.translation && typeof data.translation === "object"
      ? data.translation
      : payload.translation;
    applyReaderTranslationSettings(serverTranslation, { emit: true });
    return serverTranslation;
  };

  try {
    const readerSettings = await api("/api/reader/settings");
    const translation = readerSettings && readerSettings.translation && typeof readerSettings.translation === "object"
      ? readerSettings.translation
      : null;
    if (translation) {
      applyReaderTranslationSettings(translation, { emit: false });
    } else {
      syncReaderTranslationForm();
    }
  } catch {
    syncReaderTranslationForm();
  }

  const query = parseQuery();
  const searchInput = qs("search-input");
  const searchButton = qs("btn-go-search");
  const submitSearch = (raw) => {
    const val = String(raw || "").trim();
    if (typeof onSearchSubmit === "function") {
      onSearchSubmit(val);
      return;
    }
    if (typeof onSearch === "function") {
      onSearch(val);
      return;
    }
    goSearchPage(val);
  };

  if (searchInput) {
    if (query.q) searchInput.value = query.q;
    searchInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      submitSearch(searchInput.value);
    });
  }
  if (searchButton) {
    searchButton.addEventListener("click", () => submitSearch(searchInput ? searchInput.value : ""));
  }

  if (qs("btn-open-settings")) qs("btn-open-settings").addEventListener("click", openSettings);
  if (qs("btn-close-settings")) qs("btn-close-settings").addEventListener("click", closeSettings);
  if (settingsBackdrop) settingsBackdrop.addEventListener("click", closeSettings);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeSettings();
  });

  if (themeSelect) {
    themeSelect.addEventListener("change", async () => {
      state.settings.themeId = themeSelect.value;
      applyTheme(state.themes, state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
      await persistTheme(state.settings.themeId);
    });
  }

  if (fontFamilySelect) {
    fontFamilySelect.addEventListener("change", () => {
      state.settings.fontFamily = fontFamilySelect.value || DEFAULT_SETTINGS.fontFamily;
      applyReaderVars(state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
    });
  }

  if (starStyleSelect) {
    starStyleSelect.addEventListener("change", () => {
      state.settings.starStyle = starStyleSelect.value || DEFAULT_SETTINGS.starStyle;
      applyTheme(state.themes, state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
    });
  }

  if (backgroundMotionSelect) {
    backgroundMotionSelect.addEventListener("change", () => {
      state.settings.backgroundMotion = backgroundMotionSelect.value || DEFAULT_SETTINGS.backgroundMotion;
      applyTheme(state.themes, state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
    });
  }

  if (panelTransparencySelect) {
    panelTransparencySelect.addEventListener("change", () => {
      state.settings.panelTransparency = normalizePanelTransparency(panelTransparencySelect.value);
      applyPanelStyle(state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
    });
  }

  if (miniBarsEnabledSelect) {
    miniBarsEnabledSelect.addEventListener("change", () => {
      const v = String(miniBarsEnabledSelect.value || "").trim().toLowerCase();
      state.settings.miniBarsEnabled = v !== "off";
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
    });
  }

  if (translationEnabledSelect) {
    translationEnabledSelect.addEventListener("change", async () => {
      state.settings.translationEnabled = String(translationEnabledSelect.value || "").trim().toLowerCase() !== "off";
      syncReaderTranslationForm();
      try {
        await persistReaderTranslationSettings();
      } catch (error) {
        showToast(error.message || t("toastError"));
      }
    });
  }

  if (translationModeSelect) {
    translationModeSelect.addEventListener("change", async () => {
      state.settings.translationMode = normalizeTranslationMode(translationModeSelect.value);
      syncReaderTranslationForm();
      try {
        await persistReaderTranslationSettings();
      } catch (error) {
        showToast(error.message || t("toastError"));
      }
    });
  }

  const bindLocalTranslateSetting = (node, eventName = "change") => {
    if (!node) return;
    node.addEventListener(eventName, async () => {
      collectLocalTranslationSettingsFromForm();
      syncReaderTranslationForm();
      try {
        await persistReaderTranslationSettings();
      } catch (error) {
        showToast(error.message || t("toastError"));
      }
    });
  };

  bindLocalTranslateSetting(localSplitModeSelect);
  bindLocalTranslateSetting(localNameVpPrioritySelect);
  bindLocalTranslateSetting(localPersonalGeneralPrioritySelect);
  bindLocalTranslateSetting(localVpPrioritySelect);
  bindLocalTranslateSetting(localLuatNhanModeSelect);
  bindLocalTranslateSetting(localConvertSimplifiedSelect);
  bindLocalTranslateSetting(localUsePronounsSelect);
  bindLocalTranslateSetting(localUseLuatNhanSelect);
  bindLocalTranslateSetting(localMaxPhraseSizeInput, "input");
  if (localMaxPhraseSizeInput) {
    localMaxPhraseSizeInput.addEventListener("input", () => {
      syncLocalMaxPhraseSizeValue(localMaxPhraseSizeInput.value);
    });
  }

  if (fontSizeInput) {
    fontSizeInput.addEventListener("input", () => {
      state.settings.fontSize = Number(fontSizeInput.value) || DEFAULT_SETTINGS.fontSize;
      if (qs("font-size-value")) qs("font-size-value").textContent = `${state.settings.fontSize}px`;
      applyReaderVars(state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
    });
  }

  if (lineHeightInput) {
    lineHeightInput.addEventListener("input", () => {
      state.settings.lineHeight = Number(lineHeightInput.value) || DEFAULT_SETTINGS.lineHeight;
      if (qs("line-height-value")) qs("line-height-value").textContent = `${state.settings.lineHeight.toFixed(2)}`;
      applyReaderVars(state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
    });
  }

  if (paragraphSpacingInput) {
    paragraphSpacingInput.addEventListener("input", () => {
      state.settings.paragraphSpacing = Number(paragraphSpacingInput.value) || DEFAULT_SETTINGS.paragraphSpacing;
      if (qs("paragraph-spacing-value")) qs("paragraph-spacing-value").textContent = `${state.settings.paragraphSpacing.toFixed(2)}em`;
      applyReaderVars(state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
    });
  }

  if (qs("settings-form")) {
    qs("settings-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      state.settings.fontFamily = (fontFamilySelect && fontFamilySelect.value) || DEFAULT_SETTINGS.fontFamily;
      state.settings.starStyle = (starStyleSelect && starStyleSelect.value) || DEFAULT_SETTINGS.starStyle;
      state.settings.backgroundMotion = (backgroundMotionSelect && backgroundMotionSelect.value) || DEFAULT_SETTINGS.backgroundMotion;
      state.settings.textAlign = (textAlignSelect && textAlignSelect.value) || DEFAULT_SETTINGS.textAlign;
      state.settings.readingMode = (readingModeSelect && readingModeSelect.value) || DEFAULT_SETTINGS.readingMode;
      state.settings.panelTransparency = normalizePanelTransparency((panelTransparencySelect && panelTransparencySelect.value) || DEFAULT_SETTINGS.panelTransparency);
      state.settings.miniBarsEnabled = (miniBarsEnabledSelect && miniBarsEnabledSelect.value) !== "off";
      state.settings.translationEnabled = (translationEnabledSelect && translationEnabledSelect.value) !== "off";
      state.settings.translationMode = normalizeTranslationMode((translationModeSelect && translationModeSelect.value) || DEFAULT_SETTINGS.translationMode);
      state.readerTranslationLocal = collectLocalTranslationSettingsFromForm();
      applyTheme(state.themes, state.settings);
      applyPanelStyle(state.settings);
      applyReaderVars(state.settings);
      syncReaderTranslationForm();
      saveSettings(state.settings);
      emitSettingsChanged({ ...state.settings, translationLocal: state.readerTranslationLocal });
      try {
        await persistReaderTranslationSettings();
      } catch (error) {
        showToast(error.message || t("toastError"));
      }
      showToast(t("toastSettingsSaved"));
      closeSettings();
    });
  }

  if (qs("btn-reset-settings")) {
    qs("btn-reset-settings").addEventListener("click", async () => {
      state.settings = { ...DEFAULT_SETTINGS, themeId: state.settings.themeId };
      if (fontFamilySelect) fontFamilySelect.value = state.settings.fontFamily;
      if (starStyleSelect) starStyleSelect.value = state.settings.starStyle;
      if (backgroundMotionSelect) backgroundMotionSelect.value = state.settings.backgroundMotion;
      if (fontSizeInput) fontSizeInput.value = String(state.settings.fontSize);
      if (lineHeightInput) lineHeightInput.value = String(state.settings.lineHeight);
      if (paragraphSpacingInput) paragraphSpacingInput.value = String(state.settings.paragraphSpacing);
      if (textAlignSelect) textAlignSelect.value = state.settings.textAlign;
      if (readingModeSelect) readingModeSelect.value = state.settings.readingMode;
      if (panelTransparencySelect) panelTransparencySelect.value = normalizePanelTransparency(state.settings.panelTransparency);
      if (miniBarsEnabledSelect) miniBarsEnabledSelect.value = state.settings.miniBarsEnabled ? "on" : "off";
      if (translationEnabledSelect) translationEnabledSelect.value = state.settings.translationEnabled ? "on" : "off";
      if (translationModeSelect) translationModeSelect.value = normalizeTranslationMode(state.settings.translationMode);
      state.readerTranslationLocal = { ...LOCAL_TRANSLATION_DEFAULT };
      applyTheme(state.themes, state.settings);
      applyPanelStyle(state.settings);
      applyReaderVars(state.settings);
      syncReaderTranslationForm();
      saveSettings(state.settings);
      emitSettingsChanged({ ...state.settings, translationLocal: state.readerTranslationLocal });
      try {
        await persistReaderTranslationSettings();
      } catch (error) {
        showToast(error.message || t("toastError"));
      }
      showToast(t("toastSettingsReset"));
    });
  }

  const pluginSelect = qs("import-url-plugin");
  const vbookManagerDialog = qs("vbook-manager-dialog");
  const vbookRepoSelect = qs("vbook-repo-select");
  const vbookRepoCustomInput = qs("vbook-repo-custom-input");
  const vbookGlobalDelayInput = qs("vbook-global-request-delay-ms");
  const vbookGlobalThreadsInput = qs("vbook-global-download-threads");
  const vbookGlobalPrefetchInput = qs("vbook-global-prefetch-unread-count");
  const vbookGlobalRetryInput = qs("vbook-global-retry-count");
  const vbookRuntimePluginSelect = qs("vbook-runtime-plugin-select");
  const vbookPluginSupplementalInput = qs("vbook-plugin-supplemental-code");
  const vbookPluginDelayInput = qs("vbook-plugin-request-delay-ms");
  const vbookPluginThreadsInput = qs("vbook-plugin-download-threads");
  const vbookPluginPrefetchInput = qs("vbook-plugin-prefetch-unread-count");

  const clampInt = (raw, min, max, fallback) => {
    const num = Number.parseInt(String(raw ?? ""), 10);
    if (!Number.isFinite(num)) return fallback;
    if (num < min) return min;
    if (num > max) return max;
    return num;
  };

  const clampIntOrNull = (raw, min, max) => {
    if (raw == null) return null;
    if (typeof raw === "string" && !raw.trim()) return null;
    const num = Number.parseInt(String(raw), 10);
    if (!Number.isFinite(num)) return null;
    if (num < min) return min;
    if (num > max) return max;
    return num;
  };

  const normalizeVbookGlobalSettings = (payload) => {
    const raw = (payload && typeof payload === "object") ? payload : {};
    return {
      request_delay_ms: clampInt(raw.request_delay_ms, 0, 15000, 0),
      download_threads: clampInt(raw.download_threads ?? raw.max_concurrency, 1, 16, 4),
      prefetch_unread_count: clampInt(raw.prefetch_unread_count, 0, 50, 2),
      retry_count: clampInt(raw.retry_count ?? raw.retry, 0, 10, 2),
    };
  };

  const normalizeVbookPluginSettings = (payload) => {
    const raw = (payload && typeof payload === "object") ? payload : {};
    return {
      supplemental_code: String(raw.supplemental_code || ""),
      request_delay_ms: clampIntOrNull(raw.request_delay_ms, 0, 15000),
      download_threads: clampIntOrNull(raw.download_threads ?? raw.max_concurrency, 1, 16),
      prefetch_unread_count: clampIntOrNull(raw.prefetch_unread_count, 0, 50),
    };
  };

  const runtimeEffectiveSettings = (pluginId = "") => {
    const globalCfg = normalizeVbookGlobalSettings(state.vbook.globalSettings || {});
    const pluginCfg = normalizeVbookPluginSettings((state.vbook.pluginSettings || {})[String(pluginId || "").trim()] || {});
    return {
      supplemental_code: pluginCfg.supplemental_code || "",
      request_delay_ms: pluginCfg.request_delay_ms == null ? globalCfg.request_delay_ms : pluginCfg.request_delay_ms,
      download_threads: pluginCfg.download_threads == null ? globalCfg.download_threads : pluginCfg.download_threads,
      prefetch_unread_count: pluginCfg.prefetch_unread_count == null ? globalCfg.prefetch_unread_count : pluginCfg.prefetch_unread_count,
      retry_count: globalCfg.retry_count,
    };
  };

  const fillVbookGlobalForm = () => {
    const cfg = normalizeVbookGlobalSettings(state.vbook.globalSettings || {});
    state.vbook.globalSettings = cfg;
    if (vbookGlobalDelayInput) vbookGlobalDelayInput.value = String(cfg.request_delay_ms);
    if (vbookGlobalThreadsInput) vbookGlobalThreadsInput.value = String(cfg.download_threads);
    if (vbookGlobalPrefetchInput) vbookGlobalPrefetchInput.value = String(cfg.prefetch_unread_count);
    if (vbookGlobalRetryInput) vbookGlobalRetryInput.value = String(cfg.retry_count);
  };

  const fillVbookPluginForm = (pluginId = "") => {
    const pid = String(pluginId || state.vbook.selectedRuntimePluginId || "").trim();
    state.vbook.selectedRuntimePluginId = pid;
    if (vbookRuntimePluginSelect && vbookRuntimePluginSelect.value !== pid) {
      vbookRuntimePluginSelect.value = pid;
    }
    const pluginCfg = normalizeVbookPluginSettings((state.vbook.pluginSettings || {})[pid] || {});
    const globalCfg = normalizeVbookGlobalSettings(state.vbook.globalSettings || {});
    if (vbookPluginSupplementalInput) vbookPluginSupplementalInput.value = pluginCfg.supplemental_code || "";
    if (vbookPluginDelayInput) {
      vbookPluginDelayInput.value = pluginCfg.request_delay_ms == null ? "" : String(pluginCfg.request_delay_ms);
      vbookPluginDelayInput.placeholder = String(globalCfg.request_delay_ms);
    }
    if (vbookPluginThreadsInput) {
      vbookPluginThreadsInput.value = pluginCfg.download_threads == null ? "" : String(pluginCfg.download_threads);
      vbookPluginThreadsInput.placeholder = String(globalCfg.download_threads);
    }
    if (vbookPluginPrefetchInput) {
      vbookPluginPrefetchInput.value = pluginCfg.prefetch_unread_count == null ? "" : String(pluginCfg.prefetch_unread_count);
      vbookPluginPrefetchInput.placeholder = String(globalCfg.prefetch_unread_count);
    }
  };

  const renderRuntimePluginSelect = () => {
    if (!vbookRuntimePluginSelect) return;
    const prev = String(state.vbook.selectedRuntimePluginId || "").trim();
    const list = Array.isArray(state.vbook.installed) ? state.vbook.installed : [];
    vbookRuntimePluginSelect.innerHTML = "";
    for (const item of list) {
      const pid = String(item.plugin_id || "").trim();
      if (!pid) continue;
      const opt = document.createElement("option");
      opt.value = pid;
      const name = String(item.name || "").trim();
      opt.textContent = name ? `${name} (${pid})` : pid;
      vbookRuntimePluginSelect.appendChild(opt);
    }
    if (list.length <= 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = t("vbookNoInstalledPlugins");
      vbookRuntimePluginSelect.appendChild(opt);
      vbookRuntimePluginSelect.value = "";
      vbookRuntimePluginSelect.disabled = true;
      state.vbook.selectedRuntimePluginId = "";
      fillVbookPluginForm("");
      return;
    }
    vbookRuntimePluginSelect.disabled = false;
    const valid = list.some((item) => String(item.plugin_id || "").trim() === prev);
    const next = valid ? prev : String((list[0] && list[0].plugin_id) || "").trim();
    vbookRuntimePluginSelect.value = next;
    state.vbook.selectedRuntimePluginId = next;
    fillVbookPluginForm(next);
  };

  async function loadVbookGlobalSettings({ silent = false } = {}) {
    if (!silent) showStatus(t("statusLoadingVbookSettings"));
    try {
      const payload = await api("/api/vbook/settings/global");
      state.vbook.globalSettings = normalizeVbookGlobalSettings(payload && payload.settings);
      fillVbookGlobalForm();
      fillVbookPluginForm();
      return state.vbook.globalSettings;
    } catch (error) {
      if (!silent) showToast(error.message || t("toastError"));
      fillVbookGlobalForm();
      fillVbookPluginForm();
      return state.vbook.globalSettings;
    } finally {
      if (!silent) hideStatus();
    }
  };

  async function loadVbookPluginSettings(pluginId, { silent = false } = {}) {
    const pid = String(pluginId || state.vbook.selectedRuntimePluginId || "").trim();
    if (!pid) {
      fillVbookPluginForm("");
      return normalizeVbookPluginSettings({});
    }
    if (!silent) showStatus(t("statusLoadingVbookPluginSettings"));
    try {
      const payload = await api(`/api/vbook/settings/plugin/${encodeURIComponent(pid)}`);
      const override = normalizeVbookPluginSettings(payload && payload.override);
      state.vbook.pluginSettings[pid] = override;
      state.vbook.selectedRuntimePluginId = pid;
      fillVbookPluginForm(pid);
      return override;
    } catch (error) {
      if (!silent) showToast(error.message || t("toastError"));
      fillVbookPluginForm(pid);
      return normalizeVbookPluginSettings({});
    } finally {
      if (!silent) hideStatus();
    }
  }

  async function saveVbookGlobalSettings() {
    const payload = {
      request_delay_ms: clampInt(vbookGlobalDelayInput && vbookGlobalDelayInput.value, 0, 15000, 0),
      download_threads: clampInt(vbookGlobalThreadsInput && vbookGlobalThreadsInput.value, 1, 16, 4),
      prefetch_unread_count: clampInt(vbookGlobalPrefetchInput && vbookGlobalPrefetchInput.value, 0, 50, 2),
      retry_count: clampInt(vbookGlobalRetryInput && vbookGlobalRetryInput.value, 0, 10, 2),
    };
    showStatus(t("statusSavingVbookSettings"));
    try {
      const data = await api("/api/vbook/settings/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      state.vbook.globalSettings = normalizeVbookGlobalSettings(data && data.settings);
      fillVbookGlobalForm();
      fillVbookPluginForm();
      showToast(t("toastVbookSettingsSaved"));
      return state.vbook.globalSettings;
    } catch (error) {
      showToast(error.message || t("toastError"));
      return state.vbook.globalSettings;
    } finally {
      hideStatus();
    }
  }

  async function saveVbookPluginSettings() {
    const pid = String(state.vbook.selectedRuntimePluginId || (vbookRuntimePluginSelect && vbookRuntimePluginSelect.value) || "").trim();
    if (!pid) {
      showToast(t("toastVbookNeedPluginSelect"));
      return null;
    }
    const payload = {
      supplemental_code: String((vbookPluginSupplementalInput && vbookPluginSupplementalInput.value) || ""),
      request_delay_ms: clampIntOrNull(vbookPluginDelayInput && vbookPluginDelayInput.value, 0, 15000),
      download_threads: clampIntOrNull(vbookPluginThreadsInput && vbookPluginThreadsInput.value, 1, 16),
      prefetch_unread_count: clampIntOrNull(vbookPluginPrefetchInput && vbookPluginPrefetchInput.value, 0, 50),
    };
    showStatus(t("statusSavingVbookPluginSettings"));
    try {
      const data = await api(`/api/vbook/settings/plugin/${encodeURIComponent(pid)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const override = normalizeVbookPluginSettings(data && data.override);
      state.vbook.pluginSettings[pid] = override;
      fillVbookPluginForm(pid);
      showToast(t("toastVbookPluginSettingsSaved"));
      return override;
    } catch (error) {
      showToast(error.message || t("toastError"));
      return null;
    } finally {
      hideStatus();
    }
  }

  async function clearVbookPluginSettings() {
    const pid = String(state.vbook.selectedRuntimePluginId || (vbookRuntimePluginSelect && vbookRuntimePluginSelect.value) || "").trim();
    if (!pid) {
      showToast(t("toastVbookNeedPluginSelect"));
      return null;
    }
    showStatus(t("statusSavingVbookPluginSettings"));
    try {
      const data = await api(`/api/vbook/settings/plugin/${encodeURIComponent(pid)}`, {
        method: "DELETE",
      });
      const override = normalizeVbookPluginSettings(data && data.override);
      state.vbook.pluginSettings[pid] = override;
      fillVbookPluginForm(pid);
      showToast(t("toastVbookPluginSettingsCleared"));
      return override;
    } catch (error) {
      showToast(error.message || t("toastError"));
      return null;
    } finally {
      hideStatus();
    }
  }

  async function refreshVbookRuntimeSettings({ silent = false, pluginId = "" } = {}) {
    await loadVbookGlobalSettings({ silent });
    const pid = String(pluginId || state.vbook.selectedRuntimePluginId || (vbookRuntimePluginSelect && vbookRuntimePluginSelect.value) || "").trim();
    if (pid) {
      await loadVbookPluginSettings(pid, { silent: true });
    } else {
      fillVbookPluginForm("");
    }
    return {
      plugin_id: pid,
      global: normalizeVbookGlobalSettings(state.vbook.globalSettings || {}),
      effective: runtimeEffectiveSettings(pid),
    };
  }

  const formatPluginMeta = (item) => {
    const out = [];
    const version = String(item && item.version != null ? item.version : "").trim();
    if (version) out.push(`v${version}`);
    const locale = String((item && item.locale) || "").trim();
    if (locale) out.push(locale);
    const type = String((item && item.type) || "").trim();
    if (type) out.push(type);
    const author = String((item && item.author) || "").trim();
    if (author) out.push(author);
    return out.join(" • ");
  };

  const renderImportPluginOptions = (items) => {
    if (!pluginSelect) return;
    const keep = pluginSelect.querySelector('option[value=""]');
    pluginSelect.innerHTML = "";
    if (keep) {
      pluginSelect.appendChild(keep);
    } else {
      const autoOpt = document.createElement("option");
      autoOpt.value = "";
      autoOpt.textContent = t("importUrlPluginAuto");
      pluginSelect.appendChild(autoOpt);
    }
    const list = Array.isArray(items) ? items : [];
    for (const item of list) {
      const pid = String(item.plugin_id || "").trim();
      if (!pid) continue;
      const opt = document.createElement("option");
      opt.value = pid;
      const label = String(item.name || pid).trim() || pid;
      const meta = formatPluginMeta(item);
      opt.textContent = meta ? `${label} • ${meta}` : label;
      pluginSelect.appendChild(opt);
    }
  };

  const renderInstalledPlugins = () => {
    const container = qs("vbook-installed-list");
    if (!container) return;
    container.innerHTML = "";
    const items = Array.isArray(state.vbook.installed) ? state.vbook.installed : [];
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "empty-text";
      empty.textContent = t("vbookNoInstalledPlugins");
      container.appendChild(empty);
      return;
    }
    for (const item of items) {
      const card = document.createElement("div");
      card.className = "vbook-repo-card";

      // Icon
      const iconWrap = document.createElement("span");
      iconWrap.className = "vbook-repo-card-icon";
      const iconUrl = String(item.icon_url || "").trim();
      if (iconUrl) {
        const img = document.createElement("img");
        img.src = iconUrl;
        img.alt = String(item.name || item.plugin_id || "plugin");
        img.loading = "lazy";
        img.decoding = "async";
        img.addEventListener("error", () => { img.remove(); iconWrap.textContent = "EXT"; }, { once: true });
        iconWrap.appendChild(img);
      } else {
        iconWrap.textContent = "EXT";
      }

      // Body
      const body = document.createElement("div");
      body.className = "vbook-repo-card-body";

      const pluginName = String(item.name || item.plugin_id || t("vbookUnknownPlugin")).trim() || t("vbookUnknownPlugin");
      const nameRow = document.createElement("div");
      nameRow.className = "vbook-repo-card-name";
      nameRow.textContent = pluginName;

      const pidEl = document.createElement("div");
      pidEl.className = "vbook-repo-card-desc";
      pidEl.textContent = String(item.plugin_id || "").trim();

      const metaWrap = document.createElement("div");
      metaWrap.style.display = "flex";
      metaWrap.style.alignItems = "center";
      metaWrap.style.gap = "6px";
      metaWrap.style.flexWrap = "wrap";

      const metaEl = document.createElement("div");
      metaEl.className = "vbook-repo-card-meta";
      metaEl.textContent = formatPluginMeta(item) || "";
      metaWrap.appendChild(metaEl);

      const updateData = state.vbook.pluginUpdates[item.plugin_id];
      if (updateData) {
        const upBadge = document.createElement("span");
        upBadge.style.fontSize = "10px";
        upBadge.style.background = "var(--accent)";
        upBadge.style.color = "#fff";
        upBadge.style.padding = "2px 6px";
        upBadge.style.borderRadius = "4px";
        upBadge.textContent = `Có sẵn: v${updateData.version}`;
        metaWrap.appendChild(upBadge);
      }

      body.append(nameRow, pidEl, metaWrap);

      // Action
      const actionWrap = document.createElement("div");
      actionWrap.className = "vbook-repo-card-action";

      if (updateData && updateData.plugin_url) {
        const btnUpdate = document.createElement("button");
        btnUpdate.type = "button";
        btnUpdate.className = "btn btn-small btn-primary";
        btnUpdate.style.marginRight = "6px";
        btnUpdate.textContent = t("vbookUpdateAction");
        btnUpdate.addEventListener("click", async () => {
          showStatus(t("statusInstallingVbookPlugin"));
          try {
            await api("/api/vbook/plugins/install", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plugin_url: updateData.plugin_url,
                plugin_id: item.plugin_id,
              }),
            });
            showToast(t("toastVbookPluginInstalled"));
            delete state.vbook.pluginUpdates[item.plugin_id];
            await loadInstalledVbookPlugins({ silent: true });
            await loadRepoPlugins({ silent: true });
          } catch (error) {
            showToast(error.message || t("toastError"));
          } finally {
            hideStatus();
          }
        });
        actionWrap.appendChild(btnUpdate);
      }

      const btnRemove = document.createElement("button");
      btnRemove.type = "button";
      btnRemove.className = "btn btn-small";
      btnRemove.textContent = t("vbookRemoveAction");
      btnRemove.addEventListener("click", async () => {
        const pidValue = String(item.plugin_id || "").trim();
        if (!pidValue) return;
        if (!window.confirm(t("confirmRemoveVbookPlugin", { name: pluginName }))) return;
        showStatus(t("statusRemovingVbookPlugin"));
        try {
          await api(`/api/vbook/plugins/${encodeURIComponent(pidValue)}`, { method: "DELETE" });
          showToast(t("toastVbookPluginRemoved"));
          delete state.vbook.pluginUpdates[pidValue];
          await loadInstalledVbookPlugins({ silent: true });
          await loadRepoPlugins({ silent: true });
        } catch (error) {
          showToast(error.message || t("toastError"));
        } finally {
          hideStatus();
        }
      });
      actionWrap.appendChild(btnRemove);

      card.append(iconWrap, body, actionWrap);
      container.appendChild(card);
    }
  };

  const renderRepoErrors = () => {
    const box = qs("vbook-repo-errors");
    if (!box) return;
    const errs = Array.isArray(state.vbook.repoErrors) ? state.vbook.repoErrors : [];
    if (!errs.length) {
      box.classList.add("hidden");
      box.textContent = "";
      return;
    }
    const parts = errs.map((item) => {
      const url = String((item && item.repo_url) || "").trim();
      const message = String((item && item.message) || "").trim();
      if (url && message) return `${url}: ${message}`;
      return url || message;
    }).filter(Boolean);
    if (!parts.length) {
      box.classList.add("hidden");
      box.textContent = "";
      return;
    }
    box.textContent = `${t("vbookRepoErrorsPrefix")} ${parts.join(" | ")}`;
    box.classList.remove("hidden");
  };

  const renderRepoPlugins = () => {
    const container = qs("vbook-repo-list");
    if (!container) return;
    container.innerHTML = "";
    const allItems = Array.isArray(state.vbook.repoPlugins) ? state.vbook.repoPlugins : [];
    const items = allItems.filter(item => !item.installed);
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "empty-text";
      empty.textContent = t("vbookNoRepoPlugins");
      container.appendChild(empty);
      renderRepoErrors();
      return;
    }
    for (const item of items) {
      const card = document.createElement("div");
      card.className = "vbook-repo-card";

      // Icon
      const iconWrap = document.createElement("span");
      iconWrap.className = "vbook-repo-card-icon";
      const iconUrl = String(item.icon_url || "").trim();
      if (iconUrl) {
        const img = document.createElement("img");
        img.src = iconUrl;
        img.alt = String(item.name || item.plugin_id || "plugin");
        img.loading = "lazy";
        img.decoding = "async";
        img.addEventListener("error", () => { img.remove(); iconWrap.textContent = "EXT"; }, { once: true });
        iconWrap.appendChild(img);
      } else {
        iconWrap.textContent = "EXT";
      }

      // Body
      const body = document.createElement("div");
      body.className = "vbook-repo-card-body";

      const nameRow = document.createElement("div");
      nameRow.className = "vbook-repo-card-name";
      nameRow.textContent = String(item.name || item.plugin_id || t("vbookUnknownPlugin")).trim() || t("vbookUnknownPlugin");

      const desc = String(item.description || "").trim();
      const descEl = document.createElement("div");
      descEl.className = "vbook-repo-card-desc";
      descEl.textContent = desc || "";

      const metaParts = [];
      const version = String(item.version != null ? item.version : "").trim();
      if (version) metaParts.push(`v${version}`);
      const locale = String(item.locale || "").trim();
      if (locale) metaParts.push(locale);
      const pluginType = String(item.type || "").trim();
      if (pluginType) metaParts.push(pluginType);
      const author = String(item.author || "").trim();
      if (author) metaParts.push(author);
      const metaEl = document.createElement("div");
      metaEl.className = "vbook-repo-card-meta";
      metaEl.textContent = metaParts.join(" • ") || "";

      body.append(nameRow, descEl, metaEl);

      // Action
      const actionWrap = document.createElement("div");
      actionWrap.className = "vbook-repo-card-action";
      const installed = Boolean(item.installed);
      const pluginUrl = String(item.plugin_url || "").trim();
      const btn = document.createElement("button");
      btn.type = "button";
      if (installed) {
        btn.className = "btn btn-small vbook-repo-btn-installed";
        btn.textContent = t("vbookInstalledBadge");
        btn.disabled = true;
      } else if (!pluginUrl) {
        btn.className = "btn btn-small";
        btn.textContent = t("vbookNoDownloadUrl");
        btn.disabled = true;
      } else {
        btn.className = "btn btn-small btn-primary";
        btn.textContent = t("vbookInstallAction");
        btn.addEventListener("click", async () => {
          showStatus(t("statusInstallingVbookPlugin"));
          try {
            await api("/api/vbook/plugins/install", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plugin_url: pluginUrl,
                plugin_id: String(item.plugin_id || "").trim(),
              }),
            });
            showToast(t("toastVbookPluginInstalled"));
            await loadInstalledVbookPlugins({ silent: true });
            await loadRepoPlugins({ silent: true });
          } catch (error) {
            showToast(error.message || t("toastError"));
          } finally {
            hideStatus();
          }
        });
      }
      actionWrap.appendChild(btn);

      card.append(iconWrap, body, actionWrap);
      container.appendChild(card);
    }
    renderRepoErrors();
  };

  const renderRepoSelect = () => {
    if (!vbookRepoSelect) return;
    const keep = String(state.vbook.activeRepoUrl || "").trim();
    vbookRepoSelect.innerHTML = "";
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = t("vbookRepoAllConfigured");
    vbookRepoSelect.appendChild(allOpt);
    const urls = Array.isArray(state.vbook.repoUrls) ? state.vbook.repoUrls : [];
    for (const rawUrl of urls) {
      const url = String(rawUrl || "").trim();
      if (!url) continue;
      const opt = document.createElement("option");
      opt.value = url;
      let label = url;
      try {
        const parsed = new URL(url);
        label = parsed.host ? `${parsed.host}${parsed.pathname}` : url;
      } catch {
        // keep raw
      }
      opt.textContent = label;
      vbookRepoSelect.appendChild(opt);
    }
    if (keep && urls.includes(keep)) {
      vbookRepoSelect.value = keep;
    } else {
      vbookRepoSelect.value = "";
      state.vbook.activeRepoUrl = "";
    }
  };

  const normalizeRepoUrls = (urls) => {
    const list = Array.isArray(urls) ? urls : [];
    const out = [];
    const seen = new Set();
    for (const raw of list) {
      const url = String(raw || "").trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push(url);
    }
    return out;
  };

  async function saveRepoUrls() {
    const repoUrls = normalizeRepoUrls(state.vbook.repoUrls || []);
    showStatus(t("statusSavingVbookRepos"));
    try {
      const payload = await api("/api/vbook/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_urls: repoUrls }),
      });
      const items = Array.isArray(payload && payload.items) ? payload.items : [];
      state.vbook.repoUrls = normalizeRepoUrls(items.map((x) => String((x && x.url) || "").trim()));
      renderRepoSelect();
      showToast(t("toastVbookRepoSaved"));
      return state.vbook.repoUrls;
    } catch (error) {
      showToast(error.message || t("toastError"));
      return state.vbook.repoUrls;
    } finally {
      hideStatus();
    }
  }

  async function checkInstalledPluginUpdates() {
    showStatus(t("toastVbookCheckingUpdates"));
    try {
      const items = Array.isArray(state.vbook.installed) ? state.vbook.installed : [];
      if (!items.length) {
        showToast(t("toastVbookNoUpdates"));
        return;
      }
      const repoPayload = await api("/api/vbook/repo/plugins");
      const allRepoPlugins = Array.isArray(repoPayload && repoPayload.items) ? repoPayload.items : [];

      let updateCount = 0;
      state.vbook.pluginUpdates = {};

      for (const inst of items) {
        const match = allRepoPlugins.find(r => r.plugin_id === inst.plugin_id);
        if (match && match.version && inst.version !== match.version) {
          state.vbook.pluginUpdates[inst.plugin_id] = match;
          updateCount++;
        }
      }

      if (updateCount > 0) {
        showToast(t("toastVbookUpdatesFound", { count: updateCount }));
      } else {
        showToast(t("toastVbookNoUpdates"));
      }
      renderInstalledPlugins();
    } catch (error) {
      showToast(error.message || t("toastError"));
    } finally {
      hideStatus();
    }
  }

  async function loadInstalledVbookPlugins({ silent = false } = {}) {
    if (!pluginSelect && !qs("vbook-installed-list")) return [];
    if (!silent) showStatus(t("statusLoadingVbookInstalled"));
    try {
      const payload = await api("/api/vbook/plugins");
      const items = (payload && payload.items) || [];
      state.vbook.installed = Array.isArray(items) ? items : [];
      renderImportPluginOptions(state.vbook.installed);
      renderInstalledPlugins();
      renderRuntimePluginSelect();
      if (state.vbook.selectedRuntimePluginId) {
        await loadVbookPluginSettings(state.vbook.selectedRuntimePluginId, { silent: true });
      }
      return state.vbook.installed;
    } catch (error) {
      if (!silent) showToast(error.message || t("toastError"));
      return [];
    } finally {
      if (!silent) hideStatus();
    }
  }

  async function loadRepoUrls({ silent = false } = {}) {
    if (!vbookRepoSelect) return [];
    if (!silent) showStatus(t("statusLoadingVbookRepo"));
    try {
      const payload = await api("/api/vbook/repos");
      const items = (payload && payload.items) || [];
      state.vbook.repoUrls = Array.isArray(items)
        ? items.map((x) => String((x && x.url) || "").trim()).filter(Boolean)
        : [];
      renderRepoSelect();
      return state.vbook.repoUrls;
    } catch (error) {
      if (!silent) showToast(error.message || t("toastError"));
      state.vbook.repoUrls = [];
      renderRepoSelect();
      return [];
    } finally {
      if (!silent) hideStatus();
    }
  }

  const currentRepoUrl = () => {
    const custom = String((vbookRepoCustomInput && vbookRepoCustomInput.value) || "").trim();
    if (custom) return custom;
    return String((vbookRepoSelect && vbookRepoSelect.value) || "").trim();
  };

  async function loadRepoPlugins({ repoUrl = null, silent = false } = {}) {
    if (!qs("vbook-repo-list")) return [];
    const raw = repoUrl == null ? currentRepoUrl() : String(repoUrl || "").trim();
    state.vbook.activeRepoUrl = String((vbookRepoSelect && vbookRepoSelect.value) || "").trim();
    if (!silent) showStatus(t("statusLoadingVbookRepo"));
    try {
      const endpoint = raw
        ? `/api/vbook/repo/plugins?repo_url=${encodeURIComponent(raw)}`
        : "/api/vbook/repo/plugins";
      const payload = await api(endpoint);
      state.vbook.repoPlugins = Array.isArray(payload && payload.items) ? payload.items : [];
      state.vbook.repoErrors = Array.isArray(payload && payload.errors) ? payload.errors : [];
      renderRepoPlugins();
      if (!silent) showToast(t("toastVbookRepoLoaded"));
      return state.vbook.repoPlugins;
    } catch (error) {
      state.vbook.repoPlugins = [];
      state.vbook.repoErrors = [];
      renderRepoPlugins();
      if (!silent) showToast(error.message || t("toastError"));
      return [];
    } finally {
      if (!silent) hideStatus();
    }
  }

  if (qs("btn-import")) qs("btn-import").addEventListener("click", () => qs("import-dialog") && qs("import-dialog").showModal());
  if (qs("btn-import-cancel")) qs("btn-import-cancel").addEventListener("click", () => qs("import-dialog") && qs("import-dialog").close());
  if (qs("import-form")) {
    qs("import-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      await handleImport(onImported);
    });
  }

  if (qs("btn-import-url")) qs("btn-import-url").addEventListener("click", () => qs("import-url-dialog") && qs("import-url-dialog").showModal());
  if (qs("btn-import-url-cancel")) qs("btn-import-url-cancel").addEventListener("click", () => qs("import-url-dialog") && qs("import-url-dialog").close());
  if (qs("import-url-form")) {
    qs("import-url-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      await handleImportUrl(onImported);
    });
  }

  if (qs("btn-manage-vbook")) {
    qs("btn-manage-vbook").addEventListener("click", async () => {
      if (!vbookManagerDialog) return;
      if (!vbookManagerDialog.open) vbookManagerDialog.showModal();
      showStatus(t("statusLoadingVbookInstalled"));
      try {
        await loadInstalledVbookPlugins({ silent: true });
        await loadRepoUrls({ silent: true });
        await loadRepoPlugins({ silent: true });
        await refreshVbookRuntimeSettings({ silent: true });
      } catch (error) {
        showToast(error.message || t("toastError"));
      } finally {
        hideStatus();
      }
    });
  }

  if (qs("btn-vbook-manager-close")) {
    qs("btn-vbook-manager-close").addEventListener("click", () => {
      if (vbookManagerDialog && vbookManagerDialog.open) vbookManagerDialog.close();
    });
  }

  if (qs("btn-vbook-refresh-installed")) {
    qs("btn-vbook-refresh-installed").addEventListener("click", async () => {
      await loadInstalledVbookPlugins();
    });
  }

  if (qs("btn-vbook-check-updates")) {
    qs("btn-vbook-check-updates").addEventListener("click", async () => {
      await checkInstalledPluginUpdates();
    });
  }

  if (qs("btn-vbook-refresh-repo")) {
    qs("btn-vbook-refresh-repo").addEventListener("click", async () => {
      await loadRepoUrls({ silent: true });
      await loadRepoPlugins();
    });
  }

  if (qs("btn-vbook-toggle-adv")) {
    qs("btn-vbook-toggle-adv").addEventListener("click", () => {
      const adv = qs("vbook-repo-adv-group");
      if (adv) adv.classList.toggle("hidden");
    });
  }

  if (vbookRepoSelect) {
    vbookRepoSelect.addEventListener("change", async () => {
      state.vbook.activeRepoUrl = String(vbookRepoSelect.value || "").trim();
      if (vbookRepoCustomInput) vbookRepoCustomInput.value = "";
      await loadRepoPlugins();
    });
  }

  if (qs("btn-vbook-load-custom-repo")) {
    qs("btn-vbook-load-custom-repo").addEventListener("click", async () => {
      const repoUrl = String((vbookRepoCustomInput && vbookRepoCustomInput.value) || "").trim();
      if (!repoUrl) {
        showToast(t("toastVbookNeedRepoUrl"));
        return;
      }
      await loadRepoPlugins({ repoUrl });
    });
  }

  if (qs("btn-vbook-add-repo")) {
    qs("btn-vbook-add-repo").addEventListener("click", async () => {
      const candidate = String((vbookRepoCustomInput && vbookRepoCustomInput.value) || "").trim()
        || String((vbookRepoSelect && vbookRepoSelect.value) || "").trim();
      if (!candidate) {
        showToast(t("toastVbookNeedRepoUrl"));
        return;
      }
      const next = normalizeRepoUrls([...(state.vbook.repoUrls || []), candidate]);
      if (next.length === (state.vbook.repoUrls || []).length) {
        showToast(t("toastVbookRepoExists"));
        return;
      }
      state.vbook.repoUrls = next;
      renderRepoSelect();
      if (vbookRepoSelect) {
        vbookRepoSelect.value = candidate;
      }
      state.vbook.activeRepoUrl = candidate;
      showToast(t("toastVbookRepoAdded"));
      await saveRepoUrls();
      await loadRepoPlugins({ repoUrl: candidate, silent: true });
    });
  }

  if (qs("btn-vbook-remove-repo")) {
    qs("btn-vbook-remove-repo").addEventListener("click", async () => {
      const selected = String((vbookRepoSelect && vbookRepoSelect.value) || "").trim();
      if (!selected) {
        showToast(t("toastVbookNeedRepoSelect"));
        return;
      }
      state.vbook.repoUrls = normalizeRepoUrls((state.vbook.repoUrls || []).filter((x) => String(x || "").trim() !== selected));
      state.vbook.activeRepoUrl = "";
      renderRepoSelect();
      if (vbookRepoCustomInput) vbookRepoCustomInput.value = "";
      showToast(t("toastVbookRepoRemoved"));
      await saveRepoUrls();
      await loadRepoPlugins({ silent: true });
    });
  }

  if (qs("btn-vbook-save-repos")) {
    qs("btn-vbook-save-repos").addEventListener("click", async () => {
      await saveRepoUrls();
    });
  }

  if (qs("btn-vbook-reload-settings")) {
    qs("btn-vbook-reload-settings").addEventListener("click", async () => {
      await refreshVbookRuntimeSettings();
    });
  }

  if (vbookRuntimePluginSelect) {
    vbookRuntimePluginSelect.addEventListener("change", async () => {
      const pid = String(vbookRuntimePluginSelect.value || "").trim();
      state.vbook.selectedRuntimePluginId = pid;
      await loadVbookPluginSettings(pid);
    });
  }

  if (qs("btn-vbook-save-global-settings")) {
    qs("btn-vbook-save-global-settings").addEventListener("click", async () => {
      await saveVbookGlobalSettings();
      fillVbookPluginForm();
    });
  }

  if (qs("btn-vbook-save-plugin-settings")) {
    qs("btn-vbook-save-plugin-settings").addEventListener("click", async () => {
      await saveVbookPluginSettings();
    });
  }

  if (qs("btn-vbook-clear-plugin-settings")) {
    qs("btn-vbook-clear-plugin-settings").addEventListener("click", async () => {
      await clearVbookPluginSettings();
    });
  }

  if (qs("vbook-install-url-form")) {
    qs("vbook-install-url-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const pluginUrl = String((qs("vbook-plugin-url-input") && qs("vbook-plugin-url-input").value) || "").trim();
      const pluginId = String((qs("vbook-plugin-id-input") && qs("vbook-plugin-id-input").value) || "").trim();
      if (!pluginUrl) return;
      showStatus(t("statusInstallingVbookPlugin"));
      try {
        await api("/api/vbook/plugins/install", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plugin_url: pluginUrl, plugin_id: pluginId }),
        });
        showToast(t("toastVbookPluginInstalled"));
        if (qs("vbook-install-url-form")) qs("vbook-install-url-form").reset();
        await loadInstalledVbookPlugins({ silent: true });
        await loadRepoPlugins({ silent: true });
      } catch (error) {
        showToast(error.message || t("toastError"));
      } finally {
        hideStatus();
      }
    });
  }

  if (qs("vbook-install-local-form")) {
    qs("vbook-install-local-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const fileInput = qs("vbook-plugin-file-input");
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (!file) {
        showToast(t("toastVbookNeedPluginFile"));
        return;
      }
      const pluginId = String((qs("vbook-plugin-id-local-input") && qs("vbook-plugin-id-local-input").value) || "").trim();
      const formData = new FormData();
      formData.set("file", file, file.name || "plugin.zip");
      if (pluginId) formData.set("plugin_id", pluginId);

      showStatus(t("statusInstallingVbookPlugin"));
      try {
        await api("/api/vbook/plugins/install-local", {
          method: "POST",
          body: formData,
        });
        showToast(t("toastVbookPluginInstalled"));
        if (qs("vbook-install-local-form")) qs("vbook-install-local-form").reset();
        await loadInstalledVbookPlugins({ silent: true });
        await loadRepoPlugins({ silent: true });
      } catch (error) {
        showToast(error.message || t("toastError"));
      } finally {
        hideStatus();
      }
    });
  }

  await loadInstalledVbookPlugins({ silent: true });
  await refreshVbookRuntimeSettings({ silent: true });

  if (qs("btn-clear-cache")) qs("btn-clear-cache").addEventListener("click", clearCache);

  return {
    t,
    api,
    parseQuery,
    showToast,
    showStatus,
    hideStatus,
    settings: state.settings,
    getReadingMode: () => state.settings.readingMode,
    getTranslationEnabled: () => state.settings.translationEnabled !== false,
    getTranslationMode: () => normalizeTranslationMode(state.settings.translationMode),
    getTranslationLocalSettings: () => normalizeLocalTranslationSettings(state.readerTranslationLocal || {}),
    getVbookSettings: (pluginId = "") => runtimeEffectiveSettings(pluginId),
    getVbookGlobalSettings: () => normalizeVbookGlobalSettings(state.vbook.globalSettings || {}),
    refreshVbookSettings: (pluginId = "") => refreshVbookRuntimeSettings({ silent: true, pluginId }),
    goSearchPage,
  };
}
