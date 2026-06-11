// @rule-name: 名著阅读
// @rule-source: special
(
// @rule-begin
        { // https://b.guidaye.cc
            siteName: '名著阅读',
            url: '://b\\.guidaye\\.cc/[^/]+/\\d+/$',
            chapterUrl: '://b\\.guidaye\\.cc/[^/]+/\\d+/\\d+\\.html',
            filter: () => {
                if (window.location.host !== 'b.guidaye.cc') return 0;
                if (document.querySelector('#list-ol a[href*=".html"]')) return 1;
                if (document.querySelector('article.article-post')) return 2;
                return 0;
            },
            title: 'h1.secondfont, h1',
            writer: (doc) => $('.col-lg-9 p.mb-3 a[href*="/writer/"], a[href*="/writer/"]', doc).first().text().trim(),
            intro: (doc) => $('.col-lg-9 > p.mb-3', doc).last().text().replace(/……$/, '').trim(),
            cover: '.col-lg-3 img, img[alt*="在线阅读"]',
            chapter: '#list-ol a[href*=".html"]',
            chapterTitle: 'h1.secondfont, h1',
            content: 'article.article-post',
            elementRemove: 'script, style, iframe, .ad-slot',
        }
// @rule-end
)
