// @rule-name: 笔仙阁
// @rule-source: special
(
// @rule-begin
        { // https://m.bixiange.me
            siteName: '笔仙阁',
            filter: () => {
                if (window.location.host !== 'm.bixiange.me') return 0;
                if (document.querySelector('div.catalog > ul > li > a')) return 1;
                if (document.querySelector('#mycontent')) return 2;
                return 0;
            },
            title: 'h1',
            writer: (doc) => $('div.descTip > p:nth-of-type(2) > span', doc).first().text().replace('作者：', '').trim(),
            intro: 'div.descInfo > p',
            cover: 'div.cover > img',
            chapter: 'div.catalog > ul > li > a',
            chapterTitle: 'h1, .read_title',
            content: '#mycontent',
            elementRemove: 'script, style',
        }
// @rule-end
)
