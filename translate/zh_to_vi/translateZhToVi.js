// translateZhToVi.js
// Tampermonkey-friendly library. Attach: window.TranslateZhToVi
// Usage:
//   await TranslateZhToVi.init({ nameUrl, vpUrl, hvUrl, forceReload:false });
//   const out = TranslateZhToVi.translateText(text, { maxMatchLen: 30, priorityNameFirst:true });
//   const segs = TranslateZhToVi.translateSegments(text);

(function (global) {
  const DB_NAME = 'TranslateZhToVi_DB_v1';
  const CACHE_KEY = 'dict_cache_v1';
  const DEFAULT_OPTS = {
    priorityNameFirst: true,
    preferLongVP: true,
    riêngChung: true,
    maxSuggest: 200,
    forceReload: false,
    maxMatchLen: null // null -> use dict max
  };

  // tiny IndexedDB wrapper
  function idbOpen() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      };
      r.onsuccess = e => res(e.target.result);
      r.onerror = e => rej(e.target.error);
    });
  }
  async function idbGet(key) {
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction('kv', 'readonly');
      const req = tx.objectStore('kv').get(key);
      req.onsuccess = () => { db.close(); res(req.result); };
      req.onerror = () => { db.close(); rej(req.error); };
    });
  }
  async function idbPut(key, val) {
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(val, key);
      tx.oncomplete = () => { db.close(); res(); };
      tx.onerror = () => { db.close(); rej(tx.error); };
    });
  }
  async function idbDel(key) {
    const db = await idbOpen();
    return new Promise((res, rej) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').delete(key);
      tx.oncomplete = () => { db.close(); res(); };
      tx.onerror = () => { db.close(); rej(tx.error); };
    });
  }

  // helpers
  function isCJK(ch) {
    return /[\u3400-\u4DBF\u4E00-\u9FFF\uf900-\ufaff]/.test(ch);
  }
  function splitRuns(s) {
    const runs = [];
    let buf = '', mode = null;
    for (const ch of s) {
      const now = isCJK(ch) ? 'CJK' : 'OTHER';
      if (mode === null) { buf = ch; mode = now; continue; }
      if (now === mode) buf += ch;
      else { runs.push({ mode, text: buf }); buf = ch; mode = now; }
    }
    if (buf) runs.push({ mode, text: buf });
    return runs;
  }

  // fetch util (GM friendly)
  function fetchText(url) {
    return new Promise((res, rej) => {
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method: 'GET', url, responseType: 'text',
          onload(resp) {
            if (resp.status >= 200 && resp.status < 300) res(resp.responseText);
            else rej(new Error('HTTP ' + resp.status));
          },
          onerror(e) { rej(e); }
        });
      } else {
        fetch(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }).then(res).catch(rej);
      }
    });
  }

  // build length buckets
  function buildBucketsFromDict(dictObj) {
    const buckets = Object.create(null);
    let maxLen = 0;
    for (const k of Object.keys(dictObj)) {
      const len = k.length;
      if (len === 0) continue;
      if (!buckets[len]) buckets[len] = Object.create(null);
      buckets[len][k] = dictObj[k];
      if (len > maxLen) maxLen = len;
    }
    return { buckets, maxLen };
  }

  // normalize input objects into { val, alts, tag?, skip? }
  function normalizeDictAny(raw) {
    const out = Object.create(null);
    for (const k of Object.keys(raw)) {
      if (!k) continue;
      const v = raw[k];
      if (v == null) continue;
      if (typeof v === 'string') {
        // split by '/' into alts; if first part empty => skip marker
        const parts = v.split('/').map(x => x.trim());
        const alts = parts.filter(x => x !== undefined && x !== null);
        // treat explicit empty first meaning "" as SKIP
        const first = (parts.length > 0 ? parts[0] : '');
        if (first === '') {
          out[k] = { val: '', alts: alts.length ? alts : [''], skip: true };
        } else {
          out[k] = { val: first, alts: alts.length ? alts : [first] };
        }
      } else if (typeof v === 'object' && v.val !== undefined) {
        const val = String(v.val || '').trim();
        const alts = Array.isArray(v.alts) ? v.alts.map(x => String(x).trim()).filter(Boolean) : (val ? [val] : []);
        const entry = { val: val, alts: alts.length ? alts : [val] };
        if (v.tag) entry.tag = v.tag;
        if (val === '') entry.skip = true;
        out[k] = entry;
      } else {
        const s = String(v).trim();
        out[k] = { val: s, alts: [s] };
      }
    }
    return out;
  }

  // Global-longest-first matching per CJK-run
  function globalLongestMatch(text, nameIdx, vpIdx, hvDict, opts, overrideMax) {
    const N = text.length;
    const maxFromDict = Math.max(nameIdx.maxLen || 0, vpIdx.maxLen || 0);
    const maxLen = overrideMax && Number.isInteger(overrideMax) ? Math.min(overrideMax, maxFromDict) : maxFromDict;
    // arrays
    const replaced = new Array(N).fill(false);
    const slots = new Array(N).fill(null); // slots[i] = {zh, val, alts, source, len}
    // iterate lengths from maxLen -> 1
    for (let l = maxLen; l >= 1; --l) {
      const nameBucket = nameIdx.buckets[l] || {};
      const vpBucket = vpIdx.buckets[l] || {};
      for (let i = 0; i + l <= N; ++i) {
        if (replaced.slice(i, i + l).some(x => x)) continue; // overlap
        const sub = text.substr(i, l);
        let hitName = nameBucket[sub] || null;
        let hitVp = vpBucket[sub] || null;
        if (!hitName && !hitVp) continue;
        // handle skip (if any has skip true and others not)
        if (opts.riêngChung) {
          if (hitName && hitName.skip && (!hitVp || !hitVp.skip)) {
            // SKIP: nghĩa là KHÔNG dịch → trả về rỗng (loại bỏ)
            slots[i] = { zh: sub, val: "", alts: hitName.alts || [], source: 'SKIP', len: l };
            for (let k = 0; k < l; k++) replaced[i + k] = true;
            continue;
          }
          if (hitVp && hitVp.skip && (!hitName || !hitName.skip)) {
            slots[i] = { zh: sub, val: "", alts: hitVp.alts || [], source: 'SKIP', len: l };
            for (let k = 0; k < l; k++) replaced[i + k] = true;
            continue;
          }
        }
        // both exist or one exists
        if (hitName && hitVp) {
          const chooseVp = opts.preferLongVP;
          if (chooseVp) {
            slots[i] = { zh: sub, val: hitVp.val, alts: hitVp.alts, source: 'VP', len: l };
          } else {
            slots[i] = { zh: sub, val: hitName.val, alts: hitName.alts, source: 'Name', len: l };
          }
          for (let k = 0; k < l; k++) replaced[i + k] = true;
        } else if (hitName) {
          if (hitName.skip) {
            slots[i] = { zh: sub, val: "", alts: hitName.alts || [], source: 'SKIP', len: l };
          } else {
            slots[i] = { zh: sub, val: hitName.val, alts: hitName.alts, source: 'Name', len: l };
          }
          for (let k = 0; k < l; k++) replaced[i + k] = true;
        } else {
          if (hitVp.skip) {
            slots[i] = { zh: sub, val: "", alts: hitVp.alts || [], source: 'SKIP', len: l };
          } else {
            slots[i] = { zh: sub, val: hitVp.val, alts: hitVp.alts, source: 'VP', len: l };
          }
          for (let k = 0; k < l; k++) replaced[i + k] = true;
        }
      }
    }
    // build output items by walking i
    const items = [];
    for (let i = 0; i < N;) {
      if (slots[i]) {
        const it = slots[i];
        items.push({ zh: it.zh, val: it.val, alts: it.alts, source: it.source });
        i += it.len;
      } else {
        // single char fallback (handle later by hanviet)
        const ch = text[i];
        items.push({ zh: ch, val: null, alts: null, source: null });
        i += 1;
      }
    }
    // now fill nulls with hanviet fallback
    const filled = [];
    for (const it of items) {
      if (it.val !== null) {
        filled.push(it);
      } else {
        // it.zh is single char usually
        let built = [];
        for (const ch of it.zh) {
          const hv = hvDict[ch];
          if (hv) built.push(hv.val);
          else built.push(ch);
        }
        filled.push({ zh: it.zh, val: built.join(' '), alts: [built.join(' ')], source: 'HanViet' });
      }
    }
    return filled;
  }

  // join tokens with spacing/punct/capitalization rules
  function joinTokensMakePretty(tokens) {
    // tokens: array of {zh, val, alts, source} (val already string)
    // we'll join with single spaces, then tidy spaces around punctuation, then capitalize sentence starts and after quotes
    let parts = tokens.map(t => (t.val === null || t.val === undefined) ? t.zh : t.val);
    let s = parts.join(' ');
    // remove spaces before punctuation (both western and CJK punctuation)
    s = s.replace(/\s+([,.:;!?%»”\)\]\}，。、《》？！，；：])/g, '$1');
    // ensure space after punctuation if letter follows (except when punctuation is CJK and next is CJK)
    s = s.replace(/([\.!?。！？])(["»”']?)([^\s"'\)\]\}])/g, (m, p, quote, after) => `${p}${quote} ${after}`);
    // remove space before closing quotes if any
    s = s.replace(/\s+(["»”'])/g, '$1');
    // collapse multiple spaces
    s = s.replace(/\s{2,}/g, ' ');
    // trim
    s = s.trim();
    // capitalize first letter of text and first letter after sentence end or after double quote "
    s = s.replace(/(^|[\.!\?。！？]["”']?\s+)(\p{L})/gu, (m, lead, ch) => lead + ch.toUpperCase());
    // also capitalize after opening quote " (if pattern: "a -> "A)
    s = s.replace(/(["“”']\s*)(\p{L})/gu, (m, q, ch) => q + ch.toUpperCase());
    return s;
  }

  const TranslateZhToVi = {
    isReady: false,
    _raw: { nameRaw: null, vpRaw: null, hvRaw: null },
    _idx: { nameIdx: { buckets: {}, maxLen: 0 }, vpIdx: { buckets: {}, maxLen: 0 }, hvDict: {} },
    opts: Object.assign({}, DEFAULT_OPTS),

    async init(opts = {}) {
      this.opts = Object.assign({}, this.opts, opts || {});
      const nameUrl = opts.nameUrl || 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/translate/zh_to_vi/Name.json';
      const vpUrl = opts.vpUrl || 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/translate/zh_to_vi/VP.json';
      const hvUrl = opts.hvUrl || 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/translate/zh_to_vi/HanViet.json';

      let cache = null;
      try { cache = await idbGet(CACHE_KEY); } catch (e) { console.warn('idb read err', e); }
      if (cache && !this.opts.forceReload) {
        try {
          this._raw = cache.raw;
          this._idx = cache.idx;
          this.isReady = true;
          console.log('[TranslateZhToVi] loaded from cache');
          return;
        } catch (e) {
          console.warn('cache restore fail', e);
        }
      }

      const [nameText, vpText, hvText] = await Promise.all([
        fetchText(nameUrl),
        fetchText(vpUrl),
        fetchText(hvUrl)
      ]);
      let nameObj = JSON.parse(nameText);
      let vpObj = JSON.parse(vpText);
      let hvObj = JSON.parse(hvText);

      nameObj = normalizeDictAny(nameObj);
      vpObj = normalizeDictAny(vpObj);
      const hvNorm = normalizeDictAny(hvObj);

      const nameIdx = buildBucketsFromDict(nameObj);
      const vpIdx = buildBucketsFromDict(vpObj);

      this._raw = { nameRaw: nameObj, vpRaw: vpObj, hvRaw: hvNorm };
      this._idx = { nameIdx, vpIdx, hvDict: hvNorm };
      this.isReady = true;

      try { await idbPut(CACHE_KEY, { raw: this._raw, idx: this._idx, savedAt: Date.now() }); } catch (e) { console.warn('cache write fail', e); }
      console.log('[TranslateZhToVi] loaded and indexed');
    },

    clearCache: async function () {
      await idbDel(CACHE_KEY).catch(() => { });
      this.isReady = false;
      console.log('[TranslateZhToVi] cache cleared');
    },

    // translate whole text and return a pretty string
    translateText: function (text, opts) {
      if (!this.isReady) throw new Error('TranslateZhToVi not init()');
      opts = Object.assign({}, this.opts, opts || {});
      const runs = splitRuns(text);
      const tokens = [];
      for (const r of runs) {
        if (r.mode === 'CJK') {
          const maxMatch = opts.maxMatchLen || Math.max(this._idx.nameIdx.maxLen || 0, this._idx.vpIdx.maxLen || 0);
          const items = globalLongestMatch(r.text, this._idx.nameIdx, this._idx.vpIdx, this._idx.hvDict, opts, maxMatch);
          tokens.push(...items);
        } else {
          tokens.push({ zh: r.text, val: r.text, alts: [r.text], source: 'TEXT' });
        }
      }
      const out = joinTokensMakePretty(tokens);
      return out;
    },

    // return array of segments {zh, val, alts, source} (no pretty join)
    translateSegments: function (text, opts) {
      if (!this.isReady) throw new Error('TranslateZhToVi not init()');
      opts = Object.assign({}, this.opts, opts || {});
      const runs = splitRuns(text);
      const out = [];
      for (const r of runs) {
        if (r.mode === 'CJK') {
          const maxMatch = opts.maxMatchLen || Math.max(this._idx.nameIdx.maxLen || 0, this._idx.vpIdx.maxLen || 0);
          const items = globalLongestMatch(r.text, this._idx.nameIdx, this._idx.vpIdx, this._idx.hvDict, opts, maxMatch);
          out.push(...items);
        } else {
          out.push({ zh: r.text, val: r.text, alts: [r.text], source: 'TEXT' });
        }
      }
      return out;
    },

    // suggest name: exact matches first; else substring matches; else fallback translate
    suggestName: function (term, limit) {
      if (!this.isReady) throw new Error('TranslateZhToVi not init()');
      limit = limit || this.opts.maxSuggest;
      const res = [];
      const nameRaw = this._raw.nameRaw || {};
      const vpRaw = this._raw.vpRaw || {};
      if (nameRaw[term]) res.push({ source: 'Name', zh: term, val: nameRaw[term].val, alts: nameRaw[term].alts });
      if (vpRaw[term]) res.push({ source: 'VP', zh: term, val: vpRaw[term].val, alts: vpRaw[term].alts });
      if (res.length) return res;
      // substring
      function scan(obj, label) {
        const out = [];
        for (const k of Object.keys(obj)) {
          if (out.length >= limit) break;
          if (k.includes(term) || term.includes(k)) out.push({ source: label, zh: k, val: obj[k].val, alts: obj[k].alts });
        }
        return out;
      }
      const r1 = scan(nameRaw, 'Name');
      const r2 = scan(vpRaw, 'VP');
      const merged = r1.concat(r2).slice(0, limit);
      if (merged.length) return merged;
      // fallback single result
      const t = this.translateText(term, { priorityNameFirst: this.opts.priorityNameFirst });
      return [{ source: 'Fallback', zh: term, val: t, alts: [t] }];
    },

    // in-memory add/update (and persist cache)
    addEntry: function (dictName, zh, val, alts, tag) {
      if (!this.isReady) throw new Error('TranslateZhToVi not init()');
      const target = dictName === 'name' ? this._raw.nameRaw : this._raw.vpRaw;
      if (!target) throw new Error('invalid dictName');
      const entry = { val: val || '', alts: alts && alts.length ? alts : (val ? [val] : []) };
      if (tag) entry.tag = tag;
      if (entry.val === '') entry.skip = true;
      target[zh] = entry;
      // rebuild index
      const newIdx = buildBucketsFromDict(target);
      if (dictName === 'name') this._idx.nameIdx = newIdx;
      else this._idx.vpIdx = newIdx;
      idbPut(CACHE_KEY, { raw: this._raw, idx: this._idx, savedAt: Date.now() }).catch(() => { });
    },

    _debug: function () { return { raw: this._raw, idx: this._idx, opts: this.opts }; }
  };

  global.TranslateZhToVi = TranslateZhToVi;
})(window);
