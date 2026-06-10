// @rule-name: SF轻小说
// @rule-source: special
(
// @rule-begin
        { // https://book.sfacg.com
            siteName: 'SF轻小说',
            url: '://book.sfacg.com/Novel/\\d+/MainIndex/',
            chapterUrl: '://book.sfacg.com/Novel/\\d+/\\d+/\\d+/|://book.sfacg.com/vip/c/\\d+/',
            infoPage: '.crumbs a:nth-child(6)',
            title: 'h1.title>.text',
            writer: '.author-name',
            intro: '.introduce',
            cover: '.summary-pic>img',
            chapter: '.catalog-list>ul>li>a',
            vipChapter: '.catalog-list>ul>li>a:has(.icn_vip)',
            volume: '.catalog-title',
            chapterTitle: '.article-title',
            content: '#ChapterBody',
            vip: {
                deal: async (chapter) => `<img src="http://book.sfacg.com/ajax/ashx/common.ashx?op=getChapPic&tp=true&quick=true&cid=${chapter.url.split('/')[5]}&nid=${window.location.href.split('/')[4]}&font=16&lang=&w=728">`,
            },
        }
// @rule-end
)
