import { t } from "../i18n.vi.js?v=20260421-serverbatch1";

const UI_RUNTIME_VERSION = "0.1.5";
const SETTINGS_KEY = "reader.ui.settings.v3";
const THEME_CACHE_KEY = "reader.ui.theme.cache.v1";
const CUSTOM_THEMES_KEY = "reader.ui.custom.themes.v1";
const CUSTOM_THEME_PREFIX = "custom_theme_";
const READER_UPDATE_POPUP_HIDE_KEY = "reader.ui.update_popup.hide.v1";
const READER_UPDATE_POPUP_SESSION_KEY = "reader.ui.update_popup.session.v1";
const READER_UPDATE_POPUP_HIDE_MS = 2 * 60 * 60 * 1000;
const DEFAULT_SETTINGS = {
  themeId: "sao_dem",
  miniBarsScale: 1,
  tocSide: "left",
  comicEdgeTintEnabled: false,
  comicEdgeTintStrength: 28,
  themeCustomEnabled: false,
  themeCustomBg: "",
  themeCustomBg2: "",
  themeCustomSurface: "",
  themeCustomSurfaceAlt: "",
  themeCustomText: "",
  themeCustomMuted: "",
  themeCustomAccent: "",
  themeCustomGlow: "",
  fontFamily: "'Noto Serif', 'Palatino Linotype', 'Times New Roman', serif",
  fontSize: 21,
  textAlign: "justify",
  lineHeight: 1.9,
  paragraphSpacing: 1.1,
  textIndent: 1.0,
  readingMode: "hybrid",
  panelTransparency: "clear",
  starStyle: "classic",
  backgroundMotion: "on",
  miniBarsEnabled: true,
  translationEnabled: true,
  translationMode: "local",
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
const SIM_LOCAL_TRANSLATION_MODE = "dichngay_local";

const SERVER_TRANSLATION_DEFAULT = {
  delayMs: 250,
  maxChars: 9000,
  retryCount: 2,
  timeoutSec: 60,
  retryBackoffMs: 700,
};

const FONT_PRESETS = [
  { id: "serif", text: "'Noto Serif', 'Palatino Linotype', 'Times New Roman', serif", labelKey: "fontPresetSerif" },
  { id: "sans", text: "'Be Vietnam Pro', 'Segoe UI', Tahoma, sans-serif", labelKey: "fontPresetSans" },
  { id: "book", text: "'Merriweather', 'Noto Serif', serif", labelKey: "fontPresetBook" },
  { id: "mono", text: "'JetBrains Mono', 'Fira Code', monospace", labelKey: "fontPresetMono" },
];

const THEME_CUSTOM_FIELDS = [
  { token: "bg", settingKey: "themeCustomBg", labelKey: "themeCustomBg", inputId: "theme-custom-bg-input", valueId: "theme-custom-bg-value" },
  { token: "bg2", settingKey: "themeCustomBg2", labelKey: "themeCustomBg2", inputId: "theme-custom-bg2-input", valueId: "theme-custom-bg2-value" },
  { token: "surface", settingKey: "themeCustomSurface", labelKey: "themeCustomSurface", inputId: "theme-custom-surface-input", valueId: "theme-custom-surface-value" },
  { token: "surface_alt", settingKey: "themeCustomSurfaceAlt", labelKey: "themeCustomSurfaceAlt", inputId: "theme-custom-surface-alt-input", valueId: "theme-custom-surface-alt-value" },
  { token: "text", settingKey: "themeCustomText", labelKey: "themeCustomText", inputId: "theme-custom-text-input", valueId: "theme-custom-text-value" },
  { token: "muted", settingKey: "themeCustomMuted", labelKey: "themeCustomMuted", inputId: "theme-custom-muted-input", valueId: "theme-custom-muted-value" },
  { token: "accent", settingKey: "themeCustomAccent", labelKey: "themeCustomAccent", inputId: "theme-custom-accent-input", valueId: "theme-custom-accent-value" },
  { token: "glow", settingKey: "themeCustomGlow", labelKey: "themeCustomGlow", inputId: "theme-custom-glow-input", valueId: "theme-custom-glow-value" },
];

const EFFECT_CLASSES = ["effect-stars", "effect-sparkle", "effect-bubbles", "effect-leaves", "effect-snow"];
const STAR_STYLE_CLASSES = ["star-style-classic", "star-style-dense", "star-style-bling"];
const PANEL_STYLE_CLASSES = ["panel-style-clear", "panel-style-balanced", "panel-style-solid"];
let cacheManagerUi = null;
let actionModalUi = null;
let toastHideTimer = 0;
let lastStatusToast = { msg: "", ts: 0 };

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

function normalizeHexColor(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    const chars = raw.slice(1).split("");
    return `#${chars.map((ch) => ch + ch).join("")}`.toLowerCase();
  }
  return "";
}

function normalizeThemeTokens(raw) {
  const src = (raw && typeof raw === "object") ? raw : {};
  const out = {};
  for (const [key, value] of Object.entries(src)) {
    const text = String(value || "").trim();
    if (!text) continue;
    out[String(key)] = text;
  }
  return out;
}

function normalizeCustomThemeRecord(raw, fallbackId = "") {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || fallbackId || "").trim();
  const name = String(raw.name || "").trim();
  const tokens = normalizeThemeTokens(raw.tokens);
  if (!id || !name || !Object.keys(tokens).length) return null;
  return {
    id,
    name,
    effect: String(raw.effect || "stars").trim() || "stars",
    baseThemeId: String(raw.baseThemeId || "").trim(),
    tokens,
    isCustom: true,
  };
}

function loadCustomThemes() {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, idx) => normalizeCustomThemeRecord(item, `${CUSTOM_THEME_PREFIX}${idx + 1}`))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function saveCustomThemes(themes) {
  try {
    const safe = (Array.isArray(themes) ? themes : [])
      .map((item, idx) => normalizeCustomThemeRecord(item, `${CUSTOM_THEME_PREFIX}${idx + 1}`))
      .filter(Boolean);
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(safe));
  } catch {
    // ignore
  }
}

function isCustomThemeId(themeId) {
  return String(themeId || "").trim().startsWith(CUSTOM_THEME_PREFIX);
}

function mergeThemeLists(serverThemes, customThemes) {
  const merged = [];
  const seen = new Set();
  for (const row of [...(Array.isArray(serverThemes) ? serverThemes : []), ...(Array.isArray(customThemes) ? customThemes : [])]) {
    if (!row || typeof row !== "object") continue;
    const id = String(row.id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    merged.push(row);
  }
  return merged;
}

function findThemeById(themes, themeId) {
  return (Array.isArray(themes) ? themes : []).find((row) => String(row && row.id || "") === String(themeId || "")) || null;
}

function nextCustomThemeDefaultName(themes) {
  const used = new Set(
    (Array.isArray(themes) ? themes : [])
      .map((item) => String(item && item.name || "").trim())
      .filter(Boolean),
  );
  let index = 1;
  while (used.has(t("themeCustomDefaultName", { n: index }))) index += 1;
  return t("themeCustomDefaultName", { n: index });
}

function createCustomThemeRecordFromBase(baseTheme, themes, { name = "", tokens = null } = {}) {
  const base = baseTheme && typeof baseTheme === "object" ? baseTheme : loadThemeCache();
  if (!base) return null;
  const id = `${CUSTOM_THEME_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const finalName = String(name || "").trim() || nextCustomThemeDefaultName(themes);
  return {
    id,
    name: finalName,
    effect: String(base.effect || "stars").trim() || "stars",
    baseThemeId: String(base.baseThemeId || base.id || "").trim(),
    tokens: normalizeThemeTokens(tokens || base.tokens || {}),
    isCustom: true,
  };
}

function buildThemeCustomizerMarkup() {
  const colorControls = THEME_CUSTOM_FIELDS.map((field) => (
    `<label class="theme-color-control">
      <span>${t(field.labelKey)}</span>
      <div class="theme-color-row">
        <input id="${field.inputId}" type="color">
        <code id="${field.valueId}"></code>
      </div>
    </label>`
  )).join("");
  return (
    `<fieldset id="theme-custom-section" class="theme-custom-section">
      <legend>${t("themeCustomLegend")}</legend>
      <label id="theme-custom-name-wrap" class="theme-custom-name-wrap" hidden>
        <span>${t("themeCustomName")}</span>
        <input id="theme-custom-name-input" type="text" spellcheck="false" maxlength="80">
      </label>
      <div class="theme-custom-actions">
        <button id="btn-theme-custom-create" class="btn btn-small" type="button">${t("themeCustomCreate")}</button>
        <button id="btn-theme-custom-delete" class="btn btn-small" type="button" hidden>${t("themeCustomDelete")}</button>
        <button id="btn-theme-custom-reset" class="btn btn-small" type="button">${t("themeCustomReset")}</button>
      </div>
      <p id="theme-custom-hint" class="theme-custom-hint">${t("themeCustomHint")}</p>
      <div id="theme-custom-grid" class="theme-custom-grid">${colorControls}</div>
    </fieldset>`
  );
}

function buildReaderSettingsExtrasMarkup() {
  return (
    `<label id="mini-bars-scale-wrap">
      <span>${t("miniBarsScale")}</span>
      <input id="mini-bars-scale-input" type="range" min="0.8" max="1.8" step="0.05">
      <small id="mini-bars-scale-value"></small>
    </label>
    <label id="toc-side-wrap">
      <span>${t("tocSide")}</span>
      <select id="toc-side-select">
        <option value="left">${t("tocSideLeft")}</option>
        <option value="right">${t("tocSideRight")}</option>
      </select>
    </label>
    <label id="comic-edge-tint-enabled-wrap">
      <span>${t("comicEdgeTintEnabled")}</span>
      <select id="comic-edge-tint-enabled-select">
        <option value="off">${t("comicEdgeTintOff")}</option>
        <option value="on">${t("comicEdgeTintOn")}</option>
      </select>
    </label>
    <label id="comic-edge-tint-strength-wrap">
      <span>${t("comicEdgeTintStrength")}</span>
      <input id="comic-edge-tint-strength-input" type="range" min="0" max="100" step="1">
      <small id="comic-edge-tint-strength-value"></small>
    </label>`
  );
}

function buildTitleCacheSettingMarkup() {
  return (
    `<label id="title-cache-auto-wrap">
      <span id="label-title-cache-auto">${t("titleCacheAutoLabel")}</span>
      <select id="title-cache-auto-select">
        <option id="title-cache-auto-on" value="on">${t("titleCacheAutoOn")}</option>
        <option id="title-cache-auto-off" value="off">${t("titleCacheAutoOff")}</option>
      </select>
    </label>`
  );
}

function appendExistingNodes(parent, nodes) {
  for (const node of nodes) {
    if (!node) continue;
    parent.appendChild(node);
  }
}

function buildSettingsSection(title, nodes, { open = false } = {}) {
  const section = document.createElement("details");
  section.className = "settings-section";
  if (open) section.open = true;
  const summary = document.createElement("summary");
  summary.className = "settings-section-title";
  summary.textContent = title;
  const body = document.createElement("div");
  body.className = "settings-section-body";
  appendExistingNodes(body, nodes);
  section.append(summary, body);
  return section;
}

function insertMarkupAfter(referenceNode, markup) {
  if (!referenceNode || !referenceNode.parentNode) return;
  const host = document.createElement("div");
  host.innerHTML = markup.trim();
  const nodes = Array.from(host.children);
  let cursor = referenceNode;
  for (const node of nodes) {
    cursor.insertAdjacentElement("afterend", node);
    cursor = node;
  }
}

function ensureSettingsEnhancements(settingsForm) {
  if (!settingsForm) return;
  const themeSelect = qs("theme-select");
  const themeLabel = themeSelect && themeSelect.closest("label");
  if (themeLabel && !qs("theme-custom-section")) {
    insertMarkupAfter(themeLabel, buildThemeCustomizerMarkup());
  }
  const miniBarsLabel = qs("mini-bars-enabled-select") && qs("mini-bars-enabled-select").closest("label");
  if (miniBarsLabel && !qs("mini-bars-scale-input")) {
    insertMarkupAfter(miniBarsLabel, buildReaderSettingsExtrasMarkup());
  }
  const translationModeLabel = qs("translation-mode-select") && qs("translation-mode-select").closest("label");
  if (translationModeLabel && !qs("title-cache-auto-wrap")) {
    insertMarkupAfter(translationModeLabel, buildTitleCacheSettingMarkup());
  }
  if (settingsForm.dataset.sectionized === "1") return;
  const groups = [
    {
      title: t("settingsSectionTheme"),
      open: true,
      nodes: [
        themeLabel,
        qs("theme-custom-section"),
        qs("panel-transparency-select") && qs("panel-transparency-select").closest("label"),
        qs("star-style-select") && qs("star-style-select").closest("label"),
        qs("background-motion-select") && qs("background-motion-select").closest("label"),
      ],
    },
    {
      title: t("settingsSectionTypography"),
      nodes: [
        qs("font-family-select") && qs("font-family-select").closest("label"),
        qs("font-size-input") && qs("font-size-input").closest("label"),
        qs("text-align-select") && qs("text-align-select").closest("label"),
        qs("line-height-input") && qs("line-height-input").closest("label"),
        qs("paragraph-spacing-input") && qs("paragraph-spacing-input").closest("label"),
        qs("text-indent-input") && qs("text-indent-input").closest("label"),
        qs("reading-mode-select") && qs("reading-mode-select").closest("label"),
      ],
    },
    {
      title: t("settingsSectionReaderUi"),
      nodes: [
        qs("mini-bars-enabled-select") && qs("mini-bars-enabled-select").closest("label"),
        qs("mini-bars-scale-wrap"),
        qs("toc-side-wrap"),
        qs("comic-edge-tint-enabled-wrap"),
        qs("comic-edge-tint-strength-wrap"),
      ],
    },
    {
      title: t("settingsSectionTranslation"),
      nodes: [
        qs("translation-enabled-select") && qs("translation-enabled-select").closest("label"),
        qs("translation-mode-select") && qs("translation-mode-select").closest("label"),
        qs("title-cache-auto-wrap"),
        qs("server-translation-settings"),
        qs("local-translation-settings"),
      ],
    },
  ];
  const actions = settingsForm.querySelector(".settings-actions");
  for (const section of groups) {
    const realNodes = section.nodes.filter((node) => node && settingsForm.contains(node));
    if (!realNodes.length) continue;
    settingsForm.appendChild(buildSettingsSection(section.title, realNodes, { open: section.open }));
  }
  if (actions && settingsForm.contains(actions)) settingsForm.appendChild(actions);
  settingsForm.dataset.sectionized = "1";
}

function debounceAsync(fn, wait = 250) {
  let timer = 0;
  let queuedArgs = [];
  let pending = [];
  let inFlight = Promise.resolve();
  return (...args) => new Promise((resolve, reject) => {
    queuedArgs = args;
    pending.push({ resolve, reject });
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = 0;
      const listeners = pending.splice(0, pending.length);
      const run = async () => fn(...queuedArgs);
      const task = inFlight.then(run, run);
      inFlight = task.catch(() => {});
      task.then(
        (result) => {
          for (const item of listeners) item.resolve(result);
        },
        (error) => {
          for (const item of listeners) item.reject(error);
        },
      );
    }, wait);
  });
}

function emitSettingsChanged(settings) {
  window.dispatchEvent(new CustomEvent("reader-settings-changed", { detail: { ...settings } }));
}

function emitCacheChanged(detail = {}) {
  window.dispatchEvent(new CustomEvent("reader-cache-changed", { detail: { ...(detail || {}) } }));
}

function extractApiObjectMessage(source) {
  if (!source || typeof source !== "object") return "";
  const lines = [];
  const push = (value) => {
    const text = String(value || "").trim();
    if (!text || lines.includes(text)) return;
    lines.push(text);
  };
  push(source.display_message);
  push(source.user_message);
  push(source.hint);
  push(source.message);
  const nestedError = source.error;
  if (typeof nestedError === "string") {
    push(nestedError);
  } else if (nestedError && typeof nestedError === "object") {
    push(nestedError.display_message);
    push(nestedError.user_message);
    push(nestedError.hint);
    push(nestedError.message);
  }
  return lines.join("\n");
}

function extractApiErrorDetailText(details) {
  if (typeof details === "string") return details.trim();
  if (details == null) return "";
  if (typeof details !== "object") return String(details);
  const direct = extractApiObjectMessage(details);
  if (direct) return direct;
  const result = details.result;
  if (result && typeof result === "object") {
    const nested = extractApiObjectMessage(result);
    if (nested) return nested;
  }
  return "";
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
    const detailText = extractApiErrorDetailText(err.details);
    err.displayMessage = detailText && detailText !== baseMessage
      ? `${baseMessage}\n${detailText}`
      : baseMessage;
    throw err;
  }
  return payload;
}

function readReaderUpdatePopupHideState() {
  try {
    const raw = localStorage.getItem(READER_UPDATE_POPUP_HIDE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const contentSig = String(parsed.content_sig || "").trim();
    const hideUntilTs = Math.max(0, Number(parsed.hide_until_ts || 0));
    if (!contentSig || !(hideUntilTs > 0)) return null;
    return { contentSig, hideUntilTs };
  } catch {
    return null;
  }
}

function writeReaderUpdatePopupHideState(contentSig, hideUntilTs) {
  try {
    localStorage.setItem(READER_UPDATE_POPUP_HIDE_KEY, JSON.stringify({
      content_sig: String(contentSig || "").trim(),
      hide_until_ts: Math.max(0, Number(hideUntilTs || 0)),
    }));
  } catch {
    // ignore
  }
}

function markReaderUpdatePopupSeenThisSession(contentSig) {
  try {
    sessionStorage.setItem(READER_UPDATE_POPUP_SESSION_KEY, String(contentSig || "").trim());
  } catch {
    // ignore
  }
}

function hasSeenReaderUpdatePopupThisSession(contentSig) {
  try {
    return String(sessionStorage.getItem(READER_UPDATE_POPUP_SESSION_KEY) || "").trim() === String(contentSig || "").trim();
  } catch {
    return false;
  }
}

function showToast(msg) {
  const toast = qs("toast");
  if (!toast) return;
  const openDialogs = Array.from(document.querySelectorAll("dialog[open]"));
  const host = openDialogs.length ? openDialogs[openDialogs.length - 1] : document.body;
  if (host && toast.parentElement !== host) {
    host.appendChild(toast);
  }
  toast.classList.toggle("toast-in-dialog", Boolean(host && host.tagName === "DIALOG"));
  toast.textContent = msg;
  toast.classList.add("show");
  if (toastHideTimer) {
    window.clearTimeout(toastHideTimer);
    toastHideTimer = 0;
  }
  toastHideTimer = window.setTimeout(() => {
    toast.classList.remove("show");
    toastHideTimer = 0;
  }, 2600);
}

function showStatus(msg) {
  const bar = qs("status-inline");
  if (bar) {
    bar.textContent = "";
    bar.classList.remove("active");
    bar.setAttribute("aria-busy", "false");
  }
  const text = String(msg || "").trim();
  if (!text) return;
  const now = Date.now();
  if (lastStatusToast.msg === text && (now - lastStatusToast.ts) < 700) return;
  lastStatusToast = { msg: text, ts: now };
  showToast(text);
}

function hideStatus() {
  const bar = qs("status-inline");
  if (!bar) return;
  bar.textContent = "";
  bar.classList.remove("active");
  bar.setAttribute("aria-busy", "false");
}

function formatLocalDateTime(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatRelativeTime(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 10) return "Vừa xong";
  if (diffSec < 60) return `${diffSec}s trước`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return formatLocalDateTime(raw);
}

function normalizeNotificationStatus(status) {
  const raw = String(status || "").trim().toLowerCase();
  if (raw === "queued" || raw === "running" || raw === "active" || raw === "progress") return "running";
  if (raw === "success" || raw === "completed" || raw === "done") return "success";
  if (raw === "failed" || raw === "error") return "failed";
  if (raw === "warning" || raw === "stopped" || raw === "cancelled" || raw === "canceled") return "warning";
  return "info";
}

function notificationStatusLabel(status) {
  const normalized = normalizeNotificationStatus(status);
  if (normalized === "running") return t("notificationStatusRunning");
  if (normalized === "success") return t("notificationStatusSuccess");
  if (normalized === "failed") return t("notificationStatusFailed");
  if (normalized === "warning") return t("notificationStatusWarning");
  return t("notificationStatusInfo");
}

function buildNotificationBellSvg() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 22a2.6 2.6 0 0 0 2.45-1.75h-4.9A2.6 2.6 0 0 0 12 22Zm6.25-5.25H5.75l1.44-1.64c.5-.57.78-1.3.78-2.06V10.5A4.05 4.05 0 0 1 11.25 6.6V5.75a.75.75 0 0 1 1.5 0v.85a4.05 4.05 0 0 1 3.28 3.9v2.55c0 .76.28 1.49.78 2.06l1.44 1.64ZM12 8.1a2.55 2.55 0 0 0-2.53 2.4v2.55c0 1.12-.41 2.18-1.14 3H14.67c-.73-.82-1.14-1.88-1.14-3V10.5A2.55 2.55 0 0 0 12 8.1Z"></path>
    </svg>
  `.trim();
}

function applyReaderVars(settings) {
  const root = document.documentElement;
  root.style.setProperty("--reader-font-family", settings.fontFamily);
  root.style.setProperty("--reader-font-size", `${settings.fontSize}px`);
  root.style.setProperty("--reader-line-height", `${settings.lineHeight}`);
  root.style.setProperty("--reader-paragraph-spacing", `${settings.paragraphSpacing}em`);
  root.style.setProperty("--reader-text-indent", `${settings.textIndent}em`);
  root.style.setProperty("--reader-text-align", settings.textAlign);
  root.style.setProperty("--reader-mini-scale", `${normalizeMiniBarsScale(settings.miniBarsScale)}`);
  const comicEdgeTintStrength = normalizeComicEdgeTintStrength(settings.comicEdgeTintStrength);
  const comicEdgeTintEnabled = settings.comicEdgeTintEnabled === true;
  root.style.setProperty("--reader-comic-edge-tint-opacity", comicEdgeTintEnabled ? `${(comicEdgeTintStrength / 100).toFixed(2)}` : "0");
  applyReaderTocSide(settings);
}

function normalizePanelTransparency(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "clear" || v === "balanced" || v === "solid") return v;
  return "balanced";
}

function normalizeTranslationMode(value) {
  const mode = String(value || "").trim().toLowerCase();
  if (mode === "local") return "local";
  if (mode === SIM_LOCAL_TRANSLATION_MODE) return SIM_LOCAL_TRANSLATION_MODE;
  if (mode === "hanviet") return "hanviet";
  return "server";
}

function isLocalLikeTranslationMode(value) {
  const mode = normalizeTranslationMode(value);
  return mode === "local" || mode === "hanviet" || mode === SIM_LOCAL_TRANSLATION_MODE;
}

function localTranslationStateKey(value) {
  const mode = normalizeTranslationMode(value);
  if (mode === SIM_LOCAL_TRANSLATION_MODE) return "readerTranslationSimLocal";
  if (mode === "hanviet") return "readerTranslationHanviet";
  return "readerTranslationLocal";
}

function normalizeMiniBarsScale(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 1;
  if (num < 0.8) return 0.8;
  if (num > 1.8) return 1.8;
  return Math.round(num * 100) / 100;
}

function normalizeTocSide(value) {
  return String(value || "").trim().toLowerCase() === "right" ? "right" : "left";
}

function normalizeComicEdgeTintStrength(value) {
  const num = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(num)) return 28;
  if (num < 0) return 0;
  if (num > 100) return 100;
  return num;
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

function normalizeServerTranslationSettings(raw) {
  const src = (raw && typeof raw === "object") ? raw : {};
  const toInt = (value, fallback, min, max) => {
    const n = Number.parseInt(String(value ?? ""), 10);
    if (!Number.isFinite(n)) return fallback;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  };
  return {
    delayMs: toInt(src.delayMs, SERVER_TRANSLATION_DEFAULT.delayMs, 0, 10000),
    maxChars: toInt(src.maxChars, SERVER_TRANSLATION_DEFAULT.maxChars, 500, 9000),
    retryCount: toInt(src.retryCount, SERVER_TRANSLATION_DEFAULT.retryCount, 0, 8),
    timeoutSec: toInt(src.timeoutSec, SERVER_TRANSLATION_DEFAULT.timeoutSec, 10, 180),
    retryBackoffMs: toInt(src.retryBackoffMs, SERVER_TRANSLATION_DEFAULT.retryBackoffMs, 100, 5000),
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

function applyReaderTocSide(settings) {
  const side = normalizeTocSide(settings && settings.tocSide);
  if (settings) settings.tocSide = side;
  document.documentElement.dataset.readerTocSide = side;
  if (document.body) document.body.dataset.readerTocSide = side;
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
  const theme = findThemeById(themes, settings.themeId) || themes[0] || loadThemeCache();
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
  if (isCustomThemeId(themeId)) return;
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
    "online-search": "nav-explore",
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
  const notificationId = `import_file_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const form = new FormData();
  form.set("file", file);
  form.set("lang_source", (qs("import-lang") && qs("import-lang").value) || "zh");
  form.set("title", (qs("import-book-title") && qs("import-book-title").value) || "");
  form.set("author", (qs("import-author") && qs("import-author").value) || "");

  showStatus(t("statusImporting"));
  try {
    await api("/api/notifications/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: notificationId,
        kind: "import_file",
        topic: "import",
        topic_label: "Nhập vào thư viện",
        title: "Nhập file vào thư viện",
        preview: `Đang nhập: ${String(file.name || "").trim() || "Tệp mới"}`,
        detail: `Tệp: ${String(file.name || "").trim() || "Không rõ"}`,
        status: "running",
        progress_current: 0,
        progress_total: 1,
        progress_percent: 0,
      }),
    }).catch(() => {});
    const data = await api("/api/library/import", { method: "POST", body: form });
    if (qs("import-form")) qs("import-form").reset();
    if (qs("import-dialog") && qs("import-dialog").open) qs("import-dialog").close();
    await api("/api/notifications/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: notificationId,
        kind: "import_file",
        topic: "import",
        topic_label: "Nhập vào thư viện",
        title: "Nhập file vào thư viện",
        preview: "Hoàn tất: thành công 1 • lỗi 0",
        detail: `Tệp: ${String(file.name || "").trim() || "Không rõ"}\nKết quả: thành công 1 • lỗi 0`,
        status: "success",
        progress_current: 1,
        progress_total: 1,
        progress_percent: 100,
        book_id: String((data && data.book && data.book.book_id) || "").trim(),
        book_title: String((data && data.book && (data.book.title_display || data.book.title)) || "").trim(),
      }),
    }).catch(() => {});
    showToast(t("toastImportSuccess"));
    if (typeof onImported === "function") {
      onImported(data);
    }
  } catch (error) {
    await api("/api/notifications/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: notificationId,
        kind: "import_file",
        topic: "import",
        topic_label: "Nhập vào thư viện",
        title: "Nhập file vào thư viện",
        preview: `Thất bại: ${String(file.name || "").trim() || "Tệp import"}`,
        detail: `Tệp: ${String(file.name || "").trim() || "Không rõ"}\nLỗi: ${error.message || t("toastError")}`,
        status: "failed",
        progress_current: 1,
        progress_total: 1,
        progress_percent: 100,
      }),
    }).catch(() => {});
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

async function handleImportUrl(onImported, onImportUrl) {
  const input = qs("import-url-input");
  const url = input ? String(input.value || "").trim() : "";
  if (!url) return;
  const pluginSelect = qs("import-url-plugin");
  const pluginId = pluginSelect ? String(pluginSelect.value || "").trim() : "";
  const notificationId = `import_url_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const helpers = {
    url,
    pluginId,
    resetForm() {
      if (qs("import-url-form")) qs("import-url-form").reset();
    },
    closeDialog() {
      if (qs("import-url-dialog") && qs("import-url-dialog").open) qs("import-url-dialog").close();
    },
  };

  if (typeof onImportUrl === "function") {
    await onImportUrl(helpers);
    return;
  }

  showStatus(t("statusImportingUrl"));
  try {
    await api("/api/notifications/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: notificationId,
        kind: "import_url",
        topic: "import",
        topic_label: "Nhập bằng URL",
        title: "Nhập truyện bằng URL",
        preview: `Đang lấy thông tin: ${url}`,
        detail: `URL: ${url}\nPlugin: ${pluginId || "Tự nhận diện"}`,
        status: "running",
      }),
    }).catch(() => {});
    const data = await api("/api/library/import-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, plugin_id: pluginId || "" }),
    });
    helpers.resetForm();
    helpers.closeDialog();
    await api("/api/notifications/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: notificationId,
        kind: "import_url",
        topic: "import",
        topic_label: "Nhập bằng URL",
        title: "Nhập truyện bằng URL",
        preview: "Hoàn tất: thành công 1 • lỗi 0",
        detail: `URL: ${url}\nTên truyện: ${String((data && data.book && (data.book.title_display || data.book.title)) || "").trim() || "Không rõ"}\nKết quả: thành công 1 • lỗi 0`,
        status: "success",
        book_id: String((data && data.book && data.book.book_id) || "").trim(),
        book_title: String((data && data.book && (data.book.title_display || data.book.title)) || "").trim(),
      }),
    }).catch(() => {});
    showToast(t("toastImportSuccess"));
    if (typeof onImported === "function") {
      onImported(data);
    }
  } catch (error) {
    await api("/api/notifications/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: notificationId,
        kind: "import_url",
        topic: "import",
        topic_label: "Nhập bằng URL",
        title: "Nhập truyện bằng URL",
        preview: `Thất bại: ${url}`,
        detail: `URL: ${url}\nLỗi: ${error.message || t("toastError")}`,
        status: "failed",
      }),
    }).catch(() => {});
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

const NOTICE_MARKDOWN_CALLOUT_META = {
  new: { label: "Mới", tone: "new" },
  fix: { label: "Đã sửa", tone: "fix" },
  tip: { label: "Mẹo", tone: "tip" },
  warn: { label: "Lưu ý", tone: "warn" },
  warning: { label: "Lưu ý", tone: "warn" },
  info: { label: "Thông tin", tone: "info" },
  note: { label: "Thông tin", tone: "info" },
  guide: { label: "Hướng dẫn", tone: "guide" },
};

function escapeNoticeMarkdownHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeNoticeMarkdownUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("#")) return raw;
  try {
    const parsed = new URL(raw, window.location.href);
    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) return parsed.href;
  } catch {
    return "";
  }
  return "";
}

function renderNoticeMarkdownInline(value) {
  const tokens = [];
  const makeToken = (html) => {
    const token = `@@NOTICE_TOKEN_${tokens.length}@@`;
    tokens.push(html);
    return token;
  };
  let text = String(value || "").replace(/\r\n?/g, "\n");
  text = text.replace(/`([^`\n]+)`/g, (_match, code) => (
    makeToken(`<code>${escapeNoticeMarkdownHtml(code)}</code>`)
  ));
  text = text.replace(/\[([^\]\n]+)\]\(([^)\n]+)\)/g, (_match, label, url) => {
    const safeUrl = sanitizeNoticeMarkdownUrl(url);
    const safeLabel = escapeNoticeMarkdownHtml(label);
    if (!safeUrl) return safeLabel;
    return makeToken(
      `<a href="${escapeNoticeMarkdownHtml(safeUrl)}" target="_blank" rel="noreferrer noopener">${safeLabel}</a>`
    );
  });
  let html = escapeNoticeMarkdownHtml(text);
  html = html.replace(/\*\*([^*\n][^*\n]*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_\n][^_\n]*?)__/g, "<strong>$1</strong>");
  html = html.replace(/~~([^~\n][^~\n]*?)~~/g, "<del>$1</del>");
  html = html.replace(/@@NOTICE_TOKEN_(\d+)@@/g, (_match, idx) => tokens[Number(idx)] || "");
  return html;
}

function normalizeNoticeMarkdownCalloutType(value) {
  const key = String(value || "").trim().toLowerCase();
  if (!key) return "info";
  if (key in NOTICE_MARKDOWN_CALLOUT_META) return key;
  return "info";
}

function isNoticeMarkdownBlockStart(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed) return false;
  return (
    /^#{1,6}\s+/.test(trimmed)
    || /^-{3,}$/.test(trimmed)
    || /^>\s?/.test(trimmed)
    || /^[-*+]\s+/.test(trimmed)
    || /^\d+\.\s+/.test(trimmed)
  );
}

function looksLikeNoticeMarkdown(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  return [
    /^#{1,6}\s+/m,
    /^>\s*\[![A-Za-z0-9_-]+\]/m,
    /^[-*+]\s+/m,
    /^\d+\.\s+/m,
    /\*\*[^*\n]+\*\*/,
    /`[^`\n]+`/,
    /\[[^\]\n]+\]\((?:https?:|mailto:|#)[^)]+\)/,
  ].some((pattern) => pattern.test(text));
}

function appendNoticeMarkdownBlocks(target, value) {
  const lines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
  let index = 0;
  while (index < lines.length) {
    const rawLine = String(lines[index] || "");
    const trimmed = rawLine.trim();
    if (!trimmed) {
      index += 1;
      continue;
    }
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.max(1, Math.min(6, headingMatch[1].length));
      const heading = document.createElement(`h${level}`);
      heading.innerHTML = renderNoticeMarkdownInline(headingMatch[2]);
      target.appendChild(heading);
      index += 1;
      continue;
    }
    if (/^-{3,}$/.test(trimmed)) {
      target.appendChild(document.createElement("hr"));
      index += 1;
      continue;
    }
    if (/^>\s?/.test(trimmed)) {
      const quoteLines = [];
      while (index < lines.length) {
        const quoteMatch = String(lines[index] || "").match(/^\s*>\s?(.*)$/);
        if (!quoteMatch) break;
        quoteLines.push(String(quoteMatch[1] || ""));
        index += 1;
      }
      const firstQuote = String(quoteLines.shift() || "").trim();
      const calloutMatch = firstQuote.match(/^\[!([A-Za-z0-9_-]+)\]\s*(.*)$/);
      const calloutType = normalizeNoticeMarkdownCalloutType(calloutMatch ? calloutMatch[1] : "info");
      const calloutMeta = NOTICE_MARKDOWN_CALLOUT_META[calloutType] || NOTICE_MARKDOWN_CALLOUT_META.info;
      const callout = document.createElement("article");
      callout.className = `notice-markdown-callout notice-markdown-callout-${calloutMeta.tone}`;
      const head = document.createElement("div");
      head.className = "notice-markdown-callout-head";
      const label = document.createElement("span");
      label.className = "notice-markdown-callout-label";
      label.textContent = calloutMeta.label;
      head.appendChild(label);
      const titleText = String(calloutMatch ? calloutMatch[2] : firstQuote).trim();
      if (titleText) {
        const title = document.createElement("span");
        title.className = "notice-markdown-callout-title";
        title.innerHTML = renderNoticeMarkdownInline(titleText);
        head.appendChild(title);
      }
      callout.appendChild(head);
      const bodyText = quoteLines.join("\n").trim();
      if (bodyText) {
        const body = document.createElement("div");
        body.className = "notice-markdown-callout-body";
        appendNoticeMarkdownBlocks(body, bodyText);
        callout.appendChild(body);
      }
      target.appendChild(callout);
      continue;
    }
    const unorderedMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (unorderedMatch || orderedMatch) {
      const isOrdered = Boolean(orderedMatch);
      const list = document.createElement(isOrdered ? "ol" : "ul");
      while (index < lines.length) {
        const current = String(lines[index] || "").trim();
        const match = isOrdered
          ? current.match(/^\d+\.\s+(.+)$/)
          : current.match(/^[-*+]\s+(.+)$/);
        if (!match) break;
        const item = document.createElement("li");
        item.innerHTML = renderNoticeMarkdownInline(match[1]);
        list.appendChild(item);
        index += 1;
      }
      target.appendChild(list);
      continue;
    }
    const paragraphLines = [];
    while (index < lines.length) {
      const currentLine = String(lines[index] || "");
      const currentTrimmed = currentLine.trim();
      if (!currentTrimmed) break;
      if (paragraphLines.length > 0 && isNoticeMarkdownBlockStart(currentLine)) break;
      paragraphLines.push(currentTrimmed);
      index += 1;
    }
    const paragraph = document.createElement("p");
    paragraph.innerHTML = paragraphLines.map((line) => renderNoticeMarkdownInline(line)).join("<br>");
    target.appendChild(paragraph);
  }
}

function setNoticeRichText(target, value, { forceMarkdown = false } = {}) {
  if (!target) return;
  const text = String(value || "").trim();
  target.innerHTML = "";
  target.classList.remove("is-plain-text", "is-rich-markdown", "is-empty");
  if (!text) {
    target.classList.add("is-empty");
    return;
  }
  const useMarkdown = Boolean(forceMarkdown || looksLikeNoticeMarkdown(text));
  if (!useMarkdown) {
    target.textContent = text;
    target.classList.add("is-plain-text");
    return;
  }
  appendNoticeMarkdownBlocks(target, text);
  target.classList.add("is-rich-markdown");
}

function ensureActionModalUi() {
  if (actionModalUi) return actionModalUi;
  const root = document.createElement("dialog");
  root.id = "action-modal-root";
  root.className = "action-modal";
  root.setAttribute("aria-labelledby", "action-modal-title");
  root.innerHTML = `
    <div class="action-modal-backdrop" data-role="backdrop"></div>
    <div class="action-modal-panel">
      <div class="dialog-head">
        <h3 id="action-modal-title"></h3>
        <button id="btn-action-modal-close" class="btn btn-small" type="button">${t("close")}</button>
      </div>
      <p id="action-modal-message" class="dialog-subtitle hidden"></p>
      <label id="action-modal-input-wrap" class="hidden">
        <span id="action-modal-input-label" class="hidden"></span>
        <input id="action-modal-input" type="text" maxlength="160">
      </label>
      <div class="dialog-actions">
        <button id="btn-action-modal-cancel" class="btn" type="button">${t("cancel")}</button>
        <button id="btn-action-modal-confirm" class="btn" type="button">${t("save")}</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);
  const refs = {
    root,
    backdrop: root.querySelector('[data-role="backdrop"]'),
    panel: root.querySelector(".action-modal-panel"),
    title: root.querySelector("#action-modal-title"),
    message: root.querySelector("#action-modal-message"),
    inputWrap: root.querySelector("#action-modal-input-wrap"),
    inputLabel: root.querySelector("#action-modal-input-label"),
    input: root.querySelector("#action-modal-input"),
    btnClose: root.querySelector("#btn-action-modal-close"),
    btnCancel: root.querySelector("#btn-action-modal-cancel"),
    btnConfirm: root.querySelector("#btn-action-modal-confirm"),
  };
  actionModalUi = {
    refs,
    mode: "confirm",
    resolve: null,
    previousActive: null,
    pendingResult: undefined,
    close(result = null) {
      actionModalUi.pendingResult = result;
      if (refs.root.open) {
        try {
          refs.root.close();
          return;
        } catch {
          // fallback finalize below
        }
      }
      const resolver = actionModalUi.resolve;
      actionModalUi.resolve = null;
      actionModalUi.pendingResult = undefined;
      if (actionModalUi.previousActive && typeof actionModalUi.previousActive.focus === "function") {
        try {
          actionModalUi.previousActive.focus();
        } catch {
          // ignore focus restore errors
        }
      }
      actionModalUi.previousActive = null;
      if (typeof resolver === "function") resolver(result);
    },
  };
  const handleCancel = () => actionModalUi.close(null);
  refs.backdrop?.addEventListener("click", handleCancel);
  refs.btnClose?.addEventListener("click", handleCancel);
  refs.btnCancel?.addEventListener("click", handleCancel);
  refs.btnConfirm?.addEventListener("click", () => {
    if (actionModalUi.mode === "prompt") {
      actionModalUi.close(String(refs.input?.value || ""));
      return;
    }
    actionModalUi.close(true);
  });
  refs.input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      actionModalUi.close(String(refs.input?.value || ""));
    } else if (event.key === "Escape") {
      event.preventDefault();
      handleCancel();
    }
  });
  root.addEventListener("cancel", (event) => {
    event.preventDefault();
    handleCancel();
  });
  root.addEventListener("close", () => {
    const resolver = actionModalUi.resolve;
    const result = actionModalUi.pendingResult;
    actionModalUi.resolve = null;
    actionModalUi.pendingResult = undefined;
    if (actionModalUi.previousActive && typeof actionModalUi.previousActive.focus === "function") {
      try {
        actionModalUi.previousActive.focus();
      } catch {
        // ignore focus restore errors
      }
    }
    actionModalUi.previousActive = null;
    if (typeof resolver === "function") resolver(result == null ? null : result);
  });
  return actionModalUi;
}

function openActionModal({
  mode = "confirm",
  title = "",
  message = "",
  confirmText = "",
  cancelText = "",
  inputValue = "",
  inputPlaceholder = "",
  inputLabel = "",
  inputMaxLength = 160,
} = {}) {
  const ui = ensureActionModalUi();
  if (typeof ui.resolve === "function" || ui.refs.root.open) {
    ui.close(null);
  }
  ui.mode = mode === "prompt" ? "prompt" : "confirm";
  ui.previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const { refs } = ui;
  if (refs.title) refs.title.textContent = String(title || "").trim() || t("actionModalTitle");
  if (refs.message) {
    const messageText = String(message || "").trim();
    refs.message.textContent = messageText;
    refs.message.classList.toggle("hidden", !messageText);
  }
  if (refs.btnConfirm) refs.btnConfirm.textContent = String(confirmText || "").trim() || (ui.mode === "prompt" ? t("save") : t("actionModalConfirm"));
  if (refs.btnCancel) refs.btnCancel.textContent = String(cancelText || "").trim() || t("cancel");
  if (refs.inputWrap && refs.input) {
    const promptMode = ui.mode === "prompt";
    refs.inputWrap.classList.toggle("hidden", !promptMode);
    refs.input.value = promptMode ? String(inputValue || "") : "";
    refs.input.placeholder = promptMode ? String(inputPlaceholder || "") : "";
    refs.input.maxLength = Math.max(1, Number(inputMaxLength || 160) || 160);
  }
  if (refs.inputLabel) {
    const labelText = String(inputLabel || "").trim();
    refs.inputLabel.textContent = labelText;
    refs.inputLabel.classList.toggle("hidden", !(ui.mode === "prompt" && labelText));
  }
  if (!refs.root.open) refs.root.showModal();
  window.setTimeout(() => {
    if (ui.mode === "prompt" && refs.input) {
      refs.input.focus();
      refs.input.select();
    } else if (refs.btnConfirm) {
      refs.btnConfirm.focus();
    }
  }, 0);
  return new Promise((resolve) => {
    ui.resolve = resolve;
  });
}

async function confirmDialog(options = {}) {
  const result = await openActionModal({ ...options, mode: "confirm" });
  return result === true;
}

async function promptDialog(options = {}) {
  const result = await openActionModal({ ...options, mode: "prompt" });
  if (result == null) return null;
  return String(result);
}

const CACHE_MANAGER_PAGE_SIZE = 24;

function cacheManagerModeLabel(mode) {
  const key = String(mode || "").trim().toLowerCase();
  if (key === "server") return "Server";
  if (key === "local") return "Local";
  if (key === "dichngay_local") return "Mô phỏng";
  if (key === "hanviet") return "Hán Việt";
  return String(mode || "").trim() || "?";
}

function cacheManagerActionLabel(action, mode = "") {
  const modeKey = String(mode || "").trim();
  if (action === "clear_global_translation_mode" || action === "clear_book_trans_mode") {
    return t("cacheManagerClearTransMode", { mode: cacheManagerModeLabel(modeKey) });
  }
  switch (action) {
    case "clear_global_translation":
      return t("cacheManagerClearGlobalTrans");
    case "clear_book_raw":
      return t("cacheManagerClearRaw");
    case "clear_book_trans":
      return t("cacheManagerClearTrans");
    case "clear_book_images":
      return t("cacheManagerClearImages");
    case "clear_book_all":
      return t("cacheManagerClearAll");
    default:
      return t("cacheManagerActionGeneric");
  }
}

function sortCacheManagerGroups(groups) {
  const items = Array.isArray(groups) ? groups.map((item) => ({ ...(item || {}) })) : [];
  items.sort((a, b) => (
    Number(b.cache_bytes || 0) - Number(a.cache_bytes || 0)
    || Number(b.cache_count || 0) - Number(a.cache_count || 0)
    || (Number(b.translation_memory_count || 0) + Number(b.translation_unit_map_count || 0))
      - (Number(a.translation_memory_count || 0) + Number(a.translation_unit_map_count || 0))
    || String(a.label || "").localeCompare(String(b.label || ""), "vi")
  ));
  return items;
}

function getCacheManagerVisibleBooks() {
  const ui = ensureCacheManagerUi();
  const pageSize = Math.max(1, Number(ui.pageSize || CACHE_MANAGER_PAGE_SIZE) || CACHE_MANAGER_PAGE_SIZE);
  const total = Array.isArray(ui.books) ? ui.books.length : 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(totalPages, Math.max(1, Number(ui.currentPage || 1) || 1));
  ui.currentPage = page;
  const start = (page - 1) * pageSize;
  return {
    page,
    pageSize,
    total,
    totalPages,
    start,
    end: Math.min(total, start + pageSize),
    books: (ui.books || []).slice(start, start + pageSize),
  };
}

function getCacheManagerSelectedBooks() {
  const ui = ensureCacheManagerUi();
  const byId = new Map(
    (ui.books || [])
      .map((book) => [String((book && book.book_id) || "").trim(), book])
      .filter(([bookId]) => Boolean(bookId))
  );
  return Array.from(ui.selected)
    .map((bookId) => byId.get(String(bookId || "").trim()))
    .filter(Boolean);
}

function getCacheManagerRawSelectionState() {
  const selectedBooks = getCacheManagerSelectedBooks();
  const eligible = [];
  const blocked = [];
  for (const book of selectedBooks) {
    const rawAction = (book && typeof book.raw_action === "object" && book.raw_action)
      ? book.raw_action
      : {};
    if (rawAction.allowed) eligible.push(book);
    else blocked.push(book);
  }
  const firstBlockedReason = blocked.length > 0
    ? String((((blocked[0] || {}).raw_action || {}).reason) || "").trim()
    : "";
  return {
    selectedBooks,
    selectedCount: selectedBooks.length,
    eligible,
    blocked,
    firstBlockedReason,
  };
}

function syncCacheManagerSelectionState() {
  const ui = ensureCacheManagerUi();
  const { refs } = ui;
  const visible = getCacheManagerVisibleBooks().books;
  const visibleIds = visible
    .map((book) => String((book && book.book_id) || "").trim())
    .filter(Boolean);
  const selectedOnPage = visibleIds.filter((bookId) => ui.selected.has(bookId)).length;
  if (refs.selectAll) {
    refs.selectAll.checked = visibleIds.length > 0 && selectedOnPage === visibleIds.length;
    refs.selectAll.indeterminate = selectedOnPage > 0 && selectedOnPage < visibleIds.length;
  }
  if (refs.selectionSummary) {
    const selectedCount = ui.selected.size;
    refs.selectionSummary.textContent = selectedCount > 0
      ? t("cacheManagerSelectionSummary", { count: selectedCount })
      : "";
    refs.selectionSummary.classList.toggle("hidden", selectedCount <= 0);
  }
  if (refs.btnClearRaw) {
    const rawSelection = getCacheManagerRawSelectionState();
    refs.btnClearRaw.disabled = rawSelection.selectedCount <= 0 || rawSelection.blocked.length > 0;
    refs.btnClearRaw.title = rawSelection.blocked.length > 0 ? rawSelection.firstBlockedReason : "";
  }
}

function renderCacheManagerPagination() {
  const ui = ensureCacheManagerUi();
  const { refs } = ui;
  const { page, totalPages, total, start, end } = getCacheManagerVisibleBooks();
  if (refs.pageSummary) {
    refs.pageSummary.textContent = total > 0
      ? t("cacheManagerPageSummary", {
        start: start + 1,
        end,
        total,
      })
      : t("cacheManagerPageSummaryEmpty");
  }
  if (refs.pageLabel) refs.pageLabel.textContent = t("pageCounter", { current: page, total: totalPages });
  if (refs.btnPrev) refs.btnPrev.disabled = page <= 1;
  if (refs.btnNext) refs.btnNext.disabled = page >= totalPages;
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
    <div id="cache-manager-global-groups" class="cache-manager-global-groups"></div>
    <div class="cover-btns cache-manager-actions">
      <button id="btn-cache-manager-refresh" class="btn btn-small" type="button"></button>
      <label class="cache-manager-select-all">
        <input id="cache-manager-select-all" type="checkbox">
        <span id="cache-manager-select-all-label"></span>
      </label>
      <span id="cache-manager-selection-summary" class="cache-manager-selection-summary hidden"></span>
      <button id="btn-cache-manager-clear-raw" class="btn btn-small" type="button"></button>
      <button id="btn-cache-manager-clear-images" class="btn btn-small" type="button"></button>
      <button id="btn-cache-manager-clear-all" class="btn btn-small" type="button"></button>
    </div>
    <div class="cover-btns cache-manager-actions">
      <button id="btn-cache-manager-clear-trans" class="btn btn-small" type="button"></button>
      <button id="btn-cache-manager-clear-trans-server" class="btn btn-small" type="button"></button>
      <button id="btn-cache-manager-clear-trans-local" class="btn btn-small" type="button"></button>
      <button id="btn-cache-manager-clear-trans-sim" class="btn btn-small" type="button"></button>
      <button id="btn-cache-manager-clear-trans-hv" class="btn btn-small" type="button"></button>
    </div>
    <div class="cache-manager-toolbar">
      <p id="cache-manager-page-summary" class="empty-text"></p>
      <div class="cache-manager-pagination">
        <button id="btn-cache-manager-prev" class="btn btn-small" type="button"></button>
        <span id="cache-manager-page-label" class="tag"></span>
        <button id="btn-cache-manager-next" class="btn btn-small" type="button"></button>
      </div>
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
    globalGroups: dialog.querySelector("#cache-manager-global-groups"),
    btnRefresh: dialog.querySelector("#btn-cache-manager-refresh"),
    selectAll: dialog.querySelector("#cache-manager-select-all"),
    selectAllLabel: dialog.querySelector("#cache-manager-select-all-label"),
    selectionSummary: dialog.querySelector("#cache-manager-selection-summary"),
    btnClearRaw: dialog.querySelector("#btn-cache-manager-clear-raw"),
    btnClearTrans: dialog.querySelector("#btn-cache-manager-clear-trans"),
    btnClearTransServer: dialog.querySelector("#btn-cache-manager-clear-trans-server"),
    btnClearTransLocal: dialog.querySelector("#btn-cache-manager-clear-trans-local"),
    btnClearTransSim: dialog.querySelector("#btn-cache-manager-clear-trans-sim"),
    btnClearTransHv: dialog.querySelector("#btn-cache-manager-clear-trans-hv"),
    btnClearImages: dialog.querySelector("#btn-cache-manager-clear-images"),
    btnClearAll: dialog.querySelector("#btn-cache-manager-clear-all"),
    pageSummary: dialog.querySelector("#cache-manager-page-summary"),
    pageLabel: dialog.querySelector("#cache-manager-page-label"),
    btnPrev: dialog.querySelector("#btn-cache-manager-prev"),
    btnNext: dialog.querySelector("#btn-cache-manager-next"),
    list: dialog.querySelector("#cache-manager-list"),
    empty: dialog.querySelector("#cache-manager-empty"),
  };
  cacheManagerUi = {
    refs,
    books: [],
    selected: new Set(),
    pageSize: CACHE_MANAGER_PAGE_SIZE,
    currentPage: 1,
    globalGroups: [],
  };

  refs.title.textContent = t("cacheManagerTitle");
  refs.btnClose.textContent = t("close");
  refs.btnRefresh.textContent = t("cacheManagerRefresh");
  refs.selectAllLabel.textContent = t("cacheManagerSelectPage");
  refs.btnClearRaw.textContent = t("cacheManagerClearRaw");
  refs.btnClearTrans.textContent = t("cacheManagerClearTrans");
  refs.btnClearTransServer.textContent = t("cacheManagerClearTransMode", { mode: "Server" });
  refs.btnClearTransLocal.textContent = t("cacheManagerClearTransMode", { mode: "Local" });
  refs.btnClearTransSim.textContent = t("cacheManagerClearTransMode", { mode: "Mô phỏng" });
  refs.btnClearTransHv.textContent = t("cacheManagerClearTransMode", { mode: "Hán Việt" });
  refs.btnClearImages.textContent = t("cacheManagerClearImages");
  refs.btnClearAll.textContent = t("cacheManagerClearAll");
  refs.btnPrev.textContent = t("cacheManagerPrevPage");
  refs.btnNext.textContent = t("cacheManagerNextPage");
  refs.empty.textContent = t("cacheManagerEmpty");

  refs.btnClose.addEventListener("click", () => {
    if (dialog.open) dialog.close();
  });
  refs.selectAll.addEventListener("change", () => {
    const checked = Boolean(refs.selectAll.checked);
    const visibleIds = getCacheManagerVisibleBooks().books
      .map((row) => String((row && row.book_id) || "").trim())
      .filter(Boolean);
    for (const bookId of visibleIds) {
      if (checked) cacheManagerUi.selected.add(bookId);
      else cacheManagerUi.selected.delete(bookId);
    }
    renderCacheManagerList();
  });
  refs.btnRefresh.addEventListener("click", () => {
    loadCacheManagerSummary().catch(() => { });
  });
  refs.btnClearRaw.addEventListener("click", () => {
    runCacheManagerAction("clear_book_raw").catch(() => { });
  });
  refs.btnClearTrans.addEventListener("click", () => {
    runCacheManagerAction("clear_book_trans").catch(() => { });
  });
  refs.btnClearTransServer.addEventListener("click", () => {
    runCacheManagerAction("clear_book_trans_mode", { mode: "server" }).catch(() => { });
  });
  refs.btnClearTransLocal.addEventListener("click", () => {
    runCacheManagerAction("clear_book_trans_mode", { mode: "local" }).catch(() => { });
  });
  refs.btnClearTransSim.addEventListener("click", () => {
    runCacheManagerAction("clear_book_trans_mode", { mode: "dichngay_local" }).catch(() => { });
  });
  refs.btnClearTransHv.addEventListener("click", () => {
    runCacheManagerAction("clear_book_trans_mode", { mode: "hanviet" }).catch(() => { });
  });
  refs.btnClearImages.addEventListener("click", () => {
    runCacheManagerAction("clear_book_images").catch(() => { });
  });
  refs.btnClearAll.addEventListener("click", () => {
    runCacheManagerAction("clear_book_all").catch(() => { });
  });
  refs.btnPrev.addEventListener("click", () => {
    cacheManagerUi.currentPage = Math.max(1, Number(cacheManagerUi.currentPage || 1) - 1);
    renderCacheManagerList();
  });
  refs.btnNext.addEventListener("click", () => {
    const { totalPages } = getCacheManagerVisibleBooks();
    cacheManagerUi.currentPage = Math.min(totalPages, Number(cacheManagerUi.currentPage || 1) + 1);
    renderCacheManagerList();
  });
  return cacheManagerUi;
}

function renderCacheManagerList() {
  const ui = ensureCacheManagerUi();
  const { refs } = ui;
  refs.list.innerHTML = "";
  const visible = getCacheManagerVisibleBooks();
  if (!visible.books.length) {
    refs.empty.classList.remove("hidden");
    syncCacheManagerSelectionState();
    renderCacheManagerPagination();
    return;
  }
  refs.empty.classList.add("hidden");
  for (const book of visible.books) {
    const bid = String(book.book_id || "").trim();
    if (!bid) continue;
    const row = document.createElement("label");
    row.className = "cache-manager-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "cache-manager-checkbox";
    checkbox.checked = ui.selected.has(bid);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) ui.selected.add(bid);
      else ui.selected.delete(bid);
      syncCacheManagerSelectionState();
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
    const authorLine = document.createElement("div");
    authorLine.className = "cache-book-line";
    authorLine.textContent = String(book.author_display || "").trim() || t("unknownAuthor");
    const chapterLine = document.createElement("div");
    chapterLine.className = "cache-book-line";
    chapterLine.textContent = t("cacheManagerChapterLine", {
      raw: Number(book.cached_raw_chapters || 0),
      trans: Number(book.cached_trans_chapters || 0),
      total: Number(book.chapter_count || 0),
    });
    const totalLine = document.createElement("div");
    totalLine.className = "cache-book-line cache-book-total";
    totalLine.textContent = t("cacheManagerTotalSizeLine", {
      total: formatBytes(book.cache_total_bytes || 0),
    });
    const groupWrap = document.createElement("div");
    groupWrap.className = "cache-book-groups";
    const groups = sortCacheManagerGroups(book.cache_groups);
    for (const group of groups) {
      const chip = document.createElement("span");
      chip.className = "cache-book-group-chip";
      chip.textContent = t("cacheManagerGroupChip", {
        label: String(group.label || group.key || "").trim() || "?",
        count: Number(group.cache_count || 0),
        size: formatBytes(group.cache_bytes || 0),
      });
      groupWrap.appendChild(chip);
    }
    meta.append(title, authorLine, chapterLine, totalLine, groupWrap);
    row.append(checkbox, cover, meta);
    refs.list.appendChild(row);
  }
  syncCacheManagerSelectionState();
  renderCacheManagerPagination();
}

function renderCacheManagerGlobal(data) {
  const ui = ensureCacheManagerUi();
  const { refs } = ui;
  const global = (data && data.global) || {};
  const groups = Array.isArray(global.groups) ? global.groups.map((item) => ({ ...(item || {}) })) : [];
  ui.globalGroups = groups;
  refs.globalStats.textContent = t("cacheManagerGlobalLine", {
    trans_count: Number(global.translated_cache_count || 0),
    trans_size: formatBytes(global.translated_cache_bytes || 0),
    tm_count: Number(global.translation_memory_count || 0),
    unit_count: Number(global.translation_unit_map_count || 0),
  });
  if (refs.globalGroups) {
    refs.globalGroups.innerHTML = "";
    for (const group of sortCacheManagerGroups(groups)) {
      const card = document.createElement("article");
      card.className = "cache-global-card";
      const head = document.createElement("div");
      head.className = "cache-global-card-head";
      const title = document.createElement("div");
      title.className = "cache-global-card-title";
      title.textContent = String(group.label || group.mode || "").trim() || "?";
      const size = document.createElement("span");
      size.className = "tag";
      size.textContent = formatBytes(group.cache_bytes || 0);
      head.append(title, size);
      const body = document.createElement("div");
      body.className = "cache-global-card-body";
      body.textContent = t("cacheManagerGlobalGroupLine", {
        cache_count: Number(group.cache_count || 0),
        tm_count: Number(group.translation_memory_count || 0),
        unit_count: Number(group.translation_unit_map_count || 0),
      });
      const actions = document.createElement("div");
      actions.className = "cache-global-card-actions";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-small";
      btn.textContent = t("cacheManagerClearGroupButton");
      btn.disabled = (
        Number(group.cache_count || 0) <= 0
        && Number(group.translation_memory_count || 0) <= 0
        && Number(group.translation_unit_map_count || 0) <= 0
      );
      btn.addEventListener("click", () => {
        runCacheManagerAction("clear_global_translation_mode", { mode: String(group.mode || "") }).catch(() => {});
      });
      actions.appendChild(btn);
      card.append(head, body, actions);
      refs.globalGroups.appendChild(card);
    }
  }
}

async function loadCacheManagerSummary() {
  const ui = ensureCacheManagerUi();
  showStatus(t("statusLoadingCacheManager"));
  try {
    const data = await api("/api/library/cache/summary");
    ui.books = Array.isArray(data.books) ? data.books : [];
    const valid = new Set(ui.books.map((x) => String((x && x.book_id) || "").trim()).filter(Boolean));
    ui.selected = new Set(Array.from(ui.selected).filter((x) => valid.has(x)));
    const { totalPages } = getCacheManagerVisibleBooks();
    ui.currentPage = Math.min(Math.max(1, ui.currentPage || 1), totalPages);
    renderCacheManagerGlobal(data);
    renderCacheManagerList();
  } catch (error) {
    showToast(error.message || t("toastError"));
  } finally {
    hideStatus();
  }
}

async function runCacheManagerAction(action, { mode = "" } = {}) {
  const ui = ensureCacheManagerUi();
  const act = String(action || "").trim();
  const modeKey = String(mode || "").trim();
  const isGlobal = act === "clear_global_translation" || act === "clear_global_translation_mode";
  let selectedBookIds = isGlobal ? [] : Array.from(ui.selected);
  if (!isGlobal && !selectedBookIds.length) {
    showToast(t("cacheManagerNeedSelect"));
    return;
  }
  let confirmTitle = t("cacheManagerConfirmTitle");
  let confirmText = cacheManagerActionLabel(act, modeKey);
  let confirmMessage = isGlobal
    ? t("cacheManagerConfirmGlobal", { action: cacheManagerActionLabel(act, modeKey) })
    : t("cacheManagerConfirmBooks", {
      action: cacheManagerActionLabel(act, modeKey),
      count: selectedBookIds.length,
    });
  if (act === "clear_book_raw") {
    const rawSelection = getCacheManagerRawSelectionState();
    if (!rawSelection.selectedCount) {
      showToast(t("cacheManagerNeedSelect"));
      return;
    }
    if (rawSelection.blocked.length > 0) {
      showToast(rawSelection.firstBlockedReason || t("toastError"));
      return;
    }
    selectedBookIds = rawSelection.eligible
      .map((book) => String((book && book.book_id) || "").trim())
      .filter(Boolean);
    if (!selectedBookIds.length) {
      showToast(t("cacheManagerNeedSelect"));
      return;
    }
    confirmTitle = t("deleteBook");
    confirmText = t("deleteBook");
    confirmMessage = t("cacheManagerConfirmDeleteBooksFromRaw", { count: selectedBookIds.length });
  }
  const confirmed = await confirmDialog({
    title: confirmTitle,
    message: confirmMessage,
    confirmText,
  });
  if (!confirmed) return;
  showStatus(t("statusClearing"));
  try {
    const body = { action: act, book_ids: selectedBookIds };
    if (modeKey) body.mode = modeKey;
    const result = await api("/api/library/cache/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    emitCacheChanged({
      source: "cache-manager",
      action: act,
      mode: modeKey,
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
    ["label-text-indent", "textIndent"],
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
    ["translation-mode-dichngay-local", "translationModeDichNgayLocal"],
    ["translation-mode-hanviet", "translationModeHanviet"],
    ["label-server-translate-settings", "serverTranslateSettings"],
    ["label-server-delay-ms", "serverDelayMs"],
    ["label-server-max-chars", "serverMaxChars"],
    ["label-server-retry-count", "serverRetryCount"],
    ["label-server-timeout-sec", "serverTimeoutSec"],
    ["label-server-retry-backoff-ms", "serverRetryBackoffMs"],
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
    ["btn-import-customize", "importCustomize"],
    ["import-title", "importTitle"],
    ["import-mode-label", "importMode"],
    ["import-mode-single", "importModeSingle"],
    ["import-mode-batch", "importModeBatch"],
    ["import-batch-note", "importBatchNote"],
    ["import-file-label", "importFile"],
    ["import-lang-label", "importLang"],
    ["import-book-title-label", "importBookTitle"],
    ["import-author-label", "importAuthor"],
    ["import-skip-prepare-label", "importSkipPrepare"],
    ["import-lang-zh", "importLangZh"],
    ["import-lang-vi", "importLangVi"],
    ["btn-import-cancel", "cancel"],
    ["btn-import-submit", "prepareImport"],
    ["import-customize-title", "importCustomizeTitle"],
    ["btn-import-customize-close", "close"],
    ["import-customize-txt-title", "importCustomizeTxtTitle"],
    ["import-target-size-label", "importTargetSize"],
    ["import-preface-title-label", "importPrefaceTitle"],
    ["import-heading-patterns-label", "importHeadingPatterns"],
    ["import-heading-presets-title", "importHeadingPresets"],
    ["import-customize-epub-title", "importCustomizeEpubTitle"],
    ["import-epub-title-keys-label", "importEpubTitleKeys"],
    ["import-epub-author-keys-label", "importEpubAuthorKeys"],
    ["import-epub-summary-keys-label", "importEpubSummaryKeys"],
    ["import-epub-language-keys-label", "importEpubLanguageKeys"],
    ["import-epub-cover-meta-label", "importEpubCoverMetaNames"],
    ["import-epub-cover-props-label", "importEpubCoverProperties"],
    ["import-epub-presets-title", "importEpubPresets"],
    ["btn-import-customize-reset", "resetImportSettings"],
    ["btn-import-customize-save", "saveImportSettings"],
    ["import-preview-title", "importPreviewTitle"],
    ["import-preview-file-label", "importPreviewFile"],
    ["import-preview-type-label", "importPreviewType"],
    ["import-preview-count-label", "importPreviewCount"],
    ["import-preview-detected-lang-label", "importPreviewDetectedLang"],
    ["import-preview-book-title-label", "importBookTitle"],
    ["import-preview-author-label", "importAuthor"],
    ["import-preview-summary-label", "importPreviewSummary"],
    ["import-preview-lang-label", "importLang"],
    ["import-preview-lang-zh", "importLangZh"],
    ["import-preview-lang-vi", "importLangVi"],
    ["import-preview-parser-title", "importPreviewParserTitle"],
    ["import-preview-target-size-label", "importTargetSize"],
    ["import-preview-preface-title-label", "importPrefaceTitle"],
    ["import-preview-heading-patterns-label", "importHeadingPatterns"],
    ["import-preview-heading-presets-title", "importHeadingPresets"],
    ["import-preview-epub-title-keys-label", "importEpubTitleKeys"],
    ["import-preview-epub-author-keys-label", "importEpubAuthorKeys"],
    ["import-preview-epub-summary-keys-label", "importEpubSummaryKeys"],
    ["import-preview-epub-language-keys-label", "importEpubLanguageKeys"],
    ["import-preview-epub-cover-meta-label", "importEpubCoverMetaNames"],
    ["import-preview-epub-cover-props-label", "importEpubCoverProperties"],
    ["import-preview-epub-presets-title", "importEpubPresets"],
    ["btn-import-preview-close", "close"],
    ["btn-import-preview-cancel", "cancel"],
    ["btn-import-preview-commit", "confirmImport"],
    ["import-batch-title", "importBatchTitle"],
    ["import-batch-hint", "importBatchHint"],
    ["btn-import-batch-close", "close"],
    ["btn-import-batch-cancel", "cancel"],
    ["btn-import-batch-commit", "importBatchCommit"],
    ["btn-import-progress-hide", "importProgressHide"],
    ["export-include-categories-label", "exportIncludeCategories"],
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
    ["vbook-runner-title", "vbookRunnerTitle"],
    ["vbook-runner-hint", "vbookRunnerHint"],
    ["vbook-runner-path-label", "vbookRunnerPathLabel"],
    ["vbook-runner-installed-label", "vbookRunnerInstalledLabel"],
    ["btn-vbook-reload-settings", "vbookReloadSettings"],
    ["btn-vbook-save-global-settings", "vbookSaveGlobalSettings"],
    ["btn-vbook-save-plugin-settings", "vbookSavePluginSettings"],
    ["btn-vbook-clear-plugin-settings", "vbookClearPluginSettings"],
    ["vbook-manager-search-label", "vbookManagerSearchLabel"],
  ];
  for (const [id, key] of pairs) {
    const node = qs(id);
    if (node) node.textContent = t(key);
  }
  const search = qs("search-input");
  if (search) search.placeholder = t("searchPlaceholder");
  const vbookManagerSearch = qs("vbook-manager-search-input");
  if (vbookManagerSearch) vbookManagerSearch.placeholder = t("vbookManagerSearchPlaceholder");
}

export async function initShell({ page, onSearchSubmit, onImported, onImportUrl, onSearch, onPrepareImport } = {}) {
  fillStaticTexts();
  setNavActive(page || "library");

  const state = {
    serverThemes: [],
    customThemes: loadCustomThemes(),
    themes: [],
    settings: loadSettings(),
    readerTranslationLocal: { ...LOCAL_TRANSLATION_DEFAULT },
    readerTranslationSimLocal: { ...LOCAL_TRANSLATION_DEFAULT },
    readerTranslationHanviet: { ...LOCAL_TRANSLATION_DEFAULT },
    readerTranslationServer: { ...SERVER_TRANSLATION_DEFAULT },
    readerTranslationTitleCacheAuto: true,
    vbook: {
      installed: [],
      repoUrls: [],
      lockedRepoUrls: [],
      repoPlugins: [],
      repoErrors: [],
      pluginUpdates: {},
      searchQuery: "",
      activeRepoUrl: "",
      globalSettings: {
        request_delay_ms: 0,
        download_threads: 4,
        prefetch_unread_count: 2,
        retry_count: 2,
      },
      runnerStatus: {
        exists: false,
        configured_path: "",
        path: "",
        installed_version: "",
        version_error: "",
        install_available: false,
        install_action: "install",
        install_label: "Cài đặt",
      },
      pluginSettings: {},
      selectedRuntimePluginId: "",
    },
    readerUpdateStatus: null,
  };

  const getLocalTranslationState = (mode = state.settings.translationMode) => {
    const key = localTranslationStateKey(mode);
    return normalizeLocalTranslationSettings(state[key] || {});
  };

  const setLocalTranslationState = (mode, raw) => {
    const key = localTranslationStateKey(mode);
    state[key] = normalizeLocalTranslationSettings(raw || {});
    return state[key];
  };

  state.settings.miniBarsScale = normalizeMiniBarsScale(state.settings.miniBarsScale);
  state.settings.tocSide = normalizeTocSide(state.settings.tocSide);
  state.settings.themeCustomEnabled = state.settings.themeCustomEnabled === true;
  state.settings.comicEdgeTintEnabled = state.settings.comicEdgeTintEnabled === true;
  state.settings.comicEdgeTintStrength = normalizeComicEdgeTintStrength(state.settings.comicEdgeTintStrength);
  for (const field of THEME_CUSTOM_FIELDS) {
    state.settings[field.settingKey] = normalizeHexColor(state.settings[field.settingKey]);
  }

  applyPanelStyle(state.settings);
  const cachedTheme = loadThemeCache();
  if (cachedTheme) {
    applyTheme([cachedTheme], state.settings);
  }
  applyReaderVars(state.settings);

  const settingsForm = qs("settings-form");
  const themeSelect = qs("theme-select");
  if (settingsForm) ensureSettingsEnhancements(settingsForm);
  const fontFamilySelect = qs("font-family-select");
  const starStyleSelect = qs("star-style-select");
  const backgroundMotionSelect = qs("background-motion-select");
  const fontSizeInput = qs("font-size-input");
  const lineHeightInput = qs("line-height-input");
  const paragraphSpacingInput = qs("paragraph-spacing-input");
  const textIndentInput = qs("text-indent-input");
  const textAlignSelect = qs("text-align-select");
  const readingModeSelect = qs("reading-mode-select");
  const panelTransparencySelect = qs("panel-transparency-select");
  const miniBarsEnabledSelect = qs("mini-bars-enabled-select");
  const miniBarsScaleInput = qs("mini-bars-scale-input");
  const miniBarsScaleValue = qs("mini-bars-scale-value");
  const tocSideSelect = qs("toc-side-select");
  const comicEdgeTintEnabledSelect = qs("comic-edge-tint-enabled-select");
  const comicEdgeTintStrengthInput = qs("comic-edge-tint-strength-input");
  const comicEdgeTintStrengthValue = qs("comic-edge-tint-strength-value");
  const comicEdgeTintStrengthWrap = qs("comic-edge-tint-strength-wrap");
  const translationEnabledSelect = qs("translation-enabled-select");
  const translationModeSelect = qs("translation-mode-select");
  const titleCacheAutoSelect = qs("title-cache-auto-select");
  const localSection = qs("local-translation-settings");
  const localSectionLegend = qs("label-local-translate-settings");
  const serverTranslateSection = qs("server-translation-settings");
  const serverDelayMsInput = qs("server-delay-ms-input");
  const serverMaxCharsInput = qs("server-max-chars-input");
  const serverRetryCountInput = qs("server-retry-count-input");
  const serverTimeoutSecInput = qs("server-timeout-sec-input");
  const serverRetryBackoffMsInput = qs("server-retry-backoff-ms-input");
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
  const themeCustomNameWrap = qs("theme-custom-name-wrap");
  const themeCustomNameInput = qs("theme-custom-name-input");
  const themeCustomHint = qs("theme-custom-hint");
  const themeCustomGrid = qs("theme-custom-grid");
  const btnThemeCustomCreate = qs("btn-theme-custom-create");
  const btnThemeCustomDelete = qs("btn-theme-custom-delete");
  const btnThemeCustomReset = qs("btn-theme-custom-reset");
  const themeCustomInputs = Object.fromEntries(
    THEME_CUSTOM_FIELDS.map((field) => [field.settingKey, qs(field.inputId)]),
  );
  const themeCustomValueNodes = Object.fromEntries(
    THEME_CUSTOM_FIELDS.map((field) => [field.settingKey, qs(field.valueId)]),
  );

  const rebuildThemeCatalog = () => {
    state.themes = mergeThemeLists(state.serverThemes, state.customThemes);
    if (!themeSelect) return;
    themeSelect.innerHTML = "";
    for (const theme of state.themes) {
      const opt = document.createElement("option");
      opt.value = theme.id;
      opt.textContent = isCustomThemeId(theme.id)
        ? `${theme.name} • ${t("themeCustomTag")}`
        : theme.name;
      themeSelect.appendChild(opt);
    }
    if (!state.themes.some((x) => x.id === state.settings.themeId)) {
      state.settings.themeId = (state.themes[0] && state.themes[0].id) || state.settings.themeId;
    }
    if (state.settings.themeId) themeSelect.value = state.settings.themeId;
  };
  const getActiveTheme = () => findThemeById(state.themes, state.settings.themeId) || loadThemeCache() || null;
  const getActiveBaseTheme = () => {
    const active = getActiveTheme();
    if (!active) return null;
    const baseId = String(active.baseThemeId || active.id || "").trim();
    return findThemeById(state.serverThemes, baseId) || findThemeById(state.themes, baseId) || active;
  };
  const saveCustomThemesState = () => {
    saveCustomThemes(state.customThemes);
    rebuildThemeCatalog();
  };
  const syncThemeCustomForm = () => {
    const activeTheme = getActiveTheme();
    const isCustom = Boolean(activeTheme && isCustomThemeId(activeTheme.id));
    const tokenTheme = isCustom ? activeTheme : getActiveBaseTheme();
    const tokens = (tokenTheme && tokenTheme.tokens) || {};
    if (themeCustomNameWrap) themeCustomNameWrap.hidden = !isCustom;
    if (themeCustomNameInput) {
      themeCustomNameInput.hidden = !isCustom;
      themeCustomNameInput.value = isCustom ? String(activeTheme.name || "") : "";
    }
    if (themeCustomHint) {
      themeCustomHint.textContent = isCustom
        ? t("themeCustomActiveHint")
        : t("themeCustomBuiltinHint");
    }
    if (themeCustomGrid) themeCustomGrid.hidden = !isCustom;
    if (btnThemeCustomDelete) btnThemeCustomDelete.hidden = !isCustom;
    if (btnThemeCustomReset) btnThemeCustomReset.hidden = !isCustom;
    if (btnThemeCustomCreate) {
      btnThemeCustomCreate.textContent = isCustom ? t("themeCustomClone") : t("themeCustomCreate");
    }
    for (const field of THEME_CUSTOM_FIELDS) {
      const fallback = normalizeHexColor(tokens[field.token]) || "#000000";
      const resolved = fallback;
      const input = themeCustomInputs[field.settingKey];
      const valueNode = themeCustomValueNodes[field.settingKey];
      if (input) {
        input.value = resolved;
        input.disabled = !isCustom;
      }
      if (valueNode) valueNode.textContent = resolved.toUpperCase();
    }
    if (btnThemeCustomReset) btnThemeCustomReset.disabled = !isCustom;
  };

  const resetThemeCustomSettings = ({ disable = true } = {}) => {
    if (disable) state.settings.themeCustomEnabled = false;
    for (const field of THEME_CUSTOM_FIELDS) {
      state.settings[field.settingKey] = "";
    }
  };

  const migrateLegacyCustomThemeIfNeeded = () => {
    const legacyTokens = {};
    for (const field of THEME_CUSTOM_FIELDS) {
      const value = normalizeHexColor(state.settings[field.settingKey]);
      if (value) legacyTokens[field.token] = value;
    }
    const needsMigration = state.settings.themeCustomEnabled === true || Object.keys(legacyTokens).length > 0;
    if (!needsMigration) return;
    const baseTheme = findThemeById(state.serverThemes, state.settings.themeId) || state.serverThemes[0] || loadThemeCache();
    if (!baseTheme) return;
    const migrated = createCustomThemeRecordFromBase(baseTheme, state.customThemes, {
      tokens: {
        ...(baseTheme.tokens || {}),
        ...legacyTokens,
      },
    });
    if (!migrated) return;
    state.customThemes.push(migrated);
    resetThemeCustomSettings({ disable: true });
    state.settings.themeId = migrated.id;
    saveCustomThemesState();
    saveSettings(state.settings);
  };

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
  if (textIndentInput) textIndentInput.value = String(state.settings.textIndent);
  if (textAlignSelect) textAlignSelect.value = state.settings.textAlign;
  if (readingModeSelect) readingModeSelect.value = state.settings.readingMode;
  if (panelTransparencySelect) panelTransparencySelect.value = normalizePanelTransparency(state.settings.panelTransparency);
  if (miniBarsEnabledSelect) miniBarsEnabledSelect.value = (state.settings.miniBarsEnabled === false) ? "off" : "on";
  if (miniBarsScaleInput) miniBarsScaleInput.value = String(normalizeMiniBarsScale(state.settings.miniBarsScale));
  if (miniBarsScaleValue) miniBarsScaleValue.textContent = `${normalizeMiniBarsScale(state.settings.miniBarsScale).toFixed(2)}x`;
  if (tocSideSelect) tocSideSelect.value = normalizeTocSide(state.settings.tocSide);
  const syncComicEdgeTintForm = () => {
    state.settings.comicEdgeTintEnabled = state.settings.comicEdgeTintEnabled === true;
    state.settings.comicEdgeTintStrength = normalizeComicEdgeTintStrength(state.settings.comicEdgeTintStrength);
    if (comicEdgeTintEnabledSelect) comicEdgeTintEnabledSelect.value = state.settings.comicEdgeTintEnabled ? "on" : "off";
    if (comicEdgeTintStrengthInput) comicEdgeTintStrengthInput.value = String(state.settings.comicEdgeTintStrength);
    if (comicEdgeTintStrengthValue) comicEdgeTintStrengthValue.textContent = `${state.settings.comicEdgeTintStrength}%`;
    if (comicEdgeTintStrengthWrap) comicEdgeTintStrengthWrap.hidden = !state.settings.comicEdgeTintEnabled;
  };
  syncComicEdgeTintForm();
  state.settings.translationEnabled = state.settings.translationEnabled !== false;
  state.settings.translationMode = normalizeTranslationMode(state.settings.translationMode);
  if (translationEnabledSelect) translationEnabledSelect.value = state.settings.translationEnabled ? "on" : "off";
  if (translationModeSelect) translationModeSelect.value = state.settings.translationMode;
  if (qs("font-size-value")) qs("font-size-value").textContent = `${state.settings.fontSize}px`;
  if (qs("line-height-value")) qs("line-height-value").textContent = `${state.settings.lineHeight.toFixed(2)}`;
  if (qs("paragraph-spacing-value")) qs("paragraph-spacing-value").textContent = `${state.settings.paragraphSpacing.toFixed(2)}em`;
  if (qs("text-indent-value")) qs("text-indent-value").textContent = `${state.settings.textIndent.toFixed(2)}em`;

  try {
    const themesData = await api("/api/themes");
    state.serverThemes = themesData.items || [];
    if (!findThemeById(state.serverThemes, state.settings.themeId) && !isCustomThemeId(state.settings.themeId)) {
      state.settings.themeId = themesData.active || (state.serverThemes[0] && state.serverThemes[0].id) || state.settings.themeId;
    }
    migrateLegacyCustomThemeIfNeeded();
    rebuildThemeCatalog();
    applyTheme(state.themes, state.settings);
    syncThemeCustomForm();
    saveSettings(state.settings);
    emitSettingsChanged(state.settings);
  } catch {
    rebuildThemeCatalog();
    applyTheme(state.themes, state.settings);
    syncThemeCustomForm();
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

  const notificationState = {
    items: [],
    count: 0,
    unreadCount: 0,
    activeCount: 0,
    sig: "",
    selected: new Set(),
    pendingActions: new Set(),
    ui: null,
    eventSource: null,
    reconnectTimer: 0,
    listeners: new Set(),
  };
  let readerUpdateUi = null;
  let readerUpdateAutoOpenTimer = 0;

  const clearReaderUpdateAutoOpenTimer = () => {
    if (!readerUpdateAutoOpenTimer) return;
    window.clearTimeout(readerUpdateAutoOpenTimer);
    readerUpdateAutoOpenTimer = 0;
  };

  const listOpenDialogs = () => Array.from(document.querySelectorAll("dialog[open]"))
    .filter((node) => node instanceof HTMLDialogElement);

  const hasBlockingDialogForReaderUpdate = () => (
    listOpenDialogs().some((dialogNode) => dialogNode.id !== "reader-update-dialog")
  );

  const ensureReaderUpdateUi = () => {
    if (readerUpdateUi) return readerUpdateUi;
    let dialog = qs("reader-update-dialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "reader-update-dialog";
      dialog.className = "dialog reader-update-dialog";
      dialog.innerHTML = `
        <div class="dialog-head">
          <h3 id="reader-update-title">${t("readerUpdateTitle")}</h3>
          <button id="btn-reader-update-close-top" class="btn btn-small" type="button">${t("close")}</button>
        </div>
        <p id="reader-update-preview" class="dialog-subtitle"></p>
        <div id="reader-update-detail" class="reader-update-detail"></div>
        <div class="dialog-actions">
          <button id="btn-reader-update-hide-2h" class="btn" type="button">${t("readerUpdateHideTwoHours")}</button>
          <button id="btn-reader-update-close" class="btn" type="button">${t("close")}</button>
        </div>
      `;
      document.body.appendChild(dialog);
    }
    const ui = {
      dialog,
      title: qs("reader-update-title"),
      preview: qs("reader-update-preview"),
      detail: qs("reader-update-detail"),
      btnCloseTop: qs("btn-reader-update-close-top"),
      btnHideTwoHours: qs("btn-reader-update-hide-2h"),
      btnClose: qs("btn-reader-update-close"),
      currentSig: "",
    };
    const closeDialog = ({ rememberSeen = true } = {}) => {
      clearReaderUpdateAutoOpenTimer();
      if (rememberSeen && ui.currentSig) markReaderUpdatePopupSeenThisSession(ui.currentSig);
      if (ui.dialog.open) ui.dialog.close();
    };
    const closeDialogByUser = () => {
      closeDialog({ rememberSeen: true });
    };
    ui.btnCloseTop?.addEventListener("click", closeDialogByUser);
    ui.btnClose?.addEventListener("click", closeDialogByUser);
    ui.btnHideTwoHours?.addEventListener("click", () => {
      if (ui.currentSig) {
        const hideUntilTs = Date.now() + READER_UPDATE_POPUP_HIDE_MS;
        writeReaderUpdatePopupHideState(ui.currentSig, hideUntilTs);
        markReaderUpdatePopupSeenThisSession(ui.currentSig);
      }
      closeDialog({ rememberSeen: false });
    });
    ui.dialog.addEventListener("close", () => {
      clearReaderUpdateAutoOpenTimer();
      if (ui.currentSig) markReaderUpdatePopupSeenThisSession(ui.currentSig);
    });
    ui.dialog.addEventListener("cancel", () => {
      clearReaderUpdateAutoOpenTimer();
    });
    ui.closeDialog = closeDialog;
    readerUpdateUi = ui;
    return ui;
  };

  const shouldAutoOpenReaderUpdateDialog = (status) => {
    if (!(status && status.update_available)) return false;
    const contentSig = String(status.content_sig || "").trim();
    if (!contentSig) return false;
    const hideState = readReaderUpdatePopupHideState();
    if (hideState && hideState.contentSig === contentSig && hideState.hideUntilTs > Date.now()) return false;
    if (hasSeenReaderUpdatePopupThisSession(contentSig)) return false;
    return true;
  };

  const renderReaderUpdateDialog = (status) => {
    const ui = ensureReaderUpdateUi();
    if (!ui) return null;
    const localServerVersion = String(((status && status.local) || {}).reader_server_version || "").trim();
    const localUiVersion = String(((status && status.local) || {}).reader_ui_version || "").trim() || UI_RUNTIME_VERSION;
    const nextServerVersion = String(((status && status.remote) || {}).reader_server_version || "").trim();
    const nextUiVersion = String(((status && status.remote) || {}).reader_ui_version || "").trim();
    const detailParts = [];
    const detailText = String((status && status.detail) || "").trim();
    if (detailText) detailParts.push(detailText);
    if (!detailText && (localServerVersion || localUiVersion || nextServerVersion || nextUiVersion)) {
      detailParts.push(
        [
          "Đang dùng:",
          `- Reader Server: ${localServerVersion || "?"}`,
          `- Reader UI: ${localUiVersion || "?"}`,
          "",
          "Bản mới nhất:",
          `- Reader Server: ${nextServerVersion || "?"}`,
          `- Reader UI: ${nextUiVersion || "?"}`,
        ].join("\n"),
      );
    }
    ui.currentSig = String((status && status.content_sig) || "").trim();
    if (ui.title) ui.title.textContent = String((status && status.title) || t("readerUpdateTitle"));
    if (ui.preview) ui.preview.textContent = String((status && status.preview) || t("readerUpdatePreview"));
    if (ui.detail) setNoticeRichText(ui.detail, detailParts.join("\n\n").trim(), { forceMarkdown: true });
    return ui;
  };

  const scheduleReaderUpdateAutoOpen = (status, delay = 0) => {
    clearReaderUpdateAutoOpenTimer();
    if (!shouldAutoOpenReaderUpdateDialog(status)) return;
    readerUpdateAutoOpenTimer = window.setTimeout(() => {
      readerUpdateAutoOpenTimer = 0;
      if (hasBlockingDialogForReaderUpdate()) {
        scheduleReaderUpdateAutoOpen(status, 320);
        return;
      }
      const ui = renderReaderUpdateDialog(status);
      if (!(ui && !ui.dialog.open)) return;
      try {
        ui.dialog.showModal();
      } catch {
        scheduleReaderUpdateAutoOpen(status, 320);
      }
    }, Math.max(0, Number(delay || 0)));
  };

  const checkReaderUpdateStatus = async ({ force = false, autoOpen = false } = {}) => {
    const data = await api(`/api/reader/update-status${force ? "?force=1" : ""}`);
    if (data && typeof data === "object") {
      state.readerUpdateStatus = data;
      if (!((data.local || {}).reader_ui_version)) {
        data.local = { ...(data.local || {}), reader_ui_version: UI_RUNTIME_VERSION };
      }
      if (autoOpen) scheduleReaderUpdateAutoOpen(data, 0);
    }
    return data;
  };

  const ensureNotificationUi = () => {
    if (notificationState.ui) return notificationState.ui;
    const actionsHost = document.querySelector(".topbar-actions");
    if (!actionsHost) return null;

    let bellButton = qs("btn-open-notifications");
    if (!bellButton) {
      bellButton = document.createElement("button");
      bellButton.id = "btn-open-notifications";
      bellButton.type = "button";
      bellButton.className = "btn btn-icon btn-notification-bell";
      bellButton.setAttribute("aria-label", t("notifications"));
      bellButton.innerHTML = `
        <span class="notification-bell-icon">${buildNotificationBellSvg()}</span>
        <span id="notification-badge" class="notification-badge hidden" aria-hidden="true"></span>
      `;
      const settingsButton = qs("btn-open-settings");
      if (settingsButton && settingsButton.parentElement === actionsHost) {
        actionsHost.insertBefore(bellButton, settingsButton);
      } else {
        actionsHost.appendChild(bellButton);
      }
    }

    let dialog = qs("notifications-dialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "notifications-dialog";
      dialog.className = "dialog notification-center-dialog";
      dialog.innerHTML = `
        <div class="dialog-head">
          <h3 id="notifications-title">${t("notificationTitle")}</h3>
          <button id="btn-notifications-close" class="btn btn-small" type="button">${t("close")}</button>
        </div>
        <p id="notifications-summary" class="dialog-subtitle"></p>
        <div class="notification-toolbar">
          <span id="notifications-selection-summary" class="notification-selection-summary hidden"></span>
          <button id="btn-notifications-mark-read" class="btn btn-small" type="button">${t("notificationMarkSelectedRead")}</button>
          <button id="btn-notifications-delete" class="btn btn-small" type="button">${t("notificationDeleteSelected")}</button>
          <button id="btn-notifications-clear-read" class="btn btn-small" type="button">${t("notificationClearRead")}</button>
          <button id="btn-notifications-clear-all" class="btn btn-small" type="button">${t("notificationClearAll")}</button>
        </div>
        <div id="notifications-list" class="notification-list"></div>
        <p id="notifications-empty" class="empty-text hidden">${t("notificationEmpty")}</p>
      `;
      document.body.appendChild(dialog);
    }

    let detailDialog = qs("notification-detail-dialog");
    if (!detailDialog) {
      detailDialog = document.createElement("dialog");
      detailDialog.id = "notification-detail-dialog";
      detailDialog.className = "dialog notification-detail-dialog";
      detailDialog.innerHTML = `
        <div class="dialog-head">
          <h3 id="notification-detail-title">${t("notificationDetailTitle")}</h3>
          <button id="btn-notification-detail-close" class="btn btn-small" type="button">${t("close")}</button>
        </div>
        <div class="notification-detail-content">
          <div class="notification-detail-meta">
            <span id="notification-detail-status" class="notification-status-chip"></span>
            <span id="notification-detail-topic" class="notification-detail-topic"></span>
          </div>
          <p id="notification-detail-updated" class="dialog-subtitle"></p>
          <p id="notification-detail-created" class="dialog-subtitle"></p>
        <div id="notification-detail-body" class="notification-detail-body"></div>
        </div>
        <div class="dialog-actions">
          <div id="notification-detail-actions-extra" class="notification-detail-actions-extra"></div>
          <button id="btn-notification-detail-read" class="btn" type="button">${t("notificationMarkRead")}</button>
          <button id="btn-notification-detail-delete" class="btn" type="button">${t("notificationDeleteOne")}</button>
        </div>
      `;
      document.body.appendChild(detailDialog);
    }

    const ui = {
      bellButton,
      badge: qs("notification-badge"),
      dialog,
      detailDialog,
      summary: qs("notifications-summary"),
      selectionSummary: qs("notifications-selection-summary"),
      btnClose: qs("btn-notifications-close"),
      btnMarkRead: qs("btn-notifications-mark-read"),
      btnDelete: qs("btn-notifications-delete"),
      btnClearRead: qs("btn-notifications-clear-read"),
      btnClearAll: qs("btn-notifications-clear-all"),
      list: qs("notifications-list"),
      empty: qs("notifications-empty"),
      detailTitle: qs("notification-detail-title"),
      detailStatus: qs("notification-detail-status"),
      detailTopic: qs("notification-detail-topic"),
      detailUpdated: qs("notification-detail-updated"),
      detailCreated: qs("notification-detail-created"),
      detailBody: qs("notification-detail-body"),
      detailActionsExtra: qs("notification-detail-actions-extra"),
      btnDetailClose: qs("btn-notification-detail-close"),
      btnDetailRead: qs("btn-notification-detail-read"),
      btnDetailDelete: qs("btn-notification-detail-delete"),
      activeDetailId: "",
      returnToNotificationList: false,
    };

    const openNotificationCenterDialog = async () => {
      ui.returnToNotificationList = false;
      if (ui.detailDialog && ui.detailDialog.open) ui.detailDialog.close();
      if (readerUpdateUi && readerUpdateUi.dialog.open) {
        readerUpdateUi.closeDialog?.();
      }
      if (!ui.dialog.open) ui.dialog.showModal();
      if (!notificationState.items.length) {
        try {
          await loadNotifications();
        } catch {
          // ignore temporary network error
        }
      }
    };

    const openNotificationDetailDialog = () => {
      if (!ui.detailDialog) return;
      if (readerUpdateUi && readerUpdateUi.dialog.open) {
        readerUpdateUi.closeDialog?.();
      }
      const cameFromList = Boolean(ui.dialog && ui.dialog.open);
      if (cameFromList) ui.returnToNotificationList = true;
      else if (!ui.detailDialog.open) ui.returnToNotificationList = false;
      if (cameFromList) ui.dialog.close();
      if (!ui.detailDialog.open) ui.detailDialog.showModal();
    };

    const syncNotificationControls = () => {
      const selectedCount = notificationState.selected.size;
      if (ui.selectionSummary) {
        ui.selectionSummary.textContent = selectedCount > 0
          ? t("notificationSelectionSummary", { count: selectedCount })
          : "";
        ui.selectionSummary.classList.toggle("hidden", selectedCount <= 0);
      }
      if (ui.btnMarkRead) ui.btnMarkRead.disabled = selectedCount <= 0;
      if (ui.btnDelete) ui.btnDelete.disabled = getSelectedDeletableNotificationIds().length <= 0;
      if (ui.btnClearRead) {
        ui.btnClearRead.disabled = notificationState.items.every((item) => {
          if (!item || !notificationAllowsClear(item) || !item.read) return true;
          return normalizeNotificationStatus(item.status) === "running";
        });
      }
      if (ui.btnClearAll) ui.btnClearAll.disabled = notificationState.items.every((item) => !notificationAllowsClear(item));
    };

    const syncNotificationBadge = () => {
      if (!ui.badge) return;
      const unreadCount = Math.max(0, Number(notificationState.unreadCount || 0));
      const activeCount = Math.max(0, Number(notificationState.activeCount || 0));
      ui.badge.classList.remove("hidden", "active", "unread");
      if (unreadCount > 0) {
        ui.badge.classList.add("unread");
        ui.bellButton.title = `${t("notifications")} • ${unreadCount} chưa đọc`;
        return;
      }
      if (activeCount > 0) {
        ui.badge.classList.add("active");
        ui.bellButton.title = `${t("notifications")} • ${activeCount} đang chạy`;
        return;
      }
      ui.badge.classList.add("hidden");
      ui.bellButton.title = t("notifications");
    };

    const normalizeNotificationMetaBool = (value) => {
      if (typeof value === "boolean") return value;
      return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
    };

    const notificationAllowsDelete = (item) => item && item.allow_delete !== false;
    const notificationAllowsClear = (item) => item && item.allow_clear !== false;
    const getSelectedDeletableNotificationIds = () => (
      Array.from(notificationState.selected).filter((notifId) => {
        const current = notificationState.items.find((item) => String((item && item.id) || "").trim() === String(notifId || "").trim());
        return notificationAllowsDelete(current);
      })
    );

    const buildImportNotificationActions = (item) => {
      if (!item || String(item.topic || "").trim().toLowerCase() !== "import") return [];
      const meta = (item.meta && typeof item.meta === "object") ? item.meta : {};
      const status = normalizeNotificationStatus(item.status);
      const snapshotId = String(meta.snapshot_id || "").trim();
      const hasBookIds = String(meta.book_ids_csv || "").trim().length > 0;
      const pendingCount = Math.max(0, Number(meta.pending_count || 0));
      const retryCount = Math.max(0, Number(meta.retry_count || 0));
      const hasExplicitResume = Object.prototype.hasOwnProperty.call(meta, "can_resume");
      const hasExplicitRetry = Object.prototype.hasOwnProperty.call(meta, "can_retry");
      const canResume = hasExplicitResume
        ? normalizeNotificationMetaBool(meta.can_resume)
        : Boolean(status === "warning" && snapshotId && pendingCount > 0);
      const canRetry = hasExplicitRetry
        ? normalizeNotificationMetaBool(meta.can_retry)
        : Boolean((status === "failed" || status === "warning") && (snapshotId || hasBookIds || retryCount > 0));
      const actions = [];
      if (canResume) actions.push({ id: "resume", label: t("notificationResume") });
      if (canRetry) actions.push({ id: "retry", label: t("notificationRetry") });
      return actions;
    };

    const triggerNotificationAction = async (item, action) => {
      const notifId = String((item && item.id) || "").trim();
      if (!notifId) return;
      const pendingKey = `${notifId}:${String(action || "").trim().toLowerCase()}`;
      if (!pendingKey || notificationState.pendingActions.has(pendingKey)) return;
      notificationState.pendingActions.add(pendingKey);
      renderNotificationList();
      const currentDetail = notificationState.items.find((row) => String((row && row.id) || "").trim() === ui.activeDetailId);
      if (currentDetail && ui.detailDialog && ui.detailDialog.open) renderNotificationDetail(currentDetail);
      try {
        const data = await api("/api/library/import/jobs/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notification_id: notifId,
            action: String(action || "").trim().toLowerCase(),
          }),
        });
        if (data && data.listing) applyNotificationListing(data.listing);
        if (data && data.reapplied_categories) {
          showToast("Đã gán lại danh mục cho các truyện đã nhập.");
        } else if (data && data.job) {
          showToast(action === "resume" ? "Đã đưa tiến trình trở lại hàng chờ." : "Đã gửi yêu cầu thử lại.");
        }
      } catch (error) {
        showToast(error.displayMessage || error.message || t("toastError"));
      } finally {
        notificationState.pendingActions.delete(pendingKey);
        renderNotificationList();
        const nextDetail = notificationState.items.find((row) => String((row && row.id) || "").trim() === ui.activeDetailId);
        if (nextDetail && ui.detailDialog && ui.detailDialog.open) renderNotificationDetail(nextDetail);
      }
    };

    const renderNotificationDetail = (item) => {
      if (!item || !ui.detailDialog) return;
      ui.activeDetailId = String(item.id || "").trim();
      if (ui.detailTitle) ui.detailTitle.textContent = String(item.title || t("notificationDetailTitle"));
      if (ui.detailStatus) {
        const status = normalizeNotificationStatus(item.status);
        ui.detailStatus.className = `notification-status-chip ${status}`;
        ui.detailStatus.textContent = notificationStatusLabel(status);
      }
      if (ui.detailTopic) {
        const topicBits = [String(item.topic_label || item.topic || "").trim()];
        if (item.pinned) topicBits.push(t("notificationPinned"));
        ui.detailTopic.textContent = topicBits.filter(Boolean).join(" • ");
      }
      if (ui.detailUpdated) {
        ui.detailUpdated.textContent = `${t("notificationUpdatedAt")}: ${formatLocalDateTime(item.updated_at) || "-"}`;
      }
      if (ui.detailCreated) {
        ui.detailCreated.textContent = `${t("notificationCreatedAt")}: ${formatLocalDateTime(item.created_at) || "-"}`;
      }
      if (ui.detailBody) {
        const lines = [];
        if (item.preview) lines.push(String(item.preview || "").trim());
        if (Number(item.progress_total || 0) > 0) {
          const current = Math.max(0, Number(item.progress_current || 0));
          const total = Math.max(0, Number(item.progress_total || 0));
          const percent = Math.max(0, Math.min(100, Number(item.progress_percent || 0)));
          lines.push(`Tiến độ: ${current}/${total} • ${percent.toFixed(0)}%`);
        }
        const detailText = String(item.detail || "").trim();
        if (detailText) lines.push(detailText);
        setNoticeRichText(ui.detailBody, lines.filter(Boolean).join("\n\n").trim());
      }
      if (ui.detailActionsExtra) {
        ui.detailActionsExtra.innerHTML = "";
        const actions = buildImportNotificationActions(item);
        for (const actionDef of actions) {
          const pendingKey = `${String(item.id || "").trim()}:${actionDef.id}`;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn btn-small";
          btn.textContent = String(actionDef.label || "").trim();
          btn.disabled = notificationState.pendingActions.has(pendingKey);
          btn.addEventListener("click", () => {
            triggerNotificationAction(item, actionDef.id).catch(() => {});
          });
          ui.detailActionsExtra.appendChild(btn);
        }
      }
      if (ui.btnDetailRead) {
        ui.btnDetailRead.textContent = item.read ? t("notificationMarkUnread") : t("notificationMarkRead");
      }
      if (ui.btnDetailDelete) {
        ui.btnDetailDelete.hidden = !notificationAllowsDelete(item);
        ui.btnDetailDelete.disabled = !notificationAllowsDelete(item);
      }
      openNotificationDetailDialog();
    };

    const renderNotificationList = () => {
      if (!ui.list || !ui.empty) return;
      ui.list.innerHTML = "";
      const items = Array.isArray(notificationState.items) ? notificationState.items : [];
      if (ui.summary) {
        if (notificationState.unreadCount > 0 && notificationState.activeCount > 0) {
          ui.summary.textContent = t("notificationSummary", {
            unread: notificationState.unreadCount,
            active: notificationState.activeCount,
          });
        } else if (notificationState.unreadCount > 0) {
          ui.summary.textContent = t("notificationSummaryNoActive", { unread: notificationState.unreadCount });
        } else if (notificationState.activeCount > 0) {
          ui.summary.textContent = t("notificationSummaryNoUnread", { active: notificationState.activeCount });
        } else {
          ui.summary.textContent = "";
        }
      }
      if (!items.length) {
        ui.empty.classList.remove("hidden");
        syncNotificationControls();
        syncNotificationBadge();
        return;
      }
      ui.empty.classList.add("hidden");
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const status = normalizeNotificationStatus(item.status);
        const card = document.createElement("article");
        card.className = `notification-card ${status}${item.read && status !== "running" ? " read" : ""}`;
        if (item.pinned) card.classList.add("pinned");
        card.setAttribute("data-notification-id", String(item.id || ""));

        const selector = document.createElement("label");
        selector.className = "notification-card-select";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = notificationState.selected.has(String(item.id || ""));
        checkbox.disabled = !notificationAllowsDelete(item);
        checkbox.addEventListener("click", (event) => event.stopPropagation());
        checkbox.addEventListener("change", () => {
          const notifId = String(item.id || "").trim();
          if (!notifId) return;
          if (checkbox.checked) notificationState.selected.add(notifId);
          else notificationState.selected.delete(notifId);
          syncNotificationControls();
        });
        selector.appendChild(checkbox);

        const body = document.createElement("div");
        body.className = "notification-card-body";
        const head = document.createElement("div");
        head.className = "notification-card-head";
        const titleWrap = document.createElement("div");
        titleWrap.className = "notification-card-title-wrap";
        const titleNode = document.createElement("div");
        titleNode.className = "notification-card-title";
        titleNode.textContent = String(item.title || "");
        const previewNode = document.createElement("div");
        previewNode.className = "notification-card-preview";
        previewNode.textContent = String(item.preview || "");
        titleWrap.append(titleNode, previewNode);

        const side = document.createElement("div");
        side.className = "notification-card-side";
        const chip = document.createElement("span");
        chip.className = `notification-status-chip ${status}`;
        chip.textContent = notificationStatusLabel(status);
        const timeNode = document.createElement("span");
        timeNode.className = "notification-card-time";
        timeNode.textContent = formatRelativeTime(item.updated_at) || formatLocalDateTime(item.updated_at);
        side.append(chip, timeNode);
        head.append(titleWrap, side);

        const meta = document.createElement("div");
        meta.className = "notification-card-meta";
        const metaParts = [];
        if (item.pinned) metaParts.push(t("notificationPinned"));
        if (item.topic_label || item.topic) metaParts.push(String(item.topic_label || item.topic));
        if (Number(item.progress_total || 0) > 0) {
          metaParts.push(`${Math.max(0, Number(item.progress_current || 0))}/${Math.max(0, Number(item.progress_total || 0))}`);
        }
        meta.textContent = metaParts.join(" • ");
        body.append(head, meta);
        const actions = buildImportNotificationActions(item);
        if (actions.length) {
          const actionRow = document.createElement("div");
          actionRow.className = "notification-card-actions";
          for (const actionDef of actions) {
            const pendingKey = `${String(item.id || "").trim()}:${actionDef.id}`;
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn btn-small";
            btn.textContent = String(actionDef.label || "").trim();
            btn.disabled = notificationState.pendingActions.has(pendingKey);
            btn.addEventListener("click", (event) => {
              event.preventDefault();
              event.stopPropagation();
              triggerNotificationAction(item, actionDef.id).catch(() => {});
            });
            actionRow.appendChild(btn);
          }
          body.appendChild(actionRow);
        }
        if (Number(item.progress_total || 0) > 0) {
          const progressOuter = document.createElement("div");
          progressOuter.className = "notification-progress";
          const progressInner = document.createElement("div");
          progressInner.className = "notification-progress-fill";
          progressInner.style.width = `${Math.max(0, Math.min(100, Number(item.progress_percent || 0))).toFixed(1)}%`;
          progressOuter.appendChild(progressInner);
          body.appendChild(progressOuter);
        }
        card.append(selector, body);
        card.addEventListener("click", async () => {
          renderNotificationDetail(item);
          if (!item.read) {
            markNotificationsRead([String(item.id || "").trim()], true).catch(() => {});
          }
        });
        ui.list.appendChild(card);
      }
      syncNotificationControls();
      syncNotificationBadge();
    };

    const applyNotificationListing = (payload) => {
      const items = Array.isArray(payload && payload.items) ? payload.items : [];
      const validIds = new Set(
        items
          .map((item) => String((item && item.id) || "").trim())
          .filter(Boolean),
      );
      notificationState.items = items;
      notificationState.count = Math.max(0, Number((payload && payload.count) || items.length || 0));
      notificationState.unreadCount = Math.max(0, Number((payload && payload.unread_count) || 0));
      notificationState.activeCount = Math.max(0, Number((payload && payload.active_count) || 0));
      notificationState.sig = String((payload && payload.sig) || "");
      notificationState.selected = new Set(Array.from(notificationState.selected).filter((id) => validIds.has(id)));
      if (ui.activeDetailId) {
        const current = items.find((item) => String((item && item.id) || "").trim() === ui.activeDetailId);
        if (current && ui.detailDialog && ui.detailDialog.open) {
          renderNotificationDetail(current);
        } else {
          ui.activeDetailId = "";
          if (ui.detailDialog && ui.detailDialog.open) ui.detailDialog.close();
        }
      }
      renderNotificationList();
      for (const listener of Array.from(notificationState.listeners)) {
        try {
          listener({
            items: notificationState.items,
            count: notificationState.count,
            unread_count: notificationState.unreadCount,
            active_count: notificationState.activeCount,
            sig: notificationState.sig,
          });
        } catch {
          // ignore listener errors from page modules
        }
      }
    };

    const loadNotifications = async () => {
      const data = await api("/api/notifications?limit=160");
      applyNotificationListing(data);
      return data;
    };

    const markNotificationsRead = async (ids, read = true) => {
      const notifIds = Array.isArray(ids) ? ids.filter(Boolean) : [];
      if (!notifIds.length) return null;
      const data = await api("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: notifIds, read: Boolean(read) }),
      });
      if (data && data.listing) applyNotificationListing(data.listing);
      return data;
    };

    const deleteNotifications = async (ids) => {
      const notifIds = Array.isArray(ids) ? ids.filter(Boolean) : [];
      if (!notifIds.length) return null;
      const data = await api("/api/notifications/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: notifIds }),
      });
      if (data && data.listing) applyNotificationListing(data.listing);
      return data;
    };

    const clearNotifications = async (scope = "read") => {
      const data = await api("/api/notifications/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      if (data && data.listing) applyNotificationListing(data.listing);
      return data;
    };

    const closeNotificationStream = () => {
      if (notificationState.eventSource) {
        notificationState.eventSource.close();
        notificationState.eventSource = null;
      }
      if (notificationState.reconnectTimer) {
        window.clearTimeout(notificationState.reconnectTimer);
        notificationState.reconnectTimer = 0;
      }
    };

    const scheduleNotificationReconnect = () => {
      if (notificationState.reconnectTimer) return;
      notificationState.reconnectTimer = window.setTimeout(() => {
        notificationState.reconnectTimer = 0;
        startNotificationStream();
      }, 1800);
    };

    const startNotificationStream = () => {
      closeNotificationStream();
      const params = new URLSearchParams();
      params.set("limit", "160");
      if (notificationState.sig) params.set("last_sig", notificationState.sig);
      const stream = new EventSource(`/api/notifications/stream?${params.toString()}`);
      notificationState.eventSource = stream;
      stream.addEventListener("notifications", (event) => {
        try {
          const payload = JSON.parse(event.data || "{}");
          applyNotificationListing(payload);
        } catch {
          // ignore malformed event
        }
      });
      stream.addEventListener("error", () => {
        closeNotificationStream();
        scheduleNotificationReconnect();
      });
    };

    const upsertNotificationTask = async (payload) => {
      if (!payload || typeof payload !== "object") return null;
      const data = await api("/api/notifications/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (data && data.listing) applyNotificationListing(data.listing);
      return data;
    };

    const createNotificationTaskId = (prefix = "task") => {
      const head = String(prefix || "task").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_") || "task";
      return `${head}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    };

    const subscribeNotifications = (listener) => {
      if (typeof listener !== "function") return () => {};
      notificationState.listeners.add(listener);
      try {
        listener({
          items: notificationState.items,
          count: notificationState.count,
          unread_count: notificationState.unreadCount,
          active_count: notificationState.activeCount,
          sig: notificationState.sig,
        });
      } catch {
        // ignore listener bootstrap errors
      }
      return () => {
        notificationState.listeners.delete(listener);
      };
    };

    bellButton.addEventListener("click", () => {
      openNotificationCenterDialog().catch(() => {});
    });
    if (ui.btnClose) ui.btnClose.addEventListener("click", () => { if (dialog.open) dialog.close(); });
    if (ui.detailDialog) {
      ui.detailDialog.addEventListener("close", () => {
        ui.activeDetailId = "";
        const shouldReturnToList = ui.returnToNotificationList;
        ui.returnToNotificationList = false;
        if (shouldReturnToList) {
          window.setTimeout(() => {
            if (!ui.dialog.open) {
              try {
                if (readerUpdateUi && readerUpdateUi.dialog.open) {
                  readerUpdateUi.closeDialog?.();
                }
                ui.dialog.showModal();
              } catch {
                // ignore invalid modal state
              }
            }
          }, 0);
        }
      });
    }
    if (ui.btnMarkRead) {
      ui.btnMarkRead.addEventListener("click", async () => {
        const ids = Array.from(notificationState.selected);
        if (!ids.length) return;
        await markNotificationsRead(ids, true);
      });
    }
    if (ui.btnDelete) {
      ui.btnDelete.addEventListener("click", async () => {
        const ids = getSelectedDeletableNotificationIds();
        if (!ids.length) return;
        if (!await confirmDialog({
          title: t("notificationConfirmTitle"),
          message: t("notificationConfirmDeleteSelected"),
          confirmText: t("notificationDeleteSelected"),
        })) return;
        await deleteNotifications(ids);
      });
    }
    if (ui.btnClearRead) {
      ui.btnClearRead.addEventListener("click", async () => {
        if (!await confirmDialog({
          title: t("notificationConfirmTitle"),
          message: t("notificationConfirmClearRead"),
          confirmText: t("notificationClearRead"),
        })) return;
        await clearNotifications("read");
      });
    }
    if (ui.btnClearAll) {
      ui.btnClearAll.addEventListener("click", async () => {
        if (!await confirmDialog({
          title: t("notificationConfirmTitle"),
          message: t("notificationConfirmClearAll"),
          confirmText: t("notificationClearAll"),
        })) return;
        await clearNotifications("all");
      });
    }
    if (ui.btnDetailClose) ui.btnDetailClose.addEventListener("click", () => {
      if (ui.detailDialog.open) ui.detailDialog.close();
    });
    if (ui.btnDetailRead) {
      ui.btnDetailRead.addEventListener("click", async () => {
        const current = notificationState.items.find((item) => String((item && item.id) || "").trim() === ui.activeDetailId);
        if (!current) return;
        await markNotificationsRead([ui.activeDetailId], !current.read);
      });
    }
    if (ui.btnDetailDelete) {
      ui.btnDetailDelete.addEventListener("click", async () => {
        if (!ui.activeDetailId) return;
        const current = notificationState.items.find((item) => String((item && item.id) || "").trim() === ui.activeDetailId);
        if (!notificationAllowsDelete(current)) {
          showToast(t("notificationProtectedCard"));
          return;
        }
        if (!await confirmDialog({
          title: t("notificationConfirmTitle"),
          message: t("notificationConfirmDeleteOne"),
          confirmText: t("notificationDeleteOne"),
        })) return;
        await deleteNotifications([ui.activeDetailId]);
      });
    }

    notificationState.ui = {
      ...ui,
      applyNotificationListing,
      loadNotifications,
      markNotificationsRead,
      deleteNotifications,
      clearNotifications,
      closeNotificationStream,
      startNotificationStream,
      upsertNotificationTask,
      createNotificationTaskId,
      subscribeNotifications,
    };
    renderNotificationList();
    return notificationState.ui;
  };

  const notificationUi = ensureNotificationUi();

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
    const cfg = getLocalTranslationState(state.settings.translationMode);
    setLocalTranslationState(state.settings.translationMode, cfg);
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

  const syncServerTranslationForm = () => {
    const cfg = normalizeServerTranslationSettings(state.readerTranslationServer || {});
    state.readerTranslationServer = cfg;
    if (serverDelayMsInput) serverDelayMsInput.value = String(cfg.delayMs);
    if (serverMaxCharsInput) serverMaxCharsInput.value = String(cfg.maxChars);
    if (serverRetryCountInput) serverRetryCountInput.value = String(cfg.retryCount);
    if (serverTimeoutSecInput) serverTimeoutSecInput.value = String(cfg.timeoutSec);
    if (serverRetryBackoffMsInput) serverRetryBackoffMsInput.value = String(cfg.retryBackoffMs);
  };

  const collectServerTranslationSettingsFromForm = () => {
    state.readerTranslationServer = normalizeServerTranslationSettings({
      delayMs: serverDelayMsInput && serverDelayMsInput.value,
      maxChars: serverMaxCharsInput && serverMaxCharsInput.value,
      retryCount: serverRetryCountInput && serverRetryCountInput.value,
      timeoutSec: serverTimeoutSecInput && serverTimeoutSecInput.value,
      retryBackoffMs: serverRetryBackoffMsInput && serverRetryBackoffMsInput.value,
    });
    return state.readerTranslationServer;
  };

  const collectLocalTranslationSettingsFromForm = () => {
    const mode = normalizeTranslationMode(state.settings.translationMode);
    const current = getLocalTranslationState(mode);
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
    return setLocalTranslationState(mode, next);
  };

  const syncReaderTranslationForm = () => {
    state.settings.translationEnabled = state.settings.translationEnabled !== false;
    state.settings.translationMode = normalizeTranslationMode(state.settings.translationMode);
    state.readerTranslationTitleCacheAuto = state.readerTranslationTitleCacheAuto !== false;
    const activeMode = state.settings.translationEnabled ? state.settings.translationMode : "off";
    if (translationEnabledSelect) translationEnabledSelect.value = state.settings.translationEnabled ? "on" : "off";
    if (translationModeSelect) {
      translationModeSelect.value = state.settings.translationMode;
      translationModeSelect.disabled = !state.settings.translationEnabled;
    }
    if (titleCacheAutoSelect) titleCacheAutoSelect.value = state.readerTranslationTitleCacheAuto ? "on" : "off";
    if (localSectionLegend) {
      if (activeMode === SIM_LOCAL_TRANSLATION_MODE) localSectionLegend.textContent = t("localTranslateSettingsDichNgayLocal");
      else if (activeMode === "hanviet") localSectionLegend.textContent = t("localTranslateSettingsHanviet");
      else localSectionLegend.textContent = t("localTranslateSettingsLocal");
    }
    if (localSection) localSection.hidden = !(state.settings.translationEnabled && isLocalLikeTranslationMode(activeMode));
    if (serverTranslateSection) serverTranslateSection.hidden = !(state.settings.translationEnabled && activeMode === "server");
    syncServerTranslationForm();
    syncLocalTranslationForm();
  };

  const applyReaderTranslationSettings = ({ enabled, mode, server, local, dichngay_local, hanviet, title_cache_auto }, { emit = true } = {}) => {
    state.settings.translationEnabled = enabled !== false;
    state.settings.translationMode = normalizeTranslationMode(mode);
    state.readerTranslationServer = normalizeServerTranslationSettings(server || state.readerTranslationServer || {});
    state.readerTranslationLocal = normalizeLocalTranslationSettings(local || state.readerTranslationLocal || {});
    state.readerTranslationSimLocal = normalizeLocalTranslationSettings(dichngay_local || state.readerTranslationSimLocal || {});
    state.readerTranslationHanviet = normalizeLocalTranslationSettings(hanviet || state.readerTranslationHanviet || {});
    state.readerTranslationTitleCacheAuto = title_cache_auto !== false;
    syncReaderTranslationForm();
    saveSettings(state.settings);
    if (emit) emitSettingsChanged({
      ...state.settings,
      translationServer: state.readerTranslationServer,
      translationLocal: getLocalTranslationState(state.settings.translationMode),
    });
  };

  const persistReaderTranslationSettingsNow = async () => {
    const serverCfg = collectServerTranslationSettingsFromForm();
    const activeLocalCfg = collectLocalTranslationSettingsFromForm();
    const localCfg = normalizeLocalTranslationSettings(state.readerTranslationLocal || {});
    const simLocalCfg = normalizeLocalTranslationSettings(state.readerTranslationSimLocal || {});
    const hanvietCfg = normalizeLocalTranslationSettings(state.readerTranslationHanviet || {});
    const mode = normalizeTranslationMode(state.settings.translationMode);
    const payload = {
      translation: {
        enabled: state.settings.translationEnabled !== false,
        mode,
        title_cache_auto: state.readerTranslationTitleCacheAuto !== false,
        server: serverCfg,
        local: mode === "local" ? activeLocalCfg : localCfg,
        dichngay_local: mode === SIM_LOCAL_TRANSLATION_MODE ? activeLocalCfg : simLocalCfg,
        hanviet: mode === "hanviet" ? activeLocalCfg : hanvietCfg,
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
  const persistReaderTranslationSettings = debounceAsync(persistReaderTranslationSettingsNow, 250);

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

  const syncThemeState = ({ persist = false } = {}) => {
    applyTheme(state.themes, state.settings);
    syncThemeCustomForm();
    saveSettings(state.settings);
    emitSettingsChanged(state.settings);
    if (persist) return persistTheme(state.settings.themeId);
    return Promise.resolve();
  };

  if (themeSelect) {
    themeSelect.addEventListener("change", async () => {
      state.settings.themeId = themeSelect.value;
      await syncThemeState({ persist: true });
    });
  }

  if (btnThemeCustomCreate) {
    btnThemeCustomCreate.addEventListener("click", async () => {
      const baseTheme = getActiveTheme();
      const customTheme = createCustomThemeRecordFromBase(baseTheme, state.customThemes, {
        tokens: normalizeThemeTokens((baseTheme && baseTheme.tokens) || {}),
      });
      if (!customTheme) return;
      state.customThemes.push(customTheme);
      state.settings.themeId = customTheme.id;
      saveCustomThemesState();
      await syncThemeState({ persist: true });
      showToast(t("themeCustomCreated"));
    });
  }

  if (themeCustomNameInput) {
    themeCustomNameInput.addEventListener("input", () => {
      const activeTheme = getActiveTheme();
      if (!activeTheme || !isCustomThemeId(activeTheme.id)) return;
      const nextName = String(themeCustomNameInput.value || "").trim();
      if (!nextName) return;
      activeTheme.name = nextName;
      saveCustomThemesState();
      saveSettings(state.settings);
    });
    themeCustomNameInput.addEventListener("blur", () => {
      const activeTheme = getActiveTheme();
      if (!activeTheme || !isCustomThemeId(activeTheme.id)) return;
      if (!String(themeCustomNameInput.value || "").trim()) {
        themeCustomNameInput.value = String(activeTheme.name || "");
      }
    });
  }

  for (const field of THEME_CUSTOM_FIELDS) {
    const input = themeCustomInputs[field.settingKey];
    if (!input) continue;
    input.addEventListener("input", () => {
      const nextColor = normalizeHexColor(input.value);
      const activeTheme = getActiveTheme();
      if (!activeTheme || !isCustomThemeId(activeTheme.id) || !nextColor) return;
      activeTheme.tokens = {
        ...(activeTheme.tokens || {}),
        [field.token]: nextColor,
      };
      saveCustomThemesState();
      syncThemeState();
    });
  }

  if (btnThemeCustomReset) {
    btnThemeCustomReset.addEventListener("click", () => {
      const activeTheme = getActiveTheme();
      const baseTheme = getActiveBaseTheme();
      if (!activeTheme || !isCustomThemeId(activeTheme.id) || !baseTheme) return;
      activeTheme.tokens = normalizeThemeTokens(baseTheme.tokens || {});
      saveCustomThemesState();
      syncThemeState();
      showToast(t("themeCustomReset"));
    });
  }

  if (btnThemeCustomDelete) {
    btnThemeCustomDelete.addEventListener("click", async () => {
      const activeTheme = getActiveTheme();
      if (!activeTheme || !isCustomThemeId(activeTheme.id)) return;
      if (!await confirmDialog({
        title: t("themeCustomDeleteTitle"),
        message: t("themeCustomDeleteConfirm", { name: activeTheme.name || t("themeCustomTag") }),
        confirmText: t("themeCustomDeleteButton"),
      })) return;
      const fallbackTheme = findThemeById(state.serverThemes, activeTheme.baseThemeId)
        || state.serverThemes[0]
        || state.themes.find((item) => item.id !== activeTheme.id)
        || loadThemeCache();
      state.customThemes = state.customThemes.filter((item) => item.id !== activeTheme.id);
      state.settings.themeId = String((fallbackTheme && fallbackTheme.id) || DEFAULT_SETTINGS.themeId);
      saveCustomThemesState();
      await syncThemeState({ persist: true });
      showToast(t("themeCustomDeleted"));
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

  if (miniBarsScaleInput) {
    miniBarsScaleInput.addEventListener("input", () => {
      state.settings.miniBarsScale = normalizeMiniBarsScale(miniBarsScaleInput.value);
      if (miniBarsScaleValue) miniBarsScaleValue.textContent = `${state.settings.miniBarsScale.toFixed(2)}x`;
      applyReaderVars(state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
    });
  }

  if (tocSideSelect) {
    tocSideSelect.addEventListener("change", () => {
      state.settings.tocSide = normalizeTocSide(tocSideSelect.value);
      applyReaderTocSide(state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
    });
  }

  if (comicEdgeTintEnabledSelect) {
    comicEdgeTintEnabledSelect.addEventListener("change", () => {
      state.settings.comicEdgeTintEnabled = String(comicEdgeTintEnabledSelect.value || "").trim().toLowerCase() === "on";
      syncComicEdgeTintForm();
      applyReaderVars(state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
    });
  }

  if (comicEdgeTintStrengthInput) {
    comicEdgeTintStrengthInput.addEventListener("input", () => {
      state.settings.comicEdgeTintStrength = normalizeComicEdgeTintStrength(comicEdgeTintStrengthInput.value);
      syncComicEdgeTintForm();
      applyReaderVars(state.settings);
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

  if (titleCacheAutoSelect) {
    titleCacheAutoSelect.addEventListener("change", async () => {
      state.readerTranslationTitleCacheAuto = String(titleCacheAutoSelect.value || "").trim().toLowerCase() !== "off";
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
  const bindServerTranslateSetting = (node, eventName = "change") => {
    if (!node) return;
    node.addEventListener(eventName, async () => {
      collectServerTranslationSettingsFromForm();
      syncReaderTranslationForm();
      try {
        await persistReaderTranslationSettings();
      } catch (error) {
        showToast(error.message || t("toastError"));
      }
    });
  };
  bindServerTranslateSetting(serverDelayMsInput, "input");
  bindServerTranslateSetting(serverMaxCharsInput, "input");
  bindServerTranslateSetting(serverRetryCountInput, "input");
  bindServerTranslateSetting(serverTimeoutSecInput, "input");
  bindServerTranslateSetting(serverRetryBackoffMsInput, "input");
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

  if (textIndentInput) {
    textIndentInput.addEventListener("input", () => {
      const nextIndent = Number(textIndentInput.value);
      state.settings.textIndent = Number.isFinite(nextIndent) ? nextIndent : DEFAULT_SETTINGS.textIndent;
      if (qs("text-indent-value")) qs("text-indent-value").textContent = `${state.settings.textIndent.toFixed(2)}em`;
      applyReaderVars(state.settings);
      saveSettings(state.settings);
      emitSettingsChanged(state.settings);
    });
  }

  if (settingsForm) {
    settingsForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      state.settings.fontFamily = (fontFamilySelect && fontFamilySelect.value) || DEFAULT_SETTINGS.fontFamily;
      state.settings.starStyle = (starStyleSelect && starStyleSelect.value) || DEFAULT_SETTINGS.starStyle;
      state.settings.backgroundMotion = (backgroundMotionSelect && backgroundMotionSelect.value) || DEFAULT_SETTINGS.backgroundMotion;
      state.settings.textAlign = (textAlignSelect && textAlignSelect.value) || DEFAULT_SETTINGS.textAlign;
      state.settings.readingMode = (readingModeSelect && readingModeSelect.value) || DEFAULT_SETTINGS.readingMode;
      state.settings.panelTransparency = normalizePanelTransparency((panelTransparencySelect && panelTransparencySelect.value) || DEFAULT_SETTINGS.panelTransparency);
      state.settings.miniBarsEnabled = (miniBarsEnabledSelect && miniBarsEnabledSelect.value) !== "off";
      state.settings.miniBarsScale = normalizeMiniBarsScale((miniBarsScaleInput && miniBarsScaleInput.value) || DEFAULT_SETTINGS.miniBarsScale);
      state.settings.tocSide = normalizeTocSide((tocSideSelect && tocSideSelect.value) || DEFAULT_SETTINGS.tocSide);
      state.settings.comicEdgeTintEnabled = (comicEdgeTintEnabledSelect && comicEdgeTintEnabledSelect.value) === "on";
      state.settings.comicEdgeTintStrength = normalizeComicEdgeTintStrength((comicEdgeTintStrengthInput && comicEdgeTintStrengthInput.value) || DEFAULT_SETTINGS.comicEdgeTintStrength);
      state.settings.translationEnabled = (translationEnabledSelect && translationEnabledSelect.value) !== "off";
      state.settings.translationMode = normalizeTranslationMode((translationModeSelect && translationModeSelect.value) || DEFAULT_SETTINGS.translationMode);
      state.readerTranslationServer = collectServerTranslationSettingsFromForm();
      collectLocalTranslationSettingsFromForm();
      applyTheme(state.themes, state.settings);
      applyPanelStyle(state.settings);
      applyReaderVars(state.settings);
      syncThemeCustomForm();
      syncReaderTranslationForm();
      saveSettings(state.settings);
      emitSettingsChanged({
        ...state.settings,
        translationServer: state.readerTranslationServer,
        translationLocal: getLocalTranslationState(state.settings.translationMode),
      });
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
      state.settings.miniBarsScale = normalizeMiniBarsScale(state.settings.miniBarsScale);
      state.settings.tocSide = normalizeTocSide(state.settings.tocSide);
      if (fontFamilySelect) fontFamilySelect.value = state.settings.fontFamily;
      if (starStyleSelect) starStyleSelect.value = state.settings.starStyle;
      if (backgroundMotionSelect) backgroundMotionSelect.value = state.settings.backgroundMotion;
      if (fontSizeInput) fontSizeInput.value = String(state.settings.fontSize);
      if (lineHeightInput) lineHeightInput.value = String(state.settings.lineHeight);
      if (paragraphSpacingInput) paragraphSpacingInput.value = String(state.settings.paragraphSpacing);
      if (textIndentInput) textIndentInput.value = String(state.settings.textIndent);
      if (textAlignSelect) textAlignSelect.value = state.settings.textAlign;
      if (readingModeSelect) readingModeSelect.value = state.settings.readingMode;
      if (panelTransparencySelect) panelTransparencySelect.value = normalizePanelTransparency(state.settings.panelTransparency);
      if (miniBarsEnabledSelect) miniBarsEnabledSelect.value = state.settings.miniBarsEnabled ? "on" : "off";
      if (miniBarsScaleInput) miniBarsScaleInput.value = String(state.settings.miniBarsScale);
      if (miniBarsScaleValue) miniBarsScaleValue.textContent = `${state.settings.miniBarsScale.toFixed(2)}x`;
      if (tocSideSelect) tocSideSelect.value = state.settings.tocSide;
      if (comicEdgeTintEnabledSelect) comicEdgeTintEnabledSelect.value = state.settings.comicEdgeTintEnabled ? "on" : "off";
      if (comicEdgeTintStrengthInput) comicEdgeTintStrengthInput.value = String(state.settings.comicEdgeTintStrength);
      if (comicEdgeTintStrengthValue) comicEdgeTintStrengthValue.textContent = `${state.settings.comicEdgeTintStrength}%`;
      if (comicEdgeTintStrengthWrap) comicEdgeTintStrengthWrap.hidden = !state.settings.comicEdgeTintEnabled;
      if (translationEnabledSelect) translationEnabledSelect.value = state.settings.translationEnabled ? "on" : "off";
      if (translationModeSelect) translationModeSelect.value = normalizeTranslationMode(state.settings.translationMode);
      state.readerTranslationTitleCacheAuto = true;
      if (titleCacheAutoSelect) titleCacheAutoSelect.value = "on";
      state.readerTranslationServer = { ...SERVER_TRANSLATION_DEFAULT };
      if (qs("text-indent-value")) qs("text-indent-value").textContent = `${state.settings.textIndent.toFixed(2)}em`;
      state.readerTranslationLocal = { ...LOCAL_TRANSLATION_DEFAULT };
      state.readerTranslationSimLocal = { ...LOCAL_TRANSLATION_DEFAULT };
      state.readerTranslationHanviet = { ...LOCAL_TRANSLATION_DEFAULT };
      applyTheme(state.themes, state.settings);
      applyPanelStyle(state.settings);
      applyReaderVars(state.settings);
      syncThemeCustomForm();
      syncReaderTranslationForm();
      saveSettings(state.settings);
      emitSettingsChanged({
        ...state.settings,
        translationServer: state.readerTranslationServer,
        translationLocal: getLocalTranslationState(state.settings.translationMode),
      });
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
  const vbookManagerSearchInput = qs("vbook-manager-search-input");
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
  const vbookRunnerPathValue = qs("vbook-runner-path-value");
  const vbookRunnerInstalledValue = qs("vbook-runner-installed-value");
  const vbookRunnerStatusText = qs("vbook-runner-status");
  const vbookRunnerInstallBtn = qs("btn-vbook-runner-install");

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

  const normalizeVbookRunnerStatus = (payload) => {
    const raw = (payload && typeof payload === "object") ? payload : {};
    const exists = Boolean(raw.exists);
    const installAction = String(raw.install_action || (exists ? "reinstall" : "install")).trim().toLowerCase() === "reinstall"
      ? "reinstall"
      : "install";
    return {
      exists,
      configured_path: String(raw.configured_path || raw.path || "").trim(),
      path: String(raw.path || raw.configured_path || "").trim(),
      installed_version: String(raw.installed_version || "").trim(),
      version_error: String(raw.version_error || "").trim(),
      install_available: Boolean(raw.install_available),
      install_action: installAction,
      install_label: String(raw.install_label || "").trim() || t(installAction === "reinstall" ? "vbookRunnerReinstall" : "vbookRunnerInstall"),
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

  const renderVbookRunnerStatus = () => {
    const runner = normalizeVbookRunnerStatus(state.vbook.runnerStatus || {});
    state.vbook.runnerStatus = runner;
    if (vbookRunnerPathValue) {
      vbookRunnerPathValue.textContent = runner.configured_path || runner.path || t("vbookRunnerUnknown");
    }
    if (vbookRunnerInstalledValue) {
      vbookRunnerInstalledValue.textContent = runner.exists
        ? (runner.installed_version || t("vbookRunnerUnknown"))
        : t("vbookRunnerMissing");
    }
    if (vbookRunnerInstallBtn) {
      vbookRunnerInstallBtn.textContent = runner.install_action === "reinstall"
        ? t("vbookRunnerReinstall")
        : t("vbookRunnerInstall");
      vbookRunnerInstallBtn.disabled = !runner.install_available;
    }
    if (vbookRunnerStatusText) {
      let text = "";
      if (!runner.exists) {
        text = t("vbookRunnerStatusMissing");
      } else {
        text = t("vbookRunnerStatusReady");
      }
      if (runner.version_error) {
        text = text ? `${text} ${t("vbookRunnerStatusVersionError")}` : t("vbookRunnerStatusVersionError");
      }
      vbookRunnerStatusText.textContent = text.trim();
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
      state.vbook.runnerStatus = normalizeVbookRunnerStatus(payload && payload.runner);
      fillVbookGlobalForm();
      fillVbookPluginForm();
      renderVbookRunnerStatus();
      return state.vbook.globalSettings;
    } catch (error) {
      if (!silent) showToast(error.message || t("toastError"));
      fillVbookGlobalForm();
      fillVbookPluginForm();
      renderVbookRunnerStatus();
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
      state.vbook.runnerStatus = normalizeVbookRunnerStatus(data && data.runner);
      fillVbookGlobalForm();
      fillVbookPluginForm();
      renderVbookRunnerStatus();
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

  async function installVbookRunner() {
    showStatus(t("statusInstallingVbookRunner"));
    try {
      const data = await api("/api/vbook/runner/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      state.vbook.runnerStatus = normalizeVbookRunnerStatus(data && data.runner);
      renderVbookRunnerStatus();
      showToast(t("toastVbookRunnerInstalled"));
      await refreshVbookRuntimeSettings({ silent: true });
      return state.vbook.runnerStatus;
    } catch (error) {
      showToast(error.message || t("toastError"));
      throw error;
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

  const normalizePluginSearch = (value) => String(value || "").trim().toLowerCase();

  const pluginMatchesManagerSearch = (item) => {
    const query = normalizePluginSearch(state.vbook.searchQuery);
    if (!query) return true;
    const haystacks = [
      item && item.name,
      item && item.plugin_id,
      item && item.author,
      item && item.description,
      item && item.source,
      item && item.locale,
      item && item.type,
      item && item.version,
      item && item.plugin_url,
    ];
    return haystacks.some((part) => normalizePluginSearch(part).includes(query));
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
    const allItems = Array.isArray(state.vbook.installed) ? state.vbook.installed : [];
    const items = allItems.filter(pluginMatchesManagerSearch);
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "empty-text";
      empty.textContent = allItems.length ? t("vbookNoMatchedPlugins") : t("vbookNoInstalledPlugins");
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
        if (!await confirmDialog({
          title: t("vbookRemoveTitle"),
          message: t("confirmRemoveVbookPlugin", { name: pluginName }),
          confirmText: t("vbookRemoveAction"),
        })) return;
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
    const items = allItems.filter((item) => !item.installed && pluginMatchesManagerSearch(item));
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "empty-text";
      empty.textContent = allItems.some((item) => !item.installed) ? t("vbookNoMatchedPlugins") : t("vbookNoRepoPlugins");
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
      if ((state.vbook.lockedRepoUrls || []).includes(url)) {
        label = `${label} • ${t("vbookRepoLockedLabel")}`;
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
      state.vbook.lockedRepoUrls = normalizeRepoUrls(items.filter((x) => Boolean(x && x.locked)).map((x) => String((x && x.url) || "").trim()));
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

      for (const row of allRepoPlugins) {
        if (!row || !row.update_available) continue;
        const installedPluginId = String(row.installed_plugin_id || "").trim();
        const pluginUrl = String(row.plugin_url || "").trim();
        if (!installedPluginId || !pluginUrl) continue;
        const current = state.vbook.pluginUpdates[installedPluginId];
        if (!current) {
          state.vbook.pluginUpdates[installedPluginId] = row;
          updateCount += 1;
          continue;
        }
        const curVersion = Number(current.version ?? -1);
        const nextVersion = Number(row.version ?? -1);
        if (Number.isFinite(nextVersion) && Number.isFinite(curVersion) && nextVersion > curVersion) {
          state.vbook.pluginUpdates[installedPluginId] = row;
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
      state.vbook.lockedRepoUrls = Array.isArray(items)
        ? items.filter((x) => Boolean(x && x.locked)).map((x) => String((x && x.url) || "").trim()).filter(Boolean)
        : [];
      renderRepoSelect();
      return state.vbook.repoUrls;
    } catch (error) {
      if (!silent) showToast(error.message || t("toastError"));
      state.vbook.repoUrls = [];
      state.vbook.lockedRepoUrls = [];
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
      if (typeof onPrepareImport === "function") {
        await onPrepareImport();
        return;
      }
      await handleImport(onImported);
    });
  }

  if (qs("btn-import-url")) qs("btn-import-url").addEventListener("click", () => qs("import-url-dialog") && qs("import-url-dialog").showModal());
  if (qs("btn-import-url-cancel")) qs("btn-import-url-cancel").addEventListener("click", () => qs("import-url-dialog") && qs("import-url-dialog").close());
  if (qs("import-url-form")) {
    qs("import-url-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      await handleImportUrl(onImported, onImportUrl);
    });
  }

  if (qs("btn-manage-vbook")) {
    qs("btn-manage-vbook").addEventListener("click", async () => {
      if (!vbookManagerDialog) return;
      if (!vbookManagerDialog.open) vbookManagerDialog.showModal();
      if (vbookManagerSearchInput) {
        vbookManagerSearchInput.value = String(state.vbook.searchQuery || "");
      }
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

  if (vbookManagerSearchInput) {
    vbookManagerSearchInput.placeholder = t("vbookManagerSearchPlaceholder");
    vbookManagerSearchInput.addEventListener("input", () => {
      state.vbook.searchQuery = String(vbookManagerSearchInput.value || "").trim();
      renderInstalledPlugins();
      renderRepoPlugins();
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
      if ((state.vbook.lockedRepoUrls || []).includes(selected)) {
        showToast(t("toastVbookRepoLocked"));
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

  if (vbookRunnerInstallBtn) {
    vbookRunnerInstallBtn.addEventListener("click", async () => {
      await installVbookRunner();
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
  if (notificationUi) {
    try {
      await notificationUi.loadNotifications();
    } catch {
      // ignore temporary notification fetch error
    }
    notificationUi.startNotificationStream();
    window.addEventListener("beforeunload", () => {
      notificationUi.closeNotificationStream();
    });
  }

  window.setTimeout(() => {
    checkReaderUpdateStatus({ autoOpen: true }).catch(() => {});
  }, 80);

  if (qs("btn-clear-cache")) qs("btn-clear-cache").addEventListener("click", clearCache);

  return {
    t,
    api,
    parseQuery,
    confirmDialog,
    promptDialog,
    showToast,
    showStatus,
    hideStatus,
    settings: state.settings,
    getReadingMode: () => state.settings.readingMode,
    getTranslationEnabled: () => state.settings.translationEnabled !== false,
    getTranslationMode: () => normalizeTranslationMode(state.settings.translationMode),
    getTranslationLocalSettings: (mode = state.settings.translationMode) => getLocalTranslationState(mode),
    getVbookSettings: (pluginId = "") => runtimeEffectiveSettings(pluginId),
    getVbookGlobalSettings: () => normalizeVbookGlobalSettings(state.vbook.globalSettings || {}),
    refreshVbookSettings: (pluginId = "") => refreshVbookRuntimeSettings({ silent: true, pluginId }),
    createNotificationTaskId: (prefix = "task") => (notificationUi ? notificationUi.createNotificationTaskId(prefix) : `${prefix}_${Date.now()}`),
    upsertNotificationTask: (payload) => (notificationUi ? notificationUi.upsertNotificationTask(payload) : Promise.resolve(null)),
    markNotificationsRead: (ids, read = true) => (notificationUi ? notificationUi.markNotificationsRead(ids, read) : Promise.resolve(null)),
    deleteNotifications: (ids) => (notificationUi ? notificationUi.deleteNotifications(ids) : Promise.resolve(null)),
    clearNotifications: (scope = "read") => (notificationUi ? notificationUi.clearNotifications(scope) : Promise.resolve(null)),
    subscribeNotifications: (listener) => (notificationUi ? notificationUi.subscribeNotifications(listener) : (() => {})),
    checkReaderUpdateStatus,
    goSearchPage,
  };
}
