// ==UserScript==
// @name         STV Downloader (Chống CAPTCHA)
// @namespace    https://sangtacviet.com/
// @version      3.0
// @description  Tải nhiều chương từ STV, tích hợp cơ chế mở tab phụ để xử lý CAPTCHA và thêm khoảng nghỉ giữa các yêu cầu.
// @downloadURL  https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/decode/STV-Downloader.user.js
// @updateURL    https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/decode/STV-Downloader.user.js
// @author       Bảo Bảo
// @match        https://sangtacviet.com/truyen/*/*/*/
// @grant        GM_registerMenuCommand
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.0.0/jszip.min.js
// @icon         https://sangtacviet.com/favicon.ico
// ==/UserScript==

(function () {
    'use strict';

    // --- CÁC HÀM TIỆN ÍCH ---
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // --- CÁC HÀM HỖ TRỢ GIAO DIỆN ---
    const createProgressIndicator = () => {
        const indicator = document.createElement('div');
        indicator.id = 'downloader-progress';
        indicator.innerHTML = `
            <div id="progress-text" style="font-weight: bold; margin-bottom: 5px; white-space: pre-wrap;">Bắt đầu...</div>
            <div style="width: 100%; background-color: #eee; border-radius: 5px;">
                <div id="progress-bar" style="width: 0%; height: 20px; background-color: #4CAF50; border-radius: 5px; text-align: center; color: white; line-height: 20px; transition: width 0.3s;">0%</div>
            </div>
        `;
        // ... (styling giống phiên bản trước)
        indicator.style.cssText = 'position: fixed; bottom: 20px; right: 20px; width: 300px; padding: 15px; background-color: white; border: 1px solid #ccc; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 8px rgba(0,0,0,0.1);';
        document.body.appendChild(indicator);
    };

    const updateProgress = (text, percentage) => {
        const textElem = document.getElementById('progress-text');
        const barElem = document.getElementById('progress-bar');
        if (textElem) textElem.innerText = text;
        if (barElem) {
            barElem.style.width = `${percentage}%`;
            barElem.innerText = `${Math.round(percentage)}%`;
        }
    };

    const removeProgressIndicator = () => {
        const indicator = document.getElementById('downloader-progress');
        if (indicator) indicator.remove();
    };

    // --- HÀM LẤY DANH SÁCH CHƯƠNG (Không đổi) ---
    const fetchChapterList = async (sourceId, bookId) => {
        // ... (Code lấy danh sách chương giống hệt phiên bản 2.0)
        const apiUrl = 'https://sangtacviet.com/index.php';
        const payload = `ngmar=chapterlist&h=${sourceId}&bookid=${bookId}&sajax=getchapterlist`;
        const refererUrl = window.location.href;
        try {
            updateProgress('Đang lấy danh sách chương...', 0);
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': refererUrl }, body: payload });
            if (!response.ok) throw new Error(`Lỗi mạng: ${response.status}`);
            const jsonData = await response.json();
            if (jsonData?.code !== 1 || !jsonData.oridata) throw new Error("API không trả về dữ liệu chương hợp lệ.");
            const chapters = [];
            const chapterData = jsonData.oridata.split('-//-');
            if (chapterData[0]?.split('-/-').length < 3) chapterData.shift();
            chapterData.forEach((line, index) => {
                const parts = line.split('-/-');
                if (parts.length < 3) return;
                const [ , chapterId, chapterTitle ] = parts;
                if (chapterId && chapterTitle && !isNaN(parseInt(chapterId))) {
                    chapters.push({ order: index + 1, chapterId: chapterId.trim(), title: chapterTitle.trim() });
                }
            });
            return chapters;
        } catch (error) {
            alert(`Không thể lấy danh sách chương: ${error.message}`);
            throw error; // Ném lỗi để dừng tiến trình
        }
    };

    // --- HÀM CHÍNH ĐỂ TẢI XUỐNG (ĐÃ NÂNG CẤP) ---
    GM_registerMenuCommand("Tải chương STV (Chống CAPTCHA) → ZIP", async () => {
        const novelMatch = window.location.pathname.match(/truyen\/([^/]+)\/\d+\/(\d+)\//);
        if (!novelMatch) {
            alert("Không thể lấy sourceId hoặc bookId từ URL.");
            return;
        }
        const [, sourceId, bookId] = novelMatch;
        const apiUrl = 'https://sangtacviet.com/index.php';

        createProgressIndicator();

        let allChapters;
        try {
            allChapters = await fetchChapterList(sourceId, bookId);
        } catch(e) {
            removeProgressIndicator();
            return;
        }
        if (allChapters.length === 0) {
            alert("Không tìm thấy chương nào.");
            removeProgressIndicator();
            return;
        }

        const rangeInput = prompt(`Đã tìm thấy ${allChapters.length} chương.\nNhập phạm vi cần tải (VD: 1-50).\nĐể trống để tải tất cả.`, `1-${allChapters.length}`);
        if (rangeInput === null) {
            removeProgressIndicator();
            return;
        }

        let start = 1, end = allChapters.length;
        if (rangeInput.trim() !== "") {
            const parts = rangeInput.split('-').map(n => parseInt(n.trim()));
            if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1]) || parts[0] <= 0 || parts[1] < parts[0]) {
                alert("Phạm vi không hợp lệ.");
                removeProgressIndicator();
                return;
            }
            [start, end] = parts;
        }

        const chaptersToDownload = allChapters.slice(start - 1, end);
        const zip = new JSZip();
        const totalChapters = chaptersToDownload.length;
        let captchaTab = null;

        for (let i = 0; i < totalChapters; i++) {
            const chapter = chaptersToDownload[i];
            const progress = ((i + 1) / totalChapters) * 100;
            updateProgress(`Đang tải chương ${i + 1}/${totalChapters}: ${chapter.title}`, progress);

            const payload = `bookid=${bookId}&h=${sourceId}&c=${chapter.chapterId}&ngmar=readc&sajax=readchapter&sty=1&exts=`;
            const chapterWebUrl = `https://sangtacviet.com/truyen/${sourceId}/1/${bookId}/${chapter.chapterId}/`;
            const fileName = `${String(chapter.order).padStart(5, '0')} - ${chapter.title.replace(/[\\/:*?"<>|]/g, '')}.html`;

            let success = false;
            let attempts = 0;
            const MAX_ATTEMPTS = 5; // Thử lại tối đa 5 lần cho một chương

            while (!success && attempts < MAX_ATTEMPTS) {
                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': chapterWebUrl },
                        body: payload
                    });

                    if (!response.ok) throw new Error(`Lỗi mạng: ${response.status}`);

                    const jsonData = await response.json();

                    // Điều kiện thành công: code là 0 và có trường data
                    if (jsonData?.code === "0" && typeof jsonData.data !== 'undefined') {
                        zip.file(fileName, jsonData.data);
                        success = true;
                        console.log(`✅ Tải thành công chương ${chapter.order}`);

                        // Nếu đã thành công, đóng tab captcha nếu có
                        if (captchaTab && !captchaTab.closed) {
                            captchaTab.close();
                            captchaTab = null;
                        }
                    } else {
                        // Ném lỗi với thông báo từ server để xử lý captcha
                        throw new Error(jsonData?.err || "Lỗi API không xác định");
                    }
                } catch (error) {
                    attempts++;
                    console.warn(`❌ Lỗi chương ${chapter.order} (lần ${attempts}/${MAX_ATTEMPTS}):`, error.message);

                    // --- LOGIC XỬ LÝ CAPTCHA ---
                    if (error.message.toLowerCase().includes('xác nhận')) {
                        updateProgress(`Dính CAPTCHA!\nVui lòng xác nhận ở tab mới.\nĐang chờ 15 giây...`, progress);

                        if (!captchaTab || captchaTab.closed) {
                            captchaTab = window.open(chapterWebUrl, '_blank', 'width=400,height=600,left=200,top=150');
                        } else {
                            // Nếu tab đã mở, có thể nó bị kẹt -> reload
                            captchaTab.location.reload();
                        }
                        await sleep(15000); // Chờ 15 giây để người dùng giải captcha
                    } else {
                        // Với các lỗi khác (mạng, server...), chỉ cần chờ một chút rồi thử lại
                        await sleep(3000 * attempts); // Chờ lâu hơn sau mỗi lần thất bại
                    }
                }
            } // Hết vòng lặp while

            if (!success) {
                console.error(`❌❌ Bỏ qua chương ${chapter.order} sau ${MAX_ATTEMPTS} lần thất bại.`);
                zip.file(fileName, `<!-- Tải lỗi chương ${chapter.order} sau ${MAX_ATTEMPTS} lần thử. -->`);
            }

            // Thêm một khoảng nghỉ ngắn giữa các chương để giảm tải
            await sleep(1000 + Math.random() * 1000); // Nghỉ từ 0.5s đến 1s
        }

        updateProgress(`Đang nén file ZIP...`, 100);
        const novelTitle = document.querySelector('h1.font-truyen')?.innerText.trim() || `STV_${bookId}`;
        const zipFileName = `${novelTitle}_Chương_${start}_đến_${end}.zip`;

        try {
            const content = await zip.generateAsync({ type: "blob" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = zipFileName;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (e) {
            alert(`Lỗi khi tạo file ZIP: ${e.message}`);
        } finally {
            removeProgressIndicator();
        }
    });
})();