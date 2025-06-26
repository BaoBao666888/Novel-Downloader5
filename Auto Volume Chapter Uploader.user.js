// ==UserScript==
// @name         Auto Volume/Chapter Uploader
// @namespace    http://tampermonkey.net/
// @author       BaoBao
// @version      0.2
// @description  Tự động thêm chương và gán file thật sự (fix lỗi không upload)
// @match        https://truyenwikidich.net/nhung-file
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Tạo nút thao tác thủ công
    const btn = document.createElement('button');
    btn.innerText = '📂 Auto Thêm Chương';
    btn.style.position = 'fixed';
    btn.style.top = '20px';
    btn.style.right = '20px';
    btn.style.zIndex = '9999';
    document.body.appendChild(btn);

    btn.onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        input.multiple = true;

        input.onchange = async () => {
            const files = Array.from(input.files);
            files.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN', { numeric: true }));

            const addChapterBtn = document.querySelector('[data-action="addChapterInfo"]');
            const chapterWrappers = () => document.querySelectorAll('.chapter-info-wrapper');

            // Thêm đủ dòng chương
            while (chapterWrappers().length < files.length) {
                addChapterBtn?.click();
                await new Promise(r => setTimeout(r, 100)); // đợi DOM render
            }

            const wrappers = chapterWrappers();
            files.forEach((file, idx) => {
                const wrapper = wrappers[idx];

                const nameInput = wrapper.querySelector('input[name="name"]');
                const fileTextInput = wrapper.querySelector('input.file-path');
                const fileInputReal = wrapper.querySelector('input[type="file"]');

                const chapterName = file.name.replace(/\.txt$/i, '');

                nameInput.value = chapterName;
                fileTextInput.value = file.name;

                // Gán File thật sự vào input[type="file"]
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInputReal.files = dataTransfer.files;
            });

            alert(`✅ Đã thêm ${files.length} chương, bao gồm tên và file.`);
        };

        input.click();
    };
})();
