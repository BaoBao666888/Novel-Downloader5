import { t } from "../i18n.vi.js?v=20260220-vb11";

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

function applyThemeClasses(target, effect, settings) {
  if (!target) return;
  target.classList.remove(...EFFECT_CLASSES);
  target.classList.add(`effect-${effect || "stars"}`);
  target.classList.remove(...STAR_STYLE_CLASSES);
  target.classList.add(`star-style-${settings.starStyle || "classic"}`);
  target.classList.toggle("effects-paused", (settings.backgroundMotion || "on") !== "on");
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

  const lite = lowPowerDevice();
  document.documentElement.classList.toggle("effects-lite", lite);
  document.body.classList.toggle("effects-lite", lite);

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

async function clearCache() {
  if (!window.confirm(t("confirmClearCache"))) return;
  showStatus(t("statusClearing"));
  try {
    await api("/api/library/cache/clear", { method: "POST" });
    showToast(t("toastCacheCleared"));
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
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
    ["vbook-col-name", "vbookColName"],
    ["vbook-col-meta", "vbookColMeta"],
    ["vbook-col-action", "vbookColAction"],
    ["vbook-repo-title", "vbookRepoTitle"],
    ["btn-vbook-refresh-repo", "vbookRefreshRepo"],
    ["vbook-repo-label", "vbookRepoLabel"],
    ["vbook-repo-custom-label", "vbookRepoCustomLabel"],
    ["btn-vbook-load-custom-repo", "vbookRepoCustomLoad"],
    ["btn-vbook-add-repo", "vbookRepoAdd"],
    ["btn-vbook-remove-repo", "vbookRepoRemove"],
    ["btn-vbook-save-repos", "vbookRepoSave"],
    ["vbook-repo-col-name", "vbookRepoColName"],
    ["vbook-repo-col-meta", "vbookRepoColMeta"],
    ["vbook-repo-col-action", "vbookRepoColAction"],
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
    vbook: {
      installed: [],
      repoUrls: [],
      repoPlugins: [],
      repoErrors: [],
      activeRepoUrl: "",
      globalSettings: {
        request_delay_ms: 0,
        download_threads: 4,
        prefetch_unread_count: 2,
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
    qs("settings-form").addEventListener("submit", (event) => {
      event.preventDefault();
      state.settings.fontFamily = (fontFamilySelect && fontFamilySelect.value) || DEFAULT_SETTINGS.fontFamily;
      state.settings.starStyle = (starStyleSelect && starStyleSelect.value) || DEFAULT_SETTINGS.starStyle;
      state.settings.backgroundMotion = (backgroundMotionSelect && backgroundMotionSelect.value) || DEFAULT_SETTINGS.backgroundMotion;
      state.settings.textAlign = (textAlignSelect && textAlignSelect.value) || DEFAULT_SETTINGS.textAlign;
      state.settings.readingMode = (readingModeSelect && readingModeSelect.value) || DEFAULT_SETTINGS.readingMode;
      state.settings.panelTransparency = normalizePanelTransparency((panelTransparencySelect && panelTransparencySelect.value) || DEFAULT_SETTINGS.panelTransparency);
      state.settings.miniBarsEnabled = (miniBarsEnabledSelect && miniBarsEnabledSelect.value) !== "off";
      applyTheme(state.themes, state.settings);
      applyPanelStyle(state.settings);
      applyReaderVars(state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
      showToast(t("toastSettingsSaved"));
      closeSettings();
    });
  }

  if (qs("btn-reset-settings")) {
    qs("btn-reset-settings").addEventListener("click", () => {
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
      applyTheme(state.themes, state.settings);
      applyPanelStyle(state.settings);
      applyReaderVars(state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
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
    };
  };

  const fillVbookGlobalForm = () => {
    const cfg = normalizeVbookGlobalSettings(state.vbook.globalSettings || {});
    state.vbook.globalSettings = cfg;
    if (vbookGlobalDelayInput) vbookGlobalDelayInput.value = String(cfg.request_delay_ms);
    if (vbookGlobalThreadsInput) vbookGlobalThreadsInput.value = String(cfg.download_threads);
    if (vbookGlobalPrefetchInput) vbookGlobalPrefetchInput.value = String(cfg.prefetch_unread_count);
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
    const body = qs("vbook-installed-body");
    if (!body) return;
    body.innerHTML = "";
    const items = Array.isArray(state.vbook.installed) ? state.vbook.installed : [];
    if (!items.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 3;
      td.className = "empty-text";
      td.textContent = t("vbookNoInstalledPlugins");
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }
    for (const item of items) {
      const tr = document.createElement("tr");

      const tdName = document.createElement("td");
      const name = document.createElement("div");
      name.className = "vbook-repo-item-name";
      const pluginName = String(item.name || item.plugin_id || t("vbookUnknownPlugin")).trim() || t("vbookUnknownPlugin");
      name.textContent = pluginName;
      const pid = document.createElement("div");
      pid.className = "vbook-repo-item-sub";
      pid.textContent = String(item.plugin_id || "").trim();
      tdName.append(name, pid);

      const tdMeta = document.createElement("td");
      tdMeta.textContent = formatPluginMeta(item) || "-";

      const tdAction = document.createElement("td");
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
          await loadInstalledVbookPlugins({ silent: true });
          await loadRepoPlugins({ silent: true });
        } catch (error) {
          showToast(error.message || t("toastError"));
        } finally {
          hideStatus();
        }
      });
      tdAction.appendChild(btnRemove);

      tr.append(tdName, tdMeta, tdAction);
      body.appendChild(tr);
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
    const body = qs("vbook-repo-body");
    if (!body) return;
    body.innerHTML = "";
    const items = Array.isArray(state.vbook.repoPlugins) ? state.vbook.repoPlugins : [];
    if (!items.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 3;
      td.className = "empty-text";
      td.textContent = t("vbookNoRepoPlugins");
      tr.appendChild(td);
      body.appendChild(tr);
      renderRepoErrors();
      return;
    }
    for (const item of items) {
      const tr = document.createElement("tr");

      const tdName = document.createElement("td");
      const name = document.createElement("div");
      name.className = "vbook-repo-item-name";
      name.textContent = String(item.name || item.plugin_id || t("vbookUnknownPlugin")).trim() || t("vbookUnknownPlugin");
      tdName.appendChild(name);
      const desc = String(item.description || "").trim();
      if (desc) {
        const sub = document.createElement("div");
        sub.className = "vbook-repo-item-sub";
        sub.textContent = desc;
        tdName.appendChild(sub);
      }

      const tdMeta = document.createElement("td");
      const metaParts = [];
      const pluginUrl = String(item.plugin_url || "").trim();
      const repoUrl = String(item.repo_url || "").trim();
      const pluginMeta = formatPluginMeta(item);
      if (pluginMeta) metaParts.push(pluginMeta);
      if (repoUrl) {
        try {
          metaParts.push(new URL(repoUrl).host || repoUrl);
        } catch {
          metaParts.push(repoUrl);
        }
      }
      tdMeta.textContent = metaParts.join(" • ") || "-";
      if (pluginUrl) {
        const sub = document.createElement("div");
        sub.className = "vbook-repo-item-sub";
        sub.textContent = pluginUrl;
        tdMeta.appendChild(sub);
      }

      const tdAction = document.createElement("td");
      const installed = Boolean(item.installed);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-small";
      if (installed) {
        btn.textContent = t("vbookInstalledBadge");
        btn.disabled = true;
      } else if (!pluginUrl) {
        btn.textContent = t("vbookNoDownloadUrl");
        btn.disabled = true;
      } else {
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
      tdAction.appendChild(btn);

      tr.append(tdName, tdMeta, tdAction);
      body.appendChild(tr);
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

  async function loadInstalledVbookPlugins({ silent = false } = {}) {
    if (!pluginSelect && !qs("vbook-installed-body")) return [];
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
    if (!qs("vbook-repo-body")) return [];
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

  if (qs("btn-vbook-refresh-repo")) {
    qs("btn-vbook-refresh-repo").addEventListener("click", async () => {
      await loadRepoUrls({ silent: true });
      await loadRepoPlugins();
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
    getVbookSettings: (pluginId = "") => runtimeEffectiveSettings(pluginId),
    getVbookGlobalSettings: () => normalizeVbookGlobalSettings(state.vbook.globalSettings || {}),
    refreshVbookSettings: (pluginId = "") => refreshVbookRuntimeSettings({ silent: true, pluginId }),
    goSearchPage,
  };
}
