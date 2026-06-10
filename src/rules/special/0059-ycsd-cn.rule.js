// @rule-name: 原创书殿
// @rule-source: special
(
// @rule-begin
        { // http://www.ycsd.cn
            siteName: '原创书殿',
            url: '://www.ycsd.cn/book/chapters/.*?',
            chapterUrl: '://www.ycsd.cn/book/chapter/.*?',
            infoPage: '[class$="crumbs"] a:last',
            title: '.book-name',
            writer: '.author-name',
            intro: '.book-desc',
            cover: '.book-cover>img',
            chapter: '.directory-item>a',
            vipChapter: '.directory-item>a:has(img)',
            chapterTitle: '.chapter-wrap>h1',
            content: '.content',
        }
// @rule-end
)
