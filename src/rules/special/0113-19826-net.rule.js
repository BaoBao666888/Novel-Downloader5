// @rule-name: 19826文学
// @rule-source: special
(
// @rule-begin
        { // https://www.19826.net/
            siteName: '19826文学',
            url: '://www.19826.net/\\d+/$',
            chapterUrl: '://www.19826.net/\\d+/\\d+(_\\d+)?.html',
            title: '.bookTitle',
            writer: '.booktag>[href*="author="]',
            intro: '#bookIntro',
            cover: '.img-thumbnail',
            chapter: '#list-chapterAll .panel-chapterlist>dd>a',
            chapterTitle: '.readTitle',
            content: '.panel-readcontent>.panel-body>div[id]',
            chapterNext: async (doc, res, request) => (res.responseText.match(/url = "(.*?)";/) ? res.responseText.match(/url = "(.*?)";/)[1] : []),
        }
// @rule-end
)
