// @rule-name: 看书网
// @rule-source: special
(
// @rule-begin
        { // https://www.kanshu.com
            siteName: '看书网',
            url: /www.kanshu.com\/artinfo\/\d+.html/,
            chapterUrl: /www.kanshu.com\/files\/article\/html\/\d+\/\d+.html/,
            title: '.author',
            intro: '.detailInfo',
            cover: '.bookImg',
            chapter: '.list>a',
            vipChapter: '.list>a.isvip',
            chapterTitle: '.contentBox .title',
            content: '.contentBox .tempcontentBox',
        }
// @rule-end
)
