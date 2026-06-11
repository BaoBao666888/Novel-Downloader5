// @rule-name: Fly Dreams
// @rule-source: special
(
// @rule-begin
        { // https://m.fly-dreams.com
            siteName: 'Fly Dreams',
            filter: () => {
                if (window.location.host !== 'm.fly-dreams.com') return 0;
                if (document.querySelector('div.info_chapters > ul.p2:last-of-type > li > a')) return 1;
                if (document.querySelector('#novelcontent')) return 2;
                return 0;
            },
            title: 'h1',
            writer: 'div.tab > p.p1',
            intro: (doc) => $('meta[property="og:description"]', doc).attr('content') || '',
            cover: 'div.tu > img',
            chapter: 'div.info_chapters > ul.p2:last-of-type > li > a',
            chapterTitle: 'h1, #novelcontent',
            deal: async (chapter) => {
                const helpers = Rule.helpers;
                const visited = new Set();
                const parts = [];
                let title = chapter.title || '';
                let pageUrl = chapter.url;
                const baseMatch = pageUrl.match(/\/(\d+)(?:_\d+)?\.html(?:$|[?#])/);
                const baseId = baseMatch && baseMatch[1];
                for (let i = 0; pageUrl && !visited.has(pageUrl) && i < 20; i++) {
                    visited.add(pageUrl);
                    const doc = await helpers.requestDoc(pageUrl);
                    const $doc = $(doc);
                    if (!title) title = $doc.find('h1, #novelcontent').first().text().trim();
                    const content = $doc.find('#novelcontent').first().clone();
                    content.find('p').remove();
                    let html = (content.html() || '')
                        .replace(/内容未完，下一页继续阅读/g, '')
                        .replace(/fly-dreams/ig, '')
                        .trim();
                    if (html) parts.push(html);
                    const next = $doc.find('div.page_chapter > ul > li:last-of-type > a')
                        .filter((idx, el) => $(el).text().includes('下一页'))
                        .first()
                        .attr('href');
                    const nextUrl = next ? helpers.absoluteUrl(next, pageUrl) : '';
                    pageUrl = baseId && new RegExp(`/${baseId}_\\d+\\.html(?:$|[?#])`).test(nextUrl) ? nextUrl : '';
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
