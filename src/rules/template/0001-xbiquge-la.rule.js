// @rule-name: 模板网站-笔趣阁
// @rule-source: template
(
// @rule-begin
        { // http://www.xbiquge.la/54/54439/
            siteName: '模板网站-笔趣阁',
            filter: () => (['.ywtop', '.nav', '.header_logo', '#wrapper', '.header_search'].every((i) => $(i).length) ? ($('#content').length ? 2 : 1) : 0),
            title: '#info>h1',
            writer: '#info>h1+p',
            intro: '#intro',
            cover: '#fmimg>img',
            chapter: '#list>dl>dd>a',
            chapterTitle: 'h1',
            content: '#content',
            elementRemove: 'a,p:empty,script',
        }
// @rule-end
)
