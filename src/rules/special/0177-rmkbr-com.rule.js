// @rule-name: 一曲书斋
// @rule-source: special
(
// @rule-begin
        { // http://www.rmkbr.com/*/*/
            siteName: '一曲书斋',
            filter: () => {
                if (window.location.host !== 'www.rmkbr.com') return 0;
                if (document.querySelector('dl > dd > a')) return 1;
                if (document.querySelector('#content')) return 2;
                return 0;
            },
            title: 'h1',
            writer: '#info > p:nth-of-type(3) > a',
            intro: '#intro > p',
            cover: '#fmimg > img',
            chapter: 'dl > dd > a',
            chapterTitle: '.bookname h1, h1',
            content: '#content',
        }
// @rule-end
)
