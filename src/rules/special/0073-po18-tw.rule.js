// @rule-name: PO18臉紅心跳
// @rule-source: special
(
// @rule-begin
        { // https://www.po18.tw/
            siteName: 'PO18臉紅心跳',
            url: '://www.po18.tw/books/\\d+/articles(\\?page=\\d+)?$',
            chapterUrl: '://www.po18.tw/books/\\d+/articles/\\d+',
            title: '.book_name',
            writer: '.book_author',
            cover: '.book_cover>img',
            chapter: '.list-view .l_chaptname>a',
            deal: async (chapter) => {
                const urlArr = chapter.url.split('/');
                const contentUrl = `${window.location.origin}/books/${urlArr[4]}/articlescontent/${urlArr[6]}`;
                const timeoutMs = Config.timeout || 60000;

                const guardLogin = (html) => {
                    if (!html) return;
                    const lowered = html.toLowerCase();
                    if (lowered.includes('會員登入') || lowered.includes('會員登錄') || lowered.includes('login.php')) {
                        throw new Error('Cookie PO18 hết hạn / chưa đăng nhập.');
                    }
                };

                const content = await (async () => {
                    try {
                        const res = await xhr.sync(contentUrl, null, {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                Referer: chapter.url,
                                'X-Requested-With': 'XMLHttpRequest',
                            },
                            timeout: timeoutMs,
                        });
                        if (res.status >= 300 && res.status < 400) {
                            const loc = res.responseHeaders?.match(/location:\s*(.*)/i)?.[1]?.trim();
                            throw new Error(`GM_xhr HTTP ${res.status} redirect ${loc || ''}`);
                        }
                        return res.responseText || res.response || '';
                    } catch (xhrError) {
                        console.error('[ND][PO18] GM_xhr content failed', xhrError);
                        return '';
                    }
                })();

                guardLogin(content);
                const cleanContent = (() => {
                    try {
                        const doc = new DOMParser().parseFromString(content, 'text/html');
                        const imgLines = Array.from(doc.querySelectorAll('.imgStyle1 img'))
                            .map((img) => img.getAttribute('src') || '')
                            .filter(Boolean)
                            .map((src) => src.trim());
                        doc.querySelectorAll('blockquote.copyright').forEach((el) => el.remove());
                        const bodyHtml = doc.body ? doc.body.innerHTML : content;
                        const text = bodyHtml.trim();
                        const base = text || content;
                        if (imgLines.length === 0) return base;
                        return `${imgLines.join('\n')}\n${base}`;
                    } catch (error) {
                        console.warn('[ND][PO18] Làm sạch nội dung thất bại, trả về raw.', error);
                        return content;
                    }
                })();

                // Gọi thêm chapter.url để lấy 作者的話 (nhưng đảm bảo không bị treo nếu lỗi)
                const extra = await (async () => {
                    if (!cleanContent) return '';
                    try {
                        const res = await xhr.sync(chapter.url, null, {
                            responseType: 'document',
                            timeout: timeoutMs,
                        });
                        if (res.status >= 300 && res.status < 400) {
                            const loc = res.responseHeaders?.match(/location:\s*(.*)/i)?.[1]?.trim();
                            throw new Error(`GM_xhr HTTP ${res.status} redirect ${loc || ''}`);
                        }
                        const doc = res.response;
                        const html = doc?.documentElement?.innerHTML || '';
                        guardLogin(html);
                        const authorBox = doc.querySelector('div.Author_box');
                        if (authorBox) {
                            const h2 = authorBox.querySelector('h2');
                            if (h2 && h2.textContent.trim() === '作者的話') {
                                const authorSayDiv = authorBox.querySelector('div.author_say');
                                const text = authorSayDiv?.querySelector('p')?.textContent?.trim();
                                if (text) {
                                    console.log("Phát hiện tác giả có lời muốn nói!");
                                    return "\n------------\n作者的話:\n" + text;
                                }
                            }
                        }
                        return '';
                    } catch (error) {
                        console.warn('[ND][PO18] Lấy 作者的話 thất bại', error);
                        return '';
                    }
                })();

                if (!cleanContent) {
                    return '';
                }

                return cleanContent + extra;
            },
            getChapters: async (doc) => {
                const urlArr = window.location.href.split('/');
                const res = await xhr.sync(`${window.location.origin}/books/${urlArr[4]}/allarticles`, null, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        Referer: window.location.href,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    responseType: 'document',
                });
                return $('a', res.response).toArray().map((i) => ({
                    title: $(i).text(),
                    url: $(i).prop('href'),
                    vip: $(i).is(':has(img)'),
                }));
            },
            elementRemove: 'blockquote',
        }
// @rule-end
)
