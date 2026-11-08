/* erdevelop · deneyler ortak arayüzü: üst çubuk, ayar paneli, döngü, ekran görüntüsü */
'use strict';
function Kit(o) {
  const $ = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const KEY = 'erdevelop-deney:' + o.id, def = {}, v = {};
  (o.controls || []).forEach(c => { if (c.k) def[c.k] = c.v; });
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { }
  Object.assign(v, def, saved);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { } };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* üst çubuk */
  const bar = $('div', 'k-bar');
  bar.innerHTML = `<a class="k-chip" href="Tools.html" title="Araçlar">‹ <span class="k-hide-sm">Araçlar</span></a><span class="k-chip k-title">${o.title}${o.sub ? ` <small>· ${o.sub}</small>` : ''}</span><span class="k-sp"></span>`;
  const mk = (ic, tip, fn) => { const b = $('button', 'k-chip k-btn', ic); b.type = 'button'; b.title = tip; b.setAttribute('aria-label', tip); b.onclick = fn; bar.appendChild(b); return b; };
  const bPause = mk('❚❚', 'Duraklat (boşluk)', () => K.pause(!K.paused));
  if (o.snapshot !== false) mk('⤓', 'PNG kaydet (S)', () => K.snap());
  mk('⛶', 'Tam ekran (F)', () => K.full());
  const bSet = mk('⚙', 'Ayarlar (H)', () => K.panel(panel.hidden));
  document.body.appendChild(bar);

  /* ayar paneli */
  const panel = $('div', 'k-panel'); panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Ayarlar');
  const inputs = {};
  const fmtv = (c, x) => c.fmt ? c.fmt(x) : x;
  (o.controls || []).forEach(c => {
    if (c.t === 'h') { panel.appendChild($('h4', '', c.l)); return; }
    if (c.t === 'note') { panel.appendChild($('p', 'k-hint', c.l)); return; }
    if (c.t === 'buttons') { const w = $('div', 'k-btns'); c.b.forEach(([l, fn, pri]) => { const b = $('button', pri ? 'pri' : '', l); b.type = 'button'; b.onclick = fn; w.appendChild(b); }); panel.appendChild(w); return; }
    const row = $('div', 'k-row'), id = 'k-' + c.k; let inp;
    if (c.t === 'range') { row.innerHTML = `<label for="${id}">${c.l}<b></b></label><input type="range" id="${id}" min="${c.min}" max="${c.max}" step="${c.step || 1}">`; inp = row.querySelector('input'); inp.value = v[c.k]; row.querySelector('b').textContent = fmtv(c, v[c.k]); }
    else if (c.t === 'select') { row.innerHTML = `<label for="${id}">${c.l}</label><select id="${id}">${c.o.map(([a, b]) => `<option value="${a}">${b}</option>`).join('')}</select>`; inp = row.querySelector('select'); inp.value = v[c.k]; if (inp.value !== String(v[c.k])) { v[c.k] = def[c.k]; inp.value = v[c.k]; } }
    else if (c.t === 'color') { row.innerHTML = `<label for="${id}">${c.l}</label><input type="color" id="${id}">`; inp = row.querySelector('input'); inp.value = v[c.k]; }
    else if (c.t === 'check') { row.innerHTML = `<label class="k-chk"><input type="checkbox" id="${id}"> ${c.l}</label>`; inp = row.querySelector('input'); inp.checked = !!v[c.k]; }
    else if (c.t === 'text') { row.innerHTML = `<label for="${id}">${c.l}</label><input type="text" id="${id}" maxlength="${c.max || 60}" placeholder="${c.ph || ''}" autocomplete="off">`; inp = row.querySelector('input'); inp.value = v[c.k]; }
    inputs[c.k] = { inp, c, row };
    inp.addEventListener(c.t === 'select' || c.t === 'check' || c.t === 'color' ? 'change' : 'input', () => {
      let x = c.t === 'check' ? inp.checked : c.t === 'range' ? +inp.value : inp.value;
      v[c.k] = x; if (c.t === 'range') row.querySelector('b').textContent = fmtv(c, x); save(); o.onChange && o.onChange(c.k, x, v);
    });
    if (c.t === 'color') inp.addEventListener('input', () => { v[c.k] = inp.value; o.onChange && o.onChange(c.k, inp.value, v); });
    panel.appendChild(row);
  });
  const foot = $('div', 'k-btns'); const bReset = $('button', '', 'Varsayılan'); bReset.type = 'button'; bReset.onclick = () => K.reset(); foot.appendChild(bReset); panel.appendChild(foot);
  panel.appendChild($('p', 'k-hint', (o.help ? o.help + '<br>' : '') + 'Kısayollar: boşluk duraklat · S resim · F tam ekran · H ayarlar'));
  document.body.appendChild(panel);

  /* bildirim */
  const toastEl = $('div', 'k-toast'); document.body.appendChild(toastEl); let tt = 0;

  /* boşta kalınca çubuğu gizle */
  let idleT = 0; const wake = () => { document.body.classList.remove('k-idle'); clearTimeout(idleT); idleT = setTimeout(() => { if (panel.hidden && !K.paused) document.body.classList.add('k-idle'); }, 3200); };
  ['pointermove', 'pointerdown', 'keydown'].forEach(t => addEventListener(t, wake, { passive: true })); wake();

  const K = {
    v, def, reduced, paused: false, ptr: { x: -1e4, y: -1e4, px: -1e4, py: -1e4, down: false, active: false, vx: 0, vy: 0 },
    toast(m) { toastEl.textContent = m; toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('on'), 2000); },
    pause(p) { K.paused = p; bPause.textContent = p ? '▶' : '❚❚'; bPause.classList.toggle('on', p); if (!p) { last = performance.now(); } o.onPause && o.onPause(p); },
    panel(show) { panel.hidden = !show; bSet.classList.toggle('on', show); },
    full() { const d = document; if (!d.fullscreenElement) (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen || (() => { })).call(d.documentElement); else (d.exitFullscreen || d.webkitExitFullscreen).call(d); },
    set(k, x, silent) { v[k] = x; const I = inputs[k]; if (I) { if (I.c.t === 'check') I.inp.checked = !!x; else I.inp.value = x; if (I.c.t === 'range') I.row.querySelector('b').textContent = fmtv(I.c, x); } save(); if (!silent && o.onChange) o.onChange(k, x, v); },
    reset() { Object.keys(def).forEach(k => K.set(k, def[k], true)); save(); o.onChange && o.onChange('*', null, v); K.toast('Varsayılan ayarlar'); },
    snap() { const c = o.snapshot ? o.snapshot() : K.cv; if (!c) return; const go = cv => cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${o.id}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); K.toast('PNG kaydedildi'); }, 'image/png'); c.then ? c.then(go) : go(c); },
    /* tam ekran tuval */
    canvas(opt = {}) {
      const cv = $('canvas', 'k-cv'); document.body.prepend(cv); K.cv = cv; const ctx = opt.ctx === false ? null : cv.getContext('2d', opt.ctxOpt || {});
      const S = { cv, ctx, W: 0, H: 0, dpr: 1, fns: [] };
      const fit = () => { S.dpr = Math.min(devicePixelRatio || 1, opt.maxDpr || 2); S.W = innerWidth; S.H = innerHeight; cv.width = Math.round(S.W * S.dpr); cv.height = Math.round(S.H * S.dpr); if (ctx) ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); S.fns.forEach(f => f(S)); };
      S.onResize = f => { S.fns.push(f); f(S); }; addEventListener('resize', fit); fit();
      const P = K.ptr, at = e => { P.px = P.x; P.py = P.y; P.x = e.clientX; P.y = e.clientY; };
      cv.addEventListener('pointerdown', e => { at(e); P.down = true; P.active = true; P.px = P.x; P.py = P.y; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); o.onDown && o.onDown(P, e); });
      cv.addEventListener('pointermove', e => { at(e); P.active = true; P.vx = P.x - P.px; P.vy = P.y - P.py; o.onMove && o.onMove(P, e); });
      ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, e => { P.down = false; if (e.pointerType !== 'mouse') { P.active = false; P.x = P.y = -1e4; } o.onUp && o.onUp(P, e); }));
      cv.addEventListener('pointerleave', () => { P.active = false; P.down = false; P.x = P.y = -1e4; });
      return S;
    },
    loop(fn) { let raf = 0; const step = t => { raf = requestAnimationFrame(step); if (K.paused || document.hidden) { last = t; return; } const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t; fn(dt, t / 1000); }; raf = requestAnimationFrame(step); }
  };
  let last = performance.now();
  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, select, textarea')) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); K.pause(!K.paused); }
    else if (k === 's' && o.snapshot !== false) K.snap();
    else if (k === 'f') K.full();
    else if (k === 'h') K.panel(panel.hidden);
    else if (k === 'escape') K.panel(false);
    else if (o.onKey) o.onKey(k, e);
  });
  return K;
}
/* renk paletleri */
const PALETTES = {
  neon: ['#ff3d7f', '#3dffb5', '#3d9bff', '#f5ff3d', '#c93dff'], pastel: ['#ffb3c7', '#b5ead7', '#c7ceea', '#ffdac1', '#e2f0cb'],
  gunbatimi: ['#ff6b35', '#f7c548', '#e63946', '#ff9f1c', '#9d4edd'], okyanus: ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
  orman: ['#2d6a4f', '#40916c', '#74c69d', '#b7e4c7', '#d8f3dc'], mono: ['#ffffff', '#cccccc', '#999999', '#666666', '#e6e6e6'], klasik: ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3']
};
const PAL_OPTS = [['klasik', 'Klasik'], ['neon', 'Neon'], ['pastel', 'Pastel'], ['gunbatimi', 'Gün batımı'], ['okyanus', 'Okyanus'], ['orman', 'Orman'], ['mono', 'Siyah-beyaz']];
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
