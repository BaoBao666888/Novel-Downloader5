// @rule-name: 疯情书库
// @rule-source: special
(
// @rule-begin
        { // https://aastory.space/
            siteName: '疯情书库',
            filter: () => (document.title.match('疯情书库') && ['/archive.php', '/read.php'].includes(window.location.pathname) ? (['/archive.php'].includes(window.location.pathname) ? 1 : 2) : 0),
            // url: '://aastory.space/archive.php\\?id=\\d+',
            // chapterUrl: '://aastory.space/read.php\\?id=\\d+',
            title: '.index_title',
            writer: '.index_info>span',
            chapter: '.section_list>li>a',
            volume: '.section_title',
            chapterTitle: '.chapter_title',
            content: async (doc, res, request) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter: request.raw,
                        url: `${window.location.origin}/_getcontent.php?id=${request.url.match(/id=(\d+)/)[1]}&v=${res.responseText.match(/chapid\+"&v=(.*?)"/)[1]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: request.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const content = res.responseText;
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
