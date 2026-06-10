// @rule-name: 搜读网
// @rule-source: special
(
// @rule-begin
        { // http://www.soudu.net http://www.wjsw.com/
            siteName: '搜读网',
            url: '://www.(soudu.net|wjsw.com)/html/\\d+/\\d+/index.shtml',
            chapterUrl: '://www.(soudu.net|wjsw.com)/html/\\d+/\\d+/\\d+.shtml',
            infoPage: '.myPlace >a:nth-child(7)',
            title: 'h1',
            writer: '.c>a+a+span',
            intro: '#aboutBook',
            cover: 'img[onerror]',
            chapter: '.list>li>a',
            vipChapter: '.list>li:has(span.r_red)>a',
            chapterTitle: 'h1',
            content: '#content',
            elementRemove: 'div',
        }
// @rule-end
)
