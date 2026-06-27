// @rule-name: 69书吧
// @rule-source: special
(
    // @rule-begin
        {
            siteName: '69shuba',
            url: /69shuba\.(?:cx|com)\/book\/\d+(?:\.htm|\/)?(?:[?#].*)?$/,
            chapterUrl: /69shuba\.(?:cx|com)\/txt\/\d+\/\d+(?:\.html?)?(?:[?#].*)?$/,
            charset: 'gbk',
            infoPage: () => {
                const match = window.location.pathname.match(/\/(?:book|txt)\/(\d+)/);
                return match ? `https://www.69shuba.com/book/${match[1]}.htm` : window.location.href;
            },
            cover: 'div.bookimg2 img, .bookimg img, .bookcover img',
            title: '.booknav2 > h1 > a, .booknav2 h1, h1 a[href*="/book/"], h1',
            writer: '.booknav2 p:nth-of-type(1) a, .booknav2 a[href*="/author"], a[href*="/zuozhe"], a[href*="/author"]',
            intro: 'div.navtxt, #intro, .intro, .bookintro',
            chapter: 'a[href*="/txt/"]',
            deal: async (chapter) => {
                const rule = Rule.special.find(i => i.siteName === '69shuba');
                const parseChapter = async (res) => {
                    const doc = Rule.helpers.parseHtml(res.responseText || res.response || '');
                    const title = rule.chapterTitle(doc) || chapter.title;
                    if (rule.contentCheck && !rule.contentCheck(doc, res, { raw: chapter })) {
                        throw new Error('69shuba direct reader không trả về nội dung chương hợp lệ');
                    }
                    const content = await rule.content(doc, res, { raw: chapter });
                    if (!content || !String(content).trim()) throw new Error('69shuba reader không trả về nội dung chương');
                    return { title, content };
                };

                try {
                    const res = await xhr.sync(chapter.url, null, {
                        method: 'GET',
                        responseType: 'text',
                        overrideMimeType: 'text/html; charset=gbk',
                        headers: { Referer: chapter.url },
                        timeout: Config.timeout
                    });
                    return await parseChapter(res);
                } catch (directError) {
                    console.warn('[69shuba] Tải trực tiếp thất bại, thử fallback r.jina.ai:', chapter.url, directError);
                    const readerUrl = `https://r.jina.ai/http://${chapter.url}`;
                    const res = await xhr.sync(readerUrl, null, {
                        method: 'GET',
                        responseType: 'text',
                        overrideMimeType: 'text/html; charset=UTF-8',
                        headers: { 'X-Respond-With': 'html' },
                        timeout: Config.timeout
                    });
                    return await parseChapter(res);
                }
            },
            getChapters: async (doc) => {
                const currentChapter = window.location.href.match(/69shuba\.(?:cx|com)\/txt\/\d+\/\d+/);
                if (currentChapter) {
                    const title = $('.txtnav h1.hide720, .txtnav h1, h1.hide720, h1', doc).first().text().trim();
                    return [{ title, url: window.location.href }];
                }
                const chapters = Rule.helpers.mapChapters('a[href*="/txt/"]', doc)
                    .filter(chapter => /69shuba\.(?:cx|com)\/txt\/\d+\/\d+(?:\.html?)?(?:[?#].*)?$/.test(chapter.url));
                return Rule.helpers.uniqueBy(chapters, chapter => chapter.url);
            },
            chapterTitle: (doc) => $('.txtnav h1.hide720, .txtnav h1, h1.hide720, h1', doc).first().text().trim(),
            contentCheck: (doc, res, request) => {
                const title = (doc && doc.title || '').trim();
                const bodyText = $('body', doc).text().replace(/\s+/g, ' ').trim();
                const requestTitle = (request && request.raw && request.raw.title || '').replace(/\s+/g, ' ').trim();
                const bodyCompact = bodyText.replace(/\s+/g, '');
                const requestTitleCompact = requestTitle.replace(/\s+/g, '');
                if (/Just a moment|Enable JavaScript and cookies|403 Forbidden|Access denied|cf-error/i.test(`${title} ${bodyText}`) || $('#challenge-error-text', doc).length) {
                    console.error('[69shuba] Cloudflare challenge khi tải chương:', request && request.raw && request.raw.url);
                    return false;
                }
                const hasContent = $('.txtnav, #content, .content, .read-content, article', doc).length > 0
                    || (bodyText.length > 600 && (!requestTitleCompact || bodyCompact.includes(requestTitleCompact)) && /第\s*\d+\s*章/.test(bodyText));
                if (!hasContent) {
                    console.error('[69shuba] Không tìm thấy nội dung chương:', request && request.raw && request.raw.url, title, bodyText.slice(0, 160));
                }
                return hasContent;
            },
            content: (doc, res, request) => {
                let content = $('.txtnav, #content, .content, .read-content, article', doc).first().clone();
                if (!content.length) {
                    content = $('body', doc).first().clone();
                    const title = $('.txtnav h1.hide720, .txtnav h1, h1.hide720, h1', doc).first().text().trim()
                        || (request && request.raw && request.raw.title || '').trim();
                    const lines = content.text().split(/\n+/).map(line => line.trim()).filter(Boolean);
                    const titleIndex = title ? lines.findIndex(line => line.includes(title)) : -1;
                    const chapterLines = (titleIndex >= 0 ? lines.slice(titleIndex + 1) : lines)
                        .filter(line => !/上一章|下一章|返回目录|加入书签|推荐阅读|最新网址|69书吧|六九书吧|书架|报错|评论|目录/.test(line));
                    return chapterLines.join('\n').trim();
                }
                content.find('h1.hide720, h1, .txtinfo, #txtright, .bottom-ad, .page1, script, style, iframe, ins').remove();
                content.find('br').replaceWith('\n');
                return (content.html() || '')
                    .replace(/最[⊥\s]*新[⊥\s]*小[⊥\s]*说[⊥\s]*在[⊥\s]*六[⊥\s]*9[⊥\s]*书[⊥\s]*吧[⊥\s]*首[⊥\s]*发[!！]?/g, '')
                    .replace(/\uFEFF/g, '')
                    .trim();
            },
            elementRemove: 'script,style,iframe,ins',
            chapterPrev: '.page1 a:contains("上一章")',
            chapterNext: '.page1 a:contains("下一章")'
        }
    // @rule-end
)
