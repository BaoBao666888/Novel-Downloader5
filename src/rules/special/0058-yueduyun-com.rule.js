// @rule-name: 阅路小说网
// @rule-source: special
(
// @rule-begin
        { // https://www.yueduyun.com/
            siteName: '阅路小说网',
            url: '://www.yueduyun.com/catalog/\\d+',
            chapterUrl: '://www.yueduyun.com/read/\\d+/\\d+',
            infoPage: () => `https://apiuser.yueduyun.com/w/block/book?book_id=${window.location.href.match(/\d+/)[0]}`,
            title: (doc) => JSON.parse($('body', doc).html()).data.book_name,
            writer: (doc) => JSON.parse($('body', doc).html()).data.author_name,
            intro: (doc) => JSON.parse($('body', doc).html()).data.book_intro,
            cover: (doc) => JSON.parse($('body', doc).html()).data.book_cover,
            chapter: '.catalog li>a',
            vipChapter: '.catalog li:has(span)>a',
            deal: async (chapter) => {
                const urlArr = chapter.url.split('/');
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `https://apiuser.yueduyun.com/app/chapter/chapter_content?book_id=${urlArr[4]}&chapter_id=${urlArr[5]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const title = json.data.chapter_name;
                                const content = json.data.chapter_content;
                                Storage.book.title = json.data.book_name;
                                Storage.book.writer = json.data.author_name;
                                resolve({ title, content });
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
