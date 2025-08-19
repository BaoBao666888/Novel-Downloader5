// ==UserScript==
// @name         Zongcai Novel Decoder
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Giải mã văn bản, quản lý ánh xạ ký tự, và xử lý ký tự mới một cách thông minh.
// @downloadURL  https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/decode/Zongcai-Novel-Decoder.user.js
// @updateURL    https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/decode/Zongcai-Novel-Decoder.user.js
// @author       QuocBao
// @match        https://www.eduask0471.com/book/*/*.html
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @require      https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ====================================================================================
    // CÀI ĐẶT & DỮ LIỆU
    // ====================================================================================
    const SCRIPT_PREFIX = 'ZND';

    const OCR_BLACKLIST = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ~!@#$%^&*()_+`-=[]\\{}|;:\'",./<>?';

    const defaultCharMap = {};

    async function getImageHash(src) {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error(`Lỗi khi tạo hash cho ảnh ${src}:`, error);
            return null;
        }
    }

    const db = {
        // DB chính của người dùng: { "filename.png": "ký tự" }
        getCharMap: () => {
            const storedMap = GM_getValue('charMap', null);
            if (storedMap) {
                try { return JSON.parse(storedMap); } catch (e) { return defaultCharMap; }
            }
            return defaultCharMap;
        },
        saveCharMap: (map) => GM_setValue('charMap', JSON.stringify(map)),

        // DB "bộ não" của script: { "image_hash": "ký tự" }
        getImageHashMap: () => {
            const storedMap = GM_getValue('imageHashMap', '{}');
            try { return JSON.parse(storedMap); } catch (e) { return {}; }
        },
        saveImageHashMap: (map) => GM_setValue('imageHashMap', JSON.stringify(map)),

        getSettings: () => {
            const defaults = { showDecodeButtonOnPage: true };
            const storedSettings = GM_getValue('settings', '{}');
            try { return { ...defaults, ...JSON.parse(storedSettings) }; } catch(e) { return defaults; }
        },
        saveSettings: (settings) => GM_setValue('settings', JSON.stringify(settings))
    };

    let charMap = db.getCharMap();
    let imageHashMap = db.getImageHashMap();
    let settings = db.getSettings();

    // ====================================================================================
    // GIAO DIỆN (UI)
    // ====================================================================================

    // CSS cho giao diện
    GM_addStyle(`
        #${SCRIPT_PREFIX}-fab-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .${SCRIPT_PREFIX}-fab {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background-color: #007bff;
            color: white;
            border: none;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            font-size: 24px;
            cursor: pointer;
            transition: background-color 0.3s, transform 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .${SCRIPT_PREFIX}-fab:hover {
            background-color: #0056b3;
            transform: scale(1.05);
        }
        .${SCRIPT_PREFIX}-modal-backdrop {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .${SCRIPT_PREFIX}-modal-content {
            background: #fff;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            position: relative;
        }
        .${SCRIPT_PREFIX}-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .${SCRIPT_PREFIX}-modal-title {
            font-size: 1.5rem;
            font-weight: 500;
            margin: 0;
        }
        .${SCRIPT_PREFIX}-modal-close {
            border: none; background: none; font-size: 2rem;
            cursor: pointer; color: #6c757d; line-height: 1;
            padding: 0 5px;
        }
        .${SCRIPT_PREFIX}-modal-body {
            overflow-y: auto;
        }
        .${SCRIPT_PREFIX}-result-textarea {
            width: 100%;
            min-height: 400px;
            font-size: 16px;
            line-height: 1.6;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 10px;
            resize: vertical;
            box-sizing: border-box;
        }
        .${SCRIPT_PREFIX}-modal-footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #dee2e6;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        .${SCRIPT_PREFIX}-btn {
            padding: 10px 20px;
            border-radius: 5px;
            border: none;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.2s;
        }
        .${SCRIPT_PREFIX}-btn-primary { background-color: #007bff; color: white; }
        .${SCRIPT_PREFIX}-btn-primary:hover { background-color: #0056b3; }
        .${SCRIPT_PREFIX}-btn-secondary { background-color: #6c757d; color: white; }
        .${SCRIPT_PREFIX}-btn-secondary:hover { background-color: #5a6268; }
        .${SCRIPT_PREFIX}-btn-danger { background-color: #dc3545; color: white; }
        .${SCRIPT_PREFIX}-btn-danger:hover { background-color: #c82333; }

        /* Settings Panel Styles */
        .${SCRIPT_PREFIX}-table { width: 100%; border-collapse: collapse; }
        .${SCRIPT_PREFIX}-table th, .${SCRIPT_PREFIX}-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
            vertical-align: middle;
        }
        .${SCRIPT_PREFIX}-table th { background-color: #f2f2f2; }
        .${SCRIPT_PREFIX}-table img { max-height: 24px; vertical-align: middle; }
        .${SCRIPT_PREFIX}-table input { width: 50px; text-align: center; font-size: 16px; }
        .${SCRIPT_PREFIX}-settings-section { margin-bottom: 20px; }
        .${SCRIPT_PREFIX}-settings-section h3 { margin-top: 0; }
        .${SCRIPT_PREFIX}-toggle { display: flex; align-items: center; gap: 10px; }
        .${SCRIPT_PREFIX}-toggle-label { font-size: 16px; }
        /* Toggle Switch CSS */
        .switch { position: relative; display: inline-block; width: 60px; height: 34px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #2196F3; }
        input:checked + .slider:before { transform: translateX(26px); }
        .${SCRIPT_PREFIX}-unknown-grid {
            display: grid;
            grid-template-columns: 60px 1fr;
            gap: 15px;
            align-items: center;
            row-gap: 10px;
        }
        .${SCRIPT_PREFIX}-img-container {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .${SCRIPT_PREFIX}-img-tooltip {
            display: none;
            position: absolute;
            top: 50%;
            left: 120%; /* Hiện bên phải ảnh gốc */
            transform: translateY(-50%);
            z-index: 10002; /* Nổi lên trên mọi thứ */
            border: 2px solid #007bff;
            background: white;
            padding: 5px;
            border-radius: 5px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            width: auto;
            height: 64px; /* Giữ chiều cao cố định để dễ nhìn */
        }
        .${SCRIPT_PREFIX}-img-container:hover .${SCRIPT_PREFIX}-img-tooltip {
            display: block; /* Hiện khi di chuột vào container */
        }
    `);

    // Hàm tạo modal chung
    function createModal(title, bodyContent, footerButtons) {
        const backdrop = document.createElement('div');
        backdrop.className = `${SCRIPT_PREFIX}-modal-backdrop`;
        backdrop.innerHTML = `
            <div class="${SCRIPT_PREFIX}-modal-content">
                <div class="${SCRIPT_PREFIX}-modal-header">
                    <h2 class="${SCRIPT_PREFIX}-modal-title">${title}</h2>
                    <button class="${SCRIPT_PREFIX}-modal-close">&times;</button>
                </div>
                <div class="${SCRIPT_PREFIX}-modal-body"></div>
                <div class="${SCRIPT_PREFIX}-modal-footer"></div>
            </div>
        `;

        const modalBody = backdrop.querySelector(`.${SCRIPT_PREFIX}-modal-body`);
        if (typeof bodyContent === 'string') {
            modalBody.innerHTML = bodyContent;
        } else {
            modalBody.appendChild(bodyContent);
        }

        const modalFooter = backdrop.querySelector(`.${SCRIPT_PREFIX}-modal-footer`);
        footerButtons.forEach(btnInfo => {
            const button = document.createElement('button');
            button.textContent = btnInfo.text;
            button.className = `${SCRIPT_PREFIX}-btn ${btnInfo.class}`;
            button.onclick = btnInfo.onClick;
            modalFooter.appendChild(button);
        });

        const closeModal = () => document.body.removeChild(backdrop);
        backdrop.querySelector(`.${SCRIPT_PREFIX}-modal-close`).onclick = closeModal;
        backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };

        document.body.appendChild(backdrop);
        return backdrop;
    }



    // Hiển thị bảng kết quả
    function showResultPanel(decodedText) {
        const textArea = document.createElement('textarea');
        textArea.className = `${SCRIPT_PREFIX}-result-textarea`;
        textArea.value = decodedText;
        textArea.readOnly = true;

        const copyButtonInfo = {
            text: 'Sao chép',
            class: `${SCRIPT_PREFIX}-btn-primary`,
            onClick: (e) => {
                const btn = e.target;
                navigator.clipboard.writeText(decodedText).then(() => {
                    btn.textContent = 'Đã sao chép!';
                    setTimeout(() => { btn.textContent = 'Sao chép'; }, 2000);
                }).catch(err => {
                    btn.textContent = 'Lỗi!';
                    console.error(`${SCRIPT_PREFIX}: Lỗi sao chép:`, err);
                });
            }
        };

        createModal('Văn bản đã giải mã', textArea, [copyButtonInfo]);
        textArea.select();
    }

    function showSettingsPanel() {
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="${SCRIPT_PREFIX}-settings-section">
                <h3>Tùy chọn Giao diện</h3>
                <div class="${SCRIPT_PREFIX}-toggle">
                    <span class="${SCRIPT_PREFIX}-toggle-label">Hiện nút "Giải Mã" trên trang</span>
                    <label class="switch"><input type="checkbox" id="${SCRIPT_PREFIX}-show-btn-toggle"><span class="slider"></span></label>
                </div>
            </div>
            <!-- CÔNG CỤ XÂY DỰNG "BỘ NÃO" TỪ DỮ LIỆU CŨ -->
            <div class="${SCRIPT_PREFIX}-settings-section">
                <h3>Công cụ Đồng bộ</h3>
                <p>Nhấn nút này để script "học" lại từ dữ liệu ánh xạ hiện tại của bạn, giúp nó nhận diện các ảnh trùng lặp trong tương lai.</p>
                <button id="${SCRIPT_PREFIX}-sync-btn" class="${SCRIPT_PREFIX}-btn ${SCRIPT_PREFIX}-btn-primary">Đồng bộ hóa "bộ não" AI</button>
            </div>
            <div class="${SCRIPT_PREFIX}-settings-section">
                <h3>Bảng Ánh xạ Ký tự</h3>
                <div id="${SCRIPT_PREFIX}-map-table-container"></div>
                <button id="${SCRIPT_PREFIX}-add-row-btn" class="${SCRIPT_PREFIX}-btn ${SCRIPT_PREFIX}-btn-primary" style="margin-top: 10px;">Thêm mới</button>
            </div>
            <div class="${SCRIPT_PREFIX}-settings-section">
                <h3>Nhập / Xuất Dữ liệu</h3>
                <textarea id="${SCRIPT_PREFIX}-io-textarea" class="${SCRIPT_PREFIX}-result-textarea" style="height: 150px; font-family: monospace;" placeholder="Dán dữ liệu JSON (tên file -> ký tự) vào đây..."></textarea>
                <div style="margin-top: 10px; display: flex; gap: 10px;">
                    <button id="${SCRIPT_PREFIX}-import-btn" class="${SCRIPT_PREFIX}-btn ${SCRIPT_PREFIX}-btn-primary">Nhập</button>
                    <button id="${SCRIPT_PREFIX}-export-btn" class="${SCRIPT_PREFIX}-btn ${SCRIPT_PREFIX}-btn-secondary">Xuất</button>
                </div>
            </div>
        `;
        createModal('Cài đặt Decoder', container, []);
        renderCharMapTable();

        // --- Event Listeners ---
        const showBtnToggle = document.getElementById(`${SCRIPT_PREFIX}-show-btn-toggle`);
        showBtnToggle.checked = settings.showDecodeButtonOnPage;
        showBtnToggle.onchange = () => {
            settings.showDecodeButtonOnPage = showBtnToggle.checked;
            db.saveSettings(settings);
            updateFabVisibility();
        };

        document.getElementById(`${SCRIPT_PREFIX}-sync-btn`).onclick = async (e) => {
            const btn = e.target;
            if (!confirm("Quá trình này sẽ quét lại toàn bộ dữ liệu của bạn để xây dựng bộ nhớ nhận diện ảnh trùng lặp và sắp xếp lại bảng. Tiếp tục?")) return;
            btn.disabled = true;
            btn.textContent = 'Đang đồng bộ... (0%)';
            try {
                const entries = Object.entries(charMap);
                const fileToHashMap = {}; // Tạo map tạm để lưu hash

                for (const [i, [filename, char]] of entries.entries()) {
                    const hash = await getImageHash(`https://www.eduask0471.com/wzbodyimg/${filename}`);
                    if (hash) {
                        imageHashMap[hash] = char;
                        fileToHashMap[filename] = hash; // Lưu lại hash cho việc sắp xếp
                    }
                    btn.textContent = `Đang đồng bộ... (${Math.round(((i + 1) / entries.length) * 100)}%)`;
                }
                db.saveImageHashMap(imageHashMap);

                // BƯỚC SẮP XẾP LẠI
                const sortedEntries = Object.entries(charMap).sort(([fileA], [fileB]) => {
                    const hashA = fileToHashMap[fileA] || '';
                    const hashB = fileToHashMap[fileB] || '';
                    if (hashA < hashB) return -1;
                    if (hashA > hashB) return 1;
                    // Nếu hash giống nhau, sắp xếp theo tên file
                    return fileA.localeCompare(fileB);
                });

                // Cập nhật lại charMap đã được sắp xếp
                charMap = Object.fromEntries(sortedEntries);
                db.saveCharMap(charMap);

                // Vẽ lại bảng
                renderCharMapTable();

                alert(`Đồng bộ và sắp xếp hoàn tất!`);
            } catch (error) {
                alert("Có lỗi xảy ra trong quá trình đồng bộ.");
            } finally {
                btn.disabled = false;
                btn.textContent = 'Đồng bộ hóa "bộ não" AI';
            }
        };

        document.getElementById(`${SCRIPT_PREFIX}-add-row-btn`).onclick = () => {
            const tableBody = document.querySelector(`#${SCRIPT_PREFIX}-map-table-container tbody`);
            const newRow = createCharMapRow('', '');
            tableBody.appendChild(newRow);
            newRow.querySelector('.filename-input').focus();
        };
        document.getElementById(`${SCRIPT_PREFIX}-export-btn`).onclick = () => {
            document.getElementById(`${SCRIPT_PREFIX}-io-textarea`).value = JSON.stringify(charMap, null, 2);
        };
        document.getElementById(`${SCRIPT_PREFIX}-import-btn`).onclick = () => {
            const textarea = document.getElementById(`${SCRIPT_PREFIX}-io-textarea`);
            try {
                const newMap = JSON.parse(textarea.value);
                if (typeof newMap !== 'object' || newMap === null) throw new Error("Dữ liệu không hợp lệ.");
                charMap = newMap;
                db.saveCharMap(charMap);
                alert("Nhập thành công! Hãy nhấn nút 'Đồng bộ hóa' để script học từ dữ liệu mới này.");
                renderCharMapTable();
            } catch (e) {
                alert("Lỗi khi nhập dữ liệu. Vui lòng kiểm tra lại định dạng JSON.");
            }
        };
    }

    function renderCharMapTable() {
        const container = document.getElementById(`${SCRIPT_PREFIX}-map-table-container`);
        if (!container) return;
        const table = document.createElement('table');
        table.className = `${SCRIPT_PREFIX}-table`;
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Ảnh (Tên file)</th>
                    <th>Ký tự</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        Object.entries(charMap).sort().forEach(([filename, char]) => { // Sắp xếp theo alphabet
            tbody.appendChild(createCharMapRow(filename, char));
        });
        container.innerHTML = '';
        container.appendChild(table);
    }

    function createCharMapRow(filename, char) {
        const tr = document.createElement('tr');
        tr.dataset.filename = filename;
        tr.innerHTML = `
            <td>
                <img src="https://www.eduask0471.com/wzbodyimg/${filename}" alt="${filename}" title="${filename}">
                <input type="text" class="filename-input" value="${filename}" style="display:none; width: 100%;">
            </td>
            <td>
                <span class="char-span">${char}</span>
                <input type="text" class="char-input" value="${char}" maxlength="1" style="display:none;">
            </td>
            <td>
                <button class="edit-btn ${SCRIPT_PREFIX}-btn ${SCRIPT_PREFIX}-btn-secondary">Sửa</button>
                <button class="save-btn ${SCRIPT_PREFIX}-btn ${SCRIPT_PREFIX}-btn-primary" style="display:none;">Lưu</button>
                <button class="delete-btn ${SCRIPT_PREFIX}-btn ${SCRIPT_PREFIX}-btn-danger">Xóa</button>
            </td>
        `;
        const charSpan = tr.querySelector('.char-span');
        const charInput = tr.querySelector('.char-input');
        const filenameInput = tr.querySelector('.filename-input');
        const editBtn = tr.querySelector('.edit-btn');
        const saveBtn = tr.querySelector('.save-btn');
        const deleteBtn = tr.querySelector('.delete-btn');

        const toggleEdit = (isEditing) => {
            charSpan.style.display = isEditing ? 'none' : 'inline';
            charInput.style.display = isEditing ? 'inline' : 'none';
            tr.querySelector('img').style.display = isEditing ? 'none' : 'inline-block';
            filenameInput.style.display = isEditing ? 'inline-block' : 'none';
            editBtn.style.display = isEditing ? 'none' : 'inline-block';
            saveBtn.style.display = isEditing ? 'inline-block' : 'none';
        };

        editBtn.onclick = () => toggleEdit(true);

        deleteBtn.onclick = () => {
            if (confirm(`Bạn có chắc muốn xóa ánh xạ cho "${filename}"?`)) {
                delete charMap[filename];
                db.saveCharMap(charMap);
                tr.remove();
                // Lưu ý: Không xóa khỏi imageHashMap để giữ "kiến thức" lại
            }
        };

        //  Nút Lưu sẽ cập nhật cả 2 database
        saveBtn.onclick = async () => {
            const oldFilename = tr.dataset.filename;
            const newFilename = filenameInput.value.trim();
            const newChar = charInput.value.trim();

            if (!newFilename || !newChar) {
                alert("Tên file và ký tự không được để trống."); return;
            }

            // Cập nhật charMap
            if (oldFilename && oldFilename !== newFilename) delete charMap[oldFilename];
            charMap[newFilename] = newChar;
            db.saveCharMap(charMap);

            // Cập nhật imageHashMap
            const imageUrl = `https://www.eduask0471.com/wzbodyimg/${newFilename}`;
            const hash = await getImageHash(imageUrl);
            if (hash) {
                imageHashMap[hash] = newChar;
                db.saveImageHashMap(imageHashMap);
            }

            // Cập nhật lại giao diện
            tr.dataset.filename = newFilename;
            tr.querySelector('img').src = imageUrl;
            tr.querySelector('img').alt = newFilename;
            tr.querySelector('img').title = newFilename;
            charSpan.textContent = newChar;
            toggleEdit(false);
            alert("Đã lưu!");
        };
        return tr;
    }

    function preprocessImageForOCR(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const scaleFactor = 3;
                const canvas = document.createElement('canvas');
                canvas.width = img.width * scaleFactor;
                canvas.height = img.height * scaleFactor;
                const ctx = canvas.getContext('2d');

                // Tắt tính năng làm mịn ảnh của trình duyệt
                ctx.imageSmoothingEnabled = false;

                // 1. Tô nền trắng
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 2. Vẽ ảnh gốc (đã được phóng to mà không bị mờ) lên trên
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    // ====================================================================================
    // LOGIC CHÍNH
    // ====================================================================================

    async function startDecoding() {
        console.log(`${SCRIPT_PREFIX}: Bắt đầu giải mã...`);
        const firstImage = document.querySelector('img.hz');

        // TRƯỜNG HỢP 1: CÓ ẢNH MÃ HÓA
        if (firstImage) {
            const contentDiv = firstImage.parentElement.parentElement.parentElement;
            if (!contentDiv || !contentDiv.querySelector('p')) { alert("Lỗi: Không tìm thấy khung nội dung."); return; }

            // --- BƯỚC 1: LỌC VÀ SẮP XẾP LẠI CÁC ĐOẠN VĂN THEO ĐÚNG THỨ TỰ HIỂN THỊ ---
            const paragraphWrappers = Array.from(contentDiv.children)
                .filter(el => el.tagName === 'DIV' && el.querySelector('p') && el.offsetParent !== null)
                .sort((a, b) => a.offsetTop - b.offsetTop);

            if (paragraphWrappers.length === 0) {
                alert("Không tìm thấy đoạn văn bản nào hợp lệ để giải mã.");
                return;
            }

            const imagesOnPage = paragraphWrappers.flatMap(wrapper => Array.from(wrapper.querySelectorAll('img.hz')));
            let unknowns = {}; // { filename: { src, hash } }
            let hasNewKnowledge = false;

            // --- BƯỚC 2: Quét và xử lý các ảnh chưa biết ---
            for (const img of imagesOnPage) {
                const filename = img.src.split('/').pop();
                if (charMap[filename]) continue; // Đã biết, bỏ qua

                const hash = await getImageHash(img.src);
                if (hash && imageHashMap[hash]) {
                    console.log(`${SCRIPT_PREFIX}: Tự động nhận diện ${filename} là '${imageHashMap[hash]}'`);
                    charMap[filename] = imageHashMap[hash];
                    hasNewKnowledge = true;
                } else {
                    if(!unknowns[filename]) unknowns[filename] = { src: img.src, hash: hash };
                }
            }

            if (hasNewKnowledge) db.saveCharMap(charMap); // Lưu lại kiến thức mới

            // --- BƯỚC 3: Nếu có ảnh cần OCR, hiển thị bảng ---
            if (Object.keys(unknowns).length > 0) {
                await showUnknownCharsPanel(unknowns);
                return; // Dừng lại, hàm OCR sẽ gọi lại startDecoding sau
            }

            // --- BƯỚC 4: Thay thế văn bản TỪ CÁC ĐOẠN VĂN ĐÃ ĐƯỢC SẮP XẾP ĐÚNG ---
            let fullDecodedText = paragraphWrappers.map(wrapper => {
                const p = wrapper.querySelector('p');
                if (!p || (p.textContent && (p.textContent.includes('sh u w u .com') || p.textContent.includes('si m i s h u wu. c o m')))) return null;
                let pText = '';
                p.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) pText += node.textContent;
                    else if (node.nodeName === 'IMG' && node.classList.contains('hz')) {
                        pText += charMap[node.src.split('/').pop()] || `[?]`;
                    } else if (node.nodeName === 'BR') pText += '\n';
                });
                return pText;
            }).filter(p => p !== null).join('\n\n');

            const cleanedText = fullDecodedText.replace(/\n{2,}/g, '\n\n').trim();
            showResultPanel(cleanedText);

        // TRƯỜNG HỢP 2: KHÔNG CÓ ẢNH MÃ HÓA
        } else {
            console.log(`${SCRIPT_PREFIX}: Không tìm thấy ảnh mã hóa, xử lý như văn bản thường.`);
            const contentDiv = document.getElementById('C0NTENT');
            if (!contentDiv) {
                alert("Không tìm thấy ảnh mã hóa và cũng không tìm thấy khung nội dung #C0NTENT.");
                return;
            }

            // Lọc và sắp xếp các đoạn văn theo thứ tự hiển thị
            const paragraphWrappers = Array.from(contentDiv.children)
                .filter(el => el.tagName === 'DIV' && (el.querySelector('p') || el.querySelector('h1')) && el.offsetParent !== null)
                .sort((a, b) => a.offsetTop - b.offsetTop);

            if (paragraphWrappers.length === 0) {
                alert("Không tìm thấy đoạn văn bản nào hợp lệ để lấy nội dung.");
                return;
            }

            // Lấy text từ các thẻ p và h1 đã được sắp xếp
            const fullText = paragraphWrappers.map(wrapper => {
                const contentElement = wrapper.querySelector('p, h1');
                // Lọc bỏ các dòng quảng cáo
                if (!contentElement || (contentElement.textContent && (contentElement.textContent.includes('xiguashuwu.com') || contentElement.textContent.includes('sh u w u .com')))) {
                    return null;
                }
                // .innerText sẽ tự động xử lý các thẻ <br> thành ký tự xuống dòng
                return contentElement.innerText;
            }).filter(text => text !== null && text.trim() !== '').join('\n\n');

            const cleanedText = fullText.replace(/\n{2,}/g, '\n\n').trim();
            showResultPanel(cleanedText);
        }
    }

    async function showUnknownCharsPanel(unknowns) {
        const container = document.createElement('div');
        container.innerHTML = `
  <p>Phát hiện <b>${Object.keys(unknowns).length}</b> ký tự ảnh mới. Script sẽ tự động nhận diện:</p>
  <p style="color:red; font-weight:bold;">
    ⚠️ Các ký tự được nhận diện bởi AI, hãy kiểm tra thật kỹ để tránh sai xóa.
  </p>
`;
        const grid = document.createElement('div');
        grid.className = `${SCRIPT_PREFIX}-unknown-grid`;
        Object.keys(unknowns).forEach(filename => {
            grid.innerHTML += `<div class="${SCRIPT_PREFIX}-img-container"><img src="${unknowns[filename].src}"></div><input type="text" data-filename="${filename}" placeholder="Đang nhận diện..." maxlength="1" class="${SCRIPT_PREFIX}-btn" style="border: 1px solid #ccc;">`;
        });
        container.appendChild(grid);

        const saveButtonInfo = {
            text: 'Lưu & Giải mã lại', class: `${SCRIPT_PREFIX}-btn-primary`,
            onClick: (e) => {
                modal.querySelectorAll(`.${SCRIPT_PREFIX}-unknown-grid input`).forEach(input => {
                    const filename = input.dataset.filename;
                    const char = input.value.trim();
                    const hash = unknowns[filename].hash;
                    if (char) {
                        charMap[filename] = char; // Cập nhật DB người dùng
                        if (hash) imageHashMap[hash] = char; // Cập nhật "bộ não"
                    }
                });
                db.saveCharMap(charMap);
                db.saveImageHashMap(imageHashMap);
                modal.querySelector(`.${SCRIPT_PREFIX}-modal-close`).click();
                startDecoding();
            }
        };
        const modal = createModal('Xử lý Ký tự mới', container, [saveButtonInfo]);

        // --- OCR LOGIC ---
        const worker = await Tesseract.createWorker('chi_sim');
        await worker.setParameters({
            tessedit_pageseg_mode: Tesseract.PSM.SINGLE_CHAR,
            tessedit_char_blacklist: OCR_BLACKLIST,
        });
        for (const filename in unknowns) {
            const inputElement = modal.querySelector(`input[data-filename="${filename}"]`);
            try {
                const processedImageSrc = await preprocessImageForOCR(unknowns[filename].src);
                const { data: { text } } = await worker.recognize(processedImageSrc);
                const char = text.trim().replace(/\s/g, '').charAt(0);
                if (inputElement) {
                    if (char) inputElement.value = char;
                    inputElement.placeholder = 'Nhập ký tự Hán';
                }
            } catch (error) {
                if (inputElement) inputElement.placeholder = 'Lỗi nhận diện';
            }
        }
        await worker.terminate();
    }

    // ====================================================================================
    // KHỞI TẠO
    // ====================================================================================

    function initialize() {
        // Tạo các nút bấm nổi trên trang
        const fabContainer = document.createElement('div');
        fabContainer.id = `${SCRIPT_PREFIX}-fab-container`;
        fabContainer.innerHTML = `
            <button id="${SCRIPT_PREFIX}-settings-btn" class="${SCRIPT_PREFIX}-fab" title="Mở Cài đặt Decoder">&#9881;</button>
            <button id="${SCRIPT_PREFIX}-decode-btn" class="${SCRIPT_PREFIX}-fab" title="Giải Mã Nội Dung">&#128270;</button>
        `;
        document.body.appendChild(fabContainer);

        document.getElementById(`${SCRIPT_PREFIX}-decode-btn`).onclick = startDecoding;
        document.getElementById(`${SCRIPT_PREFIX}-settings-btn`).onclick = showSettingsPanel;

        updateFabVisibility();

        GM_registerMenuCommand("Giải Mã Nội Dung", startDecoding);
        GM_registerMenuCommand("Mở Cài đặt Decoder", showSettingsPanel);
    }

    function updateFabVisibility() {
        const fabContainer = document.getElementById(`${SCRIPT_PREFIX}-fab-container`);
        if (fabContainer) {
            fabContainer.style.display = settings.showDecodeButtonOnPage ? 'flex' : 'none';
        }
    }
    window.addEventListener('load', initialize);

})();