// @rule-name: 天涯文学
// @rule-source: special
(
// @rule-begin
        { // https://book.tianya.cn/
            siteName: '天涯文学',
            url: /book.tianya.cn\/html2\/dir.aspx\?bookid=\d+/,
            chapterUrl: /book.tianya.cn\/chapter-\d+-\d+/,
            infoPage: () => `https://book.tianya.cn/book/${window.location.href.split('/').slice(-1)[0].match(/\d+/)[0]}.aspx`,
            title: '.book-name>a',
            writer: '.bd>p>span',
            intro: '#brief_intro',
            cover: '.lft-pic>a>img',
            chapter: 'ul.dit-list>li>a',
            vipChapter: 'ul.dit-list>li:not(:has(.free))>a',
            deal: async (chapter) => {
                const result = await new Promise((resolve, reject) => {
                    const urlArr = chapter.url.split('-');
                    xhr.add({
                        chapter,
                        url: 'https://app3g.tianya.cn/webservice/web/read_chapter.jsp',
                        method: 'POST',
                        data: `bookid=${urlArr[1]}&chapterid=${urlArr[2]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: 'https://app3g.tianya.cn/webservice/web/proxy.html',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const title = json.data.curChapterName;
                                const content = json.data.chapterContent;
                                resolve({ title, content });
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return result;
            },
        }
// @rule-end
)
