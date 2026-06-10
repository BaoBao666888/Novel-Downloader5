// @rule-name: 画本 (ihuaben)
// @rule-source: special
(
// @rule-begin

        //https://www.ihuaben.com/
        {
            siteName: '画本 (ihuaben)',
            filter: () => window.location.host === 'www.ihuaben.com',

            infoPage: () => {
                const match = location.pathname.match(/\/book\/(\d+)\/\d+\.html/);
                if (match && match[1]) {
                    return `https://www.ihuaben.com/book/${match[1]}.html`;
                }
                return location.href;
            },

            title: '.infodetail .simpleinfo h1.text-danger',
            writer: '.infodetail .simpleinfo a.text-muted',
            intro: '.infodetail .text-muted.aboutbook.hidden-xs.hidden-sm',
            cover: (doc) => {
                const img = doc.querySelector('.biginfo .cover img');
                if (!img) return null;
                const src = img.getAttribute('src');
                return src ? 'https:' + src.split('?')[0] : null;
            },
            getChapters: async () => {
                const bookIdMatch = window.location.pathname.match(/book\/(\d+)/);
                if (!bookIdMatch) {
                    console.error("Ihuaben Rule: Không thể lấy bookId từ URL.");
                    return [];
                }
                const bookId = bookIdMatch[1];
                const apiUrl = `https://www.ihuaben.com/book/chapters/${bookId}`;
                const apiHeaders = { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) Chrome/90.0.0.0 Mobile Safari/537.36' };

                try {
                    const res = await xhr.sync(apiUrl, null, { method: 'GET', headers: apiHeaders });

                    let data;
                    try {
                        data = JSON.parse(res.responseText);
                    } catch (e) {
                        console.warn("Parse JSON thất bại, thử fallback sang JSONP...");
                        const jsonpMatch = res.responseText.match(/\(([\s\S]*)\)/);
                        if (jsonpMatch && jsonpMatch[1]) {
                            data = JSON.parse(jsonpMatch[1]);
                        } else {
                            console.error("Phản hồi API không phải JSON hay JSONP:", res.responseText);
                            throw new Error("Phản hồi API không phải là JSON hoặc JSONP hợp lệ.");
                        }
                    }

                    if (!data || data.code !== 0 || !Array.isArray(data.chapters)) {
                        throw new Error("Dữ liệu API không hợp lệ hoặc không có chương nào.");
                    }

                    data.chapters.forEach((chap, index) => {
                        if (index > 0 && chap.marks.preChapterId && chap.marks.preChapterId !== data.chapters[index - 1].chapterId) {
                            console.warn(`%cCảnh báo thứ tự chương: Chương "${chap.title}" có preChapterId không khớp.`, 'color: orange');
                        }
                    });

                    const container = document.createElement("div");
                    container.id = "ihuaben-chapter-container";
                    container.style = "padding: 16px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; max-width: 800px; margin: 20px auto; box-shadow: 0 2px 5px rgba(0,0,0,0.1);";
                    container.innerHTML = `<h2 style="text-align:center; color: #d9534f; margin-bottom: 15px;">📖 Danh sách chương (tải từ API)</h2>`;

                    const chapterList = data.chapters.map((chap, index) => {
                        let finalTitle = chap.title.trim();
                        if (!/^第\d+章/.test(finalTitle)) {
                            finalTitle = `第${index + 1}章 ${finalTitle}`;
                        }

                        const chapterInfo = {
                            title: finalTitle,
                            url: `https://www.ihuaben.com/book/${bookId}/${chap.chapterId}.html`,
                            vip: false,
                        };

                        const link = document.createElement("a");
                        link.href = chapterInfo.url;
                        link.innerText = chapterInfo.title;
                        link.setAttribute("novel-downloader-chapter", "");
                        link.setAttribute("order", index + 1);
                        link.style = "display: block; padding: 8px 12px; margin: 4px 0; border-left: 4px solid #5cb85c; background-color: #fff; color: #333; text-decoration: none; border-radius: 4px; transition: background-color 0.2s, transform 0.2s;";
                        link.onmouseover = () => { link.style.backgroundColor = '#f0f0f0'; link.style.transform = 'translateX(5px)'; };
                        link.onmouseout = () => { link.style.backgroundColor = '#fff'; link.style.transform = 'translateX(0px)'; };

                        container.appendChild(link);
                        return chapterInfo;
                    });

                    document.body.prepend(container);

                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    setTimeout(() => {
                        document.querySelectorAll('a[order]').forEach(a => {
                            if (!container.contains(a)) {
                                a.removeAttribute('order');
                                a.removeAttribute('novel-downloader-chapter');
                            }
                        });
                    }, 500);

                    console.log(`✅ Ihuaben Rule: Đã xử lý ${chapterList.length} chương.`);
                    return chapterList;

                } catch (err) {
                    console.error('Ihuaben Rule: Lỗi khi lấy danh sách chương từ API:', err);
                    alert('Lỗi khi tải danh sách chương từ API của ihuaben. Vui lòng xem console (F12) để biết chi tiết.');
                    return [];
                }
            },

            deal: async (chapter) => {
                try {
                    const apiHeaders = { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) Chrome/90.0.0.0 Mobile Safari/537.36' };
                    const res = await xhr.sync(chapter.url, null, { method: 'GET', responseType: 'document', headers: apiHeaders });
                    console.log(`Gọi api thành công: ${chapter.url}`)
                    const doc = res.response;

                    const chapterTitle = chapter.title;
                    const contentSource = $(doc).find('#contentsource');

                    if (!contentSource.length) {
                        throw new Error("Không tìm thấy element #contentsource chứa nội dung.");
                    }

                    const processedLines = [];

                    contentSource.children('p').each((_, p_element) => {
                        const p = $(p_element);
                        const firstChild = p.children().first();

                        if (firstChild.length > 0 && (firstChild.is('i') || (firstChild.is('span') && firstChild.has('a')))) {
                            const speaker = firstChild.text().trim();
                            firstChild.remove();
                            const dialogue = p.text().trim();

                            if (dialogue) {
                                processedLines.push(`${speaker}：“${dialogue}”`);
                            }
                        } else {
                            const narrativeText = p.text().trim();
                            if (narrativeText) {
                                processedLines.push(narrativeText);
                            }
                        }
                    });

                    return {
                        title: chapterTitle,
                        content: processedLines.join('\n\n')
                    };

                } catch (err) {
                    console.error(`Ihuaben Deal Error for ${chapter.url}:`, err);
                    throw new Error(`Lỗi khi xử lý chương từ ihuaben: ${err.message || err}`);
                }
            },
        }
// @rule-end
)
