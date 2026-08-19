// ==UserScript==
// @name        nd-rule-editor
// @version     1.1.0
// @include     *
// ==/UserScript==
/* eslint-env browser */
/* global GM_getValue GM_setValue unsafeWindow */
(function (window, document) {
    'use strict';

    if (window.NDRuleEditor && window.NDRuleEditor.__installed) return;

    const VERSION = '1.1.0';
    const UI_HOST_ID = 'novel-downloader-shadow-host';
    const OVERLAY_ID = 'ndRuleEditorOverlay';
    const STYLE_ID = 'ndRuleEditorStyle';
    const STORAGE_KEY = 'nd_rule_editor_state_v1';
    const AUTOSAVE_DELAY = 900;
    const UI_FONT = '"Segoe UI", Arial, "Noto Sans", "Helvetica Neue", sans-serif';
    const MONO_FONT = '"Cascadia Mono", Consolas, Menlo, Monaco, "Courier New", monospace';

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

    function highlightJavaScript(source, errorLine = 0) {
        const keywordRe = /^(?:async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|get|if|import|in|instanceof|let|new|of|return|set|static|super|switch|throw|try|typeof|var|void|while|with|yield)$/;
        const literalRe = /^(?:true|false|null|undefined|NaN|Infinity)$/;
        const tokenRe = /(?:\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/(?![*/])(?:\\.|[^/\\\n])+\/[dgimsuvy]*|\b(?:async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|from|function|get|if|import|in|instanceof|let|new|of|return|set|static|super|switch|throw|try|typeof|var|void|while|with|yield|true|false|null|undefined|NaN|Infinity)\b|\b(?:0[xob][\da-f]+|\d+(?:\.\d+)?)\b)/gi;
        const lines = String(source || '').split('\n');
        if (!lines.length) lines.push('');
        return lines.map((line, index) => {
            let cursor = 0;
            const parts = [];
            line.replace(tokenRe, (token, offset) => {
                parts.push(escapeHtml(line.slice(cursor, offset)));
                let type = 'plain';
                if (token.startsWith('//')) type = 'comment';
                else if (/^["'`]/.test(token)) type = 'string';
                else if (token.startsWith('/')) type = 'regex';
                else if (/^(?:0[xob]|\d)/i.test(token)) type = 'number';
                else if (literalRe.test(token)) type = 'literal';
                else if (keywordRe.test(token)) type = 'keyword';
                parts.push(`<span class="tok-${type}">${escapeHtml(token)}</span>`);
                cursor = offset + token.length;
                return token;
            });
            parts.push(escapeHtml(line.slice(cursor)) || (line ? '' : ' '));
            return `<span class="nd-code-line${index + 1 === errorLine ? ' has-error' : ''}" data-line="${index + 1}">${parts.join('')}</span>`;
        }).join('');
    }

    function syncCodeHighlight(textarea) {
        if (!textarea) return;
        const editor = textarea.closest('.nd-code-editor');
        const code = editor && editor.querySelector('[data-role="code-highlight"] code');
        const highlight = editor && editor.querySelector('[data-role="code-highlight"]');
        const rule = getActiveRule();
        if (!code || !highlight) return;
        const errorLine = rule && rule.lastValidation && !rule.lastValidation.ok
            ? Number(rule.lastValidation.errorLine || 0)
            : 0;
        code.innerHTML = highlightJavaScript(textarea.value, errorLine);
        highlight.scrollTop = textarea.scrollTop;
        highlight.scrollLeft = textarea.scrollLeft;
    }

    function setEditorValue(textarea, value, selectionStart, selectionEnd = selectionStart) {
        const rule = getActiveRule();
        if (!textarea || !rule) return;
        textarea.value = value;
        rule.code = value;
        rule.updatedAt = nowIso();
        rule.lastValidation = null;
        textarea.selectionStart = Math.max(0, selectionStart);
        textarea.selectionEnd = Math.max(0, selectionEnd);
        syncCodeHighlight(textarea);
        queueSaveState();
    }

    function formatJavaScript(source) {
        const protectedSource = protectJavaScriptLiterals(String(source || ''));
        source = protectedSource.source;
        let output = '';
        let quote = '';
        let escaped = false;
        let lineComment = false;
        let blockComment = false;
        let regex = false;
        let regexClass = false;
        let parenDepth = 0;
        let squareDepth = 0;
        let braceDepth = 0;
        let previousCode = '';
        const appendBreak = () => {
            output = output.replace(/[ \t]+$/g, '');
            if (!output.endsWith('\n')) output += '\n';
        };
        const canStartRegex = () => !previousCode
            || /[({\[,:;=!?&|+\-*~^<>]/.test(previousCode)
            || /\b(?:return|case|throw|yield|await|typeof|delete|void|new|in|of|instanceof)\s*$/.test(output);

        for (let index = 0; index < source.length; index++) {
            const char = source[index];
            const next = source[index + 1];
            output += char;
            if (lineComment) {
                if (char === '\n') lineComment = false;
                continue;
            }
            if (blockComment) {
                if (char === '*' && next === '/') {
                    output += next;
                    index++;
                    blockComment = false;
                }
                continue;
            }
            if (quote) {
                if (escaped) escaped = false;
                else if (char === '\\') escaped = true;
                else if (char === quote) quote = '';
                continue;
            }
            if (regex) {
                if (escaped) escaped = false;
                else if (char === '\\') escaped = true;
                else if (char === '[') regexClass = true;
                else if (char === ']') regexClass = false;
                else if (char === '/' && !regexClass) regex = false;
                continue;
            }
            if (char === '/' && next === '/') {
                output += next;
                index++;
                lineComment = true;
                continue;
            }
            if (char === '/' && next === '*') {
                output += next;
                index++;
                blockComment = true;
                continue;
            }
            if (char === '/' && canStartRegex()) {
                regex = true;
                regexClass = false;
                continue;
            }
            if (char === '"' || char === "'" || char === '`') {
                quote = char;
                continue;
            }
            if (char === '(') parenDepth++;
            else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
            else if (char === '[') squareDepth++;
            else if (char === ']') squareDepth = Math.max(0, squareDepth - 1);
            else if (char === '{') {
                braceDepth++;
                appendBreak();
            } else if (char === '}') {
                output = output.slice(0, -1);
                appendBreak();
                output += char;
                braceDepth = Math.max(0, braceDepth - 1);
            } else if (char === ';' && parenDepth <= 1) {
                appendBreak();
            } else if (char === ',' && braceDepth > 0 && squareDepth === 0 && parenDepth <= 1) {
                appendBreak();
            }
            if (!/\s/.test(char)) previousCode = char;
        }

        const lines = output.replace(/\r\n?/g, '\n').split('\n');
        let indent = 0;
        const formatted = [];
        lines.forEach((rawLine) => {
            const line = rawLine.trim();
            if (!line) {
                if (formatted.length && formatted[formatted.length - 1] !== '') formatted.push('');
                return;
            }
            const startsClose = /^[}\])]/.test(line);
            if (startsClose) indent = Math.max(0, indent - 1);
            formatted.push(`${'  '.repeat(indent)}${line}`);
            const structural = stripLineStringsAndComments(line);
            const opens = (structural.match(/{/g) || []).length;
            const closes = (structural.match(/}/g) || []).length;
            indent = Math.max(0, indent + opens - closes + (startsClose ? 1 : 0));
        });
        const formattedSource = formatted.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        return restoreJavaScriptLiterals(formattedSource, protectedSource.tokens);
    }

    function protectJavaScriptLiterals(source) {
        const tokens = [];
        let output = '';
        let previousCode = '';
        const canStartRegex = () => !previousCode
            || /[({\[,:;=!?&|+\-*~^<>]/.test(previousCode)
            || /\b(?:return|case|throw|yield|await|typeof|delete|void|new|in|of|instanceof)\s*$/.test(output);
        const storeToken = (value) => {
            let marker = `__ND_FMT_LITERAL_${tokens.length}__`;
            while (source.includes(marker)) marker += '_';
            tokens.push({ marker, value });
            output += marker;
        };

        for (let index = 0; index < source.length;) {
            const char = source[index];
            const next = source[index + 1];
            if (char === '"' || char === "'" || char === '`') {
                const quote = char;
                let end = index + 1;
                let escaped = false;
                while (end < source.length) {
                    const current = source[end++];
                    if (escaped) escaped = false;
                    else if (current === '\\') escaped = true;
                    else if (current === quote) break;
                }
                storeToken(source.slice(index, end));
                previousCode = 'v';
                index = end;
                continue;
            }
            if (char === '/' && next === '/') {
                let end = source.indexOf('\n', index);
                if (end < 0) end = source.length;
                storeToken(source.slice(index, end));
                index = end;
                continue;
            }
            if (char === '/' && next === '*') {
                const close = source.indexOf('*/', index + 2);
                const end = close < 0 ? source.length : close + 2;
                storeToken(source.slice(index, end));
                previousCode = 'v';
                index = end;
                continue;
            }
            if (char === '/' && canStartRegex()) {
                let end = index + 1;
                let escaped = false;
                let inClass = false;
                while (end < source.length) {
                    const current = source[end++];
                    if (escaped) escaped = false;
                    else if (current === '\\') escaped = true;
                    else if (current === '[') inClass = true;
                    else if (current === ']') inClass = false;
                    else if (current === '/' && !inClass) {
                        while (/[a-z]/i.test(source[end] || '')) end++;
                        break;
                    }
                }
                storeToken(source.slice(index, end));
                previousCode = 'v';
                index = end;
                continue;
            }
            output += char;
            if (!/\s/.test(char)) previousCode = char;
            index++;
        }
        return { source: output, tokens };
    }

    function restoreJavaScriptLiterals(source, tokens) {
        let output = source;
        tokens.forEach(({ marker, value }) => {
            output = output.split(marker).join(value);
        });
        return output;
    }

    function stripLineStringsAndComments(line) {
        let result = '';
        let quote = '';
        let escaped = false;
        for (let index = 0; index < line.length; index++) {
            const char = line[index];
            const next = line[index + 1];
            if (quote) {
                if (escaped) escaped = false;
                else if (char === '\\') escaped = true;
                else if (char === quote) quote = '';
                result += ' ';
                continue;
            }
            if (char === '/' && next === '/') break;
            if (char === '"' || char === "'" || char === '`') {
                quote = char;
                result += ' ';
                continue;
            }
            result += char;
        }
        return result;
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
            ui: {
                sidebarCollapsed: false,
                toolsCollapsed: false,
                fullscreen: false
            },
            updatedAt: nowIso()
        };
    }

    function normalizeState(raw, customize) {
        const base = raw && typeof raw === 'object' && Array.isArray(raw.rules)
            ? raw
            : createStateFromCustomize(customize);
        base.version = 1;
        base.rules = base.rules.map(normalizeRule);
        base.ui = Object.assign({
            sidebarCollapsed: false,
            toolsCollapsed: false,
            fullscreen: false
        }, base.ui || {});
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

    function getRunnableRuleCode(code) {
        const source = String(code || '').trim();
        const markedBody = source.match(/\/\/\s*@rule-begin\b[^\n\r]*(?:\r?\n)?([\s\S]*?)(?:\r?\n)?\s*\/\/\s*@rule-end\b/);
        return (markedBody ? markedBody[1] : source).trim();
    }

    function stripLeadingComments(code) {
        let source = String(code || '').trim();
        let previous = '';
        while (source && source !== previous) {
            previous = source;
            source = source
                .replace(/^\/\/[^\n\r]*(?:\r?\n|$)/, '')
                .replace(/^\/\*[\s\S]*?\*\//, '')
                .trim();
        }
        return source;
    }

    function isExpressionCode(code) {
        return /^[\s]*[\[({]/.test(stripLeadingComments(getRunnableRuleCode(code)));
    }

    function buildCustomizeFromRules(rules) {
        const enabledRules = (rules || []).filter(rule => rule.enabled && String(rule.code || '').trim());
        if (!enabledRules.length) return '[]';
        const parts = [
            '/* Generated by Novel Downloader Rule Editor. Do not edit here; use the rule editor UI. */'
        ];
        enabledRules.forEach((rule, index) => {
            const code = getRunnableRuleCode(rule.code);
            if (!code) return;
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
        const source = getRunnableRuleCode(code);
        const result = {
            ok: false,
            message: '',
            warnings: [],
            rules: [],
            errorLine: 0,
            errorColumn: 0
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
            const body = isExpressionCode(source)
                ? `"use strict"; return (\n${source}\n);\n//# sourceURL=nd-rule-validation.js`
                : `"use strict";\n${source}\n//# sourceURL=nd-rule-validation.js`;
            returned = new Function(...names, body)(...values);
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
            result.message = error && error.message || String(error);
            const location = getRuleErrorLocation(error, source, 3);
            result.errorLine = location.line;
            result.errorColumn = location.column;
        }
        return result;
    }

    function getRuleErrorLocation(error, source, generatedLineOffset = 0) {
        const stack = String(error && error.stack || '');
        const matches = Array.from(stack.matchAll(/nd-rule-validation\.js:(\d+):(\d+)/g));
        if (matches.length) {
            const match = matches[matches.length - 1];
            return {
                line: Math.max(1, Number(match[1]) - generatedLineOffset),
                column: Math.max(1, Number(match[2]) || 1)
            };
        }
        if (Number.isFinite(error && error.lineNumber)) {
            return {
                line: Math.max(1, Number(error.lineNumber) - generatedLineOffset),
                column: Math.max(1, Number(error.columnNumber) || 1)
            };
        }
        const structural = findStructuralErrorLocation(source);
        return structural.line ? structural : findLikelySyntaxErrorLocation(source, error && error.message);
    }

    function findStructuralErrorLocation(source) {
        const stack = [];
        const pairs = { ')': '(', ']': '[', '}': '{' };
        let line = 1;
        let column = 0;
        let quote = '';
        let quoteLine = 0;
        let escaped = false;
        let lineComment = false;
        let blockComment = false;
        for (let index = 0; index < source.length; index++) {
            const char = source[index];
            const next = source[index + 1];
            if (char === '\n') {
                line++;
                column = 0;
                lineComment = false;
                if (quote && quote !== '`') return { line: quoteLine || line - 1, column: 1 };
                continue;
            }
            column++;
            if (lineComment) continue;
            if (blockComment) {
                if (char === '*' && next === '/') {
                    blockComment = false;
                    index++;
                    column++;
                }
                continue;
            }
            if (quote) {
                if (escaped) escaped = false;
                else if (char === '\\') escaped = true;
                else if (char === quote) quote = '';
                continue;
            }
            if (char === '/' && next === '/') {
                lineComment = true;
                index++;
                column++;
                continue;
            }
            if (char === '/' && next === '*') {
                blockComment = true;
                index++;
                column++;
                continue;
            }
            if (char === '"' || char === "'" || char === '`') {
                quote = char;
                quoteLine = line;
                continue;
            }
            if (char === '(' || char === '[' || char === '{') stack.push({ char, line, column });
            if (pairs[char]) {
                const opener = stack.pop();
                if (!opener || opener.char !== pairs[char]) return { line, column };
            }
        }
        if (quote || blockComment) return { line: quoteLine || line, column: 1 };
        const unclosed = stack.pop();
        return unclosed ? { line: unclosed.line, column: unclosed.column } : { line: 0, column: 0 };
    }

    function findLikelySyntaxErrorLocation(source, message) {
        const patterns = [
            /,,/m,
            /:\s*(?=[,}])/m,
            /(?:^|[,;])\s*\.(?=[A-Za-z_$])/m
        ];
        let index = -1;
        for (const pattern of patterns) {
            const match = pattern.exec(source);
            if (match) {
                index = match.index + Math.max(0, match[0].length - 1);
                break;
            }
        }
        if (index < 0) {
            const tokenMatch = String(message || '').match(/Unexpected (?:token|identifier) ['"]?([^'"\s]+)['"]?/i);
            if (tokenMatch && tokenMatch[1]) index = source.indexOf(tokenMatch[1]);
        }
        if (index < 0 && /unexpected end/i.test(String(message || ''))) index = Math.max(0, source.length - 1);
        if (index < 0) index = 0;
        const before = source.slice(0, index);
        const lastBreak = before.lastIndexOf('\n');
        return {
            line: before.split('\n').length,
            column: index - lastBreak
        };
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
            `:host{all:initial;display:block;position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:${UI_FONT};}`,
            '*,*:before,*:after{box-sizing:border-box;}',
            `#${OVERLAY_ID}{position:fixed;inset:0;z-index:1000007;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.58);pointer-events:auto;color:#0f172a;font-family:${UI_FONT};}`,
            `#${OVERLAY_ID}.is-visible{display:flex;}`,
            `#${OVERLAY_ID} .nd-rule-window{width:min(1280px,calc(100vw - 24px));height:min(840px,calc(100vh - 24px));display:grid;grid-template-rows:auto 1fr;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;box-shadow:0 24px 70px rgba(15,23,42,.38);overflow:hidden;}`,
            `#${OVERLAY_ID}.is-fullscreen .nd-rule-window{width:100vw;height:100vh;border:0;border-radius:0;}`,
            `#${OVERLAY_ID} .nd-rule-header{display:flex;align-items:center;gap:10px;padding:11px 14px;background:linear-gradient(135deg,#111827,#0f766e 56%,#7f1d1d);color:#fff;}`,
            `#${OVERLAY_ID} .nd-rule-title{font-size:15px;font-weight:700;}`,
            `#${OVERLAY_ID} .nd-rule-save-state{font-size:12px;color:#bfdbfe;}`,
            `#${OVERLAY_ID} .nd-rule-spacer{flex:1 1 auto;}`,
            `#${OVERLAY_ID} .nd-rule-header button{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;border-radius:6px;padding:5px 9px;cursor:pointer;}`,
            `#${OVERLAY_ID} .nd-rule-body{display:grid;grid-template-columns:260px minmax(360px,1fr) 300px;min-height:0;}`,
            `#${OVERLAY_ID} .nd-rule-body.sidebar-collapsed{grid-template-columns:38px minmax(360px,1fr) 300px;}`,
            `#${OVERLAY_ID} .nd-rule-body.tools-collapsed{grid-template-columns:260px minmax(360px,1fr) 38px;}`,
            `#${OVERLAY_ID} .nd-rule-body.sidebar-collapsed.tools-collapsed{grid-template-columns:38px minmax(360px,1fr) 38px;}`,
            `#${OVERLAY_ID} .nd-rule-sidebar,#${OVERLAY_ID} .nd-rule-tools{display:grid;grid-template-rows:auto 1fr;border-right:1px solid #dbe3ef;background:#f1f5f9;min-height:0;overflow:hidden;}`,
            `#${OVERLAY_ID} .nd-rule-tools{border-right:0;border-left:1px solid #dbe3ef;}`,
            `#${OVERLAY_ID} .nd-rule-side-header{display:flex;align-items:center;gap:7px;min-height:36px;padding:6px 8px;border-bottom:1px solid #dbe3ef;color:#475569;font-size:11px;font-weight:800;text-transform:uppercase;}`,
            `#${OVERLAY_ID} .nd-rule-side-header span{flex:1 1 auto;}`,
            `#${OVERLAY_ID} .nd-rule-side-header button{width:25px;height:24px;padding:0;line-height:1;text-align:center;}`,
            `#${OVERLAY_ID} .nd-rule-panel{padding:10px;display:grid;gap:9px;align-content:start;min-height:0;overflow:auto;}`,
            `#${OVERLAY_ID} .sidebar-collapsed .nd-rule-sidebar .nd-rule-panel,#${OVERLAY_ID} .tools-collapsed .nd-rule-tools .nd-rule-panel{display:none;}`,
            `#${OVERLAY_ID} .sidebar-collapsed .nd-rule-sidebar .nd-rule-side-header,#${OVERLAY_ID} .tools-collapsed .nd-rule-tools .nd-rule-side-header{height:100%;padding:6px;align-items:flex-start;}`,
            `#${OVERLAY_ID} .sidebar-collapsed .nd-rule-sidebar .nd-rule-side-header span,#${OVERLAY_ID} .tools-collapsed .nd-rule-tools .nd-rule-side-header span{display:none;}`,
            `#${OVERLAY_ID} .nd-rule-main{display:grid;grid-template-rows:auto 1fr auto;min-height:0;background:#fff;}`,
            `#${OVERLAY_ID} .nd-rule-toolbar{display:flex;flex-wrap:wrap;gap:7px;align-items:center;padding:10px;border-bottom:1px solid #e2e8f0;background:#fff;}`,
            `#${OVERLAY_ID} input,#${OVERLAY_ID} textarea{border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:#0f172a;padding:7px 8px;font:13px/1.35 ${UI_FONT};}`,
            `#${OVERLAY_ID} .nd-code-editor{position:relative;min-width:0;min-height:0;overflow:hidden;background:#fff;border-bottom:1px solid #e2e8f0;}`,
            `#${OVERLAY_ID} .nd-code-highlight,#${OVERLAY_ID} .nd-code-input{position:absolute;inset:0;margin:0;padding:10px 12px;width:100%;height:100%;border:0;border-radius:0;overflow:auto;white-space:pre;tab-size:2;font:12px/1.5 ${MONO_FONT};letter-spacing:0;}`,
            `#${OVERLAY_ID} .nd-code-highlight{z-index:1;pointer-events:none;background:#fff;color:#1f2937;}`,
            `#${OVERLAY_ID} .nd-code-highlight code{font:inherit;}`,
            `#${OVERLAY_ID} .nd-code-input{z-index:2;resize:none;background:transparent;color:transparent;-webkit-text-fill-color:transparent;caret-color:#111827;outline:none;}`,
            `#${OVERLAY_ID} .nd-code-input::selection{background:rgba(59,130,246,.28);}`,
            `#${OVERLAY_ID} .nd-code-line{display:block;min-width:max-content;min-height:1.5em;}`,
            `#${OVERLAY_ID} .nd-code-line.has-error{background:rgba(239,68,68,.13);text-decoration:underline wavy #dc2626;text-decoration-thickness:1px;}`,
            `#${OVERLAY_ID} .tok-comment{color:#15803d;font-style:italic;}#${OVERLAY_ID} .tok-string{color:#a31515;}#${OVERLAY_ID} .tok-regex{color:#c2410c;}#${OVERLAY_ID} .tok-keyword{color:#1d4ed8;font-weight:700;}#${OVERLAY_ID} .tok-number{color:#7c3aed;}#${OVERLAY_ID} .tok-literal{color:#0369a1;font-weight:700;}`,
            `#${OVERLAY_ID} .nd-code-find{position:absolute;z-index:4;top:7px;right:16px;display:none;align-items:center;gap:5px;padding:5px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;box-shadow:0 5px 18px rgba(15,23,42,.18);}`,
            `#${OVERLAY_ID} .nd-code-find.is-visible{display:flex;}#${OVERLAY_ID} .nd-code-find input{width:190px;height:29px;padding:4px 7px;font-family:${MONO_FONT};font-size:12px;}#${OVERLAY_ID} .nd-code-find span{min-width:42px;color:#64748b;font-size:11px;text-align:center;}#${OVERLAY_ID} .nd-code-find button{width:28px;height:28px;padding:0;}`,
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
            `#${OVERLAY_ID} .nd-rule-status{padding:9px 10px;background:#f8fafc;border-top:1px solid #e2e8f0;font:12px/1.45 ${MONO_FONT};white-space:pre-wrap;overflow:auto;max-height:120px;color:#334155;}`,
            `#${OVERLAY_ID} .nd-rule-status.ok{color:#166534;background:#f0fdf4;}`,
            `#${OVERLAY_ID} .nd-rule-status.error{color:#991b1b;background:#fff1f2;}`,
            `#${OVERLAY_ID} .nd-rule-section-title{font-weight:800;font-size:12px;color:#334155;letter-spacing:0;}`,
            `#${OVERLAY_ID} .nd-rule-snippets{display:flex;flex-wrap:wrap;gap:6px;}`,
            `#${OVERLAY_ID} .nd-rule-builtins{display:grid;gap:6px;max-height:210px;overflow:auto;}`,
            `#${OVERLAY_ID} .nd-rule-builtins button{text-align:left;font-weight:600;}`,
            `#${OVERLAY_ID} .nd-rule-help{font-size:12px;line-height:1.45;color:#64748b;}`,
            `#${OVERLAY_ID} .nd-rule-empty{padding:10px;border:1px dashed #cbd5e1;border-radius:7px;background:#fff;color:#64748b;font-size:12px;}`,
            '@media (max-width:900px){' +
                `#${OVERLAY_ID} .nd-rule-body,#${OVERLAY_ID} .nd-rule-body.sidebar-collapsed,#${OVERLAY_ID} .nd-rule-body.tools-collapsed,#${OVERLAY_ID} .nd-rule-body.sidebar-collapsed.tools-collapsed{grid-template-columns:1fr;grid-template-rows:180px minmax(320px,1fr) 240px;}` +
                `#${OVERLAY_ID} .nd-rule-body.sidebar-collapsed{grid-template-rows:38px minmax(320px,1fr) 240px;}` +
                `#${OVERLAY_ID} .nd-rule-body.tools-collapsed{grid-template-rows:180px minmax(320px,1fr) 38px;}` +
                `#${OVERLAY_ID} .nd-rule-body.sidebar-collapsed.tools-collapsed{grid-template-rows:38px minmax(320px,1fr) 38px;}` +
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
            '    <button type="button" data-action="toggle-fullscreen" title="Bật hoặc tắt toàn màn hình">Toàn màn hình</button>',
            '    <button type="button" class="nd-rule-close" data-action="close">Đóng</button>',
            '  </div>',
            '  <div class="nd-rule-body">',
            '    <aside class="nd-rule-sidebar"><div class="nd-rule-side-header"><span>Rule tùy chỉnh</span><button type="button" data-action="toggle-sidebar" title="Thu gọn danh sách rule">&lt;</button></div><div class="nd-rule-panel" data-role="sidebar"></div></aside>',
            '    <main class="nd-rule-main" data-role="main"></main>',
            '    <aside class="nd-rule-tools"><div class="nd-rule-side-header"><button type="button" data-action="toggle-tools" title="Thu gọn công cụ">&gt;</button><span>Công cụ</span></div><div class="nd-rule-panel" data-role="tools"></div></aside>',
            '  </div>',
            '</div>'
        ].join('');
        overlay.addEventListener('click', handleOverlayClick);
        overlay.addEventListener('input', handleOverlayInput);
        overlay.addEventListener('change', handleOverlayChange);
        overlay.addEventListener('keydown', handleOverlayKeydown, true);
        overlay.addEventListener('mousedown', stopEditorEventPropagation);
        overlay.addEventListener('mouseup', stopEditorEventPropagation);
        root.appendChild(overlay);
        return overlay;
    }

    function renderAll() {
        const overlay = ensureOverlay();
        renderSidebar(overlay);
        renderMain(overlay);
        renderTools(overlay);
        applyLayoutState(overlay);
    }

    function applyLayoutState(overlay) {
        const body = overlay.querySelector('.nd-rule-body');
        const ui = state.ui || {};
        body.classList.toggle('sidebar-collapsed', Boolean(ui.sidebarCollapsed));
        body.classList.toggle('tools-collapsed', Boolean(ui.toolsCollapsed));
        overlay.classList.toggle('is-fullscreen', Boolean(ui.fullscreen));
        const sidebarButton = overlay.querySelector('[data-action="toggle-sidebar"]');
        const toolsButton = overlay.querySelector('[data-action="toggle-tools"]');
        const fullscreenButton = overlay.querySelector('[data-action="toggle-fullscreen"]');
        if (sidebarButton) {
            sidebarButton.innerHTML = ui.sidebarCollapsed ? '&gt;' : '&lt;';
            sidebarButton.title = ui.sidebarCollapsed ? 'Mở danh sách rule' : 'Thu gọn danh sách rule';
        }
        if (toolsButton) {
            toolsButton.innerHTML = ui.toolsCollapsed ? '&lt;' : '&gt;';
            toolsButton.title = ui.toolsCollapsed ? 'Mở công cụ' : 'Thu gọn công cụ';
        }
        if (fullscreenButton) fullscreenButton.textContent = ui.fullscreen ? 'Thu nhỏ' : 'Toàn màn hình';
    }

    function renderSidebar(overlay, options = {}) {
        const sidebar = overlay.querySelector('[data-role="sidebar"]');
        const query = options.query !== undefined ? options.query : (sidebar.querySelector('[name="rule-search"]')?.value || '');
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
            ? `${!validation.ok && validation.errorLine ? `Dòng ${validation.errorLine}${validation.errorColumn ? `, cột ${validation.errorColumn}` : ''}: ` : ''}${validation.message}${validation.warnings && validation.warnings.length ? `\nCảnh báo:\n- ${validation.warnings.join('\n- ')}` : ''}`
            : 'Chưa kiểm tra.';
        main.innerHTML = [
            '<div class="nd-rule-toolbar">',
            '  <div class="nd-rule-editor-meta">',
            `    <input class="nd-rule-name" name="rule-name" value="${escapeHtml(rule.name || '')}" placeholder="Tên rule">`,
            '    <label class="nd-rule-switch"><input type="checkbox" name="rule-enabled"' + (rule.enabled ? ' checked' : '') + '> Bật</label>',
            '  </div>',
            '  <span class="nd-rule-spacer"></span>',
            '  <button type="button" data-action="validate-rule">Kiểm tra</button>',
            '  <button type="button" data-action="format-code" title="Shift+Alt+F">Format Code</button>',
            '  <button type="button" class="primary" data-action="apply-rules">Áp dụng</button>',
            '  <button type="button" data-action="copy-rule">Copy</button>',
            '  <button type="button" class="danger" data-action="delete-rule">Xóa</button>',
            '</div>',
            '  <div class="nd-code-editor" data-role="code-editor">',
            '    <pre class="nd-code-highlight" data-role="code-highlight" aria-hidden="true"><code></code></pre>',
            `    <textarea class="nd-code-input" name="rule-code" spellcheck="false" wrap="off" aria-label="Code rule">${escapeHtml(rule.code || '')}</textarea>`,
            '    <div class="nd-code-find" data-role="code-find"><input type="search" name="code-find" autocomplete="off" placeholder="Tìm trong rule"><span data-role="find-count">0/0</span><button type="button" data-action="find-previous" title="Kết quả trước">&#8593;</button><button type="button" data-action="find-next" title="Kết quả sau">&#8595;</button><button type="button" data-action="close-find" title="Đóng">x</button></div>',
            '  </div>',
            `<div class="nd-rule-status ${statusClass}" data-role="validation">${escapeHtml(statusText)}</div>`
        ].join('');
        const textarea = main.querySelector('textarea[name="rule-code"]');
        textarea.addEventListener('scroll', () => syncCodeHighlight(textarea));
        syncCodeHighlight(textarea);
    }

    function renderTools(overlay, options = {}) {
        const tools = overlay.querySelector('[data-role="tools"]');
        const builtInSearch = options.query !== undefined ? options.query : (tools.querySelector('[name="builtin-search"]')?.value || '');
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
        } else if (action === 'toggle-fullscreen') {
            state.ui.fullscreen = !state.ui.fullscreen;
            saveState();
            applyLayoutState(overlay);
        } else if (action === 'toggle-sidebar') {
            state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
            saveState();
            applyLayoutState(overlay);
        } else if (action === 'toggle-tools') {
            state.ui.toolsCollapsed = !state.ui.toolsCollapsed;
            saveState();
            applyLayoutState(overlay);
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
        } else if (action === 'format-code') {
            formatActiveCode(button);
        } else if (action === 'find-previous') {
            findInEditor(overlay, -1);
        } else if (action === 'find-next') {
            findInEditor(overlay, 1);
        } else if (action === 'close-find') {
            closeEditorFind(overlay);
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
        if (target.name === 'rule-search') {
            if (event.isComposing) return;
            const caret = getInputCaret(target);
            renderSidebar(event.currentTarget, { query: target.value });
            restoreInputCaret(event.currentTarget, 'rule-search', caret);
            return;
        }
        if (target.name === 'builtin-search') {
            if (event.isComposing) return;
            const caret = getInputCaret(target);
            renderTools(event.currentTarget, { query: target.value });
            restoreInputCaret(event.currentTarget, 'builtin-search', caret);
            return;
        }
        if (target.name === 'code-find') {
            findInEditor(event.currentTarget, 1, true);
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
            syncCodeHighlight(target);
        }
    }

    function stopEditorEventPropagation(event) {
        event.stopPropagation();
    }

    function handleOverlayKeydown(event) {
        const overlay = event.currentTarget;
        const target = event.target;
        const isCodeEditor = target && target.name === 'rule-code';
        const isFindInput = target && target.name === 'code-find';
        const shortcut = event.ctrlKey || event.metaKey;
        event.stopPropagation();

        if (isFindInput) {
            if (event.key === 'Enter') {
                event.preventDefault();
                findInEditor(overlay, event.shiftKey ? -1 : 1);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                closeEditorFind(overlay);
            }
            return;
        }

        if (!isCodeEditor) {
            if (event.key === 'Escape') {
                event.preventDefault();
                overlay.classList.remove('is-visible');
            }
            return;
        }

        if (shortcut && event.key.toLowerCase() === 's') {
            event.preventDefault();
            saveState('Đã lưu');
            return;
        }
        if (shortcut && event.key.toLowerCase() === 'f') {
            event.preventDefault();
            openEditorFind(overlay);
            return;
        }
        if (shortcut && event.key === '/') {
            event.preventDefault();
            toggleLineComments(target);
            return;
        }
        if (event.shiftKey && event.altKey && event.key.toLowerCase() === 'f') {
            event.preventDefault();
            formatActiveCode(overlay.querySelector('[data-action="format-code"]'));
            return;
        }
        if (event.key === 'Tab') {
            event.preventDefault();
            indentEditorSelection(target, event.shiftKey);
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            insertEditorNewline(target);
            return;
        }
        if (!shortcut && !event.altKey && [')', ']', '}', '"', "'", '`'].includes(event.key)
            && target.selectionStart === target.selectionEnd
            && target.value[target.selectionStart] === event.key) {
            event.preventDefault();
            target.selectionStart++;
            target.selectionEnd = target.selectionStart;
            return;
        }
        if (!shortcut && !event.altKey && ['(', '[', '{', '"', "'", '`'].includes(event.key)) {
            event.preventDefault();
            insertEditorPair(target, event.key);
            return;
        }
        if (event.key === 'Escape') {
            const findBox = overlay.querySelector('[data-role="code-find"]');
            if (findBox && findBox.classList.contains('is-visible')) {
                event.preventDefault();
                closeEditorFind(overlay);
            }
        }
    }

    function indentEditorSelection(textarea, outdent = false) {
        const value = textarea.value;
        const selectionStart = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;
        if (selectionStart === selectionEnd && !outdent) {
            setEditorValue(textarea, `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`, selectionStart + 2);
            return;
        }
        const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
        let lineEnd = value.indexOf('\n', selectionEnd);
        if (lineEnd < 0) lineEnd = value.length;
        const selected = value.slice(lineStart, lineEnd);
        let removedFromFirstLine = 0;
        let changed;
        if (outdent) {
            changed = selected.split('\n').map((line, index) => {
                const match = line.match(/^(?: {1,2}|\t)/);
                if (index === 0) removedFromFirstLine = match ? match[0].length : 0;
                return match ? line.slice(match[0].length) : line;
            }).join('\n');
        } else {
            changed = selected.split('\n').map(line => `  ${line}`).join('\n');
        }
        const next = `${value.slice(0, lineStart)}${changed}${value.slice(lineEnd)}`;
        const start = outdent
            ? Math.max(lineStart, selectionStart - removedFromFirstLine)
            : selectionStart + 2;
        const delta = changed.length - selected.length;
        setEditorValue(textarea, next, start, Math.max(start, selectionEnd + delta));
    }

    function insertEditorNewline(textarea) {
        const value = textarea.value;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
        const lineBefore = value.slice(lineStart, start);
        const indent = (lineBefore.match(/^\s*/) || [''])[0];
        const opensBlock = /[{\[]\s*$/.test(lineBefore);
        const closesBlock = /^[}\]]/.test(value.slice(end));
        let insert = `\n${indent}${opensBlock ? '  ' : ''}`;
        let caret = start + insert.length;
        if (opensBlock && closesBlock) insert += `\n${indent}`;
        setEditorValue(textarea, `${value.slice(0, start)}${insert}${value.slice(end)}`, caret);
    }

    function insertEditorPair(textarea, opening) {
        const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };
        const closing = pairs[opening];
        const value = textarea.value;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = value.slice(start, end);
        const next = `${value.slice(0, start)}${opening}${selected}${closing}${value.slice(end)}`;
        setEditorValue(textarea, next, start + 1, end + 1);
    }

    function toggleLineComments(textarea) {
        const value = textarea.value;
        const selectionStart = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;
        const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
        let lineEnd = value.indexOf('\n', selectionEnd);
        if (lineEnd < 0) lineEnd = value.length;
        const selected = value.slice(lineStart, lineEnd);
        const lines = selected.split('\n');
        const uncomment = lines.filter(line => line.trim()).every(line => /^\s*\/\//.test(line));
        const changed = lines.map(line => {
            if (!line.trim()) return line;
            if (uncomment) return line.replace(/^(\s*)\/\/\s?/, '$1');
            return line.replace(/^(\s*)/, '$1// ');
        }).join('\n');
        const next = `${value.slice(0, lineStart)}${changed}${value.slice(lineEnd)}`;
        const startDelta = changed.slice(0, Math.max(0, selectionStart - lineStart)).length
            - selected.slice(0, Math.max(0, selectionStart - lineStart)).length;
        setEditorValue(
            textarea,
            next,
            Math.max(lineStart, selectionStart + startDelta),
            Math.max(lineStart, selectionEnd + changed.length - selected.length)
        );
    }

    function formatActiveCode(button) {
        const root = getUiRoot(false);
        const textarea = root && root.querySelector(`#${OVERLAY_ID} textarea[name="rule-code"]`);
        if (!textarea) return;
        const formatted = formatJavaScript(textarea.value);
        setEditorValue(textarea, formatted, Math.min(textarea.selectionStart, formatted.length));
        textarea.focus();
        flashButton(button, 'Đã format');
    }

    function openEditorFind(overlay) {
        const box = overlay.querySelector('[data-role="code-find"]');
        const input = box && box.querySelector('[name="code-find"]');
        const textarea = overlay.querySelector('textarea[name="rule-code"]');
        if (!box || !input || !textarea) return;
        box.classList.add('is-visible');
        if (!input.value && textarea.selectionStart !== textarea.selectionEnd) {
            input.value = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd).replace(/\n/g, ' ');
        }
        input.focus();
        input.select();
        findInEditor(overlay, 1, true);
    }

    function findInEditor(overlay, direction = 1, reset = false) {
        const box = overlay.querySelector('[data-role="code-find"]');
        const input = box && box.querySelector('[name="code-find"]');
        const count = box && box.querySelector('[data-role="find-count"]');
        const textarea = overlay.querySelector('textarea[name="rule-code"]');
        if (!box || !input || !count || !textarea) return;
        const query = input.value;
        if (!query) {
            count.textContent = '0/0';
            return;
        }
        const haystack = textarea.value.toLocaleLowerCase();
        const needle = query.toLocaleLowerCase();
        const matches = [];
        let offset = 0;
        while (offset <= haystack.length - needle.length) {
            const found = haystack.indexOf(needle, offset);
            if (found < 0) break;
            matches.push(found);
            offset = found + Math.max(1, needle.length);
        }
        if (!matches.length) {
            count.textContent = '0/0';
            return;
        }
        let index;
        if (reset) {
            index = 0;
        } else if (direction < 0) {
            index = -1;
            for (let matchIndex = matches.length - 1; matchIndex >= 0; matchIndex--) {
                if (matches[matchIndex] < textarea.selectionStart) {
                    index = matchIndex;
                    break;
                }
            }
            if (index < 0) index = matches.length - 1;
        } else {
            index = matches.findIndex(position => position >= textarea.selectionEnd);
            if (index < 0) index = 0;
        }
        const position = matches[index];
        const keepFindFocus = input.matches(':focus');
        if (!keepFindFocus) textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(position, position + query.length);
        count.textContent = `${index + 1}/${matches.length}`;
    }

    function closeEditorFind(overlay) {
        const box = overlay.querySelector('[data-role="code-find"]');
        const textarea = overlay.querySelector('textarea[name="rule-code"]');
        if (box) box.classList.remove('is-visible');
        if (textarea) textarea.focus();
    }

    function getInputCaret(input) {
        return {
            value: input.value || '',
            start: Number.isFinite(input.selectionStart) ? input.selectionStart : String(input.value || '').length,
            end: Number.isFinite(input.selectionEnd) ? input.selectionEnd : String(input.value || '').length
        };
    }

    function restoreInputCaret(overlay, name, caret) {
        const input = overlay.querySelector(`[name="${name}"]`);
        if (!input) return;
        input.focus();
        const length = input.value.length;
        const start = Math.min(caret.start, length);
        const end = Math.min(caret.end, length);
        try {
            input.setSelectionRange(start, end);
        } catch (error) {
            // Search inputs may reject selection in unusual browser states.
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
        formatCode: formatJavaScript,
        getSummary,
        getState: () => normalizeState(safeGetValue(STORAGE_KEY, null), activeOptions.currentCustomize || '')
    };

    window.NDRuleEditor = api;
    if (typeof unsafeWindow !== 'undefined') {
        unsafeWindow.NDRuleEditor = api;
    }
}(window, document));
