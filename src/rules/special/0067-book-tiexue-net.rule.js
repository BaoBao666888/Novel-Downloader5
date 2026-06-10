// @rule-name: 铁血读书
// @rule-source: special
(
// @rule-begin
        { // https://book.tiexue.net
            siteName: '铁血读书',
            url: '://book.tiexue.net/Book\\d+/list.html',
            chapterUrl: '://book.tiexue.net/Book\\d+/Content\\d+.html',
            infoPage: '.positions>a:nth-child(5)',
            title: '.normaltitle>span',
            writer: '[href^="/FriendCenter.aspx"]>u',
            intro: '.bookPrdt >p',
            cover: '.li_01 img',
            chapter: '.list01>li>p a',
            vipChapter: '.list01>li>p>span>a',
            volume: '.dictry>h2',
            chapterTitle: '#contents>h1',
            content: '#mouseRight',
        }
// @rule-end
)
