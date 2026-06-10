// @rule-name: 3G书城
// @rule-source: special
(
// @rule-begin
        { // http://www.3gsc.com.cn
            siteName: '3G书城',
            url: /3gsc\.com\.cn\/bookreader\/\d+/,
            chapterUrl: /3gsc.com.cn\/bookcon\//,
            infoPage: '[href^="/book/"]',
            title: 'h1.RecArticle',
            writer: '.author',
            intro: '.RecReview',
            cover: '.RecBook img[onerror]',
            chapter: '.menu-area>p>a',
            vipChapter: '.menu-area>p>a:has(span.vip)',
            volume: '.menu-area>h2',
            chapterTitle: 'h1',
            content: '.menu-area',
        }
// @rule-end
)
