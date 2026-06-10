// @rule-name: 爱丽丝书屋
// @rule-source: special
(
// @rule-begin

        {
            siteName: '爱丽丝书屋',
            url: '://www.alicesw.com/(?:novel/\\d+|other/chapters/id/\\d+)\\.html',
            chapterUrl: '://www.alicesw.com/book/\\d+/[a-z0-9]+\\.html',
            infoPage: (doc = document) => {
                if (/\/novel\/\d+\.html/.test(location.pathname)) return location.href;
                const link = doc.querySelector('.bread-crumbs a[href^="/novel/"], .infos a[href^="/novel/"], .text-info a[href^="/novel/"], .book-wrap a[href^="/novel/"]');
                return link ? Rule.helpers.absoluteUrl(link.getAttribute('href'), location.href) : '';
            },
            title: '.novel_title, h1',
            writer: (doc = document) => (doc.querySelector('.novel_info p:first-child a') || doc.querySelector('.infos span:first-child a'))?.textContent.trim() || '',
            intro: '.jianjie p:first',
            cover: (doc = document) => {
                const img = doc.querySelector('.pic img');
                const src = img ? (img.getAttribute('data-src') || img.getAttribute('src') || img.src || '') : '';
                return src ? Rule.helpers.absoluteUrl(src, location.href) : '';
            },
            getChapterDoc: async (doc = document) => {
                if (doc.querySelector('.mulu_list a')) {
                    doc.__ndBaseUrl = doc.__ndBaseUrl || location.href;
                    return doc;
                }
                const rule = Rule.special.find(item => item.siteName === '爱丽丝书屋');
                let infoDoc = doc;
                let infoUrl = location.href;
                if (!infoDoc.querySelector('.book_newchap')) {
                    infoUrl = rule.infoPage(doc) || location.href;
                    if (infoUrl) {
                        infoDoc = await Rule.helpers.requestDoc(infoUrl);
                        infoDoc.__ndBaseUrl = infoUrl;
                    }
                }
                const link = infoDoc.querySelector('.book_newchap .tit a[href*="/other/chapters/id/"], a[href*="/other/chapters/id/"]');
                if (!link) return doc;
                const chapterListUrl = Rule.helpers.absoluteUrl(link.getAttribute('href'), infoDoc.__ndBaseUrl || infoUrl || location.href);
                const chapterDoc = await Rule.helpers.requestDoc(chapterListUrl);
                chapterDoc.__ndBaseUrl = chapterListUrl;
                return chapterDoc;
            },
            getChapters: async (doc = document) => {
                const rule = Rule.special.find(item => item.siteName === '爱丽丝书屋');
                const chapterDoc = await rule.getChapterDoc(doc);
                const baseUrl = chapterDoc.__ndBaseUrl || location.href;
                return Array.from(chapterDoc.querySelectorAll('.mulu_list a[href]')).map((a) => ({
                    title: a.textContent.trim().replace(/\s+/g, ' '),
                    url: Rule.helpers.absoluteUrl(a.getAttribute('href'), baseUrl)
                })).filter(chapter => chapter.title && chapter.url);
            },
            isVerifyDoc: (doc = document) => {
                const title = (doc.querySelector('title')?.textContent || '').trim();
                return title.includes('访问验证') || !!doc.querySelector('form[action*="/home/chapter/check_code"] input[name="code"]');
            },
            getAccessBlockMessage: (doc = document) => {
                const title = (doc.querySelector('title')?.textContent || '').trim();
                const scripts = Array.from(doc.querySelectorAll('script')).map(script => script.textContent || '').join('\n');
                const msgMatch = scripts.match(/\bmsg\s*=\s*("(?:(?:\\.)|[^"\\])*"|'(?:(?:\\.)|[^'\\])*')/);
                let message = '';
                if (msgMatch) {
                    try {
                        message = JSON.parse(msgMatch[1]);
                    } catch (error) {
                        message = msgMatch[1].slice(1, -1).replace(/\\(["'\\])/g, '$1');
                    }
                }
                if (!message) {
                    message = (doc.body && doc.body.textContent || '').replace(/\s+/g, ' ').trim();
                }
                if (title.includes('提示信息') && /访问异常|请稍后再试|后再试|访问过于频繁|禁止访问|验证/.test(message)) {
                    return message || 'AliceSW đang chặn truy cập.';
                }
                return '';
            },
            raiseAccessBlock: async (doc, chapterUrl) => {
                const rule = Rule.special.find(item => item.siteName === '爱丽丝书屋');
                const message = rule.getAccessBlockMessage(doc) || 'AliceSW đang chặn truy cập, cần thử lại sau.';
                await showNovelDownloaderNotice({
                    title: 'AliceSW đang chặn tải',
                    message: `${message}\n\nScript đã dừng ở chương hiện tại để tránh ghi lỗi hàng loạt. Khi hết thời gian chặn, mở lại UI và dùng dữ liệu tải dở để tiếp tục.`
                });
                const error = new Error(message);
                error.ndVerificationCancelled = true;
                error.url = chapterUrl;
                throw error;
            },
            submitVerifyCode: async (verifyDoc, chapterUrl, attempt = 0) => {
                const form = verifyDoc.querySelector('form[action*="/home/chapter/check_code"]');
                if (!form) throw new Error('AliceSW yêu cầu xác minh nhưng không tìm thấy form nhập mã.');
                const actionUrl = Rule.helpers.absoluteUrl(form.getAttribute('action') || '/home/chapter/check_code.html', chapterUrl);
                const image = form.querySelector('img[src*="/home/chapter/verify"], img[src*="verify"]') || verifyDoc.querySelector('img[src*="/home/chapter/verify"], img[src*="verify"]');
                const imageUrl = image ? Rule.helpers.absoluteUrl(image.getAttribute('src') || image.src || '', chapterUrl) : '';
                const code = await requestNovelDownloaderVerificationCode({
                    title: 'AliceSW yêu cầu mã xác minh',
                    message: attempt
                        ? 'Mã vừa nhập chưa qua được xác minh. Nhập lại mã mới để tiếp tục tải chương hiện tại.'
                        : 'Web đang chặn đọc/tải nhanh. Nhập mã trong ảnh để script tiếp tục từ chương hiện tại.',
                    imageUrl
                });
                const params = new URLSearchParams();
                Array.from(form.querySelectorAll('input[name]')).forEach((input) => {
                    if (input.name && input.name !== 'code') params.set(input.name, input.value || '');
                });
                params.set('code', code);
                const res = await fetch(actionUrl, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                    },
                    body: params.toString()
                });
                const html = await res.text();
                const doc = Rule.helpers.parseHtml(html);
                doc.__ndBaseUrl = res.url || chapterUrl;
                return doc;
            },
            getVerifiedChapterDoc: async (chapterUrl) => {
                const rule = Rule.special.find(item => item.siteName === '爱丽丝书屋');
                let html = await Rule.helpers.requestText(chapterUrl, { cache: false });
                let doc = Rule.helpers.parseHtml(html);
                doc.__ndBaseUrl = chapterUrl;
                if (rule.getAccessBlockMessage(doc)) await rule.raiseAccessBlock(doc, chapterUrl);
                for (let attempt = 0; attempt < 5 && rule.isVerifyDoc(doc); attempt++) {
                    console.warn('[AliceSW] Trang yêu cầu mã xác minh, tạm dừng tải để user nhập mã.', { chapterUrl, attempt: attempt + 1 });
                    doc = await rule.submitVerifyCode(doc, chapterUrl, attempt);
                    if (rule.getAccessBlockMessage(doc)) await rule.raiseAccessBlock(doc, chapterUrl);
                    if (!rule.isVerifyDoc(doc)) return doc;
                }
                if (rule.isVerifyDoc(doc)) {
                    const error = new Error('AliceSW vẫn yêu cầu mã xác minh sau nhiều lần nhập mã.');
                    error.ndVerificationCancelled = true;
                    throw error;
                }
                return doc;
            },
            deal: async (chapter) => {
                const rule = Rule.special.find(item => item.siteName === '爱丽丝书屋');
                const doc = await rule.getVerifiedChapterDoc(chapter.url);
                if (rule.isVerifyDoc(doc)) throw new Error('AliceSW yêu cầu mã xác minh trước khi tải chương.');
                if (rule.getAccessBlockMessage(doc)) await rule.raiseAccessBlock(doc, chapter.url);
                const title = $(rule.chapterTitle, doc).first().text().trim() || chapter.title || '';
                const contentNode = $(rule.content, doc).first().clone();
                if (!contentNode.length) {
                    if (rule.getAccessBlockMessage(doc)) await rule.raiseAccessBlock(doc, chapter.url);
                    throw new Error('AliceSW không tìm thấy nội dung chương.');
                }
                contentNode.find(`${rule.elementRemove},script,style,iframe`).remove();
                const content = (contentNode.html() || '').trim();
                if (!content) {
                    if (rule.getAccessBlockMessage(doc)) await rule.raiseAccessBlock(doc, chapter.url);
                    throw new Error('AliceSW nội dung chương rỗng.');
                }
                return { title, content };
            },
            chapterTitle: '.j_chapterName',
            content: '.j_readContent',
            elementRemove: 'script,style,.la-ball-pulse,.chapter-control,.read-login,.quick-nav,.left-bar-list,.right-bar-list,.panel-wrap,.float-wrap,.book-wrap',
            chapterPrev: '#j_chapterPrev',
            chapterNext: '#j_chapterNext'
        }
// @rule-end
)
