// ==UserScript==
// @name        nd-debug-bridge
// @version     1.1.0
// @include     *
// ==/UserScript==
/* eslint-env browser */
/* global GM_getValue GM_setValue GM_xmlhttpRequest GM_openInTab unsafeWindow CryptoJS */
(function (window, document) {
    'use strict';

    if (window.NDDebugBridge && window.NDDebugBridge.__installed) return;

    const VERSION = '1.1.0';
    const UI_HOST_ID = 'novel-downloader-shadow-host';
    const PANEL_ID = 'ndDebugBridgePanel';
    const STYLE_ID = 'ndDebugBridgeStyle';
    const SETTINGS_KEY = 'nd_debug_bridge_settings';
    const DEFAULT_WS_URL = 'ws://127.0.0.1:17888/ws';
    const DEFAULT_DASHBOARD_URL = 'http://127.0.0.1:17888/';
    const COMMAND_TIMEOUT_MS = 30000;
    const MAX_STRING = 20000;
    const MAX_ARRAY = 80;
    const MAX_KEYS = 80;

    let runtimeProvider = null;
    let socket = null;
    let reconnectTimer = null;
    let consoleDetach = null;
    let settings = loadSettings();
    let status = {
        state: 'disconnected',
        message: 'Chưa kết nối',
        url: settings.url,
        token: settings.token,
        connectedAt: ''
    };
    const statusListeners = [];

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
            // Ignore storage errors; debug bridge can still work for this page.
        }
    }

    function createToken() {
        const bytes = new Uint8Array(12);
        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            window.crypto.getRandomValues(bytes);
        } else {
            for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
        }
        return Array.from(bytes).map(value => value.toString(16).padStart(2, '0')).join('');
    }

    function loadSettings() {
        const saved = safeGetValue(SETTINGS_KEY, {}) || {};
        return {
            enabled: Boolean(saved.enabled),
            url: saved.url || DEFAULT_WS_URL,
            token: saved.token || createToken()
        };
    }

    function saveSettings(next = settings) {
        settings = Object.assign({}, settings, next);
        safeSetValue(SETTINGS_KEY, settings);
        status.url = settings.url;
        status.token = settings.token;
        renderPanel();
    }

    function setStatus(state, message) {
        status = Object.assign({}, status, {
            state,
            message: message || state,
            url: settings.url,
            token: settings.token,
            connectedAt: state === 'connected' ? new Date().toISOString() : status.connectedAt
        });
        renderPanel();
        statusListeners.slice().forEach((listener) => {
            try {
                listener(Object.assign({}, status));
            } catch (error) {
                // Listener errors must not affect bridge state.
            }
        });
    }

    function limitText(value, max = MAX_STRING) {
        const text = String(value);
        if (text.length <= max) return text;
        return `${text.slice(0, max)}\n...(${text.length - max} ký tự nữa)`;
    }

    function serialize(value, depth = 0, seen = new WeakSet()) {
        if (value === null || value === undefined) return value;
        if (typeof value === 'string') return limitText(value);
        if (typeof value === 'number' || typeof value === 'boolean') return value;
        if (typeof value === 'bigint') return `${value.toString()}n`;
        if (typeof value === 'symbol') return value.toString();
        if (typeof value === 'function') return `[Function${value.name ? ` ${value.name}` : ''}]`;
        if (value instanceof Error) {
            return {
                name: value.name,
                message: value.message,
                stack: limitText(value.stack || '')
            };
        }
        if (window.Node && value instanceof window.Node) return serializeNode(value);
        if (typeof value !== 'object') return String(value);
        if (seen.has(value)) return '[Circular]';
        if (depth >= 4) return Object.prototype.toString.call(value);
        seen.add(value);
        if (Array.isArray(value)) {
            const result = value.slice(0, MAX_ARRAY).map(item => serialize(item, depth + 1, seen));
            if (value.length > MAX_ARRAY) result.push(`...(${value.length - MAX_ARRAY} item nữa)`);
            seen.delete(value);
            return result;
        }
        const output = {};
        const keys = Object.keys(value).slice(0, MAX_KEYS);
        keys.forEach((key) => {
            try {
                output[key] = serialize(value[key], depth + 1, seen);
            } catch (error) {
                output[key] = `[SerializeError] ${error.message || error}`;
            }
        });
        const totalKeys = Object.keys(value).length;
        if (totalKeys > MAX_KEYS) output.__truncatedKeys = totalKeys - MAX_KEYS;
        seen.delete(value);
        return output;
    }

    function serializeNode(node) {
        if (!node || !node.nodeType) return String(node);
        if (node.nodeType === 3) return `#text ${limitText(node.textContent || '', 200)}`;
        const tag = (node.tagName || node.nodeName || 'node').toLowerCase();
        const id = node.id ? `#${node.id}` : '';
        const className = typeof node.className === 'string' && node.className.trim()
            ? `.${node.className.trim().replace(/\s+/g, '.')}`
            : '';
        return {
            node: `<${tag}${id}${className}>`,
            text: limitText((node.textContent || '').trim(), 500),
            html: limitText(node.outerHTML || node.innerHTML || '', 2000)
        };
    }

    function getRuntimeContext() {
        const provided = typeof runtimeProvider === 'function' ? runtimeProvider() || {} : {};
        return Object.assign({
            window,
            document,
            location: window.location,
            console: window.console,
            unsafeWindow: typeof unsafeWindow !== 'undefined' ? unsafeWindow : window,
            GM_getValue: typeof GM_getValue !== 'undefined' ? GM_getValue : undefined,
            GM_setValue: typeof GM_setValue !== 'undefined' ? GM_setValue : undefined,
            GM_xmlhttpRequest: typeof GM_xmlhttpRequest !== 'undefined' ? GM_xmlhttpRequest : undefined,
            GM_openInTab: typeof GM_openInTab !== 'undefined' ? GM_openInTab : undefined,
            CryptoJS: typeof CryptoJS !== 'undefined' ? CryptoJS : undefined
        }, provided);
    }

    function send(message) {
        if (!socket || socket.readyState !== WebSocket.OPEN) return false;
        try {
            socket.send(JSON.stringify(Object.assign({
                from: 'userscript',
                token: settings.token,
                pageUrl: window.location.href,
                time: new Date().toISOString()
            }, message)));
            return true;
        } catch (error) {
            return false;
        }
    }

    function attachConsoleStream() {
        if (consoleDetach) return;
        const consoleApi = window.NDConsole;
        if (!consoleApi || typeof consoleApi.onEntry !== 'function') return;
        consoleDetach = consoleApi.onEntry((entry) => {
            send({
                type: 'console.entry',
                payload: {
                    type: entry.type,
                    time: entry.time instanceof Date ? entry.time.toISOString() : entry.time,
                    text: entry.text,
                    html: entry.html
                }
            });
        });
    }

    function sendConsoleSnapshot() {
        const consoleApi = window.NDConsole;
        if (!consoleApi || typeof consoleApi.getEntries !== 'function') return;
        const entries = consoleApi.getEntries().slice(-80).map((entry) => ({
            type: entry.type,
            time: entry.time instanceof Date ? entry.time.toISOString() : entry.time,
            text: entry.text,
            html: entry.html
        }));
        send({ type: 'console.snapshot', payload: { entries } });
    }

    function buildWsUrl() {
        const url = new URL(settings.url || DEFAULT_WS_URL);
        url.searchParams.set('client', 'userscript');
        url.searchParams.set('token', settings.token);
        url.searchParams.set('page', window.location.hostname || 'page');
        return url.toString();
    }

    function connect(nextSettings = {}) {
        saveSettings(Object.assign({}, nextSettings, { enabled: true }));
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            return;
        }
        window.clearTimeout(reconnectTimer);
        setStatus('connecting', 'Đang kết nối...');
        try {
            socket = new WebSocket(buildWsUrl());
        } catch (error) {
            setStatus('error', error.message || String(error));
            return;
        }
        socket.addEventListener('open', () => {
            setStatus('connected', 'Đã kết nối');
            attachConsoleStream();
            send({
                type: 'hello',
                role: 'userscript',
                payload: {
                    bridgeVersion: VERSION,
                    pageUrl: window.location.href,
                    title: document.title,
                    host: window.location.host,
                    userAgent: window.navigator.userAgent
                }
            });
            sendConsoleSnapshot();
        });
        socket.addEventListener('message', (event) => {
            handleSocketMessage(event.data);
        });
        socket.addEventListener('close', () => {
            socket = null;
            if (settings.enabled) {
                setStatus('disconnected', 'Mất kết nối, sẽ thử lại...');
                reconnectTimer = window.setTimeout(() => connect(), 2500);
            } else {
                setStatus('disconnected', 'Đã ngắt kết nối');
            }
        });
        socket.addEventListener('error', () => {
            setStatus('error', 'Không kết nối được server local');
        });
    }

    function disconnect() {
        saveSettings({ enabled: false });
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
        if (socket) {
            try {
                socket.close();
            } catch (error) {
                // Ignore close errors.
            }
        }
        socket = null;
        setStatus('disconnected', 'Đã ngắt kết nối');
    }

    async function withTimeout(promise, timeoutMs = COMMAND_TIMEOUT_MS) {
        let timer = null;
        try {
            return await Promise.race([
                promise,
                new Promise((resolve, reject) => {
                    timer = window.setTimeout(() => reject(new Error(`Command timeout sau ${timeoutMs}ms`)), timeoutMs);
                })
            ]);
        } finally {
            window.clearTimeout(timer);
        }
    }

    function summarizeChapter(chapter, index) {
        return {
            index,
            title: chapter && chapter.title || '',
            url: chapter && chapter.url || '',
            volume: chapter && chapter.volume || '',
            vip: Boolean(chapter && chapter.vip),
            hasContent: Boolean(chapter && (chapter.contentRaw || chapter.content)),
            contentLength: chapter ? String(chapter.contentRaw || chapter.content || '').length : 0,
            keys: chapter ? Object.keys(chapter).slice(0, 30) : []
        };
    }

    function buildBookSnapshot(context) {
        const book = context.Storage && context.Storage.book || {};
        const chapters = Array.isArray(book.chapters) ? book.chapters : [];
        return {
            title: book.title || '',
            writer: book.writer || '',
            introLength: String(book.intro || '').length,
            cover: book.cover || '',
            chapterCount: chapters.length,
            loadedCount: chapters.filter(chapter => chapter && (chapter.contentRaw || chapter.content)).length,
            first: chapters.slice(0, 5).map(summarizeChapter),
            last: chapters.slice(-5).map((chapter, offset) => summarizeChapter(chapter, chapters.length - Math.min(5, chapters.length) + offset))
        };
    }

    function buildRuleSnapshot(context) {
        const rule = context.Storage && context.Storage.rule || context.Rule || {};
        const output = {};
        Object.keys(rule || {}).slice(0, MAX_KEYS).forEach((key) => {
            const value = rule[key];
            if (typeof value === 'function') {
                output[key] = `[Function${value.name ? ` ${value.name}` : ''}]`;
            } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                output[key] = value;
            } else if (Array.isArray(value)) {
                output[key] = value.slice(0, 20);
            } else if (value && typeof value === 'object') {
                output[key] = serialize(value, 1);
            }
        });
        return output;
    }

    async function runCommand(command, payload = {}) {
        const context = getRuntimeContext();
        if (command === 'ping') {
            return { pong: true, time: new Date().toISOString() };
        }
        if (command === 'env.snapshot') {
            return {
                bridgeVersion: VERSION,
                url: window.location.href,
                title: document.title,
                host: window.location.host,
                readyState: document.readyState,
                userAgent: window.navigator.userAgent,
                scriptVersion: typeof GM_info !== 'undefined' && GM_info.script ? GM_info.script.version : '',
                hasRuntimeProvider: Boolean(runtimeProvider),
                hasGMXmlhttpRequest: typeof GM_xmlhttpRequest !== 'undefined',
                hasJQuery: Boolean(context.$),
                hasRule: Boolean(context.Rule),
                hasStorage: Boolean(context.Storage),
                currentRule: buildRuleSnapshot(context),
                book: buildBookSnapshot(context)
            };
        }
        if (command === 'bridge.status') {
            return {
                bridgeVersion: VERSION,
                status: Object.assign({}, status),
                settings: Object.assign({}, settings),
                url: window.location.href,
                title: document.title,
                host: window.location.host
            };
        }
        if (command === 'browser.openUrl') {
            const rawUrl = String(payload.url || '').trim();
            if (!rawUrl) throw new Error('Thiếu URL');
            const targetUrl = new URL(rawUrl, window.location.href).href;
            const newTab = payload.newTab !== false;
            if (newTab) {
                if (typeof GM_openInTab === 'function') {
                    const tab = GM_openInTab(targetUrl, {
                        active: payload.active !== false,
                        insert: true,
                        setParent: true
                    });
                    return {
                        opened: true,
                        method: 'GM_openInTab',
                        url: targetUrl,
                        tab: serialize(tab)
                    };
                }
                const opened = window.open(targetUrl, '_blank', 'noopener');
                if (!opened) throw new Error('Browser chặn mở tab mới. Dùng browser.openUrl với newTab=false để chuyển tab hiện tại.');
                return {
                    opened: true,
                    method: 'window.open',
                    url: targetUrl
                };
            }
            window.setTimeout(() => {
                window.location.href = targetUrl;
            }, Math.max(0, Number(payload.delayMs || 150)));
            return {
                navigating: true,
                method: 'location.href',
                url: targetUrl
            };
        }
        if (command === 'browser.reload') {
            window.setTimeout(() => window.location.reload(), Math.max(0, Number(payload.delayMs || 100)));
            return { reloading: true, url: window.location.href };
        }
        if (command === 'selector.test') {
            const selector = String(payload.selector || '').trim();
            if (!selector) throw new Error('Thiếu selector');
            const nodes = Array.from(document.querySelectorAll(selector));
            return {
                selector,
                count: nodes.length,
                samples: nodes.slice(0, 10).map(serializeNode)
            };
        }
        if (command === 'storage.config') {
            return serialize(context.Config || {});
        }
        if (command === 'storage.book') {
            return buildBookSnapshot(context);
        }
        if (command === 'rule.current') {
            return buildRuleSnapshot(context);
        }
        if (command === 'chapter.sample') {
            const book = context.Storage && context.Storage.book || {};
            const chapters = Array.isArray(book.chapters) ? book.chapters : [];
            const start = Math.max(0, Number(payload.start || 0));
            const count = Math.min(50, Math.max(1, Number(payload.count || 10)));
            return {
                total: chapters.length,
                chapters: chapters.slice(start, start + count).map((chapter, offset) => summarizeChapter(chapter, start + offset))
            };
        }
        if (command === 'rule.getChapters') {
            const rule = context.Storage && context.Storage.rule || {};
            if (!rule || typeof rule.getChapters !== 'function') throw new Error('Rule hiện tại không có getChapters');
            const result = await withTimeout(Promise.resolve(rule.getChapters(document, context)), payload.timeout || COMMAND_TIMEOUT_MS);
            const chapters = Array.isArray(result) ? result : [];
            return {
                total: chapters.length,
                sample: chapters.slice(0, 20).map((chapter, index) => summarizeChapter(chapter, index)),
                raw: serialize(result)
            };
        }
        if (command === 'rule.dealChapter') {
            const book = context.Storage && context.Storage.book || {};
            const chapters = Array.isArray(book.chapters) ? book.chapters : [];
            const index = Math.max(0, Math.min(chapters.length - 1, Number(payload.index || 0)));
            const chapter = chapters[index];
            if (!chapter) throw new Error(`Không có chương index ${index}`);
            const rule = context.Storage && context.Storage.rule || {};
            if (!rule || typeof rule.deal !== 'function') throw new Error('Rule hiện tại không có deal');
            const chapterCopy = Object.assign({}, chapter);
            const result = await withTimeout(Promise.resolve(rule.deal(chapterCopy)), payload.timeout || COMMAND_TIMEOUT_MS);
            return {
                index,
                chapter: summarizeChapter(chapter, index),
                result: serialize(result),
                resultLength: typeof result === 'string' ? result.length : JSON.stringify(serialize(result)).length
            };
        }
        if (command === 'request.text') {
            const url = String(payload.url || '').trim();
            if (!url) throw new Error('Thiếu URL');
            const helpers = context.helpers || context.utils || context.Rule && context.Rule.helpers;
            if (!helpers || typeof helpers.requestText !== 'function') throw new Error('Không có helpers.requestText');
            const text = await withTimeout(Promise.resolve(helpers.requestText(url, payload.options || {})), payload.timeout || COMMAND_TIMEOUT_MS);
            return {
                url,
                length: String(text || '').length,
                preview: limitText(text || '', 5000)
            };
        }
        if (command === 'eval.js') {
            const code = String(payload.code || '');
            if (!code.trim()) throw new Error('Thiếu code');
            const names = Object.keys(context).filter(name => /^[A-Za-z_$][\w$]*$/.test(name));
            const values = names.map(name => context[name]);
            const fn = new Function(...names, `"use strict";\nreturn (async function(){\n${code}\n})();`);
            const result = await withTimeout(Promise.resolve(fn(...values)), payload.timeout || COMMAND_TIMEOUT_MS);
            return serialize(result);
        }
        throw new Error(`Command không hỗ trợ: ${command}`);
    }

    async function handleCommand(message) {
        const id = message.id || `cmd_${Date.now()}`;
        try {
            const result = await runCommand(message.command, message.payload || {});
            send({
                type: 'result',
                id,
                ok: true,
                payload: serialize(result),
                replyTo: message.replyTo,
                targetClientId: message.targetClientId
            });
        } catch (error) {
            send({
                type: 'result',
                id,
                ok: false,
                error: serialize(error),
                replyTo: message.replyTo,
                targetClientId: message.targetClientId
            });
        }
    }

    function handleSocketMessage(raw) {
        let message = null;
        try {
            message = JSON.parse(String(raw || ''));
        } catch (error) {
            return;
        }
        if (!message || message.type !== 'command') return;
        handleCommand(message);
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
            `#${PANEL_ID}{position:fixed;inset:0;z-index:1000006;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.56);pointer-events:auto;color:#111827;font-family:Arial,sans-serif;}`,
            `#${PANEL_ID}.is-visible{display:flex;}`,
            `#${PANEL_ID} .nd-debug-window{width:min(620px,calc(100vw - 28px));background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;box-shadow:0 22px 60px rgba(15,23,42,.34);overflow:hidden;}`,
            `#${PANEL_ID} .nd-debug-header{display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(135deg,#111827,#1d4ed8 58%,#7c2d12);color:#fff;}`,
            `#${PANEL_ID} .nd-debug-title{font-size:15px;font-weight:700;}`,
            `#${PANEL_ID} .nd-debug-spacer{flex:1 1 auto;}`,
            `#${PANEL_ID} .nd-debug-close{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;border-radius:6px;padding:4px 8px;cursor:pointer;}`,
            `#${PANEL_ID} .nd-debug-body{display:grid;gap:11px;padding:14px;}`,
            `#${PANEL_ID} label{display:grid;gap:4px;font-size:12px;color:#475569;font-weight:700;}`,
            `#${PANEL_ID} input{width:100%;border:1px solid #cbd5e1;border-radius:6px;padding:7px 8px;font:13px Consolas,Menlo,monospace;color:#0f172a;background:#fff;}`,
            `#${PANEL_ID} .nd-debug-status{padding:10px 11px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:13px;}`,
            `#${PANEL_ID} .nd-debug-status strong{display:inline-block;min-width:82px;}`,
            `#${PANEL_ID} .nd-debug-status[data-state="connected"]{border-color:#86efac;background:#f0fdf4;color:#14532d;}`,
            `#${PANEL_ID} .nd-debug-status[data-state="connecting"]{border-color:#fde68a;background:#fffbeb;color:#92400e;}`,
            `#${PANEL_ID} .nd-debug-status[data-state="error"]{border-color:#fecaca;background:#fff1f2;color:#991b1b;}`,
            `#${PANEL_ID} .nd-debug-actions{display:flex;flex-wrap:wrap;gap:8px;}`,
            `#${PANEL_ID} button{border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#0f172a;padding:7px 10px;cursor:pointer;font-size:12px;font-weight:700;}`,
            `#${PANEL_ID} button:hover{background:#eff6ff;border-color:#93c5fd;}`,
            `#${PANEL_ID} button[data-action="connect"]{background:#ecfdf5;border-color:#86efac;color:#166534;}`,
            `#${PANEL_ID} button[data-action="disconnect"]{background:#fff1f2;border-color:#fecaca;color:#991b1b;}`,
            `#${PANEL_ID} .nd-debug-note{font-size:12px;line-height:1.45;color:#64748b;}`
        ].join('\n');
    }

    function renderPanel() {
        const root = getUiRoot(false);
        const panel = root && root.querySelector(`#${PANEL_ID}`);
        if (!panel) return;
        const statusNode = panel.querySelector('[data-role="status"]');
        if (statusNode) {
            statusNode.dataset.state = status.state;
            statusNode.innerHTML = `<strong>${escapeHtml(status.state)}</strong> ${escapeHtml(status.message)}`;
        }
        const urlInput = panel.querySelector('[name="ws-url"]');
        const tokenInput = panel.querySelector('[name="token"]');
        if (urlInput && document.activeElement !== urlInput) urlInput.value = settings.url;
        if (tokenInput && document.activeElement !== tokenInput) tokenInput.value = settings.token;
    }

    function openDashboard() {
        const url = new URL(DEFAULT_DASHBOARD_URL);
        url.searchParams.set('token', settings.token);
        window.open(url.toString(), '_blank', 'noopener');
    }

    async function copyToken() {
        const text = settings.token;
        if (window.navigator && window.navigator.clipboard && window.navigator.clipboard.writeText) {
            await window.navigator.clipboard.writeText(text);
            return;
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

    function openPanel() {
        const root = getUiRoot(true) || document.body;
        ensureStyle(root);
        let panel = root.querySelector(`#${PANEL_ID}`);
        if (!panel) {
            panel = document.createElement('div');
            panel.id = PANEL_ID;
            panel.innerHTML = [
                '<div class="nd-debug-window" role="dialog" aria-modal="true">',
                '  <div class="nd-debug-header">',
                '    <span class="nd-debug-title">Debug Bridge</span>',
                '    <span class="nd-debug-spacer"></span>',
                '    <button type="button" class="nd-debug-close" data-action="close">Đóng</button>',
                '  </div>',
                '  <div class="nd-debug-body">',
                '    <div class="nd-debug-status" data-role="status"></div>',
                '    <label>WebSocket URL<input name="ws-url" autocomplete="off"></label>',
                '    <label>Token<input name="token" autocomplete="off"></label>',
                '    <div class="nd-debug-actions">',
                '      <button type="button" data-action="connect">Kết nối</button>',
                '      <button type="button" data-action="disconnect">Ngắt</button>',
                '      <button type="button" data-action="dashboard">Mở dashboard</button>',
                '      <button type="button" data-action="copy-token">Copy token</button>',
                '      <button type="button" data-action="new-token">Token mới</button>',
                '    </div>',
                '    <div class="nd-debug-note">Chạy server local bằng <code>node tools/nd-debug-bridge/server.js</code>, mở dashboard rồi dùng cùng token. Command debug sẽ chạy trong môi trường userscript thật của trang hiện tại.</div>',
                '  </div>',
                '</div>'
            ].join('');
            panel.addEventListener('click', async (event) => {
                const button = event.target.closest('button[data-action]');
                if (!button) {
                    if (event.target === panel) panel.classList.remove('is-visible');
                    return;
                }
                const action = button.dataset.action;
                if (action === 'close') {
                    panel.classList.remove('is-visible');
                } else if (action === 'connect') {
                    const nextUrl = panel.querySelector('[name="ws-url"]').value.trim() || DEFAULT_WS_URL;
                    const nextToken = panel.querySelector('[name="token"]').value.trim() || createToken();
                    connect({ url: nextUrl, token: nextToken });
                } else if (action === 'disconnect') {
                    disconnect();
                } else if (action === 'dashboard') {
                    openDashboard();
                } else if (action === 'copy-token') {
                    await copyToken();
                    button.textContent = 'Đã copy';
                    window.setTimeout(() => { button.textContent = 'Copy token'; }, 1000);
                } else if (action === 'new-token') {
                    saveSettings({ token: createToken() });
                }
            });
            root.appendChild(panel);
        }
        renderPanel();
        panel.classList.add('is-visible');
    }

    function setRuntimeProvider(provider) {
        runtimeProvider = typeof provider === 'function' ? provider : null;
        if (socket && socket.readyState === WebSocket.OPEN) {
            send({ type: 'env.changed', payload: { hasRuntimeProvider: Boolean(runtimeProvider) } });
        }
    }

    function onStatusChange(listener) {
        if (typeof listener !== 'function') return function () {};
        statusListeners.push(listener);
        listener(Object.assign({}, status));
        return function removeListener() {
            const index = statusListeners.indexOf(listener);
            if (index >= 0) statusListeners.splice(index, 1);
        };
    }

    const api = {
        __installed: true,
        version: VERSION,
        openPanel,
        connect,
        disconnect,
        setRuntimeProvider,
        onStatusChange,
        getStatus: () => Object.assign({}, status),
        getSettings: () => Object.assign({}, settings),
        isConnected: () => Boolean(socket && socket.readyState === WebSocket.OPEN),
        sendEvent: (type, payload) => send({ type, payload })
    };

    window.NDDebugBridge = api;
    if (typeof unsafeWindow !== 'undefined') {
        unsafeWindow.NDDebugBridge = api;
    }

    window.setTimeout(() => {
        attachConsoleStream();
        if (settings.enabled) connect();
    }, 600);
}(window, document));
