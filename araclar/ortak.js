/* Araç Kutusu ortak yardımcılar — her sayfada önce bu yüklenir */
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const byId = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, d = 2) => isFinite(n) ? n.toLocaleString('tr-TR', { maximumFractionDigits: d }) : '—';
const p2 = n => String(n).padStart(2, '0');
const LS = { get(k) { try { return localStorage.getItem('ak:' + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem('ak:' + k, v); } catch (e) { } } };
function pnum(s) { s = String(s == null ? '' : s).replace(/\s/g, ''); if (!s) return NaN; if (s.indexOf(',') > -1 && s.indexOf('.') > -1) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(',', '.'); const v = parseFloat(s); return isFinite(v) ? v : NaN; }
const num = id => pnum(byId(id).value);
function size(b) { return b < 1024 ? b + ' B' : b < 1048576 ? fmt(b / 1024, 1) + ' KB' : fmt(b / 1048576, 2) + ' MB'; }
function stamp() { const d = new Date(); return d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()); }
const baseName = n => n.replace(/\.[^.]+$/, '');

let _tt = 0;
function toast(m, ms = 2600) { let t = byId('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = m; t.classList.add('on'); clearTimeout(_tt); _tt = setTimeout(() => t.classList.remove('on'), ms); }

function download(name, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }

async function copy(text, btn) {
  let ok = false; try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { }
  if (!ok) { const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (_) { } t.remove(); }
  if (btn) { const o = btn.textContent; btn.textContent = 'Kopyalandı ✓'; setTimeout(() => btn.textContent = o, 1200); } else toast('Kopyalandı');
}

/* sekmeler: <div class="tabs"><button data-tab="a"> … <div class="pane" data-pane="a"> */
function tabs(key, onChange) {
  const bs = $$('.tabs [data-tab]'), go = id => { bs.forEach(b => b.classList.toggle('on', b.dataset.tab === id)); $$('.pane').forEach(p => p.classList.toggle('on', p.dataset.pane === id)); LS.set(key + ':tab', id); if (onChange) onChange(id); };
  bs.forEach(b => b.onclick = () => go(b.dataset.tab));
  const h = location.hash.slice(1), s = LS.get(key + ':tab');
  go(bs.some(b => b.dataset.tab === h) ? h : bs.some(b => b.dataset.tab === s) ? s : bs[0].dataset.tab);
  return go;
}

/* dosya bırakma alanı: <label class="drop"><input type="file"></label> */
function dropZone(el, cb) {
  const inp = el.querySelector('input[type=file]');
  inp.addEventListener('change', () => { if (inp.files.length) cb([...inp.files]); inp.value = ''; });
  ['dragenter', 'dragover'].forEach(t => el.addEventListener(t, e => { e.preventDefault(); el.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => el.addEventListener(t, e => { e.preventDefault(); el.classList.remove('over'); }));
  el.addEventListener('drop', e => { const f = [...(e.dataTransfer.files || [])]; if (f.length) cb(f); });
}

/* basit ZIP (sıkıştırmasız, UTF-8 adlar) */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u) { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
async function makeZip(files) {
  const enc = new TextEncoder(), parts = [], cent = []; let off = 0; const used = new Set();
  const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF, dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  for (const f of files) {
    let name = f.name, k = 1; while (used.has(name)) name = f.name.replace(/(\.[^.]+)?$/, m => '-' + (++k) + m); used.add(name);
    const data = f.data instanceof Blob ? new Uint8Array(await f.data.arrayBuffer()) : f.data, nm = enc.encode(name), crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
    parts.push(h.buffer, nm, data);
    const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    cent.push(c.buffer, nm); off += 30 + nm.length + data.length;
  }
  const cs = cent.reduce((a, b) => a + (b.byteLength || b.length), 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...cent, e.buffer], { type: 'application/zip' });
}

/* betik yükleyici (büyük kütüphaneler yalnızca gerekince) */
const _ld = {};
function loadScript(src) { return _ld[src] || (_ld[src] = new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => { delete _ld[src]; no(new Error(src + ' yüklenemedi')); }; document.head.appendChild(s); })); }

/* girişleri hatırla: data-keep özniteliği olanlar */
function keepInputs(prefix) {
  $$('[data-keep]').forEach(el => {
    const k = prefix + ':' + el.id, v = LS.get(k);
    if (v != null) { if (el.type === 'checkbox') el.checked = v === '1'; else if (el.tagName !== 'SELECT' || [...el.options].some(o => o.value === v)) el.value = v; }
    const s = () => LS.set(k, el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value); el.addEventListener('input', s); el.addEventListener('change', s);
  });
}
