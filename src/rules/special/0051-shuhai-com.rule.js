// @rule-name: 书海小说网
// @rule-source: special
(
// @rule-begin
        { // http://www.shuhai.com
            siteName: '书海小说网',
            url: 'www.shuhai.com/book/\\d+.htm',
            chapterUrl: 'www.shuhai.com/read/\\d+/\\d+.html',
            title: '.book-info-bookname>span',
            writer: '.book-info-bookname>span+span',
            intro: '.book-info-bookintro',
            cover: '.book-info .book-cover',
            chapter: '.chapter-item>a',
            vipChapter: '.chapter-item:has(.vip)>a',
            volume: 'span.chapter-item',
            chapterTitle: '.chapter-name',
            content: '.chapter-item:has(.chaper-info)',
            elementRemove: 'div',
        }
// @rule-end
)
