// ==UserScript==
// @name        nd-download-manager
// @version     1.0.7
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
    const RESUME_KEY_PREFIX = 'nd_manager_resume_';
    const RESUME_REQUEST_KEY = 'nd_manager_resume_request';
    const MAX_HISTORY = 50;
    const TASK_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
    const runtimeActions = new Map();

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
            .nd-manager-toolbar { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 12px; }
            .nd-manager-item { background: white; padding: 10px; border-radius: 5px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .nd-manager-title { font-weight: bold; word-break: break-word; }
            .nd-manager-meta { font-size: 12px; color: #666; margin-top: 3px; word-break: break-word; }
            .nd-manager-status { font-size: 12px; color: #888; margin-top: 5px; }
            .nd-manager-progress { display: flex; align-items: center; gap: 10px; margin-top: 5px; }
            .nd-manager-progress progress { width: 100%; }
            .nd-manager-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
            .nd-manager-actions button, .nd-manager-toolbar button { border: 1px solid #cbd5e1; background: #f8fafc; color: #111827; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px; }
            .nd-manager-actions button:hover, .nd-manager-toolbar button:hover { background: #e2e8f0; }
            .nd-manager-actions button[data-action="cancel-task"] { color: #b91c1c; border-color: #fecaca; background: #fff1f2; }
            .nd-manager-actions button[data-action="delete-task"] { color: #991b1b; border-color: #fecaca; background: #fff7ed; }
            .nd-manager-actions button[data-action="retry-task"] { color: #166534; border-color: #bbf7d0; background: #f0fdf4; }
            .nd-manager-actions button[data-action="resume-task"] { color: #1d4ed8; border-color: #bfdbfe; background: #eff6ff; }
            .nd-manager-errors { margin-top: 6px; color: #b91c1c; font-size: 12px; }
            .nd-manager-settings { display: grid; gap: 12px; max-width: 620px; }
            .nd-manager-setting-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; }
            .nd-manager-setting-main { display: grid; gap: 3px; }
            .nd-manager-setting-title { font-weight: 700; color: #111827; }
            .nd-manager-setting-desc { font-size: 12px; color: #64748b; line-height: 1.4; }
            .nd-manager-switch { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; font-size: 12px; color: #111827; }
            .nd-manager-switch input { width: 18px; height: 18px; }
            .nd-manager-doc-actions { display: flex; flex-wrap: wrap; gap: 8px; }
            .nd-manager-doc-actions button { border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; border-radius: 6px; padding: 7px 10px; cursor: pointer; font-size: 12px; font-weight: 600; }
            .nd-manager-doc-actions button:hover { background: #dbeafe; }
        `;
    }

    function getMainUiApi() {
        return window.NDNovelDownloaderUI
            || (typeof unsafeWindow !== 'undefined' && unsafeWindow.NDNovelDownloaderUI)
            || null;
    }

    function notifyMainUiStateChanged() {
        const api = getMainUiApi();
        if (api && typeof api.updateLauncherVisibility === 'function') {
            api.updateLauncherVisibility();
        }
    }

    function isManagerVisible() {
        const root = getUiRoot(false);
        const overlay = root && root.querySelector(`#${OVERLAY_ID}`);
        if (!overlay) return false;
        const style = window.getComputedStyle(overlay);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }

    function isLauncherEnabledFromMain() {
        const api = getMainUiApi();
        return !api || typeof api.isLauncherEnabled !== 'function' || api.isLauncherEnabled();
    }

    function syncSettingsUI(overlay) {
        const toggle = overlay && overlay.querySelector('#nd-manager-launcher-toggle');
        if (toggle) toggle.checked = isLauncherEnabledFromMain();
    }

    function normalizeState(state) {
        return {
            queue: Array.isArray(state && state.queue) ? state.queue : [],
            history: Array.isArray(state && state.history) ? state.history : []
        };
    }

    function getTaskTime(task = {}) {
        const value = task.finishedAt || task.updatedAt || task.startedAt || task.createdAt;
        const time = value ? new Date(value).getTime() : 0;
        return Number.isFinite(time) ? time : 0;
    }

    function pruneExpiredState(state) {
        const normalized = normalizeState(state);
        const cutoff = Date.now() - TASK_RETENTION_MS;
        const removed = [];
        const keepTask = (task) => {
            const time = getTaskTime(task);
            const keep = !time || time >= cutoff;
            if (!keep) removed.push(task);
            return keep;
        };
        const nextState = {
            queue: normalized.queue.filter(keepTask),
            history: normalized.history.filter(keepTask)
        };
        return {
            state: nextState,
            removed,
            changed: nextState.queue.length !== normalized.queue.length || nextState.history.length !== normalized.history.length
        };
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function createTaskId() {
        return `nd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function normalizeProgress(progress = {}) {
        return {
            completed: Number(progress.completed) || 0,
            total: Number(progress.total) || 0,
            failed: Number(progress.failed) || 0
        };
    }

    function normalizeError(error = {}) {
        return {
            time: error.time || nowIso(),
            title: error.title || '',
            url: error.url || '',
            type: error.type || 'unknown',
            status: error.status || '',
            message: error.message || ''
        };
    }

    function getResumeKey(id) {
        return `${RESUME_KEY_PREFIX}${id}`;
    }

    function normalizeUrlForResume(url) {
        try {
            const parsed = new URL(url, window.location.href);
            parsed.hash = '';
            return parsed.href;
        } catch (error) {
            return String(url || '').split('#')[0];
        }
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function formatDateTime(value) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString();
    }

    function formatStatus(status) {
        return {
            queued: 'Đang chờ',
            downloading: 'Đang tải',
            completed: 'Hoàn thành',
            completed_with_errors: 'Hoàn thành có lỗi',
            forced_saved: 'Đã buộc lưu',
            failed: 'Thất bại',
            cancelled: 'Đã hủy'
        }[status] || status || 'Không rõ';
    }

    function taskErrors(task) {
        return Array.isArray(task && task.errors) ? task.errors.map(normalizeError) : [];
    }

    function buildTaskSummary(task) {
        const progress = normalizeProgress(task && task.progress);
        const errors = taskErrors(task);
        return [
            `Sách: ${task.bookTitle || ''}`,
            `Trang: ${task.domain || ''}`,
            `URL: ${task.sourceUrl || ''}`,
            `Định dạng: ${task.format || ''}`,
            `Trạng thái: ${formatStatus(task.status)}`,
            `Tiến độ: ${progress.completed}/${progress.total}`,
            `Lỗi: ${errors.length}`,
            `Bắt đầu: ${formatDateTime(task.startedAt)}`,
            `Kết thúc: ${formatDateTime(task.finishedAt)}`
        ].filter(line => !line.endsWith(': ')).join('\n');
    }

    function buildTaskErrorText(task) {
        const errors = taskErrors(task);
        if (!errors.length) return 'Không có lỗi chương.';
        return errors.map((error, index) => [
            `#${index + 1}`,
            `Thời gian: ${formatDateTime(error.time)}`,
            `Loại: ${error.type}`,
            `Tiêu đề: ${error.title}`,
            `URL: ${error.url}`,
            `Status: ${error.status}`,
            `Lỗi: ${error.message}`
        ].filter(line => !line.endsWith(': ')).join('\n')).join('\n\n');
    }

    async function copyText(text) {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(text);
            return;
        }
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
    }

    function flashButton(button, text) {
        if (!button) return;
        const oldText = button.textContent;
        button.textContent = text;
        window.setTimeout(() => {
            button.textContent = oldText;
        }, 1000);
    }

    const TaskManager = {
        STATE_KEY,
        _listeners: [],
        _initialized: false,

        async hydrateResumeProgress(state) {
            let changed = false;
            const queue = Array.isArray(state && state.queue) ? state.queue : [];
            for (const task of queue) {
                if (!task || !task.id || !task.meta || !task.meta.resumeAvailable) continue;
                const resumeData = await GM_getValue(getResumeKey(task.id));
                if (!resumeData || !resumeData.progress) continue;
                const nextProgress = normalizeProgress(resumeData.progress);
                const currentProgress = normalizeProgress(task.progress);
                if (
                    nextProgress.completed !== currentProgress.completed ||
                    nextProgress.total !== currentProgress.total ||
                    nextProgress.failed !== currentProgress.failed
                ) {
                    task.progress = nextProgress;
                    if (resumeData.savedAt) task.updatedAt = resumeData.savedAt;
                    changed = true;
                }
            }
            return changed;
        },

        async getState() {
            const { state, removed, changed } = pruneExpiredState(await GM_getValue(this.STATE_KEY));
            const resumeChanged = await this.hydrateResumeProgress(state);
            if (changed || resumeChanged) {
                await GM_setValue(this.STATE_KEY, state);
                await Promise.all(removed.map(task => this.clearResumeData(task && task.id, { updateTask: false })).filter(Boolean));
            }
            return state;
        },

        async setState(updater) {
            const currentState = await this.getState();
            const { state: newState, removed } = pruneExpiredState(updater(currentState) || currentState);
            await GM_setValue(this.STATE_KEY, newState);
            await Promise.all(removed.map(task => this.clearResumeData(task && task.id, { updateTask: false })).filter(Boolean));
            this._emit(newState);
            return newState;
        },

        onStateChange(callback) {
            this._listeners.push(callback);
            return () => {
                const index = this._listeners.indexOf(callback);
                if (index >= 0) this._listeners.splice(index, 1);
            };
        },

        _emit(state) {
            this._listeners.forEach(callback => callback(normalizeState(state)));
        },

        async emitCurrentState() {
            this._emit(await this.getState());
        },

        init() {
            if (this._initialized) return;
            this._initialized = true;
            GM_addValueChangeListener(this.STATE_KEY, (name, oldValue, newValue, remote) => {
                if (remote) {
                    console.log('TaskManager: State changed from another tab.');
                    this._emit(newValue);
                }
            });
            console.log('TaskManager initialized and listening for changes.');
        },

        async createTask(task = {}) {
            const now = nowIso();
            const id = task.id || createTaskId();
            const newTask = {
                id,
                bookTitle: task.bookTitle || 'Chưa có tên sách',
                domain: task.domain || window.location.hostname || '',
                sourceUrl: task.sourceUrl || window.location.href || '',
                format: task.format || '',
                status: task.status || 'queued',
                createdAt: task.createdAt || now,
                startedAt: task.startedAt || now,
                updatedAt: now,
                finishedAt: task.finishedAt || null,
                progress: normalizeProgress(task.progress),
                errors: Array.isArray(task.errors) ? task.errors.map(normalizeError) : [],
                meta: Object.assign({}, task.meta || {})
            };
            await this.setState((state) => {
                state.queue = state.queue.filter(item => item.id !== id);
                state.queue.unshift(newTask);
                return state;
            });
            return newTask;
        },

        async updateTask(id, patch = {}) {
            if (!id) return null;
            let updatedTask = null;
            await this.setState((state) => {
                const task = state.queue.find(item => item.id === id);
                if (!task) return state;
                if (patch.progress) {
                    task.progress = normalizeProgress(Object.assign({}, task.progress, patch.progress));
                }
                for (const [key, value] of Object.entries(patch)) {
                    if (key === 'progress' || key === 'errors') continue;
                    if (key === 'meta') {
                        task.meta = Object.assign({}, task.meta || {}, value || {});
                    } else {
                        task[key] = value;
                    }
                }
                task.updatedAt = nowIso();
                updatedTask = task;
                return state;
            });
            return updatedTask;
        },

        async recordError(id, error = {}) {
            if (!id) return null;
            let updatedTask = null;
            await this.setState((state) => {
                const task = state.queue.find(item => item.id === id);
                if (!task) return state;
                task.errors = Array.isArray(task.errors) ? task.errors : [];
                task.errors.push(normalizeError(error));
                task.progress = normalizeProgress(Object.assign({}, task.progress, {
                    failed: task.errors.length
                }));
                task.updatedAt = nowIso();
                updatedTask = task;
                return state;
            });
            return updatedTask;
        },

        async finishTask(id, status = 'completed', patch = {}) {
            if (!id) return null;
            let finishedTask = null;
            await this.setState((state) => {
                const index = state.queue.findIndex(item => item.id === id);
                if (index === -1) return state;
                const task = state.queue.splice(index, 1)[0];
                if (patch.progress) {
                    task.progress = normalizeProgress(Object.assign({}, task.progress, patch.progress));
                }
                for (const [key, value] of Object.entries(patch)) {
                    if (key === 'progress') continue;
                    task[key] = value;
                }
                task.status = status;
                task.finishedAt = nowIso();
                task.updatedAt = task.finishedAt;
                state.history.unshift(task);
                state.history = state.history.slice(0, MAX_HISTORY);
                finishedTask = task;
                return state;
            });
            await this.clearResumeData(id, { updateTask: false });
            return finishedTask;
        },

        async archiveTask(id, status = 'forced_saved', patch = {}) {
            if (!id) return null;
            let archivedTask = null;
            await this.setState((state) => {
                const task = state.queue.find(item => item.id === id);
                if (!task) return state;
                const now = nowIso();
                const copy = Object.assign({}, task, {
                    id: `${id}-archive-${Date.now()}`,
                    sourceTaskId: id,
                    status,
                    finishedAt: now,
                    updatedAt: now,
                    progress: normalizeProgress(task.progress),
                    errors: Array.isArray(task.errors) ? task.errors.map(normalizeError) : [],
                    meta: Object.assign({}, task.meta || {}, {
                        archivedFromQueue: true,
                        archivedStatus: status
                    })
                });
                if (patch.progress) {
                    copy.progress = normalizeProgress(Object.assign({}, task.progress, patch.progress));
                }
                for (const [key, value] of Object.entries(patch)) {
                    if (key === 'progress') continue;
                    if (key === 'meta') {
                        copy.meta = Object.assign({}, copy.meta || {}, value || {});
                    } else {
                        copy[key] = value;
                    }
                }
                state.history.unshift(copy);
                state.history = state.history.slice(0, MAX_HISTORY);
                archivedTask = copy;
                return state;
            });
            return archivedTask;
        },

        async removeTask(id) {
            if (!id) return null;
            let removedTask = null;
            await this.setState((state) => {
                const index = state.queue.findIndex(item => item.id === id);
                if (index === -1) return state;
                removedTask = state.queue.splice(index, 1)[0];
                return state;
            });
            if (removedTask) {
                runtimeActions.delete(id);
                await this.clearResumeData(id, { updateTask: false });
            }
            return removedTask;
        },

        async clearHistory() {
            const currentState = await this.getState();
            await Promise.all((currentState.history || []).map(task => this.clearResumeData(task && task.id, { updateTask: false })).filter(Boolean));
            await this.setState((state) => {
                state.history = [];
                return state;
            });
        },

        async saveResumeData(id, data = {}) {
            if (!id) return null;
            const key = getResumeKey(id);
            const payload = Object.assign({}, data, {
                taskId: id,
                savedAt: nowIso()
            });
            await GM_setValue(key, payload);
            const patch = {
                meta: {
                    resumeAvailable: true,
                    resumeKey: key,
                    resumeUpdatedAt: payload.savedAt,
                    resumeSourceUrl: payload.sourceUrl || '',
                    resumeFormat: payload.format || ''
                }
            };
            if (payload.progress) patch.progress = payload.progress;
            await this.updateTask(id, patch);
            return payload;
        },

        async getResumeData(id) {
            if (!id) return null;
            const data = await GM_getValue(getResumeKey(id));
            return data && typeof data === 'object' ? data : null;
        },

        async clearResumeData(id, options = {}) {
            if (!id) return null;
            await GM_setValue(getResumeKey(id), null);
            if (options.updateTask !== false) {
                await this.updateTask(id, {
                    meta: {
                        resumeAvailable: false,
                        resumeClearedAt: nowIso()
                    }
                });
            }
            return true;
        },

        async requestResume(id) {
            if (!id) return null;
            const state = await this.getState();
            const task = state.queue.find(item => item.id === id);
            const resumeData = await this.getResumeData(id);
            if (!task || !resumeData) return null;
            const request = {
                taskId: id,
                sourceUrl: task.sourceUrl || resumeData.sourceUrl || window.location.href,
                requestedAt: nowIso()
            };
            await GM_setValue(RESUME_REQUEST_KEY, request);
            return Object.assign({}, task, { resumeData });
        },

        async peekResumeRequestForUrl(url) {
            const request = await GM_getValue(RESUME_REQUEST_KEY);
            if (!request || !request.taskId) return null;
            const requestedAt = new Date(request.requestedAt || 0).getTime();
            if (requestedAt && Date.now() - requestedAt > 10 * 60 * 1000) {
                await GM_setValue(RESUME_REQUEST_KEY, null);
                return null;
            }
            if (normalizeUrlForResume(request.sourceUrl) !== normalizeUrlForResume(url)) return null;
            const state = await this.getState();
            const task = state.queue.find(item => item.id === request.taskId);
            const data = await this.getResumeData(request.taskId);
            if (!task || !data) return null;
            return { request, task, data };
        },

        async consumeResumeRequest(id) {
            const request = await GM_getValue(RESUME_REQUEST_KEY);
            if (!request || (id && request.taskId !== id)) return false;
            await GM_setValue(RESUME_REQUEST_KEY, null);
            return true;
        },

        registerRuntimeActions(id, actions = {}) {
            if (!id) return () => {};
            runtimeActions.set(id, actions);
            this.emitCurrentState();
            return () => {
                if (runtimeActions.get(id) === actions) {
                    runtimeActions.delete(id);
                    this.emitCurrentState();
                }
            };
        },

        hasRuntimeAction(id, action) {
            const actions = runtimeActions.get(id);
            return Boolean(actions && typeof actions[action] === 'function');
        },

        async runRuntimeAction(id, action, task) {
            const actions = runtimeActions.get(id);
            const handler = actions && actions[action];
            if (typeof handler !== 'function') return false;
            await handler(task);
            await this.emitCurrentState();
            return true;
        }
    };

    async function showManagerUI() {
        const uiRoot = getUiRoot(true) || document.body;
        const existingUI = uiRoot.querySelector(`#${OVERLAY_ID}`);
        if (existingUI) {
            existingUI.style.display = existingUI.style.display === 'none' ? 'flex' : 'none';
            syncSettingsUI(existingUI);
            notifyMainUiStateChanged();
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
                    <div class="nd-manager-tab" data-tab="settings">Cài đặt</div>
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
                    <div class="nd-manager-page" id="nd-manager-page-settings">
                        <h3>Cài đặt</h3>
                        <div class="nd-manager-settings">
                            <div class="nd-manager-setting-row">
                                <div class="nd-manager-setting-main">
                                    <div class="nd-manager-setting-title">Nút nổi Novel Downloader</div>
                                    <div class="nd-manager-setting-desc">Hiện nút kéo thả trên web để mở nhanh UI tải hoặc Quản lý tải xuống.</div>
                                </div>
                                <label class="nd-manager-switch">
                                    <input type="checkbox" id="nd-manager-launcher-toggle">
                                    Hiện
                                </label>
                            </div>
                            <div class="nd-manager-setting-row">
                                <div class="nd-manager-setting-main">
                                    <div class="nd-manager-setting-title">Tài liệu trong script</div>
                                    <div class="nd-manager-setting-desc">Mở hướng dẫn sử dụng hoặc changelog của phiên bản hiện tại.</div>
                                </div>
                                <div class="nd-manager-doc-actions">
                                    <button type="button" data-action="open-guide">Mở Hướng dẫn</button>
                                    <button type="button" data-action="open-changelog">Mở Changelog</button>
                                </div>
                            </div>
                            <div class="nd-manager-setting-row">
                                <div class="nd-manager-setting-main">
                                    <div class="nd-manager-setting-title">Debug Bridge</div>
                                    <div class="nd-manager-setting-desc">Kết nối dashboard local để chạy selector, rule và code debug trong môi trường userscript thật.</div>
                                </div>
                                <div class="nd-manager-doc-actions">
                                    <button type="button" data-action="open-debug-bridge">Mở Debug Bridge</button>
                                </div>
                            </div>
                            <div class="nd-manager-setting-row">
                                <div class="nd-manager-setting-main">
                                    <div class="nd-manager-setting-title">Rule Editor</div>
                                    <div class="nd-manager-setting-desc">Quản lý rule tùy chỉnh theo từng mục riêng, có tìm kiếm, template, kiểm tra cấu trúc và autosave draft.</div>
                                </div>
                                <div class="nd-manager-doc-actions">
                                    <button type="button" data-action="open-rule-editor">Mở Rule Editor</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        uiRoot.appendChild(overlay);

        const findTask = async (id) => {
            const state = await TaskManager.getState();
            return state.queue.concat(state.history).find(task => task.id === id) || null;
        };

        const renderActions = (task, location) => {
            const errors = taskErrors(task);
            const buttons = [
                `<button type="button" data-action="copy-summary" data-task-id="${escapeHtml(task.id)}">Copy summary</button>`
            ];
            if (errors.length) {
                buttons.push(`<button type="button" data-action="copy-errors" data-task-id="${escapeHtml(task.id)}">Copy lỗi (${errors.length})</button>`);
            }
            if (location === 'queue' && TaskManager.hasRuntimeAction(task.id, 'cancel')) {
                buttons.push(`<button type="button" data-action="cancel-task" data-task-id="${escapeHtml(task.id)}">Hủy</button>`);
            } else if (location === 'queue') {
                buttons.push(`<button type="button" data-action="delete-task" data-task-id="${escapeHtml(task.id)}">Xóa</button>`);
            }
            if (TaskManager.hasRuntimeAction(task.id, 'retry')) {
                buttons.push(`<button type="button" data-action="retry-task" data-task-id="${escapeHtml(task.id)}">Retry</button>`);
            }
            if (location === 'queue' && !TaskManager.hasRuntimeAction(task.id, 'cancel') && task.meta && task.meta.resumeAvailable) {
                buttons.push(`<button type="button" data-action="resume-task" data-task-id="${escapeHtml(task.id)}">Tiếp tục</button>`);
            }
            return `<div class="nd-manager-actions">${buttons.join('')}</div>`;
        };

        const renderTask = (task, location) => {
            const progress = normalizeProgress(task.progress);
            const errors = taskErrors(task);
            const progressText = `${progress.completed} / ${progress.total}${progress.failed ? `, lỗi ${progress.failed}` : ''}`;
            const timeText = location === 'history'
                ? `Kết thúc: ${formatDateTime(task.finishedAt)}`
                : `Cập nhật: ${formatDateTime(task.updatedAt)}`;
            return `
                <div class="nd-manager-item" data-task-id="${escapeHtml(task.id)}">
                    <div class="nd-manager-title">${escapeHtml(task.bookTitle)}</div>
                    <div class="nd-manager-meta">Trang: ${escapeHtml(task.domain)}${task.format ? ` - ${escapeHtml(task.format)}` : ''}</div>
                    <div class="nd-manager-progress">
                        <progress value="${progress.completed}" max="${progress.total || 1}"></progress>
                        <span>${escapeHtml(progressText)}</span>
                    </div>
                    <div class="nd-manager-status">Trạng thái: ${escapeHtml(formatStatus(task.status))}${timeText ? ` - ${escapeHtml(timeText)}` : ''}</div>
                    ${errors.length ? `<div class="nd-manager-errors">Lỗi gần nhất: ${escapeHtml(errors[errors.length - 1].message || errors[errors.length - 1].url)}</div>` : ''}
                    ${renderActions(task, location)}
                </div>
            `;
        };

        const renderUI = (state) => {
            const queueList = overlay.querySelector('#nd-queue-list');
            if (!state.queue || state.queue.length === 0) {
                queueList.innerHTML = 'Chưa có gì trong hàng đợi.';
            } else {
                queueList.innerHTML = state.queue.map(task => renderTask(task, 'queue')).join('');
            }

            const historyList = overlay.querySelector('#nd-history-list');
            if (!state.history || state.history.length === 0) {
                historyList.innerHTML = 'Chưa có lịch sử.';
            } else {
                historyList.innerHTML = `
                    <div class="nd-manager-toolbar"><button type="button" data-action="clear-history">Xóa lịch sử</button></div>
                    ${state.history.map(task => renderTask(task, 'history')).join('')}
                `;
            }
            syncSettingsUI(overlay);
        };

        overlay.addEventListener('click', async (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;
            const action = button.dataset.action;
            const taskId = button.dataset.taskId;
            const task = taskId ? await findTask(taskId) : null;
            try {
                if (action === 'clear-history') {
                    await TaskManager.clearHistory();
                    return;
                }
                if (action === 'open-guide' || action === 'open-changelog' || action === 'open-debug-bridge' || action === 'open-rule-editor') {
                    const api = getMainUiApi();
                    const method = {
                        'open-guide': 'openGuide',
                        'open-changelog': 'openChangelog',
                        'open-debug-bridge': 'openDebugBridge',
                        'open-rule-editor': 'openRuleEditor'
                    }[action];
                    if (api && typeof api[method] === 'function') {
                        api[method]();
                    } else {
                        flashButton(button, 'Chưa sẵn sàng');
                    }
                    return;
                }
                if (!task) return;
                if (action === 'copy-summary') {
                    await copyText(buildTaskSummary(task));
                    flashButton(button, 'Đã copy');
                } else if (action === 'copy-errors') {
                    await copyText(buildTaskErrorText(task));
                    flashButton(button, 'Đã copy');
                } else if (action === 'cancel-task') {
                    const handled = await TaskManager.runRuntimeAction(task.id, 'cancel', task);
                    if (!handled) await TaskManager.finishTask(task.id, 'cancelled');
                } else if (action === 'delete-task') {
                    if (!window.confirm('Xóa task này khỏi Đang tải & Đang chờ?')) return;
                    await TaskManager.removeTask(task.id);
                } else if (action === 'retry-task') {
                    const handled = await TaskManager.runRuntimeAction(task.id, 'retry', task);
                    if (!handled) flashButton(button, 'Không khả dụng');
                } else if (action === 'resume-task') {
                    const resumeTask = await TaskManager.requestResume(task.id);
                    if (!resumeTask) {
                        flashButton(button, 'Không có data');
                        return;
                    }
                    window.open(resumeTask.sourceUrl || task.sourceUrl, '_blank', 'noopener');
                    flashButton(button, 'Đã mở tab');
                }
            } catch (error) {
                console.error('[ND] Lỗi thao tác download manager:', error);
                flashButton(button, 'Lỗi');
            }
        });

        overlay.querySelector('#nd-manager-close').addEventListener('click', () => {
            overlay.style.display = 'none';
            notifyMainUiStateChanged();
        });

        overlay.querySelectorAll('.nd-manager-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                overlay.querySelector('.nd-manager-tab.active').classList.remove('active');
                overlay.querySelector('.nd-manager-page.active').classList.remove('active');
                tab.classList.add('active');
                overlay.querySelector(`#nd-manager-page-${tab.dataset.tab}`).classList.add('active');
                if (tab.dataset.tab === 'settings') syncSettingsUI(overlay);
            });
        });

        overlay.querySelector('#nd-manager-launcher-toggle').addEventListener('change', (event) => {
            const api = getMainUiApi();
            if (api && typeof api.setLauncherEnabled === 'function') {
                api.setLauncherEnabled(event.target.checked);
            }
            syncSettingsUI(overlay);
        });

        const initialState = await TaskManager.getState();
        renderUI(initialState);
        notifyMainUiStateChanged();

        TaskManager.onStateChange(renderUI);
    }

    const api = {
        __installed: true,
        TaskManager,
        showManagerUI,
        isManagerVisible
    };

    window.NDDownloadManager = api;
    if (typeof unsafeWindow !== 'undefined') {
        unsafeWindow.NDDownloadManager = api;
    }
})(window, document);
