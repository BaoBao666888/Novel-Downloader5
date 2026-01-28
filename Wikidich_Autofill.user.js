// ==UserScript==
// @name         Wikidich Autofill (Library)
// @namespace    http://tampermonkey.net/
// @version      0.3.0
// @description  Lấy thông tin từ web Trung (Fanqie/JJWXC/PO18/Ihuaben/Qidian/Qimao/Gongzicp), dịch và tự tick/điền form nhúng truyện trên truyenwikidich.net.
// @author       QuocBao
// ==/UserScript==

(function (global) {
    'use strict';
    let instance = null;

    const APP_PREFIX = 'WDA_';
    const AUTOFILL_WIKIDICH_VERSION = '0.3.0'
    const SERVER_URL = 'https://dichngay.com/translate/text';
    const MAX_CHARS = 4500;
    const REQUEST_DELAY_MS = 350;
    const DEFAULT_SCORE_THRESHOLD = 0.90;
    const SCORE_FALLBACK = 0.65;
    const MAX_TAGS_SELECT = 25;
    const ROOT_NEG_WORDS = ['vo', 'khong', 'phi', 'chong', 'phan', 'non', 'no'];
    const ROOT_MODIFIERS = new Set([
        'song', 'nhieu', 'main', 'ca', 'nha', 'nu', 'nam', 'trang', 'phan', 'sat',
        'la', 'toan', 'tap', 'the'
    ]);

    const DEFAULT_SETTINGS = {
        scoreThreshold: DEFAULT_SCORE_THRESHOLD,
        aiMode: 'auto', // 'auto' or 'ai'
        geminiApiKey: '',
        geminiModel: 'gemini-2.5-flash',
        domainSettings: {
            fanqie: { label: 'Fanqie (Cà Chua)', useDesc: true, target: 'wiki' },
            jjwxc: { label: 'Tấn Giang (JJWXC)', useDesc: false, target: 'wiki' },
            po18: { label: 'PO18', useDesc: true, target: 'webhong' },
            ihuaben: { label: 'Ihuaben', useDesc: true, target: 'wiki' },
            qidian: { label: 'Khởi Điểm (Qidian)', useDesc: true, target: 'wiki' },
            qimao: { label: 'Thất Miêu (Qimao)', useDesc: true, target: 'wiki' },
            gongzicp: { label: 'Trường Bội (Gongzicp)', useDesc: true, target: 'wiki' }, // New
        },
    };

    const SETTINGS_KEY = 'Wikidich_Autofill_Config';

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
    // --- UTILS ---
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function clampNumber(val, min, max, def) {
        const n = parseFloat(val);
        if (isNaN(n)) return def;
        return Math.max(min, Math.min(n, max));
    }

    function normalizeSettings(raw) {
        // Deep copy default
        const base = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

        if (!raw || typeof raw !== 'object') return base;

        if ('scoreThreshold' in raw) base.scoreThreshold = raw.scoreThreshold;
        if (raw.aiMode) base.aiMode = raw.aiMode;
        if (raw.geminiApiKey) base.geminiApiKey = raw.geminiApiKey;
        if (raw.geminiModel) base.geminiModel = raw.geminiModel;
        // old
        const oldMap = raw.useDescByDomain;
        if (oldMap && typeof oldMap === 'object') {
            Object.keys(base.domainSettings).forEach(key => {
                if (typeof oldMap[key] === 'boolean') {
                    base.domainSettings[key].useDesc = oldMap[key];
                }
            });
        }
        // new
        if (raw.domainSettings && typeof raw.domainSettings === 'object') {
            Object.keys(base.domainSettings).forEach(key => {
                if (raw.domainSettings[key]) {
                    const saved = raw.domainSettings[key];
                    if (typeof saved.useDesc === 'boolean') base.domainSettings[key].useDesc = saved.useDesc;
                    if (saved.target) base.domainSettings[key].target = saved.target;
                }
            });
        }

        return base;
    }

    function loadSettings() {
        const raw = GM_getValue(SETTINGS_KEY, {});
        const s = normalizeSettings(raw);
        s.scoreThreshold = clampNumber(s.scoreThreshold, 0.5, 0.99, DEFAULT_SCORE_THRESHOLD);
        return s;
    }

    function saveSettings(newSettings) {
        const s = normalizeSettings(newSettings);
        GM_setValue(SETTINGS_KEY, s);
        state.settings = s;
    }

    function getScoreThreshold() {
        if (state.settings && Number.isFinite(state.settings.scoreThreshold)) {
            return state.settings.scoreThreshold;
        }
        return DEFAULT_SCORE_THRESHOLD;
    }

    function getDomainSetting(sourceType) {
        const def = DEFAULT_SETTINGS.domainSettings[sourceType];
        if (!state.settings || !state.settings.domainSettings) return def;
        return state.settings.domainSettings[sourceType] || def;
    }

    function shouldUseDescForSource(sourceType) {
        const conf = getDomainSetting(sourceType);
        return conf ? conf.useDesc : true;
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

    function splitTokens(text) {
        return normalizeText(text).split(' ').filter(Boolean);
    }

    // --- HELP & CHANGELOG CONTENT ---
    const CHANGELOG_CONTENT = `
<h2><span style="color:#673ab7; font-size: 1.2em;">🚀 Phiên bản 0.3.0 - Big Update!</span></h2>
<ul style="list-style-type: none; padding-left: 0;">
    <li><b>🌊 Trường Bội (Gongzicp):</b> Hỗ trợ "tận răng" (Cover HD, Tự động lọc query).</li>
    <li><b>🧠 Auto Smart:</b> Chuẩn hóa logic nhận diện, thông minh hơn gấp 3 lần!</li>
    <li><b>📊 Bảng Điều Khiển:</b> Tùy chỉnh "Hiển thị" & "Quét văn án" visual cực mạnh trong Settings.</li>
    <li><b>✨ AI Gemini:</b> "Bảo bối" phân tích tag/thể loại siêu chuẩn (cần API Key).</li>
</ul>`;

    const WELCOME_CONTENT = `
<h2 style="text-align:center; color:#2196f3;">Chào mừng đến với <span style="color:#e91e63;">Wikidich Autofill</span>!</h2>
<p style="text-align:center; font-style:italic; color:#666;">Tool "thần thánh" hỗ trợ convert web Trung sang Wikidich 1 chạm.</p>

<div style="background:#f4f6f8; padding: 12px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #4caf50;">
    <h3 style="margin-top:0; color:#2e7d32;">🌟 Quy trình sử dụng chuẩn:</h3>
    <ol style="margin-left: 15px; padding-left: 0;">
        <li><b>Bước 1:</b> Copy link truyện (Fanqie/JJWXC/PO18/...).</li>
        <li><b>Bước 2:</b> Dán vào ô URL > Bấm nút <b style="color:#2196f3;">Lấy dữ liệu</b> (hoặc nút <b style="color:#e91e63;">AI</b>).</li>
        <li><b>Bước 3:</b> Chờ tool chạy dịch và phân tích (Auto hoặc AI).</li>
        <li><b>Bước 4:</b> Kiểm tra các ô thông tin trên bảng Panel (Tag, Thể loại...).</li>
        <li><b>Bước 5:</b> Nếu OK, bấm nút <b style="color:#ff9800;">Áp vào form</b> dưới cùng.</li>
        <li><b>Bước 6:</b> Bấm <b style="color:green;">Nhúng</b> của Web để đăng!</li>
    </ol>
</div>

<h3>🔥 Tính năng AI (Mới):</h3>
<ul style="list-style-type: none; padding-left: 5px;">
    <li>🔑 <b>Cần API Key:</b> Vào ⚙️ Cài đặt nhập Key từ Google AI Studio.</li>
    <li>🧠 <b>Thông minh hơn:</b> AI đọc hiểu văn án để chọn tag (VD: "Gương vỡ lại lành" dù văn án không ghi rõ).</li>
    <li>🛡️ <b>Kiểm duyệt:</b> Tự động lọc bỏ các tag "rác" không có trong hệ thống Wikidich.</li>
</ul>


<h3>🌍 Các Trang Hỗ Trợ:</h3>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
    
    <!-- Fanqie -->
    <div style="background: #fff3e0; padding: 8px; border-radius: 6px; border-left: 3px solid #ff9800;">
        <strong style="color: #ef6c00;">🍅 Fanqie (Cà Chua)</strong><br>
        <small style="color: #666;">• Link: <code>fanqienovel.com/page/123...</code></small><br>
        <span style="font-size:11px; color:#444;">✨ Full info + Cover gốc (Full HD)</span>
    </div>

    <!-- JJWXC -->
    <div style="background: #e3f2fd; padding: 8px; border-radius: 6px; border-left: 3px solid #2196f3;">
        <strong style="color: #1565c0;">🌿 Tấn Giang (JJWXC)</strong><br>
        <small style="color: #666;">• Link: <code>jjwxc.net/onebook.php?novelid=...</code></small><br>
        <span style="font-size:11px; color:#444;">✨ Cover HD + Full info + Tag chuẩn</span>
    </div>

    <!-- Gongzicp -->
    <div style="background: #f3e5f5; padding: 8px; border-radius: 6px; border-left: 3px solid #9c27b0;">
        <strong style="color: #7b1fa2;">🌊 Trường Bội (Gongzicp)</strong><br>
        <small style="color: #666;">• Link: <code>gongzicp.com/novel-123...</code></small><br>
        <span style="font-size:11px; color:#444;">✨ Cover HD (nếu có) + Lọc Tag xịn</span>
    </div>

    <!-- PO18 -->
    <div style="background: #ffebee; padding: 8px; border-radius: 6px; border-left: 3px solid #e91e63;">
        <strong style="color: #c2185b;">🔞 PO18</strong><br>
        <small style="color: #666;">• Link: <code>po18.tw/books/123...</code></small><br>
        <span style="font-size:11px; color:#444;">✨ Lấy info cơ bản</span>
    </div>

    <!-- Qidian -->
    <div style="background: #eceff1; padding: 8px; border-radius: 6px; border-left: 3px solid #607d8b;">
        <strong style="color: #455a64;">📖 Khởi Điểm (Qidian)</strong><br>
        <small style="color: #666;">• Link: <code>qidian.com/book/123...</code></small><br>
        <span style="font-size:11px; color:#444;">✨ Full info</span>
    </div>

    <!-- Others -->
    <div style="background: #f1f8e9; padding: 8px; border-radius: 6px; border-left: 3px solid #8bc34a;">
        <strong style="color: #558b2f;">📚 IHuaben & Thất Miêu</strong><br>
        <small style="color: #666;">• Hỗ trợ cơ bản</small><br>
        <span style="font-size:11px; color:#444;">✨ Tự động nhận diện</span>
    </div>

</div>

<hr style="border: 0; border-top: 1px dashed #ccc; margin: 15px 0;">
` + CHANGELOG_CONTENT;

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

    function extractPo18Id(url) {
        const raw = safeText(url);
        const m = raw.match(/\/books\/(\d+)/i);
        return m ? m[1] : '';
    }

    function extractIhuabenId(url) {
        const raw = safeText(url);
        const m = raw.match(/\/book\/(\d+)/i);
        return m ? m[1] : '';
    }

    function extractQidianId(url) {
        const raw = safeText(url);
        const m = raw.match(/\/book\/(\d+)/i);
        return m ? m[1] : '';
    }

    function extractQimaoId(url) {
        const raw = safeText(url);
        let m = raw.match(/\/shuku\/(\d+)/i);
        if (m) return m[1];
        m = raw.match(/(\d+)(?:-\d+)?\/?$/i);
        return m ? m[1] : '';
    }

    function extractGongzicpId(url) {
        const raw = safeText(url);
        const m = raw.match(/novel-?(\d+)/);
        return m ? m[1] : '';
    }

    function detectSource(url) {
        const raw = safeText(url);
        if (/fanqienovel\.com/i.test(raw)) {
            return { type: 'fanqie', id: extractBookId(raw) };
        }
        if (/jjwxc\.net/i.test(raw) || /novelid=/i.test(raw) || /book2\//i.test(raw)) {
            return { type: 'jjwxc', id: extractJjwxcId(raw) };
        }
        if (/po18\.tw/i.test(raw)) {
            return { type: 'po18', id: extractPo18Id(raw) };
        }
        if (/ihuaben\.com/i.test(raw)) {
            return { type: 'ihuaben', id: extractIhuabenId(raw) };
        }
        if (/qidian\.com/i.test(raw)) {
            return { type: 'qidian', id: extractQidianId(raw) };
        }
        if (/qimao\.com/i.test(raw)) {
            return { type: 'qimao', id: extractQimaoId(raw) };
        }
        if (/gongzicp\.com/i.test(raw)) {
            return { type: 'gongzicp', id: extractGongzicpId(raw) };
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

    function toAbsoluteUrl(url, baseUrl) {
        const raw = safeText(url);
        if (!raw) return '';
        if (/^https?:\/\//i.test(raw)) return raw;
        if (raw.startsWith('//')) return `https:${raw}`;
        try {
            return new URL(raw, baseUrl).toString();
        } catch {
            return raw;
        }
    }

    function queryText(doc, selectors) {
        for (const sel of selectors) {
            const el = doc.querySelector(sel);
            const text = safeText(el?.textContent || '');
            if (text) return text;
        }
        return '';
    }

    function queryHtml(doc, selectors) {
        for (const sel of selectors) {
            const el = doc.querySelector(sel);
            const html = safeText(el?.innerHTML || '');
            if (html) return html;
        }
        return '';
    }

    function queryAttr(doc, selectors, attr) {
        for (const sel of selectors) {
            const el = doc.querySelector(sel);
            if (!el) continue;
            const val = el.getAttribute(attr)
                || el.getAttribute('data-src')
                || el.getAttribute('data-original')
                || el.getAttribute('data-lazy');
            const text = safeText(val || '');
            if (text) return text;
        }
        return '';
    }

    function collectTexts(doc, selectors) {
        const results = [];
        selectors.forEach((sel) => {
            doc.querySelectorAll(sel).forEach((el) => {
                const text = safeText(el.textContent || '');
                if (text) results.push(text);
            });
        });
        return results;
    }

    function extractInfoPairs(doc) {
        const pairs = [];
        const items = doc.querySelectorAll(
            '.book_info li, .book_info .info, .book_info .item, .book_data li, .book_detail li, .book_detail .info, .book_detail .item'
        );
        items.forEach((el) => {
            const text = safeText(el.textContent || '');
            if (!text) return;
            const parts = text.split(/[:：]/);
            if (parts.length < 2) return;
            const key = safeText(parts.shift());
            const value = safeText(parts.join(':'));
            if (key && value) pairs.push({ key, value });
        });
        return pairs;
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

    function fetchPo18Data(bookId) {
        const baseUrl = 'https://www.po18.tw';
        const primaryUrl = `${baseUrl}/books/${bookId}`;
        const fallbackUrl = `${baseUrl}/books/${bookId}/articles`;

        const guardLogin = (html) => {
            if (!html) return;
            const lower = html.toLowerCase();
            if (html.includes('會員登入') || html.includes('會員登錄') || lower.includes('login.php')) {
                throw new Error('Cookie PO18 hết hạn / chưa đăng nhập.');
            }
        };

        const parseHtml = (html, url) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html || '', 'text/html');
            const title = queryText(doc, ['h1.book_name', '.book_name', '.book_title', 'h1']);
            const author = queryText(doc, ['.book_author', '.book_author a', '.book_info .author', '.author']);
            const cover = queryAttr(doc, [
                '.book_cover img',
                '.book_cover>img',
                '.cover img',
                'meta[property="og:image"]',
            ], 'content') || queryAttr(doc, ['.book_cover img', '.book_cover>img', '.cover img'], 'src');
            const introHtml = queryHtml(doc, [
                '.book_intro .B_I_content',
                '.book_intro',
                '#book_intro',
                '.book_intro_txt',
                '.book_desc',
                '.book_introduction',
                '.intro',
            ]);
            let intro = introHtml ? htmlToText(introHtml) : '';

            const tagTexts = collectTexts(doc, [
                '.book_intro_tags a',
                '.book_tag a',
                '.book_tag span',
                '.book_tags a',
                '.book_tags span',
                '.tag_list a',
                '.tag_list span',
                '.tags a',
                '.tags span',
                'a[href*="tag"]',
                'a[href*="tags"]',
            ]);

            let statusHint = queryText(doc, ['.book_info .statu', '.book_info .status', '.statu', '.status']);
            const categories = [];
            const tags = [];
            extractInfoPairs(doc).forEach(({ key, value }) => {
                if (/(標籤|标签|tag)/i.test(key)) {
                    tags.push(...parseTagList(value));
                } else if (/(分類|类别|類別|题材|題材|类型|類型)/i.test(key)) {
                    categories.push(...parseTagList(value));
                } else if (/(狀態|状态|進度|连载|連載|完結|完本|已完结|已完結)/i.test(key)) {
                    statusHint = value;
                }
            });

            if (tagTexts.length) tags.push(...tagTexts);
            const metaKeywords = queryAttr(doc, ['meta[name="keywords"]'], 'content');
            if (metaKeywords) tags.push(...parseTagList(metaKeywords));
            if (!intro) {
                const metaDesc = queryAttr(doc, ['meta[name="description"]', 'meta[property="og:description"]'], 'content');
                if (metaDesc) {
                    intro = htmlToText(metaDesc);
                }
            }

            const coverUrl = toAbsoluteUrl(cover, url);
            return {
                title,
                author,
                intro,
                coverUrl,
                tags: Array.from(new Set(parseTagList(tags.join(',')))),
                categories: Array.from(new Set(categories)),
                statusHint,
            };
        };

        return new Promise((resolve, reject) => {
            const request = (url, fallback) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    responseType: 'text',
                    onload(res) {
                        const html = res.responseText || res.response || '';
                        try {
                            guardLogin(html);
                        } catch (err) {
                            reject(err);
                            return;
                        }
                        const parsed = parseHtml(html, url);
                        if ((!parsed.title && !parsed.author) && fallback) {
                            request(fallback, null);
                            return;
                        }
                        resolve(parsed);
                    },
                    onerror(err) {
                        if (fallback) {
                            request(fallback, null);
                        } else {
                            reject(err);
                        }
                    },
                });
            };
            request(primaryUrl, fallbackUrl);
        });
    }

    function fetchIhuabenData(bookId) {
        const url = `https://www.ihuaben.com/book/${bookId}.html`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'text',
                onload(res) {
                    const html = res.responseText || res.response || '';
                    const doc = new DOMParser().parseFromString(html, 'text/html');

                    const title = queryText(doc, [
                        '.infodetail .simpleinfo h1.text-danger',
                        '.infodetail .simpleinfo h1',
                        'h1.text-danger',
                        'h1',
                    ]) || queryAttr(doc, [
                        'meta[property="og:title"]',
                        'meta[property="og:novel:book_name"]',
                    ], 'content');

                    const author = queryText(doc, [
                        '.infodetail .simpleinfo a.text-muted',
                        '.infodetail .simpleinfo a',
                        '.simpleinfo a.text-muted',
                    ]);

                    let cover = queryAttr(doc, [
                        '.biginfo .cover img',
                        '.cover img',
                        'meta[property="og:image"]',
                    ], 'content');
                    if (cover && cover.includes('?')) cover = cover.split('?')[0];
                    cover = toAbsoluteUrl(cover, url);

                    const introHtml = queryHtml(doc, [
                        '.infodetail .aboutbook',
                        '.infodetail .text-muted.aboutbook',
                        '.aboutbook',
                    ]);
                    let intro = introHtml ? htmlToText(introHtml) : '';
                    intro = intro.replace(/^简介[:：]\s*/i, '');
                    if (!intro) {
                        const metaDesc = queryAttr(doc, [
                            'meta[property="og:description"]',
                            'meta[name="description"]',
                        ], 'content');
                        if (metaDesc) intro = htmlToText(metaDesc);
                    }

                    const tagTexts = collectTexts(doc, [
                        '#tagList a',
                        '#tagList .text-muted',
                        '.HuabenListUL#tagList a',
                    ]);

                    const statusHint = queryText(doc, [
                        '.simpleinfo label',
                        '.infodetail .simpleinfo label',
                    ]);

                    resolve({
                        title,
                        author,
                        intro,
                        coverUrl: cover,
                        tags: Array.from(new Set(parseTagList(tagTexts.join(',')))),
                        categories: [],
                        statusHint,
                    });
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    function fetchQidianData(bookId) {
        const url = `https://www.qidian.com/book/${bookId}/`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'text',
                onload(res) {
                    const html = res.responseText || res.response || '';
                    const doc = new DOMParser().parseFromString(html, 'text/html');

                    const title = queryText(doc, ['h1#bookName', '.book-info-top h1#bookName'])
                        || queryAttr(doc, ['meta[property="og:novel:book_name"]', 'meta[property="og:title"]'], 'content');

                    let author = queryText(doc, ['.book-meta .author', 'span.author', 'a.writer-name']);
                    if (!author) {
                        author = queryAttr(doc, ['meta[property="og:novel:author"]'], 'content');
                    }
                    author = author.replace(/^作者[:：]\s*/i, '');

                    let cover = queryAttr(doc, ['meta[property="og:image"]'], 'content');
                    if (!cover) {
                        cover = queryAttr(doc, ['.book-detail-img img', '.book-author img', '#bookImg img'], 'src');
                    }
                    cover = toAbsoluteUrl(cover, url);
                    cover = cover.replace(/\/\d+(\.\w+)?$/, '/600.webp');

                    const introHtml = queryHtml(doc, [
                        '.intro-detail p#book-intro-detail',
                        '.intro-detail',
                        'p.intro',
                    ]);
                    let intro = introHtml ? htmlToText(introHtml) : '';
                    if (!intro) {
                        const metaDesc = queryAttr(doc, [
                            'meta[property="og:description"]',
                            'meta[name="description"]',
                        ], 'content');
                        if (metaDesc) intro = htmlToText(metaDesc);
                    }

                    const tagTexts = collectTexts(doc, [
                        '.intro-honor-label p.all-label a',
                        '.intro-honor-label a',
                        '.all-label a',
                    ]);

                    const categories = collectTexts(doc, [
                        '.book-attribute a',
                    ]);

                    let statusHint = queryAttr(doc, ['meta[property="og:novel:status"]'], 'content');
                    if (!statusHint) {
                        statusHint = queryText(doc, ['.book-attribute span']);
                    }

                    resolve({
                        title,
                        author,
                        intro,
                        coverUrl: cover,
                        tags: Array.from(new Set(parseTagList(tagTexts.join(',')))),
                        categories: Array.from(new Set(parseTagList(categories.join(',')))),
                        statusHint,
                    });
                },
                onerror(err) {
                    reject(err);
                },
            });
        });
    }

    function fetchQimaoData(bookId) {
        const url = `https://www.qimao.com/shuku/${bookId}/`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'text',
                onload(res) {
                    const html = res.responseText || res.response || '';
                    const doc = new DOMParser().parseFromString(html, 'text/html');

                    const title = queryText(doc, [
                        '.book-information .wrap-txt .title .txt',
                        '.book-detail-info .title .txt',
                        '.book-detail-info .title',
                    ]) || queryAttr(doc, ['meta[property="og:title"]'], 'content');

                    const author = queryText(doc, [
                        '.book-information .sub-title em a',
                        '.book-information .sub-title em',
                        '.author-information .author-name a',
                    ]);

                    const cover = toAbsoluteUrl(queryAttr(doc, [
                        '.book-information .wrap-pic img',
                        '.wrap-pic img',
                        'meta[property="og:image"]',
                    ], 'src'), url);

                    const introHtml = queryHtml(doc, [
                        '.book-introduction p.intro',
                        '.book-introduction .intro',
                    ]);
                    let intro = introHtml ? htmlToText(introHtml) : '';
                    if (!intro) {
                        const metaDesc = queryAttr(doc, ['meta[name="description"]'], 'content');
                        if (metaDesc) intro = htmlToText(metaDesc);
                    }

                    const categoryTexts = collectTexts(doc, [
                        '.book-information .tags-wrap a',
                        '.tags-wrap a',
                    ]);
                    const tagTexts = collectTexts(doc, [
                        '.book-information .tags-wrap .qm-tag',
                        '.tags-wrap .qm-tag',
                    ]);

                    let statusHint = '';
                    const statusTag = tagTexts.find(t => /(连载|完结|完本|已完结|完結)/.test(t));
                    if (statusTag) statusHint = statusTag;

                    const tags = Array.from(new Set(parseTagList(tagTexts.join(','))));
                    const categories = Array.from(new Set(parseTagList(categoryTexts.join(','))));

                    resolve({
                        title,
                        author,
                        intro,
                        coverUrl: cover,
                        tags,
                        categories,
                        statusHint,
                    });
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
        const cleaned = coverRaw.split('?')[0];
        const base = cleaned.replace(/_[0-9]+_[0-9]+(?=\.(?:jpg|jpeg|png|webp))/i, '');
        const baseStem = base.replace(/\.(jpg|jpeg|png|webp)$/i, '');
        const candidates = [];
        const pushUnique = (url) => {
            if (!url || candidates.includes(url)) return;
            candidates.push(url);
        };
        pushUnique(base);
        ['jpg', 'jpeg', 'png', 'webp'].forEach((ext) => pushUnique(`${baseStem}.${ext}`));

        for (const url of candidates) {
            if (await checkImageUrlValid(url)) return url;
        }
        return coverRaw;
    }

    async function processQimaoCover(coverUrl) {
        if (!coverUrl) return '';
        const raw = coverUrl;
        const cleaned = raw.split('?')[0];
        const modified = cleaned.replace(/_[0-9]+x[0-9]+(?=\.(?:jpg|jpeg|png|webp))/i, '');
        if (modified === cleaned) return raw;
        const isValid = await checkImageUrlValid(modified);
        return isValid ? modified : raw;
    }

    async function processGongzicpCover(coverUrl) {
        if (!coverUrl) return '';
        const raw = coverUrl;
        let hdUrl = raw.split('?')[0].split('@')[0];
        if (hdUrl.startsWith('//')) hdUrl = 'https:' + hdUrl;
        hdUrl = hdUrl.replace('http:', 'https:');
        return hdUrl;
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
        const statusHint = safeText(raw.novelStep || raw.novelStatus || raw.isFinished || raw.novelComplete);
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

    function normalizePo18Data(raw) {
        const titleCn = safeText(raw.title).replace(/^作品名稱[:：]\s*/i, '');
        const authorCn = safeText(raw.author).replace(/^作者[:：]\s*/i, '');
        const descCn = safeText(raw.intro);
        const tags = parseTagList((raw.tags || []).join(','));
        const categories = parseTagList((raw.categories || []).join(','));
        const statusHint = safeText(raw.statusHint);
        return {
            sourceType: 'po18',
            sourceLabel: 'PO18',
            titleCn,
            authorCn,
            descCn,
            tags,
            categories,
            coverUrl: safeText(raw.coverUrl),
            statusHint,
            update_status: undefined,
            extraKeywords: [],
        };
    }

    function normalizeIhuabenData(raw) {
        const titleCn = safeText(raw.title);
        const authorCn = safeText(raw.author);
        const descCn = safeText(raw.intro);
        const tags = parseTagList((raw.tags || []).join(','));
        const categories = parseTagList((raw.categories || []).join(','));
        const statusHint = safeText(raw.statusHint);
        return {
            sourceType: 'ihuaben',
            sourceLabel: 'Ihuaben',
            titleCn,
            authorCn,
            descCn,
            tags,
            categories,
            coverUrl: safeText(raw.coverUrl),
            statusHint,
            update_status: undefined,
            extraKeywords: [],
        };
    }

    function normalizeQidianData(raw) {
        const titleCn = safeText(raw.title);
        const authorCn = safeText(raw.author);
        const descCn = safeText(raw.intro);
        const tags = parseTagList((raw.tags || []).join(','));
        const categories = parseTagList((raw.categories || []).join(','));
        const statusHint = safeText(raw.statusHint);
        return {
            sourceType: 'qidian',
            sourceLabel: 'Khởi Điểm',
            titleCn,
            authorCn,
            descCn,
            tags,
            categories,
            coverUrl: safeText(raw.coverUrl),
            statusHint,
            update_status: undefined,
            extraKeywords: [],
        };
    }

    function normalizeQimaoData(raw) {
        const titleCn = safeText(raw.title);
        const authorCn = safeText(raw.author);
        const descCn = safeText(raw.intro);
        const tags = parseTagList((raw.tags || []).join(','));
        const categories = parseTagList((raw.categories || []).join(','));
        const statusHint = safeText(raw.statusHint);
        return {
            sourceType: 'qimao',
            sourceLabel: 'Thất Miêu',
            titleCn,
            authorCn,
            descCn,
            tags,
            categories,
            coverUrl: safeText(raw.coverUrl),
            statusHint,
            update_status: undefined,
            extraKeywords: [],
        };
    }

    // --- GONGZICP ---
    function fetchGongzicpData(novelId) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://gongzicp.com/webapi/novel/novelInfo?id=${novelId}`,
                headers: {
                    'Referer': 'https://gongzicp.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                onload: (response) => {
                    if (response.status === 200) {
                        try {
                            const json = JSON.parse(response.responseText);
                            if (json.code === 200 && json.data) {
                                resolve(json.data);
                            } else {
                                reject(new Error('Gongzicp Error: ' + (json.msg || 'Unknown')));
                            }
                        } catch (e) {
                            reject(e);
                        }
                    } else {
                        reject(new Error('Gongzicp HTTP ' + response.status));
                    }
                },
                onerror: (err) => reject(err)
            });
        });
    }

    function normalizeGongzicpData(data) {
        return {
            titleCn: data.novel_name || '',
            authorCn: data.author_nickname || '',
            descCn: (data.novel_info || '').replace(/<[^>]*>/g, '\n').trim(),
            tags: data.tag_list || [],
            categories: data.type_list || [],
            coverUrl: data.novel_cover || '',
            sourceType: 'gongzicp',
            sourceLabel: 'Trường Bội'
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
            const tokens = splitTokens(norm);
            if (norm.includes('主受') || norm.includes('chu chiu')) {
                expanded.push('Chủ thụ');
            }
            if (norm.includes('互攻') || norm.includes('ho cong')) {
                expanded.push('Hỗ công');
            }
            if (norm.includes('纯爱') || norm.includes('thuan ai')) {
                expanded.push('Đam mỹ');
            }
            if (tokens.includes('bg')) {
                expanded.push('Ngôn tình');
            }
            if (tokens.includes('bl')) {
                expanded.push('Đam mỹ');
            }
            if (norm.includes('xuyen qua')) {
                expanded.push('Xuyên việt');
            }
        }
        return expanded;
    }

    function detectStatus(raw, textBlob) {
        const cn = normalizeText(textBlob + ' ' + safeText(raw.statusHint || ''));
        const step = safeText(raw.statusHint);
        if (step === '2') return 'Hoàn thành';
        if (step === '1') return 'Còn tiếp';
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

    function normalizeKeepAccents(text = '') {
        return text
            .toString()
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function calculateMatchScore(label, text, normText) {
        const labelNorm = normalizeText(label);
        const labelKeepAccents = normalizeKeepAccents(label);

        if (!labelNorm) return 0;

        const regexExact = new RegExp(`(^|\\s)${escapeRegExp(labelKeepAccents)}($|\\s)`, 'i');
        if (regexExact.test(text)) return 1.0;

        const regexNorm = new RegExp(`(^|\\s)${escapeRegExp(labelNorm)}($|\\s)`, 'i');
        if (regexNorm.test(normText)) return 0.9;

        if (normText.includes(labelNorm)) return 0.6;

        return 0;
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function scoreOptions(options, contexts) {
        // Contexts: [{ text, normText, weight }]
        return options.map(opt => {
            const label = safeText(opt.label);
            let maxScore = 0;

            for (const ctx of contexts) {
                const baseScore = calculateMatchScore(label, ctx.text, ctx.normText);
                const weightedScore = baseScore * ctx.weight;
                if (weightedScore > maxScore) maxScore = weightedScore;
            }

            return { ...opt, score: maxScore };
        }).sort((a, b) => b.score - a.score);
    }

    function filterSubstrings(items) {
        const sorted = [...items].sort((a, b) => {
            const lenA = normalizeText(a.label).length;
            const lenB = normalizeText(b.label).length;
            return lenB - lenA;
        });
        const accepted = [];
        for (const item of sorted) {
            const label = normalizeText(item.label);
            const isRedundant = accepted.some(acc => normalizeText(acc.label).includes(label));
            if (!isRedundant) accepted.push(item);
        }
        return accepted;
    }

    function pickMulti(scored, limit, requireOne, collapseRoot, threshold) {
        const minScore = Number.isFinite(threshold) ? threshold : getScoreThreshold();
        let selected = scored.filter(o => o.score >= minScore);
        selected = filterSubstrings(selected);
        let picked = selected;
        if (!picked.length && requireOne && scored.length) {
            picked = [scored[0]];
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

        const contexts = [];

        const keywordList = buildKeywordList(sourceData, translated);
        const metaText = keywordList.join(' ');
        if (metaText) {
            contexts.push({
                text: normalizeKeepAccents(metaText),
                normText: normalizeText(metaText),
                weight: 1.5
            });
        }

        if (useDesc) {
            const descCn = safeText(sourceData.descCn);
            const descVi = safeText(translated?.desc || '');
            const descText = `${descCn} \n ${descVi}`;
            contexts.push({
                text: normalizeKeepAccents(descText),
                normText: normalizeText(descText),
                weight: 1.0
            });
        }

        const getMulti = (group, limit, isMandatory, collapse) => {
            const scored = scoreOptions(group, contexts);
            return pickMulti(scored, limit, isMandatory, collapse);
        };

        const fullTextBlob = contexts.map(c => c.normText).join(' ');

        const statusLabel = detectStatus(sourceData, fullTextBlob);
        const officialLabel = detectOfficial(keywordList);
        const genderLabel = detectGender(keywordList);

        const boostDetect = (group, detectedLabel) => {
            if (!detectedLabel) return scoreOptions(group, contexts);
            return group.map(opt => {
                if (opt.label === detectedLabel) return { ...opt, score: 2.0 };
                return { ...opt, score: 0 };
            }).sort((a, b) => b.score - a.score);
        };

        const statusScored = boostDetect(groups.status, statusLabel);

        const threshold = getScoreThreshold();

        return {
            status: pickRadio(statusScored, true, threshold),
            official: pickRadio(boostDetect(groups.official, officialLabel), true, threshold),
            gender: pickRadio(boostDetect(groups.gender, genderLabel), false, threshold),

            age: getMulti(groups.age, 4, true, false),
            ending: getMulti(groups.ending, 3, true, false),
            genre: getMulti(groups.genre, 8, true, false),
            tag: getMulti(groups.tag, MAX_TAGS_SELECT, true, true),
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
        const ctx = { text: label, normText: normalizeText(label), weight: 1.0 };
        const scored = scoreOptions(group, [ctx]);
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
            const ctx = { text: label, normText: normalizeText(label), weight: 1.0 };
            const scored = scoreOptions(group, [ctx]);
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
                background: #fff; color: #333; border-radius: 12px; width: 550px; max-width: 95vw;
                max-height: 90vh; display: flex; flex-direction: column;
                box-shadow: 0 15px 40px rgba(0,0,0,0.3); border-top: 5px solid #673ab7;
            }
            .${APP_PREFIX}modal-title {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
                font-weight: bold; font-size: 18px; margin-bottom: 0px;
                flex-shrink: 0; padding: 16px 20px 10px 20px;
                color: #444; border-bottom: 1px solid #eee;
                background: linear-gradient(to right, #fff, #f9f9f9);
            }
            .${APP_PREFIX}modal-body {
                font-size: 14px; line-height: 1.6;
                flex: 1; overflow-y: auto; padding: 12px 20px;
                color: #444;
            }
            .${APP_PREFIX}modal-body h2 { font-size: 16px; margin: 10px 0 8px 0; color: #333; }
            .${APP_PREFIX}modal-body h3 { font-size: 15px; margin: 12px 0 6px 0; color: #555; }
            .${APP_PREFIX}modal-body li { margin-bottom: 4px; }
            .${APP_PREFIX}modal-actions { margin-top: 12px; text-align: right; flex-shrink: 0; padding: 0 16px 16px 16px; }
        `;

        shadowRoot.innerHTML = `
            <style>${css}</style>
            <button id="${APP_PREFIX}btn">AF</button>
            <div id="${APP_PREFIX}panel">
                <div id="${APP_PREFIX}header">
                    <span>Web Trung → Wikidich</span>
                    <div>
                        <button id="${APP_PREFIX}ai" class="${APP_PREFIX}icon-btn" title="Chạy AI Analyze" style="color: #673ab7;">AI</button>
                        <button id="${APP_PREFIX}help" class="${APP_PREFIX}icon-btn">?</button>
                        <button id="${APP_PREFIX}settings" class="${APP_PREFIX}icon-btn" title="Cài đặt">⚙</button>
                        <button id="${APP_PREFIX}close" class="${APP_PREFIX}btn secondary">Đóng</button>
                    </div>
                </div>
                <div id="${APP_PREFIX}content">
                    <div class="${APP_PREFIX}row">
                        <label class="${APP_PREFIX}label">URL Web Trung</label>
                        <input id="${APP_PREFIX}url" class="${APP_PREFIX}input" placeholder="https://fanqienovel.com/page/... hoặc https://www.po18.tw/books/... hoặc https://www.ihuaben.com/book/... hoặc https://www.qidian.com/book/... hoặc https://www.qimao.com/shuku/..." />
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
                        <label class="${APP_PREFIX}label">Liên kết bổ sung</label>
                        <div class="${APP_PREFIX}grid">
                            <input id="${APP_PREFIX}moreLinkDesc" class="${APP_PREFIX}input" placeholder="Mô tả (Cà Chua/Tấn Giang/PO18/Ihuaben)" list="${APP_PREFIX}moreLinkOptions" />
                            <input id="${APP_PREFIX}moreLinkUrl" class="${APP_PREFIX}input" placeholder="URL nguồn" />
                        </div>
                        <datalist id="${APP_PREFIX}moreLinkOptions">
                            <option value="Cà Chua"></option>
                            <option value="Tấn Giang"></option>
                            <option value="PO18"></option>
                            <option value="Ihuaben"></option>
                            <option value="Khởi Điểm"></option>
                            <option value="Thất Miêu"></option>
                        </datalist>
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
Các web hỗ trợ: Fanqie (Cà Chua), JJWXC (Tấn Giang), PO18 (cần đăng nhập), Ihuaben, Khởi Điểm, Thất Miêu.
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
                            <label class="${APP_PREFIX}label">Cấu hình AI (Hiện chỉ hỗ trợ Gemini)</label>
                            <div class="${APP_PREFIX}settings-group">
                                <label class="${APP_PREFIX}settings-item">
                                    <span style="min-width: 80px;">API Key:</span>
                                    <input id="${APP_PREFIX}settingGeminiKey" class="${APP_PREFIX}input" type="password" placeholder="AIza..." style="flex:1;" />
                                    <button id="${APP_PREFIX}fetchModels" class="${APP_PREFIX}btn secondary" style="margin-right:0; padding: 4px 8px; font-size: 11px;">Lấy Model</button>
                                </label>
                                <label class="${APP_PREFIX}settings-item">
                                    <span style="min-width: 80px;">Model:</span>
                                    <select id="${APP_PREFIX}settingGeminiModel" class="${APP_PREFIX}select"></select>
                                </label>
                                <label class="${APP_PREFIX}settings-item">
                                    <span style="min-width: 80px;">Chế độ:</span>
                                    <select id="${APP_PREFIX}settingAiMode" class="${APP_PREFIX}select" style="width: auto;">
                                        <option value="auto">Tự động (Keyword)</option>
                                        <option value="ai">AI (Ưu tiên)</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                        <div class="${APP_PREFIX}row">
                            <label class="${APP_PREFIX}label">Cấu hình Nguồn (Quét văn án & Nơi hiển thị)</label>
                            <div class="${APP_PREFIX}settings-group" style="display:grid; grid-template-columns: 1.5fr 0.8fr 2fr; gap: 6px 12px; font-size: 13px; align-items:center;">
                                <div style="font-weight:bold; border-bottom:1px solid #eee; color:#666;">Nguồn</div>
                                <div style="font-weight:bold; border-bottom:1px solid #eee; color:#666; text-align:center;">Quét</div>
                                <div style="font-weight:bold; border-bottom:1px solid #eee; color:#666;">Hiển thị</div>

                                <!-- Fanqie -->
                                <span>Fanqie</span>
                                <div style="text-align:center;"><input id="${APP_PREFIX}confDesc_fanqie" type="checkbox" /></div>
                                <select id="${APP_PREFIX}confTarget_fanqie" class="${APP_PREFIX}select" style="padding: 2px; height: 26px;">
                                     <option value="all">Tất cả</option>
                                     <option value="wiki">Chỉ Wiki</option>
                                     <option value="webhong">Chỉ Web Hồng</option>
                                </select>

                                <!-- JJWXC -->
                                <span>Tấn Giang</span>
                                <div style="text-align:center;"><input id="${APP_PREFIX}confDesc_jjwxc" type="checkbox" /></div>
                                <select id="${APP_PREFIX}confTarget_jjwxc" class="${APP_PREFIX}select" style="padding: 2px; height: 26px;">
                                     <option value="all">Tất cả</option>
                                     <option value="wiki">Chỉ Wiki</option>
                                     <option value="webhong">Chỉ Web Hồng</option>
                                </select>

                                <!-- PO18 -->
                                <span>PO18</span>
                                <div style="text-align:center;"><input id="${APP_PREFIX}confDesc_po18" type="checkbox" /></div>
                                <select id="${APP_PREFIX}confTarget_po18" class="${APP_PREFIX}select" style="padding: 2px; height: 26px;">
                                     <option value="all">Tất cả</option>
                                     <option value="wiki">Chỉ Wiki</option>
                                     <option value="webhong">Chỉ Web Hồng</option>
                                </select>

                                <!-- Ihuaben -->
                                <span>Ihuaben</span>
                                <div style="text-align:center;"><input id="${APP_PREFIX}confDesc_ihuaben" type="checkbox" /></div>
                                <select id="${APP_PREFIX}confTarget_ihuaben" class="${APP_PREFIX}select" style="padding: 2px; height: 26px;">
                                     <option value="all">Tất cả</option>
                                     <option value="wiki">Chỉ Wiki</option>
                                     <option value="webhong">Chỉ Web Hồng</option>
                                </select>

                                <!-- Qidian -->
                                <span>Khởi Điểm</span>
                                <div style="text-align:center;"><input id="${APP_PREFIX}confDesc_qidian" type="checkbox" /></div>
                                <select id="${APP_PREFIX}confTarget_qidian" class="${APP_PREFIX}select" style="padding: 2px; height: 26px;">
                                     <option value="all">Tất cả</option>
                                     <option value="wiki">Chỉ Wiki</option>
                                     <option value="webhong">Chỉ Web Hồng</option>
                                </select>

                                <!-- Qimao -->
                                <span>Thất Miêu</span>
                                <div style="text-align:center;"><input id="${APP_PREFIX}confDesc_qimao" type="checkbox" /></div>
                                <select id="${APP_PREFIX}confTarget_qimao" class="${APP_PREFIX}select" style="padding: 2px; height: 26px;">
                                     <option value="all">Tất cả</option>
                                     <option value="wiki">Chỉ Wiki</option>
                                     <option value="webhong">Chỉ Web Hồng</option>
                                </select>

                                <!-- Gongzicp -->
                                <span>Trường Bội</span>
                                <div style="text-align:center;"><input id="${APP_PREFIX}confDesc_gongzicp" type="checkbox" /></div>
                                <select id="${APP_PREFIX}confTarget_gongzicp" class="${APP_PREFIX}select" style="padding: 2px; height: 26px;">
                                     <option value="all">Tất cả</option>
                                     <option value="wiki">Chỉ Wiki</option>
                                     <option value="webhong">Chỉ Web Hồng</option>
                                </select>
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
        const aiBtn = shadowRoot.getElementById(`${APP_PREFIX}ai`);
        const helpBtn = shadowRoot.getElementById(`${APP_PREFIX}help`);

        const settingsBtn = shadowRoot.getElementById(`${APP_PREFIX}settings`);
        const settingsModal = shadowRoot.getElementById(`${APP_PREFIX}settingsModal`);
        const settingsSave = shadowRoot.getElementById(`${APP_PREFIX}settingsSave`);
        const settingsClose = shadowRoot.getElementById(`${APP_PREFIX}settingsClose`);
        const settingsThreshold = shadowRoot.getElementById(`${APP_PREFIX}settingThreshold`);
        const settingsGeminiKey = shadowRoot.getElementById(`${APP_PREFIX}settingGeminiKey`);
        const settingsFetchModels = shadowRoot.getElementById(`${APP_PREFIX}fetchModels`);
        const settingsGeminiModel = shadowRoot.getElementById(`${APP_PREFIX}settingGeminiModel`);
        const settingsAiMode = shadowRoot.getElementById(`${APP_PREFIX}settingAiMode`);

        const confDesc_fanqie = shadowRoot.getElementById(`${APP_PREFIX}confDesc_fanqie`);
        const confTarget_fanqie = shadowRoot.getElementById(`${APP_PREFIX}confTarget_fanqie`);

        const confDesc_jjwxc = shadowRoot.getElementById(`${APP_PREFIX}confDesc_jjwxc`);
        const confTarget_jjwxc = shadowRoot.getElementById(`${APP_PREFIX}confTarget_jjwxc`);

        const confDesc_po18 = shadowRoot.getElementById(`${APP_PREFIX}confDesc_po18`);
        const confTarget_po18 = shadowRoot.getElementById(`${APP_PREFIX}confTarget_po18`);

        const confDesc_ihuaben = shadowRoot.getElementById(`${APP_PREFIX}confDesc_ihuaben`);
        const confTarget_ihuaben = shadowRoot.getElementById(`${APP_PREFIX}confTarget_ihuaben`);

        const confDesc_qidian = shadowRoot.getElementById(`${APP_PREFIX}confDesc_qidian`);
        const confTarget_qidian = shadowRoot.getElementById(`${APP_PREFIX}confTarget_qidian`);

        const confDesc_qimao = shadowRoot.getElementById(`${APP_PREFIX}confDesc_qimao`);
        const confTarget_qimao = shadowRoot.getElementById(`${APP_PREFIX}confTarget_qimao`);

        const confDesc_gongzicp = shadowRoot.getElementById(`${APP_PREFIX}confDesc_gongzicp`);
        const confTarget_gongzicp = shadowRoot.getElementById(`${APP_PREFIX}confTarget_gongzicp`);

        const logBox = shadowRoot.getElementById(`${APP_PREFIX}log`);
        if (!showFloatingButton) btn.style.display = 'none';

        // Help UI (Reused logic for Changelog)
        const helpModal = document.createElement('div');
        helpModal.id = `${APP_PREFIX}helpModal`;
        helpModal.className = `${APP_PREFIX}modal`;
        helpModal.innerHTML = `
            <div class="${APP_PREFIX}modal-card">
                <div class="${APP_PREFIX}modal-title">Hướng dẫn & Cập nhật</div>
                <div class="${APP_PREFIX}modal-body" id="${APP_PREFIX}helpContent" style="font-size: 14px; line-height: 1.5;"></div>
                <div class="${APP_PREFIX}modal-actions">
                    <button id="${APP_PREFIX}helpClose" class="${APP_PREFIX}btn secondary">Đóng</button>
                </div>
            </div>
        `;
        shadowRoot.appendChild(helpModal);
        const helpContentDiv = helpModal.querySelector(`#${APP_PREFIX}helpContent`);
        const helpClose = helpModal.querySelector(`#${APP_PREFIX}helpClose`);

        helpClose.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
        helpModal.addEventListener('click', (ev) => {
            if (ev.target === helpModal) helpModal.style.display = 'none';
        });

        // Show Help (User clicked ?)
        helpBtn.addEventListener('click', () => {
            helpContentDiv.innerHTML = WELCOME_CONTENT; // Show full guide
            helpModal.style.display = 'flex';
        });

        // Version Check Logic
        setTimeout(() => {
            // GM_setValue(`${APP_PREFIX}version`, null); //test
            const currentVer = AUTOFILL_WIKIDICH_VERSION;
            const storedVer = GM_getValue(`${APP_PREFIX}version`, null);

            if (!storedVer) {
                // New Install
                helpContentDiv.innerHTML = WELCOME_CONTENT;
                helpModal.style.display = 'flex';
                GM_setValue(`${APP_PREFIX}version`, currentVer);
            } else if (storedVer !== currentVer) {
                // Update
                helpContentDiv.innerHTML = CHANGELOG_CONTENT;
                helpModal.style.display = 'flex';
                GM_setValue(`${APP_PREFIX}version`, currentVer);
            }
        }, 1500);

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

        settingsBtn.addEventListener('click', () => {
            const s = state.settings;
            settingsThreshold.value = s.scoreThreshold;
            settingsGeminiKey.value = s.geminiApiKey || '';

            // Populate models
            settingsGeminiModel.innerHTML = '';
            const currentModel = s.geminiModel || 'gemini-2.5-flash';
            const option = document.createElement('option');
            option.value = currentModel;
            option.textContent = currentModel;
            option.selected = true;
            settingsGeminiModel.appendChild(option);

            settingsAiMode.value = s.aiMode || 'auto';

            const d = s.domainSettings || DEFAULT_SETTINGS.domainSettings;
            if (d.fanqie) { confDesc_fanqie.checked = d.fanqie.useDesc; confTarget_fanqie.value = d.fanqie.target; }
            if (d.jjwxc) { confDesc_jjwxc.checked = d.jjwxc.useDesc; confTarget_jjwxc.value = d.jjwxc.target; }
            if (d.po18) { confDesc_po18.checked = d.po18.useDesc; confTarget_po18.value = d.po18.target; }
            if (d.ihuaben) { confDesc_ihuaben.checked = d.ihuaben.useDesc; confTarget_ihuaben.value = d.ihuaben.target; }
            if (d.qidian) { confDesc_qidian.checked = d.qidian.useDesc; confTarget_qidian.value = d.qidian.target; }
            if (d.qimao) { confDesc_qimao.checked = d.qimao.useDesc; confTarget_qimao.value = d.qimao.target; }
            if (d.gongzicp) { confDesc_gongzicp.checked = d.gongzicp.useDesc; confTarget_gongzicp.value = d.gongzicp.target; }
            settingsModal.style.display = 'flex';
        });

        settingsSave.addEventListener('click', () => {
            const next = readSettingsFromUi();
            saveSettings(next);
            settingsModal.style.display = 'none';
            log('Đã lưu cài đặt.', 'info');
        });

        settingsClose.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });

        // Fetch Models Logic
        settingsFetchModels.addEventListener('click', () => {
            const key = settingsGeminiKey.value.trim();
            if (!key) {
                alert('Vui lòng nhập API Key trước.');
                return;
            }
            settingsFetchModels.textContent = 'Đang lấy...';
            settingsFetchModels.disabled = true;

            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
                onload: (res) => {
                    settingsFetchModels.textContent = 'Lấy Model';
                    settingsFetchModels.disabled = false;
                    if (res.status >= 200 && res.status < 300) {
                        try {
                            const data = JSON.parse(res.responseText);
                            if (data.models && Array.isArray(data.models)) {
                                settingsGeminiModel.innerHTML = '';
                                const models = data.models
                                    .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
                                    .sort((a, b) => b.displayName.localeCompare(a.displayName)); // Sort desirable

                                if (!models.length) {
                                    alert('Không tìm thấy model nào hỗ trợ generateContent.');
                                    return;
                                }

                                models.forEach(m => {
                                    const name = m.name.replace('models/', '');
                                    const opt = document.createElement('option');
                                    opt.value = name;
                                    opt.textContent = `${m.displayName} (${name})`;
                                    if (name === 'gemini-2.5-flash') opt.selected = true;
                                    settingsGeminiModel.appendChild(opt);
                                });
                                alert(`Đã tìm thấy ${models.length} maps.`);
                            }
                        } catch (e) {
                            alert('Lỗi parse: ' + e.message);
                        }
                    } else {
                        alert(`Lỗi API: ${res.statusText}`);
                    }
                },
                onerror: () => {
                    settingsFetchModels.textContent = 'Lấy Model';
                    settingsFetchModels.disabled = false;
                    alert('Lỗi kết nối.');
                }
            });
        });

        // --- GEMINI AI IMPLEMENTATION ---

        async function callGemini(prompt, apiKey, model = 'gemini-2.5-flash') {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            };
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: url,
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify(payload),
                    onload: (res) => {
                        if (res.status >= 200 && res.status < 300) {
                            try {
                                const data = JSON.parse(res.responseText);
                                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (!text) throw new Error('No text in response');
                                resolve(JSON.parse(text));
                            } catch (e) {
                                reject(new Error('AI Response Parse Error: ' + e.message));
                            }
                        } else {
                            reject(new Error(`Gemini Error ${res.status}: ${res.statusText}`));
                        }
                    },
                    onerror: (err) => reject(err)
                });
            });
        }

        async function runAIAnalysis() {
            if (!state.sourceData) {
                log('Chưa có dữ liệu truyện (Fetch data trước).', 'error');
                return;
            }
            const apiKey = state.settings.geminiApiKey;
            if (!apiKey) {
                log('Chưa nhập API Key Gemini trong Cài đặt.', 'error');
                return;
            }

            log('Đang gửi dữ liệu sang Gemini AI...', 'info');

            const groups = getGroupOptions();
            const getLabels = (grp) => grp ? grp.map(x => x.label) : [];

            const availableOptions = {
                status: getLabels(groups.status),
                gender: getLabels(groups.gender),
                official: getLabels(groups.official),
                age: getLabels(groups.age),
                ending: getLabels(groups.ending),
                genre: getLabels(groups.genre),
                tag: getLabels(groups.tag),
            };

            const novelInfo = {
                title: state.sourceData.titleCn,
                author: state.sourceData.authorCn,
                desc: state.sourceData.descCn + '\n' + (state.translated?.desc || ''),
                tags: (state.sourceData.tags || []).join(', ')
            };

            const prompt = `
You are a novel classifier for Wikidich. Analyze the novel info and map it to the provided JSON lists.
Info:
Title: ${novelInfo.title}
Author: ${novelInfo.author}
Tags: ${novelInfo.tags}
Description: ${novelInfo.desc}

Available Lists (Choose from these ONLY):
- status: ${JSON.stringify(availableOptions.status)}
- gender: ${JSON.stringify(availableOptions.gender)} // Pick 1
- official: ${JSON.stringify(availableOptions.official)} // Pick 1
- age: ${JSON.stringify(availableOptions.age)} // Pick multiple
- ending: ${JSON.stringify(availableOptions.ending)} // Pick multiple
- genre: ${JSON.stringify(availableOptions.genre)} // Pick multiple
- tag: ${JSON.stringify(availableOptions.tag)} // Pick multiple

Output JSON format: { "status": "...", "gender": "...", "official": "...", "age": [...], "ending": [...], "genre": [...], "tag": [...] }
For arrays, return list of strings. If none fit, return empty array.
            `.trim();

            try {
                const result = await callGemini(prompt, apiKey, state.settings.geminiModel);
                log('AI đã phân tích xong. Đang áp dụng...');
                console.log('AI Result:', result);

                // Helper to validate against available options
                const validateParams = (key, value, isArray) => {
                    const validList = availableOptions[key] || [];
                    const validSet = new Set(validList.map(x => x.toLowerCase().trim()));

                    if (!value) return isArray ? [] : '';

                    if (isArray) {
                        if (!Array.isArray(value)) return [];
                        const valid = [];
                        const invalid = [];
                        value.forEach(v => {
                            const strV = String(v); // Force string
                            if (validSet.has(strV.toLowerCase().trim())) {
                                // Find exact original case
                                const exact = validList.find(x => x.toLowerCase().trim() === strV.toLowerCase().trim());
                                valid.push(exact || strV);
                            } else {
                                invalid.push(strV);
                            }
                        });
                        if (invalid.length) log(`AI suggest rác [${key}]: ${invalid.join(', ')}`, 'warn');
                        return valid;
                    } else {
                        // Single value
                        const strValue = String(value);
                        if (validSet.has(strValue.toLowerCase().trim())) {
                            const exact = validList.find(x => x.toLowerCase().trim() === strValue.toLowerCase().trim());
                            return exact || strValue;
                        } else {
                            log(`AI suggest rác [${key}]: ${strValue}`, 'warn');
                            return '';
                        }
                    }
                };

                // Validate and Clean result
                result.status = validateParams('status', result.status, false);
                result.gender = validateParams('gender', result.gender, false);
                result.official = validateParams('official', result.official, false);

                result.age = validateParams('age', result.age, true);
                result.ending = validateParams('ending', result.ending, true);
                result.genre = validateParams('genre', result.genre, true);
                result.tag = validateParams('tag', result.tag, true);

                if (result.status) shadowRoot.getElementById(`${APP_PREFIX}status`).value = result.status;
                if (result.gender) shadowRoot.getElementById(`${APP_PREFIX}gender`).value = result.gender;
                if (result.official) shadowRoot.getElementById(`${APP_PREFIX}official`).value = result.official;

                if (result.age && result.age.length) {
                    shadowRoot.getElementById(`${APP_PREFIX}age`).value = result.age.join(', ');
                }
                if (result.ending && result.ending.length) {
                    shadowRoot.getElementById(`${APP_PREFIX}ending`).value = result.ending.join(', ');
                }
                if (result.genre && result.genre.length) {
                    shadowRoot.getElementById(`${APP_PREFIX}genre`).value = result.genre.join(', ');
                }
                if (result.tag && result.tag.length) {
                    shadowRoot.getElementById(`${APP_PREFIX}tag`).value = result.tag.join(', ');
                }

                state.suggestions = {
                    status: result.status || '',
                    official: result.official || '',
                    gender: result.gender || '',
                    age: result.age || [],
                    ending: result.ending || [],
                    genre: result.genre || [],
                    tag: result.tag || [],
                };

                log('AI đã đề xuất xong. Hãy kiểm tra lại và bấm "Áp vào form".', 'ok');
            } catch (err) {
                log('Lỗi AI: ' + err.message, 'error');
            }
        }

        aiBtn.addEventListener('click', () => {
            runAIAnalysis();
        });

        // ------------------------------------
        function readSettingsFromUi() {
            return {
                scoreThreshold: parseFloat(settingsThreshold.value),
                aiMode: settingsAiMode.value,
                geminiApiKey: settingsGeminiKey.value.trim(),
                geminiModel: settingsGeminiModel.value.trim(),
                domainSettings: {
                    fanqie: { label: 'Fanqie', useDesc: confDesc_fanqie.checked, target: confTarget_fanqie.value },
                    jjwxc: { label: 'Tấn Giang', useDesc: confDesc_jjwxc.checked, target: confTarget_jjwxc.value },
                    po18: { label: 'PO18', useDesc: confDesc_po18.checked, target: confTarget_po18.value },
                    ihuaben: { label: 'Ihuaben', useDesc: confDesc_ihuaben.checked, target: confTarget_ihuaben.value },
                    qidian: { label: 'Khởi Điểm', useDesc: confDesc_qidian.checked, target: confTarget_qidian.value },
                    qimao: { label: 'Thất Miêu', useDesc: confDesc_qimao.checked, target: confTarget_qimao.value },
                    gongzicp: { label: 'Trường Bội', useDesc: confDesc_gongzicp.checked, target: confTarget_gongzicp.value },
                }
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

                // --- BLOCKING LOGIC ---
                const domainSetting = getDomainSetting(sourceInfo.type);
                const isWikidich = location.hostname.includes('wikidich');
                const target = domainSetting.target || 'wiki';

                if (target === 'wiki' && !isWikidich) {
                    alert(`Trang này (${domainSetting.label}) được cấu hình chỉ lấy khi ở Wikidich.\nVui lòng vào Wikidich > Nhúng file để sử dụng.`);
                    return;
                }
                if (target === 'webhong' && isWikidich) {
                    alert(`Trang này (${domainSetting.label}) được cấu hình chỉ lấy khi ở Web Hồng.\nVui lòng không dùng ở Wikidich.`);
                    return;
                }
                // ---------------------

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
                } else if (sourceInfo.type === 'po18') {
                    log('Đang gọi PO18...');
                    raw = await fetchPo18Data(sourceInfo.id);
                    sourceData = normalizePo18Data(raw);
                    log(`PO18 OK: ${sourceData.titleCn || '(no title)'}`, 'ok');
                } else if (sourceInfo.type === 'ihuaben') {
                    log('Đang gọi Ihuaben...');
                    raw = await fetchIhuabenData(sourceInfo.id);
                    sourceData = normalizeIhuabenData(raw);
                    log(`Ihuaben OK: ${sourceData.titleCn || '(no title)'}`, 'ok');
                } else if (sourceInfo.type === 'qidian') {
                    log('Đang gọi Qidian...');
                    raw = await fetchQidianData(sourceInfo.id);
                    sourceData = normalizeQidianData(raw);
                    log(`Qidian OK: ${sourceData.titleCn || '(no title)'}`, 'ok');
                } else if (sourceInfo.type === 'qimao') {
                    log('Đang gọi Qimao...');
                    raw = await fetchQimaoData(sourceInfo.id);
                    sourceData = normalizeQimaoData(raw);
                    if (sourceData.coverUrl) {
                        log('Đang xử lý ảnh bìa Qimao...');
                        sourceData.coverUrl = await processQimaoCover(sourceData.coverUrl);
                    }
                    log(`Qimao OK: ${sourceData.titleCn || '(no title)'}`, 'ok');
                } else if (sourceInfo.type === 'gongzicp') {
                    log('Đang gọi API Trường Bội...');
                    raw = await fetchGongzicpData(sourceInfo.id);
                    sourceData = normalizeGongzicpData(raw);
                    if (sourceData.coverUrl) {
                        log('Đang xử lý ảnh bìa Gongzicp...');
                        sourceData.coverUrl = await processGongzicpCover(sourceData.coverUrl);
                    }
                    log(`Gongzicp OK: ${sourceData.titleCn || '(no title)'}`, 'ok');
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
                fillText(`${APP_PREFIX}moreLinkDesc`, sourceData.sourceLabel || '');
                fillText(`${APP_PREFIX}moreLinkUrl`, urlInput.value || '');

                fillSelect(shadowRoot.getElementById(`${APP_PREFIX}status`), state.groups.status, suggestions.status);
                fillSelect(shadowRoot.getElementById(`${APP_PREFIX}official`), state.groups.official, suggestions.official);
                fillSelect(shadowRoot.getElementById(`${APP_PREFIX}gender`), state.groups.gender, suggestions.gender);

                fillText(`${APP_PREFIX}age`, suggestions.age.join(', '));
                fillText(`${APP_PREFIX}ending`, suggestions.ending.join(', '));
                fillText(`${APP_PREFIX}genre`, suggestions.genre.join(', '));
                fillText(`${APP_PREFIX}tag`, suggestions.tag.join(', '));

                log('Gợi ý sẵn sàng. Bạn có thể chỉnh rồi bấm "Áp vào form".', 'ok');

                // --- AUTO AI TRIGGER ---
                if (state.settings.aiMode === 'ai' && state.settings.geminiApiKey) {
                    log('Chế độ AI: Đang tự động chạy phân tích...');
                    runAIAnalysis();
                }
                // -----------------------
            } catch (err) {
                log('Lỗi: ' + err.message, 'error');
                console.error(err);
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
            const moreLinkDesc = shadowRoot.getElementById(`${APP_PREFIX}moreLinkDesc`).value;
            const moreLinkUrl = shadowRoot.getElementById(`${APP_PREFIX}moreLinkUrl`).value;

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
            const finalLinkDesc = safeText(moreLinkDesc) || sourceLabel;
            const finalLinkUrl = safeText(moreLinkUrl) || sourceUrl;
            setMoreLink(finalLinkDesc, finalLinkUrl);
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
            helpContentDiv.innerHTML = WELCOME_CONTENT;
            helpModal.style.display = 'flex';
        });
        helpClose.addEventListener('click', () => {
            helpModal.style.display = 'none';
        });
        helpModal.addEventListener('click', (ev) => {
            if (ev.target === helpModal) helpModal.style.display = 'none';
        });
        settingsModal.addEventListener('click', (ev) => {
            if (ev.target === settingsModal) settingsModal.style.display = 'none';
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
        log('Sẵn sàng. Dán link Fanqie/JJWXC/PO18/Ihuaben/Qidian/Qimao/Gongzicp rồi bấm "Lấy dữ liệu".');

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
