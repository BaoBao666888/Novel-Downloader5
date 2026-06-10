// @rule-name: 稷下書院(Novel543)
// @rule-source: special
(
// @rule-begin

        //https://www.novel543.com/
        {
            siteName: '稷下書院(Novel543)',
            filter: () => {
                if (window.location.host !== 'www.novel543.com') return 0;
                if (window.location.pathname.endsWith('/dir')) return 1; // Trang mục lục
                if (window.location.pathname.match(/\/\d+\/\d+_\d+.*\.html$/)) return 2; // Trang chương
                return 0; // Không phải trang hỗ trợ
            },
            infoPage: () => {
                const base = 'https://www.novel543.com';
                const path = window.location.pathname || '/';
                const infoPath = path.replace(/\/[^\/]*$/, '/');
                return base + infoPath;
            },
            title: '.media-content.info h1.title',
            writer: '.media-content.info .author',
            intro: '.media-content.info .intro',
            cover: '.media-left .cover img',
            chapter: '.chaplist ul.all > li > a',

            deal: async (chapter) => {
                const novel543RootWin = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;
                if (!novel543RootWin.__ND_Novel543_State__) {
                    novel543RootWin.__ND_Novel543_State__ = {
                        verifyPromise: null,
                        hasShownVerifyAlert: false,
                        verifyWindow: null,
                        popupDisabledUntil: 0,
                        hasOpenedVerifyWindow: false,
                    };
                }
                const novel543State = novel543RootWin.__ND_Novel543_State__;

                const novel543BlockedTextRe = /(請稍等[，,]?\s*正在進行安全驗證|正在進行安全驗證|請稍等[，,]?\s*正在进行安全验证|正在进行安全验证)/;
                const novel543BlockedHtmlRe = /(challenge-platform|cdn-cgi\/challenge|cf-(?:turnstile|challenge|chl)|Just a moment|Attention Required|Cloudflare)/i;

                function isNovel543BlockedHtml(html) {
                    if (!html) return true;
                    if (novel543BlockedHtmlRe.test(html) || novel543BlockedTextRe.test(html)) return true;
                    try {
                        const doc = new DOMParser().parseFromString(html, 'text/html');
                        const contentText = (doc.querySelector('.content.py-5')?.textContent || '').trim();
                        if (novel543BlockedTextRe.test(contentText)) return true;
                        const title = (doc.querySelector('title')?.textContent || '').trim();
                        if (/Just a moment|Attention Required/i.test(title)) return true;
                    } catch (e) {
                        // ignore
                    }
                    return false;
                }

                function isNovel543PageReady(html, verificationSelector) {
                    if (!html || isNovel543BlockedHtml(html)) return false;
                    if (!verificationSelector) return true;
                    try {
                        const doc = new DOMParser().parseFromString(html, 'text/html');
                        return Boolean(doc.querySelector(verificationSelector));
                    } catch (e) {
                        return false;
                    }
                }

                function tryGetNovel543HtmlFromVerifyWindow(verificationSelector) {
                    const popup = novel543State.verifyWindow;
                    if (!popup || popup.closed) return null;
                    try {
                        const popupDoc = popup.document;
                        if (!popupDoc || popupDoc.readyState !== 'complete') return null;
                        if (verificationSelector && !popupDoc.querySelector(verificationSelector)) return null;

                        const html = popupDoc.documentElement?.outerHTML || '';
                        if (!isNovel543PageReady(html, verificationSelector)) return null;
                        return html;
                    } catch (e) {
                        // cross-origin while CF redirects
                        return null;
                    }
                }

                async function ensureNovel543Verified(targetUrl, openUrl, verificationSelector) {
                    if (novel543State.verifyPromise) return novel543State.verifyPromise;

                    if (novel543State.popupDisabledUntil && Date.now() < novel543State.popupDisabledUntil) {
                        throw new Error("Novel543: Đã tạm dừng mở popup xác minh do popup vừa bị đóng. Hãy tự mở 1 trang Novel543 để xác minh rồi chạy lại.");
                    }

                    if (!novel543State.hasShownVerifyAlert) {
                        novel543State.hasShownVerifyAlert = true;
                        alert("Novel543 đang bật xác minh/Cloudflare. Một cửa sổ sẽ mở để bạn xác thực.\nHãy hoàn tất xác minh (đừng đóng cửa sổ) rồi script sẽ tự tiếp tục.");
                    }

                    novel543State.verifyPromise = new Promise((resolve, reject) => {
                        const finalOpenUrl = openUrl || targetUrl;
                        console.log(`[Novel543 Verify] Mở/reuse popup xác thực: ${finalOpenUrl}`);

                        const features = 'width=520,height=680,resizable=yes,scrollbars=yes';
                        let popup = novel543State.verifyWindow;
                        try {
                            if (!popup || popup.closed) {
                                if (novel543State.hasOpenedVerifyWindow) {
                                    novel543State.popupDisabledUntil = Date.now() + 5 * 60 * 1000;
                                    return reject(new Error("Novel543: Popup xác minh đã bị đóng. Để tránh mở tab liên tục, hãy tự mở 1 trang Novel543 để xác minh rồi chạy lại."));
                                }
                                popup = window.open(finalOpenUrl, '__ND_Novel543_Verify__', features);
                                if (popup) novel543State.hasOpenedVerifyWindow = true;
                            }
                            else popup.location.href = finalOpenUrl;
                        } catch (e) {
                            if ((!popup || popup.closed) && novel543State.hasOpenedVerifyWindow) {
                                novel543State.popupDisabledUntil = Date.now() + 5 * 60 * 1000;
                                return reject(new Error("Novel543: Popup xác minh đã bị đóng. Để tránh mở tab liên tục, hãy tự mở 1 trang Novel543 để xác minh rồi chạy lại."));
                            }
                            popup = window.open(finalOpenUrl, '__ND_Novel543_Verify__', features);
                            if (popup) novel543State.hasOpenedVerifyWindow = true;
                        }

                        novel543State.verifyWindow = popup;
                        if (!popup) return reject(new Error("Pop-up bị chặn. Hãy cho phép pop-up cho novel543.com rồi thử lại."));
                        try { popup.focus(); } catch (e) { /* ignore */ }

                        const startAt = Date.now();
                        const timeoutMs = 180000;
                        let inFlightCheck = false;

                        const timer = setInterval(() => {
                            try {
                                if (popup.closed) {
                                    clearInterval(timer);
                                    // Tránh loop mở popup vô hạn nếu user đóng popup
                                    novel543State.popupDisabledUntil = Date.now() + 5 * 60 * 1000;
                                    return reject(new Error("Cửa sổ xác thực đã bị đóng trước khi hoàn tất. Tạm dừng mở popup 5 phút."));
                                }

                                // Nếu popup đã vào được trang thật thì coi như xác minh xong (và có thể dùng html từ popup)
                                const popupHtml = tryGetNovel543HtmlFromVerifyWindow(verificationSelector);
                                if (popupHtml) {
                                    clearInterval(timer);
                                    return resolve(true);
                                }

                                // Ưu tiên check bằng fetch ở cửa sổ chính: xác minh xong thì cookie sẽ có hiệu lực
                                if (inFlightCheck) return;
                                inFlightCheck = true;
                                fetch(targetUrl, { credentials: 'include', redirect: 'follow' })
                                    .then(r => r.text().then(t => ({ status: r.status, html: t })))
                                    .then(({ status, html }) => {
                                        const blockedByStatus = status === 403 || status === 429;
                                        if (!blockedByStatus && isNovel543PageReady(html, verificationSelector)) {
                                            clearInterval(timer);
                                            // không tự close popup: tránh trường hợp browser/CF cần giữ tab
                                            resolve(true);
                                        }
                                    })
                                    .catch(() => { /* ignore transient network */ })
                                    .finally(() => { inFlightCheck = false; });
                            } catch (e) {
                                // ignore (đang chuyển trang / sandbox)
                            }

                            if (Date.now() - startAt > timeoutMs) {
                                clearInterval(timer);
                                reject(new Error(`Hết thời gian chờ xác minh (${Math.round(timeoutMs / 1000)}s). Hãy hoàn tất xác minh trong popup/tab Novel543 rồi bấm tải lại.`));
                            }
                        }, 2000);
                    }).finally(() => {
                        novel543State.verifyPromise = null;
                    });

                    return novel543State.verifyPromise;
                }

                async function fetchContentNovel543(url, verificationSelector) {
                    if (!verificationSelector) throw new Error("Cần selector để xác thực trang đã tải.");

                    const maxAttempts = 9;
                    let hasTriedVerifyPopup = false;
                    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                        try {
                            const res = await fetch(url, { credentials: 'include', redirect: 'follow' });
                            const html = await res.text();

                            // Một số trường hợp server trả 200 nhưng content là trang “đang xác minh”.
                            const blockedByStatus = res.status === 403 || res.status === 429;
                            const blockedByHtml = isNovel543BlockedHtml(html);
                            if (!blockedByStatus && !blockedByHtml && isNovel543PageReady(html, verificationSelector)) {
                                console.log(`[Novel543 Fetch] OK (attempt ${attempt}/${maxAttempts}): ${url}`);
                                return html;
                            }

                            console.warn(`[Novel543 Fetch] Bị chặn hoặc chưa sẵn sàng (status=${res.status}, attempt ${attempt}/${maxAttempts}): ${url}`);

                            // Chỉ mở popup khi chắc chắn bị chặn bởi CF / verify stub
                            if ((blockedByStatus || blockedByHtml) && !hasTriedVerifyPopup) {
                                hasTriedVerifyPopup = true;
                                await ensureNovel543Verified(url, url, verificationSelector);
                                // Sau khi xác minh, ưu tiên lấy HTML trực tiếp từ popup (tránh trường hợp fetch vẫn bị chặn)
                                const htmlFromPopup = tryGetNovel543HtmlFromVerifyWindow(verificationSelector);
                                if (htmlFromPopup) return htmlFromPopup;

                                await new Promise(r => setTimeout(r, 1200));
                                continue;
                            }
                        } catch (err) {
                            console.warn(`[Novel543 Fetch] Lỗi fetch (attempt ${attempt}/${maxAttempts}): ${url}`, err);
                            // Lỗi mạng (ERR_NETWORK_CHANGED / Failed to fetch) không liên quan Cloudflare → chỉ retry + backoff
                            const retryDelay = Math.max(Config.delayBetweenChapters || 0, 2000);
                            await new Promise(r => setTimeout(r, retryDelay));
                            continue;
                        }

                        // Nếu đã mở popup xác minh mà fetch vẫn fail/stub, thử lấy HTML trực tiếp từ popup
                        if (hasTriedVerifyPopup) {
                            const htmlFromPopup = tryGetNovel543HtmlFromVerifyWindow(verificationSelector);
                            if (htmlFromPopup) return htmlFromPopup;
                        }

                        const retryDelay = Math.max(Config.delayBetweenChapters || 0, 1500);
                        await new Promise(r => setTimeout(r, retryDelay));
                    }

                    throw new Error(`Novel543: Không thể tải nội dung sau ${maxAttempts} lần. Hãy mở một chương trên Novel543 để xác minh rồi thử lại.`);
                }

                const fontMap = { '㟧': '二', '㠬': '丁', '㣉': '入', '㥕': '刀', '㥫': '干', '㦂': '工', '㦫': '巾', '㦱': '亡', '㦳': '之', '㦵': '已', '㦶': '弓', '㧜': '勺', '㨾': '元', '㩙': '五', '㩽': '屯', '㪏': '切', '㪶': '仁', '㪸': '化', '㫅': '父', '㫇': '今', '㫈': '凶', '㫠': '欠', '㫡': '丹', '㫦': '六', '㫧': '文', '㫯': '尺', '㮽': '未', '㰙': '巧', '㰜': '功', '㰱': '世', '㰴': '本', '㰷': '丙', '㱏': '右', '㱒': '平', '㱕': '的', '㱗': '在', '㳍': '叫', '㳎': '用', '㳒': '失', '㳓': '生', '㳔': '到', '㵑': '分', '㵒': '乎', '㵔': '令', '㵕': '成', '㵙': '句', '㹏': '主', '㹐': '市', '㹓': '年', '䀱': '百', '䀲': '同', '䀴': '而', '䃢': '行', '䋢': '里', '䋤': '回', '䌠': '加', '䑖': '制', '䗙': '去', '䗽': '好', '䘓': '因', '䛈': '然', '䛊': '政', '䛌': '社', '䛍': '事', '䛗': '重', '䜥': '新', '䜭': '明', '䥉': '原', '䥊': '利', '䥍': '但', '䦣': '向', '䦤': '道', '䭹': '公', '䭻': '系', '䭼': '很', '䭾': '者', '䮍': '直', '䮹': '程', '䯬': '果', '䯮': '象', '䲻': '毛', '䲾': '白', '䶑': '扯', '䶓': '走', '丳': '抄', '乀': '裸', '乁': '赤', '噷': '交', '噸': '密', '圙': '娼', '塿': '共', '夌': '李', '婈': '游', '婖': '集', '媱': '操', '嵞': '芽', '嵟': '花', '欜': '器', '鼶': '棒', '齂': '母', };

                let combinedHtmlContent = '';
                let currentUrl = chapter.url;
                let mainChapterTitle = chapter.title;
                let isFirstPage = true;

                while (currentUrl) {
                    console.log(`%cNovel543 Deal: Đang tải trang "${mainChapterTitle}" từ ${currentUrl}`, "color: blue;");

                    const pageHtml = await fetchContentNovel543(currentUrl, '.chapter-content > h1');
                    const doc = new window.DOMParser().parseFromString(pageHtml, 'text/html');

                    if (isFirstPage) {
                        mainChapterTitle = $(doc).find('.chapter-content > h1').text().trim().replace(/\s*\(\d+\/\d+\)$/, '') || chapter.title;
                        isFirstPage = false;
                    }

                    const contentElement = $(doc).find('.content.py-5');
                    if (!contentElement.length) {
                        console.warn("Novel543 Deal: Không tìm thấy nội dung trên trang", currentUrl);
                        break;
                    }

                    const contentText = contentElement.text().trim();
                    if (novel543BlockedTextRe.test(contentText)) {
                        throw new Error(`Novel543: Trang trả về nội dung đang xác minh (giả). Hãy xác minh xong rồi thử lại: ${currentUrl}`);
                    }

                    combinedHtmlContent += (contentElement.html() || '');

                    const nextLink = $(doc).find('.foot-nav a:contains("下一章")');
                    const nextHref = nextLink.attr('href');

                    if (nextHref && nextHref.includes('_')) {
                        const currentParts = currentUrl.match(/(\d+_\d+)(_(\d+))?\.html$/);
                        const nextParts = nextHref.match(/(\d+_\d+)(_(\d+))?\.html$/);

                        if (nextParts && currentParts && nextParts[1] === currentParts[1]) {
                            currentUrl = new URL(nextHref, currentUrl).href;
                        } else {
                            currentUrl = null;
                        }
                    } else {
                        currentUrl = null;
                    }

                    if (currentUrl && Config.delayBetweenChapters > 0) {
                        console.log(`%cNovel543 Deal: Chờ ${Config.delayBetweenChapters / 1000} giây trước khi tải trang tiếp theo...`, "color: orange;");
                        await new Promise(resolve => setTimeout(resolve, Config.delayBetweenChapters));
                    }
                }

                console.log(`%cNovel543 Deal: Đã tải xong tất cả các trang cho chương "${mainChapterTitle}". Bắt đầu giải mã...`, "color: green;");

                const tempDiv = $('<div>').html(combinedHtmlContent);
                tempDiv.find('div, span').remove();

                let textContent = tempDiv.find('p').map((index, p_element) => {
                    return $(p_element).text().trim();
                }).get().join('\n');

                for (const [obfuscated, real] of Object.entries(fontMap)) {
                    textContent = textContent.replace(new RegExp(obfuscated, 'g'), real);
                }

                // --- Xóa dòng đầu nếu trùng title ---
                let lines = textContent.split(/\r?\n/);
                if (lines.length > 0) {
                    let firstLine = lines[0].trim();
                    let cleanTitle = mainChapterTitle.trim();

                    // So sánh chính xác hoặc bỏ ký tự đặc biệt
                    if (firstLine === cleanTitle ||
                        firstLine.replace(/[^\w\u4e00-\u9fff]/g, '') === cleanTitle.replace(/[^\w\u4e00-\u9fff]/g, '')) {
                        console.log(`[Novel543] Dòng đầu content trùng title, xóa: "${firstLine}"`);
                        lines.shift(); // xóa dòng đầu
                    }
                    textContent = lines.join('\n');
                }
                if (!textContent.trim()) {
                    const tempDivRe = $('<div>').html(combinedHtmlContent);
                    tempDivRe.find('script, ins, iframe, style, span, p').remove();
                    tempDivRe.find('.gadBlock, .adBlock').remove();
                    tempDivRe.find('br').replaceWith('\n');

                    textContent = tempDivRe.text();
                    textContent = textContent.replace(/\n[ \t]+\n/g, '\n\n');
                    textContent = textContent.replace(/\n{3,}/g, '\n\n').trim();
                }

                console.log(`%cNovel543 Deal: Dọn dẹp và giải mã hoàn tất.`, "color: green;");
                return {
                    title: mainChapterTitle,
                    content: textContent
                };
            }

        }
// @rule-end
)
