// @rule-name: 海外书包
// @rule-source: special
(
// @rule-begin
        { // https://www.haiwaishubao1.com
            siteName: '海外书包',
            url: '://www\\.haiwaishubao1\\.com/book/\\d+/$',
            chapterUrl: '://www\\.haiwaishubao1\\.com/book/\\d+/\\d+(?:_\\d+)?\\.html',
            filter: () => {
                if (window.location.host !== 'www.haiwaishubao1.com') return 0;
                if (document.querySelector('.BGsectionOne-top-right, #list a[href*="/book/"]')) return 1;
                if (document.querySelector('#content')) return 2;
                return 0;
            },
            title: (doc) => $('meta[property="og:title"]', doc).attr('content') || $('h1.book', doc).text().trim(),
            writer: (doc) => $('meta[property="og:novel:author"]', doc).attr('content') || $('.BGsectionOne-top-right > p.author a', doc).first().text().trim(),
            intro: (doc) => $('meta[property="og:description"]', doc).attr('content') || $('#intro .BGsectionTwo-bottom', doc).text().trim(),
            cover: '.BGsectionOne-top-left > img',
            chapter: '#list a[href*="/book/"]',
            chapterTitle: '#chapterTitle',
            getChapters: async (doc) => {
                const helpers = Rule.helpers;
                const indexLink = doc.querySelector('a[href^="/index/"]');
                if (!indexLink) return [];
                const firstIndexUrl = helpers.absoluteUrl(indexLink.getAttribute('href'), location.href);
                const firstIndexDoc = await helpers.requestDoc(firstIndexUrl);
                const indexUrls = Array.from(firstIndexDoc.querySelectorAll('#indexselect option'))
                    .map((option) => helpers.absoluteUrl(option.getAttribute('value'), firstIndexUrl));
                if (!indexUrls.length) indexUrls.push(firstIndexUrl);
                const seenIndex = new Set();
                const chapters = [];
                for (const indexUrl of indexUrls) {
                    if (!indexUrl || seenIndex.has(indexUrl)) continue;
                    seenIndex.add(indexUrl);
                    const indexDoc = indexUrl === firstIndexUrl ? firstIndexDoc : await helpers.requestDoc(indexUrl);
                    indexDoc.querySelectorAll('li.BCsectionTwo-top-chapter > a[href*="/book/"]').forEach((link) => {
                        chapters.push({
                            title: link.textContent.trim(),
                            url: helpers.absoluteUrl(link.getAttribute('href'), indexUrl),
                        });
                    });
                }
                return chapters;
            },
            deal: async (chapter) => {
                const helpers = Rule.helpers;
                const visited = new Set();
                const pages = [];
                let title = chapter.title || '';
                let pageUrl = chapter.url;
                const baseMatch = pageUrl.match(/\/(\d+)(?:_\d+)?\.html(?:$|[?#])/);
                const baseId = baseMatch && baseMatch[1];
                for (let i = 0; pageUrl && !visited.has(pageUrl) && i < 20; i++) {
                    visited.add(pageUrl);
                    const doc = await helpers.requestDoc(pageUrl);
                    const $doc = $(doc);
                    if (!title) title = $doc.find('#chapterTitle').first().text().trim().replace(/（\d+\s*\/\s*\d+）$/, '');
                    const content = $doc.find('#content').first().clone();
                    content.find('script, style').remove();
                    pages.push(Array.from(content.children()).map((node) => node.outerHTML || node.textContent || ''));
                    const next = $doc.find('section.RBGsectionTwo li.RBGsectionTwo-right a, section.RBGsectionFour li.RBGsectionTwo-right a')
                        .filter((idx, el) => $(el).text().includes('下一页'))
                        .first()
                        .attr('href');
                    const nextUrl = next ? helpers.absoluteUrl(next, pageUrl) : '';
                    pageUrl = baseId && new RegExp(`/${baseId}_\\d+\\.html(?:$|[?#])`).test(nextUrl) ? nextUrl : '';
                }
                const merged = [];
                pages.forEach((paragraphs, pageIndex) => {
                    paragraphs.forEach((html, paragraphIndex) => {
                        if (pageIndex > 0 && paragraphIndex === 0 && merged.length) {
                            merged[merged.length - 1] = merged[merged.length - 1].replace(/<\/p>\s*$/i, '') + html.replace(/^<p[^>]*>/i, '');
                        } else {
                            merged.push(html);
                        }
                    });
                });
                return {
                    title,
                    content: merged.join(''),
                };
            },
            thread: 1,
        }
// @rule-end
)
