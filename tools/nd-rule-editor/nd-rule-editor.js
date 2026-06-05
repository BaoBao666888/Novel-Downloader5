// ==UserScript==
// @name        nd-rule-editor
// @version     1.0.0
// @include     *
// ==/UserScript==
/* eslint-env browser */
/* global GM_getValue GM_setValue unsafeWindow */
(function (window, document) {
    'use strict';

    if (window.NDRuleEditor && window.NDRuleEditor.__installed) return;

    const VERSION = '1.0.0';
    const UI_HOST_ID = 'novel-downloader-shadow-host';
    const OVERLAY_ID = 'ndRuleEditorOverlay';
    const STYLE_ID = 'ndRuleEditorStyle';
    const STORAGE_KEY = 'nd_rule_editor_state_v1';
    const AUTOSAVE_DELAY = 900;

    let state = null;
    let activeOptions = {};
    let autosaveTimer = null;
    let saveStateLabelTimer = null;

    const TEMPLATE_SELECTOR = `({
  siteName: "Tên web",
  url: "://example.com/book/\\\\d+",
  chapterUrl: "://example.com/chapter/\\\\d+",
  title: "h1",
  writer: ".author",
  intro: ".intro",
  cover: ".cover img",
  chapter: ".chapter-list a",
  chapterTitle: "h1",
  content: ".content",
  elementRemove: "script,style,.ads"
})`;

    const TEMPLATE_GET_CHAPTERS = `({
  siteName: "Rule API mục lục",
  url: "://example.com/book/\\\\d+",
  chapterUrl: "://example.com/chapter/\\\\d+",
  title: "h1",
  writer: ".author",
  intro: ".intro",
  cover: ".cover img",
  async getChapters(doc = document) {
    const listUrl = helpers.absoluteUrl("/api/chapters", location.href);
    const json = await helpers.requestJson(listUrl);
    return (json.data || []).map(item => ({
      title: item.title,
      url: helpers.absoluteUrl(item.url, location.href)
    }));
  },
  chapterTitle: "h1",
  content: ".content",
  elementRemove: "script,style,.ads"
})`;

    const TEMPLATE_DEAL = `({
  siteName: "Rule API nội dung",
  url: "://example.com/book/\\\\d+",
  chapterUrl: "://example.com/chapter/\\\\d+",
  title: "h1",
  chapter: ".chapter-list a",
  async deal(chapter) {
    const html = await helpers.requestText(chapter.url);
    const doc = helpers.parseHtml(html);
    const title = helpers.text("h1", doc) || chapter.title;
    const content = helpers.html(".content", doc);
    return { title, content };
  },
  elementRemove: "script,style,.ads",
  thread: 1
})`;

    const SNIPPETS = [
        {
            label: 'infoPage',
            desc: 'Lấy trang thông tin truyện nếu trang hiện tại là trang chương hoặc trang trung gian.',
            code: `infoPage(doc = document) {
  const link = doc.querySelector('a[href*="/novel/"]');
  return link ? helpers.absoluteUrl(link.getAttribute('href'), location.href) : '';
},`
        },
        {
            label: 'book fields',
            desc: 'Các field cơ bản để lấy tên truyện, tác giả, tóm tắt và bìa.',
            code: `title: '.book-title',
writer: '.book-author',
intro: '.book-intro',
cover: '.book-cover img',`
        },
        {
            label: 'cover fn',
            desc: 'Dùng khi link bìa cần xử lý bằng JS thay vì selector đơn giản.',
            code: `cover(doc = document) {
  return helpers.attr('.book-cover img', 'src', doc);
},`
        },
        {
            label: 'getChapters',
            desc: 'Tự lấy danh sách chương từ selector link chương.',
            code: `async getChapters(doc = document) {
  return helpers.mapChapters('.chapter-list a', doc, location.href);
},`
        },
        {
            label: 'deal',
            desc: 'Tải nội dung một chương bằng helper requestDoc.',
            code: `async deal(chapter) {
  const doc = await helpers.requestDoc(chapter.url);
  return {
    title: helpers.text('h1', doc) || chapter.title,
    content: helpers.html('.content', doc)
  };
},`
        },
        {
            label: 'contentCheck',
            desc: 'Kiểm tra nội dung chương đủ hợp lệ trước khi đánh dấu tải xong.',
            code: `contentCheck(content) {
  return String(content || '').trim().length > 50;
},`
        },
        {
            label: 'onComplete',
            desc: 'Hook chạy sau khi tải xong toàn bộ chương.',
            code: `async onComplete(chapters) {
  console.log('Đã tải xong', chapters.length, 'chương');
},`
        }
    ];

    function getUiRoot(create = false) {
        if (typeof window.__novelDownloaderGetUIRoot === 'function') {
            const root = window.__novelDownloaderGetUIRoot(create);
            if (root) return root;
        }
        let host = document.getElementById(UI_HOST_ID);
        if (!host && create) {
            host = document.createElement('div');
            host.id = UI_HOST_ID;
            (document.body || document.documentElement).appendChild(host);
        }
        if (!host) return null;
        if (!host.shadowRoot && create && typeof host.attachShadow === 'function') {
            host.attachShadow({ mode: 'open' });
        }
        return host.shadowRoot || host;
    }

    function safeGetValue(key, fallback) {
        try {
            if (typeof GM_getValue === 'function') return GM_getValue(key, fallback);
        } catch (error) {
            // Fall through to localStorage.
        }
        try {
            const raw = window.localStorage && window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function safeSetValue(key, value) {
        try {
            if (typeof GM_setValue === 'function') {
                GM_setValue(key, value);
                return;
            }
        } catch (error) {
            // Fall through to localStorage.
        }
        try {
            if (window.localStorage) window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // Ignore storage errors; editor can still work during this page load.
        }
    }

    function createRuleId() {
        return `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function escapeHtml(text) {
        return String(text).replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function limitText(text, max = 200) {
        const value = String(text || '');
        return value.length > max ? `${value.slice(0, max)}...` : value;
    }

    function normalizeRule(rule) {
        const now = nowIso();
        return Object.assign({
            id: createRuleId(),
            name: 'Rule mới',
            enabled: true,
            code: TEMPLATE_SELECTOR,
            notes: '',
            createdAt: now,
            updatedAt: now,
            lastValidatedAt: '',
            lastValidation: null
        }, rule || {});
    }

    function createStateFromCustomize(customize) {
        const code = String(customize || '').trim();
        const rules = [];
        if (code && code !== '[]') {
            rules.push(normalizeRule({
                name: 'Rule cũ từ Quy tắc tùy chỉnh',
                code,
                notes: 'Được import tự động từ Config.customize cũ.'
            }));
        }
        return {
            version: 1,
            activeId: rules[0] && rules[0].id || '',
            rules,
            updatedAt: nowIso()
        };
    }

    function normalizeState(raw, customize) {
        const base = raw && typeof raw === 'object' && Array.isArray(raw.rules)
            ? raw
            : createStateFromCustomize(customize);
        base.version = 1;
        base.rules = base.rules.map(normalizeRule);
        if (!base.activeId || !base.rules.some(rule => rule.id === base.activeId)) {
            base.activeId = base.rules[0] && base.rules[0].id || '';
        }
        base.updatedAt = base.updatedAt || nowIso();
        return base;
    }

    function loadState(customize) {
        state = normalizeState(safeGetValue(STORAGE_KEY, null), customize);
        if (!state.rules.length && String(customize || '').trim() && String(customize || '').trim() !== '[]') {
            state = createStateFromCustomize(customize);
        }
        return state;
    }

    function saveState(label = 'Đã lưu') {
        if (!state) return;
        state.updatedAt = nowIso();
        safeSetValue(STORAGE_KEY, state);
        showSaveState(label);
    }

    function queueSaveState() {
        showSaveState('Đang lưu...');
        window.clearTimeout(autosaveTimer);
        autosaveTimer = window.setTimeout(() => saveState('Đã lưu'), AUTOSAVE_DELAY);
    }

    function showSaveState(text) {
        const root = getUiRoot(false);
        const node = root && root.querySelector(`#${OVERLAY_ID} [data-role="save-state"]`);
        if (!node) return;
        node.textContent = text;
        window.clearTimeout(saveStateLabelTimer);
        if (text === 'Đã lưu' || text === 'Đã áp dụng') {
            saveStateLabelTimer = window.setTimeout(() => {
                if (node.textContent === text) node.textContent = '';
            }, 2200);
        }
    }

    function getActiveRule() {
        return state && state.rules.find(rule => rule.id === state.activeId) || null;
    }

    function isExpressionCode(code) {
        return /^[\s]*[\[({]/.test(String(code || ''));
    }

    function buildCustomizeFromRules(rules) {
        const enabledRules = (rules || []).filter(rule => rule.enabled && String(rule.code || '').trim());
        if (!enabledRules.length) return '[]';
        const parts = [
            '/* Generated by Novel Downloader Rule Editor. Do not edit here; use the rule editor UI. */'
        ];
        enabledRules.forEach((rule, index) => {
            const code = String(rule.code || '').trim();
            parts.push(`\n/* ${index + 1}. ${String(rule.name || 'Rule').replace(/\*\//g, '* /')} */`);
            if (isExpressionCode(code)) {
                parts.push(`Rule.special.push(...[].concat((${code})));`);
            } else {
                parts.push(code);
            }
        });
        return parts.join('\n');
    }

    function validateRuleCode(code) {
        const source = String(code || '').trim();
        const result = {
            ok: false,
            message: '',
            warnings: [],
            rules: []
        };
        if (!source) {
            result.message = 'Code đang trống.';
            return result;
        }
        const fakeRule = {
            special: [],
            helpers: createHelperStubs()
        };
        const sandboxApis = {
            helpers: fakeRule.helpers,
            utils: fakeRule.helpers,
            xhr: {},
            $: function () { return { toArray: () => [], map: () => [], text: () => '', html: () => '', attr: () => '' }; },
            sleep: () => Promise.resolve(),
            html2Text: value => String(value || ''),
            replaceWithDict: value => value,
            Storage: {},
            Config: {},
            unsafeWindow: {},
            GM_getValue: () => undefined,
            GM_setValue: () => undefined,
            GM_xmlhttpRequest: () => {},
            download: () => {},
            saveAs: () => {},
            CryptoJS: {},
            console: window.console || console
        };
        try {
            let returned;
            const names = ['Rule', ...Object.keys(sandboxApis)];
            const values = [fakeRule, ...Object.values(sandboxApis)];
            if (isExpressionCode(source)) {
                returned = new Function(...names, `"use strict"; return (${source});`)(...values);
            } else {
                returned = new Function(...names, `"use strict";\n${source}`)(...values);
            }
            result.rules = normalizeReturnedRules(returned).concat(fakeRule.special).filter(Boolean);
            if (!result.rules.length) {
                result.warnings.push('Không thấy rule object trả về hoặc Rule.special.push(...).');
            }
            result.rules.forEach((rule, index) => {
                if (!rule.siteName) result.warnings.push(`Rule #${index + 1} thiếu siteName.`);
                if (!rule.url && !rule.chapterUrl && !rule.filter) {
                    result.warnings.push(`Rule #${index + 1} thiếu url/chapterUrl/filter.`);
                }
            });
            result.ok = true;
            result.message = result.rules.length
                ? `OK: ${result.rules.length} rule.`
                : 'OK cú pháp, nhưng chưa nhận diện được rule.';
        } catch (error) {
            result.ok = false;
            result.message = error && (error.stack || error.message) || String(error);
        }
        return result;
    }

    function createHelperStubs() {
        const stubAsync = async () => {
            throw new Error('Helper stub trong validate không gọi network.');
        };
        return {
            sleep: async () => {},
            absoluteUrl: (url, base = window.location.href) => {
                try {
                    return new URL(url, base).href;
                } catch (error) {
                    return String(url || '');
                }
            },
            parseHtml: html => new DOMParser().parseFromString(String(html || ''), 'text/html'),
            requestText: stubAsync,
            requestDoc: stubAsync,
            requestJson: stubAsync,
            text: () => '',
            html: () => '',
            attr: () => '',
            cleanText: value => String(value || ''),
            html2Text: value => String(value || ''),
            uniqueBy: (items = []) => items,
            mapChapters: () => [],
            makeChapterListContainer: () => document.createElement('div')
        };
    }

    function normalizeReturnedRules(value) {
        if (!value) return [];
        if (Array.isArray(value)) return value.flatMap(normalizeReturnedRules);
        if (typeof value === 'object') return [value];
        return [];
    }

    function summarizeRuleNameFromCode(code) {
        const validation = validateRuleCode(code);
        const first = validation.rules && validation.rules[0];
        if (first && first.siteName) return String(first.siteName);
        const match = String(code || '').match(/siteName\s*:\s*['"`]([^'"`]+)['"`]/);
        return match ? match[1] : 'Rule mới';
    }

    function stringifyRuleSource(rule) {
        const skip = new Set(['special', 'template', 'helpers', '__ndCustomRule']);
        const lines = ['({'];
        Object.keys(rule || {}).forEach((key) => {
            if (skip.has(key)) return;
            const value = rule[key];
            if (value === undefined) return;
            lines.push(`  ${JSON.stringify(key)}: ${stringifyValue(value)},`);
        });
        if (lines.length > 1 && lines[lines.length - 1].endsWith(',')) {
            lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '');
        }
        lines.push('})');
        return lines.join('\n');
    }

    function stringifyValue(value) {
        if (value instanceof RegExp) return value.toString();
        if (typeof value === 'function') return value.toString();
        if (Array.isArray(value)) return `[${value.map(stringifyValue).join(', ')}]`;
        if (value && typeof value === 'object') {
            const entries = Object.keys(value).slice(0, 40).map(key => `${JSON.stringify(key)}: ${stringifyValue(value[key])}`);
            return `{ ${entries.join(', ')} }`;
        }
        return JSON.stringify(value);
    }

    function getBuiltInRules() {
        const getter = activeOptions.getBuiltInRules;
        if (typeof getter !== 'function') return [];
        try {
            return getter() || [];
        } catch (error) {
            return [];
        }
    }

    function ensureStyle(root) {
        let style = root.querySelector(`#${STYLE_ID}`);
        if (!style) {
            style = document.createElement('style');
            style.id = STYLE_ID;
            root.appendChild(style);
        }
        style.textContent = [
            ':host{all:initial;display:block;position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:Arial,sans-serif;}',
            '*,*:before,*:after{box-sizing:border-box;}',
            `#${OVERLAY_ID}{position:fixed;inset:0;z-index:1000007;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.58);pointer-events:auto;color:#0f172a;font-family:Arial,sans-serif;}`,
            `#${OVERLAY_ID}.is-visible{display:flex;}`,
            `#${OVERLAY_ID} .nd-rule-window{width:min(1180px,calc(100vw - 24px));height:min(780px,calc(100vh - 24px));display:grid;grid-template-rows:auto 1fr;background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;box-shadow:0 24px 70px rgba(15,23,42,.38);overflow:hidden;}`,
            `#${OVERLAY_ID} .nd-rule-header{display:flex;align-items:center;gap:10px;padding:11px 14px;background:linear-gradient(135deg,#111827,#0f766e 56%,#7f1d1d);color:#fff;}`,
            `#${OVERLAY_ID} .nd-rule-title{font-size:15px;font-weight:700;}`,
            `#${OVERLAY_ID} .nd-rule-save-state{font-size:12px;color:#bfdbfe;}`,
            `#${OVERLAY_ID} .nd-rule-spacer{flex:1 1 auto;}`,
            `#${OVERLAY_ID} .nd-rule-close{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;border-radius:6px;padding:5px 9px;cursor:pointer;}`,
            `#${OVERLAY_ID} .nd-rule-body{display:grid;grid-template-columns:260px minmax(360px,1fr) 300px;min-height:0;}`,
            `#${OVERLAY_ID} .nd-rule-sidebar,#${OVERLAY_ID} .nd-rule-tools{border-right:1px solid #dbe3ef;background:#f1f5f9;min-height:0;overflow:auto;}`,
            `#${OVERLAY_ID} .nd-rule-tools{border-right:0;border-left:1px solid #dbe3ef;}`,
            `#${OVERLAY_ID} .nd-rule-panel{padding:10px;display:grid;gap:9px;align-content:start;}`,
            `#${OVERLAY_ID} .nd-rule-main{display:grid;grid-template-rows:auto 1fr auto;min-height:0;background:#fff;}`,
            `#${OVERLAY_ID} .nd-rule-toolbar{display:flex;flex-wrap:wrap;gap:7px;align-items:center;padding:10px;border-bottom:1px solid #e2e8f0;background:#fff;}`,
            `#${OVERLAY_ID} input,#${OVERLAY_ID} textarea{border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:#0f172a;padding:7px 8px;font:13px/1.35 Arial,sans-serif;}`,
            `#${OVERLAY_ID} textarea{resize:none;width:100%;height:100%;font-family:Consolas,Menlo,Monaco,"Courier New",monospace;font-size:12px;line-height:1.45;tab-size:2;border:0;border-radius:0;border-bottom:1px solid #e2e8f0;}`,
            `#${OVERLAY_ID} button{border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:#0f172a;padding:6px 9px;cursor:pointer;font-size:12px;font-weight:700;}`,
            `#${OVERLAY_ID} button:hover{background:#eff6ff;border-color:#93c5fd;}`,
            `#${OVERLAY_ID} button.primary{background:#0f766e;border-color:#14b8a6;color:#fff;}`,
            `#${OVERLAY_ID} button.danger{background:#fff1f2;border-color:#fecaca;color:#991b1b;}`,
            `#${OVERLAY_ID} button.ghost{background:#f8fafc;color:#475569;}`,
            `#${OVERLAY_ID} .nd-rule-list{display:grid;gap:6px;}`,
            `#${OVERLAY_ID} .nd-rule-item{display:grid;gap:3px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;padding:8px;cursor:pointer;}`,
            `#${OVERLAY_ID} .nd-rule-item.active{border-color:#0f766e;box-shadow:0 0 0 2px rgba(20,184,166,.2);}`,
            `#${OVERLAY_ID} .nd-rule-item-title{font-weight:700;font-size:12px;word-break:break-word;}`,
            `#${OVERLAY_ID} .nd-rule-item-meta{font-size:11px;color:#64748b;}`,
            `#${OVERLAY_ID} .nd-rule-editor-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}`,
            `#${OVERLAY_ID} .nd-rule-name{flex:1 1 240px;min-width:160px;}`,
            `#${OVERLAY_ID} .nd-rule-switch{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:#334155;}`,
            `#${OVERLAY_ID} .nd-rule-status{padding:9px 10px;background:#f8fafc;border-top:1px solid #e2e8f0;font:12px/1.45 Consolas,Menlo,monospace;white-space:pre-wrap;overflow:auto;max-height:120px;color:#334155;}`,
            `#${OVERLAY_ID} .nd-rule-status.ok{color:#166534;background:#f0fdf4;}`,
            `#${OVERLAY_ID} .nd-rule-status.error{color:#991b1b;background:#fff1f2;}`,
            `#${OVERLAY_ID} .nd-rule-section-title{font-weight:800;font-size:12px;color:#334155;text-transform:uppercase;letter-spacing:.02em;}`,
            `#${OVERLAY_ID} .nd-rule-snippets{display:flex;flex-wrap:wrap;gap:6px;}`,
            `#${OVERLAY_ID} .nd-rule-builtins{display:grid;gap:6px;max-height:210px;overflow:auto;}`,
            `#${OVERLAY_ID} .nd-rule-builtins button{text-align:left;font-weight:600;}`,
            `#${OVERLAY_ID} .nd-rule-help{font-size:12px;line-height:1.45;color:#64748b;}`,
            `#${OVERLAY_ID} .nd-rule-empty{padding:10px;border:1px dashed #cbd5e1;border-radius:7px;background:#fff;color:#64748b;font-size:12px;}`,
            '@media (max-width:900px){' +
                `#${OVERLAY_ID} .nd-rule-body{grid-template-columns:1fr;grid-template-rows:180px 1fr 260px;}` +
                `#${OVERLAY_ID} .nd-rule-sidebar,#${OVERLAY_ID} .nd-rule-tools{border:0;border-bottom:1px solid #dbe3ef;}` +
            '}'
        ].join('\n');
    }

    function ensureOverlay() {
        const root = getUiRoot(true) || document.body;
        ensureStyle(root);
        let overlay = root.querySelector(`#${OVERLAY_ID}`);
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.innerHTML = [
            '<div class="nd-rule-window" role="dialog" aria-modal="true">',
            '  <div class="nd-rule-header">',
            '    <span class="nd-rule-title">Quản lý quy tắc tùy chỉnh</span>',
            '    <span class="nd-rule-save-state" data-role="save-state"></span>',
            '    <span class="nd-rule-spacer"></span>',
            '    <button type="button" class="nd-rule-close" data-action="close">Đóng</button>',
            '  </div>',
            '  <div class="nd-rule-body">',
            '    <aside class="nd-rule-sidebar"><div class="nd-rule-panel" data-role="sidebar"></div></aside>',
            '    <main class="nd-rule-main" data-role="main"></main>',
            '    <aside class="nd-rule-tools"><div class="nd-rule-panel" data-role="tools"></div></aside>',
            '  </div>',
            '</div>'
        ].join('');
        overlay.addEventListener('click', handleOverlayClick);
        overlay.addEventListener('input', handleOverlayInput);
        overlay.addEventListener('change', handleOverlayChange);
        root.appendChild(overlay);
        return overlay;
    }

    function renderAll() {
        const overlay = ensureOverlay();
        renderSidebar(overlay);
        renderMain(overlay);
        renderTools(overlay);
    }

    function renderSidebar(overlay) {
        const sidebar = overlay.querySelector('[data-role="sidebar"]');
        const query = sidebar.querySelector('[name="rule-search"]')?.value || '';
        const rules = state.rules.filter(rule => !query || rule.name.toLowerCase().includes(query.toLowerCase()) || rule.code.toLowerCase().includes(query.toLowerCase()));
        sidebar.innerHTML = [
            '<button type="button" class="primary" data-action="new-rule">Tạo rule</button>',
            '<input type="search" name="rule-search" placeholder="Tìm rule tự tạo..." value="' + escapeHtml(query) + '">',
            rules.length ? `<div class="nd-rule-list">${rules.map(renderRuleListItem).join('')}</div>` : '<div class="nd-rule-empty">Chưa có rule nào.</div>',
            '<div class="nd-rule-help">Rule đang bật sẽ được gom vào <code>Config.customize</code> khi bấm <b>Áp dụng</b>.</div>'
        ].join('');
    }

    function renderRuleListItem(rule) {
        const validation = rule.lastValidation;
        const statusText = validation
            ? validation.ok ? 'OK' : 'Lỗi'
            : 'Chưa kiểm tra';
        return [
            `<div class="nd-rule-item ${rule.id === state.activeId ? 'active' : ''}" data-rule-id="${escapeHtml(rule.id)}">`,
            `  <div class="nd-rule-item-title">${escapeHtml(rule.name || 'Rule')}</div>`,
            `  <div class="nd-rule-item-meta">${rule.enabled ? 'Bật' : 'Tắt'} · ${escapeHtml(statusText)}</div>`,
            '</div>'
        ].join('');
    }

    function renderMain(overlay) {
        const main = overlay.querySelector('[data-role="main"]');
        const rule = getActiveRule();
        if (!rule) {
            main.innerHTML = [
                '<div class="nd-rule-toolbar">',
                '  <button type="button" class="primary" data-action="new-rule">Tạo rule đầu tiên</button>',
                '  <button type="button" data-action="import-json">Import JSON</button>',
                '</div>',
                '<div class="nd-rule-empty" style="margin:12px;">Chưa có rule. Tạo rule mới hoặc import rule cũ.</div>'
            ].join('');
            return;
        }
        const validation = rule.lastValidation;
        const statusClass = validation ? validation.ok ? 'ok' : 'error' : '';
        const statusText = validation
            ? `${validation.message}${validation.warnings && validation.warnings.length ? `\nCảnh báo:\n- ${validation.warnings.join('\n- ')}` : ''}`
            : 'Chưa kiểm tra.';
        main.innerHTML = [
            '<div class="nd-rule-toolbar">',
            '  <div class="nd-rule-editor-meta">',
            `    <input class="nd-rule-name" name="rule-name" value="${escapeHtml(rule.name || '')}" placeholder="Tên rule">`,
            '    <label class="nd-rule-switch"><input type="checkbox" name="rule-enabled"' + (rule.enabled ? ' checked' : '') + '> Bật</label>',
            '  </div>',
            '  <span class="nd-rule-spacer"></span>',
            '  <button type="button" data-action="validate-rule">Kiểm tra</button>',
            '  <button type="button" class="primary" data-action="apply-rules">Áp dụng</button>',
            '  <button type="button" data-action="copy-rule">Copy</button>',
            '  <button type="button" class="danger" data-action="delete-rule">Xóa</button>',
            '</div>',
            `<textarea name="rule-code" spellcheck="false">${escapeHtml(rule.code || '')}</textarea>`,
            `<div class="nd-rule-status ${statusClass}" data-role="validation">${escapeHtml(statusText)}</div>`
        ].join('');
    }

    function renderTools(overlay) {
        const tools = overlay.querySelector('[data-role="tools"]');
        const builtInSearch = tools.querySelector('[name="builtin-search"]')?.value || '';
        const builtIns = getBuiltInRules()
            .filter(rule => !rule.__ndCustomRule)
            .filter(rule => {
                if (!builtInSearch) return true;
                const haystack = `${rule.siteName || ''} ${[].concat(rule.url || []).join(' ')} ${[].concat(rule.chapterUrl || []).join(' ')}`.toLowerCase();
                return haystack.includes(builtInSearch.toLowerCase());
            })
            .slice(0, 30);
        tools.innerHTML = [
            '<div class="nd-rule-section-title">Template</div>',
            '<div class="nd-rule-snippets">',
            '  <button type="button" data-action="template-selector">Selector</button>',
            '  <button type="button" data-action="template-getchapters">getChapters</button>',
            '  <button type="button" data-action="template-deal">deal</button>',
            '</div>',
            '<div class="nd-rule-section-title">Chèn nhanh</div>',
            `<div class="nd-rule-snippets">${SNIPPETS.map((snippet, index) => `<button type="button" data-snippet="${index}" title="${escapeHtml(snippet.desc || snippet.label)}">${escapeHtml(snippet.label)}</button>`).join('')}</div>`,
            '<div class="nd-rule-section-title">Rule gốc</div>',
            `<input type="search" name="builtin-search" placeholder="Tìm rule gốc..." value="${escapeHtml(builtInSearch)}">`,
            builtIns.length
                ? `<div class="nd-rule-builtins">${builtIns.map((rule, index) => `<button type="button" data-action="clone-builtin" data-builtin-index="${index}">${escapeHtml(rule.siteName || 'Không tên')}</button>`).join('')}</div>`
                : '<div class="nd-rule-empty">Không tìm thấy rule gốc.</div>',
            '<div class="nd-rule-section-title">Dữ liệu</div>',
            '<div class="nd-rule-snippets">',
            '  <button type="button" data-action="export-json">Export JSON</button>',
            '  <button type="button" data-action="import-json">Import JSON</button>',
            '</div>',
            '<div class="nd-rule-help">Autosave lưu draft riêng. <b>Áp dụng</b> mới ghi lại Quy tắc tùy chỉnh để lần reload sau rule được nạp.</div>'
        ].join('');
    }

    function handleOverlayClick(event) {
        const overlay = event.currentTarget;
        const ruleItem = event.target.closest('[data-rule-id]');
        if (ruleItem) {
            state.activeId = ruleItem.dataset.ruleId;
            saveState();
            renderAll();
            return;
        }
        const snippetButton = event.target.closest('[data-snippet]');
        if (snippetButton) {
            const snippet = SNIPPETS[Number(snippetButton.dataset.snippet)];
            if (snippet) insertIntoEditor(snippet.code);
            return;
        }
        const button = event.target.closest('button[data-action]');
        if (!button) {
            if (event.target === overlay) overlay.classList.remove('is-visible');
            return;
        }
        const action = button.dataset.action;
        if (action === 'close') {
            overlay.classList.remove('is-visible');
        } else if (action === 'new-rule') {
            createRule();
        } else if (action === 'delete-rule') {
            deleteActiveRule();
        } else if (action === 'validate-rule') {
            validateActiveRule(true);
        } else if (action === 'apply-rules') {
            applyRules();
        } else if (action === 'copy-rule') {
            copyActiveRule(button);
        } else if (action === 'template-selector') {
            replaceActiveCode(TEMPLATE_SELECTOR);
        } else if (action === 'template-getchapters') {
            replaceActiveCode(TEMPLATE_GET_CHAPTERS);
        } else if (action === 'template-deal') {
            replaceActiveCode(TEMPLATE_DEAL);
        } else if (action === 'clone-builtin') {
            cloneBuiltInRule(button, overlay);
        } else if (action === 'export-json') {
            exportJson(button);
        } else if (action === 'import-json') {
            importJson();
        }
    }

    function handleOverlayInput(event) {
        const target = event.target;
        if (target.name === 'rule-search' || target.name === 'builtin-search') {
            renderAll();
            return;
        }
        const rule = getActiveRule();
        if (!rule) return;
        if (target.name === 'rule-name') {
            rule.name = target.value;
            rule.updatedAt = nowIso();
            queueSaveState();
            renderSidebar(event.currentTarget);
        } else if (target.name === 'rule-code') {
            rule.code = target.value;
            rule.updatedAt = nowIso();
            rule.lastValidation = null;
            queueSaveState();
        }
    }

    function handleOverlayChange(event) {
        const rule = getActiveRule();
        if (!rule) return;
        if (event.target.name === 'rule-enabled') {
            rule.enabled = event.target.checked;
            rule.updatedAt = nowIso();
            queueSaveState();
            renderSidebar(event.currentTarget);
        }
    }

    function createRule(code = TEMPLATE_SELECTOR, name = '') {
        const rule = normalizeRule({
            name: name || summarizeRuleNameFromCode(code),
            code
        });
        state.rules.unshift(rule);
        state.activeId = rule.id;
        saveState();
        renderAll();
    }

    function deleteActiveRule() {
        const rule = getActiveRule();
        if (!rule) return;
        if (!window.confirm(`Xóa rule "${rule.name || 'Rule'}"?`)) return;
        state.rules = state.rules.filter(item => item.id !== rule.id);
        state.activeId = state.rules[0] && state.rules[0].id || '';
        saveState();
        renderAll();
    }

    function validateActiveRule(show = false) {
        const rule = getActiveRule();
        if (!rule) return null;
        const validation = validateRuleCode(rule.code);
        rule.lastValidation = validation;
        rule.lastValidatedAt = nowIso();
        if (validation.ok && validation.rules[0] && validation.rules[0].siteName && (!rule.name || rule.name === 'Rule mới')) {
            rule.name = String(validation.rules[0].siteName);
        }
        saveState(show ? 'Đã kiểm tra' : 'Đã lưu');
        renderAll();
        return validation;
    }

    function validateAllEnabledRules() {
        const failures = [];
        state.rules.filter(rule => rule.enabled && String(rule.code || '').trim()).forEach((rule) => {
            const validation = validateRuleCode(rule.code);
            rule.lastValidation = validation;
            rule.lastValidatedAt = nowIso();
            if (!validation.ok) failures.push(`${rule.name || 'Rule'}: ${validation.message}`);
        });
        saveState();
        return failures;
    }

    function applyRules() {
        const failures = validateAllEnabledRules();
        renderAll();
        if (failures.length) {
            alert(`Chưa áp dụng vì có rule lỗi:\n\n${failures.join('\n\n')}`);
            return;
        }
        const code = buildCustomizeFromRules(state.rules);
        if (typeof activeOptions.onApply === 'function') {
            activeOptions.onApply(code, {
                enabledCount: state.rules.filter(rule => rule.enabled && String(rule.code || '').trim()).length,
                totalCount: state.rules.length
            });
        }
        saveState('Đã áp dụng');
        alert('Đã áp dụng Quy tắc tùy chỉnh. Reload trang nếu muốn rule mới nhận ngay từ đầu.');
    }

    function replaceActiveCode(code) {
        const rule = getActiveRule();
        if (!rule) {
            createRule(code);
            return;
        }
        if (rule.code && rule.code.trim() && !window.confirm('Thay code hiện tại bằng template này?')) return;
        rule.code = code;
        rule.name = summarizeRuleNameFromCode(code);
        rule.updatedAt = nowIso();
        rule.lastValidation = null;
        saveState();
        renderAll();
    }

    function insertIntoEditor(text) {
        const root = getUiRoot(false);
        const textarea = root && root.querySelector(`#${OVERLAY_ID} textarea[name="rule-code"]`);
        const rule = getActiveRule();
        if (!textarea || !rule) return;
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        const before = textarea.value.slice(0, start);
        const after = textarea.value.slice(end);
        const insert = `${before && !before.endsWith('\n') ? '\n' : ''}${text}${after && !after.startsWith('\n') ? '\n' : ''}`;
        textarea.value = `${before}${insert}${after}`;
        rule.code = textarea.value;
        rule.updatedAt = nowIso();
        rule.lastValidation = null;
        queueSaveState();
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = before.length + insert.length;
    }

    function cloneBuiltInRule(button, overlay) {
        const tools = overlay.querySelector('[data-role="tools"]');
        const query = tools.querySelector('[name="builtin-search"]')?.value || '';
        const builtIns = getBuiltInRules()
            .filter(rule => !rule.__ndCustomRule)
            .filter(rule => {
                if (!query) return true;
                const haystack = `${rule.siteName || ''} ${[].concat(rule.url || []).join(' ')} ${[].concat(rule.chapterUrl || []).join(' ')}`.toLowerCase();
                return haystack.includes(query.toLowerCase());
            })
            .slice(0, 30);
        const source = builtIns[Number(button.dataset.builtinIndex)];
        if (!source) return;
        createRule(stringifyRuleSource(source), `${source.siteName || 'Rule gốc'} copy`);
    }

    async function copyActiveRule(button) {
        const rule = getActiveRule();
        if (!rule) return;
        await copyText(rule.code || '');
        flashButton(button, 'Đã copy');
    }

    async function exportJson(button) {
        await copyText(JSON.stringify(state, null, 2));
        flashButton(button, 'Đã copy JSON');
    }

    function importJson() {
        const raw = window.prompt('Dán JSON đã export từ Rule Editor:');
        if (!raw) return;
        try {
            const imported = JSON.parse(raw);
            const nextState = normalizeState(imported, '');
            if (!Array.isArray(nextState.rules)) throw new Error('JSON không có rules.');
            state = nextState;
            saveState();
            renderAll();
        } catch (error) {
            alert(`Import lỗi: ${error.message || error}`);
        }
    }

    async function copyText(text) {
        if (window.navigator && window.navigator.clipboard && window.navigator.clipboard.writeText) {
            try {
                await window.navigator.clipboard.writeText(text);
                return;
            } catch (error) {
                // Fallback below.
            }
        }
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        (document.body || document.documentElement).appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
    }

    function flashButton(button, text) {
        if (!button) return;
        const oldText = button.textContent;
        button.textContent = text;
        window.setTimeout(() => {
            button.textContent = oldText;
        }, 1200);
    }

    function getSummary(customize) {
        const loadedState = state || normalizeState(safeGetValue(STORAGE_KEY, null), customize);
        const total = loadedState.rules.length;
        const enabled = loadedState.rules.filter(rule => rule.enabled && String(rule.code || '').trim()).length;
        if (!total && (!customize || String(customize).trim() === '[]')) return 'Chưa có rule tùy chỉnh';
        return `${enabled}/${total} rule đang bật`;
    }

    function open(options = {}) {
        activeOptions = Object.assign({}, options);
        loadState(options.currentCustomize || '');
        renderAll();
        const overlay = ensureOverlay();
        overlay.classList.add('is-visible');
    }

    const api = {
        __installed: true,
        version: VERSION,
        open,
        buildCustomizeFromRules,
        validateRuleCode,
        getSummary,
        getState: () => normalizeState(safeGetValue(STORAGE_KEY, null), activeOptions.currentCustomize || '')
    };

    window.NDRuleEditor = api;
    if (typeof unsafeWindow !== 'undefined') {
        unsafeWindow.NDRuleEditor = api;
    }
}(window, document));
