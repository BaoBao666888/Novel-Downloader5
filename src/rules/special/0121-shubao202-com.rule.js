// @rule-name: 书包网
// @rule-source: special
(
// @rule-begin
        { // http://www.shubao202.com/index.php http://lawen24.com/
            siteName: '书包网',
            url: ['://www.shubao202.com/book/\\d+', '://lawen24.com/txtbook/\\d+.html'],
            chapterUrl: ['://www.shubao202.com/read/\\d+/\\d+', '://lawen24.com/read/\\d+/\\d+'],
            title: 'h1',
            chapter: '.mulu a',
            chapterTitle: 'h1',
            content: '.mcc',
        }
// @rule-end
)
