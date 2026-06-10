// @rule-name: Koanchay
// @rule-source: special
(
// @rule-begin
        {
            siteName: 'Koanchay',
            filter: () => {
                if (!/koanchay\.(com|net|info|org)/.test(window.location.host)) return 0;
                if (window.location.pathname.match(/^\/truyen\/[^\/]+\/chuong-/)) return 2;
                if (window.location.pathname.match(/^\/truyen\/[^\/]+\/?$/)) return 1;
                return 0;
            },

            title: '.cover-info h2',
            writer: (doc) => {
                const html = $('body', doc).html() || doc.documentElement?.outerHTML || '';
                const m = html.match(/tac-gia.*?>(.*?)</);
                return m ? m[1].trim() : '';
            },
            intro: 'div.book-desc-detail',
            cover: () => {
                const src = $('div.book-info img').first().attr('src');
                if (!src) return '';
                if (src.startsWith('http')) return src;
                return window.location.origin + src;
            },

            getChapters: async (doc) => {
                if ($('a[data-action="login"]').length > 0) {
                    alert('Lỗi: Bạn cần đăng nhập vào Koanchay để tải nội dung.');
                    return [];
                }

                // Kiểm tra mã eden
                if ($('[name=code]').length > 0) {
                    alert('Lỗi: Bạn phải nhập mã eden để có thể đọc truyện này.');
                    return [];
                }

                // Kiểm tra quyền quản lý
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

                console.log('[Koanchay] Xác thực người dùng thành công. Bắt đầu tải danh sách chương từ API...');

                const html = doc.documentElement.outerHTML;
                const bookId = doc.querySelector("input#bookId")?.value || doc.querySelector("input[name=bookId]")?.value;
                const size = html.match(/loadBookIndex.*?,\s*(\d+)/)?.[1] || 50;
                const signKey = html.match(/signKey\s*=\s*"(.*?)"/)?.[1];

                if (!bookId || !signKey) {
                    alert("Lỗi: Không tìm thấy bookId hoặc signKey. Cấu trúc trang có thể đã thay đổi.");
                    return [];
                }

                const page$ = unsafeWindow.$ || unsafeWindow.jQuery;
                const pageSignFunc = unsafeWindow.signFunc;
                const pageFuzzySign = unsafeWindow.fuzzySign;
                const pageSignKey = unsafeWindow.signKey || signKey;
                const pageBookId = unsafeWindow.bookId || bookId;

                if (!page$ || !pageSignFunc || !pageFuzzySign || !pageSignKey) {
                    // Fallback: dùng Script.execute nếu không tìm thấy trên window
                    console.warn('[Koanchay] Không tìm thấy signFunc/fuzzySign trên window, thử fallback...');
                }

                const genSign = (start, size) => {
                    if (pageSignFunc && pageFuzzySign) {
                        return pageSignFunc(pageFuzzySign(pageSignKey + start + size));
                    }
                    // fallback dùng Script.execute
                    const Script = {
                        execute: (fnStr, fnName, arg) => {
                            try {
                                const fn = new Function(fnStr + `; return ${fnName};`)();
                                return fn(arg);
                            } catch (e) { return undefined; }
                        }
                    };
                    const signFuncStr = `function signFunc(r){function o(r,o){return r>>>o|r<<32-o}for(var f,n,t=Math.pow,c=t(2,32),i="length",a="",e=[],u=8*r[i],v=[],g=[],h=g[i],l={},s=2;64>h;s++)if(!l[s]){for(f=0;313>f;f+=s)l[f]=s;v[h]=t(s,.5)*c|0,g[h++]=t(s,1/3)*c|0}for(r+="";r[i]%64-56;)r+="\\0";for(f=0;f<r[i];f++){if((n=r.charCodeAt(f))>>8)return;e[f>>2]|=n<<(3-f)%4*8}for(e[e[i]]=u/c|0,e[e[i]]=u,n=0;n<e[i];){var d=e.slice(n,n+=16),p=v;for(v=v.slice(0,8),f=0;64>f;f++){var w=d[f-15],A=d[f-2],C=v[0],F=v[4],M=v[7]+(o(F,6)^o(F,11)^o(F,25))+(F&v[5]^~F&v[6])+g[f]+(d[f]=16>f?d[f]:d[f-16]+(o(w,7)^o(w,18)^w>>>3)+d[f-7]+(o(A,17)^o(A,19)^A>>>10)|0);(v=[M+((o(C,2)^o(C,13)^o(C,22))+(C&v[1]^C&v[2]^v[1]&v[2]))|0].concat(v))[4]=v[4]+M|0}for(f=0;8>f;f++)v[f]=v[f]+p[f]|0}for(f=0;8>f;f++)for(n=3;n+1;n--){var S=v[f]>>8*n&255;a+=(16>S?0:"")+S.toString(16)}return a}`;
                    const fuzzySignFuncStr = html.match(/function fuzzySign[\s\S]*?}/)?.[0];
                    const fuzzyResult = Script.execute(fuzzySignFuncStr, "fuzzySign", signKey + start + size);
                    return Script.execute(signFuncStr, "signFunc", fuzzyResult);
                };

                const getChapterInPage = (currentPage) => {
                    return new Promise((resolve, reject) => {
                        const sign = genSign(currentPage, size);
                        console.log('[Koanchay] Fetching page start=' + currentPage);
                        page$.ajax({
                            type: "GET",
                            url: "/book/index",
                            data: { bookId: pageBookId, start: currentPage, size: size, signKey: pageSignKey, sign: sign },
                            success: (responseHtml) => {
                                // $.ajax trả về HTML string, parse thành document
                                const doc = new DOMParser().parseFromString(
                                    '<html><body>' + responseHtml + '</body></html>', 'text/html'
                                );
                                resolve(doc);
                            },
                            error: (xhr, status, err) => {
                                reject(new Error(`Ajax error: ${status} ${err}`));
                            }
                        });
                    });
                };

                const allChapters = [];
                const seenUrls = new Set();
                let currentPage = 0;
                let pageDoc = await getChapterInPage(currentPage);

                while (pageDoc) {
                    const chapterEls = $(pageDoc).find("li.chapter-name a");

                    chapterEls.each((_, el) => {
                        let link = $(el).attr('href') || '';
                        if (link.length < 10) link = $(el).attr('data-href') || '';
                        if (!link) return;
                        const chapUrl = new URL(link, window.location.origin).href;
                        if (!seenUrls.has(chapUrl)) {
                            seenUrls.add(chapUrl);
                            allChapters.push({
                                title: $(el).text().trim(),
                                url: chapUrl,
                            });
                        }
                    });

                    // Pagination: lấy data-start từ link cuối cùng
                    const lastPageAttr = $(pageDoc).find("ul.pagination a").last().attr("data-start");
                    let lastPage = lastPageAttr ? parseInt(lastPageAttr) : 0;

                    pageDoc = null;
                    if (currentPage < lastPage) {
                        currentPage += parseInt(size);
                        try {
                            console.log(`[Koanchay] Đang tải trang mục lục, bắt đầu từ: ${currentPage}...`);
                            pageDoc = await getChapterInPage(parseInt(currentPage));
                        } catch (err) {
                            console.error('[Koanchay] Lỗi tải trang mục lục:', err);
                        }
                    }
                }

                console.log(`[Koanchay] Tổng cộng ${allChapters.length} chương.`);

                const container = document.createElement("div");
                container.id = "koanchay-chapter-container";
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
                const pageFetch = unsafeWindow.fetch.bind(unsafeWindow);
                const editUrl = chapter.url + '/chinh-sua';
                try {
                    const resp = await pageFetch(editUrl, { credentials: 'include' });
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                    const html = await resp.text();
                    const doc = new DOMParser().parseFromString(html, 'text/html');

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
                    console.error(`[Koanchay] Lỗi khi tải nội dung từ ${editUrl}:`, error);
                    return {
                        title: chapter.title + " (Lỗi Tải)",
                        content: "Không thể tải nội dung tiếng Trung. Vui lòng kiểm tra lại quyền truy cập hoặc thử lại sau."
                    };
                }
            }
        }
// @rule-end
)
