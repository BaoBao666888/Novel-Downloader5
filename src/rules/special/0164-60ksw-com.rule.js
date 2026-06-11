// @rule-name: 60看书
// @rule-source: special
(
// @rule-begin
        { // https://www.60ksw.com
            siteName: '60看书',
            url: '://www\\.60ksw\\.com/[^/]+/[^/]+/[^/]+/index\\.html',
            chapterUrl: '://www\\.60ksw\\.com/[^/]+/[^/]+/[^/]+/[^/]+\\.html',
            filter: () => {
                if (window.location.host !== 'www.60ksw.com') return 0;
                if (document.querySelector('#chapterlist li > a')) return 1;
                if (document.querySelector('#content')) return 2;
                return 0;
            },
            title: 'div.booktitle > h1',
            writer: '#author',
            intro: '#bookintro',
            cover: '#bookimg img',
            chapter: '#chapterlist li > a',
            chapterTitle: 'h1, .booktitle > h1',
            content: '#content',
        }
// @rule-end
)
