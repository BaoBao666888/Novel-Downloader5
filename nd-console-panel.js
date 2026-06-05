// ==UserScript==
// @name        nd-console-panel
// @version     1.0.3
// @include     *
// ==/UserScript==
/* eslint-env browser */
(function (window, document) {
    'use strict';

    if (window.NDConsole && window.NDConsole.__installed) return;

    const UI_HOST_ID = 'novel-downloader-shadow-host';
    const STYLE_ID = 'ndConsoleStyle';
    const PANEL_ID = 'ndConsolePanel';
    const STORAGE_ENABLED_KEY = 'ndConsolePanel.enabled';
    const MAX_ENTRIES = 500;
    const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug'];
    const TYPE_LABEL = {
        log: 'LOG',
        info: 'INFO',
        warn: 'WARN',
        error: 'ERROR',
        debug: 'DEBUG'
    };

    const entries = [];
    const originalConsole = {};
    const listeners = [];
    const entryListeners = [];
    const consoleObject = window.console || {};
    let enabled = loadEnabled();
    let uiActive = false;
    let hiddenByUser = true;
    let installed = false;

    function loadEnabled() {
        try {
            const value = window.localStorage && window.localStorage.getItem(STORAGE_ENABLED_KEY);
            return value !== '0';
        } catch (error) {
            return true;
        }
    }

    function saveEnabled() {
        try {
            if (window.localStorage) window.localStorage.setItem(STORAGE_ENABLED_KEY, enabled ? '1' : '0');
        } catch (error) {
            // Ignore storage errors; the console panel can still work for this page load.
        }
    }

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
            `#${PANEL_ID}{position:fixed;left:8px;bottom:8px;width:430px;max-width:calc(100vw - 16px);max-height:46vh;display:none;flex-direction:column;z-index:1000003;pointer-events:auto;background:#111827;color:#e5e7eb;border:1px solid #374151;box-shadow:0 12px 28px rgba(0,0,0,.35);font-family:Arial,sans-serif;font-size:12px;line-height:1.35;}`,
            `#${PANEL_ID}.is-visible{display:flex;}`,
            `#${PANEL_ID} button{appearance:none;border:1px solid #4b5563;background:#1f2937;color:#f9fafb;cursor:pointer;font:12px/1.2 Arial,sans-serif;margin:0;padding:4px 8px;border-radius:3px;}`,
            `#${PANEL_ID} button:hover{background:#374151;}`,
            `#${PANEL_ID} button[name="hide"]{color:#fecaca;border-color:#7f1d1d;background:#3f1d1d;font-weight:700;padding:4px 7px;}`,
            `#${PANEL_ID} .nd-console-nav{display:flex;align-items:center;gap:6px;padding:6px;border-bottom:1px solid #374151;background:#0f172a;}`,
            `#${PANEL_ID} .nd-console-title{font-weight:700;color:#f9fafb;white-space:nowrap;}`,
            `#${PANEL_ID} .nd-console-state{color:#9ca3af;font-size:11px;white-space:nowrap;}`,
            `#${PANEL_ID} .nd-console-spacer{flex:1 1 auto;}`,
            `#${PANEL_ID} .nd-console-list{overflow:auto;min-height:56px;max-height:calc(46vh - 39px);font:12px/1.45 Consolas,Menlo,Monaco,"Courier New",monospace;background:#111827;}`,
            `#${PANEL_ID} .nd-console-empty{padding:10px;color:#9ca3af;font-family:Arial,sans-serif;}`,
            `#${PANEL_ID} .nd-console-entry{padding:6px 8px;border-bottom:1px solid rgba(75,85,99,.65);white-space:pre-wrap;overflow-wrap:anywhere;}`,
            `#${PANEL_ID} .nd-console-entry[data-type="error"]{background:#2b161a;color:#fecaca;}`,
            `#${PANEL_ID} .nd-console-entry[data-type="warn"]{background:#2a2112;color:#fde68a;}`,
            `#${PANEL_ID} .nd-console-entry[data-type="info"]{background:#122033;color:#bfdbfe;}`,
            `#${PANEL_ID} .nd-console-entry[data-type="debug"]{color:#c4b5fd;}`,
            `#${PANEL_ID} .nd-console-entry-meta{display:block;margin-bottom:2px;color:#9ca3af;font-size:11px;}`,
            `#${PANEL_ID} .nd-console-entry[data-type="error"] .nd-console-entry-meta{color:#fca5a5;}`,
            `#${PANEL_ID} .nd-console-entry[data-type="warn"] .nd-console-entry-meta{color:#fbbf24;}`
        ].join('\n');
    }

    function ensurePanel() {
        const root = getUiRoot(true);
        if (!root) return null;
        ensureStyle(root);
        let panel = root.querySelector(`#${PANEL_ID}`);
        if (panel) return panel;

        panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.innerHTML = [
            '<div class="nd-console-nav">',
            '  <span class="nd-console-title">Console</span>',
            '  <span class="nd-console-state" data-role="state"></span>',
            '  <span class="nd-console-spacer"></span>',
            '  <button type="button" name="copy">Copy</button>',
            '  <button type="button" name="clear">Xóa</button>',
            '  <button type="button" name="hide">X</button>',
            '</div>',
            '<div class="nd-console-list" data-role="list"></div>'
        ].join('');
        panel.addEventListener('click', handlePanelClick);
        root.appendChild(panel);
        render();
        return panel;
    }

    function handlePanelClick(event) {
        const name = event.target && event.target.getAttribute('name');
        if (name === 'hide') {
            hide();
        } else if (name === 'clear') {
            clear();
        } else if (name === 'copy') {
            copy().then(() => flashButton(event.target, 'Đã copy')).catch(() => flashButton(event.target, 'Lỗi copy'));
        }
    }

    function flashButton(button, text) {
        if (!button) return;
        const oldText = button.textContent;
        button.textContent = text;
        window.setTimeout(() => {
            button.textContent = oldText;
        }, 1000);
    }

    function isVisible() {
        const root = getUiRoot(false);
        const panel = root && root.querySelector(`#${PANEL_ID}`);
        return Boolean(panel && panel.classList.contains('is-visible'));
    }

    function show() {
        if (!uiActive) return;
        const panel = ensurePanel();
        if (!panel) return;
        hiddenByUser = false;
        panel.classList.add('is-visible');
        render();
        emitState();
    }

    function hide() {
        hiddenByUser = true;
        const root = getUiRoot(false);
        const panel = root && root.querySelector(`#${PANEL_ID}`);
        if (!panel) {
            emitState();
            return;
        }
        panel.classList.remove('is-visible');
        emitState();
    }

    function clear() {
        entries.length = 0;
        render();
        emitState();
    }

    function setEnabled(value) {
        enabled = Boolean(value);
        saveEnabled();
        render();
        emitState();
        if (enabled && entries.length) show();
    }

    function setUiActive(value) {
        uiActive = Boolean(value);
        if (!uiActive) {
            hide();
            return;
        }
        render();
        emitState();
    }

    function toggle() {
        setEnabled(!enabled);
        return enabled;
    }

    function formatTime(date) {
        const pad = (value, size = 2) => String(value).padStart(size, '0');
        return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
    }

    function formatArg(value) {
        if (typeof value === 'string') return value;
        if (value instanceof Error) return value.stack || `${value.name}: ${value.message}`;
        if (window.Node && value instanceof window.Node) return formatNode(value);
        if (typeof value === 'function') return value.toString();
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (typeof value === 'symbol') return value.toString();
        if (typeof value === 'bigint') return `${value.toString()}n`;
        if (typeof value !== 'object') return String(value);

        const seen = new WeakSet();
        try {
            const text = JSON.stringify(value, (key, item) => {
                if (typeof item === 'bigint') return `${item.toString()}n`;
                if (!item || typeof item !== 'object') return item;
                if (seen.has(item)) return '[Circular]';
                seen.add(item);
                if (window.Node && item instanceof window.Node) return formatNode(item);
                return item;
            }, 2);
            return text === undefined ? String(value) : text;
        } catch (error) {
            try {
                return String(value);
            } catch (stringError) {
                return Object.prototype.toString.call(value);
            }
        }
    }

    function formatNode(node) {
        if (!node || !node.nodeType) return String(node);
        if (node.nodeType === 3) return `#text ${limitText(node.textContent || '', 120)}`;
        const tag = (node.tagName || node.nodeName || 'node').toLowerCase();
        const id = node.id ? `#${node.id}` : '';
        const className = typeof node.className === 'string' && node.className.trim()
            ? `.${node.className.trim().replace(/\s+/g, '.')}`
            : '';
        return `<${tag}${id}${className}>`;
    }

    function limitText(text, max) {
        const normalized = String(text);
        if (normalized.length <= max) return normalized;
        return `${normalized.slice(0, max)}\n...(${normalized.length - max} ký tự nữa)`;
    }

    function escapeHtml(text) {
        return String(text).replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function escapeAttr(text) {
        return escapeHtml(text).replace(/`/g, '&#96;');
    }

    function sanitizeConsoleStyle(styleText) {
        const allowed = new Set([
            'color',
            'background',
            'background-color',
            'font-weight',
            'font-style',
            'font-size',
            'text-decoration',
            'text-decoration-line',
            'text-transform'
        ]);
        return String(styleText || '')
            .split(';')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => {
                const splitIndex = item.indexOf(':');
                if (splitIndex < 1) return '';
                const property = item.slice(0, splitIndex).trim().toLowerCase();
                const value = item.slice(splitIndex + 1).trim();
                if (!allowed.has(property)) return '';
                if (!value || value.length > 120) return '';
                if (/[{}<>]/.test(value) || /(?:url|expression|javascript|@import)\s*\(/i.test(value)) return '';
                return `${property}: ${value}`;
            })
            .filter(Boolean)
            .join('; ');
    }

    function formatSpecifier(specifier, value) {
        if (specifier === 's') return String(value);
        if (specifier === 'd' || specifier === 'i') {
            const number = parseInt(value, 10);
            return Number.isNaN(number) ? 'NaN' : String(number);
        }
        if (specifier === 'f') {
            const number = parseFloat(value);
            return Number.isNaN(number) ? 'NaN' : String(number);
        }
        return formatArg(value);
    }

    function formatConsoleArgs(argsLike) {
        const args = Array.prototype.slice.call(argsLike);
        const segments = [];
        let text = '';
        let activeStyle = '';

        const append = (value, style = activeStyle) => {
            const valueText = String(value);
            if (!valueText) return;
            text += valueText;
            const last = segments[segments.length - 1];
            if (last && last.style === style) {
                last.text += valueText;
            } else {
                segments.push({ text: valueText, style });
            }
        };

        if (!args.length) return { text: '', html: '' };
        if (typeof args[0] !== 'string') {
            args.forEach((value, index) => {
                if (index > 0) append(' ', '');
                append(formatArg(value), '');
            });
            return {
                text,
                html: segments.map((segment) => escapeHtml(segment.text)).join('')
            };
        }

        const format = args[0];
        let argIndex = 1;
        for (let index = 0; index < format.length; index++) {
            const char = format[index];
            if (char !== '%' || index + 1 >= format.length) {
                append(char);
                continue;
            }
            const specifier = format[++index];
            if (specifier === '%') {
                append('%');
            } else if (specifier === 'c') {
                activeStyle = sanitizeConsoleStyle(argIndex < args.length ? args[argIndex++] : '');
            } else if ('sdifoO'.includes(specifier)) {
                if (argIndex < args.length) {
                    append(formatSpecifier(specifier, args[argIndex++]));
                } else {
                    append(`%${specifier}`);
                }
            } else {
                append(`%${specifier}`);
            }
        }

        while (argIndex < args.length) {
            append(' ', '');
            append(formatArg(args[argIndex++]), '');
        }

        return {
            text,
            html: segments.map((segment) => {
                const content = escapeHtml(segment.text);
                return segment.style
                    ? `<span style="${escapeAttr(segment.style)}">${content}</span>`
                    : content;
            }).join('')
        };
    }

    function addEntry(type, args) {
        if (!enabled) return;
        const normalizedType = TYPE_LABEL[type] ? type : 'log';
        const time = new Date();
        const formatted = formatConsoleArgs(args);
        const text = limitText(formatted.text, 12000);
        entries.push({
            type: normalizedType,
            time,
            text,
            html: text === formatted.text ? formatted.html : escapeHtml(text)
        });
        const entry = entries[entries.length - 1];
        entryListeners.slice().forEach((listener) => {
            try {
                listener(entry);
            } catch (error) {
                // Listener errors should not break console capturing.
            }
        });
        if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
        render();
        if (uiActive && (hiddenByUser || !isVisible())) show();
        emitState();
    }

    function capture(type, argsLike, options = {}) {
        const normalizedType = TYPE_LABEL[type] ? type : 'log';
        const args = Array.prototype.slice.call(argsLike || []);
        if (options.echo !== false) {
            const original = originalConsole[normalizedType] || originalConsole.log;
            try {
                if (typeof original === 'function') original.apply(consoleObject, args);
            } catch (error) {
                // Console capture must never break caller code.
            }
        }
        addEntry(normalizedType, args);
    }

    function render() {
        const root = getUiRoot(false);
        if (!root) return;
        const panel = root.querySelector(`#${PANEL_ID}`);
        if (!panel) return;
        const state = panel.querySelector('[data-role="state"]');
        if (state) {
            state.textContent = enabled
                ? `${entries.length}/${MAX_ENTRIES}`
                : `đang tắt · ${entries.length}/${MAX_ENTRIES}`;
        }
        const list = panel.querySelector('[data-role="list"]');
        if (!list) return;
        const wasNearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 24;
        if (!entries.length) {
            list.innerHTML = '<div class="nd-console-empty">Chưa có log.</div>';
        } else {
            list.innerHTML = entries.map((entry) => [
                `<div class="nd-console-entry" data-type="${entry.type}">`,
                `  <span class="nd-console-entry-meta">${formatTime(entry.time)} ${TYPE_LABEL[entry.type]}</span>`,
                entry.html || escapeHtml(entry.text),
                '</div>'
            ].join('')).join('');
        }
        if (wasNearBottom) list.scrollTop = list.scrollHeight;
    }

    function getText() {
        return entries.map((entry) => `[${formatTime(entry.time)}] ${TYPE_LABEL[entry.type]} ${entry.text}`).join('\n');
    }

    async function copy() {
        const text = getText();
        if (window.navigator && window.navigator.clipboard && window.navigator.clipboard.writeText) {
            try {
                await window.navigator.clipboard.writeText(text);
                return;
            } catch (error) {
                // Fall back below when the Clipboard API is blocked by the browser.
            }
        }
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        (document.body || document.documentElement).appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        textarea.remove();
        if (!copied) throw new Error('Copy failed');
    }

    function emitState() {
        const state = {
            count: entries.length,
            enabled,
            uiActive,
            visible: isVisible()
        };
        listeners.slice().forEach((listener) => {
            try {
                listener(state);
            } catch (error) {
                // Listener errors should not break console capturing.
            }
        });
    }

    function onStateChange(listener) {
        if (typeof listener !== 'function') return function () {};
        listeners.push(listener);
        listener({
            count: entries.length,
            enabled,
            uiActive,
            visible: isVisible()
        });
        return function removeListener() {
            const index = listeners.indexOf(listener);
            if (index >= 0) listeners.splice(index, 1);
        };
    }

    function onEntry(listener) {
        if (typeof listener !== 'function') return function () {};
        entryListeners.push(listener);
        return function removeListener() {
            const index = entryListeners.indexOf(listener);
            if (index >= 0) entryListeners.splice(index, 1);
        };
    }

    function wrapConsole() {
        if (installed) return;
        installed = true;
        CONSOLE_METHODS.forEach((method) => {
            const original = typeof consoleObject[method] === 'function'
                ? consoleObject[method].bind(consoleObject)
                : typeof consoleObject.log === 'function'
                    ? consoleObject.log.bind(consoleObject)
                    : function () {};
            originalConsole[method] = original;
            try {
                consoleObject[method] = function () {
                    original.apply(consoleObject, arguments);
                    addEntry(method, arguments);
                };
            } catch (error) {
                originalConsole[method] = original;
            }
        });
        window.addEventListener('error', (event) => {
            addEntry('error', [
                event.message || 'Uncaught error',
                event.filename ? `${event.filename}:${event.lineno || 0}:${event.colno || 0}` : '',
                event.error || ''
            ]);
        }, true);
        window.addEventListener('unhandledrejection', (event) => {
            addEntry('error', ['Unhandled promise rejection', event.reason || '']);
        }, true);
    }

    const api = {
        __installed: true,
        show,
        hide,
        clear,
        copy,
        toggle,
        setEnabled,
        setUiActive,
        isEnabled: () => enabled,
        isUiActive: () => uiActive,
        isVisible,
        getEntries: () => entries.slice(),
        getText,
        capture,
        onStateChange,
        onEntry
    };

    window.NDConsole = api;
    wrapConsole();
}(window, document));
