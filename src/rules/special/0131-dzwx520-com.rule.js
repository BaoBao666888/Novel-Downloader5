// @rule-name: 大众小说网
// @rule-source: special
(
// @rule-begin
        { // https://www.dzwx520.com/
            siteName: '大众小说网',
            url: '://www.dzwx520.com/book_\\d+/$',
            chapterUrl: '://www.dzwx520.com/book_\\d+/\\d+.html',
            title: 'h1',
            chapter: '.book_list a',
            chapterTitle: 'h1',
            content: '#htmlContent',
            elementRemove: 'script,div',
        }
// @rule-end
)
