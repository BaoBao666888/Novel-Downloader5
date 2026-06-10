// @rule-name: 神凑小说网
// @rule-source: special
(
// @rule-begin
        { // http://www.shencou.com/
            siteName: '神凑小说网',
            url: '://www.shencou.com/read/\\d+/\\d+/index.html',
            chapterUrl: '://www.shencou.com/read/\\d+/\\d+/\\d+.html',
            infoPage: '[href*="books/read_"]',
            title: 'span>a',
            writer: '#content td:contains("小说作者"):nochild',
            intro: '[width="80%"]:last',
            cover: 'img[src*="www.shencou.com/files"]',
            chapter: '.zjlist4 a',
            volume: '.ttname>h2',
            chapterTitle: '>h1',
            content: 'body',
            elementRemove: 'div,script,center',
        }
// @rule-end
)
