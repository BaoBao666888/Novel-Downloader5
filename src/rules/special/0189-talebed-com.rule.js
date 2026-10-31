// @rule-name: 洋柿子书城 (Talebed)
// @rule-source: special
(
// @rule-begin
        (() => {
            const verification = { popup: null, pending: null, stopped: false };
            const stopForVerification = (message) => {
                const error = new Error(message);
                error.ndVerificationCancelled = true;
                return error;
            };
            const parseUrl = (value, base = location.href) => {
                try { return new URL(value, base); } catch (error) { return null; }
            };
            const bookIdFromUrl = (value = location.href) => {
                const url = parseUrl(value);
                if (!url || !/^(?:www\.)?talebed\.com$/i.test(url.hostname)) return '';
                const path = url.pathname.match(/^\/(?:page\/([1-9]\d*)|read\/([1-9]\d*)\/[1-9]\d*)\/?$/);
                const id = path ? path[1] || path[2] : /^\/detail\/?$/.test(url.pathname) ? url.searchParams.get('id') : '';
                return /^[1-9]\d*$/.test(id || '') ? id : '';
            };
            const waitForVerification = async (url, selector) => {
                if (verification.pending) {
                    await verification.pending;
                    return loadDoc(url, selector);
                }
                verification.pending = (async () => {
                    let popup = verification.popup;
                    if (!popup || popup.closed) {
                        popup = await requestNovelDownloaderVerificationWindow({
                            title: 'Talebed cần xác minh',
                            message: 'Mở cửa sổ Talebed và giữ cửa sổ đó. Web thường tự xác minh; script sẽ tiếp tục khi nội dung hiện ra.',
                            url,
                            windowName: '__ND_Talebed_Verify__',
                        });
                        verification.popup = popup;
                    } else {
                        popup.location.href = url;
                    }
                    if (!popup) throw stopForVerification('Talebed: Không mở được cửa sổ xác minh. Hãy cho phép pop-up rồi tải lại trang.');
                    try { popup.focus(); } catch (error) { /* ignore */ }
                    const target = new URL(url);
                    const startedAt = Date.now();
                    while (Date.now() - startedAt < 180000) {
                        if (popup.closed) throw stopForVerification('Talebed: Cửa sổ xác minh đã bị đóng. Đã dừng tải; hãy xác minh rồi tải lại trang để tiếp tục.');
                        try {
                            const current = new URL(popup.location.href);
                            const samePage = current.origin === target.origin && current.pathname === target.pathname
                                && (current.searchParams.get('page') || '1') === (target.searchParams.get('page') || '1');
                            if (samePage && popup.document.readyState !== 'loading' && popup.document.querySelector(selector)) {
                                return Rule.helpers.parseHtml(popup.document.documentElement.outerHTML);
                            }
                        } catch (error) {
                            // The verification page may temporarily switch origins while loading.
                        }
                        await sleep(700);
                    }
                    throw stopForVerification('Talebed: Hết thời gian chờ xác minh. Đã dừng tải; hãy xác minh rồi tải lại trang để tiếp tục.');
                })();
                try {
                    return await verification.pending;
                } catch (error) {
                    verification.stopped = true;
                    error.ndVerificationCancelled = true;
                    throw error;
                } finally {
                    verification.pending = null;
                }
            };
            const loadDoc = async (url, selector) => {
                if (verification.stopped) throw stopForVerification('Talebed: Lượt tải đang dừng vì xác minh. Hãy xác minh xong rồi tải lại trang để tiếp tục.');
                const response = await fetch(url, {
                    credentials: 'same-origin',
                    signal: AbortSignal.timeout(Number(Config.timeout) || 30000),
                });
                if (response.status === 429) {
                    verification.stopped = true;
                    throw stopForVerification('Talebed: Web đang giới hạn truy cập (HTTP 429). Đã dừng tải; hãy đợi rồi tải lại trang để tiếp tục.');
                }
                const html = await response.text();
                let challenge = false;
                if (response.status === 401 || response.status === 403) {
                    try { challenge = JSON.parse(html).error === 'verification_required'; } catch (error) { /* HTML response */ }
                }
                const doc = Rule.helpers.parseHtml(html);
                const blocked = !doc.querySelector(selector) && (challenge || /人机验证|Just a moment|Attention Required/i.test(doc.title)
                    || Boolean(doc.querySelector('.cf-turnstile, script[src*="challenges.cloudflare.com"]')));
                if (blocked) return waitForVerification(url, selector);
                if (response.status === 401 || response.status === 403) {
                    verification.stopped = true;
                    throw stopForVerification(`Talebed: HTTP ${response.status}. Đã dừng tải; hãy kiểm tra đăng nhập/quyền đọc rồi tải lại trang.`);
                }
                if (!response.ok) throw new Error(`Talebed: HTTP ${response.status} khi tải trang.`);
                return doc;
            };
            const coverSource = (doc) => doc.querySelector('canvas[data-cover]');

            return {
                siteName: '洋柿子书城 (Talebed)',
                charset: 'utf-8',
                chapterUrl: /^https?:\/\/(?:www\.)?talebed\.com\/read\/[1-9]\d*\/[1-9]\d*\/?(?:[?#].*)?$/i,
                filter: () => {
                    if (!bookIdFromUrl()) return 0;
                    return /^\/read\//.test(location.pathname) ? 2 : 1;
                },
                infoPage: () => `${location.origin}/detail?id=${bookIdFromUrl()}`,
                title: (doc) => coverSource(doc)?.getAttribute('data-title') || doc.querySelector('h1')?.textContent.trim() || '',
                writer: (doc) => coverSource(doc)?.getAttribute('data-author')
                    || doc.querySelector('h1 + div > span')?.textContent.trim() || '',
                intro: (doc) => {
                    const intro = doc.querySelector('p.whitespace-pre-line');
                    if (intro) return intro.innerHTML.replace(/\r\n?|\n/g, '<br />');
                    const text = doc.querySelector('meta[property="og:description"], meta[name="description"]')?.getAttribute('content') || '';
                    const element = document.createElement('div');
                    element.textContent = text;
                    return element.innerHTML;
                },
                cover: async (doc) => {
                    const source = coverSource(doc);
                    if (!source) return doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
                    const root = document.createElement('div');
                    const canvas = document.createElement('canvas');
                    for (const name of ['cover', 'title', 'author', 'category']) {
                        canvas.dataset[name] = source.dataset[name] || '';
                    }
                    root.appendChild(canvas);
                    const page = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
                    if (typeof page.drawCovers !== 'function') return '';
                    page.drawCovers(root);
                    if (canvas.dataset.painted !== '1' || !canvas.width || !canvas.height) return '';
                    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
                    if (!blob) return '';
                    Storage.book.coverBlob = blob;
                    return canvas.toDataURL('image/png');
                },
                getChapters: async () => {
                    const bookId = bookIdFromUrl();
                    if (!bookId) throw new Error('Talebed: Hãy mở trang chi tiết, mục lục hoặc trang đọc của một truyện.');
                    const visitedPages = new Set();
                    const chapters = [];
                    let pageUrl = new URL(`/page/${bookId}?page=1`, location.origin);
                    let expectedTotal = 0;

                    while (pageUrl) {
                        const page = Number(pageUrl.searchParams.get('page') || 1);
                        if (!Number.isSafeInteger(page) || page < 1 || visitedPages.has(page) || visitedPages.size >= 1000) {
                            throw new Error('Talebed: Phân trang mục lục không hợp lệ. Đã dừng để tránh tải lặp.');
                        }
                        visitedPages.add(page);
                        const doc = await loadDoc(pageUrl.href, `a[href^="/read/${bookId}/"]`);
                        const count = doc.querySelector('h1')?.parentElement?.textContent.match(/共\s*(\d+)\s*章/);
                        if (count) expectedTotal = Math.max(expectedTotal, Number(count[1]));
                        let pageChapters = 0;
                        for (const link of doc.querySelectorAll('a[href]')) {
                            const url = parseUrl(link.getAttribute('href'), pageUrl.href);
                            const match = url?.pathname.match(new RegExp(`^/read/${bookId}/([1-9]\\d*)/?$`));
                            if (!match || url.origin !== location.origin) continue;
                            const title = (link.querySelector('span') || link).textContent.trim();
                            if (!title) continue;
                            chapters.push({
                                title,
                                url: `${location.origin}/read/${bookId}/${match[1]}`,
                                vip: link.getAttribute('data-vip') === '1' || Boolean(link.querySelector('.vip-tag, [data-vip="1"]')),
                            });
                            pageChapters++;
                        }
                        if (!pageChapters) throw new Error(`Talebed: Không tìm thấy chương ở mục lục trang ${page}. Hãy kiểm tra đăng nhập/xác minh trên web.`);

                        const next = Array.from(doc.querySelectorAll('a[href]')).find((link) =>
                            link.getAttribute('rel') === 'next' || /^(?:下一[页頁]|下[页頁]|Next\b)/i.test(link.textContent.trim()));
                        if (!next) break;
                        const nextUrl = parseUrl(next.getAttribute('href'), pageUrl.href);
                        if (!nextUrl || nextUrl.origin !== location.origin || !new RegExp(`^/page/${bookId}/?$`).test(nextUrl.pathname)
                            || Number(nextUrl.searchParams.get('page') || 1) <= page) {
                            throw new Error('Talebed: Liên kết trang mục lục tiếp theo không hợp lệ.');
                        }
                        pageUrl = nextUrl;
                        await sleep(300);
                    }
                    const unique = Rule.helpers.uniqueBy(chapters, (chapter) => chapter.url)
                        .sort((a, b) => Number(a.url.split('/').pop()) - Number(b.url.split('/').pop()));
                    if (expectedTotal && unique.length < expectedTotal) {
                        throw new Error(`Talebed: Mục lục chưa đầy đủ (${unique.length}/${expectedTotal} chương). Hãy lấy lại danh sách chương.`);
                    }
                    return unique;
                },
                chapterTitle: 'h1.read-text',
                deal: async (chapter) => {
                    const url = parseUrl(chapter.url);
                    if (!url || url.origin !== location.origin || !/^\/read\/[1-9]\d*\/[1-9]\d*\/?$/.test(url.pathname)) {
                        throw new Error('Talebed: URL chương không hợp lệ.');
                    }
                    const doc = await loadDoc(url.href, '.read-content');
                    const content = doc.querySelector('.read-content')?.cloneNode(true);
                    if (!content) throw new Error('Talebed: Không tìm thấy nội dung chương. Hãy kiểm tra quyền đọc/đăng nhập/xác minh trên web.');
                    content.querySelectorAll('script, style, iframe, button, form, ins, .adsbygoogle').forEach((element) => element.remove());
                    if (!content.textContent.trim()) throw new Error('Talebed: Nội dung chương rỗng.');
                    return {
                        title: doc.querySelector('h1.read-text, h1')?.textContent.trim() || chapter.title,
                        content: content.innerHTML,
                    };
                },
                thread: 1,
            };
        })()
// @rule-end
)
