/* erdevelop · Geliştirici Araçları — JSON, Base64, Hash, Regex, Renk, UUID, Unix zaman
   Hepsi tarayıcıda çalışır; girilen veri hiçbir yere gönderilmez. */
'use strict';
const enc = new TextEncoder(), dec = new TextDecoder('utf-8', { fatal: true });

/* ---------------- JSON ---------------- */
const J = {
  konum(src, msg) { /* hata mesajından satır/sütun */
    let m = /line (\d+) column (\d+)/i.exec(msg); if (m) return { l: +m[1], c: +m[2] };
    m = /position (\d+)/i.exec(msg); if (!m) return null;
    const p = +m[1], once = src.slice(0, p).split('\n'); return { l: once.length, c: once[once.length - 1].length + 1 };
  },
  /* tarayıcı mesajı konum vermezse ilk hatanın yerini kendimiz buluruz (küçük JSON tarayıcısı) */
  hataYeri(s) {
    let i = 0; const ws = () => { while (/[ \t\n\r]/.test(s[i] || '')) i++; }, hata = () => { throw i; };
    const deger = () => { ws(); const c = s[i];
      if (c === '{') { i++; ws(); if (s[i] === '}') { i++; return; } for (;;) { ws(); if (s[i] !== '"') hata(); dize(); ws(); if (s[i] !== ':') hata(); i++; deger(); ws(); if (s[i] === ',') { i++; continue; } if (s[i] === '}') { i++; return; } hata(); } }
      if (c === '[') { i++; ws(); if (s[i] === ']') { i++; return; } for (;;) { deger(); ws(); if (s[i] === ',') { i++; continue; } if (s[i] === ']') { i++; return; } hata(); } }
      if (c === '"') return dize();
      const m = /^(-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?|true|false|null)/.exec(s.slice(i)); if (!m) hata(); i += m[0].length; };
    const dize = () => { i++; while (i < s.length) { const c = s[i]; if (c === '"') { i++; return; } if (c === '\\') { i++; if (!/["\\/bfnrtu]/.test(s[i] || '')) hata(); } else if (c < ' ') hata(); i++; } hata(); };
    try { deger(); ws(); if (i < s.length) hata(); return null; } catch (p) { if (typeof p !== 'number') return null; const once = s.slice(0, p).split('\n'); return { l: once.length, c: once[once.length - 1].length + 1 }; }
  },
  sirala(v) { if (Array.isArray(v)) return v.map(J.sirala); if (v && typeof v === 'object') return Object.keys(v).sort().reduce((o, k) => (o[k] = J.sirala(v[k]), o), {}); return v; },
  ozet(v) { let n = 0, d = 0; (function f(x, k) { n++; d = Math.max(d, k); if (x && typeof x === 'object') Object.values(x).forEach(y => f(y, k + 1)); })(v, 0); return { n, d }; }
};
function jsonIsle(kip) {
  const src = byId('jIn').value, out = byId('jOut'), r = byId('jRes');
  if (!src.trim()) { r.innerHTML = '<span class="ph">JSON yapıştır ya da dosya bırak.</span>'; out.value = ''; return; }
  let v;
  try { v = JSON.parse(src); }
  catch (e) {
    const k = J.konum(src, e.message) || J.hataYeri(src); out.value = '';
    r.innerHTML = `<b class="err">Geçersiz JSON</b><br><span class="mono">${esc(e.message)}</span>` + (k ? `<br>Satır ${k.l}, sütun ${k.c}: <span class="mono">${esc((src.split('\n')[k.l - 1] || '').slice(Math.max(0, k.c - 30), k.c + 30))}</span>` : '');
    return;
  }
  if (byId('jSort').checked) v = J.sirala(v);
  const g = byId('jInd').value, ind = g === 't' ? '\t' : +g;
  if (kip === 'min') out.value = JSON.stringify(v);
  else if (kip === 'yaml') { if (!window.jsyaml) { loadScript('lib/js-yaml.min.js').then(() => jsonIsle('yaml')); return; } out.value = jsyaml.dump(v, { indent: 2, lineWidth: -1 }); }
  else out.value = JSON.stringify(v, null, ind);
  const o = J.ozet(v);
  r.innerHTML = `<b class="ok">Geçerli JSON</b> · ${Array.isArray(v) ? 'dizi, ' + v.length + ' öğe' : v && typeof v === 'object' ? 'nesne, ' + Object.keys(v).length + ' anahtar' : typeof v} · ${o.n} değer · derinlik ${o.d} · ${size(enc.encode(out.value).length)}`;
}

/* ---------------- Base64 ---------------- */
const B64 = {
  kodla(bytes, url) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); let b = btoa(s); if (url) b = b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); return b; },
  coz(b) { b = b.replace(/^data:[^,]*,/, '').replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '='; const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
};
let b64Son = null;
function b64Isle(yon) {
  const src = byId('bIn').value, url = byId('bUrl').checked, out = byId('bOut'), r = byId('bRes'); b64Son = null; byId('bDl').hidden = true;
  if (!src) { out.value = ''; r.innerHTML = '<span class="ph">Metin yaz ya da dosya bırak.</span>'; return; }
  try {
    if (yon === 'kodla') { const u = enc.encode(src); out.value = B64.kodla(u, url); r.textContent = `${size(u.length)} → ${size(out.value.length)} (%${Math.round(out.value.length / u.length * 100)})`; }
    else { const u = B64.coz(src); b64Son = u; try { out.value = dec.decode(u); r.textContent = `Metin olarak çözüldü · ${size(u.length)}`; } catch (e) { out.value = ''; r.innerHTML = `İkili veri (${size(u.length)}), metin değil · <b>dosya olarak indir</b>`; } byId('bDl').hidden = false; }
  } catch (e) { out.value = ''; r.innerHTML = '<b class="err">Geçersiz Base64</b>'; }
}
async function b64Dosya(f) {
  const u = new Uint8Array(await f.arrayBuffer()), b = B64.kodla(u, false);
  byId('bOut').value = byId('bData').checked ? `data:${f.type || 'application/octet-stream'};base64,${b}` : b;
  byId('bRes').textContent = `${f.name} · ${size(u.length)} → ${size(byId('bOut').value.length)}`;
}

/* ---------------- Hash ---------------- */
function md5(bytes) { /* RFC 1321 */
  const K = new Uint32Array(64), S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0;
  const l = bytes.length, n = ((l + 8 >> 6) + 1) << 6, m = new Uint8Array(n); m.set(bytes); m[l] = 0x80;
  const bits = l * 8; for (let i = 0; i < 8; i++) m[n - 8 + i] = i < 4 ? (bits >>> (8 * i)) & 255 : Math.floor(bits / 2 ** (8 * i)) & 255;
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476; const W = new Uint32Array(16), dv = new DataView(m.buffer);
  for (let o = 0; o < n; o += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; } else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; } else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; } else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      const s = S[(i >> 4) * 4 + (i & 3)], x = (A + F + K[i] + W[g]) >>> 0; A = D; D = C; C = B; B = (B + ((x << s) | (x >>> (32 - s)))) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  const r = new DataView(new ArrayBuffer(16)); [a0, b0, c0, d0].forEach((v, i) => r.setUint32(i * 4, v, true));
  return new Uint8Array(r.buffer);
}
const hex = u => [...u].map(b => b.toString(16).padStart(2, '0')).join('');
const ALG = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
async function ozetler(bytes) {
  const o = { MD5: hex(md5(bytes)) };
  for (const a of ALG.slice(1)) o[a] = crypto.subtle ? hex(new Uint8Array(await crypto.subtle.digest(a, bytes))) : '(tarayıcı desteklemiyor)';
  return o;
}
let hashBytes = null, hashAd = '';
async function hashIsle() {
  const bytes = hashBytes || enc.encode(byId('hIn').value), bek = byId('hBek').value.trim().toLowerCase(), r = byId('hRes');
  const o = await ozetler(bytes), buyuk = byId('hUp').checked;
  r.innerHTML = `<div class="hint" style="margin:0 0 6px">${hashAd ? esc(hashAd) + ' · ' : ''}${size(bytes.length)}</div>` + ALG.map(a => { const v = buyuk ? o[a].toUpperCase() : o[a], es = bek && o[a] === bek;
    return `<div class="kv"><span>${a}${a === 'MD5' || a === 'SHA-1' ? ' <small class="hint">(güvenlik için önerilmez)</small>' : ''}</span><b class="mono hv${es ? ' ok' : ''}" data-c="${v}" title="Kopyala">${v}${es ? ' ✓' : ''}</b></div>`; }).join('')
    + (bek ? `<p class="${ALG.some(a => o[a] === bek) ? 'ok' : 'err'}" style="margin:8px 0 0">${ALG.some(a => o[a] === bek) ? '✓ Beklenen değerle eşleşti: ' + ALG.find(a => o[a] === bek) : '✕ Beklenen değer hiçbir özetle eşleşmedi'}</p>` : '');
}

/* ---------------- Regex ---------------- */
function rxIsle() {
  const p = byId('rP').value, fl = $$('.rF').filter(c => c.checked).map(c => c.value).join(''), txt = byId('rT').value, rep = byId('rR').value, r = byId('rRes'), hl = byId('rHl'), lst = byId('rL');
  if (!p) { r.innerHTML = '<span class="ph">Desen yaz.</span>'; hl.innerHTML = esc(txt); lst.innerHTML = ''; byId('rOut').value = ''; return; }
  let re; try { re = new RegExp(p, fl.includes('g') ? fl : fl + 'g'); } catch (e) { r.innerHTML = `<b class="err">Hatalı desen</b> <span class="mono">${esc(e.message)}</span>`; return; }
  const ms = []; let m, guard = 0;
  while ((m = re.exec(txt)) && guard++ < 5000) { ms.push(m); if (m[0] === '') re.lastIndex++; if (!fl.includes('g')) break; }
  r.innerHTML = ms.length ? `<b class="ok">${ms.length} eşleşme</b>${ms.length >= 5000 ? ' (ilk 5000)' : ''}` : '<b>Eşleşme yok</b>';
  let h = '', son = 0; ms.forEach((x, i) => { h += esc(txt.slice(son, x.index)) + `<mark title="#${i + 1}">${esc(x[0]) || '<i>∅</i>'}</mark>`; son = x.index + x[0].length; }); h += esc(txt.slice(son)); hl.innerHTML = h;
  lst.innerHTML = ms.slice(0, 200).map((x, i) => `<tr><td>${i + 1}</td><td class="mono">${esc(x[0])}</td><td>${x.index}</td><td class="mono">${x.slice(1).map((g, k) => `$${k + 1}=${g === undefined ? '∅' : esc(g)}`).join(' · ')}${x.groups ? ' · ' + Object.entries(x.groups).map(([k, v]) => `${esc(k)}=${esc(v ?? '∅')}`).join(' · ') : ''}</td></tr>`).join('');
  try { byId('rOut').value = rep ? txt.replace(new RegExp(p, fl), rep) : ''; } catch (e) { }
}
const RX = [['E-posta', '[\\w.+-]+@[\\w-]+\\.[\\w.-]+', 'gi'], ['Türkiye cep telefonu', '(?:\\+90|0)?\\s?5\\d{2}\\s?\\d{3}\\s?\\d{2}\\s?\\d{2}', 'g'], ['Tarih (GG.AA.YYYY)', '(\\d{2})\\.(\\d{2})\\.(\\d{4})', 'g'],
  ['TR IBAN', 'TR\\d{2}(?:\\s?\\d{4}){5}\\s?\\d{2}', 'gi'], ['Ondalık sayı (virgüllü)', '-?\\d+(?:,\\d+)?', 'g'], ['URL', 'https?://[^\\s<>"]+', 'gi'], ['Poz no (D-01, C-12)', '\\b([A-Z])-(\\d{2,3})\\b', 'g']];

/* ---------------- Renk ---------------- */
const R = {
  hex2rgb(h) { h = h.replace('#', '').trim(); if (h.length === 3 || h.length === 4) h = h.split('').map(c => c + c).join(''); if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(h)) return null; const n = parseInt(h.slice(0, 6), 16); return [n >> 16, (n >> 8) & 255, n & 255, h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1]; },
  rgb2hex: (r, g, b) => '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase(),
  rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s * 100, l * 100]; },
  hsl2rgb(h, s, l) { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return [f(0) * 255, f(8) * 255, f(4) * 255]; },
  rgb2hsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; const h = R.rgb2hsl(r * 255, g * 255, b * 255)[0]; return [h, mx ? d / mx * 100 : 0, mx * 100]; },
  rgb2cmyk(r, g, b) { const k = 1 - Math.max(r, g, b) / 255; if (k >= 1) return [0, 0, 0, 100]; return [(1 - r / 255 - k) / (1 - k) * 100, (1 - g / 255 - k) / (1 - k) * 100, (1 - b / 255 - k) / (1 - k) * 100, k * 100]; },
  lum(r, g, b) { const f = c => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); },
  kontrast(a, b) { const x = R.lum(...a), y = R.lum(...b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); },
  coz(s) { s = s.trim().toLowerCase(); let m;
    if ((m = /^#?[0-9a-f]{3,8}$/.exec(s))) return R.hex2rgb(s);
    if ((m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(s))) return [+m[1], +m[2], +m[3], 1];
    if ((m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%?[\s,]+([\d.]+)%?/.exec(s))) return [...R.hsl2rgb(+m[1], +m[2], +m[3]), 1];
    if ((m = /^(\d{1,3})[\s,;]+(\d{1,3})[\s,;]+(\d{1,3})$/.exec(s))) return [+m[1], +m[2], +m[3], 1];
    const c = document.createElement('canvas').getContext('2d'); c.fillStyle = '#010203'; c.fillStyle = s; if (c.fillStyle !== '#010203' || s === '#010203') return R.hex2rgb(c.fillStyle);
    return null; }
};
function renkIsle(kaynak) {
  const v = kaynak === 'picker' ? byId('cPick').value : byId('cIn').value, rgb = R.coz(v), out = byId('cRes');
  if (!rgb) { out.innerHTML = '<span class="ph">HEX (#2F6FB5), rgb(47, 111, 181), hsl(211, 59%, 45%) ya da renk adı yaz.</span>'; return; }
  const [r, g, b] = rgb.map((x, i) => i < 3 ? Math.max(0, Math.min(255, x)) : x), h = R.rgb2hex(r, g, b), hsl = R.rgb2hsl(r, g, b), hsv = R.rgb2hsv(r, g, b), c = R.rgb2cmyk(r, g, b);
  if (kaynak === 'picker') byId('cIn').value = h; else byId('cPick').value = h;
  const kw = R.kontrast([r, g, b], [255, 255, 255]), kb = R.kontrast([r, g, b], [0, 0, 0]), n0 = x => Math.round(x);
  const sat = (ad, val) => `<div class="kv"><span>${ad}</span><b class="mono hv" data-c="${val}" title="Kopyala">${val}</b></div>`;
  const wc = k => k >= 7 ? 'AAA' : k >= 4.5 ? 'AA' : k >= 3 ? 'AA büyük yazı' : 'yetersiz';
  out.innerHTML = `<div class="sw" style="background:${h}"><span style="color:#fff">Beyaz yazı ${fmt(kw, 2)}:1 · ${wc(kw)}</span><span style="color:#000">Siyah yazı ${fmt(kb, 2)}:1 · ${wc(kb)}</span></div>`
    + sat('HEX', h) + sat('RGB', `rgb(${n0(r)}, ${n0(g)}, ${n0(b)})`) + sat('HSL', `hsl(${n0(hsl[0])}, ${n0(hsl[1])}%, ${n0(hsl[2])}%)`)
    + sat('HSV / HSB', `${n0(hsv[0])}°, ${n0(hsv[1])}%, ${n0(hsv[2])}%`) + sat('CMYK (yaklaşık)', `${n0(c[0])}, ${n0(c[1])}, ${n0(c[2])}, ${n0(c[3])}`)
    + sat('Ondalık (0–1)', `${(r / 255).toFixed(3)}, ${(g / 255).toFixed(3)}, ${(b / 255).toFixed(3)}`)
    + `<div class="ton">${[90, 75, 60, 45, 30, 15].map(L => { const x = R.rgb2hex(...R.hsl2rgb(hsl[0], hsl[1], L)); return `<button type="button" style="background:${x}" data-v="${x}" title="${x}"></button>`; }).join('')}</div>`;
}

/* ---------------- UUID ---------------- */
function uuid4() { if (crypto.randomUUID) return crypto.randomUUID(); const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128; return fmtU(b); }
function uuid7() { const b = crypto.getRandomValues(new Uint8Array(16)), t = Date.now(); for (let i = 0; i < 6; i++) b[i] = Math.floor(t / 2 ** (8 * (5 - i))) & 255; b[6] = (b[6] & 15) | 0x70; b[8] = (b[8] & 63) | 128; return fmtU(b); }
const fmtU = b => { const h = hex(b); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`; };
function uuidUret() {
  const n = Math.max(1, Math.min(1000, Math.round(num('uN')) || 1)), v = byId('uV').value, up = byId('uUp').checked, nd = byId('uNd').checked, br = byId('uBr').checked;
  const L = []; for (let i = 0; i < n; i++) { let u = v === '7' ? uuid7() : uuid4(); if (up) u = u.toUpperCase(); if (nd) u = u.replace(/-/g, ''); if (br) u = '{' + u + '}'; L.push(u); }
  byId('uOut').value = L.join('\n');
}
function uuidCoz() {
  const s = byId('uChk').value.trim().replace(/[{}]/g, ''), r = byId('uRes');
  if (!s) { r.innerHTML = '<span class="ph">İncelemek için bir UUID yapıştır.</span>'; return; }
  const h = s.replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(h)) { r.innerHTML = '<b class="err">Geçerli bir UUID değil</b> (32 onaltılık karakter olmalı)'; return; }
  const ver = parseInt(h[12], 16), vr = parseInt(h[16], 16), varyant = vr >= 8 && vr <= 11 ? 'RFC 9562' : vr < 8 ? 'NCS (eski)' : vr < 14 ? 'Microsoft' : 'gelecek için ayrılmış';
  let ek = '';
  if (ver === 7) { const ms = parseInt(h.slice(0, 12), 16); ek = `<div class="kv"><span>Zaman damgası</span><b>${new Date(ms).toLocaleString('tr-TR')} · ${ms} ms</b></div>`; }
  if (ver === 1) { const t = BigInt('0x' + h.slice(13, 16) + h.slice(8, 12) + h.slice(0, 8)), ms = Number((t - 122192928000000000n) / 10000n); ek = `<div class="kv"><span>Zaman damgası</span><b>${new Date(ms).toLocaleString('tr-TR')}</b></div>`; }
  const ad = { 1: 'zaman + MAC', 3: 'MD5 ad tabanlı', 4: 'rastgele', 5: 'SHA-1 ad tabanlı', 6: 'sıralı zaman', 7: 'Unix zamanı + rastgele', 8: 'özel' }[ver] || 'bilinmiyor';
  r.innerHTML = `<b class="ok">Geçerli UUID</b><div class="kv"><span>Sürüm</span><b>v${ver} · ${ad}</b></div><div class="kv"><span>Varyant</span><b>${varyant}</b></div>${ek}<div class="kv"><span>Biçimli</span><b class="mono">${fmtU(h.match(/../g).map(x => parseInt(x, 16)))}</b></div>`;
}

/* ---------------- Unix zaman ---------------- */
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
function zamanSatir(d) {
  const ms = d.getTime(), s = Math.floor(ms / 1000), ex = ms / 86400000 + 25569, fark = (ms - Date.now()) / 1000;
  const goreli = Math.abs(fark) < 60 ? 'şimdi' : (() => { const a = Math.abs(fark), [v, b] = a < 3600 ? [a / 60, 'dakika'] : a < 86400 ? [a / 3600, 'saat'] : a < 2592000 ? [a / 86400, 'gün'] : a < 31536000 ? [a / 2592000, 'ay'] : [a / 31536000, 'yıl']; return `${Math.floor(v)} ${b} ${fark < 0 ? 'önce' : 'sonra'}`; })();
  const kv = (a, b) => `<div class="kv"><span>${a}</span><b class="mono hv" data-c="${esc(b)}" title="Kopyala">${esc(b)}</b></div>`;
  return kv('Unix (saniye)', String(s)) + kv('Unix (milisaniye)', String(ms)) + kv('Yerel (' + tz + ')', d.toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'medium' }))
    + kv('UTC', d.toUTCString()) + kv('ISO 8601', d.toISOString()) + kv('Excel seri no', ex.toFixed(6).replace(/\.?0+$/, '')) + kv('Göreli', goreli);
}
function zamanIsle() {
  const v = byId('zIn').value.trim(), r = byId('zRes');
  if (!v) { r.innerHTML = '<span class="ph">Unix zamanı (1794700800), tarih (2026-11-15 14:30) ya da Excel seri no yaz.</span>'; return; }
  let d;
  if (/^-?\d+(\.\d+)?$/.test(v)) {
    const n = +v, kip = byId('zKip').value;
    d = kip === 's' ? new Date(n * 1000) : kip === 'ms' ? new Date(n) : kip === 'ex' ? new Date((n - 25569) * 86400000) : Math.abs(n) > 1e11 ? new Date(n) : n < 100000 ? new Date((n - 25569) * 86400000) : new Date(n * 1000);
  } else d = new Date(v.replace(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/, '$3-$2-$1'));
  r.innerHTML = isNaN(d) ? '<b class="err">Anlaşılamadı.</b> Ör. 1794700800, 2026-11-15T14:30, 15.11.2026 14:30' : zamanSatir(d);
}

/* ---------------- bağlama ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const git = tabs('gelistirici'); addEventListener('hashchange', () => { const h = location.hash.slice(1); if (document.querySelector(`.tabs [data-tab="${h}"]`)) git(h); });
  const kayit = id => { const e = byId(id); const k = 'gel:' + id; const s = LS.get(k); if (s != null) e.type === 'checkbox' ? (e.checked = s === '1') : (e.value = s); e.addEventListener('change', () => LS.set(k, e.type === 'checkbox' ? (e.checked ? '1' : '0') : e.value)); };
  ['jInd', 'jSort', 'bUrl', 'bData', 'hUp', 'uV', 'uUp', 'uNd', 'uBr', 'zKip'].forEach(kayit);
  // JSON
  let jt; byId('jIn').addEventListener('input', () => { clearTimeout(jt); jt = setTimeout(() => jsonIsle('fmt'), 250); });
  byId('jFmt').onclick = () => jsonIsle('fmt'); byId('jMin').onclick = () => jsonIsle('min'); byId('jYaml').onclick = () => jsonIsle('yaml'); byId('jSort').onchange = () => jsonIsle('fmt'); byId('jInd').onchange = () => jsonIsle('fmt');
  byId('jCp').onclick = e => copy(byId('jOut').value, e.target); byId('jDl').onclick = () => download('veri.json', new Blob([byId('jOut').value], { type: 'application/json' }));
  dropZone(byId('jDrop'), async f => { byId('jIn').value = await f[0].text(); jsonIsle('fmt'); });
  byId('jOrnek').onclick = () => { byId('jIn').value = '{"proje":"Ofis Kulesi","kat":12,"cephe":{"aks":1.5,"cam":"8T+16Ar+44.2","uw":1.1},"pozlar":["D-01","K-01","C-01"],"onayli":true}'; jsonIsle('fmt'); };
  jsonIsle('fmt');
  // Base64
  byId('bEnc').onclick = () => b64Isle('kodla'); byId('bDec').onclick = () => b64Isle('coz'); byId('bIn').addEventListener('input', () => b64Isle(byId('bDec').classList.contains('son') ? 'coz' : 'kodla'));
  ['bEnc', 'bDec'].forEach(id => byId(id).addEventListener('click', () => { byId('bEnc').classList.toggle('son', id === 'bEnc'); byId('bDec').classList.toggle('son', id === 'bDec'); }));
  byId('bCp').onclick = e => copy(byId('bOut').value, e.target); byId('bDl').onclick = () => b64Son && download('cozulen.bin', new Blob([b64Son]));
  byId('bSw').onclick = () => { byId('bIn').value = byId('bOut').value; byId('bOut').value = ''; };
  dropZone(byId('bDrop'), f => b64Dosya(f[0]));
  // Hash
  let ht; byId('hIn').addEventListener('input', () => { hashBytes = null; hashAd = ''; clearTimeout(ht); ht = setTimeout(hashIsle, 200); }); byId('hBek').addEventListener('input', hashIsle); byId('hUp').onchange = hashIsle;
  dropZone(byId('hDrop'), async f => { hashBytes = new Uint8Array(await f[0].arrayBuffer()); hashAd = f[0].name; hashIsle(); });
  byId('hRes').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) copy(b.dataset.c); });
  hashIsle();
  // Regex
  ['rP', 'rT', 'rR'].forEach(id => byId(id).addEventListener('input', rxIsle)); $$('.rF').forEach(c => c.onchange = rxIsle);
  byId('rOrn').innerHTML = RX.map((x, i) => `<button type="button" data-i="${i}">${esc(x[0])}</button>`).join('');
  byId('rOrn').onclick = e => { const b = e.target.closest('[data-i]'); if (!b) return; const x = RX[+b.dataset.i]; byId('rP').value = x[1]; $$('.rF').forEach(c => c.checked = x[2].includes(c.value)); rxIsle(); };
  byId('rCp').onclick = e => copy(byId('rOut').value, e.target);
  if (!byId('rT').value) byId('rT').value = 'Teklif: info@ornek.com.tr, 0532 123 45 67\nTeslim 15.11.2026, ikinci parti 03.12.2026\nPozlar: D-01, D-02, K-01, C-12 · 1.480,5 m²';
  rxIsle();
  // Renk
  byId('cIn').addEventListener('input', () => renkIsle('metin')); byId('cPick').addEventListener('input', () => renkIsle('picker'));
  byId('cRes').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) return copy(b.dataset.c); const t = e.target.closest('[data-v]'); if (t) { byId('cIn').value = t.dataset.v; renkIsle('metin'); } });
  if (!byId('cIn').value) byId('cIn').value = '#2F6FB5'; renkIsle('metin');
  // UUID
  byId('uGen').onclick = uuidUret; byId('uCp').onclick = e => copy(byId('uOut').value, e.target); byId('uChk').addEventListener('input', uuidCoz); uuidUret(); uuidCoz();
  // Zaman
  byId('zIn').addEventListener('input', zamanIsle); byId('zKip').onchange = zamanIsle;
  byId('zNow').onclick = () => { byId('zIn').value = String(Math.floor(Date.now() / 1000)); byId('zKip').value = 'oto'; zamanIsle(); };
  byId('zRes').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) copy(b.dataset.c); });
  byId('uOut').addEventListener('focus', e => e.target.select());
  const saat = () => { byId('zSaat').textContent = Math.floor(Date.now() / 1000); }; saat(); setInterval(saat, 1000);
  zamanIsle();
  document.querySelectorAll('.box [data-c]').forEach(b => b.addEventListener('click', () => copy(b.dataset.c)));
});
if (typeof module !== 'undefined') module.exports = { md5, B64, R, J, hex };
