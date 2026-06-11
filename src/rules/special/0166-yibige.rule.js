// @rule-name: 一笔阁
// @rule-source: special
(
// @rule-begin
        { // https://www.yibige.cc -> https://www.yibige.org
            siteName: '一笔阁',
            url: '://www\\.yibige\\.(?:cc|org)/[^/]+/$',
            chapterUrl: '://www\\.yibige\\.(?:cc|org)/[^/]+/[^/]+(?:_\\d+)?\\.html',
            filter: () => {
                if (!/^www\.yibige\.(cc|org)$/.test(window.location.host)) return 0;
                if (document.querySelector('#info h1, #list dd > a')) return 1;
                if (document.querySelector('#content')) return 2;
                return 0;
            },
            title: '#info h1:nth-of-type(1)',
            writer: (doc) => $('#info > p:nth-child(2)', doc).first().text().replace(/作(\s+)?者[：:]/, '').trim(),
            intro: '#intro > p:nth-child(1)',
            cover: '#fmimg > img',
            chapterTitle: '.bookname h1, h1',
            getChapters: async () => {
                const helpers = Rule.helpers;
                const indexUrl = location.href.replace(/\/?$/, '/') + 'index.html';
                const doc = await helpers.requestDoc(indexUrl);
                return Array.from(doc.querySelectorAll('#list dd > a[href]')).map((link) => ({
                    title: link.textContent.trim(),
                    url: helpers.absoluteUrl(link.getAttribute('href'), indexUrl),
                }));
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
                    if (!title) title = $doc.find('.bookname h1, h1').first().text().trim();
                    const content = $doc.find('#content').first().clone();
                    content.find('script, div[style]').remove();
                    const html = (content.html() || '').trim();
                    if (html) parts.push(html);
                    const next = $doc.find('.bottem1 > a:nth-child(4)').attr('href');
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
