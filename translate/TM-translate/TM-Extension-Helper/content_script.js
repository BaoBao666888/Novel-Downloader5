const SCRIPT_ID = chrome.runtime.id;

console.log("[TM-Extension-Helper] Content Script Loaded. ID:", SCRIPT_ID);

const target = document.head || document.documentElement;

if (target) {
    const meta = document.createElement('meta');
    meta.name = "tm-extension-id";
    meta.content = SCRIPT_ID;
    target.appendChild(meta);
} else {
    document.addEventListener("DOMContentLoaded", () => {
        const t = document.head || document.documentElement;
        if (!t) return;
        const meta = document.createElement('meta');
        meta.name = "tm-extension-id";
        meta.content = SCRIPT_ID;
        t.appendChild(meta);
    });
}

window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    const msg = event.data;
    if (!msg || !msg.type) return;

    if (msg.type === 'TM_EXT_UPDATE_BLACKLIST') {
        console.log("[TM Helper Content] Syncing Blacklist...", msg.domains);
        // Chuyển tiếp tới Background
        chrome.runtime.sendMessage({
            cmd: 'CMD_UPDATE_BLACKLIST',
            domains: msg.domains
        }, (res) => {
            console.log("[TM Helper Content] Blacklist synced:", res);
        });
    }
    if (msg.type === 'TM_EXT_OCR_REQUEST') {
        console.log("[TM Helper Content] Received OCR Request from Page. ID:", msg.reqId);
        console.log("[TM Helper Content] Forwarding to Background...");

        chrome.runtime.sendMessage({
            cmd: 'CMD_OCR_RECOGNIZE',
            payload: msg.payload
        }, (res) => {
            console.log("[TM Helper Content] Got Response from Background:", res);
            // Trả kết quả về Userscript qua event
            window.postMessage({
                type: 'TM_EXT_OCR_RESPONSE',
                reqId: msg.reqId,
                data: res
            }, '*');
        });
    }

});
