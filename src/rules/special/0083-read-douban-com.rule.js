// @rule-name: 豆瓣阅读Ebook
// @rule-source: special
(
// @rule-begin
        { // https://read.douban.com/ebook
            siteName: '豆瓣阅读Ebook',
            url: '://read.douban.com/ebook/\\d+/',
            chapterUrl: '://read.douban.com/reader/ebook/\\d+/',
            title: '.article-title[itemprop="name"]',
            writer: '.author-item',
            intro: '[itemprop="description"]>.info',
            cover: '.cover>[itemprop="image"]',
            chapter: '.btn-read',
            deal: async (chapter) => Rule.special.find((i) => i.siteName === '豆瓣阅读').deal(chapter),
        }
// @rule-end
)
