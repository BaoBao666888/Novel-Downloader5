// ==UserScript==
// @name         STV Data Collector (Advanced)
// @namespace    https://sangtacviet.com/
// @version      4.1_beta
// @description  Thu thập dữ liệu từ STV với khả năng chống CAPTCHA, random delay và lưu tiến độ
// @downloadURL  https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/decode/STV-Downloader.user.js
// @updateURL    https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/decode/STV-Downloader.user.js
// @author       Bảo Bảo
// @match        https://sangtacviet.com/truyen/*/*/*/
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.0.0/jszip.min.js
// @icon         https://sangtacviet.com/favicon.ico
// ==/UserScript==

(function () {
    'use strict';

    // --- BIẾN TOÀN CỤC ---
    let collectedData = [];
    let isCollecting = false;
    let captchaTab = null;
    let shouldStop = false;

    // Kiểm tra xem GM_openInTab có sẵn không (Tampermonkey)
    const useGMOpen = (typeof GM_openInTab === 'function');

    // --- HÀM TIỆN ÍCH ---
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const getRandomDelay = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // Mở tab captcha — ưu tiên GM_openInTab (active:false) để không focus, fallback về window.open
    const openCaptchaTab = (url) => {
        try {
            if (useGMOpen) {
                // Mở tab nền, không focus
                return GM_openInTab(url, {
                    active: false,
                    insert: true,
                    setParent: true
                });
            } else {
                // Fallback: window.open (có thể gây focus)
                return window.open(
                    url,
                    '_blank',
                    'width=450,height=650,left=200,top=150,toolbar=no,menubar=no,scrollbars=yes,resizable=yes'
                );
            }
        } catch (e) {
            console.warn('openCaptchaTab failed, fallback to window.open:', e);
            return window.open(
                url,
                '_blank',
                'width=450,height=650,left=200,top=150,toolbar=no,menubar=no,scrollbars=yes,resizable=yes'
            );
        }
    };

    // Đóng tab (cả GM tab object hoặc window)
    const closeCaptchaTab = (tab) => {
        try {
            if (!tab) return;
            // GM tab object có method close()
            if (typeof tab.close === 'function') {
                tab.close();
                return;
            }
            // window reference
            if (typeof tab.closed !== 'undefined' && tab.closed === false && typeof tab.close === 'function') {
                tab.close();
                return;
            }
        } catch (e) {
            console.warn('closeCaptchaTab error:', e);
        }
    };

    // Kiểm tra xem tab đã đóng hay không (để quyết định mở mới)
    const isTabClosed = (tab) => {
        if (!tab) return true;
        try {
            // Nếu GM tab object có thuộc tính 'closed' -> kiểm tra
            if (typeof tab.closed !== 'undefined') return !!tab.closed;
            // Nếu không có 'closed' property, nhưng có 'close' function (GM), coi như vẫn mở
            if (typeof tab.close === 'function') return false;
            // Fallback: nếu là window reference, check tab.closed
            return !!tab.closed;
        } catch (e) {
            return true;
        }
    };

    // --- GIAO DIỆN ĐIỀU KHIỂN ---
    const createControlPanel = () => {
        const panel = document.createElement('div');
        panel.id = 'data-collector-panel';
        panel.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>STV Data Collector</strong>
                <button id="close-panel" style="float: right; background: #ff4444; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer;">✕</button>
            </div>

            <div style="margin-bottom: 10px;">
                <label>Phạm vi chương (VD: 1-50):</label><br>
                <input type="text" id="chapter-range" placeholder="1-10" style="width: 100%; padding: 5px; margin-top: 2px;">
            </div>

            <div style="margin-bottom: 10px;">
                <label>Min delay (ms):</label><br>
                <input type="number" id="min-delay" value="2000" min="500" style="width: 48%; padding: 5px;">
                <label style="margin-left: 4%;">Max delay (ms):</label><br>
                <input type="number" id="max-delay" value="5000" min="500" style="width: 48%; padding: 5px;">
            </div>

            <div style="margin-bottom: 10px;">
                <button id="start-collecting" style="width: 100%; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Bắt đầu thu thập</button>
            </div>

            <div style="margin-bottom: 10px;">
                <button id="save-current" style="width: 48%; padding: 6px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 4%;">Lưu hiện tại</button>
                <button id="stop-collecting" style="width: 48%; padding: 6px; background: #ff4444; color: white; border: none; border-radius: 4px; cursor: pointer;" disabled>Dừng</button>
            </div>

            <div id="collection-status" style="font-size: 12px; color: #666;">
                Đã thu thập: 0 chương
            </div>
        `;

        panel.style.cssText = `
            position: fixed; top: 20px; right: 20px; width: 280px; padding: 15px;
            background-color: white; border: 2px solid #4CAF50; border-radius: 8px;
            z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: Arial, sans-serif;
        `;

        document.body.appendChild(panel);

        // Event listeners
        document.getElementById('close-panel').onclick = () => panel.remove();
        document.getElementById('start-collecting').onclick = startCollection;
        document.getElementById('save-current').onclick = saveCurrentData;
        document.getElementById('stop-collecting').onclick = stopCollection;
    };

    const createProgressIndicator = () => {
        const indicator = document.createElement('div');
        indicator.id = 'collector-progress';
        indicator.innerHTML = `
            <div id="progress-text" style="font-weight: bold; margin-bottom: 5px; white-space: pre-wrap;">Đang chuẩn bị...</div>
            <div style="width: 100%; background-color: #eee; border-radius: 5px;">
                <div id="progress-bar" style="width: 0%; height: 20px; background-color: #4CAF50; border-radius: 5px; text-align: center; color: white; line-height: 20px; transition: width 0.3s;">0%</div>
            </div>
            <div id="current-chapter-info" style="font-size: 11px; color: #666; margin-top: 5px;">Chờ bắt đầu...</div>
        `;

        indicator.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; width: 320px; padding: 15px;
            background-color: white; border: 1px solid #ccc; border-radius: 8px;
            z-index: 9999; box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        `;

        document.body.appendChild(indicator);
    };

    const updateProgress = (text, percentage, currentChapter = '') => {
        const textElem = document.getElementById('progress-text');
        const barElem = document.getElementById('progress-bar');
        const chapterInfo = document.getElementById('current-chapter-info');

        if (textElem) textElem.innerText = text;
        if (barElem) {
            barElem.style.width = `${percentage}%`;
            barElem.innerText = `${Math.round(percentage)}%`;
        }
        if (chapterInfo) chapterInfo.innerText = currentChapter;
    };

    const updateCollectionStatus = () => {
        const statusElem = document.getElementById('collection-status');
        if (statusElem) {
            statusElem.innerText = `Đã thu thập: ${collectedData.length} chương`;
        }
    };

    // --- HÀM LẤY DANH SÁCH CHƯƠNG ---
    const fetchChapterList = async (sourceId, bookId) => {
        const apiUrl = 'https://sangtacviet.com/index.php';
        const payload = `ngmar=chapterlist&h=${sourceId}&bookid=${bookId}&sajax=getchapterlist`;
        const refererUrl = window.location.href;

        try {
            updateProgress('Đang lấy danh sách chương...', 0);
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': refererUrl
                },
                body: payload
            });

            if (!response.ok) throw new Error(`Lỗi mạng: ${response.status}`);

            const jsonData = await response.json();
            if (jsonData?.code !== 1 || !jsonData.oridata) {
                throw new Error("API không trả về dữ liệu chương hợp lệ.");
            }

            const chapters = [];
            const chapterData = jsonData.oridata.split('-//-');
            if (chapterData[0]?.split('-/-').length < 3) chapterData.shift();

            chapterData.forEach((line, index) => {
                const parts = line.split('-/-');
                if (parts.length < 3) return;
                const [, chapterId, chapterTitle] = parts;
                if (chapterId && chapterTitle && !isNaN(parseInt(chapterId))) {
                    chapters.push({
                        order: index + 1,
                        chapterId: chapterId.trim(),
                        title: chapterTitle.trim()
                    });
                }
            });

            return chapters;
        } catch (error) {
            console.error('Lỗi lấy danh sách chương:', error);
            throw error;
        }
    };

    // --- HÀM THU THẬP DỮ LIỆU CHƯƠNG ---
    const collectChapterData = async (chapter, sourceId, bookId, minDelay, maxDelay) => {
        const apiUrl = 'https://sangtacviet.com/index.php';
        const payload = `bookid=${bookId}&h=${sourceId}&c=${chapter.chapterId}&ngmar=readc&sajax=readchapter&sty=1&exts=`;
        const chapterWebUrl = `https://sangtacviet.com/truyen/${sourceId}/1/${bookId}/${chapter.chapterId}/`;

        const MAX_ATTEMPTS = 5;
        let attempts = 0;

        // --- HÀM GỌI API ---
        async function attemptApiCall() {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': chapterWebUrl,
                },
                body: payload,
            });

            if (!response.ok) {
                throw new Error(`Lỗi mạng: ${response.status}`);
            }

            const responseText = await response.text();
            let jsonData;

            try {
                jsonData = JSON.parse(responseText);
            } catch (e) {
                throw new Error("Phản hồi không phải JSON hợp lệ");
            }

            if (!jsonData || jsonData.code !== "0" || typeof jsonData.data === 'undefined') {
                throw new Error(jsonData?.err || `Lỗi API (Code: ${jsonData?.code || 'N/A'})`);
            }

            return {
                chapterId: chapter.chapterId,
                title: chapter.title,
                order: chapter.order,
                rawData: jsonData.data,
                timestamp: new Date().toISOString()
            };
        }

        // --- XỬ LÝ CAPTCHA VÀ LỖI CODE 7 ---
        async function handleCaptchaAndRetry() {
            console.log(`🔄 Xử lý CAPTCHA/Code7 cho chương ${chapter.order}`);

            // Mở tab captcha nếu chưa có hoặc đã đóng
            if (isTabClosed(captchaTab)) {
                captchaTab = openCaptchaTab(chapterWebUrl);
            }

            const maxCaptchaAttempts = 8;
            const captchaRetryDelay = 12000; // 12 giây

            for (let attempt = 1; attempt <= maxCaptchaAttempts; attempt++) {
                if (shouldStop) return null;

                updateProgress(
                    `Đang xử lý CAPTCHA/Code7...\nThử lại lần ${attempt}/${maxCaptchaAttempts}\n(Vui lòng refresh tab mới nếu cần)`,
                    0,
                    `Chương ${chapter.order}: ${chapter.title}`
                );

                await sleep(captchaRetryDelay);

                try {
                    const result = await attemptApiCall();
                    console.log(`✅ CAPTCHA/Code7 đã được giải quyết cho chương ${chapter.order}`);

                    if (!isTabClosed(captchaTab)) {
                        try {
                            closeCaptchaTab(captchaTab);
                        } catch (e) { /* ignore */ }
                        captchaTab = null;
                    }

                    return result;
                } catch (error) {
                    console.warn(`❌ Thử CAPTCHA/Code7 lần ${attempt} thất bại:`, error.message);

                    // Reload tab captcha sau lần thử thứ 2 và mỗi 2 lần thử tiếp theo
                    if (attempt === 2 || attempt % 2 === 0) {
                        if (!isTabClosed(captchaTab)) {
                            if (useGMOpen) {
                                // Với GM_openInTab: đóng rồi mở lại (avoid focus)
                                try {
                                    closeCaptchaTab(captchaTab);
                                } catch (e) { console.warn('close failed', e); }
                                captchaTab = openCaptchaTab(chapterWebUrl);
                            } else {
                                // fallback: reload window tab
                                try {
                                    captchaTab.location.reload();
                                } catch (e) {
                                    // nếu reload lỗi thì đóng và mở mới
                                    try {
                                        closeCaptchaTab(captchaTab);
                                    } catch (ee) {}
                                    captchaTab = openCaptchaTab(chapterWebUrl);
                                }
                            }
                            console.log(`🔄 Reload/Restart tab để refresh cookie...`);
                        } else {
                            // nếu tab đã đóng, mở tab mới
                            captchaTab = openCaptchaTab(chapterWebUrl);
                        }
                    }
                }
            }

            if (!isTabClosed(captchaTab)) {
                try {
                    closeCaptchaTab(captchaTab);
                } catch (e) {}
                captchaTab = null;
            }

            throw new Error("Không thể giải quyết CAPTCHA/Code7 sau nhiều lần thử");
        }

        // --- LOGIC THU THẬP CHÍNH ---
        while (attempts < MAX_ATTEMPTS && !shouldStop) {
            try {
                const result = await attemptApiCall();

                // Random delay giữa các request thành công
                const delay = getRandomDelay(minDelay, maxDelay);
                await sleep(delay);

                return result;

            } catch (error) {
                attempts++;
                console.warn(`❌ Lỗi chương ${chapter.order} (lần ${attempts}/${MAX_ATTEMPTS}):`, error.message);

                // Kiểm tra có phải lỗi CAPTCHA hoặc lỗi Code 7 (cần refresh cookie)
                if (error.message.toLowerCase().includes('xác nhận') ||
                    error.message.toLowerCase().includes('captcha') ||
                    error.message.includes('Code: 7')) {

                    console.log(`🔧 Phát hiện lỗi cần xử lý đặc biệt: ${error.message}`);
                    try {
                        return await handleCaptchaAndRetry();
                    } catch (captchaError) {
                        console.error(`❌ Xử lý CAPTCHA/Code7 thất bại cho chương ${chapter.order}:`, captchaError.message);
                        break; // Thoát khỏi vòng lặp retry
                    }
                } else {
                    // Với các lỗi khác, chờ một chút rồi thử lại
                    const retryDelay = getRandomDelay(2000, 5000) * attempts;
                    await sleep(retryDelay);
                }
            }
        }

        // Nếu đến đây nghĩa là thất bại hoàn toàn
        console.error(`❌ Bỏ qua chương ${chapter.order} sau ${MAX_ATTEMPTS} lần thất bại`);
        return {
            chapterId: chapter.chapterId,
            title: chapter.title,
            order: chapter.order,
            rawData: `<!-- Lỗi: Không thể tải chương ${chapter.order} sau ${MAX_ATTEMPTS} lần thử -->`,
            timestamp: new Date().toISOString(),
            error: true
        };
    };

    // --- HÀM LƯU DỮ LIỆU ---
    const saveDataToZip = async (data, fileName) => {
        if (!data || data.length === 0) {
            alert("Không có dữ liệu để lưu!");
            return;
        }

        const zip = new JSZip();

        // Tạo file JSON chứa tất cả dữ liệu
        const jsonData = {
            metadata: {
                source: "STV Data Collector",
                totalChapters: data.length,
                collectionDate: new Date().toISOString(),
                successfulChapters: data.filter(item => !item.error).length,
                failedChapters: data.filter(item => item.error).length
            },
            chapters: data
        };

        zip.file("data_collection.json", JSON.stringify(jsonData, null, 2));

        // Tạo các file HTML riêng lẻ cho từng chương
        data.forEach(chapterData => {
            const fileName = `${String(chapterData.order).padStart(5, '0')} - ${chapterData.title.replace(/[\\/:*?"<>|]/g, '')}.html`;
            zip.file(`chapters/${fileName}`, chapterData.rawData);
        });

        // Tạo file tóm tắt
        const summary = `STV Data Collection Summary
=================================
Tổng số chương: ${data.length}
Thành công: ${data.filter(item => !item.error).length}
Thất bại: ${data.filter(item => item.error).length}
Thời gian thu thập: ${new Date().toLocaleString('vi-VN')}

Danh sách chương:
${data.map(item => `${item.order}. ${item.title} ${item.error ? '(LỖI)' : '(OK)'}`).join('\n')}
`;

        zip.file("summary.txt", summary);

        try {
            const content = await zip.generateAsync({ type: "blob" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(a.href);

            console.log(`✅ Đã lưu file: ${fileName}`);
        } catch (e) {
            alert(`Lỗi khi tạo file ZIP: ${e.message}`);
        }
    };

    // --- HÀM XỬ LÝ SỰ KIỆN ---
    const startCollection = async () => {
        if (isCollecting) {
            alert("Đang thu thập! Vui lòng đợi hoặc dừng trước.");
            return;
        }

        const novelMatch = window.location.pathname.match(/truyen\/([^/]+)\/\d+\/(\d+)\//);
        if (!novelMatch) {
            alert("Không thể lấy thông tin từ URL.");
            return;
        }

        const [, sourceId, bookId] = novelMatch;
        const rangeInput = document.getElementById('chapter-range').value.trim();
        const minDelay = parseInt(document.getElementById('min-delay').value) || 1000;
        const maxDelay = parseInt(document.getElementById('max-delay').value) || 3000;

        if (minDelay > maxDelay) {
            alert("Min delay không thể lớn hơn Max delay!");
            return;
        }

        // Reset dữ liệu cũ
        collectedData = [];
        shouldStop = false;
        isCollecting = true;

        // Cập nhật UI
        document.getElementById('start-collecting').disabled = true;
        document.getElementById('stop-collecting').disabled = false;
        updateCollectionStatus();

        createProgressIndicator();

        try {
            // Lấy danh sách chương
            const allChapters = await fetchChapterList(sourceId, bookId);
            if (allChapters.length === 0) {
                alert("Không tìm thấy chương nào.");
                return;
            }

            // Xác định phạm vi
            let start = 1, end = allChapters.length;
            if (rangeInput !== "") {
                const parts = rangeInput.split('-').map(n => parseInt(n.trim()));
                if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1]) || parts[0] <= 0 || parts[1] < parts[0]) {
                    alert("Phạm vi không hợp lệ! VD: 1-50");
                    return;
                } else {
                    document.getElementById('chapter-range').value = `${parts[0]}-${parts[1]}`;
                }
                [start, end] = parts;
            }

            const chaptersToCollect = allChapters.slice(start - 1, end);
            const totalChapters = chaptersToCollect.length;

            console.log(`🚀 Bắt đầu thu thập ${totalChapters} chương với delay ${minDelay}-${maxDelay}ms`);

            // Thu thập từng chương
            for (let i = 0; i < totalChapters && !shouldStop; i++) {
                const chapter = chaptersToCollect[i];
                const progress = ((i + 1) / totalChapters) * 100;

                updateProgress(
                    `Đang thu thập chương ${i + 1}/${totalChapters}`,
                    progress,
                    `${chapter.title}`
                );

                try {
                    const chapterData = await collectChapterData(chapter, sourceId, bookId, minDelay, maxDelay);
                    collectedData.push(chapterData);

                    console.log(`✅ Thu thập thành công chương ${chapter.order}: ${chapter.title}`);

                } catch (error) {
                    console.error(`❌ Thất bại chương ${chapter.order}:`, error.message);

                    // Vẫn lưu thông tin lỗi
                    collectedData.push({
                        chapterId: chapter.chapterId,
                        title: chapter.title,
                        order: chapter.order,
                        rawData: `<!-- Lỗi: ${error.message} -->`,
                        timestamp: new Date().toISOString(),
                        error: true
                    });
                }

                updateCollectionStatus();
            }

            if (!shouldStop) {
                updateProgress("Hoàn thành thu thập!", 100, "Đang chuẩn bị lưu file...");

                // Tự động lưu khi hoàn thành
                const novelTitle = document.querySelector('h1.font-truyen')?.innerText.trim() || `STV_${bookId}`;
                const zipFileName = `${novelTitle}_DataCollection_${start}_to_${end}_${new Date().toISOString().slice(0,10)}.zip`;

                await saveDataToZip(collectedData, zipFileName);

                alert(`Thu thập hoàn tất!\nThành công: ${collectedData.filter(item => !item.error).length}/${totalChapters} chương`);
            } else {
                alert("Thu thập đã bị dừng!");
            }

        } catch (error) {
            alert(`Lỗi trong quá trình thu thập: ${error.message}`);
        } finally {
            // Reset trạng thái
            isCollecting = false;
            shouldStop = false;

            document.getElementById('start-collecting').disabled = false;
            document.getElementById('stop-collecting').disabled = true;

            // Đóng tab captcha nếu còn
            if (!isTabClosed(captchaTab)) {
                try {
                    closeCaptchaTab(captchaTab);
                } catch (e) {}
                captchaTab = null;
            }

            // Xóa progress indicator
            const indicator = document.getElementById('collector-progress');
            if (indicator) indicator.remove();
        }
    };

    const saveCurrentData = async () => {
        if (collectedData.length === 0) {
            alert("Chưa có dữ liệu nào được thu thập!");
            return;
        }

        const novelTitle = document.querySelector('h1.font-truyen')?.innerText.trim() || `STV_Unknown`;
        const timestamp = new Date().toISOString().slice(0,19).replace(/[T:]/g, '_');
        const fileName = `${novelTitle}_PartialCollection_${collectedData.length}chapters_${timestamp}.zip`;

        await saveDataToZip(collectedData, fileName);
        alert(`Đã lưu ${collectedData.length} chương đã thu thập!`);
    };

    const stopCollection = () => {
        shouldStop = true;
        console.log("⏹️ Đã yêu cầu dừng thu thập");

        updateProgress("Đang dừng...", 0, "Vui lòng đợi hoàn thành chương hiện tại");
    };

    // --- ĐĂNG KÝ MENU COMMANDS ---
    GM_registerMenuCommand("🎛️ Mở bảng điều khiển Data Collector", () => {
        // Xóa panel cũ nếu có
        const existingPanel = document.getElementById('data-collector-panel');
        if (existingPanel) existingPanel.remove();

        createControlPanel();
    });

    GM_registerMenuCommand("💾 Lưu dữ liệu hiện tại", saveCurrentData);

    console.log("🚀 STV Data Collector đã sẵn sàng! Nhấp chuột phải để mở menu.");
})();
