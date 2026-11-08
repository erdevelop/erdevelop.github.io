/* Mini Grasshopper 3D · çekirdek: geometri, ağaçlar, ifade, yardımcılar */
'use strict';
const $ = id => document.getElementById(id);
const D2R = Math.PI / 180;

/* ================= geometry helpers ================= */
const P = (x, y, z) => ({ t: 'pt', x, y, z });
const GEO = new Set(['pt', 'crv', 'srf', 'mesh', 'pln', 'tag']);
const isPt = g => g && g.t === 'pt';
const isGeo = g => !!(g && typeof g === 'object' && GEO.has(g.t));
const isCol = v => v && v.t === 'col';
const isPln = g => g && g.t === 'pln';
function mkPln(o, x, y) { const X = vnorm(x); let Z = vcross(X, y); if (vlen(Z) < 1e-12) throw new Error('Düzlem: X ve Y eksenleri paralel'); Z = vnorm(Z); return { t: 'pln', o: o.slice(), x: X, y: vcross(Z, X), z: Z }; }
function plnFromZ(o, z) { const Z = vnorm(z); if (vlen(z) < 1e-12) throw new Error('Düzlem: normal sıfır'); const X = Math.abs(Z[2]) > 0.9999 ? [1, 0, 0] : vnorm(vcross([0, 0, 1], Z)); return mkPln(o, X, vcross(Z, X)); }
function asPln(v, name) { if (isPln(v)) return v; if (isPt(v)) return { t: 'pln', o: [v.x, v.y, v.z], x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }; if (typeof v === 'number') return { t: 'pln', o: [0, 0, v], x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }; throw new Error(`${name}: düzlem bekleniyor`); }
const vecA = (v, name) => { v = asPt(v, name); return [v.x, v.y, v.z]; };
const onPln = (F, u, v, w = 0) => [0, 1, 2].map(k => F.o[k] + F.x[k] * u + F.y[k] * v + F.z[k] * w);
const inPln = (F, p) => { const d = [p[0] - F.o[0], p[1] - F.o[1], p[2] - F.o[2]]; return [vdot(d, F.x), vdot(d, F.y), vdot(d, F.z)]; };
function rotAxis(p, c, k, a) { const v = [p[0] - c[0], p[1] - c[1], p[2] - c[2]], co = Math.cos(a), si = Math.sin(a), kx = vcross(k, v), kd = vdot(k, v); return [0, 1, 2].map(i => c[i] + v[i] * co + kx[i] * si + k[i] * kd * (1 - co)); }

/* ---- v4 helpers: domain, tag, polygon & closest-point utilities ---- */
const isDom = v => v && v.t === 'dom';
const DOM = (a, b) => ({ t: 'dom', a, b });
function asDom(v, name) { if (isDom(v)) return v; if (typeof v === 'number') return DOM(0, v); throw new Error(`${name}: aralık (domain) bekleniyor`); }
const isTag = g => g && g.t === 'tag';
const TAG = (p, s, h) => ({ t: 'tag', p: p.slice(), s: String(s), h });
const asStr = v => typeof v === 'string' ? v : typeof v === 'number' ? fmt(v) : isPt(v) || isDom(v) ? fmt(v) : String(v ?? '');
const ptArr = v => { if (isPt(v)) return [v.x, v.y, v.z]; if (isPln(v)) return v.o.slice(); if (isGeo(v)) return centroid(v); throw new Error('nokta bekleniyor'); };
function newell(p) { const n = [0, 0, 0]; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; n[0] += (a[1] - b[1]) * (a[2] + b[2]); n[1] += (a[2] - b[2]) * (a[0] + b[0]); n[2] += (a[0] - b[0]) * (a[1] + b[1]); } return n; }
const polyArea = p => vlen(newell(p)) / 2;
function polyCentroid(p) { const n = vnorm(newell(p)); let A = 0; const c = [0, 0, 0]; for (let i = 1; i < p.length - 1; i++) { const a = p[0], b = p[i], d = p[i + 1], w = vdot(vcross(vsub(b, a), vsub(d, a)), n) / 2; A += w; for (let k = 0; k < 3; k++) c[k] += (a[k] + b[k] + d[k]) / 3 * w; } return Math.abs(A) > 1e-12 ? c.map(x => x / A) : centroid({ t: 'crv', p }); }
function closestSeg(p, a, b) { const d = vsub(b, a), L = vdot(d, d); let t = L ? vdot(vsub(p, a), d) / L : 0; t = Math.max(0, Math.min(1, t)); return { q: vadd(a, vmul(d, t)), t }; }
function closestTri(p, a, b, c) { // Ericson, returns {q, w:[wa,wb,wc]}
  const ab = vsub(b, a), ac = vsub(c, a), ap = vsub(p, a), d1 = vdot(ab, ap), d2 = vdot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return { q: a, w: [1, 0, 0] };
  const bp = vsub(p, b), d3 = vdot(ab, bp), d4 = vdot(ac, bp); if (d3 >= 0 && d4 <= d3) return { q: b, w: [0, 1, 0] };
  const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return { q: vadd(a, vmul(ab, v)), w: [1 - v, v, 0] }; }
  const cp = vsub(p, c), d5 = vdot(ab, cp), d6 = vdot(ac, cp); if (d6 >= 0 && d5 <= d6) return { q: c, w: [0, 0, 1] };
  const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return { q: vadd(a, vmul(ac, w)), w: [1 - w, 0, w] }; }
  const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return { q: vadd(b, vmul(vsub(c, b), w)), w: [0, 1 - w, w] }; }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; return { q: vadd(a, vadd(vmul(ab, v), vmul(ac, w))), w: [1 - v - w, v, w] };
}
function segSeg(p1, q1, p2, q2) { // closest points between two segments
  const d1 = vsub(q1, p1), d2 = vsub(q2, p2), r = vsub(p1, p2), a = vdot(d1, d1), e = vdot(d2, d2), f = vdot(d2, r); let s, t;
  if (a <= 1e-15 && e <= 1e-15) return [p1, p2];
  if (a <= 1e-15) { s = 0; t = Math.max(0, Math.min(1, f / e)); }
  else { const c = vdot(d1, r); if (e <= 1e-15) { t = 0; s = Math.max(0, Math.min(1, -c / a)); } else { const b = vdot(d1, d2), den = a * e - b * b; s = den ? Math.max(0, Math.min(1, (b * f - c * e) / den)) : 0; t = (b * s + f) / e; if (t < 0) { t = 0; s = Math.max(0, Math.min(1, -c / a)); } else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (b - c) / a)); } } }
  return [vadd(p1, vmul(d1, s)), vadd(p2, vmul(d2, t))];
}
function crvCum(c) { const q = crvPoly(c), L = [0]; for (let i = 1; i < q.length; i++) L.push(L[i - 1] + vdist(q[i], q[i - 1])); return { q, L, T: L[L.length - 1] }; }
function subCrv(c, t0, t1) { const { q, L, T } = crvCum(c), d0 = t0 * T, d1 = t1 * T, out = [crvAt(c, t0).p]; for (let i = 1; i < q.length - 1; i++) if (L[i] > d0 + 1e-9 && L[i] < d1 - 1e-9) out.push(q[i]); out.push(crvAt(c, t1).p); return { t: 'crv', c: false, p: out }; }
function joinCurves(cs, tol) {
  const open = [], out = [];
  for (const c of cs) (c.c ? out : open).push(c.c ? c : c.p.slice());
  while (open.length) {
    let cur = open.shift(), grew = true;
    while (grew) { grew = false;
      for (let i = 0; i < open.length; i++) { const o = open[i], s = cur[0], e = cur[cur.length - 1];
        if (vdist(e, o[0]) <= tol) cur = cur.concat(o.slice(1)); else if (vdist(e, o[o.length - 1]) <= tol) cur = cur.concat(o.slice(0, -1).reverse()); else if (vdist(s, o[o.length - 1]) <= tol) cur = o.slice(0, -1).concat(cur); else if (vdist(s, o[0]) <= tol) cur = o.slice(1).reverse().concat(cur); else continue;
        open.splice(i, 1); grew = true; break; } }
    const closed = cur.length > 3 && vdist(cur[0], cur[cur.length - 1]) <= tol; out.push({ t: 'crv', c: closed, p: closed ? cur.slice(0, -1) : cur });
  }
  return out;
}
function earClip(poly) { // planar polygon -> triangles (index triples)
  const n = poly.length; if (n < 3) return []; const F = plnFromZ(poly[0], newell(poly)), P2 = poly.map(p => inPln(F, p));
  let idx = [...Array(n).keys()]; const area = idx.reduce((s, i) => { const a = P2[i], b = P2[(i + 1) % n]; return s + a[0] * b[1] - b[0] * a[1]; }, 0); if (area < 0) idx.reverse();
  const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]), inT = (p, a, b, c) => cr(a, b, p) >= -1e-12 && cr(b, c, p) >= -1e-12 && cr(c, a, p) >= -1e-12;
  const T = []; let guard = 0;
  while (idx.length > 3 && guard++ < 10000) { let cut = false;
    for (let k = 0; k < idx.length; k++) { const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length], a = P2[i0], b = P2[i1], c = P2[i2];
      if (cr(a, b, c) <= 1e-14) continue; if (idx.some(j => j !== i0 && j !== i1 && j !== i2 && inT(P2[j], a, b, c))) continue; T.push([i0, i1, i2]); idx.splice(k, 1); cut = true; break; }
    if (!cut) break; }
  if (idx.length === 3) T.push(idx.slice());
  return T;
}
function srfNormal(s, u, v) { const e = 1e-3, du = vsub(srfAt(s, Math.min(1, u + e), v), srfAt(s, Math.max(0, u - e), v)), dv = vsub(srfAt(s, u, Math.min(1, v + e)), srfAt(s, u, Math.max(0, v - e))); return vnorm(vcross(du, dv)); }
function srfFrame(s, u, v) { const e = 1e-3, du = vsub(srfAt(s, Math.min(1, u + e), v), srfAt(s, Math.max(0, u - e), v)), dv = vsub(srfAt(s, u, Math.min(1, v + e)), srfAt(s, u, Math.max(0, v - e))); return mkPln(srfAt(s, u, v), du, dv); }
function panelOutline(g) {
  if (g.t === 'mesh') { if (g.f.length === 1) return g.f[0].map(i => g.v[i]); const e = new Map(); for (const f of g.f) for (let i = 0; i < f.length; i++) { const a = f[i], b = f[(i + 1) % f.length], k = a < b ? a + ',' + b : b + ',' + a; e.set(k, e.has(k) ? null : [a, b]); } const segs = [...e.values()].filter(Boolean).map(([a, b]) => [g.v[a], g.v[b]]); const ch = chain(segs, 1e-9)[0]; return ch ? ch.p : g.v; }
  if (g.t === 'crv') return g.c ? g.p.slice() : g.p.slice();
  if (g.t === 'srf') { const G = g.g, R = G.length, Cn = G[0].length, o = []; for (let i = 0; i < Cn; i++) o.push(G[0][i]); for (let j = 1; j < R; j++) o.push(G[j][Cn - 1]); for (let i = Cn - 2; i >= 0; i--) o.push(G[R - 1][i]); for (let j = R - 2; j > 0; j--) o.push(G[j][0]); return o; }
  throw new Error('panel (mesh, yüzey ya da kapalı eğri) bekleniyor');
}
function unroll2D(poly) { // flatten panel outline: x along first edge
  const n = vnorm(newell(poly)); let x = vsub(poly[1], poly[0]); x = vsub(x, vmul(n, vdot(x, n))); const F = mkPln(poly[0], x, vcross(n, vnorm(x)));
  return poly.map(p => { const l = inPln(F, p); return [l[0], l[1]]; });
}
function panelDims(g) {
  const o = panelOutline(g); if (o.length < 3) throw new Error('panel en az 3 köşe');
  let w, h; if (o.length === 4) { const e = [0, 1, 2, 3].map(i => vdist(o[i], o[(i + 1) % 4])); w = (e[0] + e[2]) / 2; h = (e[1] + e[3]) / 2; }
  else { const f = unroll2D(o), xs = f.map(p => p[0]), ys = f.map(p => p[1]); w = Math.max(...xs) - Math.min(...xs); h = Math.max(...ys) - Math.min(...ys); }
  let per = 0; for (let i = 0; i < o.length; i++) per += vdist(o[i], o[(i + 1) % o.length]);
  return { o, w, h, a: polyArea(o), per, c: polyCentroid(o) };
}
const UNITS = { m: 1000, cm: 10, mm: 1 };
function glassKgm2(mix) {
  const toks = String(mix).replace(/\s/g, '').replace(/,/g, '.').split('+'); let kg = 0;
  toks.forEach((t, i) => { if (i % 2) return; if (/^\d+$/.test(t)) { kg += +t * 2.5; return; } const m = t.match(/^(\d+)\.(\d)$/); if (!m) throw new Error(`Dizilim: "${t}" anlaşılmadı`); const p = m[1]; let pn;
    if (p.length === 2) pn = [+p[0], +p[1]]; else if (p.length === 4) pn = [+p.slice(0, 2), +p.slice(2)]; else if (p.length === 3) pn = /^1[0-9]/.test(p) && +p[2] > 0 ? [+p.slice(0, 2), +p[2]] : [+p[0], +p.slice(1)]; else throw new Error(`Dizilim: "${t}" anlaşılmadı`);
    kg += (pn[0] + pn[1]) * 2.5 + +m[2] * 0.38 * 1.07; });
  if (!toks.length || toks.length % 2 === 0) throw new Error('Dizilim cam ile bitmeli (ör. 6+16+6)');
  return kg;
}
function gridBranches(cols) { return { __br: cols }; }
function num(v, name) { if (typeof v === 'boolean') return v ? 1 : 0; if (typeof v === 'number' && isFinite(v)) return v; if (v && typeof v === 'object') throw new Error(`${name}: sayı bekleniyor`); const n = +String(v).replace(',', '.'); if (isFinite(n)) return n; throw new Error(`${name}: sayı bekleniyor`); }
function bool(v) { if (typeof v === 'boolean') return v; if (typeof v === 'number') return v !== 0; if (typeof v === 'string') return /^(true|1|yes|evet|doğru)$/i.test(v.trim()); return !!v; }
function asPt(v, name) { if (isPt(v)) return v; if (typeof v === 'number') return P(0, 0, v); throw new Error(`${name}: nokta/vektör bekleniyor`); }
function asCrv(v, name) { if (v && v.t === 'crv') return v; throw new Error(`${name}: eğri bekleniyor`); }
function asSrf(v, name) { if (v && v.t === 'srf') return v; throw new Error(`${name}: yüzey bekleniyor`); }
function asGeo(v) { if (isGeo(v)) return v; throw new Error('geometri bekleniyor'); }
function mapG(g, f) {
  if (!isGeo(g)) return g;
  if (g.t === 'pt') { const r = f([g.x, g.y, g.z]); return P(r[0], r[1], r[2]); }
  if (g.t === 'crv') return { ...g, p: g.p.map(f) };
  if (g.t === 'srf') return { ...g, g: g.g.map(r => r.map(f)) };
  if (g.t === 'mesh') return { ...g, v: g.v.map(f) };
  if (g.t === 'tag') return { ...g, p: f(g.p) };
  if (g.t === 'pln') { const o = f(g.o), ax = a => vnorm(vsub(f(vadd(g.o, a)), o)); return { t: 'pln', o, x: ax(g.x), y: ax(g.y), z: ax(g.z) }; }
  return g;
}
function pts(g) { if (g.t === 'pt') return [[g.x, g.y, g.z]]; if (g.t === 'crv') return g.p; if (g.t === 'srf') return g.g.flat(); if (g.t === 'mesh') return g.v; if (g.t === 'pln') return [g.o]; if (g.t === 'tag') return [g.p]; return []; }
function centroid(g) { const a = pts(g); if (!a.length) return [0, 0, 0]; const s = [0, 0, 0]; a.forEach(p => { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; }); return s.map(x => x / a.length); }
const rotZ = (p, a, c = [0, 0, 0]) => { const s = Math.sin(a), co = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * s, c[1] + x * s + y * co, p[2]]; };
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vmul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vlen = a => Math.hypot(a[0], a[1], a[2]), vnorm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const vdist = (a, b) => vlen(vsub(a, b));
function resample(p, n, closed) {
  const q = closed ? [...p, p[0]] : p, L = [0];
  for (let i = 1; i < q.length; i++) L.push(L[i - 1] + vdist(q[i], q[i - 1]));
  const T = L[L.length - 1] || 1, out = [];
  for (let k = 0; k < n; k++) {
    const d = T * k / (closed ? n : Math.max(1, n - 1)); let j = 1; while (j < L.length - 1 && L[j] < d) j++;
    const t = (d - L[j - 1]) / ((L[j] - L[j - 1]) || 1);
    out.push([0, 1, 2].map(a => q[j - 1][a] + (q[j][a] - q[j - 1][a]) * t));
  }
  return out;
}
function crvPoly(c) { return c.c ? [...c.p, c.p[0]] : c.p; }
function crvLength(c) { const q = crvPoly(c); let s = 0; for (let i = 1; i < q.length; i++) s += vdist(q[i], q[i - 1]); return s; }
function crvAt(c, t) {
  const q = crvPoly(c), L = [0]; for (let i = 1; i < q.length; i++) L.push(L[i - 1] + vdist(q[i], q[i - 1]));
  const T = L[L.length - 1] || 1, d = Math.min(1, Math.max(0, t)) * T; let j = 1; while (j < L.length - 1 && L[j] < d) j++;
  const u = (d - L[j - 1]) / ((L[j] - L[j - 1]) || 1);
  return { p: [0, 1, 2].map(a => q[j - 1][a] + (q[j][a] - q[j - 1][a]) * u), t: vnorm(vsub(q[j], q[j - 1])) };
}
function catmull(points, seg = 8, closed = false) {
  if (points.length < 3) return points.slice();
  const n = points.length, out = [], get = i => closed ? points[(i + n) % n] : points[Math.max(0, Math.min(n - 1, i))];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let s = 0; s < seg; s++) { const t = s / seg, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map(a => 0.5 * ((2 * p1[a]) + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3))); }
  }
  if (!closed) out.push(points[n - 1]);
  return out;
}
function srfAt(s, u, v) {
  const R = s.g.length - 1, C = s.g[0].length - 1;
  const fu = Math.min(Math.max(u, 0), 1) * C, fv = Math.min(Math.max(v, 0), 1) * R;
  const i = Math.min(Math.floor(fu), Math.max(0, C - 1)), j = Math.min(Math.floor(fv), Math.max(0, R - 1));
  const du = fu - i, dv = fv - j, g = s.g;
  const a = g[j][i], b = g[j][Math.min(i + 1, C)], c = g[Math.min(j + 1, R)][i], d = g[Math.min(j + 1, R)][Math.min(i + 1, C)];
  return [0, 1, 2].map(k => (a[k] * (1 - du) + b[k] * du) * (1 - dv) + (c[k] * (1 - du) + d[k] * du) * dv);
}
const quad = (a, b, c, d) => ({ t: 'mesh', v: [a, b, c, d], f: [[0, 1, 2, 3]] });
function triangles(g) {
  const T = [];
  if (g.t === 'srf') { const G = g.g; for (let j = 0; j < G.length - 1; j++) for (let i = 0; i < G[0].length - 1; i++) { T.push([G[j][i], G[j][i + 1], G[j + 1][i + 1]], [G[j][i], G[j + 1][i + 1], G[j + 1][i]]); } }
  else if (g.t === 'mesh') for (const f of g.f) for (let k = 1; k < f.length - 1; k++) T.push([g.v[f[0]], g.v[f[k]], g.v[f[k + 1]]]);
  return T;
}
function ptFrames(p) { // parallel transport frames along a polyline
  const n = p.length, T = [], N = [], B = [];
  for (let i = 0; i < n; i++) T.push(vnorm(i === 0 ? vsub(p[1], p[0]) : i === n - 1 ? vsub(p[n - 1], p[n - 2]) : vsub(p[i + 1], p[i - 1])));
  let up = Math.abs(T[0][2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  let nn = vnorm(vsub(up, vmul(T[0], vdot(up, T[0]))));
  for (let i = 0; i < n; i++) { if (i) { nn = vsub(nn, vmul(T[i], vdot(nn, T[i]))); nn = vnorm(nn); } N.push(nn); B.push(vcross(T[i], nn)); }
  return { T, N, B };
}
function chain(segs, tol) {
  const key = p => Math.round(p[0] / tol) + ',' + Math.round(p[1] / tol) + ',' + Math.round(p[2] / tol);
  const adj = new Map(), used = new Uint8Array(segs.length);
  segs.forEach((s, i) => { for (const e of [0, 1]) { const k = key(s[e]); (adj.get(k) || adj.set(k, []).get(k)).push([i, e]); } });
  const out = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue; used[i] = 1; const line = [segs[i][0], segs[i][1]];
    for (const dir of [1, 0]) {
      for (;;) {
        const end = dir ? line[line.length - 1] : line[0], cand = (adj.get(key(end)) || []).find(([j]) => !used[j]); if (!cand) break;
        const [j, e] = cand; used[j] = 1; const nxt = segs[j][1 - e]; if (dir) line.push(nxt); else line.unshift(nxt);
      }
    }
    const closed = line.length > 3 && vdist(line[0], line[line.length - 1]) < tol * 2;
    out.push({ t: 'crv', c: closed, p: closed ? line.slice(0, -1) : line });
  }
  return out;
}
function rng(seed) { let a = (Math.floor(seed) * 2654435761) >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function clipPoly(poly, a, b, c) { // keep a*x + b*y <= c
  const out = [], n = poly.length; if (!n) return out;
  for (let i = 0; i < n; i++) {
    const p = poly[i], q = poly[(i + 1) % n], fp = a * p[0] + b * p[1] - c, fq = a * q[0] + b * q[1] - c;
    if (fp <= 0) out.push(p);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2]]); }
  }
  return out;
}
function delaunay(pts2) {
  const n = pts2.length; if (n < 3) return [];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const p of pts2) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
  const d = Math.max(x1 - x0, y1 - y0) * 20 || 1, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const P2 = pts2.map(p => [p[0], p[1]]).concat([[mx - d, my - d], [mx, my + d], [mx + d, my - d]]);
  const circ = (a, b, c) => { const A = P2[a], B = P2[b], C2 = P2[c], D = 2 * (A[0] * (B[1] - C2[1]) + B[0] * (C2[1] - A[1]) + C2[0] * (A[1] - B[1])); if (!D) return [0, 0, Infinity]; const a2 = A[0] ** 2 + A[1] ** 2, b2 = B[0] ** 2 + B[1] ** 2, c2 = C2[0] ** 2 + C2[1] ** 2; const ux = (a2 * (B[1] - C2[1]) + b2 * (C2[1] - A[1]) + c2 * (A[1] - B[1])) / D, uy = (a2 * (C2[0] - B[0]) + b2 * (A[0] - C2[0]) + c2 * (B[0] - A[0])) / D; return [ux, uy, (A[0] - ux) ** 2 + (A[1] - uy) ** 2]; };
  let tris = [[n, n + 1, n + 2, circ(n, n + 1, n + 2)]];
  for (let i = 0; i < n; i++) {
    const p = P2[i], bad = [], keep = [];
    for (const t of tris) ((p[0] - t[3][0]) ** 2 + (p[1] - t[3][1]) ** 2 < t[3][2] ? bad : keep).push(t);
    const edges = new Map();
    for (const t of bad) for (const [a, b] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]) { const k = a < b ? a + ',' + b : b + ',' + a; edges.set(k, edges.has(k) ? null : [a, b]); }
    tris = keep; for (const e of edges.values()) if (e) tris.push([e[0], e[1], i, circ(e[0], e[1], i)]);
  }
  return tris.filter(t => t[0] < n && t[1] < n && t[2] < n).map(t => [t[0], t[1], t[2]]);
}


/* ---- v5 helpers ---- */
const area2 = q => { let s = 0; for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
function inPoly2(p, q) { let c = false; for (let i = 0, j = q.length - 1; i < q.length; j = i++) { const a = q[i], b = q[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function distPoly2(p, q) { let d = Infinity; for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); d = Math.min(d, Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t)); } return d; }
function offsetPoly2(q, d, closed) { // offset to the left of travel by d (miter, limited)
  const n = q.length, lines = []; const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) { const a = q[i], b = q[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * d, ny = dx / L * d; lines.push([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny]]); }
  const isect = (l1, l2) => { const [p, p2] = l1, [r, r2] = l2, d1 = [p2[0] - p[0], p2[1] - p[1]], d2 = [r2[0] - r[0], r2[1] - r[1]], den = d1[0] * d2[1] - d1[1] * d2[0]; if (Math.abs(den) < 1e-12) return [(p2[0] + r[0]) / 2, (p2[1] + r[1]) / 2]; const t = ((r[0] - p[0]) * d2[1] - (r[1] - p[1]) * d2[0]) / den; const x = [p[0] + d1[0] * t, p[1] + d1[1] * t]; return Math.hypot(x[0] - p2[0], x[1] - p2[1]) > Math.abs(d) * 4 ? [(p2[0] + r[0]) / 2, (p2[1] + r[1]) / 2] : x; };
  const out = [];
  if (closed) for (let i = 0; i < n; i++) out.push(isect(lines[(i - 1 + n) % n], lines[i]));
  else { out.push(lines[0][0]); for (let i = 1; i < lines.length; i++) out.push(isect(lines[i - 1], lines[i])); out.push(lines[lines.length - 1][1]); }
  return out.map((p, i) => [p[0], p[1], q[i] ? q[i][2] || 0 : 0]);
}
function bspline(V, d, per) { // uniform B-spline (clamped open, or periodic)
  let cp = V.slice(); if (per) cp = cp.concat(V.slice(0, d)); const n = cp.length, kn = [];
  if (per) for (let i = 0; i < n + d + 1; i++) kn.push(i); else { for (let i = 0; i <= d; i++) kn.push(0); for (let i = 1; i < n - d; i++) kn.push(i); for (let i = 0; i <= d; i++) kn.push(n - d); }
  const t0 = kn[d], t1 = kn[n], seg = Math.min(4000, (n - d) * 16), out = [];
  const de = t => { let k = d; while (k < n - 1 && t >= kn[k + 1]) k++; const p = []; for (let j = 0; j <= d; j++) p.push(cp[k - d + j].slice()); for (let r = 1; r <= d; r++) for (let j = d; j >= r; j--) { const i = k - d + j, a = (t - kn[i]) / ((kn[i + d - r + 1] - kn[i]) || 1); p[j] = [0, 1, 2].map(c => (1 - a) * p[j - 1][c] + a * p[j][c]); } return p[d]; };
  for (let s = 0; s <= seg; s++) { if (per && s === seg) break; out.push(de(t0 + (t1 - t0) * Math.min(s / seg, 1 - 1e-12))); }
  return out;
}
function rayTri(o, d, t) { const e1 = vsub(t[1], t[0]), e2 = vsub(t[2], t[0]), p = vcross(d, e2), det = vdot(e1, p); if (Math.abs(det) < 1e-14) return null; const inv = 1 / det, s = vsub(o, t[0]), u = vdot(s, p) * inv; if (u < -1e-9 || u > 1 + 1e-9) return null; const q = vcross(s, e1), v = vdot(d, q) * inv; if (v < -1e-9 || u + v > 1 + 1e-9) return null; return vdot(e2, q) * inv; }
function toMesh(g) { if (g.t === 'mesh') return g; if (g.t === 'srf') { const G = g.g, R = G.length, Cn = G[0].length, v = G.flat(), f = []; for (let j = 0; j < R - 1; j++) for (let i = 0; i < Cn - 1; i++) f.push([j * Cn + i, j * Cn + i + 1, (j + 1) * Cn + i + 1, (j + 1) * Cn + i]); return { t: 'mesh', v, f }; } throw new Error('mesh ya da yüzey bekleniyor'); }
function joinMeshes(list) { const v = [], f = []; for (const g of list) { const m = toMesh(g), b = v.length; v.push(...m.v); m.f.forEach(fc => f.push(fc.map(i => i + b))); } return { t: 'mesh', v, f }; }
function weldMesh(m, tol) { const key = p => p.map(x => Math.round(x / tol)).join(','), map = new Map(), v = [], ix = m.v.map(p => { const k = key(p); let i = map.get(k); if (i === undefined) { i = v.length; v.push(p.slice()); map.set(k, i); } return i; });
  const f = m.f.map(fc => fc.map(i => ix[i]).filter((x, j, a) => x !== a[(j + 1) % a.length])).filter(fc => fc.length >= 3); return { t: 'mesh', v, f }; }
function nakedVerts(m) { const cnt = new Map(); for (const f of m.f) for (let i = 0; i < f.length; i++) { const a = f[i], b = f[(i + 1) % f.length], k = a < b ? a + ',' + b : b + ',' + a; cnt.set(k, (cnt.get(k) || 0) + 1); } const s = new Set(); for (const [k, c] of cnt) if (c === 1) k.split(',').forEach(x => s.add(+x)); return s; }
function relaxMesh(m, anchors, Lf, G, W, N) {
  const V = m.v.map(p => p.slice()), nv = V.length, E = new Map(); for (const f of m.f) for (let i = 0; i < f.length; i++) { const a = f[i], b = f[(i + 1) % f.length], k = a < b ? a + ',' + b : b + ',' + a; if (!E.has(k)) E.set(k, [Math.min(a, b), Math.max(a, b), vdist(V[a], V[b]) * Lf]); }
  const edges = [...E.values()], avg = edges.reduce((s, e) => s + e[2], 0) / (edges.length || 1), tol = avg * 0.05 + 1e-9, fixed = new Uint8Array(nv);
  V.forEach((p, i) => { if (anchors.some(a => vdist(a, p) <= tol)) fixed[i] = 1; });
  const gstep = G * avg * 0.02;
  for (let it = 0; it < N; it++) {
    const acc = V.map(() => [0, 0, 0]), w = new Float64Array(nv);
    for (const [a, b, L] of edges) { const d = vsub(V[b], V[a]), l = vlen(d) || 1e-12, c = vmul(d, (l - L) / l / 2); acc[a] = vadd(acc[a], c); acc[b] = vsub(acc[b], c); w[a]++; w[b]++; }
    if (W > 0) for (const f of m.f) { if (f.length < 4) continue; const P2 = f.map(i => V[i]), c = P2.reduce((s, p) => vadd(s, p), [0, 0, 0]).map(x => x / f.length), n = vnorm(newell(P2)); f.forEach((i, j) => { const dv = vmul(n, -vdot(vsub(P2[j], c), n) * W); acc[i] = vadd(acc[i], dv); w[i] += W; }); }
    let moved = 0; for (let i = 0; i < nv; i++) { if (fixed[i]) continue; const dv = w[i] ? vmul(acc[i], 1 / w[i]) : [0, 0, 0]; dv[2] += gstep; V[i] = vadd(V[i], dv); moved = Math.max(moved, vlen(dv)); }
    if (moved < avg * 1e-7 && !gstep) break;
  }
  let dev = 0; for (const f of m.f) if (f.length === 4) { const [a, b, c, d] = f.map(i => V[i]), n = vcross(vsub(b, a), vsub(d, a)), l = vlen(n); if (l) dev = Math.max(dev, Math.abs(vdot(vsub(c, a), n)) / l); }
  return { m: { t: 'mesh', v: V, f: m.f }, dev };
}
function sunVec(lat, lon, month, day, hour, tz, north) { // NOAA basit; Z yukarı, Y kuzey (N açısıyla döner)
  const doy = Math.floor(275 * month / 9) - 2 * Math.floor((month + 9) / 12) + day - 30, g = 2 * Math.PI / 365 * (doy - 1 + (hour - 12) / 24);
  const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const tst = hour * 60 + eot + 4 * lon - 60 * tz, ha = (tst / 4 - 180) * D2R, la = lat * D2R;
  const cz = Math.sin(la) * Math.sin(decl) + Math.cos(la) * Math.cos(decl) * Math.cos(ha), zen = Math.acos(Math.max(-1, Math.min(1, cz))), alt = 90 - zen / D2R;
  let az = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(la) - Math.tan(decl) * Math.cos(la)) / D2R + 180; az = (az + 360) % 360; // 0 = kuzey, saat yönü
  const a = (az - north) * D2R, ca = Math.cos(alt * D2R); return { v: [Math.sin(a) * ca, Math.cos(a) * ca, Math.sin(alt * D2R)], alt, az };
}
function regionOp(op, A, B) {
  if (!window.polygonClipping) throw new Error('Bölge kütüphanesi yüklenemedi (internet?)');
  const toPoly = c => { c = asCrv(c, 'eğri'); if (!c.c) throw new Error('kapalı eğri gerekli'); return [[...c.p.map(p => [p[0], p[1]]), [c.p[0][0], c.p[0][1]]]]; };
  const a = A.map(toPoly), b = B.map(toPoly); if (!a.length) return []; const z = asCrv(A[0], 'A').p[0][2];
  let res; if (op === 'union') res = polygonClipping.union(...a, ...b); else if (op === 'difference') res = polygonClipping.difference(polygonClipping.union(...a), ...(b.length ? b : [[]])); else res = polygonClipping.intersection(polygonClipping.union(...a), polygonClipping.union(...b));
  const out = []; for (const poly of res) for (const ring of poly) out.push({ t: 'crv', c: true, p: ring.slice(0, -1).map(p => [p[0], p[1], z]) }); return out;
}
function imgAt(st, u, v) { const W = st.w, H = st.h, x = Math.max(0, Math.min(W - 1, u * (W - 1))), y = Math.max(0, Math.min(H - 1, (1 - v) * (H - 1))), x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(W - 1, x0 + 1), y1 = Math.min(H - 1, y0 + 1), fx = x - x0, fy = y - y0, px = (i, j, c) => st.px[(j * W + i) * 3 + c];
  return [0, 1, 2].map(c => (px(x0, y0, c) * (1 - fx) + px(x1, y0, c) * fx) * (1 - fy) + (px(x0, y1, c) * (1 - fx) + px(x1, y1, c) * fx) * fy); }
const scriptCache = new Map();
const SCRIPT_LIB = { P: (x, y, z) => P(x, y, z), crv: (pts, closed = false) => ({ t: 'crv', c: !!closed, p: pts.map(p => Array.isArray(p) ? p : [p.x, p.y, p.z]) }), mesh: (v, f) => ({ t: 'mesh', v, f }), tag: (p, s, h = 1) => TAG(Array.isArray(p) ? p : [p.x, p.y, p.z], s, h), dom: DOM, vadd, vsub, vmul, vlen, vnorm, vcross, vdot, vdist, pts, centroid, plane: mkPln, onPln, Math };

/* ---- import parsers ---- */
function parseDXF(txt) {
  const L = txt.replace(/\r/g, '').split('\n'), out = []; let i = 0; const pairs = []; for (; i + 1 < L.length; i += 2) pairs.push([+L[i].trim(), L[i + 1].trim()]);
  let k = pairs.findIndex(p => p[0] === 2 && p[1] === 'ENTITIES'); if (k < 0) k = 0; let skipped = 0;
  const ent = () => { const t = pairs[k][1], d = { t, c: {} , list: [] }; k++; while (k < pairs.length && pairs[k][0] !== 0) { const [c, v] = pairs[k]; d.list.push([c, v]); if (!(c in d.c)) d.c[c] = v; k++; } return d; };
  const num1 = (d, c, def = 0) => d.c[c] !== undefined ? parseFloat(d.c[c]) : def;
  while (k < pairs.length) {
    if (pairs[k][0] !== 0) { k++; continue; } const typ = pairs[k][1]; if (typ === 'ENDSEC' || typ === 'EOF') break;
    const d = ent(), lay = d.c[8] || '0';
    if (typ === 'LINE') out.push({ l: lay, g: { t: 'crv', c: false, p: [[num1(d, 10), num1(d, 20), num1(d, 30)], [num1(d, 11), num1(d, 21), num1(d, 31)]] } });
    else if (typ === 'POINT') out.push({ l: lay, g: P(num1(d, 10), num1(d, 20), num1(d, 30)) });
    else if (typ === 'LWPOLYLINE') { const z = num1(d, 38), p = []; let cur = null; for (const [c, v] of d.list) { if (c === 10) { cur = [+v, 0, z]; p.push(cur); } else if (c === 20 && cur) cur[1] = +v; } if (p.length > 1) out.push({ l: lay, g: { t: 'crv', c: !!(num1(d, 70) & 1) && p.length > 2, p } }); }
    else if (typ === 'POLYLINE') { const fl = num1(d, 70), vs = [], fs = []; while (k < pairs.length && pairs[k][1] !== 'SEQEND') { if (pairs[k][0] === 0 && pairs[k][1] === 'VERTEX') { const v = ent(), vf = num1(v, 70); if ((fl & 64) && (vf & 128) && !(vf & 64)) fs.push([71, 72, 73, 74].map(c => Math.abs(num1(v, c))).filter(Boolean).map(x => x - 1)); else vs.push([num1(v, 10), num1(v, 20), num1(v, 30)]); } else k++; } k++;
      if (fl & 64) { if (fs.length) out.push({ l: lay, g: { t: 'mesh', v: vs, f: fs.filter(f => f.length >= 3) } }); } else if (vs.length > 1) out.push({ l: lay, g: { t: 'crv', c: !!(fl & 1) && vs.length > 2, p: vs } }); }
    else if (typ === '3DFACE') { const v = [0, 1, 2, 3].map(j => [num1(d, 10 + j), num1(d, 20 + j), num1(d, 30 + j)]); const q = vdist(v[2], v[3]) < 1e-12 ? v.slice(0, 3) : v; out.push({ l: lay, g: { t: 'mesh', v: q, f: [q.map((_, j) => j)] } }); }
    else if (typ === 'CIRCLE' || typ === 'ARC') { const c = [num1(d, 10), num1(d, 20), num1(d, 30)], r = num1(d, 40), a0 = typ === 'ARC' ? num1(d, 50) * D2R : 0; let a1 = typ === 'ARC' ? num1(d, 51) * D2R : 2 * Math.PI; if (a1 <= a0) a1 += 2 * Math.PI; const n = Math.max(8, Math.ceil((a1 - a0) / (Math.PI / 24))), p = []; for (let j = 0; j < (typ === 'CIRCLE' ? n : n + 1); j++) { const a = a0 + (a1 - a0) * j / n; p.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2]]); } out.push({ l: lay, g: { t: 'crv', c: typ === 'CIRCLE', p } }); }
    else if (typ === 'SPLINE') { const p = []; let cur = null; for (const [c, v] of d.list) { if (c === 10) { cur = [+v, 0, 0]; p.push(cur); } else if (c === 20 && cur) cur[1] = +v; else if (c === 30 && cur) cur[2] = +v; } if (p.length > 1) out.push({ l: lay, g: { t: 'crv', c: false, p: p.length > 3 ? bspline(p, Math.min(3, p.length - 1), false) : p } }); }
    else if (typ === 'TEXT' || typ === 'MTEXT') out.push({ l: lay, g: TAG([num1(d, 10), num1(d, 20), num1(d, 30)], String(d.c[1] || '').replace(/\\P/g, ' ').replace(/\{|\}|\\[A-Za-z][^;]*;/g, ''), num1(d, 40, 1)) });
    else skipped++;
  }
  return { geo: out, skipped };
}
function parseOBJ(txt) {
  const V = [], out = []; let lay = 'obj', F = [];
  const flush = () => { if (F.length) { out.push({ l: lay, g: { t: 'mesh', v: V.slice(), f: F } }); F = []; } };
  for (const line of txt.split(/\r?\n/)) { const t = line.trim().split(/\s+/); if (t[0] === 'v') V.push([+t[1], +t[2], +t[3]]); else if (t[0] === 'f') F.push(t.slice(1).map(x => { const i = parseInt(x, 10); return i < 0 ? V.length + i : i - 1; })); else if (t[0] === 'l') out.push({ l: lay, g: { t: 'crv', c: false, p: t.slice(1).map(x => V[parseInt(x, 10) - 1]).filter(Boolean) } }); else if (t[0] === 'g' || t[0] === 'o') { flush(); lay = t.slice(1).join(' ') || lay; } else if (t[0] === 'p') t.slice(1).forEach(x => { const p = V[parseInt(x, 10) - 1]; if (p) out.push({ l: lay, g: P(...p) }); }); }
  flush();
  // compact each mesh to its used vertices
  out.forEach(o => { if (o.g.t !== 'mesh') return; const m = new Map(), v = []; o.g.f = o.g.f.map(f => f.map(i => { if (!m.has(i)) { m.set(i, v.length); v.push(o.g.v[i]); } return m.get(i); })); o.g.v = v; });
  return { geo: out, skipped: 0 };
}
async function parse3DM(buf) {
  const r = await rhinoLib(), f = r.File3dm.fromByteArray(new Uint8Array(buf)); if (!f) throw new Error('3DM okunamadı'); const ob = f.objects(), out = []; let skipped = 0;
  const lname = i => { try { return f.layers().get(i).name; } catch (e) { return 'Katman'; } };
  const meshOf = m => { const v = [], fs = [], V = m.vertices(), F = m.faces(); for (let i = 0; i < V.count; i++) { const p = V.get(i); v.push([p[0], p[1], p[2]]); } for (let i = 0; i < F.count; i++) { const q = F.get(i); fs.push(q[2] === q[3] ? [q[0], q[1], q[2]] : [q[0], q[1], q[2], q[3]]); } return { t: 'mesh', v, f: fs }; };
  for (let i = 0; i < ob.count; i++) {
    const o = ob.get(i), g = o.geometry(), lay = lname(o.attributes().layerIndex), T = g.objectType;
    try {
      if (T === r.ObjectType.Point) { const p = g.location; out.push({ l: lay, g: P(p[0], p[1], p[2]) }); }
      else if (T === r.ObjectType.Curve) { const dom = g.domain, n = g.pointCount && g.constructor.name === 'PolylineCurve' ? g.pointCount - 1 : 64, p = []; if (g.constructor.name === 'PolylineCurve') for (let j = 0; j < g.pointCount; j++) p.push(g.point(j)); else for (let j = 0; j <= n; j++) p.push(g.pointAt(dom[0] + (dom[1] - dom[0]) * j / n)); const cl = g.isClosed; out.push({ l: lay, g: { t: 'crv', c: cl, p: (cl ? p.slice(0, -1) : p).map(q => [q[0], q[1], q[2]]) } }); }
      else if (T === r.ObjectType.Mesh) out.push({ l: lay, g: meshOf(g) });
      else if (T === r.ObjectType.Brep) { let any = false; const fc = g.faces(); for (let j = 0; j < fc.count; j++) { const m = fc.get(j).getMesh(r.MeshType.Any); if (m) { out.push({ l: lay, g: meshOf(m) }); any = true; } } if (!any) skipped++; }
      else if (T === r.ObjectType.Extrusion) { const m = g.getMesh(r.MeshType.Any); if (m) out.push({ l: lay, g: meshOf(m) }); else skipped++; }
      else if (T === r.ObjectType.TextDot) out.push({ l: lay, g: TAG(g.point, g.text, 1) });
      else skipped++;
    } catch (e) { skipped++; }
  }
  return { geo: out, skipped };
}


/* ---- v6 helpers ---- */
/* panel shape descriptors (edges + diagonals) for type rationalisation */
function shapeVariants(o) {
  const n = o.length, out = [];
  for (const flip of [false, true]) for (let r = 0; r < n; r++) {
    const q = []; for (let i = 0; i < n; i++) q.push(o[flip ? (r - i + n) % n : (r + i) % n]);
    const d = []; for (let i = 0; i < n; i++) d.push(vdist(q[i], q[(i + 1) % n])); for (let i = 2; i < n - 1; i++) d.push(vdist(q[0], q[i])); if (n === 4) d.push(vdist(q[1], q[3]));
    out.push(d);
  }
  return out;
}
const maxDiff = (a, b) => { if (a.length !== b.length) return Infinity; let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i])); return m; };
function typeCluster(V, tol) { // V: variants per panel -> {k, dev, reps}
  const order = V.map((_, i) => i).sort((a, b) => V[b][0].reduce((s, x) => s + x, 0) - V[a][0].reduce((s, x) => s + x, 0));
  let reps = [], k = new Array(V.length).fill(-1), al = new Array(V.length);
  const assign = () => { const dev = new Array(V.length).fill(0); k.fill(-1);
    for (const i of order) { let best = -1, bd = Infinity, bv = null; reps.forEach((r, t) => { for (const v of V[i]) { const d = maxDiff(v, r); if (d < bd) { bd = d; best = t; bv = v; } } });
      if (best >= 0 && bd <= tol) { k[i] = best; dev[i] = bd; al[i] = bv; } else { reps.push(V[i][0].slice()); k[i] = reps.length - 1; dev[i] = 0; al[i] = V[i][0]; } }
    return dev; };
  let dev = assign();
  for (let it = 0; it < 3; it++) { // move representatives to the middle of their members
    reps = reps.map((r, t) => { const m = k.map((x, i) => x === t ? i : -1).filter(i => i >= 0); if (!m.length) return r; return r.map((_, c) => { const vals = m.map(i => al[i][c]); return (Math.min(...vals) + Math.max(...vals)) / 2; }); });
    dev = assign();
  }
  const used = [...new Set(k)].sort((a, b) => a - b), remap = new Map(used.map((t, i) => [t, i]));
  return { k: k.map(t => remap.get(t)), dev, n: used.length };
}
/* BVH for ray occlusion */
function buildBVH(T) {
  const items = T.map((t, i) => { const lo = [0, 1, 2].map(a => Math.min(t[0][a], t[1][a], t[2][a])), hi = [0, 1, 2].map(a => Math.max(t[0][a], t[1][a], t[2][a])); return { t, lo, hi, c: [0, 1, 2].map(a => (lo[a] + hi[a]) / 2) }; });
  const node = list => { const lo = [0, 1, 2].map(a => Math.min(...list.map(x => x.lo[a]))), hi = [0, 1, 2].map(a => Math.max(...list.map(x => x.hi[a])));
    if (list.length <= 6) return { lo, hi, leaf: list.map(x => x.t) };
    const ax = [0, 1, 2].reduce((b, a) => hi[a] - lo[a] > hi[b] - lo[b] ? a : b, 0); list.sort((p, q) => p.c[ax] - q.c[ax]); const m = list.length >> 1;
    return { lo, hi, a: node(list.slice(0, m)), b: node(list.slice(m)) }; };
  return items.length ? node(items) : null;
}
function rayBox(o, inv, lo, hi, tmax) { let t0 = 1e-9, t1 = tmax; for (let a = 0; a < 3; a++) { let ta = (lo[a] - o[a]) * inv[a], tb = (hi[a] - o[a]) * inv[a]; if (ta > tb) [ta, tb] = [tb, ta]; t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return false; } return true; }
function occluded(bvh, o, d, tmax = 1e9) {
  if (!bvh) return false; const inv = d.map(x => 1 / (x || 1e-30)), st = [bvh];
  while (st.length) { const n = st.pop(); if (!rayBox(o, inv, n.lo, n.hi, tmax)) continue; if (n.leaf) { for (const t of n.leaf) { const h = rayTri(o, d, t); if (h !== null && h > 1e-6 && h < tmax) return true; } } else st.push(n.a, n.b); }
  return false;
}
/* B-spline evaluation (clamped uniform), t in [0,1] */
function bsplineAt(cp, d, t) {
  const n = cp.length; d = Math.max(1, Math.min(d, n - 1)); const kn = []; for (let i = 0; i <= d; i++) kn.push(0); for (let i = 1; i < n - d; i++) kn.push(i); for (let i = 0; i <= d; i++) kn.push(n - d);
  const u = Math.min(t, 1 - 1e-12) * (n - d); let k = d; while (k < n - 1 && u >= kn[k + 1]) k++;
  const p = []; for (let j = 0; j <= d; j++) p.push(cp[k - d + j].slice());
  for (let r = 1; r <= d; r++) for (let j = d; j >= r; j--) { const i = k - d + j, a = (u - kn[i]) / ((kn[i + d - r + 1] - kn[i]) || 1); p[j] = [0, 1, 2].map(c => (1 - a) * p[j - 1][c] + a * p[j][c]); }
  return p[d];
}
/* Catmull-Clark subdivision */
function catmullClark(m) {
  const V = m.v, F = m.f, E = new Map(), ek = (a, b) => a < b ? a + ',' + b : b + ',' + a;
  F.forEach((f, fi) => f.forEach((a, i) => { const b = f[(i + 1) % f.length], k = ek(a, b); if (!E.has(k)) E.set(k, { a, b, f: [] }); E.get(k).f.push(fi); }));
  const fp = F.map(f => [0, 1, 2].map(c => f.reduce((s, i) => s + V[i][c], 0) / f.length));
  const nv = [], idx = new Map(); V.forEach(p => nv.push(null));
  const vF = V.map(() => []), vE = V.map(() => []); F.forEach((f, fi) => f.forEach(i => vF[i].push(fi))); for (const e of E.values()) { vE[e.a].push(e); vE[e.b].push(e); }
  for (const [k, e] of E) { const mid = [0, 1, 2].map(c => (V[e.a][c] + V[e.b][c]) / 2); e.p = e.f.length === 2 ? [0, 1, 2].map(c => (V[e.a][c] + V[e.b][c] + fp[e.f[0]][c] + fp[e.f[1]][c]) / 4) : mid; e.mid = mid; }
  V.forEach((p, i) => { const be = vE[i].filter(e => e.f.length === 1);
    if (be.length) { if (be.length !== 2) { nv[i] = p.slice(); return; } const o = be.map(e => V[e.a === i ? e.b : e.a]); nv[i] = [0, 1, 2].map(c => p[c] * 0.75 + (o[0][c] + o[1][c]) * 0.125); return; }
    const n = vF[i].length; if (!n) { nv[i] = p.slice(); return; } const Fa = [0, 1, 2].map(c => vF[i].reduce((s, f) => s + fp[f][c], 0) / n), R = [0, 1, 2].map(c => vE[i].reduce((s, e) => s + e.mid[c], 0) / vE[i].length);
    nv[i] = [0, 1, 2].map(c => (Fa[c] + 2 * R[c] + (n - 3) * p[c]) / n); });
  const out = nv.slice(), eIdx = new Map(), fIdx = fp.map(p => { out.push(p); return out.length - 1; }); for (const [k, e] of E) { out.push(e.p); eIdx.set(k, out.length - 1); }
  const nf = []; F.forEach((f, fi) => f.forEach((a, i) => { const b = f[(i + 1) % f.length], z = f[(i - 1 + f.length) % f.length]; nf.push([a, eIdx.get(ek(a, b)), fIdx[fi], eIdx.get(ek(z, a))]); }));
  return { t: 'mesh', v: out, f: nf };
}
function vertexNormals(m) { const N = m.v.map(() => [0, 0, 0]); for (const f of m.f) { const n = newell(f.map(i => m.v[i])); f.forEach(i => { N[i] = vadd(N[i], n); }); } return N.map(n => vlen(n) > 1e-15 ? vnorm(n) : [0, 0, 1]); }
/* BSP CSG (after csg.js, Evan Wallace) */
const CSG_EPS = 1e-7;
class CPlane { constructor(n, w) { this.n = n; this.w = w; } static from(a, b, c) { const n = vnorm(vcross(vsub(b, a), vsub(c, a))); return new CPlane(n, vdot(n, a)); } flip() { this.n = vmul(this.n, -1); this.w = -this.w; }
  split(poly, cf, cb, f, b) { let pt = 0; const types = poly.v.map(v => { const t = vdot(this.n, v) - this.w, ty = t < -CSG_EPS ? 2 : t > CSG_EPS ? 1 : 0; pt |= ty; return ty; });
    if (pt === 0) (vdot(this.n, poly.p.n) > 0 ? cf : cb).push(poly); else if (pt === 1) f.push(poly); else if (pt === 2) b.push(poly);
    else { const fv = [], bv = []; for (let i = 0; i < poly.v.length; i++) { const j = (i + 1) % poly.v.length, ti = types[i], tj = types[j], vi = poly.v[i], vj = poly.v[j]; if (ti !== 2) fv.push(vi); if (ti !== 1) bv.push(vi);
      if ((ti | tj) === 3) { const t = (this.w - vdot(this.n, vi)) / vdot(this.n, vsub(vj, vi)), v = vadd(vi, vmul(vsub(vj, vi), t)); fv.push(v); bv.push(v); } }
      if (fv.length >= 3) f.push(new CPoly(fv, poly.p)); if (bv.length >= 3) b.push(new CPoly(bv, poly.p)); } } }
class CPoly { constructor(v, p) { this.v = v; this.p = p || CPlane.from(v[0], v[1], v[2]); } flip() { this.v.reverse(); this.p = new CPlane(vmul(this.p.n, -1), -this.p.w); } }
class CNode { constructor(ps) { this.p = null; this.f = null; this.b = null; this.ps = []; if (ps) this.build(ps); }
  invert() { this.ps.forEach(p => p.flip()); if (this.p) this.p.flip(); if (this.f) this.f.invert(); if (this.b) this.b.invert(); [this.f, this.b] = [this.b, this.f]; }
  clip(ps) { if (!this.p) return ps.slice(); let f = [], b = []; for (const p of ps) this.p.split(p, f, b, f, b); if (this.f) f = this.f.clip(f); b = this.b ? this.b.clip(b) : []; return f.concat(b); }
  clipTo(bsp) { this.ps = bsp.clip(this.ps); if (this.f) this.f.clipTo(bsp); if (this.b) this.b.clipTo(bsp); }
  all() { let ps = this.ps.slice(); if (this.f) ps = ps.concat(this.f.all()); if (this.b) ps = ps.concat(this.b.all()); return ps; }
  build(ps) { if (!ps.length) return; if (!this.p) this.p = new CPlane(ps[0].p.n.slice(), ps[0].p.w); const f = [], b = []; for (const p of ps) this.p.split(p, this.ps, this.ps, f, b); if (f.length) { if (!this.f) this.f = new CNode(); this.f.build(f); } if (b.length) { if (!this.b) this.b = new CNode(); this.b.build(b); } } }
function csgPolys(list) { const out = []; for (const g of list) for (const t of triangles(asGeo(g))) { if (vlen(vcross(vsub(t[1], t[0]), vsub(t[2], t[0]))) < 1e-14) continue; out.push(new CPoly(t.map(p => p.slice()))); } return out; }
function csgOp(op, A, B) {
  const a = new CNode(csgPolys(A)), b = new CNode(csgPolys(B));
  if (op === 'union') { a.clipTo(b); b.clipTo(a); b.invert(); b.clipTo(a); b.invert(); a.build(b.all()); }
  else if (op === 'difference') { a.invert(); a.clipTo(b); b.clipTo(a); b.invert(); b.clipTo(a); b.invert(); a.build(b.all()); a.invert(); }
  else { a.invert(); b.clipTo(a); b.invert(); a.clipTo(b); b.clipTo(a); a.build(b.all()); a.invert(); }
  const v = [], f = [], m = new Map(), id = p => { const k = p.map(x => x.toFixed(7)).join(','); let i = m.get(k); if (i === undefined) { i = v.length; v.push(p); m.set(k, i); } return i; };
  for (const p of a.all()) f.push(p.v.map(id)); return { t: 'mesh', v, f };
}
/* text -> outline curves (canvas + marching squares) */
function textContours(txt, font, bold) {
  const fs = 160, c = document.createElement('canvas'), x = c.getContext('2d'), f = `${bold ? 'bold ' : ''}${fs}px ${font}`; x.font = f; const W = Math.ceil(x.measureText(txt).width) + 20, H = Math.ceil(fs * 1.35) + 20;
  if (W * H > 6e6) throw new Error('Yazı çok uzun'); c.width = W; c.height = H; x.font = f; x.fillStyle = '#000'; x.textBaseline = 'alphabetic'; x.fillText(txt, 10, 10 + fs);
  const A = x.getImageData(0, 0, W, H).data, val = (i, j) => (i < 0 || j < 0 || i >= W || j >= H) ? 0 : A[(j * W + i) * 4 + 3] / 255, segs = [];
  for (let j = -1; j < H; j++) for (let i = -1; i < W; i++) {
    const a = val(i, j), b = val(i + 1, j), cc = val(i + 1, j + 1), d = val(i, j + 1), k = (a > .5 ? 8 : 0) | (b > .5 ? 4 : 0) | (cc > .5 ? 2 : 0) | (d > .5 ? 1 : 0); if (!k || k === 15) continue;
    const ip = (p, q) => (0.5 - p) / ((q - p) || 1e-9), T = [i + ip(a, b), j, 0], R = [i + 1, j + ip(b, cc), 0], Bt = [i + ip(d, cc), j + 1, 0], L = [i, j + ip(a, d), 0];
    const S = { 1: [[L, Bt]], 2: [[Bt, R]], 3: [[L, R]], 4: [[T, R]], 5: [[L, T], [Bt, R]], 6: [[T, Bt]], 7: [[L, T]], 8: [[L, T]], 9: [[T, Bt]], 10: [[T, R], [L, Bt]], 11: [[T, R]], 12: [[L, R]], 13: [[Bt, R]], 14: [[L, Bt]] }[k];
    S.forEach(s => segs.push(s));
  }
  const cs = chain(segs, 1e-6).filter(c => c.c && c.p.length > 3).map(c => ({ ...c, p: dpSimplify(c.p, 0.35) })).filter(c => c.p.length > 2);
  return { cs, fs, base: 10 + fs };
}
function dpSimplify(p, tol) { if (p.length < 4) return p; const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1; const st = [[0, p.length - 1]];
  while (st.length) { const [a, b] = st.pop(); let mi = -1, md = tol; for (let i = a + 1; i < b; i++) { const d = vdist(p[i], closestSeg(p[i], p[a], p[b]).q); if (d > md) { md = d; mi = i; } } if (mi > 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
  return p.filter((_, i) => keep[i]); }

/* ================= data trees ================= */
const T1 = items => [{ p: [0], v: items }];
const pkey = p => p.join(';');
const flat = tree => { const a = []; for (const b of tree || []) a.push(...b.v); return a; };
const treeCount = tree => (tree || []).reduce((s, b) => s + b.v.length, 0);
function mergeTrees(trees) { const m = new Map(); for (const t of trees) for (const b of t || []) { const k = pkey(b.p); if (!m.has(k)) m.set(k, { p: b.p.slice(), v: [] }); m.get(k).v.push(...b.v); } return [...m.values()]; }

/* ================= expression ================= */
const EXF = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2, sqrt: Math.sqrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round, min: Math.min, max: Math.max, pow: Math.pow, log: Math.log, log10: Math.log10, exp: Math.exp,
  sind: x => Math.sin(x * D2R), cosd: x => Math.cos(x * D2R), tand: x => Math.tan(x * D2R), rad: x => x * D2R, deg: x => x / D2R, clamp: (x, a, b) => Math.min(b, Math.max(a, x)), lerp: (a, b, t) => a + (b - a) * t, if: (c, a, b) => c ? a : b, sign: Math.sign, mod: (a, b) => ((a % b) + b) % b };
const EXC = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 };
const exCache = new Map();
function compileExpr(src) {
  if (exCache.has(src)) return exCache.get(src);
  const toks = []; const re = /\s*(\d+\.?\d*(?:e[+-]?\d+)?|\.\d+|[A-Za-z_][A-Za-z_0-9]*|<=|>=|==|!=|&&|\|\||[-+*/^%(),<>!])/gy; let m, pos = 0;
  while (pos < src.length) { re.lastIndex = pos; m = re.exec(src); if (!m) { if (/^\s*$/.test(src.slice(pos))) break; throw new Error('İfade: anlaşılmayan karakter "' + src.slice(pos).trim()[0] + '"'); } toks.push(m[1]); pos = re.lastIndex; }
  let i = 0; const peek = () => toks[i], eat = t => { if (toks[i] !== t) throw new Error(`İfade: "${t}" bekleniyor`); i++; };
  const bin = (next, ops) => () => { let l = next(); while (ops[peek()]) { const f = ops[toks[i++]], r = next(), L = l; l = v => f(L(v), r(v)); } return l; };
  const primary = () => {
    const t = toks[i++]; if (t === undefined) throw new Error('İfade eksik');
    if (/^[\d.]/.test(t)) { const n = +t; return () => n; }
    if (t === '(') { const e = orE(); eat(')'); return e; }
    if (t === '-') { const e = unary(); return v => -e(v); }
    if (t === '!') { const e = unary(); return v => e(v) ? 0 : 1; }
    if (/^[A-Za-z_]/.test(t)) {
      if (peek() === '(') { i++; const f = EXF[t]; if (!f) throw new Error(`İfade: bilinmeyen fonksiyon "${t}"`); const args = []; if (peek() !== ')') { args.push(orE()); while (peek() === ',') { i++; args.push(orE()); } } eat(')'); return v => f(...args.map(a => a(v))); }
      if (t in EXC) { const c = EXC[t]; return () => c; }
      return v => { if (!(t in v)) throw new Error(`İfade: bilinmeyen değişken "${t}"`); return v[t]; };
    }
    throw new Error(`İfade: beklenmeyen "${t}"`);
  };
  const unary = () => { if (peek() === '-') { i++; const e = unary(); return v => -e(v); } return pow(); };
  const pow = () => { const b = primary(); if (peek() === '^') { i++; const e = unary(); return v => Math.pow(b(v), e(v)); } return b; };
  const mul = bin(unary, { '*': (a, b) => a * b, '/': (a, b) => a / b, '%': (a, b) => a % b });
  const add = bin(mul, { '+': (a, b) => a + b, '-': (a, b) => a - b });
  const cmp = bin(add, { '<': (a, b) => +(a < b), '>': (a, b) => +(a > b), '<=': (a, b) => +(a <= b), '>=': (a, b) => +(a >= b), '==': (a, b) => +(Math.abs(a - b) < 1e-12), '!=': (a, b) => +(Math.abs(a - b) >= 1e-12) });
  const andE = bin(cmp, { '&&': (a, b) => +(a && b) }), orE = bin(andE, { '||': (a, b) => +(a || b) });
  const f = orE(); if (i < toks.length) throw new Error(`İfade: fazla "${toks[i]}"`);
  if (exCache.size > 200) exCache.clear(); exCache.set(src, f); return f;
}

/* ================= graph mapper & colours ================= */
const GTYPES = { bezier: 'Bezier', linear: 'Linear', sine: 'Sine', parabola: 'Parabola', gauss: 'Gaussian', sqrt: 'Square root', square: 'Power²', step: 'Step (4)' };
function gmap(st, x) {
  x = Math.max(0, Math.min(1, x));
  switch (st.type) {
    case 'linear': return x; case 'sine': return (1 - Math.cos(2 * Math.PI * x)) / 2; case 'parabola': return 4 * x * (1 - x);
    case 'gauss': return Math.exp(-Math.pow(x - .5, 2) / (2 * .15 * .15)); case 'sqrt': return Math.sqrt(x); case 'square': return x * x; case 'step': return Math.min(3, Math.floor(x * 4)) / 3;
    default: { const [ax, ay] = st.h1, [bx, by] = st.h2; let lo = 0, hi = 1; for (let k = 0; k < 32; k++) { const t = (lo + hi) / 2, xt = 3 * (1 - t) ** 2 * t * ax + 3 * (1 - t) * t * t * bx + t ** 3; if (xt < x) lo = t; else hi = t; } const t = (lo + hi) / 2; return 3 * (1 - t) ** 2 * t * ay + 3 * (1 - t) * t * t * by + t ** 3; }
  }
}
const RAMP = ['#2c7bb6', '#00a6ca', '#00ccbc', '#90eb9d', '#ffff8c', '#f9d057', '#f29e2e', '#e76818', '#d7191c'];
function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgb2hex(r) { return '#' + r.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function ramp(t) { t = Math.max(0, Math.min(1, isFinite(t) ? t : 0)) * (RAMP.length - 1); const i = Math.min(RAMP.length - 2, Math.floor(t)), f = t - i, a = hex2rgb(RAMP[i]), b = hex2rgb(RAMP[i + 1]); return rgb2hex(a.map((v, k) => v + (b[k] - v) * f)); }
const CLASS_COL = ['#3fae5a', '#f2b632', '#d9483b'];
const TYPE_COL = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac'];
