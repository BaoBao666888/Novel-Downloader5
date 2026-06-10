// @rule-name: 小强小说网
// @rule-source: special
(
// @rule-begin
        { // https://www.123xiaoqiang.in/
            siteName: '小强小说网',
            url: '://www.123xiaoqiang.in/\\d+/\\d+/',
            chapterUrl: '://www.123xiaoqiang.in/\\d+/\\d+/\\d+.html',
            title: 'h1',
            chapter: '.liebiao a',
            chapterTitle: 'h2',
            content: '#content',
        }
// @rule-end
)
