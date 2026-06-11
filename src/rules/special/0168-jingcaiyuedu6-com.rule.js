// @rule-name: 精彩小说网
// @rule-source: special
(
// @rule-begin
        { // https://jingcaiyuedu6.com/novel/*.html
            siteName: '精彩小说网',
            url: '://jingcaiyuedu6\\.com/novel/[^/]+\\.html',
            chapterUrl: '://jingcaiyuedu6\\.com/[^?#]+\\.html',
            title: '.book-info > h1 > em',
            writer: '.book-info > h1 > a',
            intro: '.book-info > p.intro',
            cover: '.book-img-cover',
            getChapters: async () => {
                const helpers = Rule.helpers;
                const tocHref = $('a.red-btn:nth-child(3)').attr('href') || $('a.red-btn').eq(2).attr('href');
                const tocUrl = tocHref ? helpers.absoluteUrl(tocHref, location.href) : '';
                if (!tocUrl) return [];
                const doc = await helpers.requestDoc(tocUrl);
                return Array.from(doc.querySelectorAll('dd.col-md-4 > a[href]')).map((link) => ({
                    title: link.textContent.trim(),
                    url: helpers.absoluteUrl(link.getAttribute('href'), tocUrl),
                }));
            },
            chapterTitle: 'h1, .chapter-title',
            content: '#htmlContent',
            contentReplace: [
                [/精彩小说网最新地址[^\n\r<]*/g, ''],
            ],
        }
// @rule-end
)
