// @rule-name: 半夏小说
// @rule-source: special
(
// @rule-begin
        { // https://www.xbanxia.cc
            siteName: '半夏小说',
            url: '://www\\.xbanxia\\.cc/books/\\d+\\.html',
            chapterUrl: '://www\\.xbanxia\\.cc/books/\\d+/\\d+\\.html',
            filter: () => {
                if (window.location.host !== 'www.xbanxia.cc') return 0;
                if (document.querySelector('div.book-list > ul > li > a')) return 1;
                if (document.querySelector('#nr1')) return 2;
                return 0;
            },
            title: 'div.book-describe > h1',
            writer: 'div.book-describe > p:first-of-type > a',
            intro: 'div.book-describe > div.describe-html > p:first-of-type',
            cover: (doc) => {
                const img = $('div.book-img > img', doc).first();
                return img.attr('data-original') || img.attr('src') || '';
            },
            chapter: 'div.book-list > ul > li > a',
            chapterTitle: '#nr_title, h1.post-title',
            content: '#nr1',
            elementRemove: 'script, style, iframe, span, div[style]',
            contentReplace: [
                [/半夏小说，快乐很多/g, ''],
                [/半夏小說，快樂很多/g, ''],
            ],
        }
// @rule-end
)
