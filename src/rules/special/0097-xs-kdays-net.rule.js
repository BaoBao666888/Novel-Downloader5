// @rule-name: 萌文库
// @rule-source: special
(
// @rule-begin
        { // http://xs.kdays.net/index
            siteName: '萌文库',
            url: '://xs.kdays.net/book/\\d+/chapter',
            chapterUrl: '://xs.kdays.net/book/\\d+/read/\\d+',
            infoPage: '[href$="/detail"]',
            title: '.info-side>h2',
            writer: '.items>li>a[href^="/search/author"]',
            intro: '.info-side>blockquote',
            cover: '.book-detail>div>div>img',
            chapter: '#vols>div>div>ul>li>a',
            volume: '#vols>div>div>h2',
            chapterTitle: '.chapterName',
            content: 'article',
        }
// @rule-end
)
