// @rule-name: 豆腐
// @rule-source: special
(
// @rule-begin
        { // https://www.doufu.la/
            siteName: '豆腐',
            url: '://www.doufu.la/novel-',
            chapterUrl: '://www.doufu.la/chapter/',
            title: 'h1.book_tt>a',
            writer: '.book_author',
            intro: '.book_des',
            cover: '.book_img',
            chapter: '.catelogue a',
            vipChapter: '.catelogue .list_item:has([class*="icon-lock"])>a',
            chapterTitle: '.chapter_tt',
            content: async (doc, res, request) => {
                const chapter = request.raw;
                const token = $(res.responseText).toArray().find((i) => i.tagName === 'META' && i.name === 'csrf-token').content; // same as XSRF-TOKEN<cookie>
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `https://www.doufu.la/novel/getChapter/${chapter.url.split('/')[4]}`,
                        method: 'POST',
                        headers: {
                            Referer: chapter.url,
                            'x-csrf-token': token,
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const { content } = json;
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
            elementRemove: '.hidden',
            thread: 1,
        }
// @rule-end
)
