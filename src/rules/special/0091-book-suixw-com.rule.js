// @rule-name: 随想轻小说
// @rule-source: special
(
// @rule-begin
        { // http://book.suixw.com
            siteName: '随想轻小说',
            url: '://book.suixw.com/modules/article/reader.php\\?aid=\\d+',
            chapterUrl: '://book.suixw.com/modules/article/reader.php\\?aid=\\d+&cid=\\d+',
            infoPage: 'a:contains("返回书页")',
            title: 'span[style]',
            writer: '#content td:contains("小说作者"):nochild',
            intro: '#content td:has(.hottext):last',
            cover: 'img[src*="book.suixw.com"]',
            chapter: '.ccss>a',
            volume: '.vcss',
            chapterTitle: '#title',
            content: '#content',
            contentReplace: [
                [/pic.wenku8.com/g, 'picture.wenku8.com'],
            ],
        }
// @rule-end
)
