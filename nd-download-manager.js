// ==UserScript==
// @name        nd-download-manager
// @version     1.0.0
// @include     *
// ==/UserScript==
/* eslint-env browser */
/* global GM_getValue GM_setValue GM_addValueChangeListener */
(function (window, document) {
    'use strict';

    if (window.NDDownloadManager && window.NDDownloadManager.__installed) return;

    const UI_HOST_ID = 'novel-downloader-shadow-host';
    const STYLE_ID = 'ndDownloadManagerStyle';
    const OVERLAY_ID = 'nd-manager-overlay';
    const STATE_KEY = 'nd_manager_state';

    function getUiRoot(create = false) {
        if (typeof window.__novelDownloaderGetUIRoot === 'function') {
            const root = window.__novelDownloaderGetUIRoot(create);
            if (root) return root;
        }
        let host = document.getElementById(UI_HOST_ID);
        if (!host && create) {
            host = document.createElement('div');
            host.id = UI_HOST_ID;
            (document.body || document.documentElement).appendChild(host);
        }
        if (!host) return null;
        if (!host.shadowRoot && create && typeof host.attachShadow === 'function') {
            host.attachShadow({ mode: 'open' });
        }
        return host.shadowRoot || host;
    }

    function ensureStyle(root) {
        let style = root.querySelector(`#${STYLE_ID}`);
        if (!style) {
            style = document.createElement('style');
            style.id = STYLE_ID;
            root.appendChild(style);
        }
        style.textContent = `
            :host{all:initial;display:block;position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:Arial,sans-serif;}
            *,*:before,*:after{box-sizing:border-box;}
            #nd-manager-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9999998; display: flex; align-items: center; justify-content: center; font-family: sans-serif; pointer-events:auto; }
            #nd-manager-window { background: #f4f4f4; width: 80%; max-width: 900px; height: 80%; max-height: 700px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden; }
            #nd-manager-header { padding: 15px 20px; background: #333; color: white; display: flex; justify-content: space-between; align-items: center; }
            #nd-manager-header h2 { margin: 0; font-size: 18px; }
            #nd-manager-close { background: none; border: none; color: white; font-size: 24px; cursor: pointer; opacity: 0.8; }
            #nd-manager-tabs { display: flex; background: #e0e0e0; padding: 0 10px; }
            .nd-manager-tab { padding: 12px 18px; cursor: pointer; border-bottom: 3px solid transparent; }
            .nd-manager-tab.active { border-bottom-color: #3498db; background: #f4f4f4; font-weight: bold; }
            #nd-manager-content { flex-grow: 1; padding: 20px; overflow-y: auto; color: #333; }
            .nd-manager-page { display: none; }
            .nd-manager-page.active { display: block; }
        `;
    }

    const TaskManager = {
        STATE_KEY,
        _listeners: [],
        _initialized: false,

        async getState() {
            const state = await GM_getValue(this.STATE_KEY);
            if (!state) {
                return { queue: [], history: [] };
            }
            return state;
        },

        async setState(updater) {
            const currentState = await this.getState();
            const newState = updater(currentState);
            await GM_setValue(this.STATE_KEY, newState);
            return newState;
        },

        onStateChange(callback) {
            this._listeners.push(callback);
        },

        init() {
            if (this._initialized) return;
            this._initialized = true;
            GM_addValueChangeListener(this.STATE_KEY, (name, oldValue, newValue, remote) => {
                if (remote) {
                    console.log('TaskManager: State changed from another tab.');
                    this._listeners.forEach(callback => callback(newValue));
                }
            });
            console.log('TaskManager initialized and listening for changes.');
        }
    };

    async function showManagerUI() {
        const uiRoot = getUiRoot(true) || document.body;
        const existingUI = uiRoot.querySelector(`#${OVERLAY_ID}`);
        if (existingUI) {
            existingUI.style.display = existingUI.style.display === 'none' ? 'flex' : 'none';
            return;
        }

        ensureStyle(uiRoot);

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.innerHTML = `
            <div id="nd-manager-window">
                <div id="nd-manager-header">
                    <h2>Trình Quản lý Tải xuống</h2>
                    <button id="nd-manager-close">&times;</button>
                </div>
                <div id="nd-manager-tabs">
                    <div class="nd-manager-tab active" data-tab="queue">Hàng đợi</div>
                    <div class="nd-manager-tab" data-tab="history">Lịch sử</div>
                </div>
                <div id="nd-manager-content">
                    <div class="nd-manager-page active" id="nd-manager-page-queue">
                        <h3>Đang tải & Đang chờ</h3>
                        <div id="nd-queue-list">Chưa có gì trong hàng đợi.</div>
                    </div>
                    <div class="nd-manager-page" id="nd-manager-page-history">
                        <h3>Lịch sử Tương tác</h3>
                        <div id="nd-history-list">Chưa có lịch sử.</div>
                    </div>
                </div>
            </div>
        `;
        uiRoot.appendChild(overlay);

        const renderUI = (state) => {
            console.log('Rendering manager UI with new state:', state);

            const queueList = overlay.querySelector('#nd-queue-list');
            if (!state.queue || state.queue.length === 0) {
                queueList.innerHTML = 'Chưa có gì trong hàng đợi.';
            } else {
                queueList.innerHTML = state.queue.map(task => `
                    <div style="background: white; padding: 10px; border-radius: 5px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="font-weight: bold;">${task.bookTitle}</div>
                        <div style="font-size: 12px; color: #666;">Trang: ${task.domain}</div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                            <progress value="${task.progress.completed}" max="${task.progress.total}" style="width: 100%;"></progress>
                            <span>${task.progress.completed} / ${task.progress.total}</span>
                        </div>
                        <div style="font-size: 12px; color: #888;">Trạng thái: ${task.status}</div>
                    </div>
                `).join('');
            }

            const historyList = overlay.querySelector('#nd-history-list');
            if (!state.history || state.history.length === 0) {
                historyList.innerHTML = 'Chưa có lịch sử.';
            } else {
                historyList.innerHTML = state.history.map(task => `
                    <div style="background: white; padding: 10px; border-radius: 5px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="font-weight: bold;">${task.bookTitle}</div>
                        <div style="font-size: 12px; color: #666;">Trang: ${task.domain}</div>
                        <div style="font-size: 12px; color: #888;">Trạng thái: ${task.status} - ${new Date(task.finishedAt).toLocaleString()}</div>
                    </div>
                `).join('');
            }
        };

        overlay.querySelector('#nd-manager-close').addEventListener('click', () => {
            overlay.style.display = 'none';
        });

        overlay.querySelectorAll('.nd-manager-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                overlay.querySelector('.nd-manager-tab.active').classList.remove('active');
                overlay.querySelector('.nd-manager-page.active').classList.remove('active');
                tab.classList.add('active');
                overlay.querySelector(`#nd-manager-page-${tab.dataset.tab}`).classList.add('active');
            });
        });

        const initialState = await TaskManager.getState();
        renderUI(initialState);

        TaskManager.onStateChange(renderUI);
    }

    const api = {
        __installed: true,
        TaskManager,
        showManagerUI
    };

    window.NDDownloadManager = api;
    if (typeof unsafeWindow !== 'undefined') {
        unsafeWindow.NDDownloadManager = api;
    }
})(window, document);
