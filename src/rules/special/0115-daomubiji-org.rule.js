// @rule-name: 盗墓笔记
// @rule-source: special
(
// @rule-begin
        { // http://www.daomubiji.org/
            siteName: '盗墓笔记',
            url: '://www.daomubiji.org/([a-z\\d]+)?$',
            chapterUrl: '://www.daomubiji.org/\\d+.html',
            title: '.mulu>h1',
            chapter: '.panel>ul>li>span>a',
            volume: '.panel>h2',
            chapterTitle: '.bg>h1',
            content: '.bg>.content',
        }
// @rule-end
)
