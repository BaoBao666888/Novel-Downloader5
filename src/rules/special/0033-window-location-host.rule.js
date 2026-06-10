// @rule-name: 一七小说 (1qxs)
// @rule-source: special
(
// @rule-begin

        {
            siteName: '一七小说 (1qxs)',
            filter: () => {
                if (window.location.host !== 'm.1qxs.com') return 0;
                const path = window.location.pathname;
                if (/^\/xs_\d+\/\d+\/\d+(?:\/\d+)?\/?$/.test(path)) return 2;
                if (/^\/(?:xs|catalog)_\d+\/\d+(?:\/\d+)?\/?$/.test(path)) return 1;
                return 0;
            },
            url: /m\.1qxs\.com\/(?:xs_\d+\/\d+|catalog_\d+\/\d+(?:\/\d+)?)\/?(?:\?.*)?$/,
            chapterUrl: /m\.1qxs\.com\/xs_\d+\/\d+\/\d+(?:\/\d+)?\/?(?:\?.*)?$/,
            infoPage: () => {
                const m = window.location.pathname.match(/^\/(?:xs|catalog)_(\d+)\/(\d+)/);
                if (!m) return window.location.href;
                return `${window.location.origin}/xs_${m[1]}/${m[2]}`;
            },
            title: (doc) => {
                const fromInfo = $('.book-intro h1.line_1', doc).eq(0).text().trim();
                if (fromInfo) return fromInfo;

                const fromHeader = $('header .title.line_1,.catalog > .title.line_1', doc).eq(0).text().trim();
                if (fromHeader && fromHeader !== '出错了') return fromHeader;

                const kw = $('meta[name="keywords"]', doc).attr('content') || '';
                if (kw) {
                    const first = kw.split(',')[0].trim();
                    if (first && first !== '一七小说') return first;
                }

                const raw = $('title', doc).eq(0).text().trim();
                const match = raw.match(/^(.*?)\s*-\s*(?:.*?小说.*|一七小说.*)$/);
                if (match && match[1]) return match[1].trim();
                return raw || '';
            },
            writer: '.book-intro .cell .author',
            intro: '#in-details,.book-intro .desc',
            cover: (doc) => {
                const img = $('.book-intro .cover img', doc).eq(0);
                if (!img.length) return '';
                const src = img.attr('data-original') || img.attr('data-src') || img.attr('src') || '';
                return src ? new URL(src, window.location.origin).href : '';
            },

            getChapters: async (doc) => {
                const pathMatch = window.location.pathname.match(/^\/(?:xs|catalog)_(\d+)\/(\d+)/);
                if (!pathMatch) return [];

                const siteType = pathMatch[1];
                const bookId = pathMatch[2];
                const origin = window.location.origin;
                const parser = new DOMParser();
                const catalogBase = `${origin}/catalog_${siteType}/${bookId}`;
                const chapterHrefRe = new RegExp(`^/xs_${siteType}/${bookId}/(\\d+)/?$`);
                const catalogPagePathRe = new RegExp(`^/catalog_${siteType}/${bookId}/(\\d+)`);
                const catalogPageHrefRe = new RegExp(`/catalog_${siteType}/${bookId}/(\\d+)`);
                const currentCatalogPageMatch = window.location.pathname.match(catalogPagePathRe);
                const currentCatalogPage = currentCatalogPageMatch ? parseInt(currentCatalogPageMatch[1], 10) : null;
                const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
                const delayMs = 220;

                const renderManualCatalog = (chapters) => {
                    try {
                        $('#qxs-chapter-container').remove();

                        const container = document.createElement('div');
                        container.id = 'qxs-chapter-container';
                        container.style = 'padding: 16px; border: 1px solid #ccc; background: #fff; max-width: 800px; margin: 20px auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
                        container.innerHTML = `<h2 style="text-align:center; color: #1a73e8;">Danh sách chương (${chapters.length} chương)</h2>`;

                        chapters.forEach((chap, index) => {
                            const link = document.createElement('a');
                            link.href = chap.url;
                            link.innerText = chap.title;
                            link.setAttribute('novel-downloader-chapter', '');
                            link.setAttribute('order', index + 1);
                            link.style = 'display: block; padding: 8px 12px; margin: 5px 0; border-left: 4px solid #2196F3; text-decoration: none; color: #333; background-color: #f9f9f9; border-radius: 4px;';
                            container.appendChild(link);
                        });

                        document.body.prepend(container);
                        container.scrollIntoView({ behavior: 'smooth', block: 'start' });

                        setTimeout(() => {
                            $('a[order]').each((_, a) => {
                                if (!container.contains(a)) {
                                    a.removeAttribute('order');
                                    a.removeAttribute('novel-downloader-chapter');
                                }
                            });
                        }, 500);
                    } catch (renderErr) {
                        console.error('[1qxs] Lỗi khi render danh sách chương:', renderErr);
                    }
                };

                const isCatalogDoc = (d) => d
                    && d.querySelector
                    && d.querySelector('.catalog > ul')
                    && d.querySelector('.catalog-title .pagelist, .chapter_page .pagelist');

                const hasCatalogChapters = (d) => {
                    if (!d || !d.querySelectorAll) return false;
                    const re = new RegExp(`/xs_${siteType}/${bookId}/\\d+/?$`);
                    return Array.from(d.querySelectorAll('a[href]')).some((a) => {
                        const href = (a.getAttribute('href') || '').split('?')[0];
                        return re.test(href);
                    });
                };

                const fetchCatalogDoc = async (pageNo, attempt = 0) => {
                    const baseUrl = pageNo === 1 ? catalogBase : `${catalogBase}/${pageNo}`;
                    const backupUrl = pageNo === 1 ? `${catalogBase}/1` : baseUrl;
                    const cacheBust = (u) => `${u}${u.includes('?') ? '&' : '?'}nd_ts=${Date.now()}_${attempt}`;
                    const candidates = [baseUrl, backupUrl];

                    for (const rawUrl of candidates) {
                        const testUrls = [rawUrl, cacheBust(rawUrl)];
                        for (const pageUrl of testUrls) {
                            // 1) ưu tiên fetch của trang hiện tại để chắc chắn kèm cookie phiên
                            try {
                                const res = await fetch(pageUrl, { credentials: 'include', cache: 'no-store' });
                                const html = await res.text();
                                const d = parser.parseFromString(html, 'text/html');
                                if (hasCatalogChapters(d)) return d;
                            } catch (e) {
                                // thử cách tiếp theo
                            }

                            // 2) fallback dùng helper cũ
                            try {
                                const html = await fetchPageContent(pageUrl, '.catalog');
                                const d = parser.parseFromString(html, 'text/html');
                                if (hasCatalogChapters(d)) return d;
                            } catch (e) {
                                // thử cách tiếp theo
                            }
                        }
                    }

                    throw new Error(`Catalog page ${pageNo} không có chapter list`);
                };

                const detectCatalogPageNo = (d) => {
                    if (!d || !d.querySelector) return null;
                    const select = d.querySelector('.catalog-title .pagelist,.chapter_page .pagelist');
                    if (select) {
                        const sv = parseInt(select.value, 10);
                        if (Number.isFinite(sv) && sv > 0) return sv;
                        const opt = select.querySelector('option[selected]');
                        if (opt) {
                            const ov = parseInt(opt.value, 10);
                            if (Number.isFinite(ov) && ov > 0) return ov;
                        }
                    }
                    return null;
                };

                const fetchCatalogDocRetry = async (pageNo, retries = 4) => {
                    let lastErr;
                    for (let i = 0; i <= retries; i++) {
                        try {
                            const d = await fetchCatalogDoc(pageNo, i);
                            const actual = detectCatalogPageNo(d);
                            const chapterCount = extractChaptersFromDoc(d).length;
                            console.log(`[1qxs] catalog page req=${pageNo}, actual=${actual || 'n/a'}, chapters=${chapterCount}`);
                            if (chapterCount > 0) return d;
                            lastErr = new Error(`Catalog page ${pageNo} chapterCount=0`);
                        } catch (e) {
                            lastErr = e;
                        }
                        if (i < retries) await sleep(400 + i * 300);
                    }
                    throw lastErr || new Error(`Không tải được catalog page ${pageNo}`);
                };

                const extractChaptersFromDoc = (pageDoc) => {
                    const list = [];
                    const anchors = Array.from(pageDoc.querySelectorAll('.catalog ul a[href]'));
                    anchors.forEach((a) => {
                        const hrefRaw = (a.getAttribute('href') || '').split('?')[0];
                        const cm = hrefRaw.match(chapterHrefRe);
                        if (!cm) return;

                        const chapterId = parseInt(cm[1], 10);
                        let title = '';
                        const p = a.querySelector('p.line_1') || a.querySelector('p');
                        if (p) title = p.textContent || '';
                        else title = a.textContent || '';
                        title = title.replace(/^\s*\d+\s*/, '').replace(/\s+/g, ' ').trim();
                        if (!title) return;

                        list.push({
                            chapterId,
                            title,
                            url: new URL(hrefRaw, origin).href,
                        });
                    });
                    return list;
                };

                const chapterMap = new Map();
                const pushChapters = (arr) => {
                    for (const chap of arr) {
                        if (!chapterMap.has(chap.url)) chapterMap.set(chap.url, chap);
                    }
                };

                const inferMaxChapterIdFromDoc = (d) => {
                    if (!d || !d.querySelectorAll) return 0;
                    let maxId = 0;
                    const reAbs = new RegExp(`/xs_${siteType}/${bookId}/(\\d+)/?`);
                    Array.from(d.querySelectorAll('a[href]')).forEach((a) => {
                        const href = a.getAttribute('href') || '';
                        const m = href.match(reAbs);
                        if (m) {
                            const id = parseInt(m[1], 10);
                            if (Number.isFinite(id) && id > maxId) maxId = id;
                        }
                    });
                    return maxId;
                };

                let firstDoc;
                let firstDocPage;
                if (isCatalogDoc(doc) && Number.isFinite(currentCatalogPage)) {
                    firstDoc = doc;
                    firstDocPage = currentCatalogPage;
                } else {
                    try {
                        firstDoc = await fetchCatalogDocRetry(1);
                        firstDocPage = 1;
                    } catch (err) {
                        console.error('[1qxs] Không tải được trang mục lục:', err);
                        // fallback mềm: vẫn render các link chapter hiện có trên trang hiện tại
                        const fallback = [];
                        const re = new RegExp(`/xs_${siteType}/${bookId}/(\\d+)/?`);
                        Array.from(document.querySelectorAll('a[href]')).forEach((a) => {
                            const hrefRaw = (a.getAttribute('href') || '').split('?')[0];
                            const m = hrefRaw.match(re);
                            if (!m) return;
                            const titleText = (a.textContent || '').replace(/^\s*\d+\s*/, '').replace(/\s+/g, ' ').trim();
                            if (!titleText) return;
                            fallback.push({ chapterId: parseInt(m[1], 10), title: titleText, url: new URL(hrefRaw, origin).href });
                        });
                        const fallbackList = Array.from(new Map(fallback.map((i) => [i.url, i])).values())
                            .sort((a, b) => (a.chapterId || 0) - (b.chapterId || 0))
                            .map(({ chapterId, ...rest }) => rest);
                        if (fallbackList.length) renderManualCatalog(fallbackList);
                        return fallbackList;
                    }
                }

                const collectPageNumbersFromDoc = (d) => {
                    const out = new Set();
                    if (!d || !d.querySelectorAll) return out;

                    Array.from(d.querySelectorAll('.catalog-title .pagelist option,.chapter_page .pagelist option')).forEach((opt) => {
                        const v = parseInt(opt.value, 10);
                        if (Number.isFinite(v) && v > 0) out.add(v);
                    });

                    Array.from(d.querySelectorAll('.chapter_page a.next[href],.chapter_page a.last[href],.catalog-title a[href]')).forEach((a) => {
                        const href = a.getAttribute('href') || '';
                        const m = href.match(catalogPageHrefRe);
                        if (m) {
                            const v = parseInt(m[1], 10);
                            if (Number.isFinite(v) && v > 0) out.add(v);
                        }
                    });

                    const cur = detectCatalogPageNo(d);
                    if (Number.isFinite(cur) && cur > 0) out.add(cur);
                    return out;
                };

                const startPage = (Number.isFinite(firstDocPage) && firstDocPage > 0) ? firstDocPage : 1;
                const pagesToVisit = new Set([1, startPage]);
                collectPageNumbersFromDoc(firstDoc).forEach((p) => pagesToVisit.add(p));
                pushChapters(extractChaptersFromDoc(firstDoc));

                // fallback mạnh: suy ra tổng trang từ chapterId lớn nhất thấy được
                const inferredMaxId = Math.max(
                    inferMaxChapterIdFromDoc(firstDoc),
                    inferMaxChapterIdFromDoc(doc),
                );
                if (inferredMaxId > 0) {
                    const inferredPages = Math.ceil(inferredMaxId / 100);
                    for (let p = 1; p <= inferredPages; p++) pagesToVisit.add(p);
                }

                const loadedPages = new Set([startPage]);
                let expanded = true;
                while (expanded) {
                    expanded = false;
                    const pending = Array.from(pagesToVisit).filter((p) => !loadedPages.has(p)).sort((a, b) => a - b);
                    for (const pageNo of pending) {
                        loadedPages.add(pageNo);
                        let pageDoc = null;
                        try {
                            pageDoc = await fetchCatalogDocRetry(pageNo);
                        } catch (err) {
                            console.warn(`[1qxs] Lỗi tải trang mục lục ${pageNo}:`, err);
                        }
                        if (!pageDoc) continue;

                        pushChapters(extractChaptersFromDoc(pageDoc));
                        const discovered = collectPageNumbersFromDoc(pageDoc);
                        discovered.forEach((p) => {
                            if (!pagesToVisit.has(p)) {
                                pagesToVisit.add(p);
                                expanded = true;
                            }
                        });
                        await sleep(delayMs);
                    }
                }

                const chapters = Array.from(chapterMap.values())
                    .sort((a, b) => (a.chapterId || 0) - (b.chapterId || 0))
                    .map(({ chapterId, ...rest }) => rest);

                if (!chapters.length) return [];

                renderManualCatalog(chapters);

                return chapters;
            },

            deal: async (chapter) => {
                const m = String(chapter.url || '').match(/\/xs_(\d+)\/(\d+)\/(\d+)(?:\/\d+)?\/?$/);
                if (!m) return { title: chapter.title || '', content: '' };

                const siteType = m[1];
                const bookId = m[2];
                const chapterId = m[3];
                const chapterRoot = `${window.location.origin}/xs_${siteType}/${bookId}/${chapterId}`;
                const nextInSameChapterRe = new RegExp(`/xs_${siteType}/${bookId}/${chapterId}/\\d+/?(?:\\?.*)?$`);
                const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
                const delayMs = 200;

                function decodePKey(base64Text) {
                    if (!base64Text) return '';
                    try {
                        const binary = atob(base64Text);
                        const bytes = new Uint8Array(binary.length);
                        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                        return new TextDecoder('utf-8').decode(bytes);
                    } catch (e) {
                        try {
                            return decodeURIComponent(escape(atob(base64Text)));
                        } catch (e2) {
                            return '';
                        }
                    }
                }

                function htmlToCleanText(rawHtml) {
                    const tmp = document.createElement('div');
                    tmp.innerHTML = rawHtml || '';
                    Array.from(tmp.querySelectorAll('script,style,iframe,button')).forEach((n) => n.remove());

                    const normalizeLine = (s) => (s || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
                    const ignoreLine = (lineRaw) => {
                        const line = normalizeLine(lineRaw);
                        if (!line) return true;
                        const t = line.replace(/\|/g, '');
                        if (/小说免费阅读，请收藏/.test(t)) return true;
                        if (/阅读模式|畅读模式|无法显示本章节全部内容|返回原网页阅读|加载更多/.test(t)) return true;
                        return false;
                    };

                    const pLines = Array.from(tmp.querySelectorAll('p'))
                        .map((p) => normalizeLine(p.textContent))
                        .filter((line) => !ignoreLine(line));
                    if (pLines.length) return pLines.join('\n\n');

                    const text = normalizeLine(tmp.textContent || '');
                    return ignoreLine(text) ? '' : text;
                }

                function extractTitle(docObj) {
                    const raw = (docObj.title || '').trim();
                    if (!raw) return '';
                    return raw.replace(/\s*-\s*.*$/, '').trim();
                }

                let currentUrl = chapterRoot;
                let mainTitle = chapter.title || '';
                const visited = new Set();
                const chunks = [];
                const maxPages = 80;

                for (let pageCount = 0; pageCount < maxPages; pageCount++) {
                    if (!currentUrl || visited.has(currentUrl)) break;
                    visited.add(currentUrl);

                    let html;
                    try {
                        html = await fetchPageContent(currentUrl, '.content');
                    } catch (err) {
                        console.error('[1qxs.deal] Lỗi tải trang chương:', currentUrl, err);
                        break;
                    }

                    const pageDoc = new DOMParser().parseFromString(html, 'text/html');
                    if (!mainTitle) {
                        mainTitle = extractTitle(pageDoc) || mainTitle;
                    } else if (pageCount === 0) {
                        const t = extractTitle(pageDoc);
                        if (t) mainTitle = t;
                    }

                    const contentNode = pageDoc.querySelector('#main .content,.content');
                    const visibleHtml = contentNode ? contentNode.innerHTML : '';
                    let pageText = htmlToCleanText(visibleHtml);

                    // Ưu tiên nội dung đang hiển thị trên web; chỉ fallback p_key khi trang hiển thị rỗng/thiếu
                    if (!pageText || pageText.length < 30) {
                        const pKeyMatch = html.match(/p_key='([^']+)'/);
                        if (pKeyMatch && pKeyMatch[1]) {
                            const decodedText = htmlToCleanText(decodePKey(pKeyMatch[1]));
                            if (decodedText && decodedText.length > (pageText || '').length) {
                                pageText = decodedText;
                            }
                        }
                    }

                    if (pageText && chunks[chunks.length - 1] !== pageText) {
                        chunks.push(pageText);
                    }

                    const nextLink = pageDoc.querySelector('#main .page .right a[href]');
                    if (!nextLink) break;
                    const nextHref = nextLink.getAttribute('href') || '';
                    const nextUrl = nextHref ? new URL(nextHref, currentUrl).href : '';
                    if (!nextInSameChapterRe.test(nextUrl)) break;

                    currentUrl = nextUrl;
                    await sleep(delayMs);
                }

                const content = chunks.join('\n\n').trim();
                if (!content) throw new Error('[1qxs.deal] Không lấy được nội dung chương');

                return {
                    title: mainTitle || chapter.title || '',
                    content,
                };
            },
        }
// @rule-end
)
