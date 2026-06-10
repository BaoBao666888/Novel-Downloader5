// @rule-name: 思念文学
// @rule-source: special
(
// @rule-begin
        { // http://www.2wxsi.com/book/114710/
            siteName: '思念文学',
            filter: () => {
                if (!/^www\.2wxsi\.com$/.test(window.location.host)) return 0;
                if (/^\/book\/\d+\/(?:index_\d+\.html)?$/.test(window.location.pathname)) return 1;
                if (/^\/book\/\d+\/\d+(?:_\d+)?\.html$/.test(window.location.pathname)) return 2;
                return 0;
            },
            url: /:\/\/www\.2wxsi\.com\/book\/\d+\/(?:index_\d+\.html)?(?:[?#].*)?$/,
            chapterUrl: /:\/\/www\.2wxsi\.com\/book\/\d+\/\d+(?:_\d+)?\.html(?:[?#].*)?$/,
            infoPage: () => {
                const match = window.location.href.match(/^(https?:\/\/www\.2wxsi\.com\/book\/\d+\/)/);
                return match ? match[1] : '';
            },
            title: (doc) => $(doc).find('.detail-box .info h1').first().text().trim()
                || $(doc).find('meta[property="og:novel:book_name"]').attr('content')
                || $(doc).find('meta[property="og:title"]').attr('content')
                || '',
            writer: (doc) => {
                const metaAuthor = $(doc).find('meta[property="og:novel:author"]').attr('content');
                if (metaAuthor) return metaAuthor.trim();
                const authorLine = $(doc).find('.detail-box .info .fix p').filter((i, el) => /^作者[:：]/.test($(el).text().trim())).first().text();
                return authorLine.replace(/^作者[:：]\s*/, '').trim();
            },
            intro: (doc) => {
                const introText = $(doc).find('.detail-box .desc').first().text().trim()
                    || $(doc).find('.m-desc').first().text().replace(/^简介[:：]?/, '').trim()
                    || $(doc).find('meta[property="og:description"]').attr('content')
                    || '';
                return introText.replace(/\s+/g, ' ').trim();
            },
            cover: (doc) => $(doc).find('.detail-box .imgbox img').attr('src')
                || $(doc).find('meta[property="og:image"]').attr('content')
                || '',
            chapter: '.row-section .section-box:last .section-list a',
            chapterTitle: 'h1.title',
            content: '#content',
            elementRemove: 'script,style,iframe,.section-opt,.readinline,.adsbox,.appguide',
            chapterPrev: '.section-opt a:contains("上一章")',
            chapterNext: '.section-opt a:contains("下一章")',
            getChapters: async (doc) => {
                const bookRootMatch = window.location.href.match(/^(https?:\/\/www\.2wxsi\.com\/book\/\d+\/)/);
                const bookRoot = bookRootMatch ? bookRootMatch[1] : window.location.href;
                const parseHtml = (html) => new DOMParser().parseFromString(html || '', 'text/html');
                const normalizeUrl = (href, base = bookRoot) => {
                    try {
                        return new URL(href, base).href;
                    } catch (error) {
                        return '';
                    }
                };
                const requestDoc = async (url) => {
                    try {
                        const res = await xhr.sync(url, null, {
                            cache: false,
                            headers: {
                                Referer: window.location.href,
                            },
                        });
                        if (res && res.responseText
                            && !/<title>\s*Just a moment/i.test(res.responseText)
                            && /section-list|pageselect/.test(res.responseText)) {
                            return parseHtml(res.responseText);
                        }
                    } catch (error) {
                        console.warn('[2wxsi] XHR tải mục lục lỗi:', url, error);
                    }
                    try {
                        const res = await fetch(url, { credentials: 'include' });
                        const html = await res.text();
                        if (html && !/<title>\s*Just a moment/i.test(html)) return parseHtml(html);
                    } catch (error) {
                        console.warn('[2wxsi] fetch tải mục lục lỗi:', url, error);
                    }
                    return parseHtml('');
                };
                const collectChapters = (pageDoc, pageUrl) => {
                    const $doc = $(pageDoc);
                    let section = $doc.find('.row-section .layout-tit').filter((i, el) => /正文/.test($(el).text())).next('.section-box').first();
                    if (!section.length) section = $doc.find('.row-section .section-box').last();
                    return section.find('.section-list a[href]').toArray().map((el) => {
                        const url = normalizeUrl($(el).attr('href'), pageUrl);
                        return {
                            title: $(el).text().replace(/\s+/g, ' ').trim(),
                            url,
                        };
                    }).filter((item) => item.url && /\/book\/\d+\/\d+\.html(?:[?#].*)?$/.test(item.url));
                };

                let tocDoc = doc;
                let tocUrl = window.location.href;
                if (!$(tocDoc).find('select[name="pageselect"]').length) {
                    tocUrl = bookRoot;
                    tocDoc = await requestDoc(bookRoot);
                }

                let pageUrls = $(tocDoc).find('select[name="pageselect"] option[value]').toArray()
                    .map((el) => normalizeUrl($(el).attr('value'), tocUrl))
                    .filter(Boolean);
                if (!pageUrls.length) pageUrls = [tocUrl];

                const chapters = [];
                const seenChapters = new Set();
                const seenPages = new Set();
                for (const pageUrl of pageUrls) {
                    if (seenPages.has(pageUrl)) continue;
                    seenPages.add(pageUrl);
                    const pageDoc = pageUrl === window.location.href || pageUrl === tocUrl ? tocDoc : await requestDoc(pageUrl);
                    for (const chapter of collectChapters(pageDoc, pageUrl)) {
                        if (seenChapters.has(chapter.url)) continue;
                        seenChapters.add(chapter.url);
                        chapters.push(chapter);
                    }
                }
                return chapters;
            },
            deal: async (chapter) => {
                const parseHtml = (html) => new DOMParser().parseFromString(html || '', 'text/html');
                const normalizeUrl = (href, base) => {
                    try {
                        return new URL(href, base).href;
                    } catch (error) {
                        return '';
                    }
                };
                const requestDoc = async (url) => {
                    try {
                        const res = await xhr.sync(url, null, {
                            cache: false,
                            headers: {
                                Referer: chapter.url,
                            },
                        });
                        if (res && res.responseText
                            && !/<title>\s*Just a moment/i.test(res.responseText)
                            && /id=["']content["']/.test(res.responseText)) {
                            return parseHtml(res.responseText);
                        }
                    } catch (error) {
                        console.warn('[2wxsi] XHR tải chương lỗi:', url, error);
                    }
                    try {
                        const res = await fetch(url, { credentials: 'include' });
                        const html = await res.text();
                        if (html && !/<title>\s*Just a moment/i.test(html)) return parseHtml(html);
                    } catch (error) {
                        console.warn('[2wxsi] fetch tải chương lỗi:', url, error);
                    }
                    return parseHtml('');
                };
                const visited = new Set();
                const contentParts = [];
                let title = chapter.title || '';
                let pageUrl = chapter.url;

                for (let i = 0; pageUrl && !visited.has(pageUrl) && i < 10; i++) {
                    visited.add(pageUrl);
                    const pageDoc = await requestDoc(pageUrl);
                    const $doc = $(pageDoc);
                    if (!title) title = $doc.find('h1.title').first().text().replace(/\s+/g, ' ').trim();
                    const content = $doc.find('#content').first().clone();
                    content.find('script,style,iframe').remove();
                    let html = content.html() || '';
                    html = html
                        .replace(/^\s*(?:&nbsp;|\u3000|\s)*第[^<]{0,120}\(第\d+\/\d+页\)\s*(?:<br\s*\/?>\s*)*/i, '')
                        .replace(/（本章未完，请点击下一页继续阅读）/g, '')
                        .replace(/\s+$/g, '');
                    if (html.trim()) contentParts.push(html);
                    const nextPage = $doc.find('.section-opt a').filter((idx, el) => $(el).text().trim() === '下一页').first().attr('href');
                    pageUrl = nextPage ? normalizeUrl(nextPage, pageUrl) : '';
                }

                return {
                    title,
                    content: contentParts.join('<br />'),
                };
            },
            contentReplace: [
                [/^\s*第[^(\n]{0,120}\(第\d+\/\d+页\)\s*/gm, ''],
                [/（本章未完，请点击下一页继续阅读）/g, ''],
            ],
            thread: 1,
        }
// @rule-end
)
