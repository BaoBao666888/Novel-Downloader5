// ==UserScript==
// @name         Wikidich Autofill (Library)
// @namespace    http://tampermonkey.net/
// @version      0.1.3
// @description  Lấy thông tin từ web Trung (Fanqie/JJWXC), dịch và tự tick/điền form nhúng truyện trên truyenwikidich.net.
// @author       QuocBao
// ==/UserScript==

(function (global) {
    'use strict';
    let instance = null;

    const APP_PREFIX = 'WDA_';
    const SERVER_URL = 'https://dichngay.com/translate/text';
    const MAX_CHARS = 4500;
    const REQUEST_DELAY_MS = 350;
    const DEFAULT_SCORE_THRESHOLD = 0.9;
    const SCORE_FALLBACK = 0.65;
    const MAX_TAGS_SELECT = 25;
    const ROOT_NEG_WORDS = ['vo', 'khong', 'phi', 'chong', 'phan', 'non', 'no'];
    const ROOT_MODIFIERS = new Set([
        'song', 'nhieu', 'main', 'ca', 'nha', 'nu', 'nam', 'trang', 'phan', 'sat',
        'la', 'toan', 'tap', 'the'
    ]);

    const DEFAULT_SETTINGS = {
        scoreThreshold: DEFAULT_SCORE_THRESHOLD,
        useDescByDomain: {
            fanqie: true,
            jjwxc: false,
        },
    };

    const state = {
        groups: null,
        rawData: null,
        sourceData: null,
        sourceType: null,
        sourceLabel: null,
        translated: null,
        suggestions: null,
        settings: null,
    };

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function clampNumber(value, min, max, fallback) {
        const num = Number(value);
        if (!Number.isFinite(num)) return fallback;
        return Math.min(max, Math.max(min, num));
    }

    function normalizeSettings(raw) {
        const base = {
            scoreThreshold: DEFAULT_SETTINGS.scoreThreshold,
            useDescByDomain: { ...DEFAULT_SETTINGS.useDescByDomain },
        };
        if (raw && typeof raw === 'object') {
            if ('scoreThreshold' in raw) base.scoreThreshold = raw.scoreThreshold;
            if (raw.useDescByDomain && typeof raw.useDescByDomain === 'object') {
                Object.keys(base.useDescByDomain).forEach((key) => {
                    if (key in raw.useDescByDomain) {
                        base.useDescByDomain[key] = !!raw.useDescByDomain[key];
                    }
                });
            }
        }
        base.scoreThreshold = clampNumber(base.scoreThreshold, 0.5, 0.99, DEFAULT_SCORE_THRESHOLD);
        return base;
    }

    function loadSettings() {
        const saved = GM_getValue(`${APP_PREFIX}settings`, null);
        return normalizeSettings(saved);
    }

    function saveSettings(next) {
        const normalized = normalizeSettings(next);
        GM_setValue(`${APP_PREFIX}settings`, normalized);
        state.settings = normalized;
        return normalized;
    }

    function getScoreThreshold() {
        if (state.settings && Number.isFinite(state.settings.scoreThreshold)) {
            return state.settings.scoreThreshold;
        }
        return DEFAULT_SCORE_THRESHOLD;
    }

    function shouldUseDescForSource(sourceType) {
        const map = state.settings?.useDescByDomain || {};
        if (typeof map[sourceType] === 'boolean') return map[sourceType];
        const fallback = DEFAULT_SETTINGS.useDescByDomain;
        if (typeof fallback[sourceType] === 'boolean') return fallback[sourceType];
        return true;
    }

    function safeText(v) {
        return (v || '').toString().trim();
    }

    function normalizeText(text = '') {
        return text
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function bigramDice(a, b) {
        if (!a || !b) return 0;
        if (a === b) return 1;
        if (a.length < 2 || b.length < 2) return 0;
        const map = new Map();
        for (let i = 0; i < a.length - 1; i++) {
            const g = a.slice(i, i + 2);
            map.set(g, (map.get(g) || 0) + 1);
        }
        let intersection = 0;
        for (let i = 0; i < b.length - 1; i++) {
            const g = b.slice(i, i + 2);
            const count = map.get(g) || 0;
            if (count > 0) {
                map.set(g, count - 1);
                intersection++;
            }
        }
        return (2 * intersection) / ((a.length - 1) + (b.length - 1));
    }

    function similarityScore(a, b) {
        const na = normalizeText(a).replace(/\s+/g, '');
        const nb = normalizeText(b).replace(/\s+/g, '');
        if (!na || !nb) return 0;
        if (na === nb) return 1;
        if (na.includes(nb) || nb.includes(na)) {
            const shortLen = Math.min(na.length, nb.length);
            const longLen = Math.max(na.length, nb.length);
            return 0.98 * (shortLen / longLen);
        }
        return bigramDice(na, nb);
    }

    function splitTokens(text) {
        return normalizeText(text).split(' ').filter(Boolean);
    }

    function buildNameSetReplacer(nameSet) {
        const keys = Object.keys(nameSet || {}).sort((a, b) => b.length - a.length);
        return function (text, placeholderMap) {
            let out = text;
            for (const k of keys) {
                if (!k) continue;
                if (out.includes(k)) {
                    const id = `__FWDA_NAME_${Object.keys(placeholderMap).length}__`;
                    placeholderMap[id] = { orig: k, viet: nameSet[k] };
                    out = out.split(k).join(id);
                }
            }
            return out;
        };
    }

    function restoreNames(text, placeholderMap) {
        if (!text || !placeholderMap) return text;
        let result = text;
        for (const placeholder in placeholderMap) {
            const regex = new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            result = result.replace(regex, placeholderMap[placeholder].viet + ' ');
        }
        return result;
    }

    function capitalizeFirstLetter(s) {
        if (typeof s !== 'string' || !s) return s;
        return s.replace(/(^|[\.?!])(\s*["'“‘(\[]*)(\p{L})/gu, (match, p1, p2, p3) => {
            return p1 + p2 + p3.toUpperCase();
        });
    }

    function fixSpacing(text) {
        let result = (text || '').toString();
        result = result.replace(/\s+([,.;!?\)]|”|’|:)/g, '$1');
        result = result.replace(/([\(\[“‘])\s+/g, '$1');
        result = result.replace(/\s+/g, ' ').trim();
        return result;
    }

    function cleanupText(text, preserveLineBreaks) {
        if (!preserveLineBreaks) return capitalizeFirstLetter(fixSpacing(text));
        const normalized = (text || '').toString().replace(/\r\n/g, '\n');
        const lines = normalized.split('\n');
        const cleaned = lines.map(line => {
            if (!line.trim()) return '';
            return capitalizeFirstLetter(fixSpacing(line));
        });
        return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    function parseNameSet(raw) {
        const lines = (raw || '').split(/\r?\n/);
        const map = {};
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            let sep = '=>';
            if (trimmed.includes(sep)) {
                const [orig, viet] = trimmed.split(sep).map(s => s.trim());
                if (orig && viet) map[orig] = viet;
                continue;
            }
            if (trimmed.includes('=')) {
                const [orig, viet] = trimmed.split('=').map(s => s.trim());
                if (orig && viet) map[orig] = viet;
                continue;
            }
            if (trimmed.includes('|')) {
                const [orig, viet] = trimmed.split('|').map(s => s.trim());
                if (orig && viet) map[orig] = viet;
            }
        }
        return map;
    }

    function resolveNegationConflicts(labels) {
        const normalizedMap = new Map();
        labels.forEach(label => normalizedMap.set(normalizeText(label), label));
        const toRemove = new Set();

        normalizedMap.forEach((origLabel, normLabel) => {
            const tokens = splitTokens(normLabel);
            if (tokens.length < 2) return;
            if (!ROOT_NEG_WORDS.includes(tokens[0])) return;
            const base = tokens.slice(1).join(' ');
            if (normalizedMap.has(base)) {
                toRemove.add(normalizedMap.get(base));
            }
        });

        return labels.filter(label => !toRemove.has(label));
    }

    function rootKey(label) {
        let tokens = splitTokens(label);
        while (tokens.length && ROOT_NEG_WORDS.includes(tokens[0])) {
            tokens.shift();
        }
        tokens = tokens.filter(tok => !ROOT_MODIFIERS.has(tok));
        if (!tokens.length) return normalizeText(label);
        return tokens.join(' ');
    }

    function collapseByRoot(items) {
        const bestByRoot = new Map();
        items.forEach(item => {
            const key = rootKey(item.label);
            const existing = bestByRoot.get(key);
            if (!existing) {
                bestByRoot.set(key, item);
                return;
            }
            if (item.score > existing.score) {
                bestByRoot.set(key, item);
                return;
            }
            if (item.score === existing.score) {
                const curLen = normalizeText(item.label).replace(/\s+/g, '').length;
                const prevLen = normalizeText(existing.label).replace(/\s+/g, '').length;
                if (curLen > prevLen) bestByRoot.set(key, item);
            }
        });
        return Array.from(bestByRoot.values());
    }

    function splitIntoBatches(arr, maxChars) {
        const batches = [];
        let current = [];
        let currentLen = 0;
        for (const s of arr) {
            const len = (s || '').length;
            if (current.length && currentLen + len + current.length > maxChars) {
                batches.push(current);
                current = [s];
                currentLen = len;
            } else {
                current.push(s);
                currentLen += len;
            }
        }
        if (current.length) batches.push(current);
        return batches;
    }

    function postTranslate(serverUrl, contentArray, targetLang) {
        return new Promise((resolve, reject) => {
            const payload = { content: JSON.stringify(contentArray), tl: targetLang };
            GM_xmlhttpRequest({
                method: 'POST',
                url: serverUrl,
                headers: { 'Content-Type': 'application/json', 'referer': 'https://dichngay.com/' },
                data: JSON.stringify(payload),
                onload(res) {
                    if (res.status < 200 || res.status >= 300) {
                        reject(new Error('HTTP Error: ' + res.status));
                        return;
                    }
                    try {
                        const jsonResponse = JSON.parse(res.responseText);
                        const translatedContentString = jsonResponse?.data?.content ?? jsonResponse?.translatedText;
                        if (typeof translatedContentString !== 'string') {
                            throw new Error('Bad translation response.');
                        }
                        const sanitizedString = translatedContentString
                            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
                            .replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
                        resolve(JSON.parse(sanitizedString));
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    async function translateList(list) {
        const items = Array.isArray(list) ? list : [];
        const batches = splitIntoBatches(items, MAX_CHARS);
        const result = [];
        for (const batch of batches) {
            try {
                const translated = await postTranslate(SERVER_URL, batch, 'vi');
                result.push(...translated);
            } catch (err) {
                // fallback: giữ nguyên đoạn lỗi
                result.push(...batch);
            }
            await sleep(REQUEST_DELAY_MS);
        }
        return result;
    }

    async function translateLongText(text) {
        const raw = safeText(text);
        if (!raw) return '';
        if (raw.length <= MAX_CHARS) {
            const [translated] = await translateList([raw]);
            return translated || raw;
        }
        const parts = raw.split(/\n{2,}/g).map(s => s.trim()).filter(Boolean);
        const translatedParts = await translateList(parts);
        return translatedParts.join('\n\n');
    }

    async function translateTextWithNameSet(text, nameSet, preserveLineBreaks) {
        const raw = safeText(text);
        if (!raw) return '';
        const nameMap = nameSet || {};
        const nameReplacer = buildNameSetReplacer(nameMap);
        const placeholderMap = {};
        const processed = nameReplacer(raw, placeholderMap);
        let translated = '';
        if (preserveLineBreaks) {
            const lines = processed.replace(/\r\n/g, '\n').split('\n');
            const translatedLines = await translateList(lines);
            translated = translatedLines.join('\n');
        } else if (processed.length <= MAX_CHARS) {
            const [result] = await translateList([processed]);
            translated = result || processed;
        } else {
            translated = await translateLongText(processed);
        }
        const restored = Object.keys(placeholderMap).length ? restoreNames(translated, placeholderMap) : translated;
        return cleanupText(restored, preserveLineBreaks);
    }

    function extractBookId(url) {
        const m = safeText(url).match(/\/(?:page|reader)\/(\d+)/);
        if (m) return m[1];
        const onlyDigits = safeText(url).match(/(\d{10,})/);
        return onlyDigits ? onlyDigits[1] : '';
    }

    function extractJjwxcId(url) {
        const raw = safeText(url);
        let m = raw.match(/book2\/(\d+)/i);
        if (m) return m[1];
        m = raw.match(/novelid=(\d+)/i);
        if (m) return m[1];
        m = raw.match(/\/(\d+)(?:\.html|\/)?$/i);
        if (m) return m[1];
        return '';
    }

    function detectSource(url) {
        const raw = safeText(url);
        if (/fanqienovel\.com/i.test(raw)) {
            return { type: 'fanqie', id: extractBookId(raw) };
        }
        if (/jjwxc\.net/i.test(raw) || /novelid=/i.test(raw) || /book2\//i.test(raw)) {
            return { type: 'jjwxc', id: extractJjwxcId(raw) };
        }
        return null;
    }

    function parseTagList(text) {
        return safeText(text)
            .split(/[，,、/|]/)
            .map(s => s.trim())
            .filter(Boolean);
    }

    function htmlToText(html) {
        let out = (html || '').toString();
        out = out.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        out = out.replace(/<br\s*\/?>/gi, '\n');
        out = out.replace(/<[^>]+>/g, '');
        out = out.replace(/\n{3,}/g, '\n\n');
        return out.trim();
    }

    function fetchFanqieData(bookId) {
        const apiUrl = `https://api5-normal-sinfonlineb.fqnovel.com/reading/bookapi/multi-detail/v/?aid=2329&iid=1&version_code=999&book_id=${bookId}`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                responseType: 'json',
                onload(res) {
                    let parsed = res.response;
                    if (!parsed && res.responseText) {
                        try { parsed = JSON.parse(res.responseText); } catch { parsed = null; }
                    }
                    const data = parsed?.data?.[0] || null;
                    if (!data) {
                        reject(new Error('Fanqie API không có dữ liệu.'));
                        return;
                    }
                    resolve(data);
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    function fetchJjwxcData(bookId) {
        const apiUrl = `http://app.jjwxc.net/androidapi/novelbasicinfo?novelId=${bookId}`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                responseType: 'json',
                onload(res) {
                    let parsed = res.response;
                    if (!parsed && res.responseText) {
                        try { parsed = JSON.parse(res.responseText); } catch { parsed = null; }
                    }
                    if (!parsed) {
                        reject(new Error('JJWXC API không có dữ liệu.'));
                        return;
                    }
                    resolve(parsed);
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    function checkImageUrlValid(url) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'HEAD',
                url,
                onload: (res) => {
                    const contentType = (res.responseHeaders || '')
                        .match(/content-type:\s*([^\r\n]+)/i)?.[1] || '';
                    resolve(res.status === 200 && contentType.toLowerCase().startsWith('image/'));
                },
                onerror: () => resolve(false),
                ontimeout: () => resolve(false),
            });
        });
    }

    async function processJjwxcCover(novelCover) {
        if (!novelCover) return '';
        const coverRaw = novelCover;
        const modifiedCover = coverRaw
            .replace(/_[0-9]+_[0-9]+(?=\.jpg)/, '')
            .replace(/\.jpg.*/i, '.jpg');
        const isValid = await checkImageUrlValid(modifiedCover);
        return isValid ? modifiedCover : coverRaw;
    }

    function describeCharacterRelationsJJWXC(data) {
        if (!data || !Array.isArray(data.characters) || !Array.isArray(data.character_relations)) {
            return { mainLine: '', otherNames: [] };
        }
        const genderLabel = (g) => {
            if (g === '1') return '【男】';
            if (g === '0') return '【女】';
            return '【其他】';
        };
        const charactersById = {};
        data.characters.forEach(c => { charactersById[c.character_id] = c; });
        const pov = data.characters.find(c => c.is_pov === '1');
        if (!pov) return { mainLine: '', otherNames: [] };

        const lovers = [];
        const loverIds = new Set();
        data.character_relations.forEach(rel => {
            if (rel.start === pov.character_id && charactersById[rel.end]) {
                lovers.push(charactersById[rel.end]);
                loverIds.add(rel.end);
            }
        });
        let mainLine = `主角视角：${pov.character_name}${genderLabel(pov.character_gender)}`;
        if (lovers.length > 0) {
            const loverStr = lovers.map(l => `${l.character_name}${genderLabel(l.character_gender)}`).join(', ');
            mainLine += `(互动) ${loverStr}`;
        }
        const otherNames = data.characters
            .filter(c => c.character_id !== pov.character_id && !loverIds.has(c.character_id))
            .map(c => `${c.character_name}${genderLabel(c.character_gender)}`);
        return { mainLine, otherNames };
    }

    function normalizeFanqieData(raw) {
        const titleCn = safeText(raw.book_name || raw.original_book_name);
        const authorCn = safeText(raw.author);
        const descCn = safeText(raw.book_abstract_v2 || raw.abstract);
        const tags = parseTagList(raw.tags).concat(parseTagList(raw.pure_category_tags));
        const categoryV2 = Array.isArray(raw.category_v2)
            ? raw.category_v2
            : (() => {
                try { return JSON.parse(raw.category_v2 || '[]'); } catch { return []; }
            })();
        const categories = categoryV2.map(c => c?.Name).filter(Boolean);
        if (raw.category) categories.push(raw.category);
        return {
            sourceType: 'fanqie',
            sourceLabel: 'Cà Chua',
            titleCn,
            authorCn,
            descCn,
            tags: Array.from(new Set(tags)),
            categories: Array.from(new Set(categories)),
            coverUrl: raw.expand_thumb_url || raw.thumb_url || '',
            statusHint: '',
            update_status: raw.update_status,
            extraKeywords: [],
        };
    }

    function normalizeJjwxcData(raw) {
        const titleCn = safeText(raw.novelName);
        const authorCn = safeText(raw.authorName);
        const introText = htmlToText(raw.novelIntro || '');
        const tagsRaw = safeText(raw.novelTags);
        const tagsLine = tagsRaw ? `内容标签：${tagsRaw}` : '';
        const rel = describeCharacterRelationsJJWXC(raw);
        const relLines = [];
        if (rel.mainLine) relLines.push(rel.mainLine);
        if (rel.otherNames && rel.otherNames.length) {
            relLines.push(`配角: ${rel.otherNames.join('，')}`);
        }
        const otherText = safeText(raw.other);
        const introShortRaw = safeText(raw.novelIntroShort);
        const introShort = introShortRaw ? `一句话简介：${introShortRaw}` : '';
        const descCn = [
            introText,
            tagsLine,
            ...relLines,
            otherText,
            introShort,
        ].filter(Boolean).join('\n');
        const tags = parseTagList(raw.novelTags);
        const categories = parseTagList(raw.novelClass);
        const statusHint = safeText(raw.novelStatus || raw.novelStep || raw.isFinished || raw.novelComplete);
        const extraKeywords = parseTagList(raw.novelType || raw.novelTypeName || '');
        return {
            sourceType: 'jjwxc',
            sourceLabel: 'Tấn Giang',
            titleCn,
            authorCn,
            descCn,
            tags,
            categories,
            coverUrl: safeText(raw.novelCover),
            statusHint,
            update_status: undefined,
            extraKeywords,
        };
    }

    function getGroupOptions() {
        const groups = {
            status: [],
            official: [],
            gender: [],
            age: [],
            ending: [],
            genre: [],
            tag: [],
        };
        const inputs = Array.from(document.querySelectorAll('.book-attr-group input[name]'));
        inputs.forEach((input) => {
            const name = input.getAttribute('name');
            if (!groups[name]) return;
            const labelEl = document.querySelector(`label[for="${input.id}"]`);
            const label = labelEl ? labelEl.textContent.trim() : '';
            groups[name].push({ input, label });
        });
        return groups;
    }

    function buildKeywordList(sourceData, translated) {
        const rawList = []
            .concat(sourceData?.tags || [])
            .concat(sourceData?.categories || [])
            .concat(sourceData?.extraKeywords || []);
        const translatedList = translated?.tags || [];
        const translatedCats = translated?.categories || [];
        const combined = expandKeywordAliases([...rawList, ...translatedList, ...translatedCats])
            .map(safeText)
            .filter(Boolean);
        return Array.from(new Set(combined));
    }

    function expandKeywordAliases(list) {
        const expanded = [];
        for (const item of list || []) {
            const text = safeText(item);
            if (!text) continue;
            expanded.push(text);
            const norm = normalizeText(text);
            if (norm.includes('主受') || norm.includes('chu chiu')) {
                expanded.push('Chủ thụ');
            }
            if (norm.includes('互攻') || norm.includes('ho cong')) {
                expanded.push('Hỗ công');
            }
            if (norm.includes('纯爱') || norm.includes('thuan ai')) {
                expanded.push('Đam mỹ');
            }
        }
        return expanded;
    }

    function detectStatus(raw, textBlob) {
        const cn = normalizeText(textBlob + ' ' + safeText(raw.statusHint || ''));
        const hasDone = /hoan thanh|da xong|da hoan thanh|完结|完本|已完结/.test(cn);
        const hasPause = /tam ngung|暂停|断更|停更/.test(cn);
        const hasOngoing = /连载|连載|更新中|dang cap nhat|con tiep/.test(cn);
        if (hasDone) return 'Hoàn thành';
        if (hasPause) return 'Tạm ngưng';
        if (raw.update_status === 1 || raw.isFinished === '1' || raw.is_finished === '1') return 'Hoàn thành';
        if (raw.update_status === 0 || hasOngoing) return 'Còn tiếp';
        return 'Còn tiếp';
    }

    function detectOfficial(keywords) {
        const blob = normalizeText(keywords.join(' '));
        if (/(dong nhan|dien sinh|衍生|同人)/.test(blob)) return 'Diễn sinh';
        return 'Nguyên sang';
    }

    function detectGender(keywords) {
        const blob = normalizeText(keywords.join(' '));
        if (/(song nam chu|双男主)/.test(blob)) return 'Đam mỹ';
        if (/(纯爱|thuan ai)/.test(blob)) return 'Đam mỹ';
        if (/(bach hop|百合|双女主)/.test(blob)) return 'Bách hợp';
        if (/(nu ton|女尊)/.test(blob)) return 'Nữ tôn';
        if (/(khong cp|无cp|无 c p)/.test(blob)) return 'Không CP';
        if (/(ngon tinh|言情|nu ph|女频)/.test(blob)) return 'Ngôn tình';
        if (/(nam sinh|男频|男主)/.test(blob)) return 'Nam sinh';
        return '';
    }

    function scoreOptions(options, keywords, textBlob) {
        const normalizedText = normalizeText(textBlob);
        const scored = options.map(opt => {
            const label = safeText(opt.label);
            const normLabel = normalizeText(label);
            const labelLen = normLabel.replace(/\s+/g, '').length;
            const labelTokens = splitTokens(normLabel);
            let score = 0;
            if (normLabel && labelLen >= 4 && normalizedText.includes(normLabel)) score = 1;
            if (normLabel && labelTokens.length > 1 && !ROOT_NEG_WORDS.includes(labelTokens[0])) {
                for (const w of ROOT_NEG_WORDS) {
                    if (normalizedText.includes(`${w} ${normLabel}`)) {
                        score = Math.min(score, 0.1);
                        break;
                    }
                }
            }
            for (const kw of keywords) {
                const s = similarityScore(label, kw);
                if (s > score) score = s;
            }
            return { ...opt, score };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored;
    }

    function pickMulti(scored, limit, requireOne, collapseRoot, threshold) {
        const minScore = Number.isFinite(threshold) ? threshold : getScoreThreshold();
        const selected = scored.filter(o => o.score >= minScore);
        let picked = selected;
        if (!picked.length && requireOne && scored.length) {
            const fallback = scored[0];
            picked = [fallback];
        }
        if (collapseRoot) picked = collapseByRoot(picked);
        if (limit && picked.length > limit) picked = picked.slice(0, limit);
        return resolveNegationConflicts(picked.map(o => o.label));
    }

    function pickRadio(scored, requireOne, threshold) {
        if (!scored.length) return '';
        const best = scored[0];
        const minScore = Number.isFinite(threshold) ? threshold : getScoreThreshold();
        if (best.score >= minScore) return best.label;
        if (requireOne) return best.label;
        return '';
    }

    function buildSuggestions(sourceData, translated, groups) {
        const useDesc = shouldUseDescForSource(sourceData?.sourceType);
        const descCn = safeText(sourceData.descCn);
        const descVi = safeText(translated?.desc || '');
        const tagsVi = translated?.tags || [];
        const catsVi = translated?.categories || [];

        const keywords = buildKeywordList(sourceData, translated);
        const textParts = [keywords.join(' ')];
        if (useDesc) textParts.unshift(descCn, descVi);
        const textBlob = textParts.join(' ');

        const statusLabel = detectStatus(sourceData, textBlob);
        const officialLabel = detectOfficial(keywords);
        const genderLabel = detectGender(keywords);

        const statusScored = scoreOptions(groups.status, [statusLabel], textBlob);
        const officialScored = scoreOptions(groups.official, [officialLabel], textBlob);
        const genderScored = scoreOptions(groups.gender, [genderLabel], textBlob);

        const ageScored = scoreOptions(groups.age, keywords, textBlob);
        const endingScored = scoreOptions(groups.ending, keywords, textBlob);
        const genreScored = scoreOptions(groups.genre, keywords, textBlob);
        const tagScored = scoreOptions(groups.tag, keywords.concat(tagsVi, catsVi), textBlob);

        const threshold = getScoreThreshold();
        return {
            status: pickRadio(statusScored, true, threshold),
            official: pickRadio(officialScored, true, threshold),
            gender: pickRadio(genderScored, false, threshold),
            age: pickMulti(ageScored, 4, true, false, threshold),
            ending: pickMulti(endingScored, 3, true, false, threshold),
            genre: pickMulti(genreScored, 8, true, false, threshold),
            tag: pickMulti(tagScored, MAX_TAGS_SELECT, true, true, threshold),
        };
    }

    function setInputValue(el, value) {
        if (!el) return;
        el.value = value || '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function setMoreLink(desc, url) {
        const linkInputs = Array.from(document.querySelectorAll('input[name="moreLinkUrl"]'));
        const descInputs = Array.from(document.querySelectorAll('input[name="moreLinkDesc"]'));
        if (!linkInputs.length || !descInputs.length || !url) return;
        let idx = linkInputs.findIndex(input => safeText(input.value) === '');
        if (idx < 0) idx = 0;
        if (idx >= descInputs.length) idx = descInputs.length - 1;
        setInputValue(linkInputs[idx], url);
        if (desc) setInputValue(descInputs[idx], desc);
    }

    function applyRadio(group, label) {
        if (!group || !label) return;
        const scored = scoreOptions(group, [label], label);
        const best = scored[0];
        if (!best) return;
        best.input.checked = true;
        best.input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function applyCheckboxes(group, labels) {
        if (!group || !Array.isArray(labels)) return;
        group.forEach(opt => {
            opt.input.checked = false;
            opt.input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        for (const label of labels) {
            const scored = scoreOptions(group, [label], label);
            const best = scored[0];
            if (!best || best.score < SCORE_FALLBACK) continue;
            best.input.checked = true;
            best.input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    function parseLabelList(text) {
        return safeText(text)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
    }

    function fetchCoverBlob(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'blob',
                onload(res) {
                    if (res.status < 200 || res.status >= 300) {
                        reject(new Error('Không tải được ảnh bìa.'));
                        return;
                    }
                    resolve(res.response);
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    async function applyCover(url, log) {
        const fileInput = document.querySelector('input[type="file"][data-change="changeCoverFile"]');
        if (!fileInput || !url) return;
        try {
            log('Đang tải ảnh bìa...');
            const blob = await fetchCoverBlob(url);
            const type = blob.type || 'image/jpeg';
            const ext = type.includes('/') ? type.split('/')[1] : 'jpg';
            const file = new File([blob], 'cover.' + ext, { type });
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInput.files = dt.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            log('Đã gán ảnh bìa.');
        } catch (err) {
            log('Lỗi tải ảnh bìa: ' + err.message, 'error');
        }
    }

    function createUI(options = {}) {
        state.settings = loadSettings();
        const shadowHost = document.createElement('div');
        shadowHost.id = `${APP_PREFIX}host`;
        document.body.appendChild(shadowHost);
        const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
        const showFloatingButton = options.showFloatingButton !== false;

        const css = `
            :host { all: initial; }
            #${APP_PREFIX}btn {
                position: fixed; bottom: 20px; right: 20px; z-index: 99999;
                width: 48px; height: 48px; border-radius: 50%;
                background: #ff9800; color: #fff; border: none;
                font-size: 14px; cursor: grab; font-family: Arial, sans-serif;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            #${APP_PREFIX}btn:active { cursor: grabbing; }
            #${APP_PREFIX}panel {
                position: fixed; bottom: 70px; right: 20px; width: 420px; max-height: 75vh;
                background: #fff; color: #222; border: 1px solid #ddd; border-radius: 10px;
                box-shadow: 0 10px 24px rgba(0,0,0,0.18); font-family: Arial, sans-serif;
                z-index: 99999; display: none; flex-direction: column;
            }
            #${APP_PREFIX}header {
                padding: 10px 14px; background: #f7f7f7; border-bottom: 1px solid #e3e3e3;
                font-weight: bold; font-size: 14px; display: flex; justify-content: space-between;
                cursor: move;
            }
            #${APP_PREFIX}content { padding: 12px 14px; overflow: auto; }
            .${APP_PREFIX}row { margin-bottom: 10px; }
            .${APP_PREFIX}label { font-size: 12px; color: #555; margin-bottom: 4px; display: block; }
            .${APP_PREFIX}input, .${APP_PREFIX}textarea, .${APP_PREFIX}select {
                width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid #ccc;
                border-radius: 6px; font-size: 13px; font-family: inherit;
            }
            .${APP_PREFIX}textarea { min-height: 80px; resize: vertical; }
            .${APP_PREFIX}btn {
                background: #2196f3; color: #fff; border: none; border-radius: 6px;
                padding: 8px 10px; cursor: pointer; font-size: 13px; margin-right: 6px;
            }
            .${APP_PREFIX}btn.secondary { background: #6c757d; }
            .${APP_PREFIX}icon-btn {
                background: #fff; border: 1px solid #bbb; color: #333; border-radius: 50%;
                width: 26px; height: 26px; font-weight: bold; font-size: 14px;
                display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
                margin-right: 8px;
            }
            .${APP_PREFIX}settings-group { display: flex; flex-direction: column; gap: 6px; }
            .${APP_PREFIX}settings-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
            .${APP_PREFIX}log {
                background: #111; color: #0f0; padding: 8px; border-radius: 6px;
                font-family: "Courier New", monospace; font-size: 11px; max-height: 100px; overflow: auto;
            }
            .${APP_PREFIX}hint { font-size: 11px; color: #777; }
            .${APP_PREFIX}grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .${APP_PREFIX}modal {
                position: fixed; inset: 0; background: rgba(0,0,0,0.45);
                display: none; align-items: center; justify-content: center; z-index: 100000;
                font-family: Arial, sans-serif;
            }
            .${APP_PREFIX}modal-card {
                background: #fff; color: #222; border-radius: 10px; width: 520px; max-width: 92vw;
                padding: 16px; box-shadow: 0 12px 28px rgba(0,0,0,0.22);
            }
            .${APP_PREFIX}modal-title { font-weight: bold; margin-bottom: 8px; }
            .${APP_PREFIX}modal-body { font-size: 13px; line-height: 1.45; white-space: pre-line; }
            .${APP_PREFIX}modal-actions { margin-top: 12px; text-align: right; }
        `;

        shadowRoot.innerHTML = `
            <style>${css}</style>
            <button id="${APP_PREFIX}btn">AF</button>
            <div id="${APP_PREFIX}panel">
                <div id="${APP_PREFIX}header">
                    <span>Web Trung → Wikidich</span>
                    <div>
                        <button id="${APP_PREFIX}help" class="${APP_PREFIX}icon-btn">?</button>
                        <button id="${APP_PREFIX}settings" class="${APP_PREFIX}icon-btn" title="Cài đặt">⚙</button>
                        <button id="${APP_PREFIX}close" class="${APP_PREFIX}btn secondary">Đóng</button>
                    </div>
                </div>
                <div id="${APP_PREFIX}content">
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">URL Web Trung</label>
                        <input id="${APP_PREFIX}url" class="${APP_PREFIX}input" placeholder="https://fanqienovel.com/page/..." />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <button id="${APP_PREFIX}fetch" class="${APP_PREFIX}btn">Lấy dữ liệu</button>
                        <button id="${APP_PREFIX}recompute" class="${APP_PREFIX}btn secondary">Recompute</button>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <div id="${APP_PREFIX}log" class="${APP_PREFIX}log"></div>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Từ khóa bổ sung (phân cách dấu phẩy)</label>
                        <input id="${APP_PREFIX}extraKeywords" class="${APP_PREFIX}input" placeholder="ví dụ: tiên hiệp, HE, hiện đại" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Bộ name (mỗi dòng: gốc=dịch)</label>
                        <textarea id="${APP_PREFIX}nameSet" class="${APP_PREFIX}textarea" placeholder="Ví dụ:\n张三=Trương Tam\n李四=Lý Tứ"></textarea>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Tên gốc (CN)</label>
                        <input id="${APP_PREFIX}titleCn" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Tên tác giả (CN)</label>
                        <input id="${APP_PREFIX}authorCn" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Tên dịch (VI)</label>
                        <input id="${APP_PREFIX}titleVi" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Mô tả dịch (VI)</label>
                        <textarea id="${APP_PREFIX}descVi" class="${APP_PREFIX}textarea"></textarea>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Cover URL</label>
                        <input id="${APP_PREFIX}coverUrl" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}grid ${APP_PREFIX}row">
                        <div>
                            <label class="${APP_PREFIX}label">Tình trạng (radio)</label>
                            <select id="${APP_PREFIX}status" class="${APP_PREFIX}select"></select>
                        </div>
                        <div>
                            <label class="${APP_PREFIX}label">Tính chất (radio)</label>
                            <select id="${APP_PREFIX}official" class="${APP_PREFIX}select"></select>
                        </div>
                        <div>
                            <label class="${APP_PREFIX}label">Giới tính (radio)</label>
                            <select id="${APP_PREFIX}gender" class="${APP_PREFIX}select"></select>
                        </div>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Thời đại (nhập label, phân cách dấu phẩy)</label>
                        <input id="${APP_PREFIX}age" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Kết thúc (nhập label, phân cách dấu phẩy)</label>
                        <input id="${APP_PREFIX}ending" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Loại hình (nhập label, phân cách dấu phẩy)</label>
                        <input id="${APP_PREFIX}genre" class="${APP_PREFIX}input" />
                    </div>
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">Tag (nhập label, phân cách dấu phẩy)</label>
                        <textarea id="${APP_PREFIX}tag" class="${APP_PREFIX}textarea"></textarea>
                    </div>
                    <div class="${APP_PREFIX}row">
                        <button id="${APP_PREFIX}apply" class="${APP_PREFIX}btn">Áp vào form</button>
                    </div>
                    <div class="${APP_PREFIX}row ${APP_PREFIX}hint">
                        Tip: có thể sửa text/label trong panel rồi bấm "Áp vào form".
                    </div>
                </div>
            </div>
            <div id="${APP_PREFIX}helpModal" class="${APP_PREFIX}modal">
                <div class="${APP_PREFIX}modal-card">
                    <div class="${APP_PREFIX}modal-title">Hướng dẫn nhanh</div>
                    <div class="${APP_PREFIX}modal-body">
Các web hỗ trợ: Fanqie (Cà Chua), JJWXC (Tấn Giang).
Các bước sử dụng:
1) Dán link Web Trung vào ô URL rồi bấm "Lấy dữ liệu".
2) Script sẽ dịch tên/mô tả/tag và gợi ý tick các mục phù hợp.
3) Bạn có thể chỉnh lại nội dung, tag, thể loại trước khi áp.
4) Bấm "Áp vào form" để điền và tick tự động + upload ảnh bìa.
5) Nếu sai gợi ý, sửa trực tiếp trong panel rồi áp lại.
Lưu ý: Phải là link có thông tin sách, không phải link chương.
                    </div>
                    <div class="${APP_PREFIX}modal-actions">
                        <button id="${APP_PREFIX}helpClose" class="${APP_PREFIX}btn secondary">Đóng</button>
                    </div>
                </div>
            </div>
            <div id="${APP_PREFIX}settingsModal" class="${APP_PREFIX}modal">
                <div class="${APP_PREFIX}modal-card">
                    <div class="${APP_PREFIX}modal-title">Cài đặt</div>
                    <div class="${APP_PREFIX}modal-body">
                        <div class="${APP_PREFIX}row">
                            <label class="${APP_PREFIX}label">Độ chính xác gợi ý (0.50 - 0.99)</label>
                            <input id="${APP_PREFIX}settingThreshold" class="${APP_PREFIX}input" type="number" min="0.5" max="0.99" step="0.01" />
                        </div>
                        <div class="${APP_PREFIX}row">
                            <label class="${APP_PREFIX}label">Quét văn án để gợi ý</label>
                            <div class="${APP_PREFIX}settings-group">
                                <label class="${APP_PREFIX}settings-item">
                                    <input id="${APP_PREFIX}settingUseDescFanqie" type="checkbox" />
                                    Fanqie (Cà Chua)
                                </label>
                                <label class="${APP_PREFIX}settings-item">
                                    <input id="${APP_PREFIX}settingUseDescJjwxc" type="checkbox" />
                                    JJWXC (Tấn Giang)
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="${APP_PREFIX}modal-actions">
                        <button id="${APP_PREFIX}settingsSave" class="${APP_PREFIX}btn">Lưu</button>
                        <button id="${APP_PREFIX}settingsClose" class="${APP_PREFIX}btn secondary">Đóng</button>
                    </div>
                </div>
            </div>
        `;

        const btn = shadowRoot.getElementById(`${APP_PREFIX}btn`);
        const panel = shadowRoot.getElementById(`${APP_PREFIX}panel`);
        const headerEl = shadowRoot.getElementById(`${APP_PREFIX}header`);
        const close = shadowRoot.getElementById(`${APP_PREFIX}close`);
        const helpBtn = shadowRoot.getElementById(`${APP_PREFIX}help`);
        const helpModal = shadowRoot.getElementById(`${APP_PREFIX}helpModal`);
        const helpClose = shadowRoot.getElementById(`${APP_PREFIX}helpClose`);
        const settingsBtn = shadowRoot.getElementById(`${APP_PREFIX}settings`);
        const settingsModal = shadowRoot.getElementById(`${APP_PREFIX}settingsModal`);
        const settingsSave = shadowRoot.getElementById(`${APP_PREFIX}settingsSave`);
        const settingsClose = shadowRoot.getElementById(`${APP_PREFIX}settingsClose`);
        const settingsThreshold = shadowRoot.getElementById(`${APP_PREFIX}settingThreshold`);
        const settingsUseDescFanqie = shadowRoot.getElementById(`${APP_PREFIX}settingUseDescFanqie`);
        const settingsUseDescJjwxc = shadowRoot.getElementById(`${APP_PREFIX}settingUseDescJjwxc`);
        const logBox = shadowRoot.getElementById(`${APP_PREFIX}log`);
        if (!showFloatingButton) btn.style.display = 'none';

        function log(message, type) {
            const line = document.createElement('div');
            line.textContent = message;
            if (type === 'error') line.style.color = '#ff8080';
            if (type === 'warn') line.style.color = '#ffd166';
            if (type === 'ok') line.style.color = '#9ef01a';
            logBox.appendChild(line);
            logBox.scrollTop = logBox.scrollHeight;
        }

        function fillSelect(selectEl, options, suggested) {
            selectEl.innerHTML = '';
            const empty = document.createElement('option');
            empty.value = '';
            empty.textContent = '--- Tự động ---';
            selectEl.appendChild(empty);
            options.forEach(opt => {
                const o = document.createElement('option');
                o.value = opt.label;
                o.textContent = opt.label || '(trống)';
                selectEl.appendChild(o);
            });
            if (suggested) selectEl.value = suggested;
        }

        function fillText(id, value) {
            shadowRoot.getElementById(id).value = value || '';
        }

        function applySettingsToUi(settings) {
            settingsThreshold.value = Number.isFinite(settings.scoreThreshold)
                ? settings.scoreThreshold.toFixed(2)
                : DEFAULT_SCORE_THRESHOLD.toFixed(2);
            settingsUseDescFanqie.checked = !!settings.useDescByDomain?.fanqie;
            settingsUseDescJjwxc.checked = !!settings.useDescByDomain?.jjwxc;
        }

        function readSettingsFromUi() {
            return {
                scoreThreshold: parseFloat(settingsThreshold.value),
                useDescByDomain: {
                    fanqie: settingsUseDescFanqie.checked,
                    jjwxc: settingsUseDescJjwxc.checked,
                },
            };
        }

        async function handleFetch() {
            logBox.innerHTML = '';
            try {
                if (!state.groups) state.groups = getGroupOptions();
                const urlInput = shadowRoot.getElementById(`${APP_PREFIX}url`);
                const sourceInfo = detectSource(urlInput.value);
                if (!sourceInfo || !sourceInfo.id) {
                    log('URL không hợp lệ.', 'error');
                    return;
                }
                log(`Nguồn: ${sourceInfo.type} | ID: ${sourceInfo.id}`);
                GM_setValue(`${APP_PREFIX}last_url`, urlInput.value);
                let raw = null;
                let sourceData = null;
                if (sourceInfo.type === 'fanqie') {
                    log('Đang gọi API Fanqie...');
                    raw = await fetchFanqieData(sourceInfo.id);
                    sourceData = normalizeFanqieData(raw);
                    log(`Fanqie OK: ${sourceData.titleCn || '(no title)'}`, 'ok');
                } else if (sourceInfo.type === 'jjwxc') {
                    log('Đang gọi API JJWXC...');
                    raw = await fetchJjwxcData(sourceInfo.id);
                    sourceData = normalizeJjwxcData(raw);
                    if (sourceData.coverUrl) {
                        log('Đang xử lý ảnh bìa JJWXC...');
                        sourceData.coverUrl = await processJjwxcCover(sourceData.coverUrl);
                    }
                    log(`JJWXC OK: ${sourceData.titleCn || '(no title)'}`, 'ok');
                } else {
                    log('Nguồn chưa hỗ trợ.', 'error');
                    return;
                }
                state.rawData = raw;
                state.sourceData = sourceData;
                state.sourceType = sourceInfo.type;
                state.sourceLabel = sourceData.sourceLabel;
                log('Đã lấy dữ liệu. Đang dịch...');

                const titleCn = safeText(sourceData.titleCn);
                const authorCn = safeText(sourceData.authorCn);
                const descCn = safeText(sourceData.descCn);
                const nameSetRaw = shadowRoot.getElementById(`${APP_PREFIX}nameSet`).value;
                const nameSet = parseNameSet(nameSetRaw);
                state.nameSet = nameSet;
                GM_setValue(`${APP_PREFIX}name_set`, nameSetRaw);
                const tagsRaw = sourceData.tags || [];
                const categoryNames = sourceData.categories || [];

                log(`Dịch tiêu đề (${titleCn.length} ký tự)...`);
                const titleVi = await translateTextWithNameSet(titleCn, nameSet, false);
                log('Dịch tiêu đề xong.', 'ok');
                log(`Dịch mô tả (${descCn.length} ký tự)...`);
                const descVi = await translateTextWithNameSet(descCn, nameSet, true);
                log('Dịch mô tả xong.', 'ok');
                if (tagsRaw.length) log(`Dịch tags (${tagsRaw.length})...`);
                const tagsVi = await translateList(tagsRaw);
                if (tagsRaw.length) log('Dịch tags xong.', 'ok');
                if (categoryNames.length) log(`Dịch thể loại (${categoryNames.length})...`);
                const catsVi = await translateList(categoryNames);
                if (categoryNames.length) log('Dịch thể loại xong.', 'ok');

                state.translated = {
                    titleVi,
                    desc: descVi,
                    tags: tagsVi,
                    categories: catsVi,
                };

                log('Đang tạo gợi ý tick...');
                const suggestions = buildSuggestions(sourceData, state.translated, state.groups);
                state.suggestions = suggestions;
                log('Tạo gợi ý xong.', 'ok');

                log('Dịch xong. Đang tạo gợi ý...');
                fillText(`${APP_PREFIX}titleCn`, titleCn);
                fillText(`${APP_PREFIX}authorCn`, authorCn);
                fillText(`${APP_PREFIX}titleVi`, titleVi);
                fillText(`${APP_PREFIX}descVi`, descVi);
                fillText(`${APP_PREFIX}coverUrl`, sourceData.coverUrl || '');

                fillSelect(shadowRoot.getElementById(`${APP_PREFIX}status`), state.groups.status, suggestions.status);
                fillSelect(shadowRoot.getElementById(`${APP_PREFIX}official`), state.groups.official, suggestions.official);
                fillSelect(shadowRoot.getElementById(`${APP_PREFIX}gender`), state.groups.gender, suggestions.gender);

                fillText(`${APP_PREFIX}age`, suggestions.age.join(', '));
                fillText(`${APP_PREFIX}ending`, suggestions.ending.join(', '));
                fillText(`${APP_PREFIX}genre`, suggestions.genre.join(', '));
                fillText(`${APP_PREFIX}tag`, suggestions.tag.join(', '));

                log('Gợi ý sẵn sàng. Bạn có thể chỉnh rồi bấm "Áp vào form".', 'ok');
            } catch (err) {
                log('Lỗi: ' + err.message, 'error');
            }
        }

        function handleRecompute() {
            if (!state.sourceData || !state.groups) {
                log('Chưa có dữ liệu để recompute.', 'warn');
                return;
            }
            const extra = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}extraKeywords`).value);
            const baseKeywords = buildKeywordList(state.sourceData, state.translated);
            const combinedKeywords = baseKeywords.concat(extra);
            const descCn = safeText(state.sourceData.descCn);
            const descVi = safeText(state.translated?.desc || '');
            const useDesc = shouldUseDescForSource(state.sourceData?.sourceType);
            const textParts = [combinedKeywords.join(' ')];
            if (useDesc) textParts.unshift(descCn, descVi);
            const textBlob = textParts.join(' ');

            const threshold = getScoreThreshold();
            const suggestions = {
                status: state.suggestions?.status || '',
                official: state.suggestions?.official || '',
                gender: state.suggestions?.gender || '',
                age: pickMulti(scoreOptions(state.groups.age, combinedKeywords, textBlob), 4, true, false, threshold),
                ending: pickMulti(scoreOptions(state.groups.ending, combinedKeywords, textBlob), 3, true, false, threshold),
                genre: pickMulti(scoreOptions(state.groups.genre, combinedKeywords, textBlob), 8, true, false, threshold),
                tag: pickMulti(scoreOptions(state.groups.tag, combinedKeywords, textBlob), MAX_TAGS_SELECT, true, true, threshold),
            };
            state.suggestions = { ...state.suggestions, ...suggestions };
            fillText(`${APP_PREFIX}age`, suggestions.age.join(', '));
            fillText(`${APP_PREFIX}ending`, suggestions.ending.join(', '));
            fillText(`${APP_PREFIX}genre`, suggestions.genre.join(', '));
            fillText(`${APP_PREFIX}tag`, suggestions.tag.join(', '));
            log('Đã recompute theo từ khóa bổ sung.', 'ok');
        }

        async function handleApply() {
            if (!state.groups) state.groups = getGroupOptions();
            const titleCn = shadowRoot.getElementById(`${APP_PREFIX}titleCn`).value;
            const authorCn = shadowRoot.getElementById(`${APP_PREFIX}authorCn`).value;
            const titleVi = shadowRoot.getElementById(`${APP_PREFIX}titleVi`).value;
            const descVi = shadowRoot.getElementById(`${APP_PREFIX}descVi`).value;
            const coverUrl = shadowRoot.getElementById(`${APP_PREFIX}coverUrl`).value;
            const sourceUrl = shadowRoot.getElementById(`${APP_PREFIX}url`).value;

            setInputValue(document.getElementById('txtTitleCn'), titleCn);
            setInputValue(document.getElementById('txtAuthorCn'), authorCn);
            setInputValue(document.getElementById('txtTitleVi'), titleVi);
            setInputValue(document.getElementById('txtDescVi'), descVi);

            const statusSel = shadowRoot.getElementById(`${APP_PREFIX}status`).value;
            const officialSel = shadowRoot.getElementById(`${APP_PREFIX}official`).value;
            const genderSel = shadowRoot.getElementById(`${APP_PREFIX}gender`).value;

            applyRadio(state.groups.status, statusSel || state.suggestions?.status);
            applyRadio(state.groups.official, officialSel || state.suggestions?.official);
            applyRadio(state.groups.gender, genderSel || state.suggestions?.gender);

            const ageList = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}age`).value);
            const endingList = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}ending`).value);
            const genreList = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}genre`).value);
            const tagList = parseLabelList(shadowRoot.getElementById(`${APP_PREFIX}tag`).value);

            applyCheckboxes(state.groups.age, ageList.length ? ageList : state.suggestions?.age || []);
            applyCheckboxes(state.groups.ending, endingList.length ? endingList : state.suggestions?.ending || []);
            applyCheckboxes(state.groups.genre, genreList.length ? genreList : state.suggestions?.genre || []);
            applyCheckboxes(state.groups.tag, tagList.length ? tagList : state.suggestions?.tag || []);

            const sourceLabel = state.sourceLabel || 'Nguồn';
            setMoreLink(sourceLabel, sourceUrl);
            await applyCover(coverUrl, log);
            log('Đã áp dữ liệu vào form.', 'ok');
        }

        let dragging = false;
        let dragMoved = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        const savedPos = GM_getValue(`${APP_PREFIX}btn_pos`, null);
        if (savedPos && Number.isFinite(savedPos.left) && Number.isFinite(savedPos.top)) {
            btn.style.left = `${savedPos.left}px`;
            btn.style.top = `${savedPos.top}px`;
            btn.style.right = 'auto';
            btn.style.bottom = 'auto';
        }

        function getPoint(ev) {
            if (ev.touches && ev.touches.length) return ev.touches[0];
            return ev;
        }

        function onDragStart(ev) {
            const point = getPoint(ev);
            const rect = btn.getBoundingClientRect();
            dragging = true;
            dragMoved = false;
            dragOffsetX = point.clientX - rect.left;
            dragOffsetY = point.clientY - rect.top;
            ev.preventDefault();
        }

        function onDragMove(ev) {
            if (!dragging) return;
            const point = getPoint(ev);
            const rect = btn.getBoundingClientRect();
            const left = Math.max(0, Math.min(window.innerWidth - rect.width, point.clientX - dragOffsetX));
            const top = Math.max(0, Math.min(window.innerHeight - rect.height, point.clientY - dragOffsetY));
            btn.style.left = `${left}px`;
            btn.style.top = `${top}px`;
            btn.style.right = 'auto';
            btn.style.bottom = 'auto';
            dragMoved = true;
            ev.preventDefault();
        }

        function onDragEnd() {
            if (!dragging) return;
            dragging = false;
            const rect = btn.getBoundingClientRect();
            GM_setValue(`${APP_PREFIX}btn_pos`, { left: Math.round(rect.left), top: Math.round(rect.top) });
        }

        btn.addEventListener('mousedown', onDragStart);
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
        btn.addEventListener('touchstart', onDragStart, { passive: false });
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);

        const openPanel = () => { panel.style.display = 'flex'; };
        const closePanel = () => { panel.style.display = 'none'; };
        const togglePanel = () => {
            const isHidden = getComputedStyle(panel).display === 'none';
            panel.style.display = isHidden ? 'flex' : 'none';
        };

        function enableDrag(panelEl, handleEl, storageKey) {
            let dragging = false;
            let offsetX = 0;
            let offsetY = 0;
            const saved = GM_getValue(storageKey, null);
            if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
                panelEl.style.left = `${saved.left}px`;
                panelEl.style.top = `${saved.top}px`;
                panelEl.style.right = 'auto';
                panelEl.style.bottom = 'auto';
            }

            const getPoint = (ev) => (ev.touches && ev.touches.length ? ev.touches[0] : ev);

            const onStart = (ev) => {
                if (ev.target && ev.target.closest('button')) return;
                const point = getPoint(ev);
                const rect = panelEl.getBoundingClientRect();
                dragging = true;
                offsetX = point.clientX - rect.left;
                offsetY = point.clientY - rect.top;
                panelEl.style.left = rect.left + 'px';
                panelEl.style.top = rect.top + 'px';
                panelEl.style.right = 'auto';
                panelEl.style.bottom = 'auto';
                ev.preventDefault();
            };

            const onMove = (ev) => {
                if (!dragging) return;
                const point = getPoint(ev);
                const rect = panelEl.getBoundingClientRect();
                const maxLeft = Math.max(0, window.innerWidth - rect.width);
                const maxTop = Math.max(0, window.innerHeight - rect.height);
                const left = Math.max(0, Math.min(maxLeft, point.clientX - offsetX));
                const top = Math.max(0, Math.min(maxTop, point.clientY - offsetY));
                panelEl.style.left = `${left}px`;
                panelEl.style.top = `${top}px`;
                ev.preventDefault();
            };

            const onEnd = () => {
                if (!dragging) return;
                dragging = false;
                const rect = panelEl.getBoundingClientRect();
                GM_setValue(storageKey, { left: Math.round(rect.left), top: Math.round(rect.top) });
            };

            handleEl.addEventListener('mousedown', onStart);
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            handleEl.addEventListener('touchstart', onStart, { passive: false });
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onEnd);
        }

        enableDrag(panel, headerEl, `${APP_PREFIX}panel_pos`);

        btn.addEventListener('click', () => {
            if (dragMoved) return;
            togglePanel();
        });
        close.addEventListener('click', () => {
            closePanel();
        });
        helpBtn.addEventListener('click', () => {
            helpModal.style.display = 'flex';
        });
        helpClose.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
        helpModal.addEventListener('click', (ev) => {
            if (ev.target === helpModal) helpModal.style.display = 'none';
        });
        settingsBtn.addEventListener('click', () => {
            applySettingsToUi(state.settings || DEFAULT_SETTINGS);
            settingsModal.style.display = 'flex';
        });
        settingsClose.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });
        settingsModal.addEventListener('click', (ev) => {
            if (ev.target === settingsModal) settingsModal.style.display = 'none';
        });
        settingsSave.addEventListener('click', () => {
            const next = readSettingsFromUi();
            saveSettings(next);
            settingsModal.style.display = 'none';
            log('Đã lưu cài đặt.', 'ok');
        });

        shadowRoot.getElementById(`${APP_PREFIX}fetch`).addEventListener('click', handleFetch);
        shadowRoot.getElementById(`${APP_PREFIX}recompute`).addEventListener('click', handleRecompute);
        shadowRoot.getElementById(`${APP_PREFIX}apply`).addEventListener('click', handleApply);

        const last = GM_getValue(`${APP_PREFIX}last_url`, '');
        if (last) shadowRoot.getElementById(`${APP_PREFIX}url`).value = last;
        const nameSetSaved = GM_getValue(`${APP_PREFIX}name_set`, '');
        if (nameSetSaved) shadowRoot.getElementById(`${APP_PREFIX}nameSet`).value = nameSetSaved;
        shadowRoot.getElementById(`${APP_PREFIX}nameSet`).addEventListener('input', (ev) => {
            GM_setValue(`${APP_PREFIX}name_set`, ev.target.value || '');
        });
        log('Sẵn sàng. Dán link Fanqie rồi bấm "Lấy dữ liệu".');

        return {
            open: openPanel,
            close: closePanel,
            toggle: togglePanel,
            shadowRoot,
        };
    }

    function initAutofill(options = {}) {
        if (!/\/nhung-file$/.test(location.pathname)) return null;
        if (instance) {
            if (options.openOnInit && instance.open) instance.open();
            return instance;
        }
        instance = createUI(options);
        if (options.openOnInit && instance.open) instance.open();
        return instance;
    }

    global.WDA_InitAutofill = initAutofill;
})(window);
