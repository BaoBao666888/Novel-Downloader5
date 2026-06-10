// @rule-name: 短篇小說 (oop.tw)
// @rule-source: special
(
// @rule-begin

        {
            siteName: '短篇小說 (oop.tw)',
            filter: () => {
                const h = window.location.host;
                if (h !== 'www.oop.tw') return 0;
                const path = window.location.pathname;
                if (/^\/abooka\/a\d+a\/$/.test(path)) return 1;   // trang mục lục (book page)
                if (/^\/areada\/a\d+a\/a\d+(?:_\d+)?a\.html$/.test(path)) return 2;  // trang chương
                return 0;
            },
            url: /www\.oop\.tw\/abooka\/a\d+a\//,
            chapterUrl: /www\.oop\.tw\/areada\/a\d+a\/a\d+(?:_\d+)?a\.html/,
            title: 'h1.novel-title',
            writer: '.novel-author a',
            intro: '.intro',
            cover: '.novel-cover img',
            chapter: '#ul_all_chapters .chapter-item a',
            chapterTitle: 'h1.chapter-title',
            deal: async (chapter) => {
                const sleep = ms => new Promise(res => setTimeout(res, ms));
                const delayMs = (typeof Config !== 'undefined' && Number(Config.delayBetweenChapters) > 0)
                    ? Number(Config.delayBetweenChapters)
                    : 500;

                async function fetchDoc(url) {
                    const res = await fetch(url, { credentials: 'include' });
                    const text = await res.text();
                    return new DOMParser().parseFromString(text, 'text/html');
                }

                console.log('[oop.tw] start deal:', chapter && (chapter.title || chapter.url));

                // fetch trang đầu tiên
                let firstUrl = chapter.url;
                try { firstUrl = new URL(firstUrl, window.location.origin).href; } catch (e) { /* giữ nguyên */ }

                let firstDoc;
                try {
                    firstDoc = await fetchDoc(firstUrl);
                } catch (err) {
                    console.error('[oop.tw] fetch error:', err);
                    return { title: chapter.title || '', content: '' };
                }

                // lấy title (bỏ phần pager nếu có)
                let mainTitle = chapter.title || '';
                const tnode = firstDoc.querySelector('h1.chapter-title');
                if (tnode) {
                    mainTitle = tnode.textContent.trim().replace(/[（(]\s*\d+\s*[\/／]\s*\d+\s*[)）]$/, '').trim() || mainTitle;
                }

                // lấy tất cả URLs của các page con từ <select id="page-select">
                const pageUrls = [];
                const selectEl = firstDoc.querySelector('#page-select');
                if (selectEl) {
                    const options = Array.from(selectEl.querySelectorAll('option'));
                    options.forEach(opt => {
                        const val = opt.getAttribute('value');
                        if (val) {
                            pageUrls.push(new URL(val, firstUrl).href);
                        }
                    });
                }

                // nếu không tìm thấy page selector, chỉ dùng trang hiện tại
                if (pageUrls.length === 0) {
                    pageUrls.push(firstUrl);
                }

                // fetch từng trang và ghép nội dung
                let combinedText = '';
                for (let i = 0; i < pageUrls.length; i++) {
                    const pageUrl = pageUrls[i];
                    console.log(`[oop.tw] fetch page ${i + 1}/${pageUrls.length}:`, pageUrl);

                    let doc;
                    if (i === 0 && pageUrl === firstUrl) {
                        doc = firstDoc; // dùng lại doc đã fetch
                    } else {
                        try {
                            if (delayMs > 0) await sleep(delayMs);
                            doc = await fetchDoc(pageUrl);
                        } catch (err) {
                            console.error('[oop.tw] fetch page error:', err);
                            continue;
                        }
                    }

                    const article = doc.querySelector('article#article');
                    if (article) {
                        // loại bỏ script, style, ads
                        Array.from(article.querySelectorAll('script,style,iframe,div')).forEach(n => n.remove());

                        const ps = Array.from(article.querySelectorAll('p'));
                        const pageText = ps
                            .map(p => p.textContent.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim())
                            .filter(line => {
                                if (!line) return false;
                                // bỏ dòng quảng cáo / tag content rỗng
                                if (/^\s*$/.test(line)) return false;
                                if (/^<content>/.test(line)) return false;
                                return true;
                            })
                            .join('\n');

                        if (pageText) {
                            combinedText += (combinedText ? '\n' : '') + pageText;
                        }
                    }
                }

                // remove leading title line if duplicate
                const lines = combinedText.split(/\r?\n/);
                if (lines.length && lines[0].trim()) {
                    const firstLine = lines[0].trim();
                    const cleanedTitle = (mainTitle || '').replace(/[^\w\u4e00-\u9fff]/g, '');
                    const cleanedFirst = firstLine.replace(/[^\w\u4e00-\u9fff]/g, '');
                    if (cleanedFirst === cleanedTitle) {
                        lines.shift();
                        combinedText = lines.join('\n');
                    }
                }

                console.log('[oop.tw] done:', mainTitle, 'pages=', pageUrls.length, 'len=', (combinedText || '').length);
                return { title: mainTitle, content: combinedText.trim() };
            },
        }
// @rule-end
)
