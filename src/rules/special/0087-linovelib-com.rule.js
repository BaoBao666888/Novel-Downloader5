// @rule-name: 轻小说文库(linovelib.com)
// @rule-source: special
(
// @rule-begin
        { // https://www.linovelib.com/
            siteName: '轻小说文库(linovelib.com)',
            url: '://www.linovelib.com/novel/\\d+/catalog',
            chapterUrl: '://www.linovelib.com/novel/\\d+/\\d+(_\\d+)?.html',
            infoPage: '.crumb>a:nth-child(3)',
            title: '.book-name',
            writer: '.au-name>a',
            intro: '.book-dec>p',
            cover: '.book-img>img',
            chapter: '.chapter-list a',
            volume: '.volume',
            chapterTitle: '#mlfy_main_text>h1',
            content: '.read-content',
        }
// @rule-end
)
