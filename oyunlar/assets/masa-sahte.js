/* Sahte masa sunucusu (yalnızca test: ?masasahte). Veriyi localStorage'da tutar; aynı tarayıcıdaki sekmeler 'storage' olayıyla eşleşir. */
window.__MASA_SAHTE = function () {
  const A = 'masa-sahte-db', uid = sessionStorage.getItem('masa-sahte-uid') || ('u' + Math.random().toString(36).slice(2, 9)); sessionStorage.setItem('masa-sahte-uid', uid);
  const oku = () => { try { return JSON.parse(localStorage.getItem(A) || '{}'); } catch (e) { return {}; } };
  const D = [], kop = [];
  const al = (t, p) => { let n = t; for (const k of p.split('/').filter(Boolean)) { if (n == null || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : n; };
  const temiz = v => { if (v && typeof v === 'object') { for (const k of Object.keys(v)) { v[k] = temiz(v[k]); if (v[k] === null || v[k] === undefined) delete v[k]; } if (!Object.keys(v).length) return null; } return v === undefined ? null : v; };
  const koy = (t, p, v) => { const K = p.split('/').filter(Boolean); let n = t; for (let i = 0; i < K.length - 1; i++) { if (!n[K[i]] || typeof n[K[i]] !== 'object') n[K[i]] = {}; n = n[K[i]]; } if (v === null || v === undefined) delete n[K[K.length - 1]]; else n[K[K.length - 1]] = v; };
  const yaz = t => { const s = JSON.stringify(temiz(t) || {}); localStorage.setItem(A, s); duyur(); };
  const duyur = () => { const t = oku(); D.forEach(d => { const v = al(t, d.p), s = JSON.stringify(v); if (s !== d.son) { d.son = s; d.cb(v == null ? null : JSON.parse(s)); } }); };
  addEventListener('storage', e => { if (e.key === A) duyur(); });
  addEventListener('pagehide', () => { const t = oku(); kop.forEach(([p, v]) => { if (v === null) koy(t, p, null); else { const c = al(t, p); if (c) koy(t, p, Object.assign({}, c, v)); } }); localStorage.setItem(A, JSON.stringify(temiz(t) || {})); });
  const P = v => Promise.resolve(v);
  return { uid, sahte: true,
    get: p => P(al(oku(), p)),
    set: (p, v) => { const t = oku(); koy(t, p, JSON.parse(JSON.stringify(v))); yaz(t); return P(); },
    update: (p, v) => { const t = oku(), c = al(t, p) || {}; koy(t, p, Object.assign({}, c, JSON.parse(JSON.stringify(v)))); yaz(t); return P(); },
    remove: p => { const t = oku(); koy(t, p, null); yaz(t); return P(); },
    tx: (p, f) => { const t = oku(), c = al(t, p), y = f(c == null ? null : JSON.parse(JSON.stringify(c))); if (y === undefined) return P({ ok: false, val: c }); koy(t, p, y); yaz(t); return P({ ok: true, val: y }); },
    on: (p, cb) => { const d = { p, cb, son: undefined }; D.push(d); setTimeout(() => { const v = al(oku(), p); d.son = JSON.stringify(v); cb(v); }, 0); return () => { const i = D.indexOf(d); if (i >= 0) D.splice(i, 1); }; },
    kopunca: (p, v) => { kop.push([p, v]); return P(); }, kopuncaIptal: p => { for (let i = kop.length - 1; i >= 0; i--) if (kop[i][0] === p) kop.splice(i, 1); return P(); },
    acik: p => P(al(oku(), p) || {}), ilk: p => P(al(oku(), p) || {}), now: () => Date.now() };
};
