// @rule-name: 喜书网
// @rule-source: special
(
// @rule-begin
        { // http://www.xitxt.net
            siteName: '喜书网',
            url: '://www.xitxt.net/book/\\d+.html',
            chapterUrl: '://www.xitxt.net/read/\\d+_\\d+.html',
            title: 'h1',
            chapter: '.list a',
            chapterTitle: 'h1',
            content: '.chapter',
            elementRemove: 'font',
        }
// @rule-end
)
