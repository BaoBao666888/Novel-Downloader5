/*
 * TM LAC Analyzer
 * Pure-JavaScript compatibility port of vBook local Baidu LAC forward pass.
 * The model is downloaded separately, cached in IndexedDB and evaluated in a Web Worker.
 * Baidu LAC is distributed under Apache-2.0: https://github.com/baidu/lac
 */
(function (root, factory) {
    const api = factory(root || globalThis);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.TMLacAnalyzer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    'use strict';

    const VERSION = '1.0.2';
    const MODEL_ID = 'vbook-beta-lac-27136b57';
    const MODEL_URL = 'https://raw.githubusercontent.com/Darkrai9x/vbook-settings/83dacfdd8b4920021122be222c8f2e44cecf0e6b/analyzer.zip';
    const MODEL_SHA256 = '27136b570fc6de18c18e5bf4b7736a4df3f43e0e6a35e2f98db7d9c930710f74';
    const MODEL_MIRRORS = Object.freeze(['https://drive.usercontent.google.com/download?id=1vZb8xBl2r7quVL0CS9IRxIRoJdJYScCb&export=download&confirm=t']);
    const WEIGHTS_BYTES = 31863632;
    const DB_NAME = 'tm_translate_lac_model_v1';
    const DB_VERSION = 1;
    const STORE_NAME = 'model';

    function createCore() {
        'use strict';

        const TAG_COUNT = 59;
        const HIDDEN_SIZE = 128;
        const OUTPUT_SIZE = 256;
        const GATE_SIZE = 384;
        const WEIGHT_COUNTS = [7452672, 98304, 98304, 1536, 196608, 98304, 1536, 15104, 59, 3481];
        const SENTENCE_BOUNDARY = new Set(['\n', '!', '?', '。', '！', '？']);
        const SOFT_BOUNDARY = new Set([',', '，', ';', '；', ':', '：', '、']);

        function splitLines(text) {
            return String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
        }

        function parseModel(bundle) {
            if (!bundle?.weights || bundle.weights.byteLength !== WEIGHT_COUNTS.reduce((sum, count) => sum + count, 0) * 4) {
                throw new Error('File lac_weights.bin sai kích thước.');
            }
            const floats = new Float32Array(bundle.weights);
            let offset = 0;
            const take = count => {
                const value = floats.subarray(offset, offset + count);
                offset += count;
                return value;
            };
            const embedding = take(WEIGHT_COUNTS[0]);
            const gru1Input = take(WEIGHT_COUNTS[1]);
            const gru1Hidden = take(WEIGHT_COUNTS[2]);
            const gru1Bias = take(WEIGHT_COUNTS[3]);
            const gru2Input = take(WEIGHT_COUNTS[4]);
            const gru2Hidden = take(WEIGHT_COUNTS[5]);
            const gru2Bias = take(WEIGHT_COUNTS[6]);
            const linear = take(WEIGHT_COUNTS[7]);
            const linearBias = take(WEIGHT_COUNTS[8]);
            const transitions = take(WEIGHT_COUNTS[9]);

            const tokenIds = new Map();
            const codePointIds = new Int32Array(0x110000);
            codePointIds.fill(-1);
            let oovId = 0;
            for (const line of splitLines(bundle.wordDic)) {
                const tab = line.indexOf('\t');
                if (tab <= 0) continue;
                const id = Number(line.slice(0, tab));
                const token = line.slice(tab + 1);
                if (!Number.isInteger(id) || !token) continue;
                tokenIds.set(token, id);
                if (token === 'OOV') oovId = id;
                const chars = Array.from(token);
                if (chars.length === 1) codePointIds[chars[0].codePointAt(0)] = id;
            }
            for (const line of splitLines(bundle.q2bDic)) {
                const tab = line.indexOf('\t');
                if (tab <= 0) continue;
                const source = line.slice(0, tab);
                const target = line.slice(tab + 1);
                const sourceChars = Array.from(source);
                if (sourceChars.length !== 1) continue;
                codePointIds[sourceChars[0].codePointAt(0)] = tokenIds.get(target) ?? oovId;
            }

            const tags = new Array(TAG_COUNT).fill('n-B');
            for (const line of splitLines(bundle.tagDic)) {
                const tab = line.indexOf('\t');
                if (tab <= 0) continue;
                const id = Number(line.slice(0, tab));
                if (Number.isInteger(id) && id >= 0 && id < TAG_COUNT) tags[id] = line.slice(tab + 1) || 'n-B';
            }
            return {
                embedding,
                gru1Input,
                gru1Hidden,
                gru1Bias,
                gru2Input,
                gru2Hidden,
                gru2Bias,
                linear,
                linearBias,
                transitions,
                codePointIds,
                oovId,
                tags
            };
        }

        function splitSegments(text, maxChars) {
            const source = Array.from(String(text || ''));
            if (!source.length) return [];
            const sentences = [];
            let start = 0;
            for (let index = 0; index < source.length; index++) {
                if (!SENTENCE_BOUNDARY.has(source[index])) continue;
                sentences.push(source.slice(start, index + 1));
                start = index + 1;
            }
            if (start < source.length) sentences.push(source.slice(start));
            const limit = Math.max(64, Math.min(1024, Number(maxChars) || 320));
            const segments = [];
            for (const sentence of sentences) {
                let cursor = 0;
                while (cursor < sentence.length) {
                    let end = Math.min(sentence.length, cursor + limit);
                    if (end < sentence.length) {
                        const floor = cursor + Math.floor(limit * 0.55);
                        for (let index = end - 1; index >= floor; index--) {
                            if (SOFT_BOUNDARY.has(sentence[index])) {
                                end = index + 1;
                                break;
                            }
                        }
                    }
                    segments.push(sentence.slice(cursor, end).join(''));
                    cursor = end;
                }
            }
            return segments.filter(Boolean);
        }

        function dot(weights, weightOffset, vector, vectorOffset, length) {
            let value = 0;
            for (let index = 0; index < length; index++) {
                value += weights[weightOffset + index] * vector[vectorOffset + index];
            }
            return value;
        }

        function sigmoid(value) {
            return 1 / (Math.exp(-value) + 1);
        }

        function runGru(input, count, inputSize, inputWeights, inputOffset, hiddenWeights, hiddenOffset, bias, biasOffset, reverse, output) {
            const projected = new Float32Array(count * GATE_SIZE);
            for (let gate = 0; gate < GATE_SIZE; gate++) {
                const weightRow = inputOffset + gate * inputSize;
                const gateBias = bias[biasOffset + gate];
                for (let position = 0; position < count; position++) {
                    projected[position * GATE_SIZE + gate] = dot(inputWeights, weightRow, input, position * inputSize, inputSize) + gateBias;
                }
            }
            const state = new Float32Array(HIDDEN_SIZE);
            const update = new Float32Array(HIDDEN_SIZE);
            const reset = new Float32Array(HIDDEN_SIZE);
            const candidate = new Float32Array(HIDDEN_SIZE);
            for (let step = 0; step < count; step++) {
                const position = reverse ? count - 1 - step : step;
                const projectedOffset = position * GATE_SIZE;
                for (let unit = 0; unit < HIDDEN_SIZE; unit++) {
                    update[unit] = sigmoid(
                        dot(hiddenWeights, hiddenOffset + unit * HIDDEN_SIZE, state, 0, HIDDEN_SIZE)
                        + projected[projectedOffset + unit]
                        + bias[biasOffset + GATE_SIZE + unit]
                    );
                }
                for (let unit = 0; unit < HIDDEN_SIZE; unit++) {
                    reset[unit] = sigmoid(
                        dot(hiddenWeights, hiddenOffset + (HIDDEN_SIZE + unit) * HIDDEN_SIZE, state, 0, HIDDEN_SIZE)
                        + projected[projectedOffset + HIDDEN_SIZE + unit]
                        + bias[biasOffset + 512 + unit]
                    );
                }
                for (let unit = 0; unit < HIDDEN_SIZE; unit++) {
                    candidate[unit] = Math.tanh(
                        reset[unit] * (
                            dot(hiddenWeights, hiddenOffset + (OUTPUT_SIZE + unit) * HIDDEN_SIZE, state, 0, HIDDEN_SIZE)
                            + bias[biasOffset + 640 + unit]
                        )
                        + projected[projectedOffset + OUTPUT_SIZE + unit]
                    );
                }
                for (let unit = 0; unit < HIDDEN_SIZE; unit++) {
                    const gate = update[unit];
                    state[unit] = gate * state[unit] + (1 - gate) * candidate[unit];
                }
                output.set(state, position * OUTPUT_SIZE + (reverse ? HIDDEN_SIZE : 0));
            }
        }

        function predict(model, text) {
            const chars = Array.from(String(text || ''));
            const count = chars.length;
            if (!count) return [];
            const embedded = new Float32Array(count * HIDDEN_SIZE);
            for (let position = 0; position < count; position++) {
                const codePoint = chars[position].codePointAt(0);
                const id = model.codePointIds[codePoint] >= 0 ? model.codePointIds[codePoint] : model.oovId;
                embedded.set(model.embedding.subarray(id * HIDDEN_SIZE, (id + 1) * HIDDEN_SIZE), position * HIDDEN_SIZE);
            }

            const layer1 = new Float32Array(count * OUTPUT_SIZE);
            runGru(embedded, count, HIDDEN_SIZE, model.gru1Input, 0, model.gru1Hidden, 0, model.gru1Bias, 0, false, layer1);
            runGru(embedded, count, HIDDEN_SIZE, model.gru1Input, 49152, model.gru1Hidden, 49152, model.gru1Bias, 768, true, layer1);
            const layer2 = new Float32Array(count * OUTPUT_SIZE);
            runGru(layer1, count, OUTPUT_SIZE, model.gru2Input, 0, model.gru2Hidden, 0, model.gru2Bias, 0, false, layer2);
            runGru(layer1, count, OUTPUT_SIZE, model.gru2Input, 98304, model.gru2Hidden, 49152, model.gru2Bias, 768, true, layer2);

            const logits = new Float32Array(count * TAG_COUNT);
            for (let position = 0; position < count; position++) {
                const inputBase = position * OUTPUT_SIZE;
                const outputBase = position * TAG_COUNT;
                for (let tag = 0; tag < TAG_COUNT; tag++) {
                    let score = model.linearBias[tag];
                    for (let feature = 0; feature < OUTPUT_SIZE; feature++) {
                        score += layer2[inputBase + feature] * model.linear[feature * TAG_COUNT + tag];
                    }
                    logits[outputBase + tag] = score;
                }
            }

            let previous = logits.slice(0, TAG_COUNT);
            let current = new Float32Array(TAG_COUNT);
            const backPointers = new Uint8Array(Math.max(0, count - 1) * TAG_COUNT);
            for (let position = 1; position < count; position++) {
                const outputBase = position * TAG_COUNT;
                const backBase = (position - 1) * TAG_COUNT;
                for (let tag = 0; tag < TAG_COUNT; tag++) {
                    let bestTag = 0;
                    let bestScore = previous[0] + model.transitions[tag];
                    for (let prior = 1; prior < TAG_COUNT; prior++) {
                        const score = previous[prior] + model.transitions[prior * TAG_COUNT + tag];
                        if (score > bestScore) {
                            bestScore = score;
                            bestTag = prior;
                        }
                    }
                    current[tag] = bestScore + logits[outputBase + tag];
                    backPointers[backBase + tag] = bestTag;
                }
                const swap = previous;
                previous = current;
                current = swap;
            }
            let bestTag = 0;
            for (let tag = 1; tag < TAG_COUNT; tag++) {
                if (previous[tag] > previous[bestTag]) bestTag = tag;
            }
            const tagIds = new Uint8Array(count);
            tagIds[count - 1] = bestTag;
            for (let position = count - 2; position >= 0; position--) {
                tagIds[position] = backPointers[position * TAG_COUNT + tagIds[position + 1]];
            }

            const tokens = [];
            let position = 0;
            while (position < count) {
                const rawTag = model.tags[tagIds[position]] || 'n-B';
                const separator = rawTag.indexOf('-');
                const type = separator >= 0 ? rawTag.slice(0, separator) : rawTag;
                const start = position;
                position++;
                while (position < count && String(model.tags[tagIds[position]] || 'n-B').endsWith('-I')) position++;
                tokens.push({ word: chars.slice(start, position).join(''), type });
            }
            return tokens;
        }

        function analyzeSync(model, text, options) {
            const settings = options || {};
            const segments = splitSegments(text, settings.maxSegmentChars);
            const entities = [];
            for (let index = 0; index < segments.length; index++) {
                const tokens = predict(model, segments[index]);
                for (const token of tokens) {
                    if (token.type === 'PER' || token.type === 'LOC' || token.type === 'ORG') entities.push(token);
                }
                if (typeof settings.onProgress === 'function') settings.onProgress(index + 1, segments.length);
            }
            return entities;
        }

        return Object.freeze({ parseModel, splitSegments, predict, analyzeSync });
    }

    function abortError() {
        const error = new Error('Đã dừng phân tích LAC.');
        error.name = 'AbortError';
        return error;
    }

    function throwIfAborted(signal) {
        if (signal?.aborted) throw abortError();
    }

    function openDb() {
        if (!root.indexedDB) return Promise.reject(new Error('Trình duyệt không hỗ trợ IndexedDB.'));
        return new Promise((resolve, reject) => {
            const request = root.indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('Không mở được kho model LAC.'));
        });
    }

    async function idbGet(key) {
        const db = await openDb();
        try {
            return await new Promise((resolve, reject) => {
                const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error || new Error('Không đọc được model LAC.'));
            });
        } finally {
            db.close();
        }
    }

    async function idbPutBundle(bundle) {
        const db = await openDb();
        try {
            await new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                store.put(bundle, `bundle:${MODEL_ID}`);
                store.put({ id: MODEL_ID, cachedAt: Date.now(), bytes: bundle.weights.byteLength }, 'meta');
                transaction.oncomplete = resolve;
                transaction.onerror = () => reject(transaction.error || new Error('Không lưu được model LAC.'));
                transaction.onabort = () => reject(transaction.error || new Error('Không lưu được model LAC.'));
            });
        } finally {
            db.close();
        }
    }

    async function getCacheStatus() {
        try {
            const meta = await idbGet('meta');
            return {
                cached: meta?.id === MODEL_ID,
                ready: workerReady,
                bytes: Number(meta?.bytes) || 0,
                cachedAt: Number(meta?.cachedAt) || 0,
                modelId: MODEL_ID
            };
        } catch (error) {
            return { cached: false, ready: workerReady, bytes: 0, cachedAt: 0, modelId: MODEL_ID, warning: error?.message || String(error) };
        }
    }

    async function clearCache() {
        terminateWorker();
        if (!root.indexedDB) return;
        await new Promise((resolve, reject) => {
            const request = root.indexedDB.deleteDatabase(DB_NAME);
            request.onsuccess = resolve;
            request.onerror = () => reject(request.error || new Error('Không xóa được model LAC.'));
            request.onblocked = () => reject(new Error('Model LAC đang được tab khác sử dụng.'));
        });
    }

    function findArchiveFile(files, name) {
        const wanted = String(name).toLowerCase();
        for (const [path, bytes] of Object.entries(files || {})) {
            if (String(path).replace(/\\/g, '/').toLowerCase().endsWith(wanted)) return bytes;
        }
        return null;
    }

    function exactArrayBuffer(value) {
        const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || 0);
        if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) return bytes.buffer;
        return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    }

    function decodeText(value) {
        return new TextDecoder('utf-8').decode(value instanceof Uint8Array ? value : new Uint8Array(value || 0));
    }

    function extractBundle(files) {
        const weightsFile = findArchiveFile(files, 'model/lac_weights.bin');
        const wordFile = findArchiveFile(files, 'model/word.dic');
        const tagFile = findArchiveFile(files, 'model/tag.dic');
        const q2bFile = findArchiveFile(files, 'model/q2b.dic');
        if (!weightsFile || !wordFile || !tagFile || !q2bFile) throw new Error('Gói model LAC thiếu file bắt buộc.');
        const weights = exactArrayBuffer(weightsFile);
        if (weights.byteLength !== WEIGHTS_BYTES) throw new Error(`lac_weights.bin sai kích thước (${weights.byteLength}/${WEIGHTS_BYTES} byte).`);
        const wordDic = decodeText(wordFile);
        const tagDic = decodeText(tagFile);
        const q2bDic = decodeText(q2bFile);
        if (!wordDic.includes('\tOOV') || !tagDic.includes('PER-B') || !q2bDic.includes('\t')) throw new Error('Từ điển trong model LAC không hợp lệ.');
        return { id: MODEL_ID, weights, wordDic, tagDic, q2bDic };
    }

    async function sha256Hex(buffer) {
        if (!root.crypto?.subtle?.digest) return '';
        const digest = await root.crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function unzipDefault(buffer) {
        const codec = root.fflate;
        if (!codec?.unzipSync) throw new Error('fflate chưa sẵn sàng để giải nén model LAC.');
        // fflate.unzip creates its own Worker, which some page CSPs block without a callback.
        return codec.unzipSync(new Uint8Array(buffer));
    }

    function workerMain(core) {
        let model = null;
        self.onmessage = event => {
            const message = event.data || {};
            try {
                if (message.type === 'init') {
                    model = core.parseModel(message.bundle);
                    self.postMessage({ id: message.id, type: 'result', result: true });
                    return;
                }
                if (message.type === 'analyze') {
                    if (!model) throw new Error('Model LAC chưa được nạp.');
                    const result = core.analyzeSync(model, message.text, {
                        maxSegmentChars: message.maxSegmentChars,
                        onProgress: (completed, total) => self.postMessage({ id: message.id, type: 'progress', completed, total })
                    });
                    self.postMessage({ id: message.id, type: 'result', result });
                }
            } catch (error) {
                self.postMessage({ id: message.id, type: 'error', error: error?.message || String(error) });
            }
        };
    }

    let worker = null;
    let workerReady = false;
    let workerSequence = 0;
    const pending = new Map();

    function terminateWorker(reason) {
        const error = reason || new Error('Worker LAC đã dừng.');
        try { worker?.terminate?.(); } catch (_) { }
        worker = null;
        workerReady = false;
        for (const task of pending.values()) {
            task.signal?.removeEventListener?.('abort', task.abort);
            clearTimeout(task.timer);
            task.reject(error);
        }
        pending.clear();
    }

    function createWorker() {
        if (typeof root.Worker !== 'function' || typeof root.Blob !== 'function' || !root.URL?.createObjectURL) {
            throw new Error('Trình duyệt không hỗ trợ Web Worker cho LAC local.');
        }
        const source = `'use strict';const core=(${createCore.toString()})();(${workerMain.toString()})(core);`;
        const url = root.URL.createObjectURL(new root.Blob([source], { type: 'text/javascript' }));
        try {
            const instance = new root.Worker(url);
            instance.onmessage = event => {
                const message = event.data || {};
                const task = pending.get(message.id);
                if (!task) return;
                if (message.type === 'progress') {
                    task.onProgress?.({ completed: message.completed, total: message.total });
                    return;
                }
                pending.delete(message.id);
                task.signal?.removeEventListener?.('abort', task.abort);
                clearTimeout(task.timer);
                if (message.type === 'error') task.reject(new Error(message.error || 'LAC local thất bại.'));
                else task.resolve(message.result);
            };
            instance.onerror = event => terminateWorker(new Error(event?.message || 'Worker LAC gặp lỗi.'));
            instance.onmessageerror = () => terminateWorker(new Error('Không đọc được phản hồi Worker LAC.'));
            return instance;
        } finally {
            root.URL.revokeObjectURL(url);
        }
    }

    function sendWorker(type, payload, options) {
        const settings = options || {};
        throwIfAborted(settings.signal);
        if (!worker) worker = createWorker();
        return new Promise((resolve, reject) => {
            const id = ++workerSequence;
            const abort = () => terminateWorker(abortError());
            const timer = type === 'init' ? setTimeout(() => terminateWorker(
                new Error('Worker LAC không khởi tạo được. Kiểm tra CSP hoặc quyền của userscript.')), 20000) : null;
            pending.set(id, { resolve, reject, abort, timer, signal: settings.signal, onProgress: settings.onProgress });
            settings.signal?.addEventListener?.('abort', abort, { once: true });
            try {
                worker.postMessage({ id, type, ...payload }, settings.transfer || []);
            } catch (error) {
                pending.delete(id);
                clearTimeout(timer);
                settings.signal?.removeEventListener?.('abort', abort);
                reject(error);
            }
        });
    }

    async function downloadBundle(options) {
        const settings = options || {};
        if (typeof settings.download !== 'function') throw new Error('Thiếu hàm tải model LAC.');
        let lastError;
        for (const url of [MODEL_URL, ...MODEL_MIRRORS]) {
            throwIfAborted(settings.signal);
            try {
                settings.onProgress?.({ phase: url === MODEL_URL ? 'download' : 'mirror', loaded: 0, total: 0 });
                const buffer = await settings.download({ url, signal: settings.signal,
                    onProgress: progress => settings.onProgress?.({ phase: 'download', ...progress }) });
                throwIfAborted(settings.signal);
                const archive = buffer instanceof ArrayBuffer ? buffer : exactArrayBuffer(buffer);
                settings.onProgress?.({ phase: 'verify', loaded: archive.byteLength, total: archive.byteLength });
                const hash = await sha256Hex(archive);
                if (!hash) throw new Error('LAC cần HTTPS để kiểm tra SHA-256 của model.');
                if (hash !== MODEL_SHA256) throw new Error('Gói model LAC sai mã kiểm tra SHA-256.');
                throwIfAborted(settings.signal);
                settings.onProgress?.({ phase: 'unzip', loaded: 0, total: archive.byteLength });
                const files = await (typeof settings.unzip === 'function' ? settings.unzip(archive) : unzipDefault(archive));
                throwIfAborted(settings.signal);
                return extractBundle(files);
            } catch (error) {
                if (error?.name === 'AbortError') throw error;
                lastError = error;
            }
        }
        throw lastError;
    }

    let ensurePromise = null;
    async function ensureModel(options) {
        const settings = options || {};
        throwIfAborted(settings.signal);
        if (workerReady) return { ready: true, cached: true, modelId: MODEL_ID };
        if (ensurePromise) return ensurePromise;
        ensurePromise = (async () => {
            let bundle = null;
            let fromCache = false;
            let cacheWarning = '';
            try {
                settings.onProgress?.({ phase: 'cache', loaded: 0, total: WEIGHTS_BYTES });
                bundle = await idbGet(`bundle:${MODEL_ID}`);
                fromCache = bundle?.id === MODEL_ID && bundle?.weights?.byteLength === WEIGHTS_BYTES;
            } catch (error) {
                cacheWarning = error?.message || String(error);
            }
            throwIfAborted(settings.signal);
            if (!fromCache) {
                bundle = await downloadBundle(settings);
                settings.onProgress?.({ phase: 'cache-write', loaded: 0, total: bundle.weights.byteLength });
                try {
                    await idbPutBundle(bundle);
                } catch (error) {
                    cacheWarning = `Không cache được model: ${error?.message || error}`;
                }
            }
            throwIfAborted(settings.signal);
            settings.onProgress?.({ phase: 'init', loaded: bundle.weights.byteLength, total: bundle.weights.byteLength });
            const weights = bundle.weights;
            await sendWorker('init', { bundle }, { signal: settings.signal, transfer: [weights] });
            workerReady = true;
            return { ready: true, cached: fromCache || !cacheWarning, downloaded: !fromCache, warning: cacheWarning, modelId: MODEL_ID };
        })();
        try {
            return await ensurePromise;
        } catch (error) {
            terminateWorker(error);
            throw error;
        } finally {
            ensurePromise = null;
        }
    }

    async function analyze(text, options) {
        const settings = options || {};
        await ensureModel(settings);
        throwIfAborted(settings.signal);
        return sendWorker('analyze', {
            text: String(text || ''),
            maxSegmentChars: Math.max(64, Math.min(1024, Number(settings.maxSegmentChars) || 320))
        }, { signal: settings.signal, onProgress: settings.onProgress });
    }

    const core = createCore();
    return Object.freeze({
        VERSION,
        MODEL_ID,
        MODEL_URL,
        MODEL_MIRRORS,
        MODEL_SHA256,
        WEIGHTS_BYTES,
        getCacheStatus,
        clearCache,
        ensureModel,
        analyze,
        extractBundle,
        parseModel: core.parseModel,
        splitSegments: core.splitSegments,
        predict: core.predict,
        analyzeSync: core.analyzeSync,
        terminate: terminateWorker
    });
});
