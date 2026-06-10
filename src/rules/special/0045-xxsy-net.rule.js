// @rule-name: 潇湘书院
// @rule-source: special
(
// @rule-begin
        { // https://www.xxsy.net
            siteName: '潇湘书院',
            url: /www.xxsy.net\/info\/\d+.html/,
            chapterUrl: /www.xxsy.net\/chapter\/\d+.html/,
            title: '.title h1',
            writer: '.title a[href^="/authorcenter/"]',
            intro: '.introcontent',
            cover: '.bookprofile>dt>img',
            chapter: '.catalog-list>li>a',
            vipChapter: '.catalog-list>li.vip>a',
            volume: () => $('.catalog-main>dt').toArray().map((i) => i.childNodes[2]),
            chapterTitle: '.chapter-title',
            content: '.chapter-main',
        }
// @rule-end
)
