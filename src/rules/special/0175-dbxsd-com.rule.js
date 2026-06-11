// @rule-name: 独步小说网
// @rule-source: special
(
// @rule-begin
        { // https://www.dbxsd.com/book/* -> https://www.dbxsz.com/book/*
            siteName: '独步小说网',
            filter: () => {
                if (!/^www\.dbxs[dz]\.com$/.test(window.location.host)) return 0;
                if (document.querySelector('#all-chapter > div.panel > div.panel-body > div.row > div.item > a')) return 1;
                if (document.querySelector('#cont-body')) return 2;
                return 0;
            },
            title: 'h1',
            writer: 'div.media-body > div.row > div > a',
            intro: 'div.book-detail',
            cover: (doc) => {
                const src = $('img.book-img-middel', doc).first().attr('src') || '';
                return src ? Rule.helpers.absoluteUrl(src, location.href) : '';
            },
            chapter: '#all-chapter > div.panel > div.panel-body > div.row > div.item > a',
            chapterTitle: 'h1',
            deal: async (chapter) => {
                const helpers = Rule.helpers;
                const visited = new Set();
                const parts = [];
                let title = chapter.title || '';
                let pageUrl = chapter.url;
                for (let i = 0; pageUrl && !visited.has(pageUrl) && i < 20; i++) {
                    visited.add(pageUrl);
                    const doc = await helpers.requestDoc(pageUrl);
                    const $doc = $(doc);
                    if (!title) title = $doc.find('h1').first().text().trim();
                    const content = $doc.find('#cont-body').first().clone();
                    content.find('script, div').remove();
                    const html = (content.html() || '').trim();
                    if (html) parts.push(html);
                    const next = $doc.find('#content > div.row > div.text-center > a:last-of-type')
                        .filter((idx, el) => $(el).text().includes('下一页'))
                        .first()
                        .attr('href');
                    const nextUrl = next ? helpers.absoluteUrl(next, pageUrl) : '';
                    pageUrl = nextUrl && nextUrl.includes('.html') ? nextUrl : '';
                }
                return {
                    title,
                    content: parts.join(''),
                };
            },
            thread: 1,
        }
// @rule-end
)
