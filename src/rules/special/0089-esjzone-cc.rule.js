// @rule-name: ESJ Zone 论坛
// @rule-source: special
(
// @rule-begin
        { // https://www.esjzone.cc/forum/ 论坛
            siteName: 'ESJ Zone 论坛',
            url: '://www.esjzone.cc/forum/\\d+',
            chapterUrl: '://www.esjzone.cc/forum/\\d+/\\d+.html',
            title: 'h2',
            writer: '.book-detail a[href^="/tags/"]',
            intro: '.description',
            cover: '.product-gallery img',
            chapter: '.forum-list a',
            chapterTitle: 'h2',
            content: '.forum-content',
        }
// @rule-end
)
