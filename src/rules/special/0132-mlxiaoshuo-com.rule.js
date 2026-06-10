// @rule-name: 魔龙小说网
// @rule-source: special
(
// @rule-begin
        { // http://www.mlxiaoshuo.com
            siteName: '魔龙小说网',
            url: '://www.mlxiaoshuo.com/book/.*?.html',
            chapterUrl: '://www.mlxiaoshuo.com/chapter/.*?.html',
            title: '.colorStyleTitle',
            chapter: '.zhangjieUl a',
            chapterTitle: '.colorStyleTitle',
            content: '.textP',
        }
// @rule-end
)
