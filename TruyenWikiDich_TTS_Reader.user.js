// ==UserScript==
// @name         TruyenWikiDich TTS Reader
// @namespace    TTSReader
// @version      1.2.0
// @description  Đọc tiêu đề + nội dung chương bằng TTS, tô màu tiến độ, tự qua chương.
// @author       QuocBao
// @match        https://truyenwikidich.net/truyen/*/chuong-*
// @match        https://truyenwikidich.net/truyen/*/chuong-*?*
// @grant        GM_xmlhttpRequest
// @connect      api16-normal-c-useast1a.tiktokv.com
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'twd_tts_reader_settings_v1';
    const SESSION_KEY = 'twd_tts_reader_session_v1';
    const AUTO_START_WINDOW_MS = 10 * 60 * 1000;
    const TIKTOK_API_ENDPOINT = 'https://api16-normal-c-useast1a.tiktokv.com/media/api/text/speech/invoke/';
    const TIKTOK_USER_AGENT = 'com.zhiliaoapp.musically/2022600030 (Linux; U; Android 7.1.2; es_ES; SM-G988N; Build/NRD90M;tt-ok/3.12.13.1)';
    const TIKTOK_DEFAULT_TIMEOUT_MS = 20000;
    const TIKTOK_DEFAULT_RETRIES = 2;
    const TIKTOK_MIN_REQUEST_GAP_MS = 220;
    const TIKTOK_PREFETCH_DELAY_MS = 450;
    const TIKTOK_RETRY_BASE_DELAY_MS = 650;
    const TIKTOK_MAX_CACHE_ITEMS = 18;
    const TIKTOK_VOICES = [
        { id: 'vi_female_huong', language: 'vi', name: 'VN - Giọng nữ phổ thông' },
        { id: 'BV074_streaming', language: 'vi', name: 'VN - Cô gái hoạt ngôn' },
        { id: 'BV075_streaming', language: 'vi', name: 'VN - Thanh niên tự tin' },
        { id: 'BV421_vivn_streaming', language: 'vi', name: 'VN - Ngọt ngào' },
        { id: 'BV560_streaming', language: 'vi', name: 'VN - Anh Dũng' },
        { id: 'BV562_streaming', language: 'vi', name: 'VN - Chí Mai' },
        { id: 'en_us_002', language: 'en', name: 'EN - Jessie' },
        { id: 'en_us_006', language: 'en', name: 'EN - Joey' },
        { id: 'en_us_007', language: 'en', name: 'EN - Professor' },
        { id: 'en_us_009', language: 'en', name: 'EN - Scientist' },
        { id: 'en_us_010', language: 'en', name: 'EN - Confidence' },
        { id: 'en_uk_001', language: 'en', name: 'EN - Narrator UK' },
        { id: 'en_uk_003', language: 'en', name: 'EN - Male UK' },
        { id: 'en_au_001', language: 'en', name: 'EN - Metro AU' },
        { id: 'en_male_narration', language: 'en', name: 'EN - Story Teller' },
        { id: 'en_male_funny', language: 'en', name: 'EN - Wacky' },
        { id: 'en_female_samc', language: 'en', name: 'EN - Empathetic' },
        { id: 'en_us_ghostface', language: 'en', name: 'EN - Ghost Face' },
        { id: 'en_us_stitch', language: 'en', name: 'EN - Stitch' },
        { id: 'en_us_rocket', language: 'en', name: 'EN - Rocket' },
        { id: 'fr_001', language: 'fr', name: 'FR - Male 1' },
        { id: 'fr_002', language: 'fr', name: 'FR - Male 2' },
        { id: 'es_002', language: 'es', name: 'ES - Spain Male' },
        { id: 'es_mx_002', language: 'es', name: 'ES - MX Male' },
        { id: 'de_001', language: 'de', name: 'DE - Female' },
        { id: 'de_002', language: 'de', name: 'DE - Male' },
        { id: 'id_001', language: 'id', name: 'ID - Female' },
        { id: 'jp_001', language: 'ja', name: 'JP - Female 1' },
        { id: 'jp_006', language: 'ja', name: 'JP - Male' },
        { id: 'kr_002', language: 'kr', name: 'KR - Male 1' },
        { id: 'kr_003', language: 'kr', name: 'KR - Female' },
        { id: 'br_001', language: 'br', name: 'BR - Female 1' }
    ];

    const DEFAULT_SETTINGS = {
        provider: 'browser',
        voiceURI: '',
        tiktokVoiceId: 'vi_female_huong',
        tiktokCookieText: '',
        prefetchEnabled: true,
        prefetchCount: 2,
        segmentDelayMs: 250,
        rate: 1,
        pitch: 1,
        volume: 1,
        maxChars: 260,
        autoNext: true,
        includeTitle: true,
        autoScroll: true,
        autoStartOnNextChapter: true,
        panelCollapsed: false
    };

    const state = {
        settings: loadSettings(),
        title: '',
        nextUrl: '',
        paragraphs: [],
        pickMode: false,
        segments: [],
        segmentIndex: 0,
        reading: false,
        paused: false,
        utteranceToken: 0,
        pendingAutoStart: false,
        currentAudio: null,
        remoteAudioCache: new Map(),
        remoteAudioInflight: new Map(),
        prefetchJobId: 0,
        tiktokCookieParsedCache: { raw: '', parsed: null },
        nextSegmentTimer: 0,
        uiHost: null,
        ui: null
    };

	    const REMOTE_PROVIDERS = {
	        tiktok: {
	            id: 'tiktok',
	            label: 'TikTok',
	            voices: TIKTOK_VOICES,
	            maxCharsCap: 200,
	            defaultVoiceId: 'vi_female_huong',
	            getVoiceId: () => state.settings.tiktokVoiceId,
	            setVoiceId: (voiceId) => {
	                state.settings.tiktokVoiceId = String(voiceId || '');
	            },
            synthesizeBase64: (text, voiceId, options) => tiktokSynthesizeBase64(text, voiceId, options),
            onAuthRequired: () => openTikTokCookieModal({ reason: 'auto' })
        }
    };

    boot();

    function boot() {
        if (location.hostname !== 'truyenwikidich.net') {
            return;
        }
        waitForContent(25).then((ok) => {
            if (!ok) {
                return;
            }
            state.settings.provider = getProviderId();
            state.pendingAutoStart = consumePendingSession();
            injectStyles();
            buildUi();
            refreshChapterData();
            initVoiceList();
            bindUnloadCancel();

            if (state.pendingAutoStart) {
                setTimeout(() => {
                    startFromParagraph(1);
                }, 700);
            }
        });
    }

    function waitForContent(retries) {
        return new Promise((resolve) => {
            let count = 0;
            const timer = setInterval(() => {
                const el = document.querySelector('#bookContentBody');
                if (el && normalizeText(el.innerText).length > 20) {
                    clearInterval(timer);
                    resolve(true);
                    return;
                }
                count += 1;
                if (count >= retries) {
                    clearInterval(timer);
                    resolve(false);
                }
            }, 250);
        });
    }

    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return { ...DEFAULT_SETTINGS };
            }
            const parsed = JSON.parse(raw);
            const merged = { ...DEFAULT_SETTINGS, ...parsed };
            // Backward compat: prefetch từng là cài đặt riêng cho TikTok.
            if (!Object.prototype.hasOwnProperty.call(parsed, 'prefetchEnabled') && typeof parsed.tiktokPrefetch === 'boolean') {
                merged.prefetchEnabled = parsed.tiktokPrefetch;
            }
            if (!Object.prototype.hasOwnProperty.call(parsed, 'prefetchCount') && Number.isFinite(Number(parsed.tiktokPrefetchCount))) {
                merged.prefetchCount = clampInt(parsed.tiktokPrefetchCount, 0, 6);
            }
            return merged;
        } catch (err) {
            return { ...DEFAULT_SETTINGS };
        }
    }

    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
    }

    function saveSessionForNextChapter() {
        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({
                autoStart: true,
                createdAt: Date.now()
            })
        );
    }

    function consumePendingSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) {
                return false;
            }
            localStorage.removeItem(SESSION_KEY);
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.autoStart || !parsed.createdAt) {
                return false;
            }
            return Date.now() - parsed.createdAt <= AUTO_START_WINDOW_MS;
        } catch (err) {
            localStorage.removeItem(SESSION_KEY);
            return false;
        }
    }

    function refreshChapterData() {
        state.title = getChapterTitle();
        state.nextUrl = getNextChapterUrl();
        state.paragraphs = getParagraphNodes();
        clearRemoteAudioCache();
        rebuildSegments();
        refreshStartRange();
        resetHighlights();
        if (state.pickMode) {
            mountParagraphPickButtons();
            updateStatus('Đang chọn vị trí đọc');
        } else {
            unmountParagraphPickButtons();
            updateStatus('Sẵn sàng');
        }
        updatePickModeButton();
    }

    function setStartParagraphInput(paragraphNumber) {
        if (!state.ui || !state.ui.startInput) {
            return 1;
        }
        const max = Math.max(1, state.paragraphs.length);
        const safe = clampInt(paragraphNumber, 1, max);
        state.ui.startInput.value = String(safe);
        return safe;
    }

    function updatePickModeButton() {
        if (!state.ui || !state.ui.pickStartBtn) {
            return;
        }
        const btn = state.ui.pickStartBtn;
        btn.classList.toggle('twd-btn-picking', state.pickMode);
        btn.textContent = state.pickMode ? 'Tắt chọn vị trí' : 'Chọn vị trí đọc';
    }

    function unmountParagraphPickButtons() {
        const body = document.querySelector('#bookContentBody');
        if (body) {
            body.classList.remove('twd-tts-pick-mode');
            body.classList.remove('twd-tts-pick-target');
        }
        document.querySelectorAll('#bookContentBody .twd-tts-pick-point').forEach((el) => el.remove());
        document.querySelectorAll('#bookContentBody .twd-tts-pick-target').forEach((el) => {
            el.classList.remove('twd-tts-pick-target');
        });
    }

    function mountParagraphPickButtons() {
        unmountParagraphPickButtons();
        const body = document.querySelector('#bookContentBody');
        if (!body || state.paragraphs.length === 0) {
            return;
        }

        body.classList.add('twd-tts-pick-mode');
        state.paragraphs.forEach((paragraphEl, index) => {
            if (!(paragraphEl instanceof HTMLElement)) {
                return;
            }
            paragraphEl.classList.add('twd-tts-pick-target');

            const pickBtn = document.createElement('button');
            pickBtn.type = 'button';
            pickBtn.className = 'twd-tts-pick-point';
            pickBtn.title = `Chọn đoạn ${index + 1}`;
            pickBtn.setAttribute('aria-label', `Chọn đoạn ${index + 1}`);
            pickBtn.innerHTML = `
                <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M4 8.2l2.1 2.1L12 4.5"></path>
                </svg>
            `;

            pickBtn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const selected = setStartParagraphInput(index + 1);
                try {
                    paragraphEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } catch (err) {
                    paragraphEl.scrollIntoView();
                }
                setPickMode(false, { silent: true });
                updateStatus(`Đã chọn đoạn ${selected}`);
            });

            paragraphEl.insertBefore(pickBtn, paragraphEl.firstChild);
        });
    }

    function setPickMode(active, options) {
        const next = !!active;
        const silent = !!(options && options.silent);

        if (state.pickMode === next) {
            if (next) {
                mountParagraphPickButtons();
            } else {
                unmountParagraphPickButtons();
            }
            updatePickModeButton();
            return;
        }

        state.pickMode = next;
        if (state.pickMode) {
            mountParagraphPickButtons();
            if (!silent) {
                updateStatus('Bật chọn vị trí: bấm nút ở đoạn muốn đọc');
            }
        } else {
            unmountParagraphPickButtons();
            if (!silent) {
                updateStatus('Đã tắt chọn vị trí đọc');
            }
        }
        updatePickModeButton();
    }

    function getChapterTitle() {
        const candidates = [
            '.chapter-name',
            '.top-title .chapter-name',
            '.top-title a.truncate.chapter-name',
            '#bookContentBody p:first-child'
        ];

        for (const selector of candidates) {
            const node = document.querySelector(selector);
            const text = node ? normalizeText(node.textContent) : '';
            if (text) {
                return text;
            }
        }
        return normalizeText(document.title.replace(/\s*-\s*TruyenWikiDich\s*$/i, '')) || 'Chương mới';
    }

    function getNextChapterUrl() {
        const direct = document.querySelector('#btnNextChapter');
        if (direct && direct.href) {
            return direct.href;
        }

        const anchors = Array.from(document.querySelectorAll('a[href]'));
        const found = anchors.find((a) => /chương\s+sau/i.test(normalizeText(a.textContent)));
        return found ? found.href : '';
    }

    function getParagraphNodes() {
        const body = document.querySelector('#bookContentBody');
        if (!body) {
            return [];
        }

        const list = Array.from(body.querySelectorAll('p'))
            .filter((p) => normalizeText(p.textContent).length > 0);

        if (list.length > 0) {
            return list;
        }

        return [body];
    }

    function rebuildSegments() {
        stopReading(false);
        const configuredMaxChars = clampInt(state.settings.maxChars, 80, 600);
        state.settings.maxChars = configuredMaxChars;
        let effectiveMaxChars = configuredMaxChars;
        if (isRemoteProvider()) {
            const provider = getActiveRemoteProvider();
            const cap = provider && Number.isFinite(Number(provider.maxCharsCap)) ? Number(provider.maxCharsCap) : 0;
            if (cap > 0) {
                effectiveMaxChars = Math.min(effectiveMaxChars, clampInt(cap, 80, 600));
            }
        }

        const paragraphs = state.paragraphs.slice();
        const firstParagraph = paragraphs[0] ? normalizeText(paragraphs[0].innerText) : '';
        const shouldSkipFirst = firstParagraph && state.title && firstParagraph.toLowerCase() === state.title.toLowerCase();

        const segments = [];

        if (state.settings.includeTitle && state.title) {
            segments.push({
                text: state.title,
                paragraphIndex: -1,
                paragraphEl: null,
                chunkIndex: 0,
                chunkTotal: 1,
                isTitle: true
            });
        }

        paragraphs.forEach((p, paragraphIndex) => {
            if (paragraphIndex === 0 && shouldSkipFirst) {
                return;
            }
            const text = normalizeText(p.innerText);
            if (!text) {
                return;
            }
            const chunks = splitIntoChunks(text, effectiveMaxChars);
            chunks.forEach((chunk, chunkIndex) => {
                segments.push({
                    text: chunk,
                    paragraphIndex,
                    paragraphEl: p,
                    chunkIndex,
                    chunkTotal: chunks.length,
                    isTitle: false
                });
            });
        });

        state.segments = segments;
        state.segmentIndex = 0;
        updateProgressText();
    }

    function splitIntoChunks(text, maxChars) {
        const clean = normalizeText(text);
        if (!clean) {
            return [];
        }
        if (clean.length <= maxChars) {
            return [clean];
        }

        const sentenceParts = clean.match(/[^.!?。！？\n]+[.!?。！？]?/g) || [clean];
        const chunks = [];
        let current = '';

        sentenceParts.forEach((sentenceRaw) => {
            const sentence = normalizeText(sentenceRaw);
            if (!sentence) {
                return;
            }

            const units = sentence.length > maxChars ? hardSplit(sentence, maxChars) : [sentence];
            units.forEach((unit) => {
                if (!current) {
                    current = unit;
                    return;
                }
                const merged = `${current} ${unit}`.trim();
                if (merged.length <= maxChars) {
                    current = merged;
                } else {
                    chunks.push(current);
                    current = unit;
                }
            });
        });

        if (current) {
            chunks.push(current);
        }

        return chunks.length > 0 ? chunks : [clean];
    }

    function hardSplit(text, maxChars) {
        const words = normalizeText(text).split(' ').filter(Boolean);
        if (words.length === 0) {
            return [text.slice(0, maxChars)];
        }

        const chunks = [];
        let current = '';

        words.forEach((word) => {
            if (word.length > maxChars) {
                if (current) {
                    chunks.push(current);
                    current = '';
                }
                for (let i = 0; i < word.length; i += maxChars) {
                    chunks.push(word.slice(i, i + maxChars));
                }
                return;
            }

            const merged = current ? `${current} ${word}` : word;
            if (merged.length <= maxChars) {
                current = merged;
            } else {
                chunks.push(current);
                current = word;
            }
        });

        if (current) {
            chunks.push(current);
        }

        return chunks;
    }

    function normalizeText(input) {
        return String(input || '').replace(/\s+/g, ' ').trim();
    }

    function sleep(ms) {
        const wait = Math.max(0, Number(ms) || 0);
        return new Promise((resolve) => setTimeout(resolve, wait));
    }

    function clampInt(value, min, max) {
        const n = Number(value);
        if (!Number.isFinite(n)) {
            return min;
        }
        return Math.max(min, Math.min(max, Math.round(n)));
    }

    function getProviderId() {
        const id = String(state.settings.provider || 'browser');
        if (id === 'browser') {
            return 'browser';
        }
        if (Object.prototype.hasOwnProperty.call(REMOTE_PROVIDERS, id)) {
            return id;
        }
        return 'browser';
    }

    function isRemoteProvider() {
        return getProviderId() !== 'browser';
    }

    function getRemoteProvider(providerId) {
        const id = String(providerId || '');
        return Object.prototype.hasOwnProperty.call(REMOTE_PROVIDERS, id) ? REMOTE_PROVIDERS[id] : null;
    }

    function getActiveRemoteProvider() {
        return isRemoteProvider() ? getRemoteProvider(getProviderId()) : null;
    }

    function isTikTokProvider() {
        return getProviderId() === 'tiktok';
    }

    function openTikTokLogin() {
        window.open('https://www.tiktok.com/login?lang=vi-VN', '_blank', 'noopener,noreferrer');
    }

    function clearRemoteAudioCache() {
        if (state.remoteAudioCache && typeof state.remoteAudioCache.clear === 'function') {
            state.remoteAudioCache.clear();
        }
        if (state.remoteAudioInflight && typeof state.remoteAudioInflight.clear === 'function') {
            state.remoteAudioInflight.clear();
        }
        state.prefetchJobId += 1;
    }

    function clearNextSegmentTimer() {
        if (state.nextSegmentTimer) {
            clearTimeout(state.nextSegmentTimer);
            state.nextSegmentTimer = 0;
        }
    }

    function scheduleSpeakCurrentSegment() {
        clearNextSegmentTimer();
        const delayMs = clampInt(state.settings.segmentDelayMs, 0, 5000);
        if (delayMs <= 0) {
            speakCurrentSegment();
            return;
        }
        const token = state.utteranceToken;
        state.nextSegmentTimer = setTimeout(() => {
            state.nextSegmentTimer = 0;
            if (token !== state.utteranceToken || !state.reading || state.paused) {
                return;
            }
            speakCurrentSegment();
        }, delayMs);
    }

    function getPanelPositionKey() {
        return `${STORAGE_KEY}_panel_pos_v2`;
    }

    function getFabPositionKey() {
        return `${STORAGE_KEY}_fab_pos_v1`;
    }

    function restorePanelPosition() {
        if (!state.ui || !state.ui.panel) {
            return;
        }
        const panel = state.ui.panel;
        try {
            const raw = localStorage.getItem(getPanelPositionKey());
            if (!raw) {
                return;
            }
            const saved = JSON.parse(raw);
            if (!saved || typeof saved.left !== 'number' || typeof saved.top !== 'number') {
                return;
            }

            const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
            const maxTop = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
            const left = Math.min(Math.max(8, saved.left), maxLeft);
            const top = Math.min(Math.max(8, saved.top), maxTop);

            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        } catch (err) {
            localStorage.removeItem(getPanelPositionKey());
        }
    }

    function savePanelPosition(left, top) {
        localStorage.setItem(getPanelPositionKey(), JSON.stringify({ left, top }));
    }

    function resetPanelPosition() {
        if (!state.ui || !state.ui.panel) {
            return;
        }
        localStorage.removeItem(getPanelPositionKey());
        const panel = state.ui.panel;
        panel.style.left = 'auto';
        panel.style.top = 'auto';
        panel.style.right = '14px';
        panel.style.bottom = '14px';
    }

    function restoreFabPosition() {
        if (!state.ui || !state.ui.fabBtn) {
            return;
        }
        const fab = state.ui.fabBtn;
        try {
            const raw = localStorage.getItem(getFabPositionKey());
            if (!raw) {
                return;
            }
            const saved = JSON.parse(raw);
            if (!saved || typeof saved.left !== 'number' || typeof saved.top !== 'number') {
                return;
            }

            const fabWidth = Math.max(fab.offsetWidth, 52);
            const fabHeight = Math.max(fab.offsetHeight, 52);
            const maxLeft = Math.max(8, window.innerWidth - fabWidth - 8);
            const maxTop = Math.max(8, window.innerHeight - fabHeight - 8);
            const left = Math.min(Math.max(8, saved.left), maxLeft);
            const top = Math.min(Math.max(8, saved.top), maxTop);

            fab.style.left = `${left}px`;
            fab.style.top = `${top}px`;
            fab.style.right = 'auto';
            fab.style.bottom = 'auto';
        } catch (err) {
            localStorage.removeItem(getFabPositionKey());
        }
    }

    function saveFabPosition(left, top) {
        localStorage.setItem(getFabPositionKey(), JSON.stringify({ left, top }));
    }

    function setPanelVisible(visible, persist) {
        if (!state.ui) {
            return;
        }
        state.ui.panel.classList.toggle('twd-tts-panel-hidden', !visible);
        state.ui.fabBtn.classList.toggle('twd-tts-hidden', visible);
        if (persist !== false) {
            state.settings.panelCollapsed = !visible;
            saveSettings();
        }
    }

    function initPanelDrag() {
        if (!state.ui || !state.ui.dragHandle || !state.ui.fabBtn || !state.ui.panel) {
            return;
        }

        const panel = state.ui.panel;
        const handle = state.ui.dragHandle;
        const fab = state.ui.fabBtn;
        let dragging = false;
        let dragFromFab = false;
        let dragMoved = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let offsetX = 0;
        let offsetY = 0;

        const isInteractive = (el) => (el instanceof Element) && !!el.closest('button, input, textarea, select, label, a');

        const onMove = (event) => {
            if (!dragging) {
                return;
            }
            const target = dragFromFab ? fab : panel;
            const maxLeft = Math.max(8, window.innerWidth - target.offsetWidth - 8);
            const maxTop = Math.max(8, window.innerHeight - target.offsetHeight - 8);
            const left = Math.min(Math.max(8, event.clientX - offsetX), maxLeft);
            const top = Math.min(Math.max(8, event.clientY - offsetY), maxTop);
            if (dragFromFab) {
                if (Math.abs(event.clientX - dragStartX) > 4 || Math.abs(event.clientY - dragStartY) > 4) {
                    dragMoved = true;
                }
            }
            target.style.left = `${left}px`;
            target.style.top = `${top}px`;
            target.style.right = 'auto';
            target.style.bottom = 'auto';
        };

        const onUp = () => {
            if (!dragging) {
                return;
            }
            dragging = false;
            const wasFromFab = dragFromFab;
            if (dragFromFab) {
                fab.classList.remove('twd-tts-fab-dragging');
                if (dragMoved) {
                    fab.dataset.dragMoved = '1';
                }
            }
            dragFromFab = false;
            if (wasFromFab) {
                const rect = fab.getBoundingClientRect();
                saveFabPosition(rect.left, rect.top);
            } else {
                const rect = panel.getBoundingClientRect();
                savePanelPosition(rect.left, rect.top);
            }
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };

        const startDrag = (event, fromFab) => {
            if (event.button !== 0) {
                return false;
            }
            if (!fromFab && isInteractive(event.target)) {
                return false;
            }
            dragging = true;
            dragFromFab = fromFab;
            dragMoved = false;
            dragStartX = event.clientX;
            dragStartY = event.clientY;
            const target = fromFab ? fab : panel;
            const rect = target.getBoundingClientRect();
            offsetX = event.clientX - rect.left;
            offsetY = event.clientY - rect.top;
            target.style.left = `${rect.left}px`;
            target.style.top = `${rect.top}px`;
            target.style.right = 'auto';
            target.style.bottom = 'auto';
            if (fromFab) {
                fab.classList.add('twd-tts-fab-dragging');
                fab.dataset.dragMoved = '0';
            }
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            return true;
        };

        handle.addEventListener('pointerdown', (event) => {
            startDrag(event, false);
        });

        fab.addEventListener('pointerdown', (event) => {
            if (!state.settings.panelCollapsed) {
                return;
            }
            const started = startDrag(event, true);
            if (started) {
                event.preventDefault();
            }
        });

        handle.addEventListener('dblclick', () => {
            resetPanelPosition();
        });

        window.addEventListener('resize', () => {
            const reposition = (target, saver) => {
                const anchoredByCoords = !!target.style.left && target.style.left !== 'auto';
                if (!anchoredByCoords) {
                    return;
                }
                const rect = target.getBoundingClientRect();
                const maxLeft = Math.max(8, window.innerWidth - target.offsetWidth - 8);
                const maxTop = Math.max(8, window.innerHeight - target.offsetHeight - 8);
                const left = Math.min(Math.max(8, rect.left), maxLeft);
                const top = Math.min(Math.max(8, rect.top), maxTop);
                target.style.left = `${left}px`;
                target.style.top = `${top}px`;
                target.style.right = 'auto';
                target.style.bottom = 'auto';
                saver(left, top);
            };

            reposition(panel, savePanelPosition);
            if (state.settings.panelCollapsed) {
                reposition(fab, saveFabPosition);
            }
        });
    }

    function buildUi() {
        const host = document.createElement('div');
        host.id = 'twd-tts-shadow-host';
        host.style.position = 'fixed';
        host.style.left = '0';
        host.style.top = '0';
        host.style.width = '0';
        host.style.height = '0';
        host.style.zIndex = '2147483647';
        host.style.pointerEvents = 'auto';

        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <style>
                :host {
                    all: initial;
                    --wda-primary: #ff8a65;
                    --wda-primary-strong: #ff7043;
                    --wda-secondary: #26c6da;
                    --wda-secondary-strong: #00acc1;
                    --wda-danger: #ef5350;
                    --wda-danger-strong: #e53935;
                    --wda-surface: #ffffff;
                    --wda-surface-2: #f6f8ff;
                    --wda-border: rgba(98, 110, 140, 0.18);
                    --wda-shadow: 0 18px 40px rgba(53, 64, 90, 0.22);
                    --wda-text: #2f2a36;
                    --wda-muted: #6b6f80;
                    --wda-radius: 14px;
                    --wda-radius-sm: 10px;
                    --wda-mono: "JetBrains Mono", "Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
                    font-family: "Be Vietnam Pro", "Noto Sans", "Segoe UI", Arial, sans-serif;
                    color: var(--wda-text);
                    color-scheme: light;
                }

                @media (prefers-color-scheme: dark) {
                    :host {
                        --wda-surface: #0b1220;
                        --wda-surface-2: #111827;
                        --wda-border: rgba(148, 163, 184, 0.25);
                        --wda-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
                        --wda-text: #e5e7eb;
                        --wda-muted: #a3a3b5;
                        color-scheme: dark;
                    }
                }

                .twd-tts-panel {
                    position: fixed;
                    right: 14px;
                    bottom: 14px;
                    width: 360px;
                    background: var(--wda-surface);
                    border: 1px solid var(--wda-border);
                    border-radius: var(--wda-radius);
                    box-shadow: var(--wda-shadow);
                    color: var(--wda-text);
                    font-size: 13px;
                    line-height: 1.45;
                    overflow: hidden;
                }

                .twd-tts-panel.twd-tts-panel-hidden {
                    display: none;
                }

                .twd-tts-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    border-bottom: 1px solid var(--wda-border);
                    background: linear-gradient(135deg, rgba(255, 138, 101, 0.14) 0%, rgba(38, 198, 218, 0.16) 100%);
                    cursor: move;
                    user-select: none;
                }

                .twd-tts-title-wrap {
                    display: grid;
                    gap: 1px;
                    min-width: 0;
                }

                .twd-tts-title {
                    font-weight: 800;
                    font-size: 14px;
                }

                .twd-tts-subtitle {
                    font-size: 11px;
                    color: var(--wda-muted);
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }

                .twd-tts-head-actions button {
                    border: 1px solid var(--wda-border);
                    background: var(--wda-surface);
                    border-radius: 6px;
                    width: 24px;
                    height: 24px;
                    padding: 0;
                    line-height: 1;
                    display: grid;
                    place-items: center;
                    cursor: pointer;
                    color: var(--wda-text);
                }

                .twd-tts-head-actions svg {
                    width: 12px;
                    height: 12px;
                    stroke: currentColor;
                    stroke-width: 2.2;
                    fill: none;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                .twd-tts-fab {
                    position: fixed;
                    right: 14px;
                    bottom: 14px;
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    border: none;
                    color: #fff;
                    background: linear-gradient(135deg, var(--wda-secondary) 0%, #42a5f5 100%);
                    box-shadow: 0 10px 24px rgba(30, 64, 175, 0.45);
                    display: grid;
                    place-items: center;
                    cursor: grab;
                    padding: 0;
                }

                .twd-tts-fab svg {
                    width: 26px;
                    height: 26px;
                    stroke: #ffffff;
                    stroke-width: 1.9;
                    fill: none;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                .twd-tts-fab:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 12px 28px rgba(30, 64, 175, 0.5);
                }

                .twd-tts-fab.twd-tts-fab-dragging {
                    cursor: grabbing;
                    transform: none;
                }

                .twd-tts-body {
                    display: grid;
                    gap: 10px;
                    padding: 10px;
                    max-height: 70vh;
                    overflow: auto;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(130, 141, 168, 0.72) rgba(148, 163, 184, 0.18);
                }

                .twd-tts-body.collapsed {
                    display: none;
                }

                .twd-tts-card {
                    background: var(--wda-surface-2);
                    border: 1px solid var(--wda-border);
                    border-radius: var(--wda-radius-sm);
                    padding: 9px;
                }

                .twd-tts-row {
                    margin-bottom: 8px;
                }

                .twd-tts-row:last-child {
                    margin-bottom: 0;
                }

                .twd-tts-status {
                    font-weight: 700;
                    background: rgba(255, 255, 255, 0.5);
                    padding: 8px;
                    border-radius: 8px;
                    border: 1px solid var(--wda-border);
                    font-family: var(--wda-mono);
                    font-size: 12px;
                }

                .twd-tts-buttons {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 6px;
                }

                button {
                    padding: 6px 6px;
                    border-radius: 8px;
                    border: 1px solid var(--wda-border);
                    background: var(--wda-surface);
                    color: var(--wda-text);
                    cursor: pointer;
                    font-weight: 600;
                    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
                }

                button:hover {
                    transform: translateY(-1px);
                }

                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .twd-btn-primary {
                    border: none;
                    color: #fff;
                    background: linear-gradient(135deg, var(--wda-primary) 0%, #ffb74d 100%);
                    box-shadow: 0 10px 18px rgba(255, 138, 101, 0.25);
                }

                .twd-btn-primary:hover {
                    box-shadow: 0 12px 20px rgba(255, 138, 101, 0.32);
                }

                .twd-btn-secondary {
                    border: none;
                    color: #fff;
                    background: linear-gradient(135deg, var(--wda-secondary) 0%, #42a5f5 100%);
                    box-shadow: 0 10px 18px rgba(38, 198, 218, 0.26);
                }

                .twd-btn-secondary:hover {
                    box-shadow: 0 12px 20px rgba(38, 198, 218, 0.34);
                }

                .twd-btn-picking {
                    border: none;
                    color: #fff;
                    background: linear-gradient(135deg, #fb8c00 0%, #ff7043 100%);
                    box-shadow: 0 10px 18px rgba(251, 140, 0, 0.35);
                }

                .twd-btn-danger {
                    border: none;
                    color: #fff;
                    background: linear-gradient(135deg, var(--wda-danger) 0%, #ff8a80 100%);
                    box-shadow: 0 10px 18px rgba(239, 83, 80, 0.28);
                }

                .twd-btn-danger:hover {
                    box-shadow: 0 12px 20px rgba(239, 83, 80, 0.36);
                }

                input[type="number"],
                select,
                input[type="range"] {
                    width: 100%;
                    box-sizing: border-box;
                }

                input[type="number"],
                select,
                textarea {
                    border: 1px solid var(--wda-border);
                    border-radius: 10px;
                    background: var(--wda-surface);
                    color: var(--wda-text);
                    box-shadow: inset 0 1px 2px rgba(16, 24, 40, 0.06);
                    font-family: inherit;
                    font-size: 13px;
                    padding: 7px 9px;
                }

                .twd-tts-grid label {
                    display: block;
                    margin-bottom: 3px;
                    font-weight: 600;
                }

                .twd-tts-inline {
                    display: grid;
                    grid-template-columns: 1fr auto;
                    gap: 6px;
                    align-items: center;
                }

                .twd-tts-check {
                    display: block;
                    font-size: 12px;
                    user-select: none;
                }

                .twd-tts-check input {
                    margin-right: 6px;
                }

                .twd-tts-hidden {
                    display: none;
                }

                textarea {
                    width: 100%;
                    box-sizing: border-box;
                    resize: vertical;
                    min-height: 44px;
                    max-height: 120px;
                    font: 12px/1.35 var(--wda-mono);
                    scrollbar-width: thin;
                    scrollbar-color: rgba(130, 141, 168, 0.72) rgba(148, 163, 184, 0.18);
                }

                .twd-tts-cookie-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                }

                .twd-tts-cookie-info {
                    font: 11px/1.25 var(--wda-mono);
                    color: var(--wda-muted);
                    background: rgba(255, 255, 255, 0.45);
                    border: 1px solid var(--wda-border);
                    border-radius: 10px;
                    padding: 7px 9px;
                    white-space: pre-wrap;
                    word-break: break-word;
                }

                .twd-tts-small-grid {
                    display: grid;
                    grid-template-columns: 1fr auto;
                    gap: 6px;
                    align-items: center;
                }

                #twd-cookie-modal {
                    position: fixed;
                    inset: 0;
                    z-index: 2147483647;
                    padding: 14px;
                }

                #twd-cookie-modal.twd-tts-hidden {
                    display: none !important;
                }

                #twd-cookie-modal:not(.twd-tts-hidden) {
                    display: grid;
                    place-items: center;
                }

                .twd-cookie-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(2, 6, 23, 0.55);
                    backdrop-filter: blur(6px);
                    z-index: 0;
                }

                .twd-cookie-modal-dialog {
                    position: relative;
                    z-index: 1;
                    width: min(560px, 92vw);
                    max-height: min(72vh, 620px);
                    display: grid;
                    grid-template-rows: auto 1fr;
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    background: linear-gradient(165deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.72) 100%);
                    box-shadow: 0 40px 90px rgba(15, 23, 42, 0.35);
                    overflow: hidden;
                }

                .twd-cookie-modal-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 10px 10px 12px;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.35);
                }

                .twd-cookie-modal-title {
                    font-weight: 800;
                    letter-spacing: 0.02em;
                }

                .twd-cookie-modal-head button {
                    border: 1px solid rgba(148, 163, 184, 0.7);
                    background: rgba(255, 255, 255, 0.6);
                    border-radius: 10px;
                    width: 34px;
                    height: 34px;
                    padding: 0;
                    line-height: 1;
                    display: grid;
                    place-items: center;
                    cursor: pointer;
                    color: rgba(15, 23, 42, 0.9);
                }

                .twd-cookie-modal-head svg {
                    width: 16px;
                    height: 16px;
                    stroke: currentColor;
                    stroke-width: 2.2;
                    fill: none;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                .twd-cookie-modal-body {
                    padding: 10px 12px 12px 12px;
                    overflow: auto;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(130, 141, 168, 0.72) rgba(148, 163, 184, 0.18);
                }

                .twd-cookie-modal-body::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }

                .twd-cookie-modal-body::-webkit-scrollbar-track {
                    background: rgba(148, 163, 184, 0.18);
                    border-radius: 999px;
                }

                .twd-cookie-modal-body::-webkit-scrollbar-thumb {
                    background: rgba(130, 141, 168, 0.72);
                    border-radius: 999px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                }

                #twd-cookie-modal-text {
                    min-height: 180px;
                    max-height: 45vh;
                }

                .twd-tts-body::-webkit-scrollbar,
                textarea::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }

                .twd-tts-body::-webkit-scrollbar-track,
                textarea::-webkit-scrollbar-track {
                    background: rgba(148, 163, 184, 0.18);
                    border-radius: 999px;
                }

                .twd-tts-body::-webkit-scrollbar-thumb,
                textarea::-webkit-scrollbar-thumb {
                    background: rgba(130, 141, 168, 0.72);
                    border-radius: 999px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                }

                .twd-tts-body::-webkit-scrollbar-thumb:hover,
                textarea::-webkit-scrollbar-thumb:hover {
                    background: rgba(101, 112, 140, 0.9);
                    background-clip: padding-box;
                }

                .twd-tts-help {
                    font-size: 11px;
                    color: var(--wda-muted);
                    margin-top: -2px;
                }

                .twd-tts-toggle-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 6px 10px;
                }

                .twd-tts-auth-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 6px;
                    margin-top: 6px;
                }

                @media (max-width: 768px) {
                    .twd-tts-panel {
                        width: min(96vw, 460px);
                    }
                }
            </style>
            <section class="twd-tts-panel">
                <div class="twd-tts-header" id="twd-tts-drag-handle">
                    <div class="twd-tts-title-wrap">
                        <div class="twd-tts-title">TTS Reader</div>
                        <div class="twd-tts-subtitle">TruyệnWikiDich · Shadow UI</div>
                    </div>
                    <div class="twd-tts-head-actions">
                        <button type="button" id="twd-tts-close" title="Thu gọn">
                            <svg viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M3 3l10 10M13 3L3 13"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="twd-tts-body">
                    <section class="twd-tts-card">
                        <div class="twd-tts-row twd-tts-status" id="twd-tts-status">Đang khởi tạo...</div>
                        <div class="twd-tts-row twd-tts-buttons">
                            <button type="button" id="twd-tts-play" class="twd-btn-primary">Play</button>
                            <button type="button" id="twd-tts-pause" class="twd-btn-secondary">Pause</button>
                            <button type="button" id="twd-tts-stop" class="twd-btn-danger">Stop</button>
                            <button type="button" id="twd-tts-next">Next</button>
                        </div>
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Bắt đầu từ đoạn</label>
                            <div class="twd-tts-inline">
                                <input id="twd-tts-start" type="number" min="1" step="1" value="1" readonly />
                                <button type="button" id="twd-tts-start-btn" class="twd-btn-secondary">Đọc từ đây</button>
                            </div>
                            <div class="twd-tts-inline">
                                <button type="button" id="twd-tts-pick-start" class="twd-btn-secondary">Chọn vị trí đọc</button>
                                <span class="twd-tts-help">Bật mode rồi bấm nút ở cạnh từng đoạn trên trang.</span>
                            </div>
                        </div>
                    </section>

                    <section class="twd-tts-card">
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Nguồn giọng</label>
                            <select id="twd-tts-provider">
                                <option value="browser">Browser Speech</option>
                                <option value="tiktok">TikTok TTS</option>
                            </select>
                        </div>
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Giọng đọc</label>
                            <select id="twd-tts-voice"></select>
                        </div>
                        <div class="twd-tts-row twd-tts-grid twd-tts-hidden" id="twd-tiktok-auth-row">
                            <div class="twd-tts-help" id="twd-tiktok-auth-msg">TikTok TTS cần cookie phiên. Dán cookie (JSON/Netscape/Cookie header) vào ô bên dưới.</div>
                            <div class="twd-tts-auth-actions">
                                <button type="button" id="twd-tiktok-login" class="twd-btn-secondary">Mở TikTok</button>
                                <button type="button" id="twd-tiktok-test">Thử giọng</button>
                            </div>
                        </div>
                        <div class="twd-tts-row twd-tts-grid twd-tts-hidden" id="twd-tiktok-cookie-row">
                            <label>Cookie TikTok</label>
                            <div class="twd-tts-cookie-actions">
                                <button type="button" id="twd-tiktok-cookie-enter" class="twd-btn-secondary">Nhập cookie</button>
                                <button type="button" id="twd-tiktok-cookie-clear" class="twd-btn-danger">Xóa cookie</button>
                            </div>
                            <div class="twd-tts-cookie-info" id="twd-tiktok-cookie-info">Chưa có cookie.</div>
                        </div>
                    </section>

                    <section class="twd-tts-card">
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Tốc độ (<span id="twd-rate-text">${state.settings.rate.toFixed(2)}</span>)</label>
                            <input id="twd-rate" type="range" min="0.6" max="1.6" step="0.05" value="${state.settings.rate}" />
                        </div>
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Cao độ (<span id="twd-pitch-text">${state.settings.pitch.toFixed(2)}</span>)</label>
                            <input id="twd-pitch" type="range" min="0.7" max="1.4" step="0.05" value="${state.settings.pitch}" />
                        </div>
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Âm lượng (<span id="twd-volume-text">${state.settings.volume.toFixed(2)}</span>)</label>
                            <input id="twd-volume" type="range" min="0.2" max="1" step="0.05" value="${state.settings.volume}" />
                        </div>
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Max ký tự/chunk</label>
                            <input id="twd-maxchars" type="number" min="80" max="600" step="10" value="${state.settings.maxChars}" />
                        </div>
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Delay giữa mục (ms)</label>
                            <input id="twd-seg-delay" type="number" min="0" max="5000" step="50" value="${clampInt(state.settings.segmentDelayMs, 0, 5000)}" />
                        </div>
                        <div class="twd-tts-row twd-tts-grid">
                            <label>Prefetch (remote)</label>
                            <div class="twd-tts-small-grid">
                                <label class="twd-tts-check" style="margin:0"><input id="twd-prefetch" type="checkbox" ${state.settings.prefetchEnabled ? 'checked' : ''}/> Bật</label>
                                <input id="twd-prefetch-count" type="number" min="0" max="6" step="1" value="${clampInt(state.settings.prefetchCount, 0, 6)}" title="Số mục prefetch" />
                            </div>
                            <div class="twd-tts-help">Áp dụng cho các giọng remote (TikTok, ...). Browser Speech sẽ bỏ qua.</div>
                        </div>
                    </section>

                    <section class="twd-tts-card twd-tts-toggle-grid">
                        <label class="twd-tts-check"><input id="twd-autonext" type="checkbox" ${state.settings.autoNext ? 'checked' : ''}/> Tự qua chương sau</label>
                        <label class="twd-tts-check"><input id="twd-includetitle" type="checkbox" ${state.settings.includeTitle ? 'checked' : ''}/> Đọc tên chương trước</label>
                        <label class="twd-tts-check"><input id="twd-autoscroll" type="checkbox" ${state.settings.autoScroll ? 'checked' : ''}/> Tự cuộn tới đoạn đang đọc</label>
                        <label class="twd-tts-check"><input id="twd-autostart-next" type="checkbox" ${state.settings.autoStartOnNextChapter ? 'checked' : ''}/> Tự phát chương kế tiếp</label>
                    </section>
                </div>
            </section>
            <button type="button" id="twd-tts-fab" class="twd-tts-fab ${state.settings.panelCollapsed ? '' : 'twd-tts-hidden'}" title="Mở TTS">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4.5 13v4.5a1.5 1.5 0 001.5 1.5h1.2a1.8 1.8 0 001.8-1.8v-3.4A1.8 1.8 0 007.2 12H6a1.5 1.5 0 00-1.5 1z"></path>
                    <path d="M19.5 13v4.5a1.5 1.5 0 01-1.5 1.5h-1.2a1.8 1.8 0 01-1.8-1.8v-3.4A1.8 1.8 0 0116.8 12H18a1.5 1.5 0 011.5 1z"></path>
                    <path d="M4.5 13A7.5 7.5 0 0112 5.5 7.5 7.5 0 0119.5 13"></path>
                </svg>
            </button>
            <div class="twd-tts-hidden" id="twd-cookie-modal" role="dialog" aria-modal="true">
                <div class="twd-cookie-modal-overlay" id="twd-cookie-modal-overlay"></div>
                <div class="twd-cookie-modal-dialog">
                    <div class="twd-cookie-modal-head">
                        <div class="twd-cookie-modal-title">Nhập Cookie TikTok</div>
                        <button type="button" id="twd-cookie-modal-close" title="Đóng">
                            <svg viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M3 3l10 10M13 3L3 13"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="twd-cookie-modal-body">
                        <div class="twd-tts-help" id="twd-cookie-modal-msg">Dán cookie (JSON/Netscape/Cookie header) rồi bấm Lưu. Cookie sẽ được lưu và không hiển thị lại trong UI.</div>
                        <textarea id="twd-cookie-modal-text" placeholder="Dán Cookie header: a=b; c=d\nHoặc dán JSON cookies\nHoặc dán Netscape cookie file (Cookie-Editor)"></textarea>
                        <div class="twd-tts-cookie-actions" style="margin-top:6px">
                            <button type="button" id="twd-cookie-modal-save" class="twd-btn-secondary">Lưu</button>
                            <button type="button" id="twd-cookie-modal-cancel">Hủy</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(host);
        state.uiHost = host;

        state.ui = {
            panel: shadow.querySelector('.twd-tts-panel'),
            body: shadow.querySelector('.twd-tts-body'),
            dragHandle: shadow.querySelector('#twd-tts-drag-handle'),
            status: shadow.querySelector('#twd-tts-status'),
            playBtn: shadow.querySelector('#twd-tts-play'),
            pauseBtn: shadow.querySelector('#twd-tts-pause'),
            stopBtn: shadow.querySelector('#twd-tts-stop'),
            nextBtn: shadow.querySelector('#twd-tts-next'),
            startInput: shadow.querySelector('#twd-tts-start'),
            startBtn: shadow.querySelector('#twd-tts-start-btn'),
            providerSelect: shadow.querySelector('#twd-tts-provider'),
            voiceSelect: shadow.querySelector('#twd-tts-voice'),
            tiktokAuthRow: shadow.querySelector('#twd-tiktok-auth-row'),
            tiktokAuthMsg: shadow.querySelector('#twd-tiktok-auth-msg'),
            tiktokLoginBtn: shadow.querySelector('#twd-tiktok-login'),
            tiktokTestBtn: shadow.querySelector('#twd-tiktok-test'),
            tiktokCookieRow: shadow.querySelector('#twd-tiktok-cookie-row'),
            tiktokCookieEnterBtn: shadow.querySelector('#twd-tiktok-cookie-enter'),
            tiktokCookieClearBtn: shadow.querySelector('#twd-tiktok-cookie-clear'),
            tiktokCookieInfo: shadow.querySelector('#twd-tiktok-cookie-info'),
            prefetchInput: shadow.querySelector('#twd-prefetch'),
            prefetchCountInput: shadow.querySelector('#twd-prefetch-count'),
            cookieModal: shadow.querySelector('#twd-cookie-modal'),
            cookieModalOverlay: shadow.querySelector('#twd-cookie-modal-overlay'),
            cookieModalCloseBtn: shadow.querySelector('#twd-cookie-modal-close'),
            cookieModalCancelBtn: shadow.querySelector('#twd-cookie-modal-cancel'),
            cookieModalSaveBtn: shadow.querySelector('#twd-cookie-modal-save'),
            cookieModalMsg: shadow.querySelector('#twd-cookie-modal-msg'),
            cookieModalText: shadow.querySelector('#twd-cookie-modal-text'),
            rateInput: shadow.querySelector('#twd-rate'),
            pitchInput: shadow.querySelector('#twd-pitch'),
            volumeInput: shadow.querySelector('#twd-volume'),
            maxCharsInput: shadow.querySelector('#twd-maxchars'),
            segDelayInput: shadow.querySelector('#twd-seg-delay'),
            autoNextInput: shadow.querySelector('#twd-autonext'),
            includeTitleInput: shadow.querySelector('#twd-includetitle'),
            autoScrollInput: shadow.querySelector('#twd-autoscroll'),
            autoStartNextInput: shadow.querySelector('#twd-autostart-next'),
            rateText: shadow.querySelector('#twd-rate-text'),
            pitchText: shadow.querySelector('#twd-pitch-text'),
            volumeText: shadow.querySelector('#twd-volume-text'),
            closeBtn: shadow.querySelector('#twd-tts-close'),
            fabBtn: shadow.querySelector('#twd-tts-fab'),
            pickStartBtn: shadow.querySelector('#twd-tts-pick-start')
        };

        state.ui.providerSelect.value = state.settings.provider;
        restoreFabPosition();
        restorePanelPosition();
        bindUiEvents();
        initPanelDrag();
    }

    function bindUiEvents() {
        const ui = state.ui;
        ui.playBtn.addEventListener('click', onPlayClick);
        ui.pauseBtn.addEventListener('click', onPauseClick);
        ui.stopBtn.addEventListener('click', () => stopReading(true));
        ui.nextBtn.addEventListener('click', onNextClick);
        ui.startBtn.addEventListener('click', () => {
            const startParagraph = clampInt(ui.startInput.value, 1, Math.max(1, state.paragraphs.length));
            startFromParagraph(startParagraph);
        });
        ui.pickStartBtn.addEventListener('click', () => {
            setPickMode(!state.pickMode);
        });

        ui.providerSelect.addEventListener('change', () => {
            const nextId = String(ui.providerSelect.value || 'browser');
            state.settings.provider = (nextId === 'browser' || getRemoteProvider(nextId)) ? nextId : 'browser';
            saveSettings();
            stopReading(false);
            renderVoiceOptions();
            refreshProviderUi();
            const pid = getProviderId();
            const msg = pid === 'browser'
                ? 'Đã chuyển sang Browser Speech'
                : `Đã chuyển sang ${getRemoteProvider(pid) ? getRemoteProvider(pid).label : pid} TTS`;
            updateStatus(msg);
            rebuildSegments();
            refreshStartRange();
            resetHighlights();
        });

        ui.voiceSelect.addEventListener('change', () => {
            if (isRemoteProvider()) {
                const provider = getActiveRemoteProvider();
                if (provider) {
                    provider.setVoiceId(ui.voiceSelect.value);
                }
            } else {
                state.settings.voiceURI = ui.voiceSelect.value;
            }
            saveSettings();
        });

        ui.tiktokLoginBtn.addEventListener('click', () => {
            openTikTokLogin();
        });

        ui.tiktokTestBtn.addEventListener('click', () => {
            testTikTokTts();
        });

        ui.tiktokCookieEnterBtn.addEventListener('click', () => {
            openTikTokCookieModal({ reason: 'manual' });
        });

        ui.tiktokCookieClearBtn.addEventListener('click', () => {
            state.settings.tiktokCookieText = '';
            saveSettings();
            clearRemoteAudioCache();
            updateTikTokCookieInfo();
            updateStatus('Đã xóa cookie TikTok');
        });

        ui.cookieModalOverlay.addEventListener('click', (event) => {
            // Không cho click ngoài popup tự thoát.
            event.preventDefault();
            event.stopPropagation();
        });

        const closeCookieModal = () => {
            closeTikTokCookieModal();
        };

        ui.cookieModalCloseBtn.addEventListener('click', closeCookieModal);
        ui.cookieModalCancelBtn.addEventListener('click', closeCookieModal);

        ui.cookieModalSaveBtn.addEventListener('click', () => {
            const raw = String(ui.cookieModalText.value || '');
            const parsed = parseTikTokCookieInput(raw);
            if (parsed.error) {
                ui.cookieModalMsg.textContent = `Không đọc được cookie: ${parsed.error}`;
                return;
            }
            if (!parsed.header) {
                ui.cookieModalMsg.textContent = 'Chưa có nội dung cookie.';
                return;
            }
            if (!parsed.hasSession) {
                ui.cookieModalMsg.textContent = 'Cookie thiếu sessionid/sid_tt/sid_guard. Hãy export lại cookie sau khi đăng nhập TikTok.';
                return;
            }
            state.settings.tiktokCookieText = raw;
            saveSettings();
            clearRemoteAudioCache();
            updateTikTokCookieInfo();
            closeTikTokCookieModal();
            updateStatus('Đã lưu cookie TikTok');
        });

        if (ui.prefetchInput) {
            ui.prefetchInput.addEventListener('change', () => {
                state.settings.prefetchEnabled = !!ui.prefetchInput.checked;
                saveSettings();
                if (!state.settings.prefetchEnabled) {
                    clearRemoteAudioCache();
                }
            });
        }

        if (ui.prefetchCountInput) {
            ui.prefetchCountInput.addEventListener('change', () => {
                state.settings.prefetchCount = clampInt(ui.prefetchCountInput.value, 0, 6);
                ui.prefetchCountInput.value = String(state.settings.prefetchCount);
                saveSettings();
            });
        }

        ui.rateInput.addEventListener('input', () => {
            state.settings.rate = Number(ui.rateInput.value);
            ui.rateText.textContent = state.settings.rate.toFixed(2);
            saveSettings();
        });

        ui.pitchInput.addEventListener('input', () => {
            state.settings.pitch = Number(ui.pitchInput.value);
            ui.pitchText.textContent = state.settings.pitch.toFixed(2);
            saveSettings();
        });

        ui.volumeInput.addEventListener('input', () => {
            state.settings.volume = Number(ui.volumeInput.value);
            ui.volumeText.textContent = state.settings.volume.toFixed(2);
            saveSettings();
        });

        ui.maxCharsInput.addEventListener('change', () => {
            state.settings.maxChars = clampInt(ui.maxCharsInput.value, 80, 600);
            ui.maxCharsInput.value = String(state.settings.maxChars);
            saveSettings();
            rebuildSegments();
            refreshStartRange();
            updateStatus('Đã cập nhật chunk');
        });

        ui.segDelayInput.addEventListener('change', () => {
            state.settings.segmentDelayMs = clampInt(ui.segDelayInput.value, 0, 5000);
            ui.segDelayInput.value = String(state.settings.segmentDelayMs);
            saveSettings();
        });

        ui.autoNextInput.addEventListener('change', () => {
            state.settings.autoNext = ui.autoNextInput.checked;
            saveSettings();
        });

        ui.includeTitleInput.addEventListener('change', () => {
            state.settings.includeTitle = ui.includeTitleInput.checked;
            saveSettings();
            rebuildSegments();
            updateStatus('Đã cập nhật đọc tiêu đề');
        });

        ui.autoScrollInput.addEventListener('change', () => {
            state.settings.autoScroll = ui.autoScrollInput.checked;
            saveSettings();
        });

        ui.autoStartNextInput.addEventListener('change', () => {
            state.settings.autoStartOnNextChapter = ui.autoStartNextInput.checked;
            saveSettings();
        });

        ui.closeBtn.addEventListener('click', () => {
            setPanelVisible(false);
        });

        ui.fabBtn.addEventListener('click', () => {
            if (ui.fabBtn.dataset.dragMoved === '1') {
                ui.fabBtn.dataset.dragMoved = '0';
                return;
            }
            setPanelVisible(true);
        });

        setPanelVisible(!state.settings.panelCollapsed, false);
    }

    function onPlayClick() {
        if (state.paused) {
            state.paused = false;
            if (isTikTokProvider()) {
                if (state.currentAudio) {
                    state.currentAudio.play().catch(() => {
                        speakCurrentSegment();
                    });
                } else {
                    speakCurrentSegment();
                }
            } else {
                speechSynthesis.resume();
            }
            updateStatus('Tiếp tục đọc...');
            return;
        }

        if (state.reading) {
            updateStatus('Đang đọc...');
            return;
        }

        const startParagraph = clampInt(state.ui.startInput.value, 1, Math.max(1, state.paragraphs.length));
        startFromParagraph(startParagraph);
    }

    function onPauseClick() {
        if (state.reading && !state.paused) {
            state.paused = true;
            clearNextSegmentTimer();
            if (isTikTokProvider()) {
                if (state.currentAudio) {
                    state.currentAudio.pause();
                }
            } else {
                speechSynthesis.pause();
            }
            updateStatus('Đang tạm dừng');
            return;
        }

        if (state.reading && state.paused) {
            state.paused = false;
            if (isTikTokProvider()) {
                if (state.currentAudio) {
                    state.currentAudio.play().catch(() => {
                        speakCurrentSegment();
                    });
                } else {
                    speakCurrentSegment();
                }
            } else {
                speechSynthesis.resume();
            }
            updateStatus('Tiếp tục đọc...');
        }
    }

    function onNextClick() {
        if (state.segments.length === 0) {
            return;
        }

        let nextIndex = state.segmentIndex + 1;
        if (!state.reading && !state.paused) {
            const startParagraph = clampInt(state.ui.startInput.value, 1, Math.max(1, state.paragraphs.length));
            nextIndex = findSegmentIndexForParagraph(startParagraph);
        }

        if (nextIndex >= state.segments.length) {
            finishChapter();
            return;
        }

        stopSpeechOnly();
        state.segmentIndex = nextIndex;
        speakCurrentSegment();
    }

    function startFromParagraph(paragraphNumber) {
        if (!state.segments.length) {
            updateStatus('Không có nội dung để đọc');
            return;
        }

        if (state.pickMode) {
            setPickMode(false, { silent: true });
        }

        const beginPlay = () => {
            const idx = findSegmentIndexForParagraph(paragraphNumber);
            state.segmentIndex = idx;
            resetHighlights();
            markParagraphsBeforeSegmentAsRead(idx);
            stopSpeechOnly();
            speakCurrentSegment();
        };

        beginPlay();
    }

    function findSegmentIndexForParagraph(paragraphNumber) {
        const targetParagraph = Math.max(1, paragraphNumber) - 1;
        if (targetParagraph <= 0 && state.settings.includeTitle && state.segments[0] && state.segments[0].isTitle) {
            return 0;
        }

        const idx = state.segments.findIndex((s) => !s.isTitle && s.paragraphIndex >= targetParagraph);
        if (idx >= 0) {
            return idx;
        }

        return 0;
    }

    function speakCurrentSegment() {
        if (!state.segments[state.segmentIndex]) {
            finishChapter();
            return;
        }

        state.reading = true;
        state.paused = false;

        const segment = state.segments[state.segmentIndex];
        const token = ++state.utteranceToken;

        activateSegmentHighlight(segment);

        if (isRemoteProvider()) {
            speakSegmentWithRemote(segment, token);
        } else {
            speakSegmentWithBrowser(segment, token);
        }
    }

    function speakSegmentWithBrowser(segment, token) {
        const utter = new SpeechSynthesisUtterance(segment.text);
        utter.rate = state.settings.rate;
        utter.pitch = state.settings.pitch;
        utter.volume = state.settings.volume;

        const selectedVoice = getSelectedVoice();
        if (selectedVoice) {
            utter.voice = selectedVoice;
            utter.lang = selectedVoice.lang;
        } else {
            utter.lang = 'vi-VN';
        }

        utter.onstart = () => {
            if (token !== state.utteranceToken) {
                return;
            }
            updateStatus('Đang đọc...');
            updateProgressText();
        };

        utter.onend = () => {
            if (token !== state.utteranceToken || !state.reading || state.paused) {
                return;
            }
            completeCurrentSegment(segment);
        };

        utter.onerror = () => {
            if (token !== state.utteranceToken || !state.reading || state.paused) {
                return;
            }
            failCurrentSegment('SpeechSynthesis lỗi, bỏ qua đoạn này');
        };

        speechSynthesis.speak(utter);
    }

    function speakSegmentWithRemote(segment, token) {
        const providerId = getProviderId();
        const provider = getRemoteProvider(providerId);
        if (!provider) {
            failCurrentSegment('Provider TTS chưa hỗ trợ', true);
            return;
        }

        updateStatus(`${provider.label} đang tạo audio...`);
        updateProgressText();
        const voiceId = provider.getVoiceId();
        const segmentIdxSnapshot = state.segmentIndex;
        getRemoteAudioBase64Cached(providerId, segment.text, voiceId, {
            timeout: TIKTOK_DEFAULT_TIMEOUT_MS,
            retries: TIKTOK_DEFAULT_RETRIES
        })
            .then((base64Audio) => {
                if (token !== state.utteranceToken || !state.reading || state.paused) {
                    return;
                }

                const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
                state.currentAudio = audio;
                audio.volume = Math.max(0, Math.min(1, Number(state.settings.volume) || 1));
                audio.playbackRate = Math.max(0.5, Math.min(2, Number(state.settings.rate) || 1));

                audio.onended = () => {
                    if (token !== state.utteranceToken || !state.reading || state.paused) {
                        return;
                    }
                    state.currentAudio = null;
                    completeCurrentSegment(segment);
                };

                audio.onerror = () => {
                    if (token !== state.utteranceToken || !state.reading || state.paused) {
                        return;
                    }
                    state.currentAudio = null;
                    failCurrentSegment('Không phát được audio TikTok');
                };

                audio.play().then(() => {
                    if (token !== state.utteranceToken) {
                        return;
                    }
                    updateStatus(`Đang đọc ${provider.label}...`);
                    scheduleRemotePrefetch(providerId, segmentIdxSnapshot + 1);
                }).catch((err) => {
                    state.currentAudio = null;
                    failCurrentSegment(`Play ${provider.label} thất bại: ${err && err.message ? err.message : 'unknown'}`);
                });
            })
            .catch((err) => {
                state.currentAudio = null;
                const msg = err && err.message ? err.message : 'unknown';
                if (providerId === 'tiktok' && err && (err.code === 'NEED_COOKIE' || err.code === 'COOKIE_INVALID')) {
                    provider.onAuthRequired();
                }
                failCurrentSegment(`${provider.label} TTS lỗi: ${msg}.`, true);
            });
    }

    function completeCurrentSegment(segment) {
        state.currentAudio = null;
        finalizeSegment(segment);
        state.segmentIndex += 1;
        if (state.segmentIndex >= state.segments.length) {
            finishChapter();
        } else {
            scheduleSpeakCurrentSegment();
        }
    }

    function failCurrentSegment(message, stopNow) {
        if (stopNow) {
            stopReading(false);
            updateStatus(message);
            return;
        }

        state.segmentIndex += 1;
        if (state.segmentIndex >= state.segments.length) {
            finishChapter();
        } else {
            updateStatus(message);
            scheduleSpeakCurrentSegment();
        }
    }

    function getSelectedVoice() {
        const voices = speechSynthesis.getVoices() || [];
        if (!voices.length) {
            return null;
        }

        if (state.settings.voiceURI) {
            const byUri = voices.find((v) => v.voiceURI === state.settings.voiceURI);
            if (byUri) {
                return byUri;
            }
        }

        const vi = voices.find((v) => /vi/i.test(v.lang));
        return vi || voices[0] || null;
    }

    function getTikTokVoice() {
        const voiceId = state.settings.tiktokVoiceId || 'vi_female_huong';
        const found = TIKTOK_VOICES.find((v) => v.id === voiceId);
        return found || TIKTOK_VOICES[0];
    }

    function testTikTokTts() {
        stopReading(false);
        updateStatus('Đang thử giọng TikTok...');
        clearRemoteAudioCache();
        tiktokSynthesizeBase64('Xin chào. Đây là thử giọng TikTok.', state.settings.tiktokVoiceId, { timeout: 20000, retries: 1 })
            .then((base64Audio) => {
                const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
                state.currentAudio = audio;
                audio.volume = Math.max(0, Math.min(1, Number(state.settings.volume) || 1));
                audio.playbackRate = Math.max(0.5, Math.min(2, Number(state.settings.rate) || 1));
                audio.onended = () => {
                    if (state.currentAudio === audio) {
                        state.currentAudio = null;
                    }
                };
                audio.onerror = () => {
                    if (state.currentAudio === audio) {
                        state.currentAudio = null;
                    }
                };
                return audio.play();
            })
            .then(() => {
                updateStatus('Đang phát thử giọng TikTok...');
            })
            .catch((err) => {
                const msg = err && err.message ? err.message : 'unknown';
                updateStatus(`TikTok TTS lỗi: ${msg}`);
            });
    }

    function openTikTokCookieModal(options) {
        if (!state.ui || !state.ui.cookieModal || !state.ui.cookieModalText || !state.ui.cookieModalMsg) {
            return;
        }
        const reason = options && options.reason ? String(options.reason) : '';
        state.ui.cookieModal.classList.remove('twd-tts-hidden');
        state.ui.cookieModalText.value = '';
        state.ui.cookieModalText.focus();

        if (reason === 'auto') {
            state.ui.cookieModalMsg.textContent = 'TikTok TTS cần cookie phiên. Dán cookie (JSON/Netscape/Cookie header) rồi bấm Lưu.';
        } else {
            state.ui.cookieModalMsg.textContent = 'Dán cookie (JSON/Netscape/Cookie header) rồi bấm Lưu. Cookie sẽ được lưu và không hiển thị lại trong UI.';
        }
    }

    function closeTikTokCookieModal() {
        if (!state.ui || !state.ui.cookieModal || !state.ui.cookieModalText) {
            return;
        }
        state.ui.cookieModal.classList.add('twd-tts-hidden');
        // Xoá nội dung trong DOM để giảm rủi ro lộ cookie.
        state.ui.cookieModalText.value = '';
    }

    function createRemoteCacheKey(providerId, voiceId, text) {
        const provider = String(providerId || '');
        const voice = String(voiceId || '');
        const cleanText = normalizeText(text);
        return `${provider}\n${voice}\n${cleanText}`;
    }

    function cacheRemoteAudio(key, base64Audio) {
        if (!state.remoteAudioCache) {
            return;
        }
        // Basic LRU: keep insertion order by deleting then re-setting.
        if (state.remoteAudioCache.has(key)) {
            state.remoteAudioCache.delete(key);
        }
        state.remoteAudioCache.set(key, base64Audio);
        while (state.remoteAudioCache.size > TIKTOK_MAX_CACHE_ITEMS) {
            const firstKey = state.remoteAudioCache.keys().next().value;
            if (!firstKey) {
                break;
            }
            state.remoteAudioCache.delete(firstKey);
        }
    }

    function getRemoteAudioBase64Cached(providerId, text, voiceId, options) {
        const provider = getRemoteProvider(providerId);
        if (!provider) {
            return Promise.reject(new Error('Provider chưa hỗ trợ'));
        }

        const key = createRemoteCacheKey(providerId, voiceId, text);
        if (state.remoteAudioCache && state.remoteAudioCache.has(key)) {
            return Promise.resolve(state.remoteAudioCache.get(key));
        }
        if (state.remoteAudioInflight && state.remoteAudioInflight.has(key)) {
            return state.remoteAudioInflight.get(key);
        }

        const p = provider.synthesizeBase64(text, voiceId, options)
            .then((audio) => {
                if (state.remoteAudioInflight) {
                    state.remoteAudioInflight.delete(key);
                }
                cacheRemoteAudio(key, audio);
                return audio;
            })
            .catch((err) => {
                if (state.remoteAudioInflight) {
                    state.remoteAudioInflight.delete(key);
                }
                return Promise.reject(err);
            });

        if (state.remoteAudioInflight) {
            state.remoteAudioInflight.set(key, p);
        }
        return p;
    }

    function scheduleRemotePrefetch(providerId, fromIndex) {
        if (!state.settings.prefetchEnabled) {
            return;
        }
        const provider = getRemoteProvider(providerId);
        if (!provider) {
            return;
        }

        const count = clampInt(state.settings.prefetchCount, 0, 6);
        if (count <= 0) {
            return;
        }

        const jobId = ++state.prefetchJobId;
        setTimeout(() => {
            if (jobId !== state.prefetchJobId) {
                return;
            }
            if (!state.reading || state.paused || !isRemoteProvider() || getProviderId() !== providerId) {
                return;
            }
            const voiceId = provider.getVoiceId();
            // Sequential prefetch with gentle pacing to avoid being rate-limited.
            (async () => {
                for (let i = 0; i < count; i += 1) {
                    if (jobId !== state.prefetchJobId) {
                        return;
                    }
                    if (!state.reading || state.paused || !isRemoteProvider() || getProviderId() !== providerId) {
                        return;
                    }
                    const seg = state.segments[fromIndex + i];
                    if (!seg || !seg.text) {
                        return;
                    }
                    try {
                        await getRemoteAudioBase64Cached(providerId, seg.text, voiceId, {
                            timeout: 14000,
                            retries: 1,
                            minGapMs: Math.max(TIKTOK_MIN_REQUEST_GAP_MS, 320)
                        });
                    } catch (err) {
                        // ignore prefetch errors
                    }
                    await sleep(220);
                }
            })();
        }, TIKTOK_PREFETCH_DELAY_MS);
    }

    function updateTikTokCookieInfo() {
        if (!state.ui || !state.ui.tiktokCookieInfo) {
            return;
        }
        const raw = String(state.settings.tiktokCookieText || '');
        if (!raw.trim()) {
            state.ui.tiktokCookieInfo.textContent = 'Chưa có cookie.';
            return;
        }
        const parsed = parseTikTokCookieInput(raw);
        if (parsed.error) {
            state.ui.tiktokCookieInfo.textContent = 'Cookie đang lưu bị lỗi định dạng (đã ẩn).';
            return;
        }
        state.ui.tiktokCookieInfo.textContent = parsed.hasSession
            ? `Đã lưu cookie (ẩn). Định dạng: ${parsed.format}.`
            : `Đã lưu cookie (ẩn) nhưng thiếu sessionid/sid_tt/sid_guard.`;
    }

    function parseTikTokCookieInput(raw) {
        const text = String(raw || '').trim();
        if (!text) {
            return { header: '', names: [], hasSession: false, format: 'empty', error: '' };
        }

        // Cookie header dạng "Cookie: a=b; c=d"
        const stripCookiePrefix = (s) => String(s || '').replace(/^\s*cookie\s*:\s*/i, '').trim();

        // 1) JSON
        if (text.startsWith('{') || text.startsWith('[')) {
            try {
                const json = JSON.parse(text);
                const map = new Map();

                const pushPair = (name, value) => {
                    const n = String(name || '').trim();
                    if (!n) {
                        return;
                    }
                    const v = String(value || '');
                    map.set(n, v);
                };

                if (typeof json === 'string') {
                    const header = normalizeCookieHeader(stripCookiePrefix(json));
                    const names = Object.keys(parseCookieHeader(header)).sort();
                    return { header, names, hasSession: hasSessionCookie(header), format: 'json:string', error: '' };
                }

                const arr = Array.isArray(json)
                    ? json
                    : (json && Array.isArray(json.cookies) ? json.cookies : null);

                if (arr) {
                    arr.forEach((c) => {
                        if (!c) {
                            return;
                        }
                        // Cookie-Editor JSON thường có {name, value}
                        pushPair(c.name, typeof c.value !== 'undefined' ? c.value : '');
                    });
                    const header = headerFromMap(map);
                    const names = Array.from(map.keys()).sort();
                    return { header, names, hasSession: hasSessionCookie(header), format: 'json:cookies', error: '' };
                }

                if (json && typeof json === 'object') {
                    if (typeof json.cookie === 'string') {
                        const header = normalizeCookieHeader(stripCookiePrefix(json.cookie));
                        const names = Object.keys(parseCookieHeader(header)).sort();
                        return { header, names, hasSession: hasSessionCookie(header), format: 'json:cookie', error: '' };
                    }

                    // object map {sessionid:"...", ...}
                    Object.keys(json).forEach((k) => {
                        const v = json[k];
                        if (typeof v === 'string' || typeof v === 'number') {
                            pushPair(k, v);
                        }
                    });
                    const header = headerFromMap(map);
                    const names = Array.from(map.keys()).sort();
                    return { header, names, hasSession: hasSessionCookie(header), format: 'json:map', error: '' };
                }
            } catch (err) {
                // fallthrough để thử Netscape / header
            }
        }

        // 2) Netscape cookie file (Cookie-Editor), có thể gồm dòng "#HttpOnly_..."
        if (/\t/.test(text)) {
            const map = new Map();
            const lines = text.split(/\r?\n/);
            lines.forEach((line) => {
                const ln = String(line || '').trim();
                if (!ln) {
                    return;
                }
                // "#HttpOnly_.tiktok.com\tTRUE\t/\tTRUE\t...\tname\tvalue"
                let work = ln;
                if (work.startsWith('#HttpOnly_')) {
                    work = work.slice('#HttpOnly_'.length);
                } else if (work.startsWith('#')) {
                    return;
                }
                const parts = work.split('\t');
                if (parts.length < 7) {
                    return;
                }
                const name = parts[5];
                const value = parts[6];
                if (!name) {
                    return;
                }
                map.set(String(name), String(value || ''));
            });

            if (map.size > 0) {
                const header = headerFromMap(map);
                const names = Array.from(map.keys()).sort();
                return { header, names, hasSession: hasSessionCookie(header), format: 'netscape', error: '' };
            }
        }

        // 3) Cookie header thẳng
        const header = normalizeCookieHeader(stripCookiePrefix(text));
        const names = Object.keys(parseCookieHeader(header)).sort();
        return { header, names, hasSession: hasSessionCookie(header), format: 'header', error: '' };
    }

    function hasSessionCookie(cookieHeader) {
        const txt = String(cookieHeader || '');
        return /(?:^|;\s*)(sessionid|sid_tt|sid_guard)=/i.test(txt);
    }

    function normalizeCookieHeader(cookieHeader) {
        const map = parseCookieHeader(cookieHeader);
        const entries = Object.entries(map);
        return entries.map(([k, v]) => `${k}=${v}`).join('; ');
    }

    function headerFromMap(map) {
        const out = [];
        map.forEach((value, name) => {
            out.push(`${name}=${value}`);
        });
        return out.join('; ');
    }

    function parseCookieHeader(cookieHeader) {
        const text = String(cookieHeader || '').trim();
        if (!text) {
            return {};
        }
        const map = {};
        text.split(';').forEach((part) => {
            const item = part.trim();
            if (!item) {
                return;
            }
            const eqIndex = item.indexOf('=');
            if (eqIndex <= 0) {
                return;
            }
            const name = item.slice(0, eqIndex).trim();
            const value = item.slice(eqIndex + 1).trim();
            if (!name) {
                return;
            }
            map[name] = value;
        });
        return map;
    }

    function tiktokSynthesizeBase64(text, voiceId, options) {
        if (typeof GM_xmlhttpRequest !== 'function') {
            return Promise.reject(new Error('Trình duyệt không hỗ trợ GM_xmlhttpRequest'));
        }

        const cleanText = normalizeText(text);
        if (!cleanText) {
            return Promise.reject(new Error('Text rỗng'));
        }
        const opts = options || {};

        const cookieRaw = (state.ui && state.ui.tiktokCookieInput)
            ? String(state.ui.tiktokCookieInput.value || '')
            : String(state.settings.tiktokCookieText || '');
        let cookieParsed = null;
        if (state.tiktokCookieParsedCache && state.tiktokCookieParsedCache.raw === cookieRaw && state.tiktokCookieParsedCache.parsed) {
            cookieParsed = state.tiktokCookieParsedCache.parsed;
        } else {
            cookieParsed = parseTikTokCookieInput(cookieRaw);
            state.tiktokCookieParsedCache = { raw: cookieRaw, parsed: cookieParsed };
        }
        if (!cookieParsed.header) {
            const err = new Error('Chưa nhập cookie TikTok');
            err.code = 'NEED_COOKIE';
            return Promise.reject(err);
        }
        if (!cookieParsed.hasSession) {
            const err = new Error('Cookie TikTok thiếu sessionid/sid_tt/sid_guard');
            err.code = 'COOKIE_INVALID';
            return Promise.reject(err);
        }

        const voice = voiceId || getTikTokVoice().id;
        const timeoutMs = Number(opts.timeout) > 0 ? Number(opts.timeout) : TIKTOK_DEFAULT_TIMEOUT_MS;
        const retries = clampInt(opts.retries, 0, 4);
        const minGapMs = clampInt(opts.minGapMs, 0, 2000) || TIKTOK_MIN_REQUEST_GAP_MS;
        const query = `text_speaker=${encodeURIComponent(voice)}&req_text=${encodeURIComponent(cleanText)}&speaker_map_type=0&aid=1233`;
        return invokeTikTokRequestWithRetry(`${TIKTOK_API_ENDPOINT}?${query}`, {
            'User-Agent': TIKTOK_USER_AGENT,
            'Accept': 'application/json, text/plain, */*',
            'Cookie': cookieParsed.header
        }, timeoutMs, retries, minGapMs);
    }

    function invokeTikTokRequestWithRetry(url, headers, timeoutMs, retries, minGapMs) {
        const attemptCount = Math.max(1, Number(retries) + 1);
        let attempt = 0;
        let lastErr = null;

        const run = () => {
            attempt += 1;
            return invokeTikTokRequestWithGap(url, headers, timeoutMs, minGapMs)
                .catch((err) => {
                    lastErr = err;
                    if (attempt >= attemptCount) {
                        return Promise.reject(lastErr);
                    }
                    const jitter = Math.floor(Math.random() * 220);
                    const backoff = (TIKTOK_RETRY_BASE_DELAY_MS * attempt) + jitter;
                    return sleep(backoff).then(run);
                });
        };

        return run();
    }

    function invokeTikTokRequestWithGap(url, headers, timeoutMs, minGapMs) {
        const gap = Math.max(0, Number(minGapMs) || 0);
        const now = Date.now();
        const lastAt = Number(state.tiktokLastTikTokRequestAt || 0);
        const wait = (gap > 0 && lastAt > 0) ? Math.max(0, gap - (now - lastAt)) : 0;
        return sleep(wait).then(() => {
            state.tiktokLastTikTokRequestAt = Date.now();
            return invokeTikTokRequest(url, headers, timeoutMs);
        });
    }

    function invokeTikTokRequest(url, headers, timeoutMs) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url,
                headers,
                timeout: timeoutMs,
                anonymous: false,
                withCredentials: true,
                onload: (res) => {
                    try {
                        const httpStatus = Number(res && typeof res.status !== 'undefined' ? res.status : 0);
                        const body = String(res && typeof res.responseText !== 'undefined' ? res.responseText : '').trim();
                        if (!body) {
                            const err = new Error('response empty');
                            err.code = httpStatus === 401 || httpStatus === 403 ? 'COOKIE_INVALID' : '';
                            reject(err);
                            return;
                        }
                        const json = JSON.parse(body);
                        if (json && Number(json.status_code) === 0 && json.data && json.data.v_str) {
                            resolve(json.data.v_str);
                            return;
                        }
                        const msg = (json && (json.status_msg || json.message)) || `status_code=${json && json.status_code}`;
                        const err = new Error(msg);
                        if (httpStatus === 401 || httpStatus === 403) {
                            err.code = 'COOKIE_INVALID';
                        }
                        reject(err);
                    } catch (err) {
                        reject(new Error('response not json'));
                    }
                },
                onerror: () => reject(new Error('request error')),
                ontimeout: () => reject(new Error('request timeout'))
            });
        });
    }

    function finalizeSegment(segment) {
        if (!segment || !segment.paragraphEl) {
            return;
        }

        if (segment.chunkIndex >= segment.chunkTotal - 1) {
            segment.paragraphEl.classList.add('twd-tts-read');
        }
        segment.paragraphEl.classList.remove('twd-tts-active');
    }

    function markParagraphsBeforeSegmentAsRead(segmentIdx) {
        const segment = state.segments[segmentIdx];
        if (!segment || segment.isTitle) {
            return;
        }

        state.paragraphs.forEach((p, idx) => {
            if (idx < segment.paragraphIndex) {
                p.classList.add('twd-tts-read');
            }
        });
    }

    function activateSegmentHighlight(segment) {
        clearActiveHighlight();
        if (!segment || !segment.paragraphEl) {
            return;
        }
        segment.paragraphEl.classList.add('twd-tts-active');
        if (state.settings.autoScroll) {
            segment.paragraphEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function clearActiveHighlight() {
        state.paragraphs.forEach((p) => p.classList.remove('twd-tts-active'));
    }

    function resetHighlights() {
        state.paragraphs.forEach((p) => {
            p.classList.remove('twd-tts-active');
            p.classList.remove('twd-tts-read');
        });
    }

    function stopSpeechOnly() {
        state.utteranceToken += 1;
        speechSynthesis.cancel();
        state.prefetchJobId += 1;
        clearNextSegmentTimer();
        if (state.currentAudio) {
            state.currentAudio.pause();
            state.currentAudio.removeAttribute('src');
            state.currentAudio.load();
            state.currentAudio = null;
        }
    }

    function stopReading(showStatus) {
        state.reading = false;
        state.paused = false;
        stopSpeechOnly();
        clearActiveHighlight();
        updateProgressText();
        if (showStatus) {
            updateStatus('Đã dừng');
        }
    }

    function finishChapter() {
        state.reading = false;
        state.paused = false;
        clearActiveHighlight();
        updateProgressText(true);

        if (state.settings.autoNext && state.nextUrl) {
            updateStatus('Xong chương, chuyển chương sau...');
            if (state.settings.autoStartOnNextChapter) {
                saveSessionForNextChapter();
            }
            setTimeout(() => {
                window.location.href = state.nextUrl;
            }, 600);
            return;
        }

        updateStatus('Đọc xong chương');
    }

    function refreshStartRange() {
        const max = Math.max(1, state.paragraphs.length);
        state.ui.startInput.min = '1';
        state.ui.startInput.max = String(max);
        const current = clampInt(state.ui.startInput.value, 1, max);
        setStartParagraphInput(current);
    }

    function updateProgressText(forceDone) {
        const total = state.segments.length;
        if (total === 0) {
            state.ui.status.textContent = 'Không có đoạn để đọc';
            return;
        }

        if (forceDone) {
            state.ui.status.textContent = `Đọc xong ${total}/${total} mục`;
            return;
        }

        const current = Math.min(state.segmentIndex + 1, total);
        const currentSeg = state.segments[Math.min(state.segmentIndex, total - 1)];
        if (!currentSeg) {
            state.ui.status.textContent = `Sẵn sàng (${total} mục)`;
            return;
        }

        if (currentSeg.isTitle) {
            state.ui.status.textContent = `Mục ${current}/${total}: Tiêu đề`;
            return;
        }

        state.ui.status.textContent = `Mục ${current}/${total}: Đoạn ${currentSeg.paragraphIndex + 1}/${Math.max(1, state.paragraphs.length)}`;
    }

    function updateStatus(text) {
        updateProgressText();
        if (!text) {
            return;
        }
        state.ui.status.textContent = `${state.ui.status.textContent} | ${text}`;
    }

    function initVoiceList() {
        renderVoiceOptions();
        refreshProviderUi();
        updateTikTokCookieInfo();
        speechSynthesis.addEventListener('voiceschanged', () => {
            if (getProviderId() === 'browser') {
                renderVoiceOptions();
            }
        });
    }

    function renderVoiceOptions() {
        const ui = state.ui;
        ui.voiceSelect.innerHTML = '';

        if (isRemoteProvider()) {
            const provider = getActiveRemoteProvider();
            if (!provider) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = 'Provider chưa hỗ trợ';
                ui.voiceSelect.appendChild(opt);
                return;
            }

            const voices = provider.voices.slice().sort((a, b) => {
                if (a.language === b.language) {
                    return a.name.localeCompare(b.name);
                }
                if (a.language === 'vi') {
                    return -1;
                }
                if (b.language === 'vi') {
                    return 1;
                }
                return a.language.localeCompare(b.language);
            });

            voices.forEach((voice) => {
                const opt = document.createElement('option');
                opt.value = voice.id;
                opt.textContent = `${voice.name} (${voice.language})`;
                ui.voiceSelect.appendChild(opt);
            });

            const currentVoiceId = provider.getVoiceId();
            if (!currentVoiceId || !voices.some((v) => v.id === currentVoiceId)) {
                provider.setVoiceId(provider.defaultVoiceId || (voices[0] ? voices[0].id : ''));
                saveSettings();
            }
            ui.voiceSelect.value = provider.getVoiceId();
            return;
        }

        const voices = speechSynthesis.getVoices() || [];
        if (voices.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Không thấy voice browser (thử reload)';
            ui.voiceSelect.appendChild(opt);
            return;
        }

        voices
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((voice) => {
                const opt = document.createElement('option');
                opt.value = voice.voiceURI;
                opt.textContent = `${voice.name} (${voice.lang})`;
                ui.voiceSelect.appendChild(opt);
            });

        if (!state.settings.voiceURI) {
            const vi = voices.find((v) => /vi/i.test(v.lang));
            state.settings.voiceURI = vi ? vi.voiceURI : voices[0].voiceURI;
            saveSettings();
        }

        ui.voiceSelect.value = state.settings.voiceURI;
        if (ui.voiceSelect.value !== state.settings.voiceURI && voices[0]) {
            state.settings.voiceURI = voices[0].voiceURI;
            ui.voiceSelect.value = voices[0].voiceURI;
            saveSettings();
        }
    }

    function refreshProviderUi() {
        const ui = state.ui;
        const providerId = getProviderId();
        const isTikTok = providerId === 'tiktok';
        const isBrowser = providerId === 'browser';
        ui.providerSelect.value = providerId;
        ui.tiktokAuthRow.classList.toggle('twd-tts-hidden', !isTikTok);
        if (ui.tiktokCookieRow) {
            ui.tiktokCookieRow.classList.toggle('twd-tts-hidden', !isTikTok);
        }
        if (ui.prefetchInput) {
            ui.prefetchInput.checked = !!state.settings.prefetchEnabled;
        }
        if (ui.prefetchCountInput) {
            ui.prefetchCountInput.value = String(clampInt(state.settings.prefetchCount, 0, 6));
        }
        updateTikTokCookieInfo();
        ui.pitchInput.disabled = !isBrowser;
        ui.pitchInput.title = !isBrowser ? 'Giọng remote không hỗ trợ pitch' : '';
    }

    function bindUnloadCancel() {
        window.addEventListener('beforeunload', () => {
            speechSynthesis.cancel();
            if (state.currentAudio) {
                state.currentAudio.pause();
            }
        });
    }

    function injectStyles() {
        const css = `
            #bookContentBody p.twd-tts-active,
            #bookContentBody.twd-tts-active {
                background: #fff4bf;
                transition: background-color 0.2s ease;
                border-radius: 4px;
            }

            #bookContentBody p.twd-tts-read,
            #bookContentBody.twd-tts-read {
                background: #d9fbe7;
                transition: background-color 0.2s ease;
                border-radius: 4px;
            }

            #bookContentBody.twd-tts-pick-mode .twd-tts-pick-target,
            #bookContentBody.twd-tts-pick-mode.twd-tts-pick-target {
                position: relative;
                padding-left: 36px;
            }

            #bookContentBody.twd-tts-pick-mode .twd-tts-pick-point {
                position: absolute;
                left: 8px;
                top: 6px;
                width: 22px;
                height: 22px;
                border: none;
                border-radius: 999px;
                background: linear-gradient(135deg, #26c6da 0%, #42a5f5 100%);
                box-shadow: 0 6px 14px rgba(30, 64, 175, 0.3);
                cursor: pointer;
                display: grid;
                place-items: center;
                padding: 0;
                z-index: 2;
            }

            #bookContentBody.twd-tts-pick-mode .twd-tts-pick-point svg {
                width: 12px;
                height: 12px;
                stroke: #fff;
                stroke-width: 2.2;
                fill: none;
                stroke-linecap: round;
                stroke-linejoin: round;
            }

            #bookContentBody.twd-tts-pick-mode .twd-tts-pick-point:hover {
                filter: brightness(1.08);
                transform: translateY(-1px);
            }
        `;

        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
})();
