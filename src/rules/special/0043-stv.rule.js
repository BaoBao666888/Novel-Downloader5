// @rule-name: Sáng Tác Việt (API Chapter List)
// @rule-source: special
(
// @rule-begin

        { // https://sangtacviet.com/truyen/ | https://sangtacviet.app/truyen/
            siteName: 'Sáng Tác Việt (API Chapter List)',
            // Nhận diện trang tổng quan truyện
            url: '://sangtacviet\\.(?:com|app)/truyen/[^/]+/\\d+/\\d+/',
            filter: () => {
                if (/^(.+\.)?sangtacviet\.(com|app)$/i.test(window.location.hostname) && window.location.pathname.match(/^\/truyen\/[^/]+\/\d+\/\d+\/$/) && $('#book_name2').length) {
                    return 1; // Chỉ cần nhận diện trang truyện
                }
                return 0;
            },

            // Thông tin sách vẫn lấy từ HTML trang truyện
            title: '#oriname', // Tên gốc tiếng Trung
            writer: 'i.cap > h2', // Tác giả
            intro: '#book-sumary > span', // Tóm tắt
            cover: '#thumb-prop', // Bìa

            _getBookInfoFromQIDIAN: async (novelId) => {
                const apiUrl = `https://www.qidian.com/book/${novelId}/`;
                console.log("STV getChapters: Đang gọi API QIDIAN...");

                try {
                    // respone = HTML string đầy đủ
                    const respone = await fetchPageContent(apiUrl, 'p#book-intro-detail');
                    const $doc = $(respone);

                    // 1Tiêu đề
                    const title = $doc.find('.book-info h1#bookName').text().trim() || '';

                    //  Tên tác giả
                    const writer = $doc.find('.author-intro a.writer-name').text().trim() || '';

                    // Ảnh bìa
                    let cover = '';
                    let rawCover = $doc.find('.book-author img').attr('src') || '';

                    if (rawCover) {
                        // //bookcover.yuewen.com/qdbimg/349573/1046577011/600.webp
                        // -> https://bookcover.yuewen.com/qdbimg/349573/1046577011
                        cover = rawCover
                            .replace(/^\/\//, 'https://')
                            .replace(/\/\d+(?:\.\w+)?$/, '');
                    }

                    //  作品属性：.book-info p.book-attribute
                    let attrText = $doc.find('.book-info p.book-attribute').text().trim();
                    if (attrText) {
                        // gom khoảng trắng cho gọn
                        attrText = attrText.replace(/\s+/g, ' ');
                    }
                    const attrSection = attrText ? `作品属性：${attrText}` : '';

                    // 作品简介：#book-intro-detail (giữ xuống dòng)
                    let introHtml = $doc.find('.intro-detail p#book-intro-detail').html() || '';
                    let introMain = '';

                    if (introHtml) {
                        introMain = introHtml
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&amp;/g, '&')
                            .replace(/<br\s*\/?>/gi, '\n')
                            .replace(/<[^>]+>/g, '')
                            .replace(/\n{2,}/g, '\n')
                            .trim();
                    }

                    if (introMain) {
                        introMain = `作品简介：${introMain}`;
                    }

                    // 作品标签：.intro-honor-label p.all-label a
                    const tags = $doc
                        .find('.intro-honor-label p.all-label a')
                        .map((i, el) => $(el).text().trim())
                        .get()
                        .filter(Boolean);

                    const tagSection = tags.length
                        ? `作品标签：${tags.join(', ')}`
                        : '';

                    //  Gộp intro tổng
                    const intro = [attrSection, introMain, tagSection, `Link cover: ${cover}`]
                        .filter(Boolean)
                        .join('\n\n');

                    // Lưu vào Storage + fill form
                    Storage.book = Storage.book || {};
                    if (title) Storage.book.title = title;
                    if (writer) Storage.book.writer = writer;
                    if (intro) Storage.book.intro = intro;
                    if (cover) Storage.book.cover = cover;

                    if (title) ndUI$('.novel-downloader-v3 input[name="title"]').val(title);
                    if (writer) ndUI$('.novel-downloader-v3 input[name="writer"]').val(writer);
                    if (intro) ndUI$('.novel-downloader-v3 input[name="intro"]').val(intro);
                    if (cover) ndUI$('.novel-downloader-v3 input[name="cover"]').val(cover);

                    // console.log('[QIDIAN] Lấy info xong:', {
                    //     title,
                    //     writer,
                    //     cover,
                    //     introPreview: intro.slice(0, 100) + (intro.length > 100 ? '...' : '')
                    // });
                } catch (err) {
                    console.error("Lỗi lấy info từ QIDIAN:", err);
                }
            },


            _getBookInfoFromJJWXC: async (novelId) => {
                const apiUrl = `https://app.jjwxc.net/androidapi/novelbasicinfo?novelId=${novelId}`;

                await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: apiUrl,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) Chrome/90.0.0.0 Mobile Safari/537.36'
                        },
                        onload: function (res) {
                            try {
                                const doc = JSON.parse(res.responseText);
                                const name = doc.novelName?.trim();
                                const author = doc.authorName?.trim();
                                const tags = doc.novelTags?.trim();
                                // Hàm kiểm tra URL có trả về ảnh không
                                function checkImageUrlValid(url) {
                                    return new Promise((resolve) => {
                                        GM_xmlhttpRequest({
                                            method: 'HEAD',
                                            url: url,
                                            onload: (res) => {
                                                const contentType = res.responseHeaders.match(/content-type:\s*([^\r\n]+)/i)?.[1] || '';
                                                resolve(res.status === 200 && contentType.startsWith('image/'));
                                            },
                                            onerror: () => resolve(false),
                                            ontimeout: () => resolve(false)
                                        });
                                    });
                                }

                                // Xử lý ảnh cover
                                async function processCover(novelCover) {
                                    if (!novelCover) return '';

                                    const coverRaw = novelCover;
                                    const modifiedCover = coverRaw
                                        .replace(/_[0-9]+_[0-9]+(?=\.jpg)/, '')
                                        .replace(/\.jpg.*/i, '.jpg');

                                    const isValid = await checkImageUrlValid(modifiedCover);
                                    return isValid ? modifiedCover : coverRaw;
                                }

                                let intro = doc.novelIntro || '';
                                intro = intro
                                    .replace(/&lt;/g, "<")
                                    .replace(/&gt;/g, ">")
                                    .replace(/<br\s*\/?>/gi, '\n')
                                    .replace(/\n{2,}/g, '\n')
                                    .trim();

                                Storage.book = Storage.book || {};
                                Storage.book.title = name || Storage.book.title;
                                Storage.book.writer = author || Storage.book.writer;
                                Storage.book.intro = intro || Storage.book.intro;
                                processCover(doc.novelCover).then((cover) => {
                                    Storage.book.cover = cover;
                                    ndUI$('.novel-downloader-v3 input[name="cover"]').val(cover);
                                });

                                if (name) ndUI$('.novel-downloader-v3 input[name="title"]').val(name);
                                if (author) ndUI$('.novel-downloader-v3 input[name="writer"]').val(author);
                                if (intro) ndUI$('.novel-downloader-v3 input[name="intro"]').val(intro);

                                resolve();
                            } catch (err) {
                                console.error("Lỗi parse JSON JJWXC novelbasicinfo:", err, res.responseText);
                                reject(err);
                            }
                        },
                        onerror: reject
                    });
                });
            },

            getChapters: async (doc) => {
                const novelMatch = window.location.pathname.match(/truyen\/([^/]+)\/\d+\/(\d+)\//);
                if (!novelMatch) {
                    console.error("STV API ChapterList Error: Không thể lấy bookid/sourceId từ URL.");
                    return [];
                }
                const sourceId = novelMatch[1];
                const bookId = novelMatch[2];
                const stvBase = /^(.+\.)?sangtacviet\.app$/i.test(window.location.hostname) ? 'https://sangtacviet.app' : 'https://sangtacviet.com';
                if (sourceId === 'qidian') {
                    try {
                        await Rule.special.find(r => r.siteName.startsWith('Sáng Tác Việt (API Chapter List)'))._getBookInfoFromQIDIAN(bookId);
                        console.log("STV getChapters: Gọi API QIDIAN thành công.");
                    } catch (jjwxcError) {
                        console.warn("STV getChapters: Lỗi khi gọi API QIDIAN (bỏ qua):", jjwxcError);
                        // Bỏ qua lỗi và tiếp tục, không dừng script
                    }
                }

                if (sourceId === 'jjwxc') {
                    try {
                        console.log("STV getChapters: Đang gọi API JJWXC...");
                        await Rule.special.find(r => r.siteName.startsWith('Sáng Tác Việt (API Chapter List)'))._getBookInfoFromJJWXC(bookId);
                        console.log("STV getChapters: Gọi API JJWXC thành công.");
                    } catch (jjwxcError) {
                        console.warn("STV getChapters: Lỗi khi gọi API JJWXC (bỏ qua):", jjwxcError);
                        // Bỏ qua lỗi và tiếp tục, không dừng script
                    }
                }


                const apiUrl = `${stvBase}/index.php`;
                const payload = `ngmar=chapterlist&h=${sourceId}&bookid=${bookId}&sajax=getchapterlist`;
                const refererUrl = window.location.href;

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Referer': refererUrl,
                        },
                        body: payload,
                    });

                    if (!response.ok) {
                        console.error(`%cSTV getChapters Error: Fetch thất bại, Status: ${response.status}`, "color: red;");
                        return [];
                    }

                    const responseText = await response.text();
                    const jsonData = JSON.parse(responseText);

                    if (jsonData && jsonData.code === 1 && (jsonData.oridata || jsonData.data)) {
                        const chapters = [];

                        let oriDataChapters = jsonData.oridata ? jsonData.oridata.split('-//-') : [];
                        let translatedChapters = jsonData.data ? jsonData.data.split('-//-') : [];

                        if (oriDataChapters[0] && oriDataChapters[0].split('-/-').length < 3) oriDataChapters.shift();
                        if (translatedChapters[0] && translatedChapters[0].split('-/-').length < 3) translatedChapters.shift();

                        const isUsingTranslatedAsFallback = oriDataChapters.length === 0 && translatedChapters.length > 0;
                        if (isUsingTranslatedAsFallback) {
                            oriDataChapters = translatedChapters;
                            console.log("Không phát hiện tiêu đề tiếng Trung, sử dụng cấu trúc tiêu đề thay thế: 第{order}章");
                        }

                        const chapterLinksOnPage = $('#chaptercontainerinner a.listchapitem', doc);
                        let linkIndex = 0;

                        for (let i = 0; i < oriDataChapters.length; i++) {
                            const oriParts = oriDataChapters[i].split('-/-');
                            if (oriParts.length < 3) continue;

                            const chapterId = oriParts[1];
                            let chapterTitleOri = isUsingTranslatedAsFallback ? `第${i + 1}章` : oriParts[2].trim();

                            const correspondingLink = chapterLinksOnPage.eq(linkIndex++); // dùng trước để tô màu luôn

                            let shouldSkip = false;
                            if (sourceId === 'jjwxc') {
                                const currentMatch = chapterTitleOri.match(/^\[(\d+)\]/);
                                const next = oriDataChapters[i + 1];
                                const nextTitle = next?.split('-/-')[2]?.trim();
                                const nextMatch = nextTitle?.match(/^\[(\d+)\]/);

                                if (currentMatch && nextMatch && currentMatch[1] === nextMatch[1]) {
                                    console.log(`%cSTV getChapters: Bỏ chương [${currentMatch[1]}] hiện tại, giữ chương sau`, "color: orange;");
                                    shouldSkip = true;

                                    // Tô màu nhưng không thêm vào danh sách chương
                                    if (correspondingLink.length > 0) {
                                        correspondingLink.css('background-color', '#fce4ec'); // hoặc màu gì đó nổi bật
                                        correspondingLink.attr('data-note', 'bỏ do trùng số [n]');
                                    }

                                    continue; // bỏ push vào chapters
                                }

                                // Nếu không skip thì xóa [n] khỏi tiêu đề
                                if (currentMatch) {
                                    chapterTitleOri = chapterTitleOri.replace(/^\[\d+\]/, '').trim().replace(/ /g, '').replace(':', ' ');
                                }
                            }

                            // Nếu không skip, xử lý như bình thường
                            if (correspondingLink.length > 0) {
                                correspondingLink.attr('novel-downloader-chapter', '');
                                correspondingLink.attr('order', chapters.length + 1);
                            }

                            if (chapterId && chapterTitleOri && !isNaN(parseInt(chapterId))) {
                                const stvUrl = `${stvBase}/truyen/${sourceId}/1/${bookId}/${chapterId}/`;
                                chapters.push({
                                    title: chapterTitleOri,
                                    url: `#stv-api-chapter-${chapterId}`,
                                    bookId: bookId,
                                    chapterId: chapterId,
                                    sourceType: sourceId,
                                    stvBase: stvBase,
                                    stvUrl: stvUrl,
                                });
                            } else {
                                console.warn("STV getChapters Warn: Bỏ qua dòng dữ liệu chương không hợp lệ:", oriDataChapters[i]);
                            }
                        }

                        console.log(`STV getChapters: Đã xử lý ${chapters.length} chương từ API.`);
                        return chapters;
                    } else {
                        console.error(`%cSTV getChapters Error: API không trả về dữ liệu hợp lệ. Code: ${jsonData?.code}`, "color: red;", jsonData);
                        return [];
                    }
                } catch (error) {
                    console.error(`%cSTV getChapters Error: Lỗi fetch hoặc parse JSON:`, "color: red;", error);
                    return [];
                }
            },

            deal: async (chapter) => {
                // --- Hàm sleep ---
                function sleep(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
                // --- Thời gian chờ sau khi mở tab mới (ms) ---
                const delayAfterOpenTab = 10000;//hờ 7 giây, có thể điều chỉnh
                const bookId = chapter.bookId;
                const chapterId = chapter.chapterId;
                const sourceType = chapter.sourceType;
                if (!bookId || !chapterId || !sourceType) {
                    console.error("STV Deal Error: Thiếu ID chương/sách/nguồn.", chapter);
                    return { content: "", error: "Lỗi nội bộ: Thiếu ID." };
                }

                const chuyen_doi = { /* ... bảng chuyển đổi ... */
                    'lai': '来', 'tựu': '就', 'nhĩ': '你', 'nhi': '而', 'khởi': '起', 'môn': '们',
                    'đáo': '到', 'giá': '这', 'là': '是', 'thập': '什', 'thuyết': '说', 'tự': '自',
                    'hoàn': '还', 'quá': '过', 'thả': '且', 'kinh': '经',
                    'dĩ': '已', 'toán': '算', 'tưởng': '想', 'chẩm': '怎', 'ngận': '很', 'đa': '多',
                    'nhất': '一', 'hạ': '下', 'kỷ': '己', 'yêu': '么',
                    // ... thêm nữa ...
                };
                // const chuyen_doi = {
                //     'tới': '来',
                //     'liền': '就',
                //     'ngươi': '你',
                //     'mà': '而',
                //     'dậy': '起',
                //     'các': '们',
                //     'đến': '到',
                //     'này': '这',
                //     'là': '是',
                //     'gì': '什',
                //     'nói': '说',
                //     'chính': '自',
                //     'vẫn': '还',
                //     'đã': '过',
                //     'và': '且',
                //     'từng': '经',
                //     'tính': '算',
                //     'nghĩ': '想',
                //     'sao': '怎',
                //     'rất': '很',
                //     'nhiều': '多',
                //     'một': '一',
                //     'xuống': '下',
                //     'mình': '己',
                //     'gì': '么',
                //     'hắn': '他',
                //     'nàng': '她',
                //     'nó': '它',
                //     'bọn hắn': '他们',
                // };
                const punctuation_map = { /* ... bảng dấu câu ... */
                    '，': '，', ',': '，', '.......': '……', '......': '……', '.....': '……', '....': '…', '...': '…', '..': '…', '.': '。', '。': '。', '！': '！', '!': '！', '？': '？', '?': '？',
                    '：': '：', ':': '：', '；': '；', ';': '；', '“': '“', '”': '”', '"': '"',
                    '‘': '‘', '’': '’', "'": "'", '（': '（', '(': '（', '）': '）', ')': '）',
                    '…': '…', '—': '—', '-': '—', '《': '《', '》': '》',
                    //'『': '“', '』': '”',
                };

                const special_mappings = {
                    'dĩ tiền': '以前',
                    'tự kỷ': '自己',
                    'cánh nhiên': '竟然',
                    'nghi hoặc': '疑惑',
                };
                const debugLog = [];
                Storage.book = Storage.book || {};
                Storage.book.debugLog = Storage.book.debugLog || [];

                const stvBase = chapter.stvBase || (/^(.+\.)?sangtacviet\.app$/i.test(window.location.hostname) ? 'https://sangtacviet.app' : 'https://sangtacviet.com');
                const apiUrl = `${stvBase}/index.php`;
                const payload = `bookid=${bookId}&h=${sourceType}&c=${chapterId}&ngmar=readc&sajax=readchapter&sty=1&exts=`;
                const chapterWebUrl = chapter.stvUrl || `${stvBase}/truyen/${sourceType}/1/${bookId}/${chapterId}/`;
                let retryAttempted = false; // Cờ để chỉ thử lại một lần
                /// auto captcha review
                let captchaShouldStop = false;

                async function forceReloadTab(captchaTab) {
                    if (captchaTab && !captchaTab.closed) {
                        console.warn('[Auto Captcha] Đang reload tab xác minh...');
                        captchaTab.location.reload();
                    }
                }
                /// captcha
                async function waitForCaptchaAndRetry(attemptApiCallFunc, chapterId, chapterWebUrl) {
                    const retryDelay = 10000;
                    const maxAttempts = 10;
                    captchaShouldStop = false;

                    console.log(`%cSTV Deal (Chương ${chapterId}): Mở tab captcha mini...`, "color: orange;");
                    let captchaTab = window.open(
                        chapterWebUrl,
                        '_blank',
                        'width=400,height=600,left=200,top=150,toolbar=no,menubar=no,scrollbars=yes,resizable=yes'
                    );

                    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                        console.log(`🌀 Thử lại API lần ${attempt}/${maxAttempts}`);
                        await sleep(retryDelay);

                        try {
                            const result = await attemptApiCallFunc();
                            if (result.content) {
                                console.log(`✅ Captcha OK! Đã lấy được nội dung chương.`);
                                captchaShouldStop = true;
                                if (captchaTab && !captchaTab.closed) captchaTab.close();
                                return result;
                            }
                        } catch (error) {
                            console.warn(`❌ API fail lần ${attempt}: ${error.message}`);
                            if (error.message.includes('xác nhận')) {
                                // 👉 Nếu đến lần 2 mà vẫn chưa xong, thử reload tab
                                if (attempt === 2 && captchaTab && !captchaTab.closed) {
                                    console.warn(`🌀 Reload lại tab captcha...`);
                                    captchaTab.location.reload();
                                }
                            }
                        }
                    }

                    captchaShouldStop = true;
                    if (captchaTab && !captchaTab.closed) captchaTab.close();
                    throw new Error("Quá thời gian chờ xác nhận captcha!");
                }

                // --- Hàm con để thực hiện gọi API và xử lý nội dung ---
                async function attemptApiCall() {
                    console.log(`%cSTV Deal (Chương ${chapterId}): ${retryAttempted ? 'Thử lại' : 'Lần đầu'} gọi API FETCH...`, retryAttempted ? "color: orange;" : "color: purple;");
                    console.log(`API: ${apiUrl}`);
                    const response = await fetch(`${apiUrl}?${payload}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            // Sử dụng URL trang chương làm Referer
                            'Referer': chapterWebUrl,
                        },
                        body: null,
                    });
                    //console.log("ND: ", response.text());

                    // Kiểm tra lỗi HTTP
                    if (!response.ok) {
                        throw new Error(`Fetch thất bại, Status: ${response.status}`); // Ném lỗi để catch bên ngoài xử lý retry
                    }

                    const responseText = await response.text();
                    let jsonData;
                    try {
                        jsonData = JSON.parse(responseText);
                    } catch (e) {
                        console.error(`%cSTV Deal (Chương ${chapterId} Error): Phản hồi không phải JSON hợp lệ.`, "color: red;", responseText);
                        throw new Error("Phản hồi API không phải JSON"); // Ném lỗi
                    }

                    // Kiểm tra lỗi logic từ API STV
                    if (!jsonData || jsonData.code !== "0" || typeof jsonData.data === 'undefined') {
                        console.error(`%cSTV Deal (Chương ${chapterId} Error): API trả về lỗi. Code: ${jsonData?.code}`, "color: red;", jsonData);
                        throw new Error(`Lỗi API STV (Code: ${jsonData?.code || 'N/A'}) - ${jsonData?.err || 'Dữ liệu không hợp lệ'}`); // Ném lỗi
                    }

                    console.log(`%cSTV Deal (Chương ${chapterId}): Parse JSON thành công. Code: ${jsonData?.code}`, "color: purple;");
                    if (jsonData && jsonData.code === "0" && typeof jsonData.data !== 'undefined') {
                        let rawHtmlContent = jsonData.data;
                        const chapterTitle = chapter.title;
                        rawHtmlContent = rawHtmlContent.trim();

                        // === CHÈN CODE XỬ LÝ MODEL ===
                        // Chỉ gọi hàm mới, không cần sourceType nếu server tự xử lý
                        console.log(`[Model Client Call] Bắt đầu xử lý model cho chương ${chapterId}...`);
                        try {
                            const chapterContext = {
                                chapterId: chapterId,
                                chapterTitle: chapter.title // Lấy title gốc
                            };
                            // Gọi hàm đã sửa, chỉ cần rawHtml và context
                            rawHtmlContent = await processJjwxcTagsWithModel(rawHtmlContent, sourceType, chapterContext); // sourceType có thể bỏ nếu server ko dùng
                            console.log(`[Model Client Call] Xử lý model hoàn tất cho chương ${chapterId}.`);
                        } catch (modelError) {
                            console.error(`[Model Client Call] Lỗi nghiêm trọng khi chạy processJjwxcTagsWithModel cho chương ${chapterId}:`, modelError);
                            // rawHtmlContent sẽ giữ nguyên giá trị gốc nếu có lỗi
                        }
                        // === KẾT THÚC CHÈN CODE ===

                        // *** BƯỚC 2: TẠO DANH SÁCH NODE (Đã sửa xử lý <p>) ***
                        const nodes = [];
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = rawHtmlContent;
                        function processChildNodes(element) {
                            element.childNodes.forEach(node => {
                                if (node.nodeType === Node.TEXT_NODE) {
                                    let processedText = node.textContent;
                                    for (const vietPunc in punctuation_map) {
                                        processedText = processedText.replace(new RegExp(vietPunc.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), punctuation_map[vietPunc]);
                                    }
                                    nodes.push({ type: 'text', text: processedText });
                                } else if (node.nodeType === Node.ELEMENT_NODE) {
                                    if (node.tagName === 'I' && node.hasAttribute('t')) {
                                        nodes.push({
                                            type: 'word',
                                            h: (node.getAttribute('h') || '').toLowerCase(),
                                            t: node.getAttribute('t') || '',
                                            v: node.getAttribute('v') || '',
                                            inner: node.textContent || ''
                                        });
                                    } else if (node.tagName === 'P') {
                                        processChildNodes(node);
                                        nodes.push({ type: 'newline' });
                                    } else if (node.tagName === 'BR') {
                                        nodes.push({ type: 'newline' });
                                    } else if (node.tagName !== 'SPAN') {
                                        processChildNodes(node);
                                    }
                                }
                            });
                        }
                        processChildNodes(tempDiv);

                        // *** BƯỚC 3 & 4: XỬ LÝ NODE WORD VÀ NỐI KẾT QUẢ ***
                        let finalChineseText = "";
                        for (const node of nodes) {
                            if (node.type === 'text') {
                                const textContent = node.text;
                                if (!/[a-zA-Z]/.test(textContent)) {
                                    // Không có chữ Anh -> là dấu câu, khoảng trắng thừa -> Xóa hết whitespace
                                    finalChineseText += textContent.replace(/ /g, '');
                                } else {
                                    // Có chữ Anh -> là câu tiếng Anh -> Giữ nguyên
                                    finalChineseText += textContent;
                                }
                            } else if (node.type === 'newline') {
                                finalChineseText += '\n';
                            } // Xử lý node 'word'
                            else if (node.type === 'word') {
                                const t_raw = node.t || ''; // Lấy 't' (đã được model điền)

                                // (Yêu cầu 3) Xuất ra như thường (dùng 't')
                                if (t_raw.trim()) {
                                    // Nếu 't' CÓ nội dung (do STV gốc, STV API, hoặc Model điền)
                                    // -> DÙNG LUÔN 't'
                                    finalChineseText += t_raw.replace(/[ \t]+/g, '');
                                } else {
                                    // Nếu 't' VẪN RỖNG (tất cả API đều fail)
                                    // -> Fallback cuối cùng là dùng chữ Việt (gây dính chùm)
                                    console.warn(`[Fallback] Node word thiếu 't': v='${node.v}', i='${node.inner}'. Bỏ qua từ này.`);
                                    finalChineseText += ''; // Dùng chữ Việt
                                    // console.error(`STV Deal (Chương ${chapterId} Error): Thiếu chữ tiếng Trung, không thể tải xuống!`);
                                    // return { content: "", title: chapterTitle };
                                }

                                // ---- TOÀN BỘ LOGIC BÙ TỪ CŨ (h_parts, chuyen_doi, ...) ĐÃ BỊ XÓA ----

                            } // Kết thúc else if (node.type === 'word') - ĐÃ SỬA

                        } // Kết thúc vòng lặp nodes

                        // *** BƯỚC 5: DỌN DẸP VÀ TRẢ VỀ ***
                        finalChineseText = finalChineseText.replace(/\n+/g, '\n').replace(/\?\s*\?/g, '?').trim().replace('Vì vấn đề nội dung， nguồn này không hỗ trợ xem văn bản gốc。', '').replace('Bạn đang xem văn bản gốc chưa dịch， có thể kéo xuống cuối trang để chọn bản dịch。', '').replace('————————！！————————', '\n---------\n作者留言：\n').replace('————————', '---------');
                        console.log(`%cSTV Deal (Chương ${chapterId}): Tái tạo text gốc hoàn tất.`, "color: green;");
                        Storage.book.debugLog.push(...debugLog);
                        return { content: finalChineseText, title: chapterTitle };

                    } else {
                        console.error(`%cSTV Deal (Chương ${chapterId} Error): API trả về lỗi (FETCH). Code: ${jsonData?.code}`, "color: red;", jsonData);
                        return { content: "", error: `Lỗi API STV (Code: ${jsonData?.code || 'N/A'}) - ${jsonData?.err || ''}` };
                    }
                }

                try {
                    return await attemptApiCall();
                } catch (error) {
                    if (!retryAttempted) {
                        retryAttempted = true;
                        return await waitForCaptchaAndRetry(attemptApiCall, chapterId, chapterWebUrl);
                    } else {
                        console.error(`STV Deal (Chương ${chapterId} Error): Đã thử lại nhưng vẫn thất bại`);
                        return { content: "", error: `Lỗi STV sau khi thử lại: ${error.message}` };
                    }
                }

            },
            // Không cần content và elementRemove vì deal trả về raw HTML để xử lý sau
            // content: ...,
            // elementRemove: ...,
            // Bổ sung hàm để xử lý tải file debug
            onComplete: async (chapters) => { // Sử dụng hàm onComplete có sẵn của script gốc
                // (Code xử lý tải file epub/text/zip gốc ở đây...)

                console.log("NovelDownloader: onComplete được gọi.");
                // Kiểm tra và tải file debug nếu có log
                if (Storage.book.debugLog && Storage.book.debugLog.length > 0) {
                    console.log(`STV Debug: Có ${Storage.book.debugLog.length} lỗi cần ghi vào file.`);
                    const title = Storage.book.title || chapters[0]?.title || 'Unknown';
                    const debugContent = `Log lỗi bù từ cho truyện: ${title}\nChương: ${chapters.map(c => c.chapterId || '?').join(', ')}\n------------------------------------\n`
                        + Storage.book.debugLog.join('\n');
                    const blob = new window.Blob([debugContent], { type: 'text/plain;charset=utf-8' });
                    // Gọi hàm download gốc của script (nếu có) hoặc saveAs
                    download(blob, `${title}_debug.txt`); // Giả sử có hàm download global
                    delete Storage.book.debugLog; // Xóa log sau khi tải
                } else {
                    console.log("STV Debug: Không có lỗi bù từ nào được ghi nhận.");
                }
                // === XỬ LÝ LOG DỰ ĐOÁN TỪ MODEL ===
                const modelPredictionsLog = Storage.book.modelPredictionsLog || [];

                if (modelPredictionsLog.length > 0) {
                    console.log(`[Model Log] ${modelPredictionsLog.length} dự đoán đã được thực hiện bởi model. Đang tạo file log...`);
                    const title = Storage.book.title || 'Unknown_Book';
                    let logContent = `Log các dự đoán CỦA MODEL (Bỏ qua 32k/Fallback) cho truyện: ${title}\n`;
                    logContent += `Nguồn: ${modelPredictionsLog[0]?.source || 'jjwxc'}\n`;
                    logContent += `Định dạng: [Chương ID] Input (p | v | i | t_gốc) => Model Output (t_predicted)\n`;
                    logContent += "----------------------------------------------------------------------------------\n";

                    modelPredictionsLog.forEach(pred => {
                        // Đảm bảo chỉ log nếu source là 'model' (dù đã lọc ở trên, cẩn thận vẫn hơn)
                        if (pred.source === 'model') {
                            logContent += `[${pred.chapterId || '?'} - ${pred.chapterTitle || '(chưa có)'}] P:'${pred.p || ''}' | V:'${pred.v || ''}' | I:'${pred.i || ''}' | T_gốc:'${pred.t_original || ''}' => T_predicted:'${pred.t_predicted || '(empty)'}'\n`;
                        }
                    });

                    const blob = new window.Blob([logContent], { type: 'text/plain;charset=utf-8' });
                    download(blob, `${title}_model_predictions.txt`);
                    console.log(`[Model Log] Đã tạo file ${title}_model_predictions.txt`);

                    delete Storage.book.modelPredictionsLog;

                } else {
                    console.log("[Model Log] Không có dự đoán nào từ model (source='model') được ghi nhận.");
                }

            },
        }
// @rule-end
)
