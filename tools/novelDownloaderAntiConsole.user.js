// ==UserScript==
// @name         NovelDownloader Helper - AntiClear
// @namespace    https://github.com/BaoBao666888/Novel-Downloader5
// @author       QuocBao
// @version      0.2
// @description  Ngăn web tự clear console, anti-debug cơ bản
// @match        *://*/*
// @downloadURL  https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/tools/novelDownloaderAntiConsole.user.js
// @updateURL    https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/tools/novelDownloaderAntiConsole.user.js
// @run-at       document-start
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    unsafeWindow.__ND_ANTI_INSTALLED__ = true;

    /************* 1. Chặn console.clear *************/
    function patchConsole(c) {
        if (!c) return;
        try {
            if (!c._realClear && typeof c.clear === 'function') {
                c._realClear = c.clear;
            }

            Object.defineProperty(c, 'clear', {
                value: function() {
                    console.log('[TM] console.clear() bị chặn');
                },
                writable: false,
                configurable: false,
                enumerable: true
            });
        } catch (e) {
            c.clear = function() {
                console.log('[TM] console.clear() bị chặn (fallback)');
            };
        }
    }

    patchConsole(console);
    patchConsole(unsafeWindow.console);

    /************* 2. Chặn web bắt F12 / Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+U *************/
    (function blockDebugKeys() {
        window.addEventListener('keydown', function(e) {
            const key = e.key || e.keyCode;

            const isF12 = key === 'F12' || key === 123;
            const isCtrlShiftI = e.ctrlKey && e.shiftKey && (key === 'I' || key === 'i' || key === 73);
            const isCtrlShiftJ = e.ctrlKey && e.shiftKey && (key === 'J' || key === 'j' || key === 74);
            const isCtrlShiftC = e.ctrlKey && e.shiftKey && (key === 'C' || key === 'c' || key === 67);
            const isCtrlU = e.ctrlKey && (key === 'U' || key === 'u' || key === 85);

            if (isF12 || isCtrlShiftI || isCtrlShiftJ || isCtrlShiftC || isCtrlU) {
                // Ngăn web bắt phím, nhưng KHÔNG chặn browser → DevTools vẫn mở
                e.stopImmediatePropagation();
                // KHÔNG gọi preventDefault, để trình duyệt xử lý tiếp
                // e.preventDefault(); // chỉ dùng nếu muốn chặn luôn hành vi default
                // console.log('[TM] Blocked debug key:', key);
            }
        }, true); // capture = true để chạy TRƯỚC handler của trang
    })();

    /************* 3. Lọc mấy setInterval/setTimeout dạng chuỗi có "debugger" *************/
    (function patchTimers() {
        const w = unsafeWindow;

        const _setInterval = w.setInterval.bind(w);
        const _setTimeout = w.setTimeout.bind(w);

        w.setInterval = function(handler, timeout, ...args) {
            if (typeof handler === 'string' && /debugger/.test(handler)) {
                console.log('[TM] Blocked setInterval debugger code');
                return 0; // giống như không tạo interval
            }
            return _setInterval(handler, timeout, ...args);
        };

        w.setTimeout = function(handler, timeout, ...args) {
            if (typeof handler === 'string' && /debugger/.test(handler)) {
                console.log('[TM] Blocked setTimeout debugger code');
                return 0;
            }
            return _setTimeout(handler, timeout, ...args);
        };
    })();

})();
