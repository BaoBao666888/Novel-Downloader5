const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { test } = require('node:test');
const build = require('../build-tm-helper.cjs');
const JSZip = require('../../translate/TM-translate/TM-Extension-Helper/assets/jszip.min.js');
const source = fs.readFileSync(path.resolve(__dirname, '../../TM Translate.user.js'), 'utf8').replace(/\r\n/g, '\n');
function declaration(name) {
    const start = source.search(new RegExp(`^    (?:async )?function ${name}\\(`, 'm'));
    assert.notEqual(start, -1, name);
    return source.slice(start, source.indexOf('\n    }', start) + 6);
}

test('screen OCR is capability-based and routes unsupported browsers to image import', async () => {
    for (const mediaDevices of [undefined, {}, { getDisplayMedia: null }]) {
        let imports = 0;
        const context = vm.createContext({ navigator: { mediaDevices }, showNotification() {}, handleOcrImportMode: () => imports++ });
        vm.runInContext(['supportsScreenOcr', 'handleOcrScreenMode', 'activateAreaSelectionMode'].map(declaration).join('\n'), context);
        assert.equal(context.supportsScreenOcr(), false);
        await context.handleOcrScreenMode();
        await context.activateAreaSelectionMode();
        assert.equal(imports, 2);
    }
});

test('screen capture capability is not decided from the user agent', () => {
    const context = vm.createContext({ navigator: { mediaDevices: { getDisplayMedia() {} } } });
    vm.runInContext(declaration('supportsScreenOcr'), context);
    assert.equal(context.supportsScreenOcr(), true);
    assert.match(declaration('activateAreaSelectionMode'), /touchAction: 'none'/);
    assert.match(declaration('activateAreaSelectionMode'), /addEventListener\('pointerdown'/);
});

test('local OCR uses a real SIMD probe without changing global fetch or SharedArrayBuffer', () => {
    const context = vm.createContext({ WebAssembly, Uint8Array });
    vm.runInContext(declaration('supportsOcrSimd'), context);
    assert.equal(typeof context.supportsOcrSimd(), 'boolean');
    const init = declaration('ensureOrtSandbox');
    assert.match(init, /numThreads = 1/);
    assert.match(init, /proxy = false/);
    assert.doesNotMatch(init, /SharedArrayBuffer|__tmFetchPatched|XMLHttpRequest/);
    assert.doesNotMatch(source, /window\.SharedArrayBuffer = SafeBuffer/);
    assert.doesNotMatch(source, /release-assets\.githubusercontent\.com[^\n]+se=2026-01/);
});

test('asset verification rejects content changes, not just incorrect byte lengths', () => {
    const bytes = Buffer.from('known data');
    const asset = { file: 'fixture.wasm', bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
    build.verifyAsset(asset, bytes);
    assert.throws(() => build.verifyAsset(asset, Buffer.from('other data')), /SHA-256/);
});

test('release restore validates all missing assets before writing anything', async (t) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tm-helper-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const zip = new JSZip();
    zip.file('TM-Extension-Helper/assets/ch.zip', 'invalid model');
    const bytes = await zip.generateAsync({ type: 'nodebuffer' });
    await assert.rejects(build.restoreAssets(directory, async () => new Response(bytes)), /SHA-256/);
    assert.equal(fs.existsSync(path.join(directory, 'assets')), false);
});

test('release restore never overwrites a modified local asset', async (t) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tm-helper-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    fs.mkdirSync(path.join(directory, 'assets'));
    const filename = path.join(directory, 'assets/ch.zip');
    fs.writeFileSync(filename, 'user data');
    let requests = 0;
    await assert.rejects(build.restoreAssets(directory, async () => { requests++; }), /SHA-256/);
    assert.equal(requests, 0);
    assert.equal(fs.readFileSync(filename, 'utf8'), 'user data');
});
