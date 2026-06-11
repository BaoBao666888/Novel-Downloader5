// @rule-name: ZGZL
// @rule-source: special
(
// @rule-begin
        { // https://www.zgzl.net
            siteName: 'ZGZL',
            filter: () => {
                if (window.location.host !== 'www.zgzl.net') return 0;
                if (document.querySelector('#list > dl > dd > a')) return 1;
                if (document.querySelector('#content')) return 2;
                return 0;
            },
            title: '#info > h1',
            writer: (doc) => $('#info > p:first-of-type', doc).first().text().replace(/^作\s*者\s*[：:]\s*/u, '').trim() || '未知',
            intro: '#intro > p',
            cover: '#fmimg > img',
            chapterTitle: '.bookname h1, h1',
            getChapters: () => {
                const helpers = Rule.helpers;
                const chapters = [];
                const secondDt = document.querySelector('#list > dl > dt:nth-of-type(2)');
                let current = secondDt && secondDt.nextElementSibling;
                if (document.querySelectorAll('#list > dl > dt > b').length && current) {
                    while (current && current.tagName.toLowerCase() === 'dd') {
                        const link = current.querySelector('a[href]');
                        if (link) {
                            chapters.push({
                                title: link.textContent.trim(),
                                url: helpers.absoluteUrl(link.getAttribute('href'), location.href),
                            });
                        }
                        current = current.nextElementSibling;
                    }
                    return chapters;
                }
                return helpers.mapChapters('#list > dl > dd > a');
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
                    content.find('script, style').remove();
                    const paragraphs = (content.html() || '')
                        .split(/<br\s*\/?>/i)
                        .map((line) => line.replace(/&nbsp;/g, ' ').trim())
                        .filter((line) => line && !/内容未完.*|本章阅读完毕.*/.test(line));
                    if (paragraphs.length) parts.push(paragraphs.map((line) => `<p>${line}</p>`).join(''));
                    const next = $doc.find('div.bottem1 > a:last-of-type').attr('href');
                    const nextUrl = next ? helpers.absoluteUrl(next, pageUrl) : '';
                    pageUrl = baseId && nextUrl.includes(baseId) && !nextUrl.includes('info_') ? nextUrl : '';
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
