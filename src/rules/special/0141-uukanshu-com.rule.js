// @rule-name: UU看书
// @rule-source: special
(
// @rule-begin
        { // https://www.uukanshu.com
            siteName: 'UU看书',
            filter: () => {
                if (window.location.host !== 'www.uukanshu.com') return 0;
                if (document.querySelector('#chapterList > li > a')) return 1;
                if (document.querySelector('#contentbox')) return 2;
                return 0;
            },
            title: 'dd.jieshao_content > h1 > a',
            titleRegExp: /(.+?)最新章节/,
            writer: 'dd.jieshao_content > h2 > a',
            intro: 'dd.jieshao_content > h3',
            cover: 'a.bookImg > img',
            chapter: '#chapterList > li > a',
            volume: '#chapterList > li.volume',
            chapterTitle: 'div.h1title > h1, h1',
            content: '#contentbox',
            elementRemove: '.ad_content, script, style',
            contentReplace: [
                [/[ＵｕUu]+看书\s*[wｗ]+.[ＵｕUu]+[kｋ][aａ][nｎ][ｓs][hｈ][ＵｕUu].[nｎ][eｅ][tｔ]/g, ''],
                [/[ＵｕUu]+看书\s*[wｗ]+.[ＵｕUu]+[kｋ][aａ][nｎ][ｓs][hｈ][ＵｕUu].[cＣｃ][oＯｏ][mＭｍ]/g, ''],
                [/[UＵ]*看书[（(].*?[）)]文字首发。/g, ''],
                [/请记住本书首发域名：。?/g, ''],
                [/笔趣阁手机版阅读网址：/g, ''],
                [/小说网手机版阅读网址：/g, ''],
                [/UU看书\s+欢迎广大书友光临阅读，最新、最快、最火的连载作品尽在UU看书！UU看书。;?/g, ''],
            ],
        }
// @rule-end
)
