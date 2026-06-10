// @rule-name: 全本书屋
// @rule-source: special
(
// @rule-begin
        { // https://www.quanshuwan.com/
            siteName: '全本书屋',
            url: '://www.quanshuwan.com/book/\\d+.aspx',
            chapterUrl: '://www.quanshuwan.com/article/\\d+.aspx',
            title: 'h1',
            writer: 'h1~p',
            intro: '#bookintroinner',
            cover: '.fm>img',
            chapter: '#readlist a',
            chapterTitle: 'h1',
            content: '#content',
            elementRemove: 'div',
        }
// @rule-end
)
