// @rule-name: 繽紛幻想
// @rule-source: special
(
// @rule-begin
        { // https://colorful-fantasybooks.com/
            siteName: '繽紛幻想',
            url: '://colorful-fantasybooks.com/module/novel/info.php\\?tid=\\d+&nid=\\d+',
            chapterUrl: '://colorful-fantasybooks.com/module/novel/read.php\\?tid=\\d+&nid=\\d+&cid=\\d+',
            title: '.works-intro-title>strong',
            writer: '.works-author-name',
            intro: 'works-intro-short',
            cover: '.works-cover>img',
            chapter: '.works-chapter-item>a',
            volume: '.vloume',
            chapterTitle: '#content>h2',
            content: '.content',
        }
// @rule-end
)
