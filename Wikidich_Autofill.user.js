// ==UserScript==
// @name         Wikidich Autofill (Library)
// @namespace    http://tampermonkey.net/
// @version      0.3.6.1
// @description  Lấy thông tin từ web Trung (Fanqie/JJWXC/PO18/Ihuaben/Qidian/Qimao/Gongzicp/Hai Tang Longma), dịch và tự tick/điền form nhúng truyện trên wikicv.net.
// @author       QuocBao
// ==/UserScript==

(function (global) {
    'use strict';
    let instance = null;

    const APP_PREFIX = 'WDA_';
    const AUTOFILL_WIKIDICH_VERSION = '0.3.6'
    const SERVER_URL = 'https://dichngay.com/translate/text';
    const MAX_CHARS = 4500;
    const MAX_COVER_FILE_SIZE = 500 * 1024;
    const REQUEST_DELAY_MS = 350;
    const DEFAULT_SCORE_THRESHOLD = 0.90;
    const SCORE_FALLBACK = 0.65;
    const MAX_TAGS_SELECT = 25;
    const ROOT_NEG_WORDS = ['vo', 'khong', 'phi', 'chong', 'phan', 'non', 'no'];
    const ROOT_MODIFIERS = new Set([
        'song', 'nhieu', 'main', 'ca', 'nha', 'nu', 'nam', 'trang', 'phan', 'sat',
        'la', 'toan', 'tap', 'the'
    ]);

    const DEFAULT_SETTINGS = {
        scoreThreshold: DEFAULT_SCORE_THRESHOLD,
        aiMode: 'auto', // 'auto' or 'ai'
        geminiApiKey: '',
        geminiModel: 'gemini-2.5-flash',
        autoExtractNames: true, // AI auto-extract character names
        autoBreakDesc: false, // Tự xuống dòng văn án ở dấu chấm
        domainSettings: {},
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

    function normalizeSettings(raw) {
        // Deep copy default
        const base = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

        if (!raw || typeof raw !== 'object') return base;

        if ('scoreThreshold' in raw) base.scoreThreshold = raw.scoreThreshold;
        if (raw.aiMode) base.aiMode = raw.aiMode;
        if (raw.geminiApiKey) base.geminiApiKey = raw.geminiApiKey;
        if (raw.geminiModel) base.geminiModel = raw.geminiModel;
        if (typeof raw.autoExtractNames === 'boolean') base.autoExtractNames = raw.autoExtractNames;
        if (typeof raw.autoBreakDesc === 'boolean') base.autoBreakDesc = raw.autoBreakDesc;
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
                    if (saved.target) base.domainSettings[key].target = saved.target;
                }
            });
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
    function checkImageUrlValid(url) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'HEAD',
                url,
                onload: (res) => {
                    const contentType = (res.responseHeaders || '')
                        .match(/content-type:\s*([^\r\n]+)/i)?.[1] || '';
                    resolve(res.status === 200 && contentType.toLowerCase().startsWith('image/'));
                },
                onerror: () => resolve(false),
                ontimeout: () => resolve(false),
            });
        });
    }

    async function processJjwxcCover(novelCover) {
        if (!novelCover) return '';
        const coverRaw = novelCover;
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
    function fetchFanqieData(bookId) {
        const apiUrl = `https://api5-normal-sinfonlineb.fqnovel.com/reading/bookapi/multi-detail/v/?aid=2329&iid=1&version_code=999&book_id=${bookId}`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                responseType: 'json',
                onload(res) {
                    let parsed = res.response;
                    if (!parsed && res.responseText) {
                        try { parsed = JSON.parse(res.responseText); } catch { parsed = null; }
                    }
                    const data = parsed?.data?.[0] || null;
                    if (!data) {
                        reject(new Error('Fanqie API không có dữ liệu.'));
                        return;
                    }
                    resolve(data);
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    function fetchJjwxcData(bookId) {
        const apiUrl = `http://app.jjwxc.net/androidapi/novelbasicinfo?novelId=${bookId}`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                responseType: 'json',
                onload(res) {
                    let parsed = res.response;
                    if (!parsed && res.responseText) {
                        try { parsed = JSON.parse(res.responseText); } catch { parsed = null; }
                    }
                    if (!parsed) {
                        reject(new Error('JJWXC API không có dữ liệu.'));
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

            const introTagTexts = D.collectTexts(doc, [
                '.book_intro_tags a',
                '.book_intro_tags span',
            ]);
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
            statusHint: '',
            update_status: raw.update_status,
            extraKeywords: [],
        };
        return attachStatusInfo(base, {
            explicitStates: [
                mapStatusCode(raw.update_status, { '0': STATUS_STATES.ONGOING, '1': STATUS_STATES.COMPLETED }),
                mapStatusCode(raw.book_status, { '0': STATUS_STATES.ONGOING, '1': STATUS_STATES.COMPLETED, '2': STATUS_STATES.COMPLETED }),
                statusStateFromBoolish(raw.isFinished, true),
                statusStateFromBoolish(raw.is_finished, true),
            ],
            hintTexts: [
                raw.novel_status,
                raw.status,
                raw.book_status_text,
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
            coverUrl: T.safeText(raw.novelCover),
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
        const tags = T.parseTagList((raw.tags || []).join(','));
        const introTags = T.parseTagList((raw.introTags || []).join(','));
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

    HELPERS.http = { postTranslate };

    async function translateList(list) {
        const items = Array.isArray(list) ? list : [];
        const batches = splitIntoBatches(items, MAX_CHARS);
        const result = [];
        for (const batch of batches) {
            try {
                const translated = await postTranslate(SERVER_URL, batch, 'vi');
                result.push(...translated);
            } catch (err) {
                // fallback: giữ nguyên đoạn lỗi
                result.push(...batch);
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

        const getMulti = (group, limit, isMandatory, collapse) => {
            const scored = scoreOptions(group, contexts);
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
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
    }

    function fetchCoverBlob(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'blob',
                onload(res) {
                    if (res.status < 200 || res.status >= 300) {
                        reject(new Error('Không tải được ảnh bìa.'));
                        return;
                    }
                    resolve(res.response);
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
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
                log(`Đã tối ưu ảnh bìa: ${originalKb}KB -> ${finalKb}KB.`, 'ok');
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
            const blob = await downscaleCoverBlobIfNeeded(sourceBlob, log);
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
<h2><span style="color:#673ab7; font-size: 1.2em;">✨ Phiên bản 0.3.6</span></h2>
<ul style="list-style-type: none; padding-left: 0;">
    <li>🧩 <b>Loại trừ nâng cấp:</b> Có trên cả <code>/nhung-file</code> và <code>/chinh-sua</code>; hỗ trợ cấu hình <b>Tất cả nguồn</b> và <b>override theo từng nguồn</b>. Ở <code>/chinh-sua</code> mặc định loại trừ Tên gốc/Tác giả (CN), Tên dịch (VI), Liên kết bổ sung.</li>
    <li>🔁 <b>Check trùng mềm hơn:</b> Nếu truyện bị trùng vẫn cho <b>Áp vào form</b>; chỉ khóa nút <b>Nhúng</b> khi <code>Tên gốc + Tác giả</code> <b>trên web</b> đúng cặp đã check trùng.</li>
    <li>🌐 <b>Cập nhật domain Wikidich:</b> Nhận diện đúng trang Wikidich mới ở <code>wikicv.net</code> (vẫn tương thích domain cũ).</li>
</ul>

<h3 style="color:#ff9800; margin-top: 16px;">📦 Các bản trước (tóm tắt)</h3>
<ul style="list-style-type: none; padding-left: 0; font-size: 13px;">
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
<h2 class="${APP_PREFIX}welcome-heading">🌸 Chào mừng đến với <span>Wikidich Autofill</span>! 🌸</h2>
<p class="${APP_PREFIX}welcome-subtitle">Tool "thần thánh" hỗ trợ convert web Trung sang Wikidich 1 chạm.</p>

<div class="${APP_PREFIX}guide-box-green">
    <h3 style="margin-top:0; color:#2e7d32;">🌟 Quy trình sử dụng chuẩn:</h3>
    <ol style="margin-left: 15px; padding-left: 0;">
        <li><b>Bước 1:</b> Copy link truyện (${buildSiteDisplayList()}).</li>
        <li><b>Bước 2:</b> Dán vào ô URL > Bấm nút <b style="color:#2196f3;">Lấy dữ liệu</b> (hoặc nút <b style="color:#e91e63;">AI</b>).</li>
        <li><b>Bước 3:</b> Chờ tool chạy dịch và phân tích (Auto hoặc AI).</li>
        <li><b>Bước 4:</b> Kiểm tra các ô thông tin trên bảng Panel (Tag, Thể loại...).</li>
        <li><b>Mẹo:</b> Dùng nút <b>Recompute</b> khi bạn thêm "Từ khóa bổ sung" để gợi ý lại tag/thể loại.</li>
        <li><b>Qidian:</b> Nếu không có kết quả, hãy thử lại vài lần.</li>
        <li><b>Bước 5:</b> Nếu OK, bấm nút <b style="color:#ff9800;">Áp vào form</b> dưới cùng.</li>
        <li><b>Bước 6:</b> Bấm <b style="color:green;">Nhúng</b> của Web để đăng!</li>
    </ol>
</div>

<h3>🔥 Tính năng AI (Mới):</h3>
<ul style="list-style-type: none; padding-left: 5px;">
    <li>🔑 <b>AI tự động:</b> Cần API Key (⚙️ Cài đặt) để tool tự phân tích/tag.</li>
    <li>🧠 <b>Thông minh hơn:</b> AI đọc hiểu văn án để chọn tag (VD: "Gương vỡ lại lành" dù văn án không ghi rõ).</li>
    <li>🛡️ <b>Kiểm duyệt:</b> Tự động lọc bỏ các tag "rác" không có trong hệ thống Wikidich.</li>
    <li>🧾 <b>AI thủ công:</b> Bấm <b>AI thủ công</b> → copy prompt → dán JSON kết quả vào tool (không cần API Key).</li>
</ul>

<div class="${APP_PREFIX}guide-box-blue">
    <h3 style="margin-top:0; color:#1565c0;">✨ Trang chỉnh sửa (chinh-sua):</h3>
    <ul style="list-style-type: none; padding-left: 5px; font-size: 13px;">
        <li>✅/❌ <b>So khớp nhanh:</b> Dấu tick xanh = khớp web, dấu X đỏ = lệch; rê chuột để xem chi tiết.</li>
        <li>🎯 <b>Loại trừ thông minh:</b> Nút <b>Loại trừ</b> cho phép bỏ qua trường khi áp (mặc định bỏ Cover URL), lưu lại cho lần sau.</li>
        <li>🧩 <b>Popup so sánh:</b> Bảng đối chiếu trước khi áp, tô màu phần thêm/bớt; văn án diff theo từng từ và giữ xuống dòng chuẩn.</li>
    </ul>
</div>

<div class="${APP_PREFIX}guide-box-pink">
    <h3 style="margin-top:0; color:#ad1457;">🪄 Auto Tách Tên:</h3>
    <p style="margin: 5px 0; font-size: 13px;">Khi bấm nút <b style="color:#e91e63;">AI</b>, hệ thống sẽ:</p>
    <ol style="margin-left: 15px; padding-left: 0; font-size: 13px;">
        <li>Gửi văn án tiếng Trung cho AI phân tích</li>
        <li>AI trích xuất <b>tên nhân vật, địa danh</b> → phiên âm <span class="${APP_PREFIX}highlight-violet">Hán-Việt</span></li>
        <li>Tự động điền vào ô <b>"Bộ name"</b> (dạng: <code>Tên_Trung=Hán_Việt</code>)</li>
        <li>Dịch lại văn án với bộ tên mới → tên được giữ nguyên!</li>
    </ol>
    <p style="margin: 5px 0; font-size: 12px; color: #666;">💡 <i>Toggle: Vào ⚙️ Cài đặt → "Auto Tách Names" để bật/tắt.</i></p>
</div>

<h3>🌍 Các Trang Hỗ Trợ:</h3>
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
            #${APP_PREFIX}header {
                padding: 10px 14px;
                background: linear-gradient(90deg, #e8f0ff 0%, #e6fff8 100%);
                border-bottom: 1px solid rgba(0,0,0,0.06);
                font-weight: 600; font-size: 14px; display: flex; justify-content: space-between;
                color: #4a2c6f; cursor: move; align-items: center; gap: 10px;
            }
            :host([data-theme="dark"]) #${APP_PREFIX}header {
                background: linear-gradient(90deg, #111827 0%, #0f172a 100%);
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
            #${APP_PREFIX}content { padding: 12px 14px; overflow: auto; }
            .${APP_PREFIX}row { margin-bottom: 10px; }
            .${APP_PREFIX}label {
                font-size: 12px; color: #3f3d56;
                margin-bottom: 4px; display: block; font-weight: 700; letter-spacing: 0.2px;
            }
            :host([data-theme="dark"]) .${APP_PREFIX}label { color: #d1d5db; }
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
            .${APP_PREFIX}modal-body::-webkit-scrollbar,
            .${APP_PREFIX}diff-body::-webkit-scrollbar,
            .${APP_PREFIX}log::-webkit-scrollbar {
                width: 10px;
            }
            #${APP_PREFIX}content::-webkit-scrollbar-track,
            .${APP_PREFIX}modal-body::-webkit-scrollbar-track,
            .${APP_PREFIX}diff-body::-webkit-scrollbar-track,
            .${APP_PREFIX}log::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.7);
                border-radius: 999px;
            }
            #${APP_PREFIX}content::-webkit-scrollbar-thumb,
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
            :host([data-theme="dark"]) .${APP_PREFIX}modal-body::-webkit-scrollbar-track,
            :host([data-theme="dark"]) .${APP_PREFIX}diff-body::-webkit-scrollbar-track,
            :host([data-theme="dark"]) .${APP_PREFIX}log::-webkit-scrollbar-track {
                background: rgba(15, 23, 42, 0.8);
            }
            :host([data-theme="dark"]) #${APP_PREFIX}content::-webkit-scrollbar-thumb,
            :host([data-theme="dark"]) .${APP_PREFIX}modal-body::-webkit-scrollbar-thumb,
            :host([data-theme="dark"]) .${APP_PREFIX}diff-body::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, #64748b 0%, #1f2937 100%);
                border: 2px solid rgba(15, 23, 42, 0.9);
            }
            :host([data-theme="dark"]) #${APP_PREFIX}content,
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
                        <button id="${APP_PREFIX}fullscreen" class="${APP_PREFIX}icon-btn ${APP_PREFIX}fullscreen-btn" title="Toàn màn hình">⛶</button>
                        <button id="${APP_PREFIX}help" class="${APP_PREFIX}icon-btn" title="Hướng dẫn">?</button>
                        <button id="${APP_PREFIX}settings" class="${APP_PREFIX}icon-btn" title="Cài đặt">⚙</button>
                        <button id="${APP_PREFIX}close" class="${APP_PREFIX}icon-btn" title="Thu nhỏ">✕</button>
                    </div>
                </div>
                <div id="${APP_PREFIX}content">
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">URL Web Trung</label>
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
                        <label class="${APP_PREFIX}label">Tên tác giả (CN)<span class="${APP_PREFIX}match" data-key="authorCn">?</span></label>
                        <input id="${APP_PREFIX}authorCn" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Tên dịch (VI)<span class="${APP_PREFIX}match" data-key="titleVi">?</span></label>
                        <input id="${APP_PREFIX}titleVi" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Mô tả dịch (VI)<span class="${APP_PREFIX}match" data-key="descVi">?</span></label>
                        <textarea id="${APP_PREFIX}descVi" class="${APP_PREFIX}textarea"></textarea>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Cover URL<span class="${APP_PREFIX}match" data-key="coverUrl">?</span></label>
                        <input id="${APP_PREFIX}coverUrl" class="${APP_PREFIX}input" />
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
                        <label class="${APP_PREFIX}label">Thời đại (nhập label, phân cách dấu phẩy)<span class="${APP_PREFIX}match" data-key="age">?</span></label>
                        <input id="${APP_PREFIX}age" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Kết thúc (nhập label, phân cách dấu phẩy)<span class="${APP_PREFIX}match" data-key="ending">?</span></label>
                        <input id="${APP_PREFIX}ending" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Loại hình (nhập label, phân cách dấu phẩy)<span class="${APP_PREFIX}match" data-key="genre">?</span></label>
                        <input id="${APP_PREFIX}genre" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Tag (nhập label, phân cách dấu phẩy)<span class="${APP_PREFIX}match" data-key="tag">?</span></label>
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
                            </div>
                        </div>
                        <div class="${APP_PREFIX}row">
                            <label class="${APP_PREFIX}label">Cấu hình Nguồn (Quét văn án & Nơi hiển thị)</label>
                            <div id="${APP_PREFIX}domainConfig" class="${APP_PREFIX}settings-group" style="display:grid; grid-template-columns: 1.5fr 0.8fr 2fr; gap: 6px 12px; font-size: 13px; align-items:center;">
                                <div class="${APP_PREFIX}domain-header">Nguồn</div>
                                <div class="${APP_PREFIX}domain-header" style="text-align:center;">Quét</div>
                                <div class="${APP_PREFIX}domain-header">Hiển thị</div>
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
            <div id="${APP_PREFIX}duplicateModal" class="${APP_PREFIX}modal">
                <div class="${APP_PREFIX}modal-card">
                    <div class="${APP_PREFIX}modal-title" style="color:#c62828;">Cảnh báo truyện trùng</div>
                    <div class="${APP_PREFIX}modal-body" id="${APP_PREFIX}duplicateBody"></div>
                    <div class="${APP_PREFIX}modal-actions">
                        <button id="${APP_PREFIX}duplicateClose" class="${APP_PREFIX}btn secondary">Đã hiểu</button>
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
        const close = shadowRoot.getElementById(`${APP_PREFIX}close`);
        const aiBtn = shadowRoot.getElementById(`${APP_PREFIX}ai`);
        const fullscreenBtn = shadowRoot.getElementById(`${APP_PREFIX}fullscreen`);
        const helpBtn = shadowRoot.getElementById(`${APP_PREFIX}help`);
        const panelFullscreenClass = `${APP_PREFIX}fullscreen`;

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
        const manualAiBtn = shadowRoot.getElementById(`${APP_PREFIX}manualAi`);
        const manualAiModal = shadowRoot.getElementById(`${APP_PREFIX}manualAiModal`);
        const manualAiCopy = shadowRoot.getElementById(`${APP_PREFIX}manualAiCopy`);
        const manualAiPaste = shadowRoot.getElementById(`${APP_PREFIX}manualAiPaste`);
        const manualAiClose = shadowRoot.getElementById(`${APP_PREFIX}manualAiClose`);
        const duplicateModal = shadowRoot.getElementById(`${APP_PREFIX}duplicateModal`);
        const duplicateBody = shadowRoot.getElementById(`${APP_PREFIX}duplicateBody`);
        const duplicateClose = shadowRoot.getElementById(`${APP_PREFIX}duplicateClose`);
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

        const domainConfig = shadowRoot.getElementById(`${APP_PREFIX}domainConfig`);
        const getDomainInputs = (id) => ({
            desc: shadowRoot.getElementById(`${APP_PREFIX}confDesc_${id}`),
            target: shadowRoot.getElementById(`${APP_PREFIX}confTarget_${id}`),
        });
        const titleCnInput = shadowRoot.getElementById(`${APP_PREFIX}titleCn`);
        const authorCnInput = shadowRoot.getElementById(`${APP_PREFIX}authorCn`);
        const applyBtn = shadowRoot.getElementById(`${APP_PREFIX}apply`);

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
            const titleCn = shadowRoot.getElementById(`${APP_PREFIX}titleCn`)?.value || '';
            const authorCn = shadowRoot.getElementById(`${APP_PREFIX}authorCn`)?.value || '';
            const titleVi = shadowRoot.getElementById(`${APP_PREFIX}titleVi`)?.value || '';
            const descVi = shadowRoot.getElementById(`${APP_PREFIX}descVi`)?.value || '';
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
            if (ev.target === helpModal) helpModal.style.display = 'none';
        });
        if (excludeModal) {
            excludeModal.addEventListener('click', (ev) => {
                if (ev.target === excludeModal) excludeModal.style.display = 'none';
            });
        }
        if (diffModal) {
            diffModal.addEventListener('click', (ev) => {
                if (ev.target === diffModal) {
                    diffModal.style.display = 'none';
                    if (pendingDiffResolve) pendingDiffResolve(false);
                    pendingDiffResolve = null;
                }
            });
        }
        if (duplicateClose && duplicateModal) {
            duplicateClose.addEventListener('click', () => {
                duplicateModal.style.display = 'none';
            });
        }
        if (duplicateModal) {
            duplicateModal.addEventListener('click', (ev) => {
                if (ev.target === duplicateModal) duplicateModal.style.display = 'none';
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
            const currentModel = s.geminiModel || 'gemini-2.5-flash';
            const option = document.createElement('option');
            option.value = currentModel;
            option.textContent = currentModel;
            option.selected = true;
            settingsGeminiModel.appendChild(option);

            settingsAiMode.value = s.aiMode || 'auto';
            settingsAutoExtractNames.checked = s.autoExtractNames !== false; // default true
            settingsAutoBreakDesc.checked = !!s.autoBreakDesc; // default false

            const d = s.domainSettings || DEFAULT_SETTINGS.domainSettings;
            SITE_RULES.forEach((rule) => {
                const inputs = getDomainInputs(rule.id);
                const conf = d[rule.id];
                if (!inputs.desc || !inputs.target || !conf) return;
                inputs.desc.checked = !!conf.useDesc;
                inputs.target.value = conf.target === 'all' ? '' : conf.target;
            });
            settingsModal.style.display = 'flex';
        });

        settingsSave.addEventListener('click', () => {
            const next = readSettingsFromUi();
            saveSettings(next);
            settingsModal.style.display = 'none';
            log('Đã lưu cài đặt.', 'info');
        });

        settingsClose.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });

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
                                settingsGeminiModel.innerHTML = '';
                                const models = data.models
                                    .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
                                    .sort((a, b) => b.displayName.localeCompare(a.displayName)); // Sort desirable

                                if (!models.length) {
                                    alert('Không tìm thấy model nào hỗ trợ generateContent.');
                                    return;
                                }

                                models.forEach(m => {
                                    const name = m.name.replace('models/', '');
                                    const opt = document.createElement('option');
                                    opt.value = name;
                                    opt.textContent = `${m.displayName} (${name})`;
                                    if (name === 'gemini-2.5-flash') opt.selected = true;
                                    settingsGeminiModel.appendChild(opt);
                                });
                                alert(`Đã tìm thấy ${models.length} maps.`);
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

        async function callGemini(prompt, apiKey, model = 'gemini-2.5-flash') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            };
            return new Promise((resolve, reject) => {
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
                                resolve(JSON.parse(text));
                            } catch (e) {
                                reject(new Error('AI Response Parse Error: ' + e.message));
                            }
                        } else {
                            reject(new Error(`Gemini Error ${res.status}: ${res.statusText}`));
                        }
                    },
                    onerror: (err) => reject(err)
                });
            });
        }

        const buildAiContext = () => {
            if (!state.sourceData) {
                log('Chưa có dữ liệu truyện (Fetch data trước).', 'error');
                return null;
            }
            const shouldExtractNames = state.settings.autoExtractNames !== false && state.sourceData.descCn;
            const groups = getGroupOptions();
            const getLabels = (grp) => grp ? grp.map(x => x.label) : [];
            const availableOptions = {
                gender: getLabels(groups.gender),
                official: getLabels(groups.official),
                age: getLabels(groups.age),
                ending: getLabels(groups.ending),
                genre: getLabels(groups.genre),
                tag: getLabels(groups.tag),
            };
            return { shouldExtractNames, availableOptions };
        };

        const buildAiPrompt = (shouldExtractNames, availableOptions) => {
            const novelInfo = {
                title: state.sourceData.titleCn,
                author: state.sourceData.authorCn,
                desc: state.sourceData.descCn + '\n' + (state.translated?.desc || ''),
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
Description (Vietnamese): ${state.translated?.desc || ''}

TASK 1: Extract all important names (characters, locations, titles) from the Chinese description.
Return them as "names" array with format: [{"cn": "中文名", "vi": "Hán-Việt"}]
Prioritize Hán-Việt pronunciation for "vi" field.
- EXCLUDE pronouns/titles/common-role phrases (not proper names): 女主, 男主, 女配, 男配, 男二, 女二, 反派, 系统, 师尊, 师父, 徒弟, 兄长, 师兄, 师妹, 小姐, 少爷, 公爵, 王爷, 皇帝, 皇后, 太子, 贵妃, 圣女, 侍女, 侍卫, 丫鬟, 书童, 管家, 大人, 先生, 小姐, 夫人, 公子, 少主, 掌门, 宗主, 长老, 魔尊, 大妖, 等等.
- Vietnamese name casing: do NOT Title-Case generic roles/kinship terms. Example: "女主" should NOT become "Nữ Chủ" (skip entirely). "叶哥哥" should map to "Diệp ca ca" (not "Diệp Ca Ca").
- If a term is just a common phrase with meaning (not a unique proper name), skip it.
- If a name is likely non-Chinese in context (Japanese/English/etc.), prefer Latin transliteration instead of Hán-Việt. Example: "瑞苏泽尔" => "Risuzel" (NOT "Thụy Tô Trạch Nhĩ").

TASK 2: Classify the novel using ONLY the provided lists:
- gender: ${JSON.stringify(availableOptions.gender)} // Pick 1
- official: ${JSON.stringify(availableOptions.official)} // Pick 1
- age: ${JSON.stringify(availableOptions.age)} // Pick multiple
- ending: ${JSON.stringify(availableOptions.ending)} // Pick 1 (if unclear, you may choose OE or HE). Pick multiple ONLY when tag/genre includes "Xuyên nhanh"/"快穿".
- genre: ${JSON.stringify(availableOptions.genre)} // Pick multiple
- tag: ${JSON.stringify(availableOptions.tag)} // Pick multiple

Output JSON format:
{
  "names": [{"cn": "...", "vi": "..."}],
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

Output JSON format: { "gender": "...", "official": "...", "age": [...], "ending": [...], "genre": [...], "tag": [...] }
For arrays, return list of strings. If none fit, return empty array.
                `.trim();
        };

        const applyAiResult = async (result, shouldExtractNames, availableOptions) => {
            if (shouldExtractNames && result.names && Array.isArray(result.names) && result.names.length > 0) {
                const extractedNames = result.names;
                const nameSetEl = shadowRoot.getElementById(`${APP_PREFIX}nameSet`);
                if (nameSetEl) {
                    const existingLines = nameSetEl.value.trim().split('\n').filter(Boolean);
                    const existingKeys = new Set(existingLines.map(l => l.split('=')[0]));
                    const newLines = extractedNames
                        .filter(n => n.cn && n.vi && !existingKeys.has(n.cn))
                        .map(n => `${n.cn}=${n.vi}`);
                    if (newLines.length > 0) {
                        nameSetEl.value = [...existingLines, ...newLines].join('\n');
                    }
                }
                log(`Đã tách ${extractedNames.length} tên.`, 'ok');

                log('Đang dịch lại văn án với bộ tên mới...', 'info');
                const newNameSet = {};
                extractedNames.forEach(n => { if (n.cn && n.vi) newNameSet[n.cn] = n.vi; });
                const reTranslatedDesc = await translateTextWithNameSet(state.sourceData.descCn, newNameSet, true);
                if (reTranslatedDesc) {
                    state.translated = state.translated || {};
                    state.translated.desc = reTranslatedDesc;
                    const descViEl = shadowRoot.getElementById(`${APP_PREFIX}descVi`);
                    if (descViEl) descViEl.value = reTranslatedDesc;
                    log('Đã dịch lại văn án với bộ tên.', 'ok');
                }

                log('Đang dịch lại tiêu đề với bộ tên mới...', 'info');
                const reTranslatedTitle = await translateTextWithNameSet(state.sourceData.titleCn, newNameSet, false);
                if (reTranslatedTitle) {
                    state.translated = state.translated || {};
                    state.translated.titleVi = reTranslatedTitle;
                    const titleViEl = shadowRoot.getElementById(`${APP_PREFIX}titleVi`);
                    if (titleViEl) titleViEl.value = reTranslatedTitle;
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

            const context = buildAiContext();
            if (!context) return;
            const shouldExtractNames = context.shouldExtractNames;

            log('Đang gửi dữ liệu sang Gemini AI...', 'info');
            showApplyToast('AI đang phân tích dữ liệu...', 'loading');

            const availableOptions = context.availableOptions;
            const prompt = buildAiPrompt(shouldExtractNames, availableOptions);

            try {
                const result = await callGemini(prompt, apiKey, state.settings.geminiModel);
                log('AI đã phân tích xong. Đang áp dụng...');
                console.log('AI Result:', result);

                await applyAiResult(result, shouldExtractNames, availableOptions);
                showApplyToast('AI đã phân tích xong.', 'success', 1300);
            } catch (err) {
                log('Lỗi AI: ' + err.message, 'error');
                showApplyToast('AI lỗi, xem log để xử lý.', 'error', 1600);
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
                if (!inputs.desc || !inputs.target) return;
                const def = DEFAULT_SETTINGS.domainSettings[rule.id] || {};
                const selectedTarget = inputs.target.value || 'all';
                domainSettings[rule.id] = {
                    label: def.label || rule.name || rule.id,
                    useDesc: inputs.desc.checked,
                    target: selectedTarget,
                };
            });
            return {
                scoreThreshold: parseFloat(settingsThreshold.value),
                aiMode: settingsAiMode.value,
                geminiApiKey: settingsGeminiKey.value.trim(),
                geminiModel: settingsGeminiModel.value.trim(),
                autoExtractNames: settingsAutoExtractNames.checked,
                autoBreakDesc: settingsAutoBreakDesc.checked,
                domainSettings,
            };
        }

        async function handleFetch() {
            logBox.innerHTML = '';
            state.hasFetchedData = false;
            setDataActionButtonsEnabled(false);
            setApplyByDuplicateState();
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
                const fetchLabel = rule.name ? `Đang gọi ${rule.name}...` : 'Đang gọi nguồn...';
                log(fetchLabel);
                showApplyToast('Đang lấy dữ liệu từ nguồn...', 'loading');
                raw = await rule.fetch(sourceInfo.id);
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
                GM_setValue(`${APP_PREFIX}name_set`, nameSetRaw);
                const tagsRaw = sourceData.tags || [];
                const categoryNames = sourceData.categories || [];

                log(`Dịch tiêu đề (${titleCn.length} ký tự)...`);
                const titleVi = await translateTextWithNameSet(titleCn, nameSet, false);
                log('Dịch tiêu đề xong.', 'ok');
                log(`Dịch mô tả (${descCn.length} ký tự)...`);
                const descVi = await translateTextWithNameSet(descCn, nameSet, true);
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
                fillText(`${APP_PREFIX}descVi`, descVi);
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
                triggerDuplicateCheck('fetch', true);
                setDataActionButtonsEnabled(true);
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
                setDataActionButtonsEnabled(false);
                setApplyByDuplicateState();
                log('Lỗi: ' + err.message, 'error');
                showApplyToast('Lấy dữ liệu thất bại, xem log.', 'error', 1700);
                console.error(err);
            }
        }
        function handleRecompute() {
            if (!state.sourceData || !state.groups) {
                log('Chưa có dữ liệu để recompute.', 'warn');
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

            const threshold = getScoreThreshold();
            const allowMultiEnding = hasXuyenNhanh(combinedKeywords);
            const suggestions = {
                status: state.suggestions?.status || '',
                official: state.suggestions?.official || '',
                gender: state.suggestions?.gender || '',
                age: pickMulti(scoreOptions(state.groups.age, contexts), 4, true, false, threshold),
                ending: pickMulti(scoreOptions(state.groups.ending, contexts), allowMultiEnding ? 3 : 1, true, false, threshold),
                genre: pickMulti(scoreOptions(state.groups.genre, contexts), 8, true, false, threshold),
                tag: pickMulti(scoreOptions(state.groups.tag, contexts), MAX_TAGS_SELECT, true, true, threshold),
            };
            state.suggestions = { ...state.suggestions, ...suggestions };
            fillText(`${APP_PREFIX}age`, suggestions.age.join(', '));
            fillText(`${APP_PREFIX}ending`, suggestions.ending.join(', '));
            fillText(`${APP_PREFIX}genre`, suggestions.genre.join(', '));
            fillText(`${APP_PREFIX}tag`, suggestions.tag.join(', '));
            updateMatchIndicators();
            log('Đã recompute theo từ khóa bổ sung.', 'ok');
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
            }
            if (check.blocked) {
                applyBtn.title = 'Truyện có thể bị trùng. Vẫn cho Áp vào form, nhưng nút Nhúng sẽ bị khóa nếu form trùng đúng cặp.';
            }
            applyBtn.disabled = false;
            if (!check.pending && !check.blocked) applyBtn.title = '';
            updateEmbedSubmitByDuplicateState('apply-state');
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
        const triggerDuplicateCheck = (reason = 'input', force = false) => {
            if (!isEmbedPage()) return;
            const check = state.duplicateCheck;
            const { titleCn, authorCn } = getDuplicateInputs();
            if (!shouldCheckDuplicate({ titleCn, authorCn })) {
                check.pending = false;
                check.blocked = false;
                check.checked = false;
                check.failed = false;
                check.lastKey = '';
                setApplyByDuplicateState();
                return;
            }
            const currentKey = `${titleCn}|||${authorCn}`;
            if (!force && !check.pending && check.checked && !check.failed && check.lastKey === currentKey) {
                setApplyByDuplicateState();
                return;
            }
            check.pending = true;
            check.blocked = false;
            check.failed = false;
            check.checked = false;
            check.lastKey = currentKey;
            const runId = (check.runId || 0) + 1;
            check.runId = runId;
            setApplyByDuplicateState();
            log(`Đang kiểm tra trùng truyện trên server (${reason})...`, 'info');

            const doCheck = async () => {
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
                        setApplyByDuplicateState();
                        if (exists) {
                            log('Phát hiện truyện trùng trên server. Sẽ khóa nút Nhúng nếu form trùng đúng cặp tên + tác giả.', 'error');
                            showDuplicateWarning();
                        } else {
                            log('Check trùng xong: không có truyện trùng.', 'ok');
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
                setApplyByDuplicateState();
                log('Check trùng thất bại sau 3 lần, cho phép Áp vào form.', 'warn');
            };
            doCheck();
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

        const openPanel = () => {
            panel.style.display = 'flex';
            updateMatchIndicators();
        };
        const closePanel = () => { panel.style.display = 'none'; };
        const togglePanel = () => {
            const isHidden = getComputedStyle(panel).display === 'none';
            panel.style.display = isHidden ? 'flex' : 'none';
            if (isHidden) updateMatchIndicators();
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
                ev.preventDefault();
            };

            const onEnd = () => {
                if (!dragging) return;
                dragging = false;
                const rect = panelEl.getBoundingClientRect();
                GM_setValue(storageKey, { left: Math.round(rect.left), top: Math.round(rect.top) });
            };

            handleEl.addEventListener('mousedown', onStart);
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            handleEl.addEventListener('touchstart', onStart, { passive: false });
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onEnd);
        }

        enableDrag(panel, headerEl, `${APP_PREFIX}panel_pos`);

        btn.addEventListener('click', () => {
            if (dragMoved) return;
            togglePanel();
        });
        close.addEventListener('click', () => {
            closePanel();
        });
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
            if (ev.target === helpModal) helpModal.style.display = 'none';
        });
        settingsModal.addEventListener('click', (ev) => {
            if (ev.target === settingsModal) settingsModal.style.display = 'none';
        });


        if (fetchBtn) fetchBtn.addEventListener('click', handleFetch);
        if (recomputeBtn) recomputeBtn.addEventListener('click', handleRecompute);
        if (applyBtn) applyBtn.addEventListener('click', handleApply);
        panel.addEventListener('input', updateMatchIndicators);
        panel.addEventListener('change', updateMatchIndicators);
        if (titleCnInput) {
            titleCnInput.addEventListener('input', () => scheduleDuplicateCheck('input'));
            titleCnInput.addEventListener('change', () => scheduleDuplicateCheck('change'));
        }
        if (authorCnInput) {
            authorCnInput.addEventListener('input', () => scheduleDuplicateCheck('input'));
            authorCnInput.addEventListener('change', () => scheduleDuplicateCheck('change'));
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
        setDataActionButtonsEnabled(false);
        setApplyByDuplicateState();

        const last = GM_getValue(`${APP_PREFIX}last_url`, '');
        if (last) shadowRoot.getElementById(`${APP_PREFIX}url`).value = last;
        const nameSetSaved = GM_getValue(`${APP_PREFIX}name_set`, '');
        if (nameSetSaved) shadowRoot.getElementById(`${APP_PREFIX}nameSet`).value = nameSetSaved;
        shadowRoot.getElementById(`${APP_PREFIX}nameSet`).addEventListener('input', (ev) => {
            GM_setValue(`${APP_PREFIX}name_set`, ev.target.value || '');
        });
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
