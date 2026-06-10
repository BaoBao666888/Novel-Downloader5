// @rule-name: 怀素吧小说
// @rule-source: special
(
// @rule-begin
        { // http://www.huaisu8.com
            siteName: '怀素吧小说',
            url: '://www.huaisu8.com/\\d+/\\d+/($|#)',
            chapterUrl: '://www.huaisu8.com/\\d+/\\d+/\\d+.html',
            title: '.info>h2',
            chapter: '.index-body .newzjlist:nth-child(4) .dirlist a',
            chapterTitle: '.play-title>h1',
            content: '.txt_tcontent',
        }
// @rule-end
)
