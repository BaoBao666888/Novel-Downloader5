// @rule-name: 华夏天空
// @rule-source: special
(
// @rule-begin
        { // http://www.hxtk.com
            siteName: '华夏天空',
            url: '://www.hxtk.com/chapterList/\\d+',
            chapterUrl: '://www.hxtk.com/chapter/\\d+',
            infoPage: '.breadcrumb>a[href*="/bookDetail/"]',
            title: '.book-name>h1',
            writer: '.book-writer>a',
            intro: '.book-introduction>.part',
            cover: '.book-img>img',
            chapter: '.volume-item a',
            vipChapter: '.volume-item:has(i) a',
            chapterTitle: 'h2',
            content: '#chapter-content-str',
        }
// @rule-end
)
