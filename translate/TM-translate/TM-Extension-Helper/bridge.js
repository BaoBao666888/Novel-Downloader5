const setupBridge = () => {
    const meta = document.querySelector('meta[name="tm-extension-id"]');
    if (meta) {
        window.__TM_EXTENSION_ID = meta.content;
        console.log("[TM Helper Bridge] Global ID set:", window.__TM_EXTENSION_ID);
    } else {
        setTimeout(setupBridge, 100);
    }
};

setupBridge();
