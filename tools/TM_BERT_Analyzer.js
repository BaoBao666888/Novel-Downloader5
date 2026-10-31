/* TM BERT Mini Analyzer. Model and Transformers.js retain their Apache-2.0 licenses. */
(function (root, factory) {
    const api = factory(root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.TMBertAnalyzer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';
    const VERSION = '1.0.0';
    const MODEL = 'TomatoMTL/bert-mini-finetuned-ner-chinese-onnx';
    const REVISION = '2e6990291be3ec0407ef0d559e8346893b8ff4e9';
    const MODEL_ID = `bert-mini-ner-${REVISION}`;
    const RUNTIME_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
    const MIRROR_URL = 'https://drive.usercontent.google.com/download?id=1ddUiPJeDpa7saoUj2lWvt-VQzpVJuW64&export=download&confirm=t';
    const MIRROR_SHA256 = 'c21a30d4db417fd0cef1e65cf08d176acc32cf28e471b87c344fac025db0cb5e';
    const FILES = Object.freeze([
        { path: 'config.json', bytes: 1041, sha256: '59531bea0d7a9e9b8d0d2c133990cb6fbb66dfd561b2acb1f8a98944cc659cf8' },
        { path: 'tokenizer.json', bytes: 460504, sha256: '90b7637c70d79b2e2d4e6bb7257445c23e3b7558ab6e7ceb5a9b2e0e859b2f9a' },
        { path: 'tokenizer_config.json', bytes: 521, sha256: '3a5b2440d95085545706321f1de315cfbaeeddd204f389a87918e250af92acdc' },
        { path: 'special_tokens_map.json', bytes: 132, sha256: '3c3507f36dff57bce437223db3b3081d1e2b52ec3e56ee55438193ecb2c94dd6' },
        { path: 'vocab.txt', bytes: 130668, sha256: 'f7863b040bae29ac474065729355252248c92d41141c1e09fbf21dd3e593a238' },
        { path: 'onnx/model_quantized.onnx', bytes: 12606755, sha256: '80db3cf7b9edc7d1ba4cc20561a46efda957b1f07a27ac911d31304be8baf5f3' }
    ]);
    const DB_NAME = 'tm_translate_bert_ner_v1';
    let worker = null;
    let workerUrl = '';
    let ready = false;
    let initializing = null;
    let sequence = 0;
    const pending = new Map();

    function abortError() {
        const error = new Error('Đã dừng BERT Mini.');
        error.name = 'AbortError';
        return error;
    }
    function checkAbort(signal) { if (signal?.aborted) throw abortError(); }

    function splitSegments(text, limit = 384, overlap = 24) {
        const chars = Array.from(String(text || ''));
        limit = Math.max(32, Math.min(384, Number(limit) || 384));
        overlap = Math.max(12, Math.min(limit - 1, Number(overlap) || 24));
        const result = [];
        for (let start = 0; start < chars.length;) {
            const end = Math.min(chars.length, start + limit);
            result.push(chars.slice(start, end).join(''));
            if (end === chars.length) break;
            start = end - overlap;
        }
        return result;
    }

    function mergeTokenEntities(tokens) {
        const result = [];
        let current = null;
        const finish = () => {
            if (current) result.push({ word: current.word, type: current.type, confidence: current.score / current.count });
            current = null;
        };
        for (const token of tokens || []) {
            const match = /^(B|I)-(PER|LOC|ORG)$/.exec(String(token.entity || ''));
            const word = String(token.word || '').replace(/^##/, '').replace(/\s+/g, '');
            if (!match || !word || /\[(?:UNK|CLS|SEP|PAD)\]/.test(word)) { finish(); continue; }
            const index = Number(token.index);
            if (!current || match[1] === 'B' || current.type !== match[2] || index !== current.last + 1) {
                finish();
                current = { word: '', type: match[2], score: 0, count: 0, last: index };
            }
            current.word += word;
            current.score += Number(token.score) || 0;
            current.count++;
            current.last = index;
        }
        finish();
        return result;
    }

    async function cacheAccess(mode, callback) {
        if (!root.indexedDB) throw new Error('Không có IndexedDB để cache BERT Mini.');
        const db = await new Promise((resolve, reject) => {
            const request = root.indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => request.result.createObjectStore('models');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        try {
            return await new Promise((resolve, reject) => {
                const transaction = db.transaction('models', mode);
                const request = callback(transaction.objectStore('models'));
                let value;
                if (request) request.onsuccess = () => { value = request.result; };
                transaction.oncomplete = () => resolve(value);
                transaction.onerror = transaction.onabort = () => reject(transaction.error || new Error('Lỗi cache BERT Mini.'));
            });
        } finally { db.close(); }
    }

    async function validateAssets(assets) {
        if (!root.crypto?.subtle) throw new Error('BERT Mini cần HTTPS để kiểm tra SHA-256 của model.');
        for (const file of FILES) {
            const buffer = assets?.[file.path];
            if (buffer?.byteLength !== file.bytes) throw new Error(`File BERT không hợp lệ: ${file.path}`);
            const hash = await root.crypto.subtle.digest('SHA-256', buffer);
            const hex = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
            if (hex !== file.sha256) throw new Error(`Sai SHA-256 BERT: ${file.path}`);
        }
    }

    function terminate(reason) {
        worker?.terminate();
        worker = null;
        ready = false;
        if (workerUrl) root.URL.revokeObjectURL(workerUrl);
        workerUrl = '';
        for (const task of pending.values()) {
            clearTimeout(task.timer);
            task.signal?.removeEventListener('abort', task.abort);
            task.reject(reason || new Error('Worker BERT Mini đã dừng.'));
        }
        pending.clear();
    }

    async function workerMain(model, revision, runtimeUrl, split, merge) {
        let classifier;
        self.onmessage = async event => {
            const message = event.data;
            try {
                if (message.type === 'init') {
                    const { pipeline, env } = await import(runtimeUrl);
                    env.allowLocalModels = false;
                    env.allowRemoteModels = true;
                    env.useBrowserCache = false;
                    env.useFSCache = false;
                    env.useCustomCache = true;
                    env.customCache = {
                        match: async key => {
                            const path = Object.keys(message.assets).find(path => String(key).endsWith('/' + path));
                            return path ? new Response(message.assets[path]) : undefined;
                        },
                        put: async () => {}
                    };
                    env.backends.onnx.wasm.numThreads = 1;
                    env.backends.onnx.wasm.proxy = false;
                    classifier = await pipeline('token-classification', model, {
                        revision, dtype: 'q8', device: 'wasm',
                        progress_callback: progress => self.postMessage({ id: message.id, type: 'progress', phase: 'init', detail: progress.status })
                    });
                } else if (message.type === 'analyze') {
                    if (!classifier) throw new Error('Model BERT chưa được nạp.');
                    const segments = split(message.text);
                    const entities = new Map();
                    for (let index = 0; index < segments.length; index++) {
                        const tokens = await classifier(segments[index]);
                        for (const entity of merge(tokens)) {
                            if (segments[index].includes(entity.word)) entities.set(entity.type + ':' + entity.word, entity);
                        }
                        self.postMessage({ id: message.id, type: 'progress', completed: index + 1, total: segments.length });
                    }
                    self.postMessage({ id: message.id, type: 'result', result: Array.from(entities.values()) });
                    return;
                }
                self.postMessage({ id: message.id, type: 'result', result: true });
            } catch (error) {
                self.postMessage({ id: message.id, type: 'error', error: error?.message || String(error) });
            }
        };
    }

    function send(type, payload, options = {}) {
        checkAbort(options.signal);
        if (!worker) {
            const source = `(${workerMain.toString()})(${JSON.stringify(MODEL)},${JSON.stringify(REVISION)},${JSON.stringify(RUNTIME_URL)},${splitSegments.toString()},${mergeTokenEntities.toString()});`;
            workerUrl = root.URL.createObjectURL(new root.Blob([source], { type: 'text/javascript' }));
            try { worker = new root.Worker(workerUrl); }
            catch (error) { terminate(error); throw error; }
            worker.onerror = event => terminate(new Error(event.message || 'Không chạy được Worker BERT Mini.'));
            worker.onmessageerror = () => terminate(new Error('Phản hồi Worker BERT không hợp lệ.'));
            worker.onmessage = event => {
                const message = event.data;
                const task = pending.get(message.id);
                if (!task) return;
                if (message.type === 'progress') { task.onProgress?.(message); return; }
                clearTimeout(task.timer);
                task.signal?.removeEventListener('abort', task.abort);
                pending.delete(message.id);
                if (message.type === 'error') task.reject(new Error(message.error));
                else task.resolve(message.result);
            };
        }
        return new Promise((resolve, reject) => {
            const id = ++sequence;
            const abort = () => terminate(abortError());
            const timer = setTimeout(() => terminate(new Error('BERT Mini xử lý quá thời gian. Kiểm tra kết nối tải runtime hoặc CSP của trang.')), type === 'init' ? 180000 : 120000);
            pending.set(id, { resolve, reject, abort, timer, signal: options.signal, onProgress: options.onProgress });
            options.signal?.addEventListener('abort', abort, { once: true });
            try { worker.postMessage({ id, type, ...payload }, options.transfer || []); }
            catch (error) { terminate(error); }
        });
    }

    async function ensureModel(options = {}) {
        checkAbort(options.signal);
        if (ready) return { ready: true, cached: true };
        if (initializing) return initializing;
        initializing = (async () => {
            let assets;
            let warning = '';
            let cached = false;
            options.onProgress?.({ phase: 'cache' });
            try {
                assets = await cacheAccess('readonly', store => store.get(MODEL_ID));
                if (assets) { await validateAssets(assets); cached = true; }
            } catch (error) { assets = null; warning = error.message; }
            checkAbort(options.signal);
            if (!assets) {
                if (typeof options.download !== 'function') throw new Error('Thiếu hàm tải model BERT Mini.');
                assets = {};
                const total = FILES.reduce((sum, file) => sum + file.bytes, 0);
                let loaded = 0;
                try {
                    for (const file of FILES) {
                        checkAbort(options.signal);
                        const data = await options.download({
                            url: `https://huggingface.co/${MODEL}/resolve/${REVISION}/${file.path}`,
                            signal: options.signal,
                            onProgress: progress => options.onProgress?.({ phase: 'download', file: file.path, loaded: loaded + (progress.loaded || 0), total })
                        });
                        assets[file.path] = new Uint8Array(data).buffer;
                        loaded += file.bytes;
                    }
                    await validateAssets(assets);
                } catch (error) {
                    if (error?.name === 'AbortError') throw error;
                    checkAbort(options.signal);
                    options.onProgress?.({ phase: 'mirror' });
                    const archive = await options.download({ url: MIRROR_URL, signal: options.signal,
                        onProgress: progress => options.onProgress?.({ phase: 'download', ...progress }) });
                    checkAbort(options.signal);
                    if (!root.crypto?.subtle || !root.fflate?.unzipSync) throw new Error('Thiếu SHA-256 hoặc fflate để kiểm tra mirror BERT.');
                    const digest = await root.crypto.subtle.digest('SHA-256', archive);
                    const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
                    if (hash !== MIRROR_SHA256) throw new Error('ZIP BERT dự phòng sai SHA-256.');
                    const files = root.fflate.unzipSync(new Uint8Array(archive));
                    assets = Object.fromEntries(FILES.map(file => [file.path, files[file.path]?.slice().buffer]));
                }
                options.onProgress?.({ phase: 'verify' });
                await validateAssets(assets);
                checkAbort(options.signal);
                try { await cacheAccess('readwrite', store => store.put(assets, MODEL_ID)); cached = true; }
                catch (error) { warning = `Không cache được BERT Mini: ${error.message}`; }
            }
            options.onProgress?.({ phase: 'init' });
            await send('init', { assets }, { ...options, transfer: Object.values(assets) });
            checkAbort(options.signal);
            ready = true;
            return { ready, cached, warning };
        })();
        try { return await initializing; }
        catch (error) { terminate(error); throw error; }
        finally { initializing = null; }
    }

    async function analyze(text, options = {}) {
        await ensureModel(options);
        return send('analyze', { text: String(text || '') }, options);
    }
    async function getCacheStatus() {
        try {
            const assets = await cacheAccess('readonly', store => store.get(MODEL_ID));
            const cached = FILES.every(file => assets?.[file.path]?.byteLength === file.bytes);
            return { cached, ready, bytes: cached ? FILES.reduce((sum, file) => sum + file.bytes, 0) : 0 };
        } catch (error) { return { cached: false, ready, bytes: 0, warning: error.message }; }
    }
    async function clearCache() {
        if (initializing || pending.size) throw new Error('Hãy dừng tác vụ BERT trước khi xóa model.');
        terminate();
        await cacheAccess('readwrite', store => store.delete(MODEL_ID));
    }
    return Object.freeze({ VERSION, MODEL, REVISION, MODEL_ID, FILES, RUNTIME_URL, MIRROR_URL, MIRROR_SHA256,
        ensureModel, analyze, getCacheStatus, clearCache, terminate, splitSegments, mergeTokenEntities, validateAssets });
});
