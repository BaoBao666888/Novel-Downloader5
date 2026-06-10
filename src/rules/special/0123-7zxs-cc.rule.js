// @rule-name: 7z小说网
// @rule-source: special
(
// @rule-begin
        { // http://www.7zxs.cc/
            siteName: '7z小说网',
            url: '://www.7zxs.cc/ik258/\\d+/\\d+/index.html',
            chapterUrl: '://www.7zxs.cc/ik258/\\d+/\\d+/\\d+.html',
            title: '.title>h2',
            writer: '.title>h2+span',
            chapter: '.ocon>dl>dd>a',
            chapterTitle: '.nr_title>h3',
            content: '#htmlContent',
            contentReplace: [
                ['登陆7z小说网.*'],
            ],
        }
// @rule-end
)
