// ==UserScript==
// @name         Wikidich PC Rename Fix
// @namespace    http://tampermonkey.net/
// @version      0.1
// @author       QuocBao
// @description  Như tên.
// @downloadURL  https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/tools/Wikidich-PC-Rename-Fix.user.js
// @updateURL    https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/tools/Wikidich-PC-Rename-Fix.user.js
// @match        *://wikicv.net/truyen/*/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    const log = (...a) => console.log("[RenameFix]", ...a);

    let lastRange = null;

    function safeCloneRange(r) {
        try { return r.cloneRange(); } catch { return null; }
    }

    function captureSelection() {
        const sel = window.getSelection?.();
        if (!sel || sel.rangeCount <= 0) return;

        const r = sel.getRangeAt(0);
        if (r && r.commonAncestorContainer) lastRange = safeCloneRange(r);
    }
    document.addEventListener("selectionchange", captureSelection, true);
    document.addEventListener("mouseup", captureSelection, true);
    document.addEventListener("keyup", captureSelection, true);

    function findReadingRoot() {
        const candidates = [
            "#chapter-content",
            ".chapter-content",
            "#chapterContent",
            ".reading-content",
            ".chapter",
            ".content",
            "article",
            "main",
        ];
        for (const s of candidates) {
            const el = document.querySelector(s);
            if (el) return el;
        }
        return document.body;
    }

    function ensureSelectionRange() {
        const sel = window.getSelection?.();
        if (!sel) return false;

        if (sel.rangeCount > 0) return true;

        if (lastRange) {
            try {
                sel.removeAllRanges();
                sel.addRange(lastRange);
                if (sel.rangeCount > 0) return true;
            } catch {}
        }

        const root = findReadingRoot();
        try {
            const r = document.createRange();
            r.selectNodeContents(root);
            r.collapse(true); // caret đầu content
            sel.removeAllRanges();
            sel.addRange(r);
            return sel.rangeCount > 0;
        } catch (e) {
            log("ensureSelectionRange failed:", e);
            return false;
        }
    }

    function showRenameModal() {
        const t = window.touchs;

        if (!ensureSelectionRange()) {
            log("Không tạo được Selection range => vẫn có thể lỗi.");
        }

        if (t && typeof t.showMdAddNameMobile === "function") {
            t.showMdAddNameMobile();
            return true;
        }

        const trigger = document.querySelector('[data-touch="showMdAddNameMobile"]');
        if (trigger) {
            trigger.click();
            return true;
        }

        return false;
    }

    function forceShowButton() {
        const wrapper = document.querySelector(".btn-fixed-wrapper");
        if (!wrapper) return false;

        wrapper.classList.remove("hide-on-large-only");
        if (wrapper.getAttribute("data-touch") === "untouchable") wrapper.removeAttribute("data-touch");
        wrapper.style.display = "block";
        wrapper.style.pointerEvents = "auto";
        wrapper.style.zIndex = "999999";

        const a = wrapper.querySelector('a[data-touch="showMdAddNameMobile"]') || wrapper.querySelector("a");
        if (!a) return false;

        a.addEventListener(
            "click",
            (ev) => {
                ev.preventDefault();
                ev.stopPropagation();

                const ok = showRenameModal();
                if (!ok) log("Không tìm thấy touchs.showMdAddNameMobile / trigger.");
            },
            true
        );

        return true;
    }

    setTimeout(() => {
        const ok = forceShowButton();
        if (ok) log("OK: Nút edit hiện trên PC + đã patch Selection.");
        else log("Không tìm thấy .btn-fixed-wrapper");
    }, 300);
})();
