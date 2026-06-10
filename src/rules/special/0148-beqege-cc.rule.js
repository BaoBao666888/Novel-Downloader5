// @rule-name: 笔趣阁CC
// @rule-source: special
(
// @rule-begin
        { // https://www.beqege.cc
            siteName: '笔趣阁CC',
            filter: () => {
                if (window.location.host !== 'www.beqege.cc') return 0;
                if (document.querySelector('#list > dl > dd > a')) return 1;
                if (document.querySelector('#content')) return 2;
                return 0;
            },
            title: '#info > h1, h1',
            writer: (doc) => {
                const text = $('#info > p', doc).first().text();
                return (text.split('作    者：')[1] || text.replace(/^作\s*者\s*[：:]/, '')).trim();
            },
            intro: '#intro > p, #intro',
            cover: '#fmimg > img',
            chapter: '#list > dl > dd > a',
            chapterTitle: '.bookname h1, h1',
            content: '#content',
            elementRemove: 'script, style',
            contentReplace: [['zw443sx', '']],
        }
// @rule-end
)
