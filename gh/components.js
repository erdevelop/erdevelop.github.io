/* bileşen tanımları */
'use strict';
/* ================= components ================= */
// ins: { n, d: default, list: list access, opt: may be empty, tree: tree access (component uses .tree) }
const C = {
  /* ---- Params ---- */
  slider: { cat: 'Params', name: 'Number Slider', nick: 'Slider', ins: [], outs: ['N'], ui: 'slider', st: { label: 'Slider', min: 0, max: 10, val: 5, int: false }, run: (I, st) => [[st.val]] },
  numbox: { cat: 'Params', name: 'Number', nick: 'Num', ins: [], outs: ['N'], ui: 'numin', st: { label: 'Sayı', val: 1 }, run: (I, st) => [[st.val]] },
  toggle: { cat: 'Params', name: 'Boolean Toggle', nick: 'Toggle', ins: [], outs: ['B'], ui: 'toggle', st: { label: 'Toggle', val: true }, run: (I, st) => [[!!st.val]] },
  colour: { cat: 'Params', name: 'Colour Swatch', nick: 'Swatch', ins: [], outs: ['C'], ui: 'colour', st: { label: 'Renk', hex: '#e0402f' }, run: (I, st) => [[{ t: 'col', hex: st.hex }]] },
  graph: { cat: 'Params', name: 'Graph Mapper', nick: 'Graph', ins: [{ n: 'X', d: 0.5 }], outs: ['Y'], ui: 'graph', st: { type: 'bezier', h1: [0.25, 0.05], h2: [0.6, 1] }, item: (x, st) => [gmap(st, num(x, 'X'))] },
  panel: { cat: 'Params', name: 'Panel', nick: 'Panel', ins: [{ n: 'In', tree: true, opt: true }], outs: [], ui: 'panel', tree: () => [] },

  /* ---- Maths ---- */
  add: { cat: 'Maths', name: 'Addition', nick: 'A+B', ins: [{ n: 'A', d: 0 }, { n: 'B', d: 0 }], outs: ['R'], item: (a, b) => [num(a, 'A') + num(b, 'B')] },
  sub: { cat: 'Maths', name: 'Subtraction', nick: 'A−B', ins: [{ n: 'A', d: 0 }, { n: 'B', d: 0 }], outs: ['R'], item: (a, b) => [num(a, 'A') - num(b, 'B')] },
  mul: { cat: 'Maths', name: 'Multiplication', nick: 'A×B', ins: [{ n: 'A', d: 1 }, { n: 'B', d: 1 }], outs: ['R'], item: (a, b) => [num(a, 'A') * num(b, 'B')] },
  div: { cat: 'Maths', name: 'Division', nick: 'A÷B', ins: [{ n: 'A', d: 1 }, { n: 'B', d: 1 }], outs: ['R'], item: (a, b) => { const d = num(b, 'B'); if (!d) throw new Error('B sıfır olamaz'); return [num(a, 'A') / d]; } },
  sin: { cat: 'Maths', name: 'Sine (°)', nick: 'Sin', ins: [{ n: 'x', d: 0 }], outs: ['y'], item: x => [Math.sin(num(x, 'x') * D2R)] },
  cos: { cat: 'Maths', name: 'Cosine (°)', nick: 'Cos', ins: [{ n: 'x', d: 0 }], outs: ['y'], item: x => [Math.cos(num(x, 'x') * D2R)] },
  expr: { cat: 'Maths', name: 'Expression', nick: 'Expr', ins: [{ n: 'x', d: 0 }, { n: 'y', d: 0 }, { n: 'z', d: 0 }], outs: ['R'], ui: 'expr', st: { expr: 'x*2 + sin(y)' },
    item: (x, y, z, st) => { const f = compileExpr(st.expr || '0'); const r = f({ x: num(x, 'x'), y: num(y, 'y'), z: num(z, 'z') }); if (!isFinite(r)) throw new Error('İfade sayı vermedi'); return [r]; } },
  series: { cat: 'Maths', name: 'Series', nick: 'Series', ins: [{ n: 'S', d: 0 }, { n: 'N', d: 1 }, { n: 'C', d: 10 }], outs: ['S'],
    item: (s, n, c) => { c = Math.round(num(c, 'C')); if (c < 0 || c > 5000) throw new Error('C 0–5000 arası olmalı'); return [Array.from({ length: c }, (_, i) => num(s, 'S') + i * num(n, 'N'))]; } },
  range: { cat: 'Maths', name: 'Range', nick: 'Range', ins: [{ n: 'A', d: 0 }, { n: 'B', d: 1 }, { n: 'N', d: 10 }], outs: ['R'],
    item: (a, b, n) => { n = Math.round(num(n, 'N')); if (n < 1 || n > 5000) throw new Error('N 1–5000 arası olmalı'); a = num(a, 'A'); b = num(b, 'B'); return [Array.from({ length: n }, (_, i) => n === 1 ? a : a + (b - a) * i / (n - 1))]; } },
  remap: { cat: 'Maths', name: 'Remap', nick: 'Remap', ins: [{ n: 'V', list: true }, { n: 'T0', d: 0 }, { n: 'T1', d: 1 }], outs: ['R'],
    run: (I) => { const v = I[0].map(x => num(x, 'V')); if (!v.length) return [[]]; const lo = Math.min(...v), hi = Math.max(...v), t0 = num(I[1][0] ?? 0, 'T0'), t1 = num(I[2][0] ?? 1, 'T1'); return [v.map(x => t0 + (t1 - t0) * (hi > lo ? (x - lo) / (hi - lo) : 0))]; } },
  random: { cat: 'Maths', name: 'Random', nick: 'Rnd', ins: [{ n: 'A', d: 0 }, { n: 'B', d: 1 }, { n: 'N', d: 10 }, { n: 'S', d: 1 }], outs: ['R'],
    item: (a, b, n, s) => { n = Math.round(num(n, 'N')); if (n < 0 || n > 5000) throw new Error('N 0–5000 arası'); a = num(a, 'A'); b = num(b, 'B'); const r = rng(num(s, 'S') + 1); return [Array.from({ length: n }, () => a + (b - a) * r())]; } },
  larger: { cat: 'Maths', name: 'Larger Than', nick: 'A>B', ins: [{ n: 'A', d: 0 }, { n: 'B', d: 0 }], outs: ['>'], item: (a, b) => [num(a, 'A') > num(b, 'B')] },
  smaller: { cat: 'Maths', name: 'Smaller Than', nick: 'A<B', ins: [{ n: 'A', d: 0 }, { n: 'B', d: 0 }], outs: ['<'], item: (a, b) => [num(a, 'A') < num(b, 'B')] },

  /* ---- Sets (lists & trees) ---- */
  listitem: { cat: 'Sets', name: 'List Item', nick: 'Item', ins: [{ n: 'L', list: true }, { n: 'i', d: 0 }, { n: 'W', d: true }], outs: ['E'],
    item: (L, i, w) => { if (!L.length) throw new Error('L boş'); i = Math.round(num(i, 'i')); if (bool(w)) i = ((i % L.length) + L.length) % L.length; else if (i < 0 || i >= L.length) throw new Error('i liste dışında'); return [L[i]]; } },
  listlen: { cat: 'Sets', name: 'List Length', nick: 'Lng', ins: [{ n: 'L', list: true, opt: true }], outs: ['L'], run: I => [[I[0].length]] },
  reverse: { cat: 'Sets', name: 'Reverse List', nick: 'Rev', ins: [{ n: 'L', list: true }], outs: ['L'], run: I => [I[0].slice().reverse()] },
  shift: { cat: 'Sets', name: 'Shift List', nick: 'Shift', ins: [{ n: 'L', list: true }, { n: 'S', d: 1 }, { n: 'W', d: true }], outs: ['L'],
    run: I => { const L = I[0], s = Math.round(num(I[1][0] ?? 1, 'S')), w = bool(I[2][0] ?? true), n = L.length; if (!n) return [[]]; if (w) { const k = ((s % n) + n) % n; return [L.slice(k).concat(L.slice(0, k))]; } return [s >= 0 ? L.slice(s) : L.slice(0, n + s)]; } },
  cullpat: { cat: 'Sets', name: 'Cull Pattern', nick: 'Cull', ins: [{ n: 'L', list: true }, { n: 'P', list: true }], outs: ['L'],
    run: I => { const P2 = I[1].map(bool); if (!P2.length) throw new Error('P boş'); return [I[0].filter((_, i) => P2[i % P2.length])]; } },
  cullidx: { cat: 'Sets', name: 'Cull Index', nick: 'CullI', ins: [{ n: 'L', list: true }, { n: 'I', list: true }], outs: ['L'],
    run: I => { const n = I[0].length, S = new Set(I[1].map(v => { const k = Math.round(num(v, 'I')); return ((k % n) + n) % n; })); return [I[0].filter((_, i) => !S.has(i))]; } },
  sort: { cat: 'Sets', name: 'Sort List', nick: 'Sort', ins: [{ n: 'K', list: true }, { n: 'A', list: true, opt: true }], outs: ['K', 'A'],
    run: I => { const idx = I[0].map((k, i) => [num(k, 'K'), i]).sort((a, b) => a[0] - b[0]); return [idx.map(x => x[0]), I[1].length ? idx.map(x => I[1][x[1] % I[1].length]) : []]; } },
  dispatch: { cat: 'Sets', name: 'Dispatch', nick: 'Dis', ins: [{ n: 'L', list: true }, { n: 'P', list: true, opt: true }], outs: ['A', 'B'],
    run: I => { const P2 = (I[1].length ? I[1] : [true, false]).map(bool), A = [], B = []; I[0].forEach((v, i) => (P2[i % P2.length] ? A : B).push(v)); return [A, B]; } },
  partition: { cat: 'Sets', name: 'Partition List', nick: 'Part', ins: [{ n: 'L', list: true }, { n: 'S', list: true, d: 2 }], outs: ['C'],
    run: I => { const S = I[1].map(v => Math.max(1, Math.round(num(v, 'S')))), out = []; let i = 0, k = 0; while (i < I[0].length) { const s = S[k % S.length]; out.push(I[0].slice(i, i + s)); i += s; k++; if (out.length > 5000) throw new Error('Çok fazla parça'); } return [{ __br: out }]; } },
  shuffle: { cat: 'Sets', name: 'Jitter (karıştır)', nick: 'Jitter', ins: [{ n: 'L', list: true }, { n: 'S', d: 1 }], outs: ['L'],
    run: I => { const r = rng(num(I[1][0] ?? 1, 'S') + 7), a = I[0].slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return [a]; } },
  graft: { cat: 'Sets', name: 'Graft Tree', nick: 'Graft', ins: [{ n: 'T', tree: true }], outs: ['T'], tree: I => [I[0].flatMap(b => b.v.map((v, i) => ({ p: [...b.p, i], v: [v] })))] },
  flatten: { cat: 'Sets', name: 'Flatten Tree', nick: 'Flat', ins: [{ n: 'T', tree: true }], outs: ['T'], tree: I => [T1(flat(I[0]))] },
  simplify: { cat: 'Sets', name: 'Simplify Tree', nick: 'Simp', ins: [{ n: 'T', tree: true }], outs: ['T'],
    tree: I => { const T = I[0]; if (T.length < 2) return [T.map(b => ({ p: [0], v: b.v }))]; let k = 0; const min = Math.min(...T.map(b => b.p.length)); while (k < min - 1 && T.every(b => b.p[k] === T[0].p[k])) k++; return [T.map(b => ({ p: b.p.slice(k), v: b.v }))]; } },
  flip: { cat: 'Sets', name: 'Flip Matrix', nick: 'Flip', ins: [{ n: 'T', tree: true }], outs: ['T'],
    tree: I => { const T = I[0], m = Math.max(0, ...T.map(b => b.v.length)), out = []; for (let j = 0; j < m; j++) out.push({ p: [j], v: T.filter(b => j < b.v.length).map(b => b.v[j]) }); return [out]; } },
  merge: { cat: 'Sets', name: 'Merge', nick: 'Merge', ins: [{ n: 'D1', tree: true, opt: true }, { n: 'D2', tree: true, opt: true }, { n: 'D3', tree: true, opt: true }, { n: 'D4', tree: true, opt: true }], outs: ['R'], tree: I => [mergeTrees(I)] },

  /* ---- Vector ---- */
  pt: { cat: 'Vector', name: 'Construct Point', nick: 'Pt', ins: [{ n: 'X', d: 0 }, { n: 'Y', d: 0 }, { n: 'Z', d: 0 }], outs: ['Pt'], item: (x, y, z) => [P(num(x, 'X'), num(y, 'Y'), num(z, 'Z'))] },
  decon: { cat: 'Vector', name: 'Deconstruct Point', nick: 'pDecon', ins: [{ n: 'P' }], outs: ['X', 'Y', 'Z'], item: p => { p = asPt(p, 'P'); return [p.x, p.y, p.z]; } },
  vec: { cat: 'Vector', name: 'Vector XYZ', nick: 'Vec', ins: [{ n: 'X', d: 0 }, { n: 'Y', d: 0 }, { n: 'Z', d: 1 }], outs: ['V'], item: (x, y, z) => [P(num(x, 'X'), num(y, 'Y'), num(z, 'Z'))] },
  unitz: { cat: 'Vector', name: 'Unit Z', nick: 'Z', ins: [{ n: 'F', d: 1 }], outs: ['V'], item: f => [P(0, 0, num(f, 'F'))] },
  xyplane: { cat: 'Vector', name: 'XY Plane', nick: 'XY', ins: [{ n: 'O', d: P(0, 0, 0) }], outs: ['P'], item: o => [mkPln(vecA(o, 'O'), [1, 0, 0], [0, 1, 0])] },
  xzplane: { cat: 'Vector', name: 'XZ Plane', nick: 'XZ', ins: [{ n: 'O', d: P(0, 0, 0) }], outs: ['P'], item: o => [mkPln(vecA(o, 'O'), [1, 0, 0], [0, 0, 1])] },
  yzplane: { cat: 'Vector', name: 'YZ Plane', nick: 'YZ', ins: [{ n: 'O', d: P(0, 0, 0) }], outs: ['P'], item: o => [mkPln(vecA(o, 'O'), [0, 1, 0], [0, 0, 1])] },
  cplane: { cat: 'Vector', name: 'Construct Plane', nick: 'Pl', ins: [{ n: 'O', d: P(0, 0, 0) }, { n: 'X', d: P(1, 0, 0) }, { n: 'Y', d: P(0, 1, 0) }], outs: ['P'], item: (o, x, y) => [mkPln(vecA(o, 'O'), vecA(x, 'X'), vecA(y, 'Y'))] },
  plnnormal: { cat: 'Vector', name: 'Plane Normal', nick: 'PlN', ins: [{ n: 'O', d: P(0, 0, 0) }, { n: 'Z', d: P(0, 0, 1) }], outs: ['P'], item: (o, z) => [plnFromZ(vecA(o, 'O'), vecA(z, 'Z'))] },
  pln3pt: { cat: 'Vector', name: 'Plane 3Pt', nick: 'Pl3Pt', ins: [{ n: 'A', d: P(0, 0, 0) }, { n: 'B', d: P(1, 0, 0) }, { n: 'C', d: P(0, 1, 0) }], outs: ['P'], item: (a, b, c) => { a = vecA(a, 'A'); return [mkPln(a, vsub(vecA(b, 'B'), a), vsub(vecA(c, 'C'), a))]; } },
  deplane: { cat: 'Vector', name: 'Deconstruct Plane', nick: 'DePl', ins: [{ n: 'P' }], outs: ['O', 'X', 'Y', 'Z'], item: p => { const F = asPln(p, 'P'); return [P(...F.o), P(...F.x), P(...F.y), P(...F.z)]; } },
  plnoffset: { cat: 'Vector', name: 'Offset Plane', nick: 'PlOff', ins: [{ n: 'P' }, { n: 'D', d: 1 }], outs: ['P'], item: (p, d) => { const F = asPln(p, 'P'); return [{ ...F, o: onPln(F, 0, 0, num(d, 'D')) }]; } },
  plnrot: { cat: 'Vector', name: 'Rotate Plane', nick: 'PRot', ins: [{ n: 'P' }, { n: 'A', d: 45 }], outs: ['P'], item: (p, a) => { const F = asPln(p, 'P'); a = num(a, 'A') * D2R; const c = Math.cos(a), s = Math.sin(a); return [{ ...F, x: vadd(vmul(F.x, c), vmul(F.y, s)), y: vadd(vmul(F.y, c), vmul(F.x, -s)) }]; } },
  plnpt: { cat: 'Vector', name: 'Plane Point (u,v,w)', nick: 'PlPt', ins: [{ n: 'P' }, { n: 'U', d: 0 }, { n: 'V', d: 0 }, { n: 'W', d: 0 }], outs: ['Pt'], item: (p, u, v, w) => [P(...onPln(asPln(p, 'P'), num(u, 'U'), num(v, 'V'), num(w, 'W')))] },
  plncoord: { cat: 'Vector', name: 'Plane Coordinates', nick: 'PlCoord', ins: [{ n: 'Pt' }, { n: 'P' }], outs: ['U', 'V', 'W'], item: (pt, p) => inPln(asPln(p, 'P'), vecA(pt, 'Pt')) },
  dist: { cat: 'Vector', name: 'Distance', nick: 'Dist', ins: [{ n: 'A' }, { n: 'B' }], outs: ['D'], item: (a, b) => [vdist(centroid(asGeo(a)), centroid(asGeo(b)))] },
  cen: { cat: 'Vector', name: 'Centroid', nick: 'Cen', ins: [{ n: 'G' }], outs: ['C'], item: g => { const c = centroid(asGeo(g)); return [P(c[0], c[1], c[2])]; } },
  attractor: { cat: 'Vector', name: 'Attractor', nick: 'Attr', ins: [{ n: 'G', list: true }, { n: 'A', list: true }, { n: 'T0', d: 0.1 }, { n: 'T1', d: 1 }, { n: 'I', d: false }], outs: ['F', 'D'],
    run: I => { const A = I[1].map(a => centroid(asGeo(a))); if (!A.length) throw new Error('A (çekim noktası) boş'); const D = I[0].map(g => { const c = centroid(asGeo(g)); return Math.min(...A.map(a => vdist(a, c))); }); if (!D.length) return [[], []]; const lo = Math.min(...D), hi = Math.max(...D), t0 = num(I[2][0] ?? 0.1, 'T0'), t1 = num(I[3][0] ?? 1, 'T1'), inv = bool(I[4][0] ?? false); return [D.map(d => { let u = hi > lo ? (d - lo) / (hi - lo) : 0; if (inv) u = 1 - u; return t0 + (t1 - t0) * u; }), D]; } },
  populate: { cat: 'Vector', name: 'Populate 2D', nick: 'Pop2D', ins: [{ n: 'X', d: 20 }, { n: 'Y', d: 10 }, { n: 'N', d: 30 }, { n: 'S', d: 1 }, { n: 'Z', d: 0 }], outs: ['P'],
    item: (x, y, n, s, z) => { x = num(x, 'X'); y = num(y, 'Y'); n = Math.round(num(n, 'N')); z = num(z, 'Z'); if (n < 0 || n > 1500) throw new Error('N 0–1500 arası'); const r = rng(num(s, 'S') + 3), out = [];
      for (let i = 0; i < n; i++) { let best = null, bd = -1; for (let k = 0; k < 12; k++) { const c = [r() * x, r() * y]; let d = Infinity; for (const p of out) d = Math.min(d, (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2); if (d > bd) { bd = d; best = c; } } out.push(best); }
      return [out.map(p => P(p[0], p[1], z))]; } },

  /* ---- Curve ---- */
  line: { cat: 'Curve', name: 'Line', nick: 'Ln', ins: [{ n: 'A', d: P(0, 0, 0) }, { n: 'B', d: P(0, 0, 10) }], outs: ['L'], item: (a, b) => { a = asPt(a, 'A'); b = asPt(b, 'B'); return [{ t: 'crv', p: [[a.x, a.y, a.z], [b.x, b.y, b.z]], c: false }]; } },
  polyline: { cat: 'Curve', name: 'Polyline', nick: 'PLine', ins: [{ n: 'V', list: true }, { n: 'C', d: false }], outs: ['Pl'],
    run: I => { const p = I[0].map(x => { x = asPt(x, 'V'); return [x.x, x.y, x.z]; }); if (p.length < 2) throw new Error('En az 2 nokta'); return [[{ t: 'crv', c: bool(I[1][0] ?? false) && p.length > 2, p }]]; } },
  rect: { cat: 'Curve', name: 'Rectangle', nick: 'Rec', ins: [{ n: 'P', d: P(0, 0, 0) }, { n: 'X', d: 10 }, { n: 'Y', d: 5 }], outs: ['R'],
    item: (p, x, y) => { const F = asPln(p, 'P'); x = num(x, 'X'); y = num(y, 'Y'); return [{ t: 'crv', c: true, p: [onPln(F, 0, 0), onPln(F, x, 0), onPln(F, x, y), onPln(F, 0, y)] }]; } },
  circle: { cat: 'Curve', name: 'Circle', nick: 'Cir', ins: [{ n: 'P', d: P(0, 0, 0) }, { n: 'R', d: 5 }], outs: ['C'],
    item: (p, r) => { const F = asPln(p, 'P'); r = num(r, 'R'); return [{ t: 'crv', c: true, p: Array.from({ length: 48 }, (_, i) => onPln(F, Math.cos(i / 48 * 2 * Math.PI) * r, Math.sin(i / 48 * 2 * Math.PI) * r)) }]; } },
  arc: { cat: 'Curve', name: 'Arc', nick: 'Arc', ins: [{ n: 'P', d: P(0, 0, 0) }, { n: 'R', d: 5 }, { n: 'A0', d: 0 }, { n: 'A1', d: 180 }], outs: ['A'],
    item: (p, r, a0, a1) => { const F = asPln(p, 'P'); r = num(r, 'R'); a0 = num(a0, 'A0') * D2R; a1 = num(a1, 'A1') * D2R; const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 24))); return [{ t: 'crv', c: false, p: Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return onPln(F, Math.cos(a) * r, Math.sin(a) * r); }) }]; } },
  polygon: { cat: 'Curve', name: 'Polygon', nick: 'Pol', ins: [{ n: 'P', d: P(0, 0, 0) }, { n: 'R', d: 5 }, { n: 'S', d: 6 }], outs: ['P'],
    item: (p, r, s) => { const F = asPln(p, 'P'); r = num(r, 'R'); s = Math.max(3, Math.round(num(s, 'S'))); return [{ t: 'crv', c: true, p: Array.from({ length: s }, (_, i) => onPln(F, Math.cos(i / s * 2 * Math.PI) * r, Math.sin(i / s * 2 * Math.PI) * r)) }]; } },
  interp: { cat: 'Curve', name: 'Interpolate', nick: 'IntCrv', ins: [{ n: 'V', list: true }, { n: 'C', d: false }], outs: ['C'],
    run: I => { const p = I[0].map(x => { x = asPt(x, 'V'); return [x.x, x.y, x.z]; }); if (p.length < 2) throw new Error('En az 2 nokta gerekli'); const cl = bool(I[1][0] ?? false) && p.length > 2; return [[{ t: 'crv', c: cl, p: catmull(p, 8, cl) }]]; } },
  divc: { cat: 'Curve', name: 'Divide Curve', nick: 'Div', ins: [{ n: 'C' }, { n: 'N', d: 10 }], outs: ['P'],
    item: (c, n) => { c = asCrv(c, 'C'); n = Math.max(1, Math.round(num(n, 'N'))); return [resample(c.p, c.c ? n : n + 1, c.c).map(q => P(q[0], q[1], q[2]))]; } },
  evalc: { cat: 'Curve', name: 'Evaluate Curve', nick: 'Eval', ins: [{ n: 'C' }, { n: 't', d: 0.5 }], outs: ['P', 'T'],
    item: (c, t) => { const r = crvAt(asCrv(c, 'C'), num(t, 't')); return [P(...r.p), P(...r.t)]; } },
  pframe: { cat: 'Curve', name: 'Perp Frame', nick: 'PFrame', ins: [{ n: 'C' }, { n: 't', d: 0.5 }], outs: ['F'],
    item: (c, t) => { c = asCrv(c, 'C'); const r = crvAt(c, num(t, 't')); return [plnFromZ(r.p, r.t)]; } },
  pframes: { cat: 'Curve', name: 'Perp Frames', nick: 'PFrames', ins: [{ n: 'C' }, { n: 'N', d: 10 }], outs: ['F'],
    item: (c, n) => { c = asCrv(c, 'C'); n = Math.max(1, Math.round(num(n, 'N'))); if (n > 2000) throw new Error('N en fazla 2000'); const q = resample(c.p, c.c ? n : n + 1, c.c), Fr = ptFrames(c.c ? [...q, q[0]] : q);
      return [q.map((p, i) => mkPln(p, Fr.N[i], Fr.B[i]))]; } },
  clen: { cat: 'Curve', name: 'Length', nick: 'Len', ins: [{ n: 'C' }], outs: ['L'], item: c => [crvLength(asCrv(c, 'C'))] },
  offset: { cat: 'Curve', name: 'Offset (XY)', nick: 'Offset', ins: [{ n: 'C' }, { n: 'D', d: 1 }], outs: ['C'],
    item: (c, d) => { c = asCrv(c, 'C'); d = num(d, 'D'); const p = c.p, n = p.length, out = []; if (c.c) { let ar = 0; for (let i = 0; i < n; i++) { const q = p[i], r = p[(i + 1) % n]; ar += q[0] * r[1] - r[0] * q[1]; } if (ar > 0) d = -d; }
      const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
      for (let i = 0; i < n; i++) { const prev = c.c ? p[(i - 1 + n) % n] : i ? p[i - 1] : null, next = c.c ? p[(i + 1) % n] : i < n - 1 ? p[i + 1] : null;
        const n1 = prev ? nrm(prev, p[i]) : null, n2 = next ? nrm(p[i], next) : null; let m = n1 && n2 ? [n1[0] + n2[0], n1[1] + n2[1]] : (n1 || n2); const ml = Math.hypot(m[0], m[1]) || 1; m = [m[0] / ml, m[1] / ml];
        const k = d / Math.max(0.25, n1 && n2 ? m[0] * n1[0] + m[1] * n1[1] : 1); out.push([p[i][0] + m[0] * k, p[i][1] + m[1] * k, p[i][2]]); }
      return [{ t: 'crv', c: c.c, p: out }]; } },
  contour: { cat: 'Curve', name: 'Contour (Z)', nick: 'Contour', ins: [{ n: 'G' }, { n: 'D', d: 1 }], outs: ['C'],
    item: (g, d) => { g = asGeo(g); d = num(d, 'D'); if (d <= 0) throw new Error('D > 0 olmalı'); const T = triangles(g); if (!T.length) throw new Error('yüzey ya da mesh bekleniyor');
      let z0 = Infinity, z1 = -Infinity; for (const t of T) for (const p of t) { z0 = Math.min(z0, p[2]); z1 = Math.max(z1, p[2]); }
      const k0 = Math.ceil(z0 / d), k1 = Math.floor(z1 / d); if (k1 - k0 > 500) throw new Error('Çok fazla kesit'); const out = [];
      for (let k = k0; k <= k1; k++) { const h = k * d === z0 ? k * d + 1e-9 : k * d === z1 ? k * d - 1e-9 : k * d, segs = [];
        for (const t of T) { const pp = []; for (let e = 0; e < 3; e++) { const a = t[e], b = t[(e + 1) % 3]; if ((a[2] - h) * (b[2] - h) < 0) { const u = (h - a[2]) / (b[2] - a[2]); pp.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, h]); } } if (pp.length === 2) segs.push(pp); }
        out.push(...chain(segs, Math.max(1e-6, (z1 - z0 + 1) * 1e-6))); }
      return [out]; } },

  /* ---- Surface ---- */
  planesrf: { cat: 'Surface', name: 'Plane Surface', nick: 'PlnSrf', ins: [{ n: 'X', d: 20 }, { n: 'Y', d: 10 }, { n: 'Z', d: 0 }], outs: ['S'],
    item: (x, y, z) => { x = num(x, 'X'); y = num(y, 'Y'); z = num(z, 'Z'); return [{ t: 'srf', g: [[[0, 0, z], [x, 0, z]], [[0, y, z], [x, y, z]]] }]; } },
  loft: { cat: 'Surface', name: 'Loft', nick: 'Loft', ins: [{ n: 'C', list: true }], outs: ['L'],
    run: I => { const cs = I[0].map(c => asCrv(c, 'C')); if (cs.length < 2) throw new Error('En az 2 eğri gerekli'); const n = Math.max(...cs.map(c => c.p.length + (c.c ? 1 : 0)));
      return [[{ t: 'srf', closedU: cs[0].c, g: cs.map(c => { const r = resample(c.p, c.c ? n - 1 : n, c.c); if (c.c) r.push(r[0]); return r; }) }]]; } },
  extrude: { cat: 'Surface', name: 'Extrude Z', nick: 'Extr', ins: [{ n: 'C' }, { n: 'H', d: 5 }], outs: ['E'],
    item: (c, h) => { c = asCrv(c, 'C'); h = num(h, 'H'); const p = crvPoly(c); return [{ t: 'srf', g: [p, p.map(q => [q[0], q[1], q[2] + h])] }]; } },
  revolve: { cat: 'Surface', name: 'Revolve (Z)', nick: 'RevSrf', ins: [{ n: 'C' }, { n: 'A', d: 360 }], outs: ['S'],
    item: (c, a) => { c = asCrv(c, 'C'); a = num(a, 'A') * D2R; const n = Math.max(4, Math.ceil(Math.abs(a) / (Math.PI / 24))), prof = crvPoly(c); return [{ t: 'srf', g: Array.from({ length: n + 1 }, (_, j) => prof.map(p => rotZ(p, a * j / n))) }]; } },
  sweep: { cat: 'Surface', name: 'Sweep (ray + kesit)', nick: 'Swp', ins: [{ n: 'R' }, { n: 'S' }], outs: ['S'],
    item: (r, s) => { r = asCrv(r, 'R'); s = asCrv(s, 'S'); const rail = r.p.length > 120 ? resample(r.p, 120, r.c) : r.p.slice(); if (r.c) rail.push(rail[0]); const F = ptFrames(rail), sec = crvPoly(s);
      return [{ t: 'srf', g: rail.map((p, i) => sec.map(q => vadd(p, vadd(vmul(F.N[i], q[0]), vmul(F.B[i], q[1]))))) }]; } },
  pipe: { cat: 'Surface', name: 'Pipe', nick: 'Pipe', ins: [{ n: 'C' }, { n: 'R', d: 0.3 }], outs: ['P'],
    item: (c, r) => { c = asCrv(c, 'C'); r = num(r, 'R'); const rail = c.p.length > 160 ? resample(c.p, 160, c.c) : c.p.slice(); if (c.c) rail.push(rail[0]); const F = ptFrames(rail);
      return [{ t: 'srf', g: rail.map((p, i) => Array.from({ length: 17 }, (_, k) => { const a = k / 16 * 2 * Math.PI; return vadd(p, vadd(vmul(F.N[i], Math.cos(a) * r), vmul(F.B[i], Math.sin(a) * r))); })) }]; } },
  sframes: { cat: 'Surface', name: 'Surface Frames', nick: 'SFrames', ins: [{ n: 'S' }, { n: 'U', d: 6 }, { n: 'V', d: 4 }], outs: ['F'],
    item: (s, u, v) => { s = asSrf(s, 'S'); u = Math.max(1, Math.round(num(u, 'U'))); v = Math.max(1, Math.round(num(v, 'V'))); if ((u + 1) * (v + 1) > 5000) throw new Error('Çok fazla çerçeve'); const e = 1e-3, out = [];
      for (let j = 0; j <= v; j++) for (let i = 0; i <= u; i++) { const a = i / u, b = j / v, du = vsub(srfAt(s, Math.min(1, a + e), b), srfAt(s, Math.max(0, a - e), b)), dv = vsub(srfAt(s, a, Math.min(1, b + e)), srfAt(s, a, Math.max(0, b - e))); out.push(mkPln(srfAt(s, a, b), du, dv)); }
      return [out]; } },
  divs: { cat: 'Surface', name: 'Divide Surface', nick: 'SDivide', ins: [{ n: 'S' }, { n: 'U', d: 10 }, { n: 'V', d: 10 }], outs: ['P'],
    item: (s, u, v) => { s = asSrf(s, 'S'); u = Math.max(1, Math.round(num(u, 'U'))); v = Math.max(1, Math.round(num(v, 'V'))); const out = []; for (let j = 0; j <= v; j++) for (let i = 0; i <= u; i++) { const q = srfAt(s, i / u, j / v); out.push(P(q[0], q[1], q[2])); } return [out]; } },
  panels: { cat: 'Surface', name: 'Surface Panels', nick: 'Panels', ins: [{ n: 'S' }, { n: 'U', d: 10 }, { n: 'V', d: 10 }], outs: ['P'],
    item: (s, u, v) => { s = asSrf(s, 'S'); u = Math.max(1, Math.round(num(u, 'U'))); v = Math.max(1, Math.round(num(v, 'V'))); if (u * v > 8000) throw new Error('Çok fazla panel (U×V ≤ 8000)');
      const out = []; for (let j = 0; j < v; j++) for (let i = 0; i < u; i++) out.push(quad(srfAt(s, i / u, j / v), srfAt(s, (i + 1) / u, j / v), srfAt(s, (i + 1) / u, (j + 1) / v), srfAt(s, i / u, (j + 1) / v))); return [out]; } },
  sbox: { cat: 'Surface', name: 'Surface Box (twist)', nick: 'SBox', ins: [{ n: 'S' }, { n: 'U', d: 8 }, { n: 'V', d: 4 }, { n: 'H', list: true, d: 0.5 }], outs: ['B'],
    run: I => { if (I[0].length !== 1) { /* use first surface per branch */ } const s = asSrf(I[0][0], 'S'), u = Math.max(1, Math.round(num(I[1][0] ?? 8, 'U'))), v = Math.max(1, Math.round(num(I[2][0] ?? 4, 'V'))); if (u * v > 4000) throw new Error('Çok fazla kutu (U×V ≤ 4000)');
      const H = I[3].length ? I[3].map(x => num(x, 'H')) : [0.5], out = []; let k = 0;
      for (let j = 0; j < v; j++) for (let i = 0; i < u; i++) { const a = srfAt(s, i / u, j / v), b = srfAt(s, (i + 1) / u, j / v), c = srfAt(s, (i + 1) / u, (j + 1) / v), d = srfAt(s, i / u, (j + 1) / v);
        const nrm = vnorm(vcross(vsub(c, a), vsub(d, b))), h = H[Math.min(k++, H.length - 1)], top = [a, b, c, d].map(p => vadd(p, vmul(nrm, h)));
        out.push({ t: 'mesh', v: [a, b, c, d, ...top], f: [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]] }); }
      return [out]; } },
  box: { cat: 'Surface', name: 'Box', nick: 'Box', ins: [{ n: 'P', d: P(0, 0, 0) }, { n: 'X', d: 5 }, { n: 'Y', d: 5 }, { n: 'Z', d: 5 }], outs: ['B'],
    item: (p, x, y, z) => { p = asPt(p, 'P'); x = num(x, 'X'); y = num(y, 'Y'); z = num(z, 'Z'); const o = [p.x, p.y, p.z], v = [];
      for (const dz of [0, z]) for (const [dx, dy] of [[0, 0], [x, 0], [x, y], [0, y]]) v.push([o[0] + dx, o[1] + dy, o[2] + dz]);
      return [{ t: 'mesh', v, f: [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]] }]; } },
  sphere: { cat: 'Surface', name: 'Sphere', nick: 'Sph', ins: [{ n: 'P', d: P(0, 0, 0) }, { n: 'R', d: 3 }], outs: ['S'],
    item: (p, r) => { p = asPt(p, 'P'); r = num(r, 'R'); const g = []; for (let j = 0; j <= 12; j++) { const ph = -Math.PI / 2 + Math.PI * j / 12, row = []; for (let i = 0; i <= 24; i++) { const th = 2 * Math.PI * i / 24; row.push([p.x + r * Math.cos(ph) * Math.cos(th), p.y + r * Math.cos(ph) * Math.sin(th), p.z + r * Math.sin(ph)]); } g.push(row); } return [{ t: 'srf', g }]; } },
  voronoi: { cat: 'Surface', name: 'Voronoi', nick: 'Voronoi', ins: [{ n: 'P', list: true }, { n: 'B', opt: true, list: true }], outs: ['C'],
    run: I => { const S = I[0].map(p => { p = asPt(p, 'P'); return [p.x, p.y, p.z]; }); if (S.length < 2) throw new Error('En az 2 nokta'); if (S.length > 1500) throw new Error('En fazla 1500 nokta');
      let box; if (I[1].length) box = crvPoly(asCrv(I[1][0], 'B')).slice(0, asCrv(I[1][0], 'B').c ? -1 : undefined).map(p => [p[0], p[1], 0]);
      else { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of S) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } const m = Math.max(x1 - x0, y1 - y0) * 0.08 || 1; box = [[x0 - m, y0 - m, 0], [x1 + m, y0 - m, 0], [x1 + m, y1 + m, 0], [x0 - m, y1 + m, 0]]; }
      const out = S.map((s, i) => { let poly = box.map(p => [p[0], p[1], s[2]]); for (let j = 0; j < S.length && poly.length; j++) { if (j === i) continue; const o = S[j], a = o[0] - s[0], b = o[1] - s[1]; if (!a && !b) continue; poly = clipPoly(poly, a, b, (a * (o[0] + s[0]) + b * (o[1] + s[1])) / 2); } return poly.length > 2 ? { t: 'crv', c: true, p: poly } : null; }).filter(Boolean);
      return [out]; } },
  delaunay: { cat: 'Surface', name: 'Delaunay Mesh', nick: 'Del', ins: [{ n: 'P', list: true }], outs: ['M'],
    run: I => { const S = I[0].map(p => { p = asPt(p, 'P'); return [p.x, p.y, p.z]; }); if (S.length < 3) throw new Error('En az 3 nokta'); if (S.length > 1500) throw new Error('En fazla 1500 nokta'); return [[{ t: 'mesh', v: S, f: delaunay(S) }]]; } },

  /* ---- Transform ---- */
  move: { cat: 'Transform', name: 'Move', nick: 'Move', ins: [{ n: 'G' }, { n: 'T', d: P(0, 0, 10) }], outs: ['G'], item: (g, t) => { t = asPt(t, 'T'); return [mapG(asGeo(g), p => [p[0] + t.x, p[1] + t.y, p[2] + t.z])]; } },
  rotate: { cat: 'Transform', name: 'Rotate Z', nick: 'Rot', ins: [{ n: 'G' }, { n: 'A', d: 90 }, { n: 'C', opt: true }], outs: ['G'], item: (g, a, c) => { a = num(a, 'A') * D2R; const cc = c ? (isPt(c) ? [c.x, c.y, c.z] : centroid(asGeo(c))) : [0, 0, 0]; return [mapG(asGeo(g), p => rotZ(p, a, cc))]; } },
  scale: { cat: 'Transform', name: 'Scale', nick: 'Scale', ins: [{ n: 'G' }, { n: 'F', d: 0.5 }], outs: ['G'], item: (g, f) => { g = asGeo(g); f = num(f, 'F'); const c = centroid(g); return [mapG(g, p => [c[0] + (p[0] - c[0]) * f, c[1] + (p[1] - c[1]) * f, c[2] + (p[2] - c[2]) * f])]; } },
  mirror: { cat: 'Transform', name: 'Mirror (YZ)', nick: 'Mirror', ins: [{ n: 'G' }, { n: 'X', d: 0 }], outs: ['G'], item: (g, x) => { x = num(x, 'X'); return [mapG(asGeo(g), p => [2 * x - p[0], p[1], p[2]])]; } },
  orient: { cat: 'Transform', name: 'XY → XZ', nick: 'ToXZ', ins: [{ n: 'G' }], outs: ['G'], item: g => [mapG(asGeo(g), p => [p[0], -p[2], p[1]])] },
  orientp: { cat: 'Transform', name: 'Orient (plane → plane)', nick: 'Orient', ins: [{ n: 'G' }, { n: 'A', d: P(0, 0, 0) }, { n: 'B' }], outs: ['G'],
    item: (g, a, b) => { const A = asPln(a, 'A'), B = asPln(b, 'B'); return [mapG(asGeo(g), p => { const l = inPln(A, p); return onPln(B, l[0], l[1], l[2]); })]; } },
  rot3d: { cat: 'Transform', name: 'Rotate (plane axis)', nick: 'Rot3D', ins: [{ n: 'G' }, { n: 'A', d: 90 }, { n: 'P', d: P(0, 0, 0) }], outs: ['G'],
    item: (g, a, p) => { const F = asPln(p, 'P'); a = num(a, 'A') * D2R; return [mapG(asGeo(g), q => rotAxis(q, F.o, F.z, a))]; } },
  mirrorp: { cat: 'Transform', name: 'Mirror (plane)', nick: 'MirP', ins: [{ n: 'G' }, { n: 'P' }], outs: ['G'],
    item: (g, p) => { const F = asPln(p, 'P'); return [mapG(asGeo(g), q => { const d = vdot(vsub(q, F.o), F.z); return vsub(q, vmul(F.z, 2 * d)); })]; } },
  linarr: { cat: 'Transform', name: 'Linear Array', nick: 'ArrLin', ins: [{ n: 'G' }, { n: 'D', d: P(0, 0, 3) }, { n: 'N', d: 5 }], outs: ['G'],
    item: (g, d, n) => { g = asGeo(g); d = asPt(d, 'D'); n = Math.round(num(n, 'N')); if (n < 1 || n > 1000) throw new Error('N 1–1000 arası'); return [Array.from({ length: n }, (_, i) => mapG(g, p => [p[0] + d.x * i, p[1] + d.y * i, p[2] + d.z * i]))]; } },
  polarr: { cat: 'Transform', name: 'Polar Array', nick: 'ArrPol', ins: [{ n: 'G' }, { n: 'N', d: 6 }], outs: ['G'],
    item: (g, n) => { g = asGeo(g); n = Math.round(num(n, 'N')); if (n < 1 || n > 1000) throw new Error('N 1–1000 arası'); return [Array.from({ length: n }, (_, i) => mapG(g, p => rotZ(p, 2 * Math.PI * i / n)))]; } },

  /* ---- Display ---- */
  gradient: { cat: 'Display', name: 'Gradient', nick: 'Grad', ins: [{ n: 'V', list: true }], outs: ['C'],
    run: I => { const v = I[0].map(x => num(x, 'V')); if (!v.length) return [[]]; const lo = Math.min(...v), hi = Math.max(...v); return [v.map(x => ({ t: 'col', hex: ramp(hi > lo ? (x - lo) / (hi - lo) : 0.5) }))]; } },
  cprev: { cat: 'Display', name: 'Custom Preview', nick: 'Preview', ins: [{ n: 'G', tree: true }, { n: 'C', tree: true, opt: true }], outs: [], ui: 'cprev',
    tree: (I, st, n) => { const G = flat(I[0]).filter(isGeo), Cv = flat(I[1]); let cols, legend = null;
      if (!Cv.length) cols = G.map(() => '#c47a2c');
      else if (Cv.every(isCol)) cols = G.map((_, i) => Cv[Math.min(i, Cv.length - 1)].hex);
      else { const v = Cv.map(x => num(x, 'C')), lo = Math.min(...v), hi = Math.max(...v); cols = G.map((_, i) => ramp(hi > lo ? (v[Math.min(i, v.length - 1)] - lo) / (hi - lo) : 0.5)); legend = { lo, hi }; }
      info[n.id] = { ...(info[n.id] || {}), cp: { G, cols, legend } }; return []; } },

  /* ---- Facade ---- */
  planarity: { cat: 'Facade', name: 'Panel Planarity', nick: 'Planar', ins: [{ n: 'P', list: true }, { n: 'T1', d: 0.005 }, { n: 'T2', d: 0.05 }], outs: ['D', 'K', 'C'],
    run: I => { const t1 = num(I[1][0] ?? 0.005, 'T1'), t2 = num(I[2][0] ?? 0.05, 'T2'), D = [], K = [], Cc = [];
      for (const g0 of I[0]) { const g = asGeo(g0); let dev = 0;
        if (g.t === 'mesh') for (const f of g.f) { if (f.length < 4) continue; const [a, b, c, d] = f.map(i => g.v[i]); const nrm = vcross(vsub(b, a), vsub(d, a)), l = vlen(nrm); if (l) dev = Math.max(dev, Math.abs(vdot(vsub(c, a), nrm)) / l); }
        else if (g.t === 'srf') { const G = g.g; for (let j = 0; j < G.length - 1; j++) for (let i = 0; i < G[0].length - 1; i++) { const a = G[j][i], b = G[j][i + 1], c = G[j + 1][i + 1], d = G[j + 1][i]; const nrm = vcross(vsub(b, a), vsub(d, a)), l = vlen(nrm); if (l) dev = Math.max(dev, Math.abs(vdot(vsub(c, a), nrm)) / l); } }
        const k = dev <= t1 ? 0 : dev <= t2 ? 1 : 2; D.push(dev); K.push(k); Cc.push({ t: 'col', hex: CLASS_COL[k] }); }
      return [D, K, Cc]; } },
  schedule: { cat: 'Facade', name: 'Panel Schedule', nick: 'Schedule', ins: [{ n: 'P', tree: true }, { n: 'R', d: 0.01 }], outs: ['T', 'N', 'C'], ui: 'sched',
    tree: (I, st, n) => { const R = Math.max(1e-6, num(flat(I[1])[0] ?? 0.01, 'R')), all = flat(I[0]).filter(isGeo), types = new Map(), idx = [], rd = v => Math.round(v / R) * R;
      for (const g of all) { if (g.t !== 'mesh' || g.f.length !== 1 || g.f[0].length !== 4) { idx.push(-1); continue; } const v = g.f[0].map(i => g.v[i]); const e = [0, 1, 2, 3].map(i => vdist(v[i], v[(i + 1) % 4])), dg = [vdist(v[0], v[2]), vdist(v[1], v[3])];
        const key = [rd((e[0] + e[2]) / 2), rd((e[1] + e[3]) / 2), ...[...e].map(rd).sort((a, b) => a - b), ...dg.map(rd).sort((a, b) => a - b)].map(x => x.toFixed(6)).join('|');
        if (!types.has(key)) types.set(key, { w: (e[0] + e[2]) / 2, h: (e[1] + e[3]) / 2, e, dg, n: 0, area: vlen(vcross(vsub(v[2], v[0]), vsub(v[3], v[1]))) / 2 }); const ty = types.get(key); ty.n++; idx.push(key); }
      const list = [...types.entries()].sort((a, b) => b[1].n - a[1].n), order = new Map(list.map(([k], i) => [k, i]));
      const name = i => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
      const T = idx.map(k => k === -1 ? -1 : order.get(k));
      info[n.id] = { ...(info[n.id] || {}), sched: { rows: list.map(([, t], i) => ({ name: name(i), ...t })), total: all.length, R } };
      return [T1(T), T1([list.length]), T1(T.map(i => ({ t: 'col', hex: i < 0 ? '#999999' : TYPE_COL[i % TYPE_COL.length] })))]; } },

  /* ======== v4 ======== */
  /* ---- Params ---- */
  vlist: { cat: 'Params', name: 'Value List', nick: 'List', ins: [], outs: ['V'], ui: 'vlist', st: { label: 'Liste', items: 'Bir=1; İki=2; Üç=3', sel: 0 },
    run: (I, st) => { const it = vlistItems(st); if (!it.length) throw new Error('Liste boş'); return [[it[Math.min(st.sel, it.length - 1)].v]]; } },
  textp: { cat: 'Params', name: 'Text', nick: 'Text', ins: [], outs: ['T'], ui: 'textin', st: { label: 'Yazı', val: 'P-' }, run: (I, st) => [[String(st.val)]] },
  recorder: { cat: 'Params', name: 'Data Recorder', nick: 'Rec', ins: [{ n: 'D', tree: true }], outs: ['R'], ui: 'rec', st: { on: true, max: 200, data: [] },
    tree: (I, st) => { const vals = flat(I[0]).filter(v => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean' || isPt(v)); const key = JSON.stringify(vals);
      if (st.on && vals.length && key !== st.last) { st.data.push(vals); st.last = key; if (st.data.length > st.max) st.data.splice(0, st.data.length - st.max); }
      return [st.data.map((v, i) => ({ p: [i], v: v.slice() }))]; } },
  optim: { cat: 'Params', name: 'Optimizer (Galapagos)', nick: 'Optim', ins: [{ n: 'F', tree: true, opt: true }], outs: [], ui: 'optim', st: { ids: [], goal: 'min', gens: 25, pop: 16, best: null, hist: [] }, tree: () => [] },

  /* ---- Maths ---- */
  cdomain: { cat: 'Maths', name: 'Construct Domain', nick: 'Dom', ins: [{ n: 'A', d: 0 }, { n: 'B', d: 1 }], outs: ['I'], item: (a, b) => [DOM(num(a, 'A'), num(b, 'B'))] },
  ddomain: { cat: 'Maths', name: 'Deconstruct Domain', nick: 'DeDom', ins: [{ n: 'I' }], outs: ['S', 'E'], item: d => { d = asDom(d, 'I'); return [d.a, d.b]; } },
  bounds: { cat: 'Maths', name: 'Bounds', nick: 'Bnd', ins: [{ n: 'N', list: true }], outs: ['I'], run: I => { const v = I[0].map(x => num(x, 'N')); if (!v.length) return [[]]; return [[DOM(Math.min(...v), Math.max(...v))]]; } },
  round: { cat: 'Maths', name: 'Round', nick: 'Round', ins: [{ n: 'x' }], outs: ['N', 'F', 'C'], item: x => { x = num(x, 'x'); return [Math.round(x), Math.floor(x), Math.ceil(x)]; } },
  absv: { cat: 'Maths', name: 'Absolute', nick: 'Abs', ins: [{ n: 'x' }], outs: ['y'], item: x => [Math.abs(num(x, 'x'))] },
  modulus: { cat: 'Maths', name: 'Modulus', nick: 'Mod', ins: [{ n: 'A' }, { n: 'B', d: 2 }], outs: ['R'], item: (a, b) => { a = num(a, 'A'); b = num(b, 'B'); if (!b) throw new Error('B sıfır olamaz'); return [((a % b) + b) % b]; } },
  massadd: { cat: 'Maths', name: 'Mass Addition', nick: 'MA', ins: [{ n: 'I', list: true }], outs: ['R', 'Pr'], run: I => { let s = 0; const pr = I[0].map(x => (s += num(x, 'I'))); return [[s], pr]; } },
  average: { cat: 'Maths', name: 'Average', nick: 'Avr', ins: [{ n: 'I', list: true }], outs: ['AM'], run: I => { const v = I[0].map(x => num(x, 'I')); return [v.length ? [v.reduce((a, b) => a + b, 0) / v.length] : []]; } },
  equality: { cat: 'Maths', name: 'Equality', nick: 'Eq', ins: [{ n: 'A' }, { n: 'B' }], outs: ['=', '≠'], item: (a, b) => { const e = typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 1e-9 : fmt(a) === fmt(b); return [e, !e]; } },
  gand: { cat: 'Maths', name: 'Gate And', nick: 'And', ins: [{ n: 'A' }, { n: 'B' }], outs: ['R'], item: (a, b) => [bool(a) && bool(b)] },
  gor: { cat: 'Maths', name: 'Gate Or', nick: 'Or', ins: [{ n: 'A' }, { n: 'B' }], outs: ['R'], item: (a, b) => [bool(a) || bool(b)] },
  gnot: { cat: 'Maths', name: 'Gate Not', nick: 'Not', ins: [{ n: 'A' }], outs: ['R'], item: a => [!bool(a)] },

  /* ---- Sets ---- */
  crossref: { cat: 'Sets', name: 'Cross Reference', nick: 'CrossRef', ins: [{ n: 'A', list: true }, { n: 'B', list: true }], outs: ['A', 'B'],
    run: I => { const A = [], B = []; if (I[0].length * I[1].length > 200000) throw new Error('Çok fazla kombinasyon'); for (const a of I[0]) for (const b of I[1]) { A.push(a); B.push(b); } return [A, B]; } },
  dupdata: { cat: 'Sets', name: 'Duplicate Data', nick: 'Dup', ins: [{ n: 'D', list: true }, { n: 'N', d: 2 }, { n: 'O', d: true }], outs: ['D'],
    run: I => { const n = Math.max(0, Math.round(num(I[1][0] ?? 2, 'N'))), L = I[0]; if (n * L.length > 200000) throw new Error('Çok fazla öğe'); const out = []; if (bool(I[2][0] ?? true)) for (let k = 0; k < n; k++) out.push(...L); else for (const x of L) for (let k = 0; k < n; k++) out.push(x); return [out]; } },
  weave: { cat: 'Sets', name: 'Weave', nick: 'Weave', ins: [{ n: 'P', list: true, d: 0 }, { n: 'D0', list: true, opt: true }, { n: 'D1', list: true, opt: true }, { n: 'D2', list: true, opt: true }], outs: ['W'],
    run: I => { const pat = (I[0].length ? I[0] : [0, 1]).map(x => Math.round(num(x, 'P'))), S = [I[1], I[2], I[3]], ix = [0, 0, 0], out = []; let k = 0, guard = 0;
      while (S.some((s, j) => ix[j] < s.length) && guard++ < 400000) { const j = pat[k++ % pat.length]; if (j < 0 || j > 2) throw new Error('P: 0, 1 ya da 2'); if (ix[j] < S[j].length) out.push(S[j][ix[j]++]); else if (!S.some((s, q) => pat.includes(q) && ix[q] < s.length)) break; }
      return [out]; } },
  splitlist: { cat: 'Sets', name: 'Split List', nick: 'Split', ins: [{ n: 'L', list: true }, { n: 'i', d: 1 }], outs: ['A', 'B'], run: I => { const i = Math.round(num(I[1][0] ?? 1, 'i')); return [I[0].slice(0, i), I[0].slice(i)]; } },
  sublist: { cat: 'Sets', name: 'Sub List', nick: 'SubSet', ins: [{ n: 'L', list: true }, { n: 'D', d: DOM(0, 2) }], outs: ['L', 'I'],
    run: I => { const d = asDom(I[1][0] ?? DOM(0, 2), 'D'), a = Math.max(0, Math.round(Math.min(d.a, d.b))), b = Math.min(I[0].length - 1, Math.round(Math.max(d.a, d.b))), idx = []; for (let i = a; i <= b; i++) idx.push(i); return [idx.map(i => I[0][i]), idx]; } },
  createset: { cat: 'Sets', name: 'Create Set', nick: 'CSet', ins: [{ n: 'L', list: true }], outs: ['S', 'M'],
    run: I => { const m = new Map(), S = [], M = []; for (const x of I[0]) { const k = typeof x === 'number' ? fmt(x) : fmt(x) + (isGeo(x) && !isPt(x) ? JSON.stringify(pts(x).slice(0, 4)) : ''); if (!m.has(k)) { m.set(k, S.length); S.push(x); } M.push(m.get(k)); } return [S, M]; } },
  explodetree: { cat: 'Sets', name: 'Explode Tree', nick: 'BANG!', ins: [{ n: 'D', tree: true }], outs: ['B0', 'B1', 'B2', 'B3', 'B4'],
    tree: (I, st, n) => { const T = I[0] || []; if (T.length > 5) info[n.id] = { ...(info[n.id] || {}), warn: `${T.length} dal var, ilk 5'i çıkarıldı` }; return [0, 1, 2, 3, 4].map(i => T[i] ? T1(T[i].v.slice()) : []); } },
  shiftpaths: { cat: 'Sets', name: 'Shift Paths', nick: 'PShift', ins: [{ n: 'D', tree: true }, { n: 'O', d: -1 }], outs: ['D'],
    tree: I => { const o = Math.round(num(flat(I[1])[0] ?? -1, 'O')); return [mergeTrees([(I[0] || []).map(b => { let p = o >= 0 ? b.p.slice(o) : b.p.slice(0, Math.max(0, b.p.length + o)); if (!p.length) p = [0]; return { p, v: b.v.slice() }; })])]; } },
  pathmap: { cat: 'Sets', name: 'Path Mapper', nick: 'PMap', ins: [{ n: 'D', tree: true }], outs: ['D'], ui: 'expr', st: { expr: '{A;B} -> {A}' },
    tree: (I, st) => { const m = String(st.expr).match(/^\s*\{([^}]*)\}\s*(?:\(\s*([A-Za-z_]\w*)\s*\))?\s*->\s*\{([^}]*)\}\s*$/); if (!m) throw new Error('Biçim: {A;B} -> {B;A}  ·  (i) ile öğe: {A}(i) -> {i}');
      const names = m[1].split(';').map(s => s.trim()).filter(Boolean), iv = m[2] || 'i', tg = m[3].split(';').map(s => compileExpr(s.trim() || '0')), out = new Map();
      const T = I[0] || []; T.forEach((b, bi) => b.v.forEach((v, i) => { const vars = { N: T.length, b: bi }; vars[iv] = i; names.forEach((nm, k) => vars[nm] = b.p[k] ?? 0); const p = tg.map(f => Math.round(f(vars))), key = pkey(p); if (!out.has(key)) out.set(key, { p, v: [] }); out.get(key).v.push(v); }));
      return [[...out.values()].sort((a, b) => { for (let k = 0; k < Math.min(a.p.length, b.p.length); k++) if (a.p[k] !== b.p[k]) return a.p[k] - b.p[k]; return a.p.length - b.p.length; })]; } },

  /* ---- Vector ---- */
  vec2pt: { cat: 'Vector', name: 'Vector 2Pt', nick: 'Vec2Pt', ins: [{ n: 'A', d: P(0, 0, 0) }, { n: 'B', d: P(1, 0, 0) }, { n: 'U', d: false }], outs: ['V', 'L'], item: (a, b, u) => { const v = vsub(vecA(b, 'B'), vecA(a, 'A')), l = vlen(v), r = bool(u) ? vnorm(v) : v; return [P(...r), l]; } },
  amplitude: { cat: 'Vector', name: 'Amplitude', nick: 'Amp', ins: [{ n: 'V' }, { n: 'A', d: 1 }], outs: ['V'], item: (v, a) => [P(...vmul(vnorm(vecA(v, 'V')), num(a, 'A')))] },
  unitx: { cat: 'Vector', name: 'Unit X', nick: 'X', ins: [{ n: 'F', d: 1 }], outs: ['V'], item: f => [P(num(f, 'F'), 0, 0)] },
  unity: { cat: 'Vector', name: 'Unit Y', nick: 'Y', ins: [{ n: 'F', d: 1 }], outs: ['V'], item: f => [P(0, num(f, 'F'), 0)] },
  vrev: { cat: 'Vector', name: 'Reverse Vector', nick: 'Rev', ins: [{ n: 'V' }], outs: ['V'], item: v => [P(...vmul(vecA(v, 'V'), -1))] },
  vangle: { cat: 'Vector', name: 'Angle', nick: 'Angle', ins: [{ n: 'A' }, { n: 'B' }, { n: 'P', opt: true }], outs: ['A', 'R'],
    item: (a, b, p) => { let A = vecA(a, 'A'), B = vecA(b, 'B'); if (p !== undefined) { const F = asPln(p, 'P'); A = vsub(A, vmul(F.z, vdot(A, F.z))); B = vsub(B, vmul(F.z, vdot(B, F.z))); let ang = Math.atan2(vdot(vcross(A, B), F.z), vdot(A, B)) / D2R; if (ang < 0) ang += 360; return [ang, 360 - ang]; }
      const ang = Math.acos(Math.max(-1, Math.min(1, vdot(vnorm(A), vnorm(B))))) / D2R; return [ang, 360 - ang]; } },
  crossp: { cat: 'Vector', name: 'Cross Product', nick: 'XProd', ins: [{ n: 'A' }, { n: 'B' }, { n: 'U', d: false }], outs: ['V', 'L'], item: (a, b, u) => { const v = vcross(vecA(a, 'A'), vecA(b, 'B')); return [P(...(bool(u) ? vnorm(v) : v)), vlen(v)]; } },
  dotp: { cat: 'Vector', name: 'Dot Product', nick: 'DProd', ins: [{ n: 'A' }, { n: 'B' }, { n: 'U', d: false }], outs: ['D'], item: (a, b, u) => { let A = vecA(a, 'A'), B = vecA(b, 'B'); if (bool(u)) { A = vnorm(A); B = vnorm(B); } return [vdot(A, B)]; } },
  closestpt: { cat: 'Vector', name: 'Closest Point', nick: 'CP', ins: [{ n: 'P' }, { n: 'C', list: true }], outs: ['P', 'i', 'D'],
    item: (p, C) => { const q = ptArr(p); let bi = -1, bd = Infinity; C.forEach((c, i) => { const d = vdist(q, ptArr(c)); if (d < bd) { bd = d; bi = i; } }); if (bi < 0) throw new Error('C boş'); return [C[bi], bi, bd]; } },
  sqgrid: { cat: 'Vector', name: 'Square Grid', nick: 'SqGrid', ins: [{ n: 'P', d: P(0, 0, 0) }, { n: 'S', d: 1 }, { n: 'Ex', d: 10 }, { n: 'Ey', d: 10 }], outs: ['C', 'P'],
    run: I => recGrid(I[0][0] ?? P(0, 0, 0), num(I[1][0] ?? 1, 'S'), num(I[1][0] ?? 1, 'S'), I[2][0] ?? 10, I[3][0] ?? 10) },
  recgrid: { cat: 'Vector', name: 'Rectangular Grid', nick: 'RecGrid', ins: [{ n: 'P', d: P(0, 0, 0) }, { n: 'Sx', d: 2 }, { n: 'Sy', d: 1 }, { n: 'Ex', d: 10 }, { n: 'Ey', d: 10 }], outs: ['C', 'P'],
    run: I => recGrid(I[0][0] ?? P(0, 0, 0), num(I[1][0] ?? 2, 'Sx'), num(I[2][0] ?? 1, 'Sy'), I[3][0] ?? 10, I[4][0] ?? 10) },
  hexgrid: { cat: 'Vector', name: 'Hexagonal Grid', nick: 'HexGrid', ins: [{ n: 'P', d: P(0, 0, 0) }, { n: 'S', d: 1 }, { n: 'Ex', d: 8 }, { n: 'Ey', d: 8 }], outs: ['C', 'P'],
    run: I => { const F = asPln(I[0][0] ?? P(0, 0, 0), 'P'), s = num(I[1][0] ?? 1, 'S'), ex = Math.round(num(I[2][0] ?? 8, 'Ex')), ey = Math.round(num(I[3][0] ?? 8, 'Ey')); if (ex * ey > 20000 || ex < 1 || ey < 1) throw new Error('Ex×Ey 1–20000'); const w = Math.sqrt(3) * s, Cc = [], Pc = [];
      for (let i = 0; i < ex; i++) { const cc = [], pc = []; for (let j = 0; j < ey; j++) { const cx = i * w + (j % 2 ? w / 2 : 0), cy = j * 1.5 * s; pc.push(P(...onPln(F, cx, cy))); cc.push({ t: 'crv', c: true, p: Array.from({ length: 6 }, (_, k) => { const a = (30 + 60 * k) * D2R; return onPln(F, cx + Math.cos(a) * s, cy + Math.sin(a) * s); }) }); } Cc.push(cc); Pc.push(pc); }
      return [gridBranches(Cc), gridBranches(Pc)]; } },
  radgrid: { cat: 'Vector', name: 'Radial Grid', nick: 'RadGrid', ins: [{ n: 'P', d: P(0, 0, 0) }, { n: 'S', d: 1 }, { n: 'Er', d: 5 }, { n: 'Ep', d: 12 }], outs: ['C', 'P'],
    run: I => { const F = asPln(I[0][0] ?? P(0, 0, 0), 'P'), s = num(I[1][0] ?? 1, 'S'), er = Math.round(num(I[2][0] ?? 5, 'Er')), ep = Math.round(num(I[3][0] ?? 12, 'Ep')); if (er < 1 || ep < 3 || er * ep > 20000) throw new Error('Er ≥ 1, Ep ≥ 3'); const Cc = [], Pc = [], seg = 6;
      const at = (r, a) => onPln(F, Math.cos(a) * r, Math.sin(a) * r);
      for (let k = 0; k < ep; k++) { const a0 = k / ep * 2 * Math.PI, a1 = (k + 1) / ep * 2 * Math.PI, cc = [], pc = []; for (let r = 0; r <= er; r++) pc.push(P(...at(r * s, a0)));
        for (let r = 0; r < er; r++) { const pts2 = []; for (let q = 0; q <= seg; q++) pts2.push(at((r + 1) * s, a0 + (a1 - a0) * q / seg)); if (r === 0) pts2.push(F.o.slice()); else for (let q = seg; q >= 0; q--) pts2.push(at(r * s, a0 + (a1 - a0) * q / seg)); cc.push({ t: 'crv', c: true, p: pts2 }); }
        Cc.push(cc); Pc.push(pc); }
      return [gridBranches(Cc), gridBranches(Pc)]; } },

  /* ---- Curve ---- */
  explode: { cat: 'Curve', name: 'Explode', nick: 'Explode', ins: [{ n: 'C' }], outs: ['S', 'V'], item: c => { c = asCrv(c, 'C'); const q = crvPoly(c), S = []; for (let i = 0; i < q.length - 1; i++) S.push({ t: 'crv', c: false, p: [q[i], q[i + 1]] }); return [S, c.p.map(p => P(...p))]; } },
  joincrv: { cat: 'Curve', name: 'Join Curves', nick: 'Join', ins: [{ n: 'C', list: true }, { n: 'T', d: 0.001 }], outs: ['C'], run: I => [joinCurves(I[0].map(c => asCrv(c, 'C')), Math.max(1e-9, num(I[1][0] ?? 0.001, 'T')))] },
  endpts: { cat: 'Curve', name: 'End Points', nick: 'End', ins: [{ n: 'C' }], outs: ['S', 'E'], item: c => { c = asCrv(c, 'C'); const q = crvPoly(c); return [P(...q[0]), P(...q[q.length - 1])]; } },
  divlen: { cat: 'Curve', name: 'Divide Length', nick: 'DivLength', ins: [{ n: 'C' }, { n: 'L', d: 1 }], outs: ['P', 't'],
    item: (c, l) => { c = asCrv(c, 'C'); l = num(l, 'L'); const T = crvLength(c); if (l <= 0) throw new Error('L > 0'); if (T / l > 5000) throw new Error('Çok fazla nokta'); const ts = []; for (let d = 0; d <= T + 1e-9; d += l) ts.push(Math.min(1, d / T)); return [ts.map(t => P(...crvAt(c, t).p)), ts]; } },
  shatter: { cat: 'Curve', name: 'Shatter', nick: 'Shatter', ins: [{ n: 'C' }, { n: 't', list: true, d: 0.5 }], outs: ['S'],
    item: (c, t) => { c = asCrv(c, 'C'); const ts = [0, ...t.map(x => Math.max(0, Math.min(1, num(x, 't')))).sort((a, b) => a - b), 1].filter((x, i, a) => i === 0 || x > a[i - 1] + 1e-9); const out = []; for (let i = 0; i < ts.length - 1; i++) out.push(subCrv(c, ts[i], ts[i + 1])); return [out]; } },
  flipc: { cat: 'Curve', name: 'Flip Curve', nick: 'Flip', ins: [{ n: 'C' }], outs: ['C'], item: c => { c = asCrv(c, 'C'); return [{ ...c, p: c.c ? [c.p[0], ...c.p.slice(1).reverse()] : c.p.slice().reverse() }]; } },
  extend: { cat: 'Curve', name: 'Extend Curve', nick: 'Ext', ins: [{ n: 'C' }, { n: 'L0', d: 1 }, { n: 'L1', d: 1 }], outs: ['C'],
    item: (c, l0, l1) => { c = asCrv(c, 'C'); if (c.c) throw new Error('Kapalı eğri uzatılamaz'); const p = c.p, n = p.length; if (n < 2) throw new Error('En az 2 nokta'); const d0 = vnorm(vsub(p[0], p[1])), d1 = vnorm(vsub(p[n - 1], p[n - 2])); return [{ t: 'crv', c: false, p: [vadd(p[0], vmul(d0, num(l0, 'L0'))), ...p, vadd(p[n - 1], vmul(d1, num(l1, 'L1')))] }]; } },
  fillet: { cat: 'Curve', name: 'Fillet (köşe)', nick: 'Fillet', ins: [{ n: 'C' }, { n: 'R', d: 1 }], outs: ['C'],
    item: (c, r) => { c = asCrv(c, 'C'); r = num(r, 'R'); const p = c.p, n = p.length, out = [];
      for (let i = 0; i < n; i++) { const has = c.c || (i > 0 && i < n - 1); if (!has || r <= 0) { out.push(p[i]); continue; } const pv = p[(i - 1 + n) % n], nx = p[(i + 1) % n], a = vsub(pv, p[i]), b = vsub(nx, p[i]), la = vlen(a), lb = vlen(b); if (!la || !lb) { out.push(p[i]); continue; }
        const ua = vmul(a, 1 / la), ub = vmul(b, 1 / lb), th = Math.acos(Math.max(-1, Math.min(1, vdot(ua, ub)))); if (th < 1e-6 || th > Math.PI - 1e-4) { out.push(p[i]); continue; }
        let d = r / Math.tan(th / 2); d = Math.min(d, la / 2, lb / 2); const rr = d * Math.tan(th / 2), t1 = vadd(p[i], vmul(ua, d)), t2 = vadd(p[i], vmul(ub, d)), cen = vadd(p[i], vmul(vnorm(vadd(ua, ub)), rr / Math.sin(th / 2))), v1 = vsub(t1, cen), v2 = vsub(t2, cen), ph = Math.PI - th, seg = Math.max(2, Math.ceil(ph / (Math.PI / 16)));
        for (let k = 0; k <= seg; k++) { const s = k / seg, w1 = Math.sin((1 - s) * ph) / Math.sin(ph), w2 = Math.sin(s * ph) / Math.sin(ph); out.push(vadd(cen, vadd(vmul(v1, w1), vmul(v2, w2)))); } }
      return [{ t: 'crv', c: c.c, p: out }]; } },
  cclosest: { cat: 'Curve', name: 'Curve Closest Point', nick: 'Crv CP', ins: [{ n: 'P' }, { n: 'C' }], outs: ['P', 't', 'D'],
    item: (p, c) => { c = asCrv(c, 'C'); const q = ptArr(p), { q: Q, L, T } = crvCum(c); let best = null; for (let i = 0; i < Q.length - 1; i++) { const r = closestSeg(q, Q[i], Q[i + 1]), d = vdist(q, r.q); if (!best || d < best.d) best = { d, p: r.q, t: (L[i] + r.t * (L[i + 1] - L[i])) / (T || 1) }; } return [P(...best.p), best.t, best.d]; } },

  /* ---- Surface ---- */
  bsrf: { cat: 'Surface', name: 'Boundary Surface', nick: 'BSrf', ins: [{ n: 'C' }], outs: ['S'], item: c => { c = asCrv(c, 'C'); if (!c.c) throw new Error('Kapalı eğri gerekli'); const tr = earClip(c.p); if (!tr.length) throw new Error('Yüzey oluşturulamadı'); return [{ t: 'mesh', v: c.p.slice(), f: tr }]; } },
  extrudev: { cat: 'Surface', name: 'Extrude (vektör)', nick: 'Extr', ins: [{ n: 'B' }, { n: 'D', d: P(0, 0, 5) }], outs: ['E'], item: (b, d) => { b = asCrv(b, 'B'); const v = vecA(d, 'D'), p = crvPoly(b); return [{ t: 'srf', closedU: b.c, g: [p, p.map(q => vadd(q, v))] }]; } },
  ruled: { cat: 'Surface', name: 'Ruled Surface', nick: 'RuleSrf', ins: [{ n: 'A' }, { n: 'B' }], outs: ['S'],
    item: (a, b) => { a = asCrv(a, 'A'); b = asCrv(b, 'B'); const n = Math.min(400, Math.max(crvPoly(a).length, crvPoly(b).length, 2)), ra = resample(a.p, a.c ? n - 1 : n, a.c), rb = resample(b.p, b.c ? n - 1 : n, b.c); if (a.c) ra.push(ra[0]); if (b.c) rb.push(rb[0]); return [{ t: 'srf', g: [ra, rb] }]; } },
  edgesrf: { cat: 'Surface', name: 'Edge Surface', nick: 'EdgeSrf', ins: [{ n: 'A' }, { n: 'B' }, { n: 'C' }, { n: 'D' }], outs: ['S'],
    item: (a, b, c, d) => { const n = 24, R = x => { x = asCrv(x, 'eğri'); return resample(x.p, n + 1, false); }; let A = R(a), B = R(b), Cc = R(c), D = R(d);
      const near = (p, q) => vdist(p, q[0]) <= vdist(p, q[n]); if (!near(A[0], D)) D.reverse(); if (!near(A[n], B)) B.reverse(); if (!near(D[n], Cc)) Cc.reverse();
      const p00 = A[0], p10 = A[n], p01 = Cc[0], p11 = Cc[n], g = [];
      for (let j = 0; j <= n; j++) { const v = j / n, row = []; for (let i = 0; i <= n; i++) { const u = i / n; row.push([0, 1, 2].map(k => (1 - v) * A[i][k] + v * Cc[i][k] + (1 - u) * D[j][k] + u * B[j][k] - ((1 - u) * (1 - v) * p00[k] + u * (1 - v) * p10[k] + (1 - u) * v * p01[k] + u * v * p11[k]))); } g.push(row); }
      return [{ t: 'srf', g }]; } },
  offsrf: { cat: 'Surface', name: 'Offset Surface', nick: 'Offset', ins: [{ n: 'S' }, { n: 'D', d: 0.5 }], outs: ['S'],
    item: (s, d) => { s = asSrf(s, 'S'); d = num(d, 'D'); const R = s.g.length - 1, Cn = s.g[0].length - 1; return [{ ...s, g: s.g.map((row, j) => row.map((p, i) => vadd(p, vmul(srfNormal(s, Cn ? i / Cn : 0, R ? j / R : 0), d)))) }]; } },
  cap: { cat: 'Surface', name: 'Cap Holes', nick: 'Cap', ins: [{ n: 'S' }], outs: ['B'],
    item: s => { s = asSrf(s, 'S'); const G = s.g, R = G.length, Cn = G[0].length, v = [], f = []; G.forEach(r => r.forEach(p => v.push(p))); for (let j = 0; j < R - 1; j++) for (let i = 0; i < Cn - 1; i++) f.push([j * Cn + i, j * Cn + i + 1, (j + 1) * Cn + i + 1, (j + 1) * Cn + i]);
      for (const j of [0, R - 1]) { let ring = G[j].map((_, i) => j * Cn + i); if (vdist(G[j][0], G[j][Cn - 1]) < 1e-9) ring = ring.slice(0, -1); else continue; const tr = earClip(ring.map(k => v[k])); tr.forEach(t => f.push(j ? t.map(k => ring[k]) : t.map(k => ring[k]).reverse())); }
      return [{ t: 'mesh', v, f }]; } },
  evalsrf: { cat: 'Surface', name: 'Evaluate Surface', nick: 'EvalSrf', ins: [{ n: 'S' }, { n: 'u', d: 0.5 }, { n: 'v', d: 0.5 }], outs: ['P', 'N', 'F'],
    item: (s, u, v) => { s = asSrf(s, 'S'); u = num(u, 'u'); v = num(v, 'v'); const F = srfFrame(s, u, v); return [P(...F.o), P(...F.z), F]; } },
  sclosest: { cat: 'Surface', name: 'Surface Closest Point', nick: 'Srf CP', ins: [{ n: 'P' }, { n: 'S' }], outs: ['P', 'u', 'v', 'D'],
    item: (p, s) => { s = asSrf(s, 'S'); const q = ptArr(p), G = s.g, R = G.length - 1, Cn = G[0].length - 1; let best = null;
      for (let j = 0; j < R; j++) for (let i = 0; i < Cn; i++) for (const [a, b, c, uv] of [[G[j][i], G[j][i + 1], G[j + 1][i + 1], [[i, j], [i + 1, j], [i + 1, j + 1]]], [G[j][i], G[j + 1][i + 1], G[j + 1][i], [[i, j], [i + 1, j + 1], [i, j + 1]]]]) {
        const r = closestTri(q, a, b, c), d = vdist(q, r.q); if (!best || d < best.d) best = { d, p: r.q, u: (r.w[0] * uv[0][0] + r.w[1] * uv[1][0] + r.w[2] * uv[2][0]) / (Cn || 1), v: (r.w[0] * uv[0][1] + r.w[1] * uv[1][1] + r.w[2] * uv[2][1]) / (R || 1) }; }
      return [P(...best.p), best.u, best.v, best.d]; } },
  area: { cat: 'Surface', name: 'Area', nick: 'Area', ins: [{ n: 'G' }], outs: ['A', 'C'],
    item: g => { g = asGeo(g); if (g.t === 'crv') { if (!g.c) throw new Error('Kapalı eğri gerekli'); return [polyArea(g.p), P(...polyCentroid(g.p))]; } const T = triangles(g); if (!T.length) throw new Error('eğri, yüzey ya da mesh bekleniyor'); let A = 0; const c = [0, 0, 0]; for (const [a, b, d] of T) { const w = vlen(vcross(vsub(b, a), vsub(d, a))) / 2; A += w; for (let k = 0; k < 3; k++) c[k] += (a[k] + b[k] + d[k]) / 3 * w; } return [A, P(...c.map(x => x / (A || 1)))]; } },
  volume: { cat: 'Surface', name: 'Volume', nick: 'Vol', ins: [{ n: 'G' }], outs: ['V', 'C'],
    item: g => { g = asGeo(g); const T = triangles(g); if (!T.length) throw new Error('kapalı yüzey/mesh bekleniyor'); let V = 0; const c = [0, 0, 0]; for (const [a, b, d] of T) { const v = vdot(a, vcross(b, d)) / 6; V += v; for (let k = 0; k < 3; k++) c[k] += (a[k] + b[k] + d[k]) / 4 * v; } return [Math.abs(V), P(...c.map(x => x / (V || 1)))]; } },

  /* ---- Intersect ---- */
  ccx: { cat: 'Intersect', name: 'Curve | Curve', nick: 'CCX', ins: [{ n: 'A' }, { n: 'B' }, { n: 'T', d: 0.001 }], outs: ['P', 'N'],
    item: (a, b, t) => { a = crvPoly(asCrv(a, 'A')); b = crvPoly(asCrv(b, 'B')); t = Math.max(1e-9, num(t, 'T')); if ((a.length - 1) * (b.length - 1) > 4e6) throw new Error('Eğriler çok yoğun'); const out = [];
      for (let i = 0; i < a.length - 1; i++) for (let j = 0; j < b.length - 1; j++) { const [p, q] = segSeg(a[i], a[i + 1], b[j], b[j + 1]); if (vdist(p, q) <= t) { const m = vmul(vadd(p, q), 0.5); if (!out.some(o => vdist(o, m) <= t * 2)) out.push(m); } }
      return [out.map(p => P(...p)), out.length]; } },
  cplx: { cat: 'Intersect', name: 'Curve | Plane', nick: 'PCX', ins: [{ n: 'C' }, { n: 'P', d: P(0, 0, 0) }], outs: ['P', 'N'],
    item: (c, pl) => { const q = crvPoly(asCrv(c, 'C')), F = asPln(pl, 'P'), d = q.map(p => vdot(vsub(p, F.o), F.z)), out = [];
      for (let i = 0; i < q.length - 1; i++) { if (Math.abs(d[i]) < 1e-12) { if (!out.some(o => vdist(o, q[i]) < 1e-9)) out.push(q[i]); continue; } if ((d[i] < 0 && d[i + 1] > 0) || (d[i] > 0 && d[i + 1] < 0)) { const t = d[i] / (d[i] - d[i + 1]); out.push(vadd(q[i], vmul(vsub(q[i + 1], q[i]), t))); } }
      const L = q.length - 1; if (Math.abs(d[L]) < 1e-12 && !out.some(o => vdist(o, q[L]) < 1e-9)) out.push(q[L]);
      return [out.map(p => P(...p)), out.length]; } },
  bplx: { cat: 'Intersect', name: 'Brep | Plane (kesit)', nick: 'Sec', ins: [{ n: 'G' }, { n: 'P', d: P(0, 0, 0) }], outs: ['C'],
    item: (g, pl) => { const T = triangles(asGeo(g)), F = asPln(pl, 'P'); if (!T.length) throw new Error('yüzey ya da mesh bekleniyor'); const segs = []; let sc = 0;
      for (const t of T) { const d = t.map(p => vdot(vsub(p, F.o), F.z)); sc = Math.max(sc, ...t.map(p => Math.abs(p[0]) + Math.abs(p[1]) + Math.abs(p[2]))); const pts2 = []; for (let k = 0; k < 3; k++) { const a = t[k], b = t[(k + 1) % 3], da = d[k], db = d[(k + 1) % 3]; if ((da < 0 && db >= 0) || (da >= 0 && db < 0)) pts2.push(vadd(a, vmul(vsub(b, a), da / (da - db)))); } if (pts2.length === 2) segs.push(pts2); }
      return [chain(segs, Math.max(1e-9, sc * 1e-7))]; } },

  /* ---- Transform ---- */
  boxmorph: { cat: 'Transform', name: 'Box Morph', nick: 'BoxMorph', ins: [{ n: 'G', list: true }, { n: 'R', opt: true }, { n: 'T' }], outs: ['G'],
    item: (G, r, t) => { const gs = G.map(asGeo); if (!gs.length) throw new Error('G boş'); t = asGeo(t); if (t.t !== 'mesh' || t.v.length !== 8) throw new Error('T: 8 köşeli kutu (Box / Surface Box)');
      const src = r ? pts(asGeo(r)) : gs.flatMap(pts); let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity]; for (const p of src) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p[k]); hi[k] = Math.max(hi[k], p[k]); }
      const sz = hi.map((h, k) => (h - lo[k]) || 1), V = t.v, bil = (q, u, v) => [0, 1, 2].map(k => q[0][k] * (1 - u) * (1 - v) + q[1][k] * u * (1 - v) + q[2][k] * u * v + q[3][k] * (1 - u) * v);
      const f = p => { const u = (p[0] - lo[0]) / sz[0], v = (p[1] - lo[1]) / sz[1], w = (p[2] - lo[2]) / sz[2], b = bil(V.slice(0, 4), u, v), tp = bil(V.slice(4, 8), u, v); return [0, 1, 2].map(k => b[k] * (1 - w) + tp[k] * w); };
      return [gs.map(g => mapG(g, f))]; } },
  srfmorph: { cat: 'Transform', name: 'Surface Morph', nick: 'SrfMorph', ins: [{ n: 'G', list: true }, { n: 'S' }, { n: 'U', d: DOM(0, 1) }, { n: 'V', d: DOM(0, 1) }, { n: 'W', d: 1 }], outs: ['G'],
    item: (G, s, U, V, W) => { const gs = G.map(asGeo); s = asSrf(s, 'S'); U = asDom(U, 'U'); V = asDom(V, 'V'); W = num(W, 'W'); let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity]; for (const p of gs.flatMap(pts)) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p[k]); hi[k] = Math.max(hi[k], p[k]); }
      const sz = hi.map((h, k) => (h - lo[k]) || 1); return [gs.map(g => mapG(g, p => { const u = U.a + (U.b - U.a) * (p[0] - lo[0]) / sz[0], v = V.a + (V.b - V.a) * (p[1] - lo[1]) / sz[1], w = (hi[2] > lo[2] ? (p[2] - lo[2]) / sz[2] : 0) * W; return vadd(srfAt(s, u, v), vmul(srfNormal(s, u, v), w)); }))]; } },
  project: { cat: 'Transform', name: 'Project (plane)', nick: 'Proj', ins: [{ n: 'G' }, { n: 'P', d: P(0, 0, 0) }], outs: ['G'], item: (g, p) => { const F = asPln(p, 'P'); return [mapG(asGeo(g), q => vsub(q, vmul(F.z, vdot(vsub(q, F.o), F.z))))]; } },
  scalenu: { cat: 'Transform', name: 'Scale NU', nick: 'ScaleNU', ins: [{ n: 'G' }, { n: 'P', d: P(0, 0, 0) }, { n: 'X', d: 1 }, { n: 'Y', d: 1 }, { n: 'Z', d: 2 }], outs: ['G'],
    item: (g, p, x, y, z) => { const F = asPln(p, 'P'), s = [num(x, 'X'), num(y, 'Y'), num(z, 'Z')]; return [mapG(asGeo(g), q => { const l = inPln(F, q); return onPln(F, l[0] * s[0], l[1] * s[1], l[2] * s[2]); })]; } },

  /* ---- Display ---- */
  texttag: { cat: 'Display', name: 'Text Tag 3D', nick: 'Tag', ins: [{ n: 'L', d: P(0, 0, 0) }, { n: 'T', d: 'Yazı' }, { n: 'S', d: 1 }], outs: ['T'], item: (l, t, s) => [TAG(ptArr(l), asStr(t), Math.max(1e-6, num(s, 'S')))] },
  pointlist: { cat: 'Display', name: 'Point List', nick: 'Points', ins: [{ n: 'P', list: true }, { n: 'S', d: 0.6 }], outs: ['T'], run: I => { const s = Math.max(1e-6, num(I[1][0] ?? 0.6, 'S')); if (I[0].length > 3000) throw new Error('En fazla 3000 etiket'); return [I[0].map((p, i) => TAG(ptArr(p), i, s))]; } },

  /* ---- Facade (v4) ---- */
  panelnum: { cat: 'Facade', name: 'Panel Numbering', nick: 'PanelNo', ins: [{ n: 'P', list: true }, { n: 'X', d: 'P-' }, { n: 'S', d: 0.4 }, { n: 'O', d: true }], outs: ['T', 'N', 'i'],
    run: I => { const gs = I[0].map(asGeo), pre = asStr(I[1][0] ?? 'P-'), s = Math.max(1e-6, num(I[2][0] ?? 0.4, 'S')), C2 = gs.map(g => g.t === 'mesh' || g.t === 'srf' || g.t === 'crv' ? polyCentroid(panelOutline(g)) : centroid(g)); if (!gs.length) return [[], [], []];
      let ord = gs.map((_, i) => i); if (bool(I[3][0] ?? true)) { const zs = C2.map(c => c[2]), span = (Math.max(...zs) - Math.min(...zs)) || 1, tol = span * 1e-3 + 1e-9; ord.sort((a, b) => Math.round((C2[b][2] - C2[a][2]) / tol) || (C2[a][0] - C2[b][0]) || (C2[a][1] - C2[b][1])); }
      const w = String(gs.length).length < 3 ? 3 : String(gs.length).length, names = new Array(gs.length); ord.forEach((gi, k) => names[gi] = pre + String(k + 1).padStart(w, '0'));
      return [gs.map((g, i) => TAG(C2[i], names[i], s)), names, ord]; } },
  paneldata: { cat: 'Facade', name: 'Panel Data', nick: 'PData', ins: [{ n: 'P', list: true }, { n: 'N', list: true, opt: true }], outs: ['W', 'H', 'A', 'L'], ui: 'act', st: { unit: 'm' },
    run: (I, st, n) => { const rows = I[0].map((g, i) => ({ name: I[1].length ? asStr(I[1][Math.min(i, I[1].length - 1)]) : String(i + 1), ...panelDims(asGeo(g)) })); info[n.id] = { ...(info[n.id] || {}), pdata: rows }; return [rows.map(r => r.w), rows.map(r => r.h), rows.map(r => r.a), rows.map(r => r.per)]; } },
  unroll: { cat: 'Facade', name: 'Panel Unroll', nick: 'Unroll', ins: [{ n: 'P', list: true }, { n: 'N', list: true, opt: true }, { n: 'G', d: 0.2 }, { n: 'W', d: 30 }, { n: 'S', d: 0.3 }, { n: 'O', d: P(0, 0, 0) }], outs: ['C', 'T', 'W', 'H'], ui: 'act', st: { unit: 'm' },
    run: (I, st, n) => { const OF = asPln(I[5][0] ?? P(0, 0, 0), 'O'), gap = num(I[2][0] ?? 0.2, 'G'), maxW = num(I[3][0] ?? 30, 'W'), s = Math.max(1e-6, num(I[4][0] ?? 0.3, 'S')), C2 = [], T = [], Ws = [], Hs = [], rows = []; let x = 0, y = 0, rowH = 0;
      I[0].forEach((g, i) => { const o = panelOutline(asGeo(g)); let f = unroll2D(o); let x0 = Math.min(...f.map(p => p[0])), y0 = Math.min(...f.map(p => p[1])); f = f.map(p => [p[0] - x0, p[1] - y0]); const w = Math.max(...f.map(p => p[0])), h = Math.max(...f.map(p => p[1])); if (x > 0 && x + w > maxW) { x = 0; y += rowH + gap; rowH = 0; }
        const name = I[1].length ? asStr(I[1][Math.min(i, I[1].length - 1)]) : String(i + 1); C2.push({ t: 'crv', c: true, p: f.map(p => onPln(OF, p[0] + x, p[1] + y)) }); T.push(TAG(onPln(OF, x + w / 2, y + h / 2), name, s)); Ws.push(w); Hs.push(h); rows.push({ name, w, h, a: polyArea(o) }); x += w + gap; rowH = Math.max(rowH, h); });
      info[n.id] = { ...(info[n.id] || {}), pdata: rows }; return [C2, T, Ws, Hs]; } },
  mullion: { cat: 'Facade', name: 'Mullions & Transoms', nick: 'Profil', ins: [{ n: 'P', list: true }, { n: 'W', d: 0.05 }, { n: 'D', d: 0.15 }, { n: 'T', d: 0.001 }], outs: ['B', 'E', 'L', 'K'], ui: 'act', st: { unit: 'm' },
    run: (I, st, n) => { const w = num(I[1][0] ?? 0.05, 'W'), dep = num(I[2][0] ?? 0.15, 'D'), tol = Math.max(1e-9, num(I[3][0] ?? 0.001, 'T')), E = new Map(), key = p => p.map(v => Math.round(v / tol)).join(',');
      for (const g0 of I[0]) { const o = panelOutline(asGeo(g0)), nr = vnorm(newell(o)); for (let i = 0; i < o.length; i++) { const a = o[i], b = o[(i + 1) % o.length], ka = key(a), kb = key(b), k = ka < kb ? ka + '|' + kb : kb + '|' + ka; const e = E.get(k); if (e) e.n = vadd(e.n, nr); else E.set(k, { a, b, n: nr }); } }
      const B = [], Ed = [], L = [], K = [], rows = new Map(), mm = UNITS[st.unit] || 1000;
      for (const e of E.values()) { const dir = vsub(e.b, e.a), len = vlen(dir); if (len < tol) continue; const ud = vmul(dir, 1 / len); let nr = vsub(e.n, vmul(ud, vdot(e.n, ud))); nr = vlen(nr) > 1e-9 ? vnorm(nr) : plnFromZ(e.a, ud).x; const sd = vnorm(vcross(ud, nr)), h = w / 2;
        const base = [vsub(e.a, vmul(sd, h)), vsub(e.b, vmul(sd, h)), vadd(e.b, vmul(sd, h)), vadd(e.a, vmul(sd, h))], back = base.map(p => vsub(p, vmul(nr, dep)));
        B.push({ t: 'mesh', v: [...back, ...base], f: [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]] }); Ed.push({ t: 'crv', c: false, p: [e.a, e.b] }); L.push(len);
        const kind = Math.abs(ud[2]) > 0.7 ? 'Dikme' : 'Kayıt'; K.push(kind); const lmm = Math.round(len * mm), rk = kind + '|' + lmm; rows.set(rk, { kind, len: lmm, n: (rows.get(rk)?.n || 0) + 1 }); }
      info[n.id] = { ...(info[n.id] || {}), mrows: [...rows.values()].sort((a, b) => a.kind.localeCompare(b.kind) || b.len - a.len) }; return [B, Ed, L, K]; } },
  glassw: { cat: 'Facade', name: 'Glass Weight', nick: 'CamKg', ins: [{ n: 'P', list: true }], outs: ['kg/m²', 'W', 'T'], ui: 'act', st: { unit: 'm', mix: '8+16+44.2' },
    run: (I, st, n) => { const kgm = glassKgm2(st.mix), f = (UNITS[st.unit] || 1000) / 1000, rows = I[0].map(g => panelDims(asGeo(g))), W = rows.map(r => r.a * f * f * kgm); info[n.id] = { ...(info[n.id] || {}), gdata: { rows, kgm, W } }; return [[kgm], W, [W.reduce((a, b) => a + b, 0)]]; } },
  curvana: { cat: 'Facade', name: 'Curvature Analysis', nick: 'Curv', ins: [{ n: 'S' }, { n: 'U', d: 12 }, { n: 'V', d: 8 }], outs: ['M', 'K', 'R', 'C'],
    item: (s, U, V) => { s = asSrf(s, 'S'); U = Math.max(1, Math.round(num(U, 'U'))); V = Math.max(1, Math.round(num(V, 'V'))); if (U * V > 8000) throw new Error('U×V ≤ 8000'); const eu = Math.max(1 / Math.max(1, s.g[0].length - 1), 1 / U) / 2, ev = Math.max(1 / Math.max(1, s.g.length - 1), 1 / V) / 2, M = [], K = [];
      for (let j = 0; j < V; j++) for (let i = 0; i < U; i++) { const u = Math.min(1 - eu, Math.max(eu, (i + .5) / U)), v = Math.min(1 - ev, Math.max(ev, (j + .5) / V)), S0 = srfAt(s, u, v), Su = vmul(vsub(srfAt(s, u + eu, v), srfAt(s, u - eu, v)), 1 / (2 * eu)), Sv = vmul(vsub(srfAt(s, u, v + ev), srfAt(s, u, v - ev)), 1 / (2 * ev));
        const Suu = vmul(vadd(vsub(srfAt(s, u + eu, v), vmul(S0, 2)), srfAt(s, u - eu, v)), 1 / (eu * eu)), Svv = vmul(vadd(vsub(srfAt(s, u, v + ev), vmul(S0, 2)), srfAt(s, u, v - ev)), 1 / (ev * ev)), Suv = vmul(vadd(vsub(srfAt(s, u + eu, v + ev), srfAt(s, u + eu, v - ev)), vsub(srfAt(s, u - eu, v - ev), srfAt(s, u - eu, v + ev))), 1 / (4 * eu * ev));
        const nn = vnorm(vcross(Su, Sv)), E1 = vdot(Su, Su), F1 = vdot(Su, Sv), G1 = vdot(Sv, Sv), L1 = vdot(Suu, nn), M1 = vdot(Suv, nn), N1 = vdot(Svv, nn), den = E1 * G1 - F1 * F1 || 1e-12, Kg = (L1 * N1 - M1 * M1) / den, H = (E1 * N1 - 2 * F1 * M1 + G1 * L1) / (2 * den), dk = Math.sqrt(Math.max(0, H * H - Kg));
        K.push(Math.max(Math.abs(H + dk), Math.abs(H - dk))); M.push(quad(srfAt(s, i / U, j / V), srfAt(s, (i + 1) / U, j / V), srfAt(s, (i + 1) / U, (j + 1) / V), srfAt(s, i / U, (j + 1) / V))); }
      const hi = Math.max(...K, 1e-12); return [M, K, K.map(k => k > 1e-9 ? 1 / k : 1e9), K.map(k => ({ t: 'col', hex: ramp(k / hi) }))]; } },

  /* ======== v5 ======== */
  /* ---- Params ---- */
  importg: { cat: 'Params', name: 'Import DXF / OBJ / 3DM', nick: 'Import', ins: [], outs: ['P', 'C', 'M', 'T', 'L'], ui: 'import', st: { file: '', geo: [] },
    run: (I, st) => { const G = st.geo || [], by = t => G.filter(x => x.g.t === t); const M = G.filter(x => x.g.t === 'mesh' || x.g.t === 'srf');
      return [by('pt').map(x => x.g), by('crv').map(x => x.g), M.map(x => x.g), by('tag').map(x => x.g), [...new Set(G.map(x => x.l))]]; } },
  imgsamp: { cat: 'Params', name: 'Image Sampler', nick: 'Img', ins: [{ n: 'P' }, { n: 'X', d: DOM(0, 1) }, { n: 'Y', d: DOM(0, 1) }], outs: ['V', 'C'], ui: 'img', st: { name: '', w: 0, h: 0, px: [], ch: 'bright', inv: false },
    item: (p, X, Y, st) => { if (!st.w) throw new Error('Resim seç'); const q = ptArr(p); X = asDom(X, 'X'); Y = asDom(Y, 'Y'); const u = (q[0] - X.a) / ((X.b - X.a) || 1), v = (q[1] - Y.a) / ((Y.b - Y.a) || 1), rgb = imgAt(st, u, v);
      let val = st.ch === 'r' ? rgb[0] : st.ch === 'g' ? rgb[1] : st.ch === 'b' ? rgb[2] : (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]); val /= 255; if (st.inv) val = 1 - val; return [val, { t: 'col', hex: rgb2hex(rgb) }]; } },
  ptpick: { cat: 'Params', name: 'Point (görünümden seç)', nick: 'Pick', ins: [], outs: ['P'], ui: 'pick', st: { pts: [] }, run: (I, st) => [(st.pts || []).map(p => P(...p))] },
  note: { cat: 'Params', name: 'Not', nick: 'Not', ins: [], outs: [], ui: 'note', st: { text: 'Açıklama yaz…' }, tree: () => [] },
  script: { cat: 'Maths', name: 'Script (JavaScript)', nick: 'JS', ins: [{ n: 'A', list: true, opt: true }, { n: 'B', list: true, opt: true }, { n: 'C', list: true, opt: true }], outs: ['a', 'b'], ui: 'script',
    st: { code: '// A, B, C: girdi listeleri · lib: P, crv, mesh, tag, vadd, vsub, vmul, vlen, vnorm, vcross, vdot\nconst a = A.map(x => x * 2);\nreturn { a, b: a.length };' },
    run: (I, st) => { let f = scriptCache.get(st.code); if (!f) { f = new Function('A', 'B', 'C', 'lib', st.code); scriptCache.set(st.code, f); }
      const r = f(I[0], I[1], I[2], SCRIPT_LIB), toL = v => v === undefined ? [] : Array.isArray(v) ? v : [v];
      if (Array.isArray(r)) return [toL(r[0]), toL(r[1])]; if (r && typeof r === 'object' && !r.t) return [toL(r.a), toL(r.b)]; return [toL(r), []]; } },

  /* ---- Sets ---- */
  sfilter: { cat: 'Sets', name: 'Stream Filter', nick: 'Filter', ins: [{ n: 'G', d: 0 }, { n: 'D0', list: true, opt: true }, { n: 'D1', list: true, opt: true }, { n: 'D2', list: true, opt: true }], outs: ['S'], run: I => { const g = Math.round(num(I[0][0] ?? 0, 'G')); if (g < 0 || g > 2) throw new Error('G: 0, 1 ya da 2'); return [I[1 + g].slice()]; } },
  sgate: { cat: 'Sets', name: 'Stream Gate', nick: 'Gate', ins: [{ n: 'D', list: true }, { n: 'G', d: 0 }], outs: ['0', '1', '2'], run: I => { const g = Math.round(num(I[1][0] ?? 0, 'G')); return [0, 1, 2].map(k => k === g ? I[0].slice() : []); } },
  pickchoose: { cat: 'Sets', name: "Pick'n'Choose", nick: 'P\'n\'C', ins: [{ n: 'P', list: true }, { n: '0', list: true }, { n: '1', list: true }], outs: ['R'],
    run: I => [I[0].map((p, i) => { const k = typeof p === 'boolean' ? +p : Math.round(num(p, 'P')), L = I[1 + Math.max(0, Math.min(1, k))]; if (!L.length) throw new Error('kaynak liste boş'); return L[Math.min(i, L.length - 1)]; })] },
  sequence: { cat: 'Sets', name: 'Sequence', nick: 'Seq', ins: [{ n: 'I', list: true, d: 1 }, { n: 'N', d: 10 }], outs: ['S'], ui: 'expr', st: { expr: 'a + b' },
    run: (I, st) => { const n = Math.round(num(I[1][0] ?? 10, 'N')); if (n < 0 || n > 10000) throw new Error('N 0–10000'); const f = compileExpr(st.expr), s = I[0].map(x => num(x, 'I')); if (!s.length) s.push(1); while (s.length < n) { const i = s.length; s.push(f({ a: s[i - 1], b: s[i - 2] ?? 0, c: s[i - 3] ?? 0, i })); } return [s.slice(0, n)]; } },
  insert: { cat: 'Sets', name: 'Insert Items', nick: 'Ins', ins: [{ n: 'L', list: true }, { n: 'I', list: true }, { n: 'i', list: true }], outs: ['L'],
    run: I => { const L = I[0].slice(), idx = I[2].map(x => Math.round(num(x, 'i'))); const ops = I[1].map((v, k) => [idx[Math.min(k, idx.length - 1)] ?? L.length, v, k]).sort((a, b) => b[0] - a[0] || b[2] - a[2]); for (const [i, v] of ops) L.splice(Math.max(0, Math.min(L.length, i)), 0, v); return [L]; } },
  replace: { cat: 'Sets', name: 'Replace Items', nick: 'Replace', ins: [{ n: 'L', list: true }, { n: 'I', list: true }, { n: 'i', list: true }], outs: ['L'],
    run: I => { const L = I[0].slice(), idx = I[2].map(x => Math.round(num(x, 'i'))); I[1].forEach((v, k) => { const i = idx[Math.min(k, idx.length - 1)]; if (i >= 0 && i < L.length) L[i] = v; }); return [L]; } },

  /* ---- Curve ---- */
  tween: { cat: 'Curve', name: 'Tween Curves', nick: 'Tween', ins: [{ n: 'A' }, { n: 'B' }, { n: 'F', d: 0.5 }], outs: ['T'],
    item: (a, b, f) => { a = asCrv(a, 'A'); b = asCrv(b, 'B'); f = num(f, 'F'); const n = Math.min(400, Math.max(a.p.length, b.p.length, 2)), cl = a.c && b.c, ra = resample(a.p, n, cl), rb = resample(b.p, n, cl); return [{ t: 'crv', c: cl, p: ra.map((p, i) => [0, 1, 2].map(k => p[k] + (rb[i][k] - p[k]) * f)) }]; } },
  offset3d: { cat: 'Curve', name: 'Offset (düzlemde)', nick: 'Offset3D', ins: [{ n: 'C' }, { n: 'D', d: 0.5 }, { n: 'P', opt: true }], outs: ['C'],
    item: (c, d, p) => { c = asCrv(c, 'C'); d = num(d, 'D'); const F = p !== undefined ? asPln(p, 'P') : plnFromZ(centroid(c), vlen(newell(c.p)) > 1e-12 ? newell(c.p) : [0, 0, 1]); const q = c.p.map(x => inPln(F, x)), o = offsetPoly2(q, c.c ? (area2(q) > 0 ? -d : d) : d, c.c); return [{ t: 'crv', c: c.c, p: o.map(x => onPln(F, x[0], x[1], 0)) }]; } },
  nurbs: { cat: 'Curve', name: 'Nurbs Curve', nick: 'Nurbs', ins: [{ n: 'V', list: true }, { n: 'D', d: 3 }, { n: 'P', d: false }], outs: ['C'],
    run: I => { const V = I[0].map(v => vecA(v, 'V')); if (V.length < 2) throw new Error('En az 2 kontrol noktası'); const per = bool(I[2][0] ?? false), d = Math.max(1, Math.min(Math.round(num(I[1][0] ?? 3, 'D')), (per ? V.length : V.length - 1))); return [[{ t: 'crv', c: per, p: bspline(V, d, per) }]]; } },
  projcrv: { cat: 'Curve', name: 'Project to Surface', nick: 'Proj', ins: [{ n: 'C' }, { n: 'S' }, { n: 'D', d: P(0, 0, -1) }], outs: ['C'],
    item: (c, s, d) => { c = asCrv(c, 'C'); const T = triangles(asGeo(s)); if (!T.length) throw new Error('S: yüzey ya da mesh'); const dir = vnorm(vecA(d, 'D')), q = resample(c.p, Math.min(400, Math.max(60, c.p.length * 6)), c.c), out = [];
      for (const p of q) { let best = null; for (const t of T) { const h = rayTri(p, dir, t); if (h !== null && (best === null || Math.abs(h) < Math.abs(best))) best = h; } if (best !== null) out.push(vadd(p, vmul(dir, best))); }
      if (out.length < 2) throw new Error('eğri yüzeye izdüşmedi (yön?)'); return [{ t: 'crv', c: c.c && out.length === q.length, p: out }]; } },

  /* ---- Surface / Mesh ---- */
  meshsrf: { cat: 'Surface', name: 'Mesh Surface', nick: 'Mesh', ins: [{ n: 'S' }, { n: 'U', d: 10 }, { n: 'V', d: 10 }], outs: ['M'],
    item: (s, u, v) => { s = asSrf(s, 'S'); u = Math.max(1, Math.round(num(u, 'U'))); v = Math.max(1, Math.round(num(v, 'V'))); if (u * v > 40000) throw new Error('U×V ≤ 40000'); const V = [], F = [];
      for (let j = 0; j <= v; j++) for (let i = 0; i <= u; i++) V.push(srfAt(s, i / u, j / v)); for (let j = 0; j < v; j++) for (let i = 0; i < u; i++) { const a = j * (u + 1) + i; F.push([a, a + 1, a + u + 2, a + u + 1]); } return [{ t: 'mesh', v: V, f: F }]; } },
  meshjoin: { cat: 'Surface', name: 'Mesh Join', nick: 'MJoin', ins: [{ n: 'M', list: true }], outs: ['M'], run: I => [[joinMeshes(I[0].map(asGeo))]] },
  weld: { cat: 'Surface', name: 'Weld (birleştir)', nick: 'Weld', ins: [{ n: 'M' }, { n: 'T', d: 0.001 }], outs: ['M'], item: (m, t) => [weldMesh(toMesh(asGeo(m)), Math.max(1e-9, num(t, 'T')))] },
  msmooth: { cat: 'Surface', name: 'Smooth Mesh', nick: 'Smooth', ins: [{ n: 'M' }, { n: 'S', d: 0.5 }, { n: 'N', d: 5 }, { n: 'F', d: true }], outs: ['M'],
    item: (m, s, n, fix) => { m = weldMesh(toMesh(asGeo(m)), 1e-9); s = num(s, 'S'); n = Math.min(200, Math.round(num(n, 'N'))); const nb = m.v.map(() => new Set()), naked = nakedVerts(m); for (const f of m.f) for (let i = 0; i < f.length; i++) { nb[f[i]].add(f[(i + 1) % f.length]); nb[f[(i + 1) % f.length]].add(f[i]); }
      let V = m.v.map(p => p.slice()); for (let it = 0; it < n; it++) V = V.map((p, i) => { if (bool(fix) && naked.has(i)) return p; const N = [...nb[i]]; if (!N.length) return p; const c = [0, 1, 2].map(k => N.reduce((a, j) => a + V[j][k], 0) / N.length); return [0, 1, 2].map(k => p[k] + (c[k] - p[k]) * s); }); return [{ t: 'mesh', v: V, f: m.f }]; } },
  naked: { cat: 'Surface', name: 'Naked Edges', nick: 'Naked', ins: [{ n: 'M' }], outs: ['E'],
    item: m => { m = weldMesh(toMesh(asGeo(m)), 1e-9); const cnt = new Map(); for (const f of m.f) for (let i = 0; i < f.length; i++) { const a = f[i], b = f[(i + 1) % f.length], k = a < b ? a + ',' + b : b + ',' + a; cnt.set(k, (cnt.get(k) || 0) + 1); }
      const segs = [...cnt.entries()].filter(([, c]) => c === 1).map(([k]) => k.split(',').map(Number)).map(([a, b]) => [m.v[a], m.v[b]]); return [chain(segs, 1e-9)]; } },
  regunion: { cat: 'Intersect', name: 'Region Union', nick: 'RUnion', ins: [{ n: 'A', list: true }, { n: 'B', list: true, opt: true }], outs: ['R'], run: I => [regionOp('union', I[0], I[1])] },
  regdiff: { cat: 'Intersect', name: 'Region Difference', nick: 'RDiff', ins: [{ n: 'A', list: true }, { n: 'B', list: true }], outs: ['R'], run: I => [regionOp('difference', I[0], I[1])] },
  regint: { cat: 'Intersect', name: 'Region Intersection', nick: 'RInt', ins: [{ n: 'A', list: true }, { n: 'B', list: true }], outs: ['R'], run: I => [regionOp('intersection', I[0], I[1])] },
  relax: { cat: 'Surface', name: 'Relax (Kangaroo)', nick: 'Relax', ins: [{ n: 'M', list: true }, { n: 'A', list: true, opt: true }, { n: 'L', d: 1 }, { n: 'G', d: 0 }, { n: 'W', d: 0 }, { n: 'N', d: 200 }], outs: ['M', 'D'],
    run: I => { const m = weldMesh(joinMeshes(I[0].map(g => toMesh(asGeo(g)))), 1e-6); if (m.v.length > 20000) throw new Error('En fazla 20000 köşe'); const r = relaxMesh(m, I[1].map(a => ptArr(a)), num(I[2][0] ?? 1, 'L'), num(I[3][0] ?? 0, 'G'), num(I[4][0] ?? 0, 'W'), Math.min(5000, Math.round(num(I[5][0] ?? 200, 'N')))); return [[r.m], [r.dev]]; } },

  /* ---- Facade / analysis ---- */
  sunpos: { cat: 'Facade', name: 'Sun Position', nick: 'Sun', ins: [{ n: 'Lat', d: 41.0 }, { n: 'Lon', d: 29.0 }, { n: 'M', d: 6 }, { n: 'D', d: 21 }, { n: 'H', d: 12 }, { n: 'TZ', d: 3 }, { n: 'N', d: 0 }], outs: ['V', 'Alt', 'Az'],
    item: (la, lo, mo, d, h, tz, nr) => { const s = sunVec(num(la, 'Lat'), num(lo, 'Lon'), num(mo, 'M'), num(d, 'D'), num(h, 'H'), num(tz, 'TZ'), num(nr, 'N')); return [P(...s.v), s.alt, s.az]; } },
  sunpath: { cat: 'Facade', name: 'Sun Path (gün)', nick: 'SunPath', ins: [{ n: 'Lat', d: 41.0 }, { n: 'Lon', d: 29.0 }, { n: 'M', d: 6 }, { n: 'D', d: 21 }, { n: 'TZ', d: 3 }, { n: 'N', d: 0 }, { n: 'S', d: 1 }], outs: ['V', 'H', 'Alt'],
    item: (la, lo, mo, d, tz, nr, st) => { const step = Math.max(0.1, num(st, 'S')), V = [], H = [], A = []; for (let h = 0; h < 24; h += step) { const s = sunVec(num(la, 'Lat'), num(lo, 'Lon'), num(mo, 'M'), num(d, 'D'), h, num(tz, 'TZ'), num(nr, 'N')); if (s.alt > 0) { V.push(P(...s.v)); H.push(+h.toFixed(2)); A.push(s.alt); } } return [V, H, A]; } },
  solar: { cat: 'Facade', name: 'Solar Exposure', nick: 'Solar', ins: [{ n: 'P', list: true }, { n: 'V', list: true }, { n: 'F', d: false }], outs: ['E', 'I', 'C'],
    run: I => { const V = I[1].map(v => vnorm(vecA(v, 'V'))); if (!V.length) throw new Error('V (güneş yönü) boş'); const flip = bool(I[2][0] ?? false), E = [], Mx = [];
      for (const g of I[0]) { const o = panelOutline(asGeo(g)); let n = vnorm(newell(o)); if (flip) n = vmul(n, -1); let s = 0, mx = 0; for (const v of V) { const c = Math.max(0, vdot(n, v)); s += c; mx = Math.max(mx, c); } E.push(s); Mx.push(mx); }
      const hi = Math.max(...E, 1e-9); return [E, Mx, E.map(e => ({ t: 'col', hex: ramp(e / hi) }))]; } },
  panelangle: { cat: 'Facade', name: 'Panel Angle (komşu)', nick: 'PAngle', ins: [{ n: 'P', list: true }, { n: 'T', d: 0.001 }], outs: ['E', 'A', 'C', 'M'],
    run: I => { const tol = Math.max(1e-9, num(I[1][0] ?? 0.001, 'T')), key = p => p.map(v => Math.round(v / tol)).join(','), Ed = new Map(), Nn = [];
      I[0].forEach((g, pi) => { const o = panelOutline(asGeo(g)), n = vnorm(newell(o)); Nn.push(n); for (let i = 0; i < o.length; i++) { const a = o[i], b = o[(i + 1) % o.length], ka = key(a), kb = key(b), k = ka < kb ? ka + '|' + kb : kb + '|' + ka; const e = Ed.get(k); if (e) e.p.push(pi); else Ed.set(k, { a, b, p: [pi] }); } });
      const E = [], A = [], M = I[0].map(() => 0); for (const e of Ed.values()) { if (e.p.length !== 2) continue; const n1 = Nn[e.p[0]], n2 = Nn[e.p[1]], ang = Math.acos(Math.max(-1, Math.min(1, Math.abs(vdot(n1, n2))))) / D2R; E.push({ t: 'crv', c: false, p: [e.a, e.b] }); A.push(ang); M[e.p[0]] = Math.max(M[e.p[0]], ang); M[e.p[1]] = Math.max(M[e.p[1]], ang); }
      const hi = Math.max(...A, 1e-9); return [E, A, A.map(a => ({ t: 'col', hex: ramp(a / hi) })), M]; } },
  limits: { cat: 'Facade', name: 'Size Limits', nick: 'Limits', ins: [{ n: 'P', list: true }, { n: 'W', d: 3.21 }, { n: 'H', d: 6.0 }, { n: 'A', d: 0 }], outs: ['OK', 'C', 'R'],
    run: I => { const W = num(I[1][0] ?? 3.21, 'W'), H = num(I[2][0] ?? 6, 'H'), Am = num(I[3][0] ?? 0, 'A'), OK = [], R = [];
      for (const g of I[0]) { const d = panelDims(asGeo(g)), lo = Math.min(d.w, d.h), hi = Math.max(d.w, d.h), wl = Math.min(W, H), hl = Math.max(W, H), why = []; if (lo > wl + 1e-9 || hi > hl + 1e-9) why.push(`ölçü ${fmt(d.w)}×${fmt(d.h)} > ${fmt(W)}×${fmt(H)}`); if (Am > 0 && d.a > Am) why.push(`alan ${fmt(d.a)} > ${fmt(Am)}`); OK.push(!why.length); R.push(why.join(' · ') || 'uygun'); }
      return [OK, OK.map(k => ({ t: 'col', hex: k ? '#3fae5a' : '#d9483b' })), R]; } },
  anchors: { cat: 'Facade', name: 'Anchors (ankraj)', nick: 'Ankraj', ins: [{ n: 'E', list: true }, { n: 'Z', list: true, d: 0 }, { n: 'O', d: 0 }], outs: ['P', 'N', 'K'], ui: 'act', st: { unit: 'm' },
    run: (I, st, n) => { const Z = I[1].map(z => num(z, 'Z')).sort((a, b) => a - b), off = num(I[2][0] ?? 0, 'O'), out = [], rows = [], K = [];
      I[0].forEach(c0 => { const q = crvPoly(asCrv(c0, 'E')); for (let i = 0; i < q.length - 1; i++) { const a = q[i], b = q[i + 1], d = vsub(b, a), L = vlen(d); if (!L || Math.abs(d[2]) / L < 0.7) continue; Z.forEach((z0, fi) => { const z = z0 + off, t = (z - a[2]) / d[2]; if (t < -1e-9 || t > 1 + 1e-9) return; const p = vadd(a, vmul(d, t)); if (out.some(o => vdist(o, p) < 1e-6)) return; out.push(p); K.push(fi); }); } });
      const ord = out.map((p, i) => i).sort((i, j) => K[i] - K[j] || out[i][0] - out[j][0] || out[i][1] - out[j][1]); ord.forEach((i, k) => rows.push({ name: 'A' + String(k + 1).padStart(3, '0'), floor: K[i] + 1, p: out[i] }));
      info[n.id] = { ...(info[n.id] || {}), arows: rows }; return [rows.map(r => P(...r.p)), [rows.length], rows.map(r => r.floor)]; } },
  units: { cat: 'Facade', name: 'Unitized Split (ünite)', nick: 'Units', ins: [{ n: 'P', list: true }, { n: 'Z', list: true, d: 0 }, { n: 'H', d: 1 }, { n: 'X', d: 'U-' }], outs: ['U', 'K', 'C', 'T'], ui: 'act', st: { unit: 'm' },
    run: (I, st, n) => { const gs = I[0].map(asGeo); if (!gs.length) return [[], [], [], []]; const Z = I[1].map(z => num(z, 'Z')).sort((a, b) => a - b), hN = Math.max(1, Math.round(num(I[2][0] ?? 1, 'H'))), pre = asStr(I[3][0] ?? 'U-');
      const C2 = gs.map(g => polyCentroid(panelOutline(g))), xy = C2.map(c => [c[0], c[1]]), mx = xy.reduce((a, p) => [a[0] + p[0] / xy.length, a[1] + p[1] / xy.length], [0, 0]);
      let sxx = 0, sxy = 0, syy = 0; xy.forEach(p => { const dx = p[0] - mx[0], dy = p[1] - mx[1]; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; }); const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), dir = [Math.cos(th), Math.sin(th)];
      const s = xy.map(p => (p[0] - mx[0]) * dir[0] + (p[1] - mx[1]) * dir[1]), ws = gs.map(g => panelDims(g).w).sort((a, b) => a - b), cTol = Math.max(1e-6, ws[ws.length >> 1] * 0.4), ordS = s.map((v, i) => i).sort((a, b) => s[a] - s[b]), colIdx = new Array(s.length); let ci = 0; ordS.forEach((i, k) => { if (k && s[i] - s[ordS[k - 1]] > cTol) ci++; colIdx[i] = ci; });
      const fl = C2.map(c => { let k = 0; for (let i = 0; i < Z.length; i++) if (c[2] >= Z[i]) k = i + 1; return k; }), U = [], K = [], map = new Map();
      gs.forEach((g, i) => { const key = fl[i] + ':' + Math.floor(colIdx[i] / hN); if (!map.has(key)) map.set(key, { k: map.size, fl: fl[i], c: Math.floor(colIdx[i] / hN), n: 0, a: 0 }); const u = map.get(key); u.n++; u.a += polyArea(panelOutline(g)); K.push(u.k); });
      const names = new Map([...map.entries()].map(([k, u]) => [u.k, `${pre}K${u.fl}-${String(u.c + 1).padStart(2, '0')}`])); K.forEach(k => U.push(names.get(k)));
      info[n.id] = { ...(info[n.id] || {}), urows: [...map.values()].map(u => ({ name: names.get(u.k), n: u.n, a: u.a })) };
      return [U, K, K.map(k => ({ t: 'col', hex: TYPE_COL[k % TYPE_COL.length] })), gs.map((g, i) => TAG(C2[i], U[i], 0.3))]; } },
  perforate: { cat: 'Facade', name: 'Perforation', nick: 'Perf', ins: [{ n: 'P', list: true }, { n: 'S', d: 0.15 }, { n: 'R0', d: 0.01 }, { n: 'R1', d: 0.05 }, { n: 'A', list: true, opt: true }, { n: 'M', d: 0.05 }], outs: ['H', 'O', 'N'],
    run: I => { const S = num(I[1][0] ?? 0.15, 'S'), r0 = num(I[2][0] ?? 0.01, 'R0'), r1 = num(I[3][0] ?? 0.05, 'R1'), A = I[4].map(ptArr), mg = num(I[5][0] ?? 0.05, 'M'); if (S <= 0) throw new Error('S > 0');
      const Hs = [], Os = [], N = []; let total = 0;
      for (const g of I[0]) { const o = panelOutline(asGeo(g)), n = vnorm(newell(o)); let xv = vsub(o[1], o[0]); xv = vsub(xv, vmul(n, vdot(xv, n))); const F = mkPln(o[0], xv, vcross(n, vnorm(xv))), q = o.map(p => inPln(F, p)), xs = q.map(p => p[0]), ys = q.map(p => p[1]);
        const cand = []; for (let y = Math.min(...ys) + S / 2; y < Math.max(...ys); y += S) for (let x = Math.min(...xs) + S / 2; x < Math.max(...xs); x += S) if (inPoly2([x, y], q) && distPoly2([x, y], q) >= mg + r1 * 0.999) cand.push([x, y]);
        total += cand.length; if (total > 60000) throw new Error('Çok fazla delik (S büyüt)'); const W = cand.map(c => onPln(F, c[0], c[1]));
        let rad; if (A.length) { const D = W.map(p => Math.min(...A.map(a => vdist(a, p)))); const lo = Math.min(...D), hi = Math.max(...D); rad = D.map(d => r0 + (r1 - r0) * (hi > lo ? (d - lo) / (hi - lo) : 1)); } else rad = W.map(() => r1);
        Hs.push(W.map((c, i) => ({ t: 'crv', c: true, p: Array.from({ length: 24 }, (_, k) => onPln({ ...F, o: c }, Math.cos(k / 24 * 2 * Math.PI) * rad[i], Math.sin(k / 24 * 2 * Math.PI) * rad[i])) }))); Os.push(W.map(c => P(...c))); N.push(W.length); }
      return [gridBranches(Hs), gridBranches(Os), N]; } },
  gcode: { cat: 'Facade', name: 'G-code (CNC)', nick: 'Gcode', ins: [{ n: 'C', list: true }, { n: 'T', d: 6 }, { n: 'F', d: 1500 }, { n: 'D', d: 3 }, { n: 'P', d: 1.5 }, { n: 'S', d: 5 }], outs: ['G', 'TP'], ui: 'act', st: { unit: 'm' },
    run: (I, st, n) => { const k = UNITS[st.unit] || 1000, tool = num(I[1][0] ?? 6, 'T'), feed = num(I[2][0] ?? 1500, 'F'), depth = num(I[3][0] ?? 3, 'D'), pass = Math.max(0.1, num(I[4][0] ?? 1.5, 'P')), safe = num(I[5][0] ?? 5, 'S');
      const cs = I[0].map(c => asCrv(c, 'C')).map(c => ({ c, q: c.p.map(p => [p[0] * k, p[1] * k]) })); if (!cs.length) return [[], []];
      const inside = cs.map((a, i) => cs.some((b, j) => j !== i && b.c.c && inPoly2(a.q[0], b.q))), order = cs.map((_, i) => i).sort((a, b) => inside[b] - inside[a]);
      const L = ['%', '(Mini Grasshopper 3D - erdevelop)', `(Takim ${tool} mm, ilerleme ${feed} mm/dk, derinlik ${depth} mm)`, 'G21 G90 G17', `G0 Z${ff(safe, 3)}`, 'M3 S18000'], TP = [];
      for (const i of order) { const { c, q } = cs[i]; let path = q; if (c.c && tool > 0) { const ccw = area2(q) > 0, out = inside[i] ? -1 : 1; path = offsetPoly2(q.map(p => [p[0], p[1], 0]), (ccw ? -1 : 1) * out * tool / 2, true).map(p => [p[0], p[1]]); }
        const pts2 = c.c ? [...path, path[0]] : path; TP.push({ t: 'crv', c: false, p: pts2.map(p => [p[0] / k, p[1] / k, 0]) });
        L.push(`(${inside[i] ? 'ic kontur / delik' : c.c ? 'dis kontur' : 'acik egri'} ${i + 1})`, `G0 X${ff(pts2[0][0], 3)} Y${ff(pts2[0][1], 3)}`);
        const zs = []; for (let z = pass; z < depth - 1e-9; z += pass) zs.push(z); zs.push(depth);
        zs.forEach((z, zi) => { L.push(`G1 Z${ff(-z, 3)} F${ff(feed / 3, 0)}`); pts2.slice(1).forEach(p => L.push(`G1 X${ff(p[0], 3)} Y${ff(p[1], 3)} F${ff(feed, 0)}`)); if (!c.c && zi < zs.length - 1) L.push(`G0 Z${ff(safe, 3)}`, `G0 X${ff(pts2[0][0], 3)} Y${ff(pts2[0][1], 3)}`); });
        L.push(`G0 Z${ff(safe, 3)}`); }
      L.push('M5', 'G0 X0 Y0', 'M30', '%'); info[n.id] = { ...(info[n.id] || {}), gcode: L }; return [[L.length + ' satır'], TP]; } },

  /* ======== v6 ======== */
  /* ---- Facade ---- */
  pantypes: { cat: 'Facade', name: 'Panel Type Reduction', nick: 'PTypes', ins: [{ n: 'P', list: true }, { n: 'T', d: 0.003 }, { n: 'X', d: 'T' }], outs: ['K', 'N', 'D', 'C'], ui: 'act', st: { unit: 'm' },
    run: (I, st, n) => { const gs = I[0].map(asGeo); if (!gs.length) return [[], [], [], []]; if (gs.length > 4000) throw new Error('En fazla 4000 panel'); const V = gs.map(g => shapeVariants(panelOutline(g))), tol = Math.max(0, num(I[1][0] ?? 0.003, 'T')), pre = asStr(I[2][0] ?? 'T');
      const ex = typeCluster(V, 1e-6), r = typeCluster(V, tol), w = String(r.n).length < 2 ? 2 : String(r.n).length, names = r.k.map(k => pre + String(k + 1).padStart(w, '0')), cnt = {}; r.k.forEach(k => cnt[k] = (cnt[k] || 0) + 1);
      info[n.id] = { ...(info[n.id] || {}), ptypes: { before: ex.n, after: r.n, maxDev: Math.max(...r.dev), rows: Object.entries(cnt).map(([k, c]) => ({ name: pre + String(+k + 1).padStart(w, '0'), n: c, dev: Math.max(...r.dev.filter((_, i) => r.k[i] === +k)) })).sort((a, b) => b.n - a.n), tol } };
      return [r.k, names, r.dev, r.k.map(k => ({ t: 'col', hex: TYPE_COL[k % TYPE_COL.length] }))]; } },
  shadow: { cat: 'Facade', name: 'Shadow Analysis', nick: 'Shadow', ins: [{ n: 'P', list: true }, { n: 'O', list: true, opt: true }, { n: 'V', list: true }, { n: 'S', d: 2 }, { n: 'I', d: true }, { n: 'F', d: false }], outs: ['L', 'E', 'C'],
    run: I => { const ps = I[0].map(asGeo), V = I[2].map(v => vnorm(vecA(v, 'V'))); if (!V.length) throw new Error('V (güneş yönü) boş'); const S = Math.max(1, Math.min(6, Math.round(num(I[3][0] ?? 2, 'S')))), flip = bool(I[5][0] ?? false);
      const T = I[1].flatMap(g => triangles(asGeo(g))).concat(bool(I[4][0] ?? true) ? ps.flatMap(g => g.t === 'crv' ? [] : triangles(g)) : []); if (T.length > 200000) throw new Error('Çok fazla engel üçgeni'); const bvh = buildBVH(T), L = [], E = [];
      for (const g of ps) { const o = panelOutline(g); let nr = vnorm(newell(o)); if (flip) nr = vmul(nr, -1); const c = polyCentroid(o), smp = [];
        for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) { const u = (a + .5) / S, v = (b + .5) / S; let p; if (o.length === 4) { const A = o[0], B = o[1], Cc = o[2], D = o[3]; p = [0, 1, 2].map(k => (A[k] * (1 - u) + B[k] * u) * (1 - v) + (D[k] * (1 - u) + Cc[k] * u) * v); } else p = vadd(c, vmul(vsub(o[(a * S + b) % o.length], c), 0.6)); smp.push(vadd(p, vmul(nr, 1e-4))); }
        let lit = 0, tot = 0, ex = 0; for (const v of V) { const cs = vdot(nr, v); if (cs <= 0) { tot += smp.length; continue; } let k = 0; for (const p of smp) if (!occluded(bvh, p, v)) k++; lit += k; tot += smp.length; ex += cs * k / smp.length; }
        L.push(tot ? lit / tot : 0); E.push(ex); }
      const hi = Math.max(...E, 1e-9); return [L, E, E.map(e => ({ t: 'col', hex: ramp(e / hi) }))]; } },
  uw: { cat: 'Facade', name: 'Uw (ısıl geçirgenlik)', nick: 'Uw', ins: [{ n: 'P', list: true }, { n: 'Ug', d: 1.1 }, { n: 'Uf', d: 2.0 }, { n: 'F', d: 0.08 }, { n: 'Ψ', d: 0.06 }], outs: ['Uw', 'U', 'C', 'Ag'],
    run: I => { const Ug = num(I[1][0] ?? 1.1, 'Ug'), Uf = num(I[2][0] ?? 2, 'Uf'), F = num(I[3][0] ?? 0.08, 'F'), psi = num(I[4][0] ?? 0.06, 'Ψ'), U = [], Ag = []; let sA = 0, sUA = 0;
      for (const g of I[0]) { const o = panelOutline(asGeo(g)), Fr = plnFromZ(o[0], newell(o)), q = o.map(p => inPln(Fr, p)), At = Math.abs(area2(q)), inner = offsetPoly2(q, area2(q) > 0 ? F : -F, true), ag = Math.abs(area2(inner)); if (ag <= 0 || ag >= At) throw new Error('F (çerçeve genişliği) panele göre çok büyük');
        let lg = 0; for (let i = 0; i < inner.length; i++) lg += Math.hypot(inner[(i + 1) % inner.length][0] - inner[i][0], inner[(i + 1) % inner.length][1] - inner[i][1]); const u = (ag * Ug + (At - ag) * Uf + lg * psi) / At; U.push(u); Ag.push(ag); sA += At; sUA += u * At; }
      const lo = Math.min(...U), hi = Math.max(...U); return [[sA ? sUA / sA : 0], U, U.map(u => ({ t: 'col', hex: ramp(hi > lo ? (u - lo) / (hi - lo) : 0.5) })), Ag]; } },
  warp: { cat: 'Facade', name: 'Warp Check', nick: 'Warp', ins: [{ n: 'P', list: true }, { n: 'M', d: 0.02 }], outs: ['W', 'R', 'OK', 'C'],
    run: I => { const M = num(I[1][0] ?? 0.02, 'M'), W = [], R = []; for (const g of I[0]) { const o = panelOutline(asGeo(g)); if (o.length !== 4) { W.push(0); R.push(0); continue; } const [a, b, c, d] = o, nn = vcross(vsub(b, a), vsub(d, a)), l = vlen(nn), w = l ? Math.abs(vdot(vsub(c, a), nn)) / l : 0; W.push(w); R.push(w / Math.max(vdist(a, c), vdist(b, d))); }
      const OK = W.map(w => w <= M); return [W, R, OK, W.map((w, i) => ({ t: 'col', hex: OK[i] ? (w <= M / 2 ? '#3fae5a' : '#f2b632') : '#d9483b' }))]; } },
  assembly: { cat: 'Facade', name: 'Assembly Sequence', nick: 'Montaj', ins: [{ n: 'P', list: true }, { n: 'O', list: true, opt: true }, { n: 'T', d: 1 }, { n: 'D', d: 2 }], outs: ['G', 'N'],
    run: I => { const gs = I[0].map(asGeo); if (!gs.length) return [[], [0]]; let ord = I[1].length ? I[1].map(x => Math.round(num(x, 'O'))).filter(i => i >= 0 && i < gs.length) : null;
      if (!ord || !ord.length) { const C2 = gs.map(centroid); ord = gs.map((_, i) => i).sort((a, b) => (C2[a][2] - C2[b][2]) || (C2[a][0] - C2[b][0]) || (C2[a][1] - C2[b][1])); }
      const t = Math.max(0, Math.min(1, num(I[2][0] ?? 1, 'T'))) * ord.length, k = Math.floor(t), fr = t - k, D = num(I[3][0] ?? 2, 'D'), out = ord.slice(0, k).map(i => gs[i]);
      if (k < ord.length && fr > 0) { const g = gs[ord[k]], o = g.t === 'crv' ? g.p : panelOutline(g), nr = vnorm(newell(o)), off = vmul(nr, D * (1 - fr) * (1 - fr)); out.push(mapG(g, p => vadd(p, off))); }
      return [out, [k]]; } },
  slabs: { cat: 'Facade', name: 'Slabs (döşeme)', nick: 'Slab', ins: [{ n: 'B' }, { n: 'Z', list: true, d: 0 }, { n: 'T', d: 0.3 }], outs: ['S'],
    item: (b, Z, t) => { b = asCrv(b, 'B'); if (!b.c) throw new Error('B: kapalı eğri'); t = num(t, 'T'); const base = b.p.map(p => [p[0], p[1], 0]), tr = earClip(base); if (!tr.length) throw new Error('Döşeme sınırı geçersiz');
      return [Z.map(z0 => { const z = num(z0, 'Z'), n = base.length, v = [...base.map(p => [p[0], p[1], z]), ...base.map(p => [p[0], p[1], z - t])], f = [...tr.map(x => x.slice()), ...tr.map(x => x.map(i => i + n).reverse())]; for (let i = 0; i < n; i++) { const j = (i + 1) % n; f.push([i, i + n, j + n, j]); } return { t: 'mesh', v, f }; })]; } },
  brackets: { cat: 'Facade', name: 'Brackets (konsol)', nick: 'Konsol', ins: [{ n: 'A', list: true }, { n: 'P', list: true, opt: true }, { n: 'D', opt: true }, { n: 'L', d: 0.25 }, { n: 'W', d: 0.15 }, { n: 'H', d: 0.12 }], outs: ['B'],
    run: I => { const A = I[0].map(ptArr), L = num(I[3][0] ?? 0.25, 'L'), W = num(I[4][0] ?? 0.15, 'W'), H = num(I[5][0] ?? 0.12, 'H'), cen = I[1].length ? centroid({ t: 'crv', p: I[1].flatMap(g => pts(asGeo(g))) }) : null, Dv = I[2][0] !== undefined ? vecA(I[2][0], 'D') : null;
      return [A.map(a => { let d = Dv ? Dv.slice() : cen ? vsub(cen, a) : [0, -1, 0]; d[2] = 0; d = vlen(d) > 1e-12 ? vnorm(d) : [0, 1, 0]; const s = vcross([0, 0, 1], d), h = W / 2;
        const b0 = [vsub(a, vmul(s, h)), vadd(a, vmul(s, h)), vadd(vadd(a, vmul(s, h)), vmul(d, L)), vadd(vsub(a, vmul(s, h)), vmul(d, L))], top = b0, bot = b0.map(p => [p[0], p[1], p[2] - H]);
        return { t: 'mesh', v: [...bot, ...top], f: [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]] }; })]; } },
  tqty: { cat: 'Facade', name: 'Teklif Metrajı', nick: 'Teklif', ins: [{ n: 'P', list: true }, { n: 'S', list: true, opt: true }, { n: 'L', list: true, opt: true }, { n: 'A', list: true, opt: true }, { n: 'K', d: 3.5 }], outs: ['Q'], ui: 'act', st: { unit: 'm' },
    run: (I, st, n) => { const k = (UNITS[st.unit] || 1000) / 1000, dims = I[0].map(g => panelDims(asGeo(g))), sp = I[1].map(g => panelDims(asGeo(g))), camM2 = dims.reduce((s, d) => s + d.a, 0) * k * k, spM2 = sp.reduce((s, d) => s + d.a, 0) * k * k,
      profM = I[2].reduce((s, x) => s + num(x, 'L'), 0) * k, q = { camM2, spandrelM2: spM2, cepheM2: camM2 + spM2, profilM: profM, profilKg: profM * num(I[4][0] ?? 3.5, 'K'), contaM: dims.reduce((s, d) => s + d.per, 0) * k * 2, ankraj: I[3].length, panel: dims.length };
      info[n.id] = { ...(info[n.id] || {}), tq: q }; return [[q.cepheM2, q.camM2, q.profilKg, q.contaM, q.ankraj]]; } },
  phexport: { cat: 'Facade', name: 'Proje Hattı', nick: 'PHattı', ins: [{ n: 'P', list: true }, { n: 'G', list: true }, { n: 'X', d: 'Cephe projesi' }], outs: ['N'], ui: 'act', st: { unit: 'm' },
    run: (I, st, n) => { const k = (UNITS[st.unit] || 1000) / 1000, gr = new Map(); I[0].forEach((g, i) => { const nm = asStr(I[1][Math.min(i, I[1].length - 1)] ?? 'A'), d = panelDims(asGeo(g)); const r = gr.get(nm) || { name: nm, n: 0, a: 0 }; r.n++; r.a += d.a * k * k; gr.set(nm, r); });
      const rows = [...gr.values()].sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true })); if (rows.length > 60) throw new Error('En fazla 60 grup'); info[n.id] = { ...(info[n.id] || {}), ph: { name: asStr(I[2][0] ?? 'Cephe projesi'), rows } }; return [[rows.length]]; } },

  /* ---- Modelling ---- */
  csgunion: { cat: 'Intersect', name: 'Solid Union', nick: 'SUnion', ins: [{ n: 'A', list: true }, { n: 'B', list: true, opt: true }], outs: ['R'], run: I => [[csgOp('union', I[0], I[1])]] },
  csgdiff: { cat: 'Intersect', name: 'Solid Difference', nick: 'SDiff', ins: [{ n: 'A', list: true }, { n: 'B', list: true }], outs: ['R'], run: I => [[csgOp('difference', I[0], I[1])]] },
  csgint: { cat: 'Intersect', name: 'Solid Intersection', nick: 'SInt', ins: [{ n: 'A', list: true }, { n: 'B', list: true }], outs: ['R'], run: I => [[csgOp('intersection', I[0], I[1])]] },
  nurbssrf: { cat: 'Surface', name: 'Nurbs Surface', nick: 'NSrf', ins: [{ n: 'P', list: true }, { n: 'U', d: 4 }, { n: 'Du', d: 3 }, { n: 'Dv', d: 3 }, { n: 'R', d: 24 }], outs: ['S'],
    run: I => { const P2 = I[0].map(p => vecA(p, 'P')), U = Math.round(num(I[1][0] ?? 4, 'U')); if (U < 2 || P2.length < U * 2 || P2.length % U) throw new Error('P sayısı U\'nun katı olmalı (en az 2 sıra)');
      const rows = []; for (let i = 0; i < P2.length; i += U) rows.push(P2.slice(i, i + U)); const du = Math.round(num(I[2][0] ?? 3, 'Du')), dv = Math.round(num(I[3][0] ?? 3, 'Dv')), R = Math.max(4, Math.min(120, Math.round(num(I[4][0] ?? 24, 'R'))));
      const mid = rows.map(r => Array.from({ length: R + 1 }, (_, i) => bsplineAt(r, du, i / R))), g = Array.from({ length: R + 1 }, (_, j) => Array.from({ length: R + 1 }, (_, i) => bsplineAt(mid.map(r => r[i]), dv, j / R)));
      return [[{ t: 'srf', g }]]; } },
  catmull: { cat: 'Surface', name: 'Catmull-Clark', nick: 'CatC', ins: [{ n: 'M' }, { n: 'L', d: 1 }], outs: ['M'], item: (m, l) => { let r = weldMesh(toMesh(asGeo(m)), 1e-9); const L = Math.max(0, Math.min(4, Math.round(num(l, 'L')))); for (let i = 0; i < L; i++) { r = catmullClark(r); if (r.f.length > 200000) throw new Error('Çok fazla yüz'); } return [r]; } },
  thicken: { cat: 'Surface', name: 'Thicken (kalınlık)', nick: 'Thick', ins: [{ n: 'M' }, { n: 'D', d: 0.1 }], outs: ['M'],
    item: (m, d) => { m = weldMesh(toMesh(asGeo(m)), 1e-9); d = num(d, 'D'); const N = vertexNormals(m), n = m.v.length, v = [...m.v, ...m.v.map((p, i) => vadd(p, vmul(N[i], d)))], f = [...m.f.map(x => x.slice().reverse()), ...m.f.map(x => x.map(i => i + n))], cnt = new Map();
      m.f.forEach(x => x.forEach((a, i) => { const b = x[(i + 1) % x.length], k = a < b ? a + ',' + b : b + ',' + a; cnt.set(k, (cnt.get(k) || 0) + 1); })); m.f.forEach(x => x.forEach((a, i) => { const b = x[(i + 1) % x.length], k = a < b ? a + ',' + b : b + ',' + a; if (cnt.get(k) === 1) f.push([a, b, b + n, a + n]); }));
      return [{ t: 'mesh', v, f }]; } },
  framem: { cat: 'Surface', name: 'Frame (çerçeve)', nick: 'Frame', ins: [{ n: 'M' }, { n: 'W', d: 0.05 }], outs: ['F', 'O'],
    item: (m, w) => { m = toMesh(asGeo(m)); w = num(w, 'W'); const v = [], f = [], O = [];
      for (const fc of m.f) { const P0 = fc.map(i => m.v[i]), Fr = plnFromZ(P0[0], newell(P0)), q = P0.map(p => inPln(Fr, p)), inn = offsetPoly2(q, area2(q) > 0 ? w : -w, true).map(p => onPln(Fr, p[0], p[1], q[0][2] || 0)), b = v.length; v.push(...P0, ...inn); const n = P0.length; for (let i = 0; i < n; i++) { const j = (i + 1) % n; f.push([b + i, b + j, b + n + j, b + n + i]); } O.push({ t: 'crv', c: true, p: inn }); }
      return [{ t: 'mesh', v, f }, O]; } },
  text2crv: { cat: 'Curve', name: 'Text to Curves', nick: 'TextCrv', ins: [{ n: 'T', d: 'ERDEVELOP' }, { n: 'S', d: 1 }, { n: 'P', d: P(0, 0, 0) }, { n: 'B', d: true }, { n: 'F', d: 'Arial' }], outs: ['C'],
    item: (t, s, p, b, fo) => { const F = asPln(p, 'P'), S = num(s, 'S'), r = textContours(asStr(t), `"${asStr(fo || 'Arial')}", Arial, sans-serif`, bool(b)), k = S / (r.fs * 0.72); return [r.cs.map(c => ({ t: 'crv', c: true, p: c.p.map(q => onPln(F, (q[0] - 10) * k, (r.base - q[1]) * k)) }))]; } },
  dim: { cat: 'Display', name: 'Dimension', nick: 'Dim', ins: [{ n: 'A' }, { n: 'B' }, { n: 'O', d: 0.5 }, { n: 'S', d: 0.25 }, { n: 'P', opt: true }], outs: ['C', 'T', 'L'],
    item: (a, b, o, s, p) => { a = ptArr(a); b = ptArr(b); o = num(o, 'O'); s = num(s, 'S'); const d = vsub(b, a), L = vlen(d); if (L < 1e-12) throw new Error('A ve B aynı nokta'); const u = vnorm(d); let nrm = p !== undefined ? asPln(p, 'P').z : Math.abs(u[2]) > 0.9 ? [0, 1, 0] : [0, 0, 1]; let pe = vnorm(vcross(nrm, u)); if (vlen(pe) < 1e-9) pe = vnorm(vcross([1, 0, 0], u));
      const a2 = vadd(a, vmul(pe, o)), b2 = vadd(b, vmul(pe, o)), ext = vmul(pe, Math.sign(o || 1) * s * 0.4), tk = vmul(vnorm(vadd(u, pe)), s * 0.35), C2 = [{ t: 'crv', c: false, p: [a, vadd(a2, ext)] }, { t: 'crv', c: false, p: [b, vadd(b2, ext)] }, { t: 'crv', c: false, p: [a2, b2] }, { t: 'crv', c: false, p: [vsub(a2, tk), vadd(a2, tk)] }, { t: 'crv', c: false, p: [vsub(b2, tk), vadd(b2, tk)] }];
      return [C2, TAG(vadd(vmul(vadd(a2, b2), 0.5), vmul(pe, s * 0.9 * Math.sign(o || 1))), fmt(L), s), L]; } }
};
const CATS = ['Params', 'Maths', 'Sets', 'Vector', 'Curve', 'Surface', 'Intersect', 'Transform', 'Display', 'Facade', 'Lib'];
const CAT_TR = { Params: 'Params', Maths: 'Maths', Sets: 'Sets', Vector: 'Vector', Curve: 'Curve', Surface: 'Surface', Intersect: 'Intersect', Transform: 'Transform', Display: 'Display', Facade: 'Cephe', Cluster: 'Cluster', Lib: 'Kütüphane' };
