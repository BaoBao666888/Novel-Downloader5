// @rule-name: 翠微居小说网
// @rule-source: special
(
// @rule-begin
        { // http://www.cuiweijux.com/
            siteName: '翠微居小说网',
            url: '://www.cuiweijux.com/files/article/html/\\d+/\\d+/index.html',
            chapterUrl: '://www.cuiweijux.com/files/article/html/\\d+/\\d+/\\d+.html',
            title: 'td[valign="top"]>div>span:eq(0)',
            writer: 'td[valign="top"]>div>span:eq(1)',
            intro: '.tabvalue>div:nth-child(3)',
            cover: 'img[onerror]',
            chapter: '.chapters:eq(1)>.chapter>a',
            chapterTitle: '.title',
            content: '#content',
        }
// @rule-end
)
