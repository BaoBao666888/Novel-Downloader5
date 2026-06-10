// @rule-name: 禁忌书屋
// @rule-source: special
(
// @rule-begin
        { // https://www.cool18.com/bbs4/index.php
            siteName: '禁忌书屋',
            filter: () => (['www.cool18.com'].includes(window.location.host) ? ($('#myform').length ? 2 : 1) : 0),
            chapterUrl: '://www.cool18.com/bbs4/index.php\\?app=forum&act=threadview&tid=\\d+',
            title: 'font>b',
            chapter: 'a:not(:contains("(无内容)"))',
            chapterTitle: 'font>b',
            content: '.show_content>pre',
            chapterPrev: '.show_content>p>a',
            chapterNext: 'body>table td>p:first+ul a:not(:contains("(无内容)")),.show_content>pre a',
            elementRemove: 'font[color*="E6E6DD"],b:contains("评分完成")',
        }
// @rule-end
)
