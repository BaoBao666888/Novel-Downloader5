// @rule-name: 蔷薇书院
// @rule-source: special
(
// @rule-begin
        { // http://www.qwsy.com
            siteName: '蔷薇书院',
            url: '://www.qwsy.com/mulu/\\d+.html',
            chapterUrl: '://www.qwsy.com/read.aspx\\?cid=\\d+',
            infoPage: '.readtop_nav>.fl>a:nth-child(4)',
            title: '.title_h1',
            writer: '.aAuthorLink',
            intro: '#div_jj2>p',
            cover: '.zpdfmpic>img',
            chapter: '.td_con>a',
            vipChapter: '.td_con:has(span[style="color:#ff0000;"])>a',
            deal: async (chapter) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `http://script.qwsy.com/html/js/${chapter.url.replace('http://www.qwsy.com/read.aspx?cid=', '')}.js`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const content = res.responseText.match(/document.write\("(.*)"\);/)[1];
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
            elementRemove: 'font,br',
        }
// @rule-end
)
