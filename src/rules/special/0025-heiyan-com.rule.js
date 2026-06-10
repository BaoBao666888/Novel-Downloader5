// @rule-name: 黑岩
// @rule-source: special
(
// @rule-begin
        { // https://www.heiyan.com https://www.ruochu.com
            siteName: '黑岩',
            url: /www.(heiyan|ruochu).com\/chapter\//,
            chapterUrl: /www.(heiyan|ruochu).com\/book\/\d+\/\d+/,
            infoPage: '.pic [href*="/book/"],.breadcrumb>a:nth-child(5)',
            title: 'h1[style]',
            writer: '.name>strong',
            intro: '.summary>.note',
            cover: '.book-cover',
            chapter: 'div.bd>ul>li>a',
            vipChapter: 'div.bd>ul>li>a.isvip',
            volume: '.chapter-list>.hd>h2',
            deal: async (chapter) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `http://${window.location.host.replace('www.', 'a.')}/ajax/chapter/content/${chapter.url.replace(/.*\//, '')}`,
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const { title } = json.chapter;
                                const content = json.chapter.htmlContent;
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
