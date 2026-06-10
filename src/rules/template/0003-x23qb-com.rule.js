// @rule-name: 模板网站-铅笔小说
// @rule-source: template
(
// @rule-begin
        { // https://www.x23qb.com/book/775/
            siteName: '模板网站-铅笔小说',
            filter: () => (['#header .wrap980', '.search span.searchBox', '.tabstit', '.coverecom'].every((i) => $(i).length) ? 1 : 0),
            title: '.d_title>h1',
            writer: '.p_author>a',
            intro: '#bookintro>p',
            cover: '#bookimg>img',
            chapter: '#chapterList>li>a',
            chapterTitle: 'h1',
            content: '.read-content',
            elementRemove: 'dt,div',
        }
// @rule-end
)
