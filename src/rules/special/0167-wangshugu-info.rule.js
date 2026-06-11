// @rule-name: 望书阁
// @rule-source: special
(
// @rule-begin
        { // http://www.wangshugu.org -> http://www.wangshugu.info
            siteName: '望书阁',
            url: '://www\\.wangshugu\\.(?:org|info)/books/(?:book\\d+\\.html|\\d+/\\d+/)$',
            chapterUrl: '://www\\.wangshugu\\.(?:org|info)/books/\\d+/\\d+/\\d+\\.html',
            infoPage: () => {
                const helpers = Rule.helpers;
                const bookId = (location.pathname.match(/book(\d+)\.html/) || location.pathname.match(/\/books\/\d+\/(\d+)\//) || [])[1];
                return bookId ? helpers.absoluteUrl(`/books/book${bookId}.html`, location.href) : '';
            },
            title: (doc) => $('#content > dd > h1', doc).first().text().replace(/全文阅读$/, '').trim(),
            writer: (doc) => $('#at > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(4)', doc).first().text().trim(),
            intro: (doc) => $('#content > dd:nth-child(7) > p:nth-child(3)', doc).first().html() || '',
            cover: (doc) => {
                const src = $('.hst > img', doc).first().attr('src');
                return src ? Rule.helpers.absoluteUrl(src, location.href) : '';
            },
            chapterTitle: '#amain h1, h1',
            getChapters: async () => {
                const helpers = Rule.helpers;
                const bookId = (location.pathname.match(/book(\d+)\.html/) || location.pathname.match(/\/books\/\d+\/(\d+)\//) || [])[1];
                if (!bookId) return [];
                const listUrl = helpers.absoluteUrl(`/books/${Math.floor(Number(bookId) / 1000)}/${bookId}/`, location.href);
                const doc = location.href === listUrl ? document : await helpers.requestDoc(listUrl);
                return Array.from(doc.querySelectorAll('#at > tbody td > a[href]')).map((link) => ({
                    title: link.textContent.trim(),
                    url: helpers.absoluteUrl(link.getAttribute('href'), listUrl),
                }));
            },
            content: '#contents',
            thread: 1,
        }
// @rule-end
)
