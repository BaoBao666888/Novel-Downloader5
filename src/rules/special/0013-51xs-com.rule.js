// @rule-name: 我要小说网
// @rule-source: special
(
// @rule-begin
        { // https://www.51xs.com/
            siteName: '我要小说网',
            url: '://www.51xs.com/.*?/index.html',
            chapterUrl: '://www.51xs.com/.*?/\\d+.htm',
            title: '[style="FONT-FAMILY: 宋体; FONT-SIZE:12pt"]',
            writer: '[href="../index.html"]',
            chapter: '[style="FONT-FAMILY: 宋体; FONT-SIZE:12pt"]+center a',
            volume: '[bgcolor="#D9DDE8"]',
            chapterTitle: '.tt2>center>b',
            content: '.tt2',
        }
// @rule-end
)
