// @rule-name: 天下书盟
// @rule-source: special
(
// @rule-begin
        { // http://www.fbook.net
            siteName: '天下书盟',
            url: '://www.fbook.net/list/\\d+',
            chapterUrl: '://www.fbook.net/read/\\d+',
            infoPage: '[class$="crumb"] a[href*="/book/"]',
            title: 'h1',
            intro: 'h1+div+div',
            cover: '.c_img>img',
            chapter: '.mb_content a',
            vipChapter: '.mb_content a:has(span:contains("VIP"))',
            volume: '.mb_content>li[style]',
            chapterTitle: '[itemprop="headline"]',
            content: '[itemprop="acticleBody"]',
        }
// @rule-end
)
