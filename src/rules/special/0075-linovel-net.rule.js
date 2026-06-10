// @rule-name: 轻之文库
// @rule-source: special
(
// @rule-begin
        { // https://www.linovel.net/
            siteName: '轻之文库',
            url: '://www.linovel.net/book/\\d+.html',
            chapterUrl: '://www.linovel.net/book/\\d+/\\d+.html',
            title: '.book-title',
            writer: '.author-frame .name>a',
            intro: '.about-text',
            cover: '.book-cover img',
            chapter: '.chapter a',
            volume: '.volume-title>a',
            chapterTitle: '.article-title',
            content: '.article-text',
        }
// @rule-end
)
