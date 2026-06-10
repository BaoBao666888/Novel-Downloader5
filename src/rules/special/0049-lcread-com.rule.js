// @rule-name: 连城读书
// @rule-source: special
(
// @rule-begin
        { // http://www.lcread.com
            siteName: '连城读书',
            url: /www.lcread.com\/bookpage\/\d+\/index.html/,
            chapterUrl: /www.lcread.com\/bookpage\/\d+\/\d+rc.html/,
            title: '.bri>table>tbody>tr>td>h1',
            writer: '[href^="http://my.lc1001.com/book/q?u="]',
            intro: '.bri2',
            cover: '.brc>img',
            chapter: '#abl4>table>tbody>tr>td>a',
            vipChapter: '#abl4>table>tbody>tr>td>a[href^="http://my.lc1001.com/vipchapters"]',
            volume: '#cul>.dsh',
            chapterTitle: 'h2',
            content: '#ccon',
        }
// @rule-end
)
