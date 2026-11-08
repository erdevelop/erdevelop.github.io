/* 3B önizleme */
'use strict';
/* ================= 3D preview ================= */
const viewEl = $('view');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
viewEl.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 5000); cam.up.set(0, 0, 1); cam.position.set(40, -50, 35);
const controls = new THREE.OrbitControls(cam, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.12;
scene.add(new THREE.HemisphereLight(0xffffff, 0x7d8690, 0.8));
const dl = new THREE.DirectionalLight(0xffffff, 0.55); dl.position.set(30, -40, 60); scene.add(dl);
const grid = new THREE.GridHelper(200, 40, 0x7a7f85, 0x9aa0a6); grid.rotation.x = Math.PI / 2; grid.material.transparent = true; grid.material.opacity = 0.55; scene.add(grid);
const axes = new THREE.Group();
[[0xc0392b, [30, 0, 0]], [0x27ae60, [0, 30, 0]]].forEach(([c, e]) => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0.01), new THREE.Vector3(e[0], e[1], 0.01)]); axes.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: c }))); });
scene.add(axes);
const prev = new THREE.Group(); scene.add(prev);
const COL = { base: 0x9e2a2a, sel: 0x2e9b2e };
const mat = {};
function mats(selected) {
  const k = selected ? 'sel' : 'base';
  if (!mat[k]) mat[k] = {
    srf: new THREE.MeshStandardMaterial({ color: COL[k], transparent: true, opacity: 0.55, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.05, depthWrite: false }),
    line: new THREE.LineBasicMaterial({ color: selected ? 0x1d6e1d : 0x6e1414 }),
    pt: new THREE.PointsMaterial({ color: selected ? 0x1d6e1d : 0x8a1c1c, size: 6, sizeAttenuation: false })
  };
  return mat[k];
}
const cmat = {};
function colMats(hex) { if (!cmat[hex]) { const c = new THREE.Color(hex); cmat[hex] = { srf: new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: 0.9, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.05 }), line: new THREE.LineBasicMaterial({ color: c.clone().multiplyScalar(0.55) }), pt: new THREE.PointsMaterial({ color: c, size: 7, sizeAttenuation: false }) }; } return cmat[hex]; }
function buildGeoGroup(list, M, grp) {
  const ptsArr = [], linePos = [], triPos = [], edgePos = [], plns = [], tags = [];
  const tri = (a, b, c) => triPos.push(...a, ...b, ...c);
  for (const g of list) {
    if (g.t === 'pt') ptsArr.push(g.x, g.y, g.z);
    else if (g.t === 'pln') plns.push(g);
    else if (g.t === 'tag') tags.push(g);
    else if (g.t === 'crv') { const p = crvPoly(g); for (let i = 0; i < p.length - 1; i++) linePos.push(...p[i], ...p[i + 1]); }
    else if (g.t === 'srf') {
      const G = g.g, R = G.length, Cc = G[0].length;
      for (let j = 0; j < R - 1; j++) for (let i = 0; i < Cc - 1; i++) { tri(G[j][i], G[j][i + 1], G[j + 1][i + 1]); tri(G[j][i], G[j + 1][i + 1], G[j + 1][i]); }
      const step = Math.max(1, Math.round(Cc / 24));
      for (let j = 0; j < R; j += (j === R - 2 ? 1 : Math.max(1, Math.round(R / 16)))) for (let i = 0; i < Cc - 1; i++) edgePos.push(...G[j][i], ...G[j][i + 1]);
      for (let i = 0; i < Cc; i += (i >= Cc - step ? 1 : step)) for (let j = 0; j < R - 1; j++) edgePos.push(...G[j][i], ...G[j + 1][i]);
    } else if (g.t === 'mesh') {
      for (const f of g.f) { const v = f.map(i => g.v[i]); for (let k = 1; k < v.length - 1; k++) tri(v[0], v[k], v[k + 1]); if (g.f.length < 400 || f.length === 4) for (let i = 0; i < v.length; i++) edgePos.push(...v[i], ...v[(i + 1) % v.length]); }
    }
  }
  const buf = (arr) => { const b = new THREE.BufferGeometry(); b.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); return b; };
  if (triPos.length) { const b = buf(triPos); b.computeVertexNormals(); const m = new THREE.Mesh(b, M.srf); m.userData.k = 'srf'; grp.add(m); }
  if (edgePos.length) { const l = new THREE.LineSegments(buf(edgePos), M.line); l.userData.k = 'line'; grp.add(l); }
  if (linePos.length) { const l = new THREE.LineSegments(buf(linePos), M.line); l.userData.k = 'line'; grp.add(l); }
  if (ptsArr.length) { const p = new THREE.Points(buf(ptsArr), M.pt); p.userData.k = 'pt'; grp.add(p); }
  if (plns.length) addPlanes(plns, M, grp, buf);
  if (tags.length) { const col = '#' + M.line.color.getHexString(); for (const t of tags.slice(0, 4000)) { const sp = tagSprite(t.s, t.h, col); sp.position.set(t.p[0], t.p[1], t.p[2]); sp.userData.k = 'tag'; grp.add(sp); } }
}
const PLN_MAT = [0xd23b2f, 0x2c9c4a, 0x2f6fd2].map(c => new THREE.LineBasicMaterial({ color: c }));
function plnSize(plns) {
  if (plns.length < 2) return 3;
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (const F of plns) { x0 = Math.min(x0, F.o[0]); x1 = Math.max(x1, F.o[0]); y0 = Math.min(y0, F.o[1]); y1 = Math.max(y1, F.o[1]); z0 = Math.min(z0, F.o[2]); z1 = Math.max(z1, F.o[2]); }
  const d = Math.hypot(x1 - x0, y1 - y0, z1 - z0); return Math.max(0.2, Math.min(3, d / Math.sqrt(plns.length) * 0.35)) || 1;
}
function addPlanes(plns, M, grp, buf) {
  const S = plnSize(plns), h = S / 2, sq = [], ax = [[], [], []];
  for (const F of plns) {
    const c = [onPln(F, -h, -h), onPln(F, h, -h), onPln(F, h, h), onPln(F, -h, h)];
    for (let i = 0; i < 4; i++) sq.push(...c[i], ...c[(i + 1) % 4]);
    for (const t of [-0.5, 0, 0.5]) { sq.push(...onPln(F, t * h, -h), ...onPln(F, t * h, h), ...onPln(F, -h, t * h), ...onPln(F, h, t * h)); }
    ax[0].push(...F.o, ...onPln(F, S * 0.8, 0)); ax[1].push(...F.o, ...onPln(F, 0, S * 0.8)); ax[2].push(...F.o, ...onPln(F, 0, 0, S * 0.5));
  }
  const l = new THREE.LineSegments(buf(sq), M.line); l.userData.k = 'line'; grp.add(l);
  ax.forEach((a, i) => { const o = new THREE.LineSegments(buf(a), PLN_MAT[i]); o.userData.k = 'axis'; grp.add(o); });
}
function nodeObject(n) {
  const grp = new THREE.Group(); grp.userData.nid = n.id;
  if (n.type === 'cprev') {
    const cp = info[n.id] && info[n.id].cp; if (!cp || !cp.G.length) return null; grp.userData.custom = true;
    const by = new Map(); cp.G.forEach((g, i) => { const h = cp.cols[i] || '#c47a2c'; (by.get(h) || by.set(h, []).get(h)).push(g); });
    for (const [h, list] of by) buildGeoGroup(list, sel.has(n.id) ? mats(true) : colMats(h), grp);
    return grp;
  }
  const out = []; for (const t of cache[n.id] || []) for (const b of t) for (const g of b.v) if (isGeo(g)) out.push(g);
  if (!out.length) return null;
  buildGeoGroup(out, mats(sel.has(n.id)), grp);
  return grp;
}
function rebuildPreview() {
  prev.children.slice().forEach(g => { prev.remove(g); g.traverse(o => o.geometry && !o.isSprite && o.geometry.dispose()); });
  doc.nodes.forEach(n => { if (n.pv && !n.off) { const o = nodeObject(n); if (o) prev.add(o); } });
  paintLegend();
  if (typeof VT !== 'undefined') { if (VT.shadow) applyShadows(); if (VT.sec) applySection(); }
}
function updatePreviewColors() {
  prev.children.forEach(g => { if (g.userData.custom) return; const M = mats(sel.has(g.userData.nid)); g.children.forEach(o => { if (M[o.userData.k]) o.material = M[o.userData.k]; }); });
  if (prev.children.some(g => g.userData.custom)) rebuildPreview();
}
function paintLegend() {
  const lg = $('legend'); let html = '';
  for (const n of doc.nodes) {
    if (!n.pv || n.off) continue;
    const cp = n.type === 'cprev' && info[n.id] && info[n.id].cp; if (!cp) continue;
    if (cp.legend) html += `<span>${esc(nickOf(n))}</span><i style="background:linear-gradient(90deg,${RAMP.join(',')})"></i><span class="lr"><span>${fmt(cp.legend.lo)}</span><span>${fmt(cp.legend.hi)}</span></span>`;
    else { const w = doc.wires.find(w => w.b === n.id && w.bi === 1), src = w && byId(w.a); if (src && src.type === 'planarity') { const pl = src, t1 = flat(cacheIn(pl, 1))[0] ?? 0.005, t2 = flat(cacheIn(pl, 2))[0] ?? 0.05; const cnt = [0, 0, 0]; flat((cache[pl.id] || [])[1]).forEach(k => cnt[k]++); html += `<span>Düzlemsellik</span>${['düz ≤ ' + fmt(t1), 'soğuk büküm ≤ ' + fmt(t2), 'sıcak büküm / özel'].map((s, i) => `<span class="cat"><b style="background:${CLASS_COL[i]}"></b>${s} · ${cnt[i]}</span>`).join('')}`; }
      else if (src && src.type === 'schedule') { const s = info[src.id] && info[src.id].sched; if (s) html += `<span>Panel tipleri · ${s.rows.length}</span>${s.rows.slice(0, 6).map((r, i) => `<span class="cat"><b style="background:${TYPE_COL[i % TYPE_COL.length]}"></b>${r.name} · ${r.n}</span>`).join('')}${s.rows.length > 6 ? `<span>… +${s.rows.length - 6}</span>` : ''}`; } }
  }
  lg.innerHTML = html; lg.hidden = !html;
}
function cacheIn(n, i) { const w = doc.wires.find(w => w.b === n.id && w.bi === i); if (w) return (cache[w.a] || [])[w.ao] || []; const d = C[n.type].ins[i].d; return d !== undefined ? T1([d]) : []; }
function zoomExtents() {
  const box = new THREE.Box3().setFromObject(prev);
  if (box.isEmpty()) return;
  const c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length() / 2 || 10;
  const dir = cam.position.clone().sub(controls.target).normalize();
  controls.target.copy(c); cam.position.copy(c).add(dir.multiplyScalar(r / Math.sin(cam.fov * Math.PI / 360) * 1.05));
  cam.near = r / 100; cam.far = r * 100; cam.updateProjectionMatrix();
}
$('zoomBtn').addEventListener('click', zoomExtents);
$('topBtn').addEventListener('click', () => { const d = cam.position.distanceTo(controls.target); cam.position.set(controls.target.x, controls.target.y - 0.001, controls.target.z + d); });
$('perspBtn').addEventListener('click', () => { const d = cam.position.distanceTo(controls.target); const v = new THREE.Vector3(0.55, -0.7, 0.45).normalize().multiplyScalar(d); cam.position.copy(controls.target).add(v); });
function sizeView() { const w = viewEl.clientWidth, h = viewEl.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / Math.max(h, 1); cam.updateProjectionMatrix(); }
new ResizeObserver(sizeView).observe(viewEl);
