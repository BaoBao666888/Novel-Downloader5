// @rule-name: 网易云阅读
// @rule-source: special
(
// @rule-begin
        { // https://yuedu.163.com
            siteName: '网易云阅读',
            url: '://yuedu.163.com/source/.*',
            chapterUrl: '://yuedu.163.com/book_reader/.*',
            title: 'h3>em',
            writer: 'h3>span>a',
            intro: '.description',
            cover: '.cover>img',
            chapter: '.item>a,.title-1>a',
            vipChapter: '.vip>a',
            volume: '.title-1',
            deal: async (chapter) => {
                const urlArr = chapter.url.split('/');
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.protocol}//yuedu.163.com/getArticleContent.do?sourceUuid=${urlArr[4]}&articleUuid=${urlArr[5]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const content = CryptoJS.enc.Base64.parse(json.content).toString(CryptoJS.enc.Utf8);
                                const title = $('h1', content).text();
                                resolve({ content, title });
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
