// @rule-name: 无限小说网
// @rule-source: special
(
// @rule-begin
        { // https://m.niupizhi.net
            siteName: '无限小说网',
            url: '://m\\.niupizhi\\.net/\\d+/\\d+/$',
            chapterUrl: '://m\\.niupizhi\\.net/\\d+/\\d+/\\d+(?:_\\d+)?\\.html',
            filter: () => {
                if (window.location.host !== 'm.niupizhi.net') return 0;
                if (document.querySelector('div.info_chapters > ul.p2:last-of-type > li > a')) return 1;
                if (document.querySelector('#novelcontent')) return 2;
                return 0;
            },
            title: 'h1',
            writer: (doc) => $('div.tab > p.p1', doc).first().text().replace(/^作者：?/, '').trim(),
            intro: (doc) => $('meta[property="og:description"]', doc).attr('content') || '',
            cover: 'div.tu > img',
            chapter: 'div.info_chapters > ul.p2:last-of-type > li > a',
            chapterTitle: '#novelcontent',
            deal: async (chapter) => {
                const helpers = Rule.helpers;
                const visited = new Set();
                const parts = [];
                let title = chapter.title || '';
                let pageUrl = chapter.url;
                const baseMatch = pageUrl.match(/\/(\d+)(?:_\d+)?\.html(?:$|[?#])/);
                const baseId = baseMatch && baseMatch[1];
                const decodeContent = (doc) => {
                    const scriptText = Array.from(doc.scripts)
                        .map((script) => script.textContent || '')
                        .find((text) => /var\s+content\s*=\s*new\s+Array\s*\(/.test(text)) || '';
                    const match = scriptText.match(/var\s+content\s*=\s*new\s+Array\s*\(([\s\S]*?)\)\s*;\s*getread\s*\(/);
                    if (!match) return '';
                    try {
                        const encoded = JSON.parse(`[${match[1]}]`).join('');
                        const binary = atob(encoded);
                        if (typeof TextDecoder !== 'undefined') {
                            const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
                            return new TextDecoder('utf-8').decode(bytes);
                        }
                        return decodeURIComponent(escape(binary));
                    } catch (err) {
                        console.error(err);
                        return '';
                    }
                };
                for (let i = 0; pageUrl && !visited.has(pageUrl) && i < 20; i++) {
                    visited.add(pageUrl);
                    const doc = await helpers.requestDoc(pageUrl);
                    const $doc = $(doc);
                    if (!title) title = $doc.find('#novelcontent').prevAll('h1').first().text().trim();
                    const content = $('<div></div>').html(decodeContent(doc) || $doc.find('#novelcontent').first().html() || '');
                    content.find('script, style, p').remove();
                    let html = content.html() || '';
                    html = html
                        .replace(/内容未完，下一页继续阅读/g, '')
                        .replace(/【本章阅读完毕，更多请搜索[\s\S]*?阅读更多精彩小说】/g, '')
                        .replace(/无限小说网|笔趣阁/g, '')
                        .trim();
                    if (html && !/内容加载中，请稍后/.test(content.text())) parts.push(html);
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
