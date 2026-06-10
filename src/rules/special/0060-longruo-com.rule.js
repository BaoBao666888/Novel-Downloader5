// @rule-name: 龙若中文网
// @rule-source: special
(
// @rule-begin
        { // http://www.longruo.com
            siteName: '龙若中文网',
            url: '://www.longruo.com/chapterlist/\\d+.html',
            chapterUrl: '://www.longruo.com/catalog/\\d+_\\d+.html',
            infoPage: '.fc666 a:last,.position a:last',
            title: '.book_introduction h2>a',
            writer: '.fc999+a',
            intro: '.introduction_text',
            cover: '.mr20>a>img',
            chapter: '.catalog>li>a',
            vipChapter: '.catalog>li>a:has(span.mark)',
            chapterTitle: 'h1',
            content: '.article',
        }
// @rule-end
)
