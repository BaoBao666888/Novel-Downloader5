/*
 * TM Name Analyzer
 * Browser-friendly NER helpers adapted from vBook's LAC/TexSmart flow.
 * UI, book storage and Vietnamese suggestions intentionally stay in TM Translate.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.TMNameAnalyzer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const VERSION = '1.2.0';
    const TYPES = Object.freeze({
        PER: 'Nhân danh',
        LOC: 'Địa danh',
        ORG: 'Tổ chức'
    });
    const ENGINES = Object.freeze({
        lac: Object.freeze({ id: 'lac', label: 'LAC Local', available: true, local: true }),
        bert: Object.freeze({ id: 'bert', label: 'BERT Mini Local', available: true, local: true }),
        texsmart: Object.freeze({ id: 'texsmart', label: 'TexSmart', available: true, local: false, maxChars: 6000 }),
        hanlp: Object.freeze({ id: 'hanlp', label: 'HanLP (Thử nghiệm)', available: true, local: false, maxChars: 800 })
    });
    const HAN_REGEX = /\p{Script=Han}/u;

    function abortError() {
        try {
            return new DOMException('Đã dừng phân tích.', 'AbortError');
        } catch (_) {
            const error = new Error('Đã dừng phân tích.');
            error.name = 'AbortError';
            return error;
        }
    }

    function throwIfAborted(signal) {
        if (signal?.aborted) throw abortError();
    }

    function wait(ms, signal) {
        const delay = Math.max(0, Number(ms) || 0);
        if (!delay) {
            throwIfAborted(signal);
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const timer = setTimeout(done, delay);
            function done() {
                signal?.removeEventListener?.('abort', cancel);
                resolve();
            }
            function cancel() {
                clearTimeout(timer);
                signal?.removeEventListener?.('abort', cancel);
                reject(abortError());
            }
            if (signal?.aborted) cancel();
            else signal?.addEventListener?.('abort', cancel, { once: true });
        });
    }

    function normalizeInput(text) {
        return String(text || '')
            .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '\n')
            .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/[\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u206f\ufeff]/gi, '')
            .replace(/[ \t\u3000]+/g, '')
            .replace(/\n{2,}/g, '\n')
            .trim();
    }

    function splitText(text, maxChars = 6000, maxSentences = Infinity) {
        const chars = Array.from(normalizeInput(text));
        const limit = Math.max(1, Math.min(12000, Number(maxChars) || 6000));
        if (!chars.length) return [];
        const chunks = [];
        let cursor = 0;
        while (cursor < chars.length) {
            let end = Math.min(chars.length, cursor + limit);
            if (end < chars.length) {
                const floor = cursor + Math.floor(limit * 0.55);
                const window = chars.slice(floor, end);
                let boundary = -1;
                window.forEach((char, index) => { if (/[。！？!?；;\n]/.test(char)) boundary = index; });
                if (boundary >= 0) end = floor + boundary + 1;
            }
            // Also stay below HanLP's sentence-count limit for short, punctuation-heavy input.
            let sentences = 0;
            for (let i = cursor; i < end; i++) {
                if (/[。！？!?\n]/.test(chars[i]) && ++sentences === maxSentences) { end = i + 1; break; }
            }
            chunks.push(chars.slice(cursor, end).join(''));
            cursor = end;
        }
        return chunks.filter(Boolean);
    }

    function normalizeType(type) {
        const value = String(type || '').trim().replace(/^[BIES]-/i, '').toLowerCase();
        if (!value) return '';
        if (value === 'per' || value === 'person' || value.startsWith('person.')) return 'PER';
        if (value === 'loc' || value === 'location' || value.startsWith('loc.')) return 'LOC';
        if (value === 'org' || value === 'organization' || value === 'facility' || value.startsWith('org.')) return 'ORG';
        return '';
    }

    function cleanWord(word) {
        return String(word || '').replace(/[\s\u3000]+/g, '').trim();
    }

    function normalizeEntity(word, type, engine, confidence = null) {
        const normalizedWord = cleanWord(word);
        const normalizedType = normalizeType(type);
        if (!normalizedWord || !normalizedType || !HAN_REGEX.test(normalizedWord)) return null;
        return {
            word: normalizedWord,
            type: normalizedType,
            engine,
            confidence: confidence !== null && confidence !== '' && Number.isFinite(Number(confidence))
                ? Number(confidence)
                : null
        };
    }

    function makeTexSmartRequest(text) {
        return {
            method: 'POST',
            url: 'https://texsmart.qq.com/api/',
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                str: String(text || ''),
                options: {
                    text_norm: { restore_case: true },
                    input_spec: { lang: 'auto' },
                    word_seg: { person_as_one_word: true },
                    pos_tagging: { enable: true, alg: 'dnn' },
                    ner: { enable: true, alg: 'fine.std', entity_linking: false },
                    fnr: { enable: true },
                    syntactic_parsing: { enable: false },
                    srl: { enable: false }
                }
            }),
            timeout: 30000
        };
    }

    function asJson(payload) {
        if (payload && typeof payload === 'object') return payload;
        const text = String(payload || '').replace(/^\uFEFF/, '').trim();
        if (!text || !/^[\[{]/.test(text)) throw new Error('Engine không trả JSON hợp lệ.');
        return JSON.parse(text);
    }

    function makeHanlpRequest(text, options = {}) {
        const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
        const key = String(options.apiKey || '').trim();
        if (key) headers.Authorization = `Basic ${key}`;
        return { method: 'POST', url: 'https://www.hanlp.com/api/parse', headers,
            body: JSON.stringify({ text: String(text || ''), tasks: ['ner/msra'], language: 'zh' }), timeout: 60000 };
    }

    function parseHanlp(payload) {
        const data = asJson(payload);
        if (data.error || data.detail) throw new Error('HanLP từ chối yêu cầu hoặc hết quota.');
        const lists = Object.entries(data).filter(([key]) => key === 'ner' || key.startsWith('ner/'));
        if (!lists.length) throw new Error('HanLP không trả dữ liệu NER hợp lệ.');
        const result = [];
        function visit(value) {
            if (!Array.isArray(value)) throw new Error('Danh sách NER HanLP không hợp lệ.');
            if (typeof value[0] === 'string' && typeof value[1] === 'string') {
                const entity = normalizeEntity(value[0], value[1], 'hanlp');
                if (entity) result.push(entity);
            } else value.forEach(visit);
        }
        lists.forEach(([, rows]) => visit(rows));
        return result;
    }

    function parseLocalOutput(payload, engine) {
        return parseLacOutput(payload).map(entity => ({ ...entity, engine }));
    }

    function createHanlpLimiter(storage = {}) {
        const records = new Map();
        const get = storage.get || (async key => records.get(key));
        const set = storage.set || (async (key, value) => { records.set(key, value); });
        const remove = storage.remove || (async key => { records.delete(key); });
        const list = storage.list || (async () => Array.from(records.keys()));
        const now = storage.now || Date.now;
        const sleep = storage.wait || wait;
        const prefix = 'tm_ner_hanlp_ticket_';
        const stateKey = 'tm_ner_hanlp_rate_v1';
        // Bakery tickets coordinate GM storage across website origins, not only one domain.
        async function locked(callback, signal) {
            const id = `${now()}_${Math.random().toString(36).slice(2)}`;
            const key = prefix + id;
            const expiresAt = now() + 45000;
            try {
                await set(key, { choosing: true, ticket: 0, expiresAt });
                const keys = (await list()).filter(key => key.startsWith(prefix));
                const peers = await Promise.all(keys.map(async key => await get(key)));
                const ticket = 1 + Math.max(0, ...peers.filter(item => item?.expiresAt > now()).map(item => item.ticket || 0));
                await set(key, { choosing: false, ticket, expiresAt });
                for (const peerKey of keys.filter(peer => peer !== key)) {
                    while (true) {
                        throwIfAborted(signal);
                        if (now() >= expiresAt - 5000) throw new Error('Không giữ được hàng đợi HanLP. Hãy thử lại sau.');
                        const peer = await get(peerKey);
                        if (!peer || peer.expiresAt <= now()) break;
                        if (!peer.choosing && (peer.ticket > ticket || (peer.ticket === ticket && peerKey > key))) break;
                        await sleep(50, signal);
                    }
                }
                throwIfAborted(signal);
                return await callback();
            } finally { await remove(key); }
        }
        async function readState() {
            const state = await get(stateKey);
            if (state === undefined || state === null) return { nextAt: 0, blockedUntil: 0 };
            if (!Number.isFinite(state.nextAt) || !Number.isFinite(state.blockedUntil)) {
                throw new Error('Trạng thái giới hạn HanLP bị lỗi. Tạm ngừng gọi để tránh vượt quota.');
            }
            return state;
        }
        return {
            async reserve(signal, onWait) {
                const slot = await locked(async () => {
                    const state = await readState();
                    const at = Math.max(now(), state.nextAt, state.blockedUntil);
                    if (state.blockedUntil > now()) throw new Error('HanLP đang tạm dừng do quota. Hãy thử lại sau thời gian chờ.');
                    await set(stateKey, { nextAt: at + 31000, blockedUntil: state.blockedUntil });
                    return at;
                }, signal);
                if (slot > now()) onWait?.({ waitMs: slot - now() });
                await sleep(Math.max(0, slot - now()), signal);
                const state = await readState();
                if (state.blockedUntil > now()) throw new Error('HanLP đang tạm dừng do quota. Hãy thử lại sau thời gian chờ.');
            },
            async block(retryAfterMs) {
                await locked(async () => {
                    const state = await readState();
                    state.blockedUntil = Math.max(state.blockedUntil, now() + Math.max(60000, Number(retryAfterMs) || 0));
                    await set(stateKey, state);
                });
            }
        };
    }
    const defaultHanlpLimiter = createHanlpLimiter();

    function parseTexSmart(payload) {
        const data = asJson(payload);
        if (data?.header?.ret_code && data.header.ret_code !== 'succ') {
            throw new Error(`TexSmart: ${data.header.ret_code}${data.header.ret_msg ? ` (${data.header.ret_msg})` : ''}`);
        }
        if (!Array.isArray(data?.entity_list)) throw new Error('TexSmart không trả entity_list hợp lệ.');
        return data.entity_list
            .map(item => normalizeEntity(item?.str, item?.tag || item?.type?.name, 'texsmart'))
            .filter(Boolean);
    }

    function parseLacOutput(payload) {
        const rows = Array.isArray(payload) ? payload : String(payload || '').split(/\r?\n/);
        return rows.map(row => {
            if (row && typeof row === 'object') {
                return normalizeEntity(row.word || row.text, row.type || row.tag, 'lac', row.confidence);
            }
            const match = String(row || '').trim().match(/^(.+?)[=\t](PER|LOC|ORG)$/i);
            return match ? normalizeEntity(match[1], match[2], 'lac') : null;
        }).filter(Boolean);
    }

    function countLiteral(text, needle) {
        if (!needle) return 0;
        let count = 0;
        let cursor = 0;
        while (cursor <= text.length - needle.length) {
            const index = text.indexOf(needle, cursor);
            if (index < 0) break;
            count++;
            cursor = index + Math.max(1, needle.length);
        }
        return count;
    }

    function mergeEntities(entities, corpus, options = {}) {
        const minLength = Math.max(1, Math.min(12, Number(options.minLength) || 2));
        const maxLength = Math.max(minLength, Math.min(12, Number(options.maxLength) || 12));
        const minFrequency = Math.max(1, Number(options.minFrequency) || 1);
        const enabledTypes = new Set(Array.isArray(options.types) && options.types.length ? options.types : Object.keys(TYPES));
        const existing = new Set(Array.isArray(options.existingNames) ? options.existingNames : []);
        const skipExisting = options.skipExisting !== false;
        const merged = new Map();
        for (const entity of entities || []) {
            const word = cleanWord(entity?.word);
            const type = normalizeType(entity?.type);
            const hanLength = Array.from(word).filter(char => HAN_REGEX.test(char)).length;
            if (!word || !type || !enabledTypes.has(type) || hanLength < minLength || hanLength > maxLength) continue;
            if (skipExisting && existing.has(word)) continue;
            let item = merged.get(word);
            if (!item) {
                item = { word, type, typeVotes: {}, engines: new Set(), engineHits: 0, confidence: null };
                merged.set(word, item);
            }
            item.typeVotes[type] = (item.typeVotes[type] || 0) + 1;
            item.engines.add(entity.engine);
            item.engineHits++;
            if (entity.confidence !== null && (item.confidence === null || entity.confidence > item.confidence)) {
                item.confidence = entity.confidence;
            }
        }
        const normalizedCorpus = normalizeInput(corpus);
        return Array.from(merged.values()).map(item => {
            const type = Object.entries(item.typeVotes).sort((a, b) => b[1] - a[1])[0]?.[0] || item.type;
            return {
                word: item.word,
                type,
                count: countLiteral(normalizedCorpus, item.word),
                engineHits: item.engineHits,
                engines: Array.from(item.engines),
                confidence: item.confidence,
                exists: existing.has(item.word)
            };
        }).filter(item => item.count >= minFrequency)
            .sort((a, b) => b.count - a.count || b.word.length - a.word.length || a.word.localeCompare(b.word, 'zh'));
    }

    function getAdapter(engine) {
        if (engine === 'texsmart') return { makeRequest: makeTexSmartRequest, parse: parseTexSmart };
        if (engine === 'hanlp') return { makeRequest: makeHanlpRequest, parse: parseHanlp };
        return null;
    }

    async function requestWithRetry(request, spec, signal, retryCount) {
        let lastError = null;
        for (let attempt = 0; attempt <= retryCount; attempt++) {
            throwIfAborted(signal);
            try {
                return await request(spec, { signal });
            } catch (error) {
                if (error?.name === 'AbortError' || error?.retryable === false || [400,401,403,429].includes(error?.status)) throw error;
                lastError = error;
                if (attempt < retryCount) await wait(500 * (attempt + 1), signal);
            }
        }
        throw lastError || new Error('Request NER thất bại.');
    }

    async function analyze(options = {}) {
        const chapters = (Array.isArray(options.chapters) ? options.chapters : [])
            .map((chapter, index) => ({
                index,
                title: String(chapter?.title || ''),
                text: normalizeInput(chapter?.text || '')
            })).filter(chapter => chapter.text);
        const localAnalyzers = { lac: options.localAnalyze, ...(options.localAnalyzers || {}) };
        const engines = Array.from(new Set((options.engines || ['texsmart'])
            .map(value => String(value || '').toLowerCase())
            .filter(engine => ENGINES[engine]?.available)
            .filter(engine => !ENGINES[engine].local || typeof localAnalyzers[engine] === 'function')));
        if (!chapters.length) return { results: [], warnings: [], stats: { requests: 0, completed: 0 } };
        if (!engines.length) throw new Error('Chưa chọn engine NER dùng được trên web.');
        if (engines.some(engine => !ENGINES[engine].local) && typeof options.request !== 'function') {
            throw new Error('Thiếu hàm gửi request NER.');
        }

        const tasks = [];
        const corpusParts = [];
        chapters.forEach(chapter => {
            corpusParts.push(chapter.text);
            engines.forEach(engine => {
                const maxChars = Math.min(Number(options.maxCharsPerRequest) || 6000, ENGINES[engine].maxChars || 6000);
                const chunks = engine === 'bert' ? [chapter.text] : splitText(chapter.text, maxChars, engine === 'hanlp' ? 16 : Infinity);
                chunks.forEach((text, chunkIndex) => tasks.push({ chapter, chunkIndex, engine, text }));
            });
        });
        const allEntities = [];
        let successfulTasks = 0;
        const warningMap = new Map();
        const disabledEngines = new Set();
        const hanlpLimiter = options.hanlpLimiter || defaultHanlpLimiter;
        const requestedGap = Number(options.requestGapMs);
        const requestedRetries = Number(options.retryCount);
        const requestGapMs = Math.max(0, Number.isFinite(requestedGap) ? requestedGap : 300);
        const retryCount = Math.max(0, Math.min(3, Number.isFinite(requestedRetries) ? requestedRetries : 1));
        let completed = 0;
        let lastRequestAt = 0;
        const reportProgress = task => {
            completed++;
            options.onProgress?.({ completed, total: tasks.length, chapterIndex: task.chapter.index,
                chapterTitle: task.chapter.title, engine: task.engine });
        };
        for (const task of tasks) {
            throwIfAborted(options.signal);
            if (disabledEngines.has(task.engine)) { reportProgress(task); continue; }
            try {
                if (ENGINES[task.engine].local) {
                    const response = await localAnalyzers[task.engine](task.text, {
                        signal: options.signal,
                        onProgress: progress => options.onEngineProgress?.({
                            ...progress,
                            chapterIndex: task.chapter.index,
                            chapterTitle: task.chapter.title,
                            engine: task.engine
                        })
                    });
                    allEntities.push(...parseLocalOutput(response, task.engine));
                } else {
                    if (task.engine === 'hanlp') await hanlpLimiter.reserve(options.signal, progress =>
                        options.onEngineProgress?.({ ...progress, engine: task.engine, chapterTitle: task.chapter.title }));
                    const elapsed = Date.now() - lastRequestAt;
                    if (lastRequestAt && elapsed < requestGapMs) await wait(requestGapMs - elapsed, options.signal);
                    const adapter = getAdapter(task.engine);
                    const spec = adapter.makeRequest(task.text, options.hanlp);
                    lastRequestAt = Date.now();
                    const response = await requestWithRetry(options.request, spec, options.signal, task.engine === 'hanlp' ? 0 : retryCount);
                    allEntities.push(...adapter.parse(response));
                }
                successfulTasks++;
            } catch (error) {
                if (error?.name === 'AbortError') throw error;
                const current = warningMap.get(task.engine) || { engine: task.engine, count: 0, message: '' };
                current.count++;
                current.message = error?.message || String(error);
                warningMap.set(task.engine, current);
                if (task.engine === 'hanlp') {
                    disabledEngines.add('hanlp');
                    if (error?.status === 429) await hanlpLimiter.block(error.retryAfterMs);
                }
            }
            reportProgress(task);
        }
        const warnings = Array.from(warningMap.values());
        if (!successfulTasks && warnings.length) {
            const detail = warnings.map(item => `${ENGINES[item.engine]?.label || item.engine}: ${item.message}`).join('. ');
            throw new Error(`Không engine nào trả kết quả. ${detail}`);
        }
        return {
            results: mergeEntities(allEntities, corpusParts.join('\n'), options),
            warnings,
            stats: { requests: tasks.length, completed, entities: allEntities.length }
        };
    }

    return Object.freeze({
        VERSION,
        TYPES,
        ENGINES,
        normalizeInput,
        splitText,
        normalizeType,
        makeTexSmartRequest,
        makeHanlpRequest,
        parseTexSmart,
        parseHanlp,
        createHanlpLimiter,
        parseLacOutput,
        mergeEntities,
        analyze
    });
});
