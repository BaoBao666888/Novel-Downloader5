// @rule-name: 创别书城
// @rule-source: special
(
// @rule-begin
        { // https://www.chuangbie.com
            siteName: '创别书城',
            url: '://www.chuangbie.com/book/catalog/book_id/\\d+.html',
            chapterUrl: '://www.chuangbie.com/book/read\\?book_id=\\d+&chapter_id=\\d+',
            title: '.con_02',
            writer: '.con_03>span',
            chapter: '.con_05 a',
            vipChapter: '.con_05 li:has(img)>a',
            volume: '.con_05>.bt',
            deal: async (chapter) => {
                const info = chapter.url.match(/\d+/g);
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `https://www.chuangbie.com/book/load_chapter_content?book_id=${info[0]}&chapter_id=${info[1]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = unsafeWindow.strdecode(res.responseText);
                                const content = json.content.chapter_content;
                                const title = json.content.chapter_name;
                                if (!Storage.book.title) Storage.book.title = json.content.book_name;
                                if (!Storage.book.cover) Storage.book.cover = json.content.book_cover;
                                if (!Storage.book.writer) Storage.book.writer = json.content.author_name;
                                if (!Storage.book.intro) Storage.book.intro = json.content.descriotion;
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
