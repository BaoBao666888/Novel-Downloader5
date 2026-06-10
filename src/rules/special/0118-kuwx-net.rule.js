// @rule-name: 系统小说网
// @rule-source: special
(
// @rule-begin
        { // https://www.kuwx.net/
            siteName: '系统小说网',
            url: '://www.kuwx.net/ku/\\d+/\\d+/',
            chapterUrl: '://www.kuwx.net/ku/\\d+/\\d+/\\d+.html',
            title: '.book_inf h1',
            writer: '.book_inf .zz',
            intro: '.book_inf .jianjie+div',
            cover: '.book_cov>img',
            chapter: '#chapter>a',
            chapterTitle: '.article>h2',
            content: (doc, res, request) => $('#txt>dd', res.responseText).toArray().map((i) => [$(i).data('id'), $(i).html()]).filter((i) => i[0] !== 999)
                .sort((a, b) => a[0] - b[0])
                .map((i) => i[1])
                .join(''),
        }
// @rule-end
)
