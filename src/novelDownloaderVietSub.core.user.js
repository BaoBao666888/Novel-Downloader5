/* eslint-env browser */
// ==UserScript==
// @name        novelDownloaderVietSub
// @description Menu Download Novel hoặc nhấp đúp vào cạnh trái của trang để hiển thị bảng điều khiển
// @version     3.5.448.10
// @author      dodying | BaoBao
// @namespace   https://github.com/BaoBao666888/Novel-Downloader5
// @supportURL  https://github.com/BaoBao666888/Novel-Downloader5/issues
// @icon        https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Logo.png
// @downloadURL https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/novelDownloaderVietSub.user.js
// @updateURL   https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/novelDownloaderVietSub.user.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.0/jquery.js

// @require     https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/download-vietnamese.js?v=1.3.2
// @require     https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/nd-console-panel.js?v=1.0.3
// @require     https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/nd-download-manager.js?v=1.0.8
// @require     https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/nd-file-save.js?v=1.0.0
// @require     https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/tools/nd-rule-editor/nd-rule-editor.js?v=1.0.1

// @require     https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/chs2cht.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jszip/3.0.0/jszip.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js
// @require     https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js

// @resource fontLib https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/SourceHanSansCN-Regular-Often.json


// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_getResourceText
// @grant       GM_addValueChangeListener
// @grant       GM_openInTab
// @run-at      document-end
// @connect     *
// @include     *
// @noframes
// @connect     127.0.0.1
// @connect     localhost
// ==/UserScript==

// ============================================================================
// Bundled CryptoJS & Source-Specific DES Helpers
// ============================================================================

!function (t, e) { "object" == typeof exports ? module.exports = exports = e() : "function" == typeof define && define.amd ? define([], e) : t.CryptoJS = e() }(this, function () { var h, t, e, r, i, n, f, o, s, c, a, l, d, m, x, b, H, z, A, u, p, _, v, y, g, B, w, k, S, C, D, E, R, M, F, P, W, O, I, U, K, X, L, j, N, T, q, Z, V, G, J, $, Q, Y, tt, et, rt, it, nt, ot, st, ct, at, ht, lt, ft, dt, ut, pt, _t, vt, yt, gt, Bt, wt, kt, St, bt = bt || function (l) { var t; if ("undefined" != typeof window && window.crypto && (t = window.crypto), !t && "undefined" != typeof window && window.msCrypto && (t = window.msCrypto), !t && "undefined" != typeof global && global.crypto && (t = global.crypto), !t && "function" == typeof require) try { t = require("crypto") } catch (t) { } function i() { if (t) { if ("function" == typeof t.getRandomValues) try { return t.getRandomValues(new Uint32Array(1))[0] } catch (t) { } if ("function" == typeof t.randomBytes) try { return t.randomBytes(4).readInt32LE() } catch (t) { } } throw new Error("Native crypto module could not be used to get secure random number.") } var r = Object.create || function (t) { var e; return n.prototype = t, e = new n, n.prototype = null, e }; function n() { } var e = {}, o = e.lib = {}, s = o.Base = { extend: function (t) { var e = r(this); return t && e.mixIn(t), e.hasOwnProperty("init") && this.init !== e.init || (e.init = function () { e.$super.init.apply(this, arguments) }), (e.init.prototype = e).$super = this, e }, create: function () { var t = this.extend(); return t.init.apply(t, arguments), t }, init: function () { }, mixIn: function (t) { for (var e in t) t.hasOwnProperty(e) && (this[e] = t[e]); t.hasOwnProperty("toString") && (this.toString = t.toString) }, clone: function () { return this.init.prototype.extend(this) } }, f = o.WordArray = s.extend({ init: function (t, e) { t = this.words = t || [], this.sigBytes = null != e ? e : 4 * t.length }, toString: function (t) { return (t || a).stringify(this) }, concat: function (t) { var e = this.words, r = t.words, i = this.sigBytes, n = t.sigBytes; if (this.clamp(), i % 4) for (var o = 0; o < n; o++) { var s = r[o >>> 2] >>> 24 - o % 4 * 8 & 255; e[i + o >>> 2] |= s << 24 - (i + o) % 4 * 8 } else for (o = 0; o < n; o += 4)e[i + o >>> 2] = r[o >>> 2]; return this.sigBytes += n, this }, clamp: function () { var t = this.words, e = this.sigBytes; t[e >>> 2] &= 4294967295 << 32 - e % 4 * 8, t.length = l.ceil(e / 4) }, clone: function () { var t = s.clone.call(this); return t.words = this.words.slice(0), t }, random: function (t) { for (var e = [], r = 0; r < t; r += 4)e.push(i()); return new f.init(e, t) } }), c = e.enc = {}, a = c.Hex = { stringify: function (t) { for (var e = t.words, r = t.sigBytes, i = [], n = 0; n < r; n++) { var o = e[n >>> 2] >>> 24 - n % 4 * 8 & 255; i.push((o >>> 4).toString(16)), i.push((15 & o).toString(16)) } return i.join("") }, parse: function (t) { for (var e = t.length, r = [], i = 0; i < e; i += 2)r[i >>> 3] |= parseInt(t.substr(i, 2), 16) << 24 - i % 8 * 4; return new f.init(r, e / 2) } }, h = c.Latin1 = { stringify: function (t) { for (var e = t.words, r = t.sigBytes, i = [], n = 0; n < r; n++) { var o = e[n >>> 2] >>> 24 - n % 4 * 8 & 255; i.push(String.fromCharCode(o)) } return i.join("") }, parse: function (t) { for (var e = t.length, r = [], i = 0; i < e; i++)r[i >>> 2] |= (255 & t.charCodeAt(i)) << 24 - i % 4 * 8; return new f.init(r, e) } }, d = c.Utf8 = { stringify: function (t) { try { return decodeURIComponent(escape(h.stringify(t))) } catch (t) { throw new Error("Malformed UTF-8 data") } }, parse: function (t) { return h.parse(unescape(encodeURIComponent(t))) } }, u = o.BufferedBlockAlgorithm = s.extend({ reset: function () { this._data = new f.init, this._nDataBytes = 0 }, _append: function (t) { "string" == typeof t && (t = d.parse(t)), this._data.concat(t), this._nDataBytes += t.sigBytes }, _process: function (t) { var e, r = this._data, i = r.words, n = r.sigBytes, o = this.blockSize, s = n / (4 * o), c = (s = t ? l.ceil(s) : l.max((0 | s) - this._minBufferSize, 0)) * o, a = l.min(4 * c, n); if (c) { for (var h = 0; h < c; h += o)this._doProcessBlock(i, h); e = i.splice(0, c), r.sigBytes -= a } return new f.init(e, a) }, clone: function () { var t = s.clone.call(this); return t._data = this._data.clone(), t }, _minBufferSize: 0 }), p = (o.Hasher = u.extend({ cfg: s.extend(), init: function (t) { this.cfg = this.cfg.extend(t), this.reset() }, reset: function () { u.reset.call(this), this._doReset() }, update: function (t) { return this._append(t), this._process(), this }, finalize: function (t) { return t && this._append(t), this._doFinalize() }, blockSize: 16, _createHelper: function (r) { return function (t, e) { return new r.init(e).finalize(t) } }, _createHmacHelper: function (r) { return function (t, e) { return new p.HMAC.init(r, e).finalize(t) } } }), e.algo = {}); return e }(Math); function mt(t, e, r) { return t ^ e ^ r } function xt(t, e, r) { return t & e | ~t & r } function Ht(t, e, r) { return (t | ~e) ^ r } function zt(t, e, r) { return t & r | e & ~r } function At(t, e, r) { return t ^ (e | ~r) } function Ct(t, e) { return t << e | t >>> 32 - e } function Dt(t, e, r, i) { var n, o = this._iv; o ? (n = o.slice(0), this._iv = void 0) : n = this._prevBlock, i.encryptBlock(n, 0); for (var s = 0; s < r; s++)t[e + s] ^= n[s] } function Et(t) { if (255 == (t >> 24 & 255)) { var e = t >> 16 & 255, r = t >> 8 & 255, i = 255 & t; 255 === e ? (e = 0, 255 === r ? (r = 0, 255 === i ? i = 0 : ++i) : ++r) : ++e, t = 0, t += e << 16, t += r << 8, t += i } else t += 1 << 24; return t } function Rt() { for (var t = this._X, e = this._C, r = 0; r < 8; r++)ft[r] = e[r]; e[0] = e[0] + 1295307597 + this._b | 0, e[1] = e[1] + 3545052371 + (e[0] >>> 0 < ft[0] >>> 0 ? 1 : 0) | 0, e[2] = e[2] + 886263092 + (e[1] >>> 0 < ft[1] >>> 0 ? 1 : 0) | 0, e[3] = e[3] + 1295307597 + (e[2] >>> 0 < ft[2] >>> 0 ? 1 : 0) | 0, e[4] = e[4] + 3545052371 + (e[3] >>> 0 < ft[3] >>> 0 ? 1 : 0) | 0, e[5] = e[5] + 886263092 + (e[4] >>> 0 < ft[4] >>> 0 ? 1 : 0) | 0, e[6] = e[6] + 1295307597 + (e[5] >>> 0 < ft[5] >>> 0 ? 1 : 0) | 0, e[7] = e[7] + 3545052371 + (e[6] >>> 0 < ft[6] >>> 0 ? 1 : 0) | 0, this._b = e[7] >>> 0 < ft[7] >>> 0 ? 1 : 0; for (r = 0; r < 8; r++) { var i = t[r] + e[r], n = 65535 & i, o = i >>> 16, s = ((n * n >>> 17) + n * o >>> 15) + o * o, c = ((4294901760 & i) * i | 0) + ((65535 & i) * i | 0); dt[r] = s ^ c } t[0] = dt[0] + (dt[7] << 16 | dt[7] >>> 16) + (dt[6] << 16 | dt[6] >>> 16) | 0, t[1] = dt[1] + (dt[0] << 8 | dt[0] >>> 24) + dt[7] | 0, t[2] = dt[2] + (dt[1] << 16 | dt[1] >>> 16) + (dt[0] << 16 | dt[0] >>> 16) | 0, t[3] = dt[3] + (dt[2] << 8 | dt[2] >>> 24) + dt[1] | 0, t[4] = dt[4] + (dt[3] << 16 | dt[3] >>> 16) + (dt[2] << 16 | dt[2] >>> 16) | 0, t[5] = dt[5] + (dt[4] << 8 | dt[4] >>> 24) + dt[3] | 0, t[6] = dt[6] + (dt[5] << 16 | dt[5] >>> 16) + (dt[4] << 16 | dt[4] >>> 16) | 0, t[7] = dt[7] + (dt[6] << 8 | dt[6] >>> 24) + dt[5] | 0 } function Mt() { for (var t = this._X, e = this._C, r = 0; r < 8; r++)wt[r] = e[r]; e[0] = e[0] + 1295307597 + this._b | 0, e[1] = e[1] + 3545052371 + (e[0] >>> 0 < wt[0] >>> 0 ? 1 : 0) | 0, e[2] = e[2] + 886263092 + (e[1] >>> 0 < wt[1] >>> 0 ? 1 : 0) | 0, e[3] = e[3] + 1295307597 + (e[2] >>> 0 < wt[2] >>> 0 ? 1 : 0) | 0, e[4] = e[4] + 3545052371 + (e[3] >>> 0 < wt[3] >>> 0 ? 1 : 0) | 0, e[5] = e[5] + 886263092 + (e[4] >>> 0 < wt[4] >>> 0 ? 1 : 0) | 0, e[6] = e[6] + 1295307597 + (e[5] >>> 0 < wt[5] >>> 0 ? 1 : 0) | 0, e[7] = e[7] + 3545052371 + (e[6] >>> 0 < wt[6] >>> 0 ? 1 : 0) | 0, this._b = e[7] >>> 0 < wt[7] >>> 0 ? 1 : 0; for (r = 0; r < 8; r++) { var i = t[r] + e[r], n = 65535 & i, o = i >>> 16, s = ((n * n >>> 17) + n * o >>> 15) + o * o, c = ((4294901760 & i) * i | 0) + ((65535 & i) * i | 0); kt[r] = s ^ c } t[0] = kt[0] + (kt[7] << 16 | kt[7] >>> 16) + (kt[6] << 16 | kt[6] >>> 16) | 0, t[1] = kt[1] + (kt[0] << 8 | kt[0] >>> 24) + kt[7] | 0, t[2] = kt[2] + (kt[1] << 16 | kt[1] >>> 16) + (kt[0] << 16 | kt[0] >>> 16) | 0, t[3] = kt[3] + (kt[2] << 8 | kt[2] >>> 24) + kt[1] | 0, t[4] = kt[4] + (kt[3] << 16 | kt[3] >>> 16) + (kt[2] << 16 | kt[2] >>> 16) | 0, t[5] = kt[5] + (kt[4] << 8 | kt[4] >>> 24) + kt[3] | 0, t[6] = kt[6] + (kt[5] << 16 | kt[5] >>> 16) + (kt[4] << 16 | kt[4] >>> 16) | 0, t[7] = kt[7] + (kt[6] << 8 | kt[6] >>> 24) + kt[5] | 0 } return h = bt.lib.WordArray, bt.enc.Base64 = { stringify: function (t) { var e = t.words, r = t.sigBytes, i = this._map; t.clamp(); for (var n = [], o = 0; o < r; o += 3)for (var s = (e[o >>> 2] >>> 24 - o % 4 * 8 & 255) << 16 | (e[o + 1 >>> 2] >>> 24 - (o + 1) % 4 * 8 & 255) << 8 | e[o + 2 >>> 2] >>> 24 - (o + 2) % 4 * 8 & 255, c = 0; c < 4 && o + .75 * c < r; c++)n.push(i.charAt(s >>> 6 * (3 - c) & 63)); var a = i.charAt(64); if (a) for (; n.length % 4;)n.push(a); return n.join("") }, parse: function (t) { var e = t.length, r = this._map, i = this._reverseMap; if (!i) { i = this._reverseMap = []; for (var n = 0; n < r.length; n++)i[r.charCodeAt(n)] = n } var o = r.charAt(64); if (o) { var s = t.indexOf(o); -1 !== s && (e = s) } return function (t, e, r) { for (var i = [], n = 0, o = 0; o < e; o++)if (o % 4) { var s = r[t.charCodeAt(o - 1)] << o % 4 * 2, c = r[t.charCodeAt(o)] >>> 6 - o % 4 * 2, a = s | c; i[n >>> 2] |= a << 24 - n % 4 * 8, n++ } return h.create(i, n) }(t, e, i) }, _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=" }, function (l) { var t = bt, e = t.lib, r = e.WordArray, i = e.Hasher, n = t.algo, H = []; !function () { for (var t = 0; t < 64; t++)H[t] = 4294967296 * l.abs(l.sin(t + 1)) | 0 }(); var o = n.MD5 = i.extend({ _doReset: function () { this._hash = new r.init([1732584193, 4023233417, 2562383102, 271733878]) }, _doProcessBlock: function (t, e) { for (var r = 0; r < 16; r++) { var i = e + r, n = t[i]; t[i] = 16711935 & (n << 8 | n >>> 24) | 4278255360 & (n << 24 | n >>> 8) } var o = this._hash.words, s = t[e + 0], c = t[e + 1], a = t[e + 2], h = t[e + 3], l = t[e + 4], f = t[e + 5], d = t[e + 6], u = t[e + 7], p = t[e + 8], _ = t[e + 9], v = t[e + 10], y = t[e + 11], g = t[e + 12], B = t[e + 13], w = t[e + 14], k = t[e + 15], S = o[0], m = o[1], x = o[2], b = o[3]; S = z(S, m, x, b, s, 7, H[0]), b = z(b, S, m, x, c, 12, H[1]), x = z(x, b, S, m, a, 17, H[2]), m = z(m, x, b, S, h, 22, H[3]), S = z(S, m, x, b, l, 7, H[4]), b = z(b, S, m, x, f, 12, H[5]), x = z(x, b, S, m, d, 17, H[6]), m = z(m, x, b, S, u, 22, H[7]), S = z(S, m, x, b, p, 7, H[8]), b = z(b, S, m, x, _, 12, H[9]), x = z(x, b, S, m, v, 17, H[10]), m = z(m, x, b, S, y, 22, H[11]), S = z(S, m, x, b, g, 7, H[12]), b = z(b, S, m, x, B, 12, H[13]), x = z(x, b, S, m, w, 17, H[14]), S = A(S, m = z(m, x, b, S, k, 22, H[15]), x, b, c, 5, H[16]), b = A(b, S, m, x, d, 9, H[17]), x = A(x, b, S, m, y, 14, H[18]), m = A(m, x, b, S, s, 20, H[19]), S = A(S, m, x, b, f, 5, H[20]), b = A(b, S, m, x, v, 9, H[21]), x = A(x, b, S, m, k, 14, H[22]), m = A(m, x, b, S, l, 20, H[23]), S = A(S, m, x, b, _, 5, H[24]), b = A(b, S, m, x, w, 9, H[25]), x = A(x, b, S, m, h, 14, H[26]), m = A(m, x, b, S, p, 20, H[27]), S = A(S, m, x, b, B, 5, H[28]), b = A(b, S, m, x, a, 9, H[29]), x = A(x, b, S, m, u, 14, H[30]), S = C(S, m = A(m, x, b, S, g, 20, H[31]), x, b, f, 4, H[32]), b = C(b, S, m, x, p, 11, H[33]), x = C(x, b, S, m, y, 16, H[34]), m = C(m, x, b, S, w, 23, H[35]), S = C(S, m, x, b, c, 4, H[36]), b = C(b, S, m, x, l, 11, H[37]), x = C(x, b, S, m, u, 16, H[38]), m = C(m, x, b, S, v, 23, H[39]), S = C(S, m, x, b, B, 4, H[40]), b = C(b, S, m, x, s, 11, H[41]), x = C(x, b, S, m, h, 16, H[42]), m = C(m, x, b, S, d, 23, H[43]), S = C(S, m, x, b, _, 4, H[44]), b = C(b, S, m, x, g, 11, H[45]), x = C(x, b, S, m, k, 16, H[46]), S = D(S, m = C(m, x, b, S, a, 23, H[47]), x, b, s, 6, H[48]), b = D(b, S, m, x, u, 10, H[49]), x = D(x, b, S, m, w, 15, H[50]), m = D(m, x, b, S, f, 21, H[51]), S = D(S, m, x, b, g, 6, H[52]), b = D(b, S, m, x, h, 10, H[53]), x = D(x, b, S, m, v, 15, H[54]), m = D(m, x, b, S, c, 21, H[55]), S = D(S, m, x, b, p, 6, H[56]), b = D(b, S, m, x, k, 10, H[57]), x = D(x, b, S, m, d, 15, H[58]), m = D(m, x, b, S, B, 21, H[59]), S = D(S, m, x, b, l, 6, H[60]), b = D(b, S, m, x, y, 10, H[61]), x = D(x, b, S, m, a, 15, H[62]), m = D(m, x, b, S, _, 21, H[63]), o[0] = o[0] + S | 0, o[1] = o[1] + m | 0, o[2] = o[2] + x | 0, o[3] = o[3] + b | 0 }, _doFinalize: function () { var t = this._data, e = t.words, r = 8 * this._nDataBytes, i = 8 * t.sigBytes; e[i >>> 5] |= 128 << 24 - i % 32; var n = l.floor(r / 4294967296), o = r; e[15 + (64 + i >>> 9 << 4)] = 16711935 & (n << 8 | n >>> 24) | 4278255360 & (n << 24 | n >>> 8), e[14 + (64 + i >>> 9 << 4)] = 16711935 & (o << 8 | o >>> 24) | 4278255360 & (o << 24 | o >>> 8), t.sigBytes = 4 * (e.length + 1), this._process(); for (var s = this._hash, c = s.words, a = 0; a < 4; a++) { var h = c[a]; c[a] = 16711935 & (h << 8 | h >>> 24) | 4278255360 & (h << 24 | h >>> 8) } return s }, clone: function () { var t = i.clone.call(this); return t._hash = this._hash.clone(), t } }); function z(t, e, r, i, n, o, s) { var c = t + (e & r | ~e & i) + n + s; return (c << o | c >>> 32 - o) + e } function A(t, e, r, i, n, o, s) { var c = t + (e & i | r & ~i) + n + s; return (c << o | c >>> 32 - o) + e } function C(t, e, r, i, n, o, s) { var c = t + (e ^ r ^ i) + n + s; return (c << o | c >>> 32 - o) + e } function D(t, e, r, i, n, o, s) { var c = t + (r ^ (e | ~i)) + n + s; return (c << o | c >>> 32 - o) + e } t.MD5 = i._createHelper(o), t.HmacMD5 = i._createHmacHelper(o) }(Math), e = (t = bt).lib, r = e.WordArray, i = e.Hasher, n = t.algo, f = [], o = n.SHA1 = i.extend({ _doReset: function () { this._hash = new r.init([1732584193, 4023233417, 2562383102, 271733878, 3285377520]) }, _doProcessBlock: function (t, e) { for (var r = this._hash.words, i = r[0], n = r[1], o = r[2], s = r[3], c = r[4], a = 0; a < 80; a++) { if (a < 16) f[a] = 0 | t[e + a]; else { var h = f[a - 3] ^ f[a - 8] ^ f[a - 14] ^ f[a - 16]; f[a] = h << 1 | h >>> 31 } var l = (i << 5 | i >>> 27) + c + f[a]; l += a < 20 ? 1518500249 + (n & o | ~n & s) : a < 40 ? 1859775393 + (n ^ o ^ s) : a < 60 ? (n & o | n & s | o & s) - 1894007588 : (n ^ o ^ s) - 899497514, c = s, s = o, o = n << 30 | n >>> 2, n = i, i = l } r[0] = r[0] + i | 0, r[1] = r[1] + n | 0, r[2] = r[2] + o | 0, r[3] = r[3] + s | 0, r[4] = r[4] + c | 0 }, _doFinalize: function () { var t = this._data, e = t.words, r = 8 * this._nDataBytes, i = 8 * t.sigBytes; return e[i >>> 5] |= 128 << 24 - i % 32, e[14 + (64 + i >>> 9 << 4)] = Math.floor(r / 4294967296), e[15 + (64 + i >>> 9 << 4)] = r, t.sigBytes = 4 * e.length, this._process(), this._hash }, clone: function () { var t = i.clone.call(this); return t._hash = this._hash.clone(), t } }), t.SHA1 = i._createHelper(o), t.HmacSHA1 = i._createHmacHelper(o), function (n) { var t = bt, e = t.lib, r = e.WordArray, i = e.Hasher, o = t.algo, s = [], B = []; !function () { function t(t) { for (var e = n.sqrt(t), r = 2; r <= e; r++)if (!(t % r)) return; return 1 } function e(t) { return 4294967296 * (t - (0 | t)) | 0 } for (var r = 2, i = 0; i < 64;)t(r) && (i < 8 && (s[i] = e(n.pow(r, .5))), B[i] = e(n.pow(r, 1 / 3)), i++), r++ }(); var w = [], c = o.SHA256 = i.extend({ _doReset: function () { this._hash = new r.init(s.slice(0)) }, _doProcessBlock: function (t, e) { for (var r = this._hash.words, i = r[0], n = r[1], o = r[2], s = r[3], c = r[4], a = r[5], h = r[6], l = r[7], f = 0; f < 64; f++) { if (f < 16) w[f] = 0 | t[e + f]; else { var d = w[f - 15], u = (d << 25 | d >>> 7) ^ (d << 14 | d >>> 18) ^ d >>> 3, p = w[f - 2], _ = (p << 15 | p >>> 17) ^ (p << 13 | p >>> 19) ^ p >>> 10; w[f] = u + w[f - 7] + _ + w[f - 16] } var v = i & n ^ i & o ^ n & o, y = (i << 30 | i >>> 2) ^ (i << 19 | i >>> 13) ^ (i << 10 | i >>> 22), g = l + ((c << 26 | c >>> 6) ^ (c << 21 | c >>> 11) ^ (c << 7 | c >>> 25)) + (c & a ^ ~c & h) + B[f] + w[f]; l = h, h = a, a = c, c = s + g | 0, s = o, o = n, n = i, i = g + (y + v) | 0 } r[0] = r[0] + i | 0, r[1] = r[1] + n | 0, r[2] = r[2] + o | 0, r[3] = r[3] + s | 0, r[4] = r[4] + c | 0, r[5] = r[5] + a | 0, r[6] = r[6] + h | 0, r[7] = r[7] + l | 0 }, _doFinalize: function () { var t = this._data, e = t.words, r = 8 * this._nDataBytes, i = 8 * t.sigBytes; return e[i >>> 5] |= 128 << 24 - i % 32, e[14 + (64 + i >>> 9 << 4)] = n.floor(r / 4294967296), e[15 + (64 + i >>> 9 << 4)] = r, t.sigBytes = 4 * e.length, this._process(), this._hash }, clone: function () { var t = i.clone.call(this); return t._hash = this._hash.clone(), t } }); t.SHA256 = i._createHelper(c), t.HmacSHA256 = i._createHmacHelper(c) }(Math), function () { var n = bt.lib.WordArray, t = bt.enc; t.Utf16 = t.Utf16BE = { stringify: function (t) { for (var e = t.words, r = t.sigBytes, i = [], n = 0; n < r; n += 2) { var o = e[n >>> 2] >>> 16 - n % 4 * 8 & 65535; i.push(String.fromCharCode(o)) } return i.join("") }, parse: function (t) { for (var e = t.length, r = [], i = 0; i < e; i++)r[i >>> 1] |= t.charCodeAt(i) << 16 - i % 2 * 16; return n.create(r, 2 * e) } }; function s(t) { return t << 8 & 4278255360 | t >>> 8 & 16711935 } t.Utf16LE = { stringify: function (t) { for (var e = t.words, r = t.sigBytes, i = [], n = 0; n < r; n += 2) { var o = s(e[n >>> 2] >>> 16 - n % 4 * 8 & 65535); i.push(String.fromCharCode(o)) } return i.join("") }, parse: function (t) { for (var e = t.length, r = [], i = 0; i < e; i++)r[i >>> 1] |= s(t.charCodeAt(i) << 16 - i % 2 * 16); return n.create(r, 2 * e) } } }(), function () { if ("function" == typeof ArrayBuffer) { var t = bt.lib.WordArray, n = t.init; (t.init = function (t) { if (t instanceof ArrayBuffer && (t = new Uint8Array(t)), (t instanceof Int8Array || "undefined" != typeof Uint8ClampedArray && t instanceof Uint8ClampedArray || t instanceof Int16Array || t instanceof Uint16Array || t instanceof Int32Array || t instanceof Uint32Array || t instanceof Float32Array || t instanceof Float64Array) && (t = new Uint8Array(t.buffer, t.byteOffset, t.byteLength)), t instanceof Uint8Array) { for (var e = t.byteLength, r = [], i = 0; i < e; i++)r[i >>> 2] |= t[i] << 24 - i % 4 * 8; n.call(this, r, e) } else n.apply(this, arguments) }).prototype = t } }(), Math, c = (s = bt).lib, a = c.WordArray, l = c.Hasher, d = s.algo, m = a.create([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13]), x = a.create([5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11]), b = a.create([11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6]), H = a.create([8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11]), z = a.create([0, 1518500249, 1859775393, 2400959708, 2840853838]), A = a.create([1352829926, 1548603684, 1836072691, 2053994217, 0]), u = d.RIPEMD160 = l.extend({ _doReset: function () { this._hash = a.create([1732584193, 4023233417, 2562383102, 271733878, 3285377520]) }, _doProcessBlock: function (t, e) { for (var r = 0; r < 16; r++) { var i = e + r, n = t[i]; t[i] = 16711935 & (n << 8 | n >>> 24) | 4278255360 & (n << 24 | n >>> 8) } var o, s, c, a, h, l, f, d, u, p, _, v = this._hash.words, y = z.words, g = A.words, B = m.words, w = x.words, k = b.words, S = H.words; l = o = v[0], f = s = v[1], d = c = v[2], u = a = v[3], p = h = v[4]; for (r = 0; r < 80; r += 1)_ = o + t[e + B[r]] | 0, _ += r < 16 ? mt(s, c, a) + y[0] : r < 32 ? xt(s, c, a) + y[1] : r < 48 ? Ht(s, c, a) + y[2] : r < 64 ? zt(s, c, a) + y[3] : At(s, c, a) + y[4], _ = (_ = Ct(_ |= 0, k[r])) + h | 0, o = h, h = a, a = Ct(c, 10), c = s, s = _, _ = l + t[e + w[r]] | 0, _ += r < 16 ? At(f, d, u) + g[0] : r < 32 ? zt(f, d, u) + g[1] : r < 48 ? Ht(f, d, u) + g[2] : r < 64 ? xt(f, d, u) + g[3] : mt(f, d, u) + g[4], _ = (_ = Ct(_ |= 0, S[r])) + p | 0, l = p, p = u, u = Ct(d, 10), d = f, f = _; _ = v[1] + c + u | 0, v[1] = v[2] + a + p | 0, v[2] = v[3] + h + l | 0, v[3] = v[4] + o + f | 0, v[4] = v[0] + s + d | 0, v[0] = _ }, _doFinalize: function () { var t = this._data, e = t.words, r = 8 * this._nDataBytes, i = 8 * t.sigBytes; e[i >>> 5] |= 128 << 24 - i % 32, e[14 + (64 + i >>> 9 << 4)] = 16711935 & (r << 8 | r >>> 24) | 4278255360 & (r << 24 | r >>> 8), t.sigBytes = 4 * (e.length + 1), this._process(); for (var n = this._hash, o = n.words, s = 0; s < 5; s++) { var c = o[s]; o[s] = 16711935 & (c << 8 | c >>> 24) | 4278255360 & (c << 24 | c >>> 8) } return n }, clone: function () { var t = l.clone.call(this); return t._hash = this._hash.clone(), t } }), s.RIPEMD160 = l._createHelper(u), s.HmacRIPEMD160 = l._createHmacHelper(u), p = bt.lib.Base, _ = bt.enc.Utf8, bt.algo.HMAC = p.extend({ init: function (t, e) { t = this._hasher = new t.init, "string" == typeof e && (e = _.parse(e)); var r = t.blockSize, i = 4 * r; e.sigBytes > i && (e = t.finalize(e)), e.clamp(); for (var n = this._oKey = e.clone(), o = this._iKey = e.clone(), s = n.words, c = o.words, a = 0; a < r; a++)s[a] ^= 1549556828, c[a] ^= 909522486; n.sigBytes = o.sigBytes = i, this.reset() }, reset: function () { var t = this._hasher; t.reset(), t.update(this._iKey) }, update: function (t) { return this._hasher.update(t), this }, finalize: function (t) { var e = this._hasher, r = e.finalize(t); return e.reset(), e.finalize(this._oKey.clone().concat(r)) } }), y = (v = bt).lib, g = y.Base, B = y.WordArray, w = v.algo, k = w.SHA1, S = w.HMAC, C = w.PBKDF2 = g.extend({ cfg: g.extend({ keySize: 4, hasher: k, iterations: 1 }), init: function (t) { this.cfg = this.cfg.extend(t) }, compute: function (t, e) { for (var r = this.cfg, i = S.create(r.hasher, t), n = B.create(), o = B.create([1]), s = n.words, c = o.words, a = r.keySize, h = r.iterations; s.length < a;) { var l = i.update(e).finalize(o); i.reset(); for (var f = l.words, d = f.length, u = l, p = 1; p < h; p++) { u = i.finalize(u), i.reset(); for (var _ = u.words, v = 0; v < d; v++)f[v] ^= _[v] } n.concat(l), c[0]++ } return n.sigBytes = 4 * a, n } }), v.PBKDF2 = function (t, e, r) { return C.create(r).compute(t, e) }, E = (D = bt).lib, R = E.Base, M = E.WordArray, F = D.algo, P = F.MD5, W = F.EvpKDF = R.extend({ cfg: R.extend({ keySize: 4, hasher: P, iterations: 1 }), init: function (t) { this.cfg = this.cfg.extend(t) }, compute: function (t, e) { for (var r, i = this.cfg, n = i.hasher.create(), o = M.create(), s = o.words, c = i.keySize, a = i.iterations; s.length < c;) { r && n.update(r), r = n.update(t).finalize(e), n.reset(); for (var h = 1; h < a; h++)r = n.finalize(r), n.reset(); o.concat(r) } return o.sigBytes = 4 * c, o } }), D.EvpKDF = function (t, e, r) { return W.create(r).compute(t, e) }, I = (O = bt).lib.WordArray, U = O.algo, K = U.SHA256, X = U.SHA224 = K.extend({ _doReset: function () { this._hash = new I.init([3238371032, 914150663, 812702999, 4144912697, 4290775857, 1750603025, 1694076839, 3204075428]) }, _doFinalize: function () { var t = K._doFinalize.call(this); return t.sigBytes -= 4, t } }), O.SHA224 = K._createHelper(X), O.HmacSHA224 = K._createHmacHelper(X), L = bt.lib, j = L.Base, N = L.WordArray, (T = bt.x64 = {}).Word = j.extend({ init: function (t, e) { this.high = t, this.low = e } }), T.WordArray = j.extend({ init: function (t, e) { t = this.words = t || [], this.sigBytes = null != e ? e : 8 * t.length }, toX32: function () { for (var t = this.words, e = t.length, r = [], i = 0; i < e; i++) { var n = t[i]; r.push(n.high), r.push(n.low) } return N.create(r, this.sigBytes) }, clone: function () { for (var t = j.clone.call(this), e = t.words = this.words.slice(0), r = e.length, i = 0; i < r; i++)e[i] = e[i].clone(); return t } }), function (d) { var t = bt, e = t.lib, u = e.WordArray, i = e.Hasher, l = t.x64.Word, r = t.algo, C = [], D = [], E = []; !function () { for (var t = 1, e = 0, r = 0; r < 24; r++) { C[t + 5 * e] = (r + 1) * (r + 2) / 2 % 64; var i = (2 * t + 3 * e) % 5; t = e % 5, e = i } for (t = 0; t < 5; t++)for (e = 0; e < 5; e++)D[t + 5 * e] = e + (2 * t + 3 * e) % 5 * 5; for (var n = 1, o = 0; o < 24; o++) { for (var s = 0, c = 0, a = 0; a < 7; a++) { if (1 & n) { var h = (1 << a) - 1; h < 32 ? c ^= 1 << h : s ^= 1 << h - 32 } 128 & n ? n = n << 1 ^ 113 : n <<= 1 } E[o] = l.create(s, c) } }(); var R = []; !function () { for (var t = 0; t < 25; t++)R[t] = l.create() }(); var n = r.SHA3 = i.extend({ cfg: i.cfg.extend({ outputLength: 512 }), _doReset: function () { for (var t = this._state = [], e = 0; e < 25; e++)t[e] = new l.init; this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32 }, _doProcessBlock: function (t, e) { for (var r = this._state, i = this.blockSize / 2, n = 0; n < i; n++) { var o = t[e + 2 * n], s = t[e + 2 * n + 1]; o = 16711935 & (o << 8 | o >>> 24) | 4278255360 & (o << 24 | o >>> 8), s = 16711935 & (s << 8 | s >>> 24) | 4278255360 & (s << 24 | s >>> 8), (x = r[n]).high ^= s, x.low ^= o } for (var c = 0; c < 24; c++) { for (var a = 0; a < 5; a++) { for (var h = 0, l = 0, f = 0; f < 5; f++) { h ^= (x = r[a + 5 * f]).high, l ^= x.low } var d = R[a]; d.high = h, d.low = l } for (a = 0; a < 5; a++) { var u = R[(a + 4) % 5], p = R[(a + 1) % 5], _ = p.high, v = p.low; for (h = u.high ^ (_ << 1 | v >>> 31), l = u.low ^ (v << 1 | _ >>> 31), f = 0; f < 5; f++) { (x = r[a + 5 * f]).high ^= h, x.low ^= l } } for (var y = 1; y < 25; y++) { var g = (x = r[y]).high, B = x.low, w = C[y]; l = w < 32 ? (h = g << w | B >>> 32 - w, B << w | g >>> 32 - w) : (h = B << w - 32 | g >>> 64 - w, g << w - 32 | B >>> 64 - w); var k = R[D[y]]; k.high = h, k.low = l } var S = R[0], m = r[0]; S.high = m.high, S.low = m.low; for (a = 0; a < 5; a++)for (f = 0; f < 5; f++) { var x = r[y = a + 5 * f], b = R[y], H = R[(a + 1) % 5 + 5 * f], z = R[(a + 2) % 5 + 5 * f]; x.high = b.high ^ ~H.high & z.high, x.low = b.low ^ ~H.low & z.low } x = r[0]; var A = E[c]; x.high ^= A.high, x.low ^= A.low } }, _doFinalize: function () { var t = this._data, e = t.words, r = (this._nDataBytes, 8 * t.sigBytes), i = 32 * this.blockSize; e[r >>> 5] |= 1 << 24 - r % 32, e[(d.ceil((1 + r) / i) * i >>> 5) - 1] |= 128, t.sigBytes = 4 * e.length, this._process(); for (var n = this._state, o = this.cfg.outputLength / 8, s = o / 8, c = [], a = 0; a < s; a++) { var h = n[a], l = h.high, f = h.low; l = 16711935 & (l << 8 | l >>> 24) | 4278255360 & (l << 24 | l >>> 8), f = 16711935 & (f << 8 | f >>> 24) | 4278255360 & (f << 24 | f >>> 8), c.push(f), c.push(l) } return new u.init(c, o) }, clone: function () { for (var t = i.clone.call(this), e = t._state = this._state.slice(0), r = 0; r < 25; r++)e[r] = e[r].clone(); return t } }); t.SHA3 = i._createHelper(n), t.HmacSHA3 = i._createHmacHelper(n) }(Math), function () { var t = bt, e = t.lib.Hasher, r = t.x64, i = r.Word, n = r.WordArray, o = t.algo; function s() { return i.create.apply(i, arguments) } var mt = [s(1116352408, 3609767458), s(1899447441, 602891725), s(3049323471, 3964484399), s(3921009573, 2173295548), s(961987163, 4081628472), s(1508970993, 3053834265), s(2453635748, 2937671579), s(2870763221, 3664609560), s(3624381080, 2734883394), s(310598401, 1164996542), s(607225278, 1323610764), s(1426881987, 3590304994), s(1925078388, 4068182383), s(2162078206, 991336113), s(2614888103, 633803317), s(3248222580, 3479774868), s(3835390401, 2666613458), s(4022224774, 944711139), s(264347078, 2341262773), s(604807628, 2007800933), s(770255983, 1495990901), s(1249150122, 1856431235), s(1555081692, 3175218132), s(1996064986, 2198950837), s(2554220882, 3999719339), s(2821834349, 766784016), s(2952996808, 2566594879), s(3210313671, 3203337956), s(3336571891, 1034457026), s(3584528711, 2466948901), s(113926993, 3758326383), s(338241895, 168717936), s(666307205, 1188179964), s(773529912, 1546045734), s(1294757372, 1522805485), s(1396182291, 2643833823), s(1695183700, 2343527390), s(1986661051, 1014477480), s(2177026350, 1206759142), s(2456956037, 344077627), s(2730485921, 1290863460), s(2820302411, 3158454273), s(3259730800, 3505952657), s(3345764771, 106217008), s(3516065817, 3606008344), s(3600352804, 1432725776), s(4094571909, 1467031594), s(275423344, 851169720), s(430227734, 3100823752), s(506948616, 1363258195), s(659060556, 3750685593), s(883997877, 3785050280), s(958139571, 3318307427), s(1322822218, 3812723403), s(1537002063, 2003034995), s(1747873779, 3602036899), s(1955562222, 1575990012), s(2024104815, 1125592928), s(2227730452, 2716904306), s(2361852424, 442776044), s(2428436474, 593698344), s(2756734187, 3733110249), s(3204031479, 2999351573), s(3329325298, 3815920427), s(3391569614, 3928383900), s(3515267271, 566280711), s(3940187606, 3454069534), s(4118630271, 4000239992), s(116418474, 1914138554), s(174292421, 2731055270), s(289380356, 3203993006), s(460393269, 320620315), s(685471733, 587496836), s(852142971, 1086792851), s(1017036298, 365543100), s(1126000580, 2618297676), s(1288033470, 3409855158), s(1501505948, 4234509866), s(1607167915, 987167468), s(1816402316, 1246189591)], xt = []; !function () { for (var t = 0; t < 80; t++)xt[t] = s() }(); var c = o.SHA512 = e.extend({ _doReset: function () { this._hash = new n.init([new i.init(1779033703, 4089235720), new i.init(3144134277, 2227873595), new i.init(1013904242, 4271175723), new i.init(2773480762, 1595750129), new i.init(1359893119, 2917565137), new i.init(2600822924, 725511199), new i.init(528734635, 4215389547), new i.init(1541459225, 327033209)]) }, _doProcessBlock: function (t, e) { for (var r = this._hash.words, i = r[0], n = r[1], o = r[2], s = r[3], c = r[4], a = r[5], h = r[6], l = r[7], f = i.high, d = i.low, u = n.high, p = n.low, _ = o.high, v = o.low, y = s.high, g = s.low, B = c.high, w = c.low, k = a.high, S = a.low, m = h.high, x = h.low, b = l.high, H = l.low, z = f, A = d, C = u, D = p, E = _, R = v, M = y, F = g, P = B, W = w, O = k, I = S, U = m, K = x, X = b, L = H, j = 0; j < 80; j++) { var N, T, q = xt[j]; if (j < 16) T = q.high = 0 | t[e + 2 * j], N = q.low = 0 | t[e + 2 * j + 1]; else { var Z = xt[j - 15], V = Z.high, G = Z.low, J = (V >>> 1 | G << 31) ^ (V >>> 8 | G << 24) ^ V >>> 7, $ = (G >>> 1 | V << 31) ^ (G >>> 8 | V << 24) ^ (G >>> 7 | V << 25), Q = xt[j - 2], Y = Q.high, tt = Q.low, et = (Y >>> 19 | tt << 13) ^ (Y << 3 | tt >>> 29) ^ Y >>> 6, rt = (tt >>> 19 | Y << 13) ^ (tt << 3 | Y >>> 29) ^ (tt >>> 6 | Y << 26), it = xt[j - 7], nt = it.high, ot = it.low, st = xt[j - 16], ct = st.high, at = st.low; T = (T = (T = J + nt + ((N = $ + ot) >>> 0 < $ >>> 0 ? 1 : 0)) + et + ((N += rt) >>> 0 < rt >>> 0 ? 1 : 0)) + ct + ((N += at) >>> 0 < at >>> 0 ? 1 : 0), q.high = T, q.low = N } var ht, lt = P & O ^ ~P & U, ft = W & I ^ ~W & K, dt = z & C ^ z & E ^ C & E, ut = A & D ^ A & R ^ D & R, pt = (z >>> 28 | A << 4) ^ (z << 30 | A >>> 2) ^ (z << 25 | A >>> 7), _t = (A >>> 28 | z << 4) ^ (A << 30 | z >>> 2) ^ (A << 25 | z >>> 7), vt = (P >>> 14 | W << 18) ^ (P >>> 18 | W << 14) ^ (P << 23 | W >>> 9), yt = (W >>> 14 | P << 18) ^ (W >>> 18 | P << 14) ^ (W << 23 | P >>> 9), gt = mt[j], Bt = gt.high, wt = gt.low, kt = X + vt + ((ht = L + yt) >>> 0 < L >>> 0 ? 1 : 0), St = _t + ut; X = U, L = K, U = O, K = I, O = P, I = W, P = M + (kt = (kt = (kt = kt + lt + ((ht = ht + ft) >>> 0 < ft >>> 0 ? 1 : 0)) + Bt + ((ht = ht + wt) >>> 0 < wt >>> 0 ? 1 : 0)) + T + ((ht = ht + N) >>> 0 < N >>> 0 ? 1 : 0)) + ((W = F + ht | 0) >>> 0 < F >>> 0 ? 1 : 0) | 0, M = E, F = R, E = C, R = D, C = z, D = A, z = kt + (pt + dt + (St >>> 0 < _t >>> 0 ? 1 : 0)) + ((A = ht + St | 0) >>> 0 < ht >>> 0 ? 1 : 0) | 0 } d = i.low = d + A, i.high = f + z + (d >>> 0 < A >>> 0 ? 1 : 0), p = n.low = p + D, n.high = u + C + (p >>> 0 < D >>> 0 ? 1 : 0), v = o.low = v + R, o.high = _ + E + (v >>> 0 < R >>> 0 ? 1 : 0), g = s.low = g + F, s.high = y + M + (g >>> 0 < F >>> 0 ? 1 : 0), w = c.low = w + W, c.high = B + P + (w >>> 0 < W >>> 0 ? 1 : 0), S = a.low = S + I, a.high = k + O + (S >>> 0 < I >>> 0 ? 1 : 0), x = h.low = x + K, h.high = m + U + (x >>> 0 < K >>> 0 ? 1 : 0), H = l.low = H + L, l.high = b + X + (H >>> 0 < L >>> 0 ? 1 : 0) }, _doFinalize: function () { var t = this._data, e = t.words, r = 8 * this._nDataBytes, i = 8 * t.sigBytes; return e[i >>> 5] |= 128 << 24 - i % 32, e[30 + (128 + i >>> 10 << 5)] = Math.floor(r / 4294967296), e[31 + (128 + i >>> 10 << 5)] = r, t.sigBytes = 4 * e.length, this._process(), this._hash.toX32() }, clone: function () { var t = e.clone.call(this); return t._hash = this._hash.clone(), t }, blockSize: 32 }); t.SHA512 = e._createHelper(c), t.HmacSHA512 = e._createHmacHelper(c) }(), Z = (q = bt).x64, V = Z.Word, G = Z.WordArray, J = q.algo, $ = J.SHA512, Q = J.SHA384 = $.extend({ _doReset: function () { this._hash = new G.init([new V.init(3418070365, 3238371032), new V.init(1654270250, 914150663), new V.init(2438529370, 812702999), new V.init(355462360, 4144912697), new V.init(1731405415, 4290775857), new V.init(2394180231, 1750603025), new V.init(3675008525, 1694076839), new V.init(1203062813, 3204075428)]) }, _doFinalize: function () { var t = $._doFinalize.call(this); return t.sigBytes -= 16, t } }), q.SHA384 = $._createHelper(Q), q.HmacSHA384 = $._createHmacHelper(Q), bt.lib.Cipher || function () { var t = bt, e = t.lib, r = e.Base, a = e.WordArray, i = e.BufferedBlockAlgorithm, n = t.enc, o = (n.Utf8, n.Base64), s = t.algo.EvpKDF, c = e.Cipher = i.extend({ cfg: r.extend(), createEncryptor: function (t, e) { return this.create(this._ENC_XFORM_MODE, t, e) }, createDecryptor: function (t, e) { return this.create(this._DEC_XFORM_MODE, t, e) }, init: function (t, e, r) { this.cfg = this.cfg.extend(r), this._xformMode = t, this._key = e, this.reset() }, reset: function () { i.reset.call(this), this._doReset() }, process: function (t) { return this._append(t), this._process() }, finalize: function (t) { return t && this._append(t), this._doFinalize() }, keySize: 4, ivSize: 4, _ENC_XFORM_MODE: 1, _DEC_XFORM_MODE: 2, _createHelper: function (i) { return { encrypt: function (t, e, r) { return h(e).encrypt(i, t, e, r) }, decrypt: function (t, e, r) { return h(e).decrypt(i, t, e, r) } } } }); function h(t) { return "string" == typeof t ? w : g } e.StreamCipher = c.extend({ _doFinalize: function () { return this._process(!0) }, blockSize: 1 }); var l, f = t.mode = {}, d = e.BlockCipherMode = r.extend({ createEncryptor: function (t, e) { return this.Encryptor.create(t, e) }, createDecryptor: function (t, e) { return this.Decryptor.create(t, e) }, init: function (t, e) { this._cipher = t, this._iv = e } }), u = f.CBC = ((l = d.extend()).Encryptor = l.extend({ processBlock: function (t, e) { var r = this._cipher, i = r.blockSize; p.call(this, t, e, i), r.encryptBlock(t, e), this._prevBlock = t.slice(e, e + i) } }), l.Decryptor = l.extend({ processBlock: function (t, e) { var r = this._cipher, i = r.blockSize, n = t.slice(e, e + i); r.decryptBlock(t, e), p.call(this, t, e, i), this._prevBlock = n } }), l); function p(t, e, r) { var i, n = this._iv; n ? (i = n, this._iv = void 0) : i = this._prevBlock; for (var o = 0; o < r; o++)t[e + o] ^= i[o] } var _ = (t.pad = {}).Pkcs7 = { pad: function (t, e) { for (var r = 4 * e, i = r - t.sigBytes % r, n = i << 24 | i << 16 | i << 8 | i, o = [], s = 0; s < i; s += 4)o.push(n); var c = a.create(o, i); t.concat(c) }, unpad: function (t) { var e = 255 & t.words[t.sigBytes - 1 >>> 2]; t.sigBytes -= e } }, v = (e.BlockCipher = c.extend({ cfg: c.cfg.extend({ mode: u, padding: _ }), reset: function () { var t; c.reset.call(this); var e = this.cfg, r = e.iv, i = e.mode; this._xformMode == this._ENC_XFORM_MODE ? t = i.createEncryptor : (t = i.createDecryptor, this._minBufferSize = 1), this._mode && this._mode.__creator == t ? this._mode.init(this, r && r.words) : (this._mode = t.call(i, this, r && r.words), this._mode.__creator = t) }, _doProcessBlock: function (t, e) { this._mode.processBlock(t, e) }, _doFinalize: function () { var t, e = this.cfg.padding; return this._xformMode == this._ENC_XFORM_MODE ? (e.pad(this._data, this.blockSize), t = this._process(!0)) : (t = this._process(!0), e.unpad(t)), t }, blockSize: 4 }), e.CipherParams = r.extend({ init: function (t) { this.mixIn(t) }, toString: function (t) { return (t || this.formatter).stringify(this) } })), y = (t.format = {}).OpenSSL = { stringify: function (t) { var e = t.ciphertext, r = t.salt; return (r ? a.create([1398893684, 1701076831]).concat(r).concat(e) : e).toString(o) }, parse: function (t) { var e, r = o.parse(t), i = r.words; return 1398893684 == i[0] && 1701076831 == i[1] && (e = a.create(i.slice(2, 4)), i.splice(0, 4), r.sigBytes -= 16), v.create({ ciphertext: r, salt: e }) } }, g = e.SerializableCipher = r.extend({ cfg: r.extend({ format: y }), encrypt: function (t, e, r, i) { i = this.cfg.extend(i); var n = t.createEncryptor(r, i), o = n.finalize(e), s = n.cfg; return v.create({ ciphertext: o, key: r, iv: s.iv, algorithm: t, mode: s.mode, padding: s.padding, blockSize: t.blockSize, formatter: i.format }) }, decrypt: function (t, e, r, i) { return i = this.cfg.extend(i), e = this._parse(e, i.format), t.createDecryptor(r, i).finalize(e.ciphertext) }, _parse: function (t, e) { return "string" == typeof t ? e.parse(t, this) : t } }), B = (t.kdf = {}).OpenSSL = { execute: function (t, e, r, i) { i = i || a.random(8); var n = s.create({ keySize: e + r }).compute(t, i), o = a.create(n.words.slice(e), 4 * r); return n.sigBytes = 4 * e, v.create({ key: n, iv: o, salt: i }) } }, w = e.PasswordBasedCipher = g.extend({ cfg: g.cfg.extend({ kdf: B }), encrypt: function (t, e, r, i) { var n = (i = this.cfg.extend(i)).kdf.execute(r, t.keySize, t.ivSize); i.iv = n.iv; var o = g.encrypt.call(this, t, e, n.key, i); return o.mixIn(n), o }, decrypt: function (t, e, r, i) { i = this.cfg.extend(i), e = this._parse(e, i.format); var n = i.kdf.execute(r, t.keySize, t.ivSize, e.salt); return i.iv = n.iv, g.decrypt.call(this, t, e, n.key, i) } }) }(), bt.mode.CFB = ((Y = bt.lib.BlockCipherMode.extend()).Encryptor = Y.extend({ processBlock: function (t, e) { var r = this._cipher, i = r.blockSize; Dt.call(this, t, e, i, r), this._prevBlock = t.slice(e, e + i) } }), Y.Decryptor = Y.extend({ processBlock: function (t, e) { var r = this._cipher, i = r.blockSize, n = t.slice(e, e + i); Dt.call(this, t, e, i, r), this._prevBlock = n } }), Y), bt.mode.ECB = ((tt = bt.lib.BlockCipherMode.extend()).Encryptor = tt.extend({ processBlock: function (t, e) { this._cipher.encryptBlock(t, e) } }), tt.Decryptor = tt.extend({ processBlock: function (t, e) { this._cipher.decryptBlock(t, e) } }), tt), bt.pad.AnsiX923 = { pad: function (t, e) { var r = t.sigBytes, i = 4 * e, n = i - r % i, o = r + n - 1; t.clamp(), t.words[o >>> 2] |= n << 24 - o % 4 * 8, t.sigBytes += n }, unpad: function (t) { var e = 255 & t.words[t.sigBytes - 1 >>> 2]; t.sigBytes -= e } }, bt.pad.Iso10126 = { pad: function (t, e) { var r = 4 * e, i = r - t.sigBytes % r; t.concat(bt.lib.WordArray.random(i - 1)).concat(bt.lib.WordArray.create([i << 24], 1)) }, unpad: function (t) { var e = 255 & t.words[t.sigBytes - 1 >>> 2]; t.sigBytes -= e } }, bt.pad.Iso97971 = { pad: function (t, e) { t.concat(bt.lib.WordArray.create([2147483648], 1)), bt.pad.ZeroPadding.pad(t, e) }, unpad: function (t) { bt.pad.ZeroPadding.unpad(t), t.sigBytes-- } }, bt.mode.OFB = (et = bt.lib.BlockCipherMode.extend(), rt = et.Encryptor = et.extend({ processBlock: function (t, e) { var r = this._cipher, i = r.blockSize, n = this._iv, o = this._keystream; n && (o = this._keystream = n.slice(0), this._iv = void 0), r.encryptBlock(o, 0); for (var s = 0; s < i; s++)t[e + s] ^= o[s] } }), et.Decryptor = rt, et), bt.pad.NoPadding = { pad: function () { }, unpad: function () { } }, it = bt.lib.CipherParams, nt = bt.enc.Hex, bt.format.Hex = { stringify: function (t) { return t.ciphertext.toString(nt) }, parse: function (t) { var e = nt.parse(t); return it.create({ ciphertext: e }) } }, function () { var t = bt, e = t.lib.BlockCipher, r = t.algo, h = [], l = [], f = [], d = [], u = [], p = [], _ = [], v = [], y = [], g = []; !function () { for (var t = [], e = 0; e < 256; e++)t[e] = e < 128 ? e << 1 : e << 1 ^ 283; var r = 0, i = 0; for (e = 0; e < 256; e++) { var n = i ^ i << 1 ^ i << 2 ^ i << 3 ^ i << 4; n = n >>> 8 ^ 255 & n ^ 99, h[r] = n; var o = t[l[n] = r], s = t[o], c = t[s], a = 257 * t[n] ^ 16843008 * n; f[r] = a << 24 | a >>> 8, d[r] = a << 16 | a >>> 16, u[r] = a << 8 | a >>> 24, p[r] = a; a = 16843009 * c ^ 65537 * s ^ 257 * o ^ 16843008 * r; _[n] = a << 24 | a >>> 8, v[n] = a << 16 | a >>> 16, y[n] = a << 8 | a >>> 24, g[n] = a, r ? (r = o ^ t[t[t[c ^ o]]], i ^= t[t[i]]) : r = i = 1 } }(); var B = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54], i = r.AES = e.extend({ _doReset: function () { if (!this._nRounds || this._keyPriorReset !== this._key) { for (var t = this._keyPriorReset = this._key, e = t.words, r = t.sigBytes / 4, i = 4 * (1 + (this._nRounds = 6 + r)), n = this._keySchedule = [], o = 0; o < i; o++)o < r ? n[o] = e[o] : (a = n[o - 1], o % r ? 6 < r && o % r == 4 && (a = h[a >>> 24] << 24 | h[a >>> 16 & 255] << 16 | h[a >>> 8 & 255] << 8 | h[255 & a]) : (a = h[(a = a << 8 | a >>> 24) >>> 24] << 24 | h[a >>> 16 & 255] << 16 | h[a >>> 8 & 255] << 8 | h[255 & a], a ^= B[o / r | 0] << 24), n[o] = n[o - r] ^ a); for (var s = this._invKeySchedule = [], c = 0; c < i; c++) { o = i - c; if (c % 4) var a = n[o]; else a = n[o - 4]; s[c] = c < 4 || o <= 4 ? a : _[h[a >>> 24]] ^ v[h[a >>> 16 & 255]] ^ y[h[a >>> 8 & 255]] ^ g[h[255 & a]] } } }, encryptBlock: function (t, e) { this._doCryptBlock(t, e, this._keySchedule, f, d, u, p, h) }, decryptBlock: function (t, e) { var r = t[e + 1]; t[e + 1] = t[e + 3], t[e + 3] = r, this._doCryptBlock(t, e, this._invKeySchedule, _, v, y, g, l); r = t[e + 1]; t[e + 1] = t[e + 3], t[e + 3] = r }, _doCryptBlock: function (t, e, r, i, n, o, s, c) { for (var a = this._nRounds, h = t[e] ^ r[0], l = t[e + 1] ^ r[1], f = t[e + 2] ^ r[2], d = t[e + 3] ^ r[3], u = 4, p = 1; p < a; p++) { var _ = i[h >>> 24] ^ n[l >>> 16 & 255] ^ o[f >>> 8 & 255] ^ s[255 & d] ^ r[u++], v = i[l >>> 24] ^ n[f >>> 16 & 255] ^ o[d >>> 8 & 255] ^ s[255 & h] ^ r[u++], y = i[f >>> 24] ^ n[d >>> 16 & 255] ^ o[h >>> 8 & 255] ^ s[255 & l] ^ r[u++], g = i[d >>> 24] ^ n[h >>> 16 & 255] ^ o[l >>> 8 & 255] ^ s[255 & f] ^ r[u++]; h = _, l = v, f = y, d = g } _ = (c[h >>> 24] << 24 | c[l >>> 16 & 255] << 16 | c[f >>> 8 & 255] << 8 | c[255 & d]) ^ r[u++], v = (c[l >>> 24] << 24 | c[f >>> 16 & 255] << 16 | c[d >>> 8 & 255] << 8 | c[255 & h]) ^ r[u++], y = (c[f >>> 24] << 24 | c[d >>> 16 & 255] << 16 | c[h >>> 8 & 255] << 8 | c[255 & l]) ^ r[u++], g = (c[d >>> 24] << 24 | c[h >>> 16 & 255] << 16 | c[l >>> 8 & 255] << 8 | c[255 & f]) ^ r[u++]; t[e] = _, t[e + 1] = v, t[e + 2] = y, t[e + 3] = g }, keySize: 8 }); t.AES = e._createHelper(i) }(), function () { var t = bt, e = t.lib, n = e.WordArray, r = e.BlockCipher, i = t.algo, h = [57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18, 10, 2, 59, 51, 43, 35, 27, 19, 11, 3, 60, 52, 44, 36, 63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38, 30, 22, 14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4], l = [14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10, 23, 19, 12, 4, 26, 8, 16, 7, 27, 20, 13, 2, 41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48, 44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32], f = [1, 2, 4, 6, 8, 10, 12, 14, 15, 17, 19, 21, 23, 25, 27, 28], d = [{ 0: 8421888, 268435456: 32768, 536870912: 8421378, 805306368: 2, 1073741824: 512, 1342177280: 8421890, 1610612736: 8389122, 1879048192: 8388608, 2147483648: 514, 2415919104: 8389120, 2684354560: 33280, 2952790016: 8421376, 3221225472: 32770, 3489660928: 8388610, 3758096384: 0, 4026531840: 33282, 134217728: 0, 402653184: 8421890, 671088640: 33282, 939524096: 32768, 1207959552: 8421888, 1476395008: 512, 1744830464: 8421378, 2013265920: 2, 2281701376: 8389120, 2550136832: 33280, 2818572288: 8421376, 3087007744: 8389122, 3355443200: 8388610, 3623878656: 32770, 3892314112: 514, 4160749568: 8388608, 1: 32768, 268435457: 2, 536870913: 8421888, 805306369: 8388608, 1073741825: 8421378, 1342177281: 33280, 1610612737: 512, 1879048193: 8389122, 2147483649: 8421890, 2415919105: 8421376, 2684354561: 8388610, 2952790017: 33282, 3221225473: 514, 3489660929: 8389120, 3758096385: 32770, 4026531841: 0, 134217729: 8421890, 402653185: 8421376, 671088641: 8388608, 939524097: 512, 1207959553: 32768, 1476395009: 8388610, 1744830465: 2, 2013265921: 33282, 2281701377: 32770, 2550136833: 8389122, 2818572289: 514, 3087007745: 8421888, 3355443201: 8389120, 3623878657: 0, 3892314113: 33280, 4160749569: 8421378 }, { 0: 1074282512, 16777216: 16384, 33554432: 524288, 50331648: 1074266128, 67108864: 1073741840, 83886080: 1074282496, 100663296: 1073758208, 117440512: 16, 134217728: 540672, 150994944: 1073758224, 167772160: 1073741824, 184549376: 540688, 201326592: 524304, 218103808: 0, 234881024: 16400, 251658240: 1074266112, 8388608: 1073758208, 25165824: 540688, 41943040: 16, 58720256: 1073758224, 75497472: 1074282512, 92274688: 1073741824, 109051904: 524288, 125829120: 1074266128, 142606336: 524304, 159383552: 0, 176160768: 16384, 192937984: 1074266112, 209715200: 1073741840, 226492416: 540672, 243269632: 1074282496, 260046848: 16400, 268435456: 0, 285212672: 1074266128, 301989888: 1073758224, 318767104: 1074282496, 335544320: 1074266112, 352321536: 16, 369098752: 540688, 385875968: 16384, 402653184: 16400, 419430400: 524288, 436207616: 524304, 452984832: 1073741840, 469762048: 540672, 486539264: 1073758208, 503316480: 1073741824, 520093696: 1074282512, 276824064: 540688, 293601280: 524288, 310378496: 1074266112, 327155712: 16384, 343932928: 1073758208, 360710144: 1074282512, 377487360: 16, 394264576: 1073741824, 411041792: 1074282496, 427819008: 1073741840, 444596224: 1073758224, 461373440: 524304, 478150656: 0, 494927872: 16400, 511705088: 1074266128, 528482304: 540672 }, { 0: 260, 1048576: 0, 2097152: 67109120, 3145728: 65796, 4194304: 65540, 5242880: 67108868, 6291456: 67174660, 7340032: 67174400, 8388608: 67108864, 9437184: 67174656, 10485760: 65792, 11534336: 67174404, 12582912: 67109124, 13631488: 65536, 14680064: 4, 15728640: 256, 524288: 67174656, 1572864: 67174404, 2621440: 0, 3670016: 67109120, 4718592: 67108868, 5767168: 65536, 6815744: 65540, 7864320: 260, 8912896: 4, 9961472: 256, 11010048: 67174400, 12058624: 65796, 13107200: 65792, 14155776: 67109124, 15204352: 67174660, 16252928: 67108864, 16777216: 67174656, 17825792: 65540, 18874368: 65536, 19922944: 67109120, 20971520: 256, 22020096: 67174660, 23068672: 67108868, 24117248: 0, 25165824: 67109124, 26214400: 67108864, 27262976: 4, 28311552: 65792, 29360128: 67174400, 30408704: 260, 31457280: 65796, 32505856: 67174404, 17301504: 67108864, 18350080: 260, 19398656: 67174656, 20447232: 0, 21495808: 65540, 22544384: 67109120, 23592960: 256, 24641536: 67174404, 25690112: 65536, 26738688: 67174660, 27787264: 65796, 28835840: 67108868, 29884416: 67109124, 30932992: 67174400, 31981568: 4, 33030144: 65792 }, { 0: 2151682048, 65536: 2147487808, 131072: 4198464, 196608: 2151677952, 262144: 0, 327680: 4198400, 393216: 2147483712, 458752: 4194368, 524288: 2147483648, 589824: 4194304, 655360: 64, 720896: 2147487744, 786432: 2151678016, 851968: 4160, 917504: 4096, 983040: 2151682112, 32768: 2147487808, 98304: 64, 163840: 2151678016, 229376: 2147487744, 294912: 4198400, 360448: 2151682112, 425984: 0, 491520: 2151677952, 557056: 4096, 622592: 2151682048, 688128: 4194304, 753664: 4160, 819200: 2147483648, 884736: 4194368, 950272: 4198464, 1015808: 2147483712, 1048576: 4194368, 1114112: 4198400, 1179648: 2147483712, 1245184: 0, 1310720: 4160, 1376256: 2151678016, 1441792: 2151682048, 1507328: 2147487808, 1572864: 2151682112, 1638400: 2147483648, 1703936: 2151677952, 1769472: 4198464, 1835008: 2147487744, 1900544: 4194304, 1966080: 64, 2031616: 4096, 1081344: 2151677952, 1146880: 2151682112, 1212416: 0, 1277952: 4198400, 1343488: 4194368, 1409024: 2147483648, 1474560: 2147487808, 1540096: 64, 1605632: 2147483712, 1671168: 4096, 1736704: 2147487744, 1802240: 2151678016, 1867776: 4160, 1933312: 2151682048, 1998848: 4194304, 2064384: 4198464 }, { 0: 128, 4096: 17039360, 8192: 262144, 12288: 536870912, 16384: 537133184, 20480: 16777344, 24576: 553648256, 28672: 262272, 32768: 16777216, 36864: 537133056, 40960: 536871040, 45056: 553910400, 49152: 553910272, 53248: 0, 57344: 17039488, 61440: 553648128, 2048: 17039488, 6144: 553648256, 10240: 128, 14336: 17039360, 18432: 262144, 22528: 537133184, 26624: 553910272, 30720: 536870912, 34816: 537133056, 38912: 0, 43008: 553910400, 47104: 16777344, 51200: 536871040, 55296: 553648128, 59392: 16777216, 63488: 262272, 65536: 262144, 69632: 128, 73728: 536870912, 77824: 553648256, 81920: 16777344, 86016: 553910272, 90112: 537133184, 94208: 16777216, 98304: 553910400, 102400: 553648128, 106496: 17039360, 110592: 537133056, 114688: 262272, 118784: 536871040, 122880: 0, 126976: 17039488, 67584: 553648256, 71680: 16777216, 75776: 17039360, 79872: 537133184, 83968: 536870912, 88064: 17039488, 92160: 128, 96256: 553910272, 100352: 262272, 104448: 553910400, 108544: 0, 112640: 553648128, 116736: 16777344, 120832: 262144, 124928: 537133056, 129024: 536871040 }, { 0: 268435464, 256: 8192, 512: 270532608, 768: 270540808, 1024: 268443648, 1280: 2097152, 1536: 2097160, 1792: 268435456, 2048: 0, 2304: 268443656, 2560: 2105344, 2816: 8, 3072: 270532616, 3328: 2105352, 3584: 8200, 3840: 270540800, 128: 270532608, 384: 270540808, 640: 8, 896: 2097152, 1152: 2105352, 1408: 268435464, 1664: 268443648, 1920: 8200, 2176: 2097160, 2432: 8192, 2688: 268443656, 2944: 270532616, 3200: 0, 3456: 270540800, 3712: 2105344, 3968: 268435456, 4096: 268443648, 4352: 270532616, 4608: 270540808, 4864: 8200, 5120: 2097152, 5376: 268435456, 5632: 268435464, 5888: 2105344, 6144: 2105352, 6400: 0, 6656: 8, 6912: 270532608, 7168: 8192, 7424: 268443656, 7680: 270540800, 7936: 2097160, 4224: 8, 4480: 2105344, 4736: 2097152, 4992: 268435464, 5248: 268443648, 5504: 8200, 5760: 270540808, 6016: 270532608, 6272: 270540800, 6528: 270532616, 6784: 8192, 7040: 2105352, 7296: 2097160, 7552: 0, 7808: 268435456, 8064: 268443656 }, { 0: 1048576, 16: 33555457, 32: 1024, 48: 1049601, 64: 34604033, 80: 0, 96: 1, 112: 34603009, 128: 33555456, 144: 1048577, 160: 33554433, 176: 34604032, 192: 34603008, 208: 1025, 224: 1049600, 240: 33554432, 8: 34603009, 24: 0, 40: 33555457, 56: 34604032, 72: 1048576, 88: 33554433, 104: 33554432, 120: 1025, 136: 1049601, 152: 33555456, 168: 34603008, 184: 1048577, 200: 1024, 216: 34604033, 232: 1, 248: 1049600, 256: 33554432, 272: 1048576, 288: 33555457, 304: 34603009, 320: 1048577, 336: 33555456, 352: 34604032, 368: 1049601, 384: 1025, 400: 34604033, 416: 1049600, 432: 1, 448: 0, 464: 34603008, 480: 33554433, 496: 1024, 264: 1049600, 280: 33555457, 296: 34603009, 312: 1, 328: 33554432, 344: 1048576, 360: 1025, 376: 34604032, 392: 33554433, 408: 34603008, 424: 0, 440: 34604033, 456: 1049601, 472: 1024, 488: 33555456, 504: 1048577 }, { 0: 134219808, 1: 131072, 2: 134217728, 3: 32, 4: 131104, 5: 134350880, 6: 134350848, 7: 2048, 8: 134348800, 9: 134219776, 10: 133120, 11: 134348832, 12: 2080, 13: 0, 14: 134217760, 15: 133152, 2147483648: 2048, 2147483649: 134350880, 2147483650: 134219808, 2147483651: 134217728, 2147483652: 134348800, 2147483653: 133120, 2147483654: 133152, 2147483655: 32, 2147483656: 134217760, 2147483657: 2080, 2147483658: 131104, 2147483659: 134350848, 2147483660: 0, 2147483661: 134348832, 2147483662: 134219776, 2147483663: 131072, 16: 133152, 17: 134350848, 18: 32, 19: 2048, 20: 134219776, 21: 134217760, 22: 134348832, 23: 131072, 24: 0, 25: 131104, 26: 134348800, 27: 134219808, 28: 134350880, 29: 133120, 30: 2080, 31: 134217728, 2147483664: 131072, 2147483665: 2048, 2147483666: 134348832, 2147483667: 133152, 2147483668: 32, 2147483669: 134348800, 2147483670: 134217728, 2147483671: 134219808, 2147483672: 134350880, 2147483673: 134217760, 2147483674: 134219776, 2147483675: 0, 2147483676: 133120, 2147483677: 2080, 2147483678: 131104, 2147483679: 134350848 }], u = [4160749569, 528482304, 33030144, 2064384, 129024, 8064, 504, 2147483679], o = i.DES = r.extend({ _doReset: function () { for (var t = this._key.words, e = [], r = 0; r < 56; r++) { var i = h[r] - 1; e[r] = t[i >>> 5] >>> 31 - i % 32 & 1 } for (var n = this._subKeys = [], o = 0; o < 16; o++) { var s = n[o] = [], c = f[o]; for (r = 0; r < 24; r++)s[r / 6 | 0] |= e[(l[r] - 1 + c) % 28] << 31 - r % 6, s[4 + (r / 6 | 0)] |= e[28 + (l[r + 24] - 1 + c) % 28] << 31 - r % 6; s[0] = s[0] << 1 | s[0] >>> 31; for (r = 1; r < 7; r++)s[r] = s[r] >>> 4 * (r - 1) + 3; s[7] = s[7] << 5 | s[7] >>> 27 } var a = this._invSubKeys = []; for (r = 0; r < 16; r++)a[r] = n[15 - r] }, encryptBlock: function (t, e) { this._doCryptBlock(t, e, this._subKeys) }, decryptBlock: function (t, e) { this._doCryptBlock(t, e, this._invSubKeys) }, _doCryptBlock: function (t, e, r) { this._lBlock = t[e], this._rBlock = t[e + 1], p.call(this, 4, 252645135), p.call(this, 16, 65535), _.call(this, 2, 858993459), _.call(this, 8, 16711935), p.call(this, 1, 1431655765); for (var i = 0; i < 16; i++) { for (var n = r[i], o = this._lBlock, s = this._rBlock, c = 0, a = 0; a < 8; a++)c |= d[a][((s ^ n[a]) & u[a]) >>> 0]; this._lBlock = s, this._rBlock = o ^ c } var h = this._lBlock; this._lBlock = this._rBlock, this._rBlock = h, p.call(this, 1, 1431655765), _.call(this, 8, 16711935), _.call(this, 2, 858993459), p.call(this, 16, 65535), p.call(this, 4, 252645135), t[e] = this._lBlock, t[e + 1] = this._rBlock }, keySize: 2, ivSize: 2, blockSize: 2 }); function p(t, e) { var r = (this._lBlock >>> t ^ this._rBlock) & e; this._rBlock ^= r, this._lBlock ^= r << t } function _(t, e) { var r = (this._rBlock >>> t ^ this._lBlock) & e; this._lBlock ^= r, this._rBlock ^= r << t } t.DES = r._createHelper(o); var s = i.TripleDES = r.extend({ _doReset: function () { var t = this._key.words; if (2 !== t.length && 4 !== t.length && t.length < 6) throw new Error("Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192."); var e = t.slice(0, 2), r = t.length < 4 ? t.slice(0, 2) : t.slice(2, 4), i = t.length < 6 ? t.slice(0, 2) : t.slice(4, 6); this._des1 = o.createEncryptor(n.create(e)), this._des2 = o.createEncryptor(n.create(r)), this._des3 = o.createEncryptor(n.create(i)) }, encryptBlock: function (t, e) { this._des1.encryptBlock(t, e), this._des2.decryptBlock(t, e), this._des3.encryptBlock(t, e) }, decryptBlock: function (t, e) { this._des3.decryptBlock(t, e), this._des2.encryptBlock(t, e), this._des1.decryptBlock(t, e) }, keySize: 6, ivSize: 2, blockSize: 2 }); t.TripleDES = r._createHelper(s) }(), function () { var t = bt, e = t.lib.StreamCipher, r = t.algo, i = r.RC4 = e.extend({ _doReset: function () { for (var t = this._key, e = t.words, r = t.sigBytes, i = this._S = [], n = 0; n < 256; n++)i[n] = n; n = 0; for (var o = 0; n < 256; n++) { var s = n % r, c = e[s >>> 2] >>> 24 - s % 4 * 8 & 255; o = (o + i[n] + c) % 256; var a = i[n]; i[n] = i[o], i[o] = a } this._i = this._j = 0 }, _doProcessBlock: function (t, e) { t[e] ^= n.call(this) }, keySize: 8, ivSize: 0 }); function n() { for (var t = this._S, e = this._i, r = this._j, i = 0, n = 0; n < 4; n++) { r = (r + t[e = (e + 1) % 256]) % 256; var o = t[e]; t[e] = t[r], t[r] = o, i |= t[(t[e] + t[r]) % 256] << 24 - 8 * n } return this._i = e, this._j = r, i } t.RC4 = e._createHelper(i); var o = r.RC4Drop = i.extend({ cfg: i.cfg.extend({ drop: 192 }), _doReset: function () { i._doReset.call(this); for (var t = this.cfg.drop; 0 < t; t--)n.call(this) } }); t.RC4Drop = e._createHelper(o) }(), bt.mode.CTRGladman = (ot = bt.lib.BlockCipherMode.extend(), st = ot.Encryptor = ot.extend({ processBlock: function (t, e) { var r, i = this._cipher, n = i.blockSize, o = this._iv, s = this._counter; o && (s = this._counter = o.slice(0), this._iv = void 0), 0 === ((r = s)[0] = Et(r[0])) && (r[1] = Et(r[1])); var c = s.slice(0); i.encryptBlock(c, 0); for (var a = 0; a < n; a++)t[e + a] ^= c[a] } }), ot.Decryptor = st, ot), at = (ct = bt).lib.StreamCipher, ht = ct.algo, lt = [], ft = [], dt = [], ut = ht.Rabbit = at.extend({ _doReset: function () { for (var t = this._key.words, e = this.cfg.iv, r = 0; r < 4; r++)t[r] = 16711935 & (t[r] << 8 | t[r] >>> 24) | 4278255360 & (t[r] << 24 | t[r] >>> 8); var i = this._X = [t[0], t[3] << 16 | t[2] >>> 16, t[1], t[0] << 16 | t[3] >>> 16, t[2], t[1] << 16 | t[0] >>> 16, t[3], t[2] << 16 | t[1] >>> 16], n = this._C = [t[2] << 16 | t[2] >>> 16, 4294901760 & t[0] | 65535 & t[1], t[3] << 16 | t[3] >>> 16, 4294901760 & t[1] | 65535 & t[2], t[0] << 16 | t[0] >>> 16, 4294901760 & t[2] | 65535 & t[3], t[1] << 16 | t[1] >>> 16, 4294901760 & t[3] | 65535 & t[0]]; for (r = this._b = 0; r < 4; r++)Rt.call(this); for (r = 0; r < 8; r++)n[r] ^= i[r + 4 & 7]; if (e) { var o = e.words, s = o[0], c = o[1], a = 16711935 & (s << 8 | s >>> 24) | 4278255360 & (s << 24 | s >>> 8), h = 16711935 & (c << 8 | c >>> 24) | 4278255360 & (c << 24 | c >>> 8), l = a >>> 16 | 4294901760 & h, f = h << 16 | 65535 & a; n[0] ^= a, n[1] ^= l, n[2] ^= h, n[3] ^= f, n[4] ^= a, n[5] ^= l, n[6] ^= h, n[7] ^= f; for (r = 0; r < 4; r++)Rt.call(this) } }, _doProcessBlock: function (t, e) { var r = this._X; Rt.call(this), lt[0] = r[0] ^ r[5] >>> 16 ^ r[3] << 16, lt[1] = r[2] ^ r[7] >>> 16 ^ r[5] << 16, lt[2] = r[4] ^ r[1] >>> 16 ^ r[7] << 16, lt[3] = r[6] ^ r[3] >>> 16 ^ r[1] << 16; for (var i = 0; i < 4; i++)lt[i] = 16711935 & (lt[i] << 8 | lt[i] >>> 24) | 4278255360 & (lt[i] << 24 | lt[i] >>> 8), t[e + i] ^= lt[i] }, blockSize: 4, ivSize: 2 }), ct.Rabbit = at._createHelper(ut), bt.mode.CTR = (pt = bt.lib.BlockCipherMode.extend(), _t = pt.Encryptor = pt.extend({ processBlock: function (t, e) { var r = this._cipher, i = r.blockSize, n = this._iv, o = this._counter; n && (o = this._counter = n.slice(0), this._iv = void 0); var s = o.slice(0); r.encryptBlock(s, 0), o[i - 1] = o[i - 1] + 1 | 0; for (var c = 0; c < i; c++)t[e + c] ^= s[c] } }), pt.Decryptor = _t, pt), yt = (vt = bt).lib.StreamCipher, gt = vt.algo, Bt = [], wt = [], kt = [], St = gt.RabbitLegacy = yt.extend({ _doReset: function () { for (var t = this._key.words, e = this.cfg.iv, r = this._X = [t[0], t[3] << 16 | t[2] >>> 16, t[1], t[0] << 16 | t[3] >>> 16, t[2], t[1] << 16 | t[0] >>> 16, t[3], t[2] << 16 | t[1] >>> 16], i = this._C = [t[2] << 16 | t[2] >>> 16, 4294901760 & t[0] | 65535 & t[1], t[3] << 16 | t[3] >>> 16, 4294901760 & t[1] | 65535 & t[2], t[0] << 16 | t[0] >>> 16, 4294901760 & t[2] | 65535 & t[3], t[1] << 16 | t[1] >>> 16, 4294901760 & t[3] | 65535 & t[0]], n = this._b = 0; n < 4; n++)Mt.call(this); for (n = 0; n < 8; n++)i[n] ^= r[n + 4 & 7]; if (e) { var o = e.words, s = o[0], c = o[1], a = 16711935 & (s << 8 | s >>> 24) | 4278255360 & (s << 24 | s >>> 8), h = 16711935 & (c << 8 | c >>> 24) | 4278255360 & (c << 24 | c >>> 8), l = a >>> 16 | 4294901760 & h, f = h << 16 | 65535 & a; i[0] ^= a, i[1] ^= l, i[2] ^= h, i[3] ^= f, i[4] ^= a, i[5] ^= l, i[6] ^= h, i[7] ^= f; for (n = 0; n < 4; n++)Mt.call(this) } }, _doProcessBlock: function (t, e) { var r = this._X; Mt.call(this), Bt[0] = r[0] ^ r[5] >>> 16 ^ r[3] << 16, Bt[1] = r[2] ^ r[7] >>> 16 ^ r[5] << 16, Bt[2] = r[4] ^ r[1] >>> 16 ^ r[7] << 16, Bt[3] = r[6] ^ r[3] >>> 16 ^ r[1] << 16; for (var i = 0; i < 4; i++)Bt[i] = 16711935 & (Bt[i] << 8 | Bt[i] >>> 24) | 4278255360 & (Bt[i] << 24 | Bt[i] >>> 8), t[e + i] ^= Bt[i] }, blockSize: 4, ivSize: 2 }), vt.RabbitLegacy = yt._createHelper(St), bt.pad.ZeroPadding = { pad: function (t, e) { var r = 4 * e; t.clamp(), t.sigBytes += r - (t.sigBytes % r || r) }, unpad: function (t) { var e = t.words, r = t.sigBytes - 1; for (r = t.sigBytes - 1; 0 <= r; r--)if (e[r >>> 2] >>> 24 - r % 4 * 8 & 255) { t.sigBytes = r + 1; break } } }, bt });

function decryptContent(content) {
    if (content.length <= 30) {
        return "";
    }
    const key = CryptoJS.enc.Utf8.parse("KW8Dvm2N");
    const iv = CryptoJS.enc.Utf8.parse("1ae2c94b");
    const ciphertext = CryptoJS.enc.Base64.parse(content);
    const decrypted = CryptoJS.DES.decrypt({ ciphertext }, key, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}


function decode(accesskey, keyString, content) {
    let v43, v38, dest;

    const accesskeyLen = accesskey.length;
    let v9 = 0;
    const v6 = accesskey.charCodeAt(accesskeyLen - 1);
    for (let i = 0; i < accesskeyLen; i++) {
        v9 += accesskey.charCodeAt(i);
    }
    const v15 = v9 % keyString.length;
    const v17 = Math.floor(v9 / 65);
    const v18 = keyString.length;
    if (v17 + v15 > v18) {
        v43 = keyString.substring(v15, (v18 - v17) + v15);
    } else {
        v43 = keyString.substring(v15, v17 + v15);
    }
    const v32 = content.length;
    if (v6 & 1) {
        v38 = content.substring(v32 - 12, v32);
        dest = content.substring(0, v32 - 12);
    } else {
        v38 = content.substring(0, 12);
        dest = content.substring(12, content.length);
    }

    const key = md5Encode(v43 + v38).substring(0, 8);
    const iv = md5Encode(v38).substring(0, 8);

    try {
        content = decryptDES(dest, key, iv);
    } catch (e) {
        console.error(e);
    }

    return content;
}

function md5Encode(input) {
    return CryptoJS.MD5(input).toString();
}

function decryptDES(encrypted, key, iv) {
    const keyHex = CryptoJS.enc.Utf8.parse(key);
    const ivHex = CryptoJS.enc.Utf8.parse(iv);
    const decrypted = CryptoJS.DES.decrypt({
        ciphertext: CryptoJS.enc.Base64.parse(encrypted)
    }, keyHex, {
        iv: ivHex,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}

/* eslint-disable no-debugger  */
/* global $ xhr tranStr JSZip saveAs CryptoJS opentype fflate ort eSearchOCR cv */

// ============================================================================
// Main Userscript Runtime
// ============================================================================

; (function () { // eslint-disable-line no-extra-semi
    // ============================================================================
    // Userscript Integrations & Shared UI Root
    // ============================================================================

    const ND_UI_HOST_ID = 'novel-downloader-shadow-host';
    const ND_DOC_MODAL_ID = 'ndNovelDownloaderDocs';
    const ND_SUPPORTED_SITES_MODAL_ID = 'ndNovelDownloaderSupportedSites';
    const ND_VERIFY_MODAL_ID = 'ndNovelDownloaderVerify';
    const ND_RESUME_CHOICE_MODAL_ID = 'ndNovelDownloaderResumeChoice';
    const ND_NOTICE_MODAL_ID = 'ndNovelDownloaderNotice';
    const ND_LAUNCHER_ID = 'ndNovelDownloaderLauncher';
    const ND_VERSION_NOTICE_KEY = 'ND_MAIN_LAST_VERSION';
    const ND_LAUNCHER_ENABLED_KEY = 'ND_LAUNCHER_ENABLED';
    const ND_LAUNCHER_POSITION_KEY = 'ND_LAUNCHER_POSITION';
    const ND_DEBUG_BRIDGE_CLIENT_URL = 'http://127.0.0.1:17888/nd-debug-bridge.js';
    const ND_RULE_EDITOR_CLIENT_URL = 'http://127.0.0.1:17888/nd-rule-editor.js';
    const ND_RULE_EDITOR_REMOTE_URL = 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/tools/nd-rule-editor/nd-rule-editor.js?v=1.0.1';
    const ND_SUPPORTED_SITES_REMOTE_URL = 'https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/src/rules/supported-sites.json?v=1';
    const ND_SUPPORTED_SITES_CACHE_KEY = 'ND_SUPPORTED_SITES_CACHE_V1';
    function getNovelDownloaderUIRoot(create = false) {
        if (typeof window.__novelDownloaderGetUIRoot === 'function') {
            const root = window.__novelDownloaderGetUIRoot(create);
            if (root) return root;
        }
        let host = document.getElementById(ND_UI_HOST_ID);
        if (!host && create) {
            host = document.createElement('div');
            host.id = ND_UI_HOST_ID;
            (document.body || document.documentElement).appendChild(host);
        }
        if (!host) return null;
        if (!host.shadowRoot && create && typeof host.attachShadow === 'function') {
            host.attachShadow({ mode: 'open' });
        }
        return host.shadowRoot || host;
    }
    function ndUI$(selector) {
        const root = getNovelDownloaderUIRoot(false);
        return root ? $(selector, root) : $();
    }
    function ensureNovelDownloaderUIStyle(id, css) {
        const root = getNovelDownloaderUIRoot(true) || document.head;
        let style = root.querySelector(`#${id}`);
        if (!style) {
            style = document.createElement('style');
            style.id = id;
            root.appendChild(style);
        }
        style.textContent = css;
        return style;
    }
    function ndEscapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    // ============================================================================
    // Download Manager Module
    // ============================================================================

    const downloadManager = window.NDDownloadManager;
    if (!downloadManager || !downloadManager.TaskManager || typeof downloadManager.showManagerUI !== 'function') {
        throw new Error('[ND] nd-download-manager.js chưa được tải đúng cách.');
    }
    const { TaskManager, showManagerUI } = downloadManager;

    const fileSave = window.NDFileSave;
    if (!fileSave || typeof fileSave.saveContent !== 'function') {
        throw new Error('[ND] nd-file-save.js chưa được tải đúng cách.');
    }
    const debugBridge = window.NDDebugBridge || null;

    // ============================================================================
    // Floating Launcher & In-Script Documentation
    // ============================================================================

    function getNovelDownloaderScriptVersion() {
        return GM_info && GM_info.script && GM_info.script.version ? GM_info.script.version : '3.5.448.10';
    }

    function docList(items) {
        return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
    }

    function getNovelDownloaderGuideHtml() {
        return [
            '<h3>Luồng thao tác cơ bản</h3>',
            docList([
                'Mở UI bằng nút nổi <b>Novel Downloader</b>, menu Tampermonkey <b>Download Novel</b>, hoặc nhấp đúp cạnh trái trang.',
                'Bấm <b>Kiểm tra</b> để xem rule nhận chương đúng chưa, sau đó chọn <b>TEXT</b>, <b>EPUB</b> hoặc <b>ZIP</b> để tải.',
                '<b>Phạm vi tải xuống</b> nhận dạng như <code>1-25, 35, 50</code>. <b>Tải xuống hàng loạt</b> dùng khi muốn dán danh sách URL riêng.',
                'Bấm <b>Danh sách hỗ trợ</b> để tải danh sách rule từ repo và tìm nhanh theo domain hoặc tên rule.',
                'Có thể chọn thư mục lưu bằng File System Access API; nếu bật <b>Ghi nhớ</b>, script sẽ thử dùng lại thư mục đó cho cùng link truyện.'
            ]),
            '<h3>Nút nổi Novel Downloader</h3>',
            docList([
                'Nút nổi có thể kéo thả, tự nhớ vị trí và nằm trong Shadow Root để ít bị CSS của web ảnh hưởng.',
                'Khi chưa mở bảng nào, bấm nút sẽ hiện hai lựa chọn: mở giao diện tải hoặc mở Quản lý tải xuống.',
                'Khi UI tải chính đang mở, bấm nút sẽ mở Quản lý tải xuống. Khi Quản lý tải xuống đang mở, bấm nút sẽ mở UI tải chính.',
                'Khi cả hai bảng cùng mở, nút tự ẩn. Có thể bật/tắt nút trong tab <b>Cài đặt</b> của Quản lý tải xuống.'
            ]),
            '<h3>Quản lý tải xuống</h3>',
            docList([
                'Tab <b>Hàng đợi</b> hiển thị truyện đang tải hoặc đang giữ dữ liệu tiếp tục.',
                'Nếu tab bị đóng giữa chừng và script đã lưu được dữ liệu, nút <b>Tiếp tục</b> sẽ mở lại trang truyện và tự tải phần còn lại.',
                'Tab <b>Lịch sử</b> giữ các lượt tải đã kết thúc, kể cả thành công có lỗi chương. Các thẻ cũ hơn 30 ngày được dọn tự động.',
                'Mỗi thẻ có nút copy summary và copy lỗi để gửi log nhanh khi cần debug.'
            ]),
            '<h3>Console trong UI</h3>',
            docList([
                'Script hiện đã bắt <code>console.log/info/warn/error/debug</code> vào bảng Console bên trái, có nút bật/tắt, copy và đóng tạm.',
                'Không còn cần cài thêm <b>NovelDownloader Helper - AntiClear</b>. Việc clear Console trong DevTools không xóa log đã nằm trong bảng UI.',
                'Các log có định dạng <code>%c</code> được giữ màu cơ bản trong bảng Console để dễ nhìn các bước tải.'
            ]),
            '<h3>Debug Bridge</h3>',
            docList([
                'Chạy server local bằng <code>node tools/nd-debug-bridge/server.js</code>, sau đó mở <b>Debug Bridge</b> trong tab Cài đặt của Quản lý tải xuống. Client bridge sẽ được tải từ server local khi bấm mở.',
                'Dashboard local cho phép test selector, xem môi trường, xem rule/book/config, chạy <code>getChapters</code>, <code>deal</code> và eval JS ngay trong tab userscript thật.',
                'CLI debug có thể dùng <code>inject-rule &lt;file&gt;</code> để thử rule trên tab hiện tại, hoặc <code>test-rule &lt;file&gt; &lt;url&gt;</code> để mở tab mới, inject rule test rồi chạy snapshot/getChapters.',
                'Server local cũng phục vụ Rule Editor để test nhanh khi cần chạy bản trong repo hiện tại.',
                'Tính năng này mặc định tắt và dùng token local; chỉ bật khi cần debug rule.'
            ]),
            '<h3>Rule tùy chỉnh</h3>',
            docList([
                'Bấm <b>Quản lý rule</b> trong phần cài đặt nâng cao hoặc tab Cài đặt của Quản lý tải xuống để mở Rule Editor.',
                'Mỗi rule có tên riêng, trạng thái bật/tắt, vùng code riêng, autosave draft, nút kiểm tra cấu trúc và nút áp dụng vào <code>Config.customize</code>.',
                'Rule Editor có template selector/getChapters/deal, chèn nhanh các hàm thường dùng, tìm rule tự tạo và tìm/copy rule gốc để sửa lại.',
                'Dữ liệu áp dụng vẫn tương thích cơ chế cũ: nhận <code>{...}</code>, <code>[{...}]</code> hoặc lệnh <code>Rule.special.push({...});</code>.',
                'Có thể dùng lại helper như <code>helpers.requestDoc</code>, <code>helpers.requestJson</code>, <code>helpers.mapChapters</code>, <code>helpers.absoluteUrl</code> để viết rule nhanh hơn.',
                'Nếu rule cần Cloudflare/cookie, ưu tiên dùng helper tải trang có sẵn thay vì tự viết fetch rời rạc.'
            ]),
            '<h3>Khi gặp lỗi</h3>',
            docList([
                'Mở Quản lý tải xuống để copy summary/lỗi, đồng thời mở bảng Console để xem log chi tiết.',
                'Với lỗi web đổi HTML, chạy <b>Kiểm tra</b> trước để biết đang hỏng mục lục, thông tin sách hay nội dung chương.',
                'Với web chặn request, thử tăng delay giữa chương hoặc tải qua chế độ thủ công nếu rule hỗ trợ.'
            ])
        ].join('');
    }

    function getNovelDownloaderChangelogHtml() {
        return [
            `<h3>v${getNovelDownloaderScriptVersion()}</h3>`,
            docList([
                'Thêm <b>Rule Editor</b> để quản lý nhiều rule tùy chỉnh theo từng mục riêng, có tìm kiếm, bật/tắt, template, chèn hàm nhanh, kiểm tra cấu trúc, export/import và autosave draft.',
                'Rule Editor có thể mở từ UI tải chính hoặc tab Cài đặt của Quản lý tải xuống; khi áp dụng vẫn sinh về <code>Config.customize</code> nên tương thích cơ chế nạp rule cũ.',
                'Sửa Rule Editor: tìm kiếm không mất focus khi đang gõ, chỉnh font/tiêu đề section để hiển thị tiếng Việt rõ hơn.',
                'Thêm rule gốc cho <b>爱丽丝书屋</b>, tự dừng và mở popup khi web yêu cầu nhập mã hoặc chặn cooldown do đọc/tải quá nhanh.',
                'Khi mở UI tải trên một truyện đang có dữ liệu tải dở, script hỏi có muốn nạp lại các chương đã tải không; nếu chọn dùng thì chỉ nạp dữ liệu, không tự bấm tải.',
                'Thêm <b>Danh sách hỗ trợ</b> tải từ repo, có tìm kiếm theo domain hoặc tên rule.',
                'Hoàn thiện <b>Debug Bridge</b> local: test selector/rule, chạy <code>getChapters</code>, <code>deal</code>, eval JS và xem đúng môi trường Tampermonkey thật.',
                'CLI Debug Bridge hỗ trợ inject rule từ file và test rule mới trên URL mới bằng tab trình duyệt thật.',
                'Debug server có thêm endpoint phục vụ Rule Editor để test local bằng bản trong repo hiện tại.',
                'Cải thiện bảng Console và Quản lý tải xuống: giữ log object/error/%c, lưu tiếp tục ổn hơn, đồng bộ tiến độ thật, xóa task treo và giữ task đang tải khi dùng <b>Buộc lưu</b>.'
            ]),
            '<h3>Các bản trước (tóm tắt)</h3>',
            docList([
                'v3.5.448.x: bỏ phụ thuộc AntiClear, thêm nút nổi Novel Downloader, Hướng dẫn/Changelog trong script, tab Cài đặt, thanh tiến độ sticky <b>x / y</b> và xử lý UI ngắn.',
                'v3.5.447.x: đưa UI vào Shadow Root, thêm bảng Console trong UI, cải thiện Quản lý tải xuống, queue/history/resume, dọn thẻ cũ sau 30 ngày.',
                'v3.5.447.x: sửa rule 69shuba, TruyenWikiDich, xử lý encoding trang reader/txt và ưu tiên rule user paste trước rule gốc.',
                'Các bản cũ hơn: bổ sung rule web, cải thiện tải thủ công, tải ảnh/EPUB/TEXT/ZIP và helper viết rule tùy chỉnh.'
            ])
        ].join('');
    }

    function ensureNovelDownloaderDocsModal() {
        const root = getNovelDownloaderUIRoot(true) || document.body;
        ensureNovelDownloaderUIStyle('ndNovelDownloaderDocsStyle', [
            `#${ND_DOC_MODAL_ID}{position:fixed;inset:0;z-index:1000005;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.54);pointer-events:auto;font-family:Arial,sans-serif;color:#111827;}`,
            `#${ND_DOC_MODAL_ID}.is-visible{display:flex;}`,
            `#${ND_DOC_MODAL_ID} .nd-doc-window{width:min(760px,calc(100vw - 28px));max-height:min(780px,calc(100vh - 28px));display:flex;flex-direction:column;background:#f8fafc;border:1px solid rgba(148,163,184,.55);border-radius:12px;box-shadow:0 22px 60px rgba(15,23,42,.34);overflow:hidden;}`,
            `#${ND_DOC_MODAL_ID} .nd-doc-header{display:flex;align-items:center;gap:12px;padding:13px 16px;background:linear-gradient(135deg,#0f172a,#14532d 52%,#7f1d1d);color:#fff;}`,
            `#${ND_DOC_MODAL_ID} .nd-doc-title{font-weight:700;font-size:16px;line-height:1.25;}`,
            `#${ND_DOC_MODAL_ID} .nd-doc-spacer{flex:1 1 auto;}`,
            `#${ND_DOC_MODAL_ID} button{border:1px solid rgba(255,255,255,.35);border-radius:7px;background:rgba(255,255,255,.12);color:#fff;padding:6px 10px;cursor:pointer;font-size:12px;}`,
            `#${ND_DOC_MODAL_ID} button:hover{background:rgba(255,255,255,.22);}`,
            `#${ND_DOC_MODAL_ID} .nd-doc-body{overflow:auto;padding:16px 18px 20px;font-size:13px;line-height:1.55;}`,
            `#${ND_DOC_MODAL_ID} h3{margin:14px 0 7px;font-size:15px;line-height:1.3;color:#0f172a;}`,
            `#${ND_DOC_MODAL_ID} h3:first-child{margin-top:0;}`,
            `#${ND_DOC_MODAL_ID} ul{margin:0 0 8px 18px;padding:0;}`,
            `#${ND_DOC_MODAL_ID} li{margin:4px 0;}`,
            `#${ND_DOC_MODAL_ID} code{background:#e2e8f0;border:1px solid #cbd5e1;border-radius:4px;padding:1px 4px;font-family:Consolas,Menlo,Monaco,"Courier New",monospace;font-size:12px;}`
        ].join(''));
        let modal = root.querySelector(`#${ND_DOC_MODAL_ID}`);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = ND_DOC_MODAL_ID;
            modal.innerHTML = [
                '<div class="nd-doc-window" role="dialog" aria-modal="true">',
                '  <div class="nd-doc-header">',
                '    <span class="nd-doc-title" data-role="title">Hướng dẫn</span>',
                '    <span class="nd-doc-spacer"></span>',
                '    <button type="button" data-action="close-doc">Đóng</button>',
                '  </div>',
                '  <div class="nd-doc-body" data-role="body"></div>',
                '</div>'
            ].join('');
            modal.addEventListener('click', (event) => {
                if (event.target === modal || event.target.closest('[data-action="close-doc"]')) {
                    modal.classList.remove('is-visible');
                }
            });
            root.appendChild(modal);
        }
        return modal;
    }

    function openNovelDownloaderDocModal(title, contentHtml) {
        const modal = ensureNovelDownloaderDocsModal();
        modal.querySelector('[data-role="title"]').textContent = title;
        modal.querySelector('[data-role="body"]').innerHTML = contentHtml;
        modal.classList.add('is-visible');
    }

    function openNovelDownloaderGuide() {
        openNovelDownloaderDocModal('Hướng dẫn Novel Downloader', getNovelDownloaderGuideHtml());
    }

    function openNovelDownloaderChangelog() {
        openNovelDownloaderDocModal('Changelog Novel Downloader', getNovelDownloaderChangelogHtml());
    }

    function isHiddenSupportedSiteEntry(site = {}) {
        const text = [
            site.name,
            site.siteName,
            site.ruleName,
            site.file,
            ...(Array.isArray(site.domains) ? site.domains : [])
        ].join(' ').toLowerCase();
        const hiddenNeedles = [
            String.fromCharCode(115, 97, 110, 103, 116, 97, 99, 118, 105, 101, 116),
            String.fromCharCode(115, 97, 110, 103, 32, 116, 97, 99, 32, 118, 105, 101, 116),
            String.fromCharCode(115, 225, 110, 103, 32, 116, 225, 99, 32, 118, 105, 7879, 116)
        ];
        return hiddenNeedles.some(needle => text.includes(needle));
    }

    function normalizeSupportedSitesPayload(payload) {
        const sites = Array.isArray(payload) ? payload : (Array.isArray(payload && payload.sites) ? payload.sites : []);
        const normalizedSites = sites
            .map((site = {}) => {
                const domains = Array.isArray(site.domains)
                    ? site.domains.map(domain => String(domain || '').trim()).filter(Boolean)
                    : [];
                return {
                    name: String(site.name || site.siteName || site.ruleName || site.file || 'Chưa đặt tên').trim(),
                    ruleName: String(site.ruleName || site.name || site.siteName || site.file || '').trim(),
                    file: String(site.file || '').trim(),
                    kind: String(site.kind || 'special').trim(),
                    domains: Array.from(new Set(domains)).sort()
                };
            })
            .filter(site => site.name && !isHiddenSupportedSiteEntry(site));
        return Object.assign({}, payload && typeof payload === 'object' ? payload : {}, {
            sites: normalizedSites
        });
    }

    function requestSupportedSitesRemote() {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${ND_SUPPORTED_SITES_REMOTE_URL}&t=${Date.now()}`,
                timeout: 15000,
                onload: (response) => {
                    if (!response || response.status < 200 || response.status >= 300) {
                        reject(new Error(`HTTP ${response && response.status}`));
                        return;
                    }
                    try {
                        resolve(JSON.parse(response.responseText || '{}'));
                    } catch (error) {
                        reject(error);
                    }
                },
                onerror: () => reject(new Error('Không thể tải danh sách hỗ trợ.')),
                ontimeout: () => reject(new Error('Tải danh sách hỗ trợ quá thời gian chờ.'))
            });
        });
    }

    async function loadNovelDownloaderSupportedSites() {
        try {
            const payload = normalizeSupportedSitesPayload(await requestSupportedSitesRemote());
            if (payload.sites.length) {
                await GM_setValue(ND_SUPPORTED_SITES_CACHE_KEY, payload);
            }
            return { payload, fromCache: false };
        } catch (error) {
            const cached = await GM_getValue(ND_SUPPORTED_SITES_CACHE_KEY, null);
            if (cached) {
                return { payload: normalizeSupportedSitesPayload(cached), fromCache: true, error };
            }
            throw error;
        }
    }

    function ensureNovelDownloaderSupportedSitesModal() {
        const root = getNovelDownloaderUIRoot(true) || document.body;
        ensureNovelDownloaderUIStyle('ndNovelDownloaderSupportedSitesStyle', [
            `#${ND_SUPPORTED_SITES_MODAL_ID}{position:fixed;inset:0;z-index:1000006;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.54);pointer-events:auto;font-family:Arial,sans-serif;color:#111827;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID}.is-visible{display:flex;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} .nd-supported-window{width:min(820px,calc(100vw - 28px));max-height:min(780px,calc(100vh - 28px));display:flex;flex-direction:column;background:#f8fafc;border:1px solid rgba(148,163,184,.55);border-radius:12px;box-shadow:0 22px 60px rgba(15,23,42,.34);overflow:hidden;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} .nd-supported-header{display:flex;align-items:center;gap:12px;padding:13px 16px;background:#0f172a;color:#fff;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} .nd-supported-title{font-weight:700;font-size:16px;line-height:1.25;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} .nd-supported-spacer{flex:1 1 auto;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} button{border:1px solid rgba(255,255,255,.35);border-radius:7px;background:rgba(255,255,255,.12);color:#fff;padding:6px 10px;cursor:pointer;font-size:12px;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} button:hover{background:rgba(255,255,255,.22);}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} .nd-supported-toolbar{display:grid;gap:8px;padding:12px 14px;border-bottom:1px solid #e2e8f0;background:#eef2ff;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} input{width:100%;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#0f172a;padding:8px 10px;font-size:13px;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} .nd-supported-meta{font-size:12px;color:#475569;line-height:1.4;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} .nd-supported-body{overflow:auto;padding:12px 14px 16px;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} .nd-supported-status{font-size:13px;color:#475569;padding:10px;border:1px dashed #cbd5e1;border-radius:8px;background:#fff;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} .nd-supported-list{display:grid;gap:8px;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} .nd-supported-row{display:grid;gap:5px;padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} .nd-supported-name{font-size:14px;font-weight:700;color:#0f172a;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} .nd-supported-domains{display:flex;flex-wrap:wrap;gap:5px;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} .nd-supported-domain{display:inline-flex;align-items:center;border:1px solid #cbd5e1;border-radius:999px;background:#f8fafc;color:#334155;padding:2px 7px;font-size:12px;line-height:1.4;}`,
            `#${ND_SUPPORTED_SITES_MODAL_ID} .nd-supported-file{font-size:12px;color:#64748b;word-break:break-all;font-family:Consolas,Menlo,Monaco,"Courier New",monospace;}`
        ].join(''));
        let modal = root.querySelector(`#${ND_SUPPORTED_SITES_MODAL_ID}`);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = ND_SUPPORTED_SITES_MODAL_ID;
            modal.innerHTML = [
                '<div class="nd-supported-window" role="dialog" aria-modal="true">',
                '  <div class="nd-supported-header">',
                '    <span class="nd-supported-title">Danh sách web hỗ trợ</span>',
                '    <span class="nd-supported-spacer"></span>',
                '    <button type="button" data-action="close-supported-sites">Đóng</button>',
                '  </div>',
                '  <div class="nd-supported-toolbar">',
                '    <input data-role="search" autocomplete="off" placeholder="Tìm theo domain hoặc tên rule">',
                '    <div class="nd-supported-meta" data-role="meta">Đang tải danh sách từ repo...</div>',
                '  </div>',
                '  <div class="nd-supported-body">',
                '    <div class="nd-supported-status" data-role="status">Đang tải...</div>',
                '    <div class="nd-supported-list" data-role="list"></div>',
                '  </div>',
                '</div>'
            ].join('');
            modal.addEventListener('click', (event) => {
                if (event.target === modal || event.target.closest('[data-action="close-supported-sites"]')) {
                    modal.classList.remove('is-visible');
                }
            });
            root.appendChild(modal);
        }
        return modal;
    }

    async function openNovelDownloaderSupportedSites() {
        const modal = ensureNovelDownloaderSupportedSitesModal();
        const input = modal.querySelector('[data-role="search"]');
        const meta = modal.querySelector('[data-role="meta"]');
        const status = modal.querySelector('[data-role="status"]');
        const list = modal.querySelector('[data-role="list"]');
        const state = { sites: [], query: '' };
        const render = () => {
            const query = String(input.value || '').trim().toLowerCase();
            const matched = !query ? state.sites : state.sites.filter((site) => [
                site.name,
                site.ruleName,
                site.file,
                ...(site.domains || [])
            ].join(' ').toLowerCase().includes(query));
            meta.textContent = `Hiển thị ${matched.length}/${state.sites.length} rule${modal.dataset.updatedAt ? ` - cập nhật ${modal.dataset.updatedAt}` : ''}${modal.dataset.fromCache === '1' ? ' - bản cache' : ''}.`;
            status.style.display = matched.length ? 'none' : 'block';
            status.textContent = state.sites.length ? 'Không tìm thấy rule phù hợp.' : 'Chưa có dữ liệu.';
            list.innerHTML = matched.map((site) => {
                const domains = (site.domains || []).map(domain => `<span class="nd-supported-domain">${ndEscapeHtml(domain)}</span>`).join('');
                return [
                    '<div class="nd-supported-row">',
                    `  <div class="nd-supported-name">${ndEscapeHtml(site.name)}</div>`,
                    `  <div class="nd-supported-domains">${domains || '<span class="nd-supported-domain">Chưa rõ domain</span>'}</div>`,
                    `  <div class="nd-supported-file">${ndEscapeHtml(site.file || site.kind || '')}</div>`,
                    '</div>'
                ].join('');
            }).join('');
        };
        input.value = '';
        input.disabled = true;
        input.oninput = render;
        status.style.display = 'block';
        status.textContent = 'Đang tải danh sách từ repo...';
        list.innerHTML = '';
        meta.textContent = 'Đang tải danh sách từ repo...';
        modal.dataset.updatedAt = '';
        modal.dataset.fromCache = '0';
        modal.classList.add('is-visible');
        try {
            const { payload, fromCache, error } = await loadNovelDownloaderSupportedSites();
            state.sites = payload.sites || [];
            modal.dataset.updatedAt = payload.updatedAt || '';
            modal.dataset.fromCache = fromCache ? '1' : '0';
            input.disabled = false;
            render();
            if (fromCache && error) {
                status.style.display = 'block';
                status.textContent = `Không tải được bản mới, đang dùng cache. ${error.message || error}`;
            }
            input.focus();
        } catch (error) {
            input.disabled = false;
            status.style.display = 'block';
            status.textContent = `Không tải được danh sách hỗ trợ: ${error.message || error}`;
            meta.textContent = 'Chưa có dữ liệu.';
        }
    }

    function ensureNovelDownloaderVerifyModal() {
        const root = getNovelDownloaderUIRoot(true) || document.body;
        ensureNovelDownloaderUIStyle('ndNovelDownloaderVerifyStyle', [
            `#${ND_VERIFY_MODAL_ID}{position:fixed;inset:0;z-index:1000008;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.55);pointer-events:auto;font-family:"Segoe UI",Arial,"Noto Sans",sans-serif;color:#111827;}`,
            `#${ND_VERIFY_MODAL_ID}.is-visible{display:flex;}`,
            `#${ND_VERIFY_MODAL_ID} .nd-verify-window{width:min(430px,calc(100vw - 28px));background:#f8fafc;border:1px solid rgba(148,163,184,.65);border-radius:12px;box-shadow:0 22px 60px rgba(15,23,42,.34);overflow:hidden;}`,
            `#${ND_VERIFY_MODAL_ID} .nd-verify-header{display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(135deg,#111827,#0f766e);color:#fff;}`,
            `#${ND_VERIFY_MODAL_ID} .nd-verify-title{font-size:15px;font-weight:800;line-height:1.3;}`,
            `#${ND_VERIFY_MODAL_ID} .nd-verify-body{display:grid;gap:12px;padding:15px;}`,
            `#${ND_VERIFY_MODAL_ID} .nd-verify-message{font-size:13px;line-height:1.5;color:#334155;}`,
            `#${ND_VERIFY_MODAL_ID} .nd-verify-image-row{display:flex;gap:8px;align-items:center;}`,
            `#${ND_VERIFY_MODAL_ID} .nd-verify-image{height:46px;min-width:112px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;object-fit:contain;}`,
            `#${ND_VERIFY_MODAL_ID} input{width:100%;height:40px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#0f172a;padding:0 10px;font-size:15px;}`,
            `#${ND_VERIFY_MODAL_ID} .nd-verify-actions{display:flex;justify-content:flex-end;gap:8px;}`,
            `#${ND_VERIFY_MODAL_ID} button{border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#0f172a;padding:7px 10px;cursor:pointer;font-size:12px;font-weight:700;}`,
            `#${ND_VERIFY_MODAL_ID} button:hover{background:#eff6ff;border-color:#93c5fd;}`,
            `#${ND_VERIFY_MODAL_ID} button.primary{background:#0f766e;border-color:#14b8a6;color:#fff;}`
        ].join(''));
        let modal = root.querySelector(`#${ND_VERIFY_MODAL_ID}`);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = ND_VERIFY_MODAL_ID;
            modal.innerHTML = [
                '<form class="nd-verify-window" data-role="form">',
                '  <div class="nd-verify-header">',
                '    <span class="nd-verify-title" data-role="title">Xác minh truy cập</span>',
                '  </div>',
                '  <div class="nd-verify-body">',
                '    <div class="nd-verify-message" data-role="message"></div>',
                '    <div class="nd-verify-image-row">',
                '      <img class="nd-verify-image" data-role="image" alt="captcha">',
                '      <button type="button" data-action="refresh">Đổi ảnh</button>',
                '    </div>',
                '    <input data-role="code" autocomplete="off" placeholder="Nhập mã trong ảnh">',
                '    <div class="nd-verify-actions">',
                '      <button type="button" data-action="cancel">Hủy</button>',
                '      <button type="submit" class="primary">Tiếp tục</button>',
                '    </div>',
                '  </div>',
                '</form>'
            ].join('');
            root.appendChild(modal);
        }
        return modal;
    }

    function refreshNovelDownloaderVerifyImage(img, imageUrl) {
        try {
            const url = new URL(imageUrl, window.location.href);
            url.searchParams.set('t', Date.now());
            img.src = url.href;
        } catch (error) {
            img.src = imageUrl;
        }
    }

    function requestNovelDownloaderVerificationCode(options = {}) {
        return new Promise((resolve, reject) => {
            const modal = ensureNovelDownloaderVerifyModal();
            const form = modal.querySelector('[data-role="form"]');
            const title = modal.querySelector('[data-role="title"]');
            const message = modal.querySelector('[data-role="message"]');
            const img = modal.querySelector('[data-role="image"]');
            const input = modal.querySelector('[data-role="code"]');
            const imageUrl = options.imageUrl || '';
            const cleanup = () => {
                form.removeEventListener('submit', onSubmit);
                modal.removeEventListener('click', onClick);
                modal.classList.remove('is-visible');
            };
            const onSubmit = (event) => {
                event.preventDefault();
                const code = input.value.trim();
                if (!code) {
                    input.focus();
                    return;
                }
                cleanup();
                resolve(code);
            };
            const onClick = (event) => {
                const action = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
                if (!action || !modal.contains(action)) return;
                if (action.dataset.action === 'refresh') {
                    event.preventDefault();
                    refreshNovelDownloaderVerifyImage(img, imageUrl);
                } else if (action.dataset.action === 'cancel') {
                    event.preventDefault();
                    cleanup();
                    const error = new Error('Đã hủy nhập mã xác minh.');
                    error.ndVerificationCancelled = true;
                    reject(error);
                }
            };
            title.textContent = options.title || 'Xác minh truy cập';
            message.textContent = options.message || 'Trang yêu cầu nhập mã xác minh trước khi tiếp tục tải.';
            input.value = '';
            refreshNovelDownloaderVerifyImage(img, imageUrl);
            form.addEventListener('submit', onSubmit);
            modal.addEventListener('click', onClick);
            modal.classList.add('is-visible');
            window.setTimeout(() => input.focus(), 0);
        });
    }

    function ensureNovelDownloaderResumeChoiceModal() {
        const root = getNovelDownloaderUIRoot(true) || document.body;
        ensureNovelDownloaderUIStyle('ndNovelDownloaderResumeChoiceStyle', [
            `#${ND_RESUME_CHOICE_MODAL_ID}{position:fixed;inset:0;z-index:1000007;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.52);pointer-events:auto;font-family:"Segoe UI",Arial,"Noto Sans",sans-serif;color:#111827;}`,
            `#${ND_RESUME_CHOICE_MODAL_ID}.is-visible{display:flex;}`,
            `#${ND_RESUME_CHOICE_MODAL_ID} .nd-resume-window{width:min(460px,calc(100vw - 28px));background:#f8fafc;border:1px solid rgba(148,163,184,.7);border-radius:12px;box-shadow:0 22px 60px rgba(15,23,42,.32);overflow:hidden;}`,
            `#${ND_RESUME_CHOICE_MODAL_ID} .nd-resume-header{padding:12px 14px;background:linear-gradient(135deg,#0f172a,#2563eb);color:#fff;font-size:15px;font-weight:800;line-height:1.35;}`,
            `#${ND_RESUME_CHOICE_MODAL_ID} .nd-resume-body{display:grid;gap:10px;padding:15px;}`,
            `#${ND_RESUME_CHOICE_MODAL_ID} .nd-resume-message{font-size:13px;line-height:1.5;color:#334155;}`,
            `#${ND_RESUME_CHOICE_MODAL_ID} .nd-resume-meta{display:grid;gap:5px;padding:10px;border:1px solid #dbeafe;border-radius:8px;background:#eff6ff;color:#1e3a8a;font-size:12px;line-height:1.45;word-break:break-word;}`,
            `#${ND_RESUME_CHOICE_MODAL_ID} .nd-resume-meta b{color:#0f172a;}`,
            `#${ND_RESUME_CHOICE_MODAL_ID} .nd-resume-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:2px;}`,
            `#${ND_RESUME_CHOICE_MODAL_ID} button{border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#0f172a;padding:8px 11px;cursor:pointer;font-size:12px;font-weight:800;}`,
            `#${ND_RESUME_CHOICE_MODAL_ID} button:hover{background:#eff6ff;border-color:#93c5fd;}`,
            `#${ND_RESUME_CHOICE_MODAL_ID} button.primary{background:#2563eb;border-color:#2563eb;color:#fff;}`
        ].join(''));
        let modal = root.querySelector(`#${ND_RESUME_CHOICE_MODAL_ID}`);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = ND_RESUME_CHOICE_MODAL_ID;
            modal.innerHTML = [
                '<div class="nd-resume-window" role="dialog" aria-modal="true">',
                '  <div class="nd-resume-header">Có dữ liệu tải dở</div>',
                '  <div class="nd-resume-body">',
                '    <div class="nd-resume-message" data-role="message"></div>',
                '    <div class="nd-resume-meta">',
                '      <div><b>Sách:</b> <span data-role="book"></span></div>',
                '      <div><b>Tiến độ đã lưu:</b> <span data-role="progress"></span></div>',
                '      <div><b>Nguồn:</b> <span data-role="source"></span></div>',
                '    </div>',
                '    <div class="nd-resume-actions">',
                '      <button type="button" data-action="new">Tải mới</button>',
                '      <button type="button" class="primary" data-action="use">Dùng dữ liệu</button>',
                '    </div>',
                '  </div>',
                '</div>'
            ].join('');
            root.appendChild(modal);
        }
        return modal;
    }

    function requestNovelDownloaderResumeChoice(candidate = {}) {
        return new Promise((resolve) => {
            const modal = ensureNovelDownloaderResumeChoiceModal();
            const task = candidate.task || {};
            const data = candidate.data || {};
            const bookTitle = (data.book && data.book.title) || task.bookTitle || Storage.book.title || document.title || 'Chưa có tên sách';
            const total = candidate.total || (data.chapters && data.chapters.length) || (task.progress && task.progress.total) || 0;
            const loaded = candidate.loadedCount || 0;
            const sourceUrl = task.sourceUrl || data.sourceUrl || window.location.href;
            modal.querySelector('[data-role="message"]').textContent = 'Truyện này có dữ liệu tải dở trước đó. Chọn "Dùng dữ liệu" để nạp các chương đã tải vào UI hiện tại, rồi tự chỉnh thiết lập và tự bấm tải tiếp.';
            modal.querySelector('[data-role="book"]').textContent = bookTitle;
            modal.querySelector('[data-role="progress"]').textContent = `${loaded}/${total} chương`;
            modal.querySelector('[data-role="source"]').textContent = sourceUrl;
            const cleanup = () => {
                modal.removeEventListener('click', onClick);
                modal.classList.remove('is-visible');
            };
            const onClick = (event) => {
                const action = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
                if (!action || !modal.contains(action)) return;
                cleanup();
                resolve(action.dataset.action === 'use');
            };
            modal.addEventListener('click', onClick);
            modal.classList.add('is-visible');
        });
    }

    function ensureNovelDownloaderNoticeModal() {
        const root = getNovelDownloaderUIRoot(true) || document.body;
        ensureNovelDownloaderUIStyle('ndNovelDownloaderNoticeStyle', [
            `#${ND_NOTICE_MODAL_ID}{position:fixed;inset:0;z-index:1000009;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.55);pointer-events:auto;font-family:"Segoe UI",Arial,"Noto Sans",sans-serif;color:#111827;}`,
            `#${ND_NOTICE_MODAL_ID}.is-visible{display:flex;}`,
            `#${ND_NOTICE_MODAL_ID} .nd-notice-window{width:min(460px,calc(100vw - 28px));background:#f8fafc;border:1px solid rgba(148,163,184,.7);border-radius:12px;box-shadow:0 22px 60px rgba(15,23,42,.34);overflow:hidden;}`,
            `#${ND_NOTICE_MODAL_ID} .nd-notice-header{padding:12px 14px;background:linear-gradient(135deg,#7f1d1d,#b45309);color:#fff;font-size:15px;font-weight:800;line-height:1.35;}`,
            `#${ND_NOTICE_MODAL_ID} .nd-notice-body{display:grid;gap:12px;padding:15px;}`,
            `#${ND_NOTICE_MODAL_ID} .nd-notice-message{font-size:13px;line-height:1.55;color:#334155;white-space:pre-wrap;word-break:break-word;}`,
            `#${ND_NOTICE_MODAL_ID} .nd-notice-actions{display:flex;justify-content:flex-end;gap:8px;}`,
            `#${ND_NOTICE_MODAL_ID} button{border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#0f172a;padding:8px 11px;cursor:pointer;font-size:12px;font-weight:800;}`,
            `#${ND_NOTICE_MODAL_ID} button:hover{background:#fffbeb;border-color:#f59e0b;}`,
            `#${ND_NOTICE_MODAL_ID} button.primary{background:#b45309;border-color:#b45309;color:#fff;}`
        ].join(''));
        let modal = root.querySelector(`#${ND_NOTICE_MODAL_ID}`);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = ND_NOTICE_MODAL_ID;
            modal.innerHTML = [
                '<div class="nd-notice-window" role="dialog" aria-modal="true">',
                '  <div class="nd-notice-header" data-role="title">Thông báo</div>',
                '  <div class="nd-notice-body">',
                '    <div class="nd-notice-message" data-role="message"></div>',
                '    <div class="nd-notice-actions">',
                '      <button type="button" class="primary" data-action="ok">Đã hiểu</button>',
                '    </div>',
                '  </div>',
                '</div>'
            ].join('');
            root.appendChild(modal);
        }
        return modal;
    }

    function showNovelDownloaderNotice(options = {}) {
        return new Promise((resolve) => {
            const modal = ensureNovelDownloaderNoticeModal();
            modal.querySelector('[data-role="title"]').textContent = options.title || 'Thông báo';
            modal.querySelector('[data-role="message"]').textContent = options.message || '';
            const cleanup = () => {
                modal.removeEventListener('click', onClick);
                modal.classList.remove('is-visible');
            };
            const onClick = (event) => {
                const action = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
                if (!action || !modal.contains(action)) return;
                cleanup();
                resolve(action.dataset.action || 'ok');
            };
            modal.addEventListener('click', onClick);
            modal.classList.add('is-visible');
        });
    }

    function loadNovelDownloaderDebugBridgeClient() {
        const bridge = window.NDDebugBridge || debugBridge;
        if (bridge && typeof bridge.openPanel === 'function') return Promise.resolve(bridge);
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: ND_DEBUG_BRIDGE_CLIENT_URL,
                timeout: 10000,
                onload: (res) => {
                    if (res.status < 200 || res.status >= 300) {
                        reject(new Error(`Debug Bridge server trả HTTP ${res.status}`));
                        return;
                    }
                    try {
                        const install = new Function(
                            'window',
                            'document',
                            'GM_getValue',
                            'GM_setValue',
                            'GM_xmlhttpRequest',
                            'GM_openInTab',
                            'unsafeWindow',
                            'CryptoJS',
                            `${res.responseText}\nreturn window.NDDebugBridge;`
                        );
                        const loadedBridge = install(
                            window,
                            document,
                            GM_getValue,
                            GM_setValue,
                            GM_xmlhttpRequest,
                            typeof GM_openInTab !== 'undefined' ? GM_openInTab : undefined,
                            unsafeWindow,
                            CryptoJS
                        );
                        registerNovelDownloaderDebugBridge();
                        resolve(loadedBridge || window.NDDebugBridge);
                    } catch (error) {
                        reject(error);
                    }
                },
                onerror: () => reject(new Error('Không tải được Debug Bridge client từ server local.')),
                ontimeout: () => reject(new Error('Timeout khi tải Debug Bridge client từ server local.'))
            });
        });
    }

    async function openNovelDownloaderDebugBridge() {
        const bridge = window.NDDebugBridge || debugBridge;
        if (bridge && typeof bridge.openPanel === 'function') {
            bridge.openPanel();
            return;
        }
        try {
            const loadedBridge = await loadNovelDownloaderDebugBridgeClient();
            if (loadedBridge && typeof loadedBridge.openPanel === 'function') {
                loadedBridge.openPanel();
            } else {
                throw new Error('Debug Bridge client không export đúng API.');
            }
        } catch (error) {
            alert(`Không mở được Debug Bridge.\n\nChạy server trước:\nnode tools/nd-debug-bridge/server.js\n\nChi tiết: ${error.message || error}`);
        }
    }

    function autoLoadNovelDownloaderDebugBridge() {
        let debugSettings = null;
        try {
            debugSettings = GM_getValue('nd_debug_bridge_settings', null);
        } catch (error) {
            debugSettings = null;
        }
        if (!debugSettings || !debugSettings.enabled) return;
        loadNovelDownloaderDebugBridgeClient()
            .then((bridge) => {
                if (bridge && typeof bridge.connect === 'function' && !bridge.isConnected()) {
                    bridge.connect(debugSettings);
                }
            })
            .catch((error) => {
                console.warn('[ND] Không auto-load được Debug Bridge:', error);
            });
    }

    function getNovelDownloaderRuleEditor() {
        return window.NDRuleEditor
            || (typeof unsafeWindow !== 'undefined' && unsafeWindow.NDRuleEditor)
            || null;
    }

    function fetchNovelDownloaderRuleEditorScript(url, timeout = 10000) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                timeout,
                onload: (res) => {
                    if (res.status < 200 || res.status >= 300) {
                        reject(new Error(`${url} trả HTTP ${res.status}`));
                        return;
                    }
                    resolve(res.responseText || res.response || '');
                },
                onerror: () => reject(new Error(`Không tải được ${url}`)),
                ontimeout: () => reject(new Error(`Timeout khi tải ${url}`))
            });
        });
    }

    async function loadNovelDownloaderRuleEditorClient() {
        const existingEditor = getNovelDownloaderRuleEditor();
        if (existingEditor && typeof existingEditor.open === 'function') return existingEditor;

        const urls = [
            { url: ND_RULE_EDITOR_CLIENT_URL, timeout: 2500 },
            { url: ND_RULE_EDITOR_REMOTE_URL, timeout: 10000 }
        ];
        let lastError = null;
        for (const item of urls) {
            try {
                const code = await fetchNovelDownloaderRuleEditorScript(item.url, item.timeout);
                const install = new Function(
                    'window',
                    'document',
                    'GM_getValue',
                    'GM_setValue',
                    'unsafeWindow',
                    `${code}\nreturn window.NDRuleEditor;`
                );
                const loadedEditor = install(window, document, GM_getValue, GM_setValue, unsafeWindow);
                const editor = loadedEditor || getNovelDownloaderRuleEditor();
                if (editor && typeof editor.open === 'function') return editor;
                lastError = new Error(`${item.url} không export đúng API.`);
            } catch (error) {
                lastError = error;
            }
        }
        throw lastError || new Error('Không tải được Rule Editor.');
    }

    function getCustomRuleSummaryText() {
        const customize = typeof Config !== 'undefined' ? String(Config.customize || '').trim() : '';
        const editor = getNovelDownloaderRuleEditor();
        if (editor && typeof editor.getSummary === 'function') {
            return editor.getSummary(customize);
        }
        if (!customize || customize === '[]') return 'Chưa có rule tùy chỉnh';
        if (customize.includes('Generated by Novel Downloader Rule Editor')) return 'Đang dùng Rule Editor';
        return 'Đang dùng rule tùy chỉnh cũ';
    }

    function syncCustomRuleEditorUi(container) {
        if (!container) return;
        const $container = container.jquery ? container : $(container);
        $container.find('[name="config"] [name="customize"]').val(Config.customize || '[]');
        $container.find('[name="customize-summary"]').text(getCustomRuleSummaryText());
    }

    async function openNovelDownloaderRuleEditor(options = {}) {
        try {
            const editor = await loadNovelDownloaderRuleEditorClient();
            if (!editor || typeof editor.open !== 'function') {
                throw new Error('Rule Editor không export đúng API.');
            }
            editor.open({
                currentCustomize: Config.customize,
                getBuiltInRules: () => Array.isArray(Rule.special)
                    ? Rule.special.filter(rule => rule && !rule.__ndCustomRule)
                    : [],
                onApply: (customize, meta = {}) => {
                    Config.customize = customize || '[]';
                    GM_setValue('config', Config);
                    if (options.container) syncCustomRuleEditorUi(options.container);
                    console.log(`[ND] Đã áp dụng ${meta.enabledCount || 0}/${meta.totalCount || 0} rule tùy chỉnh từ Rule Editor.`);
                }
            });
        } catch (error) {
            alert(`Không mở được Rule Editor.\n\nNếu muốn test bằng server local, chạy:\nnode tools/nd-debug-bridge/server.js\n\nChi tiết: ${error.message || error}`);
        }
    }

    function openNovelDownloaderGuideWithChangelog() {
        openNovelDownloaderDocModal(
            'Hướng dẫn & Changelog Novel Downloader',
            `${getNovelDownloaderGuideHtml()}<h3>Changelog</h3>${getNovelDownloaderChangelogHtml()}`
        );
    }

    function maybeShowNovelDownloaderVersionNotice() {
        const version = getNovelDownloaderScriptVersion();
        const lastVersion = GM_getValue(ND_VERSION_NOTICE_KEY, '');
        if (lastVersion === version) return;
        GM_setValue(ND_VERSION_NOTICE_KEY, version);
        if (lastVersion) {
            openNovelDownloaderChangelog();
        } else {
            openNovelDownloaderGuideWithChangelog();
        }
    }

    function isUiElementVisible(element) {
        if (!element || !element.isConnected) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }

    function isNovelDownloaderMainVisible() {
        const root = getNovelDownloaderUIRoot(false);
        return isUiElementVisible(root && root.querySelector('.novel-downloader-v3'));
    }

    function isNovelDownloaderManagerVisible() {
        if (downloadManager && typeof downloadManager.isManagerVisible === 'function') {
            return downloadManager.isManagerVisible();
        }
        const root = getNovelDownloaderUIRoot(false);
        return isUiElementVisible(root && root.querySelector('#nd-manager-overlay'));
    }

    function isNovelDownloaderLauncherEnabled() {
        return GM_getValue(ND_LAUNCHER_ENABLED_KEY, true) !== false;
    }

    function setNovelDownloaderLauncherEnabled(enabled) {
        GM_setValue(ND_LAUNCHER_ENABLED_KEY, Boolean(enabled));
        updateNovelDownloaderLauncherVisibility();
        return Boolean(enabled);
    }

    function normalizeLauncherPosition(position) {
        const viewportWidth = Math.max(320, window.innerWidth || 320);
        const viewportHeight = Math.max(320, window.innerHeight || 320);
        const fallback = {
            left: Math.max(12, viewportWidth - 222),
            top: Math.max(12, viewportHeight - 86)
        };
        const raw = position && typeof position === 'object' ? position : fallback;
        const left = Number(raw.left);
        const top = Number(raw.top);
        return {
            left: Math.min(Math.max(Number.isFinite(left) ? left : fallback.left, 8), viewportWidth - 56),
            top: Math.min(Math.max(Number.isFinite(top) ? top : fallback.top, 8), viewportHeight - 48)
        };
    }

    function applyLauncherPosition(launcher, position) {
        const normalized = normalizeLauncherPosition(position);
        launcher.style.left = `${normalized.left}px`;
        launcher.style.top = `${normalized.top}px`;
        launcher.style.right = 'auto';
        launcher.style.bottom = 'auto';
        return normalized;
    }

    function closeNovelDownloaderLauncherMenu() {
        const root = getNovelDownloaderUIRoot(false);
        const launcher = root && root.querySelector(`#${ND_LAUNCHER_ID}`);
        if (launcher) launcher.classList.remove('is-open');
    }

    async function openNovelDownloaderMainUi() {
        const resumeRequest = await getPendingResumeRequest();
        init();
        await showUI({ resumeRequest });
        updateNovelDownloaderLauncherVisibility();
    }

    async function openNovelDownloaderManagerUi() {
        await showManagerUI();
        updateNovelDownloaderLauncherVisibility();
    }

    function ensureNovelDownloaderLauncher() {
        const root = getNovelDownloaderUIRoot(true) || document.body;
        ensureNovelDownloaderUIStyle('ndNovelDownloaderLauncherStyle', [
            `#${ND_LAUNCHER_ID}{position:fixed;left:18px;top:18px;z-index:1000004;display:none;pointer-events:auto;font-family:Arial,sans-serif;user-select:none;}`,
            `#${ND_LAUNCHER_ID}.is-open .nd-launcher-menu{display:flex;}`,
            `#${ND_LAUNCHER_ID} .nd-launcher-main{display:flex;align-items:center;gap:8px;min-width:178px;height:42px;border:1px solid rgba(255,255,255,.32);border-radius:999px;background:linear-gradient(135deg,#0ea5e9 0%,#16a34a 48%,#f97316 100%);color:#fff;box-shadow:0 12px 28px rgba(15,23,42,.28),inset 0 1px 0 rgba(255,255,255,.28);cursor:grab;padding:0 14px 0 8px;font-size:13px;font-weight:700;letter-spacing:0;}`,
            `#${ND_LAUNCHER_ID}.is-dragging .nd-launcher-main{cursor:grabbing;}`,
            `#${ND_LAUNCHER_ID} .nd-launcher-main:hover{filter:saturate(1.08) brightness(1.02);}`,
            `#${ND_LAUNCHER_ID} .nd-launcher-mark{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:rgba(15,23,42,.28);border:1px solid rgba(255,255,255,.38);font-size:12px;font-weight:800;}`,
            `#${ND_LAUNCHER_ID} .nd-launcher-menu{display:none;position:absolute;right:0;top:50px;min-width:220px;flex-direction:column;gap:6px;padding:8px;background:rgba(248,250,252,.97);border:1px solid rgba(148,163,184,.58);border-radius:10px;box-shadow:0 16px 36px rgba(15,23,42,.28);}`,
            `#${ND_LAUNCHER_ID} .nd-launcher-menu:before{content:"";position:absolute;right:24px;top:-7px;width:12px;height:12px;background:rgba(248,250,252,.97);border-left:1px solid rgba(148,163,184,.58);border-top:1px solid rgba(148,163,184,.58);transform:rotate(45deg);}`,
            `#${ND_LAUNCHER_ID} .nd-launcher-menu button{position:relative;border:1px solid #dbeafe;border-radius:8px;background:#fff;color:#0f172a;text-align:left;padding:9px 10px;cursor:pointer;font-size:13px;font-weight:600;}`,
            `#${ND_LAUNCHER_ID} .nd-launcher-menu button:hover{background:#eff6ff;border-color:#93c5fd;}`
        ].join(''));
        let launcher = root.querySelector(`#${ND_LAUNCHER_ID}`);
        if (launcher) return launcher;

        launcher = document.createElement('div');
        launcher.id = ND_LAUNCHER_ID;
        launcher.innerHTML = [
            '<button type="button" class="nd-launcher-main" title="Novel Downloader">',
            '  <span class="nd-launcher-mark">ND</span>',
            '  <span>Novel Downloader</span>',
            '</button>',
            '<div class="nd-launcher-menu">',
            '  <button type="button" data-action="open-main">Mở giao diện tải</button>',
            '  <button type="button" data-action="open-manager">Mở Quản lý tải xuống</button>',
            '</div>'
        ].join('');
        root.appendChild(launcher);
        applyLauncherPosition(launcher, GM_getValue(ND_LAUNCHER_POSITION_KEY, null));

        const mainButton = launcher.querySelector('.nd-launcher-main');
        let dragState = null;
        let suppressClick = false;

        mainButton.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;
            const rect = launcher.getBoundingClientRect();
            dragState = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                left: rect.left,
                top: rect.top,
                moved: false
            };
            launcher.classList.add('is-dragging');
            if (typeof mainButton.setPointerCapture === 'function') mainButton.setPointerCapture(event.pointerId);
        });

        mainButton.addEventListener('pointermove', (event) => {
            if (!dragState || dragState.pointerId !== event.pointerId) return;
            const dx = event.clientX - dragState.startX;
            const dy = event.clientY - dragState.startY;
            if (!dragState.moved && Math.hypot(dx, dy) < 4) return;
            dragState.moved = true;
            closeNovelDownloaderLauncherMenu();
            applyLauncherPosition(launcher, {
                left: dragState.left + dx,
                top: dragState.top + dy
            });
        });

        mainButton.addEventListener('pointerup', (event) => {
            if (!dragState || dragState.pointerId !== event.pointerId) return;
            launcher.classList.remove('is-dragging');
            if (typeof mainButton.releasePointerCapture === 'function') mainButton.releasePointerCapture(event.pointerId);
            if (dragState.moved) {
                const saved = applyLauncherPosition(launcher, {
                    left: launcher.getBoundingClientRect().left,
                    top: launcher.getBoundingClientRect().top
                });
                GM_setValue(ND_LAUNCHER_POSITION_KEY, saved);
                suppressClick = true;
                window.setTimeout(() => { suppressClick = false; }, 0);
            }
            dragState = null;
        });

        mainButton.addEventListener('click', async (event) => {
            event.preventDefault();
            if (suppressClick) return;
            const mainVisible = isNovelDownloaderMainVisible();
            const managerVisible = isNovelDownloaderManagerVisible();
            if (mainVisible && managerVisible) {
                updateNovelDownloaderLauncherVisibility();
            } else if (mainVisible) {
                await openNovelDownloaderManagerUi();
            } else if (managerVisible) {
                await openNovelDownloaderMainUi();
            } else {
                launcher.classList.toggle('is-open');
            }
        });

        launcher.querySelector('.nd-launcher-menu').addEventListener('click', async (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;
            event.preventDefault();
            closeNovelDownloaderLauncherMenu();
            if (button.dataset.action === 'open-main') {
                await openNovelDownloaderMainUi();
            } else if (button.dataset.action === 'open-manager') {
                await openNovelDownloaderManagerUi();
            }
        });

        return launcher;
    }

    function updateNovelDownloaderLauncherVisibility() {
        const root = getNovelDownloaderUIRoot(false);
        const existingLauncher = root && root.querySelector(`#${ND_LAUNCHER_ID}`);
        if (!isNovelDownloaderLauncherEnabled()) {
            if (existingLauncher) existingLauncher.style.display = 'none';
            return;
        }
        const mainVisible = isNovelDownloaderMainVisible();
        const managerVisible = isNovelDownloaderManagerVisible();
        if (mainVisible && managerVisible) {
            if (existingLauncher) {
                existingLauncher.style.display = 'none';
                existingLauncher.classList.remove('is-open');
            }
            return;
        }
        const launcher = ensureNovelDownloaderLauncher();
        const currentPosition = {
            left: parseFloat(launcher.style.left),
            top: parseFloat(launcher.style.top)
        };
        applyLauncherPosition(launcher, Number.isFinite(currentPosition.left) && Number.isFinite(currentPosition.top)
            ? currentPosition
            : GM_getValue(ND_LAUNCHER_POSITION_KEY, null));
        launcher.style.display = 'block';
    }

    const novelDownloaderUiApi = {
        openMain: openNovelDownloaderMainUi,
        openManager: openNovelDownloaderManagerUi,
        openGuide: openNovelDownloaderGuide,
        openChangelog: openNovelDownloaderChangelog,
        openSupportedSites: openNovelDownloaderSupportedSites,
        openDebugBridge: openNovelDownloaderDebugBridge,
        openRuleEditor: openNovelDownloaderRuleEditor,
        updateLauncherVisibility: updateNovelDownloaderLauncherVisibility,
        isLauncherEnabled: isNovelDownloaderLauncherEnabled,
        setLauncherEnabled: setNovelDownloaderLauncherEnabled,
        isMainVisible: isNovelDownloaderMainVisible
    };
    window.NDNovelDownloaderUI = novelDownloaderUiApi;
    if (typeof unsafeWindow !== 'undefined') {
        unsafeWindow.NDNovelDownloaderUI = novelDownloaderUiApi;
    }

    // ============================================================================
    // Runtime State & Defaults
    // ============================================================================

    function validateContent(content) {
        const sizeBytes = new TextEncoder().encode(content).length;
        if (sizeBytes < 2048) {
            return null;
        }
        return content;
    }

    TaskManager.init();
    let fontLib;

    /*
    * interface Chapter {
    *   title?:      string;
    *   url?:        string;
    *   volume?:     string;
    *   document?:   string;
    *   contentRaw?: string;
    *   content?:    string;
    * }
  */

    let Storage = null;
    Storage = {
        debug: {
            book: false,
            content: false,
        },
        modelPredictionsLog: [],
        mode: null, // 1=index 2=chapter
        rule: null, // 当前规则
        book: {
            image: [],
        },
        xhr,
    };
    const Config = {
        thread: 5,
        retry: 3,
        timeout: 60000,
        reference: true,
        format: true,
        useCommon: true,
        modeManual: true,
        templateRule: true,
        volume: true,
        delayBetweenChapters: 2000,
        failedCount: 5,
        failedWait: 60,
        image: true,
        addChapterNext: true,
        removeEmptyLine: 'auto',
        css: 'body {\n  line-height: 130%;\n  text-align: justify;\n  font-family: \\"Microsoft YaHei\\";\n  font-size: 22px;\n  margin: 0 auto;\n  background-color: #CCE8CF;\n  color: #000;\n}\n\nh1 {\n  text-align: center;\n  font-weight: bold;\n  font-size: 28px;\n}\n\nh2 {\n  text-align: center;\n  font-weight: bold;\n  font-size: 26px;\n}\n\nh3 {\n  text-align: center;\n  font-weight: bold;\n  font-size: 24px;\n}\n\np {\n  text-indent: 2em;\n}',
        customize: '[]',
        ...GM_getValue('config', {}),
    };

    // ============================================================================
    // Optional Local Model Cleanup Client
    // ============================================================================

    // === BẮT ĐẦU CODE TÍCH HỢP MODEL ===
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function callModelApi_HTML(rawHtml) {
        const MODEL_API_URL = 'http://127.0.0.1:5000/predict_batch';
        console.log(`[Model Client] Gửi HTML (dài ${rawHtml.length} chars) đến API (dùng GM_xmlhttpRequest)...`);

        // Bọc GM_xmlhttpRequest trong một Promise để dùng với async/await
        return new Promise((resolve, reject) => {
            try {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: MODEL_API_URL,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    data: JSON.stringify({ raw_html: rawHtml }), // Dữ liệu gửi đi phải là string
                    timeout: Config.timeout, // Timeout 60 giây

                    onload: function (response) {
                        // Check status code
                        if (response.status >= 200 && response.status < 300) {
                            try {
                                const result = JSON.parse(response.responseText);
                                if (result && result.processed_html) {
                                    console.log(`[Model Client] Nhận thành công HTML đã xử lý.`);
                                    // console.log(result.processed_html);
                                    resolve(result.processed_html); // Thành công, trả về HTML
                                } else {
                                    console.error('[Model Client] Lỗi: API không trả về "processed_html". Response:', result);
                                    reject(new Error('API did not return processed HTML.'));
                                }
                            } catch (e) {
                                console.error('[Model Client] Lỗi parse JSON response:', e, response.responseText);
                                reject(new Error('Failed to parse API JSON response.'));
                            }
                        } else {
                            // Lỗi từ server (4xx, 5xx)
                            console.error('[Model Client] Lỗi API:', response.status, response.statusText, response.responseText);
                            let errorMsg = `API server error: ${response.status}`;
                            try {
                                // Cố gắng parse lỗi JSON từ server nếu có
                                const errJson = JSON.parse(response.responseText);
                                if (errJson.error) errorMsg += ` - ${errJson.error}`;
                            } catch (e) {
                                // Bỏ qua nếu parse lỗi
                            }
                            reject(new Error(errorMsg));
                        }
                    },

                    onerror: function (response) {
                        // Lỗi mạng, không kết nối được
                        console.error('[Model Client] Lỗi GM_xmlhttpRequest (onerror):', response.statusText, response.error);
                        reject(new Error(`Network error or API server is down. ${response.error || ''}`));
                    },

                    ontimeout: function () {
                        // Lỗi timeout
                        console.error('[Model Client] Lỗi GM_xmlhttpRequest: Request timed out.');
                        reject(new Error('API request timed out (60s).'));
                    }
                });
            } catch (e) {
                // Lỗi này xảy ra nếu GM_xmlhttpRequest không tồn tại (rất hiếm)
                console.error('[Model Client] Lỗi nghiêm trọng khi gọi GM_xmlhttpRequest:', e);
                reject(e);
            }
        });
    }

    async function processJjwxcTagsWithModel(rawHtml, sourceType, chapterContext) {
        console.log(`[Model Client] Bắt đầu xử lý Model cho chương ${chapterContext?.chapterId || '?'} (Gửi HTML đến server)...`);
        const modelSourceTypes = new Set(['jjwxc', 'faloo']);
        const normalizedSourceType = String(sourceType || '').toLowerCase();
        if (!modelSourceTypes.has(normalizedSourceType)) {
            console.log(`[Model Client] Nguồn ${sourceType || '?'} chưa cần xử lý model. Đang trả về...`);
            return rawHtml;
        }
        const startTime = performance.now();

        // Chỉ cần gọi API mới
        const processedHtml = await callModelApi_HTML(rawHtml);

        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        if (processedHtml === null) {
            console.error(`[Model Client] Xử lý thất bại sau ${duration}s do lỗi API. Trả về HTML gốc.`);
            return ""; // Trả về HTML gốc nếu API lỗi
        } else {
            console.log(`[Model Client] Hoàn tất xử lý phía server sau ${duration}s.`);
            return processedHtml; // Trả về HTML đã được server xử lý
        }
    }

    // ============================================================================
    // Lazy OCR Runtime
    // ============================================================================

    const ND_OCR_SCRIPT_URLS = {
        fflate: 'https://unpkg.com/fflate@0.8.2/umd/index.js',
        ort: 'https://unpkg.com/onnxruntime-web@1.18.0/dist/ort.wasm.min.js',
        eSearchOCR: 'https://unpkg.com/@oovz/esearch-ocr/dist/eSearchOCR.umd.js'
    };

    function ndGetGlobal(name) {
        return (typeof unsafeWindow !== 'undefined' && unsafeWindow && unsafeWindow[name])
            || (typeof window !== 'undefined' && window[name])
            || (typeof globalThis !== 'undefined' && globalThis[name]);
    }

    async function ndLoadExternalScript(url, checkFn) {
        if (checkFn && checkFn()) return;
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = false;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Không tải được OCR script: ${url}`));
            (document.head || document.documentElement).appendChild(script);
        }).catch(async (scriptError) => {
            console.warn('[ND OCR] Script tag load lỗi, thử GM_xmlhttpRequest:', scriptError);
            const code = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    timeout: Config.timeout,
                    onload: (res) => {
                        if (res.status >= 200 && res.status < 300) resolve(res.responseText || '');
                        else reject(new Error(`Không tải được ${url}: HTTP ${res.status}`));
                    },
                    onerror: () => reject(new Error(`Không tải được ${url}`)),
                    ontimeout: () => reject(new Error(`Timeout khi tải ${url}`))
                });
            });
            (0, eval)(`${code}\n//# sourceURL=${url}`);
        });
        if (checkFn && !checkFn()) throw new Error(`OCR script đã tải nhưng chưa expose global: ${url}`);
    }

    function ndGmGetValue(key, fallbackValue) {
        try {
            return GM_getValue(key, fallbackValue);
        } catch (error) {
            console.warn('[ND OCR] GM_getValue lỗi:', error);
            return fallbackValue;
        }
    }

    function ndGmSetValue(key, value) {
        try {
            return GM_setValue(key, value);
        } catch (error) {
            console.warn('[ND OCR] GM_setValue lỗi:', error);
            return undefined;
        }
    }

    function ndUint8ArrayToBase64(bytes) {
        const chunkSize = 8192;
        let binary = '';
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
        }
        return btoa(binary);
    }

    function ndBase64ToUint8Array(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    function ndUint8ArrayToArrayBuffer(bytes) {
        return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    }

    async function ndFetchArrayBuffer(url, options = {}) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: options.method || 'GET',
                url,
                headers: options.headers,
                responseType: 'arraybuffer',
                timeout: options.timeout || Config.timeout,
                onload: (res) => {
                    if (res.status >= 200 && res.status < 300 && res.response) {
                        resolve(res.response);
                    } else {
                        reject(new Error(`HTTP ${res.status} khi tải ${url}`));
                    }
                },
                onerror: () => reject(new Error(`Không tải được ${url}`)),
                ontimeout: () => reject(new Error(`Timeout khi tải ${url}`))
            });
        });
    }

    async function ndWaitForOpenCv() {
        const cvLib = ndGetGlobal('cv');
        if (!cvLib) return;
        if (cvLib.Mat || cvLib.imread) return;
        await new Promise((resolve) => {
            const oldReady = cvLib.onRuntimeInitialized;
            let done = false;
            const finish = () => {
                if (done) return;
                done = true;
                resolve();
            };
            cvLib.onRuntimeInitialized = function () {
                if (typeof oldReady === 'function') oldReady.apply(this, arguments);
                finish();
            };
            setTimeout(finish, 30000);
        });
    }

    function ndGetOcrLibrary() {
        const page = typeof unsafeWindow !== 'undefined' ? unsafeWindow : null;
        const global = typeof globalThis !== 'undefined' ? globalThis : window;
        return global.eSearchOCR || global.ESearchOCR || global.eSearchOcr
            || page?.eSearchOCR || page?.ESearchOCR || page?.eSearchOcr;
    }

    function ndGetOcrInitFn() {
        const ocrLib = ndGetOcrLibrary();
        return ocrLib?.init || ocrLib?.default?.init || (typeof ocrLib === 'function' ? ocrLib : null);
    }

    function ndGetTmExtensionId() {
        const meta = document.querySelector('meta[name="tm-extension-id"]');
        return window.tmExtensionId || window.__TM_EXTENSION_ID || meta?.content || '';
    }

    async function ndRecognizeWithTmExtension(imageDataUrl, timeout = 30000) {
        const extId = ndGetTmExtensionId();
        if (!extId) throw new Error('TM Extension Helper chưa được phát hiện.');

        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
            try {
                return await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage(extId, {
                        cmd: 'CMD_OCR_RECOGNIZE',
                        image: imageDataUrl
                    }, (response) => {
                        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                        else if (response?.success) resolve(response.data);
                        else reject(new Error(response?.error || 'TM Extension OCR lỗi không rõ.'));
                    });
                });
            } catch (error) {
                console.warn('[ND OCR] Direct extension OCR lỗi, thử content-script bridge:', error);
            }
        }

        return new Promise((resolve, reject) => {
            const reqId = `nd_ocr_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const timer = setTimeout(() => {
                window.removeEventListener('message', handler);
                reject(new Error('TM Extension OCR timeout.'));
            }, timeout);
            const handler = (event) => {
                if (event.source !== window) return;
                if (!event.data || event.data.type !== 'TM_EXT_OCR_RESPONSE' || event.data.reqId !== reqId) return;
                clearTimeout(timer);
                window.removeEventListener('message', handler);
                const response = event.data.data;
                if (response?.success) resolve(response.data);
                else reject(new Error(response?.error || 'TM Extension OCR lỗi không rõ.'));
            };
            window.addEventListener('message', handler);
            window.postMessage({
                type: 'TM_EXT_OCR_REQUEST',
                reqId,
                payload: { imageBase64: imageDataUrl }
            }, '*');
        });
    }

    function ndNormalizeOcrResult(result, options = {}) {
        if (typeof result === 'string') {
            if (options.fullText) return result.trim();
            const cleanText = result.trim().replace(/\s+/g, '').replace(/[^\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]/g, '');
            return cleanText ? { text: cleanText.charAt(0), confidence: 0 } : null;
        }
        const rawParagraphs = result?.parragraphs || result?.paragraphs || result?.src
            || result?.data?.parragraphs || result?.data?.paragraphs || [];
        const paragraphs = Array.isArray(rawParagraphs) ? rawParagraphs : [];
        let text = result?.text || result?.data?.text || '';
        if (!text && paragraphs.length) {
            text = paragraphs
                .slice()
                .sort((a, b) => ((a.box?.[0]?.[1] ?? 0) - (b.box?.[0]?.[1] ?? 0)))
                .map((item) => String(item.parse?.text || item.text || '').trim())
                .filter(Boolean)
                .join('\n');
        }
        if (options.fullText) return String(text || '').trim();
        const best = paragraphs.length
            ? paragraphs.reduce((left, right) => ((right.mean || 0) > (left.mean || 0) ? right : left), paragraphs[0])
            : null;
        const cleanText = String(best?.parse?.text || best?.text || text || '')
            .trim()
            .replace(/\s+/g, '')
            .replace(/[^\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]/g, '');
        return cleanText ? { text: cleanText.charAt(0), confidence: best?.mean || 0 } : null;
    }

    const ND_OCR = {
        modelLoaded: false,
        loadingPromise: null,
        ocrEngine: null,
        modelCache: {},
        ppocrDict: '',
        cacheKey: 'paddleocr_models_v4',
        cacheVersion: '4.0.0',
        zipUrls: [
            'https://drive.usercontent.google.com/u/0/uc?id=1J2xfRuEzDZpuXPnRcBiWhp7ajb-INoGa&export=download',
            'https://ghfast.top/?q=https://github.com/xushengfeng/eSearch-OCR/releases/download/4.0.0/ch.zip',
            'https://github.com/xushengfeng/eSearch-OCR/releases/download/4.0.0/ch.zip'
        ],
        filesToExtract: ['ppocr_keys_v1.txt', 'ppocr_det.onnx', 'ppocr_rec.onnx'],

        async ensureLibraries() {
            await ndLoadExternalScript(ND_OCR_SCRIPT_URLS.fflate, () => ndGetGlobal('fflate')?.unzip || ndGetGlobal('fflate')?.unzipSync);
            await ndLoadExternalScript(ND_OCR_SCRIPT_URLS.ort, () => ndGetGlobal('ort')?.InferenceSession);
            await ndLoadExternalScript(ND_OCR_SCRIPT_URLS.eSearchOCR, () => ndGetOcrInitFn());
        },

        async configureONNXRuntime() {
            const ortLib = ndGetGlobal('ort');
            if (!ortLib?.env?.wasm) return;
            const wasmCacheKey = 'paddleocr_ort_wasm_v1_18_0';
            let wasmBuffer = null;
            const cachedB64 = ndGmGetValue(wasmCacheKey, null);
            if (cachedB64) {
                try {
                    wasmBuffer = ndBase64ToUint8Array(cachedB64).buffer;
                    console.log('[ND OCR] Loaded ORT WASM từ TM cache.');
                } catch (error) {
                    console.warn('[ND OCR] ORT WASM cache lỗi, tải lại:', error);
                }
            }
            if (!wasmBuffer) {
                const candidates = ['ort-wasm.wasm', 'ort-wasm-simd.wasm'];
                for (const fileName of candidates) {
                    try {
                        const url = `https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/${fileName}`;
                        console.log('[ND OCR] Tải ORT WASM:', fileName);
                        wasmBuffer = await ndFetchArrayBuffer(url, { timeout: Math.max(Config.timeout, 120000) });
                        ndGmSetValue(wasmCacheKey, ndUint8ArrayToBase64(new Uint8Array(wasmBuffer)));
                        ndGmSetValue(`${wasmCacheKey}_meta`, { name: fileName });
                        break;
                    } catch (error) {
                        console.warn('[ND OCR] Tải ORT WASM lỗi:', fileName, error);
                    }
                }
            }
            if (!wasmBuffer) throw new Error('Không tải được ORT WASM cho OCR.');
            ortLib.env.wasm.wasmBinary = new Uint8Array(wasmBuffer);
            ortLib.env.wasm.wasmPaths = undefined;
            ortLib.env.wasm.numThreads = 0;
            ortLib.env.wasm.simd = true;
            ortLib.env.logLevel = 'verbose';
            window.__TM_WASM_BUFFER = wasmBuffer;
            if (typeof unsafeWindow !== 'undefined') unsafeWindow.__TM_WASM_BUFFER = wasmBuffer;
        },

        async downloadAndCacheModels() {
            const storedVersion = ndGmGetValue(`${this.cacheKey}_ver`, null);
            if (storedVersion === this.cacheVersion) {
                const cached = {};
                for (const filename of this.filesToExtract) {
                    const value = ndGmGetValue(`${this.cacheKey}:${filename}`, null);
                    if (!value) break;
                    cached[filename] = ndBase64ToUint8Array(value);
                }
                if (this.filesToExtract.every((filename) => cached[filename])) {
                    this.modelCache = cached;
                    console.log('[ND OCR] Đã load model PaddleOCR từ TM cache.');
                    return;
                }
            }

            let extracted = null;
            let lastError = null;
            for (const url of this.zipUrls) {
                try {
                    console.log('[ND OCR] Tải PaddleOCR model zip:', url);
                    const zipBuffer = await ndFetchArrayBuffer(url, { timeout: Math.max(Config.timeout, 180000) });
                    const fflateLib = ndGetGlobal('fflate');
                    const zipBytes = new Uint8Array(zipBuffer);
                    if (typeof fflateLib.unzipSync === 'function') {
                        extracted = fflateLib.unzipSync(zipBytes);
                    } else {
                        extracted = await new Promise((resolve, reject) => {
                            fflateLib.unzip(zipBytes, (error, result) => error ? reject(error) : resolve(result));
                        });
                    }
                    break;
                } catch (error) {
                    lastError = error;
                    console.warn('[ND OCR] Tải/giải nén model lỗi:', error);
                }
            }
            if (!extracted) throw lastError || new Error('Không tải được PaddleOCR model.');

            this.modelCache = {};
            for (const filename of this.filesToExtract) {
                const foundKey = Object.keys(extracted).find((key) => key === filename || (key.endsWith(filename) && !key.startsWith('__MACOSX')));
                if (!foundKey) continue;
                const bytes = extracted[foundKey] instanceof Uint8Array ? extracted[foundKey] : new Uint8Array(extracted[foundKey]);
                this.modelCache[filename] = bytes;
                ndGmSetValue(`${this.cacheKey}:${filename}`, ndUint8ArrayToBase64(bytes));
            }
            if (!this.filesToExtract.every((filename) => this.modelCache[filename])) {
                throw new Error('PaddleOCR model zip thiếu file cần thiết.');
            }
            ndGmSetValue(`${this.cacheKey}_ver`, this.cacheVersion);
        },

        async loadDict() {
            if (this.ppocrDict) return this.ppocrDict;
            await this.downloadAndCacheModels();
            const dictBytes = this.modelCache['ppocr_keys_v1.txt'];
            if (!dictBytes) throw new Error('Dictionary PaddleOCR không có trong cache.');
            this.ppocrDict = new TextDecoder('utf-8').decode(dictBytes);
            return this.ppocrDict;
        },

        async ensureEngine() {
            if (this.modelLoaded && this.ocrEngine) return this.ocrEngine;
            if (this.loadingPromise) {
                await this.loadingPromise;
                return this.ocrEngine;
            }
            this.loadingPromise = (async () => {
                await this.ensureLibraries();
                await this.configureONNXRuntime();
                await this.downloadAndCacheModels();
                const dictContent = await this.loadDict();
                const detModel = this.modelCache['ppocr_det.onnx'];
                const recModel = this.modelCache['ppocr_rec.onnx'];
                const initFn = ndGetOcrInitFn();
                const ortLib = ndGetGlobal('ort');
                if (!initFn || !ortLib) throw new Error('OCR runtime chưa sẵn sàng.');
                this.ocrEngine = await initFn({
                    det: {
                        input: ndUint8ArrayToArrayBuffer(detModel),
                        ratio: 2.0
                    },
                    rec: {
                        input: ndUint8ArrayToArrayBuffer(recModel),
                        decodeDic: dictContent,
                        optimize: { space: false }
                    },
                    dev: false,
                    ort: ortLib
                });
                this.modelLoaded = true;
                console.log('[ND OCR] PaddleOCR engine sẵn sàng.');
            })();
            try {
                await this.loadingPromise;
            } finally {
                this.loadingPromise = null;
            }
            return this.ocrEngine;
        },

        async ocrImageData(imageInput, options = {}) {
            const dataUrl = typeof imageInput === 'string' ? imageInput : imageInput?.dataUrl;
            const imageData = imageInput?.imageData || imageInput;
            if (dataUrl) {
                try {
                    const extResult = await ndRecognizeWithTmExtension(dataUrl);
                    const normalized = ndNormalizeOcrResult(extResult, options);
                    if (options.fullText ? normalized : normalized?.text) return normalized;
                } catch (error) {
                    console.warn('[ND OCR] Extension OCR lỗi, fallback local WASM:', error);
                }
            }

            const engine = await this.ensureEngine();
            let result;
            if (typeof engine === 'function') {
                result = await engine(dataUrl || imageData);
            } else if (typeof engine.recognize === 'function') {
                result = await engine.recognize(dataUrl || imageData);
            } else if (typeof engine.ocr === 'function') {
                result = await engine.ocr(dataUrl || imageData);
            } else {
                throw new Error('OCR engine không tương thích.');
            }
            return ndNormalizeOcrResult(result, options);
        }
    };

    try {
        unsafeWindow.ND_OCR = ND_OCR;
    } catch (error) { /* ignore */ }

    function ndCanvasImageData(canvas) {
        const srcCtx = canvas.getContext('2d');
        const output = document.createElement('canvas');
        output.width = canvas.width;
        output.height = canvas.height;
        const ctx = output.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, output.width, output.height);
        ctx.drawImage(canvas, 0, 0);
        return {
            imageData: ctx.getImageData(0, 0, output.width, output.height) || srcCtx.getImageData(0, 0, canvas.width, canvas.height),
            dataUrl: output.toDataURL('image/png')
        };
    }

    function ndDecodeCssString(value = '') {
        return String(value)
            .replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex) => {
                const codePoint = Number.parseInt(hex, 16);
                return Number.isNaN(codePoint) ? '' : String.fromCodePoint(codePoint);
            })
            .replace(/\\([\\"'])/g, '$1')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t');
    }

    function ndTokenizeContentValue(content = '') {
        const tokens = [];
        let index = 0;
        while (index < content.length) {
            const ch = content[index];
            if (/\s/.test(ch)) {
                index += 1;
                continue;
            }
            if (ch === '"' || ch === "'") {
                const quote = ch;
                let value = '';
                index += 1;
                while (index < content.length) {
                    const current = content[index];
                    if (current === quote && content[index - 1] !== '\\') {
                        index += 1;
                        break;
                    }
                    value += current;
                    index += 1;
                }
                tokens.push({ type: 'string', value });
                continue;
            }
            const identMatch = content.slice(index).match(/^[a-zA-Z-]+/);
            if (!identMatch) {
                index += 1;
                continue;
            }
            const name = identMatch[0];
            index += name.length;
            if (content[index] === '(') {
                let depth = 1;
                let value = '';
                index += 1;
                while (index < content.length && depth > 0) {
                    const current = content[index];
                    const prev = content[index - 1];
                    if (current === '(' && prev !== '\\') depth += 1;
                    else if (current === ')' && prev !== '\\') {
                        depth -= 1;
                        if (depth === 0) {
                            index += 1;
                            break;
                        }
                    }
                    if (depth > 0) value += current;
                    index += 1;
                }
                tokens.push({ type: 'function', name: name.toLowerCase(), value });
                continue;
            }
            tokens.push({ type: 'word', value: name.toLowerCase() });
        }
        return tokens;
    }

    function ndEvaluatePseudoContent(content = '', element) {
        const trimmed = String(content || '').trim();
        if (!trimmed || trimmed === 'none' || trimmed === 'normal') return '';
        let result = '';
        let hasSupportedToken = false;
        ndTokenizeContentValue(trimmed).forEach((token) => {
            if (token.type === 'string') {
                result += ndDecodeCssString(token.value);
                hasSupportedToken = true;
            } else if (token.type === 'function' && token.name === 'attr') {
                const attrName = token.value.trim().split(/\s+/)[0];
                if (attrName) {
                    result += element.getAttribute(attrName) || '';
                    hasSupportedToken = true;
                }
            }
        });
        return hasSupportedToken ? result : '';
    }

    function ndSpecificity(selector = '') {
        const idCount = (selector.match(/#[\w-]+/g) || []).length;
        const classCount = (selector.match(/(\.[\w-]+|\[[^\]]+\]|:[\w-]+)/g) || []).length;
        const typeCount = (selector.replace(/#[\w-]+|(\.[\w-]+|\[[^\]]+\]|::?[\w-]+)/g, '').match(/[a-zA-Z][\w-]*/g) || []).length;
        return [idCount, classCount, typeCount];
    }

    function ndCollectPseudoContentRules(doc) {
        const rules = [];
        let order = 0;
        const visit = (cssRules) => {
            Array.from(cssRules || []).forEach((rule) => {
                try {
                    if (rule.cssRules) visit(rule.cssRules);
                    const selectorText = rule.selectorText;
                    const content = rule.style?.getPropertyValue('content');
                    if (!selectorText || !content || content === 'none' || content === 'normal') return;
                    selectorText.split(',').forEach((rawSelector) => {
                        const raw = rawSelector.trim();
                        const pseudo = /::?before\b/.test(raw) ? '::before' : (/::?after\b/.test(raw) ? '::after' : null);
                        if (!pseudo) return;
                        const selector = raw.replace(/::?before\b|::?after\b/g, '').trim();
                        if (!selector) return;
                        rules.push({
                            selector,
                            pseudo,
                            content,
                            important: rule.style.getPropertyPriority('content') === 'important',
                            specificity: ndSpecificity(selector),
                            order: order++
                        });
                    });
                } catch (error) { /* ignore inaccessible CSS rules */ }
            });
        };
        Array.from(doc.styleSheets || []).forEach((styleSheet) => {
            try {
                visit(styleSheet.cssRules);
            } catch (error) { /* ignore cross-origin stylesheets */ }
        });
        return rules;
    }

    function ndResolvePseudoFromRules(element, pseudo, rules) {
        const matched = rules.filter((rule) => {
            if (rule.pseudo !== pseudo) return false;
            try {
                return element.matches(rule.selector);
            } catch (error) {
                return false;
            }
        });
        if (!matched.length) return '';
        matched.sort((left, right) => {
            if (left.important !== right.important) return left.important ? 1 : -1;
            for (let i = 0; i < left.specificity.length; i++) {
                if (left.specificity[i] !== right.specificity[i]) return left.specificity[i] - right.specificity[i];
            }
            return left.order - right.order;
        });
        return ndEvaluatePseudoContent(matched[matched.length - 1].content, element);
    }

    function ndResolvePseudoContent(element, ownerWin, pseudo, rules) {
        try {
            const computed = ownerWin.getComputedStyle(element, pseudo).content;
            const computedContent = ndEvaluatePseudoContent(computed, element);
            if (computedContent) return computedContent;
        } catch (error) { /* ignore */ }
        return ndResolvePseudoFromRules(element, pseudo, rules);
    }

    function ndCollectRenderedText(node, ownerWin, pseudoRules, parts) {
        if (node.nodeType === Node.TEXT_NODE) {
            parts.push(node.textContent || '');
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const element = node;
        const tag = element.tagName?.toLowerCase();
        if (tag === 'script' || tag === 'style') return;
        if (tag === 'br') parts.push('\n');
        const before = ndResolvePseudoContent(element, ownerWin, '::before', pseudoRules);
        if (before) parts.push(before);
        Array.from(element.childNodes || []).forEach((child) => ndCollectRenderedText(child, ownerWin, pseudoRules, parts));
        const after = ndResolvePseudoContent(element, ownerWin, '::after', pseudoRules);
        if (after) parts.push(after);
    }

    function ndExtractRenderedText(element, ownerWin, pseudoRules) {
        const parts = [];
        ndCollectRenderedText(element, ownerWin, pseudoRules, parts);
        return parts.join('').replace(/\u200b/g, '');
    }

    async function ndBuildFontDecodeMap(fontFamily, uniqueChars) {
        const map = new Map();
        const BATCH_SIZE = 30;
        const CHAR_SIZE = 48;
        const ROW_HEIGHT = 64;
        const PADDING = 16;
        const CANVAS_WIDTH = CHAR_SIZE + PADDING * 2;
        const SCALE = 2;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        for (let i = 0; i < uniqueChars.length; i += BATCH_SIZE) {
            const batch = uniqueChars.slice(i, i + BATCH_SIZE);
            const canvasHeight = batch.length * ROW_HEIGHT + PADDING * 2;
            canvas.width = CANVAS_WIDTH * SCALE;
            canvas.height = canvasHeight * SCALE;
            ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, CANVAS_WIDTH, canvasHeight);
            ctx.font = `${CHAR_SIZE}px ${fontFamily}`;
            ctx.fillStyle = 'black';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            batch.forEach((ch, index) => {
                ctx.fillText(ch, CANVAS_WIDTH / 2, PADDING + index * ROW_HEIGHT + ROW_HEIGHT / 2);
            });
            let batchOk = false;
            try {
                const ocrText = await ND_OCR.ocrImageData(ndCanvasImageData(canvas), { fullText: true });
                const ocrChars = [...String(ocrText || '').replace(/[\s\n\r]/g, '')];
                if (ocrChars.length === batch.length) {
                    batch.forEach((ch, index) => map.set(ch, ocrChars[index]));
                    batchOk = true;
                }
            } catch (error) {
                console.warn('[ND OCR] Batch OCR lỗi, fallback từng chữ:', error);
            }
            if (!batchOk) {
                for (const ch of batch) {
                    if (map.has(ch)) continue;
                    const SIZE = CHAR_SIZE + 32;
                    canvas.width = SIZE * SCALE;
                    canvas.height = SIZE * SCALE;
                    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, SIZE, SIZE);
                    ctx.font = `${CHAR_SIZE}px ${fontFamily}`;
                    ctx.fillStyle = 'black';
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'center';
                    ctx.fillText(ch, SIZE / 2, SIZE / 2);
                    try {
                        const result = await ND_OCR.ocrImageData(ndCanvasImageData(canvas));
                        if (result?.text) map.set(ch, result.text);
                    } catch (error) {
                        console.warn('[ND OCR] OCR từng chữ lỗi:', error);
                    }
                }
            }
            console.log(`[ND OCR] Font map ${Math.min(i + BATCH_SIZE, uniqueChars.length)}/${uniqueChars.length}`);
        }
        canvas.width = 0;
        canvas.height = 0;
        return map;
    }

    async function ndDecodeQidianContentByOCR(contentMain) {
        const ownerDoc = contentMain.ownerDocument;
        const ownerWin = ownerDoc.defaultView || window;
        if (ownerDoc.fonts?.ready) await ownerDoc.fonts.ready.catch(() => {});
        const fontFamily = ownerWin.getComputedStyle(contentMain).fontFamily || 'sans-serif';
        const paragraphs = Array.from(contentMain.querySelectorAll('p'));
        if (!paragraphs.length) return null;
        const pseudoRules = ndCollectPseudoContentRules(ownerDoc);
        const paraTexts = paragraphs.map((p) => ndExtractRenderedText(p, ownerWin, pseudoRules));
        const uniqueChars = [...new Set(paraTexts.join(''))].filter((ch) => {
            const code = ch.charCodeAt(0);
            return (code >= 0x4E00 && code <= 0x9FA5) || (code >= 0x3400 && code <= 0x4DB5);
        });
        if (!uniqueChars.length) return null;
        const decodeMap = await ndBuildFontDecodeMap(fontFamily, uniqueChars);
        if (!decodeMap.size) return null;
        const output = document.createElement('div');
        paraTexts.forEach((text) => {
            const decoded = [...text].map((ch) => decodeMap.get(ch) || ch).join('').trim();
            if (!decoded) return;
            const p = document.createElement('p');
            p.textContent = decoded;
            output.appendChild(p);
        });
        return output;
    }

    async function ndCreateFrameDocument(html, baseUrl, readySelector = 'body') {
        const frame = document.createElement('iframe');
        frame.style.cssText = 'position:absolute;left:-99999px;top:-99999px;width:1200px;height:1600px;opacity:0;pointer-events:none;';
        document.body.appendChild(frame);
        const srcdoc = String(html || '').replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl}">`);
        frame.srcdoc = srcdoc.includes('<base href=') ? srcdoc : `<base href="${baseUrl}">${srcdoc}`;
        await new Promise((resolve) => {
            frame.onload = resolve;
            setTimeout(resolve, 8000);
        });
        const doc = frame.contentDocument || frame.contentWindow?.document;
        if (doc?.fonts?.ready) await doc.fonts.ready.catch(() => {});
        const started = Date.now();
        while (doc && readySelector && !doc.querySelector(readySelector) && Date.now() - started < 8000) {
            await sleep(200);
        }
        return { frame, doc };
    }

    async function ndFetchText(url, options = {}) {
        const res = await xhr.sync(url, options.data || null, {
            method: options.method || (options.data ? 'POST' : 'GET'),
            headers: options.headers,
            responseType: 'text',
            timeout: options.timeout || Config.timeout,
            cache: !!options.cache
        });
        return res.responseText || res.response || '';
    }

    async function ndLoadFontFace(fontFamily, fontUrl) {
        const buffer = await ndFetchArrayBuffer(fontUrl, {
            headers: { Referer: 'https://my.jjwxc.net/' },
            timeout: Math.max(Config.timeout, 120000)
        });
        const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'font/woff2' }));
        const style = document.createElement('style');
        style.textContent = `@font-face { font-family: "${fontFamily}"; src: url("${blobUrl}") format("woff2"); }`;
        document.head.appendChild(style);
        try {
            if (document.fonts?.load) await document.fonts.load(`48px "${fontFamily}"`);
        } catch (error) {
            console.warn('[ND OCR] Kiểm tra font JJWXC lỗi:', error);
        }
        return () => {
            style.remove();
            URL.revokeObjectURL(blobUrl);
        };
    }

    async function ndBuildJjwxcFontTable(fontName, inputText) {
        const allChars = [...String(inputText || '').replace(/\u200c/g, '')];
        const uniqueEncryptedChars = [...new Set(allChars)].filter((ch) => {
            const code = ch.codePointAt(0);
            return (code >= 0xE000 && code <= 0xF8FF) || (code >= 0xF0000 && code <= 0xFFFFD);
        });
        if (!uniqueEncryptedChars.length) return {};
        const fontUrl = `https://static.jjwxc.net/tmp/fonts/${fontName}.woff2?h=my.jjwxc.net`;
        const cleanup = await ndLoadFontFace(fontName, fontUrl);
        try {
            const decodeMap = await ndBuildFontDecodeMap(`"${fontName}"`, uniqueEncryptedChars);
            const table = {};
            decodeMap.forEach((normalCharacter, encryptedCharacter) => {
                table[encryptedCharacter] = normalCharacter;
            });
            return table;
        } finally {
            cleanup();
        }
    }

    async function ndReplaceJjwxcCharacters(fontName, inputText) {
        const table = await ndBuildJjwxcFontTable(fontName, inputText);
        let outputText = String(inputText || '');
        Object.entries(table).forEach(([encryptedCharacter, normalCharacter]) => {
            outputText = outputText.split(encryptedCharacter).join(normalCharacter);
        });
        return outputText.replace(/\u200c/g, '');
    }

    // ============================================================================
    // Rule Registry & Default Selectors
    // ============================================================================

    const Rule = {
        // 如无说明，所有可以为*选择器*都可以是async (doc)=>string
        //                              章节内async (doc,res,request)
        // 快速查找脚本的相应位置：rule.key

        // ?siteName
        siteName: 'Trang chủ web',

        // 以下三个必须有一个
        // ?url: string[]/regexp[]
        // ?chapterUrl: string[]/regexp[]
        // ?filter: function=> 0=notmatched 1=index 2=chapter
        url: [/(index|0|list|default)\.(s?html?|php)$/i],
        chapterUrl: [/\d+\/\d+\.(s?html?|php)$/i],

        // ?infoPage: 选择器 或 async (doc)=>url
        //  如果存在infoPage，则基本信息（title,writer,intro,cover）从infoPage页面获取
        //  当infoPage与当前页相同时，直接从当前页获取（极少数情况）

        // title 书籍名称:选择器
        title: ['.h1title > .shuming > a[title]', '.chapter_nav > div:first > a:last', '#header > .readNav > span > a:last', 'div[align="center"] > .border_b > a:last', '.ydselect > .weizhi > a:last', '.bdsub > .bdsite > a:last', '#sitebar > a:last', '.con_top > a:last', '.breadCrumb > a:last'].join(','),
        // titleRegExp 从<title>获取标题，返回$1
        titleRegExp: /^(.*?)(_|-|\(| |最新|小说|无弹窗|目录|全文|全本|txt|5200章节)/i,
        // ?titleReplace:[[find,replace]]

        // ?writer:选择器
        writer: '#info>p:eq(0):maxsize(20),:contains(作):contains(者):maxsize(20):last',

        // ?intro:选择器
        intro: '#intro>p:eq(0)',

        // ?cover:选择器

        // chapter:选择器(应包含vip章节) 或 async (doc)=>url[]或{url,title}[]
        chapter: [
            '.dir a', '#BookText a', '#Chapters a', '#TabCss a',
            '#Table1 a', '#at a', '#book a', '#booktext a',
            '#catalog_list a', '#chapterList a', '#chapterlist a', '#container1 a',
            '#content_1 a', '#contenttable a', '#dir a', '#htmlList a',
            '#list a', '#oneboolt a', '#read.chapter a', '#readerlist a',
            '#readerlists a', '#readlist a', '#tbchapterlist a', '#xslist a',
            '#zcontent a', '.Chapter a', '.L a', '.TabCss>dl>dd>a',
            '.Volume a', '._chapter a', '.aarti a', '.acss a',
            '.all-catalog a', '.art_fnlistbox a', '.art_listmain_main a', '.article_texttitleb a',
            '.as a', '.bd a', '.book a', '.book-chapter-list a',
            '.bookUpdate a', '.book_02 a', '.book_article_listtext a', '.book_con_list a',
            '.book_dirbox a', '.book_list a', '.booklist a', '#booklist a',
            '.box-item a', '.box1 a', '.box_box a', '.box_chap a',
            '.catalog a', '.catalog-list a', '.catebg a', '.category a',
            '.ccss a', '.centent a', '.chapname a', '.chapter a',
            '.chapter-list a', '.chapterBean a', '.chapterNum a', '.chapterTable a',
            '.chapter_box_ul a', '.chapter_list_chapter a', '.chapterlist a', '.chapterlistxx a',
            '.chapters a', '.chapters_list a', '.chaptertable a', '.chaptertd a',
            '.columns a', '.con_05 a', '.content a', '.contentlist a',
            '.conter a', '.css a', '.d_contarin a', '.dccss a',
            '.detail-chapters a', '.dir_main_section a', '.dirbox a', '.dirconone a',
            '.dirinfo_list a', '.dit-list a', '.download_rtx a', '.entry_video_list a',
            '.float-list a', '.index a', '.indexlist a', '.info_chapterlist a',
            '.insert_list a', '.item a', '.kui-item a', '.l_mulu_table a',
            '.lb a', '.liebiao a', '.liebiao_bottom a', '.list a',
            '.list-directory a', '.list-group a', '.list01a', '.list_Content a',
            '.list_box a', '.listmain a', '.lists a', '.lrlb a',
            '.m10 a', '.main a', '.mb_content a', '.menu-area a',
            '.ml-list1 a', '.ml_main a', '.mls a', '.mod_container a',
            '.mread a', '.mulu a', '.mulu_list a', '.nav a',
            '.nolooking a', '.novel_leftright a', '.novel_list a', '.ocon a',
            '.opf a', '.qq', '.read_list a', '.readout a',
            '.td_0 a', '.td_con a', '.third a', '.uclist a',
            '.uk-table a', '.volume a', '.volumes a', '.wiki-content-table a',
            '.www a', '.xiaoshuo_list a', '.xsList a', '.zhangjieUl a',
            '.zjbox a', '.zjlist a', '.zjlist4 a', '.zl a',
            '.zp_li a', 'dd a', '.chapter-list a', '.directoryArea a',

            '[id*="list"] a', '[class*="list"] a',
            '[id*="list"] dl',
            '[id*="chapter"] a', '[class*="chapter"] a',
        ].join(','),
        // vipChapter:选择器 或 async (doc)=>url[]或{url,title}[]

        // volume:
        //  选择器/async (doc)=>elem[]；原理 $(chaptes).add(volumes);
        //  async (doc,chapters)=>chapters；尽量不要生成新的对象，而是在原有对象上增加键"volume"（方便重新下载）

        // 以下在章节页面内使用
        // ?chapterTitle:选择器 省略留空时，为chapter的textContent
        chapterTitle: '.bookname>h1,h2',

        // iframe: boolean 或 async (win)=>null
        //   使用时，只能一个一个获取（慎用）

        // popup: boolean 或 async ()=>null
        //   仅当X-Frame-Options:DENY时使用，使用时，只能一个一个获取（慎用）

        // deal: async(chapter)=>content||object
        //   不请求章节相对网页，而直接获得内容（请求其他网址）
        //   可以直接给chapter赋值，也可以返回content或需要的属性如title

        // content:选择器
        content: [
            '#pagecontent', '#contentbox', '#bmsy_content', '#bookpartinfo',
            '#htmlContent', '#text_area', '#chapter_content', '#chapterContent', '#chaptercontent',
            '#partbody', '#BookContent', '#article_content', '#BookTextRead',
            '#booktext', '#BookText', '#readtext', '#readcon',
            '#text_c', '#txt_td', '#TXT', '#txt',
            '#zjneirong', '.novel_content', '.readmain_inner', '.noveltext',
            '.booktext', '.yd_text2', '#contentTxt', '#oldtext',
            '#a_content', '#contents', '#content2', '#contentts',
            '#content1', '#content', '.content', '#arctext',
            '[itemprop="acticleBody"]', '.readerCon',
            '[id*="article"]:minsize(100)', '[class*="article"]:minsize(100)',
            '[id*="content"]:minsize(100)', '[class*="content"]:minsize(100)',
        ].join(','),

        // ?contentCheck: 检查页面是否正确，true时保留，否则content=null
        //   选择器 存在元素则为true
        //   或 async (doc,res,request)=>boolean

        // ?elementRemove:选择器 或 async (contentHTML)=>contentHTML
        //   如果需要下载图片，请不要移除图片元素
        elementRemove: 'script,style,iframe,*:emptyHuman:not(br,p,img),:hiddenHuman,a:not(:has(img))',

        // ?contentReplace:[[find,replace]]
        //   如果有图片，请不要移除图片元素

        // ?chapterPrev,chapterNext:选择器 或 async (doc)=>url
        chapterPrev: 'a[rel="prev"],a:regexp("[上前]一?[章页话集节卷篇]+"),#prevUrl',
        chapterNext: 'a[rel="next"],a:regexp("[下后]一?[章页话集节卷篇]+"),#nextUrl',
        // ?ignoreUrl:url[] 忽略的网站（用于过滤chapterPrev,chapterNext）

        // ?getChapters 在章节页面时使用，获取全部章节
        //   async (doc)=>url[]或{url,title,vip,volume}[]

        // ?charset:utf-8||gb2312||other
        //   通常来说不用设置

        // ?thread:下载线程数 通常来说不用设置

        // ?vip:{} 对于vip页面
        //  可用key: chapterTitle,iframe,deal,content,contentCheck,elementRemove,contentReplace,chapterPrev,chapterNext
    };

    // ============================================================================
    // Shared UI Feedback
    // ============================================================================

    (function initNovelDownloaderToast() {
        const uiRoot = getNovelDownloaderUIRoot(true) || document.body;
        // tạo style nếu chưa có
        if (!uiRoot.querySelector('#nd-toast-style')) {
            const style = document.createElement('style');
            style.id = 'nd-toast-style';
            // FIX: THAY ĐỔI VỊ TRÍ TỪ BOTTOM SANG TOP
            style.textContent = `
            :host{all:initial;display:block;position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:Arial,sans-serif;}
            *,*:before,*:after{box-sizing:border-box;}
            #nd-toast-container{position:fixed;right:16px;top:18px;z-index:999999;display:flex;flex-direction:column;gap:8px;align-items:flex-end;pointer-events:none;font-family:Arial,sans-serif;}
            .nd-toast{min-width:220px;max-width:360px;padding:10px 14px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,0.18);font-size:13px;color:#fff;opacity:0;transform:translateY(-10px);transition:all .22s ease;display:flex;align-items:center;gap:10px}
            .nd-toast-show{opacity:1;transform:translateY(0)}
            .nd-toast-success{background:linear-gradient(90deg,#2ecc71,#27ae60)}
            .nd-toast-info{background:linear-gradient(90deg,#3498db,#2c82c9)}
            .nd-toast-warn{background:linear-gradient(90deg,#f1c40f,#e0ac00);color:#222}
            .nd-toast-error{background:linear-gradient(90deg,#e74c3c,#c0392b)}
            .nd-toast{pointer-events:auto;}
            .nd-toast .nd-toast-close{margin-left:auto;cursor:pointer;opacity:0.85}
            `;
            uiRoot.appendChild(style);
        }

        // container
        if (!uiRoot.querySelector('#nd-toast-container')) {
            const cont = document.createElement('div');
            cont.id = 'nd-toast-container';
            uiRoot.appendChild(cont);
        }

        // showToast function global to this script space
        window.ndShowToast = function (message, type = 'info', duration = 4000) {
            try {
                const root = getNovelDownloaderUIRoot(true) || document.body;
                let cont = root.querySelector('#nd-toast-container');
                if (!cont) {
                    cont = document.createElement('div');
                    cont.id = 'nd-toast-container';
                    root.appendChild(cont);
                }
                if (!cont) return;
                const el = document.createElement('div');
                el.className = 'nd-toast nd-toast-' + (type === 'warning' ? 'warn' : (type || 'info'));
                el.innerHTML = `<span class="nd-toast-message">${message}</span><span class="nd-toast-close">✕</span>`;
                cont.appendChild(el);
                // show
                // small delay to allow transition
                requestAnimationFrame(() => el.classList.add('nd-toast-show'));
                // close handler
                el.querySelector('.nd-toast-close').addEventListener('click', () => {
                    el.classList.remove('nd-toast-show');
                    setTimeout(() => el.remove(), 220);
                });
                // auto remove
                setTimeout(() => {
                    el.classList.remove('nd-toast-show');
                    setTimeout(() => el.remove(), 220);
                }, duration);
            } catch (e) {
                // fallback: console
                console.log('Toast:', message);
            }
        };
    })();


    // ============================================================================
    // Site Rules
    // ============================================================================

    Rule.special = [
        // @nd-build:rules-special
    ];
    Rule.template = [ // 模板网站
        // @nd-build:rules-template
    ];

    // ============================================================================
    // Custom Rule Helpers & Loading
    // ============================================================================

    Rule.helpers = {
        sleep,
        absoluteUrl: (url, base = window.location.href) => {
            try {
                return new URL(url, base).href;
            } catch (e) {
                return '';
            }
        },
        parseHtml: (html = '') => new DOMParser().parseFromString(String(html || ''), 'text/html'),
        requestText: async (url, opt = {}) => {
            const res = await xhr.sync(url, opt.data || null, {
                method: opt.method || (opt.data ? 'POST' : 'GET'),
                headers: opt.headers,
                responseType: 'text',
                cache: !!opt.cache,
                timeout: opt.timeout
            });
            return res.responseText || res.response || '';
        },
        requestDoc: async (url, opt = {}) => Rule.helpers.parseHtml(await Rule.helpers.requestText(url, opt)),
        requestJson: async (url, opt = {}) => {
            const text = await Rule.helpers.requestText(url, opt);
            return JSON.parse(text);
        },
        text: (selector, doc = document) => $(selector, doc).first().text().trim(),
        html: (selector, doc = document) => $(selector, doc).first().html() || '',
        attr: (selector, attr, doc = document) => $(selector, doc).first().attr(attr) || '',
        cleanText: (html = '', dict = []) => html2Text(html, dict),
        html2Text: (html = '', dict = []) => html2Text(html, dict),
        uniqueBy: (items = [], keyFn = (item) => item) => {
            const seen = new Set();
            return [].concat(items || []).filter((item) => {
                const key = keyFn(item);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        },
        mapChapters: (selector, doc = document, base = window.location.href) => $(selector, doc).toArray().map((el) => ({
            title: $(el).text().trim(),
            url: Rule.helpers.absoluteUrl($(el).attr('href') || $(el).attr('data-href') || '', base)
        })).filter((chapter) => chapter.url),
        makeChapterListContainer: (chapters = [], options = {}) => {
            const container = document.createElement('div');
            container.id = options.id || 'novel-downloader-custom-chapter-container';
            container.style = options.style || 'padding:16px;border:1px solid #ccc;background:#fff;max-width:800px;margin:20px auto;box-shadow:0 2px 4px rgba(0,0,0,.1);';
            container.innerHTML = `<h2 style="text-align:center;color:#1a73e8;">${options.title || `Danh sách chương (${chapters.length})`}</h2>`;
            chapters.forEach((chapter, index) => {
                const link = document.createElement('a');
                link.href = chapter.url;
                link.textContent = chapter.title || chapter.url;
                link.setAttribute('novel-downloader-chapter', chapter.vip ? 'vip' : '');
                link.setAttribute('order', index + 1);
                link.style = options.linkStyle || 'display:block;padding:8px 12px;margin:5px 0;border-left:4px solid #2196F3;text-decoration:none;color:#333;background:#f9f9f9;border-radius:4px;';
                container.appendChild(link);
            });
            return container;
        }
    };

    try {
        unsafeWindow.ND_RULE_HELPERS = Rule.helpers;
        unsafeWindow.ND_RULE_UTILS = Rule.helpers;
    } catch (e) {}

    function createCustomRuleConsole() {
        const methods = ['log', 'info', 'warn', 'error', 'debug'];
        const nativeConsole = (typeof unsafeWindow !== 'undefined' && unsafeWindow.console) || window.console || console;
        const proxy = {};
        methods.forEach((method) => {
            proxy[method] = function () {
                const args = Array.prototype.slice.call(arguments);
                const consoleApi = window.NDConsole;
                if (consoleApi && typeof consoleApi.capture === 'function') {
                    consoleApi.capture(method, args, { echo: true });
                    return;
                }
                const fallback = nativeConsole && (nativeConsole[method] || nativeConsole.log);
                if (typeof fallback === 'function') fallback.apply(nativeConsole, args);
            };
        });
        ['group', 'groupCollapsed', 'groupEnd', 'table', 'trace'].forEach((method) => {
            proxy[method] = function () {
                const fallback = nativeConsole && (nativeConsole[method] || nativeConsole.log);
                if (typeof fallback === 'function') fallback.apply(nativeConsole, arguments);
            };
        });
        return proxy;
    }

    function evaluateNovelDownloaderRuleCode(source, options = {}) {
        const code = String(source || '').trim();
        if (!code) throw new Error('Thiếu code rule');
        const originalRules = Rule.special.slice();
        const helpers = Rule.helpers;
        const utils = Rule.helpers;
        const nativeConsole = (typeof unsafeWindow !== 'undefined' && unsafeWindow.console) || window.console;
        const console = options.console || nativeConsole;
        let result;
        try {
            result = eval(`(${code})`); // eslint-disable-line no-eval
        } catch (expressionError) {
            result = eval(code); // eslint-disable-line no-eval
        }
        const afterRules = Rule.special.slice();
        const injectedRules = afterRules.filter(rule => !originalRules.includes(rule));
        if (afterRules.length !== originalRules.length || injectedRules.length) {
            Rule.special.splice(0, Rule.special.length, ...originalRules);
        }
        if ((result === undefined || typeof result === 'number') && injectedRules.length) {
            result = injectedRules;
        }
        return result;
    }

    function getNovelDownloaderDebugContext() {
        return {
            Rule,
            helpers: Rule.helpers,
            utils: Rule.helpers,
            xhr,
            $,
            sleep,
            html2Text,
            replaceWithDict,
            getFromRule,
            init,
            evaluateRuleCode: evaluateNovelDownloaderRuleCode,
            evaluateNovelDownloaderRuleCode,
            Storage,
            Config,
            GM_openInTab: typeof GM_openInTab !== 'undefined' ? GM_openInTab : undefined,
            unsafeWindow,
            download: typeof download !== 'undefined' ? download : undefined,
            saveAs: typeof saveAs !== 'undefined' ? saveAs : undefined,
            CryptoJS: typeof CryptoJS !== 'undefined' ? CryptoJS : undefined
        };
    }

    function registerNovelDownloaderDebugBridge() {
        const bridge = window.NDDebugBridge || debugBridge;
        if (bridge && typeof bridge.setRuntimeProvider === 'function') {
            bridge.setRuntimeProvider(getNovelDownloaderDebugContext);
        }
    }

    registerNovelDownloaderDebugBridge();
    autoLoadNovelDownloaderDebugBridge();

    function loadCustomRulesFromConfig(source) {
        const code = String(source || '').trim();
        if (!code || code === '[]') return;
        const originalRules = Rule.special.slice();
        const result = evaluateNovelDownloaderRuleCode(code, { console: createCustomRuleConsole() });
        const returnedRules = Array.isArray(result) ? result : (result && typeof result === 'object' ? [result] : []);
        const seenRules = new Set();
        const customRules = [];

        for (const rule of returnedRules) {
            if (!rule || typeof rule !== 'object' || !rule.siteName || seenRules.has(rule)) continue;
            seenRules.add(rule);
            rule.__ndCustomRule = true;
            customRules.push(rule);
        }

        if (customRules.length) {
            Rule.special = customRules.concat(originalRules);
        } else {
            Rule.special = originalRules;
        }
        console.log(`[ND] Đã nạp ${customRules.length} rule tùy chỉnh từ UI (ưu tiên trước rule gốc).`);
    }

    if (Config.customize) {
        try {
            loadCustomRulesFromConfig(Config.customize);
        } catch (error) {
            console.error('[ND] Lỗi khi nạp Quy tắc tùy chỉnh:', error);
        }
    }

    // ============================================================================
    // Rule Matching & Page Fetch Fallbacks
    // ============================================================================

    if (window.opener && window.opener !== window && !window.menubar.visible && window.localStorage.getItem('gm-nd-url') === window.location.href) {
        init();
        (async function () {
            if (typeof Storage.rule.popup === 'function') await Storage.rule.popup();
            window.localStorage.setItem('gm-nd-html', window.document.documentElement.outerHTML);
        }());
    }

    function init() {
        if (!Storage.rule) {
            if (Config.templateRule) Rule.special = Rule.special.concat(Rule.template);
            const _href = window.location.href;
            for (const rule of Rule.special) {
                rule.url = [].concat(rule.url).filter((i) => i);
                rule.chapterUrl = [].concat(rule.chapterUrl).filter((i) => i);
                rule.ignoreUrl = [].concat(rule.ignoreUrl).filter((i) => i);
            }
            Storage.rule = Rule.special.find((i) => (i.url.some((j) => _href.match(j))) || (i.chapterUrl.some((j) => _href.match(j))) || (i.filter && i.filter()));
            if (Storage.rule) {
                if (Storage.rule.url.some((i) => _href.match(i))) {
                    Storage.mode = 1;
                } else if (Storage.rule.chapterUrl.some((i) => _href.match(i))) {
                    Storage.mode = 2;
                } else if (Storage.rule.filter && typeof Storage.rule.filter === 'function') {
                    Storage.mode = Storage.rule.filter();
                }
            } else {
                Storage.rule = Rule;
                if (Config.modeManual) {
                    Storage.mode = window.confirm('Đây là trang mục lục hay trang chương?\nChọn "OK" trên trang mục lục, chọn "Hủy" nếu là trang chương.') ? 1 : 2;
                } else if (Storage.rule.url.some((i) => _href.match(i))) {
                    Storage.mode = 1;
                } else if (Storage.rule.chapterUrl.some((i) => _href.match(i))) {
                    Storage.mode = 2;
                } else {
                    Storage.mode = $(Storage.rule.content).length ? 2 : 1;
                }
            }
        }
    }

    async function fetchPageContent(url, selector) {
        console.log(`[fetchPageContent] Đang thử tải URL: ${url}`);

        // --- Bước 1: Thử XHR ---
        try {
            const res = await xhr.sync(url, null, { cache: false });
            if (!res.responseText.includes('<title>Just a moment...</title>') &&
                !res.responseText.includes('challenge-platform')) {
                console.log("[fetchPageContent] Tải qua XHR thành công.");
                return res.responseText;
            } else {
                console.warn("[fetchPageContent] XHR gặp Cloudflare.");
            }
        } catch (err) {
            console.warn("[fetchPageContent] XHR lỗi:", err);
        }

        // --- Bước 2: Thử fetch với cookie ---
        try {
            const res = await fetch(url, { credentials: "include" }); // gửi cookie phiên hiện tại
            const html = await res.text();
            if (!html.includes('<title>Just a moment...</title>') &&
                !html.includes('challenge-platform')) {
                console.log("[fetchPageContent] Tải qua fetch+cookie thành công.");
                return html;
            } else {
                console.warn("[fetchPageContent] fetch+cookie gặp Cloudflare.");
            }
        } catch (err) {
            console.warn("[fetchPageContent] fetch+cookie lỗi:", err);
        }

        // --- Bước 3: Mở popup vượt Cloudflare ---
        console.warn("[fetchPageContent] Chuyển sang phương thức popup...");
        alert("Trang web được bảo vệ bởi Cloudflare. Một cửa sổ nhỏ sẽ được mở để xác thực. Vui lòng không đóng nó cho đến khi hoàn tất.");

        return new Promise((resolve, reject) => {
            const popup = window.open(url, '_blank', 'width=500,height=600,resizable=yes,scrollbars=yes');
            if (!popup) {
                alert("Vui lòng cho phép trang web này mở cửa sổ Pop-up để có thể vượt qua lớp bảo vệ!");
                return reject("Cửa sổ Pop-up đã bị chặn.");
            }

            const checkInterval = setInterval(() => {
                try {
                    if (popup.closed) {
                        clearInterval(checkInterval);
                        return reject("Cửa sổ xác thực đã bị đóng thủ công.");
                    }

                    if (popup.document.readyState === 'complete') {
                        if (!selector || popup.document.querySelector(selector)) {
                            clearInterval(checkInterval);
                            const html = popup.document.documentElement.outerHTML;
                            popup.close();
                            console.log("[fetchPageContent] Đã lấy nội dung thành công qua popup.");
                            resolve(html);
                        }
                    }
                } catch (e) {
                    // Cross-origin khi đang chuyển trang
                }
            }, 500);

            setTimeout(() => {
                clearInterval(checkInterval);
                if (popup && !popup.closed) popup.close();
                reject("Hết thời gian chờ xác thực Cloudflare (30 giây).");
            }, 30000);
        });
    }


    // ============================================================================
    // Main Panel UI & Download Pipeline
    // ============================================================================

    function normalizeDownloadResumeUrl(url) {
        const value = String(url || '').trim();
        if (!value) return '';
        try {
            const parsed = new URL(value, window.location.href);
            parsed.hash = '';
            return parsed.href;
        } catch (error) {
            return value.split('#')[0];
        }
    }

    async function findDownloadResumeCandidateForCurrentPage() {
        if (!TaskManager || typeof TaskManager.getState !== 'function' || typeof TaskManager.getResumeData !== 'function') return null;
        let state;
        try {
            state = await TaskManager.getState();
        } catch (error) {
            console.warn('[ND] Không thể đọc hàng đợi để tìm dữ liệu tải dở:', error);
            return null;
        }
        const queue = Array.isArray(state && state.queue) ? state.queue : [];
        if (!queue.length) return null;
        const currentUrl = normalizeDownloadResumeUrl(window.location.href);
        let best = null;
        for (const task of queue) {
            if (!task || !task.id || !task.meta || !task.meta.resumeAvailable) continue;
            const taskUrls = [
                task.sourceUrl,
                task.meta && task.meta.resumeSourceUrl
            ].map(normalizeDownloadResumeUrl).filter(Boolean);
            if (!taskUrls.includes(currentUrl)) continue;
            let data;
            try {
                data = await TaskManager.getResumeData(task.id);
            } catch (error) {
                console.warn('[ND] Không thể đọc dữ liệu tải dở:', task.id, error);
                continue;
            }
            const savedChapters = Array.isArray(data && data.chapters) ? data.chapters : [];
            if (!data || !savedChapters.length) continue;
            const dataUrls = [
                task.sourceUrl,
                data.sourceUrl,
                task.meta && task.meta.resumeSourceUrl
            ].map(normalizeDownloadResumeUrl).filter(Boolean);
            if (!dataUrls.includes(currentUrl)) continue;
            const loadedCount = savedChapters.filter(chapter => chapter && (chapter.contentRaw || chapter.content)).length;
            if (!loadedCount) continue;
            const candidate = {
                task,
                data,
                loadedCount,
                total: savedChapters.length || (data.progress && data.progress.total) || (task.progress && task.progress.total) || 0,
                matchUrl: currentUrl
            };
            const candidateTime = new Date((data && data.savedAt) || task.updatedAt || task.createdAt || 0).getTime() || 0;
            const bestTime = best ? (new Date((best.data && best.data.savedAt) || best.task.updatedAt || best.task.createdAt || 0).getTime() || 0) : 0;
            if (!best || candidateTime > bestTime) {
                best = candidate;
            }
        }
        return best;
    }

    async function showUI(options = {}) {
        const uiRoot = getNovelDownloaderUIRoot(true) || document.body;
        const existingPanel = ndUI$('.novel-downloader-v3');
        if (existingPanel.length) {
            if (options.resumeRequest) {
                existingPanel.show();
            } else {
                existingPanel.toggle();
            }
            if ($('.novel-downloader-style-chapter[media]').length) { // https://stackoverflow.com/a/54441305
                $('.novel-downloader-style-chapter[media]').attr('media', null);
            } else {
                $('.novel-downloader-style-chapter').attr('media', 'max-width: 1px');
            }
            if (window.NDConsole && typeof window.NDConsole.setUiActive === 'function') {
                window.NDConsole.setUiActive(existingPanel.is(':visible'));
            }
            updateNovelDownloaderLauncherVisibility();
            return;
        }

        let chapters,
            chaptersArr;
        let vipChapters = [];
        const chaptersDownloaded = [];
        let pendingResumeTaskId = options.resumeRequest && options.resumeRequest.task && options.resumeRequest.task.id;
        let pendingResumeData = options.resumeRequest && options.resumeRequest.data;
        let pendingResumeAutoStart = Boolean(pendingResumeTaskId && pendingResumeData);

        const issueBody = [
            `- Script: \`novelDownloader5 v${GM_info.script.version}\``,
            '- Loại: `Bug/Góp ý`',
            `- Trình duyệt: \`${GM_info.platform ? GM_info.platform.browserName : 'Trình duyệt'} v${GM_info.platform ? GM_info.platform.browserVersion : 'Phiên bản'}\``,
            `- Tiện ích mở rộng: \`${GM_info.scriptHandler} v${GM_info.version}\``,
            '---',
            '<!-- Vấn đề của bạn -->',
        ];

        // ui
        const html = [
            '<div name="info">',
            `  Quy tắc hiện tại: <span name="rule"></span><span name="mode"></span><sup><a href="https://github.com/BaoBao666888/Novel-Downloader5/issues/new?body=${encodeURIComponent(issueBody.join('\u000a'))}" target="_blank">Phản hồi</a></sup><sup><button type="button" name="open-guide" class="nd-doc-link" data-nd-action="open-guide">HD</button></sup><sup><button type="button" name="open-supported-sites" class="nd-doc-link" data-nd-action="open-supported-sites">DS hỗ trợ</button></sup>`,
            '  <br>',
            '  Tên sách: <input type="text" name="title" value="加载中，请稍候">',
            '  <br>',
            '  Tác giả: <input type="text" name="writer">',
            '  <br>',
            '  Tóm tắt: <input type="text" name="intro">',
            '  <br>',
            '  Bìa sách: <input type="text" name="cover">',
            '</div>',

            '<div name="config">',
            '  <span style="color:red;">NEW!</span>',
            '  Nhiều cài đặt hơn: <button type="button" name="toggle" aria-expanded="false">Hiển thị</button>',
            '</div>',
            '<div class="useless" name="config">',
            '  Thời gian chờ giữa các chương (ms): <input type="number" name="delayBetweenChapters" min="0" placeholder="2000" style="width:60px;">',
            '  <br>',
            '  Luồng tải xuống: <input type="number" name="thread">',
            '  Số lần thử lại: <input type="number" name="retry">',
            '  <br>',
            '  Thời gian chờ - timeout: <input type="number" name="timeout">',
            '  Ngôn ngữ: <select name="language">',
            '    <option value="">Không chuyển đổi</option>',
            '    <option value="sc">Giản thể</option>',
            '    <option value="tc">Phồn thể</option>',
            '  </select>',
            '  <br>',
            '  <input type="checkbox" name="sort">Sắp xếp chương',
            '  <input type="checkbox" name="reference">Hiển thị URL nguồn',
            '  <br>',
            '  <input type="checkbox" name="format">Xử lý văn bản',
            '  <input type="checkbox" name="useCommon"><span title="Chỉ áp dụng cho các quy tắc chưa thiết lập các key tương ứng\nHỗ trợ key: elementRemove,chapterPrev,chapterNext">Sử dụng quy tắc chung</span>',
            '  <br>',
            '  <input type="checkbox" name="modeManual">Xác nhận thủ công mục lục hoặc chương',
            '  <br>',
            '  <input type="checkbox" name="templateRule">Sử dụng quy tắc mẫu',
            '  <input type="checkbox" name="volume">Phân chia chương theo quyển',
            '  <br>',
            '  <span title="{title} Đại diện cho tiêu đề ban đầu\n{order} đại diện cho chương\neg:#{order} {title}\n Để trống để không đổi tên nó">Đối với TEXT: Đổi tên tiêu đề chương</span> <input type="text" name="titleRename">',
            '  <br>',
            '  <input type="checkbox" name="tocIndent">Đối với EPUB: Thụt lề theo tập trong mục lục',
            '  <br><span title="Lưu ý về Auto: Nếu chỉ có một đoạn văn bản giữa tất cả các dòng trống thì loại bỏ các dòng trống, nếu không thì giữ nguyên">Loại bỏ dòng trống</span>: <select name="removeEmptyLine">',
            '    <option value="auto">Auto</option>',
            '    <option value="remove">Loại bỏ tất cả dòng trống</option>',
            '    <option value="keep">Giữ tất cả dòng trống</option>',
            '  </select>',
            '  <br>',
            '  Tải xuống liên tục thất bại<input type="number" name="failedCount" min="0" title="0为禁用"> lần, tạm dừng <input type="number" name="failedWait" min="0" title="0为手动继续"> giây sau đó tiếp tục tải xuống',
            '  <br>',
            '  Epub CSS: <textarea name="css" placeholder="" style="line-height:1;resize:both;"></textarea>',
            '  <br>',
            '  Quy tắc tùy chỉnh: <button type="button" name="open-rule-editor" data-nd-action="open-rule-editor">Quản lý rule</button>',
            '  <span name="customize-summary" class="nd-customize-summary">Chưa có rule tùy chỉnh</span>',
            '  <input type="hidden" name="customize">',
            '</div>',

            '<div name="config">',
            '  <input type="checkbox" name="image"><span title="Nó chỉ có hiệu lực khi tải xuống EPUB và chỉ hỗ trợ các file img">Tải xuống hình ảnh</span>',
            '  <input type="checkbox" name="vip" confirm="Cần phải mua các chương VIP trước khi tải xuống\nNếu tính năng mua tự động được bật, tôi sẽ không chịu trách nhiệm về những tổn thất do tập lệnh này gây ra"><span>Tải xuống chương VIP</span>',
            '  <br>',
            '  <input type="checkbox" name="addChapterPrev"><span title="Dùng cho các trang web chia một chương thành nhiều trang\nTập lệnh sẽ lọc các chương đã tải xuống theo URL\nĐối với 1 số web, nó có thể khiến lặp lại việc tải xuống\nSẽ dẫn tới【Phạm vi tải xuống】、【Tải xuống hàng loạt】không hợp lệ">Tự động tăng thêm trước chương</span>',
            '  <input type="checkbox" name="addChapterNext"><span title="Dùng cho các trang web chia một chương thành nhiều trang\nTập lệnh sẽ lọc các chương đã tải xuống theo URL\nĐối với 1 số web, nó có thể khiến lặp lại việc tải xuống\nSẽ dẫn tới【Phạm vi tải xuống】、【Tải xuống hàng loạt】không hợp lệ">Tự động tăng thêm sau chương</span>',
            '</div>',

            '<div name="limit" title="Ưu tiên: Tải xuống hàng loạt>Phạm vi tải xuống>Tất cả các chương">',
            '  Phạm vi tải xuống: <input name="range" placeholder="Bắt đầu bằng 1, ví dụ 1-25, 35, 50" type="text">',
            '  <br>',
            '  Tải xuống hàng loạt: <textarea name="batch" placeholder="Tất cả các địa chỉ URL sẽ được tải xuống" style="line-height:1;resize:both;"></textarea>',
            '</div>',

            '<div name="progress">',
            '  <span title="Tiến trình hoàn thành chương\nKhi góc phải bên dưới biểu hiện【Tải xuống đã hoàn tất】, nếu thanh tiến trình chưa chạy xong, bạn có thể thử nhấp lại và tập lệnh sẽ thử lại chương bị lỗi trước đó\n（Chỉ hợp lệ đối với các lỗi do sự cố mạng, nếu tập lệnh có vấn đề, vui lòng đưa ra phản hồi hoặc tự mình giải quyết）">Tiến độ</span>: ',
            '  <span name="progress-text">0 / 0</span>',
            '  <progress max="0" value="0"></progress>',
            '</div>',

            '<div name="buttons">',
            '  <input type="button" name="download" format="debug" value="Kiểm tra">',
            '  <input type="button" name="download" format="text" value="Tải xuống dưới dạng TEXT">',
            '  <br>',
            '  <input type="button" name="download" format="epub" value="Tải xuống dưới dạng EPUB">',
            '  <input type="button" name="download" format="zip" value="Tải xuống dưới dạng ZIP">',
            '  <br>',
            '  <input type="button" name="toggle-opacity" value="Trong suốt">',
            '  <input type="button" name="toggle-console" value="Tắt console">',
            '  <input type="button" name="show-console" value="Mở console">',
            '  <input type="button" name="exit" value="Thoát">',
            '  <input type="button" name="force-save" value="Buộc lưu" raw-disabled="disabled">',
            '  <br>',
            '  <button type="button" name="choose-download-dir" style="border:2px solid #2ecc71;padding:4px 8px;border-radius:4px;margin-right:6px;">Chọn thư mục lưu</button>',
            '  <input type="text" name="downloadDirDisplay" readonly placeholder="Thư mục lưu hiện tại (mặc định trình duyệt)" style="min-width:260px;"/>',
            '  <label style="margin-left:6px;"><input type="checkbox" name="rememberDownloadDir"> Ghi nhớ (Link này)</label>',
            '</div>',
        ].join('');
        const container = $('<div class="novel-downloader-v3"></div>').html(html);
        uiRoot.appendChild(container[0]);
        const toggleAdvancedConfig = (expanded) => {
            const advancedConfig = container.find('.useless[name="config"]');
            const isExpanded = typeof expanded === 'boolean' ? expanded : !advancedConfig.hasClass('is-visible');
            advancedConfig.toggleClass('is-visible', isExpanded).attr('aria-hidden', isExpanded ? 'false' : 'true');
            container.find('[name="config"] button[name="toggle"]')
                .text(isExpanded ? 'Ẩn' : 'Hiển thị')
                .attr('aria-expanded', isExpanded ? 'true' : 'false');
        };
        toggleAdvancedConfig(false);
        container[0].addEventListener('click', (event) => {
            const actionButton = event.target && event.target.closest ? event.target.closest('[data-nd-action]') : null;
            if (actionButton && container[0].contains(actionButton)) {
                event.preventDefault();
                event.stopPropagation();
                if (actionButton.dataset.ndAction === 'open-guide') openNovelDownloaderGuide();
                if (actionButton.dataset.ndAction === 'open-supported-sites') openNovelDownloaderSupportedSites();
                if (actionButton.dataset.ndAction === 'open-rule-editor') openNovelDownloaderRuleEditor({ container });
                return;
            }
            const button = event.target && event.target.closest ? event.target.closest('button[name="toggle"]') : null;
            if (!button || !container[0].contains(button)) return;
            event.preventDefault();
            event.stopPropagation();
            toggleAdvancedConfig();
        });
        const syncConsoleButtons = () => {
            const consoleApi = window.NDConsole;
            const toggleButton = container.find('[name="toggle-console"]');
            const showButton = container.find('[name="show-console"]');
            if (!consoleApi) {
                toggleButton.val('Console lỗi').attr('disabled', 'disabled');
                showButton.attr('disabled', 'disabled');
                return;
            }
            toggleButton.val(consoleApi.isEnabled() ? 'Tắt console' : 'Bật console');
            toggleButton.attr('disabled', null);
            showButton.attr('disabled', null);
        };
        const updateMainProgress = (completed = 0, total = 0) => {
            const safeCompleted = Math.max(0, Number(completed) || 0);
            const safeTotal = Math.max(0, Number(total) || 0);
            container.find('[name="progress"]>progress').val(Math.min(safeCompleted, safeTotal || safeCompleted)).attr('max', safeTotal || 1);
            container.find('[name="progress"]>[name="progress-text"]').text(`${safeCompleted} / ${safeTotal}`);
        };
        const removeConsoleStateListener = window.NDConsole && typeof window.NDConsole.onStateChange === 'function'
            ? window.NDConsole.onStateChange(syncConsoleButtons)
            : null;
        if (window.NDConsole && typeof window.NDConsole.setUiActive === 'function') {
            window.NDConsole.setUiActive(true);
        }
        updateNovelDownloaderLauncherVisibility();
        window.setTimeout(maybeShowNovelDownloaderVersionNotice, 0);
        container.find('input,select,textarea').attr('disabled', 'disabled');
        container.find('[name="config"]').find('input,select,textarea').on('change', function (e) {
            const { name } = e.target;
            let value = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? (e.target.value || this.placeholder) * 1 : (e.target.value || e.target.placeholder);
            if (e.target.type === 'checkbox' && value && e.target.getAttribute('confirm')) {
                value = window.confirm(e.target.getAttribute('confirm'));
                e.target.checked = value;
            }
            Config[name] = value;
            GM_setValue('config', Config);
            if (['retry', 'thread', 'timeout'].includes(name)) {
                xhr.storage.config.set(name, value);
            }
        }).each(function (i, e) {
            if (Config[e.name] === undefined) return;
            if (e.type === 'checkbox') {
                e.checked = Config[e.name];
            } else if (e.type === 'radio') {
                e.checked = (Config[e.name] === this.value);
            } else {
                e.value = Config[e.name];
            }
        });
        syncCustomRuleEditorUi(container);

        // === Chọn thư mục lưu (File System Access + IDB lưu handle) ===
        Storage.downloadDirHandle = Storage.downloadDirHandle || null;
        const downloadDirStorageKey = fileSave.getDirHandleStorageKey();

        function updateDownloadDirUI() {
            const display = Storage.downloadDirHandle ? (Storage.downloadDirHandle.name || '...') : 'Mặc định trình duyệt';
            container.find('[name="downloadDirDisplay"]').val(display);

            const rememberLabel = container.find('label:has([name="rememberDownloadDir"])');
            if (Storage.downloadDirHandle) {
                rememberLabel.show(); // Hiện nếu đã chọn thư mục
            } else {
                rememberLabel.hide(); // Ẩn nếu là mặc định
            }
        }

        (async function tryRestoreSavedDir() {
            try {
                const saved = await fileSave.restoreDirHandle({
                    keySuffix: downloadDirStorageKey,
                    remember: Config.rememberDownloadDir
                });
                if (saved) Storage.downloadDirHandle = saved;
            } catch (e) {
                console.warn('tryRestoreSavedDir error', e);
            } finally {
                updateDownloadDirUI();
            }
        })();

        // Bắt event cho nút Chọn thư mục
        container.find('[name="buttons"]').find('[name="choose-download-dir"]').on('click', async () => {
            try {
                const result = await fileSave.chooseDirectory({
                    keySuffix: downloadDirStorageKey,
                    remember: container.find('[name="rememberDownloadDir"]').prop('checked')
                });
                if (!result.ok) {
                    alert(result.message);
                    return;
                }
                Storage.downloadDirHandle = result.handle;
                updateDownloadDirUI();
                ndShowToast(result.message, result.toastType, result.toastDuration);
            } catch (e) {
                if (e && e.name === 'AbortError') {
                    console.log('User cancelled directory picker');
                    ndShowToast('Đã hủy chọn thư mục.', 'info', 1800);
                } else {
                    console.warn('Chọn thư mục bị huỷ hoặc lỗi', e);
                    ndShowToast('Lỗi khi chọn thư mục: ' + (e && e.message ? e.message : e), 'error', 5000);
                }
            }
        });

        // Khi thay đổi checkbox Ghi nhớ
        container.find('[name="rememberDownloadDir"]').on('change', async function () {
            const isChecked = this.checked;
            const storageKey = downloadDirStorageKey; // Khóa lưu theo link hiện tại

            Config.rememberDownloadDir = isChecked;
            GM_setValue('config', Config);
            ndShowToast(isChecked ? 'Đã bật "Ghi nhớ thư mục".' : 'Đã tắt "Ghi nhớ thư mục".', 'info', 2500);

            if (isChecked) {
                if (Storage.downloadDirHandle && storageKey) {
                    try {
                        await fileSave.saveDirHandle(Storage.downloadDirHandle, storageKey);
                    } catch (error) {
                        console.warn('saveDirHandle lỗi:', error);
                        ndShowToast('Không thể lưu ghi nhớ thư mục.', 'warning', 3000);
                    }
                }
            } else if (storageKey) {
                try {
                    await fileSave.clearSavedDirHandle(storageKey);
                } catch (error) {
                    console.warn('clearSavedDirHandle lỗi:', error);
                }
            }
        });
        // set initial ui
        updateDownloadDirUI();

        container.find('[name="buttons"]').find('[name="download"]').on('click', async (e) => {
            container.find('[name="progress"]').show();
            //xhr.showDialog();
            container.find('[name="buttons"]').find('[name="download"]').attr('disabled', 'disabled');
            if (!Storage.audio) {
                // 来自 E-Hentai-Downloader
                Storage.audio = new window.Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjcxLjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABVgANTU1NTU1Q0NDQ0NDUFBQUFBQXl5eXl5ea2tra2tra3l5eXl5eYaGhoaGhpSUlJSUlKGhoaGhoaGvr6+vr6+8vLy8vLzKysrKysrX19fX19fX5eXl5eXl8vLy8vLy////////AAAAAExhdmM1Ny44OQAAAAAAAAAAAAAAACQCgAAAAAAAAAVY82AhbwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+MYxAALACwAAP/AADwQKVE9YWDGPkQWpT66yk4+zIiYPoTUaT3tnU487uNhOvEmQDaCm1Yz1c6DPjbs6zdZVBk0pdGpMzxF/+MYxA8L0DU0AP+0ANkwmYaAMkOKDDjmYoMtwNMyDxMzDHE/MEsLow9AtDnBlQgDhTx+Eye0GgMHoCyDC8gUswJcMVMABBGj/+MYxBoK4DVpQP8iAtVmDk7LPgi8wvDzI4/MWAwK1T7rxOQwtsItMMQBazAowc4wZMC5MF4AeQAGDpruNuMEzyfjLBJhACU+/+MYxCkJ4DVcAP8MAO9J9THVg6oxRMGNMIqCCTAEwzwwBkINOPAs/iwjgBnMepYyId0PhWo+80PXMVsBFzD/AiwwfcKGMEJB/+MYxDwKKDVkAP8eAF8wMwIxMlpU/OaDPLpNKkEw4dRoBh6qP2FC8jCJQFcweQIPMHOBtTBoAVcwOoCNMYDI0u0Dd8ANTIsy/+MYxE4KUDVsAP8eAFBVpgVVPjdGeTEWQr0wdcDtMCeBgDBkgRgwFYB7Pv/zqx0yQQMCCgKNgonHKj6RRVkxM0GwML0AhDAN/+MYxF8KCDVwAP8MAIHZMDDA3DArAQo3K+TF5WOBDQw0lgcKQUJxhT5sxRcwQQI+EIPWMA7AVBoTABgTgzfBN+ajn3c0lZMe/+MYxHEJyDV0AP7MAA4eEwsqP/PDmzC/gNcwXUGaMBVBIwMEsmB6gaxhVuGkpoqMZMQjooTBwM0+S8FTMC0BcjBTgPwwOQDm/+MYxIQKKDV4AP8WADAzAKQwI4CGPhWOEwCFAiBAYQnQMT+uwXUeGzjBWQVkwTcENMBzA2zAGgFEJfSPkPSZzPXgqFy2h0xB/+MYxJYJCDV8AP7WAE0+7kK7MQrATDAvQRIwOADKMBuA9TAYQNM3AiOSPjGxowgHMKFGcBNMQU1FMy45OS41VVU/31eYM4sK/+MYxKwJaDV8AP7SAI4y1Yq0MmOIADGwBZwwlgIJMztCM0qU5TQPG/MSkn8yEROzCdAxECVMQU1FMy45OS41VTe7Ohk+Pqcx/+MYxMEJMDWAAP6MADVLDFUx+4J6Mq7NsjN2zXo8V5fjVJCXNOhwM0vTCDAxFpMYYQU+RlVMQU1FMy45OS41VVVVVVVVVVVV/+MYxNcJADWAAP7EAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxOsJwDWEAP7SAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxPMLoDV8AP+eAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxPQL0DVcAP+0AFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
                Storage.audio.loop = true;
            }
            $(window).off('blur').off('focus').on({
                blur: () => Storage.audio.play(),
                focus: () => Storage.audio.pause(),
            });
            Storage.title = document.title;

            Storage.book.chapters = Config.vip ? chapters : chapters.filter((i) => !(vipChapters.includes(i.url)));
            Storage.rule.vip = { ...Storage.rule, ...Storage.rule.vip || {} };

            // 限制下载范围
            if (container.find('[name="limit"]>[name="range"]').val()) {
                const selectedChapters = [];
                const selectedIndexes = new Set();
                const addChapterByNumber = (chapterNumber) => {
                    const index = Number(chapterNumber) - 1;
                    if (!Number.isInteger(index) || index < 0 || !(index in Storage.book.chapters) || selectedIndexes.has(index)) return;
                    selectedIndexes.add(index);
                    selectedChapters.push(Storage.book.chapters[index]);
                };
                const arr = container.find('[name="limit"]>[name="range"]').val().split(',').map(item => item.trim()).filter(Boolean);
                for (let i = 0; i < arr.length; i++) {
                    const rangeMatch = arr[i].match(/^(\d+)?-(\d+)?$/);
                    if (rangeMatch) {
                        const start = rangeMatch[1] ? Number(rangeMatch[1]) : 1;
                        const end = rangeMatch[2] ? Number(rangeMatch[2]) : Storage.book.chapters.length;
                        const step = start <= end ? 1 : -1;
                        for (let chapterNumber = start; step > 0 ? chapterNumber <= end : chapterNumber >= end; chapterNumber += step) {
                            addChapterByNumber(chapterNumber);
                        }
                    } else if (/^\d+$/.test(arr[i])) {
                        addChapterByNumber(Number(arr[i]));
                    }
                }
                Storage.book.chapters = selectedChapters;
            }
            if (container.find('[name="limit"]>[name="batch"]').val()) {
                Storage.book.chapters = container.find('[name="limit"]>[name="batch"]').val().split('\n').filter((i) => i)
                    .map((i) => {
                        const url = new URL(i, window.location.href).href;
                        return chaptersDownloaded.find((i) => i.url === url) || { url };
                    });
            }
            chaptersArr = Storage.book.chapters.map((i) => i.url);

            const format = $(e.target).attr('format');
            const activeResumeTaskId = pendingResumeTaskId && pendingResumeData ? pendingResumeTaskId : null;
            if (activeResumeTaskId && typeof TaskManager.consumeResumeRequest === 'function') {
                await TaskManager.consumeResumeRequest(activeResumeTaskId);
                pendingResumeTaskId = null;
                pendingResumeData = null;
            }
            let downloadManagerTaskId = null;
            let downloadManagerCancelled = false;
            let resolveDownloadManagerWait = null;
            const getDownloadManagerProgress = () => {
                const chapterList = Storage.book.chapters || [];
                const completed = chapterList.filter(chapter => Boolean(chapter.contentRaw || chapter.content)).length;
                const failed = chapterList.filter(chapter => chapter.contentRaw === '' && chapter.content === '').length;
                return {
                    completed,
                    total: chapterList.length,
                    failed
                };
            };
            const serializeChapterForResume = (chapter) => {
                const result = {
                    title: chapter && chapter.title || '',
                    url: chapter && chapter.url || '',
                    volume: chapter && chapter.volume || '',
                    vip: Boolean(chapter && (chapter.vip || vipChapters.includes(chapter.url))),
                    contentRaw: chapter && chapter.contentRaw || '',
                    content: chapter && chapter.content || ''
                };
                Object.keys(chapter || {}).forEach((key) => {
                    if (key === 'document' || key === 'filtered') return;
                    if (Object.prototype.hasOwnProperty.call(result, key)) return;
                    const value = chapter[key];
                    if (value === undefined || value === null || typeof value === 'function') return;
                    if (['string', 'number', 'boolean'].includes(typeof value)) {
                        result[key] = value;
                    }
                });
                return result;
            };
            const buildDownloadResumeData = () => ({
                version: 1,
                sourceUrl: window.location.href,
                format,
                book: {
                    title: Storage.book.title,
                    writer: Storage.book.writer,
                    intro: Storage.book.intro,
                    cover: Storage.book.cover
                },
                chapters: (Storage.book.chapters || []).map(serializeChapterForResume),
                vipChapters: vipChapters.slice(),
                progress: getDownloadManagerProgress()
            });
            const persistDownloadResumeData = async () => {
                if (!downloadManagerTaskId || typeof TaskManager.saveResumeData !== 'function') return;
                try {
                    await TaskManager.saveResumeData(downloadManagerTaskId, buildDownloadResumeData());
                } catch (error) {
                    console.warn('[ND] Không thể lưu dữ liệu tiếp tục:', error);
                }
            };
            const syncDownloadManagerTask = async (status = 'downloading', patch = {}) => {
                if (!downloadManagerTaskId || typeof TaskManager.updateTask !== 'function') return;
                try {
                    await TaskManager.updateTask(downloadManagerTaskId, Object.assign({
                        status,
                        progress: getDownloadManagerProgress()
                    }, patch));
                } catch (error) {
                    console.warn('[ND] Không thể cập nhật download manager:', error);
                }
            };
            const recordDownloadManagerError = async (chapter, error, type = 'download') => {
                if (!downloadManagerTaskId || typeof TaskManager.recordError !== 'function') return;
                const stringifyError = (value) => {
                    if (!value) return '';
                    if (typeof value === 'string') return value;
                    if (value.message) return value.message;
                    if (value.status || value.statusText) {
                        const status = `${value.status || ''} ${value.statusText || ''}`.trim();
                        const detail = value.error && value.error !== value ? stringifyError(value.error) : '';
                        return [status, detail].filter(Boolean).join(' - ');
                    }
                    if (value.error && value.error !== value) return stringifyError(value.error);
                    try {
                        return JSON.stringify(value).slice(0, 500);
                    } catch (e) {
                        return String(value);
                    }
                };
                try {
                    await TaskManager.recordError(downloadManagerTaskId, {
                        title: chapter && chapter.title,
                        url: chapter && chapter.url,
                        type,
                        status: error && (error.status || error.statusText),
                        message: stringifyError(error)
                    });
                    await syncDownloadManagerTask('downloading');
                    await persistDownloadResumeData();
                } catch (managerError) {
                    console.warn('[ND] Không thể ghi lỗi vào download manager:', managerError);
                }
            };
            const finishDownloadManagerTask = async (status, patch = {}) => {
                if (!downloadManagerTaskId || typeof TaskManager.finishTask !== 'function') return;
                try {
                    await TaskManager.finishTask(downloadManagerTaskId, status, Object.assign({
                        progress: getDownloadManagerProgress()
                    }, patch));
                    downloadManagerTaskId = null;
                } catch (error) {
                    console.warn('[ND] Không thể hoàn tất download manager:', error);
                }
            };
            const archiveDownloadManagerTask = async (status, patch = {}) => {
                if (!downloadManagerTaskId || typeof TaskManager.archiveTask !== 'function') return;
                try {
                    await TaskManager.archiveTask(downloadManagerTaskId, status, Object.assign({
                        progress: getDownloadManagerProgress()
                    }, patch));
                } catch (error) {
                    console.warn('[ND] Không thể ghi lịch sử download manager:', error);
                }
            };
            try {
                if (activeResumeTaskId) {
                    downloadManagerTaskId = activeResumeTaskId;
                    await TaskManager.updateTask(downloadManagerTaskId, {
                        bookTitle: Storage.book.title || Storage.book.chapters[0]?.title || document.title,
                        domain: window.location.hostname,
                        sourceUrl: window.location.href,
                        format,
                        status: 'downloading',
                        progress: getDownloadManagerProgress(),
                        meta: {
                            rule: Storage.rule && Storage.rule.name || '',
                            totalChapters: Storage.book.chapters.length
                        }
                    });
                } else {
                    const managerTask = await TaskManager.createTask({
                        bookTitle: Storage.book.title || Storage.book.chapters[0]?.title || document.title,
                        domain: window.location.hostname,
                        sourceUrl: window.location.href,
                        format,
                        status: 'downloading',
                        progress: getDownloadManagerProgress(),
                        meta: {
                            rule: Storage.rule && Storage.rule.name || '',
                            totalChapters: Storage.book.chapters.length
                        }
                    });
                    downloadManagerTaskId = managerTask && managerTask.id;
                }
                if (downloadManagerTaskId && typeof TaskManager.registerRuntimeActions === 'function') {
                    TaskManager.registerRuntimeActions(downloadManagerTaskId, {
                        cancel: async () => {
                            downloadManagerCancelled = true;
                            try { xhr.stop(); } catch (stopError) { console.warn('[ND] Không thể dừng xhr:', stopError); }
                            if (typeof resolveDownloadManagerWait === 'function') {
                                resolveDownloadManagerWait();
                                resolveDownloadManagerWait = null;
                            }
                            container.find('[name="buttons"]').find('[name="download"]').attr('disabled', null);
                            container.find('[name="buttons"]').find('[name="force-save"]').attr('disabled', 'disabled');
                            $(window).off('blur').off('focus');
                            if (Storage.audio) Storage.audio.pause();
                            if (Storage.title) document.title = Storage.title;
                            await finishDownloadManagerTask('cancelled');
                            ndShowToast('Đã hủy task tải xuống.', 'info', 2500);
                        },
                        retry: async () => {
                            if (downloadManagerTaskId) {
                                ndShowToast('Đang có task tải xuống trong phiên này.', 'warning', 2500);
                                return;
                            }
                            const button = container.find(`[name="download"][format="${format}"]`).get(0);
                            if (button && !button.disabled) {
                                button.click();
                            } else {
                                ndShowToast('Retry chỉ khả dụng khi nút tải đã sẵn sàng.', 'warning', 2500);
                            }
                        }
                    });
                }
                await persistDownloadResumeData();
            } catch (error) {
                console.warn('[ND] Không thể tạo task download manager:', error);
            }
            const onComplete = async (force) => {
                const failedChapters = Storage.book.chapters.filter(c => !(c.contentRaw || c.content));
                if (failedChapters.length > 0 && !force) {
                    console.warn(`%cPhát hiện ${failedChapters.length} chương tải thất bại. Quá trình tạo file sẽ bị tạm dừng.`, "color: red; font-weight: bold;");
                    console.warn('Các chương lỗi:', failedChapters.map(c => c.url));
                    alert(`Tải xuống hoàn tất nhưng có ${failedChapters.length} chương bị lỗi.\n\nBạn có thể thử nhấn nút "Tải xuống" lại để thử lại các chương lỗi, hoặc nhấn "Buộc lưu" để tạo file với các chương đã tải thành công.`);
                    await finishDownloadManagerTask('failed', {
                        errorSummary: `${failedChapters.length} chương tải thất bại`
                    });

                    // Kích hoạt lại các nút để người dùng có thể thao tác
                    container.find('[name="buttons"]').find('[name="download"]').attr('disabled', null);
                    container.find('[name="buttons"]').find('[name="force-save"]').attr('disabled', null);
                    return; // Dừng lại, không tạo file
                }
                // === KẾT THÚC CODE BỔ SUNG ===

                if (!force) {
                    container.find('[name="buttons"]').find('[name="force-save"]').attr('disabled', 'disabled').off('click');
                }

                let { chapters } = Storage.book;
                if (Config.sort && chapters.length) {
                    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'case' });
                    for (const chapter of chapters) chapter.sort = chapter.url;
                    // const dir = new URL('./', chapters[0].sort).href;
                    // if (chapters.every(i => new URL('./', i.sort).href === dir)) {
                    //   chapters.forEach(i => { i.sort = i.sort.substr(dir.length); });
                    // }
                    let ext = chapters[0].sort.split('.');
                    if (ext.length > 1) {
                        ext = `.${ext.slice(-1)}`;
                        const extReversed = ext.split('').reverse().join('');
                        if (chapters.every((i) => i.sort.split('').reverse().join('').indexOf(extReversed) === 0)) {
                            for (const chapter of chapters) chapter.sort = chapter.sort.substr(0, chapter.sort.length - ext.length);
                        }
                    }
                    chapters = chapters.sort((a, b) => collator.compare(a.sort, b.sort));
                }

                const volumes = [];
                for (let i = 0; i < chapters.length; i++) {
                    const chapter = chapters[i];

                    if (Config.volume) {
                        // if (i > 0 && chapters[i - 1].volume !== chapter.volume) {
                        //   const title = `【${chapters[i - 1].volume}】-分卷-结束`;
                        //   chapters.splice(i, 0, {
                        //     title,
                        //     contentRaw: title,
                        //     content: title,
                        //     volume: chapters[i - 1].volume
                        //   });
                        //   i++;
                        // }

                        if (chapter.volume && chapter.volume !== volumes.slice(-1)[0]) {
                            volumes.push(chapter.volume);
                            const title = `【${chapter.volume}】`;
                            chapters.splice(i, 0, {
                                title,
                                contentRaw: title,
                                content: title,
                                volume: chapter.volume,
                            });
                            i++;
                        }
                    }

                    const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;
                    let content = chapter.contentRaw || chapter.content;
                    if (!content) continue;
                    if (rule.elementRemove || Config.useCommon) {
                        if (Storage.debug.content) debugger;
                        content = await getFromRule(content, (content) => {
                            const elem = $('<div>').html(content);
                            if (rule.elementRemove) {
                                $(`${rule.elementRemove},script,style,iframe`, elem).remove();
                            } else if (Config.useCommon) {
                                $(`${Rule.elementRemove},script,style,iframe`, elem).remove();
                            }
                            return elem.html();
                        }, [], '');
                    }

                    if (Config.format) {
                        content = html2Text(content, rule.contentReplace);
                        if (['text', 'zip'].includes(format)) content = $('<div>').html(content).text();
                        content = content.replace(/^\s+/mg, '').trim(); // 移除开头空白字符
                        if (Config.removeEmptyLine === 'auto') {
                            const arr = content.split(/\n{2,}/);
                            let keep = false;
                            for (const i of arr) {
                                if (i.match(/\n/)) {
                                    keep = true;
                                    break;
                                }
                            }
                            content = keep ? content.replace(/\n{3,}/g, '\n\n') : content.replace(/\n+/g, '\n');
                        } else if (Config.removeEmptyLine === 'remove') {
                            content = content.replace(/\n+/g, '\n');
                        } else if (Config.removeEmptyLine === 'keep') {
                            content = content.replace(/\n{3,}/g, '\n\n');
                        }
                        // https://stackoverflow.com/a/25956935
                        content = content.replace(/^/gm, '\u3000\u3000'); // 每行增加空白字符作缩进
                    }
                    if (Config.language) content = tranStr(content, Config.language === 'tc');
                    chapter.content = content;

                    if (!chapter.title) continue;
                    chapter.title = chapter.title.replace(/\s+/g, ' ').trim();
                }
                //Thêm vào
                if (!force && Storage.rule.onComplete && typeof Storage.rule.onComplete === 'function') {
                    console.log("Gọi hàm onComplete của rule sau khi hoàn tất...");
                    try {
                        await Storage.rule.onComplete(Storage.book.chapters);
                    } catch (e) {
                        console.error("Lỗi khi thực thi onComplete của rule:", e);
                    }
                }

                //hết
                await downloadTo[format](chapters);
                if (force) {
                    await archiveDownloadManagerTask('forced_saved', {
                        forcedSavedAt: new Date().toISOString(),
                        errorSummary: failedChapters.length ? `${failedChapters.length} chương chưa tải khi buộc lưu` : ''
                    });
                    await persistDownloadResumeData();
                } else {
                    await finishDownloadManagerTask(failedChapters.length > 0 ? 'completed_with_errors' : 'completed');
                }
                if (!force) {
                    container.find('[name="buttons"]').find('[name="download"]').attr('disabled', null);
                    $(window).off('blur').off('focus');
                    Storage.audio.pause();
                    document.title = Storage.title;
                }
            };
            container.find('[name="buttons"]').find('[name="force-save"]').attr('disabled', null).on('click', async () => {
                await onComplete(true);
                //Thêm vào
                if (Storage.rule.onComplete && typeof Storage.rule.onComplete === 'function') {
                    console.log("Gọi hàm onComplete của rule khi Force Save...");
                    try {
                        await Storage.rule.onComplete(Storage.book.chapters);
                    } catch (e) {
                        console.error("Lỗi khi thực thi onComplete của rule (Force Save):", e);
                    }
                }
                //hết
            });
            const onChapterFailed = async (res, request) => {
                let chapter = request.raw;
                if ('chapter' in chapter) chapter = chapter.chapter;
                const status = res && (res.status || res.statusText)
                    ? `${res.status || ''} ${res.statusText || ''}`.trim()
                    : 'unknown';
                const responseText = res && res.responseText ? String(res.responseText).slice(0, 200).replace(/\s+/g, ' ') : '';
                const message = res && (res.error && res.error.message || res.error || res.statusText || responseText) || '';
                console.error('[ND] Tải chương thất bại:', chapter.title || chapter.url || 'Không rõ chương', status, message);
                chapter.contentRaw = '';
                chapter.content = '';
                chapter.document = '';
                await recordDownloadManagerError(chapter, res, 'download');
            };
            let failedCount = 0;
            const onChapterFailedEvery = Config.failedCount ? async (res, request, type) => {
                if (type === 'abort' || failedCount < 0) return;
                failedCount = failedCount + 1;
                if (failedCount > Config.failedCount) {
                    failedCount = -1;
                    xhr.pause();
                    if (Config.failedWait > 0) {
                        await waitInMs(30 * 1000);
                        failedCount = 0;
                        xhr.resume();
                    } else {
                        failedCount = 0;
                    }
                }
            } : null;
            let overrideMimeType = `text/html; charset=${document.characterSet}`;
            if (Storage.rule.charset) overrideMimeType = `text/html; charset=${Storage.rule.charset}`;
            const checkRelativeChapter = async (res, request, next) => {
                const chapter = request.raw;
                const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;

                let ruleChapterRelative;
                if (next) {
                    ruleChapterRelative = Config.useCommon ? (rule.chapterNext || Rule.chapterNext) : rule.chapterNext;
                } else {
                    ruleChapterRelative = Config.useCommon ? (rule.chapterPrev || Rule.chapterPrev) : rule.chapterPrev;
                }

                let chapterRelative = await getFromRule(ruleChapterRelative, { attr: 'href', allElement: true, document: new window.DOMParser().parseFromString(res.responseText, 'text/html') }, [res, request], []);
                chapterRelative = [].concat(chapterRelative).map((i) => new URL(i, res.finalUrl || window.location.href).href)
                    .filter((url) => url && !url.match(/^(javascript:|#)/)).map((i) => new URL(i, chapter.url).href)
                    .filter((url) => {
                        if (rule !== Rule && rule.ignoreUrl.some((i) => url.match(i))) return false;
                        if (rule !== Rule && rule.url.some((i) => url.match(i))) return false;
                        if (rule !== Rule && rule.chapterUrl.length) return rule.chapterUrl.some((i) => url.match(i));
                        const pathurl = chapter.url.replace(/(.*\/).*/, '$1').replace(/.*?:\/\/(.*)/, '$1');
                        const pathurlThis = url.replace(/(.*\/).*/, '$1');
                        return pathurlThis !== url && pathurlThis.replace(/.*?:\/\/(.*)/, '$1') === pathurl;
                    });
                let anchor = chapter;
                for (const url of chapterRelative) {
                    if (chaptersArr.includes(url) || vipChapters.includes(url)) continue;
                    const chapterNew = chaptersDownloaded.find((i) => i.url === url) || { url };
                    if (chapter.volume) chapterNew.volume = chapter.volume;
                    const index = Storage.book.chapters.indexOf(anchor);
                    anchor = chapterNew;
                    Storage.book.chapters.splice(next ? index + 1 : index, 0, chapterNew);
                    chaptersArr.splice(next ? index + 1 : index, 0, url);
                    await syncDownloadManagerTask('downloading');

                    const rule = vipChapters.includes(url) ? Storage.rule.vip : Storage.rule;

                    if (chapterNew.contentRaw && chapterNew.document) {
                        await originalOnChapterLoad({ response: chapterNew.document, responseText: chapterNew.document }, { raw: chapterNew });
                    } else {
                        delete chapterNew.contentRaw;
                        if (rule.iframe) {
                            chapterList.iframe.push(chapterNew);
                        } else if (rule.popup) {
                            chapterList.popup.push(chapterNew);
                        } else if (rule.deal && typeof rule.deal === 'function') {
                            chapterList.deal.push(chapterNew);
                        } else {
                            chapterList.download.push(chapterNew);
                        }
                    }
                }
            };
            //thêm
            const totalChapters = Storage.book.chapters.length;
            const getCompletedChapterCount = () => Storage.book.chapters.filter(ch => Boolean(ch.contentRaw || ch.content)).length;
            const setMainProgress = (completed = getCompletedChapterCount()) => {
                updateMainProgress(completed, totalChapters);
            };
            setMainProgress();
            const completedCount = getCompletedChapterCount();
            document.title = `[${completedCount}/${totalChapters}]${Storage.title}`;
            await syncDownloadManagerTask('downloading');

            function updateProgress(isSuccess = true) {
                const currentCompleted = getCompletedChapterCount();
                setMainProgress(currentCompleted);
                document.title = `[${currentCompleted}/${totalChapters}]${Storage.title}`;
                syncDownloadManagerTask('downloading');
            }

            // --- Hàm sleep ---
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            async function waitIfPaused() {
                if (downloadManagerCancelled) return;
                try {
                    if (xhr && typeof xhr.waitWhilePaused === 'function') {
                        await xhr.waitWhilePaused();
                        return;
                    }
                    if (xhr && xhr.storage && typeof xhr.storage.get === 'function') {
                        // eslint-disable-next-line no-unmodified-loop-condition
                        while (xhr.storage.get('pause')) {
                            await sleep(200);
                        }
                    }
                } catch (e) {
                    // ignore
                }
            }

            async function sleepWithPause(ms) {
                const step = 250;
                let remaining = ms;
                while (remaining > 0 && !downloadManagerCancelled) {
                    await waitIfPaused();
                    const t = Math.min(step, remaining);
                    await sleep(t);
                    remaining -= t;
                }
            }

            // --- Hàm xử lý từng chương ---
            const originalOnChapterLoad = async (res, request) => {
                // Hàm onChapterLoad gốc dùng để xử lý nội dung sau khi tải thành công
                //hết
                const chapter = request.raw;
                const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;

                if (failedCount > 0) failedCount = 0;
                if (rule.deal) return; // deal tự xử lý

                const doc = typeof res.response === 'object' ? res.response : new window.DOMParser().parseFromString(res.responseText, 'text/html');
                if (!chaptersDownloaded.includes(chapter)) chaptersDownloaded.push(chapter);
                let chapterTitle = await getFromRule(rule.chapterTitle, { attr: 'text', document: doc }, [res, request], '');
                chapterTitle = chapterTitle || chapter.title || $('title', doc).eq(0).text();
                if (chapterTitle.indexOf(Storage.book.title) === 0) chapterTitle = chapterTitle.replace(Storage.book.title, '').trim();
                chapter.title = chapterTitle;
                request.title = chapter.title;
                let contentCheck = true;
                if (rule.contentCheck) contentCheck = await getFromRule(rule.contentCheck, (selector) => $(selector, doc).length, [res, request], true);
                if (contentCheck) {
                    if (Storage.debug.content) debugger;
                    let content = chapter.content || await getFromRule(rule.content, (selector) => {
                        let elems = $(selector, doc);
                        if (Storage.debug.content) debugger;
                        if (rule === Rule) elems = elems.not(':emptyHuman'); // 移除空元素
                        if (elems.length === 0) { // 没有找到内容
                            console.error(`novelDownloader: 找不到内容元素\n选择器: ${selector}`);
                            elems = $('body', doc);
                        } else if (elems.length > 1) {
                            // 当a是b的祖辈元素时，移除a
                            elems = elems.filter((i, e) => !elems.not(e).toArray().find((j) => $(e).find(j).length));
                        }
                        return elems.toArray().map((i) => $(i).html());
                    }, [res, request], '');
                    if (content instanceof Array) content = content.join('\n');
                    //thêm
                    if (!content) { // Ngưỡng 10 ký tự ví dụ
                        console.warn(`%cNội dung chương '${chapter.title}' có vẻ rỗng hoặc quá ngắn. Đánh dấu là lỗi.`, "color: orange;");
                        chapter.contentRaw = ''; // Đánh dấu lỗi để có thể thử lại
                        throw new Error("Nội dung rỗng hoặc quá ngắn"); // Ném lỗi để onChapterFailed xử lý
                    } else {
                        chapter.content = content;
                        chapter.contentRaw = content;
                        chapter.document = res.responseText;
                    }
                    //hết
                    if (Config.addChapterPrev || Config.addChapterNext) {
                        if (Config.addChapterPrev) await checkRelativeChapter(res, request, false);
                        if (Config.addChapterNext) await checkRelativeChapter(res, request, true);
                    }
                } else {
                    console.warn(`%cContentCheck thất bại cho chương '${chapter.title}'. Đánh dấu là lỗi.`, "color: orange;");
                    chapter.contentRaw = '';
                    throw new Error("ContentCheck thất bại"); // Ném lỗi để onChapterFailed xử lý
                }
                updateProgress(true);
                await persistDownloadResumeData();
            };
            //thêm
            const chapterList = { iframe: [], popup: [], deal: [], download: [] };
            for (const chapter of Storage.book.chapters) {
                const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;
                if ('contentRaw' in chapter) { // Đã có nội dung từ trước
                    continue; // Bỏ qua, không cần tải lại
                }
                // Phân loại các chương *chưa* có nội dung
                if (rule.iframe) chapterList.iframe.push(chapter);
                else if (rule.popup) chapterList.popup.push(chapter);
                else if (rule.deal && typeof rule.deal === 'function') chapterList.deal.push(chapter);
                else chapterList.download.push(chapter);
            }//hết


            //thêm
            // === THỰC THI TUẦN TỰ ===

            // --- Hàm helper để phân loại chương cần xử lý ---
            const classifyChapters = (chaptersToProcess) => {
                const classifiedList = { iframe: [], popup: [], deal: [], download: [] };
                for (const chapter of chaptersToProcess) {
                    // Bỏ qua nếu đã có nội dung (quan trọng cho các lần thử lại)
                    if (chapter.contentRaw) continue;

                    const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;
                    if (rule.iframe) classifiedList.iframe.push(chapter);
                    else if (rule.popup) classifiedList.popup.push(chapter);
                    else if (rule.deal && typeof rule.deal === 'function') classifiedList.deal.push(chapter);
                    else classifiedList.download.push(chapter);
                }
                return classifiedList;
            };

            // Vòng lặp thử lại chính
            const maxAttempts = Math.max(0, Config.retry || 0);
            for (let attempt = 0; attempt <= maxAttempts; attempt++) {
                if (downloadManagerCancelled) break;
                let chaptersToProcess;
                if (attempt === 0) {
                    // Lần đầu tiên, xử lý tất cả chương
                    console.log("Bắt đầu lần tải đầu tiên...");
                    chaptersToProcess = Storage.book.chapters.filter(c => !c.contentRaw);
                } else {
                    // Các lần sau, chỉ xử lý các chương bị lỗi
                    chaptersToProcess = Storage.book.chapters.filter(c => !c.contentRaw);
                    if (chaptersToProcess.length === 0) {
                        console.log("%cTất cả chương đã được tải thành công. Không cần thử lại.", "color: green;");
                        break; // Thoát khỏi vòng lặp nếu không còn chương lỗi
                    }
                    console.log(`%cLần thử lại ${attempt}/${Config.retry}: Còn lại ${chaptersToProcess.length} chương lỗi.`, "color: orange; font-weight: bold;");
                    console.log(`%cĐang chờ ${Config.delayBetweenChapters / 1000} giây... trước khi tiếp tục.`, "color: orange");
                    await sleepWithPause(Config.delayBetweenChapters);
                }

                const currentRunList = classifyChapters(chaptersToProcess);

                // Init xhr dialog once per attempt so progress UI works for both download + deal flows
                try {
                    const baseThread = Storage.rule.thread && Storage.rule.thread < Config.thread ? Storage.rule.thread : Config.thread;
                    xhr.init({
                        retry: 0,
                        thread: Math.max(1, baseThread || 1),
                        timeout: Config.timeout,
                        onfailed: onChapterFailed,
                        onfailedEvery: onChapterFailedEvery,
                        checkLoad: async (res) => (res.status >= 200 && res.status < 300),
                    });
                    xhr.showDialog();
                } catch (e) {
                    // ignore: some environments might not have xhr dialog
                }

                // 1. Xử lý 'deal'
                if (currentRunList.deal.length > 0) {
                    console.log(`Bắt đầu xử lý (deal) ${currentRunList.deal.length} chương.`);
                    for (const chapter of currentRunList.deal) {
                        if (downloadManagerCancelled) break;
                        if (chapter.contentRaw) continue; // Bỏ qua nếu đã được xử lý bởi logic khác trong cùng lần chạy
                        await waitIfPaused();
                        if (Config.delayBetweenChapters > 0) {
                            console.log(`%cĐang chờ ${Config.delayBetweenChapters / 1000} giây... trước khi tiếp tục.`, "color: orange");
                            await sleepWithPause(Config.delayBetweenChapters);
                        }
                        console.log(`%cBắt đầu xử lý (deal) chương: ${chapter.title || chapter.url}`, "color: purple;");
                        let taskIndex = null;
                        try {
                            if (xhr.manual && typeof xhr.manual.add === 'function') {
                                taskIndex = xhr.manual.add({ url: chapter.url, title: chapter.title || '' });
                            }
                        } catch (e) { /* ignore */ }
                        try {
                            const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;
                            const result = await rule.deal(chapter);
                            if (typeof result === "string") {
                                if (result.trim().length < 1) throw new Error("Nội dung rỗng hoặc quá ngắn");
                                chapter.document = result;
                                chapter.contentRaw = result;
                                chapter.content = result;
                            } else if (result && result.content) {
                                if (result.content.trim().length < 1) throw new Error("Nội dung rỗng hoặc quá ngắn");
                                chapter.document = result.content;
                                chapter.contentRaw = result.content;
                                chapter.content = result.content;
                                if (result.title) chapter.title = result.title;
                            } else {
                                throw new Error(result?.error || "Hàm deal không trả về nội dung");
                            }
                            updateProgress();
                            await persistDownloadResumeData();
                            try {
                                if (taskIndex !== null && xhr.manual && typeof xhr.manual.done === 'function') {
                                    xhr.manual.done(taskIndex, { title: chapter.title || '' });
                                }
                            } catch (e) { /* ignore */ }
                        } catch (error) {
                            console.error(`%cLỗi khi thực thi deal cho chương: ${chapter.title || chapter.url}`, "color: red;", error);
                            chapter.contentRaw = '';
                            chapter.content = '';
                            chapter.document = '';
                            await recordDownloadManagerError(chapter, error, 'deal');
                            if (error && error.ndVerificationCancelled) {
                                downloadManagerCancelled = true;
                                console.warn('Đã dừng tải vì user hủy hoặc chưa vượt qua mã xác minh.');
                            }
                            try {
                                if (taskIndex !== null && xhr.manual && typeof xhr.manual.fail === 'function') {
                                    xhr.manual.fail(taskIndex, { title: chapter.title || '' });
                                }
                            } catch (e) { /* ignore */ }
                        }
                    }
                }


                // 2. Xử lý 'download' (xhr.list)
                if (currentRunList.download.length > 0) {
                    console.log(`Bắt đầu xử lý tải xuống ${currentRunList.download.length} chương theo lô.`);
                    let chunkSize = Storage.rule.thread && Storage.rule.thread < Config.thread ? Storage.rule.thread : Config.thread;
                    if (Config.addChapterNext || Config.addChapterPrev || (Config.thread < 1)) {
                        chunkSize = 1;
                    }

                    for (let i = 0; i < currentRunList.download.length; i += chunkSize) {
                        if (downloadManagerCancelled) break;
                        const chunk = currentRunList.download.slice(i, i + chunkSize);
                        const currentChunkNum = (i / chunkSize) + 1;
                        console.log(`%cĐang xử lý lô ${currentChunkNum} (gồm ${chunk.length} chương)`, "color: blue; font-weight: bold;");

                        // Đồng bộ: đợi đến khi thư viện hoàn tất xử lý xong (đã await onload handler)
                        xhr.storage.config.set('thread', Math.min(chunkSize, chunk.length));
                        await new Promise(resolveChunk => {
                            resolveDownloadManagerWait = resolveChunk;
                            xhr.storage.config.set('onComplete', async () => {
                                console.log(`%cĐã hoàn thành lô ${currentChunkNum}.`, "color: green;");
                                resolveDownloadManagerWait = null;
                                resolveChunk();
                            });

                            xhr.list(chunk, {
                                onload: async (res, request) => {
                                    await originalOnChapterLoad(res, request);
                                },
                                overrideMimeType
                            });
                            xhr.start();
                        });
                        if (downloadManagerCancelled) break;

                        if (i + chunkSize < currentRunList.download.length && Config.delayBetweenChapters > 0) {
                            console.log(`%cĐang chờ ${Config.delayBetweenChapters / 1000} giây... trước khi tiếp tục.`, "color: orange");
                            await sleepWithPause(Config.delayBetweenChapters);
                        }
                    }
                }

                // 3. Xử lý 'iframe'
                if (currentRunList.iframe.length > 0) {
                    console.log(`Bắt đầu xử lý (iframe) ${currentRunList.iframe.length} chương.`);
                    for (const chapter of currentRunList.iframe) {
                        if (downloadManagerCancelled) break;
                        if (chapter.contentRaw) continue;
                        await waitIfPaused();
                        const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;
                        let taskIndex = null;
                        try {
                            if (xhr.manual && typeof xhr.manual.add === 'function') {
                                taskIndex = xhr.manual.add({ url: chapter.url, title: chapter.title || '' });
                            }
                        } catch (e) { /* ignore */ }
                        await new Promise((resolve) => {
                            $('<iframe>').on('load', async (e) => {
                                try {
                                    let response, responseText;
                                    if (typeof rule.iframe === 'function') await rule.iframe(e.target.contentWindow);
                                    response = e.target.contentWindow.document;
                                    responseText = e.target.contentWindow.document.documentElement.outerHTML;
                                    await originalOnChapterLoad({ response, responseText }, { raw: chapter });
                                    try {
                                        if (taskIndex !== null && xhr.manual && typeof xhr.manual.done === 'function') {
                                            xhr.manual.done(taskIndex, { title: chapter.title || '' });
                                        }
                                    } catch (e) { /* ignore */ }
                                } catch (error) {
                                    console.error(`%cLỗi khi xử lý iframe cho chương: ${chapter.title || chapter.url}`, "color: red;", error);
                                    chapter.contentRaw = '';
                                    chapter.content = '';
                                    chapter.document = '';
                                    await recordDownloadManagerError(chapter, error, 'iframe');
                                    try {
                                        if (taskIndex !== null && xhr.manual && typeof xhr.manual.fail === 'function') {
                                            xhr.manual.fail(taskIndex, { title: chapter.title || '' });
                                        }
                                    } catch (e) { /* ignore */ }
                                } finally {
                                    $(e.target).remove();
                                    resolve();
                                }
                            }).attr('src', chapter.url).css('visibility', 'hidden').appendTo('body');
                        });
                        if (Config.delayBetweenChapters > 0) await sleepWithPause(Config.delayBetweenChapters);
                    }
                }

                // 4. Xử lý 'popup'
                if (currentRunList.popup.length > 0) {
                    console.log(`Bắt đầu xử lý (popup) ${currentRunList.popup.length} chương.`);
                    for (const chapter of currentRunList.popup) {
                        if (downloadManagerCancelled) break;
                        if (chapter.contentRaw) continue;
                        await waitIfPaused();
                        let taskIndex = null;
                        try {
                            if (xhr.manual && typeof xhr.manual.add === 'function') {
                                taskIndex = xhr.manual.add({ url: chapter.url, title: chapter.title || '' });
                            }
                        } catch (e) { /* ignore */ }
                        var popupWindow = window.open(chapter.url, '', 'resizable,scrollbars,width=300,height=350');
                        window.localStorage.setItem('gm-nd-url', chapter.url);
                        await waitFor(() => window.localStorage.getItem('gm-nd-html') || !popupWindow || popupWindow.closed);
                        const html = window.localStorage.getItem('gm-nd-html');
                        try {
                            await originalOnChapterLoad({ response: html, responseText: html }, { raw: chapter });
                            try {
                                if (taskIndex !== null && xhr.manual && typeof xhr.manual.done === 'function') {
                                    xhr.manual.done(taskIndex, { title: chapter.title || '' });
                                }
                            } catch (e) { /* ignore */ }
                        } catch (error) {
                            console.error(`%cLỗi khi xử lý popup cho chương: ${chapter.title || chapter.url}`, "color: red;", error);
                            chapter.contentRaw = '';
                            chapter.content = '';
                            chapter.document = '';
                            await recordDownloadManagerError(chapter, error, 'popup');
                            try {
                                if (taskIndex !== null && xhr.manual && typeof xhr.manual.fail === 'function') {
                                    xhr.manual.fail(taskIndex, { title: chapter.title || '' });
                                }
                            } catch (e) { /* ignore */ }
                        }
                        if (popupWindow && !popupWindow.closed) popupWindow.close();
                        window.localStorage.removeItem('gm-nd-url');
                        window.localStorage.removeItem('gm-nd-html');
                        if (Config.delayBetweenChapters > 0) await sleepWithPause(Config.delayBetweenChapters);
                    }
                }

            } // Kết thúc vòng lặp for (retry)

            // Sau khi tất cả các lần thử lại kết thúc, gọi onComplete lần cuối
            if (downloadManagerCancelled) return;
            console.log("Tất cả các lần tải và thử lại đã hoàn tất. Chuẩn bị lưu file...");
            await onComplete(); // Luôn gọi onComplete, nó sẽ tự xử lý các chương lỗi bên trong.
        });
        container.find('[name="buttons"]').find('[type="button"]:not([name="download"])').on('click', async (e) => {
            const name = $(e.target).attr('name');
            if (name === 'exit') {
                if (window.NDConsole && typeof window.NDConsole.setUiActive === 'function') {
                    window.NDConsole.setUiActive(false);
                }
                if (typeof removeConsoleStateListener === 'function') removeConsoleStateListener();
                ndUI$('.novel-downloader-style,.novel-downloader-v3').remove();
                $('.novel-downloader-style,.novel-downloader-style-chapter').remove();
                $('[novel-downloader-chapter]').attr('order', null).attr('novel-downloader-chapter', null);
                updateNovelDownloaderLauncherVisibility();
            } else if (name === 'toggle-opacity') {
                container.toggleClass('opacity01');
            } else if (name === 'toggle-console') {
                if (window.NDConsole) {
                    const isEnabled = window.NDConsole.toggle();
                    if (isEnabled) {
                        window.NDConsole.show();
                    } else {
                        window.NDConsole.hide();
                    }
                    syncConsoleButtons();
                }
            } else if (name === 'show-console') {
                if (window.NDConsole) window.NDConsole.show();
            }
        });
        container.find('[name="info"]>input[type="text"]').on('change', (e) => (Storage.book[$(e.target).attr('name')] = e.target.value));

        // style
        const style = [
            ':host{all:initial;display:block;position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:Arial,sans-serif;}',
            '*,*:before,*:after{box-sizing:border-box;}',
            '.novel-downloader-v3>div *,.novel-downloader-v3>div *:before,.novel-downloader-v3>div *:after{margin:1px;}',
            '.novel-downloader-v3,.novel-downloader-v3 *{font-family:Arial,sans-serif;font-size:13px;line-height:1.35;}',
            '.novel-downloader-v3 input,.novel-downloader-v3 textarea,.novel-downloader-v3 select{border:1px solid #000;opacity: 1;color:#000;background:#fff;}',
            '.novel-downloader-v3 input[type="checkbox"]{position:relative;top:0;opacity:1;appearance:checkbox;}',
            '.novel-downloader-v3 input[type="button"],.novel-downloader-v3 button{border:1px solid #000;cursor:pointer;padding:2px 3px;}',
            '.novel-downloader-v3 input[type=number]{width:36px;}',
            '.novel-downloader-v3 input[type=number]{width:36px;}',
            '.novel-downloader-v3 input:not([disabled="disabled"]),.novel-downloader-v3 button:not([disabled="disabled"]){color:#000;background-color:#fff;}',
            '.novel-downloader-v3 input[disabled="disabled"],.novel-downloader-v3 button[disabled="disabled"]{color:#fff;cursor:default!important;background-color:#545454;text-decoration:line-through double;}',
            '.novel-downloader-v3 span[title]::after{content:"(?)";text-decoration:underline;font-size:x-small;vertical-align:super;cursor:pointer;}',
            '.novel-downloader-v3 .nd-doc-link{border:0!important;background:transparent!important;color:#0645ad!important;text-decoration:underline;padding:0!important;margin:0 0 0 4px!important;font:inherit!important;cursor:pointer;}',

            '.novel-downloader-v3{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99999;background:white;border:1px solid black;max-height:99vh;overflow:auto;text-align:center;}',
            '.novel-downloader-v3{pointer-events:auto;color:#000;}',
            '.novel-downloader-v3.opacity01{opacity:0.1;}',
            '.novel-downloader-v3.opacity01:hover{opacity:0.6;}',
            '.novel-downloader-v3>div{margin:2px 0px;}',
            '.novel-downloader-v3>div:nth-child(2n){background-color:#DADADA;}',
            '.novel-downloader-v3>div:nth-child(2n+1){background-color:#FAFAFA;}',

            '.novel-downloader-v3>.useless[name="config"]{display:none;}',
            '.novel-downloader-v3>.useless[name="config"].is-visible{display:block;}',
            '.novel-downloader-v3>[name="config"] [name="vip"]:checked+span{color:red;}',
            '.novel-downloader-v3 .nd-customize-summary{display:inline-block;margin-left:6px;color:#475569;font-size:12px;vertical-align:middle;}',
            '.novel-downloader-v3 button[name="open-rule-editor"]{border:1px solid #0f766e!important;background:#ecfdf5!important;color:#134e4a!important;border-radius:5px;padding:3px 8px;font-weight:700;}',
            '.novel-downloader-v3 button[name="open-rule-editor"]:hover{background:#ccfbf1!important;border-color:#14b8a6!important;}',

            '.novel-downloader-v3>[name="progress"]{display:block;position:sticky;top:0;z-index:3;padding:3px 4px;border:1px solid #93c5fd;background:#eff6ff!important;}',
            '.novel-downloader-v3>[name="progress"]>[name="progress-text"]{display:inline-block;min-width:48px;text-align:right;font-weight:bold;}',
            '.novel-downloader-v3>[name="progress"]>progress{width:240px;height:14px;vertical-align:middle;}',
        ].join('');
        ensureNovelDownloaderUIStyle('novel-downloader-style', style).className = 'novel-downloader-style';

        const chapterMarkerStyle = [
            '[novel-downloader-chapter]:before{content:attr(order)"-"!important;}',
            '[novel-downloader-chapter]:before{color:blue!important;}',
            '[novel-downloader-chapter="vip"]:before{color:red!important;}',
        ].join('');
        $('<style class="novel-downloader-style novel-downloader-style-chapter-base">').text(chapterMarkerStyle).appendTo('head');

        container.find('label:has([name="rememberDownloadDir"])').hide();

        // rule
        container.find('[name="info"]>[name="rule"]').html(`<a href="${window.location.origin}" target="_blank">${Storage.rule.siteName}</a>`);

        let infoPage = await getFromRule(Storage.rule.infoPage, { attr: 'href' }, [], null);

        if (infoPage === window.location.href) {
            infoPage = null;
        } else if (infoPage) {
            infoPage = new URL(infoPage, window.location.href).href;
            try {
                // fetchPageContent cần selector dạng chuỗi
                const selector = typeof Storage.rule.title === 'string' ? Storage.rule.title : 'body';
                const infoPageHtml = await fetchPageContent(infoPage, selector);
                infoPage = new DOMParser().parseFromString(infoPageHtml, 'text/html');
            } catch (error) {
                console.error("Không thể lấy trang thông tin sách:", error);
                alert(`Lỗi: ${error}. Không thể lấy thông tin sách.`);
                infoPage = null;
            }
        }


        //console.log(infoPage);
        // rule-title

        let title = await getFromRule(Storage.rule.title, { document: infoPage || document }, [], '');
        if (!title && Storage.rule.titleRegExp instanceof RegExp) title = document.title.match(Storage.rule.titleRegExp) ? document.title.match(Storage.rule.titleRegExp)[1] : document.title;
        if (Storage.rule.titleReplace) title = replaceWithDict(title, Storage.rule.titleReplace);
        title = title.replace(/\s+/g, ' ').replace(/^《(.*)》$/, '$1').trim();
        Storage.book.title = title;

        // rule-writer

        let writer = await getFromRule(Storage.rule.writer, { document: infoPage || document }, [], '');
        writer = writer.replace(/\s+/g, ' ').replace(/.*作\s*者(:|：)|\s+著$/g, '').trim();
        Storage.book.writer = writer;

        // rule-intro,cover

        let intro = await getFromRule(Storage.rule.intro, { attr: 'html', document: infoPage || document }, [], '');
        intro = html2Text(intro, Storage.rule.contentReplace);
        intro = $('<div>').html(intro);
        if (Storage.rule.elementRemove || Config.useCommon) {
            if (Storage.rule.elementRemove) {
                $(`${Storage.rule.elementRemove},script,style,iframe`, intro).remove();
            } else if (Config.useCommon) {
                $(`${Rule.elementRemove},script,style,iframe`, intro).remove();
            }
        }
        intro = intro.text();
        Storage.book.intro = intro;
        Storage.book.cover = await getFromRule(Storage.rule.cover, { attr: 'src', document: infoPage || document }, [], '');
        for (const i of ['title', 'writer', 'intro', 'cover']) {
            container.find(`[name="info"]>[name="${i}"]`).val(Storage.book[i] || '');
        }

        if (Storage.mode === 1) {
            container.find('[name="info"]>[name="mode"]').text('Chế độ mục lục');
            const styleChapter = [
                '[novel-downloader-chapter]:before{display:none;}',
            ].join('');
            $('<style class="novel-downloader-style-chapter">').text(styleChapter).attr('media', 'max-width: 1px').appendTo('head');

            // rule-chapter

            chapters = await getFromRule(Storage.rule.chapter, async (selector) => {
                let elems = $(Storage.rule.chapter);
                if (Storage.rule !== Rule && Storage.rule.chapterUrl.length) elems = elems.filter((i, elem) => Storage.rule.chapterUrl.some((j) => elem.href.match(j)));
                let volumes;
                if (typeof Storage.rule.volume === 'string') {
                    volumes = $(Storage.rule.volume);
                } else if (typeof Storage.rule.volume === 'function' && Storage.rule.volume.length <= 1) {
                    volumes = await Storage.rule.volume(document);
                }
                volumes = $(volumes).toArray();
                const all = $(elems).add(volumes);
                let order = 1;
                return elems.attr('novel-downloader-chapter', '').toArray().map((i) => {
                    $(i).attr('order', order++);
                    const chapter = {
                        title: i.textContent,
                        url: i.href,
                    };
                    if (volumes && volumes.length) {
                        const volume = all.slice(0, all.index(i)).toArray().reverse().find((i) => volumes.includes(i));
                        if (volume) chapter.volume = html2Text(volume.textContent);
                    }
                    return chapter;
                });
            }, [], []);
            vipChapters = await getFromRule(Storage.rule.vipChapter, (selector) => $(Storage.rule.vipChapter).attr('novel-downloader-chapter', 'vip').toArray().map((i) => i.href), [], []);
            if (typeof Storage.rule.volume === 'function' && Storage.rule.volume.length > 1) chapters = await Storage.rule.volume(document, chapters);
        } else if (Storage.mode === 2) {
            container.find('[name="info"]>[name="mode"]').text('Chế độ chương');
            chapters = [window.location.href];
        }
        if (typeof Storage.rule.getChapters === 'function') chapters = await Storage.rule.getChapters(document);
        chapters = chapters.map((i) => (typeof i === 'string' ? { url: i } : i));
        vipChapters = vipChapters.concat(chapters.filter((i) => i.vip).map((i) => i.url));
        if (!Storage.rule.chapter && Storage.rule.chapterUrl.length) {
            let order = 1;
            const elems = Array.from(document.links).filter((i) => ((chapters.length || vipChapters.length)
                ? (chapters.map((i) => i.url).includes(i.href) || vipChapters.includes(i.href))
                : Storage.rule.chapterUrl.some((j) => i.href.match(j))));
            const temp = $(elems).toArray().map((i) => {
                $(i).attr('novel-downloader-chapter', vipChapters.includes(i.href) ? 'vip' : '').attr('order', order++);
                return {
                    title: i.textContent,
                    url: i.href,
                };
            });
            if (!chapters.length) chapters = temp;
        }

        const normalizeChapterUrlKey = (url) => {
            const value = String(url || '').trim();
            if (!value) return '';
            try {
                return new URL(value, window.location.href).href;
            } catch (error) {
                return value;
            }
        };
        const mergeResumeChapters = (resumeChapters, currentChapters) => {
            const savedByKey = new Map();
            const savedKeyOrder = [];
            (resumeChapters || []).forEach((savedChapter) => {
                const key = normalizeChapterUrlKey(savedChapter && savedChapter.url);
                if (!key) return;
                if (!savedByKey.has(key)) savedKeyOrder.push(key);
                savedByKey.set(key, savedChapter);
            });
            const usedKeys = new Set();
            const merged = (currentChapters || []).map((currentChapter) => {
                const key = normalizeChapterUrlKey(currentChapter && currentChapter.url);
                if (key && savedByKey.has(key)) {
                    usedKeys.add(key);
                    return Object.assign({}, currentChapter || {}, savedByKey.get(key) || {});
                }
                return currentChapter;
            });
            savedKeyOrder.forEach((key) => {
                if (usedKeys.has(key)) return;
                merged.push(savedByKey.get(key));
            });
            return merged;
        };

        if (!pendingResumeData && !pendingResumeTaskId && !options.resumeRequest) {
            const resumeCandidate = await findDownloadResumeCandidateForCurrentPage();
            if (resumeCandidate) {
                const shouldUseResume = await requestNovelDownloaderResumeChoice(resumeCandidate);
                if (shouldUseResume) {
                    pendingResumeTaskId = resumeCandidate.task.id;
                    pendingResumeData = resumeCandidate.data;
                    pendingResumeAutoStart = false;
                    console.log(`[ND] User chọn nạp dữ liệu tải dở task ${pendingResumeTaskId}: ${resumeCandidate.loadedCount}/${resumeCandidate.total} chương đã có nội dung.`);
                } else {
                    console.log(`[ND] User chọn tải mới, bỏ qua dữ liệu tải dở task ${resumeCandidate.task.id}.`);
                }
            }
        }

        if (pendingResumeData && Array.isArray(pendingResumeData.chapters) && pendingResumeData.chapters.length) {
            const resumeSourceUrl = normalizeDownloadResumeUrl(pendingResumeData.sourceUrl || (options.resumeRequest && options.resumeRequest.task && options.resumeRequest.task.sourceUrl));
            const currentResumeUrl = normalizeDownloadResumeUrl(window.location.href);
            if (resumeSourceUrl && resumeSourceUrl !== currentResumeUrl) {
                console.warn(`[ND] Bỏ qua dữ liệu tải dở vì URL nguồn không khớp. saved=${resumeSourceUrl}, current=${currentResumeUrl}`);
                ndShowToast('Bỏ qua dữ liệu tải dở vì không cùng URL truyện.', 'warning', 3500);
                pendingResumeData = null;
                pendingResumeTaskId = null;
                pendingResumeAutoStart = false;
            }
        }

        if (pendingResumeData && Array.isArray(pendingResumeData.chapters) && pendingResumeData.chapters.length) {
            Storage.book = Object.assign(Storage.book, pendingResumeData.book || {});
            chapters = mergeResumeChapters(pendingResumeData.chapters, chapters);
            vipChapters = Array.isArray(pendingResumeData.vipChapters) ? pendingResumeData.vipChapters.slice() : vipChapters;
            chaptersDownloaded.splice(0, chaptersDownloaded.length, ...chapters.filter(chapter => chapter.contentRaw || chapter.content));
            container.find('[name="limit"]>[name="range"]').val('');
            container.find('[name="limit"]>[name="batch"]').val('');
            for (const name of ['title', 'writer', 'intro', 'cover']) {
                container.find(`[name="info"]>[name="${name}"]`).val(Storage.book[name] || '');
            }
            console.log(`[ND] Đã nạp dữ liệu tiếp tục task ${pendingResumeTaskId}: ${chaptersDownloaded.length}/${chapters.length} chương đã có nội dung.`);
            ndShowToast(`Tiếp tục tải: đã có ${chaptersDownloaded.length}/${chapters.length} chương.`, 'info', 3000);
        }
        updateMainProgress(chaptersDownloaded.length, chapters.length);

        container.find('input,select,textarea').attr('disabled', null);
        container.find('input,select,textarea').filter('[raw-disabled="disabled"]').attr('raw-disabled', null).attr('disabled', 'disabled');
        syncConsoleButtons();

        container.find('[name="rememberDownloadDir"]').prop('checked', !!Config.rememberDownloadDir);

        if (pendingResumeAutoStart && pendingResumeTaskId && pendingResumeData) {
            window.setTimeout(() => {
                const format = pendingResumeData.format || 'text';
                const button = container.find(`[name="download"][format="${format}"]`).get(0)
                    || container.find('[name="download"][format="text"]').get(0);
                if (button && !button.disabled) button.click();
            }, 300);
        }

        if (Storage.debug.book) console.log(Storage.book);
    }

    // ============================================================================
    // Bootstrap & Entry Points
    // ============================================================================

    async function getPendingResumeRequest() {
        if (!TaskManager || typeof TaskManager.peekResumeRequestForUrl !== 'function') return null;
        try {
            return await TaskManager.peekResumeRequestForUrl(window.location.href);
        } catch (error) {
            console.warn('[ND] Không thể đọc yêu cầu tiếp tục:', error);
            return null;
        }
    }

    async function openNovelDownloaderUiFromEntry() {
        const resumeRequest = await getPendingResumeRequest();
        init();
        await showUI({ resumeRequest });
        updateNovelDownloaderLauncherVisibility();
    }


    const trigger = $('<div class="novel-downloader-trigger" style="position:fixed;top:0px;left:0px;width:1px;height:100%;z-index:999999;background:transparent;pointer-events:auto;"></div>').on({
        dblclick() {
            openNovelDownloaderUiFromEntry();
        },
    });
    (getNovelDownloaderUIRoot(true) || document.body).appendChild(trigger[0]);

    GM_registerMenuCommand("Download Novel", () => {
        openNovelDownloaderUiFromEntry();
    }, 'N');
    GM_registerMenuCommand('Quản lý tải xuống', () => {
        openNovelDownloaderManagerUi();
    }, 'S');

    getPendingResumeRequest().then((resumeRequest) => {
        if (resumeRequest) openNovelDownloaderUiFromEntry();
    });
    window.addEventListener('resize', updateNovelDownloaderLauncherVisibility);
    updateNovelDownloaderLauncherVisibility();

    // ============================================================================
    // Output Builders
    // ============================================================================

    const downloadTo = {
        debug: async (chapters) => { // TODO
            console.log(chapters);
        },
        text: async (chapters) => {
            const { length } = String(chapters.length);
            const title = Storage.book.title || Storage.book.chapters[0].title;
            const writer = Storage.book.writer || 'novelDownloader';

            let all = [
                `Tên sách: ${title}`,
                Storage.book.writer ? `Tác giả: ${writer}` : '',
                Storage.book.intro ? `Giới thiệu: ${Storage.book.intro}` : '',
                Config.reference ? 'Lưu ý trước khi đọc: Cuốn sách này được sản xuất bởi user script NovelDownloader' : '',
                Config.reference ? 'User script được bổ sung và nâng cấp bởi QB. ' : '',
                Config.reference ? `Địa chỉ nguồn: ${window.location.href}` : '',
            ].filter((i) => i);
            all.push('');

            for (let i = 0; i < chapters.length; i++) {
                let { title, content } = chapters[i];
                if (Config.titleRename) {
                    title = Config.titleRename.replace(/\{(.*?)\}/g, (all, group1) => {
                        if (group1 === 'title') return title;
                        if (group1 === 'order') return String(i + 1);
                        return all;
                    });
                }
                all.push(`${title}\n${content || ''}\n`);
            }
            all = all.join('\n');
            const blob = new window.Blob([all], {
                type: 'text/plain;charset=utf-8',
            });
            download(blob, `${title}__${writer}.txt`);
        },
        epub: async (chapters) => {
            const { length } = String(chapters.length);
            const title = Storage.book.title || Storage.book.chapters[0].title;
            const writer = Storage.book.writer || 'novelDownloader';
            const uuid = `ndv3-${window.location.href.match(/[a-z0-9-]+/ig).join('-')}${ndUI$('.novel-downloader-v3').find('[name="limit"]>[name="range"]').val()}`;
            const href = $('<div>').text(window.location.href).html();
            const date = new Date().toISOString();

            let cover = Storage.book.coverBlob;
            if (!Storage.book.coverBlob && Storage.book.cover) {
                try {
                    const res = await xhr.sync(Storage.book.cover, null, {
                        responseType: 'arraybuffer',
                        timeout: Config.timeout * 10,
                    });
                    Storage.book.coverBlob = new window.Blob([res.response], {
                        type: res.responseHeaders.match(/content-type:\s*(image.*)/i) ? res.responseHeaders.match(/content-type:\s*(image.*)/i)[1] : 'image/png',
                    });
                    cover = Storage.book.coverBlob;
                } catch (error) {
                    console.error(error);
                }
            }
            if (!cover) cover = await getCover(title);

            const files = {
                mimetype: 'application/epub+zip',
                'META-INF/container.xml': '<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" /></rootfiles></container>',
                'OEBPS/stylesheet.css': Config.css,
                'OEBPS/cover.jpg': cover,
                'OEBPS/content.opf': [
                    `<?xml version="1.0" encoding="UTF-8"?><package version="2.0" unique-identifier="${uuid}" xmlns="http://www.idpf.org/2007/opf"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">`,
                    `<dc:title>${title}</dc:title>`,
                    `<dc:creator>${writer}</dc:creator>`,
                    '<dc:publisher>novelDownloader</dc:publisher>',
                    `<dc:date>${date}</dc:date>`,
                    `<dc:source>${href}</dc:source>`,
                    `<dc:identifier id="${uuid}">urn:uuid:${uuid}</dc:identifier>`,
                    `<dc:language>${$('html').attr('xml:lang') || $('html').attr('lang') || 'zh-CN'}</dc:language>`,
                    '<meta name="cover" content="cover-image" /></metadata><manifest><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="cover" href="cover.html" media-type="application/xhtml+xml"/><item id="css" href="stylesheet.css" media-type="text/css"/>',
                ].join(''),
                'OEBPS/toc.ncx': `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd"><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="urn:uuid:${uuid}"/><meta name="dtb:depth" content="1"/><meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/></head><docTitle><text>${title}</text></docTitle><navMap><navPoint id="navpoint-1" playOrder="1"><navLabel><text>首页</text></navLabel><content src="cover.html"/></navPoint>`,
                'OEBPS/cover.html': `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${title}</title><link type="text/css" rel="stylesheet" href="stylesheet.css" /><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body>${[
                    `<h1>${title}</h1>`,
                    Storage.book.writer ? `<h2>${Storage.book.writer}</h2>` : '',
                    Storage.book.intro ? `<h2>Giới thiệu: ${Storage.book.intro}</h2>` : '',
                    Config.reference ? '<h3>Lưu ý trước khi đọc: Cuốn sách này được sản xuất bởi user script NovelDownloader</h3>' : '',
                    Config.reference ? `<h3>Địa chỉ nguồn: <a href="${href}" target="_blank">${href}</a></h3>` : '',
                ].filter((i) => i).join('')}</body></html>`,
            };

            if (Config.image) {
                for (const chapter of Storage.book.chapters) {
                    const contentDom = $('<div>').html(chapter.content);
                    for (const url of $('img', contentDom).toArray().map((i) => $(i).attr('src'))) {
                        if (!Storage.book.image.find((i) => i.raw === url)) {
                            Storage.book.image.push({
                                raw: url,
                                url: new URL(url, chapter.url).href,
                            });
                        }
                    }
                }

                if (Storage.book.image.filter((i) => !i.content).length) {
                    await new Promise((resolve, reject) => {
                        xhr.init({
                            retry: Config.retry,
                            thread: Storage.rule.thread && Storage.rule.thread < Config.thread ? Storage.rule.thread : Config.thread,
                            timeout: Config.timeout * 10,
                            onComplete: () => {
                                resolve();
                            },
                            checkLoad: async (res) => {
                                if ((res.status > 0 && res.status < 200) || res.status >= 300) {
                                    return false;
                                }
                                return true;
                            },
                        });
                        xhr.showDialog();
                        xhr.list(Storage.book.image.filter((i) => !i.content), {
                            responseType: 'arraybuffer',
                            onload: (res, reuqest) => {
                                const index = Storage.book.image.indexOf(reuqest.raw);
                                Storage.book.image[index].content = res.response;
                                Storage.book.image[index].type = res.responseHeaders.match(/content-type:\s*image\/(.*)/i) ? res.responseHeaders.match(/content-type:\s*image\/(.*)/i)[1] : 'image/png';
                            },
                        });
                        xhr.start();
                    });
                }

                const { length } = String(Storage.book.image.length);
                for (let i = 0; i < Storage.book.image.length; i++) {
                    const imgOrder = String(i + 1).padStart(length, '0');
                    const type = Storage.book.image[i].type ? Storage.book.image[i].type.split(';')[0] : 'png';
                    const imgName = `img/img-${imgOrder}.${type}`;
                    Storage.book.image[i].name = imgName;
                    files['OEBPS/content.opf'] = `${files['OEBPS/content.opf']}<item id="img-${imgOrder}" href="${imgName}" media-type="image/jpeg"/>`;
                    files[`OEBPS/${imgName}`] = Storage.book.image[i].content;
                }

                for (const chapter of Storage.book.chapters) {
                    const contentDom = $('<div>').html(chapter.content);
                    for (const elem of $('img', contentDom).toArray()) {
                        if (Storage.book.image.find((i) => i.raw === $(elem).attr('src'))) {
                            contentDom.find(elem).attr('src', Storage.book.image.find((i) => i.raw === $(elem).attr('src')).name);
                        }
                    }
                    chapter.content = contentDom.html();
                }
            }

            let itemref = '<itemref idref="cover" linear="yes"/>';
            let volumeCurrent;
            for (let i = 0; i < chapters.length; i++) {
                const chapter = chapters[i];
                const chapterName = chapter.title;
                const chapterOrder = String(i + 1).padStart(length, '0');
                const chapterContent = replaceWithDict(chapter.content.trim(), [
                    [/\n/g, '</p><p>'], [/<p>\s+/g, '<p>'],
                    [/&[a-z]+;/g, (match) => {
                        const text = $('<a>').html(match).text();
                        if (text.length > 1) return match;
                        return `&#${text.charCodeAt(0)};`;
                    }],
                ]);

                if (Config.tocIndent) {
                    if (Config.volume && chapter.volume && chapter.volume !== volumeCurrent) {
                        if (volumeCurrent) files['OEBPS/toc.ncx'] = `${files['OEBPS/toc.ncx']}</navPoint>`;
                        volumeCurrent = chapter.volume;
                        files['OEBPS/toc.ncx'] = `${files['OEBPS/toc.ncx']}<navPoint id="chapter${chapterOrder}" playOrder="${i + 2}"><navLabel><text>${chapterName}</text></navLabel><content src="${chapterOrder}.html"/>`;
                    } else {
                        files['OEBPS/toc.ncx'] = `${files['OEBPS/toc.ncx']}<navPoint id="chapter${chapterOrder}" playOrder="${i + 2}"><navLabel><text>${chapterName}</text></navLabel><content src="${chapterOrder}.html"/></navPoint>`;
                    }
                    if (Config.volume && chapter.volume && i === chapters.length - 1) files['OEBPS/toc.ncx'] = `${files['OEBPS/toc.ncx']}</navPoint>`;
                } else {
                    files['OEBPS/toc.ncx'] = `${files['OEBPS/toc.ncx']}<navPoint id="chapter${chapterOrder}" playOrder="${i + 2}"><navLabel><text>${chapterName}</text></navLabel><content src="${chapterOrder}.html"/></navPoint>`;
                }

                files['OEBPS/content.opf'] = `${files['OEBPS/content.opf']}<item id="chapter${chapterOrder}" href="${chapterOrder}.html" media-type="application/xhtml+xml"/>`;
                itemref = `${itemref}<itemref idref="chapter${chapterOrder}" linear="yes"/>`;
                files[`OEBPS/${chapterOrder}.html`] = `<html xmlns="http://www.w3.org/1999/xhtml"><head><title>${chapterName}</title><link type="text/css" rel="stylesheet" media="all" href="stylesheet.css" /><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /></head><body><h3>${chapterName}</h3>` + `<div><p>${chapterContent}</p></div></body></html>`;
            }
            files['OEBPS/content.opf'] = `${files['OEBPS/content.opf']}<item id="cover-image" href="cover.jpg" media-type="image/jpeg"/></manifest><spine toc="ncx">${itemref}</spine><guide><reference href="cover.html" type="cover" title="Cover"/></guide></package>`;
            files['OEBPS/toc.ncx'] = `${files['OEBPS/toc.ncx']}</navMap></ncx>`;

            const zip = new JSZip();
            for (const file in files) {
                zip.file(file, files[file]);
            }
            const file = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 9,
                },
            });
            download(file, `${title}.epub`);
        },
        zip: async (chapters) => {
            const { length } = String(chapters.length);
            const title = Storage.book.title || Storage.book.chapters[0].title;

            const files = {};
            files[`${String(0).padStart(length, '0')}-说明文件.txt`] = [
                `本书名称: ${title}`,
                Storage.book.writer ? `本书作者: ${Storage.book.writer}` : '',
                Storage.book.intro ? `本书简介: ${Storage.book.intro}` : '',
                Config.reference ? '阅读前说明：本书籍由用户脚本novelDownloader制作' : '',
                Config.reference ? `来源地址: ${window.location.href}` : '',
            ].filter((i) => i).join('\n');

            for (let i = 0; i < chapters.length; i++) {
                const { title, content } = chapters[i];
                //files[`${String(i + 1).padStart(length, '0')}-${title.replace(/[\\/:*?"<>|]/g, '-')}.txt`] = content;
                files[`${String(i + 1).padStart(length, '0')}-${title.replace(/[\\/:*?"<>|]/g, '-')}.txt`] = title + "\n" + content;
            }

            const zip = new JSZip();
            for (const file in files) {
                zip.file(file, files[file]);
            }
            const file = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 9,
                },
            });
            download(file, `${title}.zip`);
        },
    };

    /** @name getFromRule
    * @param {string | function} value
    * @param {object | function} argsString 当为function时，参数为value
    * @param {array} argsFunction
  */
    async function getFromRule(value, argsString = {}, argsFunction = [], defaultValue) {
        argsFunction = [].concat(argsFunction);
        let returnValue;

        if (typeof argsString !== 'function') {
            argsString = {
                attr: 'text',
                document,
                allElement: false,
                ...argsString,
            };
        }
        if (typeof argsString.document === 'string') {
            try {
                argsString.document = new window.DOMParser().parseFromString(argsString.document, 'text/html');
            } catch (error) {
                console.error(error);
            }
        }

        if (typeof value === 'string' && typeof argsString !== 'function') {
            const args = argsString;
            argsString = () => {
                const elem = $(value, args.document || document);
                if (args.allElement) {
                    return elem.toArray().map((i) => (args.attr === 'html' ? $(i).html() : args.attr === 'text' ? $(i).text() : $(i).attr(args.attr) || $(i).prop(args.attr)));
                }
                return args.attr === 'html' ? elem.eq(0).html() : args.attr === 'text' ? elem.eq(0).text() : elem.eq(0).attr(args.attr) || elem.eq(0).prop(args.attr);
            };
        }
        if (typeof value === 'string') {
            returnValue = await argsString(value);
        } else if (typeof value === 'function') {
            try {
                returnValue = await value(argsString.document || document, ...argsFunction);
            } catch (error) {
                console.error(error);
            }
        }
        returnValue = returnValue !== null && returnValue !== undefined ? returnValue : defaultValue;
        return returnValue;
    }

    // ============================================================================
    // Text Conversion & Cover Helpers
    // ============================================================================

    function html2Text(text = '', specialDict = []) { // TODO 需要优化
        const dict = (specialDict || []).concat([
            [/<\/p>(\s*)<p(\s+.*?)?>/gi, '\n'],
            [/<\/p>|<p(\s+.*?)?>/gi, '\n'],
            [/<br\s*\/?>/gi, '\n'],
            [/<(\w+)&nbsp;/g, '&lt;$1&nbsp;'],
            [/(\S)<(div)/g, '$1\n<$2'],
            [/<\/(div)>(\S)/g, '</$1>\n$2'],
        ]).filter((i) => typeof i === 'object' && i instanceof Array && i.length).map((i) => {
            const arr = i;
            if (typeof arr[0] === 'string') arr[0] = new RegExp(arr[0], 'gi');
            if (typeof arr[1] === 'undefined') arr[1] = '';
            return arr;
        });
        return replaceWithDict(text, dict).trim();
    }
    function replaceWithDict(text = '', dict = []) {
        let replace = dict.find((i) => text.match(i[0]));
        let replaceLast = null;
        let textLast = null;
        while (replace) {
            if (replace === replaceLast && textLast === text) {
                console.error(`novelDownloader: 替换文本陷入死循环\n替换规则: ${replace}`);
                dict.splice(dict.indexOf(replace), 1);
            }
            textLast = text;
            text = text.replace(replace[0], replace[1] || '');
            replaceLast = replace;
            replace = dict.find((i) => text.match(i[0]));
        }
        return text;
    }
    function getCover(txt) {
        const fontSize = 20;
        const width = 180;
        const height = 240;
        const color = '#000';
        const lineHeight = 10;
        /// ////////
        const maxlen = width / fontSize - 2;
        const txtArray = txt.split(new RegExp(`(.{${maxlen}})`));
        let i = 1;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.fillStyle = color;
        context.strokeRect(0, 0, width, height);
        context.font = `${fontSize}px sans-serif`;
        context.textBaseline = 'top';
        let fLeft,
            fTop;
        for (let j = 0; j < txtArray.length; j++) {
            if (txtArray[j] === '') continue;
            fLeft = fontSize * ((maxlen - txtArray[j].length) / 2 + 1);
            fTop = fontSize / 4 + fontSize * i + lineHeight * i;
            context.fillText(txtArray[j], fLeft, fTop, canvas.width);
            context.fillText('\n', fLeft, fTop, canvas.width);
            i++;
        }
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            });
        });
    }
    function waitInMs(time) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, time);
        });
    }
    function waitFor(event, timeout) {
        return new Promise((resolve, reject) => {
            const now = new Date().getTime();
            let id;
            id = setInterval(() => {
                if (new Date().getTime() - now >= timeout) {
                    if (id) clearInterval(id);
                    id = null;
                    resolve(false);
                } else if (event()) {
                    if (id) clearInterval(id);
                    id = null;
                    resolve(true);
                }
            }, 200);
        });
    }

    // ============================================================================
    // File Save & Dialog Helpers
    // ============================================================================

    async function showCustomConfirm(message, buttons) {
        const uiRoot = getNovelDownloaderUIRoot(true) || document.body;
        // Tạo style nếu chưa có
        if (!uiRoot.querySelector('#nd-custom-confirm-style')) {
            const style = document.createElement('style');
            style.id = 'nd-custom-confirm-style';
            style.textContent = `
                :host{all:initial;display:block;position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:Arial,sans-serif;}
                *,*:before,*:after{box-sizing:border-box;}
                .nd-confirm-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000000; display: flex; align-items: center; justify-content: center; pointer-events:auto; }
                .nd-confirm-box { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); text-align: center; max-width: 400px; font-family: sans-serif; }
                .nd-confirm-message { margin-bottom: 20px; font-size: 16px; color: #333; }
                .nd-confirm-buttons button { border: none; padding: 10px 18px; margin: 0 8px; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: bold; }
                .nd-confirm-buttons button.primary { background-color: #e74c3c; color: white; }
                .nd-confirm-buttons button.secondary { background-color: #3498db; color: white; }
                .nd-confirm-buttons button.default { background-color: #bdc3c7; color: #2c3e50; }
            `;
            uiRoot.appendChild(style);
        }

        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'nd-confirm-overlay';

            const box = document.createElement('div');
            box.className = 'nd-confirm-box';

            const msg = document.createElement('div');
            msg.className = 'nd-confirm-message';
            msg.textContent = message;

            const btnContainer = document.createElement('div');
            btnContainer.className = 'nd-confirm-buttons';

            const buttonClasses = ['primary', 'secondary', 'default'];
            buttons.forEach((btnText, index) => {
                const btn = document.createElement('button');
                btn.textContent = btnText;
                btn.className = buttonClasses[index] || 'default';
                btn.onclick = () => {
                    overlay.remove();
                    resolve(btnText.toLowerCase());
                };
                btnContainer.appendChild(btn);
            });

            box.appendChild(msg);
            box.appendChild(btnContainer);
            overlay.appendChild(box);
            uiRoot.appendChild(overlay);
        });
    }

    async function download(content, name, force) {
        const lastDownload = Storage.lastDownload || {};
        const time = new Date().getTime();
        if (!force && time - lastDownload.time <= 5 * 1000 &&
            lastDownload.size === content.size && lastDownload.type === content.type &&
            lastDownload.name === name) { // 5秒内重复下载
            return;
        }
        Storage.lastDownload = {
            time,
            size: content.size,
            type: content.type,
            name,
        };

        await fileSave.saveContent({
            content,
            name,
            dirHandle: Storage.downloadDirHandle,
            confirmOverwrite: (fileName) => showCustomConfirm(
                `Tệp "${fileName}" đã tồn tại. Bạn muốn làm gì?`,
                ['Ghi đè', 'Đổi tên', 'Hủy']
            ),
            toast: ndShowToast,
            saveAsFallback: saveAs
        });
    }

    $.expr[':'].emptyHuman = function (elem) {
        return $(elem).children().length === 0 && (elem.textContent || elem.innerText || $(elem).text() || '').trim() === '';
    };
    $.expr[':'].hiddenHuman = function (elem) {
        return $(elem).css('display') === 'none' || $(elem).css('visibility') === 'hidden' || $(0).css('opacity') === '0';
    };
    $.expr[':'].visibleHuman = function (elem) {
        return !$(elem).is(':hiddenHuman');
    };
    $.expr[':'].nochild = function (elem) {
        return $(elem).children().length === 0;
    };
    $.expr[':'].minsize = function (elem, index, meta, stack) {
        return (elem.textContent || elem.innerText || $(elem).text() || '').trim().length >= meta[3];
    };
    $.expr[':'].maxsize = function (elem, index, meta, stack) {
        return (elem.textContent || elem.innerText || $(elem).text() || '').trim().length <= meta[3];
    };
    $.expr[':'].regexp = function (elem, index, meta, stack) {
        return !!(elem.textContent || elem.innerText || $(elem).text() || '').match(new RegExp(meta[3], 'i'));
    };
}());
