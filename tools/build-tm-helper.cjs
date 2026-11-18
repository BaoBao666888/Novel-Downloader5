#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const JSZip = require('../translate/TM-translate/TM-Extension-Helper/assets/jszip.min.js');
const root = path.resolve(__dirname, '..');
const helper = path.join(root, 'translate/TM-translate/TM-Extension-Helper');
const assetManifest = require('../translate/TM-translate/TM-Extension-Helper/assets-manifest.json');
const sourceFiles = ['manifest.json', 'background.js', 'offscreen.html', 'offscreen.js',
    'bridge.js', 'content_script.js', 'rules.json', 'README.md', 'assets-manifest.json'];

function verifyAsset(asset, data) {
    if (data.length !== asset.bytes || crypto.createHash('sha256').update(data).digest('hex') !== asset.sha256) {
        throw new Error(`Asset size/SHA-256 mismatch: ${asset.file}`);
    }
}

function verifyAssets(directory = helper) {
    for (const asset of assetManifest.assets) {
        const filename = path.join(directory, 'assets', asset.file);
        if (!fs.existsSync(filename)) throw new Error(`Missing ${asset.file}. Run node tools/build-tm-helper.cjs --download-assets`);
        verifyAsset(asset, fs.readFileSync(filename));
    }
}

async function restoreAssets(directory = helper, fetchImpl = fetch) {
    for (const asset of assetManifest.assets) {
        const filename = path.join(directory, 'assets', asset.file);
        if (fs.existsSync(filename)) verifyAsset(asset, fs.readFileSync(filename));
    }
    const missing = assetManifest.assets.filter((asset) => !fs.existsSync(path.join(directory, 'assets', asset.file)));
    if (!missing.length) return verifyAssets(directory);
    const response = await fetchImpl(assetManifest.downloadUrl, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw new Error(`Release download failed: HTTP ${response.status}`);
    if (Number(response.headers.get('content-length')) > 100 * 1024 * 1024) throw new Error('Release archive exceeds 100 MiB');
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length > 100 * 1024 * 1024) throw new Error('Release archive exceeds 100 MiB');
    const zip = await JSZip.loadAsync(data, { checkCRC32: true });
    const staged = [];
    for (const asset of missing) {
        const entry = zip.file(`TM-Extension-Helper/assets/${asset.file}`);
        if (!entry) throw new Error(`Release archive is missing ${asset.file}`);
        const buffer = await entry.async('nodebuffer');
        verifyAsset(asset, buffer);
        staged.push({ asset, buffer });
    }
    // Validate the complete download before writing any missing assets.
    fs.mkdirSync(path.join(directory, 'assets'), { recursive: true });
    for (const { asset, buffer } of staged) fs.writeFileSync(path.join(directory, 'assets', asset.file), buffer);
    verifyAssets(directory);
}

async function pack(output = path.join(root, 'dist/tm-helper')) {
    verifyAssets();
    const manifest = JSON.parse(fs.readFileSync(path.join(helper, 'manifest.json'), 'utf8'));
    if (manifest.version !== assetManifest.version) throw new Error('Manifest and asset version differ');
    const zip = new JSZip();
    const prefix = 'TM-Extension-Helper/';
    const add = (name, data) => zip.file(prefix + name, data, { date: new Date('2026-01-01T00:00:00Z') });
    for (const name of sourceFiles) {
        let data = fs.readFileSync(path.join(helper, name));
        if (name === 'README.md') data = Buffer.from(data.toString('utf8')
            .replace(/\.\.\/\.\.\/\.\.\/TM%20Translate\.user\.js/g, 'https://github.com/BaoBao666888/Novel-Downloader5/raw/main/TM%20Translate.user.js')
            .replace(/\.\.\/\.\.\/\.\.\//g, './'));
        add(name, data);
    }
    for (const asset of assetManifest.assets) add('assets/' + asset.file, fs.readFileSync(path.join(helper, 'assets', asset.file)));
    for (const name of ['LICENSE', 'THIRD_PARTY_NOTICES.md', 'LICENSES/MIT-third-party.txt', 'LICENSES/Apache-2.0.txt']) {
        add(name, fs.readFileSync(path.join(root, name)));
    }
    const commit = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    add('BUILD.json', JSON.stringify({ version: manifest.version, baseCommit: commit,
        source: 'Workspace snapshot. Corresponding extension source is included in this ZIP.' }, null, 2));
    const bytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
    fs.mkdirSync(output, { recursive: true });
    const archiveName = `TM-Extension-Helper-${manifest.version}.zip`;
    fs.writeFileSync(path.join(output, archiveName), bytes);
    fs.copyFileSync(path.join(helper, 'assets/ch.zip'), path.join(output, 'ch.zip'));
    const userscript = fs.readFileSync(path.join(root, 'TM Translate.user.js'));
    const scriptVersion = userscript.toString('utf8').match(/^\/\/ @version\s+(\S+)/m)?.[1];
    if (!scriptVersion) throw new Error('Cannot read TM Translate version');
    const scriptName = `TM-Translate-${scriptVersion}.user.js`;
    fs.writeFileSync(path.join(output, scriptName), userscript);
    const sums = [archiveName, 'ch.zip', scriptName].map((name) =>
        `${crypto.createHash('sha256').update(fs.readFileSync(path.join(output, name))).digest('hex')}  ${name}`).join('\n') + '\n';
    fs.writeFileSync(path.join(output, 'SHA256SUMS'), sums);
    return { archive: path.join(output, archiveName), bytes: bytes.length, version: manifest.version };
}

async function main() {
    const command = process.argv[2] || '--pack';
    if (command === '--download-assets') await restoreAssets();
    else if (command === '--verify') verifyAssets();
    else if (command === '--pack') console.log(JSON.stringify(await pack(), null, 2));
    else throw new Error('Use --pack, --verify or --download-assets');
}

module.exports = { assetManifest, verifyAsset, verifyAssets, restoreAssets, pack };
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
