// ==UserScript==
// @name        nd-file-save
// @version     1.0.0
// @include     *
// ==/UserScript==
/* eslint-env browser */
(function (window, document) {
    'use strict';

    if (window.NDFileSave && window.NDFileSave.__installed) return;

    const DB_NAME = 'novel-downloader';
    const DB_VERSION = 1;
    const STORE_NAME = 'handles';

    function getDirHandleStorageKey(href = window.location && window.location.href) {
        return encodeURIComponent(String(href || '').split('#')[0]);
    }

    function getHandleKey(keySuffix) {
        return keySuffix ? `dirHandle_${keySuffix}` : '';
    }

    function openDb() {
        if (!window.indexedDB) return Promise.reject(new Error('IndexedDB không khả dụng.'));
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
            };
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function idbPut(key, value) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(value, key);
            tx.oncomplete = () => resolve();
            tx.onerror = (event) => reject(event.target.error);
        });
    }

    async function idbGet(key) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const request = tx.objectStore(STORE_NAME).get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function idbDelete(key) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(key);
            tx.oncomplete = () => resolve();
            tx.onerror = (event) => reject(event.target.error);
        });
    }

    async function saveDirHandle(handle, keySuffix) {
        const key = getHandleKey(keySuffix);
        if (!handle || !key) return false;
        await idbPut(key, handle);
        return true;
    }

    async function getSavedDirHandle(keySuffix) {
        const key = getHandleKey(keySuffix);
        if (!key) return null;
        return await idbGet(key);
    }

    async function clearSavedDirHandle(keySuffix) {
        const key = getHandleKey(keySuffix);
        if (!key) return;
        await idbDelete(key);
    }

    async function requestWritePermission(handle) {
        if (!handle || typeof handle.queryPermission !== 'function') return 'unknown';
        const current = await handle.queryPermission({ mode: 'readwrite' });
        if (current === 'granted') return current;
        if (typeof handle.requestPermission !== 'function') return current;
        return await handle.requestPermission({ mode: 'readwrite' });
    }

    async function restoreDirHandle({ keySuffix, remember }) {
        if (!remember || !window.indexedDB || window.FileSystemFileHandle === undefined) return null;
        const saved = await getSavedDirHandle(keySuffix);
        if (!saved) return null;
        try {
            const permission = await requestWritePermission(saved);
            if (permission === 'granted' || permission === 'unknown') return saved;
            return null;
        } catch (error) {
            return saved;
        }
    }

    async function chooseDirectory({ keySuffix, remember }) {
        if (typeof window.showDirectoryPicker !== 'function') {
            return {
                ok: false,
                reason: 'unsupported',
                message: 'Trình duyệt hiện không hỗ trợ chọn thư mục trực tiếp (File System Access API). Sẽ dùng download mặc định.',
                toastType: 'warning',
                toastDuration: 5000
            };
        }

        const handle = await window.showDirectoryPicker();
        let toastType = 'success';
        let toastDuration = 3500;
        let message = 'Đã chọn thư mục.';

        try {
            const permission = await requestWritePermission(handle);
            if (permission === 'granted') {
                message = 'Đã chọn thư mục và cấp quyền ghi.';
            } else if (permission !== 'unknown') {
                message = 'Đã chọn thư mục nhưng chưa cấp quyền ghi. File sẽ dùng Save As.';
                toastType = 'warning';
                toastDuration = 5000;
            }
        } catch (error) {
            console.warn('requestPermission lỗi (có thể không cần thiết):', error);
            message = 'Đã chọn thư mục (không thể kiểm tra quyền).';
            toastType = 'info';
        }

        if (remember) {
            if (keySuffix) {
                try {
                    await saveDirHandle(handle, keySuffix);
                    message += ' Đã lưu cho link này.';
                } catch (error) {
                    console.warn('saveDirHandle lỗi:', error);
                    message += ' Không thể lưu ghi nhớ.';
                    if (toastType === 'success') toastType = 'warning';
                }
            } else {
                message += ' Không thể lưu vì thiếu khóa lưu trữ.';
                if (toastType === 'success') toastType = 'warning';
            }
        }

        return { ok: true, handle, message, toastType, toastDuration };
    }

    async function findAvailableFileName(dirHandle, originalName) {
        const dotIndex = originalName.lastIndexOf('.');
        const baseName = dotIndex > -1 ? originalName.substring(0, dotIndex) : originalName;
        const extension = dotIndex > -1 ? originalName.substring(dotIndex) : '';
        let counter = 1;

        while (true) {
            const newName = `${baseName} (${counter})${extension}`;
            try {
                await dirHandle.getFileHandle(newName);
                counter++;
            } catch (error) {
                if (error.name === 'NotFoundError') return newName;
                throw error;
            }
        }
    }

    async function writeToDirectory({ dirHandle, content, name, confirmOverwrite }) {
        if (!dirHandle) return { ok: false, reason: 'no-handle' };

        let finalName = name;
        let action = 'save';

        try {
            await dirHandle.getFileHandle(name);
            const choice = typeof confirmOverwrite === 'function'
                ? await confirmOverwrite(name)
                : 'hủy';
            if (choice === 'ghi đè') {
                action = 'overwrite';
            } else if (choice === 'đổi tên') {
                action = 'rename';
            } else {
                return { ok: true, action: 'cancel', finalName };
            }
        } catch (error) {
            if (error.name !== 'NotFoundError') throw error;
        }

        if (action === 'rename') {
            finalName = await findAvailableFileName(dirHandle, name);
        }

        const permission = await requestWritePermission(dirHandle);
        if (permission !== 'granted' && permission !== 'unknown') {
            throw new Error('Không được cấp quyền ghi vào thư mục.');
        }

        const fileHandle = await dirHandle.getFileHandle(finalName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        return { ok: true, action, finalName };
    }

    async function saveContent({ content, name, dirHandle, confirmOverwrite, toast, saveAsFallback }) {
        const showToast = typeof toast === 'function' ? toast : function () {};
        if (dirHandle) {
            try {
                const result = await writeToDirectory({ dirHandle, content, name, confirmOverwrite });
                if (result.action === 'cancel') {
                    showToast(`Đã hủy lưu tệp: ${name}`, 'info', 3000);
                    return result;
                }
                if (result.action === 'overwrite') {
                    showToast(`Đã ghi đè tệp: ${result.finalName}`, 'success', 4500);
                } else if (result.action === 'rename') {
                    showToast(`Đã lưu tệp với tên mới: ${result.finalName}`, 'success', 4500);
                } else {
                    showToast('Đã lưu vào thư mục đã chọn: ' + (dirHandle.name ? `${dirHandle.name}/` : '') + result.finalName, 'success', 4500);
                }
                return result;
            } catch (error) {
                console.warn('Lỗi khi ghi bằng File System API, chuyển sang saveAs', error);
                showToast(`Lỗi: ${error.message}. Chuyển sang chế độ tải xuống mặc định.`, 'error', 5000);
            }
        }

        showToast('Mở hộp lưu của trình duyệt (Save As)...', 'info', 2500);
        saveAsFallback(content, name);
        return { ok: true, action: 'fallback', finalName: name };
    }

    const api = {
        __installed: true,
        getDirHandleStorageKey,
        saveDirHandle,
        getSavedDirHandle,
        clearSavedDirHandle,
        restoreDirHandle,
        chooseDirectory,
        saveContent
    };

    window.NDFileSave = api;
    if (typeof unsafeWindow !== 'undefined') {
        unsafeWindow.NDFileSave = api;
    }
})(window, document);
