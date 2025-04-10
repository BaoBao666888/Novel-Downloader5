/* eslint-env browser */
// ==UserScript==
// @name        novelDownloaderVietSub
// @description Menu Download Novel hoặc nhấp đúp vào cạnh trái của trang để hiển thị bảng điều khiển
// @version     3.5.447.2
// @author      dodying | BaoBao
// @namespace   https://github.com/dodying/UserJs
// @supportURL  https://github.com/dodying/UserJs/issues
// @icon        https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/Logo.png
// @downloadURL https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/novelDownloaderVietSub.user.js
// @updateURL   https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/novelDownloaderVietSub.user.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.0/jquery.js

// @require     https://raw.githubusercontent.com/BaoBao666888/Novel-Downloader5/main/download-vietnamese.js

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
// @run-at      document-end
// @connect     *
// @include     *
// @noframes
// ==/UserScript==
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
/* global $ xhr tranStr JSZip saveAs CryptoJS opentype */

; (function () { // eslint-disable-line no-extra-semi
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
            book: true,
            content: false,
        },
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

    Rule.special = [
        { // https://manhua.dmzj.com/
            siteName: '动漫之家',
            url: '://manhua.dmzj.com/[a-z0-9]+/',
            chapterUrl: '://manhua.dmzj.com/[a-z0-9]+/\\d+.shtml',
            title: '.anim_title_text h1',
            writer: '.anim-main_list a[href^="../tags/"]',
            intro: '.line_height_content',
            cover: '#cover_pic',
            chapter: '[class^="cartoon_online_border"]>ul>li>a',
            volume: '.h2_title2>h2',
            chapterTitle: '.display_middle',
            content: '#center_box',
            iframe: true,
            contentReplace: [
                [/<img id="img_\d+" style=".*?" data-original="(.*?)" src=".*?">/g, '<img src="$1">'],
            ],
        },
        { // https://www.manhuabei.com/ https://www.manhuafen.com/
            siteName: '漫画堆',
            filter: () => ($('.dmzj-logo').length && $('.wrap_intro_l_comic').length && $('.wrap_intro_r').length && $('.list_con_li').length
                           ? 1
                           : $('.foot-detail:contains("漫画")').length && $('.dm_logo').length && $('.chapter-view').length ? 2 : 0),
            title: '.comic_deCon>h1',
            writer: '.comic_deCon_liO>li>a[href^="/author/"]',
            intro: '.comic_deCon_d',
            cover: '.comic_i_img>img',
            chapter: '.list_con_li>li>a',
            volume: '.zj_list_head>h2>em',
            chapterTitle: '.head_title>h2',
            iframe: (win) => $('<div class="nd3-images">').html(win.chapterImages.map((item, index, arr) => `<img data-src="${win.SinMH.getChapterImage(index + 1)}" /><p class="img_info">(${index + 1}/${arr.length})</p>`).join('')).appendTo(win.document.body),
            content: '.nd3-images',
            contentReplace: [
                [/<img data-src/g, '<img src'],
            ],
        },
        { // https://www.manhuagui.com/
            siteName: '漫画柜',
            url: '://www.manhuagui.com/comic/\\d+/$',
            chapterUrl: '://www.manhuagui.com/comic/\\d+/\\d+.html',
            title: '.book-title>h1',
            writer: '.detail-list [href^="/author/"]',
            intro: '#intro-all',
            cover: '.book-cover>.hcover>img',
            chapter: '.chapter-list a',
            volume: 'h4>span',
            chapterTitle: '.title h2',
            content: (doc, res, request) => {
                let info = res.responseText.match(/window\["\\x65\\x76\\x61\\x6c"\](.*?)<\/script>/)[1];
                info = window.eval(info); // eslint-disable-line no-eval
                info = info.match(/^SMH.imgData(.*?).preInit\(\);/)[1];
                info = window.eval(info); // eslint-disable-line no-eval
                const a = info.files.map((item, index, arr) => `<img src="https://us.hamreus.com${info.path}${item}?e=${info.sl.e}&m=${info.sl.m}" /><p class="img_info">(${index + 1}/${arr.length})</p>`);
                return a.join('');
            },
            contentReplace: [
                [/<img id="img_\d+" style=".*?" data-original="(.*?)" src=".*?">/g, '<img src="$1">'],
            ],
        },
        // 文学
        {
            siteName: '69shuba',
            url: '://www.69shuba.com/book/\\d+/',
            chapterUrl: '://www.69shuba.com/txt/\\d+/\\d+',
            title: 'h3.mytitle.shuye .bread a:nth-of-type(3)',
            chapter: '.mybox .catalog:last ul a',
            chapterTitle: '.txtnav h1.hide720',
            content: 'div.txtnav',
            elementRemove: 'h1, div',
            chapterNext: '.page1 a:contains("上一章")',
            chapterNext: '.page1 a:contains("下一章")'
        },
        { // https://www.52shuku.vip/
            siteName: '52书库',
            filter: () => (window.location.host === 'www.52shuku.vip' ? ($('.list.clearfix').length ? 1 : 2) : 0),
            url: '://www.52shuku.vip/\\w+/\\w+/\\w+.html$',
            chapterUrl: '://www.52shuku.vip/\\w+/\\w+/\\w+_\\d+.html$',
            title: () => {
                const breadcrumbs = $('.content-wrap .breadcrumbs');
                if (breadcrumbs.length > 0) {
                    let text = breadcrumbs.find('a:last').text().replace('丹青手', '').replace('扶子不好吃', '');
                    if (text.endsWith('丹青手')) {
                        text = text.replace('丹青手', '');
                    } else if (text.endsWith('扶子不好吃')) {
                        text = text.replace('扶子不好吃', '');
                    }
                    return text;
                }
                return '';
            },
            chapter: '.list.clearfix > li > a',
            chapterTitle: '#nr_title',
            content: '#nr1',
            elementRemove: '.related_top, .article-header, .article-nav, script, .chapterNum, .pagination2, hr + p, #go-top',
            chapterPrev: '.pagination2 a:contains("上一页")',
            chapterNext: '.pagination2 a:contains("下一页")',
        },
        { // http://gj.zdic.net
            siteName: '汉典古籍',
            filter: () => (window.location.host === 'gj.zdic.net' ? ($('#ml_1').length ? 1 : 2) : 0),
            title: '#shuye>h1',
            intro: '#jj_2',
            chapter: '.mls>li>a',
            chapterTitle: '#snr1>h1',
            content: '#snr2',
            elementRemove: '.pagenav1',
            chapterPrev: 'a:contains("上一篇")',
            chapterNext: 'a:contains("下一篇")',
        },
        { // https://www.99csw.com
            siteName: '九九藏书网',
            url: /99csw.com\/book\/\d+\/(index\.htm)?$/,
            chapterUrl: /99csw.com\/book\/\d+\/\d+.htm/,
            title: '#book_info>h2',
            writer: 'h4:contains("作者")>a',
            intro: '.intro',
            cover: '#book_info>img',
            chapter: '#dir a',
            volume: '#dir>dt:nochild',
            iframe: async (win) => {
                while (win.content.showNext() !== false) {
                    await waitInMs(200);
                }
            },
            content: '#content>div:visible',
            // content: function (doc, res, request) {
            //   const content = [];
            //   const box = $('#content', doc).get(0);
            //   const star = 0; // ? 可能根本没用
            //   var e = CryptoJS.enc.Base64.parse($('meta[name="client"]', doc).attr('content')).toString(CryptoJS.enc.Utf8).split(/[A-Z]+%/);
            //   var j = 0;
            //   function r (a) {
            //     return a;
            //   }
            //   for (var i = 0; i < e.length; i++) {
            //     if (e[i] < 3) {
            //       content[e[i]] = r(box.childNodes[i + star]);
            //       j++;
            //     } else {
            //       content[e[i] - j] = r(box.childNodes[i + star]);
            //       j = j + 2;
            //     }
            //   }
            //   return content.map(i => i.outerHTML).join('<br>');
            // }
        },
        { // https://www.kanunu8.com/book2/11107/index.html
            siteName: '努努书坊',
            filter: () => (window.location.href.match(/kanunu8.com\/book2/) ? ($('.book').length ? 1 : 2) : 0),
            title: '.book>h1',
            writer: '.book>h2>a',
            intro: '.description>p',
            chapter: '.book>dl>dd>a',
            volume: '.book>dl>dt',
            content: '#Article>.text',
            elementRemove: 'table,a',
        },
        { // https://www.kanunu8.com
            siteName: '努努书坊',
            filter: () => (window.location.host === 'www.kanunu8.com' ? ($(['body>div:nth-child(1)>table:nth-child(10)>tbody>tr:nth-child(4)>td>table:nth-child(2)>tbody>tr>td>a', 'body>div>table>tbody>tr>td>table>tbody>tr>td>table:not(:has([class^="p"])) a'].join(',')).length ? 1 : 2) : 0),
            title: 'h1>strong>font,h2>b',
            writer: 'body > div:nth-child(1) > table:nth-child(10) > tbody > tr:nth-child(2) > td,body > div:nth-child(1) > table:nth-child(10) > tbody > tr > td:nth-child(2) > table:nth-child(2) > tbody > tr:nth-child(2) > td',
            intro: '[align="left"]>[class^="p"]',
            cover: 'img[height="160"]',
            chapter: ['body>div:nth-child(1)>table:nth-child(10)>tbody>tr:nth-child(4)>td>table:nth-child(2)>tbody>tr>td>a', 'body>div>table>tbody>tr>td>table>tbody>tr>td>table:not(:has([class^="p"])) a'].join(','),
            content: 'body > div:nth-child(1) > table:nth-child(5) > tbody > tr > td:nth-child(2) > p',
        },
        { // http://www.my2852.com
            siteName: '梦远书城',
            filter: () => (window.location.href.match(/my2852?.com/) ? ($('a:contains("回目录")').length ? 2 : 1) : 0),
            titleRegExp: /(.*?)[|_]/,
            title: '.book>h1',
            writer: 'b:contains("作者")',
            intro: '.zhj,body > div:nth-child(4) > table > tbody > tr > td.td6 > div > table > tbody > tr > td:nth-child(1) > div > table > tbody > tr:nth-child(1) > td',
            cover: 'img[alt="封面"]',
            chapter: () => $('a[href]').toArray().filter((i) => $(i).attr('href').match(/^\d+\.htm/)).map((i) => ({ url: $(i).attr('href'), title: $(i).text().trim() })),
            content: 'td:has(br)',
        },
        { // https://www.tianyabooks.com
            siteName: '天涯书库',
            url: /tianyabooks\.com\/.*?\/$/,
            chapterUrl: /tianyabooks\.com\/.*?\.html$/,
            title: '.book>h1',
            writer: 'h2>a[href^="/author/"]',
            intro: '.description>p',
            chapter: '.book>dl>dd>a',
            volume: '.book>dl>dt',
            chapterTitle: 'h1',
            content: '[align="center"]+p',
        },
        { // https://www.51xs.com/
            siteName: '我要小说网',
            url: '://www.51xs.com/.*?/index.html',
            chapterUrl: '://www.51xs.com/.*?/\\d+.htm',
            title: '[style="FONT-FAMILY: 宋体; FONT-SIZE:12pt"]',
            writer: '[href="../index.html"]',
            chapter: '[style="FONT-FAMILY: 宋体; FONT-SIZE:12pt"]+center a',
            volume: '[bgcolor="#D9DDE8"]',
            chapterTitle: '.tt2>center>b',
            content: '.tt2',
        },
        // 正版
        { // https://www.qidian.com https://www.hongxiu.com https://www.readnovel.com https://www.xs8.cn
            siteName: '起点中文网',
            url: /(qidian.com|hongxiu.com|readnovel.com|xs8.cn)\/(info|book)\/\d+/,
            chapterUrl: /(qidian.com|hongxiu.com|readnovel.com|xs8.cn)\/chapter/,
            title: 'h1>em',
            writer: '.writer',
            intro: '.book-intro',
            cover: '.J-getJumpUrl>img',
            chapter: '.volume>.cf>li a',
            vipChapter: '.volume>.cf>li a[href^="//vipreader.qidian.com"]',
            volume: () => $('.volume>h3').toArray().map((i) => i.childNodes[2]),
            chapterTitle: '.j_chapterName',
            content: '.j_readContent',
            elementRemove: '.review-count,span[style]',
            chapterPrev: (doc) => [$('[id^="chapter-"]', doc).attr('data-purl')],
            chapterNext: (doc) => [$('[id^="chapter-"]', doc).attr('data-nurl')],
            vip: {
                iframe: async (win) => waitFor(() => win.enContent === undefined && win.cuChapterId === undefined && win.fEnS === undefined),
            },
        },
        { // https://www.ciweimao.com
            siteName: '刺猬猫',
            url: /:\/\/(www.)?ciweimao.com\/(book|chapter-list)\/\d+/,
            chapterUrl: /:\/\/(www.)?ciweimao.com\/chapter\/\d+/,
            infoPage: () => `https://www.ciweimao.com/book/${window.location.href.match(/\d+/)[0]}`,
            title: 'h3',
            writer: '.book-info [href*="reader/"]',
            intro: '.book-intro-cnt>div:nth-child(1)',
            cover: '.cover>img',
            chapter: '.book-chapter-list a',
            vipChapter: '.book-chapter-list a:has(.icon-lock),.book-chapter-list a:has(.icon-unlock)',
            volume: '.book-chapter-box>.sub-tit',
            chapterTitle: 'h3.chapter',
            deal: async (chapter) => {
                if (!unsafeWindow.CryptoJS) {
                    const result = await Promise.all([
                        '/resources/js/enjs.min.js',
                        '/resources/js/myEncrytExtend-min.js',
                        '/resources/js/jquery-plugins/jquery.base64.min.js',
                    ].map((i) => `https://www.ciweimao.com${i}`).map((i) => xhr.sync(i, null, { cache: true })));
                    for (const res of result) unsafeWindow.eval(res.responseText);
                }

                const chapterId = chapter.url.split('/').slice(-1)[0];
                const res1 = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        method: 'POST',
                        url: `${window.location.origin}/chapter/ajax_get_session_code`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        data: `chapter_id=${chapterId}`,
                        responseType: 'json',
                        onload(res) {
                            resolve(res);
                        },
                    }, null, 0, true);
                });
                const accessKey = res1.response.chapter_access_key;

                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        method: 'POST',
                        url: `${window.location.origin}/chapter/get_book_chapter_detail_info`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        data: `chapter_id=${chapterId}&chapter_access_key=${accessKey}`,
                        // responseType: 'json',
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const content = unsafeWindow.$.myDecrypt({
                                    content: json.chapter_content,
                                    keys: json.encryt_keys,
                                    accessKey,
                                });
                                resolve(content);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
            elementRemove: 'span',
            chapterPrev: '#J_BtnPagePrev',
            chapterNext: '#J_BtnPageNext',
            thread: 1,
            vip: {
                deal: null,
                iframe: async (win) => {
                    win.getDataUrl = async (img) => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        canvas.width = img.width;
                        canvas.height = img.height;

                        ctx.drawImage(img, 0, 0);
                        const url = canvas.toDataURL('image/jpeg', 0.5);
                        img.src = url;
                        // return new Promise((resolve, reject) => {
                        //   canvas.toBlob(function (blob) {
                        //     const url = URL.createObjectURL(blob);
                        //     img.src = url;
                        //     resolve();
                        //   });
                        // });
                    };
                    await waitFor(() => $('#J_BookImage', win.document).css('background-image').match(/^url\("?(.*?)"?\)/));
                    let src = $('#J_BookImage', win.document).css('background-image').match(/^url\("?(.*?)"?\)/)[1];
                    await new Promise((resolve, reject) => {
                        $('#realBookImage', win.document).one('load', async () => {
                            src = await win.getDataUrl($('#realBookImage', win.document).get(0));
                            window.history.back();
                            resolve();
                        }).attr('src', src);
                    });
                },
                content: '#J_BookImage',
                elementRemove: 'i',
            },
        },
        { // https://www.shubl.com/
            siteName: '书耽',
            url: '://www.shubl.com/book/book_detail/\\d+',
            chapterUrl: '://www.shubl.com/chapter/book_chapter_detail/\\d+',
            title: '.book-title>span',
            writer: '.right>.box>.user-info .username',
            intro: '.book-brief',
            cover: '.book-img',
            chapter: '#chapter_list .chapter_item>a',
            vipChapter: '#chapter_list .chapter_item:has(.lock)>a',
            chapterTitle: '.article-title',
            deal: async (chapter) => Rule.special.find((i) => i.siteName === '刺猬猫').deal(chapter),
            elementRemove: 'span',
            chapterPrev: '#J_BtnPagePrev',
            chapterNext: '#J_BtnPageNext',
            thread: 1,
        },
        { // http://chuangshi.qq.com http://yunqi.qq.com
            siteName: '创世中文网',
            url: /(chuangshi|yunqi).qq.com\/bk\/.*?-l.html/,
            chapterUrl: /(chuangshi|yunqi).qq.com\/bk\/.*?-r-\d+.html/,
            infoPage: '.title>a,.bookNav>a:nth-child(4)',
            title: '.title>a>b',
            writer: '.au_name a',
            intro: '.info',
            cover: '.bookcover>img',
            chapter: 'div.list>ul>li>a',
            vipChapter: 'div.list:has(span.f900)>ul>li>a',
            volume: '.juan_height',
            deal: async (chapter) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.origin}/index.php/Bookreader/${$('.title a:eq(0)').attr('href').match(/\/(\d+).html/)[1]}/${chapter.url.match(/-(\d+).html/)[1]}`,
                        method: 'POST',
                        data: 'lang=zhs',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                let content = json.Content;
                                const base = 30;
                                const arrStr = [];
                                const arrText = content.split('\\');
                                for (let i = 1, len = arrText.length; i < len; i++) {
                                    arrStr.push(String.fromCharCode(parseInt(arrText[i], base)));
                                }
                                let html = arrStr.join('');
                                if ($('<div>').html(html).text().match(/url\((https?:\/\/yuewen-skythunder-\d+.*?\.ttf)\)/)) {
                                    if (!fontLib) fontLib = JSON.parse(GM_getResourceText('fontLib')).reverse();
                                    const font = $('<div>').html(html).text().match(/url\((https?:\/\/yuewen-skythunder-\d+.*?\.ttf)\)/)[1];

                                    opentype.load(font, (err, font) => {
                                        if (err) resolve('');
                                        const obj = {};
                                        const undefinedFont = [];
                                        for (const i in font.glyphs.glyphs) {
                                            const data = font.glyphs.glyphs[i].path.toPathData();

                                            const key = fontLib.find((i) => i.path === data);
                                            if (key) obj[font.glyphs.glyphs[i].unicode] = key.unicode;
                                            if (!key) undefinedFont.push(data);
                                        }
                                        if (undefinedFont.length) console.error('未确定字符', undefinedFont);
                                        html = html.replace(/&#(\d+);/g, (matched, m1) => (m1 in obj ? obj[m1] : matched));
                                        content = $('.bookreadercontent', html).html();
                                        resolve(content);
                                    });
                                } else {
                                    content = $('.bookreadercontent', html).html();
                                    resolve(content);
                                }
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
        },
        { // http://dushu.qq.com 待测试:http://book.qq.com
            siteName: 'QQ阅读',
            url: /(book|dushu).qq.com\/intro.html\?bid=\d+/,
            chapterUrl: /(book|dushu).qq.com\/read.html\?bid=\d+&cid=\d+/,
            title: 'h3>a',
            writer: '.w_au>a',
            intro: '.book_intro',
            cover: '.bookBox>a>img',
            chapter: '#chapterList>div>ol>li>a',
            vipChapter: '#chapterList>div>ol>li:not(:has(span.free))>a',
            deal: async (chapter) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.origin}/read/${unsafeWindow.bid}/${chapter.url.match(/cid=(\d+)/)[1]}`,
                        method: 'POST',
                        data: 'lang=zhs',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                let content = json.Content;
                                content = $('.bookreadercontent', content).html();
                                resolve(content);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
        },
        { // https://www.webnovel.com
            siteName: '起点国际',
            url: /webnovel.com\/book\/\d+(#contents)?$/,
            chapterUrl: /webnovel.com\/book\/\d+\/\d+/,
            title: 'h2',
            writer: 'address span',
            intro: '#about .g_txt_over',
            cover: '.det-info .g_thumb',
            chapter: '.content-list a',
            volume: '.volume-item>h4',
            content: '.cha-words',
            elementRemove: 'pirate',
        },
        { // https://book.tianya.cn/
            siteName: '天涯文学',
            url: /book.tianya.cn\/html2\/dir.aspx\?bookid=\d+/,
            chapterUrl: /book.tianya.cn\/chapter-\d+-\d+/,
            infoPage: () => `https://book.tianya.cn/book/${window.location.href.split('/').slice(-1)[0].match(/\d+/)[0]}.aspx`,
            title: '.book-name>a',
            writer: '.bd>p>span',
            intro: '#brief_intro',
            cover: '.lft-pic>a>img',
            chapter: 'ul.dit-list>li>a',
            vipChapter: 'ul.dit-list>li:not(:has(.free))>a',
            deal: async (chapter) => {
                const result = await new Promise((resolve, reject) => {
                    const urlArr = chapter.url.split('-');
                    xhr.add({
                        chapter,
                        url: 'https://app3g.tianya.cn/webservice/web/read_chapter.jsp',
                        method: 'POST',
                        data: `bookid=${urlArr[1]}&chapterid=${urlArr[2]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: 'https://app3g.tianya.cn/webservice/web/proxy.html',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const title = json.data.curChapterName;
                                const content = json.data.chapterContent;
                                resolve({ title, content });
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return result;
            },
        },
        { // http://www.3gsc.com.cn
            siteName: '3G书城',
            url: /3gsc\.com\.cn\/bookreader\/\d+/,
            chapterUrl: /3gsc.com.cn\/bookcon\//,
            infoPage: '[href^="/book/"]',
            title: 'h1.RecArticle',
            writer: '.author',
            intro: '.RecReview',
            cover: '.RecBook img[onerror]',
            chapter: '.menu-area>p>a',
            vipChapter: '.menu-area>p>a:has(span.vip)',
            volume: '.menu-area>h2',
            chapterTitle: 'h1',
            content: '.menu-area',
        },
        { // http://book.zongheng.com/ http://huayu.zongheng.com/
            siteName: '纵横',
            url: /(book|huayu).zongheng.com\/showchapter\/\d+.html/,
            chapterUrl: /(book|huayu).zongheng.com\/chapter\/\d+\/\d+.html/,
            infoPage: '[class$="crumb"]>a:nth-child(3)',
            title: '.book-name',
            writer: '.au-name',
            intro: '.book-dec>p',
            cover: '.book-img>img',
            chapter: '.chapter-list a',
            vipChapter: '.chapter-list .vip>a',
            volume: () => $('.volume').toArray().map((i) => i.childNodes[6]),
            chapterTitle: '.title_txtbox',
            content: '.content',
        },
        { // https://www.17k.com/
            siteName: '17K',
            url: /www.17k.com\/list\/\d+.html/,
            chapterUrl: /www.17k.com\/chapter\/\d+\/\d+.html/,
            infoPage: '.infoPath a:nth-child(4)',
            title: '.Info>h1',
            writer: '.AuthorInfo .name',
            intro: '.intro>a',
            cover: '.cover img',
            chapter: 'dl.Volume>dd>a',
            vipChapter: 'dl.Volume>dd>a:has(.vip)',
            volume: '.Volume>dt>.tit',
            chapterTitle: 'h1',
            content: '.p',
            elementRemove: '.copy,.qrcode',
        },
        { // https://www.8kana.com/
            siteName: '不可能的世界',
            url: /www.8kana.com\/book\/\d+(.html)?/,
            chapterUrl: /www.8kana.com\/read\/\d+.html/,
            title: 'h2.left',
            writer: '.authorName',
            intro: '.bookIntroduction',
            cover: '.bookContainImgBox img',
            chapter: '#informList li.nolooking>a',
            vipChapter: '#informList li.nolooking>a:has(.chapter_con_VIP)',
            volume: '[flag="volumes"] span',
            chapterTitle: 'h2',
            content: '.myContent',
            elementRemove: '[id="-2"]',
        },
        { // https://www.heiyan.com https://www.ruochu.com
            siteName: '黑岩',
            url: /www.(heiyan|ruochu).com\/chapter\//,
            chapterUrl: /www.(heiyan|ruochu).com\/book\/\d+\/\d+/,
            infoPage: '.pic [href*="/book/"],.breadcrumb>a:nth-child(5)',
            title: 'h1[style]',
            writer: '.name>strong',
            intro: '.summary>.note',
            cover: '.book-cover',
            chapter: 'div.bd>ul>li>a',
            vipChapter: 'div.bd>ul>li>a.isvip',
            volume: '.chapter-list>.hd>h2',
            deal: async (chapter) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `http://${window.location.host.replace('www.', 'a.')}/ajax/chapter/content/${chapter.url.replace(/.*\//, '')}`,
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const { title } = json.chapter;
                                const content = json.chapter.htmlContent;
                                resolve({ title, content });
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
        },
        { // https://b.faloo.com
            siteName: '飞卢',
            url: /b.faloo.com\/\d+.html/,
            chapterUrl: /b.faloo.com\/\d+_\d+.html/,
            title: '#novelName',
            writer: '#novelName+a',
            intro: '.T-L-T-C-Box1',
            cover: '.imgcss',
            chapter: '#mulu .DivTable .DivTd>a',
            vipChapter: '#mulu .DivVip~.DivTable .DivTd>a',
            volume: '.C-Fo-Z-ML-TitleBox>h3',
            chapterTitle: '.c_l_title',
            content: '.noveContent',
            elementRemove: 'p:has(a,b,font)',
            vip: {
                content: (doc, res, request) => {
                    const doc1 = new window.DOMParser().parseFromString(res.responseText, 'text/html');
                    const func = $('script:contains("image_do3")', doc1).text();
                    /* eslint-disable camelcase */
                    if (!unsafeWindow.image_do3) {
                        unsafeWindow.image_do3 = function (num, o, id, n, en, t, k, u, time, fontsize, fontcolor, chaptertype, font_family_type) {
                            const type = 1;
                            let domain = '//read.faloo.com/';
                            if (chaptertype === 0) { domain = '//read6.faloo.com/'; }
                            if (type === 2) { domain = '//read2.faloo.com/'; }
                            if (typeof (font_family_type) === 'undefined' || font_family_type == null) {
                                font_family_type = 0;
                            }
                            let url = `${domain}Page4VipImage.aspx?num=${num}&o=${o}&id=${id}&n=${n}&ct=${chaptertype}&en=${en}&t=${t}&font_size=${fontsize}&font_color=${fontcolor}&FontFamilyType=${font_family_type}&u=${u}&time=${time}&k=${k}`;
                            url = encodeURI(url);
                            return url;
                        };
                    }
                    /* eslint-enable camelcase */
                    const image = window.eval(`window.${func}`); // eslint-disable-line no-eval
                    const elem = $('.noveContent', doc1);
                    elem.find('.con_img').replaceWith(`<img src="${image}">`);
                    return elem.html();
                },
            },
        },
        { // https://sangtacviet.com/truyen/
            siteName: 'Sáng Tác Việt (API Chapter List)',
            // Nhận diện trang tổng quan truyện
            url: '://sangtacviet.com/truyen/[^/]+/\\d+/\\d+/',
            filter: () => {
                if (window.location.pathname.match(/^\/truyen\/[^/]+\/\d+\/\d+\/$/) && $('#book_name2').length) {
                    return 1; // Chỉ cần nhận diện trang truyện
                }
                return 0;
            },

            // Thông tin sách vẫn lấy từ HTML trang truyện
            title: '#oriname', // Tên gốc tiếng Trung
            writer: 'i.cap > h2', // Tác giả
            intro: '#book-sumary > span', // Tóm tắt
            cover: '#thumb-prop', // Bìa

            // *** DÙNG getChapters ĐỂ GỌI API LẤY DANH SÁCH CHƯƠNG ***
            getChapters: async (doc) => {
                const novelMatch = window.location.pathname.match(/truyen\/([^/]+)\/\d+\/(\d+)\//);
                if (!novelMatch) {
                    console.error("STV API ChapterList Error: Không thể lấy bookid/sourceId từ URL.");
                    return [];
                }
                const sourceId = novelMatch[1];
                const bookId = novelMatch[2];

                const apiUrl = 'https://sangtacviet.com/index.php';
                const payload = `ngmar=chapterlist&h=${sourceId}&bookid=${bookId}&sajax=getchapterlist`;
                const refererUrl = window.location.href; // Dùng URL hiện tại làm referer

                console.log(`%cSTV getChapters: Gọi API lấy danh sách chương...`, "color: purple;");
                // console.log("URL:", apiUrl);
                // console.log("Payload:", payload);

                try {
                    // Gọi API bằng fetch (giống cách gọi thành công của hàm deal)
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Referer': refererUrl,
                        },
                        body: payload,
                        // Không cần credentials và X-Requested-With theo thử nghiệm thành công trước đó
                    });

                    if (!response.ok) {
                        console.error(`%cSTV getChapters Error: Fetch thất bại, Status: ${response.status}`, "color: red;");
                        return [];
                    }

                    const responseText = await response.text();
                    const jsonData = JSON.parse(responseText);

                    if (jsonData && jsonData.code === 1 && jsonData.oridata && jsonData.data) {
                        console.log(`%cSTV getChapters: Lấy danh sách chương thành công.`, "color: green;");
                        const chapters = [];
                        const oriDataChapters = jsonData.oridata.split('-//-'); // Tiêu đề gốc tiếng Trung
                        const translatedChapters = jsonData.data.split('-//-'); // Tiêu đề dịch (dùng để tham khảo nếu cần)

                        // Bỏ qua phần tử đầu tiên có thể là rỗng hoặc header
                        if (oriDataChapters[0].split('-/-').length < 3) oriDataChapters.shift();
                        if (translatedChapters[0].split('-/-').length < 3) translatedChapters.shift();

                        // Lấy danh sách các thẻ <a> trên trang chỉ để đánh số thứ tự
                        const chapterLinksOnPage = $('#chaptercontainerinner a.listchapitem', doc);
                        let linkIndex = 0;

                        for (let i = 0; i < oriDataChapters.length; i++) {
                            const oriParts = oriDataChapters[i].split('-/-'); // [type, chapterId, chapterTitleOri]
                            // const transParts = translatedChapters[i] ? translatedChapters[i].split('-/-') : null; // [type, chapterId, chapterTitleTrans]

                            if (oriParts.length >= 3) {
                                const chapterId = oriParts[1];
                                const chapterTitleOri = oriParts[2].trim();
                                // const chapterTitleTrans = (transParts && transParts.length >= 3) ? transParts[2].trim() : chapterTitleOri; // Lấy title dịch, fallback về gốc

                                // Tìm thẻ <a> tương ứng trên trang để đánh số (không đảm bảo 100% khớp nhưng là cách tốt nhất hiện tại)
                                const correspondingLink = chapterLinksOnPage.eq(linkIndex++);
                                if (correspondingLink.length > 0) {
                                    correspondingLink.attr('novel-downloader-chapter', ''); // Đánh dấu thường
                                    // Có thể thêm logic kiểm tra class 'unvip' để đánh dấu VIP nếu có
                                    // if (correspondingLink.hasClass('unvip')) { correspondingLink.attr('novel-downloader-chapter', 'vip'); }
                                    correspondingLink.attr('order', chapters.length + 1);
                                }

                                // Chỉ thêm chương nếu có ID và tiêu đề hợp lệ
                                if (chapterId && chapterTitleOri && !isNaN(parseInt(chapterId))) {
                                    chapters.push({
                                        title: chapterTitleOri, // *** LẤY TIÊU ĐỀ GỐC TIẾNG TRUNG ***
                                        url: `#stv-api-chapter-${chapterId}`, // URL giả, không còn quan trọng
                                        bookId: bookId,
                                        chapterId: chapterId, // ID chương chính xác từ API
                                        sourceType: sourceId,
                                        // vip: correspondingLink.hasClass('unvip') // Thêm trạng thái VIP nếu cần
                                    });
                                } else {
                                    console.warn("STV getChapters Warn: Bỏ qua dòng dữ liệu chương không hợp lệ:", oriDataChapters[i]);
                                }
                            }
                        }
                        console.log(`STV getChapters: Đã xử lý ${chapters.length} chương từ API.`);
                        return chapters;

                    } else {
                        console.error(`%cSTV getChapters Error: API không trả về dữ liệu hợp lệ. Code: ${jsonData?.code}`, "color: red;", jsonData);
                        return [];
                    }
                } catch (error) {
                    console.error(`%cSTV getChapters Error: Lỗi fetch hoặc parse JSON:`, "color: red;", error);
                    return [];
                }
            },
            // *** HÀM DEAL VỚI LOGIC BÙ TỪ CHI TIẾT ***
            deal: async (chapter) => {
                const bookId = chapter.bookId;
                const chapterId = chapter.chapterId;
                const sourceType = chapter.sourceType;
                if (!bookId || !chapterId || !sourceType) { /*...*/ }

                const chuyen_doi = { /* ... bảng chuyển đổi ... */
                    'lai': '来', 'tựu': '就', 'nhĩ': '你', 'nhi': '而', 'khởi': '起', 'môn': '门',
                    'đáo': '到', 'giá': '这', 'thị': '是', 'thập': '什', 'thuyết': '说', 'tự': '自',
                    'hoàn': '还', 'tha': '他/她', 'yêu': '么', 'quá': '过', 'thả': '且', 'kinh': '经',
                    'dĩ': '已', 'toán': '算', 'tưởng': '想', 'chẩm': '怎', 'ngận': '很', 'đa': '多',
                    'nhất': '一', 'hạ': '下', 'kỷ': '己'
                    // ... thêm nữa ...
                };
                const punctuation_map = { /* ... bảng dấu câu ... */
                    '，': '，', ',': '，', '.......': '……', '......': '……', '...': '…', '.': '。', '。': '。', '！': '！', '!': '！', '？': '？', '?': '？',
                    '：': '：', ':': '：', '；': '；', ';': '；', '“': '“', '”': '”', '"': '"',
                    '‘': '‘', '’': '’', "'": "'", '（': '（', '(': '（', '）': '）', ')': '）',
                    '…': '…', '—': '—', '-': '—', '《': '《', '》': '》'
                };

                const special_mappings = {
                    'dĩ tiền': '以前',
                    'tự kỷ': '自己',
                };
                const debugLog = [];
                Storage.book = Storage.book || {};
                Storage.book.debugLog = Storage.book.debugLog || [];

                const apiUrl = 'https://sangtacviet.com/index.php';
                const payload = `bookid=${bookId}&h=${sourceType}&c=${chapterId}&ngmar=readc&sajax=readchapter&sty=1&exts=`;
                const refererUrl = `https://sangtacviet.com/truyen/${sourceType}/1/${bookId}/${chapterId}/`;

                console.log(`%cSTV Deal (Chương ${chapterId}): Gọi API bằng FETCH...`, "color: purple;");

                try {
                    const response = await fetch(apiUrl, { /* ... cấu hình fetch ... */
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Referer': refererUrl,
                        },
                        body: payload,
                    });

                    // Kiểm tra xem request có thành công không (status 2xx)
                    if (!response.ok) {
                        // Nếu status không phải 2xx, báo lỗi mạng/server
                        console.error(`%cSTV Deal (Chương ${chapterId} Error): Fetch thất bại, Status: ${response.status}`, "color: red;");
                        // Thử đọc text lỗi nếu có
                        let errorText = `Lỗi HTTP ${response.status}`;
                        try { errorText = await response.text(); } catch (e) { }
                        return { content: "", error: `Lỗi mạng/server khi gọi API STV: ${response.status} - ${errorText.substring(0, 100)}` };
                    }

                    // Đã thành công (status 2xx), đọc response text
                    const responseText = await response.text();
                    try {
                        const jsonData = JSON.parse(responseText);
                        console.log(`%cSTV Deal (Chương ${chapterId}): Parse JSON thành công. Code: ${jsonData?.code}`, "color: purple;");
                        if (jsonData && jsonData.code === "0" && typeof jsonData.data !== 'undefined') {
                            const rawHtmlContent = jsonData.data;
                            const chapterTitle = chapter.title;

                            // *** BƯỚC 2: TẠO DANH SÁCH NODE (Đã sửa xử lý <p>) ***
                            const nodes = [];
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = rawHtmlContent;
                            function processChildNodes(element) {
                                element.childNodes.forEach(node => {
                                    if (node.nodeType === Node.TEXT_NODE) {
                                        let processedText = node.textContent;
                                        for (const vietPunc in punctuation_map) {
                                            processedText = processedText.replace(new RegExp(vietPunc.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), punctuation_map[vietPunc]);
                                        }
                                        nodes.push({ type: 'text', text: processedText });
                                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                                        if (node.tagName === 'I' && node.hasAttribute('t') && node.hasAttribute('h')) {
                                            nodes.push({
                                                type: 'word',
                                                h: (node.getAttribute('h') || '').toLowerCase(),
                                                t: node.getAttribute('t') || '',
                                                v: node.getAttribute('v') || '',
                                                inner: node.textContent || ''
                                            });
                                        } else if (node.tagName === 'P') {
                                            processChildNodes(node);
                                            nodes.push({ type: 'newline' });
                                        } else if (node.tagName === 'BR') {
                                            nodes.push({ type: 'newline' });
                                        } else if (node.tagName !== 'SPAN') {
                                            processChildNodes(node);
                                        }
                                    }
                                });
                            }
                            processChildNodes(tempDiv);

                            // *** BƯỚC 3 & 4: XỬ LÝ NODE WORD VÀ NỐI KẾT QUẢ ***
                            let finalChineseText = "";
                            for (const node of nodes) {
                                if (node.type === 'text') {
                                    finalChineseText += node.text;
                                } else if (node.type === 'newline') {
                                    finalChineseText += '\n';
                                } // Xử lý node 'word'
                                else if (node.type === 'word') {
                                    const t_raw = node.t;
                                    const h_raw = node.h;
                                    const v_raw = node.v || '';
                                    const t_chars = t_raw.split('').filter(c => c);
                                    const len_t = t_chars.length;
                                    const h_words = h_raw.split(' ').filter(w => w);
                                    const len_h_actual = h_words.length;
                                    const t_has_special_chars = t_raw.includes('的') || t_raw.includes('了');

                                    let current_chinese_result = '';
                                    const currentDebugLog = [];

                                    // Quy tắc 1: t > h -> Nhận t ngay
                                    if (len_t > len_h_actual) {
                                        current_chinese_result = t_raw;
                                        currentDebugLog.push(`- Nhận t ngay (t > h): h='${h_raw}', t='${t_raw}'`);
                                    }
                                    // Quy tắc 2: t = h và không có 的/了 -> Nhận t ngay
                                    else if (len_t === len_h_actual && !t_has_special_chars) {
                                        current_chinese_result = t_raw;
                                        currentDebugLog.push(`- Nhận t ngay (t = h, không có 的/了): h='${h_raw}', t='${t_raw}'`);
                                    }
                                    // Quy tắc 3: t < h hoặc t = h mà có 的/了 -> Bù từ chi tiết
                                    else {
                                        const result_chars = [];
                                        let t_index = 0;
                                        let h_index = 0;

                                        // Xử lý "了" ở cuối nếu có
                                        let trailing_le = false;
                                        if (t_raw.endsWith('了')) {
                                            trailing_le = true;
                                            t_chars.pop(); // Cắt "了" ra, xử lý sau
                                        }

                                        // Duyệt từng từ trong h
                                        while (h_index < h_words.length) {
                                            let h_word = h_words[h_index];

                                            // Kiểm tra cụm từ đặc biệt (2 từ)
                                            if (h_index + 1 < h_words.length) {
                                                const h_phrase = `${h_word} ${h_words[h_index + 1]}`;
                                                if (special_mappings[h_phrase] && t_index + special_mappings[h_phrase].length <= t_chars.length) {
                                                    // Chỉ chèn nếu t đủ ký tự để khớp
                                                    const special_chars = special_mappings[h_phrase].split('');
                                                    let match = true;
                                                    for (let i = 0; i < special_chars.length; i++) {
                                                        if (t_chars[t_index + i] !== special_chars[i]) {
                                                            match = false;
                                                            break;
                                                        }
                                                    }
                                                    if (match) {
                                                        result_chars.push(...special_chars);
                                                        h_index += 2;
                                                        t_index += special_chars.length;
                                                        continue;
                                                    }
                                                }
                                            }

                                            // Xử lý từ đơn
                                            if (special_mappings[h_word] && t_index < t_chars.length && t_chars[t_index] === special_mappings[h_word]) {
                                                // Từ đặc biệt đơn khớp với t
                                                result_chars.push(special_mappings[h_word]);
                                                h_index++;
                                                t_index++;
                                            } else if (t_index < t_chars.length) {
                                                // Ưu tiên khớp với t
                                                const chinese_char = chuyen_doi[h_word];
                                                if (chinese_char && chinese_char === t_chars[t_index]) {
                                                    result_chars.push(t_chars[t_index]);
                                                    h_index++;
                                                    t_index++;
                                                } else if (chinese_char) {
                                                    // Không khớp, dùng từ điển
                                                    if (h_word === 'tha') {
                                                        const vText = v_raw.toLowerCase();
                                                        if (vText.includes('hắn') || vText.includes('anh ấy')) result_chars.push('他');
                                                        else if (vText.includes('nàng') || vText.includes('cô ấy')) result_chars.push('她');
                                                        else result_chars.push('他');
                                                    } else {
                                                        result_chars.push(...chinese_char.split('')); // Chèn từng ký tự
                                                    }
                                                    h_index++;
                                                } else {
                                                    // Không có trong từ điển, dùng t nếu còn
                                                    result_chars.push(t_chars[t_index]);
                                                    h_index++;
                                                    t_index++;
                                                }
                                            } else if (chuyen_doi[h_word]) {
                                                // t hết, bù từ từ điển
                                                if (h_word === 'tha') {
                                                    const vText = v_raw.toLowerCase();
                                                    if (vText.includes('hắn') || vText.includes('anh ấy')) result_chars.push('他');
                                                    else if (vText.includes('nàng') || vText.includes('cô ấy')) result_chars.push('她');
                                                    else result_chars.push('他');
                                                } else {
                                                    result_chars.push(...chuyen_doi[h_word].split('')); // Chèn từng ký tự
                                                }
                                                h_index++;
                                            } else {
                                                // Thiếu từ, ghi debug
                                                currentDebugLog.push(`- Thiếu ký tự Trung cho '${h_word}': h='${h_raw}', t='${t_raw}'`);
                                                result_chars.push('?');
                                                h_index++;
                                            }
                                        }

                                        // Nối phần dư của t (trừ "了" đã cắt)
                                        if (t_index < t_chars.length) {
                                            const remaining_t = t_chars.slice(t_index);
                                            result_chars.push(...remaining_t);
                                            currentDebugLog.push(`- Nối ${remaining_t.length} ký tự dư từ 't': h='${h_raw}', t='${t_raw}'. Phần dư: '${remaining_t.join('')}'`);
                                        }

                                        // Thêm "了" vào cuối nếu có
                                        if (trailing_le) {
                                            result_chars.push('了');
                                        }

                                        if (currentDebugLog.length > 0) {
                                            debugLog.push(...currentDebugLog);
                                        }
                                        current_chinese_result = result_chars.join('');
                                    }

                                    if (h_raw === 'dĩ tiền') {
                                        console.log('dĩ tiền -> 以前')
                                        current_chinese_result = '以前';
                                    } else
                                        if (h_raw === 'tự kỷ') {
                                            console.log('tự kỷ -> 自己')
                                            current_chinese_result = '自己';
                                        }
                                    node.chinese_result = current_chinese_result;
                                    finalChineseText += current_chinese_result;
                                }
                            } // Kết thúc vòng lặp nodes

                            // *** BƯỚC 5: DỌN DẸP VÀ TRẢ VỀ ***
                            finalChineseText = finalChineseText.replace(/[ \t]+/g, '').replace(/\n+/g, '\n').replace(/\?\s*\?/g, '?').trim().replace('Vìvấnđềnộidung，nguồnnàykhônghỗtrợxemvănbảngốc。', '').replace('Bạnđangxemvănbảngốcchưadịch，cóthểkéoxuốngcuốitrangđểchọnbảndịch。', '');
                            console.log(`%cSTV Deal (Chương ${chapterId}): Tái tạo text gốc hoàn tất.`, "color: green;");
                            Storage.book.debugLog.push(...debugLog);
                            return { content: finalChineseText, title: chapterTitle };

                        } else {
                            console.error(`%cSTV Deal (Chương ${chapterId} Error): API trả về lỗi (FETCH). Code: ${jsonData?.code}`, "color: red;", jsonData);
                            return { content: "", error: `Lỗi API STV (Code: ${jsonData?.code || 'N/A'}) - ${jsonData?.err || ''}` };
                        }
                    } catch (e) {
                        // Parse JSON lỗi -> Phản hồi không phải JSON hợp lệ
                        console.error(`%cSTV Deal (Chương ${chapterId} Error): Phản hồi không phải JSON hợp lệ (FETCH).`, "color: red;");
                        console.error("Response Text:", responseText); // In ra text bị lỗi parse
                        return { content: "", error: `Lỗi STV: Phản hồi API không phải JSON cho chương ${chapterId}.` };
                    }

                } catch (error) {
                    // Lỗi mạng hoặc lỗi trong quá trình fetch
                    console.error(`%cSTV Deal (Chương ${chapterId} Error): Lỗi fetch API:`, "color: red;", error);
                    let errorMsg = `Lỗi mạng khi gọi API STV (Fetch) cho chương ${chapterId}.`;
                    if (error.message) errorMsg += ` (${error.message})`;
                    return { content: "", error: errorMsg };
                }
            },
            // Không cần content và elementRemove vì deal trả về raw HTML để xử lý sau
            // content: ...,
            // elementRemove: ...,
            // Bổ sung hàm để xử lý tải file debug
            onComplete: async (chapters) => { // Sử dụng hàm onComplete có sẵn của script gốc
                // (Code xử lý tải file epub/text/zip gốc ở đây...)

                console.log("NovelDownloader: onComplete được gọi.");
                // Kiểm tra và tải file debug nếu có log
                if (Storage.book.debugLog && Storage.book.debugLog.length > 0) {
                    console.log(`STV Debug: Có ${Storage.book.debugLog.length} lỗi cần ghi vào file.`);
                    const title = Storage.book.title || chapters[0]?.title || 'Unknown';
                    const debugContent = `Log lỗi bù từ cho truyện: ${title}\nChương: ${chapters.map(c => c.chapterId || '?').join(', ')}\n------------------------------------\n`
                    + Storage.book.debugLog.join('\n');
                    const blob = new window.Blob([debugContent], { type: 'text/plain;charset=utf-8' });
                    // Gọi hàm download gốc của script (nếu có) hoặc saveAs
                    download(blob, `${title}_debug.txt`); // Giả sử có hàm download global
                    delete Storage.book.debugLog; // Xóa log sau khi tải
                } else {
                    console.log("STV Debug: Không có lỗi bù từ nào được ghi nhận.");
                }

                Storage.book = Storage.book || {}; // Đảm bảo tồn tại
                const debugLogs = Storage.book.debugLog || []; // Lấy log hoặc mảng rỗng
                console.log(`STV Debug: Số lượng log lỗi bù từ: ${debugLogs.length}`); // Log số lượng lỗi

                // *** Tải file debug NGAY CẢ KHI RỖNG ***
                const title = Storage.book.title || chapters[0]?.title || 'Unknown';
                let debugContent = `Log lỗi bù từ cho truyện: ${title}\nChương: ${chapters.map(c => (c && c.chapterId) ? c.chapterId : '?').join(', ')}\n------------------------------------\n`;
                if (debugLogs.length > 0) {
                    debugContent += debugLogs.join('\n');
                } else {
                    debugContent += "Không có lỗi bù từ nào được ghi nhận.";
                }

                const blob = new window.Blob([debugContent], { type: 'text/plain;charset=utf-8' });
                try {
                    // Thử dùng saveAs trước, sau đó đến download
                    if (typeof saveAs === 'function') {
                        console.log("Đang tải debug.txt bằng saveAs...");
                        saveAs(blob, `${title}_debug.txt`);
                    } else if (typeof download === 'function') {
                        console.log("Đang tải debug.txt bằng download()...");
                        download(blob, `${title}_debug.txt`);
                    } else {
                        console.error("Không tìm thấy hàm saveAs hoặc download để tải file debug.");
                    }
                } catch (e) {
                    console.error("Lỗi khi gọi hàm tải file debug:", e);
                }

                // Xóa log sau khi đã xử lý
                delete Storage.book.debugLog;
            },
        },
        { // https://www.jjwxc.net - getChapters + API Deal
            siteName: '晋江文学城 (getChapters)',
            filter: () => {
                if (window.location.href.match(/www.jjwxc.net\/onebook.php\?novelid=\d+$/)) {
                    return 1;
                }
                if (window.location.href.match(/www.jjwxc.net\/onebook.php\?novelid=\d+&chapterid=\d+/)) {
                    return 2;
                }
                return 0;
            },
            title: '[itemprop="name"]',
            writer: '[itemprop="author"]',
            intro: '[itemprop="description"]',
            cover: '[itemprop="image"]',
            volume: '.volumnfont',

            // *** Dùng getChapters để tạo danh sách chương đầy đủ thông tin ***
            getChapters: async (doc) => {
                const chapters = [];
                let currentVolume = ""; // Lưu tên quyển

                // Lặp qua tất cả các dòng trong bảng mục lục
                $(doc).find('#oneboolt tbody tr').each((index, tr) => {
                    const row = $(tr);
                    const volumeElement = row.find('.volumnfont'); // Tìm tên quyển
                    const chapterLinkElement = row.find('a[itemprop="url"], a[id^="vip_"]'); // Tìm link chương (thường hoặc VIP gốc)

                    if (volumeElement.length > 0) {
                        // Nếu là dòng tên quyển, cập nhật tên quyển hiện tại
                        currentVolume = volumeElement.text().trim();
                    } else if (chapterLinkElement.length > 0) {
                        const link = chapterLinkElement.first();
                        const isVipById = link.attr('id')?.startsWith('vip_') || false;
                        let novelId, chapterId;
                        let originalHref = link.attr('href');
                        let title = (link.text() || link.parent().text()).trim().replace(/\[VIP\]$/, '');

                        if (isVipById && link.attr('rel')) {
                            try {
                                const params = new URLSearchParams(link.attr('rel').split('?')[1]);
                                novelId = params.get('novelid');
                                chapterId = params.get('chapterid');
                                // Tạo URL chuẩn onebook.php để nhất quán
                                originalHref = `https://www.jjwxc.net/onebook.php?novelid=${novelId}&chapterid=${chapterId}`;
                            } catch (e) { console.warn("JJWXC getChapters: Lỗi parse 'rel' cho VIP link:", link.attr('rel')); }
                        } else if (originalHref) {
                            try {
                                const urlObj = new URL(originalHref, window.location.origin); // Đảm bảo URL tuyệt đối
                                originalHref = urlObj.href; // Cập nhật href tuyệt đối
                                novelId = urlObj.searchParams.get('novelid');
                                chapterId = urlObj.searchParams.get('chapterid');
                            } catch (e) { console.warn("JJWXC getChapters: Lỗi parse 'href':", originalHref); }
                        }

                        // Chỉ thêm chương nếu có đủ ID
                        if (novelId && chapterId) {
                            // Đánh dấu để tô màu trên trang web (gốc)
                            link.attr('novel-downloader-chapter', isVipById ? 'vip' : '');
                            link.attr('order', chapters.length + 1); // Thêm số thứ tự

                            chapters.push({
                                title: title,
                                url: originalHref, // URL gốc onebook.php
                                volume: currentVolume,
                                // *** Thêm các thuộc tính cần thiết cho hàm deal ***
                                novelId: novelId,
                                chapterId: chapterId,
                                isVip: isVipById // Xác định VIP dựa trên ID gốc
                            });
                        } else {
                            console.warn("JJWXC getChapters: Bỏ qua link không lấy được ID:", link.parent().html());
                        }
                    }
                });

                console.log(`JJWXC getChapters: Đã xử lý ${chapters.length} chương.`);
                return chapters; // Trả về mảng các object đã có đủ thông tin
            },
            deal: async (chapter) => {
                const novelId = chapter.novelId;
                const chapterId = chapter.chapterId;
                const isVip = chapter.isVip;
                const token = unsafeWindow.tokenOptions?.Jjwxc;

                function getConent(chap_content, sayBody = "", chapterIntro = "") {
                    chap_content = chap_content.replace(/</g, "<").replace(/>/g, ">").replace(/\n　　/g, "<br>").replace(/<br><br>/g, "<br>");
                    if (sayBody && sayBody.trim().length > 0) {
                        chap_content = chap_content + "<br>---------<br>作者留言：<br>" + sayBody.replace(/\r\n/g, "<br>")
                    }
                    // Bỏ qua intro chương nếu không cần
                    // if(chapterIntro && chapterIntro.trim().length>0){
                    //     chap_content = "内容提要：<br>" + chapterIntro.replace(/\r\n/g,"<br>") + "<br>••••••••<br>" + chap_content
                    // }
                    return chap_content;
                }


                if (!novelId || !chapterId) {
                    console.error("JJWXC Deal Error: Thiếu ID trong object chapter.", chapter);
                    return { content: "", error: "Lỗi nội bộ: Thiếu ID từ getChapters." };
                }

                let requestUrl;

                if (isVip) {

                    if (!token || token.length < 30 || token === '????') {
                        console.error(`%cJJWXC Deal (VIP ${chapterId} Error): Token không hợp lệ hoặc chưa có.`, "color: red;");
                        return { content: "", error: "Lỗi VIP: Token không hợp lệ/chưa có." };
                    }
                    requestUrl = `https://app.jjwxc.net/androidapi/chapterContent?novelId=${novelId}&versionCode=349&chapterId=${chapterId}&token=${token}`;
                    console.log(`%cJJWXC Deal (VIP ${chapterId}): Gọi API...`, "color: blue;");

                    try {
                        const res = await xhr.sync(requestUrl, null, {
                            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36' },
                        });

                        let res_json;
                        let contentText = res.responseText;


                        if (!contentText.includes('"content"')) {
                            // console.log(`%cJJWXC Deal (VIP ${chapterId}): Đang decode...`, "color: blue;");
                            let accesskey = res.responseHeaders.match(/accesskey:\s*(.*)/i)?.[1]?.trim();
                            let keyString = res.responseHeaders.match(/keystring:\s*(.*)/i)?.[1]?.trim();
                            if (!accesskey || !keyString) {
                                console.error(`%cJJWXC Deal (VIP ${chapterId} Error): Thiếu key header khi decode.`, "color: red;");
                                return { content: "", error: "Lỗi giải mã VIP: Thiếu key header." };
                            }
                            try {
                                let decodedJsonString = decode(accesskey, keyString, contentText);
                                res_json = JSON.parse(decodedJsonString);
                            } catch (e) {
                                console.error(`%cJJWXC Deal (VIP ${chapterId} Error): Lỗi decode/parse:`, "color: red;", e);
                                return { content: "", error: "Lỗi giải mã dữ liệu VIP (decode/parse)." };
                            }
                        } else {
                            try { res_json = JSON.parse(contentText); } catch (e) {
                                console.error(`%cJJWXC Deal (VIP ${chapterId} Error): Lỗi parse JSON trực tiếp:`, "color: red;", e);
                                return { content: "", error: "Lỗi parse JSON VIP trực tiếp." };
                            }
                        }

                        // Kiểm tra lỗi API 'message'
                        if (res_json.message) {
                            console.warn(`%cJJWXC Deal (VIP ${chapterId} Warn): API trả về lỗi: ${res_json.message}`, "color: orange;");
                            return { content: "", error: "Lỗi API: " + res_json.message };
                        }
                        if (typeof res_json.content === 'undefined') {
                            console.error(`%cJJWXC Deal (VIP ${chapterId} Error): JSON không chứa key 'content'.`, "color: red;", res_json);
                            return { content: "", error: "Lỗi VIP: Dữ liệu trả về không có nội dung." };
                        }


                        let chap_content = res_json.content;
                        try {
                            chap_content = decryptContent(chap_content);
                            // console.log(`%cJJWXC Deal (VIP ${chapterId}): Decrypt thành công.`, "color: blue;"); // Có thể bật lại nếu cần debug decrypt
                        } catch (e) {
                            console.error(`%cJJWXC Deal (VIP ${chapterId} Error): Lỗi decryptContent:`, "color: red;", e);
                            return { content: "", error: "Lỗi giải mã nội dung VIP (decrypt)." };
                        }

                        // Định dạng và trả về
                        chap_content = getConent(chap_content, res_json.sayBody, res_json.chapterIntro);
                        console.log(`%cJJWXC Deal (VIP ${chapterId}): Xử lý thành công.`, "color: green;");
                        return { content: chap_content, title: res_json.chaptername || chapter.title };

                    } catch (error) {
                        // Xử lý lỗi mạng/fetch
                        console.error(`%cJJWXC Deal (VIP ${chapterId} Error): Lỗi fetch/xhr:`, "color: red;", error);
                        let errorMsg = "Lỗi mạng hoặc API JJWXC.";
                        if (error.status === 401 || error.status === 403) errorMsg = "Lỗi xác thực VIP (Token sai/hết hạn?).";
                        else if (error.status === 404) errorMsg = "Không tìm thấy chương VIP (URL API sai?).";
                        else if (error.message) errorMsg += ` (${error.message})`;
                        return { content: "", error: errorMsg };
                    }

                } else {

                    requestUrl = `https://app.jjwxc.net/androidapi/chapterContent?novelId=${novelId}&chapterId=${chapterId}`;
                    console.log(`JJWXC Deal (Free ${chapterId}): Gọi API...`); // Log khi bắt đầu gọi API Free

                    try {
                        const res = await xhr.sync(requestUrl, null, { headers: { 'User-Agent': '...' } });
                        const res_json = JSON.parse(res.responseText);
                        // console.log(`JJWXC Deal (Free ${chapterId}): Parsed JSON:`, res_json); // Bỏ log JSON free nếu không cần
                        if (res_json.message) {
                            console.warn(`%cJJWXC Deal (Free ${chapterId} Warn): API trả về lỗi: ${res_json.message}`, "color: orange;");
                            return { content: "", error: "Lỗi API (Free): " + res_json.message };
                        }
                        if (typeof res_json.content === 'undefined') {
                            console.error(`%cJJWXC Deal (Free ${chapterId} Error): JSON không chứa key 'content'.`, "color: red;", res_json);
                            return { content: "", error: "Lỗi Free: Dữ liệu trả về không có nội dung." };
                        }
                        let chap_content = res_json.content;
                        chap_content = getConent(chap_content, res_json.sayBody, res_json.chapterIntro);
                        console.log(`%cJJWXC Deal (Free ${chapterId}): Xử lý thành công.`, "color: green;");
                        return { content: chap_content, title: res_json.chaptername || chapter.title };
                    } catch (error) {
                        console.error(`%cJJWXC Deal (Free ${chapterId} Error): Lỗi fetch/parse:`, "color: red;", error);
                        return { content: "", error: "Lỗi khi tải/phân tích chương miễn phí." };
                    }
                }
            },
        },
        { // https://www.xxsy.net
            siteName: '潇湘书院',
            url: /www.xxsy.net\/info\/\d+.html/,
            chapterUrl: /www.xxsy.net\/chapter\/\d+.html/,
            title: '.title h1',
            writer: '.title a[href^="/authorcenter/"]',
            intro: '.introcontent',
            cover: '.bookprofile>dt>img',
            chapter: '.catalog-list>li>a',
            vipChapter: '.catalog-list>li.vip>a',
            volume: () => $('.catalog-main>dt').toArray().map((i) => i.childNodes[2]),
            chapterTitle: '.chapter-title',
            content: '.chapter-main',
        },
        { // http://www.zhulang.com http://www.xxs8.com/
            siteName: '逐浪',
            url: /book.(zhulang|xxs8).com\/\d+\/$/,
            chapterUrl: /book.(zhulang|xxs8).com\/\d+\/\d+.html/,
            infoPage: 'strong>a,.textinfo>a',
            title: '.crumbs>strong',
            writer: '.cover-tit>h2>span>a',
            intro: '#book-summary',
            cover: '.cover-box-left>img',
            chapter: '.chapter-list>ul>li>a',
            vipChapter: '.chapter-list>ul>li>a:has(span)',
            volume: '.catalog-tit>h2',
            chapterTitle: 'h2>span',
            content: '#read-content',
            elementRemove: 'h2,div,style,p:has(cite)',
        },
        { // https://www.kanshu.com
            siteName: '看书网',
            url: /www.kanshu.com\/artinfo\/\d+.html/,
            chapterUrl: /www.kanshu.com\/files\/article\/html\/\d+\/\d+.html/,
            title: '.author',
            intro: '.detailInfo',
            cover: '.bookImg',
            chapter: '.list>a',
            vipChapter: '.list>a.isvip',
            chapterTitle: '.contentBox .title',
            content: '.contentBox .tempcontentBox',
        },
        { // http://vip.book.sina.com.cn
            siteName: '微博读书-书城',
            url: /vip.book.sina.com.cn\/weibobook\/book\/\d+.html/,
            chapterUrl: /vip.book.sina.com.cn\/weibobook\/vipc.php\?bid=\d+&cid=\d+/,
            title: 'h1.book_name',
            writer: '.authorName',
            intro: '.info_txt',
            cover: '.book_img>img',
            chapter: '.chapter>span>a',
            vipChapter: '.chapter>span:has(i)>a',
            chapterTitle: '.sr-play-box-scroll-t-path>span',
            content: (doc, res, request) => window.eval(res.responseText.match(/var chapterContent = (".*")/)[1]), // eslint-disable-line no-eval
        },
        { // http://www.lcread.com
            siteName: '连城读书',
            url: /www.lcread.com\/bookpage\/\d+\/index.html/,
            chapterUrl: /www.lcread.com\/bookpage\/\d+\/\d+rc.html/,
            title: '.bri>table>tbody>tr>td>h1',
            writer: '[href^="http://my.lc1001.com/book/q?u="]',
            intro: '.bri2',
            cover: '.brc>img',
            chapter: '#abl4>table>tbody>tr>td>a',
            vipChapter: '#abl4>table>tbody>tr>td>a[href^="http://my.lc1001.com/vipchapters"]',
            volume: '#cul>.dsh',
            chapterTitle: 'h2',
            content: '#ccon',
        },
        { // https://www.motie.com
            siteName: '磨铁中文网',
            url: /www.motie.com\/book\/\d+/,
            chapterUrl: /www.motie.com\/chapter\/\d+\/\d+/,
            title: '.title>.name',
            writer: '.title>.name+a',
            intro: '.brief_text',
            cover: '.pic>span>img',
            chapter: '.catebg a',
            vipChapter: '.catebg a:has([alt="vip"])',
            volume: '.cate-tit>h2',
            deal: async (chapter) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `https://app2.motie.com/pc/chapter/${chapter.url.split('/')[5]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const title = json.data.name;
                                const { content } = json.data;
                                resolve({ title, content });
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
        },
        { // http://www.shuhai.com
            siteName: '书海小说网',
            url: 'www.shuhai.com/book/\\d+.htm',
            chapterUrl: 'www.shuhai.com/read/\\d+/\\d+.html',
            title: '.book-info-bookname>span',
            writer: '.book-info-bookname>span+span',
            intro: '.book-info-bookintro',
            cover: '.book-info .book-cover',
            chapter: '.chapter-item>a',
            vipChapter: '.chapter-item:has(.vip)>a',
            volume: 'span.chapter-item',
            chapterTitle: '.chapter-name',
            content: '.chapter-item:has(.chaper-info)',
            elementRemove: 'div',
        },
        { // http://www.xiang5.com
            siteName: '香网',
            url: 'www.xiang5.com/booklist/\\d+.html',
            chapterUrl: 'www.xiang5.com/content/\\d+/\\d+.html',
            infoPage: '.pos a:last',
            title: '.fr>h4',
            writer: '.colR>a[href*="author"]',
            intro: '.workSecHit+h2+p',
            cover: '.worksLList .fl >a>img',
            chapter: '.lb>table>tbody>tr>td>a',
            volume: '.lb>h2',
            chapterTitle: '.pos>h1',
            content: '.xsDetail',
            elementRemove: 'p[style],p>*',
        },
        { // https://www.fmx.cn/
            siteName: '凤鸣轩小说网',
            url: '://read.fmx.cn/files/article/html/[\\d/]+/index.html',
            chapterUrl: '://read.fmx.cn/files/article/html/[\\d/]+.html',
            infoPage: '.art_fnbox_sy>a,strong>a',
            title: 'h1>span',
            writer: 'h1>span:nth-child(2)',
            intro: '#zjp',
            cover: 'img[onerror]',
            chapter: '.art_fnlistbox>span>a:visible,.art_fnlistbox_vip>ul>li>span>a:visible',
            vipChapter: '.art_fnlistbox_vip>ul>li>span>a:visible',
            chapterTitle: 'h1',
            content: '#content',
            elementRemove: 'div,p:last',
        },
        { // https://www.kujiang.com
            siteName: '酷匠网',
            url: '://www.kujiang.com/book/\\d+/catalog',
            chapterUrl: '://www.kujiang.com/book/\\d+/\\d+',
            infoPage: 'h1.zero>a:nth-child(2),.chapter_crumb>a:nth-child(2)',
            title: '.book_title',
            writer: '.book_author>a',
            intro: '#book_intro',
            cover: '.kjbookcover img',
            chapter: '.third>a',
            volume: '.kjdt-catalog>span:nth-child(1)',
            chapterTitle: 'h1',
            content: '.content',
            elementRemove: 'span',
            contentReplace: [
                ['.*酷.*匠.*网.*'],
            ],
        },
        { // http://www.tadu.com
            siteName: '塔读文学',
            url: '://www.tadu.com(:\\d+)?/book/catalogue/\\d+',
            chapterUrl: '://www.tadu.com(:\\d+)?/book/\\d+/\\d+/',
            infoPage: () => `${window.location.origin}/book/${window.location.pathname.match(/\d+/)[0]}`,
            title: '.bkNm',
            writer: '.bookNm>a:nth-child(2)',
            intro: '.datum+p',
            cover: (doc) => $('.bookImg>img', doc).attr('data-src').replace(/_a\.jpg$/, '.jpg'),
            chapter: '.chapter>a',
            vipChapter: '.chapter>a:has(.vip)',
            chapterTitle: '.chapter h4',
            content: async (doc, res, request) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter: request.raw,
                        url: res.responseText.match(/id="bookPartResourceUrl" value="(.*?)"/)[1],
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: request.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const content = res.responseText.match(/\{content:'(.*)'\}/)[1];
                                resolve(content);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
        },
        { // https://yuedu.163.com
            siteName: '网易云阅读',
            url: '://yuedu.163.com/source/.*',
            chapterUrl: '://yuedu.163.com/book_reader/.*',
            title: 'h3>em',
            writer: 'h3>span>a',
            intro: '.description',
            cover: '.cover>img',
            chapter: '.item>a,.title-1>a',
            vipChapter: '.vip>a',
            volume: '.title-1',
            deal: async (chapter) => {
                const urlArr = chapter.url.split('/');
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.protocol}//yuedu.163.com/getArticleContent.do?sourceUuid=${urlArr[4]}&articleUuid=${urlArr[5]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const content = CryptoJS.enc.Base64.parse(json.content).toString(CryptoJS.enc.Utf8);
                                const title = $('h1', content).text();
                                resolve({ content, title });
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
        },
        { // https://guofeng.yuedu.163.com/ https://caiwei.yuedu.163.com/
            siteName: '网易旗下',
            url: '://(guofeng|caiwei).yuedu.163.com/newBookReader.do\\?operation=catalog&sourceUuid=.*',
            chapterUrl: '://(guofeng|caiwei).yuedu.163.com/book_reader/.*',
            infoPage: () => `${window.location.origin}/source/${window.location.href.match(/sourceUuid=(.*?)($|&)/) ? window.location.href.match(/sourceUuid=(.*?)($|&)/)[1] : window.location.href.split('/')[4]}`,
            title: 'h3>em',
            writer: 'h3>em+span>a',
            intro: '.m-bookdetail .description',
            cover: '.m-bookdetail .cover>img',
            chapter: '.item>a',
            vipChapter: '.vip>a',
            volume: '.title-1',
            deal: async (chapter) => Rule.special.find((i) => i.siteName === '网易云阅读').deal(chapter),
        },
        { // https://www.yueduyun.com/
            siteName: '阅路小说网',
            url: '://www.yueduyun.com/catalog/\\d+',
            chapterUrl: '://www.yueduyun.com/read/\\d+/\\d+',
            infoPage: () => `https://apiuser.yueduyun.com/w/block/book?book_id=${window.location.href.match(/\d+/)[0]}`,
            title: (doc) => JSON.parse($('body', doc).html()).data.book_name,
            writer: (doc) => JSON.parse($('body', doc).html()).data.author_name,
            intro: (doc) => JSON.parse($('body', doc).html()).data.book_intro,
            cover: (doc) => JSON.parse($('body', doc).html()).data.book_cover,
            chapter: '.catalog li>a',
            vipChapter: '.catalog li:has(span)>a',
            deal: async (chapter) => {
                const urlArr = chapter.url.split('/');
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `https://apiuser.yueduyun.com/app/chapter/chapter_content?book_id=${urlArr[4]}&chapter_id=${urlArr[5]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const title = json.data.chapter_name;
                                const content = json.data.chapter_content;
                                Storage.book.title = json.data.book_name;
                                Storage.book.writer = json.data.author_name;
                                resolve({ title, content });
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
        },
        { // http://www.ycsd.cn
            siteName: '原创书殿',
            url: '://www.ycsd.cn/book/chapters/.*?',
            chapterUrl: '://www.ycsd.cn/book/chapter/.*?',
            infoPage: '[class$="crumbs"] a:last',
            title: '.book-name',
            writer: '.author-name',
            intro: '.book-desc',
            cover: '.book-cover>img',
            chapter: '.directory-item>a',
            vipChapter: '.directory-item>a:has(img)',
            chapterTitle: '.chapter-wrap>h1',
            content: '.content',
        },
        { // http://www.longruo.com
            siteName: '龙若中文网',
            url: '://www.longruo.com/chapterlist/\\d+.html',
            chapterUrl: '://www.longruo.com/catalog/\\d+_\\d+.html',
            infoPage: '.fc666 a:last,.position a:last',
            title: '.book_introduction h2>a',
            writer: '.fc999+a',
            intro: '.introduction_text',
            cover: '.mr20>a>img',
            chapter: '.catalog>li>a',
            vipChapter: '.catalog>li>a:has(span.mark)',
            chapterTitle: 'h1',
            content: '.article',
        },
        { // http://www.hxtk.com
            siteName: '华夏天空',
            url: '://www.hxtk.com/chapterList/\\d+',
            chapterUrl: '://www.hxtk.com/chapter/\\d+',
            infoPage: '.breadcrumb>a[href*="/bookDetail/"]',
            title: '.book-name>h1',
            writer: '.book-writer>a',
            intro: '.book-introduction>.part',
            cover: '.book-img>img',
            chapter: '.volume-item a',
            vipChapter: '.volume-item:has(i) a',
            chapterTitle: 'h2',
            content: '#chapter-content-str',
        },
        { // https://www.hongshu.com
            siteName: '红薯中文网',
            url: '://www.hongshu.com/bookreader/\\d+/',
            chapterUrl: '://www.hongshu.com/content/\\d+/\\d+-\\d+.html',
            infoPage: () => `https://www.hongshu.com/book/${window.location.href.match(/\d+/)[0]}/`,
            title: 'h1>a',
            writer: '.txinfor>.right [href*="userspace"]',
            intro: '.intro',
            cover: '.fm>img',
            chapter: '.columns>li>a',
            vipChapter: '.columns>li:has(.vip)>a',
            deal: async (chapter) => {
                const urlArr = chapter.url.split(/\/|-|\./);
                const res1 = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.protocol}//www.hongshu.com/bookajax.do`,
                        method: 'POST',
                        data: `method=getchptkey&bid=${urlArr[6]}&cid=${urlArr[8]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                resolve(json);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.protocol}//www.hongshu.com/bookajax.do`,
                        method: 'POST',
                        data: `method=getchpcontent&bid=${urlArr[6]}&jid=${urlArr[7]}&cid=${urlArr[8]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const title = json.chptitle;
                                let { content } = json;
                                content = unsafeWindow.utf8to16(unsafeWindow.hs_decrypt(unsafeWindow.base64decode(content), res1.key));
                                // const other = unsafeWindow.utf8to16(unsafeWindow.hs_decrypt(unsafeWindow.base64decode(json.other), res1.key)); // 标点符号及常用字使用js生成的stylesheet显示
                                resolve({ title, content });
                            } catch (error) {
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
        },
        { // http://www.qwsy.com
            siteName: '蔷薇书院',
            url: '://www.qwsy.com/mulu/\\d+.html',
            chapterUrl: '://www.qwsy.com/read.aspx\\?cid=\\d+',
            infoPage: '.readtop_nav>.fl>a:nth-child(4)',
            title: '.title_h1',
            writer: '.aAuthorLink',
            intro: '#div_jj2>p',
            cover: '.zpdfmpic>img',
            chapter: '.td_con>a',
            vipChapter: '.td_con:has(span[style="color:#ff0000;"])>a',
            deal: async (chapter) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `http://script.qwsy.com/html/js/${chapter.url.replace('http://www.qwsy.com/read.aspx?cid=', '')}.js`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const content = res.responseText.match(/document.write\("(.*)"\);/)[1];
                                resolve(content);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
            elementRemove: 'font,br',
        },
        { // http://www.shulink.com
            siteName: '书连',
            url: '://vip.shulink.com(/files/article)?/html/\\d+/\\d+/index.*?.html.*',
            chapterUrl: '://vip.shulink.com(/files/article)?/html/\\d+/\\d+/\\d+.html',
            infoPage: 'a:contains("返回书页")',
            title: 'span[style*="color:red"]',
            writer: 'div[style*="float:right"] a[href^="/author"]',
            intro: '.tabvalue>div',
            cover: '.divbox img',
            chapter: '.index>dd>a',
            vipChapter: '.index>dd:has(em)>a',
            chapterTitle: '.atitle',
            content: '#acontent',
            elementRemove: 'div',
            contentReplace: [
                [/作者.*?提醒.*/, ''],
            ],
        },
        { // http://www.soudu.net http://www.wjsw.com/
            siteName: '搜读网',
            url: '://www.(soudu.net|wjsw.com)/html/\\d+/\\d+/index.shtml',
            chapterUrl: '://www.(soudu.net|wjsw.com)/html/\\d+/\\d+/\\d+.shtml',
            infoPage: '.myPlace >a:nth-child(7)',
            title: 'h1',
            writer: '.c>a+a+span',
            intro: '#aboutBook',
            cover: 'img[onerror]',
            chapter: '.list>li>a',
            vipChapter: '.list>li:has(span.r_red)>a',
            chapterTitle: 'h1',
            content: '#content',
            elementRemove: 'div',
        },
        { // http://www.fbook.net
            siteName: '天下书盟',
            url: '://www.fbook.net/list/\\d+',
            chapterUrl: '://www.fbook.net/read/\\d+',
            infoPage: '[class$="crumb"] a[href*="/book/"]',
            title: 'h1',
            intro: 'h1+div+div',
            cover: '.c_img>img',
            chapter: '.mb_content a',
            vipChapter: '.mb_content a:has(span:contains("VIP"))',
            volume: '.mb_content>li[style]',
            chapterTitle: '[itemprop="headline"]',
            content: '[itemprop="acticleBody"]',
        },
        { // https://book.tiexue.net
            siteName: '铁血读书',
            url: '://book.tiexue.net/Book\\d+/list.html',
            chapterUrl: '://book.tiexue.net/Book\\d+/Content\\d+.html',
            infoPage: '.positions>a:nth-child(5)',
            title: '.normaltitle>span',
            writer: '[href^="/FriendCenter.aspx"]>u',
            intro: '.bookPrdt >p',
            cover: '.li_01 img',
            chapter: '.list01>li>p a',
            vipChapter: '.list01>li>p>span>a',
            volume: '.dictry>h2',
            chapterTitle: '#contents>h1',
            content: '#mouseRight',
        },
        { // https://www.yokong.com
            siteName: '悠空网',
            url: '://www.yokong.com/book/\\d+/chapter.html',
            chapterUrl: '://www.yokong.com/book/\\d+/\\d+.html',
            infoPage: '.location>a:nth-child(6)',
            title: '.name>h1',
            writer: '.authorname>a',
            intro: '.book-intro',
            cover: '.bigpic>img',
            chapter: '.chapter-list>li>span>a',
            vipChapter: '.chapter-list>li>span:has(.vip-icon)>a',
            volume: '.chapter-bd>h2',
            chapterTitle: 'h1',
            content: '.article-con',
            contentReplace: [
                ['请记住本站：.*'],
                ['微信公众号：.*'],
            ],
        },
        { // https://www.chuangbie.com
            siteName: '创别书城',
            url: '://www.chuangbie.com/book/catalog/book_id/\\d+.html',
            chapterUrl: '://www.chuangbie.com/book/read\\?book_id=\\d+&chapter_id=\\d+',
            title: '.con_02',
            writer: '.con_03>span',
            chapter: '.con_05 a',
            vipChapter: '.con_05 li:has(img)>a',
            volume: '.con_05>.bt',
            deal: async (chapter) => {
                const info = chapter.url.match(/\d+/g);
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `https://www.chuangbie.com/book/load_chapter_content?book_id=${info[0]}&chapter_id=${info[1]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = unsafeWindow.strdecode(res.responseText);
                                const content = json.content.chapter_content;
                                const title = json.content.chapter_name;
                                if (!Storage.book.title) Storage.book.title = json.content.book_name;
                                if (!Storage.book.cover) Storage.book.cover = json.content.book_cover;
                                if (!Storage.book.writer) Storage.book.writer = json.content.author_name;
                                if (!Storage.book.intro) Storage.book.intro = json.content.descriotion;
                                resolve({ title, content });
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
        },
        { // https://www.msxf.cn/
            siteName: '陌上香坊',
            url: '://www.msxf.cn/book/\\d+/chapter.html',
            chapterUrl: '://www.msxf.cn/book/\\d+/\\d+.html',
            infoPage: '[href*="/book/"][href$="index.html"]',
            title: '.title>a',
            writer: '.aInfo>.name>a',
            intro: '.intro',
            cover: '.pIntroduce .pic img',
            chapter: '.chapter-list li>a',
            vipChapter: '.chapter-list li:has(.vipico)>a',
            chapterTitle: '.article-title',
            content: '#article-content-body',
            elementRemove: 'p:contains("www.msxf.cn")',
        },
        { // https://www.lajixs.com/
            siteName: '辣鸡小说',
            url: '://www.lajixs.com/book/\\d+',
            chapterUrl: '://www.lajixs.com/chapter/\\d+',
            title: '.b-title>strong',
            writer: '.b-info>p>span>a',
            intro: '.bookIntro>.text',
            cover: '.cover',
            chapter: '.b_chapter_list a',
            vipChapter: '.b_chapter_list div:has(.zdy-icon__vip)>a',
            volume: '.el-collapse-item__header',
            deal: async (chapter) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: 'https://www.lajixs.com/api/book-read',
                        method: 'POST',
                        data: `chapterId=${chapter.url.match(/\d+/)[0]}&readType=1`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const title = json.data.chapterInfo.bookTitle;
                                const content = json.data.chapterInfo.chapterContent;
                                resolve({ title, content });
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
            elementRemove: 'lg',
        },
        { // https://www.popo.tw
            siteName: 'POPO原創市集',
            url: '://www.popo.tw/books/\\d+/articles(\\?page=\\d+)?$',
            chapterUrl: '://www.popo.tw/books/\\d+/articles/\\d+',
            title: '.booksdetail .title',
            writer: '.b_author>a',
            intro: '.book_intro',
            cover: '.cover-b',
            chapter: '.list-view .c2>a',
            chapterTitle: '.read-txt>h2',
            content: '.read-txt',
            getChapters: (doc) => Rule.special.find((i) => i.siteName === 'PO18臉紅心跳').getChapters(doc),
            elementRemove: 'blockquote',
        },
        { // https://www.po18.tw/
            siteName: 'PO18臉紅心跳',
            url: '://www.po18.tw/books/\\d+/articles(\\?page=\\d+)?$',
            chapterUrl: '://www.po18.tw/books/\\d+/articles/\\d+',
            title: '.book_name',
            writer: '.book_author',
            cover: '.book_cover>img',
            chapter: '.list-view .l_chaptname>a',
            deal: async (chapter) => {
                const urlArr = chapter.url.split('/');
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.origin}/books/${urlArr[4]}/articlescontent/${urlArr[6]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                resolve(res.responseText);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
            getChapters: async (doc) => {
                const urlArr = window.location.href.split('/');
                const res = await xhr.sync(`${window.location.origin}/books/${urlArr[4]}/allarticles`, null, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        Referer: window.location.href,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    responseType: 'document',
                });
                return $('a', res.response).toArray().map((i) => ({
                    title: $(i).text(),
                    url: $(i).prop('href'),
                    vip: $(i).is(':has(img)'),
                }));
            },
            elementRemove: 'blockquote',
        },
        { // https://www.qidian.com.tw/
            siteName: '起点台湾',
            url: '://www.qidian.com.tw/books/\\d+/volumes',
            chapterUrl: '://www.qidian.com.tw/books/\\d+/articles/\\d+',
            infoPage: '.breadcrumb>a:nth-child(3)',
            title: 'h1',
            writer: 'h1+.bm',
            intro: '#dot1',
            cover: '.imgbc-b>img',
            chapter: '.chapter>a',
            vipChapter: '.chapter.pay>a',
            volume: '.chapter-list-all>ul>li.TITLE',
            chapterTitle: 'h1',
            content: '.box-text dd',
        },
        { // https://www.linovel.net/
            siteName: '轻之文库',
            url: '://www.linovel.net/book/\\d+.html',
            chapterUrl: '://www.linovel.net/book/\\d+/\\d+.html',
            title: '.book-title',
            writer: '.author-frame .name>a',
            intro: '.about-text',
            cover: '.book-cover img',
            chapter: '.chapter a',
            volume: '.volume-title>a',
            chapterTitle: '.article-title',
            content: '.article-text',
        },
        { // https://www.gongzicp.com/
            siteName: '长佩文学网',
            url: '://www.gongzicp.com/novel-\\d+.html',
            chapterUrl: '://www.gongzicp.com/read-\\d+.html',
            title: '.info-right .name',
            writer: '.author-name',
            intro: '.info-text>.content',
            cover: '.cover>img',
            chapterTitle: '.title>.name',
            popup: async () => waitFor(() => $('.cp-reader .content>p:not(.watermark)').length, 5 * 1000),
            content: '.cp-reader .content',
            elementRemove: '.cp-hidden,.watermark',
            thread: 1,
            getChapters: async (doc) => {
                const info = window.location.href.match(/\/(novel|read)-(\d+)/);
                const res = await xhr.sync(`https://webapi.gongzicp.com/novel/novelGetInfo?id=${info[2]}`);
                const json = JSON.parse(res.responseText);
                const chapters = [];
                let volume = '';
                for (let i = 0; i < json.data.chapterList.length; i++) {
                    if (json.data.chapterList[i].type === 'volume') {
                        volume = json.data.chapterList[i].name;
                    } else if (json.data.chapterList[i].type === 'item') {
                        chapters.push({
                            title: json.data.chapterList[i].name,
                            url: `https://www.gongzicp.com/read-${json.data.chapterList[i].id}.html`,
                            vip: json.data.chapterList[i].pay,
                            volume,
                        });
                    }
                }
                return chapters;
            },
        },
        { // https://sosad.fun/
            siteName: 'SosadFun|废文',
            url: '://(sosad.fun|xn--pxtr7m.com|xn--pxtr7m5ny.com)/threads/\\d+/(profile|chapter_index)',
            chapterUrl: '://(sosad.fun|xn--pxtr7m.com|xn--pxtr7m5ny.com)/posts/\\d+',
            title: '.font-1',
            writer: '.h5 a[href*="/users/"]',
            intro: '.article-body .main-text',
            chapter: '.panel-body .table th:nth-child(1)>a[href*="/posts/"]',
            chapterTitle: 'strong.h3',
            content: '.post-body>.main-text:nth-child(1)',
            elementRemove: 'div:last-child,.hidden',
        },
        { // https://www.myhtlmebook.com/ https://www.myhtebooks.com/ https://www.haitbook.com/
            siteName: '海棠文化线上文学城',
            filter: () => {
                if ($('.title>a>img[alt="海棠文化线上文学城"]').length) {
                    if (window.location.search.match('\\?act=showinfo&bookwritercode=.*?&bookid=')) {
                        return 1;
                    } if (window.location.search.match('\\?act=showpaper&paperid=')) {
                        return 2;
                    }
                }
            },
            // url: '(myhtlmebook|myhtebooks?|urhtbooks|haitbook).com/\\?act=showinfo&bookwritercode=.*?&bookid=',
            // chapterUrl: '(myhtlmebook|myhtebooks?|urhtbooks|haitbook).com/\\?act=showpaper&paperid=',
            title: '#mypages .uk-card h4',
            writer: '#writerinfos>a',
            chapter: '.uk-list>li>a[href^="/?act=showpaper&paperid="]',
            vipChapter: '.uk-list>li:not(:contains("免費"))>a[href^="/?act=showpaper&paperid="]',
            volume: '.uk-list>li:not(:has(a[href^="/?act=showpaper&paperid="])):has(b>font)',
            chapterTitle: '.uk-card-title',
            content: async (doc, res, request) => {
                const writersay = $('#colorpanelwritersay', res.responseText).html();
                let egg;
                if ($('[id^="eggsarea"]+[uk-icon="commenting"]', res.responseText).length) {
                    const paperid = $('[id^="eggsarea"]', res.responseText).attr('id').match(/^eggsarea(.*)$/)[1];
                    const bookwritercode = $('[uk-icon="list"]', res.responseText).attr('href').match(/bookwritercode=(.*?)($|&)/)[1];
                    const bookid = $('[uk-icon="list"]', res.responseText).attr('href').match(/bookid=(.*?)($|&)/)[1];
                    const msgs = ['q', '敲', '\ud83e\udd5a'];
                    await new Promise((resolve, reject) => {
                        xhr.add({
                            method: 'POST',
                            url: `${window.location.origin}/papergbookresave.php`,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                Referer: request.raw.url,
                                'X-Requested-With': 'XMLHttpRequest',
                            },
                            data: `paperid=${paperid}&bookwritercode=${bookwritercode}&bookid=${bookid}&repapergbookid=0&papergbookpage=1&repostmsgtxt=${msgs[Math.floor(Math.random() * msgs.length)]}&postmode=1&giftid=0`,
                            onload(res) {
                                resolve(res);
                            },
                        }, null, 0, true);
                    });

                    const res2 = await new Promise((resolve, reject) => {
                        xhr.add({
                            method: 'POST',
                            url: `${window.location.origin}/showpapereggs.php`,
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                Referer: request.raw.url,
                                'X-Requested-With': 'XMLHttpRequest',
                            },
                            data: `paperid=${paperid}&bookwritercode=${bookwritercode}`,
                            onload(res) {
                                resolve(res);
                            },
                        }, null, 0, true);
                    });
                    egg = res2.responseText;
                    if (egg.includes('#gopapergbook')) {
                        egg = '彩蛋加载失败';
                    }
                } else {
                    egg = $('[id^="eggsarea"]', res.responseText).html();
                }

                const content = await new Promise((resolve, reject) => {
                    const [, paperid, vercodechk] = res.responseText.match(/data: { paperid: '(\d+)', vercodechk: '(.*?)'},/);
                    xhr.add({
                        chapter: request.raw,
                        url: '/showpapercolor.php',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: request.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        data: `paperid=${paperid}&vercodechk=${vercodechk}`,
                        onload(res, request) {
                            try {
                                const content = res.responseText;
                                resolve(content);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content + (writersay ? `${writersay}<br>---<br>以下正文` : '') + (egg ? `<br>---<br>彩蛋內容：<br>${egg}` : '');
            },
            getChapters: async (doc) => {
                const id = window.location.href.match(/bookid=(.*?)($|&)/)[1];
                const chapters = [];
                let pages = 1;
                while (true) {
                    const res = await xhr.sync(`${window.location.origin}/showbooklist.php`, `ebookid=${id}&pages=${pages}&showbooklisttype=1`, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: window.location.href,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        responseType: 'document',
                    });
                    chapters.push(...$('.uk-list>li>a[href^="/?act=showpaper&paperid="]', res.response).toArray().map((i) => ({
                        title: $(i).text(),
                        url: $(i).prop('href'),
                        vip: $(i).is('.uk-list>li:not(:contains("免費"))>a[href^="/?act=showpaper&paperid="]'),
                        volume: $(i).parent().prevAll('.uk-list>li:not(:has(a[href^="/?act=showpaper&paperid="])):has(b>font)').eq(0)
                        .text(),
                    })));
                    if ($('.uk-list>li:has([onclick^="showbooklistpage"])', res.response).length && $('.uk-list>li:has([onclick^="showbooklistpage"])', res.response).eq(0).find('font:has(b)').next('a').length) {
                        pages++;
                    } else {
                        break;
                    }
                }
                return chapters;
            },
        },
        { // https://www.doufu.la/
            siteName: '豆腐',
            url: '://www.doufu.la/novel-',
            chapterUrl: '://www.doufu.la/chapter/',
            title: 'h1.book_tt>a',
            writer: '.book_author',
            intro: '.book_des',
            cover: '.book_img',
            chapter: '.catelogue a',
            vipChapter: '.catelogue .list_item:has([class*="icon-lock"])>a',
            chapterTitle: '.chapter_tt',
            content: async (doc, res, request) => {
                const chapter = request.raw;
                const token = $(res.responseText).toArray().find((i) => i.tagName === 'META' && i.name === 'csrf-token').content; // same as XSRF-TOKEN<cookie>
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `https://www.doufu.la/novel/getChapter/${chapter.url.split('/')[4]}`,
                        method: 'POST',
                        headers: {
                            Referer: chapter.url,
                            'x-csrf-token': token,
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const { content } = json;
                                resolve(content);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
            elementRemove: '.hidden',
            thread: 1,
        },
        { // https://www.youdubook.com/ https://www.xrzww.com/
            siteName: '有毒小说网/息壤中文网',
            url: '://www.(youdubook|xrzww).com/bookdetail/\\d+',
            title: '.novel_name>span',
            writer: '.novel_author>span:nth-child(1)',
            intro: '.novel_text',
            cover: '.bookcover',
            getChapters: async (doc) => {
                const urlArr = window.location.href.split('/');

                const res = await xhr.sync(`${window.location.origin.replace('www', 'pre-api')}/api/directoryList?nid=${urlArr[4]}&orderBy=0`);
                const json = JSON.parse(res.responseText);
                const chapters = json.data.data;
                const volumes = json.data.volume;
                return chapters.sort((a, b) => Math.sign(volumes.find((i) => i.volume_id === a.chapter_vid).volume_order - volumes.find((i) => i.volume_id === b.chapter_vid).volume_order)).map((i) => ({
                    url: `${window.location.origin.replace('www', 'pre-api')}/api/readNew?nid=${urlArr[4]}&vid=${i.chapter_vid}&chapter_id=${i.chapter_id}&chapter_order=${i.chapter_order}&showpic=false`,
                    title: i.chapter_name,
                    vip: i.chapter_ispay,
                    volume: volumes.find((j) => j.volume_id === i.chapter_vid).volume_name,
                }));
            },
            content: (doc, res, request) => JSON.parse(res.response).data.content,
        },
        { // https://www.ireader.com/
            siteName: '掌阅书城',
            url: '://www.ireader.com/index.php\\?ca=bookdetail.index&bid=\\d+$',
            chapterUrl: ':https://www.ireader.com/index.php\\?ca=Chapter.Index&pca=bookdetail.index&bid=\\d+&cid=\\d+',
            title: '.bookname>h2>a',
            writer: '.bookInfor .author',
            intro: '.bookinf03>p',
            cover: '.bookInfor>div>a>img',
            chapterTitle: '.content h2',
            content: '.content>.article',
            getChapters: async (doc) => {
                const bid = window.location.search.match(/&bid=(\d+)(&|$)/)[1];
                const chapters = [];
                let page = 0;
                let total = 0;
                while ((page = page + 1)) {
                    const res = await xhr.sync(`${window.location.origin}/index.php?ca=Chapter.List&ajax=1&bid=${bid}&page=${page}&pageSize=100`);
                    const json = JSON.parse(res.responseText);
                    for (const i of json.list) {
                        chapters.push({
                            title: i.chapterName,
                            url: `https://www.ireader.com/index.php?ca=Chapter.Index&pca=Chapter.Index&bid=${bid}&cid=${i.id}`,
                            vip: i.priceTag === '收费',
                        });
                    }
                    if (json.list[chapters.length - 1].priceTag === '收费') break;
                    total = total + json.list.length;
                    if (total >= json.page.total) break;
                }
                return chapters;
            },
        },
        { // https://read.douban.com/
            siteName: '豆瓣阅读',
            url: '://read.douban.com/column/\\d+/',
            chapterUrl: '://read.douban.com/reader/column/\\d+/chapter/\\d+/',
            title: '.title[itemprop="name"]',
            writer: '.name[itemprop="name"]',
            intro: '.intro',
            cover: () => $('[property="og:image"]').attr('content'),
            getChapters: async (doc) => {
                const id = window.location.href.split('/')[4];
                const chapters = [];
                while (true) {
                    const res = await xhr.sync(`https://read.douban.com/j/column_v2/${id}/chapters?start=0&limit=100&latestFirst=0`);
                    const json = JSON.parse(res.responseText);
                    for (const item of json.list) {
                        chapters.push({
                            title: item.title,
                            url: `${window.location.origin}${item.links.reader}`,
                            vip: !item.isPurchased && item.price,
                        });
                    }
                    if (chapters.length >= json.total) break;
                }
                return chapters;
            },
            fns: {
                cookieGet(e) {
                    const t = document.cookie.match(new RegExp(`(?:\\s|^)${e}\\=([^;]*)`));
                    return t ? decodeURIComponent(t[1]) : null;
                },
                decrypt: async function test(t) {
                    const { cookieGet } = Rule.special.find((i) => i.siteName === '豆瓣阅读').fns;
                    const e = Uint8Array.from(window.atob(t), (t) => t.charCodeAt(0));
                    const i = e.buffer;
                    const d = e.length - 16 - 13;
                    const p = new Uint8Array(i, d, 16);
                    const f = new Uint8Array(i, 0, d);
                    const g = {
                        name: 'AES-CBC',
                        iv: p,
                    };
                    return (function () {
                        const t = unsafeWindow.Ark.user;
                        const e = t.isAnonymous ? cookieGet('bid') : t.id;
                        const i = (new TextEncoder()).encode(e);
                        return window.crypto.subtle.digest('SHA-256', i).then((t) => window.crypto.subtle.importKey('raw', t, 'AES-CBC', !0, ['decrypt']));
                    }()).then((t) => window.crypto.subtle.decrypt(g, t, f)).then((t) => JSON.parse((new TextDecoder()).decode(t)));
                },

            },
            deal: async (chapter) => {
                const aid = chapter.url.match('read.douban.com/reader/column') ? chapter.url.split('/')[7] : chapter.url.split('/')[5];
                let content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.origin}/j/article_v2/get_reader_data`,
                        method: 'POST',
                        data: `aid=${aid}&reader_data_version=${window.localStorage.getItem('readerDataVersion')}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                resolve(json.data);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                if (content) {
                    const json = await Rule.special.find((i) => i.siteName === '豆瓣阅读').fns.decrypt(content);
                    content = {
                        content: chapter.url.match('read.douban.com/reader/column') ? json.posts[0].contents.filter((i) => i.data && i.data.text).map((i) => i.data.text).flat().map((i) => i.content)
                        .join('\n') : json.posts[0].contents.filter((i) => i.data && i.data.text).map((i) => (i.type === 'headline' ? '\n' : '') + i.data.text).join('\n'),
                        title: json.posts[0].title,
                    };
                }
                return content;
            },
        },
        { // https://read.douban.com/ebook
            siteName: '豆瓣阅读Ebook',
            url: '://read.douban.com/ebook/\\d+/',
            chapterUrl: '://read.douban.com/reader/ebook/\\d+/',
            title: '.article-title[itemprop="name"]',
            writer: '.author-item',
            intro: '[itemprop="description"]>.info',
            cover: '.cover>[itemprop="image"]',
            chapter: '.btn-read',
            deal: async (chapter) => Rule.special.find((i) => i.siteName === '豆瓣阅读').deal(chapter),
        },
        // 轻小说
        { // https://www.wenku8.net
            siteName: '轻小说文库',
            url: /wenku8.(net|com)\/novel\/.*?\/(index\.htm)?$/,
            chapterUrl: /wenku8.(net|com)\/novel\/.*?\/\d+\.htm/,
            infoPage: 'a:contains("返回书页")',
            title: 'span>b',
            writer: '#content td:contains("小说作者"):last',
            intro: 'span:contains("内容简介")+br+span',
            cover: 'img[src*="img.wenku8.com"]',
            chapter: '.css>tbody>tr>td>a',
            volume: '.vcss',
            chapterTitle: '#title',
            content: '#content',
        },
        { // https://book.sfacg.com
            siteName: 'SF轻小说',
            url: '://book.sfacg.com/Novel/\\d+/MainIndex/',
            chapterUrl: '://book.sfacg.com/Novel/\\d+/\\d+/\\d+/|://book.sfacg.com/vip/c/\\d+/',
            infoPage: '.crumbs a:nth-child(6)',
            title: 'h1.title>.text',
            writer: '.author-name',
            intro: '.introduce',
            cover: '.summary-pic>img',
            chapter: '.catalog-list>ul>li>a',
            vipChapter: '.catalog-list>ul>li>a:has(.icn_vip)',
            volume: '.catalog-title',
            chapterTitle: '.article-title',
            content: '#ChapterBody',
            vip: {
                deal: async (chapter) => `<img src="http://book.sfacg.com/ajax/ashx/common.ashx?op=getChapPic&tp=true&quick=true&cid=${chapter.url.split('/')[5]}&nid=${window.location.href.split('/')[4]}&font=16&lang=&w=728">`,
            },
        },
        { // https://www.qinxiaoshuo.com/
            siteName: '亲小说网',
            url: '://www.qinxiaoshuo.com/book/.*?',
            chapterUrl: '://www.qinxiaoshuo.com/read/\\d+/\\d+/.*?.html',
            title: 'h1',
            writer: '.info_item>div>a',
            intro: '.intro',
            cover: '.show_info>img',
            chapter: '.chapter>a',
            volume: '.volume_title>span',
            chapterTitle: '.c_title+.c_title>h3',
            content: '#chapter_content',
        },
        { // https://www.linovelib.com/
            siteName: '轻小说文库(linovelib.com)',
            url: '://www.linovelib.com/novel/\\d+/catalog',
            chapterUrl: '://www.linovelib.com/novel/\\d+/\\d+(_\\d+)?.html',
            infoPage: '.crumb>a:nth-child(3)',
            title: '.book-name',
            writer: '.au-name>a',
            intro: '.book-dec>p',
            cover: '.book-img>img',
            chapter: '.chapter-list a',
            volume: '.volume',
            chapterTitle: '#mlfy_main_text>h1',
            content: '.read-content',
        },
        { // https://www.esjzone.cc/
            siteName: 'ESJ Zone',
            url: '://(www.)?esjzone.cc/detail/\\d+.html',
            chapterUrl: '://(www.)?esjzone.cc/forum/\\d+/\\d+.html',
            title: 'h2',
            writer: '.book-detail a[href^="/tags/"]',
            intro: '.description',
            cover: '.product-gallery img',
            chapter: '#chapterList a',
            chapterTitle: 'h2',
            content: '.forum-content',
        },
        { // https://www.esjzone.cc/forum/ 论坛
            siteName: 'ESJ Zone 论坛',
            url: '://www.esjzone.cc/forum/\\d+',
            chapterUrl: '://www.esjzone.cc/forum/\\d+/\\d+.html',
            title: 'h2',
            writer: '.book-detail a[href^="/tags/"]',
            intro: '.description',
            cover: '.product-gallery img',
            chapter: '.forum-list a',
            chapterTitle: 'h2',
            content: '.forum-content',
        },
        { // http://www.shencou.com/
            siteName: '神凑小说网',
            url: '://www.shencou.com/read/\\d+/\\d+/index.html',
            chapterUrl: '://www.shencou.com/read/\\d+/\\d+/\\d+.html',
            infoPage: '[href*="books/read_"]',
            title: 'span>a',
            writer: '#content td:contains("小说作者"):nochild',
            intro: '[width="80%"]:last',
            cover: 'img[src*="www.shencou.com/files"]',
            chapter: '.zjlist4 a',
            volume: '.ttname>h2',
            chapterTitle: '>h1',
            content: 'body',
            elementRemove: 'div,script,center',
        },
        { // http://book.suixw.com
            siteName: '随想轻小说',
            url: '://book.suixw.com/modules/article/reader.php\\?aid=\\d+',
            chapterUrl: '://book.suixw.com/modules/article/reader.php\\?aid=\\d+&cid=\\d+',
            infoPage: 'a:contains("返回书页")',
            title: 'span[style]',
            writer: '#content td:contains("小说作者"):nochild',
            intro: '#content td:has(.hottext):last',
            cover: 'img[src*="book.suixw.com"]',
            chapter: '.ccss>a',
            volume: '.vcss',
            chapterTitle: '#title',
            content: '#content',
            contentReplace: [
                [/pic.wenku8.com/g, 'picture.wenku8.com'],
            ],
        },
        { // https://colorful-fantasybooks.com/
            siteName: '繽紛幻想',
            url: '://colorful-fantasybooks.com/module/novel/info.php\\?tid=\\d+&nid=\\d+',
            chapterUrl: '://colorful-fantasybooks.com/module/novel/read.php\\?tid=\\d+&nid=\\d+&cid=\\d+',
            title: '.works-intro-title>strong',
            writer: '.works-author-name',
            intro: 'works-intro-short',
            cover: '.works-cover>img',
            chapter: '.works-chapter-item>a',
            volume: '.vloume',
            chapterTitle: '#content>h2',
            content: '.content',
        },
        { // https://www.lightnovel.us/
            siteName: '轻之国度',
            url: '://www.lightnovel.us(/cn)?/search\\?kw=',
            chapterUrl: '://www.lightnovel.us(/cn)?/detail/\\d+',
            title: () => $('.search-input').val() || $('.article-title').text(),
            titleReplace: [[/^\[.*?\]([^[\]])/, '$1'], [/([^[\]])\[.*?\]$/, '$1']],
            cover: () => $('.long-item>a>div.cover').css('background-image').match(/url\("?(.*?)"?\)/)[1],
            chapter: '.long-item>.info>a',
            chapterTitle: '.article-title',
            content: (doc, res, request) => {
                const contentRaw = $('#article-main-contents', res.responseText).html();
                const content = contentRaw.replace(/^(<br>)+/, '').split(/<div.*?>.*?<\/div>|(<br>\s*){3,}/).map((i) => i && i.replace(/^(\s*|<br>)+/, '')).filter((i) => i);
                Storage.book.chapters.splice(Storage.book.chapters.indexOf(request.raw), 1, ...content.map((item, index) => ({
                    title: `${request.raw.title} - 第${String(index + 1)}部分`,
                    url: request.raw.url,
                    content: item,
                    contentRaw: item,
                    document: res.responseText,
                })));
            },
        },
        { // https://www.lightnovel.us/
            siteName: '轻之国度',
            url: '://www.lightnovel.us(/cn)?/series',
            chapterUrl: '://www.lightnovel.us(/cn)?/detail/\\d+',
            title: () => unsafeWindow.__NUXT__.data[0].series.name,
            writer: () => unsafeWindow.__NUXT__.data[0].series.author,
            intro: () => unsafeWindow.__NUXT__.data[0].series.intro,
            cover: () => unsafeWindow.__NUXT__.data[0].series.cover,
            getChapters: () => window.__NUXT__.data[0].series.articles.sort((a, b) => a.aid - b.aid).map((i) => ({ title: i.title, url: `https://www.lightnovel.us/detail/${i.aid}` })),
            chapterTitle: '.article-title',
            content: (doc, res, request) => Rule.special.find((i) => i.siteName === '轻之国度').content(doc, res, request),
        },
        { // https://ncode.syosetu.com/
            siteName: '小説家になろう',
            url: '://ncode.syosetu.com/n\\d+[a-z]{2}(/#main)?',
            chapterUrl: '://ncode.syosetu.com/n\\d+[a-z]{2}/\\d+/',
            title: '.novel_title',
            writer: '.novel_writername>a',
            intro: '#novel_ex',
            chapter: '.index_box>dl>dd>a',
            chapterTitle: '.novel_subtitle',
            content: (doc, res, request) => {
                const content = $('#novel_honbun', res.responseText).html();
                const authorSays = $('#novel_a', res.responseText).html();
                return content + '-'.repeat(20) + authorSays;
            },
        },
        { // https://www.wattpad.com/
            siteName: 'Wattpad',
            url: '://www.wattpad.com/story/\\d+-',
            chapterUrl: '://www.wattpad.com/\\d+-',
            title: '.story-info__title',
            writer: '.author-info__username>a',
            intro: '.description>pre',
            cover: '.story-cover>img',
            chapter: '.story-parts__part',
            chapterTitle: '.panel-reading>h1.h2',
            content: '.part-content .page>div>pre',
            chapterPrev: (doc, res, request) => $('.table-of-contents>li.active', res.responseText).prevAll().find('a').toArray()
            .map((i) => i.href)
            .reverse(),
            chapterNext: (doc, res, request) => $('.table-of-contents>li.active', res.responseText).nextAll().find('a').toArray()
            .map((i) => i.href),
        },
        { // http://xs.kdays.net/index
            siteName: '萌文库',
            url: '://xs.kdays.net/book/\\d+/chapter',
            chapterUrl: '://xs.kdays.net/book/\\d+/read/\\d+',
            infoPage: '[href$="/detail"]',
            title: '.info-side>h2',
            writer: '.items>li>a[href^="/search/author"]',
            intro: '.info-side>blockquote',
            cover: '.book-detail>div>div>img',
            chapter: '#vols>div>div>ul>li>a',
            volume: '#vols>div>div>h2',
            chapterTitle: '.chapterName',
            content: 'article',
        },
        { // https://www.biquge1000.com/
            siteName: '吾的轻小说',
            url: '://www.biquge1000.com/book/\\d+.html',
            chapterUrl: '://www.biquge1000.com/book/\\d+/\\d+.html',
            title: '.bookTitle',
            writer: '.booktag>a[href*="?author"]',
            intro: '#bookIntro',
            cover: '.img-thumbnail',
            chapter: '#list-chapterAll>dl>dd>a',
            volume: '#list-chapterAll>dl>dt',
            chapterTitle: '.readTitle',
            content: '#htmlContent',
        },
        { // https://novel.crazyideal.com/
            siteName: '雷姆轻小说',
            url: '://novel.crazyideal.com/book/\\d+/',
            chapterUrl: '://novel.crazyideal.com/\\d+_\\d+/\\d+(_\\d+)?.html',
            title: '.novel_info_title>h1',
            writer: '.novel_info_title>i>a[href^="/author/"]',
            intro: '.intro',
            cover: '.novel_info_main>img',
            chapter: '#ul_all_chapters>li>a',
            chapterTitle: '.style_h1',
            content: '#article',
        },
        // 盗贴
        { // https://www.xiaoshuokan.com
            siteName: '好看小说网',
            url: '://www.xiaoshuokan.com/haokan/\\d+/index.html',
            chapterUrl: '://www.xiaoshuokan.com/haokan/\\d+/[\\d_]+.html',
            infoPage: () => `https://www.xiaoshuokan.com/haokan/${window.location.href.match(/\d+/)[0]}.html`,
            title: '.booktitle>h1',
            writer: '.bookinfo>span>a',
            intro: '.block-intro',
            cover: '.bookcover img',
            chapter: '.booklist a',
            deal: async (chapter) => {
                const urlArr = chapter.url.split(/[_/.]/);
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `https://www.xiaoshuokan.com/chapreadajax.php?siteno=${urlArr[7]}&bookid=${urlArr[8]}&chapid=${urlArr[9]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            resolve(res.responseText);
                        },
                    }, null, 0, true);
                });
                return content;
            },
        },
        { // https://www.ggdtxt.com
            siteName: '格格党',
            url: '://www.ggdtxt.com/book/\\d+/',
            chapterUrl: '://www.ggdtxt.com/\\d+/read_\\d+.html',
            title: '.novelname>a',
            writer: '.pt-bookdetail-info [href^="/author/"]',
            intro: '.pt-bookdetail-intro',
            cover: '.pt-bookdetail-img',
            chapter: '.pt-chapter-cont~.pt-chapter-cont .pt-chapter-cont-detail a[href]',
            deal: async (chapter) => {
                const info = chapter.url.match(/\d+/g);
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `https://www.ggdtxt.com/api/novel/chapter/transcode.html?novelid=${info[0]}&chapterid=${info[1]}&page=1`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText);
                                const title = json.data.chapter.name;
                                const { content } = json.data.chapter;
                                resolve({ title, content });
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
        },
        { // https://www.qiqint.com/
            siteName: '平板电子书网',
            url: '://www.qiqint.com/\\d+/$',
            chapterUrl: '://www.qiqint.com/\\d+/\\d+.html',
            title: 'h1',
            writer: '.author',
            intro: '.intro',
            cover: '.cover>img',
            chapter: '.list>dl>dd>a',
            chapterTitle: 'h1',
            content: '.content',
            elementRemove: 'div',
        },
        { // https://tw.hjwzw.com
            siteName: '黄金屋中文',
            url: 'hjwzw.com/Book/Chapter/\\d+',
            chapterUrl: 'hjwzw.com/Book/Read/\\d+,\\d+',
            title: 'h1',
            writer: '[title^="作者"]',
            chapter: '#tbchapterlist>table>tbody>tr>td>a',
            chapterTitle: 'h1',
            content: '#AllySite+div',
            elementRemove: 'a,b',
            contentReplace: [
                ['(请记|請記)住本站域名.*'],
            ],
        },
        { // http://www.5858xs.com
            siteName: '58小说网',
            url: '://www.5858xs.com/html/\\d+/\\d+/index.html',
            chapterUrl: '://www.5858xs.com/html/\\d+/\\d+/\\d+.html',
            infoPage: () => `http://www.5858xs.com/${window.location.href.split('/')[5]}.html`,
            title: 'h1>b',
            writer: '.info_a li>span',
            intro: '#info_content',
            cover: '#info_content>img',
            chapter: 'td>a[href$=".html"]',
            chapterTitle: 'h1',
            content: '#content',
            elementRemove: 'fieldset,table,div',
        },
        { // https://www.bookba8.com/
            siteName: '在线书吧',
            url: '://www.bookba8.com/mulu-\\d+-list.html',
            chapterUrl: '://www.bookba8.com/read-\\d+-chapter-\\d+.html',
            infoPage: '[href*="book-"][href*="-info.html"]',
            title: '.detail-title>h2',
            writer: '[href^="/author"]',
            intro: '.juqing>dd',
            cover: '.detail-pic>img',
            chapter: '.content>.txt-list>li>a',
            chapterTitle: 'h1',
            content: '.note',
        },
        { // http://www.quanbensw.cn/
            siteName: '全本书屋(quanbensw)',
            url: '://www.quanbensw.cn/index.php\\?s=/Home/Index/articlelist/id/\\d+.html',
            chapterUrl: '://www.quanbensw.cn/index.php\\?s=/Home/Index/info/id/\\d+.html',
            title: 'h4>strong',
            writer: 'h4+p>strong',
            intro: 'h4+p+h5',
            cover: '[alt="avatar"]',
            // chapter: '[href^="/index.php?s=/Home/Index/info/id"]',
            chapterTitle: '.content-header h1',
            content: '.article-story',
        },
        { // https://www.yooread.net/
            siteName: '悠读文学网',
            url: '://www.yooread.net/\\d+/\\d+/$',
            chapterUrl: '://www.yooread.net/\\d+/\\d+/\\d+.html',
            title: '.txt>h1',
            writer: '.wr>a',
            intro: '.last>p',
            cover: '.img>img',
            chapter: '#booklist .bookchapter+table a[href^="/"]',
            chapterTitle: 'h1',
            content: '#TextContent',
            elementRemove: 'div',
        },
        { // https://www.wanbentxt.com/
            siteName: '完本神站',
            url: '://www.wanbentxt.com/\\d+/$',
            chapterUrl: '://www.wanbentxt.com/\\d+/\\d+(_\\d+)?.html',
            title: '.detailTitle>h1',
            writer: '.writer>a',
            intro: '.detailTopMid>table>tbody>tr:nth-child(3)>td:nth-child(2)',
            cover: '.detailTopLeft>img',
            chapter: '.chapter>ul>li>a',
            chapterTitle: '.readerTitle>h2',
            content: '.readerCon',
            contentReplace: [
                [/^\s*(&nbsp;)+谨记我们的网址.*。/m],
                [/^\s*(&nbsp;)+一秒记住.*/m],
                [/^<br>(&nbsp;)+【提示】：.*?。/m],
                [/^<br>(&nbsp;)+看更多好文请搜.*/m],
                [/^<br>(&nbsp;)+《[完本神站]》.*/m],
                [/^<br>(&nbsp;)+喜欢神站记得收藏.*/m],
                [/^<br>(&nbsp;)+支持.*把本站分享那些需要的小伙伴.*/m], // eslint-disable-line no-control-regex
                [/--&gt;&gt;本章未完，点击下一页继续阅读/],
            ],
        },
        { // https://www.qiushubang.com/
            siteName: '求书帮',
            url: '://www.qiushubang.com/\\d+/$',
            chapterUrl: '://www.qiushubang.com/\\d+/\\d+(_\\d+)?.html',
            title: '.bookPhr>h2',
            writer: '.bookPhr>dl>dd:contains("作者")',
            intro: '.introCon>p',
            cover: '.bookImg>img',
            chapter: '.chapterCon>ul>li>a',
            chapterTitle: '.articleTitle>h2',
            content: '.articleCon>p:nth-child(3)',
        },
        { // https://www.lhjypx.net/ // TODO
            siteName: '笔下看书阁',
            url: '://www.lhjypx.net/(novel|other/chapters/id)/\\d+.html',
            chapterUrl: '://www.lhjypx.net/book/\\d+/\\w+.html',
            infoPage: '.breadcrumb>li:nth-child(3)>a',
            title: '.info2>h1',
            writer: '.info2>h3>a',
            intro: '.info2>div>p',
            cover: '.info1>img',
            chapter: '.list-charts [href*="/book/"],.panel-chapterlist [href*="/book/"]',
            chapterTitle: '#chaptername',
            content: '#txt',
        },
        { // http://m.yuzhaige.cc/
            siteName: '御书阁',
            url: '://m.yuzhaige.cc/\\d+/\\d+/$',
            chapterUrl: '://m.yuzhaige.cc/\\d+/\\d+/\\d+(_\\d+)?.html',
            infoPage: '.currency_head>h1>a',
            title: '.cataloginfo>h3',
            writer: '.infotype>p>a[href*="/author/"]',
            intro: '.intro>p',
            chapter: '.chapters a',
            chapterTitle: '#chaptertitle',
            content: (doc, res, request) => {
                const doc1 = new window.DOMParser().parseFromString(res.responseText, 'text/html');
                const order = window.atob(doc1.getElementsByTagName('meta')[7].getAttribute('content')).split(/[A-Z]+%/);
                const codeurl = res.responseText.match(/var codeurl="(\d+)";/)[1] * 1;
                const arrRaw = $('#content', doc1).children().toArray();
                const arr = [];
                for (let i = 0; i < order.length; i++) {
                    const truth = order[i] - ((i + 1) % codeurl);
                    arr[truth] = arrRaw[i];
                }
                return arr.map((i) => i.textContent);
            },
            chapterNext: '.chapterPages>a.curr~a,.p3>a',
        },
        { // https://www.ruth-tshirt.com/
            siteName: '老猫小说',
            filter: () => ($('[src="https://www.laomaoxs.com/static/image/qrcode.png"]').length && window.location.pathname.match(/\d+\.html$/) ? 1 : 0),
            // chapterUrl: '://www.ruth-tshirt.com/ruth1/\\d+/\\w+.html',
            title: ['.h1title > .shuming > a[title]', '.chapter_nav > div:first > a:last', '#header > .readNav > span > a:last', 'div[align="center"] > .border_b > a:last', '.ydselect > .weizhi > a:last', '.bdsub > .bdsite > a:last', '#sitebar > a:last', '.con_top > a:last', '.breadCrumb > a:last'].join(','),
            chapter: ['[id*="list"] a', '[class*="list"] a', '[id*="chapter"] a', '[class*="chapter"] a'].join(','),
            chapterTitle: '.chaptername',
            content: (doc, res, request) => {
                let content = $('.txt', res.responseText).html();
                const str = '的一是了我不人在他有这个上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最女但现前些所同日手又行意动';
                content = content.replace(/[\ue800-\ue863]/g, (matched) => str[matched.charCodeAt(0) - 0xe800]);
                return content;
            },
        },
        { // https://www.19826.net/
            siteName: '19826文学',
            url: '://www.19826.net/\\d+/$',
            chapterUrl: '://www.19826.net/\\d+/\\d+(_\\d+)?.html',
            title: '.bookTitle',
            writer: '.booktag>[href*="author="]',
            intro: '#bookIntro',
            cover: '.img-thumbnail',
            chapter: '#list-chapterAll .panel-chapterlist>dd>a',
            chapterTitle: '.readTitle',
            content: '.panel-readcontent>.panel-body>div[id]',
            chapterNext: async (doc, res, request) => (res.responseText.match(/url = "(.*?)";/) ? res.responseText.match(/url = "(.*?)";/)[1] : []),
        },
        { // https://www.lewenn.com/
            siteName: '乐文小说网',
            url: '://www.lewenn.com/lw\\d+/$',
            chapterUrl: '://www.lewenn.com/lw\\d+/\\d+.html',
            title: '#info>h1',
            writer: '#info>h1+p',
            intro: '#intro',
            cover: '#fmimg>img',
            chapter: '.list dd>a',
            chapterTitle: '.head_title>h2',
            iframe: true,
            content: '#content',
            elementRemove: 'script,div',
        },
        { // http://www.daomubiji.org/
            siteName: '盗墓笔记',
            url: '://www.daomubiji.org/([a-z\\d]+)?$',
            chapterUrl: '://www.daomubiji.org/\\d+.html',
            title: '.mulu>h1',
            chapter: '.panel>ul>li>span>a',
            volume: '.panel>h2',
            chapterTitle: '.bg>h1',
            content: '.bg>.content',
        },
        { // https://www.va-etong.com/
            siteName: '全本小说网',
            url: '://www.va-etong.com/xs/\\d+/$',
            chapterUrl: '://www.va-etong.com/xs/\\d+/\\d+.html',
            title: '.book-text>h1',
            writer: '.book-text>h1+span',
            intro: '.book-text>.intro',
            cover: '.book-img>a>img',
            chapter: '.cf+h3+.cf>li>a',
            chapterTitle: '.chaptername',
            content: async (doc, res, request) => {
                const ssid = res.response.match(/var ssid=(.*?);/)[1];
                const bookid = res.response.match(/bookid=(.*?);/)[1];
                const mybookid = res.response.match(/mybookid=(.*?);/)[1];
                const xid = Math.floor(mybookid / 1000);
                const chapterid = res.response.match(/chapterid=(.*?);/)[1];
                const hou = '.html';

                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter: request.raw,
                        url: `${window.location.origin}/files/article/html${ssid}/${xid}/${bookid}/${chapterid}${hou}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: request.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const content = window.eval(res.responseText); // eslint-disable-line no-eval
                                resolve(content);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
        },
        { // https://www.shuquge.com/
            siteName: '书趣阁',
            url: '://www.shuquge.com/txt/\\d+/index.html',
            chapterUrl: '://www.shuquge.com/txt/\\d+/\\d+.html',
            title: '.info>h2',
            writer: '.info>.small>span:nth-child(1)',
            intro: '.intro',
            cover: '.cover>img',
            chapter: '.listmain>dl>dt~dt~dd>a',
            volume: '.listmain>dl>dt~dt',
            chapterTitle: '.content>h1',
            content: '#content',
            thread: 1,
            contentReplace: [['https://www.shuquge.com/.*'], ['请记住本书首发域名：www.shuquge.com。书趣阁_笔趣阁手机版阅读网址：m.shuquge.com']],
        },
        { // https://www.kuwx.net/
            siteName: '系统小说网',
            url: '://www.kuwx.net/ku/\\d+/\\d+/',
            chapterUrl: '://www.kuwx.net/ku/\\d+/\\d+/\\d+.html',
            title: '.book_inf h1',
            writer: '.book_inf .zz',
            intro: '.book_inf .jianjie+div',
            cover: '.book_cov>img',
            chapter: '#chapter>a',
            chapterTitle: '.article>h2',
            content: (doc, res, request) => $('#txt>dd', res.responseText).toArray().map((i) => [$(i).data('id'), $(i).html()]).filter((i) => i[0] !== 999)
            .sort((a, b) => a[0] - b[0])
            .map((i) => i[1])
            .join(''),
        },
        // 18X
        { // http://www.6mxs.com/ http://www.baxianxs.com/ http://www.iqqxs.com/
            siteName: '流氓小说网',
            // url: [/6mxs.com\/novel.asp\?id=\d+/, '://www.baxianxs.com/xiaoshuo.asp\\?id=\\d+'],
            // chapterUrl: [/6mxs.com\/pages.asp\?id=\d+/, '://www.baxianxs.com/page.asp\\?id=\\d+'],
            filter: () => ($('.viewxia').length ? ($('.content').length ? 2 : 1) : 0),
            title: '.lookmc>strong',
            writer: '.zl',
            intro: '.js',
            chapter: '.mread:eq(0)>tbody>tr:gt(0) a',
            chapterTitle: 'font>strong',
            content: '[class^="l"],[class^="con"]',
            contentReplace: [
                ['<img src=".*?/([a-z]+\\d?).jpg">', '{$1}'],
                ['{ai}', '爱'],
                ['{ba}', '巴'],
                ['{bang}', '棒'],
                ['{bao}', '饱'],
                ['{bi}', '逼'],
                ['{bi2}', '屄'],
                ['{bo}', '勃'],
                ['{cao}', '操'],
                ['{cao2}', '肏'],
                ['{cha}', '插'],
                ['{chan}', '缠'],
                ['{chao}', '潮'],
                ['{chi}', '耻'],
                ['{chou}', '抽'],
                ['{chuan}', '喘'],
                ['{chuang}', '床'],
                ['{chun}', '春'],
                ['{chun2}', '唇'],
                ['{cu}', '粗'],
                ['{cuo}', '搓'],
                ['{dang}', '荡'],
                ['{dang2}', '党'],
                ['{diao}', '屌'],
                ['{dong}', '洞'],
                ['{dong2}', '胴'],
                ['{fei}', '肥'],
                ['{feng}', '缝'],
                ['{fu}', '腹'],
                ['{gan}', '感'],
                ['{gang}', '肛'],
                ['{gao}', '高'],
                ['{gao2}', '睾'],
                ['{gen}', '根'],
                ['{gong}', '宫'],
                ['{gu}', '股'],
                ['{gui}', '龟'],
                ['{gun}', '棍'],
                ['{huan}', '欢'],
                ['{ji}', '激'],
                ['{ji2}', '鸡'],
                ['{ji3}', '妓'],
                ['{jian}', '贱'],
                ['{jian2}', '奸'],
                ['{jiao}', '交'],
                ['{jin}', '禁'],
                ['{jing}', '精'],
                ['{ku}', '裤'],
                ['{kua}', '胯'],
                ['{lang}', '浪'],
                ['{liao}', '撩'],
                ['{liu}', '流'],
                ['{lou}', '露'],
                ['{lu}', '撸'],
                ['{luan}', '乱'],
                ['{luo}', '裸'],
                ['{man}', '满'],
                ['{mao}', '毛'],
                ['{mi}', '密'],
                ['{mi2}', '迷'],
                ['{min}', '敏'],
                ['{nai}', '奶'],
                ['{nen}', '嫩'],
                ['{niang}', '娘'],
                ['{niao}', '尿'],
                ['{nong}', '弄'],
                ['{nue}', '虐'],
                ['{nv}', '女'],
                ['{pen}', '喷'],
                ['{pi}', '屁'],
                ['{qi}', '骑'],
                ['{qi2}', '妻'],
                ['{qiang}', '枪'],
                ['{ri}', '日'],
                ['{rou}', '肉'],
                ['{rou2}', '揉'],
                ['{ru}', '乳'],
                ['{ru2}', '蠕'],
                ['{rui}', '蕊'],
                ['{sa2i}', '塞'],
                ['{sai}', '塞'],
                ['{sao}', '骚'],
                ['{se}', '色'],
                ['{she}', '射'],
                ['{shen}', '身'],
                ['{shi}', '湿'],
                ['{shu}', '熟'],
                ['{shuang}', '爽'],
                ['{shun}', '吮'],
                ['{tian}', '舔'],
                ['{ting}', '挺'],
                ['{tun}', '吞'],
                ['{tun2}', '臀'],
                ['{tuo}', '脱'],
                ['{wei}', '慰'],
                ['{xi}', '吸'],
                ['{xie}', '泄'],
                ['{xie2}', '邪'],
                ['{xing}', '性'],
                ['{xiong}', '胸'],
                ['{xue}', '穴'],
                ['{ya}', '压'],
                ['{yan}', '艳'],
                ['{yang}', '阳'],
                ['{yang2}', '痒'],
                ['{yao}', '腰'],
                ['{ye}', '液'],
                ['{yi}', '旖'],
                ['{yi2}', '衣'],
                ['{yin}', '阴'],
                ['{yin2}', '淫'],
                ['{yin3}', '吟'],
                ['{ying}', '迎'],
                ['{you}', '诱'],
                ['{yu}', '欲'],
                ['{zhang}', '胀'],
                ['{zuo}', '坐'],
            ],
        },
        { // http://www.22lewen.com/
            siteName: '乐文小说网',
            url: '://www.\\d+lewen.com/read/\\d+(/0)?.html',
            chapterUrl: '://www.\\d+lewen.com/read/\\d+/\\d+(_\\d+)?.html',
            title: '.book-title>h1',
            chapter: '.chapterlist>dd>a',
            chapterTitle: '#BookCon>h1',
            content: '#BookText',
        },
        { // http://www.shubao202.com/index.php http://lawen24.com/
            siteName: '书包网',
            url: ['://www.shubao202.com/book/\\d+', '://lawen24.com/txtbook/\\d+.html'],
            chapterUrl: ['://www.shubao202.com/read/\\d+/\\d+', '://lawen24.com/read/\\d+/\\d+'],
            title: 'h1',
            chapter: '.mulu a',
            chapterTitle: 'h1',
            content: '.mcc',
        },
        { // https://www.cool18.com/bbs4/index.php
            siteName: '禁忌书屋',
            filter: () => (['www.cool18.com'].includes(window.location.host) ? ($('#myform').length ? 2 : 1) : 0),
            chapterUrl: '://www.cool18.com/bbs4/index.php\\?app=forum&act=threadview&tid=\\d+',
            title: 'font>b',
            chapter: 'a:not(:contains("(无内容)"))',
            chapterTitle: 'font>b',
            content: '.show_content>pre',
            chapterPrev: '.show_content>p>a',
            chapterNext: 'body>table td>p:first+ul a:not(:contains("(无内容)")),.show_content>pre a',
            elementRemove: 'font[color*="E6E6DD"],b:contains("评分完成")',
        },
        { // http://www.7zxs.cc/
            siteName: '7z小说网',
            url: '://www.7zxs.cc/ik258/\\d+/\\d+/index.html',
            chapterUrl: '://www.7zxs.cc/ik258/\\d+/\\d+/\\d+.html',
            title: '.title>h2',
            writer: '.title>h2+span',
            chapter: '.ocon>dl>dd>a',
            chapterTitle: '.nr_title>h3',
            content: '#htmlContent',
            contentReplace: [
                ['登陆7z小说网.*'],
            ],
        },
        { // http://www.qdxiaoshuo.net/
            siteName: '青豆小说网',
            url: '://www.qdxiaoshuo.net/book/\\d+.html',
            chapterUrl: '://www.qdxiaoshuo.net/read/\\d+/\\d+.html',
            title: '.kui-left.kui-fs32',
            chapter: '.kui-item>a',
            chapterTitle: 'h1.kui-ac',
            content: '#kui-page-read-txt',
        },
        { // https://www.shushuwu8.com/
            siteName: '书书屋',
            url: '://www.shushuwu8.com/novel/\\d+/$',
            chapterUrl: '://www.shushuwu8.com/novel/\\d+/\\d+.html',
            title: '.ml_title>h1',
            writer: '.ml_title>h1+span',
            chapter: '.ml_main>dl>dd>a',
            chapterTitle: 'h2',
            content: '.yd_text2',
        },
        { // http://www.cuiweijux.com/
            siteName: '翠微居小说网',
            url: '://www.cuiweijux.com/files/article/html/\\d+/\\d+/index.html',
            chapterUrl: '://www.cuiweijux.com/files/article/html/\\d+/\\d+/\\d+.html',
            title: 'td[valign="top"]>div>span:eq(0)',
            writer: 'td[valign="top"]>div>span:eq(1)',
            intro: '.tabvalue>div:nth-child(3)',
            cover: 'img[onerror]',
            chapter: '.chapters:eq(1)>.chapter>a',
            chapterTitle: '.title',
            content: '#content',
        },
        { // http://www.4shubao.com/
            siteName: '4书包',
            url: '://www.4shubao.com/read/\\d+.html',
            chapterUrl: '://www.4shubao.com/read/\\d+/\\d+.html',
            title: 'h1',
            chapter: '.chapterlist a',
            chapterTitle: 'h1',
            content: '#BookText',
        },
        { // http://www.xitxt.net
            siteName: '喜书网',
            url: '://www.xitxt.net/book/\\d+.html',
            chapterUrl: '://www.xitxt.net/read/\\d+_\\d+.html',
            title: 'h1',
            chapter: '.list a',
            chapterTitle: 'h1',
            content: '.chapter',
            elementRemove: 'font',
        },
        { // http://www.shenshuw.com
            siteName: '神书网',
            url: '://www.shenshu.info/s\\d+/',
            chapterUrl: '://www.shenshu.info/s\\d+/\\d+.html',
            title: 'h1',
            chapter: '#chapterlist a',
            chapterTitle: 'h1',
            content: '#book_text',
        },
        { // https://www.quanshuwan.com/
            siteName: '全本书屋',
            url: '://www.quanshuwan.com/book/\\d+.aspx',
            chapterUrl: '://www.quanshuwan.com/article/\\d+.aspx',
            title: 'h1',
            writer: 'h1~p',
            intro: '#bookintroinner',
            cover: '.fm>img',
            chapter: '#readlist a',
            chapterTitle: 'h1',
            content: '#content',
            elementRemove: 'div',
        },
        { // https://www.dzwx520.com/
            siteName: '大众小说网',
            url: '://www.dzwx520.com/book_\\d+/$',
            chapterUrl: '://www.dzwx520.com/book_\\d+/\\d+.html',
            title: 'h1',
            chapter: '.book_list a',
            chapterTitle: 'h1',
            content: '#htmlContent',
            elementRemove: 'script,div',
        },
        { // http://www.mlxiaoshuo.com
            siteName: '魔龙小说网',
            url: '://www.mlxiaoshuo.com/book/.*?.html',
            chapterUrl: '://www.mlxiaoshuo.com/chapter/.*?.html',
            title: '.colorStyleTitle',
            chapter: '.zhangjieUl a',
            chapterTitle: '.colorStyleTitle',
            content: '.textP',
        },
        { // https://www.123xiaoqiang.in/
            siteName: '小强小说网',
            url: '://www.123xiaoqiang.in/\\d+/\\d+/',
            chapterUrl: '://www.123xiaoqiang.in/\\d+/\\d+/\\d+.html',
            title: 'h1',
            chapter: '.liebiao a',
            chapterTitle: 'h2',
            content: '#content',
        },
        { // http://www.haxxs8.com/
            siteName: '海岸线文学网',
            url: '://www.haxxs8.com/files/article/html/\\d+/\\d+/index.html',
            chapterUrl: '://www.haxxs8.com/files/article/html/\\d+/\\d+/\\d+.html',
            infoPage: 'a:contains("返回书页")',
            title: '.book-title>h1',
            writer: '.book-title>h1+em',
            intro: '.book-intro',
            cover: '.book-img>img',
            chapter: '.ccss a',
            chapterTitle: '#content h2',
            content: 'td[id^="content"]',
            elementRemove: 'div,span,font',
        },
        { // http://www.huaisu8.com
            siteName: '怀素吧小说',
            url: '://www.huaisu8.com/\\d+/\\d+/($|#)',
            chapterUrl: '://www.huaisu8.com/\\d+/\\d+/\\d+.html',
            title: '.info>h2',
            chapter: '.index-body .newzjlist:nth-child(4) .dirlist a',
            chapterTitle: '.play-title>h1',
            content: '.txt_tcontent',
        },
        { // https://xxread.net/
            siteName: '肉肉阅读', // 与网易云阅读相同模板
            url: '://xxread.net/book(-\\d+)?.php',
            chapterUrl: '://xxread.net/book_reader.php\\?b=\\d+&c=\\d+',
            title: '.m-bookdetail h3',
            intro: '.m-content .detail>.txt',
            chapter: '.item>a',
            deal: async (chapter) => {
                const info = chapter.url.match(/\d+/g);
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.protocol}//xxread.net/getArticleContent.php?sourceUuid=${info[0]}&articleUuid=${info[1]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const json = JSON.parse(res.responseText.match(/(\{.*\})/)[1]);
                                const content = CryptoJS.enc.Base64.parse(json.content).toString(CryptoJS.enc.Utf8);
                                const title = $('h1', content).text();
                                resolve({ content, title });
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                        checkLoad: () => true,
                    }, null, 0, true);
                });
                return content;
            },
            elementRemove: 'h1',
            getChapters: async (doc) => {
                const info = window.location.href.match(/\d+/g);
                const res = await xhr.sync(`https://xxread.net/getBook.php?b=${info[0]}`);
                const json = JSON.parse(res.responseText);
                const chapters = [];
                for (let i = 1; i < json.portions.length; i++) {
                    chapters.push({
                        title: json.portions[i].title,
                        url: `https://xxread.net/book_reader.php?b=${info[0]}&c=${json.portions[i].id}`,
                    });
                }
                return chapters;
            },
        },
        { // https://18h.mm-cg.com/novel/index.htm
            siteName: '18H',
            filter: () => ($('meta[content*="18AV"],meta[content*="18av"]').length ? (window.location.href.match(/novel_\d+.html/) ? 2 : 1) : 0),
            title: '.label>div',
            chapter: '.novel_leftright>span>a:visible',
            chapterTitle: 'h1',
            content: '#novel_content_txtsize',
        },
        { // https://hao.je51.com/ https://je51.com/
            siteName: 'je51',
            url: '://(hao.)?je51.com/st_l.en/st_did.l--.*?.html',
            chapterUrl: '://(hao.)?je51.com/st_l.en/st_did.d--.*?--\\d+.html',
            title: '.story-list-title',
            writer: '#module8>.story-cat-list .author>a',
            intro: '#module8>.story-cat-list .text',
            chapter: '.story-list .container>.autocol>a',
            chapterTitle: '#module8>.navlinks>.navtitle:last',
            content: '#story-text',
        },
        { // https://aastory.space/
            siteName: '疯情书库',
            filter: () => (document.title.match('疯情书库') && ['/archive.php', '/read.php'].includes(window.location.pathname) ? (['/archive.php'].includes(window.location.pathname) ? 1 : 2) : 0),
            // url: '://aastory.space/archive.php\\?id=\\d+',
            // chapterUrl: '://aastory.space/read.php\\?id=\\d+',
            title: '.index_title',
            writer: '.index_info>span',
            chapter: '.section_list>li>a',
            volume: '.section_title',
            chapterTitle: '.chapter_title',
            content: async (doc, res, request) => {
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter: request.raw,
                        url: `${window.location.origin}/_getcontent.php?id=${request.url.match(/id=(\d+)/)[1]}&v=${res.responseText.match(/chapid\+"&v=(.*?)"/)[1]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: request.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const content = res.responseText;
                                resolve(content);
                            } catch (error) {
                                console.error(error);
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
        },
        { // https://aaread.club/ 仿起点样式
            siteName: '疯情阅读',
            url: '://aaread.club/book/\\d+',
            chapterUrl: '://aaread.club/chapter/\\d+/\\d+',
            title: 'h1>em',
            writer: '.writer',
            intro: '.intro',
            cover: '.J-getJumpUrl>img',
            chapter: '.volume>.cf>li>a',
            chapterTitle: '.j_chapterName',
            deal: async (chapter) => {
                const urlArr = chapter.url.split('/');
                const content = await new Promise((resolve, reject) => {
                    xhr.add({
                        chapter,
                        url: `${window.location.origin}/_getcontent.php?id=${urlArr[5]}`,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            Referer: chapter.url,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        onload(res, request) {
                            try {
                                const content = res.responseText;
                                resolve(content);
                            } catch (error) {
                                resolve('');
                            }
                        },
                    }, null, 0, true);
                });
                return content;
            },
            chapterPrev: (doc) => [$('[id^="chapter-"]', doc).attr('data-purl')],
            chapterNext: (doc) => [$('[id^="chapter-"]', doc).attr('data-nurl')],
        },
    ];
    Rule.template = [ // 模板网站
        { // http://www.xbiquge.la/54/54439/
            siteName: '模板网站-笔趣阁',
            filter: () => (['.ywtop', '.nav', '.header_logo', '#wrapper', '.header_search'].every((i) => $(i).length) ? ($('#content').length ? 2 : 1) : 0),
            title: '#info>h1',
            writer: '#info>h1+p',
            intro: '#intro',
            cover: '#fmimg>img',
            chapter: '#list>dl>dd>a',
            chapterTitle: 'h1',
            content: '#content',
            elementRemove: 'a,p:empty,script',
        },
        { // https://www.biqukan.com/57_57242/
            siteName: '模板网站-笔趣阁1',
            filter: () => (['body>.ywtop', 'body>.header', 'body>.nav', 'body>.book', 'body>.listmain,body>.book.reader'].every((i) => $(i).length) ? ($('#content').length ? 2 : 1) : 0),
            title: '.info>h2',
            writer: '.info>h2+div>span:nth-child(1)',
            intro: '.intro',
            cover: '.cover>img',
            chapter: '.listmain>dl>dd+dt~dd>a',
            chapterTitle: 'h1',
            content: '#content',
            elementRemove: 'a,p:empty,script',
        },
        { // https://www.x23qb.com/book/775/
            siteName: '模板网站-铅笔小说',
            filter: () => (['#header .wrap980', '.search span.searchBox', '.tabstit', '.coverecom'].every((i) => $(i).length) ? 1 : 0),
            title: '.d_title>h1',
            writer: '.p_author>a',
            intro: '#bookintro>p',
            cover: '#bookimg>img',
            chapter: '#chapterList>li>a',
            chapterTitle: 'h1',
            content: '.read-content',
            elementRemove: 'dt,div',
        },
    ];

    if (Config.customize) {
        try {
            console.log(JSON.parse(Config.customize));
            const ruleUser = window.eval(Config.customize); // eslint-disable-line no-eval
            Rule.special = Rule.special.concat(ruleUser);
        } catch (error) {
            console.error(error);
        }
    }

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

    async function showUI() {
        if ($('.novel-downloader-v3').length) {
            $('.novel-downloader-v3').toggle();
            if ($('.novel-downloader-style-chapter[media]').length) { // https://stackoverflow.com/a/54441305
                $('.novel-downloader-style-chapter[media]').attr('media', null);
            } else {
                $('.novel-downloader-style-chapter').attr('media', 'max-width: 1px');
            }
            return;
        }

        let chapters,
            chaptersArr;
        let vipChapters = [];
        const chaptersDownloaded = [];

        const issueBody = [
            `- 脚本: \`novelDownloader3 v${GM_info.script.version}\``,
            '- 类型: `Bug/建议`',
            `- 浏览器: \`${GM_info.platform ? GM_info.platform.browserName : '浏览器'} v${GM_info.platform ? GM_info.platform.browserVersion : '版本'}\``,
            `- 扩展: \`${GM_info.scriptHandler} v${GM_info.version}\``,
            '---',
            '<!-- 你的问题 -->',
        ];

        // ui
        const html = [
            '<div name="info">',
            `  Quy tắc hiện tại: <span name="rule"></span><span name="mode"></span><sup><a href="https://github.com/dodying/UserJs/issues/new?body=${encodeURIComponent(issueBody.join('\u000a'))}" target="_blank">Phản hồi</a></sup><sup><a href="https://github.com/dodying/UserJs#捐赠" target="_blank">Donate</a></sup>`,
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
            '  Nhiều cài đặt hơn: <button name="toggle">Hiển thị</button>',
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
            '  Quy tắc tùy chỉnh: <textarea name="customize" placeholder="" style="line-height:1;resize:both;"></textarea>',
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

            '<div name="buttons">',
            '  <input type="button" name="download" format="debug" value="Kiểm tra">',
            '  <input type="button" name="download" format="text" value="Tải xuống dưới dạng TEXT">',
            '  <br>',
            '  <input type="button" name="download" format="epub" value="Tải xuống dưới dạng EPUB">',
            '  <input type="button" name="download" format="zip" value="Tải xuống dưới dạng ZIP">',
            '  <br>',
            '  <input type="button" name="toggle-opacity" value="Trong suốt">',
            '  <input type="button" name="exit" value="Thoát">',
            '  <input type="button" name="force-download" value="Buộc tải xuống" raw-disabled="disabled">',
            '  <input type="button" name="force-save" value="Buộc lưu" raw-disabled="disabled">',
            '</div>',

            '<div name="progress">',
            '  <span title="Tiến trình hoàn thành chương\nKhi góc phải bên dưới biểu hiện【Tải xuống đã hoàn tất】, nếu thanh tiến trình chưa chạy xong, bạn có thể thử nhấp lại và tập lệnh sẽ thử lại chương bị lỗi trước đó\n（Chỉ hợp lệ đối với các lỗi do sự cố mạng, nếu tập lệnh có vấn đề, vui lòng đưa ra phản hồi hoặc tự mình giải quyết）">Tiến độ</span>: ',
            '  <progress max="0" value="0"></progress>',
            '</div>',
        ].join('');
        const container = $('<div class="novel-downloader-v3"></div>').html(html).appendTo('body');
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
        container.find('[name="buttons"]').find('[name="download"]').on('click', async (e) => {
            container.find('[name="progress"]').show();
            container.find('[name="buttons"]').find('[name="download"]').attr('disabled', 'disabled');
            container.find('[name="buttons"]').find('[name="force-download"]').attr('disabled', null);
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
                const arr = container.find('[name="limit"]>[name="range"]').val().split(',').sort();
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].match(/^(\d+)?-(\d+)?$/)) {
                        let start = arr[i].match(/^(\d+)?-(\d+)?$/)[1];
                        if (!start) start = 1;
                        let end = arr[i].match(/^(\d+)?-(\d+)?$/)[2];
                        if (!end) end = Storage.book.chapters.length;
                        for (let j = start - 1; j <= end - 1; j++) {
                            if (j in Storage.book.chapters) Storage.book.chapters[j].filtered = true;
                        }
                    } else if (/^\d+$/.test(arr[i])) {
                        if ((arr[i] - 1) in Storage.book.chapters) Storage.book.chapters[arr[i] - 1].filtered = true;
                    }
                }
                Storage.book.chapters = Storage.book.chapters.filter((i) => {
                    if (i.filtered) {
                        delete i.filtered;
                        return true;
                    }
                });
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
            const onComplete = async (force) => {
                if (!force) {
                    container.find('[name="buttons"]').find('[name="force-save"]').attr('disabled', 'disabled').off('click');
                    container.find('[name="buttons"]').find('[name="force-download"]').attr('disabled', 'disabled');
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
                    let content = chapter.contentRaw;
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
                chapter.contentRaw = '';
                chapter.content = '';
                chapter.document = '';
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

                    const rule = vipChapters.includes(url) ? Storage.rule.vip : Storage.rule;

                    if (chapterNew.contentRaw && chapterNew.document) {
                        await onChapterLoad({ response: chapterNew.document, responseText: chapterNew.document }, { raw: chapterNew });
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
            let completedCount = 0;
            Storage.book.chapters.forEach(ch => {
                if ('contentRaw' in ch) {
                    completedCount++;
                }
            });
            container.find('[name="progress"]>progress').val(completedCount).attr('max', totalChapters);
            document.title = `[${completedCount}/${totalChapters}]${Storage.title}`;

            function updateProgress(isSuccess = true) {
                // Chỉ tăng completedCount nếu chương đó *chưa* được đếm trước đó
                // Cách đơn giản là gọi update lại giá trị progress bar dựa trên số chương đã có contentRaw
                const currentCompleted = Storage.book.chapters.filter(c => 'contentRaw' in c).length;
                container.find('[name="progress"]>progress').val(currentCompleted).attr('max', totalChapters);
                document.title = `[${currentCompleted}/${totalChapters}]${Storage.title}`;
            }

            // --- Hàm sleep ---
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
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
            console.log("Bắt đầu thực thi tuần tự...");

            // 1. Xử lý 'deal'
            for (const chapter of chapterList.deal) {
                if ('contentRaw' in chapter) continue; // Bỏ qua nếu đã xử lý (ví dụ do addChapterNext)
                if (Config.delayBetweenChapters > 0) { // Chỉ chờ nếu delay > 0
                    console.log(`%cĐang chờ ${Config.delayBetweenChapters / 1000} giây trước khi xử lý (deal) chương...`, "color: orange;");
                    await sleep(Config.delayBetweenChapters);
                }
                console.log(`%cBắt đầu xử lý (deal) chương: ${chapter.title || chapter.url}`, "color: purple;");
                try {
                    const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;
                    const result = await rule.deal(chapter); // Hàm deal đã bao gồm fetch và xử lý
                    if (result && result.content) {
                        if (result.content.trim().length < 10) {
                            console.warn(`%cNội dung (deal) chương '${result.title || chapter.title}' có vẻ rỗng hoặc quá ngắn. Đánh dấu là lỗi.`, "color: orange;");
                            chapter.contentRaw = ''; // Đánh dấu lỗi
                        } else {
                            chapter.document = result.content; // Hoặc result.contentRaw nếu có
                            chapter.contentRaw = result.content;
                            chapter.content = result.content;
                            if (result.title) chapter.title = result.title;
                            updateProgress();
                        }
                    } else {
                        console.error(`%cHàm deal trả về lỗi hoặc không có nội dung cho chương: ${chapter.title || chapter.url}`, "color: red;", result?.error || '');
                        chapter.contentRaw = ''; // Đánh dấu lỗi
                    }
                } catch (error) {
                    console.error(`%cLỗi khi thực thi deal cho chương: ${chapter.title || chapter.url}`, "color: red;", error);
                    chapter.contentRaw = ''; // Đánh dấu lỗi
                }
                // Cập nhật tiến trình chung sau mỗi lần deal (thành công hay thất bại đều cập nhật)
                updateProgress(); // Cập nhật dựa trên trạng thái contentRaw
            }
            //hết

            if (Storage.book.chapters.every((i) => i.contentRaw && i.document)) {
                await onComplete();
                return;
            }

            //thêm
            if (chapterList.download.length > 0) {
                xhr.init({
                    retry: Config.retry,
                    thread: Storage.rule.thread && Storage.rule.thread < Config.thread ? Storage.rule.thread : Config.thread, // **QUAN TRỌNG: Vẫn giữ thread = 1**
                    timeout: Config.timeout,
                    // onfailed: onChapterFailed, // Sẽ xử lý lỗi trong vòng lặp
                    onfailedEvery: onChapterFailedEvery,
                    checkLoad: async (res) => (res.status >= 200 && res.status < 300),
                });

                for (const chapter of chapterList.download) {
                    if ('contentRaw' in chapter) continue; // Bỏ qua nếu đã xử lý (ví dụ do addChapterNext)
                    if (Config.delayBetweenChapters > 0) { // Chỉ chờ nếu delay > 0
                        console.log(`%cĐang chờ ${Config.delayBetweenChapters / 1000} giây trước khi tải (download) chương: ${chapter.title || chapter.url}`, "color: orange;");
                        await sleep(Config.delayBetweenChapters);
                    }
                    console.log(`%cBắt đầu tải (download) chương: ${chapter.title || chapter.url}`, "color: blue;");

                    await new Promise(async (resolveRequest) => {
                        let requestSucceeded = false;
                        try {
                            // Tạo một yêu cầu duy nhất bằng cách dùng xhr.add hoặc tương đương
                            // Cách đơn giản nhất là dùng lại xhr.list với mảng chỉ có 1 phần tử
                            xhr.storage.config.set('onComplete', () => { // onComplete cho chunk 1 phần tử này
                                // Không cần làm gì nhiều ở đây vì đã có originalOnChapterLoad xử lý
                                console.log(`%cHoàn thành tải chunk cho: ${chapter.title || chapter.url}`, "color: blue;");
                                requestSucceeded = true; // Đánh dấu thành công
                                resolveRequest();
                            });
                            xhr.storage.config.set('onfailed', (res, request) => { // onfailed cho chunk này
                                console.warn(`%cLỗi tải chunk cho: ${request?.raw?.title || request?.raw?.url}, tiếp tục...`, "color: orange;");
                                onChapterFailed(res, request); // Gọi hàm xử lý lỗi gốc
                                requestSucceeded = false; // Đánh dấu thất bại
                                resolveRequest(); // Vẫn resolve để vòng lặp tiếp tục
                            });

                            xhr.list([chapter], { // requestOption gốc chứa originalOnChapterLoad
                                onload: originalOnChapterLoad, // Đảm bảo hàm xử lý nội dung được gọi
                                overrideMimeType
                            });
                            xhr.start(); // Bắt đầu xử lý chunk 1 chương này
                        } catch (error) {
                            console.error(`%cLỗi nghiêm trọng khi bắt đầu tải chương ${chapter.title || chapter.url}:`, "color: red;", error);
                            chapter.contentRaw = ''; // Đánh dấu lỗi
                            resolveRequest(); // Resolve để tiếp tục vòng lặp
                        }
                        // Không await xhr.start() ở đây vì nó trả về ngay lập tức
                        // Promise sẽ được resolve bởi onComplete hoặc onfailed
                    });
                    // Cập nhật tiến trình chung sau mỗi lần tải (thành công hay thất bại đều cập nhật)
                    updateProgress(); // Cập nhật dựa trên trạng thái contentRaw
                }
            }
            //hết

            if (chapterList.iframe.length && chapterList.iframe.find((i) => !('contentRaw' in i))) {
                for (const chapter of chapterList.iframe.filter((i) => !('contentRaw' in i))) {
                    const rule = vipChapters.includes(chapter.url) ? Storage.rule.vip : Storage.rule;
                    await new Promise((resolve, reject) => {
                        $('<iframe>').on('load', async (e) => {
                            let response, responseText;
                            try {
                                if (typeof rule.iframe === 'function') await rule.iframe(e.target.contentWindow);
                                response = e.target.contentWindow.document;
                                responseText = e.target.contentWindow.document.documentElement.outerHTML;
                            } catch (error) {
                                console.error(error);
                                response = '';
                                responseText = '';
                            }
                            // THAY ĐỔI Ở ĐÂY:
                            await originalOnChapterLoad({ response, responseText }, { raw: chapter });
                            // ------------
                            $(e.target).remove();
                            resolve();
                        }).attr('src', chapter.url).css('visibility', 'hidden')
                            .appendTo('body');
                    });
                    // Có thể thêm sleep ở đây nếu cần delay giữa các iframe
                    if (Config.delayBetweenChapters > 0) {
                        console.log(`%cĐang chờ ${Config.delayBetweenChapters / 1000} giây sau khi xử lý iframe chương: ${chapter.title || chapter.url}`, "color: orange;");
                        await sleep(Config.delayBetweenChapters);
                    }
                }
            }

            //thêm
            if (chapterList.popup.length && chapterList.popup.find((i) => !('contentRaw' in i))) {
                for (const chapter of chapterList.popup.filter((i) => !('contentRaw' in i))) {
                    // **Cảnh báo 1: Sử dụng 'var' thay vì 'let' hoặc 'const'**
                    var popupWindow = window.open(chapter.url, '', 'resizable,scrollbars,width=300,height=350'); // Nên đổi var thành let
                    window.localStorage.setItem('gm-nd-url', chapter.url);
                    await waitFor(() => window.localStorage.getItem('gm-nd-html') || !popupWindow || popupWindow.closed);
                    const html = window.localStorage.getItem('gm-nd-html');
                    const doc = html;
                    // THAY ĐỔI Ở ĐÂY:
                    await originalOnChapterLoad({ response: doc, responseText: html }, { raw: chapter });
                    // ------------
                    if (popupWindow && !popupWindow.closed) {
                        popupWindow.close();
                    }
                    window.localStorage.removeItem('gm-nd-url');
                    window.localStorage.removeItem('gm-nd-html');

                    // Thêm sleep ở đây nếu cần delay giữa các popup
                    if (Config.delayBetweenChapters > 0) {
                        console.log(`%cĐang chờ ${Config.delayBetweenChapters / 1000} giây sau khi xử lý popup chương: ${chapter.title || chapter.url}`, "color: orange;");
                        await sleep(Config.delayBetweenChapters);
                    }
                }
            }
            //hết
            //             await onComplete();
            // --- Hoàn thành ---
            console.log("Đã hoàn thành vòng lặp xử lý tuần tự.");
            // Kiểm tra lại lần cuối xem còn chương nào thiếu không
            const remaining = Storage.book.chapters.filter(c => !('contentRaw' in c));
            if (remaining.length === 0) {
                console.log("Tất cả chương đã hoàn tất. Chuẩn bị lưu file...");
                await onComplete(); // Gọi hàm hoàn tất cuối cùng (để tạo file)
            } else {
                console.warn(`%cCòn ${remaining.length} chương chưa có nội dung sau khi chạy tuần tự. Vui lòng kiểm tra lỗi hoặc nhấn "Buộc lưu".`, "color: orange;");
                // Không tự động gọi onComplete, để người dùng quyết định bấm "Buộc lưu"
                container.find('[name="buttons"]').find('[name="force-save"]').attr('disabled', null); // Kích hoạt nút Buộc lưu
            }
        });
        container.find('[name="buttons"]').find('[type="button"]:not([name="download"])').on('click', async (e) => {
            const name = $(e.target).attr('name');
            if (name === 'exit') {
                $('.novel-downloader-style,.novel-downloader-style-chapter,.novel-downloader-v3').remove();
                $('[novel-downloader-chapter]').attr('order', null).attr('novel-downloader-chapter', null);
            } else if (name === 'force-download') {
                xhr.start();
            } else if (name === 'toggle-opacity') {
                container.toggleClass('opacity01');
            }
        });
        container.find('[name="config"]').find('button[name="toggle"]').on('click', (e) => {
            container.find('.useless[name="config"]').toggle();
        });
        container.find('[name="info"]>input[type="text"]').on('change', (e) => (Storage.book[$(e.target).attr('name')] = e.target.value));

        // style
        const style = [
            '.novel-downloader-v3>div *,.novel-downloader-v3>div *:before,.novel-downloader-v3>div *:after{margin:1px;}',
            '.novel-downloader-v3 input{border:1px solid #000;opacity: 1;}',
            '.novel-downloader-v3 input[type="checkbox"]{position:relative;top:0;opacity:1;appearance:checkbox;}',
            '.novel-downloader-v3 input[type="button"],.novel-downloader-v3 button{border:1px solid #000;cursor:pointer;padding:2px 3px;}',
            '.novel-downloader-v3 input[type=number]{width:36px;}',
            '.novel-downloader-v3 input[type=number]{width:36px;}',
            '.novel-downloader-v3 input:not([disabled="disabled"]),.novel-downloader-v3 button:not([disabled="disabled"]){color:#000;background-color:#fff;}',
            '.novel-downloader-v3 input[disabled="disabled"],.novel-downloader-v3 button[disabled="disabled"]{color:#fff;cursor:default!important;background-color:#545454;text-decoration:line-through double;}',
            '.novel-downloader-v3 span[title]::after{content:"(?)";text-decoration:underline;font-size:x-small;vertical-align:super;cursor:pointer;}',

            '.novel-downloader-v3{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99999;background:white;border:1px solid black;max-height:99vh;overflow:auto;text-align:center;}',
            '.novel-downloader-v3.opacity01{opacity:0.1;}',
            '.novel-downloader-v3.opacity01:hover{opacity:0.6;}',
            '.novel-downloader-v3>div{margin:2px 0px;}',
            '.novel-downloader-v3>div:nth-child(2n){background-color:#DADADA;}',
            '.novel-downloader-v3>div:nth-child(2n+1){background-color:#FAFAFA;}',

            '.novel-downloader-v3>.useless[name="config"]{display:none;}',
            '.novel-downloader-v3>[name="config"] [name="vip"]:checked+span{color:red;}',

            '.novel-downloader-v3>[name="progress"]{display:none;}',
            '.novel-downloader-v3>[name="progress"]>progress::before{content:attr(value)" / "attr(max);}',

            '[novel-downloader-chapter]:before{content:attr(order)"-"!important;}',
            '[novel-downloader-chapter]:before{color:blue!important;}',
            '[novel-downloader-chapter="vip"]:before{color:red!important;}',
        ].join('');
        $('<style class="novel-downloader-style">').text(style).appendTo('head');

        // rule
        container.find('[name="info"]>[name="rule"]').html(`<a href="${window.location.origin}" target="_blank">${Storage.rule.siteName}</a>`);

        let infoPage = await getFromRule(Storage.rule.infoPage, { attr: 'href' }, [], null);
        if (infoPage === window.location.href) {
            infoPage = null;
        } else if (infoPage) {
            infoPage = new URL(infoPage, window.location.href).href;
            const res = await xhr.sync(infoPage, null, { cache: true });
            try {
                infoPage = new window.DOMParser().parseFromString(res.responseText, 'text/html');
            } catch (error) {
                console.error(error);
                infoPage = null;
            }
        }

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

        container.find('input,select,textarea').attr('disabled', null);
        container.find('input,select,textarea').filter('[raw-disabled="disabled"]').attr('raw-disabled', null).attr('disabled', 'disabled');

        if (Storage.debug.book) console.log(Storage.book);
    }

    $('<div class="novel-downloader-trigger" style="position:fixed;top:0px;left:0px;width:1px;height:100%;z-index:999999;background:transparent;"></div>').on({
        dblclick() {
            init();
            showUI();
        },
    }).appendTo('body');
    GM_registerMenuCommand('Download Novel', () => {
        init();
        showUI();
    }, 'N');
    GM_registerMenuCommand('Show Storage', () => {
        console.log({ Storage, xhr: xhr.storage.getSelf() });
    }, 'S');

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
                Config.reference ? 'User script được dịch và bổ sung bởi QB. Không nên share quá nhìu nhoa!' : '',
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
            download(blob, `${title}.txt`);
        },
        epub: async (chapters) => {
            const { length } = String(chapters.length);
            const title = Storage.book.title || Storage.book.chapters[0].title;
            const writer = Storage.book.writer || 'novelDownloader';
            const uuid = `ndv3-${window.location.href.match(/[a-z0-9-]+/ig).join('-')}${$('.novel-downloader-v3').find('[name="limit"]>[name="range"]').val()}`;
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
                files[`${String(i + 1).padStart(length, '0')}-${title.replace(/[\\/:*?"<>|]/g, '-')}.txt`] = content;
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
    function download(content, name, force) {
        const lastDownload = Storage.lastDownload || {};
        const time = new Date().getTime();
        if (!force && time - lastDownload.time <= 5 * 1000
            && lastDownload.size === content.size && lastDownload.type === content.type
            && lastDownload.name === name) { // 5秒内重复下载
            return;
        }
        Storage.lastDownload = {
            time,
            size: content.size,
            type: content.type,
            name,
        };
        saveAs(content, name);
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
