// @rule-name: 雷姆轻小说
// @rule-source: special
(
// @rule-begin
        { // https://novel.crazyideal.com/
            siteName: '雷姆轻小说',
            url: '://novel.crazyideal.com/book/\\d+/',
            chapterUrl: '://novel.crazyideal.com/\\d+_\\d+/\\d+(_\\d+)?.html',
            title: '.novel_info_title>h1',
            writer: '.novel_info_title>i>a[href^="/author/"]',
            intro: '.intro',
            cover: '.novel_info_main>img',
            chapter: '#ul_all_chapters>li>a',
            chapterTitle: '.style_h1',
            content: '#article',
        }
// @rule-end
)
