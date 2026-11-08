/* belge ve çözücü (artımlı) */
'use strict';
/* ================= document ================= */
let doc = { nodes: [], wires: [], groups: [] }, uid = 1, sel = new Set();
const byId = id => doc.nodes.find(n => n.id === id);
function addNode(type, x, y, st, pv = true) {
  const c = C[type]; const n = { id: uid++, type, x, y, st: JSON.parse(JSON.stringify({ ...(c.st || {}), ...(st || {}) })), pv };
  doc.nodes.push(n); return n;
}
function connect(a, ao, b, bi) {
  if (a === b || reaches(b, a)) { toast('Döngü oluşturulamaz'); return false; }
  doc.wires = doc.wires.filter(w => !(w.b === b && w.bi === bi));
  doc.wires.push({ a, ao, b, bi }); return true;
}
function reaches(from, to) {
  const seen = new Set(), st = [from];
  while (st.length) { const x = st.pop(); if (x === to) return true; if (seen.has(x)) continue; seen.add(x); doc.wires.filter(w => w.a === x).forEach(w => st.push(w.b)); }
  return false;
}
function normDoc() { registerDefs(); doc.groups = doc.groups || []; doc.nodes = doc.nodes.filter(n => C[n.type]); const ids = new Set(doc.nodes.map(n => n.id)); doc.wires = doc.wires.filter(w => ids.has(w.a) && ids.has(w.b)); doc.groups.forEach(g => g.ids = g.ids.filter(i => ids.has(i))); doc.groups = doc.groups.filter(g => g.ids.length); }

/* ================= evaluation (data trees) ================= */
let cache = {}, info = {}, lastSolveMs = 0;
let PREV = { cache: {}, info: {}, sig: {}, ins: {} }, NOINC = 0;
const DEFT = new Map(), BIGK = new Set(['geo', 'px', 'data', 'hist', 'best', 'pts']);
function defTree(id, i, d) { const k = id + ':' + i; let t = DEFT.get(k); if (!t || t.d !== d) { t = { d, tree: T1([d]) }; DEFT.set(k, t); } return t.tree; }
const stSig = st => JSON.stringify(st || {}, (k, v) => BIGK.has(k) && Array.isArray(v) ? v.length + ':' + (v.length ? JSON.stringify(v[v.length - 1]).slice(0, 60) : '') : v);
const volatile = n => n.type.startsWith('cl_') || n.type === 'recorder' || n.type === 'optim';
function solve() {
  const t0 = performance.now();
  cache = {}; info = {}; const NSIG = {}, NINS = {};
  const order = [], mark = {};
  const visit = n => { if (mark[n.id]) return; mark[n.id] = 1; doc.wires.filter(w => w.b === n.id).forEach(w => { const s = byId(w.a); if (s) visit(s); }); order.push(n); };
  doc.nodes.forEach(visit);
  for (const n of order) {
    const c = C[n.type];
    if (n.off) { cache[n.id] = c.outs.map(() => []); continue; }
    try {
      const I = c.ins.map((inp, i) => {
        const w = doc.wires.find(w => w.b === n.id && w.bi === i);
        if (w) { const src = cache[w.a]; return src ? (src[w.ao] || []) : []; }
        return inp.d !== undefined ? defTree(n.id, i, inp.d) : [];
      });
      const sig = n.type + '|' + stSig(n.st), pin = PREV.ins[n.id];
      NSIG[n.id] = sig; NINS[n.id] = I;
      if (!NOINC && !volatile(n) && PREV.sig[n.id] === sig && pin && pin.length === I.length && pin.every((t, k) => t === I[k]) && PREV.cache[n.id]) { cache[n.id] = PREV.cache[n.id]; if (PREV.info[n.id]) info[n.id] = PREV.info[n.id]; continue; }
      if (c.ui === 'panel') info[n.id] = { tree: I[0] };
      let out;
      if (c.tree) {
        const miss = c.ins.findIndex((inp, i) => !inp.opt && !treeCount(I[i]));
        if (miss >= 0) { info[n.id] = { ...(info[n.id] || {}), warn: `${c.ins[miss].n} girdisi boş` }; cache[n.id] = c.outs.map(() => []); continue; }
        out = c.tree(I, n.st, n);
      } else {
        const miss = c.ins.findIndex((inp, i) => !inp.opt && !treeCount(I[i]));
        if (miss >= 0) { info[n.id] = { warn: `${c.ins[miss].n} girdisi boş` }; cache[n.id] = c.outs.map(() => []); continue; }
        const B = Math.max(1, ...I.map(t => t.length)), mi = I.findIndex(t => t.length === B);
        const maps = c.outs.map(() => new Map());
        const push = (o, p, vals) => { const k = pkey(p); let br = maps[o].get(k); if (!br) maps[o].set(k, br = { p, v: [] }); br.v.push(...vals); };
        for (let b = 0; b < B; b++) {
          const path = mi >= 0 && I[mi][b] ? I[mi][b].p : [0];
          const L = I.map(t => t.length ? t[Math.min(b, t.length - 1)].v : []);
          if (c.run) { const r = c.run(L, n.st, n); r.forEach((v, o) => { if (v && v.__br) v.__br.forEach((arr, i) => push(o, [...path, i], arr)); else push(o, path, v); }); continue; }
          const len = Math.max(1, ...c.ins.map((inp, i) => inp.list ? 1 : L[i].length));
          const rs = [];
          for (let k = 0; k < len; k++) { const args = c.ins.map((inp, i) => inp.list ? L[i] : (L[i].length ? L[i][Math.min(k, L[i].length - 1)] : undefined)); rs.push(c.item(...args, n.st)); }
          const listy = len > 1 && rs.some(r => r.some(v => Array.isArray(v)));
          rs.forEach((r, k) => r.forEach((v, o) => { if (Array.isArray(v)) push(o, listy ? [...path, k] : path, v); else push(o, path, [v]); }));
        }
        out = maps.map(m => [...m.values()]);
      }
      cache[n.id] = out;
    } catch (e) { info[n.id] = { ...(info[n.id] || {}), err: e.message }; cache[n.id] = c.outs.map(() => []); }
  }
  if (!NOINC) PREV = { cache, info, sig: NSIG, ins: NINS };
  lastSolveMs = performance.now() - t0;
}
