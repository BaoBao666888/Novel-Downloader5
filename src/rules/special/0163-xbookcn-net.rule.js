// @rule-name: XBookCN
// @rule-source: special
(
// @rule-begin
        { // https://book.xbookcn.net
            siteName: 'XBookCN',
            url: '://book\\.xbookcn\\.net/search/label/',
            chapterUrl: '://book\\.xbookcn\\.net/\\d{4}/\\d{2}/[^?#]+\\.html',
            filter: () => {
                if (window.location.host !== 'book.xbookcn.net') return 0;
                if (document.querySelector('.status-msg-body, #Blog1_blog-pager-older-link')) return 1;
                if (document.querySelector('.entry-content')) return 2;
                return 0;
            },
            title: '.status-msg-body',
            writer: (doc) => $('.entry-content > p:nth-child(1)', doc).first().text().split('：')[1]?.trim() || '',
            intro: '.entry-content',
            cover: '',
            chapterTitle: 'h1.entry-title, h3.post-title, h3 > a',
            getChapters: async (doc) => {
                const helpers = Rule.helpers;
                const chapters = [];
                const seenPages = new Set();
                let pageDoc = doc;
                let pageUrl = location.href;
                for (let i = 0; pageUrl && !seenPages.has(pageUrl) && i < 200; i++) {
                    seenPages.add(pageUrl);
                    pageDoc.querySelectorAll('h3 > a[href]').forEach((link) => {
                        chapters.push({
                            title: link.textContent.trim(),
                            url: helpers.absoluteUrl(link.getAttribute('href'), pageUrl),
                        });
                    });
                    const older = pageDoc.querySelector('#Blog1_blog-pager-older-link[href]');
                    pageUrl = older ? helpers.absoluteUrl(older.getAttribute('href'), pageUrl) : '';
                    if (pageUrl && !seenPages.has(pageUrl)) pageDoc = await helpers.requestDoc(pageUrl);
                }
                return chapters;
            },
            deal: async (chapter) => {
                const doc = await Rule.helpers.requestDoc(chapter.url);
                const content = $('.entry-content', doc).first().clone();
                content.find('script, style').remove();
                return {
                    title: $('h1.entry-title, h3.post-title, h3 > a', doc).first().text().trim() || chapter.title,
                    content: content.html(),
                };
            },
            thread: 1,
        }
// @rule-end
)
