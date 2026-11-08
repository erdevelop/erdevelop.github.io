/* araçlar: cluster, kumanda, kütüphane, görünüm, GHX, sunum */
'use strict';
/* ================= v6 UI ================= */
Object.assign(ACT, {
  pantypes: { title: 'tip azaltma', btns: [['CSV', n => { const t = info[n.id] && info[n.id].ptypes; if (!t) { toast('Panel yok'); return; } simpleCSV(n, 'panel-tipleri', ['Tip', 'Adet', 'En büyük sapma'], t.rows.map(r => [r.name, r.n, r.dev.toFixed(5).replace('.', ',')])); }]] },
  tqty: { title: 'teklif metrajı', btns: [['Teklif →', n => sendTeklif(n)]] },
  phexport: { title: 'proje hattı', btns: [['Proje Hattı →', n => sendPH(n)]] }
});
function actTable3(n) {
  const inf = info[n.id] || {}, f2 = v => v.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  if (n.type === 'pantypes') { const t = inf.ptypes; if (!t) return '<tr><td>(panel yok)</td></tr>'; return `<tr><th>Önce</th><th>${t.before} tip</th></tr><tr><th>Sonra</th><th style="color:#3a7d2c">${t.after} tip</th></tr><tr><td>En büyük sapma</td><td>${fmt(t.maxDev)}</td></tr>${t.rows.slice(0, 10).map((r, i) => `<tr><td><i style="background:${TYPE_COL[i % TYPE_COL.length]}"></i>${esc(r.name)}</td><td>${r.n}</td></tr>`).join('')}${t.rows.length > 10 ? `<tr><td colspan="2">… +${t.rows.length - 10} tip</td></tr>` : ''}`; }
  if (n.type === 'tqty') { const q = inf.tq; if (!q) return '<tr><td>(panel yok)</td></tr>'; return [['Cephe', q.cepheM2, 'm²'], ['Cam', q.camM2, 'm²'], ['Spandrel', q.spandrelM2, 'm²'], ['Profil', q.profilM, 'm'], ['Profil', q.profilKg, 'kg'], ['Conta', q.contaM, 'm'], ['Ankraj', q.ankraj, 'adet']].map(([a, v, u]) => `<tr><td>${a}</td><td>${f2(v)} ${u}</td></tr>`).join(''); }
  if (n.type === 'phexport') { const p = inf.ph; if (!p) return '<tr><td>(panel yok)</td></tr>'; return `<tr><th colspan="3">${esc(p.name)}</th></tr><tr><th>Grup</th><th>Panel</th><th>m²</th></tr>${p.rows.slice(0, 12).map(r => `<tr><td>${esc(r.name)}</td><td>${r.n}</td><td>${f2(r.a)}</td></tr>`).join('')}${p.rows.length > 12 ? `<tr><td colspan="3">… +${p.rows.length - 12}</td></tr>` : ''}`; }
  return null;
}
function sendTeklif(n) { const q = info[n.id] && info[n.id].tq; if (!q || !q.panel) { toast('Panel yok'); return; } try { localStorage.setItem('erdevelop-teklif-import', JSON.stringify({ src: 'Mini Grasshopper', q })); } catch (e) {} window.open('teklif/?import=gh', '_blank'); }
function sendPH(n) { const p = info[n.id] && info[n.id].ph; if (!p || !p.rows.length) { toast('Panel yok'); return; } const f2 = v => v.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
  try { localStorage.setItem('erdevelop-ph-import', JSON.stringify({ src: 'Mini Grasshopper', name: p.name, parsiyels: p.rows.map(r => r.name), notes: p.rows.map(r => ({ grup: r.name, text: `Mini Grasshopper: ${r.n} panel · ${f2(r.a)} m² cam` })) })); } catch (e) {}
  window.open('TheLine/proje-hatti/?import=gh', '_blank'); }

/* ---- DXF with blocks + attributes (one block per panel shape) ---- */
function ocsAxes(N) { const Ax = (Math.abs(N[0]) < 1 / 64 && Math.abs(N[1]) < 1 / 64) ? vnorm(vcross([0, 1, 0], N)) : vnorm(vcross([0, 0, 1], N)); return { Ax, Ay: vcross(N, Ax) }; }
function panelNames() { // node id -> names list from a Panel Numbering fed by that node
  const m = new Map(); for (const pn of doc.nodes.filter(x => x.type === 'panelnum')) { const w = doc.wires.find(w => w.b === pn.id && w.bi === 0); if (w) m.set(w.a + ':' + w.ao, flat((cache[pn.id] || [])[1])); } return m;
}
function exportDXFBlocks() {
  const items = geoItems(); if (!items.length) return; const names = panelNames(), blocks = new Map(), inserts = [], others = [], lay = new Map(); let pi = 0;
  for (const n of doc.nodes) { if (!n.pv || n.off || n.type === 'cprev') continue; (cache[n.id] || []).forEach((t, ao) => { const nm = names.get(n.id + ':' + ao); flat(t).forEach((g, i) => { if (isGeo(g) && g.t === 'mesh' && g.f.length === 1 && g.f[0].length >= 3) {
    const o = g.f[0].map(k => g.v[k]), nr = vnorm(newell(o)); let xv = vsub(o[1], o[0]); xv = vnorm(vsub(xv, vmul(nr, vdot(xv, nr)))); const F = mkPln(o[0], xv, vcross(nr, xv)), loc = o.map(p => inPln(F, p)), key = loc.map(p => p.map(v => Math.round(v * 2000) / 2000).join(',')).join(';');
    if (!blocks.has(key)) blocks.set(key, { name: 'PANEL_' + String(blocks.size + 1).padStart(3, '0'), loc, n: 0 }); const b = blocks.get(key); b.n++; const d = panelDims(g);
    inserts.push({ b, F, no: nm ? asStr(nm[i]) : 'P' + String(++pi).padStart(3, '0'), size: `${(d.w * 1000).toFixed(0)}x${(d.h * 1000).toFixed(0)}`, area: d.a.toFixed(3), layer: (nickOf(n) + '_' + n.id).replace(/[^A-Za-z0-9_-]/g, '_') }); } }); }); }
  for (const it of items) if (!(it.g.t === 'mesh' && it.g.f.length === 1)) others.push(it);
  [...inserts.map(x => [x.layer, '#9e2a2a']), ...others.map(x => [x.layer, x.col])].forEach(([l, c]) => { if (!lay.has(l)) lay.set(l, aciOf(c)); }); lay.set('PANEL_YAZI', 3);
  const L = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '0', 'ENDSEC', '0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER', '70', String(lay.size)];
  for (const [n, c] of lay) L.push('0', 'LAYER', '2', n, '70', '0', '62', String(c), '6', 'CONTINUOUS'); L.push('0', 'ENDTAB', '0', 'ENDSEC', '0', 'SECTION', '2', 'BLOCKS');
  for (const b of blocks.values()) {
    L.push('0', 'BLOCK', '8', '0', '2', b.name, '70', '2', '10', '0', '20', '0', '30', '0', '3', b.name);
    L.push('0', 'POLYLINE', '8', '0', '66', '1', '70', '9', '10', '0', '20', '0', '30', '0'); b.loc.forEach(p => L.push('0', 'VERTEX', '8', '0', '10', ff(p[0]), '20', ff(p[1]), '30', ff(p[2]), '70', '32')); L.push('0', 'SEQEND', '8', '0');
    if (b.loc.length <= 4) { const q = b.loc.length === 3 ? [...b.loc, b.loc[2]] : b.loc; L.push('0', '3DFACE', '8', '0'); q.forEach((p, i) => L.push(String(10 + i), ff(p[0]), String(20 + i), ff(p[1]), String(30 + i), ff(p[2]))); }
    const c = b.loc.reduce((s, p) => [s[0] + p[0] / b.loc.length, s[1] + p[1] / b.loc.length], [0, 0]), h = Math.max(0.02, Math.min(...[0, 1].map(a => Math.max(...b.loc.map(p => p[a])) - Math.min(...b.loc.map(p => p[a]))))) / 8;
    [['NO', 'Panel no', 0, 1.3], ['OLCU', 'Olcu (mm)', 70, 0], ['ALAN', 'Alan', 70, -1.3]].forEach(([tag, pr, fl, dy]) => L.push('0', 'ATTDEF', '8', 'PANEL_YAZI', '10', ff(c[0]), '20', ff(c[1] + dy * h), '30', '0', '40', ff(dy ? h * 0.7 : h), '1', '', '3', pr, '2', tag, '70', fl === 70 ? '0' : '0', '72', '1', '11', ff(c[0]), '21', ff(c[1] + dy * h), '31', '0'));
    L.push('0', 'ENDBLK', '8', '0');
  }
  L.push('0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES');
  for (const it of inserts) {
    const { Ax, Ay } = ocsAxes(it.F.z), N = it.F.z, oc = p => [vdot(p, Ax), vdot(p, Ay), vdot(p, N)], ip = oc(it.F.o), rot = Math.atan2(vdot(it.F.x, Ay), vdot(it.F.x, Ax)) / D2R, b = it.b;
    L.push('0', 'INSERT', '8', it.layer, '66', '1', '2', b.name, '10', ff(ip[0]), '20', ff(ip[1]), '30', ff(ip[2]), '50', ff(rot), '210', ff(N[0]), '220', ff(N[1]), '230', ff(N[2]));
    const c = b.loc.reduce((s, p) => [s[0] + p[0] / b.loc.length, s[1] + p[1] / b.loc.length], [0, 0]), h = Math.max(0.02, Math.min(...[0, 1].map(a => Math.max(...b.loc.map(p => p[a])) - Math.min(...b.loc.map(p => p[a]))))) / 8;
    [['NO', it.no, 1.3, h], ['OLCU', it.size, 0, h * 0.7], ['ALAN', it.area + ' m2', -1.3, h * 0.7]].forEach(([tag, val, dy, hh]) => { const w = onPln(it.F, c[0], c[1] + dy * h, 0), q = oc(w); L.push('0', 'ATTRIB', '8', 'PANEL_YAZI', '10', ff(q[0]), '20', ff(q[1]), '30', ff(q[2]), '40', ff(hh), '1', dxfTxt(val), '2', tag, '70', '0', '50', ff(rot), '72', '1', '11', ff(q[0]), '21', ff(q[1]), '31', ff(q[2]), '210', ff(N[0]), '220', ff(N[1]), '230', ff(N[2])); });
    L.push('0', 'SEQEND', '8', it.layer);
  }
  for (const { g, layer } of others) {
    if (g.t === 'pt') L.push('0', 'POINT', '8', layer, '10', ff(g.x), '20', ff(g.y), '30', ff(g.z));
    else if (g.t === 'tag') L.push('0', 'TEXT', '8', layer, '10', ff(g.p[0]), '20', ff(g.p[1]), '30', ff(g.p[2]), '40', ff(g.h), '1', dxfTxt(g.s));
    else if (g.t === 'crv') { L.push('0', 'POLYLINE', '8', layer, '66', '1', '70', String(8 | (g.c ? 1 : 0)), '10', '0', '20', '0', '30', '0'); g.p.forEach(p => L.push('0', 'VERTEX', '8', layer, '10', ff(p[0]), '20', ff(p[1]), '30', ff(p[2]), '70', '32')); L.push('0', 'SEQEND', '8', layer); }
    else for (const fc of faces(g)) { const q = fc.length === 3 ? [...fc, fc[2]] : fc.slice(0, 4); L.push('0', '3DFACE', '8', layer); q.forEach((p, i) => L.push(String(10 + i), ff(p[0]), String(20 + i), ff(p[1]), String(30 + i), ff(p[2]))); }
  }
  L.push('0', 'ENDSEC', '0', 'EOF');
  if (!inserts.length) toast('Tek yüzlü panel bulunamadı · diğer geometri yazıldı');
  download(`mini-gh-bloklu-${stamp()}.dxf`, new Blob([L.join('\r\n')], { type: 'application/dxf' })); if (inserts.length) toast(`DXF · ${inserts.length} panel, ${blocks.size} blok tipi (NO, OLCU, ALAN öznitelikli)`);
}
EXP.dxfb = exportDXFBlocks;

/* ---- slider animation (+ optional video) ---- */
let ANIM = null;
function animateSlider(n, rec) {
  if (ANIM) { ANIM.stop = true; return; } const s = n.st, v0 = s.val, dur = 6000, t0 = performance.now(); let mr = null, chunks = [];
  if (rec) { const mime = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)); if (!mime || !renderer.domElement.captureStream) { toast('Bu tarayıcı video kaydını desteklemiyor'); return; }
    const stream = renderer.domElement.captureStream(30); mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6e6 }); mr.ondataavailable = e => e.data.size && chunks.push(e.data); mr.onstop = () => { stream.getTracks().forEach(t => t.stop()); download(`animasyon-${stamp()}.${mime.includes('mp4') ? 'mp4' : 'webm'}`, new Blob(chunks, { type: mime.split(';')[0] })); toast('Animasyon videosu indirildi'); }; mr.start(); }
  ANIM = { stop: false }; toast(rec ? 'Animasyon kaydediliyor…' : 'Animasyon · durdurmak için tekrar seç');
  const step = () => { const t = Math.min(1, (performance.now() - t0) / dur); let v = s.min + (s.max - s.min) * t; s.val = s.int ? Math.round(v) : +v.toFixed(4); const el = els[n.id]; if (el) { const r = el.querySelector('input[type=range]'); if (r) r.value = s.val; const vv = el.querySelector('.val'); if (vv) vv.textContent = fmt(s.val); }
    solve(); doc.nodes.forEach(m => { if (m !== n) refreshNode(m); }); rebuildPreview();
    if (t < 1 && !ANIM.stop) requestAnimationFrame(step); else { ANIM = null; if (mr) setTimeout(() => mr.stop(), 300); if (!rec) { s.val = v0; } schedule(); } };
  requestAnimationFrame(step);
}

/* ---- personal library of clusters ---- */
const LIBKEY = 'mgh-library';
const libGet = () => { try { return JSON.parse(localStorage.getItem(LIBKEY)) || []; } catch (e) { return []; } };
const libSet = a => { try { localStorage.setItem(LIBKEY, JSON.stringify(a)); return true; } catch (e) { toast('Kütüphane kaydedilemedi (tarayıcı belleği dolu?)'); return false; } };
function libSave(n) { const d = doc.defs && doc.defs[n.type.slice(3)]; if (!d) return; const a = libGet(), name = prompt('Kütüphanede adı:', d.name); if (name == null) return; a.push({ id: Date.now().toString(36), name: name.trim() || d.name, def: JSON.parse(JSON.stringify({ ...d, name: name.trim() || d.name })) }); if (libSet(a)) { toast(`"${name}" kütüphaneye eklendi (Kütüphane sekmesi)`); if (curCat === 'Lib') paintRibbon(); } }
function libInsert(id) { const it = libGet().find(x => x.id === id); if (!it) return; record(); doc.defs = doc.defs || {}; const did = 'd' + (uid++); doc.defs[did] = JSON.parse(JSON.stringify(it.def)); registerDefs();
  const r = editor.getBoundingClientRect(), at = toWorld(r.left + r.width * 0.4, r.top + r.height * 0.4), n = addNode('cl_' + did, at[0], at[1]); buildNode(n); sel.clear(); sel.add(n.id); schedule(); record(); }
function libPaint() { const a = libGet();
  $('tools').innerHTML = (a.length ? a.map(x => `<button type="button" data-lib="${x.id}" title="${esc(x.name)}"><i>${esc(x.name.slice(0, 10))}</i>${x.def.ins.length} giriş · ${x.def.outs.length} çıkış</button>`).join('') : '<span class="libempty">Kütüphane boş · bir cluster\'a sağ tıkla → "Kütüphaneye kaydet"</span>')
    + `<button type="button" data-libx="exp" title="Kütüphaneyi dosyaya kaydet"><i>⇩</i>Dışa aktar</button><button type="button" data-libx="imp" title="Kütüphane dosyası aç"><i>⇧</i>İçe aktar</button>${a.length ? '<button type="button" data-libx="del" title="Bir öğeyi sil"><i>✕</i>Öğe sil</button>' : ''}`; }
function libAction(k) {
  if (k === 'exp') { download(`mini-gh-kutuphane-${stamp()}.mghlib`, new Blob([JSON.stringify({ format: 'mini-grasshopper-lib', items: libGet() }, null, 1)], { type: 'application/json' })); return; }
  if (k === 'del') { const a = libGet(), name = prompt('Silinecek öğenin adı:\n' + a.map(x => '· ' + x.name).join('\n')); if (!name) return; const b = a.filter(x => x.name !== name.trim()); if (b.length === a.length) { toast('Bulunamadı'); return; } libSet(b); libPaint(); return; }
  const fi = document.createElement('input'); fi.type = 'file'; fi.accept = '.mghlib,.json'; fi.onchange = async () => { const f = fi.files[0]; if (!f) return; try { const o = JSON.parse(await f.text()); if (!Array.isArray(o.items)) throw 0; const a = libGet(); o.items.forEach(x => { if (x && x.def && !a.some(y => y.id === x.id)) a.push(x); }); libSet(a); libPaint(); toast(`${o.items.length} öğe içe aktarıldı`); } catch (e) { toast('Kütüphane dosyası okunamadı'); } }; fi.click();
}

/* ---- viewport tools: section, measure, glass look, shadows ---- */
const VT = { sec: null, meas: null, glass: false, shadow: false };
function toggleSection() {
  if (VT.sec) { renderer.clippingPlanes = []; VT.sec = null; $('secBox').hidden = true; $('secBtn').classList.remove('on'); return; }
  VT.sec = { ax: 2, flip: false, t: 0.5 }; $('secBox').hidden = false; $('secBtn').classList.add('on'); applySection();
}
function applySection() { if (!VT.sec) return; const box = new THREE.Box3().setFromObject(prev); if (box.isEmpty()) return; const a = VT.sec.ax, lo = box.min.getComponent(a), hi = box.max.getComponent(a), v = lo + (hi - lo) * VT.sec.t, n = new THREE.Vector3(); n.setComponent(a, VT.sec.flip ? 1 : -1);
  renderer.clippingPlanes = [new THREE.Plane(n, VT.sec.flip ? -v : v)]; $('secVal').textContent = `${'XYZ'[a]} = ${fmt(v)}`; }
const measGrp = new THREE.Group(); scene.add(measGrp);
function toggleMeasure() { VT.meas = VT.meas ? null : []; $('measBtn').classList.toggle('on', !!VT.meas); viewEl.classList.toggle('picking', !!VT.meas); if (!VT.meas) { measGrp.clear(); } else toast('İki noktaya tıkla · köşelere yakalar · Esc: bitir'); }
function measPick(p) {
  VT.meas.push(p); const dot = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xd9483b, depthTest: false })); const box = new THREE.Box3().setFromObject(prev), r = (box.isEmpty() ? 10 : box.getSize(new THREE.Vector3()).length()) * 0.004; dot.scale.setScalar(r); dot.position.copy(p); dot.renderOrder = 11; measGrp.add(dot);
  if (VT.meas.length === 2) { const [a, b] = VT.meas, ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color: 0xd9483b, depthTest: false })); ln.renderOrder = 11; measGrp.add(ln);
    const d = b.clone().sub(a), sp = tagSprite(fmt(d.length()), r * 6, '#d9483b'); sp.position.copy(a.clone().add(b).multiplyScalar(0.5)); measGrp.add(sp); toast(`Mesafe ${fmt(d.length())} · dx ${fmt(Math.abs(d.x))} · dy ${fmt(Math.abs(d.y))} · dz ${fmt(Math.abs(d.z))}`); VT.meas = []; }
}
(() => { const ray = new THREE.Raycaster(); let pd = null; const cvs = renderer.domElement;
  cvs.addEventListener('pointerdown', e => { pd = [e.clientX, e.clientY]; });
  cvs.addEventListener('pointerup', e => { if (!VT.meas || PICK || !pd || Math.hypot(e.clientX - pd[0], e.clientY - pd[1]) > 4) return; const r = cvs.getBoundingClientRect(), m = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(m, cam);
    const ms = []; prev.traverse(o => { if (o.isMesh) ms.push(o); }); const hit = ray.intersectObjects(ms, false)[0]; let p = hit ? hit.point.clone() : null; if (!p) { p = new THREE.Vector3(); if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), p)) return; }
    if (hit && hit.face) { const pos = hit.object.geometry.attributes.position; let best = null, bd = Infinity; for (const k of [hit.face.a, hit.face.b, hit.face.c]) { const v = new THREE.Vector3().fromBufferAttribute(pos, k), sv = v.clone().project(cam), px = [(sv.x + 1) / 2 * r.width, (1 - sv.y) / 2 * r.height], d = Math.hypot(px[0] - (e.clientX - r.left), px[1] - (e.clientY - r.top)); if (d < bd) { bd = d; best = v; } } if (best && bd < 12) p = best; }
    measPick(p); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && VT.meas) toggleMeasure(); });
})();
function toggleGlass() { VT.glass = !VT.glass; $('glassBtn').classList.toggle('on', VT.glass); const m = mats(false).srf; if (VT.glass) { m.color.set(0x8fbfe0); m.opacity = 0.32; m.metalness = 0.3; m.roughness = 0.08; } else { m.color.set(COL.base); m.opacity = 0.55; m.metalness = 0.05; m.roughness = 0.6; } m.needsUpdate = true; }
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.22 })); ground.receiveShadow = true; ground.visible = false; scene.add(ground);
function applyShadows() {
  renderer.shadowMap.enabled = VT.shadow; dl.castShadow = VT.shadow; ground.visible = VT.shadow; prev.traverse(o => { if (o.isMesh) { o.castShadow = VT.shadow; o.receiveShadow = VT.shadow; } });
  if (VT.shadow) { const box = new THREE.Box3().setFromObject(prev); if (!box.isEmpty()) { const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3()).length() || 10; ground.scale.set(s * 3, s * 3, 1); ground.position.set(c.x, c.y, box.min.z - s * 0.001);
    dl.position.set(c.x + s * 0.6, c.y - s * 0.8, c.z + s * 1.2); dl.target.position.copy(c); scene.add(dl.target); const sc = dl.shadow.camera; sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s; sc.near = 0.01; sc.far = s * 4; sc.updateProjectionMatrix(); dl.shadow.mapSize.set(2048, 2048); dl.shadow.bias = -0.0005; } }
}
function toggleShadow() { VT.shadow = !VT.shadow; $('shadowBtn').classList.toggle('on', VT.shadow); applyShadows(); }

/* ---- Grasshopper GHX import (subset) ---- */
const GHMAP = { 'Number Slider': 'slider', 'Panel': 'panel', 'Boolean Toggle': 'toggle', 'Number': 'numbox', 'Addition': 'add', 'Subtraction': 'sub', 'Multiplication': 'mul', 'Division': 'div', 'Series': 'series', 'Range': 'range', 'Remap Numbers': 'remap', 'Random': 'random',
  'Construct Point': 'pt', 'Deconstruct': 'decon', 'Deconstruct Point': 'decon', 'Unit Z': 'unitz', 'Unit X': 'unitx', 'Unit Y': 'unity', 'Vector XYZ': 'vec', 'Vector 2Pt': 'vec2pt', 'Amplitude': 'amplitude', 'Distance': 'dist', 'XY Plane': 'xyplane', 'XZ Plane': 'xzplane', 'YZ Plane': 'yzplane', 'Construct Plane': 'cplane',
  'Line': 'line', 'Polyline': 'polyline', 'Circle': 'circle', 'Rectangle': 'rect', 'Polygon': 'polygon', 'Arc': 'arc', 'Interpolate': 'interp', 'Divide Curve': 'divc', 'Evaluate Curve': 'evalc', 'Length': 'clen', 'Explode': 'explode', 'Join Curves': 'joincrv', 'End Points': 'endpts', 'Offset Curve': 'offset',
  'Loft': 'loft', 'Extrude': 'extrudev', 'Plane Surface': 'planesrf', 'Divide Surface': 'divs', 'Box': 'box', 'Sphere': 'sphere', 'Pipe': 'pipe', 'Area': 'area', 'Volume': 'volume', 'Evaluate Surface': 'evalsrf',
  'Move': 'move', 'Rotate': 'rotate', 'Scale': 'scale', 'Mirror': 'mirrorp', 'Orient': 'orientp', 'Project': 'project', 'Linear Array': 'linarr', 'Polar Array': 'polarr',
  'List Item': 'listitem', 'List Length': 'listlen', 'Reverse List': 'reverse', 'Shift List': 'shift', 'Cull Pattern': 'cullpat', 'Cull Index': 'cullidx', 'Sort List': 'sort', 'Dispatch': 'dispatch', 'Partition List': 'partition', 'Graft Tree': 'graft', 'Flatten Tree': 'flatten', 'Simplify Tree': 'simplify', 'Flip Matrix': 'flip', 'Merge': 'merge', 'Cross Reference': 'crossref', 'Duplicate Data': 'dupdata', 'Weave': 'weave', 'Split List': 'splitlist', 'Sub List': 'sublist', 'Create Set': 'createset', 'Explode Tree': 'explodetree', 'Shift Paths': 'shiftpaths', 'Stream Filter': 'sfilter', 'Stream Gate': 'sgate', 'Insert Items': 'insert', 'Replace Items': 'replace',
  'Construct Domain': 'cdomain', 'Deconstruct Domain': 'ddomain', 'Bounds': 'bounds', 'Round': 'round', 'Absolute': 'absv', 'Modulus': 'modulus', 'Mass Addition': 'massadd', 'Average': 'average', 'Equality': 'equality', 'Gate And': 'gand', 'Gate Or': 'gor', 'Gate Not': 'gnot', 'Larger Than': 'larger', 'Smaller Than': 'smaller',
  'Custom Preview': 'cprev', 'Gradient': 'gradient', 'Colour Swatch': 'colour', 'Graph Mapper': 'graph', 'Expression': 'expr', 'Scribble': 'note', 'Group': null, 'Point': 'ptpick', 'Image Sampler': 'imgsamp', 'Data Recorder': 'recorder', 'Value List': 'vlist', 'Curve | Curve': 'ccx', 'Brep | Plane': 'bplx', 'Curve | Plane': 'cplx', 'Region Union': 'regunion', 'Region Difference': 'regdiff', 'Region Intersection': 'regint', 'Solid Union': 'csgunion', 'Solid Difference': 'csgdiff', 'Solid Intersection': 'csgint' };
function importGHX(txt) {
  const xml = new DOMParser().parseFromString(txt, 'application/xml'); if (xml.querySelector('parsererror')) throw new Error('GHX okunamadı');
  const kid = (el, name) => [...el.children].find(c => c.tagName === 'chunk' && c.getAttribute('name') === name), kids = (el, name) => { const cs = [...el.children].find(c => c.tagName === 'chunks'); return cs ? [...cs.children].filter(c => c.getAttribute('name') === name) : []; };
  const items = el => { const it = [...el.children].find(c => c.tagName === 'items'); const m = {}; if (it) for (const x of it.children) { const n = x.getAttribute('name'); (m[n] = m[n] || []).push(x); } return m; }, val = (m, k) => m[k] && m[k][0] ? m[k][0].textContent.trim() : undefined;
  const defn = xml.querySelector('chunk[name="DefinitionObjects"]'); if (!defn) throw new Error('GHX: DefinitionObjects yok');
  const objs = kids(defn, 'Object'), out = new Map(), pend = [], made = [], skipped = new Map(), nd = { nodes: [], wires: [], groups: [] }; let id = 1; const minXY = [Infinity, Infinity];
  for (const o of objs) { const oi = items(o), name = val(oi, 'Name'), cont = [...o.children].find(c => c.tagName === 'chunks') && kids(o, 'Container')[0]; if (!cont) continue; const ci = items(cont), att = kids(cont, 'Attributes')[0], ai = att ? items(att) : {}, piv = ai.Pivot && ai.Pivot[0], x = piv ? +((piv.querySelector('X') || {}).textContent || 0) : 0, y = piv ? +((piv.querySelector('Y') || {}).textContent || 0) : 0;
    minXY[0] = Math.min(minXY[0], x); minXY[1] = Math.min(minXY[1], y); const type = GHMAP[name];
    if (type === null) continue;
    let st; if (type === 'slider') { const s = kids(cont, 'Slider')[0], si = s ? items(s) : {}; st = { label: val(ci, 'NickName') || 'Slider', min: +(val(si, 'Min') ?? 0), max: +(val(si, 'Max') ?? 10), val: +(val(si, 'Value') ?? 5), int: (val(si, 'Digits') === '0') || val(si, 'Interval') === '1' }; }
    else if (type === 'toggle') st = { label: val(ci, 'NickName') || 'Toggle', val: /true/i.test(val(ci, 'ToggleValue') || 'false') }; else if (type === 'expr') st = { expr: (val(ci, 'Expression') || 'x').replace(/\bX\b/g, 'x').replace(/\bY\b/g, 'y') }; else if (type === 'note') st = { text: val(ci, 'Text') || 'Scribble' };
    const nt = type && C[type] ? type : 'note'; if (!type) { skipped.set(name, (skipped.get(name) || 0) + 1); st = { text: `GH: ${name}\n(desteklenmiyor)` }; }
    const n = { id: id++, type: nt, x, y, st: JSON.parse(JSON.stringify({ ...(C[nt].st || {}), ...(st || {}) })), pv: true }; if (val(ci, 'NickName') && nt !== 'slider' && nt !== 'note' && val(ci, 'NickName') !== name && val(ci, 'NickName') !== C[nt].nick) n.nick = val(ci, 'NickName'); nd.nodes.push(n); made.push(name);
    const inst = val(ci, 'InstanceGuid'); if (inst) out.set(inst, [n.id, 0]); (ci.Source || []).forEach(s => pend.push({ to: n.id, port: 0, src: s.textContent.trim() }));
    kids(cont, 'param_output').forEach((po, k) => { const g = val(items(po), 'InstanceGuid'); if (g) out.set(g, [n.id, +(po.getAttribute('index') ?? k)]); });
    kids(cont, 'param_input').forEach((pi, k) => { const ii = items(pi); (ii.Source || []).forEach(s => pend.push({ to: n.id, port: +(pi.getAttribute('index') ?? k), src: s.textContent.trim() })); });
  }
  if (!nd.nodes.length) throw new Error('GHX: bileşen bulunamadı');
  nd.nodes.forEach(n => { n.x = (n.x - minXY[0]) * 1.1 + 40; n.y = (n.y - minXY[1]) * 1.1 + 40; });
  let nw = 0, lost = 0; for (const p of pend) { const s = out.get(p.src), tn = nd.nodes.find(n => n.id === p.to); if (!s || !tn || tn.type === 'note' || p.port >= C[tn.type].ins.length || s[1] >= C[nd.nodes.find(n => n.id === s[0]).type].outs.length) { lost++; continue; } nd.wires = nd.wires.filter(w => !(w.b === p.to && w.bi === p.port)); nd.wires.push({ a: s[0], ao: s[1], b: p.to, bi: p.port }); nw++; }
  record(); doc = nd; uid = id; normDoc(); sel.clear(); rebuildAll(); schedule(); setTimeout(fitEditor, 50); record();
  const sk = [...skipped.entries()].map(([k, v]) => `${k}${v > 1 ? ' ×' + v : ''}`); toast(`GHX · ${nd.nodes.length - [...skipped.values()].reduce((a, b) => a + b, 0)} bileşen, ${nw} bağlantı${sk.length ? ` · desteklenmeyen: ${sk.slice(0, 4).join(', ')}${sk.length > 4 ? '…' : ''} (not olarak eklendi)` : ''}${lost ? ` · ${lost} bağlantı kurulamadı` : ''}`);
}

$('secBtn').addEventListener('click', toggleSection); $('measBtn').addEventListener('click', toggleMeasure); $('glassBtn').addEventListener('click', toggleGlass); $('shadowBtn').addEventListener('click', toggleShadow);
$('secAx').addEventListener('change', e => { VT.sec.ax = +e.target.value; applySection(); }); $('secT').addEventListener('input', e => { VT.sec.t = +e.target.value; applySection(); }); $('secFlip').addEventListener('click', () => { VT.sec.flip = !VT.sec.flip; applySection(); });

(function loop() { if (REC) REC.step((performance.now() - REC.t0) / REC.dur); else controls.update(); renderer.render(scene, cam); requestAnimationFrame(loop); })();

/* splitter */
$('split').addEventListener('pointerdown', e => {
  const sp = $('split'); sp.setPointerCapture(e.pointerId);
  const mv = ev => { const r = document.querySelector('.main').getBoundingClientRect(); const f = Math.min(0.8, Math.max(0.2, (ev.clientX - r.left) / r.width)); editor.style.flex = `0 0 ${f * 100}%`; viewEl.style.flex = '1 1 0'; };
  sp.addEventListener('pointermove', mv); sp.addEventListener('pointerup', () => sp.removeEventListener('pointermove', mv), { once: true });
});


/* ---- sunum dosyası: tek HTML (uygulama + tanım + kumanda), kilit yok ---- */
async function exportPresentation() {
  const title = prompt('Sunum başlığı:', 'Cephe tasarımı'); if (title == null) return; toast('Sunum dosyası hazırlanıyor…');
  try {
    const get = async u => { const r = await fetch(new URL(u, location.href), { cache: 'no-store' }); if (!r.ok) throw new Error(u + ' okunamadı'); return r.text(); };
    let html = await get(location.pathname.split('/').pop() || 'GrassHopper.html');
    html = html.replace(/<script[^>]*kilit\.js[^>]*><\/script>\s*/i, '');
    for (const m of [...html.matchAll(/<link[^>]*href="([^"]+)"[^>]*data-gh[^>]*>/g)]) { const t = await get(m[1]); html = html.replace(m[0], () => `<style>\n${t}\n</style>`); }
    for (const m of [...html.matchAll(/<script src="([^"]+)" data-gh><\/script>/g)]) { const t = await get(m[1]); html = html.replace(m[0], () => `<script>\n${t.replace(/<\/script/gi, '<\\/script')}\n</script>`); }
    const data = JSON.stringify({ doc, uid, view, title: title.trim() || 'Mini Grasshopper sunum' }).replace(/</g, '\\u003c');
    html = html.replace(/<head>/i, () => `<head>\n<script>window.__PRESENT = ${data};</script>`).replace(/<title>[^<]*<\/title>/i, () => `<title>${esc(title.trim() || 'Mini Grasshopper sunum')}</title>`);
    download(`sunum-${(title.trim() || 'cephe').toLocaleLowerCase('tr').replace(/[^a-z0-9çğıöşü]+/g, '-').slice(0, 40)}-${stamp()}.html`, new Blob([html], { type: 'text/html' }));
    toast('Sunum dosyası indirildi · tarayıcıda çift tıkla açılır');
  } catch (e) { toast('Sunum dosyası oluşturulamadı: ' + e.message); }
}
EXP.present = exportPresentation;
