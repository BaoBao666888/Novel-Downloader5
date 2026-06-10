// @rule-name: 起点中文网
// @rule-source: special
(
// @rule-begin
        // 正版
        { // https://www.qidian.com https://www.hongxiu.com https://www.readnovel.com https://www.xs8.cn
            siteName: '起点中文网',
            filter: () => {
                const href = window.location.href;
                if (href.match(/(qidian.com|hongxiu.com|readnovel.com|xs8.cn)\/(info|book)\/\d+/)) return 1;
                if (href.match(/(qidian.com|hongxiu.com|readnovel.com|xs8.cn)\/chapter/)) return 2;
                return 0;
            },
            url: /(qidian.com|hongxiu.com|readnovel.com|xs8.cn)\/(info|book)\/\d+/,
            chapterUrl: /(qidian.com|hongxiu.com|readnovel.com|xs8.cn)\/chapter/,
            title: (doc) => $('#bookName, .book-info > h1 > em, h1#bookName', doc).first().text().trim(),
            writer: (doc) => $('.author, a.writer-name, .book-info .writer, .book-info > h1 > span', doc).first().text()
                .replace(/作\s+者[:：]?/, '')
                .replace(/\s+著$/, '')
                .trim(),
            intro: (doc) => {
                const normalizeCover = (rawCover = '') => {
                    if (!rawCover) return '';
                    return rawCover
                        .replace(/^\/\//, 'https://')
                        .replace(/\/\d+(?:\.\w+)?$/, '')
                        .replace(/-\d+(?:\.\w+)?$/, '');
                };
                const cover = normalizeCover($('#bookImg > img, .book-author img', doc).first().attr('src') || '');
                const attrText = $('.book-info p.book-attribute, .book-info-detail .tag, .book-information .flag', doc)
                    .toArray()
                    .map((el) => $(el).text().replace(/\s+/g, ' ').trim())
                    .filter(Boolean)
                    .join(' ');
                const introHtml = $('#book-intro-detail, .book-info-detail .book-intro, .intro-detail p#book-intro-detail', doc).first().html() || '';
                const introMain = introHtml
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<[^>]+>/g, '')
                    .replace(/\n{2,}/g, '\n')
                    .trim();
                const tags = $('#all-label > a, .intro-honor-label p.all-label a, .book-info > .tag > a, .tag-wrap > .tags', doc)
                    .toArray()
                    .map((el) => $(el).text().trim())
                    .filter(Boolean);
                return [
                    attrText ? `属性：${attrText}` : '',
                    introMain ? `简介：${introMain}` : '',
                    tags.length ? `标签：${tags.join(', ')}` : '',
                    cover ? `Link cover: ${cover}` : ''
                ].filter(Boolean).join('\n\n');
            },
            cover: (doc) => ($('#bookImg > img, .book-author img', doc).first().attr('src') || '')
                .replace(/^\/\//, 'https://')
                .replace(/\/\d+(?:\.\w+)?$/, '')
                .replace(/-\d+(?:\.\w+)?$/, ''),
            chapter: 'ul.volume-chapters li > a',
            vipChapter: 'ul.volume-chapters li:has(em), #j-catalogWrap .volume h3:contains("VIP") ~ ul li a',
            chapterTitle: 'h1.title',
            content: 'main[data-type="cjk"], main',
            getChapters: async (doc) => {
                const href = window.location.href;
                const host = window.location.host;
                const isQidian = /(^|\.)qidian\.com$/i.test(host);
                const isChapterPage = /(qidian.com|hongxiu.com|readnovel.com|xs8.cn)\/chapter/.test(href);
                const absoluteUrl = (url) => Rule.helpers.absoluteUrl(url, href);
                const chapterIdOf = (url) => {
                    const match = String(url || '').match(/\/(\d+)\/?$/);
                    return match ? match[1] : null;
                };
                const textOf = (el) => (el && (el.textContent || '').replace(/\s+/g, ' ').trim()) || '';
                const markLink = (link, vip, order) => {
                    if (!link) return;
                    link.setAttribute('novel-downloader-chapter', vip ? 'vip' : '');
                    link.setAttribute('order', String(order));
                };
                const currentChapter = () => {
                    const title = textOf(doc.querySelector('h1.title')) || document.title || href;
                    const vip = Boolean(doc.querySelector('.vip-limit-wrap, .chapter-locked'));
                    return [{
                        title,
                        url: href,
                        vip,
                        isVIP: vip,
                        qidianNoVip: vip,
                        chapterId: chapterIdOf(href)
                    }];
                };

                if (isChapterPage && !doc.querySelector('.catalog-volume, #j-catalogWrap')) return currentChapter();

                if (!isQidian) {
                    const chapters = $('ul.volume-chapters li > a', doc).toArray().map((link, index) => {
                        const vip = $(link).closest('li').find('em, .chapter-locked').length > 0;
                        markLink(link, vip, index + 1);
                        return {
                            title: textOf(link),
                            url: absoluteUrl($(link).attr('href')),
                            vip,
                            isVIP: vip,
                            chapterId: chapterIdOf($(link).attr('href'))
                        };
                    }).filter((chapter) => chapter.url);
                    return chapters.length ? chapters : (isChapterPage ? currentChapter() : []);
                }

                if (doc === document && !doc.querySelector('.catalog-volume, #j-catalogWrap > .volume-wrap > .volume')) {
                    await Rule.helpers.sleep(1200);
                }

                let order = 0;
                const chapters = [];
                const parseSection = (section, options) => {
                    const volumeNode = section.querySelector(options.volumeSelector);
                    const headerNode = section.querySelector(options.headerSelector);
                    const sectionName = textOf(volumeNode)
                        .split('\n')
                        .slice(-1)[0]
                        .split('·')[0]
                        .trim();
                    const isVIP = /VIP/i.test(textOf(headerNode || volumeNode));
                    section.querySelectorAll(options.chapterSelector).forEach((item) => {
                        const link = item.querySelector('a');
                        if (!link) return;
                        order += 1;
                        const chapterUrl = absoluteUrl(link.getAttribute('href') || link.href);
                        const isPaid = isVIP
                            ? (options.paidSelector ? !item.querySelector(options.paidSelector) : !item.querySelector('.chapter-locked'))
                            : false;
                        markLink(link, isVIP, order);
                        chapters.push({
                            title: textOf(link),
                            url: chapterUrl,
                            volume: sectionName,
                            vip: isVIP,
                            isVIP,
                            isPaid,
                            qidianNoVip: isVIP,
                            chapterId: chapterIdOf(chapterUrl)
                        });
                    });
                };

                doc.querySelectorAll('.catalog-volume').forEach((section) => parseSection(section, {
                    volumeSelector: '.volume-name',
                    headerSelector: '.volume-header',
                    chapterSelector: 'ul.volume-chapters > li',
                    paidSelector: '.chapter-locked'
                }));
                if (!chapters.length) {
                    doc.querySelectorAll('#j-catalogWrap > .volume-wrap > .volume').forEach((section) => parseSection(section, {
                        volumeSelector: 'h3',
                        headerSelector: 'h3',
                        chapterSelector: 'ul.cf > li',
                        paidSelector: 'em.iconfont'
                    }));
                }
                return chapters.length ? chapters : (isChapterPage ? currentChapter() : []);
            },
            deal: async (chapter) => {
                const isVipChapter = Boolean(chapter.vip || chapter.isVIP || chapter.qidianNoVip);
                const html = chapter.url === window.location.href
                    ? document.documentElement.outerHTML
                    : await ndFetchText(chapter.url, {
                        headers: { Referer: window.location.href },
                        timeout: Config.timeout
                    });
                let frame = null;
                try {
                    let doc = chapter.url === window.location.href ? document : Rule.helpers.parseHtml(html);
                    if (isVipChapter && chapter.url !== window.location.href) {
                        const rendered = await ndCreateFrameDocument(html, chapter.url, 'main');
                        frame = rendered.frame;
                        doc = rendered.doc || doc;
                    }
                    if (isVipChapter && doc.querySelector('.vip-limit-wrap')) {
                        return { content: '', error: 'Qidian VIP cần tài khoản đã mua/được mở khóa trước khi OCR.' };
                    }
                    const title = $('h1.title', doc).first().text().trim() || chapter.title;
                    const content = doc.querySelector('main[data-type="cjk"], main, .read-content, #chapterContent');
                    if (!content) return { content: '', error: 'Không tìm thấy nội dung Qidian.' };

                    const wrapper = document.createElement('div');
                    if (isVipChapter) {
                        console.log(`[Qidian OCR] Bắt đầu decode VIP: ${title || chapter.url}`);
                        const decodedContent = await ndDecodeQidianContentByOCR(content);
                        if (!decodedContent || !(decodedContent.textContent || '').trim()) {
                            return { content: '', error: 'Qidian OCR không decode được nội dung VIP.' };
                        }
                        wrapper.appendChild(decodedContent);
                    } else {
                        wrapper.innerHTML = content.innerHTML;
                        wrapper.querySelectorAll('span.review, .review-count, script, style').forEach((el) => el.remove());
                        wrapper.querySelectorAll('p').forEach((p) => {
                            if (/^谷[\u4e00-\u9fa5]{0,1}$/.test((p.textContent || '').trim())) p.remove();
                        });
                    }

                    const authorSay = doc.querySelector('#r-authorSay div');
                    if (authorSay && (authorSay.textContent || '').trim()) {
                        const say = authorSay.cloneNode(true);
                        say.querySelectorAll('a.avatar, h4, script, style').forEach((el) => el.remove());
                        if ((say.textContent || '').trim()) {
                            say.className = 'authorSay';
                            wrapper.appendChild(document.createElement('hr'));
                            wrapper.appendChild(say);
                        }
                    }
                    return { title, content: wrapper.innerHTML };
                } finally {
                    if (frame) frame.remove();
                }
            },
            chapterPrev: (doc) => [$('a', doc).filter((i, el) => el.textContent.trim() === "上一章")],
            chapterNext: (doc) => [$('a', doc).filter((i, el) => el.textContent.trim() === "下一章")],
        }
// @rule-end
)
