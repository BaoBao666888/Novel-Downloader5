// @rule-name: 全本同人小说
// @rule-source: special
(
// @rule-begin
        { // https://www.qbtr.cc
            siteName: '全本同人小说',
            url: '://www\\.qbtr\\.cc/tongren/\\d+\\.html',
            chapterUrl: '://www\\.qbtr\\.cc/tongren/\\d+/\\d+\\.html',
            filter: () => {
                if (window.location.host !== 'www.qbtr.cc') return 0;
                if (document.querySelector('ul.clearfix > li > a')) return 1;
                if (document.querySelector('div.read_chapterDetail')) return 2;
                return 0;
            },
            title: 'div.infos > h1',
            writer: (doc) => $('div.infos > div.date > span', doc).first().text().replace(/^作者：?/, '').trim(),
            intro: 'div.infos > p',
            cover: () => 'https://www.qbtr.cc/skin/default/images/bbb2.png',
            chapter: 'ul.clearfix > li > a',
            chapterTitle: '.read_chapterName h1, h1',
            content: 'div.read_chapterDetail',
            elementRemove: 'script, style',
        }
// @rule-end
)
