// @rule-name: 同人小说网
// @rule-source: special
(
// @rule-begin
        { // https://www.trxs.cc https://www.jpxs123.com
            siteName: '同人小说网',
            filter: () => {
                if (!['www.trxs.cc', 'trxs.cc', 'www.jpxs123.com', 'jpxs123.com'].includes(window.location.host)) return 0;
                if (document.querySelector('div.book_list > ul.clearfix > li > a')) return 1;
                if (document.querySelector('.read_chapterDetail')) return 2;
                return 0;
            },
            title: (doc) => $('.infos > h1', doc).first().text().split('(')[0].trim(),
            writer: (doc) => $('.date > span > a, .date > span', doc).first().text().replace(/^作者：?/, '').trim(),
            intro: '.infos > p',
            cover: '.pic > img',
            chapter: 'div.book_list > ul.clearfix > li > a',
            chapterTitle: '.read_chapterName h1, h1',
            content: '.read_chapterDetail',
            elementRemove: 'script, style',
        }
// @rule-end
)
