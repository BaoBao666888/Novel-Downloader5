// @rule-name: 全本书屋(quanbensw)
// @rule-source: special
(
// @rule-begin
        { // http://www.quanbensw.cn/
            siteName: '全本书屋(quanbensw)',
            url: '://www.quanbensw.cn/index.php\\?s=/Home/Index/articlelist/id/\\d+.html',
            chapterUrl: '://www.quanbensw.cn/index.php\\?s=/Home/Index/info/id/\\d+.html',
            title: 'h4>strong',
            writer: 'h4+p>strong',
            intro: 'h4+p+h5',
            cover: '[alt="avatar"]',
            // chapter: '[href^="/index.php?s=/Home/Index/info/id"]',
            chapterTitle: '.content-header h1',
            content: '.article-story',
        }
// @rule-end
)
