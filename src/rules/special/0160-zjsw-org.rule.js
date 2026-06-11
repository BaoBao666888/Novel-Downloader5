// @rule-name: 爪机书屋
// @rule-source: special
(
// @rule-begin
        { // https://www.zjsw.org
            siteName: '爪机书屋',
            url: '://www\\.zjsw\\.org/read/\\d+/$',
            chapterUrl: '://www\\.zjsw\\.org/read/\\d+/\\d+(?:_\\d+)?\\.html',
            filter: () => {
                if (window.location.host !== 'www.zjsw.org') return 0;
                if (document.querySelector('.link_14 dl dd > a')) return 1;
                if (document.querySelector('#content')) return 2;
                return 0;
            },
            title: (doc) => {
                const title = $('h1.f20h', doc).first().clone();
                title.find('em').remove();
                return title.text().trim();
            },
            writer: (doc) => $('h1.f20h em', doc).first().text().replace(/^作者[：:]/, '').trim(),
            intro: (doc) => {
                const intro = $('div.intro', doc).first().clone();
                intro.find('p.book_keywords, script').remove();
                return intro.text().trim();
            },
            cover: 'div.pic > img',
            chapter: '.link_14 dl dd > a',
            chapterTitle: '.kfyd > h2',
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
                    if (!title) title = $doc.find('.kfyd > h2').first().text().trim();
                    const content = $doc.find('#content').first().clone();
                    content.find('script, style').remove();
                    let html = content.html() || '';
                    html = html
                        .replace(/<p>\s*喜欢[^<]*?爪机书屋更新速度全网最快。?\s*<\/p>/g, '')
                        .replace(/喜欢[^<]*?爪机书屋更新速度全网最快。?/g, '')
                        .replace(/爪机书屋更新速度全网最快/g, '')
                        .trim();
                    if (html) parts.push(html);
                    const next = $doc.find('#thumb a')
                        .filter((idx, el) => $(el).text().trim() === '下一页')
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
