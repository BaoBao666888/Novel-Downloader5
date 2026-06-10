// @rule-name: 58小说网
// @rule-source: special
(
// @rule-begin
        { // http://www.5858xs.com
            siteName: '58小说网',
            url: '://www.5858xs.com/html/\\d+/\\d+/index.html',
            chapterUrl: '://www.5858xs.com/html/\\d+/\\d+/\\d+.html',
            infoPage: () => `http://www.5858xs.com/${window.location.href.split('/')[5]}.html`,
            title: 'h1>b',
            writer: '.info_a li>span',
            intro: '#info_content',
            cover: '#info_content>img',
            chapter: 'td>a[href$=".html"]',
            chapterTitle: 'h1',
            content: '#content',
            elementRemove: 'fieldset,table,div',
        }
// @rule-end
)
