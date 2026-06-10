// @rule-name: 香网
// @rule-source: special
(
// @rule-begin
        { // http://www.xiang5.com
            siteName: '香网',
            url: 'www.xiang5.com/booklist/\\d+.html',
            chapterUrl: 'www.xiang5.com/content/\\d+/\\d+.html',
            infoPage: '.pos a:last',
            title: '.fr>h4',
            writer: '.colR>a[href*="author"]',
            intro: '.workSecHit+h2+p',
            cover: '.worksLList .fl >a>img',
            chapter: '.lb>table>tbody>tr>td>a',
            volume: '.lb>h2',
            chapterTitle: '.pos>h1',
            content: '.xsDetail',
            elementRemove: 'p[style],p>*',
        }
// @rule-end
)
