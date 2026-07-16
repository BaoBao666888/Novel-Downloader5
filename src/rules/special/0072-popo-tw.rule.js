// @rule-name: POPO原創市集
// @rule-source: special
(
// @rule-begin
        { // https://www.popo.tw
            siteName: 'POPO原創市集',
            url: /:\/\/www\.popo\.tw\/books\/(?:\d+(?:\/articles)?|articles\/\d+)\/?(?:[?#].*)?$/,
            chapterUrl: /:\/\/www\.popo\.tw\/books\/\d+\/articles\/\d+\/?(?:[?#].*)?$/,
            filter: () => {
                if (window.location.host !== 'www.popo.tw') return 0;
                if (/^\/books\/\d+\/articles\/\d+\/?$/.test(window.location.pathname)) return 2;
                if (/^\/books\/(?:\d+(?:\/articles)?|articles\/\d+)\/?$/.test(window.location.pathname)) return 1;
                return 0;
            },
            infoPage: () => {
                const pathname = window.location.pathname;
                const match = pathname.match(/^\/books\/(\d+)/)
                    || pathname.match(/^\/books\/articles\/(\d+)/);
                return match ? `${window.location.origin}/books/${match[1]}` : window.location.href;
            },
            title: (doc) => $('.booksdetail .title, .crumbh1', doc).first().text().replace(/\s+/g, ' ').trim()
                || $('meta[property="og:title"]', doc).attr('content')?.replace(/（[^）]*）\s*｜.*$/, '').trim()
                || '',
            writer: (doc) => $('.b_author > a', doc).first().text().trim(),
            intro: (doc) => {
                const intro = $('.book_intro', doc).first().clone();
                intro.find('.tags, script, style').remove();
                return intro.html() || $('meta[name="description"]', doc).attr('content') || '';
            },
            cover: (doc) => {
                const src = $('.booksdetail .cover-b, meta[property="og:image"]', doc).first().attr('src')
                    || $('meta[property="og:image"]', doc).attr('content')
                    || '';
                return src ? Rule.helpers.absoluteUrl(src, window.location.origin) : '';
            },
            chapter: '.list-view .c2 > a',
            chapterTitle: '.read-txt > h2, .read-txt h1',
            content: '.read-txt',
            getChapters: async (doc) => {
                const helpers = Rule.helpers;
                const pathname = window.location.pathname;
                const bookMatch = pathname.match(/^\/books\/(\d+)/)
                    || pathname.match(/^\/books\/articles\/(\d+)/);
                if (!bookMatch) throw new Error('POPO: Không xác định được ID truyện.');

                const bookId = bookMatch[1];
                const firstPageUrl = `${window.location.origin}/books/articles/${bookId}?page=1`;
                const isFirstListPage = /^\/books\/(?:articles\/\d+|\d+\/articles)\/?$/.test(pathname)
                    && (!new URL(window.location.href).searchParams.get('page')
                        || new URL(window.location.href).searchParams.get('page') === '1')
                    && $('.list-view .clist', doc).length;
                const firstDoc = isFirstListPage ? doc : await helpers.requestDoc(firstPageUrl, {
                    cache: false,
                    headers: { Referer: `${window.location.origin}/books/${bookId}` },
                });

                const parsePageCount = (pageDoc) => {
                    const pages = $('.pagenum a[href*="page="]', pageDoc).toArray()
                        .map((link) => {
                            try {
                                return Number(new URL($(link).attr('href'), firstPageUrl).searchParams.get('page')) || 0;
                            } catch (error) {
                                return 0;
                            }
                        });
                    return Math.max(1, ...pages);
                };
                const collectPage = (pageDoc, pageUrl) => $('.list-view .clist', pageDoc).toArray()
                    .map((row) => {
                        const titleBox = $('.c2', row).first();
                        const titleLink = titleBox.find('a[href*="/articles/"]').first();
                        const action = $('.c4', row).first();
                        const actionText = action.text().replace(/\s+/g, '');
                        const actionHref = action.attr('href') || '';
                        const orderMatch = actionHref.match(/#popup_order(\d+)/);
                        const rawUrl = titleLink.attr('href')
                            || (/\/books\/\d+\/articles\/\d+/.test(actionHref) ? actionHref : '')
                            || (orderMatch ? `/books/${bookId}/articles/${orderMatch[1]}` : '');
                        const url = helpers.absoluteUrl(rawUrl, pageUrl);
                        return {
                            title: titleBox.text().replace(/\s+/g, ' ').trim(),
                            url,
                            vip: !titleLink.length
                                || action.hasClass('BTN_pink')
                                || Boolean(actionText && !actionText.includes('免費閱讀')),
                        };
                    })
                    .filter((chapter) => chapter.title
                        && /^https:\/\/www\.popo\.tw\/books\/\d+\/articles\/\d+\/?(?:[?#].*)?$/.test(chapter.url));

                const chapters = collectPage(firstDoc, firstPageUrl);
                const pageCount = parsePageCount(firstDoc);
                for (let page = 2; page <= pageCount; page++) {
                    const pageUrl = `${window.location.origin}/books/articles/${bookId}?page=${page}`;
                    const pageDoc = await helpers.requestDoc(pageUrl, {
                        cache: false,
                        headers: { Referer: firstPageUrl },
                    });
                    chapters.push(...collectPage(pageDoc, pageUrl));
                }
                return helpers.uniqueBy(chapters, (chapter) => chapter.url);
            },
            deal: async (chapter) => {
                const helpers = Rule.helpers;
                const doc = await helpers.requestDoc(chapter.url, {
                    cache: false,
                    headers: { Referer: chapter.url.replace(/\/articles\/\d+\/?(?:[?#].*)?$/, '/articles') },
                });
                const pageTitle = $('title', doc).text().trim();
                if (/會員登入|會員登錄/.test(pageTitle) || $('form[action*="login"], .login_box, .p_sign', doc).length) {
                    throw new Error('POPO: Cookie hết hạn hoặc chưa đăng nhập.');
                }

                const content = $('.read-txt', doc).first().clone();
                if (!content.length) {
                    const bodyText = $('body', doc).text().replace(/\s+/g, ' ').trim();
                    if (/訂購|購買|餘額不足|尚未購買/.test(bodyText)) {
                        throw new Error('POPO: Chương VIP chưa được mua hoặc tài khoản không có quyền đọc.');
                    }
                    throw new Error('POPO: Không tìm thấy nội dung chương.');
                }

                const title = content.find('h2, h1').first().text().replace(/\s+/g, ' ').trim()
                    || chapter.title
                    || '';
                content.find('h1, h2, blockquote, script, style, iframe, .read-tool, .chapter-tool').remove();
                content.find('img[src]').each((index, img) => {
                    const src = $(img).attr('src');
                    if (src) $(img).attr('src', helpers.absoluteUrl(src, chapter.url));
                });
                const html = (content.html() || '').trim();
                if (!html) throw new Error('POPO: Nội dung chương rỗng.');
                return { title, content: html };
            },
            elementRemove: 'blockquote, script, style, iframe',
            thread: 1,
        }
// @rule-end
)
