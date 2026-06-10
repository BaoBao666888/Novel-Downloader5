// @rule-name: 悠读文学网
// @rule-source: special
(
// @rule-begin
        { // https://www.yooread.net/
            siteName: '悠读文学网',
            url: '://www.yooread.net/\\d+/\\d+/$',
            chapterUrl: '://www.yooread.net/\\d+/\\d+/\\d+.html',
            title: '.txt>h1',
            writer: '.wr>a',
            intro: '.last>p',
            cover: '.img>img',
            chapter: '#booklist .bookchapter+table a[href^="/"]',
            chapterTitle: 'h1',
            content: '#TextContent',
            elementRemove: 'div',
        }
// @rule-end
)
