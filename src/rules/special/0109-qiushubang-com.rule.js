// @rule-name: 求书帮
// @rule-source: special
(
// @rule-begin
        { // https://www.qiushubang.com/
            siteName: '求书帮',
            url: '://www.qiushubang.com/\\d+/$',
            chapterUrl: '://www.qiushubang.com/\\d+/\\d+(_\\d+)?.html',
            title: '.bookPhr>h2',
            writer: '.bookPhr>dl>dd:contains("作者")',
            intro: '.introCon>p',
            cover: '.bookImg>img',
            chapter: '.chapterCon>ul>li>a',
            chapterTitle: '.articleTitle>h2',
            content: '.articleCon>p:nth-child(3)',
        }
// @rule-end
)
