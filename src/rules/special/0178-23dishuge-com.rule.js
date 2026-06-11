// @rule-name: 帝书阁
// @rule-source: special
(
// @rule-begin
        { // https://www.23dishuge.com/*/*/
            siteName: '帝书阁',
            filter: () => {
                if (window.location.host !== 'www.23dishuge.com') return 0;
                if (document.querySelector('#list > dl > dt:last-of-type ~ a')) return 1;
                if (document.querySelector('#booktxt')) return 2;
                return 0;
            },
            title: '#info h1',
            writer: (doc) => $('#info > p', doc).first().text().replace(/^作\s*者\s*[：:]\s*/u, '').trim(),
            intro: '#intro',
            cover: '#fmimg img',
            chapter: '#list > dl > dt:last-of-type ~ a',
            chapterTitle: 'h1, .bookname h1',
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
                    if (!title) title = $doc.find('h1, .bookname h1').first().text().trim();
                    const content = $doc.find('#booktxt').first().clone();
                    content.find('script, style').remove();
                    let html = (content.html() || '')
                        .replace(/本章阅读完毕/g, '')
                        .replace(/(?:<br\s*\/?>|\s|&nbsp;)*$/ig, '')
                        .trim();
                    if (html) parts.push(html);
                    const next = $doc.find('div.bottem1 > a[rel="next"]')
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
