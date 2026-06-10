// @rule-name: 乐文小说网
// @rule-source: special
(
// @rule-begin
        { // http://www.22lewen.com/
            siteName: '乐文小说网',
            url: '://www.\\d+lewen.com/read/\\d+(/0)?.html',
            chapterUrl: '://www.\\d+lewen.com/read/\\d+/\\d+(_\\d+)?.html',
            title: '.book-title>h1',
            chapter: '.chapterlist>dd>a',
            chapterTitle: '#BookCon>h1',
            content: '#BookText',
        }
// @rule-end
)
