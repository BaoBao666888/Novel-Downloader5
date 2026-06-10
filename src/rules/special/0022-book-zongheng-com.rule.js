// @rule-name: 纵横
// @rule-source: special
(
// @rule-begin
        { // http://book.zongheng.com/ http://huayu.zongheng.com/
            siteName: '纵横',
            url: /(book|huayu).zongheng.com\/showchapter\/\d+.html/,
            chapterUrl: /(book|huayu).zongheng.com\/chapter\/\d+\/\d+.html/,
            infoPage: '[class$="crumb"]>a:nth-child(3)',
            title: '.book-name',
            writer: '.au-name',
            intro: '.book-dec>p',
            cover: '.book-img>img',
            chapter: '.chapter-list a',
            vipChapter: '.chapter-list .vip>a',
            volume: () => $('.volume').toArray().map((i) => i.childNodes[6]),
            chapterTitle: '.title_txtbox',
            content: '.content',
        }
// @rule-end
)
