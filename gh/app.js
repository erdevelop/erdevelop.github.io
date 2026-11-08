/* zamanlama, kayıt, örnekler, açılış */
'use strict';
/* ================= schedule / save ================= */
let pending = false;
function schedule() {
  if (pending) return; pending = true;
  requestAnimationFrame(() => {
    pending = false; solve();
    doc.nodes.forEach(refreshNode); drawWires(); rebuildPreview();
    const nTree = doc.nodes.reduce((s, n) => s + (cache[n.id] || []).reduce((a, t) => a + treeCount(t), 0), 0);
    $('stat').textContent = `${doc.nodes.length} bileşen · ${doc.wires.length} bağlantı · ${nTree} öğe · ${lastSolveMs.toFixed(1)} ms`;
    save();
    if (restoring) restoring = false; else recordSoon();
    paintUndo();
  });
}
const KEY = 'mini-gh-3d-v1';
function save() { if (window.__PRESENT) return; try { localStorage.setItem(KEY, JSON.stringify({ doc, uid, view })); } catch (e) {} }
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.doc && s.doc.nodes.length) { doc = s.doc; uid = s.uid; view = s.view || view; normDoc(); return true; } } catch (e) {} return false; }

/* ================= presets ================= */
function preset(name) {
  doc = { nodes: [], wires: [], groups: [] }; uid = 1; sel.clear();
  const S = (label, min, max, val, int, x, y) => addNode('slider', x, y, { label, min, max, val, int });
  const N = (t, x, y, pv = false, st) => addNode(t, x, y, st, pv);
  const W = (a, ao, b, bi) => connect(a.id, ao, b.id, bi);
  const G = (name, nodes, color) => doc.groups.push({ ids: nodes.map(n => n.id), name, color });
  if (name === 'tower') {
    const kat = S('Kat', 4, 40, 18, true, 0, 0), h = S('Kat yük.', 1, 6, 3.2, false, 0, 40), tw = S('Burulma°', 0, 20, 7, false, 0, 80), side = S('Kenar', 3, 8, 4, true, 0, 120), rad = S('Yarıçap', 2, 20, 9, false, 0, 160), bulge = S('Şişkinlik', 0, 1, 0.35, false, 0, 250);
    const pol = N('polygon', 290, 120), sh = N('series', 290, 10), uz = N('unitz', 420, 20), mv = N('move', 540, 60);
    const sa = N('series', 290, 200), rot = N('rotate', 660, 110);
    const rg = N('range', 290, 290), sn = N('sin', 420, 300), ml = N('mul', 520, 300), ad = N('add', 620, 290), sc = N('scale', 780, 160), lf = N('loft', 900, 170, true);
    W(rad, 0, pol, 1); W(side, 0, pol, 2);
    W(h, 0, sh, 1); W(kat, 0, sh, 2); W(sh, 0, uz, 0); W(pol, 0, mv, 0); W(uz, 0, mv, 1);
    W(tw, 0, sa, 1); W(kat, 0, sa, 2); W(mv, 0, rot, 0); W(sa, 0, rot, 1);
    W(kat, 0, rg, 2);
    const r180 = S('Açı', 0, 360, 180, true, 0, 300); W(r180, 0, rg, 1);
    W(rg, 0, sn, 0); W(sn, 0, ml, 0); W(bulge, 0, ml, 1); const one = S('Taban', 0.2, 2, 0.8, false, 0, 350); W(ml, 0, ad, 0); W(one, 0, ad, 1);
    W(rot, 0, sc, 0); W(ad, 0, sc, 1); W(sc, 0, lf, 0);
    const pn = N('panel', 900, 270); W(sa, 0, pn, 0);
    G('Kat profilleri', [pol, sh, uz, mv, sa, rot], GCOLS[1]); G('Şişkinlik', [rg, sn, ml, ad], GCOLS[2]);
  } else if (name === 'attractor') {
    const w = S('Genişlik', 5, 60, 32, false, 0, 0), d = S('Derinlik', 5, 40, 20, false, 0, 40), u = S('U', 2, 40, 18, true, 0, 110), v = S('V', 2, 30, 11, true, 0, 150);
    const ax = S('Çekim X', 0, 60, 10, false, 0, 230), ay = S('Çekim Y', 0, 40, 6, false, 0, 270), z = S('Kot', 0, 20, 8, false, 0, 70);
    const srf = N('planesrf', 300, 20), pan = N('panels', 430, 90), at = N('pt', 300, 230, true);
    const t0 = S('Min ölçek', 0, 1, 0.12, false, 430, 270), t1 = S('Max ölçek', 0, 1, 0.92, false, 430, 310);
    const atr = N('attractor', 640, 170), sc = N('scale', 820, 110, true);
    W(w, 0, srf, 0); W(d, 0, srf, 1); W(z, 0, srf, 2); W(srf, 0, pan, 0); W(u, 0, pan, 1); W(v, 0, pan, 2);
    W(ax, 0, at, 0); W(ay, 0, at, 1); W(z, 0, at, 2);
    W(pan, 0, atr, 0); W(at, 0, atr, 1); W(t0, 0, atr, 2); W(t1, 0, atr, 3); W(pan, 0, sc, 0); W(atr, 0, sc, 1);
  } else if (name === 'wave') {
    const n = S('Nokta', 5, 120, 60, true, 0, 0), step = S('Aralık', 0.2, 2, 0.6, false, 0, 40), per = S('Periyot°', 90, 1440, 720, true, 0, 80), amp = S('Genlik', 0, 10, 3, false, 0, 120), hgt = S('Yükseklik', 1, 20, 8, false, 0, 200);
    const pu = S('Panel U', 2, 80, 36, true, 0, 260), pv = S('Panel V', 1, 12, 5, true, 0, 300), gap = S('Doluluk', 0.2, 1, 0.86, false, 0, 340);
    const sx = N('series', 300, 0), rg = N('range', 300, 90), sn = N('sin', 430, 100), ml = N('mul', 540, 110), p = N('pt', 680, 40), ic = N('interp', 800, 60), ex = N('extrude', 920, 90), pan = N('panels', 1060, 160), sc = N('scale', 1200, 200, true);
    W(step, 0, sx, 1); W(n, 0, sx, 2); W(per, 0, rg, 1); W(n, 0, rg, 2); W(rg, 0, sn, 0); W(sn, 0, ml, 0); W(amp, 0, ml, 1);
    W(sx, 0, p, 0); W(ml, 0, p, 1); W(p, 0, ic, 0); W(ic, 0, ex, 0); W(hgt, 0, ex, 1);
    W(ex, 0, pan, 0); W(pu, 0, pan, 1); W(pv, 0, pan, 2); W(pan, 0, sc, 0); W(gap, 0, sc, 1);
  } else if (name === 'facade') {
    const r = S('Yarıçap', 4, 30, 14, false, 0, 0), h = S('Yükseklik', 5, 60, 32, false, 0, 40), seg = S('Bölüm', 3, 64, 28, true, 0, 80), fl = S('Kat', 2, 30, 10, true, 0, 120);
    const ax = S('Çekim X', -40, 40, 16, false, 0, 200), ay = S('Çekim Y', -40, 40, -8, false, 0, 240), az = S('Çekim Z', 0, 60, 14, false, 0, 280);
    const c = N('circle', 300, 10), cyl = N('extrude', 430, 40), pan = N('panels', 560, 60), at = N('pt', 300, 220, true);
    const t0 = S('Min', 0, 1, 0.1, false, 560, 230), t1 = S('Max', 0, 1, 0.94, false, 560, 270), atr = N('attractor', 760, 160), sc = N('scale', 920, 90, true);
    const dv = N('divc', 430, -80), vz = N('unitz', 430, -20), mv = N('move', 560, -60), ln = N('line', 690, -80, true);
    W(r, 0, c, 1); W(c, 0, cyl, 0); W(h, 0, cyl, 1); W(cyl, 0, pan, 0); W(seg, 0, pan, 1); W(fl, 0, pan, 2);
    W(ax, 0, at, 0); W(ay, 0, at, 1); W(az, 0, at, 2);
    W(pan, 0, atr, 0); W(at, 0, atr, 1); W(t0, 0, atr, 2); W(t1, 0, atr, 3); W(pan, 0, sc, 0); W(atr, 0, sc, 1);
    W(c, 0, dv, 0); W(seg, 0, dv, 1); W(h, 0, vz, 0); W(dv, 0, mv, 0); W(vz, 0, mv, 1); W(dv, 0, ln, 0); W(mv, 0, ln, 1);
    G('Dikmeler', [dv, vz, mv, ln], GCOLS[1]);
  } else if (name === 'planar') {
    const w = S('Genişlik', 10, 60, 36, false, 0, 0), hh = S('Yükseklik', 5, 40, 18, false, 0, 40), amp = S('Bombe', 0, 8, 3.2, false, 0, 80), u = S('Panel U', 2, 40, 16, true, 0, 150), v = S('Panel V', 1, 30, 8, true, 0, 190);
    const tf = S('Düz tol.', 0, 0.1, 0.01, false, 0, 260), tc = S('Soğuk tol.', 0, 0.5, 0.12, false, 0, 300);
    const eight = N('numbox', -230, -40, false, { label: 'Bölüm', val: 8 }), dv = N('div', 290, -40), sx = N('series', 420, -30), nine = N('add', 290, 30);
    W(w, 0, dv, 0); W(eight, 0, dv, 1); W(dv, 0, sx, 1); W(eight, 0, nine, 0); const one = N('numbox', -230, 10, false, { label: '1', val: 1 }); W(one, 0, nine, 1); W(nine, 0, sx, 2);
    const ang = N('range', 420, 60), sn = N('sin', 540, 70), za = N('mul', 640, 70), hz = N('expr', 420, 170, false, { expr: 'x/2' });
    W(nine, 0, ang, 2); const a180 = N('numbox', -230, 60, false, { label: 'Açı', val: 180 }); W(a180, 0, ang, 1); W(ang, 0, sn, 0); W(sn, 0, za, 0); W(amp, 0, za, 1); W(hh, 0, hz, 0);
    const pA = N('pt', 780, -40), pB = N('pt', 780, 40), pC = N('pt', 780, 130);
    W(sx, 0, pA, 0); W(sx, 0, pB, 0); W(hz, 0, pB, 1); W(za, 0, pB, 2); W(sx, 0, pC, 0); W(hh, 0, pC, 1);
    const iA = N('interp', 900, -40), iB = N('interp', 900, 40), iC = N('interp', 900, 130), mg = N('merge', 1010, 30), lf = N('loft', 1120, 40);
    W(pA, 0, iA, 0); W(pB, 0, iB, 0); W(pC, 0, iC, 0); W(iA, 0, mg, 0); W(iB, 0, mg, 1); W(iC, 0, mg, 2); W(mg, 0, lf, 0);
    const pan = N('panels', 1230, 60), pl = N('planarity', 1360, 120), cp = N('cprev', 1520, 40, true), sch = N('schedule', 1230, 300), pnl = N('panel', 1520, 140);
    W(lf, 0, pan, 0); W(u, 0, pan, 1); W(v, 0, pan, 2); W(pan, 0, pl, 0); W(tf, 0, pl, 1); W(tc, 0, pl, 2); W(pan, 0, cp, 0); W(pl, 2, cp, 1); W(pan, 0, sch, 0); W(pl, 0, pnl, 0);
    G('Çift eğrilikli yüzey', [eight, dv, sx, nine, one, ang, sn, za, hz, a180, pA, pB, pC, iA, iB, iC, mg, lf], GCOLS[1]); G('Panel analizi', [pan, pl, cp, sch, pnl], GCOLS[0]);
  } else if (name === 'voronoi') {
    const x = S('X', 5, 60, 30, false, 0, 0), y = S('Y', 5, 40, 18, false, 0, 40), n = S('Hücre', 5, 300, 60, true, 0, 80), sd = S('Tohum', 1, 50, 4, true, 0, 120), z = S('Kot', 0, 20, 6, false, 0, 160);
    const ax = S('Çekim X', 0, 60, 8, false, 0, 230), ay = S('Çekim Y', 0, 40, 9, false, 0, 270);
    const pop = N('populate', 300, 20), bx = N('rect', 440, 170), vor = N('voronoi', 580, 80), at = N('pt', 300, 340), atr = N('attractor', 740, 200), sc = N('scale', 900, 110, true), fr = N('extrude', 1040, 40, true);
    const t0 = S('Min açıklık', 0, 1, 0.15, false, 440, 300), t1 = S('Max açıklık', 0, 1, 0.85, false, 440, 340), fh = S('Çerçeve h', 0, 2, 0.4, false, 900, 230);
    const bp = N('pt', 300, 200); W(z, 0, bp, 2); W(bp, 0, bx, 0); W(x, 0, bx, 1); W(y, 0, bx, 2);
    W(x, 0, pop, 0); W(y, 0, pop, 1); W(n, 0, pop, 2); W(sd, 0, pop, 3); W(z, 0, pop, 4); W(pop, 0, vor, 0); W(bx, 0, vor, 1);
    W(ax, 0, at, 0); W(ay, 0, at, 1); W(z, 0, at, 2); W(vor, 0, atr, 0); W(at, 0, atr, 1); W(t0, 0, atr, 2); W(t1, 0, atr, 3);
    W(vor, 0, sc, 0); W(atr, 0, sc, 1); W(vor, 0, fr, 0); W(fh, 0, fr, 1);
  } else if (name === 'chain') {
    const r = S('Yarıçap', 10, 60, 24, false, 0, 0), a1 = S('Açı', 20, 180, 80, false, 0, 40), h = S('Yükseklik', 3, 30, 12, false, 0, 80), u = S('Yatay bölüm', 1, 30, 8, true, 0, 130), v = S('Düşey bölüm', 1, 20, 4, true, 0, 170);
    const arc = N('arc', 290, 0), mz = N('unitz', 290, 110), mv = N('move', 410, 60), rs = N('ruled', 530, 20), pan = N('panels', 650, 50, true);
    const no = N('panelnum', 800, -90, true), pd = N('paneldata', 820, 30), mu = N('mullion', 1090, 20, true), gw = N('glassw', 1090, 250), un = N('unroll', 820, 430, true);
    const oy = N('numbox', 560, 500, false, { label: 'Açınım Y', val: -40 }), op = N('pt', 690, 490);
    W(r, 0, arc, 1); W(a1, 0, arc, 3); W(h, 0, mz, 0); W(arc, 0, mv, 0); W(mz, 0, mv, 1); W(arc, 0, rs, 0); W(mv, 0, rs, 1); W(rs, 0, pan, 0); W(u, 0, pan, 1); W(v, 0, pan, 2);
    W(pan, 0, no, 0); W(pan, 0, pd, 0); W(no, 1, pd, 1); W(pan, 0, mu, 0); W(pan, 0, gw, 0); W(pan, 0, un, 0); W(no, 1, un, 1); W(oy, 0, op, 1); W(op, 0, un, 5);
    G('İmalat çıktıları', [no, pd, mu, gw, un], GCOLS[2]);
  } else if (name === 'hexsky') {
    const sz = S('Hücre', 0.5, 4, 1.5, false, 0, 0), ex = S('X adet', 2, 30, 14, true, 0, 40), ey = S('Y adet', 2, 30, 10, true, 0, 80), ax = S('Çekim X', 0, 40, 9, false, 0, 150), ay = S('Çekim Y', 0, 30, 6, false, 0, 190);
    const hg = N('hexgrid', 290, 10), at = N('pt', 290, 160, true), fl = N('flatten', 420, 10), atr = N('attractor', 590, 40), sc = N('scale', 760, 0), bs = N('bsrf', 900, 0), ux = N('unitz', 760, 150), ml = N('mul', 640, 170), ext = N('extrudev', 900, 110, true);
    const t0 = S('Min', 0, 1, 0.2, false, 450, 200), t1 = S('Max', 0, 1, 0.9, false, 450, 240), hz = N('numbox', 520, 300, false, { label: 'Yükseklik', val: 1.2 });
    W(sz, 0, hg, 1); W(ex, 0, hg, 2); W(ey, 0, hg, 3); W(ax, 0, at, 0); W(ay, 0, at, 1); W(hg, 0, fl, 0); W(fl, 0, atr, 0); W(at, 0, atr, 1); W(t0, 0, atr, 2); W(t1, 0, atr, 3);
    W(fl, 0, sc, 0); W(atr, 0, sc, 1); W(sc, 0, bs, 0); W(atr, 0, ml, 0); W(hz, 0, ml, 1); W(ml, 0, ux, 0); W(sc, 0, ext, 0); W(ux, 0, ext, 1);
    G('Çekim', [at, atr, t0, t1], GCOLS[1]);
  } else if (name === 'sun') {
    const mo = S('Ay', 1, 12, 6, true, 0, 0), dy = S('Gün', 1, 31, 21, true, 0, 40), nr = S('Kuzey açısı', 0, 360, 0, false, 0, 80), r = S('Yarıçap', 8, 40, 18, false, 0, 140), u = S('Panel (yatay)', 4, 40, 18, true, 0, 180);
    const arc = N('arc', 290, 120), mz = N('unitz', 290, 230), mv = N('move', 410, 170), rs = N('ruled', 530, 140), pan = N('panels', 650, 150), sp = N('sunpath', 290, -60), so = N('solar', 820, 40), cp = N('cprev', 1000, 110, true);
    const h = N('numbox', 170, 260, false, { label: 'Yükseklik', val: 12 }), v = N('numbox', 520, 260, false, { label: 'Kat', val: 5 }), a1 = N('numbox', 170, 310, false, { label: 'Açı', val: 180 });
    W(mo, 0, sp, 2); W(dy, 0, sp, 3); W(nr, 0, sp, 5); W(r, 0, arc, 1); W(a1, 0, arc, 3); W(h, 0, mz, 0); W(arc, 0, mv, 0); W(mz, 0, mv, 1); W(arc, 0, rs, 0); W(mv, 0, rs, 1); W(rs, 0, pan, 0); W(u, 0, pan, 1); W(v, 0, pan, 2);
    W(pan, 0, so, 0); W(sp, 0, so, 1); W(pan, 0, cp, 0); W(so, 0, cp, 1); const pn = N('panel', 1000, 230); W(so, 0, pn, 0);
    G('Güneş (İstanbul)', [sp, so], GCOLS[2]);
  } else if (name === 'perf') {
    const w = S('Genişlik', 1, 8, 4, false, 0, 0), hh = S('Yükseklik', 1, 4, 2.4, false, 0, 40), u = S('Panel adedi', 1, 6, 3, true, 0, 80), sp = S('Aralık', 0.05, 0.4, 0.12, false, 0, 130), ax = S('Çekim X', 0, 8, 1.2, false, 0, 190), ay = S('Çekim Y', 0, 4, 1.2, false, 0, 230);
    const srf = N('planesrf', 290, 0), pan = N('panels', 420, 30), one = N('numbox', 290, 100, false, { label: 'V', val: 1 }), at = N('pt', 290, 190, true), pf = N('perforate', 590, 60, true), nk = N('naked', 590, -50, true), fl = N('flatten', 760, 70), mg = N('merge', 880, 0), gc = N('gcode', 1010, 0);
    const r0 = N('numbox', 450, 200, false, { label: 'R min', val: 0.008 }), r1 = N('numbox', 450, 240, false, { label: 'R max', val: 0.045 });
    W(w, 0, srf, 0); W(hh, 0, srf, 1); W(srf, 0, pan, 0); W(u, 0, pan, 1); W(one, 0, pan, 2); W(ax, 0, at, 0); W(ay, 0, at, 1); W(pan, 0, pf, 0); W(sp, 0, pf, 1); W(r0, 0, pf, 2); W(r1, 0, pf, 3); W(at, 0, pf, 4);
    W(pan, 0, nk, 0); W(nk, 0, mg, 0); W(pf, 0, mg, 1); W(mg, 0, fl, 0); W(fl, 0, gc, 0);
    G('Delik deseni', [pf, at, r0, r1], GCOLS[1]);
  } else if (name === 'relax') {
    const sz = S('Boyut', 4, 30, 12, false, 0, 0), dv = S('Bölüm', 4, 40, 16, true, 0, 40), gr = S('Kaldırma', -5, 5, 2.5, false, 0, 100), lf = S('Gerginlik', 0.7, 1.1, 0.95, false, 0, 140), it = S('Adım', 10, 1000, 300, true, 0, 180);
    const srf = N('planesrf', 290, 0), ms = N('meshsrf', 420, 0), cn = N('divs', 420, 120), one = N('numbox', 290, 120, false, { label: '1', val: 1 }), rl = N('relax', 600, 40, true), pn = N('panel', 780, 160);
    W(sz, 0, srf, 0); W(sz, 0, srf, 1); W(srf, 0, ms, 0); W(dv, 0, ms, 1); W(dv, 0, ms, 2); W(srf, 0, cn, 0); W(one, 0, cn, 1); W(one, 0, cn, 2);
    W(ms, 0, rl, 0); W(cn, 0, rl, 1); W(lf, 0, rl, 2); W(gr, 0, rl, 3); W(it, 0, rl, 5); W(rl, 1, pn, 0);
  } else if (name === 'types') {
    const r = S('Yarıçap', 10, 40, 20, false, 0, 0), bl = S('Şişkinlik', 0, 6, 2.5, false, 0, 40), u = S('Yatay bölüm', 4, 30, 14, true, 0, 90), v = S('Düşey bölüm', 2, 12, 6, true, 0, 130), tol = S('Tolerans', 0, 0.05, 0.01, false, 0, 180);
    const a1 = N('arc', 290, 0), a2 = N('arc', 290, 110), a3 = N('arc', 290, 220), ad = N('add', 170, 300), z6 = N('numbox', 30, 300, false, { label: 'Kat yük.', val: 6 }), z12 = N('mul', 170, 370), two = N('numbox', 30, 370, false, { label: '2', val: 2 }), u2 = N('unitz', 410, 140), u3 = N('unitz', 410, 250), m2 = N('move', 520, 110), m3 = N('move', 520, 220);
    const mg = N('merge', 640, 60), lf = N('loft', 760, 80), pan = N('panels', 880, 80), pt = N('pantypes', 1020, -40), cp = N('cprev', 1260, 0, true), tq = N('tqty', 1020, 240), un = N('units', 1020, 470), ph = N('phexport', 1330, 470), hn = N('numbox', 880, 520, false, { label: 'Ünite genişliği', val: 4 });
    const zl = N('series', 880, 330); W(z6, 0, zl, 1); const four = N('numbox', 760, 380, false, { label: 'Kat', val: 2 }); W(four, 0, zl, 2);
    W(r, 0, a1, 1); W(r, 0, a3, 1); W(r, 0, ad, 0); W(bl, 0, ad, 1); W(ad, 0, a2, 1); W(z6, 0, u2, 0); W(z6, 0, z12, 0); W(two, 0, z12, 1); W(z12, 0, u3, 0); W(a2, 0, m2, 0); W(u2, 0, m2, 1); W(a3, 0, m3, 0); W(u3, 0, m3, 1);
    W(a1, 0, mg, 0); W(m2, 0, mg, 1); W(m3, 0, mg, 2); W(mg, 0, lf, 0); W(lf, 0, pan, 0); W(u, 0, pan, 1); W(v, 0, pan, 2); W(pan, 0, pt, 0); W(tol, 0, pt, 1); W(pan, 0, cp, 0); W(pt, 3, cp, 1);
    W(pan, 0, tq, 0); W(pan, 0, un, 0); W(zl, 0, un, 1); W(hn, 0, un, 2); W(pan, 0, ph, 0); W(un, 0, ph, 1);
    G('Tip azaltma', [pt, cp, tol], GCOLS[2]); G('Teklif · Proje Hattı', [tq, un, ph], GCOLS[1]);
  } else if (name === 'frames') {
    const r = S('Yarıçap', 5, 40, 18, false, 0, 0), n = S('Kesit', 2, 60, 16, true, 0, 50), sz = S('Kesit boyu', 0.5, 8, 3, false, 0, 100), tw = S('Burgu°', 0, 360, 90, false, 0, 150), sd = S('Kenar', 3, 8, 4, true, 0, 200);
    const arc = N('arc', 300, 0), fr = N('pframes', 430, 30, true), rg = N('range', 300, 150), rot = N('plnrot', 580, 60), pol = N('polygon', 720, 80), lf = N('loft', 860, 90, true);
    W(r, 0, arc, 1); W(arc, 0, fr, 0); W(n, 0, fr, 1); W(tw, 0, rg, 1); W(n, 0, rg, 2);
    W(fr, 0, rot, 0); W(rg, 0, rot, 1); W(rot, 0, pol, 0); W(sz, 0, pol, 1); W(sd, 0, pol, 2); W(pol, 0, lf, 0);
    const pn = N('panel', 580, 200); W(rot, 0, pn, 0);
    G('Düzlemler', [fr, rg, rot], GCOLS[1]);
  } else if (name === 'fins') {
    const w = S('Genişlik', 6, 60, 30, false, 0, 0), hh = S('Yükseklik', 3, 30, 12, false, 0, 40), u = S('Kanat', 4, 80, 36, true, 0, 100), dep = S('Derinlik', 0.05, 2, 0.6, false, 0, 140);
    const srf = N('planesrf', 300, 10), orient = N('orient', 430, 20), gm = N('graph', 440, 150, false, { type: 'bezier', h1: [0.2, 0.9], h2: [0.75, 0.05] }), rg = N('range', 300, 170), ex = N('expr', 640, 170, false, { expr: 'x*y + 0.05' }), sb = N('sbox', 860, 60, true);
    const one = N('numbox', 640, 80, false, { label: 'V', val: 1 });
    W(w, 0, srf, 0); W(hh, 0, srf, 1); W(srf, 0, orient, 0); W(orient, 0, sb, 0); W(u, 0, sb, 1); W(one, 0, sb, 2);
    W(u, 0, rg, 2); W(rg, 0, gm, 0); W(gm, 0, ex, 0); W(dep, 0, ex, 1); W(ex, 0, sb, 3);
    const pn = N('panel', 860, 230); W(gm, 0, pn, 0);
    G('Kanat derinliği (graph mapper)', [rg, gm, ex], GCOLS[2]);
  }
  rebuildAll(); solve(); doc.nodes.forEach(refreshNode); fitEditor(); rebuildPreview(); zoomExtents(); schedule();
}

/* ================= boot ================= */
paintRibbon(); sizeView(); applyView();
if (window.__PRESENT) { const o = window.__PRESENT; doc = o.doc; uid = o.uid; normDoc(); view = o.view || view; document.body.classList.add('viewonly', 'present'); $('remote').hidden = false; $('viewOnly').checked = true; if (o.title) { document.title = o.title; $('presTitle').textContent = o.title; } applyView(); rebuildAll(); solve(); doc.nodes.forEach(refreshNode); sizeView(); rebuildPreview(); zoomExtents(); schedule(); paintRemote(); }
else if (load()) { applyView(); rebuildAll(); solve(); doc.nodes.forEach(refreshNode); drawWires(); rebuildPreview(); zoomExtents(); schedule(); }
else preset('tower');
if (!window.__PRESENT) setTimeout(record, 600);
window.__gh = { get doc() { return doc; }, get cache() { return cache; }, get info() { return info; }, get sel() { return sel; }, preset, solve, undo, redo, copySel, paste, exportGeo, collectGeo, C, add: (t, x, y, st, pv) => { const n = addNode(t, x, y, st, pv); buildNode(n); return n.id; }, wire: (a, ao, b, bi) => connect(a, ao, b, bi), run: () => { solve(); doc.nodes.forEach(refreshNode); drawWires(); rebuildPreview(); }, select: ids => { sel.clear(); ids.forEach(i => sel.add(i)); paintSel(); }, get hist() { return [H.length, hi]; } };
