// @rule-name: 笔下看书阁
// @rule-source: special
(
// @rule-begin
        { // https://www.lhjypx.net/ // TODO
            siteName: '笔下看书阁',
            url: '://www.lhjypx.net/(novel|other/chapters/id)/\\d+.html',
            chapterUrl: '://www.lhjypx.net/book/\\d+/\\w+.html',
            infoPage: '.breadcrumb>li:nth-child(3)>a',
            title: '.info2>h1',
            writer: '.info2>h3>a',
            intro: '.info2>div>p',
            cover: '.info1>img',
            chapter: '.list-charts [href*="/book/"],.panel-chapterlist [href*="/book/"]',
            chapterTitle: '#chaptername',
            content: '#txt',
        }
// @rule-end
)
