// @rule-name: 小說之家 (xszj.org)
// @rule-source: special
(
// @rule-begin

        {
            siteName: '小說之家 (xszj.org)',
            url: /xszj\.org\/b\/\d+/,
            chapterUrl: /xszj\.org\/b\/\d+\/c\/\d+/,
            infoPage: '.con_top > a[href^="/b/"]',
            title: '#info > h1',
            writer: '#info > p:contains("作者") > a',
            intro: '#intro',
            cover: '#fmimg > img',
            // chapterTitle: 'h1.bookname',
            getChapters: async (doc) => {
                function getBookId(url) {
                    const u = new URL(url);
                    const parts = u.pathname.split('/').filter(Boolean);
                    // parts = ["b", "257859", "c", "779783"]  hoặc ["b", "257859"] …
                    if (parts[0] === 'b' && parts.length >= 2) {
                        return parts[1];
                    }
                    return null;
                }
                async function getHTML(url) {
                    const res = await fetch(url);
                    const text = await res.text();
                    return new DOMParser().parseFromString(text, "text/html");
                }

                const bookId = getBookId(window.location.href);
                let pathname = `/b/${bookId}/cs/1`;
                const allChapters = [];
                let currentPage = 1;


                while (true) {
                    let url = window.location.origin + pathname;
                    let pageDoc;
                    try {
                        console.log(`Đang tải trang mục lục, trang số ${currentPage}...`);
                        pageDoc = await getHTML(url);
                    } catch (err) {
                        alert(`Lỗi khi tải trang mục lục: ${err.message}`);
                        break;
                    }

                    let chapterLinks = $(pageDoc).find("#list #content_1 a[href]");
                    if (chapterLinks.length === 0 && allChapters.length > 0) {
                        console.log("Không tìm thấy chương nào trên trang này, kết thúc.");
                        break;
                    }

                    chapterLinks.each((_, el) => {
                        allChapters.push({
                            title: $(el).find("dd").text().trim(),
                            url: new URL($(el).attr('href'), window.location.origin).href,
                        });
                    });

                    let $select = $(pageDoc).find("#indexselect");
                    if ($select.length === 0) {
                        console.log("Không tìm thấy trang tiếp theo! Kết thúc!");
                        break;
                    }

                    let $opts = $select.find("option");
                    if ($opts.length === 0) {
                        console.log("Không có option nào trong select! Kết thúc!");
                        break;
                    }

                    let idx = $opts.toArray().findIndex(o => o.selected);
                    if (idx === -1) idx = 0;

                    if (idx < $opts.length - 1) {
                        pathname = $opts.eq(idx + 1).val();
                    } else {
                        console.log("Hoàn tất lấy mục lục!");
                        break;
                    }
                    currentPage++;
                    if (Config.delayBetweenChapters > 0) {
                        console.log(`%cĐang chờ ${Config.delayBetweenChapters / 1000} giây... trước khi tiếp tục.`, "color: orange");
                        await sleep(Config.delayBetweenChapters);
                    }
                }

                const container = document.createElement("div");
                container.id = "wikidich-chapter-container";
                container.style = "padding: 16px; border: 1px solid #ccc; background: #fff; max-width: 800px; margin: 20px auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1);";
                container.innerHTML = `<h2 style="text-align:center; color: #1a73e8;">📖 Danh sách chương (${allChapters.length} chương - tải từ API)</h2>`;

                allChapters.forEach((chap, index) => {
                    const link = document.createElement("a");
                    link.href = chap.url;
                    link.innerText = chap.title;
                    link.setAttribute("novel-downloader-chapter", "");
                    link.setAttribute("order", index + 1);
                    link.style = "display: block; padding: 8px 12px; margin: 5px 0; border-left: 4px solid #2196F3; text-decoration: none; color: #333; background-color: #f9f9f9; border-radius: 4px;";
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

                return allChapters;
            },
            //content: '[class="chapter-content px-3 pb-5"] > .content',
            deal: async (chapter) => {
                const delayMs =
                    typeof Config !== 'undefined' && Number(Config.delayBetweenChapters) > 0
                        ? Number(Config.delayBetweenChapters)
                        : 500;

                async function getHTML(url) {
                    const res = await fetch(url);
                    const text = await res.text();
                    return new DOMParser().parseFromString(text, 'text/html');
                }

                console.log('[xszj.org] start deal:', chapter && (chapter.title || chapter.url));

                let combinedText = '';
                let cur = chapter.url;
                let pagesFetched = 0;

                // đảm bảo url tuyệt đối
                try {
                    cur = new URL(cur, window.location.origin).href;
                } catch (e) {
                    console.warn('[xszj.org] URL base error, dùng nguyên chapter.url:', e);
                }

                while (true) {
                    console.log('[xszj.org] fetch page:', cur);
                    let doc;
                    try {
                        doc = await getHTML(cur);
                    } catch (err) {
                        console.error('[xszj.org] fetch error:', err);
                        break;
                    }

                    // ======== LẤY NỘI DUNG CHÍNH ========
                    let contentRoot = doc.querySelector('#booktxt') || doc.querySelector('#content');

                    let pageText = '';

                    if (contentRoot) {
                        const ps = contentRoot.querySelectorAll('p');

                        if (ps.length > 0) {
                            pageText = Array.from(ps)
                                .map(p =>
                                    p.textContent
                                        .replace(/\s+/g, ' ')
                                        .trim()
                                )
                                .filter(Boolean)
                                .join('\n'); // mỗi <p> 1 dòng
                        } else {
                            // fallback: lấy luôn text trong contentRoot
                            pageText = contentRoot.textContent
                                .replace(/\s+/g, ' ')
                                .trim();
                        }

                        // chuẩn hóa xuống dòng chỉ dùng \n
                        pageText = pageText.replace(/\r\n/g, '\n');
                    }

                    if (pageText) {
                        combinedText += (combinedText ? '\n' : '') + pageText;
                    }

                    const nav = doc.querySelector('.bottem1');
                    let nextHref = null;

                    if (nav) {
                        const links = Array.from(nav.querySelectorAll('a'));

                        // ưu tiên link có text "下一页"
                        const nextByText = links.find(a => a.textContent.includes('下一页'));
                        if (nextByText) {
                            nextHref = nextByText.getAttribute('href') || null;
                        } else if (links.length > 0) {
                            // fallback: thử thẻ <a> cuối cùng nếu có ?page=
                            const lastHref = links[links.length - 1].getAttribute('href') || '';
                            if (lastHref.includes('?page=')) {
                                nextHref = lastHref;
                            }
                        }
                    }

                    // nếu không có next, hoặc next không có ?page= => dừng
                    if (!nextHref || !nextHref.includes('?page=')) {
                        console.log('[xszj.org] no more ?page=, done. pagesFetched =', pagesFetched + 1);
                        break;
                    }

                    // build url tuyệt đối cho trang tiếp theo
                    cur = new URL(nextHref, cur).href;
                    pagesFetched++;

                    // delay giữa các page để tránh spam
                    if (delayMs > 0) {
                        await sleep(delayMs);
                    }
                }

                return combinedText.trim(); // chỉ trả về content hoàn chỉnh
            },

        }
// @rule-end
)
