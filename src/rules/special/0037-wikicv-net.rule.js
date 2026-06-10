// @rule-name: TruyenWikiDich
// @rule-source: special
(
// @rule-begin
        {
            siteName: 'TruyenWikiDich',
            filter: () => {
                if (!window.location.host.includes('wikicv.net')) return 0;
                if (window.location.pathname.match(/^\/truyen\/[^\/]+\/chuong-/)) return 2;
                if (window.location.pathname.match(/^\/truyen\/[^\/]+$/)) return 1;
                return 0;
            },

            title: '.cover-info h2',
            writer: 'p:contains("Tác giả:") > a',
            intro: '.book-desc-detail',
            cover: () => { return 'https://wikicv.net' + $('.cover-wrapper img').attr('src') },

            getChapters: async (doc) => {
                // 1. Kiểm tra đăng nhập và quyền hạn
                if ($('a[data-action="login"]').length > 0) {
                    alert('Lỗi: Bạn cần đăng nhập vào Wikidich và là người đăng hoặc đồng quản lý của truyện này để tải nội dung.');
                    return [];
                }
                const currentUserHref = $('#ddUser a[href*="/user/"]').first().attr('href');
                if (!currentUserHref) {
                    alert('Lỗi: Không thể xác định người dùng hiện tại. Hãy chắc chắn bạn đã đăng nhập.');
                    return [];
                }
                const currentUserId = decodeURIComponent(currentUserHref.split('/').pop());
                const managers = $('.book-manager').map((i, el) => $(el).data('id')).get();
                if (!managers.includes(currentUserId)) {
                    alert('Lỗi: Bạn không phải là người đăng hoặc đồng quản lý của truyện này. Không thể tải nội dung gốc.');
                    return [];
                }

                console.log('Xác thực người dùng thành công. Bắt đầu tải danh sách chương từ API...');

                const html = doc.documentElement.outerHTML;
                const bookId = doc.querySelector("input#bookId")?.value || doc.querySelector('input[name="bookId"]')?.value || html.match(/bookId\s*=\s*["']([^"']+)/)?.[1];
                const size = parseInt(html.match(/loadBookIndex\(\s*0\s*,\s*(\d+)/)?.[1] || html.match(/data-size=["'](\d+)/)?.[1] || 500, 10) || 500;
                const signKey = html.match(/signKey\s*=\s*"(.*?)"/)?.[1];
                const fuzzySignFuncStr = html.match(/function\s+fuzzySign\s*\([^)]*\)\s*\{[\s\S]*?\}/)?.[0];

                if (!bookId || !signKey) {
                    alert("Lỗi: Không tìm thấy thông tin (bookId, signKey) để gọi API. Cấu trúc trang có thể đã thay đổi.");
                    return [];
                }

                const makeFuzzySign = () => {
                    if (typeof unsafeWindow.fuzzySign === 'function') {
                        return (text) => unsafeWindow.fuzzySign(String(text));
                    }
                    const rotateMatch = (fuzzySignFuncStr || html).match(/\.substring\(\s*(\d+)\s*\)\s*\+\s*\w+\.substring\(\s*0\s*,?\s*\1?\s*\)/);
                    if (rotateMatch) {
                        const shift = parseInt(rotateMatch[1], 10);
                        return (text) => {
                            const value = String(text);
                            return value.slice(shift) + value.slice(0, shift);
                        };
                    }
                    if (fuzzySignFuncStr) {
                        try {
                            const fn = new Function(`${fuzzySignFuncStr}; return fuzzySign;`)();
                            if (typeof fn === 'function') return (text) => fn(String(text));
                        } catch (e) {
                            console.warn('[Wikidich Rule] Không chạy được fuzzySign lấy từ trang, dùng chuỗi gốc.', e);
                        }
                    }
                    return (text) => String(text);
                };
                const fuzzySign = makeFuzzySign();

                const genSign = (start, pageSize) => {
                    const fuzzyText = fuzzySign(`${signKey}${start}${pageSize}`);
                    if (typeof unsafeWindow.signFunc === 'function') return unsafeWindow.signFunc(fuzzyText);
                    const crypto = typeof CryptoJS !== 'undefined' ? CryptoJS : unsafeWindow.CryptoJS;
                    if (!crypto?.SHA256) throw new Error('Không tìm thấy CryptoJS.SHA256 để tạo sign.');
                    return crypto.SHA256(fuzzyText).toString(crypto.enc.Hex);
                };

                const getChapterInPage = async (currentPage) => {
                    const sign = genSign(currentPage, size);
                    const params = new URLSearchParams({ bookId, signKey, sign, size, start: currentPage.toFixed(0) });
                    const url = `${window.location.origin}/book/index?${params}`;
                    console.log(`[Wikidich Rule] Tải mục lục start=${currentPage}: ${url}`);
                    const res = await xhr.sync(url, null, {
                        method: 'GET',
                        responseType: 'text',
                        headers: { 'X-Requested-With': 'XMLHttpRequest' }
                    });
                    const responseText = res.responseText || res.response || '';
                    if (!String(responseText).trim()) throw new Error(`API mục lục trả về rỗng tại start=${currentPage}.`);
                    return new DOMParser().parseFromString(`<html><body>${responseText}</body></html>`, 'text/html');
                };

                const allChapters = [];
                const seenUrls = new Set();
                let currentPage = 0;
                const maxPages = 200;

                for (let pageNo = 0; pageNo < maxPages; pageNo++) {
                    let pageDoc;
                    try {
                        console.log(`Đang tải trang mục lục, bắt đầu từ: ${currentPage}...`);
                        pageDoc = await getChapterInPage(currentPage);
                    } catch (err) {
                        alert(`Lỗi khi tải trang mục lục: ${err.message}`);
                        break;
                    }

                    const chapterLinks = $(pageDoc).find("li.chapter-name a[href], ul#chapters li a[href], .chapter-name a[href]");
                    if (chapterLinks.length === 0) {
                        console.log("Không tìm thấy chương nào trên trang này, kết thúc.");
                        break;
                    }

                    let addedCount = 0;
                    chapterLinks.each((_, el) => {
                        let link = $(el).attr('href') || $(el).attr('data-href') || '';
                        if (!link) return;
                        const chapterUrl = new URL(link, window.location.origin).href;
                        if (seenUrls.has(chapterUrl)) return;
                        seenUrls.add(chapterUrl);
                        allChapters.push({
                            title: $(el).text().trim(),
                            url: chapterUrl,
                        });
                        addedCount++;
                    });

                    if (addedCount === 0) {
                        console.log("Trang mục lục không có chương mới, kết thúc để tránh lặp vô hạn.");
                        break;
                    }

                    const starts = $(pageDoc).find("ul.pagination a[data-start]").toArray()
                        .map((a) => parseInt($(a).attr('data-start'), 10))
                        .filter((n) => Number.isFinite(n) && n >= 0);
                    const lastStart = starts.length ? Math.max(...starts) : currentPage;
                    const nextStart = starts.filter((n) => n > currentPage).sort((a, b) => a - b)[0];

                    if (chapterLinks.length < size || currentPage >= lastStart || !Number.isFinite(nextStart)) {
                        console.log("Đã đạt hoặc vượt qua trang cuối cùng, kết thúc.");
                        break;
                    }

                    currentPage = nextStart;
                }

                if (allChapters.length >= maxPages * size) {
                    console.warn(`[Wikidich Rule] Đã chạm giới hạn ${maxPages} trang mục lục, dừng để tránh vòng lặp vô hạn.`);
                }


                // 4. Hiển thị danh sách chương đã lấy được lên giao diện
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

            deal: async (chapter) => {
                const editUrl = chapter.url + '/chinh-sua';
                try {
                    const res = await xhr.sync(editUrl, null, { method: 'GET', responseType: 'document' });
                    const doc = res.response;

                    const chineseTitle = $(doc).find('input#txtNameCn').val();
                    const chineseContent = $(doc).find('textarea#txtContentCn').val();

                    if (typeof chineseContent !== 'string') {
                        throw new Error("Không tìm thấy nội dung tiếng Trung trên trang chỉnh sửa.");
                    }

                    return {
                        title: chineseTitle,
                        content: chineseContent
                    };
                } catch (error) {
                    console.error(`Lỗi khi tải nội dung từ ${editUrl}:`, error);
                    return {
                        title: chapter.title + " (Lỗi Tải)",
                        content: "Không thể tải nội dung tiếng Trung. Vui lòng kiểm tra lại quyền truy cập hoặc thử lại sau."
                    };
                }
            }
        }
// @rule-end
)
