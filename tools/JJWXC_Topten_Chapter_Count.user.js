// ==UserScript==
// @name         JJWXC Topten Chapter Count
// @namespace    https://jjwxc.net/
// @version      0.1.0
// @description  Thêm cột hien thị số chương vào bảng Topten của JJWXC
// @author       QuocBao
// @icon         data:image/png;base64,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
// @downloadURL  https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/tools/JJWXC_Topten_Chapter_Count.user.js
// @updateURL    https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/tools/JJWXC_Topten_Chapter_Count.user.js
// @match        https://www.jjwxc.net/topten.php*
// @match        http://www.jjwxc.net/topten.php*
// @grant        GM_xmlhttpRequest
// @connect      app.jjwxc.net
// ==/UserScript==

(function () {
    'use strict';

    const API_BASE = 'https://app.jjwxc.net/androidapi/novelbasicinfo?novelId=';
    const MAX_CONCURRENT = 3;
    const REQUEST_DELAY_MS = 1000;
    const cache = new Map();
    let paused = false;
    let loading = true;
    let resumeResolver = null;
    let controlEl = null;

    function gmGet(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) Chrome/90.0.0.0 Mobile Safari/537.36'
                },
                onload: (res) => resolve(res),
                onerror: reject,
                ontimeout: reject
            });
        });
    }

    async function fetchChapterCount(novelId) {
        if (!novelId) return null;
        if (cache.has(novelId)) return cache.get(novelId);
        try {
            const res = await gmGet(`${API_BASE}${novelId}`);
            const data = JSON.parse(res.responseText);
            const count = data?.maxChapterId ? String(data.maxChapterId) : '';
            cache.set(novelId, count);
            return count;
        } catch (err) {
            console.warn('[JJWXC Topten] fetchChapterCount failed:', novelId, err);
            cache.set(novelId, '');
            return '';
        }
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function waitWhilePaused() {
        if (!paused) return Promise.resolve();
        return new Promise((resolve) => {
            resumeResolver = resolve;
        });
    }

    function setPausedState(nextPaused) {
        if (paused === nextPaused) return;
        paused = nextPaused;
        updateControlState();
        if (!paused && resumeResolver) {
            const resume = resumeResolver;
            resumeResolver = null;
            resume();
        }
    }

    function updateControlState() {
        if (!controlEl) return;
        if (!loading) {
            controlEl.dataset.state = 'done';
            return;
        }
        controlEl.dataset.state = paused ? 'paused' : 'loading';
    }

    function ensureControl() {
        if (controlEl) return controlEl;
        const style = document.createElement('style');
        style.textContent = `
            .jjwxc-loader-control {
                position: fixed;
                top: 12px;
                left: 12px;
                width: 36px;
                height: 36px;
                z-index: 99999;
                user-select: none;
            }
            .jjwxc-loader-ring {
                position: absolute;
                inset: 0;
                border: 2px solid rgba(255, 255, 255, 0.95);
                border-top-color: transparent;
                border-radius: 50%;
                animation: jjwxc-spin 1s linear infinite;
                box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
            }
            .jjwxc-loader-btn {
                position: absolute;
                inset: 4px;
                border-radius: 50%;
                border: 0;
                background: #2bb673;
                cursor: pointer;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
            }
            .jjwxc-loader-btn:focus {
                outline: 2px solid rgba(255, 255, 255, 0.8);
                outline-offset: 2px;
            }
            .jjwxc-loader-control[data-state="loading"] .jjwxc-loader-btn::before,
            .jjwxc-loader-control[data-state="loading"] .jjwxc-loader-btn::after {
                content: "";
                width: 4px;
                height: 12px;
                background: #ffffff;
                border-radius: 1px;
            }
            .jjwxc-loader-control[data-state="loading"] .jjwxc-loader-btn::before {
                margin-right: 3px;
            }
            .jjwxc-loader-control[data-state="paused"] .jjwxc-loader-btn::before {
                content: "";
                width: 0;
                height: 0;
                border-top: 7px solid transparent;
                border-bottom: 7px solid transparent;
                border-left: 12px solid #ffffff;
                margin-left: 2px;
            }
            .jjwxc-loader-control[data-state="paused"] .jjwxc-loader-ring {
                animation: none;
                opacity: 0.6;
            }
            .jjwxc-loader-control[data-state="done"] .jjwxc-loader-ring {
                animation: none;
                opacity: 0.25;
            }
            .jjwxc-loader-control[data-state="done"] .jjwxc-loader-btn {
                background: #9aa0a6;
                cursor: default;
            }
            .jjwxc-loader-control[data-state="done"] .jjwxc-loader-btn::before {
                content: "";
                width: 0;
                height: 0;
                border-top: 7px solid transparent;
                border-bottom: 7px solid transparent;
                border-left: 12px solid #ffffff;
                margin-left: 2px;
                opacity: 0.5;
            }
            @keyframes jjwxc-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        const wrapper = document.createElement('div');
        wrapper.className = 'jjwxc-loader-control';
        wrapper.dataset.state = 'loading';

        const ring = document.createElement('div');
        ring.className = 'jjwxc-loader-ring';
        wrapper.appendChild(ring);

        const button = document.createElement('button');
        button.className = 'jjwxc-loader-btn';
        button.type = 'button';
        button.title = 'Tạm dừng tải chương';
        button.addEventListener('click', () => {
            if (!loading) return;
            setPausedState(!paused);
            button.title = paused ? 'Tiếp tục tải chương' : 'Tạm dừng tải chương';
        });
        wrapper.appendChild(button);

        document.body.appendChild(wrapper);
        controlEl = wrapper;
        return controlEl;
    }

    function findToptenTable() {
        const tables = Array.from(document.querySelectorAll('table'));
        return tables.find((table) => {
            const headerRow = table.querySelector('tr');
            if (!headerRow) return false;
            const text = headerRow.textContent || '';
            return text.includes('作者') && text.includes('作品');
        });
    }

    function getInsertIndex(headerRow) {
        const cells = Array.from(headerRow.children);
        const idx = cells.findIndex((cell) => (cell.textContent || '').includes('字数'));
        return idx >= 0 ? idx + 1 : cells.length;
    }

    function insertHeaderCell(headerRow, insertIndex) {
        const cell = document.createElement('td');
        cell.setAttribute('height', '23');
        cell.setAttribute('bgcolor', '#9FD59E');
        cell.setAttribute('align', 'center');
        cell.textContent = '章节';
        const ref = headerRow.children[insertIndex] || null;
        headerRow.insertBefore(cell, ref);
    }

    function insertRowCell(row, insertIndex) {
        const cell = document.createElement('td');
        cell.setAttribute('height', '23');
        cell.setAttribute('align', 'right');
        cell.textContent = '...';
        const ref = row.children[insertIndex] || null;
        row.insertBefore(cell, ref);
        return cell;
    }

    function extractNovelId(row) {
        const link = row.querySelector('a[href*="onebook.php?novelid="]');
        if (!link) return null;
        const match = link.getAttribute('href')?.match(/novelid=(\d+)/);
        return match ? match[1] : null;
    }

    async function runQueue(tasks) {
        let index = 0;
        const workers = Array.from({ length: Math.min(MAX_CONCURRENT, tasks.length) }, async () => {
            while (true) {
                const current = index;
                index += 1;
                if (current >= tasks.length) return;
                await waitWhilePaused();
                await tasks[current]();
            }
        });
        await Promise.all(workers);
    }

    function collectRows(table, insertIndex) {
        const rows = Array.from(table.querySelectorAll('tr')).slice(1);
        const items = [];
        for (const row of rows) {
            const novelId = extractNovelId(row);
            if (!novelId) continue;
            const cell = insertRowCell(row, insertIndex);
            items.push({ novelId, cell });
        }
        return items;
    }

    async function main() {
        const table = findToptenTable();
        if (!table) return;

        const headerRow = table.querySelector('tr');
        if (!headerRow) return;

        const insertIndex = getInsertIndex(headerRow);
        insertHeaderCell(headerRow, insertIndex);

        ensureControl();
        const rows = collectRows(table, insertIndex);
        const tasks = rows.map(({ novelId, cell }) => async () => {
            const count = await fetchChapterCount(novelId);
            cell.textContent = count || '-';
            await sleep(REQUEST_DELAY_MS);
        });

        await runQueue(tasks);
        loading = false;
        updateControlState();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main, { once: true });
    } else {
        main();
    }
})();
