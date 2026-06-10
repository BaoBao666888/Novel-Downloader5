// @rule-name: 轻之国度
// @rule-source: special
(
// @rule-begin
        { // https://www.lightnovel.us/
            siteName: '轻之国度',
            url: '://www.lightnovel.us(/cn)?/series',
            chapterUrl: '://www.lightnovel.us(/cn)?/detail/\\d+',
            title: () => unsafeWindow.__NUXT__.data[0].series.name,
            writer: () => unsafeWindow.__NUXT__.data[0].series.author,
            intro: () => unsafeWindow.__NUXT__.data[0].series.intro,
            cover: () => unsafeWindow.__NUXT__.data[0].series.cover,
            getChapters: () => window.__NUXT__.data[0].series.articles.sort((a, b) => a.aid - b.aid).map((i) => ({ title: i.title, url: `https://www.lightnovel.us/detail/${i.aid}` })),
            chapterTitle: '.article-title',
            content: (doc, res, request) => Rule.special.find((i) => i.siteName === '轻之国度').content(doc, res, request),
        }
// @rule-end
)
