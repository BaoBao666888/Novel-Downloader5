// ==UserScript==
// @name         Wikidich Autofill (Library)
// @namespace    http://tampermonkey.net/
// @version      0.3.9.4
// @description  Lấy thông tin từ web Trung (Fanqie/JJWXC/PO18/Ihuaben/Qidian/Qimao/Gongzicp/Hai Tang Longma), dịch và tự tick/điền form nhúng truyện trên wikicv.net.
// @author       QuocBao
// ==/UserScript==

(function (global) {
    'use strict';
    let instance = null;

    const APP_PREFIX = 'WDA_';
    const AUTOFILL_WIKIDICH_VERSION = '0.3.9.4'
    const SERVER_URL = 'https://dichngay.com/translate/text';
    const MAX_CHARS = 4500;
    const MAX_COVER_FILE_SIZE = 500 * 1024;
    const REQUEST_DELAY_MS = 350;
    const DEFAULT_SCORE_THRESHOLD = 0.90;
    const SCORE_FALLBACK = 0.65;
    const MAX_TAGS_SELECT = 25;
    const JJWXC_APP_VERSION_CODE = 486;
    const JJWXC_APP_USER_AGENT = `Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro Build/TP1A.251005.002.B2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.109 Mobile Safari/537.36/JINJIANG-Android/${JJWXC_APP_VERSION_CODE}(Pixel9Pro;Scale/3.5;isHarmonyOS/false)`;
    const JJWXC_IMAGE_USER_AGENT = 'Dalvik/2.1.0 (Linux; U; Android 13; Pixel 7 Build/TQ3A.230901.001)';
    const JJWXC_IMAGE_REFERER = `http://android.jjwxc.net/?v=${JJWXC_APP_VERSION_CODE}`;
    const JJWXC_API_MODE_NEW = 'new';
    const JJWXC_API_MODE_OLD = 'old';
    const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';
    const GEMINI_LOW_THINKING_LEVEL = 'low';
    const GEMINI_LOW_THINKING_BUDGET = 1024;
    const DEEP_DUPLICATE_COVER_MATCH_THRESHOLD = 0.92;
    const COVER_HASH_SIZE = 8;
    const ROOT_NEG_WORDS = ['vo', 'khong', 'phi', 'chong', 'phan', 'non', 'no'];
    const ROOT_MODIFIERS = new Set([
        'song', 'nhieu', 'main', 'ca', 'nha', 'nu', 'nam', 'trang', 'phan', 'sat',
        'la', 'toan', 'tap', 'the'
    ]);
    const geminiModelMetaCache = new Map();
    const coverHashCache = new Map();

    const DEFAULT_SETTINGS = {
        scoreThreshold: DEFAULT_SCORE_THRESHOLD,
        aiMode: 'auto', // 'auto' or 'ai'
        geminiApiKey: '',
        geminiModel: DEFAULT_GEMINI_MODEL,
        autoExtractNames: true, // AI auto-extract character names
        autoBreakDesc: false, // Tự xuống dòng văn án ở dấu chấm
        deepDuplicateCheck: true,
        jjwxcApiMode: '',
        domainSettings: {},
        coverSizeByDomain: {},
    };

    const SETTINGS_KEY = 'Wikidich_Autofill_Config';
    const SHARED_THEME_KEY = 'WDX_theme';
    const DEFAULT_THEME_MODE = 'light';

    // ================================================
    // SETTINGS + STATE
    // ================================================
    const state = {
        groups: null,
        rawData: null,
        sourceData: null,
        sourceType: null,
        sourceLabel: null,
        translated: null,
        suggestions: null,
        settings: null,
        hasFetchedData: false,
        duplicateCheck: {
            pending: false,
            blocked: false,
            runId: 0,
            lastKey: '',
            checked: false,
            failed: false,
            deepPending: false,
            deepChecked: false,
            deepPossibleDuplicate: false,
            deepCandidate: null,
            hasMoreAuthorPages: false,
            authorPageUrl: '',
            safetyScore: null,
            safetyTone: 'idle',
            safetyReason: '',
        },
        descEditorMode: 'vi',
        descDraft: {
            vi: '',
            zh: '',
        },
        recomputeBaseline: null,
        aiLastSuggestions: null,
        coverMeta: {
            original: null,
            loading: false,
            error: '',
        },
    };
    // --- UTILS ---
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    function getSharedThemeMode() {
        try {
            return localStorage.getItem(SHARED_THEME_KEY) || DEFAULT_THEME_MODE;
        } catch {
            return DEFAULT_THEME_MODE;
        }
    }
    function resolveThemeMode(mode) {
        if (mode === 'dark' || mode === 'light') return mode;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'light';
    }

    function isEditPage() {
        return /\/chinh-sua$/.test(location.pathname);
    }

    function isEmbedPage() {
        return /\/nhung-file$/.test(location.pathname);
    }

    function logUi(message, type) {
        if (state && typeof state.log === 'function') {
            state.log(message, type);
            return;
        }
        if (type === 'error') console.error(message);
        else if (type === 'warn') console.warn(message);
        else console.log(message);
    }

    function openInBrowserTab(url) {
        if (typeof GM_openInTab === 'function') {
            GM_openInTab(url, { active: true, insert: true, setParent: true });
            return;
        }
        window.open(url, '_blank', 'noopener');
    }

    function clampNumber(val, min, max, def) {
        const n = parseFloat(val);
        if (isNaN(n)) return def;
        return Math.max(min, Math.min(n, max));
    }

    function normalizeJjwxcApiMode(mode) {
        const value = (mode || '').toString().trim().toLowerCase();
        if (value === JJWXC_API_MODE_OLD) return JJWXC_API_MODE_OLD;
        if (value === JJWXC_API_MODE_NEW) return JJWXC_API_MODE_NEW;
        return '';
    }

    function normalizeGeminiModelName(model) {
        return (model || '').toString().replace(/^models\//i, '').trim();
    }

    function rememberGeminiModels(models) {
        (Array.isArray(models) ? models : []).forEach((item) => {
            const name = normalizeGeminiModelName(item?.name);
            if (!name) return;
            geminiModelMetaCache.set(name, {
                name,
                thinking: item?.thinking === true,
                displayName: (item?.displayName || '').toString().trim(),
            });
        });
    }

    function supportsGeminiThinking(model) {
        const name = normalizeGeminiModelName(model);
        if (!name) return false;
        const meta = geminiModelMetaCache.get(name);
        if (meta && typeof meta.thinking === 'boolean') return meta.thinking;
        return /^gemini-3\b/i.test(name) || /^gemini-2\.5\b/i.test(name);
    }

    function buildGeminiGenerationConfig(model) {
        const config = {
            responseMimeType: 'application/json'
        };
        const name = normalizeGeminiModelName(model);
        if (!supportsGeminiThinking(name)) return config;
        if (/^gemini-3\b/i.test(name)) {
            config.thinkingConfig = { thinkingLevel: GEMINI_LOW_THINKING_LEVEL };
            return config;
        }
        config.thinkingConfig = { thinkingBudget: GEMINI_LOW_THINKING_BUDGET };
        return config;
    }

    function normalizeSettings(raw) {
        // Deep copy default
        const base = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

        if (!raw || typeof raw !== 'object') return base;

        if ('scoreThreshold' in raw) base.scoreThreshold = raw.scoreThreshold;
        if (raw.aiMode) base.aiMode = raw.aiMode;
        if (raw.geminiApiKey) base.geminiApiKey = raw.geminiApiKey;
        if (raw.geminiModel) base.geminiModel = normalizeGeminiModelName(raw.geminiModel) || DEFAULT_GEMINI_MODEL;
        if (typeof raw.autoExtractNames === 'boolean') base.autoExtractNames = raw.autoExtractNames;
        if (typeof raw.autoBreakDesc === 'boolean') base.autoBreakDesc = raw.autoBreakDesc;
        if (typeof raw.deepDuplicateCheck === 'boolean') base.deepDuplicateCheck = raw.deepDuplicateCheck;
        if ('jjwxcApiMode' in raw) base.jjwxcApiMode = normalizeJjwxcApiMode(raw.jjwxcApiMode);
        // old
        const oldMap = raw.useDescByDomain;
        if (oldMap && typeof oldMap === 'object') {
            Object.keys(base.domainSettings).forEach(key => {
                if (typeof oldMap[key] === 'boolean') {
                    base.domainSettings[key].useDesc = oldMap[key];
                }
            });
        }
        // new
        if (raw.domainSettings && typeof raw.domainSettings === 'object') {
            Object.keys(base.domainSettings).forEach(key => {
                if (raw.domainSettings[key]) {
                    const saved = raw.domainSettings[key];
                    if (typeof saved.useDesc === 'boolean') base.domainSettings[key].useDesc = saved.useDesc;
                    if (typeof saved.assignTags === 'boolean') base.domainSettings[key].assignTags = saved.assignTags;
                    if (saved.target) base.domainSettings[key].target = saved.target;
                }
            });
        }
        if (raw.coverSizeByDomain && typeof raw.coverSizeByDomain === 'object') {
            const normalizedMap = {};
            Object.keys(raw.coverSizeByDomain).forEach((domainKey) => {
                const conf = raw.coverSizeByDomain[domainKey];
                if (!conf || typeof conf !== 'object') return;
                const mode = conf.mode === 'custom' || conf.mode === 'preset560' ? conf.mode : 'original';
                const targetWidth = Math.max(1, parseInt(conf.targetWidth, 10) || 0);
                const targetHeight = Math.max(1, parseInt(conf.targetHeight, 10) || 0);
                const customSizes = Array.isArray(conf.customSizes)
                    ? conf.customSizes
                        .map((item) => {
                            const w = parseInt(item?.w, 10);
                            const h = parseInt(item?.h, 10);
                            if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) return null;
                            return { w, h };
                        })
                        .filter(Boolean)
                    : [];
                normalizedMap[domainKey] = {
                    mode,
                    targetWidth,
                    targetHeight,
                    customSizes,
                };
            });
            base.coverSizeByDomain = normalizedMap;
        }

        return base;
    }

    function loadSettings() {
        const raw = GM_getValue(SETTINGS_KEY, {});
        const s = normalizeSettings(raw);
        s.scoreThreshold = clampNumber(s.scoreThreshold, 0.5, 0.99, DEFAULT_SCORE_THRESHOLD);
        return s;
    }

    function saveSettings(newSettings) {
        const s = normalizeSettings(newSettings);
        GM_setValue(SETTINGS_KEY, s);
        state.settings = s;
    }

    function getScoreThreshold() {
        if (state.settings && Number.isFinite(state.settings.scoreThreshold)) {
            return state.settings.scoreThreshold;
        }
        return DEFAULT_SCORE_THRESHOLD;
    }

    function getDomainSetting(sourceType) {
        const def = DEFAULT_SETTINGS.domainSettings[sourceType];
        if (!state.settings || !state.settings.domainSettings) return def;
        return state.settings.domainSettings[sourceType] || def;
    }

    function shouldUseDescForSource(sourceType) {
        const conf = getDomainSetting(sourceType);
        return conf ? conf.useDesc : true;
    }

    function shouldAssignTagsForSource(sourceType) {
        const conf = getDomainSetting(sourceType);
        return conf ? conf.assignTags !== false : true;
    }

    function getCurrentDomainKey() {
        return (location.hostname || 'default').toLowerCase();
    }

    function getCoverScopeKeyFromSourceType(sourceType) {
        const key = safeText(sourceType || '');
        if (!key) return '';
        return `source:${key.toLowerCase()}`;
    }

    function getCurrentCoverScopeKey(sourceType) {
        const fromInput = getCoverScopeKeyFromSourceType(sourceType || state.sourceType);
        if (fromInput) return fromInput;
        return getCurrentDomainKey();
    }

    function getDefaultCoverSizeConfig() {
        return {
            mode: 'original',
            targetWidth: 560,
            targetHeight: 788,
            customSizes: [],
        };
    }

    function getCoverSizeConfig(settings, domainKey) {
        const key = domainKey || getCurrentCoverScopeKey();
        const map = settings?.coverSizeByDomain || {};
        const conf = map[key] || map[getCurrentDomainKey()];
        if (!conf || typeof conf !== 'object') return getDefaultCoverSizeConfig();
        return {
            mode: conf.mode === 'custom' || conf.mode === 'preset560' ? conf.mode : 'original',
            targetWidth: Math.max(1, parseInt(conf.targetWidth, 10) || 560),
            targetHeight: Math.max(1, parseInt(conf.targetHeight, 10) || 788),
            customSizes: Array.isArray(conf.customSizes) ? conf.customSizes : [],
        };
    }

    function getCoverTargetSize(settings, domainKey) {
        const conf = getCoverSizeConfig(settings, domainKey);
        if (conf.mode === 'preset560') {
            return { width: 560, height: 788, label: '560x788' };
        }
        if (conf.mode === 'custom') {
            return {
                width: Math.max(1, parseInt(conf.targetWidth, 10) || 0),
                height: Math.max(1, parseInt(conf.targetHeight, 10) || 0),
                label: `${Math.max(1, parseInt(conf.targetWidth, 10) || 0)}x${Math.max(1, parseInt(conf.targetHeight, 10) || 0)}`,
            };
        }
        return null;
    }

    function safeText(v) {
        return (v || '').toString().trim();
    }

    function normalizeText(text = '') {
        return text
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function splitTokens(text) {
        return normalizeText(text).split(' ').filter(Boolean);
    }

    // ================================================
    // TEXT + NAMESET HELPERS
    // ================================================
    function buildNameSetReplacer(nameSet) {
        const keys = Object.keys(nameSet || {}).sort((a, b) => b.length - a.length);
        return function (text, placeholderMap) {
            let out = text;
            for (const k of keys) {
                if (!k) continue;
                if (out.includes(k)) {
                    const id = `__FWDA_NAME_${Object.keys(placeholderMap).length}__`;
                    placeholderMap[id] = { orig: k, viet: nameSet[k] };
                    out = out.split(k).join(id);
                }
            }
            return out;
        };
    }

    function restoreNames(text, placeholderMap) {
        if (!text || !placeholderMap) return text;
        let result = text;
        for (const placeholder in placeholderMap) {
            const regex = new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            result = result.replace(regex, placeholderMap[placeholder].viet + ' ');
        }
        return result;
    }

    function capitalizeFirstLetter(s) {
        if (typeof s !== 'string' || !s) return s;
        return s.replace(/(^|[\.?!])(\s*["'“‘(\[]*)(\p{L})/gu, (match, p1, p2, p3) => {
            return p1 + p2 + p3.toUpperCase();
        });
    }

    function fixSpacing(text) {
        let result = (text || '').toString();
        result = result.replace(/\s+([,.;!?\)]|”|’|:)/g, '$1');
        result = result.replace(/([\(\[“‘])\s+/g, '$1');
        result = result.replace(/\s+/g, ' ').trim();
        return result;
    }

    function cleanupText(text, preserveLineBreaks) {
        if (!preserveLineBreaks) return capitalizeFirstLetter(fixSpacing(text));
        const normalized = (text || '').toString().replace(/\r\n/g, '\n');
        const lines = normalized.split('\n');
        const cleaned = lines.map(line => {
            if (!line.trim()) return '';
            return capitalizeFirstLetter(fixSpacing(line));
        });
        return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    function normalizeCompareText(text) {
        return safeText(text).replace(/\s+/g, ' ').trim();
    }

    function normalizeCompareList(list) {
        if (!Array.isArray(list)) return [];
        return list.map(item => normalizeText(item)).filter(Boolean);
    }

    function arraysEqualNormalized(a, b) {
        const na = normalizeCompareList(a);
        const nb = normalizeCompareList(b);
        if (na.length !== nb.length) return false;
        const setA = new Set(na);
        for (const v of nb) {
            if (!setA.has(v)) return false;
        }
        return true;
    }

    const EXCLUDE_SCOPE_ALL = '__all__';
    const EXCLUDE_CONFIG_KEY_EDIT = `${APP_PREFIX}exclude_config_edit_v2`;
    const EXCLUDE_CONFIG_KEY_EMBED = `${APP_PREFIX}exclude_config_embed_v2`;

    // /chinh-sua: safe defaults (user can still uncheck later)
    const EDIT_EXCLUDE_DEFAULT_ALL = {
        titleCn: true,
        authorCn: true,
        titleVi: true,
        moreLink: true,
        coverUrl: true,
    };

    // /nhung-file: let user decide (no defaults)
    const EMBED_EXCLUDE_DEFAULT_ALL = {};
    const EDIT_FIELDS = [
        { key: 'titleCn', label: 'Tên gốc (CN)', type: 'text' },
        { key: 'authorCn', label: 'Tên tác giả (CN)', type: 'text' },
        { key: 'titleVi', label: 'Tên dịch (VI)', type: 'text' },
        { key: 'descVi', label: 'Mô tả dịch (VI)', type: 'text' },
        { key: 'coverUrl', label: 'Cover URL', type: 'text' },
        { key: 'status', label: 'Tình trạng', type: 'radio' },
        { key: 'official', label: 'Tính chất', type: 'radio' },
        { key: 'gender', label: 'Giới tính', type: 'radio' },
        { key: 'age', label: 'Thời đại', type: 'checkbox' },
        { key: 'ending', label: 'Kết thúc', type: 'checkbox' },
        { key: 'genre', label: 'Loại hình', type: 'checkbox' },
        { key: 'tag', label: 'Tag', type: 'checkbox' },
        { key: 'moreLink', label: 'Liên kết bổ sung', type: 'text' },
    ];

    function createDefaultExcludeConfig(isEdit) {
        return {
            all: { ...(isEdit ? EDIT_EXCLUDE_DEFAULT_ALL : EMBED_EXCLUDE_DEFAULT_ALL) },
            sources: {},
        };
    }

    function normalizeExcludeConfig(raw, isEdit) {
        // Backward compatible:
        // - old shape: { titleCn: true, ... } (treated as "all")
        // - new shape: { all: {...}, sources: {...} }
        if (!raw || typeof raw !== 'object') return createDefaultExcludeConfig(isEdit);
        let cfg = null;
        if (raw.all && typeof raw.all === 'object') {
            cfg = {
                all: { ...(raw.all || {}) },
                sources: raw.sources && typeof raw.sources === 'object' ? { ...raw.sources } : {},
            };
        } else {
            cfg = {
                all: { ...raw },
                sources: {},
            };
        }
        if (isEdit && cfg && cfg.all) {
            // Ensure new defaults are applied for legacy configs, without overriding user's explicit false.
            Object.keys(EDIT_EXCLUDE_DEFAULT_ALL).forEach((k) => {
                if (typeof cfg.all[k] === 'undefined') cfg.all[k] = !!EDIT_EXCLUDE_DEFAULT_ALL[k];
            });
        }
        return cfg;
    }

    function loadExcludeConfig(isEdit) {
        const key = isEdit ? EXCLUDE_CONFIG_KEY_EDIT : EXCLUDE_CONFIG_KEY_EMBED;
        const raw = GM_getValue(key, null);
        if (raw) {
            const cfg = normalizeExcludeConfig(raw, isEdit);
            // Persist normalized config so future loads are stable.
            try { GM_setValue(key, cfg); } catch { }
            return cfg;
        }
        return createDefaultExcludeConfig(isEdit);
    }

    function saveExcludeConfig(isEdit, config) {
        const key = isEdit ? EXCLUDE_CONFIG_KEY_EDIT : EXCLUDE_CONFIG_KEY_EMBED;
        GM_setValue(key, config || {});
    }

    function getEffectiveExcludes(config, sourceId) {
        const all = config?.all && typeof config.all === 'object' ? config.all : {};
        const sources = config?.sources && typeof config.sources === 'object' ? config.sources : {};
        const override = sourceId && sources[sourceId] && typeof sources[sourceId] === 'object' ? sources[sourceId] : {};
        return { ...all, ...override };
    }

    function parseNameSet(raw) {
        const lines = (raw || '').split(/\r?\n/);
        const map = {};
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            let sep = '=>';
            if (trimmed.includes(sep)) {
                const [orig, viet] = trimmed.split(sep).map(s => s.trim());
                if (orig && viet) map[orig] = viet;
                continue;
            }
            if (trimmed.includes('=')) {
                const [orig, viet] = trimmed.split('=').map(s => s.trim());
                if (orig && viet) map[orig] = viet;
                continue;
            }
            if (trimmed.includes('|')) {
                const [orig, viet] = trimmed.split('|').map(s => s.trim());
                if (orig && viet) map[orig] = viet;
            }
        }
        return map;
    }

    function isAiHiddenAgeLabel(label) {
        const norm = T.normalizeText(label);
        return norm === 'gia tuong lich su' || norm === 'lich su gia tuong';
    }

    function getAiOptionLabels(key, group) {
        const labels = group ? group.map(x => x.label).filter(Boolean) : [];
        if (key !== 'age') return labels;
        return labels.filter(label => !isAiHiddenAgeLabel(label));
    }

    function resolveNegationConflicts(labels) {
        const normalizedMap = new Map();
        labels.forEach(label => normalizedMap.set(T.normalizeText(label), label));
        const toRemove = new Set();

        normalizedMap.forEach((origLabel, normLabel) => {
            const tokens = T.splitTokens(normLabel);
            if (tokens.length < 2) return;
            if (!ROOT_NEG_WORDS.includes(tokens[0])) return;
            const base = tokens.slice(1).join(' ');
            if (normalizedMap.has(base)) {
                toRemove.add(normalizedMap.get(base));
            }
        });

        return labels.filter(label => !toRemove.has(label));
    }

    function rootKey(label) {
        let tokens = T.splitTokens(label);
        while (tokens.length && ROOT_NEG_WORDS.includes(tokens[0])) {
            tokens.shift();
        }
        tokens = tokens.filter(tok => !ROOT_MODIFIERS.has(tok));
        if (!tokens.length) return T.normalizeText(label);
        return tokens.join(' ');
    }

    function collapseByRoot(items) {
        const bestByRoot = new Map();
        items.forEach(item => {
            const key = rootKey(item.label);
            const existing = bestByRoot.get(key);
            if (!existing) {
                bestByRoot.set(key, item);
                return;
            }
            if (item.score > existing.score) {
                bestByRoot.set(key, item);
                return;
            }
            if (item.score === existing.score) {
                const curLen = T.normalizeText(item.label).replace(/\s+/g, '').length;
                const prevLen = T.normalizeText(existing.label).replace(/\s+/g, '').length;
                if (curLen > prevLen) bestByRoot.set(key, item);
            }
        });
        return Array.from(bestByRoot.values());
    }

    // ================================================
    // TEXT + DOM HELPERS
    // ================================================
    function parseTagList(text) {
        return T.safeText(text)
            .split(/[，,、/|]/)
            .map(s => s.trim())
            .filter(Boolean);
    }

    function htmlToText(html) {
        let out = (html || '').toString();
        out = out.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        out = out.replace(/<br\s*\/?>/gi, '\n');
        out = out.replace(/<[^>]+>/g, '');
        out = out.replace(/\n{3,}/g, '\n\n');
        return out.trim();
    }

    function toAbsoluteUrl(url, baseUrl) {
        const raw = T.safeText(url);
        if (!raw) return '';
        if (/^https?:\/\//i.test(raw)) return raw;
        if (raw.startsWith('//')) return `https:${raw}`;
        try {
            return new URL(raw, baseUrl).toString();
        } catch {
            return raw;
        }
    }

    function queryText(doc, selectors) {
        for (const sel of selectors) {
            const el = doc.querySelector(sel);
            const text = T.safeText(el?.textContent || '');
            if (text) return text;
        }
        return '';
    }

    function queryHtml(doc, selectors) {
        for (const sel of selectors) {
            const el = doc.querySelector(sel);
            const html = T.safeText(el?.innerHTML || '');
            if (html) return html;
        }
        return '';
    }

    function queryAttr(doc, selectors, attr) {
        for (const sel of selectors) {
            const el = doc.querySelector(sel);
            if (!el) continue;
            const val = el.getAttribute(attr)
                || el.getAttribute('data-src')
                || el.getAttribute('data-original')
                || el.getAttribute('data-lazy');
            const text = T.safeText(val || '');
            if (text) return text;
        }
        return '';
    }

    function collectTexts(doc, selectors) {
        const results = [];
        selectors.forEach((sel) => {
            doc.querySelectorAll(sel).forEach((el) => {
                const text = T.safeText(el.textContent || '');
                if (text) results.push(text);
            });
        });
        return results;
    }

    const HELPERS = {
        text: {
            safeText,
            normalizeText,
            splitTokens,
            parseTagList,
            htmlToText,
        },
        dom: {
            toAbsoluteUrl,
            queryText,
            queryHtml,
            queryAttr,
            collectTexts,
        },
    };

    const T = HELPERS.text;
    const D = HELPERS.dom;

    function extractInfoPairs(doc) {
        const pairs = [];
        const items = doc.querySelectorAll(
            '.book_info li, .book_info .info, .book_info .item, .book_data li, .book_detail li, .book_detail .info, .book_detail .item'
        );
        items.forEach((el) => {
            const text = T.safeText(el.textContent || '');
            if (!text) return;
            const parts = text.split(/[:：]/);
            if (parts.length < 2) return;
            const key = T.safeText(parts.shift());
            const value = T.safeText(parts.join(':'));
            if (key && value) pairs.push({ key, value });
        });
        return pairs;
    }

    const STATUS_STATES = Object.freeze({
        ONGOING: 'ongoing',
        COMPLETED: 'completed',
    });

    function mapStatusCode(value, map) {
        const key = T.safeText(value);
        if (!key) return '';
        return map[key] || '';
    }

    function statusStateFromBoolish(value, trueMeansCompleted) {
        const key = T.safeText(value).toLowerCase();
        if (!key) return '';
        if (['1', 'true', 'yes', 'y'].includes(key)) {
            return trueMeansCompleted ? STATUS_STATES.COMPLETED : STATUS_STATES.ONGOING;
        }
        if (['0', 'false', 'no', 'n'].includes(key)) {
            return trueMeansCompleted ? STATUS_STATES.ONGOING : STATUS_STATES.COMPLETED;
        }
        return '';
    }

    function statusStateFromText(text) {
        const raw = T.safeText(text);
        if (!raw) return '';
        const norm = T.normalizeText(raw);

        if (/未完結|未完结/i.test(raw)) return STATUS_STATES.ONGOING;
        if (/已完結|已完结/i.test(raw)) return STATUS_STATES.COMPLETED;

        if (/(连载|連載|更新中|连更|ongoing|serializ|updating)/i.test(raw)) {
            return STATUS_STATES.ONGOING;
        }
        if (/(完結|完结|完本|全本|finished|completed|the end)/i.test(raw)) {
            return STATUS_STATES.COMPLETED;
        }

        if (/(con tiep|dang cap nhat|dang ra|chua hoan|chua ket)/.test(norm)) {
            return STATUS_STATES.ONGOING;
        }
        if (/(hoan thanh|da hoan thanh|da xong|ket thuc)/.test(norm)) {
            return STATUS_STATES.COMPLETED;
        }
        return '';
    }

    function statusLabelFromState(state) {
        return state === STATUS_STATES.COMPLETED ? 'Hoàn thành' : 'Còn tiếp';
    }

    function resolveStatusInfo({
        sourceType = '',
        explicitStates = [],
        hintTexts = [],
        fallbackTexts = [],
    } = {}) {
        const pick = (state, method, evidence) => ({
            sourceType,
            state: state || STATUS_STATES.ONGOING,
            isCompleted: state === STATUS_STATES.COMPLETED,
            label: statusLabelFromState(state),
            method,
            evidence: T.safeText(evidence || ''),
        });

        const normalizedExplicit = explicitStates
            .map(T.safeText)
            .filter((value) => value === STATUS_STATES.ONGOING || value === STATUS_STATES.COMPLETED);
        if (normalizedExplicit.length) {
            return pick(normalizedExplicit[0], 'explicit', normalizedExplicit[0]);
        }

        for (const hint of hintTexts || []) {
            const state = statusStateFromText(hint);
            if (state) return pick(state, 'hint', hint);
        }

        for (const text of fallbackTexts || []) {
            const state = statusStateFromText(text);
            if (state) return pick(state, 'fallback', text);
        }

        return pick(STATUS_STATES.ONGOING, 'default', '');
    }

    function attachStatusInfo(baseData, statusInputs) {
        const info = resolveStatusInfo({
            sourceType: baseData?.sourceType || '',
            ...(statusInputs || {}),
        });
        const statusHint = T.safeText(baseData?.statusHint || info.evidence || '');
        return {
            ...baseData,
            statusHint,
            statusState: info.state,
            isCompleted: info.isCompleted,
            statusInfo: info,
        };
    }

    // ================================================
    // ADAPTERS: EXTRACT IDs + RULES
    // ================================================
    function extractBookId(url) {
        const m = T.safeText(url).match(/\/(?:page|reader)\/(\d+)/);
        if (m) return m[1];
        const onlyDigits = T.safeText(url).match(/(\d{10,})/);
        return onlyDigits ? onlyDigits[1] : '';
    }

    function extractJjwxcId(url) {
        const raw = T.safeText(url);
        let m = raw.match(/book2\/(\d+)/i);
        if (m) return m[1];
        m = raw.match(/novelid=(\d+)/i);
        if (m) return m[1];
        m = raw.match(/\/(\d+)(?:\.html|\/)?$/i);
        if (m) return m[1];
        return '';
    }

    function extractPo18Id(url) {
        const raw = T.safeText(url);
        const m = raw.match(/\/books\/(\d+)/i);
        return m ? m[1] : '';
    }

    function extractIhuabenId(url) {
        const raw = T.safeText(url);
        const m = raw.match(/\/book\/(\d+)/i);
        return m ? m[1] : '';
    }

    function extractQidianId(url) {
        const raw = T.safeText(url);
        const m = raw.match(/\/book\/(\d+)/i);
        return m ? m[1] : '';
    }

    function extractQimaoId(url) {
        const raw = T.safeText(url);
        let m = raw.match(/\/shuku\/(\d+)/i);
        if (m) return m[1];
        m = raw.match(/(\d+)(?:-\d+)?\/?$/i);
        return m ? m[1] : '';
    }

    function extractGongzicpId(url) {
        const raw = T.safeText(url);
        const m = raw.match(/novel-?(\d+)/);
        return m ? m[1] : '';
    }

    function parseLongmaUrlInfo(url) {
        const raw = T.safeText(url);
        if (!raw) return null;

        let parsedUrl = null;
        try {
            parsedUrl = new URL(raw, 'https://ebook.longmabook.com/');
        } catch {
            return null;
        }

        if (!/ebook\.longmabook\.com$/i.test(parsedUrl.hostname)) return null;

        const act = T.safeText(parsedUrl.searchParams.get('act')).toLowerCase();
        if (act && act !== 'showinfo') return null;

        const bookId = T.safeText(parsedUrl.searchParams.get('bookid'));
        if (!bookId) return null;

        const writerCode = T.safeText(parsedUrl.searchParams.get('bookwritercode'));
        const pavilionId = T.safeText(parsedUrl.searchParams.get('pavilionid')).toLowerCase();

        const canonical = new URL('https://ebook.longmabook.com/');
        canonical.searchParams.set('act', 'showinfo');
        if (writerCode) canonical.searchParams.set('bookwritercode', writerCode);
        canonical.searchParams.set('bookid', bookId);
        if (pavilionId) canonical.searchParams.set('pavilionid', pavilionId);

        return {
            url: canonical.toString(),
            bookId,
            writerCode,
            pavilionId,
        };
    }

    function extractLongmaId(url) {
        const info = parseLongmaUrlInfo(url);
        return info ? info.url : '';
    }

    const SITE_RULES = [
        {
            id: 'fanqie',
            name: 'Cà Chua',
            host: /fanqienovel\.com/i,
            label: 'Fanqie (Cà Chua)',
            urlExample: 'https://fanqienovel.com/page/123...',
            useDescDefault: true,
            targetDefault: 'wiki',
            display: {
                emoji: '🍅',
                bg: '#fff3e0',
                border: '#ff9800',
                color: '#ef6c00',
                note: 'Full info + Cover gốc (Full HD)',
            },
            extractId: extractBookId,
            fetch: fetchFanqieData,
            normalize: normalizeFanqieData,
        },
        {
            id: 'jjwxc',
            name: 'Tấn Giang',
            host: /jjwxc\.net|novelid=|book2\//i,
            label: 'Tấn Giang (JJWXC)',
            urlExample: 'https://www.jjwxc.net/onebook.php?novelid=...',
            useDescDefault: false,
            targetDefault: 'wiki',
            display: {
                emoji: '🌿',
                bg: '#e3f2fd',
                border: '#2196f3',
                color: '#1565c0',
                note: 'Cover HD + Full info + Tag chuẩn',
            },
            extractId: extractJjwxcId,
            fetch: fetchJjwxcData,
            normalize: normalizeJjwxcData,
            coverProcess: processJjwxcCover,
        },
        {
            id: 'po18',
            name: 'PO18',
            host: /po18\.tw/i,
            label: 'PO18',
            urlExample: 'https://www.po18.tw/books/123...',
            useDescDefault: true,
            targetDefault: 'webhong',
            display: {
                emoji: '🔞',
                bg: '#ffebee',
                border: '#e91e63',
                color: '#c2185b',
                note: 'Lấy info cơ bản (cần đăng nhập)',
            },
            extractId: extractPo18Id,
            fetch: fetchPo18Data,
            normalize: normalizePo18Data,
        },
        {
            id: 'ihuaben',
            name: 'Ihuaben',
            host: /ihuaben\.com/i,
            label: 'Ihuaben',
            urlExample: 'https://www.ihuaben.com/book/123...',
            useDescDefault: true,
            targetDefault: 'wiki',
            display: {
                emoji: '📚',
                bg: '#f1f8e9',
                border: '#8bc34a',
                color: '#558b2f',
                note: 'Cover HD lấp lánh + Hỗ trợ cơ bản',
            },
            extractId: extractIhuabenId,
            fetch: fetchIhuabenData,
            normalize: normalizeIhuabenData,
        },
        {
            id: 'qidian',
            name: 'Khởi Điểm',
            host: /qidian\.com/i,
            label: 'Khởi Điểm (Qidian)',
            urlExample: 'https://www.qidian.com/book/123...',
            useDescDefault: true,
            targetDefault: 'wiki',
            display: {
                emoji: '📖',
                bg: '#eceff1',
                border: '#607d8b',
                color: '#455a64',
                note: 'Full info',
            },
            extractId: extractQidianId,
            fetch: fetchQidianData,
            normalize: normalizeQidianData,
        },
        {
            id: 'qimao',
            name: 'Thất Miêu',
            host: /qimao\.com/i,
            label: 'Thất Miêu (Qimao)',
            urlExample: 'https://www.qimao.com/shuku/123...',
            useDescDefault: true,
            targetDefault: 'wiki',
            display: {
                emoji: '🐱',
                bg: '#e8f5e9',
                border: '#43a047',
                color: '#2e7d32',
                note: 'Hỗ trợ cơ bản',
            },
            extractId: extractQimaoId,
            fetch: fetchQimaoData,
            normalize: normalizeQimaoData,
            coverProcess: processQimaoCover,
        },
        {
            id: 'gongzicp',
            name: 'Trường Bội',
            host: /gongzicp\.com/i,
            label: 'Trường Bội (Gongzicp)',
            urlExample: 'https://www.gongzicp.com/novel-123...',
            useDescDefault: true,
            targetDefault: 'wiki',
            display: {
                emoji: '🌊',
                bg: '#f3e5f5',
                border: '#9c27b0',
                color: '#7b1fa2',
                note: 'Cover HD (nếu có) + Lọc Tag xịn',
            },
            extractId: extractGongzicpId,
            fetch: fetchGongzicpData,
            normalize: normalizeGongzicpData,
            coverProcess: processGongzicpCover,
        },
        {
            id: 'longma',
            name: 'Hải Đường',
            host: /ebook\.longmabook\.com/i,
            label: 'Hải Đường (Longma)',
            urlExample: 'https://ebook.longmabook.com/?act=showinfo&bookwritercode=...&bookid=...&pavilionid=...',
            useDescDefault: true,
            targetDefault: 'webhong',
            display: {
                emoji: '🌺',
                bg: '#fff8e1',
                border: '#ffb300',
                color: '#ef6c00',
                note: 'Cần đăng nhập Longma',
            },
            extractId: extractLongmaId,
            fetch: fetchLongmaData,
            normalize: normalizeLongmaData,
        },
    ];

    function getSiteRule(type) {
        return SITE_RULES.find(rule => rule.id === type) || null;
    }

    function buildDefaultDomainSettings() {
        const out = {};
        SITE_RULES.forEach((rule) => {
            out[rule.id] = {
                label: rule.label || rule.name || rule.id,
                useDesc: typeof rule.useDescDefault === 'boolean'
                    ? rule.useDescDefault
                    : true,
                assignTags: typeof rule.assignTagsDefault === 'boolean'
                    ? rule.assignTagsDefault
                    : true,
                target: rule.targetDefault || 'wiki',
            };
        });
        return out;
    }

    DEFAULT_SETTINGS.domainSettings = buildDefaultDomainSettings();

    function detectSource(url) {
        const raw = T.safeText(url);
        for (const rule of SITE_RULES) {
            if (!rule.host.test(raw)) continue;
            const id = rule.extractId(raw);
            return { type: rule.id, id };
        }
        return null;
    }

    // ================================================
    // COVER HELPERS
    // ================================================
    function isJjwxcStaticImageUrl(url) {
        return /^https?:\/\/i\d+(?:-static)?\.jjwxc\.net\//i.test(T.safeText(url));
    }

    function isJjwxcDynamicCoverUrl(url) {
        return /^https?:\/\/[^/]*jjwxc\.net\/[^?#]+\.php(?:\?|$)/i.test(T.safeText(url));
    }

    function getCoverRequestModes(url) {
        const src = T.safeText(url);
        if (!src) return ['plain'];
        if (isJjwxcStaticImageUrl(src)) return ['referer', 'plain'];
        if (/^https?:\/\/[^/]*sinaimg\.cn\//i.test(src)) return ['plain'];
        if (/^https?:\/\/(?:img\d+\.)?360buyimg\.com\//i.test(src)) return ['plain'];
        return ['referer', 'plain'];
    }

    function buildCoverRequestHeaders(url, mode = 'plain') {
        const headers = {
            'user-agent': JJWXC_IMAGE_USER_AGENT,
        };
        if (mode === 'referer') {
            headers.referer = JJWXC_IMAGE_REFERER;
        }
        return headers;
    }

    function requestCoverWithFallback({ method, url, responseType, validateResponse, errorMessage }) {
        const modes = getCoverRequestModes(url);
        return new Promise((resolve, reject) => {
            let idx = 0;
            let lastError = null;
            const tryNext = () => {
                if (idx >= modes.length) {
                    reject(lastError || new Error(errorMessage || 'Yeu cau anh that bai.'));
                    return;
                }
                const mode = modes[idx++];
                GM_xmlhttpRequest({
                    method,
                    url,
                    headers: buildCoverRequestHeaders(url, mode),
                    responseType,
                    onload(res) {
                        try {
                            if (validateResponse && !validateResponse(res)) {
                                lastError = new Error(`${errorMessage || 'Yeu cau anh that bai.'} [${mode}]`);
                                tryNext();
                                return;
                            }
                            resolve(res);
                        } catch (err) {
                            lastError = err instanceof Error ? err : new Error(errorMessage || 'Yeu cau anh that bai.');
                            tryNext();
                        }
                    },
                    onerror(err) {
                        lastError = err instanceof Error ? err : new Error(`${errorMessage || 'Yeu cau anh that bai.'} [${mode}]`);
                        tryNext();
                    },
                    ontimeout() {
                        lastError = new Error(`${errorMessage || 'Yeu cau anh that bai.'} [${mode}]`);
                        tryNext();
                    },
                });
            };
            tryNext();
        });
    }

    function checkImageUrlValid(url) {
        return requestCoverWithFallback({
            method: 'HEAD',
            url,
            validateResponse: (res) => {
                if (res.status !== 200) return false;
                const contentType = (res.responseHeaders || '')
                    .match(/content-type:\s*([^\r\n]+)/i)?.[1] || '';
                return contentType.toLowerCase().startsWith('image/');
            },
            errorMessage: 'Khong xac minh duoc URL anh.',
        }).then((res) => {
                    const contentType = (res.responseHeaders || '')
                        .match(/content-type:\s*([^\r\n]+)/i)?.[1] || '';
                    return res.status === 200 && contentType.toLowerCase().startsWith('image/');
                })
            .catch(() => false);
    }

    async function processJjwxcCover(novelCover) {
        if (!novelCover) return '';
        const coverRaw = novelCover.replace(/^http:/i, 'https:');
        if (isJjwxcDynamicCoverUrl(coverRaw)) {
            return coverRaw;
        }
        const cleaned = coverRaw.split('?')[0];
        const base = cleaned.replace(/_[0-9]+_[0-9]+(?=\.(?:jpg|jpeg|png|webp))/i, '');
        const baseStem = base.replace(/\.(jpg|jpeg|png|webp)$/i, '');
        const candidates = [];
        const pushUnique = (url) => {
            if (!url || candidates.includes(url)) return;
            candidates.push(url);
        };
        pushUnique(base);
        ['jpg', 'jpeg', 'png', 'webp'].forEach((ext) => pushUnique(`${baseStem}.${ext}`));

        for (const url of candidates) {
            if (await checkImageUrlValid(url)) return url;
        }
        return coverRaw;
    }

    async function processQimaoCover(coverUrl) {
        if (!coverUrl) return '';
        const raw = coverUrl;
        const cleaned = raw.split('?')[0];
        const modified = cleaned.replace(/_[0-9]+x[0-9]+(?=\.(?:jpg|jpeg|png|webp))/i, '');
        if (modified === cleaned) return raw;
        const isValid = await checkImageUrlValid(modified);
        return isValid ? modified : raw;
    }

    async function processGongzicpCover(coverUrl) {
        if (!coverUrl) return '';
        const raw = coverUrl;
        let hdUrl = raw.split('?')[0].split('@')[0];
        if (hdUrl.startsWith('//')) hdUrl = 'https:' + hdUrl;
        hdUrl = hdUrl.replace('http:', 'https:');
        return hdUrl;
    }

    function processIhuabenCover(coverUrl) {
        if (!coverUrl) return '';
        return coverUrl.split('?')[0].split('@')[0];
    }

    HELPERS.cover = {
        checkImageUrlValid,
        processJjwxcCover,
        processQimaoCover,
        processGongzicpCover,
        processIhuabenCover,
    };

    // ================================================
    // ADAPTERS: FETCH (RAW)
    // ================================================
    function extractFanqieInitialState(html) {
        const marker = 'window.__INITIAL_STATE__=';
        const raw = T.safeText(html);
        const start = raw.indexOf(marker);
        if (start < 0) return null;
        let i = start + marker.length;
        const n = raw.length;
        while (i < n && /\s/.test(raw[i])) i += 1;
        if (i >= n || raw[i] !== '{') return null;
        let depth = 0;
        let inString = false;
        let escaped = false;
        for (let j = i; j < n; j += 1) {
            const ch = raw[j];
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (ch === '\\') {
                    escaped = true;
                } else if (ch === '"') {
                    inString = false;
                }
                continue;
            }
            if (ch === '"') {
                inString = true;
                continue;
            }
            if (ch === '{') {
                depth += 1;
                continue;
            }
            if (ch === '}') {
                depth -= 1;
                if (depth === 0) {
                    try {
                        const stateText = raw
                            .slice(i, j + 1)
                            .replace(/:\s*undefined(?=\s*[,}])/g, ': null');
                        return JSON.parse(stateText);
                    } catch {
                        return null;
                    }
                }
            }
        }
        return null;
    }

    function parseFanqieCategoryV2(raw) {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        const text = T.safeText(raw).trim();
        if (!text) return [];
        try {
            const arr = JSON.parse(text);
            return Array.isArray(arr) ? arr : [];
        } catch {
            return [];
        }
    }

    function extractFanqieStatusLabel(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html || '', 'text/html');
        return D.queryText(doc, [
            '.page-header-info .info-label-yellow',
            '.info-label-yellow',
            '.info-label',
        ]);
    }

    function normalizeFanqieCover(url) {
        let raw = T.safeText(url).trim();
        if (!raw) return '';
        if (raw.startsWith('//')) raw = `https:${raw}`;
        raw = raw.replace(/^http:\/\//i, 'https://');

        const picMatch = raw.match(/\/novel-pic\/([^~?#/]+)/i);
        if (picMatch) {
            return `https://p6-novel.byteimg.com/origin/novel-pic/${picMatch[1]}`;
        }

        const staticMatch = raw.match(/^(https:\/\/[^/]+)\/origin\/novel-static\/([^~?#/]+)/i);
        if (staticMatch) {
            return `${staticMatch[1]}/origin/novel-static/${staticMatch[2]}`;
        }

        const staticIdMatch = raw.match(/\/origin\/novel-static\/([^~?#/]+)/i);
        if (staticIdMatch) {
            return `https://p1-tt.byteimg.com/origin/novel-static/${staticIdMatch[1]}`;
        }

        return raw;
    }

    function mapFanqieWebStateToRaw(page) {
        const bookName = T.safeText(page.bookName || page.book_name || page.title || '');
        const author = T.safeText(page.author || page.authorName || page.author_name || '');
        const abstractText = T.safeText(page.abstract || page.bookAbstract || page.book_abstract || page.book_abstract_v2 || '');
        const categoryV2 = parseFanqieCategoryV2(page.categoryV2 || page.category_v2);
        const labels = T.parseTagList(page.category || page.completeCategory || '');
        const categoryNames = categoryV2.map(c => c && c.Name).filter(Boolean);
        const mergedTags = Array.from(new Set([...labels, ...categoryNames])).filter(Boolean);
        const statusVal = page.status != null ? page.status : page.creationStatus;
        const wordNumber = page.wordNumber || page.word_number || page.wordNumberText || '';
        const lastChapterTitle = T.safeText(page.lastChapterTitle || page.last_chapter_title || '');
        return {
            book_name: bookName,
            author: author,
            abstract: abstractText,
            category_v2: categoryV2,
            category: categoryNames.join(','),
            tags: mergedTags.join(','),
            update_status: statusVal,
            creation_status: page.creationStatus,
            word_number: wordNumber,
            last_chapter_title: lastChapterTitle,
            thumb_url: normalizeFanqieCover(page.thumbUrl || page.thumbUri || page.cover || page.coverUrl || page.detailPageThumbUrl || page.detail_page_thumb_url || ''),
        };
    }

    function parseFanqieWebDom(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html || '', 'text/html');
        const title = D.queryText(doc, ['.page-header-info .info-name h1', '.info-name h1', '.page-header-info h1', 'h1']);
        const author = D.queryText(doc, ['.author-name-text', '.author-name', '.page-header-author']);
        const introHtml = D.queryHtml(doc, ['.page-abstract-content', '.page-abstract .content', '.description-content']);
        let intro = introHtml ? T.htmlToText(introHtml) : '';
        if (!intro) {
            const metaDesc = D.queryAttr(doc, ['meta[name="description"]', 'meta[property="og:description"]'], 'content');
            if (metaDesc) intro = T.htmlToText(metaDesc);
        }
        const coverRaw = D.queryAttr(doc, ['.book-cover-img', '.book-cover img', 'meta[property="og:image"]'], 'content')
            || D.queryAttr(doc, ['.book-cover-img', '.book-cover img'], 'src');
        const cover = normalizeFanqieCover(coverRaw);
        const statusLabel = D.queryText(doc, ['.page-header-info .info-label-yellow', '.info-label-yellow', '.info-label']);
        const creationStatus = statusLabel.includes('完结') ? '2' : (statusLabel.includes('连载') ? '1' : '');
        const labelTags = D.collectTexts(doc, ['.info-label-grey', '.info-label .info-label-grey']);
        let chapterTotal = '';
        const directoryHeader = D.queryText(doc, ['.page-directory-header h3']);
        const m = directoryHeader.match(/(\d+)/);
        if (m) chapterTotal = m[1];
        const wordNumber = D.queryText(doc, ['.info-count-word .detail']);
        const lastChapterTitle = D.queryText(doc, ['.info-last-title']).replace(/^最近更新[:：]?\s*/, '');
        return {
            book_name: title,
            author,
            abstract: intro,
            category_v2: [],
            category: labelTags.join(','),
            tags: labelTags.join(','),
            update_status: creationStatus,
            creation_status: creationStatus,
            word_number: wordNumber,
            last_chapter_title: lastChapterTitle,
            chapter_total: chapterTotal,
            thumb_url: cover,
            status_hint: statusLabel,
        };
    }

    function fetchFanqieData(bookId) {
        const url = `https://fanqienovel.com/page/${bookId}`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload(res) {
                    const html = T.safeText(res.responseText || '');
                    if (!html) {
                        reject(new Error('Fanqie web không có dữ liệu.'));
                        return;
                    }
                    const statusLabel = extractFanqieStatusLabel(html);
                    const state = extractFanqieInitialState(html);
                    const page = state && state.page && typeof state.page === 'object' ? state.page : null;
                    if (page) {
                        const raw = mapFanqieWebStateToRaw(page);
                        if (statusLabel && !raw.status_hint) raw.status_hint = statusLabel;
                        resolve(raw);
                        return;
                    }
                    const fallback = parseFanqieWebDom(html);
                    if (fallback && (fallback.book_name || fallback.author || fallback.abstract)) {
                        resolve(fallback);
                        return;
                    }
                    reject(new Error('Fanqie web không có dữ liệu.'));
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    function fetchJjwxcData(bookId, apiMode = JJWXC_API_MODE_NEW) {
        const mode = normalizeJjwxcApiMode(apiMode) || JJWXC_API_MODE_NEW;
        const isOldMode = mode === JJWXC_API_MODE_OLD;
        const apiUrl = isOldMode
            ? `http://app.jjwxc.net/androidapi/novelbasicinfo?novelId=${bookId}`
            : `https://app.jjwxc.org/androidapi/novelbasicinfo?novelId=${bookId}`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                responseType: 'json',
                headers: isOldMode ? undefined : {
                    'referer': `http://android.jjwxc.net/?v=${JJWXC_APP_VERSION_CODE}`,
                    'origin': 'http://android.jjwxc.net',
                    'x-requested-with': 'com.jjwxc.reader',
                    'user-agent': JJWXC_APP_USER_AGENT,
                },
                onload(res) {
                    if (res.status < 200 || res.status >= 300) {
                        reject(new Error(`JJWXC API ${isOldMode ? 'cũ' : 'mới'} lỗi HTTP: ` + res.status));
                        return;
                    }
                    let parsed = res.response;
                    if (!parsed && res.responseText) {
                        try { parsed = JSON.parse(res.responseText); } catch { parsed = null; }
                    }
                    if (!parsed) {
                        reject(new Error(`JJWXC API ${isOldMode ? 'cũ' : 'mới'} không có dữ liệu.`));
                        return;
                    }
                    resolve(parsed);
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    function fetchPo18Data(bookId) {
        const baseUrl = 'https://www.po18.tw';
        const primaryUrl = `${baseUrl}/books/${bookId}`;
        const fallbackUrl = `${baseUrl}/books/${bookId}/articles`;

        const guardLogin = (html) => {
            if (!html) return;
            const lower = html.toLowerCase();
            if (html.includes('會員登入') || html.includes('會員登錄') || lower.includes('login.php')) {
                throw new Error('Cookie PO18 hết hạn / chưa đăng nhập.');
            }
        };

        const parseHtml = (html, url) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html || '', 'text/html');
            const title = D.queryText(doc, ['h1.book_name', '.book_name', '.book_title', 'h1']);
            const author = D.queryText(doc, ['.book_author', '.book_author a', '.book_info .author', '.author']);
            const cover = D.queryAttr(doc, [
                '.book_cover img',
                '.book_cover>img',
                '.cover img',
                'meta[property="og:image"]',
            ], 'content') || D.queryAttr(doc, ['.book_cover img', '.book_cover>img', '.cover img'], 'src');
            const introHtml = D.queryHtml(doc, [
                '.book_intro .B_I_content',
                '.book_intro',
                '#book_intro',
                '.book_intro_txt',
                '.book_desc',
                '.book_introduction',
                '.intro',
            ]);
            let intro = introHtml ? T.htmlToText(introHtml) : '';

            let introTagTexts = D.collectTexts(doc, ['.book_intro_tags a']);
            if (!introTagTexts.length) {
                introTagTexts = D.collectTexts(doc, ['.book_intro_tags span']);
            }
            const tagTexts = D.collectTexts(doc, [
                '.book_tag a',
                '.book_tag span',
                '.book_tags a',
                '.book_tags span',
                '.tag_list a',
                '.tag_list span',
                '.tags a',
                '.tags span',
                'a[href*="tag"]',
                'a[href*="tags"]',
            ]);

            let statusHint = D.queryText(doc, ['.book_info .statu', '.book_info .status', '.statu', '.status']);
            const categories = [];
            const tags = [];
            extractInfoPairs(doc).forEach(({ key, value }) => {
                if (/(標籤|标签|tag)/i.test(key)) {
                    tags.push(...T.parseTagList(value));
                } else if (/(分類|类别|類別|题材|題材|类型|類型)/i.test(key)) {
                    categories.push(...T.parseTagList(value));
                } else if (/(狀態|状态|進度|连载|連載|完結|完本|已完结|已完結)/i.test(key)) {
                    statusHint = value;
                }
            });

            if (introTagTexts.length) tags.push(...introTagTexts);
            if (tagTexts.length) tags.push(...tagTexts);
            const metaKeywords = D.queryAttr(doc, ['meta[name="keywords"]'], 'content');
            if (metaKeywords) tags.push(...T.parseTagList(metaKeywords));
            if (!statusHint) {
                const statusFromTags = [...introTagTexts, ...tagTexts].find(t => !!statusStateFromText(t));
                if (statusFromTags) statusHint = statusFromTags;
            }
            if (!intro) {
                const metaDesc = D.queryAttr(doc, ['meta[name="description"]', 'meta[property="og:description"]'], 'content');
                if (metaDesc) {
                    intro = T.htmlToText(metaDesc);
                }
            }

            const coverUrl = D.toAbsoluteUrl(cover, url);
            return {
                title,
                author,
                intro,
                coverUrl,
                tags: Array.from(new Set(T.parseTagList(tags.join(',')))),
                introTags: Array.from(new Set(T.parseTagList(introTagTexts.join(',')))),
                categories: Array.from(new Set(categories)),
                statusHint,
            };
        };

        return new Promise((resolve, reject) => {
            const request = (url, fallback) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    responseType: 'text',
                    onload(res) {
                        const html = res.responseText || res.response || '';
                        try {
                            guardLogin(html);
                        } catch (err) {
                            reject(err);
                            return;
                        }
                        const parsed = parseHtml(html, url);
                        if ((!parsed.title && !parsed.author) && fallback) {
                            request(fallback, null);
                            return;
                        }
                        resolve(parsed);
                    },
                    onerror(err) {
                        if (fallback) {
                            request(fallback, null);
                        } else {
                            reject(err);
                        }
                    },
                });
            };
            request(primaryUrl, fallbackUrl);
        });
    }

    function fetchIhuabenData(bookId) {
        const url = `https://www.ihuaben.com/book/${bookId}.html`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'text',
                onload(res) {
                    const html = res.responseText || res.response || '';
                    const doc = new DOMParser().parseFromString(html, 'text/html');

                    const title = D.queryText(doc, [
                        '.infodetail .simpleinfo h1.text-danger',
                        '.infodetail .simpleinfo h1',
                        'h1.text-danger',
                        'h1',
                    ]) || D.queryAttr(doc, [
                        'meta[property="og:title"]',
                        'meta[property="og:novel:book_name"]',
                    ], 'content');

                    const author = D.queryText(doc, [
                        '.infodetail .simpleinfo a.text-muted',
                        '.infodetail .simpleinfo a',
                        '.simpleinfo a.text-muted',
                    ]);

                    let cover = D.queryAttr(doc, [
                        '.biginfo .cover img',
                        '.cover img',
                        'meta[property="og:image"]',
                    ], 'content');
                    cover = D.toAbsoluteUrl(cover, url);
                    cover = processIhuabenCover(cover);

                    const introHtml = D.queryHtml(doc, [
                        '.infodetail .aboutbook',
                        '.infodetail .text-muted.aboutbook',
                        '.aboutbook',
                    ]);
                    let intro = introHtml ? T.htmlToText(introHtml) : '';
                    intro = intro.replace(/^简介[:：]\s*/i, '');
                    if (!intro) {
                        const metaDesc = D.queryAttr(doc, [
                            'meta[property="og:description"]',
                            'meta[name="description"]',
                        ], 'content');
                        if (metaDesc) intro = T.htmlToText(metaDesc);
                    }

                    const tagTexts = D.collectTexts(doc, [
                        '#tagList a',
                        '#tagList .text-muted',
                        '.HuabenListUL#tagList a',
                    ]);

                    const statusTexts = D.collectTexts(doc, [
                        '.simpleinfo label',
                        '.infodetail .simpleinfo label',
                        '.simpleinfo .text-muted',
                    ]);
                    const statusHint = statusTexts.find(t => !!statusStateFromText(t)) || '';

                    resolve({
                        title,
                        author,
                        intro,
                        coverUrl: cover,
                        tags: Array.from(new Set(T.parseTagList(tagTexts.join(',')))),
                        categories: [],
                        statusHint,
                    });
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    function detectQidianCaptcha(html = '') {
        const raw = (html || '').toString();
        const lower = raw.toLowerCase();
        return (
            lower.includes('tcaptcha') ||
            lower.includes('turing') ||
            lower.includes('captcha') ||
            lower.includes('waf') ||
            raw.includes('安全验证') ||
            raw.includes('验证码') ||
            raw.includes('滑动验证') ||
            raw.includes('访问过于频繁')
        );
    }

    function fetchQidianData(bookId) {
        const url = `https://www.qidian.com/book/${bookId}/`;
        return new Promise((resolve, reject) => {
            const maxRetry = 2;
            const parseHtml = (html) => {
                const doc = new DOMParser().parseFromString(html, 'text/html');

                const title = D.queryText(doc, ['h1#bookName', '.book-info-top h1#bookName'])
                    || D.queryAttr(doc, ['meta[property="og:novel:book_name"]', 'meta[property="og:title"]'], 'content');

                let author = D.queryText(doc, ['.book-meta .author', 'span.author', 'a.writer-name']);
                if (!author) {
                    author = D.queryAttr(doc, ['meta[property="og:novel:author"]'], 'content');
                }
                author = author.replace(/^作者[:：]\s*/i, '');

                let cover = D.queryAttr(doc, ['meta[property="og:image"]'], 'content');
                if (!cover) {
                    cover = D.queryAttr(doc, ['.book-detail-img img', '.book-author img', '#bookImg img'], 'src');
                }
                cover = D.toAbsoluteUrl(cover, url);
                cover = cover.replace(/\/\d+(\.\w+)?$/, '/600.webp');

                const introHtml = D.queryHtml(doc, [
                    '.intro-detail p#book-intro-detail',
                    '.intro-detail',
                    'p.intro',
                ]);
                let intro = introHtml ? T.htmlToText(introHtml) : '';
                if (!intro) {
                    const metaDesc = D.queryAttr(doc, [
                        'meta[property="og:description"]',
                        'meta[name="description"]',
                    ], 'content');
                    if (metaDesc) intro = T.htmlToText(metaDesc);
                }

                const tagTexts = D.collectTexts(doc, [
                    '.intro-honor-label p.all-label a',
                    '.intro-honor-label a',
                    '.all-label a',
                ]);

                const categories = D.collectTexts(doc, [
                    '.book-attribute a',
                ]);

                let statusHint = D.queryAttr(doc, ['meta[property="og:novel:status"]'], 'content');
                if (!statusHint) {
                    const statusTexts = D.collectTexts(doc, [
                        '.book-attribute span',
                        '.book-attribute p',
                        '.book-info-tag span',
                        '.book-info-tag a',
                    ]);
                    statusHint = statusTexts.find(t => !!statusStateFromText(t)) || '';
                }

                return {
                    title,
                    author,
                    intro,
                    coverUrl: cover,
                    tags: Array.from(new Set(T.parseTagList(tagTexts.join(',')))),
                    categories: Array.from(new Set(T.parseTagList(categories.join(',')))),
                    statusHint,
                };
            };

            const requestHtml = () => new Promise((resolve, reject) => {
                if (typeof GM_xmlhttpRequest !== 'function') {
                    reject(new Error('GM_xmlhttpRequest không tồn tại.'));
                    return;
                }
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    responseType: 'text',
                    timeout: 12000,
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Upgrade-Insecure-Requests': '1',
                        'Referer': url,
                    },
                    anonymous: false,
                    withCredentials: true,
                    onload(res) {
                        resolve(res.responseText || res.response || '');
                    },
                    onerror(err) {
                        reject(err);
                    },
                    ontimeout() {
                        reject(new Error('Qidian request timeout'));
                    },
                });
            });

            const tryFetch = async (attempt) => {
                const html = await requestHtml();
                const isCaptcha = detectQidianCaptcha(html);
                const data = parseHtml(html);
                if (!data.title && !data.author) {
                    if (attempt < maxRetry) {
                        if (attempt === 1) {
                            const msg = isCaptcha
                                ? 'Fallback dùng trình duyệt: mở tab Qidian để xác thực/cập nhật cookie...'
                                : 'Fallback dùng trình duyệt: mở tab Qidian để tải lại dữ liệu...';
                            logUi(msg, 'warn');
                            openInBrowserTab(url);
                            await sleep(6000);
                        }
                        return tryFetch(attempt + 1);
                    }
                    throw new Error('Qidian bị chặn. Vui lòng xác thực trong tab Qidian rồi thử lại.');
                }
                return data;
            };

            (async () => {
                try {
                    const data = await tryFetch(1);
                    resolve(data);
                } catch (err) {
                    reject(err);
                }
            })();
        });
    }

    function fetchQimaoData(bookId) {
        const url = `https://www.qimao.com/shuku/${bookId}/`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'text',
                onload(res) {
                    const html = res.responseText || res.response || '';
                    const doc = new DOMParser().parseFromString(html, 'text/html');

                    const title = D.queryText(doc, [
                        '.book-information .wrap-txt .title .txt',
                        '.book-detail-info .title .txt',
                        '.book-detail-info .title',
                    ]) || D.queryAttr(doc, ['meta[property="og:title"]'], 'content');

                    const author = D.queryText(doc, [
                        '.book-information .sub-title em a',
                        '.book-information .sub-title em',
                        '.author-information .author-name a',
                    ]);

                    const cover = D.toAbsoluteUrl(D.queryAttr(doc, [
                        '.book-information .wrap-pic img',
                        '.wrap-pic img',
                        'meta[property="og:image"]',
                    ], 'src'), url);

                    const introHtml = D.queryHtml(doc, [
                        '.book-introduction p.intro',
                        '.book-introduction .intro',
                    ]);
                    let intro = introHtml ? T.htmlToText(introHtml) : '';
                    if (!intro) {
                        const metaDesc = D.queryAttr(doc, ['meta[name="description"]'], 'content');
                        if (metaDesc) intro = T.htmlToText(metaDesc);
                    }

                    const categoryTexts = D.collectTexts(doc, [
                        '.book-information .tags-wrap a',
                        '.tags-wrap a',
                    ]);
                    const tagTexts = D.collectTexts(doc, [
                        '.book-information .tags-wrap .qm-tag',
                        '.tags-wrap .qm-tag',
                    ]);

                    let statusHint = '';
                    const statusTag = tagTexts.find(t => !!statusStateFromText(t));
                    if (statusTag) statusHint = statusTag;

                    const tags = Array.from(new Set(T.parseTagList(tagTexts.join(','))));
                    const categories = Array.from(new Set(T.parseTagList(categoryTexts.join(','))));

                    resolve({
                        title,
                        author,
                        intro,
                        coverUrl: cover,
                        tags,
                        categories,
                        statusHint,
                    });
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    function getLongmaPavilionInfo(pavilionId) {
        const map = {
            a: { name: '耽美', keywords: ['耽美', '男男', 'BL'] },
            b: { name: '言情', keywords: ['言情', '男女', 'BG'] },
            c: { name: '同人', keywords: ['同人', '二創', '二创', '男男'] },
            d: { name: '百合', keywords: ['百合', '女女', 'GL'] },
        };
        const key = T.safeText(pavilionId).toLowerCase();
        return map[key] || { name: '', keywords: [] };
    }

    function extractLongmaDescriptionFromCard(cardEl) {
        const html = T.safeText(cardEl?.innerHTML || '');
        if (!html) return '';
        const bodyMatch = html.match(
            /<font[^>]*#800080[^>]*>[\s\S]*?<\/font>\s*([\s\S]*?)(?:<div[^>]*id=['"]showbooklist|<textarea[^>]*id=['"]showbooklisttmp|<h4>\s*查看|$)/i
        );
        if (!bodyMatch) return '';
        let bodyHtml = bodyMatch[1] || '';
        bodyHtml = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, '');
        bodyHtml = bodyHtml.replace(/<style[\s\S]*?<\/style>/gi, '');
        return T.htmlToText(bodyHtml)
            .replace(/\r/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function fetchLongmaData(sourceId) {
        const sourceInfo = parseLongmaUrlInfo(sourceId);
        if (!sourceInfo) {
            return Promise.reject(new Error('Longma URL không hợp lệ.'));
        }

        const url = sourceInfo.url;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'text',
                timeout: 12000,
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Referer': url,
                },
                anonymous: false,
                withCredentials: true,
                onload(res) {
                    const html = (res.responseText || res.response || '').toString();
                    if (!html.trim()) {
                        reject(new Error('Longma trả về trang rỗng.'));
                        return;
                    }

                    if (/top\.location\.href=['"]\/login\.php/i.test(html)) {
                        reject(new Error('Longma yêu cầu đăng nhập. Hãy mở Longma và đăng nhập trước.'));
                        return;
                    }

                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const bookCards = Array.from(doc.querySelectorAll('#mypages .uk-card.uk-card-default, #mypages .uk-card'));
                    const bookCard = bookCards.find((card) => /作品編號/.test(T.safeText(card.textContent || '')) && !!card.querySelector('h4'));
                    if (!bookCard) {
                        reject(new Error('Không parse được trang Longma (có thể bị chặn/captcha hoặc thiếu cookie).'));
                        return;
                    }

                    const title = T.safeText(bookCard.querySelector('h4')?.textContent || '');
                    const author = D.queryText(doc, ['#writerinfos h4 a', '#writerinfos a']);
                    let statusHint = T.safeText(bookCard.querySelector('.uk-label')?.textContent || '');
                    if (!statusHint) {
                        const inline = T.safeText(bookCard.textContent || '');
                        const matched = inline.match(/(連載中|连载中|已完結|已完结|完結|完结|更新中)/i);
                        if (matched) statusHint = matched[1];
                    }

                    const metaLine = T.safeText(bookCard.querySelector("font[color='#800080']")?.textContent || '');
                    const metaParts = Array.from(new Set(T.parseTagList(metaLine).map(T.safeText).filter(Boolean)));
                    const desc = extractLongmaDescriptionFromCard(bookCard);

                    const coverRaw = D.queryAttr(bookCard, [
                        'img[src*="bookcover"]',
                        'img[src*="ebookupload"]',
                        'img[src*="/book"]',
                        'img[src*="/ebook"]',
                    ], 'src');
                    const coverUrl = D.toAbsoluteUrl(coverRaw, url);

                    const pavilionInfo = getLongmaPavilionInfo(sourceInfo.pavilionId);

                    resolve({
                        title,
                        author,
                        intro: desc,
                        coverUrl,
                        statusHint,
                        metaLine,
                        metaParts,
                        pavilionId: sourceInfo.pavilionId,
                        pavilionName: pavilionInfo.name,
                        pavilionKeywords: pavilionInfo.keywords,
                        bookId: sourceInfo.bookId,
                        writerCode: sourceInfo.writerCode,
                    });
                },
                onerror(err) {
                    reject(err);
                },
                ontimeout() {
                    reject(new Error('Longma request timeout'));
                },
            });
        });
    }

    function describeCharacterRelationsJJWXC(data) {
        if (!data) {
            return { protagonist: '', costar: '' };
        }
        // Return raw protagonist and costar fields as-is
        return {
            protagonist: T.safeText(data.protagonist || ''),
            costar: T.safeText(data.costar || '')
        };
    }

    // ================================================
    // ADAPTERS: NORMALIZE
    // ================================================
    function normalizeFanqieData(raw) {
        const titleCn = T.safeText(raw.book_name || raw.original_book_name);
        const authorCn = T.safeText(raw.author);
        const descCn = T.safeText(raw.book_abstract_v2 || raw.abstract);
        const tags = T.parseTagList(raw.tags).concat(T.parseTagList(raw.pure_category_tags));
        const categoryV2 = Array.isArray(raw.category_v2)
            ? raw.category_v2
            : (() => {
                try { return JSON.parse(raw.category_v2 || '[]'); } catch { return []; }
            })();
        const categories = categoryV2.map(c => c?.Name).filter(Boolean);
        if (raw.category) categories.push(raw.category);
        const base = {
            sourceType: 'fanqie',
            sourceLabel: 'Cà Chua',
            titleCn,
            authorCn,
            descCn,
            tags: Array.from(new Set(tags)),
            categories: Array.from(new Set(categories)),
            coverUrl: raw.expand_thumb_url || raw.thumb_url || '',
            statusHint: T.safeText(raw.status_hint || raw.statusHint || ''),
            update_status: raw.update_status,
            extraKeywords: [],
        };
        return attachStatusInfo(base, {
            explicitStates: [
                statusStateFromText(raw.status_hint || raw.statusHint || ''),
                mapStatusCode(raw.update_status, { '0': STATUS_STATES.ONGOING, '1': STATUS_STATES.ONGOING, '2': STATUS_STATES.COMPLETED }),
                mapStatusCode(raw.creation_status, { '0': STATUS_STATES.ONGOING, '1': STATUS_STATES.ONGOING, '2': STATUS_STATES.COMPLETED }),
                mapStatusCode(raw.book_status, { '0': STATUS_STATES.ONGOING, '1': STATUS_STATES.ONGOING, '2': STATUS_STATES.COMPLETED }),
                statusStateFromBoolish(raw.isFinished, true),
                statusStateFromBoolish(raw.is_finished, true),
            ],
            hintTexts: [
                raw.novel_status,
                raw.status,
                raw.book_status_text,
                raw.status_hint,
                raw.statusHint,
            ],
            fallbackTexts: [tags.join(','), categories.join(',')],
        });
    }

    function normalizeJjwxcData(raw) {
        const titleCn = T.safeText(raw.novelName);
        const authorCn = T.safeText(raw.authorName);
        const introText = T.htmlToText(raw.novelIntro || '');
        const tagsRaw = T.safeText(raw.novelTags);
        const tagsLine = tagsRaw ? `内容标签：${tagsRaw}` : '';
        const rel = describeCharacterRelationsJJWXC(raw);
        const relLines = [rel.protagonist, rel.costar].filter(Boolean);
        const otherText = T.safeText(raw.other);
        const introShortRaw = T.safeText(raw.novelIntroShort);
        const introShort = introShortRaw ? `一句话简介：${introShortRaw}` : '';
        const descCn = [
            introText,
            tagsLine,
            ...relLines,
            otherText,
            introShort,
        ].filter(Boolean).join('\n');
        const tags = T.parseTagList(raw.novelTags);
        const categories = T.parseTagList(raw.novelClass);
        const statusHint = T.safeText(raw.novelStep || raw.novelStatus || raw.isFinished || raw.novelComplete);
        const extraKeywords = T.parseTagList(raw.novelType || raw.novelTypeName || '');
        const base = {
            sourceType: 'jjwxc',
            sourceLabel: 'Tấn Giang',
            titleCn,
            authorCn,
            descCn,
            tags,
            categories,
            coverUrl: T.safeText(raw.novelCover || raw.originalCover || raw.localImg),
            statusHint,
            update_status: undefined,
            extraKeywords,
        };
        return attachStatusInfo(base, {
            explicitStates: [
                mapStatusCode(raw.novelStep, { '0': STATUS_STATES.ONGOING, '1': STATUS_STATES.ONGOING, '2': STATUS_STATES.COMPLETED }),
                mapStatusCode(raw.novelComplete, { '0': STATUS_STATES.ONGOING, '1': STATUS_STATES.COMPLETED, '2': STATUS_STATES.COMPLETED }),
                statusStateFromBoolish(raw.isFinished, true),
                statusStateFromBoolish(raw.is_finished, true),
            ],
            hintTexts: [
                raw.novelStatus,
                raw.novelStep,
                raw.novelComplete,
                statusHint,
            ],
            fallbackTexts: [tags.join(','), categories.join(','), extraKeywords.join(',')],
        });
    }

    function normalizePo18Data(raw) {
        const titleCn = T.safeText(raw.title).replace(/^作品名稱[:：]\s*/i, '');
        const authorCn = T.safeText(raw.author).replace(/^作者[:：]\s*/i, '');
        const introTags = T.parseTagList((raw.introTags || []).join(','));
        const tags = introTags.slice();
        const categories = T.parseTagList((raw.categories || []).join(','));
        const intro = T.safeText(raw.intro);
        const tagLine = introTags.length ? `Tags: ${introTags.join(', ')}` : '';
        const descCn = intro && tagLine ? `${intro}\n${tagLine}` : (intro || tagLine);
        const statusHint = T.safeText(raw.statusHint);
        const base = {
            sourceType: 'po18',
            sourceLabel: 'PO18',
            titleCn,
            authorCn,
            descCn,
            tags,
            categories,
            coverUrl: T.safeText(raw.coverUrl),
            statusHint,
            update_status: undefined,
            extraKeywords: [],
        };
        return attachStatusInfo(base, {
            hintTexts: [statusHint],
            fallbackTexts: [tags.join(','), categories.join(','), introTags.join(',')],
        });
    }

    function normalizeIhuabenData(raw) {
        const titleCn = T.safeText(raw.title);
        const authorCn = T.safeText(raw.author);
        const descCn = T.safeText(raw.intro);
        const tags = T.parseTagList((raw.tags || []).join(','));
        const categories = T.parseTagList((raw.categories || []).join(','));
        const statusHint = T.safeText(raw.statusHint);
        const base = {
            sourceType: 'ihuaben',
            sourceLabel: 'Ihuaben',
            titleCn,
            authorCn,
            descCn,
            tags,
            categories,
            coverUrl: T.safeText(raw.coverUrl),
            statusHint,
            update_status: undefined,
            extraKeywords: [],
        };
        return attachStatusInfo(base, {
            hintTexts: [statusHint],
            fallbackTexts: [tags.join(','), categories.join(',')],
        });
    }

    function normalizeQidianData(raw) {
        const titleCn = T.safeText(raw.title);
        const authorCn = T.safeText(raw.author);
        const descCn = T.safeText(raw.intro);
        const tags = T.parseTagList((raw.tags || []).join(','));
        const categories = T.parseTagList((raw.categories || []).join(','));
        const statusHint = T.safeText(raw.statusHint);
        const base = {
            sourceType: 'qidian',
            sourceLabel: 'Khởi Điểm',
            titleCn,
            authorCn,
            descCn,
            tags,
            categories,
            coverUrl: T.safeText(raw.coverUrl),
            statusHint,
            update_status: undefined,
            extraKeywords: [],
        };
        return attachStatusInfo(base, {
            hintTexts: [statusHint],
            fallbackTexts: [tags.join(','), categories.join(',')],
        });
    }

    function normalizeQimaoData(raw) {
        const titleCn = T.safeText(raw.title);
        const authorCn = T.safeText(raw.author);
        const descCn = T.safeText(raw.intro);
        const tags = T.parseTagList((raw.tags || []).join(','));
        const categories = T.parseTagList((raw.categories || []).join(','));
        const statusHint = T.safeText(raw.statusHint);
        const base = {
            sourceType: 'qimao',
            sourceLabel: 'Thất Miêu',
            titleCn,
            authorCn,
            descCn,
            tags,
            categories,
            coverUrl: T.safeText(raw.coverUrl),
            statusHint,
            update_status: undefined,
            extraKeywords: [],
        };
        return attachStatusInfo(base, {
            hintTexts: [statusHint],
            fallbackTexts: [tags.join(','), categories.join(',')],
        });
    }

    function normalizeLongmaData(raw) {
        const titleCn = T.safeText(raw.title);
        const authorCn = T.safeText(raw.author);
        const descCn = T.safeText(raw.intro);
        const metaParts = Array.isArray(raw.metaParts) ? raw.metaParts.map(T.safeText).filter(Boolean) : [];

        const categories = [];
        if (metaParts[0]) categories.push(metaParts[0]);
        if (metaParts[1]) categories.push(metaParts[1]);
        if (metaParts[2]) categories.push(metaParts[2]);
        if (raw.pavilionName) categories.push(raw.pavilionName);

        const tags = metaParts.slice(3);
        const extraKeywords = Array.isArray(raw.pavilionKeywords) ? raw.pavilionKeywords : [];
        const statusHint = T.safeText(raw.statusHint);
        const base = {
            sourceType: 'longma',
            sourceLabel: 'Hải Đường',
            titleCn,
            authorCn,
            descCn,
            tags: Array.from(new Set(tags)),
            categories: Array.from(new Set(categories)),
            coverUrl: T.safeText(raw.coverUrl),
            statusHint,
            update_status: undefined,
            extraKeywords,
        };
        return attachStatusInfo(base, {
            explicitStates: [
                statusStateFromText(statusHint),
            ],
            hintTexts: [statusHint],
            fallbackTexts: [
                T.safeText(raw.metaLine),
                tags.join(','),
                categories.join(','),
                extraKeywords.join(','),
            ],
        });
    }

    // --- GONGZICP ---
    function fetchGongzicpData(novelId) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://gongzicp.com/webapi/novel/novelInfo?id=${novelId}`,
                headers: {
                    'Referer': 'https://gongzicp.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                onload: (response) => {
                    if (response.status === 200) {
                        try {
                            const json = JSON.parse(response.responseText);
                            if (json.code === 200 && json.data) {
                                resolve(json.data);
                            } else {
                                reject(new Error('Gongzicp Error: ' + (json.msg || 'Unknown')));
                            }
                        } catch (e) {
                            reject(e);
                        }
                    } else {
                        reject(new Error('Gongzicp HTTP ' + response.status));
                    }
                },
                onerror: (err) => reject(err)
            });
        });
    }

    function normalizeGongzicpData(data) {
        let update_status = '';
        const process = data.novel_process || '';
        if (process === '完结') update_status = 1;
        else if (process === '连载') update_status = 0;

        const tags = Array.isArray(data.tag_list) ? data.tag_list : [];
        const categories = Array.isArray(data.type_list) ? data.type_list : [];
        const base = {
            titleCn: data.novel_name || '',
            authorCn: data.author_nickname || '',
            descCn: T.htmlToText(data.novel_info || ''),
            tags,
            categories,
            coverUrl: data.novel_cover || '',
            statusHint: process,
            update_status: update_status,
            sourceType: 'gongzicp',
            sourceLabel: 'Trường Bội'
        };
        return attachStatusInfo(base, {
            explicitStates: [
                mapStatusCode(update_status, { '0': STATUS_STATES.ONGOING, '1': STATUS_STATES.COMPLETED }),
            ],
            hintTexts: [process],
            fallbackTexts: [tags.join(','), categories.join(',')],
        });
    }

    function getGroupOptions() {
        const groups = {
            status: [],
            official: [],
            gender: [],
            age: [],
            ending: [],
            genre: [],
            tag: [],
        };
        const inputs = Array.from(document.querySelectorAll('.book-attr-group input[name]'));
        inputs.forEach((input) => {
            const name = input.getAttribute('name');
            if (!groups[name]) return;
            const labelEl = document.querySelector(`label[for="${input.id}"]`);
            const label = labelEl ? labelEl.textContent.trim() : '';
            groups[name].push({ input, label });
        });
        return groups;
    }

    // ================================================
    // TRANSLATE + NAMESET
    // ================================================
    function splitIntoBatches(arr, maxChars) {
        const batches = [];
        let current = [];
        let currentLen = 0;
        for (const s of arr) {
            const len = (s || '').length;
            if (current.length && currentLen + len + current.length > maxChars) {
                batches.push(current);
                current = [s];
                currentLen = len;
            } else {
                current.push(s);
                currentLen += len;
            }
        }
        if (current.length) batches.push(current);
        return batches;
    }

    function postTranslate(serverUrl, contentArray, targetLang) {
        return new Promise((resolve, reject) => {
            const payload = { content: JSON.stringify(contentArray), tl: targetLang };
            GM_xmlhttpRequest({
                method: 'POST',
                url: serverUrl,
                headers: { 'Content-Type': 'application/json', 'referer': 'https://dichngay.com/' },
                data: JSON.stringify(payload),
                onload(res) {
                    if (res.status < 200 || res.status >= 300) {
                        reject(new Error('HTTP Error: ' + res.status));
                        return;
                    }
                    try {
                        const jsonResponse = JSON.parse(res.responseText);
                        const translatedContentString = jsonResponse?.data?.content ?? jsonResponse?.translatedText;
                        if (typeof translatedContentString !== 'string') {
                            throw new Error('Bad translation response.');
                        }
                        const sanitizedString = translatedContentString
                            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
                            .replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
                        resolve(JSON.parse(sanitizedString));
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    function postTranslateSingle(serverUrl, contentText, targetLang) {
        return new Promise((resolve, reject) => {
            const payload = { content: (contentText || '').toString(), tl: targetLang };
            GM_xmlhttpRequest({
                method: 'POST',
                url: serverUrl,
                headers: { 'Content-Type': 'application/json', 'referer': 'https://dichngay.com/' },
                data: JSON.stringify(payload),
                onload(res) {
                    if (res.status < 200 || res.status >= 300) {
                        reject(new Error('HTTP Error: ' + res.status));
                        return;
                    }
                    try {
                        const jsonResponse = JSON.parse(res.responseText || '{}');
                        let value = jsonResponse?.data?.content ?? jsonResponse?.translatedText ?? '';
                        if (typeof value !== 'string') {
                            throw new Error('Bad translation response.');
                        }
                        value = value
                            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
                            .replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
                        // Some modes may still return JSON string form.
                        if (value.startsWith('["') || value.startsWith('[')) {
                            try {
                                const parsed = JSON.parse(value);
                                if (Array.isArray(parsed)) {
                                    resolve((parsed[0] || '').toString());
                                    return;
                                }
                                if (typeof parsed === 'string') {
                                    resolve(parsed);
                                    return;
                                }
                            } catch {
                                // keep raw value
                            }
                        }
                        resolve(value);
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    HELPERS.http = { postTranslate, postTranslateSingle };

    async function translateList(list) {
        const items = Array.isArray(list) ? list : [];
        const batches = splitIntoBatches(items, MAX_CHARS);
        const result = [];
        for (const batch of batches) {
            try {
                const translated = await postTranslate(SERVER_URL, batch, 'vi');
                result.push(...translated);
            } catch (err) {
                logUi(`Dịch batch lỗi, thử lại từng đoạn: ${err.message || err}`, 'warn');
                for (const item of batch) {
                    try {
                        const translatedSingle = await postTranslateSingle(SERVER_URL, item, 'vi');
                        result.push(translatedSingle || item);
                    } catch (singleErr) {
                        logUi(`Dịch từng đoạn vẫn lỗi, giữ nguyên text: ${singleErr.message || singleErr}`, 'warn');
                        result.push(item);
                    }
                    await sleep(REQUEST_DELAY_MS);
                }
                continue;
            }
            await sleep(REQUEST_DELAY_MS);
        }
        return result;
    }

    async function translateLongText(text) {
        const raw = T.safeText(text);
        if (!raw) return '';
        if (raw.length <= MAX_CHARS) {
            const [translated] = await translateList([raw]);
            return translated || raw;
        }
        const parts = raw.split(/\n{2,}/g).map(s => s.trim()).filter(Boolean);
        const translatedParts = await translateList(parts);
        return translatedParts.join('\n\n');
    }

    function buildTaggedDescForTranslate(descCn, tags, enabled = true) {
        const base = T.safeText(descCn);
        if (!enabled) return base;
        const tagList = Array.isArray(tags)
            ? tags.map((t) => T.safeText(t)).filter(Boolean)
            : [];
        if (!tagList.length) return base;
        const line = `Nhãn: ${tagList.join(', ')}`;
        return base ? `${line}\n\n${base}` : line;
    }

    function stripTaggedDescLine(text) {
        const raw = (text || '').toString();
        return raw.replace(/^\s*(Nhãn|Nhan|Tags?)\s*[:：].*(?:\r?\n)?/i, '').trim();
    }

    async function translateQuickText(text, mode) {
        const raw = (text || '').toString();
        if (!raw.trim()) return '';
        const tl = T.safeText(mode || 'vi').toLowerCase();
        if (tl === 'vi') {
            const [translated] = await translateList([raw]);
            return translated || raw;
        }
        if (!['hv', 'si', 'tr'].includes(tl)) {
            throw new Error('Chế độ dịch không hỗ trợ.');
        }
        const out = await postTranslateSingle(SERVER_URL, raw, tl);
        return out || raw;
    }

    function stripAiNameCn(text) {
        return T.safeText(text)
            .replace(/[（(][^（）()]*[）)]/g, '')
            .replace(/^[\s"'“”‘’《》【】\[\],，、;；:：|]+|[\s"'“”‘’《》【】\[\],，、;；:：|]+$/g, '')
            .trim();
    }

    function isCjkNameText(text) {
        const raw = T.safeText(text);
        return !!raw
            && /[\u3400-\u9FFF\uF900-\uFAFF]/.test(raw)
            && !/[A-Za-zÀ-ỹ]/.test(raw)
            && /^[\s\u3400-\u9FFF\uF900-\uFAFF·・々〇零一二三四五六七八九十百千万亿兩两]+$/.test(raw);
    }

    function titleCaseVietnameseWord(word) {
        const raw = T.safeText(word);
        if (!raw) return '';
        const lower = raw.toLocaleLowerCase('vi-VN');
        return lower.charAt(0).toLocaleUpperCase('vi-VN') + lower.slice(1);
    }

    function lowerVietnameseWord(word) {
        return T.safeText(word).toLocaleLowerCase('vi-VN');
    }

    function getWordCapitalizationPattern(text) {
        const words = T.safeText(text).split(/\s+/).filter(Boolean);
        if (!words.length) return [];
        return words.map((word) => {
            const letter = word.match(/\p{L}/u)?.[0] || '';
            return !!letter && letter === letter.toLocaleUpperCase('vi-VN') && letter !== letter.toLocaleLowerCase('vi-VN');
        });
    }

    function normalizeAiCaps(value) {
        if (!Array.isArray(value)) return [];
        return value
            .map((item) => {
                if (typeof item === 'boolean') return item;
                const norm = T.normalizeText(item);
                if (['1', 'true', 'yes', 'y', 'hoa', 'viet hoa', 'upper', 'cap'].includes(norm)) return true;
                if (['0', 'false', 'no', 'n', 'thuong', 'lower'].includes(norm)) return false;
                return null;
            })
            .filter(item => item !== null);
    }

    function normalizeAiCaseStyle(value) {
        const norm = T.normalizeText(value);
        if (!norm) return '';
        if (/(title|proper|name|all|viet hoa het|hoa het)/.test(norm)) return 'title';
        if (/(phrase|common|generic|lower|sentence|cum|cụm|thuong|viet hoa dau|hoa dau)/.test(norm)) return 'phrase';
        if (/(keep|foreign|ngoai|latin)/.test(norm)) return 'keep';
        return '';
    }

    function inferHanVietCaseStyle(cn, words, candidate) {
        if (candidate?.caps?.length === words.length) return '';
        const aiPattern = getWordCapitalizationPattern(candidate?.vi || '');
        if (aiPattern.length === words.length) return '';
        if (aiPattern.length > 1 && aiPattern[0] && aiPattern.slice(1).every(item => !item)) return 'phrase';
        if (aiPattern.length > 1 && aiPattern.every(Boolean)) return 'title';
        if (/(?:家|族|氏|大陆|大陸|世界|学院|學院|学校|學校|帝国|帝國|王国|王國)$/.test(T.safeText(cn))) {
            return 'phrase';
        }
        return 'title';
    }

    function applyCapitalization(words, pattern) {
        return words.map((word, idx) => {
            return pattern[idx] ? titleCaseVietnameseWord(word) : lowerVietnameseWord(word);
        });
    }

    function formatHanVietName(cn, hv, candidate = {}) {
        const raw = T.safeText(hv)
            .replace(/[|/]+/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/[.,;:!?]+$/g, '')
            .trim();
        if (!raw) return '';
        const words = raw.split(/\s+/).filter(Boolean);
        if (!words.length) return '';

        if (candidate.caps?.length === words.length) {
            return applyCapitalization(words, candidate.caps).join(' ');
        }

        if (candidate.caseStyle === 'phrase') {
            return words
                .map((word, idx) => idx === 0 ? titleCaseVietnameseWord(word) : lowerVietnameseWord(word))
                .join(' ');
        }
        if (candidate.caseStyle === 'title') {
            return words.map(titleCaseVietnameseWord).join(' ');
        }
        if (candidate.caseStyle === 'keep') return raw;

        const aiPattern = getWordCapitalizationPattern(candidate.vi || '');
        if (aiPattern.length === words.length) {
            return applyCapitalization(words, aiPattern).join(' ');
        }

        const caseStyle = inferHanVietCaseStyle(cn, words, candidate);
        if (caseStyle === 'phrase') {
            return words
                .map((word, idx) => idx === 0 ? titleCaseVietnameseWord(word) : lowerVietnameseWord(word))
                .join(' ');
        }
        return words.map(titleCaseVietnameseWord).join(' ');
    }

    function normalizeAiNameCandidate(item) {
        if (!item || typeof item !== 'object') return null;
        const cn = stripAiNameCn(item.cn || item.zh || item.chinese || item.orig || item.name || '');
        const vi = T.safeText(item.vi || item.hv || item.hanviet || item.vn || item.trans || item.translation || '');
        const origin = T.safeText(item.origin || item.kind || item.type || item.script || item.mode || '').toLowerCase();
        const caseStyle = normalizeAiCaseStyle(item.case || item.caseStyle || item.casing || item.capitalization || item.nameCase || '');
        const caps = normalizeAiCaps(item.caps || item.cap || item.capitalize || item.capitalized || item.uppercase || []);
        if (!cn) return null;
        return { cn, vi, origin, caseStyle, caps };
    }

    function looksLikeForeignAiName(vi) {
        const raw = T.safeText(vi);
        if (!raw) return false;
        if (/[À-ỹĂăÂâĐđÊêÔôƠơƯư]/.test(raw)) return false;
        const words = raw.split(/\s+/).filter(Boolean);
        return words.length > 0
            && words.length <= 2
            && /^[A-Za-z][A-Za-z'’.-]*(?:\s+[A-Za-z][A-Za-z'’.-]*)?$/.test(raw);
    }

    function shouldUseHanVietForAiName(candidate) {
        if (!candidate || !isCjkNameText(candidate.cn)) return false;
        const origin = T.normalizeText(candidate.origin || '');
        if (/(foreign|ngoai|nhat|japan|korea|han quoc|english|latin|western|non chinese|nonchinese|phien am)/.test(origin)) {
            return false;
        }
        if (/(hanviet|han viet|han tu|chinese|trung quoc|hv|viet)/.test(origin)) {
            return true;
        }
        return !looksLikeForeignAiName(candidate.vi);
    }

    async function translateHanVietList(list) {
        const items = Array.isArray(list) ? list.map(stripAiNameCn).filter(Boolean) : [];
        const result = new Map();
        const batches = splitIntoBatches(items, MAX_CHARS);
        for (const batch of batches) {
            try {
                const translated = await postTranslate(SERVER_URL, batch, 'hv');
                if (!Array.isArray(translated)) throw new Error('Bad Hán Việt response.');
                batch.forEach((item, idx) => {
                    result.set(item, T.safeText(translated[idx] || item));
                });
            } catch (err) {
                logUi(`Dịch Hán Việt batch lỗi, thử từng name: ${err.message || err}`, 'warn');
                for (const item of batch) {
                    try {
                        const translatedSingle = await postTranslateSingle(SERVER_URL, item, 'hv');
                        result.set(item, T.safeText(translatedSingle || item));
                    } catch (singleErr) {
                        logUi(`Dịch Hán Việt name lỗi, giữ bản AI: ${item} (${singleErr.message || singleErr})`, 'warn');
                    }
                    await sleep(REQUEST_DELAY_MS);
                }
            }
            await sleep(REQUEST_DELAY_MS);
        }
        return result;
    }

    async function normalizeAiExtractedNames(rawNames) {
        const candidates = (Array.isArray(rawNames) ? rawNames : [])
            .map(normalizeAiNameCandidate)
            .filter(Boolean);
        if (!candidates.length) return [];

        const seen = new Set();
        const deduped = [];
        for (const candidate of candidates) {
            if (seen.has(candidate.cn)) continue;
            seen.add(candidate.cn);
            deduped.push(candidate);
        }

        const hvNames = deduped
            .filter(shouldUseHanVietForAiName)
            .map(item => item.cn);
        const hvMap = hvNames.length ? await translateHanVietList(hvNames) : new Map();

        return deduped
            .map((item) => {
                const hv = hvMap.get(item.cn);
                const vi = hv ? formatHanVietName(item.cn, hv, item) : T.safeText(item.vi);
                return { cn: item.cn, vi };
            })
            .filter(item => item.cn && item.vi);
    }

    async function translateTextWithNameSet(text, nameSet, preserveLineBreaks) {
        const raw = T.safeText(text);
        if (!raw) return '';
        const nameMap = nameSet || {};
        const nameReplacer = buildNameSetReplacer(nameMap);
        const placeholderMap = {};
        const processed = nameReplacer(raw, placeholderMap);
        let translated = '';
        if (preserveLineBreaks) {
            const lines = processed.replace(/\r\n/g, '\n').split('\n');
            const translatedLines = await translateList(lines);
            translated = translatedLines.join('\n');
        } else if (processed.length <= MAX_CHARS) {
            const [result] = await translateList([processed]);
            translated = result || processed;
        } else {
            translated = await translateLongText(processed);
        }
        const restored = Object.keys(placeholderMap).length ? restoreNames(translated, placeholderMap) : translated;
        return cleanupText(restored, preserveLineBreaks);
    }

    // ================================================
    // MATCH + SUGGEST + APPLY
    // ================================================
    function buildKeywordList(sourceData, translated) {
        const rawList = []
            .concat(sourceData?.tags || [])
            .concat(sourceData?.categories || [])
            .concat(sourceData?.extraKeywords || []);
        const translatedList = translated?.tags || [];
        const translatedCats = translated?.categories || [];
        const combined = expandKeywordAliases([...rawList, ...translatedList, ...translatedCats])
            .map(T.safeText)
            .filter(Boolean);
        return Array.from(new Set(combined));
    }

    function expandKeywordAliases(list) {
        const expanded = [];
        for (const item of list || []) {
            const text = T.safeText(item);
            if (!text) continue;
            expanded.push(text);
            const norm = T.normalizeText(text);
            const tokens = T.splitTokens(norm);
            if (norm.includes('主受') || norm.includes('chu chiu')) {
                expanded.push('Chủ thụ');
            }
            if (norm.includes('互攻') || norm.includes('ho cong')) {
                expanded.push('Hỗ công');
            }
            if (norm.includes('纯爱') || norm.includes('thuan ai')) {
                expanded.push('Đam mỹ');
            }
            if (tokens.includes('bg')) {
                expanded.push('Ngôn tình');
            }
            if (tokens.includes('bl')) {
                expanded.push('Đam mỹ');
            }
            if (norm.includes('xuyen qua')) {
                expanded.push('Xuyên việt');
            }
            if (norm.includes('架空历史') || /(gia tuong lich su|lich su gia tuong|alternate history)/.test(norm)) {
                expanded.push('Giả tưởng lịch sử');
            }
            if (norm.includes('年代文') || /\b(nian dai wen|nien dai van)\b/.test(norm)) {
                expanded.push('Niên đại văn');
            }
        }
        return expanded;
    }

    function detectStatus(raw, textBlob) {
        if (raw?.statusInfo?.label) return raw.statusInfo.label;
        const fallback = resolveStatusInfo({
            sourceType: raw?.sourceType || '',
            explicitStates: [
                mapStatusCode(raw?.update_status, { '0': STATUS_STATES.ONGOING, '1': STATUS_STATES.COMPLETED }),
                statusStateFromBoolish(raw?.isFinished, true),
                statusStateFromBoolish(raw?.is_finished, true),
            ],
            hintTexts: [raw?.statusHint],
            fallbackTexts: [textBlob],
        });
        return fallback.label;
    }

    function pickStatusOptionByState(statusOptions, state) {
        const options = Array.isArray(statusOptions) ? statusOptions : [];
        if (!options.length || !state) return null;
        const completedPattern = /(hoan thanh|ket thuc|da xong|completed|finished|完结|完本|已完结|已完結)/;
        const ongoingPattern = /(con tiep|dang cap nhat|dang ra|chua hoan|ongoing|serial|连载|連載|更新中|未完结|未完結)/;
        const pattern = state === STATUS_STATES.COMPLETED ? completedPattern : ongoingPattern;
        return options.find(opt => pattern.test(T.normalizeText(opt?.label || ''))) || null;
    }

    function resolveStatusSelection(statusOptions, sourceData, detectedLabel) {
        const options = Array.isArray(statusOptions) ? statusOptions : [];
        if (!options.length) return '';

        const fromState = pickStatusOptionByState(options, sourceData?.statusState);
        if (fromState) return fromState.label;

        const detectedNorm = T.normalizeText(detectedLabel || '');
        if (detectedNorm) {
            const exact = options.find(opt => T.normalizeText(opt?.label || '') === detectedNorm);
            if (exact) return exact.label;
            if (/(hoan thanh|ket thuc|da xong|completed|finished|完结|完本|已完结|已完結)/.test(detectedNorm)) {
                const completedOpt = pickStatusOptionByState(options, STATUS_STATES.COMPLETED);
                if (completedOpt) return completedOpt.label;
            }
        }

        const ongoingOpt = pickStatusOptionByState(options, STATUS_STATES.ONGOING);
        if (ongoingOpt) return ongoingOpt.label;
        return options[0]?.label || '';
    }

    function detectOfficial(keywords) {
        const blob = T.normalizeText(keywords.join(' '));
        if (/(dong nhan|dien sinh|衍生|同人|二創|二创)/.test(blob)) return 'Diễn sinh';
        return 'Nguyên sang';
    }

    function detectGender(keywords, sourceType) {
        const blob = T.normalizeText(keywords.join(' '));
        if (sourceType === 'po18') {
            const hasBach = /\bgl\b/.test(blob) || /\bfuta\b/.test(blob) || /百合/.test(blob);
            const hasDam = /\bbl\b/.test(blob) || /耽美/.test(blob);
            const hasNgon = /\bbg\b/.test(blob);
            const picked = [hasBach, hasDam, hasNgon].filter(Boolean).length;
            if (picked >= 2) return 'Đa nguyên';
            if (hasBach) return 'Bách hợp';
            if (hasDam) return 'Đam mỹ';
            return 'Ngôn tình';
        }
        if (/(男男|耽美)/.test(blob) || /\bbl\b/.test(blob)) return 'Đam mỹ';
        if (/(女女|百合)/.test(blob) || /\bgl\b/.test(blob)) return 'Bách hợp';
        if (/(男女|言情)/.test(blob) || /\bbg\b/.test(blob)) return 'Ngôn tình';
        if (/(song nam chu|双男主)/.test(blob)) return 'Đam mỹ';
        if (/(纯爱|thuan ai)/.test(blob)) return 'Đam mỹ';
        if (/(bach hop|百合|双女主)/.test(blob)) return 'Bách hợp';
        if (/(nu ton|女尊)/.test(blob)) return 'Nữ tôn';
        if (/(khong cp|无cp|无 c p)/.test(blob)) return 'Không CP';
        if (/(ngon tinh|言情|nu ph|女频)/.test(blob)) return 'Ngôn tình';
        if (/(nam sinh|男频|男主)/.test(blob)) return 'Nam sinh';
        return '';
    }

    function hasXuyenNhanh(textOrList) {
        const blob = Array.isArray(textOrList)
            ? T.normalizeText(textOrList.join(' '))
            : T.normalizeText(textOrList || '');
        return /(xuyen nhanh|快穿)/.test(blob);
    }

    function buildClassificationSignal(sourceData, translated, extraValues = []) {
        const parts = []
            .concat(sourceData?.titleCn || [])
            .concat(sourceData?.authorCn || [])
            .concat(sourceData?.descCn || [])
            .concat(sourceData?.tags || [])
            .concat(sourceData?.categories || [])
            .concat(translated?.titleVi || [])
            .concat(stripTaggedDescLine(translated?.desc || ''))
            .concat(translated?.tags || [])
            .concat(translated?.categories || [])
            .concat(extraValues || [])
            .map(T.safeText)
            .filter(Boolean);
        const raw = parts.join('\n');
        return {
            raw,
            norm: T.normalizeText(raw),
            keep: normalizeKeepAccents(raw),
        };
    }

    function signalHasAny(signal, patterns) {
        const variants = [signal?.raw || '', signal?.norm || '', signal?.keep || ''];
        return (patterns || []).some((pattern) => {
            if (!(pattern instanceof RegExp)) return false;
            pattern.lastIndex = 0;
            return variants.some((value) => {
                pattern.lastIndex = 0;
                return pattern.test(value);
            });
        });
    }

    function findOptionLabelByPatterns(options, patterns) {
        const list = Array.isArray(options) ? options : [];
        return (list.find((opt) => {
            const label = T.safeText(opt?.label || opt);
            if (!label) return false;
            const signal = {
                raw: label,
                norm: T.normalizeText(label),
                keep: normalizeKeepAccents(label),
            };
            return signalHasAny(signal, patterns);
        }) || {}).label || '';
    }

    function injectPreferredLabels(list, preferredLabels, conflictPatterns) {
        const current = Array.isArray(list) ? list.map((item) => T.safeText(item)).filter(Boolean) : [];
        const preferred = Array.isArray(preferredLabels) ? preferredLabels.map((item) => T.safeText(item)).filter(Boolean) : [];
        if (!preferred.length) return current;
        const preferredSet = new Set(preferred.map((item) => T.normalizeText(item)));
        const cleaned = current.filter((item) => {
            const normalized = T.normalizeText(item);
            if (preferredSet.has(normalized)) return false;
            if (!conflictPatterns || !conflictPatterns.length) return true;
            const signal = { raw: item, norm: normalized, keep: normalizeKeepAccents(item) };
            return !signalHasAny(signal, conflictPatterns);
        });
        return [...preferred, ...cleaned];
    }

    function boostScoredOptions(scored, preferredLabels, boostedScore = 2.1) {
        const preferred = new Set((preferredLabels || []).map((label) => T.normalizeText(label)).filter(Boolean));
        if (!preferred.size) return scored;
        return scored
            .map((opt) => {
                const normalized = T.normalizeText(opt?.label || '');
                if (!preferred.has(normalized)) return opt;
                return { ...opt, score: Math.max(opt.score || 0, boostedScore) };
            })
            .sort((a, b) => b.score - a.score);
    }

    function detectPreferredAgeLabel(signal, ageOptions) {
        const nearModernPatterns = [
            /民国/i,
            /dân quốc/i,
            /dan quoc/i,
            /一战|二战|第一次世界大战|第二次世界大战/i,
            /\bwwi\b/i,
            /\bwwii\b/i,
            /world war\s*(?:1|2|i|ii)/i,
            /thế chiến\s*(?:1|2|i|ii)/i,
            /the chien\s*(?:1|2|i|ii)/i,
            /phương tây.{0,20}thế kỷ\s*(?:19|xix)/i,
            /phuong tay.{0,20}(?:the ky|the ki)\s*(?:19|xix)/i,
            /\bwestern\b.{0,20}(?:19th century|xix)/i,
            /\bvictorian\b/i,
            /\bedwardian\b/i,
        ];
        const nienDaiPatterns = [
            /年代文/i,
            /\bnian dai wen\b/i,
            /\bnien dai van\b/i,
        ];
        const modernPatterns = [
            /现代/i,
            /hiện đại/i,
            /hien dai/i,
            ...nienDaiPatterns,
        ];
        const nearModernLabel = findOptionLabelByPatterns(ageOptions, [/(^| )can dai($| )/i]);
        const modernLabel = findOptionLabelByPatterns(ageOptions, [/(^| )hien dai($| )/i]);
        const hasNearModernSignal = signalHasAny(signal, nearModernPatterns);
        if (hasNearModernSignal && nearModernLabel) return nearModernLabel;
        if (signalHasAny(signal, modernPatterns) && modernLabel) return modernLabel;
        return '';
    }

    function detectPreferredAltHistoryLabel(signal, options) {
        const altHistoryPatterns = [
            /架空历史/i,
            /\balternate history\b/i,
            /giả tưởng lịch sử/i,
            /gia tuong lich su/i,
            /lịch sử giả tưởng/i,
            /lich su gia tuong/i,
        ];
        if (!signalHasAny(signal, altHistoryPatterns)) return '';
        return findOptionLabelByPatterns(options, [
            /gia tuong.*lich su/i,
            /lich su.*gia tuong/i,
            /\balternate history\b/i,
        ]);
    }

    function normalizeKeepAccents(text = '') {
        return text
            .toString()
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function calculateMatchScore(label, text, normText) {
        const labelNorm = T.normalizeText(label);
        const labelKeepAccents = normalizeKeepAccents(label);

        if (!labelNorm) return 0;

        const regexExact = new RegExp(`(^|\\s)${escapeRegExp(labelKeepAccents)}($|\\s)`, 'i');
        if (regexExact.test(text)) return 1.0;

        const regexNorm = new RegExp(`(^|\\s)${escapeRegExp(labelNorm)}($|\\s)`, 'i');
        if (regexNorm.test(normText)) return 0.9;

        if (normText.includes(labelNorm)) return 0.6;

        return 0;
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function scoreOptions(options, contexts) {
        // Contexts: [{ text, normText, weight }]
        return options.map(opt => {
            const label = T.safeText(opt.label);
            let maxScore = 0;

            for (const ctx of contexts) {
                const baseScore = calculateMatchScore(label, ctx.text, ctx.normText);
                const weightedScore = baseScore * ctx.weight;
                if (weightedScore > maxScore) maxScore = weightedScore;
            }

            return { ...opt, score: maxScore };
        }).sort((a, b) => b.score - a.score);
    }

    function filterSubstrings(items) {
        const sorted = [...items].sort((a, b) => {
            const lenA = T.normalizeText(a.label).length;
            const lenB = T.normalizeText(b.label).length;
            return lenB - lenA;
        });
        const accepted = [];
        for (const item of sorted) {
            const label = T.normalizeText(item.label);
            const isRedundant = accepted.some(acc => T.normalizeText(acc.label).includes(label));
            if (!isRedundant) accepted.push(item);
        }
        return accepted;
    }

    function pickMulti(scored, limit, requireOne, collapseRoot, threshold) {
        const minScore = Number.isFinite(threshold) ? threshold : getScoreThreshold();
        let selected = scored.filter(o => o.score >= minScore);
        selected = filterSubstrings(selected);
        let picked = selected;
        if (!picked.length && requireOne && scored.length) {
            picked = [scored[0]];
        }
        if (collapseRoot) picked = collapseByRoot(picked);
        if (limit && picked.length > limit) picked = picked.slice(0, limit);
        return resolveNegationConflicts(picked.map(o => o.label));
    }

    function pickRadio(scored, requireOne, threshold) {
        if (!scored.length) return '';
        const best = scored[0];
        const minScore = Number.isFinite(threshold) ? threshold : getScoreThreshold();
        if (best.score >= minScore) return best.label;
        if (requireOne) return best.label;
        return '';
    }

    function buildSuggestions(sourceData, translated, groups) {
        const useDesc = shouldUseDescForSource(sourceData?.sourceType);

        const contexts = [];

        const keywordList = buildKeywordList(sourceData, translated);
        const classificationSignal = buildClassificationSignal(sourceData, translated, keywordList);
        const metaText = keywordList.join(' ');
        if (metaText) {
            contexts.push({
                text: normalizeKeepAccents(metaText),
                normText: T.normalizeText(metaText),
                weight: 1.5
            });
        }

        if (useDesc) {
            const descCn = T.safeText(sourceData.descCn);
            const descVi = T.safeText(translated?.desc || '');
            const descText = `${descCn} \n ${descVi}`;
            contexts.push({
                text: normalizeKeepAccents(descText),
                normText: T.normalizeText(descText),
                weight: 1.0
            });
        }

        const preferredAgeLabel = detectPreferredAgeLabel(classificationSignal, groups.age);
        const preferredGenreLabels = [];
        const preferredTagLabels = [];
        const preferredAltGenre = detectPreferredAltHistoryLabel(classificationSignal, groups.genre);
        const preferredAltTag = detectPreferredAltHistoryLabel(classificationSignal, groups.tag);
        if (preferredAltGenre) preferredGenreLabels.push(preferredAltGenre);
        if (preferredAltTag) preferredTagLabels.push(preferredAltTag);

        const getMulti = (group, limit, isMandatory, collapse) => {
            const preferredLabels = group === groups.age
                ? (preferredAgeLabel ? [preferredAgeLabel] : [])
                : (group === groups.genre ? preferredGenreLabels : (group === groups.tag ? preferredTagLabels : []));
            const scored = boostScoredOptions(scoreOptions(group, contexts), preferredLabels);
            return pickMulti(scored, limit, isMandatory, collapse);
        };

        const statusFallbackBlob = keywordList.join(' ');
        const statusLabel = detectStatus(sourceData, statusFallbackBlob);
        const statusSuggestion = resolveStatusSelection(groups.status, sourceData, statusLabel);
        const officialLabel = detectOfficial(keywordList);
        const genderLabel = detectGender(keywordList, sourceData?.sourceType);

        const boostDetect = (group, detectedLabel) => {
            if (!detectedLabel) return scoreOptions(group, contexts);
            return group.map(opt => {
                if (opt.label === detectedLabel) return { ...opt, score: 2.0 };
                return { ...opt, score: 0 };
            }).sort((a, b) => b.score - a.score);
        };

        const threshold = getScoreThreshold();

        const allowMultiEnding = hasXuyenNhanh(keywordList);

        return {
            status: statusSuggestion,
            official: pickRadio(boostDetect(groups.official, officialLabel), true, threshold),
            gender: pickRadio(boostDetect(groups.gender, genderLabel), false, threshold),

            age: getMulti(groups.age, 4, true, false),
            ending: getMulti(groups.ending, allowMultiEnding ? 3 : 1, true, false),
            genre: getMulti(groups.genre, 8, true, false),
            tag: getMulti(groups.tag, MAX_TAGS_SELECT, true, true),
        };
    }

    function setInputValue(el, value) {
        if (!el) return;
        el.value = value || '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Tự xuống dòng ở cuối câu nếu văn án bị dính chùm (không có newline)
    function autoBreakLongDesc(text) {
        if (!text || typeof text !== 'string') return text || '';
        if (text.includes('\n')) return text;
        if (text.length <= 100) return text;
        return text.replace(/([.。!?！？])\s*/g, '$1\n').trim();
    }

    function setMoreLink(desc, url) {
        const linkInputs = Array.from(document.querySelectorAll('input[name="moreLinkUrl"]'));
        const descInputs = Array.from(document.querySelectorAll('input[name="moreLinkDesc"]'));
        if (!linkInputs.length || !descInputs.length || !url) return;
        const idx = 0;
        setInputValue(linkInputs[idx], url);
        setInputValue(descInputs[idx], desc || '');
    }

    function applyRadio(group, label) {
        if (!group || !label) return;
        const ctx = { text: label, normText: T.normalizeText(label), weight: 1.0 };
        const scored = scoreOptions(group, [ctx]);
        const best = scored[0];
        if (!best) return;
        best.input.checked = true;
        best.input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function applyCheckboxes(group, labels) {
        if (!group || !Array.isArray(labels)) return;
        group.forEach(opt => {
            opt.input.checked = false;
            opt.input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        for (const label of labels) {
            const ctx = { text: label, normText: T.normalizeText(label), weight: 1.0 };
            const scored = scoreOptions(group, [ctx]);
            const best = scored[0];
            if (!best || best.score < SCORE_FALLBACK) continue;
            best.input.checked = true;
            best.input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    function parseLabelList(text) {
        return T.safeText(text)
            .split(/[,\n，]+/)
            .map(s => s.trim())
            .filter(Boolean);
    }

    function fetchCoverBlob(url) {
        return requestCoverWithFallback({
            method: 'GET',
            url,
            responseType: 'blob',
            validateResponse: (res) => res.status >= 200 && res.status < 300,
            errorMessage: 'Khong tai duoc anh bia.',
        }).then((res) => res.response);
    }

    function loadImageFromBlob(blob) {
        return new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Không đọc được ảnh bìa.'));
            };
            img.src = objectUrl;
        });
    }

    function toAbsoluteUrl(url, baseUrl) {
        const raw = T.safeText(url);
        if (!raw) return '';
        try {
            return new URL(raw, baseUrl || location.origin).href;
        } catch {
            return raw;
        }
    }

    async function buildCoverAverageHash(url) {
        const absoluteUrl = toAbsoluteUrl(url);
        if (!absoluteUrl) throw new Error('Thiếu URL ảnh để so khớp.');
        if (coverHashCache.has(absoluteUrl)) return coverHashCache.get(absoluteUrl);
        const task = (async () => {
            const blob = await fetchCoverBlob(absoluteUrl);
            const img = await loadImageFromBlob(blob);
            const canvas = document.createElement('canvas');
            canvas.width = COVER_HASH_SIZE;
            canvas.height = COVER_HASH_SIZE;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) throw new Error('Không tạo được canvas để so khớp ảnh.');
            ctx.drawImage(img, 0, 0, COVER_HASH_SIZE, COVER_HASH_SIZE);
            const pixels = ctx.getImageData(0, 0, COVER_HASH_SIZE, COVER_HASH_SIZE).data;
            const gray = [];
            let total = 0;
            for (let i = 0; i < pixels.length; i += 4) {
                const value = Math.round((pixels[i] * 0.299) + (pixels[i + 1] * 0.587) + (pixels[i + 2] * 0.114));
                gray.push(value);
                total += value;
            }
            const avg = total / gray.length;
            return gray.map((value) => (value >= avg ? 1 : 0));
        })();
        coverHashCache.set(absoluteUrl, task);
        return task;
    }

    function compareCoverHashes(hashA, hashB) {
        const a = Array.isArray(hashA) ? hashA : [];
        const b = Array.isArray(hashB) ? hashB : [];
        const size = Math.min(a.length, b.length);
        if (!size) return 0;
        let same = 0;
        for (let i = 0; i < size; i++) {
            if (a[i] === b[i]) same++;
        }
        return same / size;
    }

    function normalizeTitleForCompare(text) {
        return T.normalizeText(text || '')
            .replace(/[^a-z0-9]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function tokenizeTitleForCompare(text) {
        return normalizeTitleForCompare(text).split(' ').filter(Boolean);
    }

    function computeTokenLcsLength(a, b) {
        const rows = a.length + 1;
        const cols = b.length + 1;
        const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));
        for (let i = 1; i < rows; i++) {
            for (let j = 1; j < cols; j++) {
                dp[i][j] = a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1] + 1
                    : Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
        return dp[a.length][b.length];
    }

    function computeTitleSimilarity(sourceTitle, candidateTitle) {
        const sourceNorm = normalizeTitleForCompare(sourceTitle);
        const candidateNorm = normalizeTitleForCompare(candidateTitle);
        if (!sourceNorm || !candidateNorm) {
            return {
                score: 0,
                exact: false,
                nearContained: false,
                sourceContainedInCandidate: false,
                containRatio: 0,
                sourceCoverage: 0,
                candidateCoverage: 0,
            };
        }
        const sourceCompact = sourceNorm.replace(/\s+/g, '');
        const candidateCompact = candidateNorm.replace(/\s+/g, '');
        const exact = sourceCompact === candidateCompact;
        const sourceContainedInCandidate = !exact && candidateCompact.includes(sourceCompact);
        const candidateContainedInSource = !exact && sourceCompact.includes(candidateCompact);
        const containRatio = sourceContainedInCandidate && candidateCompact.length
            ? sourceCompact.length / candidateCompact.length
            : (candidateContainedInSource && sourceCompact.length ? candidateCompact.length / sourceCompact.length : 0);
        const sourceTokens = tokenizeTitleForCompare(sourceTitle);
        const candidateTokens = tokenizeTitleForCompare(candidateTitle);
        const lcs = computeTokenLcsLength(sourceTokens, candidateTokens);
        const sourceCoverage = sourceTokens.length ? lcs / sourceTokens.length : 0;
        const candidateCoverage = candidateTokens.length ? lcs / candidateTokens.length : 0;
        const orderedScore = lcs / Math.max(sourceTokens.length || 1, candidateTokens.length || 1);
        let score = Math.max(orderedScore, (sourceCoverage * 0.72) + (candidateCoverage * 0.28));
        if (sourceContainedInCandidate) {
            score = Math.max(score, 0.78 + (containRatio * 0.22));
        } else if (candidateContainedInSource) {
            score = Math.max(score, 0.7 + (containRatio * 0.18));
        }
        if (exact) score = 1;
        const nearContained = exact || (
            sourceContainedInCandidate
            && sourceTokens.length >= 3
            && sourceCoverage >= 0.95
            && containRatio >= 0.72
        );
        return {
            score: Math.max(0, Math.min(1, score)),
            exact,
            nearContained,
            sourceContainedInCandidate,
            containRatio,
            sourceCoverage,
            candidateCoverage,
        };
    }

    function canvasToBlob(canvas, type, quality) {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Không thể xuất ảnh sau khi tối ưu.'));
                    return;
                }
                resolve(blob);
            }, type, quality);
        });
    }

    async function resizeCoverBlobToTarget(blob, width, height) {
        const targetW = Math.max(1, parseInt(width, 10) || 0);
        const targetH = Math.max(1, parseInt(height, 10) || 0);
        if (!targetW || !targetH) return blob;
        const img = await loadImageFromBlob(blob);
        const srcW = img.naturalWidth || img.width || 0;
        const srcH = img.naturalHeight || img.height || 0;
        if (!srcW || !srcH) return blob;

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return blob;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, targetW, targetH);

        // Force-stretch to exact target WxH (no crop).
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const sourceType = (blob.type || '').toLowerCase();
        const outputType = sourceType.startsWith('image/png') ? 'image/png'
            : (sourceType.startsWith('image/webp') ? 'image/webp' : 'image/jpeg');
        const quality = outputType === 'image/png' ? undefined : 0.95;
        return canvasToBlob(canvas, outputType, quality);
    }

    function mimeToExt(type) {
        const normalized = (type || '').toLowerCase().split(';')[0].trim();
        if (normalized === 'image/jpeg') return 'jpg';
        if (normalized === 'image/jpg') return 'jpg';
        if (normalized === 'image/webp') return 'webp';
        if (normalized === 'image/png') return 'png';
        if (normalized === 'image/gif') return 'gif';
        return 'jpg';
    }

    async function downscaleCoverBlobIfNeeded(blob, log) {
        if (!(blob instanceof Blob)) return blob;
        if (blob.size <= MAX_COVER_FILE_SIZE) return blob;
        const type = (blob.type || '').toLowerCase();
        if (!type.startsWith('image/')) return blob;

        const originalKb = Math.round(blob.size / 1024);
        log(`Ảnh bìa ${originalKb}KB > 500KB, đang tối ưu để giữ nét...`, 'warn');

        let img = null;
        try {
            img = await loadImageFromBlob(blob);
        } catch (err) {
            log('Không thể đọc ảnh để tối ưu, dùng ảnh gốc.', 'warn');
            return blob;
        }
        const originalWidth = img.naturalWidth || img.width || 0;
        const originalHeight = img.naturalHeight || img.height || 0;
        if (!originalWidth || !originalHeight) return blob;

        const minWidth = Math.max(1, Math.min(640, originalWidth));
        const minHeight = Math.max(1, Math.min(640, originalHeight));
        let width = originalWidth;
        let height = originalHeight;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return blob;

        let outputType = /png|gif|bmp/i.test(type) ? 'image/webp' : (type === 'image/webp' ? 'image/webp' : 'image/jpeg');
        let quality = outputType === 'image/png' ? undefined : 0.92;
        let best = blob;

        for (let i = 0; i < 10; i++) {
            canvas.width = Math.max(minWidth, Math.round(width));
            canvas.height = Math.max(minHeight, Math.round(height));
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            let candidate = null;
            try {
                candidate = await canvasToBlob(canvas, outputType, quality);
            } catch {
                break;
            }
            if (candidate.size < best.size) best = candidate;
            if (candidate.size <= MAX_COVER_FILE_SIZE) {
                const finalKb = Math.round(candidate.size / 1024);
                log(`Đã tối ưu ảnh bìa: ${originalKb}KB → ${finalKb}KB.`, 'ok');
                return candidate;
            }

            const ratio = Math.sqrt(MAX_COVER_FILE_SIZE / candidate.size);
            const scale = Math.max(0.72, Math.min(0.95, ratio * 0.98));
            const canShrink = canvas.width > minWidth || canvas.height > minHeight;
            if (canShrink) {
                width = Math.max(minWidth, Math.round(canvas.width * scale));
                height = Math.max(minHeight, Math.round(canvas.height * scale));
                continue;
            }
            if (typeof quality === 'number' && quality > 0.72) {
                quality = Math.max(0.72, quality - 0.06);
                continue;
            }
            if (outputType !== 'image/jpeg') {
                outputType = 'image/jpeg';
                quality = 0.84;
                continue;
            }
            break;
        }

        if (best.size < blob.size) {
            const bestKb = Math.round(best.size / 1024);
            log(`Đã tối ưu ảnh bìa xuống ${bestKb}KB (chưa dưới 500KB).`, 'warn');
            return best;
        }
        log('Không thể tối ưu ảnh bìa, giữ ảnh gốc.', 'warn');
        return blob;
    }

    async function applyCover(url, log) {
        const fileInput = document.querySelector('input[type="file"][data-change="changeCoverFile"]');
        if (!fileInput || !url) return;
        try {
            log('Đang tải ảnh bìa...');
            const sourceBlob = await fetchCoverBlob(url);
            let blob = sourceBlob;
            const targetSize = getCoverTargetSize(state.settings, getCurrentCoverScopeKey(state.sourceType));
            if (targetSize && targetSize.width && targetSize.height) {
                log(`Đang chỉnh tỷ lệ ảnh bìa về ${targetSize.width}x${targetSize.height}...`, 'info');
                blob = await resizeCoverBlobToTarget(blob, targetSize.width, targetSize.height);
            }
            blob = await downscaleCoverBlobIfNeeded(blob, log);
            const type = blob.type || sourceBlob.type || 'image/jpeg';
            const ext = mimeToExt(type);
            const file = new File([blob], 'cover.' + ext, { type });
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInput.files = dt.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            log('Đã gán ảnh bìa.');
        } catch (err) {
            log('Lỗi tải ảnh bìa: ' + err.message, 'error');
        }
    }

    // ================================================
    // HELP + CHANGELOG CONTENT
    // ================================================

const CHANGELOG_CONTENT = `
<h2><span style="color:#673ab7; font-size: 1.2em;">✨ Phiên bản 0.3.9.4</span></h2>
<ul style="list-style-type: none; padding-left: 0;">
    <li>🔤 <b>Viết hoa name thông minh hơn:</b> AI có thể trả cờ <code>case/caps</code>; name Hán vẫn lấy âm từ DichNgay nhưng giữ pattern viết hoa như <code>Lăng gia</code>. </li>
    <li>🈶 <b>Name Hán Việt ổn hơn:</b> AI chỉ đánh dấu name Hán/ngoại lai, còn name thuần Hán được kiểm lại bằng Hán Việt DichNgay trước khi ghi NameSet.</li>
    <li>🪄 <b>JJWXC mượt hơn:</b> Dùng api cũ hay mới tùy hoàn cảnh; nút <code>Old/New</code> vẫn giữ để đổi nhanh sau đó.</li>
    <li>⏱️ <b>Gemini rõ ràng hơn:</b> Mặc định ưu tiên <code>gemini-3-flash-preview</code>, có toast/log đếm thời gian và báo rõ khi AI đang chạy thinking mode.</li>
    <li>🏷️ <b>Tối ưu chọn nhãn:</b> Tinh chỉnh cả AI lẫn keyword cho <code>架空历史</code> → <b>Giả tưởng lịch sử</b>, và <code>年代文</code> ưu tiên <b>Hiện đại</b> thay vì <b>Cận đại</b></li>
    <li>🛡️ <b>Check trùng sâu hơn:</b> Thêm chỉ số độ an toàn, nút <code>Mở</code> tác giả, quét trang đầu tác giả và so ảnh bìa + tên để cảnh báo mềm khi nghi trùng.(v0.3.9.2)</li>
    <li>🖼️ <b>Fix ảnh bìa:</b> Do object của Fanqie không phải JSON sạch nên đổi khi bị fallback về DOM tĩnh, đã fix.(v0.3.9.3) </li>
</ul>

<h3 style="color:#ff9800; margin-top: 16px;">📦 Các bản trước (tóm tắt)</h3>
<ul style="list-style-type: none; padding-left: 0; font-size: 13px;">
    <li><b>v0.3.8:</b> Mô tả VI/ZH hai chiều, gán nhãn theo nguồn, popup chọn nhanh nhãn, popup không tự đóng, cover WxH theo nguồn, recompute thông minh hơn, bảng dịch nhanh mới.</li>
    <li><b>v0.3.7:</b> Fanqie chuyển parse web, sửa nhận diện trạng thái, chuẩn hóa cover origin.</li>
    <li><b>v0.3.6:</b> Loại trừ nâng cấp, check trùng mềm hơn, cập nhật domain Wikidich.</li>
    <li><b>v0.3.5:</b> Thêm nguồn Hải Đường Longma, parse trạng thái tập trung, AI không chọn trạng thái, ghi đè link bổ sung, nút fullscreen + phóng 1.5x.</li>
    <li><b>v0.3.4:</b> Cải thiện PO18, check trùng truyện + khóa thao tác an toàn hơn, nâng toast/cover upload.</li>
    <li><b>v0.3.3:</b> Hotfix popup so sánh + tách riêng logic loại trừ giữa <code>/chinh-sua</code> và <code>/nhung-file</code>.</li>
    <li><b>v0.3.2:</b> Thêm AI thủ công, mở rộng hỗ trợ trang chỉnh sửa, cải thiện Qidian/Ihuaben.</li>
    <li><b>v0.3.1:</b> Auto tách names, gộp luồng AI, nâng chất lượng nhận diện status/tag.</li>
    <li><b>v0.3.0:</b> Nền tảng AI Gemini + bảng cấu hình nguồn + tối ưu đa nguồn dữ liệu.</li>
</ul>`;

    const buildSiteDisplayList = () => SITE_RULES.map(rule => rule.label || rule.name || rule.id).filter(Boolean).join(', ');
    const buildSiteOptionsHtml = () => SITE_RULES.map(rule => {
        const label = rule.label || rule.name || rule.id;
        const example = rule.urlExample || '';
        const display = rule.display || {};
        const emoji = display.emoji || '🔗';
        const bg = display.bg || '#f5f5f5';
        const border = display.border || '#90a4ae';
        const color = display.color || '#37474f';
        const note = display.note ? `<span style="font-size:11px; color:#444;">✨ ${display.note}</span>` : '';
        return `
            <div style="background: ${bg}; padding: 8px; border-radius: 6px; border-left: 3px solid ${border};">
                <strong style="color: ${color};">${emoji} ${label}</strong><br>
                ${example ? `<small style="color: #666;">• Link: <code>${example}</code></small><br>` : ''}
                ${note}
            </div>
        `;
    }).join('');

    const buildWelcomeContent = () => `
<h2 class="${APP_PREFIX}welcome-heading">🌸 Chào mừng đến với <span>Wikidich Autofill</span> 🌸</h2>
<p class="${APP_PREFIX}welcome-subtitle">Luồng mới gọn hơn: lấy dữ liệu nhanh, đối chiếu rõ, áp form an toàn.</p>

<div class="${APP_PREFIX}guide-box-green">
    <h3 style="margin-top:0; color:#2e7d32;">⚡ Luồng chuẩn (nhanh + an toàn)</h3>
    <ol style="margin-left: 15px; padding-left: 0;">
        <li><b>Bước 1:</b> Dán link nguồn hỗ trợ (${buildSiteDisplayList()}) rồi bấm <b style="color:#2196f3;">Lấy dữ liệu</b>.</li>
        <li><b>Bước 2:</b> Chờ fetch hoàn tất (trong lúc này nút <b>AI/Recompute/Áp vào form</b> sẽ tự khóa).</li>
        <li><b>Bước 3:</b> Kiểm tra thông tin và chỉnh tay nếu cần; mô tả có thể đổi nhanh bằng nút <b>VI/ZH</b>.</li>
        <li><b>Bước 4:</b> Dùng <b style="color:#7e57c2;">AI</b> hoặc <b style="color:#e91e63;">AI thủ công</b> để phân tích lại.</li>
        <li><b>Bước 5:</b> Nếu thấy cảnh báo đỏ "Đã thay đổi..." thì bấm <b>Recompute</b> để đồng bộ lại kết quả.</li>
        <li><b>Bước 6:</b> Bấm <b style="color:#ff9800;">Áp vào form</b>, xem popup so sánh và xác nhận.</li>
    </ol>
</div>

<div class="${APP_PREFIX}guide-box-blue">
    <h3 style="margin-top:0; color:#1565c0;">🧠 AI + Recompute (phiên bản mới)</h3>
    <ul style="list-style-type: none; padding-left: 5px; font-size: 13px;">
        <li>🔑 <b>AI tự động:</b> Cần Gemini API Key trong ⚙️ Cài đặt.</li>
        <li>🧾 <b>AI thủ công:</b> Copy prompt → dán JSON; có thể paste trực tiếp bằng <b>Ctrl+V / Win+V</b> khi mở tab AI thủ công.</li>
        <li>🪄 <b>Auto tách name:</b> AI gợi ý bộ name, script dịch lại để giữ tên ổn định (bật/tắt trong Cài đặt).</li>
        <li>🛡️ <b>Lọc gợi ý:</b> Tự lọc tag/thể loại rác, giới hạn trạng thái kết thúc theo rule hiện hành.</li>
        <li>♻️ <b>Recompute thông minh:</b> Nếu đã dùng AI và bạn sửa tag/thể loại, script sẽ hỏi dùng lại đề xuất AI hay giữ phần chỉnh tay.</li>
        <li>📝 <b>Tối ưu văn án:</b> Nếu nguồn có tags, script thêm dòng <code>Nhãn: ...</code> trước khi dịch nhưng không đưa dòng này vào prompt AI để tránh trùng.</li>
        <li>⚙️ <b>Cột Gán nhãn:</b> Trong Cài đặt Nguồn có thể bật/tắt gán dòng <code>Nhãn: ...</code> theo từng nguồn (mặc định bật).</li>
    </ul>
</div>

<div class="${APP_PREFIX}guide-box-pink">
    <h3 style="margin-top:0; color:#ad1457;">🖼️ Cover + công cụ tiện ích</h3>
    <ul style="list-style-type: none; padding-left: 5px; font-size: 13px;">
        <li>📏 <b>Nhãn kích thước:</b> Cạnh Cover URL có tag <code>WxH</code> (ẩn khi chưa có ảnh).</li>
        <li>🧷 <b>Popup tỷ lệ ảnh:</b> Chọn gốc / <code>560x788</code> / preset tự tạo; lưu theo <b>nguồn đang dùng</b> (Fanqie, PO18...).</li>
        <li>🪶 <b>Tối ưu dung lượng:</b> Ảnh bìa lớn sẽ tự giảm dung lượng để dưới ngưỡng, ưu tiên giữ chi tiết hiển thị.</li>
        <li>💬 <b>Bảng dịch nhanh:</b> Nút hội thoại cạnh AI mở panel dịch nhanh các chế độ <code>vi/hv/si/tr</code>.</li>
    </ul>
</div>

<div class="${APP_PREFIX}guide-box-blue">
    <h3 style="margin-top:0; color:#1565c0;">🧩 Trang chỉnh sửa & kiểm tra trùng</h3>
    <ul style="list-style-type: none; padding-left: 5px; font-size: 13px;">
        <li>🏷️ <b>Chọn nhãn từ web:</b> Ở Thời đại/Kết thúc/Loại hình/Tag có nút <b>Chọn</b> để mở popup lọc nhanh và tick trực tiếp theo danh sách mới nhất của web.</li>
        <li>✅/❌ <b>So khớp nhanh:</b> Tick xanh = khớp web, X đỏ = lệch; rê chuột để xem trạng thái chi tiết.</li>
        <li>🎯 <b>Loại trừ theo trang:</b> Cấu hình loại trừ tách riêng giữa <code>/chinh-sua</code> và <code>/nhung-file</code>.</li>
        <li>🧱 <b>Popup so sánh mới:</b> Diff trước khi áp, văn án so theo từ + giữ xuống dòng để dễ soát lỗi.</li>
        <li>🔒 <b>Hành vi popup:</b> Bấm ra ngoài không tự đóng; chỉ đóng bằng nút hành động trong popup.</li>
        <li>🔍 <b>Check trùng truyện:</b> Ở <code>/nhung-file</code>, script check cơ bản để ra mức an toàn 80% / 0%, rồi có thể quét sâu trang tác giả + so ảnh bìa để nâng lên 90/95/100% hoặc cảnh báo mềm 50%.</li>
    </ul>
</div>

<h3>🌍 Các nguồn đang hỗ trợ</h3>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
    ${buildSiteOptionsHtml()}
</div>

<hr style="border: 0; border-top: 1px dashed #ccc; margin: 15px 0;">
` + CHANGELOG_CONTENT;

    // ================================================
    // UI
    // ================================================
    function createUI(options = {}) {
        state.settings = loadSettings();
        const shadowHost = document.createElement('div');
        shadowHost.id = `${APP_PREFIX}host`;
        document.body.appendChild(shadowHost);
        const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
        const showFloatingButton = options.showFloatingButton !== false;
        const showEditExtras = isEditPage();
        let themeMedia = null;
        let themeListener = null;
        const applyThemeMode = (mode) => {
            const resolved = resolveThemeMode(mode);
            shadowHost.setAttribute('data-theme', resolved);
            if (mode === 'auto' && window.matchMedia) {
                if (!themeMedia) {
                    themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
                    themeListener = () => {
                        shadowHost.setAttribute('data-theme', themeMedia.matches ? 'dark' : 'light');
                    };
                    themeMedia.addEventListener('change', themeListener);
                }
            } else if (themeMedia && themeListener) {
                themeMedia.removeEventListener('change', themeListener);
                themeMedia = null;
                themeListener = null;
            }
        };
        applyThemeMode(getSharedThemeMode());
        shadowHost.setAttribute('data-page', showEditExtras ? 'edit' : 'new');
        state.excludeConfig = loadExcludeConfig(showEditExtras);

        const css = `
            :host {
                all: initial;
                --wda-primary: #ff8a65;
                --wda-primary-strong: #ff7043;
                --wda-secondary: #26c6da;
                --wda-secondary-strong: #00acc1;
                --wda-danger: #ef5350;
                --wda-danger-strong: #e53935;
                --wda-surface: #ffffff;
                --wda-surface-2: #f6f8ff;
                --wda-border: rgba(98, 110, 140, 0.18);
                --wda-shadow: 0 18px 40px rgba(53, 64, 90, 0.2);
                --wda-text: #2f2a36;
                --wda-muted: #6b6f80;
                --wda-radius: 14px;
                --wda-fullscreen-scale: 1.5;
            }
            :host([data-theme="dark"]) {
                --wda-surface: #0b1220;
                --wda-surface-2: #111827;
                --wda-border: rgba(148, 163, 184, 0.25);
                --wda-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
                --wda-text: #e5e7eb;
                --wda-muted: #a3a3b5;
            }
            #${APP_PREFIX}btn {
                position: fixed; bottom: 20px; right: 20px; z-index: 99999;
                width: 52px; height: 52px; border-radius: 50%;
                background: linear-gradient(135deg, #ff9a8b 0%, #ff6a88 60%, #ff99ac 100%);
                color: #fff; border: none;
                font-size: 14px; cursor: grab;
                font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 10px 24px rgba(255, 105, 135, 0.35);
            }
            #${APP_PREFIX}btn:active { cursor: grabbing; }
            #${APP_PREFIX}panel {
                position: fixed; bottom: 70px; right: 20px; width: 420px; max-height: 75vh;
                background: linear-gradient(180deg, #ffffff 0%, #f6f8ff 100%);
                color: var(--wda-text); border: 1px solid var(--wda-border);
                border-radius: var(--wda-radius);
                box-shadow: var(--wda-shadow);
                font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
                z-index: 99999; display: none; flex-direction: column; overflow: visible;
            }
            #${APP_PREFIX}quickPanel {
                position: fixed; top: 72px; left: 20px; width: 420px; max-height: 72vh;
                background: linear-gradient(180deg, #ffffff 0%, #f6f8ff 100%);
                color: var(--wda-text); border: 1px solid var(--wda-border);
                border-radius: var(--wda-radius);
                box-shadow: var(--wda-shadow);
                font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
                z-index: 99999; display: none; flex-direction: column;
            }
            #${APP_PREFIX}panel.${APP_PREFIX}fullscreen {
                top: 0 !important;
                left: 0 !important;
                right: auto !important;
                bottom: auto !important;
                width: calc(100vw / var(--wda-fullscreen-scale)) !important;
                height: calc(100vh / var(--wda-fullscreen-scale)) !important;
                max-height: none !important;
                border-radius: 0;
                box-shadow: none;
                transform: scale(var(--wda-fullscreen-scale));
                transform-origin: top left;
            }
            #${APP_PREFIX}panel.${APP_PREFIX}fullscreen #${APP_PREFIX}header {
                cursor: default;
            }
            :host([data-theme="dark"]) #${APP_PREFIX}panel {
                background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
                border-color: var(--wda-border);
                color: var(--wda-text);
            }
            :host([data-theme="dark"]) #${APP_PREFIX}quickPanel {
                background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
                border-color: var(--wda-border);
                color: var(--wda-text);
            }
            #${APP_PREFIX}header {
                padding: 10px 14px;
                background: linear-gradient(90deg, #e8f0ff 0%, #e6fff8 100%);
                border-bottom: 1px solid rgba(0,0,0,0.06);
                font-weight: 600; font-size: 14px; display: flex; justify-content: space-between;
                color: #4a2c6f; cursor: move; align-items: center; gap: 10px;
            }
            #${APP_PREFIX}quickHeader {
                padding: 10px 14px;
                background: linear-gradient(90deg, #f8e8ff 0%, #e8f7ff 100%);
                border-bottom: 1px solid rgba(0,0,0,0.06);
                font-weight: 600; font-size: 14px; display: flex; justify-content: space-between;
                color: #4a2c6f; cursor: move; align-items: center; gap: 10px;
            }
            :host([data-theme="dark"]) #${APP_PREFIX}header {
                background: linear-gradient(90deg, #111827 0%, #0f172a 100%);
                border-bottom-color: rgba(148, 163, 184, 0.15);
                color: #e5e7eb;
            }
            :host([data-theme="dark"]) #${APP_PREFIX}quickHeader {
                background: linear-gradient(90deg, #1f2937 0%, #0f172a 100%);
                border-bottom-color: rgba(148, 163, 184, 0.15);
                color: #e5e7eb;
            }
            #${APP_PREFIX}header-title {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                flex: 1;
                color: #4a2c6f;
                letter-spacing: 0.2px;
                background: transparent;
                padding: 0;
                border-radius: 0;
                border: none;
            }
            :host([data-theme="dark"]) #${APP_PREFIX}header-title {
                color: #e5e7eb;
            }
            #${APP_PREFIX}header-title span { display: inline-flex; }
            #${APP_PREFIX}header-badge {
                font-size: 11px;
                font-weight: 700;
                color: #5a4a82;
                background: rgba(255,255,255,0.7);
                padding: 2px 6px;
                border-radius: 999px;
                border: 1px solid rgba(90, 90, 130, 0.2);
            }
            :host([data-theme="dark"]) #${APP_PREFIX}header-badge {
                color: #c7d2fe;
                background: rgba(15, 23, 42, 0.8);
                border-color: rgba(148, 163, 184, 0.25);
            }
            #${APP_PREFIX}header-actions {
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            #${APP_PREFIX}noticeBar {
                display: block;
                margin: 0 14px;
            }
            #${APP_PREFIX}recomputeNotice {
                display: none;
                margin: 0;
                padding: 6px 10px;
                border-radius: 8px;
                font-size: 13px;
                line-height: 1.45;
                background: #fff1f2;
                border: 1px solid #fecdd3;
                color: #b91c1c;
            }
            #${APP_PREFIX}recomputeNotice.show {
                display: block;
            }
            :host([data-theme="dark"]) #${APP_PREFIX}recomputeNotice {
                background: rgba(127, 29, 29, 0.22);
                border-color: rgba(248, 113, 113, 0.45);
                color: #fecaca;
            }
            #${APP_PREFIX}duplicateSafety {
                display: none;
                position: sticky;
                top: 0;
                z-index: 3;
                min-width: auto;
                max-width: none;
                padding: 0;
                margin: -2px 0 8px auto;
                width: fit-content;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 800;
                text-align: center;
                letter-spacing: 0.15px;
                border: none;
                background: transparent;
                color: hsl(var(--wda-safety-h, 210), 72%, 24%);
                box-shadow: var(--wda-safety-shadow, 0 14px 28px rgba(30, 41, 59, 0.2));
                white-space: nowrap;
                text-shadow:
                    0 0 6px hsla(var(--wda-safety-h, 210), 96%, 72%, 0.62),
                    0 0 14px hsla(var(--wda-safety-h, 210), 94%, 70%, 0.48),
                    0 0 28px hsla(var(--wda-safety-h2, 228), 92%, 72%, 0.22);
            }
            #${APP_PREFIX}duplicateSafety.show {
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            #${APP_PREFIX}duplicateSafety[data-tone="pending"] {
                animation: ${APP_PREFIX}toast-float 1.4s ease-in-out infinite;
            }
            :host([data-theme="dark"]) #${APP_PREFIX}duplicateSafety {
                color: hsl(var(--wda-safety-h, 210), 95%, 88%);
                text-shadow:
                    0 0 7px hsla(var(--wda-safety-h, 210), 98%, 76%, 0.72),
                    0 0 16px hsla(var(--wda-safety-h, 210), 96%, 74%, 0.56),
                    0 0 30px hsla(var(--wda-safety-h2, 228), 94%, 74%, 0.26);
            }
            #${APP_PREFIX}content { padding: 12px 14px; overflow: auto; position: relative; }
            #${APP_PREFIX}quickContent { padding: 12px 14px; overflow: auto; }
            .${APP_PREFIX}row { margin-bottom: 10px; }
            .${APP_PREFIX}quick-mode-row {
                display: grid;
                grid-template-columns: 88px 1fr;
                align-items: center;
                gap: 8px;
            }
            .${APP_PREFIX}quick-mode-row .${APP_PREFIX}label {
                margin-bottom: 0;
            }
            .${APP_PREFIX}label {
                font-size: 12px; color: #3f3d56;
                margin-bottom: 4px; display: block; font-weight: 700; letter-spacing: 0.2px;
            }
            .${APP_PREFIX}label-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }
            .${APP_PREFIX}label-row .${APP_PREFIX}label {
                margin-bottom: 0;
                display: inline-flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 0;
            }
            .${APP_PREFIX}jjwxc-api-btn {
                display: none;
                min-width: 48px;
                justify-content: center;
                border-color: rgba(139, 92, 246, 0.28);
            }
            .${APP_PREFIX}jjwxc-api-btn.show {
                display: inline-flex;
            }
            .${APP_PREFIX}jjwxc-api-btn[data-mode="new"] {
                background: linear-gradient(135deg, #dcfce7, #bfdbfe);
                color: #065f46;
                border-color: rgba(34, 197, 94, 0.28);
            }
            .${APP_PREFIX}jjwxc-api-btn[data-mode="old"] {
                background: linear-gradient(135deg, #fee2e2, #fbcfe8);
                color: #9f1239;
                border-color: rgba(244, 63, 94, 0.28);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}label { color: #d1d5db; }
            :host([data-theme="dark"]) .${APP_PREFIX}jjwxc-api-btn[data-mode="new"] {
                background: linear-gradient(135deg, rgba(20, 83, 45, 0.88), rgba(30, 64, 175, 0.78));
                color: #dcfce7;
                border-color: rgba(74, 222, 128, 0.32);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}jjwxc-api-btn[data-mode="old"] {
                background: linear-gradient(135deg, rgba(127, 29, 29, 0.88), rgba(131, 24, 67, 0.82));
                color: #ffe4e6;
                border-color: rgba(251, 113, 133, 0.35);
            }
            .${APP_PREFIX}match {
                display: inline; font-size: 12px; margin-left: 6px;
                font-weight: 700; border: none; background: transparent;
            }
            .${APP_PREFIX}match.ok { color: #0f766e; }
            .${APP_PREFIX}match.bad { color: #b91c1c; }
            .${APP_PREFIX}match.na { color: #94a3b8; }
            :host([data-page="new"]) .${APP_PREFIX}match { display: none; }
            .${APP_PREFIX}input, .${APP_PREFIX}textarea, .${APP_PREFIX}select {
                width: 100%; box-sizing: border-box; padding: 7px 9px;
                border: 1px solid rgba(110, 120, 150, 0.25);
                border-radius: 10px; font-size: 13px; font-family: inherit;
                background: #fff; color: var(--wda-text);
                box-shadow: inset 0 1px 2px rgba(16, 24, 40, 0.06);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}input,
            :host([data-theme="dark"]) .${APP_PREFIX}textarea,
            :host([data-theme="dark"]) .${APP_PREFIX}select {
                background: #0f172a;
                color: #e5e7eb;
                border-color: rgba(148, 163, 184, 0.3);
                box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
            }
            .${APP_PREFIX}textarea { min-height: 80px; resize: vertical; }
            .${APP_PREFIX}tiny-btn {
                border: 1px solid rgba(110, 120, 150, 0.35);
                border-radius: 999px;
                background: linear-gradient(135deg, #fbcfe8, #bfdbfe);
                color: #1f2937;
                font-size: 11px;
                font-weight: 700;
                padding: 3px 10px;
                cursor: pointer;
                white-space: nowrap;
            }
            .${APP_PREFIX}tiny-btn:hover {
                filter: brightness(0.98);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}tiny-btn {
                border-color: rgba(148, 163, 184, 0.4);
                background: linear-gradient(135deg, #312e81, #0f766e);
                color: #e5e7eb;
            }
            .${APP_PREFIX}cover-dim-chip {
                display: inline-flex;
                align-items: center;
                border-radius: 999px;
                padding: 3px 8px;
                font-size: 11px;
                font-weight: 700;
                color: #075985;
                background: #e0f2fe;
                border: 1px solid #bae6fd;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}cover-dim-chip {
                color: #bae6fd;
                background: rgba(8, 47, 73, 0.55);
                border-color: rgba(125, 211, 252, 0.35);
            }
            .${APP_PREFIX}cover-input-row {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 8px;
                align-items: center;
            }
            .${APP_PREFIX}cover-size-list {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .${APP_PREFIX}cover-size-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                padding: 6px 8px;
                border-radius: 8px;
                border: 1px solid rgba(148, 163, 184, 0.25);
                background: rgba(255, 255, 255, 0.6);
                font-size: 13px;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}cover-size-item {
                background: rgba(15, 23, 42, 0.6);
                border-color: rgba(148, 163, 184, 0.3);
            }
            .${APP_PREFIX}cover-size-item input[type="radio"] {
                margin-right: 8px;
            }
            .${APP_PREFIX}cover-custom-row {
                display: grid;
                grid-template-columns: 1fr 1fr auto;
                gap: 8px;
                margin-top: 10px;
            }
            .${APP_PREFIX}modal-card.${APP_PREFIX}multi-picker-card {
                width: 620px;
                max-width: 96vw;
            }
            .${APP_PREFIX}modal-card.${APP_PREFIX}jjwxc-api-card {
                width: 520px;
                max-width: 94vw;
            }
            .${APP_PREFIX}jjwxc-api-lead {
                margin: 0 0 10px;
                font-size: 14px;
                color: #334155;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}jjwxc-api-lead {
                color: #dbeafe;
            }
            .${APP_PREFIX}jjwxc-api-status {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 700;
                background: linear-gradient(135deg, rgba(239, 246, 255, 0.92), rgba(250, 245, 255, 0.96));
                border: 1px solid rgba(99, 102, 241, 0.18);
                color: #4338ca;
                margin-bottom: 12px;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}jjwxc-api-status {
                background: linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(49, 46, 129, 0.78));
                border-color: rgba(129, 140, 248, 0.28);
                color: #c7d2fe;
            }
            .${APP_PREFIX}jjwxc-api-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
            }
            .${APP_PREFIX}jjwxc-api-option {
                border: 1px solid rgba(148, 163, 184, 0.24);
                border-radius: 16px;
                padding: 14px;
                background: rgba(255, 255, 255, 0.84);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.65);
            }
            .${APP_PREFIX}jjwxc-api-option h4 {
                margin: 0 0 6px;
                font-size: 14px;
                font-weight: 800;
            }
            .${APP_PREFIX}jjwxc-api-option p {
                margin: 0 0 12px;
                font-size: 12px;
                line-height: 1.55;
                color: #475569;
            }
            .${APP_PREFIX}jjwxc-api-option[data-mode="new"] {
                background: linear-gradient(180deg, rgba(220, 252, 231, 0.95), rgba(219, 234, 254, 0.95));
                border-color: rgba(34, 197, 94, 0.2);
            }
            .${APP_PREFIX}jjwxc-api-option[data-mode="old"] {
                background: linear-gradient(180deg, rgba(255, 241, 242, 0.95), rgba(250, 232, 255, 0.95));
                border-color: rgba(244, 63, 94, 0.2);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}jjwxc-api-option {
                background: rgba(15, 23, 42, 0.84);
                border-color: rgba(148, 163, 184, 0.22);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}jjwxc-api-option[data-mode="new"] {
                background: linear-gradient(180deg, rgba(20, 83, 45, 0.42), rgba(30, 64, 175, 0.34));
                border-color: rgba(74, 222, 128, 0.25);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}jjwxc-api-option[data-mode="old"] {
                background: linear-gradient(180deg, rgba(127, 29, 29, 0.42), rgba(131, 24, 67, 0.34));
                border-color: rgba(251, 113, 133, 0.28);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}jjwxc-api-option p {
                color: #cbd5e1;
            }
            .${APP_PREFIX}jjwxc-api-pick {
                width: 100%;
                margin-right: 0;
            }
            .${APP_PREFIX}multi-picker-meta {
                margin-top: 6px;
                font-size: 11px;
                color: var(--wda-muted);
            }
            .${APP_PREFIX}multi-picker-list {
                display: flex;
                flex-direction: column;
                gap: 6px;
                max-height: 360px;
                overflow: auto;
                padding: 8px;
                border-radius: 10px;
                border: 1px solid rgba(148, 163, 184, 0.25);
                background: rgba(255, 255, 255, 0.78);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}multi-picker-list {
                background: rgba(15, 23, 42, 0.68);
                border-color: rgba(148, 163, 184, 0.32);
            }
            .${APP_PREFIX}multi-picker-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 8px;
                border-radius: 8px;
                border: 1px solid rgba(148, 163, 184, 0.2);
                background: rgba(255, 255, 255, 0.92);
                font-size: 13px;
                cursor: pointer;
            }
            .${APP_PREFIX}multi-picker-item input[type="checkbox"] {
                margin: 0;
                accent-color: #7c3aed;
            }
            .${APP_PREFIX}multi-picker-item:hover {
                border-color: rgba(99, 102, 241, 0.38);
                background: rgba(238, 242, 255, 0.95);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}multi-picker-item {
                background: rgba(15, 23, 42, 0.9);
                border-color: rgba(148, 163, 184, 0.28);
                color: #e2e8f0;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}multi-picker-item:hover {
                border-color: rgba(129, 140, 248, 0.55);
                background: rgba(30, 41, 59, 0.95);
            }
            .${APP_PREFIX}multi-picker-empty {
                font-size: 12px;
                color: var(--wda-muted);
                padding: 10px 6px;
                text-align: center;
            }
            .${APP_PREFIX}btn {
                background: linear-gradient(135deg, var(--wda-primary) 0%, #ffb74d 100%);
                color: #fff; border: none; border-radius: 10px;
                padding: 8px 12px; cursor: pointer; font-size: 13px; margin-right: 6px;
                font-weight: 600; box-shadow: 0 10px 18px rgba(255, 138, 101, 0.25);
                transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
            }
            .${APP_PREFIX}btn:hover { transform: translateY(-1px); box-shadow: 0 12px 20px rgba(255, 138, 101, 0.32); }
            .${APP_PREFIX}btn:active { transform: translateY(0); }
            .${APP_PREFIX}btn.secondary {
                background: linear-gradient(135deg, var(--wda-secondary) 0%, #42a5f5 100%);
                box-shadow: 0 10px 18px rgba(38, 198, 218, 0.26);
            }
            .${APP_PREFIX}btn.manual-ai { background: linear-gradient(135deg, #7e57c2, #42a5f5); color: #fff; }
            .${APP_PREFIX}btn.manual-ai-copy { background: linear-gradient(135deg, #26c6da, #26a69a); color: #fff; }
            .${APP_PREFIX}btn.manual-ai-paste { background: linear-gradient(135deg, #ff7043, #ffb74d); color: #fff; }
            .${APP_PREFIX}btn:disabled {
                opacity: 0.55;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            .${APP_PREFIX}icon-btn {
                background: rgba(255,255,255,0.8); border: 1px solid rgba(90, 100, 120, 0.2);
                color: #4a4a6a; border-radius: 8px;
                width: 30px; height: 30px; font-weight: 700; font-size: 14px;
                display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
                margin-right: 0; transition: all 0.2s ease;
            }
            .${APP_PREFIX}icon-btn:hover { color: #1f1f2b; background: #fff; transform: scale(1.05); }
            .${APP_PREFIX}icon-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}icon-btn {
                background: rgba(30, 41, 59, 0.85);
                border-color: rgba(148, 163, 184, 0.25);
                color: #e2e8f0;
            }
            .${APP_PREFIX}icon-btn.${APP_PREFIX}fullscreen-btn {
                font-size: 13px;
            }
            .${APP_PREFIX}icon-btn.${APP_PREFIX}quick-tool-btn {
                font-size: 13px;
                line-height: 0;
            }
            .${APP_PREFIX}icon-btn.${APP_PREFIX}quick-tool-btn svg {
                width: 16px;
                height: 16px;
                display: block;
            }
            .${APP_PREFIX}icon-btn.${APP_PREFIX}quick-tool-btn.active {
                color: #6d28d9;
                border-color: rgba(109, 40, 217, 0.35);
                background: rgba(233, 213, 255, 0.8);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}icon-btn.${APP_PREFIX}quick-tool-btn.active {
                color: #c4b5fd;
                border-color: rgba(196, 181, 253, 0.35);
                background: rgba(67, 56, 202, 0.32);
            }
            .${APP_PREFIX}icon-btn.${APP_PREFIX}fullscreen-btn.active {
                color: #0369a1;
                border-color: rgba(3, 105, 161, 0.35);
                background: rgba(186, 230, 253, 0.85);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}icon-btn.${APP_PREFIX}fullscreen-btn.active {
                color: #7dd3fc;
                border-color: rgba(125, 211, 252, 0.45);
                background: rgba(12, 74, 110, 0.55);
            }
            .${APP_PREFIX}settings-group { display: flex; flex-direction: column; gap: 6px; }
            .${APP_PREFIX}settings-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
            .${APP_PREFIX}log {
                background: linear-gradient(180deg, #111827 0%, #0b1220 100%);
                color: #e2e8f0; padding: 8px; border-radius: 10px;
                font-family: "JetBrains Mono", "Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
                font-size: 11px; max-height: 120px; overflow: auto;
                border: 1px solid rgba(148, 163, 184, 0.2);
                box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
            }
            .${APP_PREFIX}hint { font-size: 11px; color: var(--wda-muted); }
            .${APP_PREFIX}grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .${APP_PREFIX}modal {
                position: fixed; inset: 0; background: rgba(0,0,0,0.45);
                display: none; align-items: center; justify-content: center; z-index: 100000;
                font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
            }
            .${APP_PREFIX}modal-card {
                background: linear-gradient(180deg, #fff7fb 0%, #f6f8ff 100%);
                color: #333; border-radius: 14px; width: 550px; max-width: 95vw;
                max-height: 90vh; display: flex; flex-direction: column;
                box-shadow: 0 20px 40px rgba(63, 81, 181, 0.25);
                border: 1px solid rgba(0,0,0,0.06);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}modal-card {
                background: linear-gradient(180deg, #0b1220 0%, #111827 100%);
                color: #e5e7eb;
                border-color: rgba(148, 163, 184, 0.2);
            }
            .${APP_PREFIX}modal-title {
                font-weight: 700; font-size: 16px; margin-bottom: 0px;
                flex-shrink: 0; padding: 14px 18px 10px 18px;
                color: #1e3a8a; border-bottom: 1px solid rgba(0,0,0,0.08);
                background: linear-gradient(90deg, #f0f4ff, #e6f0ff);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}modal-title {
                color: #e2e8f0;
                border-bottom-color: rgba(148, 163, 184, 0.2);
                background: linear-gradient(90deg, #0f172a, #111827);
            }
            .${APP_PREFIX}modal-body {
                font-size: 14px; line-height: 1.6;
                flex: 1; overflow-y: auto; padding: 12px 18px;
                color: #4a4a6a;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}modal-body { color: #cbd5f5; }
            :host([data-theme="dark"]) #${APP_PREFIX}helpModal .${APP_PREFIX}modal-body {
                background: transparent;
                color: #e5e7eb;
            }
            :host([data-theme="dark"]) #${APP_PREFIX}helpModal .${APP_PREFIX}modal-body h2,
            :host([data-theme="dark"]) #${APP_PREFIX}helpModal .${APP_PREFIX}modal-body h3 {
                color: #f0abfc;
            }
            :host([data-theme="dark"]) #${APP_PREFIX}helpModal .${APP_PREFIX}modal-body code {
                background: #1f2937;
                color: #f9a8d4;
                border-radius: 4px;
                padding: 1px 4px;
                border: 1px solid rgba(148, 163, 184, 0.2);
            }
            .${APP_PREFIX}modal-body h2 { font-size: 16px; margin: 10px 0 8px 0; color: #333; }
            .${APP_PREFIX}modal-body h3 { font-size: 15px; margin: 12px 0 6px 0; color: #555; }
            .${APP_PREFIX}modal-body li { margin-bottom: 4px; }
            .${APP_PREFIX}modal-actions {
                margin-top: 12px; text-align: right; flex-shrink: 0; padding: 0 16px 16px 16px;
                background: rgba(255,255,255,0.7);
                border-top: 1px solid rgba(0,0,0,0.06);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}modal-actions {
                background: rgba(15, 23, 42, 0.7);
                border-top-color: rgba(148, 163, 184, 0.2);
            }
            .${APP_PREFIX}diff-card {
                width: 90vw; max-width: 1200px; max-height: 90vh;
                border-radius: 16px; border: 1px solid rgba(0,0,0,0.06);
                box-shadow: 0 20px 50px rgba(63, 81, 181, 0.25);
                background: linear-gradient(135deg, #fffafc 0%, #f3f7ff 100%);
                overflow: hidden;
                font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}diff-card {
                background: linear-gradient(135deg, #0b1220 0%, #111827 100%);
                border-color: rgba(148, 163, 184, 0.2);
                color: #e5e7eb;
            }
            .${APP_PREFIX}diff-title {
                padding: 16px 20px; font-weight: 600; font-size: 18px;
                color: #3c1c73; letter-spacing: 0.2px;
                background: linear-gradient(90deg, #fce4ec, #e3f2fd);
                border-bottom: 1px solid rgba(0,0,0,0.05);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}diff-title {
                color: #e2e8f0;
                background: linear-gradient(90deg, #0f172a, #111827);
                border-bottom-color: rgba(148, 163, 184, 0.2);
            }
            .${APP_PREFIX}diff-sub {
                font-size: 12px; color: #6a5b9a; margin-top: 4px; font-weight: 500;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}diff-sub { color: #a5b4fc; }
            .${APP_PREFIX}diff-body { padding: 10px 16px 4px 16px; max-height: 60vh; overflow: auto; }
            :host([data-theme="dark"]) .${APP_PREFIX}diff-body { color: #e5e7eb; }
            .${APP_PREFIX}diff-row {
                display: grid; grid-template-columns: 160px 1fr 1fr; gap: 12px;
                padding: 10px 8px; border-bottom: 1px dashed rgba(0,0,0,0.08);
            }
            .${APP_PREFIX}diff-row:last-child { border-bottom: none; }
            .${APP_PREFIX}diff-label { font-weight: 600; color: #5d3b8f; }
            :host([data-theme="dark"]) .${APP_PREFIX}diff-label { color: #c7d2fe; }
            .${APP_PREFIX}diff-col { background: #fff; border-radius: 10px; padding: 8px 10px; border: 1px solid rgba(0,0,0,0.06); }
            :host([data-theme="dark"]) .${APP_PREFIX}diff-col { background: #0f172a; border-color: rgba(148, 163, 184, 0.2); }
            .${APP_PREFIX}diff-col-title { font-size: 11px; color: #777; margin-bottom: 6px; }
            :host([data-theme="dark"]) .${APP_PREFIX}diff-col-title { color: #94a3b8; }
            .${APP_PREFIX}diff-old.change { color: inherit; font-weight: 500; box-shadow: inset 0 0 0 1px rgba(183, 28, 28, 0.12); }
            .${APP_PREFIX}diff-new.change { color: inherit; font-weight: 500; box-shadow: inset 0 0 0 1px rgba(27, 94, 32, 0.12); }
            .${APP_PREFIX}diff-text { white-space: pre-wrap; line-height: 1.5; }
            .${APP_PREFIX}diff-del { background: rgba(244, 67, 54, 0.15); color: #b71c1c; padding: 0 2px; border-radius: 4px; }
            .${APP_PREFIX}diff-ins { background: rgba(76, 175, 80, 0.18); color: #1b5e20; padding: 0 2px; border-radius: 4px; }
            .${APP_PREFIX}diff-chip { display: inline-block; padding: 2px 8px; border-radius: 999px; margin: 2px 4px 2px 0; font-size: 12px; }
            .${APP_PREFIX}diff-add { background: #d7f7dc; color: #1b5e20; border: 1px solid #a7e6b2; }
            .${APP_PREFIX}diff-remove { background: #ffe0e0; color: #b71c1c; border: 1px solid #ffb4b4; }
            .${APP_PREFIX}diff-neutral { background: #eef1ff; color: #3b3b7a; border: 1px solid #c7d2ff; }
            :host([data-theme="dark"]) .${APP_PREFIX}diff-del {
                background: rgba(248, 113, 113, 0.18);
                color: #fecaca;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}diff-ins {
                background: rgba(34, 197, 94, 0.18);
                color: #bbf7d0;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}diff-chip {
                background: rgba(30, 41, 59, 0.8);
                color: #e2e8f0;
                border-color: rgba(148, 163, 184, 0.35);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}diff-add {
                background: rgba(34, 197, 94, 0.18);
                color: #bbf7d0;
                border-color: rgba(34, 197, 94, 0.35);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}diff-remove {
                background: rgba(248, 113, 113, 0.18);
                color: #fecaca;
                border-color: rgba(248, 113, 113, 0.35);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}diff-neutral {
                background: rgba(148, 163, 184, 0.14);
                color: #e2e8f0;
                border-color: rgba(148, 163, 184, 0.3);
            }
            .${APP_PREFIX}diff-actions {
                padding: 12px 16px 16px 16px; text-align: right;
                background: linear-gradient(90deg, #fff, #f7f7ff);
                border-top: 1px solid rgba(0,0,0,0.05);
            }
            :host([data-theme="dark"]) .${APP_PREFIX}diff-actions {
                background: linear-gradient(90deg, #0b1220, #111827);
                border-top-color: rgba(148, 163, 184, 0.2);
            }
            .${APP_PREFIX}btn.diff-confirm { background: linear-gradient(135deg, #7b1fa2, #42a5f5); }
            #${APP_PREFIX}content::-webkit-scrollbar,
            #${APP_PREFIX}quickContent::-webkit-scrollbar,
            #${APP_PREFIX}quickInput::-webkit-scrollbar,
            #${APP_PREFIX}quickOutput::-webkit-scrollbar,
            .${APP_PREFIX}modal-body::-webkit-scrollbar,
            .${APP_PREFIX}diff-body::-webkit-scrollbar,
            .${APP_PREFIX}log::-webkit-scrollbar {
                width: 10px;
            }
            #${APP_PREFIX}content::-webkit-scrollbar-track,
            #${APP_PREFIX}quickContent::-webkit-scrollbar-track,
            #${APP_PREFIX}quickInput::-webkit-scrollbar-track,
            #${APP_PREFIX}quickOutput::-webkit-scrollbar-track,
            .${APP_PREFIX}modal-body::-webkit-scrollbar-track,
            .${APP_PREFIX}diff-body::-webkit-scrollbar-track,
            .${APP_PREFIX}log::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.7);
                border-radius: 999px;
            }
            #${APP_PREFIX}content::-webkit-scrollbar-thumb,
            #${APP_PREFIX}quickContent::-webkit-scrollbar-thumb,
            #${APP_PREFIX}quickInput::-webkit-scrollbar-thumb,
            #${APP_PREFIX}quickOutput::-webkit-scrollbar-thumb,
            .${APP_PREFIX}modal-body::-webkit-scrollbar-thumb,
            .${APP_PREFIX}diff-body::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, #ffb3d5 0%, #a6c8ff 100%);
                border-radius: 999px;
                border: 2px solid rgba(255,255,255,0.8);
            }
            .${APP_PREFIX}log::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, #7dd3fc 0%, #38bdf8 100%);
                border-radius: 999px;
                border: 2px solid rgba(15, 23, 42, 0.9);
            }
            #${APP_PREFIX}content,
            #${APP_PREFIX}quickContent,
            #${APP_PREFIX}quickInput,
            #${APP_PREFIX}quickOutput,
            .${APP_PREFIX}modal-body,
            .${APP_PREFIX}diff-body,
            .${APP_PREFIX}log {
                scrollbar-width: thin;
                scrollbar-color: #ffb3d5 rgba(255,255,255,0.7);
            }
            .${APP_PREFIX}log {
                scrollbar-color: #38bdf8 rgba(15, 23, 42, 0.8);
            }
            :host([data-theme="dark"]) #${APP_PREFIX}content::-webkit-scrollbar-track,
            :host([data-theme="dark"]) #${APP_PREFIX}quickContent::-webkit-scrollbar-track,
            :host([data-theme="dark"]) #${APP_PREFIX}quickInput::-webkit-scrollbar-track,
            :host([data-theme="dark"]) #${APP_PREFIX}quickOutput::-webkit-scrollbar-track,
            :host([data-theme="dark"]) .${APP_PREFIX}modal-body::-webkit-scrollbar-track,
            :host([data-theme="dark"]) .${APP_PREFIX}diff-body::-webkit-scrollbar-track,
            :host([data-theme="dark"]) .${APP_PREFIX}log::-webkit-scrollbar-track {
                background: rgba(15, 23, 42, 0.8);
            }
            :host([data-theme="dark"]) #${APP_PREFIX}content::-webkit-scrollbar-thumb,
            :host([data-theme="dark"]) #${APP_PREFIX}quickContent::-webkit-scrollbar-thumb,
            :host([data-theme="dark"]) #${APP_PREFIX}quickInput::-webkit-scrollbar-thumb,
            :host([data-theme="dark"]) #${APP_PREFIX}quickOutput::-webkit-scrollbar-thumb,
            :host([data-theme="dark"]) .${APP_PREFIX}modal-body::-webkit-scrollbar-thumb,
            :host([data-theme="dark"]) .${APP_PREFIX}diff-body::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, #64748b 0%, #1f2937 100%);
                border: 2px solid rgba(15, 23, 42, 0.9);
            }
            :host([data-theme="dark"]) #${APP_PREFIX}content,
            :host([data-theme="dark"]) #${APP_PREFIX}quickContent,
            :host([data-theme="dark"]) #${APP_PREFIX}quickInput,
            :host([data-theme="dark"]) #${APP_PREFIX}quickOutput,
            :host([data-theme="dark"]) .${APP_PREFIX}modal-body,
            :host([data-theme="dark"]) .${APP_PREFIX}diff-body {
                scrollbar-color: #64748b rgba(15, 23, 42, 0.8);
            }
            .${APP_PREFIX}manual-ai-card {
                background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
                padding: 12px;
                border-radius: 10px;
                border-left: 4px solid #7e57c2;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}manual-ai-card {
                background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                border-left-color: #818cf8;
                color: #e0e7ff;
            }
            .${APP_PREFIX}guide-box-green {
                background: #f4f6f8;
                padding: 12px;
                border-radius: 8px;
                margin: 10px 0;
                border-left: 4px solid #4caf50;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}guide-box-green {
                background: #1e3a2f;
                border-left-color: #34d399;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}guide-box-green h3 {
                color: #6ee7b7 !important;
            }
            .${APP_PREFIX}guide-box-blue {
                background: linear-gradient(135deg, #e3f2fd 0%, #fff8e1 100%);
                padding: 12px;
                border-radius: 8px;
                margin: 10px 0;
                border-left: 4px solid #42a5f5;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}guide-box-blue {
                background: linear-gradient(135deg, #1e3a5f 0%, #312e2f 100%);
                border-left-color: #60a5fa;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}guide-box-blue h3 {
                color: #93c5fd !important;
            }
            .${APP_PREFIX}guide-box-pink {
                background: linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%);
                padding: 12px;
                border-radius: 8px;
                margin: 10px 0;
                border-left: 4px solid #e91e63;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}guide-box-pink {
                background: linear-gradient(135deg, #4a1942 0%, #312e81 100%);
                border-left-color: #f472b6;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}guide-box-pink h3 {
                color: #f9a8d4 !important;
            }
            .${APP_PREFIX}welcome-heading {
                text-align: center;
                color: #2196f3;
            }
            .${APP_PREFIX}welcome-heading span {
                color: #e91e63;
            }
            .${APP_PREFIX}welcome-subtitle {
                text-align: center;
                font-style: italic;
                color: #666;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}welcome-subtitle {
                color: #a3a3b5;
            }
            .${APP_PREFIX}domain-header {
                font-weight: bold;
                border-bottom: 1px solid #eee;
                color: #666;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}domain-header {
                border-bottom-color: rgba(148, 163, 184, 0.3);
                color: #94a3b8;
            }
            .${APP_PREFIX}highlight-violet {
                color: #673ab7;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}highlight-violet {
                color: #b39ddb;
            }
            .${APP_PREFIX}ai-btn-color {
                color: #673ab7;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}ai-btn-color {
                color: #b39ddb;
            }
            #${APP_PREFIX}applyToast {
                position: fixed;
                left: 50%;
                top: calc(env(safe-area-inset-top, 0px) + 14px);
                transform: translate(-50%, -16px) scale(0.92);
                opacity: 0;
                z-index: 100002;
                pointer-events: none;
                padding: 10px 16px;
                border-radius: 999px;
                border: 1px solid rgba(255,255,255,0.62);
                color: #fff;
                font-weight: 700;
                font-size: 13px;
                letter-spacing: 0.15px;
                font-family: "Be Vietnam Pro", "Nunito", "Noto Sans", "Segoe UI", Arial, sans-serif;
                box-shadow: 0 14px 28px rgba(25, 35, 70, 0.3);
                background: linear-gradient(135deg, #ff7eb3 0%, #7afcff 100%);
                backdrop-filter: blur(6px);
                display: inline-flex;
                align-items: center;
                gap: 8px;
                transition: opacity 0.26s ease, transform 0.3s ease;
            }
            #${APP_PREFIX}applyToast::before {
                content: '✦';
                font-size: 14px;
                animation: ${APP_PREFIX}toast-spin 1.15s linear infinite;
            }
            #${APP_PREFIX}applyToast.enter {
                opacity: 1;
                transform: translate(-50%, 0) scale(1);
                animation: ${APP_PREFIX}toast-float 1.25s ease-in-out infinite;
            }
            #${APP_PREFIX}applyToast.exit {
                opacity: 0;
                transform: translate(-50%, -22px) scale(0.94);
                animation: none;
            }
            #${APP_PREFIX}applyToast[data-state="success"] {
                background: linear-gradient(135deg, #43a047, #26c6da);
            }
            #${APP_PREFIX}applyToast[data-state="success"]::before {
                content: '✓';
                animation: none;
            }
            #${APP_PREFIX}applyToast[data-state="error"] {
                background: linear-gradient(135deg, #e53935, #ef5350);
            }
            #${APP_PREFIX}applyToast[data-state="error"]::before {
                content: '!';
                animation: none;
            }
            :host([data-theme="dark"]) #${APP_PREFIX}applyToast {
                border-color: rgba(148, 163, 184, 0.35);
                color: #f8fafc;
                box-shadow: 0 16px 30px rgba(2, 6, 23, 0.62);
                background: linear-gradient(135deg, #7c3aed 0%, #0ea5e9 100%);
            }
            :host([data-theme="dark"]) #${APP_PREFIX}applyToast[data-state="success"] {
                background: linear-gradient(135deg, #16a34a, #0f766e);
            }
            :host([data-theme="dark"]) #${APP_PREFIX}applyToast[data-state="error"] {
                background: linear-gradient(135deg, #dc2626, #be123c);
            }
            @keyframes ${APP_PREFIX}toast-float {
                0%, 100% { box-shadow: 0 14px 28px rgba(25, 35, 70, 0.3); }
                50% { box-shadow: 0 18px 34px rgba(66, 165, 245, 0.36); }
            }
            @keyframes ${APP_PREFIX}toast-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;

        shadowRoot.innerHTML = `
            <style>${css}</style>
            <button id="${APP_PREFIX}btn">AF</button>
            <div id="${APP_PREFIX}applyToast" data-state="loading"></div>
            <div id="${APP_PREFIX}panel">
                <div id="${APP_PREFIX}header">
                    <div id="${APP_PREFIX}header-title">
                        <span id="${APP_PREFIX}header-title-text">Auto Fill Info</span>
                        <span id="${APP_PREFIX}header-badge">v${AUTOFILL_WIKIDICH_VERSION}</span>
                    </div>
                    <div id="${APP_PREFIX}header-actions">
                        <button id="${APP_PREFIX}ai" class="${APP_PREFIX}icon-btn ${APP_PREFIX}ai-btn-color" title="Chạy AI Analyze">AI</button>
                        <button id="${APP_PREFIX}quickTool" class="${APP_PREFIX}icon-btn ${APP_PREFIX}quick-tool-btn" title="Bảng dịch nhanh"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/></svg></button>
                        <button id="${APP_PREFIX}fullscreen" class="${APP_PREFIX}icon-btn ${APP_PREFIX}fullscreen-btn" title="Toàn màn hình">⛶</button>
                        <button id="${APP_PREFIX}help" class="${APP_PREFIX}icon-btn" title="Hướng dẫn">?</button>
                        <button id="${APP_PREFIX}settings" class="${APP_PREFIX}icon-btn" title="Cài đặt">⚙</button>
                        <button id="${APP_PREFIX}close" class="${APP_PREFIX}icon-btn" title="Thu nhỏ">✕</button>
                    </div>
                </div>
                <div id="${APP_PREFIX}noticeBar">
                    <div id="${APP_PREFIX}recomputeNotice"></div>
                </div>
                <div id="${APP_PREFIX}content">
                    <div id="${APP_PREFIX}duplicateSafety" data-tone="idle">--</div>
                    <div class="${APP_PREFIX}row">
                        <div class="${APP_PREFIX}label-row">
                            <label class="${APP_PREFIX}label">URL Web Trung</label>
                            <button id="${APP_PREFIX}jjwxcApiMode" class="${APP_PREFIX}tiny-btn ${APP_PREFIX}jjwxc-api-btn" type="button" title="Chọn JJWXC API">New</button>
                        </div>
                        <input id="${APP_PREFIX}url" class="${APP_PREFIX}input" placeholder="https://fanqienovel.com/page/... hoặc https://www.po18.tw/books/... hoặc https://www.ihuaben.com/book/... hoặc https://www.qidian.com/book/... hoặc https://www.qimao.com/shuku/..." />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <button id="${APP_PREFIX}fetch" class="${APP_PREFIX}btn">Lấy dữ liệu</button>
                        <button id="${APP_PREFIX}recompute" class="${APP_PREFIX}btn secondary">Recompute</button>
                        <button id="${APP_PREFIX}manualAi" class="${APP_PREFIX}btn manual-ai">AI thủ công</button>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <div id="${APP_PREFIX}log" class="${APP_PREFIX}log"></div>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Từ khóa bổ sung (phân cách dấu phẩy)</label>
                        <input id="${APP_PREFIX}extraKeywords" class="${APP_PREFIX}input" placeholder="ví dụ: tiên hiệp, HE, hiện đại" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Bộ name (mỗi dòng: gốc=dịch)</label>
                        <textarea id="${APP_PREFIX}nameSet" class="${APP_PREFIX}textarea" placeholder="Ví dụ:\n张三=Trương Tam\n李四=Lý Tứ"></textarea>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Tên gốc (CN)<span class="${APP_PREFIX}match" data-key="titleCn">?</span></label>
                        <input id="${APP_PREFIX}titleCn" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <div class="${APP_PREFIX}label-row">
                            <label class="${APP_PREFIX}label">Tên tác giả (CN)<span class="${APP_PREFIX}match" data-key="authorCn">?</span></label>
                            <button id="${APP_PREFIX}authorCheck" class="${APP_PREFIX}tiny-btn" type="button" title="Mở trang tác giả trên web hiện tại">Mở</button>
                        </div>
                        <input id="${APP_PREFIX}authorCn" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Tên dịch (VI)<span class="${APP_PREFIX}match" data-key="titleVi">?</span></label>
                        <input id="${APP_PREFIX}titleVi" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <div class="${APP_PREFIX}label-row">
                            <label class="${APP_PREFIX}label"><span id="${APP_PREFIX}descLabelText">Mô tả dịch (VI)</span><span class="${APP_PREFIX}match" data-key="descVi">?</span></label>
                            <button id="${APP_PREFIX}descToggle" class="${APP_PREFIX}tiny-btn" type="button" title="Đổi giữa mô tả VI và ZH">Zh</button>
                        </div>
                        <textarea id="${APP_PREFIX}descVi" class="${APP_PREFIX}textarea"></textarea>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <div class="${APP_PREFIX}label-row">
                            <label class="${APP_PREFIX}label">Cover URL<span class="${APP_PREFIX}match" data-key="coverUrl">?</span></label>
                            <span id="${APP_PREFIX}coverSizeTag" class="${APP_PREFIX}cover-dim-chip">-</span>
                        </div>
                        <div class="${APP_PREFIX}cover-input-row">
                            <input id="${APP_PREFIX}coverUrl" class="${APP_PREFIX}input" />
                            <button id="${APP_PREFIX}coverSizeBtn" class="${APP_PREFIX}tiny-btn" type="button" title="Chỉnh tỷ lệ ảnh bìa">WxH</button>
                        </div>
                    </div>
                    <div class="${APP_PREFIX}grid ${APP_PREFIX}row">
                        <div>
                            <label class="${APP_PREFIX}label">Tình trạng (radio)<span class="${APP_PREFIX}match" data-key="status">?</span></label>
                            <select id="${APP_PREFIX}status" class="${APP_PREFIX}select"></select>
                        </div>
                        <div>
                            <label class="${APP_PREFIX}label">Tính chất (radio)<span class="${APP_PREFIX}match" data-key="official">?</span></label>
                            <select id="${APP_PREFIX}official" class="${APP_PREFIX}select"></select>
                        </div>
                        <div>
                            <label class="${APP_PREFIX}label">Giới tính (radio)<span class="${APP_PREFIX}match" data-key="gender">?</span></label>
                            <select id="${APP_PREFIX}gender" class="${APP_PREFIX}select"></select>
                        </div>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <div class="${APP_PREFIX}label-row">
                            <label class="${APP_PREFIX}label">Thời đại (nhập label, phân cách dấu phẩy)<span class="${APP_PREFIX}match" data-key="age">?</span></label>
                            <button id="${APP_PREFIX}pickAge" class="${APP_PREFIX}tiny-btn" type="button" title="Chọn nhanh từ danh sách web">Chọn</button>
                        </div>
                        <input id="${APP_PREFIX}age" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <div class="${APP_PREFIX}label-row">
                            <label class="${APP_PREFIX}label">Kết thúc (nhập label, phân cách dấu phẩy)<span class="${APP_PREFIX}match" data-key="ending">?</span></label>
                            <button id="${APP_PREFIX}pickEnding" class="${APP_PREFIX}tiny-btn" type="button" title="Chọn nhanh từ danh sách web">Chọn</button>
                        </div>
                        <input id="${APP_PREFIX}ending" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <div class="${APP_PREFIX}label-row">
                            <label class="${APP_PREFIX}label">Loại hình (nhập label, phân cách dấu phẩy)<span class="${APP_PREFIX}match" data-key="genre">?</span></label>
                            <button id="${APP_PREFIX}pickGenre" class="${APP_PREFIX}tiny-btn" type="button" title="Chọn nhanh từ danh sách web">Chọn</button>
                        </div>
                        <input id="${APP_PREFIX}genre" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <div class="${APP_PREFIX}label-row">
                            <label class="${APP_PREFIX}label">Tag (nhập label, phân cách dấu phẩy)<span class="${APP_PREFIX}match" data-key="tag">?</span></label>
                            <button id="${APP_PREFIX}pickTag" class="${APP_PREFIX}tiny-btn" type="button" title="Chọn nhanh từ danh sách web">Chọn</button>
                        </div>
                        <textarea id="${APP_PREFIX}tag" class="${APP_PREFIX}textarea"></textarea>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Liên kết bổ sung<span class="${APP_PREFIX}match" data-key="moreLink">?</span></label>
                        <div class="${APP_PREFIX}grid">
                            <input id="${APP_PREFIX}moreLinkDesc" class="${APP_PREFIX}input" placeholder="Mô tả (vd: Cà Chua, Tấn Giang...)" list="${APP_PREFIX}moreLinkOptions" />
                            <input id="${APP_PREFIX}moreLinkUrl" class="${APP_PREFIX}input" placeholder="URL nguồn" />
                        </div>
                        <datalist id="${APP_PREFIX}moreLinkOptions"></datalist>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <button id="${APP_PREFIX}apply" class="${APP_PREFIX}btn">Áp vào form</button>
                        <button id="${APP_PREFIX}exclude" class="${APP_PREFIX}btn secondary">Loại trừ</button>
                    </div>
                    <div class="${APP_PREFIX}row ${APP_PREFIX}hint">
                        Tip: có thể sửa text/label trong panel rồi bấm "Áp vào form".
                    </div>
                </div>
            </div>
            <div id="${APP_PREFIX}quickPanel">
                <div id="${APP_PREFIX}quickHeader">
                    <div>Dịch ngay</div>
                    <button id="${APP_PREFIX}quickClose" class="${APP_PREFIX}icon-btn" title="Đóng">✕</button>
                </div>
                <div id="${APP_PREFIX}quickContent">
                    <div class="${APP_PREFIX}row ${APP_PREFIX}quick-mode-row">
                        <label class="${APP_PREFIX}label">Chế độ</label>
                        <select id="${APP_PREFIX}quickMode" class="${APP_PREFIX}select">
                            <option value="vi">Dịch sang Việt</option>
                            <option value="hv">Hán Việt</option>
                            <option value="si">Phồn -> Giản</option>
                            <option value="tr">Giản -> Phồn</option>
                        </select>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Văn bản gốc</label>
                        <textarea id="${APP_PREFIX}quickInput" class="${APP_PREFIX}textarea" placeholder="Nhập cụm từ hoặc đoạn văn cần dịch..."></textarea>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <button id="${APP_PREFIX}quickRun" class="${APP_PREFIX}btn">Dịch nhanh</button>
                        <button id="${APP_PREFIX}quickCopy" class="${APP_PREFIX}btn secondary">Copy kết quả</button>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Kết quả</label>
                        <textarea id="${APP_PREFIX}quickOutput" class="${APP_PREFIX}textarea" readonly></textarea>
                    </div>
                </div>
            </div>
            <div id="${APP_PREFIX}settingsModal" class="${APP_PREFIX}modal">
                <div class="${APP_PREFIX}modal-card">
                    <div class="${APP_PREFIX}modal-title">Cài đặt</div>
                    <div class="${APP_PREFIX}modal-body">
                        <div class="${APP_PREFIX}row">
                            <label class="${APP_PREFIX}label">Độ chính xác gợi ý (0.50 - 0.99)</label>
                            <input id="${APP_PREFIX}settingThreshold" class="${APP_PREFIX}input" type="number" min="0.5" max="0.99" step="0.01" />
                        </div>
                        <div class="${APP_PREFIX}row">
                            <label class="${APP_PREFIX}label">Cấu hình AI (Hiện chỉ hỗ trợ Gemini)</label>
                            <div class="${APP_PREFIX}settings-group">
                                <label class="${APP_PREFIX}settings-item">
                                    <span style="min-width: 80px;">API Key:</span>
                                    <input id="${APP_PREFIX}settingGeminiKey" class="${APP_PREFIX}input" type="password" placeholder="AIza..." style="flex:1;" />
                                    <button id="${APP_PREFIX}fetchModels" class="${APP_PREFIX}btn secondary" style="margin-right:0; padding: 4px 8px; font-size: 11px;">Lấy Model</button>
                                </label>
                                <label class="${APP_PREFIX}settings-item">
                                    <span style="min-width: 80px;">Model:</span>
                                    <select id="${APP_PREFIX}settingGeminiModel" class="${APP_PREFIX}select"></select>
                                </label>
                                <label class="${APP_PREFIX}settings-item">
                                    <span style="min-width: 80px;">Chế độ:</span>
                                    <select id="${APP_PREFIX}settingAiMode" class="${APP_PREFIX}select" style="width: auto;">
                                        <option value="auto">Tự động (Keyword)</option>
                                        <option value="ai">AI (Ưu tiên)</option>
                                    </select>
                                </label>
                                <label class="${APP_PREFIX}settings-item" style="margin-top: 4px;">
                                    <span style="min-width: 80px;">Auto Tách Names:</span>
                                    <input id="${APP_PREFIX}settingAutoExtractNames" type="checkbox" style="margin-left: 8px;" />
                                    <small style="color: #888; margin-left: 8px;">(Khi dùng AI, tự động tách tên nhân vật/địa danh)</small>
                                </label>
                                <label class="${APP_PREFIX}settings-item" style="margin-top: 4px;">
                                    <span style="min-width: 80px;">Tự xuống dòng:</span>
                                    <input id="${APP_PREFIX}settingAutoBreakDesc" type="checkbox" style="margin-left: 8px;" />
                                    <small style="color: #888; margin-left: 8px;">(Tự xuống dòng văn án.)</small>
                                </label>
                                <label class="${APP_PREFIX}settings-item" style="margin-top: 4px;">
                                    <span style="min-width: 80px;">Check sâu:</span>
                                    <input id="${APP_PREFIX}settingDeepDuplicateCheck" type="checkbox" style="margin-left: 8px;" />
                                    <small style="color: #888; margin-left: 8px;">(Quét thêm trang tác giả + so khớp ảnh bìa để ước lượng truyện trùng.)</small>
                                </label>
                            </div>
                        </div>
                        <div class="${APP_PREFIX}row">
                            <label class="${APP_PREFIX}label">Cấu hình Nguồn (Quét văn án, Gán nhãn & Nơi hiển thị)</label>
                            <div id="${APP_PREFIX}domainConfig" class="${APP_PREFIX}settings-group" style="display:grid; grid-template-columns: 1.4fr 0.65fr 0.75fr 1.8fr; gap: 6px 10px; font-size: 13px; align-items:center;">
                                <div class="${APP_PREFIX}domain-header">Nguồn</div>
                                <div class="${APP_PREFIX}domain-header" style="text-align:center;">Quét</div>
                                <div class="${APP_PREFIX}domain-header" style="text-align:center;">Gán nhãn</div>
                                <div class="${APP_PREFIX}domain-header">Hiển thị</div>
                            </div>
                        </div>
                        <div class="${APP_PREFIX}row">
                            <label class="${APP_PREFIX}label">Tỷ lệ ảnh bìa theo nguồn đang dùng</label>
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap: wrap;">
                                <span id="${APP_PREFIX}coverSizeSettingSummary" class="${APP_PREFIX}hint"></span>
                                <button id="${APP_PREFIX}coverSizeSettingBtn" class="${APP_PREFIX}btn secondary" type="button" style="padding: 6px 10px;">Thiết lập WxH</button>
                            </div>
                        </div>
                    </div>
                    <div class="${APP_PREFIX}modal-actions">
                        <button id="${APP_PREFIX}settingsSave" class="${APP_PREFIX}btn">Lưu</button>
                        <button id="${APP_PREFIX}settingsClose" class="${APP_PREFIX}btn secondary">Đóng</button>
                    </div>
                </div>
            </div>
            <div id="${APP_PREFIX}manualAiModal" class="${APP_PREFIX}modal">
                <div class="${APP_PREFIX}modal-card">
                    <div class="${APP_PREFIX}modal-title">AI thủ công ✨</div>
                    <div class="${APP_PREFIX}modal-body">
                        <div class="${APP_PREFIX}manual-ai-card">
                            <ol style="margin-left: 15px; padding-left: 0;">
                                <li><b>Bước 1:</b> Copy prompt để dán vào AI của bạn.</li>
                                <li><b>Bước 2:</b> Nhận kết quả JSON từ AI, rồi dán lại vào tool.</li>
                                <li><b>Bước 3:</b> Tool sẽ áp kết quả ngay lập tức.</li>
                            </ol>
                            <div style="display:flex; gap:10px; margin-top: 8px; flex-wrap: wrap;">
                                <button id="${APP_PREFIX}manualAiCopy" class="${APP_PREFIX}btn manual-ai-copy">Copy Prompt</button>
                                <button id="${APP_PREFIX}manualAiPaste" class="${APP_PREFIX}btn manual-ai-paste">Dán Kết Quả</button>
                            </div>
                        </div>
                    </div>
                    <div class="${APP_PREFIX}modal-actions">
                        <button id="${APP_PREFIX}manualAiClose" class="${APP_PREFIX}btn secondary">Đóng</button>
                    </div>
                </div>
            </div>
            <div id="${APP_PREFIX}jjwxcApiModal" class="${APP_PREFIX}modal">
                <div class="${APP_PREFIX}modal-card ${APP_PREFIX}jjwxc-api-card">
                    <div class="${APP_PREFIX}modal-title">Chọn luồng JJWXC</div>
                    <div class="${APP_PREFIX}modal-body">
                        <p class="${APP_PREFIX}jjwxc-api-lead">Lần đầu lấy dữ liệu từ JJWXC, hãy chốt API mặc định cho trình duyệt này. Bạn vẫn có thể đổi lại sau bằng nút <b>Old/New</b> cạnh ô URL.</p>
                        <div id="${APP_PREFIX}jjwxcApiStatus" class="${APP_PREFIX}jjwxc-api-status">Đang lưu: Chưa chọn</div>
                        <div class="${APP_PREFIX}jjwxc-api-grid">
                            <div class="${APP_PREFIX}jjwxc-api-option" data-mode="new">
                                <h4>New</h4>
                                <p>Dùng endpoint mới. Đây sẽ là lựa chọn mặc định nếu chưa có cấu hình trước đó.</p>
                                <button id="${APP_PREFIX}jjwxcPickNew" class="${APP_PREFIX}btn ${APP_PREFIX}jjwxc-api-pick" type="button">Dùng New</button>
                            </div>
                            <div class="${APP_PREFIX}jjwxc-api-option" data-mode="old">
                                <h4>Old</h4>
                                <p>Dùng endpoint cũ. Hữu ích khi muốn so lại dữ liệu hoặc fallback thủ công.</p>
                                <button id="${APP_PREFIX}jjwxcPickOld" class="${APP_PREFIX}btn secondary ${APP_PREFIX}jjwxc-api-pick" type="button">Dùng Old</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="${APP_PREFIX}duplicateModal" class="${APP_PREFIX}modal">
                <div class="${APP_PREFIX}modal-card">
                    <div class="${APP_PREFIX}modal-title" style="color:#c62828;">Cảnh báo truyện trùng</div>
                    <div class="${APP_PREFIX}modal-body" id="${APP_PREFIX}duplicateBody"></div>
                    <div class="${APP_PREFIX}modal-actions">
                        <button id="${APP_PREFIX}duplicateClose" class="${APP_PREFIX}btn secondary">Đã hiểu</button>
                    </div>
                </div>
            </div>
            <div id="${APP_PREFIX}duplicateDeepModal" class="${APP_PREFIX}modal">
                <div class="${APP_PREFIX}modal-card">
                    <div class="${APP_PREFIX}modal-title" style="color:#b45309;">Nghi có truyện trùng theo ảnh bìa</div>
                    <div class="${APP_PREFIX}modal-body" id="${APP_PREFIX}duplicateDeepBody"></div>
                    <div class="${APP_PREFIX}modal-actions">
                        <button id="${APP_PREFIX}duplicateDeepOpen" class="${APP_PREFIX}btn secondary">Mở</button>
                        <button id="${APP_PREFIX}duplicateDeepNo" class="${APP_PREFIX}btn">Không trùng</button>
                        <button id="${APP_PREFIX}duplicateDeepYes" class="${APP_PREFIX}btn secondary">Trùng</button>
                    </div>
                </div>
            </div>
            <div id="${APP_PREFIX}coverSizeModal" class="${APP_PREFIX}modal">
                <div class="${APP_PREFIX}modal-card">
                    <div class="${APP_PREFIX}modal-title">Tỷ lệ ảnh bìa (theo nguồn)</div>
                    <div class="${APP_PREFIX}modal-body">
                        <div class="${APP_PREFIX}hint" id="${APP_PREFIX}coverSizeDomain"></div>
                        <div class="${APP_PREFIX}hint" id="${APP_PREFIX}coverSizeOriginal"></div>
                        <div id="${APP_PREFIX}coverSizeList" class="${APP_PREFIX}cover-size-list" style="margin-top: 10px;"></div>
                        <div class="${APP_PREFIX}cover-custom-row">
                            <input id="${APP_PREFIX}coverCustomW" class="${APP_PREFIX}input" type="number" min="1" placeholder="Width" />
                            <input id="${APP_PREFIX}coverCustomH" class="${APP_PREFIX}input" type="number" min="1" placeholder="Height" />
                            <button id="${APP_PREFIX}coverCustomAdd" class="${APP_PREFIX}tiny-btn" type="button">Thêm</button>
                        </div>
                    </div>
                    <div class="${APP_PREFIX}modal-actions">
                        <button id="${APP_PREFIX}coverSizeSave" class="${APP_PREFIX}btn">Lưu</button>
                        <button id="${APP_PREFIX}coverSizeClose" class="${APP_PREFIX}btn secondary">Đóng</button>
                    </div>
                </div>
            </div>
            <div id="${APP_PREFIX}multiPickerModal" class="${APP_PREFIX}modal">
                <div class="${APP_PREFIX}modal-card ${APP_PREFIX}multi-picker-card">
                    <div class="${APP_PREFIX}modal-title" id="${APP_PREFIX}multiPickerTitle">Chọn mục</div>
                    <div class="${APP_PREFIX}modal-body">
                        <div class="${APP_PREFIX}row" style="margin-top: 0;">
                            <input id="${APP_PREFIX}multiPickerSearch" class="${APP_PREFIX}input" placeholder="Tìm nhanh nhãn..." />
                            <div id="${APP_PREFIX}multiPickerMeta" class="${APP_PREFIX}multi-picker-meta"></div>
                        </div>
                        <div id="${APP_PREFIX}multiPickerList" class="${APP_PREFIX}multi-picker-list"></div>
                    </div>
                    <div class="${APP_PREFIX}modal-actions">
                        <button id="${APP_PREFIX}multiPickerClear" class="${APP_PREFIX}btn secondary">Bỏ chọn</button>
                        <button id="${APP_PREFIX}multiPickerSelectAll" class="${APP_PREFIX}btn secondary">Chọn hết</button>
                        <button id="${APP_PREFIX}multiPickerSave" class="${APP_PREFIX}btn">Áp vào ô</button>
                        <button id="${APP_PREFIX}multiPickerClose" class="${APP_PREFIX}btn secondary">Đóng</button>
                    </div>
                </div>
            </div>
            <div id="${APP_PREFIX}excludeModal" class="${APP_PREFIX}modal">
                <div class="${APP_PREFIX}modal-card">
                    <div class="${APP_PREFIX}modal-title">Loại trừ trường khi áp</div>
                    <div class="${APP_PREFIX}modal-body">
                        <div class="${APP_PREFIX}row" style="margin-top:0;">
                            <label class="${APP_PREFIX}label">Áp dụng cho</label>
                            <div style="display:flex; gap:10px; align-items:center; flex-wrap: wrap;">
                                <select id="${APP_PREFIX}excludeScope" class="${APP_PREFIX}select" style="min-width: 220px;"></select>
                                <button id="${APP_PREFIX}excludeReset" class="${APP_PREFIX}btn secondary" style="margin:0; padding: 6px 10px;">Dùng theo "Tất cả"</button>
                            </div>
                            <div class="${APP_PREFIX}hint" style="margin-top: 8px;">
                                Tip: "Tất cả nguồn" là mặc định. Nếu chọn 1 nguồn, chỉ cần chỉnh những trường khác với "Tất cả".
                            </div>
                        </div>
                        <div id="${APP_PREFIX}excludeList" class="${APP_PREFIX}settings-group"></div>
                    </div>
                    <div class="${APP_PREFIX}modal-actions">
                        <button id="${APP_PREFIX}excludeSave" class="${APP_PREFIX}btn">Lưu</button>
                        <button id="${APP_PREFIX}excludeClose" class="${APP_PREFIX}btn secondary">Đóng</button>
                    </div>
                </div>
            </div>
            ${showEditExtras ? `
            <div id="${APP_PREFIX}diffModal" class="${APP_PREFIX}modal">
                <div class="${APP_PREFIX}diff-card">
                    <div class="${APP_PREFIX}diff-title">
                        So sánh thay đổi trước khi áp
                        <div class="${APP_PREFIX}diff-sub">Ghi chú: Đỏ là bị bỏ, xanh là mới thêm ✨</div>
                    </div>
                    <div class="${APP_PREFIX}diff-body" id="${APP_PREFIX}diffBody"></div>
                    <div class="${APP_PREFIX}diff-actions">
                        <button id="${APP_PREFIX}diffConfirm" class="${APP_PREFIX}btn diff-confirm">Áp dụng</button>
                        <button id="${APP_PREFIX}diffCancel" class="${APP_PREFIX}btn secondary">Hủy</button>
                    </div>
                </div>
            </div>
            ` : ''}
        `;

        const btn = shadowRoot.getElementById(`${APP_PREFIX}btn`);
        const panel = shadowRoot.getElementById(`${APP_PREFIX}panel`);
        const headerEl = shadowRoot.getElementById(`${APP_PREFIX}header`);
        const recomputeNoticeEl = shadowRoot.getElementById(`${APP_PREFIX}recomputeNotice`);
        const close = shadowRoot.getElementById(`${APP_PREFIX}close`);
        const aiBtn = shadowRoot.getElementById(`${APP_PREFIX}ai`);
        const quickToolBtn = shadowRoot.getElementById(`${APP_PREFIX}quickTool`);
        const fullscreenBtn = shadowRoot.getElementById(`${APP_PREFIX}fullscreen`);
        const helpBtn = shadowRoot.getElementById(`${APP_PREFIX}help`);
        const panelFullscreenClass = `${APP_PREFIX}fullscreen`;
        const quickPanel = shadowRoot.getElementById(`${APP_PREFIX}quickPanel`);
        const quickHeader = shadowRoot.getElementById(`${APP_PREFIX}quickHeader`);
        const quickClose = shadowRoot.getElementById(`${APP_PREFIX}quickClose`);
        const quickMode = shadowRoot.getElementById(`${APP_PREFIX}quickMode`);
        const quickInput = shadowRoot.getElementById(`${APP_PREFIX}quickInput`);
        const quickRun = shadowRoot.getElementById(`${APP_PREFIX}quickRun`);
        const quickCopy = shadowRoot.getElementById(`${APP_PREFIX}quickCopy`);
        const quickOutput = shadowRoot.getElementById(`${APP_PREFIX}quickOutput`);
        const descToggleBtn = shadowRoot.getElementById(`${APP_PREFIX}descToggle`);
        const descTextarea = shadowRoot.getElementById(`${APP_PREFIX}descVi`);
        const descLabelText = shadowRoot.getElementById(`${APP_PREFIX}descLabelText`);
        const coverUrlInput = shadowRoot.getElementById(`${APP_PREFIX}coverUrl`);
        const coverSizeTag = shadowRoot.getElementById(`${APP_PREFIX}coverSizeTag`);
        const coverSizeBtn = shadowRoot.getElementById(`${APP_PREFIX}coverSizeBtn`);
        const pickAgeBtn = shadowRoot.getElementById(`${APP_PREFIX}pickAge`);
        const pickEndingBtn = shadowRoot.getElementById(`${APP_PREFIX}pickEnding`);
        const pickGenreBtn = shadowRoot.getElementById(`${APP_PREFIX}pickGenre`);
        const pickTagBtn = shadowRoot.getElementById(`${APP_PREFIX}pickTag`);

        const settingsBtn = shadowRoot.getElementById(`${APP_PREFIX}settings`);
        const settingsModal = shadowRoot.getElementById(`${APP_PREFIX}settingsModal`);
        const settingsSave = shadowRoot.getElementById(`${APP_PREFIX}settingsSave`);
        const settingsClose = shadowRoot.getElementById(`${APP_PREFIX}settingsClose`);
        const settingsThreshold = shadowRoot.getElementById(`${APP_PREFIX}settingThreshold`);
        const settingsGeminiKey = shadowRoot.getElementById(`${APP_PREFIX}settingGeminiKey`);
        const settingsFetchModels = shadowRoot.getElementById(`${APP_PREFIX}fetchModels`);
        const settingsGeminiModel = shadowRoot.getElementById(`${APP_PREFIX}settingGeminiModel`);
        const settingsAiMode = shadowRoot.getElementById(`${APP_PREFIX}settingAiMode`);
        const settingsAutoExtractNames = shadowRoot.getElementById(`${APP_PREFIX}settingAutoExtractNames`);
        const settingsAutoBreakDesc = shadowRoot.getElementById(`${APP_PREFIX}settingAutoBreakDesc`);
        const settingsDeepDuplicateCheck = shadowRoot.getElementById(`${APP_PREFIX}settingDeepDuplicateCheck`);
        const manualAiBtn = shadowRoot.getElementById(`${APP_PREFIX}manualAi`);
        const manualAiModal = shadowRoot.getElementById(`${APP_PREFIX}manualAiModal`);
        const manualAiCopy = shadowRoot.getElementById(`${APP_PREFIX}manualAiCopy`);
        const manualAiPaste = shadowRoot.getElementById(`${APP_PREFIX}manualAiPaste`);
        const manualAiClose = shadowRoot.getElementById(`${APP_PREFIX}manualAiClose`);
        const jjwxcApiModal = shadowRoot.getElementById(`${APP_PREFIX}jjwxcApiModal`);
        const jjwxcApiStatus = shadowRoot.getElementById(`${APP_PREFIX}jjwxcApiStatus`);
        const jjwxcPickNew = shadowRoot.getElementById(`${APP_PREFIX}jjwxcPickNew`);
        const jjwxcPickOld = shadowRoot.getElementById(`${APP_PREFIX}jjwxcPickOld`);
        const duplicateModal = shadowRoot.getElementById(`${APP_PREFIX}duplicateModal`);
        const duplicateBody = shadowRoot.getElementById(`${APP_PREFIX}duplicateBody`);
        const duplicateClose = shadowRoot.getElementById(`${APP_PREFIX}duplicateClose`);
        const duplicateDeepModal = shadowRoot.getElementById(`${APP_PREFIX}duplicateDeepModal`);
        const duplicateDeepBody = shadowRoot.getElementById(`${APP_PREFIX}duplicateDeepBody`);
        const duplicateDeepOpen = shadowRoot.getElementById(`${APP_PREFIX}duplicateDeepOpen`);
        const duplicateDeepNo = shadowRoot.getElementById(`${APP_PREFIX}duplicateDeepNo`);
        const duplicateDeepYes = shadowRoot.getElementById(`${APP_PREFIX}duplicateDeepYes`);
        const coverSizeModal = shadowRoot.getElementById(`${APP_PREFIX}coverSizeModal`);
        const coverSizeDomain = shadowRoot.getElementById(`${APP_PREFIX}coverSizeDomain`);
        const coverSizeOriginal = shadowRoot.getElementById(`${APP_PREFIX}coverSizeOriginal`);
        const coverSizeList = shadowRoot.getElementById(`${APP_PREFIX}coverSizeList`);
        const coverCustomW = shadowRoot.getElementById(`${APP_PREFIX}coverCustomW`);
        const coverCustomH = shadowRoot.getElementById(`${APP_PREFIX}coverCustomH`);
        const coverCustomAdd = shadowRoot.getElementById(`${APP_PREFIX}coverCustomAdd`);
        const coverSizeSave = shadowRoot.getElementById(`${APP_PREFIX}coverSizeSave`);
        const coverSizeClose = shadowRoot.getElementById(`${APP_PREFIX}coverSizeClose`);
        const multiPickerModal = shadowRoot.getElementById(`${APP_PREFIX}multiPickerModal`);
        const multiPickerTitle = shadowRoot.getElementById(`${APP_PREFIX}multiPickerTitle`);
        const multiPickerSearch = shadowRoot.getElementById(`${APP_PREFIX}multiPickerSearch`);
        const multiPickerMeta = shadowRoot.getElementById(`${APP_PREFIX}multiPickerMeta`);
        const multiPickerList = shadowRoot.getElementById(`${APP_PREFIX}multiPickerList`);
        const multiPickerClear = shadowRoot.getElementById(`${APP_PREFIX}multiPickerClear`);
        const multiPickerSelectAll = shadowRoot.getElementById(`${APP_PREFIX}multiPickerSelectAll`);
        const multiPickerSave = shadowRoot.getElementById(`${APP_PREFIX}multiPickerSave`);
        const multiPickerClose = shadowRoot.getElementById(`${APP_PREFIX}multiPickerClose`);
        const coverSizeSettingSummary = shadowRoot.getElementById(`${APP_PREFIX}coverSizeSettingSummary`);
        const coverSizeSettingBtn = shadowRoot.getElementById(`${APP_PREFIX}coverSizeSettingBtn`);
        const excludeBtn = shadowRoot.getElementById(`${APP_PREFIX}exclude`);
        const excludeModal = shadowRoot.getElementById(`${APP_PREFIX}excludeModal`);
        const excludeScope = shadowRoot.getElementById(`${APP_PREFIX}excludeScope`);
        const excludeReset = shadowRoot.getElementById(`${APP_PREFIX}excludeReset`);
        const excludeList = shadowRoot.getElementById(`${APP_PREFIX}excludeList`);
        const excludeSave = shadowRoot.getElementById(`${APP_PREFIX}excludeSave`);
        const excludeClose = shadowRoot.getElementById(`${APP_PREFIX}excludeClose`);
        const diffModal = shadowRoot.getElementById(`${APP_PREFIX}diffModal`);
        const diffBody = shadowRoot.getElementById(`${APP_PREFIX}diffBody`);
        const diffConfirm = shadowRoot.getElementById(`${APP_PREFIX}diffConfirm`);
        const diffCancel = shadowRoot.getElementById(`${APP_PREFIX}diffCancel`);
        const fetchBtn = shadowRoot.getElementById(`${APP_PREFIX}fetch`);
        const recomputeBtn = shadowRoot.getElementById(`${APP_PREFIX}recompute`);
        const applyToast = shadowRoot.getElementById(`${APP_PREFIX}applyToast`);
        const duplicateSafetyEl = shadowRoot.getElementById(`${APP_PREFIX}duplicateSafety`);

        const domainConfig = shadowRoot.getElementById(`${APP_PREFIX}domainConfig`);
        const getDomainInputs = (id) => ({
            desc: shadowRoot.getElementById(`${APP_PREFIX}confDesc_${id}`),
            assignTags: shadowRoot.getElementById(`${APP_PREFIX}confTag_${id}`),
            target: shadowRoot.getElementById(`${APP_PREFIX}confTarget_${id}`),
        });
        const titleCnInput = shadowRoot.getElementById(`${APP_PREFIX}titleCn`);
        const authorCnInput = shadowRoot.getElementById(`${APP_PREFIX}authorCn`);
        const titleViInput = shadowRoot.getElementById(`${APP_PREFIX}titleVi`);
        const authorCheckBtn = shadowRoot.getElementById(`${APP_PREFIX}authorCheck`);
        const applyBtn = shadowRoot.getElementById(`${APP_PREFIX}apply`);
        const sourceUrlInput = shadowRoot.getElementById(`${APP_PREFIX}url`);
        const jjwxcApiModeBtn = shadowRoot.getElementById(`${APP_PREFIX}jjwxcApiMode`);

        const setDataActionButtonsEnabled = (enabled) => {
            const ready = !!enabled;
            if (recomputeBtn) {
                recomputeBtn.disabled = !ready;
                recomputeBtn.title = ready ? '' : 'Hãy bấm "Lấy dữ liệu" thành công trước.';
            }
            if (manualAiBtn) {
                manualAiBtn.disabled = !ready;
                manualAiBtn.title = ready ? '' : 'Hãy bấm "Lấy dữ liệu" thành công trước.';
            }
            if (aiBtn) {
                aiBtn.disabled = !ready;
                aiBtn.title = ready ? '' : 'Hãy bấm "Lấy dữ liệu" thành công trước.';
            }
        };

        let applyToastTimer = null;
        const hideApplyToast = () => {
            if (!applyToast) return;
            applyToast.classList.remove('enter');
            applyToast.classList.add('exit');
        };
        const showApplyToast = (message, stateName, autoHideMs) => {
            if (!applyToast) return;
            if (applyToastTimer) {
                clearTimeout(applyToastTimer);
                applyToastTimer = null;
            }
            applyToast.textContent = message || '';
            applyToast.setAttribute('data-state', stateName || 'loading');
            applyToast.classList.remove('exit');
            void applyToast.offsetWidth;
            applyToast.classList.add('enter');
            if (autoHideMs && autoHideMs > 0) {
                applyToastTimer = setTimeout(() => {
                    hideApplyToast();
                    applyToastTimer = null;
                }, autoHideMs);
            }
        };
        const updateApplyToastMessage = (message, stateName = 'loading') => {
            if (!applyToast) return;
            if (applyToast.classList.contains('enter') && applyToast.getAttribute('data-state') === stateName) {
                applyToast.textContent = message || '';
                return;
            }
            showApplyToast(message, stateName);
        };

        const deepClone = (v) => {
            try { return JSON.parse(JSON.stringify(v)); } catch { return null; }
        };
        const normalizeSnapshotText = (v) => T.safeText(v || '').replace(/\r\n/g, '\n');
        let coverSizeDraft = null;
        let multiPickerContext = null;
        let coverMetaReqId = 0;
        let coverMetaDebounce = null;
        let jjwxcApiModeResolver = null;
        const MULTI_PICKER_FIELDS = {
            age: { label: 'Thời đại', inputId: `${APP_PREFIX}age` },
            ending: { label: 'Kết thúc', inputId: `${APP_PREFIX}ending` },
            genre: { label: 'Loại hình', inputId: `${APP_PREFIX}genre` },
            tag: { label: 'Tag', inputId: `${APP_PREFIX}tag` },
        };

        const getMultiPickerField = (key) => MULTI_PICKER_FIELDS[key] || null;
        const getMultiPickerInput = (key) => {
            const field = getMultiPickerField(key);
            return field ? shadowRoot.getElementById(field.inputId) : null;
        };
        const uniqueLabels = (list) => {
            const out = [];
            const seen = new Set();
            (Array.isArray(list) ? list : []).forEach((item) => {
                const label = T.safeText(item);
                if (!label) return;
                const norm = T.normalizeText(label);
                if (!norm || seen.has(norm)) return;
                seen.add(norm);
                out.push(label);
            });
            return out;
        };
        const getStoredJjwxcApiMode = () => normalizeJjwxcApiMode(state.settings?.jjwxcApiMode);
        const getEffectiveJjwxcApiMode = () => getStoredJjwxcApiMode() || JJWXC_API_MODE_NEW;
        const persistJjwxcApiMode = (mode) => {
            const normalized = normalizeJjwxcApiMode(mode);
            const next = normalizeSettings({
                ...(state.settings || {}),
                jjwxcApiMode: normalized,
            });
            saveSettings(next);
            return normalized;
        };
        const updateJjwxcApiModalStatus = () => {
            if (!jjwxcApiStatus) return;
            const stored = getStoredJjwxcApiMode();
            jjwxcApiStatus.textContent = stored
                ? `Đang lưu: ${stored === JJWXC_API_MODE_OLD ? 'Old / API cũ' : 'New / API mới'}`
                : 'Đang lưu: Chưa chọn';
        };
        const resolveJjwxcApiModeModal = (mode) => {
            const chosen = normalizeJjwxcApiMode(mode) || JJWXC_API_MODE_NEW;
            if (jjwxcApiModal) jjwxcApiModal.style.display = 'none';
            const resolver = jjwxcApiModeResolver;
            jjwxcApiModeResolver = null;
            if (typeof resolver === 'function') resolver(chosen);
        };
        const openJjwxcApiModeModal = () => new Promise((resolve) => {
            if (!jjwxcApiModal || !jjwxcPickNew || !jjwxcPickOld) {
                resolve(JJWXC_API_MODE_NEW);
                return;
            }
            jjwxcApiModeResolver = resolve;
            updateJjwxcApiModalStatus();
            jjwxcApiModal.style.display = 'flex';
            const preferred = getEffectiveJjwxcApiMode() === JJWXC_API_MODE_OLD ? jjwxcPickOld : jjwxcPickNew;
            setTimeout(() => preferred?.focus(), 0);
        });
        const updateJjwxcApiModeUi = () => {
            if (!jjwxcApiModeBtn) return;
            const mode = getEffectiveJjwxcApiMode();
            const isJjwxc = detectSource(sourceUrlInput?.value || '')?.type === 'jjwxc';
            jjwxcApiModeBtn.textContent = mode === JJWXC_API_MODE_OLD ? 'Old' : 'New';
            jjwxcApiModeBtn.dataset.mode = mode;
            jjwxcApiModeBtn.classList.toggle('show', isJjwxc);
            if (!isJjwxc) return;
            const hasStored = !!getStoredJjwxcApiMode();
            jjwxcApiModeBtn.title = hasStored
                ? `JJWXC đang dùng API ${mode === JJWXC_API_MODE_OLD ? 'cũ' : 'mới'}. Bấm để đổi nhanh.`
                : `JJWXC chưa chốt API. Hiện mặc định ${mode === JJWXC_API_MODE_OLD ? 'Old' : 'New'}; lần fetch đầu sẽ hỏi, hoặc bấm để đổi ngay.`;
        };
        const ensureJjwxcApiModeSelected = async () => {
            const stored = getStoredJjwxcApiMode();
            if (stored) return stored;
            const chosen = persistJjwxcApiMode(await openJjwxcApiModeModal()) || JJWXC_API_MODE_NEW;
            updateJjwxcApiModeUi();
            if (typeof state.log === 'function') {
                state.log(`JJWXC: đã lưu dùng API ${chosen === JJWXC_API_MODE_OLD ? 'cũ (Old)' : 'mới (New)'}.`, 'info');
            }
            return chosen;
        };

        const getActiveSourceType = () => {
            const current = T.safeText(state.sourceType || '');
            if (current) return current;
            const urlValue = T.safeText(shadowRoot.getElementById(`${APP_PREFIX}url`)?.value || '');
            const detected = detectSource(urlValue);
            return T.safeText(detected?.type || '');
        };
        const getActiveCoverScope = () => {
            const sourceType = getActiveSourceType();
            if (sourceType) {
                const rule = getSiteRule(sourceType);
                return {
                    key: getCurrentCoverScopeKey(sourceType),
                    sourceType,
                    label: rule?.label || rule?.name || sourceType,
                };
            }
            return {
                key: getCurrentCoverScopeKey(''),
                sourceType: '',
                label: 'Chưa nhận diện nguồn',
            };
        };

        const getCurrentCoverSizeConfig = () => getCoverSizeConfig(state.settings, getActiveCoverScope().key);
        const setCurrentCoverSizeConfig = (conf) => {
            const nextSettings = normalizeSettings({ ...(state.settings || {}) });
            const nextMap = { ...(nextSettings.coverSizeByDomain || {}) };
            const scope = getActiveCoverScope();
            nextMap[scope.key] = {
                mode: conf.mode === 'custom' || conf.mode === 'preset560' ? conf.mode : 'original',
                targetWidth: Math.max(1, parseInt(conf.targetWidth, 10) || 560),
                targetHeight: Math.max(1, parseInt(conf.targetHeight, 10) || 788),
                customSizes: Array.isArray(conf.customSizes) ? conf.customSizes : [],
            };
            nextSettings.coverSizeByDomain = nextMap;
            saveSettings(nextSettings);
        };

        const commitDescDraftFromEditor = () => {
            if (!descTextarea) return;
            if (state.descEditorMode === 'zh') {
                state.descDraft.zh = descTextarea.value || '';
            } else {
                state.descDraft.vi = descTextarea.value || '';
            }
        };

        const updateDescToggleUi = () => {
            if (!descToggleBtn) return;
            const isZh = state.descEditorMode === 'zh';
            const current = isZh ? 'ZH' : 'VI';
            const next = isZh ? 'VI' : 'ZH';
            descToggleBtn.textContent = isZh ? 'Vi' : 'Zh';
            descToggleBtn.title = `Đang sửa mô tả ${current}, bấm để chuyển sang ${next}`;
            if (descLabelText) {
                descLabelText.textContent = isZh ? 'Mô tả gốc (ZH)' : 'Mô tả dịch (VI)';
            }
            if (descTextarea) {
                descTextarea.placeholder = isZh
                    ? 'Mô tả gốc (ZH) - có thể chỉnh trực tiếp'
                    : 'Mô tả dịch (VI) - có thể chỉnh trực tiếp';
            }
        };

        const renderDescDraftToEditor = () => {
            if (!descTextarea) return;
            const nextValue = state.descEditorMode === 'zh'
                ? (state.descDraft.zh || '')
                : (state.descDraft.vi || '');
            descTextarea.value = nextValue;
            updateDescToggleUi();
        };

        const setDescEditorMode = (mode) => {
            const nextMode = mode === 'zh' ? 'zh' : 'vi';
            commitDescDraftFromEditor();
            state.descEditorMode = nextMode;
            renderDescDraftToEditor();
        };

        const syncSourceDraftFromInputs = () => {
            commitDescDraftFromEditor();
            const titleCnNow = T.safeText(shadowRoot.getElementById(`${APP_PREFIX}titleCn`)?.value || '');
            const descCnNow = T.safeText(state.descDraft.zh || '');
            if (state.sourceData) {
                state.sourceData.titleCn = titleCnNow;
                state.sourceData.descCn = descCnNow;
            }
            state.translated = state.translated || {};
            state.translated.desc = state.descDraft.vi || '';
            const titleViNow = T.safeText(shadowRoot.getElementById(`${APP_PREFIX}titleVi`)?.value || '');
            if (titleViNow) state.translated.titleVi = titleViNow;
        };

        const formatCoverSize = (w, h) => {
            const wi = parseInt(w, 10);
            const hi = parseInt(h, 10);
            if (!Number.isFinite(wi) || !Number.isFinite(hi) || wi < 1 || hi < 1) return '-';
            return `${wi}x${hi}`;
        };

        const updateCoverSizeSummary = () => {
            if (!coverSizeSettingSummary) return;
            const scope = getActiveCoverScope();
            const conf = getCurrentCoverSizeConfig();
            const prefix = scope.sourceType
                ? `Nguồn: ${scope.label}`
                : 'Nguồn: Chưa nhận diện';
            if (conf.mode === 'preset560') {
                coverSizeSettingSummary.textContent = `${prefix} • Đang dùng: 560x788`;
                return;
            }
            if (conf.mode === 'custom') {
                coverSizeSettingSummary.textContent = `${prefix} • Đang dùng: ${formatCoverSize(conf.targetWidth, conf.targetHeight)}`;
                return;
            }
            coverSizeSettingSummary.textContent = `${prefix} • Đang dùng: Gốc`;
        };

        const updateCoverSizeTag = () => {
            if (!coverSizeTag) return;
            const sourceUrl = T.safeText(coverUrlInput?.value || '');
            const target = getCoverTargetSize(state.settings, getActiveCoverScope().key);
            const orig = state.coverMeta.original;
            const shouldHide = !sourceUrl && !orig && !state.coverMeta.loading;
            coverSizeTag.style.display = shouldHide ? 'none' : 'inline-flex';
            if (shouldHide) {
                coverSizeTag.textContent = '';
                return;
            }
            if (state.coverMeta.loading) {
                coverSizeTag.textContent = 'Đang đọc WxH...';
                return;
            }
            if (orig && target) {
                coverSizeTag.textContent = `${orig.width}x${orig.height} → ${target.width}x${target.height}`;
                return;
            }
            if (orig) {
                coverSizeTag.textContent = `${orig.width}x${orig.height}`;
                return;
            }
            if (target) {
                coverSizeTag.textContent = `Gốc → ${target.width}x${target.height}`;
                return;
            }
            coverSizeTag.textContent = '-';
        };

        const updateCoverOriginalHint = () => {
            if (!coverSizeOriginal) return;
            if (state.coverMeta.loading) {
                coverSizeOriginal.textContent = 'Ảnh gốc: đang đọc kích thước...';
                return;
            }
            if (state.coverMeta.original) {
                coverSizeOriginal.textContent = `Ảnh gốc: ${state.coverMeta.original.width}x${state.coverMeta.original.height}`;
                return;
            }
            if (state.coverMeta.error) {
                coverSizeOriginal.textContent = `Ảnh gốc: không đọc được (${state.coverMeta.error})`;
                return;
            }
            coverSizeOriginal.textContent = 'Ảnh gốc: chưa có dữ liệu.';
        };

        const readImageSizeFromUrl = (url) => new Promise((resolve, reject) => {
            const src = T.safeText(url);
            if (!src) {
                reject(new Error('URL ảnh trống'));
                return;
            }
            fetchCoverBlob(src)
                .then(loadImageFromBlob)
                .then((img) => {
                    const width = img.naturalWidth || img.width || 0;
                    const height = img.naturalHeight || img.height || 0;
                    if (!width || !height) {
                        reject(new Error('Không đọc được kích thước ảnh'));
                        return;
                    }
                    resolve({ width, height });
                })
                .catch((err) => {
                    reject(err instanceof Error ? err : new Error('Không tải được ảnh'));
                });
        });

        const refreshCoverMeta = (url) => {
            const src = T.safeText(url);
            const reqId = ++coverMetaReqId;
            if (!src) {
                state.coverMeta = { original: null, loading: false, error: '' };
                updateCoverSizeTag();
                updateCoverSizeSummary();
                updateCoverOriginalHint();
                return;
            }
            state.coverMeta.loading = true;
            state.coverMeta.error = '';
            updateCoverSizeTag();
            updateCoverOriginalHint();
            readImageSizeFromUrl(src)
                .then((size) => {
                    if (reqId !== coverMetaReqId) return;
                    state.coverMeta.original = size;
                    state.coverMeta.loading = false;
                    state.coverMeta.error = '';
                    updateCoverSizeTag();
                    updateCoverOriginalHint();
                })
                .catch((err) => {
                    if (reqId !== coverMetaReqId) return;
                    state.coverMeta.original = null;
                    state.coverMeta.loading = false;
                    state.coverMeta.error = err.message || 'Không đọc được kích thước ảnh';
                    updateCoverSizeTag();
                    updateCoverOriginalHint();
                });
        };

        const buildRecomputeSnapshot = () => {
            commitDescDraftFromEditor();
            return {
                nameSet: normalizeSnapshotText(shadowRoot.getElementById(`${APP_PREFIX}nameSet`)?.value || ''),
                titleCn: normalizeSnapshotText(shadowRoot.getElementById(`${APP_PREFIX}titleCn`)?.value || ''),
                descCn: normalizeSnapshotText(state.descDraft.zh || ''),
                extraKeywords: normalizeSnapshotText(shadowRoot.getElementById(`${APP_PREFIX}extraKeywords`)?.value || ''),
            };
        };

        const getRecomputeChanges = () => {
            const baseline = state.recomputeBaseline;
            if (!baseline) return [];
            const current = buildRecomputeSnapshot();
            const checks = [
                { key: 'nameSet', label: 'Bộ name' },
                { key: 'titleCn', label: 'Tên gốc (CN)' },
                { key: 'descCn', label: 'Văn án (ZH)' },
            ];
            if (!baseline.aiUsed) checks.push({ key: 'extraKeywords', label: 'Từ khóa bổ sung' });
            return checks.filter(item => current[item.key] !== baseline.snapshot[item.key]).map(item => item.key);
        };

        const keyToChangeLabel = (key) => ({
            nameSet: 'Bộ name',
            titleCn: 'Tên gốc (CN)',
            descCn: 'Văn án (ZH)',
            extraKeywords: 'Từ khóa bổ sung',
        }[key] || key);

        const updateRecomputeNotice = () => {
            if (!recomputeNoticeEl) return;
            const changes = getRecomputeChanges();
            if (!changes.length) {
                recomputeNoticeEl.classList.remove('show');
                recomputeNoticeEl.textContent = '';
                return;
            }
            const labels = changes.map(keyToChangeLabel).join(', ');
            recomputeNoticeEl.textContent = `Đã thay đổi: ${labels}. Hãy bấm Recompute để cập nhật.`;
            recomputeNoticeEl.classList.add('show');
        };

        const setDuplicateSafety = (score, tone = 'idle', reason = '') => {
            const check = state.duplicateCheck || {};
            check.safetyScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null;
            check.safetyTone = tone || 'idle';
            check.safetyReason = T.safeText(reason || '');
            if (!duplicateSafetyEl) return;
            const shouldShow = isEmbedPage() && Number.isFinite(check.safetyScore);
            duplicateSafetyEl.classList.toggle('show', shouldShow);
            const hue = Number.isFinite(check.safetyScore) ? Math.round((check.safetyScore / 100) * 120) : 210;
            duplicateSafetyEl.style.setProperty('--wda-safety-h', String(hue));
            duplicateSafetyEl.style.setProperty('--wda-safety-h2', String(Math.min(140, hue + 18)));
            duplicateSafetyEl.style.setProperty(
                '--wda-safety-shadow',
                check.safetyTone === 'pending'
                    ? '0 16px 30px rgba(59, 130, 246, 0.26)'
                    : `0 16px 30px hsla(${Math.max(0, hue - 6)}, 80%, 46%, ${check.safetyScore <= 25 ? 0.3 : 0.22})`
            );
            duplicateSafetyEl.dataset.tone = check.safetyTone === 'pending' ? 'pending' : 'score';
            duplicateSafetyEl.textContent = shouldShow ? `🛡 ${check.safetyScore}%` : '--';
            duplicateSafetyEl.title = check.safetyReason || '';
            syncDuplicateSafetyPosition();
        };

        const syncDuplicateSafetyPosition = () => {
            if (!duplicateSafetyEl) return;
            duplicateSafetyEl.style.left = '';
            duplicateSafetyEl.style.top = '';
            duplicateSafetyEl.style.display = '';
        };

        const resetDuplicateCheckState = () => {
            state.duplicateCheck = {
                pending: false,
                blocked: false,
                runId: state.duplicateCheck?.runId || 0,
                lastKey: '',
                checked: false,
                failed: false,
                deepPending: false,
                deepChecked: false,
                deepPossibleDuplicate: false,
                deepCandidate: null,
                hasMoreAuthorPages: false,
                authorPageUrl: '',
                safetyScore: null,
                safetyTone: 'idle',
                safetyReason: '',
            };
            setDuplicateSafety(null, 'idle', '');
            try { closeDeepDuplicateModal(); } catch { }
        };

        const setRecomputeBaseline = (aiUsed) => {
            state.recomputeBaseline = {
                aiUsed: !!aiUsed,
                snapshot: buildRecomputeSnapshot(),
                at: Date.now(),
            };
            updateRecomputeNotice();
        };

        const setDescDrafts = (zhText, viText) => {
            state.descDraft.zh = zhText || '';
            state.descDraft.vi = viText || '';
            state.descEditorMode = 'vi';
            renderDescDraftToEditor();
        };

        const getCurrentAiManagedValues = () => ({
            official: shadowRoot.getElementById(`${APP_PREFIX}official`)?.value || '',
            gender: shadowRoot.getElementById(`${APP_PREFIX}gender`)?.value || '',
            age: parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}age`)?.value || ''),
            ending: parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}ending`)?.value || ''),
            genre: parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}genre`)?.value || ''),
            tag: parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}tag`)?.value || ''),
        });

        const getAiManagedDiffKeys = (base, current) => {
            const b = base || {};
            const c = current || {};
            const out = [];
            if (normalizeCompareText(b.official || '') !== normalizeCompareText(c.official || '')) out.push('official');
            if (normalizeCompareText(b.gender || '') !== normalizeCompareText(c.gender || '')) out.push('gender');
            if (!arraysEqualNormalized(b.age || [], c.age || [])) out.push('age');
            if (!arraysEqualNormalized(b.ending || [], c.ending || [])) out.push('ending');
            if (!arraysEqualNormalized(b.genre || [], c.genre || [])) out.push('genre');
            if (!arraysEqualNormalized(b.tag || [], c.tag || [])) out.push('tag');
            return out;
        };

        const aiManagedKeyLabel = (key) => ({
            official: 'Tính chất',
            gender: 'Giới tính',
            age: 'Thời đại',
            ending: 'Kết thúc',
            genre: 'Thể loại',
            tag: 'Tag',
        }[key] || key);

        const normalizeCustomSizes = (list) => {
            const seen = new Set();
            const out = [];
            (Array.isArray(list) ? list : []).forEach((item) => {
                const w = Math.max(1, parseInt(item?.w, 10) || 0);
                const h = Math.max(1, parseInt(item?.h, 10) || 0);
                if (!w || !h) return;
                const key = `${w}x${h}`;
                if (seen.has(key)) return;
                seen.add(key);
                out.push({ w, h });
            });
            return out;
        };

        const normalizeCoverDraft = (conf) => {
            const normalized = {
                mode: conf?.mode === 'custom' || conf?.mode === 'preset560' ? conf.mode : 'original',
                targetWidth: Math.max(1, parseInt(conf?.targetWidth, 10) || 560),
                targetHeight: Math.max(1, parseInt(conf?.targetHeight, 10) || 788),
                customSizes: normalizeCustomSizes(conf?.customSizes || []),
            };
            if (normalized.mode === 'custom') {
                const hasTarget = normalized.customSizes.some((item) => item.w === normalized.targetWidth && item.h === normalized.targetHeight);
                if (!hasTarget) {
                    normalized.customSizes.push({ w: normalized.targetWidth, h: normalized.targetHeight });
                }
            }
            return normalized;
        };

        const closeCoverSizeModal = () => {
            if (coverSizeModal) coverSizeModal.style.display = 'none';
        };

        const renderCoverSizeModal = () => {
            if (!coverSizeDraft || !coverSizeList) return;
            coverSizeDraft = normalizeCoverDraft(coverSizeDraft);
            coverSizeList.innerHTML = '';

            const selectedMode = coverSizeDraft.mode;
            const selectedW = Math.max(1, parseInt(coverSizeDraft.targetWidth, 10) || 560);
            const selectedH = Math.max(1, parseInt(coverSizeDraft.targetHeight, 10) || 788);
            const entries = [
                { key: 'original', label: 'Giữ nguyên ảnh gốc', mode: 'original', w: 0, h: 0, deletable: false },
                { key: 'preset560', label: 'Preset 560x788', mode: 'preset560', w: 560, h: 788, deletable: false },
                ...coverSizeDraft.customSizes.map((item, idx) => ({
                    key: `custom_${idx}`,
                    label: `Tùy chỉnh ${item.w}x${item.h}`,
                    mode: 'custom',
                    w: item.w,
                    h: item.h,
                    deletable: true,
                    customIndex: idx,
                })),
            ];

            entries.forEach((entry) => {
                const row = document.createElement('label');
                row.className = `${APP_PREFIX}cover-size-item`;

                const left = document.createElement('div');
                left.style.display = 'inline-flex';
                left.style.alignItems = 'center';
                left.style.gap = '8px';

                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `${APP_PREFIX}coverSizeMode`;
                radio.value = entry.key;
                radio.checked = selectedMode === entry.mode
                    && (entry.mode !== 'custom' || (entry.w === selectedW && entry.h === selectedH));
                radio.addEventListener('change', () => {
                    if (!radio.checked) return;
                    if (entry.mode === 'original') {
                        coverSizeDraft.mode = 'original';
                    } else if (entry.mode === 'preset560') {
                        coverSizeDraft.mode = 'preset560';
                        coverSizeDraft.targetWidth = 560;
                        coverSizeDraft.targetHeight = 788;
                    } else {
                        coverSizeDraft.mode = 'custom';
                        coverSizeDraft.targetWidth = entry.w;
                        coverSizeDraft.targetHeight = entry.h;
                    }
                    renderCoverSizeModal();
                });
                left.appendChild(radio);

                const text = document.createElement('span');
                text.textContent = entry.label;
                left.appendChild(text);
                row.appendChild(left);

                if (entry.deletable) {
                    const delBtn = document.createElement('button');
                    delBtn.type = 'button';
                    delBtn.className = `${APP_PREFIX}tiny-btn`;
                    delBtn.textContent = 'Xóa';
                    delBtn.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        const next = coverSizeDraft.customSizes.filter((_, i) => i !== entry.customIndex);
                        coverSizeDraft.customSizes = next;
                        const wasSelected = coverSizeDraft.mode === 'custom'
                            && coverSizeDraft.targetWidth === entry.w
                            && coverSizeDraft.targetHeight === entry.h;
                        if (wasSelected) {
                            coverSizeDraft.mode = 'original';
                        }
                        renderCoverSizeModal();
                    });
                    row.appendChild(delBtn);
                } else {
                    const spacer = document.createElement('span');
                    spacer.style.width = '46px';
                    row.appendChild(spacer);
                }

                coverSizeList.appendChild(row);
            });
        };

        const openCoverSizeModal = () => {
            if (!coverSizeModal) return;
            coverSizeDraft = normalizeCoverDraft(deepClone(getCurrentCoverSizeConfig()) || getDefaultCoverSizeConfig());
            const currentCoverUrl = T.safeText(coverUrlInput?.value || '');
            if (currentCoverUrl) {
                refreshCoverMeta(currentCoverUrl);
            }
            const scope = getActiveCoverScope();
            if (coverSizeDomain) {
                coverSizeDomain.textContent = `Nguồn hiện tại: ${scope.label}`;
            }
            updateCoverOriginalHint();
            renderCoverSizeModal();
            coverSizeModal.style.display = 'flex';
        };

        const closeMultiPickerModal = () => {
            if (multiPickerModal) multiPickerModal.style.display = 'none';
            if (multiPickerSearch) multiPickerSearch.value = '';
            if (multiPickerList) multiPickerList.innerHTML = '';
            if (multiPickerMeta) multiPickerMeta.textContent = '';
            multiPickerContext = null;
        };

        const updateMultiPickerMeta = () => {
            if (!multiPickerMeta || !multiPickerContext) return;
            const optionNorms = new Set((multiPickerContext.options || []).map(label => T.normalizeText(label)).filter(Boolean));
            let selectedFromWeb = 0;
            multiPickerContext.selectedMap.forEach((_, norm) => {
                if (optionNorms.has(norm)) selectedFromWeb++;
            });
            const customCount = Math.max(0, multiPickerContext.selectedMap.size - selectedFromWeb);
            multiPickerMeta.textContent = `Đã chọn ${multiPickerContext.selectedMap.size} • Từ web ${selectedFromWeb}/${multiPickerContext.options.length}${customCount ? ` • Nhập tay ${customCount}` : ''}`;
        };

        const renderMultiPickerList = () => {
            if (!multiPickerList || !multiPickerContext) return;
            multiPickerList.innerHTML = '';
            const query = T.normalizeText(multiPickerSearch?.value || '');
            const source = multiPickerContext.options || [];
            const rows = query ? source.filter(label => T.normalizeText(label).includes(query)) : source;

            if (!rows.length) {
                const empty = document.createElement('div');
                empty.className = `${APP_PREFIX}multi-picker-empty`;
                empty.textContent = source.length
                    ? 'Không có nhãn khớp từ khóa.'
                    : 'Chưa đọc được danh sách nhãn từ web cho mục này.';
                multiPickerList.appendChild(empty);
                updateMultiPickerMeta();
                return;
            }

            rows.forEach((label) => {
                const norm = T.normalizeText(label);
                const row = document.createElement('label');
                row.className = `${APP_PREFIX}multi-picker-item`;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = multiPickerContext.selectedMap.has(norm);
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) multiPickerContext.selectedMap.set(norm, label);
                    else multiPickerContext.selectedMap.delete(norm);
                    updateMultiPickerMeta();
                });

                const text = document.createElement('span');
                text.textContent = label;

                row.appendChild(checkbox);
                row.appendChild(text);
                multiPickerList.appendChild(row);
            });
            updateMultiPickerMeta();
        };

        const openMultiPicker = (key) => {
            const field = getMultiPickerField(key);
            if (!field || !multiPickerModal) return;
            state.groups = getGroupOptions();
            const options = uniqueLabels((state.groups?.[key] || []).map(opt => opt.label));
            const inputEl = getMultiPickerInput(key);
            const current = parseLabelList(inputEl?.value || '');
            const optionMap = new Map(options.map(label => [T.normalizeText(label), label]));
            const selectedMap = new Map();
            current.forEach((label) => {
                const raw = T.safeText(label);
                if (!raw) return;
                const norm = T.normalizeText(raw);
                if (!norm) return;
                selectedMap.set(norm, optionMap.get(norm) || raw);
            });

            multiPickerContext = {
                key,
                field,
                options,
                selectedMap,
            };
            if (multiPickerTitle) multiPickerTitle.textContent = `Chọn ${field.label}`;
            if (multiPickerSearch) multiPickerSearch.value = '';
            renderMultiPickerList();
            multiPickerModal.style.display = 'flex';
            setTimeout(() => multiPickerSearch?.focus(), 0);
        };

        const scheduleCoverMetaRefresh = (url) => {
            if (coverMetaDebounce) clearTimeout(coverMetaDebounce);
            coverMetaDebounce = setTimeout(() => {
                coverMetaDebounce = null;
                refreshCoverMeta(url);
            }, 260);
        };

        const getCurrentFormValues = () => {
            const groups = state.groups || getGroupOptions();
            const getSelectedRadio = (name) => {
                const opt = groups[name]?.find(item => item.input.checked);
                return opt ? opt.label : '';
            };
            const getChecked = (name) => {
                return (groups[name] || []).filter(item => item.input.checked).map(item => item.label);
            };
            const coverFromImg = document.getElementById('imgCover')?.getAttribute('src') || '';
            const coverInput = document.getElementById('imgUrl')?.value || '';
            const moreLinkDesc = document.querySelector('input[name="moreLinkDesc"]')?.value || '';
            const moreLinkUrl = document.querySelector('input[name="moreLinkUrl"]')?.value || '';
            return {
                titleCn: document.getElementById('txtTitleCn')?.value || '',
                authorCn: document.getElementById('txtAuthorCn')?.value || '',
                titleVi: document.getElementById('txtTitleVi')?.value || '',
                descVi: document.getElementById('txtDescVi')?.value || '',
                coverUrl: coverInput || coverFromImg,
                status: getSelectedRadio('status'),
                official: getSelectedRadio('official'),
                gender: getSelectedRadio('gender'),
                age: getChecked('age'),
                ending: getChecked('ending'),
                genre: getChecked('genre'),
                tag: getChecked('tag'),
                moreLink: `${moreLinkDesc} | ${moreLinkUrl}`.trim(),
            };
        };

        const getPlannedValues = () => {
            commitDescDraftFromEditor();
            const titleCn = shadowRoot.getElementById(`${APP_PREFIX}titleCn`)?.value || '';
            const authorCn = shadowRoot.getElementById(`${APP_PREFIX}authorCn`)?.value || '';
            const titleVi = shadowRoot.getElementById(`${APP_PREFIX}titleVi`)?.value || '';
            const descVi = state.descDraft.vi || '';
            const coverUrl = shadowRoot.getElementById(`${APP_PREFIX}coverUrl`)?.value || '';
            const statusSel = shadowRoot.getElementById(`${APP_PREFIX}status`)?.value || '';
            const officialSel = shadowRoot.getElementById(`${APP_PREFIX}official`)?.value || '';
            const genderSel = shadowRoot.getElementById(`${APP_PREFIX}gender`)?.value || '';
            const ageList = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}age`)?.value || '');
            const endingList = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}ending`)?.value || '');
            const genreList = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}genre`)?.value || '');
            const tagList = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}tag`)?.value || '');
            const sourceUrl = shadowRoot.getElementById(`${APP_PREFIX}url`)?.value || '';
            const moreLinkDesc = shadowRoot.getElementById(`${APP_PREFIX}moreLinkDesc`)?.value || '';
            const moreLinkUrl = shadowRoot.getElementById(`${APP_PREFIX}moreLinkUrl`)?.value || '';
            const sourceLabel = state.sourceLabel || 'Nguồn';
            const finalLinkDesc = T.safeText(moreLinkDesc) || sourceLabel;
            const finalLinkUrl = T.safeText(moreLinkUrl) || sourceUrl;
            return {
                titleCn,
                authorCn,
                titleVi,
                descVi,
                coverUrl,
                status: statusSel || state.suggestions?.status || '',
                official: officialSel || state.suggestions?.official || '',
                gender: genderSel || state.suggestions?.gender || '',
                age: ageList.length ? ageList : state.suggestions?.age || [],
                ending: endingList.length ? endingList : state.suggestions?.ending || [],
                genre: genreList.length ? genreList : state.suggestions?.genre || [],
                tag: tagList.length ? tagList : state.suggestions?.tag || [],
                moreLink: `${finalLinkDesc} | ${finalLinkUrl}`.trim(),
            };
        };

        const updateMatchIndicators = () => {
            if (!isEditPage()) return;
            const current = getCurrentFormValues();
            const planned = getPlannedValues();
            const badges = shadowRoot.querySelectorAll(`.${APP_PREFIX}match[data-key]`);
            badges.forEach((el) => {
                const key = el.getAttribute('data-key');
                const curVal = current[key];
                const newVal = planned[key];
                let match = false;
                if (Array.isArray(curVal) || Array.isArray(newVal)) {
                    match = arraysEqualNormalized(Array.isArray(curVal) ? curVal : [], Array.isArray(newVal) ? newVal : []);
                } else {
                    match = normalizeCompareText(curVal) === normalizeCompareText(newVal);
                }
                el.classList.remove('ok', 'bad', 'na');
                if (normalizeCompareText(curVal) === '' && normalizeCompareText(newVal) === '') {
                    el.textContent = '—';
                    el.classList.add('na');
                    el.title = 'Chưa có dữ liệu để so khớp';
                    return;
                }
                el.textContent = match ? '✔' : '✖';
                el.classList.add(match ? 'ok' : 'bad');
                el.title = match ? 'Khớp với web hiện tại' : `Không khớp web.\nWeb: ${curVal}\nTool: ${newVal}`;
            });
        };

        const getExcludeConfigForPage = () => {
            if (!state.excludeConfig || typeof state.excludeConfig !== 'object') {
                state.excludeConfig = loadExcludeConfig(showEditExtras);
            }
            return state.excludeConfig;
        };
        const saveExcludeConfigForPage = () => {
            saveExcludeConfig(showEditExtras, getExcludeConfigForPage());
        };
        const getExcludeScopeId = () => (excludeScope?.value || EXCLUDE_SCOPE_ALL);
        const getExcludesForApply = () => {
            const cfg = getExcludeConfigForPage();
            const sourceId = state.sourceType || '';
            return sourceId ? getEffectiveExcludes(cfg, sourceId) : (cfg.all || {});
        };

        const renderExcludeScopeOptions = () => {
            if (!excludeScope) return;
            const prev = excludeScope.value || '';
            const options = [
                { id: EXCLUDE_SCOPE_ALL, label: 'Tất cả nguồn' },
                ...SITE_RULES.map(rule => ({ id: rule.id, label: rule.label || rule.name || rule.id })),
            ];
            excludeScope.innerHTML = options.map(opt => `<option value="${opt.id}">${escapeHtml(opt.label)}</option>`).join('');

            const wanted = prev
                || (!showEditExtras && state.hasFetchedData && state.sourceType ? state.sourceType : EXCLUDE_SCOPE_ALL);
            excludeScope.value = options.some(o => o.id === wanted) ? wanted : EXCLUDE_SCOPE_ALL;
        };

        const renderExcludeList = () => {
            if (!excludeList) return;
            const cfg = getExcludeConfigForPage();
            const scopeId = getExcludeScopeId();
            const effective = scopeId === EXCLUDE_SCOPE_ALL ? (cfg.all || {}) : getEffectiveExcludes(cfg, scopeId);

            excludeList.innerHTML = '';
            EDIT_FIELDS.forEach((field) => {
                const row = document.createElement('label');
                row.className = `${APP_PREFIX}settings-item`;
                row.style.gap = '10px';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = !!effective[field.key];
                checkbox.dataset.key = field.key;
                const span = document.createElement('span');
                span.textContent = field.label;
                row.appendChild(checkbox);
                row.appendChild(span);
                excludeList.appendChild(row);
            });

            if (excludeReset) {
                const canReset = scopeId !== EXCLUDE_SCOPE_ALL && !!(cfg.sources && cfg.sources[scopeId]);
                excludeReset.style.display = scopeId === EXCLUDE_SCOPE_ALL ? 'none' : 'inline-flex';
                excludeReset.disabled = !canReset;
                excludeReset.title = canReset ? '' : 'Nguồn này đang dùng theo "Tất cả".';
            }
        };

        const escapeHtml = (str) => T.safeText(str).replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[ch]));

        const diffTextHtml = (oldText, newText) => {
            const normalizeNewlines = (text) => (text || '').toString().replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n');
            const tokenize = (text) => {
                const raw = normalizeNewlines(text);
                const lines = raw.split(/\r?\n/);
                const tokens = [];
                lines.forEach((line, idx) => {
                    const words = line.split(/\s+/).filter(Boolean);
                    words.forEach((word) => tokens.push({ type: 'word', value: word }));
                    if (idx < lines.length - 1) tokens.push({ type: 'nl', value: '\n' });
                });
                return tokens;
            };
            const a = tokenize(oldText);
            const b = tokenize(newText);
            const n = a.length;
            const m = b.length;
            const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
            for (let i = n - 1; i >= 0; i--) {
                for (let j = m - 1; j >= 0; j--) {
                    if (a[i].type === b[j].type && a[i].value === b[j].value) dp[i][j] = dp[i + 1][j + 1] + 1;
                    else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
                }
            }
            const oldParts = [];
            const newParts = [];
            let i = 0;
            let j = 0;
            while (i < n && j < m) {
                if (a[i].type === b[j].type && a[i].value === b[j].value) {
                    oldParts.push({ type: a[i].type, value: a[i].value, kind: 'eq' });
                    newParts.push({ type: b[j].type, value: b[j].value, kind: 'eq' });
                    i++;
                    j++;
                } else if (dp[i + 1][j] >= dp[i][j + 1]) {
                    oldParts.push({ type: a[i].type, value: a[i].value, kind: 'del' });
                    i++;
                } else {
                    newParts.push({ type: b[j].type, value: b[j].value, kind: 'ins' });
                    j++;
                }
            }
            while (i < n) {
                oldParts.push({ type: a[i].type, value: a[i].value, kind: 'del' });
                i++;
            }
            while (j < m) {
                newParts.push({ type: b[j].type, value: b[j].value, kind: 'ins' });
                j++;
            }
            const renderTokens = (tokens) => {
                const out = [];
                for (let idx = 0; idx < tokens.length; idx++) {
                    const tok = tokens[idx];
                    if (tok.type === 'nl') {
                        out.push('\n');
                        continue;
                    }
                    const escaped = escapeHtml(tok.value);
                    let rendered = escaped;
                    if (tok.kind === 'del') rendered = `<span class="${APP_PREFIX}diff-del">${escaped}</span>`;
                    if (tok.kind === 'ins') rendered = `<span class="${APP_PREFIX}diff-ins">${escaped}</span>`;
                    out.push(rendered);
                    const next = tokens[idx + 1];
                    if (next && next.type === 'word') out.push(' ');
                }
                return out.join('');
            };
            return { oldHtml: renderTokens(oldParts), newHtml: renderTokens(newParts) };
        };

        const renderDiffTable = (diffs) => {
            if (!diffBody) return;
            diffBody.innerHTML = diffs.map((item) => {
                let oldHtml = item.type === 'list' ? item.oldHtml : escapeHtml(item.old || '');
                let newHtml = item.type === 'list' ? item.newHtml : escapeHtml(item.new || '');
                if (item.key === 'descVi') {
                    const diffText = diffTextHtml(item.old || '', item.new || '');
                    oldHtml = `<div class="${APP_PREFIX}diff-text">${diffText.oldHtml || ''}</div>`;
                    newHtml = `<div class="${APP_PREFIX}diff-text">${diffText.newHtml || ''}</div>`;
                }
                const oldClass = item.changed ? `${APP_PREFIX}diff-old change` : `${APP_PREFIX}diff-old`;
                const newClass = item.changed ? `${APP_PREFIX}diff-new change` : `${APP_PREFIX}diff-new`;
                const oldCell = oldHtml ? oldHtml : `<span class="${APP_PREFIX}diff-chip ${APP_PREFIX}diff-neutral">Trống</span>`;
                const newCell = newHtml ? newHtml : `<span class="${APP_PREFIX}diff-chip ${APP_PREFIX}diff-neutral">Trống</span>`;
                return `
                    <div class="${APP_PREFIX}diff-row">
                        <div class="${APP_PREFIX}diff-label">${escapeHtml(item.label)}</div>
                        <div class="${APP_PREFIX}diff-col ${oldClass}">
                            <div class="${APP_PREFIX}diff-col-title">Hiện tại</div>
                            ${oldCell}
                        </div>
                        <div class="${APP_PREFIX}diff-col ${newClass}">
                            <div class="${APP_PREFIX}diff-col-title">Sau khi áp</div>
                            ${newCell}
                        </div>
                    </div>
                `;
            }).join('');
        };

        let pendingDiffResolve = null;
        const showDiffModal = (diffs) => {
            renderDiffTable(diffs);
            if (!diffModal) return Promise.resolve(true);
            diffModal.style.display = 'flex';
            return new Promise((resolve) => {
                pendingDiffResolve = resolve;
            });
        };

        const buildListDiff = (oldList, newList) => {
            const oldNorm = normalizeCompareList(oldList);
            const newNorm = normalizeCompareList(newList);
            const oldMap = new Map();
            (oldList || []).forEach((item) => oldMap.set(normalizeText(item), item));
            const newMap = new Map();
            (newList || []).forEach((item) => newMap.set(normalizeText(item), item));
            const oldSet = new Set(oldNorm);
            const newSet = new Set(newNorm);
            const removed = oldNorm.filter(v => !newSet.has(v)).map(v => oldMap.get(v) || v);
            const added = newNorm.filter(v => !oldSet.has(v)).map(v => newMap.get(v) || v);
            const kept = oldNorm.filter(v => newSet.has(v)).map(v => oldMap.get(v) || v);
            const changed = removed.length > 0 || added.length > 0;
            const oldHtml = changed
                ? [
                    ...kept.map(v => `<span class="${APP_PREFIX}diff-chip">${escapeHtml(v)}</span>`),
                    ...removed.map(v => `<span class="${APP_PREFIX}diff-chip ${APP_PREFIX}diff-remove">${escapeHtml(v)}</span>`),
                ].join(' ')
                : kept.map(v => `<span class="${APP_PREFIX}diff-chip ${APP_PREFIX}diff-neutral">${escapeHtml(v)}</span>`).join(' ');
            const newHtml = changed
                ? [
                    ...kept.map(v => `<span class="${APP_PREFIX}diff-chip">${escapeHtml(v)}</span>`),
                    ...added.map(v => `<span class="${APP_PREFIX}diff-chip ${APP_PREFIX}diff-add">${escapeHtml(v)}</span>`),
                ].join(' ')
                : kept.map(v => `<span class="${APP_PREFIX}diff-chip ${APP_PREFIX}diff-neutral">${escapeHtml(v)}</span>`).join(' ');
            return { oldHtml, newHtml, changed };
        };

        const buildDiffs = (current, planned, excludes) => {
            return EDIT_FIELDS.filter(f => !excludes?.[f.key]).map((field) => {
                const curVal = current[field.key];
                const newVal = planned[field.key];
                if (field.type === 'checkbox') {
                    const diff = buildListDiff(curVal, newVal);
                    return {
                        key: field.key,
                        label: field.label,
                        type: 'list',
                        oldHtml: diff.oldHtml || '-',
                        newHtml: diff.newHtml || '-',
                        changed: diff.changed,
                    };
                }
                const changed = normalizeCompareText(curVal) !== normalizeCompareText(newVal);
                return {
                    key: field.key,
                    label: field.label,
                    type: 'text',
                    old: curVal || '',
                    new: newVal || '',
                    changed,
                };
            });
        };

        const renderDomainConfig = () => {
            if (!domainConfig) return;
            domainConfig.innerHTML = `
                <div style="font-weight:bold; border-bottom:1px solid #eee; color:#666;">Nguồn</div>
                <div style="font-weight:bold; border-bottom:1px solid #eee; color:#666; text-align:center;">Quét</div>
                <div style="font-weight:bold; border-bottom:1px solid #eee; color:#666; text-align:center;">Gán nhãn</div>
                <div style="font-weight:bold; border-bottom:1px solid #eee; color:#666;">Hiển thị</div>
            `;
            SITE_RULES.forEach((rule) => {
                const def = DEFAULT_SETTINGS.domainSettings[rule.id] || {};
                const labelText = def.label || rule.name || rule.id;

                const label = document.createElement('div');
                label.textContent = labelText;

                const descWrap = document.createElement('div');
                descWrap.style.textAlign = 'center';
                const descInput = document.createElement('input');
                descInput.type = 'checkbox';
                descInput.id = `${APP_PREFIX}confDesc_${rule.id}`;
                descInput.title = 'Quét văn án';
                descWrap.appendChild(descInput);

                const tagWrap = document.createElement('div');
                tagWrap.style.textAlign = 'center';
                const tagInput = document.createElement('input');
                tagInput.type = 'checkbox';
                tagInput.id = `${APP_PREFIX}confTag_${rule.id}`;
                tagInput.title = 'Gán dòng "Nhãn: ..." vào văn án trước khi dịch';
                tagWrap.appendChild(tagInput);

                const targetWrap = document.createElement('div');
                const targetSelect = document.createElement('select');
                targetSelect.id = `${APP_PREFIX}confTarget_${rule.id}`;
                targetSelect.className = `${APP_PREFIX}select`;
                targetSelect.style.width = '100%';
                targetSelect.innerHTML = `
                    <option value="">--- Tự động ---</option>
                    <option value="wiki">Wikidich</option>
                    <option value="webhong">Webhong</option>
                `;
                targetWrap.appendChild(targetSelect);

                domainConfig.appendChild(label);
                domainConfig.appendChild(descWrap);
                domainConfig.appendChild(tagWrap);
                domainConfig.appendChild(targetWrap);
            });
        };

        const renderMoreLinkOptions = () => {
            const listEl = shadowRoot.getElementById(`${APP_PREFIX}moreLinkOptions`);
            if (listEl) {
                const options = SITE_RULES.map(rule => {
                    const label = rule.label || rule.name || rule.id;
                    return `<option value="${label}"></option>`;
                }).join('');
                listEl.innerHTML = options;
            }
            const descInput = shadowRoot.getElementById(`${APP_PREFIX}moreLinkDesc`);
            if (descInput) {
                const labels = SITE_RULES.map(rule => rule.label || rule.name || rule.id).filter(Boolean);
                const sample = labels.slice(0, 4).join(', ');
                descInput.placeholder = `Mô tả (vd: ${sample}${labels.length > 4 ? ', ...' : ''})`;
            }
        };

        renderDomainConfig();
        renderMoreLinkOptions();

        const logBox = shadowRoot.getElementById(`${APP_PREFIX}log`);
        if (!showFloatingButton) btn.style.display = 'none';

        // Help UI (Reused logic for Changelog)
        const helpModal = document.createElement('div');
        helpModal.id = `${APP_PREFIX}helpModal`;
        helpModal.className = `${APP_PREFIX}modal`;
        helpModal.innerHTML = `
            <div class="${APP_PREFIX}modal-card">
                <div class="${APP_PREFIX}modal-title">Hướng dẫn & Cập nhật</div>
                <div class="${APP_PREFIX}modal-body" id="${APP_PREFIX}helpContent" style="font-size: 14px; line-height: 1.5;"></div>
                <div class="${APP_PREFIX}modal-actions">
                    <button id="${APP_PREFIX}helpClose" class="${APP_PREFIX}btn secondary">Đóng</button>
                </div>
            </div>
        `;
        shadowRoot.appendChild(helpModal);
        const helpContentDiv = helpModal.querySelector(`#${APP_PREFIX}helpContent`);
        const helpClose = helpModal.querySelector(`#${APP_PREFIX}helpClose`);

        helpClose.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
        helpModal.addEventListener('click', (ev) => {
            if (ev.target === helpModal) return;
        });
        if (excludeModal) {
            excludeModal.addEventListener('click', (ev) => {
                if (ev.target === excludeModal) return;
            });
        }
        if (diffModal) {
            diffModal.addEventListener('click', (ev) => {
                if (ev.target === diffModal) return;
            });
        }
        if (duplicateClose && duplicateModal) {
            duplicateClose.addEventListener('click', () => {
                duplicateModal.style.display = 'none';
            });
        }
        if (duplicateModal) {
            duplicateModal.addEventListener('click', (ev) => {
                if (ev.target === duplicateModal) return;
            });
        }
        if (duplicateDeepModal) {
            duplicateDeepModal.addEventListener('click', (ev) => {
                if (ev.target === duplicateDeepModal) return;
            });
        }
        if (duplicateDeepOpen) {
            duplicateDeepOpen.addEventListener('click', () => {
                const targetUrl = pendingDeepDuplicateCandidate?.url || pendingDeepDuplicateCandidate?.authorPageUrl || state.duplicateCheck?.authorPageUrl || '';
                if (!targetUrl) {
                    log('Không có link để mở kiểm tra sâu.', 'warn');
                    return;
                }
                openInBrowserTab(targetUrl);
                log('Đã mở link để bạn tự so lại truyện nghi trùng.', 'info');
            });
        }
        if (duplicateDeepNo) {
            duplicateDeepNo.addEventListener('click', () => {
                resolveDeepDuplicateDecision(false);
            });
        }
        if (duplicateDeepYes) {
            duplicateDeepYes.addEventListener('click', () => {
                resolveDeepDuplicateDecision(true);
            });
        }

        manualAiBtn.addEventListener('click', () => {
            if (!state.sourceData) {
                log('Chưa có dữ liệu truyện (Fetch data trước).', 'error');
                return;
            }
            manualAiModal.style.display = 'flex';
        });
        manualAiClose.addEventListener('click', () => {
            manualAiModal.style.display = 'none';
        });
        if (jjwxcPickNew) {
            jjwxcPickNew.addEventListener('click', () => {
                resolveJjwxcApiModeModal(JJWXC_API_MODE_NEW);
            });
        }
        if (jjwxcPickOld) {
            jjwxcPickOld.addEventListener('click', () => {
                resolveJjwxcApiModeModal(JJWXC_API_MODE_OLD);
            });
        }
        if (jjwxcApiModal) {
            jjwxcApiModal.addEventListener('click', (ev) => {
                if (ev.target === jjwxcApiModal) return;
            });
        }
        manualAiCopy.addEventListener('click', async () => {
            const context = buildAiContext();
            if (!context) return;
            const prompt = buildAiPrompt(context.shouldExtractNames, context.availableOptions);
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(prompt);
                } else {
                    window.prompt('Copy prompt', prompt);
                }
                log('Đã copy prompt AI.', 'ok');
            } catch (err) {
                log('Lỗi copy prompt: ' + err.message, 'error');
            }
        });
        const handleManualAiText = async (text, context) => {
            const raw = (text || '').toString().trim();
            if (!raw) {
                log('Không có dữ liệu để dán.', 'warn');
                return false;
            }
            let result = null;
            try {
                result = JSON.parse(raw);
            } catch (err) {
                throw new Error('JSON không hợp lệ: ' + err.message);
            }
            await applyAiResult(result, context.shouldExtractNames, context.availableOptions);
            return true;
        };
        manualAiPaste.addEventListener('click', async () => {
            const context = buildAiContext();
            if (!context) return;
            try {
                let text = '';
                if (navigator.clipboard && navigator.clipboard.readText) {
                    text = await navigator.clipboard.readText();
                } else {
                    text = window.prompt('Dán kết quả AI (JSON) vào đây') || '';
                }
                showApplyToast('AI thủ công đang xử lý...', 'loading');
                const ok = await handleManualAiText(text, context);
                if (ok) {
                    manualAiModal.style.display = 'none';
                    showApplyToast('AI thủ công đã áp xong.', 'success', 1300);
                }
            } catch (err) {
                log('Lỗi dán kết quả AI: ' + err.message, 'error');
                showApplyToast('AI thủ công lỗi, xem log để xử lý.', 'error', 1600);
            }
        });
        manualAiModal.addEventListener('paste', async (ev) => {
            if (manualAiModal.style.display !== 'flex') return;
            const text = ev.clipboardData?.getData('text') || '';
            if (!text) return;
            ev.preventDefault();
            const context = buildAiContext();
            if (!context) return;
            try {
                showApplyToast('AI thủ công đang xử lý...', 'loading');
                const ok = await handleManualAiText(text, context);
                if (ok) {
                    manualAiModal.style.display = 'none';
                    showApplyToast('AI thủ công đã áp xong.', 'success', 1300);
                }
            } catch (err) {
                log('Lỗi dán kết quả AI: ' + err.message, 'error');
                showApplyToast('AI thủ công lỗi, xem log để xử lý.', 'error', 1600);
            }
        });
        if (excludeBtn && excludeModal) {
            excludeBtn.addEventListener('click', () => {
                renderExcludeScopeOptions();
                renderExcludeList();
                excludeModal.style.display = 'flex';
            });
        }
        if (excludeScope) {
            excludeScope.addEventListener('change', () => {
                renderExcludeList();
            });
        }
        if (excludeReset) {
            excludeReset.addEventListener('click', () => {
                const cfg = getExcludeConfigForPage();
                const scopeId = getExcludeScopeId();
                if (scopeId && scopeId !== EXCLUDE_SCOPE_ALL && cfg.sources && cfg.sources[scopeId]) {
                    delete cfg.sources[scopeId];
                    saveExcludeConfigForPage();
                    renderExcludeList();
                    log(`Đã xóa cấu hình loại trừ riêng cho "${scopeId}" (quay về dùng theo "Tất cả").`, 'ok');
                }
            });
        }
        if (excludeClose && excludeModal) {
            excludeClose.addEventListener('click', () => {
                excludeModal.style.display = 'none';
            });
        }
        if (excludeSave) {
            excludeSave.addEventListener('click', () => {
                const chosen = {};
                excludeList?.querySelectorAll('input[type="checkbox"][data-key]').forEach((input) => {
                    chosen[input.dataset.key] = input.checked;
                });
                const cfg = getExcludeConfigForPage();
                const scopeId = getExcludeScopeId();
                if (scopeId === EXCLUDE_SCOPE_ALL) {
                    cfg.all = { ...chosen };
                    if (cfg.sources && typeof cfg.sources === 'object') {
                        Object.keys(cfg.sources).forEach((src) => {
                            const overrides = cfg.sources[src];
                            if (!overrides || typeof overrides !== 'object') return;
                            Object.keys(overrides).forEach((k) => {
                                if (!!overrides[k] === !!cfg.all[k]) delete overrides[k];
                            });
                            if (Object.keys(overrides).length === 0) delete cfg.sources[src];
                        });
                    }
                } else {
                    const base = cfg.all && typeof cfg.all === 'object' ? cfg.all : {};
                    const overrides = {};
                    EDIT_FIELDS.forEach((field) => {
                        const v = !!chosen[field.key];
                        const b = !!base[field.key];
                        if (v !== b) overrides[field.key] = v;
                    });
                    if (!cfg.sources || typeof cfg.sources !== 'object') cfg.sources = {};
                    if (Object.keys(overrides).length) cfg.sources[scopeId] = overrides;
                    else if (cfg.sources && cfg.sources[scopeId]) delete cfg.sources[scopeId];
                }
                state.excludeConfig = cfg;
                saveExcludeConfigForPage();
                if (excludeModal) excludeModal.style.display = 'none';
                updateMatchIndicators();
            });
        }
        if (diffConfirm) {
            diffConfirm.addEventListener('click', () => {
                if (diffModal) diffModal.style.display = 'none';
                if (pendingDiffResolve) pendingDiffResolve(true);
                pendingDiffResolve = null;
            });
        }
        if (diffCancel) {
            diffCancel.addEventListener('click', () => {
                if (diffModal) diffModal.style.display = 'none';
                if (pendingDiffResolve) pendingDiffResolve(false);
                pendingDiffResolve = null;
            });
        }

        // Show Help (User clicked ?)
        helpBtn.addEventListener('click', () => {
            helpContentDiv.innerHTML = buildWelcomeContent(); // Show full guide
            helpModal.style.display = 'flex';
        });

        // Version Check Logic
        setTimeout(() => {
            // GM_setValue(`${APP_PREFIX}version`, null); //test
            const currentVer = AUTOFILL_WIKIDICH_VERSION;
            const storedVer = GM_getValue(`${APP_PREFIX}version`, null);

            if (!storedVer) {
                // New Install
                helpContentDiv.innerHTML = buildWelcomeContent();
                helpModal.style.display = 'flex';
                GM_setValue(`${APP_PREFIX}version`, currentVer);
            } else if (storedVer !== currentVer) {
                // Update
                helpContentDiv.innerHTML = CHANGELOG_CONTENT;
                helpModal.style.display = 'flex';
                GM_setValue(`${APP_PREFIX}version`, currentVer);
            }
        }, 1500);

        function log(message, type) {
            const line = document.createElement('div');
            line.textContent = message;
            if (type === 'error') line.style.color = '#ff8080';
            if (type === 'warn') line.style.color = '#ffd166';
            if (type === 'ok') line.style.color = '#9ef01a';
            logBox.appendChild(line);
            logBox.scrollTop = logBox.scrollHeight;
        }
        state.log = log;

        function fillSelect(selectEl, options, suggested) {
            selectEl.innerHTML = '';
            const empty = document.createElement('option');
            empty.value = '';
            empty.textContent = '--- Tự động ---';
            selectEl.appendChild(empty);
            options.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.label;
                o.textContent = opt.label || '(trống)';
                selectEl.appendChild(o);
            });
            if (suggested) selectEl.value = suggested;
        }

        function fillText(id, value) {
            shadowRoot.getElementById(id).value = value || '';
        }

        settingsBtn.addEventListener('click', () => {
            const s = state.settings;
            settingsThreshold.value = s.scoreThreshold;
            settingsGeminiKey.value = s.geminiApiKey || '';

            // Populate models
            settingsGeminiModel.innerHTML = '';
            const currentModel = normalizeGeminiModelName(s.geminiModel) || DEFAULT_GEMINI_MODEL;
            const option = document.createElement('option');
            option.value = currentModel;
            option.textContent = currentModel;
            option.selected = true;
            settingsGeminiModel.appendChild(option);

            settingsAiMode.value = s.aiMode || 'auto';
            settingsAutoExtractNames.checked = s.autoExtractNames !== false; // default true
            settingsAutoBreakDesc.checked = !!s.autoBreakDesc; // default false
            settingsDeepDuplicateCheck.checked = s.deepDuplicateCheck !== false;

            const d = s.domainSettings || DEFAULT_SETTINGS.domainSettings;
            SITE_RULES.forEach((rule) => {
                const inputs = getDomainInputs(rule.id);
                const conf = d[rule.id];
                if (!inputs.desc || !inputs.assignTags || !inputs.target || !conf) return;
                inputs.desc.checked = !!conf.useDesc;
                inputs.assignTags.checked = conf.assignTags !== false;
                inputs.target.value = conf.target === 'all' ? '' : conf.target;
            });
            updateCoverSizeSummary();
            settingsModal.style.display = 'flex';
        });

        settingsSave.addEventListener('click', () => {
            const next = readSettingsFromUi();
            saveSettings(next);
            settingsModal.style.display = 'none';
            updateCoverSizeSummary();
            updateCoverSizeTag();
            log('Đã lưu cài đặt.', 'info');
        });

        settingsClose.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });

        if (descToggleBtn) {
            descToggleBtn.addEventListener('click', () => {
                const next = state.descEditorMode === 'zh' ? 'vi' : 'zh';
                setDescEditorMode(next);
                updateRecomputeNotice();
                updateMatchIndicators();
            });
        }
        if (descTextarea) {
            descTextarea.addEventListener('input', () => {
                commitDescDraftFromEditor();
                if (state.descEditorMode === 'zh') {
                    if (state.sourceData) state.sourceData.descCn = T.safeText(state.descDraft.zh || '');
                } else {
                    state.translated = state.translated || {};
                    state.translated.desc = state.descDraft.vi || '';
                }
                updateRecomputeNotice();
                updateMatchIndicators();
            });
            descTextarea.addEventListener('change', () => {
                commitDescDraftFromEditor();
                updateRecomputeNotice();
            });
        }

        if (coverUrlInput) {
            coverUrlInput.addEventListener('input', () => {
                scheduleCoverMetaRefresh(coverUrlInput.value);
            });
            coverUrlInput.addEventListener('change', () => {
                scheduleCoverMetaRefresh(coverUrlInput.value);
            });
        }
        if (coverSizeBtn) {
            coverSizeBtn.addEventListener('click', () => {
                openCoverSizeModal();
            });
        }
        if (coverSizeSettingBtn) {
            coverSizeSettingBtn.addEventListener('click', () => {
                openCoverSizeModal();
            });
        }
        if (coverCustomAdd) {
            coverCustomAdd.addEventListener('click', () => {
                if (!coverSizeDraft) return;
                const w = Math.max(1, parseInt(coverCustomW?.value, 10) || 0);
                const h = Math.max(1, parseInt(coverCustomH?.value, 10) || 0);
                if (!w || !h) {
                    log('WxH tùy chỉnh không hợp lệ.', 'warn');
                    return;
                }
                const existed = (coverSizeDraft.customSizes || []).some((item) => item.w === w && item.h === h);
                if (!existed) {
                    coverSizeDraft.customSizes = normalizeCustomSizes([...(coverSizeDraft.customSizes || []), { w, h }]);
                }
                coverSizeDraft.mode = 'custom';
                coverSizeDraft.targetWidth = w;
                coverSizeDraft.targetHeight = h;
                if (coverCustomW) coverCustomW.value = '';
                if (coverCustomH) coverCustomH.value = '';
                renderCoverSizeModal();
            });
        }
        if (coverSizeSave) {
            coverSizeSave.addEventListener('click', () => {
                if (!coverSizeDraft) {
                    closeCoverSizeModal();
                    return;
                }
                const scope = getActiveCoverScope();
                if (!scope.sourceType) {
                    log('Chưa nhận diện được nguồn. Hãy nhập URL nguồn hợp lệ hoặc bấm Lấy dữ liệu trước khi lưu WxH.', 'warn');
                    return;
                }
                setCurrentCoverSizeConfig(coverSizeDraft);
                updateCoverSizeSummary();
                updateCoverSizeTag();
                closeCoverSizeModal();
                log(`Đã lưu cấu hình tỷ lệ ảnh bìa cho nguồn ${scope.label}.`, 'ok');
            });
        }
        if (coverSizeClose) {
            coverSizeClose.addEventListener('click', () => {
                closeCoverSizeModal();
            });
        }
        if (coverSizeModal) {
            coverSizeModal.addEventListener('click', (ev) => {
                if (ev.target === coverSizeModal) return;
            });
        }
        if (pickAgeBtn) pickAgeBtn.addEventListener('click', () => openMultiPicker('age'));
        if (pickEndingBtn) pickEndingBtn.addEventListener('click', () => openMultiPicker('ending'));
        if (pickGenreBtn) pickGenreBtn.addEventListener('click', () => openMultiPicker('genre'));
        if (pickTagBtn) pickTagBtn.addEventListener('click', () => openMultiPicker('tag'));
        if (multiPickerSearch) {
            multiPickerSearch.addEventListener('input', () => {
                renderMultiPickerList();
            });
            multiPickerSearch.addEventListener('keydown', (ev) => {
                if (ev.key === 'Escape') {
                    ev.preventDefault();
                    closeMultiPickerModal();
                }
            });
        }
        if (multiPickerClear) {
            multiPickerClear.addEventListener('click', () => {
                if (!multiPickerContext) return;
                multiPickerContext.selectedMap.clear();
                renderMultiPickerList();
            });
        }
        if (multiPickerSelectAll) {
            multiPickerSelectAll.addEventListener('click', () => {
                if (!multiPickerContext) return;
                (multiPickerContext.options || []).forEach((label) => {
                    const norm = T.normalizeText(label);
                    if (norm) multiPickerContext.selectedMap.set(norm, label);
                });
                renderMultiPickerList();
            });
        }
        if (multiPickerSave) {
            multiPickerSave.addEventListener('click', () => {
                if (!multiPickerContext) {
                    closeMultiPickerModal();
                    return;
                }
                const inputEl = getMultiPickerInput(multiPickerContext.key);
                if (!inputEl) {
                    closeMultiPickerModal();
                    return;
                }
                const ordered = [];
                const seen = new Set();
                (multiPickerContext.options || []).forEach((label) => {
                    const norm = T.normalizeText(label);
                    if (!norm || seen.has(norm) || !multiPickerContext.selectedMap.has(norm)) return;
                    seen.add(norm);
                    ordered.push(multiPickerContext.selectedMap.get(norm));
                });
                multiPickerContext.selectedMap.forEach((label, norm) => {
                    if (!norm || seen.has(norm)) return;
                    seen.add(norm);
                    ordered.push(label);
                });
                const fieldLabel = multiPickerContext.field?.label || 'mục';
                setInputValue(inputEl, ordered.join(', '));
                closeMultiPickerModal();
                log(`Đã áp ${ordered.length} nhãn cho "${fieldLabel}".`, 'ok');
            });
        }
        if (multiPickerClose) {
            multiPickerClose.addEventListener('click', () => {
                closeMultiPickerModal();
            });
        }
        if (multiPickerModal) {
            multiPickerModal.addEventListener('click', (ev) => {
                if (ev.target === multiPickerModal) return;
            });
        }

        // Fetch Models Logic
        settingsFetchModels.addEventListener('click', () => {
            const key = settingsGeminiKey.value.trim();
            if (!key) {
                alert('Vui lòng nhập API Key trước.');
                return;
            }
            settingsFetchModels.textContent = 'Đang lấy...';
            settingsFetchModels.disabled = true;

            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
                onload: (res) => {
                    settingsFetchModels.textContent = 'Lấy Model';
                    settingsFetchModels.disabled = false;
                    if (res.status >= 200 && res.status < 300) {
                        try {
                            const data = JSON.parse(res.responseText);
                            if (data.models && Array.isArray(data.models)) {
                                const currentUiModel = normalizeGeminiModelName(settingsGeminiModel.value);
                                rememberGeminiModels(data.models);
                                settingsGeminiModel.innerHTML = '';
                                const preferredModel = normalizeGeminiModelName(
                                    currentUiModel || state.settings?.geminiModel || DEFAULT_GEMINI_MODEL
                                ) || DEFAULT_GEMINI_MODEL;
                                const models = data.models
                                    .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
                                    .sort((a, b) => {
                                        const nameA = normalizeGeminiModelName(a?.name);
                                        const nameB = normalizeGeminiModelName(b?.name);
                                        if (nameA === DEFAULT_GEMINI_MODEL) return -1;
                                        if (nameB === DEFAULT_GEMINI_MODEL) return 1;
                                        return (a?.displayName || nameA).localeCompare(b?.displayName || nameB);
                                    });

                                if (!models.length) {
                                    alert('Không tìm thấy model nào hỗ trợ generateContent.');
                                    return;
                                }

                                models.forEach(m => {
                                    const name = normalizeGeminiModelName(m.name);
                                    const opt = document.createElement('option');
                                    opt.value = name;
                                    opt.textContent = `${m.displayName} (${name})${m.thinking ? ' • thinking' : ''}`;
                                    settingsGeminiModel.appendChild(opt);
                                });
                                const availableNames = new Set(models.map((m) => normalizeGeminiModelName(m.name)));
                                const selectedModel = availableNames.has(preferredModel)
                                    ? preferredModel
                                    : (availableNames.has(DEFAULT_GEMINI_MODEL) ? DEFAULT_GEMINI_MODEL : normalizeGeminiModelName(models[0]?.name));
                                if (selectedModel) settingsGeminiModel.value = selectedModel;
                                alert(`Đã tìm thấy ${models.length} model.`);
                            }
                        } catch (e) {
                            alert('Lỗi parse: ' + e.message);
                        }
                    } else {
                        alert(`Lỗi API: ${res.statusText}`);
                    }
                },
                onerror: () => {
                    settingsFetchModels.textContent = 'Lấy Model';
                    settingsFetchModels.disabled = false;
                    alert('Lỗi kết nối.');
                }
            });
        });

        // --- GEMINI AI IMPLEMENTATION ---

        function extractGeminiErrorDetail(responseText) {
            try {
                const data = JSON.parse(responseText || '{}');
                return data?.error?.message || '';
            } catch {
                return ((responseText || '').toString().trim().slice(0, 240));
            }
        }

        function formatElapsedTime(ms) {
            const value = Number(ms);
            if (!Number.isFinite(value) || value < 0) return '0ms';
            if (value < 1000) return `${Math.round(value)}ms`;
            const seconds = value / 1000;
            if (seconds < 60) return `${seconds.toFixed(seconds >= 10 ? 1 : 2)}s`;
            const minutes = Math.floor(seconds / 60);
            const remain = Math.round(seconds % 60);
            return `${minutes}m ${remain}s`;
        }

        function buildGeminiUsageLog(meta) {
            const usage = meta?.usage || {};
            const parts = [];
            if (Number.isFinite(usage.promptTokenCount)) parts.push(`prompt ${usage.promptTokenCount}`);
            if (Number.isFinite(usage.candidatesTokenCount)) parts.push(`output ${usage.candidatesTokenCount}`);
            if (Number.isFinite(usage.thoughtsTokenCount)) parts.push(`thinking ${usage.thoughtsTokenCount}`);
            if (Number.isFinite(usage.totalTokenCount)) parts.push(`total ${usage.totalTokenCount}`);
            if (!parts.length) return '';
            const modelInfo = meta?.modelVersion || meta?.model || '';
            return `AI usage${modelInfo ? ` [${modelInfo}]` : ''}: ${parts.join(' | ')}.`;
        }

        function requestGeminiJson(prompt, apiKey, model, generationConfig) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig
            };
            return new Promise((resolve, reject) => {
                const startedAt = Date.now();
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: url,
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify(payload),
                    onload: (res) => {
                        if (res.status >= 200 && res.status < 300) {
                            try {
                                const data = JSON.parse(res.responseText);
                                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (!text) throw new Error('No text in response');
                                resolve({
                                    result: JSON.parse(text),
                                    meta: {
                                        elapsedMs: Date.now() - startedAt,
                                        model,
                                        modelVersion: T.safeText(data?.modelVersion || ''),
                                        usage: data?.usageMetadata || {},
                                        responseId: T.safeText(data?.responseId || ''),
                                        thinkingEnabled: !!generationConfig?.thinkingConfig,
                                    },
                                });
                            } catch (e) {
                                reject(new Error('AI Response Parse Error: ' + e.message));
                            }
                        } else {
                            const detail = extractGeminiErrorDetail(res.responseText) || res.statusText || 'Unknown error';
                            reject(new Error(`Gemini Error ${res.status}: ${detail}`));
                        }
                    },
                    onerror: (err) => reject(err)
                });
            });
        }

        async function callGemini(prompt, apiKey, model = DEFAULT_GEMINI_MODEL) {
            const normalizedModel = normalizeGeminiModelName(model) || DEFAULT_GEMINI_MODEL;
            const generationConfig = buildGeminiGenerationConfig(normalizedModel);
            try {
                return await requestGeminiJson(prompt, apiKey, normalizedModel, generationConfig);
            } catch (err) {
                const message = (err && err.message) ? err.message : String(err || '');
                if (
                    generationConfig.thinkingConfig &&
                    /(thinking|thinkingconfig|unknown field|invalid json payload|unsupported|not supported)/i.test(message)
                ) {
                    logUi(`Model ${normalizedModel} không nhận thinking low, thử lại không bật suy nghĩ.`, 'warn');
                    return requestGeminiJson(prompt, apiKey, normalizedModel, { responseMimeType: 'application/json' });
                }
                throw err;
            }
        }

        const buildAiContext = () => {
            if (!state.sourceData) {
                log('Chưa có dữ liệu truyện (Fetch data trước).', 'error');
                return null;
            }
            const shouldExtractNames = state.settings.autoExtractNames !== false && state.sourceData.descCn;
            const groups = getGroupOptions();
            const availableOptions = {
                gender: getAiOptionLabels('gender', groups.gender),
                official: getAiOptionLabels('official', groups.official),
                age: getAiOptionLabels('age', groups.age),
                ending: getAiOptionLabels('ending', groups.ending),
                genre: getAiOptionLabels('genre', groups.genre),
                tag: getAiOptionLabels('tag', groups.tag),
            };
            return { shouldExtractNames, availableOptions };
        };

        const getDescViForAi = () => {
            return stripTaggedDescLine(state.translated?.desc || '');
        };

        const buildAiPrompt = (shouldExtractNames, availableOptions) => {
            const novelInfo = {
                title: state.sourceData.titleCn,
                author: state.sourceData.authorCn,
                desc: state.sourceData.descCn + '\n' + getDescViForAi(),
                tags: (state.sourceData.tags || []).join(', ')
            };

            if (shouldExtractNames) {
                return `
You are a novel classifier and name extractor for Wikidich. Analyze the novel info, extract character names, and map categories to the provided JSON lists.

Novel Info:
Title: ${novelInfo.title}
Author: ${novelInfo.author}
Tags: ${novelInfo.tags}
Description (Chinese): ${state.sourceData.descCn}
Description (Vietnamese): ${getDescViForAi()}

TASK 1: Extract all important names (characters, locations, titles) from the Chinese description.
Return them as "names" array with format: [{"cn": "中文名", "vi": "Vietnamese/Latin name", "origin": "hanviet|foreign", "case": "title|phrase|keep", "caps": [true, false]}]
- For Chinese/Hán names, set "origin": "hanviet". The script will verify and overwrite "vi" with DichNgay Hán-Việt, so do NOT translate name characters by meaning. Example: "施探微" is hanviet, not "Thi Thăm Hy".
- Add casing info. "case":"title" means capitalize every Vietnamese word/syllable. "case":"phrase" means only the first/proper component is capitalized, generic words stay lowercase. "case":"keep" is for foreign names.
- "caps" is optional but preferred: one boolean per word in "vi"; true = capitalize that word, false = lowercase that word. Examples: 施探微 => {"vi":"Thi Tham Vi","origin":"hanviet","case":"title","caps":[true,true,true]}; 凌家 => {"vi":"Lăng gia","origin":"hanviet","case":"phrase","caps":[true,false]}; 兽人大陆 => {"vi":"Thú nhân đại lục","origin":"hanviet","case":"phrase","caps":[true,false,false,false]}.
- For non-Chinese transliterated names (Japanese/English/Korean/Western/fantasy names written in Chinese chars), set "origin": "foreign" and keep the best Latin/Vietnamese transliteration in "vi". Example: "瑞苏泽尔" => "Risuzel" (NOT "Thụy Tô Trạch Nhĩ").
- EXCLUDE pronouns/titles/common-role phrases (not proper names): 女主, 男主, 女配, 男配, 男二, 女二, 反派, 系统, 师尊, 师父, 徒弟, 兄长, 师兄, 师妹, 小姐, 少爷, 公爵, 王爷, 皇帝, 皇后, 太子, 贵妃, 圣女, 侍女, 侍卫, 丫鬟, 书童, 管家, 大人, 先生, 小姐, 夫人, 公子, 少主, 掌门, 宗主, 长老, 魔尊, 大妖, 等等.
- Vietnamese name casing: do NOT Title-Case generic roles/kinship terms. Example: "女主" should NOT become "Nữ Chủ" (skip entirely). "叶哥哥" should map to "Diệp ca ca" (not "Diệp Ca Ca").
- If a term is just a common phrase with meaning (not a unique proper name), skip it.

TASK 2: Classify the novel using ONLY the provided lists:
- gender: ${JSON.stringify(availableOptions.gender)} // Pick 1
- official: ${JSON.stringify(availableOptions.official)} // Pick 1
- age: ${JSON.stringify(availableOptions.age)} // Pick multiple
- ending: ${JSON.stringify(availableOptions.ending)} // Pick 1 (if unclear, you may choose OE or HE). Pick multiple ONLY when tag/genre includes "Xuyên nhanh"/"快穿".
- genre: ${JSON.stringify(availableOptions.genre)} // Pick multiple
- tag: ${JSON.stringify(availableOptions.tag)} // Pick multiple
- IMPORTANT: "年代文" usually maps to "Hiện đại", NOT "Cận đại". Only choose "Cận đại" when there are clear Republic-era / 民国, World War I-II / 一战二战, or Western 19th-century signals. Use tags + context to infer carefully.

Output JSON format:
{
  "names": [{"cn": "...", "vi": "...", "origin": "hanviet", "case": "title", "caps": [true, true]}],
  "gender": "...",
  "official": "...",
  "age": [...],
  "ending": [...],
  "genre": [...],
  "tag": [...]
}
For arrays, return list of strings. If none fit, return empty array.
                `.trim();
            }

            return `
You are a novel classifier for Wikidich. Analyze the novel info and map it to the provided JSON lists.
Info:
Title: ${novelInfo.title}
Author: ${novelInfo.author}
Tags: ${novelInfo.tags}
Description: ${novelInfo.desc}

Available Lists (Choose from these ONLY):
- gender: ${JSON.stringify(availableOptions.gender)} // Pick 1
- official: ${JSON.stringify(availableOptions.official)} // Pick 1
- age: ${JSON.stringify(availableOptions.age)} // Pick multiple
- ending: ${JSON.stringify(availableOptions.ending)} // Pick 1 (if unclear, you may choose OE or HE). Pick multiple ONLY when tag/genre includes "Xuyên nhanh"/"快穿".
- genre: ${JSON.stringify(availableOptions.genre)} // Pick multiple
- tag: ${JSON.stringify(availableOptions.tag)} // Pick multiple
- IMPORTANT: "年代文" usually maps to "Hiện đại", NOT "Cận đại". Only choose "Cận đại" when there are clear Republic-era / 民国, World War I-II / 一战二战, or Western 19th-century signals. Use tags + context to infer carefully.

Output JSON format: { "gender": "...", "official": "...", "age": [...], "ending": [...], "genre": [...], "tag": [...] }
For arrays, return list of strings. If none fit, return empty array.
                `.trim();
        };

        const applyAiResult = async (result, shouldExtractNames, availableOptions) => {
            if (shouldExtractNames && result.names && Array.isArray(result.names) && result.names.length > 0) {
                const extractedNames = await normalizeAiExtractedNames(result.names);
                const nameSetEl = shadowRoot.getElementById(`${APP_PREFIX}nameSet`);
                if (nameSetEl) {
                    const existingLines = nameSetEl.value.trim().split('\n').filter(Boolean);
                    const existingKeys = new Set(Object.keys(parseNameSet(nameSetEl.value || '')).map(stripAiNameCn));
                    const newLines = extractedNames
                        .filter(n => n.cn && n.vi && !existingKeys.has(n.cn))
                        .map(n => `${n.cn}=${n.vi}`);
                    if (newLines.length > 0) {
                        nameSetEl.value = [...existingLines, ...newLines].join('\n');
                    }
                }
                log(`Đã tách ${extractedNames.length} tên, name Hán đã chuẩn hóa bằng Hán Việt nếu cần.`, 'ok');

                log('Đang dịch lại văn án với bộ tên mới...', 'info');
                const newNameSet = parseNameSet(nameSetEl?.value || '');
                const descCnNow = T.safeText(state.descDraft.zh || state.sourceData.descCn || '');
                const assignTags = shouldAssignTagsForSource(state.sourceData?.sourceType);
                const descCnForTranslate = buildTaggedDescForTranslate(descCnNow, state.sourceData?.tags || [], assignTags);
                const reTranslatedDesc = await translateTextWithNameSet(descCnForTranslate, newNameSet, true);
                if (reTranslatedDesc) {
                    state.translated = state.translated || {};
                    state.translated.desc = reTranslatedDesc;
                    setDescDrafts(descCnNow, reTranslatedDesc);
                    if (state.sourceData) state.sourceData.descCn = descCnNow;
                    log('Đã dịch lại văn án với bộ tên.', 'ok');
                }

                log('Đang dịch lại tiêu đề với bộ tên mới...', 'info');
                const titleCnNow = T.safeText(shadowRoot.getElementById(`${APP_PREFIX}titleCn`)?.value || state.sourceData.titleCn || '');
                const reTranslatedTitle = await translateTextWithNameSet(titleCnNow, newNameSet, false);
                if (reTranslatedTitle) {
                    state.translated = state.translated || {};
                    state.translated.titleVi = reTranslatedTitle;
                    const titleViEl = shadowRoot.getElementById(`${APP_PREFIX}titleVi`);
                    if (titleViEl) titleViEl.value = reTranslatedTitle;
                    if (state.sourceData) state.sourceData.titleCn = titleCnNow;
                    log('Đã dịch lại tiêu đề với bộ tên.', 'ok');
                }
            }

            const validateParams = (key, value, isArray) => {
                const validList = availableOptions[key] || [];
                const validSet = new Set(validList.map(x => x.toLowerCase().trim()));

                if (!value) return isArray ? [] : '';

                if (isArray) {
                    if (!Array.isArray(value)) return [];
                    const valid = [];
                    const invalid = [];
                    value.forEach(v => {
                        const strV = String(v);
                        if (validSet.has(strV.toLowerCase().trim())) {
                            const exact = validList.find(x => x.toLowerCase().trim() === strV.toLowerCase().trim());
                            valid.push(exact || strV);
                        } else if (key === 'age' && isAiHiddenAgeLabel(strV)) {
                            // Hidden from AI by design; ignore silently if an old/cached prompt still returns it.
                        } else {
                            invalid.push(strV);
                        }
                    });
                    if (invalid.length) log(`AI suggest rác [${key}]: ${invalid.join(', ')}`, 'warn');
                    return valid;
                } else {
                    const strValue = String(value);
                    if (validSet.has(strValue.toLowerCase().trim())) {
                        const exact = validList.find(x => x.toLowerCase().trim() === strValue.toLowerCase().trim());
                        return exact || strValue;
                    } else if (key === 'age' && isAiHiddenAgeLabel(strValue)) {
                        return '';
                    } else {
                        log(`AI suggest rác [${key}]: ${strValue}`, 'warn');
                        return '';
                    }
                }
            };

            result.gender = validateParams('gender', result.gender, false);
            result.official = validateParams('official', result.official, false);

            result.age = validateParams('age', result.age, true);
            result.ending = validateParams('ending', result.ending, true);
            result.genre = validateParams('genre', result.genre, true);
            result.tag = validateParams('tag', result.tag, true);

            const endingKeywordBlob = buildKeywordList(state.sourceData, state.translated)
                .concat(result.genre || [])
                .concat(result.tag || [])
                .join(' ');
            const allowMultiEnding = hasXuyenNhanh(endingKeywordBlob);
            if (!allowMultiEnding && Array.isArray(result.ending) && result.ending.length > 1) {
                result.ending = [result.ending[0]];
                log('AI: Kết thúc chỉ chọn 1 (trừ khi có tag/thể loại Xuyên nhanh).', 'warn');
            }

            const aiSignal = buildClassificationSignal(state.sourceData, state.translated, []
                .concat(result.age || [])
                .concat(result.genre || [])
                .concat(result.tag || []));
            const preferredAiAge = detectPreferredAgeLabel(aiSignal, state.groups?.age || []);
            if (preferredAiAge) {
                const nextAge = injectPreferredLabels(result.age, [preferredAiAge], [/(^| )hien dai($| )/i, /(^| )can dai($| )/i]);
                if (T.normalizeText((result.age || []).join(', ')) !== T.normalizeText(nextAge.join(', '))) {
                    result.age = nextAge;
                    log(`AI: Ưu tiên thời đại "${preferredAiAge}" theo ngữ cảnh.`, 'info');
                }
            }
            const preferredAiGenre = detectPreferredAltHistoryLabel(aiSignal, state.groups?.genre || []);
            if (preferredAiGenre) {
                const nextGenre = injectPreferredLabels(result.genre, [preferredAiGenre], [/(^| )lich su($| )/i]);
                if (T.normalizeText((result.genre || []).join(', ')) !== T.normalizeText(nextGenre.join(', '))) {
                    result.genre = nextGenre;
                    log(`AI: Ưu tiên thể loại "${preferredAiGenre}" cho 架空历史.`, 'info');
                }
            }
            const preferredAiTag = detectPreferredAltHistoryLabel(aiSignal, state.groups?.tag || []);
            if (preferredAiTag) {
                const nextTag = injectPreferredLabels(result.tag, [preferredAiTag], [/(^| )lich su($| )/i]);
                if (T.normalizeText((result.tag || []).join(', ')) !== T.normalizeText(nextTag.join(', '))) {
                    result.tag = nextTag;
                    log(`AI: Ưu tiên tag "${preferredAiTag}" cho 架空历史.`, 'info');
                }
            }

            if (result.gender) shadowRoot.getElementById(`${APP_PREFIX}gender`).value = result.gender;
            if (result.official) shadowRoot.getElementById(`${APP_PREFIX}official`).value = result.official;

            if (result.age && result.age.length) {
                shadowRoot.getElementById(`${APP_PREFIX}age`).value = result.age.join(', ');
            }
            if (result.ending && result.ending.length) {
                shadowRoot.getElementById(`${APP_PREFIX}ending`).value = result.ending.join(', ');
            }
            if (result.genre && result.genre.length) {
                shadowRoot.getElementById(`${APP_PREFIX}genre`).value = result.genre.join(', ');
            }
            if (result.tag && result.tag.length) {
                shadowRoot.getElementById(`${APP_PREFIX}tag`).value = result.tag.join(', ');
            }

            const preservedStatus = shadowRoot.getElementById(`${APP_PREFIX}status`)?.value
                || state.suggestions?.status
                || '';
            state.suggestions = {
                status: preservedStatus,
                official: result.official || '',
                gender: result.gender || '',
                age: result.age || [],
                ending: result.ending || [],
                genre: result.genre || [],
                tag: result.tag || [],
            };
            state.aiLastSuggestions = deepClone(state.suggestions);
            setRecomputeBaseline(true);
            updateMatchIndicators();

            log('AI đã đề xuất xong. Hãy kiểm tra lại và bấm "Áp vào form".', 'ok');
        };

        async function runAIAnalysis() {
            if (!state.sourceData) {
                log('Chưa có dữ liệu truyện (Fetch data trước).', 'error');
                return;
            }
            const apiKey = state.settings.geminiApiKey;
            if (!apiKey) {
                log('Chưa nhập API Key Gemini trong Cài đặt.', 'error');
                return;
            }
            syncSourceDraftFromInputs();

            const context = buildAiContext();
            if (!context) return;
            const shouldExtractNames = context.shouldExtractNames;
            const geminiModel = normalizeGeminiModelName(state.settings.geminiModel) || DEFAULT_GEMINI_MODEL;
            const thinkingEnabled = !!buildGeminiGenerationConfig(geminiModel).thinkingConfig;
            const thinkingStartedAt = Date.now();
            let thinkingTicker = null;

            log(`Đang gửi dữ liệu sang Gemini AI (${geminiModel})...`, 'info');
            if (thinkingEnabled) {
                log('Gemini đang bật thinking mode, phản hồi có thể chậm hơn bình thường. Vui lòng chờ...', 'info');
            }
            const updateThinkingToast = () => {
                const elapsedLabel = formatElapsedTime(Date.now() - thinkingStartedAt);
                updateApplyToastMessage(
                    thinkingEnabled
                        ? `AI đang suy nghĩ... ${elapsedLabel}`
                        : `AI đang phân tích dữ liệu... ${elapsedLabel}`,
                    'loading'
                );
            };
            updateThinkingToast();
            thinkingTicker = window.setInterval(updateThinkingToast, 1000);

            const availableOptions = context.availableOptions;
            const prompt = buildAiPrompt(shouldExtractNames, availableOptions);

            try {
                const { result, meta } = await callGemini(prompt, apiKey, geminiModel);
                const elapsedLabel = formatElapsedTime(meta?.elapsedMs ?? (Date.now() - thinkingStartedAt));
                log(`AI đã phân tích xong sau ${elapsedLabel}. Đang áp dụng...`, 'ok');
                if (meta?.thinkingEnabled) {
                    log(`AI: thinking mode hoàn tất sau ${elapsedLabel}.`, 'info');
                }
                const usageLog = buildGeminiUsageLog(meta);
                if (usageLog) log(usageLog, 'info');
                console.log('AI Result:', result, meta);

                await applyAiResult(result, shouldExtractNames, availableOptions);
                showApplyToast(`AI đã phân tích xong sau ${elapsedLabel}.`, 'success', 1500);
            } catch (err) {
                const elapsedLabel = formatElapsedTime(Date.now() - thinkingStartedAt);
                log(`Lỗi AI sau ${elapsedLabel}: ${err.message}`, 'error');
                showApplyToast('AI lỗi, xem log để xử lý.', 'error', 1600);
            } finally {
                if (thinkingTicker) {
                    window.clearInterval(thinkingTicker);
                    thinkingTicker = null;
                }
            }
        }

        aiBtn.addEventListener('click', () => {
            runAIAnalysis();
        });

        // ------------------------------------
        function readSettingsFromUi() {
            const domainSettings = {};
            SITE_RULES.forEach((rule) => {
                const inputs = getDomainInputs(rule.id);
                if (!inputs.desc || !inputs.assignTags || !inputs.target) return;
                const def = DEFAULT_SETTINGS.domainSettings[rule.id] || {};
                const selectedTarget = inputs.target.value || 'all';
                domainSettings[rule.id] = {
                    label: def.label || rule.name || rule.id,
                    useDesc: inputs.desc.checked,
                    assignTags: inputs.assignTags.checked,
                    target: selectedTarget,
                };
            });
            return {
                scoreThreshold: parseFloat(settingsThreshold.value),
                aiMode: settingsAiMode.value,
                geminiApiKey: settingsGeminiKey.value.trim(),
                geminiModel: normalizeGeminiModelName(settingsGeminiModel.value) || DEFAULT_GEMINI_MODEL,
                autoExtractNames: settingsAutoExtractNames.checked,
                autoBreakDesc: settingsAutoBreakDesc.checked,
                deepDuplicateCheck: settingsDeepDuplicateCheck.checked,
                jjwxcApiMode: normalizeJjwxcApiMode(state.settings?.jjwxcApiMode),
                domainSettings,
                coverSizeByDomain: deepClone(state.settings?.coverSizeByDomain || {}),
            };
        }

        async function handleFetch() {
            logBox.innerHTML = '';
            state.hasFetchedData = false;
            state.recomputeBaseline = null;
            state.aiLastSuggestions = null;
            if (duplicateCheckTimer) clearTimeout(duplicateCheckTimer);
            resetDuplicateCheckState();
            setDataActionButtonsEnabled(false);
            setApplyByDuplicateState();
            updateRecomputeNotice();
            try {
                if (!state.groups) state.groups = getGroupOptions();
                const urlInput = shadowRoot.getElementById(`${APP_PREFIX}url`);
                const sourceInfo = detectSource(urlInput.value);
                if (!sourceInfo || !sourceInfo.id) {
                    log('URL không hợp lệ.', 'error');
                    showApplyToast('URL không hợp lệ.', 'error', 1400);
                    return;
                }

                // --- BLOCKING LOGIC ---
                const domainSetting = getDomainSetting(sourceInfo.type);
                // Wikidich has moved to wikicv.net; keep backward compatibility for older domains/subdomains.
                const host = (location.hostname || '').toLowerCase();
                const isWikidich = host === 'wikicv.net'
                    || host.endsWith('.wikicv.net')
                    || host.includes('wikidich');
                const target = domainSetting.target || 'wiki';

                if (target === 'wiki' && !isWikidich) {
                    alert(`Trang này (${domainSetting.label}) được cấu hình chỉ lấy khi ở Wikidich.\nVui lòng vào Wikidich > Nhúng file để sử dụng.`);
                    showApplyToast('Nguồn này chỉ dùng ở Wikidich.', 'error', 1500);
                    return;
                }
                if (target === 'webhong' && isWikidich) {
                    alert(`Trang này (${domainSetting.label}) được cấu hình chỉ lấy khi ở Web Hồng.\nVui lòng không dùng ở Wikidich.`);
                    showApplyToast('Nguồn này chỉ dùng ở Web Hồng.', 'error', 1500);
                    return;
                }
                // ---------------------

                const rule = getSiteRule(sourceInfo.type);
                const ruleName = rule?.name ? ` (${rule.name})` : '';
                log(`Nguồn: ${sourceInfo.type}${ruleName} | ID: ${sourceInfo.id}`);
                GM_setValue(`${APP_PREFIX}last_url`, urlInput.value);
                let raw = null;
                let sourceData = null;
                if (!rule || !rule.fetch || !rule.normalize) {
                    log('Nguồn chưa hỗ trợ.', 'error');
                    showApplyToast('Nguồn chưa hỗ trợ.', 'error', 1500);
                    return;
                }
                let jjwxcApiMode = '';
                if (sourceInfo.type === 'jjwxc') {
                    jjwxcApiMode = await ensureJjwxcApiModeSelected();
                    updateJjwxcApiModeUi();
                }
                const fetchLabel = rule.name ? `Đang gọi ${rule.name}...` : 'Đang gọi nguồn...';
                log(fetchLabel);
                if (jjwxcApiMode) {
                    log(`JJWXC: dùng API ${jjwxcApiMode === JJWXC_API_MODE_OLD ? 'cũ (Old)' : 'mới (New)'}.`, 'info');
                }
                showApplyToast('Đang lấy dữ liệu từ nguồn...', 'loading');
                raw = await rule.fetch(sourceInfo.id, jjwxcApiMode);
                sourceData = rule.normalize(raw);
                const okLabel = rule.name ? `${rule.name} OK` : 'Nguồn OK';
                log(`${okLabel}: ${sourceData.titleCn || '(no title)'}`, 'ok');
                if (sourceData?.statusInfo) {
                    const s = sourceData.statusInfo;
                    const suffix = s.evidence ? ` | tín hiệu: ${s.evidence}` : '';
                    log(`Trạng thái parse: ${s.label} (${s.method})${suffix}`);
                }
                if (sourceData?.coverUrl && rule?.coverProcess) {
                    log(`Đang xử lý ảnh bìa ${rule.name || sourceInfo.type}...`);
                    sourceData.coverUrl = await rule.coverProcess(sourceData.coverUrl);
                }
                state.rawData = raw;
                state.sourceData = sourceData;
                state.sourceType = sourceInfo.type;
                state.sourceLabel = sourceData.sourceLabel;
                log('Đã lấy dữ liệu. Đang dịch...');

                const titleCn = T.safeText(sourceData.titleCn);
                const authorCn = T.safeText(sourceData.authorCn);
                const descCn = T.safeText(sourceData.descCn);
                const nameSetRaw = shadowRoot.getElementById(`${APP_PREFIX}nameSet`).value;
                const nameSet = parseNameSet(nameSetRaw);
                state.nameSet = nameSet;
                const tagsRaw = sourceData.tags || [];
                const categoryNames = sourceData.categories || [];
                const assignTags = shouldAssignTagsForSource(sourceInfo.type);
                const descCnForTranslate = buildTaggedDescForTranslate(descCn, tagsRaw, assignTags);

                log(`Dịch tiêu đề (${titleCn.length} ký tự)...`);
                const titleVi = await translateTextWithNameSet(titleCn, nameSet, false);
                log('Dịch tiêu đề xong.', 'ok');
                log(`Dịch mô tả (${descCnForTranslate.length} ký tự)...`);
                if (tagsRaw.length && assignTags) log('Đã thêm dòng "Nhãn: ..." vào văn án trước khi dịch.', 'info');
                const descVi = await translateTextWithNameSet(descCnForTranslate, nameSet, true);
                log('Dịch mô tả xong.', 'ok');
                if (tagsRaw.length) log(`Dịch tags (${tagsRaw.length})...`);
                const tagsVi = await translateList(tagsRaw);
                if (tagsRaw.length) log('Dịch tags xong.', 'ok');
                if (categoryNames.length) log(`Dịch thể loại (${categoryNames.length})...`);
                const catsVi = await translateList(categoryNames);
                if (categoryNames.length) log('Dịch thể loại xong.', 'ok');

                state.translated = {
                    titleVi,
                    desc: descVi,
                    tags: tagsVi,
                    categories: catsVi,
                };

                log('Đang tạo gợi ý tick...');
                const suggestions = buildSuggestions(sourceData, state.translated, state.groups);
                state.suggestions = suggestions;
                log('Tạo gợi ý xong.', 'ok');

                log('Dịch xong. Đang tạo gợi ý...');
                fillText(`${APP_PREFIX}titleCn`, titleCn);
                fillText(`${APP_PREFIX}authorCn`, authorCn);
                fillText(`${APP_PREFIX}titleVi`, titleVi);
                setDescDrafts(descCn, descVi);
                fillText(`${APP_PREFIX}coverUrl`, sourceData.coverUrl || '');
                fillText(`${APP_PREFIX}moreLinkDesc`, sourceData.sourceLabel || '');
                fillText(`${APP_PREFIX}moreLinkUrl`, urlInput.value || '');

                fillSelect(shadowRoot.getElementById(`${APP_PREFIX}status`), state.groups.status, suggestions.status);
                fillSelect(shadowRoot.getElementById(`${APP_PREFIX}official`), state.groups.official, suggestions.official);
                fillSelect(shadowRoot.getElementById(`${APP_PREFIX}gender`), state.groups.gender, suggestions.gender);

                fillText(`${APP_PREFIX}age`, suggestions.age.join(', '));
                fillText(`${APP_PREFIX}ending`, suggestions.ending.join(', '));
                fillText(`${APP_PREFIX}genre`, suggestions.genre.join(', '));
                fillText(`${APP_PREFIX}tag`, suggestions.tag.join(', '));
                state.hasFetchedData = true;
                setApplyByDuplicateState();
                await triggerDuplicateCheck('fetch', true);
                setDataActionButtonsEnabled(true);
                setRecomputeBaseline(false);
                refreshCoverMeta(sourceData.coverUrl || '');
                showApplyToast('Lấy dữ liệu hoàn tất.', 'success', 1200);

                updateMatchIndicators();
                log('Gợi ý sẵn sàng. Bạn có thể chỉnh rồi bấm "Áp vào form".', 'ok');

                // --- AUTO AI TRIGGER ---
                if (state.settings.aiMode === 'ai' && state.settings.geminiApiKey) {
                    log('Chế độ AI: Đang tự động chạy phân tích...');
                    runAIAnalysis();
                }
                // -----------------------
            } catch (err) {
                state.hasFetchedData = false;
                resetDuplicateCheckState();
                setDataActionButtonsEnabled(false);
                setApplyByDuplicateState();
                state.recomputeBaseline = null;
                updateRecomputeNotice();
                log('Lỗi: ' + err.message, 'error');
                showApplyToast('Lấy dữ liệu thất bại, xem log.', 'error', 1700);
                console.error(err);
            }
        }
        async function handleRecompute() {
            if (!state.sourceData || !state.groups) {
                log('Chưa có dữ liệu để recompute.', 'warn');
                return;
            }
            syncSourceDraftFromInputs();
            const changedKeys = getRecomputeChanges();
            const baselineAiUsed = !!state.recomputeBaseline?.aiUsed;
            const titleCnEl = shadowRoot.getElementById(`${APP_PREFIX}titleCn`);
            const titleViEl = shadowRoot.getElementById(`${APP_PREFIX}titleVi`);
            const nameSetEl = shadowRoot.getElementById(`${APP_PREFIX}nameSet`);
            const needTranslateTitle = changedKeys.includes('nameSet') || changedKeys.includes('titleCn');
            const needTranslateDesc = changedKeys.includes('nameSet') || changedKeys.includes('descCn');

            const titleCnNow = T.safeText(titleCnEl?.value || state.sourceData.titleCn || '');
            const descCnNow = T.safeText(state.descDraft.zh || state.sourceData.descCn || '');
            const parsedNameSet = parseNameSet(nameSetEl?.value || '');
            state.nameSet = parsedNameSet;

            if (needTranslateTitle) {
                log('Recompute: Đang dịch lại tiêu đề...', 'info');
                const titleVi = await translateTextWithNameSet(titleCnNow, parsedNameSet, false);
                if (titleViEl) titleViEl.value = titleVi;
                state.translated = state.translated || {};
                state.translated.titleVi = titleVi;
                log('Recompute: Đã dịch lại tiêu đề.', 'ok');
            }
            if (needTranslateDesc) {
                log('Recompute: Đang dịch lại văn án...', 'info');
                const assignTags = shouldAssignTagsForSource(state.sourceData?.sourceType);
                const descCnForTranslate = buildTaggedDescForTranslate(descCnNow, state.sourceData?.tags || [], assignTags);
                const descVi = await translateTextWithNameSet(descCnForTranslate, parsedNameSet, true);
                state.translated = state.translated || {};
                state.translated.desc = descVi;
                state.descDraft.vi = descVi;
                if (state.descEditorMode === 'vi' && descTextarea) {
                    descTextarea.value = descVi;
                }
                log('Recompute: Đã dịch lại văn án.', 'ok');
            }

            if (state.sourceData) {
                state.sourceData.titleCn = titleCnNow;
                state.sourceData.descCn = descCnNow;
            }

            if (baselineAiUsed) {
                const aiSnapshot = deepClone(state.aiLastSuggestions || state.suggestions || null);
                if (!aiSnapshot) {
                    setRecomputeBaseline(true);
                    updateMatchIndicators();
                    log('Recompute (AI): Không tìm thấy snapshot AI, giữ nguyên các chọn hiện tại.', 'warn');
                    return;
                }
                const currentManaged = getCurrentAiManagedValues();
                const changedManagedKeys = getAiManagedDiffKeys(aiSnapshot, currentManaged);
                let useAiManagedValues = true;
                if (changedManagedKeys.length) {
                    const labels = changedManagedKeys.map(aiManagedKeyLabel).join(', ');
                    useAiManagedValues = window.confirm(
                        `Bạn đã chỉnh: ${labels}.\nOK = dùng lại gợi ý AI cho các mục này.\nCancel = giữ nguyên phần bạn vừa sửa.`
                    );
                }

                if (useAiManagedValues) {
                    shadowRoot.getElementById(`${APP_PREFIX}gender`).value = aiSnapshot.gender || '';
                    shadowRoot.getElementById(`${APP_PREFIX}official`).value = aiSnapshot.official || '';
                    shadowRoot.getElementById(`${APP_PREFIX}age`).value = (aiSnapshot.age || []).join(', ');
                    shadowRoot.getElementById(`${APP_PREFIX}ending`).value = (aiSnapshot.ending || []).join(', ');
                    shadowRoot.getElementById(`${APP_PREFIX}genre`).value = (aiSnapshot.genre || []).join(', ');
                    shadowRoot.getElementById(`${APP_PREFIX}tag`).value = (aiSnapshot.tag || []).join(', ');
                    state.suggestions = {
                        status: state.suggestions?.status || '',
                        official: aiSnapshot.official || '',
                        gender: aiSnapshot.gender || '',
                        age: aiSnapshot.age || [],
                        ending: aiSnapshot.ending || [],
                        genre: aiSnapshot.genre || [],
                        tag: aiSnapshot.tag || [],
                    };
                } else {
                    const kept = getCurrentAiManagedValues();
                    state.suggestions = {
                        status: state.suggestions?.status || '',
                        official: kept.official || '',
                        gender: kept.gender || '',
                        age: kept.age || [],
                        ending: kept.ending || [],
                        genre: kept.genre || [],
                        tag: kept.tag || [],
                    };
                }
                state.aiLastSuggestions = deepClone(aiSnapshot);
                setRecomputeBaseline(true);
                updateMatchIndicators();
                if (!changedKeys.length) {
                    log('Recompute (AI): Không có thay đổi để dịch lại.', 'info');
                } else {
                    log(`Recompute (AI): Đã cập nhật ${changedKeys.length} mục thay đổi.`, 'ok');
                }
                if (changedManagedKeys.length) {
                    log(useAiManagedValues
                        ? 'Recompute (AI): Đã dùng lại các trường phân loại từ AI.'
                        : 'Recompute (AI): Giữ nguyên các trường phân loại do bạn chỉnh tay.', useAiManagedValues ? 'ok' : 'info');
                }
                return;
            }

            const extra = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}extraKeywords`).value);
            const baseKeywords = buildKeywordList(state.sourceData, state.translated);
            const combinedKeywords = baseKeywords.concat(extra);
            const descCn = T.safeText(state.sourceData.descCn);
            const descVi = T.safeText(state.translated?.desc || '');
            const useDesc = shouldUseDescForSource(state.sourceData?.sourceType);
            const contexts = [];
            const metaText = combinedKeywords.join(' ');
            if (metaText) {
                contexts.push({
                    text: normalizeKeepAccents(metaText),
                    normText: T.normalizeText(metaText),
                    weight: 1.5
                });
            }
            if (useDesc) {
                const descText = `${descCn} \n ${descVi}`;
                contexts.push({
                    text: normalizeKeepAccents(descText),
                    normText: T.normalizeText(descText),
                    weight: 1.0
                });
            }

            const classificationSignal = buildClassificationSignal(state.sourceData, state.translated, combinedKeywords);
            const preferredAgeLabel = detectPreferredAgeLabel(classificationSignal, state.groups.age);
            const preferredGenreLabels = [];
            const preferredTagLabels = [];
            const preferredAltGenre = detectPreferredAltHistoryLabel(classificationSignal, state.groups.genre);
            const preferredAltTag = detectPreferredAltHistoryLabel(classificationSignal, state.groups.tag);
            if (preferredAltGenre) preferredGenreLabels.push(preferredAltGenre);
            if (preferredAltTag) preferredTagLabels.push(preferredAltTag);
            const threshold = getScoreThreshold();
            const allowMultiEnding = hasXuyenNhanh(combinedKeywords);
            const suggestions = {
                status: state.suggestions?.status || '',
                official: state.suggestions?.official || '',
                gender: state.suggestions?.gender || '',
                age: pickMulti(boostScoredOptions(scoreOptions(state.groups.age, contexts), preferredAgeLabel ? [preferredAgeLabel] : []), 4, true, false, threshold),
                ending: pickMulti(scoreOptions(state.groups.ending, contexts), allowMultiEnding ? 3 : 1, true, false, threshold),
                genre: pickMulti(boostScoredOptions(scoreOptions(state.groups.genre, contexts), preferredGenreLabels), 8, true, false, threshold),
                tag: pickMulti(boostScoredOptions(scoreOptions(state.groups.tag, contexts), preferredTagLabels), MAX_TAGS_SELECT, true, true, threshold),
            };
            state.suggestions = { ...state.suggestions, ...suggestions };
            fillText(`${APP_PREFIX}age`, suggestions.age.join(', '));
            fillText(`${APP_PREFIX}ending`, suggestions.ending.join(', '));
            fillText(`${APP_PREFIX}genre`, suggestions.genre.join(', '));
            fillText(`${APP_PREFIX}tag`, suggestions.tag.join(', '));
            state.aiLastSuggestions = null;
            setRecomputeBaseline(false);
            updateMatchIndicators();
            if (!changedKeys.length) {
                log('Đã recompute theo từ khóa bổ sung.', 'ok');
            } else {
                log(`Đã recompute và cập nhật ${changedKeys.length} mục thay đổi.`, 'ok');
            }
        }

        async function handleApply() {
            if (!state.hasFetchedData) {
                log('Hãy bấm "Lấy dữ liệu" thành công trước khi áp vào form.', 'warn');
                return;
            }
            if (isEmbedPage()) {
                const checkState = state.duplicateCheck || {};
                if (checkState.pending) {
                    log('Đang kiểm tra trùng truyện, bạn vẫn có thể Áp vào form (nút Nhúng có thể bị khóa sau khi check xong).', 'warn');
                }
                if (checkState.blocked) {
                    showDuplicateWarning();
                    log('Phát hiện truyện trùng: vẫn cho Áp vào form, nhưng sẽ khóa nút Nhúng của Web nếu form đang trùng đúng cặp tên + tác giả.', 'warn');
                }
            }
            try {
                if (!state.groups) state.groups = getGroupOptions();
                const planned = getPlannedValues();
                const excludes = getExcludesForApply();

                if (isEditPage()) {
                    const current = getCurrentFormValues();
                    const diffs = buildDiffs(current, planned, excludes);
                    const ok = await showDiffModal(diffs);
                    if (!ok) return;
                }

                showApplyToast('Đang áp vào form...', 'loading');

                if (!excludes.titleCn) setInputValue(document.getElementById('txtTitleCn'), planned.titleCn);
                if (!excludes.authorCn) setInputValue(document.getElementById('txtAuthorCn'), planned.authorCn);
                if (!excludes.titleVi) setInputValue(document.getElementById('txtTitleVi'), planned.titleVi);
                if (!excludes.descVi) setInputValue(document.getElementById('txtDescVi'), state.settings.autoBreakDesc ? autoBreakLongDesc(planned.descVi) : planned.descVi);

                if (!excludes.status) applyRadio(state.groups.status, planned.status);
                if (!excludes.official) applyRadio(state.groups.official, planned.official);
                if (!excludes.gender) applyRadio(state.groups.gender, planned.gender);

                if (!excludes.age) applyCheckboxes(state.groups.age, planned.age || []);
                if (!excludes.ending) applyCheckboxes(state.groups.ending, planned.ending || []);
                if (!excludes.genre) applyCheckboxes(state.groups.genre, planned.genre || []);
                if (!excludes.tag) applyCheckboxes(state.groups.tag, planned.tag || []);

                if (!excludes.moreLink) {
                    const parts = planned.moreLink.split('|').map(v => v.trim());
                    const finalLinkDesc = parts[0] || '';
                    const finalLinkUrl = parts[1] || '';
                    setMoreLink(finalLinkDesc, finalLinkUrl);
                }
                if (!excludes.coverUrl) await applyCover(planned.coverUrl, log);
                updateMatchIndicators();
                updateEmbedSubmitByDuplicateState('apply');
                log('Đã áp dữ liệu vào form.', 'ok');
                showApplyToast('Áp xong, dữ liệu đã vào form.', 'success', 1300);
            } catch (err) {
                log('Lỗi khi áp dữ liệu: ' + err.message, 'error');
                showApplyToast('Áp thất bại, xem log để sửa.', 'error', 1600);
            }
        }

        let duplicateCheckTimer = null;
        const hasCjk = (text) => /[\u3400-\u9fff]/.test((text || '').toString());
        const getDuplicateInputs = () => ({
            titleCn: T.safeText(titleCnInput?.value || ''),
            authorCn: T.safeText(authorCnInput?.value || ''),
        });
        const getWebFormDuplicateKey = () => {
            const titleCn = T.safeText(document.getElementById('txtTitleCn')?.value || '');
            const authorCn = T.safeText(document.getElementById('txtAuthorCn')?.value || '');
            return `${titleCn}|||${authorCn}`;
        };
        const getEmbedSubmitButton = () => {
            // Prefer the submit button in the same form as txtTitleCn to avoid false matches.
            const titleEl = document.getElementById('txtTitleCn');
            const form = titleEl?.closest('form') || document.querySelector('form');
            const root = form || document;

            const nodes = Array.from(root.querySelectorAll('button, input[type=\"submit\"], input[type=\"button\"], a'));
            const isNhung = (el) => {
                const tag = (el.tagName || '').toLowerCase();
                const text = tag === 'input' ? (el.value || '') : (el.textContent || '');
                const t = (text || '').replace(/\\s+/g, ' ').trim().toLowerCase();
                return t === 'nhúng' || t.includes('nhúng');
            };
            return nodes.find(isNhung) || null;
        };
        let lastEmbedDisabled = null;
        const setEmbedSubmitDisabled = (disabled, reason) => {
            const btn = getEmbedSubmitButton();
            if (!btn) return;
            const want = !!disabled;
            if (lastEmbedDisabled === want) return;
            lastEmbedDisabled = want;

            if ('disabled' in btn) btn.disabled = want;
            btn.setAttribute('aria-disabled', want ? 'true' : 'false');
            if (want) {
                btn.classList.add('disabled');
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.55';
                btn.title = reason || 'Không thể Nhúng.';
                log('Đã khóa nút Nhúng trên web do trùng truyện (đúng cặp tên + tác giả trên web).', 'warn');
            } else {
                btn.classList.remove('disabled');
                btn.style.pointerEvents = '';
                btn.style.opacity = '';
                btn.title = '';
                log('Đã mở lại nút Nhúng trên web (cặp tên + tác giả trên web đã thay đổi).', 'info');
            }
        };
        const updateEmbedSubmitByDuplicateState = (reason = 'sync') => {
            if (!isEmbedPage()) return;
            const check = state.duplicateCheck || {};

            // Only lock Nhúng when we positively detected duplicate.
            if (!check.blocked || !check.lastKey) {
                setEmbedSubmitDisabled(false);
                return;
            }

            const currentKey = getWebFormDuplicateKey();
            const shouldDisable = currentKey === check.lastKey;
            if (shouldDisable) {
                setEmbedSubmitDisabled(true, 'Truyện bị trùng trên server. Hãy đổi Tên gốc/Tác giả trên web (hoặc dùng truyện khác) rồi thử lại.');
            } else {
                setEmbedSubmitDisabled(false);
            }
        };
        const shouldCheckDuplicate = ({ titleCn, authorCn }) => {
            if (!isEmbedPage()) return false;
            if (!titleCn || !authorCn) return false;
            return hasCjk(titleCn) && hasCjk(authorCn);
        };
        const setApplyByDuplicateState = () => {
            if (!applyBtn) return;
            if (!state.hasFetchedData) {
                applyBtn.disabled = true;
                applyBtn.title = 'Hãy bấm "Lấy dữ liệu" thành công trước.';
                updateEmbedSubmitByDuplicateState('no-data');
                return;
            }
            if (!isEmbedPage()) {
                applyBtn.disabled = false;
                applyBtn.title = '';
                updateEmbedSubmitByDuplicateState('not-embed');
                return;
            }
            const check = state.duplicateCheck || {};
            if (check.pending) {
                applyBtn.title = 'Đang kiểm tra truyện trùng trên server...';
            } else if (check.deepPending) {
                applyBtn.title = 'Đang quét sâu trang tác giả để đối chiếu ảnh bìa...';
            } else if (check.deepPossibleDuplicate) {
                applyBtn.title = 'Đang chờ bạn xác minh truyện nghi trùng trong popup.';
            }
            if (check.blocked) {
                applyBtn.title = 'Truyện có thể bị trùng. Vẫn cho Áp vào form, nhưng nút Nhúng sẽ bị khóa nếu form trùng đúng cặp.';
            }
            applyBtn.disabled = false;
            if (!check.pending && !check.blocked) applyBtn.title = '';
            updateEmbedSubmitByDuplicateState('apply-state');
        };
        let pendingDeepDuplicateCandidate = null;
        const renderDeepDuplicateBody = (candidate) => {
            if (!duplicateDeepBody) return;
            if (!candidate) {
                duplicateDeepBody.innerHTML = '<div>Không có dữ liệu để hiển thị.</div>';
                return;
            }
            const coverSimilarity = Math.round((candidate.similarity || 0) * 100);
            const titleSimilarity = Math.round((candidate.titleSimilarity || 0) * 100);
            const currentCover = toAbsoluteUrl(coverUrlInput?.value || state.sourceData?.coverUrl || '');
            const targetUrl = candidate.url || candidate.authorPageUrl || '';
            const hasMorePages = !!candidate.hasMorePages;
            duplicateDeepBody.innerHTML = `
                <div style="margin-bottom:8px;">${escapeHtml(candidate.reasonLabel || 'Trang đầu tác giả trên domain hiện tại có 1 truyện nghi trùng.')}</div>
                ${candidate.reasonText ? `<div style="margin-bottom:8px; color:#92400e;"><b>Tín hiệu:</b> ${escapeHtml(candidate.reasonText)}</div>` : ''}
                ${candidate.sourceTitleVi ? `<div style="margin-bottom:8px;"><b>Tên dịch hiện tại:</b> ${escapeHtml(candidate.sourceTitleVi)}</div>` : ''}
                <div style="margin-bottom:8px;"><b>Truyện nghi trùng:</b> ${escapeHtml(candidate.title || '(không rõ tên)')}</div>
                ${titleSimilarity ? `<div style="margin-bottom:8px;"><b>Độ giống tên dịch:</b> ${titleSimilarity}%</div>` : ''}
                ${coverSimilarity ? `<div style="margin-bottom:8px;"><b>Độ giống ảnh bìa:</b> ${coverSimilarity}%</div>` : ''}
                <div style="margin-bottom:8px; color:#92400e;"><b>Ghi chú:</b> ${hasMorePages ? 'Tác giả còn phân trang, nên nếu bạn xác nhận Không trùng thì độ an toàn tối đa giữ ở 90%.' : 'Không thấy phân trang thêm ở trang tác giả này.'}</div>
                <div style="margin-bottom:8px; color:#475569;">Bạn có thể bấm <b>Mở</b> để so lại bằng mắt trước, rồi chọn <b>Trùng</b> hoặc <b>Không trùng</b>.</div>
                <div style="display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:12px; margin-top:10px;">
                    <div style="border:1px solid rgba(148,163,184,.25); border-radius:12px; padding:10px; background:rgba(255,255,255,.72);">
                        <div style="font-weight:700; margin-bottom:6px;">Ảnh đang lấy dữ liệu</div>
                        ${currentCover ? `<img src="${escapeHtml(currentCover)}" style="width:100%; max-height:180px; object-fit:cover; border-radius:10px;" />` : '<div class="' + APP_PREFIX + 'hint">Không có ảnh để so.</div>'}
                    </div>
                    <div style="border:1px solid rgba(148,163,184,.25); border-radius:12px; padding:10px; background:rgba(255,255,255,.72);">
                        <div style="font-weight:700; margin-bottom:6px;">Ảnh trên trang tác giả</div>
                        ${candidate.coverUrl ? `<img src="${escapeHtml(candidate.coverUrl)}" style="width:100%; max-height:180px; object-fit:cover; border-radius:10px;" />` : '<div class="' + APP_PREFIX + 'hint">Không có ảnh để so.</div>'}
                    </div>
                </div>
                <div style="margin-top:10px;"><b>Link mở kiểm tra:</b> ${targetUrl ? `<a href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(targetUrl)}</a>` : 'Không có'}</div>
            `;
        };
        const showDeepDuplicateModal = (candidate) => {
            pendingDeepDuplicateCandidate = candidate;
            renderDeepDuplicateBody(candidate);
            if (duplicateDeepModal) duplicateDeepModal.style.display = 'flex';
        };
        const closeDeepDuplicateModal = () => {
            if (duplicateDeepModal) duplicateDeepModal.style.display = 'none';
            pendingDeepDuplicateCandidate = null;
        };
        const resolveDeepDuplicateDecision = (isDuplicate) => {
            const check = state.duplicateCheck || {};
            const candidate = pendingDeepDuplicateCandidate || check.deepCandidate || null;
            const hasMorePages = !!(candidate?.hasMorePages || check.hasMoreAuthorPages);
            check.deepPossibleDuplicate = false;
            if (isDuplicate) {
                setDuplicateSafety(0, 'danger', `Bạn đã xác nhận truyện nghi trùng${candidate?.title ? `: ${candidate.title}` : ''}.`);
                log(`Bạn đã xác nhận truyện nghi trùng${candidate?.title ? ` với "${candidate.title}"` : ''}.`, 'warn');
            } else {
                const nextScore = hasMorePages ? 90 : 95;
                const reason = hasMorePages
                    ? 'Bạn đã xác nhận Không trùng, nhưng tác giả còn phân trang nên giữ mức an toàn 90%.'
                    : 'Bạn đã xác nhận Không trùng. Nâng độ an toàn lên 95%.';
                setDuplicateSafety(nextScore, 'ok', reason);
                log(`Bạn đã xác nhận không trùng${candidate?.title ? ` với "${candidate.title}"` : ''}. Độ an toàn ${nextScore}%.`, 'ok');
            }
            setApplyByDuplicateState();
            closeDeepDuplicateModal();
        };
        const fetchAuthorWorksPage = async (authorCn) => {
            const url = `${location.origin}/tac-gia/${encodeURIComponent(authorCn)}?start=0`;
            const res = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
                headers: {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache',
                },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const html = await res.text();
            const finalUrl = res.url || url;
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const items = Array.from(doc.querySelectorAll('.book-list .book-item')).map((item) => {
                const linkEl = item.querySelector('a.cover-wrapper, a[href*="/truyen/"]');
                const title = T.safeText(item.querySelector('.book-title')?.textContent || linkEl?.textContent || '');
                const href = toAbsoluteUrl(linkEl?.getAttribute('href') || '', finalUrl);
                const coverUrl = toAbsoluteUrl(item.querySelector('img')?.getAttribute('src') || '', finalUrl);
                return { title, url: href, coverUrl };
            }).filter((item) => item.title || item.url || item.coverUrl);
            const hasMorePages = Array.from(doc.querySelectorAll('.pagination a[href*="start="]')).some((link) => {
                const href = toAbsoluteUrl(link.getAttribute('href') || '', finalUrl);
                try {
                    return (parseInt(new URL(href).searchParams.get('start') || '0', 10) || 0) > 0;
                } catch {
                    return false;
                }
            });
            return { url: finalUrl, items, hasMorePages };
        };
        const findBestAuthorCoverMatch = async (sourceCoverUrl, items) => {
            const sourceHash = await buildCoverAverageHash(sourceCoverUrl);
            let best = null;
            for (const item of items || []) {
                if (!item.coverUrl) continue;
                try {
                    const candidateHash = await buildCoverAverageHash(item.coverUrl);
                    const similarity = compareCoverHashes(sourceHash, candidateHash);
                    if (!best || similarity > best.similarity) {
                        best = { ...item, similarity };
                    }
                } catch (err) {
                    log(`Check sâu: bỏ qua 1 ảnh bìa do lỗi đọc ảnh (${err.message}).`, 'warn');
                }
            }
            return best;
        };
        const findBestAuthorTitleMatch = (sourceTitle, items) => {
            const baseTitle = T.safeText(sourceTitle);
            if (!baseTitle) return null;
            let best = null;
            for (const item of items || []) {
                const candidateTitle = T.safeText(item?.title || '');
                if (!candidateTitle) continue;
                const meta = computeTitleSimilarity(baseTitle, candidateTitle);
                if (!best || meta.score > best.titleSimilarity) {
                    best = { ...item, titleSimilarity: meta.score, titleMatchMeta: meta };
                }
            }
            return best;
        };
        const getTitleMatchRisk = (match, baseScore) => {
            if (!match || !Number.isFinite(match.titleSimilarity)) return null;
            const similarityPct = Math.round(match.titleSimilarity * 100);
            const meta = match.titleMatchMeta || {};
            if (meta.nearContained || match.titleSimilarity >= 0.985) {
                return {
                    score: 0,
                    requiresConfirm: true,
                    reason: `Tên dịch gần như nằm gọn trong "${match.title}" (${similarityPct}%).`,
                };
            }
            if (match.titleSimilarity >= 0.93) {
                return {
                    score: Math.min(baseScore, 35),
                    requiresConfirm: true,
                    reason: `Tên dịch rất giống "${match.title}" (${similarityPct}%).`,
                };
            }
            if (match.titleSimilarity >= 0.86) {
                return {
                    score: Math.min(baseScore, 58),
                    requiresConfirm: false,
                    reason: `Tên dịch giống cao với "${match.title}" (${similarityPct}%).`,
                };
            }
            if (match.titleSimilarity >= 0.78) {
                return {
                    score: Math.min(baseScore, 72),
                    requiresConfirm: false,
                    reason: `Tên dịch khá giống "${match.title}" (${similarityPct}%).`,
                };
            }
            if (match.titleSimilarity >= 0.68) {
                return {
                    score: Math.min(baseScore, Math.max(60, baseScore - 10)),
                    requiresConfirm: false,
                    reason: `Tên dịch hơi gần "${match.title}" (${similarityPct}%).`,
                };
            }
            return null;
        };
        const runDeepDuplicateCheck = async ({ authorCn, coverUrl, titleVi, runId }) => {
            const check = state.duplicateCheck || {};
            if (!isEmbedPage() || state.settings?.deepDuplicateCheck === false) return;
            if (!authorCn) return;
            check.deepPending = true;
            check.deepChecked = false;
            check.deepPossibleDuplicate = false;
            check.deepCandidate = null;
            setDuplicateSafety(check.safetyScore ?? 80, 'pending', 'Check cơ bản xong, đang quét sâu trang tác giả (ảnh bìa + tên dịch)...');
            setApplyByDuplicateState();
            log('Đang quét sâu trang tác giả để đối chiếu ảnh bìa + tên dịch...', 'info');
            try {
                const page = await fetchAuthorWorksPage(authorCn);
                if (state.duplicateCheck.runId !== runId) return;
                check.deepPending = false;
                check.deepChecked = true;
                check.authorPageUrl = page.url;
                check.hasMoreAuthorPages = !!page.hasMorePages;
                if (!page.items.length) {
                    setDuplicateSafety(100, 'ok', 'Trang đầu tác giả chưa có truyện nào để đối chiếu.');
                    setApplyByDuplicateState();
                    log('Check sâu xong: trang đầu tác giả không có truyện để đối chiếu, độ an toàn 100%.', 'ok');
                    return;
                }
                const baseScore = page.hasMorePages ? 90 : 100;
                const bestTitle = findBestAuthorTitleMatch(titleVi, page.items);
                const titleRisk = getTitleMatchRisk(bestTitle, baseScore);
                const bestCover = coverUrl ? await findBestAuthorCoverMatch(coverUrl, page.items) : null;
                if (state.duplicateCheck.runId !== runId) return;
                const coverRisk = bestCover && bestCover.similarity >= DEEP_DUPLICATE_COVER_MATCH_THRESHOLD
                    ? {
                        score: 50,
                        requiresConfirm: true,
                        reason: `Ảnh bìa giống "${bestCover.title}" ${Math.round(bestCover.similarity * 100)}%.`,
                    }
                    : null;
                const strongestRisk = [coverRisk && { ...coverRisk, candidate: bestCover }, titleRisk && { ...titleRisk, candidate: bestTitle }]
                    .filter(Boolean)
                    .sort((a, b) => a.score - b.score)[0] || null;
                if (strongestRisk && strongestRisk.requiresConfirm) {
                    check.deepPossibleDuplicate = true;
                    const candidate = {
                        ...(strongestRisk.candidate || {}),
                        authorPageUrl: page.url,
                        hasMorePages: page.hasMorePages,
                        titleSimilarity: strongestRisk.candidate?.titleSimilarity,
                        reasonLabel: strongestRisk.score <= 0 ? 'Tên dịch nghi trùng rất cao' : 'Nghi trùng cần bạn xác minh',
                        reasonText: strongestRisk.reason,
                        sourceTitleVi: T.safeText(titleVi),
                    };
                    check.deepCandidate = candidate;
                    setDuplicateSafety(strongestRisk.score, strongestRisk.score <= 0 ? 'danger' : 'warn', `${strongestRisk.reason} Chờ bạn xác minh.`);
                    setApplyByDuplicateState();
                    log(`Check sâu: ${strongestRisk.reason}`, strongestRisk.score <= 0 ? 'error' : 'warn');
                    showDeepDuplicateModal(candidate);
                    return;
                }
                check.deepCandidate = bestCover || bestTitle;
                let nextScore = baseScore;
                const reasonParts = [];
                if (!coverUrl) {
                    reasonParts.push('Không có ảnh bìa nguồn nên bỏ qua so ảnh.');
                    log('Check sâu bỏ qua so ảnh vì chưa có cover URL.', 'warn');
                }
                if (titleRisk) {
                    nextScore = Math.min(nextScore, titleRisk.score);
                    reasonParts.push(titleRisk.reason);
                    log(`Check sâu: ${titleRisk.reason}`, nextScore >= 85 ? 'info' : 'warn');
                }
                if (!reasonParts.length) {
                    reasonParts.push(page.hasMorePages
                        ? 'Quét sâu không thấy trùng ở trang 1 của tác giả; do còn phân trang nên giữ 90%.'
                        : 'Quét sâu không thấy truyện trùng ở trang đầu tác giả.');
                }
                const reason = reasonParts.join(' ');
                setDuplicateSafety(nextScore, 'ok', reason);
                setApplyByDuplicateState();
                log(`Check sâu xong: độ an toàn ${nextScore}%.`, 'ok');
            } catch (err) {
                if (state.duplicateCheck.runId !== runId) return;
                check.deepPending = false;
                check.deepChecked = false;
                check.deepPossibleDuplicate = false;
                setDuplicateSafety(check.checked && !check.blocked ? 80 : check.safetyScore, 'warn', 'Check sâu lỗi, giữ mức an toàn cơ bản.');
                setApplyByDuplicateState();
                log(`Check sâu lỗi: ${err.message}`, 'warn');
            }
        };
        const showDuplicateWarning = () => {
            const { titleCn, authorCn } = getDuplicateInputs();
            if (duplicateBody) {
                duplicateBody.innerHTML = `
                    <div style="margin-bottom:8px;">Phát hiện truyện trùng trên server.</div>
                    <div><b>Tên gốc:</b> ${escapeHtml(titleCn)}</div>
                    <div><b>Tác giả:</b> ${escapeHtml(authorCn)}</div>
                    <div style="margin-top:8px; color:#b71c1c;">Nút <b>Nhúng</b> trên web sẽ bị khóa nếu form đang trùng đúng cặp tên + tác giả này.</div>
                `;
            }
            if (duplicateModal) duplicateModal.style.display = 'flex';
        };
        const parseDuplicateResponse = (payload) => {
            if (payload && typeof payload === 'object') {
                if (typeof payload?.data?.exists === 'boolean') return payload.data.exists;
                if (typeof payload.exists === 'boolean') return payload.exists;
            }
            throw new Error('Dữ liệu check trùng không hợp lệ.');
        };
        const fetchDuplicateExists = async (titleCn, authorCn) => {
            const url = `${location.origin}/book/check?${new URLSearchParams({ titleCn, authorCn }).toString()}`;
            const res = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
                headers: {
                    'accept': '*/*',
                    'x-requested-with': 'XMLHttpRequest',
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache',
                },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const payload = await res.json();
            return parseDuplicateResponse(payload);
        };
        const triggerDuplicateCheck = async (reason = 'input', force = false) => {
            if (!isEmbedPage()) return;
            const check = state.duplicateCheck;
            const { titleCn, authorCn } = getDuplicateInputs();
            if (!shouldCheckDuplicate({ titleCn, authorCn })) {
                resetDuplicateCheckState();
                closeDeepDuplicateModal();
                setApplyByDuplicateState();
                return;
            }
            const currentKey = `${titleCn}|||${authorCn}`;
            const shouldRunDeep = reason === 'fetch' && state.settings?.deepDuplicateCheck !== false;
            const deepReady = !shouldRunDeep || check.blocked || check.deepChecked || check.deepPending;
            if (!force && !check.pending && check.checked && !check.failed && check.lastKey === currentKey && deepReady) {
                setApplyByDuplicateState();
                return;
            }
            check.pending = true;
            check.blocked = false;
            check.failed = false;
            check.checked = false;
            check.deepPending = false;
            check.deepChecked = false;
            check.deepPossibleDuplicate = false;
            check.deepCandidate = null;
            check.hasMoreAuthorPages = false;
            check.authorPageUrl = '';
            check.lastKey = currentKey;
            const runId = (check.runId || 0) + 1;
            check.runId = runId;
            closeDeepDuplicateModal();
            setDuplicateSafety(null, 'idle', '');
            setApplyByDuplicateState();
            log(`Đang kiểm tra trùng truyện trên server (${reason})...`, 'info');

            const maxRetry = 3;
            for (let attempt = 1; attempt <= maxRetry; attempt++) {
                if (check.runId !== runId) return;
                try {
                    const exists = await fetchDuplicateExists(titleCn, authorCn);
                    if (check.runId !== runId) return;
                    check.pending = false;
                    check.checked = true;
                    check.failed = false;
                    check.blocked = !!exists;
                    if (exists) {
                        setDuplicateSafety(0, 'danger', 'Check cơ bản trên server báo truyện đã trùng.');
                        setApplyByDuplicateState();
                        log('Phát hiện truyện trùng trên server. Sẽ khóa nút Nhúng nếu form trùng đúng cặp tên + tác giả.', 'error');
                        showDuplicateWarning();
                        return;
                    }
                    setDuplicateSafety(80, shouldRunDeep ? 'pending' : 'ok', shouldRunDeep
                        ? 'Check cơ bản xong, đang quét sâu trang tác giả...'
                        : 'Check cơ bản xong: không có truyện trùng trên server.');
                    setApplyByDuplicateState();
                    log('Check trùng xong: không có truyện trùng.', 'ok');
                    if (shouldRunDeep) {
                        const coverUrl = T.safeText(coverUrlInput?.value || state.sourceData?.coverUrl || '');
                        const titleVi = T.safeText(titleViInput?.value || state.translated?.titleVi || '');
                        await runDeepDuplicateCheck({ authorCn, coverUrl, titleVi, runId });
                    }
                    return;
                } catch (err) {
                    if (check.runId !== runId) return;
                    log(`Check trùng lỗi lần ${attempt}/3: ${err.message}`, 'warn');
                    if (attempt < maxRetry) await sleep(500);
                }
            }
            if (check.runId !== runId) return;
            check.pending = false;
            check.checked = false;
            check.failed = true;
            check.blocked = false;
            check.deepPending = false;
            check.deepChecked = false;
            check.deepPossibleDuplicate = false;
            check.deepCandidate = null;
            setDuplicateSafety(null, 'warn', 'Check trùng thất bại.');
            setApplyByDuplicateState();
            log('Check trùng thất bại sau 3 lần, cho phép Áp vào form.', 'warn');
        };
        const scheduleDuplicateCheck = (reason = 'input') => {
            if (!isEmbedPage()) return;
            if (duplicateCheckTimer) clearTimeout(duplicateCheckTimer);
            duplicateCheckTimer = setTimeout(() => {
                triggerDuplicateCheck(reason);
            }, 450);
        };

        let dragging = false;
        let dragMoved = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        const savedPos = GM_getValue(`${APP_PREFIX}btn_pos`, null);
        if (savedPos && Number.isFinite(savedPos.left) && Number.isFinite(savedPos.top)) {
            btn.style.left = `${savedPos.left}px`;
            btn.style.top = `${savedPos.top}px`;
            btn.style.right = 'auto';
            btn.style.bottom = 'auto';
        }

        function getPoint(ev) {
            if (ev.touches && ev.touches.length) return ev.touches[0];
            return ev;
        }

        function onDragStart(ev) {
            const point = getPoint(ev);
            const rect = btn.getBoundingClientRect();
            dragging = true;
            dragMoved = false;
            dragOffsetX = point.clientX - rect.left;
            dragOffsetY = point.clientY - rect.top;
            ev.preventDefault();
        }

        function onDragMove(ev) {
            if (!dragging) return;
            const point = getPoint(ev);
            const rect = btn.getBoundingClientRect();
            const left = Math.max(0, Math.min(window.innerWidth - rect.width, point.clientX - dragOffsetX));
            const top = Math.max(0, Math.min(window.innerHeight - rect.height, point.clientY - dragOffsetY));
            btn.style.left = `${left}px`;
            btn.style.top = `${top}px`;
            btn.style.right = 'auto';
            btn.style.bottom = 'auto';
            dragMoved = true;
            ev.preventDefault();
        }

        function onDragEnd() {
            if (!dragging) return;
            dragging = false;
            const rect = btn.getBoundingClientRect();
            GM_setValue(`${APP_PREFIX}btn_pos`, { left: Math.round(rect.left), top: Math.round(rect.top) });
        }

        btn.addEventListener('mousedown', onDragStart);
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
        btn.addEventListener('touchstart', onDragStart, { passive: false });
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);
        window.addEventListener('resize', () => {
            syncDuplicateSafetyPosition();
        });

        const openPanel = () => {
            panel.style.display = 'flex';
            updateMatchIndicators();
            syncDuplicateSafetyPosition();
        };
        const closePanel = () => {
            panel.style.display = 'none';
            syncDuplicateSafetyPosition();
        };
        const togglePanel = () => {
            const isHidden = getComputedStyle(panel).display === 'none';
            panel.style.display = isHidden ? 'flex' : 'none';
            if (isHidden) updateMatchIndicators();
            syncDuplicateSafetyPosition();
        };
        const setQuickPanelVisible = (visible) => {
            if (!quickPanel || !quickToolBtn) return;
            quickPanel.style.display = visible ? 'flex' : 'none';
            quickToolBtn.classList.toggle('active', !!visible);
        };
        const toggleQuickPanel = () => {
            if (!quickPanel) return;
            const hidden = getComputedStyle(quickPanel).display === 'none';
            setQuickPanelVisible(hidden);
        };
        const syncFullscreenButton = () => {
            if (!fullscreenBtn) return;
            const isFullscreen = panel.classList.contains(panelFullscreenClass);
            fullscreenBtn.classList.toggle('active', isFullscreen);
            fullscreenBtn.setAttribute('title', isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình');
            fullscreenBtn.textContent = isFullscreen ? '🗗' : '⛶';
        };
        const togglePanelFullscreen = () => {
            const next = !panel.classList.contains(panelFullscreenClass);
            panel.classList.toggle(panelFullscreenClass, next);
            GM_setValue(`${APP_PREFIX}panel_fullscreen`, next);
            syncFullscreenButton();
            requestAnimationFrame(syncDuplicateSafetyPosition);
        };
        if (GM_getValue(`${APP_PREFIX}panel_fullscreen`, false)) {
            panel.classList.add(panelFullscreenClass);
        }
        syncFullscreenButton();

        function enableDrag(panelEl, handleEl, storageKey) {
            let dragging = false;
            let offsetX = 0;
            let offsetY = 0;
            const saved = GM_getValue(storageKey, null);
            if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
                panelEl.style.left = `${saved.left}px`;
                panelEl.style.top = `${saved.top}px`;
                panelEl.style.right = 'auto';
                panelEl.style.bottom = 'auto';
            }

            const getPoint = (ev) => (ev.touches && ev.touches.length ? ev.touches[0] : ev);

            const onStart = (ev) => {
                if (ev.target && ev.target.closest('button')) return;
                if (panelEl.classList.contains(panelFullscreenClass)) return;
                const point = getPoint(ev);
                const rect = panelEl.getBoundingClientRect();
                dragging = true;
                offsetX = point.clientX - rect.left;
                offsetY = point.clientY - rect.top;
                panelEl.style.left = rect.left + 'px';
                panelEl.style.top = rect.top + 'px';
                panelEl.style.right = 'auto';
                panelEl.style.bottom = 'auto';
                ev.preventDefault();
            };

            const onMove = (ev) => {
                if (!dragging) return;
                const point = getPoint(ev);
                const rect = panelEl.getBoundingClientRect();
                const maxLeft = Math.max(0, window.innerWidth - rect.width);
                const maxTop = Math.max(0, window.innerHeight - rect.height);
                const left = Math.max(0, Math.min(maxLeft, point.clientX - offsetX));
                const top = Math.max(0, Math.min(maxTop, point.clientY - offsetY));
                panelEl.style.left = `${left}px`;
                panelEl.style.top = `${top}px`;
                if (panelEl === panel) syncDuplicateSafetyPosition();
                ev.preventDefault();
            };

            const onEnd = () => {
                if (!dragging) return;
                dragging = false;
                const rect = panelEl.getBoundingClientRect();
                GM_setValue(storageKey, { left: Math.round(rect.left), top: Math.round(rect.top) });
                if (panelEl === panel) syncDuplicateSafetyPosition();
            };

            handleEl.addEventListener('mousedown', onStart);
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            handleEl.addEventListener('touchstart', onStart, { passive: false });
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onEnd);
        }

        enableDrag(panel, headerEl, `${APP_PREFIX}panel_pos`);
        if (quickPanel && quickHeader) {
            enableDrag(quickPanel, quickHeader, `${APP_PREFIX}quick_panel_pos`);
        }

        btn.addEventListener('click', () => {
            if (dragMoved) return;
            togglePanel();
        });
        close.addEventListener('click', () => {
            closePanel();
        });
        if (quickToolBtn) {
            quickToolBtn.addEventListener('click', () => {
                toggleQuickPanel();
            });
        }
        if (quickClose) {
            quickClose.addEventListener('click', () => {
                setQuickPanelVisible(false);
            });
        }
        if (quickRun) {
            quickRun.addEventListener('click', async () => {
                const text = quickInput?.value || '';
                const mode = quickMode?.value || 'vi';
                if (!T.safeText(text)) {
                    log('Dịch nhanh: chưa có nội dung.', 'warn');
                    return;
                }
                quickRun.disabled = true;
                if (quickCopy) quickCopy.disabled = true;
                showApplyToast('Dịch nhanh đang xử lý...', 'loading');
                try {
                    const out = await translateQuickText(text, mode);
                    if (quickOutput) quickOutput.value = out || '';
                    showApplyToast('Dịch nhanh hoàn tất.', 'success', 1200);
                    log(`Dịch nhanh (${mode}) xong.`, 'ok');
                } catch (err) {
                    showApplyToast('Dịch nhanh lỗi.', 'error', 1400);
                    log('Dịch nhanh lỗi: ' + (err?.message || err), 'error');
                } finally {
                    quickRun.disabled = false;
                    if (quickCopy) quickCopy.disabled = false;
                }
            });
        }
        if (quickInput) {
            quickInput.addEventListener('keydown', (ev) => {
                if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
                    ev.preventDefault();
                    quickRun?.click();
                }
            });
        }
        if (quickCopy) {
            quickCopy.addEventListener('click', async () => {
                const text = quickOutput?.value || '';
                if (!T.safeText(text)) {
                    log('Dịch nhanh: chưa có kết quả để copy.', 'warn');
                    return;
                }
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(text);
                    } else {
                        window.prompt('Copy kết quả', text);
                    }
                    log('Đã copy kết quả dịch nhanh.', 'ok');
                } catch (err) {
                    log('Copy kết quả lỗi: ' + err.message, 'error');
                }
            });
        }
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                togglePanelFullscreen();
            });
        }
        helpBtn.addEventListener('click', () => {
            helpContentDiv.innerHTML = buildWelcomeContent();
            helpModal.style.display = 'flex';
        });
        helpClose.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
        helpModal.addEventListener('click', (ev) => {
            if (ev.target === helpModal) return;
        });
        settingsModal.addEventListener('click', (ev) => {
            if (ev.target === settingsModal) return;
        });


        if (fetchBtn) fetchBtn.addEventListener('click', handleFetch);
        if (recomputeBtn) recomputeBtn.addEventListener('click', handleRecompute);
        if (applyBtn) applyBtn.addEventListener('click', handleApply);
        panel.addEventListener('input', () => {
            updateMatchIndicators();
            updateRecomputeNotice();
        });
        panel.addEventListener('change', () => {
            updateMatchIndicators();
            updateRecomputeNotice();
        });
        if (titleCnInput) {
            titleCnInput.addEventListener('input', () => {
                scheduleDuplicateCheck('input');
                updateRecomputeNotice();
            });
            titleCnInput.addEventListener('change', () => {
                scheduleDuplicateCheck('change');
                updateRecomputeNotice();
            });
        }
        if (authorCnInput) {
            authorCnInput.addEventListener('input', () => scheduleDuplicateCheck('input'));
            authorCnInput.addEventListener('change', () => scheduleDuplicateCheck('change'));
        }
        if (authorCheckBtn) {
            authorCheckBtn.addEventListener('click', () => {
                const authorCn = T.safeText(authorCnInput?.value || state.sourceData?.authorCn || '');
                if (!authorCn) {
                    log('Chưa có tên tác giả tiếng Trung để mở.', 'warn');
                    return;
                }
                openInBrowserTab(`${location.origin}/tac-gia/${encodeURIComponent(authorCn)}`);
            });
        }
        if (sourceUrlInput) {
            sourceUrlInput.addEventListener('input', () => {
                updateCoverSizeSummary();
                updateCoverSizeTag();
                updateJjwxcApiModeUi();
            });
            sourceUrlInput.addEventListener('change', () => {
                updateCoverSizeSummary();
                updateCoverSizeTag();
                updateJjwxcApiModeUi();
            });
        }
        if (jjwxcApiModeBtn) {
            jjwxcApiModeBtn.addEventListener('click', () => {
                const current = getEffectiveJjwxcApiMode();
                const next = current === JJWXC_API_MODE_OLD ? JJWXC_API_MODE_NEW : JJWXC_API_MODE_OLD;
                persistJjwxcApiMode(next);
                updateJjwxcApiModeUi();
                updateJjwxcApiModalStatus();
                log(`JJWXC: chuyển sang API ${next === JJWXC_API_MODE_OLD ? 'cũ (Old)' : 'mới (New)'}.`, 'info');
            });
        }
        // If user edits CN title/author directly on the web form, keep Nhúng button state in sync.
        const webTitleCn = document.getElementById('txtTitleCn');
        const webAuthorCn = document.getElementById('txtAuthorCn');
        if (webTitleCn) {
            webTitleCn.addEventListener('input', () => updateEmbedSubmitByDuplicateState('web-input'));
            webTitleCn.addEventListener('change', () => updateEmbedSubmitByDuplicateState('web-change'));
        }
        if (webAuthorCn) {
            webAuthorCn.addEventListener('input', () => updateEmbedSubmitByDuplicateState('web-input'));
            webAuthorCn.addEventListener('change', () => updateEmbedSubmitByDuplicateState('web-change'));
        }
        setDescDrafts('', '');
        updateCoverSizeSummary();
        updateCoverSizeTag();
        setQuickPanelVisible(false);
        setDataActionButtonsEnabled(false);
        setApplyByDuplicateState();
        syncDuplicateSafetyPosition();

        const last = GM_getValue(`${APP_PREFIX}last_url`, '');
        if (last) shadowRoot.getElementById(`${APP_PREFIX}url`).value = last;
        updateJjwxcApiModeUi();
        updateCoverSizeSummary();
        updateCoverSizeTag();
        shadowRoot.getElementById(`${APP_PREFIX}nameSet`).addEventListener('input', (ev) => {
            updateRecomputeNotice();
        });
        if (coverUrlInput && coverUrlInput.value) refreshCoverMeta(coverUrlInput.value);
        updateRecomputeNotice();
        log(`Sẵn sàng. Dán link ${buildSiteDisplayList()} rồi bấm "Lấy dữ liệu".`);

        return {
            open: openPanel,
            close: closePanel,
            toggle: togglePanel,
            shadowRoot,
        };
    }

    function initAutofill(options = {}) {
        if (!/\/nhung-file$/.test(location.pathname) && !/\/chinh-sua$/.test(location.pathname)) return null;
        if (instance) {
            if (options.openOnInit && instance.open) instance.open();
            return instance;
        }
        instance = createUI(options);
        if (options.openOnInit && instance.open) instance.open();
        return instance;
    }

    global.WDA_InitAutofill = initAutofill;
})(window);
