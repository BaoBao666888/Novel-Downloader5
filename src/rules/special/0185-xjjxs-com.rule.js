// @rule-name: 久久小说网
// @rule-source: special
(
// @rule-begin
        (() => {
            const host = 'www.xjjxs.com';
            const stateKey = '__ND_XJJXS_Verify_State__';
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
                            window.ndShowToast('XJJXS cần xác minh. Hoàn tất trong cửa sổ vừa mở, script sẽ tự tiếp tục.', 'warning', 8000);
                        }
                    }

                    let popup = state.popup;
                    if (!popup || popup.closed) {
                        popup = typeof requestNovelDownloaderVerificationWindow === 'function'
                            ? await requestNovelDownloaderVerificationWindow({
                                title: 'XJJXS cần xác minh',
                                message: 'Mở cửa sổ XJJXS, hoàn tất Cloudflare nếu được hỏi và giữ cửa sổ để script tiếp tục tải.',
                                url,
                                windowName: '__ND_XJJXS_Verify__',
                            })
                            : window.open(url, '__ND_XJJXS_Verify__', 'width=620,height=760,resizable=yes,scrollbars=yes');
                    } else {
                        try {
                            if (popup.location.href !== url) popup.location.href = url;
                        } catch (error) {
                            popup.location.href = url;
                        }
                    }
                    state.popup = popup;
                    if (!popup) throw new Error('XJJXS: Pop-up bị chặn. Hãy cho phép pop-up rồi thử lại.');
                    try { popup.focus(); } catch (error) { /* ignore */ }

                    const startedAt = Date.now();
                    while (Date.now() - startedAt < 180000) {
                        if (popup.closed) {
                            throw new Error('XJJXS: Cửa sổ xác minh đã bị đóng. Đã dừng để không mở tab liên tục.');
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
                    throw new Error('XJJXS: Hết 180 giây chờ xác minh. Hãy xác minh xong rồi tải lại.');
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
                    console.warn('[XJJXS] Request thường thất bại, chuyển sang cửa sổ xác minh:', error);
                }
                return readPopupPage(absoluteUrl, selector);
            };

            const cleanTitle = (title) => String(title || '')
                .replace(/\s*\(\s*\d+\s*\/\s*\d+\s*\)\s*$/, '')
                .replace(/[\u0000-\u001f]+/g, '')
                .trim();

            return {
                siteName: '久久小说网',
                charset: 'gbk',
                url: /:\/\/www\.xjjxs\.com\/(?:txt\d+\.html|\d+\/\d+\/(?:\d+\/?)?)(?:[?#].*)?$/,
                chapterUrl: /:\/\/www\.xjjxs\.com\/\d+\/\d+\/\d+(?:_\d+)?\.html(?:[?#].*)?$/,
                filter: () => {
                    if (location.host !== host) return 0;
                    if (document.querySelector('#chaptercontent')) return 2;
                    if (document.querySelector('.book .right h1, .list-chapter')) return 1;
                    return 0;
                },
                infoPage: () => {
                    const link = document.querySelector('#info_url, a[href^="/txt"]');
                    if (link && /\/txt\d+\.html/.test(link.getAttribute('href') || '')) return new URL(link.getAttribute('href'), location.href).href;
                    const bookId = (location.pathname.match(/^\/\d+\/(\d+)/) || [])[1];
                    return bookId ? `${location.origin}/txt${bookId}.html` : location.href;
                },
                title: '.book .right h1',
                writer: '.book .right h2 span:first-child a',
                intro: (doc) => {
                    const intro = $('.book .intro', doc).first().clone();
                    intro.contents().first().replaceWith(String(intro.contents().first().text() || '').replace(/^\s*小说简介[:：]?\s*/, ''));
                    return intro.html() || '';
                },
                cover: '.book .cover img',
                getChapters: async () => {
                    const helpers = Rule.helpers;
                    const infoMatch = location.pathname.match(/^\/txt(\d+)\.html/);
                    const pathMatch = location.pathname.match(/^\/\d+\/(\d+)/);
                    const bookId = (infoMatch || pathMatch || [])[1];
                    if (!bookId) throw new Error('XJJXS: Không xác định được ID truyện.');
                    const currentListMatch = location.pathname.match(/^\/(\d+)\/(\d+)\/(?:\d+\/?)?$/);
                    const firstUrl = currentListMatch
                        ? `${location.origin}/${currentListMatch[1]}/${bookId}/`
                        : '';
                    const infoListLink = document.querySelector('a.chapterlist[href]');
                    const listUrl = infoListLink
                        ? new URL(infoListLink.getAttribute('href'), location.href).href
                        : (firstUrl || `${location.origin}/${String(bookId).slice(0, -3) || '0'}/${bookId}/`);
                    const firstDoc = await loadPage(listUrl, '.list-chapter, #indexselect');
                    const pageUrls = Array.from(firstDoc.querySelectorAll('#indexselect option[value]'))
                        .map((option) => new URL(option.getAttribute('value'), listUrl).href);
                    if (!pageUrls.length) pageUrls.push(listUrl);

                    const chapters = [];
                    for (const pageUrl of [...new Set(pageUrls)]) {
                        const doc = pageUrl === listUrl ? firstDoc : await loadPage(pageUrl, '.list-chapter, #indexselect');
                        Array.from(doc.querySelectorAll('.list-chapter .booklist a[href], .list-chapter a[href]')).forEach((link) => {
                            const url = new URL(link.getAttribute('href'), pageUrl).href;
                            if (!new RegExp(`/${bookId}/\\d+(?:_\\d+)?\\.html(?:$|[?#])`).test(url)) return;
                            const title = cleanTitle(link.textContent);
                            if (title) chapters.push({ title, url });
                        });
                    }
                    return helpers.uniqueBy(chapters, (chapter) => chapter.url);
                },
                chapterTitle: (doc) => cleanTitle($('#chaptercontent', doc).closest('.book.read').find('h1').first().text() || $('h1', doc).first().text()),
                deal: async (chapter) => {
                    const parts = [];
                    const visited = new Set();
                    const baseId = (chapter.url.match(/\/(\d+)(?:_\d+)?\.html(?:$|[?#])/) || [])[1];
                    let pageUrl = chapter.url;
                    let title = chapter.title || '';

                    for (let page = 0; pageUrl && !visited.has(pageUrl) && page < 30; page++) {
                        visited.add(pageUrl);
                        const doc = await loadPage(pageUrl, '#chaptercontent');
                        title = cleanTitle(doc.querySelector('.book.read h1, h1')?.textContent || title);
                        const content = doc.querySelector('#chaptercontent')?.cloneNode(true);
                        if (!content || !content.textContent.trim()) throw new Error(`XJJXS: Không tìm thấy nội dung chương tại ${pageUrl}`);
                        content.querySelectorAll('script,style,iframe,ins').forEach((node) => node.remove());
                        parts.push(content.innerHTML.trim());

                        const next = doc.querySelector('#next_url[href]');
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
