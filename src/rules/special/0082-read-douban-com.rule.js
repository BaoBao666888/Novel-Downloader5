// @rule-name: 豆瓣阅读
// @rule-source: special
(
// @rule-begin
        { // https://read.douban.com/
            siteName: '豆瓣阅读',
            url: '://read.douban.com/column/\\d+/',
            chapterUrl: '://read.douban.com/reader/column/\\d+/chapter/\\d+/',
            title: '.title[itemprop="name"]',
            writer: '.name[itemprop="name"]',
            intro: '.intro',
            cover: () => $('[property="og:image"]').attr('content'),
            getChapters: async (doc) => {
                const id = window.location.href.split('/')[4];
                const chapters = [];
                while (true) {
                    const res = await xhr.sync(`https://read.douban.com/j/column_v2/${id}/chapters?start=0&limit=100&latestFirst=0`);
                    const json = JSON.parse(res.responseText);
                    for (const item of json.list) {
                        chapters.push({
                            title: item.title,
                            url: `${window.location.origin}${item.links.reader}`,
                            vip: !item.isPurchased && item.price,
                        });
                    }
                    if (chapters.length >= json.total) break;
                }
                return chapters;
            },
            fns: {
                cookieGet(e) {
                    const t = document.cookie.match(new RegExp(`(?:\\s|^)${e}\\=([^;]*)`));
                    return t ? decodeURIComponent(t[1]) : null;
                },
                decrypt: async function test(t) {
                    const { cookieGet } = Rule.special.find((i) => i.siteName === '豆瓣阅读').fns;
                    const e = Uint8Array.from(window.atob(t), (t) => t.charCodeAt(0));
                    const i = e.buffer;
                    const d = e.length - 16 - 13;
                    const p = new Uint8Array(i, d, 16);
                    const f = new Uint8Array(i, 0, d);
                    const g = {
                        name: 'AES-CBC',
                        iv: p,
                    };
                    return (function () {
                        const t = unsafeWindow.Ark.user;
                        const e = t.isAnonymous ? cookieGet('bid') : t.id;
                        const i = (new TextEncoder()).encode(e);
                        return window.crypto.subtle.digest('SHA-256', i).then((t) => window.crypto.subtle.importKey('raw', t, 'AES-CBC', !0, ['decrypt']));
                    }()).then((t) => window.crypto.subtle.decrypt(g, t, f)).then((t) => JSON.parse((new TextDecoder()).decode(t)));
                },

            },
            deal: async (chapter) => {
                const aid = chapter.url.match('read.douban.com/reader/column') ? chapter.url.split('/')[7] : chapter.url.split('/')[5];
                let content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.origin}/j/article_v2/get_reader_data`,
                        method: 'POST',
                        data: `aid=${aid}&reader_data_version=${window.localStorage.getItem('readerDataVersion')}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                resolve(json.data);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                if (content) {
                    const json = await Rule.special.find((i) => i.siteName === '豆瓣阅读').fns.decrypt(content);
                    content = {
                        content: chapter.url.match('read.douban.com/reader/column') ? json.posts[0].contents.filter((i) => i.data && i.data.text).map((i) => i.data.text).flat().map((i) => i.content)
                            .join('\n') : json.posts[0].contents.filter((i) => i.data && i.data.text).map((i) => (i.type === 'headline' ? '\n' : '') + i.data.text).join('\n'),
                        title: json.posts[0].title,
                    };
                }
                return content;
            },
        }
// @rule-end
)
