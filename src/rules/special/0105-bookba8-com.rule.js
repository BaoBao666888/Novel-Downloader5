// @rule-name: 在线书吧
// @rule-source: special
(
// @rule-begin
        { // https://www.bookba8.com/
            siteName: '在线书吧',
            url: '://www.bookba8.com/mulu-\\d+-list.html',
            chapterUrl: '://www.bookba8.com/read-\\d+-chapter-\\d+.html',
            infoPage: '[href*="book-"][href*="-info.html"]',
            title: '.detail-title>h2',
            writer: '[href^="/author"]',
            intro: '.juqing>dd',
            cover: '.detail-pic>img',
            chapter: '.content>.txt-list>li>a',
            chapterTitle: 'h1',
            content: '.note',
        }
// @rule-end
)
