// @rule-name: 创世中文网
// @rule-source: special
(
// @rule-begin
        { // http://chuangshi.qq.com http://yunqi.qq.com
            siteName: '创世中文网',
            url: /(chuangshi|yunqi).qq.com\/bk\/.*?-l.html/,
            chapterUrl: /(chuangshi|yunqi).qq.com\/bk\/.*?-r-\d+.html/,
            infoPage: '.title>a,.bookNav>a:nth-child(4)',
            title: '.title>a>b',
            writer: '.au_name a',
            intro: '.info',
            cover: '.bookcover>img',
            chapter: 'div.list>ul>li>a',
            vipChapter: 'div.list:has(span.f900)>ul>li>a',
            volume: '.juan_height',
            deal: async (chapter) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.origin}/index.php/Bookreader/${$('.title a:eq(0)').attr('href').match(/\/(\d+).html/)[1]}/${chapter.url.match(/-(\d+).html/)[1]}`,
                        method: 'POST',
                        data: 'lang=zhs',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                let content = json.Content;
                                const base = 30;
                                const arrStr = [];
                                const arrText = content.split('\\');
                                for (let i = 1, len = arrText.length; i < len; i++) {
                                    arrStr.push(String.fromCharCode(parseInt(arrText[i], base)));
                                }
                                let html = arrStr.join('');
                                if ($('<div>').html(html).text().match(/url\((https?:\/\/yuewen-skythunder-\d+.*?\.ttf)\)/)) {
                                    if (!fontLib) fontLib = JSON.parse(GM_getResourceText('fontLib')).reverse();
                                    const font = $('<div>').html(html).text().match(/url\((https?:\/\/yuewen-skythunder-\d+.*?\.ttf)\)/)[1];

                                    opentype.load(font, (err, font) => {
                                        if (err) resolve('');
                                        const obj = {};
                                        const undefinedFont = [];
                                        for (const i in font.glyphs.glyphs) {
                                            const data = font.glyphs.glyphs[i].path.toPathData();

                                            const key = fontLib.find((i) => i.path === data);
                                            if (key) obj[font.glyphs.glyphs[i].unicode] = key.unicode;
                                            if (!key) undefinedFont.push(data);
                                        }
                                        if (undefinedFont.length) console.error('未确定字符', undefinedFont);
                                        html = html.replace(/&#(\d+);/g, (matched, m1) => (m1 in obj ? obj[m1] : matched));
                                        content = $('.bookreadercontent', html).html();
                                        resolve(content);
                                    });
                                } else {
                                    content = $('.bookreadercontent', html).html();
                                    resolve(content);
                                }
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
