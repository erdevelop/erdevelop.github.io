/* düğüm editörü */
'use strict';
/* ================= editor view ================= */
const editor = $('editor'), world = $('world'), wiresSvg = $('wires'), groupsEl = $('groups');
let view = { x: 40, y: 30, s: 1 };
function applyView() { world.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.s})`; editor.style.backgroundSize = `${24 * view.s}px ${24 * view.s}px`; editor.style.backgroundPosition = `${view.x}px ${view.y}px`; }
const els = {};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function fmt(v) {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : (Math.abs(v) < 1e-3 && v !== 0 ? v.toExponential(2) : v.toFixed(3));
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (isPt(v)) return `{${fmt(v.x)}, ${fmt(v.y)}, ${fmt(v.z)}}`;
  if (isCol(v)) return v.hex;
  if (isDom(v)) return `${fmt(v.a)} To ${fmt(v.b)}`;
  if (isTag(v)) return `Tag "${v.s}"`;
  if (isPln(v)) return `Plane O{${fmt(v.o[0])}, ${fmt(v.o[1])}, ${fmt(v.o[2])}} Z{${fmt(v.z[0])}, ${fmt(v.z[1])}, ${fmt(v.z[2])}}`;
  if (v && v.t) return { crv: v.c ? 'Closed Curve' : 'Curve', srf: 'Surface', mesh: 'Mesh' }[v.t] || v.t;
  return String(v);
}
const nickOf = n => n.nick || C[n.type].nick;
function portCls(inp) { return inp.tree ? ' tre' : inp.list ? ' lst' : ''; }
function stopIn(el) { el.querySelectorAll('input, select, button, canvas, .val').forEach(x => x.addEventListener('pointerdown', e => e.stopPropagation())); }
const PILLS = ['slider', 'numin', 'toggle', 'colour', 'vlist', 'textin'];
function buildNode(n) {
  const c = C[n.type], el = document.createElement('div');
  el.className = 'node' + (PILLS.includes(c.ui) ? ' pill' : '') + (c.ui === 'slider' ? ' slider' : '') + (c.ui === 'panel' ? ' panel' : '');
  el.dataset.id = n.id;
  const outs = `<div class="col outs">${c.outs.map((o, i) => `<div class="p" data-o="${i}" title="${o}">${c.ui && PILLS.includes(c.ui) ? '' : o}</div>`).join('')}</div>`;
  const ins = () => `<div class="col ins">${c.ins.map((inp, i) => `<div class="p${portCls(inp)}" data-i="${i}" title="${inp.n}${inp.tree ? ' (ağaç)' : inp.list ? ' (liste)' : ''}${inp.opt ? ' · isteğe bağlı' : ''}">${inp.n}</div>`).join('')}</div>`;
  const ch = () => { schedule(); };
  if (c.ui === 'slider') {
    el.innerHTML = `<span class="lbl" data-drag>${esc(n.st.label)}</span><input type="range" min="${n.st.min}" max="${n.st.max}" step="${n.st.int ? 1 : (n.st.max - n.st.min) / 200}" value="${n.st.val}" aria-label="${esc(n.st.label)}"><span class="val" title="Değeri düzenle">${fmt(n.st.val)}</span>${outs}`;
    const r = el.querySelector('input'), v = el.querySelector('.val');
    r.addEventListener('input', () => { n.st.val = n.st.int ? Math.round(+r.value) : +(+r.value).toFixed(4); v.textContent = fmt(n.st.val); ch(); });
    v.addEventListener('click', () => {
      v.contentEditable = 'true'; v.focus(); document.getSelection().selectAllChildren(v);
      const done = () => { v.contentEditable = 'false'; const x = parseFloat(v.textContent.replace(',', '.')); if (isFinite(x)) { n.st.min = Math.min(n.st.min, x); n.st.max = Math.max(n.st.max, x); n.st.val = n.st.int ? Math.round(x) : x; r.min = n.st.min; r.max = n.st.max; r.value = n.st.val; } v.textContent = fmt(n.st.val); ch(); };
      v.addEventListener('blur', done, { once: true });
      v.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); v.blur(); } e.stopPropagation(); });
    });
  } else if (c.ui === 'numin') {
    el.innerHTML = `<span class="lbl" data-drag>${esc(n.st.label)}</span><input class="ni" type="number" step="any" value="${n.st.val}" aria-label="${esc(n.st.label)}">${outs}`;
    const ip = el.querySelector('input'); ip.addEventListener('input', () => { const x = parseFloat(ip.value); if (isFinite(x)) { n.st.val = x; ch(); } }); ip.addEventListener('keydown', e => e.stopPropagation());
  } else if (c.ui === 'toggle') {
    el.innerHTML = `<span class="lbl" data-drag>${esc(n.st.label)}</span><button type="button" class="tg"></button>${outs}`;
    const b = el.querySelector('.tg'); const paint = () => { b.textContent = n.st.val ? 'True' : 'False'; b.classList.toggle('on', !!n.st.val); }; paint();
    b.addEventListener('click', () => { n.st.val = !n.st.val; paint(); ch(); });
  } else if (c.ui === 'colour') {
    el.innerHTML = `<span class="lbl" data-drag>${esc(n.st.label)}</span><input type="color" value="${n.st.hex}" aria-label="renk">${outs}`;
    el.querySelector('input').addEventListener('input', e => { n.st.hex = e.target.value; ch(); });
  } else if (c.ui === 'panel') {
    el.innerHTML = `<div class="col ins"><div class="p tre" data-i="0"></div></div><div class="ptitle" data-drag><span>${esc(n.nick || 'Panel')}</span><span class="cnt"></span></div><pre></pre>`;
  } else if (c.ui === 'expr') {
    el.innerHTML = `${ins()}<div class="exb" data-drag><small>${esc(nickOf(n))}</small><input type="text" spellcheck="false" value="${esc(n.st.expr)}" aria-label="ifade"></div>${outs}<span class="eye" hidden></span><span class="msg"></span>`;
    const ip = el.querySelector('input'); ip.addEventListener('input', () => { n.st.expr = ip.value; ch(); }); ip.addEventListener('keydown', e => e.stopPropagation());
  } else if (c.ui === 'graph') {
    el.innerHTML = `${ins()}<div class="gb" data-drag><select aria-label="eğri türü">${Object.entries(GTYPES).map(([k, v]) => `<option value="${k}" ${k === n.st.type ? 'selected' : ''}>${v}</option>`).join('')}</select><canvas width="240" height="240"></canvas></div>${outs}<span class="msg"></span>`;
    const sl = el.querySelector('select'), cv = el.querySelector('canvas');
    sl.addEventListener('change', () => { n.st.type = sl.value; drawGraph(n); ch(); });
    let drag = null;
    const pos = e => { const r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height))]; };
    cv.addEventListener('pointerdown', e => { if (n.st.type !== 'bezier') return; const p = pos(e); const d1 = Math.hypot(p[0] - n.st.h1[0], p[1] - n.st.h1[1]), d2 = Math.hypot(p[0] - n.st.h2[0], p[1] - n.st.h2[1]); drag = d1 < d2 ? 'h1' : 'h2'; cv.setPointerCapture(e.pointerId); n.st[drag] = p; drawGraph(n); ch(); });
    cv.addEventListener('pointermove', e => { if (!drag) return; n.st[drag] = pos(e); drawGraph(n); ch(); });
    cv.addEventListener('pointerup', () => { drag = null; });
    requestAnimationFrame(() => drawGraph(n));
  } else if (c.ui === 'sched') {
    el.innerHTML = `${ins()}<div class="sb"><div class="st" data-drag><span>${esc(nickOf(n))} · panel listesi</span><button type="button" class="csv">CSV</button></div><table></table></div>${outs}<span class="eye" hidden></span><span class="msg"></span>`;
    el.querySelector('.csv').addEventListener('click', () => scheduleCSV(n));
  } else if (c.ui === 'vlist') {
    el.innerHTML = `<span class="lbl" data-drag>${esc(n.st.label)}</span><select class="vl" aria-label="değer"></select><button type="button" class="vle" title="Listeyi düzenle">✎</button>${outs}`;
    const sl = el.querySelector('select'), paint = () => { sl.innerHTML = vlistItems(n.st).map((it, i) => `<option value="${i}" ${i === n.st.sel ? 'selected' : ''}>${esc(it.name)}</option>`).join(''); }; paint();
    sl.addEventListener('change', () => { n.st.sel = +sl.value; ch(); });
    el.querySelector('.vle').addEventListener('click', () => { const v = prompt('Liste öğeleri (ad = değer; ad = değer):', n.st.items); if (v == null) return; n.st.items = v; n.st.sel = 0; paint(); ch(); });
  } else if (c.ui === 'textin') {
    el.innerHTML = `<span class="lbl" data-drag>${esc(n.st.label)}</span><input class="ni" type="text" spellcheck="false" value="${esc(n.st.val)}" aria-label="${esc(n.st.label)}">${outs}`;
    const ip = el.querySelector('input'); ip.addEventListener('input', () => { n.st.val = ip.value; ch(); }); ip.addEventListener('keydown', e => e.stopPropagation());
  } else if (c.ui === 'rec') {
    el.innerHTML = `${ins()}<div class="sb"><div class="st" data-drag><span>Kayıt · <b class="rc">0</b></span><span><button type="button" class="rtg"></button> <button type="button" class="rcl">temizle</button></span></div><small class="rinfo">girdi her değiştiğinde kaydeder (en fazla ${n.st.max})</small></div>${outs}<span class="msg"></span>`;
    const tg = el.querySelector('.rtg'); const p2 = () => { tg.textContent = n.st.on ? '❚❚ durdur' : '● kaydet'; }; p2();
    tg.addEventListener('click', () => { n.st.on = !n.st.on; p2(); ch(); });
    el.querySelector('.rcl').addEventListener('click', () => { n.st.data = []; n.st.last = null; ch(); });
  } else if (c.ui === 'optim') {
    el.innerHTML = `${ins()}<div class="sb opt"><div class="st" data-drag><span>Optimizer</span><select class="og"><option value="min" ${n.st.goal === 'min' ? 'selected' : ''}>en küçük</option><option value="max" ${n.st.goal === 'max' ? 'selected' : ''}>en büyük</option></select></div>
      <div class="optl"></div><div class="orow">nesil <input type="number" class="oge" min="1" max="500" value="${n.st.gens}"> nüfus <input type="number" class="opo" min="4" max="100" value="${n.st.pop}"></div>
      <canvas class="osp" width="210" height="38"></canvas><div class="ost"></div><div class="orow"><button type="button" class="ogo">Başlat</button><button type="button" class="oap">en iyiyi uygula</button></div></div><span class="msg"></span>`;
    el.querySelector('.og').addEventListener('change', e => { n.st.goal = e.target.value; });
    el.querySelector('.oge').addEventListener('input', e => { n.st.gens = +e.target.value || 25; }); el.querySelector('.opo').addEventListener('input', e => { n.st.pop = +e.target.value || 16; });
    el.querySelectorAll('.orow input').forEach(x => x.addEventListener('keydown', e => e.stopPropagation()));
    el.querySelector('.optl').addEventListener('change', e => { const id = +e.target.dataset.sid; if (!id) return; n.st.ids = e.target.checked ? [...new Set([...n.st.ids, id])] : n.st.ids.filter(x => x !== id); });
    el.querySelector('.ogo').addEventListener('click', () => runOptim(n)); el.querySelector('.oap').addEventListener('click', () => applyOptBest(n));
  } else if (c.ui === 'act') {
    const A = ACT[n.type];
    el.innerHTML = `${ins()}<div class="sb"><div class="st" data-drag><span>${esc(nickOf(n))} · ${A.title}</span><select class="un" title="model birimi">${Object.keys(UNITS).map(u => `<option ${u === n.st.unit ? 'selected' : ''}>${u}</option>`).join('')}</select></div>${A.mix ? `<div class="orow">dizilim <input type="text" class="mix" value="${esc(n.st.mix)}" spellcheck="false"></div>` : ''}<div class="orow">${A.btns.map((b, i) => `<button type="button" data-b="${i}">${b[0]}</button>`).join('')}</div><table></table></div>${outs}<span class="eye" hidden></span><span class="msg"></span>`;
    el.querySelector('.un').addEventListener('change', e => { n.st.unit = e.target.value; ch(); });
    const mx = el.querySelector('.mix'); if (mx) { mx.addEventListener('input', () => { n.st.mix = mx.value; ch(); }); mx.addEventListener('keydown', e => e.stopPropagation()); }
    el.querySelectorAll('[data-b]').forEach(b => b.addEventListener('click', () => A.btns[+b.dataset.b][1](n)));
  } else if (buildNodeV5(n, c, el, ins, outs, ch)) {
  } else {
    el.innerHTML = `${c.ins.length ? ins() : ''}<div class="core" data-drag><span>${esc(nickOf(n))}</span></div>${c.outs.length ? outs : ''}<span class="eye" title="Önizleme aç/kapat">◉</span><span class="msg"></span>`;
    if (!c.ins.length) el.classList.add('noins');
  }
  const eye = el.querySelector('.eye'); if (eye) { eye.hidden = false; eye.title = 'Önizleme aç/kapat'; eye.textContent = '◉'; eye.addEventListener('pointerdown', e => { e.stopPropagation(); n.pv = !n.pv; refreshNode(n); schedule(); }); }
  stopIn(el);
  world.appendChild(el); els[n.id] = el;
  el.addEventListener('pointerdown', e => onNodeDown(e, n));
  el.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); if (!sel.has(n.id)) { sel.clear(); sel.add(n.id); paintSel(); } openCtx(e.clientX, e.clientY, n); });
  refreshNode(n);
}
function drawGraph(n) {
  const el = els[n.id]; if (!el) return; const cv = el.querySelector('.gb canvas'); if (!cv) return; const x = cv.getContext('2d'), W = cv.width, H = cv.height;
  x.clearRect(0, 0, W, H); x.strokeStyle = '#e4e4e4'; x.lineWidth = 1; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(i * W / 4, 0); x.lineTo(i * W / 4, H); x.moveTo(0, i * H / 4); x.lineTo(W, i * H / 4); x.stroke(); }
  x.strokeStyle = '#2b3137'; x.lineWidth = 3; x.beginPath(); for (let i = 0; i <= 80; i++) { const t = i / 80, y = gmap(n.st, t); const px = t * W, py = H - y * H; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
  if (n.st.type === 'bezier') { x.strokeStyle = '#6fbf4a'; x.lineWidth = 1.5; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(0, H); x.lineTo(n.st.h1[0] * W, H - n.st.h1[1] * H); x.moveTo(W, 0); x.lineTo(n.st.h2[0] * W, H - n.st.h2[1] * H); x.stroke(); x.setLineDash([]);
    for (const h of [n.st.h1, n.st.h2]) { x.fillStyle = '#6fbf4a'; x.beginPath(); x.arc(h[0] * W, H - h[1] * H, 9, 0, Math.PI * 2); x.fill(); } }
  const inp = flat((doc.wires.find(w => w.b === n.id) && cache[doc.wires.find(w => w.b === n.id).a]) ? cache[doc.wires.find(w => w.b === n.id).a][doc.wires.find(w => w.b === n.id).ao] : []).filter(v => typeof v === 'number');
  x.fillStyle = 'rgba(217,72,59,.75)'; for (const v of inp.slice(0, 300)) { const t = Math.max(0, Math.min(1, v)); x.beginPath(); x.arc(t * W, H - gmap(n.st, t) * H, 3.5, 0, Math.PI * 2); x.fill(); }
}
function refreshNode(n) {
  const el = els[n.id]; if (!el) return;
  el.style.left = n.x + 'px'; el.style.top = n.y + 'px';
  el.classList.toggle('sel', sel.has(n.id)); el.classList.toggle('off', !!n.off);
  const inf = info[n.id] || {}, c = C[n.type];
  el.classList.toggle('warn', !!inf.warn && !inf.err); el.classList.toggle('err', !!inf.err);
  const m = el.querySelector('.msg'); if (m) m.textContent = n.off ? 'devre dışı' : (inf.err || inf.warn || '');
  const eye = el.querySelector('.eye'); if (eye) { eye.classList.toggle('off', !n.pv); eye.style.display = hasGeo(n) ? '' : 'none'; }
  if (c.ui === 'panel') {
    const T = inf.tree || [], total = treeCount(T), lines = [];
    const simple = T.length <= 1 && (!T.length || pkey(T[0].p) === '0');
    let shown = 0;
    for (const b of T) { if (!simple) lines.push(`<b>{${pkey(b.p)}}</b> (${b.v.length})`); for (let i = 0; i < b.v.length && shown < 300; i++, shown++) lines.push(`${simple ? '' : '  '}${i}  ${esc(fmt(b.v[i]))}`); if (shown >= 300) break; }
    el.querySelector('pre').innerHTML = total ? lines.join('\n') + (total > shown ? `\n… (${total})` : '') : '(boş)';
    el.querySelector('.cnt').textContent = total ? (T.length > 1 ? `${T.length} dal · ${total}` : `${total}`) : '';
  }
  if (c.ui === 'sched') {
    const s = inf.sched, tb = el.querySelector('.sb table');
    tb.innerHTML = s ? `<tr><th>Tip</th><th>Adet</th><th>G</th><th>Y</th><th>m²</th></tr>${s.rows.slice(0, 14).map((r, i) => `<tr><td><i style="background:${TYPE_COL[i % TYPE_COL.length]}"></i>${r.name}</td><td>${r.n}</td><td>${r.w.toFixed(3)}</td><td>${r.h.toFixed(3)}</td><td>${r.area.toFixed(3)}</td></tr>`).join('')}${s.rows.length > 14 ? `<tr><td colspan="5">… +${s.rows.length - 14} tip</td></tr>` : ''}<tr><th>Toplam</th><th>${s.total}</th><th colspan="3">${s.rows.length} tip</th></tr>` : '<tr><td>(panel yok)</td></tr>';
  }
  if (c.ui === 'graph') drawGraph(n);
  if (c.ui === 'act') el.querySelector('.sb table').innerHTML = actTable(n);
  refreshNodeV5(n, c, el);
  if (c.ui === 'rec') el.querySelector('.rc').textContent = (n.st.data || []).length;
  if (c.ui === 'optim') paintOpt(n);
  if (![...PILLS, 'panel'].includes(c.ui)) c.ins.forEach((inp, i) => { const p = el.querySelector(`.ins [data-i="${i}"]`); if (p) p.classList.toggle('def', !doc.wires.some(w => w.b === n.id && w.bi === i)); });
}
const hasGeo = n => n.type === 'cprev' ? !!(info[n.id] && info[n.id].cp && info[n.id].cp.G.length) : (cache[n.id] || []).some(t => t.some(b => b.v.some(isGeo)));
function rebuildAll() { world.querySelectorAll('.node').forEach(e => e.remove()); for (const k in els) delete els[k]; doc.nodes.forEach(buildNode); drawWires(); paintRemote(); }
function paintSel() { doc.nodes.forEach(n => { const el = els[n.id]; if (el) el.classList.toggle('sel', sel.has(n.id)); }); drawWires(); updatePreviewColors(); }

function portXY(nid, kind, idx) {
  const el = els[nid]; if (!el) return null;
  const p = el.querySelector(kind === 'o' ? `[data-o="${idx}"]` : `[data-i="${idx}"]`); if (!p) return null;
  const r = p.getBoundingClientRect(), w = world.getBoundingClientRect();
  return [((kind === 'o' ? r.right + 1 : r.left - 1) - w.left) / view.s, (r.top + r.height / 2 - w.top) / view.s];
}
const bez = (a, b) => { const dx = Math.max(40, Math.abs(b[0] - a[0]) * 0.5); return `M${a[0]} ${a[1]}C${a[0] + dx} ${a[1]} ${b[0] - dx} ${b[1]} ${b[0]} ${b[1]}`; };
let tempWire = null, rubber = null;
function drawWires() {
  let h = '';
  for (const w of doc.wires) {
    const a = portXY(w.a, 'o', w.ao), b = portXY(w.b, 'i', w.bi); if (!a || !b) continue;
    const d = bez(a, b), T = (cache[w.a] || [])[w.ao] || [], cnt = treeCount(T), tree = T.length > 1, list = cnt > 1;
    const selw = sel.has(w.a) || sel.has(w.b), col = selw ? '#3f8f22' : '#353535';
    if (!cnt) h += `<path d="${d}" fill="none" stroke="#8a8a8a" stroke-width="1.5" stroke-dasharray="3 4"/>`;
    else if (tree) h += `<path d="${d}" fill="none" stroke="${col}" stroke-width="4.5" stroke-dasharray="10 4"/><path d="${d}" fill="none" stroke="#d4d4d4" stroke-width="1.6" stroke-dasharray="10 4"/>`;
    else if (list) h += `<path d="${d}" fill="none" stroke="${col}" stroke-width="4.5"/><path d="${d}" fill="none" stroke="#d4d4d4" stroke-width="1.6"/>`;
    else h += `<path d="${d}" fill="none" stroke="${col}" stroke-width="2"/>`;
  }
  if (tempWire) h += `<path d="${bez(tempWire.a, tempWire.b)}" fill="none" stroke="#3f8f22" stroke-width="2" stroke-dasharray="6 4"/>`;
  wiresSvg.innerHTML = h;
  drawGroups();
}
const GCOLS = ['#9fd28a', '#8ec5ff', '#ffd27a', '#f4a3a3', '#c9a8f0', '#a8e3e0', '#d0d0d0'];
function drawGroups() {
  let h = '';
  doc.groups.forEach((g, gi) => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const id of g.ids) { const n = byId(id), el = els[id]; if (!n || !el) continue; x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + el.offsetWidth); y1 = Math.max(y1, n.y + el.offsetHeight); }
    if (!isFinite(x0)) return; const pad = 14, col = g.color || GCOLS[0];
    h += `<div class="grp" style="left:${x0 - pad}px;top:${y0 - pad - 4}px;width:${x1 - x0 + pad * 2}px;height:${y1 - y0 + pad * 2 + 4}px;background:${col}40;border-color:${col}"><span class="gl" data-g="${gi}" style="background:${col}">${esc(g.name || 'Grup')}</span></div>`;
  });
  if (rubber) h += `<div class="rubber" style="left:${Math.min(rubber[0], rubber[2])}px;top:${Math.min(rubber[1], rubber[3])}px;width:${Math.abs(rubber[2] - rubber[0])}px;height:${Math.abs(rubber[3] - rubber[1])}px"></div>`;
  groupsEl.innerHTML = h;
}
groupsEl.addEventListener('pointerdown', e => {
  const gl = e.target.closest('.gl'); if (!gl) return; e.stopPropagation(); closeSearch(); closeCtx();
  const g = doc.groups[+gl.dataset.g]; if (!e.shiftKey) sel.clear(); g.ids.forEach(i => sel.add(i)); paintSel();
  editor.setPointerCapture(e.pointerId); const start = toWorld(e.clientX, e.clientY);
  gesture = { kind: 'move', id: e.pointerId, start, orig: [...sel].map(id => { const m = byId(id); return [m, m.x, m.y]; }) };
});
groupsEl.addEventListener('contextmenu', e => { const gl = e.target.closest('.gl'); if (!gl) return; e.preventDefault(); e.stopPropagation(); openGroupCtx(e.clientX, e.clientY, +gl.dataset.g); });
groupsEl.addEventListener('dblclick', e => { const gl = e.target.closest('.gl'); if (!gl) return; e.stopPropagation(); renameGroup(+gl.dataset.g); });

/* ---- pointer interaction ---- */
const ptrs = new Map(); let gesture = null, lpTimer = 0;
const toWorld = (cx, cy) => { const r = editor.getBoundingClientRect(); return [(cx - r.left - view.x) / view.s, (cy - r.top - view.y) / view.s]; };
function onNodeDown(e, n) {
  if (e.button === 2) return;
  closeCtx();
  const port = e.target.closest('.p');
  if (port && port.dataset.o !== undefined) {
    e.stopPropagation(); editor.setPointerCapture(e.pointerId);
    gesture = { kind: 'wire', from: [n.id, +port.dataset.o], id: e.pointerId };
    tempWire = { a: portXY(n.id, 'o', +port.dataset.o), b: toWorld(e.clientX, e.clientY) }; drawWires(); return;
  }
  if (port && port.dataset.i !== undefined) {
    e.stopPropagation();
    const w = doc.wires.find(w => w.b === n.id && w.bi === +port.dataset.i);
    if (w) { doc.wires = doc.wires.filter(x => x !== w); editor.setPointerCapture(e.pointerId); gesture = { kind: 'wire', from: [w.a, w.ao], id: e.pointerId }; tempWire = { a: portXY(w.a, 'o', w.ao), b: toWorld(e.clientX, e.clientY) }; schedule(); }
    return;
  }
  if (e.target.closest('input, select, button, canvas, .val, pre, .eye')) return;
  e.stopPropagation();
  if (!e.shiftKey && !sel.has(n.id)) sel.clear();
  sel.add(n.id);
  editor.setPointerCapture(e.pointerId);
  const start = toWorld(e.clientX, e.clientY);
  gesture = { kind: 'move', id: e.pointerId, start, sx: e.clientX, sy: e.clientY, moved: false, orig: [...sel].map(id => { const m = byId(id); return [m, m.x, m.y]; }) };
  if (e.pointerType !== 'mouse') { clearTimeout(lpTimer); lpTimer = setTimeout(() => { if (gesture && gesture.kind === 'move' && !gesture.moved) { gesture = null; openCtx(e.clientX, e.clientY, n); } }, 550); }
  paintSel();
}
editor.addEventListener('pointerdown', e => {
  if (e.target.closest('.search, .ctx')) return;
  closeSearch(); closeCtx();
  ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (ptrs.size === 2) { clearTimeout(lpTimer); const [a, b] = [...ptrs.values()]; gesture = { kind: 'pinch', d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: view.s, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], vx: view.x, vy: view.y }; rubber = null; return; }
  if (e.target === editor || e.target === world || e.target === wiresSvg || e.target === groupsEl) {
    editor.setPointerCapture(e.pointerId);
    if (e.shiftKey || e.button === 0 && e.ctrlKey) { const p = toWorld(e.clientX, e.clientY); gesture = { kind: 'rubber', id: e.pointerId, p0: p, add: true }; rubber = [p[0], p[1], p[0], p[1]]; return; }
    if (sel.size) { sel.clear(); paintSel(); }
    editor.classList.add('panning');
    gesture = { kind: 'pan', id: e.pointerId, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
  }
});
editor.addEventListener('pointermove', e => {
  if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (!gesture) return;
  if (gesture.kind === 'pinch' && ptrs.size >= 2) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    const ns = Math.min(2.5, Math.max(0.2, gesture.s * d / gesture.d)), r = editor.getBoundingClientRect();
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], mx = gesture.mid[0] - r.left, my = gesture.mid[1] - r.top;
    view.x = mx - (mx - gesture.vx) * ns / gesture.s + (mid[0] - gesture.mid[0]); view.y = my - (my - gesture.vy) * ns / gesture.s + (mid[1] - gesture.mid[1]); view.s = ns; applyView(); return;
  }
  if (e.pointerId !== gesture.id) return;
  if (gesture.kind === 'pan') { view.x = gesture.vx + e.clientX - gesture.sx; view.y = gesture.vy + e.clientY - gesture.sy; applyView(); }
  else if (gesture.kind === 'move') {
    if (!gesture.moved && Math.hypot(e.clientX - (gesture.sx ?? e.clientX), e.clientY - (gesture.sy ?? e.clientY)) > 4) { gesture.moved = true; clearTimeout(lpTimer); }
    const p = toWorld(e.clientX, e.clientY), dx = p[0] - gesture.start[0], dy = p[1] - gesture.start[1]; gesture.orig.forEach(([m, x, y]) => { m.x = Math.round(x + dx); m.y = Math.round(y + dy); refreshNode(m); }); drawWires();
  }
  else if (gesture.kind === 'wire') { tempWire.b = toWorld(e.clientX, e.clientY); drawWires(); }
  else if (gesture.kind === 'rubber') { const p = toWorld(e.clientX, e.clientY); rubber = [gesture.p0[0], gesture.p0[1], p[0], p[1]]; drawGroups(); }
});
function endPointer(e) {
  ptrs.delete(e.pointerId); clearTimeout(lpTimer);
  if (!gesture) return;
  if (gesture.kind === 'pinch') { if (ptrs.size < 2) gesture = null; return; }
  if (e.pointerId !== gesture.id) return;
  if (gesture.kind === 'wire') {
    const t = document.elementFromPoint(e.clientX, e.clientY), port = t && t.closest('.p[data-i]'), nodeEl = t && t.closest('.node');
    if (port && nodeEl) connect(gesture.from[0], gesture.from[1], +nodeEl.dataset.id, +port.dataset.i);
    else if (nodeEl && +nodeEl.dataset.id !== gesture.from[0]) {
      const tn = byId(+nodeEl.dataset.id), c = C[tn.type];
      const free = c.ins.findIndex((_, i) => !doc.wires.some(w => w.b === tn.id && w.bi === i));
      if (free >= 0) connect(gesture.from[0], gesture.from[1], tn.id, free);
    }
    tempWire = null; schedule();
  }
  if (gesture.kind === 'move' && gesture.moved) { save(); recordSoon(); }
  if (gesture.kind === 'rubber' && rubber) {
    const [ax, ay, bx, by] = rubber, x0 = Math.min(ax, bx), x1 = Math.max(ax, bx), y0 = Math.min(ay, by), y1 = Math.max(ay, by);
    doc.nodes.forEach(n => { const el = els[n.id]; if (!el) return; if (n.x < x1 && n.x + el.offsetWidth > x0 && n.y < y1 && n.y + el.offsetHeight > y0) sel.add(n.id); });
    rubber = null; paintSel();
  }
  editor.classList.remove('panning'); gesture = null; drawWires();
}
editor.addEventListener('pointerup', endPointer);
editor.addEventListener('pointercancel', endPointer);
editor.addEventListener('wheel', e => {
  e.preventDefault();
  const r = editor.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
  const ns = Math.min(2.5, Math.max(0.2, view.s * Math.exp(-e.deltaY * 0.0015)));
  view.x = mx - (mx - view.x) * ns / view.s; view.y = my - (my - view.y) * ns / view.s; view.s = ns; applyView();
}, { passive: false });
editor.addEventListener('contextmenu', e => { if (e.target === editor || e.target === world || e.target === wiresSvg) { e.preventDefault(); openSearch(e.clientX, e.clientY); } });

/* ---- search (double click) ---- */
let searchEl = null;
editor.addEventListener('dblclick', e => {
  if (e.target !== editor && e.target !== world && e.target !== wiresSvg && e.target !== groupsEl) return;
  openSearch(e.clientX, e.clientY);
});
function openSearch(cx, cy) {
  closeSearch(); closeCtx();
  const r = editor.getBoundingClientRect(), at = toWorld(cx, cy);
  searchEl = document.createElement('div'); searchEl.className = 'search';
  searchEl.style.left = Math.max(4, Math.min(cx - r.left, r.width - 266)) + 'px'; searchEl.style.top = Math.max(4, Math.min(cy - r.top, r.height - 250)) + 'px';
  searchEl.innerHTML = '<input placeholder="bileşen ara: loft, voronoi, expr…" aria-label="Bileşen ara"><section></section>';
  editor.appendChild(searchEl);
  const inp = searchEl.querySelector('input'), list = searchEl.querySelector('section');
  let hits = [], k = 0;
  const paint = () => {
    const q = inp.value.trim().toLowerCase();
    hits = Object.entries(C).filter(([key, c]) => !key.startsWith('__')).filter(([key, c]) => !q || c.name.toLowerCase().includes(q) || c.nick.toLowerCase().includes(q) || key.includes(q)).slice(0, 9);
    k = 0; list.innerHTML = hits.map(([key, c], i) => `<div data-k="${key}" class="${i === 0 ? 'on' : ''}">${c.name}<small>${CAT_TR[c.cat]}</small></div>`).join('');
  };
  const pickIt = key => { const n = addNode(key, at[0], at[1]); buildNode(n); closeSearch(); sel.clear(); sel.add(n.id); schedule(); };
  inp.addEventListener('input', paint);
  inp.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter' && hits[k]) pickIt(hits[k][0]);
    if (e.key === 'Escape') closeSearch();
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { k = (k + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length; [...list.children].forEach((d, i) => d.classList.toggle('on', i === k)); e.preventDefault(); }
  });
  list.addEventListener('pointerdown', e => { const d = e.target.closest('[data-k]'); if (d) { e.preventDefault(); pickIt(d.dataset.k); } });
  paint(); setTimeout(() => inp.focus(), 0);
}
function closeSearch() { if (searchEl) { searchEl.remove(); searchEl = null; } }

/* ---- context menus ---- */
let ctxEl = null;
function closeCtx() { if (ctxEl) { ctxEl.remove(); ctxEl = null; } }
function placeCtx(cx, cy, html) {
  closeCtx(); closeSearch(); const r = editor.getBoundingClientRect();
  ctxEl = document.createElement('div'); ctxEl.className = 'ctx'; ctxEl.innerHTML = html; editor.appendChild(ctxEl);
  ctxEl.style.left = Math.max(4, Math.min(cx - r.left, r.width - ctxEl.offsetWidth - 4)) + 'px'; ctxEl.style.top = Math.max(4, Math.min(cy - r.top, r.height - ctxEl.offsetHeight - 4)) + 'px';
  ctxEl.addEventListener('pointerdown', e => e.stopPropagation());
}
function openCtx(cx, cy, n) {
  const c = C[n.type], ui = PILLS.includes(c.ui);
  placeCtx(cx, cy, `<button data-a="pv">Önizleme<small>${n.pv ? 'açık' : 'kapalı'} · Ctrl+Q</small></button><button data-a="off">${n.off ? 'Etkinleştir' : 'Devre dışı bırak'}<small>Ctrl+E</small></button><button data-a="ren">Yeniden adlandır</button>${c.ui === 'slider' ? '<button data-a="rng">Slider aralığı…</button><button data-a="anim">Animasyon ▶<small>min → max, 6 sn</small></button><button data-a="animv">Animasyon + video</button>' : ''}<hr><button data-a="copy">Kopyala<small>Ctrl+C</small></button><button data-a="dup">Çoğalt<small>Ctrl+D</small></button><button data-a="grp">Grupla<small>Ctrl+G</small></button>${sel.size > 1 ? '<button data-a="clu">Cluster yap<small>seçilenleri tek bileşene topla</small></button>' : ''}${n.type.startsWith('cl_') ? '<button data-a="unclu">Cluster\'ı aç</button><button data-a="lib">Kütüphaneye kaydet</button>' : ''}<hr><button data-a="del">Sil<small>Delete</small></button>`);
  void ui;
  ctxEl.addEventListener('click', e => {
    const a = (e.target.closest('[data-a]') || {}).dataset; if (!a) return; closeCtx();
    const targets = sel.size ? [...sel].map(byId).filter(Boolean) : [n];
    if (a.a === 'pv') { const v = !n.pv; targets.forEach(m => m.pv = v); schedule(); }
    else if (a.a === 'off') { const v = !n.off; targets.forEach(m => m.off = v); schedule(); }
    else if (a.a === 'ren') rename(n);
    else if (a.a === 'rng') sliderRange(n);
    else if (a.a === 'copy') copySel();
    else if (a.a === 'dup') { copySel(true); paste(30, 30); }
    else if (a.a === 'grp') groupSel();
    else if (a.a === 'clu') makeCluster();
    else if (a.a === 'unclu') explodeCluster(n);
    else if (a.a === 'lib') libSave(n);
    else if (a.a === 'anim') animateSlider(n, false);
    else if (a.a === 'animv') animateSlider(n, true);
    else if (a.a === 'del') deleteSel();
  });
}
function openGroupCtx(cx, cy, gi) {
  placeCtx(cx, cy, `<button data-a="ren">Grubu adlandır</button><div class="sw">${GCOLS.map(c => `<span data-c="${c}" style="background:${c}"></span>`).join('')}</div><hr><button data-a="sel">Üyeleri seç</button><button data-a="ung">Grubu çöz</button>`);
  ctxEl.addEventListener('click', e => {
    const g = doc.groups[gi]; if (!g) return closeCtx();
    const sw = e.target.closest('[data-c]'); if (sw) { g.color = sw.dataset.c; closeCtx(); schedule(); return; }
    const a = (e.target.closest('[data-a]') || {}).dataset; if (!a) return; closeCtx();
    if (a.a === 'ren') renameGroup(gi); else if (a.a === 'sel') { sel = new Set(g.ids); paintSel(); } else if (a.a === 'ung') { doc.groups.splice(gi, 1); schedule(); }
  });
}
function rename(n) {
  const c = C[n.type], cur = c.ui && n.st.label !== undefined ? n.st.label : nickOf(n);
  const v = prompt('Yeni ad:', cur); if (v == null) return;
  if (c.ui && n.st.label !== undefined) n.st.label = v.trim() || cur; else n.nick = v.trim() || undefined;
  els[n.id].remove(); delete els[n.id]; buildNode(n); schedule();
}
function sliderRange(n) {
  const v = prompt('Min; Max; Tamsayı mı (e/h) — ör. 0; 10; h', `${n.st.min}; ${n.st.max}; ${n.st.int ? 'e' : 'h'}`); if (v == null) return;
  const [a, b, i] = v.split(';').map(s => s.trim()); const mn = parseFloat((a || '').replace(',', '.')), mx = parseFloat((b || '').replace(',', '.'));
  if (isFinite(mn) && isFinite(mx) && mx > mn) { n.st.min = mn; n.st.max = mx; n.st.int = /^(e|evet|y|yes|1|true)/i.test(i || ''); n.st.val = Math.min(mx, Math.max(mn, n.st.int ? Math.round(n.st.val) : n.st.val)); els[n.id].remove(); delete els[n.id]; buildNode(n); schedule(); }
  else toast('Geçersiz aralık');
}
function renameGroup(gi) { const g = doc.groups[gi]; if (!g) return; const v = prompt('Grup adı:', g.name || 'Grup'); if (v == null) return; g.name = v.trim() || 'Grup'; schedule(); }
function groupSel() { if (!sel.size) { toast('Gruplamak için bileşen seç'); return; } const ids = [...sel]; doc.groups.forEach(g => g.ids = g.ids.filter(i => !sel.has(i))); doc.groups = doc.groups.filter(g => g.ids.length); doc.groups.push({ ids, name: 'Grup', color: GCOLS[doc.groups.length % GCOLS.length] }); schedule(); }
document.addEventListener('pointerdown', e => { if (!e.target.closest('.ctx')) closeCtx(); if (!e.target.closest('.dd')) closeMenus(); }, true);

/* ---- ribbon ---- */
let curCat = 'Params';
function paintRibbon() {
  $('tabs').innerHTML = CATS.map(c => `<button type="button" class="${c === curCat ? 'on' : ''}" data-c="${c}">${CAT_TR[c]}</button>`).join('');
  $('tools').innerHTML = Object.entries(C).filter(([, c]) => c.cat === curCat).map(([k, c]) => `<button type="button" data-k="${k}" title="${c.name}"><i>${c.nick}</i>${c.name}</button>`).join('');
  if (curCat === 'Lib') libPaint();
}
$('tabs').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { curCat = b.dataset.c; paintRibbon(); } });
$('tools').addEventListener('click', e => {
  const lb = e.target.closest('[data-lib]'); if (lb) { libInsert(lb.dataset.lib); return; } const lx = e.target.closest('[data-libx]'); if (lx) { libAction(lx.dataset.libx); return; }
  const b = e.target.closest('[data-k]'); if (!b) return;
  const r = editor.getBoundingClientRect(), at = toWorld(r.left + r.width * 0.4 + Math.random() * 40, r.top + r.height * 0.4 + Math.random() * 40);
  const n = addNode(b.dataset.k, at[0], at[1]); buildNode(n); sel.clear(); sel.add(n.id); schedule();
});

/* ---- delete / new / copy-paste ---- */
function deleteSel() {
  if (!sel.size) { toast('Silmek için bir bileşen seç'); return; }
  doc.nodes = doc.nodes.filter(n => !sel.has(n.id)); doc.wires = doc.wires.filter(w => !sel.has(w.a) && !sel.has(w.b));
  doc.groups.forEach(g => g.ids = g.ids.filter(i => !sel.has(i))); doc.groups = doc.groups.filter(g => g.ids.length);
  sel.forEach(id => { els[id] && els[id].remove(); delete els[id]; }); sel.clear(); schedule();
}
$('delBtn').addEventListener('click', deleteSel);
let clip = null, pasteN = 0;
function copySel(quiet) {
  if (!sel.size) { toast('Kopyalamak için bileşen seç'); return; }
  clip = { nodes: doc.nodes.filter(n => sel.has(n.id)).map(n => JSON.parse(JSON.stringify(n))), wires: doc.wires.filter(w => sel.has(w.a) && sel.has(w.b)).map(w => ({ ...w })) }; pasteN = 0;
  try { localStorage.setItem('mini-gh-clip', JSON.stringify(clip)); } catch (e) {}
  if (!quiet) toast(`${clip.nodes.length} bileşen kopyalandı`);
}
function paste(dx, dy) {
  let c = clip; try { const s = JSON.parse(localStorage.getItem('mini-gh-clip')); if (s && s.nodes) c = s; } catch (e) {}
  if (!c || !c.nodes.length) { toast('Pano boş'); return; }
  pasteN++; const off = (dx ?? 40) * pasteN, offy = (dy ?? 40) * pasteN, map = {}; sel.clear();
  for (const n of c.nodes) { if (!C[n.type]) continue; const m = { ...JSON.parse(JSON.stringify(n)), id: uid++, x: n.x + off, y: n.y + offy }; map[n.id] = m.id; doc.nodes.push(m); buildNode(m); sel.add(m.id); }
  for (const w of c.wires) if (map[w.a] && map[w.b]) doc.wires.push({ a: map[w.a], ao: w.ao, b: map[w.b], bi: w.bi });
  paintSel(); schedule();
}
$('newBtn').addEventListener('click', () => { doc = { nodes: [], wires: [], groups: [] }; sel.clear(); view = { x: 40, y: 30, s: 1 }; applyView(); rebuildAll(); schedule(); toast('Boş tuval · çift tıklayıp bileşen ekle'); });
function fitEditor() {
  if (!doc.nodes.length) return;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  doc.nodes.forEach(n => { const el = els[n.id]; const w = el ? el.offsetWidth : 120, h = el ? el.offsetHeight : 40; x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y - 22); x1 = Math.max(x1, n.x + w); y1 = Math.max(y1, n.y + h + 14); });
  const W = editor.clientWidth, H = editor.clientHeight, pad = 24;
  const s = Math.max(0.2, Math.min(1, (W - pad * 2) / (x1 - x0), (H - pad * 2) / (y1 - y0)));
  view = { s, x: pad - x0 * s + Math.max(0, (W - pad * 2 - (x1 - x0) * s) / 2), y: pad - y0 * s }; applyView(); drawWires();
}
$('fitBtn').addEventListener('click', fitEditor);
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 1900); }

/* ---- undo / redo ---- */
let H = [], hi = -1, recT = 0, restoring = false;
const snap = () => JSON.stringify({ doc, uid });
function record() { clearTimeout(recT); const s = snap(); if (H[hi] === s) return; H = H.slice(0, hi + 1); H.push(s); if (H.length > 150) H.shift(); hi = H.length - 1; paintUndo(); }
function recordSoon() { clearTimeout(recT); recT = setTimeout(record, 400); }
function restoreSnap(s) { const o = JSON.parse(s); doc = o.doc; uid = o.uid; normDoc(); sel.clear(); restoring = true; rebuildAll(); schedule(); }
function undo() { record(); if (hi <= 0) { toast('Geri alınacak adım yok'); return; } hi--; restoreSnap(H[hi]); paintUndo(); }
function redo() { if (hi >= H.length - 1) { toast('Yinelenecek adım yok'); return; } hi++; restoreSnap(H[hi]); paintUndo(); }
function paintUndo() { $('undoBtn').disabled = hi <= 0 && !recT; $('redoBtn').disabled = hi >= H.length - 1; }
$('undoBtn').addEventListener('click', undo); $('redoBtn').addEventListener('click', redo);

/* ---- keyboard ---- */
addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input, select, textarea, [contenteditable="true"]')) return;
  const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (mod && k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
  if (mod && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
  if (mod && k === 'c') { e.preventDefault(); copySel(); return; }
  if (mod && k === 'v') { e.preventDefault(); paste(); return; }
  if (mod && k === 'd') { e.preventDefault(); copySel(true); paste(30, 30); return; }
  if (mod && k === 'a') { e.preventDefault(); sel = new Set(doc.nodes.map(n => n.id)); paintSel(); return; }
  if (mod && k === 'g') { e.preventDefault(); if (e.shiftKey) { doc.groups = doc.groups.filter(g => !g.ids.some(i => sel.has(i))); schedule(); } else groupSel(); return; }
  if (mod && k === 'q') { e.preventDefault(); const t = [...sel].map(byId); if (t.length) { const v = !t[0].pv; t.forEach(m => m.pv = v); schedule(); } return; }
  if (mod && k === 'e') { e.preventDefault(); const t = [...sel].map(byId); if (t.length) { const v = !t[0].off; t.forEach(m => m.off = v); schedule(); } return; }
  if (mod && k === 's') { e.preventDefault(); saveFile(); return; }
  if (mod && k === 'o') { e.preventDefault(); $('fileIn').click(); return; }
  if (mod) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { deleteSel(); e.preventDefault(); }
  else if (k === 'z') zoomExtents();
  else if (k === 'f') fitEditor();
  else if (e.key === 'Escape') { closeSearch(); closeCtx(); closeMenus(); }
});

/* ---- files ---- */
function download(name, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
const stamp = () => { const d = new Date(), p = v => String(v).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };
function saveFile() { download(`tanim-${stamp()}.mgh`, new Blob([JSON.stringify({ format: 'mini-grasshopper', version: 3, doc, uid, view }, null, 1)], { type: 'application/json' })); toast('Tanım dosyaya kaydedildi'); }
$('saveBtn').addEventListener('click', saveFile);
$('openBtn').addEventListener('click', () => $('fileIn').click());
$('fileIn').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (/\.ghx$/i.test(f.name)) { try { importGHX(await f.text()); } catch (x) { toast(x.message || 'GHX okunamadı'); } return; }
  try { const o = JSON.parse(await f.text()); if (!o.doc || !Array.isArray(o.doc.nodes)) throw 0; record(); doc = o.doc; uid = o.uid || (Math.max(0, ...doc.nodes.map(n => n.id)) + 1); normDoc(); view = o.view || view; sel.clear(); applyView(); rebuildAll(); solve(); doc.nodes.forEach(refreshNode); fitEditor(); rebuildPreview(); zoomExtents(); schedule(); toast(`${f.name} açıldı`); }
  catch (x) { toast('Dosya okunamadı (Mini Grasshopper .mgh bekleniyor)'); }
});
function closeMenus() { $('exMenu').hidden = true; $('expMenu').hidden = true; $('help').hidden = true; }
$('exBtn').addEventListener('click', () => { const h = !$('exMenu').hidden; closeMenus(); $('exMenu').hidden = h; });
$('expBtn').addEventListener('click', () => { const h = !$('expMenu').hidden; closeMenus(); $('expMenu').hidden = h; });
$('helpBtn').addEventListener('click', () => { const h = !$('help').hidden; closeMenus(); $('help').hidden = h; });
$('exMenu').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) { closeMenus(); record(); preset(b.dataset.p); } });
$('expMenu').addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (b) { closeMenus(); (EXP[b.dataset.x] || exportGeo)(b.dataset.x); } });

/* ---- export ---- */
function collectGeo() {
  const out = [];
  for (const n of doc.nodes) {
    if (!n.pv || n.off) continue;
    const layer = (nickOf(n) + '_' + n.id).replace(/[^A-Za-z0-9_-]/g, '_');
    if (n.type === 'cprev') { const cp = info[n.id] && info[n.id].cp; if (cp) cp.G.forEach((g, i) => { if (g.t !== 'pln') out.push({ g, layer, col: cp.cols[i] || '#c47a2c', type: 'cprev', name: nickOf(n) }); }); continue; }
    for (const t of cache[n.id] || []) for (const b of t) for (const g of b.v) if (isGeo(g) && g.t !== 'pln') out.push({ g, layer, col: '#9e2a2a', type: n.type, name: nickOf(n) });
  }
  return out;
}
function faces(g) { const F = []; if (g.t === 'srf') { const G = g.g; for (let j = 0; j < G.length - 1; j++) for (let i = 0; i < G[0].length - 1; i++) F.push([G[j][i], G[j][i + 1], G[j + 1][i + 1], G[j + 1][i]]); } else if (g.t === 'mesh') for (const f of g.f) F.push(f.map(i => g.v[i])); return F; }
function exportGeo(kind) {
  const items = collectGeo(); if (!items.length) { toast('Dışa aktarılacak görünür geometri yok'); return; }
  const f = v => (+v).toFixed(6).replace(/\.?0+$/, '') || '0';
  let txt, name = `mini-gh-${stamp()}.${kind}`, nF = 0, nC = 0;
  if (kind === 'obj') {
    const L = ['# Mini Grasshopper 3D · erdevelop', 'o geometry']; let vi = 1;
    let curLayer = null;
    for (const { g, layer } of items) {
      if (layer !== curLayer) { L.push('g ' + layer); curLayer = layer; }
      if (g.t === 'pt') { L.push(`v ${f(g.x)} ${f(g.y)} ${f(g.z)}`, `p ${vi++}`); }
      else if (g.t === 'crv') { const q = crvPoly(g); q.forEach(p => L.push(`v ${f(p[0])} ${f(p[1])} ${f(p[2])}`)); L.push('l ' + q.map((_, i) => vi + i).join(' ')); vi += q.length; nC++; }
      else if (g.t === 'srf') { const G = g.g, R = G.length, Cn = G[0].length; G.forEach(r => r.forEach(p => L.push(`v ${f(p[0])} ${f(p[1])} ${f(p[2])}`))); for (let j = 0; j < R - 1; j++) for (let i = 0; i < Cn - 1; i++) { const a = vi + j * Cn + i; L.push(`f ${a} ${a + 1} ${a + Cn + 1} ${a + Cn}`); nF++; } vi += R * Cn; }
      else if (g.t === 'mesh') { g.v.forEach(p => L.push(`v ${f(p[0])} ${f(p[1])} ${f(p[2])}`)); g.f.forEach(fc => { L.push('f ' + fc.map(i => vi + i).join(' ')); nF++; }); vi += g.v.length; }
    }
    txt = L.join('\n');
  } else if (kind === 'stl') {
    const L = ['solid minigh'];
    for (const { g } of items) for (const t of triangles(g)) { const n = vnorm(vcross(vsub(t[1], t[0]), vsub(t[2], t[0]))); L.push(`facet normal ${f(n[0])} ${f(n[1])} ${f(n[2])}`, 'outer loop', ...t.map(p => `vertex ${f(p[0])} ${f(p[1])} ${f(p[2])}`), 'endloop', 'endfacet'); nF++; }
    L.push('endsolid minigh'); txt = L.join('\n');
    if (!nF) { toast('STL için yüzey/mesh yok'); return; }
  } else {
    const L = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES'];
    for (const { g, layer } of items) {
      if (g.t === 'pt') L.push('0', 'POINT', '8', layer, '10', f(g.x), '20', f(g.y), '30', f(g.z));
      else if (g.t === 'crv') { L.push('0', 'POLYLINE', '8', layer, '66', '1', '70', String(8 | (g.c ? 1 : 0)), '10', '0', '20', '0', '30', '0'); g.p.forEach(p => L.push('0', 'VERTEX', '8', layer, '10', f(p[0]), '20', f(p[1]), '30', f(p[2]), '70', '32')); L.push('0', 'SEQEND', '8', layer); nC++; }
      else if (g.t === 'tag') L.push('0', 'TEXT', '8', layer, '10', f(g.p[0]), '20', f(g.p[1]), '30', f(g.p[2]), '40', f(g.h), '1', g.s.replace(/[ğĞıİşŞçÇöÖüÜ]/g, ch => ({ ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ş: 's', Ş: 'S', ç: 'c', Ç: 'C', ö: 'o', Ö: 'O', ü: 'u', Ü: 'U' })[ch]).replace(/[^\x20-\x7e]/g, '?'));
      else for (const fc of faces(g)) { const q = fc.length === 3 ? [...fc, fc[2]] : fc.slice(0, 4); L.push('0', '3DFACE', '8', layer); q.forEach((p, i) => L.push(String(10 + i), f(p[0]), String(20 + i), f(p[1]), String(30 + i), f(p[2]))); nF++; }
    }
    L.push('0', 'ENDSEC', '0', 'EOF'); txt = L.join('\r\n');
  }
  download(name, new Blob([txt], { type: 'text/plain' }));
  toast(`${name} · ${nF} yüz${nC ? ', ' + nC + ' eğri' : ''}`);
}


/* ---- v4: action panels (panel data, unroll, profiles, glass), optimizer ---- */
function recGrid(p, sx, sy, ex, ey) {
  const F = asPln(p, 'P'); ex = Math.round(num(ex, 'Ex')); ey = Math.round(num(ey, 'Ey')); if (ex < 1 || ey < 1 || ex * ey > 20000) throw new Error('Ex×Ey 1–20000');
  const Cc = [], Pc = [];
  for (let i = 0; i <= ex; i++) { const pc = []; for (let j = 0; j <= ey; j++) pc.push(P(...onPln(F, i * sx, j * sy))); Pc.push(pc); }
  for (let i = 0; i < ex; i++) { const cc = []; for (let j = 0; j < ey; j++) cc.push({ t: 'crv', c: true, p: [onPln(F, i * sx, j * sy), onPln(F, (i + 1) * sx, j * sy), onPln(F, (i + 1) * sx, (j + 1) * sy), onPln(F, i * sx, (j + 1) * sy)] }); Cc.push(cc); }
  return [gridBranches(Cc), gridBranches(Pc)];
}
function vlistItems(st) {
  return String(st.items).split(/;|\n/).map(s => s.trim()).filter(Boolean).map(s => { const m = s.match(/^(.*?)=(.*)$/), name = (m ? m[1] : s).trim(), raw = (m ? m[2] : s).trim();
    const v = /^-?\d+([.,]\d+)?$/.test(raw) ? parseFloat(raw.replace(',', '.')) : /^(true|false)$/i.test(raw) ? /^true$/i.test(raw) : raw; return { name: name || raw, v }; });
}
const ACT = {
  paneldata: { title: 'panel verisi', btns: [['CSV', n => pdataCSV(n)], ['Levha →', n => sendOpti(n)], ['Cam →', n => sendCam(n)]] },
  unroll: { title: 'açınım', btns: [['CSV', n => pdataCSV(n)], ['Levha →', n => sendOpti(n)]] },
  mullion: { title: 'dikme · kayıt', btns: [['CSV', n => mullCSV(n)], ['Profil →', n => sendProfil(n)]] },
  glassw: { title: 'cam ağırlığı', mix: true, btns: [['Cam Ağırlığı →', n => sendCam(n)]] }
};
const mmOf = n => UNITS[n.st.unit] || 1000;
function rectGroups(n) {
  const rows = (info[n.id] && info[n.id].pdata) || (info[n.id] && info[n.id].gdata && info[n.id].gdata.rows) || [], k = mmOf(n), m = new Map();
  for (const r of rows) { let w = Math.round(r.w * k), h = Math.round(r.h * k); if (w < h) [w, h] = [h, w]; const key = w + 'x' + h; m.set(key, { w, h, n: (m.get(key)?.n || 0) + 1 }); }
  return [...m.values()].sort((a, b) => b.w * b.h - a.w * a.h);
}
function pdataCSV(n) {
  const rows = info[n.id] && info[n.id].pdata; if (!rows || !rows.length) { toast('Panel yok'); return; }
  const u = n.st.unit, dec = v => (+v).toFixed(4).replace('.', ',');
  const out = [['Panel', `Genişlik (${u})`, `Yükseklik (${u})`, `Alan (${u}²)`, `Çevre (${u})`]].concat(rows.map(r => [r.name, dec(r.w), dec(r.h), dec(r.a), dec(r.per ?? 0)]));
  download(`panel-verisi-${stamp()}.csv`, new Blob(['﻿' + out.map(r => r.join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
}
function mullCSV(n) {
  const rows = info[n.id] && info[n.id].mrows; if (!rows || !rows.length) { toast('Profil yok'); return; }
  download(`profil-listesi-${stamp()}.csv`, new Blob(['﻿' + [['Tür', 'Boy (mm)', 'Adet']].concat(rows.map(r => [r.kind, r.len, r.n])).map(r => r.join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
}
function sendOpti(n) {
  const g = rectGroups(n); if (!g.length) { toast('Panel yok'); return; }
  try { localStorage.setItem('erdevelop-opti-import', JSON.stringify({ src: 'Mini Grasshopper · ' + nickOf(n), rows: g.map((r, i) => ({ code: 'G' + String(i + 1).padStart(2, '0'), w: r.w, h: r.h, n: r.n })) })); } catch (e) {}
  window.open('Opti.html?import=dxf', '_blank');
}
function sendCam(n) {
  const g = rectGroups(n).slice(0, 200); if (!g.length) { toast('Panel yok'); return; }
  window.open(`cam-agirlik.html?list=${encodeURIComponent(g.map(r => `${r.w}x${r.h}x${r.n}`).join(','))}&src=${encodeURIComponent('Mini Grasshopper')}${n.st.mix ? '&mix=' + encodeURIComponent(n.st.mix) : ''}`, '_blank');
}
function sendProfil(n) {
  const rows = info[n.id] && info[n.id].mrows; if (!rows || !rows.length) { toast('Profil yok'); return; }
  const cnt = {}; const out = rows.map(r => { cnt[r.kind] = (cnt[r.kind] || 0) + 1; return { prof: r.kind, code: (r.kind === 'Dikme' ? 'D' : 'K') + cnt[r.kind], len: r.len, qty: r.n }; });
  try { localStorage.setItem('erdevelop-profil-import', JSON.stringify({ src: 'Mini Grasshopper', rows: out })); } catch (e) {}
  window.open('Profil.html?import=gh', '_blank');
}
function actTable(n) {
  const t2 = actTable2(n); if (t2 !== null) return t2;
  const inf = info[n.id] || {}, u = n.st.unit, f3 = v => (+v).toFixed(3);
  if (n.type === 'mullion') { const r = inf.mrows || []; if (!r.length) return '<tr><td>(profil yok)</td></tr>'; const tot = r.reduce((s, x) => s + x.len * x.n, 0) / 1000;
    return `<tr><th>Tür</th><th>Boy mm</th><th>Adet</th></tr>${r.slice(0, 14).map(x => `<tr><td>${x.kind}</td><td>${x.len}</td><td>${x.n}</td></tr>`).join('')}${r.length > 14 ? `<tr><td colspan="3">… +${r.length - 14}</td></tr>` : ''}<tr><th>Toplam</th><th>${tot.toFixed(1)} m</th><th>${r.reduce((s, x) => s + x.n, 0)}</th></tr>`; }
  if (n.type === 'glassw') { const g = inf.gdata; if (!g) return '<tr><td>(panel yok)</td></tr>'; const k = mmOf(n) / 1000, A = g.rows.reduce((s, r) => s + r.a, 0) * k * k, T = g.W.reduce((a, b) => a + b, 0), mx = Math.max(...g.W, 0);
    return `<tr><th>kg/m²</th><th>${g.kgm.toFixed(2)}</th></tr><tr><td>Panel</td><td>${g.rows.length}</td></tr><tr><td>Alan m²</td><td>${A.toFixed(2)}</td></tr><tr><td>En ağır kg</td><td>${mx.toFixed(1)}</td></tr><tr><th>Toplam kg</th><th>${T.toFixed(1)}</th></tr>`; }
  const r = inf.pdata || []; if (!r.length) return '<tr><td>(panel yok)</td></tr>';
  const A = r.reduce((s, x) => s + x.a, 0);
  return `<tr><th>Panel</th><th>G ${u}</th><th>Y ${u}</th><th>${u}²</th></tr>${r.slice(0, 12).map(x => `<tr><td>${esc(x.name)}</td><td>${f3(x.w)}</td><td>${f3(x.h)}</td><td>${f3(x.a)}</td></tr>`).join('')}${r.length > 12 ? `<tr><td colspan="4">… +${r.length - 12} panel</td></tr>` : ''}<tr><th>Toplam</th><th colspan="2">${r.length} panel · ${rectGroups(n).length} tip</th><th>${f3(A)}</th></tr>`;
}

/* ---- optimizer ---- */
let OPT = null;
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
function paintOpt(n) {
  const el = els[n.id]; if (!el) return; const box = el.querySelector('.optl'), stEl = el.querySelector('.ost'), go = el.querySelector('.ogo'), cv = el.querySelector('.osp');
  if (box) { const sl = doc.nodes.filter(x => x.type === 'slider'); box.innerHTML = sl.length ? sl.map(s => `<label><input type="checkbox" data-sid="${s.id}" ${n.st.ids.includes(s.id) ? 'checked' : ''}>${esc(s.st.label)} <small>${fmt(s.st.min)}–${fmt(s.st.max)}</small></label>`).join('') : '<small>tanımda slider yok</small>'; }
  if (go) go.textContent = OPT && OPT.n === n ? 'Durdur' : 'Başlat';
  if (stEl) stEl.textContent = OPT && OPT.n === n ? `nesil ${OPT.gen + 1}/${n.st.gens} · deneme ${OPT.evals} · en iyi ${OPT.best ? fmt(OPT.sign * OPT.best.f) : '…'}` : n.st.best ? `en iyi: ${fmt(n.st.best.f)}` : 'F girişine hedef değeri bağla, slider seç';
  if (cv) { const x = cv.getContext('2d'), H = n.st.hist || [], W = cv.width, Hh = cv.height; x.clearRect(0, 0, W, Hh); if (H.length > 1) { const lo = Math.min(...H), hi = Math.max(...H); x.strokeStyle = '#3a7d2c'; x.lineWidth = 2; x.beginPath(); H.forEach((v, i) => { const px = i / (H.length - 1) * (W - 4) + 2, py = Hh - 3 - (hi > lo ? (v - lo) / (hi - lo) : 0.5) * (Hh - 6); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); } }
}
function runOptim(n) {
  if (OPT) { OPT.stop = true; return; }
  const sl = n.st.ids.map(byId).filter(x => x && x.type === 'slider'), wire = doc.wires.find(w => w.b === n.id && w.bi === 0);
  if (!sl.length) { toast('Değiştirilecek slider seç'); return; } if (!wire) { toast('F girişine hedef değeri bağla'); return; }
  record();
  const pop = Math.max(4, Math.min(100, Math.round(n.st.pop))), gens = Math.max(1, Math.min(500, Math.round(n.st.gens))), sign = n.st.goal === 'max' ? -1 : 1;
  const setG = g => sl.forEach((s, i) => { let v = s.st.min + (s.st.max - s.st.min) * g[i]; s.st.val = s.st.int ? Math.round(v) : +v.toFixed(4); });
  const fit = () => { const v = flat((cache[wire.a] || [])[wire.ao]).find(x => typeof x === 'number' && isFinite(x)); return v === undefined ? Infinity : sign * v; };
  const cur = sl.map(s => (s.st.val - s.st.min) / ((s.st.max - s.st.min) || 1));
  let Pp = [cur, ...Array.from({ length: pop - 1 }, () => sl.map(() => Math.random()))].map(g => ({ g, f: NaN })), idx = 0;
  OPT = { n, stop: false, gen: 0, best: null, evals: 0, sign }; n.st.hist = [];
  const finish = () => { const b = OPT.best; if (b) { setG(b.g); n.st.best = { f: sign * b.f, vals: sl.map(s => ({ id: s.id, v: s.st.val })) }; } OPT = null; rebuildAll(); schedule(); record(); toast(b ? `Optimizasyon bitti · en iyi ${fmt(sign * b.f)}` : 'Durduruldu'); };
  const step = () => {
    if (OPT.stop) return finish();
    const t0 = performance.now();
    while (performance.now() - t0 < 40) {
      if (idx < Pp.length) { const ind = Pp[idx++]; setG(ind.g); solve(); ind.f = fit(); OPT.evals++; if (!OPT.best || ind.f < OPT.best.f) OPT.best = { g: ind.g.slice(), f: ind.f }; continue; }
      Pp.sort((a, b) => a.f - b.f); n.st.hist.push(sign * Pp[0].f); OPT.gen++;
      if (OPT.gen >= gens) return finish();
      const elite = Pp.slice(0, Math.max(2, Math.round(pop * 0.25))), sig = 0.25 * Math.pow(0.88, OPT.gen), kids = elite.map(e => ({ g: e.g, f: e.f }));
      while (kids.length < pop) { const a = elite[Math.floor(Math.random() * elite.length)], b = elite[Math.floor(Math.random() * elite.length)]; kids.push({ g: a.g.map((x, i) => { let y = Math.random() < 0.5 ? x : b.g[i]; if (Math.random() < 0.6) y += gauss() * sig; return Math.min(1, Math.max(0, y)); }), f: NaN }); }
      Pp = kids; idx = elite.length;
    }
    paintOpt(n); setTimeout(step, 0);
  };
  paintOpt(n); setTimeout(step, 0);
}
function applyOptBest(n) { const b = n.st.best; if (!b || !b.vals) { toast('Henüz sonuç yok'); return; } record(); b.vals.forEach(({ id, v }) => { const s = byId(id); if (s) s.st.val = v; }); rebuildAll(); schedule(); }

/* ---- text tags in the viewport ---- */
const tagTex = new Map();
function tagSprite(s, h, col) {
  const key = s + '|' + col; let e = tagTex.get(key);
  if (!e) { const c = document.createElement('canvas'), x = c.getContext('2d'), fs = 64; x.font = `600 ${fs}px Arial, sans-serif`; const w = Math.ceil(x.measureText(s).width) + 20; c.width = w; c.height = fs + 22; x.font = `600 ${fs}px Arial, sans-serif`; x.textBaseline = 'middle'; x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 12; x.strokeStyle = 'rgba(255,255,255,.85)'; x.strokeText(s, w / 2, c.height / 2); x.fillStyle = col; x.fillText(s, w / 2, c.height / 2);
    const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; e = { mat: new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }), asp: w / c.height }; if (tagTex.size > 4000) tagTex.clear(); tagTex.set(key, e); }
  const sp = new THREE.Sprite(e.mat); sp.scale.set(h * e.asp, h, 1); sp.renderOrder = 10; return sp;
}

/* ---- schedule CSV ---- */
function scheduleCSV(n) {
  const s = info[n.id] && info[n.id].sched; if (!s || !s.rows.length) { toast('Panel listesi boş'); return; }
  const dec = v => v.toFixed(4).replace('.', ',');
  const rows = [['Tip', 'Adet', 'Genişlik', 'Yükseklik', 'Kenar 1', 'Kenar 2', 'Kenar 3', 'Kenar 4', 'Köşegen 1', 'Köşegen 2', 'Alan (tek)', 'Alan (toplam)']].concat(s.rows.map(r => [r.name, r.n, dec(r.w), dec(r.h), ...r.e.map(dec), ...r.dg.map(dec), dec(r.area), dec(r.area * r.n)]));
  download(`panel-listesi-${stamp()}.csv`, new Blob(['﻿' + rows.map(r => r.join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
}
