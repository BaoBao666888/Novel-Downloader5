// @rule-name: 酷匠网
// @rule-source: special
(
// @rule-begin
        { // https://www.kujiang.com
            siteName: '酷匠网',
            url: '://www.kujiang.com/book/\\d+/catalog',
            chapterUrl: '://www.kujiang.com/book/\\d+/\\d+',
            infoPage: 'h1.zero>a:nth-child(2),.chapter_crumb>a:nth-child(2)',
            title: '.book_title',
            writer: '.book_author>a',
            intro: '#book_intro',
            cover: '.kjbookcover img',
            chapter: '.third>a',
            volume: '.kjdt-catalog>span:nth-child(1)',
            chapterTitle: 'h1',
            content: '.content',
            elementRemove: 'span',
            contentReplace: [
                ['.*酷.*匠.*网.*'],
            ],
        }
// @rule-end
)
