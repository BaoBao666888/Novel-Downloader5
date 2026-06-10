// @rule-name: 模板网站-笔趣阁1
// @rule-source: template
(
// @rule-begin
        { // https://www.biqukan.com/57_57242/
            siteName: '模板网站-笔趣阁1',
            filter: () => (['body>.ywtop', 'body>.header', 'body>.nav', 'body>.book', 'body>.listmain,body>.book.reader'].every((i) => $(i).length) ? ($('#content').length ? 2 : 1) : 0),
            title: '.info>h2',
            writer: '.info>h2+div>span:nth-child(1)',
            intro: '.intro',
            cover: '.cover>img',
            chapter: '.listmain>dl>dd+dt~dd>a',
            chapterTitle: 'h1',
            content: '#content',
            elementRemove: 'a,p:empty,script',
        }
// @rule-end
)
