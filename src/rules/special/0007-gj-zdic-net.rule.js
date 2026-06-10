// @rule-name: 汉典古籍
// @rule-source: special
(
// @rule-begin
        { // http://gj.zdic.net
            siteName: '汉典古籍',
            filter: () => (window.location.host === 'gj.zdic.net' ? ($('#ml_1').length ? 1 : 2) : 0),
            title: '#shuye>h1',
            intro: '#jj_2',
            chapter: '.mls>li>a',
            chapterTitle: '#snr1>h1',
            content: '#snr2',
            elementRemove: '.pagenav1',
            chapterPrev: 'a:contains("上一篇")',
            chapterNext: 'a:contains("下一篇")',
        }
// @rule-end
)
