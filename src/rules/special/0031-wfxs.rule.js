// @rule-name: 微风小说 (wfxs)
// @rule-source: special
(
// @rule-begin

        {
            siteName: '微风小说 (wfxs)',
            filter: () => {
                const h = window.location.host;
                if (h === 'm.wfxs.tw') {
                    const target = window.location.href
                        .replace(/^https?:\/\/m\./, 'https://www.')
                        .replace(/\/+\.html$/, '.html');

                    if (confirm('Trang đang ở phiên bản mobile. Bạn muốn chuyển sang phiên bản desktop để tải đầy đủ nội dung?\n\n' + target)) {
                        window.location.href = target;
                    }
                    return 0;
                }
                if (/www\.wfxs\.tw\/booklist\/\d+\.html/.test(window.location.href)) return 1; // trang mục lục
                if (/www\.wfxs\.tw\/xiaoshuo\/\d+\/\d+\/(\d+\.html)?$/.test(window.location.href)) return 2; // trang chương (thô)
                return 0;
            },
            url: /www.wfxs.tw\/booklist\/\d+\.html/,
            chapterUrl: /www.wfxs.tw\/xiaoshuo\/\d+\/\d+\/(\d+\.html|)$/,
            infoPage: '.tabstit > a[href^="/xiaoshuo/"],.nav a[href^="/xiaoshuo/"]',
            title: '.booktitle > h1',
            writer: '.booktitle > #author > a',
            intro: '#bookintro',
            cover: '#bookimg > img',
            chapter: '#readerlists > ul > li > a',
            chapterTitle: '[class="chapter-content px-3 pb-5"] > h1',
            //content: '[class="chapter-content px-3 pb-5"] > .content',
            deal: async (chapter) => {
                const CONTENT_SEL = '.chapter-content.px-3.pb-5 > .content';
                const TITLE_SEL = '.chapter-content.px-3.pb-5 > h1';
                const FOOT_NAV_SEL = '.warp.my-5.foot-nav';

                const sleep = ms => new Promise(res => setTimeout(res, ms));
                const delayMs = (typeof Config !== 'undefined' && Number(Config.delayBetweenChapters) > 0)
                    ? Number(Config.delayBetweenChapters)
                    : 500;

                async function fetchWithPopupIfBlocked(url, verificationSelector = 'body', timeout = 30000) {
                    try {
                        const text = await fetch(url, { credentials: 'include' }).then(r => r.text());
                        if (!/cf-browser-verification|Just a moment/i.test(text)) {
                            const doc = new DOMParser().parseFromString(text, 'text/html');
                            if (doc.querySelector(verificationSelector)) return text;
                        }
                    } catch (e) {
                        // ignore and fallback to popup
                    }

                    return new Promise((resolve, reject) => {
                        const popup = window.open(url, '_blank', 'width=900,height=700');
                        if (!popup) return reject('Popup blocked');
                        const start = Date.now();
                        const interval = setInterval(() => {
                            try {
                                if (popup.closed) {
                                    clearInterval(interval);
                                    return reject('Popup closed before ready');
                                }
                                if (popup.document && popup.document.readyState === 'complete' && popup.document.querySelector(verificationSelector)) {
                                    const html = popup.document.documentElement.outerHTML;
                                    clearInterval(interval);
                                    popup.close();
                                    return resolve(html);
                                }
                            } catch (e) { /* cross-origin while waiting */ }
                            if (Date.now() - start > timeout) {
                                clearInterval(interval);
                                if (!popup.closed) popup.close();
                                return reject('Popup timeout');
                            }
                        }, 500);
                    });
                }

                function parsePager(text) {
                    if (!text) return null;
                    const m = text.match(/[（(]\s*(\d+)\s*[\/／]\s*(\d+)\s*[)）]/);
                    if (m) return { page: parseInt(m[1], 10), total: parseInt(m[2], 10) };
                    return null;
                }

                function normalizeText(s) {
                    return (s || '').replace(/\s+/g, '').replace(/[頁页]/g, '页');
                }

                function findNextPageLinkByText(doc, currentUrl, pager) {
                    const anchors = Array.from(doc.querySelectorAll('a'));

                    // 1) tìm bằng text (hợp nhất giản/phồn + bỏ space)
                    for (const a of anchors) {
                        const raw = a.textContent || '';
                        const txt = normalizeText(raw).trim();
                        if (txt.includes('下一页') || txt.includes('下页')) {
                            const href = a.getAttribute('href');
                            if (href) return new URL(href, currentUrl).href;
                        }
                    }

                    // 2) nếu có pager: tìm href chứa số trang tiếp theo
                    if (pager && typeof pager.page === 'number') {
                        const nextNum = pager.page + 1;
                        const re_end_num_html = new RegExp('/' + nextNum + '(?:\\.html)?(?:/)?$');
                        const re_page_param = new RegExp('[?&](?:page|p)=' + nextNum + '(?:$|&)');
                        for (const a of anchors) {
                            const hrefRaw = a.getAttribute('href');
                            if (!hrefRaw) continue;
                            let abs;
                            try { abs = new URL(hrefRaw, currentUrl).href; } catch (e) { continue; }
                            if (re_end_num_html.test(abs) || re_page_param.test(abs) || abs.includes('/' + nextNum + '/')) {
                                return abs;
                            }
                        }
                    }

                    // 3) fallback: kiểm tra foot-nav cho 下一章 (nhiều khi chứa /2.html)
                    const foot = doc.querySelector(FOOT_NAV_SEL);
                    if (foot) {
                        const footAnchors = Array.from(foot.querySelectorAll('a'));
                        for (const a of footAnchors) {
                            const txt = (a.textContent || '').trim();
                            const href = a.getAttribute('href');
                            if (!href) continue;
                            const abs = new URL(href, currentUrl).href;
                            if (txt === '下一章') return abs;
                            const segs = abs.split('/').filter(Boolean);
                            const last = segs[segs.length - 1] || '';
                            if (/^\d+(\.html)?$/.test(last)) return abs;
                        }
                    }

                    // 4) heuristic: tăng số cuối của currentUrl
                    try {
                        const cur = new URL(currentUrl);
                        const path = cur.pathname;
                        let m = path.match(/\/(\d+)(?:\.html)?\/?$/);
                        if (m) {
                            const next = parseInt(m[1], 10) + 1;
                            const cand1 = currentUrl.replace(/\/(\d+)(?:\.html)?\/?$/, '/' + next + '.html');
                            return cand1;
                        }
                        m = path.match(/_(\d+)\.html$/);
                        if (m) {
                            const next = parseInt(m[1], 10) + 1;
                            const cand = currentUrl.replace(/_(\d+)\.html$/, '_' + next + '.html');
                            return cand;
                        }
                    } catch (e) { /* ignore */ }

                    return null;
                }

                // main
                console.log('[wfxs.deal] start deal:', chapter && (chapter.title || chapter.url));
                let combinedHtml = '';
                let cur = chapter.url;
                let mainTitle = chapter.title || '';
                let first = true;
                let pagesFetched = 0;

                while (cur) {
                    console.log('[wfxs.deal] fetch page:', cur);
                    let html;
                    try {
                        html = await fetchWithPopupIfBlocked(cur, TITLE_SEL);
                    } catch (err) {
                        console.error('[wfxs.deal] fetch error:', err);
                        break;
                    }

                    const doc = new DOMParser().parseFromString(html, 'text/html');

                    if (first) {
                        const tnode = doc.querySelector(TITLE_SEL) || doc.querySelector('h1');
                        if (tnode) {
                            const rawTitle = tnode.textContent.trim();
                            mainTitle = rawTitle.replace(/[（(]\s*\d+\s*[\/／]\s*\d+\s*[)）]$/, '').trim() || mainTitle;
                        }
                        first = false;
                    }

                    const contentNode = doc.querySelector(CONTENT_SEL);
                    if (contentNode) {
                        Array.from(contentNode.querySelectorAll('script,style,iframe,.ads,.ad')).forEach(n => n.remove());
                        combinedHtml += contentNode.innerHTML;
                    } else {
                        combinedHtml += (doc.body && doc.body.innerHTML) || '';
                    }
                    pagesFetched++;

                    // pager xử lý
                    const tnodeCheck = doc.querySelector(TITLE_SEL) || doc.querySelector('h1');
                    const ttext = tnodeCheck ? tnodeCheck.textContent : '';
                    const pager = parsePager(ttext);
                    if (pager) {
                        console.log(`[wfxs.deal] internal pager: ${pager.page}/${pager.total}`);
                        if (pager.page >= pager.total) break;
                        const nextPage = findNextPageLinkByText(doc, cur, pager);
                        if (nextPage) {
                            console.log('[wfxs.deal] next page ->', nextPage);
                            // sleep trước khi fetch trang tiếp theo
                            if (delayMs > 0) await sleep(delayMs);

                            cur = nextPage;
                            continue;
                        } else {
                            console.warn('[wfxs.deal] no next page link found, stop.');
                            break;
                        }
                    } else {
                        break; // không phải phân trang nội bộ -> dừng sau 1 trang
                    }
                }

                // convert HTML -> text
                const tmp = document.createElement('div');
                tmp.innerHTML = combinedHtml;
                Array.from(tmp.querySelectorAll('script,style,iframe,.ads,.ad')).forEach(n => n.remove());
                const pNodes = Array.from(tmp.querySelectorAll('p')).map(p => p.textContent.trim()).filter(Boolean);
                let text = pNodes.length ? pNodes.join('\n\n') : (tmp.textContent || '').split(/\n+/).map(s => s.trim()).filter(Boolean).join('\n\n');

                // remove leading title line if duplicate
                const lines = text.split(/\r?\n/);
                if (lines.length && lines[0].trim()) {
                    const firstLine = lines[0].trim();
                    const cleanedTitle = (mainTitle || '').replace(/[^\w\u4e00-\u9fff]/g, '');
                    if (firstLine === mainTitle || firstLine.replace(/[^\w\u4e00-\u9fff]/g, '') === cleanedTitle) {
                        lines.shift();
                        text = lines.join('\n');
                    } else text = lines.join('\n');
                }

                console.log('[wfxs.deal] done:', mainTitle, 'pagesFetched=', pagesFetched, 'len=', (text || '').length);
                return { title: mainTitle, content: text };
            },

        }
// @rule-end
)
