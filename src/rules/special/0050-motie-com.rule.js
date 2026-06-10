// @rule-name: 磨铁中文网
// @rule-source: special
(
// @rule-begin
        { // https://www.motie.com
            siteName: '磨铁中文网',
            url: /www.motie.com\/book\/\d+/,
            chapterUrl: /www.motie.com\/chapter\/\d+\/\d+/,
            title: '.title>.name',
            writer: '.title>.name+a',
            intro: '.brief_text',
            cover: '.pic>span>img',
            chapter: '.catebg a',
            vipChapter: '.catebg a:has([alt="vip"])',
            volume: '.cate-tit>h2',
            deal: async (chapter) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `https://app2.motie.com/pc/chapter/${chapter.url.split('/')[5]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const title = json.data.name;
                                const { content } = json.data;
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
