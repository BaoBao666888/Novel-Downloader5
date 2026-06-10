// @rule-name: 256文学
// @rule-source: special
(
// @rule-begin
        { // https://www.256wenku.com
            siteName: '256文学',
            filter: () => {
                if (window.location.host !== 'www.256wenku.com') return 0;
                if (document.querySelector('.catalog > li > a')) return 1;
                if (document.querySelector('.book_con')) return 2;
                return 0;
            },
            title: '.art_tit',
            writer: (doc) => $('span.bookinfo:nth-child(1) > a, span.bookinfo:nth-child(1)', doc).first().text().replace(/^作者：/, '').trim(),
            intro: '.infotype > p',
            chapter: '.catalog > li > a',
            chapterTitle: '.bookname h1, h1',
            content: '.book_con',
            elementRemove: 'script, style',
        }
// @rule-end
)
