// @rule-name: 亲小说网
// @rule-source: special
(
// @rule-begin
        { // https://www.qinxiaoshuo.com/
            siteName: '亲小说网',
            url: '://www.qinxiaoshuo.com/book/.*?',
            chapterUrl: '://www.qinxiaoshuo.com/read/\\d+/\\d+/.*?.html',
            title: 'h1',
            writer: '.info_item>div>a',
            intro: '.intro',
            cover: '.show_info>img',
            chapter: '.chapter>a',
            volume: '.volume_title>span',
            chapterTitle: '.c_title+.c_title>h3',
            content: '#chapter_content',
        }
// @rule-end
)
