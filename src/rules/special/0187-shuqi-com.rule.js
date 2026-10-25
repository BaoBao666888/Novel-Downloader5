// @rule-name: 书旗小说 (Shuqi)
// @rule-source: special
(
// @rule-begin
        (() => {
            const origin = 'https://www.shuqi.com';
            const readerCache = new Map();
            const bookIdFromUrl = (url = location.href) => {
                const parsed = new URL(url, origin);
                return (parsed.pathname.match(/^\/book\/(\d+)\/?$/) || [])[1]
                    || (/^\/(?:chapter|reader)\/?$/.test(parsed.pathname) && parsed.searchParams.get('bid')) || '';
            };
            const isGranted = (value) => value === true || value === 1 || value === '1';
            const textHtml = (text) => {
                const element = document.createElement('div');
                element.textContent = String(text || '');
                return element.innerHTML.replace(/\r\n?|\n/g, '<br />');
            };
            const requestContent = async (url) => {
                let response;
                try {
                    response = await fetch(url, {
                        credentials: 'omit',
                        signal: AbortSignal.timeout(Number(Config.timeout) || 30000),
                    });
                } catch (error) {
                    if (error.name === 'TimeoutError' || error.name === 'AbortError') throw new Error('Shuqi: Hết thời gian chờ nội dung chương.');
                    return Rule.helpers.requestJson(url, { timeout: Config.timeout });
                }
                if (!response.ok) throw new Error(`Shuqi: HTTP ${response.status} khi tải nội dung chương.`);
                return response.json();
            };
            const loadReader = async (bookId, doc = document, refresh = false) => {
                if (!/^\d+$/.test(bookId)) throw new Error('Shuqi: Không xác định được ID truyện.');
                if (refresh) readerCache.delete(bookId);
                if (!readerCache.has(bookId)) {
                    const loading = (async () => {
                        let node = !refresh && bookIdFromUrl() === bookId ? doc.querySelector('.js-dataChapters') : null;
                        if (!node) {
                            const firstLink = Array.from(doc.querySelectorAll('a[href]')).map((link) => new URL(link.getAttribute('href'), origin))
                                .find((url) => url.origin === origin && url.pathname === '/reader'
                                    && url.searchParams.get('bid') === bookId && /^\d+$/.test(url.searchParams.get('cid') || ''));
                            const readerUrl = firstLink?.href || `${origin}/reader?bid=${bookId}`;
                            let readerDoc;
                            try {
                                const response = await fetch(readerUrl, {
                                    credentials: 'include',
                                    signal: AbortSignal.timeout(Number(Config.timeout) || 30000),
                                });
                                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                                readerDoc = Rule.helpers.parseHtml(await response.text());
                            } catch (error) {
                                readerDoc = await Rule.helpers.requestDoc(readerUrl, { timeout: Config.timeout });
                            }
                            node = readerDoc.querySelector('.js-dataChapters');
                        }
                        if (!node) throw new Error('Shuqi: Không tìm thấy dữ liệu mục lục. Hãy mở trang đọc và kiểm tra xác minh/đăng nhập.');
                        const data = JSON.parse(node.textContent);
                        if (String(data.bookId) !== bookId || !Array.isArray(data.chapterList)) {
                            throw new Error('Shuqi: Dữ liệu mục lục không khớp truyện.');
                        }
                        const chapters = data.chapterList.flatMap((volume) => (volume.volumeList || [])
                            .map((chapter) => ({ ...chapter, volume: volume.volumeName || '' })));
                        return { data, chapters, byId: new Map(chapters.map((chapter) => [String(chapter.chapterId), chapter])) };
                    })();
                    readerCache.set(bookId, loading);
                    loading.catch(() => {
                        if (readerCache.get(bookId) === loading) readerCache.delete(bookId);
                    });
                }
                return readerCache.get(bookId);
            };

            return {
                siteName: '书旗小说 (Shuqi)',
                filter: () => {
                    if (!/^(?:www\.)?shuqi\.com$/i.test(location.hostname) || !/^\d+$/.test(bookIdFromUrl())) return 0;
                    return /^\/reader\/?$/.test(location.pathname) ? 2 : 1;
                },
                infoPage: () => `${origin}/book/${bookIdFromUrl()}`,
                title: '.view-book-info .bname',
                writer: '.view-book-info .bauthor a',
                intro: (doc) => textHtml(doc.querySelector('.js-showDesc')?.getAttribute('data-text')
                    || doc.querySelector('.js-descContent')?.textContent || ''),
                cover: 'img.cover',
                getChapters: async (doc) => {
                    const bookId = bookIdFromUrl();
                    const { chapters } = await loadReader(bookId, doc, true);
                    return Rule.helpers.uniqueBy(chapters.filter((chapter) => /^\d+$/.test(String(chapter.chapterId)))
                        .map((chapter) => ({
                            title: chapter.chapterName,
                            url: `${origin}/reader?bid=${bookId}&cid=${chapter.chapterId}`,
                            vip: !isGranted(chapter.isFreeRead),
                            volume: chapter.volume,
                        })), (chapter) => chapter.url);
                },
                deal: async (chapter) => {
                    const url = new URL(chapter.url, origin);
                    const bookId = bookIdFromUrl(url.href);
                    const chapterId = url.searchParams.get('cid');
                    if (!/^\d+$/.test(chapterId || '')) throw new Error('Shuqi: URL chương không hợp lệ.');
                    const { data, byId } = await loadReader(bookId);
                    const entry = byId.get(chapterId);
                    if (!entry) throw new Error('Shuqi: Chương không có trong mục lục hiện tại. Hãy lấy lại danh sách chương.');
                    const free = isGranted(entry.isFreeRead);
                    if (!free && !isGranted(entry.isBuy)) {
                        throw new Error('Shuqi: Chương VIP chưa được mở/mua. Hãy đăng nhập, mở quyền đọc trên web rồi lấy lại danh sách chương.');
                    }
                    const prefix = free ? data.freeContUrlPrefix : data.chargeContUrlPrefix;
                    if (!prefix || !entry.contUrlSuffix) throw new Error('Shuqi: Không tìm thấy địa chỉ nội dung chương.');
                    const contentUrl = new URL(prefix + entry.contUrlSuffix, origin);
                    if (contentUrl.protocol === 'http:') contentUrl.protocol = 'https:';
                    if (!/(^|\.)shuqireader\.com$/i.test(contentUrl.hostname)) throw new Error('Shuqi: Host nội dung chương không hợp lệ.');
                    if (!free) {
                        const token = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith('usertoken='));
                        if (!token) throw new Error('Shuqi: Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại trên web.');
                        contentUrl.searchParams.set('userToken', decodeURIComponent(token.slice('usertoken='.length)));
                    }
                    const response = await requestContent(contentUrl.href);
                    if (Number(response.state) !== 200 || !response.ChapterContent) {
                        throw new Error('Shuqi: Không lấy được toàn văn chương. Hãy kiểm tra quyền đọc và lấy lại danh sách chương.');
                    }
                    // The web reader applies ROT13 to the Base64 alphabet before UTF-8 decoding.
                    const base64 = String(response.ChapterContent).replace(/[A-Za-z]/g, (character) =>
                        String.fromCharCode(character.charCodeAt(0) + (character.toLowerCase() <= 'm' ? 13 : -13)));
                    const content = new TextDecoder('utf-8', { fatal: true })
                        .decode(Uint8Array.from(atob(base64), (character) => character.charCodeAt(0))).trim();
                    if (!content) throw new Error('Shuqi: Nội dung chương rỗng sau khi giải mã.');
                    const contentDoc = Rule.helpers.parseHtml(/<(?:br|p|div)\b/i.test(content) ? content : textHtml(content));
                    contentDoc.querySelectorAll('script, style, iframe, object, embed').forEach((element) => element.remove());
                    if (!contentDoc.body.textContent.trim()) throw new Error('Shuqi: Nội dung chương rỗng sau khi xử lý HTML.');
                    return { title: entry.chapterName || chapter.title, content: contentDoc.body.innerHTML };
                },
                thread: 1,
            };
        })()
// @rule-end
)
