// translateZhToVi.js
// Tampermonkey-friendly library. Exposes global window.TranslateZhToVi
// Usage: await TranslateZhToVi.init({ nameUrl, vpUrl, hvUrl, forceReload:false });
// then TranslateZhToVi.translateText("...", opts), TranslateZhToVi.suggestName("...")

(function(global){
  const DB_NAME = 'TranslateZhToVi_DB_v1';
  const CACHE_KEY = 'dict_cache';
  const DEFAULT_OPTS = {
    priorityNameFirst: true,
    preferLongVP: true,
    riêngChung: true, // uses .tag === 'riêng' if present
    maxSuggest: 200,
    forceReload: false
  };

  // ----------------- tiny IndexedDB wrapper -----------------
  function idbOpen(){
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = e => {
        const db = e.target.result;
        if(!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      };
      r.onsuccess = e => res(e.target.result);
      r.onerror = e => rej(e.target.error);
    });
  }
  async function idbGet(key){
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction('kv','readonly');
      const req = tx.objectStore('kv').get(key);
      req.onsuccess = () => { db.close(); res(req.result); };
      req.onerror = () => { db.close(); rej(req.error); };
    });
  }
  async function idbPut(key, val){
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction('kv','readwrite');
      tx.objectStore('kv').put(val, key);
      tx.oncomplete = () => { db.close(); res(); };
      tx.onerror = () => { db.close(); rej(tx.error); };
    });
  }
  async function idbDel(key){
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction('kv','readwrite');
      tx.objectStore('kv').delete(key);
      tx.oncomplete = () => { db.close(); res(); };
      tx.onerror = () => { db.close(); rej(tx.error); };
    });
  }

  // ----------------- helpers -----------------
  function isCJK(ch){
    return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(ch);
  }
  function splitRuns(s){
    const runs = [];
    let buf = '', mode = null;
    for(const ch of s){
      const now = isCJK(ch) ? 'CJK' : 'OTHER';
      if(mode === null){ buf = ch; mode = now; continue; }
      if(now === mode) buf += ch;
      else { runs.push({mode, text: buf}); buf = ch; mode = now; }
    }
    if(buf) runs.push({mode, text: buf});
    return runs;
  }

  // ----------------- build index (from dict object) -----------------
  function buildBucketsFromDict(dictObj){
    // dictObj { zh: {val, alts, [tag]} }
    const buckets = Object.create(null);
    let maxLen = 0;
    for(const k of Object.keys(dictObj)){
      const len = k.length;
      if(len === 0) continue;
      if(!buckets[len]) buckets[len] = Object.create(null);
      buckets[len][k] = dictObj[k]; // store whole object
      if(len > maxLen) maxLen = len;
    }
    return { buckets, maxLen };
  }

  // ----------------- fetch util (GM-friendly) -----------------
  function fetchText(url){
    // prefer GM_xmlHttpRequest if available (Tampermonkey)
    return new Promise((res, rej) => {
      if(typeof GM_xmlHttpRequest === 'function'){
        GM_xmlHttpRequest({
          method: 'GET',
          url,
          responseType: 'text',
          onload(resp){
            if(resp.status >= 200 && resp.status < 300) res(resp.responseText);
            else rej(new Error('HTTP '+resp.status));
          },
          onerror(err){ rej(err); }
        });
      } else {
        fetch(url).then(r => {
          if(!r.ok) throw new Error('HTTP '+r.status);
          return r.text();
        }).then(res).catch(rej);
      }
    });
  }

  // ----------------- core matching algorithm -----------------
  function translateCJKRun(run, nameIdx, vpIdx, opts){
    const order = opts.priorityNameFirst ? ['name','vp'] : ['vp','name'];
    const out = [];
    let i = 0, L = run.length, globalMax = Math.max(nameIdx.maxLen||0, vpIdx.maxLen||0);
    while(i < L){
      let matched = false;
      let maxTry = Math.min(globalMax, L - i);
      for(let l = maxTry; l >= 1; --l){
        const sub = run.substr(i, l);
        const hits = { name: (nameIdx.buckets[l] && nameIdx.buckets[l][sub]) || null,
                       vp:   (vpIdx.buckets[l] && vpIdx.buckets[l][sub]) || null };
        if(hits.name || hits.vp){
          // riêng>chung handling if tags exist
          if(opts.riêngChung){
            if(hits.name && hits.name.tag === 'riêng' && (!hits.vp || hits.vp.tag !== 'riêng')){
              out.push({ zh: sub, val: hits.name.val, alts: hits.name.alts, source: 'Name' });
              i += l; matched = true; break;
            }
            if(hits.vp && hits.vp.tag === 'riêng' && (!hits.name || hits.name.tag !== 'riêng')){
              out.push({ zh: sub, val: hits.vp.val, alts: hits.vp.alts, source: 'VP' });
              i += l; matched = true; break;
            }
          }
          // both exist
          if(hits.name && hits.vp){
            if(opts.preferLongVP){
              out.push({ zh: sub, val: hits.vp.val, alts: hits.vp.alts, source: 'VP' });
            } else {
              out.push({ zh: sub, val: hits.name.val, alts: hits.name.alts, source: 'Name' });
            }
            i += l; matched = true; break;
          } else if(hits.name){
            out.push({ zh: sub, val: hits.name.val, alts: hits.name.alts, source: 'Name' });
            i += l; matched = true; break;
          } else {
            out.push({ zh: sub, val: hits.vp.val, alts: hits.vp.alts, source: 'VP' });
            i += l; matched = true; break;
          }
        }
      }
      if(!matched){
        // fallback 1 char -> we'll handle later via HanViet
        out.push({ zh: run[i], val: null, alts: null, source: null });
        i += 1;
      }
    }
    return out;
  }

  function hanVietFallbackForItems(items, hvDict){
    // items: array of {zh,val,...}, convert nulls using hvDict per char
    const out = [];
    for(const it of items){
      if(it.val !== null){
        out.push(it);
      } else {
        // it.zh might be a single char, or multiple if fallback chunked; we'll map char by char
        let built = [];
        for(const ch of it.zh){
          const hv = hvDict[ch];
          if(hv) built.push(hv.val);
          else built.push(ch);
        }
        out.push({ zh: it.zh, val: built.join(' '), alts: [built.join(' ')], source: 'HanViet' });
      }
    }
    return out;
  }

  // ----------------- main object -----------------
  const TranslateZhToVi = {
    isReady: false,
    _raw: { nameRaw:null, vpRaw:null, hvRaw:null },
    _idx: { nameIdx: {buckets:{},maxLen:0}, vpIdx: {buckets:{},maxLen:0}, hvDict: {} },
    async init(opts = {}){
      this.opts = Object.assign({}, DEFAULT_OPTS, opts || {});
      const nameUrl = opts.nameUrl || 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/translate/zh_to_vi/Name.json';
      const vpUrl   = opts.vpUrl   || 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/translate/zh_to_vi/VP.json';
      const hvUrl   = opts.hvUrl   || 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/translate/zh_to_vi/HanViet.json';

      // Try cache
      let cache = null;
      try { cache = await idbGet(CACHE_KEY); } catch(e){ console.warn('idb read err', e); }
      if(cache && !this.opts.forceReload){
        try {
          // restore
          this._raw = cache.raw;
          this._idx = cache.idx;
          this.isReady = true;
          console.log('[TranslateZhToVi] loaded from cache');
          return;
        } catch(e){
          console.warn('cache restore fail', e);
        }
      }

      // fetch raw JSON (text -> parse)
      const [nameText, vpText, hvText] = await Promise.all([
        fetchText(nameUrl),
        fetchText(vpUrl),
        fetchText(hvUrl)
      ]);
      // parse
      let nameObj = JSON.parse(nameText);
      let vpObj   = JSON.parse(vpText);
      let hvObj   = JSON.parse(hvText);

      // ensure normalized structure: {val, alts}
      function norm(obj){
        const out = Object.create(null);
        for(const k of Object.keys(obj)){
          const v = obj[k];
          if(v == null) continue;
          if(typeof v === 'string'){
            const parts = v.split('/').map(x => x.trim()).filter(Boolean);
            out[k] = { val: parts[0]||v, alts: parts.length?parts:[v] };
          } else if(typeof v === 'object' && v.val){
            out[k] = { val: String(v.val), alts: Array.isArray(v.alts)?v.alts:(v.val? [String(v.val)]:[]) };
            if(v.tag) out[k].tag = v.tag;
          } else {
            out[k] = { val: String(v), alts: [String(v)] };
          }
        }
        return out;
      }
      nameObj = norm(nameObj);
      vpObj   = norm(vpObj);
      // hvObj expected {char: "việt"} or normalized as above
      const hvNormalized = Object.create(null);
      for(const k of Object.keys(hvObj)){
        const v = hvObj[k];
        if(typeof v === 'string'){
          const parts = v.split('/').map(x=>x.trim()).filter(Boolean);
          hvNormalized[k] = { val: parts[0], alts: parts };
        } else if(typeof v === 'object' && v.val){
          hvNormalized[k] = { val: String(v.val), alts: Array.isArray(v.alts)?v.alts:[String(v.val)] };
        } else {
          hvNormalized[k] = { val: String(v), alts: [String(v)] };
        }
      }

      // build buckets
      const nameIdx = buildBucketsFromDict(nameObj);
      const vpIdx   = buildBucketsFromDict(vpObj);

      // store
      this._raw = { nameRaw: nameObj, vpRaw: vpObj, hvRaw: hvNormalized };
      this._idx = { nameIdx, vpIdx, hvDict: hvNormalized };
      this.isReady = true;

      // cache to idb (be mindful of size)
      try {
        await idbPut(CACHE_KEY, { raw: this._raw, idx: this._idx, savedAt: Date.now() });
      } catch(e){
        console.warn('cache write fail', e);
      }
      console.log('[TranslateZhToVi] loaded from remote and indexed');
    },

    clearCache: async function(){
      try { await idbDel(CACHE_KEY); console.log('[TranslateZhToVi] cache cleared'); } catch(e){ console.warn(e); }
      this.isReady = false;
    },

    // translate a whole text -> returns string
    translateText: function(text, opts){
      if(!this.isReady) throw new Error('TranslateZhToVi not init()');
      opts = Object.assign({}, this.opts, opts||{});
      const runs = splitRuns(text);
      const pieces = [];
      for(const r of runs){
        if(r.mode === 'CJK'){
          const items = translateCJKRun(r.text, this._idx.nameIdx, this._idx.vpIdx, opts);
          const filled = hanVietFallbackForItems(items, this._idx.hvDict);
          for(const it of filled) pieces.push(it.val);
        } else {
          pieces.push(r.text);
        }
      }
      return pieces.join('');
    },

    // returns array of {zh, val, alts, source} for each matched segment (no joining)
    translateSegments: function(text, opts){
      if(!this.isReady) throw new Error('TranslateZhToVi not init()');
      opts = Object.assign({}, this.opts, opts||{});
      const runs = splitRuns(text);
      const out = [];
      for(const r of runs){
        if(r.mode === 'CJK'){
          const items = translateCJKRun(r.text, this._idx.nameIdx, this._idx.vpIdx, opts);
          const filled = hanVietFallbackForItems(items, this._idx.hvDict);
          out.push(...filled.map(it => ({ zh: it.zh, val: it.val, alts: it.alts, source: it.source })));
        } else {
          out.push({ zh: r.text, val: r.text, alts: [r.text], source: 'TEXT' });
        }
      }
      return out;
    },

    // suggest names: return matches from Name & VP (exact first, then substring matches)
    suggestName: function(term, limit){
      if(!this.isReady) throw new Error('TranslateZhToVi not init()');
      limit = limit || this.opts.maxSuggest;
      const res = [];
      const nameRaw = this._raw.nameRaw || {};
      const vpRaw = this._raw.vpRaw || {};

      // exact
      if(nameRaw[term]) res.push({ source: 'Name', zh: term, val: nameRaw[term].val, alts: nameRaw[term].alts });
      if(vpRaw[term])   res.push({ source: 'VP',   zh: term, val: vpRaw[term].val,   alts: vpRaw[term].alts });

      if(res.length > 0) return res;

      // substring-search (keys that contain term OR term contains key)
      function scan(obj, label){
        let out = [];
        const keys = Object.keys(obj);
        for(const k of keys){
          if(out.length >= limit) break;
          if(k.includes(term) || term.includes(k)){
            out.push({ source: label, zh: k, val: obj[k].val, alts: obj[k].alts });
          }
        }
        return out;
      }
      const r1 = scan(nameRaw, 'Name');
      const r2 = scan(vpRaw, 'VP');
      const merged = r1.concat(r2).slice(0, limit);
      if(merged.length) return merged;

      // fallback: translate the term and return single item
      const t = this.translateText(term, { priorityNameFirst: this.opts.priorityNameFirst });
      return [{ source: 'Fallback', zh: term, val: t, alts: [t] }];
    },

    // small helper to add/update a dict entry in memory (not persisted)
    addEntry: function(dictName, zh, val, alts, tag){
      if(!this.isReady) throw new Error('TranslateZhToVi not init()');
      const targetRaw = dictName === 'name' ? this._raw.nameRaw : this._raw.vpRaw;
      if(!targetRaw) throw new Error('invalid dictName');
      targetRaw[zh] = { val, alts: alts || [val], tag };
      // rebuild indexes (simple way: rebuild full index - ok for manual edits)
      const newIdx = buildBucketsFromDict(targetRaw);
      if(dictName === 'name') this._idx.nameIdx = newIdx;
      else this._idx.vpIdx = newIdx;
      // update cache (async)
      idbPut(CACHE_KEY, { raw: this._raw, idx: this._idx, savedAt: Date.now() }).catch(()=>{});
    },

    // expose internals for debugging (read-only)
    _debug: function(){ return { raw: this._raw, idx: this._idx, opts: this.opts }; }
  };

  // attach global
  global.TranslateZhToVi = TranslateZhToVi;

})(window);
