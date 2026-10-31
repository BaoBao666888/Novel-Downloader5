const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const analyzer = require('../TM_Name_Analyzer.js');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'TM Translate.user.js'), 'utf8').replace(/\r\n/g, '\n');

// These helpers are top-level declarations indented by four spaces in the userscript.
function declaration(name) {
    const match = new RegExp(`^    (?:async )?function ${name}\\(`, 'm').exec(source);
    assert.ok(match, `Missing production helper: ${name}`);
    return source.slice(match.index, source.indexOf('\n    }', match.index) + 6);
}

function nameHelpers() {
    const context = vm.createContext({ console });
    const helpers = ['escapeHtml', 'escapeRegExp', 'createSafeRegExp', 'normalizeStraightQuotePairs',
        'normalizeTextForTranslation', 'restoreTranslatedNameCasing', 'getSourceTranslatedNames',
        'createSourceTranslatedNamesRegExp', 'preserveNameInitialCase', 'restoreTranslatedNameCasingForSource',
        'normalizeTranslatedTypography', 'capitalizeFirstLetter', 'highlightNamesInText'];
    vm.runInContext(`const NAME_SET_PRIORITY_META = Symbol('priority');
        const INVISIBLE_TEXT_FORMATTING_GLOBAL_REGEX = /[\\u00AD\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\uFEFF]/g;
        ${helpers.map(declaration).join('\n')}`, context);
    return context;
}

const names = { '沈庄': 'Thẩm Trang', '沈庄园': 'Thẩm trang viên', '云乡酒店': 'khách sạn Vân Hương' };

test('long Name is not rewritten by a shorter prefix; restoration is idempotent', () => {
    const t = nameHelpers();
    const raw = '沈庄园 沈庄 沈庄园 沈庄';
    const expected = 'Thẩm trang viên Thẩm Trang Thẩm trang viên Thẩm Trang';
    const actual = t.restoreTranslatedNameCasingForSource('Thẩm Trang viên Thẩm Trang thẩm trang viên thẩm trang', raw, names);
    assert.equal(actual, expected);
    assert.equal(t.restoreTranslatedNameCasingForSource(actual, raw, names), expected);
});

test('Name capitalizes at line/sentence starts but never loses a capital initial', () => {
    const t = nameHelpers();
    const raw = '云乡酒店 沈庄';
    const text = 'khách sạn Vân Hương, Thẩm Trang. “khách sạn Vân Hương.” khách sạn Vân Hương\nkhách sạn Vân Hương; Thẩm Trang, khách sạn Vân Hương';
    assert.equal(t.restoreTranslatedNameCasingForSource(text, raw, names),
        'Khách sạn Vân Hương, Thẩm Trang. “Khách sạn Vân Hương.” Khách sạn Vân Hương\nKhách sạn Vân Hương; Thẩm Trang, khách sạn Vân Hương');
    assert.equal(t.capitalizeFirstLetter('“khách sạn.” khách sạn！khách sạn\r\n— khách sạn'),
        '“Khách sạn.” Khách sạn！Khách sạn\n— Khách sạn');
});

test('highlight preserves sentence casing, longest Name, boundaries and HTML escaping', () => {
    const t = nameHelpers();
    const html = t.highlightNamesInText('Khách sạn Vân Hương, Thẩm trang viên & <script>', names, '云乡酒店 沈庄园 沈庄');
    assert.match(html, /data-orig="云乡酒店">Khách sạn Vân Hương<\/span>/);
    assert.match(html, /data-orig="沈庄园">Thẩm trang viên<\/span>/);
    assert.doesNotMatch(html, /data-orig="沈庄"/);
    assert.match(html, /&amp; &lt;script&gt;/);
    assert.equal(t.highlightNamesInText('Thẩm Trangx', names, '沈庄'), 'Thẩm Trangx');
    assert.match(t.highlightNamesInText('A&B', {'甲':'A&B'}, '甲'), />A&amp;B<\/span>/);
});

test('source-scoped recasing does not rewrite unrelated translated paragraphs', () => {
    const t = nameHelpers();
    assert.equal(t.restoreTranslatedNameCasingForSource('Thẩm Trang viên\nThẩm Trang viên', '沈庄园\n没有', names),
        'Thẩm trang viên\nThẩm Trang viên');
});

test('reader and export repair the same old cached text without translating again', async () => {
    const t = nameHelpers();
    const raw = '沈庄园 沈庄\n云乡酒店';
    const cached = 'Thẩm Trang viên Thẩm Trang\nkhách sạn Vân Hương';
    Object.assign(t, {
        config:{},loadConfig:()=>({}),libReaderState:{book:{langSource:'zh'}},
        libGetNormalizedRawChapterContent:async()=>({rawText:raw,wasNormalized:false}),
        libMakeTransKey:()=> 'cached',libGet:async()=>({text:cached}),
        libGetEffectiveNameSet:()=>names,libNormalizeChapterParagraphBreaks:text=>text,
        libTranslateAndCacheChapter:async()=>{throw new Error('Unexpected network translation');}
    });
    vm.runInContext(['libReaderBuildHtmlFromRawAndTrans','libReaderResolveChapterDisplay',
        'libReaderResolveChapterText','libGetExportTextForChapter'].map(declaration).join('\n'),t);
    const chapter = {transKey:'cached'};
    const reader = await t.libReaderResolveChapterDisplay(chapter);
    const exported = await t.libGetExportTextForChapter({langSource:'zh'},chapter,false);
    assert.equal(reader.text,'Thẩm trang viên Thẩm Trang\nKhách sạn Vân Hương');
    assert.equal(reader.text,exported.text);
    assert.equal(await t.libReaderResolveChapterText(chapter),exported.text);
    assert.match(reader.html,/data-orig="云乡酒店">Khách sạn Vân Hương<\/span>/);
    t.libReaderState.mode = 'raw';
    assert.equal((await t.libReaderResolveChapterDisplay(chapter)).text,raw);
    assert.equal((await t.libGetExportTextForChapter({langSource:'zh'},chapter,false,{translateRaw:false})).text,raw);
});

test('failed Han-Viet suggestions preserve NER results and allow machine suggestions', async () => {
    const t = vm.createContext({console,setTimeout,config:{},
        loadHanVietJson:async()=>{throw new Error('dictionary offline');},
        requestServerTranslation:async()=>['bạch tu'],titleCaseVietnameseWords:text=>text,
        splitIntoBatches:words=>[words]});
    vm.runInContext(declaration('libBuildNameAnalyzerSuggestions'),t);
    const result = await t.libBuildNameAnalyzerSuggestions([{word:'白修'}]);
    assert.equal(result.suggestions[0].machine,'bạch tu');
    assert.match(result.warning,/dictionary offline/);
});

function modelDownloader(overrides) {
    const context=vm.createContext({console,setTimeout,clearTimeout,AbortController,Uint8Array,...overrides});
    vm.runInContext(declaration('libDownloadLacModel'),context);
    return context.libDownloadLacModel;
}

test('public model fetch omits cookies and avoids GM binary transport when possible', async () => {
    let gmCalls=0,credentials;
    const download=modelDownloader({fetch:async(_url,options)=>{
        credentials=options.credentials;return new Response(new Uint8Array([1,2,3]));
    },GM_xmlhttpRequest:()=>{gmCalls++;}});
    const buffer=await download({url:'https://example.test/model'});
    assert.deepEqual([...new Uint8Array(buffer)],[1,2,3]);
    assert.equal(credentials,'omit');assert.equal(gmCalls,0);
});

test('model transport falls back to GM if page CORS or CSP blocks fetch', async () => {
    let gmCalls=0;
    const download=modelDownloader({fetch:async()=>{throw new TypeError('CORS');},GM_xmlhttpRequest:spec=>{
        gmCalls++;queueMicrotask(()=>spec.onload({status:200,response:new Uint8Array([4,5]).buffer}));return {abort(){}};
    }});
    assert.deepEqual([...new Uint8Array(await download({url:'https://example.test/model'}))],[4,5]);
    assert.equal(gmCalls,1);
});

test('model cancellation does not retry using another transport', async () => {
    const controller=new AbortController();controller.abort();let calls=0;
    const download=modelDownloader({fetch:async()=>{calls++;},GM_xmlhttpRequest:()=>{calls++;}});
    await assert.rejects(download({url:'https://example.test/model',signal:controller.signal}),{name:'AbortError'});
    assert.equal(calls,0);
});

test('oversized model responses fail closed without retrying through GM', async () => {
    let calls=0;
    const download=modelDownloader({fetch:async()=>({ok:true,headers:{get:()=>String(49*1024*1024)}}),
        GM_xmlhttpRequest:()=>{calls++;}});
    await assert.rejects(download({url:'https://example.test/model'}),/48 MiB/);
    assert.equal(calls,0);
});

test('TexSmart parser rejects HTML/errors/schema drift and accepts valid empty results', () => {
    assert.deepEqual(Object.keys(analyzer.ENGINES), ['lac', 'bert', 'texsmart', 'hanlp']);
    assert.throws(() => analyzer.parseTexSmart('<html>redirect</html>'), /JSON/);
    assert.throws(() => analyzer.parseTexSmart({header:{ret_code:'failed',ret_msg:'busy'}}), /busy/);
    assert.throws(() => analyzer.parseTexSmart({}), /entity_list/);
    assert.deepEqual(analyzer.parseTexSmart({header:{ret_code:'succ'},entity_list:[]}), []);
    assert.deepEqual(analyzer.parseTexSmart({entity_list:[{str:'北京大学',type:{name:'org.edu'}}]}).map(x=>x.type), ['ORG']);
});

test('one failing engine does not discard a valid zero-entity response from another', async () => {
    const result = await analyzer.analyze({chapters:[{text:'没有名字'}],engines:['lac','texsmart'],
        localAnalyze:async()=>[], request:async()=>{throw new Error('offline');},retryCount:0,requestGapMs:0});
    assert.deepEqual(result.results, []);
    assert.equal(result.warnings.length, 1);
    assert.equal(result.stats.completed, 2);
});

test('NER merges real engine labels, respects filters, and aborts without retry', async () => {
    const options = {chapters:[{text:'白修来到北京大学。白修。'}],engines:['lac','texsmart'],
        localAnalyze:async()=>[{word:'白修',type:'PER'}],request:async()=>({entity_list:[{str:'白修',tag:'person'},{str:'北京大学',tag:'org.edu'}]}),
        minFrequency:2,minLength:2,maxLength:5,retryCount:0,requestGapMs:0};
    const result = await analyzer.analyze(options);
    assert.equal(result.results.length, 1);
    assert.deepEqual(result.results[0].engines, ['lac','texsmart']);
    assert.equal(result.results[0].count, 2);
    const controller = new AbortController(); controller.abort();
    await assert.rejects(analyzer.analyze({...options,signal:controller.signal}), {name:'AbortError'});
});

test('LAC failed initialization is not cached as ready and can retry successfully', async () => {
    let instances = 0;
    const context = vm.createContext({console,setTimeout,clearTimeout,TextDecoder,TextEncoder,ArrayBuffer,Uint8Array,
        crypto:{subtle:{digest:async()=>Uint8Array.from(Buffer.from('27136b570fc6de18c18e5bf4b7736a4df3f43e0e6a35e2f98db7d9c930710f74','hex')).buffer}},
        Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{}},
        Worker: class {
            constructor() { this.number = ++instances; }
            postMessage(message) {
                setTimeout(() => this.onmessage({data:{id:message.id,type:this.number===1?'error':'result',
                    error:'fixture init failed',result:message.type==='init'?true:[{word:'白修',type:'PER'}]}}), 0);
            }
            terminate() {}
        }});
    vm.runInContext(fs.readFileSync(path.join(root,'tools/TM_LAC_Analyzer.js'),'utf8'), context);
    const api = context.TMLacAnalyzer;
    const bytes = text => new TextEncoder().encode(text);
    const options = {download:async()=>new ArrayBuffer(0),unzip:()=>({
        'model/lac_weights.bin':new Uint8Array(api.WEIGHTS_BYTES),
        'model/word.dic':bytes('0\tOOV'), 'model/tag.dic':bytes('0\tPER-B'), 'model/q2b.dic':bytes('Ａ\tA')})};
    await assert.rejects(api.ensureModel(options), /fixture init failed/);
    assert.equal((await api.getCacheStatus()).ready, false);
    const retry = api.ensureModel(options);
    assert.equal((await api.getCacheStatus()).ready, false);
    assert.equal((await retry).ready, true);
    assert.equal((await api.getCacheStatus()).ready, true);
    assert.equal(instances, 2);
    await api.ensureModel(options);
    assert.equal(instances, 2);
    api.terminate();
    assert.equal((await api.getCacheStatus()).ready, false);
});
