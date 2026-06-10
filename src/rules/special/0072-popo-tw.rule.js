// @rule-name: POPO原創市集
// @rule-source: special
(
// @rule-begin
        { // https://www.popo.tw
            siteName: 'POPO原創市集',
            url: '://www.popo.tw/books/\\d+/articles(\\?page=\\d+)?$',
            chapterUrl: '://www.popo.tw/books/\\d+/articles/\\d+',
            title: '.booksdetail .title',
            writer: '.b_author>a',
            intro: '.book_intro',
            cover: '.cover-b',
            chapter: '.list-view .c2>a',
            chapterTitle: '.read-txt>h2',
            content: '.read-txt',
            getChapters: (doc) => Rule.special.find((i) => i.siteName === 'PO18臉紅心跳').getChapters(doc),
            elementRemove: 'blockquote',
        }
// @rule-end
)
