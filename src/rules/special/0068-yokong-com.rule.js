// @rule-name: 悠空网
// @rule-source: special
(
// @rule-begin
        { // https://www.yokong.com
            siteName: '悠空网',
            url: '://www.yokong.com/book/\\d+/chapter.html',
            chapterUrl: '://www.yokong.com/book/\\d+/\\d+.html',
            infoPage: '.location>a:nth-child(6)',
            title: '.name>h1',
            writer: '.authorname>a',
            intro: '.book-intro',
            cover: '.bigpic>img',
            chapter: '.chapter-list>li>span>a',
            vipChapter: '.chapter-list>li>span:has(.vip-icon)>a',
            volume: '.chapter-bd>h2',
            chapterTitle: 'h1',
            content: '.article-con',
            contentReplace: [
                ['请记住本站：.*'],
                ['微信公众号：.*'],
            ],
        }
// @rule-end
)
