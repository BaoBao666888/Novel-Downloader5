const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../..');
const main = fs.readFileSync(path.join(root, 'TM Translate.user.js'), 'utf8').replace(/\r\n/g, '\n');
const helperDir = path.join(root, 'translate/TM-translate/TM-Extension-Helper');

function declaration(source, name, indent = '    ') {
    const start = source.search(new RegExp(`^${indent}(?:async )?function ${name}\\(`, 'm'));
    assert.notEqual(start, -1, name);
    const end = indent ? source.indexOf(`\n${indent}}`, start) + indent.length + 2 : source.indexOf('\n}', start) + 2;
    return source.slice(start, end);
}

function selectionContext(translate) {
    const messages = [];
    const context = vm.createContext({
        console: { error() {} },
        window: { location: { hostname: 'example.test' }, getSelection: () => null },
        document: { body: { contains: (node) => node.connected !== false } },
        loadConfig: () => ({}), normalizeTextForTranslation: (text) => text,
        translatePanelText: translate,
        showLoading() {}, removeLoading() {}, hideSelectionEditButton() {},
        showNotification: (message) => messages.push(message),
    });
    vm.runInContext(`let isTranslating = false; let lastSelectionRange = null;
        ${declaration(main, 'translatePageSelection')}
        this.busy = () => isTranslating;`, context);
    return { context, messages };
}

function part(original, start = 0, end = original.length) {
    return { node: { nodeValue: original }, original, start, end, text: original.slice(start, end) };
}

test('selection translation changes only selected characters and preserves outside whitespace', async () => {
    const piece = part('before 中国 after', 7, 9);
    const { context } = selectionContext(async (text, type) => {
        assert.equal(text, '中国');
        assert.equal(type, 'paragraphs');
        return ['Trung Quốc'];
    });
    await context.translatePageSelection({ parts: [piece], text: '中国' });
    assert.equal(piece.node.nodeValue, 'before Trung Quốc after');
    assert.equal(context.busy(), false);
});

test('selection batches text nodes and keeps paragraph/inline whitespace boundaries', async () => {
    const parts = [part('前缀  中国 ', 2), part('你好\n世界')];
    const { context } = selectionContext(async (text) => {
        assert.equal(text, '  中国 \n你好\n世界');
        return ['Trung Quốc', 'Xin chào', 'Thế giới'];
    });
    await context.translatePageSelection({ parts, text: '中国 你好世界' });
    assert.equal(parts[0].node.nodeValue, '前缀  Trung Quốc ');
    assert.equal(parts[1].node.nodeValue, 'Xin chào\nThế giới');
});

test('adjacent translated inline words do not become glued together', async () => {
    const parts = [part('你好'), { ...part('世界'), joinPrevious: true }];
    const { context } = selectionContext(async () => ['Xin chào', 'Thế giới']);
    await context.translatePageSelection({ parts, text: '你好世界' });
    assert.equal(parts.map((piece) => piece.node.nodeValue).join(''), 'Xin chào Thế giới');
});

test('changed DOM, short responses, empty translations and errors never partially apply', async () => {
    for (const mode of ['changed', 'detached', 'short', 'empty', 'error']) {
        const pieces = [part('中国'), part('你好')];
        const { context, messages } = selectionContext(async () => {
            if (mode === 'changed') pieces[1].node.nodeValue = 'page update';
            if (mode === 'detached') pieces[1].node.connected = false;
            if (mode === 'short') return ['Trung Quốc'];
            if (mode === 'empty') return ['Trung Quốc', ''];
            if (mode === 'error') throw new Error('offline');
            return ['Trung Quốc', 'Xin chào'];
        });
        await context.translatePageSelection({ parts: pieces, text: '中国你好' });
        assert.equal(pieces[0].node.nodeValue, '中国', mode);
        assert.equal(pieces[1].node.nodeValue, mode === 'changed' ? 'page update' : '你好', mode);
        assert.ok(messages.length, mode);
        assert.equal(context.busy(), false, mode);
    }
});

test('non-page selections do not call the translator', async () => {
    const { context, messages } = selectionContext(() => { throw new Error('Unexpected request'); });
    await context.translatePageSelection({ parts: [], text: 'editor' });
    assert.equal(messages.length, 1);
});

test('D button preserves a pointer selection but never reuses it for later clicks', async () => {
    const listeners = {};
    const calls = [];
    let selected = { parts: ['selected'] };
    const context = vm.createContext({
        getPageTranslationSelection: () => selected,
        startTranslateAction: (options) => calls.push(options.selection),
    });
    vm.runInContext(declaration(main, 'bindTranslateButtonSelection'), context);
    context.bindTranslateButtonSelection({ addEventListener: (name, fn) => { listeners[name] = fn; } });
    listeners.pointerdown();
    selected = null;
    listeners.click({ detail: 1 });
    assert.deepEqual(calls[0].parts, ['selected']);
    listeners.pointerdown();
    listeners.click({ detail: 1 });
    assert.equal(calls[1], null);
    selected = { parts: ['old'] };
    listeners.pointerdown();
    selected = null;
    listeners.click({ detail: 0 });
    assert.equal(calls[2], null);
});

test('selection branch precedes body cloning and Name retranslation explicitly requests the full page', () => {
    const action = declaration(main, 'startTranslateAction');
    assert.ok(action.indexOf('return translatePageSelection(selection)') < action.indexOf('originalBodyClone ='));
    assert.match(declaration(main, 'applyChangesAndRetranslate'), /startTranslateAction\(\{ forcePage: true \}\)/);
    assert.match(main, /return returnType === 'paragraphs' \? resultArray/);
});

test('OCR background unwraps content-script payloads and rejects invalid objects', () => {
    const source = fs.readFileSync(path.join(helperDir, 'background.js'), 'utf8');
    const context = vm.createContext({});
    vm.runInContext(declaration(source, 'normalizeOcrImageInput', ''), context);
    assert.equal(context.normalizeOcrImageInput('data:image/png;base64,abc'), 'data:image/png;base64,abc');
    assert.equal(context.normalizeOcrImageInput({ imageBase64: 'data:image/png;base64,abc' }), 'data:image/png;base64,abc');
    for (const value of [null, {}, '', 123, { imageBase64: {} }]) assert.throws(() => context.normalizeOcrImageInput(value), /invalid image/);
});

function imageDecoder({ width = 100, height = 40, fail = false } = {}) {
    const calls = [];
    const source = fs.readFileSync(path.join(helperDir, 'offscreen.js'), 'utf8');
    const context = vm.createContext({
        setTimeout, clearTimeout,
        Image: class {
            naturalWidth = width;
            naturalHeight = height;
            set src(value) { queueMicrotask(() => fail ? this.onerror?.() : this.onload?.()); }
        },
        OffscreenCanvas: class {
            constructor(w, h) { calls.push([w, h]); }
            getContext() { return { drawImage() {}, getImageData: () => ({ width, height, data: new Uint8ClampedArray(4) }) }; }
        },
    });
    vm.runInContext(declaration(source, 'decodeOcrImage', ''), context);
    return { decode: context.decodeOcrImage, calls };
}

test('OCR decodes actual pixel dimensions before constructing OffscreenCanvas', async () => {
    const { decode, calls } = imageDecoder();
    const pixels = await decode('data:image/png;base64,abc');
    assert.deepEqual(calls, [[100, 40]]);
    assert.equal(pixels.width, 100);
});

test('OCR rejects corrupt/empty/oversized images before canvas allocation', async () => {
    for (const fixture of [{ fail: true }, { width: 0 }, { height: NaN }, { width: 10000, height: 10000 }]) {
        const { decode, calls } = imageDecoder(fixture);
        await assert.rejects(decode('data:image/png;base64,abc'), /OCR:/);
        assert.equal(calls.length, 0);
    }
});

test('OCR recognition passes ImageData to the library and extracts text without global state', async () => {
    const source = fs.readFileSync(path.join(helperDir, 'offscreen.js'), 'utf8');
    const start = source.indexOf('    async recognize(imageDataBase64) {');
    const end = source.indexOf('\n    },', start) + 6;
    const pixels = { width: 100, height: 40, data: new Uint8ClampedArray(4) };
    let input;
    const context = vm.createContext({ decodeOcrImage: async () => pixels });
    const service = vm.runInContext(`({${source.slice(start, end)}})`, context);
    service.init = async () => {};
    service.log = () => {};
    service.ocrEngine = { ocr: async (image) => { input = image; return { parragraphs: [{ text: '中文' }, { text: '123' }] }; } };
    const result = await service.recognize('data:image/png;base64,abc');
    assert.equal(input, pixels);
    assert.equal(result.text, '中文\n123');
    assert.equal(context.text, undefined);
});

test('extension source and asset manifest describe a complete release package', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(helperDir, 'manifest.json'), 'utf8'));
    const files = [manifest.background.service_worker, ...manifest.content_scripts.flatMap((item) => item.js),
        'offscreen.html', 'offscreen.js', 'assets/jszip.min.js', 'assets/ort.min.js', 'assets/eSearchOCR.umd.js'];
    for (const file of files) assert.ok(fs.statSync(path.join(helperDir, file)).size > 0, file);
    assert.equal(manifest.version, '2.1.1');
    const assets = JSON.parse(fs.readFileSync(path.join(helperDir, 'assets-manifest.json'), 'utf8'));
    assert.equal(assets.version, manifest.version);
    assert.equal(assets.assets.filter((asset) => /\.(wasm|zip)$/.test(asset.file)).length, 5);
    for (const asset of assets.assets) {
        assert.match(asset.sha256, /^[a-f0-9]{64}$/);
        assert.ok(asset.bytes > 0);
    }
});
