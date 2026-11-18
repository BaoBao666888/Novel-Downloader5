const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../..');
const core = fs.readFileSync(path.join(root, 'src/novelDownloaderVietSub.core.user.js'), 'utf8');
const rules = {
    shuku: 'src/rules/special/0006-52shuku-vip.rule.js',
    wenku: 'src/rules/special/0145-256wenku-com.rule.js',
};

function declaration(name) {
    const start = core.search(new RegExp(`^    (?:async )?function ${name}\\(`, 'm'));
    assert.notEqual(start, -1);
    return core.slice(start, core.indexOf('\n    }', start) + 6);
}

// The selector fixture only models the DOM operations used by the shared reader.
function selection(nodes) {
    return {
        length: nodes.length,
        toArray: () => nodes,
        not: (node) => selection(nodes.filter((item) => typeof node === 'string' ? !item.empty : item !== node)),
        filter: (fn) => selection(nodes.filter((item, index) => fn(index, item))),
        find: (node) => selection(nodes.flatMap((item) => item.descendants || []).filter((item) => item === node)),
        html: () => nodes[0]?.html,
    };
}

function readerContext(selectors) {
    const context = vm.createContext({
        console,
        document: { name: 'current-page' },
        $: (value) => selection(typeof value === 'string' ? selectors[value] || [] : [value]),
    });
    vm.runInContext(`${declaration('extractChapterContent')}\n${declaration('getFromRule')}`, context);
    return context;
}

test('missing chapter selector rejects instead of returning a verification/error page', () => {
    const context = readerContext({ body: [{ html: '<p>Just a moment...</p>' }] });
    assert.throws(() => context.extractChapterContent('#nr1', {}), /#nr1/);
});

test('chapter extraction excludes a selected ancestor and keeps separate content blocks', () => {
    const first = { html: '<p>First paragraph</p>' };
    const second = { html: '<p>Second paragraph</p>' };
    const ancestor = { html: '<header>Navigation</header>', descendants: [first] };
    const context = readerContext({ '.content': [ancestor, first, second] });
    assert.equal(context.extractChapterContent('.content', {}), `${first.html}\n${second.html}`);
});

test('common rule ignores empty matches without falling back to body', () => {
    const context = readerContext({ '#content': [{ html: '', empty: true }] });
    assert.throws(() => context.extractChapterContent('#content', {}, true), /#content/);
});

test('preview and real download share fail-closed extraction and pass the response document', () => {
    assert.equal((core.match(/=> extractChapterContent\(selector, doc/g) || []).length, 2);
    assert.doesNotMatch(core, /elems\s*=\s*\$\(['"]body['"],\s*doc\)/);
    assert.match(core, /extractChapterContent\(selector, doc\), \{ document: doc \}/);
    assert.match(core, /extractChapterContent\(selector, doc, rule === Rule\), \{ document: doc \}/);
});

test('content and contentCheck callbacks receive the downloaded document, not the open tab', async () => {
    const context = readerContext({});
    const responseDoc = { name: 'chapter-response' };
    const read = Object.assign(() => '', { document: responseDoc });
    const result = await context.getFromRule((doc) => doc.name, read, [], '');
    assert.equal(result, 'chapter-response');
});

function loadRule(kind, url, { links = [], selectors = {}, fetchDoc } = {}) {
    const location = new URL(url);
    const document = {
        querySelector: (selector) => selectors[selector] || null,
        querySelectorAll: () => links,
    };
    const context = vm.createContext({
        location, window: { location }, document, URL,
        $: (selector) => ({
            length: selectors[selector] ? 1 : 0,
            first: () => ({ find: () => ({ attr: () => selectors.breadcrumb }) }),
        }),
        Rule: { helpers: { requestDoc: fetchDoc || (() => { throw new Error('Unexpected network request'); }) } },
    });
    const rule = vm.runInContext(fs.readFileSync(path.join(root, rules[kind]), 'utf8'), context);
    return { rule, context };
}

const anchor = (title, href) => ({ textContent: title, getAttribute: () => href });

test('256 reader recognizes the old and new domains but rejects lookalikes', () => {
    const selectors = { '.catalog > li > a, .list > li > a': true };
    for (const domain of ['256wenku.com', '256wx.org']) {
        assert.equal(loadRule('wenku', `https://www.${domain}/read/6219/`, { selectors }).rule.filter(), 1);
    }
    assert.equal(loadRule('wenku', 'https://www.256wx.org.example/read/6219/', { selectors }).rule.filter(), 0);
    assert.equal(loadRule('wenku', 'https://www.256wx.org/read/6219/1.html', { selectors: { '.book_con': true } }).rule.filter(), 2);
});

test('256 index resolves relative URLs and removes duplicate entries', async () => {
    const { rule } = loadRule('wenku', 'https://www.256wx.org/read/6219/', {
        links: [anchor('First', '1.html'), anchor('First again', '/read/6219/1.html'), anchor('Last', '97.html')],
    });
    const chapters = await rule.getChapters();
    assert.equal(chapters.length, 2);
    assert.equal(chapters[0].url, 'https://www.256wx.org/read/6219/1.html');
    assert.equal(chapters[1].url, 'https://www.256wx.org/read/6219/97.html');
});

test('256 chapter links back to the full catalog without leaking query/hash', async () => {
    let requested;
    const { rule } = loadRule('wenku', 'https://www.256wx.org/read/6219/1.html?view=1#text', {
        fetchDoc: async (url) => {
            requested = url;
            return { querySelectorAll: () => [anchor('First', '1.html'), anchor('Last', '97.html')] };
        },
    });
    assert.equal(rule.infoPage(), 'https://www.256wx.org/read/6219/');
    assert.equal((await rule.getChapters()).length, 2);
    assert.equal(requested, 'https://www.256wx.org/read/6219/');
});

test('52 reader recognizes index/chapter only and keeps old/new content selectors', () => {
    assert.equal(loadRule('shuku', 'https://www.52shuku.net/yanqing/hTI.html', { selectors: { '.list.clearfix': true } }).rule.filter(), 1);
    const { rule } = loadRule('shuku', 'https://www.52shuku.vip/yanqing/hTI_2.html', { selectors: { '.book_con, #nr1': true } });
    assert.equal(rule.filter(), 2);
    assert.match(rule.content, /#text\.book_con/);
    assert.match(rule.content, /#nr1:not\(ul\)/);
    assert.equal(loadRule('shuku', 'https://www.52shuku.net/yanqing/').rule.filter(), 0);
});

test('52 reader fetches the catalog from a chapter and deduplicates entries', async () => {
    let requested;
    const { rule } = loadRule('shuku', 'https://www.52shuku.net/yanqing/hTI_151.html', {
        selectors: { breadcrumb: '/yanqing/hTI.html' },
        fetchDoc: async (url) => {
            requested = url;
            return { querySelectorAll: () => [anchor('First', 'hTI_2.html'), anchor('Same', 'hTI_2.html'), anchor('Last', 'hTI_528.html')] };
        },
    });
    const chapters = await rule.getChapters();
    assert.equal(requested, 'https://www.52shuku.net/yanqing/hTI.html');
    assert.equal(chapters.length, 2);
    assert.equal(chapters[1].url, 'https://www.52shuku.net/yanqing/hTI_528.html');
});

test('both readers reject empty/error catalogs instead of treating them as successful books', async () => {
    const shuku = loadRule('shuku', 'https://www.52shuku.net/yanqing/hTI.html', { selectors: { '.list.clearfix > li > a': true } }).rule;
    const wenku = loadRule('wenku', 'https://www.256wx.org/read/6219/').rule;
    await assert.rejects(shuku.getChapters(), /Không tìm thấy danh sách chương/);
    await assert.rejects(wenku.getChapters(), /Không tìm thấy danh sách chương/);
});

test('supported sites includes the public domains fixed in issue 32', () => {
    const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/rules/supported-sites.json'), 'utf8'));
    const entries = Array.isArray(catalog) ? catalog : catalog.sites;
    const wenku = entries.find((entry) => entry.file === rules.wenku);
    assert.ok(wenku.domains.includes('www.256wx.org'));
});

test('page titles keep the catalog label instead of leaving an author/status suffix', () => {
    for (const kind of ['shuku', 'wenku']) {
        const { rule } = loadRule(kind, 'https://example.test/');
        assert.equal(rule.chapterTitle({}, {}, { raw: { title: '第150页' } }), '第150页');
    }
});

function chapterLoadContext({ contentCheck } = {}) {
    const context = readerContext({ '#content': [{ html: '<p>Chapter body</p>' }] });
    const rule = { chapterTitle: () => 'Chapter 1', content: '#content', contentCheck };
    Object.assign(context, {
        window: {}, Config: {}, Rule: {},
        Storage: { rule, book: { title: 'Book' }, debug: {} },
        vipChapters: [], chaptersDownloaded: [], failedCount: 0,
        progress: 0, persisted: 0,
    });
    const start = core.indexOf('            const originalOnChapterLoad = async (res, request) => {');
    assert.notEqual(start, -1);
    const callback = core.slice(start, core.indexOf('\n            };', start) + 15);
    vm.runInContext(`const updateProgress = () => progress++;
        const persistDownloadResumeData = async () => persisted++;
        ${callback}
        this.readChapter = originalOnChapterLoad;`, context);
    return context;
}

test('download callback persists valid content only after successful extraction', async () => {
    const context = chapterLoadContext();
    const chapter = { url: 'https://example.test/1' };
    await context.readChapter({ response: {}, responseText: '<html>response</html>' }, { raw: chapter });
    assert.equal(chapter.contentRaw, '<p>Chapter body</p>');
    assert.equal(context.persisted, 1);
    assert.equal(context.progress, 1);
});

test('download callback never marks a missing content selector successful', async () => {
    const context = chapterLoadContext();
    context.Storage.rule.content = '#missing';
    const chapter = { url: 'https://example.test/1' };
    await assert.rejects(context.readChapter({ response: {}, responseText: '<body>Error</body>' }, { raw: chapter }), /#missing/);
    assert.equal(chapter.contentRaw, undefined);
    assert.equal(context.persisted, 0);
    assert.equal(context.progress, 0);
});

test('download callback fails a contentCheck against the response document', async () => {
    let checked;
    const context = chapterLoadContext({ contentCheck: (doc) => { checked = doc; return false; } });
    const responseDoc = { name: 'response' };
    const chapter = { url: 'https://example.test/1' };
    await assert.rejects(context.readChapter({ response: responseDoc, responseText: '<body>Error</body>' }, { raw: chapter }), /ContentCheck/);
    assert.equal(checked, responseDoc);
    assert.equal(chapter.contentRaw, '');
    assert.equal(context.persisted, 0);
});
