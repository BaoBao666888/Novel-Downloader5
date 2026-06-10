// @rule-name: 神书网
// @rule-source: special
(
// @rule-begin
        { // http://www.shenshuw.com
            siteName: '神书网',
            url: '://www.shenshu.info/s\\d+/',
            chapterUrl: '://www.shenshu.info/s\\d+/\\d+.html',
            title: 'h1',
            chapter: '#chapterlist a',
            chapterTitle: 'h1',
            content: '#book_text',
        }
// @rule-end
)
