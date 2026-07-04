// @rule-name: 文阅小说
// @rule-source: special
(
// @rule-begin
        { // https://m.chinataye.com
            siteName: '文阅小说',
            url: /:\/\/m\.chinataye\.com\/info_[^/]+\/?(?:dir\.html)?(?:[?#].*)?$/,
            chapterUrl: /:\/\/m\.chinataye\.com\/read_[^/]+\/[^/]+(?:_\d+)?\.html(?:[?#].*)?$/,
            charset: 'utf-8',
            filter: () => {
                if (window.location.host !== 'm.chinataye.com') return 0;
                if (document.querySelector('#lists a[href*="/read_"], .frame.fm h1')) return 1;
                if (document.querySelector('.rdtext')) return 2;
                return 0;
            },
            infoPage: () => {
                const match = window.location.pathname.match(/\/(?:info|read)_([^/]+)/);
                if (match) return `${window.location.origin}/info_${match[1]}/`;
                return window.location.href;
            },
            title: (doc) => {
                const title = $('.frame.fm h1, .mulu h1', doc).first().text().trim();
                if (title) return title.replace(/^《|》$/g, '').trim();
                return (($('title', doc).text().match(/^([^_]+)/) || [])[1] || '').replace(/^《|》$/g, '').trim();
            },
            writer: (doc) => {
                const authorLine = $('.frame.fm .rt5 p', doc).toArray()
                    .map((node) => $(node).text().trim())
                    .find((text) => /^作者[:：]/.test(text));
                if (authorLine) return authorLine.replace(/^作者[:：]\s*/, '').trim();
                return (($('title', doc).text().match(/_([^_]+)作品_/) || [])[1] || '').trim();
            },
            intro: (doc) => {
                const intro = $('#_intro', doc).first().clone();
                if (intro.length) {
                    intro.find('script, style').remove();
                    return intro.html() || '';
                }
                return $('meta[name="description"]', doc).attr('content') || '';
            },
            cover: (doc) => {
                const src = $('.frame.fm .lf2 img, div.tu img', doc).first().attr('src') || '';
                return src ? Rule.helpers.absoluteUrl(src, window.location.origin) : '';
            },
            getChapters: async (doc) => {
                const helpers = Rule.helpers;
                const bookMatch = window.location.pathname.match(/\/(?:info|read)_([^/]+)/);
                const bookId = bookMatch && bookMatch[1];
                let dirDoc = doc;
                let dirUrl = window.location.href;
                if (!$('#lists a[href*="/read_"]', dirDoc).length && bookId) {
                    dirUrl = `${window.location.origin}/info_${bookId}/dir.html`;
                    dirDoc = await helpers.requestDoc(dirUrl, {
                        cache: false,
                        headers: { Referer: window.location.href },
                    });
                }
                const chapters = $('#lists a[href*="/read_"]', dirDoc).toArray().map((link) => {
                    const title = ($(link).find('.order').text() || $(link).text()).replace(/\s+/g, ' ').trim();
                    return {
                        title,
                        url: helpers.absoluteUrl($(link).attr('href'), dirUrl),
                    };
                }).filter((chapter) => chapter.title && chapter.url);
                return helpers.uniqueBy(chapters, (chapter) => chapter.url);
            },
            chapterTitle: (doc) => {
                const title = $('.rdtit h1, .ttop h1', doc).first().text().trim();
                return title
                    .replace(/_\s*$/, '')
                    .replace(/\s*\(\s*\d+\s*\/\s*\d+\s*\)\s*$/, '')
                    .trim();
            },
            deal: async (chapter) => {
                const helpers = Rule.helpers;
                const visited = new Set();
                const parts = [];
                let title = chapter.title || '';
                let pageUrl = chapter.url;
                const baseMatch = pageUrl.match(/\/([^/_.]+)(?:_\d+)?\.html(?:$|[?#])/);
                const baseId = baseMatch && baseMatch[1];

                for (let i = 0; pageUrl && !visited.has(pageUrl) && i < 30; i++) {
                    visited.add(pageUrl);
                    const doc = await helpers.requestDoc(pageUrl, {
                        cache: false,
                        headers: { Referer: pageUrl },
                    });
                    const $doc = $(doc);
                    if (!title) title = $doc.find('.rdtit h1, .ttop h1').first().text().trim();
                    title = title
                        .replace(/_\s*$/, '')
                        .replace(/\s*\(\s*\d+\s*\/\s*\d+\s*\)\s*$/, '')
                        .trim();

                    const content = $doc.find('.rdtext').first().clone();
                    content.find('script, style, iframe, ins').remove();
                    let html = content.html() || '';
                    html = html
                        .replace(/内容未完，下一页继续阅读/g, '')
                        .replace(/文阅小说/g, '')
                        .replace(/\uFEFF/g, '')
                        .trim();
                    if (html) parts.push(html);

                    const next = $doc.find('#zhangjieinfo a.next, .rdbom a.next')
                        .filter((idx, el) => $(el).text().includes('下一章'))
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
