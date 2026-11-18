
// --- INIT CHECK ---
chrome.runtime.sendMessage({ target: 'background', cmd: 'LOG', msg: "OFFSCREEN JS STARTING..." });

try {
    chrome.runtime.sendMessage({ target: 'background', cmd: 'OFFSCREEN_READY' });
} catch (e) {
    console.error("Send Ready Failed", e);
}

// --- DEBUG & ERROR HANDLING ---
window.addEventListener('error', (event) => {
    chrome.runtime.sendMessage({ target: 'background', cmd: 'LOG', msg: `[OFFSCREEN ERROR] ${event.message}` });
});
window.addEventListener('unhandledrejection', (event) => {
    chrome.runtime.sendMessage({ target: 'background', cmd: 'LOG', msg: `[OFFSCREEN REJECTION] ${event.reason}` });
});

// --- ORT CONFIG ---
// Load correct WASM paths for Extension environment
ort.env.wasm.numThreads = 1; // Single thread (MV3 disallows blob: workers)
ort.env.wasm.simd = true;
ort.env.wasm.proxy = false;

ort.env.wasm.wasmPaths = {
    'ort-wasm.wasm': chrome.runtime.getURL('assets/ort-wasm.wasm'),
    'ort-wasm-threaded.wasm': chrome.runtime.getURL('assets/ort-wasm-threaded.wasm'),
    'ort-wasm-simd.wasm': chrome.runtime.getURL('assets/ort-wasm-simd.wasm'),
    'ort-wasm-simd-threaded.wasm': chrome.runtime.getURL('assets/ort-wasm-simd-threaded.wasm')
};

// --- OCR SERVICE USE eSearchOCR LIB ---

async function decodeOcrImage(source) {
    if (typeof source !== 'string' || !source.trim()) throw new Error('OCR: Missing or invalid image data.');
    const image = new Image();
    await new Promise((resolve, reject) => {
        const finish = (error) => {
            clearTimeout(timer);
            image.onload = image.onerror = null;
            if (error) reject(error);
            else resolve();
        };
        const timer = setTimeout(() => finish(new Error('OCR: Image loading timed out.')), 15000);
        image.onload = () => finish();
        image.onerror = () => finish(new Error('OCR: Cannot decode the image.'));
        image.src = source;
    });
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
        throw new Error('OCR: Image dimensions are invalid.');
    }
    if (width > 16384 || height > 16384 || width * height > 32000000) {
        throw new Error('OCR: Image is too large. Select a smaller area.');
    }
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('OCR: Cannot create a canvas context.');
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, width, height);
}

const paddleService = {
    ocrEngine: null,
    modelLoaded: false,
    localModelZipPath: "assets/ch.zip",

    log(msg) {
        console.log(`[Ext Offscreen] ${msg}`);
        chrome.runtime.sendMessage({ target: 'background', cmd: 'LOG', msg });
    },

    async init() {
        if (this.modelLoaded && this.ocrEngine) return;
        this.log("Initializing eSearchOCR Engine...");

        this.log("Requesting models from Background...");
        let models = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ cmd: 'CMD_GET_MODELS' }, (response) => {
                if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
                if (!response || !response.success) return reject(new Error(response ? response.error : "Unknown BG Error"));
                resolve(response.models);
            });
        });

        if (!models || !models['ppocr_det.onnx'] || !models['ppocr_rec.onnx'] || !models['ppocr_keys_v1.txt']) {
            this.log("Model cache is incomplete. Loading bundled models...");
            models = await this.downloadModels();
        } else {
            this.log("Loaded models from Background.");
        }

        try {
            const detBuffer = this.base64ToArrayBuffer(models['ppocr_det.onnx']);
            const recBuffer = this.base64ToArrayBuffer(models['ppocr_rec.onnx']);
            const keysText = this.base64ToUtf8(models['ppocr_keys_v1.txt']);

            this.log(`DET Buffer: ${Object.prototype.toString.call(detBuffer)}, Size: ${detBuffer ? detBuffer.byteLength : 0}`);
            this.log(`REC Buffer: ${Object.prototype.toString.call(recBuffer)}, Size: ${recBuffer ? recBuffer.byteLength : 0}`);
            this.log(`ORT verify: ${typeof ort}, Session: ${typeof ort.InferenceSession}`);

            let initFn;
            if (window.eSearchOCR && typeof window.eSearchOCR.init === 'function') {
                initFn = window.eSearchOCR.init;
            } else if (window.eSearchOCR && window.eSearchOCR.default && typeof window.eSearchOCR.default.init === 'function') {
                initFn = window.eSearchOCR.default.init;
            }

            if (!initFn) {
                // Try finding init in any keys
                const keys = Object.keys(window).filter(k => k.includes('Search') || k.includes('OCR'));
                throw new Error(`eSearchOCR init not found. Keys: ${keys}`);
            }

            this.log("Calling eSearchOCR.init() with both DET and REC...");

            this.ocrEngine = await initFn({
                det: {
                    input: detBuffer,
                    ratio: 1.0,
                },
                rec: {
                    input: recBuffer,
                    decodeDic: keysText,
                    optimize: {
                        space: false,
                    },
                },
                dev: false,
                ort: ort,
            });

            this.modelLoaded = true;
            this.log("eSearchOCR Lib Initialized Successfully!");
        } catch (e) {
            this.log("Init Error: " + e.message);
            throw e;
        }
    },

    async downloadModels() {
        try {
            const localUrl = chrome.runtime.getURL(this.localModelZipPath);
            this.log("Loading local model zip: " + localUrl);
            const response = await fetch(localUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);
            const files = {};
            files['ppocr_rec.onnx'] = await zip.file('ppocr_rec.onnx').async('base64');
            files['ppocr_keys_v1.txt'] = await zip.file('ppocr_keys_v1.txt').async('base64');
            files['ppocr_det.onnx'] = await zip.file('ppocr_det.onnx').async('base64'); // Engine needs DET too!

            // Send to Background to save
            await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ cmd: 'CMD_SAVE_MODELS', models: files }, (response) => {
                    if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
                    if (!response || !response.success) return reject(new Error(response?.error || 'Cannot save OCR models.'));
                    resolve();
                });
            });

            return files;
        } catch (e) {
            this.log("Local model load error: " + e.message);
            throw e;
        }
    },

    async recognize(imageDataBase64) {
        const imageData = await decodeOcrImage(imageDataBase64);
        await this.init();
        this.log("Starting Recognition (Lib)...");

        try {
            let result;
            let text = '';

            if (typeof this.ocrEngine === 'function') {
                result = await this.ocrEngine(imageData);
            } else if (typeof this.ocrEngine.recognize === 'function') {
                result = await this.ocrEngine.recognize(imageData);
            } else if (typeof this.ocrEngine.ocr === 'function') {
                result = await this.ocrEngine.ocr(imageData);
            } else {
                throw new Error("Cannot find recognize method on ocrEngine");
            }

            this.log("Got Result Type: " + typeof result);

            if (typeof result === 'string') {
                text = result;
            } else if (result && typeof result === 'object') {
                if (result.text) {
                    text = result.text;
                }
                else if (result.data && result.data.text) {
                    text = result.data.text;
                }
                else if (result.parragraphs && Array.isArray(result.parragraphs)) {
                    text = result.parragraphs
                        .map(p => (p.parse && p.parse.text) ? p.parse.text : (p.text || ""))
                        .join('\n');
                }
                else if (result.src && Array.isArray(result.src)) {
                    text = result.src.map(b => b.text).join('\n');
                }
                else if (Array.isArray(result)) {
                    text = result.map(b => b.text).join('\n');
                }
                else {
                    text = JSON.stringify(result);
                }
            }

            this.log(`OCR extracted ${text.length} characters.`);

            if (typeof result === 'object' && result !== null) {
                if (!result.text) result.text = text;
                return result;
            }

            return { text: text, raw: result };

        } catch (e) {
            this.log("Recognition Lib Crash: " + e.message);
            throw e;
        }
    },

    // Utils
    base64ToArrayBuffer(base64) {
        if (!base64) return null;
        var binary_string = atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) bytes[i] = binary_string.charCodeAt(i);
        return bytes;
    },

    base64ToUtf8(base64) {
        if (!base64) return "";
        return new TextDecoder().decode(this.base64ToArrayBuffer(base64));
    }
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.target !== 'offscreen') return;

    if (msg.cmd === 'PING') {
        sendResponse('PONG');
        return false;
    }

    if (msg.cmd === 'OCR_PROCESS') {
        paddleService.log("Received OCR Task");
        paddleService.recognize(msg.data.imageBase64)
            .then(result => {
                // Send full result back
                sendResponse({ success: true, data: result });
            })
            .catch(err => {
                paddleService.log("OCR Failed: " + err.message);
                sendResponse({ success: false, error: err.message });
            });
        return true;
    }
});
