// @rule-name: 吾的轻小说
// @rule-source: special
(
// @rule-begin
        { // https://www.biquge1000.com/
            siteName: '吾的轻小说',
            url: '://www.biquge1000.com/book/\\d+.html',
            chapterUrl: '://www.biquge1000.com/book/\\d+/\\d+.html',
            title: '.bookTitle',
            writer: '.booktag>a[href*="?author"]',
            intro: '#bookIntro',
            cover: '.img-thumbnail',
            chapter: '#list-chapterAll>dl>dd>a',
            volume: '#list-chapterAll>dl>dt',
            chapterTitle: '.readTitle',
            content: '#htmlContent',
        }
// @rule-end
)
