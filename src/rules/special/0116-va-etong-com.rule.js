// @rule-name: 全本小说网
// @rule-source: special
(
// @rule-begin
        { // https://www.va-etong.com/
            siteName: '全本小说网',
            url: '://www.va-etong.com/xs/\\d+/$',
            chapterUrl: '://www.va-etong.com/xs/\\d+/\\d+.html',
            title: '.book-text>h1',
            writer: '.book-text>h1+span',
            intro: '.book-text>.intro',
            cover: '.book-img>a>img',
            chapter: '.cf+h3+.cf>li>a',
            chapterTitle: '.chaptername',
            content: async (doc, res, request) => {
                const ssid = res.response.match(/var ssid=(.*?);/)[1];
                const bookid = res.response.match(/bookid=(.*?);/)[1];
                const mybookid = res.response.match(/mybookid=(.*?);/)[1];
                const xid = Math.floor(mybookid / 1000);
                const chapterid = res.response.match(/chapterid=(.*?);/)[1];
                const hou = '.html';

                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter: request.raw,
                        url: `${window.location.origin}/files/article/html${ssid}/${xid}/${bookid}/${chapterid}${hou}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: request.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const content = window.eval(res.responseText); // eslint-disable-line no-eval
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
