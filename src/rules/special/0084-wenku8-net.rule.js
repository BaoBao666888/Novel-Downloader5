// @rule-name: 轻小说文库
// @rule-source: special
(
// @rule-begin
        // 轻小说
        { // https://www.wenku8.net
            siteName: '轻小说文库',
            url: /wenku8.(net|com)\/novel\/.*?\/(index\.htm)?$/,
            chapterUrl: /wenku8.(net|com)\/novel\/.*?\/\d+\.htm/,
            infoPage: 'a:contains("返回书页")',
            title: 'span>b',
            writer: '#content td:contains("小说作者"):last',
            intro: 'span:contains("内容简介")+br+span',
            cover: 'img[src*="img.wenku8.com"]',
            chapter: '.css>tbody>tr>td>a',
            volume: '.vcss',
            chapterTitle: '#title',
            content: '#content',
        }
// @rule-end
)
