// @rule-name: 逐浪
// @rule-source: special
(
// @rule-begin
        { // http://www.zhulang.com http://www.xxs8.com/
            siteName: '逐浪',
            url: /book.(zhulang|xxs8).com\/\d+\/$/,
            chapterUrl: /book.(zhulang|xxs8).com\/\d+\/\d+.html/,
            infoPage: 'strong>a,.textinfo>a',
            title: '.crumbs>strong',
            writer: '.cover-tit>h2>span>a',
            intro: '#book-summary',
            cover: '.cover-box-left>img',
            chapter: '.chapter-list>ul>li>a',
            vipChapter: '.chapter-list>ul>li>a:has(span)',
            volume: '.catalog-tit>h2',
            chapterTitle: 'h2>span',
            content: '#read-content',
            elementRemove: 'h2,div,style,p:has(cite)',
        }
// @rule-end
)
