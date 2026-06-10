// @rule-name: 完本神站
// @rule-source: special
(
// @rule-begin
        { // https://www.wanbentxt.com/
            siteName: '完本神站',
            url: '://www.wanbentxt.com/\\d+/$',
            chapterUrl: '://www.wanbentxt.com/\\d+/\\d+(_\\d+)?.html',
            title: '.detailTitle>h1',
            writer: '.writer>a',
            intro: '.detailTopMid>table>tbody>tr:nth-child(3)>td:nth-child(2)',
            cover: '.detailTopLeft>img',
            chapter: '.chapter>ul>li>a',
            chapterTitle: '.readerTitle>h2',
            content: '.readerCon',
            contentReplace: [
                [/^\s*(&nbsp;)+谨记我们的网址.*。/m],
                [/^\s*(&nbsp;)+一秒记住.*/m],
                [/^<br>(&nbsp;)+【提示】：.*?。/m],
                [/^<br>(&nbsp;)+看更多好文请搜.*/m],
                [/^<br>(&nbsp;)+《[完本神站]》.*/m],
                [/^<br>(&nbsp;)+喜欢神站记得收藏.*/m],
                [/^<br>(&nbsp;)+支持.*把本站分享那些需要的小伙伴.*/m], // eslint-disable-line no-control-regex
                [/--&gt;&gt;本章未完，点击下一页继续阅读/],
            ],
        }
// @rule-end
)
