// @rule-name: 书书屋
// @rule-source: special
(
// @rule-begin
        { // https://www.shushuwu8.com/
            siteName: '书书屋',
            url: '://www.shushuwu8.com/novel/\\d+/$',
            chapterUrl: '://www.shushuwu8.com/novel/\\d+/\\d+.html',
            title: '.ml_title>h1',
            writer: '.ml_title>h1+span',
            chapter: '.ml_main>dl>dd>a',
            chapterTitle: 'h2',
            content: '.yd_text2',
        }
// @rule-end
)
