// @rule-name: 小説家になろう
// @rule-source: special
(
// @rule-begin
        { // https://ncode.syosetu.com/
            siteName: '小説家になろう',
            url: '://ncode.syosetu.com/n\\d+[a-z]{2}(/#main)?',
            chapterUrl: '://ncode.syosetu.com/n\\d+[a-z]{2}/\\d+/',
            title: '.novel_title',
            writer: '.novel_writername>a',
            intro: '#novel_ex',
            chapter: '.index_box>dl>dd>a',
            chapterTitle: '.novel_subtitle',
            content: (doc, res, request) => {
                const content = $('#novel_honbun', res.responseText).html();
                const authorSays = $('#novel_a', res.responseText).html();
                return content + '-'.repeat(20) + authorSays;
            },
        }
// @rule-end
)
