// ==UserScript==
// @name        nd-debug-bridge
// @version     1.3.0
// @include     *
// ==/UserScript==
/* eslint-env browser */
/* global GM_getValue GM_setValue GM_xmlhttpRequest GM_openInTab unsafeWindow CryptoJS */
(function (window, document) {
    'use strict';

    if (window.NDDebugBridge && window.NDDebugBridge.__installed) return;

    const VERSION = '1.3.0';
    const UI_HOST_ID = 'novel-downloader-shadow-host';
    const PANEL_ID = 'ndDebugBridgePanel';
    const APPROVAL_MODAL_ID = 'ndDebugBridgeCodeApproval';
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
    let approvalQueue = Promise.resolve();
    let settings = loadSettings();
    const sessionTrustedOrigins = new Set();
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
            url: saved.url || DEFAULT_WS_URL,
            token: saved.token || createToken(),
            autoConnect: Boolean(saved.autoConnect),
            trustRemoteCode: Boolean(saved.trustRemoteCode)
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
        saveSettings(nextSettings);
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
            if (settings.autoConnect) {
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
        saveSettings({ autoConnect: false });
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

    function normalizeInjectedRule(rule, index = 0) {
        if (!rule || typeof rule !== 'object') throw new Error(`Rule inject #${index + 1} không phải object`);
        rule.url = [].concat(rule.url || []).filter(Boolean);
        rule.chapterUrl = [].concat(rule.chapterUrl || []).filter(Boolean);
        rule.ignoreUrl = [].concat(rule.ignoreUrl || []).filter(Boolean);
        rule.__ndDebugRule = true;
        rule.__ndDebugInjectedAt = new Date().toISOString();
        return rule;
    }

    function evaluateRuleCode(code, context) {
        if (context && typeof context.evaluateRuleCode === 'function') {
            return context.evaluateRuleCode(code);
        }
        const names = Object.keys(context).filter(name => /^[A-Za-z_$][\w$]*$/.test(name));
        const values = names.map(name => context[name]);
        const ruleList = context.Rule && Array.isArray(context.Rule.special) ? context.Rule.special : null;
        const beforeRules = ruleList ? ruleList.slice() : [];
        let result;
        const source = String(code || '').trim();
        if (!source) throw new Error('Thiếu code rule');
        try {
            result = new Function(...names, `"use strict";\nreturn (${source});`)(...values);
        } catch (expressionError) {
            result = new Function(...names, `"use strict";\n${source}`)(...values);
        }
        if (ruleList) {
            const afterRules = ruleList.slice();
            const injectedByCode = afterRules.filter(rule => !beforeRules.includes(rule));
            if (afterRules.length !== beforeRules.length || injectedByCode.length) {
                ruleList.splice(0, ruleList.length, ...beforeRules);
            }
            if ((result === undefined || typeof result === 'number') && injectedByCode.length) {
                result = injectedByCode;
            }
        }
        return result;
    }

    function showEvalToast(context) {
        const toast = window.ndShowToast
            || context && context.toast
            || context && context.helpers && context.helpers.toast;
        if (typeof toast !== 'function') return;
        try {
            toast(`Debug Bridge đang chạy eval JS trên ${window.location.host}`, 'warning', 5000);
        } catch (error) {
            console.warn('[ND Debug Bridge] Không hiển thị được thông báo eval:', error);
        }
    }

    function showCodeApprovalDialog(options = {}) {
        const show = () => new Promise((resolve) => {
            const root = getUiRoot(true) || document.body;
            ensureStyle(root);
            let modal = root.querySelector(`#${APPROVAL_MODAL_ID}`);
            if (!modal) {
                modal = document.createElement('div');
                modal.id = APPROVAL_MODAL_ID;
                modal.innerHTML = [
                    '<section class="nd-debug-approval-window" role="dialog" aria-modal="true">',
                    '  <header data-role="approval-title">Yêu cầu chạy code Debug Bridge</header>',
                    '  <div class="nd-debug-approval-body">',
                    '    <div class="nd-debug-approval-warning" data-role="approval-warning"></div>',
                    '    <div class="nd-debug-approval-meta"><b>Trang:</b> <span data-role="approval-host"></span><br><b>Lệnh:</b> <span data-role="approval-command"></span></div>',
                    '    <pre data-role="approval-code"></pre>',
                    '  </div>',
                    '  <footer>',
                    '    <button type="button" data-action="deny">Từ chối</button>',
                    '    <button type="button" class="session" data-action="trust-session">Tin tưởng trang này trong session</button>',
                    '    <button type="button" class="primary" data-action="allow-once">Cho phép lần này</button>',
                    '  </footer>',
                    '</section>'
                ].join('');
                root.appendChild(modal);
            }

            modal.querySelector('[data-role="approval-title"]').textContent = options.title || 'Yêu cầu chạy code Debug Bridge';
            modal.querySelector('[data-role="approval-warning"]').textContent = options.warning
                || 'Code có thể đọc hoặc thay đổi dữ liệu của trang và userscript. Chỉ tiếp tục nếu bạn nhận ra lệnh này.';
            modal.querySelector('[data-role="approval-host"]').textContent = window.location.origin;
            modal.querySelector('[data-role="approval-command"]').textContent = options.commandName || 'JavaScript';
            modal.querySelector('[data-role="approval-code"]').textContent = options.code || '(không có nội dung code)';
            const sessionButton = modal.querySelector('[data-action="trust-session"]');
            const allowButton = modal.querySelector('[data-action="allow-once"]');
            sessionButton.hidden = options.allowSession === false;
            allowButton.textContent = options.allowLabel || 'Cho phép lần này';

            const cleanup = (action) => {
                modal.removeEventListener('click', onClick);
                modal.classList.remove('is-visible');
                resolve(action);
            };
            const onClick = (event) => {
                const button = event.target.closest('button[data-action]');
                if (button && modal.contains(button)) {
                    cleanup(button.dataset.action);
                } else if (event.target === modal) {
                    cleanup('deny');
                }
            };
            modal.addEventListener('click', onClick);
            modal.classList.add('is-visible');
        });

        const queued = approvalQueue.then(show, show);
        approvalQueue = queued.catch(() => {});
        return queued;
    }

    async function requireRemoteCodeApproval(commandName, code) {
        const origin = window.location.origin;
        if (settings.trustRemoteCode || sessionTrustedOrigins.has(origin)) return true;
        const preview = limitText(String(code || '').trim(), 2000);
        const action = await showCodeApprovalDialog({
            commandName,
            code: preview || '(trống)',
        });
        if (action === 'trust-session') {
            sessionTrustedOrigins.add(origin);
            return true;
        }
        if (action !== 'allow-once') throw new Error(`User từ chối chạy ${commandName} qua Debug Bridge.`);
        return true;
    }

    async function requestGlobalTrustApproval() {
        const action = await showCodeApprovalDialog({
            title: 'Bật tin tưởng code từ Debug Bridge',
            commandName: 'Cài đặt tin tưởng toàn cục',
            warning: 'Sau khi bật, mọi eval JS và code inject rule từ bridge sẽ chạy mà không hỏi lại trên tất cả website. Chỉ bật khi server local và token debug hoàn toàn do bạn kiểm soát.',
            code: 'Bỏ xác nhận cho mọi code JavaScript nhận qua Debug Bridge.',
            allowSession: false,
            allowLabel: 'Bật tin tưởng',
        });
        return action === 'allow-once';
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
        if (command === 'rule.inject') {
            const code = String(payload.code || '');
            await requireRemoteCodeApproval('inject rule', code);
            const mode = payload.mode || 'prepend';
            const result = evaluateRuleCode(code, context);
            const rules = [].concat(result || []).filter(Boolean).map(normalizeInjectedRule);
            if (!rules.length) throw new Error('Code không trả về rule nào.');
            if (!context.Rule || !Array.isArray(context.Rule.special)) throw new Error('Không có Rule.special trong runtime.');
            if (payload.clearPrevious !== false) {
                context.Rule.special = context.Rule.special.filter(rule => !(rule && rule.__ndDebugRule));
            }
            if (mode === 'append') {
                context.Rule.special.push(...rules);
            } else {
                context.Rule.special.unshift(...rules);
            }
            if (payload.activate !== false && context.Storage) {
                context.Storage.rule = null;
                context.Storage.mode = null;
                if (typeof context.init === 'function') {
                    const initResult = context.init();
                    if (initResult && typeof initResult.then === 'function') await initResult;
                }
            }
            return {
                injected: rules.length,
                mode,
                activeRule: buildRuleSnapshot(context),
                activeRuleName: context.Storage && context.Storage.rule && (context.Storage.rule.siteName || context.Storage.rule.name) || '',
                activeMode: context.Storage && context.Storage.mode,
                rules: rules.map(rule => ({
                    siteName: rule.siteName || rule.name || '',
                    url: serialize(rule.url),
                    chapterUrl: serialize(rule.chapterUrl),
                    hasGetChapters: typeof rule.getChapters === 'function',
                    hasDeal: typeof rule.deal === 'function'
                }))
            };
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
            await requireRemoteCodeApproval('eval.js', code);
            showEvalToast(context);
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
            `#${PANEL_ID} .nd-debug-toggle{grid-template-columns:18px minmax(0,1fr);align-items:start;column-gap:8px;padding:9px 10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;cursor:pointer;}`,
            `#${PANEL_ID} .nd-debug-toggle input{width:16px;height:16px;margin:1px 0 0;padding:0;accent-color:#2563eb;}`,
            `#${PANEL_ID} .nd-debug-toggle span{color:#0f172a;font-size:12px;line-height:1.35;}`,
            `#${PANEL_ID} .nd-debug-toggle small{grid-column:2;color:#64748b;font-size:11px;font-weight:400;line-height:1.4;}`,
            `#${PANEL_ID} .nd-debug-toggle.is-danger{border-color:#fecaca;background:#fff7f7;}`,
            `#${PANEL_ID} .nd-debug-toggle.is-danger span{color:#991b1b;}`,
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
            `#${PANEL_ID} .nd-debug-note{font-size:12px;line-height:1.45;color:#64748b;}`,
            `#${APPROVAL_MODAL_ID}{position:fixed;inset:0;z-index:1000015;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.64);pointer-events:auto;color:#111827;font-family:Arial,sans-serif;}`,
            `#${APPROVAL_MODAL_ID}.is-visible{display:flex;}`,
            `#${APPROVAL_MODAL_ID} .nd-debug-approval-window{width:min(680px,calc(100vw - 24px));max-height:calc(100vh - 24px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #fca5a5;border-radius:8px;background:#f8fafc;box-shadow:0 24px 70px rgba(15,23,42,.45);}`,
            `#${APPROVAL_MODAL_ID} header{padding:12px 14px;background:#991b1b;color:#fff;font-size:15px;font-weight:800;line-height:1.35;}`,
            `#${APPROVAL_MODAL_ID} .nd-debug-approval-body{display:grid;gap:10px;overflow:auto;padding:14px;}`,
            `#${APPROVAL_MODAL_ID} .nd-debug-approval-warning{padding:9px 10px;border-left:4px solid #dc2626;background:#fef2f2;color:#7f1d1d;font-size:12px;line-height:1.5;}`,
            `#${APPROVAL_MODAL_ID} .nd-debug-approval-meta{color:#334155;font-size:12px;line-height:1.55;word-break:break-word;}`,
            `#${APPROVAL_MODAL_ID} pre{max-height:260px;margin:0;overflow:auto;border:1px solid #cbd5e1;border-radius:6px;background:#0f172a;color:#e2e8f0;padding:10px;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 Consolas,Menlo,monospace;}`,
            `#${APPROVAL_MODAL_ID} footer{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;padding:10px 12px;border-top:1px solid #cbd5e1;background:#fff;}`,
            `#${APPROVAL_MODAL_ID} button{min-height:34px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:#0f172a;padding:7px 11px;cursor:pointer;font-size:12px;font-weight:800;}`,
            `#${APPROVAL_MODAL_ID} button:hover{background:#f1f5f9;}`,
            `#${APPROVAL_MODAL_ID} button.session{border-color:#d97706;background:#fffbeb;color:#92400e;}`,
            `#${APPROVAL_MODAL_ID} button.primary{border-color:#166534;background:#166534;color:#fff;}`
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
        const autoConnectInput = panel.querySelector('[name="auto-connect"]');
        const trustRemoteCodeInput = panel.querySelector('[name="trust-remote-code"]');
        if (urlInput && document.activeElement !== urlInput) urlInput.value = settings.url;
        if (tokenInput && document.activeElement !== tokenInput) tokenInput.value = settings.token;
        if (autoConnectInput) autoConnectInput.checked = settings.autoConnect;
        if (trustRemoteCodeInput) trustRemoteCodeInput.checked = settings.trustRemoteCode;
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
                '    <label class="nd-debug-toggle"><input type="checkbox" name="auto-connect"><span>Luôn tự kết nối server debug</span><small>Tự nạp bridge và thử kết nối lại khi mở hoặc reload trang. Tắt tùy chọn này để chỉ kết nối thủ công.</small></label>',
                '    <label class="nd-debug-toggle is-danger"><input type="checkbox" name="trust-remote-code"><span>Tin tưởng tất cả code JS chạy qua bridge</span><small>Bỏ bước xác nhận cho eval JS và inject rule. Chỉ bật khi server local và token hoàn toàn do bạn kiểm soát.</small></label>',
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
            panel.addEventListener('change', async (event) => {
                const input = event.target;
                if (!input || input.tagName !== 'INPUT') return;
                if (input.name === 'auto-connect') {
                    const nextUrl = panel.querySelector('[name="ws-url"]').value.trim() || DEFAULT_WS_URL;
                    const nextToken = panel.querySelector('[name="token"]').value.trim() || createToken();
                    saveSettings({
                        url: nextUrl,
                        token: nextToken,
                        autoConnect: input.checked
                    });
                    if (input.checked && (!socket || socket.readyState > WebSocket.OPEN)) {
                        connect();
                    } else if (!input.checked) {
                        window.clearTimeout(reconnectTimer);
                        reconnectTimer = null;
                    }
                } else if (input.name === 'trust-remote-code') {
                    if (input.checked) {
                        const approved = await requestGlobalTrustApproval();
                        if (!approved) {
                            input.checked = false;
                            return;
                        }
                    }
                    saveSettings({ trustRemoteCode: input.checked });
                }
            });
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
        if (settings.autoConnect) connect();
    }, 600);
}(window, document));
