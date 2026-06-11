// @rule-name: 69书吧
// @rule-source: special
(
// @rule-begin
        { // https://www.69hsw.com https://www.69hao.com https://www.69hsz.net
            siteName: '69书吧',
            url: '://www\\.(?:69hsw\\.com|69hao\\.com|69hsz\\.net)/\\d+/$',
            chapterUrl: '://www\\.(?:69hsw\\.com|69hao\\.com|69hsz\\.net)/\\d+/\\d+(?:_\\d+)?\\.html',
            filter: () => {
                if (!['www.69hsw.com', 'www.69hao.com', 'www.69hsz.net'].includes(window.location.host)) return 0;
                if (document.querySelector('#info h1') && document.querySelector('#list > dl > dt:last-of-type ~ a')) return 1;
                if (document.querySelector('#booktxt')) return 2;
                return 0;
            },
            title: '#info h1',
            writer: (doc) => $('#info > p', doc).first().text().replace(/^作\s*者\s*[：:]?\s*/u, '').trim(),
            intro: '#intro',
            cover: (doc) => {
                const img = $('#fmimg img', doc).first();
                return img.attr('data-original') || img.attr('src') || '';
            },
            chapter: '#list > dl > dt:last-of-type ~ a',
            chapterTitle: 'h1, .bookname h1',
            content: '#booktxt',
            deal: async (chapter) => {
                const helpers = Rule.helpers;
                const visited = new Set();
                const parts = [];
                let title = chapter.title || '';
                let pageUrl = chapter.url;
                const baseMatch = pageUrl.match(/\/(\d+)(?:_\d+)?\.html(?:$|[?#])/);
                const baseId = baseMatch && baseMatch[1];
                for (let i = 0; pageUrl && !visited.has(pageUrl) && i < 10; i++) {
                    visited.add(pageUrl);
                    const doc = await helpers.requestDoc(pageUrl);
                    const $doc = $(doc);
                    if (!title) title = $doc.find('h1, .bookname h1').first().text().trim();
                    const content = $doc.find('#booktxt').first().clone();
                    content.find('script, style').remove();
                    let html = content.html() || '';
                    html = html
                        .replace(/本章阅读完毕.*/g, '')
                        .replace(/本章未完.*下一页继续阅读/g, '')
                        .trim();
                    if (html) parts.push(html);
                    const next = $doc.find('div.bottem1 > a[rel=next]').filter((idx, el) => $(el).text().includes('下一页')).first().attr('href');
                    const nextUrl = next ? helpers.absoluteUrl(next, pageUrl) : '';
                    pageUrl = baseId && new RegExp(`/${baseId}_\\d+\\.html(?:$|[?#])`).test(nextUrl) ? nextUrl : '';
                }
                return {
                    title,
                    content: parts.join('<br />'),
                };
            },
            thread: 2,
        }
// @rule-end
)
