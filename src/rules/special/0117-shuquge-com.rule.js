// @rule-name: 书趣阁
// @rule-source: special
(
// @rule-begin
        { // https://www.shuquge.com/
            siteName: '书趣阁',
            url: '://www.shuquge.com/txt/\\d+/index.html',
            chapterUrl: '://www.shuquge.com/txt/\\d+/\\d+.html',
            title: '.info>h2',
            writer: '.info>.small>span:nth-child(1)',
            intro: '.intro',
            cover: '.cover>img',
            chapter: '.listmain>dl>dt~dt~dd>a',
            volume: '.listmain>dl>dt~dt',
            chapterTitle: '.content>h1',
            content: '#content',
            thread: 1,
            contentReplace: [['https://www.shuquge.com/.*'], ['请记住本书首发域名：www.shuquge.com。书趣阁_笔趣阁手机版阅读网址：m.shuquge.com']],
        }
// @rule-end
)
