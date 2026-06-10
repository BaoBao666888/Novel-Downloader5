#!/usr/bin/env node
'use strict';

const fs = require('fs');

const DEFAULT_WS_URL = process.env.ND_DEBUG_WS || 'ws://127.0.0.1:17888/ws';
const DEFAULT_TOKEN = process.env.ND_DEBUG_TOKEN || 'local-debug';
const DEFAULT_TIMEOUT = Number(process.env.ND_DEBUG_TIMEOUT || 60000);

function usage(exitCode = 0) {
    const text = `
Novel Downloader Debug Bridge CLI

Usage:
  node tools/nd-debug-bridge/cli.js [options] <command> [args]

Options:
  --token <token>       Token Debug Bridge (hoặc ND_DEBUG_TOKEN)
  --server <ws-url>     WebSocket server, mặc định ${DEFAULT_WS_URL}
  --target <id|text>    Target tab userscript theo id, URL, title hoặc host
  --timeout <ms>        Timeout chờ result, mặc định ${DEFAULT_TIMEOUT}
  --json                In raw JSON cho lệnh clients
  --file <path>         File JS cho lệnh eval
  --wait <ms>           Thời gian đợi tab mới reconnect cho test-rule, mặc định 20000
  --active              browser.openUrl mở tab active
  --inactive            browser.openUrl mở tab inactive

Commands:
  clients                         Liệt kê tab userscript/dashboard đang nối
  snapshot                        env.snapshot
  status                          bridge.status
  rule                            rule.current
  book                            storage.book
  config                          storage.config
  chapters [start] [count]        chapter.sample
  get-chapters                    rule.getChapters
  deal <index>                    rule.dealChapter
  request <url>                   helpers.requestText(url)
  selector <css>                  selector.test
  eval <js>                       Chạy JS trong runtime userscript
  eval --file <path>              Chạy JS từ file
  inject-rule <file>              Inject rule test vào tab target, ưu tiên trước rule gốc
  test-rule <file> <url>          Mở URL, đợi tab mới reconnect, inject rule, snapshot + getChapters
  open <url>                      Mở URL bằng tab debug hiện tại, tab mới tự reconnect nếu setting debug đang bật
  navigate <url>                  Chuyển chính tab target tới URL
  reload                          Reload tab target

Examples:
  ND_DEBUG_TOKEN=abc node tools/nd-debug-bridge/cli.js clients
  node tools/nd-debug-bridge/cli.js --token abc open https://example.com
  node tools/nd-debug-bridge/cli.js --token abc --target alicesw snapshot
  node tools/nd-debug-bridge/cli.js --token abc chapters 100 10
  node tools/nd-debug-bridge/cli.js --token abc test-rule ./tmp/rule.js https://example.com/book/1
  node tools/nd-debug-bridge/cli.js --token abc eval "return location.href"
`.trim();
    (exitCode ? console.error : console.log)(text);
    process.exit(exitCode);
}

function parseArgs(argv) {
    const opts = {
        token: DEFAULT_TOKEN,
        server: DEFAULT_WS_URL,
        target: '',
        timeout: DEFAULT_TIMEOUT,
        json: false,
        file: '',
        wait: Number(process.env.ND_DEBUG_WAIT || 20000),
        active: undefined
    };
    const positional = [];
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '-h' || arg === '--help') usage(0);
        if (arg === '--token') opts.token = argv[++i] || '';
        else if (arg === '--server') opts.server = argv[++i] || '';
        else if (arg === '--target') opts.target = argv[++i] || '';
        else if (arg === '--timeout') opts.timeout = Number(argv[++i] || DEFAULT_TIMEOUT);
        else if (arg === '--json') opts.json = true;
        else if (arg === '--file') opts.file = argv[++i] || '';
        else if (arg === '--wait') opts.wait = Number(argv[++i] || 20000);
        else if (arg === '--active') opts.active = true;
        else if (arg === '--inactive') opts.active = false;
        else if (arg.startsWith('--')) throw new Error(`Option không hỗ trợ: ${arg}`);
        else positional.push(arg);
    }
    opts.command = positional.shift() || '';
    opts.args = positional;
    if (!opts.command) usage(1);
    return opts;
}

function makeWsUrl(serverUrl, token) {
    const url = new URL(serverUrl);
    url.searchParams.set('client', 'dashboard');
    url.searchParams.set('token', token || DEFAULT_TOKEN);
    return url.toString();
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeUrl(value) {
    try {
        const url = new URL(value);
        url.hash = '';
        return url.href;
    } catch (error) {
        return String(value || '').split('#')[0];
    }
}

function connect(opts) {
    if (typeof WebSocket === 'undefined') {
        throw new Error('Node runtime này không có WebSocket global. Dùng Node 20+ hoặc môi trường có WebSocket.');
    }
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(makeWsUrl(opts.server, opts.token));
        const state = {
            clients: [],
            results: new Map()
        };
        const timer = setTimeout(() => reject(new Error('Timeout kết nối Debug Bridge server.')), Math.min(10000, opts.timeout));
        ws.addEventListener('open', () => {
            ws.send(JSON.stringify({ type: 'hello', role: 'dashboard' }));
            clearTimeout(timer);
            resolve({ ws, state });
        });
        ws.addEventListener('message', (event) => {
            let message = null;
            try {
                message = JSON.parse(event.data);
            } catch (error) {
                return;
            }
            if (message.type === 'server.clients') {
                state.clients = message.clients || [];
            } else if (message.type === 'result') {
                const handler = state.results.get(message.id);
                if (handler) handler(message);
            }
        });
        ws.addEventListener('error', () => reject(new Error(`Không kết nối được ${opts.server}`)));
    });
}

function userscriptClients(clients) {
    return (clients || []).filter(client => client && client.role === 'userscript');
}

function findClientByUrl(clients, url) {
    const wanted = normalizeUrl(url);
    let wantedUrl;
    try {
        wantedUrl = new URL(wanted);
    } catch (error) {
        return null;
    }
    const sameHost = userscriptClients(clients).filter((client) => {
        try {
            const page = new URL(client.page || '');
            return page.host === wantedUrl.host;
        } catch (error) {
            return false;
        }
    });
    const exact = sameHost.filter(client => normalizeUrl(client.page || '') === wanted);
    if (exact.length) return exact[exact.length - 1];
    const samePath = sameHost.filter((client) => {
        try {
            const page = new URL(client.page || '');
            return page.pathname === wantedUrl.pathname;
        } catch (error) {
            return false;
        }
    });
    if (samePath.length) return samePath[samePath.length - 1];
    return sameHost[sameHost.length - 1] || null;
}

function formatClient(client) {
    return [
        `#${client.id}`,
        client.role,
        client.host || '',
        client.title || '',
        client.page || ''
    ].filter(Boolean).join(' | ');
}

function resolveTarget(clients, targetText) {
    const userscripts = userscriptClients(clients);
    if (!userscripts.length) throw new Error('Chưa có tab userscript nào nối Debug Bridge.');
    const target = String(targetText || '').trim().toLowerCase();
    if (target) {
        const matches = userscripts.filter((client) => {
            const values = [
                String(client.id || ''),
                client.page || '',
                client.title || '',
                client.host || ''
            ].map(value => String(value).toLowerCase());
            return values.some(value => value.includes(target));
        });
        if (!matches.length) throw new Error(`Không tìm thấy target: ${targetText}`);
        if (matches.length > 1) {
            console.error(`[nd-debug] Target khớp ${matches.length} tab, dùng tab mới nhất: ${formatClient(matches[matches.length - 1])}`);
        }
        return matches[matches.length - 1];
    }
    if (userscripts.length > 1) {
        console.error(`[nd-debug] Có ${userscripts.length} tab userscript, dùng tab mới nhất: ${formatClient(userscripts[userscripts.length - 1])}`);
    }
    return userscripts[userscripts.length - 1];
}

function commandPayload(opts) {
    const args = opts.args;
    const command = opts.command;
    if (command === 'snapshot') return { command: 'env.snapshot', payload: {} };
    if (command === 'status') return { command: 'bridge.status', payload: {} };
    if (command === 'rule') return { command: 'rule.current', payload: {} };
    if (command === 'book') return { command: 'storage.book', payload: {} };
    if (command === 'config') return { command: 'storage.config', payload: {} };
    if (command === 'get-chapters') return { command: 'rule.getChapters', payload: { timeout: opts.timeout } };
    if (command === 'chapters') {
        return {
            command: 'chapter.sample',
            payload: {
                start: Number(args[0] || 0),
                count: Number(args[1] || 10)
            }
        };
    }
    if (command === 'deal') {
        if (!args[0]) throw new Error('Thiếu index cho deal.');
        return {
            command: 'rule.dealChapter',
            payload: {
                index: Number(args[0]),
                timeout: opts.timeout
            }
        };
    }
    if (command === 'request') {
        if (!args[0]) throw new Error('Thiếu URL cho request.');
        return {
            command: 'request.text',
            payload: {
                url: args[0],
                timeout: opts.timeout
            }
        };
    }
    if (command === 'selector') {
        if (!args.length) throw new Error('Thiếu CSS selector.');
        return {
            command: 'selector.test',
            payload: {
                selector: args.join(' ')
            }
        };
    }
    if (command === 'eval') {
        const code = opts.file ? fs.readFileSync(opts.file, 'utf8') : args.join(' ');
        if (!code.trim()) throw new Error('Thiếu JS code hoặc --file.');
        return {
            command: 'eval.js',
            payload: {
                code,
                timeout: opts.timeout
            }
        };
    }
    if (command === 'inject-rule') {
        if (!args[0]) throw new Error('Thiếu file rule cho inject-rule.');
        return {
            command: 'rule.inject',
            payload: {
                code: fs.readFileSync(args[0], 'utf8'),
                timeout: opts.timeout,
                activate: true,
                clearPrevious: true
            }
        };
    }
    if (command === 'open' || command === 'navigate') {
        if (!args[0]) throw new Error(`Thiếu URL cho ${command}.`);
        return {
            command: 'browser.openUrl',
            payload: {
                url: args[0],
                newTab: command === 'open',
                active: opts.active !== undefined ? opts.active : command !== 'open',
                timeout: opts.timeout
            }
        };
    }
    if (command === 'reload') return { command: 'browser.reload', payload: {} };
    throw new Error(`Command không hỗ trợ: ${command}`);
}

async function sendCommand(ws, state, opts, target, command, payload) {
    const id = `cli_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const message = {
        type: 'command',
        id,
        command,
        payload: payload || {},
        targetId: target.id
    };
    const resultPromise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            state.results.delete(id);
            reject(new Error(`Timeout chờ result ${command}.`));
        }, opts.timeout);
        state.results.set(id, (result) => {
            clearTimeout(timer);
            state.results.delete(id);
            resolve(result);
        });
    });
    ws.send(JSON.stringify(message));
    return resultPromise;
}

async function waitForClientByUrl(state, url, timeoutMs, excludedIds = new Set()) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        const candidates = (state.clients || []).filter(client => !excludedIds.has(String(client.id)));
        const client = findClientByUrl(candidates, url);
        if (client) return client;
        await wait(500);
    }
    throw new Error(`Timeout chờ tab mới reconnect: ${url}`);
}

function printClients(clients, json = false) {
    if (json) {
        console.log(JSON.stringify(clients, null, 2));
        return;
    }
    if (!clients.length) {
        console.log('Chưa có client nào.');
        return;
    }
    clients.forEach(client => console.log(formatClient(client)));
}

async function main() {
    const opts = parseArgs(process.argv.slice(2));
    const { ws, state } = await connect(opts);
    await wait(350);
    if (opts.command === 'clients' || opts.command === 'list') {
        printClients(state.clients, opts.json);
        ws.close();
        return;
    }
    const target = resolveTarget(state.clients, opts.target);
    if (opts.command === 'test-rule') {
        const [ruleFile, url] = opts.args;
        if (!ruleFile || !url) throw new Error('Usage: test-rule <file> <url>');
        const code = fs.readFileSync(ruleFile, 'utf8');
        const existingClientIds = new Set((state.clients || []).map(client => String(client.id)));
        const openResult = await sendCommand(ws, state, opts, target, 'browser.openUrl', {
            url,
            newTab: true,
            active: opts.active !== undefined ? opts.active : false,
            timeout: opts.timeout
        });
        if (!openResult.ok) throw new Error(JSON.stringify(openResult.error || openResult));
        const testTarget = await waitForClientByUrl(state, url, opts.wait, existingClientIds);
        const injectResult = await sendCommand(ws, state, opts, testTarget, 'rule.inject', {
            code,
            timeout: opts.timeout,
            activate: true,
            clearPrevious: true
        });
        const snapshotResult = await sendCommand(ws, state, opts, testTarget, 'env.snapshot', {});
        let chaptersResult = null;
        if (injectResult.ok) {
            chaptersResult = await sendCommand(ws, state, opts, testTarget, 'rule.getChapters', { timeout: opts.timeout });
        }
        console.log(JSON.stringify({
            target: testTarget,
            open: openResult.ok ? openResult.payload : { error: openResult.error },
            inject: injectResult.ok ? injectResult.payload : { error: injectResult.error },
            snapshot: snapshotResult.ok ? snapshotResult.payload : { error: snapshotResult.error },
            getChapters: chaptersResult ? (chaptersResult.ok ? chaptersResult.payload : { error: chaptersResult.error }) : null
        }, null, 2));
        ws.close();
        if (!injectResult.ok || !snapshotResult.ok || (chaptersResult && !chaptersResult.ok)) process.exitCode = 1;
        return;
    }
    const { command, payload } = commandPayload(opts);
    const result = await sendCommand(ws, state, opts, target, command, payload);
    if (!result.ok) {
        console.error(JSON.stringify(result.error || result, null, 2));
        process.exitCode = 1;
    } else {
        console.log(JSON.stringify(result.payload, null, 2));
    }
    ws.close();
}

main().catch((error) => {
    console.error(error && error.stack || error && error.message || String(error));
    process.exit(1);
});
