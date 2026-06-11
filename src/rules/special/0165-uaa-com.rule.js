// @rule-name: UAA
// @rule-source: special
(
// @rule-begin
        { // https://www.uaa.com
            siteName: 'UAA',
            url: '://www\\.uaa\\.com/novel/intro\\?id=',
            chapterUrl: '://www\\.uaa\\.com/novel/(?:chapter|read)\\?',
            filter: () => {
                if (window.location.host !== 'www.uaa.com') return 0;
                if (document.querySelector('ul.catalog_ul a')) return 1;
                if (document.querySelector('div.article')) return 2;
                return 0;
            },
            title: '.info_box h1',
            writer: '.info_box div a',
            intro: 'div.brief',
            cover: 'img.cover',
            chapter: 'ul.catalog_ul a',
            chapterTitle: 'h1, .chapter_title',
            content: 'div.article',
            elementRemove: '.dizhi, script, style',
        }
// @rule-end
)
