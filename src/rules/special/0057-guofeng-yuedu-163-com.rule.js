// @rule-name: 网易旗下
// @rule-source: special
(
// @rule-begin
        { // https://guofeng.yuedu.163.com/ https://caiwei.yuedu.163.com/
            siteName: '网易旗下',
            url: '://(guofeng|caiwei).yuedu.163.com/newBookReader.do\\?operation=catalog&sourceUuid=.*',
            chapterUrl: '://(guofeng|caiwei).yuedu.163.com/book_reader/.*',
            infoPage: () => `${window.location.origin}/source/${window.location.href.match(/sourceUuid=(.*?)($|&)/) ? window.location.href.match(/sourceUuid=(.*?)($|&)/)[1] : window.location.href.split('/')[4]}`,
            title: 'h3>em',
            writer: 'h3>em+span>a',
            intro: '.m-bookdetail .description',
            cover: '.m-bookdetail .cover>img',
            chapter: '.item>a',
            vipChapter: '.vip>a',
            volume: '.title-1',
            deal: async (chapter) => Rule.special.find((i) => i.siteName === '网易云阅读').deal(chapter),
        }
// @rule-end
)
