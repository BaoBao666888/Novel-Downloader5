// @rule-name: 繁體小說網 (Fantinovels)
// @rule-source: special
(
// @rule-begin
        (() => {
            const bookIdFromUrl = (url = location.href) => (new URL(url, location.href).pathname.match(/^\/(\d+)(?:\/|$)/) || [])[1] || '';
            const loadDoc = async (url) => {
                if (new URL(url, location.href).href === location.href) return document;
                const response = await xhr.sync(url, null, {
                    timeout: Config.timeout,
                    responseType: 'text',
                    overrideMimeType: 'text/html; charset=gbk',
                });
                if (response.status < 200 || response.status >= 300) throw new Error(`Fantinovels: HTTP ${response.status} khi tải trang.`);
                return Rule.helpers.parseHtml(response.responseText || response.response || '');
            };
            const meta = (doc, name) => doc.querySelector(`meta[property="${name}"]`)?.getAttribute('content') || '';

            return {
                siteName: '繁體小說網 (Fantinovels)',
                charset: 'gbk',
                url: /^https?:\/\/(?:www\.)?fantinovels\.com\/\d+\/?(?:[?#].*)?$/i,
                chapterUrl: /^https?:\/\/(?:www\.)?fantinovels\.com\/\d+\/\d+(?:_\d+)?\.html(?:[?#].*)?$/i,
                infoPage: () => `${location.origin}/${bookIdFromUrl()}/`,
                title: (doc) => meta(doc, 'og:novel:book_name') || doc.querySelector('h1.bookTitle')?.textContent.trim() || '',
                writer: (doc) => meta(doc, 'og:novel:author'),
                intro: (doc) => {
                    const intro = doc.querySelector('#bookIntro')?.cloneNode(true);
                    if (!intro) return $('<div>').text(meta(doc, 'og:description')).html();
                    intro.querySelectorAll('img, script, style').forEach((element) => element.remove());
                    return intro.innerHTML;
                },
                cover: (doc) => meta(doc, 'og:image') || doc.querySelector('img.img-thumbnail')?.getAttribute('src') || '',
                getChapters: async () => {
                    const bookId = bookIdFromUrl();
                    if (!bookId) throw new Error('Fantinovels: Không xác định được ID truyện.');
                    const base = `${location.origin}/${bookId}/`;
                    const doc = await loadDoc(base);
                    const links = doc.querySelectorAll('#list-chapterAll dd a[href]');
                    const chapters = Array.from(links).map((link) => ({
                        title: link.textContent.trim(),
                        url: new URL(link.getAttribute('href'), base).href,
                    })).filter((chapter) => {
                        const url = new URL(chapter.url);
                        return url.origin === location.origin && new RegExp(`^/${bookId}/\\d+\\.html$`).test(url.pathname);
                    });
                    if (!chapters.length) throw new Error('Fantinovels: Không tìm thấy mục lục đầy đủ. Hãy kiểm tra trang truyện/xác minh.');
                    return Rule.helpers.uniqueBy(chapters, (chapter) => chapter.url);
                },
                chapterTitle: 'h1.readTitle',
                deal: async (chapter) => {
                    const url = new URL(chapter.url, location.href);
                    if (url.origin !== location.origin || !/^\/\d+\/\d+(?:_\d+)?\.html$/.test(url.pathname)) {
                        throw new Error('Fantinovels: URL chương không hợp lệ. Hãy lấy lại danh sách chương.');
                    }
                    const doc = await loadDoc(url.href);
                    const content = doc.querySelector('#htmlContent')?.cloneNode(true);
                    if (!content) throw new Error('Fantinovels: Không tìm thấy nội dung chương. Hãy kiểm tra trang chương/xác minh.');
                    content.querySelectorAll('script, style, iframe, .adsbygoogle, .a2a_kit').forEach((element) => element.remove());
                    if (!content.textContent.trim()) throw new Error('Fantinovels: Nội dung chương rỗng.');
                    return {
                        title: doc.querySelector('h1.readTitle')?.textContent.trim() || chapter.title,
                        content: content.innerHTML,
                    };
                },
                chapterPrev: '#linkPrev',
                chapterNext: '#linkNext',
                thread: 1,
            };
        })()
// @rule-end
)
