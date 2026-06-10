// @rule-name: ESJ Zone
// @rule-source: special
(
// @rule-begin
        { // https://www.esjzone.cc/
            siteName: 'ESJ Zone',
            url: '://(www.)?esjzone.cc/detail/\\d+.html',
            chapterUrl: '://(www.)?esjzone.cc/forum/\\d+/\\d+.html',
            title: 'h2',
            writer: '.book-detail a[href^="/tags/"]',
            intro: '.description',
            cover: '.product-gallery img',
            chapter: '#chapterList a',
            chapterTitle: 'h2',
            content: '.forum-content',
        }
// @rule-end
)
