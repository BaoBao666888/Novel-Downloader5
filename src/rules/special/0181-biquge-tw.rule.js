// @rule-name: 笔趣阁TW
// @rule-source: special
(
// @rule-begin
        { // https://www.biquge.tw
            siteName: '笔趣阁TW',
            filter: () => {
                if (window.location.host !== 'www.biquge.tw') return 0;
                if (document.querySelector('a.chapterlist, div.intro > p')) return 1;
                if (document.querySelector('#chaptercontent')) return 2;
                return 0;
            },
            title: 'h1',
            writer: (doc) => $('h2 > span > a', doc).first().text().trim() || '未知',
            intro: 'div.intro > p',
            cover: 'div.cover > img',
            chapterTitle: 'h1',
            getChapters: async () => {
                const helpers = Rule.helpers;
                const chapterListLink = document.querySelector('a.chapterlist');
                if (!chapterListLink) return [];
                const listUrl = helpers.absoluteUrl(chapterListLink.getAttribute('href'), location.href);
                const doc = await helpers.requestDoc(listUrl);
                return helpers.mapChapters('div.booklist ul > li > a', doc, listUrl);
            },
            deal: async (chapter) => {
                const helpers = Rule.helpers;
                const visited = new Set();
                const parts = [];
                let title = chapter.title || '';
                let pageUrl = chapter.url;
                const baseMatch = pageUrl.match(/\/([^/_.]+)(?:_\d+)?\.html(?:$|[?#])/);
                const baseId = baseMatch && baseMatch[1];
                for (let i = 0; pageUrl && !visited.has(pageUrl) && i < 20; i++) {
                    visited.add(pageUrl);
                    const doc = await helpers.requestDoc(pageUrl);
                    const $doc = $(doc);
                    if (!title) title = $doc.find('h1').first().text().trim();
                    const html = ($doc.find('#chaptercontent').first().html() || '').trim();
                    if (html) parts.push(html);
                    const next = $doc.find('div.read-page > a:last-of-type')
                        .filter((idx, el) => $(el).text().trim() === '下一页')
                        .first()
                        .attr('href');
                    const indexHref = $doc.find('div.read-page > a[rel="index"]').attr('href');
                    const nextUrl = next ? helpers.absoluteUrl(next, pageUrl) : '';
                    const indexUrl = indexHref ? helpers.absoluteUrl(indexHref, pageUrl) : '';
                    pageUrl = baseId && nextUrl && nextUrl !== indexUrl && nextUrl.includes('_') ? nextUrl : '';
                }
                return {
                    title,
                    content: parts.join('<br />'),
                };
            },
            thread: 1,
        }
// @rule-end
)
