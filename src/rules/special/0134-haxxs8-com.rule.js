// @rule-name: 海岸线文学网
// @rule-source: special
(
// @rule-begin
        { // http://www.haxxs8.com/
            siteName: '海岸线文学网',
            url: '://www.haxxs8.com/files/article/html/\\d+/\\d+/index.html',
            chapterUrl: '://www.haxxs8.com/files/article/html/\\d+/\\d+/\\d+.html',
            infoPage: 'a:contains("返回书页")',
            title: '.book-title>h1',
            writer: '.book-title>h1+em',
            intro: '.book-intro',
            cover: '.book-img>img',
            chapter: '.ccss a',
            chapterTitle: '#content h2',
            content: 'td[id^="content"]',
            elementRemove: 'div,span,font',
        }
// @rule-end
)
