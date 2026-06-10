// @rule-name: 爱发电 (Afdian)
// @rule-source: special
(
// @rule-begin
        //afdian.com
        {
            siteName: '爱发电 (Afdian)',
            url: '://afdian.com/album/\\w+',
            chapterUrl: '://afdian.com/album/\\w+/\\w+',

            filter: () => {
                const path = window.location.pathname;
                if (/^\/album\/\w+\/\w+/.test(path)) return 2;
                if (/^\/album\/\w+/.test(path)) return 1;
                return 0;
            },

            _getAfdianInfo: async () => {
                if (Storage.book.afdianInfo) return Storage.book.afdianInfo;
                const albumId = location.pathname.split('/')[2];
                const url = `https://afdian.com/api/user/get-album-info?album_id=${albumId}`;

                try {
                    const res = await xhr.sync(url, null, { method: 'GET', responseType: 'json' });
                    if (res.response?.data?.album) {
                        Storage.book.afdianInfo = res.response.data.album;
                        return Storage.book.afdianInfo;
                    }
                } catch (err) {
                    console.error('Afdian API Info error:', err);
                    return null;
                }
            },

            title: async () => (await Rule.special.find(r => r.siteName.includes('爱发电'))._getAfdianInfo())?.title || '',
            writer: async () => (await Rule.special.find(r => r.siteName.includes('爱发电'))._getAfdianInfo())?.user?.name || '',
            intro: async () => {
                const info = await Rule.special.find(r => r.siteName.includes('爱发电'))._getAfdianInfo();
                return `${info?.content || ''}\nLink cover: ${info?.cover || ''}`;
            },
            cover: async () => (await Rule.special.find(r => r.siteName.includes('爱发电'))._getAfdianInfo())?.cover || '',

            getChapters: async () => {
                const albumId = location.pathname.split('/')[2];
                const url = `https://afdian.com/api/user/get-album-catalog?album_id=${albumId}&rankOrder=asc`;

                try {
                    const res = await xhr.sync(url, null, { method: 'GET', responseType: 'json' });
                    const list = res.response?.data?.list;
                    if (!list) throw 'Không tìm thấy danh sách chương.';

                    const chapters = [];
                    const vipChapters = [];

                    // === Tạo container riêng ===
                    const container = document.createElement("div");
                    container.id = "afdian-chapter-container";
                    container.style = "padding: 16px; border: 1px solid #999; background: #fff; max-width: 600px; margin: 16px auto;";
                    container.innerHTML = `<h2 style="text-align:center;">📖 Danh sách chương (hiển thị riêng)</h2>`;

                    list.forEach((chap, idx) => {
                        const chapter = {
                            name: `${chap.title}`,
                            url: `https://afdian.com/album/${albumId}/${chap.post_id}`
                        };

                        const link = document.createElement("a");
                        link.href = chapter.url;
                        link.innerText = chapter.name;
                        link.setAttribute("novel-downloader-chapter", chap.has_right === 0 ? "vip" : "");
                        link.setAttribute("order", idx + 1);
                        link.style = `
                display: block;
                padding: 6px 8px;
                margin: 4px 0;
                border-left: 4px solid ${chap.has_right === 0 ? 'red' : '#0a0'};
                color: ${chap.has_right === 0 ? 'red' : 'black'};
                text-decoration: none;
            `;
                        container.appendChild(link);

                        if (chap.has_right === 0) vipChapters.push(chapter);
                        else chapters.push(chapter);
                    });

                    document.body.prepend(container);

                    const allChapters = [...chapters, ...vipChapters];
                    console.log(`✅ Tổng số chương: ${allChapters.length}`);
                    // Sau khi tạo xong container và append vào DOM
                    document.body.prepend(container);

                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    // Sau đó, lọc toàn bộ các <a> có order nhưng KHÔNG nằm trong container bạn tạo → xóa order
                    setTimeout(() => {
                        const allOrdered = document.querySelectorAll('a[order]');
                        allOrdered.forEach(a => {
                            if (!container.contains(a)) {
                                a.removeAttribute('order');
                                a.removeAttribute('novel-downloader-chapter');
                            }
                        });
                    }, 100); // delay nhẹ để chắc chắn mấy script khác chạy xong

                    return allChapters;

                } catch (err) {
                    console.error('Afdian getChapters API error:', err);
                    return [];
                }
            },
            deal: async (chapter) => {
                const match = chapter.url.match(/album\/(\w+)\/(\w+)/);
                if (!match) {
                    throw new Error(`Afdian Deal: URL chương không hợp lệ: ${chapter.url}`);
                }

                const albumId = match[1];
                const postId = match[2];
                const apiUrl = `https://afdian.com/api/post/get-detail?post_id=${postId}&album_id=${albumId}`;

                try {
                    const res = await xhr.sync(apiUrl, null, { method: 'GET', responseType: 'json' });
                    const post = res?.response?.data?.post;

                    if (!post?.content) {
                        throw new Error(`Afdian Deal: Không có nội dung hoặc chưa mở khóa cho chương ${postId}`);
                    }
                    console.log(`%cAfdian Deal xử lý ${post.title || chapter.title} thành công!`, "color: green;");

                    return {
                        title: post.title || chapter.title,
                        content: post.content
                    };

                } catch (err) {
                    console.error('Afdian Deal Error:', err);
                    // Throw để hệ thống chính thực hiện retry
                    throw new Error(`Lỗi khi lấy chương từ Afdian: ${err.message || err}`);
                }
            },


        }
// @rule-end
)
