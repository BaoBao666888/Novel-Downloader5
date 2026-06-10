// @rule-name: 起点台湾
// @rule-source: special
(
// @rule-begin
        { // https://www.qidian.com.tw/
            siteName: '起点台湾',
            url: '://www.qidian.com.tw/books/\\d+/volumes',
            chapterUrl: '://www.qidian.com.tw/books/\\d+/articles/\\d+',
            infoPage: '.breadcrumb>a:nth-child(3)',
            title: 'h1',
            writer: 'h1+.bm',
            intro: '#dot1',
            cover: '.imgbc-b>img',
            chapter: '.chapter>a',
            vipChapter: '.chapter.pay>a',
            volume: '.chapter-list-all>ul>li.TITLE',
            chapterTitle: 'h1',
            content: '.box-text dd',
        }
// @rule-end
)
