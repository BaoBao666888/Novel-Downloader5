// @rule-name: 陌上香坊
// @rule-source: special
(
// @rule-begin
        { // https://www.msxf.cn/
            siteName: '陌上香坊',
            url: '://www.msxf.cn/book/\\d+/chapter.html',
            chapterUrl: '://www.msxf.cn/book/\\d+/\\d+.html',
            infoPage: '[href*="/book/"][href$="index.html"]',
            title: '.title>a',
            writer: '.aInfo>.name>a',
            intro: '.intro',
            cover: '.pIntroduce .pic img',
            chapter: '.chapter-list li>a',
            vipChapter: '.chapter-list li:has(.vipico)>a',
            chapterTitle: '.article-title',
            content: '#article-content-body',
            elementRemove: 'p:contains("www.msxf.cn")',
        }
// @rule-end
)
