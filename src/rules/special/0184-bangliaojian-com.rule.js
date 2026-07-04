// @rule-name: 读吧文学
// @rule-source: special
(
// @rule-begin
        { // https://m.bangliaojian.com
            siteName: '读吧文学',
            url: /:\/\/m\.bangliaojian\.com\/info_[^/]+\/?(?:[?#].*)?$/,
            chapterUrl: /:\/\/m\.bangliaojian\.com\/read_[^/]+\/[^/]+(?:_\d+)?\.html(?:[?#].*)?$/,
            charset: 'utf-8',
            filter: () => {
                if (window.location.host !== 'm.bangliaojian.com') return 0;
                if (document.querySelector('.info_chapters > ul.p2 > li > a, .catalog1 h1')) return 1;
                if (document.querySelector('#novelcontent')) return 2;
                return 0;
            },
            infoPage: () => {
                const match = window.location.pathname.match(/\/(?:info|read)_([^/]+)/);
                if (match) return `${window.location.origin}/info_${match[1]}/`;
                return window.location.href;
            },
            title: (doc) => {
                const metaTitle = $('meta[property="og:novel:book_name"], meta[property="og:title"]', doc).first().attr('content') || '';
                return (metaTitle || $('.catalog1 h1, .nav_name h1', doc).first().text()).replace(/^《|》$/g, '').trim();
            },
            writer: (doc) => {
                const metaAuthor = $('meta[property="og:novel:author"]', doc).attr('content') || '';
                if (metaAuthor) return metaAuthor.trim();
                return ($('.catalog1 .tab p.p1, .tab p.p1', doc).first().text() || '')
                    .replace(/^作者[:：]\s*/, '')
                    .trim();
            },
            intro: (doc) => {
                const metaIntro = $('meta[property="og:description"]', doc).attr('content') || '';
                if (metaIntro) return metaIntro.trim();
                const intro = $('.catalog .jj', doc).first().clone();
                if (!intro.length) return $('meta[name="description"]', doc).attr('content') || '';
                intro.find('.infolink, #listtj, script, style').remove();
                return intro.html() || '';
            },
            cover: (doc) => {
                const src = $('meta[property="og:image"]', doc).attr('content')
                    || $('.catalog1 .tu img, .tu img', doc).first().attr('src')
                    || '';
                return src ? Rule.helpers.absoluteUrl(src, window.location.origin).replace(/^http:\/\//i, 'https://') : '';
            },
            getChapters: async (doc) => {
                const helpers = Rule.helpers;
                const bookMatch = window.location.pathname.match(/\/(?:info|read)_([^/]+)/);
                const bookId = bookMatch && bookMatch[1];
                let infoDoc = doc;
                let infoUrl = window.location.href;
                if (!$('.info_chapters > ul.p2 > li > a[href*="/read_"]', infoDoc).length && bookId) {
                    infoUrl = `${window.location.origin}/info_${bookId}/`;
                    infoDoc = await helpers.requestDoc(infoUrl, {
                        cache: false,
                        headers: { Referer: window.location.href },
                    });
                }

                const links = $('.info_chapters > ul.p2:last-of-type > li > a[href*="/read_"]', infoDoc);
                const chapters = links.toArray().map((link) => ({
                    title: $(link).text().replace(/\s+/g, ' ').trim(),
                    url: helpers.absoluteUrl($(link).attr('href'), infoUrl),
                })).filter((chapter) => chapter.title && chapter.url);
                return helpers.uniqueBy(chapters, (chapter) => chapter.url);
            },
            chapterTitle: (doc) => {
                const title = $('#novelbody .nr_function > h1, .nr_function h1, h1', doc).first().text().trim();
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
                    if (!title) title = $doc.find('#novelbody .nr_function > h1, .nr_function h1, h1').first().text().trim();
                    title = title
                        .replace(/_\s*$/, '')
                        .replace(/\s*\(\s*\d+\s*\/\s*\d+\s*\)\s*$/, '')
                        .trim();

                    const content = $doc.find('#novelcontent').first().clone();
                    content.find('script, style, iframe, ins, p:contains("关闭小说畅读模式体验更好")').remove();
                    let html = content.html() || '';
                    html = html
                        .replace(/内容未完，下一页继续阅读/g, '')
                        .replace(/读吧文学/g, '')
                        .replace(/\uFEFF/g, '')
                        .trim();
                    if (html) parts.push(html);

                    const next = $doc.find('.page_chapter a.p4')
                        .filter((idx, el) => $(el).text().includes('下一'))
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
