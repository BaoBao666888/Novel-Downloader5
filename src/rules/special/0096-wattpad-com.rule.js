// @rule-name: Wattpad
// @rule-source: special
(
// @rule-begin
        { // https://www.wattpad.com/
            siteName: 'Wattpad',
            url: '://www.wattpad.com/story/\\d+-',
            chapterUrl: '://www.wattpad.com/\\d+-',
            title: '.story-info__title',
            writer: '.author-info__username>a',
            intro: '.description>pre',
            cover: '.story-cover>img',
            chapter: '.story-parts__part',
            chapterTitle: '.panel-reading>h1.h2',
            content: '.part-content .page>div>pre',
            chapterPrev: (doc, res, request) => $('.table-of-contents>li.active', res.responseText).prevAll().find('a').toArray()
                .map((i) => i.href)
                .reverse(),
            chapterNext: (doc, res, request) => $('.table-of-contents>li.active', res.responseText).nextAll().find('a').toArray()
                .map((i) => i.href),
        }
// @rule-end
)
