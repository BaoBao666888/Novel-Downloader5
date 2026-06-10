// @rule-name: 格格党
// @rule-source: special
(
// @rule-begin
        { // https://www.ggdtxt.com
            siteName: '格格党',
            url: '://www.ggdtxt.com/book/\\d+/',
            chapterUrl: '://www.ggdtxt.com/\\d+/read_\\d+.html',
            title: '.novelname>a',
            writer: '.pt-bookdetail-info [href^="/author/"]',
            intro: '.pt-bookdetail-intro',
            cover: '.pt-bookdetail-img',
            chapter: '.pt-chapter-cont~.pt-chapter-cont .pt-chapter-cont-detail a[href]',
            deal: async (chapter) => {
                const info = chapter.url.match(/\d+/g);
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `https://www.ggdtxt.com/api/novel/chapter/transcode.html?novelid=${info[0]}&chapterid=${info[1]}&page=1`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const title = json.data.chapter.name;
                                const { content } = json.data.chapter;
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
