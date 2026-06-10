// @rule-name: 梦远书城
// @rule-source: special
(
// @rule-begin
        { // http://www.my2852.com
            siteName: '梦远书城',
            filter: () => (window.location.href.match(/my2852?.com/) ? ($('a:contains("回目录")').length ? 2 : 1) : 0),
            titleRegExp: /(.*?)[|_]/,
            title: '.book>h1',
            writer: 'b:contains("作者")',
            intro: '.zhj,body > div:nth-child(4) > table > tbody > tr > td.td6 > div > table > tbody > tr > td:nth-child(1) > div > table > tbody > tr:nth-child(1) > td',
            cover: 'img[alt="封面"]',
            chapter: () => $('a[href]').toArray().filter((i) => $(i).attr('href').match(/^\d+\.htm/)).map((i) => ({ url: $(i).attr('href'), title: $(i).text().trim() })),
            content: 'td:has(br)',
        }
// @rule-end
)
