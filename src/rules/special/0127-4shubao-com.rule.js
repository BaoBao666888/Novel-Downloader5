// @rule-name: 4书包
// @rule-source: special
(
// @rule-begin
        { // http://www.4shubao.com/
            siteName: '4书包',
            url: '://www.4shubao.com/read/\\d+.html',
            chapterUrl: '://www.4shubao.com/read/\\d+/\\d+.html',
            title: 'h1',
            chapter: '.chapterlist a',
            chapterTitle: 'h1',
            content: '#BookText',
        }
// @rule-end
)
