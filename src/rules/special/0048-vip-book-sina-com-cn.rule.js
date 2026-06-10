// @rule-name: 微博读书-书城
// @rule-source: special
(
// @rule-begin
        { // http://vip.book.sina.com.cn
            siteName: '微博读书-书城',
            url: /vip.book.sina.com.cn\/weibobook\/book\/\d+.html/,
            chapterUrl: /vip.book.sina.com.cn\/weibobook\/vipc.php\?bid=\d+&cid=\d+/,
            title: 'h1.book_name',
            writer: '.authorName',
            intro: '.info_txt',
            cover: '.book_img>img',
            chapter: '.chapter>span>a',
            vipChapter: '.chapter>span:has(i)>a',
            chapterTitle: '.sr-play-box-scroll-t-path>span',
            content: (doc, res, request) => window.eval(res.responseText.match(/var chapterContent = (".*")/)[1]), // eslint-disable-line no-eval
        }
// @rule-end
)
