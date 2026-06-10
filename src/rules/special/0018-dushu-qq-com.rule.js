// @rule-name: QQ阅读
// @rule-source: special
(
// @rule-begin
        { // http://dushu.qq.com 待测试:http://book.qq.com
            siteName: 'QQ阅读',
            url: /(book|dushu).qq.com\/intro.html\?bid=\d+/,
            chapterUrl: /(book|dushu).qq.com\/read.html\?bid=\d+&cid=\d+/,
            title: 'h3>a',
            writer: '.w_au>a',
            intro: '.book_intro',
            cover: '.bookBox>a>img',
            chapter: '#chapterList>div>ol>li>a',
            vipChapter: '#chapterList>div>ol>li:not(:has(span.free))>a',
            deal: async (chapter) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.origin}/read/${unsafeWindow.bid}/${chapter.url.match(/cid=(\d+)/)[1]}`,
                        method: 'POST',
                        data: 'lang=zhs',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                let content = json.Content;
                                content = $('.bookreadercontent', content).html();
                                resolve(content);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
        }
// @rule-end
)
