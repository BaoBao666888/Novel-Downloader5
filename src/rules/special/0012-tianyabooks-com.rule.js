// @rule-name: 天涯书库
// @rule-source: special
(
// @rule-begin
        { // https://www.tianyabooks.com
            siteName: '天涯书库',
            url: /tianyabooks\.com\/.*?\/$/,
            chapterUrl: /tianyabooks\.com\/.*?\.html$/,
            title: '.book>h1',
            writer: 'h2>a[href^="/author/"]',
            intro: '.description>p',
            chapter: '.book>dl>dd>a',
            volume: '.book>dl>dt',
            chapterTitle: 'h1',
            content: '[align="center"]+p',
        }
// @rule-end
)
