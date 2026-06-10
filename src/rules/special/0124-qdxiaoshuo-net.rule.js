// @rule-name: 青豆小说网
// @rule-source: special
(
// @rule-begin
        { // http://www.qdxiaoshuo.net/
            siteName: '青豆小说网',
            url: '://www.qdxiaoshuo.net/book/\\d+.html',
            chapterUrl: '://www.qdxiaoshuo.net/read/\\d+/\\d+.html',
            title: '.kui-left.kui-fs32',
            chapter: '.kui-item>a',
            chapterTitle: 'h1.kui-ac',
            content: '#kui-page-read-txt',
        }
// @rule-end
)
