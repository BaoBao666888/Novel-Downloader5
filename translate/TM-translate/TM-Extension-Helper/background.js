
let offscreenReadyResolve = null;
let offscreenReadyPromise = new Promise(resolve => offscreenReadyResolve = resolve);

async function ensureOffscreenDocument() {
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (existingContexts.length > 0) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ target: 'offscreen', cmd: 'PING' }, (response) => {
                if (chrome.runtime.lastError || response !== 'PONG') {
                    console.log("Offscreen exists but unresponsive. Re-creating...");
                    chrome.offscreen.closeDocument().then(() => {
                        createOffscreen().then(resolve);
                    });
                } else {
                    console.log("Offscreen is alive and responsive.");
                    if (offscreenReadyResolve) offscreenReadyResolve();
                    resolve();
                }
            });
        });
    }

    return createOffscreen();
}

async function createOffscreen() {
    offscreenReadyPromise = new Promise(resolve => offscreenReadyResolve = resolve);

    console.log("Creating Offscreen Document...");
    await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['DOM_PARSER'],
        justification: 'OCR Processing in background'
    });
    console.log("Offscreen Document Created. Waiting for JS Ready...");
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.cmd === 'OFFSCREEN_READY') {
        console.log(">>> Offscreen Ready Signal Received!");
        if (offscreenReadyResolve) offscreenReadyResolve();
        return;
    }

    if (message.cmd === 'LOG') {
        console.log("[OFFSCREEN LOG]:", message.msg);
        return;
    }
    if (message.cmd === 'CMD_OCR_RECOGNIZE') {
        console.log("OCR Request Recieved -> Processing...");

        handleOcrRequest(message.payload, sendResponse);
        return true; // Keep channel open for async response
    }

    if (message.cmd === 'CMD_GET_MODELS') {
        chrome.storage.local.get(['ocr_models_v4'], (result) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ success: true, models: result['ocr_models_v4'] });
            }
        });
        return true; // Async response
    }
    if (message.cmd === 'CMD_SAVE_MODELS') {
        const data = message.models;
        chrome.storage.local.set({ 'ocr_models_v4': data }, () => {
            console.log("Models saved to storage by request.");
            sendResponse({ success: true });
        });
        return true;
    }
    if (message.cmd === 'CMD_UPDATE_BLACKLIST') {
        handleUpdateBlacklist(message.domains);
        sendResponse({ status: 'ok' });
    }
    if (message.cmd === 'CMD_GET_VERSION') {
        const manifest = chrome.runtime.getManifest();
        sendResponse({ version: manifest.version });
    }
});

// Handle External Messages (from UserScript direct calls)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    if (message.cmd === 'CMD_GET_VERSION') {
        const manifest = chrome.runtime.getManifest();
        sendResponse({ version: manifest.version });
    }
    // Also handle Save Models directly if needed
    if (message.cmd === 'CMD_SAVE_MODELS') {
        const data = message.models;
        chrome.storage.local.set({ 'ocr_models_v4': data }, () => {
            console.log("Models saved to storage by External Request.");
            sendResponse({ success: true });
        });
        return true;
    }

    // Handle OCR Request Externally
    if (message.cmd === 'CMD_OCR_RECOGNIZE') {
        console.log("[Background] External OCR Request received.");
        handleOcrRequest(message.image, sendResponse);
        return true;
    }
});

function normalizeOcrImageInput(payload) {
    const image = typeof payload === 'string' ? payload : payload && payload.imageBase64;
    if (typeof image !== 'string' || !image.trim()) throw new Error('OCR: Missing or invalid image data.');
    return image;
}

async function handleOcrRequest(payload, sendResponse) {
    try {
        const imageBase64 = normalizeOcrImageInput(payload);
        await ensureOffscreenDocument();

        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Offscreen Wait Timeout")), 10000));

        await Promise.race([offscreenReadyPromise, timeout]);

        console.log("Sending OCR Task for execution...");

        chrome.runtime.sendMessage({
            target: 'offscreen',
            cmd: 'OCR_PROCESS',
            data: { imageBase64: imageBase64 }
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("OCR Error (Runtime):", chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                console.log("OCR Result Received.");
                sendResponse(response);
            }
        });

    } catch (e) {
        console.error("OCR Handler Fatal Error:", e);
        sendResponse({ success: false, error: e.toString() });
    }
}

function handleUpdateBlacklist(domains) {
    console.log("Updating Blacklist Rules for:", domains);
}
