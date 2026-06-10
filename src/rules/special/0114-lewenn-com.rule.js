// @rule-name: 乐文小说网
// @rule-source: special
(
// @rule-begin
        { // https://www.lewenn.com/
            siteName: '乐文小说网',
            url: '://www.lewenn.com/lw\\d+/$',
            chapterUrl: '://www.lewenn.com/lw\\d+/\\d+.html',
            title: '#info>h1',
            writer: '#info>h1+p',
            intro: '#intro',
            cover: '#fmimg>img',
            chapter: '.list dd>a',
            chapterTitle: '.head_title>h2',
            iframe: true,
            content: '#content',
            elementRemove: 'script,div',
        }
// @rule-end
)
