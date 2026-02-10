import { t } from "../i18n.vi.js?v=20260210-r13";

const SETTINGS_KEY = "reader.ui.settings.v3";
const THEME_CACHE_KEY = "reader.ui.theme.cache.v1";
const DEFAULT_SETTINGS = {
  themeId: "sao_dem",
  fontFamily: "'Noto Serif', 'Palatino Linotype', 'Times New Roman', serif",
  fontSize: 21,
  textAlign: "justify",
  lineHeight: 1.9,
  paragraphSpacing: 1.1,
  readingMode: "vertical",
  panelTransparency: "clear",
  starStyle: "classic",
  backgroundMotion: "on",
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
    throw new Error((payload && payload.message) || `HTTP ${res.status}`);
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
    book: "nav-library",
    reader: "nav-library",
  };
  const allIds = ["nav-library", "nav-search"];
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
    ["btn-go-search", "search"],
    ["btn-import", "import"],
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
      applyTheme(state.themes, state.settings);
      applyPanelStyle(state.settings);
      applyReaderVars(state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
      showToast(t("toastSettingsReset"));
    });
  }

  if (qs("btn-import")) qs("btn-import").addEventListener("click", () => qs("import-dialog") && qs("import-dialog").showModal());
  if (qs("btn-import-cancel")) qs("btn-import-cancel").addEventListener("click", () => qs("import-dialog") && qs("import-dialog").close());
  if (qs("import-form")) {
    qs("import-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      await handleImport(onImported);
    });
  }

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
    goSearchPage,
  };
}
