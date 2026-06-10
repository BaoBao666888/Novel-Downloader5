// @rule-name: 平板电子书网
// @rule-source: special
(
// @rule-begin
        { // https://www.qiqint.com/
            siteName: '平板电子书网',
            url: '://www.qiqint.com/\\d+/$',
            chapterUrl: '://www.qiqint.com/\\d+/\\d+.html',
            title: 'h1',
            writer: '.author',
            intro: '.intro',
            cover: '.cover>img',
            chapter: '.list>dl>dd>a',
            chapterTitle: 'h1',
            content: '.content',
            elementRemove: 'div',
        }
// @rule-end
)
