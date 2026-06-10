// @rule-name: 笔趣阁345
// @rule-source: special
(
// @rule-begin
        { // https://www.biquge345.com
            siteName: '笔趣阁345',
            filter: () => {
                if (window.location.host !== 'www.biquge345.com') return 0;
                if (document.querySelector('div.border > ul.info > li > a')) return 1;
                if (document.querySelector('#txt')) return 2;
                return 0;
            },
            title: 'h1',
            writer: 'div.xinxi > span.x1 > a',
            intro: 'div.xinxi > div.x3',
            cover: 'div.zhutu > img',
            chapter: 'div.border > ul.info > li > a',
            chapterTitle: 'h1',
            content: '#txt',
            elementRemove: 'p, script, style',
        }
// @rule-end
)
