// @rule-name: 肉肉阅读
// @rule-source: special
(
// @rule-begin
        { // https://xxread.net/
            siteName: '肉肉阅读', // 与网易云阅读相同模板
            url: '://xxread.net/book(-\\d+)?.php',
            chapterUrl: '://xxread.net/book_reader.php\\?b=\\d+&c=\\d+',
            title: '.m-bookdetail h3',
            intro: '.m-content .detail>.txt',
            chapter: '.item>a',
            deal: async (chapter) => {
                const info = chapter.url.match(/\d+/g);
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.protocol}//xxread.net/getArticleContent.php?sourceUuid=${info[0]}&articleUuid=${info[1]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText.match(/(\{.*\})/)[1]);
                                const content = CryptoJS.enc.Base64.parse(json.content).toString(CryptoJS.enc.Utf8);
                                const title = $('h1', content).text();
                                resolve({ content, title });
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                        checkLoad: () => true,
                    }, null, 0, true);
                });
                return content;
            },
            elementRemove: 'h1',
            getChapters: async (doc) => {
                const info = window.location.href.match(/\d+/g);
                const res = await xhr.sync(`https://xxread.net/getBook.php?b=${info[0]}`);
                const json = JSON.parse(res.responseText);
                const chapters = [];
                for (let i = 1; i < json.portions.length; i++) {
                    chapters.push({
                        title: json.portions[i].title,
                        url: `https://xxread.net/book_reader.php?b=${info[0]}&c=${json.portions[i].id}`,
                    });
                }
                return chapters;
            },
        }
// @rule-end
)
