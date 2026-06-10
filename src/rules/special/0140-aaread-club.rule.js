// @rule-name: 疯情阅读
// @rule-source: special
(
// @rule-begin
        { // https://aaread.club/ 仿起点样式
            siteName: '疯情阅读',
            url: '://aaread.club/book/\\d+',
            chapterUrl: '://aaread.club/chapter/\\d+/\\d+',
            title: 'h1>em',
            writer: '.writer',
            intro: '.intro',
            cover: '.J-getJumpUrl>img',
            chapter: '.volume>.cf>li>a',
            chapterTitle: '.j_chapterName',
            deal: async (chapter) => {
                const urlArr = chapter.url.split('/');
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.origin}/_getcontent.php?id=${urlArr[5]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const content = res.responseText;
                                resolve(content);
                            } catch (error) {
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
            chapterPrev: (doc) => [$('[id^="chapter-"]', doc).attr('data-purl')],
            chapterNext: (doc) => [$('[id^="chapter-"]', doc).attr('data-nurl')],
        }
// @rule-end
)
