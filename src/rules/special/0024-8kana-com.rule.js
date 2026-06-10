// @rule-name: 不可能的世界
// @rule-source: special
(
// @rule-begin
        { // https://www.8kana.com/
            siteName: '不可能的世界',
            url: /www.8kana.com\/book\/\d+(.html)?/,
            chapterUrl: /www.8kana.com\/read\/\d+.html/,
            title: 'h2.left',
            writer: '.authorName',
            intro: '.bookIntroduction',
            cover: '.bookContainImgBox img',
            chapter: '#informList li.nolooking>a',
            vipChapter: '#informList li.nolooking>a:has(.chapter_con_VIP)',
            volume: '[flag="volumes"] span',
            chapterTitle: 'h2',
            content: '.myContent',
            elementRemove: '[id="-2"]',
        }
// @rule-end
)
