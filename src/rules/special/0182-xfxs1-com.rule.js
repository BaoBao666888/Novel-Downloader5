// @rule-name: 先锋小说
// @rule-source: special
(
// @rule-begin
        { // https://www.xfxs1.com
            siteName: '先锋小说',
            filter: () => {
                if (window.location.host !== 'www.xfxs1.com') return 0;
                if (document.querySelector('a.chapterlist, div.booklist > ul > li > a')) return 1;
                if (document.querySelector('#chaptercontent')) return 2;
                return 0;
            },
            title: 'h1',
            writer: 'h2 > span > a',
            intro: 'div.intro',
            cover: 'div.cover > img',
            chapterTitle: 'h1',
            getChapters: async () => {
                const helpers = Rule.helpers;
                const chapterListLink = document.querySelector('a.chapterlist');
                if (!chapterListLink) return [];
                const chapterListUrl = helpers.absoluteUrl(chapterListLink.getAttribute('href'), location.href);
                const firstDoc = await helpers.requestDoc(chapterListUrl);
                const options = Array.from(firstDoc.querySelectorAll('#indexselect option'));
                const indexUrls = options.length
                    ? options.map((option) => helpers.absoluteUrl(option.getAttribute('value'), chapterListUrl))
                    : [chapterListUrl];
                const chapters = [];
                const seen = new Set();
                for (const indexUrl of indexUrls) {
                    if (!indexUrl || seen.has(indexUrl)) continue;
                    seen.add(indexUrl);
                    const doc = indexUrl === chapterListUrl ? firstDoc : await helpers.requestDoc(indexUrl);
                    chapters.push(...helpers.mapChapters('div.booklist > ul > li > a', doc, indexUrl));
                }
                return helpers.uniqueBy(chapters, (chapter) => chapter.url);
            },
            deal: async (chapter) => {
                const helpers = Rule.helpers;
                const visited = new Set();
                const fragments = [];
                let title = chapter.title || '';
                let pageUrl = chapter.url;
                for (let i = 0; pageUrl && !visited.has(pageUrl) && i < 20; i++) {
                    visited.add(pageUrl);
                    const doc = await helpers.requestDoc(pageUrl);
                    const $doc = $(doc);
                    if (!title) title = $doc.find('h1').first().text().trim();
                    const content = $doc.find('#chaptercontent').first().clone();
                    content.find('script, style').remove();
                    content.html((content.html() || '').replace(/本章未完，点击下一页继续阅读/g, ''));
                    const contentEl = content.get(0);
                    while (contentEl && contentEl.lastChild && contentEl.lastChild.nodeType === Node.ELEMENT_NODE && contentEl.lastChild.tagName === 'BR') {
                        contentEl.lastChild.remove();
                    }
                    const pageFragments = Array.from((contentEl && contentEl.childNodes) || [])
                        .map((node) => node.outerHTML || node.textContent || '')
                        .map((html) => html.replace(/(?:<br\s*\/?>|\s|&nbsp;)*$/ig, '').trim())
                        .filter(Boolean);
                    if (pageFragments.length) {
                        if (fragments.length) {
                            fragments[fragments.length - 1] += pageFragments.shift().replace(/^<p[^>]*>/i, '');
                        }
                        fragments.push(...pageFragments);
                    }
                    const next = $doc.find('a#next_url')
                        .filter((idx, el) => $(el).text().includes('一页'))
                        .first()
                        .attr('href');
                    const nextUrl = next ? helpers.absoluteUrl(next, pageUrl) : '';
                    pageUrl = nextUrl && nextUrl.includes('.html') ? nextUrl : '';
                }
                return {
                    title,
                    content: fragments.join('<br />'),
                };
            },
            thread: 1,
        }
// @rule-end
)
