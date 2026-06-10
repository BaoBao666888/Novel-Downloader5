// @rule-name: 630书
// @rule-source: special
(
// @rule-begin
        { // https://www.630shu.net
            siteName: '630书',
            filter: () => {
                if (window.location.host !== 'www.630shu.net') return 0;
                if (document.querySelector('.zjlist > dd > a')) return 1;
                if (document.querySelector('#content')) return 2;
                return 0;
            },
            title: '#info > h1',
            writer: 'div.options > span.item:nth-child(1) > a',
            intro: '#intro',
            cover: '.img_in > img',
            chapter: '.zjlist > dd > a',
            chapterTitle: '.bookname h1, h1',
            content: '#content',
            elementRemove: 'script, style',
            contentReplace: [
                [/恋上你看书网 WWW\.630SHU\.NET ，最快更新.+最新章节！/g, ''],
            ],
        }
// @rule-end
)
