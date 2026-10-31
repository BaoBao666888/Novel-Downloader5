const assert = require('node:assert/strict');
const {test} = require('node:test');
const ner = require('../TM_Name_Analyzer.js');
const bert = require('../TM_BERT_Analyzer.js');
const fs = require('node:fs');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');

test('HanLP normalizes nested MSRA responses and supports anonymous or optional Basic auth', () => {
    const rows = ner.parseHanlp({'ner/msra':[[['白修','PERSON',0,1],['北京','LOCATION',2,3],['北京大学','ORGANIZATION',4,6]]]});
    assert.deepEqual(rows.map(row=>row.type),['PER','LOC','ORG']);
    assert.ok(rows.every(row=>row.engine==='hanlp'));
    assert.equal(ner.makeHanlpRequest('白修').headers.Authorization, undefined);
    assert.equal(ner.makeHanlpRequest('白修',{apiKey:'test-key'}).headers.Authorization,'Basic test-key');
    assert.deepEqual(ner.parseHanlp({'ner/msra':[[]]}),[]);
    assert.throws(()=>ner.parseHanlp({detail:'quota'}),/quota/);
    assert.throws(()=>ner.parseHanlp({}),/NER/);
});

test('limits use Unicode code points and support 12-character names without splitting surrogates', () => {
    const input = '𠀀白修来到北京。'.repeat(400);
    const chunks = ner.splitText(input,800);
    assert.equal(chunks.join(''),input);
    assert.ok(chunks.every(chunk=>Array.from(chunk).length<=800 && !/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/.test(chunk)));
    const twelve = '中国科学院北京自然研究中心';
    const word = Array.from(twelve).slice(0,12).join('');
    assert.equal(ner.mergeEntities([{word,type:'ORG',engine:'hanlp'}],word,{maxLength:12}).length,1);
    assert.equal(ner.mergeEntities([{word:word+'院',type:'ORG',engine:'hanlp'}],word+'院',{maxLength:20}).length,0);
});

test('BERT uses overlapping windows below 512 tokens without losing the end of long text', () => {
    const input = '甲'.repeat(377)+'北京大学'+'乙'.repeat(500)+'尾部';
    const windows = bert.splitSegments(input);
    assert.ok(windows.every(window=>Array.from(window).length<=384));
    assert.ok(windows.some(window=>window.includes('北京大学')));
    assert.ok(windows.at(-1).endsWith('尾部'));
    assert.ok(windows[0].slice(-24)===windows[1].slice(0,24));
});

test('BERT BIO merging respects labels, gaps, adjacent B entities and unknown tokens', () => {
    const token = (word,entity,index)=>({word,entity,index,score:0.9});
    const rows = bert.mergeTokenEntities([token('北','B-LOC',1),token('京','I-LOC',2),token('白','B-PER',3),token('修','I-PER',4),
        token('宋','B-PER',5),token('青','I-PER',6),token('玉','I-PER',7),token('北','B-ORG',9),token('京','I-ORG',10),
        token('大','I-ORG',11),token('学','I-ORG',12),token('[UNK]','I-ORG',13),token('甲','B-MISC',14)]);
    assert.deepEqual(rows.map(row=>[row.word,row.type]),[['北京','LOC'],['白修','PER'],['宋青玉','PER'],['北京大学','ORG']]);
    assert.equal(bert.mergeTokenEntities([token('甲','B-PER',1),token('乙','I-PER',3)]).length,2);
});

function limiterStorage() {
    const data = new Map();
    let clock = 1000;
    return {data, now:()=>clock,
        get:async key=>structuredClone(data.get(key)),set:async(key,value)=>{data.set(key,structuredClone(value));},
        list:async()=>Array.from(data.keys()),remove:async key=>{data.delete(key);},
        wait:async(ms,signal)=>{if(signal?.aborted)throw Object.assign(new Error('abort'),{name:'AbortError'});clock+=ms;}};
}

test('HanLP pacing persists across limiter instances and blocks after quota without retries', async () => {
    const storage = limiterStorage();
    const a = ner.createHanlpLimiter(storage), b = ner.createHanlpLimiter(storage);
    await a.reserve(); const first = storage.now();
    await b.reserve(); assert.equal(storage.now()-first,31000);
    await a.reserve(); assert.equal(storage.now()-first,62000);
    await b.block(120000);
    await assert.rejects(a.reserve(),/quota/);
    assert.ok([...storage.data.keys()].every(key=>!key.startsWith('tm_ner_hanlp_ticket_')));
});

test('invalid HanLP persisted limiter state fails closed', async () => {
    const storage = limiterStorage();
    storage.data.set('tm_ner_hanlp_rate_v1',{nextAt:'invalid'});
    await assert.rejects(ner.createHanlpLimiter(storage).reserve(),/Trạng thái/);
});

test('HanLP 429 disables remaining requests while local NER and progress survive', async () => {
    let requests=0,blocked=0;
    const result = await ner.analyze({chapters:[{text:'白修来到北京。'.repeat(300)}],engines:['bert','hanlp'],
        localAnalyzers:{bert:async()=>[{word:'白修',type:'PER'}]},
        request:async()=>{requests++;throw Object.assign(new Error('quota'),{status:429,retryAfterMs:90000});},
        hanlpLimiter:{reserve:async()=>{},block:async ms=>{blocked=ms;}},retryCount:3,requestGapMs:0});
    assert.equal(requests,1);
    assert.equal(blocked,90000);
    assert.equal(result.warnings[0].count,1);
    assert.equal(result.stats.completed,result.stats.requests);
    assert.equal(result.results[0].engines[0],'bert');
});

test('HanLP request batches respect their own 800-character limit', async () => {
    const sizes=[];
    await ner.analyze({chapters:[{text:'甲'.repeat(1900)}],engines:['hanlp'],
        request:async spec=>{sizes.push(Array.from(JSON.parse(spec.body).text).length);return {'ner/msra':[]};},
        hanlpLimiter:{reserve:async()=>{}},requestGapMs:0});
    assert.deepEqual(sizes,[800,800,300]);
});

test('BERT receives the full chapter so orchestration cannot cut a Name at 6000 characters', async () => {
    const text='甲'.repeat(5998)+'北京大学'+'乙'.repeat(800);
    const inputs=[];
    await ner.analyze({chapters:[{text}],engines:['bert'],localAnalyzers:{bert:async input=>{inputs.push(input);return [];}}});
    assert.deepEqual(inputs,[text]);
});

test('a HanLP reservation already waiting respects a later shared quota block', async () => {
    const storage=limiterStorage();
    const first=ner.createHanlpLimiter(storage);await first.reserve();
    let wake;
    storage.wait=async ms=>{if(ms>0)await new Promise(resolve=>{wake=resolve;});};
    const pending=ner.createHanlpLimiter(storage).reserve();
    while(!wake)await new Promise(resolve=>setImmediate(resolve));
    await first.block(90000);
    const assertion=assert.rejects(pending,/quota/);
    wake();await assertion;
});

test('BERT rejects modified assets even when file lengths match', async () => {
    const assets=Object.fromEntries(bert.FILES.map(file=>[file.path,new ArrayBuffer(file.bytes)]));
    await assert.rejects(bert.validateAssets(assets),/SHA-256/);
});

function isolatedBert() {
    const context=vm.createContext({console,setTimeout,clearTimeout,TextDecoder,TextEncoder,Uint8Array,ArrayBuffer,
        crypto:webcrypto,fflate:{unzipSync:()=>{throw new Error('Invalid archive must not be extracted');}}});
    vm.runInContext(fs.readFileSync(require.resolve('../TM_BERT_Analyzer.js'),'utf8'),context);
    return context.TMBertAnalyzer;
}

test('BERT falls back once and rejects an HTML or invalid ZIP mirror before extraction', async () => {
    const api=isolatedBert(),urls=[];
    await assert.rejects(api.ensureModel({download:async spec=>{
        urls.push(spec.url);
        if(!spec.url.includes('drive.usercontent'))throw new Error('primary unavailable');
        return new TextEncoder().encode('<html>download confirmation</html>').buffer;
    }}),/dự phòng sai SHA-256/);
    assert.equal(urls.length,2);
    assert.equal(urls[1],api.MIRROR_URL);
    assert.equal((await api.getCacheStatus()).ready,false);
});

test('BERT cancellation never triggers a mirror download', async () => {
    const api=isolatedBert();let requests=0;
    await assert.rejects(api.ensureModel({download:async()=>{
        requests++;throw Object.assign(new Error('cancel'),{name:'AbortError'});
    }}),{name:'AbortError'});
    assert.equal(requests,1);
});
