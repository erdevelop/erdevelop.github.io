// Realtime Database kurallarının küçük bir benzetimi (gerçek sunucu değil; kural mantığındaki hataları yakalamak için): çok yollu güncelleme, .write (yukarıdan aşağı izin) ve .validate (yol üstü + alt düğümler)
let KUR = {};
export function kurallar(k) { KUR = k; }
const al = (t, p) => { let n = t; for (const k of p) { if (n == null || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : n; };
const koy = (t, p, v) => { if (!p.length) return v; const k = p[0]; const c = t && typeof t === 'object' ? { ...t } : {}; const a = koy(c[k], p.slice(1), v); if (a == null || (typeof a === 'object' && !Object.keys(a).length)) delete c[k]; else c[k] = a; return Object.keys(c).length ? c : null; };
class S { constructor(t, p) { this.t = t; this.p = p; } val() { return al(this.t, this.p); } exists() { return this.val() != null; } child(x) { return new S(this.t, this.p.concat(String(x).split('/').filter(Boolean))); } parent() { return new S(this.t, this.p.slice(0, -1)); } isNumber() { return typeof this.val() === 'number'; } isString() { return typeof this.val() === 'string'; } isBoolean() { return typeof this.val() === 'boolean'; } hasChildren(L) { const v = this.val(); return v != null && typeof v === 'object' && (L ? L.every(k => v[k] != null) : Object.keys(v).length > 0); } hasChild(k) { return this.child(k).exists(); } }
function deg(ifade, o) { if (ifade === true || ifade === false) return ifade; const ad = Object.keys(o); try { const r = new Function(...ad, '"use strict"; return (' + ifade + ');')(...ad.map(k => o[k])); if (typeof r !== 'boolean') throw new Error('boolean değil: ' + r); return r; } catch (e) { return false; } }
export function yaz(eski, guncelleme, auth, now = Date.now()) {
  let yeni = eski; for (const [y, v] of Object.entries(guncelleme)) yeni = koy(yeni, y.split('/').filter(Boolean), v) || {};
  for (const y of Object.keys(guncelleme)) {
    const p = y.split('/').filter(Boolean); let k = KUR, izin = false; const vars = {}, zincir = [];
    for (let i = 0; i <= p.length; i++) {
      const yol = p.slice(0, i), o = { data: new S(eski, yol), newData: new S(yeni, yol), root: new S(eski, []), auth, now, ...vars };
      if (k && k['.write'] != null && deg(k['.write'], o)) izin = true;
      zincir.push([k, o, yol]);
      if (i === p.length) break;
      const s = p[i]; if (k && k[s] && !s.startsWith('.')) k = k[s]; else { const w = k && Object.keys(k).find(x => x.startsWith('$')); if (w) { vars[w] = s; k = k[w]; } else k = null; }
    }
    if (!izin) return 'RED yazma izni yok: ' + y;
    for (const [kk, o, yol] of zincir) if (kk && kk['.validate'] != null && o.newData.exists() && !deg(kk['.validate'], o)) return 'RED doğrulama: /' + yol.join('/');
    const [kk, o, yol] = zincir[zincir.length - 1];
    const alt = (k2, yol2, vars2) => { const v = al(yeni, yol2); if (v == null || typeof v !== 'object') return null; for (const c of Object.keys(v)) { let kc = null, v3 = vars2; if (k2 && k2[c]) kc = k2[c]; else { const w = k2 && Object.keys(k2).find(x => x.startsWith('$')); if (w) { kc = k2[w]; v3 = { ...vars2, [w]: c }; } } const y3 = yol2.concat(c), o3 = { data: new S(eski, y3), newData: new S(yeni, y3), root: new S(eski, []), auth, now, ...v3 }; if (kc && kc['.validate'] != null && !deg(kc['.validate'], o3)) return 'RED doğrulama: /' + y3.join('/'); const r = alt(kc, y3, v3); if (r) return r; } return null; };
    const { data, newData, root, auth: a2, now: n2, ...v0 } = o; const r = alt(kk, yol, v0); if (r) return r;
  }
  return { ok: true, yeni };
}
