// @rule-name: 第一版主 (diyibanzhu)
// @rule-source: special
(
// @rule-begin
        {
            siteName: '第一版主 (diyibanzhu)',
            filter: () => {
                if (!window.location.host.includes('diyibanzhu.me')) return 0;
                const params = new URLSearchParams(window.location.search);
                if (params.get('action') === 'list') return 1;
                if (params.get('action') === 'article') return 2;
                return 0;
            },
            title: '.mod.detail .right > h1',
            writer: (doc) => $('.mod.detail .right p.info', doc).text().match(/作者：(.*?)\s/)?.[1].trim() || '',
            intro: '.mod.book-intro > .bd',
            cover: (doc) => {
                const img = $('.mod.detail .left img', doc);
                return img.length ? new URL(img.attr('src'), window.location.origin).href : '';
            },

            // Hàm helper để xử lý Cloudflare, sẽ được tái sử dụng
            _fetchDiyibanzhuPage: async function (url, verificationSelector) {
                console.log(`[diyibanzhu] Sử dụng fetchPageContent cho: ${url}`);
                // Gọi hàm fetchPageContent toàn cục đã thêm vào script ở các bước trước
                async function fetchDiyibanzhuPage(url, selector) {
                    console.log(`[fetchPageContent] Đang thử tải URL: ${url}`);
                    try {
                        const res = await fetch(url, { credentials: "include" }); // gửi cookie phiên hiện tại
                        const html = await res.text();
                        if (!html.includes('<title>Just a moment...</title>') &&
                            !html.includes('challenge-platform')) {
                            console.log("[fetchPageContent] Tải qua fetch+cookie thành công.");
                            return html;
                        } else {
                            console.warn("[fetchPageContent] fetch+cookie gặp Cloudflare.");
                        }
                    } catch (err) {
                        console.warn("[fetchPageContent] fetch+cookie lỗi:", err);
                    }
                    console.warn("[fetchPageContent] Chuyển sang phương thức popup...");
                    alert("Trang web được bảo vệ bởi Cloudflare. Một cửa sổ nhỏ sẽ được mở để xác thực. Vui lòng không đóng nó cho đến khi hoàn tất.");

                    return new Promise((resolve, reject) => {
                        const popup = window.open(url, '_blank', 'width=500,height=600,resizable=yes,scrollbars=yes');
                        if (!popup) {
                            alert("Vui lòng cho phép trang web này mở cửa sổ Pop-up để có thể vượt qua lớp bảo vệ!");
                            return reject("Cửa sổ Pop-up đã bị chặn.");
                        }

                        const checkInterval = setInterval(() => {
                            try {
                                if (popup.closed) {
                                    clearInterval(checkInterval);
                                    return reject("Cửa sổ xác thực đã bị đóng thủ công.");
                                }

                                if (popup.document.readyState === 'complete') {
                                    if (!selector || popup.document.querySelector(selector)) {
                                        clearInterval(checkInterval);
                                        const html = popup.document.documentElement.outerHTML;
                                        popup.close();
                                        console.log("[fetchPageContent] Đã lấy nội dung thành công qua popup.");
                                        resolve(html);
                                    }
                                }
                            } catch (e) {
                                // Cross-origin khi đang chuyển trang
                            }
                        }, 500);

                        setTimeout(() => {
                            clearInterval(checkInterval);
                            if (popup && !popup.closed) popup.close();
                            reject("Hết thời gian chờ xác thực Cloudflare (30 giây).");
                        }, 30000);
                    });
                }

                const html = await fetchDiyibanzhuPage(url, verificationSelector);

                // Kiểm tra lỗi chặn IP (Error 1005)
                if (html.includes('Access denied') && html.includes('Error 1005')) {
                    alert('Lỗi 1005: Trang web đã chặn IP hoặc nhà mạng của bạn.\n\nVui lòng thử đổi mạng hoặc sử dụng VPN khác và thử lại.');
                    throw new Error('IP Banned by Cloudflare (Error 1005)');
                }
                return html;
            },

            getChapters: async function () { // Đổi thành function() để có thể gọi this
                console.log("%c[diyibanzhu] Bắt đầu lấy danh sách chương...", "color: blue;");

                let allChapters = [];
                let currentUrl = window.location.href;
                const visitedUrls = new Set();
                let pageCount = 1;

                try {
                    while (currentUrl && !visitedUrls.has(currentUrl)) {
                        visitedUrls.add(currentUrl);
                        console.log(`%c[diyibanzhu] Đang tải trang mục lục số ${pageCount++}: ${currentUrl}`, "color: green;");
                        const html = await this._fetchDiyibanzhuPage(currentUrl, '.mod.chapter-list:last-of-type .list');
                        const doc = new DOMParser().parseFromString(html, 'text/html');

                        const chapterLinks = $(doc).find('.mod.chapter-list:last .list > li > a');
                        chapterLinks.each((_, a) => {
                            allChapters.push({
                                title: $(a).text().trim(),
                                url: new URL($(a).attr('href'), window.location.origin).href
                            });
                        });

                        const nextPageLink = $(doc).find('.pagelistbox a.nextPage');
                        if (nextPageLink.length > 0) {
                            currentUrl = new URL(nextPageLink.attr('href'), window.location.origin).href;
                            if (Config.delayBetweenChapters > 0) {
                                console.log(`%c[diyibanzhu] Chờ ${Config.delayBetweenChapters}ms...`, "color: orange;");
                                await new Promise(resolve => setTimeout(resolve, Config.delayBetweenChapters));
                            }
                        } else {
                            currentUrl = null;
                        }
                    }
                } catch (error) {
                    console.error(`%c[diyibanzhu] getChapters thất bại: ${error.message}`, "color: red;");
                    return []; // Trả về mảng rỗng nếu có lỗi
                }

                console.log(`%c[diyibanzhu] Đã tải xong tất cả các trang mục lục. Tổng số chương: ${allChapters.length}`, "color: blue; font-weight: bold;");

                // Phần tạo bảng tùy chỉnh giữ nguyên
                const container = document.createElement("div");
                container.id = "diyibanzhu-chapter-container";
                container.style = "padding: 16px; border: 1px solid #ccc; border-radius: 8px; background: #f9f9f9; max-width: 800px; margin: 20px auto; box-shadow: 0 2px 5px rgba(0,0,0,0.1);";
                container.innerHTML = `<h2 style="text-align:center; color: #337ab7; margin-bottom: 15px;">📖 Danh sách chương (tải từ tất cả các trang)</h2>`;
                allChapters.forEach((chap, index) => {
                    const link = document.createElement("a");
                    link.href = chap.url; link.innerText = chap.title;
                    link.setAttribute("novel-downloader-chapter", ""); link.setAttribute("order", index + 1);
                    link.style = "display: block; padding: 8px 12px; margin: 4px 0; border-left: 4px solid #5cb85c; background-color: #fff; color: #333; text-decoration: none; border-radius: 4px; transition: background-color 0.2s, transform 0.2s;";
                    link.onmouseover = () => { link.style.backgroundColor = '#f0f0f0'; link.style.transform = 'translateX(5px)'; };
                    link.onmouseout = () => { link.style.backgroundColor = '#fff'; link.style.transform = 'translateX(0px)'; };
                    container.appendChild(link);
                });
                document.body.prepend(container);
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => {
                    document.querySelectorAll('a[order]').forEach(a => {
                        if (!container.contains(a)) a.removeAttribute('order');
                    });
                }, 500);

                return allChapters;
            },

            deal: async function (chapter) {
                console.log(`%c[diyibanzhu Deal] Bắt đầu xử lý chương: "${chapter.title}"`, "color: purple;");

                let combinedContentHtml = '';
                let currentUrl = chapter.url;
                let pageCount = 1;

                try {
                    while (currentUrl) {
                        console.log(`%c[diyibanzhu Deal] Đang tải trang ${pageCount++} của chương...`, "color: green;");
                        const html = await this._fetchDiyibanzhuPage(currentUrl, '#nr1');
                        const doc = new DOMParser().parseFromString(html, 'text/html');

                        const nextPageLink = $(doc).find('.chapterPages span.curr').next('a');
                        let nextUrl = nextPageLink.length > 0 ? new URL(nextPageLink.attr('href'), window.location.origin).href : null;

                        const contentElement = $(doc).find('#nr1');
                        if (contentElement.length === 0) break;

                        contentElement.find('font, .chapterPages').remove();
                        const currentPageHtml = contentElement.html().trim();

                        if (combinedContentHtml === '') {
                            combinedContentHtml = currentPageHtml;
                        } else {

                            const tempDiv = $('<div>').html(combinedContentHtml);
                            tempDiv.find('br').remove();
                            const lastChar = tempDiv.text().trim().slice(-1);
                            const cleanedHtml = combinedContentHtml.replace(/(<br\s*\/?>|\s|&nbsp;)*$/i, '');
                            if (/[\u4e00-\u9fa5]/.test(lastChar)) {
                                combinedContentHtml = cleanedHtml + currentPageHtml;
                            } else {
                                combinedContentHtml = cleanedHtml + '<br><br>' + currentPageHtml;
                            }
                        }

                        if (nextUrl && Config.delayBetweenChapters > 0) {
                            console.log(`%c[diyibanzhu Deal] Chờ ${Config.delayBetweenChapters / 1000} giây trước khi tải trang tiếp theo...`, "color: orange;");
                            await new Promise(resolve => setTimeout(resolve, Config.delayBetweenChapters));
                        }
                        currentUrl = nextUrl;
                    }
                } catch (error) {
                    console.error(`%c[diyibanzhu Deal] thất bại: ${error.message}`, "color: red;");
                    throw error;
                }

                console.log("%c[diyibanzhu Deal] Đã ghép nối tất cả các trang. Bắt đầu dọn dẹp HTML...", "color: blue;");

                let finalContentHtml = combinedContentHtml;
                finalContentHtml = finalContentHtml.replace(/^\s*(作者：.*?<br\s*\/?>\s*)?(字数：.*?<br\s*\/?>\s*)?(\d{4}\/\d{2}\/\d{2}<br\s*\/?>\s*)?/i, '').trim();
                finalContentHtml = finalContentHtml.replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2');
                finalContentHtml = finalContentHtml.replace(/\s*[\r\n]+\s*/g, '');

                return {
                    title: chapter.title,
                    content: finalContentHtml
                };
            },

            chapterPrev: '.page-control a.prev',
            chapterNext: '.page-control a.next'
        }
// @rule-end
)
