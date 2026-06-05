#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.ND_DEBUG_PORT || process.argv[2] || 17888);
const HOST = process.env.ND_DEBUG_HOST || '127.0.0.1';
const MAX_PAYLOAD = 8 * 1024 * 1024;

const clients = new Set();
let nextClientId = 1;

function jsonResponse(res, status, payload) {
    res.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store'
    });
    res.end(JSON.stringify(payload, null, 2));
}

function htmlResponse(res, html) {
    res.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store'
    });
    res.end(html);
}

function jsResponse(res, code) {
    res.writeHead(200, {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-store'
    });
    res.end(code);
}

function getDashboardHtml() {
    return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Novel Downloader Debug Bridge</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#0f172a;color:#e5e7eb;font:14px/1.45 Arial,sans-serif}
header{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#111827;border-bottom:1px solid #334155;position:sticky;top:0;z-index:5}
h1{font-size:17px;margin:0;white-space:nowrap}
input,textarea,button,select{font:13px/1.35 Arial,sans-serif}
input,textarea{border:1px solid #475569;border-radius:6px;background:#020617;color:#f8fafc;padding:7px 8px}
textarea{width:100%;min-height:142px;font-family:Consolas,Menlo,monospace;resize:vertical}
button{border:1px solid #475569;border-radius:6px;background:#1e293b;color:#f8fafc;padding:7px 10px;cursor:pointer;font-weight:700}
button:hover{background:#334155}
button.primary{border-color:#38bdf8;background:#075985}
button.good{border-color:#22c55e;background:#14532d}
button.warn{border-color:#f59e0b;background:#78350f}
.spacer{flex:1}
.status{font-size:12px;color:#cbd5e1}
.status strong{color:#fff}
.token{width:245px;max-width:34vw}
.layout{display:grid;grid-template-columns:360px 1fr;gap:14px;padding:14px;min-height:calc(100vh - 57px)}
.panel{background:#111827;border:1px solid #334155;border-radius:8px;overflow:hidden}
.panel h2{margin:0;padding:10px 12px;background:#1e293b;border-bottom:1px solid #334155;font-size:14px}
.panel-body{display:grid;gap:10px;padding:12px}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.row input{flex:1;min-width:0}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.output,.console{height:calc((100vh - 110px) / 2);overflow:auto;padding:10px;background:#020617;font:12px/1.45 Consolas,Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
.console{border-top:1px solid #334155}
.console-entry{border-bottom:1px solid rgba(51,65,85,.75);padding:6px 4px}
.console-entry.error{background:#2b161a;color:#fecaca}
.console-entry.warn{background:#2a2112;color:#fde68a}
.console-entry.info{background:#122033;color:#bfdbfe}
.meta{color:#94a3b8;font-size:11px;display:block;margin-bottom:2px}
.small{font-size:12px;color:#94a3b8}
label{display:grid;gap:4px;color:#cbd5e1;font-weight:700;font-size:12px}
@media (max-width:900px){.layout{grid-template-columns:1fr}.output,.console{height:42vh}.token{max-width:none;width:100%}header{flex-wrap:wrap}}
</style>
</head>
<body>
<header>
  <h1>Novel Downloader Debug Bridge</h1>
  <span class="status" id="status">Chưa kết nối</span>
  <span class="spacer"></span>
  <input class="token" id="token" placeholder="Token">
  <button id="connect" class="primary">Kết nối dashboard</button>
</header>
<main class="layout">
  <section class="panel">
    <h2>Command</h2>
    <div class="panel-body">
      <div class="row">
        <button data-command="env.snapshot" class="good">Env snapshot</button>
        <button data-command="rule.current">Rule hiện tại</button>
        <button data-command="storage.book">Book</button>
        <button data-command="storage.config">Config</button>
      </div>
      <label>Selector test
        <div class="row"><input id="selector" placeholder=".chapter-list a, #content"><button id="selectorRun">Test</button></div>
      </label>
      <div class="grid2">
        <label>Chapter start<input id="chapterStart" value="0" type="number" min="0"></label>
        <label>Count<input id="chapterCount" value="10" type="number" min="1" max="50"></label>
      </div>
      <div class="row">
        <button id="chapterSample">Xem chương</button>
        <button id="getChapters" class="warn">Chạy getChapters</button>
      </div>
      <label>Deal chapter index
        <div class="row"><input id="dealIndex" value="0" type="number" min="0"><button id="dealRun" class="warn">Chạy deal</button></div>
      </label>
      <label>Request text URL
        <div class="row"><input id="requestUrl" placeholder="https://..."><button id="requestRun">Request</button></div>
      </label>
      <label>Eval JS trong userscript
        <textarea id="evalCode">return {
  url: location.href,
  rule: Storage && Storage.rule && (Storage.rule.siteName || Storage.rule.name),
  chapters: Storage && Storage.book && Storage.book.chapters && Storage.book.chapters.length
};</textarea>
      </label>
      <div class="row">
        <button id="evalRun" class="primary">Run eval</button>
        <button id="clearOutput">Xóa output</button>
        <button id="clearConsole">Xóa console</button>
      </div>
      <div class="small">Server chỉ relay. Code/debug command chạy trong tab userscript thật, nên thấy đúng cookie, DOM, GM API, Rule/Storage/Config.</div>
    </div>
  </section>
  <section class="panel">
    <h2>Output</h2>
    <pre class="output" id="output">Chưa có kết quả.</pre>
    <h2>Console stream</h2>
    <div class="console" id="console"></div>
  </section>
</main>
<script>
(function(){
  var ws = null;
  var pending = {};
  var tokenInput = document.getElementById('token');
  var statusEl = document.getElementById('status');
  var outputEl = document.getElementById('output');
  var consoleEl = document.getElementById('console');
  var params = new URLSearchParams(location.search);
  tokenInput.value = params.get('token') || localStorage.getItem('nd-debug-token') || 'local-debug';

  function setStatus(text) { statusEl.innerHTML = text; }
  function print(value) {
    outputEl.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }
  function appendConsole(entry) {
    var div = document.createElement('div');
    div.className = 'console-entry ' + (entry.type || 'log');
    var time = entry.time ? new Date(entry.time).toLocaleTimeString() : new Date().toLocaleTimeString();
    div.innerHTML = '<span class="meta">' + time + ' ' + String(entry.type || 'LOG').toUpperCase() + '</span>' + (entry.html || escapeHtml(entry.text || ''));
    consoleEl.appendChild(div);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }
  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function(char) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
    });
  }
  function wsUrl() {
    var protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return protocol + '//' + location.host + '/ws?client=dashboard&token=' + encodeURIComponent(tokenInput.value.trim() || 'local-debug');
  }
  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    localStorage.setItem('nd-debug-token', tokenInput.value.trim() || 'local-debug');
    setStatus('Đang kết nối dashboard...');
    ws = new WebSocket(wsUrl());
    ws.addEventListener('open', function(){
      setStatus('<strong>Dashboard đã kết nối.</strong> Đợi userscript bridge.');
      send({ type: 'hello', role: 'dashboard' });
    });
    ws.addEventListener('message', function(event){
      var message;
      try { message = JSON.parse(event.data); } catch (error) { return; }
      if (message.type === 'result') {
        if (pending[message.id]) delete pending[message.id];
        print(message.ok ? message.payload : { ok: false, error: message.error });
      } else if (message.type === 'console.entry') {
        appendConsole(message.payload || {});
      } else if (message.type === 'console.snapshot') {
        consoleEl.innerHTML = '';
        (message.payload && message.payload.entries || []).forEach(appendConsole);
      } else if (message.type === 'server.clients') {
        var userscripts = (message.clients || []).filter(function(client){ return client.role === 'userscript'; }).length;
        var dashboards = (message.clients || []).filter(function(client){ return client.role === 'dashboard'; }).length;
        setStatus('<strong>Token:</strong> ' + escapeHtml(message.token || '') + ' · userscript: ' + userscripts + ' · dashboard: ' + dashboards);
      } else {
        print(message);
      }
    });
    ws.addEventListener('close', function(){
      setStatus('Dashboard đã ngắt kết nối.');
      ws = null;
    });
    ws.addEventListener('error', function(){
      setStatus('Lỗi WebSocket dashboard.');
    });
  }
  function send(message) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      print('Dashboard chưa kết nối server.');
      return false;
    }
    ws.send(JSON.stringify(message));
    return true;
  }
  function command(commandName, payload) {
    var id = 'cmd_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    pending[id] = true;
    print('Đang chạy ' + commandName + '...');
    send({ type: 'command', id: id, command: commandName, payload: payload || {} });
  }

  document.getElementById('connect').addEventListener('click', connect);
  document.querySelectorAll('button[data-command]').forEach(function(button){
    button.addEventListener('click', function(){ command(button.dataset.command); });
  });
  document.getElementById('selectorRun').addEventListener('click', function(){
    command('selector.test', { selector: document.getElementById('selector').value });
  });
  document.getElementById('chapterSample').addEventListener('click', function(){
    command('chapter.sample', {
      start: Number(document.getElementById('chapterStart').value || 0),
      count: Number(document.getElementById('chapterCount').value || 10)
    });
  });
  document.getElementById('getChapters').addEventListener('click', function(){ command('rule.getChapters'); });
  document.getElementById('dealRun').addEventListener('click', function(){
    command('rule.dealChapter', { index: Number(document.getElementById('dealIndex').value || 0), timeout: 60000 });
  });
  document.getElementById('requestRun').addEventListener('click', function(){
    command('request.text', { url: document.getElementById('requestUrl').value, timeout: 60000 });
  });
  document.getElementById('evalRun').addEventListener('click', function(){
    command('eval.js', { code: document.getElementById('evalCode').value, timeout: 60000 });
  });
  document.getElementById('clearOutput').addEventListener('click', function(){ outputEl.textContent = ''; });
  document.getElementById('clearConsole').addEventListener('click', function(){ consoleEl.innerHTML = ''; });
  connect();
}());
</script>
</body>
</html>`;
}

function createFrame(data) {
    const payload = Buffer.from(data);
    if (payload.length < 126) {
        return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
    }
    if (payload.length <= 0xffff) {
        const header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 126;
        header.writeUInt16BE(payload.length, 2);
        return Buffer.concat([header, payload]);
    }
    const header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payload.length), 2);
    return Buffer.concat([header, payload]);
}

function sendWs(client, message) {
    if (!client || client.closed || client.socket.destroyed) return;
    try {
        const text = typeof message === 'string' ? message : JSON.stringify(message);
        client.socket.write(createFrame(text));
    } catch (error) {
        closeClient(client);
    }
}

function closeClient(client) {
    if (!client || client.closed) return;
    client.closed = true;
    clients.delete(client);
    try {
        client.socket.destroy();
    } catch (error) {
        // Ignore close errors.
    }
    broadcastClientList(client.token);
}

function getClientsByToken(token) {
    return Array.from(clients).filter(client => client.token === token && !client.closed);
}

function getClientSummary(token) {
    return getClientsByToken(token).map(client => ({
        id: client.id,
        role: client.role,
        token: client.token,
        page: client.page,
        connectedAt: client.connectedAt
    }));
}

function broadcastClientList(token) {
    if (!token) return;
    const payload = {
        type: 'server.clients',
        token,
        clients: getClientSummary(token),
        time: new Date().toISOString()
    };
    getClientsByToken(token).forEach(client => sendWs(client, payload));
}

function routeMessage(client, rawText) {
    let message = null;
    try {
        message = JSON.parse(rawText);
    } catch (error) {
        sendWs(client, { type: 'server.error', error: 'Invalid JSON' });
        return;
    }
    if (!message || typeof message !== 'object') return;
    if (message.type === 'hello') {
        client.role = message.role || client.role;
        if (message.payload && message.payload.pageUrl) client.page = message.payload.pageUrl;
        sendWs(client, {
            type: 'server.hello',
            id: client.id,
            role: client.role,
            token: client.token,
            time: new Date().toISOString()
        });
        broadcastClientList(client.token);
        return;
    }
    const targetRole = client.role === 'dashboard' ? 'userscript' : 'dashboard';
    getClientsByToken(client.token)
        .filter(target => target.id !== client.id && target.role === targetRole)
        .forEach(target => sendWs(target, Object.assign({}, message, {
            relayedBy: 'nd-debug-server',
            fromRole: client.role
        })));
}

function handleFrameData(client, chunk) {
    client.buffer = Buffer.concat([client.buffer, chunk]);
    while (client.buffer.length >= 2) {
        const first = client.buffer[0];
        const second = client.buffer[1];
        const opcode = first & 0x0f;
        const masked = Boolean(second & 0x80);
        let length = second & 0x7f;
        let offset = 2;
        if (length === 126) {
            if (client.buffer.length < offset + 2) return;
            length = client.buffer.readUInt16BE(offset);
            offset += 2;
        } else if (length === 127) {
            if (client.buffer.length < offset + 8) return;
            const bigLength = client.buffer.readBigUInt64BE(offset);
            if (bigLength > BigInt(MAX_PAYLOAD)) {
                closeClient(client);
                return;
            }
            length = Number(bigLength);
            offset += 8;
        }
        if (length > MAX_PAYLOAD) {
            closeClient(client);
            return;
        }
        const maskLength = masked ? 4 : 0;
        if (client.buffer.length < offset + maskLength + length) return;
        const mask = masked ? client.buffer.slice(offset, offset + 4) : null;
        offset += maskLength;
        const payload = Buffer.from(client.buffer.slice(offset, offset + length));
        client.buffer = client.buffer.slice(offset + length);
        if (masked) {
            for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];
        }
        if (opcode === 0x8) {
            closeClient(client);
            return;
        }
        if (opcode === 0x9) {
            client.socket.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload]));
            continue;
        }
        if (opcode === 0x1) {
            routeMessage(client, payload.toString('utf8'));
        }
    }
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    if (url.pathname === '/' || url.pathname === '/dashboard') {
        htmlResponse(res, getDashboardHtml());
        return;
    }
    if (url.pathname === '/nd-debug-bridge.js') {
        jsResponse(res, fs.readFileSync(path.join(__dirname, 'nd-debug-bridge.js'), 'utf8'));
        return;
    }
    if (url.pathname === '/nd-rule-editor.js') {
        jsResponse(res, fs.readFileSync(path.join(__dirname, '..', 'nd-rule-editor', 'nd-rule-editor.js'), 'utf8'));
        return;
    }
    if (url.pathname === '/health') {
        jsonResponse(res, 200, { ok: true, clients: clients.size });
        return;
    }
    jsonResponse(res, 404, { ok: false, error: 'Not found' });
});

server.on('upgrade', (req, socket) => {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    if (url.pathname !== '/ws') {
        socket.destroy();
        return;
    }
    const key = req.headers['sec-websocket-key'];
    if (!key) {
        socket.destroy();
        return;
    }
    const accept = crypto
        .createHash('sha1')
        .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
        .digest('base64');
    socket.write([
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        '',
        ''
    ].join('\r\n'));

    const client = {
        id: nextClientId++,
        socket,
        role: url.searchParams.get('client') || 'unknown',
        token: url.searchParams.get('token') || 'local-debug',
        page: url.searchParams.get('page') || '',
        connectedAt: new Date().toISOString(),
        buffer: Buffer.alloc(0),
        closed: false
    };
    clients.add(client);
    socket.on('data', chunk => handleFrameData(client, chunk));
    socket.on('close', () => closeClient(client));
    socket.on('error', () => closeClient(client));
    sendWs(client, {
        type: 'server.hello',
        id: client.id,
        role: client.role,
        token: client.token,
        time: new Date().toISOString()
    });
    broadcastClientList(client.token);
});

server.listen(PORT, HOST, () => {
    console.log(`Novel Downloader Debug Bridge server running at http://${HOST}:${PORT}/`);
    console.log('Open Debug Bridge trong userscript, dùng cùng token với dashboard.');
});
