// @rule-name: WestNovel
// @rule-source: special
(
// @rule-begin
        { // https://www.westnovel.com
            siteName: 'WestNovel',
            filter: () => {
                if (window.location.host !== 'www.westnovel.com') return 0;
                if (document.querySelector('.chapterlist > dd > a')) return 1;
                if (document.querySelector('#BookText')) return 2;
                return 0;
            },
            title: '.btitle > h1 > a',
            writer: (doc) => $('.btitle > em:nth-child(2)', doc).first().text().replace('作者：', '').trim(),
            intro: '.intro-p > p:nth-child(1)',
            cover: '.img-img',
            chapter: '.chapterlist > dd > a',
            chapterTitle: 'h1, .chapter h1',
            content: '#BookText',
            elementRemove: 'div.ads, div.link, h4, script, style',
        }
// @rule-end
)
