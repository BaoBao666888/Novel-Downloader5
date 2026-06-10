// @rule-name: 辣鸡小说
// @rule-source: special
(
// @rule-begin
        { // https://www.lajixs.com/
            siteName: '辣鸡小说',
            url: '://www.lajixs.com/book/\\d+',
            chapterUrl: '://www.lajixs.com/chapter/\\d+',
            title: '.b-title>strong',
            writer: '.b-info>p>span>a',
            intro: '.bookIntro>.text',
            cover: '.cover',
            chapter: '.b_chapter_list a',
            vipChapter: '.b_chapter_list div:has(.zdy-icon__vip)>a',
            volume: '.el-collapse-item__header',
            deal: async (chapter) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: 'https://www.lajixs.com/api/book-read',
                        method: 'POST',
                        data: `chapterId=${chapter.url.match(/\d+/)[0]}&readType=1`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const title = json.data.chapterInfo.bookTitle;
                                const content = json.data.chapterInfo.chapterContent;
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
            elementRemove: 'lg',
        }
// @rule-end
)
