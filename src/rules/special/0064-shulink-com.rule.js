// @rule-name: 书连
// @rule-source: special
(
// @rule-begin
        { // http://www.shulink.com
            siteName: '书连',
            url: '://vip.shulink.com(/files/article)?/html/\\d+/\\d+/index.*?.html.*',
            chapterUrl: '://vip.shulink.com(/files/article)?/html/\\d+/\\d+/\\d+.html',
            infoPage: 'a:contains("返回书页")',
            title: 'span[style*="color:red"]',
            writer: 'div[style*="float:right"] a[href^="/author"]',
            intro: '.tabvalue>div',
            cover: '.divbox img',
            chapter: '.index>dd>a',
            vipChapter: '.index>dd:has(em)>a',
            chapterTitle: '.atitle',
            content: '#acontent',
            elementRemove: 'div',
            contentReplace: [
                [/作者.*?提醒.*/, ''],
            ],
        }
// @rule-end
)
