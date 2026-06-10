// @rule-name: 晋江文学城
// @rule-source: special
(
// @rule-begin
        { // https://www.jjwxc.net
            siteName: '晋江文学城',
            filter: () => {
                const href = window.location.href;
                if (href.match(/www\.jjwxc\.net\/onebook\.php\?novelid=\d+(?:[#&?].*)?$/) && !href.match(/[?&]chapterid=\d+/)) return 1;
                if (href.match(/www\.jjwxc\.net\/onebook\.php\?novelid=\d+&chapterid=\d+/)) return 2;
                return 0;
            },
            title: (doc) => $('#oneboolt .bigtext, [itemprop="name"]', doc).first().text().trim(),
            writer: (doc) => $('#oneboolt h2 > a, #oneboolt > .noveltitle > span > a, [itemprop="author"]', doc).first().text().trim(),
            intro: '#novelintro, [itemprop="description"]',
            cover: '.noveldefaultimage, [itemprop="image"]',
            volume: '.volumnfont',

            getChapters: async (doc) => {
                const parseIds = (value) => {
                    const raw = String(value || '');
                    try {
                        const url = new URL(raw, window.location.href);
                        const novelId = url.searchParams.get('novelid') || url.searchParams.get('novelId');
                        const chapterId = url.searchParams.get('chapterid') || url.searchParams.get('chapterId');
                        if (novelId && chapterId) return { novelId, chapterId };
                    } catch (error) {
                        // Some JJWXC VIP rel values are partial query strings; fall back to regex below.
                    }
                    const novelId = raw.match(/[?&]novelid=(\d+)/i)?.[1];
                    const chapterId = raw.match(/[?&]chapterid=(\d+)/i)?.[1];
                    return novelId && chapterId ? { novelId, chapterId } : {};
                };
                const normalizeUrl = (novelId, chapterId) => `https://www.jjwxc.net/onebook.php?novelid=${novelId}&chapterid=${chapterId}`;
                const chapters = [];
                const trList = Array.from(doc.querySelectorAll('#oneboolt > tbody > tr, #oneboolt tbody tr'));
                let sectionName = null;
                let order = 0;

                if (!trList.length && doc.querySelector('div#oneboolt')) {
                    const ids = parseIds(window.location.href);
                    if (ids.novelId && ids.chapterId) {
                        return [{
                            title: doc.querySelector('div#oneboolt h2')?.textContent?.trim() || document.title,
                            url: normalizeUrl(ids.novelId, ids.chapterId),
                            novelId: ids.novelId,
                            chapterId: ids.chapterId,
                            vip: false,
                            isVip: false,
                            isVIP: false
                        }];
                    }
                }

                trList.forEach((tr) => {
                    if (tr.getAttribute('bgcolor')) {
                        sectionName = tr.querySelector('b.volumnfont, .volumnfont')?.textContent?.trim() || sectionName;
                        return;
                    }
                    if (!tr.getAttribute('itemprop') && !tr.querySelector('td:nth-child(2)')) return;
                    const td = tr.querySelector('td:nth-child(2)');
                    const link = td?.querySelector('a:nth-child(1), a[itemprop="url"], a[id^="vip_"]');
                    order += 1;
                    if (!link && (td?.textContent || '').trim() === '[锁]') {
                        chapters.push({
                            title: '[锁]',
                            url: `${window.location.href}#locked-${order}`,
                            volume: sectionName,
                            vip: true,
                            isVip: true,
                            isVIP: true,
                            locked: true
                        });
                        return;
                    }
                    if (!link) return;
                    const isVip = Boolean(
                        link.getAttribute('onclick')
                        || link.id?.startsWith('vip_')
                        || /onebook_vip\.php/i.test(link.getAttribute('rel') || '')
                    );
                    const rawUrl = link.getAttribute('rel') || link.getAttribute('href') || '';
                    const absoluteRawUrl = Rule.helpers.absoluteUrl(rawUrl, window.location.href);
                    const ids = parseIds(absoluteRawUrl);
                    const title = (link.textContent || td?.textContent || '').trim().replace(/\[VIP\]$/, '').trim();
                    if (!ids.novelId || !ids.chapterId) {
                        console.warn('[JJWXC] Bỏ qua chương không lấy được ID:', rawUrl);
                        return;
                    }
                    link.setAttribute('novel-downloader-chapter', isVip ? 'vip' : '');
                    link.setAttribute('order', String(chapters.length + 1));
                    chapters.push({
                        title,
                        url: normalizeUrl(ids.novelId, ids.chapterId),
                        novelId: ids.novelId,
                        chapterId: ids.chapterId,
                        volume: sectionName,
                        vip: isVip,
                        isVip,
                        isVIP: isVip,
                        locked: false
                    });
                });

                console.log(`[JJWXC] Đã xử lý ${chapters.length} chương.`);
                return chapters;
            },
            deal: async (chapter) => {
                const AUTHOR_SAY_PREFIX = '作者有话说：';
                const parseIds = (value) => {
                    const raw = String(value || '');
                    try {
                        const url = new URL(raw, window.location.href);
                        const novelId = url.searchParams.get('novelid') || url.searchParams.get('novelId');
                        const chapterId = url.searchParams.get('chapterid') || url.searchParams.get('chapterId');
                        if (novelId && chapterId) return { novelId, chapterId };
                    } catch (error) {
                        // Some JJWXC VIP rel values are partial query strings; fall back to regex below.
                    }
                    const novelId = raw.match(/[?&]novelid=(\d+)/i)?.[1];
                    const chapterId = raw.match(/[?&]chapterid=(\d+)/i)?.[1];
                    return novelId && chapterId ? { novelId, chapterId } : {};
                };
                const normalizeToken = (token) => String(token || '').replace(/undefined|token=|\s|&.*$/g, '').trim();
                const getToken = () => {
                    const raw = unsafeWindow.tokenOptions?.Jjwxc;
                    const token = normalizeToken(typeof raw === 'string' ? raw : (raw?.token || ''));
                    return token && token !== '????' ? token : null;
                };
                const decodeHtmlEntitiesTwice = (text) => {
                    const textarea = document.createElement('textarea');
                    textarea.innerHTML = String(text || '');
                    const once = textarea.value;
                    textarea.innerHTML = once;
                    return textarea.value;
                };
                const htmlFromLines = (text, className) => {
                    const div = document.createElement('div');
                    if (className) div.className = className;
                    String(text || '').split(/\r?\n/).forEach((line) => {
                        const p = document.createElement('p');
                        if (line.trim()) p.textContent = line.trim();
                        else p.innerHTML = '<br>';
                        div.appendChild(p);
                    });
                    return div;
                };
                const formatApiContent = (content, sayBody = '') => {
                    const contentTextRaw = decodeHtmlEntitiesTwice(content).replace(/\u200c/g, '');
                    const root = document.createElement('div');
                    root.className = 'main';
                    root.appendChild(htmlFromLines(contentTextRaw));
                    const postscript = decodeHtmlEntitiesTwice(sayBody).replace(/\u200c/g, '').trim();
                    if (postscript) {
                        root.appendChild(document.createElement('hr'));
                        root.appendChild(htmlFromLines(`${AUTHOR_SAY_PREFIX}\n${postscript}`, 'authorSay'));
                    }
                    return root.innerHTML;
                };
                const decodeApiResponse = (res) => {
                    const rawText = String(res.responseText || res.response || '').trim();
                    try {
                        return JSON.parse(rawText);
                    } catch (parseError) {
                        const accesskey = String(res.responseHeaders || '').match(/accesskey:\s*([^\r\n]+)/i)?.[1]?.trim();
                        const keyString = String(res.responseHeaders || '').match(/keystring:\s*([^\r\n]+)/i)?.[1]?.trim();
                        if (!accesskey || !keyString) throw parseError;
                        return JSON.parse(decode(accesskey, keyString, rawText));
                    }
                };
                const decodeField = (value, encryptType) => {
                    if (!value) return '';
                    if (encryptType === 'jj') return decryptContent(value);
                    return value;
                };
                const getFontName = (doc) => {
                    const noveltext = doc.querySelector('div.noveltext');
                    if (!noveltext) return null;
                    return Array.from(noveltext.classList || []).find((name) => name.startsWith('jjwxcfont_')) || null;
                };
                const publicChapter = async () => {
                    const html = chapter.url === window.location.href
                        ? document.documentElement.outerHTML
                        : await ndFetchText(chapter.url, { headers: { Referer: window.location.href }, timeout: Config.timeout });
                    const doc = chapter.url === window.location.href ? document : Rule.helpers.parseHtml(html);
                    const title = $('div#oneboolt h2, h2, .noveltext h2', doc).first().text().trim() || chapter.title;
                    const content = doc.querySelector('div.novelbody > div, div.noveltext');
                    if (!content) return { content: '', error: 'Không tìm thấy nội dung JJWXC trên trang.' };
                    const clone = content.cloneNode(true);
                    const pcc = clone.querySelector('#paragraph_comment_content');
                    if (pcc) {
                        while (pcc.firstChild) clone.insertBefore(pcc.firstChild, pcc);
                        pcc.remove();
                    }
                    const rawAuthorSayDom = clone.querySelector('div.danmu_total_str, #note_danmu_wrapper');
                    const authorSay = rawAuthorSayDom ? rawAuthorSayDom.cloneNode(true) : null;
                    clone.querySelectorAll('hr, script, style').forEach((el) => el.remove());
                    clone.querySelectorAll('div').forEach((el) => {
                        if (el.id === 'paragraph_comment_content') return;
                        if (el.querySelector('p, br') || el.textContent?.trim()) return;
                        el.remove();
                    });
                    let contentHtml = clone.innerHTML.replace(/@无限好文，尽在晋江文学城/g, '');
                    const fontName = getFontName(doc);
                    if (fontName) {
                        console.log(`[JJWXC OCR] Decode font ${fontName} cho chương ${chapter.chapterId || '?'}`);
                        contentHtml = await ndReplaceJjwxcCharacters(fontName, contentHtml);
                    }
                    const root = document.createElement('div');
                    root.className = 'main';
                    root.innerHTML = contentHtml;
                    if (authorSay && (authorSay.textContent || '').trim()) {
                        root.appendChild(document.createElement('hr'));
                        authorSay.className = 'authorSay';
                        root.appendChild(authorSay);
                    }
                    return { title, content: root.innerHTML };
                };
                const getChapterByApi = async (token) => {
                    const apiUrl = new URL('https://app.jjwxc.net/androidapi/chapterContent');
                    apiUrl.searchParams.set('novelId', novelId);
                    apiUrl.searchParams.set('chapterId', chapterId);
                    apiUrl.searchParams.set('versionCode', '381');
                    if (token) apiUrl.searchParams.set('token', token);
                    const userAgent = 'Mozilla/5.0 (Linux; Android 16; Pixel 9 Pro Build/TP1A.251005.002.B2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.109 Mobile Safari/537.36/JINJIANG-Android/381(Pixel9Pro;Scale/3.5;isHarmonyOS/false)' + Date.now();
                    let result = null;
                    let lastError = null;
                    for (let attempt = 0; attempt <= (Config.retry || 2); attempt++) {
                        try {
                            const res = await xhr.sync(apiUrl.href, null, {
                                method: 'GET',
                                responseType: 'text',
                                headers: {
                                    referer: 'http://android.jjwxc.net?v=381',
                                    'user-agent': userAgent
                                },
                                timeout: Config.timeout
                            });
                            result = decodeApiResponse(res);
                            if (!(result && result.message === 'try again!')) break;
                            lastError = new Error(result.message);
                        } catch (error) {
                            lastError = error;
                        }
                        await sleep(1000 + attempt * 500);
                    }
                    if (!result || result.message === 'try again!') throw lastError || new Error('JJWXC API try again');
                    if (result.message && typeof result.content === 'undefined') throw new Error(result.message);
                    if (typeof result.content === 'undefined') throw new Error('JJWXC API không trả content.');

                    const encryptField = Array.isArray(result.encryptField)
                        ? result.encryptField
                        : String(result.encryptField || '').split(',').map((item) => item.trim()).filter(Boolean);
                    let content = result.content;
                    let postscript = result.sayBodyV2 ?? result.sayBody ?? '';
                    if (encryptField.includes('content')) content = decodeField(content, result.encryptType);
                    if (encryptField.includes('sayBodyV2') || encryptField.includes('sayBody')) postscript = decodeField(postscript, result.encryptType);
                    return {
                        title: result.chaptername || result.chapterName || chapter.title,
                        content: formatApiContent(content, postscript)
                    };
                };

                if (chapter.locked) return { content: '', error: 'JJWXC chương bị khóa.' };
                const parsedIds = parseIds(chapter.url);
                const novelId = chapter.novelId || parsedIds.novelId;
                const chapterId = chapter.chapterId || parsedIds.chapterId;
                const isVip = Boolean(chapter.vip || chapter.isVip || chapter.isVIP);
                if (!novelId || !chapterId) return { content: '', error: 'JJWXC thiếu novelId/chapterId.' };

                const token = getToken();
                try {
                    if (!token) return await publicChapter();
                    return await getChapterByApi(token);
                } catch (apiError) {
                    console.warn(`[JJWXC] API tải chương ${chapterId} lỗi, fallback trang web:`, apiError);
                    try {
                        return await publicChapter();
                    } catch (pageError) {
                        return { content: '', error: pageError.message || String(pageError) };
                    }
                }
            },
        }
// @rule-end
)
