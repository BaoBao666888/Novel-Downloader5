// @rule-name: 晚安小说网
// @rule-source: special
(
// @rule-begin
        (() => {
            const host = 'www.azxxs.com';
            const stateKey = '__ND_AZXXS_Verify_State__';
            const blockedRe = /(challenge-platform|cdn-cgi\/challenge|cf-(?:turnstile|challenge|chl)|Just a moment|Attention Required|Cloudflare)/i;

            const getState = () => {
                const root = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
                if (!root[stateKey]) root[stateKey] = { popup: null, warned: false, loading: null };
                return root[stateKey];
            };

            const parseHtml = (html) => new DOMParser().parseFromString(String(html || ''), 'text/html');
            const isReady = (doc, selector) => Boolean(doc && !blockedRe.test(doc.documentElement?.outerHTML || '') && doc.querySelector(selector));

            const readPopupPage = async (url, selector) => {
                const state = getState();
                if (state.loading) await state.loading.catch(() => {});

                let resolveLoading;
                state.loading = new Promise((resolve) => { resolveLoading = resolve; });
                try {
                    if (!state.warned) {
                        state.warned = true;
                        if (typeof window.ndShowToast === 'function') {
                            window.ndShowToast('AZXXS cần xác minh. Hoàn tất trong cửa sổ vừa mở, script sẽ tự tiếp tục.', 'warning', 8000);
                        }
                    }

                    let popup = state.popup;
                    if (!popup || popup.closed) {
                        popup = typeof requestNovelDownloaderVerificationWindow === 'function'
                            ? await requestNovelDownloaderVerificationWindow({
                                title: 'AZXXS cần xác minh',
                                message: 'Mở cửa sổ AZXXS, hoàn tất Cloudflare nếu được hỏi và giữ cửa sổ để script tiếp tục tải.',
                                url,
                                windowName: '__ND_AZXXS_Verify__',
                            })
                            : window.open(url, '__ND_AZXXS_Verify__', 'width=620,height=760,resizable=yes,scrollbars=yes');
                    } else {
                        try {
                            if (popup.location.href !== url) popup.location.href = url;
                        } catch (error) {
                            popup.location.href = url;
                        }
                    }
                    state.popup = popup;
                    if (!popup) throw new Error('AZXXS: Pop-up bị chặn. Hãy cho phép pop-up rồi thử lại.');
                    try { popup.focus(); } catch (error) { /* ignore */ }

                    const startedAt = Date.now();
                    while (Date.now() - startedAt < 180000) {
                        if (popup.closed) {
                            throw new Error('AZXXS: Cửa sổ xác minh đã bị đóng. Đã dừng để không mở tab liên tục.');
                        }
                        try {
                            const popupUrl = new URL(popup.location.href);
                            const targetUrl = new URL(url);
                            if (popupUrl.origin === targetUrl.origin && popupUrl.pathname === targetUrl.pathname && isReady(popup.document, selector)) {
                                return parseHtml(popup.document.documentElement.outerHTML);
                            }
                        } catch (error) {
                            // Cloudflare may temporarily move the popup to a challenge origin.
                        }
                        await new Promise((resolve) => setTimeout(resolve, 700));
                    }
                    throw new Error('AZXXS: Hết 180 giây chờ xác minh. Hãy xác minh xong rồi tải lại.');
                } finally {
                    resolveLoading();
                    state.loading = null;
                }
            };

            const loadPage = async (url, selector) => {
                const absoluteUrl = new URL(url, location.href).href;
                if (absoluteUrl === location.href && isReady(document, selector)) return document;
                try {
                    const response = await fetch(absoluteUrl, { credentials: 'include', redirect: 'follow' });
                    const html = new TextDecoder('gb18030').decode(await response.arrayBuffer());
                    const doc = parseHtml(html);
                    if (response.ok && isReady(doc, selector)) return doc;
                } catch (error) {
                    console.warn('[AZXXS] Request thường thất bại, chuyển sang cửa sổ xác minh:', error);
                }
                return readPopupPage(absoluteUrl, selector);
            };

            const decodeCssContent = (value) => String(value || '')
                .replace(/\\([0-9a-f]{1,6})\s?/gi, (all, hex) => String.fromCodePoint(parseInt(hex, 16)))
                .replace(/\\a\s?/gi, '\n')
                .replace(/\\(['"\\])/g, '$1');

            const getPseudoContentMap = (doc) => {
                const map = new Map();
                Array.from(doc.querySelectorAll('style')).forEach((style) => {
                    const css = style.textContent || '';
                    const regex = /\.([\w-]+)::after\s*\{\s*content\s*:\s*(['"])((?:\\.|(?!\2)[\s\S])*?)\2\s*;?\s*\}/g;
                    let match;
                    while ((match = regex.exec(css))) map.set(match[1], decodeCssContent(match[3]));
                });
                return map;
            };

            const pseudoText = (element, map) => {
                const plain = String(element.textContent || '').replace(/\u00a0/g, ' ').trim();
                if (plain) return plain;
                for (const className of Array.from(element.classList || [])) {
                    if (map.has(className)) return String(map.get(className) || '').trim();
                }
                return '';
            };

            const cleanTitle = (title) => String(title || '')
                .replace(/\s*\(\s*\d+\s*\/\s*\d+\s*\)\s*$/, '')
                .trim();

            return {
                siteName: '晚安小说网',
                charset: 'gbk',
                url: /:\/\/www\.azxxs\.com\/gobook\/\d+(?:_\d+)?\/?(?:[?#].*)?$/,
                chapterUrl: /:\/\/www\.azxxs\.com\/gobook\/\d+\/\d+(?:_\d+)?\.html(?:[?#].*)?$/,
                filter: () => {
                    if (location.host !== host) return 0;
                    if (document.querySelector('#chapter-content')) return 2;
                    if (document.querySelector('.book-info-header, .volume-title + .chapter-list')) return 1;
                    return 0;
                },
                infoPage: () => {
                    const match = location.pathname.match(/^\/gobook\/(\d+)/);
                    return match ? `${location.origin}/gobook/${match[1]}/` : location.href;
                },
                title: '.book-title',
                writer: (doc) => $('.book-author', doc).first().text().replace(/^\s*作者[:：]\s*/, '').trim(),
                intro: '.book-tags',
                cover: '.book-cover-large',
                getChapters: async () => {
                    const helpers = Rule.helpers;
                    const bookId = (location.pathname.match(/^\/gobook\/(\d+)/) || [])[1];
                    if (!bookId) throw new Error('AZXXS: Không xác định được ID truyện.');
                    let pageUrl = `${location.origin}/gobook/${bookId}/`;
                    const visitedPages = new Set();
                    const chapters = [];

                    for (let page = 0; pageUrl && !visitedPages.has(pageUrl) && page < 100; page++) {
                        visitedPages.add(pageUrl);
                        const doc = await loadPage(pageUrl, '.volume-title + .chapter-list');
                        const contentMap = getPseudoContentMap(doc);
                        Array.from(doc.querySelectorAll('.volume-title + .chapter-list a[class^="p_"][href]')).forEach((link) => {
                            const url = new URL(link.getAttribute('href'), pageUrl).href;
                            if (!new RegExp(`/gobook/${bookId}/\\d+(?:_\\d+)?\\.html(?:$|[?#])`).test(url)) return;
                            const title = cleanTitle(pseudoText(link, contentMap));
                            if (title) chapters.push({ title, url });
                        });
                        const next = Array.from(doc.querySelectorAll('a.onclick[href]'))
                            .find((link) => /下一页/.test(link.textContent || ''));
                        pageUrl = next ? new URL(next.getAttribute('href'), pageUrl).href : '';
                    }
                    return helpers.uniqueBy(chapters, (chapter) => chapter.url).sort((a, b) => {
                        const aId = Number((a.url.match(/\/(\d+)(?:_\d+)?\.html/) || [])[1]);
                        const bId = Number((b.url.match(/\/(\d+)(?:_\d+)?\.html/) || [])[1]);
                        return aId - bId;
                    });
                },
                chapterTitle: (doc) => cleanTitle($('.chapter-title', doc).first().text()),
                deal: async (chapter) => {
                    const parts = [];
                    const visited = new Set();
                    const baseId = (chapter.url.match(/\/(\d+)(?:_\d+)?\.html(?:$|[?#])/) || [])[1];
                    let pageUrl = chapter.url;
                    let title = chapter.title || '';

                    for (let page = 0; pageUrl && !visited.has(pageUrl) && page < 30; page++) {
                        visited.add(pageUrl);
                        const doc = await loadPage(pageUrl, '#chapter-content');
                        title = cleanTitle(doc.querySelector('.chapter-title')?.textContent || title);
                        const content = doc.querySelector('#chapter-content');
                        const contentMap = getPseudoContentMap(doc);
                        const lines = Array.from(content.querySelectorAll(':scope > span'))
                            .map((span) => pseudoText(span, contentMap))
                            .filter(Boolean);
                        if (!lines.length) {
                            const fallback = String(content.textContent || '').replace(/\u00a0/g, ' ').trim();
                            if (fallback) lines.push(fallback);
                        }
                        if (!lines.length) throw new Error(`AZXXS: Không giải mã được nội dung chương tại ${pageUrl}`);
                        parts.push(lines.map((line) => $('<div>').text(line).html()).join('<br />'));

                        const next = Array.from(doc.querySelectorAll('.chapter-nav a[href]'))
                            .find((link) => /下一页|下一章/.test(link.textContent || ''));
                        const nextUrl = next ? new URL(next.getAttribute('href'), pageUrl).href : '';
                        pageUrl = baseId && new RegExp(`/${baseId}_\\d+\\.html(?:$|[?#])`).test(nextUrl) ? nextUrl : '';
                    }
                    return { title, content: parts.join('<br />') };
                },
                thread: 1,
            };
        })()
// @rule-end
)
