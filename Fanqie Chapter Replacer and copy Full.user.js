// ==UserScript==
// @name         Fanqie Chapter Replacer and copy Full
// @namespace    https://github.com/BaoBao666888/
// @version      2.2
// @description  Thay nội dung chương trên fanqienovel từ API + nút copy tiêu đề + nội dung
// @icon         data:image/png;base64,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
// @downloadURL  https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Fanqie Chapter Replacer and copy Full.user.js
// @updateURL    https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Fanqie Chapter Replacer and copy Full.user.js
// @match        https://fanqienovel.com/reader/*
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  const itemId = location.pathname.match(/\/reader\/(\d+)/)?.[1];
  if (!itemId) return;

  function waitForToken(callback, fallback, maxTries = 20) {
    const interval = setInterval(() => {
      if (unsafeWindow.tokenOptions?.Fanqie) {
        clearInterval(interval);
        callback(unsafeWindow.tokenOptions.Fanqie);
      } else if (maxTries-- <= 0) {
        clearInterval(interval);
        fallback();
      }
    }, 300);
  }

  function addCopyButton() {
    const contentBox = document.querySelector('.muye-reader-content');
    const titleBox = document.querySelector('.muye-reader-title');
    const header = document.querySelector('.muye-reader-box-header');

    if (!contentBox || !titleBox || !header) return;

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Copy nội dung + tiêu đề';
    copyBtn.style.margin = '10px 0';
    copyBtn.style.padding = '6px 12px';
    copyBtn.style.border = '1px solid #ccc';
    copyBtn.style.borderRadius = '6px';
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.background = '#f4f4f4';
    copyBtn.style.fontSize = '14px';

    copyBtn.onclick = () => {
      const titleText = titleBox.innerText.trim();
      const paragraphs = Array.from(contentBox.querySelectorAll('p')).map(p => p.innerText.trim());
      const fullText = [titleText, '', ...paragraphs].join('\n\n');

      navigator.clipboard.writeText(fullText).then(() => {
        copyBtn.textContent = 'Đã copy!';
        setTimeout(() => (copyBtn.textContent = 'Copy nội dung + tiêu đề'), 2000);
      });
    };

    header.appendChild(copyBtn);
  }

  function fetchAndReplace(apiHost) {
    const url = `${apiHost}/content?item_id=${itemId}`;
    console.log('[Fanqie] Gọi API:', url);

    GM_xmlhttpRequest({
      method: 'GET',
      url,
      responseType: 'json',
      onload: (res) => {
        const data = res.response;
        const content = data?.data?.content || data?.content;
        const title = data?.data?.title || data?.title;

        if (!content) {
          alert('Không có nội dung chương');
          return;
        }

        document.querySelector('.muye-to-fanqie')?.remove();

        const contentBox = document.querySelector('.muye-reader-content');
        if (contentBox) contentBox.innerHTML = content;

        const titleBox = document.querySelector('.muye-reader-title');
        if (titleBox && title) titleBox.textContent = title;

        addCopyButton();

        console.log('[Fanqie] Đã thay nội dung chương');
      },
      onerror: (err) => {
        console.error('[Fanqie] Lỗi khi gọi API:', err);
      }
    });
  }

  waitForToken(
    (host) => fetchAndReplace(host),
    () => fetchAndReplace('http://rehaofan.jingluo.love')
  );
})();
