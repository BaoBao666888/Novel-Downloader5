import { normalizeReaderText, splitParagraphBlocks } from "./reader_text.js?v=20260408-tts1";

export const TTS_SETTINGS_KEY = "reader.ui.tts.settings.v1";

export const TTS_DEFAULT_SETTINGS = Object.freeze({
  provider: "browser",
  voiceURI: "",
  providerVoiceIds: {},
  sleepPreset: "off",
  sleepCustomMinutes: 90,
  prefetchEnabled: true,
  prefetchCount: 2,
  remoteTimeoutMs: 20000,
  remoteRetries: 2,
  remoteMinGapMs: 220,
  segmentDelayMs: 250,
  replaceEnabled: false,
  replaceRulesText: "",
  rate: 1,
  pitch: 1,
  volume: 1,
  maxChars: 260,
  autoNext: true,
  includeTitle: true,
  autoScroll: true,
  autoStartOnNextChapter: true,
});

function clampInt(value, min, max, fallback) {
  const num = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(num)) return fallback;
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

function clampFloat(value, min, max, fallback) {
  const num = Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(num)) return fallback;
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

function toBool(value, fallback) {
  if (typeof value === "boolean") return value;
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return fallback;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return fallback;
}

export function normalizeTtsSettings(raw) {
  const src = (raw && typeof raw === "object") ? raw : {};
  const providerVoiceIdsRaw = (src.providerVoiceIds && typeof src.providerVoiceIds === "object") ? src.providerVoiceIds : {};
  const providerVoiceIds = {};
  for (const [key, value] of Object.entries(providerVoiceIdsRaw)) {
    const provider = String(key || "").trim();
    const voiceId = String(value || "").trim();
    if (!provider || !voiceId) continue;
    providerVoiceIds[provider] = voiceId;
  }
  return {
    provider: String(src.provider || TTS_DEFAULT_SETTINGS.provider || "browser").trim() || "browser",
    voiceURI: String(src.voiceURI || TTS_DEFAULT_SETTINGS.voiceURI || "").trim(),
    providerVoiceIds,
    sleepPreset: (() => {
      const preset = String(src.sleepPreset || TTS_DEFAULT_SETTINGS.sleepPreset || "off").trim().toLowerCase();
      if (!preset) return "off";
      if (preset === "custom") return "custom";
      const mins = clampInt(preset, 0, 24 * 60, 0);
      return mins > 0 ? String(mins) : "off";
    })(),
    sleepCustomMinutes: clampInt(src.sleepCustomMinutes, 1, 24 * 60, TTS_DEFAULT_SETTINGS.sleepCustomMinutes),
    prefetchEnabled: toBool(src.prefetchEnabled, TTS_DEFAULT_SETTINGS.prefetchEnabled),
    prefetchCount: clampInt(src.prefetchCount, 0, 6, TTS_DEFAULT_SETTINGS.prefetchCount),
    remoteTimeoutMs: clampInt(src.remoteTimeoutMs, 3000, 120000, TTS_DEFAULT_SETTINGS.remoteTimeoutMs),
    remoteRetries: clampInt(src.remoteRetries, 0, 5, TTS_DEFAULT_SETTINGS.remoteRetries),
    remoteMinGapMs: clampInt(src.remoteMinGapMs, 0, 4000, TTS_DEFAULT_SETTINGS.remoteMinGapMs),
    segmentDelayMs: clampInt(src.segmentDelayMs, 0, 5000, TTS_DEFAULT_SETTINGS.segmentDelayMs),
    replaceEnabled: toBool(src.replaceEnabled, TTS_DEFAULT_SETTINGS.replaceEnabled),
    replaceRulesText: String(src.replaceRulesText || TTS_DEFAULT_SETTINGS.replaceRulesText || ""),
    rate: clampFloat(src.rate, 0.5, 3, TTS_DEFAULT_SETTINGS.rate),
    pitch: clampFloat(src.pitch, 0, 2, TTS_DEFAULT_SETTINGS.pitch),
    volume: clampFloat(src.volume, 0, 1, TTS_DEFAULT_SETTINGS.volume),
    maxChars: clampInt(src.maxChars, 80, 600, TTS_DEFAULT_SETTINGS.maxChars),
    autoNext: toBool(src.autoNext, TTS_DEFAULT_SETTINGS.autoNext),
    includeTitle: toBool(src.includeTitle, TTS_DEFAULT_SETTINGS.includeTitle),
    autoScroll: toBool(src.autoScroll, TTS_DEFAULT_SETTINGS.autoScroll),
    autoStartOnNextChapter: toBool(src.autoStartOnNextChapter, TTS_DEFAULT_SETTINGS.autoStartOnNextChapter),
  };
}

export function loadTtsSettings() {
  try {
    const raw = localStorage.getItem(TTS_SETTINGS_KEY);
    if (!raw) return normalizeTtsSettings({});
    return normalizeTtsSettings(JSON.parse(raw));
  } catch {
    return normalizeTtsSettings({});
  }
}

export function saveTtsSettings(settings) {
  const normalized = normalizeTtsSettings(settings);
  localStorage.setItem(TTS_SETTINGS_KEY, JSON.stringify(normalized));
  return normalized;
}

export function parseTtsReplaceRules(text) {
  const lines = String(text || "").split(/\r?\n/g);
  const rules = [];
  for (const rawLine of lines) {
    const line = String(rawLine || "").trim();
    if (!line || line.startsWith("#")) continue;
    let from = "";
    let to = "";
    if (line.includes("=>")) {
      [from, to] = line.split("=>", 2);
    } else if (line.includes("=")) {
      [from, to] = line.split("=", 2);
    } else {
      continue;
    }
    from = String(from || "").trim();
    to = String(to || "").trim();
    if (!from) continue;
    rules.push({ from, to });
  }
  return rules;
}

export function applyTtsReplaceRules(text, rulesText = "", enabled = false) {
  const source = String(text || "");
  if (!enabled) return source;
  const rules = Array.isArray(rulesText) ? rulesText : parseTtsReplaceRules(rulesText);
  if (!rules.length) return source;
  let output = source;
  for (const rule of rules) {
    const from = String((rule && rule.from) || "").trim();
    if (!from) continue;
    output = output.split(from).join(String((rule && rule.to) || ""));
  }
  return output;
}

function splitLongTtsChunk(text, budget) {
  const source = String(text || "").trim();
  if (!source) return [];
  if (source.length <= budget) return [source];
  const out = [];
  let rest = source;
  while (rest.length > budget) {
    const around = Math.min(rest.length, budget + 80);
    const probe = rest.slice(0, around);
    let cut = -1;
    for (const token of ["。", "！", "？", ".", "!", "?", ";", "；", ":", "：", ",", "，", "、", " "]) {
      const idx = probe.lastIndexOf(token, budget + 20);
      if (idx > Math.floor(budget * 0.58)) {
        cut = Math.max(cut, idx + 1);
      }
    }
    if (cut < 0) cut = budget;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out.filter(Boolean);
}

export function buildTtsSegments({
  chapterTitle = "",
  content = "",
  includeTitle = true,
  maxChars = TTS_DEFAULT_SETTINGS.maxChars,
  startParagraphIndex = 0,
  startParagraphOffset = 0,
  replaceEnabled = false,
  replaceRulesText = "",
} = {}) {
  const normalizedContent = normalizeReaderText(content || "");
  const paragraphs = splitParagraphBlocks(normalizedContent);
  const rules = parseTtsReplaceRules(replaceRulesText);
  const safeMaxChars = clampInt(maxChars, 80, 600, TTS_DEFAULT_SETTINGS.maxChars);
  const safeStartIndex = Math.max(0, Math.min(paragraphs.length ? paragraphs.length - 1 : 0, Number(startParagraphIndex) || 0));
  const safeStartOffset = Math.max(0, Number(startParagraphOffset) || 0);
  const segments = [];

  const pushChunks = (text, paragraphIndex, isTitle = false) => {
    const normalized = applyTtsReplaceRules(text, rules, replaceEnabled).trim();
    if (!normalized) return;
    const chunks = splitLongTtsChunk(normalized, safeMaxChars);
    for (const chunk of chunks) {
      segments.push({
        text: chunk,
        paragraphIndex,
        isTitle,
      });
    }
  };

  const titleText = normalizeReaderText(chapterTitle || "").replace(/\n+/g, " ").trim();
  if (includeTitle && titleText && safeStartIndex === 0 && safeStartOffset <= 0) {
    pushChunks(titleText, -1, true);
  }

  for (let index = safeStartIndex; index < paragraphs.length; index += 1) {
    let paragraphText = String(paragraphs[index] || "");
    if (index === safeStartIndex && safeStartOffset > 0) {
      paragraphText = paragraphText.slice(Math.min(safeStartOffset, paragraphText.length)).trimStart();
    }
    if (!paragraphText.trim()) continue;
    pushChunks(paragraphText, index, false);
  }

  return { segments, paragraphs };
}

export function createTtsFallbackArtworkDataUrl(title = "") {
  const safeTitle = String(title || "").trim() || "Nghe truyện";
  const escapedTitle = safeTitle
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f8d9ec"/>
          <stop offset="52%" stop-color="#d8f1ff"/>
          <stop offset="100%" stop-color="#cde3ff"/>
        </linearGradient>
        <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.92"/>
          <stop offset="100%" stop-color="#f6fbff" stop-opacity="0.82"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="54" fill="url(#bg)"/>
      <circle cx="104" cy="86" r="34" fill="#ffffff" fill-opacity="0.42"/>
      <circle cx="420" cy="118" r="24" fill="#ffffff" fill-opacity="0.34"/>
      <circle cx="402" cy="408" r="44" fill="#ffffff" fill-opacity="0.28"/>
      <rect x="58" y="72" width="396" height="368" rx="36" fill="url(#panel)" stroke="#ffffff" stroke-opacity="0.54"/>
      <path d="M180 146c-20 0-36 16-36 36v98c0 20 16 36 36 36h26l44 42c8 7 20 2 20-9V173c0-11-12-16-20-9l-44 42h-26z" fill="#5e78d9"/>
      <path d="M320 202c16 12 24 31 24 50s-8 38-24 50" fill="none" stroke="#5e78d9" stroke-width="18" stroke-linecap="round"/>
      <path d="M352 172c25 21 38 50 38 80s-13 59-38 80" fill="none" stroke="#5e78d9" stroke-width="16" stroke-linecap="round" stroke-opacity="0.9"/>
      <text x="256" y="404" text-anchor="middle" font-size="32" font-weight="700" font-family="'Be Vietnam Pro','Noto Sans',sans-serif" fill="#405287">Nghe truyện</text>
      <text x="256" y="444" text-anchor="middle" font-size="20" font-family="'Be Vietnam Pro','Noto Sans',sans-serif" fill="#54627f">${escapedTitle.slice(0, 32)}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
